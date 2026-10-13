const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (rt) => rt.fulfill({ body: '<html><head></head><body></body></html>', contentType: 'text/html' })); await p.goto('http://t.test/'); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  
  await p.evaluate(() => { const st = {}; window.GM_getValue = (k, d) => (k in st ? JSON.parse(st[k]) : d); window.GM_setValue = (k, v) => { st[k] = JSON.stringify(v); }; window.GM_listValues = () => Object.keys(st); window.GM_deleteValue = (k) => { delete st[k]; };
    window.__W = []; window.__fail = 0; const docs = {}; window.__docs = docs;
    window.firebase = { apps: [1], auth: () => ({ currentUser: { email: 'x' } }), firestore: Object.assign(() => ({ collection: (c) => ({ doc: (id) => ({ set: async (v) => { if (window.__fail > 0) { window.__fail--; throw Object.assign(new Error('unavailable'), { code: 'unavailable' }); } const d = (docs[id] = docs[id] || new Set()); v.lines.__v.forEach((l) => d.add(l)); window.__W.push(id); } }) }) }), { FieldValue: { arrayUnion: (...x) => ({ __v: x }) } }) }; });
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/jr.js', 'utf8') });
  const r = await p.evaluate(async () => { const w = (ms) => new Promise((x) => setTimeout(x, ms)); for (let i = 0; i < 900; i++) window.__rnLog('상품', 'detail', '줄 ' + i); window.__fail = 1; await window.__rnFlush(); const a = Object.values(window.__docs).reduce((s, d) => s + d.size, 0);
    await window.__rnFlush(); const b = Object.values(window.__docs).reduce((s, d) => s + d.size, 0);
    for (const k of Object.keys(window.__docs)) delete window.__docs[k]; GM_setValue('rnu-log-upled', {}); const bf = await window.__rnLogBackfill(true); const c = Object.values(window.__docs).reduce((s, d) => s + d.size, 0); const bf2 = await window.__rnLogBackfill(true);
    return { afterFail: a, afterRetry: b, backfill: bf, refilled: c, again: bf2 }; });
  console.log(JSON.stringify(r), errs.slice(0, 3)); await br.close(); })();
