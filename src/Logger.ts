import { createLogger as createWinstonLogger, format, Logger as WinstonLogger, transports } from 'winston';
const { configs } = require('./Config');

export class Logger {
    winstonLogger: WinstonLogger;

    constructor() {
        this.winstonLogger = createWinstonLogger({
            level: configs.log.level,
            format: format.combine(
              format.timestamp(),
              format.errors({ stack: true }),
              format[configs.log.format](),
            ),
            transports: [
                new transports.Console({ level: configs.log.level }),
            ],
        });
    }

    silly(message: string, meta: any = {}): void {
        this.winstonLogger.silly(message, meta);
    }

    debug(message: string, meta: any = {}): void {
        this.winstonLogger.debug(message, meta);
    }

    info(message: string, meta: any = {}): void {
        this.winstonLogger.info(message, meta);
    }

    warn(message: string, meta: any = {}): void {
        this.winstonLogger.warn(message, meta);
    }

    error(message: string = '', meta: any = {}): void {
        this.winstonLogger.error(message, meta);
    }

    exception(error: Error, message: string = '', meta: any = {}): void {
        this.winstonLogger.error(message || error.message, { ...meta, error });
    }
}
