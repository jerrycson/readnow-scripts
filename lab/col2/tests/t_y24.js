/* t_y24 — (0.1.5 정범님 11/09 밤) 🟦 예스24 판매관리 읽기를 번외 수집기로 — 정범님이 화면을 열지 않음
 *  가짜 예스24 판매관리(이 시험 안에서만 꾸민 작은 서버 · 쿠키 세션 + 화면이 보내는 머리글 X-Tok이 지금 값이어야 /api/ 200)
 *  ① 처음: 숨은 예스24 크롬이 첫 화면에서 로그인 화면을 보고 '로그인 필요' → [🔐 예스24 로그인] → 창을 앞으로 → (정범님 대신 시험이 그 창에서 로그인) → 저절로 숨김 · 아이디·비번은 어디에도 안 남음
 *  ② 수집기(다리)가 안 보이면 읽지 않음 → 보이면: 주문 두 화면을 숨은 탭에서 한 번씩 열고 [조회]만(발송처리 단추는 안 누름) → 그다음부터는 화면 없이 API를 직접(배운 머리글로)
 *  ③ 받은 응답은 수집기와 같은 꼴로 다리에 넘김 · 보냄 확인(ack)한 것은 다시 안 줌 · 머리글이 바뀌면(401) 화면을 다시 열어 배우고 이어감 · 출고 중엔 멈춤 · 세션이 풀리면 '로그인 필요'
 *  ④ 맡긴 일(발송처리) — 운영 수집기 y24Act 그대로 · 같은 일 두 번 안 함 · 같은 송장을 다른 주문에 안 씀 · 첫 건은 창을 앞으로 꺼내 사람 확인
 *  ⑤ 로거 PC는 예스24 크롬을 띄우지 않음 · 옆 창(📊)이 켜질 때 저절로 뜸
 * 시험 자료의 손님은 '손님A' (공개 저장소 — 실제 개인 정보 없음) · 실행: node tests/t_y24.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const PW_SECRET = 'pw-' + Math.random().toString(36).slice(2, 10);

function fakeY24() { const S = { tok: 'T1', sess: new Set(), log: [], shipped: {}, ships: [], orders: [{ ono: 'Y2611100001', title: '시험 책 하나' }, { ono: 'Y2611100002', title: '시험 책 둘' }, { ono: 'Y2611100003', title: '시험 책 셋' }] };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title><script>window.TOK=${JSON.stringify(S.tok)};function api(p,o,cb){var x=new XMLHttpRequest();x.open('POST',p);x.setRequestHeader('X-Tok',window.TOK);x.setRequestHeader('Content-Type','application/json');x.onloadend=function(){cb&&cb(x)};x.send(JSON.stringify(o||{}))}</script></head><body><h1>${h}</h1>${b}</body></html>`;
  const listPage = (k) => page(k, `<button type="button" onclick="api('/api/Order/${k}',{SDATE:'2026-11-01',EDATE:'2026-11-03',PAGE_NO:1})">조회</button> <button type="button" onclick="api('/api/Order/Danger',{})">발송처리</button>`);
  const delivPage = () => page('발송관리', `<table><tr><th>선택</th><th>주문번호</th><th>상품</th><th>택배사</th><th>송장</th></tr>${S.orders.filter((o) => !S.shipped[o.ono]).map((o) => `<tr><td><input type="checkbox" class="ck"></td><td>${o.ono}</td><td>${o.title}</td><td><select name="DELV_ENTR"><option value="">택배사</option><option value="1">롯데택배</option><option value="2">우체국택배</option></select></td><td><input type="text" name="INVOICE_NO"></td></tr>`).join('')}</table>
<button type="button" onclick="var c=[...document.querySelectorAll('tr')].filter(function(r){var k=r.querySelector('.ck');return k&&k.checked});if(c.length!==1)return alert('하나만');if(!confirm('선택한 주문을 발송처리 하시겠습니까?'))return;var tr=c[0];api('/api/Order/ShipProc',{ono:tr.children[1].textContent,inv:tr.querySelector('input[type=text]').value,dc:tr.querySelector('select').value})">발송처리</button> <button type="button" onclick="api('/api/Order/OrderDeliveryList',{SDATE:'2026-11-01',EDATE:'2026-11-03',PAGE_NO:1})">조회</button>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      S.log.push({ m: q.method, p: u.pathname, tok: q.headers['x-tok'] || null, auth, body: b.slice(0, 300) });
      const H = (code, type, body, x) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/Account/Login' && q.method === 'POST') { const f = new URLSearchParams(b); if (f.get('pw') !== PW_SECRET) return H(200, 'text/html', page('로그인', '<form method="post"><input name="id"><input type="password" name="pw"><button>로그인</button></form>틀림')); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, 'text/html', '', { 'Set-Cookie': `sid=${id}; Path=/; HttpOnly`, Location: '/' }); }
      if (u.pathname === '/Account/Login') return H(200, 'text/html', page('로그인', '<form method="post" action="/Account/Login"><input name="id"><input type="password" name="pw"><button>로그인</button></form>'));
      if (u.pathname.startsWith('/api/')) { if (!auth || q.headers['x-tok'] !== S.tok) return H(401, 'application/json', JSON.stringify({ ERROR_MSG: '인증 정보가 없습니다', REDIRECT_URL: '/Account/Login' }));
        if (u.pathname === '/api/Menu/GetMenus') return H(200, 'application/json', JSON.stringify({ MENU_LIST: [{ MENU_ID: 1, P_MENU_ID: '', MENU_NM: '주문', MENU_PATH: '/Order' }, { MENU_ID: 2, P_MENU_ID: 1, MENU_NM: '신규 주문', MENU_PATH: '/Order/NewOrderConfirmList' }, { MENU_ID: 3, P_MENU_ID: 1, MENU_NM: '정산 내역', MENU_PATH: '/Settle/SettleList' }, { MENU_ID: 4, P_MENU_ID: 1, MENU_NM: '판매자 정보 수정', MENU_PATH: '/Seller/SellerInfo' }] }));
        if (u.pathname === '/api/Order/ShipProc') { const o = JSON.parse(b || '{}'); S.ships.push(o); S.shipped[o.ono] = o.inv; return H(200, 'application/json', '{"RESULT_CODE":"S000"}'); }
        if (u.pathname === '/api/Order/Danger') return H(200, 'application/json', '{"RESULT_CODE":"S000"}');
        if (/^\/api\/Order\/(NewOrderConfirmList|OrderDeliveryList)$/.test(u.pathname)) return H(200, 'application/json', JSON.stringify({ RESULT_LIST: S.orders.filter((o) => !S.shipped[o.ono]).map((o) => ({ ORD_NO: o.ono, GOODS_NM: o.title, RCVR_NM: '손님A', RCVR_HP: '010-0000-0000' })), TOTAL_COUNT: S.orders.length }));
        return H(200, 'application/json', JSON.stringify({ RESULT_LIST: [{ X: 1 }], TOTAL_COUNT: 1 })); }
      if (!auth) return H(302, 'text/html', '', { Location: '/Account/Login' });
      if (u.pathname === '/') return H(200, 'text/html', page('판매관리', `첫 화면<script>api('/api/Menu/GetMenus',{})</script>`));
      if (u.pathname === '/Order/NewOrderConfirmList') return H(200, 'text/html', listPage('NewOrderConfirmList'));
      if (u.pathname === '/Order/OrderDeliveryList') return H(200, 'text/html', delivPage());
      if (u.pathname === '/Settle/SettleList') return H(200, 'text/html', page('정산', `<button type="button" onclick="api('/api/Settle/SettleList',{})">조회</button> <button type="button" onclick="api('/api/Settle/Withdraw',{})">출금 신청</button>`));
      return H(200, 'text/html', page('기타', '없음')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }

/* 정범님 대신 시험이 그 창(번외 예스24 크롬)에 붙어 로그인·첫 건 확인을 누름 */
async function attach(home) { const pf = path.join(home, 'col2-y24-chrome', 'DevToolsActivePort'); const port = fs.readFileSync(pf, 'utf8').split('\n')[0].trim(); const br = await L.chromium().connectOverCDP('http://127.0.0.1:' + port); const pg = br.contexts()[0].pages()[0]; return { br, pg }; }

(async () => {
  const Y = await fakeY24(); const repo = process.env.COL2_PROD_REPO || path.join(__dirname, '..', '..', '..');
  const env = { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: repo };
  let H = await L.startHelper({ cfg: { on: true, y24: true, auto: false, headless: true, watch: { tickSec: 60, handoffMs: 200 } }, env }); const D = H.D, HOME = D + '/home';
  const st = async () => (await H.api('GET', '/status')).j; const y = async () => (await st()).y24;
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 1 }, hold: { on: false }, ...(b || {}) });
  try {
    console.log('① 로그인 한 번(정범님 손) — 아이디·비번은 저장하지 않음');
    let s = await until(async () => { const v = await y(); return v.login === 'need' ? v : null; }, 80);
    ok(s && s.login === 'need' && /로그인 필요/.test(s.msg), "숨은 예스24 크롬이 첫 화면에서 로그인 화면을 봄 → '로그인 필요'", s && s.msg);
    const html = (await H.req('GET', '/')).b; ok(/🟦 예스24 판매관리 읽기/.test(html) && /id="y24lg"|y24lg/.test(html) && /예스24 로그인 \(처음 한 번\)/.test(html), '옆 창에 예스24 칸과 [🔐 예스24 로그인] 단추');
    let r = await H.api('POST', '/y24/login', { why: '시험' }); ok(r.j.ok && /앞으로/.test(r.j.msg) && H.T.win().acts.includes('show:col2-y24-chrome'), '단추 → 예스24 창을 앞으로 꺼냄(로그인 화면)', r.j.msg);
    s = await y(); ok(s.login === 'wait', "로그인 기다리는 중 표시", s.login);
    const A = await attach(HOME); await A.pg.waitForSelector('input[type=password]'); await A.pg.fill('input[name=id]', 'seller'); await A.pg.fill('input[type=password]', PW_SECRET); await A.pg.click('button'); await A.br.close().catch(() => {});
    s = await until(async () => { const v = await y(); return v.login === 'ok' ? v : null; }, 60);
    ok(s && s.login === 'ok' && H.T.win().acts.filter((a) => a === 'hide:col2-y24-chrome').length >= 1, '로그인하면 저절로 다시 숨김 · 로그인 살아 있음', s && s.login);
    const leak = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let st0; try { st0 = fs.lstatSync(p); } catch (e) { continue; } if (st0.isSymbolicLink()) continue; if (st0.isDirectory()) { if (!/-chrome$/.test(p)) walk(p); } else if (fs.readFileSync(p, 'utf8').includes(PW_SECRET)) leak.push(f); } }; walk(HOME);
    const pref = JSON.parse(fs.readFileSync(path.join(HOME, 'col2-y24-chrome', 'Default', 'Preferences'), 'utf8'));
    ok(!leak.length && pref.credentials_enable_service === false, '비밀번호가 도우미 파일 어디에도 없음 · 그 크롬의 비밀번호 저장도 끔', leak);

    console.log('② 수집기가 안 보이면 읽지 않음 → 보이면 주문 두 화면을 한 번씩 [조회]로 배우고 그 뒤로는 화면 없이');
    await wait(1200); s = await y(); const api0 = Y.S.log.filter((x) => /^\/api\/Order\/(New|OrderD)/.test(x.p)).length;
    ok(/수집기\(알라딘 탭\)가 안 보여 쉼/.test(s.msg) && api0 === 0, '다리(수집기) 소식이 없으면 쉼 — 받은 것을 올릴 곳이 없으니까', s.msg);
    r = await feed(); ok(r.j.ok && r.j.y24 && r.j.y24.login === 'ok', '수집기 다리 /y24/feed → 상태');
    await until(async () => (await y()).ord.at > 0, 120);
    let L1 = Y.S.log.slice(); const pages = L1.filter((x) => x.m === 'GET' && /^\/Order\//.test(x.p)).map((x) => x.p);
    ok(pages.includes('/Order/NewOrderConfirmList') && pages.includes('/Order/OrderDeliveryList'), '처음엔 두 주문 화면을 숨은 탭에서 열고 [조회]', pages);
    ok(!L1.some((x) => /Danger|ShipProc/.test(x.p)), '화면의 [발송처리] 같은 쓰기 단추는 누르지 않음');
    s = await y(); ok(s.tpl.includes('NewOrderConfirmList') && s.tpl.includes('OrderDeliveryList'), '조건 모양을 배움', s.tpl);
    const tplF = fs.readFileSync(path.join(HOME, 'y24-tpl.json'), 'utf8'); ok(!/X-Tok|T1/.test(tplF) && /NewOrderConfirmList/.test(tplF), '조건 모양 파일엔 주소·보낸 값만(머리글·출입 값은 메모리에만)');
    const n0 = Y.S.log.length; await H.api('POST', '/y24/run', { what: 'ord' }); await feed();
    await until(async () => Y.S.log.slice(n0).filter((x) => /^\/api\/Order\/(NewOrderConfirmList|OrderDeliveryList)$/.test(x.p)).length >= 2, 120);
    const L2 = Y.S.log.slice(n0); const direct = L2.filter((x) => /^\/api\/Order\/(NewOrderConfirmList|OrderDeliveryList)$/.test(x.p));
    ok(direct.length >= 2 && direct.every((x) => x.tok === 'T1' && x.auth) && !L2.some((x) => x.m === 'GET' && /^\/Order\//.test(x.p)), '두 번째부터는 화면을 열지 않고 API를 직접(배운 머리글 · 세션 쿠키)', JSON.stringify(L2.map((x) => x.m + ' ' + x.p)));
    ok(direct.every((x) => { const b = JSON.parse(x.body); return b.EDATE === new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }), '날짜 조건 끝은 오늘로(기간 길이는 그대로 — 수집기와 같음)', direct[0] && direct[0].body);

    console.log('③ 받은 것은 수집기와 같은 꼴로 · 보냄 확인한 것은 다시 안 줌 · 머리글 바뀜 · 출고 중 · 세션 풀림');
    r = await feed(); const recs = r.j.recs || []; const o1 = recs.find((x) => x.sig === 'POST /api/Order/NewOrderConfirmList');
    ok(o1 && o1.json && /손님A/.test(o1.body) && o1.status === 200 && o1.req && /SDATE/.test(o1.req) && o1.page && /^c2y/.test(o1.id) && recs.some((x) => x.sig === 'POST /api/Menu/GetMenus'), '응답 줄 = 수집기 rn-y24q와 같은 칸 {sig,url,page,at,status,ctype,req,json,body}', JSON.stringify(recs.map((x) => x.sig + ' ' + x.status + ' ' + x.page)));
    ok(!recs.some((x) => /Account\/Login/.test(x.url)), '로그인 길 원문은 줄에 없음');
    r = await feed({ ack: recs.map((x) => x.id) }); const again = (r.j.recs || []).filter((x) => recs.some((z) => z.id === x.id)); ok(again.length === 0, '보냄 확인(ack)한 줄은 다시 안 줌(같은 줄을 두 번 올리지 않음)', again.length);
    Y.S.tok = 'T2'; const n1 = Y.S.log.length; await H.api('POST', '/y24/run', { what: 'ord' }); await feed();
    s = await until(async () => { const L3 = Y.S.log.slice(n1); return L3.some((x) => x.tok === 'T2' && /^\/api\/Order\/OrderDeliveryList$/.test(x.p) && x.auth) ? await y() : null; }, 160);
    const L3 = Y.S.log.slice(n1); ok(s && L3.some((x) => x.tok === 'T1' && /^\/api\/Order/.test(x.p)) && L3.some((x) => x.m === 'GET' && /^\/Order\//.test(x.p)) && s.login === 'ok' && !s.ord.err, '머리글이 바뀌어 401 → 그 화면을 숨은 탭에서 다시 열어 새 머리글로 → 이어감(로그인 풀림 아님)', JSON.stringify(L3.map((x) => x.p + ':' + x.tok).slice(0, 12)));
    await feed({ hold: { on: true, why: '시험 출고' } }); await wait(600); const n2 = Y.S.log.length; await H.api('POST', '/y24/run', { what: 'ord' }); await wait(1500); s = await y();
    ok(/출고 중/.test(s.msg) && Y.S.log.length === n2 && !s.jobsOk, '🚚 출고 중(수집기가 알려 준 출고 보호)엔 예스24 읽기·맡긴 일 멈춤', s.msg);
    await feed({ hold: { on: false } });
    Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); await feed();
    s = await until(async () => { const v = await y(); return v.login === 'need' ? v : null; }, 120); ok(s && s.login === 'need' && !s.jobsOk, "세션이 풀리면 '로그인 필요'(옆 창 알림) · 맡긴 일 안 받음", s && s.loginMsg);

    console.log('④ 맡긴 일(발송처리) — 운영 수집기 y24Act 그대로');
    await H.api('POST', '/y24/login', {}); { const A2 = await attach(HOME); await A2.pg.waitForSelector('input[type=password]'); await A2.pg.fill('input[type=password]', PW_SECRET); await A2.pg.click('button'); await A2.br.close().catch(() => {}); }
    await until(async () => (await y()).login === 'ok', 60); await feed();
    const J1 = { id: 'Y2611100001:ship:1', ono: 'Y2611100001', kind: 'ship', courier: '롯데택배', no: '123456789012', confirm: false };
    r = await feed({ jobs: [J1] }); ok(r.j.took && r.j.took.includes(J1.id), '수집기가 넘긴 맡긴 일을 받음(took)', r.j.took);
    let jr = await until(async () => { const x = (await feed()).j; return x.jres && x.jres[J1.id] ? x.jres[J1.id] : null; }, 160);
    ok(jr && jr.state === 'done' && Y.S.ships.length === 1 && Y.S.ships[0].inv === '123456789012' && Y.S.ships[0].dc === '1' && jr.by === 'col2' && (jr.steps || []).length >= 3, '발송처리: 그 주문 줄 하나만 체크·롯데택배·송장 → [발송처리] → 다시 읽어 확인 ✓', jr && { st: jr.state, msg: jr.msg, ships: Y.S.ships });
    await feed({ jobs: [J1], jack: [J1.id] }); await wait(1500); ok(Y.S.ships.length === 1, '같은 일을 다시 넘겨도 두 번 안 함(y24-jdone)', Y.S.ships.length);
    const J2 = { id: 'Y2611100002:ship:1', ono: 'Y2611100002', kind: 'ship', courier: '롯데택배', no: '123456789012', confirm: false };
    await feed({ jobs: [J2] }); jr = await until(async () => { const x = (await feed()).j; return x.jres && x.jres[J2.id] ? x.jres[J2.id] : null; }, 100);
    ok(jr && jr.state === 'fail' && /같은 송장/.test(jr.msg) && Y.S.ships.length === 1, '같은 송장번호를 다른 주문에 쓰려 하면 아무것도 안 누르고 멈춤(약속 10)', jr && jr.msg);
    const J3 = { id: 'Y2611100003:ship:1', ono: 'Y2611100003', kind: 'ship', courier: '우체국', no: '987654321098', confirm: true }; const w0 = H.T.win().acts.filter((a) => a === 'show:col2-y24-chrome').length;
    await feed({ jobs: [J3], jack: [J2.id] }); const A3 = await attach(HOME); let asked = false; for (let k = 0; k < 120 && !asked; k++) { asked = await A3.pg.evaluate(() => !!document.getElementById('rn-col2y-ask')).catch(() => false); if (!asked) await wait(250); }
    await until(async () => H.T.win().acts.filter((a) => a === 'show:col2-y24-chrome').length > w0, 20);
    ok(asked && Y.S.ships.length === 1 && H.T.win().acts.filter((a) => a === 'show:col2-y24-chrome').length > w0, '첫 건 확인: 창을 앞으로 꺼내 [▶ 이대로 실행]을 기다림(누르기 전엔 아무것도 안 함)', JSON.stringify({ asked, ships: Y.S.ships.length, acts: H.T.win().acts.slice(-6), w0 }));
    await A3.pg.evaluate(() => [...document.querySelectorAll('#rn-col2y-ask button')].find((b) => /이대로 실행/.test(b.textContent)).click()).catch(() => {}); await A3.br.close().catch(() => {});
    jr = await until(async () => { const x = (await feed()).j; return x.jres && x.jres[J3.id] ? x.jres[J3.id] : null; }, 160);
    ok(jr && jr.state === 'done' && Y.S.ships.length === 2 && Y.S.ships[1].dc === '2' && jr.confirm, '사람이 누르면 그대로 실행 → 확인 ✓', jr && jr.msg);
    ok(!Y.S.log.some((x) => /Danger/.test(x.p)), '그 밖의 쓰기 단추는 끝까지 안 누름');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }

  console.log('⑤ 로거 PC · 옆 창');
  H = await L.startHelper({ cfg: { on: true, y24: true, pc: 'LOGGER', auto: false, headless: true, side: true }, env }); const D2 = H.D;
  try { await wait(2500); const s = (await H.api('GET', '/status')).j;
    ok(s.y24.logger && !s.y24.on && !fs.existsSync(path.join(D2, 'home', 'col2-y24-chrome', 'DevToolsActivePort')) && !H.T.clog().some((l) => /col2-y24-chrome/.test(l)), '로거 PC는 예스24 크롬을 띄우지 않음(약속 0 — 계정·쿠키 금지)', s.y24.msg);
    const r = await H.api('POST', '/y24/login', {}); ok(!r.j.ok && /로거/.test(r.j.err), '로거 PC에선 로그인 단추도 거절', r.j.err);
    ok(H.T.clog().some((l) => new RegExp(`--app=http://127\\.0\\.0\\.1:${H.port}/(\\s|$)`).test(l) && /col2-stat-chrome/.test(l) && /--window-size=380,560/.test(l)), '켜질 때 📊 옆 창(작은 앱 창 380×560)이 저절로 뜸', H.T.clog().filter((l) => /--app/.test(l))[0]);
    await H.api('POST', '/cfg', { side: false }); ok((await H.api('GET', '/status')).j.side === false, '옆 창 저절로 띄우기 끄기');
  } finally { try { await H.stop(); } catch (e) {} killDir(D2); }
  Y.srv.close(); L.done('t_y24');
})();
