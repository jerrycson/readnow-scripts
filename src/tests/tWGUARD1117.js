// tWGUARD1117 — (11/17 일꾼 wguard1 · 🚨 자료 · 헌장 제7조) 수집기 쓰기 지킴이 · 브라우저 필요 없음
//  사고: 11/17 12:37 HOME이 상품 기록 26,710건 중 11,999건만 받은 채 상품 조회가 14,686개를 새 상품으로 보고 처음 본 날·등록일·수량을 덮어 적음
//  읽는 쪽 안전띠(listfix1)와 따로, 쓰는 마지막 자리(commitBatches)에서 막는지 봄
//  ① 사고 다시 돌리기 — 비어 있는 상품 지도로 listingOps 100개 → 서버에 이미 있음 100개 → 멈춤 · 서버 자료 한 글자도 안 바뀜 · prd_system/wguard에 까닭
//  ② 문턱 아래(이미 있음 10 · 새것 5) — 이미 있는 것은 처음 본 날·연도 추정 등록일·수량을 빼고(목록 숫자는 qtyList) · 새것은 그대로
//  ③ 서버 답이 PC 안 사본이면 아무것도 올리지 않음 · ④ 합치기 없는 통째 쓰기가 이미 있는 문서면 합치기로 바꿔 다른 칸을 지우지 않음
//  ⑤ 1시간 누적 문턱(30+30 → 두 번째에서 멈춤) · ⑥ 허락(allowUntil)이면 멈추지 않고 처음 값만 뺌 · ⑦ 처음 값이 없는 쓰기는 서버를 읽지 않음
//  ⑧ 사라짐 표시 — 서버에서 다시 봄(이미 꺼짐·이번 회차에 보임·없음 뺌) · 한 번에 max(300, 판매 중 5%) 넘으면 표시 안 함 · 허락이면 표시
//  ⑩ 웹앱 폐기·반품 가져오기 — 서버 답만(기기 기억이면 멈춤) · 합치기로 적음
//  ⑨ 원본 자리 — commitBatches가 지킴이를 거침 · 사라짐 표시가 30% 안전장치 뒤에 지킴이를 부름 · 예치금·매입 기록 읽기가 서버 답만
// 실행: node src/tests/tWGUARD1117.js · 시험 자료는 모두 지어낸 값
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const cut = (a0, b0) => { const a = SRC.indexOf(a0); const b = SRC.indexOf(b0, a + 1); return a > 0 && b > a ? SRC.slice(a, b) : ''; };
const BLK = cut('/* ⟦wguard1 쓰기 지킴이⟧', '  const qHash = ');
const LOPS = cut('  const stabJ = ', '  /* ───────── 파일 가져오기');
ok(BLK.length > 3000 && /async function wgGuard\(/.test(BLK) && /async function commitBatches\(/.test(BLK) && /async function wgGoneCheck\(/.test(BLK), '쓰기 지킴이 묶음(wgGuard·commitBatches·wgGoneCheck) 떼어 냄');
ok(/function listingOps\(/.test(LOPS), 'listingOps 떼어 냄');

function mk(opt = {}) {
  const store = new Map(Object.entries(opt.store || {})); const st = { reads: 0, nonServer: 0, commits: 0, logs: [] };
  const col = (name) => { const c = { id: name, path: name,
    doc(id) { if (id == null) id = 'auto_' + Math.random().toString(36).slice(2, 10); return { id, path: name + '/' + id, parent: c,
      get: async (o) => { st.reads++; if (!o || o.source !== 'server') st.nonServer++; const v = store.get(name + '/' + id); return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined), metadata: { fromCache: false } }; } }; },
    where(f, op, ids) { return { get: async (o) => { st.reads += ids.length; if (!o || o.source !== 'server') st.nonServer++; if (opt.cache) return { size: 0, docs: [], metadata: { fromCache: true }, forEach() {} };
      const docs = ids.filter((id) => store.has(name + '/' + id)).map((id) => ({ id, ref: { path: name + '/' + id }, data: () => JSON.parse(JSON.stringify(store.get(name + '/' + id))) }));
      return { size: docs.length, docs, metadata: { fromCache: false }, forEach: (fn) => docs.forEach(fn) }; } }; } }; return c; };
  const C = (n) => col(n);
  const apply = (p, v, merge) => { const cur = merge ? { ...(store.get(p) || {}) } : {}; for (const [k, x] of Object.entries(v)) { if (x && x.inc != null) cur[k] = (+cur[k] || 0) + x.inc; else if (x && x.arrU) cur[k] = [...(cur[k] || []), ...x.arrU]; else cur[k] = x; } store.set(p, cur); };
  const db = { batch() { const q = []; return { set(ref, v, o) { q.push(['set', ref, v, o]); }, update(ref, v) { q.push(['update', ref, v]); }, delete(ref) { q.push(['delete', ref]); }, async commit() { st.commits++; for (const [k, ref, v, o] of q) { if (k === 'set') apply(ref.path, v, !!(o && (o.merge || o.mergeFields))); else if (k === 'update') apply(ref.path, v, true); else store.delete(ref.path); } } }; } };
  // prd_system/wguard 문서는 시험에서 바로 씀(자기 것이라 지킴이를 거치지 않음)
  const firebase = { firestore: { FieldPath: { documentId: () => '__id__' }, FieldValue: { increment: (n) => ({ inc: n }), arrayUnion: (...a) => ({ arrU: a }) } } };
  const sbC = (n) => { const c = col(n); const d0 = c.doc.bind(c); c.doc = (id) => { const r = d0(id); r.set = async (v, o) => apply(r.path, v, !!(o && o.merge)); return r; }; return c; };
  const sb = { C: sbC, db, firebase, log: (m) => st.logs.push(String(m)), ui: () => {}, nowIso: () => new Date().toISOString(), PC_NAME: 'TESTPC', PUBONLY: false /* 1.89.348 listfix 자동 복구 줄이 떼어 낸 묶음 안에 있음 */, W: () => ({ writer: 'TESTPC' }), MW: () => ({ markAt: 1 }), Date, JSON, Math, Object, Map, Set, Array, String, Number, Error, Promise, console,
    P: { diff: (prev, next, F) => { const o = {}; for (const f of F) if (next[f] != null && (!prev || JSON.stringify(prev[f]) !== JSON.stringify(next[f]))) o[f] = { from: prev ? prev[f] ?? null : null, to: next[f] }; return o; }, mediaType: () => ({ type: 'book', why: 'test' }) } };
  vm.createContext(sb);
  vm.runInContext(`let LISTINGS = new Map();\n${BLK}\n${LOPS}\n;this.api = { commitBatches, wgGuard, wgGoneCheck, wgFix, listingOps, WG, get L() { return LISTINGS; }, set L(v) { LISTINGS = v; } };`, sb);
  sb.api.__col = col; return { A: sb.api, st, store };
}
const oldDoc = (i) => ({ channel: 'aladin', usedCode: 'U' + i, listingId: String(1000 + i), firstSeenAt: '2025-03-01T00:00:00.000Z', registeredAt: '2023-05-0' + ((i % 9) + 1), qty: 3, status: '판매중', active: true, price: 5000, memo: '사람이 적은 메모 ' + i });
const storeOf = (n, from = 0) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`prd_listings/aladin_U${from + i}`, oldDoc(from + i)]));

(async () => {
  console.log('① 11/17 사고 다시 돌리기 — 덜 받은 상품 지도(빈 지도)로 상품 조회 한 쪽(100개)');
  { const S = storeOf(100); const { A, st, store } = mk({ store: S }); const before = JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_listings/')));
    A.L = new Map(); const seenAt = '2026-11-17T12:41:00.000Z'; let ops = [];
    for (let i = 0; i < 100; i++) ops = ops.concat(A.listingOps({ usedCode: 'U' + i, listingId: String(1000 + i), title: '책 ' + i, status: '판매중', qty: 1, price: 5000, registeredAt: '2026-05-0' + ((i % 9) + 1), registeredYearGuessed: true }, 'scm', seenAt).ops);
    let err = null; try { await A.commitBatches(ops); } catch (e) { err = e; }
    ok(err && /쓰기 지킴이/.test(err.message), '멈춤(오류로 그 묶음을 올리지 않음)', err && err.message);
    ok(st.commits === 0, '올린 묶음 0', st.commits);
    ok(JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_listings/'))) === before, '서버 상품 기록 한 글자도 안 바뀜(처음 본 날·등록일·수량·사람 메모 그대로)');
    const g = store.get('prd_system/wguard') || {}; ok(g.stop && g.stop.dup === 100 && g.stop.cut && g.stop.cut.firstSeenAt === 100 && g.stop.sample.length === 5, 'prd_system/wguard에 멈춘 까닭(100개 · 처음 본 날 100 · 예 5개)', g);
    ok(st.nonServer === 0, '확인 읽기는 서버 답만', st.nonServer); ok(st.logs.some((l) => /쓰기 지킴이 멈춤/.test(l)), '기록 줄에 멈춤 알림'); }

  console.log('② 문턱 아래 — 이미 있음 10 · 새것 5');
  { const { A, store } = mk({ store: storeOf(10) }); A.L = new Map(); const seenAt = '2026-11-17T13:00:00.000Z'; let ops = [];
    for (let i = 0; i < 15; i++) ops = ops.concat(A.listingOps({ usedCode: 'U' + i, listingId: String(1000 + i), title: '책 ' + i, status: '판매중', qty: i < 10 ? 1 : 2, price: 6000, registeredAt: '2026-01-01', registeredYearGuessed: true }, 'scm', seenAt).ops);
    await A.commitBatches(ops); const a0 = store.get('prd_listings/aladin_U0'), a12 = store.get('prd_listings/aladin_U12');
    ok(a0.firstSeenAt === '2025-03-01T00:00:00.000Z' && a0.registeredAt === '2023-05-01' && a0.qty === 3 && !a0.registeredYearGuessed, '이미 있는 상품: 처음 본 날·등록일·수량 그대로', a0);
    ok(a0.qtyList === 1 && a0.price === 6000 && a0.memo === '사람이 적은 메모 0' && a0.lastSeenAt === seenAt, '목록 숫자는 qtyList로 · 지금 값(가격·마지막 봄)은 적음 · 메모 그대로', a0);
    ok(a12 && a12.firstSeenAt === seenAt && a12.qty === 2 && a12.registeredYearGuessed === true, '새 상품은 그대로 적음', a12);
    ok(A.L.get('aladin_U0') && A.L.get('aladin_U0').firstSeenAt === '2025-03-01T00:00:00.000Z', '상품 지도도 서버 내용으로 메움');
    ok(store.get('prd_system/wguard') && store.get('prd_system/wguard').fix.dup === 10 && !store.get('prd_system/wguard').stop, '고친 기록(fix)만 · 멈춤 없음'); }

  console.log('③ 서버 답이 PC 안 사본이면 아무것도 올리지 않음');
  { const { A, st, store } = mk({ store: storeOf(3), cache: true }); const P = storeRefParent(A, 'prd_listings'); let err = null;
    try { await A.commitBatches([0, 1, 2].map((i) => (b) => b.set(P.doc('aladin_U' + i), { firstSeenAt: 'NEW' }, { merge: true }))); } catch (e) { err = e; }
    ok(err && /PC 안 사본/.test(err.message), '사본이면 멈춤', err && err.message); ok(st.commits === 0 && store.get('prd_listings/aladin_U0').firstSeenAt === '2025-03-01T00:00:00.000Z', '아무것도 안 바뀜'); }

  console.log('④ 합치기 없는 통째 쓰기가 이미 있는 문서면 합치기로');
  { const { A, store } = mk({ store: { 'acc_deposit/d1': { date: '2026-11-01', add: 100, firstSeenAt: '2026-11-01T01:00:00Z', note: '사람 메모' } } });
    const P = storeRefParent(A, 'acc_deposit'); await A.commitBatches([(b) => b.set(P.doc('d1'), { date: '2026-11-01', add: 100, firstSeenAt: '2026-11-17T12:00:00Z' }), (b) => b.set(P.doc('d2'), { date: '2026-11-17', add: 5, firstSeenAt: '2026-11-17T12:00:00Z' })]);
    const d1 = store.get('acc_deposit/d1'); ok(d1.firstSeenAt === '2026-11-01T01:00:00Z' && d1.note === '사람 메모', '이미 있는 줄: 처음 본 날·사람 메모 그대로(통째로 지우지 않음)', d1);
    ok(store.get('acc_deposit/d2') && store.get('acc_deposit/d2').firstSeenAt === '2026-11-17T12:00:00Z', '새 줄은 그대로'); }

  console.log('⑤ 1시간 누적 문턱 — 30 + 30');
  { const { A, st, store } = mk({ store: storeOf(60) }); const P = storeRefParent(A, 'prd_listings'); const mkOps = (a, b0) => Array.from({ length: b0 - a }, (_, j) => (b) => b.set(P.doc('aladin_U' + (a + j)), { firstSeenAt: 'NEW', status: '판매중' }, { merge: true }));
    await A.commitBatches(mkOps(0, 30)); ok(st.commits === 1, '첫 30개는 처음 값만 빼고 올림');
    let err = null; try { await A.commitBatches(mkOps(30, 60)); } catch (e) { err = e; } ok(err && st.commits === 1, '누적 60개(문턱 50) → 두 번째 묶음에서 멈춤', err && err.message);
    ok([...store.entries()].filter(([k]) => k.startsWith('prd_listings/')).every(([, v]) => v.firstSeenAt === '2025-03-01T00:00:00.000Z'), '어느 쪽도 처음 본 날 안 바뀜'); }

  console.log('⑥ 허락(allowUntil)이면 멈추지 않고 처음 값만 뺌');
  { const { A, st, store } = mk({ store: { ...storeOf(80), 'prd_system/wguard': { allowUntil: new Date(Date.now() + 3600e3).toISOString() } } }); const P = storeRefParent(A, 'prd_listings');
    await A.commitBatches(Array.from({ length: 80 }, (_, j) => (b) => b.set(P.doc('aladin_U' + j), { firstSeenAt: 'NEW', status: '판매중' }, { merge: true })));
    ok(st.commits === 1 && store.get('prd_listings/aladin_U5').firstSeenAt === '2025-03-01T00:00:00.000Z' && store.get('prd_listings/aladin_U5').status === '판매중', '올렸고 처음 본 날 그대로'); }
  { const { A, st } = mk({ store: { ...storeOf(80), 'prd_system/wguard': { allowUntil: '2020-01-01T00:00:00Z' } } }); const P = storeRefParent(A, 'prd_listings'); let err = null;
    try { await A.commitBatches(Array.from({ length: 80 }, (_, j) => (b) => b.set(P.doc('aladin_U' + j), { firstSeenAt: 'NEW' }, { merge: true }))); } catch (e) { err = e; } ok(err && st.commits === 0, '지난 허락은 소용없음(멈춤)'); }

  console.log('⑦ 처음 값이 없는 쓰기는 서버를 읽지 않음(읽기 비용 0)');
  { const { A, st } = mk({ store: storeOf(5) }); const P = storeRefParent(A, 'prd_listings');
    await A.commitBatches([(b) => b.set(P.doc('aladin_U1'), { lastSeenAt: 'x' }, { merge: true }), (b) => b.update(P.doc('aladin_U2'), { price: 1 }), (b) => b.delete(P.doc('aladin_U3'))]);
    ok(st.reads === 0 && st.commits === 1, '읽기 0 · 그대로 올림', st); }

  console.log('⑧ 사라짐 표시');
  { const S = storeOf(2000); S['prd_listings/aladin_U1'].active = false; S['prd_listings/aladin_U2'].seenBy_scm = '2026-11-17T07:00:00Z'; delete S['prd_listings/aladin_U3'];
    const { A, store } = mk({ store: S }); const gone = [0, 1, 2, 3, 4].map((i) => ['aladin_U' + i, {}]);
    const g = await A.wgGoneCheck(gone, 2000, '2026-11-17T06:30:00Z'); ok(JSON.stringify(g.map((x) => x[0])) === JSON.stringify(['aladin_U0', 'aladin_U4']), '이미 꺼짐·이번 회차에 보임·서버에 없음은 뺌', g.map((x) => x[0]));
    const big = Array.from({ length: 400 }, (_, i) => ['aladin_U' + (100 + i), {}]); const g2 = await A.wgGoneCheck(big, 2000, '2026-11-17T06:30:00Z');
    ok(g2.length === 0 && store.get('prd_system/wguard').goneStop.n === 400 && store.get('prd_system/wguard').goneStop.cap === 300, '400개 > 문턱 300(판매 중 2,000의 5% = 100보다 바닥 300) → 표시 안 함 + 기록', store.get('prd_system/wguard'));
    const g3 = await A.wgGoneCheck(big.slice(0, 250), 2000, '2026-11-17T06:30:00Z'); ok(g3.length === 250, '250개는 그대로 표시'); }
  { const { A } = mk({ store: { ...storeOf(12000), 'prd_system/wguard': { allowUntil: new Date(Date.now() + 3600e3).toISOString() } } }); const big = Array.from({ length: 700 }, (_, i) => ['aladin_U' + i, {}]);
    ok((await A.wgGoneCheck(big, 12000, '2026-11-17T06:30:00Z')).length === 700, '판매 중 12,000이면 문턱 600 · 허락이 있으면 700개도 표시'); }

  console.log('⑨ 원본 자리');
  { const cb = cut('async function commitBatches(', '  const LISTING_FIELDS'); ok(/wgRec\(calls\)/.test(cb) && /await wgGuard\(calls, label\)/.test(cb) && !/forEach\(\(f\) => f\(b\)\)/.test(cb), 'commitBatches가 지킴이를 거쳐 올림');
    const gb = cut("if (mode === 'full') { // 판매중 계열에서 사라진 상품", 'prog.stats.goneFromActive = gone.length;'); const i30 = gb.indexOf('activeN * 0.3'), iw = gb.indexOf('wgGoneCheck(gone'), ic = gb.indexOf('await commitBatches(gone.map');
    ok(i30 > 0 && iw > i30 && ic > iw, '사라짐 표시: 30% 안전장치 → 지킴이 → 올리기 차례', { i30, iw, ic });
    ok(/C\('acc_deposit'\)\.doc\(id\)\.get\(\{ source: 'server' \}\)/.test(SRC) && !/C\('acc_deposit'\)\.doc\(id\)\.get\(\)\.then\(\(d\) => d\.exists\)\.catch\(\(\) => false\)/.test(SRC), '예치금: 서버 답만 · 읽기 실패를 「없음」으로 보지 않음');
    ok(/C\('pur_buyback'\)\.get\(\{ source: 'server' \}\)/.test(SRC), '매입 기록: 서버 답만'); }
  console.log('⑩ 웹앱 가져오기(폐기·반품) — 서버 답만 · 합치기');
  { const APPF = [path.join(ROOT, 'src/app.html'), path.join(ROOT, 'app.html')].find((f) => fs.existsSync(f)); const APP = fs.readFileSync(APPF, 'utf8');
    ok(/parseDisposalSheet\(wb\); const ss = await db\.collection\('pur_disposals'\)\.get\(\{ source: 'server' \}\); if \(ss\.metadata && ss\.metadata\.fromCache\) throw/.test(APP), '폐기 기록 가져오기: 기기 기억이면 멈춤');
    ok(/b\.set\(db\.collection\('pur_disposals'\)\.doc\(d\.id\), \{ \.\.\.d, \.\.\.who \}, \{ merge: true \}\)/.test(APP), '폐기 기록 가져오기: 합치기(지움 표시를 덮지 않음)');
    ok(/collection\('crm_returns'\)\.get\(\{ source: 'server' \}\); if \(ss\.metadata && ss\.metadata\.fromCache\) return/.test(APP), '반품 기록 가져오기: 기기 기억이면 멈춤');
    ok(/b\.set\(db\.collection\('crm_returns'\)\.doc\(r\.id\), \{ \.\.\.r, importedBy: S\.user\.email, importedAt: TS\(\), fileName: file\.name \}, \{ merge: true \}\)/.test(APP), '반품 기록 가져오기: 합치기'); }

  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });

function storeRefParent(A, name = 'prd_listings') { return A.__col(name); }
