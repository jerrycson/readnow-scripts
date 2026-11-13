// tSHIPWHY1113 — 정범님 11/13 14:57 '휴대폰 출고 화면이 30초 안에 6~12번 다시 그려짐 — 무엇이 다시 그리게 하는지 정확히 찾아내' (redraw1)
//  ① 다시 그리기 길 다섯(shipRerender·shipRedrawSoon·shipRedrawKeep·shipMkLive·openShip)이 부른 곳(함수 이름@파일:줄)을 window.__rnShipWhy.ev에 남김
//  ② 남긴 줄 번호가 실제 배포 파일(app/readnow-webapp.js)의 그 함수 줄을 가리킴(나중에 판 번호로 원인을 찾을 수 있음)
//  ③ 30초 안에 6번 넘게 그리면 perf_logs kind 'shipwhy' 한 줄 — 부른 곳·횟수·탭만(손님 이름 같은 개인 정보 없음) · 2분 안에는 다시 안 씀
//  ④ 감싸도 출고 화면은 그대로 그려짐(카드 수 같음 · 오류 없음)
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIPWHY1113.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('./harness.js')(async (p) => {
  await p.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
    const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const FS = (window.__FS = window.__FS || {});
    const it = (lid, t, pr) => ({ listingId: lid, title: t, price: pr, qty: 1, grade: '상', sku: 'BLKAAA_ms' });
    FS.shp_state = { confirm: { orders: [{ orderNo: 'C-1', buyer: '손님A', orderedAt: '2026-11-13 09:10', items: [it('L1', '첫 책', 5000)] }, { orderNo: 'C-2', buyer: '손님B', orderedAt: '2026-11-13 09:11', items: [it('L2', '둘째 책', 5100)] }], at: iso(now), sig: 's1' },
      current: { orders: [{ orderNo: 'D-1', buyer: '손님C', orderedAt: '2026-11-12 09:00', items: [it('L9', '셋째 책', 6000)] }], at: iso(now), tabCounts: {}, sig: 'c1' } };
    try { localStorage.setItem('rn-ship-view', 'order'); localStorage.removeItem('rn-shipwhy'); } catch (e) {} });
  await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html?go=confirm'); await p.waitForTimeout(5000);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = () => document.getElementById('sheet');
    o.open = !!(S.detail && S.detail.ship) && S.shipTab === 'confirm'; o.thin = typeof PHONE_THIN !== 'undefined' && PHONE_THIN;
    o.has = !!window.__rnShipWhy; o.wrapped = ['shipRerender', 'shipRedrawSoon', 'shipRedrawKeep', 'shipMkLive'].every((n) => window[n] && window[n].__rnSw) && !!(window.openShip && window.openShip.__rnW);
    o.cards0 = sh().querySelectorAll('[data-anc]').length;
    // 실제처럼: 자동 판단 설정 문서에 PC 심장박동 · 판단 기록 · 시장 기록이 들어옴
    await db.collection('app_settings').doc('ship_auto').set({ beatAt: new Date().toISOString(), beatBy: 'MJ-MAIN', beats: { 'MJ-MAIN': new Date().toISOString() } }, { merge: true }); await W(2200);
    await db.collection('shp_auto').doc('C-1').set({ at: new Date().toISOString(), verdict: 'pass' }); await W(2200);
    const ev0 = window.__rnShipWhy.ev.map((x) => x[1]); o.ev0 = ev0.slice(-12);
    o.edgeRe = ev0.filter((k) => /^shipRerender<.+@[\w.-]+:\d+$/.test(k)).length; o.edgeOpen = ev0.filter((k) => /^openShip<.+@[\w.-]+:\d+$/.test(k)).length;
    // 30초 안에 7번 그림 → shipwhy 한 줄
    window.__rnShipWhy.last = -1e9; for (let i = 0; i < 7; i++) { S._shipTouch = 0; S._shqAt = 0; shipRedrawKeep(); await W(120); } await W(3600);
    const P = Object.values((window.__FS || {}).perf_logs || {}); const sw = P.filter((x) => x && x.kind === 'shipwhy'); o.swN = sw.length; o.sw = sw[0] || null;
    for (let i = 0; i < 7; i++) { S._shipTouch = 0; shipRedrawKeep(); await W(100); } await W(3600); o.swN2 = Object.values(window.__FS.perf_logs || {}).filter((x) => x && x.kind === 'shipwhy').length;
    o.cards1 = sh().querySelectorAll('[data-anc]').length; o.evLen = window.__rnShipWhy.ev.length;
    return o; });
  const show = { ...R, sw: R.sw ? { ...R.sw, uploadedAt: undefined } : null }; console.log(JSON.stringify(show, null, 1));
  ok(R.open && R.thin, '휴대폰 출고 가벼운 모드(?go=confirm · 390px)로 열림');
  ok(R.has && R.wrapped, '① 다시 그리기 길 다섯 모두 감쌈');
  ok(R.edgeRe > 0 && R.edgeOpen > 0, `① 부른 곳이 '이름@파일:줄' 모양으로 남음 (shipRerender ${R.edgeRe} · openShip ${R.edgeOpen})`);
  // ② 줄 번호 → 실제 배포 파일의 그 줄
  const js = fs.readFileSync(path.join(__dirname, '..', 'out', 'app', 'readnow-webapp.js'), 'utf8').split('\n');
  const one = (R.ev0 || []).map((k) => k.match(/^shipRerender<(.+)@readnow-webapp\.js:(\d+)$/)).find((m) => m && m[1] !== '익명');
  ok(!!one && js[+one[2] - 1] && js[+one[2] - 1].includes(one[1]), `② 줄 번호가 배포 파일의 그 함수 줄을 가리킴 (${one ? one[1] + ':' + one[2] : '없음'})`);
  ok(R.swN === 1 && R.sw && R.sw.n30 >= 6 && R.sw.ev && Object.keys(R.sw.ev).some((k) => /^openShip<shipRedrawKeep@/.test(k)), "③ 30초에 6번 넘게 그리면 'shipwhy' 기록 한 줄(부른 곳 openShip<shipRedrawKeep 포함)");
  ok(R.sw && !/손님|010-|@gmail|buyer/.test(JSON.stringify(R.sw)) && !('by' in R.sw), '③ 기록에 개인 정보 없음(부른 곳·횟수·탭만)');
  ok(R.swN2 === 1, '③ 2분 안에는 다시 안 씀');
  ok(R.cards0 > 0 && R.cards1 === R.cards0 && R.evLen <= 300, `④ 감싸도 출고 화면 그대로(카드 ${R.cards0} → ${R.cards1}) · 고리 ${R.evLen}줄 이하 300`);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
}, { touch: true });
