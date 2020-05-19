import { Logger } from './Logger'
import { Metrics } from "./Metrics";
import { GithubConfigs } from "./Config";
import { GithubRepository } from "./GithubRepository";

export class GithubExtractor {
    constructor(
        private readonly repository: GithubRepository,
        private readonly logger: Logger,
        private readonly metrics: Metrics,
        private readonly config: GithubConfigs,
    ) {
    }

    async processRepoPulls(repository): Promise<void> {
        let pullOpen = 0;
        let pullClose = 0;

        for (const pull of await this.repository.getPullsForRepository(repository)) {
            if (pull.state === 'open') {
                pullOpen += 1;
            } else {
                pullClose += 1;
            }

        }
        this.metrics.repoPullRequestsCloseGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullClose,
        );
        this.metrics.repoPullRequestsOpenGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullOpen,
        );
        this.metrics.repoPullRequestsGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullClose + pullOpen,
        );
    }

    async processPulls(): Promise<void> {
        this.metrics.pullRequestsGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPRCount()
        );
        this.metrics.pullRequestsOpenGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPROpenCount()
        );
        this.metrics.pullRequestsCloseGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPRCloseCount()
        );
        this.metrics.pullRequestsMergedGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPRMergedCount()
        );
        this.metrics.pullRequestsOpenApprovedGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndApproved()
        );
        this.metrics.pullRequestsOpenWaitingApprovalGauge.set(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndNotApproved()
        );
    }

    async processBranches(repository): Promise<void> {
        this.metrics.repoBranchesGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            await this.repository.getCountofBranchesInRepository(repository),
        );
    }

    async processOrganisationRepositories(): Promise<void> {
        let repositoryCount = 0;
        let repositoryPrivateCount = 0;
        let repositoryPublicCount = 0;

        await this.processPulls();

        for (const repository of await this.repository.getRepositoryListForOrg()) { // eslint-disable-line no-restricted-syntax
            if (repository.private) {
                repositoryPrivateCount += 1;
            } else {
                repositoryPublicCount += 1;
            }
            this.metrics.repoStarsGauge.set(
                { owner: repository.owner.login, repo: repository.name },
                repository.stargazers_count,
            );
            this.metrics.repoForksGauge.set(
                { owner: repository.owner.login, repo: repository.name },
                repository.forks_count,
            );
            this.metrics.repoOpenIssuesGauge.set(
                { owner: repository.owner.login, repo: repository.name },
                repository.open_issues_count,
            );

            await this.processRepoPulls(repository);
            await this.processBranches(repository);

        }
        this.logger.debug(`Processing ${repositoryCount} repositories`);
        this.metrics.repoGauge.set(
            { owner: this.config.organisation },
            repositoryCount,
        );
        this.metrics.repoPrivateGauge.set(
            { owner: this.config.organisation },
            repositoryPrivateCount,
        );
        this.metrics.repoPublicGauge.set(
            { owner: this.config.organisation },
            repositoryPublicCount,
        );
    }
}
