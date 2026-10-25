require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  for (const tab of ['home', 'biz', 'products', 'orders', 'customers', 'sellers', 'purchase', 'settings']) { await p.evaluate((t) => { S._userAt = Date.now(); S.homeAdmin = { widgets: Object.keys(WIDGETS) }; localStorage.removeItem('rn-home'); S.tab = t; renderTabs(); renderMain(); }, tab); await p.waitForTimeout(1500); }
  await p.evaluate(() => { for (const k of ['sold30', 'sold365']) try { openDrill && 0; } catch (e) {} });
  console.log('errs', errs.join(' | ')); console.log(!errs.length ? '✓ t85 통과' : '❌ t85 실패');
});
