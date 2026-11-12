#!/bin/bash
# PC 배치 도우미(pcdock) 시험 모두 — 실패가 하나라도 있으면 끝 상태 1
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in t_static t_unit t_server t_ui; do echo "── $t"; timeout -k 10 300 node "tests/$t.js" || fail=1; done
[ $fail = 0 ] && echo "✓ pcdock 시험 모두 통과" || echo "✗ pcdock 시험 실패가 있음"
exit $fail
