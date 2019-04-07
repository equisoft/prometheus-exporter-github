const express = require('express');
const Prometheus = require('prom-client');
const Octokit = require('@octokit/rest');
const config = require('./config');
const logger = require('./logger');
const { githubRepoOpenIssuesGauge } = require('./metrics');

// Debug environment configuration
logger.silly(process.env);
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

    const { data } = await octokit.repos.get({
        owner: config.repositories[0].owner,
        repo: config.repositories[0].repository,
    });

    githubRepoOpenIssuesGauge.set({ repo: config.repositories[0].repository }, data.open_issues_count);

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
