// 수집기 1.89.65 qtyChkCmd·qEditRead·listingOps 수량 규칙 — 브라우저 안에서 함수 원문을 떼어 가짜 Firestore로 돌림
const fs = require('fs'); const path = require('path');
// (kfail2 11/17) 함수 원문은 수집기 원본(src/readnow-collector.src.js)에 있음 — 시험 문지기 자리(Q/w/pw)는 ../readnow-collector.user.js가 그 원본 사본이지만, 저장소에서 바로 돌리면 그 자리는 본체 로더(함수가 모듈로 옮겨져 없음)라 '못 찾음'으로 시작도 못 함 → 함수가 들어 있는 첫 파일을 씀(기대 그대로)
const SRCS = [path.join(__dirname, '..', 'readnow-collector.src.js'), '../readnow-collector.user.js', path.join(__dirname, '..', '..', 'readnow-collector.user.js')];
const src = SRCS.filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).find((t) => t.includes('  async function qEditRead(lid) {')) || '';
const cut = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('못 찾음 ' + a); return src.slice(i, j); };
const fnRead = cut('  async function qEditRead(lid) {', '  async function qchkQueue(');
const fnCmd = cut('  async function qtyChkCmd(ref, v, id) {', '  async function qchkNext() {');
const fnOps = cut('  function listingOps(row, source, seenAt) {', '  /* ───────── 파일 가져오기');
const decl = cut('const QCHK = { busy: false };', '\n');
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.route('https://www.aladin.co.kr/**', (r) => { const u = r.request().url(); const id = (u.match(/UpdateItemId=(\d+)/) || [])[1];
    const tbl = { 7001: { q: 1, pr: 9000, st: 1, c: 'BLKCMN' }, 7002: { q: 6, pr: 8000, st: 1, c: 'PNKLUX' }, 7003: { q: 2, pr: 7000, st: 15, c: 'X1' } }; const x = tbl[id];
    if (!x) return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>없음</body></html>' });
    r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: `<html><body><form id="frmRecord"><input name="UpdateItemId" value="${id}"><input id="stockCount" value="${x.q}"><input id="priceSales" value="${x.pr}"><input id="supItemCode" value="${x.c}"><select id="stockState"><option value="1" ${x.st === 1 ? 'selected' : ''}>판매중</option><option value="15" ${x.st === 15 ? 'selected' : ''}>판매중지</option></select></form></body></html>` }); });
  await p.goto('https://www.aladin.co.kr/scm/x.aspx');
  const out = await p.evaluate(async ({ fnRead, fnCmd, fnOps, decl }) => {
    const W = () => ({}); const TS = () => 'TS'; const nowIso = () => new Date().toISOString(); const sleep = () => Promise.resolve(); const PC_NAME = 'TEST'; const logs = []; const log = (m) => logs.push(m);
    const ACTIVE = ['판매중', '판매대기', '일시판매중지', '판매중지', '판매금지']; const LISTING_FIELDS = ['title', 'status', 'price', 'qty', 'qtyList', 'sku', 'listingId'];
    const writes = []; const C = (col) => ({ doc: (id) => ({ set: async (o, m) => writes.push([col, id, o]) }), add: async (o) => writes.push([col, 'add', o]) });
    const firebase = { firestore: { FieldValue: { increment: (n) => ({ inc: n }) } } };
    const LISTINGS = new Map([['aladin_U1', { qty: 3, price: 9000, status: '판매중', sku: 'BLKCMN', listingId: '7001' }], ['aladin_U2', { qty: 6, price: 8000, status: '판매중', sku: 'PNKLUX', listingId: '7002' }], ['aladin_U3', { qty: 2, price: 7000, status: '판매중', sku: 'X1', listingId: '7003' }], ['aladin_U4', { qty: 1, status: '판매중', listingId: '7004' }]]);
    const loadListings = async () => LISTINGS; var LOPS_WHY = {}; const stabJ = (v) => JSON.stringify(v); window.__rnPaused = false;
    const P = { diff: (a, b, F) => { const o = {}; for (const f of F) if (b[f] != null && (!a || JSON.stringify(a[f]) !== JSON.stringify(b[f]))) o[f] = { from: a ? a[f] : null, to: b[f] }; return o; }, mediaType: () => ({ type: 'book', why: '' }) };
    eval(decl + '\n' + fnRead + '\n' + fnCmd + '\n' + fnOps + '\n; window.__t = { qEditRead, qtyChkCmd, listingOps, QCHK_Q };');
    const T = window.__t; const r1 = await T.qEditRead('7001');
    const ref = { set: async (o) => writes.push(['cmd', 'self', o]) };
    const ret = await T.qtyChkCmd(ref, { items: [{ k: 'aladin_U1', lid: '7001' }, { k: 'aladin_U2', lid: '7002' }, { k: 'aladin_U3', lid: '7003' }, { k: 'aladin_U4', lid: '7004' }] }, 'cmdX');
    // listingOps: 아는 상품 목록 수량 5 (우리 1) → qty 안 덮고 qtyList 5 · 차례에 넣음
    const o1 = T.listingOps({ usedCode: 'U1', listingId: '7001', qty: 5, status: '판매중', price: 9000 }, 'scm', nowIso());
    const o2 = T.listingOps({ usedCode: 'U9', listingId: '7009', qty: 2, status: '판매중', price: 1000 }, 'scm', nowIso());
    const o3 = T.listingOps({ usedCode: 'U2', listingId: '7002', qty: 6, status: '판매중', price: 8000 }, 'scm', nowIso());
    return { r1, ret, L: Object.fromEntries([...LISTINGS].map(([k, v]) => [k, { qty: v.qty, qtyList: v.qtyList, status: v.status, price: v.price, active: v.active }])), Q: [...T.QCHK_Q], changes: writes.filter((w) => w[0] === 'prd_listing_changes').map((w) => JSON.stringify(w[2].changes)), last: JSON.stringify(writes.filter((w) => w[0] === 'cmd').pop()[2]), logs, o: [o1.slim, o2.isNew, o3.slim] };
  }, { fnRead, fnCmd, fnOps, decl });
  console.log(JSON.stringify(out, null, 1)); await b.close();
  // (kfail2 11/17) 전엔 결과를 찍기만 하고 통과 줄이 없어 시험 문지기가 늘 '통과 줄 없음'으로 막음 — 위 주석의 규칙대로 확인 줄을 둠
  const L = out.L, ok = (n, c) => { console.log((c ? '✓ ' : '  ❌ ') + n); return c; };
  const R = [
    ok('정보수정 읽기 — 수량 1·가격 9000·자체코드 BLKCMN·판매중', out.r1 && out.r1.ok && out.r1.qty === 1 && out.r1.price === 9000 && out.r1.code === 'BLKCMN' && out.r1.state === 1),
    ok('수량 확인 — U1 우리 3→알라딘 1로 고침', L.aladin_U1.qty === 1 && out.changes.includes('{"qty":{"from":3,"to":1}}')),
    ok('수량 확인 — U3 판매중→판매중지로 고침', L.aladin_U3.status === '판매중지' && out.changes.includes('{"status":{"from":"판매중","to":"판매중지"}}')),
    ok('수량 확인 — U2 같으면 안 고침(바뀜 기록 2건뿐)', L.aladin_U2.qty === 6 && out.changes.length === 2),
    ok('수량 확인 — U4 양식 없으면 못 읽음으로 남기고 우리 기록 그대로', L.aladin_U4.qty === 1 && /"aladin_U4":\{"e":/.test(out.last) && /"status":"done"/.test(out.last)),
    ok('목록 수량 5(우리 1) — qty 안 덮고 qtyList 5 · 확인 차례에 넣음', L.aladin_U1.qty === 1 && L.aladin_U1.qtyList === 5 && out.Q.some((q) => q[0] === 'aladin_U1')),
    ok('새 상품 U9 — 새로 들이고 확인 차례에 넣음', out.o[1] === true && L.aladin_U9 && L.aladin_U9.qty === 2 && out.Q.some((q) => q[0] === 'aladin_U9')),
    ok('같은 U2 — 차례에 안 넣음', !out.Q.some((q) => q[0] === 'aladin_U2')),
    ok('기록 — 3/4개 읽음 · 고친 2개 · 못 읽음 1개', /3\/4개 읽음/.test(out.logs.join()) && /고친 상품 2개/.test(out.logs.join()) && /못 읽음 1개/.test(out.logs.join())),
  ];
  console.log(R.every(Boolean) ? '✓ t72 통과' : '❌ t72 실패'); process.exit(R.every(Boolean) ? 0 : 1); })().catch((e) => { console.error(e); process.exit(1); });
