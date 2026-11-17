// tLFR1117 — (11/17 일꾼 listfix1 · 🚨 자료) 덮인 상품 기록 되돌리기(로거 백업 파일 → 사고 전 값) · 브라우저 필요 없음
//  ① 백업 줄 모으기: 사고 뒤(uploadedAt ≥ T0) 판은 뺌 · 상품마다 사고 전 마지막 판 · 가장 이른 처음 본 때(11/08 사고 전)
//  ② 계획: 처음 본 때가 사고 시간인데 백업에 있는 상품만 · 처음 본 때·등록일·연도 추정 표시·수량(사고 뒤 다시 센 것은 그대로) · 상태·가격은 안 건드림 · 정말 새 상품(백업에 없음)은 그대로
//  ③ 마른 실행은 상품 기록을 쓰지 않음 · '복구'를 적어야 씀 · 이상하면(백업이 모자람·사고 직전 파일 빠짐) 멈춤
//  ④ 쓰기 전에 되돌림 자료를 먼저 남김(못 남기면 하나도 안 씀) · 바뀐 칸은 변경 기록에도 · 되돌림 파일로 원래대로
// 실행: node src/tests/tLFR1117.js · 시험 자료는 모두 지어낸 값
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.user.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const cut = (a0, b0) => { const a = SRC.indexOf(a0); const b = SRC.indexOf(b0, a + 1); return a > 0 && b > a ? SRC.slice(a, b) : ''; };
const BLK = cut('/* LFR-PURE-BEGIN */', '  /* ───────── 파일 가져오기');
ok(BLK.length > 3000 && /function lfrPlan\(/.test(BLK) && /async function listfixRestore\(/.test(BLK), '운영 되돌리기 묶음 떼어 냄');
const BKSER = (SRC.match(/const bkSer = [^\n]*?return o; };/) || [])[0]; ok(!!BKSER, '운영 백업 글자 바꾸기(bkSer) 떼어 냄');
ok(/runFiles\(\[\.\.\.e\.dataTransfer\.files\]\)/.test(SRC) && /async function runLfr\(/.test(SRC), '끌어다 놓은 파일 묶음이 되돌리기로 감');

const T0 = Date.parse('2026-11-17T03:37:00Z'); const iso = (ms) => new Date(ms).toISOString();
const OLD = Date.parse('2026-11-01T00:00:00Z'), INC = T0 - 10 * 3600e3, HIT = T0 + 20 * 60e3;
function world(opt) {
  opt = opt || {};
  const st = { writes: [], changes: [], undo: [], plan: null, logs: [], dl: [], prompts: [], qchk: [], undoFail: !!opt.undoFail };
  // 지금 서버 값: 상품 N개 — 앞 10개는 사고로 덮임, 그다음은 평범
  const N = opt.n || 2500; const docs = new Map();
  for (let i = 0; i < N; i++) { const id = 'aladin_U' + String(100000 + i); docs.set(id, { firstSeenAt: iso(OLD + i * 1000), registeredAt: '2025-03-0' + (i % 9 + 1), qty: 1, status: '판매중', active: true, listingId: 400000000 + i, price: 5000, uploadedAt: { toMillis: () => OLD } }); }
  const hitIds = [...docs.keys()].slice(0, 10);
  hitIds.forEach((id, j) => { const d = docs.get(id); d.firstSeenAt = iso(HIT + j); d.registeredAt = '2026-03-01'; d.registeredYearGuessed = true; d.qty = 5; d.status = j < 5 ? '판매중' : '판매완료'; d.active = j < 5; d.price = 7000; d.uploadedAt = { toMillis: () => HIT }; });
  docs.get(hitIds[3]).editChkAt = { toMillis: () => HIT + 3600e3 }; docs.get(hitIds[3]).qty = 2; // 사고 뒤 정보수정 화면으로 다시 셈 → 수량 그대로
  docs.set('aladin_U999999', { firstSeenAt: iso(HIT), qty: 1, status: '판매중', uploadedAt: { toMillis: () => HIT } }); // 정말 새 상품(백업에 없음)
  const snap = (arr) => ({ size: arr.length, docs: arr, metadata: { fromCache: false }, forEach: (f) => arr.forEach(f) });
  const D = (id) => ({ id, data: () => docs.get(id) });
  const C = (name) => { const q = { _w: null, _after: null, _lim: 0,
    where(f) { q._w = f; return q; }, orderBy() { return q; }, limit(n) { q._lim = n; return q; }, startAfter(d) { q._after = d; return q; },
    count() { return { get: async () => ({ data: () => ({ count: docs.size }) }) }; },
    doc(id) { return { _n: name, _id: id || 'auto' + Math.random(), get: async () => ({ data: () => (name === 'prd_listings' ? docs.get(id) : null) }),
      set: async (v, o) => { if (name === 'prd_system' && /^listfix_undo_/.test(id)) { if (st.undoFail) throw new Error('permission-denied'); st.undo.push([id, v]); } else if (name === 'prd_system' && id === 'listfix_plan') st.plan = { ...(st.plan || {}), ...v }; } }; },
    async get(o) { if (q._w === 'uploadedAt') return snap([]); const ids = [...docs.keys()].sort(); let s = q._after ? ids.indexOf(q._after.id) + 1 : 0; return snap(ids.slice(s, s + q._lim).map(D)); } }; return q; };
  const FV = { delete: () => ({ __fvdel: 1 }), serverTimestamp: () => ({ __sts: 1 }) };
  const firebase = { firestore: Object.assign(() => {}, { FieldValue: FV, FieldPath: { documentId: () => '__id__' }, Timestamp: { fromMillis: (ms) => ({ toMillis: () => ms }) } }) };
  const db = { batch: () => { const ops = []; return { set: (ref, v, o) => ops.push([ref, v, o]), commit: async () => { for (const [ref, v] of ops) { if (ref._n === 'prd_listings') { st.writes.push([ref._id, v]); const d = { ...(docs.get(ref._id) || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__fvdel) delete d[k]; else d[k] = x; } docs.set(ref._id, d); } else if (ref._n === 'prd_listing_changes') st.changes.push(v); } } }; } };
  const ctx = { console, JSON, Math, Date, Map, Set, Object, Array, String, Number, Promise, Error, Blob: function () {}, URL: { createObjectURL: () => 'blob:' }, TextDecoderStream: undefined, PUBONLY: false, setTimeout: () => 0, setInterval: () => 0,
    document: { createElement: () => ({ click() { st.dl.push(this.download); }, remove() {} }), body: { appendChild() {} } },
    firebase, db, C, LF_SRVN: 0, PC_NAME: 'TEST', stopFlag: false, prompt: (m) => { st.prompts.push(m); return opt.answer == null ? null : opt.answer; },
    nowIso: () => new Date().toISOString(), W: () => ({ uploadedAt: FV.serverTimestamp(), writer: 'TEST' }), ui() {}, sleep: async () => {}, log: (m) => st.logs.push(String(m)),
    lfSrvGet: async (q) => q.get({ source: 'server' }), lfSrvCount: async () => docs.size, lfShort: (n, srv) => (n < srv * 0.97 ? `서버 ${srv}건 중 ${n}건` : ''),
    qchkQueue: async (pairs, label, why) => { st.qchk.push({ pairs, label, why }); return { cmds: Math.ceil(pairs.length / 40), items: pairs.length }; },
    commitBatches: async (ops) => { for (let i = 0; i < ops.length; i += 400) { const b = db.batch(); ops.slice(i, i + 400).forEach((f) => f(b)); await b.commit(); } } };
  vm.createContext(ctx); vm.runInContext(BKSER + '\n' + BLK + '\n;globalThis.__X = { LFR, lfrNew, lfrFold, lfrPlan, lfrCheck, lfrDoc, lfrChanges, listfixRestore };', ctx);
  // 백업 줄: full(10/28) = 모든 상품의 옛 판 · inc = 사고 직전(마지막 판) · 사고 뒤 판(덮인 값 — 빼야 함)
  const L = [];
  for (const [id, d] of docs) { if (id === 'aladin_U999999') continue; const i = +id.slice(8) - 100000; L.push(JSON.stringify({ id, path: 'prd_listings/' + id, d: { firstSeenAt: iso(OLD + i * 1000 - (i < 3 ? 9 * 86400e3 : 0)), registeredAt: '2025-03-0' + (i % 9 + 1), qty: 1, status: '판매중', uploadedAt: { __ts: OLD } } })); }
  const inc = []; hitIds.forEach((id, j) => { const i = +id.slice(8) - 100000; inc.push(JSON.stringify({ id, path: 'prd_listings/' + id, d: { firstSeenAt: iso(OLD + i * 1000), registeredAt: '2025-03-0' + (i % 9 + 1), qty: j === 7 ? 3 : 1, status: '판매중', uploadedAt: { __ts: INC } } })); });
  const after = hitIds.map((id) => JSON.stringify({ id, path: 'prd_listings/' + id, d: { ...docs.get(id), uploadedAt: { __ts: HIT } } }));
  const F = (name, lines) => ({ name, text: async () => lines.join('\n') + '\n' });
  return { st, docs, hitIds, X: ctx.__X, ctx, files: [F('2026-10-28-full.jsonl', L), F('2026-11-17-inc.jsonl', inc), F('2026-11-18-inc.jsonl', after), F('note.txt', ['x'])] };
}

(async () => {
  // ① ② 순수 계산
  { const w = world(); const { X } = w; const B = X.lfrNew(); for (const f of w.files.slice(0, 3)) for (const ln of (await f.text()).split('\n')) X.lfrFold(B, ln);
    ok(B.after === 10 && B.m.size === 2500, '사고 뒤 판 10줄은 빼고 상품 2,500개를 모음', { after: B.after, n: B.m.size });
    const b7 = B.m.get(w.hitIds[7]); ok(b7.u === INC && b7.q === 3, '상품마다 사고 직전(inc) 판이 마지막 값', b7);
    ok(Date.parse(B.m.get(w.hitIds[0]).minF) < Date.parse(B.m.get(w.hitIds[0]).f), '가장 이른 처음 본 때(11/08 사고 전)를 따로 둠');
    const cur = new Map([...w.docs].map(([id, v]) => [id, { f: v.firstSeenAt, r: v.registeredAt, g: v.registeredYearGuessed, q: v.qty, ql: v.qtyList, ec: v.editChkAt }]));
    const P = X.lfrPlan(B, cur, 'last'); const n = P.n;
    ok(n.hit === 10 && n.noBk === 1 && P.rows.length === 10, '사고 때 새 상품으로 적힌 11개 중 백업에 있는 10개만 고침 · 정말 새 상품 1개는 그대로', n);
    ok(!P.rows.some((r) => r.id === 'aladin_U999999'), '백업에 없는 상품은 건드리지 않음');
    ok(n.f === 10 && n.r === 10 && n.g === 10, '처음 본 때·등록일·연도 추정 표시 10개씩', n);
    ok(n.q === 9 && n.qKeep === 1, '수량 9개 되돌림 · 사고 뒤 정보수정 화면으로 다시 센 1개는 그대로', n);
    const r7 = P.rows.find((r) => r.id === w.hitIds[7]); ok(r7.set.qty === 3 && r7.set.qtyList === 5 && r7.before.qty === 5 && r7.before.qtyList && r7.before.qtyList.__del === 1, '수량은 사고 전 값 · 목록 숫자는 qtyList로 · 없던 칸은 되돌림 때 지움 표시', r7);
    ok(P.rows.every((r) => !('status' in r.set) && !('price' in r.set) && !('active' in r.set) && !('lastSeenAt' in r.set)), '판매 상태·가격·판매 중 여부·마지막 본 때는 안 건드림');
    const r0 = P.rows.find((r) => r.id === w.hitIds[0]); ok(r0.set.registeredYearGuessed.__del === 1 && r0.before.registeredYearGuessed === true && r0.set.registeredAt === '2025-03-01', '연도 추정 표시는 지우고 등록일은 사고 전 값', r0);
    const PM = X.lfrPlan(B, cur, 'min'); ok(PM.n.older1108 === 3 && Date.parse(PM.rows.find((r) => r.id === w.hitIds[0]).set.firstSeenAt) < Date.parse(r0.set.firstSeenAt), "'복구1108'은 11/08 사고 전 처음 본 때까지(3개 더 이름)", PM.n);
    ok(X.lfrCheck(B, cur, P).length === 0, '정상 백업이면 이상 없음');
    const B2 = X.lfrNew(); for (const ln of (await w.files[0].text()).split('\n').slice(0, 1000)) X.lfrFold(B2, ln); ok(X.lfrCheck(B2, cur, P).some((x) => /90%/.test(x)), '백업 상품이 모자라면 이상(멈춤)');
    const B3 = X.lfrNew(); B3.m = B.m; B3.maxU = OLD; ok(X.lfrCheck(B3, cur, P).some((x) => /inc 파일이 빠짐/.test(x)), '사고 직전 inc 파일이 빠지면 이상(멈춤)');
    const d = X.lfrDoc({ a: { __del: 1 }, b: { __ts: 5 }, c: 'x' }, { delete: () => 'DEL' }, { fromMillis: (ms) => 'TS' + ms }); ok(d.a === 'DEL' && d.b === 'TS5' && d.c === 'x', '쓸 값 바꾸기(지움·시각)');
    const ch = X.lfrChanges(r7); ok(ch.qty.from === 5 && ch.qty.to === 3 && ch.qtyList.from === null, '변경 기록 {from,to}', ch); }

  // ③ 마른 실행 — 답이 없으면 하나도 안 씀
  { const w = world({ answer: null }); await w.X.listfixRestore(w.files);
    ok(w.st.writes.length === 0 && w.st.changes.length === 0 && w.st.undo.length === 0, '마른 실행: 상품 기록·변경 기록·되돌림 자료 모두 안 씀', { w: w.st.writes.length });
    ok(w.st.plan && w.st.plan.rows === 10 && w.st.plan.sample.length === 10 && w.st.dl.some((x) => /^listfix-plan-/.test(x)), '마른 실행: 요약(prd_system/listfix_plan)·계획 파일 내려받기', w.st.plan);
    ok(w.st.prompts.length === 1 && /'복구'/.test(w.st.prompts[0]), "사람에게 '복구'를 적어야 쓴다고 물음"); }
  { const w = world({ answer: '네' }); await w.X.listfixRestore(w.files); ok(w.st.writes.length === 0, "'복구'가 아닌 답이면 쓰지 않음"); }
  { const w = world({ answer: '복구' }); await w.X.listfixRestore(w.files.slice(1)); ok(w.st.writes.length === 0 && w.st.prompts.length === 0 && w.st.logs.some((x) => /full\.jsonl\)이 없음/.test(x)), 'full 파일 없이 놓으면 묻지도 않고 멈춤'); }
  { const w = world({ answer: '복구' }); await w.X.listfixRestore([w.files[0], w.files[2]]); ok(w.st.writes.length === 0 && w.st.logs.some((x) => /이상해서 멈춤/.test(x)), '사고 직전 inc 파일이 빠지면 쓰지 않고 멈춤'); }

  // ④ 실제 쓰기(시험 자리) — 되돌림 자료 먼저 · 바뀐 칸만 · 변경 기록 · 되돌림
  { const w = world({ answer: '복구' }); await w.X.listfixRestore(w.files);
    ok(w.st.undo.length === 1 && JSON.parse(w.st.undo[0][1].rows).length === 10, '되돌림 자료(지금 값) 10줄을 먼저 남김');
    ok(w.st.writes.length === 10 && w.st.changes.length === 10 && w.st.changes.every((c) => c.source === 'listfix1117'), '상품 10개 · 변경 기록 10줄(source listfix1117)');
    const d0 = w.docs.get(w.hitIds[0]); ok(d0.registeredYearGuessed === undefined && d0.registeredAt === '2025-03-01' && Date.parse(d0.firstSeenAt) < T0 && d0.status === '판매중' && d0.price === 7000, '덮인 칸은 사고 전 값 · 상태·가격은 사고 때 본 값 그대로', d0);
    ok(w.docs.get(w.hitIds[3]).qty === 2 && w.docs.get(w.hitIds[7]).qty === 3, '다시 센 수량은 그대로 · 아닌 것은 사고 전 수량');
    ok(w.docs.get('aladin_U999999').firstSeenAt === iso(HIT), '정말 새 상품은 그대로');
    ok(w.st.plan.applied && w.st.plan.applied.n === 10, '한 일을 prd_system/listfix_plan.applied에 남김');
    { const q = w.st.qchk; const ids = q.length === 1 ? q[0].pairs.map((p) => p[0]).sort() : []; const want = [0, 1, 2, 4].map((j) => w.hitIds[j]).sort();
      ok(q.length === 1 && JSON.stringify(ids) === JSON.stringify(want) && q[0].pairs.every((p) => /^4000000\d\d$/.test(p[1])), '수량을 되돌린 판매 중 상품만 수량 다시 세기 줄에 넣음(판매완료·사고 뒤 다시 센 것은 뺌)', q); }
    // 되돌림 파일로 원래대로
    const undoRows = JSON.parse(w.st.undo[0][1].rows); const st2 = w.st; st2.writes = []; w.ctx.prompt = () => '되돌리기';
    await w.X.listfixRestore([{ name: 'listfix-undo-x.json', text: async () => JSON.stringify({ kind: 'listfix-undo', source: 'listfix1117', rows: undoRows }) }]);
    const u0 = w.docs.get(w.hitIds[0]); ok(st2.writes.length === 10 && u0.registeredYearGuessed === true && u0.registeredAt === '2026-03-01' && u0.qty === 5, '되돌림 파일 → 쓰기 전 값으로 돌아감', u0); }
  { const w = world({ answer: '복구', undoFail: true }); let err = null; try { await w.X.listfixRestore(w.files); } catch (e) { err = e; } ok(err && w.st.writes.length === 0, '되돌림 자료를 못 남기면 상품 기록을 하나도 안 씀', { err: err && err.message, w: w.st.writes.length }); }

  console.log(bad ? `❌ tLFR1117 실패 ${bad}` : '✓ tLFR1117 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tLFR1117 오류', e && e.stack || e); process.exit(1); });
