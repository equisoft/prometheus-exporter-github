const express = require('express');
const Octokit = require('@octokit/rest');
const config = require('./config');
const logger = require('./logger');

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
    res.json({ message: 'Hello metrics' });
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
