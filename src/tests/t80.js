require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluate(async () => { S.plist.set('DL1', { id: 'DL1', listingId: '81', title: '지운 상품', status: '삭제', deletedAt: '2026-10-20T01:00:00Z', usedCode: 'U81' }); S.prodLoaded = true;
    await db.collection('app_settings').doc('sku_seq').set({ n: 120, free: ['a0007', 'a0009', 'a0011', 'a0013'] });
    S.regItems = new Map(); const t = new Date().toISOString(); for (const [k, st] of [['r1', 'pick'], ['r2', 'done'], ['r3', 'post'], ['r4', 'sel']]) { const d = { stage: st, qty: 1, createdAt: t }; await db.collection('reg_items').doc(k).set(d); S.regItems.set(k, { id: k, ...d }); }
    S.leader = true; await regSkuEnsure(); S.sec = S.sec || {}; S.sec.mg_skudel = true; openMgr(); });
  await p.waitForTimeout(2500);
  const box = await p.evaluate(() => (document.getElementById('skudel_box') || {}).innerText || 'NONE'); console.log('box', box.replace(/\s+/g, ' ').slice(0, 500));
  const sk = await p.evaluate(() => JSON.stringify([...S.regItems.keys()].map((k) => [k, (S.regItems.get(k).rnSkus || []).length]))); 
  const sk2 = await p.evaluate(async () => { const o = {}; for (const k of ['r1', 'r2', 'r3', 'r4']) o[k] = ((await db.collection('reg_items').doc(k).get()).data().rnSkus || []).join(','); return JSON.stringify(o); }); console.log('rnSkus', sk2);
  await p.evaluate(() => { const b = document.querySelector('[data-skuret="a0013"]'); b.click(); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('[data-skuret="a0013"]').click()); await p.waitForTimeout(900);
  const d = await p.evaluate(async () => JSON.stringify((await db.collection('app_settings').doc('sku_seq').get()).data())); console.log('seq', d);
  await p.evaluate(() => { const c = document.getElementById('sku_noreuse'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600);
  const d2 = await p.evaluate(async () => (await db.collection('app_settings').doc('sku_seq').get()).data().noReuse); console.log('noReuse', d2, 'errs', errs.join('|'));
  const o = JSON.parse(sk2); const ok = /지운 상품/.test(box) && !o.r1 && !o.r4 && o.r2 === "a0007" && o.r3 === "a0009" && /retired/.test(d) && !/a0013"\]/.test(d.split('retired')[0]) && d2 === true && !errs.length; console.log(ok ? '✓ t80 통과' : '❌ t80 실패');
});
