// tPLOCK2_1118 — (plock2 11/18 · 정범님 I-1117-2027-23 「잠긴 상품은 판매 상태 말고 아무것도 안 바뀜」 · 리드 결정 F57) 🔒 잠금 마무리
//   ① 클라우드 예스24 자동 올림(cloud/y24auto.js) — 잠긴 상품(키로든 알라딘 상품 번호로든)은 예스24에 새로 올리지 않음 · 장부에도 안 적음 · 「🔒 잠금이라 건너뜀 N」
//   ② 풀면 다음 차례에 저절로 후보가 되어 올라감
//   ③ 바퀴 중간 잠금 — 차례 맨 앞 잠금 목록을 읽은 뒤 잠가도 올리기 직전 한 권씩 다시 읽어 뺌
//   ④ 잠금을 못 읽으면 이번엔 아무것도 올리지 않음(안전 쪽)
//   ⑤ 클라우드 조회수 실험(pxExpRun) — 바퀴 중간에 잠근 상품은 유의 사항을 고치지 않고 건너뜀(plk:1)
//   ⑥ 웹앱 y24AutoTick — 실시간 잠금으로 거르고 올리기 직전 plkLockedIds로 다시 읽음 · 못 읽으면 멈춤 · 건너뜀 띠
//   ⑦ (리드 결정 F57) 손으로 누르는 예스24 새로 올리기(📤 1건 미리 보기 확정·여러 건)도 잠긴 상품은 등록하지 않음 · 알림 글만(팝업 없음)
// 실행: node src/tests/tPLOCK2_1118.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
const { makeY24Reg } = require(path.join(TOP, 'lab/col2/helper/col2-y24reg.js'));
const XLP = [path.join(__dirname, 'xlsx.full.min.js'), process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
const texts = { 'src/app.html': rd('src/app.html'), 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
const HOMES = [];
/* 판 하나 — tHEADLESS1_1114와 같은 가짜 상품(A4 7,000원이 처음 한 건 · A1 9,000원이 다음) */
function world(wrapC) { let T = Date.parse('2026-11-18T01:00:00Z'); const clk = { now: () => T, step: (ms) => { T += ms; } };
  const F = makeDb(); const { store } = F; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: { aladin_A1: { c: ['ab001'] }, aladin_A2: { c: ['ab002'] }, aladin_A3: { c: ['ab003'] }, aladin_A4: { c: ['ab004'] }, aladin_A5: { c: ['ab005'] } } });
  const L = (id, isbn, price, x) => put('prd_listings', 'aladin_' + id, { listingId: 9000 + +id.slice(1), usedCode: id, title: '시험 책 ' + id, isbn13: isbn, grade: '상', price, priceList: 15000, qty: 1, sku: 'ABC_' + id, active: true, status: '판매중', ...(x || {}) });
  L('A1', '9788900000011', 9000); L('A2', '9788900000028', 5000); L('A3', '9788900000035', 4000); L('A4', '9788900000042', 7000); L('A5', '9788900000059', 3000, { sku: 'DUPES 미끼' });
  put('y24_listings', '111111111', { goodsNo: '111111111', isbn13: '9788900000035', grade: '상', state: '02', firstSeenAt: '2026-11-01T00:00:00Z' });
  put('crm_orders', 'aladin_X1', { kind: 'sale', orderedAt: '2026-11-17T00:00:00Z', orderNo: 'X1', items: [{ aladinUsedCode: 'A2', lineStatus: 'normal' }] });
  for (const i of ['9788900000011', '9788900000028', '9788900000035', '9788900000042']) put('y24_mkt', i, { none: true, at: '2026-11-18T00:00:00Z' });
  const C = wrapC ? wrapC(F.C, put, store) : F.C;
  const Y = makeY24Auto({ db: F.db, C, FV: F.FV, now: clk.now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX });
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'plk2-')); HOMES.push(HOME); const st = { login: 'ok', hold: false, en: true, pc: 'HOME' };
  const REG = makeY24Reg({ HOME, TEST: 1, note: () => {}, log: () => {}, pcName: () => st.pc, isLogger: () => false, enabled: () => st.en, login: () => st.login, holdOn: () => st.hold, kick: () => {} });
  const gather = () => { const s = REG.state(); return { st: { ok1: s.ok1, done: s.done, wait: s.wait, cur: s.cur, why: s.why, login: s.login, hold: s.hold, ban: s.ban, en: s.en }, res: s.res, rej: [] }; };
  const led = () => ((store.app_settings.y24_reg || {}).r || {});
  return { F, store, put, Y, REG, gather, led, clk, step: async () => { clk.step(61e3); return Y.step('HOME', gather()); } };
}
(async () => {
  /* ① 잠긴 상품은 올리지 않음 — A4는 상품 키로, A1은 알라딘 상품 번호(lid)로만 잠금(다른 키 문서) */
  { const W = world(); W.put('prd_locks', 'aladin_A4', { on: true, lid: '9004', why: '시험' }); W.put('prd_locks', 'aladin_A1_old', { on: true, lid: '9001', why: '시험(옛 키)' }); W.put('prd_locks', 'aladin_A3', { on: false, lid: '9003' });
    let y = await W.step(); const L1 = W.led();
    ok(!y.jobs.length && !L1.aladin_A4 && !L1.aladin_A1, '① 잠긴 A4(키)·A1(알라딘 상품 번호)은 예스24에 새로 올리지 않음 · 장부에도 안 적음 (등록 0)', { jobs: y.jobs.length, led: Object.keys(L1), why: y.why });
    ok(/🔒 잠금이라 건너뜀 2/.test(y.why) && y.plan && y.plan.plk === 2 && (y.plan.plkLids || []).includes('aladin_A4'), '① 상태 글에 「🔒 잠금이라 건너뜀 2」 · plan.plk = 2', { why: y.why, plan: y.plan });
    /* ② 풀면 다음 차례에 올라감 */
    W.store.prd_locks.aladin_A4.on = false; W.store.prd_locks.aladin_A1_old.on = false; y = await W.step(); const J = y.jobs[0];
    ok(J && J.rows.length === 1 && J.rows[0].lid === 'aladin_A4' && W.led().aladin_A4 && W.led().aladin_A4.st === 'auto', '② 풀면 다음 차례에 저절로 후보 — 처음 한 건 A4가 올라감', { jobs: y.jobs, why: y.why });
    ok(!/🔒/.test(y.why) && !(y.plan && y.plan.plk), '② 다 풀면 건너뜀 글 없음', { why: y.why, plan: y.plan }); }
  /* ③ 바퀴 중간 잠금 — 차례 맨 앞 목록(on==true)을 읽은 바로 뒤 A4를 잠금 → 올리기 직전 다시 읽어 뺌 → A1로 바꿔 고름 */
  { let armed = true; const W = world((C0, put) => (n) => { if (n !== 'prd_locks') return C0(n); const c = C0(n); return { doc: (id) => c.doc(id), where: (...a) => { const q = c.where(...a); return { get: async () => { const r = await q.get(); if (armed && a[0] === 'on') { armed = false; put('prd_locks', 'aladin_A4', { on: true, lid: '9004', why: '바퀴 중간' }); } return r; } }; } }; });
    const y = await W.step(); const J = y.jobs[0];
    ok(!armed && !W.led().aladin_A4 && !(J && J.rows.some((r) => r.lid === 'aladin_A4')), '③ 첫 목록 뒤에 잠근 A4는 올리기 직전 다시 읽어 뺌 (등록 0)', { jobs: y.jobs, led: Object.keys(W.led()), why: y.why });
    ok(J && J.rows.length === 1 && J.rows[0].lid === 'aladin_A1' && y.plan && y.plan.drop === 1 && y.plan.plk === 1, '③ 뺀 자리는 다음 후보(A1)로 다시 고름 · plan.drop 1 · plan.plk 1', { jobs: y.jobs, plan: y.plan, why: y.why });
    ok(/🔒 잠금이라 건너뜀 1/.test(y.why), '③ 상태 글에 「🔒 잠금이라 건너뜀 1」', y.why); }
  /* ③-2 바퀴 중간 잠금을 알라딘 상품 번호로만(다른 키) 해도 뺌 */
  { let armed = true; const W = world((C0, put) => (n) => { if (n !== 'prd_locks') return C0(n); const c = C0(n); return { doc: (id) => c.doc(id), where: (...a) => { const q = c.where(...a); return { get: async () => { const r = await q.get(); if (armed && a[0] === 'on') { armed = false; put('prd_locks', 'aladin_A4_old', { on: true, lid: '9004' }); } return r; } }; } }; });
    const y = await W.step(); ok(!W.led().aladin_A4 && y.jobs[0] && y.jobs[0].rows[0].lid === 'aladin_A1', '③-2 바퀴 중간에 알라딘 상품 번호로만 잠가도 뺌', { jobs: y.jobs, why: y.why }); }
  /* ④ 잠금을 못 읽으면 올리지 않음 */
  { const W = world((C0) => (n) => (n === 'prd_locks' ? { doc: () => ({ get: async () => { throw new Error('권한 없음'); } }), where: () => ({ get: async () => { throw new Error('권한 없음'); } }) } : C0(n)));
    const y = await W.step(); ok(!y.jobs.length && !Object.keys(W.led()).length && /잠금 상태를 못 읽어/.test(y.why), '④ 잠금을 못 읽으면 이번엔 아무것도 올리지 않음(안전 쪽)', { why: y.why }); }
  /* ④-2 맨 앞 목록은 읽혔는데 올리기 직전 한 권 다시 읽기만 실패 → 그 책은 뺌 */
  { const W = world((C0) => (n) => { if (n !== 'prd_locks') return C0(n); const c = C0(n); return { doc: () => ({ get: async () => { throw new Error('끊김'); } }), where: (...a) => c.where(...a) }; });
    const y = await W.step(); ok(!y.jobs.length && !Object.keys(W.led()).length, '④-2 올리기 직전 다시 읽기를 못 하면 그 책은 올리지 않음', { why: y.why, jobs: y.jobs.length }); }
  /* ⑤ pxExpRun — 바퀴 중간 잠금 */
  { const src = rd('cloud/index.js'); const a = src.indexOf('async function pxExpRun('); const endS = "log('🔬 조회수 실험', v.op || 'add', JSON.stringify(res).slice(0, 300)); }"; const b = src.indexOf(endS, a); const code = src.slice(a, b + endS.length);
    ok(a > 0 && b > a, '⑤ pxExpRun을 떼어 냄');
    const store = { px_exp: {}, prd_locks: {} }; let clock = 0; const notes = {};
    const qry = (n, w) => ({ get: async () => ({ docs: Object.entries(store[n] || {}).filter(([, v]) => w.every(([k, op, x]) => op === '==' && v[k] === x)).map(([id, v]) => ({ id, data: () => v })) }), where: (k, op, x) => qry(n, w.concat([[k, op, x]])) });
    const C = (n) => ({ where: (k, op, x) => qry(n, [[k, op, x]]), doc: (id) => ({ get: async () => ({ exists: !!(store[n] && store[n][id]), data: () => (n === 'app_settings' ? { cloudUrl: 'https://cloud.test' } : store[n] && store[n][id]) }), set: async (o) => { store[n] = store[n] || {}; store[n][id] = { ...(store[n][id] || {}), ...o }; } }) });
    const ids = ['404937001', '404937002', '404937003']; const LOCK = ids[1];
    const peRead = async (p, lid) => { clock += 3000; if (lid === LOCK) store.prd_locks.aladin_L2 = { on: true, lid: LOCK, why: '바퀴 중간' }; return { ok: true, uid: lid, noteHtml: notes[lid] || '<p>글 ' + lid + '</p>' }; };
    let sent = []; const peFormSubmit = async (lid, w) => { clock += 2000; sent.push(lid); notes[lid] = w.noteHtml; return {}; };
    const curPage = () => ({ evaluate: async () => ({ http: 200, kept: true }) }); const FV = { arrayUnion: (x) => x, serverTimestamp: () => 'ts' };
    const mk0 = new Function('C', 'peRead', 'peFormSubmit', 'curPage', 'FV', 'sleep', 'nowIso', 'log', 'W', 'login', 'peTxt', 'Date', 'jsleep', 'PXON', 'asMod', code + '\nreturn pxExpRun;');
    const slp = async (ms) => { clock += ms; }; const run = mk0(C, peRead, peFormSubmit, curPage, FV, slp, () => new Date(1e12 + clock).toISOString(), () => {}, () => ({}), async () => {}, (h) => String(h || '').replace(/<[^>]+>/g, ''), { now: () => clock }, slp, { set: null }, async () => null);
    let cmd = { type: 'pxExp', op: 'add', listingIds: ids, status: 'running' }; const ref = { set: async (o) => { cmd = { ...cmd, ...o, results: { ...(cmd.results || {}), ...(o.results || {}) } }; } };
    await run(null, ref, cmd); const R = cmd.results || {};
    ok(!sent.includes(LOCK) && !/\/px\//.test(notes[LOCK] || ''), '⑤ 바퀴 중간에 잠근 상품은 알라딘 유의 사항을 고치지 않음', { sent, note: notes[LOCK] });
    ok(R[LOCK] && R[LOCK].state === 'skip' && R[LOCK].plk === 1 && /바퀴 중간/.test(R[LOCK].msg), '⑤ 결과는 건너뜀(plk:1 · 바퀴 중간에 잠김)', R[LOCK]);
    ok(sent.includes(ids[0]) && sent.includes(ids[2]) && /\/px\//.test(notes[ids[0]] || ''), '⑤ 잠기지 않은 다른 상품은 그대로 함', { sent }); }
  /* ⑥ 웹앱 y24AutoTick 코드 */
  { const A = rd('src/app.html'); const i = A.indexOf('async function y24AutoTick()'); const j = A.indexOf('\nsetTimeout(y24AutoTick, 20000);', i); const T = A.slice(i, j);
    ok(i > 0 && j > i, '⑥ 웹앱 y24AutoTick을 찾음');
    ok(/if \(!S\.plkOk\)[\s\S]{0,200}return; \}/.test(T), '⑥ 실시간 잠금을 받기 전엔 고르지 않음');
    ok(/const plkY = \(r\) => plkOn\(r\.lid\) \|\| plkOnL\(S\.plist && S\.plist\.get\(r\.lid\)\)/.test(T) && /cand00\.filter\(\(r\) => !plkY\(r\)\)/.test(T), '⑥ 후보에서 잠긴 상품(키·알라딘 상품 번호)을 뺌');
    const pk = T.indexOf('await plkLockedIds(ids)'), cm = T.indexOf('await y24AutoCommit(cand, jid)');
    ok(pk > 0 && cm > pk && /if \(!lk\) \{[^}]*못 읽어[^}]*return; \}/.test(T), '⑥ 올리기(y24AutoCommit) 직전 plkLockedIds로 다시 읽음 · 못 읽으면 멈춤');
    ok(/function y24AutoPlk\(keys\)[\s\S]{0,600}plkSkipped\(keys, '예스24 자동 올림'\)/.test(A) && /10 \* 60e3\) return/.test(A.slice(A.indexOf('function y24AutoPlk('), A.indexOf('function y24AutoPlk(') + 700)), '⑥ 「🔒 잠금이라 건너뜀 N」 띠 — 건너뛴 상품이 바뀌었거나 10분마다만');
    /* y24AutoPlk을 떼어 돌려 봄 */
    const f0 = A.indexOf('function y24AutoPlk('); const f1 = A.indexOf('\n', f0); const calls = []; const S = {}; const Y24A = {};
    const fn = new Function('S', 'Y24A', 'plkSkipped', A.slice(f0, f1) + '\nreturn y24AutoPlk;')(S, Y24A, (k, w) => calls.push([k.length, w]));
    fn(['aladin_A4', 'aladin_A1']); fn(['aladin_A1', 'aladin_A4']); fn(['aladin_A4']); fn([]);
    ok(calls.length === 2 && calls[0][1] === '예스24 자동 올림' && Y24A.plk.n === 0, '⑥ 같은 상품이면 띠를 다시 띄우지 않음 · 바뀌면 띄움', { calls, plk: Y24A.plk }); }
  /* ⑦ (리드 결정 F57) 손으로 누르는 예스24 새로 올리기(📤 1건 미리 보기 확정·여러 건)도 잠긴 상품은 장부에 안 적고 「🔒 잠긴 상품 — 잠금을 풀면 등록됩니다」 · 못 읽으면 올리지 않음 */
  { const A = rd('src/app.html'); const i = A.indexOf('async function y24RegLockCut('); const endS = "toast('예스24 올리기 실패: ' + errKo(e)); } }"; const j = A.indexOf(endS, i);
    const mk = (lk) => { const T = [], C = [], K = []; const S = { plist: new Map([['aladin_A1', { listingId: 9001 }], ['aladin_A4', { listingId: 9004 }]]), _y24Pick: new Set() };
      const go = new Function('S', 'plkLockedIds', 'plkSkipped', 'toast', 'y24RegCommit', 'errKo', A.slice(i, j + endS.length) + '\nreturn y24RegGo;')(S, async () => lk, (k, w) => K.push([k, w]), (m) => T.push(m), async (rows) => { C.push(rows.map((r) => r.lid)); return { ok: rows, skip: [] }; }, (e) => String(e)); return { go, T, C, K }; };
    let w = mk(new Set(['9004'])); await w.go([{ lid: 'aladin_A4' }]);
    ok(i > 0 && j > i && !w.C.length && w.T[0] === '🔒 잠긴 상품 — 잠금을 풀면 등록됩니다' && w.K[0] && w.K[0][1] === '예스24 새로 올리기', '⑦ 손 등록(1건 미리 보기 확정) — 잠긴 상품(알라딘 상품 번호로 잠금)은 장부에 안 적고 「🔒 잠긴 상품 — 잠금을 풀면 등록됩니다」', { T: w.T, C: w.C, K: w.K });
    w = mk(new Set(['aladin_A4'])); await w.go([{ lid: 'aladin_A4' }, { lid: 'aladin_A1' }]); ok(w.C.length === 1 && w.C[0].join() === 'aladin_A1' && /빼고 올림/.test(w.T[0]), '⑦ 여러 건이면 잠긴 것만 빼고 나머지는 올림', { T: w.T, C: w.C });
    w = mk(null); await w.go([{ lid: 'aladin_A1' }]); ok(!w.C.length && /못 읽어/.test(w.T[0]), '⑦ 잠금을 못 읽으면 손 등록도 하지 않음(안전 쪽)', { T: w.T });
    const P = A.slice(A.indexOf('function y24RegPop('), A.indexOf('function y24RegPop(') + 600); ok(/plkOn\(lid\) \|\| \(l0 && plkOnLid\(l0\.listingId\)\)\) return toast\('🔒 잠긴 상품 — 잠금을 풀면 등록됩니다'/.test(P), '⑦ 1건 미리 보기 판은 잠긴 상품이면 열지 않고 알림(팝업 없음)'); }
  for (const h of HOMES) { try { fs.rmSync(h, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ tPLOCK2_1118 실패 ${bad}` : '✓ tPLOCK2_1118 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tPLOCK2_1118 오류', e && e.stack); process.exit(1); });
