import * as httpStatus from 'http-status';
import { Logger } from './Logger';

interface ErrorResponseBody {
    error: string;
    error_description?: string;
    error_uri?: string;
}

export function ErrorHandler(logger: Logger): (err: any, req: any, res: any, next: any) => any {

    return (err: any, req: any, res: any, next: any) => {
        if (err) {
            const responseBody: ErrorResponseBody = {
                error: 'server_error',
            };
            const errorContext: any = {
                message: err.message,
                stack: err.stack,
            };

            if (err.status) {
                res.statusCode = err.status;
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
                    // headers: JSON.stringify(req.headers),
                    // body: JSON.stringify(req.body)
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
