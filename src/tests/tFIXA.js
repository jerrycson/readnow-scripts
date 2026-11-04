// tFIXA — 정범님 11/04 밤 출고 화면 고침(일꾼 fixa)
//  ⓪ 수집기 2분 고리: 옛 판 송장 입력 맡김(맥박 beat 칸 없음)·만든 지 6시간 넘은 맡김은 되살리지 않고 '오래 멈춤'으로 닫는 표시만 · 새 판 맡김(beat 있음 · 6시간 안)은 되살림
//  ① 🛰 대기인데 맡은 곳 없는 일 = '⏳ 맡을 곳 기다림'(하는 중 수에 안 넣음) · 맡을 PC가 없으면 지킴이가 '다시 읽기'를 쌓지 않고 한 줄만
//  ② 송장 입력 문서 여러 개가 🛰에 각각 · 단계 칸도 모든 문서로(입력됨이 하나라도 있으면 입력됨)
//  ③ 원스톱 끝 = 이번에 묶은 주문만으로 · 아직 발송 요청 안 한 주문은 '🆕 다음에 할 것' 따로 · 실행마다 번호·시각·주문 수
//  ④ 한 주문의 일부 상품만 넘어가고 남은 상품은 🆕(⚠ 아님) · 맡김에 든 상품이 남으면 ⚠ · 맡길 때 상품 줄(lids)을 적음
//  시험 자료 손님은 '손님A' — 실제 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const pick = (...L) => L.find((p) => fs.existsSync(p));

/* ⓪ 수집기 — 2분 고리를 소스에서 그대로 떼어 가짜 Firestore로 돌림 */
async function collectorPart() {
  const SRC = pick(process.env.RN_REPO && path.join(process.env.RN_REPO, 'src/readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
  const a = src.indexOf('    const INVST = { at: 0, v: 10, h: 6 };'); const b = src.indexOf('}, 2 * 60e3); }', a); if (a < 0 || b < 0) { ok(false, '수집기에서 되살리기 고리를 못 찾음'); return; }
  const LOOP = src.slice(a, b + '}, 2 * 60e3);'.length); const f0 = src.indexOf('  function invOldNoRevive('); const f1 = src.indexOf('  async function claimInvoice(', f0); const FN = src.slice(f0, f1);
  const store = {}; const ago = (m) => new Date(Date.now() - m * 60e3).toISOString(); const logs = []; const claimed = [];
  const au = (...x) => ({ __au: x }); const apply = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) o[k] = x && x.__au ? [...(o[k] || []), ...x.__au] : x; return o; };
  const ref = (col, id) => ({ id, get: async () => ({ id, exists: !!store[col + '/' + id], data: () => store[col + '/' + id] && JSON.parse(JSON.stringify(store[col + '/' + id])) }), update: async (v) => { store[col + '/' + id] = apply(store[col + '/' + id], v); }, set: async (v) => { store[col + '/' + id] = apply(store[col + '/' + id], v); } });
  const C = (col) => ({ doc: (id) => ref(col, id), where: (f, op, v) => ({ get: async () => { const docs = Object.keys(store).filter((k) => k.startsWith(col + '/') && store[k][f] === v).map((k) => { const id = k.split('/')[1]; return { id, ref: ref(col, id), data: () => JSON.parse(JSON.stringify(store[k])) }; }); return { size: docs.length, docs, forEach: (fn) => docs.forEach(fn) }; } }) });
  const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), update: (r, v) => r.update(v), set: (r, v) => r.set(v) }) };
  const firebase = { firestore: { FieldValue: { arrayUnion: au } } };
  const items = [{ orderNo: 'O1', invoice: '111100001111', recipient: '손님A', state: 'done' }, { orderNo: 'O2', invoice: '111100002222', recipient: '손님A', state: 'todo' }];
  store['shp_invoices/OLD'] = { createdAt: ago(300), status: 'running', claim: { pc: 'MJ-MAIN', at: ago(299) }, items, stepNow: { at: ago(298), m: '송장 칸에 넣음' } }; /* 원스톱 판 전 — beat 칸 없음 */
  store['shp_invoices/OLD2'] = { createdAt: ago(8 * 60), status: 'running', claim: { pc: 'HOME', at: ago(8 * 60) }, beat: ago(7 * 60), items }; /* beat는 있지만 만든 지 8시간 */
  store['shp_invoices/NEW'] = { createdAt: ago(60), status: 'running', claim: { pc: 'HOME', at: ago(50) }, beat: ago(20), items }; /* 새 판 · 소식 20분 없음 → 되살림 */
  store['shp_invoices/LIVE'] = { createdAt: ago(5), status: 'running', claim: { pc: 'HOME', at: ago(5) }, beat: ago(1), items }; /* 아직 살아 있음 → 그대로 */
  let tick = null; const setInterval = (fn) => { tick = fn; }; const GM_getValue = () => null; const GM_deleteValue = () => {};
  const env = { C, db, firebase, setInterval, GM_getValue, GM_deleteValue, PUBONLY: false, auth: { currentUser: { email: 't' } }, window: {}, nowIso: () => new Date().toISOString(), TS: () => 'ts', PC_NAME: 'PC-T', log: (m) => logs.push(m), claimInvoice: async (id) => claimed.push(id) };
  new Function(...Object.keys(env), FN + '\n' + LOOP)(...Object.values(env)); await tick();
  const g = (id) => store['shp_invoices/' + id];
  ok(g('OLD').status === 'stale' && /옛 판 맡김 — 되살리지 않음/.test(g('OLD').staleWhy) && g('OLD').prevStatus === 'running' && /오래 멈춤/.test(g('OLD').stepNow.m), "옛 판 맡김(beat 없음)은 되살리지 않고 '오래 멈춤(옛 판 맡김 — 되살리지 않음)'으로 닫음: " + JSON.stringify({ st: g('OLD').status, why: g('OLD').staleWhy }));
  ok(g('OLD').items.length === 2 && g('OLD').items[0].state === 'done' && (g('OLD').log || []).length === 1, '닫을 때 넣은 줄·문서는 지우지 않고 기록 한 줄만 더함');
  ok(g('OLD2').status === 'stale' && /6시간/.test(g('OLD2').staleWhy), '만든 지 6시간 넘은 맡김도 되살리지 않음(설정 oneShot.invReviveH 기본 6)');
  ok(g('NEW').status === 'queued' && g('NEW').reclaimN === 1 && !g('NEW').claim, '새 판 맡김(beat 있음 · 6시간 안)은 소식이 끊기면 다시 맡기기로 되돌림');
  ok(g('LIVE').status === 'running', '맡은 탭이 살아 있는 맡김은 그대로');
  ok(!claimed.includes('OLD') && !claimed.includes('OLD2'), '옛 맡김은 다시 맡지 않음: 맡은 것 ' + JSON.stringify(claimed));
  ok(/@match/.test(src.slice(0, 3000)) && src.indexOf('==/UserScript==') < a, '고친 곳은 머리(==UserScript==) 밖 본문');
}

(async () => { await collectorPart();
  require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async () => { const o = {}; const w = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); const ago = (m) => new Date(Date.now() - m * 60e3).toISOString(); await w(2500);
      /* ① 대기 · 맡은 곳 없음 */
      await db.collection('shp_cmds').doc('rq1').set({ type: 'read', orderNos: [], status: 'queued', auto: 'stale', createdAt: ago(3), stepNow: { at: ago(3), lv: 'info', m: '클라우드·PC가 받기를 기다림' } });
      await db.collection('shp_cmds').doc('rq2').set({ type: 'read', orderNos: [], status: 'running', createdAt: ago(2), claim: { pc: 'HOME', at: ago(2) }, stepNow: { at: ago(1), lv: 'info', m: '읽는 중' } });
      await db.collection('shp_cmds').doc('rqOld').set({ type: 'read', orderNos: [], status: 'queued', auto: 'stale', createdAt: ago(45), stepNow: { at: ago(45), lv: 'info', m: '받기를 기다림' } });
      /* ② 송장 입력 문서 3개 */
      await db.collection('shp_invoices').doc('ivA').set({ createdAt: ago(300), status: 'done', doneAt: ago(5), items: [{ orderNo: 'O1', invoice: '1', recipient: '손님A', state: 'done' }] });
      await db.collection('shp_invoices').doc('ivB').set({ createdAt: ago(200), status: 'running', claim: { pc: 'MJ-MAIN', at: ago(10) }, beat: ago(1), items: [{ orderNo: 'O1', invoice: '1', state: 'todo' }, { orderNo: 'O3', invoice: '3', state: 'sent' }], stepNow: { at: ago(1), lv: 'info', m: '송장 칸에 넣음' } });
      await db.collection('shp_invoices').doc('ivC').set({ createdAt: ago(100), status: 'queued', items: [{ orderNo: 'O2', invoice: '2', state: 'todo' }], stepNow: { at: ago(2), lv: 'info', m: '수집기 PC가 받기를 기다림' } });
      const it = (id, lid) => ({ listingId: lid || 'L' + id, title: '책 ' + id, price: 5000, qty: 1 });
      S.ship = { orders: ['O1', 'O2', 'O3', 'O4'].map((n) => ({ orderNo: n, orderedAt: '2026-11-04 09:00', buyer: '손님A', items: [it(n)] })), tabCounts: {}, at: now() };
      await db.collection('shp_state').doc('confirm').set({ orders: [{ orderNo: 'C1', buyer: '손님A', items: [it('C1')] }], at: now(), enrich: {} }); S.shipC = { orders: [{ orderNo: 'C1', buyer: '손님A', items: [it('C1')] }], at: now(), enrich: {} }; S.shipCFromCache = false; S._shipLive = 1; S.shipTab = 'all';
      await openShip(); await w(1500);
      const rows = shipLiveRows(); const rw = (id) => rows.find((x) => x.id === id) || {};
      o.rq1 = { st: rw('cmd:rq1').st, act: rw('cmd:rq1').act }; o.rq2 = { st: rw('cmd:rq2').st, act: rw('cmd:rq2').act }; o.rqOld = { st: rw('cmd:rqOld').st, bad: rw('cmd:rqOld').bad };
      o.ivRows = rows.filter((x) => x.id.startsWith('inv:')).map((x) => x.id + '/' + x.st + '/' + (x.act ? 1 : 0)).sort();
      const box = document.getElementById('shl_box'); o.boxTxt = box ? box.innerText : ''; o.nA = rows.filter((x) => x.act).length;
      o.rq1Txt = (document.querySelector('[data-shl="cmd:rq1"]') || {}).innerText || '';
      S.ship = { orders: ['O1', 'O2', 'O3', 'O4'].map((n) => ({ orderNo: n, orderedAt: '2026-11-04 09:00', buyer: '손님A', items: [it(n)] })), tabCounts: {}, at: now() }; /* 실시간 듣기가 시험 자료를 덮었을 수 있어 다시 */
      S._shipRowsC = null; o.stages = Object.fromEntries(shipRowsAl().filter((r) => r.src === 'al').map((r) => [r.id, r.stage]));
      /* ① 지킴이 — 맡을 PC 없음 */
      window.__rnBeats = { pcs: { HOME: { atMs: Date.now() - 200 * 60e3, at: ago(200) }, LOGGER: { atMs: Date.now(), pubOnly: true } } }; S._rpbAt = Date.now();
      await db.collection('app_settings').doc('cloud').set({ at: now(), ok: false, err: '주문확인요청: 알라딘 로그인 쉼 — cloud 주소 막힘(42FB)', lastConfirmAt: ago(200) });
      await db.collection('shp_state').doc('confirm').set({ orders: [{ orderNo: 'C1', buyer: '손님A', items: [it('C1')] }], at: ago(200), enrich: {} }); await w(300);
      S.shipC = { orders: [{ orderNo: 'C1', buyer: '손님A', items: [it('C1')] }], at: ago(200), enrich: {} }; S.shipFast = null; S.ship.at = ago(200); S._staleAskAt = 0;
      const nRead = () => Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'read' && c.auto === 'stale').length; o.read0 = nRead(); o.pk0 = shipPicker();
      await w(16500); o.read1 = nRead(); o.staleTxt = shipStaleHtml(); o.noPick = S._staleNoPick;
      S._shipLiveT = 0; shipLivePaint(); o.livePickTxt = (document.getElementById('shl_nopick') || {}).innerText || '';
      /* 맡을 PC가 살아 있으면 쌓음(앞 대기 맡김은 '취소'로 바꿔 둠) */
      for (const id of ['rq1', 'rqOld']) await db.collection('shp_cmds').doc(id).set({ status: 'cancelled' }, { merge: true });
      window.__rnBeats = { pcs: { HOME: { atMs: Date.now(), at: now() } } }; S._rpbAt = Date.now(); S._staleAskAt = 0; await w(16500); o.read2 = nRead(); o.pk1 = shipPicker();
      /* ③ 원스톱 끝 — 오늘 실행 2개(#1 끝 · #2 끝) · 이번 묶음 = O1·O3 */
      const day = osDay(); await db.collection('shp_invoices').doc('ivB').set({ status: 'done', items: [{ orderNo: 'O1', invoice: '1', state: 'done' }, { orderNo: 'O3', invoice: '3', state: 'done' }] }, { merge: true });
      await db.collection('shp_runs').doc(day + '_1').set({ id: day + '_1', day, n: 1, status: 'done', createdAt: ago(240), doneAt: ago(230), bt: [{ n: 1, al: ['O9'], y24: [] }] });
      await db.collection('shp_runs').doc(day + '_2').set({ id: day + '_2', day, n: 2, status: 'done', createdAt: ago(60), doneAt: ago(40), bt: [{ n: 1, al: ['O1'], y24: [] }, { n: 2, al: ['O3'], y24: [] }] });
      S.ship.orders = S.ship.orders.filter((x) => x.orderNo !== 'O1'); S.shipC = { orders: [{ orderNo: 'C1', buyer: '손님A', items: [it('C1')] }], at: now(), enrich: {} };
      await w(500); S._shipRowsC = null; await openShip(); await w(1200); const one = document.getElementById('shp_one'); o.flow = one ? (one.querySelector('.shp-flow') || {}).innerText || '' : ''; o.flowH = one ? one.querySelector('.shp-flow').innerHTML : '';
      /* ④ 일부 상품만 남은 주문 */
      const old = ago(10); S.shipStart = [
        { id: 'sdP1', type: 'startDelivery', orderNos: ['P1'], status: 'done', createdAt: ago(12), doneAt: old, lids: { P1: ['LP1a'] }, results: { P1: { state: 'done', at: old } } },
        { id: 'sdP2', type: 'startDelivery', orderNos: ['P2'], status: 'done', createdAt: ago(12), doneAt: old, lids: { P2: ['LP2a'] }, results: { P2: { state: 'done', at: old } } },
        { id: 'sdP3', type: 'startDelivery', orderNos: ['P3'], status: 'done', createdAt: ago(12), doneAt: old, results: { P3: { state: 'done', at: old } } }];
      S.shipC = { orders: [{ orderNo: 'P1', buyer: '손님A', items: [it('P1b', 'LP1b')] }, { orderNo: 'P2', buyer: '손님A', items: [it('P2a', 'LP2a'), it('P2b', 'LP2b')] }, { orderNo: 'P3', buyer: '손님A', items: [it('P3b', 'LP3b')] }], at: now(), enrich: {} };
      o.cs = { P1: cmdStateOf('P1'), P2: cmdStateOf('P2'), P3: cmdStateOf('P3') }; S._shipRowsC = null; o.exc = Object.fromEntries(shipRowsAl().filter((r) => /^P/.test(r.id)).map((r) => [r.id, r.stage + (r.exc ? '!' + r.exc.k : '')]));
      S.shipC = { orders: [{ orderNo: 'P9', buyer: '손님A', items: [it('P9a', 'LP9a'), it('P9b', 'LP9b')] }], at: now(), enrich: {} }; await shipCmd('startDelivery', ['P9']); await w(300);
      o.lids = (Object.values(window.__FS.shp_cmds || {}).find((c) => c.type === 'startDelivery' && (c.orderNos || []).includes('P9')) || {}).lids || null;
      return o; });
    console.log(JSON.stringify(R).slice(0, 2500));
    ok(R.rq1.st === 'waitpick' && !R.rq1.act && /맡을 곳 기다림/.test(R.rq1Txt) && !/하는 중/.test(R.rq1Txt.split('\n').slice(0, 3).join(' ')), "대기인데 맡은 곳 없는 '다시 읽기'는 '⏳ 맡을 곳 기다림'(하는 중 아님): " + JSON.stringify(R.rq1));
    ok(R.rq2.st === 'running' && R.rq2.act, '맡아서 하는 중(running · claim.pc)만 하는 중');
    ok(R.rqOld.st === 'stale' && R.rqOld.bad, "맡을 곳 기다림이 오래되면 '오래 멈춤'");
    ok(R.ivRows.join(',') === 'inv:ivA/done/0,inv:ivB/running/1,inv:ivC/waitpick/0', '송장 입력 문서 3개가 🛰에 각각 한 줄(대기 문서는 맡을 곳 기다림): ' + R.ivRows.join(','));
    ok(/🛰 지금 실행 중\n\s*2건/.test(R.boxTxt) || R.nA === 2, `'하는 중' 수에는 실제 하는 중만(송장 ivB · 다시 읽기 rq2 = 2): ${R.nA}`);
    ok(R.stages.O1 === 'done' && R.stages.O2 === 'sending' && R.stages.O3 === 'sending' && R.stages.O4 === 'deliv', "단계 칸이 모든 문서를 봄 — O1은 앞 문서 '입력됨'이 이김 · O3(입력 중)·O2(다른 문서에 맡김 대기) 보내는 중 · O4 출고 준비: " + JSON.stringify(R.stages));
    ok(R.pk0 && !R.pk0.ok && R.read1 === R.read0, `맡을 PC가 없으면(HOME 200분 전 · 로거 빼고 · 클라우드 로그인 쉼) 지킴이가 '다시 읽기'를 쌓지 않음: ${R.read0}→${R.read1}`);
    ok(/맡을 PC 없음 — PC 수집기를 켜 주세요\(마지막 신호: HOME/.test(R.staleTxt) && /새 다시 읽기는 쌓지 않습니다/.test(R.staleTxt), '빨간 카드에 한 줄: 맡을 PC 없음 — PC 수집기를 켜 주세요(마지막 신호: PC 이름 시각)');
    ok(/맡을 PC 없음/.test(R.livePickTxt), '🛰 칸에도 맡을 곳 기다림 위에 한 줄: ' + R.livePickTxt);
    ok(R.pk1 && R.pk1.ok && R.read2 === R.read1 + 1, `맡을 PC가 살아 있으면 다시 읽기를 맡김: ${R.read1}→${R.read2}`);
    ok(/✅ 이번 출고 끝\(묶음 2개 · 주문 2건\)/.test(R.flow), "원스톱 끝 = 이번에 묶은 주문만으로 '✅ 이번 출고 끝(묶음 n개 · 주문 n건)': " + R.flow.replace(/\n/g, ' | '));
    ok(/🆕 다음에 할 것 \d+건/.test(R.flow) && /확인 1 — 아직 발송 요청 안 함/.test(R.flow) && !/지금: 확인/.test(R.flow), "아직 발송 요청 안 한 주문은 '🆕 다음에 할 것'으로 따로(끝나지 않은 일로 보이지 않음)");
    ok(/#1 .*묶음 1개 · 주문 1건/.test(R.flow) && /#2 .*묶음 2개 · 주문 2건/.test(R.flow) && /묶음1 1건 · 묶음2 1건/.test(R.flow), '실행마다 번호·시각·묶음·주문 수로 구별');
    ok(R.cs.P1 === null && R.exc.P1 === 'confirm', "맡김에 든 상품은 넘어가고 다른 상품만 남은 주문 → 🆕(⚠ 아님): " + JSON.stringify(R.cs));
    ok(R.cs.P2 === 'doneLeft' && R.exc.P2 === 'confirm!cmd', '맡김에 든 상품이 아직 남아 있으면 ⚠ 그대로');
    ok(R.cs.P3 === 'doneLeft' && R.exc.P3 === 'confirm!cmd', '맡김에 상품 줄이 없으면(옛 맡김) 지금처럼 주문번호로 판단');
    ok(R.lids && JSON.stringify(R.lids.P9) === JSON.stringify(['LP9a', 'LP9b']), '발송준비시작을 맡길 때 상품 줄(lids)을 함께 적음: ' + JSON.stringify(R.lids));
    console.log(bad ? `❌ tFIXA 실패 ${bad}` : '✓ tFIXA 통과'); });
})();
