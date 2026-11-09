// tY24UP2 — 정범님 11/09 17:09 스크린샷: 예스24 판매관리에 로그인돼 있는데(신규주문 0·배송중 1이 보임) 띠는 주황 '🔁 주문 다시 읽기 — 로그인이 풀린 것 같음'
//  진단(11/09): y24_probe 'POST /api/Order/NewOrderConfirmList' 196번 · 마지막 응답 401(17:39) · 화면을 연 지 약 1시간 뒤부터 다시 읽기만 401(14:15 연 화면 → 15:15쯤 · 16:08 다시 연 화면 → 17:05쯤)
//   → 다시 읽기가 화면 첫 [조회] 때 기억한 머리글(rn-y24otpl.h)을 그대로 보내서 낡은 것 — 로그인이 풀린 것이 아님
//  고침(수집기 rnY24 · 머리 그대로): ① 화면이 스스로 보낸 /api/ 요청의 최신 머리글 값으로 바꿔 보냄(hdrFresh) ② 그래도 401이면 그 주문 화면을 숨은 틀로 한 번 열고 [조회]만 눌러(읽기) 새 머리글을 배운 뒤 한 번 더
//   ③ 숨은 틀이 로그인 화면이면 그때만 '로그인이 풀림' ④ 틀이 정상인데도 거절이면 '로그인 풀림'이라 하지 않고 '예스24가 다시 읽기를 받지 않음 — 화면 로그인은 살아 있음'
//  가짜 예스24 판매관리(uscm.yes24.com — 시험 안에서만 꾸민 화면 · 머리글 X-Tok이 지금 값이어야 200)
//  사용: node tY24UP2.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } }
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a0 = src.indexOf('(function rnY24()'); const b0 = src.indexOf('\n})();', a0); if (a0 < 0 || b0 < 0) { console.log('❌ tY24UP2 — rnY24 덩어리를 못 찾음'); process.exit(0); }
const Y24 = src.slice(a0, b0 + 6);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };

const TPL = (tok) => ({ NewOrderConfirmList: { u: '/api/Order/NewOrderConfirmList', b: JSON.stringify({ SDATE: '2026-11-01', EDATE: '2026-11-09', PAGE_NO: 1 }), h: { 'X-Tok': tok, 'Content-Type': 'application/json' }, at: Date.now() - 3600e3 } });

const run = async () => { const br = await chromium.launch(); const errs = [];
  // srv: 서버가 받는 머리글 값(tok) · 숨은 틀 화면이 로그인 화면인지(login) · [조회]가 보내는 값(btnTok) · 화면이 처음부터 스스로 보내는 값(selfTok)
  const mk = async (srv, seed) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const LOG = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const h = rq.headers(); LOG.push({ m: rq.method(), p: u.pathname, tok: h['x-tok'] || null });
      if (/^\/api\/Order\//.test(u.pathname)) { const good = h['x-tok'] === srv.tok; return rt.fulfill({ status: good ? 200 : 401, contentType: 'application/json; charset=utf-8', body: JSON.stringify(good ? { RESULT_LIST: [], TOTAL_COUNT: 0, RESULT_CODE: 'S000' } : { ERROR_MSG: '인증 정보가 없습니다', REDIRECT_URL: '/Account/Login', STACK_TRACE: null }) }); }
      if (/^\/api\/Common\//.test(u.pathname)) return rt.fulfill({ status: h['x-tok'] === srv.tok ? 200 : 401, contentType: 'application/json', body: '{"RESULT_CODE":"S000"}' });
      if (/^\/Order\//.test(u.pathname)) { if (srv.login) return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body><form><input name="id"><input type="password" name="pw"><button type="button">로그인</button></form></body></html>' });
        return rt.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>신규 주문</h1><button id="q" type="button" onclick="var x=new XMLHttpRequest();x.open('POST','/api/Order/NewOrderConfirmList');x.setRequestHeader('X-Tok','${srv.btnTok}');x.setRequestHeader('Content-Type','application/json');x.send('{&quot;PAGE_NO&quot;:1}');">조회</button> <button type="button">발송처리</button></body></html>` }); }
      return rt.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"></head><body>판매관리 첫 화면 · 신규주문 0 · 배송중 1</body></html>` }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); }; window.GM_deleteValue = (k) => { delete st[k]; }; window.GM_addValueChangeListener = () => 0; window.__rnY24tourScale = 0.04;
      window.GM_openInTab = () => ({}); window.GM_xmlhttpRequest = (o) => setTimeout(() => o.onerror && o.onerror(), 5); window.__LOGS = []; window.__rnLog = (s, lv, m) => window.__LOGS.push(lv + ' ' + m); }, { seed });
    await p.addInitScript({ content: Y24 }); await p.goto('https://uscm.yes24.com/Common/Body?rnx=y24cap01'); return { p, LOG }; };
  const until = async (p, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(150); } return false; };
  const st = (p) => p.evaluate(() => { const d = document.getElementById('rn-y24dock'); const divs = d ? [...d.querySelectorAll('div')] : []; const o = window.__rnY24ord || {}; return { err: o.err, n: o.n, at: o.at, fixN: o.fixN, renewN: o.renewN, ob: divs.map((x) => x.textContent).find((t) => /🔁 주문 다시 읽기/.test(t)) || '', obBg: (divs.find((x) => /🔁 주문 다시 읽기/.test(x.textContent)) || {}).style?.background || '', logs: window.__LOGS, frames: document.querySelectorAll('iframe').length, tpl: (window.__GM['rn-y24otpl'] || {}).NewOrderConfirmList }; });
  const CFG = { ordMin: 0.03, renewMin: 30 };

  // ── ① 기억한 머리글이 낡음(OLD) · 서버는 NEW만 받음 → 숨은 틀로 주문 화면을 열고 [조회]만 → 새 머리글을 배워 다시 → 받음 · '로그인 풀림' 아님
  { const { p, LOG } = await mk({ tok: 'NEW', btnTok: 'NEW' }, { 'rn-y24otpl': TPL('OLD'), 'rn-y24cfg': CFG });
    const done = await until(p, () => (window.__rnY24ord || {}).at > 0, 25000); await p.waitForTimeout(5400); const s = await st(p);
    const api = LOG.filter((x) => /^\/api\/Order\/NewOrderConfirmList/.test(x.p)); const pg = LOG.filter((x) => /^\/Order\/NewOrderConfirmList/.test(x.p));
    ok(done && !s.err && s.fixN >= 1 && s.renewN === 1, `낡은 머리글 401 → 숨은 틀로 한 번 → 다시 읽기 받음 · 띠 오류 없음: ${JSON.stringify({ err: s.err, fixN: s.fixN, renewN: s.renewN })}`, s);
    ok(api[0] && api[0].tok === 'OLD' && api.some((x, i) => i > 0 && x.tok === 'NEW'), `처음엔 기억한 OLD로 · 숨은 틀 [조회](NEW) 뒤엔 NEW로 보냄: ${JSON.stringify(api.map((x) => x.tok))}`);
    ok(pg.length === 1 && s.frames === 0, `주문 화면을 숨은 틀로 딱 한 번 열고 치움(틀 남지 않음): 화면 ${pg.length} · 틀 ${s.frames}`);
    ok(s.tpl && s.tpl.h && s.tpl.h['X-Tok'] === 'NEW', `숨은 틀 [조회] 때 조건 모양(rn-y24otpl)도 새로 배움: ${JSON.stringify(s.tpl && s.tpl.h)}`);
    ok(!/로그인이 풀/.test(s.ob) && /주문 다시 읽기 \S+분마다/.test(s.ob) && !/B5651D|181, 101, 29/.test(s.obBg), `띠: 파랑 '🔁 주문 다시 읽기 N분마다' (주황 '로그인이 풀린 것 같음' 아님): ${s.ob}`);
    ok(s.logs.some((l) => /^ok 🔁 주문 다시 읽기 NewOrderConfirmList: 예스24 응답 401 → .*받음\(로그인 풀림 아님\)/.test(l)), '수집기 기록에 401 → 다시 → 받음(로그인 풀림 아님)', s.logs);
    ok(!LOG.some((x) => /발송|Delivery\/Send|Confirm(?!List)/i.test(x.p)), '쓰기 길(발송처리 등)은 부르지 않음 · [조회]만');
    // 다음 차례는 새 머리글로 바로(틀 다시 안 엶)
    const n0 = s.n; await until(p, (n) => (window.__rnY24ord || {}).n > n, 8000); const s2 = await st(p); const pg2 = LOG.filter((x) => /^\/Order\/NewOrderConfirmList/.test(x.p)).length;
    ok(s2.n > n0 && pg2 === 1 && !s2.err, `다음 차례는 새 머리글로 바로 받음 · 숨은 틀 다시 안 엶: n ${n0}→${s2.n} · 화면 ${pg2}`);
    await p.context().close(); }

  // ── ② 화면이 스스로 보낸 요청의 머리글이 더 새것 → 숨은 틀 없이 그 값으로 바로
  { const { p, LOG } = await mk({ tok: 'NEW', btnTok: 'NEW' }, { 'rn-y24otpl': TPL('OLD'), 'rn-y24cfg': CFG });
    await p.evaluate(() => { const x = new XMLHttpRequest(); x.open('POST', '/api/Common/GetNewOrderYn'); x.setRequestHeader('X-Tok', 'NEW'); x.send('{}'); });
    const done = await until(p, () => (window.__rnY24ord || {}).at > 0, 25000); const s = await st(p); const api = LOG.filter((x) => /^\/api\/Order\//.test(x.p));
    ok(done && !s.err && !s.renewN && api[0] && api[0].tok === 'NEW' && !LOG.some((x) => /^\/Order\//.test(x.p)), `화면이 보낸 최신 머리글(NEW)로 처음부터 → 숨은 틀 없이 받음: ${JSON.stringify(api.map((x) => x.tok))}`, s);
    await p.context().close(); }

  // ── ③ 정말 로그인이 풀림 — 숨은 틀이 로그인 화면 → 그때만 '로그인이 풀림'
  { const { p, LOG } = await mk({ tok: 'NEW', btnTok: 'NEW', login: true }, { 'rn-y24otpl': TPL('OLD'), 'rn-y24cfg': CFG });
    const done = await until(p, () => /로그인/.test((window.__rnY24ord || {}).err || ''), 25000); await p.waitForTimeout(5400); const s = await st(p);
    ok(done && /로그인이 풀림\(숨은 창으로 확인함\)/.test(s.err) && /로그인이 풀림/.test(s.ob) && s.frames === 0, `숨은 틀이 로그인 화면 → '로그인이 풀림(숨은 창으로 확인함)' · 틀 치움: ${s.err}`, s);
    ok(!LOG.some((x) => /login|account/i.test(x.p) && x.m === 'POST'), '로그인 화면에는 아무것도 넣거나 누르지 않음');
    await p.context().close(); }

  // ── ④ 틀은 정상인데 그래도 거절 → '로그인 풀림'이라 하지 않음 · 30분 안엔 틀을 다시 열지 않음
  { const { p, LOG } = await mk({ tok: 'NEVER', btnTok: 'WRONG' }, { 'rn-y24otpl': TPL('OLD'), 'rn-y24cfg': CFG });
    const done = await until(p, () => !!(window.__rnY24ord || {}).err, 25000); await p.waitForTimeout(2500); const s = await st(p);
    ok(done && /예스24가 다시 읽기를 받지 않음\(401\) — 화면 로그인은 살아 있음/.test(s.err) && !/로그인이 풀/.test(s.err), `틀 정상·여전히 401 → '받지 않음 · 화면 로그인은 살아 있음': ${s.err}`, s);
    const pg = LOG.filter((x) => /^\/Order\//.test(x.p)).length; await p.waitForTimeout(4000); const pg2 = LOG.filter((x) => /^\/Order\//.test(x.p)).length; const api = LOG.filter((x) => /^\/api\/Order\//.test(x.p)).length;
    ok(pg === 1 && pg2 === 1 && api >= 3, `숨은 틀은 30분에 한 번까지(다시 읽기는 간격대로 계속): 화면 ${pg}→${pg2} · 다시 읽기 ${api}번`);
    await p.context().close(); }
  await br.close(); return errs; };

// ── ⑤ 원본 글: 머리 그대로 · 다시 읽기는 '조회' 목록 두 길만 · '로그인이 풀린 것 같음' 단정 글 없음
const textChk = () => { const head = src.slice(0, src.indexOf('==/UserScript==')); ok(!/hdrFresh|ordRenew/.test(head), '머리(==UserScript==)에 손대지 않음');
  ok(!/로그인이 풀린 것 같음/.test(Y24), "401만 보고 '로그인이 풀린 것 같음'이라 단정하던 글을 뺌");
  ok(/Y24O_RE = \/\\\/api\\\/Order\\\/\(NewOrderConfirmList\|OrderDeliveryList\)/.test(Y24), '주문 다시 읽기 길은 신규 주문·발송관리 목록 조회 둘뿐 그대로'); };

(async () => { textChk(); const errs = await run(); ok(!errs.length, '화면 오류 없음', errs); console.log(bad ? `❌ tY24UP2 실패 ${bad}` : '✓ tY24UP2 모두 통과'); })().catch((e) => { console.log('❌ tY24UP2 멈춤', e.message); });
