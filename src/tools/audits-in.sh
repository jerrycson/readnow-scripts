#!/usr/bin/env bash
# 🗂 매일·정밀 점검 보고(src/audits/*.md)를 Firestore rn_audits에 넣기 (priv1 11/13 · 저장소 비공개 준비)
#  까닭: 웹앱 ⚙ › 🗂 점검 기록은 매일·정밀 점검 목록을 GitHub(api.github.com contents)에서 읽음 → 저장소가 비공개가 되면 0개.
#        rn_audits(4시간 점검이 이미 쓰는 곳)에 같은 글을 넣어 두면 웹앱이 거기서 읽음(같은 날 GitHub 쪽은 웹앱이 건너뜀 — 겹치지 않음).
#  쓰는 법(readnow-scripts 저장소 폴더에서): bash src/tools/audits-in.sh [파일…=src/audits/*.md]
#   → 클라우드 열쇠 길(X-RN-Diag-Key · 작업 환경 네트워크 비밀)이 통하면 바로 /kp-in 에 넣고 결과를 보여 줌
#   → 안 통하면 diag/kpin/<시각>.json(암호문) + diag/q.txt='@kpin kpin/<시각>.json' 을 만듦 → git add diag && commit && push(예전 길)
#  매일 정밀 점검은 보고를 src/audits/에 올린 뒤 이것을 한 번 돌림(그날 파일만 넘겨도 됨) · 같은 글이면 클라우드가 건너뜀(same)
set -euo pipefail
[ -f diag/kpin_pub.pem ] || { echo "readnow-scripts 저장소 폴더에서 돌려 주세요(diag/kpin_pub.pem 없음)"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
if [ $# -gt 0 ]; then FILES=("$@"); else FILES=(src/audits/*.md); fi
python3 -I - "$T/in.json" "${FILES[@]}" <<'PY'
import json, re, sys, os
out, files = sys.argv[1], sys.argv[2:]; L = []
for f in files:
    n = os.path.basename(f); m = re.match(r'^(\d{4})-(\d{2})-(\d{2})(-[a-z0-9]+)?\.md$', n, re.I)
    if not m: continue
    fb = bool(m.group(4) and 'fable' in m.group(4).lower()); kind = 'fable' if fb else 'daily'; hm = '2230' if fb else '2200'
    md = open(f, encoding='utf8').read(); t = (re.search(r'^#\s+(.+)$', md, re.M) or [None, n])[1].replace('**', '')[:300]
    if re.search(r'01[016789]-?\d{3,4}-?\d{4}', md.replace('010-0000-0000', '')): sys.exit('휴대전화 번호 꼴이 있음: ' + n)
    L.append({'id': f'{kind}_{m.group(1)}{m.group(2)}{m.group(3)}_{hm}', 'kind': kind, 'at': f'{m.group(1)}-{m.group(2)}-{m.group(3)}T{hm[:2]}:{hm[2:]}:00+09:00', 'title': t, 'md': md[:200000]})
if not L: sys.exit('넣을 보고 없음')
json.dump({'by': 'audits-in', 'audits': L}, open(out, 'w', encoding='utf8'), ensure_ascii=False); print('보고', len(L), '개')
PY
P=$(openssl rand -hex 32)
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$T/in.json" -out "$T/e.bin" -pass "pass:$P"
printf %s "$P" | openssl pkeyutl -encrypt -pubin -inkey diag/kpin_pub.pem -pkeyopt rsa_padding_mode:oaep -out "$T/k.bin"
python3 -I -c "import json,base64,sys; print(json.dumps({'k':base64.b64encode(open(sys.argv[1],'rb').read()).decode(),'e':base64.b64encode(open(sys.argv[2],'rb').read()).decode()}))" "$T/k.bin" "$T/e.bin" > "$T/body.json"
CU=${RN_CLOUD_URL:-https://readnow-cloud-63884079760.asia-northeast3.run.app}; DK=${RN_DIAG_KEY:-from-network-secret-00000000000000000000000000000000}
if [ "${RN_DIAG_VIA:-}" != actions ] && [ "$(curl -sS -m 30 -o /dev/null -w '%{http_code}' -H "X-RN-Diag-Key: $DK" "$CU/diag?ping=1" 2>/dev/null || true)" = 200 ]; then
  curl -sS -m 280 -X POST -H "X-RN-Diag-Key: $DK" -H 'content-type: application/json' --data-binary @"$T/body.json" "$CU/kp-in"; echo; exit 0; fi
TS=$(date -u +%Y%m%d-%H%M%S); mkdir -p diag/kpin; cp "$T/body.json" "diag/kpin/$TS.json"; echo "@kpin kpin/$TS.json" > diag/q.txt
echo "만듦: diag/kpin/$TS.json · diag/q.txt = @kpin kpin/$TS.json — 이제 git add diag && commit && push(예전 길)"
