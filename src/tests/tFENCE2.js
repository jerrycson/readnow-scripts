// tFENCE2 — 11/10 일꾼 fence2 · 정범님 11/09 밤 '하루 손해 한도 1만 원 — 절대로 기준을 넘는 일이 없도록 철저히' (약속 33: 사후 기록이 아니라 실행 전에 막기)
//  ① 공용 순수 함수(FENCE-PURE): 한도 딱 · 1원 넘음 · 올림은 검사 없음 · 같은 상품 진행 중 · 예약 끝(확정·풂) · 입력이 비었거나 이상함(바닥 5천) · 한도를 못 받음·오래됨
//  ② 학습 공용과 가격 감시기의 셈 사본이 글자 그대로 같음 · 감시기 머리(==UserScript==) 그대로
//  ③ 원장 트랜잭션(가짜 Firestore — 낙관적 동시성): 동시 두 회차(클라우드 전략 + 감시기 · 클라우드 둘)가 한도를 두 번 쓰지 않음 · 한국 날짜 경계(새 날은 걸린 것 이어 받음·쓴 돈 0)
//  ④ 정리(fenceReconcile): 끝난 예약 확정·취소 풂·모르면 그대로 · 하루 셈(실험 처리 상품 걸기 · 오늘 팔린 손해 → 쓴 돈 · 사람이 손대 빠진 상품 뺌 · 쓴 돈은 줄지 않음)
//  ⑤ 연결(코드 차례): ⚡ 전략은 예약 뒤에만 기록·맡김 · 감시기는 사람 손댐(eng_excl)·예약 뒤에만 알라딘에 보냄 · 실패 때 안전 쪽 ⑥ 웹앱 카드 줄(harness가 있을 때)
// 시험 자료에 손님 정보 없음(상품 번호만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js', '../../src/cloud/index.js']), 'utf8');
const MLP = find(['../readnow-ml-core.js', '../../readnow-ml-core.js']); const ML = require(MLP); const MLSRC = fs.readFileSync(MLP, 'utf8');
const PWP = find(['readnow-price-watch.user.js', '../readnow-price-watch.user.js', '../../readnow-price-watch.user.js']); const PW = fs.readFileSync(PWP, 'utf8');
const APPP = find(['../app.html', '../../src/app.html', '../../app.html']); const APP = APPP ? fs.readFileSync(APPP, 'utf8') : '';
const H = 3600e3;

/* 가짜 Firestore — 문서마다 판 번호 · 트랜잭션은 읽은 문서의 판이 그 사이 바뀌면 처음부터 다시(실제 Firestore와 같은 낙관적 동시성) · get 사이에 다른 일이 끼어들게 setImmediate */
function fakeDb() { const S = new Map(); const DEL = { __del: 1 }; const kk = (n, id) => n + '/' + id; const clone = (v) => JSON.parse(JSON.stringify(v));
  const mergeD = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__del) delete o[k]; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = mergeD(o[k], v); else o[k] = v && typeof v === 'object' ? mergeD(Array.isArray(v) ? undefined : {}, v) && clean(v) : v; } return o; };
  const clean = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? v.map(clean) : Object.fromEntries(Object.entries(v).filter(([, x]) => !(x && x.__del)).map(([k, x]) => [k, clean(x)]))) : v);
  const write = (n, id, v, o) => { const cur = S.get(kk(n, id)); const nv = o && o.merge ? mergeD(cur ? cur.v : {}, v) : clean(v); S.set(kk(n, id), { v: clone(nv), ver: (cur ? cur.ver : 0) + 1 }); };
  const snap = (n, id) => { const r = S.get(kk(n, id)); return { id, exists: !!r, data: () => (r ? clone(r.v) : undefined) }; };
  const ref = (n, id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v, o) => write(n, id, v, o) });
  const C = (n) => ({ doc: (id) => ref(n, id || 'auto' + Math.random().toString(36).slice(2, 10)), add: async (v) => write(n, 'auto' + Math.random().toString(36).slice(2, 10), v) });
  const nap = () => new Promise((r) => setImmediate(r)); let tries = 0, retries = 0;
  const db = { S, collection: C, getAll: async (...rs) => rs.map((r) => snap(r._n, r.id)), stats: () => ({ tries, retries }),
    runTransaction: async (fn) => { for (let a = 0; a < 20; a++) { tries++; const seen = new Map(); const W = []; const tx = { get: async (r) => { await nap(); const x = S.get(kk(r._n, r.id)); seen.set(kk(r._n, r.id), x ? x.ver : 0); return snap(r._n, r.id); }, set: (r, v, o) => { W.push([r, v, o]); }, update: (r, v) => W.push([r, v, { merge: true }]) };
        const out = await fn(tx); await nap(); const moved = [...seen].some(([k, v]) => ((S.get(k) || {}).ver || 0) !== v); if (moved) { retries++; continue; } for (const [r, v, o] of W) write(r._n, r.id, v, o); return out; } throw new Error('트랜잭션 20번 실패'); } };
  return { db, C, FV: { delete: () => DEL, serverTimestamp: () => 'TS', increment: (n) => n }, DEL }; }

(async () => {
  const NOW = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kd = (ms) => new Date(ms + 9 * H).toISOString().slice(0, 10);
  /* ── ① 공용 순수 함수 ── */
  const LIM = { ok: true, limit: 10000 };
  { const L = { day: kd(NOW), done: 2000, x: { aladin_A: { s: 8000, p: 5000, a: 3000, r: null } } };
    const a = ML.fenceTry(L, { key: 'aladin_B', from: 9000, to: 4000, id: 'r1' }, LIM); ok(a.ok && a.need === 10000 && a.left === 0 && a.e.r.a === 5000 && a.e.s === 9000, `한도 딱: 쓴 2,000 + 걸린 3,000 + 이번 5,000 = ${a.need}원 = 한도 10,000원 → 내림 허락(예약 ${a.e && a.e.r.a}원)`);
    const b = ML.fenceTry(L, { key: 'aladin_B', from: 9000, to: 3999, id: 'r2' }, LIM); ok(!b.ok && b.need === 10001 && !b.e && /10,001원 > 한도 10,000원/.test(b.why), `1원 넘음: ${b.need}원 → 내리지 않음(부분 적용 없음 · 예약 없음) — '${b.why}'`);
    const c = ML.fenceTry(L, { key: 'aladin_B', from: 9000, to: 9500 }, LIM); ok(c.ok && c.raise && !c.e, '값을 올리거나 그대로는 검사 없음(예약 안 함)');
    const d = ML.fenceTry(L, { key: 'aladin_A', from: 5000, to: 4000, id: 'r3' }, LIM); ok(d.ok && d.need === 6000 && d.e.s === 8000 && d.e.r.a === 4000, `원장에 있는 상품은 원장의 시작 값(8,000)으로: 걸린 3,000 → 4,000(쓴 2,000 + 4,000 = ${d.need})`);
    const L2 = { ...L, x: { ...L.x, aladin_B: a.e } }; const e = ML.fenceTry(L2, { key: 'aladin_B', from: 9000, to: 8000, id: 'r4' }, LIM); ok(!e.ok && /아직 끝나지 않음/.test(e.why), '같은 상품의 앞 내림 예약이 안 끝났으면 새 내림 안 함');
    const f = ML.fenceTry(L2, { key: 'aladin_C', from: 5000, to: 4999, id: 'r5' }, LIM); ok(!f.ok && ML.fenceSum(L2).used === 10000, `예약도 걸린 돈으로 셈: 다른 상품 1원 내림도 막힘(합 ${ML.fenceSum(L2).used}원)`);
    const g = ML.fenceTry(L, { key: 'aladin_D', from: 12000, to: 11000, start: 11500, id: 'r6' }, LIM); ok(g.ok && g.e.r.a === 500, '시작 값보다 위에서 내린 몫만 손해(12,000 → 11,000 · 시작 11,500 → 500원)');
    const s1 = ML.fenceSettle(L2, 'aladin_B', a.e.r.id, true, 4000); const s2 = ML.fenceSettle(L2, 'aladin_B', a.e.r.id, false); const s3 = ML.fenceSettle(L2, 'aladin_B', 'zz', true, 4000);
    ok(s1 && s1.p === 4000 && s1.a === 5000 && !s1.r && s2 && !s2.r && s2.a === 0 && s2.p === 9000 && s3 === null, '예약 끝: 알라딘이 받으면 지금 값·걸린 돈 확정 · 안 들어가면 예약만 풂 · 다른 예약 번호는 건드리지 않음');
    const h = ML.fenceTry({ x: {} }, { key: 'aladin_E', from: null, to: 4000 }, LIM); const h2 = ML.fenceTry({ x: {} }, { key: 'aladin_E', from: 5000, to: 5 }, LIM); ok(!h.ok && !h2.ok, '지금 값을 모르거나 내릴 값이 이상하면 안 내림');
    const n1 = ML.fenceNoAdd({ no: [] }, { key: 'k', why: 'w', at: '1' }); const n2 = ML.fenceNoAdd({ no: n1 }, { key: 'k', why: 'w', at: '2' }); ok(n2.length === 1 && n2[0].n === 2, '막은 기록: 같은 상품·까닭은 횟수만'); }
  { ok(ML.dayLossLimit(206627) === 10000, '지금 매출(하루 평균 206,627원) → 한도 10,000원');
    const E = [undefined, null, '', 0, NaN, -5, 'abc', 9e6, Infinity]; ok(E.every((v) => ML.dayLossLimit(v) === 5000), `30일 매출이 비었거나 이상하면(${E.map(String).join('·')}) 바닥 5,000원(천장 아님)`);
    ok(ML.dayLossLimit(40000) === 5000 && ML.dayLossLimit(2e6) === 30000 && ML.dayLossLimit(206627, { dayLossFix: 10000 }) === 10000 && ML.dayLossLimit(206627, { dayLossFix: 'x' }) === 10000, '바닥·천장 · 사람이 고정(dayLossFix)한 값 · 고정 값이 이상하면 셈 값');
    const at = iso(NOW - H); const F = (o) => ML.fenceLimitOf(o, NOW);
    ok(!F(null).ok && !F({ dayLoss: 10000 }).ok && !F({ dayLoss: 10000, at: iso(NOW - 37 * H) }).ok && !F({ dayLoss: 10000, at: 'x' }).ok && F({ dayLoss: 10000, at: iso(NOW - 35 * H) }).limit === 10000, '감시기·전략이 한도를 못 받음(문서 없음·시각 없음·36시간 넘음·시각 이상) → 내리지 않음 · 36시간 안이면 씀');
    ok(F({ dayLoss: null, at }).limit === 5000 && F({ dayLoss: 'x', at }).limit === 5000 && F({ dayLoss: 99999, at }).limit === 5000 && F({ dayLoss: 2000, at }).limit === 5000 && F({ dayLoss: 50000, at, fix: true }).limit === 50000, '받은 한도 값이 이상하면(없음·글자·천장 위·바닥 아래) 바닥 5,000원 · 사람이 고정한 값은 그대로');
    ok(!ML.fenceTry({ x: {} }, { key: 'k', from: 9000, to: 8000 }, F(null)).ok, '한도를 못 받으면 1원 내림도 안 함'); }

  /* ── ② 두 사본이 같음 · 감시기 머리 그대로 ── */
  { const cut = (s) => { const a = s.indexOf('/* FENCE-PURE-START'), b = s.indexOf('/* FENCE-PURE-END */'); return a > 0 && b > a ? s.slice(a, b) : null; }; const A = cut(MLSRC), B = cut(PW);
    ok(A && B && A === B, `하루 손해 셈 사본이 학습 공용과 가격 감시기에 글자 그대로 같음(${A ? A.length : 0}자)`);
    const hd = (s) => s.slice(0, s.indexOf('// ==/UserScript==')).split('\n').filter((l) => !/@version/.test(l)).join('\n'); const orig = (() => { try { return require('child_process').execSync('git show origin/main:readnow-price-watch.user.js', { cwd: path.dirname(PWP), stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { return null; } })();
    const vOf = (s) => (String(s).match(/@version\s+(\S+)/) || [])[1] || null; if (orig) ok(hd(orig) === hd(PW) && vOf(PW) === vOf(orig), '감시기 머리(@match·@grant·@connect·@require) 그대로 · @version도 그대로(올리는 것은 메인 세션)'); else console.log('  (감시기 머리 비교: git 기록을 못 읽어 건너뜀)'); }

  /* ── ③ 원장 트랜잭션 · 동시성 · 날짜 경계 ── */
  const cA = SRC.indexOf('/* FENCE2-START'), cB = SRC.indexOf('/* FENCE2-END */'); ok(cA > 0 && cB > cA, '클라우드에 하루 손해 원장 칸(FENCE2)이 있음');
  const pA = PW.indexOf('  /* FENCE-PURE-START'), pB = PW.indexOf('  const sameApproval'); ok(pA > 0 && pB > pA && /async function fenceRun/.test(PW.slice(pA, pB)), '감시기에 원장 함수(fenceRun)가 있음');
  const mkCloud = (F) => new Function('db', 'C', 'FV', 'W', SRC.slice(cA, cB) + '\nreturn { fenceTxCloud, fenceReconcile, fenceDay };')(F.db, F.C, F.FV, () => ({ writer: 'cloud' }));
  const mkPw = (F) => new Function('db', 'C', 'W', 'kst', PW.slice(pA, pB) + '\nreturn { fenceRun, engExcl };')(F.db, F.C, () => ({ writer: 'pw' }), (t) => new Date(t + 9 * H).toISOString());
  const setNow = async (F, o) => F.C('app_settings').doc('eng_fence_now').set({ at: iso(Date.now() - H), dayLoss: 10000, ...(o || {}) });
  const Lget = async (F, day) => (await F.C('eng_fence_ledger').doc(day || kd(Date.now())).get()).data();
  { const F = fakeDb(); await setNow(F); const CL = mkCloud(F), PWf = mkPw(F); const day = kd(Date.now());
    const [r1, r2] = await Promise.all([CL.fenceTxCloud(ML, 'try', { key: 'aladin_S1', from: 9000, to: 3000, src: 'st:a1', by: 'strategy', id: 'c1', cmd: 'c1' }), PWf.fenceRun('try', { key: 'aladin_P1', from: 9000, to: 3000, src: 'pw:g1', by: 'price-watch:PC', id: 'p1' })]);
    const L = await Lget(F); const u = ML.fenceSum(L); ok([r1, r2].filter((r) => r && r.ok).length === 1 && u.used === 6000 && Object.keys(L.x).length === 1 && F.db.stats().retries >= 1, `동시 두 회차(⚡ 전략 6,000원 + 🛰 감시기 6,000원 · 한도 10,000원): 하나만 예약 · 원장 합 ${u.used}원 · 다른 하나는 다시 셈해서 막힘(트랜잭션 다시 ${F.db.stats().retries}번)`);
    ok(L.day === day && (L.no || []).length === 1 && /한도 10,000원/.test(L.no[0].why), '막힌 내림은 원장 no에 기록(까닭·값)');
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => CL.fenceTxCloud(ML, 'try', { key: 'aladin_Q' + i, from: 5000, to: 4000, src: 'st:a1', id: 'q' + i, cmd: 'q' + i }))); const L3 = await Lget(F);
    ok(rs.filter((r) => r.ok).length === 4 && ML.fenceSum(L3).used === 10000, `한꺼번에 다섯 회차(각 1,000원 · 남은 4,000원): 넷만 예약 → 합 ${ML.fenceSum(L3).used}원(한도를 넘지 않음)`);
    const s = await PWf.fenceRun('settle', { key: 'aladin_Q1', id: 'zz', ok: false }); ok(s && !s.ok && ML.fenceSum(await Lget(F)).used === 10000, '다른 예약 번호로는 풀 수 없음'); }
  { const F = fakeDb(); const PWf = mkPw(F); const r = await PWf.fenceRun('try', { key: 'aladin_P', from: 9000, to: 8990, id: 'p' }); const L = await Lget(F);
    ok(r && !r.ok && /한도가 없음/.test(r.why) && !Object.keys(L.x || {}).length && L.limit === null, `감시기가 한도를 못 받음(eng_fence_now 없음) → 10원 내림도 안 함 · '${r && r.why}'`);
    await setNow(F, { at: iso(Date.now() - 40 * H) }); const r2 = await PWf.fenceRun('try', { key: 'aladin_P', from: 9000, to: 8990, id: 'p2' }); ok(r2 && !r2.ok && /36시간/.test(r2.why), '한도가 40시간 전 것 → 안 내림');
    const G = fakeDb(); G.db.runTransaction = async () => { throw new Error('unavailable'); }; let thrown = false; try { await mkPw(G).fenceRun('try', { key: 'k', from: 9, to: 8 }); } catch (e) { thrown = true; }
    const pwExec = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인'));
    ok(thrown && /catch \(e\) \{ fz = \{ ok: false, why: '하루 손해 원장을 못 씀/.test(pwExec) && /if \(!fz \|\| !fz\.ok\) \{ await back\(/.test(pwExec), '원장을 못 쓰면(네트워크 등) 감시기는 안 내림(실패 때 안전 쪽)'); }
  { const F = fakeDb(); const CL = mkCloud(F); const T0 = Date.parse('2026-11-09T14:59:00Z'); const realNow = Date.now; try {
      Date.now = () => T0; await setNow(F); const a = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_K', from: 9000, to: 6000, id: 'k1', cmd: 'k1' }); await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_K', id: 'k1', ok: true, price: 6000 });
      await F.C('eng_fence_ledger').doc('2026-11-09').set({ done: 4000 }, { merge: true });
      Date.now = () => T0 + 2 * 60e3; const b = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_K2', from: 9000, to: 2000, id: 'k2', cmd: 'k2' }); const L9 = await Lget(F, '2026-11-09'), L10 = await Lget(F, '2026-11-10');
      ok(CL.fenceDay(T0) === '2026-11-09' && CL.fenceDay(T0 + 2 * 60e3) === '2026-11-10' && a.ok, '날짜 경계 = 한국 0시(UTC 14:59 → 11/09 · 15:01 → 11/10)');
      ok(L10 && L10.from === '2026-11-09' && L10.x.aladin_K && L10.x.aladin_K.a === 3000 && b.ok && b.need === 10000 && !(L10.done > 0) && L9.done === 4000, `새 날 원장: 어제 걸린 3,000원은 이어 받고 어제 쓴 4,000원은 0부터 → 3,000 + 이번 7,000 = ${b.need}원(한도 딱 · 허락) — 어제 쓴 돈과 섞이지 않음`);
    } finally { Date.now = realNow; } }

  /* ── ④ 정리(fenceReconcile) ── */
  { const F = fakeDb(); const CL = mkCloud(F); await setNow(F); const day = kd(Date.now()); const old = iso(Date.now() - 30 * 60e3);
    const x = { A: { cmd: 'cA', st: 'verify' }, B: { cmd: 'cB', st: 'cancel' }, Cc: { cmd: 'cC', st: 'fail' }, D: { cmd: 'cD', st: 'fail', fresh: 1 }, E: { cmd: 'cE', st: null }, G: { cmd: null }, Hh: { cmd: null, fresh: 1 } };
    const X = {}; for (const [k, v] of Object.entries(x)) { X['aladin_' + k] = { s: 9000, p: 9000, a: 0, src: 'st:a1', since: old, r: { id: 'r' + k, to: 7000, a: 2000, at: old, by: 't', cmd: v.cmd } }; if (v.cmd && v.st) await F.C('shp_cmds').doc(v.cmd).set({ status: v.st, doneAt: old }); await F.C('prd_listings').doc('aladin_' + k).set({ price: v.fresh ? 7500 : 9000, active: true, status: '판매중', lastSeenAt: v.fresh ? iso(Date.now()) : iso(Date.now() - 2 * H) }); }
    await F.C('eng_fence_ledger').doc(day).set({ day, done: 0, x: X, no: [] }); const r = await CL.fenceReconcile(ML, { full: false }); const L = await Lget(F); const st = (k) => L.x['aladin_' + k];
    ok(!st('A').r && st('A').p === 7000 && st('A').a === 2000, '수정 맡김이 끝남(verify) → 그 값으로 확정');
    ok(!st('B').r && st('B').a === 0 && !st('E').r, '취소됐거나 맡김 문서가 없으면(15분 지남) → 예약 풂(보내지 않음)');
    ok(st('Cc').r && st('G').r, '실패했는데 알라딘에 들어갔는지 모름 · 감시기 예약이 끝나지 못함 → 수집기가 다시 읽을 때까지 예약 그대로(안전 쪽)');
    ok(!st('D').r && st('D').p === 7500 && !st('Hh').r && st('Hh').p === 7500 && r.settled === 5 && r.kept === 2, `다시 읽은 값이 나오면 그 값으로 확정 · 정리 ${r.settled}건 · 그대로 ${r.kept}건`); }
  { const F = fakeDb(); const CL = mkCloud(F); await setNow(F); const day = kd(Date.now()); const t0 = Date.parse(day + 'T00:00:00+09:00'); const join = iso(Date.now() - 3 * 864e5);
    const mem = new Map([['pw_g1', [{ key: 'aladin_M1', usedCode: 'M1', arm: 'treat', start: 9000, at: join }, { key: 'aladin_M2', usedCode: 'M2', arm: 'treat', start: 8000, at: join }, { key: 'aladin_M3', usedCode: 'M3', arm: 'treat', start: 7000, at: join, out: 'human', why: '사람이 상품 정보를 고침' }, { key: 'aladin_M4', usedCode: 'M4', arm: 'control', start: 6000, at: join }]], ['st_a1', [{ key: 'aladin_M5', usedCode: 'M5', arm: 'treat', start: 6000, at: join }]]]);
    for (const [k, p] of [['M1', 7000], ['M2', 7000], ['M3', 5000], ['M4', 5000], ['M5', 6500]]) await F.C('prd_listings').doc('aladin_' + k).set({ price: p, active: true, status: '판매중' });
    await F.C('eng_fence_ledger').doc(day).set({ day, done: 500, x: { aladin_M3: { s: 7000, p: 5000, a: 2000, src: 'pw:g1', since: join, r: null }, aladin_R1: { s: 9000, p: 8000, a: 1000, src: 'ro', since: join, r: null } }, no: [] });
    await F.C('prd_listings').doc('aladin_R1').set({ price: 8000, active: true, status: '판매중' });
    const sales = new Map([['M2', [{ at: t0 + 60e3, price: 7000 }]]]); const src = new Map([['pw_g1', {}], ['st_a1', {}]]);
    const r = await CL.fenceReconcile(ML, { full: true, mem, sales, src }); const L = await Lget(F);
    ok(L.x.aladin_M1 && L.x.aladin_M1.a === 2000 && L.x.aladin_M5 && L.x.aladin_M5.a === 0, '하루 셈: 진행 중 실험의 처리 상품을 모두 원장에 걸음(시작 9,000 − 지금 7,000 = 2,000 · 시작보다 비싸면 0)');
    ok(!L.x.aladin_M3 && !L.x.aladin_M4, '사람이 손대 빠진 상품(M3)·대조(M4)는 원장에서 뺌');
    ok(!L.x.aladin_M2 && L.done === 1000 && r.done === 1000, `오늘 팔린 M2(시작 8,000 → 판 7,000)는 '쓴 돈'으로 옮김: ${L.done}원(앞서 적힌 500원보다 큼)`);
    ok(L.x.aladin_R1 && L.x.aladin_R1.a === 1000, '전체 비율 실험(ro) 상품은 판매중이면 원장에 그대로');
    await F.C('eng_fence_ledger').doc(day).set({ done: 4000 }, { merge: true }); await CL.fenceReconcile(ML, { full: true, mem, sales, src }); ok((await Lget(F)).done === 4000, '쓴 돈은 같은 날 안에서 줄지 않음(먼저 뺀 상품의 손해를 다시 못 봐도 안전 쪽)'); }

  /* ── ⑤ 연결(코드 차례) ── */
  { const st = SRC.slice(SRC.indexOf('async function stratTick('), SRC.indexOf('async function stratPreCheck(')); const iF = st.indexOf("fenceTxCloud(ML, 'try'"), iRec = st.indexOf("C('strat_items').doc('c' + mtH(x.lid, STR.SH)).set({ m: { [x.lid]: nst } }"), iCmd = st.indexOf("await ref.set({ type: 'prdEdit'");
    ok(iF > 0 && iF < iRec && iRec < iCmd && /x\.d\.act === 'price' && \+x\.d\.to < \+l\.price/.test(st) && /if \(!fz \|\| !fz\.ok\) \{ sum\[a\.id\][^\n]*act: 'fence'[^\n]*continue; \} \}/.test(st), '⚡ 전략: 값을 내리기 전에 원장 예약 → 막히면 기록(strat_log fence)하고 그 상품은 건너뜀 → 통과해야 기록·샵매니저 수정 맡김');
    ok(/catch \(e\) \{ fz = \{ ok: false, why: '하루 손해 원장을 못 씀/.test(st) && /await fzUndo\(\); break;/.test(st), '⚡ 전략: 원장을 못 쓰면 안 내림 · 기록이 실패하면 예약 풂');
    const ex = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인')); const i1 = ex.indexOf('const EX = await engExcl(true)'), i2 = ex.indexOf("fenceRun('try'"), i3 = ex.indexOf("if (!(await xGate('price')))"), i4 = ex.indexOf('P.scmAction.price(x.listingId, price)');
    ok(i1 > 0 && i1 < i2 && i2 < i3 && i3 < i4, '감시기: 사람 손댐 목록 → 원장 예약 → 실행 문 → 알라딘에 값 보냄(이 차례)');
    ok(/apF\.decision === 'auto' \? 'pw:'/.test(ex) && /x\.group === 'treat' \? 'ro'/.test(ex) && /if \(!EX\) \{ await back\(/.test(ex) && /if \(EX\[x\.key\]\) \{ await back\(/.test(ex), '감시기: 🛰 감시 그룹 자동 반영·전체 비율 실험 승인 둘 다 · eng_excl을 못 읽으면 안 바꿈 · 사람이 손대 빠진 상품은 안 바꿈');
    ok(/await fzEnd\(true, price\)/.test(ex) && /if \(!res\.ok && !\/돌려준 값\/\.test\(res\.error \|\| ''\)\) await fzEnd\(false\)/.test(ex) && /if \(!\(await xGate\('price'\)\)\) \{ await fzEnd\(false\); continue; \}/.test(ex), '감시기: 알라딘이 받으면 확정 · 안 들어가면 풂 · 다른 값으로 받으면 예약 그대로(클라우드 정리)');
    ok(/needApproval = d\.group === 'treat' && d\.status !== 'skip' && !\(EXo && EXo\[key\]\)/.test(PW), '감시기: 사람이 손대 빠진 상품은 전체 비율 실험 제안을 다시 올리지 않음');
    ok(/fenceReconcile\(ML, \{ full: false \}\)/.test(SRC) && /fenceReconcile\(ML, \{ full: true, mem: MEM, src, sales \}\)/.test(SRC) && /day: today, stop: fenceNow, dayLoss: limit, avgRev, fix:/.test(SRC), '클라우드: 20분마다 예약 정리 · 하루 셈 · 한도 문서에 날짜·고정 여부');
    const g = ML.stratGuard({ act: 'price', to: 9500, k: 'drip', M: { ok: true, ageH: 1 } }, { l: { status: '판매중', qty: 1, listingId: 'L1', price: 10000, registeredAt: '2026-01-01', sku: 'ABCDEF' }, st: {}, now: Date.now(), engOut: { why: '사람이 상품 정보를 고침' } }, {});
    ok(!g.ok && g.no.some((x) => /다시 건드리지 않음/.test(x)), '사람 손댐: ⚡ 안전 검사가 eng_excl 상품을 막음(그대로)'); }

  /* ── ⑥ 웹앱 카드 줄 ── */
  ok(/function fenceLine\(id, on\)/.test(APP) && /오늘 쓴 \$\{num\(u\.done\)\}원 · 예약 \$\{num\(u\.held\)\}원/.test(APP), '웹앱: 그룹·전략 카드 줄에 오늘 쓴·예약·남은');
  const hp = ['/home/user/wb-fence2/pw/harness.js', path.join(__dirname, 'harness.js')].find((x) => fs.existsSync(x));
  if (!hp || !process.env.RN_PORT) { console.log('  (웹앱 화면 시험은 harness·RN_PORT가 없어 건너뜀)'); return fin(); }
  require(hp)(async (p) => { await p.waitForTimeout(600);
    const R = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
      o.fn = typeof fenceLine === 'function' && typeof engExpLine === 'function'; if (!o.fn) return o; const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
      await db.collection('eng_exp').doc('pw_g9').set({ state: 'run', cnt: { treat: 12, control: 12 }, score: { verdict: '아직 모름' }, fence: { dayLoss: 10000 } });
      await db.collection('app_settings').doc('eng_fence_now').set({ at: new Date().toISOString(), dayLoss: 10000 });
      await db.collection('eng_fence_ledger').doc(day).set({ day, done: 1500, x: { aladin_1: { s: 9000, p: 7000, a: 2000, r: null }, aladin_2: { s: 8000, p: 8000, a: 0, r: { id: 'r', to: 7000, a: 1000 } } }, no: [{ key: 'aladin_3', why: 'w', n: 2 }] });
      document.body.insertAdjacentHTML('beforeend', '<div id="tF">' + engExpLine('pw_g9', true) + '</div>'); await Wt(500); document.getElementById('tF').innerHTML = engExpLine('pw_g9', true); await Wt(500); document.getElementById('tF').innerHTML = engExpLine('pw_g9', true); o.line = document.getElementById('tF').textContent;
      S.engF = {}; await db.collection('app_settings').doc('eng_fence_now').set({ at: new Date(Date.now() - 50 * 3600e3).toISOString(), dayLoss: 10000 }); document.getElementById('tF').innerHTML = engExpLine('pw_g9', true); await Wt(500); document.getElementById('tF').innerHTML = engExpLine('pw_g9', true); o.stale = document.getElementById('tF').textContent;
      o.ml = !!(window.ReadnowML && window.ReadnowML.fenceSum); o.pops = pops; return o; });
    ok(R.fn, '웹앱 fenceLine 있음');
    ok(/하루 손해 한도 10,000원/.test(R.line || '') && /오늘 쓴 1,500원/.test(R.line || '') && /예약 3,000원/.test(R.line || '') && /남은 5,500원/.test(R.line || '') && /막은 연구 내림 2번/.test(R.line || '') && /🛰 감시 자동 반영·🎯 추격자는 정범님 그룹 설정대로/.test(R.line || ''), `카드 줄(fence4: 연구 한도 · 감시·추격자는 그룹 설정대로): '${(R.line || '').replace(/\s+/g, ' ').slice(0, 160)}'`);
    ok(/한도를 못 받음/.test(R.stale || '') && /내리지 않음/.test(R.stale || ''), `한도가 오래되면 빨강: '${(R.stale || '').replace(/\s+/g, ' ').slice(-90)}'`);
    ok(R.pops === 0, `브라우저 팝업 없음 · 공용 셈 함수 ${R.ml ? '읽음' : '없음(대신 간단 셈)'}`);
  }).then(fin);
  function fin() { console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exitCode = bad ? 1 : 0; }
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
