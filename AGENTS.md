# 리드나우 — 어느 AI든(Claude·ChatGPT·Codex 등) 이 저장소로 일을 시작할 때

이 저장소는 공개입니다. 규칙은 같은 자리의 `CLAUDE.md`와 똑같이 따릅니다(이름만 다를 뿐 모든 AI에 적용). `CLAUDE.md`의 세션 시작 절차(-1·0-1·1·2·4·8번: 저장소 붙이기·훅·대화 기록)는 Claude 세션 전용이라 다른 AI는 건너뜁니다. 함께 지키는 것은 0번(한국어)·5번(수집기 머리)·'절대 지킬 것'입니다.

1. 먼저 협업 문서를 읽습니다 — ChatGPT·Codex는 비공개 `jerrycson/readnow-collab`의 `STATE.md`(지금 상태 한 장) → `AGENTS.md` → `AI_COLLAB/PROTOCOL.md` · Claude는 비공개 `jerrycson/readnow-chats`(원본 장부). 어느 쪽도 못 읽는 Codex 환경(이 코드 저장소만 연결된 경우)이면: 이 파일·`CLAUDE.md`·`src/PROJECT_STATE.md`의 규칙만으로 **정범님이 그 자리에서 준 범위가 분명한 코드 일**만 하고, 그 사실을 PR 본문에 적습니다(지난 결정·지금 상태를 짐작으로 채우지 않음).
2. 구성·규칙의 기준은 이 저장소 `src/PROJECT_STATE.md`. 큰 파일(`src/app.html` 등)은 통째로 읽지 말고 찾아서 필요한 범위만.
3. 정범님이 보는 글(답·커밋 글·PR 제목과 본문·판 설명)은 모두 한국어 · 호칭은 '정범님'.
4. **이 저장소는 공개입니다** — 코드·주석·시험·커밋 글·PR에 대화 내용·비밀값·손님 이름·전화·주소·주문 번호를 절대 넣지 않습니다(손님A로). `*.storage.json`·rn-cred·알라딘/예스24 계정은 어디에도 넣지 않습니다. 정범님이 대화에 주신 손님 이름은 문제를 짚는 데 그대로 쓰되, 이 공개 저장소에 옮길 때만 손님A로 바꿉니다.
5. 수집기 머리(`node release.js`의 HSIG)가 바뀌는 고침은 정범님 허락 없이 하지 않습니다.
6. **ChatGPT·Codex**: `codex/<일 이름>` 가지 + PR까지만 — main에 직접 push하지 않고, 판 번호·결과물(`app/`·`readnow-*.js`·`pc-live.json`)은 손대지 않습니다(원본 `src/`만 고침). Claude가 순서표(`src/tools/worklock.sh`) 안에서 main 최신을 합치고 빌드·판 번호·시험(`src/tools/ship-check.sh`)을 맞춰 판으로 냅니다. PR 본문에 「무엇을·왜·어떻게 확인했나·안 해 본 것」을 적습니다. 가지 이름은 `codex/<영문 소문자·숫자·하이픈>`(예: `codex/settings-label`). '웹앱'은 이 저장소의 `src/app.html`입니다(리드나우 2는 별도 저장소 readnow-ui2). PR 본문은 `.github/pull_request_template.md` 틀대로.
7. **Claude**: main 판은 `bash src/tools/worklock.sh wait <이름표> "<할 일>"` 안에서 pull → 고침 → 판 번호 = 그때 main 최신 +1 → 시험 → push → `release`. push 전에 `bash src/tools/ship-check.sh install <이름표>`.
8. 일을 마치면 기록을 남깁니다 — ChatGPT·Codex는 readnow-collab `coord/from_gpt/`에 쪽지 한 장(PR · 저절로 합쳐짐), Claude는 장부.
9. **시험(ChatGPT·Codex)**: 판 내기 전 빠른 시험 묶음(`src/tools/test-gate.js`)은 비공개 시험 틀이 있어야 돌아서 Codex 환경에서는 못 돌립니다 — 고친 함수에 딸린 시험 파일(`src/tests/`)이 있으면 같은 PR에서 함께 고치고, PR 본문에 「시험: 못 돌림(무엇을 눈으로 확인했는지)」을 적습니다. Claude가 판으로 낼 때 시험을 돌립니다.
10. **PR 본문 끝에 `## 바통 쪽지`**(ChatGPT·Codex — 협업 사본에 쪽지를 따로 못 쓸 때): 한 일 · 확인한 것 · 안 해 본 것 · 다음 첫 걸음. Claude 쪽 장치가 열린 `codex/` 가지와 열린 PR을 정범님 턴마다 보여 줍니다. GitHub에서 PR을 직접 합치지 않습니다(판 번호·시험·순서표가 빠짐).
11. **꼭 지킬 것(이 파일만 읽어도)**: 브라우저 `alert`·`confirm`·`prompt`를 쓰지 않음 · 자료·기록·상품을 지우는 코드를 넣지 않음(사람이 넣은 값을 코드로 덮지 않음) · 송장 출력·입력은 출고 PC에서만이고 그 밖 출고 일은 로그인된 사무실 PC가 먼저 받는 쪽 · 로거 PC는 알라딘·예스24 로그인 일을 하지 않음 · 돈이 걸린 자동 행위는 실행 전에 한도로 막음 · 정범님이 「멈춤」을 걸어 두신 동안에는 새 고침을 시작하지 않음. 멈춤 여부를 알 수 없는 환경이면 정범님이 그 자리에서 시키신 일만 하고, PR 본문 첫 줄에 「정범님이 직접 시킴(날짜)」을 적습니다.
