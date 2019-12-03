const logger = require('./logger');
const metrics = require('./metrics');

function processRepoPulls(octokit, repository) {
    return new Promise(async resolve => {
        let pullOpen = 0;
        let pullClose = 0;
        const options = octokit.pulls.list.endpoint.merge({ owner: repository.owner.login, repo: repository.name, sort: 'updated', state: 'all', per_page: 100 });
        for await (const response of octokit.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            for (let i = 0; i < response.data.length; i++) {
                const pull = response.data[i];
                if (pull.state === 'open') {
                    pullOpen += 1;
                } else {
                    pullClose += 1;
                }
            }
        }
        metrics.githubRepoPullRequestsCloseGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullClose,
        );
        metrics.githubRepoPullRequestsOpenGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullOpen,
        );
        metrics.githubRepoPullRequestsGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pullClose + pullOpen,
        );
        resolve();
    });
}

function processPulls(octokit, organisation) {
    return new Promise(async resolve => {
        const promises = [];
        promises.push([
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr is:open`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsOpenGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr is:closed`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsCloseGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr is:merged`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsMergedGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr is:open review:approved`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsOpenApprovedGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
            octokit.search.issuesAndPullRequests({ q: `org:${organisation} is:pr is:open review:none`, per_page: 1 }).then(result => {
                metrics.githubPullRequestsOpenWaitingApprovalGauge.set(
                    { owner: organisation },
                    result.data.total_count,
                );
            }),
        ]);
        await Promise.all(promises);
        resolve();
    });
}

function processBranches(octokit, repository) {
    return new Promise(async resolve => {
        let branchCount = 0;
        const options = octokit.repos.listBranches.endpoint.merge({ owner: repository.owner.login, repo: repository.name, sort: 'updated', per_page: 100 });
        for await (const response of octokit.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            branchCount += response.data.length;
        }
        metrics.githubRepoBranchesGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            branchCount,
        );
        resolve();
    });
}

exports.processOrganisationRepositories = function processOrganisationRepositories(octokit, organisation) {
    return new Promise(async resolve => {
        let repositoryCount = 0;
        let repositoryPrivateCount = 0;
        let repositoryPublicCount = 0;
        const promises = [];

        promises.push(processPulls(octokit, organisation));
        const options = octokit.repos.listForOrg.endpoint.merge({ org: organisation, sort: 'updated', per_page: 100 });
        for await (const response of octokit.paginate.iterator(options)) { // eslint-disable-line no-restricted-syntax
            repositoryCount += response.data.length;
            for (let i = 0; i < response.data.length; i++) {
                const repository = response.data[i];
                if (repository.private) {
                    repositoryPrivateCount += 1;
                } else {
                    repositoryPublicCount += 1;
                }
                metrics.githubRepoStarsGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.stargazers_count,
                );
                metrics.githubRepoForksGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.forks_count,
                );
                metrics.githubRepoOpenIssuesGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.open_issues_count,
                );

                promises.push(processRepoPulls(octokit, repository));
                promises.push(processBranches(octokit, repository));
            }
        }
        logger.debug(`Processing ${repositoryCount} repositories`);
        metrics.githubRepoGauge.set(
            { owner: organisation },
            repositoryCount,
        );
        metrics.githubRepoPrivateGauge.set(
            { owner: organisation },
            repositoryPrivateCount,
        );
        metrics.githubRepoPublicGauge.set(
            { owner: organisation },
            repositoryPublicCount,
        );
        await Promise.all(promises);
        resolve();
    });
};
