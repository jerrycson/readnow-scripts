// tCTRLIMP2_DA — (ctrlimp2 · 설계 CTRLDES1 9절 「다」 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 다 — 확정·되돌리기
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 관제창은 서버에 직접 확정하지 않음(묶음 execAll·bulkUndo 한 길 bkfRun) · 반영 전 확정 취소는 두 번 누름
//  ② 묶음 쪽 흉내(vm): bkfArg 글 인자 그대로 · 물건 인자 {tab, keys, gids} · bkfKeysOnly 고른 열쇠만·손익 다시 셈 · 고른 상품이 없는 그룹 건너뜀
//  ③ 관제창 흉내(vm): 결정 대기 탭 단추 · 고른 것 확정 인자 · 거르지 않으면 'pick'(묶음 「모두 확정」과 같음) · 거르면 그 열쇠만 · 미리 보기(bkfPre 읽기만) 표 · 되돌리기 목록·bulkUndo · 반영 전 확정 취소
// 실행: node tCTRLIMP2_DA.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음(bkfRun·bkfPre는 흉내)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const i0 = T.indexOf('/* ◆ctrl 시작'), i1 = T.indexOf('/* ◆ctrl 끝 */'); const BLK = i0 > 0 && i1 > i0 ? T.slice(i0, i1) : '';
const j0 = BLK.indexOf('/* ── 판 다 (ctrlimp2'); const DA = j0 > 0 ? BLK.slice(j0) : '';
const fnSrc = (n) => { const m = T.match(new RegExp(`\\nfunction ${n}\\([^\\n]*`)); return m ? m[0] : ''; };
console.log('① 글');
ok(!!BLK && !!DA, '◆ctrl 덩이 · 판 다 덩이가 있음');
{ const names = ['bkfKeysOnly', 'ctrlWait', 'ctrlXArg', 'ctrlXBar', 'ctrlPreview', 'ctrlPvHtml', 'ctrlRuns', 'ctrlUndoHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BLK), '브라우저 창 없음');
ok(!/bkfExecOne\(|prd_price_decisions|bkfUndoSave\(|bkfLock\(/.test(BLK), '관제창은 확정·되돌리기를 직접 쓰지 않음(묶음 실행 길만)');
ok(/bkfRun\(fid, 'execAll', arg\)/.test(BLK) && /bkfRun\(fid, 'bulkUndo', d\.cundo\)/.test(BLK) && /bkfPre\(P\.fid, BKF_OPS\.execAll, arg\)/.test(BLK), '확정 = bkfRun execAll · 되돌리기 = bkfRun bulkUndo · 미리 보기 = bkfPre(읽기만)');
ok(/twiceArm\(t, '확정 취소'/.test(BLK), '반영 전 확정 취소는 두 번 누름');
ok(/const T = bkfKeysOnly\(X, bkfTabKeys\(C, 'pick', X\.Z, null\)\);/.test(T) && /const T = bkfKeysOnly\(X, bkfTabKeys\(C, X\.tab, X\.Z, null\)\);/.test(T), 'execAll·pickAll 모두 bkfKeysOnly를 거침(막는 장치·겹침은 그대로)');
ok(/via: 'ctrl'/.test(fnSrc('bkfArg') + T.slice(T.indexOf('execAll: {'), T.indexOf('execAll: {') + 300)), '확정 실행 기록에 관제창에서 왔음(via ctrl)·고른 수');
ok(/확정·되돌리기 \(판 다\)/.test(T), '설명서 문단');

console.log('② 묶음 쪽 흉내');
{ const c = { bkfSIdx: () => 's', Set, Date, String, Array }; vm.createContext(c); vm.runInContext(fnSrc('bkfArg') + '\n' + fnSrc('bkfKeysOnly') + '\n' + fnSrc('bkfPreG') + '\n;this.A = bkfArg; this.K = bkfKeysOnly; this.G = bkfPreG;', c);
  const X1 = { arg: 'pick|g2' }; c.A(X1); ok(X1.tab === 'pick' && X1.only === 'g2' && X1.keys === null && X1.gids === null && X1.Z.sIdx === 's', '글 인자 \'pick|g2\' = 예전 그대로', X1);
  const X2 = { arg: { tab: 'pick', keys: ['a', 'b'], gids: ['g1'] } }; c.A(X2); ok(X2.tab === 'pick' && X2.keys.size === 2 && X2.gids.has('g1') && !X2.only, '물건 인자 {tab, keys, gids}');
  const R = c.K(X2, { keys: [['a', 900, 1000], ['c', 500, 400], ['b', 800, 700]], amt: 0, blk: 3 }); ok(R.keys.length === 2 && R.amt === 0 && R.blk === 3, '고른 열쇠만 남기고 손익 다시 셈(−100 + 100 = 0)', R);
  ok(c.K(X1, { keys: [['a', 1, 2]], amt: -1 }).keys.length === 1, '열쇠 없으면 그대로');
  const X3 = { arg: { tab: 'pick', keys: [] } }; c.A(X3); ok(X3.keys === null && X3.gids === null, '빈 열쇠 목록 = 거르지 않음(gids도 무시)');
  if (fnSrc('bkfPreG')) { const g = c.G({ id: 'g9', name: 'x' }, X2); ok(Array.isArray(g) && g[0] === 'only', '고른 상품이 없는 그룹은 건너뜀(only)', g); } }

console.log('③ 관제창 흉내');
const mkEl = () => ({ _l: {}, innerHTML: '', id: '', className: '', addEventListener(t, f) { this._l[t] = f; }, querySelector: () => null, remove() { delete DOM[this.id]; } });
const DOM = {}; const TOASTS = []; const RUNS = []; const PRES = [];
const plist = new Map(); const cls = new Map(); const cls2 = new Map();
for (let i = 0; i < 60; i++) { const k = 'aladin_U7' + String(i).padStart(6, '0'); plist.set(k, { usedCode: k.slice(7), title: '시험 책 ' + i, price: 10000, grade: '상', status: '판매중' }); cls.set(k, i < 50 ? 'pick' : 'done'); }
for (let i = 0; i < 10; i++) { const k = 'aladin_U6' + String(i).padStart(6, '0'); plist.set(k, { usedCode: k.slice(7), title: '둘째 책 ' + i, price: 5000, grade: '중', status: '판매중' }); cls2.set(k, 'pick'); }
const now0 = new Date().toISOString(); const docs = { g1: { picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {} }, g2: { picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {} } };
for (const [k, t] of cls) { if (t === 'pick') docs.g1.picks[k] = { price: 9000, at: now0 }; else docs.g1.decided[k] = { price: 9000, at: now0 }; } for (const k of cls2.keys()) docs.g2.picks[k] = { price: 4500, at: now0 };
const SRV = new Map(); let ii = 0; for (const [k, d] of Object.entries(docs.g1.decided)) SRV.set(k, { approvalState: ii++ % 2 ? 'approved' : 'manual', approval: { at: d.at } });
const S = { plist, prCfg: {}, user: { email: 't@x' }, bkfold: {}, prBatches: [{ id: 'g1', name: '그룹 하나' }, { id: 'g2', name: '그룹 둘' }], _bkfTb: { g1: { cls, lm: now0 }, g2: { cls: cls2, lm: now0 } } };
S._bkfRunFid = 'f1'; S._bkfRunD = { fid: 'f1', d: { runs: { r1: { op: 'execAll', at: '2026-11-19T01:00:00Z', endAt: '2026-11-19T01:01:00Z', by: 't@x', via: 'ctrl', res: { g1: { st: 'ok', n: 12 } } }, r2: { op: 'execAll', at: '2026-11-19T00:00:00Z', endAt: '2026-11-19T00:01:00Z', by: 't@x', res: { g1: { st: 'ok', n: 3 } } }, r3: { op: 'bulkUndo', undoOf: 'r2', at: '2026-11-19T00:30:00Z', endAt: '2026-11-19T00:31:00Z', res: { g1: { st: 'ok' } } }, r4: { op: 'pickAll', at: '2026-11-19T02:00:00Z', endAt: '2026-11-19T02:01:00Z', res: { g1: { st: 'ok', n: 1 } } } } } };
const bqCtx = async (gid, opt) => { const st = JSON.parse(JSON.stringify(docs[gid])); const C0 = gid === 'g1' ? cls : cls2; const keys = [...C0.keys()].filter((k) => !opt.only || opt.only.has(k)); if (opt.cnt) opt.cnt.n = (opt.cnt.n || 0) + keys.length;
  return { st, R: keys.map((k) => ({ l: plist.get(k), target: 9000 })), SRV: gid === 'g1' ? SRV : new Map(), sold: { set: new Set() }, keyOf: (x) => 'aladin_' + x.l.usedCode }; };
const FV = { delete: () => ({ __del: 1 }), arrayUnion: (...a) => ({ __au: a }) };
const ctx = { S, console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, parseInt, Promise, Error, setTimeout, bqCtx,
  db: { collection: () => ({ doc: () => ({ set: async () => {} }) }) }, firebase: { firestore: { FieldValue: FV } },
  document: { getElementById: (id) => DOM[id] || null, createElement: () => mkEl(), body: { appendChild: (el) => { DOM[el.id] = el; } }, addEventListener() {}, removeEventListener() {} },
  window: { ReadnowPricing: { snapDown: (v) => Math.floor(v / 100) * 100, snapUp: (v) => Math.ceil(v / 100) * 100 }, addEventListener() {}, removeEventListener() {} },
  history: { pushState() {}, back() {} }, CSS: { escape: (s) => s }, toast: (m, e) => TOASTS.push([m, e || 0]), num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', kTime: (s) => String(s), kMs: (v) => Date.parse(v) || 0,
  BKF_STALE_H: 72, BKF_BULK: { sel: 'pickAll', lot: 'pickAll', pick: 'execAll' }, BKF_OPS: { execAll: { title: '✅ 모두 확정' } }, BQ_TABACT: (k) => ({ sel: { edit: 1 }, pick: { back: 1 } })[k] || {},
  bkfTbCols: () => [['sel', '선택 대기'], ['pick', '결정 대기'], ['done', '확정'], ['keep', '추천 못 함'], ['hold', '보류'], ['trash', '휴지통']], bkfNorm: () => ({ folds: { f1: { gids: ['g1', 'g2'] } } }), bkfGl: (g) => S.prBatches.find((x) => x.id === g) || null,
  bqReoMv: (d) => !!(d && d.reo && !d.reo.stay), /* (판 라) 관제창 카드가 부름 */
  bqCls: (x, c) => { const k = 'aladin_' + x.l.usedCode; if (c.st.trashed[k]) return 'trash'; if (c.st.held[k]) return 'hold'; if (c.st.picks[k]) return 'pick'; if (c.st.decided[k]) return 'done'; return 'sel'; },
  bkfDirty: () => {}, errKo: (e) => String((e && e.message) || e), bkfTabP: (x) => x.target, plkOn: () => false, bkfItemWhy: () => null, bkfSIdx: () => null, batchIsOn: () => true, bkfName: () => '시험 묶음', bkfTbPaint() {}, openBatchGroup() {},
  twiceArm: () => 'go', bkfRun: async (fid, op, arg) => { RUNS.push([fid, op, arg]); }, batchSave: async () => {}, bkfGlSet() {}, plkFreshMany: async () => new Map(), bkfLkOf: () => null,
  bqPxGate: () => '', bqFewOf: () => '', bkfCancelDec: async () => [true, ''], bkfLockAlive: (L) => !!(L && L.alive), bkfRunSum: (run) => { const n = { ok: 0, skip: 0, fail: 0 }; for (const r of Object.values((run && run.res) || {})) n[r && r.st === 'ok' ? 'ok' : r && r.st === 'fail' ? 'fail' : 'skip']++; return n; },
  bkfPre: async (fid, OP, arg) => { PRES.push([fid, arg]); return { lock: null, X: { warn: ['가격 감시 설정 시험 경고'], dup: 2, dupX: 1 }, rows: [{ gid: 'g1', name: '그룹 하나', skip: null, info: { keys: [['a', 9000, 10000], ['b', 9500, 10000]], blk: 3, blkBy: { '🔒 잠김': 2, '바닥가 아래': 1 } } }, { gid: 'g2', name: '그룹 둘', skip: 'off', why: '적용 꺼짐', info: {} }, { gid: 'g3', name: '그룹 셋', skip: 'only', why: '이번엔 고른 상품이 없는 그룹' }] }; } };
vm.createContext(ctx); vm.runInContext(BLK + '\n;this.__C = { openBkfCtrl, ctrlClick, ctrlXArg, ctrlRuns, ctrlWait, ctrlPaint };', ctx);
const C = ctx.__C; const P = () => S._bkfCtrl; const tick = () => new Promise((r) => setTimeout(r, 0)); const settle = async () => { for (let i = 0; i < 50 && P() && P().load; i++) await tick(); await tick(); };
const click = (ds) => C.ctrlClick({ target: { closest: (s) => (s === 'button' ? { dataset: ds, disabled: false } : null) } });
const H = () => (DOM.bkf_ctrl || {}).innerHTML || '';
(async () => {
  vm.runInContext('openBkfCtrl("f1", "pick")', ctx); await settle();
  ok(P().tab === 'pick' && P().keys.length === 60 && P().rows.length === 40, '결정 대기 탭 60개(두 그룹) · 40장', { k: P().keys.length, r: P().rows.length });
  ok(/data-cpv="all"/.test(H()) && /data-cx="sel"[^>]*disabled/.test(H()) && /data-cx="all"/.test(H()) && /이 탭 모두 확정/.test(H()), '단추: 미리 보기 · 고른 n개 확정(고른 것 없으면 꺼짐) · 이 탭 모두 확정', H().slice(0, 300));
  ok(/data-cundo="r1"/.test(H()) && !/data-cundo="r2"/.test(H()) && !/data-cundo="r4"/.test(H()) && /관제창/.test(H()), '되돌리기 목록 = 안 되돌린 확정 실행만(r1 · 이미 되돌린 r2·다른 일 r4 뺌)');
  ok(/type="checkbox"/.test(H()), '결정 대기 탭에도 고르기 칸');
  // 고른 것 확정
  const a = P().rows[0], b = P().rows[1]; P().sel.add(a.id); P().sel.add(b.id); C.ctrlPaint(); ok(/data-cx="sel"(?![^>]*disabled)/.test(H()) && /고른 2개 확정/.test(H()), '고르면 「고른 2개 확정」 켜짐');
  await click({ cx: 'sel' }); const r = RUNS.pop(); ok(r && r[0] === 'f1' && r[1] === 'execAll' && r[2].tab === 'pick' && r[2].keys.join() === [a.k, b.k].join() && r[2].gids.join() === 'g1' && !S._bkfCtrl, '「고른 2개 확정」 → bkfRun(execAll, {tab pick, keys, gids}) · 창 닫음', r);
  // 거르지 않은 「모두」
  vm.runInContext('openBkfCtrl("f1", "pick")', ctx); await settle(); await click({ cx: 'all' }); const r2 = RUNS.pop(); ok(r2 && r2[1] === 'execAll' && r2[2] === 'pick', '안 거르면 「이 탭 모두 확정」 = 묶음 「✅ 모두 확정」과 똑같은 인자 \'pick\'', r2);
  // 그룹 칩으로 거른 「모두」
  vm.runInContext('openBkfCtrl("f1", "pick")', ctx); await settle(); P().gf = new Set(['g2']); P().have = new Set(); vm.runInContext('ctrlKeys()', ctx);
  const A2 = C.ctrlXArg(P(), false); ok(A2 && A2.keys.length === 10 && A2.gids.join() === 'g2', '그룹 칩으로 거르면 그 그룹 10개 열쇠만', A2);
  P().gf = null; P().q = '없는제목'; P().have = new Set(); vm.runInContext('ctrlKeys()', ctx); ok(C.ctrlXArg(P(), false) === null, '찾기 결과가 0이면 확정 안 함');
  P().q = ''; P().have = new Set(); vm.runInContext('ctrlKeys()', ctx); ok(C.ctrlXArg(P(), true) === null, '고른 것이 없으면 고른 확정 안 함');
  // 미리 보기
  await click({ cpv: 'all' }); await tick(); const pv = P().pv; ok(PRES.length === 1 && PRES[0][1] === 'pick' && pv && pv.rows.length === 2 && pv.rows[0].n === 2 && pv.rows[0].amt === -1500 && pv.rows[1].skip === '적용 꺼짐', '미리 보기 = bkfPre 한 번(읽기만) · 그룹마다 확정 수·손익 · 건너뛴 까닭 · 고른 것 없는 그룹(only)은 뺌', pv);
  ok(/확정 2개/.test(H()) && /−1500원/.test(H()) && /막힘 3/.test(H()) && /🔒 잠김 2/.test(H()) && /가격 감시 설정 시험 경고/.test(H()) && /겹쳐 앞 그룹에서만 2/.test(H()) && !RUNS.length, '미리 보기 표: 합·손익·막힌 까닭·경고·겹침 · 확정 실행은 안 함', H().slice(H().indexOf('ctrl-pv'), H().indexOf('ctrl-pv') + 400));
  await click({ cpvx: '1' }); ok(P().pv === null, '미리 보기 닫기');
  ctx.bkfPre = async () => { throw new Error('다른 확정이 진행 중'); }; await click({ cpv: 'all' }); await tick(); ok(P().pv.err && /지금은 확정할 수 없음/.test(H()), '확정할 수 없는 때(다른 확정 진행 중 등)는 까닭만 보임');
  // 되돌리기
  await click({ cundo: 'r1' }); const u = RUNS.pop(); ok(u && u[1] === 'bulkUndo' && u[2] === 'r1', '「↩ 확정 되돌리기」 → bkfRun(bulkUndo, 실행 번호)', u);
  // 확정 탭 — 반영 전 확정 취소
  vm.runInContext('openBkfCtrl("f1", "done")', ctx); await settle(); const W = P().rows.filter((it) => C.ctrlWait(it)); ok(P().rows.length === 10 && W.length === 5, '확정 탭 10개 중 반영 전(manual) 5개만 취소 가능', { n: P().rows.length, w: W.length });
  P().more.add(W[0].id); C.ctrlPaint(); ok(/data-ca="cancel2"/.test(H()) && /data-cundo="r1"/.test(H()), '확정 탭: 줄 ⋯ 「↩ 확정 취소(반영 전)」 · 되돌리기 목록', H().match(/data-ca="[^"]+"/g));
  S._bkfRunD.d.runs.r5 = { op: 'bulkUndo', undoOf: 'r1', at: 'z', endAt: 'z', res: { g1: { st: 'ok' } } }; ok(C.ctrlRuns(P()).length === 0, '되돌린 뒤에는 목록에서 사라짐');
  S._bkfRunFid = 'f9'; ok(C.ctrlRuns(P()).length === 0, '다른 묶음 실행 기록은 안 씀');
  ok(!TOASTS.some((t) => /undefined|NaN/.test(t[0])) && !/undefined|NaN/.test(H()), '알림·화면 글에 undefined·NaN 없음', TOASTS.slice(-3));
  console.log(bad ? `❌ tCTRLIMP2_DA ${bad}개 실패` : '✓ tCTRLIMP2_DA 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 흉내 실행 오류', e && e.stack); process.exit(1); });
