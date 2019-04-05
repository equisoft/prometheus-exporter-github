# prometheus-exporter-github
prometheus-exporter-github

# Build and Run
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
