// tSHIPMIX0 — 출고 묶음 섞임 0 · 모든 기기 같은 단추 (정범님 11/14 17:46 「다음부터는 절대로 어떤 경우에도 섞이지 않도록 해줘」 · 18:07 「어떤 기기든 모두 실시간 동기화」)
//  ① 묶음 도중 새 주문(같은 받는 분) → 묶음 주문 목록은 시작할 때 고정(_batch.open.al) · ALPS 멈춤 → 사람이 멈춤 → 🔒 끝나지 않은 묶음
//  ② 막힘: 새 [출고 시작]은 새 실행을 만들지 않고 [▶ 이어서 진행]으로 · 저절로 시작(정한 시각·마감 한 번 더·shipOneShot auto)은 아예 안 함 · 📦 ALPS 자동 처리만도 새 일을 안 만듦
//  ③ 두 탭: 다른 탭이 막 이어 가는 중이면 이 탭은 이어서도·새로도 못 함 · 같은 트랜잭션(osLock) 안에서도 막음
//  ④ 새로 고침(웹앱 다시 염) 뒤에도 같은 잠금 · 같은 [▶ 이어서 진행] · 저절로 시작 0
//  ⑤ 두 기기(MJ-MAIN 도우미 있음 · JS-MAIN 없음) — 같은 Firestore 한 곳(onSnapshot)으로 같은 단추 글·같은 잠금 · JS-MAIN은 보기만(단추 꺼짐 · 눌러도 실행 0) · 상태가 바뀌면 JS-MAIN도 몇 초 안에 따라 바뀜
//  ⑥ [▶ 이어서 진행] → 같은 실행·같은 묶음(도우미 /alps/resume 한 번 · /alps/run 한 번뿐) → 끝까지 · 송장 입력 맡김에는 고정한 주문만(새 주문 0) · 잠금 풀림
//  ⑦ 끝난 뒤 새로 누르면 새 주문만으로 다음 묶음 · ⑧ 원스톱 밖(ALPS 자동 처리만)에서 멈춘 도우미 일도 모든 기기에 잠금 → 이어서는 도우미 일 그대로(새 접수 0)
//  시험 자료 손님은 '손님A…' · 010-0000-0000 (공개 저장소) · 실행: test-gate(--only tSHIPMIX0) 또는 RN_PORT=<포트> node tSHIPMIX0.js (harness.js·fbstub.js 옆)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const XL = path.join(__dirname, 'xlsx.full.min.js');
require('./harness.js')(async (p) => { let m = p;
  const brw = p.context().browser();
  const xlsxRoute = (pg) => pg.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\//, (r) => r.fulfill({ body: fs.readFileSync(XL), contentType: 'application/javascript' }));
  await xlsxRoute(p);
  /* 가짜 ALPS 도우미(MJ-MAIN 127.0.0.1:8898) — failPrint면 인쇄 단계에서 멈춤(오늘 11/14과 같은 글) · resume = 같은 줄로 다시(이번엔 끝까지) */
  const H = { n: 0, res: 0, run: null, last: null, bodies: [], failPrint: false, results: {}, hist: [] };
  const step = (st) => ['login', 'check', 'upload', 'print', 'verify', 'send'].map((k, i) => ({ k, l: k, st: i < st ? 'ok' : i === st ? 'run' : 'todo', pct: 50, d: '' }));
  const mkRes = (id, rows) => { const box = {}; let k = 0; H.results[id] = [['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ...rows.map((x, i) => { if (!box[x.name]) box[x.name] = String(240000000100 + H.n * 10 + H.res * 100 + (++k)); return [box[x.name], x.name, x.title, x.sku, 'M' + id + i, '출력', '', '']; })]; };
  const tick = () => { const R = H.run; if (!R || R.status !== 'run') return; R.polls = (R.polls || 0) + 1; if (R.polls < 3) return;
    if (H.failPrint && !R.resume) { R.status = 'error'; R.error = '출력 미리보기 창(PIDPIC051U)이 열리지 않음 — 시험'; R.steps = step(3).map((x, i) => (i === 3 ? { ...x, st: 'err' } : x)); R.summary = { rows: H.last.rows.length, upload: { ok: H.last.rows.length } }; H.hist.unshift({ id: R.id, status: 'error', file: R.fileName, fileName: R.fileName, rows: H.last.rows.length, at: R.at }); return; }
    mkRes(R.id, H.last.rows); Object.assign(R, { status: 'done', done: true, hasResult: true, need: null, steps: step(6), summary: { rows: H.last.rows.length, boxes: 2, printed: 2, waybills: H.last.rows.length, upload: { ok: H.last.rows.length } } }); H.hist.unshift({ id: R.id, status: 'done', file: R.fileName, fileName: R.fileName, rows: H.last.rows.length, at: R.at }); };
  const helperRoute = (pg) => pg.route(/^http:\/\/127\.0\.0\.1:8898\//, async (r) => { const u = new URL(r.request().url()); const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(o) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (u.pathname === '/alps/status') { tick(); return J({ ok: true, ver: '0.5.8', pc: 'MJ-MAIN', cfg: { printer: '롯데택배 시험' }, cred: { saved: true }, run: H.run, key: { fp: 'f', pub: 'P' }, remote: { on: false } }); }
    if (u.pathname === '/alps/pcheck') return J({ ok: true, state: '상태 3 · 오류 0 · 대기열 0' });
    if (u.pathname === '/alps/hist') return J({ ok: true, hist: H.hist });
    if (u.pathname === '/alps/run') { const b = JSON.parse(r.request().postData()); if (H.run && ['run', 'wait'].includes(H.run.status)) return J({ ok: false, err: '이미 처리 중입니다' }); H.last = b; H.bodies.push({ file: b.fileName, rows: b.rows.map((x) => x.ono + '|' + x.name) }); H.n++; H.run = { id: 'r' + H.n, at: new Date().toISOString(), fileName: b.fileName, status: 'run', steps: step(1), summary: {}, log: [] }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/resume') { if (!H.last) return J({ ok: false, err: '이어서 할 마지막 일이 없음' }); if (H.run && ['run', 'wait'].includes(H.run.status)) return J({ ok: false, err: '이미 처리 중입니다' }); H.res++; H.run = { id: 'q' + H.res, at: new Date().toISOString(), fileName: H.last.fileName, status: 'run', resume: true, steps: step(1), summary: {}, log: [] }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/result') { const id = u.searchParams.get('id'); return H.results[id] ? J({ ok: true, aoa: H.results[id] }) : J({ ok: false }); }
    if (u.pathname === '/alps/input' || u.pathname === '/alps/update' || u.pathname === '/alps/shippre') return J({ ok: true });
    return J({ ok: false }); });
  await helperRoute(p);
  p.on('dialog', (d) => d.accept());
  const HF = (k, v) => { if (k === 'failPrint') H.failPrint = !!v; if (k === 'helperErr') { H.run = { id: 'x1', at: new Date().toISOString(), fileName: '판매완료20261114.xlsx', status: 'error', error: '출력 미리보기 창이 열리지 않음 — 시험(ALPS 자동 처리만)', steps: step(3), summary: {}, log: [] }; H.last = H.last || { fileName: '판매완료20261114.xlsx', rows: [] }; } return JSON.parse(JSON.stringify({ n: H.n, res: H.res, bodies: H.bodies, run: H.run && { id: H.run.id, status: H.run.status } })); }; await p.exposeFunction('__H', HF);
  /* 같은 페이지에서 다시 쓰는 꾸밈(새로 고침 뒤에도) — 상품·주문·가짜 수집기(송장 입력)·가짜 '다시 읽기' */
  const SETUP = async (ships) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; window.confirm = () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; S.app = S.app || {}; S.app.oneShot = { ...(S.app.oneShot || {}), y24: false, cash: false };
    const SH = window.ReadnowShipping; const td = SH.ymd(new Date()); const now = () => new Date().toISOString(); const HX = SH.ALADIN_XLS_HEAD;
    const row = (no, sku, t, rcv) => ({ v: HX.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345', 주문일: td + ' 09:00' }[h] || '')) });
    const ord = (no, rcv, t, sku) => ({ orderNo: no, buyer: rcv, orderedAt: td + ' 09:00', recipient: { name: rcv }, items: [{ listingId: no.replace(/\D/g, ''), title: t, price: 5000, qty: 1, sku }] });
    window.__setShip = async (L) => { S.ship = { at: now(), tabCounts: { '발송 요청': L.length }, orders: L.map((x) => ord(...x)) }; FS.shp_state = FS.shp_state || {}; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); FS.shp_state.excel = S.shipX = { at: now(), header: HX, rows: L.map((x) => row(x[0], x[3], x[2], x[1])) }; S._shipRowsC = null; };
    await window.__setShip(ships);
    await db.collection('prd_jobs').doc('pcBeat').set({ pcs: { 'PC-T': { atMs: Date.now(), at: now(), ok: true } } });
    if (!window.__fcT) { window.FC = { seen: [] }; window.__fcT = setInterval(async () => { for (const [id, v0] of Object.entries(FS.shp_invoices || {})) { const v = JSON.parse(JSON.stringify(v0)); const ref = db.collection('shp_invoices').doc(id);
          if (v.status === 'queued') { await ref.set({ status: 'running', claim: { pc: 'PC-T', at: now() }, beat: now() }, { merge: true }); continue; } if (v.status !== 'running') continue; const items = v.items; items.filter((x) => x.state === 'todo').forEach((x) => { x.state = 'done'; FC.seen.push(x.orderNo + ':' + x.invoice); }); await ref.set({ items, status: 'done', doneAt: now(), verified: { ok: true, at: now() } }, { merge: true }); }
        for (const [id, v] of Object.entries(FS.shp_cmds || {})) if (v.type === 'read' && v.status === 'queued') { const done = new Set(Object.values(FS.shp_invoices || {}).flatMap((x) => (x.items || []).filter((i) => i.state === 'done').map((i) => i.orderNo))); await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); S.ship = { ...S.ship, at: now(), orders: S.ship.orders.filter((q) => !done.has(q.orderNo)) }; FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); S._shipRowsC = null; } }, 600); }
    try { osWatchLock(); } catch (e) {} try { await alpsFetch('/alps/status'); } catch (e) {} /* MJ-MAIN은 도우미를 물어 둔 상태(이 창에 도우미가 없으면 실패 — JS-MAIN) */ await W(300); return true; };
  await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: fs.readFileSync(XL, 'utf8') });
  await p.evaluate(SETUP, [['A-01', '손님A', '파란 책', 'BLUAAA'], ['A-02', '손님B', '분홍 책', 'PNKLUX']]);
  const o = {};
  /* ① 시작 → 묶음 고정 → 도중에 새 주문(같은 받는 분 손님A) → ALPS 멈춤 → 사람이 멈춤 */
  Object.assign(o, await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 60000)) { try { if (await f()) return true; } catch (e) {} await W(250); } return false; };
    await __H('failPrint', true); await until(() => osCanRun(), 40000); o.can0 = osCanRun(); o.st0 = osBtnState().mode;
    o.id1 = await window.shipOneShot(); const run = () => (FS.shp_runs || {})[o.id1] || {};
    o.claimed = await until(() => run().ph === 'ALPS' && (FS.shp_runs._batch || {}).open, 40000); o.open1 = JSON.parse(JSON.stringify((FS.shp_runs._batch || {}).open || {}));
    await window.__setShip([['A-01', '손님A', '파란 책', 'BLUAAA'], ['A-02', '손님B', '분홍 책', 'PNKLUX'], ['A-03', '손님A', '초록 책', 'GRNAAA']]); /* 묶음 도중 새 주문 — 같은 받는 분 */
    o.err1 = await until(() => run().status === 'wait' && run().need && run().need.k === 'alpserr', 40000); o.mode1 = osBtnState().mode; o.label1 = osBtnState().label;
    await osAct('stop'); await W(600); o.stop = run().status; o.blk = JSON.parse(JSON.stringify(osBlock() || null)); o.mode2 = osBtnState().mode; o.label2 = osBtnState().label; o.helper = ((FS.shp_runs._batch || {}).helper || {}).status;
    return o; }));
  ok(o.can0 && o.st0 === 'start', '처음: MJ-MAIN(도우미 있음)은 실행 가능 · 단추는 「출고 시작」', { can: o.can0, st: o.st0 });
  ok(o.claimed && o.open1.frz && JSON.stringify((o.open1.al || []).slice().sort()) === '["A-01","A-02"]', '① 묶음을 시작할 때 주문 목록을 한 곳(_batch.open)에 고정 ' + JSON.stringify(o.open1.al));
  ok(o.err1 && o.mode1 === 'resume' && o.label1 === '▶ 이어서 진행', '① ALPS 멈춤(사람 몫) → 단추는 「▶ 이어서 진행」', { m: o.mode1, l: o.label1 });
  ok(o.stop === 'stop' && o.blk && o.blk.k === 'open' && o.mode2 === 'resume' && o.label2 === '▶ 이어서 진행', '① 사람이 멈춤 → 🔒 끝나지 않은 묶음 · 단추는 「▶ 이어서 진행」 하나', { blk: o.blk && o.blk.k, m: o.mode2 });
  ok(o.helper === 'error', '① MJ-MAIN 도우미 멈춤이 한 곳(_batch.helper)에 비침', o.helper);
  /* ② 막힘 — 저절로 시작 0 · 📦 ALPS 자동 처리만도 새 일 0 */
  Object.assign(o, await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const n0 = ((FS.shp_runs._lock || {}).n || {}); const h0 = await __H();
    o.auto = await window.shipOneShot({ auto: true }); o.sched = await window.shipOneShot({ auto: true, sched: '10:30' }); o.upd = await window.shipOneShot({ noAsk: true, afterUpd: true });
    const k = new Date(Date.now() + 9 * 3600e3); const hm = String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0');
    S.app.oneShot = { ...S.app.oneShot, schedOn: true, schedAt: ['00:00', hm], schedWd: [0, 1, 2, 3, 4, 5, 6], cutOn: true, cutoff: '00:00' }; S.os.drive = false; await osSchedTick().catch(() => {}); await osCutoffTick().catch(() => {}); await W(800);
    try { localStorage.setItem('rn-ship-alt', 'alps'); o.altBtn = shipAltBtn(true); } catch (e) { o.altBtn = 'ERR ' + e.message; } try { localStorage.removeItem('rn-ship-alt'); } catch (e) {}
    S.app.oneShot = { ...S.app.oneShot, schedOn: false, cutOn: false };
    const h1 = await __H(); o.newRun = JSON.stringify((FS.shp_runs._lock || {}).n || {}) !== JSON.stringify(n0); o.alpsRun = h1.n - h0.n; o.resumed = h1.res - h0.res; o.runs = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length;
    return o; }));
  ok(o.auto === null && o.sched === null && o.upd === null, '② 저절로 시작(마감·정한 시각·업데이트 뒤)은 시작 안 함', [o.auto, o.sched, o.upd]);
  ok(!o.newRun && o.runs === 1 && o.alpsRun === 0, '② 정한 시각·마감 한 번 더 — 새 실행 0 · 새 ALPS 접수 0', { runs: o.runs, alps: o.alpsRun });
  ok(/id="shp_oneshot"/.test(o.altBtn || '') && /이어서 진행/.test(o.altBtn || '') && !/id="alps_auto"/.test(o.altBtn || ''), '② 📦 ALPS 자동 처리만을 골라 둔 기기도 큰 단추는 같은 「▶ 이어서 진행」(새 ALPS 일 단추 없음)', String(o.altBtn || '').slice(0, 200));
  /* ③ 두 탭 — 다른 탭이 막 이어 가는 중이면 이 탭은 이어서·새로 모두 못 함 */
  Object.assign(o, await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const id = FS.shp_runs._lock.id; const h0 = await __H();
    await db.collection('shp_runs').doc(id).set({ status: 'run', owner: { tab: 'os_tab2', dev: 'MJ-MAIN', beat: new Date().toISOString(), leftAt: null } }, { merge: true }); await W(400);
    o.mode = osBtnState().mode; o.a = await window.shipOneShot(); await W(300); o.b = await osReopenRun(id, osBlock()); const h1 = await __H(); o.res = h1.res - h0.res; o.n = h1.n - h0.n; o.owner = (FS.shp_runs[id].owner || {}).tab; o.runs = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length;
    /* 그 탭이 닫히고(맥박 끊김) 멈춤으로 남았다 침 */ await db.collection('shp_runs').doc(id).set({ status: 'stop', owner: { tab: 'os_tab2', dev: 'MJ-MAIN', beat: new Date(Date.now() - 10 * 60e3).toISOString() } }, { merge: true }); await W(400);
    /* 같은 트랜잭션 안에서도 막는지 — 받아 둔 잠금을 비운 채로 osLock */ const keep = S.os.bl; S.os.bl = {}; const L = await osLock({}); S.os.bl = keep; o.lockBlocked = !!(L && L.blocked); o.runs2 = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length;
    return o; }));
  ok(o.mode === 'busy' && o.owner === 'os_tab2' && o.res === 0 && o.n === 0 && o.runs === 1 && o.b === null, '③ 두 탭: 다른 탭이 이어 가는 중이면 이 탭은 이어서·새로 모두 안 함(도우미 이어서 0 · 새 실행 0)', o);
  ok(o.lockBlocked && o.runs2 === 1, '③ 받아 둔 상태가 비어 있어도 osLock 트랜잭션 안에서 막음(새 실행 0)', { b: o.lockBlocked, runs: o.runs2 });
  /* ④ 새로 고침 — 창을 닫고 다시 엶(Firestore 그대로 · 서비스 워커를 피하려고 새 창) · 같은 잠금 · 같은 단추 · 저절로 시작 0 */
  const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
  const openApp = async (dev, helper) => { const snap = await m.evaluate(() => JSON.stringify(window.__FS)); const pg = await brw.newPage({ viewport: { width: 1400, height: 900 } }); pg.__err = []; pg.on('pageerror', (e) => pg.__err.push(e.message));
    await pg.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await pg.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await pg.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' })); await xlsxRoute(pg); if (helper) await helperRoute(pg);
    await pg.addInitScript(([s, d]) => { try { localStorage.setItem('rn-device', d); localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} if (!window.__FSRESTORED) { window.__FSRESTORED = 1; window.__FS = JSON.parse(s); } }, [snap, dev]);
    pg.on('dialog', (d) => d.accept()); if (helper) await pg.exposeFunction('__H', HF); await pg.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await pg.waitForTimeout(2500); await pg.evaluate(require('./seed.js')); await pg.addScriptTag({ content: fs.readFileSync(XL, 'utf8') });
    await pg.evaluate(SETUP, [['A-01', '손님A', '파란 책', 'BLUAAA'], ['A-02', '손님B', '분홍 책', 'PNKLUX'], ['A-03', '손님A', '초록 책', 'GRNAAA']]); return pg; };
  { const m2 = await openApp('MJ-MAIN', true); await m.close(); m = m2;
    Object.assign(o, await m.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 30000)) { try { if (await f()) return true; } catch (e) {} await W(250); } return false; };
      const h0 = await __H(); await until(() => S.os.blAt && S.os.doc, 15000); await until(() => osCanRun(), 40000); o.rMode = osBtnState().mode; o.rLabel = osBtnState().label;
      await osResumeCheck().catch(() => {}); S.app.oneShot = { ...S.app.oneShot, cutOn: true, cutoff: '00:00' }; await osCutoffTick().catch(() => {}); S.app.oneShot = { ...S.app.oneShot, cutOn: false }; await W(1500); const h1 = await __H();
      o.rRuns = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length; o.rAlps = h1.n - h0.n + (h1.res - h0.res); o.rSt = FS.shp_runs[FS.shp_runs._lock.id].status;
      try { openShip(); } catch (e) {} await W(1500); const b = document.getElementById('shp_oneshot'); o.rBtn = b ? { t: b.textContent.trim(), dis: b.disabled } : null; o.rLine = (document.getElementById('os_bl') || {}).textContent || '';
      return o; })); }
  ok(o.rMode === 'resume' && o.rLabel === '▶ 이어서 진행' && o.rRuns === 1 && o.rAlps === 0 && o.rSt === 'stop', '④ 새로 고침 뒤에도 같은 🔒 잠금 · 「▶ 이어서 진행」 · 저절로 시작·이어받기 0', { m: o.rMode, runs: o.rRuns, alps: o.rAlps, st: o.rSt });
  ok(o.rBtn && /이어서 진행/.test(o.rBtn.t) && !o.rBtn.dis && /끝나지 않은 묶음/.test(o.rLine), '④ 출고 화면 큰 단추 = 「▶ 이어서 진행」(MJ-MAIN에서 누를 수 있음) · 🔒 줄', o.rBtn);
  /* ⑤ 두 기기 — JS-MAIN(도우미 없음)을 새 창으로 · 두 창의 Firestore를 이어 붙임(실제 Firestore처럼 한 곳) */
  const q = await openApp('JS-MAIN', false); const qErr = q.__err; await q.evaluate(() => { clearInterval(window.__fcT); window.__fcT = 1; }); /* 가짜 수집기는 MJ 창 하나만 */
  const COLS = ['shp_runs', 'app_settings', 'shp_invoices', 'shp_cmds', 'shp_cmd_out', 'prd_system'];
  const pull = (pg) => pg.evaluate((C) => { const o = {}; for (const c of C) o[c] = (window.__FS || {})[c] || {}; return JSON.stringify(o); }, COLS).then(JSON.parse);
  const push = (pg, c, id, v) => pg.evaluate(([c, id, v]) => db.collection(c).doc(id).set(v), [c, id, v]);
  const last = {}; let relayOn = true; let relays = 0;
  const relay = async () => { while (relayOn) { try { const a = await pull(m), b = await pull(q); for (const c of COLS) { for (const id of new Set([...Object.keys(a[c] || {}), ...Object.keys(b[c] || {})])) { const ja = JSON.stringify((a[c] || {})[id]), jb = JSON.stringify((b[c] || {})[id]); const k = c + '/' + id; if (ja === jb) { last[k] = ja; continue; }
          if (ja !== undefined && (last[k] === jb || jb === undefined || last[k] === undefined)) { await push(q, c, id, a[c][id]); last[k] = ja; relays++; } else if (jb !== undefined) { await push(m, c, id, b[c][id]); last[k] = jb; relays++; } } } } catch (e) {} await new Promise((r) => setTimeout(r, 300)); } };
  const relayP = relay();
  const both = async (f) => [await m.evaluate(f), await q.evaluate(f)];
  const st = () => { try { const x = osBtnState(); const B = x.B || {}; return { mode: x.mode, label: x.label, key: B.key || (B.h || {}).id || null, can: x.can, line: ((document.getElementById('os_bl') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 60) }; } catch (e) { return { err: e.message }; } };
  await q.waitForTimeout(3000); await q.evaluate(() => { try { openShip(); } catch (e) {} }); await q.waitForTimeout(1500);
  { const [a, b] = await both(st); o.d1 = { a, b }; o.d1btn = await q.evaluate(() => { const b = document.getElementById('shp_oneshot'); return b ? { t: b.textContent.trim(), dis: b.disabled } : null; });
    o.d1try = await q.evaluate(async () => { const FS = window.__FS; const n = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length; const a = await window.shipOneShot(); const b = await osResumeGo(osBlock()); try { await osAct('retry'); } catch (e) {} await new Promise((r) => setTimeout(r, 500)); return { a, b, n0: n, n1: Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length, st: FS.shp_runs[FS.shp_runs._lock.id].status, hOk: osHelperHere() }; }); }
  ok(o.d1.a.mode === 'resume' && o.d1.b.mode === 'resume' && o.d1.a.label === o.d1.b.label && o.d1.a.key && o.d1.a.key === o.d1.b.key, '⑤ 두 기기: MJ-MAIN·JS-MAIN 같은 단추 「▶ 이어서 진행」·같은 묶음 열쇠', o.d1);
  ok(o.d1.a.can === true && o.d1.b.can === false && o.d1btn && /이어서 진행/.test(o.d1btn.t) && /MJ-MAIN에서만/.test(o.d1btn.t), '⑤ JS-MAIN은 보기만 — 같은 단추에 「(MJ-MAIN에서만)」 · 눌러도 실행 안 함', o.d1btn);
  ok(o.d1try.a === null && o.d1try.b === null && o.d1try.n0 === o.d1try.n1 && o.d1try.st === 'stop' && !o.d1try.hOk, '⑤ JS-MAIN에서 눌러도 실행 0(새 실행·이어서·사람 몫 답 모두 안 함)', o.d1try);
  /* ⑥ MJ-MAIN에서 [▶ 이어서 진행] — 같은 실행·같은 묶음만 · 끝까지 · 새 주문 0 · JS-MAIN도 따라 바뀜 */
  Object.assign(o, await m.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 60000)) { try { if (await f()) return true; } catch (e) {} await W(250); } return false; };
    await __H('failPrint', false); const id = FS.shp_runs._lock.id; const h0 = await __H(); o.rid = await window.shipOneShot(); /* 큰 단추와 같은 길 */ o.same = o.rid === id;
    o.running = await until(() => FS.shp_runs[id].status === 'run', 10000); o.done = await until(() => FS.shp_runs[id].status === 'done', 120000); const h1 = await __H(); const r = FS.shp_runs[id];
    o.res = h1.res - h0.res; o.alpsN = h1.n; o.bodies = h1.bodies; o.bt = (r.bt || []).map((b) => b.al); o.inv = Object.values(FS.shp_invoices || {}).flatMap((v) => (v.items || []).map((x) => x.orderNo)); o.seen = FC.seen.slice(); o.runs = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length;
    o.open = (FS.shp_runs._batch || {}).open || null; o.closed = Object.keys((FS.shp_runs._batch || {}).closed || {}); o.modeEnd = osBtnState().mode; o.log = (r.log || []).map((x) => x.m).filter((m) => /이어서 진행/.test(m)).slice(0, 4);
    return o; }));
  ok(o.same && o.running && o.done && o.runs === 1, '⑥ 「▶ 이어서 진행」 = 같은 실행·같은 묶음을 끝까지(새 실행 0)', { same: o.same, done: o.done, runs: o.runs, log: o.log });
  ok(o.res === 1 && o.alpsN === 1 && o.bodies.length === 1 && !o.bodies[0].rows.some((x) => /A-03/.test(x)), '⑥ 도우미: 멈춘 일 이어서 1번 · 새 접수(/alps/run)는 처음 1번뿐 · 파일에 새 주문 없음', { res: o.res, n: o.alpsN, bodies: o.bodies });
  ok(JSON.stringify((o.bt || []).map((x) => (x || []).slice().sort())) === '[["A-01","A-02"]]' && o.inv.length && o.inv.every((x) => ['A-01', 'A-02'].includes(x)) && !o.seen.some((x) => /^A-03/.test(x)), '⑥ 섞임 0 — 묶음·송장 입력 맡김에 고정한 주문만(같은 받는 분의 새 주문 A-03 없음)', { bt: o.bt, inv: o.inv, seen: o.seen });
  ok(!o.open && o.closed.length >= 1 && o.modeEnd === 'start', '⑥ 묶음이 끝나면 잠금 풀림(기록은 closed에 남음)', { open: o.open, closed: o.closed, m: o.modeEnd });
  await q.waitForTimeout(3500); o.d2 = await q.evaluate(st);
  ok(o.d2.mode === 'start', '⑤ JS-MAIN도 몇 초 안에 따라 바뀜(잠금 풀림)', o.d2);
  /* ⑦ 끝난 뒤 새로 누르면 — 새 주문만으로 다음 묶음 */
  Object.assign(o, await m.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 60000)) { try { if (await f()) return true; } catch (e) {} await W(250); } return false; };
    const id2 = await window.shipOneShot(); o.new2 = !!id2 && id2 !== Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_'))[0]; await until(() => (FS.shp_runs[id2] || {}).status === 'done', 120000); const r = FS.shp_runs[id2] || {}; o.bt2 = (r.bt || []).map((b) => b.al); const h = await __H(); o.b2 = (h.bodies[1] || {}).rows || []; return o; }));
  ok(o.new2 && JSON.stringify(o.bt2) === '[["A-03"]]' && o.b2.length === 1 && /A-03/.test(o.b2[0]), '⑦ 끝난 뒤 새로 누르면 새 주문(A-03)만으로 다음 묶음', { bt: o.bt2, b2: o.b2 });
  /* ⑧ 원스톱 밖(📦 ALPS 자동 처리만)에서 도우미 일이 멈춤 → 모든 기기 잠금 → 이어서는 도우미 일 그대로 */
  Object.assign(o, await m.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; await __H('helperErr'); await alpsFetch('/alps/status'); await W(600); o.hb = JSON.parse(JSON.stringify(osBlock() || null)); o.hm = osBtnState().mode; return o; }));
  await q.waitForTimeout(3500); o.d3 = await q.evaluate(st);
  Object.assign(o, await m.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const h0 = await __H(); const runs0 = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length; o.hr = await window.shipOneShot(); await W(800); const h1 = await __H(); o.hres = h1.res - h0.res; o.hn = h1.n - h0.n; o.hruns = Object.keys(FS.shp_runs).filter((x) => !x.startsWith('_')).length - runs0; return o; }));
  ok(o.hb && o.hb.src === 'helper' && o.hm === 'resume' && o.d3.mode === 'resume' && o.d3.can === false, '⑧ ALPS 자동 처리만에서 멈춘 도우미 일 — MJ-MAIN·JS-MAIN 모두 🔒 「▶ 이어서 진행」', { a: o.hb && o.hb.src, b: o.d3 });
  ok(o.hres === 1 && o.hn === 0 && o.hruns === 0, '⑧ 이어서 = 도우미 같은 일(이어서 1번 · 새 접수 0 · 새 원스톱 실행 0)', { res: o.hres, n: o.hn, runs: o.hruns });
  { const cardF = () => { const d = document.createElement('div'); d.innerHTML = osDayCardHtml('home'); return d.textContent.replace(/\s+/g, ' ').trim(); }; await q.waitForTimeout(3000); o.cardA = await m.evaluate(cardF); o.cardB = await q.evaluate(cardF); }
  ok(o.cardA && o.cardA === o.cardB, '⑤ 오늘 출고 알림 칸 — MJ-MAIN·JS-MAIN 같은 글', { a: o.cardA, b: o.cardB });
  relayOn = false; await relayP; o.relays = relays;
  ok(!qErr.length, 'JS-MAIN 창 오류 없음', qErr.slice(0, 3));
  if (process.env.V) console.log(JSON.stringify(o, null, 1).slice(0, 6000));
  await q.close();
  console.log(bad ? `❌ tSHIPMIX0 실패 ${bad}` : '✓ tSHIPMIX0 통과');
});
