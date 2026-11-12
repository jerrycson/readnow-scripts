/* tHANDOFF3_1112 — (11/12 handoff3 · 리드 '🎯 벤치마킹 넘기는 길 · 홀로 연결 로거 판매자 목록 · R21') 🔀 번외로 넘기기 — 웹앱 쪽 🎯 숍 목록 끝까지
 *  ① 로거 PC 웹앱만 번외에 운영 숍 회차 요약(bench_state — 견줄 칸만)·지금 목록 조각(bench_state/<숍>/c/<조각>)을 넘김 · 사무실 PC엔 안 줌(로거 고유 일 · 약속 0)
 *  ② 넘긴 🎯(LOGGER): 잡기 신호 → 운영 잡기 문서 prd_jobs/bclaim_<숍>(운영 benchClaim과 같은 판단 · 운영 PC가 4분 안에 잡았으면 거절)
 *  ③ 끝까지 읽은 회차 → 웹앱이 운영 본체 benchFinish를 글자 그대로 떼어 진짜 Firestore(시험은 가짜)로 부름 → bench_state·bench_days·bench_items·조각 · 쓴 이 번외 LOGGER · 잡기 놓음
 *  ④ 그사이 운영이 그 숍을 끝냈으면(번외가 본 회차 끝과 다름) 쓰지 않음 · 큰 숍(40쪽 넘음)·끝까지 못 읽은 회차는 거절
 *  ⑤ ⚙ › 🔀 묶음 보기: 🌐 로거 묶음의 🎯는 '그림자 중'(끝까지 읽기 표본이 생기면 넘길 수 있음) · 📘 묶음 까닭에 약속 0 판단(사무실 PC 한 대)
 * 실행: cd pw && RN_PORT=<포트> node tHANDOFF3_1112.js (RN_COLLECTOR=<운영 본체 src 경로> — 없으면 저장소 옆 경로) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 900) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path');
const SRCF = process.env.RN_COLLECTOR || [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../../src/readnow-collector.src.js'), '/home/user/readnow-scripts/src/readnow-collector.src.js'].find((f) => fs.existsSync(f));
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let outNow = []; let me = 'LOGGER'; let wantNow = []; const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/raw\.githubusercontent\.com\/jerrycson\/readnow-scripts\/main\/src\/readnow-collector\.src\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/plain', body: fs.readFileSync(SRCF, 'utf8') }));
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const o = outNow; outNow = []; const w = wantNow; wantNow = []; return J({ ok: true, want: w, sample: 0, pool: 0, fields: [], out: o, hot: false, pc: me, pcSrc: 'web', ver: '0.1.42', kind: me === 'LOGGER' ? 'logger' : 'office', handBeat: {}, handAt: 0 }); }
    return J({ ok: true }); });
  const tick = async () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); await new Promise((r) => setTimeout(r, 150)); });
  const endAt0 = new Date(Date.now() - 30 * 3600e3).toISOString();
  await p.evaluate(async ({ endAt0 }) => { localStorage.setItem('rn-device', 'LOGGER'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    await db.collection('bench_state').doc('555').set({ sc: '555', name: '가게', day: '2026-11-10', endAt: endAt0, runAt: endAt0, total: 2, lastPage: 1, chunks: 1, complete: true, startDay: '2026-11-01', okRunAt: endAt0, secret: 'x' });
    await db.collection('bench_state').doc('555').collection('c').doc('0').set({ s: JSON.stringify({ 1: [1000, '20261101', '상', 1, '책1', 0, 0, null, null, null, 0], 2: [2000, '20261101', '중', 1, '책2', 1, 0, null, null, null, 0] }), n: 2, fmt: 'json', day: '2026-11-10' });
    await db.collection('app_settings').doc('bench').set({ targets: [{ sc: '555', name: '가게', on: true }] });
    await db.collection('app_settings').doc('col2_handoff').set({ jobs: { bench: { on: true, pc: 'LOGGER', at: new Date().toISOString(), by: '시험' } }, log: [] }); await new Promise((r) => setTimeout(r, 400)); }, { endAt0 });
  /* ① 운영 값 넘기기 */
  wantNow = [{ c: 'bench_state', id: '555' }, { c: 'bench_chunk', id: '555.0' }]; await tick();
  let ans = calls.filter((c) => c.p === '/relay/answer' && c.b && Array.isArray(c.b.docs) && c.b.docs.length).slice(-1)[0]; const dS = ans && ans.b.docs.find((d) => d.c === 'bench_state'), dC = ans && ans.b.docs.find((d) => d.c === 'bench_chunk');
  ok(dS && dS.v.endAt === endAt0 && dS.v.lastPage === 1 && dS.v.chunks === 1 && dS.v.secret === undefined && dC && JSON.parse(dC.v.s)['2'][5] === 1, '① 로거 웹앱: 숍 회차 요약(견줄 칸만)·지금 목록 조각을 번외에 넘김', ans && ans.b.docs);
  me = 'JS-MAIN'; await p.evaluate(() => localStorage.setItem('rn-device', 'JS-MAIN')); calls.length = 0; wantNow = [{ c: 'bench_state', id: '555' }, { c: 'bench_chunk', id: '555.0' }]; await tick();
  ans = calls.filter((c) => c.p === '/relay/answer' && c.b && Array.isArray(c.b.docs)).slice(-1)[0]; ok(!ans || !ans.b.docs.some((d) => /^bench_/.test(d.c)), '① 사무실 PC 번외에는 벤치 목록을 안 줌(로거 고유 일 · 약속 0)', ans && ans.b.docs);
  me = 'LOGGER'; await p.evaluate(() => localStorage.setItem('rn-device', 'LOGGER'));
  /* ② 잡기 */
  outNow = [{ k: 'c1', c: 'prd_jobs', id: 'bclaim_555', op: true, job: 'bench', merge: true, v: { claim: { on: true } } }]; await tick();
  let st = await p.evaluate(() => JSON.parse(JSON.stringify((__FS.prd_jobs || {}).bclaim_555 || null)));
  ok(st && st.pc === 'col2-LOGGER' && st.name === '번외 LOGGER' && st.at > 0, '② 잡기 신호 → prd_jobs/bclaim_555(운영 benchOneT가 이 숍을 \'다른 PC가 읽는 중\'으로 건너뜀)', st);
  await p.evaluate(() => db.collection('prd_jobs').doc('bclaim_556').set({ pc: 'MJ-MAIN-1', name: 'MJ-MAIN', at: Date.now() }));
  outNow = [{ k: 'c2', c: 'prd_jobs', id: 'bclaim_556', op: true, job: 'bench', merge: true, v: { claim: { on: true } } }]; await tick();
  let ack = calls.filter((c) => c.p === '/relay/ack' && c.b && c.b.errs && c.b.errs.c2).slice(-1)[0]; ok(ack && /읽는 중/.test(ack.b.errs.c2) && (await p.evaluate(() => __FS.prd_jobs.bclaim_556.pc)) === 'MJ-MAIN-1', '② 운영 PC가 4분 안에 잡은 숍은 못 잡음(운영 신호 그대로)', ack && ack.b);
  /* ③ 회차 쓰기 — 운영 benchFinish 글자 그대로 */
  const row = (id, pr, g, low) => [id, pr, g, '책' + id, null, null, 9000, low ? 1 : 0, 1, 'U' + id, null, null]; const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const startedAt = new Date(Date.now() - 600e3).toISOString();
  const run = { sc: '555', name: '가게', day, startedAt, readEndAt: new Date().toISOString(), lastPage: 1, pages: 1, items: [row('1', 900, '상'), row('3', 3000, '상')], seenEnd: endAt0 };
  outNow = [{ k: 'r1', c: 'bench_state', id: '555', op: true, job: 'bench', merge: true, v: { run } }]; await tick(); await p.waitForTimeout(500);
  st = await p.evaluate(({ day }) => JSON.parse(JSON.stringify({ s: __FS.bench_state['555'], d: (__FS.bench_days || {})['555_' + day], i1: (__FS.bench_items || {})['555_1'], i3: (__FS.bench_items || {})['555_3'], c0: (__FS['bench_state/555/c'] || {})['0'], cl: __FS.prd_jobs.bclaim_555 })), { day });
  ack = calls.filter((c) => c.p === '/relay/ack' && c.b && ((c.b.keys || []).includes('r1') || (c.b.errs && c.b.errs.r1))).slice(-1)[0];
  ok(st.s && st.s.writer === '번외 LOGGER' && st.s.total === 2 && st.s.missOnce === 1 && st.s.complete === true && st.s.day === day && st.d && st.d.add === 1 && st.d.moved === 1 && st.d.missOnce === 1 && st.i1 && st.i1.prices && st.i1.prices[0].p === 900 && st.i3 && st.i3.firstDay === day && st.c0 && JSON.parse(st.c0.s)['2'][6],
    "③ 운영 benchFinish 그대로: 새로 올림 1(3번) · 값 바뀜 1(1번 1,000→900) · 이번에 안 보임 1(2번 — 다음 온전한 회차에 사라짐 확정) · bench_state 쓴 이 번외 LOGGER(운영은 이번 실행에서 건너뜀)", { st, ack: ack && ack.b });
  ok(st.cl && st.cl.pc === null && st.cl.doneAt, '③ 쓴 뒤 잡기를 놓음', st.cl);
  /* ④ 거절 */
  outNow = [{ k: 'r2', c: 'bench_state', id: '555', op: true, job: 'bench', merge: true, v: { run } }, { k: 'r3', c: 'bench_state', id: '555', op: true, job: 'bench', merge: true, v: { run: { ...run, lastPage: 41, pages: 41 } } }, { k: 'r4', c: 'bench_state', id: '555', op: true, job: 'bench', merge: true, v: { run: { ...run, pages: 0 } } }];
  await tick(); await tick(); const errs = Object.assign({}, ...calls.filter((c) => c.p === '/relay/ack' && c.b && c.b.errs).map((c) => c.b.errs));
  ok(/그사이/.test(errs.r2 || '') && /큰 숍/.test(errs.r3 || '') && /끝 쪽까지/.test(errs.r4 || ''), '④ 같은 회차를 다시(그사이 회차 끝이 바뀜) · 큰 숍 · 끝까지 못 읽은 회차는 쓰지 않음', errs);
  /* ⑤ 묶음 보기 */
  await p.evaluate(async () => { const kd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); await db.collection('col2_jday').doc(kd + '_LOGGER').set({ d: kd, pc: 'LOGGER', kind: 'logger', ver: '0.1.42', at: new Date().toISOString(), tasks: { benchFull: { name: '🎯 끝까지', n: 1, same: 1, diff: 0, un: 0, fail: 0, pass: { n: 1, can: true, why: '넘길 수 있음' } } } });
    await db.collection('app_settings').doc('col2_handoff').set({ jobs: { bench: { on: false } } }, { merge: true }); });
  const ui = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S.sec.set_c2ho = true; const m = document.createElement('div'); m.id = 'c2hoT3'; document.body.appendChild(m); renderSettings(m); await sl(900); const box = document.getElementById('c2ho_box'); if (!box) return { none: true }; c2HoLoad(true);
    for (let i = 0; i < 30 && !box.querySelector('.c2hobun'); i++) await sl(200); box.querySelectorAll('details.c2hobun').forEach((d) => (d.open = true)); return { t: box.innerText, lg: (box.querySelector('[data-c2hobon="lg"]') || {}).textContent || null }; });
  ok(/숍 목록 끝까지/.test(ui.t || '') && /넘길 수 있음/.test(ui.t || '') && /묶음 넘기기 \(1가지\)/.test(ui.lg || '') && /사무실 PC 한 대/.test(ui.t || ''), "⑤ 🌐 로거 묶음: 🎯 숍 목록 끝까지 = '넘길 수 있음'(끝까지 읽기 그림자 표본) · 📘 묶음 까닭에 약속 0 판단(사무실 PC 한 대)", { lg: ui.lg, t: (ui.t || '').slice(0, 600) });
  console.log(bad ? `✗ tHANDOFF3_1112 실패 ${bad}` : '✓ tHANDOFF3_1112 모두 통과');
}, {});
