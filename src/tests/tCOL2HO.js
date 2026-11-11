/* tCOL2HO — (11/11 col2rep2 · 약속 38·48 '번외로 모두 바꾸기 ⑤ 일 하나씩 넘기기') 🔀 번외로 넘기기 — 웹앱 쪽
 *  ① 넘기지 않았으면 번외가 맡긴 운영 칸 쓰기(op)를 거절(쓰지 않음) · col2_* 칸은 예전처럼
 *  ② ⚙ › 🔀 번외로 넘기기: 최근 3일 그림자(col2_jday)에서 '넘길 수 있음'인 일 · 쓰는 길이 있는 일만 [넘기기] · 두 번 눌러야 넘김(브라우저 팝업 없음) · 기록 한 줄
 *  ③ 넘긴 뒤: 이 PC로 넘긴 KPIPA만 mkt_kpipa에 씀(정한 칸만 · 쓴 이 '번외 <PC>' · 옛 값은 history) · 다른 칸·다른 꼴 문서·정하지 않은 칸은 안 씀 · 번외에 넘김 상태를 넘겨줌 · 소식(beat) 적음
 *  ④ [되돌리기] 두 번 → on:false · 그 뒤 운영 칸 쓰기 거절 · 웹앱 넘김 표 = lab/col2/shadow/col2-handoff.js 표
 *  ⑤ (11/11 col2rep3) 국중(운영 extSave와 같게: 같으면 확인 시각만 · 바뀌면 옛 값 ext_hist 뒤 · 색인) · 새상품 없는 시세(이미 본 상품만 · 판 보관 · history) · 환율(없을 때만 · 수출입은행만)
 * 실행: cd pw && RN_PORT=<포트> node tCOL2HO.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path');
const find = (rel) => [path.join(__dirname, '..', rel), path.join(__dirname, '../..', rel), path.join('/home/user/wk-col2rep2', rel), path.join('/home/user/readnow-scripts', rel)].find((p) => fs.existsSync(p));
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let outNow = []; const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' }; let beat = {};
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const o = outNow; outNow = []; return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: o, hot: false, pc: 'JS-MAIN', pcSrc: 'web', ver: '0.1.24', kind: 'office', handBeat: beat, handAt: 0 }); }
    return J({ ok: true }); });
  const kday = (d) => new Date(Date.now() + 9 * 3600e3 - (d || 0) * 864e5).toISOString().slice(0, 10);
  const op = (id, extra) => ({ k: 'p' + id, c: 'mkt_kpipa', id, op: true, job: 'kpipa', merge: true, v: { date: id.slice(0, 4) + '-' + id.slice(4, 6) + '-' + id.slice(6), onOff: { series: { 온라인: { qty: 3, titles: 2, amt: 9000 } }, at: '2026-11-11T07:00:00Z' }, secret: 'x' }, hist: { at: '2026-11-11T07:00:00Z', type: 'onOff', old: { 온라인: { qty: 1, titles: 1, amt: 1 } } }, ...(extra || {}) });
  await p.evaluate(async ({ d0, d1 }) => { localStorage.setItem('rn-device', 'JS-MAIN'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    const T = (n, same, can, un) => ({ name: n, n: same, same, diff: 0, un: un || 0, fail: 0, pass: { n: same, can, why: can ? '넘길 수 있음' : '표본 모자람' } });
    await db.collection('col2_jday').doc(d0 + '_JS-MAIN').set({ d: d0, pc: 'JS-MAIN', tasks: { kpipa: T('📚 출판 판매 통계(KPIPA)', 14, true), 'ext.nl': T('🔎 국립중앙도서관 ISBN 서지', 20, false), product: T('📘 공개 상품 화면', 583, false, 38) } });
    await db.collection('col2_jday').doc(d0 + '_HOME').set({ d: d0, pc: 'HOME', tasks: { kpipa: T('📚 출판 판매 통계(KPIPA)', 28, true), 'ext.nl': T('🔎 국립중앙도서관 ISBN 서지', 40, true) } });
    await db.collection('col2_jday').doc(d1 + '_HOME').set({ d: d1, pc: 'HOME', tasks: { 'ext.nl': T('🔎 국립중앙도서관 ISBN 서지', 5, true) } });
    await db.collection('mkt_kpipa').doc('20261105').set({ date: '2026-11-05', onOff: { series: { 온라인: { qty: 1, titles: 1, amt: 1 } }, at: '2026-11-10T00:00:00Z' } }); }, { d0: kday(0), d1: kday(1) });
  const tick = async () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  /* ① 넘기기 전 */
  outNow = [op('20261105'), { k: 'c1', c: 'col2_jobs', id: 'kpipa_x', v: { a: 1 } }]; await tick();
  let st = await p.evaluate(() => ({ kp: __FS.mkt_kpipa && __FS.mkt_kpipa['20261105'], c2: __FS.col2_jobs && __FS.col2_jobs.kpipa_x }));
  let ack = calls.filter((c) => c.p === '/relay/ack').slice(-1)[0];
  ok(st.kp && st.kp.onOff.series.온라인.qty === 1 && !st.kp.writer && st.c2 && ack && ack.b.keys.includes('c1') && /이 PC로 넘긴 일이 아님/.test(ack.b.errs.p20261105 || ''), '① 넘기기 전엔 운영 칸 쓰기를 거절 · col2_ 칸은 예전처럼', { st, ack: ack && ack.b });
  /* ② ⚙ 칸 */
  const ui = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S.sec.set_c2ho = true; const m = document.createElement('div'); m.id = 'c2hoT'; document.body.appendChild(m); renderSettings(m); await sl(900); /* 설정 화면 그대로(renderSettings) */ const box = document.getElementById('c2ho_box'); if (!box) return { none: true }; c2HoLoad(true); await sl(600); c2HoRedraw(); await sl(200);
    const b = box.querySelector('[data-c2hoon="kpipa"]'); const t = box.innerText; return { t, btn: b ? b.dataset.c2hopc : null, nl: /국립중앙도서관/.test(t), nlBtn: !!box.querySelector('[data-c2hoon="ext.nl"]'), prod: /공개 상품 화면/.test(t) }; });
  ok(ui.btn === 'HOME' && ui.nl && ui.nlBtn && !ui.prod && /넘긴 일 없음/.test(ui.t), "② 후보 = '넘길 수 있음'·까닭 모를 다름 0인 일 · KPIPA [HOME로 넘기기](표본 많은 PC) · 국중도 (11/11 col2rep3) 쓰는 길이 생겨 [넘기기] · 까닭 모를 다름 있는 상품 화면은 빠짐", ui);
  /* 이 시험 PC(JS-MAIN)로 넘김 — 단추 PC 이름을 바꿔 두 번 누름 */
  const tw = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); const b = document.querySelector('#c2ho_box [data-c2hoon="kpipa"]'); b.dataset.c2hopc = 'JS-MAIN'; b.click(); await sl(600); const one = !!(__FS.app_settings && __FS.app_settings.col2_handoff && __FS.app_settings.col2_handoff.jobs); const armed = b.classList.contains('ux2-armed'); b.click(); await sl(900);
    const d = __FS.app_settings.col2_handoff; return { one, armed, d: JSON.parse(JSON.stringify(d || {})) }; });
  ok(!tw.one && tw.armed && tw.d.jobs && tw.d.jobs.kpipa.on === true && tw.d.jobs.kpipa.pc === 'JS-MAIN' && tw.d.log && tw.d.log[0].on === true, '② 한 번 누르면 무장만 · 두 번째에 넘김(app_settings/col2_handoff · 기록 한 줄)', tw);
  /* ③ 넘긴 뒤 */
  beat = { kpipa: Date.now() }; outNow = [op('20261105'), op('20261106', { c: 'prd_books' }), op('2026-11-07'), op('20261108', { job: 'ext.zz' })]; await tick(); await tick();
  st = await p.evaluate(() => ({ kp: JSON.parse(JSON.stringify(__FS.mkt_kpipa || {})), books: !!(__FS.prd_books && __FS.prd_books['20261106']), ho: JSON.parse(JSON.stringify(__FS.app_settings.col2_handoff)) }));
  const k5 = st.kp['20261105'] || {}; ack = calls.filter((c) => c.p === '/relay/ack' && c.b.keys.includes('p20261105')).slice(-1)[0]; const ans = calls.filter((c) => c.p === '/relay/answer' && c.b.handoff).slice(-1)[0];
  ok(k5.onOff && k5.onOff.series.온라인.qty === 3 && k5.writer === '번외 JS-MAIN' && Array.isArray(k5.history) && k5.history[0].old.온라인.qty === 1 && k5.secret === undefined, '③ 이 PC로 넘긴 KPIPA는 mkt_kpipa에 씀 — 정한 칸만 · 쓴 이 번외 JS-MAIN · 옛 값은 history', k5);
  ok(!st.books && !st.kp['2026-11-07'] && !st.kp['20261108'] && ack && /mkt_kpipa 칸/.test(ack.b.errs.p20261106 || '') && ack.b.errs['p2026-11-07'] && /넘김 표에 없는 일/.test(ack.b.errs.p20261108 || ''), '③ 다른 칸(prd_books)·다른 꼴 문서 이름·넘김 표에 없는 일은 쓰지 않음', ack && ack.b);
  ok(ans && ans.b.handoff.jobs.kpipa.on === true && ans.b.handoff.jobs.kpipa.pc === 'JS-MAIN' && st.ho.jobs.kpipa.beat, '③ 번외에 넘김 상태를 넘겨줌 · 맡은 번외 소식(beat)을 문서에 적음(운영 수집기가 살아 있음을 봄)', { h: ans && ans.b.handoff, beat: st.ho.jobs.kpipa.beat });
  /* ④ 되돌리기 */
  const back = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); c2HoRedraw(); await sl(200); const b = document.querySelector('#c2ho_box [data-c2hooff="kpipa"]'); if (!b) return { none: true }; b.click(); await sl(600); b.click(); await sl(900); return { d: JSON.parse(JSON.stringify(__FS.app_settings.col2_handoff)) }; });
  outNow = [op('20261109')]; await tick(); st = await p.evaluate(() => !!(__FS.mkt_kpipa && __FS.mkt_kpipa['20261109']));
  ok(back.d && back.d.jobs.kpipa.on === false && back.d.log[0].on === false && !st, '④ [되돌리기] 두 번 → on:false · 그 뒤 운영 칸 쓰기 거절', back);
  /* ⑤ 국중·시세·환율 — 이 PC(JS-MAIN)로 넘긴 뒤 */
  const now = Date.now(); const ISBN = '9788937460449';
  const sig5 = await p.evaluate(async ({ ISBN }) => { const X = window.ReadnowExt; const dA = { title: '데미안', publisher: '민음사' }, dB = { title: '데미안', publisher: '민음사(고침)' };
    const at = new Date().toISOString(); const jobs = {}; for (const k of ['ext.nl', 'nbMarket', 'ext.fx']) jobs[k] = { on: true, pc: 'JS-MAIN', at, by: '시험', beat: null };
    await db.collection('app_settings').doc('col2_handoff').set({ jobs }, { merge: true });
    await db.collection('ext_basic').doc(ISBN).set({ isbn: ISBN, title: '데미안', src: { nl: { at: '2026-07-01T00:00:00.000Z', chk: '2026-07-01T00:00:00.000Z', sig: X.sig({ none: false, d: dA }, 'nl'), none: false, d: dA, by: 'LOGGER' }, kyobo: { at: '2026-07-01T00:00:00.000Z', sig: 'k' } } });
    await db.collection('prd_market_nobook').doc('U1').set({ usedCode: 'U1', title: '세트 상품', at: '2026-11-01T00:00:00Z', src: 'usedSearch', candSig: 'old', sig: '9000|8000|3', history: [{ at: '2026-11-01T00:00:00Z', median: 9000, low: 8000, n: 3, our: 10000 }] });
    await db.collection('ext_fx').doc('2026-11-10').set({ date: '2026-11-10', rates: { USD: 1300 }, src: 'koreaexim', at: 'x', by: 'LOGGER' });
    await new Promise((r) => setTimeout(r, 400)); return { A: X.sig({ none: false, d: dA }, 'nl'), B: X.sig({ none: false, d: dB }, 'nl'), dA, dB }; }, { ISBN });
  const nl = (id, d, sig, k) => ({ k, c: 'ext_basic', id, op: true, job: 'ext.nl', merge: true, v: { obj: { at: '2026-11-11T08:00:00.000Z', chk: '2026-11-11T08:00:00.000Z', sig, none: false, d, by: '번외 JS-MAIN', q: null }, title: '데미안', author: null } });
  const mainNb = (cs) => ({ usedCode: 'U1', title: '세트 상품', query: '세트', at: '2026-11-11T08:00:00.000Z', src: 'usedSearch', cands: [{ itemId: 1, price: 7000 }], candSig: cs, market: { median: 7000, low: 7000, n: 1 } });
  /* 같은 지문 → 확인 시각만 */
  beat = { 'ext.nl': now, nbMarket: now, 'ext.fx': now }; outNow = [nl(ISBN, sig5.dA, sig5.A, 'n1')]; await tick(); await tick();
  let s5 = await p.evaluate(({ ISBN }) => JSON.parse(JSON.stringify({ b: __FS.ext_basic[ISBN], h: Object.keys(__FS.ext_hist || {}), ix: __FS.ext_index || {} })), { ISBN });
  ok(s5.b.src.nl.chk === '2026-11-11T08:00:00.000Z' && s5.b.src.nl.at === '2026-07-01T00:00:00.000Z' && s5.b.src.nl.by === 'LOGGER' && !s5.h.length && s5.b.src.kyobo.sig === 'k' && s5.ix['nl_' + (49 % 8)] && s5.ix['nl_' + (49 % 8)].m[ISBN], '⑤ 국중 같은 지문 → 확인 시각(chk)만 · 옛 값 보관 없음 · 다른 출처 칸 그대로 · 출처 색인(ext_index/nl_<조각>)', s5);
  /* 바뀐 값 → 옛 값 ext_hist 먼저 · 그 뒤 바꿈 · 새 책은 새 문서 */
  outNow = [nl(ISBN, sig5.dB, sig5.B, 'n2'), nl('9780141439518', sig5.dA, sig5.A, 'n3'), nl('12345', sig5.dA, sig5.A, 'n4'), { ...nl(ISBN, sig5.dB, '', 'n5') }]; await tick(); await tick();
  s5 = await p.evaluate(({ ISBN }) => JSON.parse(JSON.stringify({ b: __FS.ext_basic[ISBN], n: __FS.ext_basic['9780141439518'], h: __FS.ext_hist || {} })), { ISBN }); const hk = Object.keys(s5.h); ack = calls.filter((c) => c.p === '/relay/ack' && c.b.keys.includes('n2')).slice(-1)[0];
  ok(hk.length === 1 && s5.h[hk[0]].src === 'nl' && s5.h[hk[0]].d.publisher === '민음사' && s5.b.src.nl.d.publisher === '민음사(고침)' && s5.b.src.nl.by === '번외 JS-MAIN' && s5.b.src.nl.sig === sig5.B, '⑤ 국중 바뀐 값 → 옛 값을 ext_hist에 남긴 뒤 바꿈(쓴 이 번외 JS-MAIN)', { hk, b: s5.b.src.nl });
  ok(s5.n && s5.n.src.nl.d.title === '데미안' && ack && ack.b.errs.n4 && /지문/.test(ack.b.errs.n5 || ''), '⑤ 새 책은 새 문서 · ISBN 꼴이 아니거나 지문 없는 결과는 안 씀', ack && ack.b);
  /* 시세 — 이미 본 상품만 · 후보가 바뀌면 판 보관 · 시세가 바뀌면 history */
  outNow = [{ k: 'b1', c: 'prd_market_nobook', id: 'U1', op: true, job: 'nbMarket', merge: true, v: { main: mainNb('new'), vdoc: { at: '2026-11-11T08:00:00.000Z', query: '세트', cands: [{ itemId: 1, price: 7000 }], market: { median: 7000 } }, sig: '7000|7000|1', hist: { at: '2026-11-11T08:00:00.000Z', median: 7000, low: 7000, n: 1, our: 10000 } } },
    { k: 'b2', c: 'prd_market_nobook', id: 'U2', op: true, job: 'nbMarket', merge: true, v: { main: mainNb('x'), vdoc: null, sig: '1|1|1', hist: null } }]; await tick(); await tick();
  s5 = await p.evaluate(() => JSON.parse(JSON.stringify({ u1: __FS.prd_market_nobook.U1, u2: __FS.prd_market_nobook.U2 || null, all: Object.keys(__FS).filter((k) => /prd_market_nobook/.test(k)), raw: Object.keys(__FS.prd_market_nobook || {}) }))); ack = calls.filter((c) => c.p === '/relay/ack' && c.b.keys.includes('b1')).slice(-1)[0];
  const vKeys = await p.evaluate(() => JSON.stringify(Object.keys(__FS).filter((k) => /nobook/.test(k)).map((k) => [k, Object.keys(__FS[k] || {})])));
  ok(s5.u1.candSig === 'new' && s5.u1.sig === '7000|7000|1' && Array.isArray(s5.u1.history) && s5.u1.history.length === 2 && s5.u1.history[1].median === 7000 && s5.u1.writer === '번외 JS-MAIN' && /v/.test(vKeys), '⑤ 시세: 다시 본 값 · 시세가 바뀌어 history 한 줄 더함 · 후보가 바뀌어 판(v) 보관', { u1: s5.u1, vKeys });
  ok(!s5.u2 && ack && /처음 보는 상품은 운영/.test(ack.b.errs.b2 || ''), '⑤ 시세: 처음 보는 상품은 운영이 씀(번외는 안 씀)', ack && ack.b);
  /* 환율 — 없을 때만 · 수출입은행만 */
  const fx = (id, src, k) => ({ k, c: 'ext_fx', id, op: true, job: 'ext.fx', merge: true, v: { date: id, rates: { USD: 1343.3, EUR: 1500 }, src, warn: null } });
  outNow = [fx('2026-11-11', 'koreaexim', 'f1'), fx('2026-11-10', 'koreaexim', 'f2'), fx('2026-11-09', 'frankfurter', 'f3')]; await tick(); await tick();
  s5 = await p.evaluate(() => JSON.parse(JSON.stringify({ a: __FS.ext_fx['2026-11-11'], b: __FS.ext_fx['2026-11-10'], c: __FS.ext_fx['2026-11-09'] || null, run: (__FS.app_settings.ext_run || {}).fx || null }))); ack = calls.filter((c) => c.p === '/relay/ack' && c.b.keys.includes('f1')).slice(-1)[0];
  ok(s5.a && s5.a.rates.USD === 1343.3 && s5.a.by === '번외 JS-MAIN' && s5.b.rates.USD === 1300 && s5.b.by === 'LOGGER' && !s5.c && ack && /koreaexim/.test(ack.b.errs.f3 || '') && s5.run && s5.run.usd === 1343.3, '⑤ 환율: 없는 날만 만듦 · 있는 날은 그대로 · frankfurter 출처는 안 씀 · ext_run 환율 상태 줄', { s5, ack: ack && ack.b });
  const T = await p.evaluate(() => JSON.stringify(C2HO_JOBS)); const HOF = require(find('lab/col2/shadow/col2-handoff.js')); const W = JSON.parse(T);
  ok(Object.keys(W).length && Object.entries(W).every(([k, j]) => HOF.JOBS[k] && HOF.JOBS[k].col === j.col && HOF.JOBS[k].idRe === j.idRe && JSON.stringify(HOF.JOBS[k].fields) === JSON.stringify(j.fields) && HOF.JOBS[k].beatMaxH === j.beatMaxH && (HOF.JOBS[k].mode || null) === (j.mode || null) && (HOF.JOBS[k].srcOnly || null) === (j.srcOnly || null)) && Object.keys(HOF.JOBS).every((k) => W[k]), '④ 웹앱 넘김 표 = lab/col2/shadow/col2-handoff.js 표(칸·문서 꼴·칸 이름·소식 시간)', { W, H: HOF.JOBS });
  const pops = await p.evaluate(() => (window.__alerts || []).length || 0); ok(!pops, '브라우저 팝업 없음');
  console.log(bad ? `✗ tCOL2HO: ${bad}개 실패` : '✓ tCOL2HO 모두 통과'); if (bad) process.exitCode = 1;
}, { noFriend: true });
