// t97b (10/26): 🧭 전략 화면의 이번 달 예상 영업이익 = 경영 탭과 같은 opForecast 값 · 출고 고객 표시(.sci-pop) 아무 데나 누르면 닫힘
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {};
  R.st = await p.evaluate(async () => { S.ordersLoaded = true; S.pmLoaded = true; S.prBatches = []; const X = opForecast(); const pr = openStrategy(); await Promise.race([pr, new Promise((r) => setTimeout(r, 4000))]); const t = document.querySelector('#sheet').innerHTML; return [t.includes(won(Math.round(X.op))), t.includes('data-ipop="opfc"')]; });
  await p.click('#sheet [data-ipop="opfc"]'); await p.waitForTimeout(150); R.p1 = await p.evaluate(() => (document.querySelector('.rn-ipop') || {}).innerText || ''); await p.click('.rn-ipop'); await p.waitForTimeout(100); R.p2 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  // sci-pop: 가짜 정보로 열고 안을 누르면 닫힘 · 연 단추 다시 누르면 닫힘
  await p.evaluate(() => { history.back(); window.shipCustInfo = () => ({ r: { c: null, how: '시험' }, o: { buyer: '홍길동' }, items: [{ ic: '⭐', label: 'VIP', why: '시험' }] }); const b = document.createElement('button'); b.dataset.sci = 'x'; b.id = 'scib'; b.textContent = '고객'; b.style.cssText = 'position:fixed;left:30px;top:200px;z-index:60'; document.body.appendChild(b); });
  await p.waitForTimeout(200); await p.click('#scib'); await p.waitForTimeout(100); R.s1 = await p.evaluate(() => document.querySelectorAll('.sci-pop').length); await p.click('.sci-pop'); await p.waitForTimeout(100); R.s2 = await p.evaluate(() => document.querySelectorAll('.sci-pop').length);
  await p.click('#scib'); await p.waitForTimeout(100); R.s3 = await p.evaluate(() => document.querySelectorAll('.sci-pop').length); await p.click('#scib', { force: true }); await p.waitForTimeout(100); R.s4 = await p.evaluate(() => document.querySelectorAll('.sci-pop').length);
  console.log(JSON.stringify(R).slice(0, 600), errs.join(' | '));
  const ok = R.st[0] && R.st[1] && R.p1.includes('같은 계산 하나') && R.p2 === 0 && R.s1 === 1 && R.s2 === 0 && R.s3 === 1 && R.s4 === 0 && !errs.length;
  console.log(ok ? '✓ t97b 통과' : '❌ t97b 실패');
});
