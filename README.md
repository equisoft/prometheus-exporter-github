# prometheus-exporter-github
prometheus-exporter-github

## Development
### Build && Run
```
docker build . -t prometheus-exporter-github
docker run -e GITHUB_REPOSITORIES=owner1/repo1 -e LOG_LEVEL=silly -p 80:80 --rm -it prometheus-exporter-github
```
Server is accessible on http://localhost

For development, add sources
```
cd prometheus-exporter-github
docker run -e GITHUB_TOKEN=your-github-personnal-token -e GITHUB_REPOSITORIES=owner1/repo1 -e LOG_LEVEL=silly -v $(pwd):/app -p 80:80 --rm -it prometheus-exporter-github
```

### Integration with Prometheus
A docker-compose file provide integration with prometheus server.
```
export GITHUB_TOKEN=your-github-personnal-token
export GITHUB_REPOSITORIES=owner1/repo1
docker-compose up
```

### Lint
```
docker run -v $(pwd):/app --rm -it prometheus-exporter-github eslint
```

## Environment Variables
#### LOG_LEVEL
Value in `silly`, `debug`, `verbose`, `info`, `warn`, `error`.
Default `info`.
See [winston](https://www.npmjs.com/package/winston).
#### LOG_FORMAT
Value in `json`, `prettyPrint`. Some format described in winston documentation may not be working so stick with `prettyPrint` or `json` unless you know what you are doing.
Default `json`.
See [log format](https://github.com/winstonjs/logform#formats) for more possible format.
#### NODE_ENV
Value in `development`, `production`.
Default `production`.
#### GITHUB_TOKEN
Personal access token, OAuth access token, GitHub app bearer token or GitHub app installation token. If you need access to private repositories add the whole `repo` scope.
See [get a Github token](https://github.com/settings/developers).
#### GITHUB_REPOSITORIES
Comma separated value of `owner/repository`.
Example `owner1/repo1,owner2/repo2`.
#### HTTP_PORT
Port number the http server will listen to.
Default `80`.
