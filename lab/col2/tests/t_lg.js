/* t_lg — (11/11 col2rep2 · 약속 38·48 '로거 번외 읽은 것 0') 🛰 로거 번외가 웹앱 없이도 돎
 *  까닭(11/11 진단): ① 로거 운영 수집기가 쉬지 않고 일해 다리(c2busyTick)가 1분마다 '바쁨 180초' → 로거 그림자 일이 차례를 못 받음 ② 로거엔 웹앱이 늘 열려 있지 않아 대상·운영 값·결과 올리기를 받을 길이 없었음
 *  ① 로거 번외: 운영 일 '바쁨' 알림은 쉼으로 보지 않음(테더링 알림만 쉼) · 사무실 PC는 그대로 쉼
 *  ② POST /lg/books(로거만): 운영 로거가 방금 읽은 책(도서 번호·상품 번호만) → 시장 지표·중고 첫 쪽 그림자 · 수집기 다리(by '수집기 …')가 운영 값을 넘기고 col2_만 받아 씀 → 하루 요약
 *  ③ 수집기 다리가 당겨도 '웹앱 본 때'(webAt)는 그대로 · 상태에 다리 소식 · 로거 하루 몫은 따로 작게(LOGGER.dayCap)
 *  ④ 운영 수집기 본문(src/readnow-collector.src.js): 다리 rnC2lg는 로거에서만 · col2_ 칸만 씀 · 우리 상품·매물·주문 칸을 읽지 않음 · 시장 지표 뒤 책 기록은 로거에서만(메모리 300권) · KPIPA 넘김 건너뛰기
 * 실행: node tests/t_lg.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p); } catch (e) {} } };
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const usedHtml = (id) => `<!doctype html><title>중고 | 알라딘</title><body><div class="Ere_usedsell_list2"><a>전체 (1)</a></div><table class="Ere_usedsell_table"><tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=7${id}">책</a></td><td class="seller"><a href="/shop/usedshop/wshopitem.aspx?SC=12345">가게일</a></td><td class="price"><span class="Ere_fs20">5,000</span></td></tr></table></body>`;
function fake() { const reqs = []; const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); reqs.push({ path: u.pathname + u.search, cookie: q.headers.cookie || null });
    const H = (h) => { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(h); };
    if (u.pathname === '/') return H('<!doctype html><title>알라딘</title>첫 화면');
    if (u.pathname === '/shop/wproduct.aspx') { const h = F.productHtml(u.searchParams.get('ItemId')); return h ? H(h) : (s.writeHead(404), s.end()); }
    if (u.pathname === '/shop/UsedShop/wuseditemall.aspx') return H(usedHtml(u.searchParams.get('ItemId')));
    s.writeHead(404); s.end('없음'); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, reqs, base: `http://127.0.0.1:${srv.address().port}` }))); }
/* 로거 운영 수집기 다리 흉내(rnC2lg) — 부탁한 운영 칸 중 정한 칸만 넘기고 col2_ 칸 결과만 받아 둠 */
function bridge(H, DB) { const got = []; let stop = false, pulls = 0;
  (async () => { while (!stop) { try { const pd = (await H.api('GET', '/relay/pending?by=' + encodeURIComponent('수집기 LOGGER-L'))).j; if (pd && pd.ok) { pulls++;
        const docs = (pd.want || []).filter((w) => ['prd_book_metrics', 'sellers', 'seller_review_daily', 'bench_items'].includes(w.c)).map((w) => ({ c: w.c, id: w.id, v: DB[w.c + '/' + w.id] === undefined ? null : DB[w.c + '/' + w.id] })); if (docs.length) await H.api('POST', '/relay/answer', { docs });
        const keys = (pd.out || []).filter((o) => /^col2_/.test(o.c) && !o.op).map((o) => { got.push(o); return o.k; }); if (keys.length) await H.api('POST', '/relay/ack', { keys }); } } catch (e) {} await wait(250); } })();
  return { got, pulls: () => pulls, stop: () => { stop = true; }, last: (c) => got.filter((o) => o.c === c).slice(-1)[0] || null }; }

(async () => {
  const A = await fake(); const ID = Object.keys(F.BOOKS)[0];
  console.log('① 바쁨 알림');
  let H = await L.startHelper({ aladin: A.base, cfg: { pc: 'LOGGER-L', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: true, off: ['dynamic', 'shopSum', 'survey', 'bench'], pass: { minN: 1, waitMin: 0.2 } } } }); const D = H.D;
  const DB = {}; const BR = bridge(H, DB);
  try {
    const b1 = await H.api('POST', '/busy', { sec: 180, why: '도서 정보·시장 지표 갱신' }); const s1 = (await H.api('GET', '/status')).j;
    ok(b1.j && b1.j.lgIgnore && !s1.busy, "로거: 운영 일 '바쁨' 알림은 쉼으로 보지 않음(로거 운영은 늘 일함)", JSON.stringify(s1.busy));
    await H.api('POST', '/busy', { sec: 120, why: '🛡 로거 테더링 문 닫힘 — 몫 다 씀' }); const s2 = (await H.api('GET', '/status')).j; await H.api('POST', '/busy', { sec: 0, why: '테더링 문 열림' }); const s3 = (await H.api('GET', '/status')).j;
    ok(s2.busy && /테더링/.test(s2.busy.why) && !s3.busy, '로거: 테더링 문이 닫혔다는 알림만 쉼 · 열리면 풂', JSON.stringify([s2.busy, s3.busy]));
    ok(s1.auto && s1.auto.dayCap === COL2.LOGGER.dayCap, `로거 그림자 하루 몫은 따로 작게(${COL2.LOGGER.dayCap}장 · 테더링)`, s1.auto && s1.auto.dayCap);
    { const r = await H.api('POST', '/set', { k: 'pace.dayCap', v: 1600 }); const sx = (await H.api('GET', '/status')).j; ok(r.j && r.j.ok && sx.auto && sx.auto.dayCap === COL2.LOGGER.dayCap, `모든 PC 공통 '알라딘 화면 하루'(1600)가 와도 로거 몫(${COL2.LOGGER.dayCap})이 먼저(판 내기 합침)`, sx.auto && sx.auto.dayCap); await H.api('POST', '/set', { k: 'pace.dayCap', v: null }); }
    console.log('② 운영 로거가 읽은 책 → 그림자');
    const bad = await H.api('POST', '/lg/books', { books: [{ bookId: 'b/1', itemId: '1' }, { bookId: 'b2', itemId: 'x' }] }); ok(bad.j && bad.j.n === 0, '이상한 번호는 버림', JSON.stringify(bad.j));
    const PB = await L.prodBooks(F.productHtml, [ID], COL2.BOOK_FIXED); const pg = PB[0];
    DB['prd_book_metrics/bk1'] = { bookId: 'bk1', lastCheckedAt: new Date().toISOString(), usedAt: new Date().toISOString() };
    const r = await H.api('POST', '/lg/books', { books: [{ bookId: 'bk1', itemId: ID }] }); ok(r.j && r.j.n >= 2, '로거 책 1권 → 시장 지표·중고 첫 쪽 차례', JSON.stringify(r.j));
    const jd = await until(() => { const o = BR.last('col2_jday'); const t = o && o.v.tasks; return t && t.metrics && t.metrics.n + t.metrics.noprod >= 1 && t.usedPage && t.usedPage.n + t.usedPage.noprod >= 1 ? o : null; }, 200);
    ok(jd && jd.v.kind === 'logger' && jd.v.tasks.metrics.n >= 1 && jd.v.tasks.usedPage.n >= 1, '웹앱 없이(수집기 다리만) 시장 지표·중고 첫 쪽 그림자가 운영 값과 견줘 하루 요약까지(로거 읽은 것 0 → 돎)', jd && JSON.stringify({ m: jd.v.tasks.metrics, u: jd.v.tasks.usedPage }).slice(0, 400));
    ok(A.reqs.filter((q) => /^\/shop/.test(q.path)).every((q) => q.cookie === null) && !A.reqs.some((q) => q.path.includes('SC=' + COL2.OWN_SC[0])), '쿠키 없이 · 우리 숍 화면 안 엶');
    console.log('③ 상태');
    const s4 = (await H.api('GET', '/status')).j; const pd = (await H.api('GET', '/relay/pending?by=' + encodeURIComponent('수집기 LOGGER-L'))).j;
    ok(pd.kind === 'logger' && !pd.webAt && s4.relay && s4.relay.colAt && s4.relay.lgN >= 2 && !s4.relay.pullAt, "수집기 다리가 당겨도 '웹앱 본 때'는 그대로(자리 판단과 안 섞임) · 상태에 다리 소식·받은 책 차례", JSON.stringify({ kind: pd.kind, webAt: pd.webAt, relay: s4.relay }).slice(0, 300));
    ok(!JSON.stringify(BR.got).match(/우리 숍|매물|isbn13|title"/) , '로거 결과에 우리 상품 이름·ISBN 없음(받은 것은 번호뿐)');
  } finally { BR.stop(); await H.stop(); killDir(D); }
  console.log('① 사무실 PC는 그대로');
  H = await L.startHelper({ aladin: A.base, cfg: { pc: 'MJ-LGT', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: false } } }); const D2 = H.D;
  try { await H.api('POST', '/busy', { sec: 60, why: '도서 정보·시장 지표 갱신' }); const s = (await H.api('GET', '/status')).j; const r = await H.api('POST', '/lg/books', { books: [{ bookId: 'bk1', itemId: ID }] });
    ok(s.busy && r.st === 403 && s.auto.dayCap === COL2.PACE.dayCap, "사무실 PC: '바쁨'이면 쉼(그대로) · /lg/books 거절(로거만) · 하루 몫 그대로", JSON.stringify({ busy: s.busy, st: r.st, cap: s.auto.dayCap })); } finally { await H.stop(); killDir(D2); }
  console.log('④ 운영 수집기 본문');
  const SRC = fs.readFileSync(path.join(L.PROD_REPO, 'src/readnow-collector.src.js'), 'utf8'); const i0 = SRC.indexOf('(function rnC2lg()'); const i1 = SRC.indexOf('})();', i0); const BRG = i0 > 0 ? SRC.slice(i0, i1) : '';
  ok(BRG && /!isLogger\(\)\) return/.test(BRG) && /\^col2_\[\\w-\]\+\$/.test(BRG) && /o\.op \|\|/.test(BRG) && !/prd_listings|prd_books'|shp_state|crm_|app_secrets|prd_ids/.test(BRG) && /\/lg\/books/.test(BRG) && /__rnTgate/.test(BRG) && /webAt/.test(BRG), '다리 rnC2lg: 로거에서만 · col2_ 칸만 씀(넘김 op 안 씀) · 우리 상품·매물·주문·문의·키 칸을 읽지 않음 · 책 차례·테더링 문·웹앱 있으면 비킴', BRG.length);
  ok(/if \(PUBONLY && page\.aladinItemId\) \{ const Q = \(globalThis\.__rnC2lgBk/.test(SRC) && /Q\.length > 300/.test(SRC), '시장 지표 뒤 책 기록은 로거(PUBONLY)에서만 · 메모리 300권(GM에 안 씀)');
  ok(/const HO_KP = await/.test(SRC) && /HO_KP \? \(!x \|\| !x\[type\]\) && d < recent/.test(SRC) && /8 \* 3600e3/.test(SRC), "KPIPA: 넘김이 켜지고 번외 소식이 8시간 안일 때만 '최근 7일'을 건너뜀(빈 날 채우기·주제분류는 그대로)");
  A.srv.close(); L.done('t_lg');
})();
