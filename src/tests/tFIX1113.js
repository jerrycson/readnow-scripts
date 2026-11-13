// tFIX1113 — (11/13 fix1113 · 아침 점검 'HOME 손발 05시 뒤 alDay 0 · 기록에 🖐 0 · 상태에 al 칸 없음')
//   ① 웹앱이 닫힌 사무실 PC — 운영 수집기 탭(rnC2al 안 c2rlTick)이 번외 /relay/pending을 받아
//      · 알라딘 그림자 세 칸(prd_listings·shp_state·crm_interactions)만 문서 이름 규칙 안에서 읽어 웹앱 c2alTrim과 같은 칸만 넘김(구매자·수령인·주소·전화 없음)
//      · 결과는 col2_ 칸만 씀(op·web 줄·다른 칸은 안 씀) → /relay/ack
//   ② 이 PC 웹앱이 3분 안에 왔으면 · 로거면 · 출고 중이면 안 함
//   ③ 손발 맡김을 하면 이 탭 기록에 🖐 한 줄(처음·30분마다 요약 · 실패는 까닭)
// 실행: node src/tests/tFIX1113.js
// (틀은 tC2ALB에서 가져옴) tC2ALB — 정범님 11/09 밤 '로그인 일(알라딘 샵매니저)도 번외로' · lab/col2/LOGIN_PLAN.md ⑤-1
//  수집기(머리 그대로) 🟧 번외 알라딘 다리(rnC2al) 시험:
//   ① 10초마다 번외 도우미(127.0.0.1:8797 — 시험에선 가짜)에 POST /al/feed {by, seat, hold, opLostAt, cfg} · 그 밖 칸 없음(손님 정보 없음)
//   ② 🪑 자리: 번외가 알라딘 읽기를 켰을 때만 계정 문서(app_settings/aladin_login)의 '<PC>~col2' 자리를 운영 규칙(seatAsk·seatKeep)으로 받음 · 우선순위 -1(클라우드보다 뒤)
//       · 자리가 꽉 차면 받지 않음(seat.ok 거짓) · 다른 기기가 기다리면 번외가 넘김 · 번외가 끄면 내려놓음 · 계정 문서 col2Off면 안 줌
//   ③ 🚚 출고 중(hold.on)이면 hold를 넘기고 seat.ok 거짓 · 자리를 내려놓음(약속 0-1)
//   ④ opLostAt = 운영 세션이 진짜 풀린 시각(rnu-login-lost) — 로그인 모듈이 '로그인됨 → 풀림'에서만 적음
//   ⑤ 로거 크롬·LOGGER PC에서는 안 돎(약속 0) · 번외가 없으면 자리를 내려놓음
//   ⑦ ⏳ 운영이 긴 일을 하는 동안 POST /busy {sec, why}(번외 0.1.9가 그림자 일을 쉼) · 끝나면 {sec: 0} 한 번
//   ⑥ 머리 서명 그대로(split.js 결과 HSIG = 8559039d5a96110b · 머리 바꾼 판 가지에선 8ab2f661d1d8afa8)
//  사용: node tC2ALB.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2ALB — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };

/* 가짜 Firebase — 계정 문서 하나(트랜잭션 · merge는 Firestore처럼 깊이 합침) · 쓰기는 window.__W */
const FB = (a) => { const W = (window.__W = []); const docs = (window.__D = a.docs || {});
  const deep = (o, v) => { const r = { ...(o || {}) }; for (const [k, x] of Object.entries(v || {})) r[k] = x && typeof x === 'object' && !Array.isArray(x) && r[k] && typeof r[k] === 'object' ? deep(r[k], x) : x; return r; };
  const ref = (c, id) => ({ id, c, get: async () => { const v = docs[c + '/' + id]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, set: async (v, o) => { W.push({ c, id, v: JSON.parse(JSON.stringify(v)) }); docs[c + '/' + id] = o && o.merge ? deep(docs[c + '/' + id], v) : v; } });
  const fsx = { collection: (c) => ({ doc: (id) => ref(c, id) }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: (r, v, o) => { r.set(v, o); } }) };
  const firestore = () => fsx; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (seed, helper, docs, pc) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b, h: rq.headers() }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
      window.__LOGS = []; window.__rnLog = (s, lv, m) => window.__LOGS.push(lv + ' ' + m); window.__rnPcName = { get: () => a.pc }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false });
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      (new Function('a', a.fb))(a); }, { seed, fb: `(${FB.toString()})(a)`, docs: docs || {}, pc: pc || 'OFFICE1' });
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };
  const tick = async (p, force) => { await p.evaluate((f) => window.__rnC2alTick && window.__rnC2alTick(f), !!force); await p.waitForTimeout(350); };
  const dev = (p, who) => p.evaluate((w) => { const d = window.__D['app_settings/aladin_login'] || {}; return { dev: (d.dev || {})[w] || null, wait: (d.wait || {})[w] || null }; }, who);
  const AL = { on: true, logger: false, login: 'ok', active: false, seat: false, pp: null };
  const helperOf = (S) => (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL, ...S } } : pth === '/busy' ? { ok: true } : null);

  
  // ── ① 웹앱 없는 사무실 PC — 대신 넘김
  { let PD = null; const helper = (pth) => (pth === '/relay/pending' ? PD : pth === '/relay/answer' || pth === '/relay/ack' ? { ok: true } : pth === '/al/feed' ? { ok: true, al: { ...AL, on: false } } : pth === '/busy' ? { ok: true } : null);
    const docs = { 'prd_listings/aladin_123': { usedCode: 'U1', listingId: '123', status: '판매중', price: 5000, sku: 'PNKa0001EX', qty: 1, buyerName: '손님A', phone: '010-0000-0000' },
      'shp_state/confirm': { at: '2026-11-13T00:00:00Z', tabCounts: { 주문확인요청: 1 }, orders: [{ orderNo: '111-A1', buyer: '손님A', addr: '어딘가', items: [{ listingId: '123', title: 'x' }], deliveryNo: null }] },
      'prd_books/B1': { title: '안 넘김' } };
    PD = { ok: true, kind: 'office', webAt: 0, want: [{ c: 'prd_listings', id: 'aladin_123' }, { c: 'shp_state', id: 'confirm' }, { c: 'prd_books', id: 'B1' }, { c: 'prd_listings', id: '../x' }], out: [{ k: 'k1', c: 'col2_al', id: 'list_20261113-0610', v: { verdict: 'same' } }, { k: 'k2', c: 'prd_listings', id: 'aladin_9', v: { x: 1 } }, { k: 'k3', c: 'col2_al', id: 'op1', op: 1, v: {} }, { k: 'k4', c: 'col2_al', id: 'w1', web: 1, v: {} }] };
    const { p, HL } = await mk({}, helper, docs, 'HOME'); await p.waitForTimeout(200);
    await p.evaluate(() => window.__rnC2rlTick()); await p.waitForTimeout(500);
    const pend = HL.filter((x) => x.p === '/relay/pending'); ok(pend.length === 1, `번외 /relay/pending을 한 번 물음: ${pend.length}`); ok(/encodeURIComponent\('수집기 ' \+ pc\)/.test(BR), "묻는 이름은 '수집기 <PC>'(번외가 웹앱 당김 시각과 섞지 않음)");
    const ans = HL.filter((x) => x.p === '/relay/answer')[0]; const A = ans && ans.b.docs || [];
    ok(A.length === 2 && A.every((d) => d.c === 'prd_listings' || d.c === 'shp_state'), `견줄 운영 칸은 알라딘 그림자 두 칸만(prd_books·이상한 문서 이름 뺌): ${JSON.stringify(A.map((d) => d.c + '/' + d.id))}`);
    ok(ans && !/손님A|010-0000-0000|어딘가|buyer|addr|phone/.test(JSON.stringify(ans.b)), '넘긴 운영 문서에 손님 정보 없음(c2alTrim과 같은 칸)', ans && ans.b);
    const L0 = A.find((d) => d.c === 'prd_listings'); ok(L0 && L0.v.sku === 'PNKa0001EX' && L0.v.qty === 1 && L0.v.status === '판매중', '번호·상태·값은 그대로', L0);
    const S0 = A.find((d) => d.c === 'shp_state'); ok(S0 && S0.v.orders[0].orderNo === '111-A1' && S0.v.orders[0].items[0].listingId === '123' && S0.v.tabCounts.주문확인요청 === 1, '주문확인 화면은 주문번호·상품 번호·탭 수만', S0);
    const ack = HL.filter((x) => x.p === '/relay/ack')[0]; const W = await p.evaluate(() => window.__W);
    ok(ack && ack.b.keys.join(',') === 'k1' && ack.b.errs.k2 && !ack.b.errs.k3 && !ack.b.errs.k4, `결과는 col2_ 칸만 씀(k1) · 운영 칸 거절(k2) · op·web 줄은 웹앱 몫이라 건드리지 않음: ${JSON.stringify(ack && ack.b)}`);
    ok(W.length === 1 && W[0].c === 'col2_al' && W[0].id === 'list_20261113-0610', 'Firestore 쓰기는 col2_al 한 건뿐', W);
    ok((await p.evaluate(() => window.__LOGS.join('\n'))).includes('🛰 이 PC 웹앱이 닫혀 있어'), '기록에 대신 넘긴 것 한 줄');
    // ② 비킴
    const n0 = HL.length; PD = { ...PD, webAt: Date.now() - 30e3 }; await p.evaluate(() => { window.__W.length = 0; }); await p.waitForTimeout(10500); await p.evaluate(() => window.__rnC2rlTick()); await p.waitForTimeout(400);
    ok(HL.slice(n0).filter((x) => x.p === '/relay/answer' || x.p === '/relay/ack').length === 0 && (await p.evaluate(() => window.__W.length)) === 0, '이 PC 웹앱이 3분 안에 왔으면 비킴(웹앱이 넘김)', HL.slice(n0).map((x) => x.p));
    await p.evaluate(() => { window.__HOLD = 1; }); const n1 = HL.length; PD = { ...PD, webAt: 0 }; await p.waitForTimeout(61000); await p.evaluate(() => window.__rnC2rlTick()); await p.waitForTimeout(300);
    ok(!HL.slice(n1).some((x) => x.p === '/relay/pending'), '🚚 출고 중엔 묻지도 않음(약속 0-1)', HL.slice(n1).map((x) => x.p)); await p.context().close(); }
  { const { p, HL } = await mk({}, (pth) => (pth === '/relay/pending' ? { ok: true, kind: 'logger', want: [{ c: 'prd_listings', id: 'aladin_1' }], out: [] } : null), {}, 'LOGGER'); await p.evaluate(() => window.__rnC2rlTick()); await p.waitForTimeout(300);
    ok(!HL.some((x) => x.p === '/relay/pending'), '로거 PC 탭은 이 길을 아예 안 씀(로거 다리 rnC2lg · 약속 0)', HL.map((x) => x.p)); await p.context().close(); }
  // ── ③ 손발 맡김 기록
  { let J = [{ id: 'h1', k: 'chk' }]; const helper = (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL, on: false, own: false }, hands: { on: true, jobs: J.splice(0, 1) } } : pth === '/al/hands' ? { ok: true, n: 1 } : pth === '/busy' ? { ok: true } : null);
    const { p, HL } = await mk({}, helper, {}, 'HOME'); await tick(p); await p.waitForTimeout(600);
    const lg = await p.evaluate(() => window.__LOGS.filter((x) => x.includes('🖐')).join('\n'));
    ok(HL.some((x) => x.p === '/al/hands') && /🖐 번외가 맡긴 샵매니저 읽기\(chk\) 못 함/.test(lg) && /이 탭이 1건 받아 ✓0·✗1/.test(lg), `맡김을 받으면 기록에 🖐 줄(실패는 까닭 · 요약): ${lg}`);
    J = [{ id: 'h2', k: 'chk' }]; await tick(p); await p.waitForTimeout(600); const lg2 = await p.evaluate(() => window.__LOGS.filter((x) => x.includes('🖐 번외가 맡긴')).length);
    ok(lg2 === 2, `같은 까닭 실패는 10분·요약은 30분에 한 번만(기록이 넘치지 않게): ${lg2}`); await p.context().close(); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tFIX1113 ${bad}개 실패` : '✅ tFIX1113 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tFIX1113 오류', e); process.exit(1); });
