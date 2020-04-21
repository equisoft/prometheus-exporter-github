import * as httpStatus from 'http-status';
import { ErrorRequestHandler } from 'express';
import { Logger } from './Logger';

interface ErrorResponseBody {
    error: string;
    error_description?: string;
    error_uri?: string;
}
export type RequestError = any;


export function ErrorHandler(logger: Logger): ErrorRequestHandler {

    return (err: RequestError, req, res, next) => {
        if (err) {
            const responseBody: ErrorResponseBody = {
                error: 'server_error',
            };
            const errorContext: any = {
                message: err.message,
                stack: err.stack,
            };

            if (err.status) {
                res.statusCode = Number(err.status);
            }
            if (!res.statusCode || res.statusCode < 400) {
                res.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            }

            if (res.statusCode === httpStatus.UNAUTHORIZED) {
                if (err.realm && err.realm.type && err.realm.env && err.realm.charset) {
                    res.setHeader(
                        'WWW-Authenticate',
                        `${err.realm.type} realm="${err.realm.env}", charset="${err.realm.charset}"`,
                    );
                }
            }

            const context = {
                http_status_code: res.statusCode,
                error: errorContext,
                request: {
                    method: req.method,
                    url: req.url,
                },
            };

            if (res.statusCode >= 500) {
                logger.error('A Request failed', context);
            } else {
                logger.info(errorContext.message, context);
            }

            res.setHeader('Content-Type', 'application/json');
            res.json(responseBody);
        } else {
            next();
        }
    };
}
