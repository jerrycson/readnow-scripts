#!/usr/bin/env bash
# ✍ 요약·추천글 넣기 (클라우드 /kp-in aisum · aisumJudge — aisum1 11/14 · 연구 N14)
#  재료 받기:  RN_WHO=<이름표> bash <readnow-chats>/tools/dg.sh <readnow-scripts> /tmp/dg.key 'aisum=queue&n=25' <결과 폴더>  → r1.json의 aisum.items(아직 Claude·사람 글이 없는 판매 중 상품 · 수요 지수 높은 순)
#  글 넣기:    bash src/tools/aisum.sh 글.json   (글.json = {"by":"<이름표>","model":"claude-…","items":[{"isbn","lead":[2],"kw":[10],"t1","t2","t3"|null}]}
#              또는 눈가림 견줌 {"by":"…","judge":[{"tok","pick":"A"|"B"|"=","why"}]}  (짝은 진단 'aisum=pairs&n=20')
#  → diag/kpin/aisum_<시각>.json(암호문 — 공개 저장소에 평문 없음) · 그다음 dg.sh … '@kpin kpin/aisum_<시각>.json' 으로 보내면 r1.json에 {aisum:{n,same,bad}} 
#  규칙: t1 = 대표 키워드 2개 · 스포일 없이 · 궁금하게 / t2 = 키워드 10개 모두 한 문장 / t3 = 판본·외부 요인 홍보할 값이 있을 때만(없으면 null) · 출판사 글을 25자 넘게 그대로 옮기면 클라우드가 버림
set -euo pipefail
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
IN="${1:-}"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
python3 -I -c "
import json,sys,re
d=json.load(open(sys.argv[1])); by=d.get('by') or 'claude'
if d.get('judge'): out={'by':by,'aisumJudge':d['judge']}
else:
  L=d.get('items') or []; assert L, 'items 없음'
  bad=[x.get('isbn') for x in L if len(x.get('kw') or [])!=10 or len(x.get('lead') or [])!=2 or any(k not in x.get('t2','') for k in x.get('kw') or [])]
  assert not bad, '키워드 10개·대표 2개·한 문장에 10개 모두 — 안 맞는 ISBN: %s'%bad[:10]
  out={'by':by,'aisum':{'items':L,'model':d.get('model') or 'claude','ver':str(d.get('ver') or '1')}}
txt=json.dumps(out,ensure_ascii=False); assert not re.search(r'01[016789][- ]?\d{3,4}[- ]?\d{4}',txt), '휴대전화 번호 꼴'
open(sys.argv[2],'w').write(txt); print('글', len(out.get('aisum',{}).get('items',[])) or len(out.get('aisumJudge',[])))" "$IN" "$T/body.json"
TS=$(date -u +%Y%m%d-%H%M%S)-$RANDOM; mkdir -p diag/kpin; OUT="diag/kpin/aisum_$TS.json"; P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$T/body.json" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -I -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
echo "만듦: $OUT → dg.sh … '@kpin kpin/$(basename "$OUT")'"
