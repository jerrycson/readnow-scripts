// t97c (10/26): 홈·경영·판매자 탭이 흰 화면 없이 그려짐
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { S.sellers.set('sc_996008', { id: 'sc_996008', sc: '996008', name: '북스킹', shopPeriods: { '최근 6개월': { rating: 0.99, count: 50 } }, cancel3m: 0.01 }); S.sellersLoaded = true; S.ordersLoaded = true; S.reviewsLoaded = true; bump('s'); const out = {};
    for (const t of ['home', 'biz', 'sellers']) { S.tab = t; try { renderMain(); await new Promise((r) => setTimeout(r, 400)); out[t] = (document.querySelector('#main') || document.body).innerText.length; } catch (e) { out[t] = 'ERR ' + e.message; } } return out; });
  console.log(JSON.stringify(r), errs.join(' | ')); console.log(Object.values(r).every((v) => typeof v === 'number' && v > 50) && !errs.length ? '✓ t97c 통과' : '❌ t97c 실패'); });
