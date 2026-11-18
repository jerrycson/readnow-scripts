// tSHIPNOTE1118 — (정범님 11/18 I-1118-1947-22.6·22.7 · shipnote1) 출고 탭 전체 유의 사항 다시 읽기 단추(모든 등급) · 이득·손해 정렬(시장 줄 색을 모를 때도 — 11/18 shipfix2부터 카드 평가 % 와 같은 값)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
    const A = [...S.plist.values()]; const now = new Date().toISOString(); const sh = () => document.getElementById('sheet');
    ['가 책', '나 책', '다 책', '라 책'].forEach((t, i) => { A[i].title = t; A[i].status = '판매중'; A[i].active = true; A[i].qty = 1; A[i].price = 10000; A[i].grade = '상'; });
    const it = (l) => ({ listingId: l.listingId, title: l.title, price: 10000, qty: 1, sku: l.sku, grade: '상' });
    const mk = (p) => ({ at: now, usedTotal: 5, isbnOk: true, rows: [{ r: 1, n: 'x', sc: '1', g: '상', p, s: 2500, lid: '999', so: 0, c: 'green' }] });
    const en = {}; [9000, 12000, null, 15000].forEach((p, i) => { en[String(A[i].listingId)] = { grade: '상', mkt: p ? mk(p) : null, via: 'isbn' }; });
    S.shipC = { orders: [], at: now, enrich: en }; S.shipCFromCache = false;
    S.ship = { orders: [0, 1, 2, 3].map((i) => ({ orderNo: 'G-' + (i + 1), buyer: '손님' + i, orderedAt: '2026-11-15 09:0' + i, items: [it(A[i])] })), tabCounts: {}, at: now }; S._shipLive = 1;
    await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(400);
    o.g = S.ship.orders.map((x) => { try { return shipGainOf(x); } catch (e) { return 'ERR ' + e.message; } });
    try { localStorage.removeItem('rn-ship-sort'); localStorage.setItem('rn-ship-view', 'order'); localStorage.setItem('rn-ship-warntop', '0'); } catch (e) {} if (typeof SRT === 'object' && SRT.r) SRT.r.ship = false;
    S.shipSort = null; S.shipView = 'order'; S.shipSrc = 'all'; S.shipTab = 'deliv'; await openShip(); await W(600);
    const ords = () => [...sh().querySelectorAll('section.shp-o[data-anc^="o:G-"]')].map((s) => s.dataset.anc.slice(2));
    o.g2 = S.ship.orders.map((x) => { try { return shipGainOf(x); } catch (e) { return 'ERR ' + e.message; } });
    const gb = () => sh().querySelector('[data-ss="gain"]'); if (gb()) { gb().click(); await W(500); } o.gain = ords(); o.ss = S.shipSort; o.rev = SRT.r.ship;
    if (gb()) { gb().click(); await W(500); } o.loss = ords(); o.rev2 = SRT.r.ship;
    /* 📝 탭 전체 단추 — 상 등급 포함 4개 · 두 번 눌러 상품마다 맡긴 일 */
    const nb = () => sh().querySelector('[data-nall]'); o.nall = nb() ? nb().textContent : null; o.nask = [...sh().querySelectorAll('section.shp-o[data-anc^="o:G-"] [data-nask]')].map((b) => b.dataset.ngr);
    if (nb()) { nb().click(); await W(250); noteRefresh(A[0].listingId); await W(450); nb().click(); await W(1500); } /* 사이에 다른 상품 줄이 다시 그려져도 무장이 남는지 */ o.cmds = []; for (const i of [0, 1, 2, 3]) { try { const d = await db.collection('shp_cmds').doc('ui_' + A[i].listingId).get(); o.cmds.push(d.exists ? (d.data().type + ':' + d.data().grade) : null); } catch (e) { o.cmds.push('ERR ' + e.message); } }
    o.run = !!(S._nAll && S._nAll.sent === 4);
    o.prog = (sh().querySelector('#shp_nall') || {}).textContent || '';
    /* 휴대폰(판매자 기록 없음)처럼 시장 줄 색이 「모름」이어도 이득이 셈 되는지 */
    Object.values(en).forEach((x) => { if (x.mkt) x.mkt.rows.forEach((r) => { r.c = 'unknown'; }); }); S._gainENt = 0; o.gU = S.ship.orders.map((x) => { try { return shipGainOf(x); } catch (e) { return 'ERR ' + e.message; } }); o.gC = S.ship.orders.map((x) => { try { const EN = { ...((S.shipC || {}).enrich || {}), ...Object.fromEntries(S.shpEnrich || []) }; const ev = shipSevOf(x.items[0], x, EN); return ev && ev.ref > 0 && ev.ratio != null ? ev.ratio : null; } catch (e) { return 'ERR ' + e.message; } }); /* (11/18 shipfix2) 정렬 = 카드 괄호 안 % 와 같은 값 */
    return o; });
  console.log(JSON.stringify(R));
  ok(R.gain.join() === 'G-1,G-2,G-4,G-3', '이득 순: ' + R.gain.join());
  ok(R.loss.join() === 'G-4,G-2,G-1,G-3', '손해 순: ' + R.loss.join());
  ok(/전체 유의 사항 다시 읽기\(4개\)/.test(R.nall || ''), '탭 전체 단추: ' + R.nall);
  ok(R.nask.length >= 4 && R.nask.every((g) => g === '상'), '상 등급 카드마다 📝 단추: ' + R.nask.join());
  ok(R.cmds.every((c) => c === 'usedInfo:상'), '두 번 눌러 상품마다 맡긴 일(상 등급): ' + R.cmds.join());
  ok(/맡김 4\/4/.test(R.prog) && !!R.run, '진행 줄: ' + R.prog.slice(0, 80));
  /* (정범님 11/18 I-1118-2245-28.2 · shipfix2) 예전 기대: 색 모름 줄을 노랑으로 바꿔 원 차이로 셈(카드와 다른 기준) → 이제 기대: 카드 괄호 안 % 와 똑같은 값(색과 상관없음) */
  ok(R.gU.length === 4 && R.gU.every((g, i) => (g == null && R.gC[i] == null) || (typeof g === 'number' && Math.abs(g - R.gC[i]) < 1e-9)), '색 모름 줄에서도 정렬 값 = 카드 평가 %: ' + JSON.stringify(R.gU) + ' / ' + JSON.stringify(R.gC));
  console.log(bad ? `❌ tSHIPNOTE1118 실패 ${bad}` : '✓ tSHIPNOTE1118 통과'); process.exitCode = bad ? 1 : 0;
});
