const express = require('express');
const winston = require('winston');
// const Octokit = require('@octokit/rest');

winston.add(new winston.transports.Console());
// const octokit = new Octokit();
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
