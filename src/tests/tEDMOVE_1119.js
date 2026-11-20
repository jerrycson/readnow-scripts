// tEDMOVE_1119 — (recinh1 · 정범님 I-1118-2344-32 (다)) 🔖 판 옮김 한 권씩 — 새 판 확인 → 이음·물려받기 → 옛 상품 삭제
//  ① 맡기는 문(edMvGates): 같은 판 안 고름·판매중 아님·잠금·최근 주문·현금 판매·앞 페이지 올림 중·다른 판 옮김 진행 중(한 권씩)
//  ② 다음 걸음(edMvNext): 새 판이 판매중으로 보여야 이음 · 이은 뒤 물려받기 확인 · 새 판이 판매중일 때만 삭제 · 삭제 보이면 끝
//  ③ 화면: 제안 카드(✕ 오늘 숨김 · 설정으로 끔) · 걸음 카드 버튼 · 설정 칸 · 삭제는 두 번 누름(twiceArm) · 브라우저 창 없음
//  ④ 맡기기(지어낸 Firestore): 등록 줄(조회 대기 · 같은 값·등급·관리코드 · reReg.ed) + 일 장부 · 진행 중이면 거절
// 실행: node tEDMOVE_1119.js · 상품은 모두 지어낸 것 · 손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const a = T.indexOf('/* ══════════ (recinh1 · 헌장 제42조'), b = T.indexOf('/* (recinh1) 끝 */'); const BLK = a > 0 && b > a ? T.slice(a, b) : '';
ok(BLK.length > 5000 && !/\b(alert|confirm|prompt)\s*\(/.test(BLK), '판 옮김 덩이 · 브라우저 창 없음');
const store = new Map(); const deep = (o) => JSON.parse(JSON.stringify(o)); let auto = 0;
const ref = (c, d) => ({ id: d, _k: c + '/' + d, get: async () => { const v = store.get(c + '/' + d); return { id: d, exists: !!v, data: () => (v ? deep(v) : undefined) }; }, set: async (v, o) => store.set(c + '/' + d, { ...(o && o.merge ? store.get(c + '/' + d) || {} : {}), ...deep(v) }) });
const db = { collection: (c) => ({ doc: (d) => ref(c, d === undefined ? 'R' + ++auto : d), where: () => ({ get: async () => ({ size: 0, docs: [] }), onSnapshot: () => () => {} }), onSnapshot: () => () => {}, get: async () => ({ docs: [] }) }),
  runTransaction: async (f) => { const W = []; await f({ get: (r) => r.get(), set: (r, v, o) => W.push([r, v, o]) }); for (const [r, v, o] of W) await r.set(v, o); } };
const firebase = { firestore: { FieldValue: { delete: () => null, serverTimestamp: () => 'TS', arrayUnion: (...x) => x } } };
const sheets = []; let sheetAns = true; const toasts = []; const looked = [];
const S = { user: { email: 'test@example.invalid' }, px: { vw: new Map(), old: new Map(), vg: 1, v: 1 }, plist: new Map(), app: {}, regItems: new Map(), pbooks: new Map() };
const SALES = new Map(); const CASH = new Map(); const BUMP = { to: new Map(), from: new Map() };
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite, setTimeout: () => 0, S, db, firebase,
  document: { addEventListener: () => {} }, localStorage: { _v: null, getItem() { return this._v; }, setItem(k, v) { this._v = v; } },
  esc: (s) => String(s), won: (n) => n + '원', num: (n) => String(n), errKo: (e) => String(e && e.message || e), toast: (m) => toasts.push(m), TS: () => 'TS',
  pxZ: () => ({ n: 0 }), sxH: (k) => k, saleIdx: () => SALES, saleIdxX: () => SALES, /* (11/20 isbnall1) 판 옮김 주문 수 = saleIdxX */ cashIdx: () => CASH, fbIdx: () => BUMP, kMs: (v) => Date.parse(v) || 0, prodOffKind: (l) => l.__off || null, plkOnL: (l) => !!l.__lock, edPickOf: (l) => l.__pick || null,
  fbSoldSince: () => null, isAdminDevice: () => true, deviceName: () => 'TESTPC', askSheet: async (o) => { sheets.push(o); return sheetAns; }, regCfg: () => ({ branch: 1, grade: 2, source: '' }), regWsCur: () => 'ws1', regPickLookup: (id) => looked.push(id), regPlkKey: (it) => it.__key || '',
  peNoteParts: () => ({ text: '' }), loadRelinks: async () => {}, batchSaveItems: async () => {}, batchAssemble: () => [], twiceArm: () => 'go', prdDelQueue: async () => {}, openProduct: () => {}, openListView: () => {} };
vm.createContext(ctx); vm.runInContext(BLK, ctx); const run = (s) => vm.runInContext(s, ctx);
const G = run('edMvGates'), N = run('edMvNext');
const L0 = { id: 'OLD1', usedCode: 'U100', listingId: '100', title: '지어낸 책 (리커버)', price: 12000, grade: '상', sku: 'A12_3', status: '판매중', active: true };
const base = { l: L0, pick: { itemId: '555', t: '지어낸 책' }, locked: false, recentOrders: 0, days: 14, cash: false, active: true, bump: false, job: null, otherJob: null };

console.log('① 맡기는 문');
ok(G(base).length === 0, '모두 맞으면 맡길 수 있음');
const cases = [[{ pick: null }, /같은 판/], [{ pick: { none: 1 } }, /같은 판/], [{ l: { ...L0, usedCode: '' } }, /U코드/], [{ active: false }, /판매중이 아님/], [{ l: { ...L0, soldBy: 'x' } }, /팔림/], [{ locked: true }, /잠금/], [{ recentOrders: 2 }, /주문 2건/], [{ cash: true }, /현금/], [{ bump: true }, /앞 페이지/], [{ otherJob: '다른 책' }, /한 권씩/], [{ job: { state: 'linked' } }, /이미 판 옮김/]];
for (const [p, re] of cases) { const w = G({ ...base, ...p }); ok(w.some((x) => re.test(x)), `막음 — ${re.source}`, w); }
ok(G({ ...base, job: { state: 'done' } }).length === 0 && G({ ...base, job: { state: 'undone' } }).length === 0, '끝난·되돌린 일은 다시 맡길 수 있음');

console.log('② 다음 걸음');
const nx = (st, c) => N({ state: st }, c).act;
ok(nx('reg', {}) === 'wait_reg' && nx('reg', { newL: {}, newLive: false }) === 'wait_reg' && nx('reg', { newL: {}, newLive: true }) === 'link', '새 판이 판매중으로 보여야 이음');
const ln = { newL: {}, newLive: true, oldLive: true, inhOk: true };
ok(nx('linked', ln) === 'del', '이음·물려받음·새 판 판매중 → 옛 상품 삭제 차례');
ok(nx('linked', { ...ln, inhOk: false }) === 'fix_inh', '물려받기 확인 전엔 삭제 안 함');
ok(nx('linked', { ...ln, newLive: false }) === 'wait_live', '새 판이 판매중이 아니면 삭제 안 함');
ok(nx('linked', { ...ln, sold: '주문 1건' }) === 'blocked' && nx('linked', { ...ln, locked: true }) === 'blocked' && nx('linked', { ...ln, oldLive: false }) === 'blocked', '그 사이 팔림·잠김·판매중 아님 → 막음');
ok(nx('linked', { ...ln, oldDel: true }) === 'done' && nx('del_q', { oldDel: true }) === 'done' && nx('del_q', {}) === 'wait_del', '옛 상품 삭제가 보이면 끝');
ok(nx('reg', { ...ln }) === 'link' && nx('stop', ln) === 'none' && nx('undone', ln) === 'none' && N(null).act === 'none', '이기 전엔 삭제 없음 · 멈춤·되돌림은 할 일 없음');

console.log('③ 화면');
S.plist.set('OLD1', { ...L0, __pick: { itemId: '555', t: '지어낸 책' } });
{ const h = run("edMoveCardHtml(S.plist.get('OLD1'))"); ok(/data-edmvgo="OLD1"/.test(h) && /data-edmvhide="OLD1"/.test(h), '제안 카드 — 시작 단추 · ✕ 오늘 숨김', h); }
SALES.set('OLD1', [{ ms: Date.now() - 864e5 }]); { const h = run("edMoveCardHtml(S.plist.get('OLD1'))"); ok(!/data-edmvgo/.test(h) && /주문 1건/.test(h), '최근 주문 있으면 단추 없이 까닭만', h); }
S.app.edMoveOrderDays = 0; { const h = run("edMoveCardHtml(S.plist.get('OLD1'))"); ok(/data-edmvgo/.test(h), '설정 날수 0 → 주문 날수 막음 끔'); } SALES.clear(); delete S.app.edMoveOrderDays;
S.app.edMoveCard = false; ok(run("edMoveCardHtml(S.plist.get('OLD1'))") === '', '설정에서 끄면 제안 카드 없음'); S.app.edMoveCard = true;
run("edMvHide('OLD1')"); ok(run("edMoveCardHtml(S.plist.get('OLD1'))") === '', '✕ 누르면 오늘은 숨김'); ctx.localStorage._v = null;
ok(/data-edmvset="card"/.test(run('edMvSetHtml()')) && /data-edmvset="days"/.test(run('edMvSetHtml()')) && /data-edmvlist/.test(run('edMvSetHtml()')), '설정 칸(제안 켜고 끔 · 주문 날수 · 대기 목록)');
ok(/twiceArm\(b, '옛 상품 삭제'/.test(BLK) && /prdDelQueue\('__prd', \[o\]/.test(BLK), '옛 상품 삭제 = 두 번 누름 → 기존 삭제 줄(지우기 직전 대조)');
ok(/if \(nx\.act !== 'del'\) return toast/.test(BLK), '삭제 직전 다음 걸음을 다시 셈(새 판 판매중·물려받기 확인)');
ok(/\$\{typeof edMvSetHtml === 'function' \? edMvSetHtml\(\) : ''\}/.test(T), '⚙ 설정 화면에 판 옮김 칸');

console.log('④ 맡기기');
(async () => {
  await run('edMvStart')(S.plist.get('OLD1'));
  const job = store.get('prd_edmove/OLD1'); const ri = job && store.get('reg_items/' + job.regItem);
  ok(sheets.length === 1 && /옛 상품/.test(sheets[0].html) && /새 상품/.test(sheets[0].html), '앞뒤 나란히 보여 주고 물어봄(앱 안 창)');
  ok(job && job.state === 'reg' && job.itemId === '555' && job.key === 'OLD1', '일 장부 prd_edmove/{옛 상품} — 새 판 등록 기다림', job);
  ok(ri && ri.stage === 'q' && ri.itemId === '555' && ri.price === 12000 && ri.priceManual && ri.grade === 2 && ri.code === 'A12' && ri.reReg.ed === true && ri.reReg.from === 'OLD1', '등록 줄 — 조회 대기 · 같은 값·등급·관리코드 앞부분 · 판 옮김 표시', ri);
  ok(looked.length === 1, '바로 조회해 선택 대기로');
  const n0 = store.size; S.plist.set('OLD2', { ...L0, id: 'OLD2', usedCode: 'U101', listingId: '101', __pick: { itemId: '556', t: 'x' } }); await run('edMvStart')(S.plist.get('OLD2'));
  ok(store.size === n0 && toasts.some((t) => /한 권씩/.test(t)), '다른 판 옮김 진행 중이면 맡기지 않음(한 권씩)', toasts.slice(-1));
  /* 새 판 찾기 — 등록 줄의 열쇠 */
  S.regItems.set(job.regItem, { __key: 'NEW1' }); S.plist.set('NEW1', { id: 'NEW1', usedCode: 'U200', listingId: '200', status: '판매중', active: true, price: 12000, grade: '상' });
  ok(run("edMvFindNew(edMv().jobs.get('OLD1'))") && run("edMvFindNew(edMv().jobs.get('OLD1'))").id === 'NEW1', '등록 줄에서 새 판을 찾음');
  await run('edMvLink')('OLD1'); const lk = store.get('prd_relinks/U200'); const j2 = store.get('prd_edmove/OLD1');
  ok(lk && lk.kind === 'ed' && lk.fromKey === 'OLD1' && lk.toKey === 'NEW1' && j2.state === 'linked' && j2.newKey === 'NEW1', '이음 — 같은 실물 고리(판 옮김) · 일은 「이음」', [lk, j2 && j2.state]);
  ok(JSON.stringify(run("recChainKeys('NEW1')")) === '["NEW1","OLD1"]', '이은 뒤 새 상품이 옛 기록을 함께 봄');
  ok(store.has('prd_inherit/NEW1'), '물려받기 장부가 생김');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
