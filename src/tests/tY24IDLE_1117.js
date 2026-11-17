// tY24IDLE_1117 — (bunoe1 11/17 · 정범님 19.10 · A95 리드 결정) 예스24 통째 읽기 — 올릴 후보 0건인 동안 24시간마다
//   ① 후보 0건(모든 PC) → 6시간엔 통째 안 함 · 24시간에 통째 ② 한 PC라도 후보 있음 → 예전처럼 6시간
//   ③ 센 값 없음 → 6시간(예전 그대로) · 24시간 지난 센 값은 안 셈 ④ ⚙ fullH=6이 있으면 후보 0건이어도 6시간(되돌림)
//   ⑤ 바뀐 줄 읽기(10분)·팔린 책 판매중지 작은 켜(fresh)는 후보 0건이어도 그대로 돎
// 실행: node src/tests/tY24IDLE_1117.js · 지어낸 자료 · 실제 Firebase에 아무것도 안 함
const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
const H = 3600e3;
function world(plat) { let T = Date.parse('2026-11-17T01:00:00Z'); const now = () => T; const F = makeDb(); const { store } = F; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  const isoT = (d) => new Date(T + (d || 0)).toISOString();
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: { ...(plat || {}) } }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { n: 1, mapN: 0, at: 'a0', free: [], lease: {} });
  for (let i = 0; i < 20; i++) put('prd_listings', 'aladin_F' + i, { listingId: 5000 + i, usedCode: 'F' + i, title: '채움 ' + i, grade: '중', price: 3000, qty: 1, active: true, status: '판매중' });
  const Y = makeY24Auto({ db: F.db, C: F.C, FV: F.FV, now, getText: async () => { throw new Error('없음'); }, getUrl: async () => { throw new Error('바깥 안 감'); } });
  return { Y, store, now, isoT, adv: (ms) => { T += ms; } }; }
const until = async (W, hours) => { const b0 = W.Y._M.bigAt; let h = 0; while (h < hours) { W.adv(H); h++; await W.Y.data(); if (W.Y._M.bigAt > b0) return h; } return 0; };
(async () => {
  /* ① 후보 0건 → 24시간 */
  { const W = world(); await W.Y.data(); W.Y._M.cand.set('HOME', { n: 0, at: W.now() }); W.Y._M.cand.set('JS-MAIN', { n: 0, at: W.now() });
    const keep = () => { for (const k of W.Y._M.cand.keys()) W.Y._M.cand.set(k, { n: 0, at: W.now() }); };
    const b0 = W.Y._M.bigAt; for (let h = 0; h < 23; h++) { W.adv(H); keep(); await W.Y.data(); }
    ok(W.Y._M.bigAt === b0 && W.Y._M.big.last.kind === 'delta', '① 후보 0건 — 23시간 동안 통째 안 함(바뀐 줄만)', W.Y._M.big.last);
    W.adv(H); keep(); await W.Y.data(); ok(W.Y._M.bigAt > b0 && W.Y._M.big.last.kind === 'full' && W.Y._M.big.fullMs === 24 * H, '① 24시간 되면 통째', { last: W.Y._M.big.last, fm: W.Y._M.big.fullMs });
    /* ⑤ 바뀐 줄 읽기·팔린 책 작은 켜 그대로 */
    W.store.prd_listings.aladin_F3 = { ...W.store.prd_listings.aladin_F3, status: '판매완료', qty: 0, active: false, uploadedAt: W.isoT() };
    W.adv(11 * 60e3); keep(); const D = await W.Y.data();
    ok(W.Y._M.big.last.kind === 'delta' && !D.list.some((l) => l.id === 'aladin_F3') && W.Y._M.big.fresh.get('aladin_F3').status === '판매완료', '⑤ 후보 0건이어도 10분 바뀐 줄 읽기·팔린 책 작은 켜는 그대로'); }
  /* ② 한 PC라도 후보 있음 → 6시간 */
  { const W = world(); await W.Y.data(); W.Y._M.cand.set('HOME', { n: 0, at: W.now() }); W.Y._M.cand.set('JS-MAIN', { n: 3, at: W.now() });
    const h = await until(W, 7); ok(h === 6 && W.Y._M.big.fullMs === 6 * H, '② 한 PC 후보 3건 — 6시간에 통째(예전 그대로)', h); }
  /* ③ 센 값 없음 · 묵은 값 */
  { const W = world(); await W.Y.data(); const h = await until(W, 7); ok(h === 6, '③ 후보를 센 적 없으면 6시간(예전 그대로)', h); }
  { const W = world(); await W.Y.data(); W.Y._M.cand.set('HOME', { n: 0, at: W.now() - 25 * H }); const h = await until(W, 7); ok(h === 6, '③ 24시간 지난 센 값은 안 셈 → 6시간', h); }
  /* ④ 되돌림 fullH=6 */
  { const W = world({ read: { fullH: 6 } }); await W.Y.data(); const keep = () => W.Y._M.cand.set('HOME', { n: 0, at: W.now() }); keep();
    const b0 = W.Y._M.bigAt; let h = 0; while (h < 7) { W.adv(H); h++; keep(); await W.Y.data(); if (W.Y._M.bigAt > b0) break; }
    ok(h === 6 && W.Y._M.big.fullMs === 6 * H, '④ ⚙ fullH=6이면 후보 0건이어도 6시간(되돌림 한 줄)', h); }
  { const W = world({ read: { fullH: 12 } }); await W.Y.data(); W.Y._M.cand.set('HOME', { n: 5, at: W.now() }); const h = await until(W, 13); ok(h === 12, '④ ⚙ fullH 값이 있으면 후보가 있어도 그 값(12시간)', h); }
  /* step이 후보 수를 남김 — 본문 */
  { const src = require('fs').readFileSync(path.join(TOP, 'cloud/y24auto.js'), 'utf8'); ok(/M\.cand\.set\(pc, \{ n: cand0\.length/.test(src), '⓪ step이 PC마다 올릴 후보 수(cand0)를 남김');
    ok(/FRESH_MS = 5 \* 60e3/.test(src) && /DATA_MS = 10 \* 60e3/.test(src) && /FULL_MS = 6 \* 3600e3/.test(src), '⓪ FRESH 5분·DATA 10분·FULL 6시간 기본값 그대로'); }
  console.log(bad ? `❌ tY24IDLE_1117 ${bad}개 실패` : '✅ tY24IDLE_1117 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
