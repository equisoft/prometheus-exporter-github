const Prometheus = require('prom-client');

exports.githubRepoGauge = new Prometheus.Gauge({
    name: 'github_repo_count',
    help: 'Total number of repository',
    labelNames: ['owner'],
});
exports.githubRepoPublicGauge = new Prometheus.Gauge({
    name: 'github_repo_public_count',
    help: 'Total number of public repository',
    labelNames: ['owner'],
});
exports.githubRepoPrivateGauge = new Prometheus.Gauge({
    name: 'github_repo_private_count',
    help: 'Total number of private repository',
    labelNames: ['owner'],
});
exports.githubRepoStarsGauge = new Prometheus.Gauge({
    name: 'github_repo_stars_count',
    help: 'Total number of repository stars',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoForksGauge = new Prometheus.Gauge({
    name: 'github_repo_forks_count',
    help: 'Total number of repository forks',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoOpenIssuesGauge = new Prometheus.Gauge({
    name: 'github_repo_open_issues_count',
    help: 'Total number of repository open issues',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests_count',
    help: 'Total number of pull requests',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsOpenGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests_open_count',
    help: 'Total number of open pull requests',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsCloseGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests_close_count',
    help: 'Total number of closed pull requests',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsOpenApprovedGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests_open_approved_count',
    help: 'Total number of open pull requests with an approved review',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsOpenWaitingApprovalGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests_open_waiting_approval_count',
    help: 'Total number of open pull requests waiting to be approved',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoBranchesGauge = new Prometheus.Gauge({
    name: 'github_repo_branch_count',
    help: 'Total number of branches',
    labelNames: ['owner', 'repo'],
});
