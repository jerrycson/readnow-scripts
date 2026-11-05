// tC2BPRT — 정범님 11/05 '접수완료 후 신청서 출력하기가 작동 안 되던 거 고쳤어? 그저 해당 페이지로만 가고 출력은 안 됐어'
//  ① 수집기 시작 코드(readnow-pc-boot.js) 새 길: 웹앱이 연 중고매장 첫 화면(usedstore/wgate.aspx?rnx=c2bprtf1 — 머리 @match에 있음)에서 깨어나
//     같은 출처 iframe으로 알라딘 접수 상세(또는 신청 내역 → 맨 위 접수)를 열고 그 안에서 '신청서 출력' 단추 찾기·누르기·새 창 잡기·print
//     (가짜 알라딘 화면 — 새 창(window.open) 꼴 · onclick 함수 꼴 · 그냥 링크 꼴 · 새 창 막힘 · 목록 · 로그인 풀림 · iframe 막힘(X-Frame-Options) · 로거 크롬) + 단계 기록(fin false → 끝 fin true)
//  ② 옛 길(account…rnx=c2bprt01)도 그대로 · 머리 그대로
//  ③ 웹앱: 「🖨 신청서 출력하기」 = 새 주소(휴대폰 = 옛 접수 화면) · 중간 기록은 '진행 중: 단계'(알림·기록 줄 없음) · 끝 기록만 알림 · 응답 없으면 '⚠ 이번에 수집기 응답 없음' · 단계 툴팁
// 실행: cd pw && RN_PORT=<포트> node tC2BPRT.js
let bad = 0, ran = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const H = require('./harness.js');
const BOOT = [process.env.RN_BOOT, path.join(__dirname, '../out/readnow-pc-boot.js'), path.join(__dirname, '../readnow-pc-boot.js'), path.join(__dirname, '../../readnow-pc-boot.js')].filter(Boolean).find((p) => fs.existsSync(p) && /rnx=c2bprtf/.test(fs.readFileSync(p, 'utf8')));
(async () => {
if (!BOOT) ok(false, '시작 코드(readnow-pc-boot.js)에 새 길(rnx=c2bprtf)이 없음 — split.js 다시'); else { const bs = fs.readFileSync(BOOT, 'utf8'); const i0 = bs.indexOf('🖨 알라딘 팔기 신청서 출력 도우미'); const s0 = bs.lastIndexOf('/*', i0); const e0 = bs.indexOf('/* (1.72.0) 화면 문', i0); const code = bs.slice(s0, e0);
  const { chromium } = require('playwright'); const br = await chromium.launch(); const ctx = await br.newContext(); console.log('① 새 길 — 중고매장 첫 화면 + iframe');
  const ST = '<table><tr><th>신청일</th><td>2026-11-05</td><th>연락처</th><td>010-0000-0000</td></tr></table>';
  const pages = {
    wgate: '<html><body><h1>알라딘 중고매장</h1><p>첫 화면</p></body></html>',
    pop: `<html><body>${ST}<a href="#" onclick="window.open('/account/c2bform.aspx?no=1','p','width=800');return false;"><img src="x.gif" alt="신청서 출력하기"></a></body></html>`,
    fn: `<html><body>${ST}<a href="javascript:void(0)" onclick="fnC2bPrint('77')">신청서 출력</a><script>window.fnC2bPrint = function (n) { window.__fn = n; window.print(); }; window.addEventListener('click', function (e) { if (!e.isTrusted) e.stopImmediatePropagation(); }, true);</script></body></html>`,
    link: `<html><body>${ST}<a href="c2bform.aspx?no=3">신청서 출력하기</a></body></html>`,
    linkt: `<html><body>${ST}<a href="/account/c2bform.aspx?no=4" target="_blank">신청서 출력</a></body></html>`,
    none: '<html><body><p>접수 내용</p><a href="#">목록</a></body></html>',
    list: '<html><body><a href="/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=20261105000099">20261105000099</a><a href="/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=20261101000001">old</a></body></html>',
    login: '<html><body><form>로그인</form></body></html>', form: '<html><body><h1>매입 신청서</h1><p>책 3권</p></body></html>' };
  await ctx.route(/aladin\.co\.kr/, (rt) => { const u = rt.request().url();
    if (/c2bsalesno=20261105000025/.test(u)) return rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: "<html><head><script>location.replace('/login/wlogin.aspx?ReturnUrl=x');</script></head><body></body></html>" }); /* 로그인 풀림 = 로그인 화면으로 옮겨 감(시험 틀이 302 넘겨주기를 못 따라가서 화면 안에서 옮김) */
    const k = /usedstore\/wgate/.test(u) ? 'wgate' : /\/login\//.test(u) ? 'login' : /c2bform/.test(u) ? 'form' : /C2BOrderList/.test(u) ? 'list' : /c2bsalesno=20261105000021/.test(u) ? 'fn' : /c2bsalesno=20261105000023/.test(u) ? 'linkt' : /c2bsalesno=20261105000022/.test(u) ? 'link' : /c2bsalesno=20261105000024/.test(u) ? 'none' : 'pop';
    const xfo = /c2bsalesno=20261105000026/.test(u); /* 접수 번호 끝 21 함수 · 22 링크 · 23 새 창 링크 · 24 단추 없음 · 25 로그인 풀림 · 26 iframe 막힘 */ rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers: xfo ? { 'x-frame-options': 'DENY' } : {}, body: pages[k] }); });
  /* 모든 창·iframe: print 횟수 · 맨 위 창만 GM 흉내(쓴 기록을 모두 쌓음) + 도우미 코드(주소에 rnx=c2bprt — 수집기 머리 @noframes처럼 도우미가 window.top만 봄) */
  await ctx.addInitScript({ content: `window.__pr = 0; window.print = function () { window.__pr++; }; if (window.top === window) { window.__gmh = []; window.GM_setValue = (k, v) => { window.__gm = window.__gm || {}; window.__gm[k] = v; window.__gmh.push(v); }; if (/[?&]rnx=c2bprt/.test(location.search)) document.addEventListener('DOMContentLoaded', () => { (function () { ${code} })(); }); }` });
  const pops = []; ctx.on('page', (x) => pops.push(x));
  const run = async (url, opt) => { opt = opt || {}; const pg = await ctx.newPage(); if (opt.logger) await pg.addInitScript(() => { window.G = { __rnPubChrome: true }; }); if (opt.blockFrame) await pg.addInitScript(() => { if (window.top !== window) window.open = function () { return null; }; }); await pg.goto(url); await pg.waitForTimeout(opt.wait || 6000); return pg; };
  const gm = (pg) => pg.evaluate(() => (window.__gm || {})['rn-c2bprt-last'] || null); const gmh = (pg) => pg.evaluate(() => window.__gmh || []);
  const band = (pg) => pg.evaluate(() => (document.getElementById('rn-c2bprt') || {}).innerText || '');
  const fpr = (pg) => pg.evaluate(() => { const f = document.getElementById('rn-c2bprt-f'); try { return f ? { pr: f.contentWindow.__pr, fn: f.contentWindow.__fn || null, url: f.contentWindow.location.href, sb: f.getAttribute('sandbox') || '', vis: f.style.display !== 'none' } : null; } catch (e) { return { err: e.message }; } });
  const WG = 'https://www.aladin.co.kr/usedstore/wgate.aspx?rnx=c2bprtf1';
  // ⓐ 새 창(window.open) 꼴 — iframe 안 단추가 연 창을 잡아 다 뜬 뒤 print 한 번
  pops.length = 0; const p1 = await run(WG + '&c2bno=20261105000011', { wait: 9000 }); const g1 = await gm(p1); const h1 = await gmh(p1); const pp = pops.find((x) => /c2bform\.aspx\?no=1/.test(x.url())); const pr1 = pp ? await pp.evaluate(() => window.__pr) : -1; const f1 = await fpr(p1); const b1 = await band(p1);
  ok(f1 && /wc2binfo\.aspx\?pType=c2borderinfo&c2bsalesno=20261105000011$/.test(f1.url) && f1.vis && /allow-same-origin/.test(f1.sb) && !/allow-top-navigation/.test(f1.sb), `중고매장 첫 화면에서 깨어나 접수 상세를 같은 출처 iframe으로 엶(보임 · 맨 위로 옮기기 막음) — ${f1 && f1.url && f1.url.replace(/^.*\/account\//, '')}`);
  ok(g1 && g1.how === 'popup' && g1.printed && g1.fin === true && g1.mode === 'frame' && g1.no === '20261105000011' && pr1 === 1 && /인쇄 창을 띄웠습니다/.test(b1), `새 창 꼴: 신청서 창이 다 뜬 뒤 print() 한 번(${pr1}) · 기록 ${g1 && g1.how} · 접수 ${g1 && g1.no} · 띠 '${b1.slice(0, 40)}'`);
  const stg = h1.filter((v) => v.fin === false).map((v) => v.stage); ok(['woke', 'frame', 'loaded', 'cands', 'pressed', 'popup'].every((k) => stg.includes(k)) && h1.filter((v) => v.fin === false).every((v) => v.how === 'run') && new Set(h1.map((v) => v.id)).size === h1.length && h1.every((v) => v.run === h1[0].run), `단계마다 중간 기록(fin false · how run · 쓸 때마다 새 id · 같은 run): ${stg.join('→')}`);
  ok(g1 && Array.isArray(g1.steps) && g1.steps.length >= 6 && /깨어남/.test(g1.steps[0]) && g1.nCand >= 1 && JSON.stringify(g1).indexOf('0000-0000') < 0, `끝 기록에 단계 ${g1 && g1.steps.length}개(${g1 && g1.steps.slice(0, 3).join(' · ')}…) · 단추 후보 ${g1 && g1.nCand}개 · 전화번호 없음`);
  const top1 = await p1.evaluate(() => ({ u: location.href, pr: window.__pr })); ok(/usedstore\/wgate/.test(top1.u) && top1.pr === 0, '맨 위 탭은 중고매장 첫 화면 그대로 · 맨 위 화면은 인쇄하지 않음');
  // ⓑ onclick 함수 꼴 — 누름이 먹지 않으면 iframe 안 함수를 직접 부름 → iframe 안 print
  const p2 = await run(WG + '&c2bno=20261105000021', { wait: 7000 }); const g2 = await gm(p2); const f2 = await fpr(p2);
  ok(g2 && g2.how === 'fn-print' && g2.fn === 'fnC2bPrint' && f2 && f2.fn === '77' && f2.pr === 1, `onclick 함수 꼴: fnC2bPrint('77')를 iframe 안에서 부름 → iframe 안 인쇄 ${f2 && f2.pr}번 · ${g2 && g2.how}`);
  // ⓒ 그냥 링크 꼴(같은 탭) — iframe 안에서 신청서 주소로 옮겨 다 뜬 뒤 print
  const p3 = await run(WG + '&c2bno=20261105000022', { wait: 7000 }); const g3 = await gm(p3); const f3 = await fpr(p3); const t3 = await p3.evaluate(() => location.href);
  ok(g3 && g3.how === 'nav' && g3.printed && g3.fin && f3 && /\/account\/c2bform\.aspx\?no=3$/.test(f3.url) && f3.pr === 1 && /wgate/.test(t3), `그냥 링크 꼴: iframe 안에서 신청서(상대 주소 c2bform.aspx)로 옮겨 인쇄 ${f3 && f3.pr}번 · 맨 위 탭은 그대로 · ${g3 && g3.how}`);
  // ⓒ' 새 창 링크(target=_blank)
  pops.length = 0; const p3b = await run(WG + '&c2bno=20261105000023', { wait: 9000 }); const g3b = await gm(p3b); const pp3 = pops.find((x) => /c2bform\.aspx\?no=4/.test(x.url())); const pr3b = pp3 ? await pp3.evaluate(() => window.__pr) : -1;
  ok(g3b && g3b.how === 'popup' && pr3b === 1, `새 창 링크 꼴: 우리가 그 창을 열어 잡고 print ${pr3b}번 · ${g3b && g3b.how}`);
  // ⓓ 새 창이 막힘 — iframe 자리에서 신청서로 옮겨 인쇄
  const p4 = await run(WG + '&c2bno=20261105000044', { blockFrame: true, wait: 9000 }); const g4 = await gm(p4); const f4 = await fpr(p4);
  ok(g4 && g4.how === 'nav' && g4.printed && f4 && /c2bform\.aspx\?no=1$/.test(f4.url) && f4.pr === 1 && !/rnx=/.test(f4.url), `새 창이 막히면 iframe 자리에서 신청서로 옮겨 인쇄(${f4 && f4.url && f4.url.replace(/^.*\/account\//, '')} · ${f4 && f4.pr}번 · ${g4 && g4.how})`);
  // ⓔ 접수 번호 없음 → 신청 내역 → 맨 위 접수 → 단추
  pops.length = 0; const p5 = await run(WG, { wait: 11000 }); const g5 = await gm(p5); const h5 = await gmh(p5); const f5 = await fpr(p5);
  ok(g5 && g5.how === 'popup' && g5.no === '20261105000099' && f5 && /c2bsalesno=20261105000099/.test(f5.url) && h5.some((v) => v.stage === 'list'), `번호 없음: 신청 내역 → 가장 새 접수 No. ${g5 && g5.no} 상세 → ${g5 && g5.how}`);
  // ⓕ 단추 없음 → 큰 🖨 인쇄 = iframe 안 화면만
  const p6 = await run(WG + '&c2bno=20261105000024', { wait: 12000 }); const g6 = await gm(p6); const b6 = await band(p6); await p6.click('#rn-c2bprt button'); await p6.waitForTimeout(400); const f6 = await fpr(p6); const g6b = await gm(p6); const top6 = await p6.evaluate(() => window.__pr);
  ok(g6 && g6.how === 'nobtn' && /못 찾음/.test(b6) && /접수 화면 감추기/.test(b6) && f6.pr === 1 && top6 === 0 && g6b.how === 'manual', `단추가 없으면 큰 🖨 인쇄 → 아래 접수 화면만 인쇄(iframe ${f6.pr} · 맨 위 ${top6}) · ${g6 && g6.how} → ${g6b && g6b.how}`);
  // ⓖ 로그인 풀림 — 안내만
  const p7 = await run(WG + '&c2bno=20261105000025', { wait: 5000 }); const g7 = await gm(p7); const b7 = await band(p7);
  ok(g7 && g7.how === 'login' && /로그인이 필요합니다/.test(b7), `로그인이 풀렸으면 안내만(${g7 && g7.how})`);
  // ⓗ iframe 막힘(X-Frame-Options) → 화면 글 읽기로 신청서 주소 → 큰 단추(사람) → 새 창 → print
  pops.length = 0; const p8 = await run(WG + '&c2bno=20261105000026', { wait: 7000 }); const b8 = await band(p8); const h8 = await gmh(p8);
  const bt8 = await p8.evaluate(() => [...document.querySelectorAll('#rn-c2bprt button')].map((b) => b.textContent));
  ok(/신청서 주소만 찾았습니다/.test(b8) && bt8.includes('🖨 신청서 출력하기') && bt8.includes('접수 화면 직접 열기') && h8.some((v) => v.stage === 'frame-x') && h8.some((v) => v.stage === 'frame-x-url') && !(await p8.evaluate(() => !!document.getElementById('rn-c2bprt-f'))), `알라딘이 iframe을 막으면 화면 글 읽기로 신청서 주소를 찾아 큰 단추 · 「접수 화면 직접 열기」(${bt8.join('/')})`);
  await p8.click('#rn-c2bprt button'); await p8.waitForTimeout(4000); const pp8 = pops.find((x) => /c2bform\.aspx\?no=1/.test(x.url())); const pr8 = pp8 ? await pp8.evaluate(() => window.__pr) : -1; const g8 = await gm(p8);
  ok(pr8 === 1 && g8 && g8.how === 'popup' && g8.human, `큰 단추를 누르면 신청서 창 → print ${pr8}번 · ${g8 && g8.how}`);
  // ⓘ 로거 크롬 — 안내만(iframe·읽기 없음)
  const p9 = await run(WG + '&c2bno=20261105000011', { logger: true, wait: 2500 }); const g9 = await gm(p9); const b9 = await band(p9); const f9 = await fpr(p9);
  ok(g9 && g9.how === 'logger' && /로거/.test(b9) && !f9, `로거 크롬은 내 계정 화면을 열지 않고 안내만(${g9 && g9.how})`);
  console.log('② 옛 길 · 머리');
  pops.length = 0; const pa = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=1&rnx=c2bprt01', { wait: 9000 }); const ga = await gm(pa); const ppa = pops.find((x) => /c2bform/.test(x.url())); const pra = ppa ? await ppa.evaluate(() => window.__pr) : -1;
  ok(ga && ga.how === 'popup' && ga.mode === 'tab' && pra === 1 && !(await pa.evaluate(() => !!document.getElementById('rn-c2bprt-f'))), `옛 주소(account…rnx=c2bprt01)에서 깨어나면 예전처럼 그 탭에서(iframe 없이) → ${ga && ga.how}`);
  const pb = await run('https://www.aladin.co.kr/usedstore/wgate.aspx', { wait: 1500 }); ok(!(await pb.evaluate(() => !!document.getElementById('rn-c2bprt') || (window.__gmh || []).length)), 'rnx 표시가 없는 중고매장 첫 화면(사람이 그냥 연 화면)에서는 아무것도 안 함');
  const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.user.js'), path.join(__dirname, '../../src/readnow-collector.src.js')].find((x) => fs.existsSync(x)), 'utf8'); const head = src.slice(0, src.indexOf('==/UserScript==')); ok(!/c2bprt/.test(head) && /@match\s+https:\/\/www\.aladin\.co\.kr\/usedstore\/\*/.test(head) && /@noframes/.test(head), '수집기 머리 그대로 — usedstore/*는 원래 @match에 있음 · @noframes(그래서 iframe 안이 아니라 맨 위에서 다룸)');
  ok(/data-rn-c2bprt/.test(bs), '시작 코드: 웹앱 화면에 새 길 신호(data-rn-c2bprt)');
  await br.close(); ran++; }
// ── ③ 웹앱
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const T0 = window.toast; const TL = []; window.toast = (m, e, ms) => { TL.push(String(m)); return T0 && T0(m, e, ms); };
    const urls = []; window.open = (u) => { urls.push(u); return {}; };
    await bhPrint('20261105000077'); await bhPrint(''); out.urls = urls.slice(); out.toast0 = TL.slice(-1)[0] || '';
    document.documentElement.setAttribute('data-rn-c2bprt', 'f'); TL.length = 0; await bhPrint('20261105000077'); out.toastSig = TL.slice(-1)[0] || '';
    document.documentElement.removeAttribute('data-rn-c2bprt'); const ua = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent'); Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Linux; Android 14) Mobile', configurable: true }); urls.length = 0; TL.length = 0; await bhPrint('20261105000077'); out.mob = { url: urls[0], toast: TL.slice(-1)[0] || '' }; delete navigator.userAgent; out.uaBack = !/Android/.test(navigator.userAgent);
    // 수집기 중간 기록(진행 중) → 알림·기록 줄 없음 · 단추 옆 '진행 중'
    TL.length = 0; const BB0 = () => (FS.prd_system || {}).buyback || {}; const logs0 = (BB0().log || []).filter((x) => x.act === 'printPc').length;
    const base = { no: '20261105000077', mode: 'frame', run: 'r1', cands: [], url: 'https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=20261105000077' };
    window.postMessage({ __rnC2bPrt: 1, rec: { ...base, id: 'r1.1', at: Date.now(), fin: false, how: 'run', stage: 'pressed', found: true, steps: ['깨어남(중고매장 첫 화면) 0초', '접수 화면 열림 1.2초', '알라딘 단추 누름 1.9초'] } }, location.origin); await W(900);
    out.mid = { btn: bhPrtBtn('20261105000077'), toast: TL.length, logs: (BB0().log || []).filter((x) => x.act === 'printPc').length - logs0, pc: ((BB0().prt || {})['20261105000077'] || {}).pc || null, hist: (((FS.prd_system || {}).c2bprt_diag || {}).hist || []).length };
    window.postMessage({ __rnC2bPrt: 1, rec: { ...base, id: 'r1.2', at: Date.now() + 10, fin: true, how: 'popup', stage: 'popup', found: true, printed: true, nCand: 1, steps: ['깨어남(중고매장 첫 화면) 0초', '알라딘 단추 누름 1.9초', '신청서 창 열림 2.1초', '끝 popup 4.5초'] } }, location.origin); await W(900);
    out.fin = { btn: bhPrtBtn('20261105000077'), toast: TL.join(' / '), logs: (BB0().log || []).filter((x) => x.act === 'printPc').length - logs0, pc: ((BB0().prt || {})['20261105000077'] || {}).pc || null, hist: (((FS.prd_system || {}).c2bprt_diag || {}).hist || []).length };
    // 멈춤 · 응답 없음
    const st = bhSt(); st.prt['20261105000088'] = { at: new Date(Date.now() - 300e3).toISOString(), n: 1, dev: 'JS-MAIN', pc: { at: new Date(Date.now() - 290e3).toISOString(), pc: 'JS-MAIN', how: 'run', stage: 'loaded', fin: false } }; out.stuck = bhPrtBtn('20261105000088').replace(/<[^>]+>/g, ' ');
    st.prt['20261105000099'] = { at: new Date(Date.now() - 120e3).toISOString(), n: 2, dev: 'JS-MAIN' }; out.noans = bhPrtBtn('20261105000099').replace(/<[^>]+>/g, ' ');
    st.prt['20261105000098'] = { at: new Date(Date.now() - 120e3).toISOString(), n: 2, dev: 'JS-MAIN', pc: { at: new Date(Date.now() - 86400e3).toISOString(), pc: 'JS-MAIN', how: 'popup', fin: true } }; out.old = bhPrtBtn('20261105000098').replace(/<[^>]+>/g, ' ');
    st.prt['20261105000097'] = { at: new Date(Date.now() - 20e3).toISOString(), n: 1, dev: 'JS-MAIN' }; out.fresh = bhPrtBtn('20261105000097').replace(/<[^>]+>/g, ' ');
    out.guide = JSON.stringify(PAGE_GUIDES.aladinBuy || PAGE_GUIDES.bbuy || '').length; out.g = (() => { const s = JSON.stringify(PAGE_GUIDES); const i = s.indexOf('"flow-print"'); return s.slice(i, i + 3000); })();
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 1));
  console.log('③ 웹앱');
  ok(/^https:\/\/www\.aladin\.co\.kr\/usedstore\/wgate\.aspx\?rnx=c2bprtf1&c2bno=20261105000077$/.test(r.urls[0]) && r.urls[1] === 'https://www.aladin.co.kr/usedstore/wgate.aspx?rnx=c2bprtf1', `PC: 「🖨 신청서 출력하기」 = 중고매장 첫 화면(@match) 새 주소 · 번호 없으면 c2bno 없이 (${r.urls.join(' | ').replace(/https:\/\/www\.aladin\.co\.kr/g, '')})`);
  ok(/수집기 신호가 없음/.test(r.toast0) && !/수집기 신호가 없음/.test(r.toastSig) && /파란 띠/.test(r.toastSig), '수집기 신호(data-rn-c2bprt)가 없으면 알림에 ⚠ 한 줄 · 있으면 없음');
  ok(/account\/wc2binfo\.aspx\?pType=c2borderinfo&c2bsalesno=20261105000077&rnx=c2bprt01/.test(r.mob.url || '') && /직접 눌러/.test(r.mob.toast) && r.uaBack, `휴대폰(수집기 신호 없음): 알라딘 접수 화면을 바로 엶 — 그 화면의 단추를 직접`);
  ok(r.mid.toast === 0 && r.mid.logs === 0 && r.mid.hist === 0 && r.mid.pc && r.mid.pc.how === 'run' && r.mid.pc.fin === false && r.mid.pc.stage === 'pressed' && /진행 중: 알라딘 단추 누름/.test(r.mid.btn) && /단계: 깨어남/.test(r.mid.btn), `중간 기록: 알림 ${r.mid.toast} · 기록 줄 ${r.mid.logs} · 진단 역사 ${r.mid.hist} · 단추 옆 '진행 중: 알라딘 단추 누름' · 툴팁 단계`);
  ok(r.fin.toast && /신청서 창을 열어 인쇄 창/.test(r.fin.toast) && r.fin.logs === 1 && r.fin.hist === 1 && r.fin.pc.fin === true && r.fin.pc.steps.length === 4 && /끝 popup/.test(r.fin.btn), `끝 기록: 알림 한 번 · 기록 줄 ${r.fin.logs} · 진단 역사 ${r.fin.hist} · 단계 ${r.fin.pc.steps.length}개`);
  ok(/⚠ 멈춤: 알라딘 접수 화면 열림/.test(r.stuck), `3분 넘게 그대로면 '⚠ 멈춤: 어느 단계' (${r.stuck.match(/🖥[^·]*/) || ''})`);
  ok(/⚠ 이번에 수집기 응답 없음/.test(r.noans) && /⚠ 이번에 수집기 응답 없음/.test(r.old) && !/응답 없음/.test(r.fresh), "누른 뒤 1분 30초 넘게 수집기 소식이 없으면(지난 결과만 있어도) '⚠ 이번에 수집기 응답 없음' · 갓 누른 것은 아직 아님");
  ok(/수집기가 켜진 PC/.test(r.g) && /중고매장 첫 화면/.test(r.g) && /휴대폰/.test(r.g) && /응답 없음/.test(r.g) && /로거/.test(r.g), '📖 설명서(flow-print): 수집기가 켜진 PC · 중고매장 첫 화면 위 접수 화면 · 휴대폰은 알라딘 화면만 · 응답 없음 · 로거 크롬');
  ran++; });
if (ran < 2) { bad++; console.log('  ❌ 시험 도중 멈춤'); } console.log(bad ? `❌ tC2BPRT 실패 ${bad}` : '✅ tC2BPRT 모두 통과'); })();
