# 책방 친구 v2 그림 원본 (friend/src)

`friend/readnow-friend.js` 끝의 **v2 블록**(`🐾 v2 시작` ~ `🐾 v2 끝` 표시 사이, 약 2,490줄)을 18개 조각(`msc2/msc2_*.js`)으로 나눠 둔 것입니다.
조각을 이어 붙이면 본체 블록과 **바이트 단위로 같습니다**(r18 회차 1에서 확인). 이 폴더의 파일은 화면에 나가지 않으므로 고쳐도 판 번호를 올리지 않습니다(본체가 바뀔 때만 올림).

## 파일
- `msc2/msc2_<이름>.js` — 조각 18개. 이름 차례 = core, body, fig, head, hair, hand, cloth, acc, svg, rig, ui, sd, crea, act, life, i, j, k (splice.py·extract.py의 차례와 같음)
- `extract.py` — 본체 → 조각 (각 조각의 첫 줄 앞부분으로 나눔)
- `splice.py` — 조각 → 본체 끝 블록 (몇 번 돌려도 같음). 본체 블록 밖의 v2 걸이(msc2Use·msc2RigInit·msc2Frame·msc2EngHtml·msc2DragStart·n_yuna·n_taeo)가 없으면 멈춤
- `roundtrip.sh` — 왕복 시험 (본체를 바꾸지 않음)

## 고치는 법 (둘 중 하나, 끝에 꼭 왕복 시험)
1. **조각을 고침 → 본체로**: `msc2/msc2_x.js` 수정 → `python3 friend/src/splice.py` → 본체가 바뀜 → 판 번호 올림·빌드·시험.
2. **본체를 직접 고침 → 조각 갱신**: `friend/readnow-friend.js` 수정 → `python3 friend/src/extract.py` → `msc2/` 조각이 갱신됨 → 같이 커밋.
3. 어느 쪽이든 마지막에 `bash friend/src/roundtrip.sh` 가 `왕복 시험 통과`여야 합니다. 두 번째 줄(저장소 조각 → 붙임)이 실패하면 조각이 본체와 어긋난 것이니 `extract.py`로 맞추세요.

## 주의
- 조각 첫 줄 앞부분이 바뀌면(extract.py의 STARTS) 나뉘는 곳을 못 찾아 멈춥니다. 조각 첫 줄 주석은 지우거나 바꾸지 마세요.
- 조각 사이 빈 줄도 조각 안에 그대로 들어 있습니다(이어 붙이기만 함).
- 예전 `pw/r15/splice.py`의 걸이 고침(rep)과 `f_main_patch.py`는 r15~r17에 본체에 이미 들어갔으므로 쓰지 않습니다(옛 작업 폴더에서 다시 돌리면 본체가 틀어짐).

## 🎭 2026-11-14 — 옛 캐릭터 내림(시스템은 그대로)
본체의 `MSC_CAST = 'blank'` 스위치로 이 조각들(옛 v2 그림 엔진)은 화면에 그려지지 않습니다. 코드는 되살리기 쉽게 그대로 두었습니다. 보존 지점·되살리는 법·새 캐릭터 꽂는 자리는 `friend/ARCHIVE_CHARS.md`.
