// tMAN — (정범님 11/03) 📑 설명서 차례·주제별·바로가기: 차례·지금 보는 장·차례 찾기·소제목·주제별·바뀐 장·🔗 주소·최근 본 장·#man= 열기·펼칠 때 그리기·찾기(펼치기 전 장도)·키보드·휴대폰 서랍·메모리
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = (ms) => new Promise((r) => setTimeout(r, ms));
const body = async (p, phone) => { const tag = phone ? '📱 ' : '🖥 '; const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await p.context().newCDPSession(p); const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(200); const r = await cdp.send('Runtime.getHeapUsage'); return Math.round(r.usedSize / 1048576 * 10) / 10; };
  await p.evaluate(() => { try { localStorage.removeItem('rn-mnv'); } catch (e) {} });
  const h0 = await heap();
  const r1 = await p.evaluate(async () => { const t0 = performance.now(); openManual(); const ms = performance.now() - t0; await new Promise((r) => setTimeout(r, 300)); const sh = document.querySelector('#sheet'); const D = [...sh.querySelectorAll('details.man')]; const lazy = D.filter((d) => d.dataset.mb != null && !d.dataset.mbf); const as = sh.querySelector('.mnv-side');
    return { ms: Math.round(ms), dom: document.getElementsByTagName('*').length, n: D.length, lazy: lazy.length, emptyLazy: lazy.every((d) => !d.querySelector('.manb').childNodes.length), rows: as ? as.querySelectorAll('.mnv-r').length : 0, tools: !!sh.querySelector('#msr .mnv-tools'), wide: sh.classList.contains('mnv-wide'), asOn: as && as.classList.contains('on'), vis: as ? as.getBoundingClientRect().right > 10 : false, badges: sh.querySelectorAll('details.man>summary[data-mnvd]').length, ln: sh.querySelectorAll('details.man .mnv-ln').length, sv: !!(MANUAL_VER && MANUAL_VER.s), newCh: D.some((d) => /설명이 빠졌던/.test(d.querySelector('summary').textContent)), mine: D.some((d) => /📑 설명서 차례/.test(d.querySelector('summary').textContent)), ver: (sh.querySelector('.mnv-ver') || {}).textContent || '' }; });
  const h1 = await heap();
  ok(r1.n > 100 && r1.rows === r1.n, tag + `차례 줄 = 설명서 장 수 (${r1.rows}/${r1.n})`);
  ok(r1.lazy > 80 && r1.emptyLazy, tag + `접힌 장 ${r1.lazy}개는 본문을 아직 안 그림`);
  ok(r1.dom < 3000, tag + `연 뒤 화면 요소 ${r1.dom}개 (예전 약 6,000)`);
  ok(r1.tools && r1.ln === r1.n, tag + '찾기 칸 아래 도구 줄 · 장마다 🔗');
  ok(r1.sv && r1.badges > 100 && /설명서 v\d+/.test(r1.ver), tag + `장마다 바뀐 판·날 표시 ${r1.badges}개 · ${r1.ver}`);
  ok(r1.newCh && r1.mine, tag + 'main의 새 장(설명이 빠졌던 것)·📑 새 설명 장도 차례에 있음');
  if (phone) ok(!r1.wide && !r1.asOn, tag + '휴대폰: 차례는 서랍(처음엔 닫힘)'); else ok(r1.wide && r1.asOn && r1.vis, tag + 'PC: 왼쪽 차례가 늘 보임');
  console.log(`  ⏱ ${tag}열기 ${r1.ms}ms · 힙 ${h0} → ${h1}MB`);
  // 휴대폰 서랍
  if (phone) { const r = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); sh.querySelector('.mnv-tools [data-mnv="drawer"]').click(); await new Promise((r) => setTimeout(r, 300)); const as = sh.querySelector('.mnv-side'); const a = { on: as.classList.contains('on'), bd: sh.querySelector('.mnv-bd').classList.contains('on'), left: Math.round(as.getBoundingClientRect().left), h: Math.round(as.querySelector('.mnv-t').getBoundingClientRect().height) }; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise((r) => setTimeout(r, 300)); a.esc = !as.classList.contains('on') && S.detail && S.detail.manual; return a; });
    ok(r.on && r.bd && r.left >= -1 && r.h >= 40, tag + '☰ 차례 → 왼쪽 서랍 · 뒤 어둡게 · 큰 누름 칸: ' + JSON.stringify(r)); ok(r.esc, tag + 'Esc = 서랍만 닫음(설명서는 그대로)'); }
  // 차례 → 장으로
  const r2 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); if (!MNV.wide) mnvDrawer(true); const x = MNV.S[40]; const b = sh.querySelector(`.mnv-tree .mnv-t[data-mnvk="${CSS.escape(x.k)}"]`); b.click(); await new Promise((r) => setTimeout(r, 400)); const top = x.det.getBoundingClientRect().top; return { k: x.k, open: x.det.open, filled: !!x.det.querySelector('.manb').childNodes.length, top: Math.round(top), line: mnvTopLine(), hash: decodeURIComponent(location.hash), cur: MNV.cur, on: !!sh.querySelector(`.mnv-r.on[data-mnvr="${CSS.escape(x.k)}"]`), here: sh.querySelector('.mnv-here b').textContent, drawer: MNV.drawer, rc: (JSON.parse(localStorage.getItem('rn-mnv')) || {}).recent || [] }; });
  ok(r2.open && r2.filled && Math.abs(r2.top - r2.line) < 30, tag + `차례 누름 → 그 장 펼치고 그리고 찾기 칸 바로 아래로 (위 ${r2.top} / 기준 ${r2.line})`);
  ok(r2.hash === '#man=' + r2.k && r2.cur === r2.k && r2.on && r2.here.length > 2, tag + `주소 #man=${r2.k} · 지금 보는 장 강조 · 📍 ${r2.here.slice(0, 30)}`);
  ok(r2.rc[0] === r2.k && !r2.drawer, tag + '🕘 최근 본 장에 남음' + (phone ? ' · 서랍 저절로 닫힘' : ''));
  // 스크롤 따라 지금 보는 장
  const r3 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); const x = MNV.S[70]; mnvFill(x.det); x.det.open = true; sh.scrollTop += x.det.getBoundingClientRect().top - mnvTopLine() + 20; await new Promise((r) => setTimeout(r, 250)); return { want: x.k, cur: MNV.cur }; });
  ok(r3.cur === r3.want, tag + '스크롤하면 지금 보는 장이 따라 바뀜');
  // 찾기 — 아직 안 그린 장 안의 단락
  const r4 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); sh.querySelectorAll('[data-mnv="body-close"]')[0].click(); const qi = sh.querySelector('#msr .msr-q'); qi.value = '로거 멈춤'; msrRun(sh, qi.value); const R = MSR.last.R; const i = R.findIndex((x) => !x.u.head && mnvLazy(x.u.det)); const u = R[i].u; msrJump(sh, i); await new Promise((r) => setTimeout(r, 500)); const a = { n: R.length, i, filled: !!u.det.dataset.mbf, open: u.det.open, el: !!(u.el && u.el.isConnected && u.det.contains(u.el)), hit: u.el.classList.contains('msr-hit'), txt: u.el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) === u.txt.slice(0, 40), hl: !!(CSS.highlights && CSS.highlights.get('msr')) };
    qi.focus(); const c0 = MSR.cur; qi.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); a.down = MSR.cur === (c0 + 1) % R.length; qi.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); a.up = MSR.cur === c0;
    const r2 = msrSearch(sh, 'ㄹㄱ'); a.cho = r2.R.length; const r3 = msrSearch(sh, '송장'); a.syn = r3.R.length; const r4 = msrSearch(sh, '설명이빠졌던'); a.sp = r4.R.length; qi.value = ''; msrRun(sh, ''); return a; });
  ok(r4.n > 5 && r4.i >= 0 && r4.filled && r4.open && r4.el && r4.txt, tag + `찾기 결과(${r4.n}개) 중 접혀 안 그린 장 단락 → 그 장을 그리고 같은 단락으로 감`);
  ok(r4.hit && r4.hl, tag + '찾은 단락 깜빡임 · 일치 글자 강조');
  ok(r4.down && r4.up, tag + '찾기 칸 ↓/↑ = 다음/앞 결과');
  ok(r4.cho > 0 && r4.syn > 0 && r4.sp > 0, tag + `초성(ㄹㄱ ${r4.cho}) · 같은 뜻(송장 ${r4.syn}) · 띄어쓰기 무시(${r4.sp})`);
  // 차례 찾기 · 소제목
  const r5 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); const as = sh.querySelector('.mnv-side'); const tq = as.querySelector('.mnv-tq'); tq.value = '로거'; tq.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 250)); const a = { rows: as.querySelectorAll('.mnv-r').length, subs: as.querySelectorAll('.mnv-sub').length, cnt: as.querySelector('.mnv-cnt').textContent, mark: as.querySelectorAll('.mnv-tree mark').length };
    tq.value = 'ㄹㄱ'; tq.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 250)); a.cho = as.querySelectorAll('.mnv-r').length; tq.value = ''; tq.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 250)); a.all = as.querySelectorAll('.mnv-r').length;
    const x = MNV.S.find((y) => mnvSubs(y).length >= 3); as.querySelector(`[data-mnvc="${CSS.escape(x.k)}"]`).click(); const sb = as.querySelectorAll(`.mnv-sub[data-mnvk="${CSS.escape(x.k)}"]`); a.sb = sb.length; if (!MNV.wide) mnvDrawer(true); sb[2].click(); await new Promise((r) => setTimeout(r, 400)); const el = sh.querySelector('.msr-hit'); a.subOk = !!el && x.det.contains(el) && el.textContent.includes(mnvSubs(x)[2].t.slice(0, 10)); a.subTop = el ? Math.round(el.getBoundingClientRect().top - mnvTopLine()) : null; a.hash = location.hash; return a; });
  ok(r5.rows > 0 && r5.rows < r1.n && r5.mark > 0 && /\/ \d+장/.test(r5.cnt), tag + `차례 찾기 '로거' → ${r5.rows}장 · 소제목 ${r5.subs} · 강조 · ${r5.cnt}`);
  ok(r5.cho > 0 && r5.all === r1.n, tag + `차례 찾기 초성 ${r5.cho}장 · 지우면 모두`);
  ok(r5.sb >= 3 && r5.subOk && Math.abs(r5.subTop) < 30 && /~2$/.test(r5.hash), tag + `▸ 소제목 ${r5.sb}개 → 소제목 눌러 그 문단으로 (#…~2)`);
  // 주제별
  const r6 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); const ord0 = [...sh.querySelectorAll('details.man')].map((d) => d.dataset.mk); sh.querySelector('.mnv-tools [data-mnv="view"]').click(); await new Promise((r) => setTimeout(r, 300)); const gh = [...sh.querySelectorAll('h3.mnv-gh2')].map((h) => h.textContent); const tg = sh.querySelectorAll('.mnv-side .mnv-gh').length; const n1 = sh.querySelectorAll('details.man').length; const grpOk = [...sh.querySelectorAll('.mnv-gwrap > details.man')].every((d, i, A) => { const g = mnvGroup(mnvX(d.dataset.mk)); return i === 0 || MNV_G.findIndex((r) => r[0] === g) >= MNV_G.findIndex((r) => r[0] === mnvGroup(mnvX(A[i - 1].dataset.mk))); });
    const etc = MNV.S.filter((x) => x.g === 'etc').length; const ls = (JSON.parse(localStorage.getItem('rn-mnv')) || {}).view; sh.querySelector('.mnv-side [data-mnv="v-toc"]').click(); await new Promise((r) => setTimeout(r, 300)); const ord1 = [...sh.querySelectorAll('details.man')].map((d) => d.dataset.mk); return { gh: gh.length, gh0: gh.slice(0, 3), tg, n1, grpOk, etc, ls, back: ord0.join() === ord1.join() && !sh.querySelector('.mnv-gwrap'), names: gh.map((t) => t.replace(/\s*\d+장$/, '')) }; });
  ok(r6.gh >= 10 && r6.tg === r6.gh && r6.n1 === r1.n && r6.grpOk, tag + `🗂 주제별: 본문·차례 모두 ${r6.gh}묶음(${r6.names.join(' · ')})`);
  ok(r6.ls === 'grp' && r6.back, tag + '보기는 이 기기 기억 · 📑 차례 순 = 원래 차례 그대로');
  // 바뀐 장 거르기
  const r7 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); sh.querySelector('.mnv-tools [data-mnv="flt"]').click(); const chips = [...sh.querySelectorAll('.mnv-pop [data-mnvf]')].map((b) => b.textContent); sh.querySelector('.mnv-pop [data-mnvf="new"]').click(); await new Promise((r) => setTimeout(r, 200)); const vis = [...sh.querySelectorAll('details.man')].filter((d) => !d.classList.contains('mnv-hide')).length; const rows = sh.querySelectorAll('.mnv-side .mnv-r').length; const fb = (sh.querySelector('.mnv-fb') || {}).textContent || '';
    const want = MNV.S.filter((x) => x.sv && x.sv[0] === MNV.lastN).length; sh.querySelector('[data-mnv="fltx"]').click(); await new Promise((r) => setTimeout(r, 200)); const vis2 = [...sh.querySelectorAll('details.man')].filter((d) => !d.classList.contains('mnv-hide')).length;
    const x = MNV.S[5]; mnvSeen(x.det, 1); const sv = JSON.parse(localStorage.getItem('rn-mnv')).seen; sv[x.k] = 'old'; localStorage.setItem('rn-mnv', JSON.stringify({ ...JSON.parse(localStorage.getItem('rn-mnv')), seen: sv })); MNV.seenC = null; mnvFilter('seen'); const vs = [...sh.querySelectorAll('details.man')].filter((d) => !d.classList.contains('mnv-hide')).map((d) => d.dataset.mk); mnvFilter(''); return { chips, vis, rows, fb, want, vis2, vs, k: x.k, lastN: MNV.lastN }; });
  ok(r7.chips.length === 3 && r7.want > 0 && r7.vis === r7.want && r7.rows === r7.want && /만 보는 중/.test(r7.fb), tag + `🆕 v${r7.lastN}에 바뀐 장 ${r7.want}개만 · 본문·차례 같이 · ${r7.fb.slice(0, 30)}`);
  ok(r7.vis2 === r1.n && r7.vs.length === 1 && r7.vs[0] === r7.k, tag + '✕ 모두 보기 · 👀 본 뒤 바뀐 장 거르기');
  // 🔗 주소 복사
  const r8 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); const x = MNV.S[12]; const wasOpen = x.det.open; x.det.querySelector('.mnv-ln').click(); await new Promise((r) => setTimeout(r, 200)); return { k: x.k, hash: decodeURIComponent(location.hash), same: x.det.open === wasOpen, toast: (document.querySelector('#toast') || {}).textContent || '', sum: x.sum.textContent.includes('🔗') }; });
  ok(r8.hash === '#man=' + r8.k && r8.same && /주소/.test(r8.toast) && !r8.sum, tag + '장 머리 🔗 = 주소 복사(장은 안 펼침 · 찾기 글에 섞이지 않음)');
  // / 키 · ⤒
  const r9 = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); document.activeElement.blur(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })); const f = document.activeElement && document.activeElement.classList.contains('msr-q'); document.activeElement.blur(); sh.querySelector('[data-mnv="top"]').click(); await new Promise((r) => setTimeout(r, 900)); return { f, top: sh.scrollTop }; });
  ok(r9.f && r9.top < 5, tag + '/ = 찾기 칸 · ⤒ 맨 위');
  // 닫기 → 버림
  const r10 = await p.evaluate(async () => { history.back(); await new Promise((r) => setTimeout(r, 400)); const sh = document.querySelector('#sheet'); return { mb: MAN_B.length, side: !!sh.querySelector('.mnv-side'), cls: sh.className, sh: MNV.sh }; });
  const h2 = await heap();
  ok(r10.mb === 0 && !r10.side && !/mnv/.test(r10.cls) && !r10.sh, tag + `닫으면 차례·본문 글 버림 · 시트 원래대로 (힙 ${h2}MB)`);
  // 다른 상세 화면에 왼쪽 여백이 남지 않음
  const r11 = await p.evaluate(async () => { openManual(); await new Promise((r) => setTimeout(r, 200)); openListView({ title: '시험 목록', rows: [], text: () => '', row: () => '' }); await new Promise((r) => setTimeout(r, 300)); const sh = document.querySelector('#sheet'); const a = { pad: getComputedStyle(sh).paddingLeft, side: !!sh.querySelector('.mnv-side'), mb: MAN_B.length }; history.back(); await new Promise((r) => setTimeout(r, 300)); history.back(); await new Promise((r) => setTimeout(r, 300)); return a; });
  ok(r11.pad === '0px' && !r11.side && r11.mb === 0, tag + '설명서에서 다른 화면으로 가면 차례 정리(왼쪽 여백 없음): ' + JSON.stringify(r11));
  // ⌨ 도움말 · FEAT
  const r12 = await p.evaluate(async () => { openManual(); await new Promise((r) => setTimeout(r, 200)); uxHelp(); const t = (document.querySelector('.rn-help') || {}).textContent || ''; document.querySelectorAll('.rn-help').forEach((x) => x.remove()); history.back(); await new Promise((r) => setTimeout(r, 300)); const f = featFind('설명서 차례'); return { help: /설명서 화면/.test(t) && /찾은 결과/.test(t), feat: f.some((x) => /📑 설명서 차례/.test(x.t)) }; });
  ok(r12.help && r12.feat, tag + '⌨ 도움말에 설명서 단축키 · 🔍 기능 찾기 「설명서 차례」');
  ok(!errs.length, tag + '페이지 오류 없음 ' + JSON.stringify(errs.slice(0, 3)));
  return { h0, h1, h2, ms: r1.ms, dom: r1.dom }; };
(async () => {
  await require('./harness.js')(async (p) => { await body(p, false); });
  await require('./harnessM.js')(async (p) => { await body(p, true); });
  // #man= 주소로 열기 (서비스 워커를 막은 새 창에서 주소 끝에 #man= 을 붙여 처음부터 엶)
  { const { chromium } = require('playwright'); const fs = require('fs'); const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: fs.readFileSync(__dirname + '/fbstub.js', 'utf8'), contentType: 'application/javascript' }));
    const base = 'http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'; await p.goto(base); await p.waitForTimeout(2500);
    const k = await p.evaluate(async () => { openManual(); await new Promise((r) => setTimeout(r, 200)); const k = MNV.S[60].k; history.back(); await new Promise((r) => setTimeout(r, 300)); return k; });
    const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message)); await p2.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p2.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await p2.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: fs.readFileSync(__dirname + '/fbstub.js', 'utf8'), contentType: 'application/javascript' }));
    await p2.goto(base + '#man=' + encodeURIComponent(k)); await p2.waitForTimeout(7500);
    const r = await p2.evaluate((k) => ({ man: !!(S.detail && S.detail.manual), cur: MNV.cur, open: !!(mnvX(k) && mnvX(k).det.open), top: mnvX(k) ? Math.round(mnvX(k).det.getBoundingClientRect().top - mnvTopLine()) : null, hash: decodeURIComponent(location.hash) }), k);
    ok(r.man && r.open && r.cur === k && Math.abs(r.top) < 30 && r.hash === '#man=' + k, '🔗 #man=장이름 주소로 웹앱을 열면 설명서 그 장으로: ' + JSON.stringify(r));
    ok(!errs.length, '주소로 열기 페이지 오류 없음 ' + JSON.stringify(errs.slice(0, 3))); await b.close(); }
  console.log(bad ? `❌ tMAN 실패 ${bad}` : '✓ tMAN 통과');
})();
