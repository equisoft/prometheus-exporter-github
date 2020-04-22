import {Logger} from './Logger'
import {GithubClientFactory} from "./GithubClientFactory";
import {Metrics} from "./Metrics";
import {GithubConfigs} from "./Config";
import {Octokit} from "@octokit/rest";

export class GithubExtractor {
    constructor(
        private readonly githubClient: Octokit,
        private readonly logger: Logger,
        private readonly metrics: Metrics,
        private readonly config: GithubConfigs,
    ) {
    }

    async processRepoPulls(repository): Promise<void> {
        let pullOpen = 0;
        let pullClose = 0;
        const options = this.githubClient.pulls.list.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            state: 'all',
            per_page: 100
        });
        for await (const response of this.githubClient.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            for (let i = 0; i < response.data.length; i++) {
                const pull = response.data[i];
                if (pull.state === 'open') {
                    pullOpen += 1;
                } else {
                    pullClose += 1;
                }
            }
        }
        this.metrics.repoPullRequestsCloseGauge.set(
            {owner: repository.owner.login, repo: repository.name},
            pullClose,
        );
        this.metrics.repoPullRequestsOpenGauge.set(
            {owner: repository.owner.login, repo: repository.name},
            pullOpen,
        );
        this.metrics.repoPullRequestsGauge.set(
            {owner: repository.owner.login, repo: repository.name},
            pullClose + pullOpen,
        );
    }

    async processPulls(): Promise<void> {
        const promises = [];
        promises.push([
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr is:open`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsOpenGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr is:closed`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsCloseGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr is:merged`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsMergedGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr is:open review:approved`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsOpenApprovedGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
            this.githubClient.search.issuesAndPullRequests({
                q: `org:${this.config.organisation} is:pr is:open review:none`,
                per_page: 1
            }).then(result => {
                this.metrics.pullRequestsOpenWaitingApprovalGauge.set(
                    {owner: this.config.organisation},
                    result.data.total_count,
                );
            }),
        ]);
        await Promise.all(promises);
    }

    async processBranches(repository): Promise<void> {
        let branchCount = 0;
        const options = this.githubClient.repos.listBranches.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            per_page: 100
        });
        for await (const response of this.githubClient.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            branchCount += response.data.length;
        }
        this.metrics.repoBranchesGauge.set(
            {owner: repository.owner.login, repo: repository.name},
            branchCount,
        );
    }

    async processOrganisationRepositories(): Promise<void> {
        let repositoryCount = 0;
        let repositoryPrivateCount = 0;
        let repositoryPublicCount = 0;
        const promises = [];

        promises.push(this.processPulls());
        const options = this.githubClient.repos.listForOrg.endpoint.merge({
            org: this.config.organisation,
            sort: 'updated',
            per_page: 100
        });
        for await (const response of this.githubClient.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            repositoryCount += response.data.length;
            for (let i = 0; i < response.data.length; i++) {
                const repository = response.data[i];
                    if (repository.private) {
                        repositoryPrivateCount += 1;
                    } else {
                        repositoryPublicCount += 1;
                    }
                    this.metrics.repoStarsGauge.set(
                        {owner: repository.owner.login, repo: repository.name},
                        repository.stargazers_count,
                    );
                    this.metrics.repoForksGauge.set(
                        {owner: repository.owner.login, repo: repository.name},
                        repository.forks_count,
                    );
                    this.metrics.repoOpenIssuesGauge.set(
                        {owner: repository.owner.login, repo: repository.name},
                        repository.open_issues_count,
                    );

                    promises.push(this.processRepoPulls(repository));
                    promises.push(this.processBranches(repository));

            }
        }
        this.logger.debug(`Processing ${repositoryCount} repositories`);
        this.metrics.repoGauge.set(
            {owner: this.config.organisation},
            repositoryCount,
        );
        this.metrics.repoPrivateGauge.set(
            {owner: this.config.organisation},
            repositoryPrivateCount,
        );
        this.metrics.repoPublicGauge.set(
            {owner: this.config.organisation},
            repositoryPublicCount,
        );
        await Promise.all(promises);
    }
}
