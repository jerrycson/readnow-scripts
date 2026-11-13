// tC2ALB — 정범님 11/09 밤 '로그인 일(알라딘 샵매니저)도 번외로' · lab/col2/LOGIN_PLAN.md ⑤-1
//  수집기(머리 그대로) 🟧 번외 알라딘 다리(rnC2al) 시험:
//   ① 10초마다 번외 도우미(127.0.0.1:8797 — 시험에선 가짜)에 POST /al/feed {by, seat, hold, opLostAt, cfg} · 그 밖 칸 없음(손님 정보 없음)
//   ② 🪑 자리: 번외가 알라딘 읽기를 켰을 때만 계정 문서(app_settings/aladin_login)의 '<PC>~col2' 자리를 운영 규칙(seatAsk·seatKeep)으로 받음 · 우선순위 -1(클라우드보다 뒤)
//       · 자리가 꽉 차면 받지 않음(seat.ok 거짓) · 다른 기기가 기다리면 번외가 넘김 · 번외가 끄면 내려놓음 · 계정 문서 col2Off면 안 줌
//   ③ 🚚 출고 중(hold.on)이면 hold를 넘기고 seat.ok 거짓 · 자리를 내려놓음(약속 0-1)
//   ④ opLostAt = 운영 세션이 진짜 풀린 시각(rnu-login-lost) — 로그인 모듈이 '로그인됨 → 풀림'에서만 적음
//   ⑤ 로거 크롬·LOGGER PC에서는 안 돎(약속 0) · 번외가 없으면 자리를 내려놓음
//   ⑦ ⏳ 운영이 긴 일을 하는 동안 POST /busy {sec, why}(번외 0.1.9가 그림자 일을 쉼) · 끝나면 {sec: 0} 한 번
//   ⑥ 머리 서명 그대로(split.js 결과 HSIG = 8559039d5a96110b · 머리 바꾼 판 가지에선 8ab2f661d1d8afa8)
//  사용: node tC2ALB.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2ALB — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };

/* 가짜 Firebase — 계정 문서 하나(트랜잭션 · merge는 Firestore처럼 깊이 합침) · 쓰기는 window.__W */
const FB = (a) => { const W = (window.__W = []); const docs = (window.__D = a.docs || {});
  const deep = (o, v) => { const r = { ...(o || {}) }; for (const [k, x] of Object.entries(v || {})) r[k] = x && typeof x === 'object' && !Array.isArray(x) && r[k] && typeof r[k] === 'object' ? deep(r[k], x) : x; return r; };
  const ref = (c, id) => ({ id, c, get: async () => { const v = docs[c + '/' + id]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, set: async (v, o) => { W.push({ c, id, v: JSON.parse(JSON.stringify(v)) }); docs[c + '/' + id] = o && o.merge ? deep(docs[c + '/' + id], v) : v; } });
  const fsx = { collection: (c) => ({ doc: (id) => ref(c, id) }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: (r, v, o) => { r.set(v, o); } }) };
  const firestore = () => fsx; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (seed, helper, docs, pc) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b, h: rq.headers() }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
      window.__LOGS = []; window.__rnLog = (s, lv, m) => window.__LOGS.push(lv + ' ' + m); window.__rnPcName = { get: () => a.pc }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false });
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      (new Function('a', a.fb))(a); }, { seed, fb: `(${FB.toString()})(a)`, docs: docs || {}, pc: pc || 'OFFICE1' });
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };
  const tick = async (p, force) => { await p.evaluate((f) => window.__rnC2alTick && window.__rnC2alTick(f), !!force); await p.waitForTimeout(350); };
  const dev = (p, who) => p.evaluate((w) => { const d = window.__D['app_settings/aladin_login'] || {}; return { dev: (d.dev || {})[w] || null, wait: (d.wait || {})[w] || null }; }, who);
  const AL = { on: true, logger: false, login: 'ok', active: false, seat: false, pp: null };
  const helperOf = (S) => (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL, ...S } } : pth === '/busy' ? { ok: true } : null);

  // ── ①② 자리 받기 → 다음 알림에 seat.ok
  { const S = {}; const { p, HL } = await mk({ 'rnu-login-lost': 1762700000000 }, helperOf(S), {});
    await p.waitForTimeout(300); await tick(p);
    const f1 = HL.filter((x) => x.p === '/al/feed')[0];
    ok(f1 && f1.h['x-rn-col2'] === '1' && f1.b.by === 'OFFICE1' && f1.b.seat && f1.b.seat.ok === false && f1.b.hold && f1.b.hold.on === false && f1.b.opLostAt === 1762700000000 && f1.b.cfg && f1.b.cfg.off === false, `POST /al/feed {by, seat, hold, opLostAt, cfg}: ${JSON.stringify(f1 && f1.b)}`);
    ok(f1 && Object.keys(f1.b).sort().join(',') === 'by,cfg,hands,hold,opLostAt,seat', `알림 칸은 여섯뿐(손님 정보·쿠키 없음): ${f1 && Object.keys(f1.b)}`);
    ok(f1 && f1.b.hands && Object.keys(f1.b.hands).sort().join(',') === 'done,login,page,title,v,ver,why,work' && !/cookie|asid|pw/i.test(JSON.stringify(f1.b.hands)), `(11/12 hands1) 🖐 손발 칸도 정해진 것만(로그인 여부·화면 이름·판·맡김 결과): ${f1 && f1.b.hands && Object.keys(f1.b.hands)}`);
    let d = await dev(p, 'OFFICE1~col2'); ok(d.dev && d.dev.in === true && d.dev.pri === -1 && d.dev.how === '자리', `번외가 켜져 있으니 'OFFICE1~col2' 자리를 운영 규칙으로 받음(우선순위 -1): ${JSON.stringify(d)}`);
    await p.waitForTimeout(1700); await tick(p); const f2 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0];
    ok(f2.b.seat.ok === true && /자리 받음\(\d\/4대\)/.test(f2.b.seat.why), `다음 알림에 seat.ok 참: ${JSON.stringify(f2.b.seat)}`);
    const nW = await p.evaluate(() => window.__W.length); await tick(p); await tick(p); ok((await p.evaluate(() => window.__W.length)) === nW, '자리 신호는 10~15분마다만(알림마다 계정 문서를 쓰지 않음)');
    // 다른 기기가 기다림 → 번외가 넘김
    await p.evaluate(() => { const d = window.__D['app_settings/aladin_login']; d.wait = { ...(d.wait || {}), PC2: { at: Date.now(), since: Date.now(), pri: 1 } }; });
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); await p.waitForTimeout(1700); await tick(p); const f3 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0];
    ok(d.dev && d.dev.in === false && d.dev.yield === true && f3.b.seat.ok === false && /PC2가 자리를 기다려 번외가 넘김/.test(f3.b.seat.why), `다른 기기(PC2)가 기다리면 번외가 먼저 넘김: ${JSON.stringify({ d, s: f3.b.seat })}`);
    await p.evaluate(() => { delete window.__D['app_settings/aladin_login'].wait.PC2; });
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev && d.dev.in === true, '기다리던 기기가 없어지면 다시 받음');
    // ③ 출고 중 → hold 넘김 · seat.ok 거짓 · 자리 내려놓음
    await p.evaluate(() => { window.__HOLD = 1; }); await p.waitForTimeout(1700); await tick(p); await tick(p, true); const f4 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; d = await dev(p, 'OFFICE1~col2');
    ok(f4.b.hold && f4.b.hold.on === true && f4.b.seat.ok === false && d.dev.in === false, `🚚 출고 중이면 hold.on을 넘기고 자리를 쓰지 않음(내려놓음): ${JSON.stringify({ h: f4.b.hold, s: f4.b.seat, d: d.dev })}`);
    await p.evaluate(() => { window.__HOLD = 0; }); await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === true, '출고가 끝나면 그 자리부터 다시');
    // 번외가 알라딘 읽기를 끔 → 내려놓음
    S.on = false; await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false && d.dev.how === '번외 쉼' && !d.wait, `번외가 끄면 자리를 내려놓음: ${JSON.stringify(d)}`);
    const nW2 = await p.evaluate(() => window.__W.length); await tick(p, true); await tick(p, true); ok((await p.evaluate(() => window.__W.length)) === nW2, '꺼진 동안엔 계정 문서를 다시 쓰지 않음');
    // 핑퐁 의심(번외가 pp)이면 자리를 묻지 않음
    S.on = true; S.pp = '시험 핑퐁'; await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false, '번외가 핑퐁 의심으로 멈춘 동안엔 자리를 묻지 않음');
    S.pp = null; await tick(p, true);
    // ⑤ 번외가 사라짐 → 내려놓음
    await p.unroute('**/*'); await p.route('**/*', (rt) => (new URL(rt.request().url()).host === '127.0.0.1:8797' ? rt.abort() : rt.fulfill({ contentType: 'text/html', body: '<html></html>' })));
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false, `번외 도우미가 없으면 자리를 내려놓음: ${JSON.stringify(d.dev)}`);
    await p.close(); }

  // ── 자리가 꽉 참(🔒 상시 PC 3 + PC 하나 = 4대) → 받지 않음 · 기다림 줄에만(맨 뒤)
  { const now = Date.now(); const docs = { 'app_settings/aladin_login': { dev: { 'JS-MAIN': { in: true, at: now, pri: 1 }, 'MJ-MAIN': { in: true, at: now, pri: 1 }, HOME: { in: true, at: now, pri: 1 }, PC5: { in: true, at: now, pri: 1 } } } };
    const { p, HL } = await mk({}, helperOf({}), docs); await tick(p); await p.waitForTimeout(1700); await tick(p); const f = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; const d = await dev(p, 'OFFICE1~col2');
    ok(f.b.seat.ok === false && /자리 기다림/.test(f.b.seat.why) && (!d.dev || d.dev.in === false) && d.wait && d.wait.pri === -1, `자리가 꽉 차면 받지 않음(약관 4대 · 그림자는 맨 뒤): ${JSON.stringify({ s: f.b.seat, d })}`);
    const other = await p.evaluate(() => { const R = globalThis.__rnLoginRule; const d = window.__D['app_settings/aladin_login']; const now = Date.now(); d.dev.PC5 = { in: false, at: now }; return R.seatAsk(d, 'PC3', now, { pri: 1 }, 0.5).ok; });
    ok(other === true, '번외가 기다림 줄에 있어도 다른 PC(우선순위 1)는 먼저 자리를 받음');
    await p.close(); }
  // ── 계정 문서 col2Off → 안 줌
  { const { p, HL } = await mk({}, helperOf({}), { 'app_settings/aladin_login': { col2Off: true } }); await tick(p); await p.waitForTimeout(1700); await tick(p); const f = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; const d = await dev(p, 'OFFICE1~col2');
    ok(f.b.seat.ok === false && f.b.cfg.off === true && !d.dev, `계정 문서 col2Off면 번외 자리를 주지 않고 cfg.off를 넘김: ${JSON.stringify(f.b)}`); await p.close(); }
  // ── ⑦ 긴 일 알림 /busy
  { const { p, HL } = await mk({}, helperOf({}), {}); const bt = async () => { await p.evaluate(() => window.__rnC2busyTick()); await p.waitForTimeout(300); };
    await bt(); ok(!HL.some((x) => x.p === '/busy'), '하는 일이 없으면 /busy를 보내지 않음');
    await p.evaluate(() => { window.__rnWorkNow = () => ({ job: '매일 자동 상품 조회', img: false, crm: false }); }); await bt(); let b = HL.filter((x) => x.p === '/busy');
    ok(b.length === 1 && b[0].b.sec === 180 && b[0].b.why === '매일 자동 상품 조회' && Object.keys(b[0].b).sort().join(',') === 'sec,why', `긴 일을 하는 동안 /busy {sec:180, why}: ${JSON.stringify(b.map((x) => x.b))}`);
    await bt(); b = HL.filter((x) => x.p === '/busy'); ok(b.length === 2 && b[1].b.sec <= 1800, '하는 동안 1분마다 다시 알림(30분 넘지 않음)');
    await p.evaluate(() => { window.__rnWorkNow = () => ({ job: null, img: false, crm: false }); }); await bt(); await bt(); b = HL.filter((x) => x.p === '/busy');
    ok(b.length === 3 && b[2].b.sec === 0, `끝나면 {sec:0} 한 번만: ${JSON.stringify(b.map((x) => x.b))}`); await p.close(); }
  // ── ⑤ 로거 크롬 · LOGGER PC
  { const { p, HL } = await mk({ 'rn-pubChrome': true }, helperOf({}), {}); await tick(p, true); await tick(p, true); ok(HL.length === 0 && !(await dev(p, 'OFFICE1~col2')).dev, '로거 크롬은 다리를 쓰지 않음(약속 0)'); await p.close(); }
  { const { p, HL } = await mk({}, helperOf({}), {}, 'LOGGER-1'); await tick(p, true); ok(HL.length === 0, 'LOGGER PC 이름이어도 다리를 쓰지 않음'); await p.close(); }

  // ── ④ 로그인 모듈: 운영 세션이 '로그인됨 → 진짜 풀림'일 때만 rnu-login-lost
  { const gov = cut('(function rnLoginGovInit()', '\n})();');
    ok(/function lostMark\(\) \{ try \{ if \(PUB\(\)\) return; const s = st\(\); if \(s\.in !== false\) S\('rnu-login-lost', Date\.now\(\)\); \} catch \(e\) \{\} \}/.test(gov), '로그인 모듈 lostMark — 로거 아님 · 이미 풀린 채(in 거짓)면 적지 않음');
    ok(/lostMark\(\); devPut\(false, 'out'\); return 'out';/.test(gov) && /if \(await isIn\(\)\) \{ markIn\('확인'\); return true; \}\n\s+lostMark\(\);/.test(gov), "확인(verify)에서 '진짜 풀림' · 다시 로그인(relogin0) 직전에 적음"); }

  // ── (11/12 hands1) 🖐 손발 길 — 번외가 맡긴 샵매니저 읽기를 이 탭(평소 크롬 · 자리를 쥔 운영 수집기)이 대신 함
  { const S = {}; let J = []; let hon = true, front = null; const helper = (pth, b) => (pth === '/al/feed' ? { ok: true, al: { ...AL, on: false, own: false }, hands: { on: hon, jobs: J.splice(0, 1), front } } : pth === '/al/hands' ? { ok: true, n: 1 } : pth === '/busy' ? { ok: true } : null);
    const { p, HL } = await mk({}, helper, {}, 'HOME'); const AQ = [];
    const CORES = ['readnow-aladin-core.js', 'readnow-products-core.js', 'readnow-shipping-core.js', 'readnow-orders-core.js'].map((f) => fs.readFileSync(path.join(__dirname, '../..', f), 'utf8'));
    for (const c of CORES) await p.addScriptTag({ content: c });
    await p.evaluate(() => { window.__IN = true; window.__FOCUS = 0; window.focus = () => { window.__FOCUS++; }; window.__rnLoginGov = { state: () => (window.__IN ? { in: true, at: Date.now() } : { in: false, why: '자리 기다림', seat: 'seat' }) }; });
    const OUT = '<a href="/scm/wC2Cuser_logout.aspx">로그아웃</a>'; const pg = (t, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title></head><body>${OUT}<h1>${t}</h1>${b}</body></html>`;
    await p.route('https://www.aladin.co.kr/**', (rt) => { const rq = rt.request(); const u = new URL(rq.url()); AQ.push({ m: rq.method(), p: u.pathname + u.search });
      if (u.pathname === '/scm/wmain.aspx') return rt.fulfill({ contentType: 'text/html; charset=utf-8', body: pg('샵매니저', '첫 화면') });
      if (u.pathname === '/scm/worder_preparatory_complete.aspx') return rt.fulfill({ contentType: 'text/html; charset=utf-8', body: pg('주문확인요청', '<table><tr id="oList1"><td>v</td><td>발송준비중</td><td>1</td><td><a onclick="viewOrderDetail(\'111-A000000001\')">111-A000000001</a></td><td><a href="/shop/wproduct.aspx?ItemId=5001">[중고-상] 시험 책</a></td><td>1</td><td><a onclick="viewAddrLayer(1,0)">손님A</a></td></tr></table><div id="addrLayer1"><table><tr><td>성명</td><td>손님A</td></tr><tr><td>전화1</td><td>010-1234-5678</td></tr></table></div><div>주문확인요청 (1건) 발송 요청 (0건)</div>') });
      return rt.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>로그인</title><input type="password">' }); });
    const hd = () => HL.filter((x) => x.p === '/al/hands').map((x) => x.b.done[0]);
    J.push({ id: 'h1', k: 'chk' }); await tick(p); await p.waitForTimeout(600); await tick(p);
    const f = HL.filter((x) => x.p === '/al/feed').pop(); const t1 = await p.title();
    ok(f && f.b.hands && f.b.hands.v === 1 && f.b.hands.login === true && t1.startsWith('🖐 리드나우 손발 ·') && t1.split('🖐').length === 2, `🖐 다리 알림에 손발 소식(로그인 ✓) · 창 제목에 '🖐 리드나우 손발'(번외가 이 창을 찾음): ${t1} ${JSON.stringify(f && f.b.hands)}`);
    const d1 = hd()[0]; ok(d1 && d1.id === 'h1' && d1.res.ok && d1.res.sum.loggedIn === true && AQ.some((x) => x.m === 'GET' && x.p === '/scm/wmain.aspx'), `맡김 chk → 이 탭이 샵매니저 첫 화면을 GET으로 읽고 /al/hands로 돌려줌: ${JSON.stringify(d1)}`);
    J.push({ id: 'h2', k: 'confirm' }); await tick(p); await p.waitForTimeout(800); const d2 = hd().find((x) => x.id === 'h2');
    ok(d2 && d2.res.ok && d2.res.sum.orders && d2.res.sum.orders[0] && d2.res.sum.orders[0].o === '111-A000000001' && !/손님A|010-1234-5678/.test(JSON.stringify(HL.filter((x) => x.p === '/al/hands'))), `주문확인요청 — 화면 안에서 해석해 주문번호·상품 번호만(손님 이름·전화는 안 나감): ${JSON.stringify(d2 && d2.res)}`);
    J.push({ id: 'h3', k: 'list', st: '판매중', page: 2 }); await tick(p); await p.waitForTimeout(800); const d3 = hd().find((x) => x.id === 'h3');
    ok(d3 && !d3.res.ok && d3.res.login === true && AQ.some((x) => /^\/scm\/wrecord_edit\.aspx\?chkItemStockStatus=1&.*page=2&/.test(x.p)), `로그인 화면이면 '로그인 풀림'으로 돌려줌(주소는 이 탭 표대로): ${JSON.stringify(d3 && d3.res)}`);
    await tick(p); const f3 = HL.filter((x) => x.p === '/al/feed').pop(); ok(f3 && f3.b.hands.login === false, '다음 알림에 로그인 풀림을 알림', f3 && f3.b.hands);
    J.push({ id: 'h4', k: '/scm/ajaxCmd.aspx?cmd=chg.pricesales', url: 'https://www.aladin.co.kr/scm/ajaxCmd.aspx?cmd=x' }); await tick(p); await p.waitForTimeout(500); const d4 = hd().find((x) => x.id === 'h4');
    ok(d4 && !d4.res.ok && /모르는 일/.test(d4.res.why) && !AQ.some((x) => /ajaxCmd/.test(x.p)) && AQ.every((x) => x.m === 'GET'), `모르는 종류·주소가 와도 부르지 않음 · 알라딘엔 GET만: ${JSON.stringify(AQ)}`);
    await p.evaluate(() => { window.__IN = false; }); J.push({ id: 'h5', k: 'chk' }); const n0 = AQ.length; await tick(p); await p.waitForTimeout(500); const d5 = hd().find((x) => x.id === 'h5');
    ok(d5 && !d5.res.ok && /자리를 쥐고 있지 않음/.test(d5.res.why) && AQ.length === n0, `이 탭이 알라딘 자리를 쥐지 않으면 읽지 않음(동시 로그인 4대 규칙): ${JSON.stringify(d5 && d5.res)}`);
    await p.evaluate(() => { window.__IN = true; window.__HOLD = true; }); J.push({ id: 'h6', k: 'chk' }); const n1 = AQ.length; await tick(p); await p.waitForTimeout(400); await tick(p); const d6 = [...hd(), ...HL.filter((x) => x.p === '/al/feed').flatMap((x) => (x.b.hands && x.b.hands.done) || [])].find((x) => x && x.id === 'h6');
    ok(d6 && !d6.res.ok && /출고 중/.test(d6.res.why) && AQ.length === n1, `🚚 출고 중엔 맡김을 읽지 않고 그대로 돌려줌(약속 0-1): ${JSON.stringify(d6)}`); await p.evaluate(() => { window.__HOLD = false; });
    front = 'f1'; await tick(p); await tick(p); ok((await p.evaluate(() => window.__FOCUS)) === 0, "번외가 '사람 손 필요'(front)라고 해도 저절로 앞으로 띄우지 않음(정범님 11/13 tabfix — 알림만 · 누를 때만 앞으로)");
    hon = false; await tick(p, true); await p.waitForTimeout(1600); await tick(p, true); const t2 = await p.title(); ok(!t2.startsWith('🖐') && (await p.evaluate(() => window.__rnC2hands().on)) === false, `손발 길이 꺼지면 제목 표시를 지우고 맡김을 받지 않음: ${t2}`);
    await p.context().close(); }
  { const { p, HL } = await mk({}, (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL }, hands: { on: true, jobs: [{ id: 'x', k: 'chk' }] } } : null), {}, 'LOGGER'); await tick(p); await p.waitForTimeout(400);
    ok(!HL.some((x) => x.p === '/al/hands') && !(await p.title()).startsWith('🖐'), '로거 PC 탭은 손발 맡김을 하지 않음(약속 0)', HL.map((x) => x.p)); await p.context().close(); }
  // ── 팝업 없음 · ⑥ 머리 서명 그대로
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(BR), '다리에 브라우저 팝업 없음');
  { const split = [path.join(__dirname, '../split.js')].find((p) => fs.existsSync(p)); if (split && /readnow-collector\.src\.js$/.test(SRCF)) { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'c2alb-')); cp.execFileSync('node', [split, SRCF, out], { stdio: 'pipe' });
      const h = (fs.readFileSync(path.join(out, 'readnow-collector.user.js'), 'utf8').match(/const HSIG = '([0-9a-f]+)'/) || [])[1]; { const WANT = /const RAW = 'https:\/\/readnow\.kr\/'/.test(fs.readFileSync(path.join(__dirname, '../split.js'), 'utf8')) ? '8ab2f661d1d8afa8' : '8559039d5a96110b'; /* (11/10 head2) 머리 바꾼 판 가지에선 새 머리 */ ok(h === WANT, `머리 서명 그대로: ${h}`); } fs.rmSync(out, { recursive: true, force: true }); }
    else console.log('  · 머리 서명 비교는 저장소(src)에서만'); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2ALB ${bad}개 실패` : '✅ tC2ALB 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2ALB 오류', e); process.exit(1); });
