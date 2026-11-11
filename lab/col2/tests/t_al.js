/* t_al — 🟧 알라딘 샵매니저 '읽기' 그림자 (정범님 11/09 밤 '로그인 일도 번외로' · 오늘은 읽기만)
 *  가짜 알라딘 샵매니저(이 시험 안에서만 꾸민 작은 서버 · 쿠키 세션) — 로그인 화면 · 상품 조회 목록 · 주문확인요청 · 발송 요청 · 묻고 답하기 · 값을 바꾸는 길(가격·발송준비시작·공지 삭제)
 *  ① 기본 꺼짐 · 켜도 수집기 다리(출고 보호·자리)가 안 보이면 알라딘에 한 번도 안 감 · 🪑 자리가 없으면 안 감
 *  ② 로그인 한 번(정범님 손) — 창을 앞으로 꺼냄 → 로그인하면 저절로 숨김 · 비밀번호는 도우미 파일 어디에도 없음 · 크롬 비밀번호 저장 끔
 *  ③ 화면 없이 직접 부름 — 첫 화면 한 번 뒤로는 탭 안 fetch만 · 읽기 다섯 길 밖(값을 바꾸는 길)은 한 번도 안 부름
 *  ④ 운영 칸과 견줌 — 웹앱이 넘긴 운영 문서에서 손님 정보를 버리고 칸마다 · 결과는 col2_al에만 · 손님 정보는 결과·상태·파일 어디에도 없음
 *  ⑤ 출고 중 멈춤 · 429 쉼 · 세션 풀림 → '로그인 필요'(저절로 다시 로그인하지 않음) · 핑퐁 의심 멈춤 · ⑥ 로거 거절
 * 시험 자료의 손님은 '손님A'·010-1234-5678 꼴만(공개 저장소) · 실행: node tests/t_al.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const AC = require('../shadow/col2-al-compare.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const PW_SECRET = 'pw-' + Math.random().toString(36).slice(2, 10);
const PII = ['손님A', '010-1234-5678', '시험시 시험구 1길'];

function fakeScm() { const S = { sess: new Set(), log: [], r429: false };
  const OUT = '<a href="/scm/wC2Cuser_logout.aspx">로그아웃</a>';
  const page = (t, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title></head><body>${OUT}<h1>${t}</h1>${b}</body></html>`;
  const row = (lid, u, st, price, sku, grade, qty) => `<tr><td><input type="checkbox" class="batchChkBox" value="${lid}"></td><td>${u}<br>9788900000001</td><td><a class="name2">[중고-${grade}] 시험 책 ${lid}</a></td><td><div class="tdQa">${grade}</div></td><td><span id="supCodeChg_val_${lid}">${sku}</span></td><td><a onclick="stockStatusChgLayerOpen(${lid})">${st}</a></td><td><span id="stockChg_val_${lid}">${qty}</span></td><td>시험출판</td><td><span id="priceSalesChg_val_${lid}">${price}</span></td><td class="name">11-01</td></tr>`;
  const list = () => page('상품 조회', `<table>${row(5001, 'U000000001', '판매중', '12,000', 'BLKCMN-1', '상', 1)}${row(5002, 'U000000002', '판매중', '8,000', 'BLKCMN-2', '최상', 1)}</table><div class="pageNavCtl"><span class="pagenum_on">1</span></div>`);
  const ord = (n, ono, lid, inv) => `<tr id="oList${n}"><td>v</td><td>발송준비중</td><td>${n}</td><td><a onclick="viewOrderDetail('${ono}')">${ono}</a></td><td><a href="/shop/wproduct.aspx?ItemId=${lid}">[중고-상] 시험 책 ${lid}</a></td><td>1</td><td title="a@b.c"><a onclick="viewAddrLayer(${n},0)">손님A</a></td><td><a onclick="viewAddrLayer(${n},1)">상동</a></td><td>12,000</td><td><input name="deliveryNo.${n}" value="${inv || ''}"></td></tr><tr id="oList${n}b"><td>BLKCMN-1, 2026-11-01</td></tr>`;
  const lay = (n) => `<div id="addrLayer${n}"><table><tr><td>성명</td><td>손님A</td></tr><tr><td>전화1</td><td>010-1234-5678</td></tr><tr><td>주소</td><td>시험시 시험구 1길</td></tr></table></div>`;
  const confirm = () => page('주문확인요청', `<table>${ord(1, '111-A000000001', 5001)}${ord(2, '111-A000000002', 5002)}</table>${lay(1)}${lay(2)}<div>주문확인요청 (2건) 발송 요청 (1건)</div>`);
  const deliv = () => page('발송 요청', `<table>${ord(1, '111-A000000003', 5003, '123412341234')}</table>${lay(1)}<div>주문확인요청 (2건) 발송 요청 (1건)</div>`);
  const qna = () => page('묻고 답하기', `<table><tr><td>2</td><td><a href="/scm/wUsedShopC2CAnswer.aspx?questionid=9001">책 상태가 궁금해요</a></td><td>손님A</td><td>2026-11-08</td><td>답변완료</td></tr><tr><td>1</td><td><a href="/scm/wUsedShopC2CAnswer.aspx?questionid=9002">언제 오나요</a></td><td>손님A</td><td>2026-11-09</td><td>미답변</td></tr></table>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/asid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      S.log.push({ m: q.method, p: u.pathname, q: u.search, mode: q.headers['sec-fetch-mode'] || '', auth, t: Date.now() });
      const H = (code, body, x) => { s.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/login/wlogin.aspx' && q.method === 'POST') { const f = new URLSearchParams(b); if (f.get('pw') !== PW_SECRET) return H(200, '<title>로그인</title>틀림'); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, '', { 'Set-Cookie': `asid=${id}; Path=/; HttpOnly${f.get('keep') ? '; Max-Age=86400' : ''}`, Location: u.searchParams.get('returnurl') || '/scm/wmain.aspx' }); }
      if (u.pathname === '/login/wlogin.aspx') return H(200, `<!doctype html><meta charset="utf-8"><title>로그인</title><form method="post" action="/login/wlogin.aspx${u.search}"><input name="id"><input type="password" name="pw"><label><input type="checkbox" name="keep" value="1">로그인 상태 유지</label><button>로그인</button></form>`);
      if (u.pathname.startsWith('/scm/')) { if (!auth) return H(302, '', { Location: '/login/wlogin.aspx?returnurl=' + encodeURIComponent(u.pathname + u.search) });
        if (S.r429 && u.pathname !== '/scm/wmain.aspx') return H(429, 'too many');
        if (u.pathname === '/scm/wmain.aspx') return H(200, page('샵매니저', '첫 화면'));
        if (u.pathname === '/scm/wrecord_edit.aspx') return H(200, list());
        if (u.pathname === '/scm/worder_preparatory_complete.aspx') return H(200, confirm());
        if (u.pathname === '/scm/worder_delivery.aspx') return H(200, deliv());
        if (u.pathname === '/scm/wUsedShopC2CQnASellerList.aspx') return H(200, qna());
        return H(200, page('기타', '바꾸는 길 — 불리면 안 됨')); }
      return H(200, page('알라딘', '')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
async function closeHuman(A) { try { const c = await A.br.newBrowserCDPSession(); await c.send('Browser.close'); } catch (e) {} await A.br.close().catch(() => {}); }
async function attach(home) { const pf = path.join(home, 'col2-al-chrome', 'DevToolsActivePort'); const port = fs.readFileSync(pf, 'utf8').split('\n')[0].trim(); const br = await L.chromium().connectOverCDP('http://127.0.0.1:' + port); const pg = br.contexts()[0].pages()[0]; return { br, pg }; }
const DANGER = /ajaxCmd|worder_process|NoticeEdit|usedbatch|ReportNotSales|deliveryNoBulk|C2CAnswer|account_make|wrecord\.aspx/;
const walk = (d, hit) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let st0; try { st0 = fs.lstatSync(p); } catch (e) { continue; } if (st0.isSymbolicLink()) continue; if (st0.isDirectory()) { if (!/-chrome$/.test(p)) walk(p, hit); } else { const t = fs.readFileSync(p, 'utf8'); hit(f, t); } } };

(async () => {
  console.log('⓪ 읽기 길·손님 정보 버리기(순수 함수)');
  ok(AC.isReadUrl(AC.READ.list.url({ st: '판매중지' })) && AC.isReadUrl('/scm/worder_preparatory_complete.aspx') && AC.isReadUrl('/scm/worder_delivery.aspx?orderstep=4') && AC.isReadUrl('/scm/wmain.aspx'), '읽기 다섯 길은 통과');
  const bad = ['/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=1&priceSales=100', '/scm/worder_process.aspx?cmd=StartDelivery&ono=1', '/scm/NoticeEdit.aspx?edit=del&pkid=1', '/scm/wrecord_edit_usedbatch.aspx', '/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=1', '/scm/wUsedShopC2CAnswer.aspx?questionid=1&method=edit', '/scm/worder_delivery.aspx?orderstep=4&cmd=x', '/scm/worder_excel.aspx', '/login/wlogin.aspx', '/account/wSubPayInfo.aspx'];
  ok(bad.every((u) => !AC.isReadUrl(u)), '값을 바꾸는 길(GET 포함)·로그인·계정 화면은 모두 거절', bad.filter((u) => AC.isReadUrl(u)));
  const tp = AC.trimProd('shp_state', 'confirm', { at: '2026-11-10T00:00:00Z', tabCounts: { 주문확인요청: 2 }, orders: [{ orderNo: '1', buyer: '손님A', recipient: { name: '손님A', phone1: '010-1234-5678' }, items: [{ listingId: '5', title: 'x' }] }] });
  ok(!PII.some((w) => JSON.stringify(tp).includes(w)) && tp.orders[0].orderNo === '1' && tp.orders[0].items[0].listingId === '5', '운영 문서에서 손님 정보는 받는 순간 버림(번호만 남김)', JSON.stringify(tp));
  ok(AC.trimProd('crm_interactions', 'aladin_qna_1', { body: '글', authorMasked: '손님A', answerStatus: '미답변' }).answerStatus === '미답변' && AC.trimProd('crm_customers', 'x', {}) === undefined && AC.trimProd('shp_state', 'zzz', {}) === undefined, '견줄 칸·문서 이름 밖은 받지 않음');

  const F = await fakeScm(); const repo = process.env.COL2_PROD_REPO || path.join(__dirname, '..', '..', '..');
  const env = { RN_COL2_ALSCM: F.base, RN_COL2_CORE_DIR: repo, RN_COL2_HUMAN_TEST_ARGS: '--remote-debugging-port=0' };
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200, cmpWaitMin: 0.5, cool429Min: 0.2 };
  let H = await L.startHelper({ cfg: { on: true, y24: false, auto: false, headless: true, alcfg, watch: { tickSec: 60, handoffMs: 200 } }, env }); const D = H.D, HOME = D + '/home';
  const st = async () => (await H.api('GET', '/status')).j; const a = async () => (await st()).al;
  let seat = true, hold = false; const feed = (x) => H.api('POST', '/al/feed', { by: '시험 수집기', seat: { ok: seat, why: seat ? '' : '자리 4/4' }, hold: { on: hold }, ...(x || {}) });
  let feeding = false; const feeder = setInterval(() => { if (feeding) feed().catch(() => {}); }, 1000);
  try {
    console.log('① 기본 꺼짐 · 다리·자리 없으면 알라딘에 안 감');
    await wait(1500); let s = await a(); ok(!s.on && !s.want && /꺼 둠/.test(s.msg) && F.S.log.length === 0 && !H.T.clog().some((l) => /col2-al-chrome/.test(l)), '기본은 꺼짐 — 알라딘 크롬도 안 띄움', s.msg);
    ok(/data-card="al"/.test((await H.req('GET', '/')).b) && /🔐 알라딘 로그인/.test((await H.req('GET', '/s/col2-ui.js')).b), '옆 창에 🟧 칸과 [🔐 알라딘 로그인] 단추');
    await H.api('POST', '/cfg', { al: true }); await wait(1500); s = await a();
    ok(s.on && /다리\)가 안 보/.test(s.msg) && F.S.log.length === 0, '켜도 수집기 다리(출고 보호·자리)가 안 보이면 안 감', s.msg);
    seat = false; await feed(); await wait(1200); s = await a(); ok(/자리 기다림/.test(s.msg) && F.S.log.length === 0, '🪑 자리가 없으면(4/4) 안 감 — 그림자는 자리 차례 맨 뒤', s.msg);
    seat = true; feeding = true;
    s = await until(async () => { const v = await a(); return v.login === 'need' ? v : null; }, 80);
    ok(s && s.login === 'need' && F.S.log.some((x) => x.p === '/scm/wmain.aspx' && !x.auth) && !F.S.log.some((x) => x.m === 'POST'), "자리가 생기면 샵매니저 첫 화면 → 로그인 화면 → '로그인 필요'(저절로 로그인하지 않음)", s && s.loginMsg);

    console.log('② 로그인 한 번(정범님 손) — 비밀번호 안 남음');
    const n0 = F.S.log.length; const c0 = H.T.clog().length; let r = await H.api('POST', '/al/login', { why: '시험' }); ok(r.j.ok && H.T.win().acts.includes('show:col2-al-chrome') && /평범한 크롬/.test(r.j.msg), '단추 → 평범한 크롬 창으로 알라딘 로그인 화면(앞으로)', r.j.msg || r.j.err);
    { const hl = H.T.clog().slice(c0).filter((l) => /col2-al-chrome/.test(l) && /scm\/wmain/.test(l)).pop() || ''; const fl = hl.split(' ').filter((x) => /^--/.test(x) && x !== '--remote-debugging-port=0'); /* 시험만 넣은 사람 손 흉내 길 하나는 뺌 */
      ok(hl && !fl.some((x) => /remote-debugging|enable-automation|headless|disable-extensions|disable-background|window-position=-|mute-audio|disable-sync/.test(x)) && fl.every((x) => /^--(user-data-dir|no-first-run|no-default-browser-check|window-size|window-position)/.test(x)), '사람 로그인 창 = 조종 길·자동화·일꾼 플래그 없는 평범한 크롬(같은 프로필)', fl.join(' ')); }
    s = await a(); ok(s.login === 'human' && s.human && s.human.open, "상태 '평범한 창에서 로그인 기다림'", s.msg);
    const A1 = await attach(HOME); await A1.pg.waitForSelector('input[type=password]'); await A1.pg.fill('input[name=id]', 'seller'); await A1.pg.fill('input[type=password]', PW_SECRET); await A1.pg.check('input[name=keep]'); await A1.pg.click('button'); await A1.pg.waitForURL(/wmain/).catch(() => {});
    await wait(1500); s = await a(); ok(s.login === 'human', '정범님이 창을 닫기 전엔 번외가 그 창을 건드리지 않고 기다림', s.msg);
    await closeHuman(A1); /* 정범님이 창을 닫음(X) — 크롬이 점잖게 끝나며 쿠키를 씀 */
    s = await until(async () => { const v = await a(); return v.login === 'ok' ? v : null; }, 80);
    if (process.env.DBG) console.log(JSON.stringify(F.S.log.slice(n0).map((x) => x.m + x.p + (x.auth ? '+' : '-'))), (await a()).msg, (await a()).loginMsg); ok(s && H.T.win().acts.includes('hide:col2-al-chrome'), '로그인하면 저절로 다시 숨김', s && s.msg);
    const leak = []; walk(HOME, (f, t) => { if (t.includes(PW_SECRET)) leak.push(f); }); const pref = JSON.parse(fs.readFileSync(path.join(HOME, 'col2-al-chrome', 'Default', 'Preferences'), 'utf8'));
    ok(!leak.length && pref.credentials_enable_service === false && pref.profile.password_manager_enabled === false, '비밀번호가 도우미 파일 어디에도 없음 · 그 크롬의 비밀번호 저장 끔', leak);

    console.log('③ 화면 없이 직접 부름 · 읽기 다섯 길만');
    s = await until(async () => { const v = await a(); return ['chk', 'confirm', 'deliv', 'list', 'qna'].every((k) => v.last[k] && v.last[k].ok) ? v : null; }, 160);
    const L1 = F.S.log.slice(n0); const reads = L1.filter((x) => /wrecord_edit|preparatory|worder_delivery|QnASeller/.test(x.p));
    ok(s && reads.length >= 4 && reads.every((x) => x.auth && x.mode !== 'navigate' && x.m === 'GET'), '주문확인요청·발송 요청·상품 목록·문의 목록 = 로그인 세션 · 화면 이동 없이 탭 안 fetch(GET)', JSON.stringify(L1.map((x) => x.m + ' ' + x.p + ' ' + x.mode)));
    ok(!L1.some((x) => x.mode === 'navigate' && /wrecord_edit|preparatory|worder_delivery|QnASeller/.test(x.p)) && !F.S.log.some((x) => DANGER.test(x.p)), '그 화면들을 열지 않음 · 값을 바꾸는 길은 한 번도 안 부름');
    ok(s.last.list.n === 2 && s.last.confirm.n === 2 && s.last.deliv.n === 1, '운영 공용 파일로 해석(목록 2줄 · 주문확인요청 2건 · 발송 요청 1건)', JSON.stringify(s.last));

    console.log('④ 운영 칸과 견줌(웹앱 대신 읽기) — 손님 정보 없음 · col2_al에만');
    let pd = (await H.api('GET', '/relay/pending?by=t')).j; const W = pd.want.map((w) => w.c + '/' + w.id);
    ok(W.includes('prd_listings/aladin_U000000001') && W.includes('shp_state/confirm') && W.includes('shp_state/current') && W.includes('crm_interactions/aladin_qna_9001'), '견줄 운영 문서를 웹앱에 부탁(읽기만)', W);
    const OP = [{ c: 'prd_listings', id: 'aladin_U000000001', v: { usedCode: 'U000000001', status: '판매중', price: 12000, sku: 'BLKCMN-1', grade: '상', qty: 1, title: '운영 제목' } },
      { c: 'prd_listings', id: 'aladin_U000000002', v: { usedCode: 'U000000002', status: '판매중', price: 9000, sku: 'BLKCMN-2', grade: '최상', qty: 1 } },
      { c: 'shp_state', id: 'confirm', v: { at: new Date().toISOString(), tabCounts: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ orderNo: '111-A000000001', buyer: '손님A', items: [{ listingId: '5001' }] }, { orderNo: '111-A000000002', buyer: '손님A', recipient: { phone1: '010-1234-5678', address: '시험시 시험구 1길' }, items: [{ listingId: '5002' }] }] } },
      { c: 'shp_state', id: 'current', v: { at: new Date().toISOString(), tabCounts: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ orderNo: '111-A000000003', buyer: '손님A', items: [{ listingId: '5003' }], deliveryNo: '123412341234' }] } },
      { c: 'crm_interactions', id: 'aladin_qna_9001', v: { answerStatus: '답변완료', body: '책 상태가 궁금해요', authorMasked: '손님A' } }, { c: 'crm_interactions', id: 'aladin_qna_9002', v: { answerStatus: '미답변' } },
      { c: 'crm_customers', id: 'x1', v: { name: '손님A' } }];
    r = await H.api('POST', '/relay/answer', { docs: OP }); ok(r.j.ok && r.j.n === 6, '웹앱이 넘긴 운영 문서 받음(견줄 칸 밖 crm_customers는 버림)', r.j.n);
    const outs = await until(async () => { const p = (await H.api('GET', '/relay/pending?by=t')).j; const o2 = p.out.filter((x) => x.c === 'col2_al' && !/^day_/.test(x.id)); return o2.length >= 4 ? p.out : null; }, 120);
    const byK = {}; for (const x of (outs || []).filter((x) => x.c === 'col2_al')) byK[x.v.kind || 'day'] = x.v;
    ok(byK.list && byK.list.verdict === 'diff' && byK.list.res.same === 1 && byK.list.res.diff === 1 && byK.list.res.byField['판매가'] === 1, '상품 목록: 1줄 같음 · 1줄 판매가 다름(8,000 ↔ 9,000)', byK.list && JSON.stringify(byK.list.res));
    ok(byK.confirm && byK.confirm.verdict === 'same' && byK.deliv && byK.deliv.verdict === 'same' && byK.qna && byK.qna.verdict === 'same', '주문확인요청·발송 요청(송장 칸까지)·문의 답변 상태 = 운영과 같음', JSON.stringify({ c: byK.confirm && byK.confirm.res, d: byK.deliv && byK.deliv.verdict, q: byK.qna && byK.qna.res }));
    ok(byK.day && byK.day.cmp >= 4 && (outs || []).every((x) => /^col2_/.test(x.c)), '하루 요약 col2_al/day_<날짜>_<PC> · 맡긴 결과는 모두 col2_* 칸', byK.day && JSON.stringify(byK.day));
    const blob = JSON.stringify(outs) + JSON.stringify(await st()); let fileHit = []; walk(HOME, (f, t) => { if (PII.some((w) => t.includes(w))) fileHit.push(f); });
    ok(!PII.some((w) => blob.includes(w)) && !fileHit.length, '손님 이름·전화·주소가 결과·상태·도우미 파일 어디에도 없음', fileHit);

    console.log('⑤ 출고 중 · 429 · 세션 풀림 · 핑퐁');
    hold = true; await feed(); await wait(800); let n1 = F.S.log.length; await H.api('POST', '/al/run', { what: 'confirm' }); await wait(2500); s = await a();
    ok(/출고 중/.test(s.msg) && F.S.log.length === n1 && !s.active, '🚚 출고 중(수집기가 알려 준 출고 보호)엔 알라딘에 안 감', s.msg);
    r = await H.api('POST', '/al/login', {}); ok(!r.j.ok && /출고 중/.test(r.j.err), '출고 중엔 로그인 단추도 거절', r.j.err);
    hold = false; await feed();
    F.S.r429 = true; await H.api('POST', '/al/run', { what: 'list' }); s = await until(async () => { const v = await a(); return /429 뒤 쉼/.test(v.msg) ? v : null; }, 60);
    n1 = F.S.log.length; await H.api('POST', '/al/run', { what: 'qna' }); await wait(1500); ok(s && F.S.log.length === n1, '429면 쉼(그림자가 먼저 물러남)', s && s.msg); F.S.r429 = false;
    await until(async () => !/429 뒤 쉼/.test((await a()).msg), 80);
    F.S.sess.clear(); n1 = F.S.log.length; await H.api('POST', '/al/run', { what: 'confirm' });
    { const v0 = await until(async () => { const v = await a(); return v.login === 'need' ? v : null; }, 80); let q = await H.api('POST', '/al/login', {}); const v1 = await a(); q = await H.api('POST', '/al/login', { why: '로그인 다 함' }); const v2 = await until(async () => { const v = await a(); return v.login === 'need' && !v.human ? v : null; }, 80);
      ok(v0 && v1.login === 'human' && q.j.ok && /닫고/.test(q.j.msg) && v2 && /평범한 크롬 창을 닫은 뒤에도/.test(v2.loginMsg), "[✅ 로그인 다 함] → 창을 닫고 확인 · 로그인 안 했으면 '로그인 필요'로", q.j.msg + ' / ' + (v2 && v2.loginMsg)); n1 = F.S.log.length; }
    s = await until(async () => { const v = await a(); return v.login === 'need' ? v : null; }, 80); await wait(2500);
    ok(s && s.login === 'need' && !F.S.log.slice(n1).some((x) => x.m === 'POST' || /login/.test(x.p) && x.mode === 'navigate' && x.t > F.S.log[n1].t + 3000), "세션이 풀리면 '로그인 필요' — 저절로 다시 로그인하지 않음(번갈아 넘어감 0)", s && s.loginMsg);
    await H.api('POST', '/al/login', {}); { const A2 = await attach(HOME); await A2.pg.waitForSelector('input[type=password]'); await A2.pg.fill('input[type=password]', PW_SECRET); await A2.pg.check('input[name=keep]'); await A2.pg.click('button'); await A2.pg.waitForURL(/wmain/).catch(() => {}); await closeHuman(A2); }
    await until(async () => (await a()).login === 'ok', 80);
    feeding = false; await wait(1500); await feed({ opLostAt: Date.now() }); s = await a(); await wait(2500); n1 = F.S.log.length; /* 그때 이미 보낸 한 장은 끝나게 둠 */ await H.api('POST', '/al/run', { what: 'confirm' }); await wait(2000); feeding = true; const s2 = await a();
    ok(s.pp && /운영 세션이 풀림/.test(s.pp) && s2.pp && /핑퐁/.test(s2.msg) && F.S.log.length === n1, '번외 로그인 직후 운영 세션이 풀렸다고 하면 → 핑퐁 의심으로 멈춤(운영 로그인이 먼저)', s.pp);
  } finally { clearInterval(feeder); try { await H.stop(); } catch (e) {} killDir(D); }

  console.log('⑥ 로거 PC');
  H = await L.startHelper({ cfg: { on: true, y24: false, al: true, pc: 'LOGGER', auto: false, headless: true, alcfg }, env }); const D2 = H.D;
  try { const nL = F.S.log.length; await H.api('POST', '/al/feed', { seat: { ok: true }, hold: { on: false } }); await wait(2500); const s = (await H.api('GET', '/status')).j;
    ok(s.al.logger && !s.al.on && !H.T.clog().some((l) => /col2-al-chrome/.test(l)) && F.S.log.length === nL, '로거 PC는 켜 둬도 알라딘 크롬을 안 띄우고 알라딘에 안 감(약속 0)', s.al.msg);
    const r = await H.api('POST', '/al/login', {}); ok(!r.j.ok && /로거/.test(r.j.err), '로거 PC에선 로그인 단추도 거절', r.j.err);
  } finally { try { await H.stop(); } catch (e) {} killDir(D2); }
  F.srv.close(); L.done('t_al');
})();
