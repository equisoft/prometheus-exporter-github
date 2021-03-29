import * as httpStatus from 'http-status';
import {ErrorRequestHandler} from 'express';
import {Logger} from './Logger';

interface ErrorResponseBody {
    error: string;
    error_description?: string;
    error_uri?: string;
}

export type RequestError = any;


export function createErrorHandler(logger: Logger): ErrorRequestHandler {

    return (err: RequestError, req, res, next) => {
        if (err) {
            const responseBody: ErrorResponseBody = {
                error: 'server_error',
            };
            const errorContext: any = {
                "error_message": err.message,
                "error_stack": err.stack,
            };

            if (err.status) {
                res.statusCode = Number(err.status);
            }
            if (!res.statusCode || res.statusCode < 400) {
                res.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            }

            if (res.statusCode === httpStatus.UNAUTHORIZED) {
                if (err?.realm?.type && err.realm.env && err.realm.charset) {
                    res.setHeader(
                        'WWW-Authenticate',
                        `${err.realm.type} realm="${err.realm.env}", charset="${err.realm.charset}"`,
                    );
                }
            }

            const globalContext = {
                response_http_status_code: res.statusCode,
                request_method: req.method,
                request_url: req.url,
            };

            if (res.statusCode >= 500) {
                logger.error('A Request failed', errorContext, globalContext);
            } else {
                logger.info(errorContext.message, errorContext, globalContext);
            }

            res.setHeader('Content-Type', 'application/json');
            res.json(responseBody);
        } else {
            next();
        }
    };
}
