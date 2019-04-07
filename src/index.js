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
    log: {
        debug: logger.debug,
        info: logger.info,
        warn: logger.warn,
        error: logger.error,
    },
});

// HTTP servers
const app = express();
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/metrics', async (req, res) => {
    res.json({ message: 'Hello metrics' });
});

const server = app.listen(80, () => {
    logger.info('App server listening on port 80!');
});


['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => {
    logger.info(`Received signal ${signal}'`);
    server.close(err => {
        logger.info('Server is stopping');
        if (err) {
            logger.error(err);
            process.exit(1);
        }
        process.exit(0);
    });
}));
