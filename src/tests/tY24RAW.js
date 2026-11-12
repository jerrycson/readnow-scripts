// tY24RAW — 정범님 11/07 밤 ①: 수집기 예스24 원문 보관(y24_raw·y24_raw_idx) — 손님 칸만 가림·화면 글 칸(MenuName·상품명) 살림·목록 20줄(메뉴·코드 목록은 11/09부터 안 자름)·하루 한 번·뼈대 같으면 다시 안 올림·로그인 길 안 남김·화면 문서는 알라딘 가림(clean)
//  사용: node tY24RAW.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a = src.indexOf("  const Y24R_DK = 'rn-y24raw-day';"); const b = src.indexOf('  let busy = false; const drain = async', a); if (a < 0 || b < 0) { console.log('❌ tY24RAW — 코드 덩어리를 못 찾음'); process.exit(0); }
const code = ((src.match(/\n  const y24Cnt = [^\n]*\n/) || [''])[0]) + src.slice(a, b); /* (11/09) 원문 목록에 건수(cnt) — 덩어리 위 y24Cnt도 함께 */
const shape = (v, d) => { if (d > 6) return '…'; if (Array.isArray(v)) return v.length ? [shape(v[0], d + 1)] : []; if (v && typeof v === 'object') { const o = {}; Object.keys(v).slice(0, 80).forEach((k) => (o[k] = shape(v[k], d + 1))); return o; } return v === null ? 'null' : typeof v; };
const SECRET = /login|logout|passw|pwd|auth|cert|token|member\/(info|modify)|sellerinfo/i;
const GMs = {}; const GM_getValue = (k, d) => (k in GMs ? GMs[k] : d); const GM_setValue = (k, v) => { GMs[k] = JSON.parse(JSON.stringify(v)); };
const G = { __rnAlraw: { clean: (h) => ({ s: String(h).replace(/홍길동/g, '＊'), sk: 'v2fake' }) } };
const store = { y24_raw: {}, y24_raw_idx: {} }; let nid = 0;
const fsx = { collection: (n) => ({ doc: (id) => { id = id || 'auto' + ++nid; return { id, get: async () => ({ data: () => store[n][id] }), set: async (o) => { store[n][id] = { ...(store[n][id] || {}), ...o }; } }; } }) };
const FV = { increment: (x) => x, serverTimestamp: () => 'ts' };
const window = {};
const onY = false; /* (11/12 tfix) 11/10부터 덩어리 안에 '⬆ 예스24 창이 직접 올림'(if (onY) { … }) 이 들어옴 — 이 시험은 원문 고르기·가림만 보므로 알라딘 탭 쪽(onY 아님)으로 돌림 */
const mk = new Function('shape', 'SECRET', 'GM_getValue', 'GM_setValue', 'G', 'window', 'onY', code + '\nreturn { PIIK, maskJ, y24RawKey, y24RawTake };');
const M = mk(shape, SECRET, GM_getValue, GM_setValue, G, window, onY);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info || '').slice(0, 300))); if (!c) bad++; };
(async () => {
  const menus = { Data: Array.from({ length: 30 }, (_, i) => ({ MenuId: 'M' + i, MenuName: '상품 관리 ' + i, MenuPath: '/Product/List' + i })) };
  const r1 = { sig: 'POST /api/Menu/GetMenus', url: '/api/Menu/GetMenus?rnx=y24cap01', page: '/Common/Body', ctype: 'application/json', body: JSON.stringify(menus) };
  await M.y24RawTake(fsx, FV, r1, menus);
  const ix = Object.values(store.y24_raw_idx); const rw = Object.values(store.y24_raw);
  const j = rw[0] ? JSON.parse(rw[0].body) : null;
  ok(ix.length === 1 && rw.length === 1 && ix[0].key === 'POST /api/menu/getmenus' && ix[0].ext === 'json' && !/rnx/.test(ix[0].url), '메뉴 응답 하나를 보관(꼴 = 방식+경로 · rnx 뺌)', ix);
  ok(j && j.Data.length === 30 && j.Data[0].MenuName === '상품 관리 0' && j.Data[29].MenuName === '상품 관리 29', '메뉴 이름(MenuName)은 살림 · (11/09) 메뉴 목록은 줄을 자르지 않음(다른 목록 20줄 자름은 tY24TOUR)', j && j.Data.slice(0, 2));
  const ord = { list: [{ OrderNo: 'Y1', OrdererName: '김손님', ReceiverNm: '이손님', ReceiverTel: '010-0000-0000', ReceiverAddr: '서울시 어딘가', BuyerId: 'abc', ProductName: '어린 왕자', Memo: '문 앞', Price: 9000, Email: 'a@b.com', note: '연락 010 0000 0000' }] };
  await M.y24RawTake(fsx, FV, { sig: 'POST /api/Order/NewOrderConfirmList', url: '/api/Order/NewOrderConfirmList', page: '/Order/NewOrderConfirm', ctype: 'application/json', body: JSON.stringify(ord) }, ord);
  const o2 = Object.values(store.y24_raw).find((x) => /NewOrderConfirmList/i.test(x.key)); const oj = o2 ? JSON.parse(o2.body).list[0] : {};
  ok(oj.OrdererName === '＊' && oj.ReceiverNm === '＊' && oj.ReceiverTel === '＊' && oj.ReceiverAddr === '＊' && oj.BuyerId === '＊' && oj.Memo === '＊' && oj.Email === '＊', '손님 칸(주문인·수령인·전화·주소·손님 아이디·요청·메일) 가림', oj);
  ok(oj.ProductName === '어린 왕자' && oj.OrderNo === 'Y1' && oj.Price === 9000 && /＊전화/.test(oj.note), '상품명·주문번호·값은 살림 · 글 속 전화번호 가림', oj);
  const n0 = Object.keys(store.y24_raw).length; await M.y24RawTake(fsx, FV, r1, menus); ok(Object.keys(store.y24_raw).length === n0, '같은 날 같은 꼴은 다시 안 올림');
  GMs['rn-y24raw-day'] = {}; await M.y24RawTake(fsx, FV, r1, menus); ok(Object.keys(store.y24_raw).length === n0 && Object.values(store.y24_raw_idx).find((x) => x.key === 'POST /api/menu/getmenus').seenN === 1, '다음 날이라도 뼈대가 같고 7일 안이면 본 때만 적음(seenN)');
  await M.y24RawTake(fsx, FV, { sig: 'POST /api/Login/Check', url: '/api/Login/Check', page: '/', ctype: 'application/json', body: '{"a":1}' }, { a: 1 }); ok(!Object.values(store.y24_raw_idx).some((x) => /login/i.test(x.key)), '로그인 길은 남기지 않음');
  await M.y24RawTake(fsx, FV, { sig: 'DOC /Order/NewOrderConfirm', url: '/Order/NewOrderConfirm', page: '/Order/NewOrderConfirm', ctype: 'text/html', body: '<html><body>홍길동 님 <button>조회</button></body></html>' }, null);
  const d1 = Object.values(store.y24_raw).find((x) => x.ext === 'html'); ok(d1 && !/홍길동/.test(d1.body) && /조회/.test(d1.body) && d1.sk === 'v2fake', '화면 문서(DOC)는 알라딘 원문 보관 가림(clean)으로', d1);
  ok(M.PIIK('MenuName') === false && M.PIIK('ProductName') === false && M.PIIK('ReceiverName') === true && M.PIIK('ordrNm') === true && M.PIIK('SellerId') === false, '칸 이름 판정(메뉴·상품 이름은 살림 · 수령인·주문인 이름은 가림)');
  { const m = M.maskJ({ rows: [{ Name: '박손님', Tel: '02-123-4567', Title: '책' }, { Name: '상품 묶음', Count: 3 }] }); ok(m.rows[0].Name === '＊' && m.rows[0].Title === '책' && m.rows[1].Name === '상품 묶음', "전화·주소 칸과 같이 있는 'Name'은 가림 · 혼자 있는 'Name'은 살림", m); }
  console.log(bad ? `❌ tY24RAW 실패 ${bad}` : '✓ tY24RAW 통과');
  process.exit(bad ? 1 : 0); /* (11/12 tfix) 덩어리 끝 Firebase 열쇠 사본 훅(11/10)이 5초마다 기다리는 타이머를 남겨 시험이 끝나지 않던 것 */
})();
