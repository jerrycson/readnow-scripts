#!/usr/bin/env bash
# 리드나우 작업 순서표 (worklock) — 대화 세션(사장님과 실시간)과 예약 점검(전체 점검·백업 등)이 같은 저장소를 동시에 고치다 서로 덮지 않게.
# 표는 work-lock 가지의 LOCK.json 한 파일(main이 아니라서 웹앱 배포를 건드리지 않음). git push(앞으로만 감 — 그사이 다른 쪽이 바꿨으면 거절됨)로 바꾸므로 둘이 동시에 잡아도 하나만 성공함. 저장소 폴더 안에서 실행(git·push 권한만 있으면 됨).
#
#   bash src/tools/worklock.sh get                       # 지금 표 보기(JSON 그대로)
#   bash src/tools/worklock.sh status                    # 지금 표를 사람 말로(잡은 쪽 · 기다리는 줄 차례 · 30분 넘어 빠질 칸)
#   bash src/tools/worklock.sh take <누구> "<하는 일>"   # 잡기 — 누구 = lead | friend | h4 | gpt … · 다른 쪽이 30분 안에 살아 있으면 실패(종료 코드 3) · 표가 비어도 줄 맨 앞이 남이면 비킴(YIELD · 3)
#   bash src/tools/worklock.sh beat <누구> "<하는 일>"   # 살아 있음 알리기(10분마다 · 하는 일 바꿀 때)
#   bash src/tools/worklock.sh ask <누구> "<까닭>"       # 기다리는 줄에 서기(이미 서 있으면 '처음 기다린 때'는 그대로 두고 '새로 함'만) — 종료 코드 0 · 몇 번째인지 보임
#   bash src/tools/worklock.sh release <누구> "<한 일>"  # 놓기(push까지 끝낸 뒤) — last에 한 일·커밋을 남김
#   bash src/tools/worklock.sh clearask <누구>            # 줄에서 내 칸만 빼기(남의 칸은 못 뺌)
#   bash src/tools/worklock.sh wait <누구> "<하는 일>" [분=60] # 잡힐 때까지 1분마다 한 번: 잡을 수 있으면 잡고, 아니면 줄의 내 칸을 새로 함 — 못 잡으면 활성 칸을 빼고 30분 재시도 메모에 first를 보존 · 종료 코드 3
#
# (2026-10-29 동시 작업 규칙 2) 이름표: lead(리드나우 방) · friend(책방 친구 방) · story(동화 엔진 방) · h4(점검) · daily(매일 정밀 점검) · kpsum · backup · gpt(지피티 Actions)
#  · 같은 이름이라도 다른 세션(다른 컨테이너 = 다른 hostname · RN_LOCK_HOST)이면 남으로 봄 — 예전엔 두 점검이 같은 'auto-check'로 서로를 자기로 알고 함께 잡았음(10/29 판 번호 겹침의 원인)
#  · 잠금은 '판 내기'(pull → 얹기 → 판 번호 → 빌드 → 시험 → push)에만 짧게 · 고치기·시험은 각자 작업 폴더에서 잠금 없이
#
# 규칙(자세히는 src/PROJECT_STATE.md '동시 작업 규칙'):
#  · 고치기 전에 take · 30분 넘게 beat가 없으면 죽은 것으로 보고 넘겨받음
#  · 예약 점검은 커밋하기 전·10분마다 status로 줄을 확인 → 사람 방이 서 있으면 지금 것만 마무리해 push하고 release
#  · (11/17 lockq1 · 기다리는 줄) 부탁은 한 칸(ask)이 아니라 줄(queue): 칸마다 who·host·why·first(처음 기다린 때)·at(마지막 새로 함)
#    · 표가 비면 '줄 맨 앞'만 잡을 수 있음 — 맨 앞 = 지금 맨 앞으로 적힌 쪽(ask 칸)이 살아 있으면 그쪽, 아니면 first가 가장 이른 살아 있는(30분 안에 새로 한) 칸
#    · 예전엔 ask가 한 칸뿐이고 wait가 10분마다만 남겨서, 먼저 기다린 쪽(지피티 Actions 19:45~)이 칸이 비는 순간 늦게 온 일꾼에게 몇 번이고 밀렸음
#    · wait는 1분마다 내 칸의 at만 새로 함(first는 그대로) → 끊김 없음 · 30분 넘게 새로 하지 않은 칸은 죽은 것으로 보고 뺌
#    · 남의 차례를 강제로 뺏거나 남의 표를 강제로 놓는 길은 없음 — 남의 칸은 30분이 지나야만 빠짐
#  · (옛 대본과 함께 돌 때) ask 칸은 그대로 '줄 맨 앞'을 옛 꼴({who,host,why,at})로 비춤 — 옛 대본(한 칸 ask)은 그것만 보고 비키거나 자기 차례를 압니다
#    · 옛 대본이 적은 ask(줄에 없는 칸)는 줄 맨 앞으로 받아들임 · 옛 대본이 그 ask를 지우면(잡았거나 그만둠) 줄에서도 뺌 · 옛 대본이 쓴 queue는 그대로 남음(옛 대본은 JSON 전체를 다시 씀)
#  · push 전에는 언제나 git pull --rebase → 다른 쪽이 같은 원본(src/…)을 고쳤으면 내 바뀜을 최신 위에 다시 얹고(판 번호는 최신보다 하나 위로) 다시 빌드·시험
set -euo pipefail
BR=work-lock; F=LOCK.json; STALE=1800
export GIT_AUTHOR_NAME=${GIT_AUTHOR_NAME:-jerrycson} GIT_AUTHOR_EMAIL=${GIT_AUTHOR_EMAIL:-jerrycson@gmail.com}
export GIT_COMMITTER_NAME=$GIT_AUTHOR_NAME GIT_COMMITTER_EMAIL=$GIT_AUTHOR_EMAIL
now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
cmd=${1:-get}; who=${2:-}; what=${3:-}; HOSTID=${RN_LOCK_HOST:-$(hostname 2>/dev/null || echo h)}
if [ "$cmd" = wait ]; then  # 잡힐 때까지 기다림 — 1분마다 step 한 번(잡거나, 줄의 내 칸을 새로 함)
  mins=${4:-60}; for i in $(seq 1 "$mins"); do
    rc=0; out=$(bash "$0" step "$who" "$what" 2>&1) || rc=$?
    if [ "$rc" = 0 ]; then echo "✅ 잡음(${i}번째 시도)"; bash "$0" get; exit 0; fi
    if [ "$i" = 1 ] || [ $(( i % 10 )) = 0 ]; then echo "⏳ 기다림 ${i}분째 — $(printf '%s\n' "$out" | grep -m1 '^줄 ' || echo '표를 못 고침(다시 해 봄)')"; [ "$i" = 1 ] && bash "$0" status || true; fi
    sleep 60; done
  bash "$0" timeout "$who" "$what" >/dev/null 2>&1 || true  # 활성 칸은 빼되 같은 세션·작업 재시도의 first는 30분 보존
  echo "❌ ${mins}분 기다려도 못 잡음"; bash "$0" status || true; exit 3
fi
for attempt in 1 2 3 4 5 6 7 8; do
  if git fetch -q origin "+refs/heads/$BR:refs/remotes/origin/$BR" 2>/dev/null; then PARENT=$(git rev-parse "origin/$BR"); J=$(git show "origin/$BR:$F" 2>/dev/null || echo '{}'); else PARENT=""; J='{}'; fi
  case "$cmd" in
    get) printf '%s\n' "$J"; exit 0;;
    status|take|step|beat|ask|release|clearask|timeout) ;;
    *) echo "모르는 명령: $cmd"; exit 2;;
  esac
  OUT=$(J="$J" CMD="$cmd" WHO="$who" WHAT="$what" NOW="$(now)" STALE=$STALE HOSTID="$HOSTID" python3 -I - <<'PY'
import json, os, sys, datetime
try: j = json.loads(os.environ['J'] or '{}')
except Exception: j = {}
if not isinstance(j, dict): j = {}
cmd, who, what, now, host = os.environ['CMD'], os.environ['WHO'], os.environ['WHAT'], os.environ['NOW'], os.environ['HOSTID']
STALE = int(os.environ['STALE'])
def ts(s):
    try: return datetime.datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc).timestamp()
    except Exception: return 0
fresh = lambda s: ts(now) - ts(s) < STALE
kst = lambda s: datetime.datetime.fromtimestamp(ts(s), datetime.timezone(datetime.timedelta(hours=9))).strftime('%m/%d %H:%M') if ts(s) else '?'
ago = lambda s: '%d분 전' % max(0, (ts(now) - ts(s)) // 60) if ts(s) else '?'
hk = lambda e: e.get('host') or ''
me = lambda e: isinstance(e, dict) and e.get('who') == who and (not e.get('host') or e.get('host') == host)  # 이름 + 세션 · host 없는 아주 옛 칸은 이름만(옛 same()과 같음)
same2 = lambda a, b: a.get('who') == b.get('who') and hk(a) == hk(b)
alive = bool(j.get('holder')) and fresh(j.get('beat') or j.get('since'))
mine = j.get('holder') == who and j.get('host', host) == host  # (10/29) 이름 + 세션(hostname)이 같아야 '내 것'

def retries():
    return j.get('waitRetry') if isinstance(j.get('waitRetry'), list) else []

def norm():
    """줄 정리 — 죽은 칸(30분)·잡은 쪽 칸 빼기 · 옛 ask 받아들이기 · 맨 앞을 ask 칸에 옛 꼴로 비추기"""
    if isinstance(j.get('waitRetry'), list):
        j['waitRetry'] = [e for e in j['waitRetry'] if isinstance(e, dict) and e.get('who') and fresh(e.get('at'))]
    q = [e for e in (j.get('queue') or []) if isinstance(e, dict) and e.get('who') and fresh(e.get('at'))]
    a = j.get('ask') if isinstance(j.get('ask'), dict) else None
    head = None
    if a and a.get('who') and fresh(a.get('at')):
        head = next((e for e in q if same2(e, a)), None)
        if head is None:  # 옛 대본이 적은 한 칸 ask → 줄 맨 앞으로
            head = {'who': a['who'], 'host': a.get('host'), 'why': a.get('why'), 'first': a.get('first') or a['at'], 'at': a['at'], 'old': 1}
            q.insert(0, head)
        elif ts(a['at']) > ts(head.get('at')): head['at'] = a['at']  # 옛 대본이 10분마다 새로 한 것
    # 옛 대본에서 온 칸은 늘 맨 앞(ask 칸)일 때만 있음 — ask에서 사라졌으면 옛 대본이 잡았거나 그만둔 것
    q = [e for e in q if not e.get('old') or e is head]
    if j.get('holder'):
        hd = {'who': j.get('holder'), 'host': j.get('host')}
        q = [e for e in q if not same2(e, hd)]
    if head is not None and not any(e is head for e in q): head = None
    if head is None and q: head = min(q, key=lambda e: (ts(e.get('first') or e.get('at')),))  # 같은 때면 줄에 먼저 선 쪽(min은 앞의 것)
    j['queue'] = q
    j['ask'] = {'who': head['who'], 'host': head.get('host'), 'why': head.get('why'), 'at': head['at'], 'first': head.get('first')} if head else None
    return q, head

def drop_me():
    j['queue'] = [e for e in (j.get('queue') or []) if not me(e)]
    if me(j.get('ask')): j['ask'] = None
    if isinstance(j.get('waitRetry'), list):
        j['waitRetry'] = [e for e in j['waitRetry'] if isinstance(e, dict) and not same2(e, {'who': who, 'host': host})]

def upsert(why):
    q = j.get('queue') or []
    e = next((x for x in q if isinstance(x, dict) and x.get('who') == who and hk(x) == host), None)
    if e is None:
        a = j.get('ask') if isinstance(j.get('ask'), dict) else {}
        retry = next((r for r in retries() if isinstance(r, dict) and same2(r, {'who': who, 'host': host}) and r.get('why') == why and fresh(r.get('at'))), None)
        first = a.get('first') or a.get('at') if (a.get('who') == who and hk(a) == host and fresh(a.get('at'))) else (retry.get('first') if retry else now)  # 같은 실제 세션·작업만 재개(다른 host는 상속 안 함)
        e = {'who': who, 'host': host, 'why': why, 'first': first or now, 'at': now}; q.append(e)
    else:
        e.update(at=now, why=why or e.get('why')); e.pop('old', None)
    j['queue'] = q
    if isinstance(j.get('waitRetry'), list):
        j['waitRetry'] = [r for r in j['waitRetry'] if isinstance(r, dict) and not same2(r, {'who': who, 'host': host})]

def pos():
    q, head = norm()
    if head is not None and me(head): return 1, len(q)
    rest = sorted([e for e in q if e is not head], key=lambda e: ts(e.get('first') or e.get('at')))
    for i, e in enumerate(rest):
        if me(e): return i + (2 if head is not None else 1), len(q)
    return 0, len(q)

def status():
    L = []
    if j.get('holder'):
        L.append('🔒 잡은 쪽: %s (%s) · %s · 잡은 때 %s KST · 마지막 beat %s%s' % (j.get('holder'), j.get('host') or '-', j.get('what') or '', kst(j.get('since')), ago(j.get('beat') or j.get('since')), '' if alive else ' — 30분 넘음(죽은 것으로 봄 · 줄 맨 앞이 넘겨받음)'))
    else: L.append('🔓 비어 있음')
    raw = [e for e in (j.get('queue') or []) if isinstance(e, dict) and e.get('who')]
    gone = [e for e in raw if not fresh(e.get('at'))]
    q, head = norm()
    order = ([head] if head is not None else []) + sorted([e for e in q if e is not head], key=lambda e: ts(e.get('first') or e.get('at')))
    if order:
        L.append('⏳ 기다리는 줄 %d칸(먼저 기다린 차례):' % len(order))
        for i, e in enumerate(order):
            L.append('  %d. %s (%s) · 처음 %s KST · 새로 함 %s · %s%s%s' % (i + 1, e['who'], e.get('host') or '-', kst(e.get('first') or e.get('at')), ago(e.get('at')), (e.get('why') or '')[:80], ' · 옛 대본' if e.get('old') else '', ' ← 다음 차례' if i == 0 else ''))
    else: L.append('⏳ 기다리는 줄 없음')
    if gone: L.append('  (30분 넘게 새로 하지 않아 빠질 칸 %d개: %s)' % (len(gone), ', '.join('%s(%s)' % (e['who'], e.get('host') or '-') for e in gone)))
    if isinstance(j.get('last'), dict): L.append('🕘 마지막: %s · %s · %s KST' % (j['last'].get('who'), (j['last'].get('done') or '')[:100], kst(j['last'].get('at'))))
    return '\n'.join(L)

def out(tok, write=True, msg=''):
    print(tok); print(msg.replace('\n', '\\n')); print(json.dumps(j, ensure_ascii=False, indent=1) if write else ''); sys.exit()

if cmd == 'status':
    out('SHOW', False, status())
if cmd in ('take', 'step'):
    qwhy = '판 내기 기다림: ' + what  # 줄 칸의 까닭(잡으면 what은 그대로 하는 일)
    if mine and alive:
        drop_me(); j.update(beat=now, what=what or j.get('what')); norm(); out('OK')
    if alive:
        if cmd == 'take': out('BUSY', False)
        upsert(qwhy); p, n = pos(); out('QUEUED', True, '줄 %d번째/%d칸 · 잡은 쪽 %s(%s)' % (p, n, j.get('holder'), j.get('host')))
    q, head = norm()
    if head is not None and not me(head):
        if cmd == 'take': out('YIELD', False, '줄 맨 앞: %s(%s) · 처음 %s KST' % (head['who'], head.get('host'), kst(head.get('first'))))
        upsert(qwhy); p, n = pos(); out('QUEUED', True, '줄 %d번째/%d칸 · 표는 비었고 맨 앞 %s(%s) 차례' % (p, n, head['who'], head.get('host')))
    drop_me(); j.update(holder=who, host=host, what=what, since=now, beat=now); norm(); out('OK')
elif cmd == 'beat':
    if not (mine and j.get('holder')): out('NOTMINE', False)
    j.update(beat=now, what=what or j.get('what')); norm(); out('OK')
elif cmd == 'ask':
    if mine and alive: norm(); out('HOLDING', False, '내가 잡고 있음 — 줄에 설 까닭 없음')
    upsert(what); p, n = pos(); out('OK', True, '줄 %d번째/%d칸' % (p, n))
elif cmd == 'timeout':
    e = next((e for e in (j.get('queue') or []) if me(e)), None)
    if e is None and me(j.get('ask')): e = j['ask']
    if e is None: out('NONE', False, '줄에 내 칸 없음(남의 칸은 그대로)')
    retry = {'who': who, 'host': host, 'why': e.get('why') or ('판 내기 기다림: ' + what), 'first': e.get('first') or e.get('at') or now, 'at': now}
    drop_me(); j['waitRetry'] = retries() + [retry]; norm()
    out('OK', True, '활성 칸을 뺌 · 같은 세션/작업 재시도의 처음 시각은 30분 보존')
elif cmd == 'clearask':
    had = any(me(e) for e in (j.get('queue') or [])) or me(j.get('ask')) or any(isinstance(e, dict) and same2(e, {'who': who, 'host': host}) for e in retries())
    if not had: out('NONE', False, '줄에 내 칸 없음(남의 칸은 그대로)')
    drop_me(); norm(); out('OK', True, '내 칸을 뺌')
elif cmd == 'release':
    if j.get('holder') is not None and not mine: out('NOTMINE', False)
    j['last'] = {'who': who, 'done': what, 'at': now}; j.update(holder=None, host=None, what=None, since=None, beat=None)
    drop_me(); norm(); out('OK')
PY
)
  TOK=$(printf '%s\n' "$OUT" | sed -n 1p); MSG=$(printf '%s\n' "$OUT" | sed -n 2p | sed 's/\\n/\n/g'); NEW=$(printf '%s\n' "$OUT" | sed -n '3,$p')
  case "$TOK" in
    SHOW) printf '%s\n' "$MSG"; exit 0;;
    BUSY) echo "다른 쪽이 잡고 있음:"; printf '%s\n' "$J"; exit 3;;
    YIELD) echo "표는 비었지만 줄 맨 앞(먼저 기다린 쪽) 차례 — $MSG"; printf '%s\n' "$J"; exit 3;;
    NOTMINE) echo "내가 잡은 표가 아님:"; printf '%s\n' "$J"; exit 4;;
    NONE|HOLDING) echo "$MSG"; exit 0;;
    OK|QUEUED) ;;
    *) echo "표를 읽지 못함: $OUT"; exit 5;;
  esac
  BLOB=$(printf '%s\n' "$NEW" | git hash-object -w --stdin); TREE=$(printf '100644 blob %s\t%s\n' "$BLOB" "$F" | git mktree)
  if [ -n "$PARENT" ]; then C=$(git commit-tree "$TREE" -p "$PARENT" -m "worklock $cmd $who"); else C=$(git commit-tree "$TREE" -m "worklock $cmd $who"); fi
  if git push -q origin "$C:refs/heads/$BR" 2>/dev/null; then
    [ -n "$MSG" ] && printf '%s\n' "$MSG"
    [ "$TOK" = QUEUED ] && exit 3
    [ "$cmd" = ask ] || [ "$cmd" = clearask ] || printf '%s\n' "$NEW"
    exit 0
  fi
  sleep $(( attempt * 2 + RANDOM % 3 ))   # 그사이 다른 쪽이 바꿈(앞으로만 가지 않음) → 다시 읽고 다시
done
echo "표를 바꾸지 못함(8번)"; exit 5
