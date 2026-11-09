// tCLAR1 — 정범님 11/09 밤 '🛡 추적 차단, 내가 따로 손댈 일 없이 적용되는 거야?' → 수집기가 알라딘 화면마다 Microsoft Clarity(방문 녹화)를 손 0으로 막음(rnClarityGuard · 머리 그대로)
//  가짜 알라딘 화면(시험 안에서만) — 알라딘처럼 화면 끝에서 늦게(구글 태그 관리자 흉내 300ms) Clarity 태그 조각 → 태그 파일 → 본체(clarity.js)를 차례로 받음
//  본체: clarity-js 0.8.75 원본 파일이 있으면 그것(RN_CLARITY_JS 또는 npm pack clarity-js@0.8.75 푼 자리) · 없으면 원문 queue.ts process와 같은 짧은 흉내
//  ① 수집기가 먼저 깨어나면(document-idle 흉내 = 화면 읽기 끝난 직후) 본체가 시작하지 않음(v 표 · 'CL001') · 보내기(collect) 0
//  ② 본체가 먼저 돌고 있으면 clarity('stop')으로 바로 멈춘 뒤 표를 덮음 ③ 같은 출처 틀(iframe)도 문서가 바뀔 때마다 막음
//  ④ 로거 크롬(__rnPubChrome)·끄기(rn-clarity-off)는 손대지 않음 ⑤ 1.89.235 멈춤 함수(clarityStop)는 우리 표를 Clarity로 보지 않음 ⑥ 비교: 막지 않으면 실제로 시작함
//  사용: node tCLAR1.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } }
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a0 = src.indexOf('(function rnClarityGuard()'); const b0 = src.indexOf('\n})();', a0); if (a0 < 0 || b0 < 0) { console.log('❌ tCLAR1 — rnClarityGuard 덩어리를 못 찾음'); process.exit(0); }
const GUARD = src.slice(a0, b0 + 6);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 600))); if (!c) bad++; };
const REAL = [process.env.RN_CLARITY_JS, ...['clar/x', 'clj'].map((d) => path.join('/tmp/claude-0/-home-user/c0417e7a-f1d3-5230-91e7-c394cf2b63b1/scratchpad', d, 'package/build/clarity.min.js'))].find((f) => f && fs.existsSync(f));
/* 원본이 없을 때 흉내 — clarity-js 0.8.75 queue.ts process 그대로(v가 있으면 경고만 · 아니면 v를 달고 줄을 돌림 · start면 보내기) */
const MIMIC = `(function(){var w=window;if(w.clarity&&w.clarity.v){return console.warn("Error CL001: Multiple Clarity tags detected.")}var q=w.clarity?(w.clarity.q||[]):[];var on=false;w.clarity=function(m,c){if(m==='start'){on=true;var x=new XMLHttpRequest();x.open('POST',(c&&c.upload)||'https://x.clarity.ms/collect');x.send('rec');}if(m==='stop'){on=false;w.__STOPPED=1;}};w.clarity.v='0.8.75';while(q.length)w.clarity.apply(null,q.shift());})();`;
const CLJS = REAL ? fs.readFileSync(REAL, 'utf8') : MIMIC;
/* 태그 파일 흉내 — 일부러 '이미 있음'을 보지 않고 늘 본체를 넣는 가장 나쁜 꼴(실제 태그가 v를 보든 말든 본체 쪽에서 막히는지) */
const TAG = `(function(){var s=document.createElement('script');s.async=true;s.src='https://scripts.clarity.ms/0.8.75/clarity.js';document.head.appendChild(s);window.clarity('start',{projectId:'u5bx3exnb0',upload:'https://x.clarity.ms/collect',delay:50,lean:false,track:false,content:true});})();`;
const SNIP = (ms) => `<script>setTimeout(function(){(function(a,e,b,f,g,c,d){a[b]=a[b]||function(){(a[b].q=a[b].q||[]).push(arguments)};c=e.createElement(f);c.async=1;c.src="https://www.clarity.ms/tag/"+g;d=e.getElementsByTagName(f)[0];d.parentNode.insertBefore(c,d)})(window,document,"clarity","script","u5bx3exnb0");}, ${ms});</script>`;
const PAGE = (ms, extra) => `<!doctype html><html><head><meta charset="utf-8"><script></script></head><body><h1>샵매니저</h1><div id="x">${'<p>줄</p>'.repeat(50)}</div>${extra || ''}${SNIP(ms)}</body></html>`;

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (o) => { const ctx = await br.newContext(); const p = await ctx.newPage(); const COLLECT = []; const CON = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => CON.push(m.text()));
    await p.route('**/*', (rt) => { const u = new URL(rt.request().url());
      if (/(^|\.)clarity\.ms$/.test(u.hostname)) { if (u.hostname === 'www.clarity.ms') return rt.fulfill({ body: TAG, contentType: 'application/javascript' }); if (u.hostname === 'scripts.clarity.ms') return rt.fulfill({ body: CLJS, contentType: 'application/javascript' }); COLLECT.push(u.hostname + u.pathname); return rt.fulfill({ status: 204, body: '' }); }
      if (u.pathname === '/scm/frame1.aspx' || u.pathname === '/scm/frame2.aspx') return rt.fulfill({ body: PAGE(300), contentType: 'text/html' });
      return rt.fulfill({ body: PAGE(o.ms == null ? 300 : o.ms, o.extra), contentType: 'text/html' }); });
    await p.addInitScript((a) => { const st = a.seed || {}; window.GM_getValue = (k, d) => (k in st ? st[k] : d); if (a.pub) window.__rnPubChrome = true; }, o);
    await p.goto('https://www.aladin.co.kr/scm/worders.aspx', { waitUntil: 'domcontentloaded' });
    if (o.late) { await p.waitForFunction(() => window.clarity && window.clarity.v && !window.clarity.__rnBlk, null, { timeout: 15000 }); await p.waitForTimeout(800); await p.evaluate(() => { const c = window.clarity; window.__CALLS = []; const w2 = function () { window.__CALLS.push(arguments[0]); return c.apply(this, arguments); }; w2.v = c.v; window.clarity = w2; }); }
    if (!o.noGuard) await p.addScriptTag({ content: GUARD }); /* document-idle 흉내: 화면 읽기가 끝난 뒤 수집기가 깨어남 */
    return { p, COLLECT, CON }; };
  const st = (p) => p.evaluate(() => ({ v: window.clarity && window.clarity.v, blk: !!(window.clarity && window.clarity.__rnBlk), S: window.__rnClarityGuard || null, calls: window.__CALLS || null, fr: [...document.querySelectorAll('iframe')].map((f) => { try { const c = f.contentWindow.clarity; return { v: c && c.v, blk: !!(c && c.__rnBlk) }; } catch (e) { return { err: 1 }; } }) }));

  // ⑥ 비교: 막지 않으면 Clarity가 시작하고 보냄
  { const { p, COLLECT } = await mk({ noGuard: true }); await p.waitForTimeout(4000); const s = await st(p); ok(s.v && s.v !== 'rn-block' && !s.blk && COLLECT.length > 0, `비교(막지 않음): Clarity가 시작해 보냄 — 판 ${s.v} · 보낸 요청 ${COLLECT.length} · 본체 ${REAL ? '원본 clarity-js 0.8.75' : '흉내'}`); await p.context().close(); }
  // ① 수집기가 먼저 → 본체가 시작하지 않음
  { const { p, COLLECT, CON } = await mk({}); await p.waitForTimeout(4000); const s = await st(p);
    ok(s.blk && s.v === 'rn-block' && s.S && s.S.pre === 1 && s.S.stop === 0, `수집기가 먼저 깨어나면 'Clarity 이미 있음' 표(v)를 먼저 둠: ${JSON.stringify(s.S)}`);
    ok(!COLLECT.length && CON.some((t) => /CL001/.test(t)), `본체(clarity.js)가 와도 'CL001'만 남기고 시작 안 함 · 보내기 0: ${COLLECT.length} · ${CON.filter((t) => /CL001/.test(t)).length}`);
    await p.evaluate(() => { window.clarity = function () { window.__REPL = 1; }; }); const s2 = await st(p); ok(s2.blk, '화면 쪽 코드가 window.clarity를 덮어써도 표가 그대로(오류 없이 무시)');
    await p.context().close(); }
  // ② 본체가 먼저 돌고 있으면 → 바로 멈춤 + 표
  { const { p } = await mk({ ms: 0, late: true }); await p.waitForTimeout(1000); const s = await st(p);
    ok(s.calls && s.calls.includes('stop') && s.blk && s.S.stop === 1, `이미 돌던 Clarity는 clarity('stop')으로 바로 멈추고 표를 덮음: ${JSON.stringify({ calls: s.calls, S: s.S })}`); await p.context().close(); }
  // ③ 같은 출처 틀 — 문서가 바뀔 때마다
  { const { p, COLLECT } = await mk({}); await p.evaluate(() => { const f = document.createElement('iframe'); f.id = 'rnPrdEdit_x'; f.src = '/scm/frame1.aspx'; document.body.appendChild(f); }); await p.waitForTimeout(3000);
    const s1 = await st(p); await p.evaluate(() => { document.getElementById('rnPrdEdit_x').src = '/scm/frame2.aspx'; }); await p.waitForTimeout(3000); const s2 = await st(p);
    ok(s1.fr[0] && s1.fr[0].blk && s2.fr[0] && s2.fr[0].blk && s2.S.frPre >= 2 && !COLLECT.length, `숨은 틀(같은 출처)도 문서마다 시작 전에 막음 · 틀이 다른 화면으로 가도 다시: ${JSON.stringify({ a: s1.fr, b: s2.fr, S: s2.S, collect: COLLECT.length })}`); await p.context().close(); }
  // ④ 로거 크롬 · 끄기
  { const A = await mk({ pub: true }); const B = await mk({ seed: { 'rn-clarity-off': true } }); await A.p.waitForTimeout(4000); const [a, b] = [await st(A.p), await st(B.p)];
    ok(!a.blk && !a.S && a.v && a.v !== 'rn-block', '로거 크롬(rn-pubChrome)은 손대지 않음(로거 도우미가 이미 막음 · 약속 0)'); ok(!b.blk && !b.S, '이 PC 저장소 rn-clarity-off = true면 끔');
    await A.p.context().close(); await B.p.context().close(); }
  await br.close(); return errs; };

// ⑤ 1.89.235 멈춤 함수 · 머리 · PC 신호 · 웹앱 글
const textChk = () => { const m = src.match(/function clarityStop\(w\) \{[^\n]*?\/\* ⟦clarityStop 끝⟧ \*\//); let r = null; try { r = new Function(m[0] + '; return clarityStop;')(); } catch (e) {}
  let n = 0; const real = function () { n++; }; real.v = '0.8.75'; const blk = function () {}; blk.v = 'rn-block'; blk.__rnBlk = 1;
  ok(r && r({ clarity: blk }) === false && r({ clarity: real }) === true && n === 1, '1.89.235 clarityStop은 우리 표를 Clarity로 보지 않음(멈춤 셈이 늘지 않음)');
  const head = src.slice(0, src.indexOf('==/UserScript==')); ok(/@run-at\s+document-idle/.test(head) && !/clarity/i.test(head), '머리(@run-at document-idle 그대로 · clarity 줄 없음) 안 바꿈');
  ok(/cg: \{ on: true, pre: globalThis\.__rnClarityGuard\.pre/.test(src), 'PC 신호 pcBeat.blk.cg에 막은 셈을 실음 → 웹앱 🖥 기기 운영 보고');
  const app = fs.readFileSync([path.join(__dirname, '../app.html'), path.join(__dirname, '../../src/app.html')].find((p) => fs.existsSync(p)) || '', 'utf8');
  if (app) ok(/function blkCgTxt\(c\)/.test(app) && /수집기가 알라딘 화면마다 막음 — 손 0/.test(app) && /인쇄 도우미 1\.2\.2를 받아야 생김/.test(app) && /hosts로 받기까지 막기\(선택\)/.test(app), "웹앱: '수집기가 막음 — 손 0'이 먼저 · hosts 단추는 선택 · 단추가 안 보이는 까닭(인쇄 도우미 1.2.2 전)"); };

(async () => { textChk(); const errs = await run(); ok(!errs.length, '화면 오류 없음', errs); console.log(bad ? `❌ tCLAR1 실패 ${bad}` : '✓ tCLAR1 모두 통과'); })().catch((e) => { console.log('❌ tCLAR1 멈춤', e.message); });
