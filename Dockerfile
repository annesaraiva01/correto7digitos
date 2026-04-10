FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json ./
RUN npm install
RUN npm install typescript --save-dev

COPY . .
RUN npx tsc

EXPOSE 3000
CMD ["node", "dist/server.js"]
