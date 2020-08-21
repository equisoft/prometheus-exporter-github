import { Octokit } from '@octokit/rest';
import { GithubConfigs } from './Config';
import { GithubRepository } from './GithubRepository';
import { Logger } from './Logger';
import { Metrics } from './Metrics';

export class GithubExtractor {
    users!: {
        [key: string]: string[];
    };

    constructor(
        private readonly repository: GithubRepository,
        private readonly logger: Logger,
        private readonly metrics: Metrics,
        private readonly config: GithubConfigs,
    ) {}

    async fetchGlobalData(): Promise<void> {
        this.users = {};
        await this.loadUsersTeams();
    }

    private async loadUsersTeams(): Promise<void> {

        const organisationTeams = await this.repository.getTeams();
        for (const team of organisationTeams) {
            if (this.config.teams.includes(team.name)) {
                const teamsMembers = await this.repository.getTeamMembers(team.id);
                for (const member of teamsMembers) {
                    if (!(this.users.hasOwnProperty(member.login))) {
                        this.users[member.login] = [];
                    }
                    this.users[member.login].push(team.name);
                }
            }
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
            } else {
                pullClose += 1;
                pullCloseIds.push(pull.id);
            }
        }
        this.metrics.setRepoPullRequestsCloseGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose,
        );
        this.metrics.setRepoPullRequestsOpenGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullOpen,
        );
        this.metrics.setRepoPullRequestsGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose + pullOpen,
        );
    }

    async processPulls(): Promise<void> {
        this.metrics.setPullRequestsGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCount(),
        );
        this.metrics.setPullRequestsOpenGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenCount(),
        );
        this.metrics.setPullRequestsCloseGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCloseCount(),
        );
        this.metrics.setPullRequestsMergedGauge(
            { owner: this.config.organisation },
            await this.repository.getPRMergedCount(),
        );
        this.metrics.setPullRequestsOpenApprovedGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndApproved(),
        );
        this.metrics.setPullRequestsOpenWaitingApprovalGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndNotApproved(),
        );
    }

    async processBranches(repository: Octokit.ReposListForOrgResponseItem): Promise<void> {
        this.metrics.setRepoBranchesGauge(
            { owner: repository.owner.login, repo: repository.name },
            await this.repository.getCountofBranchesInRepository(repository),
        );
    }

    async processOrganisationRepositories(): Promise<void> {
        this.logger.debug('Triggering github organisation repositories extraction');
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
        this.logger.debug(`Github teams data extraction completed in ${((end.getTime() - start.getTime())
            / 60000).toFixed(3)} minutes`);
    }

    private async processUserData(user: string, teams: string[]): Promise<void> {
        const pullOpenCountByRepo: {[key: string]: number} = {};
        const pullCloseCountByRepo: {[key: string]: number} = {};

        for await (const pull of await this.repository.getPullsForUser(user)) {
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
            const commentators: {[userLogin: string]: number} = {};
            for (const comment of await this.repository.getCommentListforPR(repoName, pull.number)) {
                if (comment.user !== null) {
                    if (!(comment.user.login in commentators)) {
                        commentators[comment.user.login] = 0;
                    }
                    commentators[comment.user.login] += 1;
                }
            }
            for (const commentator in commentators) {
                for (const teamIndex in teams) {
                    this.metrics.setPullRequestsCommentsGauge(
                        {
                            repo: repoName, prAuthor: user,
                            prNumber: pull.number, commentator: commentator,
                            commentatorTeam: teamIndex,
                        },
                        commentators[commentator],
                    );
                }
            }
        }

        for (const repoName in pullOpenCountByRepo) {
            for (const teamIndex in teams) {
                this.metrics.setAuthorPullRequestOpenGauge(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullOpenCountByRepo[repoName],
                );
                this.metrics.setAuthorPullRequestCloseGauge(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullCloseCountByRepo[repoName],
                );

                this.metrics.setAuthorPullRequestGauge(
                    { repo: repoName, author: user, team: teams[teamIndex] },
                    pullOpenCountByRepo[repoName] + pullCloseCountByRepo[repoName],
                );
            }
        }
    }
}
