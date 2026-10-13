// 큰 가짜 자료 — 페이지 안에서 실행 (window.__mkData(n))
window.__mkData = function (N, opt) {
  opt = opt || {}; const rnd = (() => { let s = 12345; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
  const G = ['최상', '상', '중']; const SK = ['BLKCMN', 'ORGCMC', 'KHKDVD', 'BLKNOV_ms', 'ORGSCI_hd', 'PND01', 'BLKART'];
  S.plist = new Map(); S.pbooks = new Map(); S.pmetrics = new Map(); S.psales = S.psales || new Map();
  const now = Date.now(); const iso = (t) => new Date(t).toISOString();
  for (let i = 0; i < N; i++) { const u = String(100000 + i); const bid = 'b' + (i % Math.floor(N * 0.85)); const price = 1000 + Math.round(rnd() * 30) * 500; const reg = now - Math.round(rnd() * 900) * 864e5;
    const active = rnd() > 0.15; const l = { id: 'aladin_' + u, usedCode: u, listingId: 'L' + u, title: '책 제목 ' + i + ' 이야기와 역사', price, status: active ? '판매중' : '판매완료', active, sku: SK[i % SK.length] + String(i % 97).padStart(3, '0'), grade: G[i % 3], bookId: bid, isbn13: '979' + String(1000000000 + i), registeredAt: iso(reg), qty: 1, publisher: '출판사' + (i % 300), priceList: price * 2, lastSeenAt: iso(now - 3600e3) };
    S.plist.set(l.id, l);
    if (!S.pbooks.has(bid)) { S.pbooks.set(bid, { id: bid, aladinItemId: String(500000 + i), priceList: price * 2, pubDate: '20' + String(10 + (i % 15)) + '-03-01', isbn13: l.isbn13, title: l.title });
      const P1 = []; const n1 = 4 + Math.floor(rnd() * 10); for (let k = 0; k < n1; k++) P1.push({ sellerCode: 2000 + Math.floor(rnd() * 400), sellerName: '판매자' + k, grade: G[Math.floor(rnd() * 3)], price: Math.max(500, price + Math.round((rnd() - 0.5) * 8) * 500), ship: rnd() > 0.5 ? 0 : 3000, listingId: 'Q' + i + '_' + k, usedCode: 'X' + i + '_' + k });
      if (rnd() > 0.5) P1.splice(Math.floor(rnd() * P1.length), 0, { sellerCode: 996008, sellerName: '북스킹', grade: l.grade, price, ship: 0, listingId: l.listingId, usedCode: u });
      P1.sort((a, b) => a.price - b.price);
      S.pmetrics.set(bid, { id: bid, usedFirstPage: P1, lastCheckedAt: iso(now - rnd() * 10 * 864e5), usedTotal: P1.length + Math.floor(rnd() * 20), buyback: rnd() > 0.6 ? { '최상': Math.round(price * 0.2), '상': Math.round(price * 0.15) } : null, priceSales: price * 1.8 }); } }
  S.sellers = new Map(); for (let k = 0; k < 400; k++) S.sellers.set('sc_' + (2000 + k), { id: 'sc_' + (2000 + k), sellerCode: 2000 + k, name: '판매자' + k, total: 100 + k });
  S.orders = S.orders || new Map(); if (opt.orders) { const L = [...S.plist.values()]; for (let i = 0; i < opt.orders; i++) { const l = L[Math.floor(rnd() * L.length)]; const at = iso(now - Math.round(rnd() * 700) * 864e5); S.orders.set('o' + i, { id: 'o' + i, orderNo: '001-' + i, kind: 'sale', orderedAt: at, customerId: 'c' + (i % 5000), items: [{ aladinUsedCode: l.usedCode, title: l.title, qty: 1, price: l.price, isbn13: l.isbn13, lineStatus: 'shipped' }], total: l.price }); } S.ordersLoaded = true; }
  S.prodLoaded = true; S.pmLoaded = true; S.sellersLoaded = true; bump('p'); bump('o'); bump('s');
  // 그룹
  const groups = []; const keys = [...S.plist.values()].filter((l) => l.status === '판매중'); for (let g = 0; g < (opt.groups || 6); g++) { const cond = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '그룹' + g, grades: g % 2 ? ['상'] : [], pmin: g * 1000, sku: g === 0 ? 'BLK' : '' }; const picks = {}; keys.slice(g * 300, g * 300 + 120).forEach((l) => (picks['aladin_' + l.usedCode] = { price: l.price - 500, at: iso(now - 3600e3) })); groups.push({ id: 'b_g' + g, name: '그룹' + g, cond, picks, decided: {}, start: {}, undone: {}, ctrl: {}, createdAt: iso(now - g * 864e5), lastCount: 1000 }); }
  S.prBatches = groups; S.prCfg = S.prCfg || { watchVer: '0.9.0', watchTab: 't', watchPc: 'PC', watchBeat: iso(now), enabled: true, batchOff: {} };
  return { listings: S.plist.size, books: S.pbooks.size, groups: groups.length };
};
