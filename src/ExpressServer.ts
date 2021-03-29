import * as express from "express";
import {Server as HttpServer} from 'http';
import {register} from 'prom-client';
import {createErrorHandler} from './ErrorHandler';
import {Logger} from './Logger';

export class ExpressServer {
    private expressServer: express.Express;
    private server: HttpServer;

    constructor(
        private readonly serverPort: number,
        private readonly logger: Logger,
    ) {
        this.expressServer = express();
        this.initRoutes();
        this.expressServer.use(createErrorHandler(this.logger));
    }

    private initRoutes(): void {
        this.expressServer.get('/metrics', async (req, res) => {
            res.set('Content-Type', register.contentType);
            res.end(register.metrics());
        });
    }

    start(): void {

        this.server = this.expressServer.listen(this.serverPort, () => {
            this.logger.info(`App server listening on port ${this.serverPort}!`);
        });
    }

    close(cb: () => void): void {
        if (this.server) {
            this.logger.info('Trying to close gracefully');
            this.server.close(() => {
                this.server = null;
                this.logger.info('Server closed gracefully');
                cb();
            });
        }
    }
}
