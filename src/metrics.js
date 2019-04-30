const Prometheus = require('prom-client');

exports.githubRepoOpenIssuesGauge = new Prometheus.Gauge({
    name: 'github_repo_open_issues',
    help: 'Total number of open issues for given repository',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoPullRequestsGauge = new Prometheus.Gauge({
    name: 'github_repo_pull_requests',
    help: 'Total number of open pull requests',
    labelNames: ['owner', 'repo'],
});
exports.githubRepoBranchesGauge = new Prometheus.Gauge({
    name: 'github_repo_branches',
    help: 'Total number of branches',
    labelNames: ['owner', 'repo'],
});


