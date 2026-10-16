#!/usr/bin/env bash
# 📰 요약할 출판 정보 글 받기 — Claude 예약 작업(📰 출판 정보 요약)이 씀
#  쓰는 법(저장소 폴더): bash src/tools/kpsum-get.sh <개인 열쇠 파일> [글 수=25]
#   ① diag/q.txt = '@kpq kpq=<글 수>&kpcap=3000&kpper=150000&r=<시각>' → 커밋·push (GitHub 자동 작업이 클라우드 /diag?kpq… 결과를 diag/kps_pub.pem으로 암호화해 kp-out 가지에)
#   ② kp-out 가지에 이 커밋 결과가 올 때까지 기다림(최대 약 8분) → 개인 열쇠로 풀어 ./kpq/r1.json
#  개인 열쇠는 예약 작업 설명 안에만 있음(저장소에 없음) — 그 PEM을 임시 파일로 써서 넘김
set -euo pipefail
KEY="$1"; N="${2:-25}"; [ -f "$KEY" ] || { echo "열쇠 파일 없음"; exit 1; }
git pull -q --rebase || true
echo "@kpq kpq=$N&kpcap=3000&kpper=150000&r=$(date -u +%Y%m%d%H%M%S)" > diag/q.txt
git add diag/q.txt && git -c user.email=jerrycson@gmail.com -c user.name=jerrycson commit -qm "📰 요약할 출판 정보 글 받기 (kpq $N)" && git push -q origin HEAD:main
SHA=$(git rev-parse HEAD); echo "기다림: $SHA"
for i in $(seq 1 60); do git fetch -q origin +kp-out:refs/remotes/origin/kp-out 2>/dev/null || true; F=$(git show origin/kp-out:for.txt 2>/dev/null || true); [ "$F" = "$SHA" ] && break; sleep 8; done
[ "$F" = "$SHA" ] || { echo "kp-out에 아직 안 옴(자동 작업 확인: gh run list)"; exit 2; }
D=$(mktemp -d); git show origin/kp-out:out.enc > "$D/o.enc"; git show origin/kp-out:out.key > "$D/k.bin"
openssl pkeyutl -decrypt -inkey "$KEY" -pkeyopt rsa_padding_mode:oaep -in "$D/k.bin" -out "$D/k"
openssl enc -d -aes-256-cbc -pbkdf2 -pass "file:$D/k" -in "$D/o.enc" -out "$D/o.tgz"; rm -rf kpq; mkdir -p kpq; tar xzf "$D/o.tgz" -C kpq; rm -rf "$D"
python3 -c "import json;d=json.load(open('kpq/r1.json'));q=d.get('kpq',{});print('남은 글',q.get('left'),'· 받은 글',len(q.get('posts',[])),q.get('err') or '')"
