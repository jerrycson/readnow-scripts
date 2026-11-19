// tCTRLIMP3_REO — (ctrlimp3 · 설계 CTRLDES3 2.3 감시 ① · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 러 — ⏸ 묶음 자동 멈춤
//  ① 가격 코어 ReadnowCtrl: 기본값이 웹앱 ctrlCfgNorm과 같음 · 오늘 내림 합(원장 od · src 'pw:그룹') · 알림선(고정·자동 몫·바닥) · 멈춤/알림 판정 · 다시 켜기(지금부터·오늘은 안 멈춤) · 다음 날 풀림 · 14일 되짚기
//  ② 웹앱: bkcNorm이 pause·resume·alert를 지킴 · 붉은 띠·다시 켜기는 두 번 누른 뒤에만 씀 · 알림 띠 · 되짚기는 읽기만
//  ③ 가격 감시기 글: ctrlGate가 값을 내리는 자동 반영을 막고 _bkfold에 merge로만 씀 · 쓰기 전 새로 읽음
// 실행: node tCTRLIMP3_REO.js · 시험 자료에 손님 정보 없음 · 그룹·판매자는 지어낸 이름 · 실제 가격 바꾸기 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'readnow-pricing-core.js')));
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.join(ROOT, 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const PW = fs.readFileSync(path.join(ROOT, 'readnow-price-watch.user.js'), 'utf8');
const PR = require(path.join(ROOT, 'readnow-pricing-core.js')); const R = PR.Ctrl; const J = (x) => JSON.stringify(x);
const fnBody = (src, name) => { const i = src.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); } return ''; };
const line = (re) => (T.split('\n').find((l) => re.test(l)) || '');
const r0 = T.indexOf('/* (판 러 · ctrlimp3'), r1 = T.indexOf('/* (판 러) 끝 */'); const REO = r0 > 0 && r1 > r0 ? T.slice(r0, r1) : '';
const d0 = T.indexOf('/* (판 더 · ctrlimp2'), d1 = T.indexOf('/* (판 더) 끝 */'); const DEO = T.slice(d0, d1);

console.log('① 가격 코어');
const vGe = (a, b) => { const x = String(a || '').split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return true; }; // (판 서) 뒤 판이 올라가도 통과 — 판 러가 들인 것 이상인지만
ok(R && vGe(PR.VERSION, '0.17.20') && typeof R.pauseCheck === 'function', '가격 코어 0.17.20 이상 · ReadnowCtrl 있음', PR && PR.VERSION);
{ const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, S: { prCfg: {} } }; vm.createContext(ctx);
  vm.runInContext(line(/^const CTRL_PAGE = 40, CTRL_CAP = 400, CTRL_DEF = /) + '\n' + DEO + '\nthis.N = ctrlCfgNorm;', ctx);
  const cases = [{}, { lazy: 'final', onDrift: 'autoCancel' }, { dayDrop: { act: 'alert', limit: 9000 }, chasedMin: { n: 0, pct: 40 } }, { perItem: ['strat', 'watch'], learnAt: 'ctrl', memoAuto: 'markOnly' }, { allOnKeep: 'x', tryDays: 999 }];
  const opts = [null, { dayDrop: { resume: 'nextDay' }, learnAt: 'audit' }, { onChased: 'pause', chasedMin: { n: 5 } }];
  const diff = []; for (const c of cases) for (const o of opts) if (J(ctx.N(c, o)) !== J(R.cfgNorm(c, o))) diff.push([c, o]);
  ok(!diff.length, `코어 cfgNorm = 웹앱 ctrlCfgNorm (${cases.length * opts.length}가지)`, diff);
  ok(J(R.CTRL_DEF.dayDrop) === J({ act: 'pause', limit: 'auto', lure: 'restore', resume: 'manual' }) && R.CTRL_DEF.onChased === 'alert', '기본 = 알리고 멈춤 · 추격당함은 알림만(CTRLDES3 2.2)'); }
const BKF = { order: ['f:f1', 'f:f2'], folds: { f1: { name: '시험 묶음A', gids: ['g1', 'g2'] }, f2: { name: '시험 묶음B', gids: ['g2', 'g3'] }, f3: { name: '보관 묶음', gids: ['g9'], archived: true } }, ctl: {} };
ok(R.foldOf(BKF, 'g2').fid === 'f1' && R.foldOf(BKF, 'g3').fid === 'f2' && R.foldOf(BKF, 'g9') === null && R.foldOf(BKF, 'gX') === null, '그룹은 묶음 차례 맨 앞 묶음에 · 보관·없는 묶음은 null');
const L = { x: { '9000001': { src: 'pw:g1', od: 1500 }, '9000002': { src: 'pw:g2', od: 900.4 }, '9000003': { src: 'pw:g3', od: 5000 }, '9000004': { src: 'eng:x', od: 7000 }, '9000005': { src: 'pw:g1', od: 0 }, '9000006': { src: 'pw:g1', od: -50 } } };
{ const s = R.daySum(L, ['g1', 'g2']); ok(s.sum === 2400 && s.n === 2 && s.top[0].k === '9000001', '오늘 내림 합 = 그 묶음 그룹의 감시·추격 몫만(엔진 몫·0·음수 뺌)', s); }
ok(R.dayLimit({ dayDrop: { limit: 9000 } }, 50000, 1, 10).limit === 9000, '알림선 고정값');
ok(R.dayLimit(R.CTRL_DEF, 50000, 100, 400).limit === 12500 && R.dayLimit(R.CTRL_DEF, 50000, 1, 400).limit === 2000, '알림선 자동 = 하루 손해 한도 × 상품 몫 · 바닥 2,000원');
ok(R.dayLimit(R.CTRL_DEF, null, 1, 2).limit === 2000 && R.dayLimit(R.CTRL_DEF, 50000, 0, 0, 1, 4).limit === 12500, '한도 못 받으면 바닥 · 상품 수 모르면 그룹 수 몫');
const now = '2026-11-19T03:00:00.000Z', day = '2026-11-19';
{ const r = R.pauseCheck({ cfg: R.CTRL_DEF, ctl: {}, day, sum: 2400, n: 2, limit: 2000, chased: 0, nFold: 10, nowIso: now });
  ok(r.pause && r.write && r.write.pause && r.write.pause.why === 'dayDrop' && r.write.pause.sum === 2400 && /⏸ 묶음 자동 멈춤/.test(r.line), '알림선 넘음 → 멈춤(기본)', r);
  const p = r.write.pause; ok(R.pauseCheck({ cfg: R.CTRL_DEF, ctl: { pause: p }, day, sum: 9999, limit: 2000, nowIso: now }).write === null, '이미 멈춤이면 다시 쓰지 않음');
  ok(R.pauseLive({ pause: p }, R.CTRL_DEF, '2026-11-20') === p && R.pauseLive({ pause: p }, R.cfgNorm({ dayDrop: { resume: 'nextDay' } }), '2026-11-20') === null, '다시 켜기 기본 = 손으로 · 「다음 날」이면 다음 날 풀림');
  ok(/3일 안에|사흘|3번/.test(R.msgPause('시험 묶음A', p, 3)) || R.msgPause('시험 묶음A', p, 3) !== R.msgPause('시험 묶음A', p, 1), '사흘에 세 번 멈추면 알림 글이 달라짐'); }
ok(R.pauseCheck({ cfg: R.CTRL_DEF, ctl: {}, day, sum: 1900, limit: 2000, nowIso: now }).write === null, '알림선 아래면 아무것도 안 씀');
{ const cfg = R.cfgNorm({ dayDrop: { act: 'alert' } }); const r = R.pauseCheck({ cfg, ctl: {}, day, sum: 2400, limit: 2000, nowIso: now }); ok(!r.pause && r.write && r.write.alert, '「알리기만」 → 알림만 씀', r);
  ok(R.pauseCheck({ cfg, ctl: { alert: r.write.alert }, day, sum: 3000, limit: 2000, nowIso: now }).write === null, '같은 날 같은 까닭 알림은 한 번'); }
{ const r = R.pauseCheck({ cfg: R.CTRL_DEF, ctl: {}, day, sum: 0, limit: 2000, chased: 3, nFold: 100, nowIso: now }); ok(!r.pause && r.write && r.write.alert && r.write.alert.why === 'chased', '추격당함 3개 → 알림(기본)', r);
  const r2 = R.pauseCheck({ cfg: R.cfgNorm({ onChased: 'pause' }), ctl: {}, day, sum: 0, limit: 2000, chased: 2, nFold: 10, nowIso: now }); ok(r2.pause && r2.pause.why === 'chased', '「알림 + 멈춤」이면 비율 20% 넘어도 멈춤', r2);
  ok(R.pauseCheck({ cfg: R.CTRL_DEF, ctl: {}, day, sum: 0, limit: 2000, chased: 1, nFold: 100, nowIso: now }).write === null, '문턱 아래 추격당함은 조용'); }
{ const rc = R.resumeRec('recount', { nowIso: now, by: 't@x', day, sum: 2400 }); ok(rc.mode === 'recount' && rc.base === 2400 && rc.day === day, '「지금부터 다시 셈」 = 지금 합을 바탕으로');
  ok(R.pauseCheck({ cfg: R.CTRL_DEF, ctl: { resume: rc }, day, sum: 4000, limit: 2000, nowIso: now }).write === null && R.pauseCheck({ cfg: R.CTRL_DEF, ctl: { resume: rc }, day, sum: 4500, limit: 2000, nowIso: now }).pause, '다시 켠 뒤 같은 날 알림선만큼 더 내리면 다시 멈춤');
  const sk = R.resumeRec('skipToday', { nowIso: now, day, sum: 2400 }); ok(R.pauseCheck({ cfg: R.CTRL_DEF, ctl: { resume: sk }, day, sum: 99999, limit: 2000, nowIso: now }).write === null && R.pauseCheck({ cfg: R.CTRL_DEF, ctl: { resume: sk }, day: '2026-11-20', sum: 2400, limit: 2000, nowIso: now }).pause, '「오늘은 멈추지 않게」 = 오늘만 · 다음 날 다시 셈');
  ok(/다시 켰습니다/.test(R.msgResume('시험 묶음A', 'recount', 2000, now)), '다시 켜기 알림 글'); }
ok(R.recentPauses([{ kind: 'pause', at: '2026-11-18T03:00:00Z' }, { kind: 'pause', at: '2026-11-10T03:00:00Z' }, { kind: 'resume', at: now }], now) === 1, '사흘 안 멈춤 수');
{ const days = [{ day: '2026-11-17', L }, { day: '2026-11-18', L: null }, { day, L: { x: {} } }]; const out = R.retro(days, [{ fid: 'f1', name: '시험 묶음A', gids: ['g1', 'g2'], nFold: 2 }], { cfg: R.CTRL_DEF, nAll: 100, gAll: 3, dayLoss: 50000 })[0];
  ok(out.over === 1 && out.days.length === 3 && out.days[0].over && !out.days[1].over, '14일 되짚기 = 그날 합이 알림선을 넘은 날 수', out); }

console.log('② 웹앱');
ok(!!REO, '판 러 덩이가 있음');
{ const names = ['ctrlCore', 'ctrlGN', 'ctrlPauseOf', 'ctrlPauseWait', 'ctrlPauseHtml', 'ctrlResume', 'ctrlRetro', 'ctrlRetroHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(REO.replace(/msgAlert\(/g, '')), '브라우저 창 없음');
ok(!/\.(delete|update)\(|\.add\(\{|FieldValue\.delete|batchSave|peQueue|\.set\(/.test(REO), '지우기·값 바꾸기 없음 · 쓰기는 bkcSave 한 곳');
ok(/ctrlPauseHtml\(P\)/.test(fnBody(T, 'ctrlPaint')) && /ctrlRetroHtml\(P\)/.test(fnBody(T, 'ctrlPaint')) && /d\.cresume\) return ctrlResume\(P, t, d\.cresume\)/.test(fnBody(T, 'ctrlClick')), '관제창에 띠·되짚기·단추가 걸림');
ok(/'가격 감시기 0\.10\.62\(판 러/.test(T) && !/판 러\(자동 멈춤\)가 읽을 예정/.test(T) && /⏳ 저장만/.test(T), '읽는 곳 글 고침(onChased·dayDrop) · 다른 ⏳ 줄은 그대로');
ok(/\.ctrl-pause\{/.test(T) && /\.ctrl-alert\{/.test(T), '붉은 띠·노란 띠 꾸밈');
const SAVES = []; let ARM = 'go'; const TOASTS = [];
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, window: { ReadnowCtrl: R },
  S: { prCfg: {}, user: { email: 't@x' }, prBatches: [{ id: 'g1', lastCount: 30 }, { id: 'g2', lastKeys: [1, 2] }, { id: 'g3', lastCount: 50 }], prDec: new Map([['a', { watchGid: 'g1', approvalState: 'pending', autoBlock: '⏸ 묶음 「시험 묶음A」 자동 멈춤 — …' }], ['b', { watchGid: 'g3', approvalState: 'pending', autoBlock: '자동 멈춤' }], ['c', { watchGid: 'g2', approvalState: 'approved', autoBlock: '자동 멈춤' }]]) },
  esc: (s) => String(s), num: (n) => String(n), toast: (m) => TOASTS.push(m), errKo: (e) => String(e && e.message), bkfName: () => '시험 묶음A', kstDay: (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10),
  twiceArm: () => ARM, ctrlPaint() {}, ctrlKids: (fid) => (fid === 'f1' ? [{ id: 'g1' }, { id: 'g2' }] : []), CTL: {},
  db: { collection: (c) => ({ doc: (d) => ({ get: async () => (c === 'eng_fence_ledger' ? { exists: true, data: () => L } : { exists: true, data: () => ({ dayLoss: 50000 }) }) }) }) } };
ctx.bkcOf = (fid) => ctx.N(ctx.CTL[fid] || {}); ctx.bkcLog = (c, x) => [...(c.log || []), x];
ctx.bkcSave = async (fid, fn) => { const nx = ctx.N(fn(ctx.bkcOf(fid))); SAVES.push(nx); ctx.CTL[fid] = nx; return nx; };
vm.createContext(ctx);
vm.runInContext(['BKC_LOG', 'BKF_MAXG'].map((n) => line(new RegExp(`^const ${n} = `))).filter(Boolean).join('\n') + '\nvar BKF_MAXG = typeof BKF_MAXG === "undefined" ? 50 : BKF_MAXG;\n' + line(/^const CTRL_PAGE = 40, CTRL_CAP = 400, CTRL_DEF = /) + '\n' + DEO + '\n' + fnBody(T, 'bkcNorm') + '\n' + line(/^const ctrlCfg = \(fid\) =>/) + '\n' + REO + '\nthis.N = bkcNorm; this.F = { ctrlPauseHtml, ctrlResume, ctrlRetro, ctrlRetroHtml, ctrlPauseWait };', ctx);
const F = ctx.F;
(async () => {
  const p = R.pauseCheck({ cfg: R.CTRL_DEF, ctl: {}, day: ctx.kstDay(Date.now()), sum: 2400, n: 2, limit: 2000, nowIso: new Date().toISOString() }).write.pause;
  { const n = ctx.N({ def: {}, pause: p, resume: { at: 'x', mode: 'recount' }, alert: { at: 'y' }, log: [] }); ok(n.pause && n.pause.sum === 2400 && n.resume && n.alert, 'bkcNorm이 pause·resume·alert를 지킴(웹앱 저장이 감시기 기록을 안 지움)', n);
    ok(!('pause' in ctx.N({ def: {} })) && !('pause' in ctx.N({ def: {}, pause: null })), '없거나 null이면 칸을 만들지 않음'); }
  ctx.CTL.f1 = { def: {}, pause: p, log: [] }; const P = { fid: 'f1' };
  ok(F.ctrlPauseWait('f1') === 1, '기다리는 내림 = 이 묶음 그룹의 자동 멈춤 대기만');
  { const H = F.ctrlPauseHtml(P); ok(/class="ctrl-pause"/.test(H) && /data-cresume="recount"/.test(H) && /data-cresume="skipToday"/.test(H) && /기다리는 내림 1건/.test(H), '붉은 띠 + 다시 켜기 단추 둘', H); }
  const btn = { dataset: {} }; ARM = 'armed'; await F.ctrlResume(P, btn, 'recount'); ok(SAVES.length === 0, '첫 누름엔 쓰지 않음');
  ARM = 'go'; await F.ctrlResume(P, btn, 'recount'); const sv = SAVES[0] || {};
  ok(SAVES.length === 1 && !sv.pause && sv.resume && sv.resume.mode === 'recount' && sv.resume.base === 2400 && sv.log.slice(-1)[0].kind === 'resume', '두 번째 누름 → 멈춤 풂 · 지금 합(원장 다시 읽음)을 바탕으로 기록', sv);
  ok(TOASTS.some((t) => /다시 켰습니다/.test(t)) && F.ctrlPauseHtml(P) === '', '알림 글 · 띠 사라짐');
  ctx.CTL.f1 = { def: {}, alert: { ...p, why: 'chased', chased: 4 }, log: [] }; ok(/class="ctrl-alert"/.test(F.ctrlPauseHtml(P)), '오늘 알림이면 노란 띠');
  ok(/14일 되짚기/.test(F.ctrlRetroHtml(P)), '⚙ 안 되짚기 단추'); await F.ctrlRetro(P); ok(P.retro && P.retro.r && P.retro.r.days.length === 14 && P.retro.r.days[0].limit === 19512 && /14일 중 <b>0일<\/b>/.test(F.ctrlRetroHtml(P)), '되짚기 = 14일 원장 읽기만(쓰기 0) · 알림선 = 한도 × 묶음 상품 몫(32/82)', P.retro && P.retro.r && P.retro.r.days[0]);
  ok(SAVES.length === 1, '되짚기는 쓰지 않음');

  console.log('③ 가격 감시기');
  { const pv = (PW.match(/@version\s+([0-9.]+)/) || [])[1], cv = (PW.match(/readnow-pricing-core\.js\?v=([0-9.]+)/) || [])[1]; ok(vGe(pv, '0.10.62') && vGe(cv, '0.17.20') && cv === PR.VERSION, '가격 감시기 0.10.62 이상 · 코어 0.17.20 이상(코어 판과 같음)', [pv, cv]); }
  const G = fnBody(PW, 'ctrlGate'); ok(!!G && /F\.pauseCheck\(/.test(G) && /doc\('_bkfold'\)\.set\(\{ ctl: \{ \[fo\.fid\]: \{ \.\.\.r\.write, log: firebase\.firestore\.FieldValue\.arrayUnion\(ent\) \} \} \}, \{ merge: true \}\)/.test(G), 'ctrlGate = 코어 판정 · _bkfold에 merge로만(로그는 덧붙임)');
  ok(G.indexOf("doc('_bkfold').get()") > 0 && G.indexOf("doc('_bkfold').get()") < G.indexOf("doc('_bkfold').set("), '쓰기 전 _bkfold를 새로 읽음(웹앱이 방금 다시 켠 것을 덮지 않음)');
  ok(!/\.delete\(|FieldValue\.delete/.test(G) && !/\.delete\(|FieldValue\.delete/.test(fnBody(PW, 'ctrlDay')), '지우기 없음');
  ok(/const CG = (?:DRYW \? null : )?await ctrlGate\(wg\.id, !!J\.chaser, key, now\)/.test(PW) && /if \(CG && CG\.pause && TGW < cur\) why\.push\(/.test(PW), '멈춘 묶음은 값을 내리는 자동 반영을 선택 대기로(올림은 그대로)');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
