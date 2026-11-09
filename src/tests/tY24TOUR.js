// tY24TOUR — 정범님 11/08 '자동 둘러보기가 끊긴 것 같아' → 11/09 다시 짬: 수집기 예스24 🛰 자동 둘러보기
//  가짜 예스24 판매관리(uscm.yes24.com — 시험 안에서만 꾸민 화면)로 끝까지 돌려 봄:
//  ① 진행 글이 응답 길로 덮이지 않음 · 끝/멈춤 요약이 단추 옆에 남음 ② 화면마다 결과(받음·빈 목록·조회 단추 없음·건너뜀·못 받은 곳) ③ 0건이면 기간 단추 → 시작 날짜 순서로 넓힘
//  ④ 쓰기 단추(상품삭제·주문접수확인·판매불가통보·발송처리 등)는 절대 안 누름 · 화면의 확인 물음(confirm)은 '아니오' ⑤ 비밀번호 확인 화면·묶음 제목은 열지 않음 ⑥ 로그인 화면이면 멈춤 → [못 받은 곳만 다시]
//  ⑦ 시작 주소(rnx=y24auto…)는 y24cap01로 바뀜 · 20분 안 다시 시작 막음 ⑧ 결과를 알라딘 탭이 y24_raw_idx/_tour로 ⑨ 가림 새 규칙(상품명·처리 상태 이름 살림 · ORD_NM·MEM_ID·정산 계좌 가림 · 메뉴 목록 안 자름 · 건수 cnt)
//  시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소)
//  사용: node tY24TOUR.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); }
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a0 = src.indexOf('(function rnY24()'); const b0 = src.indexOf('\n})();', a0); if (a0 < 0 || b0 < 0) { console.log('❌ tY24TOUR — rnY24 덩어리를 못 찾음'); process.exit(0); }
const Y24 = src.slice(a0, b0 + 6);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 600))); if (!c) bad++; };

// ── 가짜 예스24 판매관리
const MENUS = { MENU_ITEM_LIST: [
  { MENU_ID: 'M001', MENU_NAME: '상품관리', PATH: '/Product', PMENU_ID: '' },
  { MENU_ID: 'M001-S05', MENU_NAME: '등록상품 관리', PATH: '/Product/ProductList', PMENU_ID: 'M001' },
  { MENU_ID: 'M001-S02', MENU_NAME: '대량 등록 (엑셀 업로드)', PATH: '/Product/BulkRegistrationByExcel', PMENU_ID: 'M001' },
  { MENU_ID: 'M002', MENU_NAME: '판매관리', PATH: '/Order', PMENU_ID: '' },
  { MENU_ID: 'M002-S01', MENU_NAME: '주문 현황 조회', PATH: '/Order/OrderTotalList', PMENU_ID: 'M002' },
  { MENU_ID: 'M002-S02', MENU_NAME: '신규 주문 확인', PATH: '/Order/NewOrderConfirmList', PMENU_ID: 'M002' },
  { MENU_ID: 'M003-S01', MENU_NAME: '반품 관리', PATH: '/Claim/ReturnList', PMENU_ID: 'M003' },
  { MENU_ID: 'M006-S01', MENU_NAME: '판매자 정보 수정', PATH: '/Seller/SellerInfoUpdate', PMENU_ID: 'M006' },
  { MENU_ID: 'M007-S01', MENU_NAME: '공지사항', PATH: '/Shop/NotificationList', PMENU_ID: 'M007' }] };
const W_BTNS = '<button class="w">상품삭제</button> <button class="w">주문접수확인</button> <button class="w">판매불가통보</button> <button class="w">발송처리</button> <button class="w">판매상태 변경</button> <a class="w" href="#">선택 상품 저장</a>';
const page = (o) => `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="loading-bg" style="position:fixed;inset:0;background:#fff"></div><h1>${o.title}</h1><div id="app"></div>
<script>
var per = '${o.per0 || '7일'}'; var api = '${o.api || ''}';
setTimeout(function () { var h = '';
  ${o.pers ? `h += ${JSON.stringify(o.pers)}.map(function (p) { return '<button type="button" data-per="' + p + '">' + p + '</button>'; }).join(' ') + ' <button type="button">년도선택</button>';` : ''}
  ${o.date ? `h += ' <input id="sd" value="2026-11-02"> ~ <input id="ed" value="2026-11-09">';` : ''}
  ${o.radio ? `h += ' <label><input type="radio" name="goodsStatGb" value=""> 전체</label> <label><input type="radio" name="goodsStatGb" value="02" checked> 판매중</label> <label><input type="checkbox" id="chkAll"> 전체</label>';` : ''}
  ${o.q === false ? '' : `h += ' <button type="button" id="q">조회</button>';`}
  h += ' ${W_BTNS.replace(/'/g, "\\'")}';
  document.getElementById('app').innerHTML = h;
  [].forEach.call(document.querySelectorAll('[data-per]'), function (b) { b.onclick = function () { per = b.getAttribute('data-per'); }; });
  [].forEach.call(document.querySelectorAll('.w'), function (b) { b.onclick = function (e) { e.preventDefault(); (top.__WRITE = top.__WRITE || []).push(b.textContent); var x = new XMLHttpRequest(); x.open('POST', '/api/Write/' + encodeURIComponent(b.textContent)); x.send('{}'); }; });
  var ca = document.getElementById('chkAll'); if (ca) ca.onclick = function () { top.__CHK = (top.__CHK || 0) + 1; };
  var q = document.getElementById('q'); if (q && api) q.onclick = function () { var x = new XMLHttpRequest(); x.open('POST', api); x.setRequestHeader('content-type', 'application/json');
    x.onload = function () { ${o.ask ? `if (confirm('주문접수확인을 하시겠습니까?')) { (top.__WRITE = top.__WRITE || []).push('confirm-yes'); var y = new XMLHttpRequest(); y.open('POST', '/api/Write/AfterConfirm'); y.send('{}'); }` : ''} };
    var st = document.querySelector('input[name=goodsStatGb]:checked'); var sd = document.getElementById('sd'); x.send(JSON.stringify({ per: per, sd: sd ? sd.value : '', stat: st ? st.value : null })); };
  document.getElementById('loading-bg').style.display = 'none'; }, 250);
</script></body></html>`;
const PAGES = {
  '/product/productlist': page({ title: '등록상품 관리', api: '/api/Product/ProductList', pers: ['오늘', '3일', '7일', '1달', '3달', '6달', '1년'], radio: true, date: true }),
  '/product/bulkregistrationbyexcel': page({ title: '대량 등록', q: false }),
  '/order/ordertotallist': page({ title: '주문 현황 조회', api: '/api/Order/OrderTotalList', pers: ['오늘', '3일', '7일', '1달', '3달'], date: true }),
  '/order/neworderconfirmlist': page({ title: '신규 주문 확인', api: '/api/Order/NewOrderConfirmList', ask: true, pers: ['오늘', '3일', '7일', '1달', '3달'] }),
  '/claim/returnlist': page({ title: '반품 관리', api: '' }),
  '/seller/sellerinfoupdate': '<html><body>비밀번호 확인 <input type="password"> <button>확인</button></body></html>',
};
const LOGIN = '<!doctype html><html><body><form>아이디 <input name="id"> 비밀번호 <input type="password" name="pw"> <button>로그인</button></form></body></html>';
const TOP = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="lnb">왼쪽 메뉴</div><script>var x = new XMLHttpRequest(); x.open('POST', '/api/Menu/GetMenus'); x.setRequestHeader('content-type', 'application/json'); x.send('{}');</script></body></html>`;
const rows = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const API = (p, body) => { let b = {}; try { b = JSON.parse(body || '{}'); } catch (e) {}
  if (p === '/api/menu/getmenus') return MENUS;
  if (p === '/api/product/productlist') { const n = b.per === '1년' && b.stat === '' ? 3 : 0; return { PRODUCT_LIST: rows(n, (i) => ({ GOODS_NO: 196000000 + i, GOODS_NM: '책 ' + i, TOTAL_COUNT: n })), TOTAL_COUNT: n }; }
  if (p === '/api/order/ordertotallist') { const n = b.sd && b.sd < '2026-01-01' ? 2 : 0; return { ORDER_LIST: rows(n, (i) => ({ ORD_NO: 'Y' + i, GOODS_NM: '어린 왕자', ORD_JOB_PROC_NM: '배송준비중', ORD_NM: '손님A', TEL_NO: null, TOTAL_COUNT: n })) }; }
  if (p === '/api/order/neworderconfirmlist') return { RESULT_LIST: [{ ORD_NO: 'Y9', GOODS_NM: '새 책', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000' }], TOTAL_COUNT: 1 };
  if (p === '/api/shop/notificationlist') return { NOTICE_LIST: [{ TITLE: '공지 하나' }], TOTAL_COUNT: 1 };
  return { ok: 1 }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (url, init) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const LOG = []; let loginOn = true;
    await p.route('**/*', (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const lp = u.pathname.toLowerCase(); LOG.push(rq.method() + ' ' + lp);
      if (/aladin\.co\.kr$/.test(u.hostname)) return rt.fulfill({ body: '<html><body>알라딘</body></html>', contentType: 'text/html' });
      if (!/uscm\.yes24\.com$/.test(u.hostname)) return rt.fulfill({ status: 404, body: '' });
      if (lp.startsWith('/api/')) return rt.fulfill({ body: JSON.stringify(API(lp, rq.postData())), contentType: 'application/json' });
      if (lp === '/common/body') return rt.fulfill({ body: TOP, contentType: 'text/html' });
      if (lp === '/shop/notificationlist') return rt.fulfill({ body: p.__loginOn !== false ? LOGIN : page({ title: '공지사항', api: '/api/Shop/NotificationList' }), contentType: 'text/html' });
      return rt.fulfill({ body: PAGES[lp] || '<html><body>없는 화면</body></html>', contentType: 'text/html' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); }; window.GM_addValueChangeListener = () => 0; window.__rnY24tourScale = 0.04;
      if (a.fb) { window.__FBW = {}; window.firebase = { apps: [1], auth: () => ({ currentUser: { email: 'x' } }), firestore: Object.assign(() => ({ collection: (c) => ({ doc: (id) => ({ id, get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__FBW[c + '/' + id] = JSON.parse(JSON.stringify(v)); } }), where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }), runTransaction: async () => {} }), { FieldValue: { serverTimestamp: () => 'ts', increment: (x) => x, arrayUnion: (...x) => x } }) }; } }, init || {});
    await p.addInitScript({ content: Y24 });
    await p.goto(url); return { p, LOG }; };

  // ── ① 안 본 곳 둘러보기 (주소로 시작) — 마지막 공지사항은 로그인 화면 → 멈춤
  const { p, LOG } = await mk('https://uscm.yes24.com/Common/Body?rnx=y24auto01');
  const seenBadge = new Set(); const t0 = Date.now(); let T = null;
  while (Date.now() - t0 < 90000) { await p.waitForTimeout(150); const s = await p.evaluate(() => { const d = document.getElementById('rn-y24dock'); const b = d && d.querySelector('div'); return { b: b ? b.textContent : '', T: window.__GM['rn-y24tour'] || null }; }); if (/🛰 \d+\/\d+/.test(s.b)) seenBadge.add(s.b.replace(/.*(🛰 \d+\/\d+[^·]*).*/, '$1').trim()); if (s.T && s.T.end) { T = s.T; break; } }
  const R = (pp) => ((T && T.res) || []).find((r) => r.path.toLowerCase() === pp) || {};
  const st1 = await p.evaluate(() => ({ url: location.href, end: (document.getElementById('rn-y24tourEnd') || {}).innerText || '', redo: (() => { const b = document.querySelector('#rn-y24tourEnd button'); return !!b && b.style.display !== 'none'; })(), W: window.__WRITE || [], CHK: window.__CHK || 0, badge: (document.querySelector('#rn-y24dock div') || {}).textContent || '' }));
  ok(!!T && T.end > 0, '둘러보기가 끝까지 감(끝 시각 남음)', T);
  ok(/rnx=y24cap01/.test(st1.url) && !/y24auto/.test(st1.url), `시작 주소(rnx=y24auto01)가 y24cap01로 바뀜 — 새로 고침·메뉴 누름으로 다시 시작 안 함: ${st1.url}`);
  ok([...seenBadge].some((x) => /^🛰 \d\/7 /.test(x)) && seenBadge.size >= 3, `띠에 '🛰 몇/몇 화면 이름'이 응답 길에 덮이지 않고 보임: ${[...seenBadge].join(' | ')}`);
  ok(R('/product/productlist').st === 'ok' && R('/product/productlist').cnt === 3 && /기간 1년/.test(R('/product/productlist').msg) && /'전체'\(goodsStatGb\)/.test(R('/product/productlist').msg), "0건 → 기간 단추 가장 긴 것(1년)·판매상태 '전체' → 3건", R('/product/productlist'));
  ok(R('/order/ordertotallist').st === 'ok' && R('/order/ordertotallist').cnt === 2 && /기간 3달/.test(R('/order/ordertotallist').msg) && /시작 날짜 20\d\d/.test(R('/order/ordertotallist').msg), '기간 단추로도 0건 → 시작 날짜를 1년 전으로 넣고 한 번 더 → 2건', R('/order/ordertotallist'));
  ok(R('/order/neworderconfirmlist').st === 'ok' && /확인 물음\(아니오로 답함\)/.test(R('/order/neworderconfirmlist').msg), "화면이 띄운 확인 물음('주문접수확인을 하시겠습니까?')은 '아니오'로 답하고 글만 적음", R('/order/neworderconfirmlist'));
  ok(R('/product/bulkregistrationbyexcel').st === 'nobtn' && R('/claim/returnlist').st === 'fail', `조회 단추 없는 화면 = nobtn · 조회해도 응답이 없으면 fail: ${R('/product/bulkregistrationbyexcel').st}/${R('/claim/returnlist').st}`);
  ok(R('/seller/sellerinfoupdate').st === 'skip' && !LOG.some((x) => /sellerinfoupdate/.test(x)), '판매자 정보 수정(비밀번호 확인 화면)은 열지 않고 건너뜀', R('/seller/sellerinfoupdate'));
  ok(!LOG.some((x) => /^GET \/(product|order)$/.test(x)) && !(T.res || []).some((r) => /^\/(product|order)$/i.test(r.path)) && T.n === 7, `묶음 제목(/Product·/Order)은 열지 않음 · 할 곳 7: ${T && T.n}`);
  ok(T.stop === 'login' && R('/shop/notificationlist').st === 'fail' && /로그인/.test(st1.end) && st1.redo, `로그인 화면이 열리면 멈춤 · 단추 옆 요약 '로그인이 풀려 멈춤' + [🔁 못 받은 곳·빈 목록만 다시]: ${st1.end}`);
  ok(/받음 3 · 빈 목록 0 · 조회 단추 없음 1 · 못 받은 곳 2 · 건너뜀 1\(판매자 정보 수정/.test(st1.end), `끝 요약 숫자: ${st1.end}`);
  ok(!LOG.some((x) => /\/api\/write\//.test(x)) && !st1.W.length && !st1.CHK, `쓰기 단추(상품삭제·주문접수확인·판매불가통보·발송처리·판매상태 변경·저장)·전체 선택 칸은 한 번도 안 눌림 · 쓰기 요청 0: ${JSON.stringify(st1.W)} ${st1.CHK}`);
  const docBefore = LOG.filter((x) => x === 'GET /product/productlist').length;
  // ── ② 다시 로그인한 뒤 [🔁 못 받은 곳·빈 목록만 다시] — 반품 관리·공지사항만 다시 엶
  p.__loginOn = false; await p.evaluate(() => document.querySelector('#rn-y24tourEnd button').click());
  let T2 = null; const t1 = Date.now(); while (Date.now() - t1 < 60000) { await p.waitForTimeout(200); const v = await p.evaluate(() => window.__GM['rn-y24tour']); if (v && v.end && v.at > T.at) { T2 = v; break; } }
  const R2 = (pp) => ((T2 && T2.res) || []).find((r) => r.path.toLowerCase() === pp) || {};
  ok(T2 && T2.mode === 'redo' && T2.n === 2 && !T2.stop && R2('/shop/notificationlist').st === 'ok' && R2('/product/productlist').st === 'ok' && LOG.filter((x) => x === 'GET /product/productlist').length === docBefore, `[못 받은 곳만 다시]: 못 받은 2곳만 다시 엶 · 받은 곳 결과는 그대로 합침: ${JSON.stringify(T2 && { mode: T2.mode, n: T2.n, sum: T2.sum })}`);
  ok(!LOG.some((x) => /\/api\/write\//.test(x)), '다시 돌 때도 쓰기 요청 0');
  await p.context().close();

  // ── ③ 20분 안에 같은 시작 주소가 또 오면(둘러보기가 아직 안 끝남) 다시 시작하지 않음 · 모두 다시(y24autoall)는 끝난 뒤면 시작
  { const { p: p3, LOG: L3 } = await mk('https://uscm.yes24.com/Common/Body?rnx=y24autoall', { seed: { 'rn-y24tourUrlAt': Date.now() - 60e3, 'rn-y24tour': { at: Date.now() - 60e3, end: 0, res: [] } } }); await p3.waitForTimeout(6000);
    const b3 = await p3.evaluate(() => (document.querySelector('#rn-y24dock div') || {}).textContent || ''); ok(!L3.some((x) => /productlist/.test(x)) && /다시 시작하지 않음/.test(b3), `20분 안 다시 시작 막음: ${b3}`); await p3.context().close(); }
  { const { p: p4, LOG: L4 } = await mk('https://uscm.yes24.com/Common/Body?rnx=y24autoall', { seed: { 'rn-y24tourUrlAt': Date.now() - 60e3, 'rn-y24tour': { at: Date.now() - 60e3, end: Date.now() - 30e3, res: [] }, 'rn-y24seen': { '/Product/ProductList': 1 } } }); await p4.waitForTimeout(7000);
    ok(L4.some((x) => /productlist/.test(x)), '앞 둘러보기가 끝났으면 모두 다시(본 화면까지)는 시작함'); await p4.context().close(); }

  // ── ④ 알라딘 수집기 탭: 결과를 y24_raw_idx/_tour로 (화면 경로·이름·결과만)
  { const { p: p5 } = await mk('https://www.aladin.co.kr/scm/x', { fb: true, seed: { 'rn-y24tour': T2 || T } }); await p5.waitForTimeout(11500);
    const d = await p5.evaluate(() => (window.__FBW || {})['y24_raw_idx/_tour'] || null); const s = JSON.stringify(d || {});
    ok(d && d.tour && d.res && d.res.length === 7 && d.end && d.sum && d.sum.ok >= 3 && !/손님|010-/.test(s), `둘러보기 결과를 y24_raw_idx/_tour로 올림(손님 정보 없음): ${s.slice(0, 200)}`); await p5.context().close(); }
  await br.close(); return errs; };

// ── ⑤ 가림 새 규칙 · 메뉴 목록 안 자름 · 건수(cnt) — 알라딘 쪽 덩어리만 떼어 돌림(tY24RAW와 같은 방식)
const unit = async () => { const a = src.indexOf("  const Y24R_DK = 'rn-y24raw-day';"); const b = src.indexOf('  let busy = false; const drain = async', a); const cl = src.match(/\n  const y24Cnt = [^\n]*\n/);
  if (a < 0 || b < 0 || !cl) { ok(false, '가림 덩어리를 못 찾음'); return; }
  const shape = (v, d) => { if (d > 6) return '…'; if (Array.isArray(v)) return v.length ? [shape(v[0], d + 1)] : []; if (v && typeof v === 'object') { const o = {}; Object.keys(v).slice(0, 80).forEach((k) => (o[k] = shape(v[k], d + 1))); return o; } return v === null ? 'null' : typeof v; };
  const GMs = {}; const store = { y24_raw: {}, y24_raw_idx: {} }; let nid = 0;
  const fsx = { collection: (n) => ({ doc: (id) => { id = id || 'auto' + ++nid; return { id, get: async () => ({ data: () => store[n][id] }), set: async (o) => { store[n][id] = { ...(store[n][id] || {}), ...o }; } }; } }) };
  const M = new Function('shape', 'SECRET', 'GM_getValue', 'GM_setValue', 'G', 'window', cl[0] + src.slice(a, b) + '\nreturn { PIIK, maskJ, y24RawTake, y24Cnt };')(shape, /login|passw|sellerinfo/i, (k, d) => (k in GMs ? GMs[k] : d), (k, v) => { GMs[k] = JSON.parse(JSON.stringify(v)); }, {}, {});
  const tot = M.maskJ({ ORDER_LIST: [{ ORD_NO: 'Y1', GOODS_NM: '어린 왕자', ORD_JOB_PROC_NM: '배송준비중', TEL_NO: null, ORD_NM: '손님A', MEM_ID: 'abc123', DELV_ENTR_NM: '롯데택배', CD_DTL_NM: '주문접수', RCVR_NM: '손님A', SETTLE_DEP_NM: '손님A' }] }).ORDER_LIST[0];
  ok(tot.GOODS_NM === '어린 왕자' && tot.ORD_JOB_PROC_NM === '배송준비중' && tot.DELV_ENTR_NM === '롯데택배' && tot.CD_DTL_NM === '주문접수' && tot.ORD_NO === 'Y1', '빈 전화 칸(TEL_NO: null)이 있어도 상품명·처리 상태 이름·택배사·코드 이름은 살림', tot);
  ok(tot.ORD_NM === '＊' && tot.MEM_ID === '＊' && tot.RCVR_NM === '＊' && tot.SETTLE_DEP_NM === '＊', '주문자 이름(ORD_NM)·손님 아이디(MEM_ID)·받는 분·입금자 이름은 가림', tot);
  const sel = M.maskJ({ SETTLE_ACCNT_NO: '123-456-7890', FAX_NO: '02-000-0000', BANK_CD: '004', SELLER_NM: '북스퀸', MENU_NAME: '판매자 정보' });
  ok(sel.SETTLE_ACCNT_NO === '＊' && sel.FAX_NO === '＊' && sel.BANK_CD === '＊' && sel.MENU_NAME === '판매자 정보', '정산 계좌번호·팩스·은행 코드 가림 · 메뉴 이름 살림', sel);
  ok(M.PIIK('ReceiverNm') && M.PIIK('ordrNm') && M.PIIK('OrdererName') && M.PIIK('BuyerId') && M.PIIK('ReceiverTel') && !M.PIIK('ProductName') && !M.PIIK('SellerId') && !M.PIIK('MenuName') && !M.PIIK('ORD_NO'), '예전 꼴 칸 이름(camelCase)도 같게 판정');
  { const m = M.maskJ({ rows: [{ Name: '손님A', Tel: '02-000-0000', Title: '책' }, { Name: '상품 묶음', Tel: null }] }); ok(m.rows[0].Name === '＊' && m.rows[1].Name === '상품 묶음', "전화 칸에 값이 있을 때만 그 줄의 'Name'을 가림", m); }
  const menus = { MENU_ITEM_LIST: Array.from({ length: 39 }, (_, i) => ({ MENU_ID: 'M' + i, MENU_NAME: '메뉴 ' + i, PATH: '/X/' + i })) };
  await M.y24RawTake(fsx, { increment: (x) => x, serverTimestamp: () => 'ts' }, { sig: 'POST /api/Menu/GetMenus', url: '/api/Menu/GetMenus', page: '/Common/Body', ctype: 'application/json', body: JSON.stringify(menus) }, menus);
  const big = { PRODUCT_LIST: Array.from({ length: 30 }, (_, i) => ({ GOODS_NM: '책 ' + i, TOTAL_COUNT: 1234 })) };
  await M.y24RawTake(fsx, { increment: (x) => x, serverTimestamp: () => 'ts' }, { sig: 'POST /api/Product/ProductList', url: '/api/Product/ProductList', page: '/Product/ProductList', ctype: 'application/json', body: JSON.stringify(big) }, big);
  const rw = Object.values(store.y24_raw); const mj = JSON.parse((rw.find((x) => /getmenus/.test(x.key)) || {}).body || '{}'); const pj = JSON.parse((rw.find((x) => /productlist/.test(x.key)) || {}).body || '{}');
  ok(mj.MENU_ITEM_LIST && mj.MENU_ITEM_LIST.length === 39 && pj.PRODUCT_LIST && pj.PRODUCT_LIST.length === 21, `메뉴 목록은 39줄 다 남김 · 다른 목록은 20줄 + '…외 n줄': ${mj.MENU_ITEM_LIST && mj.MENU_ITEM_LIST.length}/${pj.PRODUCT_LIST && pj.PRODUCT_LIST.length}`);
  const ix = Object.values(store.y24_raw_idx); ok((ix.find((x) => /productlist/.test(x.key)) || {}).cnt === 1234 && (ix.find((x) => /getmenus/.test(x.key)) || {}).cnt === 39, '원문 목록(y24_raw_idx)에 건수 cnt(TOTAL_COUNT · 없으면 목록 길이)', ix.map((x) => x.cnt));
  ok(M.y24Cnt({ RESULT_LIST: [], TOTAL_COUNT: 0 }) === 0 && M.y24Cnt({ a: { LIST: [1, 2, 3] } }) === 3 && M.y24Cnt({ ok: 1 }) === null, '건수 세기: 0 · 목록 길이 · 목록 없으면 모름'); };

const main = (async () => { await unit(); const errs = await run(); ok(!errs.length, '화면 오류 없음', errs); console.log(bad ? `❌ tY24TOUR(수집기) 실패 ${bad}` : '✓ tY24TOUR 수집기 모두 통과'); })().catch((e) => { console.log('❌ tY24TOUR 멈춤', e.message); });

// ── ⑥ 웹앱 🗺 메뉴 지도: 마지막 둘러보기 한 줄 · [🔁 못 받은 곳·빈 목록만 다시](rnx=y24autoredo#rnredo=…) · [모두 다시] · 화면마다 결과·📖 풀이(손님 정보 0) — 시험 서버가 있을 때만(RN_PORT)
if (process.env.RN_PORT) main.then(() => require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms));
    await db.collection('crm_y24_raw').doc('m1').set({ sig: 'POST /api/Menu/GetMenus', at: new Date().toISOString(), part: 0, parts: 1, body: JSON.stringify({ MENU_ITEM_LIST: [{ MENU_ID: 'M001', MENU_NAME: '상품관리', PATH: '/Product', PMENU_ID: '' }, { MENU_ID: 'M001-S05', MENU_NAME: '등록상품 관리', PATH: '/Product/ProductList', PMENU_ID: 'M001' }, { MENU_ID: 'M002', MENU_NAME: '판매관리', PATH: '/Order', PMENU_ID: '' }, { MENU_ID: 'M002-S02', MENU_NAME: '신규 주문 확인', PATH: '/Order/NewOrderConfirmList', PMENU_ID: 'M002' }, { MENU_ID: 'M002-S04', MENU_NAME: '배송중/정산예정', PATH: '/Order/CalculatePlannedList', PMENU_ID: 'M002' }] }) });
    await db.collection('y24_raw_idx').doc('_tour').set({ key: '_tour', tour: true, at: '2026-11-09T01:00:00.000Z', end: '2026-11-09T01:30:00.000Z', stop: 'login', sum: { ok: 1, empty: 1, nobtn: 0, skip: 0, fail: 1 }, res: [{ path: '/Product/ProductList', name: '등록상품 관리', st: 'ok', cnt: 1234, msg: '넓힘: 기간 1년' }, { path: '/Order/NewOrderConfirmList', name: '신규 주문 확인', st: 'empty', cnt: 0, msg: '' }, { path: '/Order/CalculatePlannedList', name: '배송중/정산예정', st: 'fail', cnt: null, msg: '로그인 화면이 열림' }], by: 'PC1' });
    const box = document.createElement('div'); box.innerHTML = '<button data-y24menu="1">지도</button><div id="y24probe"></div>'; document.body.appendChild(box); box.querySelector('button').click(); await W(1200);
    const pb = document.getElementById('y24probe'); const redo = pb.querySelector('[data-y24redo]'); const all = pb.querySelector('[data-y24all-tour]');
    const det = [...pb.querySelectorAll('details.y24g')]; return { txt: pb.innerText, redo: redo && redo.getAttribute('href'), all: all && all.getAttribute('href'), det: det.length, warn: det.map((d) => d.textContent).join(' ') }; });
  ok(/마지막 둘러보기/.test(r.txt) && /로그인이 풀려 멈춤/.test(r.txt) && /받음 1 · 빈 목록 1/.test(r.txt) && /1,234건/.test(r.txt), `웹앱 메뉴 지도: 마지막 둘러보기 한 줄 · 화면마다 결과(받음 1,234건): ${r.txt.slice(0, 300)}`);
  ok(r.redo === 'https://uscm.yes24.com/Common/Body?rnx=y24autoredo#rnredo=%2FOrder%2FNewOrderConfirmList,%2FOrder%2FCalculatePlannedList' && /rnx=y24autoall$/.test(r.all || ''), `[🔁 못 받은 곳·빈 목록만 다시]·[모두 다시] 주소: ${r.redo} / ${r.all}`);
  ok(r.det === 3 && /주문접수확인/.test(r.warn) && /정산예정|구매확정/.test(r.warn) && !/손님A|010-/.test(r.warn), `화면마다 📖 풀이(⚠ 단추 · 손님 정보 0): ${r.det}곳`);
  console.log(bad ? `❌ tY24TOUR(웹앱 포함) 실패 ${bad}` : '✓ tY24TOUR 웹앱 메뉴 지도까지 모두 통과'); }));
