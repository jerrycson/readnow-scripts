// tONESHOTc — 정범님 11/04 '출고 송장 원스톱' 수집기·도우미 쪽: 첫 건 자동 검증(배송&구매확정전 다시 읽기) → 맞으면 나머지 저절로 · 틀리면 멈춤 ⚠
//  · 로그인 풀림은 5번 다시 열지 않고 '로그인 필요' · 넣기 전 송장 칸 한 번에 확인 · '발송 요청에 없음'을 이미 입력됨/취소 의심으로 가름 · 같은 송장 열쇠(주문:송장)
//  · ALPS 도우미: 프린터 상태 판단(오프라인·오류·대기열) · 일의 날짜 고정(자정 넘김) · 인쇄 도우미 판 바꾸기는 처리 중엔 미룸 · 수집기 머리 그대로
//  가짜 알라딘 발송 요청 화면(jsdom) + 가짜 Firestore — tSTEPLOG와 같은 틀 · 시험 자료 손님은 '손님A'
const fs = require('fs'); const path = require('path'); const os = require('os'); const { JSDOM } = require('jsdom'); const cpx = require('child_process');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const ALPS = pick(path.join(__dirname, '../../local/readnow-alps.js'), path.join(__dirname, '../local/readnow-alps.js')); const PRINT = pick(path.join(__dirname, '../../local/readnow-print.js'), path.join(__dirname, '../local/readnow-print.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); return s.slice(i, j + b.length); };
const STEP_SRC = cut(src, '(function rnStepLog() {', '\n})();');
const INV_SRC = cut(src, '(async function rnInvoiceRunner() {', "if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }\n})();");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fakeFb() { const store = {}; const W = []; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { id = id || 'auto' + Math.random().toString(36).slice(2, 8); const p = col + '/' + id; return { id, path: p, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { W.push({ p, v }); store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); }, update: async (v) => { W.push({ p, v }); store[p] = merge(store[p], v); } }; };
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ get: async () => ({ docs: [] }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
  const user = { email: 'test@x' }; const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; } };
  const app = { firestore: () => db, auth: () => auth }; const fb = { apps: [app], app: () => app, initializeApp: () => app, auth: () => auth, firestore: Object.assign(() => db, { FieldValue: FV }) };
  return { fb, db, store, W }; }
/* 배송&구매확정전 화면(가짜) — 주문 줄 tr#oListN 안에 주문번호·송장번호 */
const shippedHtml = (L) => `<html><body><table>${L.map(([o, inv, how], i) => how === 'href' ? `<tr id="oList${i + 1}"><td><a onclick="viewOrderDetail('${o}')">${o}</a></td><td>9002026110416 2026102418 2 010-0000-0000 <a href="javascript:goTracking('롯데택배','${inv}')">배송조회</a></td></tr>` : `<tr id="oList${i + 1}"><td><a onclick="viewOrderDetail('${o}')">${o}</a></td><td>롯데택배 ${inv}</td></tr>`).join('')}</table><a onclick="Page_Set(1)">1</a></body></html>`; /* (11/05) how='href' = 송장번호가 배송 조회 링크 안에만 있는 꼴(실제 11/05 14:23) */
async function run(name, o) { const F = fakeFb(); const GM = new Map(); const id = 'alps_t'; const LG = []; const fetched = [];
  F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', limit: o.limit ?? 1, verify: o.verify ?? true, autoCont: o.autoCont ?? true, from: 'oneshot', log: [], items: o.items };
  GM.set('rn-inv-active', { id, at: Date.now() });
  const page = async (orders, inputs, extra) => { extra = extra || {}; const dom = new JSDOM(`<body>${extra.html || ''}${inputs.map((x) => `<input id="deliveryNo.${x}">`).join('')}</body>`, { url: extra.url || 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__clicked = [];
    w.firebase = F.fb; w.__rnLog = (m, l, x) => LG.push([m, l, x]); w.__rnPcName = { get: () => 'PC-T' }; w.sessionStorage.setItem('rn-inv-tab', id);
    w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {}; w.deliveryNoComplete = (x) => w.__clicked.push(x);
    w.fetch = async (u) => { fetched.push(String(u)); return { ok: true, text: async () => (o.shipped ? shippedHtml(o.shipped) : '<html><body>빈 화면</body></html>') }; };
    w.ReadnowShipping = { matchInvoices: () => ({}), parseDeliveryPage: () => (extra.noTabs ? { orders: [], tabCounts: {} } : { orders: orders.map((x) => ({ orderNo: x })), tabCounts: { 발송요청: orders.length } }) };
    w.__rnInvVerifyWait = 200; w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  const D = () => F.store['shp_invoices/' + id]; return { F, GM, LG, fetched, page, D, id }; }
(async () => {
  console.log('■ (11/05) 송장번호가 배송 조회 링크 안에만 있어도 검증 맞음 · 긴 숫자 안내에 전화 꼴 없음');
  { const T = await run('href', { items: [{ orderNo: 'O1', invoice: '265412976706', recipient: '손님A', state: 'todo' }, { orderNo: 'O2', invoice: '265412976707', recipient: '손님B', state: 'todo' }], shipped: [['O1', '265412976706', 'href']] });
    const w1 = await T.page(['O1', 'O2'], ['O1', 'O2']); await sleep(2600); w1.close(); const w2 = await T.page(['O2'], ['O2']); await sleep(3400); const d = T.D();
    ok(d.verified && d.verified.ok && !d.verifyFail, '링크(href) 안 송장번호로 첫 건 검증 맞음 ' + JSON.stringify(d.verified || {})); w2.close(); }
  { const T = await run('href2', { items: [{ orderNo: 'O1', invoice: '265412976706', recipient: '손님A', state: 'todo' }, { orderNo: 'O2', invoice: '265412976707', recipient: '손님B', state: 'todo' }], shipped: [['O1', '999999999999', 'href']] });
    const w1 = await T.page(['O1', 'O2'], ['O1', 'O2']); await sleep(2600); w1.close(); const w2 = await T.page(['O2'], ['O2']); await sleep(4200); const d = T.D(); const why = (d.verified || {}).why || '';
    ok(d.verifyFail && /999999999999/.test(why) && !/010/.test(why) && T.fetched.filter((u) => /worder_delivery_complete/.test(u)).length >= 3, '다른 송장이면 두 번 더 읽어 본 뒤 멈춤 · 안내 숫자에 전화 꼴(010…) 없음 ' + why); w2.close(); }
  console.log('■ 첫 건 자동 검증 맞음 → 나머지 저절로');
  { const T = await run('ok', { items: [{ orderNo: 'O1', invoice: '240000000011', recipient: '손님A', state: 'todo' }, { orderNo: 'O2', invoice: '240000000012', recipient: '손님B', state: 'todo' }], shipped: [['O1', '240000000011']] });
    const w1 = await T.page(['O1', 'O2'], ['O1', 'O2']); await sleep(2600); ok(w1.__clicked.join() === 'O1', '첫 화면: 첫 건(O1)만 넣음'); w1.close();
    const w2 = await T.page(['O2'], ['O2']); await sleep(3400); const d = T.D();
    ok(d.items[0].state === 'done' && d.verified && d.verified.ok && d.verified.orderNo === 'O1' && d.verified.invoice === '240000000011', '다시 연 화면: O1 입력됨 → 배송&구매확정전을 읽어 송장 확인(verified.ok) ' + JSON.stringify(d.verified || {}));
    ok(T.fetched.some((u) => /worder_delivery_complete\.aspx\?page=1/.test(u)), '배송&구매확정전 1쪽을 읽음');
    ok(d.limit === 0 && d.status === 'running' && w2.__clicked.join() === 'O2', '검증이 맞으니 사람 없이 나머지(O2)를 이어서 넣음');
    ok((d.log || []).some((x) => /첫 건 자동 검증 맞음/.test(x.m) && x.lv === 'ok'), '단계 줄: 첫 건 자동 검증 맞음'); ok(typeof d.beat === 'string', '맥박(beat)을 문서에 씀'); w2.close(); }
  console.log('■ 첫 건 자동 검증 틀림 → 멈추고 ⚠');
  { const T = await run('bad', { items: [{ orderNo: 'O1', invoice: '240000000011', state: 'sent' }, { orderNo: 'O2', invoice: '240000000012', state: 'todo' }], shipped: [['O1', '999999999999']] });
    const w = await T.page(['O2'], ['O2']); await sleep(3400); const d = T.D();
    ok(d.status === 'paused' && d.verifyFail && d.verified && !d.verified.ok && /송장번호가 (다름|안 보임)/.test(d.verified.why) && /첫 건 자동 검증 실패/.test(d.pauseWhy), '송장이 다르면 멈춤(verifyFail · 까닭) ' + JSON.stringify(d.verified || {}));
    ok(!w.__clicked.length && !T.GM.has('rn-inv-active'), '나머지는 넣지 않음'); w.close(); }
  console.log("■ 설정 '저절로 계속' 끔 → 검증 결과를 보여 주고 멈춤");
  { const T = await run('off', { autoCont: false, items: [{ orderNo: 'O1', invoice: '240000000011', state: 'sent' }, { orderNo: 'O2', invoice: '240000000012', state: 'todo' }], shipped: [['O1', '240000000011']] });
    const w = await T.page(['O2'], ['O2']); await sleep(3400); const d = T.D(); ok(d.status === 'paused' && d.verified && d.verified.ok && !d.verifyFail && !w.__clicked.length, '검증 맞음 + 멈춤(「나머지 계속」 기다림)'); w.close(); }
  console.log('■ 로그인 풀림 → 바로 로그인 필요(5번 다시 열지 않음)');
  { const T = await run('login', { items: [{ orderNo: 'O1', invoice: '240000000011', state: 'todo' }] });
    const w = await T.page([], [], { noTabs: 1, html: '<form><input type="password" name="pw"></form>', url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4' }); await sleep(800); const d = T.D();
    ok(d.status === 'paused' && d.needLogin === true && /로그인/.test(d.pauseWhy) && !w.__clicked.length, '로그인 화면이면 needLogin으로 멈춤 · 아무것도 넣지 않음'); ok(!w.sessionStorage.getItem('rn-inv-bad'), "'5번 다시 열기' 세지 않음"); w.close(); }
  console.log('■ 넣기 전 송장 칸 한 번에 확인');
  { const T = await run('field', { limit: 0, verify: false, items: [{ orderNo: 'O1', invoice: '240000000011', state: 'todo' }, { orderNo: 'O2', invoice: '240000000012', state: 'todo' }] });
    const w = await T.page(['O1', 'O2'], ['O1']); await sleep(800); const d = T.D(); ok(d.status === 'paused' && (d.fieldMiss || []).join() === 'O2' && !w.__clicked.length, '칸이 없는 주문이 하나라도 있으면 아무것도 넣지 않고 멈춤 ' + JSON.stringify(d.fieldMiss)); w.close(); }
  console.log("■ '발송 요청에 없음'을 가름");
  { const T = await run('miss', { limit: 0, verify: false, items: [{ orderNo: 'O3', invoice: '240000000033', state: 'todo' }, { orderNo: 'O4', invoice: '240000000044', state: 'todo' }], shipped: [['O3', '240000000033']] });
    const w = await T.page(['O9'], ['O9']); await sleep(9500); /* 없는 주문은 3쪽까지 사람 속도(쪽 사이 2.5~4.5초)로 */ const d = T.D(); const [a, b] = d.items;
    ok(d.status === 'done' && a.state === 'done' && /이미 입력됨/.test(a.note || '') && b.state === 'missing' && /취소됐을 수 있음/.test(b.err || ''), '배송&구매확정전에 같은 송장 = 입력됨 · 어디에도 없음 = 취소 의심 ' + JSON.stringify(d.items)); w.close(); }
  ok(/const exKey = \(x\) => `\$\{x\.orderNo\}:\$\{x\.invoice\}`;/.test(src), '실행 문 열쇠 = 주문:송장(맡김 문서와 상관없이 같은 송장 두 번 막기)');
  ok(/where\('status', '==', 'running'\)\.get\(\); let stale = INVST\.v/.test(src) && /reclaimN: \(\+cur\.reclaimN \|\| 0\) \+ 1/.test(src) && /q2\.forEach\(\(d\) => claimInvoice\(d\.id\)/.test(src), "수집기: 맥박 끊긴 '하는 중' 맡김을 되돌림 + '기다림' 다시 훑기(2분마다)");
  { const h1 = src.split('// ==/UserScript==')[0]; let h0 = null; for (const d of [process.env.RN_REPO, path.join(__dirname, '../..')].filter(Boolean)) { try { h0 = cpx.execSync('git show origin/main:src/readnow-collector.src.js', { cwd: d, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('// ==/UserScript==')[0]; break; } catch (e) {} }
    ok(h0 == null ? !/invShippedCheck|INVST|verifyFail/.test(h1) : h0 === h1, '수집기 머리(==UserScript==)는 그대로' + (h0 == null ? '(저장소를 못 찾아 새 이름이 머리에 없는지만 봄 — RN_REPO로 저장소 지정)' : '(main과 같음)')); }
  console.log('■ ALPS 도우미 · 인쇄 도우미');
  { process.env.RN_ALPS_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnalps-os-')); process.env.RN_ALPS_NOREMOTE = '1'; process.env.RN_ALPS_QUIET = '1'; const A = require(ALPS); const T = A._t;
    const J = T.prnJudge; ok(/오프라인/.test(J({ off: true, st: 3 }).bad) && /용지 없음/.test(J({ st: 3, err: 4 }).bad) && /대기열에 아직 남은 인쇄 작업 2개/.test(J({ st: 3, err: 0, jobs: 2 }).bad) && J({ st: 3, err: 0, jobs: 0 }).bad === null && /찾지 못함/.test(J({ none: true }).bad), '프린터 판단: 오프라인·용지 없음·대기열 남음 = 보내지 않음 · 정상 = 보냄');
    ok(process.platform === 'win32' || (await A.printerCheck('롯데택배')).skip, '윈도우가 아니면 프린터 확인은 건너뜀(막지 않음)');
    const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); T.dayPin('20261103'); ok(T.ymdK() === '20261103', '날짜 고정: 일의 날짜로'); const j = T.jobNew(['A1'], '2026-11-03T23:50:00', '시험'); T.dayPin(null);
    ok(T.ymdK() === today && !(T.jobOpen() && T.jobOpen().id === j.id), '고정을 풀면 오늘 — 어제 묶음은 오늘 칸에 없음'); T.dayPin('20261103'); ok(T.jobOpen() && T.jobOpen().id === j.id, '자정 넘겨 이어 해도 그 일의 날짜로 열린 묶음을 찾음'); T.dayPin(null);
    const as = fs.readFileSync(ALPS, 'utf8'); ok(/RUN\.day = job\.day && \/\^\\d\{8\}\$\/\.test/.test(as) && /day: RUN\.day \}\);/.test(as) && /DAY_PIN = \(RUN && RUN\.day\) \|\| ymdNow\(\)/.test(as) && /BROWSER = null; DAY_PIN = null;/.test(as), '시작할 때 날짜를 정해 마지막 일 파일에 남김 · 이어서 하면 그 날짜 · 끝나면 풂');
    ok(/const pc = await printerCheck\(c\.printer\); if \(pc\.bad\) throw/.test(as) && as.indexOf('printerCheck(c.printer)') < as.indexOf("`${pick.length}줄 출력 — 미리보기 여는 중`"), '인쇄 보내기 직전 프린터 확인 — 이상하면 보내지 않고 멈춤');
    ok(/const VERSION = '0\.5\.[5-9]'/.test(as), 'ALPS 도우미 판 0.5.5 이상(0.5.6 = 일마다 종이 확인)'); }
  { const ps = fs.readFileSync(PRINT, 'utf8'); ok(/function selfUpdate\(\) \{ if \(alpsBusy\(\)( \|\| shipHold\(\))?\) \{[^}]*setTimeout\(selfUpdate, UPD_RETRY_MS\); return; \}/.test(ps) && /if \(alpsBusy\(\)( \|\| shipHold\(\))?\) \{ log\(`새 판 \$\{v\} 받음 — (ALPS 처리 중|\$\{shipHold\(\) \? '🚚 출고 중' : 'ALPS 처리 중'\})이라/.test(ps), '인쇄 도우미: ALPS 처리 중(·🚚 출고 중 — 11/09 shipfz1)엔 스스로 새 판으로 바꾸며 꺼지지 않음(10분 뒤 다시)');
    ok(/if \(alpsBusy\(\)( \|\| shipHold\(\))?\) \{ [^\n]*?setTimeout\(alpsUpdate, UPD_RETRY_MS\); return; \}/.test(ps) && /p === 'pcheck'/.test(ps) && /p === 'update'/.test(ps), 'ALPS 모듈 바꾸기도 10분 뒤 다시 · /alps/pcheck(프린터 상태) · /alps/update(지금 새 판)');
    const chk = cpx.spawnSync(process.execPath, ['--check', PRINT]); ok(chk.status === 0, '인쇄 도우미 문법'); }
  console.log(bad ? `❌ tONESHOTc 실패 ${bad}` : '✓ tONESHOTc 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
