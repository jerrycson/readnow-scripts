// tONESHOT — 정범님 11/04 '출고 송장 원스톱: 처리 버튼을 한 번만 누르고 송장 입력까지 · 에러가 생길 때만 관리자가 개입' (웹앱 쪽 · 가짜 ALPS 도우미 + 가짜 수집기·예스24 연결 창)
//  ① 시작 전 점검: 프린터 이상이면 한 번에 알리고 멈춤(그래도 시작 없음) → 고친 뒤 「다시 점검」
//  ② 정상 한 바퀴: 알라딘 2 + 💵 현금 1 + 🟦 예스24 1 → ALPS(첫 출력 뒤 종이 확인 한 번) → 맞춤(예스24·현금 송장 기록) → 알라딘 송장 맡김(1건 + 자동 검증 + 저절로 계속) → 예스24 첫 건 발송처리 → 판매처 다시 읽기 → 끝
//     · 진행 중에 저장한 현금 판매는 지금 세션에 섞지 않고 남김(정범님 11/06 — 저절로 이어 하지 않음) → ▶ 다시 누르면 새 세션에서 · 주소 없는 현금은 ⚠ '주소 적기' · 🛰 한 줄(shp_runs)
//  ③ 첫 건 자동 검증 실패 → 멈추고 ⚠(그때만 사람) → 「알라딘에서 확인했음 — 나머지 계속」 ④ 로그인 풀림 → '🔑 로그인했음 — 다시 맡기기'(「나머지 계속」 아님)
//  ⑤ 송장 입력 탭 닫힘(맥박 끊김) → 다시 맡기기로 되돌림 ⑥ 같은 송장 두 번 막기(다른 맡김 문서) ⑦ 자정 넘기기: 어제 시작한 열린 실행을 날짜가 아니라 id로 이어받음 ⑧ 끝난 ALPS 일을 웹앱이 못 본 채 닫혔어도 다시 열면 이어서
//  시험 자료 손님은 '손님A…' · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  /* (11/07) Firestore REST(15초마다 출고 목록 다시 읽기 shipRestTick)는 '연결 실패'로 — 시험 틀은 바깥 주소를 모두 404로 답해 웹앱이 '오늘 출고 문서 없음'으로 받아 목록을 잠깐 비웠고,
     ⑤-2의 P1(묶기)이 그 순간에 걸리면 '보낼 주문이 없음'으로 끝났음(1.78.406 뒤 4번 중 3번 실패의 원인 · 실제로는 문서가 늘 있어 404 없음) */
  await p.route(/firestore\.googleapis\.com\//, (r) => r.abort());
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\//, (r) => r.fulfill({ body: require('fs').readFileSync(__dirname + '/xlsx.full.min.js'), contentType: 'application/javascript' }));
  /* 가짜 ALPS 도우미(127.0.0.1:8898) — 시작 → 2번 묻고 나면 종이 확인 물음(첫 출력 뒤 한 번) → 답하면 끝 · 운송장 = 받는 분마다 하나 */
  const H = { n: 0, run: null, body: null, bodies: [], inputs: [], polls: 0, printerBad: null, ver: '0.5.6', hist: [], results: {} };
  const step = (st) => ['login', 'check', 'upload', 'print', 'verify', 'send'].map((k, i) => ({ k, l: k, st: i < st ? 'ok' : i === st ? 'run' : 'todo', pct: 50, d: '' }));
  await p.route(/^http:\/\/127\.0\.0\.1:8898\//, async (r) => { const u = new URL(r.request().url()); const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(o) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (u.pathname === '/alps/status') { const R = H.run; if (R && R.status === 'run') { R.polls = (R.polls || 0) + 1; if (R.polls > 2 && !R.asked) { R.asked = 1; R.status = 'wait'; R.need = { id: 1, type: 'choice', msg: '종이 확인: 상자 모두 바르게 나왔나요?', options: ['바르게 나왔음', '빈 장·안 나옴', '멈춤'] }; } }
      return J({ ok: true, ver: H.ver, pc: 'MJ-MAIN', cfg: { printer: '롯데택배 시험' }, cred: { saved: true }, run: R, key: { fp: 'f', pub: 'P' }, remote: { on: false } }); }
    if (u.pathname === '/alps/pcheck') return J(H.printerBad ? { ok: true, bad: H.printerBad } : { ok: true, state: '상태 3 · 오류 0 · 대기열 0' });
    if (u.pathname === '/alps/hist') return J({ ok: true, hist: H.hist });
    if (u.pathname === '/alps/run') { const b = JSON.parse(r.request().postData()); H.body = b; H.bodies.push(b); const id = 'r' + (++H.n); const box = {}; let k = 0; H.results[id] = [['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ...b.rows.map((x, i) => { if (!box[x.name]) box[x.name] = String(240000000100 + H.n * 10 + (++k)); return [box[x.name], x.name, x.title, x.sku, 'M' + id + i, '출력', '', '']; })];
      H.run = { id, fileName: b.fileName, status: 'run', steps: step(1), summary: {} }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/input') { const a = JSON.parse(r.request().postData()); H.inputs.push(a); if (H.run && H.run.status === 'wait') H.run = { ...H.run, status: 'done', done: true, hasResult: true, need: null, steps: step(6), summary: { rows: H.body.rows.length, boxes: 2, printed: 2, waybills: H.body.rows.length, upload: { ok: H.body.rows.length } } }; return J({ ok: true }); }
    if (u.pathname === '/alps/result') { const id = u.searchParams.get('id'); return H.results[id] ? J({ ok: true, aoa: H.results[id] }) : J({ ok: false }); }
    if (u.pathname === '/alps/update') return J({ ok: true });
    return J({ ok: false }); });
  p.on('dialog', (d) => d.accept());
  await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: require('fs').readFileSync(__dirname + '/xlsx.full.min.js', 'utf8') });
  await p.exposeFunction('__H', (k, v) => { if (k === 'printerBad') H.printerBad = v; if (k === 'hist') H.hist = v; if (k === 'run') H.run = v; return JSON.parse(JSON.stringify({ n: H.n, bodies: H.bodies.map((b) => ({ fileName: b.fileName, firstOne: b.firstOne, paperCheck: b.paperCheck, rows: b.rows.map((x) => x.ono + '|' + x.name) })), inputs: H.inputs })); });
  const o = await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; window.confirm = () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; S.app = S.app || {}; S.app.oneShot = { invFirstTest: true, paperTest: true }; await db.collection('app_settings').doc('main').set({ oneShot: { invFirstTest: true, paperTest: true } }, { merge: true }); /* (11/06 오후) 이 시험 ①~⑧은 예전 시험(첫 건 시험·종이 확인)을 설정에서 켠 원스톱 — 기본(시험 없음)은 맨 끝 ⑨ */
    const untilA = async (f, ms) => until(async () => { const r = runDoc(); if (r.need && r.need.k === 'alps' && r.status === 'wait' && S.alps.ansFor !== ((S.alps.st || {}).id + ':' + r.need.nid)) await osAct('alps:바르게 나왔음'); return f(); }, ms); /* 묶음마다 첫 출력 뒤 종이 확인 한 번 — 답하면서 기다림 */
    const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 60000)) { try { if (await f()) return true; } catch (e) {} await W(300); } return false; };
    const SH = window.ReadnowShipping; const td = SH.ymd(new Date()); const now = () => new Date().toISOString();
    /* 상품·예스24 주문(접수확인함 · 주소 있음) — tY24AUTO와 같은 틀 */
    const L = (id, x) => S.plist.set('aladin_' + id, { id: 'aladin_' + id, usedCode: id, listingId: 'L' + id, status: '판매중지', active: false, qty: 1, grade: '상', price: 15000, sku: 'PNKLUX', ...x });
    L('U800000001', { title: '예스24 책', isbn13: '9791100000031', sku: 'PNKd1' }); L('U800000003', { title: '현금 책', isbn13: '9791100000055', sku: 'YLWd3' }); L('U800000004', { title: '현금 책 둘', isbn13: '9791100000062', sku: 'YLWd4' }); S.ver++;
    const cash = (id, nm, title, lk, addr) => putOrder(id, { id, platform: 'cash', kind: 'sale', cash: true, orderNo: '현금-' + id, orderedAt: td + ' 11:00', buyer: { name: nm, phone1: '010-0000-0000' }, recipient: { name: nm, phone1: '010-0000-0000', address: addr }, shippedAt: null, items: [{ title, qty: 1, price: 5000, lineStatus: 'normal', listingKey: lk }] });
    cash('cash_a', '손님E', '현금 책', 'aladin_U800000003', '어느 시 어느 길 1'); S._saleIdx = null; bump('o');
    S.y24.un = () => {}; S.y24.loaded = true; S.y24.ver = (S.y24.ver || 0) + 1; S.y24.lk = { m: {}, x: {} }; S.y24.lkUn = () => {};
    const raw = (id, sig, body) => db.collection('crm_y24_raw').doc(id).set({ sig, at: now(), part: 0, parts: 1, body: JSON.stringify(body) });
    await raw('r1', 'POST /api/Order/OrderDeliveryList', { DELIVERY_LIST: [{ ORD_NO: 'Y2611040001', ORD_DTL_NO: 1, GOODS_NO: 196000001, GOODS_NM: '예스24 책', EAN: '9791100000031', GOODS_LEVEL_GB_NM: '상', ORD_STAT_NM: '발송처리 예정', ORD_DT: td + ' 09:00:00', ORDR_NM: '손님F', RCVR_NM: '손님F', RCVR_HP: '010-0000-0000', RCVR_ADDR: '어느 시 어느 길 2', SALE_PRICE: 12000 }], TOTAL_COUNT: 1 });
    await raw('r2', 'POST /api/Order/NewOrderConfirmList', { RESULT_LIST: [], TOTAL_COUNT: 0 }); y24oWatch(); await W(400); await y24oScan(true); await W(500);
    /* 알라딘 발송 요청(오늘 출고) + 엑셀 */
    const HX = SH.ALADIN_XLS_HEAD; const row = (no, sku, t, rcv) => ({ v: HX.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345', 주문일: td + ' 09:00' }[h] || '')) });
    const ord = (no, rcv, items) => ({ orderNo: no, buyer: rcv, orderedAt: td + ' 09:00', recipient: { name: rcv }, items });
    const setShip = async (orders, rows) => { S.ship = { at: now(), tabCounts: { '발송 요청': orders.length }, orders }; FS.shp_state = FS.shp_state || {}; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); FS.shp_state.excel = S.shipX = { at: now(), header: HX, rows }; };
    await setShip([ord('A-01', '손님A', [{ listingId: '91', title: '파란 책', price: 5000, qty: 1, sku: 'BLUAAA' }]), ord('A-02', '손님B', [{ listingId: '92', title: '분홍 책', price: 6000, qty: 1, sku: 'PNKLUX' }])], [row('A-01', 'BLUAAA', '[중고-최상] 파란 책', '손님A'), row('A-02', 'PNKLUX', '분홍 책', '손님B')]);
    await db.collection('prd_jobs').doc('pcBeat').set({ pcs: { 'PC-T': { atMs: Date.now(), at: now(), ok: true } } });
    /* 가짜 수집기(알라딘 송장 입력 탭) — 수집기와 같은 규칙: 맡음 → 첫 건 → (verify) 배송&구매확정전 확인 → 맞으면 저절로 계속/틀리면 멈춤 · 로그인 풀림 · 탭 닫힘(맥박 끊김) */
    window.FC = { mode: 'ok', seen: [] }; setInterval(async () => { for (const [id, v0] of Object.entries(FS.shp_invoices || {})) { const v = JSON.parse(JSON.stringify(v0)); const ref = db.collection('shp_invoices').doc(id);
        if (v.status === 'queued') { await ref.set({ status: 'running', claim: { pc: 'PC-T', at: now() }, beat: now() }, { merge: true }); continue; } if (v.status !== 'running' || (FC.dead === id && !(v.reclaimN >= 1))) continue; /* 되돌려 다시 맡기면 '새 탭'이 이어서 */
        if (FC.mode === 'login') { FC.mode = 'ok'; await ref.set({ status: 'paused', pausedAt: now(), needLogin: true, pauseWhy: '알라딘 로그인 풀림 — 로그인 뒤 다시 맡기기' }, { merge: true }); continue; }
        if (FC.mode === 'die') { FC.dead = id; FC.mode = 'ok'; await ref.set({ beat: new Date(Date.now() - 20 * 60e3).toISOString(), claim: { pc: 'PC-T', at: new Date(Date.now() - 20 * 60e3).toISOString() }, stepNow: { at: new Date(Date.now() - 20 * 60e3).toISOString(), m: '송장 칸에 넣음' } }, { merge: true }); continue; }
        const items = v.items; const todo = items.filter((x) => x.state === 'todo'); if (v.limit && v.verify && !v.verified) { todo[0].state = 'done'; FC.seen.push(todo[0].orderNo + ':' + todo[0].invoice); const good = FC.mode !== 'vfail'; if (FC.mode === 'vfail') FC.mode = 'ok';
          const verified = { at: now(), ok: good, orderNo: todo[0].orderNo, invoice: todo[0].invoice, why: good ? null : '주문은 있으나 송장번호가 다름' };
          if (!good) { await ref.set({ items, status: 'paused', pausedAt: now(), verified, verifyFail: true, pauseWhy: '첫 건 자동 검증 실패 — ' + verified.why }, { merge: true }); continue; } if (v.autoCont === false) { await ref.set({ items, status: 'paused', pausedAt: now(), verified }, { merge: true }); continue; } await ref.set({ items, verified, limit: 0, beat: now() }, { merge: true }); continue; }
        todo.forEach((x) => { x.state = 'done'; FC.seen.push(x.orderNo + ':' + x.invoice); }); await ref.set({ items, status: 'done', doneAt: now() }, { merge: true }); } }, 700);
    /* 가짜 예스24 연결 창 — 발송처리 맡김을 받아 끝냄(확인 필요 confirm이면 기다림) · 가짜 '다시 읽기'(송장 넣은 알라딘 주문은 발송 요청에서 빠짐) */
    window.Y24C = []; setInterval(async () => { for (const [id, v] of Object.entries(FS.crm_y24_orders || {})) { const a = (v.auto || {}).ship; if (a && a.state === 'queued' && !a.confirm) { Y24C.push(id + ':' + a.confirm); await db.collection('crm_y24_orders').doc(id).set({ auto: { ship: { ...a, state: 'done', endAt: now() } }, ystage: 'sent' }, { merge: true }); } }
      for (const [id, v] of Object.entries(FS.shp_cmds || {})) if (v.type === 'read' && v.status === 'queued') { const done = new Set(Object.values(FS.shp_invoices || {}).flatMap((x) => (x.items || []).filter((i) => i.state === 'done').map((i) => i.orderNo))); await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); S.ship = { ...S.ship, at: now(), orders: S.ship.orders.filter((q) => !done.has(q.orderNo)) }; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); } }, 700);
    const runDoc = () => (FS.shp_runs || {})[S.os.id] || {};
    /* ① 시작 전 점검 — 프린터 이상 */
    await __H('printerBad', '오프라인'); const id1 = await window.shipOneShot(); await until(() => runDoc().status === 'wait', 20000); const d1 = runDoc();
    o.p0 = { st: d1.status, k: (d1.need || {}).k, msg: (d1.need || {}).msg, lines: (d1.need || {}).lines, btns: ((d1.need || {}).btns || []).map((x) => x[0]), hard: (d1.p0 || []).filter((x) => x.hard).map((x) => x.k) };
    S.shipTab = 'deliv'; await openShip(); await W(900); o.box1 = (document.getElementById('os_box') || {}).innerText || ''; o.shl1 = !!document.querySelector('[data-shl="os:' + id1 + '"]');
    await __H('printerBad', null); document.querySelector('[data-osact="retry"]').click();
    /* ② 정상 한 바퀴 — ALPS 종이 확인 물음 → 그 사이 현금 판매 저장(다음 묶음) · 주소 없는 현금(⚠ 주소 적기) */
    o.waitPaper = await until(() => runDoc().need && runDoc().need.k === 'alps', 40000); o.alpsNeed = runDoc().need;
    cash('cash_b', '손님G', '현금 책 둘', 'aladin_U800000004', '어느 시 어느 길 3'); S._saleIdx = null; bump('o'); await osCashSaved('cash_b', S.orders.get('cash_b'));
    cash('cash_c', '손님H', '주소 없는 책', null, ''); S._saleIdx = null; bump('o'); await osCashSaved('cash_c', S.orders.get('cash_c'));
    o.cashLine = (runDoc().log || []).some((x) => /현금 판매 1건 저장 — 지금 세션에는 섞지 않음/.test(x.m)); o.cashWarn = (runDoc().warn || []).find((w) => w.act === 'cash:cash_c') || null;
    const ob = document.querySelector('#os_box [data-osact="alps:바르게 나왔음"]'); o.paperBtn = !!ob; if (ob) ob.click(); else await osAct('alps:바르게 나왔음');
    o.done1 = await untilA(() => runDoc().status === 'done', 120000); const d2 = runDoc(); o.d2 = { st: d2.status, bt: (d2.bt || []).map((b) => ({ n: b.n, kind: b.kind, al: b.al, y24: b.y24, match: b.match, inv: b.inv, y24s: b.y24s, chk: b.chk })), sum: d2.sum, warn: (d2.warn || []).map((w) => w.k + ':' + (w.act || '')), need: d2.need, log: (d2.log || []).map((x) => x.m).slice(-40) };
    o.row = (shipLiveRows().find((r) => r.id === 'os:' + id1) || {}); o.row = { t: o.row.t, st: o.row.st, doc: o.row.doc, pg: o.row.pg, bad: o.row.bad };
    o.sess1 = { pendLeft: d2.pendLeft, endLine: (d2.log || []).some((x) => /이번 세션 끝 — 새로 들어온 주문 \d+건.*이어 하지 않음/.test(x.m)), noP1: !(d2.log || []).some((x) => /다음 묶음으로 이어서/.test(x.m)), cashB0: ((FS.crm_orders || {}).cash_b || {}).invoice || null };
    /* (정범님 11/06) 남은 현금 판매는 관리자가 ▶ 다시 눌러 새 세션으로 */ const idB = await window.shipOneShot(); o.sess2 = { newId: idB !== id1, done: await untilA(() => runDoc().status === 'done', 120000) }; o.sess2.bt = (runDoc().bt || []).map((b) => ({ y24: b.y24 }));
    o.H = await __H(); const inv1 = (FS.shp_invoices || {})['alps_r1'] || {}; o.inv1 = { limit0: inv1.limit, verify: inv1.verify, autoCont: inv1.autoCont, from: inv1.from, n: (inv1.items || []).length, st: inv1.status, verified: !!(inv1.verified && inv1.verified.ok) };
    o.cashA = ((FS.crm_orders || {}).cash_a || {}).invoice || null; o.cashB = ((FS.crm_orders || {}).cash_b || {}).invoice || null; o.y24 = (((FS.crm_y24_orders || {}).Y2611040001 || {}).auto || {}).ship || null; o.Y24C = Y24C.slice();
    o.noPii = !/손님[A-H]/.test(JSON.stringify(FS.shp_runs[id1]));
    /* ⑥ 같은 송장 두 번 막기 — 같은 맞춤으로 다른 ALPS 일 id(다른 문서)에 맡기려 하면 'none' */
    o.dup = await alpsInvAuto({ byOrder: [{ orderNo: 'A-01', invoice: (FS.shp_invoices.alps_r1.items.find((x) => x.orderNo === 'A-01') || {}).invoice, status: 'ok', recipient: '손님A' }] }, 'x', 'other_run', { force: true });
    /* ③ 첫 건 자동 검증 실패 + ④ 로그인 풀림 — 새 주문으로 새 실행 */
    await setShip([ord('A-03', '손님C', [{ listingId: '93', title: '초록 책', price: 5000, qty: 1, sku: 'GRNAAA' }]), ord('A-04', '손님D', [{ listingId: '94', title: '노랑 책', price: 5000, qty: 1, sku: 'YLWAAA' }])], [row('A-03', 'GRNAAA', '초록 책', '손님C'), row('A-04', 'YLWAAA', '노랑 책', '손님D')]);
    FC.mode = 'vfail'; const id2 = await window.shipOneShot(); o.newId = id2 !== id1; await until(() => runDoc().need && runDoc().need.k === 'alps', 40000); await osAct('alps:바르게 나왔음');
    o.vfail = await until(() => runDoc().status === 'wait' && runDoc().need && /자동 검증 실패/.test(runDoc().need.msg || ''), 60000); o.vfNeed = runDoc().need; o.vfInvPaused = ((FS.shp_invoices || {})[((runDoc().bt || [])[0] || {}).invDoc] || {}).status;
    await openShip(); await W(800); o.vfBtnShip = !!document.querySelector('#inv_cont') && /자동 검증 실패/.test(document.getElementById('sheet').innerText);
    FC.mode = 'login'; await osAct('invcont'); o.login = await until(() => runDoc().need && /로그인/.test(runDoc().need.msg || ''), 30000); o.loginNeed = runDoc().need;
    await openShip(); await W(800); o.relogBtn = !!document.querySelector('#inv_relog'); o.noContOnLogin = !document.querySelector('#inv_cont');
    await osAct('relogin'); o.done2 = await untilA(() => runDoc().status === 'done', 60000); o.d3 = { st: runDoc().status, inv: ((runDoc().bt || [])[0] || {}).inv };
    /* ⑤ 탭 닫힘 — 맥박 끊긴 '하는 중' 맡김을 되돌림(웹앱 쪽 규칙 · 수집기와 같은 트랜잭션) */
    await db.collection('shp_invoices').doc('dead1').set({ createdAt: now(), status: 'running', beat: new Date(Date.now() - 15 * 60e3).toISOString(), claim: { pc: 'PC-T', at: new Date(Date.now() - 15 * 60e3).toISOString() }, items: [{ orderNo: 'Z1', invoice: '1', state: 'sent' }] });
    await db.collection('shp_invoices').doc('live1').set({ createdAt: now(), status: 'running', beat: now(), claim: { pc: 'PC-T', at: now() }, items: [] });
    o.re1 = await osInvReclaim('dead1', 10); o.re2 = await osInvReclaim('live1', 10); o.reDoc = { st: FS.shp_invoices.dead1.status, n: FS.shp_invoices.dead1.reclaimN, item: FS.shp_invoices.dead1.items[0].state, claim: FS.shp_invoices.dead1.claim }; for (const k of ['dead1', 'live1']) await db.collection('shp_invoices').doc(k).set({ status: 'stopped' }, { merge: true }); await W(800);
    /* ⑤-2 진행 중 탭 닫힘을 원스톱이 알아채 다시 맡김 → 수집기가 다시 맡아 끝냄 */
    S.app.oneShot = { invStaleMin: 10, invFirstTest: true, paperTest: true }; await db.collection('app_settings').doc('main').set({ oneShot: S.app.oneShot }, { merge: true }); await setShip([ord('A-05', '손님I', [{ listingId: '95', title: '보라 책', price: 5000, qty: 1, sku: 'PRPAAA' }])], [row('A-05', 'PRPAAA', '보라 책', '손님I')]);
    FC.mode = 'die'; const id3 = await window.shipOneShot(); await until(() => runDoc().need && runDoc().need.k === 'alps', 40000); await osAct('alps:바르게 나왔음');
    o.done3 = await untilA(() => runDoc().status === 'done', 90000); o.d4 = { log: (runDoc().log || []).map((x) => x.m).filter((m) => /소식이|다시 맡기기로/.test(m)), inv: ((runDoc().bt || [])[0] || {}).inv, reN: ((FS.shp_invoices || {})[((runDoc().bt || [])[0] || {}).invDoc] || {}).reclaimN };
    /* ⑦ 자정 넘기기 — 어제 날짜 실행이 열린 채(주인 소식 끊김) → 오늘 누르면 새로 만들지 않고 그 id로 이어받음 */
    osStopDrive(); const yid = '20261103_9'; await db.collection('shp_runs').doc(yid).set({ id: yid, day: '20261103', status: 'wait', ph: 'END', bt: [], cur: 0, warn: [], need: { k: 'x', msg: '시험', btns: [['retry', '다시']] }, owner: { tab: 'old', dev: 'OLD', beat: new Date(Date.now() - 10 * 60e3).toISOString() }, createdAt: new Date(Date.now() - 3 * 3600e3).toISOString(), log: [] });
    await db.collection('shp_runs').doc('_lock').set({ id: yid }, { merge: true }); await W(300); const id4 = await window.shipOneShot(); o.mid = { same: id4 === yid, done: await until(() => ((FS.shp_runs || {})[yid] || {}).status === 'done', 20000), owner: (((FS.shp_runs || {})[yid] || {}).owner || {}).tab === OS_TAB };
    /* ⑧ 끝난 ALPS 일을 못 본 채 닫힘 → 다시 열면 맞춤·알라딘 맡김을 이어서 */
    await setShip([ord('A-06', '손님J', [{ listingId: '96', title: '회색 책', price: 5000, qty: 1, sku: 'GRYAAA' }])], [row('A-06', 'GRYAAA', '회색 책', '손님J')]); S.alps.keep = null; S.alps.opened = null; S.alps.chk = false; S.alps.st = null;
    await db.collection('app_settings').doc('main').set({ alpsInvAuto: { on: true } }, { merge: true }); S.app.alpsInvAuto = { ...(S.app.alpsInvAuto || {}), on: true }; const pr = await fetch('http://127.0.0.1:8898/alps/run', { method: 'POST', headers: { 'X-RN-Print': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: '판매완료' + td.replace(/-/g, '') + '.xlsx', b64: 'x', rows: [{ name: '손님J', title: '회색 책', sku: 'GRYAAA', ono: 'A-06' }] }) });
    const rid = (await pr.json()).run.id; await __H('run', { id: rid, fileName: 'x.xlsx', status: 'done', done: true, hasResult: true, steps: [], summary: {} }); await openShip(); o.post = await until(() => !!(FS.shp_invoices || {})['alps_' + rid] && ((FS.shp_invoices['alps_' + rid].items || [])[0] || {}).orderNo === 'A-06', 15000); o.postDbg = { rid, ls: localStorage.getItem('rn-alps-post-' + rid), H: Object.keys(FS.shp_invoices || {}), on: S.app.alpsInvAuto };
    /* ⑨ (정범님 11/06 오후 '진정한 원스톱') 기본 = 첫 건 시험·종이 확인 없음 — 알라딘 맡김은 limit 0·verify 없음 · 도우미에 paperCheck false · 설정 칸 기본 끔 */
    S.app.oneShot = {}; await db.collection('app_settings').doc('main').set({ oneShot: firebase.firestore.FieldValue.delete() }, { merge: true }); await W(300); S.app.oneShot = {}; o.def = { ft: osCfg().invFirstTest, pt: osCfg().paperTest, way: invSpeed().bulkWay }; o.defSet = /id="os_ift" >/.test(shipOneShotHtml()) && /id="os_ppt" >/.test(shipOneShotHtml());
    { const rr = await alpsInvAuto({ byOrder: [{ orderNo: 'Z-91', invoice: '240000009991', status: 'ok', recipient: '손님A' }, { orderNo: 'Z-92', invoice: '240000009992', status: 'ok', recipient: '손님A' }] }, 'x', 'def_run', { force: true }); const dd = (FS.shp_invoices || {}).alps_def_run || {}; o.defInv = { rr, limit: dd.limit, verify: dd.verify, way: (dd.speed || {}).bulkWay, log: ((dd.log || [])[0] || {}).m || '' }; }
    o.guide = JSON.stringify((typeof pgdDefs === 'function' ? pgdDefs().ship : null) || '').includes('원스톱');
    return o; });
  console.log(JSON.stringify({ p0: o.p0, H: o.H, inv1: o.inv1 }).slice(0, 1500)); if (process.env.DBG) console.log(JSON.stringify({ vf: o.vfail, vfNeed: o.vfNeed, vfInv: o.vfInvPaused, vfBtn: o.vfBtnShip, login: o.login, ln: o.loginNeed, relog: o.relogBtn, d3: o.d3, d4: o.d4, post: o.post, pd: o.postDbg }));
  ok(o.p0.st === 'wait' && o.p0.k === 'p0' && (o.p0.lines || []).some((l) => /프린터 '롯데택배 시험' 오프라인/.test(l)) && !o.p0.btns.includes('force') && o.p0.hard.includes('printer'), "① 시작 전 점검: 프린터 오프라인을 먼저 알리고 멈춤 — '그래도 시작' 없음(사람이 고쳐야)");
  ok(/시작 전 점검 — 안 되는 것 1가지/.test(o.box1) && o.shl1, '① 원스톱 칸에 빨간 사람 몫 + 🛰 지금 실행 중 한 줄(shp_runs)');
  ok(o.waitPaper && /종이 확인/.test(o.alpsNeed.msg) && o.alpsNeed.soft && o.paperBtn, '② 종이 확인은 첫 출력 뒤 한 번 — 원스톱 칸 단추로 답함(기다림 = 멈춤 아님)');
  ok(o.H.bodies[0] && o.H.bodies[0].firstOne === false && o.H.bodies[0].rows.some((x) => /^현금-cash_a\|/.test(x)) && o.H.bodies[0].rows.some((x) => /^Y2611040001\|/.test(x)) && o.H.bodies[0].rows.filter((x) => /^A-0[12]\|/.test(x)).length === 2, '② 묶음 1 = 알라딘 2 + 현금 1 + 예스24 1 · 첫 출력 일괄(firstOne 끔) · 확인 창 없이 ' + JSON.stringify(o.H.bodies[0]));
  ok(o.def && o.def.ft === false && o.def.pt === false && o.def.way === 'csv' && o.defSet, '⑨ 기본: 첫 건 시험·종이 확인 끔 · 여러 건 길 csv · 설정 칸 둘 다 안 켜짐 ' + JSON.stringify(o.def));
  ok(o.defInv && o.defInv.rr === 'made' && o.defInv.limit === 0 && o.defInv.verify === false && o.defInv.way === 'csv' && /처음부터 📄 CSV 일괄등록/.test(o.defInv.log), '⑨ 기본 알라딘 맡김: limit 0 · verify 없음 · 처음부터 CSV ' + JSON.stringify(o.defInv));
  ok(o.H.bodies[0] && o.H.bodies[0].paperCheck === true, '② 종이 확인을 켠 설정이면 도우미에 paperCheck true를 넘김');
  ok(o.inv1.limit0 === 0 && o.inv1.verify && o.inv1.autoCont === true && o.inv1.from === 'oneshot' && o.inv1.n === 2 && o.inv1.st === 'done' && o.inv1.verified, '② 알라딘 송장: 1건 넣고 자동 검증 → 저절로 나머지 → 끝(사람 없이)');
  ok(o.cashA && o.cashA.no && o.y24 && o.y24.state === 'done' && o.y24.confirm === false && o.Y24C.length === 1, '② 현금 송장 기록 · 예스24 첫 건 발송처리(설정 켬 → [▶ 이대로 실행] 없이) 끝');
  ok(o.cashLine && o.d2.bt.length === 1 && o.sess1.pendLeft >= 1 && o.sess1.endLine && o.sess1.noP1 && !o.sess1.cashB0, '② 진행 중 저장한 현금 판매 → 한 줄 알림 → 이번 세션에 섞지 않고 끝(저절로 다음 묶음 없음 · 남은 주문 ' + o.sess1.pendLeft + '건) ' + JSON.stringify(o.sess1));
  ok(o.sess2.newId && o.sess2.done && o.sess2.bt.length === 1 && (o.sess2.bt[0].y24 || []).includes('cash:cash_b') && o.cashB && o.cashB.no && o.H.bodies[1] && o.H.bodies[1].rows.some((x) => /^현금-cash_b\|/.test(x)), '② ▶ 다시 누르면 새 세션에서 그 현금 판매를 보냄 ' + JSON.stringify(o.sess2));
  ok(o.cashWarn && /주소/.test(o.cashWarn.m) && o.cashWarn.btn === '주소 적기', "② 주소 없는 현금 판매 → ⚠ '주소 적기' 단추");
  ok(o.d2.st === 'done' && o.d2.bt[0].chk && o.d2.bt[0].chk.fresh && o.d2.bt[0].chk.left === 0 && o.d2.log.some((m) => /판매처 다시 읽어 확인 — 알라딘 2\/2건 넘어감/.test(m)) && o.d2.log.some((m) => /🏁 끝/.test(m)), '② 판매처를 다시 읽어 넘어갔는지 확인 → 끝 보고');
  ok(o.row.t === '🚚 출고 원스톱' && /^shp_runs\//.test(o.row.doc) && o.row.st === 'done' && o.row.pg && o.row.pg[0] === o.row.pg[1], '🛰 한 줄: 🚚 출고 원스톱 · 문서 shp_runs · 끝이면 진행바 가득');
  ok(o.noPii, '실행 문서(shp_runs)에 받는 분 이름 없음(주문번호·수만)');
  ok(o.dup === 'none', '⑥ 같은 주문·같은 송장은 다른 맡김 문서로 또 넣지 않음');
  ok(o.newId && o.vfail && !o.vfNeed.soft && o.vfNeed.btns.some((b) => b[0] === 'invcont') && o.vfInvPaused === 'paused' && o.vfBtnShip, '③ 첫 건 자동 검증 실패 → 멈추고 ⚠(사람 몫) · ③ 줄에도 「알라딘에서 확인했음 — 나머지 계속」');
  ok(o.login && o.loginNeed.btns.some((b) => b[0] === 'relogin') && !o.loginNeed.btns.some((b) => b[0] === 'invcont') && o.relogBtn && o.noContOnLogin, "④ 로그인 풀림 → '🔑 로그인했음 — 다시 맡기기'(「나머지 계속」 아님)");
  ok(o.done2 && o.d3.inv && o.d3.inv.done === 2, '③④ 사람이 누른 뒤 나머지를 끝까지 ' + JSON.stringify(o.d3));
  ok(o.re1 === true && o.re2 === false && o.reDoc.st === 'queued' && o.reDoc.n === 1 && o.reDoc.item === 'sent' && o.reDoc.claim == null, "⑤ 맥박 끊긴 맡김만 '기다림'으로 되돌림(넣은 줄 sent는 그대로 — 새 탭이 다시 읽어 확인부터)");
  ok(o.done3 && o.d4.log.length >= 1 && o.d4.reN === 1 && o.d4.inv && o.d4.inv.done === 1, '⑤ 진행 중 송장 입력 탭이 닫히면 원스톱이 알아채 다시 맡김 → 끝까지 ' + JSON.stringify(o.d4));
  ok(o.mid.same && o.mid.done && o.mid.owner, '⑦ 자정 넘기기: 어제 날짜로 열린 실행을 날짜가 아니라 id로 찾아 이어받음(새로 만들지 않음)');
  ok(o.post, '⑧ 끝난 ALPS 일을 웹앱이 못 본 채 닫혔어도 다시 열면 알라딘 송장 맡김까지 이어서');
  ok(o.guide, '출고 화면 설명서에 🚚 원스톱 장');
  console.log(bad ? `❌ tONESHOT 실패 ${bad}` : '✓ tONESHOT 통과'); });
