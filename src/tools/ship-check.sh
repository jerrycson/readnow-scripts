#!/usr/bin/env bash
# 리드나우 push 전 검사 (2026-10-29 · 동시 작업 규칙 2 — 두 방·점검들이 같은 판 번호로 부딪치거나 남의 판을 덮지 않게)
#   bash src/tools/ship-check.sh <이름표>            # 지금 HEAD를 origin/main에 올려도 되는지 검사(0 = 됨 · 1 = 안 됨 + 까닭)
#   bash src/tools/ship-check.sh install <이름표>    # 이 저장소 .git/hooks/pre-push로 깔기 → git push 때마다 저절로 검사
# 이름표 = lead · friend · story · h4 · daily · kpsum · backup (worklock.sh와 같음)
# 검사: ① main에 올리는 push인데 diag/·backups/ 밖 파일이 바뀌면 순서표를 내가(이 세션) 잡고 있어야 함
#       ② HEAD가 origin/main 최신을 품고 있어야 함(남이 올린 것을 덮지 않음 — 먼저 git pull/merge)
#       ③ 바뀐 원본의 판 번호가 main 것보다 커야 함(웹앱 APP_VER · 수집기 @version · 클라우드 VER · 공용 core VERSION · 노선표 · 책방 친구 FRIEND_PIN)
#       ④ 수집기 머리(@match·@grant·@connect·@require 줄)가 main과 같아야 함(바뀌면 정범님 허락 — RN_HEAD_OK=1로만 통과)
#       ⑤ 결과물이 원본과 같은 판(app/index.html APP_VER · pc-live.json ver)
# 급할 때 넘기기: RN_SHIP_SKIP=1 git push … (넘긴 까닭을 커밋 글에 적을 것)
set -uo pipefail
if [ "${1:-}" = install ]; then who=${2:?이름표}; h=$(git rev-parse --git-path hooks)/pre-push; mkdir -p "$(dirname "$h")"
  printf '#!/usr/bin/env bash\n# (10/29) 리드나우 push 전 검사 — src/tools/ship-check.sh\nwhile read -r l ls r rs; do case "$r" in refs/heads/main) [ -n "${RN_SHIP_SKIP:-}" ] && exit 0; RN_PUSH_SHA="$ls" bash "$(git rev-parse --show-toplevel)/src/tools/ship-check.sh" %s || exit 1;; esac; done\nexit 0\n' "$who" > "$h"; chmod +x "$h"; echo "✓ pre-push 검사 깔림($who) — $h"; exit 0; fi
who=${1:?이름표(lead·friend·h4·daily…)}; T=${RN_PUSH_SHA:-HEAD}; bad=0; say() { echo "❌ $*"; bad=1; }
git fetch -q origin main "+refs/heads/work-lock:refs/remotes/origin/work-lock" 2>/dev/null || git fetch -q origin main || { echo "⚠ fetch 실패 — 검사 못 함"; exit 1; }
M=origin/main
changed=$(git diff --name-only $M "$T" 2>/dev/null)
[ -z "$changed" ] && { echo "✓ main과 같음"; exit 0; }
# ② 최신을 품었나
git merge-base --is-ancestor $M "$T" || say "HEAD가 origin/main 최신($(git rev-parse --short $M))을 품지 않음 — 먼저 git pull(merge) 뒤 다시 빌드·시험"
# ① 순서표 (진단·백업 기록만 바뀌면 면제)
code=$(printf '%s\n' "$changed" | grep -vE '^(diag/|backups/)' || true)
if [ -n "$code" ]; then
  L=$(git show origin/work-lock:LOCK.json 2>/dev/null || echo '{}'); HOSTID=${RN_LOCK_HOST:-$(hostname 2>/dev/null || echo h)}
  r=$(L="$L" W="$who" H="$HOSTID" python3 -c "import json,os;j=json.loads(os.environ['L']);print('ok' if j.get('holder')==os.environ['W'] and j.get('host',os.environ['H'])==os.environ['H'] else 'no:'+str(j.get('holder'))+' '+str(j.get('what') or '')[:80])")
  [ "$r" = ok ] || say "순서표를 이 세션($who)이 잡고 있지 않음(지금: ${r#no:}) — bash src/tools/worklock.sh wait $who \"<할 일>\" 뒤에 pull·얹기·판 번호·빌드"
fi
# ③ 판 번호
ver() { git show "$1:$2" 2>/dev/null | grep -m1 -oE "$3" | grep -oE '[0-9]+(\.[0-9]+)+' | head -1; }
gt() { [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -1)" = "$1" ]; }
chk() { f=$1; re=$2; nm=$3; printf '%s\n' "$changed" | grep -qxF "$f" || return 0; a=$(ver $M "$f" "$re"); b=$(ver "$T" "$f" "$re"); [ -z "$a$b" ] && return 0
  gt "$b" "$a" || say "$nm 판 번호가 main보다 크지 않음($f: main $a → 올릴 것 $b) — 잠금 안에서 최신을 받은 뒤 판 번호를 다시 올릴 것"; }
chk src/app.html "const APP_VER = '[0-9.]+'" '웹앱'
chk src/readnow-collector.src.js '@version +[0-9.]+' '수집기'
chk cloud/index.js "^const VER = '[0-9.]+'" '클라우드'
for f in $(printf '%s\n' "$changed" | grep -E '^readnow-[a-z0-9-]+-core\.js$|^readnow-registry\.js$'); do chk "$f" "const VERSION = '[0-9.]+'" "$f"; done
if printf '%s\n' "$changed" | grep -qE '^friend/readnow-friend\.js$'; then a=$(ver $M src/app.html "FRIEND_PIN = '[0-9.]+'"); b=$(ver "$T" src/app.html "FRIEND_PIN = '[0-9.]+'"); gt "$b" "$a" || say "책방 친구 본체가 바뀌었는데 FRIEND_PIN이 그대로($a)"; fi
# ④ 수집기 머리
hd() { git show "$1:src/readnow-collector.src.js" 2>/dev/null | sed -n '1,/==\/UserScript==/p' | grep -E '^// @(match|grant|connect|require|include|exclude|run-at|sandbox|inject-into)' | grep -v 'raw\.githubusercontent\.com/jerrycson/readnow-scripts'; } # (10/30) 빌드(split.js) 머리 서명과 같게 — 우리 공용 파일 줄(?v= 판 고정)은 빠른 업데이트가 맡아 머리가 아님
if [ -z "${RN_HEAD_OK:-}" ] && [ "$(hd $M)" != "$(hd "$T")" ]; then say "수집기 머리(@match·@grant·@connect·@require…)가 main과 다름 — 정범님 허락 뒤 RN_HEAD_OK=1로만"; fi
# ⑤ 결과물 = 원본 판
if printf '%s\n' "$changed" | grep -qE '^(src/app\.html|app/)'; then a=$(ver "$T" src/app.html "const APP_VER = '[0-9.]+'"); b=$(ver "$T" app/index.html "APP_VER = '[0-9.]+'"); [ "$a" = "$b" ] || say "app/index.html 판($b)이 원본($a)과 다름 — node split.js && node release.js 뒤 결과물을 함께"; fi
if printf '%s\n' "$changed" | grep -qE '^(src/readnow-collector\.src\.js|pc-live\.json|readnow-collector\.user\.js)$'; then a=$(ver "$T" src/readnow-collector.src.js '@version +[0-9.]+'); b=$(git show "$T:pc-live.json" 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin).get('ver',''))" 2>/dev/null); [ "$a" = "$b" ] || say "pc-live.json 판($b)이 수집기 원본($a)과 다름"; fi
[ $bad = 0 ] && echo "✓ push 전 검사 통과($who · $(printf '%s\n' "$changed" | wc -l)개 파일)"; exit $bad
