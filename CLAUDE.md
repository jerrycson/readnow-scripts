# 리드나우 — 모든 Claude 세션이 시작할 때 (정범님 지시 2026-10-18 20:33 · 다시 말하지 않아도 언제나)

이 저장소(공개)로 시작하는 Claude 세션은 **정범님과 첫 대답을 하기 전에** 아래를 저절로 한다. 정범님께 묻지 않는다.

1. **지난 대화 숙지** — 비공개 대화 저장소 `jerrycson/readnow-chats`를 붙인다(add_repo, access "push") → clone(있으면 pull).
   - `DIGEST.md`(모든 대화의 요약 · 결정 · 정범님 지시)를 처음부터 끝까지 읽는다.
   - `INDEX.md` → 최근 대화부터, 지금 일과 이어지는 대화 파일은 원문까지 읽는다(작업 세션 `claude-code/`의 가장 최근 파일 끝부분은 꼭).
   - 대화 중 지난 일을 물으시거나 관련 주제가 나오면 그 저장소를 grep으로 찾아 원문을 확인하고 답한다(짐작하지 않음).
2. **이 세션 대화 자동 보관** — `bash <readnow-chats>/tools/install-hooks.sh` 를 실행한다. 그러면 정범님 말이 들어올 때 · 대답이 끝날 때 · 대화 압축 직전마다 이 세션 대화가 비공개 저장소에 저절로 덧붙여 올라간다(비밀값은 가림 · 지우지 않음).
   예약 작업 세션은 훅 대신 끝나기 직전에 `save-session.sh <기록> <readnow-chats>/claude-code/auto/<날짜>_<작업>_<세션8자>.md "<제목>"` (src/PROJECT_STATE.md '동시 작업 규칙').
3. **작업 기준** — `src/PROJECT_STATE.md`(구성 · 정범님 규칙 · 결정 기록 · 남은 일)를 읽는다. 저장소를 고치기 전에는 `bash src/tools/worklock.sh` 동시 작업 규칙을 따른다.

절대 지킬 것: 대화 내용·비밀값은 이 공개 저장소에 넣지 않는다(대화는 readnow-chats에만). *.storage.json·rn-cred·알라딘 계정은 어디에도 넣지 않는다.
