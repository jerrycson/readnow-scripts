// tC2SHIP — 정범님 11/10 아침 '출고 끝난 뒤 한꺼번에 알림 — 지금 진행'
//  수집기(머리 그대로 · 모듈 본문만) 🚚 출고 중 쓰기(발송준비시작·판매 불가 통보·현금 판매 중지·송장 한 건/여러 건/CSV) 알림 쌓기가 출고 처리에 끼치는 것:
//   ① 출고 중 __rnC2w는 이 PC 저장소(rn-c2wq-ship)에만 — 네트워크 요청 0 · 화면(DOM) 바뀜 0 · 팝업 0
//   ② 시간 재기 — 송장 200건을 차례로 넣는 출고 흐름을 '알림 없음'과 '출고 중 쌓기'로 같은 횟수씩 돌려 견줌: 한 건에 더 드는 시간(평균·가장 긴 것)이 정한 바닥 아래
//   ③ 쌓기는 300개까지(넘으면 오래된 것부터 빠짐 — 저장소가 커지지 않게) · 출고 보호가 풀리면 다리가 한꺼번에(20개씩) 넘기고 받았다는 것만 지움
//  사용: node tC2SHIP.js (src/tests)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } }
const SRCF = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2SHIP — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const CW = cut('(function rnC2w()', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };
const FB = () => { const ref = () => ({ get: async () => ({ exists: false, data: () => undefined }), set: async () => {} }); const fsx = { collection: () => ({ doc: () => ref() }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: () => {} }) }; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore: () => fsx }; };
/* 발송 요청 화면 꼴 — 주문 120줄(송장 칸·고르기 칸) · 우리는 그 양식에서 한 줄 송장만 떼어 알림(운영 9321줄 그대로) */
const PAGE = '<!doctype html><html><head><meta charset="utf-8"></head><body><form id="F" method="post" action="/scm/worder_delivery.aspx?orderstep=4">' + Array.from({ length: 120 }, (_, i) => `<input type="checkbox" name="chkOrder.111-${i}" value="1"><input name="deliveryNo.111-${i}" value=""><input type="hidden" name="memo${i}" value="x">`).join('') + '</form></body></html>';

const run = async () => { const br = await chromium.launch(); const errs = []; const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('팝업 ' + d.message()); d.dismiss(); });
  const NET = []; const S = { alw: true, ack: true };
  await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
    if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
    if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} NET.push({ p: u.pathname, b, t: Date.now() }); const o = u.pathname === '/al/feed' ? { ok: true, al: { on: false }, alw: { on: S.alw } } : u.pathname === '/al/wfeed' ? { ok: true, on: true, ack: S.ack ? (b.w || []).map((x) => x.id) : [] } : { ok: true }; return rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }); }
    NET.push({ p: u.pathname, t: Date.now(), other: true }); return rt.fulfill({ contentType: 'text/html', body: PAGE }); });
  await p.addInitScript((a) => { if (window.top !== window) return; const st = {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
    window.__rnLog = () => {}; window.__rnPcName = { get: () => 'MJ-MAIN' }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false });
    window.GM_xmlhttpRequest = (o) => { window.__XHR = (window.__XHR || 0) + 1; fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
    (new Function(a.fb))(); }, { fb: `(${FB.toString()})()` });
  await p.addInitScript({ content: RULE }); await p.addInitScript({ content: CW }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4');
  const tick = async () => { await p.evaluate(() => window.__rnC2alTick && window.__rnC2alTick(true)); await p.waitForTimeout(500); };
  await tick(); ok(await p.evaluate(() => window.__GM['rn-c2w-ok'] && window.__GM['rn-c2w-ok'].on === true && window.__GM['rn-c2w-ok'].alw === true), '출고 전: 번외가 그림자 쓰기를 받음(rn-c2w-ok.alw)');
  await p.evaluate(() => { window.__HOLD = 1; }); await tick(); ok(await p.evaluate(() => window.__GM['rn-c2w-ok'].hold === true && window.__GM['rn-c2w-ok'].on === false && window.__GM['rn-c2w-ok'].alw === true), '출고 시작: 다리가 hold를 적음(받던 PC라는 표시 alw는 그대로)');
  /* ①② 출고 흐름 흉내 — 송장 칸에 값 넣기 + (운영 그대로) 그 줄 양식 떼기 + 알림. 알림 없음(A) / 출고 중 쌓기(B)를 번갈아 여러 번 */
  const n0 = NET.length, x0 = await p.evaluate(() => window.__XHR || 0);
  const R = await p.evaluate(() => { const F = document.getElementById('F'); let mut = 0; const mo = new MutationObserver((l) => (mut += l.length)); mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    const one = (i, hook) => { const no = '111-' + (i % 120); const inp = F.elements['deliveryNo.' + no]; inp.value = String(600000000000 + i); const t = performance.now();
      if (hook) { const c2wF = window.__rnC2wForm ? window.__rnC2wForm(inp.form, (n) => n === 'deliveryNo.' + no || n === 'chkOrder.' + no) : null; if (c2wF) window.__rnC2w('inv', { ono: no, invH: inp.value }, [c2wF], true, 200); }
      return performance.now() - t; };
    const A = [], B = []; for (let r = 0; r < 4; r++) { for (let i = 0; i < 50; i++) A.push(one(r * 50 + i, false)); for (let i = 0; i < 50; i++) B.push(one(r * 50 + i, true)); }
    mo.disconnect(); const avg = (L) => L.reduce((a, b) => a + b, 0) / L.length; const srt = (L) => L.slice().sort((a, b) => a - b);
    return { a: avg(A), b: avg(B), p95: srt(B)[Math.floor(B.length * 0.95)], max: Math.max(...B), mut, n: (window.__GM['rn-c2wq-ship'] || []).length, q: (window.__GM['rn-c2wq'] || []).length }; });
  ok(R.n === 200 && R.q === 0, `① 출고 중 쓰기 200건은 이 PC 출고 뒤 줄(rn-c2wq-ship)에만 — 보낼 줄은 0: ${JSON.stringify({ n: R.n, q: R.q })}`);
  await p.waitForTimeout(300); ok(NET.length === n0 && (await p.evaluate(() => window.__XHR || 0)) === x0, `① 쌓는 동안 네트워크 요청 0(번외·알라딘·그 밖 모두): ${NET.length - n0}`);
  ok(R.mut === 0, `① 화면(DOM) 바뀜 0: ${R.mut}`);
  ok(R.b - R.a < 1.0 && R.p95 < 2.0, `② 한 건에 더 드는 시간 — 평균 ${(R.b - R.a).toFixed(3)}ms(바닥 1ms) · 95% ${R.p95.toFixed(3)}ms(바닥 2ms) · 가장 긴 것 ${R.max.toFixed(2)}ms — 사람·알라딘 응답(수백 ms)에 견주면 0`);
  /* ③ 300개까지 */
  await p.evaluate(() => { for (let i = 0; i < 150; i++) window.__rnC2w('start', { ono: 'S-' + i }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=S-' + i }], true, 200); });
  ok((await p.evaluate(() => window.__GM['rn-c2wq-ship'].length)) === 300, '③ 출고 뒤 줄은 300개까지(오래된 것부터 빠짐)');
  await tick(); ok(!NET.slice(n0).some((x) => x.p === '/al/wfeed'), '③ 출고 중엔 다리도 /al/wfeed를 보내지 않음');
  /* 출고 끝 → 한꺼번에 */
  await p.evaluate(() => { window.__HOLD = 0; }); const m0 = NET.length; await tick(); await p.waitForTimeout(800);
  const W = NET.slice(m0).filter((x) => x.p === '/al/wfeed'); const L = W.flatMap((x) => x.b.w || []); const left = await p.evaluate(() => (window.__GM['rn-c2wq-ship'] || []).length);
  ok(W.length === 5 && W.every((x) => (x.b.w || []).length <= 20) && L.every((e) => e.late === 1) && left === 200, `③ 출고 끝 — 한 번 알림 차례에 20개씩 5번(100건) 넘기고 받은 것만 지움 · 남은 것은 다음 차례: ${JSON.stringify({ calls: W.length, n: L.length, left })}`);
  for (let k = 0; k < 3; k++) await tick(); ok((await p.evaluate(() => (window.__GM['rn-c2wq-ship'] || []).length)) === 0, '③ 몇 차례 뒤 모두 넘김');
  ok(!JSON.stringify(L).includes('600000000001'), '송장 번호 원문은 넘어가지 않음(해시·길이만)');
  /* 번외가 못 받으면(ack 없음) 지우지 않음 */
  S.ack = false; await p.evaluate(() => { window.__HOLD = 1; }); await tick(); await p.evaluate(() => window.__rnC2w('stop', { ono: 'X1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=x&ono=X1' }], true, 200)); await p.evaluate(() => { window.__HOLD = 0; }); await tick();
  ok((await p.evaluate(() => (window.__GM['rn-c2wq-ship'] || []).length)) === 1, '번외가 받았다고 하지 않으면 지우지 않음(데이터 안 지움)');
  ok(!errs.length, '팝업·화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2SHIP ${bad}개 실패` : '✅ tC2SHIP 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2SHIP 오류', e); process.exit(1); });
