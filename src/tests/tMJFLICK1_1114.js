// tMJFLICK1_1114 — (MJ님 11/14 15:00) 📥 상품 등록 › 「＋ 미등록 상품/세트 만들기」 미등록 상품 정보를 채우면 화면이 번개처럼 위아래로 깜박이던 것
//  원인(고치기 전 판에서 다시 일으켜 확인):
//   ① 한/영 칸(상품명·부제·지은이·출판사)에 붙인 요소 속성 _koPos 때문에 제자리 고치기(morph)가 다시 그릴 때마다 입력 칸을 새것으로 바꿈 → 포커스·한글 조합 끊김
//   ② 작업대 줄(ws._rgwsH0)도 같은 까닭으로 새것이 되어 카드 목록 전체가 한 칸씩 밀려 다시 맞춰짐 · 다시 그린 순간 펼친 높이로 자리를 맞춤
//   ③ 그린 뒤 따로 끼우는 장식(카드 단축키 띠 · ◐ 단추 · 머리줄 ⌨·📖)을 다시 그릴 때마다 지웠다가 0.06~0.12초 뒤 다시 끼움 → 카드가 38px 줄었다 늘어남
//   ④ 글을 잠깐 멈출 때마다(자동 저장 0.7초) 등록 화면 전체를 다시 그림
//  확인: 치는 동안 전체 다시 그리기 0 · 치던 칸 요소 그대로(조합 끊김 0) · 치던 칸 화면 자리 그대로(프레임마다) · 레이아웃 이동(CLS) 작음 · Tab으로 옮겨도 맨 위로 안 튐 · 값 그대로 저장
// 실행: cd pw && RN_PORT=<포트> node tMJFLICK1_1114.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(!/el\._koPos|el\._koDirty/.test(T) && /const KO_ST = new WeakMap\(\)/.test(T), '한/영 칸 표시는 요소 속성이 아니라 KO_ST(WeakMap)');
ok(!/ws\._rgwsH0 *(=|==)/.test(T) && /UX2_WSH0/.test(T), '작업대 줄 높이 기억은 WeakMap(UX2_WSH0)');
ok(/hasAttribute\('data-mkeep'\)/.test(T) && /className = 'kba-bdg'; b\.setAttribute\('data-mkeep'/.test(T) && /class="vztg" data-mkeep="1"/.test(T), '따로 끼운 장식은 data-mkeep로 제자리에 남김');
ok(/const regCardW = /.test(T) && /var\(--rgcl,780px\)/.test(T) && /var\(--rgcr,320px\)/.test(T), '카드 너비 기본값 780·320 + 설정 칸(cardWL·cardWR)');
ok(/function regNewHold\(\)|const regNewHold = /.test(T) && /regNewHold\(\)\) \{ regNewSoft\(\); return regRerender\(\); \}/.test(T), '미등록 칸에서 치는 동안 전체 다시 그리기를 미룸');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJFLICK1_1114 ${bad}개 실패` : '✓ tMJFLICK1_1114 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const run = async (vw) => {
    await H(async (p) => {
      p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
      await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 });
      await p.evaluate(SEED); await p.waitForTimeout(500);
      await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
      await p.evaluate(async () => { window.ask = async () => true; S.regItems = S.regItems || new Map(); for (const k of [...S.regItems.keys()]) S.regItems.delete(k);
        const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }];
        for (let k = 1; k <= 3; k++) { const id = 'f' + k; const d = { stage: 'sel', method: 'one', isbn: '979110000880' + k, grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: new Date(Date.now() - k * 60e3).toISOString(), code: 'MJ3CMN', codeManual: true, info: { title: '깜박임 시험 책 ' + id, isbn13: '979110000880' + k, itemId: '88' + k, author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: PG, priceList: 15000, priceSales: 13500, usedTotal: 1, at: new Date().toISOString() } }; await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
        window.pcFirst = async () => new Promise(() => {}); localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); });
      await p.waitForTimeout(1800);
      await p.click('#rg_newitem'); await p.waitForTimeout(2000);
      const id = await p.evaluate(() => { const x = [...S.regItems.values()].find((y) => y.method === 'new'); return x && x.id; });
      ok(!!id, `(폭 ${vw}) 미등록 카드가 생김`); if (!id) return;
      const sel = (k) => `#sheet [data-rgnf="${id}"][data-k="${k}"]`;
      await p.locator(sel('titleCore')).scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
      /* 재는 틀: 프레임마다 포커스 칸 화면 자리·요소 번호·스크롤 · 전체 다시 그리기(openRegister) 횟수 · 레이아웃 이동 */
      await p.evaluate(() => { const sh = document.getElementById('sheet'); const W = (window.__fl = { rr: 0, F: [], ids: new WeakMap(), n: 0, cls: [], comp: [] });
        const o = window.openRegister; window.openRegister = function () { W.rr++; return o.apply(this, arguments); };
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { const src = (e.sources || []).filter((x) => x.node && x.node.isConnected !== false && (x.node.nodeType === 1 ? x.node : x.node.parentElement) && (x.node.nodeType === 1 ? x.node : x.node.parentElement).closest('#sheet')); if (src.length) W.cls.push(e.value); } /* 등록 화면(#sheet) 안에서 움직인 것만 — 뒤에 가려진 홈 화면은 빼고 */ }).observe({ type: 'layout-shift', buffered: false }); } catch (e) {}
        ['compositionstart', 'compositionend'].forEach((ev) => document.addEventListener(ev, (e) => W.comp.push([ev, e.target && e.target.dataset ? e.target.dataset.k : null]), true));
        const idOf = (el) => { if (!el) return 0; if (!W.ids.has(el)) W.ids.set(el, ++W.n); return W.ids.get(el); };
        const tick = () => { const a = document.activeElement; if (!W.ign) W.F.push({ seg: W.seg || 0, t: performance.now(), st: sh.scrollTop, at: a && a !== document.body ? a.getBoundingClientRect().top : null, aid: idOf(a), k: a && a.dataset ? a.dataset.k || a.id || a.className : null, con: a ? a.isConnected : null }); W.raf = requestAnimationFrame(tick); }; tick();
        W.reset = () => { W.rr = 0; W.F.length = 0; W.cls.length = 0; }; });
      const measure = () => p.evaluate(() => { const W = window.__fl; const F = W.F; let maxJ = 0, swap = 0, lost = 0; for (let i = 1; i < F.length; i++) { const a = F[i - 1], b = F[i]; if (a.k === b.k && a.aid !== b.aid && b.aid) swap++; if (a.seg === b.seg && a.k === b.k && a.aid === b.aid && a.at != null && b.at != null) maxJ = Math.max(maxJ, Math.abs(b.at - a.at)); if (a.con && !b.con) lost++; } const st = F.map((f) => f.st); return { rr: W.rr, maxJ: Math.round(maxJ), swap, lost, stSpan: Math.round(Math.max(...st) - Math.min(...st)), cls: +W.cls.reduce((x, y) => x + y, 0).toFixed(4), frames: F.length }; });
      const cdp = await p.context().newCDPSession(p);
      const ime = async (syl) => { for (const [parts, fin] of syl) { for (const c of parts) { await cdp.send('Input.imeSetComposition', { text: c, selectionStart: c.length, selectionEnd: c.length }); await p.waitForTimeout(120); } await cdp.send('Input.insertText', { text: fin }); await p.waitForTimeout(140); } };

      console.log(`② (폭 ${vw}) 상품명 칸 — 한글 조합으로 치고 중간에 2.6초 쉼(자동 저장·🔎 자동 찾기가 도는 때)`);
      await p.click(sel('titleCore')); await p.evaluate(() => window.__fl.reset());
      const el0 = await p.evaluate((s) => { const e = document.querySelector(s); window.__el0 = e; return !!e; }, sel('titleCore'));
      await ime([[['ㅅ', '세'], '세'], [['ㄱ', '계'], '계']]); await p.keyboard.type(' '); await p.waitForTimeout(2600);
      await ime([[['ㅁ', '며', '명'], '명'], [['ㅈ', '자', '작'], '작']]); await p.waitForTimeout(2600);
      let M = await measure();
      ok(M.rr === 0, `(폭 ${vw}) 치는 동안 등록 화면 전체 다시 그리기 0번`, M);
      ok(M.swap === 0 && M.lost === 0 && await p.evaluate(() => document.activeElement === window.__el0 && window.__el0.isConnected), `(폭 ${vw}) 상품명 칸 요소 그대로(새 칸으로 안 바뀜 · 포커스 그대로 — 한글 조합 끊김 0)`, M);
      ok(M.maxJ <= 2, `(폭 ${vw}) 치던 칸이 화면에서 움직이지 않음(프레임 사이 최대 ${M.maxJ}px · 기준 2px)`, M);
      ok(M.cls < 0.08, `(폭 ${vw}) 등록 화면 안 레이아웃 이동(CLS) ${M.cls} < 0.08 (자동 찾기 결과 칸이 위에서 늘어 보정한 몫 포함 — 치던 칸 자체는 위 프레임 시험)`, M);
      ok(await p.inputValue(sel('titleCore')) === '세계 명작', `(폭 ${vw}) 칸 글 = '세계 명작'(조합·띄어쓰기 그대로)`, await p.inputValue(sel('titleCore')));

      console.log(`③ (폭 ${vw}) 다른 칸으로 옮겨 가며 채움(부제·지은이·쪽수) — 한 칸을 다 채우고 옮길 때도`);
      await p.evaluate(() => window.__fl.reset());
      for (const [k, v] of [['subtitle', '부제 시험'], ['customAuthor', '지은이을'], ['pages', '321']]) { await p.evaluate(() => { window.__fl.ign = true; }); await p.locator(sel(k)).scrollIntoViewIfNeeded(); await p.click(sel(k)); await p.waitForTimeout(250); await p.evaluate(() => { const W = window.__fl; W.ign = false; W.seg = (W.seg || 0) + 1; }); /* 칸을 누르러 가는 스크롤(사람이 굴림)은 빼고 칸 안에서 치는 동안만 잼 */ await p.keyboard.type(v, { delay: 90 }); await p.waitForTimeout(1800); }
      M = await measure();
      ok(M.rr === 0, `(폭 ${vw}) 칸을 옮겨 다녀도 전체 다시 그리기 0번`, M);
      ok(M.maxJ <= 2 && M.swap === 0, `(폭 ${vw}) 치던 칸 자리·요소 그대로 (최대 ${M.maxJ}px)`, M);
      ok(M.cls < 0.08, `(폭 ${vw}) 등록 화면 안 레이아웃 이동(CLS) ${M.cls} < 0.08 (자동 찾기 결과 칸이 위에서 늘어 보정한 몫 포함 — 치던 칸 자체는 위 프레임 시험)`, M);

      console.log(`④ (폭 ${vw}) 칸을 떠나면 한 번 다시 그림 — 화면 자리 그대로`);
      const top0 = await p.evaluate((id) => document.querySelector(`#sheet [data-rgcid="${id}"] .regnew`).getBoundingClientRect().top, id);
      await p.evaluate(() => window.__fl.reset());
      { const bx = await p.evaluate((s) => { const r = document.querySelector(s).closest('.rnr').querySelector('.rnl').getBoundingClientRect(); return { x: r.x + 4, y: r.y + r.height / 2 }; }, sel('pages')); await p.mouse.click(bx.x, bx.y); } await p.waitForTimeout(1500); /* 화면에 보이는 칸 이름(쪽수) 자리를 눌러 떠남 — 스크롤 없이 */
      M = await measure(); const top1 = await p.evaluate((id) => document.querySelector(`#sheet [data-rgcid="${id}"] .regnew`).getBoundingClientRect().top, id);
      ok(M.rr >= 1, `(폭 ${vw}) 떠난 뒤 미뤘던 다시 그리기가 이뤄짐(${M.rr}번)`, M);
      ok(Math.abs(top1 - top0) <= 4, `(폭 ${vw}) 다시 그려도 미등록 칸 자리 그대로(4px 안) (${Math.round(top0)} → ${Math.round(top1)})`);
      const N = await p.evaluate((id) => (S.regItems.get(id) || {}).new || {}, id);
      ok(N.titleCore === '세계 명작' && N.subtitle === '부제 시험' && N.customAuthor === '지은이을' && +N.pages === 321, `(폭 ${vw}) 넣은 값 그대로 저장`, N);

      console.log(`⑤ (폭 ${vw}) Tab으로 다음 칸·단추로 옮겨도 화면이 맨 위로 튀지 않음`);
      await p.click(sel('titleCore')); await p.keyboard.press('End'); await p.keyboard.type('전집', { delay: 90 });
      await p.evaluate(() => window.__fl.reset()); await p.keyboard.press('Tab'); await p.waitForTimeout(2500);
      M = await measure(); const foc = await p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : null; });
      ok(foc !== 'rg_in' && M.stSpan <= 40, `(폭 ${vw}) Tab 뒤 포커스가 맨 위 검색창으로 안 감 · 스크롤 변화 ${M.stSpan}px`, { foc, M });
      ok(await p.evaluate((id) => ((S.regItems.get(id) || {}).new || {}).titleCore, id) === '세계 명작전집', `(폭 ${vw}) Tab으로 떠날 때 저장`);

      console.log(`⑥ (폭 ${vw}) MJ님 11/14 15:35 카드 너비 — 왼쪽(등록 정보) 조금 넓게 · 오른쪽(시장 지표·판매가) 조금 좁게 · 설정 칸`);
      const cw = () => p.evaluate((id) => { const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); const L = c.querySelector(':scope > .pq-l'), R = c.querySelector(':scope > .pq-r'); const sh = document.getElementById('sheet'); return { l: L ? Math.round(L.getBoundingClientRect().width) : null, r: R ? Math.round(R.getBoundingClientRect().width) : null, rTop: R ? Math.round(R.getBoundingClientRect().top - L.getBoundingClientRect().top) : null, over: sh.scrollWidth - sh.clientWidth, cover: c.scrollWidth - c.clientWidth }; }, id);
      let C = await cw();
      if (vw > 800) { ok(C.l > 700 && C.l <= 780 && C.r <= 320 && C.r >= 240, `(폭 ${vw}) 기본 너비: 왼쪽 ${C.l}px(예전 최대 700 → 780) · 오른쪽 ${C.r}px(예전 최대 380 → 320)`, C);
        ok(await p.evaluate(() => !!document.querySelector('#rg_cwl') && !!document.querySelector('#rg_cwr')), `(폭 ${vw}) ⚙ 등록 조건에 '📐 카드 너비' 칸 있음`);
        await p.evaluate(() => { const a = document.querySelector('#rg_cwl'); a.value = '700'; a.dispatchEvent(new Event('change')); const b = document.querySelector('#rg_cwr'); b.value = '380'; b.dispatchEvent(new Event('change')); }); await p.waitForTimeout(1800);
        C = await cw(); ok(C.l === 700 && C.r === 380, `(폭 ${vw}) 설정 칸으로 바꾸면 그대로(700·380)`, { C, reg: await p.evaluate(() => ({ l: S.app.reg.cardWL, r: S.app.reg.cardWR })) });
        await p.evaluate(() => { const a = document.querySelector('#rg_cwl'); a.value = '780'; a.dispatchEvent(new Event('change')); const b = document.querySelector('#rg_cwr'); b.value = '320'; b.dispatchEvent(new Event('change')); }); await p.waitForTimeout(1500); }
      else ok(C.over <= 0 && C.cover <= 0 && C.l <= vw && C.r <= vw, `(폭 ${vw}) 휴대폰: 한 줄로 쌓이고 가로 넘침 없음`, C);
    }, vw < 500 ? { touch: true } : undefined);
  };
  for (const vw of [1400, 390]) await run(vw);
  console.log(bad ? `❌ tMJFLICK1_1114 ${bad}개 실패` : '✓ tMJFLICK1_1114 모두 통과'); process.exit(bad ? 1 : 0);
})();
