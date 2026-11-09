// tC2W — 정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 쓰기 비교 뒤 하나씩 넘김' · lab/col2/LOGIN_PLAN.md ④-4
//  수집기(머리 그대로) 🟧✍ 그림자 쓰기 알림(rnC2w) + 알라딘 다리(rnC2al)가 넘김:
//   ① 쓰기를 보낸 직후 __rnC2w(종류, 입력, 요청, 성공) → 이 PC 저장소 rn-c2wq에 요청 꼴(번호·값만)만 적음 → 다리가 POST /al/wfeed로 넘기고 받았다는 것(ack)만 지움
//   ② 번외가 '받음'(alw.on)이라고 한 때만 적음 · 번외가 없거나 끄면 적지 않음
//   ③ 🚚 출고 중(이 PC 출고·MJ-MAIN 보호)엔 적지도 넘기지도 않음(약속 0-1) · 로거 크롬은 안 함(약속 0)
//   ④ 손님 정보 0 — 글 칸은 해시·길이 · 그 밖 칸은 이름만 · 전화 꼴 가림 · 가림 규칙이 번외(lab/col2/shadow/col2-alw-core.js scrub)와 글자 하나까지 같은 결과
//   ⑤ 쓰기 자리 다섯(상품 값 바꾸기·판매상태·삭제·발송준비시작·판매 불가 통보)이 보낸 뒤에 알림 · 보낸 요청과 같은 꼴 · ⑥ 머리 서명 그대로
//  시험 자료의 손님은 '손님A'·010-1234-5678 꼴만(공개 저장소) · 사용: node tC2W.js (src/tests)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = path.join(__dirname, '../readnow-collector.src.js'); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2W — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const CW = cut('(function rnC2w()', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
const CORE = require(path.join(__dirname, '../../lab/col2/shadow/col2-alw-core.js'));
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };
const PII = ['손님A', '010-1234-5678', '시험시 시험구 1길'];
const FB = () => { window.__D = {}; const ref = (c, id) => ({ get: async () => ({ exists: false, data: () => undefined }), set: async () => {} }); const fsx = { collection: (c) => ({ doc: (id) => ref(c, id) }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: () => {} }) }; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore: () => fsx }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (seed, helper, pc, pub) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      if (u.host === 'www.aladin.co.kr' && u.pathname !== '/scm/worders.aspx') { HL.push({ aladin: u.pathname + u.search }); }
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
      window.__rnLog = () => {}; window.__rnPcName = { get: () => a.pc }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false }); if (a.pub) window.__rnPubChrome = true;
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      (new Function(a.fb))(); }, { seed, fb: `(${FB.toString()})()`, pc: pc || 'OFFICE1', pub: !!pub });
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: CW }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };
  const tick = async (p) => { await p.evaluate(() => window.__rnC2alTick && window.__rnC2alTick(true)); await p.waitForTimeout(450); };
  const note = (p, k, i, r) => p.evaluate(([k, i, r]) => window.__rnC2w(k, i, r, true, 200), [k, i, r]);
  const q = (p) => p.evaluate(() => window.__GM['rn-c2wq'] || []);
  const S = { alw: true }; const helperOf = (S) => (pth, b) => (pth === '/al/feed' ? { ok: true, al: { on: false, logger: false }, alw: { on: S.alw } } : pth === '/al/wfeed' ? { ok: true, on: true, ack: (b.w || []).map((x) => x.id) } : pth === '/busy' ? { ok: true } : null);
  const EDIT = ['edit', { lid: '5001', ch: { price: 12000 }, cur: { state: 1 } }, [{ m: 'GET', u: '/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=5001&priceSales=12000' }]];

  // ② 번외 소식 없으면 적지 않음
  { const { p, HL } = await mk({}, helperOf(S)); ok((await note(p, ...EDIT)) === false && !(await q(p)).length, '다리가 아직 번외 소식을 못 받으면 적지 않음');
    await tick(p); const ok1 = await p.evaluate(() => window.__GM['rn-c2w-ok']); ok(ok1 && ok1.on === true && ok1.hold === false, '/al/feed 답 alw.on → rn-c2w-ok 켬', ok1);
    // ① 적고 넘기고 ack만 지움
    ok((await note(p, ...EDIT)) === true && (await q(p)).length === 1, '쓰기를 보낸 직후 한 줄 적음');
    await note(p, 'start', { ono: '111-A1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=111-A1' }]);
    await tick(p); const wf = HL.filter((x) => x.p === '/al/wfeed'); ok(wf.length === 1 && wf[0].b.w.length === 2 && wf[0].b.by === 'OFFICE1' && (await q(p)).length === 0, `POST /al/wfeed로 넘김 · 받았다는 것만 지움: ${wf.length}`, wf.map((x) => x.b));
    const e0 = wf[0].b.w[0]; ok(e0.k === 'edit' && e0.rq[0].p === '/scm/ajaxCmd.aspx' && e0.rq[0].q.priceSales === '12000' && e0.in.lid === '5001', '요청 꼴(주소·값)과 입력', e0);
    ok(CORE.compare(e0.rq, CORE.build('edit', CORE.pickIn('edit', e0.in))).verdict === 'same', '번외가 같은 입력으로 만든 요청과 같음');
    ok(!HL.some((x) => x.aladin), '알림이 알라딘에 아무 요청도 더하지 않음');
    // ④ 손님 정보 0 · 가림 규칙이 번외와 같음
    const FIX = [{ m: 'POST', u: '/scm/x.aspx?ono=1&rcvName=손님A&_=1', b: 'txtAnswer=손님A님 010-1234-5678&rcvTel=010-1234-5678&addr=시험시 시험구 1길&ordersItem=2&ordersItem=1' }, { m: 'GET', u: 'https://www.aladin.co.kr/scm/ReportNotSalesLayer.aspx?ono=111-A2&hid=x&cancelReason=2&ordersItem=9' }, { m: 'POST', u: '/scm/ajaxCmd.aspx', b: 'cmd=chg.supplieritemcode&ItemId=1&supCode=' + escape('BLK가-1') }, { m: 'POST', u: '/scm/upload.aspx', b: { keys: ['file1', 'mode'] } }];
    const inPage = await p.evaluate((F) => F.map((r) => window.__rnC2wScrub(r)), FIX); const inNode = FIX.map(CORE.scrub);
    ok(JSON.stringify(inPage) === JSON.stringify(inNode), '가림 규칙 — 수집기와 번외 결과가 글자 하나까지 같음', { inPage, inNode });
    ok(!PII.some((w) => JSON.stringify(inPage).includes(w)), '손님 이름·전화·주소가 남지 않음', inPage);
    const inIn = await p.evaluate(() => window.__rnC2wScrubIn({ note: '010-1234-5678', ono: '1' })); ok(!JSON.stringify(inIn).includes('010-1234-5678') && JSON.stringify(inIn) === JSON.stringify(CORE.scrubIn({ note: '010-1234-5678', ono: '1' })), '입력의 전화 꼴도 같은 규칙으로 가림');
    // ③ 출고 중 — 적지도 넘기지도 않음
    await note(p, ...EDIT); ok((await q(p)).length === 1, '(출고 전 한 줄)');
    await p.evaluate(() => { window.__HOLD = 1; }); const n0 = HL.filter((x) => x.p === '/al/wfeed').length; await tick(p);
    ok(HL.filter((x) => x.p === '/al/wfeed').length === n0, '🚚 출고 중엔 /al/wfeed를 보내지 않음(약속 0-1)');
    ok((await note(p, ...EDIT)) === false && (await q(p)).length === 1, '🚚 출고 중엔 새로 적지도 않음');
    const okH = await p.evaluate(() => window.__GM['rn-c2w-ok']); ok(okH.on === false && okH.hold === true, '다리가 출고 중(hold)을 적어 둠 — 틀(iframe) 안 쓰기도 이것을 봄', okH);
    await p.evaluate(() => { window.__HOLD = 0; }); await tick(p); ok((await q(p)).length === 0, '출고가 끝나면 출고 전 줄만 넘김');
    // 번외가 끔
    S.alw = false; await tick(p); ok((await note(p, ...EDIT)) === false, '번외가 쓰기 그림자를 끄면 적지 않음');
    // 번외가 사라짐(오래됨)
    S.alw = true; await tick(p); await p.evaluate(() => { window.__GM['rn-c2w-ok'].at = Date.now() - 120e3; }); ok((await note(p, ...EDIT)) === false, '번외 소식이 90초 넘게 끊기면 적지 않음');
    await p.close(); }
  // ③ 로거 크롬
  { const { p, HL } = await mk({ 'rn-c2w-ok': { on: true, hold: false, at: Date.now() } }, helperOf({ alw: true }), 'LOGGER', true);
    ok((await note(p, ...EDIT)) === false && !(await q(p)).length, '로거 크롬은 적지 않음(약속 0)'); await tick(p); ok(!HL.some((x) => x.p === '/al/wfeed' || x.p === '/al/feed'), '로거 크롬은 다리도 안 돎'); await p.close(); }

  // ⑤ 쓰기 자리 다섯 — 보낸 뒤 알림 · 보낸 것과 같은 꼴
  { const has = (re, m) => ok(re.test(src), m);
    has(/body: fd, credentials: 'include' \}\); const txt = await rr\.text\(\);[^\n]*\n\s+try \{ window\.__rnC2w && window\.__rnC2w\('state', \{ lid: String\(listingId\), before, to \}, \[\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: fd\.toString\(\) \}\]/, '판매상태 바꾸기(현금 판매) — 보낸 fd 그대로 알림');
    has(/fetch\(`https:\/\/www\.aladin\.co\.kr\/scm\/worder_process\.aspx\?cmd=StartDelivery&ono=\$\{encodeURIComponent\(ono\)\}`, \{ credentials: 'include' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('start', \{ ono \}/, '발송준비시작 — 보낸 뒤 알림');
    has(/window\.__rnC2w\('del', \{ lids: L\.map\(\(x\) => String\(x\.listingId\)\), before: code \}, \[\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: fd\.toString\(\) \}\]/, '상품 삭제 — 보낸 fd 그대로');
    has(/const r1 = await fetch\(act\.href, \{ credentials: 'include', cache: 'no-store' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('cancel', \{ ono, items: want, reason, keys: [^\n]*\[\{ m: 'GET', u: act\.pathname \+ act\.search \}\]/, '판매 불가 통보 — 보낸 주소 그대로');
    const pe = cut('async function prdEditPc(', '/* 🟧✍ 그림자 쓰기 알림(보낸 것만 · 번호·값만) */');
    for (const [k, re] of [['price', /c2wR\.push\(\{ m: 'GET', u: `\/scm\/ajaxCmd\.aspx\?cmd=chg\.pricesales&ItemId=\$\{encodeURIComponent\(lid\)\}&priceSales=\$\{Math\.round\(ch\.price\)\}` \}\); r = await J\(await fetch\(`\/scm\/ajaxCmd\.aspx\?cmd=chg\.pricesales&ItemId=\$\{encodeURIComponent\(lid\)\}&priceSales=\$\{Math\.round\(ch\.price\)\}&_=/],
      ['qty', /c2wR\.push\(\{ m: 'GET', u: `\/scm\/ajaxCmd\.aspx\?cmd=chg\.stock&ItemId=\$\{encodeURIComponent\(lid\)\}&realStock=\$\{Math\.round\(ch\.qty\)\}` \}\); r = await J\(await fetch\(`\/scm\/ajaxCmd\.aspx\?cmd=chg\.stock&ItemId=\$\{encodeURIComponent\(lid\)\}&realStock=\$\{Math\.round\(ch\.qty\)\}&_=/],
      ['code', /c2wR\.push\(\{ m: 'POST', u: '\/scm\/ajaxCmd\.aspx', b: `cmd=chg\.supplieritemcode&ItemId=\$\{encodeURIComponent\(lid\)\}&supCode=\$\{escape\(ch\.code\)\}` \}\); r = await J\(await fetch\('\/scm\/ajaxCmd\.aspx', \{ method: 'POST', credentials: 'include', headers: HP, body: `cmd=chg\.supplieritemcode&ItemId=\$\{encodeURIComponent\(lid\)\}&supCode=\$\{escape\(ch\.code\)\}` \}\)\)/],
      ['state', /c2wR\.push\(\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: `fn=stockstatusbulkchg&stockStatusBefore=\$\{cur\.state\}&stockStatusToDo=\$\{to\}&items=\$\{lid\}` \}\); const rr = await fetch\('\/scm\/wrecord_edit_usedbatch\.aspx', \{ method: 'POST', credentials: 'include', headers: HP, body: `fn=stockstatusbulkchg&stockStatusBefore=\$\{cur\.state\}&stockStatusToDo=\$\{to\}&items=\$\{lid\}` \}\)/]]) ok(re.test(pe), `상품 값 바꾸기(${k}) — 적는 요청 = 보내는 요청(캐시 칸 _ 만 뺌)`);
    ok(/window\.__rnC2w\('edit', \{ lid, ch: c2wCh, cur: \{ state: c2wSt \} \}, c2wR, c2wOk\)/.test(pe), '상품 값 바꾸기 — 보낸 칸만(c2wCh)·차례대로 한 번에 알림');
    /* 실제로 같은지: 수집기 꼴 그대로 만든 요청을 가려 번외 build와 견줌 */
    const lid = '5001', ch = { price: 12000.4, qty: 2, code: 'BLK가-1', state: '판매중지' }, cur = { state: 1 }; const to = 15;
    const R = [{ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=${encodeURIComponent(lid)}&priceSales=${Math.round(ch.price)}` }, { m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.stock&ItemId=${encodeURIComponent(lid)}&realStock=${Math.round(ch.qty)}` }, { m: 'POST', u: '/scm/ajaxCmd.aspx', b: `cmd=chg.supplieritemcode&ItemId=${encodeURIComponent(lid)}&supCode=${escape(ch.code)}` }, { m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: `fn=stockstatusbulkchg&stockStatusBefore=${cur.state}&stockStatusToDo=${to}&items=${lid}` }];
    const cmp = CORE.compare(R.map(CORE.scrub), CORE.build('edit', { lid, ch, cur })); ok(cmp.verdict === 'same', '네 칸 모두 바꾸는 일 — 수집기 꼴과 번외 build가 같음', cmp.diffs);
    const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: '15', stockStatusToDo: '17', items: ['1', '2'].join(',') });
    ok(CORE.compare([CORE.scrub({ m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: fd.toString() })], CORE.build('del', { lids: ['1', '2'], before: 15 })).verdict === 'same', '삭제 — 수집기 fd와 번외 build가 같음'); }

  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(CW), '알림 덩어리에 브라우저 팝업 없음');
  // 웹앱 관리도구 🟧 줄 — 쓰기 그림자 같음 비율
  { const H = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8'); const g = (m, e) => { const i = H.indexOf(m); return H.slice(i, H.indexOf(e, i) + e.length); };
    const code = g('const c2alSum = ', '} : null;') + '\n' + g('function c2alHtml(a)', '</div>`; }');
    const f = new Function('esc', 'num', code + '\nreturn { c2alSum, c2alHtml };')((x) => String(x).replace(/[&<>"]/g, ''), (n) => String(n));
    const A = { on: true, login: 'ok', active: true, seat: true, day: { n: 3, same: 1, diff: 0, wait: 0 }, w: { on: true, n: 7, same: 6, diff: 1, bad: 0, refuse: 1, pct: 85.7, hand: ['상품 값 바꾸기(판매가·수량·관리코드·판매상태)'], junk: '손님A' } };
    const sm = f.c2alSum(A); const h = f.c2alHtml(sm);
    ok(/✍ 쓰기 그림자\(보내지 않음 · 견줌만\): 오늘 7건 · 같음 <b>85\.7%<\/b> \(6\/7\)/.test(h) && /다름 <b[^>]*>1<\/b>/.test(h) && /번외라면 안 보냄 1/.test(h) && /넘길 수 있음\(허락 뒤\): 상품 값 바꾸기/.test(h), '🧭 PC 줄 🟧에 쓰기 그림자 같음 비율 · 다름 · 넘길 수 있음', h);
    ok(!JSON.stringify(sm).includes('손님A'), '웹앱이 남기는 요약(col2_ctl)엔 정해진 칸만'); ok(!/쓰기 그림자/.test(f.c2alHtml(f.c2alSum({ ...A, w: null }))), '번외가 쓰기 그림자를 안 알리면 줄 없음'); }
  { const split = path.join(__dirname, '../split.js'); const out = fs.mkdtempSync(path.join(os.tmpdir(), 'c2w-')); cp.execFileSync('node', [split, SRCF, out], { stdio: 'pipe' });
    const h = (fs.readFileSync(path.join(out, 'readnow-collector.user.js'), 'utf8').match(/const HSIG = '([0-9a-f]+)'/) || [])[1]; ok(h === '8559039d5a96110b', `머리 서명 그대로: ${h}`); fs.rmSync(out, { recursive: true, force: true }); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2W ${bad}개 실패` : '✅ tC2W 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2W 오류', e); process.exit(1); });
