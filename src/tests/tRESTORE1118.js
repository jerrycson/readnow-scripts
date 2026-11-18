// tRESTORE1118 — (11/18 일꾼 restore1 · 정범님 노트 「상품 기록 되돌리기 진행」) 되돌리기 쓰기만 쓰기 지킴이를 비켜 감
//  까닭: 11/18 09:42 로거 저절로 되돌리기가 14,658개를 고르고 쓰기 지킴이(wguard1)에 막힘(「이미 있는 문서 200개를 새 문서로 적으려 해 멈춤」 · 아무것도 안 씀)
//   되돌리기는 이미 있는 상품에 처음 본 날을 옛 값으로 일부러 다시 적는 일 — 지킴이 ①~③이 늘 막음
//  ① commitBatches(ops, label, { wgSkip: 'listfix' }) — prd_listings 합치기 쓰기·prd_listing_changes 쓰기만 비켜 감 · 통째 쓰기·다른 모음·다른 이름표·이름표 없음은 지킴이 그대로
//  ② 수집기 안에서 이 이름표를 쓰는 곳은 lfrApply 하나뿐 · lfrApply는 되돌림 자료를 먼저 남김(그대로)
//  ③ lfaClaim — 'error-apply' + 「쓰기 지킴이」로 멈춘 것만 한 번 다시(wgfix 표시) · 다른 까닭·done·held·stop은 그대로 막음
//  ④ lfrAuto — PC 기억(rn-lfa-done)이 'error-apply'여도 한 번은 다시 봄(rn-lfa-wgfix) · 머리 그대로
//  ⑤ (fbrev1 §10) 앞 페이지 올리기 삭제는 샵매니저 줄이 판매중·맡길 때와 같은 수량일 때만
// 실행: node src/tests/tRESTORE1118.js (네트워크 없음 · 시험 자료는 모두 지어낸 값)
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const SRC = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌ ' + m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓ ' + m); };
const cut = (a0, b0) => { const a = SRC.indexOf(a0); const b = SRC.indexOf(b0, a + 1); return a > 0 && b > a ? SRC.slice(a, b) : ''; };
const BLK = cut('/* ⟦wguard1 쓰기 지킴이⟧', '  const LISTING_FIELDS');

function mk(store0) {
  const store = new Map(Object.entries(store0 || {})); const st = { commits: 0, logs: [], guard: [] };
  const col = (name) => { const c = { id: name, path: name,
    doc(id) { if (id == null) id = 'auto_' + Math.random().toString(36).slice(2, 10); return { id, path: name + '/' + id, parent: c }; },
    where(f, op, ids) { return { get: async () => { const docs = ids.filter((id) => store.has(name + '/' + id)).map((id) => ({ id, ref: { path: name + '/' + id }, data: () => JSON.parse(JSON.stringify(store.get(name + '/' + id))) })); return { size: docs.length, docs, metadata: { fromCache: false }, forEach: (fn) => docs.forEach(fn) }; } }; } }; return c; };
  const apply = (p, v, merge) => { const cur = merge ? { ...(store.get(p) || {}) } : {}; for (const [k, x] of Object.entries(v)) { if (x && x.inc != null) cur[k] = (+cur[k] || 0) + x.inc; else cur[k] = x; } store.set(p, cur); };
  const db = { batch() { const q = []; return { set(ref, v, o) { q.push(['set', ref, v, o]); }, update(ref, v) { q.push(['update', ref, v]); }, delete(ref) { q.push(['delete', ref]); }, async commit() { st.commits++; for (const [k, ref, v, o] of q) { if (k === 'set') apply(ref.path, v, !!(o && (o.merge || o.mergeFields))); else if (k === 'update') apply(ref.path, v, true); else store.delete(ref.path); } } }; } };
  const sbC = (n) => { const c = col(n); const d0 = c.doc.bind(c); c.doc = (id) => { const r = d0(id); r.set = async (v, o) => apply(r.path, v, !!(o && o.merge)); r.get = async () => ({ data: () => store.get(r.path) }); return r; }; return c; };
  const firebase = { firestore: { FieldPath: { documentId: () => '__id__' }, FieldValue: { increment: (n) => ({ inc: n }) } } };
  const sb = { C: sbC, db, firebase, log: (m) => st.logs.push(String(m)), ui: () => {}, nowIso: () => new Date().toISOString(), PC_NAME: 'TESTPC', PUBONLY: false, W: () => ({ writer: 'TESTPC' }), Date, JSON, Math, Object, Map, Set, Array, String, Number, Error, Promise, console };
  vm.createContext(sb); vm.runInContext(`let LISTINGS = new Map();\n${BLK}\n;this.api = { commitBatches, WG, WG_SKIP, col: C };`, sb);
  return { A: sb.api, st, store, col };
}
const old = (i) => ({ channel: 'aladin', usedCode: 'U' + i, firstSeenAt: '2026-11-17T03:37:00.000Z', registeredAt: '2023-05-01', status: '판매중', memo: '메모 ' + i });
const storeOf = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`prd_listings/aladin_U${i}`, old(i)]));
const restoreOps = (col, n) => { const ops = []; for (let i = 0; i < n; i++) { ops.push((b) => b.set(col('prd_listings').doc('aladin_U' + i), { firstSeenAt: '2025-02-0' + ((i % 9) + 1) + 'T00:00:00.000Z', listfixAt: 'x', listfixBy: 'listfix1117-1108' }, { merge: true })); ops.push((b) => b.set(col('prd_listing_changes').doc(), { listingKey: 'aladin_U' + i, source: 'listfix1117-1108' })); } return ops; };

(async () => {
  try {
    ok(BLK.length > 3000 && /const WG_SKIP = \{ listfix: \['prd_listings', 'prd_listing_changes'\] \}/.test(BLK), '① 비켜 가는 이름표는 listfix 하나 · 모음 둘(prd_listings·prd_listing_changes)');
    console.log('① 11/18 09:42 다시 돌리기 — 이미 있는 상품 300개에 처음 본 날을 옛 값으로');
    { const { A, st, store, col } = mk(storeOf(300)); let err = null; try { await A.commitBatches(restoreOps(col, 300), '시험'); } catch (e) { err = e; }
      ok(err && /쓰기 지킴이/.test(err.message) && st.commits === 0, '이름표 없으면 예전처럼 지킴이가 멈춤(아무것도 안 씀)', err && err.message); }
    { const { A, st, store, col } = mk(storeOf(300)); await A.commitBatches(restoreOps(col, 300), '시험', { wgSkip: 'listfix' });
      const a0 = store.get('prd_listings/aladin_U0'), a299 = store.get('prd_listings/aladin_U299');
      ok(st.commits === 2 && a0.firstSeenAt === '2025-02-01T00:00:00.000Z' && a299.firstSeenAt === '2025-02-03T00:00:00.000Z', '이름표 listfix → 300개 모두 옛 처음 본 날로(묶음 2)', { c: st.commits, a0, a299 });
      ok(a0.memo === '메모 0' && a0.registeredAt === '2023-05-01' && a0.status === '판매중', '합치기 쓰기 — 다른 칸(메모·등록일·상태)은 그대로', a0);
      ok([...store.keys()].filter((k) => k.startsWith('prd_listing_changes/')).length === 300, '바뀐 칸 기록(prd_listing_changes) 300줄');
      ok(A.WG.win.n === 0 && !store.get('prd_system/wguard'), '지킴이 셈(1시간 문턱)·멈춤 기록에 안 들어감', { n: A.WG.win.n });
      ok(st.logs.some((l) => /되돌리기\(listfix\) 쓰기 600개는 지킴이를 비켜 감/.test(l)), '기록 줄에 비켜 간 쓰기 수를 남김', st.logs); }
    console.log('① 같은 이름표라도 비켜 가지 않는 것');
    { const { A, st, store, col } = mk(storeOf(80)); const ops = Array.from({ length: 80 }, (_, i) => (b) => b.set(col('prd_listings').doc('aladin_U' + i), { firstSeenAt: 'NEW', title: 't' }));
      let err = null; try { await A.commitBatches(ops, '시험', { wgSkip: 'listfix' }); } catch (e) { err = e; }
      ok(err && /쓰기 지킴이/.test(err.message) && st.commits === 0 && store.get('prd_listings/aladin_U0').memo === '메모 0', 'prd_listings 통째 쓰기(합치기 아님)는 지킴이 그대로(멈춤)', err && err.message); }
    { const S = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`acc_deposit/d${i}`, { firstSeenAt: '2025-01-01', add: 1 }])); const { A, st, store, col } = mk(S);
      const ops = Array.from({ length: 80 }, (_, i) => (b) => b.set(col('acc_deposit').doc('d' + i), { firstSeenAt: 'NEW', add: 9 }, { merge: true }));
      let err = null; try { await A.commitBatches(ops, '시험', { wgSkip: 'listfix' }); } catch (e) { err = e; }
      ok(err && /쓰기 지킴이/.test(err.message) && store.get('acc_deposit/d0').firstSeenAt === '2025-01-01', '다른 모음(acc_deposit)은 같은 묶음 안이어도 지킴이 그대로', err && err.message); }
    { const S = { ...storeOf(10), 'acc_deposit/d1': { firstSeenAt: '2025-01-01', add: 1 } }; const { A, st, store, col } = mk(S);
      const ops = [...restoreOps(col, 10), (b) => b.set(col('acc_deposit').doc('d1'), { firstSeenAt: 'NEW', add: 9 }, { merge: true })];
      await A.commitBatches(ops, '시험', { wgSkip: 'listfix' }); const d = store.get('acc_deposit/d1');
      ok(store.get('prd_listings/aladin_U3').firstSeenAt === '2025-02-04T00:00:00.000Z' && d.firstSeenAt === '2025-01-01' && d.add === 9, '섞인 묶음: 되돌리기 쓰기는 지나가고 · 다른 모음 쓰기는 지킴이 ②(처음 값만 뺌)', d); }
    for (const name of ['other', '__proto__', 'toString', 'constructor', '']) { const { A, st, col } = mk(storeOf(60)); let err = null; try { await A.commitBatches(restoreOps(col, 60), '시험', { wgSkip: name }); } catch (e) { err = e; }
      ok(err && /쓰기 지킴이/.test(err.message) && st.commits === 0, `모르는 이름표('${name}')는 지킴이 그대로`, err && err.message); }

    console.log('② 이 이름표를 쓰는 곳');
    const uses = SRC.match(/\{ wgSkip: '[^']*' \}/g) || []; ok(uses.length === 1, '② 수집기 안에서 wgSkip을 넘기는 곳은 하나뿐', uses);
    const LA = cut('  async function lfrApply(', '  async function listfixRestore('); ok(/await commitBatches\(ops, `상품 기록 되돌리는 중[^`]*`, \{ wgSkip: 'listfix' \}\)/.test(LA), '② 그곳 = lfrApply(상품 기록 되돌리기 쓰기)');
    const iU = LA.indexOf("doc(`listfix_undo_${tag}_${i}`).set("), iC = LA.indexOf('await commitBatches('); ok(iU > 0 && iU < iC, '② 되돌림 자료(prd_system/listfix_undo_*)를 먼저 남기고 씀(그대로)');
    ok(/for \(const r of part\.slice\(0, 3\)\) \{ const v = \(await C\('prd_listings'\)\.doc\(r\.id\)\.get\(\{ source: 'server' \}\)\)/.test(LA), '② 1,000개마다 서버에서 다시 읽어 맞는지 봄(그대로)');
    { const n = (SRC.match(/await commitBatches\(/g) || []).length; const n2 = (SRC.match(/await commitBatches\([^\n]*wgSkip/g) || []).length; ok(n >= 7 && n2 === 1, `② 다른 commitBatches 부르는 곳 ${n - n2}곳은 지킴이 그대로`, { n, n2 }); }

    console.log('③ lfaClaim — 한 번만 다시');
    const ca = SRC.indexOf('  const lfaRef = () =>'), cb = SRC.indexOf('  async function lfrAuto()', ca); const CLAIM = SRC.slice(ca, cb).split('\n').filter((l) => /^  (const lfaRef|async function lfaClaim)|^    /.test(l)).join('\n');
    const claimWorld = (doc) => { const st = { doc: doc ? JSON.parse(JSON.stringify(doc)) : undefined };
      const ctx = { console, Date, String, Promise, Error, JSON, LFA: { TRY: 6, DOC: 'listfix_auto' }, PC_NAME: 'LOGGER', VER: '1.89.999', nowIso: () => '2026-11-18T05:00:00.000Z', C: () => ({ doc: (id) => ({ _id: id }) }),
        db: { runTransaction: async (fn) => fn({ get: async () => ({ data: () => st.doc }), set: (ref, v, o) => { st.doc = o && o.merge ? { ...(st.doc || {}), ...v } : v; } }) } };
      vm.createContext(ctx); vm.runInContext(CLAIM.replace(/^  const lfaRef/m, 'var lfaRef') + '\n;this.__C = lfaClaim;', ctx); return { st, claim: ctx.__C }; };
    const WERR = '쓰기 지킴이: 이미 있는 문서 200개를 새 문서로 적으려 해 멈춤';
    { const W = claimWorld({ state: 'error-apply', stage: '쓰기', run: '202611180942', err: WERR, tries: 1, cntfix: 'lfcount1 1.89.358', rows: 14658 }); const x = await W.claim();
      ok(x && W.st.doc.state === 'run' && W.st.doc.tries === 1 && W.st.doc.wgfix === 'restore1 1.89.999' && W.st.doc.wgfixRun === '202611180942' && W.st.doc.wgfixTries === 1, '③ 지킴이에 막힌 error-apply → 한 번 맡음 · wgfix 표시(판·지난 회차)', W.st.doc);
      ok(W.st.doc.prevErr === WERR && W.st.doc.err === '' && W.st.doc.cntfix === 'lfcount1 1.89.358' && W.st.doc.rows === 14658, '③ 지난 까닭은 prevErr로(지우지 않음) · 다른 칸 그대로', W.st.doc);
      W.st.doc.state = 'error-apply'; W.st.doc.err = WERR; const y = await W.claim(); ok(y === null && W.st.doc.state === 'error-apply', '③ 다시 지킴이에 막혀도 wgfix가 있으면 또 하지 않음(한 번만)', W.st.doc); }
    { const W = claimWorld({ state: 'error-apply', err: '쓴 값 확인이 어긋남(aladin_U1 firstSeenAt)', tries: 1 }); const x = await W.claim(); ok(x === null && !W.st.doc.wgfix, '③ 다른 까닭의 error-apply는 그대로 막음', W.st.doc); }
    for (const s of ['done', 'held']) { const W = claimWorld({ state: s, err: WERR, tries: 1 }); const x = await W.claim(); ok(x === null && W.st.doc.state === s && !W.st.doc.wgfix, `③ ${s}는 그대로 다시 안 함`, W.st.doc); }
    { const W = claimWorld({ state: 'error-apply', err: WERR, tries: 1, stop: true }); const x = await W.claim(); ok(x === null && !W.st.doc.wgfix, '③ stop === true는 그대로 지킴', W.st.doc); }

    console.log('④ lfrAuto — PC 기억');
    const LA2 = cut('  async function lfrAuto()', '  if (PUBONLY) { setTimeout(() => lfrAuto()');
    ok(/const gd = GM_getValue\('rn-lfa-done', ''\); const gw = gd === 'error-apply' && !GM_getValue\('rn-lfa-wgfix', ''\); if \(gd && !gw\) return;/.test(LA2), "④ 기억이 'error-apply'면 한 번만 더 봄 · done·held는 그대로 멈춤");
    ok(/if \(gw && \/\^\(done\|held\|error-apply\)\$\/\.test\(st\)\) GM_setValue\('rn-lfa-wgfix', nowIso\(\)\); return; \}\n    if \(gw\) GM_setValue\('rn-lfa-wgfix', nowIso\(\)\);/.test(LA2), '④ 맡았거나 서버가 끝난 상태면 rn-lfa-wgfix를 적어 되풀이 안 함');
    ok(/catch \(e\) \{ await lfaSet\(\{ state: 'error-apply'/.test(LA2) && /GM_setValue\('rn-lfa-done', 'error-apply'\)/.test(LA2), '④ 쓰다 실패하면 예전처럼 error-apply로 멈춤');
    console.log('⑤ 앞 페이지 올리기 삭제 대조(fbrev1 §10)');
    { const RD = cut('  async function regDelCmd(', '\n  }\n'); const L = (RD.split('\n').find((l) => /^        if \(it\.bump\) \{/.test(l)) || '');
      const iL = RD.indexOf(L), iW = RD.indexOf("if (w.length) { refuse(it, '샵매니저 줄이 고른 상품과 다름: '"), iP = RD.indexOf("fn: 'stockstatusbulkchg'");
      ok(L && iL > 0 && iL < iW && iW < iP, '⑤ 대조 줄이 거절 판단(w) 앞 · 알라딘에 지우기를 보내기 전', { iL, iW, iP });
      const run = (it, code, rq) => { const ctx = { it, s: { code }, r: { qty: rq }, w: [], REG_ST: { 1: '판매중', 3: '일시판매중지', 15: '판매중지', 41: '판매대기', 18: '판매완료', 16: '판매금지' } }; vm.createContext(ctx); vm.runInContext(L, ctx); return ctx.w; };
      ok(run({ bump: 'b1', qty: 1 }, 1, 1).length === 0, '⑤ 판매중 · 수량 1 그대로 → 지움 허락');
      ok(/판매중이 아님\(일시판매중지\)/.test(run({ bump: 'b1', qty: 1 }, 3, 1).join()), '⑤ 판매중이 아니면(일시판매중지) 거절');
      ok(/판매중이 아님\(판매대기\)/.test(run({ bump: 'b1', qty: 1 }, 41, 1).join()), '⑤ 판매대기도 거절');
      ok(/수량이 맡길 때\(1\)와 다름\(0\)/.test(run({ bump: 'b1', qty: 1 }, 1, 0).join()), '⑤ 그사이 수량이 바뀌면(팔렸을 수 있음) 거절');
      ok(run({ bump: 'b1', qty: 1 }, 1, null).length === 0, '⑤ 목록에 수량 칸이 없으면 수량 대조는 건너뜀(판매중 대조는 그대로)');
      ok(run({ qty: 1 }, 3, 0).length === 0, '⑤ 앞 페이지 올리기가 아닌 삭제(수동 일괄 등)는 예전 그대로'); }
    let base = null; try { base = cp.execFileSync('git', ['show', 'origin/main:src/readnow-collector.src.js'], { cwd: R, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
    if (base) { const hd = (t) => t.slice(0, t.indexOf('// ==/UserScript==')).split('\n').filter((l) => /^\/\/ @/.test(l) && !/^\/\/ @(version|require\s+https:\/\/readnow\.kr\/)/.test(l)).join('\n'); ok(hd(SRC) === hd(base), '④ 수집기 머리(@match·@grant·@connect·바깥 @require)가 origin/main과 같음'); }
    else console.log('  · origin/main을 못 읽어 머리 비교는 건너뜀');
  } catch (e) { bad++; console.log('  ❌ 시험이 멈춤: ' + (e.stack || e)); }
  console.log(bad ? `❌ tRESTORE1118 실패 ${bad}` : '✅ tRESTORE1118 모두 통과'); process.exit(bad ? 1 : 0);
})();
