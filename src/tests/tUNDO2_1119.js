// tUNDO2 — (11/19 undo2 · 정범님 I-1119-1922-24) ↶ Ctrl+Z 되돌리기 · ↷ Ctrl+Shift+Z / Ctrl+Y 다시 하기 넓힘
//  · 한 문서 쓰기·한꺼번에 쓰기(WriteBatch)·트랜잭션 모두 기억 → 되돌리기는 트랜잭션 하나로 · 그사이 바뀌었으면 아무것도 쓰지 않음
//  · 알라딘·네이버로 나가는 칸(가격·잠금 등)은 첫 Ctrl+Z = 띠만 · 몇 초 안 한 번 더 = 진짜 · 시간이 지나면 그만(다시 하기도 같음)
//  · 입력 칸 안은 브라우저 글자 되돌리기 · Alt와 함께는 안 봄 · 서가 지도·⏰ 편집기는 자기 기록이 먼저
//  · 기록 칸(hist·…Log)·arrayUnion은 되돌리지 않음(기록이 지워짐) · 저장 시각 칸은 새 시각으로 · 밖으로 보낸 일·지운 기록은 띠로 알림
// 실행: node tUNDO2_1119.js · 시험 자료는 지어낸 이름·번호만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return T.slice(i, j); };
const line = (a) => { const i = T.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); let j = T.indexOf('\nfunction ', i + 1); const k = T.indexOf('\nconst ', i + 1); if (k > 0 && k < j) j = k; return T.slice(i, j); };
const BLK = line('const UX2_TW = new WeakMap();') + '\n' + line('function bkBand(kind, html, o)') + '\n' + line('function twiceArm(b, what, o)') + '\n' + line('function ux2TwOff(b, ok)') + '\n' + cut('/* (undo2 되돌리기 시작)', '/* (undo2 되돌리기 끝) */');

// ── 가짜 시계·타이머
let NOW = 1763500000000; const realNow = Date.now; Date.now = () => NOW; const TM = []; let tmId = 0;
const fakeSet = (fn, ms) => { const id = ++tmId; TM.push({ id, at: NOW + (ms || 0), fn }); return id; }; const fakeClr = (id) => { const i = TM.findIndex((t) => t.id === id); if (i >= 0) TM.splice(i, 1); };
const adv = (ms) => { NOW += ms; for (;;) { TM.sort((a, b) => a.at - b.at); const t = TM[0]; if (!t || t.at > NOW) break; TM.shift(); t.fn(); } };
const flush = async () => { for (let i = 0; i < 30; i++) await new Promise((r) => setImmediate(r)); };

// ── 가짜 화면(아주 작게)
const mkEl = (tag) => { const el = { tagName: String(tag || 'div').toUpperCase(), children: [], parentNode: null, classList: null, attrs: {}, _html: '', textContent: '', id: '', className: '', onclick: null, style: {},
  setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; }, closest() { return null; }, dispatchEvent(ev) { (this.evs = this.evs || []).push(ev.type); return true; }, appendChild(c) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.push(c); return c; },
  insertBefore(c, ref) { if (c.parentNode) c.remove(); c.parentNode = this; const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
  remove() { const p = this.parentNode; if (p) { const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); } this.parentNode = null; },
  get firstChild() { return this.children[0] || null; }, get lastChild() { return this.children[this.children.length - 1] || null; },
  get isConnected() { let x = this; while (x) { if (x === BODY) return true; x = x.parentNode; } return false; },
  get innerHTML() { return this._html; }, set innerHTML(h) { this.children.forEach((c) => (c.parentNode = null)); this.children = []; this._html = String(h); const m = /^<span>([\s\S]*)<\/span>$/.exec(this._html); if (m) { const s = mkEl('span'); s._html = m[1]; this.appendChild(s); } },
  getBoundingClientRect: () => ({ top: 0, bottom: 10, left: 0, right: 10 }), offsetHeight: 10, offsetWidth: 10 };
  const set = new Set(); el.classList = { add: (...a) => a.forEach((x) => set.add(x)), remove: (...a) => a.forEach((x) => set.delete(x)), contains: (x) => set.has(x) }; return el; };
const BODY = mkEl('body'); const RNAS = mkEl('div'); RNAS.id = 'rnas';
const find = (n, id) => { if (n.id === id) return n; for (const c of n.children) { const f = find(c, id); if (f) return f; } return null; };
const KEYH = [];
const document = { body: BODY, createElement: mkEl, getElementById: (id) => find(BODY, id), querySelector: (q) => (q[0] === '#' ? find(BODY, q.slice(1)) : null), addEventListener: (t, f) => { if (t === 'keydown') KEYH.push(f); } };
const band = () => document.getElementById('bkband'); const bandTxt = () => { const b = band(); return b && b.firstChild ? b.firstChild._html : ''; };

// ── 가짜 Firestore (compat 모양 · 프로토타입에 덧씌움이 걸리게)
class Ts { constructor(ms) { this.ms = ms; } toMillis() { return this.ms; } }
const SENT = (m, v) => ({ _methodName: m, v });
const FV = { delete: () => SENT('FieldValue.delete'), serverTimestamp: () => SENT('FieldValue.serverTimestamp'), arrayUnion: (...v) => SENT('FieldValue.arrayUnion', v), increment: (n) => SENT('FieldValue.increment', n) };
class FieldPath { constructor(f) { this.f = f; } }
const STORE = new Map(); const clone = (v) => (v instanceof Ts ? new Ts(v.ms) : Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);
let WR = 0, TXN = 0;
const applyW = (p, data, opts, upd) => { WR++; if (upd && !STORE.has(p)) throw Object.assign(new Error('not-found'), { code: 'not-found' }); const merge = upd || (opts && (opts.merge || opts.mergeFields)); const o = merge ? { ...(STORE.get(p) || {}) } : {};
  const keep = opts && opts.mergeFields ? new Set(opts.mergeFields.map((f) => (f instanceof FieldPath ? f.f : f))) : null;
  for (const [k, v] of Object.entries(data)) { if (keep && !keep.has(k)) continue; const m = v && v._methodName; if (m === 'FieldValue.delete') delete o[k]; else if (m === 'FieldValue.serverTimestamp') o[k] = new Ts(NOW); else if (m === 'FieldValue.arrayUnion') o[k] = [...(o[k] || []), ...v.v]; else if (m === 'FieldValue.increment') o[k] = (o[k] || 0) + v.v; else o[k] = clone(v); }
  STORE.set(p, o); };
function DocumentReference(p) { this.path = p; this.id = p.split('/').pop(); }
DocumentReference.prototype.get = async function () { const v = STORE.get(this.path); return { exists: !!v, data: () => clone(v) }; };
DocumentReference.prototype.set = async function (data, opts) { applyW(this.path, data, opts, false); };
DocumentReference.prototype.update = async function (data) { if (typeof data !== 'object') { const a = [...arguments]; const o = {}; for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1]; data = o; } applyW(this.path, data, null, true); };
DocumentReference.prototype.delete = async function () { WR++; STORE.delete(this.path); };
function WriteBatch() { this.ops = []; }
WriteBatch.prototype.set = function (r, d, o) { this.ops.push(() => applyW(r.path, d, o, false)); return this; };
WriteBatch.prototype.update = function (r, d) { this.ops.push(() => applyW(r.path, d, null, true)); return this; };
WriteBatch.prototype.delete = function (r) { this.ops.push(() => { WR++; STORE.delete(r.path); }); return this; };
WriteBatch.prototype.commit = async function () { this.ops.forEach((f) => f()); };
function Transaction() { this.ops = []; }
Transaction.prototype.get = async function (r) { const v = STORE.get(r.path); return { exists: !!v, data: () => clone(v) }; };
Transaction.prototype.set = function (r, d, o) { this.ops.push(() => applyW(r.path, d, o, false)); return this; };
Transaction.prototype.update = function (r, d) { this.ops.push(() => applyW(r.path, d, null, true)); return this; };
function Firestore() {}
Firestore.prototype.runTransaction = async function (fn) { TXN++; const tx = new Transaction(); const res = await fn(tx); tx.ops.forEach((f) => f()); return res; };
Firestore.prototype.collection = function (c) { return { doc: (id) => new DocumentReference(c + '/' + id) }; };
Firestore.prototype.batch = function () { return new WriteBatch(); };
const firebase = { firestore: { DocumentReference, WriteBatch, Transaction, Firestore, FieldValue: FV, FieldPath } };
const db = new Firestore(); const doc = (p) => new DocumentReference(p);

// ── 나머지 이름
const WL = {}; const fire = (t, el) => (WL[t] || []).forEach((f) => f({ type: t, target: el, isTrusted: true }));
const toasts = []; let draws = 0; const S = { detail: null, auto: null }; const KB_G = [], FEAT = [];
const LOCK = new Map(); const lockCalls = []; const plkMap = () => LOCK;
let plkSet = async function (l, on, o) { lockCalls.push([l.id, on, o]); await doc('prd_locks/' + l.id).set({ on: !!on, hist: FV.arrayUnion({ on }) }, { merge: true }); LOCK.set(l.id, { ...(LOCK.get(l.id) || {}), on: !!on, why: (o && o.why) || '', ...(o && o.mode ? { mode: o.mode } : {}) }); return { on }; };
const env = { firebase, db, S, document, toast: (m) => toasts.push(m), esc: (x) => String(x), errKo: (e) => (e && e.message) || String(e), renderMain: () => draws++, addEventListener: (t, f) => (WL[t] = WL[t] || []).push(f), setTimeout: fakeSet, clearTimeout: fakeClr, innerWidth: 1000, innerHeight: 800,
  KB_G, FEAT, uxHelp: () => {}, plkMap };
const names = Object.keys(env);
const F = new Function(...names, 'let plkSet = arguments[arguments.length - 1];\n' + BLK + '\n; return { UNDO, UNDO_F, undoFNote, undoDo, undoKey, undoSkip, undoOk, undoMoney, getPlk: () => plkSet, UNDO_SCOPES };')(...names.map((k) => env[k]), plkSet);
const U = F.UNDO; const user = () => { U.lastIn = NOW; }; const newGrp = () => { NOW += 2000; U.grp = null; };
const st = (p) => STORE.get(p); const last = () => toasts[toasts.length - 1] || '';
const key = (o) => { const e = { key: o.key || 'z', ctrlKey: o.ctrl !== false, metaKey: false, shiftKey: !!o.shift, altKey: !!o.alt, repeat: !!o.repeat, defaultPrevented: !!o.dp, target: o.target || BODY, pd: 0, preventDefault() { this.pd = 1; } }; KEYH.forEach((h) => h(e)); return e; };

(async () => {
  console.log('① 한 문서 쓰기 — 되돌리기·다시 하기');
  STORE.set('app_settings/main', { theme: 'a', n: 1 }); user(); await doc('app_settings/main').set({ theme: 'b' }, { merge: true }); await flush();
  ok(U.hist.length === 1 && U.hist[0].recs[0].F.join() === 'theme', '사람이 누른 직후 저장 = 한 묶음 기억', U.hist.map((g) => g.recs.map((r) => r.F)));
  const tx0 = TXN; await F.undoDo(false); await flush(); ok(st('app_settings/main').theme === 'a' && st('app_settings/main').n === 1, '↶ 되돌림 = 저장 전 값 · 다른 칸 그대로', st('app_settings/main'));
  ok(TXN === tx0 + 1, '되돌리기는 트랜잭션 하나로', TXN - tx0); ok(U.fut.length === 1 && U.hist.length === 0 && /되돌림/.test(last()), '다시 하기 목록으로 옮김 · 알림', last());
  await F.undoDo(true); await flush(); ok(st('app_settings/main').theme === 'b' && U.hist.length === 1 && U.fut.length === 0, '↷ 다시 함 = 저장 뒤 값', st('app_settings/main'));
  newGrp(); NOW += 5000; await doc('app_settings/main').set({ theme: 'c' }, { merge: true }); await flush(); ok(U.hist.length === 1, '사람이 누르지 않은(2초 지난) 저장은 기억 안 함');
  user(); await doc('app_settings/main').update('theme', 'd'); await flush(); ok(U.hist.length === 1 && st('app_settings/main').theme === 'd', 'update(칸, 값) 꼴은 그대로 통과(망가지지 않음)');
  ok(!F.undoOk('app_settings/secure_vault_cfg') && !F.undoOk('app_settings/ext_run') && F.undoOk('app_settings/nv_reg') && F.undoOk('app_settings/platforms') && !F.undoOk('prd_cmds/x'), '설정 문서 이름꼴 기억 · 비밀·기계 문서·맡긴 일은 뺌');

  console.log('② 한꺼번에 쓰기(WriteBatch)');
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('pur_entries/e1', { memo: '가', qty: 1 }); STORE.set('pur_entries/e2', { memo: '나', qty: 2 });
  user(); const B = db.batch(); B.update(doc('pur_entries/e1'), { memo: '다' }); B.update(doc('pur_entries/e2'), { memo: '라' }); B.set(doc('pur_entries/e3'), { memo: '새' }); await B.commit(); await flush();
  ok(U.hist.length === 1 && U.hist[0].recs.length === 2, '한꺼번에 쓴 두 문서 = 한 묶음 · 새로 만든 기록은 기억 안 함(지우지 않음)', U.hist.map((g) => g.recs.map((r) => r.path)));
  await F.undoDo(false); await flush(); ok(st('pur_entries/e1').memo === '가' && st('pur_entries/e2').memo === '나' && st('pur_entries/e3').memo === '새', '↶ 두 문서 모두 되돌림 · 새 기록은 그대로', [st('pur_entries/e1'), st('pur_entries/e3')]);

  console.log('③ 트랜잭션 쓰기 → 트랜잭션으로 되돌림');
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('crm_customers/c1', { tag: '단골', star: 1 });
  user(); await db.runTransaction(async (tx) => { const s = await tx.get(doc('crm_customers/c1')); tx.update(doc('crm_customers/c1'), { star: s.data().star + 1 }); }); await flush();
  ok(U.hist.length === 1 && U.hist[0].recs[0].before.star === 1 && U.hist[0].recs[0].after.star === 2, '트랜잭션 안에서 읽은 값 = 저장 전 값', U.hist[0] && U.hist[0].recs[0]);
  const tx1 = TXN; await F.undoDo(false); await flush(); ok(st('crm_customers/c1').star === 1 && TXN === tx1 + 1, '↶ 트랜잭션으로 되돌림', [st('crm_customers/c1'), TXN - tx1]);

  console.log('④ 그사이 바뀌면 아무것도 쓰지 않음');
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('app_settings/home', { a: 1, b: 1 }); STORE.set('app_settings/obs', { x: 1 });
  user(); const B2 = db.batch(); B2.update(doc('app_settings/home'), { a: 2 }); B2.update(doc('app_settings/obs'), { x: 2 }); await B2.commit(); await flush();
  STORE.get('app_settings/obs').x = 9; /* 다른 기기가 바꿈 */ const w0 = WR; await F.undoDo(false); await flush();
  ok(st('app_settings/home').a === 2 && st('app_settings/obs').x === 9 && WR === w0, '하나라도 바뀌었으면 둘 다 그대로(반쯤 되돌림 없음)', [st('app_settings/home'), WR - w0]);
  ok(/그사이 다른 기기/.test(last()) && U.hist.length === 1, '알림 · 기록은 남겨 둠', last());

  console.log('⑤ 기록 칸·arrayUnion·셈은 되돌리지 않음 · 저장 시각은 새 시각');
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('prd_cat_manual/k1', { cat: '소설', hist: ['h0'], cfgLog: ['l0'], uploadedAt: new Ts(1), n: 1 });
  user(); await doc('prd_cat_manual/k1').set({ cat: '시', hist: FV.arrayUnion('h1'), cfgLog: ['l0', 'l1'], uploadedAt: FV.serverTimestamp(), n: FV.increment(1) }, { merge: true }); await flush();
  ok(U.hist.length === 1 && U.hist[0].recs[0].F.join() === 'cat' && U.hist[0].recs[0].ts.join() === 'uploadedAt', '기억하는 칸 = cat만 · 저장 시각 칸 따로', U.hist[0] && U.hist[0].recs[0]);
  NOW += 3000; await F.undoDo(false); await flush(); const k1 = st('prd_cat_manual/k1');
  ok(k1.cat === '소설' && k1.hist.join() === 'h0,h1' && k1.cfgLog.join() === 'l0,l1' && k1.n === 2, '↶ cat만 되돌림 · 기록 칸·셈은 그대로', k1);
  ok(k1.uploadedAt instanceof Ts && k1.uploadedAt.ms === NOW, '저장 시각 = 되돌린 때 새 시각(다른 기기가 바뀜을 알아챔)', k1.uploadedAt);

  console.log('⑥ 돈 칸 = 두 번 누름(첫 번째는 띠만)');
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('prd_system/pricing', { floor: 3000 });
  user(); await doc('prd_system/pricing').set({ floor: 5000 }, { merge: true }); await flush(); ok(F.undoMoney(U.hist[0]), '가격 설정 = 돈 칸 묶음');
  await F.undoDo(false); await flush(); ok(st('prd_system/pricing').floor === 5000 && !!U.arm && /한 번 더/.test(bandTxt()), '첫 Ctrl+Z = 「무엇을 되돌릴지」 띠만 · 값 그대로', bandTxt());
  NOW += 100; await F.undoDo(false); await flush(); ok(st('prd_system/pricing').floor === 5000, '너무 빨리(0.4초 안) 두 번 = 무시(손떨림)');
  NOW += 600; await F.undoDo(false); await flush(); ok(st('prd_system/pricing').floor === 3000 && !U.arm && !band(), '몇 초 안 한 번 더 = 진짜 되돌림 · 띠 닫힘', [st('prd_system/pricing'), bandTxt()]);
  await F.undoDo(true); await flush(); ok(st('prd_system/pricing').floor === 3000 && !!U.arm, '다시 하기도 첫 번째는 띠만');
  adv(6000); await flush(); ok(!U.arm && !band() && U.fut.length === 1, '시간이 지나면 그만(띠 닫힘 · 다시 하기 목록 그대로)', [!!U.arm, bandTxt()]);
  await F.undoDo(true); await flush(); NOW += 600; const btn = band() && band().children.find((c) => /다시 하기/.test(c.textContent)); ok(!!btn, '띠에 「↷ 다시 하기」 단추');
  if (btn) { btn.onclick(); await flush(); } ok(st('prd_system/pricing').floor === 5000, '띠 단추를 누르는 것도 두 번째와 같음', st('prd_system/pricing'));
  newGrp(); STORE.set('reg_items/r1', { stage: 'sel', price: 10000, memo: '' }); user(); await doc('reg_items/r1').update({ price: 12000 }); await flush(); ok(F.undoMoney(U.hist[U.hist.length - 1]), '📥 등록 상품의 가격 칸 = 돈 칸');
  newGrp(); user(); await doc('reg_items/r1').update({ memo: '메모' }); await flush(); ok(!F.undoMoney(U.hist[U.hist.length - 1]), '📥 등록 상품의 메모 칸 = 바로 되돌림');

  console.log('⑦ 밖으로 보낸 일·지운 기록 = 띠로 알림(되돌리지 않음 · 기록 안 지움)');
  U.hist.length = 0; U.fut.length = 0; U.skip = null; newGrp(); STORE.set('reg_items/d1', { stage: 'done', memo: '' }); STORE.set('reg_items/c1', { stage: 'sel', cmdId: 'k1', memo: '' });
  user(); await doc('reg_items/d1').update({ memo: 'x' }); await doc('reg_items/c1').update({ memo: 'y' }); await flush(); ok(U.hist.length === 0 && U.skip && U.skip.why === 'out', '확정(알라딘에 맡김)·맡긴 일 붙은 등록 상품은 기억 안 함', U.skip);
  newGrp(); STORE.set('app_settings/main', { theme: 'p' }); user(); await doc('app_settings/main').set({ theme: 'q' }, { merge: true }); await flush(); NOW += 3000; user(); await doc('shp_cmds/1').set({ type: '가상 맡김' }); await flush(); /* 진짜 길: 적용 알림(applyNote)이 맡긴 일을 보고 되돌리기에 알림 */
  await F.undoDo(false); await flush(); ok(st('app_settings/main').theme === 'q' && /밖으로 보낸 일/.test(bandTxt()) && /한 번 더/.test(bandTxt()), '방금 한 일이 맡긴 일이면 띠 · 그 앞 것은 한 번 더', bandTxt());
  await F.undoDo(false); await flush(); ok(st('app_settings/main').theme === 'p', '한 번 더 = 그 앞 것을 되돌림', st('app_settings/main'));
  U.hist.length = 0; U.fut.length = 0; newGrp(); STORE.set('app_settings/main', { theme: 'p' }); user(); await doc('app_settings/main').set({ theme: 'r' }, { merge: true }); await flush(); await doc('prd_cmds/2').set({ type: '가상 맡김' }); await flush();
  await F.undoDo(false); await flush(); ok(st('app_settings/main').theme === 'r' && /같은 때 밖으로 보낸 일/.test(bandTxt()) && U.hist.length === 0, '같은 때 맡긴 일이 붙은 묶음은 되돌리지 않음(칸만 되돌리면 밖과 어긋남)', [bandTxt(), U.hist.length]);
  newGrp(); STORE.set('crm_notes/n1', { t: '가' }); user(); await doc('crm_notes/n1').delete(); await flush(); await F.undoDo(false); await flush(); ok(/지운 기록/.test(bandTxt()), '지운 기록 = 띠로 알림', bandTxt());

  console.log('⑧ 키 — 입력 칸 통과 · Alt 안 봄 · 서가 지도·⏰ 편집기 먼저 · 꾹 누름 한 번');
  U.hist.length = 0; U.fut.length = 0; U.skip = null; newGrp(); STORE.set('app_settings/tabs', { o: 1 }); user(); await doc('app_settings/tabs').set({ o: 2 }, { merge: true }); await flush();
  let e = key({ target: { tagName: 'INPUT', type: 'text' } }); await flush(); ok(!e.pd && st('app_settings/tabs').o === 2, '글 입력 칸 안 = 브라우저 글자 되돌리기(건드리지 않음)');
  e = key({ target: { tagName: 'DIV', isContentEditable: true } }); await flush(); ok(!e.pd && st('app_settings/tabs').o === 2, '글 쓰는 칸(contentEditable)도 통과');
  e = key({ alt: true }); await flush(); ok(!e.pd && st('app_settings/tabs').o === 2, 'Ctrl+Alt+Z = 안 봄(listux1 몫)');
  e = key({ dp: true }); await flush(); ok(st('app_settings/tabs').o === 2, '다른 키 처리가 먼저 먹었으면 그대로');
  S.detail = { shelfmap: 1, ed: 1 }; S.smE = { id: 'm' }; e = key({}); await flush(); ok(!e.pd && st('app_settings/tabs').o === 2, '🗺 서가 지도 편집 중 = 지도 자기 기록만(전체까지 두 번 되돌리지 않음)'); S.detail = null; S.smE = null;
  const Ecalls = []; BODY.appendChild(RNAS); S.auto = { E: { isOpen: () => true, histN: () => 1, undo: (r) => Ecalls.push(r) } }; e = key({}); await flush(); ok(e.pd && Ecalls.length === 1 && st('app_settings/tabs').o === 2, '⏰ 편집기의 저장 전 고침이 먼저'); RNAS.remove(); S.auto = null;
  e = key({ repeat: true }); await flush(); ok(e.pd && st('app_settings/tabs').o === 2, '꾹 눌러 되풀이 = 한 번만(되풀이는 무시)');
  e = key({ target: { tagName: 'INPUT', type: 'checkbox' } }); await flush(); ok(e.pd && st('app_settings/tabs').o === 1, '체크 상자 위에서는 웹앱 되돌리기', st('app_settings/tabs'));
  e = key({ key: 'y' }); await flush(); ok(e.pd && st('app_settings/tabs').o === 2, 'Ctrl+Y = 다시 하기'); e = key({ shift: true, key: 'Z' }); await flush(); ok(st('app_settings/tabs').o === 2 && /다시 할 것이 없습니다/.test(last()), 'Ctrl+Shift+Z = 다시 하기(없으면 알림)', last());

  console.log('⑨ 🔒 잠금·🔓 풀기 — 같은 함수로 반대로 · 돈 칸이라 두 번 누름 · 그사이 바뀌면 안 함');
  U.hist.length = 0; U.fut.length = 0; newGrp(); LOCK.set('aladin_1', { on: false }); const P = F.getPlk(); ok(P !== plkSet, '잠금 함수에 고리가 걸림');
  user(); await P({ id: 'aladin_1', title: '가상 책' }, true, { act: 'lock' }); await flush(); ok(U.hist.length === 1 && U.hist[0].fn && U.hist[0].money, '잠금 = 함수 묶음 · 돈 칸', U.hist.length);
  await F.undoDo(false); await flush(); ok(LOCK.get('aladin_1').on === true && !!U.arm, '첫 Ctrl+Z = 띠만'); NOW += 600; await F.undoDo(false); await flush();
  ok(LOCK.get('aladin_1').on === false && lockCalls[lockCalls.length - 1][1] === false && lockCalls[lockCalls.length - 1][2].act === 'unlock', '두 번째 = 같은 함수로 풀기', lockCalls[lockCalls.length - 1]);
  ok(U.hist.length === 0 && U.fut.length === 1, '다시 하기 목록으로');
  LOCK.set('aladin_1', { on: true }); /* 다른 기기가 다시 잠금 */ const n0 = lockCalls.length; await F.undoDo(true); await flush(); NOW += 600; await F.undoDo(true); await flush(); ok(lockCalls.length === n0 && /그사이 다른 기기/.test(last()), '그사이 바뀌었으면 다시 하지 않음', last());

  console.log('⑪ 판 ② 저장 전 칸 고침 — 가격 칸·체크 상자·고르기 상자 · 그사이 바뀌면 안 함 · 저장된 고침은 전체 기록이 · 새것 먼저');
  U.hist.length = 0; U.fut.length = 0; U.skip = null; U.arm = null; newGrp(); const inp = mkEl('input'); inp.type = 'text'; inp.value = '1000'; inp.title = '판매가'; BODY.appendChild(inp);
  fire('focusin', inp); inp.value = '1200'; fire('change', inp); ok(F.UNDO_F.h.length === 1, '사람이 바꾼 칸 = 칸 기록 하나', F.UNDO_F.h.length);
  e = key({}); await flush(); ok(e.pd && inp.value === '1000' && (inp.evs || []).join() === 'input,change' && /칸 되돌림: '판매가'/.test(last()), 'Ctrl+Z(칸 밖) = 바로 전 값 · 화면이 알게 input·change 보냄', [inp.value, inp.evs, last()]);
  ok(U.lastIn === 0, '칸이 다시 저장해도 사람 고침으로 또 기억하지 않음(lastIn 0)');
  e = key({ key: 'y' }); await flush(); ok(inp.value === '1200' && /칸 다시/.test(last()), 'Ctrl+Y = 칸 다시', inp.value);
  e = key({}); await flush(); inp.value = '999'; /* 화면이 다른 값으로 바꿈 */ e = key({ key: 'y' }); await flush(); ok(inp.value === '999' && /그사이 칸 값이 바뀌어/.test(last()), '그사이 칸 값이 바뀌었으면 다시 하지 않음', [inp.value, last()]);
  const cb = mkEl('input'); cb.type = 'checkbox'; cb.checked = false; BODY.appendChild(cb); cb.checked = true; fire('change', cb);
  e = key({ target: cb }); await flush(); ok(e.pd && cb.checked === false, '체크 상자 위 Ctrl+Z = 체크 되돌림(수동 일괄 고르기 같은 저장 전 선택)', cb.checked);
  const sel = mkEl('select'); sel.value = 'a'; BODY.appendChild(sel); fire('focusin', sel); sel.value = 'b'; fire('change', sel);
  e = key({ target: sel }); await flush(); ok(e.pd && sel.value === 'a', '고르기 상자는 글자 되돌리기가 없어 웹앱이 되돌림', sel.value);
  const gone = mkEl('input'); gone.type = 'text'; gone.value = 'x'; BODY.appendChild(gone); fire('focusin', gone); gone.value = 'y'; fire('change', gone); gone.remove();
  newGrp(); STORE.set('app_settings/tabs', { o: 5 }); user(); await doc('app_settings/tabs').set({ o: 6 }, { merge: true }); await flush();
  F.UNDO_F.h.length = 0; F.UNDO_F.f.length = 0; const p2 = mkEl('input'); p2.type = 'text'; p2.value = '10'; BODY.appendChild(p2); NOW += 3000; fire('focusin', p2); p2.value = '20'; fire('change', p2);
  e = key({}); await flush(); ok(p2.value === '10' && st('app_settings/tabs').o === 6, '칸 고침이 더 새것 = 칸 먼저'); e = key({}); await flush(); ok(st('app_settings/tabs').o === 5, '그다음 Ctrl+Z = 웹앱 전체 기록', st('app_settings/tabs'));
  e = key({ key: 'y' }); await flush(); ok(st('app_settings/tabs').o === 6 && p2.value === '10', '다시 하기는 마지막에 되돌린 것부터(전체 기록)'); e = key({ key: 'y' }); await flush(); ok(p2.value === '20', '그다음 다시 = 칸', p2.value);
  U.hist.length = 0; U.fut.length = 0; F.UNDO_F.h.length = 0; F.UNDO_F.f.length = 0; newGrp(); STORE.set('app_settings/tabs', { o: 7 }); const p3 = mkEl('input'); p3.type = 'text'; p3.value = '7'; BODY.appendChild(p3); fire('focusin', p3); p3.value = '8'; fire('change', p3); user(); await doc('app_settings/tabs').set({ o: 8 }, { merge: true }); await flush();
  e = key({}); await flush(); ok(st('app_settings/tabs').o === 7 && F.UNDO_F.h.length === 0, '바로 저장된 칸 고침 = 전체 기록이 되돌리고 칸 기록은 버림(두 번 되돌리지 않음)', [st('app_settings/tabs'), F.UNDO_F.h.length]);
  ok(F.undoFNote && (F.undoFNote(p3, '8', '9'), F.UNDO_F.h.length === 1), 'undoFNote = 다른 곳(listux1 입력 준비)이 칸 기록에 더하는 입구');
  const n0b = gone.evs ? gone.evs.length : 0; F.UNDO_F.h.unshift({ el: gone, b: 'x', a: 'y', at: 0 }); F.UNDO_F.h.length = 1; e = key({}); await flush(); ok((gone.evs ? gone.evs.length : 0) === n0b, '다시 그려져 없어진 칸은 건너뜀');
  F.UNDO_F.h.length = 0; const r1 = mkEl('input'); r1.type = 'text'; r1.id = 'bqp_1'; r1.value = '500'; BODY.appendChild(r1); fire('focusin', r1); r1.value = '600'; fire('change', r1); r1.remove();
  const r2 = mkEl('input'); r2.type = 'text'; r2.id = 'bqp_1'; r2.value = '600'; BODY.appendChild(r2); /* 화면이 다시 그려 같은 칸이 새로 생김 */ e = key({}); await flush(); ok(r2.value === '500', '다시 그려진 같은 칸(id·name·data-…)을 찾아 되돌림', r2.value);
  U.hist.length = 0; U.fut.length = 0; F.UNDO_F.h.length = 0; F.UNDO_F.f.length = 0; newGrp(); const pz = mkEl('input'); pz.type = 'text'; pz.value = '9000'; pz.title = '알라딘 판매가'; BODY.appendChild(pz); fire('focusin', pz); pz.value = '8000'; fire('change', pz);
  user(); await doc('prd_listings/a1').set({ price: 8000 }, { merge: true }); await flush(); NOW += 600; await flush(); /* 되돌리기 기록에 없는 곳(밖으로 나가는 가격)으로 저장됨 */
  e = key({}); await flush(); ok(pz.value === '8000' && /이미 저장됐습니다/.test(bandTxt()) && (pz.evs || []).length === 0, '저장까지 된 칸(기록에 없는 곳·밖으로 나가는 가격) = 칸만 되돌리지 않고 띠로 알림', [pz.value, bandTxt()]);

  console.log('⑩ 설명 — ⌨ 단축키 표·🔍 찾기·설명서·백과');
  ok(KB_G.some(([k]) => k === 'Ctrl + Z') && KB_G.some(([k]) => /Ctrl \+ Y/.test(k)), '⌨ 단축키 표에 Ctrl+Z · Ctrl+Shift+Z/Ctrl+Y');
  ok(FEAT.some((f) => /Ctrl\+Z/.test(f.t)), '🔍 찾기에 되돌리기');
  ok(/id: 'kbd-undo'/.test(T), '📖 백과에 kbd-undo 항목'); ok(/↶ Ctrl\+Z 되돌리기 · ↷ 다시 하기/.test(T), '❓ 설명서에 되돌리기 칸');
  ok(T.includes("if (APPLY_CMD.has(c)) { APPLY.cmd = true; undoSkip('out', path); }"), '맡긴 일(shp_cmds·prd_cmds·crm_cmds)을 보내면 되돌리기 띠에 알림');
  ok((T.match(/addEventListener\('keydown', undoKey\)/g) || []).length === 1 && !/e\.preventDefault\(\); undoDo\(redo\); \}\);/.test(T), 'Ctrl+Z 키 처리는 하나만(옛 처리 바꿈)');

  Date.now = realNow; console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
