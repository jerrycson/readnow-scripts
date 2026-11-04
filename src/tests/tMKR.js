// tMKR — 정범님 11/02 '① 주문확인요청 탭에 시장 다시 읽기 단추 · 자동 발송요청이 켜 있으면 다시 읽은 뒤 바로 판단'
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const o = {}; const w = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); await w(2500); /* (11/04) 앱의 첫 주문확인요청 받기(shp_state/confirm 듣기)가 끝난 뒤 시험 주문을 넣음 — 늦게 오는 첫 받기가 시험 주문을 덮던 것 */
    S.shipC = { at: now, orders: [{ orderNo: 'A1', orderedAt: '2026-11-02 09:00', buyer: '가', items: [{ listingId: 'L1', title: '책1', price: 5000, qty: 1 }, { listingId: 'L2', title: '책2', price: 6000, qty: 1 }] }, { orderNo: 'A2', orderedAt: '2026-11-02 09:10', buyer: '나', items: [{ listingId: 'L3', title: '책3', price: 7000, qty: 1 }] }, { orderNo: 'C1', platform: 'cash', items: [{ listingId: 'L9', title: '현금', price: 1, qty: 1 }] }], enrich: {} };
    const C0 = S.shipC; S.ship = { orders: [], tabCounts: {}, at: now }; S._shipLive = 1; S.shipTab = 'confirm'; S.shipAutoCfg = { on: true };
    await openShip(); await w(700); const sh = document.getElementById('sheet');
    const b = sh.querySelector('#shp_mkre'); o.btn = b ? b.textContent : ''; b.click(); await w(600);
    const qs = await db.collection('shp_cmds').where('type', '==', 'market').get(); const d = qs.docs[0]; o.cmd = d ? d.data() : null; o.line0 = (document.getElementById('shp_mkst') || {}).innerText || ''; o.dis = document.getElementById('shp_mkre').disabled;
    await d.ref.set({ status: 'running', prog: { n: 3, done: 2, fail: 0, gone: 0, left: 1 }, progAt: new Date().toISOString() }, { merge: true }); await w(400); o.line1 = document.getElementById('shp_mkst').innerText;
    await d.ref.set({ status: 'done', doneAt: new Date().toISOString(), prog: { n: 3, done: 3, fail: 0, gone: 0, left: 0 }, res: { rj: 1, keep: 1 } }, { merge: true }); await w(400); o.line2 = document.getElementById('shp_mkst').innerText; o.dis2 = document.getElementById('shp_mkre').disabled;
    await db.collection('app_settings').doc('ship_auto').set({ on: false }, { merge: true }); S.shipAutoCfg = { on: false }; await w(1200); o.n2 = ((S.shipC || {}).orders || []).length; S.shipC = C0; o.busy2 = shipMkReBusy(); o.cfg2 = JSON.stringify(shipAutoCfgNow() && shipAutoCfgNow().on); document.getElementById('shp_mkre').click(); await w(800);
    const q2 = (await db.collection('shp_cmds').where('type', '==', 'market').get()).docs.map((x) => x.data()); o.cmd2 = q2.find((x) => x.rejudge === false) || null; o.line3 = document.getElementById('shp_mkst').innerText;
    o.feat = (typeof FEAT !== 'undefined' ? FEAT : []).some((f) => /시장 다시 읽기/.test(f.t)); return o; });
  console.log(JSON.stringify(R).slice(0, 1500));
  ok(/시장 다시 읽기/.test(R.btn), '① 탭에 🔄 시장 다시 읽기 단추');
  ok(R.cmd && R.cmd.rerd && R.cmd.listingIds.join() === 'L1,L2,L3' && R.cmd.orderNos.join() === 'A1,A2' && R.cmd.rejudge === true && R.cmd.status === 'queued', '누르면 이 탭 모든 상품(현금 판매 뺌)을 맡김 · 자동 켜짐 → 다시 판단 표시');
  ok(/기다리는 중/.test(R.line0) && R.dis, '맡긴 뒤 진행 줄 · 단추 잠김(두 번 누르지 않게)');
  ok(/2\/3권/.test(R.line1), '진행 2/3권 실시간 ' + R.line1);
  ok(/끝/.test(R.line2) && /1건 바로 다시 판단/.test(R.line2) && /1건은 그대로/.test(R.line2) && !R.dis2, '끝: 다시 판단 1건 · 그대로 1건 · 단추 다시 열림 ' + R.line2);
  ok(R.cmd2 && /꺼짐/.test(R.line3), '자동 꺼짐이면 읽기만(rejudge false) ' + R.line3);
  ok(R.feat, '🔍 기능 찾기에 있음');
  console.log(bad ? `❌ tMKR 실패 ${bad}` : '✓ tMKR 통과'); });
