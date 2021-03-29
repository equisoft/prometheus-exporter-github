import {GithubClientConfigs} from './Config';
import {Logger} from './Logger';
import {retry} from "@octokit/plugin-retry";
import {throttling} from "@octokit/plugin-throttling";
import {Octokit} from "@octokit/rest";

const MyOctokit = Octokit.plugin(retry, throttling);

export class GithubClientFactory {
    octokitClient: Octokit;

    constructor(private readonly config: GithubClientConfigs, logger: Logger) {
        this.octokitClient = new MyOctokit({
            auth: config.token,
            log: logger,
            throttle: {
                onRateLimit: (retryAfter, options) => {
                    logger.silly(`Request quota exhausted for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
                    return true;
                },
                onAbuseLimit: (retryAfter, options) => {
                    logger.warn(`Request abuse detected for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
                    return true;
                },
            },
        });

        this.octokitClient.hook.before('request', options => {
            logger.debug(`New request ${options.method} ${options.url}`);
        });
        this.octokitClient.hook.after('request', (response, options) => {
            logger.debug(`Request ${options.method} ${options.url} finished`);
        });
        this.octokitClient.hook.error('request', (error, options) => {
            logger.error(`Request ${options.method} ${options.url} error`);
            logger.error(`${error}`);
            return {};
        });
    }

    getOctokitClient = () => this.octokitClient;
}
