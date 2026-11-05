// tINVHAS — 정범님 11/05 밤 '같은 송장 두 번 금지'(절대 규칙): 수집기가 넣기 직전 알라딘 발송 요청 화면의 그 주문 송장 칸이 이미 차 있으면 넣지 않고 건너뜀
//  칸이 비어 있으면 넣음 · 같은 송장이 차 있음 → 안 넣음 · 다른 송장이 차 있음 → 안 넣음 · 섞여 있으면 빈 칸 주문만 · items state 'has' + 실행 기록(exec_log) 'skipped' · 수집기 머리 그대로
//  가짜 알라딘 화면(jsdom) + 가짜 Firestore — tONESHOTc와 같은 틀 · 시험 자료 손님은 '손님A'
const fs = require('fs'); const path = require('path'); const os = require('os'); const { JSDOM } = require('jsdom'); const cpx = require('child_process');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const ALPS = pick(path.join(__dirname, '../../local/readnow-alps.js'), path.join(__dirname, '../local/readnow-alps.js')); const PRINT = pick(path.join(__dirname, '../../local/readnow-print.js'), path.join(__dirname, '../local/readnow-print.js'));
const EXP = pick(path.join(__dirname, '../../readnow-exec-core.js'), path.join(__dirname, '../readnow-exec-core.js')); const EXC = EXP ? fs.readFileSync(EXP, 'utf8') : '';
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
    w.__rnInvVerifyWait = 200; if (EXC) w.eval(EXC); w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  const D = () => F.store['shp_invoices/' + id]; return { F, GM, LG, fetched, page, D, id }; }
const it2 = (o, inv) => ({ orderNo: o, invoice: inv, recipient: '손님A', state: 'todo' });
const pre = (L) => L.map(([o, v]) => `<input id="deliveryNo.${o}"${v ? ` value="${v}"` : ''}>`).join('');
(async () => {
  console.log('■ 넣기 직전 알라딘 송장 칸 확인');
  { const T = await run('empty', { limit: 0, verify: false, items: [it2('O1', '240000000011')] }); const w = await T.page(['O1'], [], { html: pre([['O1', '']]) }); await sleep(2600); const d = T.D();
    ok(w.__clicked.join() === 'O1' && d.items[0].state === 'sent', '칸이 비어 있으면 넣음(입력완료 누름) ' + w.__clicked + ' ' + d.items[0].state); w.close(); }
  { const T = await run('same', { limit: 0, verify: false, items: [it2('O1', '240000000011')] }); const w = await T.page(['O1'], [], { html: pre([['O1', '240000000011']]) }); await sleep(2600); const d = T.D(); const x = d.items[0]; const ex = Object.entries(T.F.store).find(([k]) => /exec_log\/invoice__/.test(k));
    ok(!w.__clicked.length && x.state === 'has' && /이미 송장 있음 — 넣지 않음/.test(x.err) && /같은 송장/.test(x.err) && x.hasInv === '240000000011', '같은 송장이 칸에 있음 → 넣지 않고 건너뜀 ' + x.err);
    ok(ex && ex[1].status === 'skipped' && ex[1].result && ex[1].result.same === true, '실행 기록(exec_log)에 skipped ' + JSON.stringify(ex && ex[1]));
    ok((d.log || []).some((l) => /이미 송장 있음/.test(l.m) && l.lv === 'warn') && d.status === 'done' && /이미 송장 있음\(넣지 않음\) 1/.test(((d.log || []).slice(-1)[0] || {}).m || ''), '단계 줄에 남김 · 끝 줄에 수 ' + (((d.log || []).slice(-1)[0] || {}).m || '')); w.close(); }
  { const T = await run('diff', { limit: 0, verify: false, items: [it2('O1', '240000000011')] }); const w = await T.page(['O1'], [], { html: pre([['O1', '240000009999']]) }); await sleep(2600); const x = T.D().items[0];
    ok(!w.__clicked.length && x.state === 'has' && /다른 송장/.test(x.err) && /240000009999/.test(x.err), '다른 송장이 칸에 있음 → 넣지 않고 건너뜀 ' + x.err); w.close(); }
  { const T = await run('mix', { limit: 0, verify: false, items: [it2('O1', '240000000011'), it2('O2', '240000000012')] }); const w = await T.page(['O1', 'O2'], [], { html: pre([['O1', '240000009999'], ['O2', '']]) }); await sleep(2600); const d = T.D();
    ok(w.__clicked.join() === 'O2' && d.items[0].state === 'has' && d.items[1].state === 'sent', '섞여 있으면 빈 칸 주문(O2)만 넣음 ' + w.__clicked + ' ' + d.items.map((y) => y.state)); w.close(); }
  const hd = (s) => (s.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/) || [''])[0]; let base = ''; try { base = cpx.execSync('git show origin/main:src/readnow-collector.src.js', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64e6 }).toString(); } catch (e) {}
  if (base) ok(hd(base) === hd(src), '수집기 머리(==UserScript==) 그대로');
  console.log(bad ? `❌ tINVHAS 실패 ${bad}` : '✓ tINVHAS 통과'); process.exit(bad ? 1 : 0);
})();
