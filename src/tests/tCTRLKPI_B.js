/* tCTRLKPI_B — (일꾼 kpib1 판 B · 정범님 I-1119-2051-30·2056-31 · 설계 readnow-chats reports/CTRLKPI1_1119.md 2·3장) 🎛 관제소 날마다 요약
 *  cloud/index.js CTRLKPI-START~CTRLKPI-END를 떼어 가짜 Firestore로 돌림:
 *   ① 유효 최저가 = 공용 evalSale과 같은 답(동급 + 더 좋은 등급 · 유효 판매자만 · 같은 값도 넣음 ≤ · lowLt는 더 쌀 때만 · 모름 U · 견줄 것 없음 X)
 *   ② 얻음·잃음 항등식(어제 + 얻음 − 잃음 = 오늘) · 까닭(sold·gone·unk·up·under · none · new·read·mkt) · 첫날(어제 없음)은 null
 *   ③ 묶음 정규화가 웹 bkfNorm(app.html)과 같음 · 묶음 구성원 겹침은 한 번만 · 보관 그룹 뺌
 *   ④ 목록 1500개 자름 + cut · 그날 칸은 통째로 바꾸고 다른 날 칸은 그대로 · 달이 바뀌면 어제 판매는 지난달 문서에
 *   ⑤ dry는 쓰지 않음 · 판매자 분류 파일이 없으면 low 칸 null · mlDaily는 꺼짐이면 건너뛰고 요약이 실패해도 끝남
 *   ⑥ 규칙 글(ctl_kpi_m·ctl_kpi_days 쓰기 막힘)
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tCTRLKPI_B.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('파일 없음 ' + rel); };
const SRC = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const ML = require(findUp('readnow-ml-core.js'));
const APP = fs.readFileSync(findUp('src/app.html'), 'utf8');
const cut = (s, e) => { const a = SRC.indexOf(s), b = SRC.indexOf(e); if (!(a > 0 && b > a)) throw new Error('구역 없음 ' + s); return SRC.slice(SRC.indexOf('*/', a) + 2, b); };

/* 가짜 Firestore — where(==·>=)·select·count·doc·getAll(끝 옵션 무시)·batch(set merge·mergeFields(FieldPath)) */
class FieldPath { constructor(...s) { this.segs = s; } }
function fakeDb() { const store = new Map(); const writes = []; const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const snap = (col, id) => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => clone(v), get: (k) => (v || {})[k] }; };
  const docRef = (col, id) => ({ _col: col, id, get: async () => snap(col, id) });
  const getP = (o, segs) => segs.reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, segs, v) => { let c = o; segs.slice(0, -1).forEach((k) => { if (!c[k] || typeof c[k] !== 'object') c[k] = {}; c = c[k]; }); c[segs[segs.length - 1]] = clone(v); };
  const deep = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? deep(o[k], v) : clone(v); return o; };
  const apply = (r, v, o) => { const p = r._col + '/' + r.id; writes.push(p); const cur = clone(store.get(p)); if (o && o.mergeFields) { const n = cur || {}; for (const f of o.mergeFields) { const segs = f instanceof FieldPath ? f.segs : String(f).split('.'); setP(n, segs, getP(v, segs)); } store.set(p, n); } else if (o && o.merge) store.set(p, deep(cur, v)); else store.set(p, clone(v)); };
  const query = (col, W) => ({ where: (k, op, v) => query(col, [...W, [k, op, v]]), select: () => query(col, W),
    count: () => ({ get: async () => { const n = (await query(col, W).get()).size; return { data: () => ({ count: n }) }; } }),
    get: async () => { const L = []; for (const [p, v] of store) { const i = p.indexOf('/'); if (p.slice(0, i) !== col || p.slice(i + 1).includes('/')) continue; if (W.every(([k, op, x]) => (op === '==' ? v[k] === x : op === '>=' ? v[k] >= x : true))) L.push(snap(col, p.slice(i + 1))); } return { size: L.length, docs: L, forEach: (f) => L.forEach(f) }; } });
  const C = (col) => Object.assign(query(col, []), { doc: (id) => docRef(col, id) });
  const db = { collection: C, getAll: async (...a) => a.filter((r) => r && r._col).map((r) => snap(r._col, r.id)), batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), update: () => { throw new Error('update 안 씀'); }, commit: async () => ops.forEach(([r, v, o]) => apply(r, v, o)) }; } };
  return { db, C, store, writes, put: (p, v) => store.set(p, clone(v)), get: (p) => clone(store.get(p)) }; }

const BLOCK = cut('/* CTRLKPI-START', '/* CTRLKPI-END */');
const mk = (env) => new Function('require', 'db', 'C', 'FieldPath', 'W', 'nowIso', 'shard', 'mlMod', 'mlSales', 'mlLoadCols', 'nodeCls', 'kday', 'mlSnapshot',
  BLOCK + '\nreturn { ctrlKpiDay, ctrlKpiMove, kpiFoldsNorm, kpiVLow, kpiTopSt, ctrlKpiDry, kpiPrevDay, KPI_CUT };')(
  require, env.db, env.C, FieldPath, () => ({ uploadedAt: 'TS', writer: 'cloud', writerSchema: 6 }), () => '2026-11-20T01:05:00.000Z', (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; },
  async () => ML, env.mlSales || (async () => new Map()), env.mlLoadCols || (async () => null), env.nodeCls || (async () => NCLS), (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10), env.mlSnapshot || (async () => ({})));
const NCLS = { RNC: { classifySellerDoc: (d) => ({ cls: d.cls }) }, RS: {}, PRC: { isAladinSide: (r) => String(r.sellerCode) === 'ALD' } };
const ours = (p, g) => ({ price: p, grade: g, sellerCode: '996008', sellerName: '우리' });
const row = (p, g, sc, so) => ({ price: p, grade: g, sellerCode: sc, sellerName: '판매자' + sc, ...(so ? { soldOut: true } : {}) });
const P1A = [ours(5000, '상'), row(6000, '상', 'S1'), row(5500, '최상', 'S2'), row(3000, '상', 'S3'), row(7000, '균일', 'ALD'), row(2000, '상', 'S1', 1)];

function scene(env) { const { put } = env;
  ['S1:green', 'S2:dkgreen', 'S3:red', 'S4:yellow'].forEach((x) => { const [c, k] = x.split(':'); put('sellers/sc_' + c, { cls: k }); });
  put('px_exp/a', { on: true }); put('px_exp/b', { on: true }); put('px_exp/c', { on: false });
  put('prd_locks/aladin_1', { on: true, lid: '1' }); put('prd_locks/x1', { on: true, lid: '1' }); put('prd_locks/aladin_2', { on: true, mode: 'cond', lid: '2' }); put('prd_locks/aladin_3', { on: false, lid: '3' });
  put('prd_price_batches/g1', { name: '그룹1', lastKeys: ['aladin_101', 'aladin_102'] }); put('prd_price_batches/g2', { name: '그룹2', lastKeys: ['aladin_102', 'aladin_103'] });
  put('prd_price_batches/g3', { name: '보관', archived: true, lastKeys: ['aladin_104'] }); put('prd_price_batches/g4~s1', { lastKeys: ['aladin_105'] }); put('prd_price_batches/g5', { viewOnly: true, lastKeys: ['aladin_106'] });
  put('prd_price_batches/_bkfold', { folds: { f1: { name: '묶음1', gids: ['g1', 'g2', 'g3'] }, f2: { name: '묶음2', gids: ['g2', 'gX'], archived: true } }, order: ['f:f2', 'f:f1', 'g1'] });
  put('ctl_kpi_days/2026-11-19', { day: '2026-11-19', lowS: '101,103,104,109' });
  put('ctl_kpi_m/2026-11', { ym: '2026-11', d: { '05': { T: { n: 9 } }, 20: { junk: 1, T: { n: -1 } } } }); }
const L = [{ id: 'aladin_101', bookId: 'b1', price: 5000, grade: '상', usedCode: '101' }, { id: 'aladin_102', bookId: 'b2', price: 5500, grade: '상', usedCode: '102' }, { id: 'aladin_103', bookId: 'b3', price: 7000, grade: '중', usedCode: '103' },
  { id: 'aladin_104', bookId: 'b4', price: 4000, grade: '상', usedCode: '104' }, { id: 'aladin_105', bookId: 'b5', price: 3000, grade: '상', usedCode: '105' }, { id: 'aladin_106', bookId: 'b6', price: 3000, grade: '최상', usedCode: '106' }, { id: 'yes24_1', bookId: 'b1', price: 100, grade: '상' }];
const M = () => new Map([['b1', { usedFirstPage: P1A }], ['b2', { usedFirstPage: P1A.map((r) => (r.sellerCode === '996008' ? ours(5500, '상') : r)) }], ['b3', { usedFirstPage: [ours(7000, '중'), row(6000, '중', 'S1')] }],
  ['b4', { usedFirstPage: [ours(4000, '상'), row(3000, '상', 'S3'), row(3500, '상', 'S4')] }], ['b6', { usedFirstPage: [ours(3000, '최상'), row(2500, '최상', '777'), row(3000, '최상', 'ALD')] }]]);
const R = (key, price, p1, rank, top, o) => ({ key, price, p1, rank, top, sameMin: null, minAll: null, mkt: 1, act: null, actFrom: null, age: 10, ...(o || {}) });
const rows = () => [R('aladin_101', 5000, 6, 1, 1, { minAll: 3000 }), R('aladin_102', 5500, 6, 2, 0, { sameMin: 5500, minAll: 3000 }), R('aladin_103', 7000, 2, 2, 0, { minAll: 6000 }), R('aladin_104', 4000, 3, 2, 0, { sameMin: 3000, minAll: 3000, mkt: 9 }),
  R('aladin_105', 3000, 0, null, null), R('aladin_106', 3000, 3, 1, 1, { sameMin: 2500, minAll: 2500, age: 30 }), R('yes24_1', 100, 1, 1, 1)];
const prevRows = [{ key: 'aladin_101', price: 5000, top: 1, p1: 6, rank: 1 }, { key: 'aladin_102', price: 5000, top: 1, p1: 6, rank: 1 }, { key: 'aladin_107', price: 4000, top: 1, p1: 2, rank: 1 }, { key: 'aladin_108', price: 4000, top: 1, p1: 2, rank: 1 },
  { key: 'aladin_103', price: 7000, top: 1, p1: 2, rank: 1 }, { key: 'aladin_105', price: 3000, top: 1, p1: 2, rank: 1 }, { key: 'aladin_106', price: 3000, top: null, p1: 0, rank: null }, { key: 'aladin_104', price: 4000, top: 0, p1: 3, rank: 2 }, { key: 'yes24_1', price: 1, top: 1, p1: 1, rank: 1 }];
const y0 = Date.parse('2026-11-19T00:00:00+09:00');
const SALES = () => new Map([['108', [{ ono: 'o1', at: y0 + 10 * 36e5, price: 4000 }]], ['200', [{ ono: 'o2', at: y0 + 12 * 36e5, price: 3000 }, { ono: 'o3', at: y0 + 24.5 * 36e5, price: 9999 }]]]);

(async () => {
  console.log('① 유효 최저가(evalSale과 같은 답)');
  { const env = fakeDb(); scene(env); const K = mk(env); const SC = { S1: 'green', S2: 'dkgreen', S3: 'red', S4: 'yellow' }; const clsOf = (r) => (String(r.sellerCode) === 'ALD' ? 'aladin' : SC[r.sellerCode] || 'unknown'); const MM = M();
    const v = (id) => K.kpiVLow(ML, L.find((l) => l.id === id), MM.get(L.find((l) => l.id === id).bookId), clsOf);
    const a = v('aladin_101'); ok(a.st === 'Y' && a.v === 5500, '동급 유효 최저 6000보다 더 좋은 등급(최상) 5500이 싸면 그것 · 빨강 3000·품절 2000·알라딘측 균일(=중) 7000은 안 봄 · 5000 ≤ 5500 → 예', a);
    const b = v('aladin_102'); ok(b.st === 'Y' && b.v === 5500, '같은 값(5500 = 5500)도 유효 최저가에 넣음(≤ · 리드 결정 ②)', b);
    const c = v('aladin_103'); ok(c.st === 'N' && c.v === 6000, '동급 유효 6000보다 비쌈(7000) → 아님', c);
    const d = v('aladin_104'); ok(d.st === 'X' && d.v == null, '빨강·노랑 판매자만 있으면 견줄 것 없음(X) — evalSale이 노랑 무리로 내려가도 유효가 아니면 안 씀', d);
    const e = K.kpiVLow(ML, L[4], undefined, clsOf); ok(e.st === 'U', '첫 페이지를 못 읽은 상품은 모름(U)', e);
    const f = v('aladin_106'); ok(f.st === 'Y' && f.v === 3000, '모르는 판매자(문서 없음) 2500은 안 봄 · 알라딘측 최상 3000(유효) ≤', f);
    const mkRows = (l) => MM.get(l.bookId).usedFirstPage.map((r) => ({ p: r.price, g: r.grade, c: String(r.sellerCode) === '996008' ? 'ours' : clsOf(r), so: r.soldOut ? 1 : 0, sc: r.sellerCode, n: r.sellerName }));
    for (const id of ['aladin_101', 'aladin_103', 'aladin_106']) { const l = L.find((x) => x.id === id); const o = ML.evalSale({ p: l.price, g: l.grade, rows: mkRows(l) }); ok(o.tier === 'valid' && o.ref === v(id).v, `${id}: 공용 evalSale(우리 값 그대로)의 유효 기준값 ${o.ref}(${o.refKind}) = 요약의 유효 최저 ${v(id).v}`); }
    const g = K.kpiVLow(ML, { price: 0, grade: '상' }, MM.get('b1'), clsOf); ok(g.st === 'X', '우리 값이 없으면 X', g); }

  console.log('② 하루 요약(가짜 Firestore)');
  const env = fakeDb(); scene(env); let loaded = []; const env2 = { ...env, mlSales: async (iso) => { loaded.push(iso); return SALES(); }, mlLoadCols: async (day, want) => { loaded.push(day + ':' + want.join(',')); return day === '2026-11-19' ? prevRows : null; } };
  const K = mk(env2); const keep = { rows: rows(), M: M(), L, act: { n: 3, up: 1, dn: 2, byKind: { manual: 3 } } };
  const r = await K.ctrlKpiDay('2026-11-20', keep); const m = env.get('ctl_kpi_m/2026-11'); const dd = env.get('ctl_kpi_days/2026-11-20'); const E = m && m.d && m.d['20'];
  ok(r.ok && E && dd, '달 문서 그날 칸과 날 문서를 씀', r);
  ok(loaded[0] === new Date(y0).toISOString() && keep.sales instanceof Map, '판매 장부는 어제 0시(KST)부터 한 번 읽고 keep에 둠(관문 mlCheck가 다시 씀)', loaded);
  const T = E.T; ok(T.n === 6 && T.nM === 5 && T.nF === 4, `예스24 뺀 상품 6 · 시장 읽음 5 · 3일 안 4 (${T.n}·${T.nM}·${T.nF})`, T);
  ok(T.top === 2 && T.topU === 1 && T.tie === 0, `최상단 2(101·106) · 모름 1(105)`, T);
  ok(T.low === 3 && T.lowLt === 1 && T.lowN === 4 && T.lowX === 1, `유효 최저가 3(101·102·106) · 더 싸야만 1(101) · 견줄 수 있음 4 · 견줄 것 없음 1(104)`, T);
  ok(T.lowU === 1, '거르지 않은 동급 최저 이하(lowU · 하루 모습 sameMin 그대로) 1 — 102는 5500 = 5500이라 셈 · 104(4000 > 3000)·106(3000 > 2500)은 아님', T);
  ok(T.px === 2 && T.lk === 1 && T.lkc === 1, `가격 실험 켜짐 2 · 잠금 1(같은 상품 둘은 하나) · 조건 잠금 1`, T);
  const mT = E.mvT; ok(mT && 6 + mT.g - mT.l === T.top && mT.g === 1 && mT.l === 5 && mT.k === 1, `최상단 항등식 어제 6 + 얻음 ${mT && mT.g} − 잃음 ${mT && mT.l} = 오늘 ${T.top}`, mT);
  ok(mT.w.up === 1 && mT.w.gone === 1 && mT.w.sold === 1 && mT.w.under === 1 && mT.w.unk === 1 && mT.gw.read === 1, '최상단 잃음 까닭: 올림(102)·사라짐(107)·팔림(108 · 사라짐보다 먼저)·밀림(103)·모름(105) · 얻음: 어제 모름 → 읽힘(106)', mT);
  const mL = E.mvL; ok(mL && 4 + mL.g - mL.l === T.low && mL.g === 2 && mL.l === 3, `유효 최저 항등식 어제 4 + 얻음 ${mL && mL.g} − 잃음 ${mL && mL.l} = 오늘 ${T.low}`, mL);
  ok(mL.w.under === 1 && mL.w.none === 1 && mL.w.gone === 1 && mL.gw.mkt === 1 && mL.gw.read === 1, '유효 최저 잃음: 밀림(103)·견줄 것 없음(104)·사라짐(109) · 얻음: 시장 바뀜(102 · 값을 올렸는데도)·읽힘(106)', mL);
  ok(E.act && E.act.n === 3 && E.act.dn === 2, '그 전날 값 바꾼 수(act)를 그대로 담음', E.act);
  ok(dd.lowS === '101,102,106' && dd.src === 'ml_days' && dd.ver === 1, `오늘 유효 최저가 무리(lowS ${dd.lowS} · 알라딘 머리 뗌) · src ml_days`);
  ok(dd.mv.top.lost.includes('aladin_108|sold|4000|') && dd.mv.top.gain.includes('aladin_106|read|3000|2500') && dd.mv.low.lost.includes('aladin_103|under|7000|6000') && dd.mv.low.gain.includes('aladin_102|mkt|5500|5500'), '상품 하나씩 「열쇠|까닭|우리 값|견준 값」(최상단은 전체 최저 · 유효 최저는 유효 최저값 · 오늘 없는 상품은 어제 값)', dd.mv);
  ok(!JSON.stringify(dd).includes('yes24') && !JSON.stringify(E).includes('yes24'), '예스24 상품은 어디에도 없음');
  ok(m.d['05'] && m.d['05'].T.n === 9 && !('junk' in E) && E.T.n === 6, '그날 칸(20일)은 통째로 바꿈(옛 칸 junk 없음) · 다른 날(5일) 칸은 그대로', m.d);
  ok(m.d['19'] && m.d['19'].fl && m.d['19'].fl.sold === 2 && m.d['19'].fl.amt === 7000 && m.d['19'].fl.v === null, `어제 칸 fl: 어제 0~24시 판매 2건 7000원(오늘 0시 넘은 판매는 안 셈) · 조회 v는 null`, m.d['19']);
  ok(m.ym === '2026-11' && m.writer === 'cloud' && m.ver === 1, '달 문서 머리(ym·ver·writer)');
  console.log('③ 그룹·묶음(웹 bkfNorm과 같은 규칙)');
  ok(Object.keys(dd.G).sort().join() === 'g1,g2', '그룹: 보관(g3)·보기 전용(g5)·조각(~s)·밑줄(_bkfold) 뺌', Object.keys(dd.G));
  ok(dd.G.g1.n === 2 && dd.G.g1.top === 1 && dd.G.g1.low === 2 && dd.G.g1.age === 10 && dd.G.g2.l === 2 && dd.G.g2.lL === 1, '그룹별 수·최상단·유효 최저·평균 나이·잃음', dd.G);
  ok(E.F.f2 && E.F.f2.ng === 1 && E.F.f2.arch === 1 && E.F.f2.n === 2 && E.F.f1.ng === 1 && E.F.f1.n === 2 && E.F.f1.top === 1, '묶음: order 앞(f2)이 g2를 먼저 가짐 → f1은 g1만 · 없는 그룹(gX)·보관 그룹(g3) 뺌 · 보관 묶음은 arch 표시', E.F);
  { const a = APP.indexOf('function bkfNorm('), b = APP.indexOf('function bkfApply('); const web = new Function('BKF_JMAX', APP.slice(a, b) + '\nreturn bkfNorm;')(20);
    const docs = [env.get('prd_price_batches/_bkfold'), { folds: { a: { gids: ['g1', 'g1', 'f:x', '', 3, 'g2'] }, b: { gids: ['g2', 'g3'] }, c: 'x' }, order: ['f:b', 'f:zz', 'f:a'] }, null, { folds: { q: { gids: ['g9', 'g2'] } } }];
    const G = new Map([['g1', []], ['g2', []], ['g3', []]]);
    for (const d of docs) { const w = web(d, null).folds; const mine = K.kpiFoldsNorm(d, G); const W2 = Object.keys(w).map((f) => f + ':' + w[f].gids.filter((g) => G.has(g)).join('/')).join(' '); const M2 = [...mine].map(([f, x]) => f + ':' + x.gids.join('/')).join(' ');
      ok(W2 === M2, `웹 bkfNorm(살아 있는 그룹만 거름)과 같음: ${M2 || '(없음)'}`, { W2, M2 }); } }
  console.log('④ 1500개 자름·달 바뀜·다시 돌림');
  { const e3 = fakeDb(); scene(e3); const many = []; const LL = []; for (let i = 0; i < 1600; i++) { many.push(R('aladin_9' + i, 1000, 1, 1, 1)); LL.push({ id: 'aladin_9' + i, bookId: 'bx', price: 1000, grade: '상' }); }
    const K3 = mk({ ...e3, mlLoadCols: async () => [], mlSales: async () => new Map() }); const r3 = await K3.ctrlKpiDay('2026-11-20', { rows: many, M: new Map(), L: LL, act: null });
    const d3 = e3.get('ctl_kpi_days/2026-11-20'); ok(d3.mv.top.gain.length === 1500 && d3.cut.topGain === 100 && d3.cut.topLost === 0, `목록은 1500개까지 · 넘친 100은 cut.topGain (${d3.cut.topGain})`, d3.cut);
    const m3 = e3.get('ctl_kpi_m/2026-11').d['20']; ok(m3.mvT.g === 1600 && m3.T.lowN === 0 && m3.T.lowX === 0 && m3.T.low === 0, '셈(g)은 자르지 않음 · 시장 문서가 없으면 모름(견줄 수 있음·견줄 것 없음 어디에도 안 셈)', { mv: m3.mvT, T: m3.T }); }
  { const e4 = fakeDb(); scene(e4); e4.put('ctl_kpi_days/2026-11-30', { day: '2026-11-30', lowS: '' }); const y1 = Date.parse('2026-11-30T00:00:00+09:00');
    const K4 = mk({ ...e4, mlLoadCols: async () => null, mlSales: async () => new Map([['1', [{ ono: 'a', at: y1 + 36e5, price: 1500 }]]]) }); const r4 = await K4.ctrlKpiDay('2026-12-01', { rows: rows(), M: M(), L, act: null });
    const dec = e4.get('ctl_kpi_m/2026-12'), nov = e4.get('ctl_kpi_m/2026-11'); ok(dec && dec.d['01'] && !dec.d['30'] && nov.d['30'] && nov.d['30'].fl.sold === 1 && nov.d['30'].fl.amt === 1500 && nov.d['05'].T.n === 9, '달이 바뀌면 어제(11/30) 판매는 11월 문서 30일 칸에 · 11월 다른 칸 그대로', { dec: dec && Object.keys(dec.d), nov: nov && Object.keys(nov.d) });
    ok(r4.mvT === 'first' && dec.d['01'].mvT === null && dec.d['01'].mvL && dec.d['01'].mvL.g === 3, '어제 하루 모습이 없으면 최상단 얻음·잃음은 null(첫날) · 어제 lowS가 빈 글이어도 유효 최저는 셈', dec.d['01']); }
  { const e5 = fakeDb(); scene(e5); e5.store.delete('ctl_kpi_days/2026-11-19'); const K5 = mk({ ...e5, mlLoadCols: async () => prevRows, mlSales: async () => new Map() }); await K5.ctrlKpiDay('2026-11-20', { rows: rows(), M: M(), L, act: null });
    const E5 = e5.get('ctl_kpi_m/2026-11').d; ok(E5['20'].mvL === null && E5['20'].mvT && !(E5['19'] && E5['19'].fl), '어제 요약(날 문서)이 없으면 유효 최저 얻음·잃음 null · 어제 칸 fl도 안 씀', E5); }
  console.log('⑤ dry·분류 파일 없음·mlDaily');
  { const e6 = fakeDb(); scene(e6); const n0 = e6.writes.length; const K6 = mk({ ...e6, mlLoadCols: async () => prevRows, mlSales: async () => SALES() }); const r6 = await K6.ctrlKpiDay('2026-11-20', { rows: rows(), M: M(), L, act: null }, { dry: true });
    ok(r6.dry && r6.T.top === 2 && r6.bytes.m > 0 && r6.bytes.days > 0 && e6.writes.length === n0, `dry는 셈만(쓰기 0) · 문서 크기 ${r6.bytes.m}·${r6.bytes.days}글자`, r6);
    let snapCalls = 0; const K7 = mk({ ...e6, mlLoadCols: async () => prevRows, mlSales: async () => SALES(), mlSnapshot: async (day, keep) => { snapCalls++; Object.assign(keep, { rows: rows(), M: M(), L, act: null }); ok(keep.dry === true, 'dry 진단은 하루 모습도 쓰지 않게 keep.dry를 넘김'); return { n: 7, dry: true }; } });
    const r7 = await K7.ctrlKpiDry(); ok(snapCalls === 1 && r7.r && r7.r.dry && r7.heap && r7.heap.peakMB >= r7.heap.startMB && r7.heap.limitMB > 0 && e6.writes.length === n0, `진단 kpi=dry: 쓰기 0 · 힙 시작 ${r7.heap.startMB}MB 최고 ${r7.heap.peakMB}MB 한도 ${r7.heap.limitMB}MB`, r7.heap); }
  { const e8 = fakeDb(); scene(e8); const K8 = mk({ ...e8, nodeCls: async () => null, mlLoadCols: async () => prevRows, mlSales: async () => SALES() }); const r8 = await K8.ctrlKpiDay('2026-11-20', { rows: rows(), M: M(), L, act: null });
    const E8 = e8.get('ctl_kpi_m/2026-11').d['20'], D8 = e8.get('ctl_kpi_days/2026-11-20'); ok(E8.T.low === null && E8.T.lowN === null && E8.T.top === 2 && E8.mvL === null && D8.lowS === null && /판매자 분류/.test(E8.lowErr), '판매자 분류 파일을 못 받으면 유효 최저 칸은 null + lowErr(지어내지 않음) · 최상단은 그대로', E8); }
  { const a = SRC.indexOf('async function mlDaily()'); const b = SRC.indexOf('\n\n', a); const body = SRC.slice(a, b);
    ok(/try \{ kpi = await ctrlKpiDay\(today, keep\); \} catch \(e\) \{ kpi = \{ day: today, ok: false/.test(body) && /st\.kpiOn === true/.test(body), 'mlDaily: 켰을 때만 요약 · 요약은 try/catch 안');
    /* mlDaily는 ST.set을 씀 — 가짜 doc에 set을 붙임 */
    const run2 = async (st, kpiFn) => { const e = fakeDb(); e.put('app_settings/ml_state', st); const calls = []; const FakeDate = class extends Date { static now() { return Date.parse('2026-11-20T01:30:00+09:00'); } };
      const C2 = (n) => { const q = e.C(n); return Object.assign(q, { doc: (id) => { const r = e.C(n).doc(id); return { ...r, set: async (v) => e.put(n + '/' + id, { ...(e.get(n + '/' + id) || {}), ...v }) }; } }); };
      const f = new Function('C', 'FV', 'mlSnapshot', 'ctrlKpiDay', 'mlOutcomes', 'mlCheck', 'kpiPrevDay', 'ML_VER', 'nowIso', 'Date', body + '\nreturn mlDaily;')(C2, { arrayUnion: (...v) => v }, async (day, keep) => { calls.push('snap'); keep.rows = []; return { n: 0 }; }, async (day, keep) => { calls.push('kpi'); keep.sales = new Map([['x', []]]); return kpiFn(); }, async () => { calls.push('out'); return { n: 0 }; }, async (day, pre) => { calls.push('chk:' + day + ':' + (pre && pre.sales ? 'pre' : 'none')); return { day }; }, (d) => mk(fakeDb()).kpiPrevDay(d), 1, () => 'NOW', FakeDate);
      const out = await f(); return { calls, out, st: e.get('app_settings/ml_state') }; };
    const A = await run2({}, async () => ({ ok: true })); ok(!A.calls.includes('kpi') && A.out.kpi.off === true && A.st.kpi.off === true && A.st.lastDay === '2026-11-20' && A.calls.includes('chk:2026-11-19:none'), '꺼짐(기본): 요약 안 돎 · ml_state.kpi.off · 하루 모습·관문은 그대로(관문은 판매 장부를 스스로 읽음)', A);
    const B = await run2({ kpiOn: true }, async () => { throw new Error('일부러 실패'); }); ok(B.calls.join() === 'snap,kpi,out,chk:2026-11-19:pre' && B.st.kpi.ok === false && /일부러/.test(B.st.kpi.err) && B.st.lastDay === '2026-11-20', '켜짐 + 요약 실패: 결과 붙이기·관문까지 끝나고 lastDay 적힘 · ml_state.kpi에 까닭', B);
    const D = await run2({ kpiOn: true }, async () => ({ day: '2026-11-20', ok: true, n: 6 })); ok(D.st.kpi.ok === true && D.st.kpi.n === 6 && D.calls.includes('chk:2026-11-19:pre'), '켜짐 + 성공: ml_state.kpi 요약 · 관문은 요약이 읽은 판매 장부를 다시 씀(읽기 한 번)', D);
    const E9 = await run2({ kpiOn: true, lastDay: '2026-11-20' }, async () => ({ ok: true })); ok(E9.out.skip && !E9.calls.length, '오늘 이미 했으면 아무것도 안 함'); }
  console.log('⑥ 규칙·진단·건드리지 않은 것');
  { const RU = fs.readFileSync(findUp('firestore/firestore.rules'), 'utf8'); ok(/match \/ctl_kpi_m\/\{k\} \{\s*allow read: if staff\(\);\s*allow write: if false;/.test(RU) && /match \/ctl_kpi_days\/\{k\} \{\s*allow read: if staff\(\);\s*allow write: if false;/.test(RU) && /!\(request\.path\[3\] in \['prd_locks', 'ctl_kpi_m', 'ctl_kpi_days'\]\)/.test(RU), '규칙: 직원 읽기만 · 쓰기 막힘 · 나머지 쓰기 조건에서 뺌');
    ok(/if \(q\.kpi\) \{/.test(SRC) && /HV\('ctrlKpi', \(\) => ctrlKpiDry\(\)\)/.test(SRC) && /kpiOn: q\.kpi === 'on'/.test(SRC), '진단 kpi=dry(무거운 일 문으로 뒤에서)·kpi=on/off·kpi=2');
    const blk = SRC.slice(SRC.indexOf('/* CTRLKPI-START'), SRC.indexOf('/* CTRLKPI-END */')); const cols = [...blk.matchAll(/C\('([a-z_0-9]+)'\)/g)].map((x) => x[1]); const wr = [...blk.matchAll(/b\.set\(([^,]+),/g)].map((x) => x[1]);
    ok(cols.every((c) => ['sellers', 'prd_price_batches', 'ctl_kpi_days', 'px_exp', 'prd_locks', 'ctl_kpi_m'].includes(c)) && wr.every((w) => /mref|ctl_kpi_m|ctl_kpi_days/.test(w)), `요약은 읽기 ${[...new Set(cols)].join('·')} · 쓰기는 ctl_kpi_m·ctl_kpi_days뿐`, wr);
    ok(!/crm_orders|phone|addr|buyer|customer/i.test(blk), '요약 구역은 주문·손님 칸을 읽지 않음(판매 장부 mlSales의 상품 코드·값·때만)');
    { const mv = (fs.readFileSync(findUp('readnow-ml-core.js'), 'utf8').match(/const VERSION = '([0-9.]+)'/) || [])[1]; const cs = [path.resolve(__dirname, '..', 'readnow-collector.src.js'), path.resolve(__dirname, '..', '..', 'readnow-collector.user.js')].filter((x) => x && fs.existsSync(x)).map((x) => fs.readFileSync(x, 'utf8')); ok(!!mv && cs.length > 0 && cs.every((c) => c.includes('readnow-ml-core.js?v=' + mv)), `공용 학습 파일 판(${mv})과 수집기 @require 핀이 같음(이 일은 핀을 따로 바꾸지 않음 · buyp1 0.10.3에서 고정 판 대신 같은지로)`); } }
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && (e.stack || e.message)); process.exit(1); });
