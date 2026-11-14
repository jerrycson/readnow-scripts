# 리드나우 — 어느 AI든(Claude·ChatGPT·Codex 등) 이 저장소로 일을 시작할 때

이 저장소는 공개입니다. 규칙은 같은 자리의 `CLAUDE.md`와 똑같이 따릅니다(이름만 다를 뿐 모든 AI에 적용).

1. 먼저 비공개 저장소 `jerrycson/readnow-chats`의 `AGENTS.md`와 `AI_COLLAB/PROTOCOL.md`를 읽습니다 — 지금 상태(바통)·헌장·바로잡은 사실·열린 일 장부·다른 AI가 방금 한 일(`coord/AI_LOG.md`)이 모두 거기 있습니다. 그 저장소를 못 읽으면 일을 시작하지 말고 그렇다고 말합니다.
2. 구성·규칙의 기준은 이 저장소 `src/PROJECT_STATE.md`.
3. 정범님이 보는 글(답·커밋 글·판 설명)은 모두 한국어 · 호칭은 '정범님'.
4. 이 공개 저장소에는 대화 내용·비밀값·손님 개인 정보를 절대 넣지 않습니다(손님A로). `*.storage.json`·rn-cred·알라딘/예스24 계정은 어디에도 넣지 않습니다.
5. 수집기 머리(`node release.js`의 HSIG)가 바뀌는 판은 정범님 허락 없이 내지 않습니다.
6. main에 판을 낼 때는 `bash src/tools/worklock.sh wait <이름표> "<할 일>"`(이름표 chatgpt·codex 등) 안에서 pull → 고침 → 판 번호 = 그때 main 최신 +1 → 시험 → push → `release`. push 전에 `bash src/tools/ship-check.sh install <이름표>`.
7. 일을 마치면 비공개 저장소 `coord/AI_LOG.md`에 한 줄을 남깁니다(못 쓰면 정범님께 붙여 넣을 「바통 쪽지」로).
