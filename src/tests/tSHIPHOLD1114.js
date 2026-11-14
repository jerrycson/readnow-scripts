// tSHIPHOLD1114 — 출고 엔진이 문제마다 진짜 까닭을 스스로 가르고 스스로 풂 (정범님 11/14 19:33 「매우 심각한 오류」 · 19:35 「AI가 오늘 것만 손대지 말고 엔진이 매번 스스로」)
//  그대로 재현: 묶음 13건(13상자) · 그중 1건은 ALPS 경고창(지역 지연·발송 불가)으로 보류 → 12건 인쇄 · 도는 동안 새 주문 2건(묶음 밖 · 한 건은 묶음 손님과 같은 받는 분)
//  ① 엔진: 묶음 고정 13 · 맞춤 = 12 맞음 + 🧭 보류 1(까닭·지역) · 송장 입력 맡김 12건(묶음 13 · 빠짐은 보류 1뿐) · 새 주문 2건은 어디에도 안 낌
//  ② 화면: ⚠ 사람이 볼 것에 셋 다 없음(보류는 엔진 몫 · 새 주문은 다음 묶음) · 출고 준비 3 = 보류 1 + 새 주문 2(흐름 줄에 따로) · ③ 송장 입력 줄 = '오늘' · 어제 맡김은 '지난 출고 — 오늘 것 아님'
//  ③ 옛 맡김(묶음 목록 없음)도 실행 기록의 묶음 시작 시각으로 묶음 밖 주문을 가림
//  ④ 풀기: 도우미가 보류 상자를 다시 출력(풀림) → 엔진이 그 결과로 보류 주문만 맞춰 송장 입력을 저절로 맡김 → 끝 · 보류 장부 끝
//  ⑤ 진짜 사람 몫만: 다음 묶음(새 주문 2)에서 송장이 아예 안 나온 주문 1건 → 엔진이 한 번 더 받아 맞춘 뒤에도 없으면 그 한 건만 ⚠ 사람이 볼 것(맞춤 표)
//  시험 자료 손님은 '손님01…' · 공개 저장소 · 실행: test-gate(--only tSHIPHOLD1114) 또는 RN_PORT=<포트> node tSHIPHOLD1114.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const XL = path.join(__dirname, 'xlsx.full.min.js');
require('./harness.js')(async (p) => {
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\//, (r) => r.fulfill({ body: fs.readFileSync(XL), contentType: 'application/javascript' }));
  const kst = () => new Date(Date.now() + 9 * 3600e3).toISOString();
  const H = { n: 0, run: null, last: null, bodies: [], results: {}, hist: [], hold: [], drop: [], holds: [] };
  const step = (st) => ['login', 'check', 'upload', 'print', 'verify', 'send'].map((k, i) => ({ k, l: k, st: i < st ? 'ok' : i === st ? 'run' : 'todo', pct: 50, d: '' }));
  const mkRes = (id, rows) => { const box = {}; let k = 0; H.results[id] = [['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ...rows.map((x, i) => { if (!box[x.name]) box[x.name] = String(240000001000 + H.n * 100 + (++k)); return [box[x.name], x.name, x.title, x.sku, 'M' + id + i, '출력', '', '']; })]; };
  const tick = () => { const R = H.run; if (!R || R.status !== 'run') return; R.polls = (R.polls || 0) + 1; if (R.polls < 3) return; const rows = H.last.rows.filter((x) => !H.hold.includes(x.ono) && !H.drop.includes(x.ono)); mkRes(R.id, rows);
    if (H.hold.length) H.holds = [{ id: 'hr' + H.n, day: kst().slice(0, 10).replace(/-/g, ''), boxes: H.hold.length, rows: H.hold.length, released: 0, kinds: ['dialog'], why: ['ALPS 경고창 — 수령인 손님 · 발송 불가(지역 지연)'], areas: ['어느 도 어느 군'], at: kst(), checkedAt: null }];
    Object.assign(R, { status: 'done', done: true, hasResult: true, holds: H.holds, steps: step(6), summary: { rows: H.last.rows.length, boxes: H.last.rows.length, printed: rows.length, waybills: rows.length, upload: { ok: H.last.rows.length } } }); H.hist.unshift({ id: R.id, status: 'done', file: R.fileName, at: R.at }); };
  await p.route(/^http:\/\/127\.0\.0\.1:8898\//, async (r) => { const u = new URL(r.request().url()); const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(o) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (u.pathname === '/alps/status') { tick(); return J({ ok: true, ver: '0.5.8', pc: 'MJ-MAIN', cfg: { printer: '롯데택배 시험' }, cred: { saved: true }, run: H.run ? { ...H.run, holds: H.holds } : null, key: { fp: 'f', pub: 'P' }, remote: { on: false } }); }
    if (u.pathname === '/alps/pcheck') return J({ ok: true, state: '상태 3' }); if (u.pathname === '/alps/hist') return J({ ok: true, hist: H.hist });
    if (u.pathname === '/alps/run') { const b = JSON.parse(r.request().postData()); H.last = b; H.bodies.push(b.rows.map((x) => x.ono)); H.n++; H.run = { id: 'r' + H.n, at: kst(), fileName: b.fileName, status: 'run', steps: step(1), summary: {}, log: [] }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/result') { const id = u.searchParams.get('id'); return H.results[id] ? J({ ok: true, aoa: H.results[id] }) : J({ ok: false }); }
    return J({ ok: true }); });
  p.on('dialog', (d) => d.accept());
  await p.exposeFunction('__H', (k, v) => { if (k === 'hold') H.hold = v; if (k === 'drop') H.drop = v; if (k === 'release') { /* 도우미가 보류 상자를 다시 출력(풀림) — 보류 상자만 다시(holdOnly) 일 */ const rows = (H.last0 || H.last).rows.filter((x) => v.includes(x.ono)); H.n++; const id = 'h' + H.n; mkRes(id, rows); H.holds = []; H.run = { id, at: kst(), fileName: (H.last0 || H.last).fileName, status: 'done', done: true, hasResult: true, steps: step(6), summary: { printed: rows.length }, log: [{ t: '00:00:00', st: 'i', k: 'log', d: '보류 상자 다시 출력(시험 · 출고 끝 — 다른 날 보류 상자 이어서)' }] }; }
    if (k === 'keep0') H.last0 = H.last; return JSON.parse(JSON.stringify({ n: H.n, bodies: H.bodies })); });
  const SETUP = async (ships) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; window.confirm = () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; S.app = S.app || {}; S.app.oneShot = { ...(S.app.oneShot || {}), y24: false, cash: false };
    const SH = window.ReadnowShipping; const td = SH.ymd(new Date()); const now = () => new Date().toISOString(); const HX = SH.ALADIN_XLS_HEAD;
    const row = (no, sku, t, rcv) => ({ v: HX.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345', 주문일: td + ' 09:00' }[h] || '')) });
    const ord = (no, rcv, t, sku, at) => ({ orderNo: no, buyer: rcv, orderedAt: at || td + ' 09:00', recipient: { name: rcv }, items: [{ listingId: no.replace(/\D/g, ''), title: t, price: 5000, qty: 1, sku }] });
    window.__setShip = async (L) => { S.ship = { at: now(), tabCounts: { '발송 요청': L.length }, orders: L.map((x) => ord(...x)) }; FS.shp_state = FS.shp_state || {}; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); FS.shp_state.excel = S.shipX = { at: now(), header: HX, rows: L.map((x) => row(x[0], x[3], x[2], x[1])) }; S._shipRowsC = null; };
    await window.__setShip(ships);
    await db.collection('prd_jobs').doc('pcBeat').set({ pcs: { 'PC-T': { atMs: Date.now(), at: now(), ok: true } } });
    if (!window.__fcT) { window.FC = { seen: [] }; window.__fcT = setInterval(async () => { for (const [id, v0] of Object.entries(FS.shp_invoices || {})) { const v = JSON.parse(JSON.stringify(v0)); const ref = db.collection('shp_invoices').doc(id);
          if (v.status === 'queued') { await ref.set({ status: 'running', claim: { pc: 'PC-T', at: now() }, beat: now() }, { merge: true }); continue; } if (v.status !== 'running') continue; const items = v.items; items.filter((x) => x.state === 'todo').forEach((x) => { x.state = 'done'; FC.seen.push(x.orderNo + ':' + x.invoice); }); await ref.set({ items, status: 'done', doneAt: now(), verified: { ok: true, at: now() } }, { merge: true }); }
        for (const [id, v] of Object.entries(FS.shp_cmds || {})) if (v.type === 'read' && v.status === 'queued') { const done = new Set(Object.values(FS.shp_invoices || {}).flatMap((x) => (x.items || []).filter((i) => i.state === 'done').map((i) => i.orderNo))); await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); S.ship = { ...S.ship, at: now(), orders: S.ship.orders.filter((q) => !done.has(q.orderNo)) }; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); S._shipRowsC = null; } }, 600); }
    try { osWatchLock(); } catch (e) {} try { await alpsFetch('/alps/status'); } catch (e) {} /* MJ-MAIN은 도우미를 물어 둔 상태(이 창에 도우미가 없으면 실패 — JS-MAIN) */ await W(300); return true; };
  await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: fs.readFileSync(XL, 'utf8') });
  const B13 = Array.from({ length: 13 }, (_, i) => { const k = String(i + 1).padStart(2, '0'); return ['A-' + k, '손님' + k, '책 ' + k, 'SKU' + k + 'X']; });
  await p.evaluate(SETUP, B13);
  const o = await p.evaluate(async (B13) => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 60000)) { try { if (await f()) return true; } catch (e) {} await W(250); } return false; };
    const kAt = (min) => { const d = new Date(Date.now() + 9 * 3600e3 + min * 60e3).toISOString(); return d.slice(0, 10) + ' ' + d.slice(11, 16); };
    /* 어제 송장 입력 맡김(17/17 끝) — 오늘 것으로 읽히면 안 됨 */
    await db.collection('shp_invoices').doc('alps_yday').set({ createdAt: new Date(Date.now() - 30 * 3600e3).toISOString(), status: 'done', items: Array.from({ length: 17 }, (_, i) => ({ orderNo: 'Y-' + i, invoice: '23' + i, state: 'done' })) }); try { loadInvBatch(); } catch (e) {} await W(500);
    o.yday = { today: invIsToday(FS.shp_invoices.alps_yday), sum: alpsFoldSum(S.invB).t };
    await until(() => osCanRun(), 40000); await __H('hold', ['A-07']);
    const id1 = await window.shipOneShot(); const run = () => (FS.shp_runs || {})[id1] || {};
    await until(() => run().ph === 'ALPS', 40000);
    await window.__setShip([...B13, ['N-01', '손님03', '새 책 하나', 'NEW01X', kAt(1)], ['N-02', '손님91', '새 책 둘', 'NEW02X', kAt(1)]]); /* 도는 동안 새 주문 2건(하나는 묶음 손님과 같은 받는 분) */
    o.done1 = await until(() => run().status === 'done', 150000); await __H('keep0');
    const b = (run().bt || [])[0] || {}; o.al = (b.al || []).slice().sort(); o.match = b.match; o.cause = b.cause; const inv = Object.entries(FS.shp_invoices).filter(([k]) => k !== 'alps_yday').map(([k, v]) => ({ k, items: (v.items || []).map((x) => x.orderNo), skipped: (v.skipped || []).map((x) => [x.orderNo, (x.cause || {}).k]), batch: (v.batch || []).length }));
    o.inv = inv; o.book = JSON.parse(JSON.stringify((FS.shp_runs._batch || {}).holds || {}));
    await W(1500); S._shipRowsC = null; const rows = shipRows(); const R = (k) => rows.find((x) => x.key === 'al:' + k) || {}; o.rA07 = { st: R('A-07').stage, exc: R('A-07').exc }; o.rN1 = { st: R('N-01').stage, exc: R('N-01').exc }; o.rN2 = { st: R('N-02').stage, exc: R('N-02').exc };
    o.exc = shipExcRows().map((x) => x.id + ' ' + x.why).filter((x) => /A-07|N-0/.test(x)); o.cnt = shipCnt().al;
    o.dbgBefore = ((S.ship || {}).orders || []).map((q) => q.orderNo);
    const LEFT = [B13[6], ['N-01', '손님03', '새 책 하나', 'NEW01X', kAt(1)], ['N-02', '손님91', '새 책 둘', 'NEW02X', kAt(1)]];
    try { openShip(); } catch (e) {} await W(2500); await window.__setShip(LEFT); /* 시험 틀엔 수집기가 없어 출고 화면을 열 때 다시 읽기가 목록을 비움 — 실제 목록(보류 1 + 새 주문 2)으로 되돌림 */ try { shipRedrawSoon(); } catch (e) {} await W(1500); o.flow = ((document.getElementById('shp_osdone') || {}).textContent || '').replace(/\s+/g, ' '); o.dbgA07 = (() => { const x = shipRows().find((y) => y.key === 'al:A-07') || {}; return { st: x.stage, keys: osRunKeys(osRunsToday().slice(-1)[0]).length, ship: ((S.ship || {}).orders || []).map((q) => q.orderNo), cur: ((FS.shp_state.current || {}).orders || []).map((q) => q.orderNo), plan: JSON.stringify(S.shipPlan || {}).slice(0, 300), shipAt: (S.ship || {}).at }; })(); o.dbgBefore = o.dbgBefore || null; o.inv3 = { today: invIsToday(S.invB), batch: (S.invB.batch || []).length, id: S.invB.id };
    /* ✅ 오늘 출고 끝 알림 — 재검토 전 → 재검토 끝(12 이상 없음) → 이상 하나 */
    const cardT = (w) => { const d = document.createElement('div'); d.innerHTML = osDayCardHtml(w); return { k: (d.firstElementChild || {}).dataset ? d.firstElementChild.dataset.k : null, t: d.textContent.replace(/\s+/g, ' ').trim() }; };
    o.card0 = cardT('ship'); const did = (S.invB || {}).id; await db.collection('shp_invoices').doc(did).set({ rck: { state: 'done', at: new Date().toISOString(), okN: 12, bad: [] } }, { merge: true }); await W(800); S._rckM = null; o.card1 = cardT('ship'); o.cardH = cardT('home'); o.top = !!document.getElementById('osday_ship');
    await db.collection('shp_invoices').doc(did).set({ rck: { state: 'done', at: new Date().toISOString(), okN: 11, badN: 1, bad: [{ o: 'A-03', v: 'bad', d: [{ f: 'addr', v: 'bad', why: '주소 다름' }] }] } }, { merge: true }); await W(800); S._rckM = null; S.rckL = S.invBs; o.card2 = cardT('ship');
    await db.collection('shp_invoices').doc(did).set({ rck: { state: 'done', at: new Date().toISOString(), okN: 12, bad: [] } }, { merge: true }); await W(500); S._rckM = null; S.rckL = S.invBs;
    /* ③ 옛 맡김(묶음 목록·까닭 없음) — 실행 기록의 묶음 시작보다 늦게 들어온 주문은 묶음 밖 */
    o.legacy = [osSkipInBatch({ orderNo: 'N-01', _B: { runId: b.alpsId } }, { orderNo: 'N-01', orderedAt: kAt(1) }), osSkipInBatch({ orderNo: 'A-07', _B: { runId: b.alpsId } }, { orderNo: 'A-07', orderedAt: kAt(-600) })];
    /* ④ 풀기 — 도우미가 보류 상자를 다시 출력 → 엔진이 그 결과로 송장 입력까지 */
    await __H('release', ['A-07']); const st7 = await alpsFetch('/alps/status'); o.st7 = { id: st7.run && st7.run.id, log: st7.run && st7.run.log, hr: S._osHR, bl: Object.keys((S.os.bl || {}).holds || {}), keep: osKeep().map((x) => x.orderNo) }; await W(3000); o.st7b = { hr: S._osHR, inv: Object.keys(FS.shp_invoices) }; o.rel = await until(() => FS.shp_invoices && Object.values(FS.shp_invoices).some((v) => (v.items || []).some((x) => x.orderNo === 'A-07' && x.state === 'done')), 30000);
    o.book2 = ((FS.shp_runs._batch || {}).holds || {})['A-07'] || null; o.inv7 = Object.keys(FS.shp_invoices).filter((k) => (FS.shp_invoices[k].items || []).some((x) => x.orderNo === 'A-07')).length;
    /* ⑤ 다음 묶음(새 주문 2) — N-02는 송장이 아예 안 나옴(보류 아님) → 다시 맞춘 뒤에도 없으면 그 한 건만 사람 몫 */
    await window.__setShip(LEFT.slice(1)); S._shipRowsC = null; await __H('hold', []); await __H('drop', ['N-02']);
    const id2 = await window.shipOneShot(); const run2 = () => (FS.shp_runs || {})[id2] || {}; o.id2 = id2; o.done2 = await until(() => run2().status === 'done', 150000); o.log2 = (run2().log || []).map((x) => x.m).slice(-8); const b2 = (run2().bt || [])[0] || {}; o.al2 = (b2.al || []).slice().sort(); o.m2 = b2.match; o.re2 = (run2().log || []).some((x) => /다시 받아 한 번 더 맞춤/.test(x.m));
    await W(1500); S._shipRowsC = null; o.exc2 = shipExcRows().map((x) => x.id).filter((x) => /A-0|N-0/.test(x)); const h = await __H(); o.bodies = h.bodies;
    return o; }, B13);
  if (process.env.V) console.log(JSON.stringify(o, null, 1).slice(0, 6000));
  ok(o.yday && o.yday.today === false && /지난 출고/.test(o.yday.sum), '어제 송장 입력(17/17)은 「지난 출고 — 오늘 것 아님」', o.yday);
  ok(o.done1 && o.al.length === 13 && !o.al.some((x) => /^N-/.test(x)), '① 묶음 고정 13건 — 도는 동안 들어온 새 주문 2건은 안 낌', o.al);
  ok(o.match && o.match.ok === 12 && o.match.hold === 1 && o.match.nomatch === 0 && o.cause && o.cause['A-07'] && o.cause['A-07'].k === 'hold' && /발송 불가/.test(o.cause['A-07'].why), '① 맞춤 = 12 맞음 + 🧭 ALPS 보류 1(까닭 그대로) · 송장 못 찾음 0', { m: o.match, c: o.cause });
  const iv = (o.inv || []).find((x) => x.items.length === 12) || {};
  ok(iv.items && iv.batch === 13 && !iv.items.some((x) => /^N-/.test(x)) && JSON.stringify(iv.skipped) === '[["A-07","hold"]]', '① 송장 입력 맡김 12건 · 묶음 13 · 빠짐은 보류 1뿐(새 주문 없음)', o.inv);
  ok(o.book && o.book['A-07'] && !o.book['A-07'].doneAt, '① 보류 장부(모든 기기 한 곳)에 보류 주문', o.book);
  ok(o.rN1.st === 'deliv' && !o.rN1.exc && o.rN2.st === 'deliv' && !o.rN2.exc, '② 새 주문 2건 = 출고 준비(다음 묶음) · 문제 아님', [o.rN1, o.rN2]);
  ok(o.rA07.exc && o.rA07.exc.k === 'alpshold' && /ALPS 보류/.test(o.rA07.exc.why) && /다시 확인/.test(o.rA07.exc.why), '② 보류 주문은 진짜 까닭(🧭 ALPS 보류 · 엔진이 다시 확인)', o.rA07);
  ok(!o.exc.length, '② ⚠ 사람이 볼 것에 셋 다 없음', o.exc);
  ok(o.cnt.deliv === 3 && /보류 1/.test(o.flow) && /다음에 할 것 2/.test(o.flow) && /13건 = 끝 12/.test(o.flow), '② 셈: 묶음 13 = 끝 12 + 🧭 보류 1 · 새 주문 2는 따로', { cnt: o.cnt, flow: o.flow });
  ok(o.inv3.today && o.inv3.batch === 13, '② ③ 송장 입력 줄 = 오늘 것(묶음 13)', o.inv3);
  ok(o.card0.k === 'run' && /재검토 기다림/.test(o.card0.t), '✅ 알림: 재검토 전에는 「🔎 재검토 기다림」(끝이라 하지 않음)', o.card0);
  ok(o.card1.k === 'ok' && /오늘 출고 확실히 끝/.test(o.card1.t) && /묶음 주문 13건/.test(o.card1.t) && /송장 입력 12\/12/.test(o.card1.t) && /재검토 12건 이상 없음/.test(o.card1.t) && /보류 1/.test(o.card1.t) && /다음 확인/.test(o.card1.t) && o.top, '✅ 알림: 「오늘 출고 확실히 끝 — 묶음 13 · 송장 입력 12/12 · 재검토 12 이상 없음 · 🧭 보류 1(까닭·다음 확인)」 오늘 출고 맨 위', o.card1);
  ok(o.cardH.t === o.card1.t, '✅ 알림: 홈에도 같은 글', o.cardH);
  ok(o.card2.k === 'bad' && /재검토 이상 1건/.test(o.card2.t) && !/확실히 끝/.test(o.card2.t), '✅ 알림: 재검토 이상이 있으면 끝이라 하지 않고 그 일 하나', o.card2);
  ok(o.legacy[0] === false && o.legacy[1] === true, '③ 옛 맡김도 묶음 시작 시각으로 묶음 밖 주문을 가림', o.legacy);
  ok(o.rel && o.inv7 === 1 && o.book2 && o.book2.doneAt, '④ 풀린 보류 상자 다시 출력 → 엔진이 송장 입력까지 저절로 · 보류 장부 끝', { rel: o.rel, n: o.inv7, b: o.book2 });
  ok(o.done2 && JSON.stringify(o.al2) === '["N-01","N-02"]' && o.m2 && o.m2.nomatch === 1 && o.m2.hold === 0 && o.re2, '⑤ 다음 묶음 = 새 주문 2 · 송장 안 나온 1건은 엔진이 다시 받아 맞춤 → 그래도 없음', { al: o.al2, m: o.m2, re: o.re2 });
  ok(JSON.stringify(o.exc2) === '["exc:al:N-02|match"]', '⑤ 진짜 사람 몫 그 한 건만 ⚠ 사람이 볼 것', o.exc2);
  ok(o.bodies.length === 2 && o.bodies[1].length === 2, 'ALPS 접수는 묶음마다 한 번 · 두 번째 파일은 새 주문 2줄뿐', o.bodies);
  console.log(bad ? `❌ tSHIPHOLD1114 실패 ${bad}` : '✓ tSHIPHOLD1114 통과');
});
