  
FROM node:10.11-alpine

WORKDIR /app

COPY package*.json .

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 80
CMD [ "yarn", "start" ]
