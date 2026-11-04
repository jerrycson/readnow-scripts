// tHOLD — 정범님 11/04 두 가지
//  ⓐ 🔄 시장 다시 읽기 뒤 다시 판단(autoRejudge)은 🔎 검토 주문만 — 켜기 전에 들어와 사람 몫으로 남은 주문(skip)·대기 주문은 그대로
//  ⓑ ⏸ 출고 카드 보류 — 보류한 주문은 PC 자동 판단(autoShipPc)·클라우드 자동 판단(shipAutoTick)·다시 판단(autoRejudge)·시장 자료 없음 다시 판단(autoMktRetryTick) 모두 안 건드림 · 풀면 돌아감
//  노드(가짜 Firestore — tAR과 같은 모양) + Playwright(웹앱 카드 단추·표시·기록)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 });
function mkStore() { const store = {}; const col = (c) => (store[c] = store[c] || {}); let txQ = Promise.resolve();
  const AU = (v) => (v && v.__au ? v : null); const mergeSet = (old, v) => { const o = { ...(old || {}) }; for (const [k, x] of Object.entries(v)) o[k] = AU(x) ? [...(o[k] || []), ...x.__au] : x; return o; };
  const ref = (c, id) => ({ id, _c: c, get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { col(c)[id] = o && o.merge ? mergeSet(col(c)[id], v) : mergeSet(null, v); }, create: async (v) => { if (col(c)[id]) throw new Error('ALREADY_EXISTS'); col(c)[id] = v; }, update: async (v) => { col(c)[id] = { ...(col(c)[id] || {}), ...v }; } });
  const dig = (d, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), d);
  const match = (d, [k, o, x]) => { const y = dig(d, k); return o === '==' ? y === x : o === '>=' ? String(y || '') >= x : o === 'in' ? x.includes(y) : o === 'array-contains' ? Array.isArray(y) && y.includes(x) : true; };
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + Math.random().toString(36).slice(2, 8)), add: async (v) => { const id = 'a' + Math.random().toString(36).slice(2, 8); col(c)[id] = v; return ref(c, id); }, where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, orderBy: () => q, limit: () => q, get: async () => { const docs = Object.entries(col(c)).filter(([, d]) => q._f.every((f) => match(d, f))).map(([id, d]) => ({ id, ref: ref(c, id), data: () => d })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } }; return q; } });
  const db = { runTransaction: (fn) => { const run = txQ.then(async () => { const w = []; const tx = { get: async (r) => r.get(), set: (r, v, o) => w.push(() => r.set(v, o)), update: (r, v) => w.push(() => r.update(v)) }; const out = await fn(tx); for (const f of w) await f(); return out; }); txQ = run.catch(() => {}); return run; } };
  return { store, col, C, db }; }
const clSrc = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const ca = clSrc.indexOf('const mktForce = new Map(), mktJobs'); const cb = clSrc.indexOf('async function shipNotifyTick'); const wonDef = clSrc.match(/const wonT = [^\n]*/)[0];
function cloudCtx(F) { const pushes = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: 'cloud' }), FV: { serverTimestamp: () => 'TS', arrayUnion: (...a) => ({ __au: a }) }, nowIso: () => new Date().toISOString(), log: () => {}, VER: '0.t', kickFlag: false, lastConfirm: [], lastConfirmAt: new Date().toISOString(), confirmDocAt: 0, enrichMem: new Map(),
    shipCoreNode: () => SH, mlMod: async () => ML, pushSend: async (n, p, k) => { pushes.push({ k, p }); return { ok: 1 }; }, Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number };
  vm.runInNewContext(wonDef + '\n' + clSrc.slice(ca, cb) + '\nthis.shipAutoTick = shipAutoTick; this.autoMktRetryTick = autoMktRetryTick; this.autoRejudge = autoRejudge; this.mem = autoMem; this.reset = () => { amrAt = 0; autoCfgC = null; };', ctx); return { ctx, pushes }; }
const colSrc = fs.readFileSync(path.join(__dirname, '../readnow-collector.user.js'), 'utf8');
const pa = colSrc.indexOf('  const AU = { mem: new Map()'); const pb = colSrc.indexOf('  window.__rnAutoShipPc = (orders) => autoShipPc(orders);');
function pcCtx(F, name) { const ran = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: name }), TS: () => 'TS', nowIso: () => new Date().toISOString(), log: () => {}, PC_NAME: name, APP_VER: '1.89.t', PUBONLY: false, auth: { currentUser: { email: 'x' } }, pcLoggedNow: () => true, runCmd: async (id) => { ran.push(id); }, setTimeout: (f) => f(), Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number, isFinite,
    window: { ReadnowShipping: SH, ReadnowML: ML, __rnFeat: () => true }, globalThis: {} };
  vm.runInNewContext(colSrc.slice(pa, pb) + '\nthis.autoShipPc = autoShipPc; this.AU = AU;', ctx); return { ctx, ran }; }
const ordAt = (min) => { const d = new Date(Date.now() + 9 * 3600e3 - min * 60e3); return d.toISOString().slice(0, 16).replace('T', ' '); };
const E = (rows) => ({ mkt: { at: new Date().toISOString(), rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours' });
const HOLD = { on: true, at: new Date().toISOString(), by: 'a@b', why: '시험' };
const mkO = (ono, lid) => ({ orderNo: ono, buyer: '손님A', orderedAt: ordAt(15), items: [{ listingId: lid, title: '책' + lid, price: 9000, qty: 1, grade: '상' }] });

(async () => {
  console.log('ⓑ 클라우드 자동 판단(shipAutoTick) — 보류하면 안 건드림 · 풀면 돌아감');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 864e5).toISOString(), holds: { 'H-1': { at: HOLD.at } } };
    F.col('shp_auto')['H-1'] = { orderNo: 'H-1', hold: HOLD, at: HOLD.at }; /* 웹앱이 판단 전에 보류 — 상태 없는 기록 */
    F.col('shp_auto')['H-2'] = { orderNo: 'H-2', hold: HOLD, at: HOLD.at }; /* 기록엔 보류, 빠른 목록(holds)엔 아직 없음 — 그사이 겹친 경우 */
    const o1 = mkO('H-1', 'A'), o2 = mkO('H-2', 'B'), o3 = mkO('N-1', 'C'); const en = { A: E([row('green', '상', 10000)]), B: E([row('green', '상', 10000)]), C: E([row('green', '상', 10000)]) };
    const cl = cloudCtx(F); cl.ctx.lastConfirm = [o1, o2, o3]; await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    const A = F.col('shp_auto'), K = F.col('shp_cmds');
    ok(!A['H-1'].state && !K['auto_H-1'], '보류 목록에 있는 주문 → 판단도 발송준비시작도 안 함');
    ok(!A['H-2'].state && !K['auto_H-2'] && !(cl.ctx.mem.get('H-2') || {}).final, '목록엔 없어도 기록에 보류가 있으면 트랜잭션에서 막음 · 기억에 끝으로 두지 않음');
    ok(A['N-1'].state === 'sent' && K['auto_N-1'], '보류 안 한 주문은 그대로 자동 통과');
    // 풀기
    F.col('app_settings').ship_auto.holds = {}; A['H-1'].hold = { on: false, at: new Date().toISOString() }; A['H-2'].hold = { on: false, at: new Date().toISOString() }; cl.ctx.reset();
    await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    ok(A['H-1'].state === 'sent' && K['auto_H-1'] && A['H-2'].state === 'sent' && K['auto_H-2'], '풀면 다음 회차에 자동 판단 대상으로 돌아감 → 통과 → 발송준비시작 맡김'); }

  console.log('ⓐ·ⓑ 🔄 시장 다시 읽기 뒤 다시 판단(autoRejudge) — 검토 주문만 · 보류는 그대로');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true }; const t = new Date().toISOString(); const A = F.col('shp_auto');
    A.R = { orderNo: 'R', state: 'review', reasons: ['검토'], decidedAt: t }; A.K = { orderNo: 'K', state: 'skip', reasons: ['자동 발송요청을 켜기 전에 들어온 주문 — 사람이 처리'], decidedAt: t };
    A.W = { orderNo: 'W', state: 'wait', firstAt: t, at: t }; A.H = { orderNo: 'H', state: 'review', reasons: ['검토'], decidedAt: t, hold: HOLD }; A.S = { orderNo: 'S', state: 'sent', decidedAt: t };
    const cl = cloudCtx(F); const res = await cl.ctx.autoRejudge({ orderNos: ['R', 'K', 'W', 'H', 'S', 'NONE'], by: 'a@b' }, 'cmd1');
    ok(A.R.state === 'wait' && A.R.rejudge && A.R.rejudge.prev.state === 'review' && (A.R.rjHist || []).length === 1, '🔎 검토 주문 → 대기로 되돌려 다시 판단(전 판단은 rjHist)');
    ok(A.K.state === 'skip' && !A.K.rejudge, '켜기 전에 들어와 사람 몫으로 남은 주문(skip)은 다시 판단 안 함');
    ok(A.W.state === 'wait' && !A.W.rejudge && !A.NONE, '대기 주문·판단 기록 없는 주문은 그대로(어차피 새 시장으로 판단됨)');
    ok(A.H.state === 'review' && !A.H.rejudge, '⏸ 보류한 검토 주문은 다시 판단 안 함');
    ok(res.rj === 1 && res.keep === 4 && res.hold === 1 && F.col('app_settings').ship_auto.rejudgeOrders.join() === 'R', `결과 rj 1 · keep 4 · hold 1 · PC가 다시 볼 주문은 R만: ${JSON.stringify(res)}`); }

  console.log('ⓑ 시장 자료 없음 저절로 다시 판단(autoMktRetryTick) — 보류하면 안 건드림 · 풀면 이어서');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true }; const R0 = { on: true, n: 0, lids: ['A'], at: new Date().toISOString(), next: new Date(Date.now() - 1000).toISOString() };
    F.col('shp_auto').M1 = { orderNo: 'M1', state: 'review', kinds: ['nomkt'], items: [{ lid: 'A', mkt: 'none' }], decidedAt: new Date().toISOString(), mktRetry: { ...R0 }, hold: HOLD };
    F.col('shp_auto').M2 = { orderNo: 'M2', state: 'review', kinds: ['nomkt'], items: [{ lid: 'B', mkt: 'none' }], decidedAt: new Date().toISOString(), mktRetry: { ...R0, lids: ['B'] }, hold: HOLD };
    F.col('shp_enrich').B = E([row('green', '상', 10000)]); /* M2는 시장 자료가 들어옴 */
    const cl = cloudCtx(F); cl.ctx.lastConfirm = [{ orderNo: 'M1', items: [] }, { orderNo: 'M2', items: [] }]; let r = await cl.ctx.autoMktRetryTick();
    const A = F.col('shp_auto'); const mk = () => Object.keys(F.col('shp_cmds')).filter((k) => /^mkr_/.test(k));
    ok(!mk().length && A.M1.mktRetry.n === 0 && A.M1.mktRetry.on === true, '보류 중 → 시장 다시 읽기 안 맡김 · 계획도 그대로(멈추지 않음)');
    ok(A.M2.state === 'review' && !A.M2.rejudge, '보류 중 → 시장 자료가 들어와도 다시 판단 안 함');
    A.M1.hold = { on: false, at: new Date().toISOString() }; A.M2.hold = { on: false, at: new Date().toISOString() }; cl.ctx.reset(); r = await cl.ctx.autoMktRetryTick();
    ok(mk().join() === 'mkr_M1_1' && A.M2.state === 'wait' && A.M2.rejudge && A.M2.rejudge.auto === 'mkt', '풀면 이어서: M1 시장 다시 읽기 맡김 · M2 다시 판단(대기로)'); }

  console.log('ⓑ PC 수집기 자동 판단(autoShipPc) — 보류하면 안 건드림 · 풀면 돌아감');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 864e5).toISOString(), holds: { 'P-1': { at: HOLD.at } } };
    F.col('shp_auto')['P-1'] = { orderNo: 'P-1', hold: HOLD, at: HOLD.at }; F.col('shp_auto')['P-2'] = { orderNo: 'P-2', hold: HOLD, at: HOLD.at };
    F.col('shp_enrich').A = E([row('green', '상', 10000)]); F.col('shp_enrich').B = E([row('green', '상', 10000)]);
    const o1 = mkO('P-1', 'A'), o2 = mkO('P-2', 'B'); const pc = pcCtx(F, 'JS-MAIN'); await pc.ctx.autoShipPc([o1, o2]); const A = F.col('shp_auto');
    ok(!A['P-1'].state && !A['P-2'].state && !pc.ran.length && !F.col('shp_cmds')['auto_P-1'] && !F.col('shp_cmds')['auto_P-2'], 'PC: 보류 목록·기록 보류 모두 판단·발송준비시작 안 함');
    ok(!(pc.ctx.AU.mem.get('P-2') || {}).final, 'PC: 기록 보류로 막힌 주문은 기억에 끝으로 두지 않음');
    F.col('app_settings').ship_auto.holds = {}; A['P-1'].hold = { on: false }; A['P-2'].hold = { on: false }; pc.ctx.AU.cfgAt = 0; await pc.ctx.autoShipPc([o1, o2]);
    ok(A['P-1'].state === 'sent' && A['P-2'].state === 'sent' && pc.ran.includes('auto_P-1') && pc.ran.includes('auto_P-2'), 'PC: 풀면 다시 판단 → 통과 → 그 PC가 바로 발송준비시작'); }

  console.log('웹앱 ⏸ 보류 단추 · 표시 · 기록 (Playwright)');
  await new Promise((res) => require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const pe = []; p.on('pageerror', (e) => pe.push(e.message));
    const r = await p.evaluate(async () => { const o = {}; const w = (ms) => new Promise((rr) => setTimeout(rr, ms)); const now = new Date().toISOString(); await w(2500);
      await db.collection('app_settings').doc('ship_auto').set({ on: true, beatAt: now, beatBy: 'JS-MAIN' }, { merge: true });
      await db.collection('shp_auto').doc('B-1').set({ orderNo: 'B-1', state: 'review', reasons: ['검토'], at: now, decidedAt: now, total: 9000 });
      await db.collection('shp_cmds').doc('auto_B-2').set({ type: 'startDelivery', orderNos: ['B-2'], status: 'queued', auto: true, createdAt: now });
      const CF = { at: now, orders: [{ orderNo: 'B-1', orderedAt: '2026-11-04 09:00', buyer: '손님A', items: [{ listingId: 'L1', title: '책1', price: 9000, qty: 1 }] }, { orderNo: 'B-2', orderedAt: '2026-11-04 09:10', buyer: '손님B', items: [{ listingId: 'L2', title: '책2', price: 7000, qty: 1 }] }], enrich: {} }; await db.collection('shp_state').doc('confirm').set(CF); S.shipC = CF; /* 가짜 Firestore는 쓸 때마다 모든 듣기를 다시 부름 — 주문확인요청 문서에 넣어 둠 */ await w(300);
      S.ship = { orders: [], tabCounts: {}, at: now }; S._shipLive = 1; S.shipTab = 'confirm'; await openShip(); await w(800); const sh = () => document.getElementById('sheet');
      const b1 = sh().querySelector('[data-shold="B-1"]'); o.btn0 = b1 ? b1.textContent : ''; o.sds0 = !!sh().querySelector('[data-sds="B-1"]');
      window.prompt = () => '손님 문의 기다림'; b1.click(); await w(900);
      o.doc1 = (await db.collection('shp_auto').doc('B-1').get()).data(); o.cfg1 = (await db.collection('app_settings').doc('ship_auto').get()).data();
      o.card = (sh().querySelector('[data-anc="o:B-1"]') || {}).outerHTML || ''; o.tab = (sh().querySelector('[data-stab="confirm"]') || {}).innerText || ''; o.btn1 = (sh().querySelector('[data-shold="B-1"]') || {}).textContent || ''; o.sds1 = !!sh().querySelector('[data-sds="B-1"]');
      try { o.home = shipEntryCard(); } catch (e) { o.home = 'ERR ' + e.message; }
      o.cx = alShipCX().x.why;
      // B-2: 자동으로 맡겨 둔 대기 발송준비시작이 있으면 보류할 때 같이 취소
      S.shipStart = [{ id: 'auto_B-2', type: 'startDelivery', orderNos: ['B-2'], status: 'queued', auto: true }]; window.prompt = () => ''; sh().querySelector('[data-shold="B-2"]').click(); await w(900);
      o.cmd2 = (await db.collection('shp_cmds').doc('auto_B-2').get()).data(); o.doc2 = (await db.collection('shp_auto').doc('B-2').get()).data();
      // 풀기
      sh().querySelector('[data-shold="B-1"]').click(); await w(900);
      o.doc3 = (await db.collection('shp_auto').doc('B-1').get()).data(); o.cfg3 = (await db.collection('app_settings').doc('ship_auto').get()).data(); o.card3 = (sh().querySelector('[data-anc="o:B-1"]') || {}).outerHTML || ''; o.btn3 = (sh().querySelector('[data-shold="B-1"]') || {}).textContent || '';
      // 까닭 묻기에서 취소하면 보류 안 함
      window.prompt = () => null; sh().querySelector('[data-shold="B-1"]').click(); await w(500); o.cfg4 = (await db.collection('app_settings').doc('ship_auto').get()).data();
      o.feat = (typeof FEAT !== 'undefined' ? FEAT : []).some((f) => /보류/.test(f.t)); o.pg = JSON.stringify(pgdDefs().ship || {}).includes('data-shold');
      o.mkTip = (sh().querySelector('#shp_mkre') || {}).title || ''; return o; });
    console.log(JSON.stringify({ ...r, card: r.card.slice(0, 300), card3: r.card3.slice(0, 200) }).slice(0, 1800));
    ok(/⏸ 보류/.test(r.btn0) && r.sds0, '① 카드 머리 띠에 ⏸ 보류 단추(발송준비시작 단추와 함께)');
    ok(r.doc1 && r.doc1.hold && r.doc1.hold.on === true && r.doc1.hold.why === '손님 문의 기다림' && r.doc1.hold.by && (r.doc1.holdHist || []).length === 1 && r.doc1.state === 'review', '누르면 판단 기록(shp_auto)에 보류 · 누가·까닭 · 기록(holdHist) · 판단 상태는 그대로');
    ok(r.cfg1 && r.cfg1.holds && r.cfg1.holds['B-1'] && r.cfg1.holds['B-1'].why === '손님 문의 기다림', '모든 기기가 듣는 ship_auto.holds에 보류 목록');
    ok(/shp-held/.test(r.card) && /⏸ 보류 중/.test(r.card) && /손님 문의 기다림/.test(r.card) && /▶ 보류 풀기/.test(r.btn1) && r.sds1, '보류 카드: 점선 테두리 · ⏸ 보류 중 줄(까닭) · ▶ 보류 풀기 · 발송준비시작 단추는 그대로');
    ok(/⏸ 보류 1/.test(r.tab), '① 탭 숫자에 ⏸ 보류 1: ' + r.tab);
    ok(/⏸ 보류 1/.test(r.home) && /⏸ 보류 1건/.test(r.cx), '홈 출고 카드·오늘 할 일에 보류 수: ' + (r.home || '').replace(/<[^>]+>/g, '').slice(0, 120) + ' / ' + r.cx);
    ok(r.cmd2 && r.cmd2.status === 'cancelled' && /보류/.test(r.cmd2.cancelWhy) && r.doc2 && r.doc2.hold.on && r.doc2.hold.why === null && r.doc2.at, '자동으로 맡겨 둔 대기 발송준비시작은 보류할 때 같이 취소 · 까닭 비워도 됨 · 판단 전 기록에도 at(웹앱이 들음)');
    ok(r.doc3.hold.on === false && (r.doc3.holdHist || []).length === 2 && r.doc3.holdHist[0].on === true && r.doc3.hold.from && r.doc3.hold.from.why === '손님 문의 기다림' && !(r.cfg3.holds || {})['B-1'] && (r.cfg3.holds || {})['B-2'], '▶ 풀기: 지금 상태 on:false · 기록 2줄(지우지 않음) · 빠른 목록에서 그 주문만 빠짐');
    ok(!/shp-held/.test(r.card3) && /⏸ 보류/.test(r.btn3), '풀면 카드 표시도 돌아옴');
    ok(!(r.cfg4.holds || {})['B-1'], '까닭 묻기에서 취소하면 보류 안 함');
    ok(r.feat && r.pg, '🔍 기능 찾기 · 화면 설명서(PAGE_GUIDES 출고)에 있음');
    ok(/검토 주문만/.test(r.mkTip) && /켜기 전 주문/.test(r.mkTip), '🔄 시장 다시 읽기 설명: 검토 주문만 다시 판단');
    ok(!pe.length, '화면 오류 없음 ' + pe.join(' | ')); res(); }));
  console.log(bad ? `❌ tHOLD 실패 ${bad}` : '✓ tHOLD 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tHOLD 오류', e); process.exit(1); });
