FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt-get update -y && apt-get install -y openssl

# アプリケーションのソースコードをコピー
COPY ./src ./

# 依存関係をインストール --legacy-peer-deps
RUN npm install

RUN npx prisma generate

CMD ["npm", "run", "dev"]
