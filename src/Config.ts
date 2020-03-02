export interface ServerConfigs {
    port: number;
}

export interface GithubClientConfigs {
    token: string
}

export interface GithubConfigs {
    organisation: string
}

export interface LogsConfigs {
    level: string
    format: string
}


export interface ConfigsInterface {
    github: GithubConfigs
    server: ServerConfigs
    log: LogsConfigs
    timeBetweenExtractionInMS: number;
}

export class Configs implements ConfigsInterface {
    github: GithubConfigs;
    githubClient: GithubClientConfigs;
    server: ServerConfigs;
    log: LogsConfigs;
    timeBetweenExtractionInMS: number;

    constructor() {
        Object.assign(this, {
            github: {
                organisation: process.env.GITHUB_ORGANISATION,
            },
            githubClient: {
                token: process.env.GITHUB_TOKEN || 'MISSING'
            },
            log: {
                level: process.env.LOG_LEVEL || 'debug',
                format: process.env.LOG_FORMAT || 'json'
            },
            server: {
                port: process.env.HTTP_PORT || 80
            },
            // 20 min in MS
            timeBetweenExtractionInMS: 1200000
        });
    }
}

const configs = new Configs();
export {
    configs,
};
