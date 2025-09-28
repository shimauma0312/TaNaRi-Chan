FROM node:lts-alpine

RUN apk add --no-cache libc6-compat openssl sudo

WORKDIR /app

RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

USER node

COPY --chown=node:node ./src ./

CMD ["npm", "run", "dev"]
