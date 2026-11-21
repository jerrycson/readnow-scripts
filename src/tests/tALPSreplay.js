// tALPSreplay — 정범님 11/21 MJ-MAIN '출고 중 또 중단': 접수·인쇄가 끝난 출고를 다시 누르면 다시 접수·인쇄 없이 운송장만 다시 넘김(조건이 하나라도 빠지면 멈춤 그대로)
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-replay-' + Date.now()); process.env.RN_ALPS_QUIET = '1'; const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
const mine = [{ ono: 'A', name: '손님A', title: '책1' }, { ono: 'B', name: '손님B', title: '책2' }]; const done = new Set(['A', 'B']);
const P = (inv) => ({ hit: mine.map((m, i) => ({ mine: m, row: { name: m.name, title: m.title, invNo: inv[i] } })), miss: [] });
ok(T.replayOk(mine, P(['1', '2']), done), '모두 끝난 출고 일에 있고 운송장번호가 다 있으면 다시 넘김');
ok(!T.replayOk(mine, P(['1', '']), done), '운송장번호 빈 줄이 있으면 멈춤 그대로');
ok(!T.replayOk(mine, P(['1', '2']), new Set(['A'])), '끝난 출고 일 밖의 주문이 있으면 다시 넘기지 않음');
ok(!T.replayOk(mine, { hit: P(['1', '2']).hit.slice(0, 1), miss: [mine[1]] }, done), 'ALPS 오늘 목록에서 못 찾은 줄이 있으면 멈춤 그대로');
ok(!T.replayOk([], { hit: [], miss: [] }, done), '빈 파일은 다시 넘기지 않음');
console.log(bad ? `❌ tALPSreplay 실패 ${bad}` : '✓ tALPSreplay 통과'); process.exit(bad ? 1 : 0);
