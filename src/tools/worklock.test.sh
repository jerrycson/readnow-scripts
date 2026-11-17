#!/usr/bin/env bash
# 순서표(worklock.sh) 시험 — 가짜 원격 저장소(맨 저장소)에서 돌림 · 진짜 work-lock 가지는 건드리지 않음
#   bash src/tools/worklock.test.sh        # 0 = 모두 통과
# 보는 것: ① 먼저 설 칸(지피티·RN_LOCK_PRIO=1) 아홉 경우 ② 옛 판 막기(main 판과 다르면 main 판으로 다시 실행 · 무한 반복 없음 · 끄기 · get은 안 함)
#          ③ 오래 기다리는 사이 main 판이 바뀌면 새 판으로 이어 기다림 · 못 잡고 끝나도 줄 칸은 남아 다시 기다리면 first 그대로(리드 F57) · leave
#          ④ 지킴: git hook 안처럼 GIT_DIR이 바깥 저장소로 잡힌 채 돌려도 진짜 원격을 건드리지 않음(11/18 hook 안에서 진짜 work-lock을 덮은 일 뒤)
set -uo pipefail
# ── 지킴 1: hook(pre-push 등)이 넘긴 GIT_* 를 모두 지움 — 남아 있으면 cd 해도 git이 바깥(진짜) 저장소·원격으로 감
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_COMMON_DIR GIT_NAMESPACE GIT_PREFIX GIT_QUARANTINE_PATH
SELF=$(cd "$(dirname "$0")" && pwd)/$(basename "$0")
WL=$(cd "$(dirname "$0")" && pwd)/worklock.sh
D=$(cd "$(mktemp -d)" && pwd -P); trap 'rm -rf "$D"' EXIT
export TMPDIR=$D GIT_CONFIG_NOSYSTEM=1 HOME=$D GIT_CEILING_DIRECTORIES=$D RN_WLT_D=$D
# ── 지킴 2: 시험 안의 모든 git push·fetch(순서표 대본이 부르는 것까지 — export -f)는 origin이 "$D/remote.git"이고 저장소가 $D 안일 때만 감 · 아니면 막고 시험 전체를 멈춤
git() {
  case " $* " in *" push "*|*" fetch "*|*" ls-remote "*)
    local u g; u=$(command git remote get-url origin 2>/dev/null); g=$(command git rev-parse --absolute-git-dir 2>/dev/null)
    if [ -n "${GIT_DIR:-}${GIT_WORK_TREE:-}" ] || { [ -n "$g" ] && { [ "$u" != "$RN_WLT_D/remote.git" ] || [ "${g#"$RN_WLT_D"/}" = "$g" ]; }; }; then
      echo "⛔ 시험 지킴: 진짜 원격으로 갈 수 있는 git $* 를 막음(origin=$u · 저장소=$g)" >&2; : > "$RN_WLT_D/GUARD_TRIPPED"; exit 1; fi;;
  esac; command git "$@"; }
export -f git
git config --global user.name t; git config --global user.email t@t; git config --global init.defaultBranch main
pass=0; fail=0
ok() { if [ -e "$D/GUARD_TRIPPED" ]; then echo "  ⛔ 시험 지킴이 막음 — 시험을 바로 멈춤(진짜 원격은 안 건드림)"; exit 1; fi
  if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  ✓ $2"; else fail=$((fail+1)); echo "  ❌ $2"; fi; }
git init -q --bare "$D/remote.git"
mk() { # 일 폴더 하나(main에 순서표 $1을 올려 둠)
  local w=$D/$2; git clone -q "$D/remote.git" "$w" 2>/dev/null; mkdir -p "$w/src/tools"; cp "$1" "$w/src/tools/worklock.sh"
  ( cd "$w" && git add -A && git commit -qm "순서표 $2" && git push -q origin HEAD:main 2>/dev/null ); }
mk "$WL" a
A=$D/a; cd "$A"
run() { RN_LOCK_HOST=$1 bash "$A/src/tools/worklock.sh" "${@:2}" >"$D/out" 2>"$D/err"; echo $?; }
getj() { bash "$A/src/tools/worklock.sh" get | python3 -c "import json,sys;j=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1"; }
reset() { cd "$A" && B=$(printf '{}\n' | git hash-object -w --stdin) && T=$(printf '100644 blob %s\tLOCK.json\n' "$B" | git mktree) && C=$(git commit-tree "$T" -m reset) && git push -qf origin "$C:refs/heads/work-lock"; }

if [ -n "${RN_WLT_QUICK:-}" ]; then   # ④가 hook 흉내로 부르는 짧은 판: 표 비우기·부탁·잡기·놓기만
  reset; [ "$(run q1 ask lead 짧음)" = 0 ] && [ "$(run q1 take lead 짧음)" = 0 ] && [ "$(run q1 release lead 끝)" = 0 ]; ok $? "(짧은 판) 가짜 원격에서 부탁·잡기·놓기"
  echo "— 통과 $pass · 실패 $fail"; [ "$fail" = 0 ]; exit; fi
echo "① 먼저 설 칸(지피티·RN_LOCK_PRIO=1) — 기다리는 줄에서"
order() { bash "$A/src/tools/worklock.sh" get | python3 -c "
import json,sys,datetime
j=json.load(sys.stdin); q=j.get('queue') or []
ts=lambda s: datetime.datetime.strptime(s,'%Y-%m-%dT%H:%M:%SZ').timestamp()
a=j.get('ask') or {}; h=[e for e in q if e['host']==a.get('host')]
r=sorted([e for e in q if e not in h], key=lambda e:(0 if e.get('prio') else 1, ts(e['first'])))
print(' '.join(e['host'] for e in h+r))"; }
reset; run h1 ask lead 보통 >/dev/null; sleep 1; [ "$(run hg ask gpt 지피티)" = 0 ] && [ "$(getj "j['ask']['who'],j['ask'].get('prio')")" = "('gpt', 1)" ]; ok $? "지피티 칸이 먼저 기다린 보통 칸보다 맨 앞(ask 칸도 지피티)"
sleep 1; [ "$(run h2 ask lead 보통2)" = 0 ] && [ "$(getj "j['ask']['who']")" = gpt ] && [ "$(order)" = "hg h1 h2" ]; ok $? "보통 칸은 지피티 칸을 못 앞지름 · 보통 칸끼리는 먼저 기다린 차례"
sleep 1; RN_LOCK_PRIO=1 run h3 ask lead 급함 >/dev/null; [ "$(order)" = "hg h3 h1 h2" ]; ok $? "먼저 설 칸끼리는 먼저 온 쪽(급한 판도 지피티 뒤) · 보통 칸보다는 앞"
[ "$(run h1 take lead 판)" = 3 ] && grep -q '줄 맨 앞' "$D/out"; ok $? "표가 비어도 줄 맨 앞이 남이면 비킴(YIELD 종료 3)"
[ "$(run hg take gpt 판)" = 0 ] && [ "$(getj "j['holder'],j['ask']['host']")" = "('gpt', 'h3')" ]; ok $? "지피티가 잡고 자기 칸은 빠짐 · 다음 맨 앞은 급한 판"
[ "$(run h1 take lead 판)" = 3 ] && grep -q '다른 쪽이 잡고' "$D/out"; ok $? "남이 잡은 동안은 못 잡음(BUSY 종료 3)"
run h4 leave lead >/dev/null; run h4 clearask lead >/dev/null; [ "$(order)" = "h3 h1 h2" ]; ok $? "남은 남의 칸을 못 뺌(leave·clearask)"
run h1 clearask lead >/dev/null; [ "$(order)" = "h3 h1 h2" ]; ok $? "clearask는 줄의 내 칸을 건드리지 않음(옛 꼴 부탁만)"
run hg release gpt 끝 >/dev/null; [ "$(run h1 take lead 판)" = 3 ] && [ "$(RN_LOCK_PRIO=1 run h3 take lead 판)" = 0 ]; ok $? "놓은 뒤 급한 판이 먼저 잡음(RN_LOCK_PRIO=1로 부를 때)"
sleep 1; run h3 release lead 끝 >/dev/null; reset; run h1 ask lead 보통 >/dev/null; sleep 1; run hg ask gpt 지피티 >/dev/null; run h1 ask lead 보통 >/dev/null; [ "$(order)" = "hg h1" ]; ok $? "보통 칸이 새로 해도(1분마다) 지피티 칸 뒤 그대로"

echo "② 옛 판 막기"
reset
cp "$WL" "$D/old.sh"; sed -i 's/^set -euo pipefail$/set -euo pipefail; echo "MAIN-RUN fresh=${RN_WL_FRESH:-}" >\&2/' "$D/old.sh"   # main에 올릴 '다른 판' = 표시 줄 하나 더한 판
grep -q MAIN-RUN "$D/old.sh"; ok $? "(준비) 표시 줄을 넣은 main 판 만듦"
( cd "$A" && cp "$D/old.sh" src/tools/worklock.sh && git commit -qam "main 판 바꿈" && git push -q origin HEAD:main && git checkout -q HEAD~1 -- src/tools/worklock.sh )  # 작업 폴더엔 옛(=다른) 판
r=$(run h1 take lead 판); [ "$r" = 0 ] && grep -q "main 판과 다름" "$D/err" && [ "$(grep -c MAIN-RUN "$D/err")" = 1 ] && grep -q "fresh=1" "$D/err"; ok $? "take: 작업 폴더 판이 main과 다르면 main 판으로 한 번만 다시 실행(무한 반복 없음)"
[ "$(getj "j['holder'],j['host']")" = "('lead', 'h1')" ]; ok $? "다시 실행한 main 판이 표를 잡음"
r=$(run h1 release lead 끝); grep -q MAIN-RUN "$D/err"; [ $? = 1 ] && [ "$r" = 0 ]; ok $? "release는 다시 실행하지 않음(잡은 판 그대로 놓기)"
run h2 ask lead 부탁 >/dev/null; grep -q MAIN-RUN "$D/err"; ok $? "ask도 main 판으로 다시 실행"
run h2 get >/dev/null; grep -q MAIN-RUN "$D/err"; [ $? = 1 ]; ok $? "get은 다시 실행하지 않음"
RN_WL_FRESH=1 run h2 ask lead 부탁 >/dev/null; grep -q MAIN-RUN "$D/err"; [ $? = 1 ]; ok $? "RN_WL_FRESH=1이면 끔(지금 판 그대로)"
ls "$D"/rn-worklock-main-*.sh >/dev/null 2>&1; ok $? "main 판은 임시 파일(TMPDIR/rn-worklock-main-…)로 꺼냄"
( cd "$A" && cp "$D/old.sh" src/tools/worklock.sh ); run h2 ask lead 부탁 >/dev/null; [ "$(grep -c MAIN-RUN "$D/err")" = 1 ] && ! grep -q "main 판과 다름" "$D/err"; ok $? "작업 폴더 판이 main과 같으면 다시 실행하지 않음"
( cd "$A" && git checkout -q HEAD~1 -- src/tools/worklock.sh )
r=$(cd "$D" && RN_LOCK_HOST=h9 bash "$A/src/tools/worklock.sh" get >/dev/null 2>&1; echo $?); [ "$r" = 0 ]; ok $? "저장소 밖(원격 없음)에서도 get은 그대로 됨"

echo "③ 기다리는 사이 main 판이 바뀜"
reset; ( cd "$A" && git checkout -q origin/main~1 -- src/tools/worklock.sh && git commit -qm "main 되돌림" && git push -q origin HEAD:main )   # main = 작업 폴더 판
run h5 take lead 남이잡음 >/dev/null
( sleep 4; cd "$D" && git clone -q "$D/remote.git" b 2>/dev/null && cd b && cp "$D/old.sh" src/tools/worklock.sh && git commit -qam "main 판 바꿈2" && git push -q origin HEAD:main ) &
r=$(RN_WL_SLEEP=1 run h6 wait lead 기다림 13); wait
[ "$r" = 3 ] && grep -q "기다리는 사이 main 순서표가 바뀜" "$D/err" && grep -q "남은 3분" "$D/err" && grep -q MAIN-RUN "$D/err" && [ "$(grep -c "main 순서표가 바뀜" "$D/err")" = 1 ]; ok $? "10번째마다 main 판을 보고, 바뀌면 남은 시간으로 새 판이 이어 기다림(끝나면 종료 3)"
F1=$(getj "[e['first'] for e in j['queue'] if e['host']=='h6'][0]"); [ -n "$F1" ]; ok $? "못 잡고 끝나도 줄의 내 칸은 남음(끝에서 clearask 안 함)"
sleep 2; r=$(RN_WL_FRESH=1 RN_WL_SLEEP=1 run h6 wait lead 기다림 1); [ "$r" = 3 ] && [ "$(getj "[e['first'] for e in j['queue'] if e['host']=='h6'][0]")" = "$F1" ]; ok $? "못 잡고 끝난 뒤 다시 기다려도 처음 기다린 때(first) 그대로"
RN_WL_FRESH=1 run h6 leave lead >/dev/null; [ "$(getj "[e for e in j.get('queue') or [] if e['host']=='h6']")" = "[]" ]; ok $? "leave는 줄의 내 칸을 바로 뺌"


echo "④ 지킴 — hook 안처럼 GIT_DIR이 바깥 저장소로 잡힌 채 돌려도 진짜 원격은 그대로"
O=$D/outer; command git init -q --bare "$D/real.git"; command git clone -q "$D/real.git" "$O" 2>/dev/null
( cd "$O" && echo 진짜 > f && command git add f && command git commit -qm 진짜 && command git push -q origin HEAD:main HEAD:refs/heads/work-lock ) 2>/dev/null
refs() { command git --git-dir="$D/real.git" for-each-ref --format='%(refname) %(objectname)'; }
R0=$(refs); OH=$(command git -C "$O" rev-parse HEAD); [ -n "$R0" ]; ok $? "(준비) 바깥 저장소와 그 '진짜' 원격(main·work-lock)"
( cd "$O" && GIT_DIR="$O/.git" GIT_WORK_TREE="$O" GIT_INDEX_FILE="$O/.git/index" RN_WLT_QUICK=1 bash "$SELF" ) >"$D/inner" 2>&1; r=$?
[ "$r" = 0 ] && grep -q "(짧은 판) 가짜 원격에서" "$D/inner" && [ "$(refs)" = "$R0" ] && [ "$(command git -C "$O" rev-parse HEAD)" = "$OH" ] && [ -z "$(command git -C "$O" status --porcelain)" ]; ok $? "GIT_DIR·GIT_WORK_TREE·GIT_INDEX_FILE이 바깥으로 잡힌 채 시험을 돌려도 통과하고 '진짜' 원격 가지·바깥 저장소 HEAD·작업 폴더는 하나도 안 바뀜"
( cd "$O" && git push -q origin HEAD:refs/heads/work-lock ) 2>"$D/gerr"; r=$?
[ "$r" != 0 ] && grep -q "시험 지킴" "$D/gerr" && [ "$(refs)" = "$R0" ] && [ -e "$D/GUARD_TRIPPED" ]; g=$?; rm -f "$D/GUARD_TRIPPED"; ok $g "origin이 가짜 원격이 아니면 push를 막고 시험을 멈출 표시를 남김"
( cd "$A" && GIT_DIR="$O/.git" git fetch -q origin ) 2>"$D/gerr"; r=$?
[ "$r" != 0 ] && grep -q "시험 지킴" "$D/gerr"; g=$?; rm -f "$D/GUARD_TRIPPED"; ok $g "시험 안에서 GIT_DIR을 다시 잡아도 막음"

echo "— 통과 $pass · 실패 $fail"; [ "$fail" = 0 ]
