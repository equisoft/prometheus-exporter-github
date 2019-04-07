const express = require('express');
const winston = require('winston');
const Octokit = require('@octokit/rest');

// Configuration parsing
const repositories = process.env.GITHUB_REPOSITORIES.split(',').map(element => {
    let owner = '';
    let repository = '';
    [owner, repository] = element.split('/');
    return { owner, repository };
});
const config = {
    repositories,
    github: {
        token: process.env.GITHUB_TOKEN || 'MISSING',
    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
    },
};

// Log initialization
winston.level = config.log.level;
winston.add(new winston.transports.Console());

// Debug environment configuration
winston.silly(process.env);
winston.silly(config);

// Github client initialization
const octokit = new Octokit({
    auth: config.github.token,
    log: {
        debug: winston.debug,
        info: winston.info,
        warn: winston.warn,
        error: winston.error,
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
    winston.info('App server listening on port 80!');
});


['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => {
    winston.info(`Received signal ${signal}'`);
    server.close(err => {
        winston.info('Server is stopping');
        if (err) {
            winston.error(err);
            process.exit(1);
        }
        process.exit(0);
    });
}));
