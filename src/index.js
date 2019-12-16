const express = require('express');
const Prometheus = require('prom-client');
const Octokit = require('@octokit/rest')
    .plugin(require('@octokit/plugin-throttling'))
    .plugin(require('@octokit/plugin-retry'));
const config = require('./config');
const logger = require('./logger');
const github = require('./github');

// Debug environment configuration
logger.silly('Environment variables');
logger.silly(process.env);
logger.silly('Configuration');
logger.silly(config);

// Github client initialization
const octokit = new Octokit({
    auth: config.github.token,
    log: logger,
    throttle: {
        onRateLimit: (retryAfter, options) => {
            logger.silly(`Request quota exhausted for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
            return true;
        },
        onAbuseLimit: (retryAfter, options) => {
            logger.warn(`Request abuse detected for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
            return true;
        },
    },
});
octokit.hook.before('request', async options => {
    logger.debug(`New request ${options.method} ${options.url}`);
});
octokit.hook.after('request', async (response, options) => {
    logger.debug(`Request ${options.method} ${options.url} finished`);
});
octokit.hook.error('request', async (error, options) => {
    logger.error(`Request ${options.method} ${options.url} error`);
    logger.error(`${error}`);
    return {};
});

// Start the madness
async function fetchGithubData() {
    try {
        logger.debug('Triggering github data fetch');
        await github.processOrganisationRepositories(octokit, config.organisation);
        logger.debug('Github data fetch complete');
    } catch (e) {
        logger.error('Github data fetch crashed');
        logger.error(e);
    } finally {
        logger.debug('Github data fetch will restart in 1200000ms');
        setTimeout(fetchGithubData, 1200000);
    }
}
fetchGithubData();

// HTTP servers
const app = express();

app.get('/metrics', async (req, res) => {
    logger.info('/metrics hit');
    res.set('Content-Type', Prometheus.register.contentType);
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
