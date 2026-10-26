require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); const it = { id: 'nx1', stage: 'pick', branch: 1, method: 'new', q: '', createdAt: t, newInfo: {} }; S.regItems.set('nx1', it); await db.collection('reg_items').doc('nx1').set(it);
    await regSetNew('nx1', { titleCore: '[세트] 해리포터 1~7권' }); const N = regNew(S.regItems.get('nx1')); await regSetNew('nx1', { titleCore: '해리포터 1~7권' }); const N2 = regNew(S.regItems.get('nx1'));
    return { t: N.title, pre: N.tPre, core: N.titleCore, t2: N2.title }; });
  console.log(JSON.stringify(r), errs.join('|')); console.log(r.t === '[세트] 해리포터 1~7권' && (r.pre || []).includes('[세트]') && r.t2 === '[세트] 해리포터 1~7권' && !errs.length ? '✓ t99 통과' : '❌ t99 실패');
});
