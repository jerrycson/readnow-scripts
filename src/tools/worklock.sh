#!/usr/bin/env bash
# 리드나우 작업 순서표 (worklock) — 대화 세션(사장님과 실시간)과 예약 점검(전체 점검·백업 등)이 같은 저장소를 동시에 고치다 서로 덮지 않게.
# 표는 work-lock 가지의 LOCK.json 한 파일(main이 아니라서 웹앱 배포를 건드리지 않음). git push(앞으로만 감 — 그사이 다른 쪽이 바꿨으면 거절됨)로 바꾸므로 둘이 동시에 잡아도 하나만 성공함. 저장소 폴더 안에서 실행(git·push 권한만 있으면 됨).
#
#   bash src/tools/worklock.sh get                       # 지금 표 보기(JSON)
#   bash src/tools/worklock.sh take <누구> "<하는 일>"   # 잡기 — 누구 = chat | auto-check | backup … · 다른 쪽이 30분 안에 살아 있으면 실패(종료 코드 3)하고 표를 보여 줌
#   bash src/tools/worklock.sh beat <누구> "<하는 일>"   # 살아 있음 알리기(10분마다 · 하는 일 바꿀 때)
#   bash src/tools/worklock.sh ask <누구> "<까닭>"       # 잡고 있는 쪽에게 '내가 먼저 하겠다' 부탁(대화 세션이 씀) — 잡은 쪽은 지금 고치던 것만 마무리·push하고 release
#   bash src/tools/worklock.sh release <누구> "<한 일>"  # 놓기(push까지 끝낸 뒤) — last에 한 일·커밋을 남김
#   bash src/tools/worklock.sh clearask <누구>            # 부탁을 들어준 뒤(또는 부탁한 쪽이 끝낸 뒤) 부탁 지우기
#   bash src/tools/worklock.sh wait <누구> "<하는 일>" [분=60] # (10/29) 잡힐 때까지 1분마다 take(사람 방은 기다리는 동안 ask도 남김) — 못 잡으면 종료 코드 3
#
# (2026-10-29 동시 작업 규칙 2) 이름표: lead(리드나우 방) · friend(책방 친구 방) · story(동화 엔진 방) · h4(4시간 점검) · daily(매일 정밀 점검) · kpsum · backup
#  · 같은 이름이라도 다른 세션(다른 컨테이너 = 다른 hostname)이면 남으로 봄 — 예전엔 두 점검이 같은 'auto-check'로 서로를 자기로 알고 함께 잡았음(10/29 판 번호 겹침의 원인)
#  · 잠금은 '판 내기'(pull → 얹기 → 판 번호 → 빌드 → 시험 → push)에만 짧게 · 고치기·시험은 각자 작업 폴더에서 잠금 없이
#
# 규칙(자세히는 src/PROJECT_STATE.md '동시 작업 규칙'):
#  · 고치기 전에 take · 30분 넘게 beat가 없으면 죽은 것으로 보고 넘겨받음
#  · 대화 세션(chat)이 먼저 — 예약 점검이 잡고 있으면 chat은 ask를 남기고 사장님께 '점검이 ○○ 하는 중, 곧 넘겨받음'을 알림
#  · 예약 점검은 커밋하기 전·10분마다 get으로 ask를 확인 → 있으면 지금 것만 마무리해 push하고 release, chat이 놓을 때까지 읽기만(5분마다 get)
#  · push 전에는 언제나 git pull --rebase → 다른 쪽이 같은 원본(src/…)을 고쳤으면 내 바뀜을 최신 위에 다시 얹고(판 번호는 최신보다 하나 위로) 다시 빌드·시험
set -euo pipefail
BR=work-lock; F=LOCK.json; STALE=1800
export GIT_AUTHOR_NAME=${GIT_AUTHOR_NAME:-jerrycson} GIT_AUTHOR_EMAIL=${GIT_AUTHOR_EMAIL:-jerrycson@gmail.com}
export GIT_COMMITTER_NAME=$GIT_AUTHOR_NAME GIT_COMMITTER_EMAIL=$GIT_AUTHOR_EMAIL
now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
cmd=${1:-get}; who=${2:-}; what=${3:-}; HOSTID=${RN_LOCK_HOST:-$(hostname 2>/dev/null || echo h)}
if [ "$cmd" = wait ]; then  # (10/29) 잡힐 때까지 기다림
  mins=${4:-60}; asked=; for i in $(seq 1 "$mins"); do
    if bash "$0" take "$who" "$what" >/dev/null 2>&1; then bash "$0" get; exit 0; fi
    case "$who" in lead|friend|story) [ -z "$asked" ] && { bash "$0" ask "$who" "판 내기 기다림: $what" >/dev/null 2>&1 || true; asked=1; };; esac
    [ "$i" = 1 ] && { echo "기다림 — 지금 잡은 쪽:"; bash "$0" get | head -6; }
    sleep 60; done
  echo "❌ ${mins}분 기다려도 못 잡음"; bash "$0" get; exit 3
fi
for attempt in 1 2 3 4 5 6; do
  if git fetch -q origin "+refs/heads/$BR:refs/remotes/origin/$BR" 2>/dev/null; then PARENT=$(git rev-parse "origin/$BR"); J=$(git show "origin/$BR:$F" 2>/dev/null || echo '{}'); else PARENT=""; J='{}'; fi
  case "$cmd" in
    get) printf '%s\n' "$J"; exit 0;;
    take|beat|ask|release|clearask) ;;
    *) echo "모르는 명령: $cmd"; exit 2;;
  esac
  NEW=$(J="$J" CMD="$cmd" WHO="$who" WHAT="$what" NOW="$(now)" STALE=$STALE HOSTID="$HOSTID" python3 - <<'PY'
import json, os, sys, datetime
j = json.loads(os.environ['J'] or '{}'); cmd, who, what, now = os.environ['CMD'], os.environ['WHO'], os.environ['WHAT'], os.environ['NOW']
ts = lambda s: datetime.datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').timestamp() if s else 0
alive = j.get('holder') and (ts(now) - ts(j.get('beat') or j.get('since')) < int(os.environ['STALE']))
host = os.environ['HOSTID']; mine = j.get('holder') == who and j.get('host', host) == host  # (10/29) 이름 + 세션(hostname)이 같아야 '내 것'
if cmd == 'take':
    if alive and not mine: print('BUSY'); sys.exit()
    j.update(holder=who, host=host, what=what, since=j.get('since') if mine else now, beat=now)
    if (j.get('ask') or {}).get('who') == who: j['ask'] = None
elif cmd == 'beat':
    if not mine: print('NOTMINE'); sys.exit()
    j.update(beat=now, what=what or j.get('what'))
elif cmd == 'ask':
    j['ask'] = {'who': who, 'why': what, 'at': now}
elif cmd == 'clearask':
    j['ask'] = None
elif cmd == 'release':
    if j.get('holder') is not None and not mine: print('NOTMINE'); sys.exit()
    j['last'] = {'who': who, 'done': what, 'at': now}; j.update(holder=None, host=None, what=None, since=None, beat=None)
    if (j.get('ask') or {}).get('who') == who: j['ask'] = None
print(json.dumps(j, ensure_ascii=False, indent=1))
PY
)
  case "$NEW" in BUSY) echo "다른 쪽이 잡고 있음:"; printf '%s\n' "$J"; exit 3;; NOTMINE) echo "내가 잡은 표가 아님:"; printf '%s\n' "$J"; exit 4;; esac
  BLOB=$(printf '%s\n' "$NEW" | git hash-object -w --stdin); TREE=$(printf '100644 blob %s\t%s\n' "$BLOB" "$F" | git mktree)
  if [ -n "$PARENT" ]; then C=$(git commit-tree "$TREE" -p "$PARENT" -m "worklock $cmd $who"); else C=$(git commit-tree "$TREE" -m "worklock $cmd $who"); fi
  if git push -q origin "$C:refs/heads/$BR" 2>/dev/null; then printf '%s\n' "$NEW"; exit 0; fi
  sleep $((attempt * 2))   # 그사이 다른 쪽이 바꿈(앞으로만 가지 않음) → 다시 읽고 다시
done
echo "표를 바꾸지 못함(6번)"; exit 5
