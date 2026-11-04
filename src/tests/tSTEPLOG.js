// tSTEPLOG — 정범님 11/04 '송장 입력 맡김 후 수집기 기록에 자세히 진행 처리를 실시간으로 세세히 · 출고와 관련된 모든 사항을 실시간으로 · 문제가 생겼을 때 빨리 파악'
//  ① 수집기 __rnStep(단계 한 줄 → 맡김 문서 log·stepNow · 기록 창) — 묶어 쓰기(한 줄마다 쓰지 않음)·남길 줄 수·flush
//  ② 송장 입력기(rnInvoiceRunner)를 가짜 알라딘 발송 요청 화면(jsdom)에서 세 번 열어: 맡김 받음 → 화면 엶 → 주문 찾음 → 송장 칸 넣음 → 입력완료 → 알라딘 안내 글 → 다시 읽어 확인 → 다음 주문(칸 없음 = 실패) → 끝
//  ③ 클라우드 stepOf(같은 모양 · 묶어 쓰기) · 진단 shplog · 예스24 단계 잇기 · ALPS 기록 200줄 — 글자 검사
//  손님 이름이 줄에 들어가지 않는지(주문번호·송장만)
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const CLOUD = pick(path.join(__dirname, '../../cloud/index.js'), path.join(__dirname, '../cloud/index.js')); const cloud = fs.readFileSync(CLOUD, 'utf8');
const ALPS = pick(path.join(__dirname, '../../local/readnow-alps.js'), path.join(__dirname, '../local/readnow-alps.js')); const alps = ALPS ? fs.readFileSync(ALPS, 'utf8') : '';
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); return s.slice(i, j + b.length); };
const STEP_SRC = cut(src, '(function rnStepLog() {', '\n})();');
const INV_SRC = cut(src, '(async function rnInvoiceRunner() {', "if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }\n})();");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 가짜 Firestore(compat 모양) — 문서 저장·merge·arrayUnion·트랜잭션 · 쓰기 횟수 셈 */
function fakeFb() { const store = {}; const W = []; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { id = id || 'auto' + Math.random().toString(36).slice(2, 8); const p = col + '/' + id; return { id, path: p, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { W.push({ p, v }); store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); }, update: async (v) => { W.push({ p, v }); store[p] = merge(store[p], v); } }; };
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ get: async () => ({ docs: [] }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
  const user = { email: 'test@x' }; const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; } };
  const app = { firestore: () => db, auth: () => auth }; const fb = { apps: [app], app: () => app, initializeApp: () => app, auth: () => auth, firestore: Object.assign(() => db, { FieldValue: FV }) };
  return { fb, db, store, W }; }

(async () => {
  /* ① __rnStep 묶어 쓰기 */
  { const F = fakeFb(); const dom = new JSDOM('<body></body>', { url: 'https://www.aladin.co.kr/scm/x.aspx', runScripts: 'outside-only' }); const w = dom.window; const LG = []; w.firebase = F.fb; w.__rnLog = (m, l, x) => LG.push([m, l, x]); w.__rnPcName = { get: () => 'PC-T' };
    w.eval(STEP_SRC); const ref = F.db.collection('shp_cmds').doc('c1'); const st = w.__rnStep(ref, [{ at: 'x', lv: 'info', m: '앞 줄' }], '출고');
    for (let i = 0; i < 5; i++) st('info', '줄 ' + i, { o: '0012345', inv: '123456789012' }); st('err', '실패 줄', { o: '0012345', why: '까닭' });
    ok(F.W.length === 0, '한 줄마다 쓰지 않음(묶음 전 쓰기 0번)'); await sleep(1700);
    const d = F.store['shp_cmds/c1'] || {}; ok(F.W.length === 1 && (d.log || []).length === 7 && d.log[0].m === '앞 줄', `1.5초 뒤 한 번에 씀(쓰기 ${F.W.length}번 · 줄 ${(d.log || []).length} · 앞 줄 이어 받음)`);
    ok(d.stepNow && d.stepNow.lv === 'err' && d.stepNow.m === '실패 줄' && d.log[6].o === '0012345' && d.log[6].why === '까닭' && d.log[6].by === 'PC-T', '지금 단계(stepNow) = 마지막 줄 · 주문번호·까닭·PC');
    ok(LG.length === 6 && LG[5][0] === '출고' && LG[5][1] === 'err' && /주문 0012345/.test(LG[5][2]), '수집기 기록 창(__rnLog)에도 한 줄씩 · 문제 줄은 err');
    for (let i = 0; i < 230; i++) st('info', 'n' + i); await st.flush(); ok((F.store['shp_cmds/c1'].log || []).length === 100, '문서마다 최근 100줄만(기본 · 설정으로 바꿈)'); w.close(); }

  /* ② 송장 입력기 — 가짜 발송 요청 화면에서 세 번 엶 */
  { const F = fakeFb(); const GM = new Map(); const id = 'inv1'; const LG = [];
    F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', limit: 0, from: 'webapp', log: [{ at: new Date().toISOString(), lv: 'info', m: '맡김 만듦 — 웹앱에서 2건', by: '웹앱' }], items: [{ orderNo: 'O1', invoice: '111122223333', recipient: '손님A', state: 'todo' }, { orderNo: 'O2', invoice: '444455556666', recipient: '손님B', state: 'todo' }] };
    GM.set('rn-inv-active', { id, at: Date.now() });
    const page = async (orders, inputs, alertMsg) => { const dom = new JSDOM(`<body>${inputs.map((o) => `<input id="deliveryNo.${o}">`).join('')}</body>`, { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__clicked = [];
      w.firebase = F.fb; w.__rnLog = (m, l, x) => LG.push([m, l, x]); w.__rnPcName = { get: () => 'PC-T' }; w.sessionStorage.setItem('rn-inv-tab', id); if (alertMsg) w.sessionStorage.setItem('rnInvAlert', alertMsg);
      w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {}; w.deliveryNoComplete = (o) => w.__clicked.push(o);
      w.ReadnowShipping = { matchInvoices: () => ({}), parseDeliveryPage: () => ({ orders: orders.map((o) => ({ orderNo: o })), tabCounts: { 발송요청: orders.length } }) };
      w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
    const w1 = await page(['O1', 'O2'], ['O1', 'O2']); await sleep(2600); const L1 = (F.store['shp_invoices/' + id].log || []).map((x) => x.m);
    ok(w1.__clicked.join() === 'O1' && w1.document.getElementById('deliveryNo.O1').value === '111122223333', '첫 화면: 첫 주문에 송장을 넣고 입력완료를 누름');
    ok(L1[0] === '맡김 만듦 — 웹앱에서 2건' && L1.some((m) => /발송 요청 화면 엶 — 이 화면 주문 2건/.test(m)) && L1.some((m) => /다음 주문 1 \/ 2/.test(m)) && L1.includes('송장 칸에 넣음') && L1.some((m) => /'입력완료' 누름/.test(m)), '단계 줄: 웹앱 첫 줄 이어 받음 → 화면 엶 → 다음 주문 → 송장 칸 넣음 → 입력완료 누름(누르기 전에 써 둠) ' + JSON.stringify(L1).slice(0, 300));
    ok(/입력완료/.test((F.store['shp_invoices/' + id].stepNow || {}).m || ''), '지금 단계 = 입력완료 기다림'); w1.close();
    const w2 = await page(['O2'], [], '처리되었습니다'); await sleep(3200); const D2 = F.store['shp_invoices/' + id]; const L2 = D2.log;
    ok(L2.some((x) => /알라딘 안내 글: 처리되었습니다/.test(x.m) && x.lv === 'info') && L2.some((x) => /다시 읽어 확인 — 입력됨/.test(x.m) && x.o === 'O1' && x.inv === '111122223333' && x.res === '입력됨'), '다시 연 화면: 알라딘 안내 글 · 다시 읽어 확인 — 입력됨(주문번호·송장·결과)');
    ok(L2.some((x) => /송장번호 칸을 못 찾음/.test(x.m) && x.lv === 'err' && x.o === 'O2') && D2.items[1].state === 'fail', '다음 주문: 송장 칸이 없으면 빨간 줄(err) + 실패');
    ok(D2.status === 'done' && /송장 입력 끝 — 입력 1 · 실패 1/.test(D2.stepNow.m) && D2.stepNow.lv === 'warn', '끝 줄: 입력 1 · 실패 1 (실패가 있으면 경고)');
    const all = JSON.stringify(D2.log) + JSON.stringify(LG); ok(!/손님A|손님B/.test(all), '줄·기록 창에 받는 분 이름이 없음(주문번호·송장만)');
    ok(LG.filter((x) => x[0] === '송장 입력').length >= 8, `수집기 기록 창에도 단계 줄 ${LG.filter((x) => x[0] === '송장 입력').length}개`);
    const nW = F.W.filter((x) => x.p === 'shp_invoices/' + id && x.v.log).length; ok(nW <= 6, `log 쓰기는 묶어서 ${nW}번(줄 ${L2.length}개)`); w2.close();
    const w3 = await page(['O9'], ['O9'], '송장번호가 올바르지 않습니다'); await sleep(300); ok(!GM.has('rn-inv-active'), '끝난 뒤엔 다시 넣지 않음'); w3.close(); }

  /* ③ 클라우드 stepOf — 같은 모양 · 묶어 쓰기 */
  { const H = cut(cloud, 'const STEP_CF = {', '\n  f.flush = flush; return f; }'); const store = {}; const W = []; const FV = { serverTimestamp: () => 'ts' }; const C = () => ({ doc: () => ({ get: async () => ({ data: () => ({}) }) }) }); const nowIso = () => new Date().toISOString();
    const mk = new Function('C', 'FV', 'nowIso', H + '\nreturn stepOf;'); const stepOf = mk(C, FV, nowIso); const ref = { path: 'shp_cmds/k1', set: async (v) => { W.push(v); store.k1 = v; } };
    const st = stepOf(ref, null); st('info', '알라딘에 발송준비시작 보냄', { o: '0011', big: 1 }); st('err', '확인 — 아직 주문확인요청에 그대로(실패)', { o: '0011', res: '실패' }); ok(W.length === 0, '클라우드도 한 줄마다 쓰지 않음'); await st.flush();
    ok(W.length === 1 && store.k1.log.length === 2 && store.k1.log[1].by === 'cloud' && store.k1.stepNow.lv === 'err', '클라우드 flush: log 2줄 · by cloud · 지금 단계 err'); }
  ok(/if \(q\.shplog\)/.test(cloud) && /shplog=1 최근 출고 맡김들/.test(cloud) && !/recipient: x\.recipient/.test(cut(cloud, 'if (q.shplog)', "out.shplog = { err: e.message }; } }")), '진단 shplog — 출고 맡김 log·stepNow·items(받는 분 이름 빼고)');
  ok(/st\('info', `맡김 받음 — 클라우드가 발송준비시작 시작/.test(cloud) && /시장 다시 읽는 중 — 읽음/.test(cloud) && /stepNow: peStepNow\(/.test(cloud), '클라우드: 발송준비시작·🔄 시장 다시 읽기·상품 수정(판매중지) 단계 줄');
  ok(/STEP_T = \{ startDelivery: '발송준비시작', read: '발송 요청 다시 읽기'/.test(src) && /stepNow: peStepNow\(t0\[t0\.length - 1\]\)/.test(src), '수집기: 발송준비시작·다시 읽기·판매중지 등 맡긴 일도 단계 줄');
  ok(/GM_setValue\('rn-y24jstep'/.test(src) && /GM_addValueChangeListener\('rn-y24jstep'/.test(src) && /stepNow: \{ at: S0\.at/.test(src), '🟦 예스24 자동 처리: 단계마다 rn-y24jstep → crm_y24_orders.auto[kind].stepNow·steps');
  { const a = src.indexOf('/* ◆y24Act 시작'), b = src.indexOf('/* ◆y24Act 끝 */'); ok(a > 0 && !/jStep\(/.test(src.slice(a, b)), '◆y24Act 몸(누르는 판단)은 그대로 — 단계 줄은 바깥(jobRun)에서만'); }
  ok(!ALPS || /RUN\.log\.length > 200\) RUN\.log\.splice\(0, RUN\.log\.length - 200\); \} \/\* \(정범님 11\/04\)/.test(alps), 'ALPS 도우미: 단계 줄도 최근 200줄(예전 60)');
  ok(/log: pick\(\(R\.log \|\| \[\]\)\.slice\(-200\)/.test(cloud), '클라우드: 다른 기기에서 시작한 ALPS도 세부 진행 200줄을 넘김');
  { const H = src.split('// ==/UserScript==')[0]; ok(!/__rnStep|rnStepLog/.test(H), '수집기 머리(==UserScript==)는 그대로'); }
  console.log(bad ? `❌ tSTEPLOG 실패 ${bad}` : '✓ tSTEPLOG 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
