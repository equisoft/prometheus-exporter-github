const winston = require('winston');
const config = require('./config');

module.exports = winston.createLogger({
    level: config.log.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format[config.log.format]()
    ),
    transports: [
        new winston.transports.Console({ level: config.log.level }),
    ],
});
