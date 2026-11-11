/* tCOL2HO — (11/11 col2rep2 · 약속 38·48 '번외로 모두 바꾸기 ⑤ 일 하나씩 넘기기') 🔀 번외로 넘기기 — 웹앱 쪽
 *  ① 넘기지 않았으면 번외가 맡긴 운영 칸 쓰기(op)를 거절(쓰지 않음) · col2_* 칸은 예전처럼
 *  ② ⚙ › 🔀 번외로 넘기기: 최근 3일 그림자(col2_jday)에서 '넘길 수 있음'인 일 · 쓰는 길이 있는 일만 [넘기기] · 두 번 눌러야 넘김(브라우저 팝업 없음) · 기록 한 줄
 *  ③ 넘긴 뒤: 이 PC로 넘긴 KPIPA만 mkt_kpipa에 씀(정한 칸만 · 쓴 이 '번외 <PC>' · 옛 값은 history) · 다른 칸·다른 꼴 문서·정하지 않은 칸은 안 씀 · 번외에 넘김 상태를 넘겨줌 · 소식(beat) 적음
 *  ④ [되돌리기] 두 번 → on:false · 그 뒤 운영 칸 쓰기 거절 · 웹앱 넘김 표 = lab/col2/shadow/col2-handoff.js 표
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
  ok(ui.btn === 'HOME' && ui.nl && !ui.nlBtn && !ui.prod && /넘긴 일 없음/.test(ui.t), "② 후보 = '넘길 수 있음'·까닭 모를 다름 0인 일 · KPIPA [HOME로 넘기기](표본 많은 PC) · 국중은 쓰는 길 아직 없음 · 까닭 모를 다름 있는 상품 화면은 빠짐", ui);
  /* 이 시험 PC(JS-MAIN)로 넘김 — 단추 PC 이름을 바꿔 두 번 누름 */
  const tw = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); const b = document.querySelector('#c2ho_box [data-c2hoon="kpipa"]'); b.dataset.c2hopc = 'JS-MAIN'; b.click(); await sl(600); const one = !!(__FS.app_settings && __FS.app_settings.col2_handoff && __FS.app_settings.col2_handoff.jobs); const armed = b.classList.contains('ux2-armed'); b.click(); await sl(900);
    const d = __FS.app_settings.col2_handoff; return { one, armed, d: JSON.parse(JSON.stringify(d || {})) }; });
  ok(!tw.one && tw.armed && tw.d.jobs && tw.d.jobs.kpipa.on === true && tw.d.jobs.kpipa.pc === 'JS-MAIN' && tw.d.log && tw.d.log[0].on === true, '② 한 번 누르면 무장만 · 두 번째에 넘김(app_settings/col2_handoff · 기록 한 줄)', tw);
  /* ③ 넘긴 뒤 */
  beat = { kpipa: Date.now() }; outNow = [op('20261105'), op('20261106', { c: 'prd_books' }), op('2026-11-07'), op('20261108', { job: 'ext.nl' })]; await tick(); await tick();
  st = await p.evaluate(() => ({ kp: JSON.parse(JSON.stringify(__FS.mkt_kpipa || {})), books: !!(__FS.prd_books && __FS.prd_books['20261106']), ho: JSON.parse(JSON.stringify(__FS.app_settings.col2_handoff)) }));
  const k5 = st.kp['20261105'] || {}; ack = calls.filter((c) => c.p === '/relay/ack' && c.b.keys.includes('p20261105')).slice(-1)[0]; const ans = calls.filter((c) => c.p === '/relay/answer' && c.b.handoff).slice(-1)[0];
  ok(k5.onOff && k5.onOff.series.온라인.qty === 3 && k5.writer === '번외 JS-MAIN' && Array.isArray(k5.history) && k5.history[0].old.온라인.qty === 1 && k5.secret === undefined, '③ 이 PC로 넘긴 KPIPA는 mkt_kpipa에 씀 — 정한 칸만 · 쓴 이 번외 JS-MAIN · 옛 값은 history', k5);
  ok(!st.books && !st.kp['2026-11-07'] && !st.kp['20261108'] && ack && /mkt_kpipa 칸/.test(ack.b.errs.p20261106 || '') && ack.b.errs['p2026-11-07'] && /넘김 표에 없는 일/.test(ack.b.errs.p20261108 || ''), '③ 다른 칸(prd_books)·다른 꼴 문서 이름·넘김 표에 없는 일은 쓰지 않음', ack && ack.b);
  ok(ans && ans.b.handoff.jobs.kpipa.on === true && ans.b.handoff.jobs.kpipa.pc === 'JS-MAIN' && st.ho.jobs.kpipa.beat, '③ 번외에 넘김 상태를 넘겨줌 · 맡은 번외 소식(beat)을 문서에 적음(운영 수집기가 살아 있음을 봄)', { h: ans && ans.b.handoff, beat: st.ho.jobs.kpipa.beat });
  /* ④ 되돌리기 */
  const back = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); c2HoRedraw(); await sl(200); const b = document.querySelector('#c2ho_box [data-c2hooff="kpipa"]'); if (!b) return { none: true }; b.click(); await sl(600); b.click(); await sl(900); return { d: JSON.parse(JSON.stringify(__FS.app_settings.col2_handoff)) }; });
  outNow = [op('20261109')]; await tick(); st = await p.evaluate(() => !!(__FS.mkt_kpipa && __FS.mkt_kpipa['20261109']));
  ok(back.d && back.d.jobs.kpipa.on === false && back.d.log[0].on === false && !st, '④ [되돌리기] 두 번 → on:false · 그 뒤 운영 칸 쓰기 거절', back);
  const T = await p.evaluate(() => JSON.stringify(C2HO_JOBS)); const HOF = require(find('lab/col2/shadow/col2-handoff.js')); const W = JSON.parse(T);
  ok(Object.keys(W).length && Object.entries(W).every(([k, j]) => HOF.JOBS[k] && HOF.JOBS[k].col === j.col && HOF.JOBS[k].idRe === j.idRe && JSON.stringify(HOF.JOBS[k].fields) === JSON.stringify(j.fields) && HOF.JOBS[k].beatMaxH === j.beatMaxH) && Object.keys(HOF.JOBS).every((k) => W[k]), '④ 웹앱 넘김 표 = lab/col2/shadow/col2-handoff.js 표(칸·문서 꼴·칸 이름·소식 시간)', { W, H: HOF.JOBS });
  const pops = await p.evaluate(() => (window.__alerts || []).length || 0); ok(!pops, '브라우저 팝업 없음');
  console.log(bad ? `✗ tCOL2HO: ${bad}개 실패` : '✓ tCOL2HO 모두 통과'); if (bad) process.exitCode = 1;
}, { noFriend: true });
