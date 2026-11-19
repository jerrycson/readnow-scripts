// tLKDAY1_1119 — (11/19 일꾼 lkday1 · 정범님 I-1119-1651-21 · 관제소 검토 1-1·1-2·1-3·1-5·1-6·1-11) 🎚 조건 잠금 하루 한도를 정확히
//   ① 도우미 글(plkDayStep·plkDayMine·plkMktOld·plkPickOn…) — 웹앱·수집기·클라우드·가격 감시기가 같은 글
//   ② 둘이 동시에 더해도 2 — 하루 횟수·금액을 트랜잭션으로(네 곳) · 같은 표는 한 번만 · 날짜가 바뀌면 0부터 · 한도가 1이면 동시에 둘 중 하나만
//   ③ 반영 직전 하루 한도 넘으면 막힘 — 수집기·클라우드의 진짜 글을 떼어 돌림 · 내 몫은 두 번 세지 않음 · 가격 감시기는 글 차례
//   ④ 끊긴 때는 잠긴 것으로 — 웹앱 plkFresh·plkFreshMany·plkLockedIds는 서버에서만 읽고 못 읽으면 잠김/null · 300개 넘어도 나눠 읽음 · 상품 번호(lid) 잠금
//   ⑤ 오래된 시장 값이면 막힘 — 24시간(PLK_MKT_MAX_H)
//   ⑥ 잠금 실행 스위치(정범님 I-1119-1717-22 ㉠)와 상관없이 반영 직전 다시 셈이 늘 돎
// 실행: node src/tests/tLKDAY1_1119.js · 가짜 Firestore만 씀(운영 prd_locks에 닿지 않음) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..');
const T = fs.readFileSync(process.env.RN_APP || path.resolve(__dirname, '..', 'app.html'), 'utf8');
const rd = (f) => { for (const p of [path.join(ROOT, f), path.join(ROOT, 'src', f)]) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); return ''; };
const COL = rd('src/readnow-collector.src.js'), CL = rd('cloud/index.js'), WT = rd('readnow-price-watch.user.js');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } return S.slice(i); };
const lineOf = (S, pre, from) => { const i = S.indexOf(pre, from || 0); if (i < 0) return ''; return S.slice(i, S.indexOf('\n', i)); };
const AF = 'async function ';
// 웹앱 몫(서버 읽기·트랜잭션)은 관제소 판 ①-3 뒤에 따로 들어옴 — 세 곳만 먼저 낼 때를 위한 틀(지금은 네 곳 모두 봄).
const WEB_MUST = true; const WEB = T.includes('const PLK_SRV = ');
const tick = () => new Promise((r) => setImmediate(r));
const kst = (t) => new Date((t == null ? Date.now() : t) + 9 * 3600e3).toISOString().slice(0, 10);

/* ── 가짜 Firestore — 트랜잭션은 진짜처럼 「읽은 뒤 남이 바꿨으면 처음부터 다시」(낙관적 잠금) ── */
function mkDb() {
  const docs = new Map(), ver = new Map(); const st = { fail: false, gets: [], tx: 0, q: 0 };
  const cl = (v) => JSON.parse(JSON.stringify(v));
  const snap = (p) => { const v = docs.get(p); return { id: p.split('/')[1], exists: v !== undefined, data: () => (v === undefined ? undefined : cl(v)) }; };
  const mrg = (a, b) => { const o = { ...(a || {}) }; for (const k of Object.keys(b)) { const v = b[k]; if (v && typeof v === 'object' && '__inc' in v) o[k] = (+o[k] || 0) + v.__inc; else if (v && typeof v === 'object' && !Array.isArray(v)) o[k] = mrg(o[k], v); else o[k] = v; } return o; };
  const put = (p, v) => { docs.set(p, v); ver.set(p, (ver.get(p) || 0) + 1); };
  const rd1 = async (o) => { st.gets.push(o || null); if (st.fail) throw new Error('unavailable'); await tick(); };
  const ref = (col, id) => { const p = col + '/' + id; return { id, _p: p, get: async (o) => { await rd1(o); return snap(p); }, set: async (v, o) => { if (st.fail) throw new Error('unavailable'); await tick(); put(p, o && o.merge ? mrg(docs.get(p), v) : cl(v)); }, update: async (v) => { if (st.fail) throw new Error('unavailable'); await tick(); put(p, { ...(docs.get(p) || {}), ...cl(v) }); } }; };
  const qry = (col, f, op, val) => ({ get: async (o) => { st.q++; await rd1(o); if (op === 'in' && val.length > 10) throw new Error('in 은 열 개까지'); const out = []; for (const [p, v] of docs) { if (!p.startsWith(col + '/')) continue; const id = p.split('/')[1]; const x = f === '__id__' ? id : v[f]; if (op === 'in' ? val.includes(x) : x === val) out.push(snap(p)); } return { docs: out, forEach: (fn) => out.forEach(fn), size: out.length, empty: !out.length }; } });
  const db = { _st: st, _docs: docs, seed: (col, id, v) => put(col + '/' + id, cl(v)), val: (col, id) => docs.get(col + '/' + id),
    collection: (col) => ({ doc: (id) => ref(col, id), where: (f, op, val) => qry(col, f, op, val) }),
    runTransaction: async (fn) => { if (st.fail) throw new Error('unavailable'); for (let a = 0; a < 6; a++) { st.tx++; const R = new Map(), Wr = []; const tx = { get: async (r) => { await tick(); R.set(r._p, ver.get(r._p) || 0); return snap(r._p); }, update: (r, v) => { Wr.push([r._p, v, 0]); }, set: (r, v, o) => { Wr.push([r._p, v, o && o.merge ? 2 : 1]); } }; await fn(tx); await tick(); if ([...R].every(([p, v]) => (ver.get(p) || 0) === v)) { Wr.forEach(([p, v, m]) => put(p, m === 1 ? cl(v) : m === 2 ? mrg(docs.get(p), v) : { ...(docs.get(p) || {}), ...cl(v) })); return; } } throw new Error('aborted'); } };
  return db;
}
const FB = { firestore: { FieldPath: { documentId: () => '__id__' }, FieldValue: { increment: (n) => ({ __inc: n }) } } };

(async () => {
  console.log('① 도우미 글 — 네 곳 같은 글');
  const NAMES = ['PLK_MKT_MAX_H', 'plkDayKst', 'plkDayStep', 'plkDayMine', 'plkMktOld', 'plkPickOn', 'plkTkNew'];
  const hp = (S, n) => { const out = []; let i = 0; for (;;) { const j = S.indexOf('const ' + n + ' = ', i); if (j < 0) break; out.push(S.slice(j, S.indexOf('\n', j)).trimEnd()); i = j + 10; } return out; };
  const HA = NAMES.map((n) => hp(WEB ? T : WT, n)), HW = NAMES.map((n) => hp(WT, n)), HK = NAMES.map((n) => hp(CL, n)), HC = NAMES.map((n) => hp(COL, n));
  ok(HA.every((a) => a.length === 1) && HW.every((a) => a.length === 1) && HK.every((a) => a.length === 1), '웹앱·가격 감시기·클라우드에 일곱 줄이 한 번씩', [HA.map((a) => a.length), HW.map((a) => a.length), HK.map((a) => a.length)]);
  ok(NAMES.every((n, i) => HW[i][0] === HA[i][0] && HK[i][0] === HA[i][0] && HC[i].length >= 1 && HC[i].every((x) => x === HA[i][0])), '네 곳이 한 글자도 다르지 않음', NAMES.filter((n, i) => !(HW[i][0] === HA[i][0] && HK[i][0] === HA[i][0] && HC[i].every((x) => x === HA[i][0]))));
  ok(hp(COL, 'plkPickOn').length === 2 && hp(COL, 'plkDayStep').length === 1, '수집기 — 잠금 읽기 두 벌 앞에 plkPickOn · 세는 도우미는 고치는 쪽 한 벌');
  if (WEB || WEB_MUST) ok(WEB, '웹앱 몫이 들어 있음'); if (!WEB) console.log('  · 웹앱 몫은 아직 없음 — 가격 감시기·수집기·클라우드만 봄');
  const HELP = HA.map((a) => a[0]).join('\n') + '\n';
  const H = new Function(HELP + 'return { PLK_MKT_MAX_H, plkDayKst, plkDayStep, plkDayMine, plkMktOld, plkPickOn, plkTkNew };')();
  const clampL = (T.match(/const plkClamp = \(lk, p, x\) => \{.*\};/) || [''])[0]; const blockL = lineOf(T, 'const plkBlock = ');
  const plkClamp = new Function(clampL + '\nreturn plkClamp;')();
  const LK = (cond, o) => ({ on: true, mode: 'cond', cond, ...(o || {}) });
  try { new vm.Script('(function (exports, require, module, __filename, __dirname) {' + CL + '\n})', { filename: 'cloud-index' }); ok(true, '클라우드 파일 문법'); } catch (e) { ok(false, '클라우드 파일 문법', String(e)); }
  ok(H.plkDayKst(Date.parse('2026-11-19T15:00:00Z')) === '2026-11-20' && H.plkDayKst(Date.parse('2026-11-19T14:59:59Z')) === '2026-11-19', '날짜는 한국 시각(자정 = UTC 15시)');
  { const a = H.plkTkNew('web'), b = H.plkTkNew('web'); ok(a !== b && /^web[0-9a-z]+$/.test(a) && H.plkTkNew('w')[0] === 'w', '표는 결정마다 다름', [a, b]); }

  console.log('② 둘이 동시에 더해도 2 — 하루 횟수·금액');
  { /* 셈만 */
    let r = H.plkDayStep(LK({ dayN: 3 }), 'a', 10000, 9500); ok(r.ok && r.day.n === 1 && r.day.amt === 500 && r.day.tk.a === 500 && r.day.d === kst(), '첫 번 — 1번·500원·표 적음', r);
    r = H.plkDayStep(LK({ dayN: 3 }, { day: r.day }), 'a', 10000, 9500); ok(r.ok && r.dup === 1 && !r.day, '같은 표는 또 세지 않음', r);
    r = H.plkDayStep(LK({ dayN: 3 }, { day: { d: '2000-01-01', n: 9, amt: 99999, tk: { z: 1 } } }), 'b', 10000, 9000); ok(r.ok && r.day.n === 1 && r.day.amt === 1000 && !('z' in r.day.tk), '날짜가 바뀌면 0부터(어제 표도 버림)', r);
    r = H.plkDayStep(LK({ dayN: 1 }, { day: { d: kst(), n: 1, amt: 0 } }), 'b', 10000, 9000); ok(!r.ok && /다 씀/.test(r.why), '횟수 한도에 닿으면 세지 않고 막음', r);
    r = H.plkDayStep(LK({ dayAmt: 1000 }, { day: { d: kst(), n: 1, amt: 800 } }), 'b', 10000, 9500); ok(!r.ok, '금액 한도를 넘으면 막음', r);
    r = H.plkDayStep(LK({ dayAmt: 1000 }, { day: { d: kst(), n: 1, amt: 500 } }), 'b', 10000, 9500); ok(r.ok && r.day.amt === 1000, '금액 한도에 딱 닿는 것은 됨', r);
    r = H.plkDayStep({ on: true, mode: 'full' }, 'b', 10000, 9500); ok(r.ok && r.skip === 1, '조건 잠금이 아니면 세지 않음', r);
    r = H.plkDayStep(LK({ dayN: 3 }), 'u', 9000, 9500); ok(r.ok && r.day.n === 1 && r.day.amt === 0, '올림은 횟수만(금액 0)', r);
  }
  /* 네 곳의 세는 함수를 진짜 글 그대로 */
  const mk = (src, db) => new Function('db', 'C', 'firebase', 'S', HELP + 'const plkMap = () => S.plk || (S.plk = new Map());\n' + src)(db, (n) => db.collection(n), FB, { plk: new Map(), plist: new Map() });
  const CNT = { '가격 감시기 plkCntW': (db) => mk(fnIn(WT, 'plkCntW', AF) + '\nreturn plkCntW;', db), '수집기 plkCntPc': (db) => mk(fnIn(COL, 'plkCntPc', AF) + '\nreturn plkCntPc;', db), '클라우드 plkCntCl': (db) => mk(fnIn(CL, 'plkCntCl', AF) + '\nreturn plkCntCl;', db),
    '웹앱 plkNote': (db) => { const f = mk(fnIn(T, 'plkNote', AF) + '\nreturn plkNote;', db); return async (k, tk, cur, p) => (await f(k, { id: k, on: true, mode: 'cond' }, { cur, p, tk })) || { ok: false, err: 1 }; } };
  if (!WEB) delete CNT['웹앱 plkNote'];
  for (const [name, make] of Object.entries(CNT)) {
    let db = mkDb(); db.seed('prd_locks', 'K1', LK({ dayN: 5, dayAmt: 5000 })); let f = make(db);
    let R = await Promise.all([f('K1', 'a', 10000, 9500), f('K1', 'b', 10000, 9500)]); let v = db.val('prd_locks', 'K1');
    ok(R.every((r) => r && r.ok) && v.day.n === 2 && v.day.amt === 1000 && v.day.tk.a === 500 && v.day.tk.b === 500 && db._st.tx >= 3, name + ' — 둘이 동시에 더해도 2(금액 1,000원 · 겹치면 다시 돎)', { day: v.day, tx: db._st.tx });
    R = await Promise.all([f('K1', 'a', 10000, 9500), f('K1', 'a', 10000, 9500)]); v = db.val('prd_locks', 'K1'); ok(v.day.n === 2, name + ' — 같은 표를 또 세도 그대로 2', v.day);
    db = mkDb(); db.seed('prd_locks', 'K2', LK({ dayN: 1 })); f = make(db); R = await Promise.all([f('K2', 'a', 10000, 9500), f('K2', 'b', 10000, 9500)]); v = db.val('prd_locks', 'K2');
    ok(R.filter((r) => r && r.ok).length === 1 && v.day.n === 1, name + ' — 한도 1번이면 동시에 둘 중 하나만', { R, day: v.day });
    db = mkDb(); db.seed('prd_locks', 'K3', LK({ dayN: 5 }, { day: { d: '2000-01-01', n: 5, amt: 100 } })); f = make(db); await f('K3', 'a', 10000, 9000); v = db.val('prd_locks', 'K3'); ok(v.day.d === kst() && v.day.n === 1 && v.day.amt === 1000, name + ' — 날짜가 바뀌면 0부터', v.day);
    db = mkDb(); db.seed('prd_locks', 'K4', LK({ dayN: 5 })); f = make(db); db._st.fail = true; R = await f('K4', 'a', 10000, 9000); ok(R && R.ok === false && R.err === 1, name + ' — 못 세면 「못 셈」으로 알림(조용히 넘어가지 않음)', R);
  }
  if (WEB) { const db = mkDb(); db.seed('prd_locks', 'K5', LK({ dayN: 5 })); const f = mk(fnIn(T, 'plkNote', AF) + '\nreturn plkNote;', db);
    await Promise.all([f('K5', { id: 'K5', on: true }, { hit: 1, p: 9000, want: 8000, why: '선 밖' }), f('K5', { id: 'K5', on: true }, { hit: 1, p: 9000, want: 8100, why: '선 밖' })]); const v = db.val('prd_locks', 'K5'); ok(v.hit.n === 2 && v.hit.by === 'web', '웹앱 — 막은 횟수도 서버에서 더함(둘이 함께 2)', v.hit); }
  { ok(/hit: \{ n: firebase\.firestore\.FieldValue\.increment\(1\)/.test(fnIn(WT, 'plkNoteW', AF)) && !/day:/.test(fnIn(WT, 'plkNoteW', AF)), '가격 감시기 plkNoteW — 막은 횟수는 increment · 하루 횟수는 여기서 안 씀(plkCntW 한 곳)'); }
  ok((!WEB || /const o = \{ at: Date\.now\(\), tk: plkTkNew\('web'\)/.test(fnIn(T, 'plkCtx'))) && /at: Date\.now\(\), tk: plkTkNew\('w'\)/.test(WT), '결정마다 시장 값을 찍은 때(at)·표(tk)를 plkx에 실음(웹앱·가격 감시기)');
  if (WEB) ok((T.match(/plkNote\([^\n;]*?tk: /g) || []).length === 4, '웹앱 — 하루 횟수를 세는 네 곳이 모두 표를 넘김', (T.match(/plkNote\([^\n;]*?tk: /g) || []).length);
  ok(/if \(PLKQ && !raced && rec\.approval && rec\.approval\.plkx && rec\.approval\.plkx\.tk === PLKQ\.tk\)/.test(WT) && WT.indexOf('PLKQ = PLKD') < WT.indexOf('if (PLKQ && !raced'), '가격 감시기 — 자동 승인이 실제로 적힌 뒤에만 셈(승인이 안 되면 안 늘어남)');
  ok(/approvalState: 'pending'[^\n]*autoBlock/.test(lineOf(WT, 'if (PLKQ && !raced')), '가격 감시기 — 세다 한도를 넘으면 그 자동 승인을 거둠(선택 대기로)');

  console.log('③ 반영 직전 하루 한도 넘으면 막힘');
  const reSrc = (S, cnt, tkExpr) => { const i = S.indexOf('if (!m) m = plkMktOld(lk, x, v.createdAt || null);'); const j = S.indexOf('\n', S.indexOf('\n', i) + 1); const body = S.slice(i, j); ok(i > 0 && body.includes(cnt) && body.includes(tkExpr), cnt + ' — 반영 직전 다시 셈 글이 있음'); return body; };
  const mkRe = (S, cntName, tkExpr, idVars, db) => { const body = reSrc(S, cntName, tkExpr); return new Function('db', 'C', HELP + clampL + '\n' + fnIn(S, cntName, AF) + '\nreturn async (lk, x, v, ' + idVars + ', cur0, want) => { let m = "";\n' + body + '\nreturn m; };')(db, (n) => db.collection(n)); };
  const day1 = (n, amt, tk) => ({ d: kst(), n, amt, ...(tk ? { tk } : {}) }); const nowIso = new Date().toISOString();
  for (const [name, S0, cnt, tkE, idV, idVal] of [['수집기', COL, 'plkCntPc', "'o' + id", 'id', 'CMD1'], ['클라우드', CL, 'plkCntCl', "'o' + ref.id", 'ref', { id: 'CMD1' }]]) {
    const run = async (lock, x, v) => { const db = mkDb(); db.seed('prd_locks', 'K', lock); const f = mkRe(S0, cnt, tkE, idV, db); const lk = JSON.parse(JSON.stringify(lock)); Object.defineProperty(lk, '_k', { value: 'K', enumerable: false }); const m = await f(lk, x, { listingKey: 'K', createdAt: nowIso, ...(v || {}) }, idVal, 10000, 9500); return { m, day: db.val('prd_locks', 'K').day }; };
    let r = await run(LK({ dayN: 1 }, { day: day1(1, 500, { other: 500 }) }), { at: Date.now(), tk: 'mine', cur: 10000 });
    ok(/다 씀/.test(r.m) && /다시 결정/.test(r.m) && r.day.n === 1, name + ' — 그 사이 다른 결정이 오늘 한도를 다 쓰면 막고 다시 결정으로', r);
    r = await run(LK({ dayN: 1 }, { day: day1(1, 500, { mine: 500 }) }), { at: Date.now(), tk: 'mine', cur: 10000 });
    ok(r.m === '' && r.day.n === 1 && r.day.amt === 500, name + ' — 내 몫(같은 표)은 빼고 셈 → 통과 · 두 번 세지 않음', r);
    r = await run(LK({ dayAmt: 800 }, { day: day1(1, 500, { other: 500 }) }), { at: Date.now(), tk: 'mine', cur: 10000 });
    ok(r.m !== '' && /다시 결정/.test(r.m) && r.day.amt === 500, name + ' — 하루 금액 한도를 넘으면 막음(줄여서 내지 않음)', r);
    r = await run(LK({ dayN: 3 }, { day: { d: '2000-01-01', n: 3, amt: 0, tk: { mine: 500 } } }), { at: Date.now(), tk: 'mine', cur: 10000 });
    ok(r.m === '' && r.day.d === kst() && r.day.n === 1 && r.day.tk.mine === 500, name + ' — 결정한 날이 지나 반영되면 오늘 몫으로 지금 셈', r);
    r = await run(LK({ dayN: 3 }, { day: day1(1, 500) }), { cur: 10000 });
    ok(r.m === '' && r.day.n === 1, name + ' — 표 없는 옛 결정이 오늘 것이면 이미 센 것으로(또 세지 않음)', r);
    r = await run(LK({ dayN: 3 }), { cur: 10000 }, { createdAt: new Date(Date.now() - 30 * 3600e3).toISOString() });
    ok(r.m === '' && r.day && r.day.n === 1 && r.day.tk.oCMD1 === 500, name + ' — 표 없는 옛 결정이 어제 것이면 명령 이름으로 한 번 셈', r);
    r = await run(LK({ lowOff: 0 }), { at: Date.now() - 25 * 3600e3, tk: 'mine', cur: 10000, low: 9000 });
    ok(/시장 값이 25시간 전/.test(r.m) && !r.day, name + ' — 시장 값에 기대는 조건인데 25시간 지난 값이면 막음(세지 않음)', r);
  }
  { const i = WT.indexOf("if (plkBlock(lkW, ['price']).cond) {"); const seg = WT.slice(i, WT.indexOf('\n      /*', i + 10) > 0 ? WT.indexOf('(11/18 lockcond1) 조건 잠금 — 보내기 직전 다시 셈', i) : i + 3000);
    const at = (s) => seg.indexOf(s); ok(i > 0 && at('plkMktOld(lkW, x0, ap.at)') > 0 && at('plkMktOld(lkW, x0, ap.at)') < at('plkDayMine(lkW, tkC, curW, price, null)') && at('plkDayMine(lkW, tkC') < at('plkClamp(M.lk, price, { ...x0, cur: curW })') && at('plkClamp(M.lk, price') < at('plkCntW(lkW._k || x.key, tkC, curW, price)'), '가격 감시기 — 반영 직전: 오래된 시장 값 → 내 몫 빼기 → 하루 한도까지 다시 셈 → 안 세어졌으면 셈', [at('plkMktOld('), at('plkDayMine('), at('plkClamp(M.lk'), at('plkCntW(')]);
    ok(/approvalState: 'stale'/.test(seg) && /다시 결정/.test(seg) && /if \(!Q2\.ok \|\| Q2\.p !== price\)/.test(seg), '가격 감시기 — 넘으면 「다시 결정」(stale)으로 · 줄여서 내지 않음');
    ok(!/noDay/.test(seg.slice(at('plkDayMine(lkW, tkC'))), '가격 감시기 — 둘째 셈은 하루 한도를 봄(noDay 없음)'); }
  for (const [n, S0] of [['수집기', COL], ['클라우드', CL]]) { const b = lineOf(S0, 'if (!m) { const tkC = String(x.tk ||'); ok(/plkClamp\(M\.lk, want, \{ \.\.\.x, cur: cur0 \}\)/.test(b) && !/noDay/.test(b) && /Q2\.p !== want/.test(b), n + ' — 둘째 셈은 하루 한도를 봄(noDay 없음) · 줄어드는 값도 막음'); }
  { /* 하루 한도에서 내 몫 빼기 */
    let M = H.plkDayMine(LK({ dayN: 1 }, { day: day1(1, 500, { a: 500 }) }), 'a', 10000, 9500); ok(M.mine && M.lk.day.n === 0 && M.lk.day.amt === 0 && plkClamp(M.lk, 9500, { cur: 10000 }).ok, '내 표가 있으면 1번·500원을 빼고 판정 → 통과', M);
    M = H.plkDayMine(LK({ dayN: 1 }, { day: day1(1, 500, { a: 500 }) }), 'b', 10000, 9500); ok(!M.mine && !plkClamp(M.lk, 9500, { cur: 10000 }).ok, '남의 표뿐이면 그대로 → 막힘', M);
    M = H.plkDayMine(LK({ dayN: 1 }, { day: { d: '2000-01-01', n: 1, amt: 0, tk: { a: 1 } } }), 'a', 10000, 9500); ok(!M.mine, '어제 표는 내 몫이 아님', M); }

  console.log('④ 끊긴 때는 잠긴 것으로 — 서버에서만 읽기 · 나눠 읽기 · 상품 번호 잠금');
  const mkApp = (db, plist) => new Function('db', 'firebase', 'S', HELP + 'const plkMap = () => S.plk || (S.plk = new Map());\n' + lineOf(T, 'const PLK_SRV = ') + '\n' + [['plkFresh'], ['plkChunks'], ['plkFreshMany'], ['plkLockedIds']].map(([n]) => fnIn(T, n, AF)).join('\n') + '\nreturn { plkFresh, plkFreshMany, plkLockedIds, S };')(db, FB, { plk: new Map(), plist: plist || new Map() });
  if (WEB) { const db = mkDb(); db.seed('prd_locks', 'A', { on: true, mode: 'full' }); db.seed('prd_locks', 'B', { on: false }); db.seed('prd_locks', 'Lx', { on: true, mode: 'cond', cond: { dayN: 1 }, lid: '777' }); db.seed('prd_locks', 'Ly', { on: false, lid: '888' });
    const A = mkApp(db, new Map([['B', { listingId: '777' }], ['D', { listingId: '888' }], ['E', { listingId: '777' }]]));
    let v = await A.plkFresh('A'); ok(v && v.on === true && v.id === 'A', 'plkFresh — 자기 문서가 켜져 있으면 그것', v);
    ok(db._st.gets.length > 0 && db._st.gets.every((o) => o && o.source === 'server'), 'plkFresh — 읽기는 모두 서버에서(source server)', db._st.gets);
    v = await A.plkFresh('B', { listingId: '777' }); ok(v && v.on === true && v.id === 'Lx', 'plkFresh — 자기 문서가 꺼져 있어도 상품 번호(lid) 잠금이 켜져 있으면 그것', v);
    v = await A.plkFresh('B', { listingId: '888' }); ok(v && v.on === false, 'plkFresh — 둘 다 꺼져 있으면 잠금 아님', v);
    v = await A.plkFresh('ZZ', { listingId: '999' }); ok(v === null, 'plkFresh — 문서가 없으면 null', v);
    db._st.gets.length = 0; let M = await A.plkFreshMany(['A', 'B', 'D', 'E', 'Q']);
    ok(M && M.get('A').on === true && M.get('B').id === 'Lx' && M.get('E').id === 'Lx' && !M.get('D') && !M.get('Q'), 'plkFreshMany — 키 잠금 + 그 상품 번호로 건 잠금(꺼진 자기 문서보다 켜진 lid 잠금)', [...M].map(([k, x]) => [k, x.id, x.on]));
    ok(db._st.gets.every((o) => o && o.source === 'server'), 'plkFreshMany — 모두 서버에서');
    let L = await A.plkLockedIds(['A', 'B', '777', '888', 'none']); ok(L && L.has('A') && L.has('777') && !L.has('B') && !L.has('888') && L.size === 2, 'plkLockedIds — 키·상품 번호 섞여도 켜진 것만', L && [...L]);
    db._st.fail = true; v = await A.plkFresh('B', { listingId: '888' }); ok(v && v.on === true && v.unk === 1, '끊긴 때 plkFresh → 잠긴 것으로(unk)', v);
    ok((await A.plkFreshMany(['A', 'B'])) === null && (await A.plkLockedIds(['A'])) === null, '끊긴 때 plkFreshMany·plkLockedIds → null(부른 쪽이 멈춤)'); }
  if (WEB) { const db = mkDb(); const keys = []; for (let i = 0; i < 420; i++) { keys.push('k' + i); if (i % 7 === 0) db.seed('prd_locks', 'k' + i, { on: true, mode: 'full' }); } db.seed('prd_locks', 'far', { on: true, mode: 'full', lid: 'L419' });
    const A = mkApp(db, new Map(keys.map((k, i) => [k, { listingId: 'L' + i }]))); const M = await A.plkFreshMany(keys);
    ok(M && [...M.values()].filter((v) => v.on === true).length === 61 && M.get('k419').id === 'far' && db._st.q === 84, '420개 — 300개가 넘어도 서버에서 열 개씩 나눠 읽음(키 42번 + 상품 번호 42번)', { n: M && M.size, q: db._st.q });
    ok(!/keys\.length > 300/.test(fnIn(T, 'plkFreshMany', AF)) && !/ids\.length > 300/.test(fnIn(T, 'plkLockedIds', AF)), '「300개 넘으면 실시간 듣기 값」 지름길을 없앰'); }
  { const mkW = (db) => new Function('db', 'C', HELP + lineOf(WT, 'let PLKC = ') + '\n' + fnIn(WT, 'plkReadW', AF) + '\nreturn { plkSetW, plkReadW };')(db, (n) => db.collection(n));
    let db = mkDb(); db.seed('prd_locks', 'A', { on: true, mode: 'full' }); db.seed('prd_locks', 'Lx', { on: true, mode: 'full', lid: '777' }); db.seed('prd_locks', 'B', { on: false });
    let W = mkW(db); let S1 = await W.plkSetW(); ok(S1 && S1.has('A') && S1.has('Lx') && S1.has('lid:777') && !S1.has('B'), '가격 감시기 plkSetW — 상품 번호 잠금도 lid:번호로 담음', S1 && [...S1]);
    let v = await W.plkReadW({ key: 'B', listingId: '777' }); ok(v && v.on === true && v._k === 'Lx' && !Object.keys(v).includes('_k'), '가격 감시기 plkReadW — 꺼진 자기 문서보다 켜진 lid 잠금 · 그 문서 이름(_k)은 안 보이는 속성', v && { ...v, _k: v._k });
    v = await W.plkReadW({ key: 'A', listingId: '777' }); ok(v && v._k === 'A', '가격 감시기 plkReadW — 자기 문서가 켜져 있으면 그것', v && v._k);
    db = mkDb(); db._st.fail = true; W = mkW(db); ok((await W.plkSetW()) === null, '가격 감시기 — 잠금 목록을 한 번도 못 읽으면 null(자동 승인 안 만듦)'); ok((await W.plkReadW({ key: 'A' })) === undefined, '가격 감시기 plkReadW — 못 읽으면 undefined(잠긴 것으로)');
    ok(/if \(!LSW\) why\.push\('🔒 잠금 목록을 못 읽음/.test(WT) && /LSW\.has\('lid:' \+ listing\.listingId\)/.test(WT), '가격 감시기 — 못 읽으면 자동 반영하지 않음 · 판정에서 lid 잠금도 봄'); }
  for (const [n, S0, fn] of [['수집기', COL, 'plkReadPc'], ['클라우드', CL, 'plkReadCl']]) { const b = fnIn(S0, fn, AF); ok(/where\('lid', '==',/.test(b) && /plkPickOn\(own, by\)/.test(b) && /_k/.test(b), n + ' ' + fn + ' — 꺼진 자기 문서보다 켜진 lid 잠금 · 문서 이름 _k'); }
  if (WEB) { const b = fnIn(T, 'bqExecCore', AF) /* (recf1) 확정 본문은 바깥 bqExecCore */; const i1 = b.indexOf('(11/19 lkday1 · 검토 1-5) 잠금도 저장 바로 앞에서 한 번 더'), i2 = b.indexOf('const M2 = await plkFreshMany(pickL.map('), i3 = b.indexOf('plkNote(keyOf(p.x), p.plkv');
    ok(i1 > 0 && i2 > i1 && i3 > i2, '수동 일괄 batchExec0 — 저장 바로 앞에서 잠금을 다시 읽음', [i1, i2, i3]);
    const seg = b.slice(i1, b.indexOf('\n', b.indexOf('if (lk2.length)', i1))); ok(/if \(!M2\) return toast\(/.test(seg) && /if \(!plkCondOk\(v\)\) \{ lk2\.push\(p\); continue; \}/.test(seg) && /if \(!Q\.ok \|\| Q\.p !== p\.price\) \{ lk2\.push\(p\); continue; \}/.test(seg) && /pickL = pickL\.filter\(\(p\) => !lk2\.includes\(p\)\)/.test(seg), '— 못 읽으면 멈춤 · 그 사이 잠긴 것·조건 선 밖은 빼고 확정'); }

  console.log('⑤ 오래된 시장 값이면 막힘 — 24시간');
  { const now = Date.now(), h = (n) => now - n * 3600e3; ok(H.PLK_MKT_MAX_H === 24, '기준 시간 24시간');
    ok(H.plkMktOld(LK({ lowOff: 0 }), { at: h(23) }, null, now) === '' && /25시간 전/.test(H.plkMktOld(LK({ lowOff: 0 }), { at: h(25.5) }, null, now)), '유효 최저가 조건 — 23시간은 통과 · 25시간은 막음');
    ok(['topOff', 'gapUp', 'gapDn'].every((q) => H.plkMktOld(LK({ [q]: 500 }), { at: h(30) }, null, now) !== ''), '최상단·차이 조건도 같음');
    ok(H.plkMktOld(LK({ dayN: 1, min: 5000, max: 9000 }), { at: h(100) }, null, now) === '', '시장 값에 안 기대는 조건(하루 횟수·하한·상한)은 오래돼도 막지 않음');
    ok(/언제 것인지 모름/.test(H.plkMktOld(LK({ lowOff: 0 }), {}, null, now)), '찍은 때를 모르면 막음(안전 쪽)');
    ok(H.plkMktOld(LK({ lowOff: 0 }), {}, new Date(h(2)).toISOString(), now) === '' && H.plkMktOld(LK({ lowOff: 0 }), {}, new Date(h(26)).toISOString(), now) !== '', '옛 결정(찍은 때 없음)은 결정·명령 시각으로');
    ok(H.plkMktOld({ on: true, mode: 'full' }, {}, null, now) === '' && H.plkMktOld({ on: false, mode: 'cond', cond: { lowOff: 0 } }, {}, null, now) === '', '조건 잠금이 아니면 보지 않음'); }

  console.log('⑥ 잠금 실행 스위치와 상관없이 반영 직전 다시 셈이 늘 돎');
  { const SW = /ctrlLkOpt|lkopt/; const b = fnIn(T, 'bqExecCore', AF) /* (recf1) 확정 본문은 바깥 bqExecCore */; const i1 = b.indexOf('(11/19 lkday1 · 검토 1-5)');
    if (WEB) ok(![fnIn(T, 'plkFresh', AF), fnIn(T, 'plkFreshMany', AF), fnIn(T, 'plkLockedIds', AF), fnIn(T, 'plkNote', AF), b.slice(i1, i1 + 1500)].some((s) => SW.test(s)), '웹앱 — 서버 읽기·저장 직전 다시 보기·하루 세기가 스위치를 보지 않음');
    ok(!SW.test(WT) && !SW.test(COL) && !SW.test(CL), '가격 감시기·수집기·클라우드 — 스위치를 읽지 않음(실제 반영은 늘 잠금대로)'); }

  console.log(bad ? `\n❌ 실패 ${bad}` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험이 멈춤', e); process.exit(1); });
