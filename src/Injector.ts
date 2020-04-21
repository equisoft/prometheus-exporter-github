import { Application } from './Application';
import { EnvironmentConfigs } from './Config';
import { ExpressServer } from './ExpressServer';
import { GithubClientFactory } from './GithubClientFactory';
import { GithubExtractor } from './GithubExtractor';
import { Logger } from './Logger';
import { metrics } from './Metrics';

export class Injector {

    constructor(private readonly configs: EnvironmentConfigs, private readonly logger: Logger) {
    }

    createApplication(): Application {
        return new Application(this.configs.timeBetweenExtractionInMS, this.logger, this.createGithubExtractor(), this.createExpressServer());
    }

    private createGithubExtractor(): GithubExtractor {
        const githubClient = new GithubClientFactory(this.configs.githubClient, this.logger);
        return new GithubExtractor(githubClient.getOctokitClient(), this.logger, metrics, this.configs.github);
    }

    private createExpressServer(): ExpressServer {
        return new ExpressServer(this.configs.server.port, this.logger);
    }
}
