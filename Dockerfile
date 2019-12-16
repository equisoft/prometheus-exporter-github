FROM node:12
WORKDIR /app

ENV LOG_LEVEL="info" \
    NODE_ENV="production" \
    GITHUB_TOKEN="token" \
    GITHUB_ORGANISATION="org1" \
    HTTP_PORT=80

COPY package.json .
COPY yarn.lock .

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 80
ENTRYPOINT [ "/usr/local/bin/yarn" ]
CMD [ "start" ]
