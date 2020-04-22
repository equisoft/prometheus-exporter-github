import * as express from "express";
import { Server as HttpServer } from 'http';
import { register } from 'prom-client';
import { ErrorHandler } from './ErrorHandler';
import { Logger } from './Logger';

export class ExpressServer {
    private expressServer: express.Express;
    private serverPort: number;
    private server: HttpServer;

    constructor(
        private readonly serverPort: number,
        private readonly logger: Logger,
    ) {
        this.expressServer = express();
        this.initRoutes();
        // Error handler
        this.expressServer.use(ErrorHandler(this.logger));
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

    close(cb: () => any): void {
        this.logger.info('Trying to close gracefully');
        if (this.server) {
            this.server.close(() => {
                this.server = null;
                this.logger.info('Server closed gracefully');
                cb();
            });
        }
    }
}
