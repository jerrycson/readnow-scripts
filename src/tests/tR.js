// (10/27 wR) 🚦 로그인 일은 로그인된 PC 먼저 — ① PC 수집기 🤖 자동 발송요청 판단(autoShipPc) ② 클라우드 받침(PC 판단 중이면 판단 안 함 · 따라가기·검토 알림 한 번)
//  ③ 동시에 판단해도 한 번만 ④ 배송&구매확정전 임대 ⑤ 노선표 ⑥ 수집기 '클라우드 기다림'은 로그인 풀린 PC만 ⑦ 웹앱 🤖 줄 판단 기기 이름 — 노드(가짜 Firestore) + Playwright
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js'); const REG = require('../readnow-registry.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };

/* ── 가짜 Firestore (트랜잭션은 한 번에 하나씩 — 직렬) ── */
function mkStore() { const store = {}; const col = (c) => (store[c] = store[c] || {});
  let txQ = Promise.resolve();
  const ref = (c, id) => ({ id, _c: c, get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { col(c)[id] = o && o.merge ? { ...(col(c)[id] || {}), ...v } : v; }, create: async (v) => { if (col(c)[id]) throw new Error('ALREADY_EXISTS'); col(c)[id] = v; }, update: async (v) => { col(c)[id] = { ...(col(c)[id] || {}), ...v }; } });
  const match = (d, [k, o, x]) => (o === '==' ? d[k] === x : o === 'in' ? x.includes(d[k]) : o === 'array-contains' ? Array.isArray(d[k]) && d[k].includes(x) : true);
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + Math.random().toString(36).slice(2, 8)), where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, orderBy: () => q, limit: () => q, get: async () => { const docs = Object.entries(col(c)).filter(([, d]) => q._f.every((f) => match(d, f))).map(([id, d]) => ({ id, ref: ref(c, id), data: () => d })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } }; return q; } });
  const db = { runTransaction: (fn) => { const run = txQ.then(async () => { const w = []; const tx = { get: async (r) => r.get(), set: (r, v, o) => w.push(() => r.set(v, o)), update: (r, v) => w.push(() => r.update(v)) }; const out = await fn(tx); for (const f of w) await f(); return out; }); txQ = run.catch(() => {}); return run; } };
  return { store, col, C, db }; }

const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 });
const E = (rows) => ({ mkt: { at: new Date().toISOString(), rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours' });
const it = (lid, price, qty) => ({ listingId: lid, title: '책' + lid, price, qty: qty || 1, grade: '상' });
const ordAt = (min) => { const d = new Date(Date.now() + 9 * 3600e3 - min * 60e3); return d.toISOString().slice(0, 16).replace('T', ' '); };

/* ── ① 수집기 autoShipPc 떼어 돌리기 ── */
const colSrc = fs.readFileSync(path.join(__dirname, '../readnow-collector.user.js'), 'utf8');
const pa = colSrc.indexOf('  const AU = { mem: new Map()'); const pb = colSrc.indexOf('  window.__rnAutoShipPc = (orders) => autoShipPc(orders);'); if (pa < 0 || pb < 0) { console.log('❌ tR 실패 — 수집기에서 autoShipPc를 못 찾음'); process.exit(1); }
function pcCtx(F, name, extra) { const ran = []; const logs = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: name }), TS: () => 'TS', nowIso: () => new Date().toISOString(), log: (m) => logs.push(m), PC_NAME: name, APP_VER: '1.89.t', PUBONLY: false, auth: { currentUser: { email: 'x' } }, pcLoggedNow: () => true, runCmd: async (id) => { ran.push(id); }, setTimeout: (f) => f(), Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number, isFinite,
    window: { ReadnowShipping: SH, ReadnowML: ML, __rnFeat: (k) => true }, globalThis: {}, ...(extra || {}) };
  vm.runInNewContext(colSrc.slice(pa, pb) + '\nthis.autoShipPc = autoShipPc; this.AU = AU;', ctx); return { ctx, ran, logs }; }

/* ── ② 클라우드 shipAutoTick·autoTrack 떼어 돌리기 ── */
const clSrc = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const ca = clSrc.indexOf('const autoMem = new Map();'); const cb = clSrc.indexOf('async function shipNotifyTick'); const wonDef = clSrc.match(/const wonT = [^\n]*/)[0];
function cloudCtx(F) { const pushes = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: 'cloud' }), FV: { serverTimestamp: () => 'TS' }, nowIso: () => new Date().toISOString(), log: () => {}, VER: '0.t', kickFlag: false, lastConfirm: [],
    shipCoreNode: () => SH, mlMod: async () => ML, pushSend: async (n, p, k) => { pushes.push({ k, p }); return { ok: 1 }; }, Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number };
  vm.runInNewContext(wonDef + '\n' + clSrc.slice(ca, cb) + '\nthis.shipAutoTick = shipAutoTick; this.autoTrack = autoTrack; this.resetTrack = () => { autoTrackAt = 0; }; this.mem = autoMem;', ctx); return { ctx, pushes }; }

(async () => {
  console.log('① PC 수집기가 판단');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 3600e3).toISOString() };
    F.col('shp_enrich')['11'] = E([row('green', '상', 10000)]); F.col('shp_enrich')['22'] = E([row('green', '상', 10000)]);
    const o1 = { orderNo: 'P-1', buyer: '갑', orderedAt: ordAt(2), items: [it('11', 9000)] }; // 통과
    const o2 = { orderNo: 'P-2', buyer: '을', orderedAt: ordAt(2), items: [it('22', 7000)] }; // 30% 쌈 → 검토
    const o3 = { orderNo: 'P-3', buyer: '병', orderedAt: ordAt(2), items: [it('33', 9000)] }; // 시장 없음 → 기다림
    const { ctx, ran } = pcCtx(F, 'JS-MAIN'); const r = await ctx.autoShipPc([o1, o2, o3]);
    const A = F.col('shp_auto'), K = F.col('shp_cmds');
    ok(r && r.sent === 1 && r.review === 1 && r.wait === 1, '통과 1 · 검토 1 · 기다림 1: ' + JSON.stringify(r));
    ok(A['P-1'].state === 'sent' && A['P-1'].by === 'JS-MAIN' && A['P-1'].cmdId === 'auto_P-1', '통과 → shp_auto sent · 판단 기기 JS-MAIN');
    ok(K['auto_P-1'] && K['auto_P-1'].dev === 'JS-MAIN' && K['auto_P-1'].type === 'startDelivery' && K['auto_P-1'].auto === true && /JS-MAIN 판단/.test(K['auto_P-1'].by), '발송준비시작 맡김 = 이 PC 이름(dev) — 클라우드를 기다리지 않음');
    ok(ran.length === 1 && ran[0] === 'auto_P-1', '그 PC가 바로 처리(runCmd 불림)');
    ok(A['P-2'].state === 'review' && A['P-2'].pushWant === true && !K['auto_P-2'], '검토 → pushWant(클라우드가 알림) · 발송준비시작 안 맡김');
    ok(A['P-3'].state === 'wait' && A['P-3'].by === 'JS-MAIN', '시장 없음 → 기다림 기록');
    const SA = F.col('app_settings').ship_auto; ok(SA.beatBy === 'JS-MAIN' && SA.beats && SA.beats['JS-MAIN'] && SA.beatAt, '판단 신호 beatAt + beatBy(JS-MAIN)');
    // 두 번째 고리: 같은 주문 다시 판단 안 함 · 시장 들어오면 기다림 → 통과
    F.col('shp_enrich')['33'] = E([row('green', '상', 9500)]); const r2 = await ctx.autoShipPc([o1, o2, o3]);
    ok(r2 && r2.sent === 1 && ran.length === 2 && ran[1] === 'auto_P-3' && A['P-3'].state === 'sent', '기다리던 주문은 시장이 오면 통과 · 끝난 주문은 다시 안 함');
    // 다른 PC(HOME)가 같은 목록으로 판단해도 한 번만
    const H = pcCtx(F, 'HOME'); const r3 = await H.ctx.autoShipPc([o1, o2, o3]); ok(!r3 || (!r3.sent && !r3.review), '다른 PC는 이미 정한 주문을 다시 판단하지 않음');
    ok(Object.keys(K).length === 2, '발송준비시작 맡김은 주문마다 하나: ' + Object.keys(K).join(','));
    // 로그인이 풀린 PC·출고 기능 끈 PC·로거는 판단 안 함
    const F2 = mkStore(); F2.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 3600e3).toISOString() };
    const off1 = pcCtx(F2, 'MJ-MAIN', { pcLoggedNow: () => false }); ok((await off1.ctx.autoShipPc([o1])) === null && !F2.col('shp_auto')['P-1'], '로그인 풀린 PC는 판단 안 함');
    const off2 = pcCtx(F2, 'MJ-MAIN', { PUBONLY: true }); ok((await off2.ctx.autoShipPc([o1])) === null, '로거(공개 전용)는 판단 안 함');
    const off3 = pcCtx(F2, 'MJ-MAIN', { window: { ReadnowShipping: SH, ReadnowML: ML, __rnFeat: (k) => k !== 'ship' } }); ok((await off3.ctx.autoShipPc([o1])) === null, '출고 기능 끈 PC는 판단 안 함');
    F2.col('app_settings').ship_auto.on = false; const off4 = pcCtx(F2, 'MJ-MAIN'); ok((await off4.ctx.autoShipPc([o1])) === null && !F2.col('shp_auto')['P-1'], '자동 발송요청 꺼짐이면 판단 안 함');
    // 켜기 전 주문 · 사람이 먼저 맡긴 주문
    const F3 = mkStore(); F3.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 60e3).toISOString() }; F3.col('shp_enrich')['11'] = E([row('green', '상', 10000)]);
    F3.col('shp_cmds').h1 = { type: 'startDelivery', orderNos: ['Q-2'], status: 'done' };
    const q = pcCtx(F3, 'JS-MAIN'); await q.ctx.autoShipPc([{ orderNo: 'Q-1', buyer: '정', orderedAt: ordAt(30), items: [it('11', 9000)] }, { orderNo: 'Q-2', buyer: '무', orderedAt: ordAt(0), items: [it('11', 9000)] }]);
    ok(F3.col('shp_auto')['Q-1'].state === 'skip' && F3.col('shp_auto')['Q-2'].state === 'human' && q.ran.length === 0, '켜기 전 주문 → skip · 사람이 먼저 맡긴 주문 → human (발송준비시작 안 함)'); }

  console.log('② 동시에: PC와 클라우드가 같은 주문을 같은 때 판단해도 한 번만');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 3600e3).toISOString() }; F.col('shp_enrich')['11'] = E([row('green', '상', 10000)]);
    const o = { orderNo: 'R-1', buyer: '갑', orderedAt: ordAt(1), items: [it('11', 9000)] };
    const pc = pcCtx(F, 'JS-MAIN'); const cl = cloudCtx(F); cl.ctx.lastConfirm = [o];
    await Promise.all([pc.ctx.autoShipPc([o]), cl.ctx.shipAutoTick({ enrich: { 11: F.col('shp_enrich')['11'] } }, { cmds: true, confirm: true })]);
    const K = F.col('shp_cmds'); ok(Object.keys(K).length === 1 && K['auto_R-1'], '발송준비시작 맡김 하나뿐(auto_R-1)');
    const A = F.col('shp_auto')['R-1']; ok(A.state === 'sent' && (A.by === 'JS-MAIN' ? K['auto_R-1'].dev === 'JS-MAIN' : K['auto_R-1'].dev === 'cloud'), `판단 기록 한 번(${A.by}) · 맡김의 dev가 판단한 곳과 같음`); }

  console.log('③ 클라우드 = 받침');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 3600e3).toISOString(), beatBy: 'JS-MAIN', beatAt: new Date().toISOString() }; F.col('shp_enrich')['11'] = E([row('green', '상', 10000)]);
    const o = { orderNo: 'S-1', buyer: '갑', orderedAt: ordAt(1), items: [it('11', 9000)] }; const cl = cloudCtx(F); cl.ctx.lastConfirm = [o];
    await cl.ctx.shipAutoTick({ enrich: {}, viaPc: 'JS-MAIN' }, { cmds: true, confirm: true });
    ok(!F.col('shp_auto')['S-1'] && !Object.keys(F.col('shp_cmds')).length, 'PC 판단 신호가 5분 안이면 클라우드는 판단하지 않음');
    // PC 신호 끊김(옛 판 수집기) + PC가 목록은 읽는 중 → 클라우드가 판단하되 발송준비시작은 그 PC 이름으로
    F.col('app_settings').ship_auto.beatAt = new Date(Date.now() - 10 * 60e3).toISOString(); const cl2 = cloudCtx(F); cl2.ctx.lastConfirm = [o];
    await cl2.ctx.shipAutoTick({ enrich: { 11: F.col('shp_enrich')['11'] }, viaPc: 'JS-MAIN' }, { cmds: true, confirm: true });
    const K = F.col('shp_cmds')['auto_S-1']; ok(K && K.dev === 'JS-MAIN' && /JS-MAIN 처리/.test(K.by) && F.col('shp_auto')['S-1'].by === 'cloud' && F.col('shp_auto')['S-1'].list === 'JS-MAIN', '클라우드 받침 판단 → 발송준비시작은 목록을 읽은 PC(dev JS-MAIN)가 바로');
    ok(cl2.ctx.kickFlag === false, 'PC 몫이라 클라우드를 깨우지 않음(kickFlag 그대로)');
    ok(F.col('app_settings').ship_auto.beatBy === 'cloud', '받침으로 판단한 동안 판단 신호 = cloud'); }

  console.log('④ 따라가기·알림 (판단한 기기와 상관없이 클라우드가 · 한 번만)');
  { const F = mkStore(); F.col('shp_auto')['T-1'] = { orderNo: 'T-1', state: 'review', by: 'JS-MAIN', pushWant: true, reasons: ['30% 쌈'], total: 7000, qty: 1 };
    F.col('shp_auto')['T-2'] = { orderNo: 'T-2', state: 'sent', by: 'HOME', cmdId: 'auto_T-2', total: 9000, qty: 1 }; F.col('shp_cmds')['auto_T-2'] = { status: 'done', results: { 'T-2': { state: 'done', at: new Date().toISOString(), proof: 'inDelivery' } } };
    F.col('shp_auto')['T-3'] = { orderNo: 'T-3', state: 'wait', by: 'HOME', at: new Date(Date.now() - 5 * 60e3).toISOString() };
    const cl = cloudCtx(F); const o1 = await cl.ctx.autoTrack(null, false); cl.ctx.resetTrack(); const o2 = await cl.ctx.autoTrack(null, false);
    ok(cl.pushes.filter((x) => x.k === 'autorev').length === 1 && F.col('shp_auto')['T-1'].pushWant === false && F.col('shp_auto')['T-1'].push, 'PC가 검토로 정한 주문 → 클라우드가 🔎 알림 한 번(pushWant 끔)');
    ok(F.col('shp_auto')['T-2'].state === 'done' && cl.pushes.filter((x) => x.k === 'autodone').length === 1, 'PC가 맡긴 발송준비시작 완료 → ✅ 완료 알림 한 번');
    ok(F.col('shp_auto')['T-3'].state === 'wait', '목록을 모를 때(회차가 앞에서 멈춤)는 기다림을 사라짐으로 바꾸지 않음');
    cl.ctx.resetTrack(); await cl.ctx.autoTrack([{ orderNo: 'X' }], true); ok(F.col('shp_auto')['T-3'].state === 'gone', '목록을 알면 목록에서 빠진 기다림 → gone'); }

  console.log('⑤ 배송&구매확정전 임대(PC·클라우드)');
  { const F = mkStore(); const lc = clSrc.match(/async function tabLease\(by, force\)[^\n]*/)[0]; const cctx = { C: F.C, db: F.db, nowIso: () => new Date().toISOString(), Date };
    vm.runInNewContext(lc + '\nthis.tabLease = tabLease;', cctx);
    const lp = colSrc.match(/  async function tabLeasePc\(force\)[^\n]*/)[0]; const pctx = { C: F.C, db: F.db, nowIso: () => new Date().toISOString(), PC_NAME: 'JS-MAIN', Date }; vm.runInNewContext(lp + '\nthis.tabLeasePc = tabLeasePc;', pctx);
    const a = await pctx.tabLeasePc(false), b = await cctx.tabLease('cloud', false), c = await cctx.tabLease('cloud', true), d = await pctx.tabLeasePc(false);
    ok(a === true && b === false && c === true && d === false, `PC가 읽으면 클라우드 자동은 쉼(${a},${b}) · 사람이 누른 다시 읽기는 늘(${c}) · 그 뒤 PC 자동은 쉼(${d})`); }

  console.log('⑥ 노선표 · 수집기 기다림 규칙');
  { const R = REG.merge ? REG.merge({}) : null; const can = (t, w) => REG.canHandle(R, t, w);
    ok(R && can('tab', 'pc') && can('tab', 'cloud') && can('vatRead', 'pc') && can('vatRead', 'cloud'), '출고별 매출(tab)·부가가치세(vatRead) = PC도 · 클라우드도');
    ok(R && R.KINDS.tab.by[0] === 'pc' && R.KINDS.vatRead.by[0] === 'pc', '맡는 곳 순서 PC 먼저');
    const J = (R && R.JOBS) || REG.DEFAULTS.JOBS; ok(J.some((j) => j.k === 'autoShip' && j.by[0] === 'pc'), '일정 작업에 🤖 자동 발송요청 판단(PC 먼저)');
    ok(/const cfWait = \(x\) => [^;]*!pcLoggedNow\(\)/.test(colSrc) && /cfWait\(x0\)/.test(colSrc) && /\.\.\.\(cfWait\(x\) \? \{ pcFallback/.test(colSrc), '수집기: 출고·돈 일(CLOUD_FIRST)에서 클라우드를 기다리는 것은 로그인 풀린 PC만');
    ok(/cloudSt\.login !== 'off'/.test(colSrc), "수집기: 클라우드가 로그인 안 된 채(login 'off')면 '살아 있음'으로 보지 않음");
    ok(/vatReadPc\(ref, v\)/.test(colSrc) && /tabReadPc\(true\)/.test(colSrc), '수집기에 tab·vatRead 처리 길');
    ok(/if \(!pcLoggedNow\(\) \|\| \(await otherPcFresh\(\)\)\) continue;/.test(colSrc) && !/cloudFresh\(\)\) continue/.test(colSrc), '수집기 주문확인요청 15초 읽기: 클라우드를 기다리지 않음 · PC끼리 한 대');
    ok(/needLogin\(x0\.type\)\) \{[^\n]*\n\s*if \(!x0\.cloudTried && Date\.now\(\) - [^\n]*< 20e3 && \(await pcReader\(40e3\)/.test(clSrc), '클라우드: 로그인 일은 로그인된 PC가 있으면 20초 뒤에만');
    ok(/if \(loginQuiet\) throw new Error\('19금/.test(clSrc) && /if \(loginQuiet\) return null;/.test(clSrc), '클라우드: PC 목록으로 일할 때 19금 시장은 새 로그인 시도 안 함'); }

  console.log('⑦ 웹앱 🤖 줄 · 설정 · 기능 찾기 (Playwright)');
  await new Promise((res) => require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const pe = []; p.on('pageerror', (e) => pe.push(e.message));
    const r = await p.evaluate(() => { S.shipAutoCfg = { on: true, beatAt: new Date().toISOString(), beatBy: 'JS-MAIN' }; S._saW = 1; S.shipAuto = new Map([['W-1', { orderNo: 'W-1', state: 'sent', by: 'HOME', total: 9000, items: [], decidedAt: new Date().toISOString() }]]);
      const a = shipAutoLine('W-0', true); S.shipAutoCfg = { on: true, beatAt: new Date(Date.now() - 20 * 60e3).toISOString(), beatBy: 'cloud' }; const b = shipAutoLine('W-0', true); const c = shipAutoLine('W-1', true); S.shipAutoCfg = { on: true, beatAt: new Date().toISOString(), beatBy: 'MJ-MAIN' }; const d = shipAutoSetHtml();
      const f = FEAT.find((x) => /로그인된 PC 먼저/.test(x.t)); return { a, b, c, d, f: !!f && typeof f.go.fn === 'function' }; });
    ok(/판정 중 — JS-MAIN PC가/.test(r.a) && !/클라우드가 시장/.test(r.a), '판단 전 줄 = 판단하는 기기 이름(JS-MAIN PC) · 클라우드 이름으로 짓지 않음');
    ok(/지금 판단하는 기기 없음/.test(r.b) && /클라우드/.test(r.b), '10분 넘게 신호 없으면 ⚠ 지금 판단하는 기기 없음(마지막 기기 이름과 함께)');
    ok(/HOME PC/.test(r.c), '판단 기록 풍선에 판단한 기기(HOME PC)');
    ok(/판단 신호 [^<]*MJ-MAIN PC/.test(r.d) && /로그인된 PC 수집기 먼저/.test(r.d), '⚙ 설정에 판단 신호 + 기기 이름 · 설명 PC 먼저');
    ok(r.f, '🔍 기능 찾기에 \'로그인 일은 로그인된 PC 먼저\'');
    const h = await p.evaluate(async () => { try { openManual(); } catch (e) { return 'ERR ' + e.message; } await new Promise((r) => setTimeout(r, 800)); const t = document.body.textContent; return { who: /누가 판단하나/.test(t), chg: /클라우드 먼저'는 끝났습니다/.test(t), vat: /로그인된 PC 수집기가 먼저/.test(t) }; });
    ok(h && h.who && h.chg && h.vat, '❓ 설명서: 누가 판단하나 · 일 배정 바뀜 · 매출 맞춰 보기 PC 먼저 ' + JSON.stringify(h));
    ok(!pe.length, '화면 오류 없음 ' + pe.join(' | ')); res(); }));

  console.log(bad ? `❌ tR 실패 (${bad})` : '✓ tR 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ tR 실패 —', e.stack || e.message); process.exit(1); });
