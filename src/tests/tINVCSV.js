// tINVCSV — 정범님 11/06 오후 '2건 이상은 알라딘 송장번호 일괄등록(CSV) · 1건은 한 건씩' + 바로잡음 '첫 건 시험 없이 처음부터 · 진정한 원스톱'
//  가짜 알라딘: worder_excel.aspx(dnb=1) = 머리줄 + 발송 요청 주문 표 · worder_deliveryNoBulk.aspx = 받은 CSV를 읽어 송장 있는 줄만 발송 요청에서 빼고 alert 글
//  · 발송 요청 화면(jsdom) + 가짜 Firestore — tSHP4와 같은 틀 · 시험 자료 손님은 '손님A'·'손님B' (공개 저장소)
// 실행: cd pw && RN_PORT=8815 node tINVCSV.js
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const SHIP = require(pick(path.join(__dirname, '../readnow-shipping-core.js'), path.join(__dirname, '../../readnow-shipping-core.js')));
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
/* 아주 작은 CSV 읽기(따옴표·쉼표·CRLF) */
const csvRead = (t) => { const out = []; let row = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\r') {} else if (c === '\n') { row.push(f); out.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); out.push(row); } return out; };
const HEAD = ['주문번호', '수령인', '택배사코드', '택배사', '송장번호'];
/* 가짜 알라딘 상태 — list: 발송 요청 주문 [{no, name, inv(주문목록 송장 칸)}] · accept: 'cp949'|'utf8'|'none'(어느 인코딩으로 온 CSV를 받아 처리하나) · shipped: 배송&구매확정전 [[주문, 송장]] */
function aladin(o) { const A = { list: o.list.map((x) => ({ ...x })), accept: o.accept || 'cp949', shipped: (o.shipped || []).slice(), posts: [], xls: 0, wrongSet: o.wrongSet || null, head: o.head || HEAD };
  A.xlsHtml = () => '﻿<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><table border="0"><tr>' + A.head.map((h) => `<th>${h}</th>`).join('') + '</tr>' + A.list.map((x) => `<tr><td class="styleText">${x.no}</td><td>${x.name}</td><td>3</td><td>롯데택배</td><td class="styleText">${x.inv || ''}</td></tr>`).join('') + '</table></body></html>';
  A.post = async (fd) => { const f = fd.get('csvFile'); const buf = Buffer.from(await f.arrayBuffer()); const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf; const enc = bom ? 'utf8' : 'cp949'; const text = bom ? buf.slice(3).toString('utf8') : new TextDecoder('euc-kr').decode(buf); const rows = csvRead(text);
    A.posts.push({ name: f.name, type: f.type, enc, rows }); if (A.accept !== enc) return '<html><body><script>alert(\'파일 형식이 올바르지 않습니다.\');history.back();</script></body></html>';
    let n = 0; for (const r of rows.slice(1)) { const [no, , , , inv] = r; if (!inv) continue; const i = A.list.findIndex((x) => x.no === no); if (i < 0) continue; if (A.wrongSet && A.wrongSet[no]) { A.list[i].dn = A.wrongSet[no]; continue; } A.list.splice(i, 1); A.shipped.push([no, inv]); n++; }
    return `<html><body><p>손님A 010-1234-5678 서울시 마포구 연남로 1</p><script>alert('${n}건의 송장번호가 등록되었습니다.');location.href='worder_delivery.aspx';</script></body></html>`; };
  return A; }
const shippedHtml = (L) => `<html><body><table>${L.map(([o, inv], i) => `<tr id="oList${i + 1}"><td><a onclick="viewOrderDetail('${o}')">${o}</a></td><td>롯데택배 ${inv}</td></tr>`).join('')}</table></body></html>`;
async function run(o) { const F = fakeFb(); const GM = new Map(); const id = 'inv_c'; const fetched = []; const A = aladin(o);
  F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', limit: o.limit ?? 0, verify: o.verify ?? false, autoCont: true, from: 'oneshot', log: [], items: o.items, ...(o.speed ? { speed: o.speed } : {}) };
  GM.set('rn-inv-active', { id, at: Date.now() });
  const page = async (opt) => { opt = opt || {}; const orders = A.list.map((x) => x.no); const snap = A.list.map((x) => ({ orderNo: x.no, deliveryNo: x.dn || null }));
    const html = `<img src="bu_total3.gif" onclick="javascript:deliveryNoSComplete();"><form name="orderItemForm" id="orderItemForm" method="get" action="/scm/worder_delivery.aspx"><input type="hidden" name="cmd" value="">${orders.map((x) => `<input type="checkbox" name="chkOrder.${x}" value="1"><input id="deliveryNo.${x}" name="deliveryNo.${x}" value="${(A.list.find((y) => y.no === x) || {}).dn || ''}">`).join('')}</form>`;
    const dom = new JSDOM(`<body>${html}</body>`, { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4', runScripts: 'dangerously' }); const w = dom.window; w.__clicked = []; w.__bulk = [];
    w.TextDecoder = TextDecoder; w.TextEncoder = TextEncoder; w.Blob = Blob; w.FormData = FormData; /* 진짜 브라우저처럼 — jsdom에는 euc-kr 디코더가 없을 수 있어 Node 것을 씀 */
    w.firebase = F.fb; w.__rnLog = () => {}; w.__rnPcName = { get: () => 'PC-T' }; w.sessionStorage.setItem('rn-inv-tab', id);
    w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {};
    w.deliveryNoComplete = (x) => w.__clicked.push(x); w.deliveryNoSComplete = () => w.__bulk.push(1);
    w.fetch = async (u, op) => { u = String(u); fetched.push((op && op.method || 'GET') + ' ' + u); if (/worder_excel\.aspx/.test(u)) { A.xls++; return { ok: true, status: 200, text: async () => A.xlsHtml() }; }
      if (/worder_deliveryNoBulk\.aspx/.test(u)) { const t = await A.post(op.body); return { ok: true, status: 200, text: async () => t }; }
      if (/worder_delivery_complete/.test(u)) return { ok: true, status: 200, text: async () => shippedHtml(A.shipped) };
      if (/worder_delivery\.aspx/.test(u)) return { ok: true, status: 200, text: async () => '<html><body>발송 요청(가짜)</body></html>' };
      return { ok: true, status: 200, text: async () => '<html></html>' }; };
    /* 화면 문서는 열 때의 주문 · fetch로 읽은 문서는 지금 주문(올린 뒤 바뀜) */
    w.ReadnowShipping = { matchInvoices: () => ({}), parseAladinOrderExcel: SHIP.parseAladinOrderExcel, parseDeliveryPage: (d) => ({ orders: d === w.document ? snap : A.list.map((x) => ({ orderNo: x.no, deliveryNo: x.dn || null })), tabCounts: { 발송요청: 1 } }) };
    w.__rnInvVerifyWait = 200; w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  return { F, GM, A, fetched, page, D: () => F.store['shp_invoices/' + id] }; }
const it = (no, inv, st) => ({ orderNo: no, invoice: inv, recipient: '손님A', state: st || 'todo' });
const L3 = () => [{ no: 'O2', name: '손님A' }, { no: 'O3', name: '손님A' }, { no: 'O4', name: '손님B' }, { no: 'O9', name: '손님B' }];
const I3 = () => [it('O2', '240000000012'), it('O3', '240000000013'), it('O4', '240000000014')];
(async () => {
  console.log('■ 도우미 함수 — CP949 · UTF-8 BOM · CSV 칸');
  { const T = await run({ list: [], items: [] }); const w = await T.page(); await sleep(200); const H = w.__rnInvCsv;
    const b = H.invEncCp949('주문번호,손님A'); ok(!!b && new TextDecoder('euc-kr').decode(b) === '주문번호,손님A' && b[0] === 0xc1, 'CP949로 바꿈(거꾸로 읽으면 같은 글 · 첫 바이트 0xC1=주)');
    ok(H.invEncCp949('손님😀') === null, 'CP949로 못 바꾸는 글자가 있으면 null(? 로 바꾸지 않음 → UTF-8 BOM판으로)');
    const u = H.invEncUtf8Bom('가'); ok(u[0] === 0xef && u[1] === 0xbb && u[2] === 0xbf && Buffer.from(u.slice(3)).toString('utf8') === '가', 'UTF-8 BOM판');
    const B = H.invCsvBuild({ header: HEAD, rows: [['O2', '손님,A', '3', '롯데"택배', ''], ['O9', '손님B', '3', '롯데택배', '111']] }, new Map([['O2', '240000000012']]));
    ok(B.text === '주문번호,수령인,택배사코드,택배사,송장번호\r\nO2,"손님,A",3,"롯데""택배",240000000012\r\nO9,손님B,3,롯데택배,\r\n' && B.other === 1, '쉼표·따옴표 칸은 따옴표로 감쌈 · CRLF · 머리줄 · 남의 주문 송장 칸은 비움 ' + JSON.stringify(B.text));
    const M = H.invCsvMsg("<p>손님A 010-1234-5678 서울시 마포구 연남로 1</p><script>alert('3건 등록되었습니다.')</script>", ['손님A']); ok(M.alerts[0] === '3건 등록되었습니다.' && !/손님A|1234|연남로/.test(M.text) && /\[이름\]/.test(M.text), '알라딘 답: alert 문장 · 이름·전화·주소는 가림 ' + JSON.stringify(M)); w.close(); }
  console.log('■ 2건 이상 → 처음부터 CSV 한 번에(첫 건 시험 없음 · 정범님 11/06 오후)');
  { const T = await run({ list: L3(), items: I3() }); const w = await T.page(); await sleep(1500); const d = T.D(); const P = T.A.posts[0] || { rows: [] };
    ok(T.A.posts.length === 1 && !w.__clicked.length && !w.__bulk.length, 'CSV 한 번 올림 · 한 건씩·선택 입력완료 누름 없음');
    ok(T.fetched.some((u) => /^GET .*worder_excel\.aspx\?status=4&keywordType=0&keyword=&filterType=0&limitDate=0&dnb=1&page=$/.test(u)) && T.fetched.some((u) => /^POST .*worder_deliveryNoBulk\.aspx$/.test(u)), 'step1 GET worder_excel.aspx(dnb=1) · step3 POST worder_deliveryNoBulk.aspx');
    ok(P.name === 'deliveryNo.csv' && /text\/csv/.test(P.type) && P.enc === 'cp949', "파일 칸 csvFile · 'deliveryNo.csv' · text/csv · CP949 " + P.name + ' ' + P.type + ' ' + P.enc);
    ok(JSON.stringify(P.rows[0]) === JSON.stringify(HEAD) && P.rows.find((r) => r[0] === 'O2')[4] === '240000000012' && P.rows.find((r) => r[0] === 'O4')[4] === '240000000014', '머리줄 그대로 · 우리 주문마다 제 송장번호');
    ok(P.rows.find((r) => r[0] === 'O9')[4] === '' && P.rows.find((r) => r[0] === 'O4')[1] === '손님B' && P.rows.find((r) => r[0] === 'O2')[3] === '롯데택배', "남의 주문(O9) 송장 비움 · CP949로 '수령인' 글자가 맞게(손님B) · 택배사 그대로");
    ok(d.items.every((x) => x.state === 'sent' && x.via === 'csv' && x.bulk) && d.csvDiag && d.csvDiag.tries[0].enc === 'CP949' && /등록되었습니다/.test((d.csvDiag.tries[0].alerts || [])[0] || ''), '맡김 문서: 3건 sent·via csv · csvDiag(인코딩·알라딘 답)');
    ok(!/손님A|1234-5678|연남로/.test(JSON.stringify(d.csvDiag)), 'csvDiag에 손님 이름·전화·주소 없음');
    ok((d.log || []).some((x) => /📄 송장 일괄등록 — 3건 CSV 올림\(CP949\) · 알라딘 답: 3건의 송장번호가 등록되었습니다/.test(x.m)), "기록 줄 '📄 송장 일괄등록 — 3건 CSV 올림 · 알라딘 답: …'"); w.close();
    const w2 = await T.page(); await sleep(1500); const d2 = T.D();
    ok(d2.items.every((x) => x.state === 'done') && d2.status === 'done' && d2.bulkVerified && d2.bulkVerified.ok && d2.bulkVerified.okN === 3, '다시 연 화면: 3건 빠짐 = 입력됨 · 첫 회 배송&구매확정전 3건 확인 → 끝 ' + JSON.stringify(d2.bulkVerified || {})); w2.close(); }
  console.log('■ 1건 → 한 건씩');
  { const T = await run({ list: [{ no: 'O2', name: '손님A' }, { no: 'O9', name: '손님B' }], items: [it('O2', '240000000012')] }); const w = await T.page(); await sleep(700);
    ok(w.__clicked.join() === 'O2' && !T.A.posts.length && !T.A.xls, '남은 주문 1건이면 한 건씩(deliveryNoComplete) · 주문목록도 안 받음'); w.close(); }
  console.log('■ 첫 시도 그대로 → UTF-8 BOM 한 번 더');
  { const T = await run({ list: L3(), items: I3(), accept: 'utf8' }); const w = await T.page(); await sleep(1500); const d = T.D();
    ok(T.A.posts.length === 2 && T.A.posts[0].enc === 'cp949' && T.A.posts[1].enc === 'utf8' && T.A.xls === 2, 'CP949 → 그대로 → 주문목록 다시 받아 UTF-8 BOM으로 한 번 더');
    ok(T.A.posts[1].rows.find((r) => r[0] === 'O4')[1] === '손님B' && d.items.every((x) => x.state === 'sent' && x.via === 'csv') && d.csvDiag.tries.length === 2 && d.csvDiag.tries[1].moved === 3, 'UTF-8 BOM판도 글자 맞음 · 3건 빠짐 확인');
    ok((d.log || []).some((x) => /UTF-8 BOM판으로 한 번만 다시 올림/.test(x.m)), '기록 줄: UTF-8 BOM으로 다시'); w.close(); }
  console.log('■ 두 번 다 그대로 → 한 건씩');
  { const T = await run({ list: L3(), items: I3(), accept: 'none' }); const w = await T.page(); await sleep(1500); const d = T.D();
    ok(T.A.posts.length === 2 && w.__clicked.join() === 'O2' && d.bulkOff && d.bulkOff.way === 'csv' && /2번 올려도 3건 모두/.test(d.bulkOff.why), 'CSV 두 번 그대로 → bulkOff · 첫 주문부터 한 건씩 ' + JSON.stringify(d.bulkOff || {}));
    ok(d.items.find((x) => x.orderNo === 'O3').state === 'todo' && !d.items.some((x) => x.bulk) && d.csvDiag && d.csvDiag.tries.length === 2, '나머지는 todo로 되돌림(실행 문 실패로 닫음) · csvDiag 남김'); w.close(); }
  console.log('■ 같은 송장 두 번 금지 — 주문목록 송장 칸이 이미 차 있음');
  { const L = L3(); L[1].inv = '240000000013'; const T = await run({ list: L, items: I3() }); const w = await T.page(); await sleep(1500); const d = T.D(); const P = T.A.posts[0] || { rows: [] };
    ok(T.A.posts.length === 1 && P.rows.find((r) => r[0] === 'O3')[4] === '' && P.rows.find((r) => r[0] === 'O2')[4] === '240000000012', 'O3은 CSV에 넣지 않음(송장 칸 비움) · O2·O4만');
    const o3 = d.items.find((x) => x.orderNo === 'O3'); ok(o3.state === 'has' && /받은 주문목록 송장 칸: 240000000013 · 같은 송장/.test(o3.err), "O3 = '이미 송장 있음 — 넣지 않음' " + o3.err); w.close(); }
  { const L = L3(); const T = await run({ list: L, items: I3() }); T.A.list[0].dn = '240000000012'; const w = await T.page(); await sleep(1500); const d = T.D(); const P = T.A.posts[0] || { rows: [] };
    ok(d.items.find((x) => x.orderNo === 'O2').state === 'has' && P.rows.find((r) => r[0] === 'O2')[4] === '' && T.A.posts.length === 1, '발송 요청 화면 송장 칸이 차 있는 주문(O2)도 넣지 않음 · 나머지 2건 CSV'); w.close(); }
  console.log('■ 머리줄이 다르면 CSV 안 씀');
  { const T = await run({ list: L3(), items: I3(), head: ['주문번호', '받는분', '택배사코드', '택배사', '송장번호'] }); const w = await T.page(); await sleep(1000); const d = T.D();
    ok(!T.A.posts.length && w.__clicked.join() === 'O2' && d.bulkOff && /머리줄이 다름/.test(d.bulkOff.why) && /받는분/.test(d.bulkOff.why), '올리지 않고 한 건씩 · 까닭 기록 ' + (d.bulkOff || {}).why); w.close(); }
  console.log('■ 올린 뒤 다른 송장으로 보이면 멈춤');
  { const T = await run({ list: L3(), items: I3(), wrongSet: { O3: '999999999999' } }); const w = await T.page(); await sleep(1500); const d = T.D();
    ok(d.status === 'paused' && d.verifyFail && /다른 송장번호/.test(d.pauseWhy || '') && d.items.find((x) => x.orderNo === 'O3').state === 'fail' && !T.GM.has('rn-inv-active'), '멈춤 ⚠ ' + (d.pauseWhy || '')); w.close(); }
  console.log('■ 첫 회 검증에서 다른 송장이면 멈춤(배송&구매확정전)');
  { const T = await run({ list: L3(), items: I3(), shipped: [] }); const w = await T.page(); await sleep(1500); w.close(); T.A.shipped = T.A.shipped.map(([o, inv]) => [o, o === 'O4' ? '888888888888' : inv]); const w2 = await T.page(); await sleep(1500); const d = T.D();
    ok(d.status === 'paused' && d.verifyFail && d.bulkVerified && d.bulkVerified.ok === false, '배송&구매확정전에 다른 송장 → 멈춤 ' + (d.pauseWhy || '')); w2.close(); }
  console.log('■ 설정');
  { const T = await run({ list: L3(), items: I3(), speed: { bulkWay: 'off' } }); const w = await T.page(); await sleep(700); ok(w.__clicked.join() === 'O2' && !T.A.posts.length, "bulkWay 'off' → 늘 한 건씩"); w.close(); }
  { const T = await run({ list: L3(), items: [it('O1', '240000000011', 'done'), ...I3()], speed: { bulkWay: 'select' } }); const w = await T.page(); await sleep(900); ok(w.__bulk.length === 1 && !T.A.posts.length, "bulkWay 'select' → 예전 '선택 입력완료'"); w.close(); }
  { const T = await run({ list: L3(), items: I3(), limit: 1, verify: true }); const w = await T.page(); await sleep(700); ok(w.__clicked.join() === 'O2' && !T.A.posts.length, "예전 첫 건 시험(limit 1 · 설정을 켰을 때)이면 첫 건은 한 건씩 그대로"); w.close(); }
  { const T = await run({ list: L3(), items: [it('O1', '240000000011', 'done'), ...I3()], limit: 1, verify: true, shipped: [['O1', '240000000011']] }); const w = await T.page(); await sleep(1500); const d = T.D();
    ok(d.verified && d.verified.ok && T.A.posts.length === 1 && T.A.posts[0].rows.slice(1).filter((r) => r[4]).length === 3, '첫 건 시험 맞음 → 나머지 3건은 CSV 한 번에'); w.close(); }
  { const h1 = src.split('// ==/UserScript==')[0]; ok(!/INV_CSV|worder_deliveryNoBulk/.test(h1), '수집기 머리(==UserScript==)에 새 줄 없음'); }
  console.log(bad ? `❌ tINVCSV 실패 ${bad}` : '✓ tINVCSV 통과'); process.exit(bad ? 1 : 0);
})();
