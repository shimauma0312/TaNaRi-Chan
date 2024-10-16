FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt-get update -y && apt-get install -y openssl

# package.jsonとpackage-lock.jsonをコピー
COPY src/package.json src/package-lock.json ./

# 依存関係をインストール（package.jsonのsetup：）
RUN npm run setup

# Prismaのスキーマファイルをコピー
COPY src/prisma ./prisma

# アプリケーションのソースコードをコピー
COPY src .

CMD ["npm", "run", "dev"]
