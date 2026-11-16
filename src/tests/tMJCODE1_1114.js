// tMJCODE1_1114 — (MJ님 11/14 17:05) 📥 상품 등록 › 「＋ 미등록 상품/세트 만들기」 제목을 넣으면 관리 코드(상품 코드)가 자꾸 바뀌던 것
//  원인(고치기 전 판에서 다시 일으켜 확인): ① 미등록 상품은 관리 코드를 붙박지 않음(조회한 상품만 처음 정한 코드를 붙박음) — 판매가·분류·규격이 바뀔 때마다 다시 판정
//   ② 판매가를 치고 바로 제목 칸으로 옮기면, 1.78.630 '치는 동안 다시 그리기 미룸' 때문에 관리 코드 칸이 옛 값(BLKCMN · 판매가 없음)으로 남았다가 제목 칸을 떠나는 순간 YLWNOT으로 바뀜
//  확인: 판매가를 치는 동안 코드 칸이 바로 맞춰짐 · 미등록 정보 칸에 들어간 순간 보이는 코드를 붙박음 · 제목(한글 조합)·부제를 치고·칸을 떠나고·판매가를 바꿔도 그대로
//   · 판매가를 바꾸면 한 줄 알림 + [새 코드] → 눌러야만 바뀜 · 사람이 ▼로 고른 코드는 덮지 않음 · 다른 상품(조회 상품·확정 상품) 코드는 그대로 · 저장된 값도 그대로
// 실행: cd pw && RN_PORT=<포트> node tMJCODE1_1114.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(/function regNewPin\(id\)/.test(T) && /const REG_PIN_FROM = /.test(T), '미등록 정보 칸에 들어갈 때 보이는 코드를 붙박음(regNewPin)');
ok(/regFrz\.add\(id\); \/\* 이 기기에서 한 번만/.test(T) && /it\.codeManual \|\| !\['sel', 'pick', 'hold'\]\.includes\(it\.stage\)/.test(T), '사람이 고른 코드·확정·휴지통 상품은 건드리지 않음');
ok(/auto: dc\.code, autoWhy: dc\.why/.test(T) && /data-rgcodenew=/.test(T), '붙박은 코드와 지금 판정이 다르면 알림 + [새 코드]');
ok(/function regCodeSoft\(id, f\)/.test(T) && /regCodeSoft\(id, regCodeNow\(it1, \{ price:/.test(T), '판매가를 치는 동안·미룸 중에도 관리 코드 칸을 그 자리에서 맞춤');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJCODE1_1114 ${bad}개 실패` : '✓ tMJCODE1_1114 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const run = async (vw) => {
    await H(async (p) => {
      p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
      await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 });
      await p.evaluate(SEED); await p.waitForTimeout(500);
      await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
      /* 다른 상품 두 개: 조회한 상품(사람이 고른 코드) · 확정된 미등록 상품 — 이번 고침이 건드리면 안 됨 */
      await p.evaluate(async () => { window.ask = async () => true; S.regItems = S.regItems || new Map(); for (const k of [...S.regItems.keys()]) S.regItems.delete(k);
        const A = { stage: 'sel', method: 'one', isbn: '9791100008901', grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: new Date(Date.now() - 60e3).toISOString(), code: 'BLUWKB', codeManual: true, codeFrom: null, info: { title: '코드 시험 조회 책', isbn13: '9791100008901', itemId: '881', author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '소설'] }], page1: [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }], priceList: 15000, priceSales: 13500, usedTotal: 1, at: new Date().toISOString() } };
        const B = { stage: 'done', method: 'new', isbn: null, grade: 2, qty: 1, price: 2000, ws: regWsCur(), createdAt: new Date(Date.now() - 3600e3).toISOString(), code: 'GRYPNY', codeManual: false, new: { title: '이미 등록된 미등록 상품' }, final: { code: 'GRYPNY', price: 2000 }, doneAt: new Date().toISOString() };
        for (const [id, d] of [['cA', A], ['cB', B]]) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
        window.pcFirst = async () => new Promise(() => {}); localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); });
      await p.waitForTimeout(1800);
      const mk = async () => { const before = await p.evaluate(() => [...S.regItems.keys()]); await p.click('#rg_newitem'); await p.waitForTimeout(2000); return p.evaluate((b) => { const x = [...S.regItems.values()].find((y) => y.method === 'new' && !b.includes(y.id)); return x && x.id; }, before); };
      const id = await mk(); ok(!!id, `(폭 ${vw}) 미등록 카드가 생김`); if (!id) return;
      const sel = (k) => `#sheet [data-rgnf="${id}"][data-k="${k}"]`;
      const code = (i) => p.evaluate((i) => { const b = document.querySelector(`[data-rgcodeopen="${i}"] > b`); const it = S.regItems.get(i) || {}; const nw = document.querySelector(`[data-rgcnew="${i}"]`); return { dom: b ? b.textContent : null, code: it.code ?? null, man: !!it.codeManual, from: it.codeFrom || null, price: it.price ?? null, hint: nw && !nw.hidden ? nw.textContent.trim().slice(0, 80) : '' }; }, i);
      /* 재는 틀: 프레임마다 보이는 관리 코드 글자 */
      await p.evaluate((i) => { const W = (window.__cd = { L: [], seg: '' }); const tick = () => { const b = document.querySelector(`[data-rgcodeopen="${i}"] > b`); const t = b ? b.textContent : '(없음)'; const L = W.L; if (!L.length || L[L.length - 1][1] !== t) L.push([W.seg, t]); requestAnimationFrame(tick); }; tick(); }, id);
      const seg = (s) => p.evaluate(([s, i]) => { const W = window.__cd; W.seg = s; const b = document.querySelector(`[data-rgcodeopen="${i}"] > b`); W.L.push([s, b ? b.textContent : '(없음)']); }, [s, id]); /* 구간 시작 값도 적음 */ const flow = (s) => p.evaluate((s) => window.__cd.L.filter((x) => !s || x[0] === s).map((x) => x[1]), s);
      const cdp = await p.context().newCDPSession(p);
      const ime = async (syl) => { for (const [parts, fin] of syl) { for (const c of parts) { await cdp.send('Input.imeSetComposition', { text: c, selectionStart: c.length, selectionEnd: c.length }); await p.waitForTimeout(110); } await cdp.send('Input.insertText', { text: fin }); await p.waitForTimeout(130); } };

      console.log(`② (폭 ${vw}) 판매가를 치는 동안 관리 코드 칸이 바로 맞춰짐 — 저장(0.6초) 전에 제목 칸으로 옮겨도`);
      await p.locator(`[data-rgpin="${id}"]`).scrollIntoViewIfNeeded(); await seg('price');
      await p.click(`[data-rgpin="${id}"]`); await p.keyboard.type('4000', { delay: 70 }); await p.waitForTimeout(120);
      let C = await code(id); ok(C.dom === 'YLWNOT', `(폭 ${vw}) 판매가 4,000원을 친 순간(저장 전) 코드 칸 = YLWNOT(1,000원 초과 ~ 4,000원 이하)`, C);

      console.log(`③ (폭 ${vw}) 제목 칸에 들어가 한글 조합으로 치고(중간 2.6초 쉼) · 부제로 옮기고 · 칸을 떠나도 코드 그대로`);
      await seg('title'); await p.click(sel('titleCore')); await p.waitForTimeout(150);
      C = await code(id); ok(C.dom === 'YLWNOT' && C.code === 'YLWNOT' && C.man && /붙박음/.test(C.from || ''), `(폭 ${vw}) 제목 칸에 들어간 순간 보이던 코드(YLWNOT)를 붙박음`, C);
      await ime([[['ㅅ', '세'], '세'], [['ㄱ', '계'], '계']]); await p.keyboard.type(' '); await p.waitForTimeout(2600);
      await ime([[['ㅁ', '며', '명'], '명'], [['ㅈ', '자', '작'], '작']]); await p.waitForTimeout(2600);
      ok(await p.inputValue(sel('titleCore')) === '세계 명작', `(폭 ${vw}) 제목 = '세계 명작'(조합 그대로)`, await p.inputValue(sel('titleCore')));
      await p.click(sel('subtitle')); await p.keyboard.type('Test 1', { delay: 60 }); await p.waitForTimeout(1200);
      await seg('leave'); await p.click('#sheet .rgsh >> nth=0'); await p.waitForTimeout(2500); /* 칸을 떠남 → 미룬 다시 그리기 */
      const F1 = [...new Set([...(await flow('title')), ...(await flow('leave'))])];
      ok(F1.length === 1 && F1[0] === 'YLWNOT', `(폭 ${vw}) 제목·부제를 치고 칸을 떠나는 동안 보인 코드가 하나뿐(YLWNOT)`, F1);
      C = await code(id); ok(C.dom === 'YLWNOT' && C.code === 'YLWNOT' && !C.hint, `(폭 ${vw}) 다시 그린 뒤에도 YLWNOT · 알림 없음`, C);

      console.log(`④ (폭 ${vw}) 붙박은 뒤 판매가를 바꿔도 코드 그대로 — 한 줄 알림 + [새 코드]를 눌러야만 바뀜`);
      await seg('price2'); await p.fill(`[data-rgpin="${id}"]`, '45000'); await p.press(`[data-rgpin="${id}"]`, 'Enter'); await p.waitForTimeout(1800);
      C = await code(id); ok(C.dom === 'YLWNOT' && C.code === 'YLWNOT' && C.price === 45000, `(폭 ${vw}) 판매가 45,000원으로 바꿔도 코드 YLWNOT 그대로`, C);
      ok(/PNKLUX/.test(C.hint), `(폭 ${vw}) '지금 판정하면 PNKLUX' 알림 + [새 코드]`, C);
      ok((await flow('price2')).every((x) => x === 'YLWNOT'), `(폭 ${vw}) 판매가를 바꾸는 동안 보인 코드도 YLWNOT뿐`, await flow('price2'));
      await p.click(`[data-rgcodenew="${id}"]`); await p.waitForTimeout(1500);
      C = await code(id); ok(C.dom === 'PNKLUX' && C.code === 'PNKLUX' && C.man && !C.hint, `(폭 ${vw}) [새 코드]를 누르면 PNKLUX로 · 알림 사라짐`, C);

      console.log(`⑤ (폭 ${vw}) 저장된 값 · 다시 열어도 그대로`);
      const st = await p.evaluate(async (i) => { const d = await db.collection('reg_items').doc(i).get(); return d.data(); }, id);
      ok(st && st.code === 'PNKLUX' && st.codeManual === true && st.new && st.new.titleCore === '세계 명작', `(폭 ${vw}) 저장소에도 코드 PNKLUX · 제목 '세계 명작'`, st && { code: st.code, man: st.codeManual, t: st.new && st.new.titleCore });
      await p.evaluate(() => { S.detail = null; openRegister(); }); await p.waitForTimeout(1800);
      C = await code(id); ok(C.dom === 'PNKLUX', `(폭 ${vw}) 등록 화면을 다시 열어도 PNKLUX`, C);

      console.log(`⑥ (폭 ${vw}) 사람이 ▼로 먼저 고른 코드는 제목을 쳐도 덮지 않음`);
      const id2 = await mk(); ok(!!id2, `(폭 ${vw}) 두 번째 미등록 카드`);
      if (id2) { await p.locator(`[data-rgcodeopen="${id2}"]`).scrollIntoViewIfNeeded(); await p.click(`[data-rgcodeopen="${id2}"]`); await p.waitForTimeout(700);
        await p.click(`[data-rgcode="${id2}"][data-v="SKYCHD"]`); await p.waitForTimeout(1200);
        await p.click(`#sheet [data-rgnf="${id2}"][data-k="titleCore"]`); await p.keyboard.type('어린이 그림책', { delay: 60 }); await p.waitForTimeout(1500); await p.click('#sheet .rgsh >> nth=0'); await p.waitForTimeout(2000);
        const C2 = await code(id2); ok(C2.dom === 'SKYCHD' && C2.code === 'SKYCHD' && !/붙박음/.test(C2.from || ''), `(폭 ${vw}) 고른 코드 SKYCHD 그대로(붙박기가 덮지 않음)`, C2); }

      console.log(`⑦ (폭 ${vw}) 다른 상품 코드는 건드리지 않음`);
      const o = await p.evaluate(async () => { const a = await db.collection('reg_items').doc('cA').get(); const b = await db.collection('reg_items').doc('cB').get(); return { a: [a.data().code, a.data().codeManual, a.data().codeFrom ?? null], b: [b.data().code, b.data().codeManual, (b.data().final || {}).code] }; });
      ok(o.a[0] === 'BLUWKB' && o.a[1] === true && o.a[2] === null && o.b[0] === 'GRYPNY' && o.b[1] === false && o.b[2] === 'GRYPNY', `(폭 ${vw}) 조회 상품 BLUWKB · 확정 상품 GRYPNY 그대로`, o);
    }, vw < 500 ? { touch: true } : undefined);
  };
  for (const vw of [1400, 390]) await run(vw);
  console.log(bad ? `❌ tMJCODE1_1114 ${bad}개 실패` : '✓ tMJCODE1_1114 모두 통과'); process.exit(bad ? 1 : 0);
})();
