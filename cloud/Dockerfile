# 리드나우 클라우드 수집 — Cloud Run (서울 asia-northeast3)
FROM node:22-slim
# 크롬(헤드리스) + 한글 글꼴
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-noto-cjk ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV CHROME_PATH=/usr/bin/chromium NODE_ENV=production TZ=Asia/Seoul
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY *.js ./
CMD ["node", "index.js"]
