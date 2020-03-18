module.exports = {
    organisation: process.env.GITHUB_ORGANISATION,
    github: {
        token: process.env.GITHUB_TOKEN || 'MISSING',
    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
        format: process.env.LOG_FORMAT || 'json',
    },
    http: {
        port: process.env.HTTP_PORT || 8080,
    },
};
