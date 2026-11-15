// tSHIP1115B — 정범님 11/15 17:45 오늘 출고 손봄
//  ① 받는 분 이름(osNmO: 받는 분 → 없으면 주문인 · '상동'은 건너뜀) ② 🗂 뺀·미룬 탭이 📦 출고 준비 바로 옆 · 💰 출고별 매출 탭이 단계 줄에 늘 보임
//  ⑤ '오늘 끝' 수 = 오늘 끝낸 것만(어제 끝난 것은 doneP로 따로) ⑦ ✓ 문제 없음 모음(켜기·끄기) ⑨ 💰 이득 많은 순 / 💸 손해 많은 순(시장을 모르는 주문은 늘 맨 아래)
// 시험 자료 손님은 '손님A'·'손님B'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIP1115B.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
    const A = [...S.plist.values()]; const now = new Date().toISOString(); const sh = () => document.getElementById('sheet');
    ['가 책', '나 책', '다 책', '라 책'].forEach((t, i) => { A[i].title = t; A[i].status = '판매중'; A[i].active = true; A[i].qty = 1; });
    const it = (l) => ({ listingId: l.listingId, title: l.title, price: l.price, qty: 1, sku: l.sku, grade: '상' });
    S.shipC = { orders: [], at: now, enrich: {} }; S.shipCFromCache = false;
    S.ship = { orders: [{ orderNo: 'G-1', buyer: '손님A', orderedAt: '2026-11-15 09:00', recipient: { name: '손님가' }, items: [it(A[0])] }, { orderNo: 'G-2', buyer: '손님B', orderedAt: '2026-11-15 09:10', recipient: { name: '상동' }, items: [it(A[1])] },
      { orderNo: 'G-3', buyer: '손님C', orderedAt: '2026-11-15 09:20', items: [it(A[2])] }, { orderNo: 'G-4', buyer: '손님D', orderedAt: '2026-11-15 09:30', recipient: { name: '손님라' }, items: [it(A[3])] }], tabCounts: {}, at: now }; S._shipLive = 1;
    await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(400);
    // ① 받는 분 이름
    o.nm = S.ship.orders.map((x) => osNmO(x));
    // ⑨ 정렬 — 시장 셈(shipGainOf)만 흉내(그 셈은 카드의 💬 판매가 평가와 같은 evalSale 기준)
    const GV = { 'G-1': 500, 'G-2': -800, 'G-3': null, 'G-4': 2000 }; const g0 = window.shipGainOf; window.shipGainOf = (x) => GV[x.orderNo];
    try { localStorage.removeItem('rn-ship-sort'); localStorage.removeItem('rn-ship-sort2'); localStorage.setItem('rn-ship-view', 'order'); localStorage.setItem('rn-ship-warntop', '0'); } catch (e) {} if (typeof SRT === 'object' && SRT.r) SRT.r.ship = false;
    S.shipSort = null; S.shipSortL = null; S.shipWarnTop = null; S.shipView = 'order'; S.shipSrc = 'all'; S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(600);
    const ords = () => [...sh().querySelectorAll('section.shp-o[data-anc^="o:G-"]')].map((s) => s.dataset.anc.slice(2));
    const gb = () => sh().querySelector('[data-ss="gain"]'); o.gBtn = !!gb(); if (gb()) { gb().click(); await W(500); } o.gain = ords(); o.gTxt = gb() ? gb().textContent : '';
    if (gb()) { gb().click(); await W(500); } o.loss = ords(); o.lTxt = gb() ? gb().textContent : '';
    o.realGain = typeof g0 === 'function' ? g0({ orderNo: 'G-9', items: [it(A[0])] }) : 'none'; window.shipGainOf = g0;
    o.sk = typeof SHIP_SK === 'object' && !!SHIP_SK.gain && !!SHIP_SK['gain:1'];
    // ② 탭 자리
    const tabs = [...sh().querySelectorAll('.shp-tabs [data-stab]')].map((b) => b.dataset.stab); o.tabs = tabs;
    // ⑤ 오늘 끝 = 오늘 것만
    const sr = window.shipRows; window.shipRows = () => [{ stage: 'done', src: 'al' }, { stage: 'done', src: 'al', dPrev: true }, { stage: 'done', src: 'y24', dPrev: true }, { stage: 'deliv', src: 'al' }];
    try { const c = shipCnt(); o.cnt = { d: c.all.done, p: c.all.doneP, v: c.all.deliv, al: c.al.done }; } catch (e) { o.cnt = 'ERR ' + e.message; } window.shipRows = sr;
    // ⑦ 문제 없음 모음
    const k0 = S.os.excOk; S.os.excOk = { 'al:G-1|x': { on: true, at: now }, 'al:G-2|x': { on: false, at: now } }; o.exc = [...shipExcOkSet()]; S.os.excOk = k0;
    // 도움말
    o.feat = (typeof FEAT === 'object' ? FEAT : []).filter((f) => /이득 많은 순|사람이 볼 것 카드마다|느슨하게/.test(f.t || f.title || f.n || JSON.stringify(f))).length;
    return o; });
  console.log(JSON.stringify(R).slice(0, 900));
  ok(R.nm.join() === '손님가,손님B,손님C,손님라', "① 받는 분 이름 — 받는 분 · '상동'·빈칸이면 주문인: " + R.nm.join());
  ok(R.gBtn && R.gain.join() === 'G-4,G-1,G-2,G-3' && /이득 많은 순/.test(R.gTxt), '⑨ 💰 이득 많은 순(시장 모름은 맨 아래): ' + R.gain.join() + ' · ' + R.gTxt);
  ok(R.loss.join() === 'G-2,G-1,G-4,G-3' && /손해 많은 순/.test(R.lTxt), '⑨ 한 번 더 = 💸 손해 많은 순(시장 모름은 그래도 맨 아래): ' + R.loss.join() + ' · ' + R.lTxt);
  ok(R.realGain === null || typeof R.realGain === 'number', '⑨ 진짜 셈(shipGainOf)이 시장 자료 없을 때 멈추지 않음: ' + R.realGain);
  ok(R.sk, "⑨ '그다음' 고르기 이름표에도 이득·손해");
  const iD = R.tabs.indexOf('deliv'); ok(iD >= 0 && R.tabs[iD + 1] === 'out' && R.tabs.includes('sales'), '② 🗂 뺀·미룬 탭 = 📦 출고 준비 바로 옆 · 💰 출고별 매출 탭 늘 보임: ' + R.tabs.join());
  ok(R.cnt && R.cnt.d === 1 && R.cnt.p === 2 && R.cnt.v === 1 && R.cnt.al === 1, "⑤ '오늘 끝' = 오늘 끝낸 것만(어제 것은 따로): " + JSON.stringify(R.cnt));
  ok(R.exc.join() === 'al:G-1|x', '⑦ ✓ 문제 없음 — 켠 것만 내림(끈 것은 다시 보임): ' + R.exc.join());
  ok(R.feat >= 2, '🔍 기능 찾기에 새 줄(이득·손해 정렬 · 문제 없음 · 느슨한 찾기): ' + R.feat);
  console.log(bad ? `❌ tSHIP1115B 실패 ${bad}` : '✓ tSHIP1115B 통과'); process.exitCode = bad ? 1 : 0; });
