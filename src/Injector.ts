import {Application} from './Application';
import {Configs} from './Config';
import {ExpressServer} from './ExpressServer';
import {GithubClientFactory} from './GithubClientFactory';
import {GithubExtractor} from './GithubExtractor';
import {Logger} from './Logger';
import {Metrics} from './Metrics';
import {GithubRepository} from "./GithubRepository";

export class Injector {

    constructor(private readonly configs: Configs, private readonly logger: Logger) {
    }

    createApplication(): Application {
        return new Application(this.configs.timeBetweenExtractionInMS, this.logger, this.createGithubExtractor(), this.createExpressServer());
    }

    private createGithubExtractor(): GithubExtractor {
        const githubClient = new GithubClientFactory(this.configs.githubClient, this.logger);
        const githubRepository = new GithubRepository(githubClient.getOctokitClient(), this.configs.github.organization)
        return new GithubExtractor(githubRepository, this.logger, new Metrics(), this.configs.github);
    }

    private createExpressServer(): ExpressServer {
        return new ExpressServer(this.configs.server.port, this.logger);
    }
}
