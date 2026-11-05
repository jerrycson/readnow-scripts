// tSHP6 — 정범님 11/05 밤 출고 '되풀이 0·실수 0'
//  ① ✅ 오늘 끝 칸은 그날 18:00(한국 시각 · 설정 doneHour 기본 18)에 빠짐 · 18시 뒤 끝낸 것은 다음 날 18:00까지 — 알라딘·예스24·현금
//  ② 송장 입력 끝(state done) 주문은 기록이 36시간 창 밖이어도 끝 + ⚠ · 원스톱 고르기·invPrevSet·ALPS 파일·ALPS 자동 맡김 어디서도 다시 넣지 않음
//  ③ 합포장 '같은 주소' — 주소만(이름·전화 안 봄) · 호수까지 같아야 · 띄어쓰기·쉼표·괄호 참고 글만 무시
// 시험 자료는 가짜 주소·'손님A'·010-0000-0000 (공개 저장소)
// 실행: cd pw && RN_PORT=8784 node tSHP6.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js'); let errN = 0; const _log = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('ERRORS:')) { try { const E = JSON.parse(a[1]).filter((x) => !/js-profiling/.test(x)); errN += E.length; } catch (e) {} } _log(...a); };
(async () => {
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
      try { localStorage.removeItem('rn-ship-invdone'); localStorage.removeItem('rn-ship-pk'); } catch (e) {}
      S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), off: false } };
      const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const realNow = Date.now.bind(Date); const D = kstDay(realNow()); const K = (d, hm) => Date.parse(d + 'T' + hm + ':00+09:00'); const D1 = kstDay(K(D, '12:00') + 864e5); /* D = 오늘(한국) · D1 = 다음 날 */
      const at = (ms) => { Date.now = () => ms; S._shipRowsC = null; S._shipSameC = null; };
      // ── ① 시각 셈(알라딘 줄 · 예스24 · 현금)
      const cfg0 = shipUiCfg(); o.def = [cfg0.doneHour, cfg0.invKeepD];
      const iso = (ms) => new Date(ms).toISOString(); const T10 = iso(K(D, '10:00')), T19 = iso(K(D, '19:00'));
      const seen = (t, now) => { at(now); return shipDoneSeen(t); };
      o.t10 = [seen(T10, K(D, '17:59')), seen(T10, K(D, '18:01')), seen(T10, K(D, '23:59')), seen(T10, K(D1, '00:01')), seen(T10, K(D1, '05:59')), seen(T10, K(D1, '06:01'))];
      o.t19 = [seen(T19, K(D, '19:30')), seen(T19, K(D, '23:59')), seen(T19, K(D1, '00:01')), seen(T19, K(D1, '17:59')), seen(T19, K(D1, '18:01'))];
      S.app.ship = { ...(S.app.ship || {}), doneHour: 24 }; o.h24 = [seen(T10, K(D, '23:59')), seen(T10, K(D1, '00:01'))]; S.app.ship.doneHour = 18;
      // 현금: shippedAt은 날짜만 → 기록(history)의 '출고함' 시각
      const cA = { shippedAt: D, history: [{ at: T19, what: '출고함 ' + D }] }, cB = { shippedAt: D, history: [] };
      o.cash = [seen(shipCashDoneAt(cA), K(D1, '17:59')), seen(shipCashDoneAt(cA), K(D1, '18:01')), seen(shipCashDoneAt(cB), K(D, '17:59')), seen(shipCashDoneAt(cB), K(D, '18:01'))];
      Date.now = realNow;
      // 알라딘(발송 요청에서 빠진 끝) · 예스24 줄
      await db.collection('shp_invoices').doc('invT6').set({ createdAt: new Date(realNow()).toISOString(), status: 'done', limit: 0, items: [{ orderNo: 'N10', invoice: '240000000010', recipient: '손님A', state: 'done', doneAt: T10 }, { orderNo: 'N19', invoice: '240000000019', recipient: '손님A', state: 'done', doneAt: T19 }], log: [] });
      await db.collection('crm_y24_orders').doc('Y19').set({ orderNo: 'Y19', lastSeenAt: T19, firstSeenAt: T10, orderedAt: T10, buyer: '손님A', recipient: { name: '손님A', address: '시험시 시험구 시험로 9, 1동 101호' }, items: [{ k: '1', title: '예스24 책', price: 9000, qty: 1, grade: '상' }], ystage: 'sent', man: { inv: { at: T19 } } });
      S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} };
      try { y24oWatch(); } catch (e) {} try { loadInvBatch(); } catch (e) {} await W(1200);
      const rowsAt = (ms) => { at(ms); const r = shipRows().filter((x) => x.stage === 'done').map((x) => x.src + ':' + x.id + (x.dPrev ? '*' : '')).sort().join(' '); return r; };
      o.rows = { d1759: rowsAt(K(D, '17:59')), d1801: rowsAt(K(D, '18:01')), n1759: rowsAt(K(D1, '17:59')), n1801: rowsAt(K(D1, '18:01')) };
      Date.now = realNow; S._shipRowsC = null;
      // ── ② 36시간 넘은 완료 기록
      const old = new Date(realNow() - 40 * 3600e3).toISOString(); const oKs = new Date(realNow() - 72 * 3600e3 + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
      await db.collection('shp_invoices').doc('invOld').set({ createdAt: old, status: 'done', limit: 0, items: [{ orderNo: 'B1', invoice: '240000009999', recipient: '손님A', state: 'done', doneAt: old }, { orderNo: 'B2', invoice: '240000009998', recipient: '손님A', state: 'fail' }], log: [{ at: old, m: '긴 기록' }] });
      const it = (t) => ({ listingId: '1', title: t, price: 5000, qty: 1, sku: 'PNK_ms', grade: '상' });
      S.ship = { orders: [{ orderNo: 'B1', buyer: '손님A', orderedAt: oKs, recipient: { name: '손님A', phone: '010-0000-0000', address: '시험시 시험구 시험로 1, 101동 202호' }, items: [it('이미 송장 넣은 책')] }, { orderNo: 'B2', buyer: '손님A', orderedAt: oKs, recipient: { name: '손님A', phone: '010-0000-0000', address: '시험시 시험구 시험로 3, 1동 1호' }, items: [it('아직 안 넣은 책')] }], tabCounts: {}, at: new Date().toISOString() };
      await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(500); o.shipN = ((S.ship || {}).orders || []).length;
      o.before = invDocs().some((B) => B.id === 'invOld'); /* 36시간 창 밖이라 듣기엔 없음 */
      S._shipRowsC = null; shipRows(); await W(600); S._shipRowsC = null;
      const rB = shipRows().filter((r) => r.src === 'al' && ['B1', 'B2'].includes(r.id)); o.b1 = rB.filter((r) => r.id === 'B1').map((r) => r.stage + '|' + ((r.exc || {}).k || '') + '|' + ((r.exc || {}).why || '')).join(); o.b2 = rB.filter((r) => r.id === 'B2').map((r) => r.stage).join();
      o.excHas = shipExcRows().some((x) => x.row && x.row.id === 'B1' && /남아 있음/.test(x.why));
      o.pick = osPickRows().filter((r) => r.src === 'al').map((r) => r.no).join(',');
      const P = await invPrevSet(); o.prev = { ords: P.ords.has('B1'), done: P.done.has('B1'), key: P.prev.has('B1|240000009999'), b2: P.ords.has('B2') };
      o.mem = (() => { try { return localStorage.getItem('rn-ship-invdone') || ''; } catch (e) { return 'ERR'; } })(); o.oldN = S._invOldN || 0;
      invDoneAbsorb([{ createdAt: new Date().toISOString(), items: [{ orderNo: 'Z1', invoice: '1', state: 'done' }] }]); const z1 = !!invDoneOf('Z1'); invDoneAbsorb([{ createdAt: new Date().toISOString(), items: [{ orderNo: 'Z1', invoice: '1', state: 'fail' }] }]); o.failOut = z1 && !invDoneOf('Z1'); /* 검증 실패로 바뀌면 기억에서 뺌 */
      o.again = await invDoneOld(); /* 6시간 안에는 다시 안 읽음 */
      { const SH = window.ReadnowShipping; const Hd = SH.ALADIN_XLS_HEAD.slice(); const hi = Hd.indexOf('주문번호'), ti = Hd.indexOf('상품명'); const row = (no, t) => { const v = Hd.map(() => ''); v[hi] = no; v[ti] = t; return { v }; };
        const X = { ...S.ship, excel: { at: '9999', header: Hd, rows: [row('B1', '이미 송장 넣은 책'), row('B2', '아직 안 넣은 책')] } }; const A = alpsBuild(X, null, []); const A2 = alpsBuild(X, S.ship.orders, []);
        const sig = (A) => (A ? A.rows.length + ':' + (/이미 송장/.test(JSON.stringify(A.rows)) ? 'B1' : '') + (/아직 안 넣은/.test(JSON.stringify(A.rows)) ? 'B2' : '') : 'null'); o.alps = [sig(A), sig(A2)]; }
      const n0 = (await db.collection('shp_invoices').get()).docs.length;
      o.auto = await alpsInvAuto({ byOrder: [{ orderNo: 'B1', invoice: '240000007777', recipient: '손님A', status: 'ok' }] }, 'x.xlsx', 'runT6', { force: true }); o.autoNew = (await db.collection('shp_invoices').get()).docs.length - n0; /* 송장이 달라도 다시 맡기지 않음 */
      // ── ③ 같은 주소
      const k = (a) => shipAddrKey(a);
      o.addr = { same: k('시험시 시험구 시험로 1, 101동 202호') === k('시험시  시험구 시험로 1 101동 202호 (시험동)'), sido: k('서울특별시 시험구 시험로 1, 101동 202호') === k('서울 시험구 시험로 1 101동 202호'), hoDiff: k('시험시 시험구 시험로 1, 101동 202호') !== k('시험시 시험구 시험로 1, 101동 203호'), dongDiff: k('시험시 시험구 시험로 1, 101동 202호') !== k('시험시 시험구 시험로 1, 102동 202호'),
        noHo: k('시험시 시험구 시험로 1') === null, noBld: k('시험시 시험구 시험아파트 202호') === null, digits: k('시험시 시험구 시험로 1 101동 202호') !== k('시험시 시험구 시험로 11 01동 202호'), dash: k('시험시 시험구 시험로 1-2, 3호') === k('시험시 시험구 시험로 1 – 2 3호'),
        nmPh: shipPackRaw({ buyer: '손님A', recipient: { name: '손님A', phone: '010-0000-0000', address: '시험시 시험구 시험로 1, 101동 202호' } }) === shipPackRaw({ buyer: '손님B', recipient: { name: '손님B', phone: '02-000-0001', address: '시험시 시험구 시험로 1 101동 202호' } }) };
      o.feat = FEAT.filter((f) => /같은 주소 — 합포장 권함|오늘 끝 칸 비우는 때|송장은 넣었는데/.test(f.t)).length; o.old = FEAT.filter((f) => /같은 손님 — 합포장/.test(f.t)).length;
      S.shipTab = 'all'; S.shipSetOpen = true; await openShip(); await W(600); o.setUi = !!document.getElementById('shp_doneh') && document.getElementById('shp_doneh').value === '18';
      return o; });
    console.log(JSON.stringify(R));
    console.log('■ ① ✅ 오늘 끝 칸 — 그날 18:00에 빠짐 · 18시 뒤 끝낸 것은 다음 날 18:00까지');
    ok(R.def[0] === 18 && R.def[1] === 14, '기본값 18시 · 송장 끝 기억 14일 ' + R.def);
    ok(JSON.stringify(R.t10) === '[1,0,0,0,0,0]', '10:00 끝 → 17:59 보임 · 18:01·23:59·00:01·05:59·06:01 안 보임 ' + R.t10);
    ok(JSON.stringify(R.t19) === '[1,1,2,2,0]', '19:00 끝(18시 뒤) → 그날 밤·다음 날 17:59까지 보임 · 다음 날 18:01 빠짐 ' + R.t19);
    ok(JSON.stringify(R.h24) === '[1,0]', '설정 24 = 자정에 빠짐(예전과 같음) ' + R.h24);
    ok(JSON.stringify(R.cash) === '[2,0,1,0]', '현금: 기록의 출고함 시각(19:00)으로 다음 날 18:00까지 · 기록 없으면 날짜만(낮으로 봄)→ 그날 18:00까지 ' + R.cash);
    ok(R.rows.d1759 === 'al:N10 al:N19 y24:Y19' && R.rows.d1801 === 'al:N19 y24:Y19' && R.rows.n1759 === 'al:N19* y24:Y19*' && R.rows.n1801 === '', '줄(알라딘 빠진 끝·예스24): 17:59 / 18:01 / 다음 날 17:59 / 다음 날 18:01 ' + JSON.stringify(R.rows));
    console.log('■ ② 송장 입력 끝 주문은 기록이 오래돼도 끝 — 다시 넣지 않음');
    ok(!R.before && R.shipN === 2, '40시간 전 완료 기록은 36시간 듣기 창 밖 ' + R.shipN);
    ok(/^done\|invleft\|⚠ 송장 240000009999은 넣었는데/.test(R.b1) && R.b2 === 'deliv', "창 밖 완료 주문 → ✅ 끝 + ⚠ '송장은 넣었는데 알라딘 목록에 남아 있음' · 실패 주문은 그대로 출고 준비 " + R.b1.slice(0, 60) + ' / ' + R.b2);
    ok(R.excHas, '⚠ 사람이 볼 것 칸에 뜸');
    ok(R.pick === 'B2', '📋 이번에 묶을 주문(원스톱)에서 빠짐 ' + R.pick);
    ok(R.prev.ords && R.prev.done && R.prev.key && !R.prev.b2, 'invPrevSet(원스톱 묶음·손 맡김·ALPS 자동 맡김 공통)이 막음 ' + JSON.stringify(R.prev));
    ok(R.alps[0] === '1:B2' && R.alps[1] === '1:B2', 'ALPS 파일에도 다시 안 넣음(새 운송장 막기) ' + R.alps);
    ok(R.auto === 'none' && R.autoNew === 0, 'ALPS 자동 송장 맡김: 송장이 달라도 다시 맡기지 않음 ' + R.auto + ' ' + R.autoNew);
    ok(R.mem && /"B1":\["240000009999",\d+\]/.test(R.mem) && !/손님|010-|시험/.test(R.mem) && !/B2/.test(R.mem), '이 기기 기억엔 주문번호·송장·시각만(끝난 것만) ' + R.mem.slice(0, 120));
    ok(R.failOut, '넣은 뒤 검증에서 실패로 바뀐 주문은 기억에서 빠짐(실패는 ⚠로 사람이 봄)');
    ok(R.oldN >= 1 && R.oldN <= 30 && R.again === false, '창 밖 기록은 필요할 때 한 번만(최대 30문서 · 6시간 안 다시 안 읽음) ' + R.oldN + ' ' + R.again);
    console.log('■ ③ 같은 주소 판정');
    const A = R.addr; ok(A.same && A.sido && A.dash, '띄어쓰기·쉼표·괄호 참고 글·시도 줄임·- 모양만 다르면 같음 ' + JSON.stringify(A));
    ok(A.hoDiff && A.dongDiff && A.noHo && A.noBld && A.digits, '호수·동이 다르거나 호수·건물번호가 없으면 아님 · 숫자 사이 띄어쓰기는 남김');
    ok(A.nmPh, '이름·전화가 달라도 주소가 같으면 같은 곳');
    ok(R.feat === 3 && R.old === 0, '🔍 기능 찾기: 같은 주소·끝 칸 비우는 때·송장 남은 주문 ' + R.feat);
    ok(R.setUi, '⚙ 판매처 설정에 끝 칸 비우는 때(18) 칸');
  });
  ok(!errN, '화면 오류 없음 ' + errN); console.log(bad ? `❌ tSHP6 실패 ${bad}` : '✓ tSHP6 통과');
})();
