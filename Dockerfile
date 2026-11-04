# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app
RUN chown node:node /app

FROM base AS dependencies

COPY --chown=node:node src/package.json src/package-lock.json ./
USER node
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci

FROM dependencies AS development

ENV NODE_ENV=development

COPY --chown=node:node src/ ./
COPY --chown=node:node --chmod=755 scripts/docker-development-entrypoint.sh /usr/local/bin/tanari-development-entrypoint
RUN mkdir -p .next \
  && chown node:node .next \
  && npx prisma generate

USER node

EXPOSE 3000 5555 9229

ENTRYPOINT ["tanari-development-entrypoint"]
CMD ["npm", "run", "dev"]
