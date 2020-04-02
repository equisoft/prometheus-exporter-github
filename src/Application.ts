import { ExpressServer } from './ExpressServer';
import { GithubExtractor } from './GithubExtractor';
import { Logger } from './Logger';

export class Application {

    constructor(
        private readonly timeBetweenExtraction: number,
        private readonly logger: Logger,
        private readonly githubExtractor: GithubExtractor,
        private readonly expressServer: ExpressServer,
    ) {
        this.expressServer.start();
    }

    stop(cb: () => void): void {
        this.expressServer.close(cb);
    }

    readonly startExtractionProcess = async () => {
        const begin = new Date();
        try {
            this.logger.debug('Fetching global data from github');
            await this.githubExtractor.fetchGlobalData();
            // await this.githubExtractor.processOrganisationRepositories();
            await this.githubExtractor.processTeamsData();
        } catch (e) {
            this.logger.error('Github stats extraction crashed');
            this.logger.exception(e);
        } finally {
            const end = new Date();
            this.logger.debug(`Github stats extraction took ${((end.getTime() - begin.getTime()) / 60000)} minutes to execute.`);
            this.logger.debug(`Github stats extraction will restart in ${(this.timeBetweenExtraction / 60000)} minutes`);
            setTimeout(this.startExtractionProcess, this.timeBetweenExtraction);
        }

    }

}
