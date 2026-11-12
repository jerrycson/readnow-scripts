#!/usr/bin/env bash
# 📚 발견 모음 넣기 (클라우드 /kp-in found · found1 11/12) — 리드·일꾼·점검이 새로 알아낸 것을 웹앱 🔬 연구 › 📚 발견 모음에 더함
#  쓰는 법(readnow-scripts 저장소 폴더에서):
#   ① 파일:  bash src/tools/found.sh 발견.json            (발견.json = [{…}, …] 또는 {"by":"lead","found":[{…}]})
#   ② 한 줄: bash src/tools/found.sh --one <분야> "<한 줄 발견>" "<근거 숫자·출처>" "<쓰는 곳·영향>" <확인됨|가설> <누가> [열쇠]
#   → diag/kpin/<시각>.json(암호문 — 공개 저장소에 평문 없음) + diag/q.txt = '@kpin kpin/<시각>.json' → git add diag && commit && push
#  더 쉬운 길(결과까지 읽음): RN_WHO=<이름표> bash <readnow-chats>/tools/dg.sh <readnow-scripts> <진단 열쇠> '@found <발견.json 경로>' [결과 폴더] → r1.json의 found {n, same, bad, ids}
#  한 발견 칸: d(YYYY-MM-DD 알아낸 날) · area(알라딘·예스24·네이버·시장·매출·경쟁 판매자·우리숍·엔진·수집·기술·운영·기타) · t(한 줄) · ev(근거) · use(쓰는 곳)
#             st(확인됨·가설·뒤집힘) · src(출처 파일) · by(누가) · tags[] · id(f_YYMMDD_열쇠 — 없으면 날짜+글 해시) · key(id 대신 짧은 영어 열쇠)
#  같은 id가 다시 오면 고쳐 씀(지우지 않음 · 틀린 발견은 st '뒤집힘'으로) · 손님 이름·전화·비밀값은 넣지 않음(아래에서 휴대전화 번호 꼴이 있으면 멈춤)
set -euo pipefail
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
if [ "${1:-}" = "--one" ]; then
  python3 -I -c "
import json,sys,datetime
a=sys.argv[1:]+['']*8
d=(datetime.datetime.utcnow()+datetime.timedelta(hours=9)).strftime('%Y-%m-%d')
r={'d':d,'area':a[0],'t':a[1],'ev':a[2],'use':a[3],'st':a[4] or '가설','by':a[5] or 'claude'}
if a[6]: r['key']=a[6]
json.dump({'by':r['by'],'found':[r]},open('$T/in.json','w'),ensure_ascii=False)" "${@:2}"
  IN="$T/in.json"
else
  IN="${1:-}"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
fi
python3 -I -c "
import json,sys,re
d=json.load(open(sys.argv[1]))
L=d if isinstance(d,list) else d.get('found')
assert isinstance(L,list) and L, 'found 없음'
bad=[r.get('t','')[:30] for r in L if not isinstance(r,dict) or len(str(r.get('t','')))<6]
assert not bad, '한 줄 발견(t)이 없는 것: %s'%bad
txt=json.dumps(L,ensure_ascii=False)
assert not re.search(r'01[016789][- ]?\d{3,4}[- ]?\d{4}',txt.replace('010-0000-0000','')), '휴대전화 번호 꼴이 있음 — 개인 정보는 넣지 않음'
out={'by':(d.get('by') if isinstance(d,dict) else None) or 'claude','found':L}
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False); print('발견', len(L), '개')" "$IN" "$T/body.json"
TS=$(date -u +%Y%m%d-%H%M%S)-$RANDOM; mkdir -p diag/kpin; OUT="diag/kpin/$TS.json"
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$T/body.json" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -I -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
echo "@kpin kpin/$TS.json" > diag/q.txt; echo "만듦: $OUT · diag/q.txt = @kpin kpin/$TS.json — 이제 git add diag && commit && push (또는 dg.sh '@found 파일')"
