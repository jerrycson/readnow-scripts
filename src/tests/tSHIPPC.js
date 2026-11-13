// tSHIPPC — 정범님 11/13 invpc1 · 헌장 제6조 「출고는 MJ-MAIN에서만」 · 바로잡은 사실 F01(HOME은 출고와 무관)·F15
//  11/10·11/13 알라딘 송장 입력을 HOME이 먼저 집어 맡음(수집기 송장 맡기 트랜잭션이 '대기'만 보고 PC를 가리지 않았음) → 출고 쓰기 일은 출고 PC만
//  ① 판단 한 곳(shipPcDecide): 출고 PC = 출고 표 shp_runs/_guard.cfg.mj(기본 MJ-MAIN) · 대소문자·빈칸 무시 · 이름 모르면 안 맡음 · 설정을 바꾸면 그 PC가 맡음
//  ② 가짜 화면(rnShipGuard 그대로): __rnShipPcOk가 출고 표 설정(cfg.mj)을 읽음
//  ③ 가짜 Firestore로 송장 맡기(claimInvoice): HOME은 안 맡고 '출고 PC 기다림' 한 번 · 1분 안 다시 안 씀 · 3분 넘게 아무도 안 맡으면 '꺼져 있는 듯' 한 줄(지금 줄은 그대로) · MJ-MAIN은 맡음(새 탭 엶)
//  ④ 발송준비시작 맡긴 일도 출고 PC만 · 출고 PC는 누른 기기를 기다리지 않음(속도 그대로) · 읽기·주문 취소·현금 판매중지는 그대로 · 머리 그대로
//  시험 자료 손님은 '손님A' — 실제 손님 정보 없음
const fs = require('fs'); const path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const SRC = pick(process.env.RN_REPO && path.join(process.env.RN_REPO, 'src/readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js'));
const s = fs.readFileSync(SRC, 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };

(async () => {
  // ── ① 판단 한 곳 ──
  const { shipPcDecide } = new Function(cut('function shipPcDecide(o)', '/* ⟦shipPcDecide 끝⟧ */') + '; return { shipPcDecide };')();
  ok(!shipPcDecide({ pc: 'HOME', shipPc: 'MJ-MAIN' }).ok, '① HOME은 출고 쓰기 일을 맡지 않음');
  ok(/출고 PC\(MJ-MAIN\) 기다림/.test(shipPcDecide({ pc: 'HOME', shipPc: 'MJ-MAIN' }).why), "① 까닭 글 '출고 PC(MJ-MAIN) 기다림'");
  ok(!shipPcDecide({ pc: 'JS-MAIN', shipPc: 'MJ-MAIN' }).ok && !shipPcDecide({ pc: 'LOGGER', shipPc: 'MJ-MAIN' }).ok, '① JS-MAIN·로거도 맡지 않음');
  ok(shipPcDecide({ pc: 'MJ-MAIN', shipPc: 'MJ-MAIN' }).ok && shipPcDecide({ pc: ' mj-main ', shipPc: 'MJ-MAIN' }).ok, '① MJ-MAIN은 맡음 · 대소문자·빈칸 무시');
  ok(shipPcDecide({ pc: 'MJ-MAIN' }).ok && !shipPcDecide({ pc: 'HOME' }).ok, '① 설정이 없으면 기본 MJ-MAIN');
  ok(!shipPcDecide({ pc: '', shipPc: 'MJ-MAIN' }).ok, '① 이 PC 이름을 모르면 맡지 않음');
  ok(shipPcDecide({ pc: 'JS-MAIN', shipPc: 'js-main' }).ok && !shipPcDecide({ pc: 'MJ-MAIN', shipPc: 'JS-MAIN' }).ok, '① 출고 표 설정(cfg.mj)을 바꾸면 그 PC만 맡음(하드코딩 아님)');
  ok((s.match(/function shipPcDecide\(/g) || []).length === 1, '① 판단 함수는 수집기 한 곳뿐');

  // ── ② 가짜 화면: __rnShipPcOk가 출고 표 설정을 읽음 ──
  { const mk = (pc, gm) => { const GM = { 'rnu-pcname': pc, ...(gm || {}) }; const W = { __rnLog: () => {} }; W.top = W; const doc = { documentElement: { getAttribute: () => null, setAttribute: () => {} } };
      const src = cut('(function rnShipGuard()', '/* (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기'); new Function('window', 'GM_getValue', 'GM_setValue', 'location', 'document', 'setInterval', 'setTimeout', src)(W, (k, d) => (k in GM ? GM[k] : d), (k, v) => { GM[k] = v; }, { hostname: 'www.aladin.co.kr' }, doc, () => 0, () => 0); return W; };
    ok(mk('MJ-MAIN').__rnShipPcOk().ok && !mk('HOME').__rnShipPcOk().ok, '② 출고 표를 아직 못 받았으면 기본 MJ-MAIN만');
    const G = { 'rn-sg-doc': { holds: {}, cfg: { mj: 'JS-MAIN' }, at: 1 } }; ok(mk('JS-MAIN', G).__rnShipPcOk().ok && !mk('MJ-MAIN', G).__rnShipPcOk().ok, '② 출고 표 cfg.mj(웹앱이 적는 출고 PC)를 따름'); }

  // ── ③ 가짜 Firestore로 송장 맡기 ──
  const store = {}; const ago = (m) => new Date(Date.now() - m * 60e3).toISOString();
  const au = (...x) => ({ __au: x });
  const apply = (cur, v) => { const o = JSON.parse(JSON.stringify(cur || {})); for (const [k, x] of Object.entries(v)) { if (k.includes('.')) { const [a, b] = k.split('.'); o[a] = { ...(o[a] || {}), [b]: x }; continue; } o[k] = x && x.__au ? [...(o[k] || []), ...x.__au] : x; } return o; };
  let writes = 0; const ref = (col, id) => ({ id, path: col + '/' + id, get: async () => ({ id, exists: !!store[col + '/' + id], data: () => store[col + '/' + id] && JSON.parse(JSON.stringify(store[col + '/' + id])) }), update: async (v) => { writes++; store[col + '/' + id] = apply(store[col + '/' + id], v); }, set: async (v) => { writes++; store[col + '/' + id] = apply(store[col + '/' + id], v); } });
  const C = (col) => ({ doc: (id) => ref(col, id) });
  const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), update: (r, v) => r.update(v), set: (r, v) => r.set(v) }) };
  const firebase = { firestore: { FieldValue: { arrayUnion: au } } };
  const FN = cut('  const shipPcOk = () =>', '// #rninv= :');
  const mkPc = (pc, beats) => { const opened = []; const logs = []; const GM = {}; const { shipPcDecide: D } = new Function(cut('function shipPcDecide(o)', '/* ⟦shipPcDecide 끝⟧ */') + '; return { shipPcDecide };')();
    const window = { __rnShipPcOk: () => D({ pc, shipPc: 'MJ-MAIN' }), __rnStep: null, __rnSgStart: () => {} };
    const env = { C, db, firebase, window, PC_NAME: pc, TAB_ID: 't1', nowIso: () => new Date().toISOString(), TS: () => 'ts', log: (m) => logs.push(m), GM_setValue: (k, v) => { GM[k] = v; }, GM_openInTab: (u) => opened.push(u), BEATS: beats || {} };
    const f = new Function(...Object.keys(env), FN + '\n return { claimInvoice, SPW_AT };')(...Object.values(env)); return { ...f, opened, logs, GM }; };
  const items = [{ orderNo: 'O1', invoice: '111100001111', recipient: '손님A', state: 'todo' }];
  store['shp_invoices/A'] = { createdAt: ago(0.1), status: 'queued', beat: ago(0.1), items, log: [] };
  const H = mkPc('HOME', { pcs: { 'MJ-MAIN': { atMs: Date.now() - 42 * 60e3 } } });
  await H.claimInvoice('A'); let v = store['shp_invoices/A'];
  ok(v.status === 'queued' && !v.claim && !H.opened.length, '③ HOME이 집으려 하면 안 맡음(대기 그대로 · 발송 요청 탭 안 엶)');
  ok(v.waitShip && v.waitShip.pc === 'MJ-MAIN' && v.waitShip.by === 'HOME' && v.stepNow && /출고 PC\(MJ-MAIN\) 기다림/.test(v.stepNow.m) && v.stepNow.res === '출고 PC 기다림', "③ 맡김 문서에 '출고 PC(MJ-MAIN) 기다림' 까닭(웹앱 🛰 칸·③ 지금 줄)");
  const w1 = writes; await H.claimInvoice('A'); ok(writes === w1 && store['shp_invoices/A'].log.length === 1, '③ 1분 안 다시 집어도 더 쓰지 않음');
  const J = mkPc('JS-MAIN'); await J.claimInvoice('A'); ok(store['shp_invoices/A'].log.length === 1 && store['shp_invoices/A'].status === 'queued', '③ 다른 PC(JS-MAIN)도 안 맡고 같은 까닭을 또 쓰지 않음');
  // 출고 PC 꺼짐: 3분 넘게 아무도 안 맡음
  store['shp_invoices/A'].waitShip.at = ago(4); const st0 = JSON.stringify(store['shp_invoices/A'].stepNow); H.SPW_AT.clear(); await H.claimInvoice('A'); v = store['shp_invoices/A'];
  ok(v.status === 'queued' && v.waitShip.off && v.log.length === 2 && /MJ-MAIN가 4분째 맡지 않음/.test(v.log[1].m) && /마지막 신호 42분 전/.test(v.log[1].m) && /대신 집지 않고 기다림/.test(v.log[1].m), "③ 출고 PC 꺼짐이면 기다림 — '4분째 맡지 않음 · 마지막 신호 42분 전 · 대신 집지 않고 기다림' 한 줄");
  ok(JSON.stringify(v.stepNow) === st0, '③ 꺼짐 줄은 지금 줄(stepNow)을 바꾸지 않음 — 원스톱 기다림 셈 그대로');
  H.SPW_AT.clear(); await H.claimInvoice('A'); ok(store['shp_invoices/A'].log.length === 2, '③ 꺼짐 줄은 한 번만');
  // 출고 PC가 켜짐 → 맡음
  const M = mkPc('MJ-MAIN'); await M.claimInvoice('A'); v = store['shp_invoices/A'];
  ok(v.status === 'running' && v.claim && v.claim.pc === 'MJ-MAIN' && M.opened.length === 1 && /worder_delivery\.aspx\?orderstep=4#rninv=A/.test(M.opened[0]), '③ MJ-MAIN(출고 PC)은 바로 맡아 발송 요청 화면을 엶');
  ok(M.GM['rn-inv-active'] && M.GM['rn-inv-active'].id === 'A', '③ 출고 PC가 맡은 뒤 흐름은 예전 그대로(rn-inv-active)');
  // 다시 맡기기(맥박 끊김 되돌림)마다 새로 한 번
  store['shp_invoices/B'] = { createdAt: ago(1), status: 'queued', items, log: [], reclaimN: 0 }; const H2 = mkPc('HOME'); await H2.claimInvoice('B'); store['shp_invoices/B'].reclaimN = 1; H2.SPW_AT.clear(); await H2.claimInvoice('B');
  ok(store['shp_invoices/B'].log.length === 2 && store['shp_invoices/B'].waitShip.qk === '1|', '③ 다시 맡기기(reclaimN)마다 기다림 까닭을 새로 한 번');
  store['shp_invoices/C'] = { createdAt: ago(1), status: 'done', items, log: [] }; await mkPc('HOME').claimInvoice('C'); ok(!store['shp_invoices/C'].waitShip && store['shp_invoices/C'].status === 'done', '③ 끝난 맡김에는 아무것도 안 씀');
  { const X = mkPc('HOME'); const env = X; void env; const F2 = new Function('C', 'db', 'firebase', 'window', 'PC_NAME', 'TAB_ID', 'nowIso', 'TS', 'log', 'GM_setValue', 'GM_openInTab', 'BEATS', FN + '\n return { claimInvoice };');
    store['shp_invoices/D'] = { createdAt: ago(0.1), status: 'queued', items, log: [] }; const op = []; const f = F2(C, db, firebase, {}, 'MJ-MAIN', 't', () => new Date().toISOString(), () => 'ts', () => {}, () => {}, (u) => op.push(u), {}); await f.claimInvoice('D');
    ok(store['shp_invoices/D'].status === 'queued' && !op.length, '③ 출고 PC 판단을 못 읽으면(함수 없음) 맡지 않음 — 안전 쪽'); }

  // ── ④ 맡긴 일(shp_cmds) · 머리 ──
  ok(/const SHIP_PC_CMDS = new Set\(\['startDelivery'\]\);/.test(s), '④ 출고 PC만 맡는 맡긴 일 = 발송준비시작');
  ok(/SHIP_PC_CMDS\.has\(x0\.type\)\) \{ const sp = shipPcOk\(\); if \(!sp\.ok\) \{ shipPcWait\(ref, sp,/.test(s), '④ 발송준비시작은 출고 PC가 아니면 맡기 전에 기다림 까닭만 적고 돌아감');
  ok(/claimDelay = \(x\) => \{ try \{ if \(x && SHIP_PC_CMDS\.has\(x\.type\) && window\.__rnShipPcOk && window\.__rnShipPcOk\(\)\.ok\) return 0;/.test(s), '④ 출고 PC는 누른 기기를 15초 기다리지 않고 바로(속도 그대로)');
  ok(/const SG_SHIP_CMDS = new Set\(\['startDelivery', 'read', 'cancelOrder', 'cashStop'\]\);/.test(s), '④ 출고 보호 무리(SG_SHIP_CMDS)는 그대로');
  ok(/\{ const sp = shipPcOk\(\); if \(!sp\.ok\) \{ shipPcWait\(ref, sp, '송장 입력'\)/.test(s), '④ 송장 맡기 첫 줄에 출고 PC 조건');
  const head = s.slice(0, s.indexOf('// ==/UserScript==')); ok(!/invpc1/.test(head), '④ 수집기 머리(@match·@grant·@connect)는 그대로');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tSHIPPC 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류: ' + (e && e.stack || e)); process.exit(1); });
