// 🧯 문제 상품 카드 — 출처 줄(작업대) · 작업대에서 보기(카드로 가서 빨간 테두리) · 상품 상세 이동
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { S.leader = true; const t = new Date().toISOString();
    await db.collection('reg_items').doc('rt1').set({ test: true, stage: 'done', ws: 'main', by: 'a@b.c', confirmedAt: t, createdAt: t, final: { title: '테스트 책 1' }, info: { title: '테스트 책 1' }, result: { state: 'live', listingId: '404935001', usedCode: 'U215983411' } });
    await new Promise((r) => setTimeout(r, 1200)); openProblems(); await new Promise((r) => setTimeout(r, 500));
    const sh = document.querySelector('#sheet'); const src = sh.querySelector('.probsrc'); const btn = sh.querySelector('[data-probreg]'); const pd = sh.querySelector('[data-probpd]');
    const o = { src: src ? src.textContent : null, reg: !!btn, pd: !!pd };
    btn.click(); await new Promise((r) => setTimeout(r, 2500)); o.regOpen = !!(S.detail && S.detail.reg); o.pick = !!document.querySelector('.probpick'); o.stage = S.regT; return o; });
  console.log(JSON.stringify(r), errs.join('|'));
  console.log(r.src && /작업대/.test(r.src) && r.reg && r.pd && r.regOpen && r.stage === 'done' && !errs.length ? '✓ t91 통과' : '❌ t91 실패');
});
