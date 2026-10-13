const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ content: fs.readFileSync('/home/claude/w/out/readnow-products-core.js', 'utf8') });
  const html = fs.readFileSync(process.argv[2] || 'us/used_search.html', 'utf8');
  const out = await p.evaluate((h) => { const d = new DOMParser().parseFromString(h, 'text/html'); const P = window.ReadnowProducts;
    const R = P.parseSearchResults(d).map((r) => ({ ...r, img: (r.img || '').replace(/^.*\//, '') }));
    const X = [...d.querySelectorAll('.ss_book_box')].map((b) => ({ id: b.getAttribute('itemid'), ck: (b.querySelector('input[name^="chkCart."]') || {}).name, txt: b.textContent.replace(/\s+/g, ' ').slice(0, 400) }));
    return { R, X, ver: P.VERSION }; }, html);
  console.log(JSON.stringify(out, null, 1)); await br.close(); })();
