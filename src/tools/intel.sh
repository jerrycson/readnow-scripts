#!/usr/bin/env bash
# 🕵 정보 수집 방법 연구 글 넣기 (클라우드 /kp-in intel · intel1 11/13) — 조직·항목·연계 JSON을 웹앱 🔬 연구 › 🕵 정보 수집 방법 연구에 올림
#  쓰는 법(readnow-scripts 저장소 폴더에서): bash src/tools/intel.sh <연구.json>   (연구.json = {orgs:[…], items:[…], links:[…], …} — 비공개 저장소 research/INTEL/build.py가 만듦)
#  → diag/kpin/<시각>.json(암호문 — 공개 저장소에 평문 없음) + diag/q.txt = '@kpin kpin/<시각>.json'
#  더 쉬운 길(결과까지 읽음): RN_WHO=<이름표> bash <readnow-chats>/tools/dg.sh <readnow-scripts> <진단 열쇠> '@intel <연구.json 경로>' [결과 폴더] → r1.json의 intel {ok, nOrg, nItem, nDoc}
#  통째로 바꿔 씀(이전 판은 클라우드가 research_intel_hist에 남김 · 지우지 않음) · 휴대전화 번호 꼴이 있으면 멈춤
set -euo pipefail
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
IN="${1:-}"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
python3 -I -c "
import json,sys,re
d=json.load(open(sys.argv[1]))
assert isinstance(d.get('orgs'),list) and isinstance(d.get('items'),list), 'orgs·items 없음'
txt=json.dumps(d,ensure_ascii=False)
assert not re.search(r'01[016789][- ]?\d{3,4}[- ]?\d{4}',txt.replace('010-0000-0000','')), '휴대전화 번호 꼴이 있음 — 개인 정보는 넣지 않음'
assert len(txt)<900000, '너무 큼'
json.dump({'by':d.get('by') or 'claude','intel':d},open(sys.argv[2],'w'),ensure_ascii=False); print('조직',len(d['orgs']),'· 항목',len(d['items']))" "$IN" "$T/body.json"
TS=$(date -u +%Y%m%d-%H%M%S)-$RANDOM; mkdir -p diag/kpin; OUT="diag/kpin/$TS.json"
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$T/body.json" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -I -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
echo "@kpin kpin/$TS.json" > diag/q.txt; echo "만듦: $OUT · diag/q.txt = @kpin kpin/$TS.json"
