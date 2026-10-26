require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map();
    S.plist.set('LZ1', { id: 'LZ1', listingId: '9001', title: '같은책', isbn13: '9790000000777', aladinItemId: '7777', grade: '상', qty: 1, status: '판매중', active: true, sku: 'YLWNOT_ms', price: 9000 }); S.uinfo = S.uinfo || new Map(); S.uinfo.set('9001', { note: '띠지 없음' });
    const mk = (id, ad) => ({ id, stage: 'pick', isbn: '9790000000777', info: { title: '같은책', isbn13: '9790000000777', itemId: '7777', categories: [{ path: ['국내도서', '소설'] }], page1: [], priceList: 10000, at: t }, grade: 3, qty: 1, price: 4000, source: 'ms', code: 'YLWNOT', codeManual: true, createdAt: t, ...(ad ? { addon: ad } : {}) });
    const a = mk('z1'), b = mk('z2', { date: true }); const F = regFinals([a, b], regCfg()); return [F.get('z1').code, F.get('z2').code]; });
  console.log(JSON.stringify(r), errs.join('|')); console.log(!/\d{6}/.test(r[0]) && /\d{6}/.test(r[1]) && !errs.length ? '✓ t88 통과' : '❌ t88 실패');
});
