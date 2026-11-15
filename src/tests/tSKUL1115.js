// tSKUL1115 — 4시간 점검 11/15 🪶 · 휴대폰 출고 화면 상품 한 줄 받기(shipSkuL·shipLiteNb)는 하나 올 때마다가 아니라 다 오거나 2.5초 조용할 때 한 번만 다시 그림
// 쓰는 법: RN_PORT=<포트> node tSKUL1115.js
const H = require('./harness.js');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const seed = () => { const FS = (window.__FS = window.__FS || {}); FS.prd_listings = FS.prd_listings || {};
  for (let i = 0; i < 40; i++) FS.prd_listings['Z' + i] = { listingId: 'Q' + i, title: '시험 책 ' + i, sku: 'BLKZZ' + i, bookId: 'B' + i };
  try { localStorage.setItem('rn-ship-view', 'order'); } catch (e) {} };
(async () => {
  await H(async (p) => {
    await p.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }); });
    await p.addInitScript(seed);
    await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html?go=confirm'); await p.waitForTimeout(5000);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; o.open = !!(S.detail && S.detail.ship);
      const oS = window.shipRedrawSoon; let n = 0; window.shipRedrawSoon = function () { n++; };
      try { S._skuL = new Map(); for (let i = 0; i < 40; i++) shipSkuL('Q' + i); shipSkuL('없는번호'); await W(3200); o.n40 = n; o.got = [...S._skuL.values()].filter(Boolean).length; o.pend = S._lkP;
        n = 0; shipSkuL('Q1'); await W(500); o.nCached = n;
        n = 0; for (let i = 0; i < 3; i++) shipSkuL('없음' + i); await W(3200); o.nNone = n; o.pend2 = S._lkP;
        n = 0; S._skuL.delete('Q5'); shipSkuL('Q5'); await W(800); o.nOne = n;
      } finally { window.shipRedrawSoon = oS; }
      return o; });
    console.log(JSON.stringify(R));
    ok(R.open, '휴대폰 출고 화면 열림');
    ok(R.got === 40, `상품 한 줄 40개 모두 받음 (${R.got})`);
    ok(R.n40 >= 1 && R.n40 <= 2, `40줄 받는 동안 다시 그리기 1~2번 (예전 40번 · 지금 ${R.n40})`);
    ok(R.pend === 0 && R.pend2 === 0, '받는 중 셈이 0으로 돌아옴');
    ok(R.nNone === 0, `못 찾은 줄만이면 다시 그리지 않음 (${R.nNone})`);
    ok(R.nCached === 0, '이미 받은 줄은 다시 묻지도 그리지도 않음');
    ok(R.nOne === 1, `한 줄만 오면 바로 한 번 (${R.nOne})`);
  });
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
