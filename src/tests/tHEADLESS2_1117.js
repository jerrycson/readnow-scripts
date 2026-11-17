// tHEADLESS2_1117 — (headless2 11/17 · RESUME_1116 8번) 클라우드 예스24 자동 data(): '10분마다 통째 읽기' → '바뀐 것만 읽기'
//   ① 처음 = 통째 · 그 뒤 10분마다 바뀐 줄만(uploadedAt·markAt > 커서 − 5분) · 바뀐 것 없으면 큰 칸 읽기 0
//   ② 상품: 값 바뀜·판매중에서 빠짐·되돌림(다시 판매중)·markAt만 바뀜·새 판매중 · ③ 지운 줄·손으로 고친 값(시각 없음) = 6시간 통째 때 맞춤
//   ④ 넘침(3000줄+) → 바로 통째 · 실패(색인 없음 등) → 큰 켜 묵힘 + 45분마다 통째(예전과 같음)
//   ⑤ 주문: 새 주문 → 묶임 · 취소(lineStatus) → 풀림 · 14일 창 다듬기 · ⑥ 등록 기록: createdAt으로도 · bump는 뺌
//   ⑦ 관리자 원문: 맨 위 한 줄이 같으면 다시 안 읽음 · ⑧ SKU 짝: sku_seq가 같으면 다시 안 읽음 · lease만 바뀌면 그대로
//   ⑨ changes() — 다른 코드(통합 장부 엔진 감시)가 쓰는 바뀐 것 목록·커서 · 넘쳐 잃으면 gap · ⑩ fullH 설정 · ⑪ 읽기 셈(autoSt._RD)
//   ⑫ 하루 흉내 — 예전 방식 셈과 견줌
// 실행: node src/tests/tHEADLESS2_1117.js · 지어낸 자료 · 실제 Firebase에 아무것도 안 함
const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
const RAW_SIG = 'POST /api/Product/ProductList';
function world(nFill, extraPlat) { let T = Date.parse('2026-11-17T01:00:00Z'); const now = () => T; const F = makeDb(); const { store } = F; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  const reads = {}; let failOn = null;
  const wrap = (o, c) => new Proxy(o, { get(t, k) { const v = t[k]; if (typeof v !== 'function') return v; if (k === 'get') return async (...a) => { const r = await v.apply(t, a); reads[c] = (reads[c] || 0) + (r && r.size !== undefined ? Math.max(1, r.size) : 1); return r; }; /* 운영 셈: 빈 조회도 1읽기 */
    if (k === 'where') return (f, ...a) => { if (failOn && failOn(c, f)) throw new Error('시험 — 바뀐 줄 읽기 실패(색인 없음)'); return wrap(v.call(t, f, ...a), c); };
    return (...a) => { const r = v.apply(t, a); return r && typeof r === 'object' && typeof r.then !== 'function' ? wrap(r, c) : r; }; } });
  const C = (c) => wrap(F.C(c), c);
  const isoT = (d) => new Date(T + (d || 0)).toISOString();
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: { ...(extraPlat || {}) } }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { n: 10, mapN: 0, at: 'a0', free: [], lease: { x: 1 } }); put('app_settings', 'sku_map_0', { m: { aladin_A1: { c: ['ab001'] } } });
  const L = (id, x) => put('prd_listings', 'aladin_' + id, { listingId: 9000 + id.length * 100 + id.charCodeAt(id.length - 1), usedCode: id, title: '시험 책 ' + id, isbn13: '978890000' + String(id.charCodeAt(0)).padStart(4, '0'), grade: '상', price: 5000, priceList: 15000, qty: 1, sku: 'ABC_' + id, active: true, status: '판매중', ...(x || {}) });
  L('A1'); L('A2'); L('A3');
  for (let i = 0; i < (nFill || 40); i++) put('prd_listings', 'aladin_F' + i, { listingId: 5000 + i, usedCode: 'F' + i, title: '채움 ' + i, grade: '중', price: 3000, qty: 1, active: true, status: '판매중' });
  put('prd_listings', 'aladin_Q1', { listingId: 7001, title: '팔린 책', status: '판매완료', qty: 0 });
  put('y24_listings', '500000001', { goodsNo: '500000001', isbn13: '9788900000011', grade: '상', price: 6000, firstSeenAt: isoT(-864e5) });
  put('crm_orders', 'o_old', { kind: 'sale', platform: 'aladin', orderNo: 'X1', orderedAt: isoT(-3 * 864e5), items: [{ listingKey: 'aladin_A3', lineStatus: 'normal' }] });
  put('reg_items', 'r1', { createdAt: isoT(-864e5), y24Reg: { st: 'ok' } });
  put('crm_y24_raw', 'raw1', { sig: RAW_SIG, at: isoT(-3600e3), body: JSON.stringify({ PRODUCT_LIST: [{ GOODS_NO: '500000001', EAN: '9788900000011' }] }) });
  const Y = makeY24Auto({ db: F.db, C, FV: F.FV, now, getText: async () => { throw new Error('없음'); }, getUrl: async () => { throw new Error('바깥 안 감'); } });
  return { Y, F, store, put, L, reads, now, isoT, adv: (ms) => { T += ms; }, fail: (f) => { failOn = f; }, reset: () => { for (const k of Object.keys(reads)) delete reads[k]; } }; }
const big = (r) => (r.prd_listings || 0) + (r.y24_listings || 0) + (r.crm_orders || 0) + (r.reg_items || 0);
(async () => {
  /* ① 처음 통째 → 바뀐 것 없으면 큰 칸 읽기 = 빈 조회 값(칸마다 1)뿐 */
  const W = world(); const { Y, store } = W; const stamp = (c, id, x) => { Object.assign(store[c][id], x || {}, { uploadedAt: W.isoT() }); };
  let D = await Y.data(); const r0 = { ...W.reads };
  ok(Y._M.big.last.kind === 'full' && (r0.prd_listings || 0) >= 43 && D.list.length === 43, '① 처음 = 통째(판매중 43권)', { r0, n: D.list.length });
  ok(D.held.get('aladin_A3') && D.ord.size === 1, '① 처음 — 14일 안 주문(o_old)이 A3를 묶음', [...D.held]);
  const c0 = Y.changes(0); ok(c0.seq >= 1 && c0.rows.some((x) => x.c === '*' && x.k === 'full') && c0.cur.pl > 0, '⑨ changes(0) — 통째 표식 줄 · 칸마다 커서', c0);
  W.reset(); W.adv(5 * 60e3); await Y.data(); ok(!Object.keys(W.reads).length, '① 10분 안에 다시 부르면 아무것도 안 읽음(기억)', W.reads);
  W.reset(); W.adv(6 * 60e3); D = await Y.data();
  ok(Y._M.big.last.kind === 'delta' && big(W.reads) <= 8 && !(W.reads.crm_y24_raw > 1), '① 11분 뒤 — 바뀐 줄만(바뀐 것 없음 → 큰 칸 읽기 = 빈 조회 몇 개뿐)', W.reads);
  ok((W.reads.app_settings || 0) === 5, '⑧ 설정 4 + sku_seq 1 — sku_seq가 같아 SKU 짝(sku_map)은 다시 안 읽음', W.reads);
  let seq1 = Y.changes(0).seq;
  /* ② 상품 — 값 바뀜 · 빠짐 · 새 판매중 */
  stamp('prd_listings', 'aladin_A1', { price: 7700 }); stamp('prd_listings', 'aladin_A2', { status: '판매완료', qty: 0, active: false }); W.L('N1', { uploadedAt: W.isoT() });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.list.find((l) => l.id === 'aladin_A1').price === 7700, '② 값이 바뀐 A1 — 목록에 새 값', D.list.find((l) => l.id === 'aladin_A1'));
  ok(!D.list.some((l) => l.id === 'aladin_A2') && !Y._M.big.idx.has('aladin_A2'), '② 판매중에서 빠진 A2 — 목록에서 뺌');
  ok(D.list.some((l) => l.id === 'aladin_N1') && D.byLid.get(String(Y._M.big.idx.get('aladin_N1').listingId)) === 'aladin_N1', '② 새 판매중 N1 — 목록·listingId 찾기에 들어감');
  ok(Y._M.big.fresh.get('aladin_A2').status === '판매완료', '② 팔린 책 내림 작은 켜(fresh)도 새 값(판매완료)');
  ok((W.reads.prd_listings || 0) <= 4, '② 상품 읽기 = 바뀐 3줄 + 빈 조회 1(통째 43 아님)', W.reads);
  let c1 = Y.changes(seq1); const ks = Object.fromEntries(c1.rows.filter((x) => x.c === 'prd_listings').map((x) => [x.id, x.k]));
  ok(ks.aladin_A1 === 'up' && ks.aladin_A2 === 'out' && ks.aladin_N1 === 'in' && !c1.gap, '⑨ changes(after) — A1 up · A2 out · N1 in · gap 없음', c1.rows);
  seq1 = c1.seq;
  /* ② 되돌림 — A2 다시 판매중 · 같은 줄을 두 번 봐도(겹침 5분) 결과 같음 */
  stamp('prd_listings', 'aladin_A2', { status: '판매중', qty: 1, active: true });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.list.some((l) => l.id === 'aladin_A2') && Y._M.big.fresh.get('aladin_A2').status === '판매중', '② 되돌림 — A2가 다시 판매중(목록·작은 켜 모두 · 묵은 판매완료가 덮지 않음)');
  c1 = Y.changes(seq1); ok(c1.rows.some((x) => x.id === 'aladin_A2' && x.k === 'in') && !c1.rows.some((x) => x.id === 'aladin_A1'), '⑨ 되돌림 = in · 값이 그대로인 A1은 겹침으로 다시 봐도 바뀜 줄 없음', c1.rows); seq1 = c1.seq;
  /* ② markAt만 바뀜(수집기 MW — 보이기용 칸) */
  Object.assign(store.prd_listings.aladin_A3, { title: '고친 제목', markAt: W.isoT() });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.list.find((l) => l.id === 'aladin_A3').title === '고친 제목', '② markAt만 찍힌 A3 — 새 제목');
  /* ③ 지운 줄·손으로 고친 값(시각 없음) — 바뀐 줄로는 못 봄 → 6시간 통째 때 맞춤 */
  delete store.prd_listings.aladin_F0; store.prd_listings.aladin_F1.price = 1234; /* 콘솔에서 지움·고침 — uploadedAt 없음 */
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.list.some((l) => l.id === 'aladin_F0') && D.list.find((l) => l.id === 'aladin_F1').price === 3000, '③ 시각 없이 지우거나 고친 줄은 바뀐 줄 읽기로는 아직 못 봄(예상된 한계 — 보내기 직전 재확인·팔린 책 내림 한 권 읽기가 지킴)');
  const bigAt0 = Y._M.bigAt; W.reset(); W.adv(6 * 3600e3); D = await Y.data();
  ok(Y._M.bigAt > bigAt0 && Y._M.big.last.kind === 'full' && Y._M.big.last.why === '때 됨', '③ 6시간 뒤 — 통째로 다시 읽음', Y._M.big.last);
  ok(!D.list.some((l) => l.id === 'aladin_F0') && D.list.find((l) => l.id === 'aladin_F1').price === 1234, '③ 통째 때 지운 F0는 빠지고 손으로 고친 F1 값도 맞춤');
  c1 = Y.changes(seq1); ok(c1.rows.some((x) => x.c === '*' && x.k === 'full'), '⑨ 통째 다시 읽음도 바뀐 것 목록에 표식(받는 쪽은 통째 자료로 다시 맞춤)'); seq1 = c1.seq;
  /* ⑤ 주문 — 새 주문 · 취소 · 14일 창 */
  W.put('crm_orders', 'o_new', { kind: 'sale', platform: 'aladin', orderNo: 'X2', orderedAt: W.isoT(), uploadedAt: W.isoT(), items: [{ listingKey: 'aladin_A1', lineStatus: 'normal' }] });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.held.get('aladin_A1') && D.heldAt.get('aladin_A1'), '⑤ 새 주문 — A1 묶임(heldAt도)', [...D.held]);
  ok((W.reads.crm_orders || 0) <= 2, '⑤ 주문 읽기 = 바뀐 줄만(14일 창 통째 아님)', W.reads);
  stamp('crm_orders', 'o_new', { items: [{ listingKey: 'aladin_A1', lineStatus: 'cancel' }] });
  W.reset(); W.adv(11 * 60e3); D = await Y.data(); ok(!D.held.get('aladin_A1'), '⑤ 취소(lineStatus) — A1 풀림', [...D.held]);
  W.put('crm_orders', 'o_edge', { kind: 'sale', platform: 'aladin', orderNo: 'X3', orderedAt: new Date(W.now() - 14 * 864e5 + 15 * 60e3).toISOString(), uploadedAt: W.isoT(), items: [{ listingKey: 'aladin_A2', lineStatus: 'normal' }] });
  W.adv(11 * 60e3); D = await Y.data(); ok(D.held.get('aladin_A2'), '⑤ 14일 끝자락 주문 — 아직 묶음');
  W.adv(11 * 60e3); D = await Y.data(); ok(!D.held.get('aladin_A2') && !Y._M.big.ord.has('o_edge'), '⑤ 14일이 지나면 기억에서 다듬어 뺌(읽기 없이)');
  ok(Y.changes(seq1).rows.some((x) => x.c === 'crm_orders' && x.id === 'o_edge' && x.k === 'del'), '⑨ 다듬어 뺀 주문 = del 줄'); seq1 = Y.changes(0).seq;
  /* ⑥ 등록 기록 — createdAt만 있는 새 줄 · bump */
  W.put('reg_items', 'r2', { createdAt: W.isoT(), y24Reg: { st: 'wait' } }); W.put('reg_items', 'r3', { createdAt: W.isoT(), bump: true });
  W.adv(11 * 60e3); D = await Y.data(); ok(D.reg.has('r2') && !D.reg.has('r3'), '⑥ createdAt만 있는 새 등록 줄도 읽음 · bump는 뺌', [...D.reg.keys()]);
  stamp('reg_items', 'r2', { bump: true }); W.adv(11 * 60e3); D = await Y.data(); ok(!D.reg.has('r2'), '⑥ 나중에 bump가 되면 뺌');
  /* 예스24 목록 */
  W.put('y24_listings', '500000002', { goodsNo: '500000002', isbn13: '9788900000028', grade: '중', price: 4000, uploadedAt: W.isoT() }); stamp('y24_listings', '500000001', { masterNo: 'M9' });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(D.y24.length === 2 && D.y24.find((x) => x.goodsNo === '500000001').masterNo === 'M9' && (W.reads.y24_listings || 0) <= 2, '예스24 공개 목록 — 새 매물·바뀐 허브 번호만 읽어 덧댐', { y24: D.y24, r: W.reads });
  /* ⑦ 관리자 원문 — 맨 위 한 줄 보기 */
  W.reset(); W.adv(11 * 60e3); await Y.data(); ok(Y._M.big.admVia === 'order' && (W.reads.crm_y24_raw || 0) === 1, '⑦ 맨 위 한 줄이 같으면 1읽기로 끝', W.reads);
  W.put('crm_y24_raw', 'raw2', { sig: RAW_SIG, at: W.isoT(), body: JSON.stringify({ PRODUCT_LIST: [{ GOODS_NO: '500000003', EAN: '9788900000035' }] }) });
  W.reset(); W.adv(11 * 60e3); D = await Y.data(); ok((W.reads.crm_y24_raw || 0) >= 2 && D.adm.has('500000003'), '⑦ 새 관리자 원문 → 다시 읽어 새 매물 들어감', { r: W.reads, adm: [...D.adm.keys()] });
  /* ⑧ SKU 짝 — lease만 바뀌면 그대로 · 새 코드 받으면 다시 */
  store.app_settings.sku_seq.lease = { y: 2 }; W.reset(); W.adv(11 * 60e3); await Y.data(); ok((W.reads.app_settings || 0) === 5, '⑧ lease만 바뀜 → sku_map 다시 안 읽음', W.reads);
  Object.assign(store.app_settings.sku_seq, { n: 11, at: 'a1' }); store.app_settings.sku_map_0.m.aladin_A2 = { c: ['ab002'] };
  W.reset(); W.adv(11 * 60e3); D = await Y.data(); ok((W.reads.app_settings || 0) === 6 && D.sku.has('aladin_A2'), '⑧ 새 SKU 코드(n·at 바뀜) → sku_map 다시 읽음', W.reads);
  /* ④ 실패 — 큰 켜 묵힘 + 45분마다 통째 */
  W.adv(11 * 60e3); await Y.data(true); const bA = Y._M.bigAt; W.fail((c, f) => c === 'crm_orders' && f === 'uploadedAt'); stamp('prd_listings', 'aladin_A1', { price: 8800 });
  W.reset(); W.adv(11 * 60e3); D = await Y.data();
  ok(Y._M.bigAt === bA && Y._M.big.dErr && D.list.find((l) => l.id === 'aladin_A1').price === 8800, '④ 주문 바뀐 줄 읽기 실패 → 통째로 바로 읽지 않음(10분마다 통째면 예전보다 비쌈) · 실패 앞의 상품 덧댐은 남음', { dErr: Y._M.big.dErr });
  W.adv(11 * 60e3); await Y.data(); ok(Y._M.bigAt === bA, '④ 실패 이어져도 45분 전엔 묵힘');
  W.adv(25 * 60e3); await Y.data(); ok(Y._M.bigAt > bA && Y._M.big.last.why === '바뀐 줄 실패', '④ 마지막 통째 뒤 45분 → 통째로(예전과 같은 간격) · data(true)는 부를 때 바로 통째', Y._M.big.last);
  W.fail(null); W.adv(11 * 60e3); await Y.data(); ok(!Y._M.big.dErr && Y._M.big.last.kind === 'delta', '④ 실패가 풀리면 다시 바뀐 줄만');
  /* ④ 넘침 — 수집기 몰아 쓰기 3000줄+ → 바로 통째 */
  for (let i = 0; i < 3000; i++) W.put('prd_listings', 'aladin_B' + i, { listingId: 20000 + i, title: '몰아 ' + i, status: '판매중', qty: 1, uploadedAt: W.isoT() });
  const bB = Y._M.bigAt; W.adv(11 * 60e3); D = await Y.data();
  ok(Y._M.bigAt > bB && Y._M.big.last.why === '바뀐 줄 넘침' && D.list.length > 3000, '④ 바뀐 줄이 상한(3000)에 닿으면 바로 통째로', Y._M.big.last);
  /* ⑨ 넘쳐 잃음(gap) — 바뀜 줄 기억은 3000줄까지 */
  const sOld = Y.changes(0).seq; for (let i = 0; i < 2000; i++) store.prd_listings['aladin_B' + i].price = 100 + i, store.prd_listings['aladin_B' + i].uploadedAt = W.isoT();
  W.adv(11 * 60e3); await Y.data(); for (let i = 0; i < 2000; i++) store.prd_listings['aladin_B' + i].price = 9000 + i, store.prd_listings['aladin_B' + i].uploadedAt = W.isoT();
  W.adv(11 * 60e3); await Y.data(); const cg = Y.changes(sOld); ok(cg.gap && Y._M.chg.length === 3000 && Y.changes(cg.seq).rows.length === 0, '⑨ 기억 3000줄을 넘어 잃으면 gap=true(받는 쪽은 통째 자료로 다시 맞춤) · 최신 seq 뒤는 빈 목록', { gap: cg.gap, n: Y._M.chg.length });
  /* ⑪ 읽기 셈 — app_settings/y24_reg autoSt._RD */
  const RD = ((store.app_settings.y24_reg || {}).autoSt || {})._RD; ok(RD && RD.sum && RD.sum.full > 0 && RD.sum.delta > 0 && RD.runs && RD.fullH === 6, '⑪ 읽기 셈을 autoSt._RD에 남김(통째·바뀐 줄 나눠서 · 1시간마다)', RD && { sum: RD.sum, fullH: RD.fullH });
  /* ⑩ fullH 설정 — 2시간마다 통째 */
  { const W2 = world(40, { read: { fullH: 2 } }); await W2.Y.data(); const b0 = W2.Y._M.bigAt; W2.adv(110 * 60e3); await W2.Y.data(); ok(W2.Y._M.bigAt === b0, '⑩ fullH=2 — 1시간 50분엔 아직 바뀐 줄만');
    W2.adv(11 * 60e3); await W2.Y.data(); ok(W2.Y._M.bigAt > b0 && W2.Y._M.big.fullMs === 2 * 3600e3, '⑩ fullH=2 — 2시간 지나면 통째'); }
  /* ⑫ 하루 흉내 — 판매중 2000권 · 14일 주문 300건 · 한 시간에 상품 10줄·주문 3줄 바뀜 · 10분마다 data() */
  { const W3 = world(2000); for (let i = 0; i < 300; i++) W3.put('crm_orders', 'h' + i, { kind: 'sale', platform: 'aladin', orderNo: 'H' + i, orderedAt: new Date(W3.now() - (i % 13) * 864e5).toISOString(), items: [{ listingKey: 'aladin_F' + (i % 2000), lineStatus: 'normal' }] });
    await W3.Y.data(); W3.reset(); const per = { full: 0, n: 0 }; let fullReads = 0;
    for (let k = 0; k < 144; k++) { W3.adv(10 * 60e3 + 1);
      for (let j = 0; j < 2; j++) { const id = 'aladin_F' + ((k * 7 + j) % 2000); Object.assign(W3.store.prd_listings[id], { price: 3000 + k, uploadedAt: W3.isoT() }); }
      if (k % 2) Object.assign(W3.store.crm_orders['h' + (k % 300)], { uploadedAt: W3.isoT(), items: [{ listingKey: 'aladin_F1', lineStatus: 'normal' }] });
      const before = big(W3.reads); const b0 = W3.Y._M.bigAt; await W3.Y.data(); if (W3.Y._M.bigAt !== b0) { per.full++; fullReads += big(W3.reads) - before; } per.n++; }
    const newAll = big(W3.reads) + (W3.reads.app_settings || 0) + (W3.reads.crm_y24_raw || 0);
    const bigOne = 2043 + 2 + 2 + 301; const oldAll = 32 * bigOne + 144 * (301 + 4 + 15) + 32 * 4; /* 예전: 45분마다 통째(하루 32번) + 10분마다 주문 14일 창 통째·설정 */
    console.log('    하루 흉내 — 새 방식 읽기', newAll, '(통째', per.full, '번 =', fullReads, ') · 예전 방식 셈', oldAll, '→', Math.round(100 * newAll / oldAll) + '%');
    ok(per.full === 4 && newAll * 5 < oldAll, '⑫ 하루 = 통째 4번(6시간마다) + 바뀐 줄 140번 · 읽기가 예전의 5분의 1 아래', { newAll, oldAll, full: per.full });
    const okPrice = W3.Y._M.big.idx.get('aladin_F' + ((143 * 7) % 2000)).price === 3000 + 143; ok(okPrice, '⑫ 마지막에 바뀐 값도 들어와 있음'); }
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
