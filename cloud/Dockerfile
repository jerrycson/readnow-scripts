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
# (0.35.146) --expose-gc: 🗣 구매평 요약 셈(cloud/voice.js)이 큰 묶음 사이에 다 쓴 문서를 치움(메모리 막이)
# (0.35.150 voice2) 힙 한도 1GB(2Gi 컨테이너의 V8 기본)에 판매가치 배우기가 걸려 10분마다 죽음 → 1300MB(크롬·버퍼 몫 700MB 남김) · 그래도 죽으면 🧯 HV가 그 일을 쉬게 함
CMD ["node", "--expose-gc", "--max-old-space-size=1300", "index.js"]
