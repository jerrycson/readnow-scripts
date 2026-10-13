// 브라우저 안 가짜 Firestore + 수집기의 ⏰ 블록만
window.FS = { docs: {}, subs: {} };
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const DEL = { __del: 1 }; const AU = (...x) => ({ __au: x });
function deepMerge(a, b) { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__del) { delete o[k]; continue; } if (v && v.__au) { o[k] = [...(o[k] || []), ...v.__au.filter((x) => !(o[k] || []).some((y) => JSON.stringify(y) === JSON.stringify(x)))]; continue; } o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? deepMerge(o[k], v) : clone(v); } return o; }
function fsSet(path, v, opt) { const cur = FS.docs[path]; FS.docs[path] = opt && opt.merge ? deepMerge(cur, v) : deepMerge({}, v); (FS.subs[path] || []).forEach((cb) => setTimeout(() => cb(snap(path)), 0)); }
const snap = (path) => ({ exists: !!FS.docs[path], data: () => clone(FS.docs[path]) });
window.firebase = { firestore: { FieldValue: { delete: () => DEL, arrayUnion: AU } } };
const ref = (path) => ({ path, get: async () => snap(path), set: async (v, o) => fsSet(path, v, o), onSnapshot: (cb) => { (FS.subs[path] = FS.subs[path] || []).push(cb); setTimeout(() => cb(snap(path)), 0); return () => {}; } });
window.C = (col) => ({ doc: (id) => ref(col + '/' + id) });
window.db = { runTransaction: async (fn) => { const W = []; await fn({ get: async (r) => snap(r.path), set: (r, v, o) => W.push([r.path, v, o]) }); W.forEach(([p, v, o]) => fsSet(p, v, o)); }, batch: () => { const W = []; return { set: (r, v, o) => W.push([r.path, v, o]), commit: async () => W.forEach(([p, v, o]) => fsSet(p, v, o)) }; } };
window.auth = { currentUser: { email: 't@x' }, onAuthStateChanged: (cb) => setTimeout(() => cb(auth.currentUser), 0) };
window.LOGS = []; window.log = (m, e) => LOGS.push((e ? '! ' : '') + m);
window.nowIso = () => new Date(Date.now()).toISOString(); window.SET = {}; window.saveSet = async () => {};
window.GMV = {}; window.GM_getValue = (k, d) => (k in GMV ? GMV[k] : d); window.GM_setValue = (k, v) => { GMV[k] = v; };
window.PC_NAME = 'JS-MAIN'; window.PCS_SEEN = { a: { pcName: 'HOME', tool: '상품 수집기', atMs: Date.now() } };
window.LOCK = () => ({ get: async () => ({ data: () => ({}) }) }); window.laneBusy = () => false;
window.JOBS = { scanDaily: ['상품 조회 (판매중·일시판매중지·판매중지) 새로·바뀐 것'], market: ['도서 정보·시장 지표'], buyback: ['알라딘 팔기 내역'], aladinBuy: ['알라딘 구매 내역 (전체)'], chain: ['모두 일괄 수집'], explore: ['끝없는 탐색 수집'], newThing: ['앞으로 생길 새 일'] };
window.RUNS_CALLED = []; window.JOB_MS = 1200;
