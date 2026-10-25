const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const r = {};
  await p.evaluate(async () => { const B = db.collection('bench_items'); for (let i = 0; i < 7; i++) await B.doc('111_' + i).set({ sc: '111', id: String(i), title: '책 ' + (i % 3), price: 1000 * (i + 1), firstDay: '2026-10-0' + (i + 1), ...(i % 2 ? { goneDay: '2026-10-2' + i } : {}), lowNow: i === 2, uploadedAt: firebase.firestore.Timestamp.fromMillis(1000 + i) });
    const L = db.collection('bench_lookup_items'); for (let i = 0; i < 5; i++) await L.doc('L' + i).set({ title: '조회 ' + i, isbn: '97900000005' + i + '0', page1: [{ price: 5000 }], uploadedAt: firebase.firestore.Timestamp.fromMillis(2000 + i) });
    openBookSearch(); });
  await p.waitForTimeout(1500); r.cnt = await p.evaluate(() => JSON.stringify(S.bkCnt));
  await p.evaluate(() => document.querySelector('[data-bkl="focus"]').click()); await p.waitForTimeout(2500);
  r.fs = await p.evaluate(() => !!document.querySelector('.bk-fs'));
  await p.evaluate(() => document.querySelector('[data-bks="fgone"]').click()); await p.waitForTimeout(500); r.top = await p.evaluate(() => (document.querySelector('.bk-card .bk-t b') || {}).textContent);
  await p.evaluate(() => document.querySelector('[data-bkl="bench"]').click()); await p.waitForTimeout(2500); r.bench = await p.evaluate(() => Array.isArray(S.bkBench) ? S.bkBench.length : String(S.bkBench));
  // 새로고침 흉내: 메모리만 비우고 다시 열면 저절로 되살아남
  await p.evaluate(() => { S.bkFocus = null; S.bkBench = null; history.back(); }); await p.waitForTimeout(500); await p.evaluate(() => openBookSearch()); await p.waitForTimeout(3000);
  r.restore = await p.evaluate(() => (S.bkFocus && S.bkFocus.done ? S.bkFocus.n : 0) + '/' + (Array.isArray(S.bkBench) ? S.bkBench.length : 0));
  // 오류 창
  await p.evaluate(() => { S.bkErr = { bkb: { code: 'invalid-argument', msg: 'limit too big', got: 0, total: 5, at: new Date().toISOString() } }; bkDraw(); }); r.err = await p.evaluate(() => /서버가 요청 모양을 거절/.test((document.querySelector('.bk-err') || {}).innerText || ''));
  await p.evaluate(() => { const b = document.querySelector('.bk-card'); if (b) b.scrollIntoView(); }); await p.screenshot({ path: SP + 't86.png', clip: { x: 0, y: 0, width: 1100, height: 600 } });
  console.log(JSON.stringify(r), 'errs', errs.join(' | ')); const ok = !/-1/.test(r.cnt) && r.fs && r.bench === 5 && r.restore === '7/5' && r.err && !errs.length; console.log(ok ? '✓ t86 통과' : '❌ t86 실패');
});
