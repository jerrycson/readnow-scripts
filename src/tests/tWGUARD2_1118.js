// tWGUARD2_1118 — (11/18 일꾼 wguard2 · 리드 결정 F57 · 헌장 제7조) 쓰기 지킴이 남은 것 · 브라우저 필요 없음
//  ① 클라우드 예스24 가게 읽기(y24ShopTick) — 한 회차에 살아 있는 매물의 10%·50개 중 큰 쪽보다 많이 사라지면 사라짐을 하나도 적지 않고
//     prd_system/wguard.y24GoneStop에 남기고 멈춤 · 상한 안이면 그대로 적음 · allowUntil이 앞이면 적음 · 지난 allowUntil은 잠김 · 이미 사라진 것은 셈에서 뺌
//  ② 웹앱 수동 일괄 그룹 지우기(batchDelete) — 지우기 전에 그룹·나눔 문서를 휴지통(prd_price_batches_trash)에 그대로 옮김 · 옮기기가 안 되면 지우지 않음
//     · 같은 이름을 두 번 지워도 앞 휴지통을 덮지 않음 · 되살리기는 원래 이름으로 · 이미 있는 문서는 덮지 않음 · 휴지통 문서는 지우지 않음
//  ③ 웹앱 🛡 쓰기 지킴이 카드 — 30분 풀기(allowUntil = 지금+30분 · 기록 allowHist) · 다시 잠금(allowUntil = 지금 · 문서 안 지움) · 알릴 멈춤(24시간 안 · 그 뒤 푼 적 없음)
//  ④ 원본 자리 — 카드가 Firebase 백업 칸에 · 홈 알림 · 백업 목록에 휴지통 · 브라우저 팝업(alert·confirm) 없음 · 수집기와 같은 문서·같은 허락 규칙
// 실행: node src/tests/tWGUARD2_1118.js · 시험 자료는 모두 지어낸 값
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const rd = (...c) => { const f = c.map((x) => path.join(ROOT, x)).find((x) => fs.existsSync(x)); return f ? fs.readFileSync(f, 'utf8') : ''; };
const CL = rd('cloud/index.js'); const APP = rd('src/app.html', 'app.html'); const COL = rd('src/readnow-collector.src.js', 'readnow-collector.src.js', 'readnow-collector.user.js');
const cutOf = (S, a0, b0) => { const a = S.indexOf(a0); const b = S.indexOf(b0, a + 1); return a >= 0 && b > a ? S.slice(a, b) : ''; };
const J = (v) => JSON.parse(JSON.stringify(v));

/* ── 가짜 Firestore(합치기·지우기·where·자동 이름) ── */
function mkStore(init) { const M = new Map(Object.entries(init || {}).map(([k, v]) => [k, J(v)])); let auto = 0; const fail = { set: null }; const W = { sets: [], dels: [] };
  const DEL = { __del: 1 }; const TS = { __ts: 1 };
  const apply = (p, d, opt) => { if (fail.set && fail.set(p)) throw new Error('쓰기 실패(시험)'); W.sets.push(p); const merge = opt && opt.merge; const cur = merge && M.has(p) ? J(M.get(p)) : {};
    const mergeIn = (o, src) => { for (const [k, v] of Object.entries(src)) { if (v && v.__del) { delete o[k]; continue; } if (v && v.__inc != null) { o[k] = (+o[k] || 0) + v.__inc; continue; } if (v && v.__union) { o[k] = [...(o[k] || []), ...v.__union]; continue; } if (v && v.__ts) { o[k] = 'TS'; continue; } if (merge && v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) { mergeIn(o[k], v); continue; } o[k] = v && typeof v === 'object' ? mergeIn(Array.isArray(v) ? [] : {}, v) && (Array.isArray(v) ? J(v) : mergeIn({}, v)) : v; } return o; };
    M.set(p, mergeIn(cur, d)); };
  const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
  const ref = (col, id) => { const p = col + '/' + id; return { id, path: p, parent: { id: col },
    get: async () => ({ id, exists: M.has(p), data: () => (M.has(p) ? J(M.get(p)) : undefined), metadata: { fromCache: false }, ref: ref(col, id) }),
    set: async (d, opt) => apply(p, d, opt), delete: async () => { W.dels.push(p); M.delete(p); } }; };
  const query = (col, F) => ({ where: (f, op, v) => query(col, [...F, [f, op, v]]), limit: () => query(col, F), select: () => query(col, F),
    get: async () => { const docs = [...M.keys()].filter((p) => p.startsWith(col + '/') && !p.slice(col.length + 1).includes('/')).map((p) => p.slice(col.length + 1)).filter((id) => F.every(([f, op, v]) => op === '==' && get(M.get(col + '/' + id), f) === v)).map((id) => ({ id, ref: ref(col, id), data: () => J(M.get(col + '/' + id)) }));
      return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false }, forEach: (fn) => docs.forEach(fn) }; } });
  const collection = (col) => ({ doc: (id) => ref(col, id == null ? 'auto' + (++auto) : id), ...query(col, []) });
  const batch = () => { const L = []; return { set: (r, d, o) => L.push([r, d, o]), commit: async () => { for (const [r, d, o] of L) await r.set(d, o); } }; };
  const FV = { delete: () => DEL, serverTimestamp: () => TS, increment: (n) => ({ __inc: n }), arrayUnion: (...a) => ({ __union: J(a) }) };
  return { M, W, fail, collection, batch, FV, doc: (p) => (M.has(p) ? J(M.get(p)) : undefined), ids: (col) => [...M.keys()].filter((p) => p.startsWith(col + '/')).map((p) => p.slice(col.length + 1)).sort() }; }

(async () => {
  /* ━━━━━━━━━━ ① 클라우드 예스24 사라짐 상한 ━━━━━━━━━━ */
  console.log('① 클라우드 예스24 사라짐 상한 max(50, 10%)');
  const CB = cutOf(CL, '/* (0.35.292 wguard2) 🛡 클라우드 쓰기 지킴이', 'setTimeout(() => y24ShopTick(), 4 * 60e3)');
  ok(CB.length > 2000 && /async function y24ShopTick\(/.test(CB) && /const y24GoneCap = /.test(CB), '클라우드 묶음(y24GoneCap·wgAllowedCloud·wgNoteCloud·y24ShopTick) 떼어 냄');
  async function runShop({ live, shown, goneBefore, allow }) {
    const init = { 'app_settings/platforms': { y24: { req1021: true, req1029: true, off: false } } };
    for (let i = 0; i < live; i++) init['y24_listings/' + (100000 + i)] = { goodsNo: String(100000 + i), state: '판매중', isbnTried: 'x', lastSeenAt: '2026-11-17T00:00:00Z', title: '책' + i };
    for (let i = 0; i < (goneBefore || 0); i++) init['y24_listings/' + (900000 + i)] = { goodsNo: String(900000 + i), goneAt: '2026-11-10T00:00:00Z', isbnTried: 'x' };
    if (allow) init['prd_system/wguard'] = { allowUntil: allow };
    const st = mkStore(init); const logs = [];
    const items = []; for (let i = 0; i < shown; i++) items.push({ goodsNo: String(100000 + i), title: '책' + i, state: '판매중' });
    const ctx = { C: (n) => st.collection(n), db: { batch: st.batch }, FV: st.FV, nowIso: () => new Date().toISOString(), log: (...a) => logs.push(a.join(' ')), sleep: async () => {}, Y24S: { entr: 1, busy: false }, Math, Date, JSON, Object, Map, Set, String, Number, console,
      y24GetR: async (u, p) => p, y24ShopParse: (p) => items.slice((p - 1) * 40, p * 40), y24Get: async () => '' };
    vm.createContext(ctx); vm.runInContext(CB + '\nthis.__run = y24ShopTick; this.__cap = y24GoneCap;', ctx); await ctx.__run(true);
    const goneNow = st.ids('y24_listings').filter((id) => { const v = st.doc('y24_listings/' + id); return v.goneAt && v.goneAt !== '2026-11-10T00:00:00Z'; });
    const chg = st.ids('y24_listing_changes').map((id) => st.doc('y24_listing_changes/' + id)).filter((v) => v.changes && v.changes.gone);
    return { st, logs, goneNow, chg, wg: st.doc('prd_system/wguard') || {}, shop: (st.doc('app_settings/y24_state') || {}).shop || {}, cap: ctx.__cap }; }
  { const R = await runShop({ live: 200, shown: 140 }); /* 60개 사라짐 > 상한 50 */
    ok(R.goneNow.length === 0 && R.chg.length === 0, '살아 있는 200 중 60 사라짐(상한 50) — 사라짐을 하나도 적지 않음', { gone: R.goneNow.length, chg: R.chg.length });
    ok(R.wg.y24GoneStop && R.wg.y24GoneStop.n === 60 && R.wg.y24GoneStop.cap === 50 && R.wg.y24GoneStop.live === 200 && R.wg.y24GoneStop.pc === 'cloud' && R.wg.trips === 1 && (R.wg.y24GoneStop.sample || []).length === 10, 'prd_system/wguard.y24GoneStop에 수·상한·살아 있는 수·예 10개 · trips 1', R.wg);
    ok(R.shop.goneStop && R.shop.goneStop.n === 60 && R.shop.gone === 0 && R.shop.n === 140, '가게 요약(y24_state.shop)에 goneStop · 사라짐 0', R.shop);
    ok(R.logs.some((l) => /🛡 예스24 사라짐 60개 > 상한 50/.test(l)), '멈춘 까닭을 기록 줄에', R.logs);
    ok(R.st.ids('y24_listings').length === 200, '매물 문서를 하나도 지우지 않음'); }
  { const R = await runShop({ live: 200, shown: 160 }); /* 40개 ≤ 50 */
    ok(R.goneNow.length === 40 && R.chg.length === 40 && !R.wg.y24GoneStop, '40 사라짐(상한 50 안) — 그대로 적음 · 지킴이 기록 없음', { gone: R.goneNow.length, wg: R.wg });
    ok(!('goneStop' in R.shop) && R.shop.gone === 40, '성공 회차는 앞 goneStop을 지움(merge + FV.delete — 가게 요약 칸만)', R.shop); }
  { const R = await runShop({ live: 1000, shown: 910 }); /* 90 ≤ 100(10%) */
    ok(R.goneNow.length === 90 && !R.wg.y24GoneStop, '살아 있는 1,000 중 90 사라짐 — 상한 100(10%) 안이라 적음'); }
  { const R = await runShop({ live: 1000, shown: 899 }); /* 101 > 100 */
    ok(R.goneNow.length === 0 && R.wg.y24GoneStop && R.wg.y24GoneStop.cap === 100, '101 사라짐 > 상한 100 — 멈춤', R.wg); }
  { const R = await runShop({ live: 200, shown: 140, allow: new Date(Date.now() + 20 * 60e3).toISOString() });
    ok(R.goneNow.length === 60 && !R.wg.y24GoneStop, '허락(allowUntil 20분 뒤)이면 60개 모두 적음', R.wg); }
  { const R = await runShop({ live: 200, shown: 140, allow: new Date(Date.now() - 60e3).toISOString() });
    ok(R.goneNow.length === 0 && R.wg.y24GoneStop, '지난 allowUntil(1분 전)은 저절로 다시 잠김 — 멈춤'); }
  { const R = await runShop({ live: 200, shown: 150, goneBefore: 500 });
    ok(R.goneNow.length === 50 && !R.wg.y24GoneStop, '이미 사라진 500개는 살아 있는 수·사라짐 수에서 뺌(50 = 상한 50 안)', { gone: R.goneNow.length, wg: R.wg }); }
  { const R = await runShop({ live: 0, shown: 30 }); ok(R.goneNow.length === 0 && !R.wg.y24GoneStop && R.cap(0) === 50 && R.cap(499) === 50 && R.cap(501) === 51, '처음 회차(옛 매물 없음) 그대로 · 상한 셈 max(50, ⌈10%⌉)'); }

  /* ━━━━━━━━━━ ② 웹앱 가격 그룹 휴지통 ━━━━━━━━━━ */
  console.log('② 웹앱 수동 일괄 그룹 지우기 → 휴지통 · 되살리기');
  const BD = cutOf(APP, 'async function batchDelete(gs, btn) {', 'const batchDelAsk = ');
  const WB = cutOf(APP, '/* (1.78.703 wguard2 · 리드 결정 F57)', "/* (정범님 10/27 '1.6GB 맞아?')");
  ok(BD.length > 1000 && WB.length > 3000, '웹앱 batchDelete·쓰기 지킴이 묶음 떼어 냄');
  const ia = BD.indexOf("prd_price_batches_trash"), id1 = BD.indexOf('await d.ref.delete()');
  ok(ia > 0 && id1 > ia, '원본 순서 — 휴지통에 옮긴 뒤에 지움');
  const mkApp = (st, extra) => { const toasts = []; const alerts = []; const ctx = { S: { user: { email: 'staff@test' }, prCfg: { batchOff: {} } }, db: { collection: st.collection, runTransaction: async () => {} }, firebase: { firestore: { FieldValue: st.FV } },
      alert: (m) => alerts.push(m), toast: (m) => toasts.push(m), errKo: (e) => String(e && e.message), esc: (s) => String(s == null ? '' : s).replace(/[<>&"]/g, ''), num: (n) => String(n), kTime: (s) => String(s || '').slice(5, 16), isAdminDevice: () => true, twiceArm: () => 'go',
      document: { addEventListener: () => {}, getElementById: () => null }, setTimeout: () => 0, clearTimeout: () => {}, Date, JSON, Object, Math, String, Number, Set, Map, console, ...(extra || {}) };
    vm.createContext(ctx); vm.runInContext(BD + '\n' + WB + '\nthis.__x = { batchDelete, wgTrashList, wgTrashRestore, wgSetOpen, wgStops, wguardHtml, WG_ALLOW_MIN };', ctx); return { ...ctx.__x, toasts, alerts, ctx }; };
  const G1 = { name: '그룹A', cond: { q: 1 }, lastCount: 3, createdAt: '2026-11-01' }; const SH0 = { shardOf: 'g1', n: 0, picks: { a: 1 } }; const SH1 = { shardOf: 'g1', n: 1, decided: { b: 2 } };
  const init = { 'prd_price_batches/g1': G1, 'prd_price_batches/g1_s0': SH0, 'prd_price_batches/g1_s1': SH1, 'prd_price_batches/g2': { name: '그룹B' }, 'prd_system/pricing': { batchOff: {} } };
  { const st = mkStore(init); const A = mkApp(st); const r = await A.batchDelete([{ id: 'g1', ...G1 }]);
    const T = st.ids('prd_price_batches_trash'); const tv = T.map((i) => st.doc('prd_price_batches_trash/' + i));
    ok(r.del === 1 && !st.doc('prd_price_batches/g1') && !st.doc('prd_price_batches/g1_s0') && !st.doc('prd_price_batches/g1_s1') && !!st.doc('prd_price_batches/g2'), '그룹 g1과 나눔 문서 둘이 목록에서 빠짐 · 다른 그룹 g2 그대로', st.ids('prd_price_batches'));
    ok(T.length === 3 && T.every((i) => /^g1(_s[01])?~\d{17}$/.test(i)), '휴지통에 세 문서(이름~지운 때 밀리초)', T);
    const g = tv.find((v) => v._trash.kind === 'group'); const s0 = tv.find((v) => v._trash.id === 'g1_s0');
    ok(g && g.name === '그룹A' && g.lastCount === 3 && JSON.stringify(g.cond) === JSON.stringify(G1.cond) && g._trash.of === 'g1' && g._trash.by === 'staff@test' && g._trash.from === 'prd_price_batches' && g._trash.name === '그룹A', '그룹 문서 내용 그대로 + 지운 때·사람·원래 자리', g);
    ok(s0 && s0._trash.kind === 'shard' && JSON.stringify(s0.picks) === JSON.stringify(SH0.picks) && s0.shardOf === 'g1', '나눔 문서(상품별 기록)도 내용 그대로', s0);
    await new Promise((z) => setTimeout(z, 5));
    /* 같은 이름을 다시 만들고 또 지움 → 앞 휴지통 그대로 */
    await st.collection('prd_price_batches').doc('g1').set({ name: '그룹A2' }); await A.batchDelete([{ id: 'g1', name: '그룹A2' }]);
    const T2 = st.ids('prd_price_batches_trash'); ok(T2.length === 4 && T.every((i) => st.doc('prd_price_batches_trash/' + i).name === tv[T.indexOf(i)].name), '같은 이름을 두 번 지워도 앞 휴지통을 덮지 않음(4개)', T2);
    /* 되살리기 — 첫 지움 */
    const L = await A.wgTrashList(); ok(L.length === 2 && L[0].name === '그룹A2' && L[1].name === '그룹A', '휴지통 목록 = 그룹 문서만 · 새것 먼저', L);
    const rr = await A.wgTrashRestore(L[1].tid);
    const back = st.doc('prd_price_batches/g1'); const b0 = st.doc('prd_price_batches/g1_s0');
    ok(rr.ok === 3 && back && back.name === '그룹A' && !back._trash && back.restoredFrom && b0 && JSON.stringify(b0.picks) === JSON.stringify(SH0.picks) && !!st.doc('prd_price_batches/g1_s1'), '되살리기 — 세 문서를 원래 이름·내용으로(+ restoredFrom)', { rr, back });
    ok(st.ids('prd_price_batches_trash').length === 4 && T.every((i) => st.doc('prd_price_batches_trash/' + i)._trash.restoredAt), '휴지통 문서는 지우지 않고 restoredAt만 적음');
    /* 둘째 지움(그룹A2)을 되살리려는데 g1이 이미 있음 → 덮지 않음 */
    const rr2 = await A.wgTrashRestore(L[0].tid); ok(rr2.ok === 0 && rr2.skip.includes('g1') && st.doc('prd_price_batches/g1').name === '그룹A', '이미 같은 이름 문서가 있으면 덮지 않고 건너뜀', rr2);
    ok(A.alerts.length === 2 && A.toasts.length === 0, '(지우기 끝 알림은 예전 그대로 — 새 코드는 팝업을 더 부르지 않음)'); }
  { const st = mkStore(init); st.fail.set = (p) => p.startsWith('prd_price_batches_trash/'); const A = mkApp(st); const r = await A.batchDelete([{ id: 'g1', ...G1 }]);
    ok(r.del === 0 && r.skip.length === 1 && !!st.doc('prd_price_batches/g1') && !!st.doc('prd_price_batches/g1_s0') && !!st.doc('prd_price_batches/g1_s1') && st.W.dels.length === 0, '휴지통에 못 옮기면 하나도 지우지 않음', { r, dels: st.W.dels }); }

  /* ━━━━━━━━━━ ③ 쓰기 지킴이 카드 ━━━━━━━━━━ */
  console.log('③ 🛡 쓰기 지킴이 카드 — 30분 풀기 · 다시 잠금 · 알릴 멈춤');
  { const st = mkStore({ 'prd_system/wguard': { stop: { at: '2026-11-17T03:00:00Z', pc: 'HOME', winN: 120 }, trips: 4 } }); const A = mkApp(st);
    const t0 = Date.now(); const u = await A.wgSetOpen(true); const w = st.doc('prd_system/wguard'); const dt = Date.parse(w.allowUntil) - t0;
    ok(A.WG_ALLOW_MIN === 30 && dt > 29.9 * 60e3 && dt < 30.1 * 60e3 && w.allowUntil === u && w.allowBy === 'staff@test' && w.allowMin === 30, '🔓 30분 풀기 = allowUntil 지금+30분 · 누가', w);
    ok(w.stop && w.stop.winN === 120 && w.trips === 4, '풀기는 멈춘 기록·trips를 지우지 않음(합치기)', w);
    ok((w.allowHist || []).length === 1 && w.allowHist[0].act === 'open', '풀기 기록 allowHist 한 줄');
    await A.wgSetOpen(false); const w2 = st.doc('prd_system/wguard');
    ok(Date.parse(w2.allowUntil) <= Date.now() && w2.allowHist.length === 2 && w2.allowHist[1].act === 'close' && w2.closeBy === 'staff@test' && w2.stop, '🔒 다시 잠금 = allowUntil 지금(지우지 않음) · 기록 두 줄', w2);
    ok(st.W.dels.length === 0, '카드는 문서를 지우지 않음');
    const now = Date.parse('2026-11-18T03:00:00Z');
    const S1 = A.wgStops({ stop: { at: '2026-11-18T01:00:00Z' }, goneStop: { at: '2026-11-16T01:00:00Z' }, y24GoneStop: { at: '2026-11-18T02:00:00Z', n: 60 } }, now);
    ok(S1.map((x) => x.k).join(',') === 'stop,y24GoneStop', '알릴 멈춤 = 24시간 안만(이틀 전 goneStop 뺌)', S1.map((x) => x.k));
    const S2 = A.wgStops({ stop: { at: '2026-11-18T01:00:00Z' }, y24GoneStop: { at: '2026-11-18T02:30:00Z' }, allowAt: '2026-11-18T02:00:00Z' }, now);
    ok(S2.map((x) => x.k).join(',') === 'y24GoneStop', '멈춘 뒤 일부러 푼 것은 알리지 않음 · 푼 뒤 새로 멈춘 것은 알림', S2.map((x) => x.k));
    A.ctx.S.wg = { allowUntil: new Date(Date.now() + 10 * 60e3).toISOString(), allowBy: 'staff@test', y24GoneStop: { at: new Date().toISOString(), pc: 'cloud', n: 60, cap: 50, sample: ['1', '2'] } }; A.ctx.S._wgW = 1;
    const H = A.wguardHtml(); ok(/🔓 풀림/.test(H) && /분 남음/.test(H) && /wg_close/.test(H) && /예스24 가게/.test(H) && /60개\(상한 50\)/.test(H), '카드 — 풀림·남은 분·다시 잠금 단추·멈춘 기록', H.slice(0, 400));
    A.ctx.S.wg = { allowUntil: new Date(Date.now() - 1000).toISOString() }; const H2 = A.wguardHtml(); ok(/🔒 잠김/.test(H2) && !/wg_close/.test(H2), '기한 지난 allowUntil은 잠김으로 보임(저절로 다시 잠김)'); }

  /* ━━━━━━━━━━ ④ 원본 자리 ━━━━━━━━━━ */
  console.log('④ 원본 자리');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(WB) && !/\balert\(|\bconfirm\(/.test(CB), '새 코드에 브라우저 팝업(alert·confirm·prompt) 없음');
  ok(/twiceArm\(t, `\$\{WG_ALLOW_MIN\}분 동안 지킴이 풀기`/.test(WB) && /twiceArm\(t, '이 그룹 되살리기'\)/.test(WB), '풀기·되살리기는 두 번 눌러야');
  ok(/\$\{dataBackupHtml\(\)\}\$\{wguardHtml\(\)\}/.test(APP), '카드가 ⚙ Firebase 백업 칸 맨 아래');
  const BA = cutOf(APP, 'function bizAlerts(B) {', 'try { pwhWatch();'); ok(/wgWatch\(\); const WS = wgStops\(S\.wg\)/.test(BA) && /add\('red', `🛡 쓰기 지킴이가 멈춤/.test(BA), '홈 알림(빨강) — 쓰기 지킴이 멈춤');
  ok(/const FB_COLLECTIONS = \[[^\]]*'prd_price_batches_trash'/.test(APP), 'Firebase 백업 목록에 휴지통 칸');
  ok(/doc\('wguard'\)/.test(COL) && /Date\.parse\(v\.allowUntil\) > Date\.now\(\)/.test(COL) && /Date\.parse\(v\.allowUntil \|\| ''\) > Date\.now\(\)/.test(CB) && /doc\('wguard'\)/.test(WB), '수집기·클라우드·웹앱이 같은 문서 prd_system/wguard · 같은 허락 규칙(allowUntil > 지금)');
  ok(/const VER = '0\.35\.(\d+)'/.test(CL) && +CL.match(/const VER = '0\.35\.(\d+)'/)[1] >= 292, '클라우드 판 0.35.292 이상');
  /* ━━━━━━━━━━ ⑤ Firestore 규칙 원본(에뮬레이터 시험은 firestore/rules.test.js — 도구 설치가 필요해 빠른 묶음 밖) ━━━━━━━━━━ */
  console.log('⑤ Firestore 규칙 원본');
  const RU = rd('firestore/firestore.rules'); const RUc = RU.replace(/\/\/.*$/gm, '');
  ok(RU.length > 500 && RUc.includes("'__STAFF_EMAILS__'") && !/@[a-z0-9-]+\.[a-z.]{2,}/i.test(RUc), '규칙 원본 있음 · 직원 목록은 자리 표시만(실제 전자우편 없음)');
  ok(/match \/prd_locks\/\{k\} \{[\s\S]*?allow delete: if false;/.test(RUc) && /hist', \[\]\)\.size\(\) >= resource\.data\.get\('hist', \[\]\)\.size\(\)/.test(RUc), '🔒 잠금 — 지우기 금지 · 기록은 늘기만');
  ok(/match \/\{document=\*\*\} \{\s*allow read: if staff\(\);\s*allow write: if staff\(\) && !\(request\.path\[3\] (== 'prd_locks'|in \['prd_locks'(, '[a-z_0-9]+')*\])\);/.test(RUc), '나머지는 예전 그대로(직원 읽기·쓰기) · 쓰기만 잠금 칸(과 클라우드만 쓰는 관제소 요약 칸 · kpib1 11/19)을 뺌');
  const PK = (RUc.match(/function plockKeys\(\) \{\s*return \[([^\]]+)\]/) || [])[1] || ''; const pk = new Set([...PK.matchAll(/'([^']+)'/g)].map((x) => x[1]));
  const PS = cutOf(APP, 'async function plkSet(', 'await db.collection(\'prd_locks\').doc(k).set(doc'); const wk = new Set([...PS.matchAll(/[{,] ?(\w+):/g)].map((x) => x[1]).filter((k) => !['act', 'dev', 'price', 'qty', 'state', 'grade', 'code'].includes(k)));
  ok(pk.size >= 15 && [...wk].every((k) => pk.has(k)), '웹앱 plkSet이 쓰는 칸이 모두 규칙의 허락 칸 안', { rule: [...pk], app: [...wk].filter((k) => !pk.has(k)) });
  ok(fs.existsSync(path.join(ROOT, 'src/tools/rules-deploy.js')) && /rules\.test\.js/.test(rd('src/tools/rules-deploy.js')) && /--deploy/.test(rd('src/tools/rules-deploy.js')), '배포 도구는 --deploy일 때만 · 에뮬레이터 시험 통과 뒤에만');
  console.log(bad ? `❌ tWGUARD2_1118 ${bad}개 실패` : '✅ tWGUARD2_1118 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
