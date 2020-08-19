import { Octokit } from '@octokit/rest';

export class GithubRepository {
    constructor(
        private readonly githubClient: Octokit,
        private readonly organisation: string,
    ) {
    }

    async getPullsForRepository(repository): Promise<any[]> {
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
        }
        return pulls;
    }

    async getCountofBranchesInRepository(repository): Promise<number> {
        let branchCount = 0;
        const options = this.githubClient.repos.listBranches.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            per_page: 100,
        });
        for await (const response of this.githubClient.paginate.iterator(options)) {
            branchCount += response.data.length;
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
        }

        return repositories;
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

        return result.data.total_count;
    }
}
