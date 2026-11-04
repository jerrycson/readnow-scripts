// tSMALL2 — 정범님 11/04 지시 (작은 일 둘째 묶음)
//  ① 🔎 소재불명 기본 = 판매중 그대로 · 옵션 = 일시판매중지 → tLOST·tMAP이 맡음(여기서는 안 봄)
//  ② 🖨 알라딘 신청서 출력 — 수집기 시작 코드(readnow-pc-boot.js)의 도우미: 단추 후보 진단(가림) · 새 창(팝업)을 잡아 인쇄 · 팝업이 막히면 같은 탭으로 옮겨 인쇄 · 함수 직접 부름 · 다 안 되면 큰 🖨 인쇄
//     + 웹앱이 같은 PC 수집기가 건넨 결과를 기록(prt[접수].pc · prd_system/c2bprt_diag) · 단추 옆 🖥 줄 · 받았다고 답(ack)
//  ③ 🧮 수동 일괄 '조건 이미 부합' 탭 — 고르기(하나씩·전체)·고른 수·금액 합계 · 고른 것 가격(같은 값·−5%·추천가로·카드 입력칸) · 바로 확정(결정 대기 실행과 같은 batchExec)
// 실행: cd pw && RN_PORT=<포트> node tSMALL2.js
let bad = 0, ran = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const H = require('./harness.js');
const BOOT = [process.env.RN_BOOT, path.join(__dirname, '../out/readnow-pc-boot.js'), path.join(__dirname, '../readnow-pc-boot.js'), path.join(__dirname, '../../readnow-pc-boot.js')].filter(Boolean).find((p) => fs.existsSync(p) && /rnC2bPrint/.test(fs.readFileSync(p, 'utf8')));
(async () => {
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; const T0 = window.toast; const TL = []; window.toast = (m, e, ms) => { TL.push(String(m)); return T0 && T0(m, e, ms); };
    // ── ② 웹앱: 수집기 결과 받기
    window.open = () => ({}); await bhPrint(''); await W(300); const acks = []; window.addEventListener('message', (e) => { if (e.data && e.data.__rnC2bPrtAck) acks.push(e.data.__rnC2bPrtAck); });
    const rec = { id: 't1', at: Date.now(), no: '20261104000077', found: true, how: 'popup', printed: true, nCand: 2, url: 'https://www.aladin.co.kr/account/wc2binfo.aspx?c2bsalesno=20261104000077', cands: [{ tag: 'A', txt: '신청서출력', oc: "fnPrint('010-****-****')", href: '#', tgt: null, alt: '' }, { tag: 'IMG', txt: '', oc: '', href: '', alt: '인쇄' }] };
    window.postMessage({ __rnC2bPrt: 1, rec }, location.origin); await W(900); window.postMessage({ __rnC2bPrt: 1, rec }, location.origin); await W(500); /* 같은 id 두 번 → 한 번만 기록 */
    const BB = (FS.prd_system || {}).buyback || {}; const D = (FS.prd_system || {}).c2bprt_diag || {};
    out.pc = ((BB.prt || {})['20261104000077'] || {}).pc || null; out.latest = ((BB.prt || {}).latest || {}).pc || null; out.diag = { n: ((D.last || {}).cands || []).length, oc: ((D.last || {}).cands || [])[0] ? D.last.cands[0].oc : '', hist: (D.hist || []).length }; out.acks = acks.join(',');
    out.logs = (BB.log || []).filter((x) => x.act === 'printPc').length; out.btn = bhPrtBtn('20261104000077').replace(/<[^>]+>/g, ' ');
    window.postMessage({ __rnC2bPrt: 1, rec: { id: 't2', at: Date.now(), no: '20261104000078', found: false, how: 'nobtn', nCand: 0, cands: [] } }, location.origin); await W(900); out.warn = bhPrtBtn('20261104000078');
    // ── ③ 수동 일괄 '조건 이미 부합'
    const now = new Date().toISOString(); await db.collection('prd_system').doc('pricing').set({ watchVer: '0.9.0', watchTab: 't', watchPc: 'TEST', watchBeat: now }, { merge: true }); S.prCfg = { ...(S.prCfg || {}), watchVer: '0.9.0', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: {} };
    const mk = (u, price, tgt) => { const l = { id: 'aladin_' + u, usedCode: u, title: '부합 책 ' + u, price, listingId: 'L' + u, status: '판매중', active: true, sku: 'BLKCMN', grade: '상', bookId: null, lastSeenAt: now }; return { l, target: tgt, reasons: ['시험'], page1: [], out: false }; };
    S.batchRes = [mk('U91', 9000, 9000), mk('U92', 8000, 8000), mk('U93', 7000, 7000), mk('U94', 6000, 5000)]; S.batchId = 'bOK'; S.batchSt = { start: {}, picks: {}, decided: {} }; S.batchMeta = {}; S.prBatches = [{ id: 'bOK', name: '부합 시험' }]; S.batchT = 'ok'; S._bFresh = true;
    const sh = document.getElementById('sheet'); const open = async () => { openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '부합 시험' }))); await W(500); }; await open();
    const res = () => sh.querySelector('#b_res'); const q = (s) => res().querySelector(s); const sum = () => (q('#b_sum') || {}).innerText || ''; const bar = () => ((q('#b_okin') || {}).innerText || '').replace(/\s+/g, ' ');
    out.ok0 = { cards: res().querySelectorAll('[data-boksel]').length, bar: !!q('#b_okbar'), pin: res().querySelectorAll('.card.pq [data-bpin]').length, tab: ((sh.querySelector('[data-btab="ok"]') || {}).innerText || '').replace(/\s+/g, ' '), exDis: q('#b_okexec') && q('#b_okexec').disabled };
    q('#b_okall').click(); await W(300); out.all = { n: S.batchOkSel.bOK.size, bar: bar(), checked: res().querySelectorAll('[data-boksel]:checked').length };
    q('#b_okv').value = '7500'; q('#b_okset').click(); await W(300); out.same = { pins: [...res().querySelectorAll('.card.pq [data-bpin]')].map((x) => x.value).join(','), sum: sum().replace(/\s+/g, ' ').slice(0, 140), bar: bar(), tabSum: ((sh.querySelector('[data-bsumt="ok"]') || {}).textContent || '') };
    const cb3 = res().querySelector('[data-boksel="aladin_U93"]'); cb3.checked = false; cb3.onchange(); await W(100); out.one = { n: S.batchOkSel.bOK.size, bar: bar() };
    q('#b_okdn').click(); await W(300); out.dn = [...res().querySelectorAll('.card.pq [data-bpin]')].map((x) => x.value).join(',');
    const pin3 = res().querySelector('.card[data-mk="aladin_U93"] [data-bpin]'); pin3.value = '6900'; pin3.oninput(); await W(100); out.pin3 = { sum: sum().replace(/\s+/g, ' ').slice(0, 140) };
    // 바로 확정 — 고른 U91·U92만(결정 대기 실행과 같은 batchExec)
    const p1 = +res().querySelector('.card[data-mk="aladin_U91"] [data-bpin]').value; q('#b_okexec').click(); for (let i = 0; i < 30 && !((FS.prd_price_decisions || {}).aladin_U92); i++) await W(200); await W(600);
    const PD = FS.prd_price_decisions || {}; out.exec = { u1: PD.aladin_U91 ? [PD.aladin_U91.approvalState, PD.aladin_U91.approval.decision, PD.aladin_U91.approval.price, PD.aladin_U91.approval.batchId].join('|') : null, u2: !!PD.aladin_U92, u3: !!PD.aladin_U93, p1, dec: Object.keys(S.batchSt.decided || {}).sort().join(','), rev: Object.keys(FS.prd_price_reviews || {}).length, toast: TL.filter((t) => /확정/.test(t)).slice(-2).join(' / ') };
    // 가격을 안 바꾼 것만 고르면 확정하지 않음
    S.batchT = 'ok'; await open(); const cbs = res().querySelectorAll('[data-boksel]'); out.after = { cards: cbs.length }; const c3 = res().querySelector('[data-boksel="aladin_U93"]'); if (c3) { c3.checked = true; c3.onchange(); } q('#b_okrst').click(); await W(300); TL.length = 0; const n0 = Object.keys(FS.prd_price_decisions || {}).length; q('#b_okexec').click(); await W(800); out.same0 = { n: Object.keys(FS.prd_price_decisions || {}).length - n0, toast: TL.join(' / ') };
    out.guide = { feat: FEAT.some((f) => /조건 이미 부합 탭에서 골라/.test(f.t)), pg: JSON.stringify(pgdDefs().batch).includes('#b_okexec') };
    return out; });
  ran++; if (process.env.V) console.log(JSON.stringify(r, null, 1));
  console.log('② 웹앱 — 신청서 출력 결과 기록');
  ok(r.pc && r.pc.how === 'popup' && r.pc.printed && r.pc.found && r.pc.nCand === 2, `수집기가 건넨 결과 → 알라딘 매입 문서 prt[접수].pc (${r.pc && r.pc.how})`);
  ok(r.latest && r.latest.how === 'popup', "방금 누른 '가장 새 접수'(latest) 단추에도 같은 결과");
  ok(r.diag.n === 2 && /010-\*\*\*\*-\*\*\*\*/.test(r.diag.oc) && r.diag.hist === 1 && r.logs === 1, `진단 문서 c2bprt_diag — 단추 후보 ${r.diag.n}개(가린 글 그대로) · 같은 결과 두 번 와도 한 번만(기록 ${r.logs})`);
  ok(r.acks.split(',').includes('t1'), `받았다고 답(ack ${r.acks}) → 수집기가 다시 건네지 않음`);
  ok(/🖥/.test(r.btn) && /인쇄 창을 띄움/.test(r.btn), `단추 옆 결과 줄: ${r.btn.replace(/\s+/g, ' ').trim().slice(0, 90)}`);
  ok(/⚠ 신청서 출력 단추를 못 찾음/.test(r.warn) && /#B0322A/.test(r.warn), '못 띄웠으면 ⚠ 빨간 글');
  console.log("③ 수동 일괄 — '조건 이미 부합' 고르기·가격·바로 확정");
  ok(r.ok0.cards === 3 && r.ok0.bar && r.ok0.pin === 3 && r.ok0.exDis === true, `조건 이미 부합 ${r.ok0.cards}개 — 카드마다 고르기 칸·가격 칸 · 위 ☑ 칸 · 고른 것 없으면 확정 단추 꺼짐 (${r.ok0.tab})`);
  ok(r.all.n === 3 && r.all.checked === 3 && /고른 3개/.test(r.all.bar) && /24,000원/.test(r.all.bar), `전체 고르기 → ${r.all.bar.slice(0, 80)}`);
  ok(r.same.pins === '7500,7500,7500' && /22,500원/.test(r.same.sum) && /−1,500원/.test(r.same.sum) && /−1,500원/.test(r.same.bar) && /−1,500원/.test(r.same.tabSum), `같은 값 7,500원 → 카드 ${r.same.pins} · 탭 합계 ${r.same.sum.slice(0, 70)} · 탭 이름 옆 ${r.same.tabSum}`);
  ok(r.one.n === 2 && /고른 2개/.test(r.one.bar), `하나 풀기 → ${r.one.bar.slice(0, 60)}`);
  ok(/^7[0-4]\d\d,7[0-4]\d\d,7500$/.test(r.dn), `고른 것만 −5% → ${r.dn} (안 고른 것은 그대로)`);
  ok(/잃는/.test(r.pin3.sum), `카드 입력칸으로 하나만 고침 → 탭 합계 바로 다시 셈 ${r.pin3.sum.slice(0, 80)}`);
  ok(r.exec.u1 === `manual|batch|${r.exec.p1}|bOK` && r.exec.u2 && !r.exec.u3 && r.exec.dec === 'aladin_U91,aladin_U92' && r.exec.rev >= 2, `바로 확정 → 결정 대기 실행과 같은 길(prd_price_decisions ${r.exec.u1} · 그룹 확정 ${r.exec.dec} · 기록 ${r.exec.rev}) · 안 고른 것은 그대로`);
  ok(r.after.cards === 1 && r.same0.n === 0 && /가격이 지금 판매가와 같음/.test(r.same0.toast), `확정한 것은 탭에서 빠짐(남은 ${r.after.cards}) · 가격을 안 바꾼 것만 고르면 확정 안 함`);
  ok(r.guide.feat && r.guide.pg, '🔍 기능 찾기 · 📖 화면 설명서(수동 일괄)에 새 단추');
});
// ── ② 수집기 시작 코드 — 가짜 알라딘 화면
if (!BOOT) ok(false, '시작 코드(readnow-pc-boot.js)에 신청서 출력 도우미가 없음 — split.js 다시'); else { const bs = fs.readFileSync(BOOT, 'utf8'); const i0 = bs.indexOf('🖨 알라딘 팔기 신청서 출력 도우미'); const s0 = bs.lastIndexOf('/*', i0); const e0 = bs.indexOf('/* (1.72.0) 화면 문', i0); const code = bs.slice(s0, e0);
  const { chromium } = require('playwright'); const br = await chromium.launch(); const ctx = await br.newContext(); console.log('② 수집기 — 신청서 출력 도우미');
  const ST = '<table><tr><th>신청일</th><td>2026-11-04</td></tr></table>';
  const pages = { pop: `<html><body>${ST}<a href="#" onclick="window.open('/account/c2bform.aspx?no=1','p','width=800');return false;"><img src="x.gif" alt="신청서 출력하기"></a><a href="#" onclick="call('010-0000-0000')">고객센터 출력 안내</a></body></html>`,
    self: `<html><body>${ST}<button onclick="window.print()">신청서 인쇄</button></body></html>`,
    fn: `<html><body>${ST}<a href="javascript:void(0)" onclick="fnC2bPrint('77')">신청서 출력</a><script>window.fnC2bPrint = function (n) { window.__fn = n; window.print(); }; window.addEventListener('click', function (e) { if (!e.isTrusted) e.stopImmediatePropagation(); }, true);</script></body></html>`,
    none: `<html><body><p>접수 내용</p><a href="#">목록</a></body></html>`, form: `<html><body><h1>매입 신청서</h1><p>책 3권</p></body></html>`,
    autop: `<html><body>${ST}<a href="#" onclick="window.open('/account/c2bform.aspx?auto=1','p');return false;">신청서 출력</a></body></html>`, formAuto: `<html><body><h1>매입 신청서</h1><script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });</script></body></html>` };
  await ctx.route(/aladin\.co\.kr/, (rt) => { const u = rt.request().url(); const k = /c2bform\.aspx\?auto/.test(u) ? 'formAuto' : /c2bform/.test(u) ? 'form' : /c2bsalesno=SELF/.test(u) ? 'self' : /c2bsalesno=FN/.test(u) ? 'fn' : /c2bsalesno=NOBTN/.test(u) ? 'none' : /c2bsalesno=AUTO/.test(u) ? 'autop' : 'pop'; rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: pages[k] }); });
  await ctx.addInitScript({ content: `window.__pr = 0; const __op = window.print; window.print = function () { window.__pr++; }; window.GM_setValue = (k, v) => { window.__gm = window.__gm || {}; window.__gm[k] = v; }; if (/[?&]rnx=c2bprt/.test(location.search)) document.addEventListener('DOMContentLoaded', () => { (function () { ${code} })(); });` });
  const run = async (url, block, wait) => { const pg = await ctx.newPage(); if (block) await pg.addInitScript(() => { window.open = function () { return null; }; }); await pg.goto(url); await pg.waitForTimeout(wait || 4500); return pg; };
  const gm = (pg) => pg.evaluate(() => (window.__gm || {})['rn-c2bprt-last'] || null); const band = (pg) => pg.evaluate(() => (document.getElementById('rn-c2bprt') || {}).innerText || '');
  // 팝업: 새 창을 잡아 다 뜬 뒤 그 창에서 print()
  const pops = []; ctx.on('page', (x) => pops.push(x)); const p1 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=1&rnx=c2bprt01', false, 9000); const g1 = await gm(p1); const pp = pops.find((x) => /c2bform/.test(x.url())); const pr1 = pp ? await pp.evaluate(() => window.__pr) : -1;
  ok(g1 && g1.how === 'popup' && g1.printed && pr1 === 1 && /인쇄 창을 띄웠습니다/.test(await band(p1)), `알라딘 단추가 새 창으로 신청서를 열면 → 그 창이 다 뜬 뒤 print() 한 번(${pr1}) · 기록 ${g1 && g1.how}`);
  ok(g1 && g1.nCand >= 2 && g1.cands.some((c) => /신청서 출력하기/.test(c.alt + c.txt)) && g1.cands.every((c) => !/0000-0000/.test(JSON.stringify(c))) && JSON.stringify(g1.cands).includes('010-****-****'), `단추 후보 ${g1 && g1.nCand}개 진단(글자·onclick·주소) · 전화번호는 가림`);
  // 팝업이 스스로 인쇄하면 두 번 띄우지 않음
  pops.length = 0; const pA = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=AUTO&rnx=c2bprt01', false, 9000); const gA = await gm(pA); const ppA = pops.find((x) => /c2bform/.test(x.url())); const prA = ppA ? await ppA.evaluate(() => window.__pr) : -1;
  ok(gA && gA.how === 'popup-self' && prA === 1, `신청서 창이 스스로 인쇄 창을 띄우면 우리는 또 부르지 않음(인쇄 ${prA}번 · ${gA && gA.how})`);
  // 팝업이 막힘 → 같은 탭에서 신청서 주소(rnx=c2bprtp1)로 옮겨 인쇄
  const p2 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=2&rnx=c2bprt01', true, 7000); const u2 = p2.url(); const pr2 = await p2.evaluate(() => window.__pr); const g2 = await gm(p2);
  ok(/c2bform\.aspx\?no=1&rnx=c2bprtp1/.test(u2) && pr2 === 1 && g2 && g2.how === 'nav', `팝업이 막히면 같은 탭에서 신청서로 옮겨 인쇄(${u2.replace(/^.*\/account\//, '')} · 인쇄 ${pr2} · ${g2 && g2.how})`);
  // 단추가 바로 window.print()
  const p3 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=SELF&rnx=c2bprt01'); const g3 = await gm(p3); const pr3 = await p3.evaluate(() => window.__pr);
  ok(g3 && g3.how === 'click-print' && pr3 === 1, `알라딘 단추가 바로 인쇄 창 → ${g3 && g3.how} (${pr3})`);
  // 누름이 먹지 않으면 onclick 함수를 직접 부름
  const p4 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=FN&rnx=c2bprt01', false, 6000); const g4 = await gm(p4); const r4 = await p4.evaluate(() => ({ fn: window.__fn, pr: window.__pr }));
  ok(g4 && g4.how === 'fn-print' && g4.fn === 'fnC2bPrint' && r4.fn === '77' && r4.pr === 1, `눌러도 아무 일이 없으면 onclick 함수(fnC2bPrint('77'))를 직접 부름 → ${g4 && g4.how}`);
  // 단추가 없음 → 큰 🖨 인쇄(사람이 누름)
  const p5 = await run('https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=NOBTN&rnx=c2bprt01', false, 11500); const b5 = await band(p5); const g5 = await gm(p5); await p5.click('#rn-c2bprt button'); await p5.waitForTimeout(300); const pr5 = await p5.evaluate(() => window.__pr); const g5b = await gm(p5);
  ok(/못 찾음/.test(b5) && g5 && g5.how === 'nobtn' && pr5 === 1 && g5b.how === 'manual', `단추가 없으면 큰 '🖨 인쇄' → 누르면 window.print() (${g5 && g5.how} → ${g5b && g5b.how})`);
  // 머리(==UserScript==) 그대로 · 시작 코드 안에서만
  const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.user.js'), path.join(__dirname, '../../src/readnow-collector.src.js')].find((x) => fs.existsSync(x)), 'utf8'); const head = src.slice(0, src.indexOf('==/UserScript==')); ok(!/c2bprt/.test(head) && /@include\s+\/\^https\?:/.test(head), '수집기 머리에 손대지 않음(@include rnx 그대로)');
  ok(/rn-c2bprt-last/.test(bs) && /__rnC2bPrtAck/.test(bs) && /jerrycson\.github\.io/.test(bs), '시작 코드: 같은 PC 웹앱 화면에 결과를 건네는 다리(받았다는 답이 오면 그침)');
  await br.close(); ran++; }
if (ran < 2) { bad++; console.log('  ❌ 시험 도중 멈춤'); } console.log(bad ? `❌ tSMALL2 실패 ${bad}` : '✅ tSMALL2 모두 통과'); })();
