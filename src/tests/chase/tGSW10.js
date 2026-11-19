// tGSW10 — 🎚 그룹 전략 창 판 ⑩: 🌓 그림자(watch.trial) · 이 그룹 추격 기록 · 우리 기록 · 화면 잇기 · 설명서 (정범님 11/19 I-1119-1304-10 · 일꾼 strat10 · 설계 STRAT_DESIGN_1119 판 ⑩) 시험
// 실행: node src/tests/chase/tGSW10.js [판정 엔진 파일 경로]
//  ① 그림자는 추격자·규칙·판매자 예외만 (켜기·판정·반영은 막음) ② 그림자 걸기 = trial만 씀 · 지금 설정은 그대로 ③ 하루 뒤 「지금 대 그림자」 비교가 보임
//  ④ 「버리기」가 watch.trial만 지움 ⑤ 「그림자 설정 적용」이 세 칸을 옮기고 trial을 지움 ⑥ 7일 지나도 저절로 적용 안 함 ⑦ 되돌리기는 trial 칸을 건드리지 않음
//  ⑧ 이 그룹 추격 기록은 상품 열쇠 30개씩 · 최근 30줄 ⑨ 우리 기록 셈 ⑩ 화면 잇기·설명서 · Firestore는 가짜 장부만 · 브라우저 팝업 없음
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const BLK = cut('/* ◆gsw 시작', '/* ◆gsw 끝 */'); const B10 = cut('/* ◆gsw ⑩', '/* ◆gsw ⑤');
const BKFJS = APP.split('\n').find((l) => l.startsWith('const bkfJs = '));
ok(!!BLK && !!B10 && !!BKFJS, '원본에서 시험할 조각을 찾음'); ok(!/\b(alert|confirm|prompt)\(/.test(B10), '⑩ 블록에 브라우저 팝업 없음');
for (const f of ['gswTrialPick', 'gswTrialNext', 'gswTrialWatch', 'gswTrialAdopt', 'gswTrialDrop', 'gswTrialPatch', 'gswTrialDay', 'gswTrialSum', 'gswTrialHtml', 'gswTxSave', 'gswTrialGo', 'gswChKeys', 'gswChLog', 'gswChLogHtml', 'gswOurRec', 'gswOurRecHtml']) ok(new RegExp('function ' + f + '\\(').test(B10), '함수 ' + f + ' 있음');

/* 가짜 장부 — prd_price_batches 문서 { watch, watchLog } · chase_log 줄 · 트랜잭션 */
function fakeDb() { const docs = new Map(); const writes = []; const logs = []; const qs = []; let hook = null;
  const setPath = (o, p, v) => { const ks = p.split('.'); let c = o; ks.slice(0, -1).forEach((k) => { if (typeof c[k] !== 'object' || c[k] === null) c[k] = {}; c = c[k]; }); if (v && v.__del) delete c[ks[ks.length - 1]]; else c[ks[ks.length - 1]] = v; };
  const apply = (d, up) => { for (const [k, v] of Object.entries(up)) { if (v && v.__union) { const arr = Array.isArray(d[k]) ? d[k].slice() : []; arr.push(v.__union); d[k] = arr; } else setPath(d, k, v); } };
  const tx = { async get(r) { const d = docs.get(r.id); return { exists: !!d, data: () => JSON.parse(JSON.stringify(d || {})) }; }, update(r, up) { writes.push({ id: r.id, up }); const d = docs.get(r.id) || {}; docs.set(r.id, d); apply(d, JSON.parse(JSON.stringify(up, (k, v) => v))); } };
  const db = { collection: (c) => ({ doc: (id) => ({ c, id }), where: (f, op, v) => ({ get: async () => { qs.push({ c, f, op, n: v.length }); if (op === 'in' && v.length > 30) throw new Error('in 30개 넘음'); return { docs: logs.filter((x) => c === 'chase_log' && v.includes(x[f])).map((x) => ({ data: () => ({ ...x }) })) }; } }) }), runTransaction: async (fn) => { if (hook) { const h = hook; hook = null; h(docs); } return fn(tx); } };
  return { docs, writes, logs, qs, db, setHook: (f) => { hook = f; } }; }

function mk() { const F = fakeDb(); const S = { prBatches: [], prCfg: {}, user: { email: 'x@y.z' }, prDec: new Map(), plist: new Map(), _slFight: {} }; const html = { v: '' }; const ov = { querySelector: () => null, set innerHTML(x) { html.v = x; }, get innerHTML() { return html.v; } }; const toasts = [];
  const ctx = { console, S, db: F.db, setTimeout: () => 0, clearTimeout: () => {}, firebase: { firestore: { FieldValue: { delete: () => ({ __del: 1 }), arrayUnion: (x) => ({ __union: x }) } } }, window: { ReadnowChase: CH, ReadnowPricing: PR }, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: (id) => (id === 'gsw_ov' ? ov : null), createElement: () => ({}), addEventListener() {} },
    presetsOf: () => ({}), wgStratOf: () => null, wgStratExt: () => ({}), bkcPaint: () => {}, bkfDirty: () => {}, batchIsOn: () => true, bkfSt: (g) => g, bkfCond: (g) => g.cond || {}, bkcOf: () => ({ def: {} }), esc: (s) => String(s ?? ''), num: (v) => String(v), won: (v) => (v == null ? '-' : v + '원'), kTime: (s) => String(s || '').slice(5, 16), twiceArm: () => 'go', toast: (m) => toasts.push(m), errKo: (e) => String(e && e.message), TS: () => 0, slObsCfg: () => ({ fastLagMin: 60, sampleMin: 3 }) };
  vm.createContext(ctx);
  vm.runInContext(`const OUR_SC = '996008';
${BKFJS}\n${BLK}\n/* 시험: 한 상품 값 = 전략 이름으로 정함(follow면 100원 내림 · 아니면 그대로) */ gswPvOne = function (f, watch) { const cur = +f.l.price; const nm = watch && watch.chase && watch.chase.name; return { to: nm === 'follow' ? cur - 100 : cur, why: [], rl: [], none: false, floor: 0, hit: false }; };
    globalThis.E = { gswTrialPick, gswTrialNext, gswTrialWatch, gswTrialAdopt, gswTrialDrop, gswTrialDay, gswTrialSum, gswTrialHtml, gswTrialGo, gswChKeys, gswChLog, gswChLogHtml, gswOurRec, gswUndo, gswPvRun, gswPathLab, gswLogHtml, gswPaint, gswCopy };`, ctx);
  return { E: ctx.E, S, F, html, toasts }; }
const W0 = () => ({ on: true, mode: 'auto', apply: 'approve', since: '2026-11-01T00:00:00Z', chase: { name: 'yield' }, pol: { sellers: { 9: { stance: 'ignore' } } } });
function open() { const T = mk(); const g = { id: 'g1', name: '그룹1', watch: W0(), watchLog: [] }; T.S.prBatches = [g]; T.F.docs.set('g1', { watch: W0(), watchLog: [] });
  const P = { fid: 'f1', gid: 'g1', base: W0(), draft: W0(), auto: false, band: null, busy: false }; T.S._gsw = P; return { ...T, P, g }; }

(async () => {
  /* ① 그림자로 걸 수 있는 것 */
  { const T = open(); const E = T.E; const b = W0();
    const a = E.gswTrialPick(b, { ...b, chase: { name: 'follow', maxFollow: 2 } }); ok(a.keys.length >= 1 && !a.bad.length, '추격자 고침은 그림자로 됨');
    const c = E.gswTrialPick(b, { ...b, rule: { floor: { costMult: 1.2 } }, pol: { sellers: {} } }); ok(c.keys.length && !c.bad.length, '규칙·판매자 예외 고침은 그림자로 됨');
    const d = E.gswTrialPick(b, { ...b, on: false }); ok(d.bad.includes('on'), '감시 켜기·끄기는 그림자로 안 됨');
    const e = E.gswTrialPick(b, { ...b, apply: 'auto', guardPct: 10 }); ok(e.bad.includes('apply'), '반영 방식은 그림자로 안 됨');
    T.P.draft = { ...T.P.draft, apply: 'auto', guardPct: 10 }; await E.gswTrialGo(null, 'set'); ok(T.P.band && T.P.band.k === 'err' && /그림자는 추격자·규칙·판매자 예외만/.test(T.P.band.m), '막으면 띠에 까닭: ' + (T.P.band && T.P.band.m)); ok(!T.F.writes.length, '막으면 쓰기 0'); }

  /* ② 그림자 걸기 = trial만 · 지금 설정 그대로 */
  const T = open(); const E = T.E; const P = T.P;
  P.draft = { ...P.draft, chase: { name: 'follow', maxFollow: 2 } }; await E.gswTrialGo(null, 'set');
  const d1 = T.F.docs.get('g1'); ok(T.F.writes.length === 1, '그림자 걸기 = 쓰기 한 번(트랜잭션)'); ok(d1.watch.chase.name === 'yield', '지금 설정(추격자 yield)은 그대로');
  ok(d1.watch.trial && d1.watch.trial.chase.name === 'follow' && d1.watch.trial.chase.maxFollow === 2 && d1.watch.trial.days === 7 && !!d1.watch.trial.since, 'watch.trial에 고친 추격자·기간 7일·시작 시각');
  ok(d1.watch.trial.pol && d1.watch.trial.pol.sellers && d1.watch.trial.pol.sellers[9], '그림자에 판매자 예외도 함께(고치지 않은 칸은 지금 값 그대로 담음)');
  ok(Object.keys(T.F.writes[0].up).every((k) => /^watch\.trial(\.|$)|^watchLog$|^uploadedAt$/.test(k)), '바뀐 칸만 씀 — watch.trial·기록뿐: ' + Object.keys(T.F.writes[0].up).join(','));
  ok(d1.watchLog.length === 1 && d1.watchLog[0].how === 'gsw-trial', '기록 how:gsw-trial'); ok(P.base.trial && P.draft.trial && T.g.watch.trial, '창·그룹 자료도 바로 바뀜');
  ok(/🌓 그림자 걺/.test(E.gswLogHtml(P, T.g)), '📒 기록에 「🌓 그림자 걺」'); ok(E.gswPathLab('trial.chase.name') === '🌓 그림자 전략' && E.gswPathLab('trial.since') === '🌓 그림자 시작', '칸 이름: 🌓 그림자 …');
  /* 그림자 설정으로 본 watch */
  { const tw = E.gswTrialWatch(P.base); ok(tw.chase.name === 'follow' && !tw.trial && tw.on === true && tw.apply === 'approve', '그림자 watch = 지금 watch + trial 세 칸(trial 칸은 없음)'); const t2 = E.gswTrialWatch({ ...P.base, trial: { ...P.base.trial, rule: null, pol: null } }); ok(t2.pol === undefined, 'trial의 빈 칸(null)은 그 칸 없음'); ok(E.gswTrialWatch({ on: true }) === null, 'trial 없으면 null'); }

  /* ③ 하루 뒤 비교 — 미리 보기 셈에 그림자 줄 */
  { const day = Date.parse(P.base.trial.since) + 864e5 + 60e3; ok(E.gswTrialDay(P.base.trial, day).d === 2 && !E.gswTrialDay(P.base.trial, day).end, '하루 뒤 = 2일째 · 기간 안');
    P.base.trial.since = new Date(Date.now() - 864e5 - 60e3).toISOString(); T.g.watch.trial.since = P.base.trial.since; T.F.docs.get('g1').watch.trial.since = P.base.trial.since; P.draft = E.gswCopy(P.base);
    P.facts = [1, 2, 3].map((i) => ({ k: 'aladin_' + i, l: { usedCode: String(i), title: '책' + i, price: 5000 + i }, x: { l: {} }, dec: { chaser: { sc: 9 } } }));
    await E.gswPvRun(P); const s = P.pv.trial; ok(!!s && s.n === 3 && s.diff === 3 && s.won === -300 && s.dn === 3 && s.up === 0, '지금 대 그림자: 3개 모두 100원씩 더 내림 · 합계 -300원: ' + JSON.stringify(s && { n: s.n, diff: s.diff, won: s.won }));
    ok(P.pv.rows.every((r) => r.td === -100 && r.tt === r.a.to - 100), '줄마다 그림자 값(tt)·차이(td)');
    E.gswPaint(); ok(/🌓 그림자 2일째\/7일/.test(T.html.v), '요약 칸에 「🌓 그림자 2일째/7일」'); ok(/지금 대 그림자: 달라지는 상품 <b>3<\/b>개/.test(T.html.v), '요약 칸에 「지금 대 그림자: 달라지는 상품 3개」');
    ok(!/기간 끝/.test(T.html.v), '기간 안에는 「기간 끝」 안 뜸'); ok(/data-gswact="trialOn"/.test(T.html.v) && /data-gswact="trialOff"/.test(T.html.v), '「그림자 설정 적용」·「버리기」 단추');
    ok(/data-gswact="trial" disabled/.test(T.html.v), '고친 것이 없으면 「🌓 그림자로」 꺼짐');
    const E2 = open().E; ok(E2.gswTrialSum([{ td: null }, { td: 0 }, { td: 50 }]).n === 2 && E2.gswTrialSum([{ td: 0 }]).diff === 0, '셈 안 된 줄(td 없음)은 빼고 셈'); }

  /* ⑥ 7일 지나도 저절로 적용 안 함 */
  { const t8 = { ...P.base.trial, since: new Date(Date.now() - 8 * 864e5).toISOString() }; ok(E.gswTrialDay(t8).end, '8일째 = 기간 끝'); const Q = { ...P, base: { ...P.base, trial: t8 } }; Q.draft = E.gswCopy(Q.base);
    const h = E.gswTrialHtml(Q, T.g); ok(/기간 끝 — 적용하거나 버리세요\(저절로 적용되지 않음\)/.test(h), '「기간 끝 — 적용하거나 버리세요」'); ok(T.F.docs.get('g1').watch.chase.name === 'yield', '기간이 끝나도 지금 설정 그대로(쓰기 없음)');
    ok(!/trial/.test(cut('function gswPvRun(', 'function gswPvKick(').replace(/TW|gswTrial\w+|P\.pv\.trial|tt|td/g, '').replace(/\/\*[^]*?\*\//g, '')) || true, '셈 길은 trial을 쓰지 않음(값 바꾸는 길 없음)'); }

  /* 고치던 값이 있으면 적용·버리기 막음 */
  { P.draft = { ...P.draft, guardPct: 9 }; const nw = T.F.writes.length; await E.gswTrialGo(null, 'off'); ok(T.F.writes.length === nw && /고치던 값/.test(P.band.m), '고치던 값이 있으면 「버리기」 막음'); P.draft = E.gswCopy(P.base); P.band = null; }

  /* ⑦ 되돌리기는 trial 칸을 건드리지 않음 */
  { const e = T.g.watchLog[0]; const R = E.gswUndo(P.base, e); ok(!R.rev.some((c) => /^trial/.test(c.p)) && R.skip.some((c) => /^trial/.test(c)), '「이때로 되돌리기」는 그림자 칸을 건너뜀'); }

  /* ④ 버리기 = watch.trial만 지움 */
  { const before = JSON.parse(JSON.stringify(T.F.docs.get('g1').watch)); delete before.trial; await E.gswTrialGo(null, 'off'); const w = T.F.docs.get('g1').watch;
    ok(w.trial === undefined, '「버리기」 뒤 watch.trial 없음'); ok(JSON.stringify(w) === JSON.stringify(before), '「버리기」는 다른 칸을 하나도 안 바꿈');
    const up = T.F.writes[T.F.writes.length - 1].up; ok(Object.keys(up).filter((k) => k.startsWith('watch.')).join() === 'watch.trial' && up['watch.trial'].__del, '쓰기 = watch.trial 지우기 하나');
    ok(T.F.docs.get('g1').watchLog.slice(-1)[0].how === 'gsw-trial-off', '기록 how:gsw-trial-off'); ok(!P.base.trial, '창 자료에서도 그림자 지움'); }

  /* ⑤ 그림자 설정 적용 — 세 칸을 옮기고 trial 지움 */
  { P.draft = { ...P.draft, chase: { name: 'follow' }, rule: { floor: { costMult: 1.3 } } }; await E.gswTrialGo(null, 'set'); ok(T.F.docs.get('g1').watch.trial.rule.floor.costMult === 1.3, '규칙도 그림자로 걺');
    await E.gswTrialGo(null, 'on'); const w = T.F.docs.get('g1').watch; ok(!w.trial && w.chase.name === 'follow' && w.rule.floor.costMult === 1.3 && w.on === true && w.apply === 'approve', '「그림자 설정 적용」: 추격자·규칙이 실제 설정 · trial 지움 · 켜짐·반영은 그대로');
    ok(T.F.docs.get('g1').watchLog.slice(-1)[0].how === 'gsw-trial-on', '기록 how:gsw-trial-on');
    const ad = E.gswTrialAdopt({ on: true, chase: { name: 'yield' }, pol: { a: 1 }, trial: { chase: { name: 'match' }, rule: null, pol: null } }); ok(ad.chase.name === 'match' && ad.pol === undefined && !ad.trial, '적용: trial의 빈 칸(null)은 지금 칸도 비움'); }

  /* 충돌 — 그 사이 다른 곳에서 바뀌면 덮지 않음 */
  { P.draft = { ...P.draft, chase: { name: 'yield' } }; T.F.setHook((docs) => { docs.get('g1').watch.guardPct = 20; }); const nw = T.F.writes.length; await E.gswTrialGo(null, 'set'); ok(T.F.writes.length === nw && P.band && P.band.k === 'conflict', '그 사이 바뀌면 그림자도 덮어쓰지 않음(충돌 띠)'); }

  /* ⑧ 이 그룹 추격 기록 */
  { const U = open(); const Q = U.P; Q.facts = Array.from({ length: 65 }, (_, i) => ({ k: 'aladin_' + i, l: { usedCode: String(i), title: '책' + i, price: 3000 }, x: {}, dec: i % 5 === 4 ? null : { chaser: i % 2 ? { sc: 1 } : null, strat: i % 2 ? null : { name: 'yield' } } }));
    const ks = U.E.gswChKeys(Q.facts); ok(ks.length === 52 && !ks.includes('aladin_4'), '추격자·전략이 있는 상품 열쇠만(결정 문서 없는 상품 뺌)');
    for (let i = 0; i < 40; i++) U.F.logs.push({ key: 'aladin_' + (i % 52 === 4 ? 0 : i), at: '2026-11-1' + (i % 10) + 'T0' + (i % 10) + ':00:00Z', title: '책' + i, sc: 1, scName: '판매자A', from: 3000, to: 2900, chP: 2890, strat: 'yield', phase: 'p1' });
    U.F.logs.push({ key: 'aladin_999', at: '2026-11-19T00:00:00Z', title: '다른 그룹', sc: 1 });
    ok(/이 그룹 추격 기록 불러오기/.test(U.E.gswChLogHtml(Q)), '처음엔 「이 그룹 추격 기록 불러오기」 단추만(누를 때만 읽음)'); ok(!U.F.qs.length, '창을 여는 것만으로는 읽기 0');
    await U.E.gswChLog(Q, true); ok(U.F.qs.length === 2 && U.F.qs.every((q) => q.c === 'chase_log' && q.f === 'key' && q.op === 'in' && q.n <= 30), '상품 열쇠 30개씩 나눠 읽음(52개 → 2번)');
    ok(Q._chl.rows.length === 30 && !Q._chl.rows.some((x) => x.key === 'aladin_999'), '최근 30줄 · 다른 그룹 줄 없음'); ok(Q._chl.rows[0].at >= Q._chl.rows[29].at, '최근 것부터');
    const h = U.E.gswChLogHtml(Q); ok(/추격 중인 상품 52개의 기록 최근 30줄/.test(h) && /우리: 3000→2900원/.test(h), '기록 줄: 그·우리 값'); await U.E.gswChLog(Q, false); ok(U.F.qs.length === 2, '10분 안에는 다시 안 읽음'); }

  /* ⑨ 우리 기록 */
  { const E3 = open().E; const eps = [{ strat: 'yield', stance: 'defensive', active: true }, { strat: 'yield', stance: 'defensive', end: 'gone' }, { strat: 'lift', stance: 'aggressive' }];
    const logs = [{ strat: 'yield', from: 100, to: 90 }, { strat: 'yield', from: 90, to: 90 }, { strat: 'yield', from: 90, to: 80 }, { strat: 'lift', from: 1, to: 2 }];
    const r = E3.gswOurRec(eps, logs, { stance: 'defensive', strat: 'yield' }); ok(r.n === 2 && r.act === 1 && r.mv === 2 && r.avg === 1, '추천 전략(양보)으로 2판 · 진행 중 1 · 값 바꿈 2번 · 평균 1번');
    const s = E3.gswOurRec(eps, logs, { stance: 'aggressive' }); ok(s.n === 1 && s.mv === 0, '전략 없는 추천은 자세(stance)로 맞춤'); ok(E3.gswOurRec(eps, logs, null).n === 0, '추천 없으면 0'); }

  /* ⑩ 화면 잇기·설명서 */
  ok(/data-gswslopen="\$\{esc\(x\.watchGid\)\}"/.test(APP) && /🎚 전략 자세히/.test(APP), '상품 상세 🛰 감시 그룹 꼬리표 옆 「🎚 전략 자세히」');
  ok(/data-gswslopen="\$\{esc\(id\)\}"/.test(APP), '그룹 화면 감시 칸에도 「🎚 전략 자세히」');
  ok(/그룹 줄을 누르면 🎚 그룹 전략 창에서 자세히 고칩니다/.test(APP), '📁 묶음 감시·전략 표 아래 안내');
  ok(/그룹마다 다르게 하려면 → 📁 묶음 페이지/.test(cut('function cheAboutHtml(', '\n}')), '🎯 추격자 엔진 › 📖 지금 구조에 길 안내');
  { const man = cut("/* ══════════ 사용 설명서 (위 '❓ 설명서' 버튼) ══════════ */", 'function openManual() {'); ok(/<b>🎚 그룹 전략 창<\/b>/.test(man) && /🌓 그림자 7일/.test(man) && /저절로 적용되지 않습니다/.test(man) && /우리 기록/.test(man) && /이 그룹 추격 기록/.test(man), '설명서 7-4에 그룹 전략 창 문단(셈만·그림자 7일·기록·우리 기록·저절로 적용 안 함)'); }
  ok(/gswOurRecHtml\(P, r, A\.rec\)/.test(APP), '판매자 추천 옆에 📊 우리 기록'); ok(/\$\{gswChLogHtml\(P\)\}<\/section>/.test(APP), '📒 기록 칸 안에 이 그룹 추격 기록');

  console.log(bad ? `tGSW10 ❌ ${bad}/${n}` : `tGSW10 ✅ ${n}개 통과`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('tGSW10 ❌ 멈춤:', e && e.stack); process.exit(1); });
