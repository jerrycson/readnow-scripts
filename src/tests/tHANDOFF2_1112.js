/* tHANDOFF2_1112 — (11/12 handoff2 · 리드 '묶음째 넘기기') 🔀 번외로 넘기기 — 웹앱 쪽 묶음·로거 칸
 *  ① ⚙ › 🔀 번외로 넘기기: 📦 묶음째 넘기기(규칙 파일 lab/col2/shadow/col2-handoff.js를 그 자리에서 불러옴) — 묶음마다 넘김·넘길 수 있음·그림자 중·막힘 수와 일마다 까닭
 *  ② [🔀 묶음 넘기기] 한 번 = 무장만 · 두 번째에 그 묶음의 '넘길 수 있음' 일만 한 번에(일마다 맡을 PC · 기록 한 줄씩) · 로거 칸 일은 LOGGER에게
 *  ③ 로거 PC 웹앱: 번외에 넘겨주는 넘김 상태는 로거 칸 일만(약속 0) · 넘긴 👥 구매자 분포를 운영 dynOne 규칙으로 prd_book_metrics·prd_dyn_history에 씀 · 🏪 숍 요약은 sellers·seller_history·seller_rev6m·모으기 줄 · 정한 칸 밖은 거절
 *  ④ [↩ 묶음 되돌리기] 두 번 → 그 묶음 넘긴 일 모두 on:false · 그 뒤 쓰기 거절
 * 실행: cd pw && RN_PORT=<포트> node tHANDOFF2_1112.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 900) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let outNow = []; let me = 'JS-MAIN'; let beat = {}; const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const o = outNow; outNow = []; return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: o, hot: false, pc: me, pcSrc: 'web', ver: '0.1.41', kind: me === 'LOGGER' ? 'logger' : 'office', handBeat: beat, handAt: 0 }); }
    return J({ ok: true }); });
  const kd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  await p.evaluate(async ({ d0 }) => { localStorage.setItem('rn-device', 'JS-MAIN'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    const T = (n, k, can, un, why) => ({ name: n, n: k, same: k - (un || 0), diff: un || 0, un: un || 0, fail: 0, pass: { n: k, can, why: why || (can ? '넘길 수 있음' : '표본 모자람') } }); const at = new Date().toISOString();
    await db.collection('col2_jday').doc(d0 + '_LOGGER').set({ d: d0, pc: 'LOGGER', kind: 'logger', ver: '0.1.41', at, tasks: { dynamic: T('👥 구매자 분포', 40, true), shopSum: T('🏪 숍 요약', 40, true), bench: T('🎯 벤치마킹', 60, true) } });
    await db.collection('col2_jday').doc(d0 + '_HOME').set({ d: d0, pc: 'HOME', kind: 'office', ver: '0.1.41', at, tasks: { 'ext.lib': T('🔎 도서관 정보나루', 35, true), 'ext.kakao': T('🔎 카카오', 27, false, 1, '표본 27/30 · 까닭 모를 다름 1'), shopSum: T('🏪 숍 요약', 50, true) } }); }, { d0: kd });
  const tick = async () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  /* ① 묶음 보기 */
  const ui = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S.sec.set_c2ho = true; const m = document.createElement('div'); m.id = 'c2hoT'; document.body.appendChild(m); renderSettings(m); await sl(900); const box = document.getElementById('c2ho_box'); if (!box) return { none: true }; c2HoLoad(true);
    for (let i = 0; i < 30 && !box.querySelector('.c2hobun'); i++) await sl(200); box.querySelectorAll('details.c2hobun').forEach((d) => (d.open = true)); const t = box.innerText;
    return { t, lib: !!(window.Col2Handoff && window.Col2Handoff.bundleView), bun: box.querySelectorAll('.c2hobun').length, lgBtn: (box.querySelector('[data-c2hobon="lg"]') || {}).textContent || null, extBtn: (box.querySelector('[data-c2hobon="ext"]') || {}).textContent || null, alBtn: !!box.querySelector('[data-c2hobon="alr"]') }; });
  ok(ui.lib && ui.bun === 4 && /📦 묶음째 넘기기/.test(ui.t) && /로거 고유 일/.test(ui.t) && /알라딘 샵매니저 읽기/.test(ui.t), '① 규칙 파일을 불러와 📦 묶음 4개(로거·외부 정보·알라딘 공개 화면·알라딘 읽기)', { lib: ui.lib, bun: ui.bun });
  ok(/묶음 넘기기 \(2가지\)/.test(ui.lgBtn || '') && /묶음 넘기기 \(1가지\)/.test(ui.extBtn || '') && !ui.alBtn, "① 로거 묶음 '넘길 수 있음' 2가지(구매자 분포·숍 요약 — 벤치마킹은 끝까지 읽기 표본이 아직 없음) · 외부 묶음 1가지(정보나루) · 알라딘 읽기는 넘길 것 없음", ui);
  ok(/⛔ 막힘/.test(ui.t) && /숍 목록 끝까지/.test(ui.t) && /까닭 모를 다름 1/.test(ui.t) && /42FB/.test(ui.t) && /W15/.test(ui.t), '① 일마다 까닭: 벤치마킹은 (11/12 handoff3부터) 끝까지 읽기 길이 있어 그림자 중(첫 쪽 그림자 표본은 넘김 판정에 안 셈) · 카카오 그림자 중(까닭 모를 다름) · 알라딘 읽기 로그인 필요(42FB) · 매입가 조회는 쓰기 W15와 함께');
  /* ② 묶음 넘기기 두 번 */
  const tw = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); const b = document.querySelector('#c2ho_box [data-c2hobon="lg"]'); b.click(); await sl(500); const one = !!(__FS.app_settings && __FS.app_settings.col2_handoff); const b2 = document.querySelector("#c2ho_box [data-c2hobon=\"lg\"]"); const armed = b2.classList.contains("ux2-armed"); const same = b2 === b; b2.click(); await sl(900);
    return { one, armed, d: JSON.parse(JSON.stringify((__FS.app_settings && __FS.app_settings.col2_handoff) || {})) }; });
  ok(!tw.one && tw.armed && tw.d.jobs && tw.d.jobs.dynamic.on === true && tw.d.jobs.dynamic.pc === 'LOGGER' && tw.d.jobs.shopSum.pc === 'LOGGER' && !tw.d.jobs.bench && tw.d.log.length === 2, '② 한 번 = 무장만 · 두 번째 = 로거 묶음 2가지를 LOGGER로 한 번에(숍 요약은 HOME 표본이 더 많아도 로거 칸 · 기록 2줄)', tw);
  /* 사무실 일도 하나 넘겨 둠(로거에 안 가야 함) */
  await p.evaluate(async () => { await db.collection('app_settings').doc('col2_handoff').set({ jobs: { 'ext.lib': { on: true, pc: 'HOME', at: new Date().toISOString() } } }, { merge: true }); await new Promise((r) => setTimeout(r, 300)); });
  /* ③ 로거 PC 웹앱 */
  me = 'LOGGER'; await p.evaluate(async () => { localStorage.setItem('rn-device', 'LOGGER'); S._c2hoSent = null;
    await db.collection('prd_dyn_history').doc('b1').set({ bookId: 'b1', lastSig: 'old', snaps: [] }); await db.collection('sellers').doc('sc_123').set({ sc: '123', name: '가게', shopSig: 'old' }); await db.collection('app_settings').doc('seller_queue').set({ sc: ['123', '9'] }); });
  const dyn = { buyerDist: { '20대': 40 }, relationBuy: [{ title: '가', aladinItemId: '11' }], clickRelation: [], clickRaw: null, dynamicLoaded: true };
  const shop = { status: 'ok', rev6m: 120, rev6mLt3: false, periods: { m1: 20 }, total: 900, totalLt3: false, grade: '플래티넘', isPro: true, cancel3m: 0.4 };
  beat = { dynamic: Date.now(), shopSum: Date.now() };
  outNow = [{ k: 'd1', c: 'prd_book_metrics', id: 'b1', op: true, job: 'dynamic', merge: true, v: { dyn } }, { k: 's1', c: 'sellers', id: 'sc_123', op: true, job: 'shopSum', merge: true, v: { shop, ver: '1.3.5' } },
    { k: 'x1', c: 'prd_books', id: 'b1', op: true, job: 'dynamic', merge: true, v: { dyn } }, { k: 'x2', c: 'prd_book_metrics', id: 'b2', op: true, job: 'dynamic', merge: true, v: { dyn: 'nope' } }, { k: 'x3', c: 'ext_lib', id: '9788937460449', op: true, job: 'ext.lib', merge: true, v: { obj: { sig: 'a' } } }];
  await tick(); await tick();
  const st = await p.evaluate(() => JSON.parse(JSON.stringify({ m: (__FS.prd_book_metrics || {}).b1, h: (__FS.prd_dyn_history || {}).b1, s: (__FS.sellers || {}).sc_123, sh: Object.keys(__FS.seller_history || {}), r6: (__FS.seller_rev6m || {}).sc_123, q: (__FS.app_settings || {}).seller_queue, books: !!(__FS.prd_books && __FS.prd_books.b1), lib: !!(__FS.ext_lib && __FS.ext_lib['9788937460449']) })));
  const ack = calls.filter((c) => c.p === '/relay/ack' && c.b && c.b.keys.includes('d1')).slice(-1)[0]; const ans = calls.filter((c) => c.p === '/relay/answer' && c.b && c.b.handoff).slice(-1)[0];
  ok(st.m && st.m.dynAt && st.m.relationBuy[0] === '가' && st.m.dynamicPending === false && st.m.writer === '번외 LOGGER' && st.h && st.h.lastSig !== 'old' && st.h.snaps.length === 1, '③ 👥 넘긴 구매자 분포 → prd_book_metrics(운영 dynOne 칸 · 쓴 이 번외 LOGGER) · 지문이 바뀌어 prd_dyn_history 한 줄', st);
  ok(st.s && st.s.rev6m === 120 && st.s.rev6mAt && st.s.name === '가게' && st.sh.length === 1 && st.r6 && Object.values(st.r6.days)[0] === 120 && (Array.isArray(st.q.sc) ? st.q.sc.join() === '9' : JSON.stringify(st.q.sc) === JSON.stringify({ __ar: ['123'] })) /* 시험 틀 가짜 Firebase는 arrayRemove를 표시로만 남김 */, '③ 🏪 넘긴 숍 요약 → sellers(다른 칸 그대로) · seller_history 한 판 · seller_rev6m · 모으기 줄에서 뺌', st);
  ok(!st.books && !st.lib && ack && /칸 정한 문서만|칸에만/.test(ack.b.errs.x1 || '') && /꼴이 다름/.test(ack.b.errs.x2 || '') && /이 PC로 넘긴 일이 아님/.test(ack.b.errs.x3 || ''), '③ 정한 칸 밖(prd_books)·값 꼴이 다른 것·이 PC로 넘기지 않은 일(정보나루 = HOME)은 거절', ack && ack.b);
  ok(ans && ans.b.handoff && Object.keys(ans.b.handoff.jobs).sort().join() === 'dynamic,shopSum', '③ 로거 번외에 넘겨주는 넘김 상태는 로거 칸 일만(사무실 일·PC 이름 안 감 · 약속 0)', ans && ans.b.handoff);
  /* ④ 묶음 되돌리기 */
  const back = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); localStorage.setItem('rn-device', 'JS-MAIN'); c2HoRedraw(); await sl(300); const b = document.querySelector('#c2ho_box [data-c2hoboff="lg"]'); if (!b) return { none: true }; b.click(); await sl(500); b.click(); await sl(900); return { d: JSON.parse(JSON.stringify(__FS.app_settings.col2_handoff)) }; });
  ok(back.d && back.d.jobs.dynamic.on === false && back.d.jobs.shopSum.on === false && back.d.jobs['ext.lib'].on === true && back.d.log[0].on === false, '④ [↩ 묶음 되돌리기] 두 번 → 로거 묶음만 on:false(다른 묶음 그대로)', back);
  me = 'LOGGER'; await p.evaluate(() => localStorage.setItem('rn-device', 'LOGGER')); outNow = [{ k: 'd9', c: 'prd_book_metrics', id: 'b9', op: true, job: 'dynamic', merge: true, v: { dyn } }]; await tick();
  ok(!(await p.evaluate(() => !!(__FS.prd_book_metrics && __FS.prd_book_metrics.b9))), '④ 되돌린 뒤엔 운영 칸 쓰기 거절');
  console.log(bad ? `✗ tHANDOFF2_1112 실패 ${bad}` : '✓ tHANDOFF2_1112 모두 통과');
}, {});
