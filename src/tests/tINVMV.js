// tINVMV — 정범님 11/06 13:51 실제: 첫 건이 배송&구매확정전으로 옮겨졌는데 그 화면이 주문 칸에 송장번호를 싣지 않아 '송장번호가 안 보임'으로 멈춤
//  수집기 invShippedCheck: 주문이 배송&구매확정전에 있고 ① 이 송장이 다른 주문 칸에 없고 ② 이 주문 칸에 우리 다른 송장이 없고 ③ 이 주문 칸에 다른 송장(배송 조회 링크·택배사 뒤)이 없으면 = 맞음('옮겨짐')
//  가) 송장 글자 있음 → 맞음 · 나) 송장 없음 → 맞음(옮겨짐) · 다) 이 송장이 다른 주문 칸에 → 실패 · 라) 이 주문 칸에 우리 다른 주문 송장 → 실패 · 마) 여러 건 한 번에 검증도 '틀림' 0 · 바) 실행기 전체 흐름(첫 건 검증 맞음 → 나머지 저절로)
//  가짜 알라딘 화면(jsdom) — tONESHOTc와 같은 틀 · 시험 자료 손님은 '손님A' · 숫자는 가짜
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom'); const cpx = require('child_process');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); return s.slice(i, j + b.length); };
const CHK_SRC = cut(src, 'async function invShippedCheck(L) {', "return { ok: true, pages, res }; }");
const STEP_SRC = cut(src, '(function rnStepLog() {', '\n})();');
const INV_SRC = cut(src, '(async function rnInvoiceRunner() {', "if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }\n})();");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* 배송&구매확정전 화면(가짜) — rows: [주문번호, 칸에 보일 송장(없으면 ''), 링크꼴?] · 실제 13:51처럼 칸에는 긴 숫자(주문 일련·날짜)만 */
const page = (rows) => `<html><body><table>${rows.map(([o, inv, href], i) => `<tr id="oList${i + 1}"><td><a onclick="viewOrderDetail('${o}')">${o}</a></td><td>3002026110514 2026021018 1 010-0000-0000 ${inv ? (href ? `<a href="javascript:goTracking('롯데택배','${inv}')">배송조회</a>` : '롯데택배 ' + inv) : ''}</td></tr><tr id="oList${i + 1}b"><td>손님A</td></tr>`).join('')}</table><a onclick="Page_Set(1)">1</a></body></html>`;
function checker(html) { const dom = new JSDOM('<body></body>', { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__html = html; w.fetch = async () => ({ ok: true, text: async () => w.__html });
  w.eval('var INVSP = { fast: true };\n' + CHK_SRC + '\nwindow.__chk = invShippedCheck;'); return w; }
const chk = async (rows, L) => { const w = checker(page(rows)); const r = await w.__chk(L); w.close(); return r; };
function fakeFb() { const store = {}; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { id = id || 'auto' + Math.random().toString(36).slice(2, 8); const p = col + '/' + id; return { id, path: p, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); }, update: async (v) => { store[p] = merge(store[p], v); } }; };
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ get: async () => ({ docs: [] }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
  const user = { email: 'test@x' }; const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; } };
  const app = { firestore: () => db, auth: () => auth }; const fb = { apps: [app], app: () => app, initializeApp: () => app, auth: () => auth, firestore: Object.assign(() => db, { FieldValue: FV }) };
  return { fb, db, store }; }
async function run(o) { const F = fakeFb(); const GM = new Map(); const id = 'alps_t'; const fetched = [];
  F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', limit: 1, verify: true, autoCont: true, from: 'oneshot', log: [], items: o.items };
  GM.set('rn-inv-active', { id, at: Date.now() });
  const open = async (orders) => { const dom = new JSDOM(`<body>${orders.map((x) => `<input id="deliveryNo.${x}">`).join('')}</body>`, { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__clicked = [];
    w.firebase = F.fb; w.__rnLog = () => {}; w.__rnPcName = { get: () => 'PC-T' }; w.sessionStorage.setItem('rn-inv-tab', id);
    w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {}; w.deliveryNoComplete = (x) => w.__clicked.push(x);
    w.fetch = async (u) => { fetched.push(String(u)); return { ok: true, text: async () => page(o.shipped) }; };
    w.ReadnowShipping = { matchInvoices: () => ({}), parseDeliveryPage: () => ({ orders: orders.map((x) => ({ orderNo: x })), tabCounts: { 발송요청: orders.length } }) };
    w.__rnInvVerifyWait = 200; w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  return { F, open, D: () => F.store['shp_invoices/' + id], fetched }; }
const A = '240000000011', B = '240000000012', C = '240000000013';
(async () => {
  console.log('■ 첫 건 검증 — 배송&구매확정전 화면이 송장번호를 안 보여 줄 때');
  { const r = await chk([['O1', A]], [{ orderNo: 'O1', invoice: A }]); const x = r.res.O1; ok(x.ok && /주문 칸에 송장번호/.test(x.how), '가) 주문 칸에 송장 글자 있음 → 맞음 ' + JSON.stringify(x)); }
  { const r = await chk([['O1', A, 1]], [{ orderNo: 'O1', invoice: A }]); const x = r.res.O1; ok(x.ok && /주문 칸에 송장번호/.test(x.how), '가2) 배송 조회 링크 안에만 있어도 맞음 ' + JSON.stringify(x)); }
  { const r = await chk([['O1', ''], ['O9', '']], [{ orderNo: 'O1', invoice: A }]); const x = r.res.O1; ok(x.ok && /옮겨짐/.test(x.how), "나) 주문 칸에 송장 없음 · 다른 칸에도 없음 → 맞음(how '옮겨짐') " + JSON.stringify(x)); }
  { const r = await chk([['O1', ''], ['O9', A]], [{ orderNo: 'O1', invoice: A }]); const x = r.res.O1; ok(!x.ok && x.seen && /다른 주문 칸에 보임/.test(x.why), '다) 이 송장이 다른 주문 칸에 있음 → 실패 ' + JSON.stringify(x)); }
  { const w = checker(page([['O1', ''], ['O9', '']]).replace('<tr id="oList2b"><td>손님A</td></tr>', `<tr id="oList2b"><td>송장 ${A}</td></tr>`)); const r = await w.__chk([{ orderNo: 'O1', invoice: A }]); w.close(); const x = r.res.O1; ok(!x.ok && /다른 주문 칸에 보임/.test(x.why), "다2) 다른 주문의 'b' 줄에 이 송장 → 실패 " + JSON.stringify(x)); }
  { const r = await chk([['O1', B], ['O2', '']], [{ orderNo: 'O1', invoice: A }, { orderNo: 'O2', invoice: B }]); const x = r.res.O1; ok(!x.ok && /다른 주문의 송장번호\(240000000012\)/.test(x.why), '라) 이 주문 칸에 우리 다른 주문 송장 있음 → 실패 ' + JSON.stringify(x)); }
  { const r = await chk([['O1', '999999999999', 1]], [{ orderNo: 'O1', invoice: A }]); const x = r.res.O1; ok(!x.ok && /송장번호가 다름/.test(x.why) && /999999999999/.test(x.why), '라2) 이 주문 칸 배송 조회에 모르는 송장 → 실패(송장번호가 다름) ' + JSON.stringify(x)); }
  { const L = [{ orderNo: 'O1', invoice: A }, { orderNo: 'O2', invoice: B }, { orderNo: 'O3', invoice: C }]; const r = await chk([['O1', ''], ['O2', ''], ['O3', '']], L); const wrong = L.filter((x) => r.res[x.orderNo] && r.res[x.orderNo].seen && !r.res[x.orderNo].ok), okN = L.filter((x) => r.res[x.orderNo] && r.res[x.orderNo].ok).length;
    ok(r.ok && wrong.length === 0 && okN === 3, `마) 여러 건 한 번에 첫 회 검증 — 세 칸 모두 송장 없음 → 'wrong' ${wrong.length} · 맞음 ${okN}/3`); }
  { const L = [{ orderNo: 'O1', invoice: A }, { orderNo: 'O2', invoice: B }]; const r = await chk([['O1', ''], ['O2', A]], L); ok(!r.res.O1.ok && !r.res.O2.ok, '마2) 여러 건 중 송장이 바뀌어 들어감(O2 칸에 O1 송장) → 둘 다 실패 ' + JSON.stringify(r.res)); }
  console.log('■ 실행기 전체 흐름 — 첫 건이 옮겨졌고 송장은 안 보임 → 검증 맞음 → 나머지 저절로');
  { const T = await run({ items: [{ orderNo: 'O1', invoice: A, recipient: '손님A', state: 'todo' }, { orderNo: 'O2', invoice: B, recipient: '손님A', state: 'todo' }], shipped: [['O1', '']] });
    const w1 = await T.open(['O1', 'O2']); await sleep(2600); ok(w1.__clicked.join() === 'O1', '첫 화면: 첫 건(O1)만 넣음'); w1.close();
    const w2 = await T.open(['O2']); await sleep(3400); const d = T.D();
    ok(d.verified && d.verified.ok && !d.verifyFail && /옮겨짐/.test(d.verified.how || ''), '첫 건 자동 검증 맞음(옮겨짐) ' + JSON.stringify(d.verified || {}));
    ok(d.limit === 0 && w2.__clicked.join() === 'O2', '사람 없이 나머지(O2)를 이어서 넣음 ' + w2.__clicked); w2.close(); }
  const hd = (s) => (s.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/) || [''])[0]; let base = ''; try { base = cpx.execSync('git show origin/main:src/readnow-collector.src.js', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64e6 }).toString(); } catch (e) {}
  if (base) { const strip = (h) => h.replace(/\/\/ @version.*\n/, ''); ok(strip(hd(base)) === strip(hd(src)), '수집기 머리(==UserScript==) 그대로(판 번호 줄 빼고)'); }
  console.log(bad ? `❌ tINVMV 실패 ${bad}` : '✓ tINVMV 통과'); process.exit(bad ? 1 : 0);
})();
