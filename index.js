const moment = require('moment')
const winston = require('winston')
const defaults = require('./defaults')
const Telegraf = require('telegraf')
const RedisSession = require('telegraf-session-redis')
const { parseCommand } = require('./commands')
const { containsEmail, containsEthAddress, containsGif, containsImage,
    containsSticker, containsUrl, containsForwardedMessage
} = require('./detection')

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || defaults.TELEGRAM_TOKEN
const REDIS_HOST = process.env.REDIS_HOST || defaults.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT || defaults.REDIS_PORT
const bot = new Telegraf(TELEGRAM_TOKEN)

const session = new RedisSession({
    store: {
        host: REDIS_HOST,
        port: REDIS_PORT
    },
    session: {
        default: 'maybe'
    },
    getSessionKey: ctx => ctx.chat && ctx.chat.id
})

if (process.env.NODE_ENV !== 'production') {
    winston.level = 'debug'
}

bot.use(session.middleware())

// Update admins and info every 30 minutes
bot.use((ctx, next) => {
    if (ctx.chat.type === 'private') {
        return next()
    }
    const elapsed = moment
        .duration(moment().diff(ctx.session.lastUpdate)).asMinutes()

    if (typeof ctx.session.lastUpdate === 'undefined' || elapsed > 30) {
        // Fetch again
        ctx.session.name = ctx.chat.title
        ctx.session.id = ctx.chat.id
        ctx.session.banned = ctx.session.banned || []
        return ctx.getChatAdministrators().then(admins => {
            ctx.session.admins = admins
                .filter(admin => admin.user.is_bot === false)
                .map(admin => admin.user.id)

            ctx.session.lastUpdate = moment()
            return next(ctx)
        }).catch(err => {
            winston.error(err.message || err)
            return next(ctx)
        })
    }
    return next(ctx)
})

bot.start(ctx => {
    if (ctx.message.chat.type !== 'private') {
        return
    }
    ctx.replyWithMarkdown(`Hi ${ctx.message.chat.first_name || ctx.message.chat.username}!
Here's the list of all available commands. Remember that these commands are only available for groups.

1. Get the current configuration for the group:
\`\`\`
/config get
\`\`\`
2. Set the number of violations allowed for an user before kicking them out of the group.
For example, you want to set this number to 3:
\`\`\`
/config set kick after 3
\`\`\`
3. Set the number of violations allowed for an user before banning them forever from joining the group.
For example, you want to set this number to 5:
\`\`\`
/config set ban after 5
\`\`\`
4. Mute the group. Only admins will be allowed to talk
\`\`\`
/mute
\`\`\`
5. Unmute the group. Allow everyone to talk
\`\`\`
/unmute
\`\`\`

*Unbanning users*

It is possible to unban users previously banned by the bot. The following two
commands are only available in this private chat.

1. Get the list of banned users in the groups you are an administrator.

\`\`\`
/listBanned
\`\`\`

2. Unban users. Usage

\`\`\`
/unban __user__ from __group__
\`\`\`

For example:

\`\`\`
/unban j.doe85 from Blockchain Tips And Tricks
\`\`\`

    `)
})

const tellAdmins = (ctx, message) => {
    if (typeof ctx.getChatAdministrators !== 'function') {
        return winston.error('tellAdmins() called from the context of a non group')
    }
    ctx.getChatAdministrators().then(admins => {
        admins.filter(admin => admin.user.is_bot === false).forEach(admin => {
            try {
                ctx.telegram.sendMessage(admin.user.id, message)
            } catch (ex) {
                winston.warn('unable to send message to admin')
            }
        })
    })
}

const isAdmin = ctx => {
    return (ctx.session.admins || []).indexOf(ctx.from.id) !== -1
}

const getAdminInfo = ctx => {
    return new Promise((resolve, reject) => {
        session.client.keys('*', (err, keys) => {
            if (err) {
                return reject(err.message || err)
            }
            Promise.all(keys.map(key => {
                return new Promise((resolve, reject) => {
                    session.client.get(key, (err, value) => {
                        if (err) {
                            return reject(err.message || err)
                        }
                        try {
                            const json = JSON.parse(value)
                            resolve(json)
                        } catch (ex) {
                            resolve({})
                        }
                    })
                })
            })).then(values => {
                const map = values.filter(s => {
                    if (typeof s.admins === 'undefined' || !s.admins.length) {
                        return false
                    }
                    if (s.admins.indexOf(ctx.from.id) === -1) {
                        return false
                    }
                    return true
                }).map(s => {
                    return {
                        name: s.name,
                        id: s.id,
                        banned: s.banned || []
                    }
                })
                resolve(map)
            })
        })
    })
}

bot.command('config', ctx => {
    if (!isAdmin(ctx)) {
        ctx.deleteMessage(ctx.message.id).then(() => {
            winston.debug(`message containing a command was deleted. raw: ${JSON.stringify(ctx.message)}`)
        }).catch(err => {
            winston.error(err.message || err)
        })
        return tellAdmins(`User ${ctx.from.username} (id ${ctx.from.id}), which is not an admin, just attempted to handle the configuration of the bot. Here's the full text:\n"${ctx.message.text}"`)
    }
    if (ctx.chat.type === 'private') {
        return
    }
    winston.debug('[config] command is called from an admin')
    if (typeof ctx.session.configBeforeBanned === 'undefined') {
        ctx.session.configBeforeBanned = defaults.SESSION.configBeforeBanned
    }
    if (typeof ctx.session.configBeforeKicked === 'undefined') {
        ctx.session.configBeforeKicked = defaults.SESSION.configBeforeKicked
    }
    if (typeof ctx.session.configKickForMinutes === 'undefined') {
        ctx.session.configKickForMinutes = defaults.SESSION.configKickForMinutes
    }
    const command = parseCommand(ctx.message.text)
    winston.debug('[config] command is', command)
    if (command && command.command === 'config-set-kick-after') {
        ctx.session.configBeforeKicked = command.argument
        winston.debug(`[config] ${ctx.from.username} is setting configBeforeKicked to ${command.argument} in group ${ctx.chat.title}`)
        tellAdmins(ctx, `Configuration for ${ctx.chat.title} has changed: users will be kicked after ${command.argument} violations.`)
    } else if (command && command.command === 'config-set-ban-after') {
        winston.debug(`[config] ${ctx.from.username} is setting configBeforeBanned to ${command.argument} in group ${ctx.chat.title}`)
        ctx.session.configBeforeBanned = command.argument
        tellAdmins(ctx, `Configuration for ${ctx.chat.title} has changed: users will be banned after ${command.argument} violations.`)
    } else if (command && command.command === 'config-get') {
        ctx.telegram.sendMessage(ctx.from.id,
`Here's the current configuration for group "${ctx.chat.title}":
- Kick after ${ctx.session.configBeforeKicked} violations
- Ban after ${ctx.session.configBeforeBanned} violations
- Kick users for ${ctx.session.configKickForMinutes} minutes.

Type /start to get information about how to change these settings.`)
    } else {
        winston.warn('unknown command, message was', ctx.message.text)
    }
})

bot.command('unban', ctx => {
    if (ctx.chat.type !== 'private') {
        ctx.telegram.sendMessage(ctx.from.id, 'The /unban command must be run in our private conversation. Please run the command here again.')
        return
    }
    // Parse command
    let user, group
    let parts = ctx.message.text.split(/\/unban|from/gi).map(w => w.trim().toLowerCase()).filter(w => w.length)
    winston.debug('/unban, parts detected:', parts)
    if (parts.length < 2) {
        winston.warn('unable to understand this message:', ctx.message.text)
        return ctx.reply('Sorry, I could not understand your message.')
    }
    user = parts[0]
    group = parts[1]
    // Find the user in the group
    getAdminInfo(ctx).then(info => {
        // Group exists?
        const groupFound = info.find(g => {
            return g.name.toLowerCase().trim() === group
        })
        if (typeof groupFound === 'undefined') {
            return ctx.reply('I could not find the group ' + group)
        }
        const userFound = groupFound.banned.find(u => {
            return u.username.toLowerCase().trim() === user
        })
        if (typeof userFound === 'undefined') {
            return ctx.reply('I could not find the user ' + user)
        }
        ctx.telegram.unbanChatMember(groupFound.id, userFound.id).then(() => {
            winston.debug('unbanning ' + user)
            ctx.reply('@' + user + ' should be unbanned now.')
        }).catch(err => {
            winston.error(err.message || err)
            ctx.reply(`There has been an error: ${err.message || err}`)
        })
    }).catch(err => {
        return ctx.reply(`Sorry, there has been an error: ${err}`)
    })
})

bot.command('debug', ctx => {
    ctx.session.banned = ctx.session.banned || []
    ctx.session.banned.push({
        id: 1,
        username: 'andrea'
    })
    ctx.reply(`banned users are: ${ctx.session.banned.map(u => u.username)}`)
})

bot.command('listBanned', ctx => {
    if (ctx.chat.type !== 'private') {
        ctx.telegram.sendMessage(ctx.from.id, 'The /listBanned command must be run in our private conversation. Please run the command here again.')
        return
    }
    getAdminInfo(ctx).then(info => {
        if (info.filter(g => g.banned).length === 0) {
            return ctx.reply('At the moment there is no user banned by me.')
        }
        ctx.replyWithMarkdown(`This is the list of currently banned users per group:
${info.filter(g => g.banned.length > 0).map(group => {
    return `*${group.name}*:
    ${group.banned.map(u => {
        return `${u.username}`
    }).join('\n')}

To unban a specific user run the following command:
\`\`\`
/unban __username__ from __groupname__
\`\`\`
For example:
\`\`\`
/unban j.doe85 from Blockchain Tips And Tricks
\`\`\`

`
}).join('\n')}
`)
    })
})

bot.command('mute', ctx => {
    if (!isAdmin(ctx)) {
        ctx.deleteMessage(ctx.message.id).then(() => {
            winston.debug(`message containing a command was deleted. raw: ${JSON.stringify(ctx.message)}`)
        }).catch(err => {
            winston.error(err.message || err)
        })
        return tellAdmins(ctx, `${ctx.from.username}, which is not an administrator, attempted to mute ${ctx.chat.title}`)
    }
    winston.debug('/mute called')
    if (ctx.session.muted === false) {
        tellAdmins(ctx, `${ctx.from.username} just muted ${ctx.chat.title}`)
    }
    ctx.session.muted = true
})

bot.command('unmute', ctx => {
    if (!isAdmin(ctx)) {
        ctx.deleteMessage(ctx.message.id).then(() => {
            winston.debug(`message containing a command was deleted. raw: ${JSON.stringify(ctx.message)}`)
        }).catch(err => {
            winston.error(err.message || err)
        })
        return tellAdmins(ctx, `${ctx.from.username}, which is not an administrator, attempted to unmute ${ctx.chat.title}`)
    }
    winston.debug('/unmute called')
    if (ctx.session.muted === false) {
        tellAdmins(ctx, `${ctx.from.username} just unmuted ${ctx.chat.title}`)
    }
    ctx.session.muted = false
})

bot.on('message', ctx => {

    winston.debug(`[incoming.message] -------
    User: ${ctx.from.username || ctx.from.first_name}
    Chat: ${ctx.chat.title}
    Text: ${ctx.message.text}
    Muted: ${ctx.session.muted}
    Raw: ${JSON.stringify(ctx.message)}
    ---------------------------------
    `)
    if (isAdmin(ctx)) {
        // Admins can always talk
        return
    }
    if (ctx.session.muted) {
        return ctx.deleteMessage(ctx.message.id).then(() => {
            winston.debug('message was deleted')
        }).catch(err => {
            winston.error(err.message || err)
        })
    }
    let violation
    if (containsEthAddress(ctx.message)) {
        violation = 'ETH addresses'
    } else if (containsImage(ctx.message)) {
        violation = 'images'
    } else if (containsUrl(ctx.message)) {
        violation = 'urls'
    } else if (containsSticker(ctx.message)) {
        violation = 'stickers'
    } else if (containsEmail(ctx.message)) {
        violation = 'email addresses'
    } else if (containsGif(ctx.message)) {
        violation = 'GIFs'
    } else if (containsForwardedMessage(ctx.message)) {
        violation = 'forwarded messages'
    } else {
        // No violation detected
        winston.debug(`[violations] no violations found for message: ${ctx.message.text || JSON.stringify(ctx.message)}`)
        return
    }
    winston.debug('[violations] deleting the message')
    ctx.deleteMessage(ctx.message.message_id).then(result => {
        winston.info('deleted offending message, result:', result)
        ctx.reply(`Sorry @${ctx.from.username || ctx.from.first_name}, posting ${violation} is not allowed here, your message has been deleted.`)
    }).catch(err => {
        tellAdmins(ctx, `I tried to delete the following message from ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title}:\n"${ctx.message.text}"\nbecause it violated the "no ${violation}" rule, but I was not able to do it. Reason:\n${err}`)
        winston.error(err)
    })
    // ...Meanwhile check if they should be kicked or banned
    if (typeof ctx.session.violations === 'undefined') {
        ctx.session.violations = {}
        ctx.session.violations[ctx.from.id] = 0
    } else if (typeof ctx.session.violations[ctx.from.id] === 'undefined') {
        ctx.session.violations[ctx.from.id] =  0
    }
    if (typeof ctx.session.configBeforeBanned === 'undefined') {
        ctx.session.configBeforeBanned = defaults.SESSION.configBeforeBanned
    }
    if (typeof ctx.session.configBeforeKicked === 'undefined') {
        ctx.session.configBeforeKicked = defaults.SESSION.configBeforeKicked
    }
    if (typeof ctx.session.configKickForMinutes === 'undefined') {
        ctx.session.configKickForMinutes = defaults.SESSION.configKickForMinutes
    }
    // Count violations
    ctx.session.violations[ctx.from.id]++
    winston.debug(`[violations] user ${ctx.from.username} (${ctx.from.id}) has done ${ctx.session.violations[ctx.from.id]} violations in ${ctx.chat.title}`)
    if (ctx.session.violations[ctx.from.id] > ctx.session.configBeforeBanned) {
        // They should be banned
        winston.debug(`[violations] banning user ${ctx.from.username} (${ctx.from.id})`)
        const forever = moment().add(2, 'year').unix()
        ctx.kickChatMember(ctx.from.id, forever).then(() => {
            ctx.session.banned = ctx.session.banned || []
            ctx.session.banned.push(ctx.from)
        }).catch(err => {
            tellAdmins(ctx, `I tried to ban ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title} because they posted ${violation} more than ${ctx.session.configBeforeBanned} times, but I was not able to do it because:\n${err}`)
            winston.error(err)
        })
    } else if (ctx.session.violations[ctx.from.id] > ctx.session.configBeforeKicked) {
        // They should be kicked
        winston.debug(`[violations] kicking user ${ctx.from.username} (${ctx.from.id})`)
        ctx.kickChatMember(ctx.from.id,
                moment().add(ctx.session.configKickForMinutes, 'minutes').unix()
        ).then().catch(err => {
            tellAdmins(ctx, `I tried to kick ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title} for ${ctx.session.configKickForMinutes} minutes because they posted ${violation} more than ${ctx.session.configBeforeKicked} times, but I was not able to do it because:\n${err}`)
            winston.error(err)
        })
    }
})

bot.startPolling()
