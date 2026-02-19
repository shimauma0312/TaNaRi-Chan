FROM node:24-alpine

RUN apk add --no-cache libc6-compat openssl sudo libstdc++

RUN apk add --no-cache bash

RUN npm install -g npm@latest

WORKDIR /app

RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

USER node

COPY --chown=node:node ./src ./

CMD ["npm", "run", "dev"]
