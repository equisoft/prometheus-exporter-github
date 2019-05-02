const logger = require('./logger');
const metrics = require('./metrics');

exports.processOrganisationRepositories = function(octokit, organisation) {
    return new Promise ( async (resolve) => {
        let repository_count = 0;
        let repository_private_count = 0;
        let repository_public_count = 0;
        let promises = [];
        const options = octokit.repos.listForOrg.endpoint.merge({ org: organisation, sort: 'updated', per_page: 100 });
        for await (const response of octokit.paginate.iterator(options)) {
            repository_count += response.data.length;
            for( i = 0; i < response.data.length; i++) {
                let repository = response.data[i];
                if (repository.private) {
                    repository_private_count += 1;
                } else {
                    repository_public_count += 1;
                }
                metrics.githubRepoStarsGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.stargazers_count
                );
                metrics.githubRepoForksGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.forks_count
                );
                metrics.githubRepoOpenIssuesGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    repository.open_issues_count
                );

                // promises.push(processPulls(octokit, repository));
                promises.push(processBranches(octokit, repository));
            }
        }
        logger.debug(`Processing ${repository_count} repositories`); 
        metrics.githubRepoGauge.set(
            { owner: organisation },
            repository_count
        );
        metrics.githubRepoPrivateGauge.set(
            { owner: organisation },
            repository_private_count
        );
        metrics.githubRepoPublicGauge.set(
            { owner: organisation },
            repository_public_count
        );
        await Promise.all(promises);
        resolve();
    });
}

function processPulls(octokit, repository) {
    return new Promise( async (resolve) => {
        let promises = [];
        let pull_count = 0;

        promises.push([
            octokit.search.issuesAndPullRequests( { q: `repo:${repository.full_name} is:open`, per_page: 1 } ).then( (result) => {
                pull_count += result.data.total_count;
                metrics.githubRepoPullRequestsOpenGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    result.data.total_count
                );
            }),
            octokit.search.issuesAndPullRequests( { q: `repo: ${repository.full_name} is:pr is:closed`, per_page: 1 } ).then( (result) => {
                pull_count += result.data.total_count;
                metrics.githubRepoPullRequestsCloseGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    result.data.total_count
                );
            }),
            octokit.search.issuesAndPullRequests( { q: `repo:${repository.full_name} is:pr is:open review:approved`, per_page: 1 } ).then( (result) => {
                metrics.githubRepoPullRequestsOpenApprovedGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    result.data.total_count
                );
            }),
            octokit.search.issuesAndPullRequests( { q: `repo:${repository.full_name} is:pr is:open review:none`, per_page: 1 } ).then( (result) => {
                metrics.githubRepoPullRequestsOpenWaitingApprovalGauge.set(
                    { owner: repository.owner.login, repo: repository.name },
                    result.data.total_count
                );
            }),
        ]);

        await Promise.all(promises);

        metrics.githubRepoPullRequestsGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            pull_count
        );
        resolve();
    });
}

function processBranches(octokit, repository) {
    return new Promise( async (resolve) => {
        let branch_count = 0;
        const options = octokit.repos.listBranches.endpoint.merge({ owner: repository.owner.login, repo: repository.name, sort: 'updated', per_page: 100 });
        for await (const response of octokit.paginate.iterator(options)) {
            branch_count += response.data.length;
        }
        metrics.githubRepoBranchesGauge.set(
            { owner: repository.owner.login, repo: repository.name },
            branch_count
        );
        resolve();        
    });
}
