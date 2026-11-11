// tSSDLV1111 — 11/11 정범님 시급: 💰 출고별 매출 카드에 📮 송장번호·받는 분·주소(실제 송장과 맞대어 보기)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const SHOT = process.env.SHOT || '';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const o = {}; const td = dstr(new Date()); const it = (t, pr) => [{ title: t, price: pr, qty: 1, lineStatus: 'normal' }];
    S._shpOrd = new Map([['001-A9000002', { buyer: '김보통', recipient: { name: '박받음', zip: '06236', address: '서울 강남구 테헤란로 1 101호' } }]]);
    try { invDoneMem().set('001-A9000002', ['254012345678', Date.now()]); } catch (e) {}
    loadShipDays(); await db.collection('shp_days').doc(td).set({ day: td, source: 'tab', entries: [
      { id: 'aladin_001-A9000001', orderNo: '001-A9000001', ex: [], items: it('책 하나', 5000), orderedAt: td + ' 09:00', buyer: '손님A', invoiceNo: '254099990001' },
      { id: 'aladin_001-A9000002', orderNo: '001-A9000002', ex: [], items: it('책 둘', 9000), orderedAt: td + ' 09:10', buyer: '김보통' }] });
    await new Promise((r) => setTimeout(r, 300)); S._sdm = null; S.ship = { at: new Date().toISOString(), orders: [{ orderNo: '001-A9000001', buyer: '손님A', recipient: { name: '손님A', zip: '12345', address: '경기 수원시 팔달구 1' }, items: [] }] }; S.shipC = { orders: [], at: new Date().toISOString() }; S._shipLive = 1; S.shipTab = 'sales';
    await openShip(); await new Promise((r) => setTimeout(r, 900)); S.ship = { at: new Date().toISOString(), orders: [{ orderNo: '001-A9000001', buyer: '손님A', recipient: { name: '손님A', zip: '12345', address: '경기 수원시 팔달구 1' }, items: [] }] }; try { shipTabRedraw(); } catch (e) {} await new Promise((r) => setTimeout(r, 400));
    const sh = document.getElementById('sheet'); o.n = sh.querySelectorAll('.ss-dlv').length; o.txt = [...sh.querySelectorAll('.ss-dlv')].map((x) => x.innerText.replace(/\s+/g, ' ')); o.cp = sh.querySelectorAll('[data-sscp]').length; o.pop = window.__popups || 0; o.shipN = (S.ship && S.ship.orders || []).length;
    const d = sh.querySelector('.ss-dlv'); if (d) d.scrollIntoView({ block: 'center' }); return o; });
  console.log(JSON.stringify(R));
  ok(R.n === 2, '두 주문 카드 모두 📮 송장 대조 칸');
  ok(R.txt.some((t) => /254099990001/.test(t) && /수원시/.test(t) && /= 구매자/.test(t)), '주문1: 송장(출고 기록) · 주소(지금 출고 목록) · 받는 분 = 구매자');
  ok(R.txt.some((t) => /254012345678/.test(t) && /박받음/.test(t) && /구매자와 다름/.test(t) && /테헤란로/.test(t) && /06236/.test(t)), '주문2: 송장(송장 입력 기억) · 받는 분 다름 표시 · 주소·우편번호(shp_orders)');
  ok(R.cp >= 6, '송장·받는 분·주소 누르면 복사(칸 ' + R.cp + ')');
  if (SHOT) { await p.setViewportSize({ width: 1100, height: 900 }); await new Promise((r) => setTimeout(r, 300)); await p.screenshot({ path: SHOT + '_pc.png' }); await p.setViewportSize({ width: 390, height: 844 }); await new Promise((r) => setTimeout(r, 400)); await p.evaluate(() => { const d = document.querySelector('.ss-dlv'); if (d) d.scrollIntoView({ block: 'center' }); }); await p.screenshot({ path: SHOT + '_phone.png' }); }
  console.log(bad ? `❌ tSSDLV1111 실패 ${bad}` : '✓ tSSDLV1111 통과'); });
