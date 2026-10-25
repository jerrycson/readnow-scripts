require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; });
  for (const t of ['products', 'purchase', 'biz', 'orders']) { await p.evaluate((t) => { S._userAt = Date.now(); uxTabGo(t); }, t); await p.waitForTimeout(3500); console.log('==', t, await p.evaluate(() => { const m = document.querySelector('#main'); return tobTabKey(m, S.tab) + ' ' + JSON.stringify(tobBlocks(m).map((b) => b.k)); })); }
  await p.evaluate(() => { S._userAt = Date.now(); uxTabGo('products'); }); await p.waitForTimeout(4000);
  const before = await p.evaluate(() => tobBlocks(document.querySelector('#main')).map((b) => b.k));
  console.log('admin', await p.evaluate(() => isAdminDevice()), await p.evaluate(() => S.tab + ' ' + tobBlocks(document.querySelector('#main')).map((b) => b.k).slice(0, 3)));
  await p.evaluate(() => document.querySelector('[data-taborder]').click()); await p.waitForTimeout(600);
  console.log('sheet', await p.evaluate(() => !!document.querySelector('#ord_save')), await p.evaluate(() => [...document.querySelectorAll('[data-ok]')].slice(0, 3).map((x) => x.dataset.ok).join(',')));
  await p.evaluate(() => { const n = document.querySelectorAll('[data-ok]').length; for (let i = n - 1; i > 0; i--) document.querySelector(`[data-up="${i}"]`).click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#ord_save').click()); await p.waitForTimeout(2000);
  const after = await p.evaluate(() => tobBlocks(document.querySelector('#main')).map((b) => b.k));
  console.log('moved', after[0] === before[before.length - 1], after.slice(0, 3), 'keys', await p.evaluate(() => JSON.stringify(Object.keys(S.app.tabOrder || {}))));
  console.log('dom first', await p.evaluate(() => { const m = document.querySelector('#main'); return [...m.children].slice(0, 3).map((x) => x.className + '#' + x.id).join(' , '); }));
  console.log('saved', await p.evaluate(() => JSON.stringify(S.app.tabOrder.products).slice(0, 200)));
  console.log('manual', await p.evaluate(() => { const m = document.querySelector('#main'); try { applyTabOrder(m, 'products'); } catch (e) { return 'ERR ' + e.message; } return tobBlocks(m).map((b) => b.k).slice(0, 3).join(','); }));
  console.log('errors', errs);
});
