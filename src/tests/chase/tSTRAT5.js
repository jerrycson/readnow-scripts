// tSTRAT5 — 🌓 감시 판 ④ 셈만 지킴(정범님 I-1119-1717-22 · 일꾼 strat5) 시험
// 실행: node src/tests/chase/tSTRAT5.js
//  ① 가격 감시기 wgDry — firstTry 없음/null/false만 「셈만 아님」 · 모양이 깨져도 셈만(분간 못 하면 안 쓰는 쪽)
//  ② 감시기 판정 갈래(원본에서 떼어 돌림): 셈만 그룹은 자동 승인·결정 대기·잠금 기록·묶음 멈춤 쓰기 0건 · 바꿀 뻔한 값만 rec.dry · 셈만을 끝내면 예전 그대로
//  ③ 반영 길(executeApproved) 마지막 지킴 — 셈만 그룹의 자동 승인은 보내지 않음 · 셈만 아닌 그룹은 그대로 보냄
//  ④ 웹앱 「모두 켜기」(bkcPlan)·등록 넘기기가 처음 켜는 그룹에 셈만을 붙임 · 이미 감시한 적 있는 그룹은 그대로
//  ⑤ ⚡ 문턱 — chFastOf(가격 공용 fastChaserOf와 같은 셈)·wgFastRule(그룹 기준 분·번)·감시기 wgFastTh가 같은 차례
// 시험 자료는 지어낸 값 · 손님 정보 없음 · 실제 Firestore·잠금(prd_locks) 안 씀
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const ROOT = firstOf([path.join(__dirname, '../../..'), path.join(__dirname, '../..')].filter((x) => fs.existsSync(path.join(x, 'readnow-pricing-core.js'))));
const PR = require(path.join(ROOT, 'readnow-pricing-core.js')); const CH = PR.Chase;
const PW = fs.readFileSync(path.join(ROOT, 'readnow-price-watch.user.js'), 'utf8');
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html'), path.join(ROOT, 'src', 'app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else if (process.env.V) console.log('  ✓', m); };
const cutS = (src, a, b, incl) => { const i = src.indexOf(a); const j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + (i < 0 ? a : b).slice(0, 60)); return src.slice(i, incl ? j + b.length : j); };
const fnBody = (src, name) => { const i = src.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) throw new Error('함수 없음: ' + name); let d = 0; const j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); } throw new Error('함수 끝 없음: ' + name); };

/* ① wgDry · wgFastTh */
const DRYL = PW.split('\n').find((l) => /^\s*const wgDry = /.test(l)); ok(!!DRYL, '감시기에 wgDry 있음');
const pwV = (PW.match(/@version\s+([\d.]+)/) || [])[1]; ok(pwV && pwV.split('.').map(Number).reduce((a, x, i) => a || (i === 2 ? x >= 69 : false), false) || /^0\.(1[1-9]|[2-9]\d)/.test(pwV || ''), '가격 감시기 0.10.69 이상', pwV);
const WX = {}; new Function('OUT', `let BKF = OUT.BKF; ${DRYL}\n${fnBody(PW, 'wgFastTh')}\nOUT.wgDry = wgDry; OUT.wgFastTh = wgFastTh; OUT.setBKF = (b) => { BKF = b; };`)(WX);
{ const D = WX.wgDry; ok(D({ on: true }) === false && D({ on: true, firstTry: null }) === false && D({ on: true, firstTry: false }) === false, 'firstTry 없음·null·false = 셈만 아님');
  ok(D({ on: true, firstTry: { since: 's', mode: 'dry', noAuto: true } }) === true, 'firstTry 있음 = 셈만');
  ok(D({ on: true, firstTry: 'x' }) && D({ on: true, firstTry: 0 }) && D({ on: true, firstTry: {} }) && D({ on: true, firstTry: [] }), '모양이 깨진 firstTry도 셈만(안 쓰는 쪽)');
  ok(D(null) === true && D('watch') === true, '감시 설정을 못 읽으면 셈만(안 쓰는 쪽)');
  ok(D({ on: true, firstTry: { since: '2020-01-01', mode: 'dry', noAuto: true } }) === true, '날짜가 오래 지나도 셈만 그대로(날짜로 끝나지 않음)'); }
ok(!/firstTry[^;\n]{0,80}(Date\.now\(\)|Date\.parse)/.test(PW) && !/(since|count|runs)[^;\n]{0,40}firstTry\s*=\s*null/.test(PW), '감시기에 날짜·횟수로 셈만을 푸는 글 없음');
ok(!/firstTry\s*:\s*(null|FV\.delete|firebase\.firestore\.FieldValue\.delete)|delete [\w.]*firstTry/.test(PW), '감시기는 firstTry를 지우지 않음(끝내기는 웹앱 창에서 사람만)');

/* ② 판정 갈래 — 원본 그대로 떼어 가짜 바깥으로 돌림 */
const BR = cutS(PW, 'const DRYW = wgDry(wg.watch);', 'else Object.assign(rec, { approvalState: prevD.approvalState }); if (keepW) delete rec.approval; }', true);
ok(/const CG = DRYW \? null : await ctrlGate\(/.test(BR), '셈만이면 묶음 멈춤 문(ctrlGate · _bkfold 쓰기)을 부르지 않음');
const runBr = async (o) => { const W = { ctrl: 0, note: 0, plkRead: 0 }; const rec = { page1: [] }; const J = { target: o.target, reasons: ['판정'], strat: o.strat || null, chaser: o.chaser || null, floor: o.floor || 0, start: 10000 };
  const env = { J, wg: o.wg, listing: { price: o.cur, listingId: 'L1', sku: 'ABC' }, rec, prevD: o.prevD || {}, pre: null, waitingExec: false, key: 'aladin_T1', now: '2026-11-19T10:00:00.000Z',
    PR: { isExcluded: () => false }, engineSettings: () => ({}), wgDry: WX.wgDry, wgFastTh: WX.wgFastTh,
    ctrlGate: async () => { W.ctrl++; return o.cg || null; }, plkSetW: async () => new Set(o.locked ? ['aladin_T1'] : []), plkReadW: async () => { W.plkRead++; return o.lk; }, plkBlock: (lk) => (lk && lk.block) || null,
    plkClamp: (lk, p) => (lk.floor && p < lk.floor ? { ok: true, cut: true, p: lk.floor, why: '선까지' } : { ok: true }), plkCtxW: () => ({}), plkNoteW: async () => { W.note++; } };
  const names = Object.keys(env); const f = new Function(...names, `return (async () => { { ${BR}\n })();`); /* 원본 조각은 바깥 if (watched) { 안에서 시작 — 여는 괄호 하나를 채움 */ await f(...names.map((k) => env[k])); return { rec, W }; };
const DRY = { since: '2026-11-19T09:00:00.000Z', mode: 'dry', by: 'x', noAuto: true };
const G = (w) => ({ id: 'g1', name: '시험 그룹', watch: { on: true, mode: 'auto', apply: 'auto', guardPct: 15, ...w } });
const isWrite = (r) => r.rec.approvalState === 'approved' || r.rec.approvalState === 'pending' || !!r.rec.approval || (Array.isArray(r.rec.autoBlock) && r.rec.autoBlock.length > 0) || r.W.note > 0 || r.W.ctrl > 0 || (r.rec.strat && r.rec.strat.active);
(async () => {
  { const r = await runBr({ wg: G({ firstTry: DRY }), cur: 10000, target: 9500 });
    ok(!isWrite(r), '셈만 + 바로 반영 그룹: 자동 승인·결정 대기·잠금 기록·묶음 멈춤 0건', r.rec);
    ok(r.rec.dry && r.rec.dry.from === 10000 && r.rec.dry.to === 9500 && r.rec.dry.would === 'auto' && r.rec.dry.mode === 'dry' && r.rec.dry.gid === 'g1', '바꿀 뻔한 값(지금 → 목표 · 자동 반영이었을 것)만 rec.dry에', r.rec.dry);
    ok(/🌓 셈만/.test(r.rec.reasons[0]), '까닭 첫 줄에 🌓 셈만');
    ok(!('approval' in r.rec) && !('autoBlock' in r.rec), '결정 칸(approval·autoBlock)을 아예 안 씀(merge라 그대로 남음)'); }
  { const r = await runBr({ wg: G({}), cur: 10000, target: 9500 });
    ok(r.rec.approvalState === 'approved' && r.rec.approval && r.rec.approval.decision === 'auto' && r.rec.approval.price === 9500 && r.W.ctrl === 1 && !r.rec.dry, '셈만을 끝낸 그룹은 예전 그대로 자동 승인(묶음 멈춤 문도 봄)', r.rec); }
  { const r = await runBr({ wg: G({ firstTry: DRY, apply: 'approve' }), cur: 10000, target: 9000 });
    ok(!isWrite(r) && r.rec.dry.would === 'pending' && r.rec.dry.why.includes('관리자 승인 그룹'), '셈만 + 결정 대기 그룹: 결정 대기도 만들지 않음(그랬다면 결정 대기였음만 기록)', r.rec);
    const r2 = await runBr({ wg: G({ apply: 'approve' }), cur: 10000, target: 9000 }); ok(r2.rec.approvalState === 'pending' && r2.rec.autoBlock.includes('관리자 승인 그룹'), '셈만이 아니면 예전처럼 결정 대기'); }
  { const r = await runBr({ wg: G({ firstTry: 'x' }), cur: 10000, target: 9500 }); ok(!isWrite(r) && r.rec.dry, '망가진 firstTry도 쓰기 0건'); }
  { const r = await runBr({ wg: G({ firstTry: DRY }), cur: 10000, target: 9000, locked: true, lk: { block: { cond: 1 }, floor: 9400 } });
    ok(r.W.note === 0 && r.W.plkRead === 1 && r.rec.dry.to === 9400 && !isWrite(r), '셈만: 조건 잠금은 읽기만(잠금 기록 안 씀) · 선까지 줄인 값을 기록', r);
    const r2 = await runBr({ wg: G({}), cur: 10000, target: 9000, locked: true, lk: { block: { cond: 1 }, floor: 9400 } }); ok(r2.W.note >= 1 && r2.rec.approval && r2.rec.approval.price === 9400, '셈만이 아니면 예전처럼 잠금 기록·선까지 반영'); }
  { const r = await runBr({ wg: G({ firstTry: DRY }), cur: 10000, target: 9500, prevD: { strat: { name: 'follow', active: true, phase: 'p' } }, strat: { name: 'follow', active: true, phase: 'p2', round: 2 } });
    ok(r.rec.strat && r.rec.strat.active === false && r.rec.strat.end === 'dry' && r.rec.dry.strat.phase === 'p2', '셈만: 추격 판을 진행하지 않음(진행 중이던 판은 끝냄 · 진행했을 단계는 기록)', r.rec.strat); }
  { const r = await runBr({ wg: G({ firstTry: DRY }), cur: 10000, target: 10000 }); ok(!isWrite(r) && r.rec.dry.would === 'none' && r.rec.dry.to === null, '바꿀 값이 없으면 would none'); }
  { const r = await runBr({ wg: G({ firstTry: DRY }), cur: 10000, target: 9500, cg: { pause: true, cfg: { dayDrop: { lure: 'restore' } }, line: '⏸' } }); ok(r.W.ctrl === 0, '셈만이면 묶음 멈춤 문 0번'); }
  { const r = await runBr({ wg: G({ firstTry: DRY, rule: { detect: { fastLagMin: 25 } }, chase: { name: 'follow', detect: { minEvents: 4 } } }), cur: 10000, target: 9500 }); ok(r.rec.dry.fastTh && r.rec.dry.fastTh.fastLagMin === 25 && r.rec.dry.fastTh.minEvents === 4 && r.rec.dry.fastTh.src === 'group', '⚡ 문턱(그룹 기준 분·번)을 기록', r.rec.dry.fastTh); }

  ok(/if \(JW && !JW\.dry && \(JW\.chaser/.test(PW), '셈만이면 추격 관계·전략 기록(chaseRecord)도 안 씀');
  ok(/else if \(rec\.approvalState === 'pending' && !keepApproval && !rec\.dry\) rec\.autoBlock/.test(PW), '판본 의심 막기도 셈만 결정 칸을 안 건드림');
  ok(/\.\.\.\(rec\.dry \? \{ dry: rec\.dry \} : \{\}\)/.test(PW), '판정 이력(log)에 바꿀 뻔한 값');

  /* ③ 반영 길 마지막 지킴 */
  { const SN = cutS(PW, "const apA = x.approval || {}; if (apA.decision === 'auto') {", '/* (0.10.69 strat5) 마지막 지킴', false);
    const run = async (gw, x) => { const SETS = [], SENT = [], LOG = []; const WG = new Map([['g1', { id: 'g1', watch: gw }]]);
      const f = new Function('L', 'wgLoad', 'wgDry', 'SETS', 'SENT', 'log', 'now', 'W', `return (async () => { for (const x of L) { const d = { ref: { set: async (v, o) => SETS.push([v, o]) } }; ${SN} } SENT.push(x.key); } })();`);
      await f([x], async () => WG, WX.wgDry, SETS, SENT, (m) => LOG.push(m), '2026-11-19T10:00:00.000Z', () => ({})); return { SETS, SENT, LOG }; };
    const X = { key: 'aladin_T1', title: '시험 책', approval: { decision: 'auto', gid: 'g1', price: 9500, expectPrice: 10000 } };
    const a = await run({ on: true, apply: 'auto', firstTry: DRY }, X); ok(a.SENT.length === 0 && a.SETS.length === 1 && a.SETS[0][0].approvalState === null && a.SETS[0][0].dry.to === 9500 && a.SETS[0][1].merge, '셈만 그룹 자동 승인 → 보내지 않고 승인을 거둠(결정 대기도 안 만듦)', a);
    const b = await run({ on: true, apply: 'auto' }, X); ok(b.SENT.length === 1 && b.SETS.length === 0, '셈만이 아닌 그룹은 그대로 반영 길로');
    const c = await run({ on: true, apply: 'auto', firstTry: DRY }, { ...X, approval: { decision: 'manual', price: 9000 } }); ok(c.SENT.length === 1, '사람이 직접 결정한 값(자동 아님)은 이 지킴과 상관없음');
    const EX = fnBody(PW, 'executeApproved'); ok(EX.indexOf('wgDry(gA.watch)') > 0 && EX.indexOf('wgDry(gA.watch)') < EX.indexOf("gA.watch.apply !== 'auto'"), '지킴은 자동 반영 검사보다 앞');
    ok(!/\b(alert|confirm|prompt)\(/.test(BR + SN), '감시기 고친 곳에 브라우저 팝업 없음'); }

  /* ④ 웹앱 — 켜는 길마다 셈만 */
  { const PLAN = cutS(APP, 'function bkcPlan(', '/* 되돌리기 계획', false); const ctx = {}; vm.createContext(ctx); vm.runInContext(PLAN + '\nthis.bkcPlan = bkcPlan;', ctx);
    const def = { watch: { mode: 'auto', presetId: null, apply: 'auto', guardPct: 15 } }; const now = '2026-11-19T10:00:00.000Z';
    const gs = [{ id: 'a', name: '새 그룹' }, { id: 'b', name: '예전에 감시', watch: { on: false, since: '2026-10-01', apply: 'approve' } }, { id: 'c', name: '운영 중', watch: { on: true, since: '2026-10-01', apply: 'auto', guardPct: 10 } }, { id: 'd', name: '셈만 중', watch: { on: false, firstTry: { since: 'old', mode: 'dry', noAuto: true } } }];
    const P = ctx.bkcPlan(gs, def, 'keep', { now, by: 'x@y.z' }); const by = (id) => P.find((x) => x.id === id);
    ok(by('a').act === 'on' && by('a').next.firstTry && by('a').next.firstTry.mode === 'dry' && by('a').next.firstTry.noAuto === true && by('a').next.firstTry.since === now, '「모두 켜기」: 처음 켜는 그룹에 셈만', by('a'));
    ok(by('b').act === 'on' && !by('b').next.firstTry, '전에 감시한 적 있는 그룹(정범님이 쓰던 값)은 셈만을 안 붙임');
    ok(by('c').act === 'keep', '운영 중인 그룹은 그대로');
    ok(by('d').next.firstTry.since === 'old', '이미 셈만인 그룹은 그 셈만 그대로');
    const P2 = ctx.bkcPlan(gs, def, 'over', { now, by: 'x@y.z' }); ok(!P2.find((x) => x.id === 'c').next.firstTry && P2.find((x) => x.id === 'c').next.guardPct === 15, '덮기로 운영 중 그룹을 바꿔도 셈만을 새로 붙이지 않음(정범님 적용 값은 그대로 이어짐)');
    const P3 = ctx.bkcPlan(gs, def, 'keep', { now: '2026-11-19T11:00:00.000Z', by: 'x@y.z' }); const nz = (L) => JSON.stringify(L.map((x) => [x.id, x.act, x.next && { ...x.next, since: 0, firstTry: x.next.firstTry ? 1 : 0 }]));
    ok(nz(P) === nz(P3), '누르는 사이 시각만 달라도 「그사이 바뀜」으로 보지 않음(비교 정규화)');
    ok((APP.match(/x\.next && \{ \.\.\.x\.next, since: 0, firstTry: x\.next\.firstTry \? 1 : 0 \}/g) || []).length === 2, '#bkc_go 비교 두 곳 모두 정규화'); }
  { const RW = fnBody(APP, 'regToWatch'); ok(/const watch = \{ on: true, mode: 'auto'[^\n]*firstTry: \{ since: now, mode: 'dry', by: S\.user\.email, noAuto: true \}/.test(RW), '📦 등록 그룹 → 가격 감시 넘기기도 셈만으로 시작');
    ok(/🌓 처음은 셈만/.test(RW) && !/\b(alert|confirm|prompt)\(/.test(RW.replace(/return alert\(/g, '')) , '넘기기 물음 글에 셈만 안내');
    const G37 = APP.split('\n').find((l) => /if \(first && !\(WCH && WCH\.since\) && !nw\.firstTry\) nw\.firstTry = /.test(l)); ok(!!G37, '그룹 카드 「감시 시작」도 셈만(판 ①)');
    ok(/if \(first && !D\.firstTry\) D\.firstTry = \{ since: now, mode: 'dry', by, noAuto: true \}/.test(APP) && /delete P\.draft\.firstTry/.test(APP), '🎚 그룹 전략 창: 처음 켜면 셈만 · 끝내기는 「셈만 끝내기」뿐(판 ①)');
    ok(!/감시기 쪽 읽기는 다음 판/.test(APP), '「감시기 쪽 읽기는 다음 판」 안내를 고침');
    ok(/'1\.78\.\d+': \["🌓 감시 판 ④/.test(APP) && /app: '가격 감시기', v: '0\.10\.69'/.test(APP), '판 기록(웹앱·감시기)'); }

  /* ⑤ ⚡ 문턱 */
  { const CF = fnBody(APP, 'chFastOf'), WR = fnBody(APP, 'wgFastRule'), FL = fnBody(APP, 'gswFastLag'), LAG = fnBody(APP, 'slChLag');
    const GG = APP.split('\n').find((l) => l.startsWith('const gswGet = ')), GP = APP.split('\n').find((l) => l.startsWith('const gswPlain = ')), BO = APP.split('\n').find((l) => l.startsWith('function bkfOf('));
    const mk = (CHx, obs, fold) => { const ctx = { window: CHx ? { ReadnowChase: CHx } : {}, S: { bkfold: { folds: { f1: { gids: ['g2'] } } } }, slObsCfg: () => obs, bkcOf: () => ({ def: fold || {} }) }; vm.createContext(ctx);
      vm.runInContext(`${GP}\n${GG}\n${BO}\n${LAG}\n${FL}\n${CF}\n${WR}\nthis.chFastOf = chFastOf; this.wgFastRule = wgFastRule;`, ctx); return ctx; };
    const r = { lagSum: 100, lagN: 4 }; /* 평균 25분 · 4번 */
    for (const [nm, E] of [['공용 있음', mk(CH, { fastLagMin: 60 })], ['공용 없음(같은 셈)', mk(null, { fastLagMin: 60 })]]) {
      ok(E.chFastOf(r, null).fast === true && E.chFastOf(r, null).lim === 60, `${nm}: 문턱 없으면 🔭 관찰 기준 60분 · 3번`);
      ok(E.chFastOf(r, { detect: { fastLagMin: 20 } }).fast === false, `${nm}: 그룹 기준 20분이면 25분 평균은 빠르지 않음`);
      ok(E.chFastOf(r, { detect: { minEvents: 5 } }).fast === null, `${nm}: 그룹 번 5면 4번은 아직 모름`);
      ok(E.chFastOf({ lagSum: 10, lagN: 2 }, null).fast === null && E.chFastOf(null, null).fast === null, `${nm}: 3번 아래는 아직 모름(예전 칩과 같음)`); }
    { const F0 = CH.fastChaserOf(r, { detect: { fastLagMin: 30, minEvents: 4 } }, { fastLagMin: 60 }), F1 = mk(null, { fastLagMin: 60 }).chFastOf(r, { detect: { fastLagMin: 30, minEvents: 4 } }); ok(F0.fast === F1.fast && F0.lim === F1.lim && F0.minN === F1.minN, '공용이 없을 때 셈 = 가격 공용 fastChaserOf', [F0, F1]); }
    const E = mk(CH, { fastLagMin: 60 }, { rule: { detect: { fastLagMin: 30 } } });
    const g1 = { id: 'g1', watch: { on: true, rule: { detect: { fastLagMin: 20, minEvents: 6 } }, chase: { detect: { minEvents: 5 } } } }, g2 = { id: 'g2', watch: { on: true, chase: { name: 'follow', detect: { minEvents: 5 } } } }, g3 = { id: 'g3', watch: { on: true } };
    const R1 = E.wgFastRule(g1), R2 = E.wgFastRule(g2), R3 = E.wgFastRule(g3);
    ok(R1.detect.fastLagMin === 20 && R1.detect.minEvents === 6, '그룹 규칙 기준 분·번이 먼저', R1);
    ok(R2.detect.fastLagMin === 30 && R2.detect.minEvents === 5, '그룹 규칙이 없으면 📁 묶음 기본 기준 분 · 번은 추격 감지 횟수(watch.chase.detect.minEvents)', R2);
    ok(R3.detect.fastLagMin === undefined && R3.detect.minEvents === undefined && E.chFastOf(r, R3).lim === 60, '아무 문턱도 없으면 🔭 관찰 기준 그대로', R3);
    ok(E.chFastOf(r, R2).fast === null && E.chFastOf({ lagSum: 100, lagN: 5 }, R2).fast === true && E.chFastOf({ lagSum: 200, lagN: 5 }, R2).fast === false, '묶음 기본 30분 · 5번: 4번은 아직 모름 · 5번 평균 20분은 빠름 · 40분은 아님', E.chFastOf(r, R2));
    WX.setBKF({ folds: { f1: { gids: ['g2'] } }, ctl: { f1: { def: { rule: { detect: { fastLagMin: 30 } } } } } });
    for (const g of [g1, g2, g3]) { const a = WX.wgFastTh(g), b = E.wgFastRule(g).detect; ok((a.fastLagMin ?? undefined) === b.fastLagMin && (a.minEvents ?? undefined) === b.minEvents, `감시기 wgFastTh = 웹앱 wgFastRule (${g.id})`, [a, b]); }
    ok(/\['fast', '⚡ 빨리 따라 내림', [^\n]*chFastOf\(r, null\)\.fast/.test(APP), '판매자 ⚡ 칩도 같은 판정(chFastOf)');
    ok(/chFastOf\(rr, wgFastRule\(g0\)\)/.test(APP), '결정 카드 ⚡ 꼬리표는 그 감시 그룹 문턱으로');
    ok(/⚡ \$\{esc\(String\(\(\(\) => \{ const m = gswGet\(D, 'rule\.detect\.minEvents'\)/.test(APP), '🎚 그룹 전략 창에 「⚡ N번 이상」'); }

  console.log(bad ? `❌ tSTRAT5 ${n - bad}/${n}` : `✅ tSTRAT5 통과 ${n}/${n}`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tSTRAT5 오류', e && e.stack); process.exit(1); });
