/* t_jobs — (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 그림자 일 · 로거 설정 묶음 · 속도·바쁨 쉼 · 하루 셈·넘길 수 있음
 *  ⓪ 차림표(순수): 로그인 없는 운영 일 목록 · 로거/사무실 할 일이 겹치지 않음 · 주소 꼴(우리 숍·판매자 센터 없음) · 외부 정보 나눔 · '넘길 수 있음' 셈 · 운영 본체에서 떼어 온 함수
 *  ① 사무실 PC(가짜 서버): 공개 상품 화면 + 외부 정보(리디·환율)만 · 로거 고유 화면(중고 첫 쪽·숍)은 열지 않음 · 운영과 같은 해석·지문 → 같음/다름 · col2_jobs·col2_jday 에만 · 바쁘면 쉼
 *  ② 로거 PC(이름 LOGGER…): 시장 지표·중고 첫 쪽·숍 요약·숍 평가·🎯 벤치마킹만 · 공개 상품 화면 도서 정보·외부 정보는 안 함 · 우리 숍은 열지 않음 · 쿠키 없이 · 운영 값 못 받으면 '운영 값 없음'
 * 실행: node tests/t_jobs.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js'); const TK = require('../shadow/col2-tasks.js'); const CMP = require('../shadow/col2-compare-core.js'); const { lift } = require('../helper/col2-lift.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p); } catch (e) {} } };
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const kday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

/* 가짜 화면(지어낸 값 · 실제 숍·손님 없음) */
const usedHtml = (id) => `<!doctype html><title>중고 | 알라딘</title><body><div class="Ere_usedsell_list2"><a>전체 (3)</a><a>판매자 중고 (2)</a></div>
<div class="Ere_prod_Binfowrap_used2"><ul class="info_list"><li><span class="Litem">판매자 중고(2)</span><span class="Ritem">5,000원</span></li></ul></div>
<table class="Ere_usedsell_table"><tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=7${id}">책</a></td><td class="seller"><a href="/shop/usedshop/wshopitem.aspx?SC=12345">가게일</a></td><td class="price"><span class="Ere_fs20">5,000</span> 배송비 : 2,500</td></tr>
<tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=8${id}">책</a></td><td class="seller"><a href="/shop/usedshop/wshopitem.aspx?SC=${COL2.OWN_SC[0]}">우리</a></td><td class="price"><span class="Ere_fs20">6,000</span></td></tr></table></body>`;
const shopHtml = () => `<!doctype html><title>가게일 | 알라딘</title><body><span class="usedseller_label01">전문셀러</span><table id="guide_GoodPoint"><tr><td>최근 6개월</td><td>98.5%</td><td>120</td><td>110</td><td>8</td><td>2</td></tr><tr><td>전체 기간</td><td>99%</td><td>1,500</td><td>1,480</td><td>15</td><td>5</td></tr></table><div id="guide_OutStockCancelRate">최근 3개월 1.5%</div></body>`;
const benchHtml = () => `<!doctype html><title>가게일 | 알라딘</title><body><table><tr>${[['9001', '벤치 책 하나', 7000, '상'], ['9002', '벤치 책 둘', 4500, '최상']].map(([id, t, p, g]) => `<td width="25%" valign="top"><input type="checkbox" name="chkCart.U${id}1"><a class="bo" href="/shop/wproduct.aspx?ItemId=${id}">${t}</a> [중고 - ${g}] <span class="p1_bold">${p.toLocaleString('en-US')}원</span></td>`).join('')}</tr></table></body>`;
const surveyHtml = () => `<!doctype html><title>구매 평가</title><body><table>${[['2026-11-08', '만족'], ['2026-11-08', '보통'], ['2026-11-07', '만족'], ['2026-11-06', '불만족']].map(([d, r], i) => `<tr><td class="y_usedsmall">${d}</td><td>${r}</td><td>평가 글 ${i} 잘 받았어요</td><td>ab***</td></tr>`).join('')}</table><a href="javascript:Page_Set('1')">1</a><a href="javascript:Page_Set('2')">2</a></body>`;
const ridiHtml = (q) => `<!doctype html><title>리디</title><body><ul><li><a href="/books/1234567"><span role="img" aria-label="${q}"></span></a> <a href="/author/1">지은이</a> 소장 9,000원</li></ul></body>`;
const FX = { amount: 1, base: 'KRW', date: kday(), rates: { USD: 0.00072, EUR: 0.00066, JPY: 0.11, GBP: 0.00056 } };

function fake() { const reqs = []; const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); reqs.push({ path: u.pathname + u.search, cookie: q.headers.cookie || null, t: Date.now() });
    const H = (h) => { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(h); };
    if (u.pathname === '/') { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'rnTestSid=abc; Path=/' }); return s.end('<!doctype html><title>알라딘</title>첫 화면'); }
    if (u.pathname === '/shop/wproduct.aspx') { const h = F.productHtml(u.searchParams.get('ItemId')); return h ? H(h) : (s.writeHead(404), s.end()); }
    if (u.pathname === '/shop/UsedShop/wuseditemall.aspx') return H(usedHtml(u.searchParams.get('ItemId')));
    if (u.pathname === '/shop/usedshop/wshopitem.aspx') return H(u.searchParams.get('ViewType') ? benchHtml() : shopHtml());
    if (u.pathname === '/shop/UsedShop/wshopsurvey.aspx') return H(surveyHtml());
    if (u.pathname.startsWith('/__ext/ridibooks.com/search')) return H(ridiHtml(u.searchParams.get('q')));
    if (u.pathname.startsWith('/__ext/api.frankfurter.app/')) { s.writeHead(200, { 'Content-Type': 'application/json' }); return s.end(JSON.stringify(FX)); }
    s.writeHead(404); s.end('없음'); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, reqs, base: `http://127.0.0.1:${srv.address().port}` }))); }

/* 운영이 같은 화면에서 만들 값 — 운영 공용 파일·운영 본체에서 떼어 온 함수를 그대로 써서 해석(읽기만) */
async function prodParse(list) { const br = await L.chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.setContent('<!doctype html><title>운영 해석</title>');
    for (const f of ['readnow-aladin-core.js', 'readnow-products-core.js', 'readnow-sellers-core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(L.PROD_REPO, f), 'utf8') });
    await p.addScriptTag({ content: lift(fs.readFileSync(path.join(L.PROD_REPO, COL2.LIFT.file), 'utf8'), COL2.LIFT.fns).code });
    return await p.evaluate((L0) => L0.map(([fn, html, url]) => { const doc = new DOMParser().parseFromString(html, 'text/html'); const [ns, f] = fn.split('.'); const M = { P: window.ReadnowProducts, S: window.ReadnowSellers, L: window.Col2Lift }; return JSON.parse(JSON.stringify(f === 'parseProductPage' ? M[ns][f](doc, url) : M[ns][f](doc))); }), list);
  } finally { await br.close(); } }
/* 운영 외부 정보 지문 — 운영 ReadnowExt.run(같은 가짜 응답)으로 */
const EXTX = require(path.join(L.PROD_REPO, 'readnow-ext-core.js'));
async function extProd(src, a, base) { const http2 = async (o) => { const x = new URL(o.url); const r = await fetch(base + '/__ext/' + x.host + x.pathname + x.search); return { status: r.status, text: await r.text() }; };
  const r = await EXTX.run(src, { ...a, keys: {}, http: http2, cache: {}, cfg: EXTX.cfgOf({}) }); return r; }

/* 웹앱 흉내 — 부탁한 운영 문서(DB에 있는 것만 · 없는 칸은 웹앱처럼 넘기지 않음)를 넘기고 맡긴 결과(col2_*만)를 받아 둠 */
function webapp(H, DB, okCols) { const got = []; let stop = false;
  (async () => { while (!stop) { try { const pd = (await H.api('GET', '/relay/pending?by=t')).j; if (pd && pd.ok) { const docs = (pd.want || []).filter((w) => okCols.includes(w.c)).map((w) => ({ c: w.c, id: w.id, v: DB[w.c + '/' + w.id] === undefined ? null : DB[w.c + '/' + w.id] }));
        if (docs.length) await H.api('POST', '/relay/answer', { docs }); const keys = (pd.out || []).filter((o) => /^col2_/.test(o.c)).map((o) => { got.push(o); return o.k; }); if (keys.length) await H.api('POST', '/relay/ack', { keys }); } } catch (e) {} await wait(250); } })();
  return { got, stop: () => { stop = true; }, last: (c, pre) => got.filter((o) => o.c === c && (!pre || o.id.startsWith(pre))).slice(-1)[0] || null }; }

(async () => {
  console.log('⓪ 차림표');
  const lg = TK.plan('logger', {}), of = TK.plan('office', {});
  ok(TK.TASKS.length >= 20 && TK.TASKS.every((t) => t.k && t.name && t.ops && t.ops.length && t.col && t.who && t.state && (t.state === 'run' || t.why)), `로그인 없는 운영 일 목록 ${TK.TASKS.length}개 — 일 이름·운영 일·쓰는 칸·누가·까닭`, TK.TASKS.filter((t) => t.state === 'run').length + '개 돎');
  ok(lg.length >= 5 && lg.every((k) => TK.byK[k].who === 'logger') && ['metrics', 'usedPage', 'shopSum', 'survey', 'bench'].every((k) => lg.includes(k)), '로거 = 로거 고유 일만(시장 지표·중고 첫 쪽·숍 요약·숍 평가·🎯 벤치마킹)', lg.join(','));
  ok(!lg.some((k) => of.includes(k)) && of.includes('product') && of.some((k) => /^ext\./.test(k)), '사무실 PC 할 일은 로거와 하나도 안 겹침(공개 상품 화면 도서 정보 · 외부 정보)', of.length + '개');
  const lg2 = TK.plan('logger', { extShare: true }); ok(lg2.some((k) => /^ext\./.test(k)) && ['9790000000011', '9790000000028', '9791100000003'].every((i) => TK.shareOk('logger', i, { extShare: true }) !== TK.shareOk('office', i, { extShare: true })) && TK.shareOk('office', '9790000000011', {}) && !TK.shareOk('logger', '9790000000011', {}), '외부 정보 나눔(설정) — ISBN 끝자리로 갈라 같은 책을 두 PC가 묻지 않음 · 나눔 꺼짐이면 사무실만');
  ok(TK.pathOf(TK.byK.shopSum, { sc: COL2.OWN_SC[0] }, COL2.OWN_SC) === null && TK.pathOf(TK.byK.shopSum, { sc: '12345' }, COL2.OWN_SC) === '/shop/usedshop/wshopitem.aspx?SC=12345' && TK.pathOf(TK.byK.metrics, { itemId: '1;x' }) === null && TK.ALLOW.every((re) => !re.test('/scm/wmain.aspx')), '주소는 정한 공개 화면 꼴만 · 우리 숍은 열지 않음 · 이상한 값 거절');
  { const D = TK.dayNew('d'); for (let i = 0; i < 29; i++) TK.dayAdd(D, 'x', 'same'); TK.dayAdd(D, 'x', 'diff', ['move']); const a = TK.passOf(D.t.x, COL2.PASS); TK.dayAdd(D, 'x', 'diff', ['diff']); const b = TK.passOf(D.t.x, COL2.PASS); const c = TK.passOf({ n: 29, same: 29, diff: 0, un: 0, fail: 0 }, COL2.PASS);
    ok(a.can && a.n === 30 && a.rate === 96.7 && !b.can && /까닭 모를 다름 1/.test(b.why) && !c.can && /표본 29\/30/.test(c.why), "'넘길 수 있음' = 하루 표본 30 이상 · 까닭 모를 다름 0(까닭을 밝힌 다름은 막지 않음) · 못 읽음 20% 이하", a.rule); }
  { const lt = lift(fs.readFileSync(path.join(L.PROD_REPO, COL2.LIFT.file), 'utf8'), COL2.LIFT.fns); ok(!lt.err && lt.got.length === COL2.LIFT.fns.length && !lt.miss.length && /benchParse/.test(lt.code), '🎯 벤치마킹 해석 함수는 운영 본체에서 그대로 떼어 씀(고치지 않음)', lt.ver + ' · ' + lt.sig); }
  ok(CMP.compareMap({ a: 1, b: 2, lastCheckedAt: new Date(Date.now() - 3 * 3600e3).toISOString() }, { a: 1, b: 3 }, { a: 'a', b: 'b' }, { move: ['b'], prodAt: new Date(Date.now() - 3 * 3600e3).toISOString() }).reasons.join() === 'move' && CMP.compareMap({ a: 1 }, { a: 2 }, { a: 'a' }).reasons.join() === 'diff' && CMP.compareMap(null, {}, {}).verdict === 'noprod', '견주기: 움직이는 값이 운영이 읽은 뒤 바뀜 = 까닭 밝힘 · 그 밖 다름 = 까닭 모름');

  { /* (11/10 밤 col2n) 하루 한 번만 받는 일은 일마다 기준 수 */ const D = TK.dayNew('d'); for (let i = 0; i < 14; i++) TK.dayAdd(D, 'kpipa', 'same'); TK.dayAdd(D, 'ext.fx', 'same'); for (let i = 0; i < 14; i++) TK.dayAdd(D, 'ext.kyobo', 'same');
    const a = TK.passOf(D.t.kpipa, COL2.PASS, 'kpipa'), b = TK.passOf(D.t['ext.fx'], COL2.PASS, 'ext.fx'), c = TK.passOf(D.t['ext.kyobo'], COL2.PASS, 'ext.kyobo'), e = TK.passOf(D.t.kpipa, { ...COL2.PASS, minNBy: { kpipa: 20 } }, 'kpipa');
    ok(a.can && b.can && !c.can && /표본 14\/30/.test(c.why) && !e.can && /표본 14\/20/.test(e.why) && COL2.KPIPA.after === '00:20', '📚 KPIPA(하루 14줄)·💱 환율(하루 한 문서)은 일마다 기준 수 · 설정 minNBy로 바꿈 · 다른 일은 30 그대로 · KPIPA는 하루 몫이 남은 밤부터', [a.why, b.why, c.why, e.why].join(' / ')); }
  { /* (11/10 밤 col2n) 표본이 모자란 일부터 — 하루 몫(1,600장)이 낮에 다 쓰여도 일마다 표본 30개가 고르게 쌓이게 */
    const os = require('os'); const { makeJobs } = require('../helper/col2-jobs.js'); const Hd = fs.mkdtempSync(path.join(os.tmpdir(), 'c2pick-'));
    const D0 = TK.dayNew(kday()); for (let i = 0; i < 40; i++) TK.dayAdd(D0, 'ext.kyobo', 'same'); for (let i = 0; i < 5; i++) TK.dayAdd(D0, 'ext.ridi', 'same'); TK.dayAdd(D0, 'ext.google', 'fail');
    fs.writeFileSync(path.join(Hd, 'jobs.json'), JSON.stringify({ day: D0, wait: [{ k: 'ext.yes24' }, { k: 'ext.yes24' }, { k: 'ext.yes24' }] }));
    const J = makeJobs({ home: Hd, cfg: () => ({}), kind: () => 'office', pc: () => 'T', PASS: COL2.PASS, out() {}, note() {} });
    const L4 = ['ext.kyobo', 'ext.ridi', 'ext.google', 'ext.yes24']; const pk = []; for (let i = 0; i < 4; i++) pk.push(J.pickK(L4));
    ok(pk.every((k) => k === 'ext.google') && J.tried('ext.kyobo') === 40 && J.tried('ext.yes24') === 3 && J.tried('ext.google') === 1, '그림자 일은 오늘 해 본 수(견줌·못 읽음·운영 값 기다림 포함)가 가장 적은 일부터 고름(표본을 일찍 채운 일이 몫을 먹지 않음)', pk.join());
    const J2 = makeJobs({ home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2pick-')), cfg: () => ({}), kind: () => 'office', pc: () => 'T', PASS: COL2.PASS, out() {}, note() {} }); const seen = new Set(); for (let i = 0; i < 4; i++) seen.add(J2.pickK(L4));
    ok(seen.size === 4, '모두 같으면 예전처럼 차례대로 돌아감', [...seen].join());
    fs.rmSync(Hd, { recursive: true, force: true }); }

  const A = await fake(); const IDS = ['100001', '100002', '100003'];
  const PB = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED); const pool = PB.map((b, i) => ({ id: 'b' + (i + 1), ...b, title: F.BOOKS[IDS[i]].title }));

  console.log('① 사무실 PC — 공개 상품 화면 + 외부 정보만');
  const EXT_OFF = TK.TASKS.filter((t) => /^ext\./.test(t.k) && !['ext.ridi', 'ext.fx'].includes(t.k)).map((t) => t.k);
  const DB = {}; for (const b of pool) DB['prd_books/' + b.id] = b;
  /* 운영 외부 정보 — 리디: 두 권은 같은 지문 · 한 권은 운영이 막 받은 다른 값(까닭 모름) · 환율 같은 값 */
  for (const [i, b] of pool.entries()) { const r = await extProd('ridi', { isbn: b.isbn13, title: b.title, author: '' }, A.base); const sg = EXTX.sig({ none: !!r.none, d: r.d }, 'ridi');
    DB['ext_ebook/' + b.isbn13] = { isbn: b.isbn13, src: { ridi: { at: new Date().toISOString(), chk: new Date().toISOString(), sig: i === 2 ? 'zzz' : sg, none: !!r.none, d: i === 2 ? { ...r.d, p: 1 } : r.d } } }; } /* 셋째 권: 운영이 막 받은 다른 값 */
  DB['ext_fx/' + kday()] = { date: kday(), rates: { USD: 1 / FX.rates.USD, EUR: 1 / FX.rates.EUR, JPY: 1 / FX.rates.JPY, GBP: 1 / FX.rates.GBP }, src: 'frankfurter', at: new Date().toISOString() };
  { const r = await EXTX.fxRun({ keys: {}, http: async (o) => { const x = new URL(o.url); const q = await fetch(A.base + '/__ext/' + x.host + x.pathname + x.search); return { status: q.status, text: await q.text() }; } }); DB['ext_fx/' + kday()].rates = r.rates; DB['ext_fx/' + kday()].src = r.src; }
  A.reqs.length = 0; /* 위는 시험이 운영 값을 만들려고 한 요청 */
  let H = await L.startHelper({ aladin: A.base, env: { RN_COL2_EXT_BASE: A.base }, cfg: { pc: 'MJ-TEST', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: true, off: [...EXT_OFF, 'kpipa', 'nbMarket'], pass: { minN: 2, waitMin: 0.1 } } } }); const D = H.D;
  const W = webapp(H, DB, ['prd_ids', 'prd_books', 'ext_ebook', 'ext_fx']);
  try {
    await H.api('POST', '/relay/answer', { pool });
    const jd = await until(() => { const o = W.last('col2_jday'); const t = o && o.v.tasks; return t && t.product && t.product.n >= 3 && t['ext.ridi'] && t['ext.ridi'].n + t['ext.ridi'].fail >= 3 && t['ext.fx'] && t['ext.fx'].n >= 1 ? o : null; }, 200);
    const T = jd && jd.v.tasks; ok(T && jd.v.kind === 'office' && jd.id === kday() + '_MJ-TEST', '하루 요약 col2_jday/<날짜>_<PC> — 사무실 PC', jd && jd.id);
    ok(T && T.product.same === 3 && T.product.pass.can, "📘 공개 상품 화면: 3권 같음 · 오늘 '넘길 수 있음'(표본 기준 2 · 시험)", T && JSON.stringify(T.product.pass));
    ok(T && T['ext.ridi'].same === 2 && T['ext.ridi'].diff === 1 && T['ext.ridi'].un === 1 && !T['ext.ridi'].pass.can && /까닭 모를 다름 1/.test(T['ext.ridi'].pass.why), '🔎 리디: 운영과 같은 지문 2 · 다른 지문 1 = 까닭 모를 다름 → 아직 못 넘김', T && JSON.stringify(T['ext.ridi']));
    ok(T && T['ext.fx'].same === 1, '💱 환율: 운영 값과 같음', T && JSON.stringify(T['ext.fx']));
    const items = W.got.filter((o) => o.c === 'col2_jobs'); ok(items.length >= 4 && items.every((o) => o.v.verdict && o.v.task && o.v.pc === 'MJ-TEST') && items.some((o) => o.v.task === 'ext.ridi' && o.v.verdict === 'diff' && o.v.reasons.includes('diff')), '한 건마다 col2_jobs/<일>_<문서>(판정·까닭)', items.length + '건');
    ok(W.got.every((o) => /^col2_/.test(o.c)), '쓰기는 col2_* 칸만', [...new Set(W.got.map((o) => o.c))].join(','));
    ok(!A.reqs.some((q) => /wuseditemall|wshopitem|wshopsurvey/.test(q.path)), '사무실 PC는 로거 고유 화면(중고 첫 쪽·숍·평가)을 열지 않음');
    ok(A.reqs.filter((q) => /^\/(shop|__ext)/.test(q.path)).every((q) => q.cookie === null), '모든 그림자 읽기는 쿠키 없이(로그인 없음)');
    const ts = A.reqs.filter((q) => /^\/(shop|__ext)/.test(q.path)).map((q) => q.t); const gaps = ts.slice(1).map((t, i) => t - ts[i]); if (Math.min(...gaps) < 100) console.log('    (요청 차례)', A.reqs.map((q) => q.t % 100000 + ' ' + q.path.slice(0, 60)).join('\n     '));
    ok(gaps.length >= 5 && Math.min(...gaps) >= 200 * 0.85 - 60, '그림자 일도 같은 속도 규칙(한 장 뒤 기다림 · 상품 읽기와 함께 셈)', Math.min(...gaps) + 'ms');
    const jv = (await H.api('GET', '/jobs')).j; ok(jv.ok && jv.kind === 'office' && jv.tasks.find((t) => t.k === 'bench').notMine === '로거 고유 일(사무실 PC는 안 함)' && jv.tasks.find((t) => t.k === 'ext.ttb').who === 'office' && jv.core.lift && jv.core.lift.got.length === COL2.LIFT.fns.length && jv.core.ext, '/jobs — 일 목록·이 PC가 하는지·까닭·오늘 셈(로거 일은 사무실이 안 함 · 키 필요한 일은 사무실 PC만)');
    const st = (await H.api('GET', '/status')).j; ok(st.jobs && st.jobs.kind === 'office' && st.jobs.mine.some((x) => x.k === 'product' && x.can), '상태에 그림자 일 요약(웹앱 col2_ctl·진단에 보임)');
    console.log('  운영이 바쁘면 쉼');
    await H.api('POST', '/busy', { sec: 30, why: '시험 — 운영 바쁨' }); await wait(1200); const n0 = A.reqs.length; await wait(2500);
    ok(A.reqs.length === n0 && (await H.api('GET', '/status')).j.busy.on && /운영이 바쁘다고 알림/.test(H.out()), '바쁨 알림 동안 그림자 읽기 요청 없음 · 기록에 남김', A.reqs.length - n0);
    await H.api('POST', '/busy', { sec: 0 }); ok(!(await H.api('GET', '/status')).j.busy, '바쁨이 풀리면 이어감');
    const cp = await H.req('GET', '/compare'); ok(cp.st === 200 && /id="jobs"/.test(cp.b) && /col2-tasks\.js/.test(cp.b), '비교 화면에 일별 그림자 칸(같음 비율·다름 까닭·넘길 수 있음)');
  } finally { W.stop(); await H.stop(); killDir(D); }

  console.log('② 로거 PC — 로거 고유 일만 · 우리 숍 안 엶');
  const PP = await prodParse([['P.parseProductPage', F.productHtml('100001'), 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=100001'], ['P.parseUsedPage', usedHtml('100001')], ['S.parseShopSummary', shopHtml()], ['S.parseSurveyPage', surveyHtml()], ['L.benchParse', benchHtml()]]);
  const [pg, up, ss, sv, bp] = PP; const DB2 = {}; const old = new Date(Date.now() - 3 * 3600e3).toISOString();
  DB2['prd_book_metrics/b1'] = { priceList: pg.priceList, priceSales: pg.priceSales + 500, salesPoint: pg.salesPoint, rating: pg.rating, availability: pg.availability, usedTotal: up.usedTotal, usedTabs: up.tabs, usedMins: up.mins, buyback: up.buyback, lastCheckedAt: old }; /* 판매가만 3시간 전 값 — 때가 다름 */
  DB2['sellers/sc_12345'] = { sc: '12345', rev6m: ss.rev6m, shopTotal: ss.total, aladinGrade: ss.grade, isPro: ss.isPro, cancel3m: ss.cancel3m, rev6mAt: new Date().toISOString() };
  DB2['seller_review_daily/sc_12345'] = { days: TK.surveyDays(sv), at: new Date().toISOString() };
  for (const x of bp) DB2[`bench_items/12345_${x.id}`] = { sc: '12345', id: x.id, title: x.t, price: x.p, grade: x.g };
  DB2['app_settings/bench'] = { targets: [{ sc: '12345', on: true }, { sc: COL2.OWN_SC[0], on: true }] };
  A.reqs.length = 0;
  H = await L.startHelper({ aladin: A.base, env: { RN_COL2_EXT_BASE: A.base }, cfg: { pc: 'LOGGER-T', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: true, off: ['dynamic'], pass: { minN: 1, waitMin: 0.1 } } } }); const D2 = H.D;
  const W2 = webapp(H, DB2, ['prd_ids', 'prd_books', 'prd_book_metrics', 'sellers', 'seller_review_daily', 'bench_items', 'app_settings']);
  try {
    await H.api('POST', '/relay/answer', { pool: pool.slice(0, 1) });
    const jd = await until(() => { const o = W2.last('col2_jday'); const t = o && o.v.tasks; return t && ['metrics', 'usedPage', 'shopSum', 'survey', 'bench'].every((k) => t[k] && t[k].n >= 1) && t.bench.n >= 2 ? o : null; }, 240);
    const T = jd && jd.v.tasks; ok(T && jd.v.kind === 'logger', '하루 요약 — 로거 PC', jd && Object.keys(T || {}).join(','));
    ok(T && T.metrics.diff === 1 && T.metrics.un === 0 && T.metrics.why.move === 1 && T.metrics.pass.can, "📈 시장 지표: 판매가만 다름 = '때가 다름'(까닭 밝힘) → 넘길 수 있음", T && JSON.stringify(T.metrics));
    ok(T && T.usedPage.same === 1 && T.shopSum.same === 1 && T.survey.same === 1 && T.bench.same === 2, '🏷 중고 첫 쪽·🏪 숍 요약·⭐ 숍 평가(첫 쪽에 다 든 날만)·🎯 벤치마킹(운영 본체 해석 함수) 모두 운영과 같음', T && JSON.stringify({ u: T.usedPage.same, s: T.shopSum.same, v: T.survey.same, b: T.bench.same }));
    ok(!T.product && !Object.keys(T).some((k) => /^ext\./.test(k)) && !W2.got.some((o) => o.c === 'col2_books'), '로거는 공개 상품 화면 도서 정보·외부 정보를 하지 않음(사무실 PC 일)');
    ok(!A.reqs.some((q) => q.path.includes('SC=' + COL2.OWN_SC[0])) && !A.reqs.some((q) => /__ext/.test(q.path)), '우리 숍 화면은 열지 않음(중고 첫 쪽·벤치 대상에 있어도) · 바깥 사이트에 안 감');
    ok(A.reqs.filter((q) => /^\/shop/.test(q.path)).every((q) => q.cookie === null), '쿠키 없이(로그인 없음)');
    const lines = fs.readFileSync(path.join(D2, 'home', 'col2.log'), 'utf8'); ok(!/우리 숍|매물/.test(lines.replace(/\(로거 기록에 안 남김\)/g, '')) && /🎯 집중 벤치마킹/.test(lines), '로거 기록엔 우리 숍·매물 낱말을 남기지 않음(가림)');
  } finally { W2.stop(); await H.stop(); killDir(D2); }

  console.log('③ 운영 값을 못 받으면');
  H = await L.startHelper({ aladin: A.base, env: { RN_COL2_EXT_BASE: A.base }, cfg: { pc: 'LOGGER-U', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: true, off: ['usedPage', 'dynamic'], pass: { minN: 1, waitMin: 0.05 } } } }); const D3 = H.D;
  const W3 = webapp(H, {}, ['prd_ids', 'prd_books']); /* 지금 웹앱처럼 prd_* 만 넘김 */
  try { await H.api('POST', '/relay/answer', { pool: pool.slice(0, 1) });
    const jd = await until(() => { const o = W3.last('col2_jday'); return o && o.v.tasks.metrics && o.v.tasks.metrics.noprod >= 1 ? o : null; }, 120);
    const it = W3.got.filter((o) => o.c === 'col2_jobs' && o.v.task === 'metrics').slice(-1)[0];
    if (!jd || !it) console.log("    (디버그)", JSON.stringify(W3.got.map((o) => o.c + "/" + o.id + ":" + (o.v.verdict || "") + ":" + (o.v.why || ""))).slice(0, 1500), H.out().slice(-1500));
    ok(jd && jd.v.tasks.metrics.n === 0 && !jd.v.tasks.metrics.pass.can && it && it.v.verdict === 'noprod' && /웹앱이 아직 이 칸을 넘겨주지 않음/.test(it.v.why), "운영 칸을 웹앱이 넘기지 않으면 '운영 값 없음'(셈에서 빼고 못 넘김) — 까닭을 남김", it && it.v.why);
  } finally { W3.stop(); await H.stop(); killDir(D3); }
  A.srv.close(); L.done('t_jobs');
})();
