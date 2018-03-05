const assert = require('assert')
const { parseCommand } = require('../commands')

describe('commands', () => {
    it('should parse "config-set-kick-after"', () => {
        const raws = [{
            message: 'config set kick after 10 attempts',
            command: 'config-set-kick-after',
            argument: 10
        }]
        raws.forEach(raw => {
            const parsed = parseCommand(raw.message)
            assert.strictEqual(parsed.command, raw.command)
            assert.strictEqual(parsed.argument, raw.argument)
        })
    })
    it('should parse "config-set-ban-after"', () => {
        const raws = [{
            message: 'config set ban after 10 attempts',
            command: 'config-set-ban-after',
            argument: 10
        }]
        raws.forEach(raw => {
            const parsed = parseCommand(raw.message)
            assert.strictEqual(parsed.command, raw.command)
            assert.strictEqual(parsed.argument, raw.argument)
        })
    })
    it('should parse "config-get"', () => {
        const raws = [{
            message: 'config get settings',
            command: 'config-get'
        }]
        raws.forEach(raw => {
            const parsed = parseCommand(raw.message)
            assert.strictEqual(parsed.command, raw.command)
        })
    })
})
