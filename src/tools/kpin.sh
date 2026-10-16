#!/usr/bin/env bash
# 📰 출판 정보 요약 넣기 (클라우드 0.15.0 /kp-in) — Claude 예약 작업·대화 세션이 씀
#  쓰는 법: 저장소 폴더에서  bash src/tools/kpin.sh 요약.json   (요약.json = {"by":"claude 예약","items":[{"id":"bnk_2026…","short":"…","points":[…],"biz":[…],"numbers":[{"k":"…","v":"…"}],"tags":[…],"from":"본문+첨부 8쪽"}]})
#  → diag/kpin/<시각>.json(암호문 — 공개 저장소에는 평문이 남지 않음)을 만들고 diag/q.txt를 '@kpin kpin/<시각>.json'으로 바꿈 → 커밋·push하면 GitHub 자동 작업이 클라우드에 넣고 결과를 diag-out에(진단과 같은 방법으로 읽음)
#  열쇠: diag/kpin_pub.pem = 클라우드가 만든 공개 열쇠(개인 열쇠는 클라우드 app_secrets/kpin에만) · 암호: openssl aes-256-cbc -pbkdf2 + RSA-OAEP
set -euo pipefail
IN="$1"; [ -f "$IN" ] || { echo "파일 없음: $IN"; exit 1; }
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d.get('items'),list) and d['items'], 'items 없음'; print('글', len(d['items']))" "$IN"
TS=$(date -u +%Y%m%d-%H%M%S); OUT="diag/kpin/$TS.json"; T=$(mktemp -d)
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$IN" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$OUT"
rm -rf "$T"; echo "@kpin kpin/$TS.json" > diag/q.txt; echo "만듦: $OUT · diag/q.txt = @kpin kpin/$TS.json — 이제 git add diag && commit && push"
