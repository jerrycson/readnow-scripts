#!/bin/bash
# 번외 수집 일꾼(col2) 시험 모두 — 실패가 하나라도 있으면 끝 상태 1
cd "$(dirname "$0")/.." || exit 1
# (11/11 col2rep4) run-all이 중단되면(Ctrl+C·SIGTERM) 돌던 시험에 SIGTERM을 넘겨 스스로 치우게 하고 그 표만 한 번 더 쓸어 냄
cur=; run=
stop() { [ -n "$cur" ] && kill -TERM "$cur" 2>/dev/null && wait "$cur" 2>/dev/null; [ -n "$run" ] && node tests/lib.js --sweep "$run"; exit 130; }
trap stop INT TERM HUP
fail=0
for t in t_unit t_isolation t_helper t_shadow t_auto t_chrome t_pool t_quota t_y24 t_y24reg t_y24w t_al t_alw t_logwin t_ui t_jobs t_more t_own t_relogin t_cred t_voice t_settings t_wseat t_site t_naver t_seatwhy t_lg t_render t_y24learn t_ho3 t_block42 t_pre; do
  echo "── $t"; run="ra$$_${t}_$(date +%s%N)"
  # (11/11 col2rep4) 시험마다 표(COL2T_RUN)를 주고 · 10분 넘으면 SIGTERM(시험이 스스로 크롬을 끄고 폴더를 지움) · 20초 더 안 끝나면 SIGKILL
  COL2T_RUN="$run" timeout -k 20 "${COL2_T_TIMEOUT:-600}" node "tests/$t.js" & cur=$!
  wait "$cur" || fail=1; cur=
  node tests/lib.js --sweep "$run"   # 그 시험이 SIGKILL로 죽었어도 그 표의 크롬·임시 폴더만 치움(다른 시험·일꾼 것은 안 건드림)
done
[ $fail = 0 ] && echo "✓ col2 시험 모두 통과" || echo "✗ col2 시험 실패가 있음"
exit $fail
