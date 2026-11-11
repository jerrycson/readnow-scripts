// tSHOP1111 — (11/11 shop1) 🛍 우리숍 booksqueen.com 첫 판
//   ① 순수 셈: 클라우드 창구(cloud/shop.js) 공개 요약·목록·주문 검사 · 손님 화면(shop/shop-core.js) 장바구니·주문서 · 웹앱 ◆shop 덩어리(설정·단계·장부 어댑터·출고 기록) · 통합 장부 내릴 일
//   ② 클라우드 창구(가짜 Firestore + 진짜 http): 목록에 내부 값 없음 · 주문 → shop_orders·주문 중 · 같은 책 두 주문 0 · 조회 열쇠 · 손님 취소 · 닫힌 가게 · CORS
//   ③ 화면(RN_PORT · pw/ 안 harness.js 옆): 손님 화면(휴대폰 390px)으로 둘러보기 → 담기 → 주문서 빈 칸 알림 → 주문 → 입금 안내 · 웹앱 🛍 우리숍 주문(입금 확인 두 번 → 출고로 보내기 두 번 → 현금 기록 · 출고 칩) · 브라우저 창 0
// 실행: node src/tests/tSHOP1111.js · 화면까지: RN_PORT=<웹앱·shop/을 내는 포트> node tSHOP1111.js (pw/ 안) · 화면 사진은 RN_SHOT 폴더 · 시험 자료에 실제 손님 정보 없음(손님A · 010-0000-0000)
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOTS = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..'), process.env.RN_REPO || ''].filter(Boolean);
const find = (rel) => ROOTS.map((r) => path.join(r, rel)).find((x) => fs.existsSync(x));
const SH = require(find('cloud/shop.js')); const BQ = require(find('shop/shop-core.js'));
const APP = process.env.RN_APP || find('src/app.html') || find('app.html'); const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + cut('/* ◆shop 시작', '/* ◆shop 끝 */') + '\nreturn { ledBuild, mcPlan, chList, bqCfgOf, bqOpenNeed, bqStage, bqDueOver, bqLedOrds, bqCashDoc, BQ_DEF };')();
const PH = '01000000000';
(async () => {
console.log('① 순수 셈');
const L0 = (o) => ({ status: '판매중', active: true, qty: 1, price: 8000, grade: '상', sku: 'A01BC123PK', title: '시험 책', isbn13: '9788900000001', bookId: 'bk1', registeredAt: '2026-11-10T01:00:00Z', photos: [{ stored: 'p/1.jpg', thumb: 'p/1_t.jpg' }], ...o });
const B0 = { author: '지은이A', publisher: '출판사A', pubDate: '2020-05-01', categories: [{ path: '국내도서>소설/시/희곡>한국소설' }], images: { front: { src: 'https://image.aladin.co.kr/x.jpg' } }, priceList: 15000 };
{ const it = SH.pubItem('aladin_U1', L0(), B0); ok(it && it.t === '시험 책' && it.a === '지은이A' && it.c === '소설/시/희곡' && it.p === 8000 && it.lp === 15000 && it.pd === '2020-05' && it.g === '상' && /firebasestorage/.test(it.ph[0]) && it.im === 'https://image.aladin.co.kr/x.jpg', '공개 요약: 제목·지은이·분야·값·정가·출판일·등급·사진');
  ok(!('sku' in it) && !JSON.stringify(it).includes('A01BC123PK') && !('bookId' in it), 'SKU(서가·매입처)·도서 번호는 공개 요약에 없음');
  ok(!SH.pubItem('x', L0({ status: '판매완료' }), B0) && !SH.pubItem('x', L0({ sku: 'DUPES 1' }), B0) && !SH.pubItem('x', L0({ adult: true }), B0) && !SH.pubItem('x', L0({ price: 0 }), B0) && !SH.pubItem('x', L0({ qty: 0 }), B0) && !SH.pubItem('x', L0({ active: false }), B0) && !SH.pubItem('x', L0(), { ...B0, adult: true }), '판매중 아님·미끼(DUPES)·19금·값 없음·수량 0·내린 상품은 빠짐'); }
{ const A = [{ id: 'a', t: '어린 왕자', a: '생텍쥐페리', pb: '문학', p: 5000, at: '2026-11-01', isbn: '9788900000001', g: '상', c: '소설' }, { id: 'b', t: '데미안', a: '헤세', pb: '민음', p: 3000, at: '2026-11-05', g: '중', c: '소설' }, { id: 'c', t: '코스모스', a: '세이건', pb: '사이언스', p: 9000, at: '2026-10-01', g: '상', c: '과학' }];
  ok(SH.listItems(A, { q: '어린왕자' }).items.map((x) => x.id).join() === 'a' && SH.listItems(A, { q: '헤세' }).total === 1 && SH.listItems(A, { q: '9788900000001' }).items[0].id === 'a', '찾기: 띄어쓰기 무시 · 지은이 · ISBN');
  ok(SH.listItems(A, {}).items.map((x) => x.id).join() === 'b,a,c' && SH.listItems(A, { s: 'low' }).items[0].id === 'b' && SH.listItems(A, { s: 'high' }).items[0].id === 'c' && SH.listItems(A, { c: '과학' }).total === 1 && SH.listItems(A, { g: '상' }).total === 2, '정렬(새로·낮은 값·높은 값) · 분야 · 등급');
  ok(SH.listItems(A, {}, new Set(['a'])).items.find((x) => x.id === 'a').st === 'o', "주문 중인 책은 '주문 중'(o)으로");
  const many = Array.from({ length: 30 }, (_, i) => ({ id: 'm' + i, t: '책' + i, p: 1000, at: '2026-11-' + String(10 + (i % 9)).padStart(2, '0') })); const p0 = SH.listItems(many, {}), p1 = SH.listItems(many, { p: 1 }); ok(p0.items.length === 24 && p0.more && p1.items.length === 6 && !p1.more, '24권씩 쪽 나눔'); }
{ const good = { items: ['a'], buyer: { name: '손님A', phone: '010-0000-0000' }, rcv: { zip: '06000', addr1: '서울 어딘가 1길 1', addr2: '' }, agree: { privacy: true, terms: true } };
  const c = SH.checkOrder(good); ok(c.ok && c.v.rcv.name === '손님A' && c.v.rcv.phone === PH && c.v.depositor === '손님A', '주문 검사: 받는 분 비면 주문하신 분 · 입금자 비면 주문하신 분');
  const w = (o) => SH.checkOrder({ ...good, ...o }).err || ''; ok(/담은 책/.test(w({ items: [] })) && /휴대폰/.test(w({ buyer: { name: '손님A', phone: '02-123' } })) && /우편번호/.test(w({ rcv: { zip: '1', addr1: '서울 어딘가 1길 1' } })) && /동의/.test(w({ agree: { privacy: true } })) && /잘못된/.test(w({ hp: 'bot' })) && /20권/.test(w({ items: Array.from({ length: 21 }, (_, i) => 'x' + i) })), '주문 검사: 빈 장바구니·전화·우편번호·동의·로봇 칸·20권 넘음');
  ok(SH.shipFeeOf(10000, { shipFee: 3500, freeOver: 0 }) === 3500 && SH.shipFeeOf(30000, { shipFee: 3500, freeOver: 30000 }) === 0, '배송비 · 무료 배송 금액');
  ok(SH.maskName('손님가나') === '손**나' && SH.maskName('손님') === '손*' && /^BQ\d{8}-[A-Z0-9]{5}$/.test(SH.orderNo(Date.parse('2026-11-11T00:00:00Z'))), '이름 가리기 · 주문 번호 꼴');
  const pc = SH.pubCfg({ open: 0, bank: { name: '은행', acct: '1', holder: '가게' } }); const po = SH.pubCfg({ open: 1, bank: { name: '은행', acct: '1', holder: '가게' }, internal: 'x', by: 'admin@x' }); ok(pc.pay.how === 'wait' && po.pay.how === 'bank' && po.pay.acct === '1' && !('internal' in po) && !JSON.stringify(po).includes('admin@x') && po.pg === 0, '공개 설정: 닫힌 가게는 계좌 안 보임 · 내부 칸 안 나감 · PG 자리만'); }
{ const c = []; const r1 = BQ.cartAdd(c, { id: 'a', t: 'A', p: 5000 }); const r2 = BQ.cartAdd(r1.cart, { id: 'a', t: 'A', p: 5000 }); ok(r1.cart.length === 1 && r2.why === '이미 담은 책' && BQ.cartDel(r1.cart, 'a').length === 0, '장바구니: 한 권 상품은 한 번만 · 빼기');
  const s = BQ.cartSum([{ p: 5000 }, { p: 3000 }], { shipFee: 3500, freeOver: 0 }); ok(s.sum === 8000 && s.fee === 3500 && s.total === 11500 && BQ.cartSum([], { shipFee: 3500 }).total === 0, '합계 · 빈 장바구니엔 배송비 없음');
  const E = BQ.formCheck({ name: '', phone: '123', same: true, zip: '', addr1: '', agreeP: false, agreeT: false }); ok(['name', 'phone', 'zip', 'addr1', 'agreeP', 'agreeT'].every((k) => E[k]) && !Object.keys(BQ.formCheck({ name: '손님A', phone: '010-0000-0000', same: true, zip: '06000', addr1: '서울 어딘가 1길', agreeP: 1, agreeT: 1 })).length, '주문서: 빈 칸마다 알림 · 다 채우면 통과');
  const ob = BQ.orderBody({ name: '손님A', phone: '010-0000-0000', same: true, zip: '06000', addr1: '서울', agreeP: 1, agreeT: 1 }, [{ id: 'a' }]); ok(ob.items[0] === 'a' && ob.rcv.phone === PH && ob.agree.privacy && SH.checkOrder({ ...ob, rcv: { ...ob.rcv, addr1: '서울 어딘가 1길' } }).ok, '주문서 → 서버 검사와 같은 꼴');
  const R = BQ.route('#/done/BQ20261111-ABCDE?t=ff&new=1'); ok(R.name === 'done' && R.arg === 'BQ20261111-ABCDE' && R.q.t === 'ff' && BQ.route('').name === 'home' && BQ.phoneFmt('01000000000') === '010-0000-0000', '화면 주소 풀기 · 전화 꼴'); }
{ const c = F.bqCfgOf({ shipFee: 'x', payDays: 99, open: 'yes' }); ok(c.shipFee === 3500 && c.payDays === 7 && c.open === 1, '웹앱 설정 울타리');
  ok(F.bqOpenNeed({}).length === 7 && F.bqOpenNeed({ bank: { name: 'a', acct: 'b', holder: 'c' }, biz: { name: 'a', ceo: 'b', no: 'c', mo: 'd', addr: 'e', tel: 'f' } }).length === 0, '문 열기 전 꼭: 사업자 표시 6칸(전자상거래법 제10조) + 계좌');
  ok(F.bqStage({ st: 'paid' }, null) === 'paid' && F.bqStage({ st: 'ship', cashId: 'x' }, { shippedAt: null }) === 'ship' && F.bqStage({ st: 'ship' }, { shippedAt: '2026-11-12' }) === 'sent' && F.bqStage({ st: 'cancel' }, { shippedAt: 'x' }) === 'cancel', '단계: 출고 기록이 출고함이면 보냄');
  ok(F.bqDueOver({ st: 'new', due: '2026-11-01T00:00:00Z' }, Date.parse('2026-11-02')) && !F.bqDueOver({ st: 'paid', due: '2026-11-01T00:00:00Z' }, Date.parse('2026-11-02')), '입금 기한 지남(입금 기다림만)');
  const O = [{ no: 'BQ1', at: '2026-11-10T00:00:00Z', st: 'new', sum: 8000, items: [{ lid: 'aladin_U1', sku: 'S1', p: 8000 }] }, { no: 'BQ2', at: '2026-11-10T00:00:00Z', st: 'ship', cashId: 'cash_shop_BQ2', items: [{ lid: 'aladin_U2' }] }, { no: 'BQ3', at: '2026-11-10T00:00:00Z', st: 'cancel', items: [{ lid: 'aladin_U3' }] }];
  const LO = F.bqLedOrds(O, '2026-10-01'); ok(LO.length === 2 && LO[0].ch === 'shop' && LO[0].lines[0].lid === 'aladin_U1' && LO[1].cancel && !LO[1].lines.length, '장부 어댑터: 출고로 보낸 주문은 현금 기록이 셈(두 번 0) · 취소는 줄 없음');
  const V = F.ledBuild({ now: '2026-11-11T03:00:00Z', days: 30, al: [{ id: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, skus: ['S1'] }], y24: [{ no: '9001', title: '시험 책', isbn: '9788900000001', grade: '상', price: 9000, stock: 1, live: true, self: 'S1' }], ord: LO });
  const r = V.rows.find((x) => x.key === 'S1'); ok(r && r.mc && r.mc.acts.some((a) => a.ch === 'aladin' && a.k === 'down') && r.mc.acts.some((a) => a.ch === 'yes24' && a.k === 'down'), '🧾 처리할 일: 우리숍 주문 하나 → 알라딘·예스24 내릴 일');
  const cd = F.bqCashDoc({ no: 'BQ20261111-ABCDE', at: '2026-11-11T01:00:00Z', depositor: '손님A', shipFee: 3500, buyer: { name: '손님A', phone: PH }, rcv: { name: '손님A', phone: PH, zip: '06000', addr1: '서울', addr2: '1층', memo: '문 앞' }, items: [{ lid: 'aladin_U1', t: '시험 책', g: '상', p: 8000 }] }, new Map([['aladin_U1', { id: 'aladin_U1', title: '시험 책', grade: '상', price: 8000, usedCode: 'U1', listingId: '1', sku: 'S1', isbn13: '9788900000001', qty: 1 }]]), 'admin', '2026-11-11T02:00:00Z');
  ok(cd.platform === 'cash' && cd.kind === 'sale' && cd.ch === 'shop' && cd.orderNo === 'BQ20261111-ABCDE' && cd.orderedAt === '2026-11-11 10:00' && cd.items[0].listingKey === 'aladin_U1' && cd.items[0].aladinStop.status === 'todo' && cd.items[0].lineStatus === 'normal' && cd.recipient.zip === '06000' && cd.recipient.address === '서울 1층' && cd.totalAmount === 8000 && cd.shipFee === 3500, '출고로 보내기 = 현금 판매 기록 모양(알라딘 자동 판매중지 todo · 받는 분 주소 · 한국 시각)'); }

console.log('② 클라우드 창구(가짜 Firestore)');
const store = {}; const col = (n) => (store[n] = store[n] || {}); const clone = (x) => JSON.parse(JSON.stringify(x));
const FV = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...a) => ({ __au: a }) }; const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) o[k] = x && x.__au ? [...(o[k] || []), ...x.__au] : x; return o; };
const snap = (n, id) => { const d = col(n)[id]; return { id, exists: d != null, data: () => (d == null ? undefined : clone(d)), ref: ref(n, id) }; };
function ref(n, id) { return { _n: n, id, get: async () => snap(n, id), set: async (v, o) => { col(n)[id] = o && o.merge ? merge(col(n)[id], v) : merge({}, v); } }; }
const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => { const x = col(n)[id][f]; return op === '==' ? x === v : op === '>' ? String(x) > String(v instanceof Date ? v.toISOString() : v) : true; })).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f) }; } }); return { ...q([]), doc: (id) => ref(n, id) }; };
const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)), runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), getAll: async (...r) => r.map((x) => snap(x._n, x.id)), set: (r, v, o) => W.push(() => r.set(v, o)) }); for (const w of W) await w(); } };
for (let i = 1; i <= 5; i++) col('prd_listings')['aladin_U' + i] = L0({ title: '시험 책 ' + i, sku: 'A01BC12' + i + 'PK', bookId: 'bk' + i, isbn13: '978890000000' + i, price: 4000 + i * 1000 });
col('prd_listings').aladin_U9 = L0({ title: '미끼', sku: 'DUPES' }); for (let i = 1; i <= 5; i++) col('prd_books')['bk' + i] = { ...B0, title: '시험 책 ' + i };
col('app_settings').shop = { open: 1, shipFee: 3500, payDays: 2, bank: { name: '시험은행', acct: '000-000', holder: '가게' }, biz: { name: '가게' } };
process.env.SHOP_ORIGINS = 'http://localhost:' + (process.env.RN_PORT || 8765);
const SHOP = SH.makeShop({ db, C, FV, log: () => {} }); const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; if (await SHOP.handle(req, res, p0)) return; res.writeHead(404); res.end(); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; global.__shopBase = base;
const J = async (p, o) => { const r = await fetch(base + p, o ? { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://booksqueen.com' }, body: JSON.stringify(o) } : { headers: { Origin: 'https://booksqueen.com' } }); return { s: r.status, h: r.headers, j: await r.json() }; };
{ const c = await J('/shop/cfg'); ok(c.s === 200 && c.j.open === 1 && c.j.n === 5 && c.j.pay.acct === '000-000' && c.h.get('access-control-allow-origin') === 'https://booksqueen.com', '가게 설정: 판매 5권(미끼 뺌) · 열린 가게는 계좌 · booksqueen.com 출처 허락');
  const L = await J('/shop/list'); ok(L.j.total === 5 && L.j.items.every((x) => x.st === 's') && !JSON.stringify(L.j).includes('A01BC12') && !JSON.stringify(L.j).includes('미끼'), '목록: SKU·미끼 없음');
  const I = await J('/shop/item?id=aladin_U2'); ok(I.s === 200 && I.j.item.t === '시험 책 2' && I.j.item.lp === 15000 && (await J('/shop/item?id=aladin_U9')).s === 404, '책 한 권 · 미끼는 없음(404)'); }
const body = (ids) => ({ items: ids, buyer: { name: '손님A', phone: '010-0000-0000' }, rcv: { zip: '06000', addr1: '서울 어딘가 1길 1', addr2: '101호', memo: '문 앞' }, agree: { privacy: true, terms: true } });
let ord;
{ const r = await J('/shop/order', body(['aladin_U1', 'aladin_U2'])); ord = r.j; const d = col('shop_orders')[r.j.no];
  ok(r.s === 200 && r.j.total === 5000 + 6000 + 3500 && /^[0-9a-f]{32}$/.test(r.j.t) && !JSON.stringify(r.j).includes(PH) && !JSON.stringify(r.j).includes('어딘가'), '주문 접수: 값은 서버가 셈 · 응답에 손님 전화·주소 없음');
  ok(d && d.st === 'new' && d.buyer.phone === PH && d.rcv.addr1 === '서울 어딘가 1길 1' && d.tokH && d.tokH !== r.j.t && d.items[0].sku === 'A01BC121PK' && col('shop_holds').aladin_U1.on === 1 && col('shop_holds').aladin_U2.on === 1, 'shop_orders에만 손님 정보 · 조회 열쇠는 해시만 · 두 권 모두 주문 중');
  const r2 = await J('/shop/order', body(['aladin_U2', 'aladin_U3'])); ok(r2.s === 409 && r2.j.bad.length === 1 && r2.j.bad[0].id === 'aladin_U2' && !col('shop_holds').aladin_U3, '같은 책 두 번째 주문은 막음(나머지도 안 잡음)');
  const L = await J('/shop/list'); ok(L.j.items.find((x) => x.id === 'aladin_U1').st === 'o', "목록에 '주문 중'");
  col('prd_listings').aladin_U4.status = '판매완료'; const r3 = await J('/shop/order', body(['aladin_U4'])); ok(r3.s === 409 && /팔렸/.test(r3.j.bad[0].why), '목록이 늦어도 주문 때 상품 문서를 다시 봄(방금 팔림)');
  const v = await J(`/shop/order?no=${ord.no}&t=${ord.t}`); ok(v.s === 200 && v.j.name === '손*A' && v.j.items.length === 2 && v.j.pay.acct === '000-000' && !JSON.stringify(v.j).includes(PH), '주문 확인: 이름 가림 · 전화 없음');
  ok((await J(`/shop/order?no=${ord.no}&t=${'0'.repeat(32)}`)).s === 404, '조회 열쇠가 틀리면 못 봄');
  const cx = await J('/shop/cancel', { no: ord.no, t: ord.t }); ok(cx.s === 200 && col('shop_orders')[ord.no].st === 'cancel' && col('shop_holds').aladin_U1.on === 0 && col('shop_orders')[ord.no].hist.length === 2, "손님 취소 → 주문 중 풂(기록 남음 · 지우지 않음)");
  const r4 = await J('/shop/order', body(['aladin_U1'])); ok(r4.s === 200, '풀린 책은 다시 주문됨'); col('shop_orders')[r4.j.no].st = 'paid'; ok((await J('/shop/cancel', { no: r4.j.no, t: r4.j.t })).s === 409, '입금 확인 뒤엔 손님 화면에서 취소 못 함');
  col('app_settings').shop.open = 0; const S2 = SH.makeShop({ db, C, FV, log: () => {} }); const res = { h: {}, setHeader() {}, writeHead(c) { this.c = c; }, end(b) { this.b = b; } };
  const fakeReq = (m, u, b) => { const { Readable } = require('stream'); const r = Readable.from(b ? [Buffer.from(JSON.stringify(b))] : []); r.method = m; r.url = u; r.headers = {}; r.socket = { remoteAddress: '1.1.1.1' }; return r; };
  await S2.handle(fakeReq('POST', '/shop/order', body(['aladin_U3'])), res, '/shop/order'); ok(res.c === 403 && /곧 문을/.test(res.b), '닫힌 가게는 주문을 받지 않음'); col('app_settings').shop.open = 1; }
if (!process.env.RN_PORT) { srv.close(); console.log(bad ? `❌ tSHOP1111 ${bad}개 실패` : '✓ tSHOP1111 순수 셈·클라우드 창구 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }

console.log('③ 화면');
const SHOT = process.env.RN_SHOT || require('os').tmpdir() + '/'; const { chromium } = require('playwright');
{ const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const dlg = []; const errs = []; p.on('dialog', (d) => { dlg.push(d.message()); d.dismiss().catch(() => {}); }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((u) => { window.BQ_API = u; }, base); await p.goto(`http://localhost:${process.env.RN_PORT}/shop/index.html`); await p.waitForSelector('.grid .card', { timeout: 8000 }).catch(() => {});
  ok(await p.locator('.grid .card').count() >= 4 && /새로 들어온 책/.test(await p.textContent('#main')) && /사업자등록번호/.test(await p.textContent('#foot')), '첫 화면: 새로 들어온 책 · 아래 사업자 표시'); await p.screenshot({ path: SHOT + 'shop_home.png', fullPage: true });
  const ow = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1); ok(ow, '휴대폰 폭에서 옆으로 넘치지 않음');
  await p.fill('#sq', '시험 책 3'); await p.click('#sf button'); await p.waitForTimeout(600); ok(/1<\/b>권|1권/.test(await p.innerHTML('#lh')), '찾기 → 목록 1권');
  await p.click('.grid .card'); await p.waitForSelector('#add', { timeout: 5000 }).catch(() => {}); ok(/상/.test(await p.textContent('.gbox')) && /15,000원/.test(await p.textContent('.price')), '책 상세: 등급 풀이 · 정가'); await p.screenshot({ path: SHOT + 'shop_item.png', fullPage: true });
  await p.click('#add'); await p.waitForTimeout(300); ok(await p.textContent('#cartN') === '1', '장바구니 1권');
  await p.goto(`http://localhost:${process.env.RN_PORT}/shop/index.html#/order`); await p.waitForSelector('#of'); await p.click('#go'); await p.waitForTimeout(300); ok(await p.locator('[data-f].bad').count() >= 4 && !dlg.length, '빈 주문서 → 칸마다 빨간 알림(창 없음)');
  await p.fill('#f_name', '손님A'); await p.fill('#f_phone', '01000000000'); await p.fill('#f_zip', '06000'); await p.fill('#f_addr1', '서울 어딘가 1길 1'); await p.check('#f_agreeP'); await p.check('#f_agreeT'); await p.screenshot({ path: SHOT + 'shop_order.png', fullPage: true });
  await p.click('#go'); await p.waitForSelector('.bank', { timeout: 6000 }).catch(() => {}); const t = await p.textContent('#main');
  ok(/주문을 받았습니다/.test(t) && /000-000/.test(t) && /10,500원/.test(t) && (await p.textContent('#cartN')) === '0', '주문 → 입금 안내(계좌·합계) · 장바구니 비움'); await p.screenshot({ path: SHOT + 'shop_done.png', fullPage: true });
  const no = Object.keys(col('shop_orders')).find((k) => col('shop_orders')[k].items[0].lid === 'aladin_U3'); ok(!!no && col('shop_holds').aladin_U3.on === 1, '클라우드에 주문 · 주문 중');
  ok(!dlg.length && !errs.length, '손님 화면 브라우저 창·오류 0 ' + JSON.stringify([dlg, errs]).slice(0, 200)); await b.close();
  global.__shopNo = no; }
srv.close();
await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(300); const no = global.__shopNo; const so = clone(col('shop_orders')[no]);
  const o = await p.evaluate(async ({ no, so }) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const l = [...S.plist.values()][0]; so.items[0].lid = l.id; await db.collection('app_settings').doc('shop').set({ open: 1, bank: { name: '시험은행', acct: '000-000', holder: '가게' } }); await db.collection('shop_orders').doc(no).set(so); await Wt(300);
    openShopAdm(); await Wt(700); const sh = document.getElementById('sheet'); o.open = /우리숍 주문/.test(sh.textContent) && !!sh.querySelector('[data-bqpaid]'); o.alLine = /알라딘 아직 판매중/.test(sh.textContent);
    const b1 = sh.querySelector('[data-bqpaid]'); b1.click(); await Wt(200); o.once = window.__FS.shop_orders[no].st === 'new'; sh.querySelector('[data-bqpaid]').click(); await Wt(700); o.paid = window.__FS.shop_orders[no].st === 'paid';
    const b2 = sh.querySelector('[data-bqship]'); o.shipBtn = !!b2; if (b2) { b2.click(); await Wt(200); sh.querySelector('[data-bqship]').click(); await Wt(900); }
    const cid = 'cash_shop_' + no; const co = (window.__FS.crm_orders || {})[cid]; o.cash = !!co && co.platform === 'cash' && co.ch === 'shop' && co.items[0].listingKey === l.id && window.__FS.shop_orders[no].st === 'ship' && window.__FS.shop_orders[no].cashId === cid;
    o.inOrders = !!S.orders.get(cid); o.led = (() => { try { const V = ledOrders(new Date(Date.now() - 30 * 864e5).toISOString()); return V.filter((x) => x.ch === 'shop').length; } catch (e) { return -1; } })();
    o.chip = SHIP_SRC.some((x) => x[0] === 'shop') && (shipCnt().shop.deliv || 0) >= 1; o.goPage = GO_PAGES.some((x) => x[0] === 'shopAdm') && PG_SCR.some((x) => x[0] === 'shopAdm') && !!PAGE_GUIDES.shopAdm;
    S.shipSrc = 'shop'; S.shipTab = 'deliv'; history.back(); await Wt(300); try { openShip(); } catch (e) { o.shipErr = e.message; } await Wt(900); o.shipView = /우리숍 주문/.test(document.getElementById('sheet').textContent);
    return o; }, { no, so });
  ok(o.open && o.alLine, '🛍 우리숍 주문 화면 · 알라딘 아직 판매중 표시'); ok(o.once && o.paid, '💰 입금 확인: 한 번은 아무것도 안 함 · 두 번째에 입금 확인');
  ok(o.shipBtn && o.cash && o.inOrders, '📦 출고로 보내기(두 번) → 현금 판매 기록 cash_shop_<주문>(ch shop · 알라딘 상품 줄) · 주문 단계 ship');
  ok(o.led === 1, '🧾 통합 장부: 현금 기록이 우리숍 주문으로 한 번만 셈'); ok(o.chip && o.shipView && !o.shipErr, '오늘 출고 › 🛍 우리숍 칩에 그 주문 ' + (o.shipErr || '')); ok(o.goPage, '바로 가기·화면 목록·화면 설명서에 있음');
  await p.screenshot({ path: SHOT + 'shop_admin_ship.png' }); await p.evaluate(() => { history.back(); }); await p.waitForTimeout(300); await p.evaluate(() => openShopAdm()); await p.waitForTimeout(600); await p.screenshot({ path: SHOT + 'shop_admin.png', fullPage: true });
  ok(!dlg.length, '웹앱 브라우저 창 0 ' + dlg.join(' | ')); });
console.log(bad ? `❌ tSHOP1111 ${bad}개 실패` : '✓ tSHOP1111 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 멈춤', e); process.exit(1); });
