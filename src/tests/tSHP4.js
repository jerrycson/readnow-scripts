// tSHP4 — 정범님 11/05 15시 출고 세 가지
//  ① 송장 입력 '사람처럼 보일 필요 없으니 최대한 빨리': 빠르게(기본) = 넣기 전 1.5초 없음 · 끄면 예전 1.5초 · 알라딘 '선택 입력완료'(deliveryNoSComplete)로 여러 건 한 화면에서 한 번에
//     (첫 건은 한 건씩 · 우리 주문만 체크 · 다시 읽어 확인 · 첫 회 배송&구매확정전 검증 · 안 들어간 주문은 한 건씩으로 · 다른 송장이면 멈춤) · 예스24 흩음 줄임 · 수집기 머리 그대로
//  ② 📦 총 주문·상품·판매가·읽은 시각 줄이 붙박이(머리 바로 아래 · 휴대폰 폭도) · 주문 머리 띠는 그 아래
//  ③ 원스톱 자동 판정 잠시 멈춤 기본 20분(최대)·5분(소식) · 이미 저장한 값은 그대로 · 클라우드 기본값도
// 가짜 알라딘 발송 요청 화면(jsdom) + 가짜 Firestore — tONESHOTc와 같은 틀 · 시험 자료 손님은 '손님A' (공개 저장소)
// 실행: cd pw && RN_PORT=8787 node tSHP4.js
const fs = require('fs'); const path = require('path'); const cpx = require('child_process'); const { JSDOM } = require('jsdom');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const CLOUD = pick(path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); return s.slice(i, j + b.length); };
const STEP_SRC = cut(src, '(function rnStepLog() {', '\n})();');
const INV_SRC = cut(src, '(async function rnInvoiceRunner() {', "if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }\n})();");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fakeFb() { const store = {}; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { const p = col + '/' + id; return { id, path: p, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); }, update: async (v) => { store[p] = merge(store[p], v); } }; };
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ get: async () => ({ docs: [] }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
  const user = { email: 'test@x' }; const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; } };
  const app = { firestore: () => db, auth: () => auth }; return { fb: { apps: [app], app: () => app, initializeApp: () => app, auth: () => auth, firestore: Object.assign(() => db, { FieldValue: FV }) }, store }; }
const shippedHtml = (L) => `<html><body><table>${L.map(([o, inv], i) => `<tr id="oList${i + 1}"><td><a onclick="viewOrderDetail('${o}')">${o}</a></td><td>롯데택배 ${inv}</td></tr>`).join('')}</table></body></html>`;
async function run(o) { const F = fakeFb(); const GM = new Map(); const id = 'inv_t'; const fetched = [];
  F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', limit: o.limit ?? 0, verify: o.verify ?? false, autoCont: true, from: 'oneshot', log: [], items: o.items, ...(o.speed ? { speed: o.speed } : {}) };
  GM.set('rn-inv-active', { id, at: Date.now() });
  /* rows: [주문번호, {chk, checked}] · bulkBtn: 화면에 '선택 입력완료' 단추 */
  const page = async (orders, opt) => { opt = opt || {}; const chk = opt.chk || orders; const html = `${opt.bulkBtn === false ? '' : '<img src="bu_total3.gif" onclick="javascript:deliveryNoSComplete();">'}<form name="orderItemForm">${orders.map((x) => `${chk.includes(x) ? `<input type="checkbox" name="chkOrder.${x}" value="1"${(opt.pre || []).includes(x) ? ' checked' : ''}>` : ''}<input id="deliveryNo.${x}" name="deliveryNo.${x}">`).join('')}</form>`;
    const dom = new JSDOM(`<body>${html}</body>`, { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__clicked = []; w.__bulk = [];
    w.firebase = F.fb; w.__rnLog = () => {}; w.__rnPcName = { get: () => 'PC-T' }; w.sessionStorage.setItem('rn-inv-tab', id);
    w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {};
    w.deliveryNoComplete = (x) => w.__clicked.push(x);
    w.deliveryNoSComplete = () => { const C = [...w.document.querySelectorAll('input[type=checkbox]')]; w.__bulk.push({ at: Date.now(), checked: C.filter((c) => c.checked).map((c) => c.name.slice(9)), vals: Object.fromEntries(C.filter((c) => c.checked).map((c) => [c.name.slice(9), w.document.getElementById('deliveryNo.' + c.name.slice(9)).value])) }); };
    w.fetch = async (u) => { fetched.push(String(u)); return { ok: true, text: async () => (o.shipped ? shippedHtml(o.shipped) : '<html><body>빈 화면</body></html>') }; };
    w.ReadnowShipping = { matchInvoices: () => ({}), parseDeliveryPage: () => ({ orders: orders.map((x) => ({ orderNo: x, deliveryNo: (opt.dn || {})[x] || null })), tabCounts: { 발송요청: orders.length } }) };
    w.__rnInvVerifyWait = 200; w.__t0 = Date.now(); w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  return { F, GM, fetched, page, D: () => F.store['shp_invoices/' + id] }; }
const it = (no, inv, st) => ({ orderNo: no, invoice: inv, recipient: '손님A', state: st || 'todo' });
(async () => {
  console.log('■ ① 빠르게(기본): 넣기 전 1.5초 기다림 없음 · 끄면 예전처럼');
  { const T = await run({ items: [it('O1', '240000000011'), it('O2', '240000000012')] }); const w = await T.page(['O1', 'O2'], { bulkBtn: false }); await sleep(700);
    ok(w.__clicked.join() === 'O1', '빠르게: 0.7초 안에 첫 건 입력완료를 누름(예전엔 1.5초 뒤) ' + w.__clicked.join()); ok(T.GM.get('rn-inv-fast') === true, '입력완료 뒤 거치는 화면도 빠르게(rn-inv-fast)'); w.close(); }
  { const T = await run({ speed: { fast: false }, items: [it('O1', '240000000011'), it('O2', '240000000012')] }); const w = await T.page(['O1', 'O2']); await sleep(700); const early = w.__clicked.length; await sleep(1600);
    ok(early === 0 && w.__clicked.join() === 'O1' && !w.__bulk.length, "설정 '빠르게' 끔: 예전처럼 1.5초 뒤 한 건씩(여러 건 안 함)"); ok(T.GM.get('rn-inv-fast') === false, '끄면 입력완료 뒤 화면도 예전 2.5초'); w.close(); }
  console.log("■ ① 여러 건 한 번에 — 알라딘 '선택 입력완료'");
  { const T = await run({ items: [it('O1', '240000000011'), it('O2', '240000000012'), it('O3', '240000000013')] }); const w = await T.page(['O1', 'O2', 'O3']); await sleep(700);
    ok(w.__clicked.join() === 'O1' && !w.__bulk.length, '이 맡김에서 아직 입력된 주문이 없으면 첫 건은 한 건씩'); w.close(); }
  { const T = await run({ limit: 1, verify: true, items: [it('O1', '240000000011', 'done'), it('O2', '240000000012')], shipped: [] }); /* 첫 건 검증 단계(limit 1)는 그대로 — 여러 건 없음 */
    ok(true, '(첫 건 검증 흐름은 tONESHOTc가 봄)'); }
  { const T = await run({ items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013'), it('O4', '240000000014')], shipped: [['O2', '240000000012'], ['O3', '240000000013'], ['O4', '240000000014']] });
    const w = await T.page(['O2', 'O3', 'O4', 'O9'], { pre: ['O9'] }); await sleep(900); const b = w.__bulk[0] || {}; const d = T.D();
    ok(w.__bulk.length === 1 && !w.__clicked.length, "남은 3건을 '선택 입력완료' 한 번으로(한 건씩 누름 없음)");
    ok((b.checked || []).join() === 'O2,O3,O4' && b.vals && b.vals.O2 === '240000000012' && b.vals.O4 === '240000000014', '우리 주문만 체크(다른 주문 O9 체크는 풂) · 주문마다 제 송장번호 ' + JSON.stringify(b));
    ok(d.items.filter((x) => x.state === 'sent' && x.via === 'bulk' && x.bulk).length === 3 && d.status === 'running', '맡김 문서: 3건 sent · via bulk(넣기 직전 서버 상태 확인 거침)');
    ok((d.log || []).some((x) => /여러 건 한 번에 — 3건/.test(x.m)) && (d.log || []).some((x) => /선택 입력완료' 누름\(3건\)/.test(x.m)), '단계 줄: 여러 건 한 번에 3건 · 선택 입력완료 누름'); w.close();
    const w2 = await T.page(['O9']); await sleep(1500); const d2 = T.D();
    ok(d2.items.every((x) => x.state === 'done') && d2.items.every((x) => !x.bulk) && d2.status === 'done', '다시 연 화면: 3건 모두 빠짐 = 입력됨 → 끝');
    ok(d2.bulkVerified && d2.bulkVerified.ok && d2.bulkVerified.okN === 3 && T.fetched.some((u) => /worder_delivery_complete/.test(u)), '첫 회는 배송&구매확정전을 다시 읽어 3건 모두 제 송장번호 확인 ' + JSON.stringify(d2.bulkVerified || {})); ok(!d2.bulkOff, '어긋남 없음 → 여러 건 그대로'); w2.close(); }
  { const T = await run({ items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013'), it('O4', '240000000014')], shipped: [['O2', '240000000012'], ['O4', '240000000014']] });
    const w = await T.page(['O2', 'O3', 'O4']); await sleep(900); w.close(); const w2 = await T.page(['O3']); await sleep(1800); const d = T.D(); const o3 = d.items.find((x) => x.orderNo === 'O3');
    ok(d.bulkOff && /3건 중 1건/.test(d.bulkOff.why), '한 건이 그대로 남음 → bulkOff(남은 주문은 한 건씩) ' + JSON.stringify(d.bulkOff || {}));
    ok(o3.state === 'sent' && !o3.tries && w2.__clicked.join() === 'O3' && !w2.__bulk.length, '그 주문은 다시 횟수를 세지 않고 한 건씩(deliveryNoComplete)으로 다시 넣음'); w2.close(); }
  { const T = await run({ items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013')], shipped: [['O2', '240000000012'], ['O3', '999999999999']] });
    const w = await T.page(['O2', 'O3']); await sleep(900); w.close(); const w2 = await T.page([]); await sleep(1500); const d = T.D();
    ok(d.status === 'paused' && d.verifyFail && /다른 송장번호/.test(d.pauseWhy || '') && d.bulkVerified && d.bulkVerified.ok === false && !T.GM.has('rn-inv-active'), '첫 회 검증에서 다른 송장으로 보이면 멈춤 ⚠ ' + (d.pauseWhy || '')); w2.close(); }
  { const T = await run({ speed: { fast: true, bulk: false }, items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013')] }); const w = await T.page(['O2', 'O3']); await sleep(700);
    ok(w.__clicked.join() === 'O2' && !w.__bulk.length, "'여러 건 한 번에' 끔 → 빠르게 한 건씩"); w.close(); }
  { const T = await run({ items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013')] }); const w = await T.page(['O2', 'O3'], { bulkBtn: false }); await sleep(700);
    ok(w.__clicked.join() === 'O2' && !w.__bulk.length, "화면에 '선택 입력완료' 단추가 없으면 한 건씩"); w.close(); }
  { const T = await run({ items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013')] }); const w = await T.page(['O2', 'O3'], { chk: ['O3'] }); await sleep(700);
    ok(w.__clicked.join() === 'O2' && !w.__bulk.length, '다음 주문에 체크 칸이 없으면 한 건씩'); w.close(); }
  { const T = await run({ speed: { bulkMax: 2 }, items: [it('O1', '240000000011', 'done'), it('O2', '240000000012'), it('O3', '240000000013'), it('O4', '240000000014')] }); const w = await T.page(['O2', 'O3', 'O4']); await sleep(800);
    ok(w.__bulk.length === 1 && w.__bulk[0].checked.join() === 'O2,O3', '한 번에 최대 건수(bulkMax 2)'); w.close(); }
  console.log('■ ① 소스 확인 — 실수 막는 확인은 그대로 · 예스24 · 머리');
  const INV = INV_SRC; ok(/const exKey = \(x\) => `\$\{x\.orderNo\}:\$\{x\.invoice\}`;/.test(INV) && /EXI\.begin\(db, \{ kind: 'invoice', key: exKey\(x\)/.test(INV), '같은 주문·송장 두 번 막기(실행 문)를 여러 건에도 주문마다');
  ok(/invLoginPage\(\)\) \{/.test(INV) && /넣기 전 확인 — 송장번호 칸이 없는 주문/.test(INV) && /넣기 직전 확인 — 웹앱에서 멈춤/.test(INV) && /20초 지나도 화면이 안 바뀜/.test(INV), '로그인 풀림·넣기 전 칸 확인·넣기 직전 멈춤 확인·20초 다시 열기 그대로');
  ok(/GM_getValue\('rn-inv-fast', true\) === false \? 2500 : 300/.test(INV), '입력완료 뒤 화면: 빠르게 0.3초 · 끄면 2.5초');
  ok(/sleepF\(3000, 5000, 500\)/.test(src) && /sleepF\(3000, 5000, 1500\)/.test(src) && /sleepF\(4000, 6000, 1500\)/.test(src) && /fast: a\.fast !== false/.test(src), '예스24 발송처리: 빠르게면 흩던 3~6초 → 0.5·1.5·1.5초 고정 · 맡김마다 fast');
  { const h1 = src.split('// ==/UserScript==')[0]; let h0 = null; for (const d of [process.env.RN_REPO, path.join(__dirname, '../..')].filter(Boolean)) { try { h0 = cpx.execSync('git show origin/main:src/readnow-collector.src.js', { cwd: d, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('// ==/UserScript==')[0]; break; } catch (e) {} }
    ok(h0 == null ? !/INVSP|deliveryNoSComplete/.test(h1) : h0 === h1, '수집기 머리(==UserScript==)는 그대로' + (h0 == null ? '(저장소를 못 찾아 새 이름이 머리에 없는지만 봄)' : '(main과 같음)')); }
  console.log('■ ③ 클라우드 받침 기본값');
  if (CLOUD) { const cs = fs.readFileSync(CLOUD, 'utf8'); const i = cs.indexOf('function osPauseDue('); const j = cs.indexOf('  return null; }', i) + 16; const f = new Function(cs.slice(i, j) + '\nreturn osPauseDue;')(); const t = Date.now(), iso = (ms) => new Date(ms).toISOString();
    ok(/소식이 6분/.test(f({ on: true, at: iso(t - 7 * 60e3) }, { status: 'run', owner: { beat: iso(t - 6 * 60e3) } }, t) || ''), '소식 기본 5분(칸이 없을 때) — 6분 없으면 되돌림');
    ok(f({ on: true, at: iso(t - 7 * 60e3) }, { status: 'run', owner: { beat: iso(t - 4 * 60e3) } }, t) === null, '4분이면 그대로');
    ok(/최대 시간 20분/.test(f({ on: true, at: iso(t - 21 * 60e3) }, { status: 'run', owner: { beat: iso(t - 10e3) } }, t) || ''), '최대 기본 20분(until 칸이 없을 때)');
    ok(/소식이 1[0-9]분/.test(f({ on: true, staleMin: 10, until: iso(t + 60e3) }, { status: 'run', owner: { beat: iso(t - 11 * 60e3) } }, t) || '') && f({ on: true, staleMin: 10, until: iso(t + 60e3) }, { status: 'run', owner: { beat: iso(t - 8 * 60e3) } }, t) === null, '웹앱이 적은 값(소식 10분)이 있으면 그것'); }
  else ok(false, '클라우드 파일을 못 찾음');
  // ── 웹앱
  const H = require('./harness.js');
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; try { localStorage.removeItem('rn-ship-secord'); } catch (e) {}
      // ③ 기본값 · 저장된 값은 그대로
      const keep = S.app && S.app.oneShot; S.app = S.app || {}; S.app.oneShot = {}; const c0 = osCfg(); o.def = [c0.pauseCapMin, c0.pauseStaleMin, c0.invFast, c0.invBulk, c0.invBulkMax]; o.sp = invSpeed();
      S.app.oneShot = { pauseCapMin: 180, pauseStaleMin: 10, invFast: false }; const c1 = osCfg(); o.saved = [c1.pauseCapMin, c1.pauseStaleMin, c1.invFast]; o.sp2 = invSpeed();
      S.app.oneShot = { pauseCapMin: 8 }; o.low = osCfg().pauseCapMin; S.app.oneShot = keep || {};
      // ① 설정 칸
      const h = shipOneShotHtml() || ''; o.setUi = /id="os_invfast"/.test(h) && /id="os_invbulk"/.test(h) && /id="os_invbn"/.test(h) && /id="os_apcap" type="number" min="5"/.test(h);
      o.feat = (typeof FEAT !== 'undefined' ? FEAT : []).filter((f) => /송장 입력 빠르게|총 주문·상품·판매가·읽은 시각 줄/.test(f.t)).length;
      // ② 붙박이 줄
      const it = (t, pr, lid) => ({ listingId: lid, title: t, price: pr, qty: 1, sku: 'PNK_ms', grade: '상' });
      S.ship = { orders: Array.from({ length: 14 }, (_, i) => ({ orderNo: 'D-' + i, buyer: '손님A', orderedAt: '2026-11-05 09:' + String(10 + i), recipient: { name: '손님A' }, items: [it('붙박이 책 ' + i, 5000 + i, String(404936100 + i))] })), tabCounts: {}, at: new Date().toISOString() }; S._shipLive = 1;
      await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); S.shipTab = 'deliv'; S.shipSrc = 'all'; await openShip(); await W(900);
      const sh = document.getElementById('sheet'); const sb = sh.querySelector('#shs_sum'); const hd = sh.querySelector('.shp-head');
      o.sb = !!sb && sb.parentElement === sh && sb.classList.contains('shp-sumbar') && getComputedStyle(sb).position === 'sticky' && /출고 준비 — 주문/.test(sb.textContent) && /판매가/.test(sb.textContent) && /읽은 시각/.test(sb.textContent);
      const m = () => ({ hb: Math.round(hd.getBoundingClientRect().bottom), st: Math.round(sb.getBoundingClientRect().top), sbb: Math.round(sb.getBoundingClientRect().bottom), shpH: parseFloat(sh.style.getPropertyValue('--shpH')), shpHd: parseFloat(sh.style.getPropertyValue('--shpHd')) });
      o.m0 = m(); sh.scrollTop = 900; await W(400); o.m1 = m(); o.scrolled = sh.scrollTop;
      const oh = [...sh.querySelectorAll('section.shp-o > .shp-oh')].map((x) => Math.round(x.getBoundingClientRect().top)); o.ohTop = Math.min(...oh.filter((y) => y >= o.m1.sbb - 2));
      o.stickyBottom = Math.round(shipStickyBottom(sh));
      // 목록 뒤로 옮기면 붙박이 아님
      localStorage.setItem('rn-ship-secord', JSON.stringify(['one', 'set', 'live', 'act', 'list', 'sum'])); await openShip(); await W(500); const sb2 = sh.querySelector('#shs_sum'); o.afterList = !!sb2 && !sb2.classList.contains('shp-sumbar'); localStorage.removeItem('rn-ship-secord');
      await openShip(); await W(500); o.ovf = sh.scrollWidth - sh.clientWidth; return o; });
    console.log(JSON.stringify(R));
    console.log('■ ③ 웹앱 기본값');
    ok(R.def.join() === '20,5,true,true,30', '기본: 최대 20분 · 소식 5분 · 빠르게 켬 · 여러 건 켬 · 30건 ' + R.def.join());
    ok(R.saved.join() === '180,10,false' && R.sp2.fast === false && R.sp2.bulk === false, '이미 저장한 값(180·10분 · 빠르게 끔)은 그대로 · 빠르게 끄면 여러 건도 끔');
    ok(R.low === 8, '최대 시간은 5분까지 고를 수 있음(예전 하한 30분)'); ok(R.sp.fast && R.sp.bulk && R.sp.bulkMax === 30, '맡김 문서에 적는 속도(speed)');
    ok(R.setUi, '⚙ 원스톱 설정: ⚡ 빠르게 · 여러 건 · 최대 건수 칸'); ok(R.feat === 2, '🔍 기능 찾기 두 줄');
    console.log('■ ② 붙박이 총 주문·매출 줄 (넓은 화면)');
    ok(R.sb, '#shs_sum이 화면 바로 아래 붙박이(position sticky) · 출고 준비 — 주문·판매가·읽은 시각');
    ok(R.scrolled > 300 && Math.abs(R.m1.st - R.m1.hb) <= 2, '내려도 머리(단계 칸) 바로 아래에 붙음 ' + JSON.stringify(R.m1));
    ok(Math.abs(R.m1.shpH - (R.m1.shpHd + (R.m1.sbb - R.m1.st))) <= 2 && Math.abs(R.stickyBottom - R.m1.sbb) <= 1, '주문 머리 띠 자리(--shpH) = 머리 + 이 줄 · 건너뛰기 기준도 이 줄 아래');
    ok(!Number.isFinite(R.ohTop) || R.ohTop >= R.m1.sbb - 2, '주문 머리 띠는 이 줄 아래에(겹치지 않음)');
    ok(R.afterList, '↕ 칸 순서에서 목록 뒤로 옮기면 붙박이 아님(예전처럼)'); ok(R.ovf <= 0, '가로 넘침 없음');
    // 휴대폰 폭
    await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(400);
    const M = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await openShip(); await W(700); const sh = document.getElementById('sheet'); const sb = sh.querySelector('#shs_sum'); const hd = sh.querySelector('.shp-head'); sh.scrollTop = 1200; await W(400);
      const s = sb.querySelector('.shp-sum'); return { hb: Math.round(hd.getBoundingClientRect().bottom), st: Math.round(sb.getBoundingClientRect().top), h: Math.round(sb.getBoundingClientRect().height), ws: getComputedStyle(s).whiteSpace, ovf: sh.scrollWidth - sh.clientWidth, sc: sh.scrollTop }; });
    console.log(JSON.stringify(M));
    console.log('■ ② 휴대폰 폭(360px)');
    ok(M.sc > 300 && Math.abs(M.st - M.hb) <= 2, '휴대폰에서도 내려도 머리 바로 아래 ' + JSON.stringify(M));
    ok(M.ws === 'nowrap' && M.h <= 40 && M.ovf <= 0, '휴대폰은 한 줄(높이 40px 안) · 화면 가로 넘침 없음');
  });
  console.log(bad ? `❌ tSHP4 실패 ${bad}` : '✓ tSHP4 통과'); process.exit(bad ? 1 : 0);
})();
