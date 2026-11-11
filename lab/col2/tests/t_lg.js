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
  let H = await L.startHelper({ aladin: A.base, cfg: { pc: 'LOGGER-L', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 200 }, watch: { tickSec: 1 }, jobs: { on: true, fx: { after: '00:00', keyWaitMin: 0 }, off: ['dynamic', 'shopSum', 'survey', 'bench'], pass: { minN: 1, waitMin: 0.2 } } } }); const D = H.D;
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
  console.log('⑤ 🟩 네이버 로거 다리 rnC2nv (11/11 nvfix1 · 로거 웹앱 없이 받는 열쇠·상태·봉투·주문)');
  { const j0 = SRC.indexOf('(function rnC2nv()'); const j1 = SRC.indexOf('})();', j0); const NB = j0 > 0 ? SRC.slice(j0, j1 + 5) : '';
    const cols = [...NB.matchAll(/collection\('([\w-]+)'\)/g)].map((m) => m[1]); const OUTC = (NB.match(/const OUT = \{(.*?)\}; \/\*/) || [])[1] || '';
    ok(NB && /!isLogger\(\)\) return/.test(NB) && cols.length && cols.every((c) => ['col2_naver', 'col2_naver_cmd'].includes(c)) && /crm_naver_orders/.test(OUTC) && /nv_listings/.test(OUTC) && /col2_naver_jobs/.test(OUTC) && !/prd_|shp_|app_secrets|app_settings|crm_(?!naver_orders)/.test(NB) && /runTransaction/.test(NB) && /webOn\(\)\) return/.test(NB) && /FieldValue\.delete\(\)/.test(NB), '다리 rnC2nv: 로거에서만 · 네이버 칸 다섯만(col2_naver·col2_naver_cmd·crm_naver_orders·nv_listings·col2_naver_jobs) · 붙잡기 트랜잭션 · 웹앱 있으면 비킴 · 봉투 지움', { cols, n: NB.length });
    /* 실제로 돌려 봄 — 가짜 시계·가짜 Firestore·가짜 번외(127.0.0.1:8797) */
    const vm = require('vm'); let T = Date.parse('2026-11-11T08:00:00Z'); class FD extends Date { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } }
    const mk = (o) => { const FS = {}; const col = (n) => (FS[n] = FS[n] || {}); const H = { calls: [], st: o.st, cmd: [] }; let txN = 0;
      const ref = (n, id) => ({ id, get: async () => ({ exists: col(n)[id] != null, data: () => (col(n)[id] == null ? undefined : JSON.parse(JSON.stringify(col(n)[id]))) }), set: async (v, op) => { const cur = op && op.merge ? { ...(col(n)[id] || {}) } : {}; for (const [k, x] of Object.entries(v || {})) { if (x && x.__del) delete cur[k]; else cur[k] = x; } col(n)[id] = cur; } });
      const q = (n, f) => ({ where: (a, op, v) => q(n, [a, v]), limit: () => q(n, f), get: async () => { const ids = Object.keys(col(n)).filter((id) => !f || col(n)[id][f[0]] === f[1]); return { forEach: (cb) => ids.forEach((id) => cb({ id, data: () => JSON.parse(JSON.stringify(col(n)[id])) })) }; }, doc: (id) => ref(n, id), onSnapshot: (cb) => { const fire = () => cb({ forEach: (g) => Object.keys(col(n)).forEach((id) => g({ id, data: () => col(n)[id] })) }); fire(); H.fire = fire; return () => {}; } });
      const db = { collection: (n) => q(n), runTransaction: async (fn) => { txN++; return fn({ get: (r) => r.get(), set: (r, v, op) => r.set(v, op) }); } };
      const fb = { apps: [1], auth: () => ({ currentUser: { uid: 'u' } }), firestore: Object.assign(() => db, { FieldValue: { delete: () => ({ __del: 1 }) } }) };
      const GM = (r) => { const u = new URL(r.url); H.calls.push(u.pathname); const b = r.data ? JSON.parse(r.data) : {}; const send = (s, j) => setImmediate(() => (s === 0 ? r.onerror() : r.onload({ status: s, responseText: JSON.stringify(j) })));
        if (u.pathname === '/nv/st') { if (H.st === 404) return send(404, { ok: false }); if (H.st === 0) return send(0); return send(200, { ok: true, ver: '0.1.25', pc: 'LOGGER', nv: H.st }); }
        if (u.pathname === '/nv/cmd') { H.cmd.push(b); return send(200, { ok: true, saved: true, test: { ok: true, msg: '✅ 연결됨' } }); }
        if (u.pathname === '/nv/feed') { if (b.ack) { H.ack = b.ack; return send(200, { ok: true, out: [] }); } return send(200, { ok: true, out: H.out || [] }); } return send(404, {}); };
      const G = { firebase: fb, GM_getValue: (k, d) => d, GM_xmlhttpRequest: GM, GM_info: { script: { version: '1.89.264' } }, setTimeout: () => 0, setInterval: () => 0, setImmediate, Date: FD, URL, JSON, Math, String, Number, Object, Array, Promise, RegExp, Error, encodeURIComponent, console };
      G.window = G; G.globalThis = G; G.top = G; G.location = { hostname: 'www.aladin.co.kr' }; G.__rnPcName = { get: () => o.pc || 'LOGGER' }; G.__rnRole = () => 'lead'; G.__rnLog = () => {}; G.__rnC2lgPd = o.pd || null;
      vm.createContext(G); vm.runInContext(NB, G); return { G, FS, H, db, txN: () => txN, tick: async () => { T += 11 * 60e3; await G.__rnC2nvTick(); await new Promise((r) => setTimeout(r, 30)); } }; };
    const ON = { on: true, pub: 'SPKI1', cred: { has: false }, test: null, write: { on: false }, ord: {}, prd: {}, net: null, ipReg: null };
    { const X = mk({ pc: 'HOME', st: ON }); await X.tick(); ok(!X.H.calls.length && !Object.keys(X.FS).length, '로거가 아닌 PC — 번외도 Firestore도 건드리지 않음', X.H.calls); }
    { const X = mk({ st: 404, pd: { at: T, webAt: 0, ver: '0.1.21' } }); await X.tick(); const s = (X.FS.col2_naver || {}).state || {}; ok(s.via === 'col' && /옛 판\(0\.1\.21/.test(s.off || '') && /0\.1\.22 이상/.test(s.off) && s.colVer === '1.89.264' && !(X.FS.col2_naver || {}).pub, '번외가 옛 판(0.1.21 · /nv/st 없음) — 상태에 까닭만(off) · 열쇠 없음', s); }
    { const { net, ...OLD } = ON; void net; const X = mk({ st: OLD }); X.FS.col2_naver_cmd = { c1: { k: 'cred', st: 'new', env: { ct: 'x' }, at: '2026-11-11T07:59:00Z' } }; await X.tick(); const s = (X.FS.col2_naver || {}).state || {};
      ok(!(X.FS.col2_naver || {}).pub && X.FS.col2_naver_cmd.c1.st === 'new' && !X.H.cmd.length && /와이파이 확인이 없음/.test(s.off || ''), '(정범님 \'와이파이만\') 와이파이 문이 없는 번외 — 받는 열쇠 안 올림 · 봉투 안 넘김 · 까닭(off)', s); }
    { const X = mk({ st: 0 }); await X.tick(); const s = (X.FS.col2_naver || {}).state || {}; ok(/응답 없음/.test(s.off || ''), '번외가 꺼져 있음 — 상태에 「응답 없음」', s.off); }
    { const X = mk({ st: { on: false, why: '네이버 일은 로거 PC만' } }); await X.tick(); ok(/로거 PC만/.test(((X.FS.col2_naver || {}).state || {}).off || ''), '번외가 네이버를 안 맡음 — 그 까닭 그대로'); }
    { const X = mk({ st: ON }); X.FS.col2_naver_cmd = { c1: { k: 'cred', st: 'new', env: { alg: 'RSA-OAEP-256+A256GCM', ct: 'x' }, by: 'HOME', at: '2026-11-11T07:59:00Z' }, c2: { k: 'test', st: 'took', tookBy: 'LOGGER', at: '2026-11-11T07:58:00Z' } };
      X.H.out = [{ k: 'crm_naver_orders/PO9', c: 'crm_naver_orders', id: 'PO9', v: { id: 'PO9', sku: 'S1', rcv: { name: '받는분A' } } }, { k: 'nv_listings/669', c: 'nv_listings', id: '669', v: { originNo: '669', live: true } }, { k: 'prd_books/x', c: 'prd_books', id: 'x', v: { bad: 1 } }, { k: 'crm_customers/x', c: 'crm_customers', id: 'x', v: { bad: 1 } }];
      await X.tick(); const c1 = X.FS.col2_naver_cmd.c1, c2 = X.FS.col2_naver_cmd.c2; const st = X.FS.col2_naver.state;
      ok(X.FS.col2_naver.pub && X.FS.col2_naver.pub.spki === 'SPKI1' && X.FS.col2_naver.pub.via === 'col', '받는 열쇠(공개 열쇠) → col2_naver/pub — 웹앱 없이 올라옴', X.FS.col2_naver.pub);
      ok(c1.st === 'done' && !('env' in c1) && c1.res.ok && /수집기 LOGGER/.test(c1.tookBy) && X.H.cmd.length === 1 && X.H.cmd[0].k === 'cred' && c2.st === 'took', '새 봉투만 붙잡아(트랜잭션) 넘기고 done · 봉투 지움 · 이미 붙잡힌 것(took)은 안 넘김', { c1, n: X.H.cmd.length });
      ok(X.FS.crm_naver_orders.PO9 && X.FS.nv_listings['669'] && !X.FS.prd_books && !X.FS.crm_customers && X.H.ack.includes('crm_naver_orders/PO9') && !X.H.ack.includes('prd_books/x'), '읽은 주문·매물 → crm_naver_orders·nv_listings만(다른 칸 거절) · ack', X.H.ack);
      ok(st.via === 'col' && !st.off && st.nv && st.ver === '0.1.25' && !JSON.stringify(st).includes('SPKI1'), '상태 → col2_naver/state(via col · 값·열쇠 없음)', st);
      X.H.cmd.length = 0; X.FS.col2_naver_cmd.c3 = { k: 'test', st: 'new', at: '2026-11-11T08:30:00Z' }; X.G.__rnC2lgPd = { at: T, webAt: T + 11 * 60e3 - 60e3 }; const n0 = X.H.calls.length; await X.tick();
      ok(X.H.calls.length === n0 && X.FS.col2_naver_cmd.c3.st === 'new', '이 PC 웹앱이 3분 안에 번외를 당겼으면 비킴 — 번외·Firestore 손대지 않음(웹앱이 함 · 하나만)', X.H.calls.slice(n0));
      X.G.__rnC2lgPd = { at: T, webAt: 0 }; X.FS.col2_naver.state = { via: 'web', at: new Date(T + 11 * 60e3 - 120e3).toISOString(), nv: {} }; X.H.fire(); const n1 = X.H.calls.length; await X.tick();
      ok(X.H.calls.length === n1 && X.FS.col2_naver_cmd.c3.st === 'new', '웹앱이 6분 안에 상태를 썼으면(via web) 비킴', X.H.calls.slice(n1));
      X.FS.col2_naver.state.at = '2026-11-01T00:00:00Z'; X.H.fire(); await X.tick(); ok(X.FS.col2_naver_cmd.c3.st === 'done' && X.H.cmd.length === 1, '웹앱 소식이 끊기면 다리가 다시 맡음', X.FS.col2_naver_cmd.c3); }
  }
  A.srv.close(); L.done('t_lg');
})();
