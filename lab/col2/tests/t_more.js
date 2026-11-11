/* t_more — (0.1.10 정범님 11/10 '아직 안 도는 9가지도 그림자로') 남은 9가지 그림자 · 운영 키는 메모리로만 · 로거엔 키·우리 상품 이름이 안 감
 *  ⓪ 차림표: 27가지 모두 돎 · 떼어 온 함수(구매자 분포·검색 시세·그린 화면 해석·KPIPA) · 키 규칙(로거엔 어느 키도 안 줌)
 *  ① 사무실 PC(가짜 서버): 🔍 새상품 없는 시세(운영 nbMarketJob 그대로) · 📚 KPIPA(운영 kp* 그대로 · 보안 표·쿠키는 따로 된 칸에만) · 🔎 네이버 도서(그려 읽기 · 운영 extRenderHelper 그대로)
 *     · 🔑 TTB·카카오·국중·eBay·정보나루(웹앱이 메모리로만 넘긴 키) — 운영과 같은 지문 · 키 값이 파일·기록·col2_*·상태·/jobs 어디에도 없음
 *  ② 로거 PC: 👥 구매자 분포(상품 화면을 실제로 그림 — 글자로 받으면 빈 칸) · 키 거절 · 키 부탁 안 함 · 우리 상품 목록을 받아도 버림 · 바깥 키 출처에 안 감
 * 실행: node tests/t_more.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js'); const TK = require('../shadow/col2-tasks.js'); const { lift } = require('../helper/col2-lift.js'); const { SHIM } = require('../helper/col2-shim.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p); } catch (e) {} } };
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const PR = L.PROD_REPO; const EXTX = require(path.join(PR, 'readnow-ext-core.js'));
const LIFTED = lift(fs.readFileSync(path.join(PR, COL2.LIFT.file), 'utf8'), COL2.LIFT.fns);
/* 지어낸 시험 키(실제 키 아님) — 이 글자가 도우미 파일·기록·결과 어디에도 나오면 안 됨 */
const KEYS = { aladinTtb: 'ttbFAKEKEY7a1q', kakaoRest: 'kakaoFAKEKEY8b2w', nlKey: 'nlFAKEKEY9c3e', d4lKey: 'd4lFAKEKEY0d4r', ebayAppId: 'ebayAPP-FAKEKEY1e5t', ebayCertId: 'ebayCERT-FAKEKEY2f6y' };
const ISBN1 = F.BOOKS['100001'].isbn, ISBN2 = F.BOOKS['100002'].isbn;

/* ── 가짜 화면·API (지어낸 값) ── */
const dynPart = (id) => `<input class="hd_ISBN" type="hidden" value="K${id}"><div id="K${id}_OrderStatistics"></div><div id="K${id}_RelationBuyItem_V2"></div><div id="w_jiny_recentContent"></div>
<script>setTimeout(function(){document.getElementById('K${id}_OrderStatistics').innerHTML='<div class="analysis_box"><table><tr><td class="tb_tit">20대</td><td class="tb_woman"><span class="per">12.5%</span></td><td class="tb_man"><span class="per">8.1%</span></td></tr><tr><td class="tb_tit">30대</td><td class="tb_woman"><span class="per">20%</span></td><td class="tb_man"><span class="per">9%</span></td></tr></table></div>';
document.getElementById('K${id}_RelationBuyItem_V2').innerHTML='<a href="/shop/wproduct.aspx?ItemId=30${id}1&utm_campaign=relbuy">함께 산 책 하나</a><a href="/shop/wproduct.aspx?ItemId=30${id}2&utm_campaign=relbuy">함께 산 책 둘</a>';
document.getElementById('w_jiny_recentContent').innerHTML='<a href="/shop/wproduct.aspx?ItemId=30${id}3">함께 클릭한 책 셋</a>';},700);</script>`;
const searchHtml = (q) => `<!doctype html><title>검색 | 알라딘</title><body>${[['500001', 6000], ['500002', 7500], ['500003', 5500]].map(([id, p]) => `<div class="ss_book_box" itemid="${id}"><a class="bo3" href="/shop/wproduct.aspx?ItemId=${id}">${q}</a> [중고] <img class="front_cover" src="//image.aladin.co.kr/${id}.jpg">
<table class="usedtable02"><tr><th>판매자 중고(2)</th></tr><tr><td>${p.toLocaleString('en-US')}원</td></tr></table></div>`).join('')}</body>`;
const kpDays = (from, to) => { const out = []; const d = (s) => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6)); for (let t = d(from); t <= d(to); t += 864e5) out.push(new Date(t).toISOString().slice(0, 10).replace(/-/g, '')); return out; };
const KG = { onOff: ['오프라인(대형서점)', '온라인'], bookType: ['종이책'] };
const kpVal = (date, gi) => ({ qty: +date.slice(-2) * 10 + gi, titles: 5 + gi, amt: 1000 * +date.slice(-2) + gi });
const kpTable = (type, from, to) => `<table><thead><tr><th rowspan="2">일자</th>${KG[type].map((g) => `<th colspan="3">${g}</th>`).join('')}</tr><tr>${KG[type].map(() => '<th>부수</th><th>종수</th><th>금액</th>').join('')}</tr></thead><tbody>${kpDays(from, to).map((d) => `<tr><th>${d.slice(2, 4)}년 ${d.slice(4, 6)}월${d.slice(6)}일</th>${KG[type].map((g, i) => { const v = kpVal(d, i); return `<td>${v.qty}</td><td>${v.titles}</td><td>${v.amt.toLocaleString('en-US')}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
const NV_ID = { [ISBN1]: '11112222', [ISBN2]: '33334444' };
const nvSearch = (isbn) => `<!doctype html><title>네이버 도서</title><body><div id="r"></div><script>setTimeout(function(){document.getElementById('r').innerHTML='<a href="https://search.shopping.naver.com/book/catalog/${NV_ID[isbn]}">책</a>'},500)</script></body>`;
const nvCatalog = (id) => { const isbn = Object.keys(NV_ID).find((k) => NV_ID[k] === id); const b = Object.values(F.BOOKS).find((x) => x.isbn === isbn);
  return `<!doctype html><title>${b.title} : 네이버 도서</title><body><h2 class="bookTitle_book_name__a1">${b.title}</h2><div class="bookTitle_info_title__a1">저자</div><div class="bookTitle_info_content__a1">${b.authors[0].name}</div><div class="bookTitle_info_title__a1">출판</div><div class="bookTitle_info_content__a1">${b.publisher}</div><div class="bookBasicInfo_info_title__b2">ISBN</div><div class="bookBasicInfo_info_detail__b2">${isbn}</div><div class="bookBasicInfo_info_title__b2">쪽수/무게/크기</div><div class="bookBasicInfo_info_detail__b2">${b.pages}쪽 | ${b.weight}g</div><a href="https://search.shopping.naver.com/">네이버 쇼핑</a></body>`; };
const bookOf = (isbn) => Object.values(F.BOOKS).find((x) => x.isbn === isbn);

function fake() { const reqs = []; let kpSid = null;
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let body = ''; q.on('data', (c) => (body += c)); q.on('end', () => {
    reqs.push({ path: u.pathname + u.search, cookie: q.headers.cookie || null, auth: q.headers.authorization || null, t: Date.now() });
    const H = (h, ct, st, hd) => { s.writeHead(st || 200, { 'Content-Type': ct || 'text/html; charset=utf-8', ...(hd || {}) }); s.end(h); }; const JS = (o, st) => H(JSON.stringify(o), 'application/json', st);
    const p = u.pathname, g = (k) => u.searchParams.get(k);
    if (p === '/') return H('<!doctype html><title>알라딘</title>첫 화면', null, 200, { 'Set-Cookie': 'rnTestSid=abc; Path=/' });
    if (p === '/shop/wproduct.aspx') { const id = g('ItemId'); const h = F.productHtml(id); return h ? H(h.replace('</body>', dynPart(id) + '</body>')) : H('없음', null, 404); }
    if (p === '/search/wsearchresult.aspx') return H(searchHtml(g('SearchWord')));
    /* KPIPA — 화면을 열면 보안 표와 쿠키 · 조회는 둘 다 맞아야 */
    if (p === '/home/v3/addition/adiStatsSaleReport') { kpSid = 'k' + Math.random().toString(36).slice(2, 8); return H(`<!doctype html><title>판매 보고서</title><script>var m_sCsrf = "TOK-${kpSid}";</script>`, null, 200, { 'Set-Cookie': `JSESSIONID=${kpSid}; Path=/` }); }
    if (p === '/home/v3/addition/adiStatsSaleReport/search') { const f = new URLSearchParams(body); if (!kpSid || q.headers['x-csrf-token'] !== 'TOK-' + kpSid || !String(q.headers.cookie || '').includes('JSESSIONID=' + kpSid)) return H('보안 표 다름', null, 403); return H(kpTable(f.get('rdoSearchType'), f.get('txtFromDate'), f.get('txtToDate'))); }
    /* 바깥 사이트 (도우미 extUrl·그려 읽기 → /__ext/<host>/…) */
    if (p === '/__ext/search.shopping.naver.com/book/search') return H(nvSearch(g('query')));
    if (p.startsWith('/__ext/search.shopping.naver.com/book/catalog/')) return H(nvCatalog(p.split('/').pop()));
    if (p === '/__ext/www.aladin.co.kr/ttb/api/ItemLookUp.aspx') { if (g('ttbkey') !== KEYS.aladinTtb) return JS({ errorCode: 2, errorMessage: '키가 다름' }); const isbn = g('ItemId'); if (isbn === ISBN2) return JS({ errorCode: 9, errorMessage: '시험 — 키를 되돌려 보냄 ' + g('ttbkey') }); /* 바깥이 키를 글에 섞어 돌려줘도 남지 않아야 */
      const b = bookOf(isbn); return JS({ item: [{ title: b.title, author: b.authors[0].name, publisher: b.publisher, pubDate: b.date, priceStandard: b.priceList, priceSales: b.priceSales, salesPoint: 120, customerReviewRank: 9, subInfo: { itemPage: b.pages, packing: { sizeWidth: 148, sizeHeight: 210, sizeDepth: 20, weight: b.weight }, usedList: { aladinUsed: { itemCount: 1, minPrice: 5000 } } } }] }); }
    if (p === '/__ext/dapi.kakao.com/v3/search/book') { if (q.headers.authorization !== 'KakaoAK ' + KEYS.kakaoRest) return JS({}, 401); const b = bookOf(g('query')); return JS({ documents: [{ isbn: '8900000000 ' + g('query'), title: b.title, authors: [b.authors[0].name], publisher: b.publisher, datetime: b.date + 'T00:00:00.000+09:00', price: b.priceList, sale_price: b.priceSales, status: '정상판매' }] }); }
    if (p === '/__ext/www.nl.go.kr/seoji/SearchApi.do') { if (g('cert_key') !== KEYS.nlKey) return JS({ RESULT: 'ERROR', ERR_CODE: '010', ERR_MESSAGE: '인증키 다름' }); const b = bookOf(g('isbn')); return JS({ docs: [{ EA_ISBN: g('isbn'), TITLE: b.title, AUTHOR: b.authors[0].name, PUBLISHER: b.publisher, REAL_PUBLISH_DATE: b.date.replace(/-/g, ''), PAGE: String(b.pages), PRE_PRICE: String(b.priceList) }] }); }
    if (p === '/__ext/api.ebay.com/identity/v1/oauth2/token') { if (q.headers.authorization !== 'Basic ' + Buffer.from(KEYS.ebayAppId + ':' + KEYS.ebayCertId).toString('base64')) return JS({ error_description: '키 다름' }, 401); return JS({ access_token: 'tokFAKE', expires_in: 7200 }); }
    if (p === '/__ext/api.ebay.com/buy/browse/v1/item_summary/search') { if (q.headers.authorization !== 'Bearer tokFAKE') return JS({}, 401); return JS({ total: 1, itemSummaries: [{ itemId: 'v1|9|0', title: 'Test Book ' + (g('gtin') || g('q')), price: { value: '12.50', currency: 'USD' }, shippingOptions: [{ shippingCost: { value: '5.00', currency: 'USD' } }], condition: 'Good', conditionId: '5000', itemWebUrl: 'https://www.ebay.com/itm/9', itemLocation: { country: 'US' } }] }); }
    if (p === '/__ext/data4library.kr/api/usageAnalysisList') { if (g('authKey') !== KEYS.d4lKey) return JS({ response: { error: '인증키 다름' } }); const b = bookOf(g('isbn13')); return JS({ response: { book: { bookname: b.title, isbn13: g('isbn13'), loanCnt: '12', class_nm: '문학', class_no: '813', publication_year: b.date.slice(0, 4) }, loanHistory: [{ loan: { month: '2026-10', loanCnt: '3', ranking: '1' } }], loanGrps: [], keywords: [], coLoanBooks: [] } }); }
    H('없음', null, 404); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, reqs, base: `http://127.0.0.1:${srv.address().port}` }))); }

/* '운영' 값 — 운영 공용 파일·운영 본체에서 떼어 온 함수(같은 글자)로 같은 화면에서 만듦(읽기만) */
async function opsEval(url, expr) { const br = await L.chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.goto(url);
    for (const f of ['readnow-aladin-core.js', 'readnow-products-core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(PR, f), 'utf8') });
    await p.addScriptTag({ content: LIFTED.code }); await p.addScriptTag({ content: SHIM }); return await p.evaluate(expr); } finally { await br.close(); } }
async function rendered(url) { const br = await L.chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.goto(url); await wait(900); return await p.content(); } finally { await br.close(); } }
const extHttp = (base) => async (o) => { const x = new URL(o.url); const r = await fetch(base + '/__ext/' + x.host + x.pathname + x.search, { method: o.method || 'GET', headers: o.headers || {}, body: o.data }); return { status: r.status, text: await r.text() }; };

/* 웹앱 흉내 — 부탁한 운영 문서 · 🔑 키(부탁하면 · 이 흉내는 키를 메모리 변수로만 들고 있음) · 운영 문서 목록(prd_market_nobook) · 맡긴 결과(col2_*만) */
function webapp(H, DB, okCols, o) { o = o || {}; const got = [], ops = []; const seen = { keysAsk: 0, keysPut: [], listsAsk: 0 }; let stop = false;
  (async () => { while (!stop) { try { const pd = (await H.api('GET', '/relay/pending?by=t')).j; if (pd && pd.ok) {
        const docs = (pd.want || []).filter((w) => okCols.includes(w.c)).map((w) => ({ c: w.c, id: w.id, v: DB[w.c + '/' + w.id] === undefined ? null : DB[w.c + '/' + w.id] })); if (docs.length) await H.api('POST', '/relay/answer', { docs });
        if (pd.keys && o.keys) { seen.keysAsk++; const pick = {}; for (const k of pd.keys) if (o.keys[k]) pick[k] = o.keys[k]; const r = await H.api('POST', '/relay/keys', { keys: pick, by: 't' }); seen.keysPut.push(r.st); }
        for (const L0 of pd.lists || []) { seen.listsAsk++; if (L0.c !== 'prd_market_nobook') continue; const L1 = Object.keys(DB).filter((k) => k.startsWith('prd_market_nobook/')).slice(0, L0.n).map((k) => ({ id: k.split('/')[1], v: DB[k] })); await H.api('POST', '/relay/answer', { lists: { prd_market_nobook: L1 } }); }
        if (o.handoff) await H.api('POST', '/relay/answer', { handoff: o.handoff }); /* (11/11 col2rep2) 🔀 넘김 상태 — 웹앱처럼 */
        const keys = (pd.out || []).filter((x) => /^col2_/.test(x.c) || (x.op && o.handoff)).map((x) => { if (x.op) ops.push(x); else got.push(x); return x.k; }); if (keys.length) await H.api('POST', '/relay/ack', { keys }); } } catch (e) {} await wait(250); } })();
  return { got, ops, seen, stop: () => { stop = true; }, last: (c) => got.filter((x) => x.c === c).slice(-1)[0] || null }; }
const leak = (s) => Object.values(KEYS).filter((k) => String(s).includes(k) || String(s).includes(encodeURIComponent(k)));
const allFiles = (D) => { const out = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let st; try { st = fs.statSync(p); } catch (e) { continue; } if (st.isDirectory()) { if (!/chrome/.test(f)) walk(p); } else if (st.size < 5e6) out.push(p); } }; walk(D); return out; };

(async () => {
  console.log('⓪ 차림표');
  ok(TK.TASKS.length === 27 && TK.TASKS.every((t) => t.state === 'run'), '로그인 없는 운영 일 27가지가 모두 그림자로 돎', TK.TASKS.length);
  ok(['dynamic', 'nbMarket', 'kpipa', 'ext.naverbook', 'ext.ttb', 'ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'].every((k) => TK.byK[k] && TK.byK[k].state === 'run'), '남았던 9가지(구매자 분포·새상품 없는 시세·KPIPA·네이버 도서·TTB·카카오·국중·eBay·정보나루) 돎');
  const lg = TK.plan('logger', { extShare: true }), of = TK.plan('office', {});
  ok(lg.includes('dynamic') && !lg.includes('nbMarket') && !lg.some((k) => TK.byK[k].keys) && of.includes('nbMarket') && of.includes('kpipa') && ['ext.ttb', 'ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'].every((k) => of.includes(k)) && !of.includes('dynamic'), '로거 = 구매자 분포(로거 고유) · 새상품 없는 시세·키 쓰는 출처는 사무실 PC만(나눔이 켜져도 로거엔 안 감)', 'logger ' + lg.length + ' · office ' + of.length);
  ok(TK.KEY_OK.length >= 6 && TK.KEY_OK.every((k) => !TK.keyLogger(k)) && /알라딘 계정/.test(TK.KEY_RULE.aladinTtb.who), '키 규칙: TTB는 우리 알라딘 계정 키 · 나머지도 우리 개발자 계정 키 → 로거엔 어느 키도 안 줌', TK.KEY_OK.join(','));
  ok(!LIFTED.err && !LIFTED.miss.length && ['getProductFull', 'nbMarketJob', 'extRenderHelper', 'kpFetch', 'kpParse', 'kpToken', 'kpReq'].every((n) => LIFTED.got.includes(n)), '운영 본체 함수를 글자 그대로 떼어 씀(구매자 분포·검색 시세·그린 화면 해석·KPIPA — 본체는 안 고침)', LIFTED.ver + ' · ' + LIFTED.sig + ' · ' + LIFTED.got.length + '개');
  ok(EXTX.KEYS.filter((k) => k.for.some((s) => ['ttb', 'kakao', 'nl', 'ebay', 'lib'].includes(s))).every((k) => TK.KEY_OK.includes(k.k)), '운영 외부 정보 공용 파일이 그 출처에 쓰는 키 이름이 모두 키 규칙에 있음');

  const A = await fake();
  /* 운영 값 만들기 */
  const IDS = ['100001', '100002']; const PB = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED); const pool = PB.map((b, i) => ({ id: 'b' + (i + 1), ...b, title: F.BOOKS[IDS[i]].title }));
  const plain = await (await fetch(A.base + '/shop/wproduct.aspx?ItemId=100001')).text();
  const dynOps = await opsEval(A.base + '/shop/wproduct.aspx?ItemId=100001', `(async () => { const r = await Col2Lift.getProductFull(location.href); return JSON.parse(JSON.stringify({ b: r.page.buyerDist, rb: r.page.relationBuy, cr: r.page.clickRelation, ok: r.page.dynamicLoaded })); })()`);
  ok(!/analysis_box/.test(plain.replace(/<script[\s\S]*?<\/script>/gi, '')) && dynOps && dynOps.ok && dynOps.b && dynOps.rb.length === 2 && dynOps.cr.length === 1, '구매자 분포는 화면이 스스로 불러오는 칸 — 글자로 받으면 비어 있고, 그려야 찬다(운영 getProductFull로 확인)', JSON.stringify(dynOps).slice(0, 120));
  const NB_T = '시험 세트 전 3권'; const nbOps = await opsEval(A.base + '/', `(async () => { const X = globalThis.__col2; X.W = []; globalThis.LISTINGS = new Map([['aladin_U77', { usedCode: 'U77', listingId: '77', title: ${JSON.stringify(NB_T)}, price: 9000, bookId: null, active: true }]]); await Col2Lift.nbMarketJob(); return X.W.find((x) => x.p === 'prd_market_nobook/aladin_U77').v; })()`);
  ok(nbOps && nbOps.market && nbOps.market.n >= 3 && nbOps.candSig, '운영 nbMarketJob(떼어 온 글자)이 가짜 검색 화면에서 시세를 만듦', nbOps && JSON.stringify(nbOps.market).slice(0, 100));
  const DB = {}; for (const b of pool) DB['prd_books/' + b.id] = b; const nowI = new Date().toISOString(); const old = new Date(Date.now() - 4 * 3600e3).toISOString();
  DB['prd_market_nobook/aladin_U77'] = { usedCode: 'U77', listingId: '77', title: NB_T, query: nbOps.query, at: nowI, src: 'usedSearch', cands: nbOps.cands, candSig: nbOps.candSig, market: nbOps.market, history: [{ at: nowI, median: nbOps.market.median, our: 9000 }] };
  DB['prd_market_nobook/aladin_U78'] = { usedCode: 'U78', listingId: '78', title: NB_T, query: nbOps.query, at: old, src: 'usedSearch', cands: [], candSig: '[]', market: { median: 4000, low: 3000, n: 1 }, history: [{ at: old, median: 4000, our: 8000 }] }; /* 4시간 전에 본 다른 시세 = 때가 다름 */
  /* KPIPA 운영 값 — 같은 날 규칙(14:30) · 칸 순서를 바꿔 넣음(운영 kpSig처럼 순서는 상관없어야) · end: 오래된 다른 값 · end-1: 도서유형 칸 없음 · end-2: 방금 받은 다른 값(까닭 모름) */
  const kt = new Date(Date.now() + 9 * 3600e3); const kh = kt.getUTCHours() * 60 + kt.getUTCMinutes(); const ymd = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); const end = ymd(Date.now() - (kh >= 870 ? 1 : 2) * 864e5); const KD = kpDays(ymd(Date.parse(end.replace(/(\d{4})(\d\d)(\d\d)/, '$1-$2-$3T00:00:00+09:00')) - 6 * 864e5), end);
  const ser = (type, d) => { const o = {}; KG[type].forEach((g, i) => { const v = kpVal(d, i); o[g] = { amt: v.amt, titles: v.titles, qty: v.qty }; }); return o; };
  for (const d of KD) DB['mkt_kpipa/' + d] = { date: d, onOff: { series: ser('onOff', d), at: nowI }, bookType: { series: ser('bookType', d), at: nowI } };
  DB['mkt_kpipa/' + KD[6]].onOff = { series: { ...ser('onOff', KD[6]), 온라인: { qty: 1, titles: 1, amt: 1 } }, at: old }; delete DB['mkt_kpipa/' + KD[5]].bookType; DB['mkt_kpipa/' + KD[4]].onOff = { series: { ...ser('onOff', KD[4]), 온라인: { qty: 2, titles: 2, amt: 2 } }, at: nowI };
  /* 외부 정보 운영 값 — 운영 ReadnowExt.run(같은 가짜 응답 · 같은 키) · 네이버는 그린 화면을 운영 naverPage로 */
  for (const isbn of [ISBN1, ISBN2]) { const b = bookOf(isbn);
    for (const src of ['ttb', 'kakao', 'nl', 'ebay', 'lib']) { const r = await EXTX.run(src, { isbn, title: b.title, author: '', keys: KEYS, http: extHttp(A.base), cache: {}, cfg: EXTX.cfgOf({}) }); if (!r.ok) continue; const col = { ebay: 'ext_foreign', lib: 'ext_lib' }[src] || 'ext_basic'; const k = col + '/' + isbn; DB[k] = DB[k] || { isbn, src: {} }; DB[k].src[src] = { at: nowI, chk: nowI, sig: EXTX.sig({ none: !!r.none, d: r.d }, src), none: !!r.none, d: r.d }; }
    const url = `https://search.shopping.naver.com/book/catalog/${NV_ID[isbn]}`; const o = EXTX.naverPage(await rendered(A.base + '/__ext/search.shopping.naver.com/book/catalog/' + NV_ID[isbn]), isbn, url); o.d.id = NV_ID[isbn]; o.d.rendered = true;
    if (!DB['ext_basic/' + isbn] || !DB['ext_basic/' + isbn].src.ttb) { DB['ext_basic/' + isbn] = DB['ext_basic/' + isbn] || { isbn, src: {} }; DB['ext_basic/' + isbn].src.ttb = { at: old, chk: old, sig: 'old', none: false, d: { title: '옛' } }; } /* (col2rep5) 운영 값 먼저 보기 — 운영이 예전에 읽어 둔 책이어야 번외가 바깥에 물음(그래야 '바깥이 오류'를 시험) */
    DB['ext_basic/' + isbn] = DB['ext_basic/' + isbn] || { isbn, src: {} }; DB['ext_basic/' + isbn].src.naverbook = { at: nowI, chk: nowI, sig: EXTX.sig({ none: false, d: o.d }, 'naverbook'), none: false, d: o.d }; }
  ok(DB['ext_basic/' + ISBN1].src.ttb && DB['ext_basic/' + ISBN1].src.kakao && DB['ext_basic/' + ISBN1].src.nl && DB['ext_foreign/' + ISBN1] && DB['ext_lib/' + ISBN1] && DB['ext_basic/' + ISBN1].src.naverbook.d.title, '운영 값(키를 넣은 운영 공용 파일 · 그린 네이버 화면)을 가짜 응답으로 만듦');
  A.reqs.length = 0;

  console.log('① 사무실 PC — 새상품 없는 시세 · KPIPA · 네이버(그려 읽기) · 키 쓰는 출처 5곳');
  const OFF1 = TK.TASKS.filter((t) => /^ext\./.test(t.k) && !['ext.naverbook', 'ext.ttb', 'ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'].includes(t.k)).map((t) => t.k);
  let H = await L.startHelper({ aladin: A.base, env: { RN_COL2_EXT_BASE: A.base, RN_COL2_KPIPA_BASE: A.base }, cfg: { pc: 'MJ-MORE', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 150 }, watch: { tickSec: 1 }, jobs: { on: true, fx: { after: '00:00', keyWaitMin: 0 }, off: OFF1, kpipa: { after: '00:00' }, pass: { minN: 1, waitMin: 0.2 } } } }); const D1 = H.D;
  const W = webapp(H, DB, ['prd_ids', 'prd_books', 'prd_market_nobook', 'mkt_kpipa', 'ext_basic', 'ext_foreign', 'ext_lib'], { keys: KEYS, handoff: { jobs: { kpipa: { on: true, pc: 'MJ-MORE', at: new Date().toISOString() }, 'ext.nl': { on: true, pc: 'OTHER-PC', at: new Date().toISOString() } } } });
  try { await H.api('POST', '/relay/answer', { pool });
    const want = ['nbMarket', 'kpipa', 'ext.naverbook', 'ext.ttb', 'ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'];
    const jd = await until(() => { const o = W.last('col2_jday'); const t = o && o.v.tasks; return t && t.nbMarket && t.nbMarket.n >= 2 && t.kpipa && t.kpipa.n >= 13 && want.slice(2).every((k) => t[k] && t[k].n + t[k].fail >= 2) ? o : null; }, 480);
    const T = jd && jd.v.tasks; if (!T || process.env.T_DEBUG) { console.log('    (디버그)', JSON.stringify(W.last('col2_jday') && W.last('col2_jday').v.tasks).slice(0, 2500)); fs.writeFileSync(process.env.T_DEBUG || '/dev/null', H.out() + '\n=====\n' + JSON.stringify(W.got.filter((x) => x.c === 'col2_jobs').map((x) => x.v)) + '\n=====\n' + JSON.stringify((await H.api('GET', '/jobs')).j.tasks.filter((t) => t.mine).map((t) => [t.k, t.q]))); }
    ok(W.seen.keysAsk >= 1 && W.seen.keysPut.includes(200), '🔑 도우미가 키를 부탁(이름만) → 웹앱이 메모리로 넘김(POST /relay/keys)', JSON.stringify(W.seen));
    ok(T && T.nbMarket.same === 1 && T.nbMarket.diff === 1 && T.nbMarket.un === 0 && T.nbMarket.why.move === 1, "🔍 새상품 없는 시세: 운영 nbMarketJob과 같음 1 · 4시간 전에 본 다른 시세 = '때가 다름' 1", T && JSON.stringify(T.nbMarket));
    ok(T && T.kpipa.n === 14 && T.kpipa.same === 11 && T.kpipa.why.old === 1 && T.kpipa.why.fill === 1 && T.kpipa.un === 1, "📚 KPIPA: 7일 × 두 종류 — 같음 11(칸 순서는 상관없음) · 오래된 운영 값 1 · 운영 칸 빔 1 · 까닭 모를 다름 1", T && JSON.stringify(T.kpipa));
    { const HOF = require('../shadow/col2-handoff.js'); const HD = { jobs: { kpipa: { on: true, pc: 'MJ-MORE', at: new Date().toISOString() } } }; await until(() => W.ops.length >= 3, 40); const kp = W.ops.filter((x) => x.job === 'kpipa');
      ok(kp.length === 3 && kp.every((x) => x.c === 'mkt_kpipa' && /^\d{8}$/.test(x.id) && HOF.writeOk(HD, x, 'MJ-MORE').ok && !HOF.writeOk(HD, x, 'HOME').ok) && kp.filter((x) => x.hist && x.hist.old).length === 2 && !W.ops.some((x) => x.job !== 'kpipa'), '🔀 KPIPA를 이 PC로 넘기면 같지 않은 3줄(오래됨·빈 칸·다름)만 운영 칸 mkt_kpipa에 맡김 · 바뀐 2줄은 옛 값을 history로 · 같은 11줄은 안 씀 · 다른 PC로 넘긴 일(국중)은 안 씀', JSON.stringify(kp.map((x) => x.id + ':' + Object.keys(x.v).join('/') + (x.hist ? '+h' : '')))); }
    ok(T && T['ext.naverbook'].same === 2, '🔎 네이버 도서(그려 읽기 · 운영 extRenderHelper·naverPage 그대로): 2권 운영과 같은 지문', T && JSON.stringify(T['ext.naverbook']));
    ok(T && ['ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'].every((k) => T[k].same === 2) && T['ext.ttb'].same === 1 && T['ext.ttb'].fail === 1, '🔑 카카오·국중·eBay·정보나루 2권씩 · TTB 1권 운영과 같음(TTB 1권은 바깥이 오류)', T && JSON.stringify(['ext.ttb', 'ext.kakao', 'ext.nl', 'ext.ebay', 'ext.lib'].map((k) => [k, T[k].same, T[k].fail])));
    const ttbFail = W.got.filter((x) => x.c === 'col2_jobs' && x.v.task === 'ext.ttb' && x.v.verdict === 'fail').slice(-1)[0];
    ok(ttbFail && /«키»/.test(ttbFail.v.why) && !leak(JSON.stringify(ttbFail)).length, '바깥이 오류 글에 키를 섞어 돌려줘도 기록엔 «키»로 가림', ttbFail && ttbFail.v.why);
    const kpReq = A.reqs.filter((q) => q.path.startsWith('/home/v3/')); ok(kpReq.length === 4 && kpReq[0].cookie === null && kpReq.slice(1).every((q) => /JSESSIONID=/.test(q.cookie || '') && !/rnTestSid/.test(q.cookie || '')), 'KPIPA: 화면 열기 1번 + 보안 표 1번(운영 kpToken) + 조회 2번(판매채널별·도서유형별) · 쿠키는 그 칸에서 받은 KPIPA 것만(알라딘 쿠키 안 섞임)', kpReq.map((q) => q.path.split('?')[0].split('/').pop()).join(','));
    ok(A.reqs.filter((q) => /^\/search\//.test(q.path)).length === 2 && A.reqs.filter((q) => /^\/search\//.test(q.path)).every((q) => q.cookie === null), '🔍 검색 화면은 쿠키 없이 · 상품마다 한 번', A.reqs.filter((q) => /^\/search\//.test(q.path)).length);
    ok(A.reqs.some((q) => /book\/catalog/.test(q.path)) && A.reqs.filter((q) => /naver/.test(q.path)).every((q) => q.cookie === null), '🔎 네이버 화면은 따로 된 칸 탭에서 그림(쿠키 없음)');
    /* 🔑 키가 남지 않음 */
    await wait(1500); const files = allFiles(path.join(D1, 'home')); const fl = files.filter((f) => leak(fs.readFileSync(f, 'utf8')).length);
    ok(files.length >= 4 && !fl.length, '🔑 키 값이 도우미 파일(col2.json·jobs.json·relay-out.json·col2.log·기록창)에 없음', fl.map((f) => path.basename(f)).join(',') || files.length + '개 파일 확인');
    ok(!leak(H.out()).length, '🔑 키 값이 도우미 화면 출력(기록 줄)에 없음');
    ok(!leak(JSON.stringify(W.got)).length, '🔑 키 값이 col2_* 결과(웹앱이 대신 쓸 것)에 없음', W.got.length + '건');
    const st = (await H.api('GET', '/status')).j; const jv = (await H.api('GET', '/jobs')).j; const pd = (await H.api('GET', '/relay/pending?by=x')).j;
    ok(st.keys && st.keys.n === 6 && st.keys.names.includes('aladinTtb') && !leak(JSON.stringify(st) + JSON.stringify(jv) + JSON.stringify(pd)).length, '🔑 상태·/jobs·부탁 목록엔 키 이름·수만(값 없음)', JSON.stringify(st.keys));
    ok(A.reqs.filter((q) => q.path.startsWith('/__ext/www.aladin.co.kr/ttb')).every((q) => q.cookie === null), 'TTB 요청에도 쿠키 없음(키만)');
    const kr = await H.api('POST', '/relay/keys', { keys: { aladinTtb: 'x', naverSecret: 'y', other: 'z' } }); ok(kr.j && kr.j.ok && kr.j.names.join() === 'aladinTtb', '받는 키 이름은 정한 것만(그 밖은 버림)', kr.j && kr.j.names.join());
  } finally { W.stop(); await H.stop(); killDir(D1); }

  console.log('② 로거 PC — 구매자 분포만 · 키·우리 상품 목록은 받지 않음');
  const DB2 = {}; DB2['prd_book_metrics/b1'] = { buyerDist: dynOps.b, relationBuyIds: dynOps.rb, clickRelation: dynOps.cr, dynAt: nowI };
  DB2['prd_book_metrics/b2'] = { buyerDist: dynOps.b, relationBuyIds: [{ title: '예전 함께 산 책', aladinItemId: '9' }], clickRelation: [], dynAt: old }; /* 4시간 전 값 — 때가 다름 */
  A.reqs.length = 0;
  H = await L.startHelper({ aladin: A.base, env: { RN_COL2_EXT_BASE: A.base, RN_COL2_KPIPA_BASE: A.base }, cfg: { pc: 'LOGGER-MORE', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 150 }, watch: { tickSec: 1 }, jobs: { on: true, fx: { after: '00:00', keyWaitMin: 0 }, extShare: true, off: ['metrics', 'usedPage', 'shopSum', 'survey', 'bench', ...TK.TASKS.filter((t) => /^ext\./.test(t.k)).map((t) => t.k)], kpipa: { after: '00:00' }, pass: { minN: 1, waitMin: 0.2 } } } }); const D2 = H.D;
  const W2 = webapp(H, DB2, ['prd_ids', 'prd_books', 'prd_book_metrics'], { keys: KEYS });
  try { await H.api('POST', '/relay/answer', { pool });
    const kr = await H.api('POST', '/relay/keys', { keys: KEYS }); const ln = await H.api('POST', '/relay/answer', { lists: { prd_market_nobook: [{ id: 'aladin_U77', v: DB['prd_market_nobook/aladin_U77'] }] } });
    const jd = await until(() => { const o = W2.last('col2_jday'); const t = o && o.v.tasks; return t && t.dynamic && t.dynamic.n >= 2 ? o : null; }, 360);
    const T = jd && jd.v.tasks; if (!T) console.log('    (디버그)', H.out().slice(-2500));
    ok(T && jd.v.kind === 'logger' && T.dynamic.same === 1 && T.dynamic.diff === 1 && T.dynamic.un === 0 && T.dynamic.why.move === 1, "👥 구매자 분포: 화면을 그려 운영 getProductFull 그대로 — 같음 1 · 4시간 전 운영 값과 다름 = '때가 다름' 1", T && JSON.stringify(T.dynamic));
    const pr = A.reqs.filter((q) => q.path.startsWith('/shop/wproduct.aspx')); ok(pr.length >= 2 && pr.every((q) => q.cookie === null), '그리는 탭은 쿠키 없는 따로 된 칸(첫 화면에서 받은 알라딘 쿠키도 안 실림)', pr.length + '번');
    ok(kr.st === 403 && (await H.api('GET', '/status')).j.keys.logger === true && (await H.api('GET', '/relay/pending?by=x')).j.keys == null, '🔑 로거 PC는 키를 거절(403) · 키를 부탁하지도 않음', kr.st);
    ok(W2.seen.keysAsk === 0 && W2.seen.listsAsk === 0, '로거 PC는 키·우리 상품 목록을 부탁하지 않음', JSON.stringify(W2.seen));
    const jv = (await H.api('GET', '/jobs')).j; ok(jv.tasks.find((t) => t.k === 'nbMarket').q === 0 && !jv.tasks.find((t) => t.k === 'nbMarket').mine && ln.j && ln.j.ok, '로거에 우리 상품 목록을 보내도 버림(새상품 없는 시세 차례 0)');
    ok(!A.reqs.some((q) => /\/__ext\/|\/search\/|\/home\/v3\//.test(q.path)), '로거는 키 쓰는 출처·검색 시세·KPIPA에 가지 않음');
    const lines = fs.readFileSync(path.join(D2, 'home', 'col2.log'), 'utf8'); ok(!leak(lines + H.out()).length && !/시험 세트/.test(lines + H.out()), '로거 기록에 키·우리 상품 이름 없음');
  } finally { W2.stop(); await H.stop(); killDir(D2); }
  A.srv.close(); L.done('t_more');
})();
