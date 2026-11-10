// ✎ 탭 첫 화면 편집 — 빠짐 검사 (정범님 11/10 '상품 탭 📥 등록 줄이 편집 대상에 안 나옴 · 모든 탭 조사')
//  ① 탭마다(넓은 화면·휴대폰) 화면 맨 바깥에 보이는 모든 칸이 편집 목록에 제 줄로 나오는지 — 제 줄 없이 앞 칸에 붙어도 되는 것은 설명 줄(p.hint)·숨은 입력·목록/표(정렬 줄에 붙음)뿐
//  ② 편집 창(✎ 첫 화면 편집)을 실제로 눌러 열어 줄 = 화면 덩어리와 같은지
//  ③ 📥 등록 줄은 '진행 중 0개'(숫자만 굵은 글자)가 붙어도 제 열쇠(#p_reg)를 지키는지 · 주문 탭 🧾 주문 상품 전체 보기 줄도 나오는지
//  ④ 새로 생긴 카드(제목이 숫자뿐이어도)가 저절로 편집 목록에 들어가는지
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = { miss: [], sheet: [] }; const W = (ms) => p.waitForTimeout(ms);
  const TABS = ['search', 'products', 'sellers', 'orders', 'purchase', 'biz', 'market', 'projects'];
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.app.tabOrder = {}; S.app.tabHide = {}; });
  const go = async (t) => { await p.evaluate((t) => { S.q = ''; S.tab = t; renderTabs(); S._userAt = Date.now(); renderMain(); }, t); await W(900); };
  const audit = () => p.evaluate(() => { const m = document.getElementById('main'); const B = tobBlocks(m); const own = new Set(B.map((b) => b.el)); const out = [];
    let started = false; for (const el of [...m.children]) { if (own.has(el)) { started = true; continue; } if (el.matches('.taborder') || (!started && el.matches(TOB_FIXED))) continue; if (el.offsetParent === null && !el.matches('details')) continue; if (el.matches('p.hint,input,script,style,template,' + (typeof TOB_DATA !== 'undefined' ? TOB_DATA : '.list,table,.clist,ul,ol'))) continue;
      out.push((el.className || el.tagName) + ' | ' + String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)); }
    return { keys: B.map((b) => b.k), miss: out }; });
  for (const vp of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) { await p.setViewportSize(vp);
    for (const t of TABS) { await go(t); const a = await audit(); a.miss.forEach((x) => R.miss.push(`${vp.width} ${t}: ${x}`));
      const btn = await p.$('#main .taborder [data-taborder]'); if (!btn) { R.sheet.push(`${vp.width} ${t}: 편집 단추 없음`); continue; }
      await btn.click(); await W(350); const rows = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-ok]')].map((x) => x.dataset.ok));
      if (JSON.stringify(rows) !== JSON.stringify(a.keys)) R.sheet.push(`${vp.width} ${t}: 편집 줄 ${rows.length} ≠ 화면 ${a.keys.length}`);
      if (t === 'products') R.regRow = R.regRow === false ? false : rows.includes('#p_reg');
      if (t === 'orders') R.oTop = R.oTop === false ? false : rows.some((k) => /주문상품전체보기/.test(k));
      await p.evaluate(() => history.back()); await W(300); } }
  await p.setViewportSize({ width: 1400, height: 900 });
  // ③ 등록 줄에 '진행 중 0개'가 붙어도 제 열쇠
  await p.evaluate(() => { S.regItems = S.regItems || new Map(); }); await go('products');
  R.regBold = await p.evaluate(() => { const c = document.querySelector('#main [data-blk="p_reg"]'); return !!c && !!c.querySelector('b') && tobBlocks(document.getElementById('main')).some((b) => b.k === '#p_reg' && b.el === c); });
  // 숨기기 저장 → 등록 줄이 실제로 숨겨지고, 보이기로 되돌림
  await p.click('#main .taborder [data-taborder]'); await W(300); await p.click('#sheet [data-tobhide="#p_reg"]'); await W(150); await p.click('#ord_save'); await W(900); await go('products');
  R.regHidden = await p.evaluate(() => { const c = document.querySelector('#main [data-blk="p_reg"]'); return !!c && c.style.display === 'none' && ((S.app.tabHide || {}).products || []).includes('#p_reg'); });
  await p.click('#main .taborder [data-taborder]'); await W(300); await p.click('#sheet [data-tobhide="#p_reg"]'); await W(150); await p.click('#ord_save'); await W(900); await go('products');
  R.regBack = await p.evaluate(() => { const c = document.querySelector('#main [data-blk="p_reg"]'); return !!c && c.style.display !== 'none'; });
  // ④ 새로 생긴 카드(제목이 숫자뿐) · 목록은 앞 칸에 붙음(손님·판매자 이름이 열쇠가 되지 않게)
  R.newCard = await p.evaluate(() => { const m = document.getElementById('main'); m.insertAdjacentHTML('beforeend', '<div class="card" id="zz_t1"><span>진행 중 <b>3</b>개</span></div><div class="card"><span>새 카드 <b>7</b></span></div><div class="list"><div class="item"><b>손님A</b></div></div>'); const B = tobBlocks(m); const k1 = B.some((b) => b.k === '#zz_t1'); const k2 = B.some((b) => b.k === 'b:새카드'); const noName = !B.some((b) => /손님A/.test(b.k)); [...m.querySelectorAll('#zz_t1, #zz_t1 ~ *')].forEach((x) => x.remove()); return k1 && k2 && noName; });
  console.log(JSON.stringify(R, null, 1).slice(0, 4000), errs.join('|'));
  const ok = !R.miss.length && !R.sheet.length && R.regRow && R.oTop && R.regBold && R.regHidden && R.regBack && R.newCard && !errs.length;
  console.log(ok ? '✓ tTOBALL 통과' : '❌ tTOBALL 실패');
});
