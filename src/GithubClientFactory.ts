import { Octokit } from '@octokit/rest';
import { GithubClientConfigs } from './Config';
import { Logger } from './Logger';
// tslint:disable-next-line:no-require-imports
const octokit = require('@octokit/rest').plugin(require('@octokit/plugin-throttling')).plugin(require('@octokit/plugin-retry'));

export class GithubClientFactory {
    octokitClient: Octokit;

    constructor(readonly config: GithubClientConfigs, logger: Logger) {
        this.octokitClient = new octokit({
            auth: config.token,
            log: logger,
            throttle: {
                // @ts-ignore
                onRateLimit: (retryAfter: number, options: Octokit.HookOptions): boolean => {
                    logger.warn(`Request quota exhausted for ${options.method} ${options.url} - We should not be here right now. Something's wrong`);
                    return true;
                },
                onAbuseLimit: (retryAfter: number, options: Octokit.HookOptions): boolean => {
                    logger.warn(`Request abuse detected for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
                    return true;
                },
            },
        });

        this.octokitClient.hook.before('request', async (options: Octokit.HookOptions) => {
            logger.silly(`New request ${options.method} ${options.url}`);
        });
        // @ts-ignore
        // tslint:disable-next-line:max-line-length
        this.octokitClient.hook.after('request', async (response: Octokit.Response<any>, options: Octokit.HookOptions) => {
            logger.silly(`Finished request ${options.method} ${options.url}`);
        });

        this.octokitClient.hook.error('request', async (error: Octokit.HookError, options: Octokit.HookOptions) => {
            logger.error(`Request ${options.method} ${options.url} error`);
            logger.error(error.toString());
            return {};
        });
    }

    getOctokitClient = () => this.octokitClient;
}
