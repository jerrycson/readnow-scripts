// ✎ 탭 첫 화면 편집 — 빠짐 검사 (정범님 11/10 '상품 탭 📥 등록 줄이 편집 대상에 안 나옴 · 모든 탭 조사')
//  ① 탭마다(넓은 화면·휴대폰) 화면 맨 바깥에 보이는 모든 칸이 편집 목록에 제 줄로 나오는지 — 제 줄 없이 앞 칸에 붙어도 되는 것은 설명 줄(p.hint)·숨은 입력·목록/표(정렬 줄에 붙음)뿐
//  ② 편집 창(✎ 첫 화면 편집)을 실제로 눌러 열어 줄 = 화면 덩어리와 같은지
//  ③ 📥 등록 줄은 '진행 중 0개'(숫자만 굵은 글자)가 붙어도 제 열쇠(#p_reg)를 지키는지 · 주문 탭 🧾 주문 상품 전체 보기 줄도 나오는지
//  ④ 새로 생긴 카드(제목이 숫자뿐이어도)가 저절로 편집 목록에 들어가는지
//  ⑤ (11/10) 상품 탭 가격 감시 칸은 엔진 상태가 바뀌어도 열쇠 #p_watch 하나(예전엔 제목에 '판정 중·A단계' 등이 섞여 열쇠가 바뀜)
//  ⑥ 예전 열쇠('b:가격감시판정엔진…')로 저장한 숨김·자리를 새 열쇠로 옮김 — 화면은 그대로 숨고 · 관리자 기기가 서버 값을 한 번 새 열쇠로
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
  // ⑤ (11/10) 상품 탭 가격 감시 칸 — 엔진 상태(판정 중·판정 쉼·전체 정지·설정 읽는 중)가 바뀌어도 열쇠는 #p_watch 하나
  R.watchKey = await p.evaluate(async () => { const keys = []; const c0 = S.prCfg; const W = () => new Promise((r) => setTimeout(r, 250));
    for (const f of [(c) => ({ ...c, killSwitch: false, enabled: true, judgeOff: false, phase: 'A' }), (c) => ({ ...c, killSwitch: false, enabled: false }), (c) => ({ ...c, killSwitch: true }), (c) => ({ ...c, killSwitch: false, enabled: true, judgeOff: false, phase: 'B' })]) { if (S.prCfg) S.prCfg = f(S.prCfg); S._userAt = Date.now(); renderMain(); await W(); const B = tobBlocks(document.getElementById('main')); const b = B.find((x) => x.el.matches('[data-blk="p_watch"]')); keys.push(b ? b.k : 'none'); if (B.some((x) => /^b:가격감시/.test(x.k))) keys.push('old'); }
    S.prCfg = c0; S._userAt = Date.now(); renderMain(); await W(); return keys; });
  // ⑥ 한 번짜리 옮기기 — 서버에 예전 열쇠(엔진 상태 글이 섞인 제목)로 저장한 숨김·자리가 새 열쇠로 옮겨져 그대로 숨고 · 서버 값도 한 번 새 열쇠로 · 다른 열쇠는 그대로
  R.watchMig = await p.evaluate(async () => { const W = () => new Promise((r) => setTimeout(r, 300)); const m = document.getElementById('main'); const base = tobBlocks(m).map((b) => b.k).filter((k) => k !== '#p_watch');
    const oldOrd = ['b:가격감시판정엔진엔진판정쉼확'].concat(base); S.app.tabOrder = { products: oldOrd, orders: ['b:가격감시판정엔진판정중A단계'] }; S.app.tabHide = { products: ['b:가격감시판정엔진판정중A단계', '#p_reg'] }; S._tobMig = 0; window.__FSW = []; S._userAt = Date.now(); renderMain(); await W();
    const c = m.querySelector('[data-blk="p_watch"]'); const B = tobBlocks(m); const w = (window.__FSW || []).filter((x) => /app_settings/.test(x.n) && x.id === 'main'); const v = w[0] && w[0].v || {};
    const r = { hid: !!c && c.style.display === 'none', first: B[0] && B[0].k, regHid: ((m.querySelector('[data-blk="p_reg"]') || {}).style || {}).display === 'none', memO: S.app.tabOrder.products.filter((k) => /^b:가격감시/.test(k)).length + S.app.tabOrder.orders.filter((k) => /^b:가격감시/.test(k)).length, memH: S.app.tabHide.products.join(','), wrote: w.length, wO: JSON.stringify((v.tabOrder || {}).products || []).includes('#p_watch') && !JSON.stringify(v).includes('b:가격감시'), wH: JSON.stringify((v.tabHide || {}).products || []) };
    window.__FSW = []; S._userAt = Date.now(); renderMain(); await W(); r.again = (window.__FSW || []).filter((x) => /app_settings/.test(x.n)).length; /* 한 번만 */
    S.prCfg && (S.prCfg = { ...S.prCfg, killSwitch: !S.prCfg.killSwitch }); S._userAt = Date.now(); renderMain(); await W(); r.hidAfterEngine = (m.querySelector('[data-blk="p_watch"]') || {}).style.display === 'none'; if (S.prCfg) S.prCfg = { ...S.prCfg, killSwitch: !S.prCfg.killSwitch };
    S.app.tabOrder = {}; S.app.tabHide = {}; S._userAt = Date.now(); renderMain(); await W(); return r; });
  console.log(JSON.stringify(R, null, 1).slice(0, 4000), errs.join('|'));
  const ok = !R.miss.length && !R.sheet.length && R.regRow && R.oTop && R.regBold && R.regHidden && R.regBack && R.newCard && R.watchKey.length === 4 && R.watchKey.every((k) => k === '#p_watch')
    && R.watchMig.hid && R.watchMig.first === '#p_watch' && R.watchMig.regHid && R.watchMig.memO === 0 && R.watchMig.memH === '#p_watch,#p_reg' && R.watchMig.wrote === 1 && R.watchMig.wO && R.watchMig.wH === '["#p_watch","#p_reg"]' && R.watchMig.again === 0 && R.watchMig.hidAfterEngine && !errs.length;
  console.log(ok ? '✓ tTOBALL 통과' : '❌ tTOBALL 실패');
});
