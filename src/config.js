const repositories = process.env.GITHUB_REPOSITORIES.split(',').map(element => {
    let owner = '';
    let repository = '';
    [owner, repository] = element.split('/');
    return { owner, repository };
});

module.exports = {
    repositories,
    github: {
        token: process.env.GITHUB_TOKEN || 'MISSING',
    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
    },
};
