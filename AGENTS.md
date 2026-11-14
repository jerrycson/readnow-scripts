# 리드나우 — 어느 AI든(Claude·ChatGPT·Codex 등) 이 저장소로 일을 시작할 때

이 저장소는 공개입니다. 규칙은 같은 자리의 `CLAUDE.md`와 똑같이 따릅니다(이름만 다를 뿐 모든 AI에 적용).

1. 먼저 협업 문서를 읽습니다 — ChatGPT·Codex는 비공개 `jerrycson/readnow-collab`의 `STATE.md`(지금 상태 한 장) → `AGENTS.md` → `AI_COLLAB/PROTOCOL.md` · Claude는 비공개 `jerrycson/readnow-chats`(원본 장부). 어느 쪽도 못 읽으면 일을 시작하지 말고 그렇다고 말합니다.
2. 구성·규칙의 기준은 이 저장소 `src/PROJECT_STATE.md`. 큰 파일(`src/app.html` 등)은 통째로 읽지 말고 찾아서 필요한 범위만.
3. 정범님이 보는 글(답·커밋 글·PR 제목과 본문·판 설명)은 모두 한국어 · 호칭은 '정범님'.
4. **이 저장소는 공개입니다** — 코드·주석·시험·커밋 글·PR에 대화 내용·비밀값·손님 이름·전화·주소·주문 번호를 절대 넣지 않습니다(손님A로). `*.storage.json`·rn-cred·알라딘/예스24 계정은 어디에도 넣지 않습니다.
5. 수집기 머리(`node release.js`의 HSIG)가 바뀌는 고침은 정범님 허락 없이 하지 않습니다.
6. **ChatGPT·Codex**: `codex/<일 이름>` 가지 + PR까지만 — main에 직접 push하지 않고, 판 번호·결과물(`app/`·`readnow-*.js`·`pc-live.json`)은 손대지 않습니다(원본 `src/`만 고침). Claude가 순서표(`src/tools/worklock.sh`) 안에서 main 최신을 합치고 빌드·판 번호·시험(`src/tools/ship-check.sh`)을 맞춰 판으로 냅니다. PR 본문에 「무엇을·왜·어떻게 확인했나·안 해 본 것」을 적습니다.
7. **Claude**: main 판은 `bash src/tools/worklock.sh wait <이름표> "<할 일>"` 안에서 pull → 고침 → 판 번호 = 그때 main 최신 +1 → 시험 → push → `release`. push 전에 `bash src/tools/ship-check.sh install <이름표>`.
8. 일을 마치면 기록을 남깁니다 — ChatGPT·Codex는 readnow-collab `coord/from_gpt/`에 쪽지 한 장(PR · 저절로 합쳐짐), Claude는 장부.
