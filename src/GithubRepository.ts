import { Octokit } from '@octokit/rest';
import { Logger } from './Logger.js';

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

export class GithubRepository {
    constructor(
        private readonly githubClient: Octokit,
        private readonly organisation: string,
        private readonly logger: Logger,
    ) {
    }

    async getTeams(): Promise<any[]> {
        const organisationTeams: any[] = [];
        const organisationTeamsRaw = await this.githubClient.teams.list({ org: this.organisation });
        for (const team of organisationTeamsRaw.data) {
            organisationTeams.push(team);
        }

        await this.ensureToRespectRateLimit(organisationTeamsRaw.headers);
        return organisationTeams;
    }

    async getTeamMembers(teamId: number): Promise<any[]> {
        const teamMembers: any[] = [];
        const teamMembersRaw = await this.githubClient.teams.listMembersLegacy({ team_id: teamId });
        for (const member of teamMembersRaw.data) {
            teamMembers.push(member);
        }

        await this.ensureToRespectRateLimit(teamMembersRaw.headers);
        return teamMembers;
    }

    async getPullsForRepository(repository: Octokit.ReposListForOrgResponseItem): Promise<any[]> {
        let pulls: any[] = [];
        const options = this.githubClient.pulls.list.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            state: 'all',
            per_page: 100,
        });

        for await (const response of this.githubClient.paginate.iterator(options)) {
            pulls = pulls.concat(response.data);
            await this.ensureToRespectRateLimit(response.headers);
        }
        return pulls;
    }

    async getPullsForUser(user: string): Promise<any[]> {
        let pulls: any[] = [];
        const options = this.githubClient.search.issuesAndPullRequests.endpoint.merge({
            q: `org:${this.organisation} is:pr author:${user}`,
            per_page: 100,
        });

        for await (const response of this.githubClient.paginate.iterator(options)) {
            pulls = pulls.concat(response.data);
            await this.ensureToRespectRateLimit(response.headers);
        }
        return pulls;
    }

    async getCountofBranchesInRepository(repository: Octokit.ReposListForOrgResponseItem): Promise<number> {
        let branchCount = 0;
        const options = this.githubClient.repos.listBranches.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            per_page: 100,
        });

        for await (const response of this.githubClient.paginate.iterator(options)) {
            branchCount += response.data.length;
            await this.ensureToRespectRateLimit(response.headers);
        }
        return branchCount;
    }

    async getRepositoryListForOrg(): Promise<any[]> {
        const options = this.githubClient.repos.listForOrg.endpoint.merge({
            org: this.organisation,
            sort: 'updated',
            per_page: 100,
        });

        let repositories: any[] = [];

        for await (const response of this.githubClient.paginate.iterator(options)) {
            repositories = repositories.concat(response.data);
            await this.ensureToRespectRateLimit(response.headers);
        }

        return repositories;
    }

    async getCommentListforPR(repoName: string, prNumber: number): Promise<any[]> {
        const commentsOnPR = await this.githubClient.pulls.listComments({
            owner: this.organisation,
            pull_number: prNumber,
            repo: repoName,
            per_page: 100,
        });

        return commentsOnPR.data;
    }

    async getPRCount(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr`);
    }

    async getPROpenCount(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open`);
    }

    async getPRCloseCount(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:close`);
    }

    async getPRMergedCount(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:merged`);
    }

    async getPROpenAndApproved(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open review:approved`);
    }

    async getPROpenAndNotApproved(): Promise<number> {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open review:none`);
    }

    private async getCountOfIssueAndPullRequest(query: string): Promise<number> {
        const result = await this.githubClient.search.issuesAndPullRequests({
            q: query,
            per_page: 1,
        });

        await this.ensureToRespectRateLimit(result.headers);
        return result.data.total_count;
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
