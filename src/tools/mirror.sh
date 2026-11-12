#!/usr/bin/env bash
# 📋 작업판 거울 넣기 (클라우드 0.35.140 /board-in) — 리드(Claude)가 작업판 요약·🔕 출고 시간 방해 금지를 웹앱 칸에 씀
#  쓰는 법(저장소 폴더에서): bash src/tools/mirror.sh 거울.json   → diag/mirror/<시각>.json(암호문) + diag/q.txt = '@mirror mirror/<시각>.json' → git add diag && commit && push
#  더 쉬운 길(결과까지 읽음): RN_WHO=lead bash <readnow-chats>/tools/dg.sh <readnow-scripts> <진단 열쇠> '@mirror <거울.json 경로>' [결과 폴더]  → 결과 r1.json
#  거울.json = {"by":"lead",
#               "mirror":{"mjOpen":0,"mjLeadWait":0,"ideaTalk":0,"ideaJudge":0,"ideaGo":0,"jsTodo":0,"shipQuiet":false,"at":"2026-11-12T06:00:00Z"},   ← app_settings/board_mirror (숫자·불·ISO만 · 다른 칸은 거절)
#               "shipQuiet":{"on":true,"from":"13:00","to":"15:00","at":"2026-11-12T06:00:00Z"}}                                              ← app_settings/ship_quiet (at이 지금 문서보다 늦을 때만 · by '작업판' · src 'board')
#   둘 중 하나만 보내도 됨 · 공개 저장소에는 암호문만(diag/kpin_pub.pem — /kp-in과 같은 열쇠 · 여는 열쇠는 클라우드에만)
set -euo pipefail
IN="${1:-}"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
python3 -c "
import json,sys
d=json.load(open(sys.argv[1]))
assert isinstance(d,dict) and (isinstance(d.get('mirror'),dict) or isinstance(d.get('shipQuiet'),dict)), 'mirror·shipQuiet 둘 다 없음'
print('거울 칸', len(d.get('mirror') or {}), '· 방해 금지', '있음' if d.get('shipQuiet') else '없음')" "$IN"
TS=$(date -u +%Y%m%d-%H%M%S)-$RANDOM; mkdir -p diag/mirror; OUT="diag/mirror/$TS.json"; T=$(mktemp -d)
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$IN" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
rm -rf "$T"; echo "@mirror mirror/$TS.json" > diag/q.txt; echo "만듦: $OUT · diag/q.txt = @mirror mirror/$TS.json"
