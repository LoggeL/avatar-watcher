FROM node:18-slim

RUN apt-get update && apt-get install -y python3 make g++ build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# data.sqlite persists via bind mount at /app/data/
# Symlink so the bot finds it at ./data.sqlite
RUN rm -f data.sqlite && ln -s /app/data/data.sqlite data.sqlite

CMD ["node", "index.js"]
