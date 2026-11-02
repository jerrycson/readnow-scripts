#!/bin/bash
# 왕복 시험: 본체 → 조각 뽑기 → 다시 붙이기 → 본체와 바이트 단위로 같은지. 같으면 0, 다르면 1.
# 쓰기: bash friend/src/roundtrip.sh [본체 경로]   (본체 자체는 건드리지 않음)
set -e
H="$(cd "$(dirname "$0")" && pwd)"
SRC="${1:-$H/../readnow-friend.js}"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
python3 "$H/extract.py" "$SRC" "$T/msc2"
# 1) 뽑은 조각을 붙이면 본체와 같은가
cp "$SRC" "$T/body.js"
python3 "$H/splice.py" "$T/body.js" "$T/msc2"
cmp "$SRC" "$T/body.js" && echo "왕복 1 (뽑은 조각 → 붙임): 같음"
# 2) 저장소에 들어 있는 조각(friend/src/msc2)을 붙여도 본체와 같은가 (조각이 본체와 어긋났는지)
if [ -d "$H/msc2" ]; then
  cp "$SRC" "$T/body2.js"
  python3 "$H/splice.py" "$T/body2.js" "$H/msc2"
  if cmp "$SRC" "$T/body2.js"; then echo "왕복 2 (저장소 조각 → 붙임): 같음"
  else echo "왕복 2 실패: friend/src/msc2 조각이 본체와 다름 → python3 friend/src/extract.py 로 조각 갱신"; exit 1; fi
fi
# 3) 두 번 붙여도 같은가
python3 "$H/splice.py" "$T/body.js" "$T/msc2" >/dev/null
cmp "$SRC" "$T/body.js" && echo "왕복 3 (두 번 붙임): 같음"
echo "왕복 시험 통과"
