const fs = require('fs'); const AS = new Function(fs.readFileSync(__dirname + '/engine.js', 'utf8') + '; return AS;')();
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const at = (hhmm, day = '2026-10-12') => Date.parse(`${day}T${hhmm}:00+09:00`); const doc = (slots) => ({ on: true, slots });
// every across midnight 22:00~02:00 /90
const ev = doc([{ id: 'e', job: 'prd:m', trig: { t: 'every', min: 90 }, win: { from: '22:00', to: '02:00' } }]);
let R = {}; let d = AS.due(ev, R, { now: at('23:40') }); ok(d[0].key === 'e@2026-10-12@e2330', 'night 23:30 ' + d[0].key); R[d[0].key] = { state: 'done', at: new Date(at('23:50')).toISOString() };
d = AS.due(ev, R, { now: at('00:30', '2026-10-13') }); ok(d.length === 0, 'after midnight same bucket not rerun ' + (d[0] || {}).key);
d = AS.due(ev, R, { now: at('01:05', '2026-10-13') }); ok(d[0] && d[0].key === 'e@2026-10-12@e0100', 'post-midnight bucket keyed yesterday ' + (d[0] || {}).key);
d = AS.due(ev, R, { now: at('23:35', '2026-10-13') }); ok(d[0] && d[0].key === 'e@2026-10-13@e2330', 'next night runs ' + (d[0] || {}).key);
const pl = AS.dayPlan(ev, R, { now: at('12:00', '2026-10-13') }, () => 60000); ok(pl.e.map((x) => x.key).join() === 'e@2026-10-12@e0100,e@2026-10-13@e2200,e@2026-10-13@e2330', 'plan cross ' + pl.e.map((x) => x.key).join());
// after: parent from yesterday ending today
const af = doc([{ id: 'p', job: 'prd:a', trig: { t: 'time', times: ['23:50'] } }, { id: 'c', job: 'prd:b', trig: { t: 'after', of: 'p' } }]);
R = { 'p@2026-10-12@23:50': { state: 'done', at: new Date(at('00:20', '2026-10-13')).toISOString() } };
d = AS.due(af, R, { now: at('00:25', '2026-10-13') }); ok(d.some((x) => x.key === 'c@2026-10-13@a.p.y23:50'), 'after from yesterday ' + d.map((x) => x.key));
R['c@2026-10-13@a.p.y23:50'] = { state: 'done', at: new Date(at('00:40', '2026-10-13')).toISOString() }; R['p@2026-10-13@23:50'] = { state: 'done', at: new Date(at('23:58', '2026-10-13')).toISOString() };
d = AS.due(af, R, { now: at('23:59', '2026-10-13') }); ok(d.some((x) => x.key === 'c@2026-10-13@a.p.23:50'), 'today parent separate');
// retry collision
const rc = doc([{ id: 'P', job: 'prd:a', trig: { t: 'time', times: ['09:00'] }, retry: { n: 1, gap: 10 } }, { id: 'C', job: 'prd:b', trig: { t: 'after', of: 'P', need: 'any' }, retry: { n: 1, gap: 10 } }]);
R = { 'P@2026-10-12@09:00': { state: 'error', at: new Date(at('09:10')).toISOString() }, 'C@2026-10-12@a.P.09:00': { state: 'error', at: new Date(at('09:15')).toISOString() } };
d = AS.due(rc, R, { now: at('09:31') }); const keys = d.map((x) => x.key); ok(keys.includes('P@2026-10-12@09:00~r1') && keys.includes('C@2026-10-12@a.P.09:00~r1'), 'both retries ' + keys);
R['P@2026-10-12@09:00~r1'] = { state: 'done', at: new Date(at('09:40')).toISOString() }; R['C@2026-10-12@a.P.09:00~r1'] = { state: 'done', at: new Date(at('09:45')).toISOString() };
d = AS.due(rc, R, { now: at('09:50') }); ok(d.some((x) => x.key === 'C@2026-10-12@a.P.09:00_r1'), 'child runs after parent retry ' + d.map((x) => x.key));
// legacy drift
const S = AS.slotsOf({ on: true, slots: [{ id: 'qna', job: 'crm:qna', trig: { t: 'time', times: ['09:00'] } }, { id: 'returns', job: 'crm:returns', trig: { t: 'time', times: ['10:00'] }, days: [1] }], items: { qna: { on: true, times: ['11:00'] }, returns: { on: true, times: ['12:00'] } } });
ok(S[0].trig.times.join() === '11:00' && S[1].trig.times.join() === '10:00', 'legacy drift only for simple');
console.log(fail ? fail + ' FAIL' : 'ALL OK');
