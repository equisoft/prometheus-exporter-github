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

    processRepoPulls(repository): Promise<void> {
        return new Promise(async resolve => {
            let pullOpen = 0;
            let pullClose = 0;
            const options = this.client.pulls.list.endpoint.merge({
                owner: repository.owner.login,
                repo: repository.name,
                sort: 'updated',
                state: 'all',
                per_page: 100
            });
            for await (const response of this.client.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
                for (let i = 0; i < response.data.length; i++) {
                    const pull = response.data[i];
                    if (pull.state === 'open') {
                        pullOpen += 1;
                    } else {
                        pullClose += 1;
                    }
                }
            }
            this.metrics.githubRepoPullRequestsCloseGauge.set(
                {owner: repository.owner.login, repo: repository.name},
                pullClose,
            );
            this.metrics.githubRepoPullRequestsOpenGauge.set(
                {owner: repository.owner.login, repo: repository.name},
                pullOpen,
            );
            this.metrics.githubRepoPullRequestsGauge.set(
                {owner: repository.owner.login, repo: repository.name},
                pullClose + pullOpen,
            );
            resolve();
        });
    }

    processPulls(): Promise<any> {
        return new Promise(async resolve => {
            const promises = [];
            promises.push([
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr is:open`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsOpenGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr is:closed`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsCloseGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr is:merged`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsMergedGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr is:open review:approved`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsOpenApprovedGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
                this.client.search.issuesAndPullRequests({
                    q: `org:${this.config.organisation} is:pr is:open review:none`,
                    per_page: 1
                }).then(result => {
                    this.metrics.githubPullRequestsOpenWaitingApprovalGauge.set(
                        {owner: this.config.organisation},
                        result.data.total_count,
                    );
                }),
            ]);
            await Promise.all(promises);
            resolve();
        });
    }

    processBranches(repository): Promise<any> {
        return new Promise(async resolve => {
            let branchCount = 0;
            const options = this.client.repos.listBranches.endpoint.merge({
                owner: repository.owner.login,
                repo: repository.name,
                sort: 'updated',
                per_page: 100
            });
            for await (const response of this.client.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
                branchCount += response.data.length;
            }
            this.metrics.githubRepoBranchesGauge.set(
                {owner: repository.owner.login, repo: repository.name},
                branchCount,
            );
            resolve();
        });
    }

    processOrganisationRepositories(): Promise<any> {
        return new Promise(async resolve => {
            let repositoryCount = 0;
            let repositoryPrivateCount = 0;
            let repositoryPublicCount = 0;
            const promises = [];

            promises.push(this.processPulls());
            const options = this.client.repos.listForOrg.endpoint.merge({
                org: this.config.organisation,
                sort: 'updated',
                per_page: 100
            });
            for await (const response of this.client.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
                repositoryCount += response.data.length;
                for (let i = 0; i < response.data.length; i++) {
                    const repository = response.data[i];
                        if (repository.private) {
                            repositoryPrivateCount += 1;
                        } else {
                            repositoryPublicCount += 1;
                        }
                        this.metrics.githubRepoStarsGauge.set(
                            {owner: repository.owner.login, repo: repository.name},
                            repository.stargazers_count,
                        );
                        this.metrics.githubRepoForksGauge.set(
                            {owner: repository.owner.login, repo: repository.name},
                            repository.forks_count,
                        );
                        this.metrics.githubRepoOpenIssuesGauge.set(
                            {owner: repository.owner.login, repo: repository.name},
                            repository.open_issues_count,
                        );

                        promises.push(this.processRepoPulls(repository));
                        promises.push(this.processBranches(repository));

                }
            }
            this.logger.debug(`Processing ${repositoryCount} repositories`);
            this.metrics.githubRepoGauge.set(
                {owner: this.config.organisation},
                repositoryCount,
            );
            this.metrics.githubRepoPrivateGauge.set(
                {owner: this.config.organisation},
                repositoryPrivateCount,
            );
            this.metrics.githubRepoPublicGauge.set(
                {owner: this.config.organisation},
                repositoryPublicCount,
            );
            await Promise.all(promises);
            resolve();
        });
    }
}
