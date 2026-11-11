#!/bin/bash
# 번외 수집 일꾼(col2) 시험 모두 — 실패가 하나라도 있으면 끝 상태 1
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in t_unit t_isolation t_helper t_shadow t_auto t_chrome t_pool t_quota t_y24 t_y24reg t_y24w t_al t_alw t_logwin t_ui t_jobs t_more t_own t_relogin t_block42 t_cred t_voice t_settings t_wseat t_site t_naver t_seatwhy t_lg t_render t_human; do
  echo "── $t"; node "tests/$t.js" || fail=1
done
[ $fail = 0 ] && echo "✓ col2 시험 모두 통과" || echo "✗ col2 시험 실패가 있음"
exit $fail
