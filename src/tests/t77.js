require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const rows = Array.from({ length: 20 }, (_, i) => ({ sellerCode: String(100 + i), sellerName: 'S' + i, price: 5000 + i * 100, grade: '상' }));
    S.plist.set('LXOLD', { id: 'LXOLD', bookId: 'bOld', title: '옛 책', active: false, status: '판매완료', registeredAt: '2025-01-01', listingId: '9', usedCode: 'UOLD' });
    S.plist.set('LXON', { id: 'LXON', bookId: 'bOn', title: '파는 책', active: true, status: '판매중', registeredAt: '2025-01-01', listingId: '8', usedCode: 'UON' });
    const mOld = { id: 'bOld', usedFirstPage: rows, salesPoint: 10 }, mOn = { id: 'bOn', usedFirstPage: rows.slice(0, 5) };
    S.pmetrics.set('bOld', mOld); S.pmetrics.set('bOn', mOn); await idbPut('pmetrics', [mOld, mOn]); S.prodLoaded = true; S.pmLoaded = true;
    p1StripPass(); const a = { old: S.pmetrics.get('bOld')._p1x, oldRows: !!S.pmetrics.get('bOld').usedFirstPage, on: !!S.pmetrics.get('bOn').usedFirstPage, min: S.pmetrics.get('bOld')._p1min, sc: (S.pmetrics.get('bOld')._p1s || []).length, n: S.p1.n };
    const ok = await p1Ensure('bOld'); a.ensured = ok && S.pmetrics.get('bOld').usedFirstPage.length; p1StripPass(); a.keptAfterEnsure = !!S.pmetrics.get('bOld').usedFirstPage; return a; });
  console.log(JSON.stringify(r));
  // product detail re-render path
  await p.evaluate(() => { S.p1.keepT.clear(); const m = S.pmetrics.get('bOld'); S.pmetrics.set('bOld', { id: 'bOld', _p1x: 20, _p1s: ['100'] }); openProduct('LXOLD'); }); await p.waitForTimeout(1500);
  console.log('detail restored', await p.evaluate(() => !!(S.pmetrics.get('bOld').usedFirstPage) + ' ' + JSON.stringify(S.detail) + ' hist ' + history.length));
  console.log('errors', errs);
});
