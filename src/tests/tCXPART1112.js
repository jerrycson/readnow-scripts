// tCXPART1112 — 정범님 11/12 '부분 취소' 구조
//  ① 수집기 cancelOrderCmd: ② 발송요청에서 일부만 취소 → 알라딘이 남은 상품을 다시 묶어 ① 주문확인요청으로 돌려보냄
//     → '확인 못 함'·'주문 전체 취소'가 아니라 '부분 취소 완료(다시 묶임)' + 남은 상품을 다시 발송요청으로(맡긴 일 rb_{주문}_{권수}) · ⏸ 보류 주문은 안 보냄 · 정말 전체가 빠졌으면 doneAll
//  ② 수집기 rbScanPc: 웹앱 밖(샵매니저)에서 한 부분 취소도 — 전에 발송요청으로 넘어간 주문이 상품이 줄어 주문확인요청에 다시 나타나면 같은 처리 · 같으면·새 상품이면·보내는 중이면·처음 주문이면 안 함
//  ③ 웹앱: '확인 못 함'으로 남은 취소를 목록에 없는 주문이라도 창으로 열어 ✅ 완료로 처리(두 번 · 기록 남김) · ↩ 되돌리기 · 부분 취소 완료 글 · 출고 화면 맨 위 알림
// 시험 주문번호는 가짜(001-A87…) · 손님 정보 없음 · 쓰는 법: RN_PORT=<포트> node tCXPART1112.js (harness.js 옆 · 그 위 폴더에 readnow-collector.user.js = 수집기 원본)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 500))); if (!c) bad++; };
const src = fs.readFileSync(path.join(__dirname, '..', 'readnow-collector.user.js'), 'utf8'); const a = src.indexOf('  const CX_LAYER = '); const b = src.indexOf('  /* 알라딘 답변 화면(form1 · ASP.NET)을 받은 그대로 보내');
if (a < 0 || b < 0) { console.log('❌ tCXPART1112 실패 — 코드 조각을 못 찾음'); process.exit(1); }
const CODE = src.slice(a, b);
require('./harness.js')(async (p) => {
  const R = await p.evaluate(async (CODE) => {
    const ONO = '001-A870000088';
    const form = (ono, items) => `<html><head><title>취소</title></head><body><form id="layerReportNotSales" method="GET" action="ReportNotSalesLayer.aspx"><ul><li><input type="radio" name="cancelReason" value="1"></li><li><input type="radio" name="cancelReason" value="2"></li></ul><ul>${items.map((x) => `<li><input name="ordersItem" type="checkbox" value="${x}" checked></li>`).join('')}</ul><input type="hidden" name="rdUrl" value=""><input type="hidden" name="rnsAction" value="1"><input type="hidden" name="ono" value="1"></form></body></html>`;
    const page = (orders, tab, full) => `<html><body>${JSON.stringify({ orders, tabCounts: { [tab]: full === false ? orders.length + 3 : orders.length } })}</body></html>`;
    // 가짜 Firestore(문서 저장 · orderNos array-contains · 트랜잭션)
    const mkFs = (seed) => { const D = JSON.parse(JSON.stringify(seed || {})); const ref = (col, id) => ({ id, col, get: async () => ({ exists: !!D[col + '/' + id], data: () => (D[col + '/' + id] ? JSON.parse(JSON.stringify(D[col + '/' + id])) : undefined) }), set: async (v, o) => { D[col + '/' + id] = o && o.merge ? { ...(D[col + '/' + id] || {}), ...v } : v; } });
      const C = (col) => ({ doc: (id) => ref(col, id), where: (f, op, val) => ({ limit: () => ({ get: async () => ({ docs: Object.entries(D).filter(([k, v]) => k.startsWith(col + '/') && Array.isArray(v[f]) && v[f].includes(val)).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)) })) }) }) }) });
      const db = { runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), set: (r, v, o) => W.push([r, v, o]) }); for (const [r, v, o] of W) await r.set(v, o); } }; return { D, C, db }; };
    const build = (F, extra) => { const logs = []; const ran = []; const PACE = { wait: async () => {} }, sleep = async () => {}, AL = { decode: (buf) => new TextDecoder().decode(buf), looksLoggedOut: () => false }; const nowIso = () => new Date().toISOString(); const TS = () => 'ts';
      const SH = { parseDeliveryPage: (doc) => JSON.parse(doc.body.textContent) }; const W0 = { ReadnowShipping: SH, __rnFeat: () => true, ...(extra || {}) };
      const fn = new Function('fetch', 'PACE', 'sleep', 'AL', 'nowIso', 'TS', 'PC_NAME', 'log', 'exBegin', 'exEnd', 'shipLiteRead', 'window', 'globalThis', 'C', 'db', 'runCmd', 'auth', 'PUBONLY', CODE + '\nreturn { cancelOrderCmd, rbScanPc, rbJudge };');
      return { logs, ran, mk: (fetchF) => fn(fetchF, PACE, sleep, AL, nowIso, TS, 'TEST-PC', (m) => logs.push(m), async () => ({ ok: true }), async () => {}, async () => {}, W0, W0, F.C, F.db, async (id) => ran.push(id), { currentUser: { email: 't@x' } }, false) }; };
    async function runCx(sc) { const F = mkFs(sc.seed); const B = build(F); const sent = []; let dN = 0, cN = 0;
      const fetchF = async (url) => { const u = String(url); let html = '';
        if (/ReportNotSalesLayer\.aspx\?ono=/.test(u) && !/rnsAction/.test(u)) html = form(ONO, sc.have);
        else if (/ReportNotSalesLayer\.aspx\?/.test(u)) { sent.push(u); html = `<script>alert('주문이 취소되었습니다.');</script>`; }
        else if (/worder_delivery\.aspx\?orderstep=4/.test(u)) { dN++; html = dN === 1 ? page([{ orderNo: ONO, items: sc.have.map((x) => ({ listingId: x })) }], '발송 요청') : page(sc.delivAfter, '발송 요청', sc.delivFull); }
        else if (/worder_preparatory_complete\.aspx/.test(u)) { cN++; html = sc.stage === 'confirm' && cN === 1 ? page([{ orderNo: ONO, items: sc.have.map((x) => ({ listingId: x })) }], '주문확인요청') : page(sc.confirmAfter, '주문확인요청', sc.confirmFull); }
        return { ok: true, status: 200, url: u, headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => new TextEncoder().encode(html).buffer }; };
      const fns = B.mk(fetchF); const store = {}; const ref = { id: 'cx_' + ONO, set: async (v, o) => { if (o && o.merge && v.result && store.result) v = { ...v, result: { ...store.result, ...v.result } }; Object.assign(store, v); } };
      await fns.cancelOrderCmd(ref, { orderNo: ONO, reason: '2', items: sc.want, stage: sc.stage || 'deliv', tries: 1 }); await new Promise((r) => setTimeout(r, 400));
      const rbIds = Object.keys(F.D).filter((k) => k.startsWith('shp_cmds/rb_')); return { st: store.status, r: store.result || {}, msg: store.msg, sent: sent.length, rbIds, rb: rbIds.length ? F.D[rbIds[0]] : null, ran: B.ran, logs: B.logs }; }
    const out = {};
    out.A = await runCx({ have: ['111', '222'], want: ['111'], delivAfter: [], confirmAfter: [{ orderNo: ONO, items: [{ listingId: '222' }] }] });
    out.B = await runCx({ have: ['111', '222'], want: ['111'], delivAfter: [], confirmAfter: [] });
    out.C = await runCx({ have: ['111', '222'], want: ['111'], delivAfter: [], confirmAfter: [{ orderNo: ONO, items: [{ listingId: '222' }] }], seed: { ['shp_auto/' + ONO]: { state: 'sent', hold: { on: true } } } });
    out.D = await runCx({ have: ['111', '222'], want: ['111'], delivAfter: [], confirmAfter: [], confirmFull: false });
    out.E = await runCx({ have: ['111', '222'], want: ['111'], delivAfter: [], confirmAfter: [{ orderNo: ONO, items: [{ listingId: '111' }, { listingId: '222' }] }] });
    out.F = await runCx({ have: ['111', '222', '333'], want: ['111'], stage: 'confirm', delivAfter: [], confirmAfter: [{ orderNo: ONO, items: [{ listingId: '222' }, { listingId: '333' }] }] });
    // ② 웹앱 밖 부분 취소 알아보기
    async function scan(seed, orders) { const F = mkFs(seed); const B = build(F); const fns = B.mk(async () => ({})); const r1 = await fns.rbScanPc(orders); await new Promise((r) => setTimeout(r, 400)); const r2 = await fns.rbScanPc(orders); const ids = Object.keys(F.D).filter((k) => k.startsWith('shp_cmds/rb_')); return { r1, r2, ids, rb: ids.length ? F.D[ids[0]] : null, ran: B.ran }; }
    const SD = (o, lids, st) => ({ type: 'startDelivery', orderNos: [o], status: st || 'done', results: st && st !== 'done' ? {} : { [o]: { state: 'done' } }, ...(lids ? { lids: { [o]: lids } } : {}) });
    const O2 = '001-A870000077'; const ord = (o, ids) => [{ orderNo: o, items: ids.map((x) => ({ listingId: x })) }];
    out.S1 = await scan({ ['shp_cmds/h1']: SD(O2, ['501', '502', '503']) }, ord(O2, ['502']));
    out.S2 = await scan({ ['shp_cmds/h1']: SD(O2, ['501', '502']) }, ord(O2, ['501', '502']));
    out.S3 = await scan({ ['shp_cmds/h1']: SD(O2, ['501', '502']) }, ord(O2, ['502', '509']));
    out.S4 = await scan({}, ord(O2, ['502']));
    out.S5 = await scan({ ['shp_cmds/h1']: SD(O2, ['501', '502']), ['shp_cmds/h2']: SD(O2, ['502'], 'queued') }, ord(O2, ['502']));
    out.S6 = await scan({ ['shp_cmds/auto_' + O2]: SD(O2, null), ['shp_auto/' + O2]: { state: 'sent', items: [{ lid: '501' }, { lid: '502' }] } }, ord(O2, ['501']));
    out.J = [build(mkFs()).mk(async () => ({})).rbJudge(['2'], ['1', '2']), build(mkFs()).mk(async () => ({})).rbJudge(['1', '2'], ['1', '2'])];
    return out; }, CODE);
  const A = R.A; ok(A.st === 'done' && A.r.state === 'done' && A.r.rebundled && A.r.partialDone && A.r.left.join() === '222' && A.r.learnedOpt === 'part' && A.sent === 1, '① 발송요청 부분 취소 → 주문확인요청에 남은 1권만 = 부분 취소 완료(다시 묶임)', { st: A.st, r: { s: A.r.state, rb: A.r.rebundled, left: A.r.left } });
  ok(A.rbIds.length === 1 && /rb_001-A870000088_1$/.test(A.rbIds[0]) && A.rb.type === 'startDelivery' && A.rb.auto === true && A.rb.lids['001-A870000088'].join() === '222' && A.rb.rebundle.src === 'cx' && A.rb.rebundle.gone.join() === '111' && A.ran.join() === 'rb_001-A870000088_1' && A.r.reSend && A.r.reSend.id === 'rb_001-A870000088_1', '  └ 남은 상품을 다시 발송요청으로: 맡긴 일 rb_{주문}_1(발송준비시작 · 자동) 만들고 바로 처리', { ids: A.rbIds, ran: A.ran, reSend: A.r.reSend });
  ok(R.B.st === 'done' && R.B.r.state === 'doneAll' && !R.B.rbIds.length, '① 두 목록 모두에 없음(다 읽음) → 주문 전체 취소(doneAll) · 다시 보내지 않음', { st: R.B.st, s: R.B.r.state });
  ok(R.C.st === 'done' && R.C.r.rebundled && R.C.r.reSend && R.C.r.reSend.hold && !R.C.rbIds.length, '① ⏸ 보류 주문 → 부분 취소 완료는 적지만 발송요청으로 다시 보내지 않음', { reSend: R.C.r.reSend, ids: R.C.rbIds });
  ok(R.D.st === 'unknown' && !R.D.rbIds.length, '① 주문확인요청을 다 못 읽음 → 확인 못 함(지어내지 않음)', { st: R.D.st, why: R.D.msg });
  ok(R.E.st === 'unknown' && !R.E.rbIds.length, '① 주문확인요청에 취소한 상품까지 그대로 → 확인 못 함 · 다시 보내지 않음', { st: R.E.st, msg: R.E.msg });
  ok(R.F.st === 'done' && R.F.r.state === 'done' && R.F.r.partialDone && !R.F.rbIds.length, '① 주문확인요청 단계 부분 취소 → 부분 취소 완료 · 다시 보낼 일 없음(아직 확인 전 주문)', { st: R.F.st, r: R.F.r.state });
  ok(R.S1.ids.length === 1 && /rb_001-A870000077_1$/.test(R.S1.ids[0]) && R.S1.rb.rebundle.src === 'outside' && R.S1.rb.rebundle.gone.join() === '501,503' && R.S1.ran.length === 1 && R.S1.r1.sent === 1 && R.S1.r2.sent === 0, '② 샵매니저에서 한 부분 취소(3권 → 1권으로 다시 묶임) → 다시 발송요청 · 두 번째 읽기엔 다시 안 함', { ids: R.S1.ids, r1: R.S1.r1, r2: R.S1.r2 });
  ok(!R.S2.ids.length && !R.S3.ids.length && !R.S4.ids.length && !R.S5.ids.length, '② 같은 상품 그대로(발송준비시작이 안 된 것)·새 상품이 섞임·한 번도 안 넘어간 주문·지금 보내는 중 → 안 함', [R.S2.ids, R.S3.ids, R.S4.ids, R.S5.ids]);
  ok(R.S6.ids.length === 1 && R.S6.rb.lids['001-A870000077'].join() === '501', '② 자동 발송요청으로 넘어간 주문(맡긴 일에 상품 줄 없음)은 자동 판단 기록의 상품으로 알아봄', R.S6.ids);
  ok(R.J[0] && R.J[0].gone.join() === '1' && R.J[1] === null, 'rbJudge: 줄어든 것만 부분 취소로', R.J);

  // ③ 웹앱
  const W = await p.evaluate(async () => { const ONO = '001-A870000066'; S.user = S.user || { email: 'tester@x' }; const out = {};
    const v = { type: 'cancelOrder', status: 'unknown', orderNo: ONO, orderNos: [ONO], stage: 'deliv', reason: 2, items: ['601'], itemsAll: ['601', '602'], titles: ['가짜 그림책 하나'], label: '발송요청 주문 ' + ONO + ' · 1/2권 · 품절 취소', msg: '일부만 골랐는데 주문이 읽은 목록에 안 보임', result: { state: 'unknown', sent: ['601'], before: ['601', '602'] }, createdAt: new Date(Date.now() - 3600e3).toISOString(), doneAt: new Date(Date.now() - 3590e3).toISOString(), hist: [] };
    await db.collection('shp_cmds').doc('cx_' + ONO).set(v); S.cmdAll = S.cmdAll || new Map(); S.cmdAll.set('cx_' + ONO, { id: 'cx_' + ONO, ...v });
    S._cxOrdDoc = new Map([[ONO, { items: [{ title: '가짜 그림책 하나', lineStatus: 'cancelledInOrder' }, { title: '다른 책', lineStatus: 'normal' }] }]]);
    S.ship = S.ship || { orders: [], tabCounts: {} }; S.shipC = S.shipC || { orders: [] };
    out.warn = cxWarnHtml(); cxOpen(ONO, null, 'deliv'); await new Promise((r) => setTimeout(r, 60)); const w = document.querySelector('.cxw-bg'); out.open = !!w; out.man = !!(w && w.querySelector('[data-cxman="done"]')); out.ev = ((w && w.querySelector('.cxw-man .ev')) || {}).textContent || ''; out.gone = /빠졌습니다/.test((w && w.textContent) || '');
    w.querySelector('[data-cxman="done"]').click(); await new Promise((r) => setTimeout(r, 60)); out.notYet = (await db.collection('shp_cmds').doc('cx_' + ONO).get()).data().status; out.armTxt = (document.querySelector('[data-cxman]') || {}).textContent || '';
    await new Promise((r) => setTimeout(r, 450)); document.querySelector('[data-cxman="done"]').click(); await new Promise((r) => setTimeout(r, 300));
    const d1 = (await db.collection('shp_cmds').doc('cx_' + ONO).get()).data(); out.after = { st: d1.status, rs: d1.result.state, prev: d1.result.manual && d1.result.manual.prevStatus, by: d1.result.manual && d1.result.manual.by, hist: (d1.hist || []).length, evid: d1.result.manual && d1.result.manual.evid };
    S.cmdAll.set('cx_' + ONO, { id: 'cx_' + ONO, ...d1 }); out.txt = (cxStTxt(S.cmdAll.get('cx_' + ONO)) || [])[1]; out.warn2 = cxWarnHtml(); cxDraw(); await new Promise((r) => setTimeout(r, 30)); out.undoBtn = !!document.querySelector('[data-cxman="undo"]');
    document.querySelector('[data-cxman="undo"]').click(); await new Promise((r) => setTimeout(r, 450)); document.querySelector('[data-cxman="undo"]').click(); await new Promise((r) => setTimeout(r, 300));
    const d2 = (await db.collection('shp_cmds').doc('cx_' + ONO).get()).data(); out.undo = { st: d2.status, rs: d2.result.state, hist: (d2.hist || []).length, man: d2.result.manual }; cxClose();
    // 부분 취소 완료 글
    out.part = (cxStTxt({ status: 'done', doneAt: new Date().toISOString(), items: ['601'], result: { state: 'done', partialDone: true, rebundled: true, left: ['602'], sent: ['601'], before: ['601', '602'], reSend: { id: 'rb_x_1' } } }) || [])[1];
    out.partHold = (cxStTxt({ status: 'done', doneAt: new Date().toISOString(), items: ['601'], result: { state: 'done', rebundled: true, left: ['602'], sent: ['601'], before: ['601', '602'], reSend: { hold: true } } }) || [])[1];
    out.oldPart = (cxStTxt({ status: 'done', doneAt: new Date().toISOString(), result: { state: 'done', sent: ['1'], before: ['1', '2'] } }) || [])[1]; out.whole = (cxStTxt({ status: 'done', doneAt: new Date().toISOString(), result: { state: 'done', sent: ['1', '2'], before: ['1', '2'] } }) || [])[1];
    // 출고 화면 알림 — 부분 취소 뒤 주문확인요청에 다시 나타난 주문 · 다시 보내는 중
    const O3 = '001-A870000055'; const sd = { id: 'h3', type: 'startDelivery', orderNos: [O3], status: 'done', results: { [O3]: { state: 'done', at: new Date(Date.now() - 600e3).toISOString() } }, lids: { [O3]: ['701', '702'] }, createdAt: new Date(Date.now() - 700e3).toISOString(), doneAt: new Date(Date.now() - 600e3).toISOString() };
    S.cmdAll.set('h3', sd); S.shipStart = [sd]; S.shipC = { at: new Date().toISOString(), orders: [{ orderNo: O3, items: [{ listingId: '702', title: '남은 책' }] }] }; out.rb = cxWarnHtml();
    const rbq = { id: 'rb_' + O3 + '_1', type: 'startDelivery', orderNos: [O3], status: 'queued', auto: true, rebundle: { src: 'outside' }, lids: { [O3]: ['702'] }, createdAt: new Date().toISOString() }; S.cmdAll.set(rbq.id, rbq); S.shipStart = [rbq, sd]; out.go = cxWarnHtml();
    S.shipTab = 'confirm'; S.shipSrc = 'all'; S.cmdAll.delete(rbq.id); S.shipStart = [sd]; try { await openShip(); } catch (e) { out.osErr = e.message; } await new Promise((r) => setTimeout(r, 300)); out.ship = { rb: !!document.querySelector('#cxwarn_rb'), unk: !!document.querySelector('#cxwarn_unk') };
    return out; });
  ok(/주문 취소 결과 확인 필요 1건/.test(W.warn) && /0066/.test(W.warn), '③ 출고 맨 위: 취소 결과 확인 필요 1건(누르면 취소 창)', W.warn.replace(/<[^>]+>/g, '').slice(0, 120));
  ok(W.open && W.man && W.gone && /품절취소/.test(W.ev), '③ 목록에서 빠진 주문도 취소 창이 열림 · ✅ 완료로 처리 단추 · 판매 전체 조회 근거(품절취소)', { open: W.open, man: W.man, ev: W.ev });
  ok(W.notYet === 'unknown' && /한 번 더/.test(W.armTxt), '③ 첫 누름은 확인만(두 번 눌러 확정)', W.armTxt);
  ok(W.after.st === 'done' && W.after.rs === 'manualDone' && W.after.prev === 'unknown' && !!W.after.by && W.after.hist === 1 && /품절취소/.test(W.after.evid || ''), '③ 두 번 → 완료로 처리 · 전 상태·누가·근거 기록 · hist 한 줄', W.after);
  ok(/취소 완료로 처리함/.test(W.txt) && !/확인 필요/.test(W.warn2) && W.undoBtn, '③ 창 글 \'취소 완료로 처리함\' · 맨 위 알림에서 빠짐 · ↩ 되돌리기 단추', W.txt);
  ok(W.undo.st === 'unknown' && W.undo.rs === 'unknown' && W.undo.hist === 2 && !W.undo.man, '③ ↩ 되돌리기 두 번 → 전 상태(확인 못 함)로 · 기록 두 줄(지우지 않음)', W.undo);
  ok(/부분 취소 완료/.test(W.part) && /취소주문 목록에 남기지 않아/.test(W.part) && /다시 보냄/.test(W.part) && /보류/.test(W.partHold) && /부분 취소 완료/.test(W.oldPart) && !/부분 취소/.test(W.whole), '③ 부분 취소 완료 글(다시 보냄·보류) · 옛 결과도 보낸 수 < 그때 수면 부분 · 전체는 아님', { part: W.part, hold: W.partHold, whole: W.whole });
  ok(/부분 취소 뒤 다시 확인 필요 1건/.test(W.rb) && /0055/.test(W.rb) && /worder_preparatory_complete/.test(W.rb) && !/다시 확인 필요/.test(W.go) && /다시 보내는 중 1건/.test(W.go), '③ 출고 맨 위: 부분 취소 뒤 다시 확인 필요(샵매니저 링크) · 자동으로 보내는 중이면 그 글로', { rb: W.rb.replace(/<[^>]+>/g, '').slice(0, 140), go: W.go.replace(/<[^>]+>/g, '').slice(0, 100) });
  ok(W.ship.rb && !W.osErr, '③ 출고 화면을 열면 맨 위에 알림 칸', { ship: W.ship, err: W.osErr });
  console.log(bad ? `❌ tCXPART1112 실패 ${bad}` : '✓ tCXPART1112 통과');
});
