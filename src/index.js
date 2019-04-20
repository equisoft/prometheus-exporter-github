const express = require('express');
const Prometheus = require('prom-client');
const Octokit = require('@octokit/rest');
const config = require('./config');
const logger = require('./logger');
const { githubRepoOpenIssuesGauge } = require('./metrics');

// Debug environment configuration
logger.silly('Environment variables');
logger.silly(process.env);
logger.silly('Configuration');
logger.silly(config);

// Github client initialization
const octokit = new Octokit({
    auth: config.github.token,
    log: logger,
});

// HTTP servers
const app = express();
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType);

    const promises = config.repositories.map(async (repository) => {
        const { data } = await octokit.repos.get({
            owner: repository.owner,
            repo: repository.repository,
        });
        githubRepoOpenIssuesGauge.set({ owner: repository.owner, repo: repository.repository }, data.open_issues_count);
    });
    await Promise.all(promises);

    res.end(Prometheus.register.metrics());
});

const server = app.listen(config.http.port, () => {
    logger.info(`App server listening on port ${config.http.port}!`);
});

['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => {
    logger.info(`Received signal ${signal}'`);
    server.close(err => {
        logger.info('Server is stopping');
        if (err) {
            logger.error(err);
        }
        process.exit(0);
    });
    // Make sure we forcefully stop the server even if server is still responding
    setTimeout(() => {
        logger.warn('Could not close connections in time, forcefully shutting down');
        process.exit(0);
    }, 2000);
}));
