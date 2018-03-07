const moment = require('moment')
const winston = require('winston')
const defaults = require('./defaults')
const Telegraf = require('telegraf')
const RedisSession = require('telegraf-session-redis')
const { parseCommand } = require('./commands')
const { containsEmail, containsEthAddress, containsGif, containsImage,
    containsSticker, containsUrl
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
    }
})

if (process.env.NODE_ENV !== 'production') {
    winston.level = 'debug'
}

bot.use(session.middleware())

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
    `)
})

const tellAdmins = (ctx, message) => {
    winston.debug('[tellAdmins]', message)
    ctx.getChatAdministrators().then(admins => {
        admins.filter(admin => admin.user.is_bot === false).forEach(admin => {
            ctx.telegram.sendMessage(admin.user.id, message)
        })
    })
}

bot.on('message', ctx => {
    winston.debug('[incoming message]', ctx.from.username, '>', ctx.message.text)
    winston.debug('[incoming message]', '>>>>>>>>>>>>>>>>>>>>', ctx.message)
    if (typeof ctx.message.text !== 'undefined' && ctx.message.text.indexOf('/config') === 0) {
        winston.debug('[config] command captured')
        return ctx.getChatAdministrators().then(admins => {
            if (admins.map(admin => admin.user.id).indexOf(ctx.from.id) === -1) {
                winston.warn('regular user wants to config the bot')
                return tellAdmins(ctx, `User ${ctx.from.username} (id ${ctx.from.id}), which is not an admin, just attempted to handle the configuration of the bot. Here's the full text:\n"${ctx.message.text}"`)
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
            if (command.command === 'config-set-kick-after') {
                ctx.session.configBeforeKicked = command.argument
                winston.debug(`[config] ${ctx.from.username} is setting configBeforeKicked to ${command.argument} in group ${ctx.chat.title}`)
                tellAdmins(ctx, `Configuration for ${ctx.chat.title} has changed: users will be kicked after ${command.argument} violations.`)
            } else if (command.command === 'config-set-ban-after') {
                winston.debug(`[config] ${ctx.from.username} is setting configBeforeBanned to ${command.argument} in group ${ctx.chat.title}`)
                ctx.session.configBeforeBanned = command.argument
                tellAdmins(ctx, `Configuration for ${ctx.chat.title} has changed: users will be banned after ${command.argument} violations.`)
            } else if (command.command === 'config-get') {
                ctx.telegram.sendMessage(ctx.from.id,
`Here's the current configuration for group "${ctx.chat.title}":
- Kick after ${ctx.session.configBeforeKicked} violations
- Ban after ${ctx.session.configBeforeBanned} violations
- Kick users for ${ctx.session.configKickForMinutes} minutes.

Type /start to get information about how to change these settings.`)
            } else {
                winston.warn('unknown command, message was', ctx.message.text)
            }
        }).catch(err => {
            winston.error(err)
        })
    } else if (typeof ctx.message.text !== 'undefined' && ctx.message.text.indexOf('/mute') === 0) {
        winston.debug(`[mute command] ${ctx.from.username} is setting the group ${ctx.chat.title} to mute`)
        return ctx.getChatAdministrators().then(admins => {
            if (admins.map(admin => admin.user.id).indexOf(ctx.from.id) === 1) {
                winston.warn('regular user wants to mute the group')
                return tellAdmins(ctx, `User ${ctx.from.username} (id ${ctx.from.id}), which is not an admin, just attempted to mute the group ${ctx.chat.title}`)
            }
            winston.debug(`[mute command] ${ctx.from.username} just setted the group ${ctx.chat.title} to mute`)
            tellAdmins(ctx, `${ctx.from.username} just muted the group ${ctx.chat.title}`)
            ctx.session.muted = true
        })
    } else if (typeof ctx.message.text !== 'undefined' && ctx.message.text.indexOf('/unmute') === 0) {
        winston.debug(`[unmute command] ${ctx.from.username} is setting the group ${ctx.chat.title} to unmute`)
        return ctx.getChatAdministrators().then(admins => {
            if (admins.map(admin => admin.user.id).indexOf(ctx.from.id) === 1) {
                winston.warn('regular user wants to unmute the group')
                return tellAdmins(ctx, `User ${ctx.from.username} (id ${ctx.from.id}), which is not an admin, just attempted to unmute the group ${ctx.chat.title}`)
            }
            winston.debug(`[unmute command] ${ctx.from.username} just setted the group ${ctx.chat.title} to unmute`)
            tellAdmins(ctx, `${ctx.from.username} just unmuted ${ctx.chat.title}`)
            ctx.session.muted = false
        })
    }
    if (ctx.session.muted === true) {
        winston.debug('[session.muted] session is muted')
        return ctx.getChatAdministrators().then(admins => {
            if (admins.map(admin => admin.user.id).indexOf(ctx.from.id) !== -1) {
                // Mods are allowed to chat
                winston.debug('[session.muted] admins are allowed to talk')
                return
            }
            winston.debug('[session.muted] about to delete message', ctx.message.text)
            ctx.deleteMessage(ctx.message.id).then(() => {
                winston.info('group muted, message deleted', ctx.message.text)
            }).catch(err => {
                tellAdmins(ctx, `I tried to delete a message from the group ${ctx.chat.title}, but the operation failed with this error: ${err}`)
                winston.error('unable to delete message from muted group')
            })
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
    } else {
        // No violation detected
        winston.debug(`[violations] no violations found for message: ${ctx.message.text}`)
        return
    }
    winston.debug(`[violations] found "${violation}" violation for: ${ctx.message.text}`)
    ctx.getChatAdministrators().then(admins => {
        if (admins.map(admin => admin.user.id).indexOf(ctx.from.id) !== -1) {
            return winston.debug('admins can post anything they want')
        }
        // Delete message...
        ctx.deleteMessage(ctx.message.message_id).then(() => {
            winston.debug('[violations] deleting the message')
            winston.info('deleted offending message')
            ctx.reply(`Sorry @${ctx.from.username}, posting ${violation} is not allowed here, your message has been deleted.`)
        }).catch(err => {
            tellAdmins(ctx, `I tried to delete the following message from ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title}:\n"${ctx.message.text}"\nbecause it violated the "no ${violation}" rule, but I was not able to do it. Reason:\n${err}`)
            winston.error(err)
        })
        // ...Meanwhile check if they should be kicked or banned
        if (typeof ctx.session.violations === 'undefined') {
            ctx.session.violations = {}
            ctx.session.violations[ctx.from.id] = 0
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
            ctx.kickChatMember(ctx.from.id, moment.now().unix()).then().catch(err => {
                tellAdmins(ctx, `I tried to ban ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title} because they posted ${violation} more than ${ctx.session.configBeforeBanned} times, but I was not able to do it because:\n${err}`)
                winston.error(err)
            })
        } else if (ctx.session.violations[ctx.from.id] > ctx.session.configBeforeKicked) {
            // They should be kicked
            winston.debug(`[violations] kicking user ${ctx.from.username} (${ctx.from.id})`)
            ctx.kickChatMember(ctx.from.id,
                    moment.now().add(ctx.session.configKickForMinutes, 'minutes').unix()
            ).then().catch(err => {
                tellAdmins(ctx, `I tried to kick ${ctx.from.username} (id: ${ctx.from.id}) from ${ctx.chat.title} for ${ctx.session.configKickForMinutes} minutes because they posted ${violation} more than ${ctx.session.configBeforeKicked} times, but I was not able to do it because:\n${err}`)
                winston.error(err)
            })
        }
    }).catch(err => {
        winston.error(err)
    })
})

bot.startPolling()
