FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt-get update -y && apt-get install -y openssl

# package.jsonとpackage-lock.jsonをコピー
COPY src/package.json src/package-lock.json ./

# Prismaのスキーマファイルをコピー
COPY src/prisma ./prisma

# 依存関係をインストール --legacy-peer-deps
RUN npm install

RUN npx prisma generate

# アプリケーションのソースコードをコピー
COPY src .

CMD ["npm", "run", "dev"]
