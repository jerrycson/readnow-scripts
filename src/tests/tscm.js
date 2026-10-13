const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ content: fs.readFileSync('/home/claude/w/out/readnow-products-core.js', 'utf8') });
  const out = await p.evaluate((h) => { const d = new DOMParser().parseFromString(h, 'text/html'); const r = window.ReadnowProducts.parseScmList(d); return { keys: Object.keys(r.rows[0] || {}), rows: r.rows.map((x) => JSON.stringify(x).slice(0, 400)) }; }, fs.readFileSync('us/scm.html', 'utf8'));
  console.log(out.keys.join(',')); out.rows.slice(0, 25).forEach((x) => console.log(x)); await br.close(); })();
