/* t_naver — 🟩 네이버 커머스API 어댑터 (0.1.22 · 정범님 11/11 결정 (나): 고정 IP 로거 PC의 번외가 부름 · 약속 0의 네이버 예외)
 *  ① 전자서명 bcrypt — 원문 docs/auth 보기 값(aaaabbbbcccc · $2a$10$abcdefghijklmnopqrstuv · 1643961623299 → JDJhJDEw…bmsy) 그대로 · 원주율 처음 값
 *  ② 순수 셈 — 주문 줄(주문자 이름·연락처 안 옮김 · 받는 분만) · 상품 줄 · 등록 몸(중고 OLD·BOOKS 고시·ISBN · 빠진 칸이면 안 보냄) · 게이트웨이 오류 한국어
 *  ③ 로거가 아닌 PC — 칸·열쇠·저장 모두 없음(명령 거절)
 *  ④ 로거 PC — 공개 열쇠 → 웹앱과 같은 봉투(WebCrypto RSA-OAEP+AES-GCM) · 틀린 시크릿 = 저장 안 함 · 맞으면 DPAPI 파일에만(평문 없음) · 같은 봉투 두 번·오래된 봉투 거절
 *     · 주문 변경(more 이어 받기) → 상세 → 줄(crm_naver_orders) · 상품 목록(nv_listings) · 받음 확인(ack)이면 줄에서 빠짐 · 401이면 토큰 다시 받고 한 번 더 · 429면 쉼
 *     · 쓰기 기본 끔 → 켜기는 연결 시험이 맞은 뒤 · 발송 1건 · 같은 할 일 두 번 안 함 · 같은 송장 다른 주문 거절 · IP 막힘이면 '로거 공인 IP' 안내
 *     · 상태·기록·설정 파일 어디에도 시크릿·아이디·토큰·전자서명 없음
 * 실행: node tests/t_naver.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const B = require('../helper/col2-bcrypt.js'); const NVM = require('../helper/col2-nv.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const ID = 'nvApp' + Math.random().toString(36).slice(2, 10); const SECRET = '$2a$04$' + 'abcdefghijklmnopqrstuv'.split('').sort(() => Math.random() - 0.5).join('');

function fakeNv() { const S = { log: [], tok: null, ip: false, r429: 0, r401: 0, dispatched: [], confirmed: [], statusCh: [], created: [], tokN: 0 };
  const PO = (i) => ({ order: { orderId: 'O' + i, orderDate: '2026-11-10T10:00:00.000+09:00', paymentDate: '2026-11-10T10:01:00.000+09:00', ordererName: '주문자이름' + i, ordererTel: '010-0000-0000', ordererId: 'buyerid' + i },
    productOrder: { productOrderId: 'PO' + i, productOrderStatus: 'PAYED', placeOrderStatus: 'NOT_YET', productName: '시험 책 ' + i, quantity: 1, unitPrice: 9000, totalPaymentAmount: 9000, paymentCommission: 330, channelCommission: 180, expectedSettlementAmount: 8490, deliveryFeeAmount: 3000, sellerProductCode: 'SKU' + i, productId: '77' + i, originalProductId: '66' + i, shippingDueDate: '2026-11-12T23:59:59.000+09:00', shippingAddress: { name: '받는분' + i, tel1: '010-0000-0000', zipCode: '00000', baseAddress: '시험시 시험로 1', detailedAddress: '101호' }, shippingMemo: '문 앞' } });
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const J = (code, o) => { s.writeHead(code, { 'Content-Type': 'application/json;charset=UTF-8' }); s.end(JSON.stringify(o)); }; S.log.push({ m: q.method, p: u.pathname, q: u.search, auth: q.headers.authorization || null, b });
      if (S.ip) return J(403, { code: 'GW.IP_NOT_ALLOWED', message: '호출이 허용되지 않은 IP입니다.', traceId: 't1' });
      if (u.pathname === '/v1/oauth2/token') { const f = new URLSearchParams(b); S.tokN++; const want = B.nvSign(ID, SECRET, f.get('timestamp')); if (f.get('client_id') !== ID || f.get('client_secret_sign') !== want || f.get('grant_type') !== 'client_credentials' || f.get('type') !== 'SELF') return J(400, { code: 'BAD', message: 'client_secret_sign 불일치' }); S.tok = 'TOK' + Math.random().toString(36).slice(2); return J(200, { access_token: S.tok, expires_in: 10800, token_type: 'Bearer' }); }
      if (q.headers.authorization !== 'Bearer ' + S.tok) return J(401, { code: 'GW.AUTHN', message: '요청을 보낼 권한이 없습니다.' });
      if (S.r401 > 0) { S.r401--; S.tok = 'expired'; return J(401, { code: 'GW.AUTHN', message: '요청을 보낼 권한이 없습니다.' }); }
      if (S.r429 > 0) { S.r429--; return J(429, { code: 'GW.RATE_LIMIT', message: '요청이 많아' }); }
      if (u.pathname === '/v1/products/search') { const o = JSON.parse(b || '{}'); const all = [1, 2, 3].map((i) => ({ originProductNo: 66 + '' + i, channelProducts: [{ channelProductNo: 77 + '' + i, originProductNo: 66 + '' + i, channelServiceType: 'STOREFARM', name: '시험 책 ' + i, sellerManagementCode: 'SKU' + i, statusType: i === 3 ? 'SUSPENSION' : 'SALE', channelProductDisplayStatusType: 'ON', salePrice: 9000, stockQuantity: 1 }, { channelProductNo: 99, channelServiceType: 'WINDOW', statusType: 'SALE' }] }));
        const sz = +o.size || 100; return J(200, { contents: all.slice((o.page - 1) * sz, o.page * sz), page: o.page, size: sz, totalElements: all.length }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/last-changed-statuses') { const ms = u.searchParams.get('moreSequence'); if (!ms) return J(200, { data: { count: 1, lastChangeStatuses: [{ productOrderId: 'PO1', lastChangedType: 'PAYED' }], more: { moreFrom: u.searchParams.get('lastChangedFrom'), moreSequence: '2' } } }); return J(200, { data: { count: 1, lastChangeStatuses: [{ productOrderId: 'PO2', lastChangedType: 'PAYED' }] } }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/query') { const o = JSON.parse(b || '{}'); return J(200, { data: (o.productOrderIds || []).map((id) => PO(id.replace('PO', ''))) }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/dispatch') { const o = JSON.parse(b || '{}'); S.dispatched.push(...(o.dispatchProductOrders || [])); return J(200, { data: { successProductOrderIds: (o.dispatchProductOrders || []).map((x) => x.productOrderId), failProductOrderInfos: [] } }); }
      if (u.pathname === '/v1/pay-order/seller/product-orders/confirm') { const o = JSON.parse(b || '{}'); S.confirmed.push(...(o.productOrderIds || [])); return J(200, { data: { successProductOrderIds: o.productOrderIds, failProductOrderInfos: [] } }); }
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
    const m = NVM.nvBody({ title: '책' }, {}); ok(!m.ok && m.miss.includes('ISBN13') && m.miss.includes('카테고리(도서 › 중고)'), '등록 몸 — 빠진 칸이면 보내지 않음(빠진 칸 이름)', m.miss);
    const g = NVM.nvBody({ title: '시험 책', isbn13: '978-89-0000000-1'.replace(/-/g, '').slice(0, 13).padEnd(13, '1'), author: '저자1, 저자2', publisher: '출판사', pubDate: '20200315', pages: 300, size: '148*210', grade: '상', price: 8000, qty: 1, sku: 'SKU1', images: ['https://shop-phinf.pstatic.net/a.jpg', 'https://shop-phinf.pstatic.net/b.jpg'] }, { leafCategoryId: '50005000', deliveryCompany: 'CJGLS', baseFee: 3000, returnFee: 3000, exchangeFee: 6000, asTel: '000-0000-0000' });
    const op = g.ok && g.body.originProduct; ok(g.ok && op.saleType === 'OLD' && op.statusType === 'SALE' && op.detailAttribute.productInfoProvidedNotice.productInfoProvidedNoticeType === 'BOOKS' && op.detailAttribute.isbnInfo.isbn13.length === 13 && op.detailAttribute.bookInfo.publishDay === '2020-03-15' && op.detailAttribute.bookInfo.authors.length === 2 && op.images.optionalImages.length === 1 && op.detailAttribute.sellerCodeInfo.sellerManagementCode === 'SKU1' && op.deliveryInfo.deliveryFee.deliveryFeeType === 'PAID' && /\[중고-상\]$/.test(op.name), '등록 몸 — 중고(OLD)·BOOKS 고시·ISBN·출간일·저자 둘·사진·관리코드=SKU·유료 배송·이름 끝 [중고-상]', op && op.name);
    ok(/API 호출 IP/.test(NVM.nvErr(403, { code: 'GW.IP_NOT_ALLOWED' }).msg) && NVM.nvErr(401, { code: 'GW.AUTHN' }).auth && NVM.nvErr(429, {}).rate, '게이트웨이 오류 → 한국어 까닭·할 일');
    ok(NVM.kstIso(Date.UTC(2026, 10, 11, 0, 0, 0, 5)) === '2026-11-11T09:00:00.005+09:00', '날짜 꼴 yyyy-MM-ddTHH:mm:ss.SSS+09:00(원문 restful-api)'); }

  const F = await fakeNv(); const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2nv_')); fs.mkdirSync(D + '/bin', { recursive: true });
  fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const env = { RN_COL2_NV: F.base, RN_COL2_DPAPI: D + '/bin/dpapi' }; const cfg0 = { on: false, y24: false, al: false, auto: false, side: false, headless: true, pcSrc: 'pc', nvcfg: { minGapMs: 0, ordMin: 0.02, prdH: 0.0005, cool429Sec: 1 } };

  console.log('③ 로거가 아닌 PC');
  { const H = await L.startHelper({ dir: D + '/office', port: L.PORT + 7, cfg: { ...cfg0, pc: 'HOME' }, env });
    const s = await H.api('GET', '/nv/st'); ok(s.st === 200 && s.j && s.j.nv && s.j.nv.on === false && !s.j.nv.pub, '사무실 PC — 네이버 칸 꺼짐 · 공개 열쇠 없음', s.j && s.j.nv);
    const c = await H.api('POST', '/nv/cmd', { k: 'test' }); ok(c.j && c.j.ok === false && /로거/.test(c.j.err || ''), '명령 거절(로거 PC만)', c.j && c.j.err);
    await wait(600); ok(!fs.existsSync(D + '/office/home/cred/nv-key.dat') && !F.S.log.length, '열쇠 파일 없음 · 네이버를 부르지 않음'); await H.stop(); }

  console.log('④ 로거 PC');
  const H = await L.startHelper({ dir: D + '/lg', port: L.PORT + 8, cfg: { ...cfg0, pc: 'LOGGER' }, env }); const HOMEd = D + '/lg/home'; process.on('exit', () => { try { H.pr.kill('SIGKILL'); } catch (e) {} });
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
    await H.api('POST', '/nv/cmd', { k: 'write', on: false, by: '시험' }); }
  /* IP 막힘 */
  { F.S.ip = true; const r = await H.api('POST', '/nv/cmd', { k: 'test' }); F.S.ip = false; ok(r.j && r.j.test && r.j.test.ok === false && r.j.test.ip && /API 호출 IP/.test(r.j.test.msg), 'IP 막힘 — 로거 공인 IP를 넣으라는 안내', r.j && r.j.test && r.j.test.msg);
    const r2 = await H.api('POST', '/nv/cmd', { k: 'test' }); ok(r2.j && r2.j.test && r2.j.test.ok, '다시 시험 — 맞음'); }
  /* 값이 어디에도 없음 */
  { await H.stop(); const t = allText(HOMEd) + H.out(); ok(!t.includes(SECRET) && !t.includes(ID) && !t.includes('TOK') , '자료 폴더(설정·상태·기록·journal)·도우미 출력 어디에도 시크릿·아이디·토큰 없음'); }
  F.srv.close(); try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {}
  L.done('t_naver');
})().catch((e) => { console.log('✗ 시험 오류', e); process.exit(1); });
