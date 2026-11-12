/* t_naver — 🟩 네이버 커머스API 어댑터 (0.1.22~0.1.23 · 정범님 11/11 결정 (나): 고정 IP 로거 PC의 번외가 부름 · 약속 0의 네이버 예외)
 *  ① 전자서명 bcrypt — 원문 docs/auth 보기 값(aaaabbbbcccc · $2a$10$abcdefghijklmnopqrstuv · 1643961623299 → JDJhJDEw…bmsy) 그대로 · 원주율 처음 값
 *  ② 순수 셈 — 주문 줄(주문자 이름·연락처 안 옮김 · 받는 분만) · 상품 줄 · 등록 몸(중고 OLD·BOOKS 고시·ISBN · 빠진 칸이면 안 보냄) · 게이트웨이 오류 한국어
 *  ③ 로거가 아닌 PC — 칸·열쇠·저장 모두 없음(명령 거절)
 *  ④ 로거 PC — 공개 열쇠 → 웹앱과 같은 봉투(WebCrypto RSA-OAEP+AES-GCM) · 틀린 시크릿 = 저장 안 함 · 맞으면 DPAPI 파일에만(평문 없음) · 같은 봉투 두 번·오래된 봉투 거절
 *     · 주문 변경(more 이어 받기) → 상세 → 줄(crm_naver_orders) · 상품 목록(nv_listings) · 받음 확인(ack)이면 줄에서 빠짐 · 401이면 토큰 다시 받고 한 번 더 · 429면 쉼
 *     · 쓰기 기본 끔 → 켜기는 연결 시험이 맞은 뒤 · 발송 1건 · 같은 할 일 두 번 안 함 · 같은 송장 다른 주문 거절 · IP 막힘이면 '로거 공인 IP' 안내
 *     · 상태·기록·설정 파일 어디에도 시크릿·아이디·토큰·전자서명 없음
 *  ⑤ 🛑 와이파이 문(nvfix1) ⑥ 🔒 와이파이 주소에 묶기(naver4) — 가짜 인터페이스 둘(와이파이 127.0.0.1 · 테더링 127.0.0.2) · 모든 요청이 묶인 주소로만 · 와이파이 주소 없으면 0건
 *     · 보내기 전 소켓 주소 다르면 끊음(0건) · 응답 소켓 주소 다르면 결과 버림·멈춤(쓰기는 다시 안 보냄) · PowerShell 원문 상태에 남김
 * 실행: node tests/t_naver.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const B = require('../helper/col2-bcrypt.js'); const NVM = require('../helper/col2-nv.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const ID = 'nvApp' + Math.random().toString(36).slice(2, 10); const SECRET = '$2a$04$' + 'abcdefghijklmnopqrstuv'.split('').sort(() => Math.random() - 0.5).join('');

function fakeNv() { const S = { log: [], tok: null, ip: false, r429: 0, r401: 0, dispatched: [], confirmed: [], statusCh: [], created: [], tokN: 0, prices: [], approved: [], noInq: false, caseDay: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) };
  const PO = (i) => ({ order: { orderId: 'O' + i, orderDate: '2026-11-10T10:00:00.000+09:00', paymentDate: '2026-11-10T10:01:00.000+09:00', ordererName: '주문자이름' + i, ordererTel: '010-0000-0000', ordererId: 'buyerid' + i },
    productOrder: { productOrderId: 'PO' + i, productOrderStatus: 'PAYED', placeOrderStatus: 'NOT_YET', productName: '시험 책 ' + i, quantity: 1, unitPrice: 9000, totalPaymentAmount: 9000, paymentCommission: 330, channelCommission: 180, expectedSettlementAmount: 8490, deliveryFeeAmount: 3000, sellerProductCode: 'SKU' + i, productId: '77' + i, originalProductId: '66' + i, shippingDueDate: '2026-11-12T23:59:59.000+09:00', shippingAddress: { name: '받는분' + i, tel1: '010-0000-0000', zipCode: '00000', baseAddress: '시험시 시험로 1', detailedAddress: '101호' }, shippingMemo: '문 앞', ...(String(i) === '2' ? { claimType: 'CANCEL', claimStatus: 'CANCEL_REQUEST' } : {}) }, ...(String(i) === '2' ? { currentClaim: { cancel: { claimId: 'CL2', cancelReason: 'INTENT_CHANGED', cancelDetailedReason: '마음이 바뀜', claimRequestDate: '2026-11-11T09:30:00.000+09:00', requestQuantity: 1 } } } : {}) }); /* (naver3) PO2 = 취소 요청 */
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const J = (code, o) => { s.writeHead(code, { 'Content-Type': 'application/json;charset=UTF-8' }); s.end(JSON.stringify(o)); }; S.log.push({ m: q.method, p: u.pathname, q: u.search, auth: q.headers.authorization || null, b, ra: String(q.socket.remoteAddress || '').replace(/^::ffff:/, '') }); /* (naver4) ra = 요청이 나온 주소(묶인 주소인지) */
      if (u.pathname === '/img') { S.imgGet = (S.imgGet || 0) + 1; s.writeHead(200, { 'Content-Type': 'image/jpeg' }); return s.end(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])); } /* (naver2) 사진 받기 대역(RN_COL2_NVIMG) */
      if (u.pathname === '/myip') { S.ipHits = (S.ipHits || 0) + 1; if (S.myipFail) { s.writeHead(500); return s.end('x'); } s.writeHead(200, { 'Content-Type': 'text/plain' }); return s.end(String(S.myip || '') + '\n'); } /* (nvfix1) 공인 IP 확인 대역(RN_COL2_NVIP) — 네이버 요청 수에 안 셈 */
      if (S.onReq) { try { S.onReq(u.pathname); } catch (e) {} }
      if (S.ip) return J(403, { code: 'GW.IP_NOT_ALLOWED', message: '호출이 허용되지 않은 IP입니다.', traceId: 't1' });
      if (u.pathname === '/v1/oauth2/token') { const f = new URLSearchParams(b); S.tokN++; const want = B.nvSign(ID, SECRET, f.get('timestamp')); if (f.get('client_id') !== ID || f.get('client_secret_sign') !== want || f.get('grant_type') !== 'client_credentials' || f.get('type') !== 'SELF') return J(400, { code: 'BAD', message: 'client_secret_sign 불일치' }); S.tok = 'TOK' + Math.random().toString(36).slice(2); return J(200, { access_token: S.tok, expires_in: 10800, token_type: 'Bearer' }); }
      if (q.headers.authorization !== 'Bearer ' + S.tok) return J(401, { code: 'GW.AUTHN', message: '요청을 보낼 권한이 없습니다.' });
      if (S.r401 > 0) { S.r401--; S.tok = 'expired'; return J(401, { code: 'GW.AUTHN', message: '요청을 보낼 권한이 없습니다.' }); }
      if (S.r429 > 0) { S.r429--; return J(429, { code: 'GW.RATE_LIMIT', message: '요청이 많아' }); }
      if (u.pathname === '/v1/products/search') { const o = JSON.parse(b || '{}'); const all = [1, 2, 3].map((i) => ({ originProductNo: 66 + '' + i, channelProducts: [{ channelProductNo: 77 + '' + i, originProductNo: 66 + '' + i, channelServiceType: 'STOREFARM', name: '시험 책 ' + i, sellerManagementCode: 'SKU' + i, statusType: i === 3 || S.statusCh.some((x) => x.no === '66' + i && x.statusType === 'SUSPENSION') ? 'SUSPENSION' : 'SALE', channelProductDisplayStatusType: 'ON', salePrice: ((S.prices.map((x) => x.multiProductUpdateRequestVos[0]).filter((v) => String(v.originProductNo) === '66' + i).pop() || {}).productSalePrice || {}).salePrice || 9000, stockQuantity: S.statusCh.some((x) => x.no === '66' + i && x.statusType === 'SUSPENSION') ? 0 : 1 } /* (naver3) 바꾼 값이 목록에도 — 6시간 목록 읽기가 끼어도 시험이 흔들리지 않게 */, { channelProductNo: 99, channelServiceType: 'WINDOW', statusType: 'SALE' }] }));
        const sz = +o.size || 100; return J(200, { contents: all.slice((o.page - 1) * sz, o.page * sz), page: o.page, size: sz, totalElements: all.length }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/last-changed-statuses') { const ms = u.searchParams.get('moreSequence'); if (!ms) return J(200, { data: { count: 1, lastChangeStatuses: [{ productOrderId: 'PO1', lastChangedType: 'PAYED' }], more: { moreFrom: u.searchParams.get('lastChangedFrom'), moreSequence: '2' } } }); return J(200, { data: { count: 1, lastChangeStatuses: [{ productOrderId: 'PO2', lastChangedType: 'PAYED' }] } }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/query') { const o = JSON.parse(b || '{}'); return J(200, { data: (o.productOrderIds || []).map((id) => PO(id.replace('PO', ''))) }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/dispatch') { const o = JSON.parse(b || '{}'); S.dispatched.push(...(o.dispatchProductOrders || [])); return J(200, { data: { successProductOrderIds: (o.dispatchProductOrders || []).map((x) => x.productOrderId), failProductOrderInfos: [] } }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/confirm') { const o = JSON.parse(b || '{}'); S.confirmed.push(...(o.productOrderIds || [])); return J(200, { data: { successProductOrderIds: o.productOrderIds, failProductOrderInfos: [] } }); }
      if (u.pathname === '/v1/product-images/upload') { S.uploaded = (S.uploaded || 0) + (b.match(/name="imageFiles"/g) || []).length; return J(200, { images: Array.from({ length: S.uploaded }, (_, i) => ({ url: 'https://shop-phinf.pstatic.net/t' + i + '.jpg' })) }); }
      if (u.pathname === '/v2/products' && q.method === 'POST' && S.c504 > 0) { S.c504--; S.post504 = (S.post504 || 0) + 1; return J(504, { code: 'GW.TIMEOUT', message: '시간 넘음' }); } /* (0.1.34 rel10) 네이버가 받았는지 모르는 답 */
      if (u.pathname === '/v2/products' && q.method === 'POST') { S.created.push(JSON.parse(b || '{}')); return J(200, { originProductNo: 8801, smartstoreChannelProductNo: 9901 }); }
      /* (0.1.23 naver3) 문의 · 정산 · 판매가 · 요청 승인 */
      if (u.pathname === '/v1/pay-user/inquiries') { if (S.noInq) return J(403, { code: 'FORBIDDEN', message: '권한 없음' }); return J(200, { content: [{ inquiryNo: 501, category: '배송', title: '언제 오나요', inquiryContent: '빨리 받고 싶어요', inquiryRegistrationDateTime: '2026-11-11T09:00:00.000+09:00', answered: false, orderId: 'O1', productOrderIdList: 'PO1', productName: '시험 책 1', customerId: 'buyerid9', customerName: '구매자이름9' }, { inquiryNo: 502, category: '상품', title: '상태 문의', inquiryContent: '책 상태?', answered: true, answerRegistrationDateTime: '2026-11-10T12:00:00.000+09:00', orderId: 'O2', customerName: '구매자이름8' }], last: true, totalElements: 2 }); }
      if (u.pathname === '/v1/contents/qnas') return J(200, { contents: [{ questionId: 701, productId: 7701, productName: '시험 책 1', question: '밑줄 있나요', answered: false, createDate: '2026-11-11T08:00:00.000+09:00', maskedWriterId: 'ab***' }], page: 1, size: 100, totalElements: 1, last: true });
      if (u.pathname === '/v1/pay-settle/settle/daily') return J(200, { elements: [{ settleBasisStartDate: '2026-11-09', settleBasisEndDate: '2026-11-09', settleExpectDate: '2026-11-12', settleAmount: 8490, paySettleAmount: 9000, commissionSettleAmount: -510, benefitSettleAmount: 0, settleMethodType: 'ACCOUNT', bankType: 'KB', accountNo: '000000000000', depositorName: '예금주이름', merchantName: '가게' }], pagination: { page: 1, size: 100, totalPages: 1, totalElements: 1 } });
      if (u.pathname === '/v1/pay-settle/settle/case') { S.caseQ = (S.caseQ || 0) + 1; return J(200, { elements: u.searchParams.get('searchDate') === S.caseDay ? [{ settleBasisDate: S.caseDay, settleExpectDate: '2026-11-12', orderId: 'O1', productOrderId: 'PO1', productOrderType: 'PROD_ORDER', settleType: 'NORMAL_SETTLE_ORIGINAL', productName: '시험 책 1', purchaserName: '구매자이름9', paySettleAmount: 9000, totalPayCommissionAmount: 330, sellingInterlockCommissionAmount: 180, benefitSettleAmount: 0, settleExpectAmount: 8490 }] : [], pagination: { page: 1, size: 1000, totalPages: 1 } }); }
      if (u.pathname === '/v1/products/origin-products/multi-update' && q.method === 'PATCH') { S.prices.push(JSON.parse(b || '{}')); return J(200, { code: 'SUCCESS', data: {} }); }
      { const m = /^\/v1\/pay-order\/seller\/product-orders\/([\w-]+)\/claim\/(cancel|return|exchange\/collect)\/approve$/.exec(u.pathname); if (m && q.method === 'POST') { S.approved.push(m[1] + ':' + m[2]); return J(200, {}); } }
      { const m = /^\/v1\/products\/origin-products\/(\d+)\/change-status$/.exec(u.pathname); if (m && q.method === 'PUT') { S.statusCh.push({ no: m[1], ...JSON.parse(b || '{}') }); return J(200, {}); } } /* (naver2) 판매 상태 바꾸기 */
      J(404, { code: 'GW.NOT_FOUND' }); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
/* 웹앱(src/app.html nvSeal)과 같은 봉투 — 브라우저 WebCrypto 그대로 */
async function seal(pubB64, obj) { const wc = require('crypto').webcrypto; const pk = await wc.subtle.importKey('spki', Buffer.from(pubB64, 'base64'), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const k = await wc.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']); const raw = new Uint8Array(await wc.subtle.exportKey('raw', k)); const iv = wc.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await wc.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(obj)))); const ek = new Uint8Array(await wc.subtle.encrypt({ name: 'RSA-OAEP' }, pk, raw));
  const b = (u) => Buffer.from(u).toString('base64'); return { alg: 'RSA-OAEP-256+A256GCM', ek: b(ek), iv: b(iv), ct: b(ct) }; }
const allText = (dir) => { let t = ''; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (st.size < 4e6) t += fs.readFileSync(p, 'utf8'); } }; walk(dir); return t; };

(async () => {
  console.log('① 전자서명 bcrypt');
  { const W = B.piWords(); ok(W[0] === 0x243f6a88 && W[17] === 0x8979fb1b && W[18] === 0xd1310ba6 && W[18 + 1023] === 0x3ac372e6, 'Blowfish 처음 값 = 원주율 소수 자리(P[0]·P[17]·S0[0]·S3[255])');
    ok(B.nvSign('aaaabbbbcccc', '$2a$10$abcdefghijklmnopqrstuv', 1643961623299) === 'JDJhJDEwJGFiY2RlZmdoaWprbG1ub3BxcnN0dXVCVldZSk42T0VPdEx1OFY0cDQxa2IuTnpVaUEzbmsy', '원문 docs/auth 보기 값과 글자 하나까지 같음');
    ok(B.hashpw('', '$2a$06$DCq7YPn5Rq63x1Lad4cll.') === '$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.', 'bcrypt 널리 쓰는 시험 값(jBCrypt) 같음');
    let th = null; try { B.hashpw('x', 'notasalt'); } catch (e) { th = e.message; } ok(/소금/.test(th || ''), '시크릿 꼴이 아니면 한국어 오류', th); }
  console.log('② 순수 셈');
  { const o = NVM.nvOrd({ order: { orderId: 'O1', orderDate: '2026-11-10T10:00:00.000+09:00', ordererName: '주문자', ordererTel: '010-0000-0000' }, productOrder: { productOrderId: 'P1', productOrderStatus: 'CANCELED', productName: '책', quantity: 2, remainQuantity: 1, totalPaymentAmount: 9000, paymentCommission: 300, channelCommission: 100, sellerProductCode: 'S1', productId: '7', originalProductId: '6', shippingAddress: { name: '받는분', baseAddress: '주소' } } });
    ok(o.id === 'P1' && o.cancel && o.qty === 1 && o.fee === 400 && o.sku === 'S1' && o.rcv.name === '받는분' && !JSON.stringify(o).includes('주문자'), '주문 줄 — 취소·남은 수량·수수료 합·SKU · 주문자 이름·연락처는 안 옮김(받는 분만)', o);
    const p = NVM.nvPrd({ originProductNo: 6, channelProducts: [{ channelProductNo: 7, channelServiceType: 'STOREFARM', statusType: 'SALE', channelProductDisplayStatusType: 'ON', salePrice: 9000, stockQuantity: 2, sellerManagementCode: 'S1' }, { channelProductNo: 8, channelServiceType: 'WINDOW', statusType: 'SALE' }] });
    ok(p.length === 1 && p[0].live && p[0].qty === 2 && p[0].sku === 'S1' && p[0].originNo === '6', '상품 줄 — 스마트스토어 채널만 · 판매중 · 수량 · 관리코드', p);
    const m = NVM.nvBody({ title: '책' }, {}); ok(!m.ok && m.miss.includes('ISBN13') && m.miss.includes('카테고리(도서 › 중고)') && m.miss.includes('출고지 주소록 번호') && m.miss.includes('반품지 주소록 번호'), '등록 몸 — 빠진 칸이면 보내지 않음(빠진 칸 이름 · 출고지·반품지 주소록 번호 포함)', m.miss);
    const g = NVM.nvBody({ title: '시험 책', isbn13: '978-89-0000000-1'.replace(/-/g, '').slice(0, 13).padEnd(13, '1'), author: '저자1, 저자2', publisher: '출판사', pubDate: '20200315', pages: 300, size: '148*210', grade: '상', price: 8000, qty: 1, sku: 'SKU1', images: ['https://shop-phinf.pstatic.net/a.jpg', 'https://shop-phinf.pstatic.net/b.jpg'] }, { leafCategoryId: '50005000', deliveryCompany: 'CJGLS', baseFee: 3000, returnFee: 3000, exchangeFee: 6000, asTel: '000-0000-0000', shippingAddressId: 101, returnAddressId: 102 });
    const op = g.ok && g.body.originProduct; ok(g.ok && op.saleType === 'OLD' && op.statusType === 'SALE' && op.detailAttribute.productInfoProvidedNotice.productInfoProvidedNoticeType === 'BOOKS' && op.detailAttribute.isbnInfo.isbn13.length === 13 && op.detailAttribute.bookInfo.publishDay === '2020-03-15' && op.detailAttribute.bookInfo.authors.length === 2 && op.images.optionalImages.length === 1 && op.detailAttribute.sellerCodeInfo.sellerManagementCode === 'SKU1' && op.deliveryInfo.deliveryFee.deliveryFeeType === 'PAID' && /\[중고-상\]$/.test(op.name), '등록 몸 — 중고(OLD)·BOOKS 고시·ISBN·출간일·저자 둘·사진·관리코드=SKU·유료 배송·이름 끝 [중고-상]', op && op.name);
    ok(/API 호출 IP/.test(NVM.nvErr(403, { code: 'GW.IP_NOT_ALLOWED' }).msg) && NVM.nvErr(401, { code: 'GW.AUTHN' }).auth && NVM.nvErr(429, {}).rate, '게이트웨이 오류 → 한국어 까닭·할 일');
    ok(NVM.kstIso(Date.UTC(2026, 10, 11, 0, 0, 0, 5)) === '2026-11-11T09:00:00.005+09:00', '날짜 꼴 yyyy-MM-ddTHH:mm:ss.SSS+09:00(원문 restful-api)'); }
  { const W = { m: 35, name: 'Wi-Fi', desc: 'Intel(R) Wi-Fi 6 AX201', media: 9, pmt: 'Native 802.11', itype: 71, ip: '192.168.0.20', ix: 12 }; const K = NVM.netKind; /* (nvfix1) 🛑 나가는 길 가르기 */
    ok(K(W) === 'wifi' && K({ ...W, media: 0, pmt: '' }) === 'unknown' && K({ ...W, itype: 6 }) !== 'wifi' && K({ desc: 'Remote NDIS based Internet Sharing Device', itype: 6 }) === 'tether' && K({ desc: 'Apple Mobile Device Ethernet', itype: 6, media: 14 }) === 'tether' && K({ desc: 'Bluetooth Device (Personal Area Network)', media: 10 }) === 'tether' && K({ ...W, desc: 'Microsoft Wi-Fi Direct Virtual Adapter' }) === 'tether' && K({ desc: 'Realtek PCIe GbE', itype: 6, media: 14 }) === 'wired' && K(null) === 'unknown', '길 가르기 — 와이파이(802.11·무선 71)만 와이파이 · RNDIS·애플·블루투스·Wi-Fi Direct = 테더링 · 이더넷 = 유선 · 모르면 모름');
    const P = NVM.netPick; ok(P([W]).ok && !P(null).ok && !P([]).ok && !P([{ ...W, m: 40 }, { desc: 'Remote NDIS', itype: 6, m: 10 }]).ok && P([W, { desc: 'Remote NDIS', itype: 6, m: 90 }]).ok && !P([W, { desc: 'Remote NDIS', itype: 6, m: 35 }]).ok && !P([{ m: 'x' }]).ok, '가장 앞 길이 와이파이일 때만 · 같은 우선순위에 다른 길이 있으면 막음 · 목록 없음/빔 = 막음');
    { const a = P([W]); ok(a.ok && a.lip === '192.168.0.20' && a.ix === 12 && !P([{ ...W, ip: '' }]).ok && /주소\(IPv4\)를 모름/.test(P([{ ...W, ip: '' }]).why) && !P([{ ...W, ip: '169.254.3.4' }]).ok && !P([{ ...W, ip: 'fe80::1' }]).ok, '(naver4) 와이파이여도 그 IPv4 주소를 모르면(빈 칸·169.254·IPv6만) 막음 · 아는 주소 = 묶을 주소', a); }
    ok(NVM.ipv4(' 203.0.113.7\n') === '203.0.113.7' && !NVM.ipv4('256.1.1.1') && !NVM.ipv4('<html>') && !NVM.ipv4(''), '공인 IP 꼴 확인'); }
  { /* (0.1.23 naver3) 클레임·문의·정산 줄 · 허용 목록 */
    const o = NVM.nvOrd({ order: { orderId: 'O5', ordererName: '주문자' }, productOrder: { productOrderId: 'P5', productOrderStatus: 'DELIVERED', claimType: 'RETURN', claimStatus: 'RETURN_REQUEST', quantity: 1 }, currentClaim: { return: { claimId: 'C5', returnReason: 'BROKEN', returnDetailedReason: '모서리 찢김', claimRequestDate: '2026-11-11T10:00:00.000+09:00', requestQuantity: 1 } } });
    ok(o.claim === 'RETURN' && o.cl && o.cl.type === 'RETURN' && o.cl.st === 'RETURN_REQUEST' && o.cl.id === 'C5' && o.cl.reason === '상품 파손' && o.cl.why === '모서리 찢김' && o.cl.qty === 1 && !o.ret, '클레임 자세히 — 종류·상태·번호·사유(한국어)·요청일·수량 (끝나기 전엔 반품 끝 아님)', o.cl);
    ok(NVM.nvOrd({ productOrder: { productOrderId: 'P6', productOrderStatus: 'PAYED' } }).cl === null && NVM.nvClaimOf({ cancel: { cancelReason: 'SOLD_OUT' } }, 'CANCEL', 'CANCEL_REQUEST').reason === '상품 품절', '클레임 없으면 null · 옛 칸(cancel)도 읽음');
    const i1 = NVM.nvInq({ inquiryNo: 9, category: '배송', title: 't', inquiryContent: 'x'.repeat(400), answered: false, customerName: '구매자', customerId: 'cid', productOrderIdList: 'A1, A2' }); ok(i1.id === 'c9' && i1.body.length === 300 && i1.poIds.join() === 'A1,A2' && !JSON.stringify(i1).includes('구매자') && !JSON.stringify(i1).includes('cid'), '고객 문의 줄 — 글 300자 · 상품 주문 번호들 · 구매자 이름·아이디 없음', i1);
    const q1 = NVM.nvQna({ questionId: 3, productId: 77, productName: '책', question: '?', answered: true, answers: [{ answer: 'a', createDate: 'd1' }, { answer: 'b', createDate: 'd2' }], maskedWriterId: 'ab**' }); ok(q1.id === 'q3' && q1.ans && q1.ansAt === 'd2' && q1.prodNo === '77' && !JSON.stringify(q1).includes('ab**'), '상품 문의 줄 — 마지막 답 때 · 작성자 아이디 없음', q1);
    const d1 = NVM.nvStlDay({ settleBasisStartDate: '2026-11-09', settleAmount: 100, paySettleAmount: 120, commissionSettleAmount: -20, accountNo: '123', depositorName: '예금주', bankType: 'KB', settleMethodType: 'ACCOUNT' }); ok(d1.id === '20261109_ACCOUNT' && d1.amt === 100 && d1.fee === -20 && !/123|예금주|KB/.test(JSON.stringify(d1)), '일별 정산 줄 — 계좌·예금주·은행 없음', d1);
    const c1 = NVM.nvStlCase({ productOrderId: 'P1', productOrderType: 'PROD_ORDER', settleType: 'NORMAL_SETTLE_ORIGINAL', paySettleAmount: 9000, totalPayCommissionAmount: 330, sellingInterlockCommissionAmount: 180, settleExpectAmount: 8490, purchaserName: '구매자' }); ok(c1.po === 'P1' && c1.fee === 510 && c1.expAmt === 8490 && !JSON.stringify(c1).includes('구매자'), '건별 정산 줄 — 수수료 합 · 구매자 이름 없음', c1);
    const U = NVM.nvUrlOk; ok(U('https://api.commerce.naver.com/external/v1/x') && U('https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/p%2F1.jpg?alt=media') && !U('https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/../../other/o/x') && !U('https://firebasestorage.googleapis.com/v0/b/other.appspot.com/o/x') && !U('https://www.aladin.co.kr/') && !U('https://api.commerce.naver.com.evil.example/external/') && !U('http://api.commerce.naver.com/external/x') && !U('https://u:p@api.commerce.naver.com/external/x') && !U('https://example.com/x.jpg'), '허용 목록 — 네이버 커머스API · 우리 사진 저장소(우리 버킷만)만 · .. 돌아가기·남의 버킷·알라딘·비슷한 집·http·계정 붙은 주소 거절'); }

  const F = await fakeNv(); const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2nv_')); fs.mkdirSync(D + '/bin', { recursive: true });
  fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  /* (nvfix1) 🛑 와이파이 문 대역 — 경로 파일(RN_COL2_NET · 바꾸면 다음 요청부터)과 공인 IP 확인(RN_COL2_NVIP) · 등록 고정 IP = nvcfg.ip */
  const NETF = D + '/net.json'; const WIFI = [{ m: 35, name: 'Wi-Fi', desc: 'Intel(R) Wi-Fi 6 AX201 160MHz', media: 9, pmt: 'Native 802.11', itype: 71, pnp: 'PCI\\VEN_8086&DEV_A0F0\\3&11583659&0&A3', gw: '127.0.0.254', ip: '127.0.0.1', ix: 12 }]; /* (naver4) 가짜 와이파이 주소 127.0.0.1 */
  const TETH = [{ m: 25, name: '이더넷 3', desc: 'Remote NDIS based Internet Sharing Device', media: 0, pmt: 'Unspecified', itype: 6, pnp: 'USB\\VID_04E8', ip: '127.0.0.2', ix: 25 }, ...WIFI]; /* 가짜 테더링 주소 127.0.0.2 */ const net = (v) => fs.writeFileSync(NETF, JSON.stringify(v)); net(WIFI); F.S.myip = '203.0.113.7';
  const nvN = () => F.S.log.filter((x) => x.p !== '/img' && x.p !== '/myip').length; /* 네이버(가짜) 요청 수 */
  const env = { RN_COL2_NV: F.base, RN_COL2_DPAPI: D + '/bin/dpapi', RN_COL2_NVIMG: F.base + '/img', RN_COL2_NET: NETF, RN_COL2_NVIP: F.base + '/myip', RN_COL2_NVBINDX: D + '/bindx.json' }; const cfg0 = { on: false, y24: false, al: false, auto: false, side: false, headless: true, pcSrc: 'pc', nvcfg: { ip: '203.0.113.7', minGapMs: 0, ordMin: 0.02, prdH: 0.0005, cool429Sec: 1 } };

  console.log('③ 로거가 아닌 PC');
  { const H = await L.startHelper({ dir: D + '/office', port: L.PORT + 7, cfg: { ...cfg0, pc: 'HOME', hands: false }, env });
    const s = await H.api('GET', '/nv/st'); ok(s.st === 200 && s.j && s.j.nv && s.j.nv.on === false && !s.j.nv.pub, '사무실 PC — 네이버 칸 꺼짐 · 공개 열쇠 없음', s.j && s.j.nv);
    const c = await H.api('POST', '/nv/cmd', { k: 'test' }); ok(c.j && c.j.ok === false && /로거/.test(c.j.err || ''), '명령 거절(로거 PC만)', c.j && c.j.err);
    await wait(600); ok(!fs.existsSync(D + '/office/home/cred/nv-key.dat') && !F.S.log.length, '열쇠 파일 없음 · 네이버를 부르지 않음'); await H.stop(); }

  console.log('④ 로거 PC');
  const H = await L.startHelper({ dir: D + '/lg', port: L.PORT + 8, cfg: { ...cfg0, pc: 'LOGGER' }, env }); const HOMEd = D + '/lg/home'; global.__H = H; /* 시험 오류 때 도우미 출력 끝을 보임 */ process.on('exit', () => { try { H.pr.kill('SIGKILL'); } catch (e) {} });
  const st0 = await until(async () => { const s = await H.api('GET', '/nv/st'); return s.j && s.j.nv && s.j.nv.pub ? s.j.nv : null; }, 80); ok(st0 && st0.on && st0.pub.length > 300 && !st0.cred.has, '로거 — 공개 열쇠(spki)만 보임 · 아직 저장 값 없음');
  const kf = JSON.parse(fs.readFileSync(HOMEd + '/cred/nv-key.dat', 'utf8')); ok(kf.priv && !/PRIVATE KEY/.test(fs.readFileSync(HOMEd + '/cred/nv-key.dat', 'utf8')), '비밀 열쇠는 DPAPI로 잠근 채 파일에(평문 PEM 없음)');
  { const r = await H.api('POST', '/nv/cmd', { k: 'cred', env: await seal(st0.pub, { id: ID, sec: '$2a$04$zzzzzzzzzzzzzzzzzzzzzz', ts: Date.now() }), by: '시험' }); ok(r.j && r.j.saved === false && r.j.test && r.j.test.ok === false && !fs.existsSync(HOMEd + '/cred/naver.dat'), '틀린 시크릿 — 연결 시험 실패 · 저장 안 함', r.j && r.j.err); }
  const E1 = await seal(st0.pub, { id: ID, sec: SECRET, ts: Date.now() });
  { const r = await H.api('POST', '/nv/cmd', { k: 'cred', env: E1, by: '시험' }); ok(r.j && r.j.saved === true && r.j.test && r.j.test.ok && /연결됨/.test(r.j.test.msg), '맞는 값 — 곧바로 연결 시험 맞음 · 저장', JSON.stringify(r.j && { e: r.j.err, t: r.j.test }));
    const f = fs.readFileSync(HOMEd + '/cred/naver.dat', 'utf8'); ok(!f.includes(ID) && !f.includes(SECRET) && JSON.parse(f).idTail === '…' + ID.slice(-4), '저장 파일에 아이디·시크릿 평문 없음(끝 4자만)');
    ok(r.j.nv && r.j.nv.cred.has && r.j.nv.cred.chk === 'ok' && !JSON.stringify(r.j).includes(SECRET) && !JSON.stringify(r.j).includes(ID), '답에 값 없음 · 저장됨·확인됨만'); }
  { const r = await H.api('POST', '/nv/cmd', { k: 'cred', env: E1, by: '시험' }); ok(r.j && r.j.ok === false && /두 번/.test(r.j.err || ''), '같은 봉투 두 번 거절', r.j && r.j.err);
    const r2 = await H.api('POST', '/nv/cmd', { k: 'cred', env: await seal(st0.pub, { id: ID, sec: SECRET, ts: Date.now() - 3600e3 }) }); ok(r2.j && r2.j.ok === false && /오래된/.test(r2.j.err || ''), '30분 넘은 봉투 거절', r2.j && r2.j.err); }
  /* 주문·상품 읽기(저절로) */
  const fd = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); const out = (r.j && r.j.out) || []; return out.some((x) => x.c === 'crm_naver_orders') && out.some((x) => x.c === 'nv_listings') ? r.j : null; }, 80);
  { const out = (fd && fd.out) || []; const os2 = out.filter((x) => x.c === 'crm_naver_orders'); const ls = out.filter((x) => x.c === 'nv_listings');
    ok(os2.length === 2 && os2.some((x) => x.id === 'PO2') && F.S.log.some((x) => /moreSequence=2/.test(x.q)), '주문 변경 more 이어 받기 → 상세 2건 → 줄(crm_naver_orders)', os2.map((x) => x.id));
    ok(os2.every((x) => x.v.ch === 'naver' && x.v.sku && !JSON.stringify(x.v).includes('주문자이름') && !JSON.stringify(x.v).includes('buyerid')), '주문 줄에 주문자 이름·아이디 없음(받는 분만)');
    { const p2 = os2.find((x) => x.id === 'PO2'); ok(p2 && p2.v.claim === 'CANCEL' && p2.v.cl && p2.v.cl.st === 'CANCEL_REQUEST' && p2.v.cl.reason === '구매 의사 취소' && p2.v.cl.id === 'CL2', '(naver3) 취소 요청 주문 — 클레임 줄(종류·상태·사유·클레임 번호)', p2 && p2.v.cl); }
    ok(ls.length === 3 && ls.find((x) => x.id === '663').v.live === false && ls.find((x) => x.id === '661').v.sku === 'SKU1', '상품 목록 → 줄(nv_listings) · 판매중지 줄은 live 아님 · 쇼핑윈도 채널 뺌', ls.map((x) => x.id));
    const lc = F.S.log.find((x) => /last-changed/.test(x.p)); ok(lc && /lastChangedFrom=\d{4}-\d\d-\d\dT\d\d%3A\d\d%3A\d\d\.\d{3}%2B09%3A00/.test(lc.q), '조회 시각 꼴 +09:00 · 밀리초', lc && lc.q);
    const a = await H.api('POST', '/nv/feed', { ack: out.map((x) => x.k) }); ok(a.j && !a.j.out.some((x) => out.some((y) => y.k === x.k && y.c !== 'crm_naver_orders' && y.c !== 'nv_listings')), '받음 확인(ack) → 줄에서 빠짐');
    await wait(1500); const b2 = await H.api('POST', '/nv/feed', {}); ok(b2.j && !b2.j.out.some((x) => x.c === 'crm_naver_orders' && x.id === 'PO1'), '같은 주문은 다시 읽어도 바뀌지 않았으면 다시 넘기지 않음(지문)'); }
  /* 401 → 토큰 다시 · 429 → 쉼 */
  { const n0 = F.S.tokN; F.S.r401 = 1; const r = await H.api('POST', '/nv/cmd', { k: 'cats' }); await wait(200); ok(F.S.tokN > n0, '401(GW.AUTHN) → 토큰 다시 받고 한 번 더(원문 권장)', F.S.tokN - n0); void r;
    F.S.r429 = 1; await H.api('POST', '/nv/cmd', { k: 'sync', prd: true }); const c = await until(async () => { const s = await H.api('GET', '/nv/st'); return s.j.nv.cool ? s.j.nv : null; }, 40); ok(c && c.cool > Date.now() - 2000, '429 → 쉼(cool) 표시', c && c.cool); await wait(1500); }
  /* 쓰기 */
  { const r0 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'disp|PO1|CJGLS|6000555544443', k: 'dispatch', rows: [{ po: 'PO1', co: 'CJGLS', no: '6000555544443' }] } }); ok(r0.j && r0.j.ok === false && /꺼져/.test(r0.j.err || '') && !F.S.dispatched.length, '쓰기 꺼짐(기본) — 발송 맡김 거절', r0.j && r0.j.err);
    const w = await H.api('POST', '/nv/cmd', { k: 'write', on: true, by: '시험' }); ok(w.j && w.j.ok && w.j.nv.write.on, '연결 시험이 맞았으니 쓰기 켬');
    const r1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'disp|PO1|CJGLS|6000555544443', k: 'dispatch', rows: [{ po: 'PO1', co: 'CJGLS', no: '6000555544443' }] } }); ok(r1.j && r1.j.ok && r1.j.queued, '발송 맡김 받음');
    await until(async () => F.S.dispatched.length, 80); ok(F.S.dispatched.length === 1 && F.S.dispatched[0].trackingNumber === '6000555544443' && F.S.dispatched[0].deliveryMethod === 'DELIVERY' && /\+09:00$/.test(F.S.dispatched[0].dispatchDate), '발송 처리 1건(택배·송장·배송일 +09:00)', F.S.dispatched[0]);
    const r2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'disp|PO1|CJGLS|6000555544443', k: 'dispatch', rows: [{ po: 'PO1', co: 'CJGLS', no: '6000555544443' }] } }); await wait(800); ok(r2.j && r2.j.dup && F.S.dispatched.length === 1, '같은 할 일 두 번 안 함');
    const r3 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'disp|PO2|CJGLS|6000555544443', k: 'dispatch', rows: [{ po: 'PO2', co: 'CJGLS', no: '6000555544443' }] } }); ok(r3.j && r3.j.ok === false && /다른 주문/.test(r3.j.err || ''), '같은 송장번호를 다른 주문에 거절(약속 10)', r3.j && r3.j.err);
    const jr = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'col2_naver_jobs') || null; }, 20); ok(jr && jr.v.st === 'done', '결과 줄(col2_naver_jobs) done');
    /* (naver2) 판매중지 맡김 → 맞으면 그 매물 줄을 곧바로 고쳐 넘김(🛠 처리할 일·🤖 자동 내림이 6시간 기다리지 않음) */
    const s1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvst:661:stop:0:20261111', k: 'status', originNo: '661', to: 'SUSPENSION' } }); ok(s1.j && s1.j.ok && s1.j.queued, '판매중지 맡김 받음');
    const pl = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'nv_listings' && x.id === '661' && x.v.st === 'SUSPENSION') || null; }, 40);
    ok(F.S.statusCh.length >= 1 && pl && pl.v.st === 'SUSPENSION' && pl.v.live === false && pl.v.qty === 0, '판매중지 맞음 → 매물 줄 곧바로 고침(판매중지 · live 아님 · 0권)', JSON.stringify({ v: pl && pl.v, n: F.S.statusCh.length }));
    /* (0.1.36 pend2 · 맡긴 일의 규칙) 만료·늦게 받은 판매 상태 맡김은 받지 않음(로거가 꺼졌다 켜져도 옛 명령을 안 보냄) · 시각이 맞으면 예전처럼 받음 */
    { const n0 = F.S.statusCh.length; const T0 = Date.now();
      const e1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvst:662:stop:0:20261112', k: 'status', originNo: '662', to: 'SUSPENSION', exp: new Date(T0 - 60e3).toISOString(), sendAt: new Date(T0 - 7 * 3600e3).toISOString() } });
      const e2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvst:663:stop:0:20261112', k: 'status', originNo: '663', to: 'SUSPENSION', exp: new Date(T0 + 3600e3).toISOString(), sendAt: new Date(T0 - 31 * 60e3).toISOString() } });
      const e3 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvst:664:stop:0:20261112', k: 'status', originNo: '664', to: 'SUSPENSION', exp: new Date(T0 + 3600e3).toISOString(), sendAt: new Date(T0 - 60e3).toISOString() } });
      await wait(1500); const ids = F.S.statusCh.slice(n0).map((x) => String(x.no || x.originNo || x.url || JSON.stringify(x)));
      ok(e1.j && e1.j.ok === false && e1.j.expired && /만료/.test(e1.j.err || '') && e2.j && e2.j.ok === false && e2.j.late && /늦게/.test(e2.j.err || '') && e3.j && e3.j.ok && e3.j.queued && !ids.some((x) => /662|663/.test(x)), '만료된 맡김·보낸 지 30분 넘은 맡김은 받지 않음(네이버 0건) · 시각이 맞는 맡김은 받음', { e1: e1.j, e2: e2.j, e3: e3.j, ids }); }
    /* (naver2) 등록 — 빠진 칸이면 사진도 안 올리고 거절 · 다 있으면 우리 사진 저장소 주소만 내려받아 올리고 → 등록 */
    const BK = { title: '등록 시험 책', isbn13: '9788900000011', author: '저자1', publisher: '출판사', pubDate: '2020-03-15', grade: '상', price: 8000, qty: 1, sku: 'SKU9' }; const G0 = { leafCategoryId: '50005000', deliveryCompany: 'HYUNDAI', baseFee: 3000, asTel: '000-0000-0000' };
    const IMG = 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/p%2F1.jpg?alt=media&token=t';
    const g1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L1:1', k: 'reg', book: BK, g: G0, imgs: [IMG] } }); ok(g1.j && g1.j.queued, '등록 맡김 받음(주소록 번호 빠짐)');
    const jr1 = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'col2_naver_jobs' && x.v.id === 'nvreg:L1:1') || null; }, 40);
    ok(jr1 && jr1.v.st === 'fail' && /출고지 주소록 번호/.test(jr1.v.err) && !F.S.imgGet && !F.S.created.length, '빠진 칸(출고지·반품지) — 사진도 안 받고 등록 안 함 · 까닭', jr1 && jr1.v.err);
    const g2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L1:2', k: 'reg', book: BK, g: { ...G0, shippingAddressId: 101, returnAddressId: 102 }, imgs: ['https://example.com/x.jpg', IMG] } }); ok(g2.j && g2.j.queued, '등록 맡김 받음(칸 모두)');
    const jr2 = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'col2_naver_jobs' && x.v.id === 'nvreg:L1:2') || null; }, 60);
    const cb = F.S.created[0] && F.S.created[0].originProduct; ok(jr2 && jr2.v.st === 'done' && jr2.v.originNo === '8801' && F.S.imgGet === 1 && cb && cb.images.representativeImage.url === 'https://shop-phinf.pstatic.net/t0.jpg' && cb.saleType === 'OLD' && cb.deliveryInfo.claimDeliveryInfo.shippingAddressId === 101, '등록 맞음 — 우리 사진 저장소 주소만 받아(다른 곳은 안 받음) 네이버에 올린 주소로 · 원상품번호', jr2 && { v: jr2.v, img: F.S.imgGet });
    /* (0.1.34 rel10 · 11/11 정밀 점검 1-2) 이중 등록 0 — ① 같은 SKU가 이미 네이버에 있으면 새로 올리지 않음 ② 네이버 답을 못 받은 등록(시간 넘음·5xx)은 '확인 필요'로 한 일 장부에 남겨 같은 열쇠를 다시 안 보냄 */
    const cN = F.S.created.length; await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L2:1', k: 'reg', book: { ...BK, sku: 'SKU2' }, g: { ...G0, shippingAddressId: 101, returnAddressId: 102 }, imgs: [IMG] } });
    const jd1 = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'col2_naver_jobs' && x.v.id === 'nvreg:L2:1') || null; }, 60);
    const sq = F.S.log.filter((x) => x.p === '/v1/products/search' && /SELLER_CODE/.test(x.b || '') && /SKU2/.test(x.b || ''));
    ok(jd1 && jd1.v.st === 'done' && jd1.v.already === true && jd1.v.originNo === '662' && F.S.created.length === cN && sq.length >= 1, '같은 SKU(SKU2)가 이미 네이버에 있음 → 새로 올리지 않고 그 원상품번호로 끝(POST /v2/products 0건)', jd1 && { v: jd1.v, c: F.S.created.length - cN, sq: sq.length });
    F.S.c504 = 1; await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L3:1', k: 'reg', book: { ...BK, sku: 'SKU8' }, g: { ...G0, shippingAddressId: 101, returnAddressId: 102 }, imgs: [IMG] } });
    const jd2 = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'col2_naver_jobs' && x.v.id === 'nvreg:L3:1') || null; }, 60);
    const again = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L3:1', k: 'reg', book: { ...BK, sku: 'SKU8' }, g: { ...G0, shippingAddressId: 101, returnAddressId: 102 }, imgs: [IMG] } }); await wait(2500);
    ok(jd2 && jd2.v.st === 'fail' && jd2.v.unsure === true && /확인/.test(jd2.v.err || '') && F.S.post504 === 1 && F.S.created.length === cN && again.j && again.j.dup && again.j.res && again.j.res.unsure && F.S.post504 === 1, '네이버 답을 못 받은 등록(504) → 확인 필요로 장부에 남김 · 같은 열쇠를 다시 맡겨도 다시 안 보냄', { v: jd2 && jd2.v, again: again.j, p: F.S.post504 });
    /* (0.1.23 naver3) 판매가 바꾸기 · 요청 승인 */
    const p0 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvpx:661:50', k: 'price', originNo: '661', price: 50 } }); ok(p0.j && p0.j.ok === false && /판매가/.test(p0.j.err || ''), '판매가 100원 밑이면 거절', p0.j && p0.j.err);
    const p1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvpx:661:8500', k: 'price', originNo: '661', price: 8500 } }); ok(p1.j && p1.j.queued, '판매가 바꾸기 맡김 받음');
    const pp = await until(async () => { const r = await H.api('POST', '/nv/feed', {}); return (r.j.out || []).find((x) => x.c === 'nv_listings' && x.id === '661' && x.v.price === 8500) || null; }, 40);
    const pv = F.S.prices[0] && F.S.prices[0].multiProductUpdateRequestVos && F.S.prices[0].multiProductUpdateRequestVos[0]; ok(pv && pv.originProductNo === 661 && pv.multiUpdateTypes.join() === 'SALE_PRICE' && pv.productSalePrice.salePrice === 8500 && pp && pp.v.price === 8500, '판매가 multi-update(SALE_PRICE만) → 맞으면 매물 줄 값 곧바로', { pv, v: pp && pp.v });
    const a0 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvcl:PO2:cancel:CL2', k: 'claim', po: 'PO2', act: 'refund' } }); ok(a0.j && a0.j.ok === false, '모르는 승인 종류 거절');
    const a1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvcl:PO2:cancel:CL2', k: 'claim', po: 'PO2', act: 'cancel' } }); const a2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvcl:PO33:exchange:CL3', k: 'claim', po: 'PO33', act: 'exchange' } }); ok(a1.j && a1.j.queued && a2.j && a2.j.queued, '취소 승인·교환 수거 승인 맡김 받음', JSON.stringify([a1.j && { ...a1.j, nv: 0 }, a2.j && { ...a2.j, nv: 0 }]));
    await until(async () => F.S.approved.length >= 2, 60); ok(F.S.approved.includes('PO2:cancel') && F.S.approved.includes('PO33:exchange/collect'), '취소 요청 승인 · 교환 수거 완료 승인 길(원문 seller-approve-*)', F.S.approved);
    await H.api('POST', '/nv/cmd', { k: 'write', on: false, by: '시험' }); }
  /* (0.1.23 naver3) 문의·정산 읽기(저절로) · 클레임 줄 */
  { const got = {}; await until(async () => { const r = await H.api('POST', '/nv/feed', {}); for (const x of (r.j.out || [])) got[x.c + '/' + x.id] = x.v; return got['nv_inq/c501'] && got['nv_inq/q701'] && got['nv_settle/20261109_ACCOUNT'] ? 1 : 0; }, 80);
    const all = JSON.stringify(got); ok(got['nv_inq/c501'] && got['nv_inq/c501'].ans === false && got['nv_inq/c502'] && got['nv_inq/c502'].ans === true && got['nv_inq/q701'] && got['nv_inq/q701'].kind === 'qna', '문의 줄(nv_inq) — 고객 문의 답 안 함·답함 · 상품 문의', Object.keys(got).filter((k) => /nv_inq/.test(k)));
    ok(got['nv_settle/20261109_ACCOUNT'] && got['nv_settle/20261109_ACCOUNT'].amt === 8490 && !/000000000000|예금주이름|구매자이름|buyerid9|ab\*\*\*/.test(all), '일별 정산 줄(nv_settle) · 계좌·예금주·구매자 이름·아이디는 어디에도 없음');
    const s = (await H.api('GET', '/nv/st')).j.nv; ok(s.inq && s.inq.n === 3 && s.inq.un === 2 && !s.inq.err && s.stl && s.stl.days === 1 && !s.stl.err && F.S.caseQ >= 3, '상태 — 문의 3건(답 안 함 2) · 정산 일별 1줄 · 건별은 날마다 물음', { inq: s.inq, stl: s.stl, caseQ: F.S.caseQ }); }
  { const r = await H.api('POST', '/nv/feed', {}); void r; }
  /* 문의 권한 없음 → 까닭만(주문 읽기는 그대로) */
  { F.S.noInq = true; await H.api('POST', '/nv/cmd', { k: 'sync', all: true }); const s = await until(async () => { const x = (await H.api('GET', '/nv/st')).j.nv; return x.inq && x.inq.err ? x : null; }, 60); F.S.noInq = false;
    ok(s && /권한 없음/.test(s.inq.err) && /문의/.test(s.inq.err) && !s.ord.err, '고객 문의 권한 없음 — 「문의」 API 그룹을 더하라는 까닭 · 주문 읽기는 실패 아님', s && { inq: s.inq, ord: s.ord }); }
  /* IP 막힘 */
  { F.S.ip = true; const r = await H.api('POST', '/nv/cmd', { k: 'test' }); F.S.ip = false; ok(r.j && r.j.test && r.j.test.ok === false && r.j.test.ip && /API 호출 IP/.test(r.j.test.msg), 'IP 막힘 — 로거 공인 IP를 넣으라는 안내', r.j && r.j.test && r.j.test.msg);
    const r2 = await H.api('POST', '/nv/cmd', { k: 'test' }); ok(r2.j && r2.j.test && r2.j.test.ok, '다시 시험 — 맞음'); }
  /* (nvfix1 · 정범님 11/11 절대 지시) 🛑 와이파이만 — 테더링·모름이면 바깥 요청 0건 */
  console.log('⑤ 🛑 와이파이 문');
  { const blockCase = async (name, setup, re, wantIp0) => { await setup(); const n0 = nvN(), i0 = F.S.ipHits || 0; const r = await H.api('POST', '/nv/cmd', { k: 'test' }); await wait(2500); /* 그사이 저절로 도는 주문·상품 읽기도 막혀야 함 */
      const s = (await H.api('GET', '/nv/st')).j.nv; const dn = nvN() - n0, di = (F.S.ipHits || 0) - i0;
      ok(r.j && r.j.test && r.j.test.ok === false && /🛑 와이파이 아님 — 네이버 일 멈춤/.test(r.j.test.msg) && re.test(r.j.test.msg) && dn === 0 && (wantIp0 ? di === 0 : true) && s.net && s.net.ok === false && re.test(s.net.why), `${name} — 네이버 요청 0건${wantIp0 ? ' · 공인 IP 확인도 0건' : ''} · 상태에 까닭`, { dn, di, msg: r.j && r.j.test && r.j.test.msg, net: s.net }); return { dn, di }; };
    await blockCase('휴대폰 USB 테더링(RNDIS)이 먼저', () => net(TETH), /휴대폰 테더링/, true);
    await blockCase('블루투스 테더링', () => net([{ m: 20, name: '블루투스 네트워크 연결', desc: 'Bluetooth Device (Personal Area Network)', media: 10, itype: 6 }, ...WIFI]), /휴대폰 테더링/, true);
    await blockCase('아이폰 USB(Apple Mobile Device Ethernet)', () => net([{ m: 20, name: '이더넷 2', desc: 'Apple Mobile Device Ethernet', media: 14, pmt: '802.3', itype: 6 }]), /휴대폰 테더링/, true);
    await blockCase('길을 모름(경로 읽기 실패)', () => net({ fail: true }), /읽지 못함/, true);
    await blockCase('나가는 길 없음', () => net([]), /기본 경로/, true);
    await blockCase('유선(이더넷)', () => net([{ m: 15, name: '이더넷', desc: 'Realtek PCIe GbE Family Controller', media: 14, pmt: '802.3', itype: 6 }]), /유선/, true);
    await blockCase('와이파이와 테더링이 같은 우선순위', () => net([{ ...WIFI[0], m: 30 }, { ...TETH[0], m: 30 }]), /같은 우선순위/, true);
    await blockCase('와이파이지만 공인 IP가 등록한 고정 IP와 다름(휴대폰 핫스팟 등)', () => { net(WIFI); F.S.myip = '198.51.100.44'; }, /198\.51\.100\.44가 등록한 고정 IP 203\.0\.113\.7와 다름/, false);
    await blockCase('와이파이지만 공인 IP 확인 실패', () => { F.S.myip = '203.0.113.7'; F.S.myipFail = true; }, /공인 IP 확인 실패/, false);
    F.S.myipFail = false;
    { const b = await H.api('POST', '/nv/cmd', { k: 'ip', ip: '1.2.3' }); ok(b.j && b.j.ok === false, '고정 IP 꼴이 아니면 거절', b.j); const g = await H.api('POST', '/nv/cmd', { k: 'ip', ip: '198.51.100.9', by: '시험' }); ok(g.j && g.j.ok && g.j.nv.ipReg === '198.51.100.9', '등록 고정 IP 바꾸기(웹앱 칸) — 상태에 보임', g.j && g.j.nv && g.j.nv.ipReg); }
    await blockCase('등록 고정 IP를 바꾼 뒤 지금 IP와 다름', () => {}, /203\.0\.113\.7가 등록한 고정 IP 198\.51\.100\.9와 다름/, false);
    await H.api('POST', '/nv/cmd', { k: 'ip', ip: '203.0.113.7', by: '시험' });
    { const n0 = nvN(); const r = await H.api('POST', '/nv/cmd', { k: 'test' }); const s = (await H.api('GET', '/nv/st')).j.nv; ok(r.j && r.j.test && r.j.test.ok && nvN() > n0 && s.net && s.net.ok && s.net.kind === 'wifi' && s.net.ip === '203.0.113.7', '와이파이 + 등록 IP 같음 — 다시 부름(🟢)', { msg: r.j && r.j.test && r.j.test.msg, net: s.net }); }
    /* 중간에 바뀜 — 발주 확인 둘을 맡겨 첫째가 네이버에 닿는 순간 테더링으로 → 둘째는 보내지 않고 줄에서 기다림 → 와이파이로 돌아오면 이어서 */
    await H.api('POST', '/nv/cmd', { k: 'write', on: true, by: '시험' }); const c0 = F.S.confirmed.length; let flip = 0; F.S.onReq = (p) => { if (/confirm$/.test(p) && !flip) { flip = 1; net(TETH); } };
    const j1 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'conf|PO1|mid', k: 'confirm', ids: ['PO1'] } }); const j2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'conf|PO2|mid', k: 'confirm', ids: ['PO2'] } });
    await until(async () => flip, 40); const n1 = nvN(); await wait(3000); const s1 = (await H.api('GET', '/nv/st')).j.nv; const f1 = await H.api('POST', '/nv/feed', {}); const jr2 = (f1.j.jres || {})['conf|PO2|mid'];
    ok(j1.j.queued && j2.j.queued && F.S.confirmed.length === c0 + 1 && nvN() === n1 && s1.jobs === 1 && jr2 && jr2.st === 'queued' && /와이파이 아님/.test(jr2.wait || '') && s1.net && !s1.net.ok && !(f1.j.out || []).some((x) => x.c === 'col2_naver_jobs' && x.v.id === 'conf|PO2|mid'), '중간에 테더링으로 바뀜 — 그 자리에서 멈춤 · 남은 발주 확인은 대기(실패로 안 남김) · 그 뒤 네이버 요청 0건', { c: F.S.confirmed.length - c0, dn: nvN() - n1, jobs: s1.jobs, jr2, net: s1.net });
    F.S.onReq = null; net(WIFI); const okB = await until(async () => F.S.confirmed.length === c0 + 2, 60); const s2 = (await H.api('GET', '/nv/st')).j.nv;
    ok(okB && s2.jobs === 0 && s2.net && s2.net.ok, '와이파이로 돌아오면 기다리던 일을 이어서 한 번만 함', { c: F.S.confirmed.length - c0, jobs: s2.jobs });
    await H.api('POST', '/nv/cmd', { k: 'write', on: false, by: '시험' });
    /* 사진 저장소 요청도 문 뒤 — 테더링이면 사진도 안 받음 */
    await H.api('POST', '/nv/cmd', { k: 'write', on: true, by: '시험' }); net(TETH); const g0 = F.S.imgGet || 0; const n2 = nvN();
    await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'nvreg:L9:1', k: 'reg', book: { title: '등록 시험 책', isbn13: '9788900000011', author: '저자1', publisher: '출판사', pubDate: '2020-03-15', grade: '상', price: 8000, qty: 1, sku: 'SKU9' }, g: { leafCategoryId: '50005000', deliveryCompany: 'HYUNDAI', baseFee: 0, returnFee: 3000, exchangeFee: 6000, asTel: '010-0000-0000', asGuide: '문의', shippingAddressId: 101, returnAddressId: 102 }, imgs: ['https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/p%2F2.jpg?alt=media'] } });
    await wait(3000); ok((F.S.imgGet || 0) === g0 && nvN() === n2, '테더링이면 사진 저장소에서도 안 받음 · 네이버 0건', { img: (F.S.imgGet || 0) - g0, dn: nvN() - n2 }); net(WIFI); await wait(2500); await H.api('POST', '/nv/cmd', { k: 'write', on: false, by: '시험' }); }
  /* (naver4) 🔒 와이파이 주소에 묶기 — 확인과 요청 사이 틈 막기 */
  console.log('⑥ 🔒 와이파이 주소에 묶기');
  { const BX = D + '/bindx.json'; const bx = (v) => (v ? fs.writeFileSync(BX, JSON.stringify(v)) : fs.rmSync(BX, { force: true }));
    const ras = () => [...new Set(F.S.log.map((x) => x.ra))]; ok(F.S.log.length > 20 && ras().length === 1 && ras()[0] === '127.0.0.1', '지금까지 나간 요청 모두(네이버·공인 IP 확인·사진) 와이파이 주소 127.0.0.1에서만 나옴', ras());
    /* 가짜 인터페이스 둘 — 와이파이(앞) + 테더링(뒤 · 다른 주소) */
    net([...WIFI, { ...TETH[0], m: 90 }]); const k0 = F.S.log.length; const r = await H.api('POST', '/nv/cmd', { k: 'test' }); const nl = F.S.log.slice(k0);
    ok(r.j && r.j.test && r.j.test.ok && nl.length >= 2 && nl.every((x) => x.ra === '127.0.0.1') && !nl.some((x) => x.ra === '127.0.0.2'), '와이파이·테더링 둘 다 있어도 묶인 와이파이 주소로만 나감(테더링 주소 0건)', nl.map((x) => x.p + '@' + x.ra));
    /* 와이파이 주소를 모름 → 0건 */
    net([{ ...WIFI[0], ip: '' }, { ...TETH[0], m: 90 }]); { const n0 = F.S.log.length; const r2 = await H.api('POST', '/nv/cmd', { k: 'test' }); await wait(1500); const s = (await H.api('GET', '/nv/st')).j.nv;
      ok(r2.j && r2.j.test && !r2.j.test.ok && F.S.log.length === n0 && s.net && !s.net.ok && /주소\(IPv4\)를 모름/.test(s.net.why), '와이파이 주소(IPv4)를 모르면 보내지 않음 — 네이버·공인 IP 확인 모두 0건', { dn: F.S.log.length - n0, why: s.net && s.net.why }); }
    net(WIFI);
    /* 보내기 전 소켓 주소가 다름(묶기가 안 들었다고 흉내 — 실제로 127.0.0.2에 묶음) → 연결만 되고 끊음 · 0건 · 멈춤 */
    bx({ bind: '127.0.0.2' }); { const n0 = F.S.log.length; const tS = Date.now(); const r3 = await H.api('POST', '/nv/cmd', { k: 'test' }); const s = (await H.api('GET', '/nv/st')).j.nv;
      ok(r3.j && r3.j.test && !r3.j.test.ok && F.S.log.length === n0 && s.net && !s.net.ok && /소켓 주소/.test(s.net.why) && s.net.sockN >= 1, '보내기 전에 소켓 주소가 와이파이 주소와 다름 → 끊음 · 요청 0건 · 멈춤(상태에 까닭)', { dn: F.S.log.length - n0, why: s.net && s.net.why });
      bx(null); const r4 = await H.api('POST', '/nv/cmd', { k: 'test' }); const late = Date.now() - tS > 5500; /* 기계가 멈춰 멈춤 시간(시험 6초)이 이미 지났으면 이 칸은 볼 수 없음 */ ok(late || (r4.j && r4.j.test && !r4.j.test.ok && F.S.log.length === n0), '멈춤 동안은 길이 돌아와도 바로 안 부름(0건)' + (late ? ' — (기계가 느려 멈춤 시간이 지나 건너뜀)' : ''), r4.j && r4.j.test && r4.j.test.msg); }
    await wait(6300); { const r5 = await H.api('POST', '/nv/cmd', { k: 'test' }); ok(r5.j && r5.j.test && r5.j.test.ok, '멈춤 시간이 지나고 와이파이로 묶이면 다시 맞음', r5.j && r5.j.test && r5.j.test.msg); }
    /* 응답 소켓 주소가 다름 — 네이버 요청은 나갔지만(127.0.0.2) 결과를 버림 */
    bx({ bind: '127.0.0.2', skipConn: true, only: '/v1/oauth2/token' }); { const k1 = F.S.log.length; const t0 = (await H.api('GET', '/nv/st')).j.nv.test; const r6 = await H.api('POST', '/nv/cmd', { k: 'test' }); const nl2 = F.S.log.slice(k1); const s = (await H.api('GET', '/nv/st')).j.nv;
      ok(nl2.some((x) => x.p === '/v1/oauth2/token' && x.ra === '127.0.0.2') && r6.j && r6.j.test && !r6.j.test.ok && /소켓 주소/.test(r6.j.test.msg) && !nl2.some((x) => x.p === '/v1/products/search') && s.net && !s.net.ok && /결과를 버림/.test(s.net.why), '응답이 온 소켓 주소가 와이파이 주소와 다름 → 받은 토큰을 쓰지 않음 · 다음 요청 안 함 · 멈춤 기록', { p: nl2.map((x) => x.p + '@' + x.ra), msg: r6.j && r6.j.test && r6.j.test.msg, why: s.net && s.net.why }); void t0; }
    bx(null); await wait(6300); await H.api('POST', '/nv/cmd', { k: 'test' });
    /* 쓰기(발주 확인)가 응답 소켓 주소 다름으로 버려지면 — 실패(확인 필요)로 남기고 저절로 다시 안 보냄(겹치기 방지) */
    await H.api('POST', '/nv/cmd', { k: 'write', on: true, by: '시험' }); const c0 = F.S.confirmed.length; bx({ bind: '127.0.0.2', skipConn: true, only: '/confirm' });
    await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'conf|PO1|sock', k: 'confirm', ids: ['PO1'] } });
    const jr = await until(async () => { const f = await H.api('POST', '/nv/feed', {}); return (f.j.out || []).find((x) => x.c === 'col2_naver_jobs' && x.v.id === 'conf|PO1|sock') || null; }, 40); bx(null); await wait(6500);
    ok(jr && jr.v.st === 'fail' && jr.v.unsure && /확인해 주세요/.test(jr.v.err) && F.S.confirmed.length === c0 + 1 && (await H.api('GET', '/nv/st')).j.nv.jobs === 0, '쓰기 응답이 다른 소켓 주소로 옴 → 결과 버림 · 「확인 필요」 실패로 남김 · 다시 안 보냄(네이버에 1번만)', { v: jr && jr.v, c: F.S.confirmed.length - c0 });
    const rd2 = await H.api('POST', '/nv/cmd', { k: 'job', job: { id: 'conf|PO1|sock', k: 'confirm', ids: ['PO1'] } }); await wait(800); ok(rd2.j && rd2.j.dup && F.S.confirmed.length === c0 + 1, '같은 할 일을 다시 맡겨도 안 보냄');
    await H.api('POST', '/nv/cmd', { k: 'write', on: false, by: '시험' });
    /* PowerShell 원문 대신(시험은 파일) — 상태 칸 raw가 있고 해석 실패면 '모름' 막음 */
    const s9 = await until(async () => { await H.api('POST', '/nv/cmd', { k: 'test' }); const v = (await H.api('GET', '/nv/st')).j.nv; return v.net && v.net.ok ? v : null; }, 20, 500); ok(s9 && s9.net.lip === '127.0.0.1', '마지막 판단에 묶은 와이파이 주소가 보임', JSON.stringify(s9 && s9.net)); /* 멈춤이 풀린 뒤 */
    /* PowerShell 출력 그대로(실제와 같은 해석 길) — 첫 실행 원문이 상태에 남고 PnP 일련번호는 가림 · 해석 실패면 '모름'으로 막음 */
    const PSOUT = 'ok:' + JSON.stringify({ ...WIFI[0], rm: 0, im: 35 }); fs.writeFileSync(NETF, JSON.stringify({ ps: PSOUT })); const r7 = await H.api('POST', '/nv/cmd', { k: 'test' }); const s7 = (await H.api('GET', '/nv/st')).j.nv; const rw = s7.net && s7.net.raw;
    ok(r7.j && r7.j.test && r7.j.test.ok && rw && rw.ok && rw.n === 1 && rw.L[0].ix === 12 && rw.L[0].kind === 'wifi' && rw.L[0].im === 35 && /Intel/.test(rw.txt) && !/11583659/.test(rw.txt) && /PCI\\\\VEN_8086&DEV_A0F0/.test(rw.txt), 'PowerShell 원문(어댑터 이름·종류·인터페이스 번호·metric)이 상태에 남음 · PnP 뒤 일련번호는 가림', rw);
    fs.writeFileSync(NETF, JSON.stringify({ ps: 'Get-NetRoute : 오류\nok:[{"name":"Wi-Fi"' })); { const n0 = nvN(); const r8 = await H.api('POST', '/nv/cmd', { k: 'test' }); const s8 = (await H.api('GET', '/nv/st')).j.nv;
      ok(r8.j && r8.j.test && !r8.j.test.ok && nvN() === n0 && s8.net && !s8.net.ok && /읽지 못함/.test(s8.net.why) && s8.net.raw && s8.net.raw.ok === false && /해석 실패/.test(s8.net.raw.err), '해석 실패 → \'모름\'으로 막음(0건) · 원문과 까닭이 상태에', s8.net); }
    ok(!NVM.netParse(null, 'ok:[{"name":"x"}]').v && NVM.netParse(null, 'ok:{"m":5}').v.length === 1 && !NVM.netParse({ code: 1 }, 'ok:[]').v && !NVM.netParse(null, '[]').v, '해석 — m 없음·오류·ok: 없음이면 모름 · 하나짜리는 목록으로');
    { /* (naver5) 실제 Windows 꼴 — 한글 어댑터 이름 · 하나짜리 · 5.1의 value/Count 싸개 · BOM·경고 줄 · 숫자가 글자로 · Preferred 주소 */
      const KO = { m: '35', ix: '12', name: 'Wi-Fi', desc: 'Intel(R) Wi-Fi 6 AX201 160MHz', media: '9', pmt: 'Native 802.11', itype: '71', pnp: 'PCI\\VEN_8086', gw: '192.168.0.1', ip: '192.168.0.20' };
      const pr = (t) => NVM.netParse(null, t).v; const a1 = pr('﻿ok:' + JSON.stringify(KO)), a2 = pr('ok:' + JSON.stringify({ value: [KO], Count: 1 })), a3 = pr('경고: 무엇 ok: 아님\nok:[' + JSON.stringify(KO) + ']\r\n');
      ok(a1 && a2 && a3 && [a1, a2, a3].every((v) => v.length === 1 && v[0].m === 35 && v[0].itype === 71 && NVM.netPick(v).ok && NVM.netPick(v).lip === '192.168.0.20'), '실제 꼴 — BOM · 하나짜리 객체 · {value,Count} 싸개 · 경고 줄 뒤 ok: 줄 · 글자 숫자 → 모두 같은 와이파이 판단', [a1, a2, a3]);
      ok(!pr('ok:null') && !pr('ok:{"value":"x","Count":1}') && NVM.netPick(pr('ok:[]')).ok === false, '빈 꼴·이상한 싸개 = 모름(막음)');
      const K = NVM.netKind; ok(K({ name: '로컬 영역 연결* 12', desc: 'Microsoft Wi-Fi Direct Virtual Adapter #2', itype: 71, media: 9 }) === 'tether' && K({ name: '이더넷 3', desc: 'Remote NDIS based Internet Sharing Device', itype: 6, media: 14 }) === 'tether' && K({ name: '블루투스 네트워크 연결', desc: 'Bluetooth Device (Personal Area Network)', itype: 6, media: 10 }) === 'tether' && K({ name: '이더넷', desc: 'Realtek PCIe GbE Family Controller', itype: 6, media: 14, pmt: '802.3' }) === 'wired', '한글 어댑터 이름 — 핫스팟 가상(로컬 영역 연결*)·원격 NDIS·블루투스 = 테더링 · 이더넷 = 유선');
      ok(K({ name: 'Wi-Fi', desc: 'Realtek 8822CE Wireless LAN 802.11ac PCI-E NIC', itype: 71, media: 0, pmt: 'Unspecified' }) === 'unknown' && K({ name: 'Wi-Fi 2', desc: 'TP-Link Wireless USB Adapter', itype: 71, media: 9, pnp: 'USB\\VID_2357&PID_0120' }) === 'wifi' && K({ name: '연결', desc: '무엇', itype: 71, media: 0 }) === 'unknown' && K({ name: 'Wi-Fi', desc: 'x', itype: 6, media: 0 }) !== 'wifi', '매체를 0(모름)으로 내면 이름이 Wi-Fi여도 모름(막음 · 원문 표로 확인 뒤 정함) · USB 무선 꽂개는 와이파이 · 무선(71) 아니면 와이파이 아님');
      ok(NVM.netPick([{ ...KO, m: 35 }, { ...KO, m: 35 }]).ok && !NVM.netPick([{ ...KO, m: 35 }, { name: '이더넷 3', desc: 'Remote NDIS', itype: 6, m: 35 }]).ok, '같은 와이파이 두 줄(저장된 길 겹침)은 통과 · 같은 우선순위 테더링이 끼면 막음'); }
    net(WIFI); }
  /* 값이 어디에도 없음 */
  { await H.stop(); const t = allText(HOMEd) + H.out(); ok(!t.includes(SECRET) && !t.includes(ID) && !t.includes('TOK') , '자료 폴더(설정·상태·기록·journal)·도우미 출력 어디에도 시크릿·아이디·토큰 없음'); }
  F.srv.close(); try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {}
  L.done('t_naver');
})().catch((e) => { console.log('✗ 시험 오류', e, global.__H ? '\n도우미 출력 끝:\n' + global.__H.out().slice(-2500) : ''); process.exit(1); });
