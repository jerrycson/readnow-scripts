require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; }); /* (11/08) 문제 알림은 그 사람 기기에만 — 시험 상품(작업대 1 → JS)이 보이는 JS-MAIN으로 */
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { S.leader = true; for (const k of ['aladin_U215983411','aladin_U215983415','aladin_U215983417']) { const l0 = S.plist.get(k); if (l0) l0.registeredAt = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }  const t = new Date().toISOString();
    await db.collection('reg_items').doc('rt1').set({ test: true, stage: 'done', confirmedAt: t, createdAt: t, final: { title: '테스트 책 1' }, result: { state: 'live', listingId: '404935001', usedCode: 'U215983411' } });
    await db.collection('reg_items').doc('rt9').set({ test: true, mock: true, stage: 'done', confirmedAt: t, createdAt: t, final: { title: '모의 책' }, result: { state: 'mock' } });
    await db.collection('reg_items').doc('rt8').set({ test: true, stage: 'pick', createdAt: t, final: { title: '시험 대기 책' } });
    await new Promise((r) => setTimeout(r, 1200)); const n0 = probAll().size; openProblems(); await new Promise((r) => setTimeout(r, 400));
    const b = document.querySelector('#sheet [data-probfin]'); b.click(); await new Promise((r) => setTimeout(r, 100)); const armed = /한 번 더/.test(b.textContent); b.click(); await new Promise((r) => setTimeout(r, 800));
    const n1 = probAll().size, raw = probAllRaw().size; const d = (await db.collection('prd_problems').doc(probDocId('test', 'aladin_U215983411')).get()).data() || {};
    return { n0, armed, n1, raw, ack: !!d.ack }; });
  console.log(JSON.stringify(r), errs.join('|')); console.log(r.n0 === 1 && r.armed && r.n1 === 0 && r.raw === 1 && r.ack && !errs.length ? '✓ t93 통과' : '❌ t93 실패');
});
