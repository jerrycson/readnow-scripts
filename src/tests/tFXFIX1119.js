/* tFXFIX1119 — 11/19 일꾼 fxfix1 · 🛟 넘긴 환율 지킴(cloud/col2seed.js watch) 시험
 *  왜: 11/17 12:46Z 환율(ext.fx)을 JS-MAIN 번외로 넘긴 뒤 소식(beat) 0 — 운영 수집기 30시간 한도만 기다려 11/18 환율이 하루 가까이 늦음
 *  ① 16:30(한국) 전엔 안 건드림 ② 그날 11:35 뒤 소식 있으면 안 건드림 ③ 사람이 넘긴 줄·로거·꺼진 줄은 안 건드림
 *  ④ 차례표가 넘긴 줄인데 16:30까지 소식 없으면 되돌림 ⑤ 가짜 Firestore로 한 회차 — on:false·offAt·offBy·기록 한 줄 · 차례표가 다시 켜지 않음
 * 실행: node src/tests/tFXFIX1119.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/col2seed.js')));
const S = require(path.join(R, 'cloud/col2seed.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const K = (s) => Date.parse('2026-11-19T' + s + ':00+09:00');
const row = (o) => ({ jobs: { 'ext.fx': { on: true, pc: 'JS-MAIN', at: '2026-11-17T12:46:00Z', by: '클라우드 차례표(fx-js)', beat: null, ...(o || {}) } } });

console.log('① 시각');
ok(S.WATCH['ext.fx'] && S.WATCH['ext.fx'].since === '11:35' && S.WATCH['ext.fx'].upto === '16:30', '환율만 · 11:35 첫 시각 · 16:30 한도');
ok(S.watch(row(), K('16:29')).length === 0, '16:30 전엔 안 건드림');
ok(S.watch(row(), K('16:31')).length === 1, '16:30 뒤 소식 없으면 되돌림');
console.log('② 소식');
ok(S.watch(row({ beat: '2026-11-19T06:10:00Z' }), K('16:40')).length === 0, '그날 15:05 회차 소식이 있으면 안 건드림');
ok(S.watch(row({ beat: '2026-11-19T02:40:00Z' }), K('17:00')).length === 0, '그날 11:35 뒤 소식(11:40)이면 안 건드림');
ok(S.watch(row({ beat: '2026-11-18T06:10:00Z' }), K('16:31')).length === 1, '어제 소식뿐이면 되돌림');
ok(S.watch(row({ at: '2026-11-19T03:00:00Z' }), K('16:31')).length === 0, '오늘 11:35 뒤에 새로 넘긴 줄은 그날은 안 건드림');
console.log('③ 안 건드리는 줄');
ok(S.watch(row({ by: '웹앱 HOME' }), K('18:00')).length === 0, '사람이 넘긴 줄은 안 건드림(헌장 제7조)');
ok(S.watch(row({ pc: 'LOGGER' }), K('18:00')).length === 0, '로거 줄은 안 건드림');
ok(S.watch(row({ on: false }), K('18:00')).length === 0, '이미 꺼진 줄은 안 건드림');
ok(S.watch({ jobs: { 'ext.nl': { on: true, pc: 'HOME', by: '클라우드 차례표(x)', beat: null } } }, K('18:00')).length === 0, '환율 말고 다른 일은 안 건드림');
ok(S.watch({}, K('18:00')).length === 0 && S.watch(null, K('18:00')).length === 0, '문서가 없으면 아무것도 안 함');

console.log('④ 가짜 Firestore로 한 회차');
(async () => {
  const D = new Map(); D.set('app_settings/col2_solo', { pcs: { 'JS-MAIN': { fp: 'y' } } });
  const H0 = row(); H0.log = [{ k: 'ext.fx', on: true, pc: 'JS-MAIN', at: '2026-11-17T12:46:00Z', by: '클라우드 차례표(fx-js)' }]; H0.seeds = {}; for (const s of S.SEED) H0.seeds[s.id] = { at: 'x', act: 'on' };
  D.set('app_settings/col2_handoff', H0);
  const ref = (p) => ({ p, get: async () => ({ exists: D.has(p), data: () => JSON.parse(JSON.stringify(D.get(p))) }) });
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? merge(o[k], v) : v; return o; };
  const C = (c) => ({ doc: (id) => ref(c + '/' + id) });
  const db = { runTransaction: async (f) => f({ get: (r) => r.get(), set: (r, v, m) => D.set(r.p, m && m.merge ? merge(D.get(r.p), v) : v) }) };
  const logs = []; const _now = Date.now; const T = S.makeSeed({ db, C, log: (...a) => logs.push(a.join(' ')) });
  Date.now = () => K('15:00'); let r = await T.tick(); ok(!r.some((x) => x.act === 'off') && D.get('app_settings/col2_handoff').jobs['ext.fx'].on === true, '15:00 회차는 그대로', r);
  Date.now = () => K('16:40'); r = await T.tick(); const H = D.get('app_settings/col2_handoff'); const j = H.jobs['ext.fx'];
  ok(r.some((x) => x.id === 'watch-ext.fx' && x.act === 'off'), '16:40 회차에 되돌림', r);
  ok(j.on === false && j.offAt && /^클라우드 지킴/.test(j.offBy) && /JS-MAIN/.test(j.offWhy), 'on:false·offAt·offBy·까닭(웹앱 되돌리기와 같은 꼴)', j);
  ok(j.pc === 'JS-MAIN' && j.at === '2026-11-17T12:46:00Z', '나머지 칸은 지우지 않음(merge)', j);
  ok(H.log[0].k === 'ext.fx' && H.log[0].on === false && H.log.length === 2, '기록 한 줄 더함(옛 줄 그대로)', H.log);
  ok(logs.some((s) => /지킴 — 되돌림/.test(s)), '클라우드 기록에 남김');
  Date.now = () => K('16:50'); r = await T.tick(); const H2 = D.get('app_settings/col2_handoff');
  ok(H2.jobs['ext.fx'].on === false && H2.log.length === 2 && !r.some((x) => x.act === 'on' || x.act === 'off'), '다음 회차에 다시 켜지도 또 쓰지도 않음', r);
  Date.now = _now;
  const IX = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8'); ok(/col2seed\.js/.test(IX), '클라우드 본체가 차례표(지킴 포함)를 부름');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
