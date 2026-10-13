const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ content: fs.readFileSync('/home/claude/w/out/readnow-products-core.js', 'utf8') });
  const out = await p.evaluate((h) => { const d = new DOMParser().parseFromString(h, 'text/html'); const P = window.ReadnowProducts; const l = { title: '포스트모더니즘 : 이합 핫산의 문화 및 문학 이론/ 정정호 편역/ 종로서적', price: 10000 };
    const qy = P.searchQueryOf(l.title); const th = 0.9; const all = P.parseSearchResults(d).map((r) => ({ ...r, cov: Math.round(P.nameCoverage(qy, r.title) * 1000) / 1000, vol: P.sameVolume(qy, r.title) }));
    const cands = all.filter((r) => r.cov >= 0.5).map((r) => ({ ...r, match: r.cov >= th && r.vol }));
    const M = P.marketNoBook(cands.map((r) => ({ ...r, cov: r.match ? r.cov : 0 })), { match: th, ourPrice: l.price });
    return { qy, all: all.map((r) => [r.itemId, r.cov, r.vol, r.ours, r.cart, (r.channels && r.channels.seller || {}).min, r.title.slice(0, 30)]), M: { n: M.n, median: M.median, low: M.low, cheaper: M.cheaperShare, pts: M.points.map((x) => [x.v, x.ours]) } }; }, fs.readFileSync('us/used_search.html', 'utf8'));
  console.log(JSON.stringify(out, null, 0)); await br.close(); })();
