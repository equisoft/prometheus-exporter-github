FROM node:11-alpine
WORKDIR /app

ENV LOG_LEVEL="info" \
    NODE_ENV="production" \
    GITHUB_TOKEN="token" \
    GITHUB_REPOSITORIES="owner1/repo1,owner2/repo2" \
    HTTP_PORT=80

COPY package*.json .

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 80
ENTRYPOINT [ "/usr/local/bin/yarn" ]
CMD [ "start" ]
