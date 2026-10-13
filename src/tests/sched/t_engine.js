const fs = require('fs'); const AS = new Function(fs.readFileSync(__dirname + '/engine.js', 'utf8') + '; return AS;')();
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const at = (hhmm, day = '2026-10-12') => Date.parse(`${day}T${hhmm}:00+09:00`);
// 1 legacy migration
const legDoc = { on: true, items: { qna: { on: true, times: ['09:00', '13:00'] }, chain: { on: false, times: ['17:00'] } } };
const S0 = AS.slotsOf(legDoc); ok(S0.length === 7 && S0[0].id === 'qna' && S0[0].trig.times.join() === '09:00,13:00' && S0[1].on === true && S0[5].on === false, 'legacy migrate (returns default on, crmBulk off)');
// 2 time due + merge + crmOk
let d = AS.due(legDoc, {}, { now: at('13:30'), pc: 'A', crmOk: true, idleMs: 0 }); const q = d.find((x) => x.slot.id === 'qna'); ok(q && q.key === 'qna@2026-10-12@13:00' && q.merge.join() === 'qna@2026-10-12@09:00', 'time due last + merged earlier');
d = AS.due(legDoc, {}, { now: at('13:30'), pc: 'A', crmOk: false }); ok(!d.some((x) => x.slot.job.startsWith('crm')), 'crm skipped when no crm tab');
d = AS.due({ ...legDoc, on: false }, {}, { now: at('13:30'), crmOk: true }); ok(d.length === 0, 'master off');
d = AS.due(legDoc, { 'qna@2026-10-12@13:00': { state: 'done', at: new Date(at('13:10')).toISOString() } }, { now: at('13:30'), crmOk: true }); ok(!d.some((x) => x.slot.id === 'qna'), 'already claimed');
// order priority
d = AS.due(legDoc, {}, { now: at('23:00'), crmOk: true }); ok(d.map((x) => x.slot.id).join() === 'qna,returns,scanDaily,buyback,aladinBuy', 'priority order ' + d.map((x) => x.slot.id).join());
// 3 late
const doc = (slots) => ({ on: true, slots });
d = AS.due(doc([{ id: 's1', job: 'prd:market', trig: { t: 'time', times: ['08:00'] }, late: 60 }]), {}, { now: at('09:30') }); ok(d[0] && d[0].mark === 'missed', 'late → missed');
d = AS.due(doc([{ id: 's1', job: 'prd:market', trig: { t: 'time', times: ['08:00'] }, late: 120 }]), {}, { now: at('09:30') }); ok(d[0] && d[0].mark === 'run', 'within late');
// days, pcs
d = AS.due(doc([{ id: 's1', job: 'prd:market', trig: { t: 'time', times: ['08:00'] }, days: [0, 6] }]), {}, { now: at('09:30') }); ok(d.length === 0, 'monday excluded by days');
d = AS.due(doc([{ id: 's1', job: 'prd:market', trig: { t: 'time', times: ['08:00'] }, pcs: ['HOME'] }]), {}, { now: at('09:30'), pc: 'JS-MAIN' }); ok(d.length === 0, 'pc filter');
// 4 every with window
const ev = doc([{ id: 'e', job: 'crm:qna', trig: { t: 'every', min: 120 }, win: { from: '08:00', to: '22:00' } }]);
d = AS.due(ev, {}, { now: at('11:15'), crmOk: true }); ok(d[0] && d[0].key === 'e@2026-10-12@e1000', 'every bucket 10:00 ' + (d[0] || {}).key);
d = AS.due(ev, {}, { now: at('07:15'), crmOk: true }); ok(d.length === 0, 'every outside window');
d = AS.due(ev, { 'e@2026-10-12@e1000': { state: 'done', at: new Date(at('10:20')).toISOString() } }, { now: at('11:59'), crmOk: true }); ok(d.length === 0, 'every bucket done');
// 5 after
const af = doc([{ id: 'p', job: 'prd:scanDaily', trig: { t: 'time', times: ['08:00'] } }, { id: 'c', job: 'prd:market', trig: { t: 'after', of: 'p', delay: 10 } }]);
let R = { 'p@2026-10-12@08:00': { state: 'done', at: new Date(at('08:40')).toISOString(), st: new Date(at('08:00')).toISOString(), ms: 2400000 } };
d = AS.due(af, R, { now: at('08:45') }); ok(!d.some((x) => x.slot.id === 'c'), 'after delay not yet');
d = AS.due(af, R, { now: at('08:51') }); ok(d.some((x) => x.key === 'c@2026-10-12@a.p.08:00'), 'after fires');
R['p@2026-10-12@08:00'].state = 'error'; d = AS.due(af, R, { now: at('08:51') }); ok(!d.some((x) => x.slot.id === 'c'), 'after need done: error not fire');
// cycle validate
const v = AS.validate(AS.slotsOf(doc([{ id: 'a', job: 'prd:x', trig: { t: 'after', of: 'b' } }, { id: 'b', job: 'prd:y', trig: { t: 'after', of: 'a' } }]))); ok(v.err.some((e) => /고리/.test(e)), 'cycle detected');
// 6 stale uses stats incl. manual
const st = doc([{ id: 'st', job: 'prd:market', trig: { t: 'stale', h: 6 } }]);
d = AS.due(st, {}, { now: at('12:00'), stats: { 'prd:market': { runs: [{ at: new Date(at('09:00')).toISOString(), ms: 600000, st: 'done', src: 'job' }] } } }); ok(d.length === 0, 'stale fresh (manual run 3h ago)');
d = AS.due(st, {}, { now: at('16:00'), stats: { 'prd:market': { runs: [{ at: new Date(at('09:00')).toISOString(), ms: 600000, st: 'done' }] } } }); ok(d[0] && /7시간/.test(d[0].why), 'stale fires ' + (d[0] || {}).why);
d = AS.due(st, { 'st@2026-10-12@s1550': { state: 'error', at: new Date(at('15:50')).toISOString() } }, { now: at('16:00'), stats: {} }); ok(d.length === 0, 'stale 30min backoff');
// 7 idle
const idl = doc([{ id: 'i', job: 'prd:dynamic', trig: { t: 'idle', min: 30, per: 2 } }]);
d = AS.due(idl, {}, { now: at('14:00'), idleMs: 20 * 60e3 }); ok(d.length === 0, 'idle not enough');
d = AS.due(idl, {}, { now: at('14:00'), idleMs: 40 * 60e3 }); ok(d[0] && d[0].key === 'i@2026-10-12@i1400', 'idle fires');
d = AS.due(idl, { 'i@2026-10-12@i1000': { state: 'done', at: new Date(at('11:00')).toISOString() }, 'i@2026-10-12@i1200': { state: 'done', at: new Date(at('12:30')).toISOString() } }, { now: at('14:00'), idleMs: 40 * 60e3 }); ok(d.length === 0, 'idle per-day cap');
// 8 boot
const bt = doc([{ id: 'b', job: 'prd:shipRead', trig: { t: 'boot', delay: 5 } }]);
d = AS.due(bt, {}, { now: at('09:03'), bootAt: at('09:00') }); ok(d.length === 0, 'boot delay');
d = AS.due(bt, {}, { now: at('09:06'), bootAt: at('09:00') }); ok(d[0] && d[0].key === 'b@2026-10-12@b', 'boot fires');
d = AS.due(bt, {}, { now: at('09:06'), bootAt: at('23:00', '2026-10-11') }); ok(d.length === 0, 'boot not for yesterday tab');
// 9 gapH → skipped
const gp = doc([{ id: 'g', job: 'prd:market', trig: { t: 'time', times: ['10:00'] }, gapH: 4 }]);
d = AS.due(gp, {}, { now: at('10:05'), stats: { 'prd:market': { runs: [{ at: new Date(at('08:00')).toISOString(), ms: 1, st: 'done' }] } } }); ok(d[0] && d[0].mark === 'skipped', 'gap skip');
// 10 retry
const rt = doc([{ id: 'r', job: 'prd:market', trig: { t: 'time', times: ['10:00'] }, retry: { n: 2, gap: 30 } }]);
R = { 'r@2026-10-12@10:00': { state: 'error', at: new Date(at('10:20')).toISOString() } };
d = AS.due(rt, R, { now: at('10:40') }); ok(d.length === 0, 'retry gap wait');
d = AS.due(rt, R, { now: at('10:55') }); ok(d[0] && d[0].key === 'r@2026-10-12@10:00~r1', 'retry 1');
R['r@2026-10-12@10:00~r1'] = { state: 'error', at: new Date(at('11:00')).toISOString() }; d = AS.due(rt, R, { now: at('11:31') }); ok(d[0] && d[0].key === 'r@2026-10-12@10:00~r2', 'retry 2 ' + (d[0] || {}).key);
R['r@2026-10-12@10:00~r2'] = { state: 'error', at: new Date(at('11:40')).toISOString() }; d = AS.due(rt, R, { now: at('13:00') }); ok(d.length === 0, 'retry exhausted');
// lost running → retry
R = { 'r@2026-10-12@10:00': { state: 'running', at: new Date(at('10:00')).toISOString(), beat: new Date(at('10:05')).toISOString() } };
d = AS.due(rt, R, { now: at('10:20') }); ok(d.length === 0, 'running not lost yet');
d = AS.due(rt, R, { now: at('11:00') }); ok(d[0] && /~r1$/.test(d[0].key), 'lost → retry');
// 11 legacyItems
const LI = AS.legacyItems(AS.slotsOf(doc([{ id: 'qna', job: 'crm:qna', trig: { t: 'every', min: 120 } }, { id: 'scanDaily', job: 'prd:scanDaily', trig: { t: 'time', times: ['07:00'] } }, { id: 'buyback', job: 'prd:buyback', trig: { t: 'time', times: ['21:00'] }, days: [1] }])));
ok(LI.qna.on === false && LI.scanDaily.on === true && LI.scanDaily.times[0] === '07:00' && LI.buyback.on === false && LI.returns.on === false, 'legacy items mirror');
// 12 durations
const du = AS.durations('prd:scanDaily', { 'prd:scanDaily': { runs: [{ at: '2026-10-12T00:00:00Z', ms: 600000, st: 'done' }, { at: '2026-10-11T00:00:00Z', ms: 1200000, st: 'done', src: 'log' }, { at: '2026-10-10T00:00:00Z', ms: 60000, st: 'stop' }] } }, { 'scanDaily@2026-10-12@08:00': { state: 'done', ms: 610000, at: '2026-10-12T00:01:00Z' }, 'scanDaily@2026-10-09@08:00': { state: 'done', ms: 900000, at: '2026-10-09T00:01:00Z' } }, AS.slotsOf(legDoc));
ok(du.n === 3 && Math.round(du.avg / 60000) === 15 && du.stopN === 1, 'durations dedupe+avg ' + JSON.stringify(du));
// 13 parse log
ok(JSON.stringify(AS.parseLogLine("■ '상품 조회 (판매중·일시판매중지·판매중지) 새로·바뀐 것' 끝남 — 12분")) === JSON.stringify({ name: '상품 조회 (판매중·일시판매중지·판매중지) 새로·바뀐 것', ms: 720000, st: 'done', how: 'job' }), 'parse job end');
ok(AS.parseLogLine("■ 'x' 끝남 — 3분 (멈춤)").st === 'stop' && AS.parseLogLine("⏰ 매일 자동: '묻고 답하기' 끝 (4분)").ms === 240000, 'parse stop & sched');
// 14 dayPlan + after guess
const pl = AS.dayPlan(af, { 'p@2026-10-12@08:00': { state: 'done', st: new Date(at('08:00')).toISOString(), at: new Date(at('08:40')).toISOString() } }, { now: at('08:20') }, (j) => (j === 'prd:market' ? 30 * 60e3 : 20 * 60e3));
ok(pl.p[0].span.join() === '480,520' && pl.c[0] && pl.c[0].min === 530 && pl.c[0].guess, 'dayPlan spans ' + JSON.stringify(pl));
// 15 describe
ok(AS.describe(AS.sanitize({ id: 'x', job: 'prd:m', trig: { t: 'every', min: 120 }, win: { from: '08:00', to: '22:00' }, days: [1, 2, 3, 4, 5], retry: { n: 1, gap: 30 } })) === '2시간마다 · 08:00~22:00 · 월화수목금요일만 · 멈추면 30분 뒤 다시(1번)', 'describe');
ok(AS.sanitize({ id: 'x', job: 'p', trig: { t: 'every' }, win: { from: '08:00', to: '24:00' } }).win.to === '24:00', 'win 24:00');
console.log(fail ? `\n${fail} FAIL` : '\nALL OK');
