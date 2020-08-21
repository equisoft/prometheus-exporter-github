import { createLogger as createWinstonLogger, format, Logger as WinstonLogger, transports } from 'winston';
import { LogsConfigs } from './Config';

export class Logger {
    private readonly winstonLogger: WinstonLogger;

    constructor(logconfig: LogsConfigs) {
        this.winstonLogger = createWinstonLogger({
            level: logconfig.level,
            format: format.combine(
                format.timestamp(),
                format.errors({ stack: true }),
                format[logconfig.format](),
            ),
            transports: [
                new transports.Console({ level: logconfig.level }),
            ],
        });
    }

    silly(message: string, ...meta: any[]): void {
        this.winstonLogger.silly(message, ...meta);
    }

    debug(message: string, ...meta: any[]): void {
        this.winstonLogger.debug(message, ...meta);
    }

    info(message: string, ...meta: any[]): void {
        this.winstonLogger.info(message, ...meta);
    }

    warn(message: string, ...meta: any[]): void {
        this.winstonLogger.warn(message, ...meta);
    }

    error(message: string = '', ...meta: any[]): void {
        this.winstonLogger.error(message, ...meta);
    }

    exception(error: Error, message: string = '', ...meta: any[]): void {
        this.winstonLogger.error(message || error.message, { ...meta, error });
    }
}
