// ✎ 탭 첫 화면 편집 (관리자만) — 순서·숨김·홈 카드 넣기·저장 후 다른 기기 반영·관리자 아님·기본값 그대로
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = {}; const W = (ms) => p.waitForTimeout(ms);
  const keys = () => p.evaluate(() => tobBlocks(document.getElementById('main')).map((b) => b.k + (b.el.style.display === 'none' ? '(H)' : '')));
  const go = async (t) => { await p.evaluate((t) => { S.q = ''; S.tab = t; renderTabs(); S._userAt = Date.now(); renderMain(); }, t); await W(700); };
  // 1) 관리자 아님 + 저장 없음 → 편집 단추 없음 · 화면 그대로
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = false; S.app.tabOrder = {}; S.app.tabHide = {}; });
  await go('products');
  R.nonAdminBtn = await p.evaluate(() => !!document.querySelector('#main .taborder'));
  R.base = await keys(); R.baseRaw = await p.evaluate(() => { renderMainNow(); return tobBlocks(document.getElementById('main')).map((b) => b.k); });
  R.sameAsRaw = JSON.stringify(R.base) === JSON.stringify(R.baseRaw);
  R.noMarks = await p.evaluate(() => { afterRender(); return !document.querySelector('#main [data-tobhid], #main [data-tlw]'); });
  // 2) 관리자 → 편집 단추
  await p.evaluate(() => { S.devOk = true; });
  await go('products');
  R.adminBtn = await p.evaluate(() => (document.querySelector('#main .taborder [data-taborder]') || {}).textContent || '');
  // 3) 편집 창: 찾기·넣기·숨기기·순서
  await p.click('#main .taborder [data-taborder]'); await W(400);
  R.sheetTitle = await p.evaluate(() => document.querySelector('#sheet .sh .t').textContent);
  R.sugHasDupes = await p.evaluate(() => !!document.querySelector('#sheet [data-tobcat] [data-tobadd="go_dupes"]') && /어울리는/.test(document.querySelector('#sheet [data-tobcat] b').textContent));
  await p.fill('#tob_q', 'DUPES'); await W(100);
  R.filterVisible = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-tobadd]')].filter((b) => b.style.display !== 'none').map((b) => b.dataset.tobadd));
  await p.click('#sheet [data-tobadd="go_dupes"]'); await W(150);
  const hideKey = await p.evaluate(() => { const r = [...document.querySelectorAll('#sheet [data-ok]')].find((x) => x.dataset.ok.startsWith('sec:')); return r.dataset.ok; });
  await p.click(`#sheet [data-tobhide="${hideKey}"]`); await W(150);
  R.rowHidden = await p.evaluate((k) => document.querySelector(`#sheet [data-ok="${CSS.escape(k)}"]`).classList.contains('tobhid'), hideKey);
  const before = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-ok]')].map((x) => x.dataset.ok));
  await p.click('#sheet [data-dn="1"]'); await W(150);
  const after = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-ok]')].map((x) => x.dataset.ok));
  R.moved = before[1] === after[2] && before[2] === after[1] && after[0] === 'w:go_dupes';
  R.notSavedYet = await p.evaluate(() => !(S.app.tabOrder || {}).products);
  await p.click('#ord_save'); await W(900);
  R.saved = await p.evaluate(() => { const d = (window.__FS.app_settings || {}).main || {}; return { o: (d.tabOrder || {}).products, h: (d.tabHide || {}).products }; });
  R.savedOk = R.saved.o && R.saved.o[0] === 'w:go_dupes' && R.saved.h && R.saved.h.includes(hideKey) && R.saved.o[2] === before[1];
  await go('products');
  R.afterKeys = await keys();
  R.cardShown = await p.evaluate(() => { const c = document.querySelector('#main [data-tlw="go_dupes"]'); return !!c && !!c.querySelector('[data-gopage="dupes"]') && c.offsetParent !== null; });
  R.hiddenApplied = R.afterKeys.includes(hideKey + '(H)');
  R.firstIsCard = R.afterKeys[0] === 'w:go_dupes';
  // 다시 그려도 그대로(두 번 적용해도 숨긴 칸이 앞 칸에 붙지 않음)
  R.stable = await p.evaluate(() => { afterRender(); return tobBlocks(document.getElementById('main')).map((b) => b.k + (b.el.style.display === 'none' ? '(H)' : '')); });
  R.stableOk = JSON.stringify(R.stable) === JSON.stringify(R.afterKeys);
  // 다시 열면 숨김 줄이 보임(되돌릴 수 있게)
  await p.click('#main .taborder [data-taborder]'); await W(300);
  R.reopenHidden = await p.evaluate((k) => { const r = document.querySelector(`#sheet [data-ok="${CSS.escape(k)}"]`); return !!r && r.classList.contains('tobhid'); }, hideKey);
  await p.evaluate(() => history.back()); await W(400);
  // 4) 다른 기기에서 저장한 것(주문·매출 탭 숨김) → 이 기기(관리자 아님)에 반영 · 편집 단추 없음
  await p.evaluate(() => { S.devOk = false; });
  await go('orders');
  const okey = (await keys()).find((k) => k.startsWith('sec:'));
  await p.evaluate((k) => db.collection('app_settings').doc('main').set({ tabHide: { orders: [k] }, tabOrder: { orders: ['w:go_ship'] } }, { merge: true }), okey); await W(1200);
  await go('orders');
  const ok2 = await keys();
  R.otherDev = ok2.includes(okey + '(H)') && ok2.includes('w:go_ship') && !(await p.evaluate(() => !!document.querySelector('#main .taborder')));
  // 5) 검색어가 있으면(검색 결과 화면) 숨김·카드 안 씀
  R.searchClean = await p.evaluate(async () => { S.tab = 'products'; S.q = '같은'; renderMainNow(); afterRender(); const r = !document.querySelector('#main [data-tlw], #main [data-tobhid]'); S.q = ''; return r; });
  // 6) 처음 모양으로 (두 번 눌러 확정)
  await p.evaluate(() => { S.devOk = true; }); await go('products');
  await p.click('#main .taborder [data-taborder]'); await W(300);
  await p.click('#ord_reset'); await W(150);
  R.armed = await p.evaluate(() => /한 번 더/.test(document.getElementById('ord_reset').textContent) && !!((window.__FS.app_settings.main.tabOrder || {}).products));
  await p.click('#ord_reset'); await W(900);
  R.resetDone = await p.evaluate(() => { const d = window.__FS.app_settings.main; return !(d.tabOrder || {}).products && !(d.tabHide || {}).products; });
  await go('products');
  R.afterReset = await keys();
  R.resetSame = JSON.stringify(R.afterReset) === JSON.stringify(R.base);
  console.log(JSON.stringify(R, null, 1).slice(0, 4000), errs.join('|'));
  const ok = !R.nonAdminBtn && R.sameAsRaw && R.noMarks && /첫 화면 편집/.test(R.adminBtn) && /탭 첫 화면 편집/.test(R.sheetTitle) && R.sugHasDupes && R.filterVisible.length === 1 && R.filterVisible[0] === 'go_dupes' && R.rowHidden && R.moved && R.notSavedYet && R.savedOk && R.cardShown && R.hiddenApplied && R.firstIsCard && R.stableOk && R.reopenHidden && R.otherDev && R.searchClean && R.armed && R.resetDone && R.resetSame && !errs.length;
  console.log(ok ? '✓ t98L 통과' : '❌ t98L 실패');
});
