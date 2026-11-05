// tCOL4 — 정범님 11/05 결정(11/04 매일 정밀 점검 제안 ④-4·④-5·④-6)
//  ① 429(알라딘 '요청이 너무 많음') 뒤 30분 동안 요청 간격 바닥 2초(설정 floor429Ms·floor429Min) — 29분·31분 · 흩음 뒤에도 바닥 · 0이면 끔 · 로그인 자체는 이 바닥을 거치지 않음
//  ② 🪪 기기 표지: 이름이 같은 PC 2대를 표지로 가름 — 규칙 seatView(알라딘 동시 로그인 대수) · 로그인 관리자(GM 표지 · 자리 신호 ids) · PC 신호(pcBeat ids)
//  ③ 🏓 로그인 번갈아 넘어감(핑퐁) N번 — 규칙 pingPong · 웹앱 algPingPong과 같은 셈 · 웹앱 홈 🖥 기기 상태 폴더 · 🧭 관리도구 🪑 기기 목록에 '⚠'
// 실행: cd pw && RN_PORT=8787 node tCOL4.js   (브라우저 부분은 harness.js — 시험 서버가 떠 있어야 함)
'use strict';
const fs = require('fs'), path = require('path');
const W = path.join(__dirname, '..');
const COL = fs.readFileSync(path.join(W, 'readnow-collector.user.js'), 'utf8'); const CLD = fs.readFileSync(path.join(W, 'cloud/index.js'), 'utf8'); const APP = fs.readFileSync(path.join(W, 'app.html'), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log(c ? '  ✓' : '  ❌', m); };
const RULE_SRC = COL.slice(COL.indexOf('globalThis.__rnLoginRule = ') + 'globalThis.__rnLoginRule = '.length, COL.indexOf(';\n/* ═════════════ (정범님 10/26) 🔑 알라딘 로그인'));
const RULE = eval(RULE_SRC);
const GOV_SRC = COL.slice(COL.indexOf('globalThis.__rnLoginRule = '), COL.indexOf('/* (1.38.0) 일시정지 = 이 PC의 모든 수집기 탭에 한 번에'));

function fakeDb() { const store = {}; const INC = Symbol('inc'), UNI = Symbol('uni'); let lock = Promise.resolve();
  const FV = { increment: (x) => ({ [INC]: x }), arrayUnion: (...a) => ({ [UNI]: a }), serverTimestamp: () => Date.now(), delete: () => undefined };
  const apply = (cur, v) => (v && v[INC] != null ? (+cur || 0) + v[INC] : v && v[UNI] ? [...(cur || []), ...v[UNI]] : v);
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b || {})) { if (v && typeof v === 'object' && !Array.isArray(v) && v[INC] == null && !v[UNI]) o[k] = merge(o[k] && typeof o[k] === 'object' ? o[k] : {}, v); else o[k] = apply(o[k], v); } return o; };
  const ref = (p) => ({ path: p, id: p.split('/').pop(), collection: (c) => ({ doc: (d) => ref(p + '/' + c + '/' + d) }), get: async () => ({ exists: !!store[p], data: () => store[p] }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); } });
  const db = { store, FV, collection: (c) => ({ doc: (d) => ref(c + '/' + d) }), runTransaction: (fn) => { const run = lock.then(async () => { const w = []; const r = await fn({ get: async (rf) => ({ exists: !!store[rf.path], data: () => store[rf.path] }), set: (rf, v, o) => w.push([rf, v, o]), update: (rf, v) => w.push([rf, v, { merge: true }]) }); for (const [rf, v, o] of w) await rf.set(v, o); return r; }); lock = run.catch(() => {}); return run; } };
  return db; }
function mkPc(name, db, GM) { GM = GM || {}; const logs = [];
  const win = { __rnPcName: { get: () => name }, __rnLog: (a, lv, m) => logs.push(lv + ' ' + m), __rnTab: 't1', top: null, firebase: { apps: [1], auth: () => ({ currentUser: {} }), firestore: Object.assign(() => db, { FieldValue: db.FV }) } };
  win.top = win; const g = { window: win, GM_getValue: (k, d) => (k in GM ? GM[k] : d), GM_setValue: (k, v) => { GM[k] = v; }, GM_deleteValue: (k) => { delete GM[k]; }, GM_addValueChangeListener: () => {}, location: { hostname: 'www.aladin.co.kr', pathname: '/scm/worders.aspx', origin: 'https://www.aladin.co.kr' }, document: { querySelector: () => null }, addEventListener: () => {}, setInterval: () => 0, firebase: win.firebase, globalThis: null, __rnPubChrome: false, __rnPubHome: false };
  const gt = new Proxy(g, { get: (t, k) => (k in t ? t[k] : globalThis[k]), has: () => true, set: (t, k, v) => { t[k] = v; return true; } }); g.globalThis = gt;
  new Function('sc', 'with (sc) { ' + GOV_SRC + ' }')(gt); return { gov: win.__rnLoginGov, GM, win, logs }; }

(async () => {
  console.log('① 429 뒤 30분 간격 바닥 2초 — readnow-products-core.js makePacer');
  { delete require.cache[require.resolve(path.join(W, 'readnow-products-core.js'))]; const PR = require(path.join(W, 'readnow-products-core.js'));
    ok(PR.PACER_DEFAULTS.floor429Ms === 2000 && PR.PACER_DEFAULTS.floor429Min === 30, `기본값 바닥 ${PR.PACER_DEFAULTS.floor429Ms}ms · ${PR.PACER_DEFAULTS.floor429Min}분`);
    const realNow = Date.now; let NOW = Date.parse('2026-11-05T14:00:00+09:00'); Date.now = () => NOW; const sleepF = async (ms) => { NOW += Math.max(1, ms); };
    try {
      /* 한 번 돌리기: 429 뒤 t분까지 요청을 계속(성공) — 그 구간의 실제 요청 사이 간격을 잼 */
      const run = async (key, cfg) => { const P = PR.makePacer(key); if (cfg) P.setCfg(cfg); for (let i = 0; i < 200; i++) { await P.wait(sleepF); P.ok(); } const t0 = NOW; P.fail('429'); const g0 = P.state().gap; const marks = []; let last = null;
        while (NOW - t0 < 40 * 60e3) { await P.wait(sleepF); const at = NOW; if (last != null) marks.push({ m: (at - t0) / 60e3, gap: at - last, cur: P.state().gap }); last = at; P.ok(); }
        return { P, t0, g0, marks }; };
      const A = await run('t429');
      const in29 = A.marks.filter((x) => x.m > 1.2 && x.m <= 29); const after31 = A.marks.filter((x) => x.m >= 31 && x.m <= 40);
      ok(in29.length > 100 && in29.every((x) => x.gap >= 2000) && in29.every((x) => x.cur >= 2000), `429 뒤 1~29분: 요청 ${in29.length}번 모두 간격 ≥ 2초(가장 짧은 ${Math.min(...in29.map((x) => x.gap))}ms · 흩음 뒤에도)`);
      const at29 = A.marks.filter((x) => x.m > 28.5 && x.m <= 29); ok(at29.length > 0 && at29.every((x) => x.cur === 2000), `29분째 간격 = 바닥 ${at29.map((x) => x.cur)[0]}ms(성공이 쌓여도 2초 아래로 안 내려감)`);
      ok(after31.length > 0 && Math.min(...after31.map((x) => x.cur)) < 2000 && after31.some((x) => x.gap < 2000), `31분 뒤: 바닥이 풀려 다시 빨라짐(가장 짧은 간격 ${Math.min(...after31.map((x) => x.gap))}ms · 조절 간격 ${Math.min(...after31.map((x) => x.cur))}ms)`);
      ok(A.P.floor().left === 0, '40분 뒤 floor() 남은 시간 0');
      /* 쉬는 동안 새 429 → 그때부터 다시 30분 */
      { const P = PR.makePacer('t429b'); for (let i = 0; i < 100; i++) { await P.wait(sleepF); P.ok(); } P.fail('429'); NOW += 20 * 60e3; P.fail('429'); const t1 = NOW; NOW += 25 * 60e3; for (let i = 0; i < 60; i++) P.ok(); ok(P.state().gap >= 2000 && P.floor().left > 0 && Math.abs(P.floor().left - (t1 + 30 * 60e3 - NOW)) < 5, `20분 뒤 두 번째 429 → 그때부터 30분(25분 뒤 아직 바닥 ${P.state().gap}ms · 남은 ${Math.round(P.floor().left / 60e3)}분)`); }
      /* 설정: floor429Min 0 = 끔(예전처럼 9분쯤이면 바닥 0.7초) · floor429Ms 3000 */
      const B = await run('t429off', { floor429Min: 0 }); const rec = B.marks.find((x) => x.m > 1 && x.cur <= 700); ok(rec && rec.m < 30, `floor429Min=0(끔)이면 예전처럼 ${rec ? rec.m.toFixed(1) : '?'}분이면 0.7초로 돌아옴`);
      const C = await run('t429x', { floor429Min: 30, floor429Ms: 3000 }); const in29c = C.marks.filter((x) => x.m > 1.2 && x.m <= 29); ok(in29c.every((x) => x.gap >= 3000), `설정 floor429Ms=3000이면 29분까지 간격 ≥ 3초(가장 짧은 ${Math.min(...in29c.map((x) => x.gap))}ms)`);
      { const P = PR.makePacer('tcfg'); P.setCfg({ floor429Ms: 3000, floor429Min: 45 }); P.setCfg({ minMs: 800 }); const c = P.state().cfg; ok(c.floor429Ms === 3000 && c.floor429Min === 45 && c.minMs === 800, `setCfg는 바닥 설정을 지움 없이 같이 지님(${c.floor429Ms}ms · ${c.floor429Min}분 · 최소 ${c.minMs})`); P.setCfg({ floor429Ms: 2000 }); }
      /* 429가 아닌 실패(시간 초과)는 바닥을 올리지 않음 */
      { const P = PR.makePacer('tto'); P.fail('timeout'); ok(P.floor().left === 0, '시간 초과·일반 오류는 바닥을 올리지 않음(429·503만)'); }
    } finally { Date.now = realNow; } }

  console.log('①-2 로그인 요청은 바닥을 거치지 않음 — 로그인 PC(JS-MAIN·MJ-MAIN·HOME) 로그인을 늦추지 않음');
  { const body = (sig) => { const out = []; let i = 0; for (;;) { const a = COL.indexOf(sig, i); if (a < 0) break; let d = 0, j = COL.indexOf('{', a); for (; j < COL.length; j++) { if (COL[j] === '{') d++; else if (COL[j] === '}') { d--; if (!d) break; } } out.push(COL.slice(a, j + 1)); i = j; } return out; };
    const L = [...body('async function credLogin('), ...body('async function isLoggedIn('), ...body('async function autoRelogin(')]; ok(L.length >= 5 && L.every((t) => !/PACE(_C|_P|_RAW)?\.wait|politeWait/.test(t)), `로그인 함수 ${L.length}개(credLogin·isLoggedIn·autoRelogin)에 속도 조절 기다림 없음`);
    ok(!/makePacer|PACE\.|PACE_C\./.test(GOV_SRC), '로그인 관리자(__rnLoginGov)·규칙은 속도 조절기를 쓰지 않음 → 429 바닥과 상관없이 5~20초 알아차림 뒤 바로 로그인');
    ok(/floor429Ms: SET\.floor429Ms, floor429Min: SET\.floor429Min/.test(COL) && /floor429Ms: 2000, floor429Min: 30/.test(COL), '수집기 설정(prd_system/settings floor429Ms·floor429Min)을 속도 조절기로 넘김');
    ok(/num_\('cs_f429min'/.test(APP) && /num_\('cs_f429ms'/.test(APP) && /floor429Min: \$\('#cs_f429min'\)/.test(APP), '웹앱 ⚙ 설정 ⑨ 수집기 공통에 429 뒤 시간·바닥 칸'); }

  console.log('② 🪪 이름이 같은 PC 2대 — 규칙 seatView · 로그인 관리자 · PC 신호');
  { ok(CLD.includes('const RN_LOGIN_RULE = ' + RULE_SRC + ';'), '규칙 글이 수집기·클라우드에서 글자 하나까지 같음');
    const now = Date.parse('2026-11-05T10:00:00+09:00'); const live = (ids, t) => ({ in: true, at: t || now, how: '상시', pri: 1, use: t || now, ...(ids ? { ids } : {}) });
    const V1 = RULE.seatView({ dev: { 'JS-MAIN': live({ dA: now - 60e3, dB: now - 120e3 }) } }, now);
    ok(V1.used === 2 && V1.dup.length === 1 && V1.dup[0].n === 2 && V1.room === 2, `같은 이름 JS-MAIN · 표지 2개(둘 다 30분 안) → ${V1.used}대로 셈 · dup ${JSON.stringify(V1.dup)} · 그 밖 기기 자리 ${V1.room}`);
    const V2 = RULE.seatView({ dev: { 'JS-MAIN': live({ dA: now - 60e3, dB: now - 40 * 60e3 }) } }, now); ok(V2.used === 1 && V2.dup.length === 0, `한 표지가 40분 전(자리 신호 30분 밖) → 1대(옮겨 간 옛 설치는 안 셈)`);
    const V3 = RULE.seatView({ dev: { 'JS-MAIN': live(null) } }, now); ok(V3.used === 1, '표지가 없던 예전 판 기록 → 1대(예전과 같음)');
    const doc4 = { dev: { 'JS-MAIN': live({ dA: now, dB: now }), 'MJ-MAIN': live({ dC: now }), HOME: live({ dD: now }), cloud: { in: true, at: now, pri: 0, use: now } } };
    const V4 = RULE.seatView(doc4, now); ok(V4.used === 5 && RULE.seatYield(doc4, now) === 'cloud', `상시 3자리 + 같은 이름 1대 더 + 클라우드 = ${V4.used}/4 → 넘김 = ${RULE.seatYield(doc4, now)}(클라우드 · 상시 PC는 안 넘김)`);
    const d4 = ['JS-MAIN', 'MJ-MAIN', 'HOME'].map((w) => RULE.decide(doc4, w, now, { pri: 1, rnd: 0.5 })); ok(d4.every((x) => x.ok), '그래도 🔒 상시 PC 셋은 모두 로그인 가능(막지 않음)');
    const c4 = RULE.decide({ ...doc4, dev: { ...doc4.dev, cloud: undefined } }, 'cloud', now, { dc: true, pri: 0, rnd: 0.5 }); ok(!c4.ok && c4.kind === 'seat', `클라우드가 새로 물으면 '자리 기다림'(${c4.kind}) — 예전엔 같은 이름 PC를 1대로 세어 자리가 있다고 봤음`);
    /* 로그인 관리자 — 같은 이름 두 실물 PC(GM 저장 따로) */
    const db = fakeDb(); const A = mkPc('JS-MAIN', db), B = mkPc('JS-MAIN', db); const ia = A.win.__rnDevId(), ib = B.win.__rnDevId();
    ok(/^d[0-9a-z]{6,24}$/.test(ia) && ia !== ib && A.win.__rnDevId() === ia && A.GM['rnu-dev-id'] === ia, `기기 표지는 설치(GM 저장)마다 한 번 · 무작위 — A ${ia.slice(-4)} · B ${ib.slice(-4)} · 다시 불러도 같음`);
    await A.gov.hold('시험'); await B.gov.hold('시험'); const acct = db.store['app_settings/aladin_login'] || {}; const ids = Object.keys(((acct.dev || {})['JS-MAIN'] || {}).ids || {});
    ok(ids.length === 2 && ids.includes(ia) && ids.includes(ib), `자리 신호(dev['JS-MAIN'].ids)에 두 표지가 다 남음(${ids.map((x) => x.slice(-4)).join('·')})`);
    const V5 = RULE.seatView(acct, Date.now()); ok(V5.used === 2 && V5.dup.length === 1, `계정 문서로 센 대수 ${V5.used}(실제 2대)`);
    ok(/BEAT_REF\(\)\.set\(\{ pcs: \{ \[PC_NAME\]: \{ atMs: Date\.now\(\), at: nowIso\(\), ver: VER, since, \.\.\.\(did \? \{ dev: did, ids: \{ \[did\]: Date\.now\(\) \} \} : \{\}\)/.test(COL), 'PC 신호(pcBeat.pcs[이름])에 표지(dev)·ids[표지] — 같은 칸을 덮어써도 ids에는 둘 다 남음');
    const R = RULE.record({}, 'JS-MAIN', now, { ok: true, how: 'cred', id: ia }, 0.5); ok(R.patch.lastTry.id === ia, '로그인 기록(tries)에 표지 id');
    ok(/RULE\.record\(doc, me, Date\.now\(\), \{ ok, how: o\.how \|\| null, why: ok \? null : why, blocked, id: devId\(\) \}/.test(COL), '로그인 관리자가 기록에 이 PC 표지를 넘김'); }

  console.log('③ 🏓 로그인 번갈아 넘어감 — 규칙 pingPong · 웹앱 algPingPong');
  { const now = Date.parse('2026-11-05T12:00:00+09:00'); const T = (who, m, id, okk = true) => ({ at: now - m * 60e3, who, ok: okk, how: 'cred', ...(id ? { id } : {}) });
    const p0 = RULE.pingPong({ tries: [T('JS-MAIN', 100), T('HOME', 60), T('MJ-MAIN', 10)] }, now); ok(!p0.on && p0.hops === 2, `2시간 안 세 PC가 한 번씩(주인 ${p0.hops}번 바뀜) → 경고 없음`);
    const t24 = []; for (let i = 0; i < 24; i++) t24.push(T(['JS-MAIN', 'cloud', 'HOME'][i % 3], 115 - i * 5)); const p1 = RULE.pingPong({ tries: t24 }, now); ok(p1.on && p1.hops === 23, `세 기기가 5분마다 번갈아 성공 24번 → on(주인 ${p1.hops}번 바뀜 > ${p1.max})`);
    const p2 = RULE.pingPong({ tries: [T('JS-MAIN', 50, 'dAAAA1'), T('JS-MAIN', 40, 'dBBBB2'), T('JS-MAIN', 30, 'dAAAA1'), T('JS-MAIN', 20, 'dBBBB2'), T('JS-MAIN', 10, 'dAAAA1')] }, now); ok(p2.on && p2.hops === 4, `같은 이름 JS-MAIN 두 표지가 번갈아 5번 → on(${p2.hops}번 · ${p2.who.join('→')})`);
    const p3 = RULE.pingPong({ tries: [T('JS-MAIN', 50), T('HOME', 40), T('JS-MAIN', 30, null, false), T('HOME', 20), T('JS-MAIN', 10)] }, now); ok(!p3.on && p3.hops === 2 && p3.n === 4, `실패 시도는 안 셈(성공 ${p3.n}번 · ${p3.hops}번 바뀜) → 경고 없음`);
    const p4 = RULE.pingPong({ tries: t24, cfg: { ppN: 30 } }, now); const p5 = RULE.pingPong({ tries: t24, cfg: { ppWinMin: 30 } }, now); ok(!p4.on && p5.hops === 6 && p5.on, `설정 ppN=30이면 꺼짐 · ppWinMin=30이면 30분 안 ${p5.hops}번 → on`);
    const NN = 4; const tN = (k) => Array.from({ length: k + 1 }, (_, i) => T(i % 2 ? 'HOME' : 'JS-MAIN', 100 - i * 10)); ok(!RULE.pingPong({ tries: tN(3) }, now).on && RULE.pingPong({ tries: tN(NN) }, now).on, `주인이 3번 바뀌면 조용 · ${NN}번(3번 넘게)이면 경고`);
    /* 웹앱 algSeatView·algPingPong = 규칙(무작위 문서) */
    const a = APP.indexOf('function algSeatView('), b = APP.indexOf('\nfunction algSeatHtml('); const ALG_DEF = eval('(' + APP.match(/const ALG_DEF = (\{[^\n]*\});/)[1] + ')');
    const WEB = new Function('ALG_DEF', 'S', 'DEV_SRC', 'devEvPut', 'alHash', 'osCfg', 'setTimeout', APP.slice(a, b) + APP.slice(APP.indexOf('function algPingPong('), APP.indexOf('DEV_SRC.login = ')) + '\nreturn { algSeatView, algPingPong, devDupScan };')(ALG_DEF, {}, {}, () => {}, (x) => x, () => ({ collMin: 6 }), () => 0);
    let same = 0, sameP = 0; const R = (k) => Math.floor(Math.random() * k); const NAMES = ['JS-MAIN', 'MJ-MAIN', 'HOME', 'cloud', 'LOGGER', 'X1'];
    for (let i = 0; i < 300; i++) { const dev = {}; for (const w of NAMES) if (R(3)) { const ids = {}; for (let j = 0, k = R(4); j < k; j++) ids['d' + R(5) + 'abcdef'] = now - R(50) * 60e3; dev[w] = { in: !!R(4), at: now - R(40) * 60e3, pri: R(4), use: now - R(90) * 60e3, yield: !R(6), ...(R(2) ? { ids } : {}) }; }
      const tries = Array.from({ length: R(30) }, () => ({ at: now - R(200) * 60e3, who: NAMES[R(6)], ok: !!R(3), ...(R(2) ? { id: 'd' + R(3) + 'zzzz' } : {}) })); const doc = { dev, tries, cfg: R(3) ? {} : { ppN: 1 + R(6), ppWinMin: 10 + R(200), maxDev: 1 + R(4) } };
      const x = RULE.seatView(doc, now), y = WEB.algSeatView(doc, now); if (JSON.stringify([x.max, x.live, x.wait, x.phones, x.slots, x.used, x.room, x.dup, x.dupX]) === JSON.stringify([y.max, y.live, y.wait, y.phones, y.slots, y.used, y.room, y.dup, y.dupX])) same++;
      if (JSON.stringify(RULE.pingPong(doc, now)) === JSON.stringify(WEB.algPingPong(doc, now))) sameP++; }
    ok(same === 300, `웹앱 algSeatView = 규칙 seatView(표지 포함 무작위 문서 ${same}/300)`); ok(sameP === 300, `웹앱 algPingPong = 규칙 pingPong(${sameP}/300)`);
    const B = { pcs: { 'JS-MAIN': { atMs: now, ids: { dAAAA1: now - 60e3, dBBBB2: now - 3 * 60e3 } }, HOME: { atMs: now, ids: { dCCCC3: now, dOLD: now - 3 * 3600e3 } }, 'MJ-MAIN': { atMs: now } } };
    const D = WEB.devDupScan(null, B, now); ok(D.length === 1 && D[0].who === 'JS-MAIN' && D[0].n === 2, `PC 신호로 같은 이름 다른 표지 찾기 → ${JSON.stringify(D.map((x) => x.who + ':' + x.n))}(HOME 옛 표지 3시간 전은 안 셈)`); }

  console.log('④ 웹앱 화면 — 홈 🖥 기기 상태 폴더 · 🧭 관리도구 🔑 🪑 기기 목록 (팝업 없음)');
  if (process.env.RN_NOBROWSER) console.log('  (브라우저 부분 건너뜀)'); else {
    const H = require('./harness.js');
    await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
      const r = await p.evaluate(async () => { const out = {}; const now = Date.now(); let pops = 0; window.alert = window.confirm = window.prompt = () => { pops++; };
        S.devEv = { ev: {} }; const A = { dev: { 'JS-MAIN': { in: true, at: now, how: '상시', pri: 1, use: now, ids: { dAAAA1: now - 60e3, dBBBB2: now - 120e3 } }, HOME: { in: true, at: now, how: '상시', pri: 1, use: now } }, tries: Array.from({ length: 8 }, (_, i) => ({ at: now - (80 - i * 10) * 60e3, who: i % 2 ? 'HOME' : 'JS-MAIN', ok: true, how: 'cred' })) };
        const B = { pcs: { 'MJ-MAIN': { atMs: now, ids: { dCCCC3: now - 30e3, dDDDD4: now - 90e3 } } } };
        devDupApply(A, B, now); S._devDup = { at: now, dup: devDupScan(A, B, now), pp: algPingPong(A, now) };
        const L = devEvList(); out.kinds = L.filter((e) => e.src === 'login').map((e) => e.k + ':' + e.name).sort(); out.msgs = L.filter((e) => e.src === 'login').map((e) => e.msg);
        const fd = devFolderEl(); out.folder = fd.innerText || fd.textContent || ''; out.icon = (fd.innerHTML || '').includes('🪪');
        out.seat = algSeatHtml(A, now).replace(/<[^>]+>/g, ' ');
        devDupApply({ dev: {}, tries: [] }, { pcs: {} }, now + 60e3); out.after = devEvList().filter((e) => e.src === 'login' && !e.end).length; out.ended = Object.values(S.devEv.ev).filter((e) => e.src === 'login' && e.end).length;
        out.pops = pops; out.feat = typeof featFind === 'function' ? featFind('같은 이름 PC').some((x) => /이름이 같은 PC/.test(x.t)) : null; return out; });
      ok(JSON.stringify(r.kinds) === JSON.stringify(['dupname:JS-MAIN', 'dupname:MJ-MAIN', 'pingpong:JS-MAIN·HOME']), `🖥 기기 상태에 쌓임: ${r.kinds.join(' · ')}`);
      ok(r.msgs.some((m) => /⚠ 이름이 같은 PC 2대/.test(m)) && r.msgs.some((m) => /⚠ 로그인 번갈아 넘어감/.test(m)), "알림 글 '⚠ 이름이 같은 PC 2대' · '⚠ 로그인 번갈아 넘어감'");
      ok(/이름이 같은 PC/.test(r.folder) && r.icon, `홈 🖥 기기 상태 폴더 안에 보임(🪪) — ${r.folder.replace(/\s+/g, ' ').slice(0, 120)}`);
      ok(/⚠ 이름이 같은 PC 2대/.test(r.seat) && /⚠ 이름이 같은 PC:\s*MJ-MAIN\s+2대/.test(r.seat) && /⚠ 로그인 번갈아 넘어감/.test(r.seat) && /로그인 중 3\/4대/.test(r.seat) && /같은 이름 \+1대/.test(r.seat), `🧭 관리도구 🪑 기기 목록: JS-MAIN 옆 ⚠ · PC 신호 MJ-MAIN ⚠ · 핑퐁 ⚠ · 대수 3/4(JS-MAIN 2대로 셈)`);
      ok(r.after === 0 && r.ended === 3, `풀리면 '끝남'으로 닫음(지우지 않음) — 열린 것 ${r.after} · 끝남 ${r.ended}`);
      ok(r.pops === 0, '브라우저 팝업 0번'); ok(r.feat === true, "🔍 기능 찾기 '같은 이름 PC' → 항목 있음"); }, {});
  }
  console.log(bad ? `❌ ${bad}/${n} 실패` : `✓ tCOL4 통과 (${n}항목)`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack || e); process.exit(1); });
