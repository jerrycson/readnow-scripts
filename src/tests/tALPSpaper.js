// tALPSpaper — 정범님 11/03 '4상자만 바르게, 나머진 빈 장': 오늘 인쇄 기록 보기·되돌리기 · 예전 파일별 칸이 되돌린 줄을 되살리지 않음
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-p-' + Date.now()); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const J = T.jLoad('S1'); J.printed['m:1'] = { at: 't1', name: '손님A', ok: true }; J.printed['m:2'] = { at: 't2', name: '손님B' }; J.printed['m:3'] = { at: 't2', name: '손님B' }; T.jSave('S1', J);
const G = A.journalToday(); ok(G.length === 2 && G[1].n === 2 && G[1].names[0] === '손님B', '오늘 인쇄 기록을 시각(상자)별로 묶어 보임: ' + G.map((g) => g.at + ':' + g.n).join(','));
const r = A.unprint({ keys: G[1].keys, why: '빈 장' }); const J2 = T.jLoad('S2');
ok(r.n === 2 && !J2.printed['m:2'] && J2.decide['m:2'] === 'print' && J2.unprinted['m:2'].why === '빈 장', "되돌린 줄은 인쇄 끝에서 빠지고 '다시 인쇄'로 · 되돌린 기록은 남음(지우지 않음)");
ok(!!J2.printed['m:1'], '바르게 나온 상자(손님A)는 그대로 인쇄 끝');
console.log(bad ? `❌ tALPSpaper 실패 ${bad}` : '✓ tALPSpaper 통과'); process.exit(bad ? 1 : 0);
