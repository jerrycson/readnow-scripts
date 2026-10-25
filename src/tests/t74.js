const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route('http://127.0.0.1:8898/**', async (route) => { const q = route.request(); const r = await fetch(q.url(), { method: q.method(), headers: q.headers(), body: q.method() === 'POST' ? q.postData() : undefined }); const b = Buffer.from(await r.arrayBuffer()); route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers.entries()), body: b }); });
  const toastT = () => p.evaluate(() => [...document.querySelectorAll('.toast')].map((x) => x.innerText).join(' | '));
  await p.evaluate(() => { localStorage.removeItem('rn-label'); window.__lbl = ''; window.__rnOpenRaw = () => ({ document: { open() {}, write(h) { window.__lbl = h; }, close() {} } }); S.sec.mg_lbl = true; openMgr(); }); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"] [data-lblmode="pc"]').click()); await p.waitForTimeout(2000);
  await p.evaluate(() => { const s = document.querySelector('[data-sec="mg_lbl"] [data-lblprinter]'); s.value = 'Xprinter XP-365B'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"] [data-lblpre="30x10"]').click()); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"] [data-lbltest]').click()); await p.waitForTimeout(2500);
  console.log('1 mgr pc:', require('fs').readFileSync(SP + 'lph/got.json', 'utf8').slice(0, 120), await p.evaluate(() => JSON.stringify(LBL())));
  // bt mode without bluetooth
  await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"] [data-lblmode="bt"]').click()); await p.waitForTimeout(500);
  console.log('2 bt panel:', await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"]').innerText.replace(/\s+/g, ' ').match(/📱 라벨기.{0,80}/)?.[0]));
  await p.evaluate(() => document.querySelector('[data-sec="mg_lbl"] [data-lbltest]').click()); await p.waitForTimeout(800); console.log('  toast', await toastT());
  // reg note top
  await p.evaluate(() => { const C = LBL(); C.mode = 'win'; localStorage.setItem('rn-label', JSON.stringify(C)); history.back(); }); await p.waitForTimeout(800);
  await p.evaluate(() => openRegNote()); await p.waitForTimeout(2500);
  console.log('3 note top:', await p.evaluate(() => (document.querySelector('.rn-lbl') || {}).innerText));
  await p.evaluate(() => document.querySelector('[data-rnqt]').click()); await p.waitForTimeout(800); console.log('  win html has label:', await p.evaluate(() => /class="l"/.test(window.__lbl)));
  await p.evaluate(() => document.querySelector('[data-lblcfg]').click()); await p.waitForTimeout(500); console.log('  modal:', await p.evaluate(() => !!document.querySelector('.bigask-ov .bigask-c [data-lblmode]')));
  await p.evaluate(() => document.querySelector('.bigask-ov [data-lblpre="50x20"]').click()); await p.waitForTimeout(400); console.log('  modal size now', await p.evaluate(() => document.querySelector('.bigask-ov [data-lblpre="50x20"]').className), await p.evaluate(() => document.querySelector('.rn-lbl small').innerText));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); console.log('  modal closed', await p.evaluate(() => !document.querySelector('.bigask-ov')));
  // product detail
  const pid = await p.evaluate(() => { const l = [...S.plist.values()].find((x) => x.active); S.sku.map.set(l.id, { c: ['a0001', 'a0002'] }); return l.id; });
  await p.evaluate((pid) => openProduct(pid), pid); await p.waitForTimeout(2000);
  console.log('4 detail sku:', await p.evaluate(() => (document.querySelector('.psku') || {}).innerText));
  await p.evaluate(() => { window.__lbl = ''; document.querySelector('.psku .btn[data-skuprint]').click(); }); await p.waitForTimeout(800);
  console.log('  printed', await p.evaluate(() => (window.__lbl.match(/class="l"/g) || []).length));
  await p.evaluate(() => document.querySelector('.psku [data-skucp]').click()); await p.waitForTimeout(400); console.log('  copy toast', await toastT());
  await p.screenshot({ path: SP + 't74.png' }); console.log('errors', errs);
});
