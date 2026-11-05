// tSMALL — 정범님 11/04 지시 네 가지
//  ① 🏷 알라딘 매입 「🖨 신청서 출력하기」 — 접수완료 탭 접수 번호마다 · 장바구니 탭(가장 새 접수) · 알라딘 주소(rnx=c2bprt…) · 누른 기록(prt)
//     + 수집기 시작 코드(readnow-pc-boot.js)의 신청서 출력 도우미 — 가짜 알라딘 화면에서 '신청서 출력하기'를 찾아 누름 · 팝업 막힘이면 큰 단추 · 못 찾으면 '이 화면 인쇄' · 목록 → 가장 새 접수로
//  ② 📥 등록 끝남 표시가 다른 기기·다른 화면에 뜨지 않음(맡긴 기기 + 등록 화면에서만 창) · 대량 등록 멈춤 알림도 맡긴 기기만 · 받침 판매중지 알림은 🏷 알라딘 매입 화면에서만
//  ③ 🧮 수동 일괄 — 모든 탭에 전체 금액 · 잃는/얻는(확정 = 잃은/얻은) · 어떻게 셈했나 툴팁
//  ④ 🔕 PC 부재 알림 — MJ-MAIN 기본 끔 · 설정 칩으로 켜고 끔(logger_watch.absAlert · 모든 기기) · 띠·홈 🖥 기기 상태에서 빠짐 · 상태 표시는 그대로 · 클라우드 지킴이도 푸시 안 함
// 실행: cd pw && RN_PORT=8774 node tSMALL.js
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const H = require('./harness.js');
const BOOT = [process.env.RN_BOOT, path.join(__dirname, '../out/readnow-pc-boot.js'), path.join(__dirname, '../readnow-pc-boot.js'), path.join(__dirname, '../../readnow-pc-boot.js')].filter(Boolean).find((p) => fs.existsSync(p) && /rnC2bPrint/.test(fs.readFileSync(p, 'utf8')));
const CLOUD = [path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js')].find((p) => fs.existsSync(p));
(async () => {
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const page = () => document.getElementById('sheet');
    const T0 = window.toast; const TL = []; window.toast = (m, e, ms) => { TL.push(String(m)); return T0 && T0(m, e, ms); }; window.ask = async () => true; const opened = []; window.open = (u) => { opened.push(String(u)); return {}; };
    // ── ① 신청서 출력
    for (let i = 0; i < 3; i++) { const uc = 'U7700000' + i; S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(507700000 + i), title: '출력 책 ' + i, isbn13: '97911' + String(77000000 + i), price: 5000 + i * 100, qty: 1, grade: '상', status: '판매중', active: true, sku: 'BLK_p' + i }); }
    const L = ['U77000000', 'U77000001', 'U77000002'].map((u) => S.plist.get('aladin_' + u)); S.bbuyRes = { at: Date.now(), n: S.plist.size, scanned: 0, hit: new Map() }; S.stopRLoaded = true;
    openAladinSell({ t: 'sent' }); await W(800); await bhSendL(L, { k: 'prod' }); await W(300); const now = new Date(Date.now() - 60e3).toISOString();
    await db.collection('prd_system').doc('buyback').set({ cart: Object.fromEntries(L.map((l) => [l.usedCode, { state: 'added', at: now, by: 'PC', isbn13: l.isbn13 }])) }, { merge: true }); await W(800);
    openAladinSell({ t: 'cart', cs: 'go' }); await W(400); const cb = page().querySelector('.bhprts [data-bhprt=""]'); out.cartBtn = !!cb; if (cb) { cb.click(); await W(500); } out.cartUrl = opened.slice(-1)[0] || ''; out.latest = (BB().prt || {}).latest || null;
    const td = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); S.bb = { loaded: true, list: [{ id: 'O77', orderNo: '20261104000077', date: td, paidAmount: 0, items: [{ isbn13: L[0].isbn13, title: L[0].title, result: null }, { isbn13: L[1].isbn13, title: L[1].title, result: null }] }] }; S._bhBM = null; S._bhV++;
    openAladinSell({ t: 'recv' }); await W(500); out.recvStrip = (page().querySelector('.bhprts') || {}).innerText || ''; const rb = page().querySelector('.bhprts [data-bhprt="20261104000077"]'); out.recvBtn = !!rb; out.cardBtns = page().querySelectorAll('.bbcards [data-bhprt="20261104000077"]').length;
    if (rb) { rb.click(); await W(600); } out.recvUrl = opened.slice(-1)[0] || ''; out.prt1 = (BB().prt || {})['20261104000077'] || null; out.prtLog = (BB().log || []).filter((x) => x.act === 'print').length;
    openAladinSell({ t: 'recv' }); await W(300); out.recvBtnTxt = ((page().querySelector('.bhprts [data-bhprt="20261104000077"]') || {}).textContent || '').trim(); out.guide = !!(PAGE_GUIDES.bbuy.chapters[0].items.find((x) => x.id === 'flow-print'));
    try { history.back(); } catch (e) {} await W(300);
    // ── ② 등록 끝남 표시
    localStorage.setItem('rn-device', 'TEST-PC'); const me = deviceName(); const mk = (id, dev, st) => ({ id, type: 'regBulk', status: st, dev, ws: 'main', createdAt: '2026-11-04T01:00:0' + id.slice(-1), results: { r1: { state: st === 'done' ? 'live' : 'sent' } }, rows: [{ regItem: 'r1' }] });
    const fx = () => document.querySelectorAll('.rgdonefx').length; document.querySelectorAll('.rgdonefx').forEach((x) => x.remove());
    out.devMine = [regCmdDevMine(mk('c1', 'OTHER-PC', 'done')), regCmdDevMine(mk('c2', me, 'done')), regCmdMine(mk('c3', 'OTHER-PC', 'done'))];
    S.detail = { bbuy: 1 }; TL.length = 0; regCmdDiff(new Map([['c1', mk('c1', 'OTHER-PC', 'running')]]), new Map([['c1', mk('c1', 'OTHER-PC', 'done')]])); await W(100); out.otherDev = { fx: fx(), toast: TL.filter((t) => /등록/.test(t)).length };
    TL.length = 0; regCmdDiff(new Map([['c2', mk('c2', me, 'running')]]), new Map([['c2', mk('c2', me, 'done')]])); await W(100); out.mineOtherScreen = { fx: fx(), toast: TL.filter((t) => /📥 등록 끝남/.test(t)).length };
    S.detail = { reg: 1 }; TL.length = 0; regCmdDiff(new Map([['c4', mk('c4', me, 'running')]]), new Map([['c4', mk('c4', me, 'done')]])); await W(100); out.mineReg = { fx: fx() }; document.querySelectorAll('.rgdonefx').forEach((x) => x.remove()); S.detail = null;
    // 받침 판매중지 알림 — 🏷 알라딘 매입 화면이 아니면 알리지 않음
    const src = bhAutoRun.toString(); out.autoToastGuard = /S\.detail && S\.detail\.bbuy\) toast\(/.test(src); out.failGuard = /regCmdDevMine\(c\)/.test(regFailAutoBack.toString());
    // ── ③ 수동 일괄 합계 — 그룹 하나를 만들어 탭마다
    out.batch = null; try { const src3 = openBatch.toString ? '' : ''; } catch (e) {}
    // ── ④ PC 부재 알림
    out.def = [pcAbsOn('MJ-MAIN', {}), pcAbsOn('HOME', {}), pcAbsOn('JS-MAIN', {})];
    await db.collection('app_settings').doc('logger_watch').set({ alwaysOn: ['HOME', 'MJ-MAIN'], st: { 'MJ-MAIN': { k: 'down', since: new Date(Date.now() - 30 * 60e3).toISOString(), msg: '🖥 MJ-MAIN 수집기가 30분째 신호 없음' }, HOME: { k: 'down', since: new Date(Date.now() - 20 * 60e3).toISOString(), msg: '🖥 HOME 수집기가 20분째 신호 없음' } } }, { merge: true }); await W(800);
    localStorage.setItem('rn-devband', '1'); lwBand(S._lwLast); out.band1 = ((document.getElementById('lgwarn') || {}).innerText || ''); out.list1 = devEvList().filter((e) => e.src === 'logger').map((e) => e.name).sort();
    S.detail = null; S.tab = 'settings'; renderTabs(); renderMain(); for (let i = 0; i < 30 && !document.getElementById('st_pcabs'); i++) await W(200); const box = document.getElementById('st_pcabs'); out.setHtml = box ? box.innerText : ''; const chip = box && box.querySelector('[data-pcabs="MJ-MAIN"]'); out.chipMJ = chip ? chip.checked : null; const chipH = box && box.querySelector('[data-pcabs="HOME"]'); out.chipHOME = chipH ? chipH.checked : null;
    if (chipH) { chipH.checked = false; chipH.onchange(); await W(800); } out.absH = ((FS.app_settings || {}).logger_watch || {}).absAlert || {}; lwBand(S._lwLast); out.band2 = ((document.getElementById('lgwarn') || {}).innerText || ''); out.list2 = devEvList().filter((e) => e.src === 'logger' && !e.end).map((e) => e.name).sort();
    const box2 = document.getElementById('st_pcabs'); const chipM = box2 && box2.querySelector('[data-pcabs="MJ-MAIN"]'); if (chipM) { chipM.checked = true; chipM.onchange(); await W(800); } out.absM = (((FS.app_settings || {}).logger_watch || {}).absAlert || {})['MJ-MAIN'] || null; lwBand(S._lwLast); out.band3 = ((document.getElementById('lgwarn') || {}).innerText || '');
    out.mgr = (() => { try { S.aoList = ['HOME', 'MJ-MAIN']; S.aoSt = (S._lwLast || {}).st || {}; return mgrAoHtml().replace(/<[^>]+>/g, ' '); } catch (e) { return 'ERR ' + e.message; } })();
    localStorage.setItem('rn-devband', '0'); const lg = document.getElementById('lgwarn'); if (lg) lg.remove(); S.tab = 'home';
    out.feat = ['🔕 PC 부재 알림', '🖨 알라딘 팔기 신청서', '🧮 수동 일괄 — 모든 탭', '✓ 등록 끝남 표시'].map((t) => FEAT.some((f) => String(f.t).startsWith(t)));
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 1));
  console.log('① 신청서 출력');
  ok(r.cartBtn && /usedstore\/wgate\.aspx\?rnx=c2bprtf1$/.test(r.cartUrl) && r.latest && r.latest.n === 1, `장바구니 탭 「🖨 방금 신청한 신청서 출력하기」 → (11/05) 중고매장 첫 화면(rnx=c2bprtf1 · 번호 없음 = 신청 내역 맨 위) 새 탭 · 기록(latest n=${r.latest && r.latest.n})`);
  ok(r.recvBtn && r.cardBtns >= 2 && /No\. 20261104000077/.test(r.recvStrip) && /2권/.test(r.recvStrip), `접수완료 탭 맨 위 🖨 칸: 접수 번호·권수 + 단추 · 카드마다 단추(${r.cardBtns})`);
  ok(/usedstore\/wgate\.aspx\?rnx=c2bprtf1&c2bno=20261104000077$/.test(r.recvUrl) && r.prt1 && r.prt1.n === 1 && r.prt1.no === '20261104000077' && r.prtLog >= 2 && /✓1/.test(r.recvBtnTxt), `(11/05) 중고매장 첫 화면 + 접수 번호(rnx=c2bprtf1&c2bno=…)로 엶 · 누른 기록 prt(${r.prt1 && r.prt1.n}번 · log ${r.prtLog}) · 단추 옆 ✓1`);
  ok(r.guide && r.feat[1], '📖 설명서(flow-print)·🔍 기능 찾기에 있음');
  console.log('② 등록 끝남 표시');
  ok(r.devMine[0] === false && r.devMine[1] === true && r.devMine[2] === true, `맡긴 기기 판별: 다른 기기 아님 · 이 기기 맞음 · (예전 작업대 판별은 다른 기기도 '내 것' = ${r.devMine[2]} — 그래서 떴던 것)`);
  ok(r.otherDev.fx === 0 && r.otherDev.toast === 0, `다른 기기가 맡은 등록이 끝나도 이 기기(🏷 알라딘 매입 화면)에 창·알림 없음 (창 ${r.otherDev.fx} · 알림 ${r.otherDev.toast})`);
  ok(r.mineOtherScreen.fx === 0 && r.mineOtherScreen.toast === 1, `이 기기가 맡았어도 다른 화면이면 가로막는 창 없이 작은 알림 한 줄 (창 ${r.mineOtherScreen.fx} · 알림 ${r.mineOtherScreen.toast})`);
  ok(r.mineReg.fx === 1, '이 기기 + 📥 등록 화면이면 예전처럼 끝남 창');
  ok(r.autoToastGuard && r.failGuard && r.feat[3], '받침 자동 판매중지 알림 = 🏷 알라딘 매입 화면에서만 · 대량 등록 멈춤 알림 = 맡긴 기기만 · 기능 찾기');
  console.log('④ PC 부재 알림');
  ok(r.def[0] === false && r.def[1] === true && r.def[2] === true, '기본: MJ-MAIN 끔 · HOME·JS-MAIN 켬');
  ok(!/MJ-MAIN/.test(r.band1) && /HOME/.test(r.band1) && r.list1.join() === 'HOME', `처음: 띠·🖥 기기 상태에 MJ-MAIN 빠짐(HOME만: ${r.list1.join()})`);
  ok(/🔕 PC 부재 알림/.test(r.setHtml) && r.chipMJ === false && r.chipHOME === true, '⚙ 설정 ① 🔕 PC 부재 알림 칩 — MJ-MAIN 꺼짐 · HOME 켜짐');
  ok(r.absH.HOME && r.absH.HOME.on === false && !/HOME/.test(r.band2) && !r.list2.includes('HOME'), 'HOME 칩을 끄면 logger_watch.absAlert.HOME = 끔(모든 기기) · 띠·기기 상태에서 빠짐');
  ok(r.absM && r.absM.on === true && /MJ-MAIN/.test(r.band3), 'MJ-MAIN을 다시 켜면 띠에 다시 나옴');
  ok(/HOME/.test(r.mgr) && /🔕/.test(r.mgr) && /신호/.test(r.mgr), '관리도구 늘 켜 둘 PC 칸 — 상태(신호)는 그대로 + 🔕 표시');
  ok(r.feat[0], '🔍 기능 찾기에 🔕 PC 부재 알림');
});
// ── ③ 수동 일괄 — 화면 코드에서 합계 셈을 떼어 탭마다 (화면을 만들지 않고 같은 함수)
{ const src = fs.readFileSync([path.join(__dirname, '../app.html'), path.join(__dirname, '../../src/app.html'), path.join(__dirname, '../src/app.html')].find((p) => fs.existsSync(p)), 'utf8');
  const a = src.indexOf("    if (tk === 'ok') return [l.price, ev != null ? ev : x.target ?? l.price];"); /* (11/04) 조건 이미 부합도 고친 값 먼저 */ const b = src.indexOf('  const sumLive = () =>');
  const v0 = src.lastIndexOf('  const valOf = (tk, i) =>', a); ok(a > 0 && b > a && v0 > 0, '수동 일괄 합계 셈 자리를 찾음');
  if (a > 0 && b > a) { const code = src.slice(v0, b);
    const R = [{ l: { price: 10000 }, target: 9000, k: 'a' }, { l: { price: 8000 }, target: 8500, k: 'b' }, { l: { price: 7000 }, target: 7000, k: 'c' }, { l: { price: 6000 }, target: null, k: 'd' }, { l: { price: 5000 }, target: 4800, k: 'e' }, { l: { price: 9000 }, target: 8800, k: 'f' }];
    const st = { picks: { b: { price: 8200 } }, decided: { a: { from: 10000, price: 9300 }, f: { from: 9000, price: 9500 } } };
    const tabs = { sel: [4], pick: [1], done: [0], ok: [2], keep: [3], bb: [], lot: [], gone: [5, 4] };
    const won = (n) => Math.round(n).toLocaleString('ko-KR') + '원'; const num = (n) => Math.round(n).toLocaleString('ko-KR'); const esc = (x) => String(x);
    const F = new Function('R', 'st', 'tabs', 'won', 'num', 'esc', 'T', 'L', `const keyOf = (x) => x.k; const BEi = {}; const LIVE = {}; const lotP = (x) => x.target; const res = { querySelector: () => null };\n${code}\nreturn { sumTab, sumHtml, tabSum, sumTip, SUMT };`);
    const one = (T) => F(R, st, tabs, won, num, esc, T, tabs[T]);
    const X = one('done'); const q = (t) => X.sumTab(t); const html = (T) => one(T).sumHtml().replace(/<[^>]+>/g, ' ');
    ok(X.SUMT.length === 8 && ['sel', 'pick', 'done', 'ok', 'keep', 'bb', 'lot', 'gone'].every((t) => X.SUMT.includes(t)), '모든 탭(8개)이 합계 대상');
    ok(q('sel').d === -200 && q('pick').d === 200 && q('done').d === -700 && q('ok').d === 0 && q('keep').b === 6000 && q('keep').d === 0, `탭마다 차이: 선택 대기 −200 · 결정 대기 +200 · 확정 −700 · 조건 부합 0 · 추천 못 함 전체 6,000원(±0)`);
    ok(q('gone').d === 300 && q('gone').fd === 500 && q('gone').od === -200 && q('gone').fn === 1, `조건 밖: 확정한 것 +500(얻은) · 안 한 것 −200(잃는) · 합 +300`);
    ok(/잃은 판매가/.test(html('done')) && /잃는 판매가/.test(html('sel')) && /얻는 판매가/.test(html('pick')) && /얻은 \+500원/.test(html('gone')) && /잃는 −200원/.test(html('gone')), "확정 = '잃은/얻은' · 아직 = '잃는/얻는' · 조건 밖은 둘로 나눠");
    ok(/이 탭 전체 금액/.test(html('keep')) && /6,000원/.test(html('keep')) && /어떻게 셈했나/.test(html('ok')), '추천 못 함·조건 부합 탭에도 전체 금액 칸 + ⓘ 어떻게 셈했나');
    ok(/수량은 곱하지 않음/.test(one('sel').sumTip('sel')) && /title=/.test(one('sel').tabSum('sel')), '툴팁: 셈 방법(상품마다 판매가 한 번 · 수량 곱하지 않음) · 탭 이름 옆 숫자에도'); } }
// ── ① 수집기 신청서 출력 도우미 (시작 코드) — 가짜 알라딘 화면
if (!BOOT) ok(false, '시작 코드(readnow-pc-boot.js)에 신청서 출력 도우미가 없음 — split.js 다시'); else { const bs = fs.readFileSync(BOOT, 'utf8'); const i0 = bs.indexOf('🖨 알라딘 팔기 신청서 출력 도우미'); const s0 = bs.lastIndexOf('/*', i0); const e0 = bs.indexOf('/* (1.72.0) 화면 문', i0); const code = bs.slice(s0, e0);
  const { chromium } = require('playwright'); const br = await chromium.launch(); const ctx = await br.newContext();
  const pages = { detail: '<html><body><table><tr><th>신청일</th><td>2026-11-04</td></tr></table><a href="#" onclick="window.__o=window.open(\'about:blank\',\'p\');window.__clicked=(window.__clicked||0)+1;return false;"><img src="x.gif" alt="신청서 출력하기"></a></body></html>',
    none: '<html><body><p>접수 내용</p><a href="#">목록</a></body></html>', list: '<html><body><a href="/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=20261104000099">20261104000099</a><a href="/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=20261101000001">old</a></body></html>' };
  await ctx.route(/aladin\.co\.kr/, (rt) => { const u = rt.request().url(); const k = /C2BOrderList/.test(u) ? 'list' : /c2bsalesno=NOBTN/.test(u) ? 'none' : 'detail'; rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: pages[k] }); });
  await ctx.addInitScript({ content: `window.GM_setValue = (k, v) => { window.__gm = window.__gm || {}; window.__gm[k] = v; }; document.addEventListener('DOMContentLoaded', () => { (function () { ${code} })(); });` });
  const run = async (url, popup) => { const pg = await ctx.newPage(); if (!popup) await pg.addInitScript(() => { const o = window.open; window.open = function () { return null; }; }); else await pg.addInitScript(() => { window.open = function () { return {}; }; }); await pg.goto(url); await pg.waitForTimeout(2600); return pg; };
  const p1 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=1&rnx=c2bprt01', true); const r1 = await p1.evaluate(() => ({ c: window.__clicked || 0, band: (document.getElementById('rn-c2bprt') || {}).innerText || '', gm: (window.__gm || {})['rn-c2bprt-last'] || null }));
  ok(r1.c === 1, `접수 상세: 그림 글 '신청서 출력하기' 단추를 찾아 한 번 누름(${r1.c}) — 그 뒤 새 창 인쇄·기록은 tSMALL2`);
  const p2 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=2&rnx=c2bprt01', false); const r2 = await p2.evaluate(() => ({ c: window.__clicked || 0, band: (document.getElementById('rn-c2bprt') || {}).innerText || '', btns: [...document.querySelectorAll('#rn-c2bprt button')].map((b) => b.textContent) }));
  ok(/막았습니다/.test(r2.band) && r2.btns.includes('🖨 신청서 출력하기'), '브라우저가 새 창을 막으면 큰 단추(사람이 한 번 누르면 열림)');
  await p2.evaluate(() => { window.open = function () { return {}; }; }); await p2.click('#rn-c2bprt button'); await p2.waitForTimeout(1800); const r2b = await p2.evaluate(() => ({ c: window.__clicked || 0, band: (document.getElementById('rn-c2bprt') || {}).innerText || '' })); ok(r2b.c === 2, '큰 단추를 누르면 알라딘 단추를 다시 누름');
  const p3 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=NOBTN&rnx=c2bprt01', true); await p3.waitForTimeout(8000); const r3 = await p3.evaluate(() => ({ band: (document.getElementById('rn-c2bprt') || {}).innerText || '', btns: [...document.querySelectorAll('#rn-c2bprt button')].map((b) => b.textContent) }));
  ok(/못 찾음/.test(r3.band) && r3.btns.includes('🖨 인쇄'), "단추가 없는 화면 = 큰 '🖨 인쇄' 안내(11/04 — 누르면 window.print)");
  const p4 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=C2BOrderList&page=1&rnx=c2bprtl1', true); await p4.waitForTimeout(2500); const u4 = p4.url(); const r4 = await p4.evaluate(() => window.__clicked || 0);
  ok(/c2bsalesno=20261104000099&rnx=c2bprt01/.test(u4) && r4 === 1, '신청 내역 목록 → 가장 새 접수 상세로 옮겨 단추를 누름');
  const p5 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=1', true); const r5 = await p5.evaluate(() => ({ c: window.__clicked || 0, band: !!document.getElementById('rn-c2bprt') })); ok(r5.c === 0 && !r5.band, 'rnx 표시가 없으면(사람이 그냥 연 화면) 아무것도 안 함');
  const btxt = bs.slice(0, e0); ok(/return false; \}\s*$/.test(code.trim().slice(-40)) || /\}\)\(\); return false; \}/.test(code), '도우미 화면에서는 수집기 본체를 켜지 않음(return false)');
  await br.close(); }
// ── ④ 클라우드 지킴이 — 부재 알림을 끈 PC는 푸시 안 함
if (CLOUD) { const cs = fs.readFileSync(CLOUD, 'utf8'); const i = cs.indexOf('async function loggerWatchTick()'); const j = cs.indexOf('\n/* (0.17.0)', i); const fnSrc = cs.slice(i, j);
  const docs = {}; const C = (c) => ({ doc: (id) => ({ get: async () => ({ data: () => (docs[c + '/' + id] ? JSON.parse(JSON.stringify(docs[c + '/' + id])) : undefined) }), set: async (v) => { docs[c + '/' + id] = { ...(docs[c + '/' + id] || {}), ...v }; } }) });
  const sent = []; const now = Date.now();
  docs['prd_jobs/pcBeat'] = { pcs: { 'MJ-MAIN': { atMs: now - 30 * 60e3 }, HOME: { atMs: now - 30 * 60e3 }, 'JS-MAIN': { atMs: now - 30 * 60e3 } } }; docs['app_settings/logger_watch'] = { alwaysOn: ['HOME', 'MJ-MAIN', 'JS-MAIN'], absAlert: { 'JS-MAIN': { on: false } } };
  const tick = new Function('C', 'webpush', 'kstDay', 'nowIso', 'pushSend', fnSrc + '\nreturn loggerWatchTick;')(C, {}, () => '2026-11-04', () => new Date().toISOString(), async (n, p) => { sent.push(p.title); return {}; });
  const tr = await tick(); const st = docs['app_settings/logger_watch'].st || {}; if (process.env.V) console.log('cloud', JSON.stringify({ tr, st, sent }));
  ok(sent.length === 1 && /HOME/.test(sent[0]) && st['MJ-MAIN'] && st['MJ-MAIN'].k === 'down' && st['MJ-MAIN'].muted && st['JS-MAIN'].muted && !st.HOME.muted, `클라우드: 신호 없는 PC 셋 중 알림 켠 HOME만 푸시(${sent.join(' / ')}) · MJ-MAIN(기본 끔)·JS-MAIN(끔)은 상태만 적음(muted)`);
  docs['prd_jobs/pcBeat'].pcs['MJ-MAIN'].atMs = Date.now(); docs['app_settings/logger_watch'].checkedAt = null; sent.length = 0; await tick(); ok(!sent.some((t) => /MJ-MAIN/.test(t)), "끈 PC가 돌아와도 '다시 정상' 푸시 없음"); }
else ok(false, 'cloud/index.js를 못 찾음');
console.log(bad ? `❌ tSMALL 실패 ${bad}` : '✓ tSMALL 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
