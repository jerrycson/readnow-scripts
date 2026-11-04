// tFIXB — 정범님 11/04 밤 두 가지
//  ① "자동 발송요청을 켜고 시장 다시 읽기를 했는데 작동을 안 해 · 모든 걸 일괄로 다시 바로 발송요청을 검토하는 기능이 없는거야?"
//     ⓐ 켜기 전 주문 3건(판단 기록 없음·켜기 전·검토)이 '🔄 지금 있는 주문 모두 다시 판단'으로 판단됨(클라우드·PC 모두 켠 시각 검사를 건너뜀)
//     ⓑ 자동 발송요청을 켤 때 "지금 있는 n건도 판단할까요?" ⓒ 시장 다시 읽기 진행이 맡김 문서에 남고, PC 목록이 끊겨도 4분 뒤 마무리(다시 판단으로 돌려 둠) · 웹앱 줄이 '취소'와 까닭을 보임
//  ② "예스24: 송장은 뽑혔는데 거기 그대로" — ALPS 끝 → 발송처리 맡김 저절로 · 대기 15분 넘은 맡김 다시 · 원스톱 Y24 단계가 끝없이 기다리지 않음 · 점검에 연결 창 · 남은 주문은 ⚠ '발송처리 맡기기'
//  노드(가짜 Firestore — tHOLD와 같은 모양) + Playwright(웹앱)
//  시험 자료 손님은 '손님A' (공개 저장소)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 });
function mkStore() { const store = {}; const col = (c) => (store[c] = store[c] || {}); let txQ = Promise.resolve();
  const AU = (v) => (v && v.__au ? v : null); const mergeSet = (old, v) => { const o = { ...(old || {}) }; for (const [k, x] of Object.entries(v)) o[k] = AU(x) ? [...(o[k] || []), ...x.__au] : x; return o; };
  const ref = (c, id) => ({ id, _c: c, path: c + '/' + id, get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { col(c)[id] = o && o.merge ? mergeSet(col(c)[id], v) : mergeSet(null, v); }, create: async (v) => { if (col(c)[id]) throw new Error('ALREADY_EXISTS'); col(c)[id] = v; }, update: async (v) => { col(c)[id] = { ...(col(c)[id] || {}), ...v }; } });
  const dig = (d, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), d);
  const match = (d, [k, o, x]) => { const y = dig(d, k); return o === '==' ? y === x : o === '>=' ? String(y || '') >= x : o === 'in' ? x.includes(y) : o === 'array-contains' ? Array.isArray(y) && y.includes(x) : true; };
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + Math.random().toString(36).slice(2, 8)), add: async (v) => { const id = 'a' + Math.random().toString(36).slice(2, 8); col(c)[id] = v; return ref(c, id); }, where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, orderBy: () => q, limit: () => q, get: async () => { const docs = Object.entries(col(c)).filter(([, d]) => q._f.every((f) => match(d, f))).map(([id, d]) => ({ id, ref: ref(c, id), data: () => d })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } }; return q; } });
  const db = { runTransaction: (fn) => { const run = txQ.then(async () => { const w = []; const tx = { get: async (r) => r.get(), set: (r, v, o) => w.push(() => r.set(v, o)), update: (r, v) => w.push(() => r.update(v)) }; const out = await fn(tx); for (const f of w) await f(); return out; }); txQ = run.catch(() => {}); return run; } };
  return { store, col, C, db }; }
const clSrc = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const ca = clSrc.indexOf('const mktForce = new Map(), mktJobs'); const cb = clSrc.indexOf('async function shipNotifyTick'); const wonDef = clSrc.match(/const wonT = [^\n]*/)[0];
function cloudCtx(F) { const steps = []; const stepOf = (ref) => { const f = (lv, m) => steps.push(lv + ':' + m); f.flush = async () => {}; return f; };
  const ctx = { C: F.C, db: F.db, W: () => ({ writer: 'cloud' }), FV: { serverTimestamp: () => 'TS', arrayUnion: (...a) => ({ __au: a }) }, nowIso: () => new Date().toISOString(), log: () => {}, VER: '0.t', kickFlag: false, lastConfirm: [], lastConfirmAt: new Date().toISOString(), confirmDocAt: 0, enrichMem: new Map(), stepOf,
    shipCoreNode: () => SH, mlMod: async () => ML, pushSend: async () => ({ ok: 1 }), Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number };
  vm.runInNewContext(wonDef + '\n' + clSrc.slice(ca, cb) + '\nthis.shipAutoTick = shipAutoTick; this.autoRejudge = autoRejudge; this.mktJobsTick = mktJobsTick; this.mktJobs = mktJobs; this.mktForce = mktForce; this.mem = autoMem; this.reset = () => { amrAt = 0; autoCfgC = null; mktLoadAt = 0; };', ctx); return { ctx, steps }; }
const colSrc = fs.readFileSync(path.join(__dirname, '../readnow-collector.user.js'), 'utf8');
const pa = colSrc.indexOf('  const AU = { mem: new Map()'); const pb = colSrc.indexOf('  window.__rnAutoShipPc = (orders) => autoShipPc(orders);');
function pcCtx(F, name) { const ran = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: name }), TS: () => 'TS', nowIso: () => new Date().toISOString(), log: () => {}, PC_NAME: name, APP_VER: '1.89.t', PUBONLY: false, auth: { currentUser: { email: 'x' } }, pcLoggedNow: () => true, runCmd: async (id) => { ran.push(id); }, setTimeout: (f) => f(), Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number, isFinite,
    window: { ReadnowShipping: SH, ReadnowML: ML, __rnFeat: () => true }, globalThis: {} };
  vm.runInNewContext(colSrc.slice(pa, pb) + '\nthis.autoShipPc = autoShipPc; this.AU = AU;', ctx); return { ctx, ran }; }
const ordAt = (min) => { const d = new Date(Date.now() + 9 * 3600e3 - min * 60e3); return d.toISOString().slice(0, 16).replace('T', ' '); };
const E = (rows) => ({ mkt: { at: new Date().toISOString(), rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours' });
const mkO = (ono, lid) => ({ orderNo: ono, buyer: '손님A', orderedAt: ordAt(120), items: [{ listingId: lid, title: '책' + lid, price: 9000, qty: 1, grade: '상' }] }); /* 2시간 전 주문 — 켠 시각(지금)보다 앞섬 */
/* 웹앱 '🔄 지금 있는 주문 모두 다시 판단'이 쓰는 것과 같은 모양(shipRejAll) */
const webRej = (F, L) => { const at = new Date().toISOString(); for (const ono of L) { const v = F.col('shp_auto')[ono]; const prev = v && v.state ? { state: v.state, reasons: v.reasons || [], at } : null; F.col('shp_auto')[ono] = { ...(v || {}), orderNo: ono, state: 'wait', firstAt: at, at, pushWant: false, rejudge: { at, by: 'a@b', all: true, how: 'webapp', prev } }; } Object.assign(F.col('app_settings').ship_auto, { rejudgeAt: at, rejudgeOrders: L, rejudgeAll: true }); };

(async () => {
  console.log('①ⓐ 클라우드 — 켜기 전 주문 3건 → 일괄 다시 판단 → 판단됨');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date().toISOString() }; const t = new Date().toISOString(); const A = F.col('shp_auto');
    A.K = { orderNo: 'K', state: 'skip', reasons: ['자동 발송요청을 켜기 전에 들어온 주문 — 사람이 처리'], decidedAt: t, at: t }; A.R = { orderNo: 'R', state: 'review', reasons: ['검토'], decidedAt: t, at: t };
    const L = [mkO('K', 'a'), mkO('R', 'b'), mkO('N', 'c')]; const en = { a: E([row('green', '상', 10000)]), b: E([row('green', '상', 10000)]), c: E([row('green', '상', 10000)]) };
    const cl = cloudCtx(F); cl.ctx.lastConfirm = L; await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    ok(A.N && A.N.state === 'skip' && A.K.state === 'skip' && A.R.state === 'review' && !F.col('shp_cmds').auto_N, '먼저: 판단 기록 없던 N은 켜기 전 주문(skip) · K skip · R 검토 그대로 (지금 문제와 같은 상태)');
    // 🔄 시장 다시 읽기 '켜기 전 주문도 함께'(J.all) — autoRejudge
    const res = await cl.ctx.autoRejudge({ orderNos: ['K', 'R', 'N', 'NONE'], by: 'a@b', all: true }, 'cmdA');
    ok(res.rj === 4 && res.all && A.K.rejudge && A.K.rejudge.all && A.K.rejudge.prev.state === 'skip' && A.NONE && A.NONE.state === 'wait', `autoRejudge '모두': 켜기 전·검토·기록 없음 모두 대기 + 켠 시각 건너뛰기 표시: ${JSON.stringify(res)}`);
    cl.ctx.reset(); await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    ok(['K', 'R', 'N'].every((x) => A[x].state === 'sent' && F.col('shp_cmds')['auto_' + x]), `다시 판단 → 3건 모두 자동 통과 → 발송준비시작 맡김: ${['K', 'R', 'N'].map((x) => A[x].state).join(',')}`); }
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date().toISOString() }; const A = F.col('shp_auto');
    const L = [mkO('K', 'a'), mkO('R', 'b'), mkO('N', 'c')]; const en = { a: E([row('green', '상', 10000)]), b: E([row('green', '상', 10000)]), c: E([row('green', '상', 10000)]) };
    const cl = cloudCtx(F); cl.ctx.lastConfirm = L; await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    ok(['K', 'R', 'N'].every((x) => A[x].state === 'skip') && cl.ctx.mem.get('K').final, '먼저 3건 모두 켜기 전 주문(skip) · 클라우드 기억에 끝으로');
    webRej(F, ['K', 'R', 'N']); cl.ctx.reset(); await cl.ctx.shipAutoTick({ enrich: en }, { cmds: true, confirm: true });
    ok(['K', 'R', 'N'].every((x) => A[x].state === 'sent'), `웹앱 일괄 다시 판단(rejudgeAt) → 클라우드가 기억을 지우고 다시 판단 → 3건 통과: ${['K', 'R', 'N'].map((x) => A[x].state).join(',')}`); }
  console.log('①ⓐ PC 수집기 — 같은 일괄 다시 판단을 따름');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date().toISOString() }; const A = F.col('shp_auto');
    F.col('shp_enrich').a = E([row('green', '상', 10000)]); F.col('shp_enrich').c = E([row('green', '상', 10000)]); const L = [mkO('K', 'a'), mkO('N', 'c')];
    const pc = pcCtx(F, 'HOME'); const call = () => pc.ctx.autoShipPc(L).catch((e) => ({ err: e.message }));
    await call(); const s0 = ['K', 'N'].map((x) => (A[x] || {}).state).join(',');
    webRej(F, ['K', 'N']); pc.ctx.AU.cfgAt = 0; await call(); const s1 = ['K', 'N'].map((x) => (A[x] || {}).state).join(',');
    ok(s0 === 'skip,skip' && !/skip/.test(s1), `PC: 먼저 skip → 일괄 다시 판단 뒤 켠 시각 검사를 건너뜀: ${s0} → ${s1}`); }

  console.log('①ⓒ 시장 다시 읽기 진행이 맡김 문서에 · PC 목록이 끊겨도 마무리');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date().toISOString() }; const K = F.col('shp_cmds'); const A = F.col('shp_auto');
    K.m1 = { type: 'market', rerd: true, status: 'running', runBy: 'cloud', listingIds: ['a', 'b', 'c', 'd'], orderNos: ['X1', 'X2', 'X3'], rejudge: true, rejAll: true, startAt: new Date(Date.now() - 60e3).toISOString(), doneL: ['a'], failL: [] };
    const cl = cloudCtx(F); cl.ctx.lastConfirm = [];
    await cl.ctx.mktJobsTick({ noList: true });
    ok(cl.ctx.mktJobs.has('m1') && K.m1.status === 'running' && K.m1.beatAt && K.m1.claim && K.m1.claim.pc === 'cloud' && (K.m1.doneL || []).join() === 'a' && K.m1.prog.gone === 0 && K.m1.noListNow === true, `클라우드 메모리가 비어도 맡김 문서에서 되살림 · 맥박·맡은 곳·읽은 것 문서에 · 목록 없으면 '빠짐'으로 안 봄: ${JSON.stringify({ st: K.m1.status, prog: K.m1.prog, claim: K.m1.claim })}`);
    cl.ctx.mktJobs.get('m1').at = Date.now() - 5 * 60e3; await cl.ctx.mktJobsTick({ noList: true });
    ok(K.m1.status === 'done' && K.m1.noList && K.m1.timeout && K.m1.res && K.m1.res.rj === 3 && ['X1', 'X2', 'X3'].every((x) => A[x] && A[x].state === 'wait' && A[x].rejudge.all), `PC 목록이 끊겨도 4분 뒤 마무리 · '목록 없음' 표시 · 켜기 전 주문 3건을 다시 판단으로 돌려 둠: ${JSON.stringify(K.m1.res)}`);
    const src = clSrc.slice(clSrc.indexOf('const delivDue') - 1600, clSrc.indexOf('const delivDue')); ok(/mktJobsTick\(\{ noList: true \}\)[\s\S]*throw new Error/.test(src), '회차가 PC 목록 없음으로 멈추는 줄(throw) 앞에서 시장 다시 읽기 마무리를 부름'); }

  require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const FS = window.__FS; S.user = S.user || { email: 'tester@x' }; const msgs = []; window.confirm = (m) => { msgs.push(m); return true; }; await W(2000);
      const now = new Date().toISOString(); const t0 = new Date(Date.now() - 3 * 3600e3).toISOString();
      const ord = (no) => ({ orderNo: no, orderedAt: '2026-11-04 15:00', buyer: '손님A', items: [{ listingId: 'L' + no.slice(-2), title: '책', price: 5000, qty: 1 }] });
      S.shipC = { at: now, orders: ['001-0000-1111', '001-0000-2222', '001-0000-3333', '001-0000-4444', '001-0000-5555'].map(ord), enrich: {} }; await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await W(400); S.shipC = { at: now, orders: ['001-0000-1111', '001-0000-2222', '001-0000-3333', '001-0000-4444', '001-0000-5555'].map(ord), enrich: {} }; const C0 = S.shipC; S.ship = { orders: [], tabCounts: {}, at: now }; S._shipLive = 1; S.shipTab = 'confirm';
      await db.collection('shp_auto').doc('001-0000-2222').set({ orderNo: '001-0000-2222', state: 'skip', reasons: ['자동 발송요청을 켜기 전에 들어온 주문 — 사람이 처리'], at: now, decidedAt: now });
      await db.collection('shp_auto').doc('001-0000-3333').set({ orderNo: '001-0000-3333', state: 'review', reasons: ['검토'], at: now, decidedAt: now });
      await db.collection('shp_auto').doc('001-0000-4444').set({ orderNo: '001-0000-4444', state: 'sent', at: now, decidedAt: now });
      await db.collection('shp_auto').doc('001-0000-5555').set({ orderNo: '001-0000-5555', at: now, hold: { on: true, at: now, by: 'a@b' } });
      await db.collection('app_settings').doc('ship_auto').set({ on: false, holds: { '001-0000-5555': { at: now } } }, { merge: true }); S.shipAutoCfg = { on: false, holds: { '001-0000-5555': { at: now } } }; shipAutoWatch(); await W(600);
      // ⓑ 켤 때 물음
      S.shipC = C0; await openShip(); await W(700); let sh = document.getElementById('sheet'); o.btnOff = !!sh.querySelector('#shp_rjall');
      const cb = sh.querySelector('#sau_set [data-sau="on"]'); cb.checked = true; cb.onchange(); await W(1500);
      o.askOn = msgs.find((m) => /도 지금 🤖 자동 판단할까요/.test(m)) || ''; const D = (no) => ((FS.shp_auto || {})[no] || {});
      o.after = ['001-0000-1111', '001-0000-2222', '001-0000-3333', '001-0000-4444', '001-0000-5555'].map((n) => (D(n).state || '-') + (D(n).rejudge && D(n).rejudge.all ? '*' : '')).join(','); const SA = (FS.app_settings || {}).ship_auto || {}; o.rjO = (SA.rejudgeOrders || []).join(); o.since = !!SA.since; o.how = (D('001-0000-1111').rejudge || {}).how;
      // ⓐ 단추 — 다시 skip이 된 것으로 놓고
      await db.collection('shp_auto').doc('001-0000-1111').set({ state: 'skip', rejudge: null }, { merge: true }); await db.collection('shp_auto').doc('001-0000-3333').set({ state: 'review' }, { merge: true }); await W(500);
      S.shipC = C0; await openShip(); await W(700); sh = document.getElementById('sheet'); const b = sh.querySelector('#shp_rjall'); if (!b) return o; o.btn = b ? b.parentElement.innerText : ''; msgs.length = 0; b.click(); await W(1500);
      o.askBtn = msgs[0] || ''; o.after2 = ['001-0000-1111', '001-0000-3333', '001-0000-4444', '001-0000-5555'].map((n) => (D(n).state || '-') + (D(n).rejudge && D(n).rejudge.all ? '*' : '')).join(','); o.rjHist = (D('001-0000-3333').rjHist || []).length;
      o.feat = (typeof FEAT !== 'undefined' ? FEAT : []).some((f) => /지금 있는 주문 모두 다시 판단/.test(f.t));
      // ⓒ 웹앱 줄: 취소 까닭
      S._mkRe = { id: 'mx', at: Date.now() - 3600e3, lids: ['a', 'b', 'c', 'd'], v: { status: 'cancelled', cancelWhy: '63분 동안 아무도 안 맡아 취소 (기준 15분 × 4)', doneAt: now, prog: { n: 4, done: 0 } } }; o.cxl = shipMkReLine().replace(/<[^>]+>/g, ''); o.cxlBusy = shipMkReBusy();
      S._mkRe = { id: 'my', at: Date.now(), lids: ['a'], v: { status: 'running', rejudge: true, runBy: 'cloud', claim: { pc: 'cloud' }, beatAt: now, noListNow: true, prog: { n: 4, done: 1 } } }; o.run = shipMkReLine().replace(/<[^>]+>/g, '');
      S._mkRe = { id: 'mz', at: Date.now(), lids: ['a'], v: { status: 'done', rejudge: true, noList: true, doneAt: now, prog: { n: 4, done: 0 }, res: { rj: 3, keep: 0, all: true } } }; o.done = shipMkReLine().replace(/<[^>]+>/g, '');
      S._mkRe = null;

      // ② 예스24
      S.prodLoaded = true; S.app = S.app || {}; S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), autoOk: {} } }; /* 자동 처리 꺼짐 · 바르게 끝난 발송처리 0건 */
      S.y24.un = () => {}; S.y24.loaded = true; S.y24.lk = { m: {}, x: {} }; S.y24.lkUn = () => {}; S.y24o.un = S.y24o.un || (() => {}); S.y24o.loaded = true;
      const yo = (no, extra) => ({ orderNo: no, ystage: 'deliv', buyer: '손님A', recipient: { name: '손님A' }, items: [{ k: '1', title: '예스24 책 ' + no, goodsNo: 9 }], orderedAt: '2026-11-04 14:00', lastSeenAt: now, ...(extra || {}) });
      S.y24o.m.set('Y1', yo('Y1')); S.y24o.st = { ...(S.y24o.st || {}), rawAt: new Date(Date.now() - 2 * 60e3).toISOString() };
      const yr = [{ key: 'y24:Y1', invoice: '240000000099', status: 'ok', invoices: ['240000000099'] }]; await y24oInvSave(yr, 'runX'); await W(500);
      const YD = (no) => ((FS.crm_y24_orders || {})[no] || {}); o.y1 = { inv: (YD('Y1').yInv || {}).no, sa: !!YD('Y1').shipAuto, st: ((YD('Y1').auto || {}).ship || {}).state, cf: ((YD('Y1').auto || {}).ship || {}).confirm, no: ((YD('Y1').auto || {}).ship || {}).no };
      // 대기 15분 넘은 맡김 → 다시
      const old = new Date(Date.now() - 20 * 60e3).toISOString(); S.y24o.m.set('Y2', yo('Y2', { yInv: { no: '240000000088', courier: '롯데택배', via: 'alps' }, shipAuto: { at: old }, auto: { ship: { state: 'queued', seq: 1, at: old, confirm: true, no: '240000000088', courier: '롯데택배' } } }));
      await db.collection('crm_y24_orders').doc('Y2').set(JSON.parse(JSON.stringify(S.y24o.m.get('Y2'))));
      S.y24o.m.set('Y4', yo('Y4', { yInv: { no: '240000000066', courier: '롯데택배', via: 'alps' }, shipAuto: { at: now }, auto: { ship: { state: 'queued', seq: 1, at: now, confirm: true } } })); await db.collection('crm_y24_orders').doc('Y4').set(JSON.parse(JSON.stringify(S.y24o.m.get('Y4'))));
      S.y24o.swAt = 0; await y24oShipSweep(); await W(400); const a2 = (YD('Y2').auto || {}).ship || {}; o.y2 = { seq: a2.seq, reQ: a2.reQ, st: a2.state }; o.y4 = ((YD('Y4').auto || {}).ship || {}).seq;
      // 지금 남은 주문(이 판 전에 송장만 기록됨) → ⚠ '발송처리 맡기기'
      S.y24o.m.set('Y3', yo('Y3', { yInv: { no: '240000000077', courier: '롯데택배', via: 'alps' } })); S.y24o.swAt = 0; await y24oShipSweep(); o.y3auto = !!((S.y24o.m.get('Y3').auto || {}).ship);
      const X = shipExcRows().filter((x) => x.row && x.row.id === 'Y3'); o.exc = X.map((x) => x.row.exc.k + ':' + x.why).join(' | ');
      S.shipTab = 'exc'; S.shipSrc = 'all'; openShip(); await W(700); const bt = document.querySelector('#sheet [data-y24oauto="Y3"]'); o.excBtn = bt ? bt.textContent : ''; if (bt) { bt.click(); await W(800); } o.y3 = ((YD('Y3').auto || {}).ship || {}).state;
      // 원스톱: 점검에 연결 창 · Y24 단계가 끝없이 기다리지 않음
      const setRaw = async (ms) => { await db.collection('app_settings').doc('y24_ord_state').set({ rawAt: new Date(Date.now() - ms).toISOString() }, { merge: true }); await W(200); S.y24o.st = { ...(S.y24o.st || {}), rawAt: new Date(Date.now() - ms).toISOString() }; };
      await setRaw(2 * 60e3); o.link1 = await osY24Link(1, { y24: true }); await setRaw(90 * 60e3); o.link2 = await osY24Link(1, { y24: true }); o.link0 = await osY24Link(0, { y24: true });
      const rid = 'osT'; await db.collection('shp_runs').doc(rid).set({ id: rid, status: 'run', ph: 'Y24', log: [] }); const run = { id: rid, status: 'run', ph: 'Y24', need: null };
      const q = (no, st, m, extra) => { const x = S.y24o.m.get(no); x.auto = { ship: { state: st, seq: 3, at: new Date(Date.now() - m * 60e3).toISOString(), ...(extra || {}) } }; return x; };
      o.stuck0 = !!(await osY24Stuck(run, [q('Y2', 'queued', 5)])); /* 기준 안 → 기다림 */
      o.stuck1 = await osY24Stuck(run, [q('Y2', 'queued', 30)]); await W(300); const R1 = (FS.shp_runs || {})[rid] || {}; o.need1 = { st: R1.status, k: (R1.need || {}).k, m: (R1.need || {}).msg, btn: ((R1.need || {}).btns || []).map((x) => x[0]).join(',') };
      await db.collection('shp_runs').doc(rid).set({ status: 'run', need: null }, { merge: true }); await setRaw(0);
      await db.collection('crm_y24_orders').doc('Y2').set({ auto: { ship: { state: 'queued', seq: 3, at: new Date(Date.now() - 30 * 60e3).toISOString(), no: '240000000088', courier: '롯데택배' } } }, { merge: true });
      await osY24Stuck(run, [q('Y2', 'queued', 30)]); await W(300); o.reQ = (((YD('Y2').auto || {}).ship) || {}).seq;
      await osY24Stuck(run, [q('Y2', 'sent', 40, { pc: 'HOME', reQ: 1 })]); await W(300); const R2 = (FS.shp_runs || {})[rid] || {}; o.need2 = { st: R2.status, k: (R2.need || {}).k };
      return o; });
    console.log(JSON.stringify(r).slice(0, 4000));
    ok(!r.btnOff && /지금 주문확인요청에 있는 3건/.test(r.askOn) && /…1111/.test(r.askOn), `켤 때 "지금 있는 n건도 판단할까요?" (판단 기록 없음·켜기 전·검토 3건 · 끝 4자리): ${r.askOn.slice(0, 80)}`);
    ok(r.after === 'wait*,wait*,wait*,sent,-' && r.rjO.split(',').length === 3 && r.since && r.how === 'enable', `예 → 같은 일괄: 3건 대기+켠 시각 건너뛰기 · 넘긴(sent)·보류는 그대로: ${r.after}`);
    ok(/모두 다시 판단 \(2건\)/.test(r.btn) && /…1111/.test(r.btn) && /…3333/.test(r.btn) && !/…4444|…5555/.test(r.btn), `① 칸 위 단추 — 대상 수·끝 4자리 미리 보임: ${r.btn}`);
    ok(/2건을/.test(r.askBtn) && r.after2 === 'wait*,wait*,sent,-' && r.rjHist >= 1, `누르면 물은 뒤 다시 판단(전 판단은 rjHist): ${r.after2}`);
    ok(r.feat, '🔍 기능 찾기에 있음');
    ok(/취소됨/.test(r.cxl) && /63분 동안 아무도 안 맡아 취소/.test(r.cxl) && !r.cxlBusy, `시장 다시 읽기 '취소'와 까닭: ${r.cxl.slice(0, 100)}`);
    ok(/맡은 곳 cloud/.test(r.run) && /맥박/.test(r.run) && /주문 목록을 읽는 기기가 없어/.test(r.run), `진행 줄: 맡은 곳·맥박·목록 없음: ${r.run.slice(0, 120)}`);
    ok(/주문 목록을 읽는 기기가 없어 시장을 못 읽음/.test(r.done) && /3건 다시 판단으로 돌려 둠/.test(r.done), `끝 줄: 목록 없음 · 다시 판단으로 돌려 둠: ${r.done.slice(0, 160)}`);
    ok(r.y1.inv === '240000000099' && r.y1.sa && r.y1.st === 'queued' && r.y1.cf === true && r.y1.no === '240000000099', `예스24 ALPS 끝 → 자동 처리 꺼져 있어도 발송처리 맡김 저절로 · 첫 건 확인 후 실행: ${JSON.stringify(r.y1)}`);
    ok(r.y2.seq === 2 && r.y2.reQ === 1 && r.y2.st === 'queued' && r.y4 === 1, `대기 15분 넘은 맡김은 다시(seq+1) · 방금 맡긴 것은 그대로: ${JSON.stringify(r.y2)} · ${r.y4}`);
    ok(!r.y3auto && /^y24ship:/.test(r.exc) && /발송처리 맡기기/.test(r.excBtn) && r.y3 === 'queued', `이 판 전에 남은 '송장만 있는' 주문은 저절로 안 맡기고 ⚠에 '발송처리 맡기기' → 누르면 맡김: ${r.exc.slice(0, 90)} · ${r.y3}`);
    ok(r.link1 && r.link1.lv === 'ok' && /마지막 응답 2분 전/.test(r.link1.m) && r.link2 && r.link2.lv === 'warn' && /90분 전/.test(r.link2.m) && r.link0 === null, `시작 전 점검: 예스24 연결 창 살아 있음(마지막 응답 시각) · 끊김이면 ⚠ · 예스24 없으면 안 봄`);
    ok(!r.stuck0 && r.need1.st === 'wait' && /^y24q:/.test(r.need1.k) && /30분째 대기/.test(r.need1.m) && /y24retry/.test(r.need1.btn) && /skipy24/.test(r.need1.btn), `원스톱 Y24: 대기 15분 넘고 연결 창 없음 → ⚠ 사람 몫(끝없이 기다리지 않음): ${JSON.stringify(r.need1)}`);
    ok(r.reQ === 4, `연결 창이 살아 있으면 한 번 다시 맡김(seq ${r.reQ})`);
    ok(r.need2.st === 'wait' && /^y24s:/.test(r.need2.k), `연결 창이 맡고 30분 넘게 결과 없음 → ⚠ 사람 몫: ${JSON.stringify(r.need2)}`);
    console.log(bad ? `❌ tFIXB 실패 ${bad}` : '✓ tFIXB 통과'); });
})();
