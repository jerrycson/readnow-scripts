// 속도 고침 시험: 홈 요약 쓰기(쉬며 한 칸씩·잡아 두기) · 숨은 탭 그리기 미룸 · 도서 정보 검색 묶음(옛 값 먼저→쉴 때 새로) · 취소 대조 색인 · 관찰 조건 합친 값 · 벤치마킹 기록 bump('b')
require('./harness.js')(async (p) => { const R = {}; const fails = [];
  await p.evaluate(() => localStorage.setItem('rn-match-at', String(Date.now())));
  await p.evaluate(require('./seedBig.js')); await p.waitForTimeout(2500);
  // 1) homeSumSoon — 여러 번 불러도 타이머 하나 · 한 번의 쓰기가 긴 작업 하나로 굳지 않음
  R.hs = await p.evaluate(async () => { S._allLoaded = true; S._hsT = 0; const LT = []; const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => LT.push(e.duration))); po.observe({ type: 'longtask' });
    window.__FSW = []; for (let i = 0; i < 20; i++) homeSumSoon(); const t0 = Date.now(); for (let i = 0; i < 100 && !(window.__FSW || []).some((w) => w.n === 'app_summary'); i++) await new Promise((r) => setTimeout(r, 200));
    po.disconnect(); const w = (window.__FSW || []).filter((x) => x.n === 'app_summary'); return { writes: w.length, keys: w[0] ? Object.keys(w[0].v.w || {}).length : 0, ms: Date.now() - t0, ltMax: Math.round(Math.max(0, ...LT)) }; });
  if (R.hs.writes !== 1 || R.hs.keys < 5) fails.push('홈 요약 쓰기 ' + JSON.stringify(R.hs));
  R.hs2 = await p.evaluate(async () => { window.__FSW = []; homeSumSoon(); homeSumSoon(); await new Promise((r) => setTimeout(r, 2500)); return (window.__FSW || []).filter((x) => x.n === 'app_summary').length; }); // 앞 쓰기에서 15초 안 → 아직 안 씀
  if (R.hs2 !== 0) fails.push('15초 안 두 번째 쓰기 ' + R.hs2);
  // 2) 숨은 탭 — renderMain이 그리지 않고, 보이면 한 번
  await p.evaluate(async () => { while (performance.now() < 31000) await new Promise((r) => setTimeout(r, 500)); }); // 연 뒤 30초 동안은 예전처럼 그림
  R.hid = await p.evaluate(async () => { S.tab = 'home'; renderTabs(); S._userAt = 0; let n = 0; const f0 = window.renderMainNow; window.renderMainNow = function () { n++; return f0.apply(this, arguments); };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); renderMain(); renderMain(); await new Promise((r) => setTimeout(r, 300)); const whileHidden = n;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); await new Promise((r) => setTimeout(r, 300)); const after = n; window.renderMainNow = f0; delete document.hidden; return { whileHidden, after }; });
  if (R.hid.whileHidden !== 0 || R.hid.after < 1) fails.push('숨은 탭 ' + JSON.stringify(R.hid));
  // 2b) 스크롤 중 뒤 화면 다시 그리기 미룸 — 멈추고 0.7초 뒤 한 번 · 사람이 누른 것은 바로
  R.scr = await p.evaluate(async () => { let n = 0; const f0 = window.renderMainNow; window.renderMainNow = function () { n++; return f0.apply(this, arguments); }; S._userAt = 0; S._scrAt = Date.now(); renderMain(); await new Promise((r) => setTimeout(r, 300)); const during = n; await new Promise((r) => setTimeout(r, 1200)); const after = n;
    S._scrAt = Date.now(); S._userAt = Date.now(); renderMain(); await new Promise((r) => setTimeout(r, 120)); const userN = n - after; window.renderMainNow = f0; return { during, after, userN }; });
  if (R.scr.during !== 0 || R.scr.after < 1 || R.scr.userN < 1) fails.push('스크롤 미룸 ' + JSON.stringify(R.scr));
  // 3) 도서 정보 검색 — 처음엔 바로 셈, 상품만 바뀌면 옛 묶음 바로 → 쉴 때 새 묶음 + 다시 그림
  R.bk = await p.evaluate(async () => { S._userAt = Date.now(); openBookSearch(); await new Promise((r) => setTimeout(r, 800)); const a = bkRows(); const a2 = bkRows(); bump('o'); const a3 = bkRows();
    const l = S.plist.get('aladin_U31000005'); S.plist.set(l.id, { ...l, price: 99999 }); bump('p'); let draws = 0; const d0 = window.bkDraw; window.bkDraw = function () { draws++; return d0.apply(this, arguments); };
    let t = performance.now(); const b = bkRows(); const staleMs = performance.now() - t; await new Promise((r) => setTimeout(r, 3500)); const c = bkRows(); window.bkDraw = d0;
    const row = c.find((x) => (x.L || []).some((y) => y.id === 'aladin_U31000005')); const newP = row && row.L.find((y) => y.id === 'aladin_U31000005').price; history.back(); await new Promise((r) => setTimeout(r, 500));
    return { sameNoChange: a === a2, sameAfterOrder: a === a3, stale: b === a, staleMs: Math.round(staleMs), fresh: c !== a, draws, newP }; });
  if (!R.bk.sameNoChange || !R.bk.sameAfterOrder || !R.bk.stale || !R.bk.fresh || R.bk.draws < 1 || R.bk.staleMs > 30) fails.push('도서 정보 검색 ' + JSON.stringify(R.bk));
  // 4) 취소 대조 — 상품 색인은 주문만 바뀌면 그대로, 결과는 새 주문을 반영
  R.cx = await p.evaluate(() => { const o = [...S.orders.values()][5]; const la = [...S.plist.values()].find((l) => l.active && l.usedCode); const it = { title: la.title, isbn13: la.isbn13, sku: la.sku, price: la.price, qty: 1, aladinUsedCode: la.usedCode }; const n0 = cancelHits().size; const idx0 = MEMO.get('cxIdx').r;
    S.orders.set('cxT1', { ...o, id: 'cxT1', orderNo: '777000111', kind: 'sale', orderedAt: new Date().toISOString(), items: [{ ...it, lineStatus: 'cancelledInOrder' }] }); bump('o');
    const H = cancelHits(); const idx1 = MEMO.get('cxIdx').r; S.plist.set(la.id, { ...la, qty: 1 }); bump('p'); cancelHits(); const idx2 = MEMO.get('cxIdx').r; S.orders.delete('cxT1'); bump('o');
    return { n0, n1: H.size, idxKept: idx0 === idx1, idxNewOnP: idx2 !== idx1, cancelLs: typeof CANCEL_LS === 'object' ? Object.keys(CANCEL_LS).slice(0, 4) : null }; });
  if (!R.cx.idxKept || !R.cx.idxNewOnP || R.cx.n1 !== R.cx.n0 + 1) fails.push('취소 대조 색인 ' + JSON.stringify(R.cx));
  // 5) 관찰 조건 — 같은 결과 · 조건 값을 바꾸면 새 값으로
  R.obs = await p.evaluate(() => { const A = { a: 'x', p: { th: 5 } }; const atom = { p: { th: 1, z: 2 }, f: (x, P) => x.v >= P.th && P.z === 2 }; OBS_ATOM.__t = atom; const s = { conds: [{ a: '__t', p: { th: 5 } }] };
    const r1 = [1, 5, 9].map((v) => obsSlotMatch(s, { v })); const s2 = { conds: [{ a: '__t', p: { th: 9 } }] }; const r2 = [1, 5, 9].map((v) => obsSlotMatch(s2, { v })); delete OBS_ATOM.__t; return { r1, r2 }; });
  if (JSON.stringify(R.obs) !== JSON.stringify({ r1: [false, true, true], r2: [false, false, true] })) fails.push('관찰 조건 ' + JSON.stringify(R.obs));
  // 6) 벤치마킹 기록 bump('b') — 상품 계산(재고) 기억은 그대로
  R.b = await p.evaluate(() => { const v0 = memoVer('prodSk'); const vb0 = memoVer('bkRows_x'); bump('b'); return { prodKept: memoVer('prodSk') === v0, bkNew: memoVer('bkRows_x') !== vb0 }; });
  if (!R.b.prodKept || !R.b.bkNew) fails.push('bump b ' + JSON.stringify(R.b));
  console.log(JSON.stringify(R)); console.log(fails.length ? '❌ tspd 실패: ' + fails.join(' / ') : '✓ tspd 통과');
});
