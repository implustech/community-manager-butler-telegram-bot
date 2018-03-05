module.exports.parseCommand = (message) => {
    if (/config.*set.*kick.*after.*[0-9]/i.test(message)) {
        return {
            command: 'config-set-kick-after',
            argument: parseInt(message.match(/([0-9]+)/)[0])
        }
    } else if (/config.*set.*ban.*after.*[0-9]/i.test(message)) {
        return {
            command: 'config-set-ban-after',
            argument: parseInt(message.match(/([0-9]+)/)[0])
        }
    } else if (/.*debug.*/.test(message)) {
        return {
            command: 'debug'
        }
    } else if (/config.*get.*/.test(message)) {
        return {
            command: 'config-get'
        }
    }
    return null
}
