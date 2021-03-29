FROM node:14 AS builder
WORKDIR /app

COPY . .

RUN yarn install --dev && yarn build

FROM node:14-slim
WORKDIR /app

ENV LOG_LEVEL="info" \
    NODE_ENV="production" \
    GITHUB_TOKEN="token" \
    GITHUB_ORGANIZATION="org1" \
    HTTP_PORT=8080

COPY package.json .
COPY yarn.lock .
COPY --from=builder /app/dist ./dist
RUN yarn install

USER 1000

EXPOSE 8080
CMD ["node", "dist/index.js"]
