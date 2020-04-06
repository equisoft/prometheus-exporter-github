import { ExpressServer } from './ExpressServer';
import { GithubExtractor } from './GithubExtractor';
import { Logger } from './Logger';

export class Application {

    constructor(private readonly timeBetweenExtraction: number, private readonly logger: Logger, private readonly githubExtractor: GithubExtractor, private readonly expressServer: ExpressServer) {
        this.expressServer.start();
    }

    stop(cb: () => any): void {
        this.expressServer.close(cb);
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
            this.logger.debug(`Github data fetch will restart in ${this.timeBetweenExtraction}ms`);
            setTimeout(this.startExtractionProcess, this.timeBetweenExtraction);
        }

    }

}

