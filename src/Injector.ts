import { Application } from './Application';
import { Configs } from './Config';
import { ExpressServer } from './ExpressServer';
import { GithubClientFactory } from './GithubClientFactory';
import { GithubExtractor } from './GithubExtractor';
import { GithubRepository } from './GithubRepository.js';
import { Logger } from './Logger';
import { Metrics } from './Metrics';

export class Injector {

    constructor(private readonly configs: Configs, private readonly logger: Logger) {
    }

    createApplication(): Application {
        return new Application(this.configs.timeBetweenExtractionInMS,
            this.logger,
            this.createGithubExtractor(),
            this.createExpressServer());
    }

    private createGithubExtractor(): GithubExtractor {
        const githubClientFactory = new GithubClientFactory(this.configs.githubClient, this.logger);
        const githubRepository = new GithubRepository(githubClientFactory.getOctokitClient(),
            this.configs.github.organisation,
            this.logger);
        return new GithubExtractor(githubRepository, this.logger, new Metrics(), this.configs.github);
    }

    private createExpressServer(): ExpressServer {
        return new ExpressServer(this.configs.server.port, this.logger);
    }
}
