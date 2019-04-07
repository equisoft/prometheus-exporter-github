# prometheus-exporter-github
prometheus-exporter-github

## Development
### Build && Run
```
docker build . -t prometheus-exporter-github
docker run -p 80:80 --rm -it prometheus-exporter-github
```
Server is accessible on http://localhost

For development, add sources
```
cd prometheus-exporter-github
docker run -v $(pwd):/app -p 80:80 --rm -it prometheus-exporter-github
```

### Lint
```
docker run -v $(pwd):/app --rm -it prometheus-exporter-github eslint
```

## Environment Variables
#### LOG_LEVEL
A value in `silly`, `debug`, `verbose`, `info`, `warn`, `error`.
Default `info`.
See [winston](https://www.npmjs.com/package/winston).
#### NODE_ENV
A value in `development`, `production`.
Default `production`.
#### GITHUB_TOKEN
A personal access token, OAuth access token, GitHub app bearer token or GitHub app installation token.
See [get a Github token](https://github.com/settings/developers)
#### GITHUB_REPOSITORIES
A comma separated value of `owner/repository`.
Example `owner1/repo1,owner2/repo2`


