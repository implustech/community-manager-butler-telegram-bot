module.exports = {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    TELEGRAM_TOKEN: null,
    SESSION: {
        violations: {},
        configBeforeBanned: 5,
        configBeforeKicked: 2,
        configKickForMinutes: 60,
        whitelistedURLs: []
    }
}
