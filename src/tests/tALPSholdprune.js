// tALPSholdprune — (idea2 11/17 정범님 건의 「출고에서 이중으로 송장이 뽑힙니다」) 토요일 출력 오류로 보류된 상자의 주문이 월요일 출고에서 새 송장으로 접수·인쇄되면, 다른 날 보류 이어서·정해진 시각 확인이 옛 예약을 또 인쇄하지 않음(같은 주문 송장 두 장 막음)
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-hp-' + Date.now()); process.env.RN_ALPS_NOHOLDTICK = '1'; process.env.RN_ALPS_NOREMOTE = '1'; process.env.RN_ALPS_QUIET = '1';
const fs = require('fs'); const path = require('path'); const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'local', 'readnow-alps.js'), 'utf8');
const A = require(path.join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const openN = () => T.holdOpen().size;
// 토요일 — 출력 오류로 주문 001-A1 상자 보류(운송장 없음)
T.dayPin('20261114'); const r1 = T.holdAdd({ fileName: 'sat.xlsx', rows: [] }, '20261114', 'sigSat', { 'm:S1': { kind: 'region', ono: '001-A1', box: 'b1', at: '2026-11-14T15:00:00.000Z' } });
ok(openN() === 1 && T.holdPrune() === 0, '토요일 보류 1줄 — 뒤 출고가 없으면 그대로 보류');
// 일요일 — 001-A1은 「다른 날」로 미뤄 묶음엔 있었지만 운송장은 다른 주문에만
T.dayPin('20261115'); const j1 = T.jobNew(['001-A1', '001-A2'], '2026-11-15T10:00:00', '시험'); T.jobDone(j1.id, ['001-A2']);
ok(T.jobsLoad()['20261115'][0].inv.join() === '001-A2', '묶음 끝에 운송장이 실제로 붙은 주문(inv)만 남김');
ok(T.holdPrune() === 0 && openN() === 1, '묶음 주문에만 있고 운송장이 안 붙었으면 보류를 끝내지 않음(상자를 잃지 않음)');
// 월요일 — 「다시 넣기」로 001-A1이 새로 접수·인쇄(새 송장)
T.dayPin('20261116'); const j2 = T.jobNew(['001-A1', '001-A3'], '2026-11-16T13:00:00', '시험'); T.jobDone(j2.id, ['001-A1', '001-A3']);
ok(T.holdPrune('시험') === 1 && openN() === 0, '다른 날 출고에서 새 송장이 붙으면 토요일 보류를 끝으로(옛 예약 다시 인쇄 안 함)');
const it = T.holdsLoad().recs.find((x) => x.id === r1.id).items['m:S1']; ok(it.done && /두 장 막음/.test(it.done.how) && it.ono === '001-A1', '보류 줄은 지우지 않고 끝 표시·까닭만 남김');
let msg = ''; try { A.holdRun(r1.id, { why: '시험' }); } catch (e) { msg = e.message; } ok(/이미 끝남/.test(msg), '끝난 보류 상자를 다시 출력하라 해도 인쇄하지 않음(사람이 누름·다른 날 이어서 모두)');
// 같은 날 — ALPS 목록의 같은 예약으로 이어지므로 보지 않음
T.holdAdd({ fileName: 'mon.xlsx', rows: [] }, '20261116', 'sigMon', { 'm:M1': { kind: 'region', ono: '001-A4', box: 'b4', at: '2026-11-16T05:00:00.000Z' } });
const j3 = T.jobNew(['001-A4'], '2026-11-16T15:00:00', '시험'); T.jobDone(j3.id, ['001-A4']);
ok(T.holdPrune() === 0 && openN() === 1, '같은 날 묶음은 보류를 끝내지 않음(같은 예약을 이어 인쇄)');
// 인쇄 기록 길 — 묶음이 오류로 끝나도 다른 날 같은 주문의 다른 예약을 인쇄했으면 끝으로
T.dayPin('20261114'); T.holdAdd({ fileName: 'sat2.xlsx', rows: [] }, '20261114', 'sigSat2', { 'm:S9': { kind: 'none', ono: '001-A9', box: 'b9', at: '2026-11-14T16:00:00.000Z' } });
T.dayPin('20261117'); T.jSave('', { printed: { 'm:N9': { at: '2026-11-17T10:00:00', ono: '001-A9', run: 'r9', ok: true } }, decide: {} });
ok(T.holdPrune() === 1 && !T.holdOpen().has('m:S9') && T.holdOpen().has('m:M1'), '다른 날 같은 주문을 다른 예약으로 인쇄한 기록이 있으면 끝으로 · 상관없는 보류는 그대로');
// 코드 자리 — 다른 날 이어서·정해진 시각·다시 출력 앞에서 먼저 정리 · 인쇄 기록에 주문번호
ok(/holdPrune\('출고 끝'\); const other = holdsLoad\(\)/.test(SRC), '출고 끝 「다른 날 보류 이어서」 앞에서 먼저 정리');
ok(/holdPrune\('정해진 시각 확인'\); const L = holdsBrief\(\)/.test(SRC), '정해진 시각 보류 확인 앞에서 먼저 정리');
ok(/function holdRun\(id, o\) \{ holdPrune\(/.test(SRC), '보류 다시 출력(사람이 누름 포함) 앞에서 먼저 정리');
ok((SRC.match(/ono: oKey\(h\.mine\), run: RUN\.id/g) || []).length === 2, '인쇄 기록 두 곳에 주문번호(ono)');
ok(/jobDone\(RUN\.jobId, P\.hit\.filter\(\(h\) => h\.row\.invNo && !HOv\.has/.test(SRC), '묶음 끝에 운송장 붙은 주문(보류 빼고)을 넘김');
ok(/^const VERSION = '0\.6\.\d+'/m.test(SRC), '도우미 판 0.6.x');
try { fs.rmSync(process.env.RN_ALPS_HOME, { recursive: true, force: true }); } catch (e) {}
console.log(bad ? `❌ tALPSholdprune 실패 ${bad}` : '✓ tALPSholdprune 통과'); process.exit(bad ? 1 : 0);
