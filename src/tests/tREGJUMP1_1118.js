// tREGJUMP1_1118 — (MJ님 11/18 작업판 「상품등록에서 튀는 현상」) 📥 상품 등록 › 선택 대기에서 판매가·⚡ 간단 직접 입력·×수량을 바꾸면 화면이 위로 튀던 것
//  원인(고치기 전 판에서 다시 일으켜 확인 · 1400px·390px):
//   ① ⚡ 간단 직접 입력 칸과 ×수량 칸이 같은 이름표(data-rgq="상품")를 씀 → 다시 그린 뒤 자리 되돌리기가 ⚡ 칸 대신 ×수량 칸을 찾아
//      ×수량 칸을 ⚡ 칸이 있던 자리로 끌어옴(PC 약 350px · 휴대폰 약 555px 튐) + 초점이 ×수량 칸으로 넘어가 다음 글자가 수량에 들어감
//   ② 자리 되돌리기를 칸 묶기(regBind) 전에만 해서 휴대폰에서 다시 그릴 때마다 20px쯤 출렁임(50ms 뒤 다시 맞춤)
//   ③ 누른 단추 자리 지킴(uikFix)과 등록 화면 자리 되돌리기가 서로 다른 칸을 기준으로 두 번 옮김(상태 단추 누르면 27px)
//   ④ 화면 밖 칸(맨 위 스캔 칸)에 초점이 있으면 그것을 기준으로 잡음 · 상태·판매상태 단추는 이름표가 없어 초점이 사라짐
//   ⑤ 다른 카드의 칸을 누르면 그 카드가 활성 카드가 되며 ⌨ 활성 카드 띠·📊 활성 시장 지표 글이 카드 안(칸 위)에 끼어 누른 칸이 38px(휴대폰 72px) 아래로 밀림
//   ⑥ 칸을 누른 뒤 그 칸 위쪽 내용이 늘면(🔎 자동 찾기 결과·안내 글·시장 지표 · 미등록 상품 칸은 상품명을 누르면 128px) 치던 칸이 그만큼 아래로 밀려 휴대폰에서는 화면 밖으로 나갔다가 브라우저가 다시 끌어옴(118px 튐)
//   (MJ님 11/18 14:27 「간단 직접입력 칸만 누르면 커서가 수량 칸으로」 = ①과 같은 원인 — 칸만 눌러도 저장·활성 카드로 다시 그려지며 초점을 ×수량 칸에 되돌림)
//  확인: 선택 대기 목록을 그리고 스크롤을 내린 뒤 판매가·⚡ 간단 직접 입력·×수량을 바꿈 → 다시 그려져도(1번 이상) 치던 칸 화면 자리 그대로(프레임마다)
//        · 초점이 그 칸 그대로(⚡는 커서 끝) · 값 저장 · 치는 동안 다른 상품 원격 갱신이 와도 친 글자·초점 그대로 · 상태 단추를 눌러도 단추 자리 그대로
// 실행: cd pw && RN_PORT=<포트> node tREGJUMP1_1118.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(/function regAnchorKey\(sh, el\)/.test(T) && /':not\(\.rgq-in\)'/.test(T), '자리 되돌리기 이름이 겹치면 하나로 좁힘(⚡ 칸과 ×수량 칸을 가름)');
ok(/function regAnchorFind\(sh, K\)/.test(T) && /regAnchorPut\(sh, \{ \.\.\.anc, focus: null \}\); if \(typeof UIK !== 'undefined' && UIK\.sc === sh\) UIK\.sel = null;/.test(T), '칸을 묶은 뒤 한 번 더 맞추고, 누른 단추 자리 지킴과 두 번 옮기지 않음');
ok(/function kbaHoldGet\(\)/.test(T) && /try \{ kbaHoldPut\(H\); \} catch/.test(T), '활성 카드 띠가 끼거나 빠져도 누른 칸·초점 칸 화면 자리 그대로');
ok(/function rgfhFix\(\)/.test(T) && /new MutationObserver\(\(\) => \{ if \(RGFH\.el\) try \{ rgfhFix\(\); \}/.test(T), '치는 칸 위쪽 내용이 늘거나 줄어도 칸이 화면 그 자리(그려지기 전에 스크롤을 같은 만큼)');
ok(/const vis = \(el\) =>/.test(T) && /f\.cht = Date\.now\(\)/.test(T), '기준은 화면에 보이는 칸만 · 저장 뒤 더 친 글자를 이어 줌');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tREGJUMP1_1118 ${bad}개 실패` : '✓ tREGJUMP1_1118 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const run = async (vw, VIEW) => {
    await H(async (p) => {
      p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
      await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 });
      await p.evaluate(SEED); await p.waitForTimeout(500);
      await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
      await p.evaluate(async (VIEW) => { window.ask = async () => true; S.regItems = S.regItems || new Map(); for (const k of [...S.regItems.keys()]) S.regItems.delete(k);
        const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }];
        for (let k = 1; k <= 12; k++) { const n = String(k).padStart(2, '0'); const id = 'j' + n; const d = { stage: 'sel', method: 'one', isbn: '97911000088' + n, grade: 2, qty: 1, price: 9000 + k * 100, ws: regWsCur(), createdAt: new Date(Date.now() - k * 60e3).toISOString(), code: 'MJ3CMN', codeManual: true, descMode: 'quick', descQuick: '깨끗함',
          info: { title: '튐 시험 책 ' + id, isbn13: '97911000088' + n, itemId: '88' + k, author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: PG, priceList: 15000, priceSales: 13500, usedTotal: 1, at: new Date().toISOString() } };
          await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
        window.pcFirst = async () => new Promise(() => {}); localStorage.setItem('rn-reg-view', VIEW); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, VIEW);
      await p.waitForTimeout(2500);
      const id = 'j06'; const L = `(폭 ${vw} · ${VIEW === 'full' ? '🔎 자세히' : '📋 한눈에'})`;
      const card = VIEW === 'full' ? `#sheet [data-rgcid="${id}"]` : `#sheet .rgrow[data-rgexp="${id}"]`;
      ok(await p.evaluate((card) => !!document.querySelector(card), card), `${L} 선택 대기 목록에 시험 상품 카드가 그려짐`);
      // 재기: 프레임마다 칸·카드 화면 자리 · 다시 그린 수
      await p.evaluate(() => { const W = (window.__rj = { F: [], rr: 0, sel: null }); const o = window.openRegister; window.openRegister = function () { W.rr++; return o.apply(this, arguments); };
        const tick = () => { if (W.sel) { const f = document.querySelector(W.sel); const c = document.querySelector(W.card); W.F.push({ f: f ? f.getBoundingClientRect().top : null, c: c ? c.getBoundingClientRect().top : null }); } requestAnimationFrame(tick); }; tick(); });
      // 칸을 화면 위에서 300px 자리에(스크롤을 내린 상태 · 화면이 늦게 자라므로 몇 번)
      const place = async (sel) => { for (let i = 0; i < 4; i++) { await p.evaluate((sel) => { const sh = document.getElementById('sheet'); const el = document.querySelector(sel); if (el) sh.scrollTop += el.getBoundingClientRect().top - 300; }, sel); await p.waitForTimeout(350); } };
      const watch = (sel) => p.evaluate(([sel, card]) => { const W = window.__rj; W.F.length = 0; W.rr = 0; W.sel = sel; W.card = card; }, [sel, card]);
      const meas = () => p.evaluate(() => { const W = window.__rj; const F = W.F.filter((x) => x.f != null); const f0 = F[0] ? F[0].f : null; const c0 = F[0] ? F[0].c : null; let mf = 0, mc = 0; F.forEach((x) => { mf = Math.max(mf, Math.abs(x.f - f0)); if (x.c != null && c0 != null) mc = Math.max(mc, Math.abs(x.c - c0)); }); W.sel = null; const sh = document.getElementById('sheet'); return { rr: W.rr, mf: Math.round(mf), mc: Math.round(mc), frames: F.length, st: sh.scrollTop }; });
      const foc = (sel) => p.evaluate((sel) => { const a = document.activeElement; const want = document.querySelector(sel); return { same: !!want && a === want, a: a ? a.tagName + '.' + a.className + JSON.stringify(a.dataset) : null, ss: a && 'selectionStart' in a ? (() => { try { return a.selectionStart; } catch (e) { return null; } })() : null, len: a && a.value != null ? a.value.length : null, val: a ? a.value : null }; }, sel);
      const item = () => p.evaluate((id) => { const x = S.regItems.get(id); return { price: x.price, pm: !!x.priceManual, q: x.descQuick, qty: x.qty, grade: x.grade }; }, id);
      // ── 판매가
      const pin = `${card} [data-rgpin="${id}"]`; await place(pin); await watch(pin);
      await p.click(pin); await p.keyboard.press('Control+A'); await p.keyboard.type('12300', { delay: 50 }); await p.waitForTimeout(2500);
      let M = await meas(); let Fo = await foc(pin); let X = await item();
      ok(M.rr >= 1 && M.mf <= 4, `${L} 판매가: 다시 그려져도(${M.rr}번) 칸 화면 자리 그대로(최대 ${M.mf}px)`, M);
      ok(Fo.same, `${L} 판매가: 초점이 판매가 칸 그대로`, Fo); ok(X.price === 12300 && X.pm, `${L} 판매가: 12,300원 · 직접 정함 저장`, X);
      // ── ⚡ 간단 직접 입력 칸만 누름(MJ님 11/18 14:27 「칸만 누르면 커서가 수량 칸으로」) — 다른 카드 · 이 카드(판매가 칸에서 옮김 → 저장·다시 그림)
      if (VIEW === 'full') for (const cid of ['j07', id]) { const qi = `#sheet [data-rgcid="${cid}"] .rgq-in[data-rgq="${cid}"]`; await place(qi); await p.click(qi); await p.waitForTimeout(2500); const F1 = await foc(qi);
        ok(F1.same, `${L} 간단 직접입력 칸을 눌러도(${cid === id ? '이 카드' : '다른 카드'}) 초점이 그 칸에 남음(×수량 칸으로 안 옮겨짐)`, F1); }
      // ── ⚡ 간단 직접 입력(치는 동안 다른 상품 원격 갱신)
      let qin;
      if (VIEW === 'full') { qin = `${card} .rgq-in[data-rgq="${id}"]`; await place(qin); await watch(qin); await p.click(qin); }
      else { const qf = `${card} [data-rgqf="${id}"]`; await place(qf); qin = `${card} .rgq-in[data-rgq="${id}"]`; await p.click(qf); await p.waitForTimeout(400); await watch(qin); await p.waitForTimeout(2000); const F1 = await foc(qin); ok(F1.same, `${L} 간단 직접입력 칸을 눌러도 초점이 그 칸에 남음(×수량 칸으로 안 옮겨짐)`, F1); }
      await p.keyboard.press('End'); await p.keyboard.type(' 모', { delay: 50 });
      await p.evaluate(() => db.collection('reg_items').doc('j02').set({ price: 9876, uploadedAt: new Date().toISOString() }, { merge: true }));
      await p.keyboard.type('서리', { delay: 50 }); await p.waitForTimeout(2800);
      M = await meas(); Fo = await foc(qin);
      ok(M.rr >= 1 && M.mf <= 4, `${L} ⚡ 간단 직접 입력: 다시 그려져도(${M.rr}번) 칸 화면 자리 그대로(최대 ${M.mf}px)`, M);
      ok(Fo.same && Fo.ss === Fo.len, `${L} ⚡ 간단 직접 입력: 초점이 그 칸 그대로(×수량 칸으로 안 넘어감) · 커서 끝`, Fo);
      ok(/깨끗함 모서리$/.test(Fo.val || ''), `${L} ⚡ 간단 직접 입력: 친 글자 그대로(원격 갱신이 와도 안 지워짐)`, Fo);
      await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(1500); X = await item(); /* ⚡ 칸은 칸을 떠날 때 저장(원래 동작) */
      ok(/깨끗함 모서리$/.test(X.q || ''), `${L} ⚡ 간단 직접 입력: 칸을 떠나면 친 글자 그대로 저장`, X);
      ok(await p.evaluate(() => S.regItems.get('j02').price) === 9876, `${L} 그사이 들어온 다른 상품 원격 갱신도 반영`);
      if (VIEW === 'full') {
        // ── ×수량
        const qn = `${card} input[type=number][data-rgq="${id}"]`; await place(qn); await watch(qn);
        await p.click(qn); await p.keyboard.press('Control+A'); await p.keyboard.type('2'); await p.waitForTimeout(2500);
        M = await meas(); Fo = await foc(qn); X = await item();
        ok(M.rr >= 1 && M.mf <= 4, `${L} ×수량: 다시 그려져도(${M.rr}번) 칸 화면 자리 그대로(최대 ${M.mf}px)`, M);
        ok(Fo.same, `${L} ×수량: 초점이 ×수량 칸 그대로`, Fo); ok(X.qty === 2, `${L} ×수량: 2부 저장`, X);
        // ── ×수량 → ⚡ 칸 누름(칸 옮김)
        await place(qn); await p.click(qn); await p.keyboard.press('Control+A'); await p.keyboard.type('3');
        await p.evaluate((sel) => { const sh = document.getElementById('sheet'); const el = document.querySelector(sel); sh.scrollTop += el.getBoundingClientRect().top - 300; }, qin); await watch(qin); /* 바로 ⚡ 칸을 화면에 두고(누르기가 칸을 보이게 스크롤하는 것은 재지 않음) */
        await p.click(qin); await p.keyboard.press('End'); await p.waitForTimeout(2500);
        M = await meas(); Fo = await foc(qin); X = await item();
        ok(M.rr >= 1 && M.mf <= 4 && Fo.same && X.qty === 3, `${L} ×수량을 바꾸고 ⚡ 칸을 눌러도 ⚡ 칸 자리·초점 그대로 · 3부 저장`, { M, Fo, X });
        // ── 상태 단추(누른 단추 자리 그대로)
        const gb = `${card} [data-rgg="${id}"][data-v="3"]`; await place(gb); await watch(gb); await p.click(gb); await p.waitForTimeout(2500);
        M = await meas(); X = await item();
        ok(M.rr >= 1 && M.mf <= 4 && X.grade === 3, `${L} 상태 단추: 다시 그려져도 누른 단추 자리 그대로(최대 ${M.mf}px) · 상태 저장`, { M, X });
        // ── 치는 칸 위쪽 내용이 늘었다 줄어도(🔎 결과·안내 글이 끼는 것처럼) 칸 자리 그대로
        await place(pin); await p.click(pin); await p.waitForTimeout(600); await watch(pin);
        await p.evaluate((card) => { const c = document.querySelector(card); const d = document.createElement('div'); d.id = 'rj_grow'; d.style.height = '140px'; c.insertBefore(d, c.firstChild); setTimeout(() => { d.style.height = '40px'; }, 300); setTimeout(() => d.remove(), 600); }, card);
        await p.waitForTimeout(1200); M = await meas(); Fo = await foc(pin);
        ok(M.mf <= 2 && Fo.same, `${L} 치는 칸 위쪽 내용이 +140 · -100 · -40px 바뀌어도 칸 화면 자리 그대로(최대 ${M.mf}px) · 초점 그대로`, { M, Fo });
      }
    }, vw < 500 ? { touch: true } : undefined);
  };
  for (const vw of [1400, 390]) await run(vw, 'full');
  await run(1400, 'compact');
  console.log(bad ? `❌ tREGJUMP1_1118 ${bad}개 실패` : '✓ tREGJUMP1_1118 모두 통과'); process.exit(bad ? 1 : 0);
})();
