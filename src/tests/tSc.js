// (10/27 wS) ✖ 수집기 cancelOrderCmd — 가짜 알라딘(fetch)으로: 보내는 요청 모양 · 부분/전체 취소 확인 · 양식이 다르면 아무것도 보내지 않음
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'readnow-collector.user.js'), 'utf8'); const a = src.indexOf('  const CX_LAYER = '); const b = src.indexOf('  /* 알라딘 답변 화면(form1 · ASP.NET)을 받은 그대로 보내');
if (a < 0 || b < 0) { console.log('❌ tSc 실패 — 코드 조각을 못 찾음'); process.exit(1); }
const CODE = src.slice(a, b);
require('./harness.js')(async (p) => {
  const R = await p.evaluate(async (CODE) => {
    const ONO = '001-A870000009';
    const form = (ono, items, opt) => `<html><head><title>취소</title></head><body><form id="layerReportNotSales" method="GET" action="${opt && opt.badAct ? 'https://www.aladin.co.kr/scm/Other.aspx' : 'ReportNotSalesLayer.aspx'}"><div class="box1"><ul><li><input type="radio" name="cancelReason" value="1"></li><li><input type="radio" name="cancelReason" value="2"></li></ul><ul>${items.map((x) => `<li><input name="ordersItem" type="checkbox" class="rnsOrdersItemCheck" value="${x}" checked></li>`).join('')}</ul></div><div class="info_list2"><ul><li>판매자의 주문 전체 취소 : …</li><li>품절 상품만 취소, 나머지 상품은 수령 : …</li></ul></div><input type="hidden" name="rdUrl" value="https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx"><input type="hidden" name="rnsAction" value="1"><input type="hidden" name="ono" value="${ono}"></form></body></html>`;
    const list = (orders, full) => `<html><body>${JSON.stringify({ orders, tabCounts: { 주문확인요청: full ? orders.length : orders.length + 5 } })}</body></html>`;
    async function run(sc) { const sent = []; let listN = 0; const logs = []; const store = {}; const ex = [];
      const fetchF = async (url) => { const u = String(url); let html;
        if (/ReportNotSalesLayer\.aspx\?ono=/.test(u) && !/rnsAction/.test(u)) html = sc.layer;
        else if (/ReportNotSalesLayer\.aspx\?/.test(u) || /Other\.aspx/.test(u)) { sent.push(u); html = `<script>alert('주문이 취소되었습니다.');location.href='x';</script>`; }
        else if (/\/scm\/worder_preparatory_complete\.aspx$/.test(u)) { listN++; html = listN === 1 ? list(sc.before, true) : list(sc.after, sc.full !== false); }
        else html = '';
        return { ok: true, status: 200, url: u.replace(/^\//, 'https://www.aladin.co.kr/'), headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => new TextEncoder().encode(html).buffer, text: async () => html }; };
      const PACE = { wait: async () => {} }, sleep = async () => {}, AL = { decode: (buf) => new TextDecoder().decode(buf), looksLoggedOut: () => false }; const nowIso = () => new Date().toISOString(); const TS = () => 'ts'; const PC_NAME = 'TEST-PC'; const log = (m) => logs.push(m);
      const exBegin = async (k, key) => { ex.push(['begin', k, key]); return sc.gate || { ok: true }; }; const exEnd = async (k, key, st) => { ex.push(['end', k, key, st]); }; const shipLiteRead = async () => {};
      const SH = { parseDeliveryPage: (doc) => JSON.parse(doc.body.textContent) }; const ref = { id: 'cx_' + ONO, set: async (v) => { Object.assign(store, v); } };
      const fn = new Function('fetch', 'PACE', 'sleep', 'AL', 'nowIso', 'TS', 'PC_NAME', 'log', 'exBegin', 'exEnd', 'shipLiteRead', 'window', 'globalThis', CODE + '\nreturn cancelOrderCmd;');
      const cmd = fn(fetchF, PACE, sleep, AL, nowIso, TS, PC_NAME, log, exBegin, exEnd, shipLiteRead, { ReadnowShipping: SH }, { ReadnowShipping: SH });
      await cmd(ref, { orderNo: ONO, reason: sc.reason || 2, items: sc.items, tries: 1 }); return { st: store.status, state: store.result && store.result.state, learned: store.result && store.result.learnedOpt, msg: store.msg, sent, ex: ex.map((x) => x.join(':')), layerText: store.result && store.result.layerText }; }
    const it = (id) => ({ listingId: id });
    const o2 = { orderNo: ONO, items: [it('111'), it('222')] };
    const out = {};
    out.A = await run({ before: [o2], after: [{ orderNo: ONO, items: [it('222')] }], layer: form(ONO, ['111', '222']), items: ['111'] });              // 부분 취소 → 남은 상품 그대로 = 'part'
    out.B = await run({ before: [o2], after: [], layer: form(ONO, ['111', '222']), items: ['111'] });                                                 // 부분인데 주문이 통째로 빠짐(목록 다 읽음) → doneAll
    out.B2 = await run({ before: [o2], after: [], full: false, layer: form(ONO, ['111', '222']), items: ['111'] });                                   // 목록을 다 못 읽음 → 확인 못 함
    out.C = await run({ before: [o2], after: [], layer: '<html><body>다른 화면</body></html>', items: ['111'] });                                      // 양식 없음 → 안 보냄
    out.D = await run({ before: [o2], after: [], layer: form('001-A870000000', ['111', '222']), items: ['111'] });                                     // 다른 주문 → 안 보냄
    out.E = await run({ before: [], after: [], layer: form(ONO, ['111']), items: ['111'] });                                                            // 목록에 없음 → 안 보냄
    out.F = await run({ before: [o2], after: [], layer: form(ONO, ['111', '222'], { badAct: true }), items: ['111'] });                                // 보내는 곳이 다름 → 안 보냄
    out.G = await run({ before: [o2], after: [], layer: form(ONO, ['111', '222']), items: ['111', '222'], reason: 1 });                                // 전체 취소(고객 취소 요청) → done
    out.H = await run({ before: [o2], after: [], layer: form(ONO, ['111', '222']), items: ['111'], gate: { ok: false, state: 'running', why: '이미 함' } }); // 실행 문 막힘 → 안 보냄
    return out; }, CODE);
  console.log(JSON.stringify(R, null, 1));
  const q = (u) => new URL(u).search.slice(1);
  const ok = R.A.st === 'done' && R.A.state === 'done' && R.A.learned === 'part' && R.A.sent.length === 1 && q(R.A.sent[0]) === 'cancelReason=2&ordersItem=111&rdUrl=https%3A%2F%2Fwww.aladin.co.kr%2Fscm%2Fworder_preparatory_complete.aspx&rnsAction=1&ono=001-A870000009' && /\/scm\/ReportNotSalesLayer\.aspx$/.test(new URL(R.A.sent[0]).pathname) && R.A.ex.join() === 'begin:cancelOrder:cx_001-A870000009:1,end:cancelOrder:cx_001-A870000009:1:done' && !/전체 취소/.test(R.A.layerText || '')
    && R.B.st === 'done' && R.B.state === 'doneAll' && R.B.learned === 'all'
    && R.B2.st === 'unknown' && R.B2.state === 'unknown'
    && R.C.st === 'fail' && !R.C.sent.length && !R.C.ex.length && R.D.st === 'fail' && !R.D.sent.length && R.E.st === 'fail' && !R.E.sent.length && R.F.st === 'fail' && !R.F.sent.length
    && R.G.st === 'done' && R.G.state === 'done' && !R.G.learned && q(R.G.sent[0]).startsWith('cancelReason=1&ordersItem=111&ordersItem=222&')
    && R.H.st === 'fail' && !R.H.sent.length;
  console.log(ok ? '✓ tSc 통과' : '❌ tSc 실패');
});
