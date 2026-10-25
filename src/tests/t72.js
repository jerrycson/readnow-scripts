// 수집기 1.89.65 qtyChkCmd·qEditRead·listingOps 수량 규칙 — 브라우저 안에서 함수 원문을 떼어 가짜 Firestore로 돌림
const fs = require('fs'); const src = fs.readFileSync('../readnow-collector.user.js', 'utf8');
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
  console.log(JSON.stringify(out, null, 1)); await b.close(); })().catch((e) => { console.error(e); process.exit(1); });
