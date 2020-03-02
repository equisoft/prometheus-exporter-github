import {Gauge} from "prom-client";

export class Metrics {
     githubRepoGauge: Gauge;
     githubRepoPublicGauge: Gauge;
     githubRepoPrivateGauge: Gauge;
     githubRepoStarsGauge: Gauge;
     githubRepoForksGauge: Gauge;
     githubRepoOpenIssuesGauge: Gauge;
     githubRepoPullRequestsGauge: Gauge;
    githubRepoPullRequestsOpenGauge: Gauge;
     githubRepoPullRequestsCloseGauge: Gauge;
     githubPullRequestsGauge: Gauge;
     githubPullRequestsOpenGauge: Gauge;
     githubPullRequestsCloseGauge: Gauge;
     githubPullRequestsOpenApprovedGauge: Gauge;
     githubPullRequestsOpenWaitingApprovalGauge: Gauge;
     githubPullRequestsMergedGauge: Gauge;
     githubRepoBranchesGauge: Gauge;

    constructor() {
        this.githubRepoGauge = new Gauge({
            name: 'github_repo_count',
            help: 'Total number of repository',
            labelNames: ['owner'],
        });

        this.githubRepoPublicGauge = new Gauge({
            name: 'github_repo_public_count',
            help: 'Total number of public repository',
            labelNames: ['owner'],
        });
        this.githubRepoPrivateGauge = new Gauge({
            name: 'github_repo_private_count',
            help: 'Total number of private repository',
            labelNames: ['owner'],
        });
        this.githubRepoStarsGauge = new Gauge({
            name: 'github_repo_stars_count',
            help: 'Total number of repository stars',
            labelNames: ['owner', 'repo'],
        });
        this.githubRepoForksGauge = new Gauge({
            name: 'github_repo_forks_count',
            help: 'Total number of repository forks',
            labelNames: ['owner', 'repo'],
        });
        this.githubRepoOpenIssuesGauge = new Gauge({
            name: 'github_repo_open_issues_count',
            help: 'Total number of repository open issues',
            labelNames: ['owner', 'repo'],
        });
        this.githubRepoPullRequestsGauge = new Gauge({
            name: 'github_repo_pull_requests_count',
            help: 'Total number of pull requests',
            labelNames: ['owner', 'repo'],
        });
        this.githubRepoPullRequestsOpenGauge = new Gauge({
            name: 'github_repo_pull_requests_open_count',
            help: 'Total number of open pull requests',
            labelNames: ['owner', 'repo', 'reviewer'],
        });
        this.githubRepoPullRequestsCloseGauge = new Gauge({
            name: 'github_repo_pull_requests_close_count',
            help: 'Total number of closed pull requests',
            labelNames: ['owner', 'repo'],
        });
        this.githubPullRequestsGauge = new Gauge({
            name: 'github_pull_requests_count',
            help: 'Total number of pull requests',
            labelNames: ['owner'],
        });
        this.githubPullRequestsOpenGauge = new Gauge({
            name: 'github_pull_requests_open_count',
            help: 'Total number of open pull requests',
            labelNames: ['owner'],
        });
        this.githubPullRequestsCloseGauge = new Gauge({
            name: 'github_pull_requests_close_count',
            help: 'Total number of closed pull requests',
            labelNames: ['owner'],
        });
        this.githubPullRequestsOpenApprovedGauge = new Gauge({
            name: 'github_pull_requests_open_approved_count',
            help: 'Total number of open pull requests with an approved review',
            labelNames: ['owner'],
        });
        this.githubPullRequestsOpenWaitingApprovalGauge = new Gauge({
            name: 'github_pull_requests_open_waiting_approval_count',
            help: 'Total number of open pull requests waiting to be approved',
            labelNames: ['owner'],
        });
        this.githubPullRequestsMergedGauge = new Gauge({
            name: 'github_pull_requests_merged_count',
            help: 'Total number of merged pull requests',
            labelNames: ['owner'],
        });
        this.githubRepoBranchesGauge = new Gauge({
            name: 'github_repo_branch_count',
            help: 'Total number of branches',
            labelNames: ['owner', 'repo'],
        });
    }
}

const metrics = new Metrics();
export {
    metrics,
};
