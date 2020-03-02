import {Server as HttpServer} from "http";
import {configs, Configs} from "./Config";
import * as express from 'express';
import {register} from "prom-client";
import {Logger} from "./Logger";
import {ErrorHandler} from "./ErrorHandler";
import {GithubClientFactory} from "./GithubClientFactory";
import {GithubExtractor} from "./GithubExtractor";
import {metrics} from "./Metrics";

export class Application {
    appConfigs: Configs;
    logger: Logger;
    app: express.Application;
    server: HttpServer;
    private githubExtractor: GithubExtractor;

    constructor(private readonly configs: Configs, logger: Logger) {
        this.appConfigs = configs;
        this.logger = logger;
        this.initExpress();
        this.initRoutes();
        this.createGithubExtractor();
        // Error handler
        this.app.use(ErrorHandler(this.logger));
    }

    private initExpress(): void {
        this.app = express();
    }

    private initRoutes(): void {
        this.app.get('/metrics', async (req, res) => {
            res.set('Content-Type', register.contentType);
            res.end(register.metrics());
        });
    }

    start(): void {
        this.server = this.app.listen(configs.server.port, () => {
            this.logger.info(`App server listening on port ${configs.server.port}!`);
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

    private createGithubExtractor(): void {
        const githubClient = new GithubClientFactory(configs.githubClient, this.logger);
        this.githubExtractor = new GithubExtractor(githubClient.getOctokitClient(), this.logger, metrics, configs.github);
    }

    startExtractionProcess = async () => {
        try {
            this.logger.debug('Triggering github data fetch');
            await this.githubExtractor.processOrganisationRepositories();
            this.logger.debug('Github data fetch complete');
        } catch (e) {
            this.logger.error('Github data fetch crashed');
            this.logger.error(e);
        } finally {
            this.logger.debug(`Github data fetch will restart in ${this.configs.timeBetweenExtractionInMS}ms`);
            setTimeout(this.startExtractionProcess, this.configs.timeBetweenExtractionInMS);
        }

    }

}


