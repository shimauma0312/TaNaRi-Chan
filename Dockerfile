FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt update -y && apt install -y openssl

# アプリケーションのソースコードをコピー
COPY ./src ./

# 依存関係をインストール --legacy-peer-deps
RUN npm install --legacy-peer-deps

RUN npx prisma generate

CMD ["npm", "run", "dev"]
