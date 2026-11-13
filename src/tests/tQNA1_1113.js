// tQNA1_1113 — (11/13 일꾼 qna1 · 정범님 11/13 14:57 「알라딘 문의를 거의 수시로 · 웹앱에 안 뜨면 다시 읽는 단추」)
//  🤖 수집기: ❓ 문의 실시간(qnaLivePc) — 묻고 답하기 목록 첫 쪽만 낮 2분·밤 10분마다(설정) · 바뀐 때만 본문 읽기 · 로거·출고 중·로그인 풀림·수집기 탭 아님이면 안 함 · PC끼리 트랜잭션
//     · 웹앱 「🔄 문의 다시 읽기」(prd_jobs/qna_live.req) 받기 · 묻고 답하기 일이 첫 쪽 모양(doneSig)·올린 수(upN)를 남김
//  🖥 웹앱: ❓ 문의 모음 맨 위 줄·단추 · 다시 읽기 상태 글 · ⚙ ⑯-2 ❓ 문의 실시간 · 새 문의가 올라오면 문의 목록 저절로 다시 받기
//  ☁ 클라우드: 진단 qnalat(문의 생긴 때 → 처음 뜬 때 늦음)
// 실행: node src/tests/tQNA1_1113.js (순수 셈·흉내 PC) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const find = (rel) => [path.resolve(__dirname, '..', '..', rel), path.resolve(__dirname, '..', rel), path.resolve(__dirname, rel), process.env.RN_REPO ? path.join(process.env.RN_REPO, rel) : ''].filter(Boolean).find((x) => fs.existsSync(x));
const rd = (rel) => { const f = find(rel); return f ? fs.readFileSync(f, 'utf8') : ''; };
const CL = rd('cloud/index.js'), APP = rd('src/app.html') || rd('app.html'), COL = rd('src/readnow-collector.src.js') || rd('readnow-collector.user.js');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };
const tick = () => new Promise((r) => setImmediate(r));
(async () => {
  console.log('① 🤖 수집기 — 순수 셈');
  const QL = cut(COL, '  (function qnaLivePc() {', '\n  async function lookupBook(');
  const pure = new Function(cut(QL, 'const QL_DEF = ', 'window.__rnQlPure') + 'return { QL_DEF, qlCfgOf, qlSig, qlGapMs };')();
  ok(JSON.stringify(pure.qlCfgOf(null)) === '{"on":true,"dayMin":2,"nightMin":10}', '기본값 — 켬 · 낮 2분 · 밤 10분', pure.qlCfgOf(null));
  ok(JSON.stringify(pure.qlCfgOf({ on: false, dayMin: 0, nightMin: 999 })) === '{"on":false,"dayMin":1,"nightMin":120}' && pure.qlCfgOf({ dayMin: 'x' }).dayMin === 2, '설정 범위 1~120분 · 숫자 아니면 기본값');
  ok(pure.qlGapMs({ dayMin: 2, nightMin: 10 }, false) === 120e3 && pure.qlGapMs({ dayMin: 2, nightMin: 10 }, true) === 600e3, '낮·밤 간격');
  const rows = [{ questionId: '901', answered: 'No' }, { questionId: '900', answered: 'Yes' }, { questionId: '899', answered: null }, { questionId: null }];
  ok(pure.qlSig(rows) === '901:No,900:Yes,899:', '첫 쪽 모양 = 문의 번호:답변여부 (번호 없는 줄 뺌)', pure.qlSig(rows));
  { const tq = cut(COL, '  async function taskQna() {', '  async function uploadQnaNow() {'); const m = tq.match(/if \(pg === 1\) sig1 = (rows\.filter[^;]+);/); ok(!!m, '묻고 답하기 일이 첫 쪽(pg 1)에서 모양을 셈');
    if (m) { const f = new Function('rows', 'return ' + m[1]); ok(f(rows) === pure.qlSig(rows), '묻고 답하기 일의 모양 셈 = 가벼운 확인의 모양 셈(같은 글자)'); }
    ok(/const up = await uploadQnaNow\(\); window\.__rnQnaLastUp = up/.test(tq) && /doc\('qna_live'\)\.set\(\{ doneSig: sig1, doneAt: now\(\), donePc: PC\.name \|\| '', doneBy: 'crm:qna', upN: up\.n/.test(tq), '묻고 답하기 일이 끝나면 doneSig·upN을 prd_jobs/qna_live에'); }
  { const up = cut(COL, '  async function uploadQnaNow() {', '  /* ════════ 4) 구매평'); const rets = up.match(/return[^;]*;/g) || []; ok(rets.length === 3 && rets.every((r) => /\{ ok: (true|false), n/.test(r)), '올리기 결과를 모든 끝에서 { ok, n, total }로 돌려줌', rets); }
  console.log('② 🤖 수집기 — 지킴(글자)');
  ok(/\(function qnaLivePc\(\) \{ if \(PUBONLY\) return;/.test(QL), '로거(공개 전용)는 아예 안 돎');
  ok(/if \(!auth\.currentUser \|\| !pcLoggedNow\(\)\) return '이 PC 알라딘 로그인 안 됨'; if \(window\.__rnSgOn && window\.__rnSgOn\(\)\) return '🚚 출고 중\(이 PC 보호\)'/.test(QL), '로그인 풀린 PC·🚚 출고 중인 PC는 확인도 다시 읽기도 안 함');
  ok(/window\.__rnRole\(\) !== 'lead'/.test(QL) && /window\.__rnPaused/.test(QL) && /window\.__rnRest/.test(QL), '수집기 탭(lead)·일시정지·쉬는 탭 지킴');
  ok(/wUsedShopC2CQnASellerList\.aspx\?page=1'/.test(QL) && (QL.match(/lookDoc\(/g) || []).length === 1, '가벼운 확인은 목록 첫 쪽 한 장만');
  ok(!/alert\(|confirm\(|prompt\(/.test(QL), '브라우저 팝업 없음');
  { const HD = rd('readnow-collector.user.js'); ok(!HD || !/qnaLivePc/.test(HD.split('// ==/UserScript==')[0] || ''), '머리(UserScript 칸)는 건드리지 않음'); }
  console.log('③ 🤖 흉내 PC — 확인 → 바뀜 → 본문 읽기 · 다시 읽기 단추');
  const run = async (opt) => { let now = Date.parse('2026-11-13T05:00:00Z'); const realNow = Date.now; Date.now = () => now;
    const docs = { 'prd_jobs/qna_probe': opt.probe || null, 'prd_jobs/qna_live': opt.live || null, 'app_settings/qna_live_cfg': opt.cfg || null }; const subsF = {}; const W = [];
    const snap = (k) => ({ exists: !!docs[k], data: () => docs[k] && JSON.parse(JSON.stringify(docs[k])) });
    const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !('_sv' in v) ? merge(o[k], v) : v; return o; };
    const ref = (k) => ({ k, get: async () => snap(k), set: async (v, o) => { W.push([k, v]); docs[k] = o && o.merge ? merge(docs[k], v) : v; (subsF[k] || []).forEach((f) => f(snap(k))); }, onSnapshot: (f) => { (subsF[k] = subsF[k] || []).push(f); f(snap(k)); return () => {}; } });
    const C = (c) => ({ doc: (id) => ref(c + '/' + id) });
    const db = { runTransaction: async (fn) => { const tx = { get: (r) => r.get(), set: (r, v, o) => { r.set(v, o); } }; return fn(tx); } };
    let loops = 0; const sleep = async (ms) => { loops++; if (loops > (opt.loops || 60)) throw new Error('끝'); now += ms; await tick(); };
    let starts = 0; const crmRows = opt.page || [];
    const win = { __rnRole: () => opt.role || 'lead', __rnSgOn: () => !!opt.sg, __rnPaused: false, __rnRest: () => false, __rnCrm: { start: async (n) => { starts++; win.__rnQnaLastUp = { ok: true, n: opt.upN == null ? 1 : opt.upN, total: 9 }; if (opt.crmWrites) await C('prd_jobs').doc('qna_live').set({ doneSig: pure.qlSig(crmRows), doneAt: 'x', upN: 1 }, { merge: true }); return n === 'qna' ? 'done' : 'skip'; }, busy: () => false, otherBusy: () => false }, ReadnowOrders: { parseQnaList: () => crmRows.map((r) => ({ ...r })) } };
    let reads = 0; const doc0 = { querySelector: (s) => (/wUsedShopC2CAnswer/.test(s) ? {} : null), body: { textContent: '묻고 답하기' } };
    const lookDoc = async (u) => { reads++; if (opt.loginPage) return { doc: { querySelector: () => null, body: { textContent: '로그인' } }, finalUrl: 'https://www.aladin.co.kr/login/wlogin.aspx' }; return { doc: doc0, finalUrl: u }; };
    const logs = []; const env = { PUBONLY: !!opt.pub, C, db, auth: { currentUser: opt.noAuth ? null : { uid: 'u' } }, pcLoggedNow: () => !opt.loggedOut, log: (m) => logs.push(m), nowIso: () => new Date(now).toISOString(), sleep, lookDoc, TS: () => ({ _sv: 1 }), PC_NAME: opt.pc || 'JS-MAIN', APP_VER: '9.9.9', nightCfgSync: () => ({ on: true, quiet: '01:00-04:55' }), nightIn: () => !!opt.night, window: win, globalThis: win };
    const A0 = '(async () => { await sleep(20000);', B0 = '} catch (e) { busy = false; } } })(); })();'; const bi = QL.lastIndexOf(B0); if (QL.indexOf(A0) < 0 || bi < 0) throw new Error('고리 못 찾음');
    const body = QL.slice(0, bi).replace(A0, '(async () => { try { await sleep(20000);') + '} catch (e) { busy = false; } } } catch (e) { res(); } })(); })();';
    const f = new Function(...Object.keys(env), 'return new Promise((res) => { if (PUBONLY) setImmediate(res);\n' + body + '\n});');
    const pr = f(...Object.values(env)); if (opt.during) await opt.during({ docs, ref, C, adv: (ms) => { now += ms; } }); await pr; Date.now = realNow; return { docs, W, starts, reads, logs, now }; };
  const P1 = [{ questionId: '901', answered: 'No' }, { questionId: '900', answered: 'Yes' }];
  { const r = await run({ page: P1, live: { doneSig: pure.qlSig(P1) }, loops: 40 }); const pv = r.docs['prd_jobs/qna_probe'] || {};
    ok(r.reads >= 3 && r.starts === 0 && pv.same === true && pv.pc === 'JS-MAIN', '바뀐 게 없으면 첫 쪽만 읽고 본문 읽기 안 함', { reads: r.reads, starts: r.starts, pv });
    ok(r.reads <= Math.ceil((40 * 15) / 120) + 2, '낮 2분 간격(흉내 시계 약 10분에 첫 쪽 5~6장 안팎)', r.reads); }
  { const P2 = [{ questionId: '902', answered: 'No' }, ...P1]; const r = await run({ page: P2, live: { doneSig: pure.qlSig(P1) }, loops: 40 }); const lv = r.docs['prd_jobs/qna_live'];
    ok(r.starts === 1 && lv.doneSig === pure.qlSig(P2) && lv.doneBy === 'probe' && lv.upN === 1, '새 문의가 보이면 본문 읽기 한 번 → doneSig·upN', { starts: r.starts, lv }); }
  { const P2 = [{ questionId: '901', answered: 'Yes' }, { questionId: '900', answered: 'Yes' }]; const r = await run({ page: P2, live: { doneSig: pure.qlSig(P1) }, loops: 12, crmWrites: true }); ok(r.starts === 1, '답변여부가 바뀌어도 본문 읽기(한 번만)', r.starts); }
  { const r = await run({ page: [{ questionId: '903', answered: 'No' }], live: { doneSig: '' }, loops: 40, sg: true }); ok(r.reads === 0 && r.starts === 0, '🚚 출고 중인 PC는 첫 쪽도 안 읽음', r); }
  { const r = await run({ page: P1, loops: 30, loggedOut: true }); ok(r.reads === 0, '로그인 풀린 PC는 안 읽음(다른 PC가)'); }
  { const r = await run({ page: P1, loops: 30, role: 'follow' }); ok(r.reads === 0, '수집기 탭(lead)이 아니면 안 읽음'); }
  { const r = await run({ page: P1, loops: 30, pub: true }); ok(r.reads === 0 && r.W.length === 0, '로거는 아무것도 안 함'); }
  { const r = await run({ page: P1, loops: 30, probe: { at: new Date(Date.parse('2026-11-13T05:00:30Z')).toISOString(), pc: 'MJ-MAIN' }, live: { doneSig: pure.qlSig(P1) } }); ok(r.reads >= 1 && r.reads <= 4, '다른 PC가 막 확인했으면 그 간격 동안은 쉼(한 번에 한 PC)', r.reads); }
  { const r = await run({ page: P1, loops: 200, loginPage: true }); const pv = r.docs['prd_jobs/qna_probe'] || {}; ok(r.starts === 0 && pv.fails >= 5 && r.reads <= 7, '로그인 화면이 오면 실패로 셈 · 5번 연속이면 30분 쉼(되풀이 안 함)', { reads: r.reads, pv }); }
  { const r = await run({ page: P1, night: true, live: { doneSig: pure.qlSig(P1) }, loops: 60 }); ok(r.reads <= 3, '밤(🌙 조용한 시간)엔 10분 간격', r.reads); }
  { const r = await run({ page: P1, cfg: { on: false }, loops: 30 }); ok(r.reads === 0, '⚙에서 끄면 안 읽음'); }
  { const r = await run({ page: P1, live: { doneSig: pure.qlSig(P1) }, loops: 40, upN: 3, during: async (X) => { for (let i = 0; i < 6; i++) await tick(); await X.ref('prd_jobs/qna_live').set({ req: { id: 'qT', at: new Date(Date.now()).toISOString(), atMs: Date.now(), by: 'a@b', dev: 'JS-MAIN' }, reqRun: { id: 'qT', state: 'queued' } }, { merge: true }); } });
    const rr = (r.docs['prd_jobs/qna_live'] || {}).reqRun || {}; ok(r.starts === 1 && rr.state === 'done' && rr.pc === 'JS-MAIN' && rr.upN === 3 && /3건/.test(rr.msg || ''), '🔄 다시 읽기 — 누른 기기와 같은 PC가 받아 본문 읽기 → 결과·시각', rr); }
  { const r = await run({ page: P1, live: { doneSig: pure.qlSig(P1) }, loops: 30, sg: true, during: async (X) => { for (let i = 0; i < 6; i++) await tick(); await X.ref('prd_jobs/qna_live').set({ req: { id: 'qU', at: 'x', atMs: Date.now(), dev: 'JS-MAIN' }, reqRun: { id: 'qU', state: 'queued' } }, { merge: true }); } });
    ok(r.starts === 0 && ((r.docs['prd_jobs/qna_live'] || {}).reqRun || {}).state === 'queued', '🚚 출고 중인 PC는 다시 읽기도 안 받음(대기열에 남아 다른 PC가)'); }
  console.log('④ 🖥 웹앱');
  { const A = cut(APP, 'const QL_DEF_APP = ', 'function watchQnaLive()'); const kTime = (iso) => { const t = Date.parse(iso || ''); if (!Number.isFinite(t)) return ''; return new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' '); }; const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, ''); const num = (n) => String(n);
    const W = new Function('kTime', 'esc', 'num', A + 'return { qlCfgApp, qlReqState, qlProbeLine };')(kTime, esc, num); const N = Date.parse('2026-11-13T06:00:00Z');
    const COLD = pure.qlCfgOf({ dayMin: 5, nightMin: 0 }), APPD = W.qlCfgApp({ dayMin: 5, nightMin: 0 }); ok(JSON.stringify(COLD) === JSON.stringify(APPD) && JSON.stringify(W.qlCfgApp(null)) === JSON.stringify(pure.qlCfgOf(null)), '웹앱·수집기 설정 셈이 같음');
    ok(W.qlReqState({}, N).st === 'idle', '맡긴 것 없음');
    const q = { id: 'a', at: new Date(N - 30e3).toISOString(), atMs: N - 30e3 };
    ok(W.qlReqState({ req: q, reqRun: { id: 'a', state: 'queued' } }, N).st === 'wait' && W.qlReqState({ req: q, reqRun: { id: 'a', state: 'queued' } }, N).busy, '맡김 → 받기를 기다림(단추 잠김)');
    ok(W.qlReqState({ req: { ...q, atMs: N - 5 * 60e3 }, reqRun: { id: 'a', state: 'queued', note: 'MJ-MAIN: 못 끝냄' } }, N).st === 'nopc', '2분 넘게 아무도 안 받음 — 까닭 글과 함께');
    { const s = W.qlReqState({ req: { ...q, atMs: N - 16 * 60e3 }, reqRun: { id: 'a', state: 'queued' } }, N); ok(s.st === 'fail' && !s.busy && /15분/.test(s.t), '15분 동안 받은 PC 없음 → 실패 글 · 다시 누를 수 있음', s); }
    ok(W.qlReqState({ req: q, reqRun: { id: 'a', state: 'running', pc: 'JS-MAIN', startAt: new Date(N - 60e3).toISOString() } }, N).st === 'run', 'PC가 읽는 중');
    { const s = W.qlReqState({ req: q, reqRun: { id: 'a', state: 'done', pc: 'JS-MAIN', endAt: new Date(N).toISOString(), upN: 2, msg: '새로·바뀐 문의 2건을 웹앱에 올림' } }, N); ok(s.st === 'done' && /15:00/.test(s.t) && /JS-MAIN/.test(s.t) && /2건/.test(s.t), '끝 — 시각·PC·결과', s); }
    ok(W.qlReqState({ req: q, reqRun: { id: 'old', state: 'done' } }, N).st === 'idle', '다른 맡김의 결과는 섞지 않음');
    { const t = W.qlProbeLine({}, { okAt: new Date(N - 3 * 60e3).toISOString(), pc: 'JS-MAIN', day: '2026-11-13', n: 180 }, N); ok(/낮 2분·밤 10분/.test(t) && /3분 전/.test(t) && /오늘 180번/.test(t) && !/늦음/.test(t), '확인 주기 줄 — 마지막 확인·오늘 횟수', t); }
    ok(/늦음/.test(W.qlProbeLine({}, { okAt: new Date(N - 60 * 60e3).toISOString(), pc: 'x' }, N)) && /꺼짐/.test(W.qlProbeLine({ on: false }, {}, N)), '확인이 오래 끊기면 ⚠ · 끄면 꺼짐 글'); }
  ok(/watchQnaLive\(\); qlProbeGet\(\); m\.insertAdjacentHTML\('beforeend', `<div id="qna_live">\$\{qnaLiveHtml\(\)\}<\/div>`\); qlBind\(m\);/.test(cut(APP, 'function renderQnaBox(m) {', '/* ══════════ (10/26) 💬 묻고 답하기')), '❓ 문의 모음 맨 위에 줄·🔄 문의 다시 읽기');
  ok(/S\.qnaAll = a; bump\(\); try \{ watchQnaLive\(\); \} catch/.test(APP) && /function qlReload\(\) \{ if \(!Array\.isArray\(S\.qnaAll\)\) return; S\.qnaAll = null;/.test(APP), '새 문의가 올라오면(upN > 0) 문의 목록을 저절로 다시 받음');
  ok(/sec\('set_qnalive', '⑯-2 ❓ 문의 실시간'/.test(APP) && /doc\('qna_live_cfg'\)\.set\(\{ on, dayMin: day, nightMin: night/.test(APP) && /if \(!isAdminDevice\(\)\) \{ toast\('❓ 문의 실시간은 모든 PC 공용/.test(APP), '⚙ 설정 › ⑯-2 ❓ 문의 실시간(관리자 기기만 · 모든 PC 공용)');
  ok(/"⑯-2 ❓ 문의 실시간 — /.test(APP) && /t: '🔄 문의 다시 읽기 — /.test(APP), '기능 찾기 두 줄');
  { const A = cut(APP, 'const QL_DEF_APP = ', 'function renderQnaBox(m) {'); ok(!/alert\(|confirm\(|prompt\(/.test(A) && !/localStorage/.test(A), '웹앱 쪽 팝업·기기 저장 없음'); }
  console.log('⑤ ☁ 클라우드 진단 qnalat');
  { const F = new Function(cut(CL, 'function qnaLatCalc(', 'async function diagQnaLat(') + 'return qnaLatCalc;')(); const since = Date.parse('2026-11-06T15:00:00Z');
    const items = [{ questionId: '1', createdAt: '2026-11-13T10:00', answerStatus: 'No' }, { questionId: '2', createdAt: '2026-11-12T09:00', answerStatus: 'Yes' }, { questionId: '3', createdAt: '2026-11-11', answerStatus: 'Yes' }, { questionId: '4', createdAt: '2026-10-01T09:00' }, { questionId: '5', createdAt: '2026-11-13T11:00' }];
    const P = new Map([['1', { at: '2026-11-13T01:40:00Z', state: 'sent' }], ['2', { at: '2026-11-12T00:05:00Z', state: 'sent' }], ['5', { at: '2026-11-13T02:00:00Z', state: 'baseline' }]]);
    const R = F(items, P, since, 7); ok(R.n === 4 && R.noTime === 1 && R.withPush === 2 && R.med === 40 && R.max === 40 && R.over30 === 1 && R.rows[0].q === '5' && R.rows[0].min === null, '문의 생긴 때(한국 시각) → 처음 뜬 때 분 · 처음부터 있던 것(baseline)은 안 셈 · 시각 없는 문의는 따로 셈', R); }
  ok(/if \(q\.qnalat\) \{/.test(CL) && /select\('questionId', 'createdAt', 'answerStatus'\)/.test(CL) && !/select\([^)]*'body'/.test(cut(CL, 'async function diagQnaLat(', '/* ══════════ ❓ (정범님 10/26)')), '진단은 번호·시각·답변여부만(글·손님 정보 없음)');
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
