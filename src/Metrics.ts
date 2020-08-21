import { Gauge, labelValues } from 'prom-client';

export class Metrics {
    private repoGauge: Gauge;
    private repoPublicGauge: Gauge;
    private repoPrivateGauge: Gauge;
    private repoStarsGauge: Gauge;
    private repoForksGauge: Gauge;
    private repoOpenIssuesGauge: Gauge;
    private repoPullRequestsGauge: Gauge;
    private repoPullRequestsOpenGauge: Gauge;
    private repoPullRequestsCloseGauge: Gauge;
    private pullRequestsGauge: Gauge;
    private pullRequestsOpenGauge: Gauge;
    private pullRequestsCloseGauge: Gauge;
    private pullRequestsOpenApprovedGauge: Gauge;
    private pullRequestsOpenWaitingApprovalGauge: Gauge;
    private pullRequestsMergedGauge: Gauge;
    private repoBranchesGauge: Gauge;
    private repoPullRequestsOpenByReviewersGauge: Gauge;
    private repoPullRequestsCloseByReviewersGauge: Gauge;
    private authorPullRequestOpenGauge: Gauge;
    private authorPullRequestCloseGauge: Gauge;
    private pullRequestsCommentsGauge: Gauge;
    private authorPullRequestGauge: Gauge;

    constructor() {
        this.repoGauge = new Gauge({
            name: 'github_repo_count',
            help: 'Total number of repository',
            labelNames: ['owner'],
        });

        this.repoPublicGauge = new Gauge({
            name: 'github_repo_public_count',
            help: 'Total number of public repository',
            labelNames: ['owner'],
        });
        this.repoPrivateGauge = new Gauge({
            name: 'github_repo_private_count',
            help: 'Total number of private repository',
            labelNames: ['owner'],
        });
        this.repoStarsGauge = new Gauge({
            name: 'github_repo_stars_count',
            help: 'Total number of repository stars',
            labelNames: ['owner', 'repo'],
        });
        this.repoForksGauge = new Gauge({
            name: 'github_repo_forks_count',
            help: 'Total number of repository forks',
            labelNames: ['owner', 'repo'],
        });
        this.repoOpenIssuesGauge = new Gauge({
            name: 'github_repo_open_issues_count',
            help: 'Total number of repository open issues',
            labelNames: ['owner', 'repo'],
        });
        this.repoPullRequestsGauge = new Gauge({
            name: 'github_repo_pull_requests_count',
            help: 'Total number of pull requests',
            labelNames: ['owner', 'repo'],
        });
        this.repoPullRequestsOpenGauge = new Gauge({
            name: 'github_repo_pull_requests_open_count',
            help: 'Total number of open pull requests',
            labelNames: ['owner', 'repo', 'created_at'],
        });
        this.repoPullRequestsCloseGauge = new Gauge({
            name: 'github_repo_pull_requests_close_count',
            help: 'Total number of closed pull requests',
            labelNames: ['owner', 'repo', 'merged_at'],
        });
        this.pullRequestsGauge = new Gauge({
            name: 'github_pull_requests_count',
            help: 'Total number of pull requests',
            labelNames: ['owner'],
        });
        this.pullRequestsOpenGauge = new Gauge({
            name: 'github_pull_requests_open_count',
            help: 'Total number of open pull requests',
            labelNames: ['owner'],
        });
        this.pullRequestsCloseGauge = new Gauge({
            name: 'github_pull_requests_close_count',
            help: 'Total number of closed pull requests',
            labelNames: ['owner'],
        });
        this.pullRequestsOpenApprovedGauge = new Gauge({
            name: 'github_pull_requests_open_approved_count',
            help: 'Total number of open pull requests with an approved review',
            labelNames: ['owner'],
        });
        this.pullRequestsOpenWaitingApprovalGauge = new Gauge({
            name: 'github_pull_requests_open_waiting_approval_count',
            help: 'Total number of open pull requests waiting to be approved',
            labelNames: ['owner'],
        });
        this.pullRequestsMergedGauge = new Gauge({
            name: 'github_pull_requests_merged_count',
            help: 'Total number of merged pull requests',
            labelNames: ['owner'],
        });
        this.repoBranchesGauge = new Gauge({
            name: 'github_repo_branch_count',
            help: 'Total number of branches',
            labelNames: ['owner', 'repo'],
        });
        this.repoPullRequestsOpenByReviewersGauge = new Gauge({
            name: 'github_repo_pull_requests_open_by_reviewer_count',
            help: 'Total number of open pull requests by reviewer',
            labelNames: ['owner', 'repo', 'team', 'reviewer'],
        });

        this.repoPullRequestsCloseByReviewersGauge = new Gauge({
            name: 'github_repo_pull_requests_close_by_reviewer_count',
            help: 'Total number of close pull requests by reviewer',
            labelNames: ['owner', 'repo', 'team', 'reviewer'],
        });
        this.authorPullRequestGauge = new Gauge({
            name: 'github_user_pull_requests_count',
            help: 'Total number of pull requests by author',
            labelNames: ['repo', 'author', 'team'],
        });
        this.authorPullRequestOpenGauge = new Gauge({
            name: 'github_user_pull_requests_open_count',
            help: 'Total number of pull requests open by author',
            labelNames: ['repo', 'author', 'team'],
        });
        this.authorPullRequestCloseGauge = new Gauge({
            name: 'github_user_pull_requests_close_count',
            help: 'Total number of pull requests close by author',
            labelNames: ['repo', 'author', 'team'],
        });
        this.pullRequestsCommentsGauge = new Gauge({
            name: 'github_comments_on_pull_requests_count',
            help: 'Total number of comments on pull requests',
            labelNames: ['repo', 'prAuthor', 'prAuthorTeam', 'prNumber', 'commentator', 'commentatorTeam'],
        });

    }

    setRepoGauge(labels: labelValues, value: number): void {
        this.repoGauge.set(labels, value);
    }

    setRepoPublicGauge(labels: labelValues, value: number): void {
        this.repoPublicGauge.set(labels, value);
    }

    setRepoPrivateGauge(labels: labelValues, value: number): void {
        this.repoPrivateGauge.set(labels, value);
    }

    setRepoStarsGauge(labels: labelValues, value: number): void {
        this.repoStarsGauge.set(labels, value);
    }

    setRepoForksGauge(labels: labelValues, value: number): void {
        this.repoForksGauge.set(labels, value);
    }

    setRepoOpenIssuesGauge(labels: labelValues, value: number): void {
        this.repoOpenIssuesGauge.set(labels, value);
    }

    setRepoPullRequestsGauge(labels: labelValues, value: number): void {
        this.repoPullRequestsGauge.set(labels, value);
    }

    setRepoPullRequestsOpenGauge(labels: labelValues, value: number): void {
        this.repoPullRequestsOpenGauge.set(labels, value);
    }

    setRepoPullRequestsCloseGauge(labels: labelValues, value: number): void {
        this.repoPullRequestsCloseGauge.set(labels, value);
    }

    setPullRequestsGauge(labels: labelValues, value: number): void {
        this.pullRequestsGauge.set(labels, value);
    }

    setPullRequestsOpenGauge(labels: labelValues, value: number): void {
        this.pullRequestsOpenGauge.set(labels, value);
    }

    setPullRequestsCloseGauge(labels: labelValues, value: number): void {
        this.pullRequestsCloseGauge.set(labels, value);
    }

    setPullRequestsOpenApprovedGauge(labels: labelValues, value: number): void {
        this.pullRequestsOpenApprovedGauge.set(labels, value);
    }

    setPullRequestsOpenWaitingApprovalGauge(labels: labelValues, value: number): void {
        this.pullRequestsOpenWaitingApprovalGauge.set(labels, value);
    }

    setPullRequestsMergedGauge(labels: labelValues, value: number): void {
        this.pullRequestsMergedGauge.set(labels, value);
    }

    setRepoBranchesGauge(labels: labelValues, value: number): void {
        this.repoBranchesGauge.set(labels, value);
    }

    setRepoPullRequestsOpenByReviewersGauge(labels: labelValues, value: number): void {
        this.repoPullRequestsOpenByReviewersGauge.set(labels, value);
    }

    setRepoPullRequestsCloseByReviewersGauge(labels: labelValues, value: number): void {
        this.repoPullRequestsCloseByReviewersGauge.set(labels, value);
    }

    setAuthorPullRequestCloseGauge(labels: labelValues, value: number): void {
        this.authorPullRequestCloseGauge.set(labels, value);
    }

    setAuthorPullRequestOpenGauge(labels: labelValues, value: number): void {
        this.authorPullRequestOpenGauge.set(labels, value);
    }

    setAuthorPullRequestGauge(labels: labelValues, value: number): void {
        this.authorPullRequestGauge.set(labels, value);
    }

    setPullRequestsCommentsGauge(labels: labelValues, value: number): void {
        this.pullRequestsCommentsGauge.set(labels, value);
    }
}
