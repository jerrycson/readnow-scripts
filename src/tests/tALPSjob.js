// tALPSjob — 정범님 11/03 '새 주문을 진행하던 주문과 절대 섞지 마 · 안전장치 여럿': 출고 일 묶음 등록·끝·끝난 묶음 주문 빼기
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-job-' + Date.now()); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
ok(!T.jobOpen(), '처음엔 열린 묶음 없음');
const j = T.jobNew(['A', 'B', 'A'], '2026-11-03T14:00:00', '시험'); ok(T.jobOpen() && T.jobOpen().onos.join() === 'A,B', '묶음 등록: 주문번호 고정(중복 없이)');
const rows = [{ ono: 'A' }, { ono: 'B' }, { ono: 'C' }]; const inJ = new Set(T.jobOpen().onos); ok(rows.filter((r) => inJ.has(r.ono)).map((r) => r.ono).join() === 'A,B', '열린 묶음 동안 새 주문 C는 빠짐');
T.jobDone(j.id); ok(!T.jobOpen() && T.jobsDoneOnos().has('A') && T.jobsDoneOnos().has('B'), '끝나면 묶음 닫힘 · 끝난 주문 기억');
const doneO = T.jobsDoneOnos(); ok(rows.filter((r) => !doneO.has(r.ono)).map((r) => r.ono).join() === 'C', '다음 일은 끝난 주문을 빼고 새 주문 C만');
console.log(bad ? `❌ tALPSjob 실패 ${bad}` : '✓ tALPSjob 통과'); process.exit(bad ? 1 : 0);
