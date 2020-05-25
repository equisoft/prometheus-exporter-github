import { instance, mock, verify, when, anyOfClass, spy, anyNumber, anything } from 'ts-mockito';
import { ResolvePromiseMethodStub } from 'ts-mockito/lib/stub/ResolvePromiseMethodStub.js';

// Mocks
import { GithubRepository } from '../../src/GithubRepository';
import { Logger } from '../../src/Logger';
import { Metrics } from '../../src/Metrics';

// Subject
import { GithubExtractor } from '../../src/GithubExtractor';

const config = { organisation: 'fakeOrganisation' };
const fakeRepository = { owner: { login: 'a login' }, name: 'fakeRepository' };

const mockedGithubRepository: GithubRepository = mock(GithubRepository);
const mockedLogger: Logger = mock(Logger);
const mockedMetrics: Metrics = mock(Metrics);

describe('GithubExtractor', () => {
    it('process repository pulls', async () => {

        when(mockedGithubRepository.getPullsForRepository(fakeRepository))
            .thenResolve([ { state: 'close' }, { state: 'close' }, { state: 'open' } ]);

        const githubExtractor = new GithubExtractor(instance(mockedGithubRepository),
            instance(mockedLogger),
            instance(mockedMetrics),
            config);
        await githubExtractor.processRepoPulls(fakeRepository);

        verify(mockedMetrics.setRepoPullRequestsCloseGauge(anyOfClass(Object), 2)).once();
        verify(mockedMetrics.setRepoPullRequestsOpenGauge(anyOfClass(Object), 1)).once();
        verify(mockedMetrics.setRepoPullRequestsGauge(anyOfClass(Object), 3)).once();

    });

    it('process pulls', async () => {

        when(mockedGithubRepository.getPRCount()).thenResolve(1);
        when(mockedGithubRepository.getPROpenCount()).thenResolve(2);
        when(mockedGithubRepository.getPRCloseCount()).thenResolve(3);
        when(mockedGithubRepository.getPRMergedCount()).thenResolve(4);
        when(mockedGithubRepository.getPROpenAndApproved()).thenResolve(5);
        when(mockedGithubRepository.getPROpenAndNotApproved()).thenResolve(6);

        const githubExtractor = new GithubExtractor(instance(mockedGithubRepository),
            instance(mockedLogger),
            instance(mockedMetrics),
            config);
        await githubExtractor.processPulls();

        verify(mockedMetrics.setPullRequestsGauge(anyOfClass(Object), 1)).once();
        verify(mockedMetrics.setPullRequestsOpenGauge(anyOfClass(Object), 2)).once();
        verify(mockedMetrics.setPullRequestsCloseGauge(anyOfClass(Object), 3)).once();
        verify(mockedMetrics.setPullRequestsMergedGauge(anyOfClass(Object), 4)).once();
        verify(mockedMetrics.setPullRequestsOpenApprovedGauge(anyOfClass(Object), 5)).once();
        verify(mockedMetrics.setPullRequestsOpenWaitingApprovalGauge(anyOfClass(Object), 6)).once();

    });

    it('process branches', async () => {
        const branchCount = 352;
        when(mockedGithubRepository.getCountofBranchesInRepository(fakeRepository)).thenResolve(branchCount);

        const githubExtractor = new GithubExtractor(instance(mockedGithubRepository),
            instance(mockedLogger),
            instance(mockedMetrics),
            config);
        await githubExtractor.processBranches(fakeRepository);

        verify(mockedMetrics.setRepoBranchesGauge(anyOfClass(Object), branchCount)).once();

    });

    it('process organisation repositories', async () => {
        const repo1 = {
            private: true,
            stargazers_count: 3,
            forks_count: 0,
            open_issues_count: 500,
            owner: { login: 'a login' },
            name: 'fakeRepository1',
        };
        const repo2 = {
            private: false,
            stargazers_count: 4,
            forks_count: 2,
            open_issues_count: 450,
            owner: { login: 'a login' },
            name: 'fakeRepository2',
        };
        const repo3 = {
            private: true,
            stargazers_count: 5,
            forks_count: 4,
            open_issues_count: 350,
            owner: { login: 'a login' },
            name: 'fakeRepository3',
        };

        when(mockedGithubRepository.getRepositoryListForOrg()).thenResolve([ repo1, repo2, repo3]);
        when(mockedGithubRepository.getPullsForRepository(anyOfClass(Object))).thenResolve([]);

        const githubExtractor = new GithubExtractor(instance(mockedGithubRepository),
            instance(mockedLogger),
            instance(mockedMetrics),
            config);

        await githubExtractor.processOrganisationRepositories();

        verify(mockedMetrics.setRepoStarsGauge(anyOfClass(Object), 3)).once();
        verify(mockedMetrics.setRepoStarsGauge(anyOfClass(Object), 4)).once();
        verify(mockedMetrics.setRepoStarsGauge(anyOfClass(Object), 5)).once();
        verify(mockedMetrics.setRepoStarsGauge(anyOfClass(Object), anyNumber())).thrice();

        verify(mockedMetrics.setRepoForksGauge(anyOfClass(Object), 0)).once();
        verify(mockedMetrics.setRepoForksGauge(anyOfClass(Object), 2)).once();
        verify(mockedMetrics.setRepoForksGauge(anyOfClass(Object), 4)).once();
        verify(mockedMetrics.setRepoForksGauge(anyOfClass(Object), anyNumber())).thrice();

        verify(mockedMetrics.setRepoOpenIssuesGauge(anyOfClass(Object), 500)).once();
        verify(mockedMetrics.setRepoOpenIssuesGauge(anyOfClass(Object), 450)).once();
        verify(mockedMetrics.setRepoOpenIssuesGauge(anyOfClass(Object), 350)).once();
        verify(mockedMetrics.setRepoOpenIssuesGauge(anyOfClass(Object), anyNumber())).thrice();

        verify(mockedMetrics.setRepoGauge(anyOfClass(Object), 3)).once();
        verify(mockedMetrics.setRepoPrivateGauge(anyOfClass(Object), 2)).once();
        verify(mockedMetrics.setRepoPublicGauge(anyOfClass(Object), 1)).once();
    });
});
