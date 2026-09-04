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

FROM development AS build

ENV NODE_ENV=production
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build

FROM base AS production

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
