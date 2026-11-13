#!/usr/bin/env bash
# 📓 정범 노트 카드 넣기 (클라우드 /kp-in notes · note2 11/13) — 리드·일꾼이 쓴 카드·묶음 상태를 Firestore jb_notes에 올림 → 웹앱 📓·아티팩트 정범 노트에 바로 보임
#  쓰는 법(readnow-scripts 저장소 폴더에서): bash src/tools/note.sh <노트.json>   (노트.json = {by:'lead', ops:[{op:'set'|'merge', id, data:{kind:'card', cat, sub, leaf, imp, title, body, …}}]})
#  → diag/kpin/<시각>.json(암호문 — 공개 저장소에 평문 없음) + diag/q.txt = '@kpin kpin/<시각>.json'
#  더 쉬운 길: python3 <readnow-chats>/tools/note-post.py (마크다운 → 카드 · 이 파일을 대신 부름) — 꼴은 readnow-chats NOTE_CARDS.md
#  휴대전화 번호 꼴이 있으면 멈춤 · 지우지 않음(state 'trashed')
set -euo pipefail
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
IN="${1:-}"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
python3 -I -c "
import json,sys,re
d=json.load(open(sys.argv[1]))
ops=d.get('ops'); assert isinstance(ops,list) and ops, 'ops 없음'
assert len(ops)<=60, '한 번에 60개까지'
for o in ops: assert o.get('op') in ('set','merge') and re.match(r'^[A-Za-z0-9_.:@+-]{1,120}$',str(o.get('id',''))) and isinstance(o.get('data'),dict), '모양: '+str(o)[:80]
txt=json.dumps(d,ensure_ascii=False)
assert not re.search(r'01[016789][- ]?\d{3,4}[- ]?\d{4}',txt.replace('010-0000-0000','')), '휴대전화 번호 꼴이 있음 — 개인 정보는 넣지 않음'
assert len(txt)<900000, '너무 큼'
json.dump({'by':d.get('by') or 'claude','notes':{'ops':ops}},open(sys.argv[2],'w'),ensure_ascii=False); print('노트 쓰기',len(ops))" "$IN" "$T/body.json"
TS=$(date -u +%Y%m%d-%H%M%S)-$RANDOM; mkdir -p diag/kpin; OUT="diag/kpin/$TS.json"
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$T/body.json" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -I -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
echo "@kpin kpin/$TS.json" > diag/q.txt; echo "만듦: $OUT · diag/q.txt = @kpin kpin/$TS.json"
