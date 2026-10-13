// 가격 감시기 반영 경로 모의 시험 (jsdom + 가짜 Firestore)
const { JSDOM } = require('jsdom'); const fs = require('fs');
const R = __dirname + '/repo/';
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://www.aladin.co.kr/scm/wrecord_edit.aspx', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
for (const f of ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js']) w.eval(fs.readFileSync(R + f, 'utf8'));
// 가짜 Firestore
const store = new Map(); let seq = 0; const now = () => new Date().toISOString();
const clone = (x) => x == null ? x : JSON.parse(JSON.stringify(x));
const applyMerge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__ts) o[k] = now(); else o[k] = clone(x); } return o; };
const mkDoc = (path) => ({ id: path.split('/').pop(), path, get ref() { return mkDoc(path); }, collection: (c) => mkColl(path + '/' + c),
  get: async () => { const v = store.get(path); return { exists: !!v, id: path.split('/').pop(), data: () => clone(v), ref: mkDoc(path) }; },
  set: async (v, o) => { store.set(path, o && o.merge ? applyMerge(store.get(path), v) : applyMerge({}, v)); }, update: async (v) => { store.set(path, applyMerge(store.get(path), v)); }, onSnapshot: () => () => {} });
const match = (v, f, op, val) => { const g = f.split('.').reduce((a, k) => (a == null ? a : a[k]), v); return op === '==' ? g === val : op === 'in' ? val.includes(g) : op === '>=' ? g >= val : false; };
const mkColl = (name) => { const q = (filters) => ({ where: (f, op, val) => q([...filters, [f, op, val]]), limit: () => q(filters), orderBy: () => q(filters), onSnapshot: () => () => {},
    get: async () => { const docs = [...store.entries()].filter(([k, v]) => k.startsWith(name + '/') && k.split('/').length === name.split('/').length + 1 && filters.every(([f, op, val]) => match(v, f, op, val))).map(([k, v]) => ({ id: k.split('/').pop(), data: () => clone(v), ref: mkDoc(k), exists: true })); return { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn) }; } });
  return { ...q([]), doc: (id) => mkDoc(name + '/' + (id || 'auto' + (++seq))) }; };
const db = { collection: mkColl, settings: () => {}, batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; },
  runTransaction: async (fn) => { const ops = []; const tx = { get: (r) => r.get(), set: (r, v, o) => ops.push(() => r.set(v, o)), update: (r, v) => ops.push(() => r.update(v)) }; const out = await fn(tx); if (global.__beforeCommit) { const h = global.__beforeCommit; global.__beforeCommit = null; await h(); } for (const f of ops) await f(); return out; } };
const firebase = { apps: [1], initializeApp: () => {}, firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...x) => ({ __au: x }) } }), auth: () => ({ onAuthStateChanged: (cb) => { setTimeout(() => cb({ email: 't@t' }), 0); return () => {}; } }) };
w.firebase = firebase; const GM = { pw_pc: 'JS-MAIN' }; w.GM_getValue = (k, d) => (k in GM ? GM[k] : d); w.GM_setValue = (k, v) => (GM[k] = v); w.GM_listValues = () => Object.keys(GM); w.GM_deleteValue = (k) => delete GM[k]; w.GM_xmlhttpRequest = () => {};
w.Worker = undefined; w.alert = (m) => console.log('ALERT', m); w.confirm = () => true; w.prompt = () => null;
// 알라딘 가격 바꾸기 요청 흉내: 기록
const sent = []; w.fetch = async (url) => { const u = new w.URL(url, 'https://www.aladin.co.kr'); const price = u.searchParams.get('price') || u.searchParams.get('priceSales') || (String(url).match(/(?:price\w*)=(\d+)/i) || [])[1]; sent.push(String(url)); return { ok: true, status: 200, text: async () => JSON.stringify({ result: true, resultValue: String(price) }) }; };
// 상황 준비
const T0 = Date.now(); const ago = (h) => new Date(T0 - h * 3600e3).toISOString();
store.set('prd_system/pricing', { enabled: false, killSwitch: false, watchPc: 'JS-MAIN', watchTab: 'TAB1', rollout: { treatPct: 0, controlPct: 0 }, dailyCap: 300 });
w.sessionStorage.setItem('pw_tab', 'TAB1');
const dec = (key, st, ap, extra) => store.set('prd_price_decisions/' + key, { key, usedCode: key.slice(7), listingId: 'L' + key.slice(7), title: key, sku: 'BLKCMN', group: 'off', approvalState: st, approval: ap, current: 10000, ...(extra || {}) });
dec('aladin_A', 'manual', { decision: 'batch', price: 9000, at: ago(1), batchId: 'b1', expectPrice: 10000 });
store.set('prd_listings/aladin_A', { status: '판매중', price: 10000, lastSeenAt: ago(2) });
dec('aladin_B', 'manual', { decision: 'batch', at: ago(1), batchId: 'b1' }, { target: 7777 });
dec('aladin_C', 'manual', { decision: 'batch', price: 8000, at: ago(1), batchId: 'b1', expectPrice: 10000 }); store.set('prd_listings/aladin_C', { status: '판매완료', price: 10000, lastSeenAt: ago(0.5) });
dec('aladin_D', 'manual', { decision: 'batch', price: 8000, at: ago(100), batchId: 'b1' });
dec('aladin_E', 'manual', { decision: 'batch', price: 8000, at: ago(1), batchId: 'b1', expectPrice: 10000 }); store.set('prd_listings/aladin_E', { status: '판매중', price: 12000, lastSeenAt: ago(0.5) });
dec('aladin_F', 'manual', { decision: 'batch', price: 8500, at: ago(1), batchId: 'b1' });
dec('aladin_G', 'applying', { decision: 'batch', price: 8500, at: ago(1), batchId: 'b1' }, { applyingAt: ago(1) });
// F: 반영 직전에 사람이 결정을 바꿈 (맡기 트랜잭션 안에서 서버 값이 바뀐 것처럼)
let fHit = false; const origGet = mkDoc;
const src = fs.readFileSync('/home/claude/w/pw/readnow-price-watch.user.js', 'utf8');
global.__hookF = true;
w.eval(src.replace("async function claim(ref, x, kind) {", "async function claim(ref, x, kind) { if (x.key === 'aladin_F' && !globalThis.__fDone) { globalThis.__fDone = 1; await ref.set({ approval: { decision: 'batch', price: 7000, at: new Date().toISOString(), batchId: 'b1' } }, { merge: true }); }"));
setTimeout(() => { const pick = (k) => { const v = store.get('prd_price_decisions/' + k); return `${k.slice(7)}: ${v.approvalState}${v.execNote ? ' — ' + v.execNote : ''}`; };
  console.log(['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((k) => pick('aladin_' + k)).join('\n'));
  console.log('SENT', sent.length, sent.map((u) => (u.match(/(\d{3,})(?!.*\d)/) || [])[0]).join(','));
  console.log('ACTIONS', [...store.entries()].filter(([k]) => k.startsWith('prd_price_actions/') && !/_check/.test(k)).map(([, v]) => `${v.key}:${v.from}->${v.to}:${v.batchId}`).join(' | '));
  console.log('STATE', w.document.querySelector('#pw_state').textContent); process.exit(0); }, 4000);
