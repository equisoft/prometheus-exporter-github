import { Logger } from './Logger'
import { Metrics } from "./Metrics";
import { GithubConfigs } from "./Config";
import { GithubRepository } from "./GithubRepository";

export interface ResponseHeader {
    date: string;
    'x-ratelimit-limit': string;
    'x-ratelimit-remaining': string;
    'x-ratelimit-reset': string;
    'x-Octokit-request-id': string;
    'x-Octokit-media-type': string;
    link: string;
    'last-modified': string;
    etag: string;
    status: string;
}

export class GithubExtractor {
    users: string[];

    constructor(
        private readonly repository: GithubRepository,
        private readonly logger: Logger,
        private readonly metrics: Metrics,
        private readonly config: GithubConfigs,
    ) {
        this.users = [];
    }

    async fetchGlobalData(): Promise<void> {
        await this.loadUsersTeams();
    }

    private async loadUsersTeams(): Promise<void> {

        const organisationTeams = await this.client.teams.list({ org: this.config.organisation });
        for (const team of organisationTeams.data) {
            if (this.config.teams.includes(team.name)) {
                const teamsMembers = await this.client.teams.listMembersLegacy({ team_id: team.id });
                for (const member of teamsMembers.data) {
                    if (!(this.users.includes(member.login))) {
                        this.users[member.login] = [];
                    }
                    this.users[member.login].push(team.name);
                }
            }
            await this.ensureToRespectRateLimit(organisationTeams.headers);
        }
    }

    async processRepoPulls(repository: Octokit.ReposListForOrgResponseItem): Promise<void> {
        let pullOpen = 0;
        let pullClose = 0;
        const pullOpenIds = [];
        const pullCloseIds = [];

        for (const pull of await this.repository.getPullsForRepository(repository)) {
            if (pull.state === 'open') {
                pullOpen += 1;
                pullOpenIds.push(pull.id);
                this.metrics.githubRepoPullRequestsOpenGauge.inc(
                    { owner: repository.owner.login, repo: repository.name, created_at: pull.created_at },
                    1,
                );
            } else {
                pullClose += 1;
                pullCloseIds.push(pull.id);
                this.metrics.githubRepoPullRequestsCloseGauge.inc(
                    { owner: repository.owner.login, repo: repository.name, merged_at: pull.merged_at },
                    1,
                );
            }
            await this.ensureToRespectRateLimit(response.headers);
        }
        this.metrics.setRepoPullRequestsCloseGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose
        );
        this.metrics.setRepoPullRequestsOpenGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullOpen
        );
        this.metrics.setRepoPullRequestsGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose + pullOpen
        );
    }

    async processPulls(): Promise<void> {
        this.metrics.setPullRequestsGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCount()
        );
        this.metrics.setPullRequestsOpenGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenCount()
        );
        this.metrics.setPullRequestsCloseGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCloseCount()
        );
        this.metrics.setPullRequestsMergedGauge(
            { owner: this.config.organisation },
            await this.repository.getPRMergedCount()
        );
        this.metrics.setPullRequestsOpenApprovedGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndApproved()
        );
        await this.ensureToRespectRateLimit(result.headers);
        this.metrics.setPullRequestsOpenWaitingApprovalGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndNotApproved()
        );
    }

    async processBranches(repository: Octokit.ReposListForOrgResponseItem): Promise<void> {
        this.metrics.setRepoBranchesGauge(
            { owner: repository.owner.login, repo: repository.name },
            await this.repository.getCountofBranchesInRepository(repository),
        );
    }

    async processOrganisationRepositories(): Promise<any> {
        return new Promise(async resolve => {
            this.logger.debug('Triggering github organisation repositories extraction');
            const start = new Date();
            let repositoryPrivateCount = 0;
            let repositoryPublicCount = 0;

        await this.processPulls();

        for (const repository of await this.repository.getRepositoryListForOrg()) {
            if (repository.private) {
                repositoryPrivateCount += 1;
            } else {
                repositoryPublicCount += 1;
            }
            this.metrics.setRepoStarsGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.stargazers_count,
            );
            this.metrics.setRepoForksGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.forks_count,
            );
            this.metrics.setRepoOpenIssuesGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.open_issues_count,
            );

            await this.processRepoPulls(repository);
            await this.processBranches(repository);

        }
        this.logger.debug(`Processing ${repositoryPrivateCount + repositoryPublicCount} repositories`);
        this.metrics.setRepoGauge(
            { owner: this.config.organisation },
            repositoryPrivateCount + repositoryPublicCount,
        );
        this.metrics.setRepoPrivateGauge(
            { owner: this.config.organisation },
            repositoryPrivateCount,
        );
        this.metrics.setRepoPublicGauge(
            { owner: this.config.organisation },
            repositoryPublicCount,
        );
    }

    async processTeamsData(): Promise<void> {
        this.logger.debug('Triggering github teams data extraction');
        const start = new Date();

        for (const user in this.users) {
            this.logger.debug(`Processing ${user} data`);
            await this.processUserData(user, this.users[user]);
        }

        const end = new Date();
        this.logger.debug(`Github teams data extraction completed in ${((end.getTime() - start.getTime()) / 60000).toFixed(3)} minutes`);
    }

    private async processUserData(user: string, teams: string[]): Promise<void> {
        const pullOpenCountByRepo = {};
        const pullCloseCountByRepo = {};
        const options = this.client.search.issuesAndPullRequests.endpoint.merge({
            q: `org:${this.config.organisation} is:pr author:${user}`,
            per_page: 100,
        });

        for await (const response of this.client.paginate.iterator(options)) {
            for (const pull of response.data) {
                const repoName = pull.repository_url.split('/').pop();

                if (!(repoName in pullOpenCountByRepo)) {
                    pullOpenCountByRepo[repoName] = 0;
                    pullCloseCountByRepo[repoName] = 0;
                }
                if (pull.state === 'open') {
                    pullOpenCountByRepo[repoName] += 1;

                } else {
                    pullCloseCountByRepo[repoName] += 1;
                }

                // Number of comments on this pull request
                const commentsOnPR = await this.client.pulls.listComments({
                    owner: this.config.organisation,
                    pull_number: pull.number,
                    repo: repoName,
                    per_page: 100,
                });
                const commentators = {};
                for (const comment of commentsOnPR.data) {
                    if (comment.user !== null) {
                        if (!(comment.user.login in commentators)) {
                            commentators[comment.user.login] = 0;
                        }
                        commentators[comment.user.login] += 1;
                    }
                }
                for (const commentator in commentators) {
                    for (const teamIndex in teams) {
                        this.metrics.githubPullRequestsCommentsGauge.set(
                            {
                                repo: repoName, prAuthor: user,
                                prNumber: pull.number, commentator: commentator
                            },
                            commentators[commentator],
                        );
                    }
                }
                await this.ensureToRespectRateLimit(response.headers);
            }
            await this.ensureToRespectRateLimit(response.headers);
        }

        for (const repoName in pullOpenCountByRepo) {
            for (const teamIndex in teams) {
                this.metrics.githubAuthorPullRequestOpenGauge.set(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullOpenCountByRepo[repoName],
                );
                this.metrics.githubAuthorPullRequestCloseGauge.set(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullCloseCountByRepo[repoName],
                );

                this.metrics.githubAuthorPullRequestGauge.set(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullOpenCountByRepo[repoName] + pullCloseCountByRepo[repoName],
                );
            }
        }
    }

    private async ensureToRespectRateLimit(headers: ResponseHeader): Promise<void> {
        // tslint:disable-next-line:radix
        if (parseInt(headers['x-ratelimit-remaining'], 10) <= 1) {
            const now = new Date().getTime();
            const rateLimitReset = parseInt(headers['x-ratelimit-reset'], 10);
            // Need to add 1 second since sometime de reset time is a little bit off
            const resetTime = new Date(rateLimitReset * 1000).getTime() + 1000;
            const restartIn = resetTime - now;
            this.logger.info(`Request quota exhausted. Waiting ${restartIn / 1000} seconds`);
            await new Promise(resolve => setTimeout(resolve, restartIn));
        }
    }
}
