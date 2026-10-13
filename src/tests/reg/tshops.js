const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs'); const path = require('path');
const src = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8'); const code = src.slice(src.indexOf('  const coverKey'), src.indexOf('  async function benchJob'));
const U = '/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/'; const F = 'cd9618b0 87403afe e0454aa8 0125dcf0 cc063162 73ceffa4 1e2df15a 2e8412dc e80b2f1f 843a6813 3994ae33 9175dece fec9b1a7 1ce1f4ea c83b32f4'.split(' ');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (r) => r.request().url().startsWith('data:') ? r.continue() : r.abort());
  for (const k of F) { const f = fs.readdirSync(U).find((x) => x.startsWith(k)); const html = fs.readFileSync(U + f, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
    await p.setContent(html, { waitUntil: 'domcontentloaded' });
    const r = await p.evaluate(`(() => { ${code}; const L = benchParse(document); return { title: document.title, last: benchLastPage(document, document.documentElement.innerHTML), n: L.length, price: L.filter(x=>x.p).length, list: L.filter(x=>x.pl).length, grade: L.filter(x=>x.g).length, g0: L.filter(x=>x.g0).length, cov: L.filter(x=>x.cov).length, low: L.filter(x=>x.low).length, uc: L.filter(x=>x.uc).length, s: L.slice(0,2).map(x=>[x.id,x.uc,x.t.slice(0,20),x.g,x.pl,x.p,x.isbn,x.low,x.au.slice(0,25)]) }; })()`);
    console.log(JSON.stringify(r)); }
  await br.close(); })();
