import {Gauge} from "prom-client";

export class Metrics {
    readonly repoGauge: Gauge;
    readonly repoPublicGauge: Gauge;
    readonly repoPrivateGauge: Gauge;
    readonly repoStarsGauge: Gauge;
    readonly repoForksGauge: Gauge;
    readonly repoOpenIssuesGauge: Gauge;
    readonly repoPullRequestsGauge: Gauge;
    readonly repoPullRequestsOpenGauge: Gauge;
    readonly repoPullRequestsCloseGauge: Gauge;
    readonly pullRequestsGauge: Gauge;
    readonly pullRequestsOpenGauge: Gauge;
    readonly pullRequestsCloseGauge: Gauge;
    readonly pullRequestsOpenApprovedGauge: Gauge;
    readonly pullRequestsOpenWaitingApprovalGauge: Gauge;
    readonly pullRequestsMergedGauge: Gauge;
    readonly repoBranchesGauge: Gauge;

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
            labelNames: ['owner', 'repo', 'reviewer'],
        });
        this.repoPullRequestsCloseGauge = new Gauge({
            name: 'github_repo_pull_requests_close_count',
            help: 'Total number of closed pull requests',
            labelNames: ['owner', 'repo'],
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
    }
}

const metrics = new Metrics();
export {
    metrics,
};
