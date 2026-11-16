// tOSSES1115 — 출고 세션 잠금 · ⏸ 보류함 · 🆕 새 주문 (정범님 11/15 16:19 「위 아래 설정이 맞지 않아서 헷갈려 … 세션 간의 구분을 분명히 … 정확히 그 부분만 출고/출력/입력」)
//  그대로 재현: 오늘 출고 20건 · 어제 문제 주문 1건은 ⏸ 보류함 · 오늘 임시로 2건 ⏸ 오늘 뺌 → 묶을 주문 17
//  ① 맨 위 카드(오늘 할 일·흐름 줄 '송장 인쇄')와 📋 이번에 묶을 주문이 같은 17 · 뺌·보류 3은 따로 보임
//  ② 보류함: 하루가 지나도 남음(하루 문서 아님 · _hold) · 누가·언제·까닭 · ↩ 풀기 하면 바로 다시 묶을 주문
//  ③ 🔒 세션 잠금 뒤 들어온 새 주문은 묶을 주문에 저절로 안 들어감 → 🆕 칸에 따로 · [＋ 넣기]로 넣으면 바로 그 수
//  ④ 지난 날 열린 채 남은 세션은 무효(오늘 주문이 '새 주문'으로 몰리지 않음)
//  시험 자료 손님은 '손님01…' · 공개 저장소 · 실행: test-gate(--only tOSSES1115) 또는 RN_PORT=<포트> node tOSSES1115.js
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => {
    const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const now = () => new Date().toISOString();
    window.ask = async () => true; window.askText = async () => '어제 주소 문제'; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; S.app = S.app || {}; S.app.oneShot = { ...(S.app.oneShot || {}), y24: false, cash: false };
    try { ['rn-shp-one-fold', 'rn-ship-first', 'rn-ship-src'].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
    S.os.hOkAt = 0; /* 출고 기기 아님 — 세션은 이 시험이 직접 엶 */
    const td = window.ReadnowShipping.ymd(new Date()); const ord = (no) => ({ orderNo: no, buyer: '손님' + no.slice(2), orderedAt: td + ' 09:00', recipient: { name: '손님' + no.slice(2) }, items: [{ listingId: '9' + no.replace(/\D/g, ''), title: '책 ' + no, price: 5000, qty: 1, sku: 'SKU' + no.replace(/\D/g, '') + 'X' }] });
    const setShip = (L) => { S.ship = { at: now(), tabCounts: { '발송 요청': L.length }, orders: L.map(ord) }; FS.shp_state = FS.shp_state || {}; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); S._shipRowsC = null; };
    const B20 = Array.from({ length: 20 }, (_, i) => 'A-' + String(i + 1).padStart(2, '0'));
    /* ④ 어제 열린 채 남은 세션 */
    const yd = (() => { const d = new Date(Date.now() + 9 * 3600e3 - 86400e3); return d.toISOString().slice(0, 10).replace(/-/g, ''); })();
    await db.collection('shp_runs').doc('_ses').set({ cur: { id: yd + '_1', n: 1, day: yd, st: 'open', at: new Date(Date.now() - 86400e3).toISOString(), keys: { 'al:Z-1': 1 } } });
    setShip(B20); await openShip(); await W(900);
    const top = () => { const d = document.createElement('div'); d.innerHTML = shipTopHtml(shipCnt(), 'all'); return d; };
    const pickSum = () => ((document.querySelector('#os_pick summary') || {}).innerText || '').replace(/\s+/g, ' ');
    o.old = { cur: osSesCur(), keep: osKeepOs().length };
    /* 보류 1(어제 문제) · 오늘 뺌 2 */
    await oshPut(['al:A-05'], true, { 'al:A-05': '책 A-05' }, '어제 주소 문제'); await osxPut(['al:A-11', 'al:A-12'], true); await W(900); S._shipRowsC = null;
    const T = top(); const adj = osAdjC(shipCnt().al, 'al', osRunsToday());
    o.one = { keep: osKeepOs().length, adj: adj.c.deliv, off: adj.sx.off, raw: shipCnt().al.deliv, flow: (T.querySelector('.shp-flow') || {}).textContent.replace(/\s+/g, ' ').slice(0, 300), todo: (T.querySelector('.shp-ones') || {}).textContent.replace(/\s+/g, ' ').slice(0, 200), sum: pickSum() };
    o.hold = { doc: JSON.parse(JSON.stringify(((FS.shp_runs || {})._hold || {}).keys || {})), box: ((document.getElementById('os_hold') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 300), log: !!Object.keys(FS.shp_runs || {}).find((k) => /^_oslog_/.test(k)) };
    /* 세션 잠금 → 새 주문 2 */
    const c1 = await osSesOpen('시험'); await W(600); setShip([...B20, 'N-01', 'N-02']); await openShip(); await W(900);
    const T2 = top(); const adj2 = osAdjC(shipCnt().al, 'al', osRunsToday());
    o.ses = { n: c1 && c1.n, keys: Object.keys(((FS.shp_runs || {})._ses || {}).cur.keys || {}).length, keep: osKeepOs().length, adj: adj2.c.deliv, nw: adj2.sx.nw, newBox: ((document.querySelector('.os-new') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 200), sum: pickSum(), todo: (T2.querySelector('.shp-ones') || {}).textContent.replace(/\s+/g, ' ').slice(0, 200) };
    /* 🆕 하나 넣기(단추) */
    const b = document.querySelector('[data-osnew="al:N-01"]'); o.addBtn = !!b; if (b) b.click(); await W(900); S._shipRowsC = null;
    o.add = { keep: osKeepOs().length, inDoc: !!((((FS.shp_runs || {})._ses || {}).cur || {}).keys || {})['al:N-01'], nw: osAdjC(shipCnt().al, 'al', osRunsToday()).sx.nw };
    /* ↩ 보류 풀기(단추) */
    const u = document.querySelector('[data-osh="off"][data-oshk="al:A-05"]'); o.relBtn = !!u; if (u) u.click(); await W(900); S._shipRowsC = null;
    o.rel = { keep: osKeepOs().length, on: (((FS.shp_runs || {})._hold || {}).keys || {})['al:A-05'].on };
    /* 세션 닫기 → 다시 모두 보임 */
    await osSesClose('시험'); await W(600); o.close = { cur: osSesCur(), keep: osKeepOs().length };
    return o; });
  console.log(JSON.stringify(R).slice(0, 1500));
  ok(!R.old.cur && R.old.keep === 20, '지난 날 열린 채 남은 세션은 무효 — 오늘 주문 20건 그대로: ' + JSON.stringify(R.old));
  ok(R.one.keep === 17 && R.one.adj === 17 && R.one.off === 3 && R.one.raw === 20, '보류 1 + 오늘 뺌 2 → 묶을 주문 17 · 맨 위 카드 송장 인쇄 수도 17(뺌·보류 3 따로): ' + JSON.stringify(R.one));
  ok(/17/.test(R.one.flow) && !/송장 인쇄\D{0,6}20/.test(R.one.flow) && /뺌·보류 3/.test(R.one.flow) && /⏸ 뺌·보류 3/.test(R.one.todo) && /17건/.test(R.one.sum), '맨 위 흐름 줄·오늘 할 일·📋 묶을 주문 글이 같은 수: ' + JSON.stringify(R.one));
  ok(R.hold.doc['al:A-05'] && R.hold.doc['al:A-05'].on && R.hold.doc['al:A-05'].why === '어제 주소 문제' && R.hold.doc['al:A-05'].by && /A-05/.test(R.hold.box) && /어제 주소 문제/.test(R.hold.box) && R.hold.log, '⏸ 보류함 — 하루 문서 아님(_hold) · 누가·까닭 · 보류함 칸에 보임 · 기록 남김: ' + JSON.stringify(R.hold));
  ok(R.ses.n === 1 && R.ses.keys === 20 && R.ses.keep === 17 && R.ses.adj === 17 && R.ses.nw === 2 && /N-01/.test(R.ses.newBox) && /🆕/.test(R.ses.sum) && /🆕 2/.test(R.ses.todo), '🔒 세션 #1 잠금 뒤 새 주문 2건은 저절로 안 들어감 → 🆕 칸에 따로 · 맨 위 수 그대로 17: ' + JSON.stringify(R.ses));
  ok(R.addBtn && R.add.keep === 18 && R.add.inDoc && R.add.nw === 1, '[＋ 넣기] → 그 한 건만 세션에 들어가 18: ' + JSON.stringify(R.add));
  ok(R.relBtn && R.rel.keep === 19 && R.rel.on === false, '[↩ 풀기] → 보류 주문이 바로 묶을 주문으로 19(기록은 지우지 않고 on:false): ' + JSON.stringify(R.rel));
  ok(!R.close.cur && R.close.keep === 20, '🔓 세션 닫기 → 잠금 풀려 남은 새 주문도 다시 후보(오늘 뺌 2만 빠짐 20): ' + JSON.stringify(R.close));
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과');
});
