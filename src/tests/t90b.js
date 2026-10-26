// 🧯 문제 상품 — 상품 전체 표 맨 위·띠 · 홈 알림 · DUPES 맨 위 · 문제 없을 때 그대로
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { S.leader = true; const t = new Date().toISOString(); const l7 = S.plist.get('aladin_U215983417'); S.plist.set(l7.id, { ...l7, sku: 'DUPES' }); const l8 = S.plist.get('aladin_U215983418'); S.plist.set(l8.id, { ...l8, sku: 'DUPES', registeredAt: '2026-10-29T00:00:00' });
    const all0 = [...S.plist.values()]; const same = probPin(all0) === all0;
    await db.collection('reg_items').doc('rt9').set({ test: true, stage: 'done', confirmedAt: t, createdAt: t, result: { state: 'live', listingId: '404935007', usedCode: 'U215983417' } }); await new Promise((r) => setTimeout(r, 1200));
    openProdAll(); await new Promise((r) => setTimeout(r, 400)); const sh = document.getElementById('sheet'); const tr = sh.querySelector('tr[data-btpid]'); const band = !!(tr && tr.querySelector('.probband.t'));
    history.back(); await new Promise((r) => setTimeout(r, 300)); openDupes(); await new Promise((r) => setTimeout(r, 300)); const d1 = sh.querySelector('tr.probtr'); const dfirst = sh.querySelector('.tbl tr.probtr') === sh.querySelectorAll('.tbl tr')[1];
    history.back(); await new Promise((r) => setTimeout(r, 300)); S.tab = 'home'; renderMainNow(); await new Promise((r) => setTimeout(r, 1500)); renderMainNow(); await new Promise((r) => setTimeout(r, 300)); const al = document.querySelector('#main [data-alert="prob"]');
    return { same, first: tr && tr.dataset.btpid, band, d1: !!d1, dfirst, al: al ? al.textContent : null }; });
  console.log(JSON.stringify(r));
  const ok = r.same && r.first === 'aladin_U215983417' && r.band && r.d1 && r.dfirst && /시험 상품 1개/.test(r.al || '');
  console.log(ok && !errs.length ? '✓ t90b 통과' : '❌ t90b 실패 ' + errs.join(' | '));
});
