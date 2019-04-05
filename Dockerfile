  
FROM node:10.11-alpine

WORKDIR /app

COPY package*.json .

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 80
ENTRYPOINT [ "/usr/local/bin/yarn" ]
CMD [ "start" ]
