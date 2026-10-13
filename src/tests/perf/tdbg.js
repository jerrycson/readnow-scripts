const base = require('fs').readFileSync(__dirname + '/tnew.js', 'utf8');
const cut = base.indexOf('  const T = {};');
const head = base.slice(0, cut);
eval(head.replace("(async () => {", "(async () => {").replace(/$/, '') + `
  const r = await p.evaluate(() => { S.tab = 'products'; renderTabs(); renderMainNow(); const b1 = document.querySelector('#reg_open'); const keys = Object.keys(b1); const pk = Object.keys(b1.parentElement); const m = document.querySelector('#main'); const top1 = [...m.children].map((c) => c.tagName + '.' + c.className + (c.id ? '#' + c.id : '')); bump('p'); const html = (() => { const t = document.createElement('div'); return null; })(); renderMainNow(); const top2 = [...m.children].map((c) => c.tagName + '.' + c.className + (c.id ? '#' + c.id : '')); return { keys, pk, top1: top1.slice(0, 8), top2: top2.slice(0, 8), same: b1 === document.querySelector('#reg_open'), mainKeys: !!Object.getOwnPropertyDescriptor(m, "innerHTML"), morphFlag: !!m.__morph, off: localStorage.getItem("rn-nomorph") }; });
  console.log(JSON.stringify(r, null, 1)); await br.close(); })();`);
