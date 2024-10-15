FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt-get update -y && apt-get install -y openssl

# package.jsonとpackage-lock.jsonをコピー
COPY src/package.json src/package-lock.json ./

# 依存関係をインストール
RUN npm install

# Prisma CLIと@prisma/clientをインストール
RUN npm install prisma @prisma/client

# Prismaのスキーマファイルをコピー
COPY prisma ./prisma

# アプリケーションのソースコードをコピー
COPY src .

# Prismaのマイグレーションを実行
RUN npx prisma generate

CMD ["npm", "run", "dev"]
