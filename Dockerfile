FROM node:lts-buster-slim

WORKDIR /app

# OpenSSLをインストール
RUN apt update -y && apt install -y openssl

# アプリケーションのソースコードをコピー
COPY ./src ./

CMD ["npm", "run", "dev"]
