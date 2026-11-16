// tY24READ_1116 — (정밀 점검 11/14 ④·⑦ '위험 3 읽기 폭증') cloud/y24auto.js data() 읽기 줄이기 + 곁다리 고침
//   ① 큰 자료(판매중 상품·예스24 목록·관리자 원문·등록)는 45분마다 · 작은 것(설정·주문)만 10분마다 → 10분 사이 차례의 상품 읽기 0
//   ② 보내기 직전 재확인: 묵힌 사이 알라딘에서 팔린 책은 빼고 다음 책을 고름 · 장부에 안 적음
//   ③ 관리자 원문 읽기는 120문서까지(limit)
//   ④ 번외가 '되풀이'로 거절한 줄 → 장부가 '올리는 중'에 멈추지 않고 sent(확인 필요)로 · 거절 알림(rejAck) 돌려줌
//   ⑤ 멈춘 화면 원문이 3000자를 넘어도 장부에 남음(잘라서) · ⑥ SheetJS = cloud/package.json 의존(cdnjs 없음)
// 실행: node src/tests/tY24READ_1116.js · 지어낸 자료 · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
const texts = { 'src/app.html': rd('src/app.html'), 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
function world(extra) { let T = Date.parse('2026-11-16T10:00:00Z'); const now = () => T; const F = makeDb(); const { store } = F; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  const reads = {}; const wrap = (o, c) => new Proxy(o, { get(t, k) { const v = t[k]; if (typeof v !== 'function') return v; if (k === 'get') return async (...a) => { const r = await v.apply(t, a); reads[c] = (reads[c] || 0) + (r && r.size !== undefined ? r.size : 1); return r; }; return (...a) => { const r = v.apply(t, a); return r && typeof r === 'object' && typeof r.then !== 'function' ? wrap(r, c) : r; }; } });
  const C = (c) => wrap(F.C(c), c);
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} }); put('app_settings', 'sku_seq', { mapN: 0 });
  put('app_settings', 'sku_map_0', { m: { aladin_A1: { c: ['ab001'] }, aladin_A2: { c: ['ab002'] }, aladin_A3: { c: ['ab003'] } } });
  const L = (id, isbn, price, x) => put('prd_listings', 'aladin_' + id, { listingId: 9000 + +id.slice(1), usedCode: id, title: '시험 책 ' + id, isbn13: isbn, grade: '상', price, priceList: 15000, qty: 1, sku: 'ABC_' + id, active: true, status: '판매중', ...(x || {}) });
  L('A1', '9788900000011', 9000); L('A2', '9788900000028', 5000); L('A3', '9788900000035', 7000);
  for (const i of ['9788900000011', '9788900000028', '9788900000035']) put('y24_mkt', i, { none: true, at: '2026-11-16T09:00:00Z' });
  for (let i = 0; i < 40; i++) put('prd_listings', 'aladin_F' + i, { listingId: 5000 + i, usedCode: 'F' + i, title: '채움 ' + i, isbn13: '97889000' + String(100 + i).padStart(5, '0'), grade: '중', price: 3000, qty: 1, sku: 'ABC_F' + i, active: true, status: '판매중', priceList: 9000 }); /* 읽기 수가 보이게 */
  const Y = makeY24Auto({ db: F.db, C, FV: F.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX, ...(extra || {}) });
  return { Y, F, store, put, reads, now, adv: (ms) => { T += ms; }, led: () => store.app_settings.y24_reg || {}, reset: () => { for (const k of Object.keys(reads)) delete reads[k]; } }; }
const G = (x) => ({ st: { login: 'ok', hold: false, en: true, wait: [], cur: null }, res: {}, rej: [], ...(x || {}) });
(async () => {
  /* ① 큰 자료는 45분마다 */
  { const W = world(); const { Y } = W;
    let y = await Y.step('HOME', G()); const r1 = { ...W.reads };
    ok((r1.prd_listings || 0) >= 43 && y.jobs.length === 1 && y.jobs[0].rows.length === 1, '① 첫 차례 — 큰 자료를 읽고(판매중 상품 43권 전부) 1건 맡김', { r1, jobs: y.jobs.length });
    ok((r1.prd_listings || 0) <= 44, '① 첫 차례 상품 읽기 = 전체 한 번 + 재확인 한 권뿐(전체 43 + 1)', r1.prd_listings);
    W.reset(); W.adv(11 * 60e3); y = await Y.step('HOME', G({ st: { login: 'ok', hold: false, en: true, wait: [{ id: y.jobs[0].id }], cur: null } }));
    ok(!W.reads.prd_listings && !W.reads.y24_listings && !W.reads.reg_items && !W.reads.crm_y24_raw, '① 11분 뒤 차례 — 상품·예스24 목록·등록·관리자 원문 읽기 0(작은 자료만)', W.reads);
    ok((W.reads.app_settings || 0) <= 5, '① 작은 자료 = 설정 문서 몇 개뿐', W.reads);
    W.reset(); W.adv(40 * 60e3); await Y.data(); ok((W.reads.prd_listings || 0) >= 43, '① 45분이 지나면 큰 자료를 다시 읽음(data)', W.reads); }
  /* ② 묵힌 사이 팔린 책 — 보내기 직전 재확인이 뺌 */
  { const W = world(); const { Y } = W;
    await Y.data(); ok(Y._M.bigAt > 0 && W.reads.prd_listings >= 43, '② 큰 자료를 먼저 읽어 둠(묵히기 시작)', W.reads); let y;
    W.store.prd_listings.aladin_A2.status = '판매완료'; W.store.prd_listings.aladin_A2.qty = 0; /* 가장 싼 A2가 알라딘에서 팔림 — 묵힌 자료엔 아직 판매중 */
    W.adv(11 * 60e3); W.reset(); y = await Y.step('HOME', G());
    ok(y.jobs.length === 1 && y.jobs[0].rows[0].lid !== 'aladin_A2' && !(W.led().r || {}).aladin_A2, '② 묵힌 사이 팔린 책(A2)은 빼고 다음 책을 맡김 · 장부에도 안 적음', { jobs: y.jobs.map((j) => j.rows.map((r) => r.lid)), led: Object.keys(W.led().r || {}) });
    ok((W.reads.prd_listings || 0) <= 4 && y.plan && y.plan.drop >= 1, '② 재확인은 한 권씩 읽음(전체 다시 읽지 않음) · 뺀 수를 plan.drop에 적음', { reads: W.reads, plan: y.plan }); }
  /* ② 값이 바뀐 책도 뺌 */
  { const W = world(); const { Y } = W; await Y.data();
    W.store.prd_listings.aladin_A2.price = 5600; W.adv(11 * 60e3); const y = await Y.step('HOME', G());
    ok(y.jobs.length === 1 && y.jobs[0].rows[0].lid !== 'aladin_A2', '② 값이 바뀐 책도 이번엔 뺌(다음 차례 새 값으로 다시 셈)', y.jobs.map((j) => j.rows.map((r) => r.lid))); }
  /* ③ 관리자 원문 limit 120 */
  { const W = world(); const { Y } = W; for (let i = 0; i < 200; i++) W.put('crm_y24_raw', 'adm' + String(i).padStart(3, '0'), { sig: 'POST /api/Product/ProductList', at: '2026-11-16T0' + (i % 9) + ':00:00Z', body: JSON.stringify({ PRODUCT_LIST: [] }) });
    await Y.step('HOME', G()); ok(W.reads.crm_y24_raw === 120, '③ 관리자 원문은 120문서까지만 읽음(200개 중)', W.reads.crm_y24_raw); }
  /* ④ 되풀이 거절 */
  { const W = world(); const { Y } = W; let y = await Y.step('HOME', G()); const j = y.jobs[0]; const lid = j.rows[0].lid;
    W.adv(61e3); y = await Y.step('HOME', G({ rej: [{ id: j.id, err: `같은 상품을 이미 올림(${lid}) — 되풀이 0`, rows: [lid] }] }));
    const e = W.led().r[lid]; ok(e && e.st === 'sent' && e.unsure === 1, '④ 되풀이로 거절된 줄 → 장부 sent(확인 필요) — 올리는 중에 멈추지 않음', e);
    ok((y.rejAck || []).includes(j.id) && !y.jobs.some((x) => x.id === j.id), '④ 거절 알림(rejAck)을 돌려줌 · 같은 묶음을 다시 보내지 않음', { rejAck: y.rejAck, jobs: y.jobs.length });
    W.adv(61e3); y = await Y.step('HOME', G()); ok(!y.jobs.some((x) => x.id === j.id), '④ 다음 분에도 같은 묶음을 또 안 보냄', y.jobs.map((x) => x.id)); }
  { const W = world(); const { Y } = W; let y = await Y.step('HOME', G()); const j = y.jobs[0]; const lid = j.rows[0].lid;
    W.adv(61e3); y = await Y.step('HOME', G({ rej: [{ id: j.id, err: `같은 상품·SKU가 이미 맡김 줄에 있음(${lid}) — 되풀이 0`, rows: [lid] }] }));
    ok(W.led().r[lid].st === 'auto' && (y.rejAck || []).includes(j.id), '④ "맡김 줄에 있음" 되풀이는 장부 그대로(이미 번외가 가진 일) · 알림만 받음', { e: W.led().r[lid], rejAck: y.rejAck }); }
  /* ⑤ 멈춘 화면 원문 3000자 넘음 */
  { const W = world(); const { Y } = W; let y = await Y.step('HOME', G()); const j = y.jobs[0]; const lid = j.rows[0].lid;
    W.adv(61e3); y = await Y.step('HOME', G({ res: { [j.id]: { state: 'fail', msg: '화면 모양이 다름', rows: [lid], raw: { txt: '가'.repeat(5000), btn: ['업로드'] } } } }));
    const last = (W.led().auto || {}).last; ok(last && last.raw && last.raw.cut === 1 && last.raw.len > 3000 && last.raw.txt.length <= 2900, '⑤ 3000자를 넘는 멈춘 화면 원문도 잘라서 장부에 남음(예전엔 null)', last);
    W.adv(61e3); const W2 = world(); const y2 = await W2.Y.step('HOME', G()); const j2 = y2.jobs[0]; W2.adv(61e3); await W2.Y.step('HOME', G({ res: { [j2.id]: { state: 'fail', msg: '모양이 다름', rows: [j2.rows[0].lid], raw: { txt: '짧은 글', btn: ['a'] } } } }));
    const l2 = (W2.led().auto || {}).last; ok(l2 && l2.raw && l2.raw.txt === '짧은 글' && l2.raw.btn.length === 1, '⑤ 짧은 원문은 그대로', l2); }
  /* ⑥ SheetJS = 패키지 의존 */
  { const pk = JSON.parse(rd('cloud/package.json')); ok(pk.dependencies && pk.dependencies.xlsx === '0.18.5', '⑥ cloud/package.json 의존에 xlsx 0.18.5(고정)', pk.dependencies);
    const lk = JSON.parse(rd('cloud/package-lock.json')); ok(lk.packages && lk.packages['node_modules/xlsx'] && lk.packages['node_modules/xlsx'].version === '0.18.5', '⑥ package-lock에 xlsx 0.18.5', lk.packages && lk.packages['node_modules/xlsx'] && lk.packages['node_modules/xlsx'].version);
    const src = rd('cloud/y24auto.js'); ok(!/cdnjs|XLSX_URL|new Function\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').split('\n').filter((l) => !/예전엔/.test(l)).join('\n')) || !/XLSX_URL/.test(src), '⑥ 실행 때 cdnjs에서 받아 new Function으로 돌리는 길 없음', (src.match(/cdnjs|XLSX_URL/g) || [])); }
  console.log(bad ? `\n실패 ${bad}` : '\n전부 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 예외', e && e.stack || e); process.exit(1); });
