// tOSRESUME — 정범님 11/05 '오늘 출고 끝까지를 진행하다 송장 출력 바로 전에 업데이트하는 바람에 화면을 나갔다가 다시 돌아왔어 … 끊겨도 아무 문제없이 어느 시점이든 계속 연이어 진행할 안전장치'
//  ① 모든 단계 경계(P0→P1→ALPS→MATCH→INV→Y24→CHECK→NEXT→END)에서 끊김 — 같은 탭 새로 고침(탭 이름 같음 → 바로 이어서)과 다른 기기 이어받기(주인 맥박 끊김·나감 표시)를 번갈아
//     → 끝까지 감 · ALPS 접수(도우미 /alps/run) 한 번 · 송장 입력 맡김 한 문서 · 같은 송장 두 번 넣지 않음 · 예스24 발송처리 한 번
//  ② ALPS에 맡기는 그 순간 끊김(도우미는 받았는데 웹앱이 기록 전에 꺼짐) → 다시 열면 도우미의 그 일을 이어받음(다시 접수·인쇄 안 함)
//  ③ 기기가 잠들었다 깸 — 그사이 다른 기기가 이어받았으면 깬 기기는 손 떼기(같은 단계를 둘이 하지 않음)
//  ④ (11/05 14:23 실제 일) 송장 입력 맡김이 첫 건 검증 실패로 멈춘 채 이미 있으면 '넣을 송장 없음'으로 넘기지 않고 사람 몫 「알라딘에서 확인했음 — 나머지 계속」 → 다시 돌아 끝나면 다음 단계로 · 끝내기 전에도 멈춘 맡김이면 끝내지 않음
//  시험 자료 손님은 '손님A…' · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
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
  await p.exposeFunction('__H', (k, v) => { if (k === 'printerBad') H.printerBad = v; if (k === 'hist') H.hist = v; if (k === 'run') H.run = v; return JSON.parse(JSON.stringify({ n: H.n, bodies: H.bodies.map((b) => ({ fileName: b.fileName, firstOne: b.firstOne, rows: b.rows.map((x) => x.ono + '|' + x.name) })), inputs: H.inputs })); });
  const o = await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; window.confirm = () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; S.app = S.app || {};
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
    const W2 = (ms) => new Promise((r) => setTimeout(r, ms));
    /* 끊김 흉내 — kind 'reload' = 같은 탭 새로 고침(드라이브만 꺼지고 탭 이름 그대로 → osReopen) · 'other' = 다른 기기(주인 맥박을 오래전으로 + 다른 탭 이름 → osResumeCheck가 이어받음) */
    const cut = async (kind) => { osStopDrive(); S.os.busy = 0; S._osReo = null; await W2(100);
      if (kind === 'other') { await db.collection('shp_runs').doc(S.os.id).set({ owner: { tab: 'os_deadtab', dev: 'OTHER', beat: new Date(Date.now() - 5 * 60e3).toISOString(), leftAt: null } }, { merge: true }); await W2(150); await osResumeCheck(); }
      else { osReopen(S.os.doc); } };
    const PH = ['P1', 'ALPS', 'MATCH', 'INV', 'Y24', 'CHECK', 'NEXT', 'END']; const seen = []; let k = 0;
    const id1 = await window.shipOneShot();
    const t0 = Date.now(); let lastPh = 'P0';
    while (Date.now() - t0 < 150000) { const r = runDoc(); if (r.status === 'done') break; if (r.need && r.need.k === 'alps' && r.status === 'wait' && S.alps.ansFor !== ((S.alps.st || {}).id + ':' + r.need.nid)) { try { await osAct('alps:바르게 나왔음'); } catch (e) {} }
      if (r.ph && r.ph !== lastPh) { lastPh = r.ph; if (PH.includes(r.ph) && !seen.includes(r.ph)) { seen.push(r.ph); const kind = (k++ % 2) ? 'other' : 'reload'; await cut(kind); seen.push(kind); } }
      await W2(250); }
    const d1 = runDoc(); o.r1 = { st: d1.status, seen, sum: d1.sum, owner: (d1.owner || {}).tab === OS_TAB, take: (d1.log || []).filter((x) => /이어받음|다시 열려/.test(x.m)).length };
    o.H1 = await __H(); o.inv1 = Object.keys(FS.shp_invoices || {}); o.seen1 = FC.seen.slice(); o.Y24C1 = Y24C.slice();
    /* ② ALPS에 맡기는 그 순간 끊김 — 새 주문으로 새 실행 · 도우미가 받은 뒤 웹앱 기록 전에 '꺼짐' */
    await setShip([ord('A-05', '손님C', [{ listingId: '95', title: '초록 책', price: 5000, qty: 1, sku: 'GRNAAA' }])], [row('A-05', 'GRNAAA', '초록 책', '손님C')]);
    const af0 = alpsFetch; let trapped = 0; window.alpsFetch = alpsFetch = async (u, b) => { const x = await af0(u, b); if (u === '/alps/run' && !trapped) { trapped = 1; osStopDrive(); await new Promise(() => {}); } return x; };
    const nBefore = (await __H()).n; const id2 = await window.shipOneShot(); o.id2new = id2 !== id1; await until(() => trapped === 1, 40000); await W2(300);
    o.pend = !!(runDoc().p1pend && runDoc().p1pend.file); window.alpsFetch = alpsFetch = af0; S.os.busy = 0; S._osReo = null; osReopen(S.os.doc);
    o.adopt = await until(() => (runDoc().bt || []).length === 1 && runDoc().ph !== 'P1', 30000); o.adoptLine = (runDoc().log || []).some((x) => /맡기는 순간 끊겼음/.test(x.m)); o.nAfter = (await __H()).n - nBefore; o.bt2 = (runDoc().bt || [])[0] || {};
    /* ③ 잠들었다 깸 — 그사이 다른 기기가 이어받음 → 깬 기기는 손 뗌 */
    await db.collection('shp_runs').doc(S.os.id).set({ owner: { tab: 'os_othertab', dev: 'OTHER', beat: new Date().toISOString() } }, { merge: true }); S.os.doc = { ...S.os.doc, owner: { tab: OS_TAB } }; S.os.beatOkAt = Date.now() - 120e3; S.os.drive = true; S.os.busy = 0; const phB = S.os.doc.ph; await osTick(); o.sleep = { drive: S.os.drive, owner: ((runDoc().owner || {}).tab) };
    /* 다시 이 기기가 맡아 끝냄(다른 기기가 꺼졌다 치고) */
    await db.collection('shp_runs').doc(S.os.id).set({ owner: { tab: 'os_othertab', dev: 'OTHER', beat: new Date(Date.now() - 5 * 60e3).toISOString() } }, { merge: true }); await W2(150); await osResumeCheck();
    o.done2 = await until(async () => { const r = runDoc(); if (r.need && r.need.k === 'alps' && r.status === 'wait' && S.alps.ansFor !== ((S.alps.st || {}).id + ':' + r.need.nid)) await osAct('alps:바르게 나왔음'); return r.status === 'done'; }, 90000);
    /* ④ 첫 건 검증 실패로 멈춘 맡김이 이미 있음(다른 길이 먼저 만듦) */
    await setShip([ord('A-06', '손님D', [{ listingId: '96', title: '노랑 책', price: 5000, qty: 1, sku: 'YLWAAA' }])], [row('A-06', 'YLWAAA', '노랑 책', '손님D')]);
    const mkPre = () => db.collection('shp_invoices').doc('inv_pre').set({ createdAt: now(), by: 'tester@x', from: 'alps-auto', auto: true, runId: 'other', limit: 1, verify: true, status: 'paused', pausedAt: now(), verifyFail: true, verified: { at: now(), ok: false, orderNo: 'A-06', invoice: '240000000777', why: '주문은 있으나 송장번호가 다름' }, pauseWhy: '첫 건 자동 검증 실패', items: [{ orderNo: 'A-06', invoice: '240000000777', state: 'todo' }] });
    let preMade = false;
    const id3 = await window.shipOneShot();
    o.v4 = await until(async () => { const r = runDoc(); if (r.need && r.need.k === 'alps' && r.status === 'wait' && S.alps.ansFor !== ((S.alps.st || {}).id + ':' + r.need.nid)) { if (!preMade) { preMade = true; await mkPre(); await W2(200); } /* 묶음이 정해진 뒤(ALPS 인쇄 중) 다른 길이 이 주문 송장 입력 맡김을 먼저 만들고 첫 건 검증 실패로 멈춤 — 11/05 14:23과 같은 모양 */ await osAct('alps:바르게 나왔음'); } return r.status === 'wait' && r.need && /자동 검증 실패/.test(r.need.msg || ''); }, 90000);
    o.log4 = (runDoc().log || []).map((x) => x.m).slice(-14); o.bt4 = runDoc().bt; o.v4need = runDoc().need; o.v4btn = ((runDoc().need || {}).btns || []).map((x) => x[0]); o.v4st = runDoc().status; o.v4ph = runDoc().ph;
    /* 그 맡김을 지운 것처럼 바로 END로 보내 보기 — 끝내기 전 확인이 INV로 되돌림 */
    const bt4 = (runDoc().bt || [])[0] || {}; await db.collection('shp_runs').doc(S.os.id).set({ ph: 'END', status: 'run', need: null }, { merge: true }); await W2(200); S.os.busy = 0; await osTick(); await W2(300); o.endGuard = { ph: runDoc().ph, st: runDoc().status, line: (runDoc().log || []).some((x) => /끝내기 전 확인/.test(x.m)) };
    await until(() => runDoc().need && /자동 검증 실패/.test(runDoc().need.msg || ''), 20000); await osAct('invcont'); o.done4 = await until(() => runDoc().status === 'done', 60000); o.inv4 = ((runDoc().bt || [])[0] || {}).inv || null; o.inv4doc = (FS.shp_invoices || {})[bt4.invDoc] || {};
    return o; });
  if (process.env.V) console.log(JSON.stringify(o, null, 1).slice(0, 5000));
  const dup = (L) => L.length !== new Set(L).size;
  ok(o.r1.st === 'done' && ['P1', 'ALPS', 'MATCH', 'INV', 'Y24', 'CHECK', 'NEXT', 'END'].every((p) => o.r1.seen.includes(p)), '① 모든 단계 경계에서 끊어도 끝까지 감 · 끊은 곳 ' + o.r1.seen.join(' '));
  ok(o.r1.take >= 4, '① 새로 고침(같은 탭)·다른 기기 이어받기 줄이 남음 ' + o.r1.take);
  ok(o.H1.n === 1, '① ALPS 접수(도우미 /alps/run) 한 번 — 되풀이 0 · ' + o.H1.n);
  ok(o.inv1.length === 1 && !dup(o.seen1), '① 송장 입력 맡김 한 문서 · 같은 송장 두 번 안 넣음 ' + JSON.stringify(o.seen1));
  ok(o.Y24C1.length === 1, '① 예스24 발송처리 한 번 ' + JSON.stringify(o.Y24C1));
  ok(o.id2new && o.pend && o.adopt && o.adoptLine && o.nAfter === 1 && (o.bt2.al || []).includes('A-05'), '② ALPS에 맡기는 순간 끊김 → 다시 열면 도우미의 그 일을 이어받음(새 접수 1번뿐 · 묶음 주문 그대로) ' + JSON.stringify({ n: o.nAfter, al: o.bt2.al }));
  ok(o.sleep.drive === false && o.sleep.owner === 'os_othertab', '③ 잠들었다 깸 — 그사이 다른 기기가 맡았으면 손 뗌 ' + JSON.stringify(o.sleep));
  ok(o.done2, '③ 다른 기기가 꺼지면 다시 이어받아 끝까지');
  ok(o.v4 && o.v4st === 'wait' && o.v4ph === 'INV' && o.v4btn.includes('invcont'), '④ 송장 입력이 첫 건 검증 실패로 멈춤 → 끝내지 않고 사람 몫 「나머지 계속」 ' + JSON.stringify(o.v4btn));
  ok(o.endGuard.ph === 'INV' && o.endGuard.line, '④ 끝내기 전 확인 — 멈춘 맡김이면 END에서 INV로 되돌림 ' + JSON.stringify(o.endGuard));
  ok(o.done4 && o.inv4 && o.inv4.done >= 1 && o.inv4doc.status === 'done', '④ 「나머지 계속」 → 맡김이 다시 돌아 끝나면 원스톱도 이어서 끝 ' + JSON.stringify(o.inv4));
  console.log(bad ? `❌ tOSRESUME 실패 ${bad}` : '✓ tOSRESUME 통과'); });
