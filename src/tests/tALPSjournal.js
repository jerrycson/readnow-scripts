// tALPSjournal — 정범님 11/03 'ALPS 목록에 들어간 뒤로는 한 번 한 일을 다시 하지 않음': 인쇄 끝 기록(journal)·출력 표시만 있는 줄·1장 먼저 한 번만
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-j-' + Date.now()); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const rows = [{ i: 0, mgr: 'M1', name: '박', rk: '박|1', title: 'a', prnt: '출력' }, { i: 1, mgr: 'M2', name: '안', rk: '안|2', title: 'b' }, { i: 2, mgr: 'M3', name: '이', rk: '이|3', title: 'c' }];
const J = T.jLoad('S1'); ok(!Object.keys(J.printed).length, '처음엔 기록 없음');
J.printed[T.rowKey(rows[1])] = { at: 'x' }; J.firstOneDone = 'x'; T.jSave('S1', J); const J2 = T.jLoad('S1');
ok(!!J2.printed['m:M2'] && J2.firstOneDone, '인쇄 끝·1장 먼저 기록이 파일에 남음(다시 켜도 그대로)');
const todo = rows.filter((r) => !J2.printed[T.rowKey(r)] && (!T.alpsFlag(r) || (J2.decide || {})[T.rowKey(r)] === 'print'));
ok(todo.map((r) => r.mgr).join() === 'M3', '할 줄 = 기록에 없고 ALPS 출력 표시도 없는 줄만(M3) · 인쇄한 M2 · 출력 표시만 있는 M1은 묻기 전엔 안 함');
J2.decide['m:M1'] = 'print'; T.jSave('S1', J2); const J3 = T.jLoad('S1'); const todo2 = rows.filter((r) => !J3.printed[T.rowKey(r)] && (!T.alpsFlag(r) || J3.decide[T.rowKey(r)] === 'print'));
ok(todo2.map((r) => r.mgr).join() === 'M1,M3', "'안 나왔음 — 인쇄'로 고른 출력 표시 줄(M1)은 인쇄 대상");
ok(!!T.jLoad('S2').printed['m:M2'], '같은 날 다른 파일(줄 수가 바뀜)이어도 인쇄 끝 기록을 그대로 씀(0.3.5 날짜별)');
console.log(bad ? `❌ tALPSjournal 실패 ${bad}` : '✓ tALPSjournal 통과'); process.exit(bad ? 1 : 0);
