const Prometheus = require('prom-client');

exports.githubRepoOpenIssuesGauge = new Prometheus.Gauge({
    name: 'github_repo_open_issues',
    help: 'Total number of open issues for given repository',
    labelNames: ['owner', 'repo'],
});
