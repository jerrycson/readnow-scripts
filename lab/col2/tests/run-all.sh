#!/bin/bash
# 번외 수집 일꾼(col2) 시험 모두 — 실패가 하나라도 있으면 끝 상태 1
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in t_unit t_isolation t_helper t_shadow t_auto t_chrome t_pool t_quota; do
  echo "── $t"; node "tests/$t.js" || fail=1
done
[ $fail = 0 ] && echo "✓ col2 시험 모두 통과" || echo "✗ col2 시험 실패가 있음"
exit $fail
