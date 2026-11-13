/* tC2SEED1113 — 11/13 일꾼 rv5 · 🔀 번외 넘김 차례표(cloud/col2seed.js) 시험
 *  ① 조건이 맞으면 한 번만 넘김(jobs.<일> on·pc·at·by + log + seeds) ② 사람이 넘겼거나 되돌린 일은 안 건드림 ③ 출고 PC·로거 섞임 막음
 *  ④ 홀로 연결 없음·소식 3시간 넘음·판 낮음·'넘길 수 있음' 아님이면 기다림 ⑤ 되돌림 줄(on:false) ⑥ 클라우드 본체 연결·진단 칸
 * 실행: node src/tests/tC2SEED1113.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/col2seed.js')));
const S = require(path.join(R, 'cloud/col2seed.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const NOW = Date.parse('2026-11-13T05:30:00Z');
const day = (o) => ({ d: '2026-11-13', pc: 'HOME', ver: '0.1.54', at: new Date(NOW - 10 * 60e3).toISOString(), tasks: { 'ext.nl': { n: 102, same: 102, pass: { can: true, why: '넘길 수 있음' } } }, ...(o || {}) });
const SOLO = { HOME: { fp: 'x' }, 'JS-MAIN': { fp: 'y' } };
const L0 = S.SEED[0];

console.log('① 차례표 첫 줄');
ok(L0.k === 'ext.nl' && L0.pc === 'HOME' && L0.on === true, '첫 줄 = 국립중앙도서관 → HOME', L0);
ok(S.SEED.every((s) => !/^(al|y24|ship)/.test(s.k)), '알라딘 로그인·예스24·출고 일은 차례표에 없음');
ok(S.decide(L0, {}, [day(), null], SOLO, NOW).act === 'on', '문서가 없고 조건이 맞으면 넘김');

console.log('② 사람 값 우선');
ok(S.decide(L0, { jobs: { 'ext.nl': { on: false, offAt: 'x' } } }, [day()], SOLO, NOW).act === 'mark', '사람이 되돌린 일은 다시 켜지 않음');
ok(S.decide(L0, { jobs: { 'ext.nl': { on: true, pc: 'JS-MAIN' } } }, [day()], SOLO, NOW).act === 'mark', '사람이 다른 PC로 넘긴 일은 안 바꿈');
ok(S.decide(L0, { seeds: { [L0.id]: { at: 'x' } } }, [day()], SOLO, NOW).act === 'done', '한 번 한 줄은 다시 안 함');

console.log('③ 출고 PC·로거');
ok(S.decide({ ...L0, pc: 'MJ-MAIN' }, {}, [day({ pc: 'MJ-MAIN' })], { 'MJ-MAIN': {} }, NOW).act === 'bad', '출고 PC(MJ-MAIN)는 차례표로 안 켬');
ok(S.decide({ ...L0, pc: 'LOGGER' }, {}, [day({ pc: 'LOGGER' })], SOLO, NOW).act === 'bad', '사무실 일을 로거로 안 보냄');
ok(S.decide({ id: 'b', k: 'bench', pc: 'HOME', on: true, task: 'bench' }, {}, [day()], SOLO, NOW).act === 'bad', '로거 칸 일을 사무실로 안 보냄');

console.log('④ 기다림');
ok(S.decide(L0, {}, [day()], {}, NOW).act === 'wait', '홀로 연결 등록 없으면 기다림');
ok(S.decide(L0, {}, [day({ at: new Date(NOW - 4 * 3600e3).toISOString() })], SOLO, NOW).act === 'wait', '소식 3시간 넘으면 기다림');
ok(S.decide(L0, {}, [day({ ver: '0.1.20' })], SOLO, NOW).act === 'wait', '번외 판이 낮으면 기다림');
ok(S.decide(L0, {}, [day({ tasks: { 'ext.nl': { pass: { can: false, why: '표본 3/30' } } } })], SOLO, NOW).act === 'wait', "'넘길 수 있음' 아니면 기다림");
ok(S.decide(L0, {}, [null, day()], SOLO, NOW).act === 'on', '어제 요약이라도 3시간 안이면 씀(자정 직후)');
ok(S.verGE('0.1.54', '0.1.25') && !S.verGE('0.1.9', '0.1.25') && S.verGE('0.1.25', '0.1.25'), '판 견주기');

console.log('⑤ 되돌림 줄');
ok(S.decide({ id: 'r', k: 'ext.nl', pc: 'HOME', on: false }, { jobs: { 'ext.nl': { on: true, pc: 'HOME' } } }, [], SOLO, NOW).act === 'off', '켜진 일은 끔');
ok(S.decide({ id: 'r', k: 'ext.nl', pc: 'HOME', on: false }, {}, [], SOLO, NOW).act === 'mark', '이미 꺼진 일은 표시만');

console.log('⑥ 가짜 Firestore로 한 회차');
(async () => {
  const D = new Map(); D.set('app_settings/col2_solo', { pcs: SOLO }); D.set('col2_jday/2026-11-13_HOME', day());
  const ref = (p) => ({ p, get: async () => ({ exists: D.has(p), data: () => JSON.parse(JSON.stringify(D.get(p))) }) });
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? merge(o[k], v) : v; return o; };
  const C = (c) => ({ doc: (id) => ref(c + '/' + id) });
  const db = { runTransaction: async (f) => f({ get: (r) => r.get(), set: (r, v, m) => D.set(r.p, m && m.merge ? merge(D.get(r.p), v) : v) }) };
  const logs = []; const _now = Date.now; Date.now = () => NOW;
  const T = S.makeSeed({ db, C, log: (...a) => logs.push(a.join(' ')) });
  const r1 = await T.tick(); const H = D.get('app_settings/col2_handoff') || {};
  ok(r1[0].act === 'on' && H.jobs['ext.nl'].on === true && H.jobs['ext.nl'].pc === 'HOME', '넘김을 씀', H);
  ok(Array.isArray(H.log) && H.log[0].k === 'ext.nl' && /차례표/.test(H.log[0].by), '기록 한 줄(웹앱 🔀 칸과 같은 꼴)', H.log);
  ok(H.seeds && H.seeds[L0.id] && H.seeds[L0.id].act === 'on', '줄 표시');
  /* 사람이 되돌림 → 다음 회차 다시 안 켬 */
  D.set('app_settings/col2_handoff', merge(D.get('app_settings/col2_handoff'), { jobs: { 'ext.nl': { on: false, offAt: 'x', offBy: '웹앱 HOME' } } }));
  const r2 = await T.tick(); ok(r2[0].act === 'done' && D.get('app_settings/col2_handoff').jobs['ext.nl'].on === false, '되돌린 뒤 다시 켜지 않음', r2);
  Date.now = _now;
  const IX = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
  ok(/require\('\.\/col2seed\.js'\)\.makeSeed/.test(IX) && /setInterval\(c2SeedTick, 10 \* 60e3\)/.test(IX), '클라우드 본체가 10분마다 부름');
  ok(/seed: C2SEED_LAST/.test(IX), '진단 col2에 차례표 마지막 회차');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
