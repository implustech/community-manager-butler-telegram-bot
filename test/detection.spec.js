const assert = require('assert')
const { containsEmail, containsEthAddress, containsGif, containsImage,
    containsSticker, containsUrl } = require('../detection')

const data = require('./test-data').messages

describe('functions', () => {
    it('should check if message contains an eth address', () => {
        data.ethAddresses.good.forEach(message => {
            assert.equal(containsEthAddress(message), false)
        })
        data.ethAddresses.bad.forEach(message => {
            assert.equal(containsEthAddress(message), true)
        })
    })
    it('should check if message contains an image', () => {
        data.images.good.forEach(message => {
            assert.equal(containsImage(message), false)
        })
        data.images.bad.forEach(message => {
            assert.equal(containsImage(message), true)
        })
    })
    it('should check if message contains an URL', () => {
        data.urls.good.forEach(message => {
            assert.equal(containsUrl(message), false)
        })
        data.urls.bad.forEach(message => {
            assert.equal(containsUrl(message), true)
        })
    })
    it('should check if message contains an email address', () => {
        data.emails.good.forEach(message => {
            assert.equal(containsEmail(message), false)
        })
        data.emails.bad.forEach(message => {
            assert.equal(containsEmail(message), true)
        })
    })
    it('should check if message contains a sticker', () => {
        data.stickers.good.forEach(message => {
            assert.equal(containsSticker(message), false)
        })
        data.stickers.bad.forEach(message => {
            assert.equal(containsSticker(message), true)
        })
    })
    it('should check if message contains a GIF', () => {
        data.gifs.good.forEach(message => {
            assert.equal(containsGif(message), false)
        })
        data.gifs.bad.forEach(message => {
            assert.equal(containsGif(message), true)
        })
    })
})
