# 리드나우 클라우드 수집 — Cloud Run (서울 asia-northeast3)
FROM node:22-slim
# 크롬(헤드리스) + 한글 글꼴
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-noto-cjk ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV CHROME_PATH=/usr/bin/chromium NODE_ENV=production TZ=Asia/Seoul
WORKDIR /app
# (0.11.0) package-lock.json이 있으면 그 판 그대로(npm ci — 다시 배포해도 같은 프로그램), 없으면 예전처럼
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi
COPY *.js ./
CMD ["node", "index.js"]
