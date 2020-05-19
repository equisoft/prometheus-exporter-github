import { Octokit } from "@octokit/rest";

export class GithubRepository {
    constructor(
        private readonly githubClient: Octokit,
        private readonly organisation: string
    ) {
    }

    async getPullsForRepository(repository) {
        let pulls = [];
        const options = this.githubClient.pulls.list.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            state: 'all',
            per_page: 100
        });

        for await (const response of this.githubClient.paginate.iterator(options)) {
            pulls = pulls.concat(response.data);
        }
        return pulls;
    }

    async getCountofBranchesInRepository(repository) {
        let branchCount = 0;
        const options = this.githubClient.repos.listBranches.endpoint.merge({
            owner: repository.owner.login,
            repo: repository.name,
            sort: 'updated',
            per_page: 100
        });
        for await (const response of this.githubClient.paginate.iterator(options)) {
            branchCount += response.data.length;
        }
        return branchCount;
    }

    async getRepositoryListForOrg() {
        const options = this.githubClient.repos.listForOrg.endpoint.merge({
            org: this.organisation,
            sort: 'updated',
            per_page: 100
        });

        let repositories = [];

        for await (const response of this.githubClient.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            repositories = repositories.concat(response.data);
        }

        return repositories;
    }

    async getPRCount() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr`);
    }

    async getPROpenCount() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open`);
    }

    async getPRCloseCount() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:close`);
    }

    async getPRMergedCount() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:merged`);
    }

    async getPROpenAndApproved() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open review:approved`);
    }

    async getPROpenAndNotApproved() {
        return this.getCountOfIssueAndPullRequest(`org:${this.organisation} is:pr is:open review:none`);
    }

    private async getCountOfIssueAndPullRequest(query: string) {
        const result = await this.githubClient.search.issuesAndPullRequests({
            q: query,
            per_page: 1
        });

        return result.data.total_count;
    }


}
