// Triggerers
module.exports.containsEthAddress = (message) => {
    return /0x[a-fA-F0-9]{40}/i.test(message.text)
}

module.exports.containsImage = (message) => {
    return typeof message.photo !== 'undefined'
}

module.exports.containsUrl = (message) => {
    if (typeof message.entities === 'undefined') {
        return false
    }
    return typeof message.entities.find(e => e.type === 'url') !== 'undefined'
}

module.exports.containsEmail = (message) => {
    if (typeof message.entities === 'undefined') {
        return false
    }
    return typeof message.entities.find(e => e.type === 'email') !== 'undefined'
}

module.exports.containsSticker = (message) => {
    return typeof message.sticker !== 'undefined'
}

module.exports.containsGif = (message) => {
    const mimes = [
        'video/mp4', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'
    ]
    if (typeof message.document === 'undefined') {
        return false
    }
    return mimes.indexOf(message.document.mime_type) !== -1
}
