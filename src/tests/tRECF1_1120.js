// tRECF1_1120 — (recf1) 관제창 카드 「다시 확정」(brex)도 확인 창 뒤 한 번에 확정
//  ⓐ 관제창 다시 확정 → 웹앱 확인 창(ask/askSheet)이 뜸 → 취소면 아무것도 안 바뀜(그룹 기록 저장 0 · 저장소 쓰기 0 · 관제 사본 그대로)
//  ⓑ 확인이면 그룹 화면 data-brex(toPick → batchExec([i]))와 같은 기록(그룹 기록 batchSave 순서·값 · prd_price_decisions/reviews 쓰기 · 확인 창 글)
//  ⓒ 그룹 화면 다시 확정은 예전과 같음(취소면 결정 대기로 옮김만 · 확인이면 확정) · 그룹 화면 글자 그대로
// 실행: node tRECF1_1120.js · 시험 자료에 손님 정보 없음 · 진짜 운영 저장소·잠금(prd_locks) 쓰지 않음(모두 흉내 · 시각도 고정)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 1200)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const cut = (a, b) => { const i0 = T.indexOf(a), i1 = i0 >= 0 ? T.indexOf(b, i0) : -1; return i0 >= 0 && i1 > i0 ? T.slice(i0, i1) : ''; };
const lineOf = (head) => { const i = T.indexOf('\n' + head); if (i < 0) return ''; const j = T.indexOf('\n', i + 1); return T.slice(i + 1, j); };
const EX = cut('/* ◆bqexec (', '/* ◆bqexec 끝 */'); const FZB = cut('/* ◆bqfz ', '/* ◆bqfz 끝 */'); const RX = cut('/* ◆ctrlrex ', '/* ◆ctrlrex 끝 */');
const G_SAVE = lineOf('  const save = (patch) => { S._bUserAt'); const G_TOPICK = T.split('\n').filter((l) => l.startsWith('  const toPick = (k, price) =>') && l.includes('const x0 = R[iOfK.get(k)]'))[0] || '';
const G_EXEC = (() => { const a = T.indexOf('\n  async function batchExec(only, opt) {'), b = T.indexOf('\n  async function batchExec0(', a); return a > 0 && b > a ? T.slice(a + 1, b) : ''; })(); const G_EXEC0 = lineOf('  async function batchExec0(');
const CLICK = cut('async function ctrlBqClick(', '\nasync function ') || cut('function ctrlBqClick(', '\nfunction ');

console.log('① 글로 확인');
ok(EX && FZB && RX && G_SAVE && G_TOPICK && G_EXEC && G_EXEC0, '덩어리를 모두 찾음(확인 창·확정 본문·관제 다시 확정·그룹 save/toPick/batchExec)');
ok(/if \(d\.brex != null\) \{ await ctrlRex\(it, \{ P, paint \}\); return true; \}/.test(T), '관제창 brex → ctrlRex(확인 창 있는 길)');
ok(CLICK && !/brex[^\n]{0,200}act\('re'/.test(CLICK) && !/brex[^\n]{0,120}'pick'/.test(CLICK), '관제창 brex가 예전 「결정 대기로 옮김만」 길로 가지 않음');
ok(/bqExecCore\(E, \[i\], \{ onOk \}\)/.test(RX) && !/armed\s*:/.test(RX), 'ctrlRex = 같은 확정 본문 · 두 번 누름(armed)을 넘기지 않음 → 확인 창 꼭 뜸');
{ const a = EX.indexOf('if (!await bqExecAsk('), o2 = EX.indexOf('if (O.onOk && !(await O.onOk())) return;'), w1 = EX.indexOf('db.batch()'), w2 = EX.indexOf('cancelOne(', EX.indexOf('async function bqExecCore')), w3 = EX.indexOf('bqOnceStart(');
  ok(a > 0 && o2 > a && w1 > o2 && w2 > o2 && (w3 < 0 || w3 > o2), '확정 본문: 확인 창 → 확인 뒤 onOk → 그 뒤에만 저장소 쓰기', { a, o2, w1, w2, w3 }); }
ok(/\{ if \(!await askSheet\(\{[^\n]*\)\) return false; \}/.test(EX) && /else if \(!quiet && !await ask\(askMsg\)\) return false; \}/.test(EX), '확인 창 = 웹앱 자체 창(askSheet·ask) · 취소면 false');
ok(/return bqExecCore\(\{ BP, L, PRC, R, bqWaitK, c, cancelOne, id, keyOf, nLate, redraw, save, st, startOf, meta: \(\) => S\.batchMeta \|\| \(S\.batchMeta = \{\}\) \}, only, opt\);/.test(G_EXEC0), '그룹 화면 batchExec0 = 그 화면 값 그대로 넘기는 껍데기');
ok(/data-brex[\s\S]{0,40}/.test(T) && T.includes('toPick(k, d.price); await batchExec([i]); redraw();'), '그룹 화면 data-brex 손잡이 글자 그대로(toPick → batchExec([i]))');
ok(/ \(gate && |o\.gate && !o\.gate\(\) \? Promise\.resolve\(true\)/.test(RX), '관제 저장은 확인 전엔 막힘(gate) — 확인 창 앞 빠짐 까닭(dropWhy)도 안 씀');
ok(![EX, RX, FZB].some((s) => /(^|[^.\w])(alert|confirm|prompt)\s*\(/.test(s.replace(/'[^'\n]*'|`[^`]*`/g, ''))), '새 덩어리에 브라우저 alert/confirm/prompt 없음');
{ const n = (re) => (T.match(re) || []).length; ok(n(/\nasync function bqExecAsk\(/g) === 1 && n(/\nasync function bqExecCore\(/g) === 1 && n(/\nfunction bqExecEnvC\(/g) === 1 && n(/\nasync function ctrlRex\(/g) === 1, '새 이름은 한 번씩만 선언'); }

/* ── 흉내 판 ── */
const FIX = '2026-11-20T03:00:00.000Z'; const RD = Date;
class FD extends RD { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return RD.parse(FIX); } }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => (n == null ? '-' : n + '원');
const DEL = { __del: 1 }; const isDel = (v) => v === DEL;
const mkData = () => { const items = [{ u: 'A0', cur: 12000, start: 12000, dec: 9000 }, { u: 'A1', cur: 10000, start: 10000, pick: 8000 }, { u: 'A2', cur: 11000, start: 11000, dec: 9500 }];
  const R = items.map((it) => ({ l: { usedCode: it.u, listingId: 'L' + it.u, title: '책 ' + it.u, price: it.cur, status: '판매중' }, start: it.start, target: it.dec || it.pick }));
  const st = { picks: {}, decided: {}, ctrl: {}, undone: {} }; items.forEach((it) => { const k = 'aladin_' + it.u; if (it.pick) st.picks[k] = { price: it.pick, at: '2026-11-19T01:00:00.000Z', by: 'a@b' }; if (it.dec) st.decided[k] = { price: it.dec, at: '2026-11-19T02:00:00.000Z', by: 'a@b', batchId: 'G1' }; });
  return { R, st, c: { name: '1만 이하', ctrlPct: 0 } }; };
const clone = (o) => JSON.parse(JSON.stringify(o));
function mkEnv(W, D, ans) {
  let rid = 0; const ref = (col, doc) => ({ col, doc });
  const env = {
    Date: FD, id: 'G1', c: D.c, st: D.st, R: D.R, L: D.R.map((x, i) => i).filter((i) => D.st.picks['aladin_' + D.R[i].l.usedCode]), keyOf: (x) => 'aladin_' + x.l.usedCode, startOf: (x) => x.start, lotCheck: () => false,
    S: { prCfg: {}, user: { email: 'a@b' }, batchMeta: {}, pbooks: new Map(), prBatches: [] }, WATCH_MIN: '0.0.1', cmpVer: () => 1, bqApplyUi: () => true, batchIsOn: () => true,
    plkFreshMany: async () => new Map(), bqLockWhy: () => null, plkSkipped: () => {}, plkCondOk: () => true, plkClamp: (v, p) => ({ ok: true, p }), plkCtx: () => ({}), plkNote: () => {},
    PRC: { bucketOf: () => 99, groupOfListing: () => 'g' }, prSettings: () => ({}), fsSafe: (x) => x, mkRows: () => [], decMktOfListing: () => ({}), decSnap: () => Promise.resolve(), phClear: () => {},
    W: () => ({}), BP: { per: 6000, cnt: { wait: 0, applying: 0 } }, nLate: 0, won, num: String, esc, errKo: (e) => String(e && e.message), PR_ST: {},
    ask: async (m) => { W.asks.push(m); return ans; }, askSheet: async (o) => { W.asks.push(o.text); return ans; }, toast: (m) => W.toasts.push(String(m)), rnNoteW: (m) => W.notes.push(m), redraw: () => { W.redraw++; },
    batchSave: async (gid, p) => { W.bsave.push([gid, p]); },
    window: { addEventListener() {}, removeEventListener() {}, ReadnowPricing: { bucketOf: () => 99, groupOfListing: () => 'g' } }, document: { getElementById: () => null },
    firebase: { firestore: { FieldPath: { documentId: () => '__id' }, FieldValue: { delete: () => DEL, arrayUnion: (x) => ({ __union: x }) } } },
    db: { collection: (n) => ({ doc: (d) => { const r = ref(n, d === undefined ? 'auto' + (++rid) : d); r.get = async () => ({ exists: n === 'prd_system', data: () => ({ watchVer: '9.9.9', watchTab: 't', watchBeat: FIX }) }); return r; }, where: () => ({ get: async () => ({ forEach() {}, docs: [] }) }) }),
      batch: () => ({ set: (r, d, o) => { W.db.push(['set', r.col, r.doc, d, o || null]); }, update: (r, d) => { W.db.push(['update', r.col, r.doc, d]); }, commit: async () => { W.db.push(['commit']); } }),
      runTransaction: async () => { W.db.push(['tx']); } },
    meta: () => env.S.batchMeta, pxMark: () => false, ctrlRecOf: () => ({}), bqBaseOf: (x0, t) => ({ base: t }), bqOnceStart: async () => { W.db.push(['once']); }, bqWaitK: () => [], cancelOne: async () => [true],
    twiceArm: () => 'go', bpCalc: () => ({ per: 6000, cnt: { wait: 0, applying: 0 } }), bkfGlSet: (gid, p) => W.gl.push([gid, p]), bkfDirty: (gid) => W.dirty.push(gid), ctrlPaint: () => { W.paint++; },
  };
  const has = (t, k) => typeof k === 'string' && (k in env || !(k in globalThis));
  return new Proxy(env, { has, get: (t, k) => (k === Symbol.unscopables ? undefined : k in t ? t[k] : (() => undefined)) });
}
const newW = () => ({ asks: [], toasts: [], notes: [], bsave: [], db: [], gl: [], dirty: [], redraw: 0, paint: 0 });
const K = 'aladin_A0';
async function runGroup(ans) { const W = newW(), D = mkData(); const P = mkEnv(W, D, ans);
  const F = new Function('env', `with (env) { ${FZB}\n${EX}\n const iOfK = new Map(R.map((x, i) => [keyOf(x), i]));\n${G_SAVE}\n${G_TOPICK}\n${G_EXEC}\n${G_EXEC0}\n return { toPick, batchExec }; }`)(P);
  const i = D.R.findIndex((x) => 'aladin_' + x.l.usedCode === K); const d = D.st.decided[K];
  F.toPick(K, d.price); await F.batchExec([i]); /* 그룹 화면 data-brex 손잡이 그대로 */ W.st = D.st; return W; }
async function runCtrl(ans) { const W = newW(), D = mkData(); const P = mkEnv(W, D, ans);
  const F = new Function('env', `with (env) { ${FZB}\n${EX}\n${RX}\n return { ctrlRex }; }`)(P);
  const SRV = new Map(); const C0 = () => ({ id: 'G1', g: {}, c: D.c, st: D.st, R: D.R, SRV, keyOf: (x) => 'aladin_' + x.l.usedCode, startOf: (x) => x.start, meta: P.S.batchMeta });
  P.bqCtx = async (gid, o) => { W.ctx = [gid, o]; return C0(); };
  const CP = { busy: null }; P.S._bkfCtrl = CP; const itC = { st: clone(D.st) }; const it = { id: 'c1', k: K, gid: 'G1', x: D.R[0], C: itC };
  W.it0 = clone(itC.st); W.r = await F.ctrlRex(it, { P: CP, paint: () => { W.paint++; } }); W.it = it; W.st = D.st; W.CP = CP; W.S = P.S; return W; }
const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (v === DEL ? '〈지움〉' : v)));

(async () => {
  console.log('ⓐ 관제창 다시 확정 → 확인 창 → 취소');
  { const W = await runCtrl(false);
    ok(W.asks.length === 1 && /'1만 이하' 1개 상품을 고른 가격으로 확정할까요\?/.test(W.asks[0]), '확인 창이 한 번 뜸(웹앱 자체 창 · 그룹 화면과 같은 물음)', W.asks);
    ok(W.bsave.length === 0, '취소면 그룹 기록 저장 0', W.bsave); ok(W.db.length === 0, '취소면 저장소 쓰기 0(결정·검토·이번만 적용 모두)', W.db);
    ok(W.gl.length === 0 && W.dirty.length === 0, '취소면 묶음 사본·더러움 표시도 안 건드림');
    ok(JSON.stringify(W.it.C.st) === JSON.stringify(W.it0) && !W.it.done, '관제 카드 사본 그대로(여전히 확정 탭 · 결과 글 없음)');
    ok(W.r === false && W.S._bExecRun === false && W.CP.busy === null, '끝나면 실행 중 표시 풀림'); }
  console.log('ⓑ 확인 → 그룹 화면과 같은 기록');
  { const G = await runGroup(true), C = await runCtrl(true);
    ok(G.bsave.length >= 3 && JSON.stringify(strip(C.bsave)) === JSON.stringify(strip(G.bsave)), `그룹 기록(batchSave ${G.bsave.length}번) 순서·값까지 같음`, { g: strip(G.bsave), c: strip(C.bsave) });
    ok(G.db.length > 0 && JSON.stringify(strip(C.db)) === JSON.stringify(strip(G.db)), `저장소 쓰기(${G.db.filter((x) => x[0] === 'set').length}건 · prd_price_decisions·reviews) 같음`, { g: strip(G.db), c: strip(C.db) });
    ok(G.asks.length === 1 && JSON.stringify(C.asks) === JSON.stringify(G.asks), '확인 창 글 같음');
    ok(JSON.stringify(strip(C.st)) === JSON.stringify(strip(G.st)), '그룹 상태(결정 대기·확정·되돌림) 같음');
    ok(C.st.decided[K] && C.st.decided[K].price === 9000 && !C.st.picks[K], '확정 탭에 다시 확정(9000원)');
    ok(C.gl.length === 1 && C.gl[0][0] === 'G1' && C.gl[0][1].decided[K].price === 9000 && isDel(C.gl[0][1].picks[K]) && C.dirty[0] === 'G1', '묶음 사본 고침(bkfGlSet)·더러움 표시(bkfDirty)');
    ok(C.it.C.st.decided[K] && C.it.C.st.decided[K].price === 9000 && !C.it.C.st.picks[K] && C.it.done === '✅ 9000원 다시 확정' && C.r === true, '관제 카드 = ✅ 다시 확정', C.it.done);
    ok(C.ctx && C.ctx[0] === 'G1' && C.ctx[1] && C.ctx[1].dry === true, '그룹 문서를 새로 읽음(bqCtx dry)'); }
  console.log('ⓒ 그룹 화면 다시 확정은 예전과 같음');
  { const G0 = await runGroup(false);
    ok(G0.asks.length === 1, '그룹 화면도 확인 창');
    ok(G0.bsave.length === 2 && isDel(G0.bsave[0][1].decided[K]) && G0.bsave[0][1].picks[K].price === 9000 && G0.bsave[1][1].undone[K], '취소면 예전처럼 결정 대기로 옮김만(toPick 기록 두 번)', strip(G0.bsave));
    ok(G0.db.length === 0 && G0.st.picks[K] && !G0.st.decided[K], '취소면 확정 쓰기 없음 · 결정 대기에 남음');
    const G1 = await runGroup(true); ok(G1.st.decided[K] && G1.st.decided[K].price === 9000 && G1.db.some((x) => x[0] === 'commit'), '확인이면 확정(저장소 commit)'); }
  console.log('ⓓ 막힘 길 — 확인 없이 확정 안 됨');
  { const W = newW(), D = mkData(); const P = mkEnv(W, D, true); const F = new Function('env', `with (env) { ${FZB}\n${EX}\n${RX}\n return { ctrlRex }; }`)(P);
    P.bqCtx = async () => ({ id: 'G1', c: D.c, st: D.st, R: D.R, SRV: new Map(), keyOf: (x) => 'aladin_' + x.l.usedCode, startOf: (x) => x.start, meta: { viewOnly: true } }); const CP = { busy: null }; P.S._bkfCtrl = CP;
    const r = await F.ctrlRex({ id: 'c1', k: K, gid: 'G1', x: D.R[0] }, { P: CP, paint: () => {} }); ok(r === false && !W.bsave.length && !W.db.length && W.toasts.some((t) => /보기 전용/.test(t)), '보기 전용 그룹은 막힘(쓰기 0)');
    P.S._bExecRun = true; const r2 = await F.ctrlRex({ id: 'c1', k: K, gid: 'G1', x: D.R[0] }, { P: CP, paint: () => {} }); ok(r2 === false && !W.asks.length && !W.bsave.length, '다른 확정 저장 중이면 막힘'); }
  if (process.env.RN_PORT) await screen();
  console.log(bad ? `❌ tRECF1_1120 ${bad}개 실패` : '✓ tRECF1_1120 통과' + (process.env.RN_PORT ? '' : ' (화면 시험은 RN_PORT가 있을 때)')); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 시험 오류', e && e.stack); process.exit(1); });

/* ── ② 화면(RN_PORT) — 🗼 모아 보기 확정 탭 「다시 확정」 → 웹앱 확인 창(askbox) → 취소면 그 그룹 문서 그대로 · 확인이면 확정 ── */
function screen() { return new Promise((resolve) => { console.log('② 화면');
  const Wt = (p, ms) => p.waitForTimeout(ms);
  require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await Wt(p, 500);
    const until = async (f, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(f, arg).catch(() => null); if (v) return v; await Wt(p, 150); } return null; };
    const r0 = await p.evaluate(async (d10) => { if (!S.user) S.user = { email: 't@x', uid: 't' };
      for (let i = 0; i < 3; i++) { const uc = 'U5810000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(508100000 + i), title: '다시 확정 시험 책 ' + i, price: 7000 + i * 200, qty: 1, grade: '상', status: '판매중', active: true, bookId: 'bk58' + i }); }
      if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map();
      for (const l of S.plist.values()) { if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 14000, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + l.usedCode, grade: l.grade, price: (+l.price || 5000) - 400, sellerCode: '1', listingId: '9' + l.usedCode }] }); }
      S.pmLoaded = true; S.sellersLoaded = true;
      const k = 'aladin_U581000010'; const at = new Date(Date.now() - 3600e3).toISOString();
      await db.collection('prd_price_batches').doc('rA').set({ name: '다시 확정 시험 그룹', cond: { ...BATCH_DEF, name: '다시 확정 시험 그룹', pmin: 6900, pmax: 7900, recentDays: 0, kw: '다시 확정 시험' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {}, on: true,
        decided: { [k]: { price: 7300, from: 7000, at, by: 't@x', listingId: '508100000' } } });
      await db.collection('prd_price_decisions').doc(k).set({ listingId: '508100000', approvalState: 'failed', execNote: '시험 — 반영 안 됨', approval: { batchId: 'rA', at, decision: 'batch', price: 7300, by: 't@x' }, 'approval.batchId': 'rA' }); /* 시험 틀 가짜 db는 점 경로 거름(where('approval.batchId'))을 못 해 같은 이름 칸을 덧둠 */
      await db.collection('prd_system').doc('pricing').set({ mode: 'manual', watchVer: '9.9.9', watchTab: 't', watchBeat: new Date().toISOString() });
      S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
      for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'rA'); i++) await new Promise((r) => setTimeout(r, 150));
      const a = await bkfTx({ t: 'new', name: '다시 확정 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['rA'] }); return { fid: a.fid, k }; }, new Date(Date.now() - 10 * 864e5).toISOString());
    await until((fid) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[fid] && S.bkfold.folds[fid].gids.length === 1), 60, r0.fid);
    await p.evaluate((fid) => openBkfold(fid), r0.fid); const tb = await until(() => { const c = S._bkfTb || {}; return c.rA && c.rA.n ? c.rA.n : null; }, 160); ok(!!tb, '묶음 상태판이 셈', tb);
    await p.setViewportSize({ width: 420, height: 860 });
    await p.evaluate((fid) => bkfTbAll(fid, 'done'), r0.fid);
    const hasB = await until(() => !!document.querySelector('#bkf_ctrl [data-brex]'), 120); ok(!!hasB, '모아 보기 확정 탭 카드에 「다시 확정」 단추(반영 안 됨)', hasB ? undefined : await p.evaluate(() => { const c = document.querySelector('#bkf_ctrl'); return { ctrl: c ? c.innerText.slice(0, 3000) : null, g: (S.prBatches || []).map((b) => b.id + ':' + Object.keys(b.decided || {}).length) }; }));
    const docOf = () => p.evaluate(async (k) => { const d = (await batchLoadOne('rA')) || {}; return { dec: (d.decided || {})[k] || null, pick: (d.picks || {})[k] || null, undone: (d.undone || {})[k] || null, ex: (d.execLog || []).length }; }, r0.k);
    const before = await docOf();
    if (hasB) { await p.locator('#bkf_ctrl [data-brex]').first().click();
      const ASKQ = () => { const b = document.querySelector('.askbox') || [...document.querySelectorAll('#sheet')].find((s) => /확정할까요/.test(s.textContent || '')); return b ? (b.textContent || '').slice(0, 200) : null; };
      const box = await until(ASKQ, 120); ok(!!box && /확정할까요/.test(box), '웹앱 확인 창이 뜸(브라우저 창 아님)', box);
      await Wt(p, 300); try { const dir = path.resolve(__dirname, '..', '..', '..', 'readnow-chats', 'reports', 'img'); const out = process.env.RN_RECF1_SHOT || (fs.existsSync(dir) && process.env.RN_RECF1_SHOT_DIR ? path.join(dir, 'RECF1_1120_confirm.png') : ''); if (out) { await p.screenshot({ path: out }); console.log('  · 그림', out); } } catch (e) { console.log('  · 그림 못 찍음', e.message); }
      await p.evaluate(() => { const b = document.querySelector('.askbox .ask-no') || [...document.querySelectorAll('#sheet button')].find((x) => x.textContent.trim() === '취소'); b && b.click(); });
      await Wt(p, 800); const after = await docOf(); ok(JSON.stringify(after) === JSON.stringify(before) && !!after.dec, '취소 → 그 그룹 문서 그대로(여전히 확정 · 결정 대기·되돌림 기록 없음)', { before, after });
      ok(!!(await p.evaluate(() => !!document.querySelector('#bkf_ctrl [data-brex]'))), '취소 뒤 카드도 그대로(다시 확정 단추 남음)');
      await p.locator('#bkf_ctrl [data-brex]').first().click(); await until(ASKQ, 120);
      await p.evaluate(() => { const b = document.querySelector('.askbox .ask-ok') || [...document.querySelectorAll('#sheet button')].find((x) => /확인 — 확정/.test(x.textContent)); b && b.click(); });
      const fin = await until(async (k) => { const d = (await batchLoadOne('rA')) || {}; const v = (d.decided || {})[k]; return v && v.at !== undefined && (d.undone || {})[k] && (d.execLog || []).length ? { at: v.at, price: v.price } : null; }, 120, r0.k);
      ok(!!fin && fin.price === 7300 && fin.at !== before.dec.at, '확인 → 그 그룹 문서에 다시 확정(새 확정 시각 · 되돌림 기록 · 실행 기록)', { fin, before });
      const sv = await p.evaluate(async (k) => { const s = await db.collection('prd_price_decisions').doc(k).get(); const v = s.data() || {}; return { st: v.approvalState, b: (v.approval || {}).batchId }; }, r0.k); ok(sv.st === 'manual' && sv.b === 'rA', '결정 문서 = 반영 대기(manual · 이 그룹)', sv); }
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(ov <= 1, '420px 가로 넘침 없음', ov);
    ok(!dlg.length, '브라우저 alert/confirm/prompt 0', dlg);
  }).then(resolve, (e) => { bad++; console.log('  ❌ 화면 시험 오류', e && e.stack); resolve(); }); }); }
