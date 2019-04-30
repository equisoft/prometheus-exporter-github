const express = require('express');
const Prometheus = require('prom-client');
const Octokit = require('@octokit/rest');
const NodeCache = require('node-cache');
const config = require('./config');
const logger = require('./logger');
const { githubRepoOpenIssuesGauge, githubRepoPullRequestsGauge, githubRepoBranchesGauge } = require('./metrics');

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

// Caching initialization
const caching = new NodeCache({
    stdTTL: 3600
});

// HTTP servers
const app = express();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType);
    let metrics = caching.get('metrics');
    if (metrics === undefined) {
        logger.debug('Cache miss - fetching all github data');
        let promises = [];
        const options = octokit.repos.listForOrg.endpoint.merge({ org: config.organisation, sort: 'updated' });
        for await (const response of octokit.paginate.iterator(options)) {
            response.data.reduce(async (previousPromise, repository) => {
                acc = await previousPromise;
                acc.push(
                    new Promise(resolve => {
                        githubRepoOpenIssuesGauge.set({ owner: repository.owner.login, repo: repository.name }, repository.open_issues_count);
                        resolve();
                    }),
                    new Promise(async resolve => {
                        pulls = await octokit.pulls.list({ owner: repository.owner.login, repo: repository.name });
                        githubRepoPullRequestsGauge.set( { owner: repository.owner.login, repo: repository.name }, pulls.data.length);
                        resolve();
                    }),
                    new Promise(async resolve => {
                        branches = await octokit.repos.listBranches({ owner: repository.owner.login, repo: repository.name });
                        githubRepoBranchesGauge.set( { owner: repository.owner.login, repo: repository.name }, branches.data.length);
                        resolve();
                    }),
                );
                return acc;
            }, Promise.resolve(promises));
        }
        await Promise.all(promises);

        metrics = Prometheus.register.metrics();
        const ratelimit = await octokit.rateLimit.get();
        // Github rate limit reset after 1 hour (3600 seconds)
        const cacheTTL = 3600/Math.ceil(ratelimit.data.rate.limit/(ratelimit.data.rate.limit - ratelimit.data.rate.remaining)); 
        logger.debug(`Cache TTL is set to ${cacheTTL} seconds`);
        logger.silly(`Github rate limit left is ${ratelimit.data.rate.remaining}/${ratelimit.data.rate.limit}. Reset will occur at ${ratelimit.data.rate.reset} epoch timestamp`);
        caching.set('metrics', metrics, cacheTTL);
    }

    res.end(metrics);
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
