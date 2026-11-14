# 🐾 책방 친구 — 옛 캐릭터 보존 기록 (2026-11-14)

정범님 지시(2026-11-14): 책방 친구를 처음부터 새로 시작 — **기본 구성·틀(시스템)은 그대로, 캐릭터만 전부 내려 두고 새로 하나씩 만든다.** 지금까지의 판은 그대로 보존해 두고, 원하면 이 시점에서 이어 작업하거나 이 상태로 다시 적용할 수 있게.

## 보존 지점 (기준 = 원격 갈래)
- **원격 갈래 `archive/friend-chars-2026-11-14`** = 커밋 `d16e3ef6`(내리기 바로 앞 main · 웹앱 1.78.626)
- 로컬 주석 태그 `friend-chars-archive-2026-11-14`(같은 커밋 · 이 작업 환경은 태그 push가 막혀 원격엔 갈래만 있음)

## 그때 판 번호
| 무엇 | 판 |
|---|---|
| 캐릭터 본체 `friend/readnow-friend.js` (웹앱 FRIEND_PIN) | 0.15.20 |
| 혼자 도는 화면 바탕 `readnow-friend-boot.js` | ?v=0.15.20-l1 |
| 본체 안 RNF_VER | 0.1.0 |
| PC·안드로이드 프로그램 `friend-app/` | 0.2.3 (태그 friend-v0.2.3) |
| 웹앱 | 1.78.626 |

내린 판: 웹앱 1.78.627 · 책방 친구 FRIEND_PIN 0.16.0(본체 RNF_VER 0.2.0) · 프로그램은 다시 빌드하지 않음(0.2.3 그대로 — readnow.kr/friend/ 화면을 띄우므로 저절로 새 화면).

## 보존한 것
- 캐릭터 22명(`MSC_DES` · 처음 13명 + 꼬마 9명) · 옛 id 옮김표(`MSC_OLD`) · 그림 엔진 v1(mscSvg)·v2(`msc2_*`) · 표정·몸짓·꾸미기·설정표 — **본체 안에 지우지 않고 그대로 있음**(스위치로 꺼 둠)
- `friend/src/msc2/` 조각 18개 · `splice.py`·`extract.py`·`roundtrip.sh` — 그대로 있음
- `friend/journal/`(태오·서윤 연구 일지와 그림 40여 장) — **main에서 뺌** · 보존 갈래에 있음
- `friend/research.html`·`research_v1.html`·`research/`(그림 연구 글) — 그대로 둠(근거·원리 글 · 캐릭터 그림 없음)
- Firestore `app_settings/mascot`(기기별 고른 캐릭터 `me`·`claims` · 꾸미기 `dev.*.cust` · 캐릭터 목록 `cfg.chars`) · `app_settings/mascot_img_*`(올린 그림) — **지우지도 덮어쓰지도 않음**(빈 자리 모드는 읽기만 막고, 캐릭터 목록 저장은 거절)

## 되살리는 법
1. **스위치(가장 쉬움 · 지금 코드에 그대로 다시 켬)** — `friend/readnow-friend.js`에서
   ```js
   const MSC_CAST = 'blank';
   ```
   를 `'legacy'`로 바꿈 → `src/app.html`의 `FRIEND_PIN`과 `friend/index.html`의 `readnow-friend.js?v=` 를 올림 → 규칙대로 판 내기. 각 기기가 예전에 고른 캐릭터·꾸미기가 그대로 돌아옴.
2. **일지 되돌리기** — `git checkout archive/friend-chars-2026-11-14 -- friend/journal` 뒤 웹앱 🧪 프로젝트 🐾 카드의 '📓 연구 일지' 링크를 다시 넣음(같은 갈래의 `src/app.html` 참고).
3. **friend 화면을 그 시점 그대로** — `src/app.html`은 되돌리지 않음(웹앱 전체가 옛 판이 됨). `friend/`만 되돌리고 이 문서는 남김:
   ```bash
   git checkout archive/friend-chars-2026-11-14 -- friend   # 옛 본체·일지·옛 사본이 돌아옴(이 문서는 그대로 남음)
   ```
   그 뒤 `src/app.html`의 `FRIEND_PIN`과 `friend/index.html`의 `?v=`를 지금보다 크게 올려 판 내기.
4. **이어 작업** — `git switch -c work/friend-legacy archive/friend-chars-2026-11-14`

## 🎭 새 캐릭터 꽂는 자리
본체 `friend/readnow-friend.js`의 「🎭 캐릭터 칸」 묶음(`MSC_CAST` 정의 바로 아래)이 유일한 입구입니다.
- `MSC_CAST` — 지금 `'blank'`(빈 자리) · `'legacy'`(옛 22명). 새 캐릭터는 새 이름(예 `'v3'`)을 하나 더함.
- `mscBlankOn()` — 빈 자리 여부. 새 갈래를 더할 때는 `mscCastOf()` 같은 갈래 고르기로 넓힘.
- 그림이 들어가는 길 셋(모두 칸을 먼저 봄):
  - `mscFigure(ch, p, opt)` — 무대·고르기 카드·설정표의 그림. 빈 자리는 `mscBlankFig` = 관리자 그림(.mi)과 같은 껍데기(`mp-all`>`mp-body`>`mp-head` + 눌림 칸 `mi-hit`) → 숨쉬기·흔들기·눌림·끌기·말풍선 자리가 그대로. 새 캐릭터가 SVG 움직임 엔진(svg.v4)을 쓰면 `mscRigNew`가 저절로 붙음.
  - `mscSvg(ch, p, opt)` — 💬 보낸 사람 얼굴(`opt.view === 'face'`) 등 작은 그림.
  - `mscCharsOf` / `MSC_CAST_LIST()` — 고르기 창·저장 목록에 보일 캐릭터 목록.
- 빈 자리 모드에서 막아 둔 곳(새 캐릭터 때 풀 곳): `mscChar`·`mscMine`(보기용 charId) · `mscClaim`(고르기) · `mscCuOpen`(✏ 꾸미기) · `mscSheet`(설정표) · `mscSaveCfg`(캐릭터 목록 저장 거절) · `mscChatAva` · 설정 창 '캐릭터 고르기'·'그림 엔진'·관리자 '캐릭터' 칸 · 홈 카드 ✏ 단추.
- 시스템(그대로 도는 것): 알림·말풍선(`mscSay`·`mscErr`) · 💬 메시지 · 연결(페어링) · ⚙ 설정 창 · 단축키 · 바깥 알림(`/friend-say`·127.0.0.1:47613) · 프로그램 다리(`rects`·`geom`·`win_drag`).
