// tCTRLIMP2_DEO — (ctrlimp2 · 설계 CTRLDES3 2.1·2.2·3.2 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 더 — 🎛 관제창·감시 설정 틀
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 설정 칸 set_ctrl · 🔍 기능 찾기 목록 · 설명서 문단 · 부르는 곳(ctrlLazy·자동 취소·재편성·모두 켜기)이 묶음 값을 봄
//  ② vm: 칸이 없을 때 기본값 = CTRLDES3 2.2 표(아래에 그대로 박음) · 틀린 값은 기본 · 설계 이름(final·autoCancel·onDrift)도 받음 · 묶음 opt가 전체를 덮음(learnAt은 전체만)
//        · 전체 쓰기는 바뀐 칸만 + 바꿈 기록 · 값에 닿는 고름은 두 번 누른 뒤에만 씀 · 화면 11줄 · ⏳ 저장만 표시 · bkcNorm이 opt를 지킴
// 실행: node tCTRLIMP2_DEO.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const d0 = T.indexOf('/* (판 더 · ctrlimp2'), d1 = T.indexOf('/* (판 더) 끝 */'); const DEO = d0 > 0 && d1 > d0 ? T.slice(d0, d1) : '';
const fnBody = (name) => { const i = T.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) return ''; let d = 0, j = T.indexOf('{', i); for (let k = j; k < T.length; k++) { if (T[k] === '{') d++; else if (T[k] === '}' && --d === 0) return T.slice(i, k + 1); } return ''; };
const line = (re) => (T.split('\n').find((l) => re.test(l)) || '');
console.log('① 글');
ok(!!DEO, '판 더 덩이가 있음');
{ const names = ['ctrlRng', 'ctrlIn', 'CTRL_PI', 'CTRL_V', 'ctrlCfgPick', 'ctrlMerge', 'ctrlCfgNorm', 'ctrlOptNorm', 'ctrlFoldOpt', 'ctrlGet', 'CTRL_ROWS', 'CTRL_SUB', 'ctrlLbl', 'ctrlCfgSetLog', 'ctrlOptSet', 'ctrlArmOf', 'ctrlSetHtml', 'ctrlSetWait', 'ctrlSetPaint', 'ctrlSetClick', 'ctrlOptHtml', 'ctrlOptClick'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(DEO), '브라우저 창 없음(두 번 누름 twiceArm)');
ok(!/\d{2,3}-\d{3,4}-\d{4}/.test(DEO), '전화번호 모양 없음');
ok(!/\.(delete|update)\(|\.add\(\{|FieldValue\.delete|batchSave|peQueue/.test(DEO), '지우기·그룹 문서 고치기·값 바꾸기 없음');
ok((DEO.match(/db\.collection\(/g) || []).length === 1 && /db\.collection\('prd_system'\)\.doc\('pricing'\)\.set\(\{ ctrlCfg: p, ctrlLog: log/.test(DEO), '전체 쓰기는 prd_system/pricing ctrlCfg(바뀐 칸만)·ctrlLog 한 곳');
ok(/sec\('set_ctrl', '🎛 관제창·감시 기본/.test(T) && /\["set_ctrl", "🎛 관제창·감시 기본/.test(fnBody('featIndex')), '⚙ 설정 칸 set_ctrl · 🔍 기능 찾기 목록에 있음');
ok(/🎛 관제창·감시 기본 · 이 묶음만 다르게 \(판 더\)/.test(T), '설명서 문단');
ok(/const ctrlLazy = \(tab\) => ctrlCfg\(S\._bkfCtrl && S\._bkfCtrl\.fid\)/.test(T) && /ctrlCfg\(P\.fid\)\.doneChg === 'auto'/.test(T) && /const cf = ctrlCfg\(typeof bkfOf === 'function'/.test(fnBody('ctrlReoDone')), '늦게 계산·자동 취소·재편성이 그 묶음 값(opt)을 봄');
ok(/ctrlCfg\(fid\)\.allOnKeep/.test(fnBody('bkcPaint')) && /plan\(aok === 'overwrite' \? 'over' : 'keep'\)/.test(fnBody('bkcPaint')), '📁 모두 켜기 미리 보기가 allOnKeep을 따름(덮기도 켜기는 두 번 누름 그대로)');
ok(/async function ctrlCfgSet\(p\) \{ return ctrlCfgSetLog\(p, '관제창 ⚙'\); \}/.test(T), '관제창 ⚙ 옛 단추도 바뀐 칸만 쓰고 기록');
{ const A = fnBody('ctrlSetClick'); ok(A.indexOf('twiceArm(t,') > 0 && A.indexOf('twiceArm(t,') < A.indexOf('ctrlCfgSetLog('), '설정 칸: 두 번 누른 뒤에만 씀'); const B = fnBody('ctrlOptClick'); ok(B.indexOf('twiceArm(t,') > 0 && B.indexOf('twiceArm(t,') < B.indexOf('ctrlOptSet('), '이 묶음만 다르게: 두 번 누른 뒤에만 씀'); }

console.log('② 흉내 실행');
const SETS = []; const BKC = {}; let ARM = 'go';
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite,
  S: { prCfg: {}, user: { email: 't@x' } }, esc: (s) => String(s), num: (n) => String(n), kTime: (s) => String(s), toast: () => {}, errKo: (e) => String(e && e.message), bkfName: () => '시험 묶음',
  twiceArm: () => ARM, db: { collection: () => ({ doc: () => ({ set: async (v, o) => { SETS.push([v, o]); } }) }) }, document: { getElementById: () => null, querySelectorAll: () => [], addEventListener() {} },
  bkcOf: (fid) => ({ opt: BKC[fid] || null, log: [] }), bkcLog: (c, x) => [...(c.log || []), x], bkcSave: async (fid, fn) => { const nx = fn({ opt: BKC[fid] || null, log: [] }); BKC[fid] = nx.opt; return nx; },
  ctrlReset() {}, ctrlPaint() {}, ctrlLoad: async () => {} };
vm.createContext(ctx);
vm.runInContext(line(/^const CTRL_PAGE = 40, CTRL_CAP = 400, CTRL_DEF = /) + '\n' + line(/^const ctrlCfg = \(fid\) =>/) + '\n' + DEO + '\nthis.F = { CTRL_DEF, ctrlCfg, ctrlCfgNorm, ctrlOptNorm, ctrlCfgSetLog, ctrlOptSet, ctrlSetHtml, ctrlOptHtml, ctrlSetClick, ctrlOptClick, CTRL_ROWS };', ctx);
const F = ctx.F; const J = (x) => JSON.stringify(x);
/* CTRLDES3 2.2 표 그대로(설계 열쇠 → 이 판 열쇠: ctrlUi.lazy 'final'='done' · ctrl.onDrift 'autoCancel'='doneChg auto') */
const TABLE = { lazy: 'all', perItem: ['watch', 'chase', 'floor', 'strat'], onChased: 'alert', chasedMin: { n: 3, pct: 20 }, doneChg: 'mark', learnAt: 'both', tryMode: 'ask', tryDays: 7, memoConfirm: 'once', memoAuto: 'off',
  dayDrop: { act: 'pause', limit: 'auto', lure: 'restore', resume: 'manual' }, allOnKeep: 'keep', dualGroup: 'owner', reoDone: 'move' };
{ const c = F.ctrlCfg(); const miss = Object.keys(TABLE).filter((k) => J(c[k]) !== J(TABLE[k])); ok(!miss.length && Object.keys(c).length === Object.keys(TABLE).length, '칸이 없을 때 = CTRLDES3 2.2 표(정범님 고르심) 그대로', miss); }
{ const c = F.ctrlCfgNorm({ lazy: 'x', perItem: 'watch', onChased: 'stop', chasedMin: { n: 0, pct: 500 }, tryDays: 999, memoConfirm: 1, dayDrop: { act: 'boom', limit: 5, lure: 'z' }, allOnKeep: 'yes', dualGroup: null, learnAt: 'nowhere' });
  ok(J(c) === J(F.ctrlCfgNorm({})), '틀린 값·범위 밖은 모두 기본값', c); }
{ const c = F.ctrlCfgNorm({ lazy: 'final', onDrift: 'autoCancel', dayDrop: { limit: 9000 } }); ok(c.lazy === 'done' && c.doneChg === 'auto' && c.dayDrop.limit === 9000 && c.dayDrop.act === 'pause' && c.dayDrop.lure === 'restore', '설계 이름(final · onDrift autoCancel)도 받음 · 딸린 값 하나만 바꿔도 나머지는 기본', c); }
{ const c = F.ctrlCfgNorm({ perItem: ['strat', 'watch', 'nope'] }); ok(J(c.perItem) === J(['watch', 'strat']), '상품마다 조건은 맞는 것만 · 차례 고정'); ok(J(F.ctrlCfgNorm({ perItem: [] }).perItem) === '[]', '조건 끔([])도 받음'); }
{ const g = { allOnKeep: 'keep', learnAt: 'audit', chasedMin: { n: 5 } }; const c = F.ctrlCfgNorm(g, { allOnKeep: 'overwrite', learnAt: 'ctrl', chasedMin: { pct: 40 }, lazy: 'bad' });
  ok(c.allOnKeep === 'overwrite' && c.learnAt === 'audit' && c.chasedMin.n === 5 && c.chasedMin.pct === 40 && c.lazy === 'all', '묶음 opt가 전체를 덮음 · learnAt은 전체만 · 틀린 opt 칸은 무시', c); }
ok(F.ctrlOptNorm({ learnAt: 'ctrl', x: 1 }) === null && J(F.ctrlOptNorm({ dayDrop: { act: 'alert', y: 2 } })) === J({ dayDrop: { act: 'alert' } }), 'opt 저장은 맞는 칸만(없으면 null)');
(async () => {
  SETS.length = 0; ctx.S.prCfg = { ctrlCfg: { lazy: 'all' } };
  await F.ctrlCfgSetLog({ dayDrop: { act: 'alert' } }, '시험');
  const [v, o] = SETS[0] || [];
  ok(SETS.length === 1 && o && o.merge === true && J(Object.keys(v.ctrlCfg)) === J(['dayDrop']) && v.ctrlCfg.dayDrop.act === 'alert' && v.ctrlCfg.dayDrop.limit === 'auto', '전체 쓰기 = 바뀐 칸만(merge · 딸린 값 묶음 통째)', v);
  ok(Array.isArray(v.ctrlLog) && v.ctrlLog.length === 1 && v.ctrlLog[0].ch[0].k === 'dayDrop' && v.ctrlLog[0].by === 't@x', '바꿈 기록(누가·무엇·앞뒤)');
  ok(F.ctrlCfg().dayDrop.act === 'alert' && ctx.S.prCfg.ctrlCfg.lazy === 'all', '이 기기 설정에도 바로 얹음 · 다른 칸은 그대로');
  SETS.length = 0; await F.ctrlCfgSetLog({ dayDrop: { act: 'alert' } }); ok(SETS.length === 0, '같은 값이면 쓰지 않음');
  for (let i = 0; i < 70; i++) await F.ctrlCfgSetLog({ tryDays: 1 + (i % 50) }); ok(ctx.S.prCfg.ctrlLog.length === 60, '바꿈 기록은 60개까지');
  // 화면 11줄 · ⏳ 저장만
  const H = F.ctrlSetHtml(); ok((H.match(/class="ctrl-srow"/g) || []).length === 11 && F.CTRL_ROWS.length === 11, '설정 칸 11줄');
  ok(/⏳ 저장만/.test(H) && /읽는 곳: 관제창\(판 가\)/.test(H) && /📁 묶음 「모두 켜기…」\(판 더\)/.test(H), '읽는 곳 표시 · 아직 안 읽는 고름은 ⏳ 저장만');
  ok(/기본과 다름/.test(H), '기본과 다른 칸 표시');
  // 두 번 누름 — 'arm'이면 쓰지 않음
  const btn = (ds) => ({ dataset: ds, disabled: false, closest: () => ({}) });
  SETS.length = 0; ARM = 'arm'; await F.ctrlSetClick({}, btn({ cset: 'allOnKeep', csv: 'overwrite' })); ok(SETS.length === 0, '값에 닿는 고름은 첫 누름에 쓰지 않음');
  ARM = 'go'; await F.ctrlSetClick({}, btn({ cset: 'allOnKeep', csv: 'overwrite' })); ok(SETS.length === 1 && SETS[0][0].ctrlCfg.allOnKeep === 'overwrite', '두 번째 누름에 씀');
  SETS.length = 0; ARM = 'arm'; await F.ctrlSetClick({}, btn({ cset: 'lazy', csv: 'done' })); ok(SETS.length === 1, '화면만 바뀌는 고름(늦게 계산)은 한 번에 씀');
  ARM = 'go'; SETS.length = 0; await F.ctrlSetClick({}, btn({ cset: 'perItem', csv: 'floor', csm: '1' })); ok(SETS.length === 1 && J(SETS[0][0].ctrlCfg.perItem) === J(['watch', 'chase', 'strat']), '상품마다 조건 칩은 하나씩 빼고 넣음');
  // 이 묶음만 다르게
  const P = { fid: 'f1' }; ARM = 'arm'; await F.ctrlOptClick(P, btn({ copt: 'allOnKeep', cov: 'ask' })); ok(!BKC.f1, '묶음 고름도 첫 누름에 쓰지 않음');
  ARM = 'go'; await F.ctrlOptClick(P, btn({ copt: 'allOnKeep', cov: 'ask' })); ok(BKC.f1 && BKC.f1.allOnKeep === 'ask' && F.ctrlCfg('f1').allOnKeep === 'ask' && F.ctrlCfg().allOnKeep === 'overwrite', '묶음 opt 저장 → 그 묶음만 다름');
  ok(/이 묶음만 다름/.test(F.ctrlOptHtml(P)) && !/learnAt/.test(F.ctrlOptHtml(P)), '관제창 ⚙ 「이 묶음만 다르게」 표시 · 배움 자리는 전체만');
  await F.ctrlOptClick(P, btn({ copt: 'allOnKeep', cov: '' })); ok(BKC.f1 === null && F.ctrlCfg('f1').allOnKeep === 'overwrite', '「전체 따름」 = 칸을 지워 전체로');
  await F.ctrlOptClick(P, btn({ copt: 'dayDrop.act', cov: 'alert' })); ok(J(BKC.f1) === J({ dayDrop: { act: 'alert' } }) && F.ctrlCfg('f1').dayDrop.limit === 'auto', '딸린 값도 묶음만 다르게');
  // bkcNorm이 opt를 지킴
  { const src = ['BKC_LOG', 'BKF_MAXG'].map((n) => line(new RegExp(`^const ${n} = `))).join('\n') + '\n' + fnBody('bkcNorm'); const c2 = { ...ctx }; c2.BKF_MAXG = c2.BKF_MAXG || 50; vm.createContext(c2); vm.runInContext((/BKF_MAXG = /.test(src) ? '' : 'var BKF_MAXG = 50;\n') + src + '\nthis.N = bkcNorm;', c2);
    const n = c2.N({ def: {}, opt: { allOnKeep: 'overwrite', bad: 1 } }); ok(n.opt && J(n.opt) === J({ allOnKeep: 'overwrite' }), 'bkcNorm이 opt(맞는 칸만)를 지킴', n);
    ok(!('opt' in c2.N({ def: {} })), 'opt가 없으면 칸을 만들지 않음(판 타 모양 그대로)'); }
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
