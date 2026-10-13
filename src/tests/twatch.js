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
const sent = []; const USED = { '111': [['L77', 'X77', 8900, '77'], ['LA', 'A', 9500, '996008'], ['L55', 'X55', 9800, '55']], '222': [['L77b', 'Y77', 8900, '77'], ['LB', 'B', 9500, '996008'], ['L55b', 'Y55', 9800, '55']] }; let usedHits = 0;
const usedHtml = (rows) => `<html><body><table class="Ere_usedsell_table">${rows.map(([lid, uc, p, sc]) => `<tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=${lid}">x</a></td><td><div class="Ere_sub_top"><span>상</span></div></td><td><ul class="price"><li><span class="Ere_fs20">${p.toLocaleString()}</span>원</li><li>배송비 : 2,500원</li></ul></td><td class="seller"><a href="/x?SC=${sc || '996008'}">s${sc}</a></td><td><input name="chkCart.${uc}"></td></tr>`).join('')}</table></body></html>`;
w.fetch = async (url) => { if (/wuseditemall/.test(url)) { usedHits++; const id = (String(url).match(/ItemId=(\d+)/) || [])[1]; return { ok: true, status: 200, text: async () => usedHtml(USED[id] || []) }; } const u = new w.URL(url, 'https://www.aladin.co.kr'); const price = u.searchParams.get('price') || u.searchParams.get('priceSales') || (String(url).match(/(?:price\w*)=(\d+)/i) || [])[1]; sent.push(String(url)); return { ok: true, status: 200, text: async () => JSON.stringify({ result: true, resultValue: String(price) }) }; };
// 상황 준비
const T0 = Date.now(); const ago = (h) => new Date(T0 - h * 3600e3).toISOString();
store.set('prd_system/pricing', { enabled: true, killSwitch: false, watchPc: 'JS-MAIN', watchTab: 'TAB1', rollout: { treatPct: 0, controlPct: 0 }, presets: { P1: { name: '끌어내리기 시험', crit: { mode: 'same', colors: [], better: true, bb: false }, eng: {}, chase: { name: 'lure', maxRounds: 3, floorPct: 30, every: 6, detect: { minEvents: 2 } } } } });
w.sessionStorage.setItem('pw_tab', 'TAB1');
store.set('prd_price_batches/G1', { name: '감시1', cond: {}, watch: { on: true, mode: 'semi', presetId: 'P1', apply: 'auto', guardPct: 15 } });
store.set('prd_price_batches/G2', { name: '감시2', cond: {}, watch: { on: true, mode: 'auto', apply: 'approve' } });
store.set('crm_system/shopPolicy', { current: { fee: 2500, freeOver: null } });
store.set('sellers/sc_77', { id: 'sc_77' }); store.set('sellers/sc_55', { id: 'sc_55' });
const L = (uc, bid, grade, price) => store.set('prd_listings/aladin_' + uc, { usedCode: uc, listingId: 'L' + uc, bookId: bid, grade, price, status: '판매중', title: '책' + uc, sku: 'BLKX', lastSeenAt: ago(5), registeredAt: '2026-08-01' });
L('A', 'B1', '상', 9500); L('B', 'B2', '상', 9500); store.set('prd_books/B1', { aladinItemId: '111' }); store.set('prd_books/B2', { aladinItemId: '222' });
store.set('prd_price_decisions/aladin_A', { key: 'aladin_A', usedCode: 'A', listingId: 'LA', approvalState: 'done', approval: { decision: 'batch', batchId: 'G1', at: ago(30), price: 9500 }, watch: { gid: 'G1', startPrice: 10000 } });
store.set('prd_price_decisions/aladin_B', { key: 'aladin_B', usedCode: 'B', listingId: 'LB', approvalState: 'done', approval: { decision: 'batch', batchId: 'G2', at: ago(30), price: 9500 }, watch: { gid: 'G2', startPrice: 10000 } });
for (const k of ['A', 'B']) { store.set('prd_price_actions/h1' + k, { key: 'aladin_' + k, at: ago(72), to: 10000, from: 11000 }); store.set('prd_price_actions/h2' + k, { key: 'aladin_' + k, at: ago(48), to: 9800, from: 10000 }); }
for (const b of ['B1', 'B2']) { store.set('prd_metric_changes/c1' + b, { bookId: b, at: ago(70), chg: [{ sellerCode: '77', f: { price: [9900, 9700] } }] }); store.set('prd_metric_changes/c2' + b, { bookId: b, at: ago(46), chg: [{ sellerCode: '77', f: { price: [9700, 9400] } }] }); }
// F: 반영 직전에 사람이 결정을 바꿈 (맡기 트랜잭션 안에서 서버 값이 바뀐 것처럼)
let fHit = false; const origGet = mkDoc;
const src = fs.readFileSync('/home/claude/w/pw/readnow-price-watch.user.js', 'utf8');
global.__hookF = true;
w.ReadNowCore.classifySellerDoc = () => ({ cls: 'green' }); w.eval(src.replace("async function claim(ref, x, kind) {", "async function claim(ref, x, kind) { if (x.key === 'aladin_F' && !globalThis.__fDone) { globalThis.__fDone = 1; await ref.set({ approval: { decision: 'batch', price: 7000, at: new Date().toISOString(), batchId: 'b1' } }, { merge: true }); }"));
setTimeout(() => { const D = (k) => store.get('prd_price_decisions/aladin_' + k) || {};
  for (const k of ['A', 'B']) { const d = D(k); console.log(k, d.approvalState, 'target', d.target, 'strat', JSON.stringify(d.strat && { phase: d.strat.phase, round: d.strat.round, ourP: d.strat.ourP, nextAt: !!d.strat.nextAt }), 'chaser', d.chaser && d.chaser.price, 'block', JSON.stringify(d.autoBlock), '\n   reasons:', (d.reasons || []).slice(0, 4).join(' / ')); }
  console.log('SENT', sent.filter((u) => !/wuseditemall/.test(u)).map((u) => (u.match(/priceSales=(\d+)/) || [])[1]).join(','));
  console.log('ACTS', [...store.entries()].filter(([k, v]) => k.startsWith('prd_price_actions/') && v.kind).map(([, v]) => `${v.key}:${v.from}->${v.to}:${v.kind}`).join(' | '));
  process.exit(0); }, 75000);
