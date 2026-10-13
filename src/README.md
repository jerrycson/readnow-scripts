# 리드나우 원본 (빌드 전 파일)

이 폴더가 **고치는 원본**입니다. 저장소 맨 위·`app/`의 파일은 여기서 만든 결과물입니다.

| 파일 | 무엇 |
|---|---|
| `app.html` | 웹앱 원본 (한 파일) → `app/index.html`(틀) + `app/readnow-webapp.js`(본문)로 나뉨 |
| `readnow-collector.src.js` | Tampermonkey 수집기 원본 (한 파일) → `readnow-collector.user.js`(본체) + `readnow-pc-*.js`(모듈 5개) + `pc-live.json`(빠른 업데이트 목록) |
| `split.js` | 수집기 나누기 (관문: 모듈을 이으면 원본과 글자 하나까지 같아야 함) |
| `release.js` | 판 번호·노선표 핀·웹앱 나누기·빠른 업데이트 목록 검사 (하나라도 틀리면 멈춤) |
| `sw.js` | 웹앱 서비스 워커 |
| `tests/` | 회귀 시험(`tests/cmp/run.sh`)·기능 시험 — 경로는 작업 상자 기준(/home/claude/w, scratchpad) |

공용 파일(`readnow-*-core.js`, `readnow-registry.js`)과 클라우드(`cloud/`)는 저장소 맨 위·`cloud/`에 원본 그대로 있습니다.

## 다시 만들기
```
mkdir -p /home/claude/w && cp src/app.html src/split.js src/release.js src/sw.js /home/claude/w/
cp src/readnow-collector.src.js /home/claude/w/readnow-collector.user.js
cp readnow-*-core.js readnow-registry.js /home/claude/w/ ; cp -r cloud /home/claude/w/
cd /home/claude/w && node split.js && node release.js
```
- 이번에 안 바꾼 공용 파일(`readnow-core.js` 등)·가격 감시기는 `release.js`가 저장소(`/home/claude/readnow-scripts/`) 사본으로 점검합니다(자동 점검 2026-10-13 — 전엔 옛 대화의 임시 폴더를 가리켜 '파일 없음'으로 멈췄음).
- 결과물 맞추기: `out/app/*` → `app/`, `out/readnow-collector.user.js`·`out/readnow-pc-*.js`·`out/pc-live.json` → 저장소 맨 위.
