/* tCLOUDLINK1_1119 — (일꾼 cloudlink1 · 헌장 제42조 · R04 길 (가))
 *  A. 🔖 판 옮김 고리 — cloud/index.js EDLINK-START~EDLINK-END만 떼어 가짜 Firestore로 돌림: prd_relinks(kind 'ed')·prd_inherit 사슬 · 되돌림·거절 뺌 · 돌 막음 · 판매 기록 get(새 코드)에 옛 판매 합침(겹침 뺌 · 훑기는 그대로) · 하루 모습 이어받기(값 바꾼 기록·감시·등록일)
 *  B. 🧪 R04 그림자 판정 — R04S 구역을 실제 가격 코어(readnow-pricing-core.js decide)로 돌림: 실제 판정이 0이어도 「내리자」 처리 무리가 생김 · 감시·확정·잠금 뺌 · 판정 문서·상품·판매가는 안 고침(손해 0 · eng_fence 안 씀) · 끄기 sd:false
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tCLOUDLINK1_1119.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const SRC = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const ML = require(findUp('readnow-ml-core.js'));
const cut = (s, e) => { const a = SRC.indexOf(s), b = SRC.indexOf(e); if (!(a > 0 && b > a)) throw new Error('구역 없음 ' + s); return SRC.slice(SRC.indexOf('*/', a) + 2, b); };
/* 가짜 Firestore — where·select·doc·getAll(fieldMask 무시) */
function fakeDb() { const store = new Map(); const writes = [];
  const docRef = (col, id) => ({ _p: col + '/' + id, id, get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; }, set: async (v, o) => { writes.push(col + '/' + id); const old = (o && o.merge && store.get(col + '/' + id)) || {}; store.set(col + '/' + id, { ...old, ...JSON.parse(JSON.stringify(v)) }); } });
  const colRef = (col, F) => ({ doc: (id) => docRef(col, id), select: () => colRef(col, F), where: (f, op, v) => colRef(col, [...(F || []), [f, op, v]]), get: async () => { const L = [...store.entries()].filter(([k]) => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/')).filter(([, v]) => (F || []).every(([f, op, x]) => (op === '==' ? v[f] === x : op === '>' ? v[f] > x : true))).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)), get: (f) => v[f] })); return { forEach: (f) => L.forEach(f), docs: L, size: L.length }; } });
  const db = { getAll: async (...refs) => { const R = refs.filter((r) => r && r._p); return Promise.all(R.map((r) => r.get())); } };
  return { store, writes, C: (c) => colRef(c), db }; }
const shard = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
(async () => {
console.log('A① 판 옮김 고리 읽기');
const A = fakeDb(); const logs = []; const S = A.store;
S.set('prd_relinks/r1', { kind: 'ed', from: '100', to: '200', fromKey: 'aladin_100', toKey: 'aladin_200' });
S.set('prd_relinks/r2', { kind: 'ed', from: '200', to: '300', fromKey: 'aladin_200', toKey: 'aladin_300' }); /* 두 번 옮김 — 300 → 200 → 100 */
S.set('prd_relinks/r3', { kind: 'ed', from: '400', to: '500', fromKey: 'aladin_400', toKey: 'aladin_500', rejected: true }); /* 거절 */
S.set('prd_relinks/r4', { kind: 'ed', from: '600', to: '700', fromKey: 'aladin_600', toKey: 'aladin_700' }); S.set('prd_inherit/aladin_700', { kind: 'ed', from: 'aladin_600', to: 'aladin_700', fromUc: '600', toUc: '700', undone: true }); /* 되돌림 */
S.set('prd_relinks/r5', { kind: 'bump', from: '800', to: '900' }); /* 다른 종류(다시 올림)는 이 고리가 아님 */
S.set('prd_relinks/r6', { kind: 'ed', from: 'A1', to: 'A2', fromKey: 'aladin_A1', toKey: 'aladin_A2' }); S.set('prd_relinks/r7', { kind: 'ed', from: 'A2', to: 'A1', fromKey: 'aladin_A2', toKey: 'aladin_A1' }); /* 돌 */
S.set('prd_inherit/aladin_1200', { kind: 'ed', from: 'aladin_1100', to: 'aladin_1200', fromUc: '1100', toUc: '1200', undone: false }); /* 장부만 있는 고리 */
const ctxA = { Math, Date, JSON, Object, Array, Number, String, Set, Map, console, Promise, C: A.C, db: A.db, shard, nowIso: () => new Date().toISOString(), log: (...x) => logs.push(x.join(' ')) };
vm.runInNewContext(cut('EDLINK-START', '/* EDLINK-END */') + ';this.edLinks = edLinks; this.EdSales = EdSales; this.edSalesView = edSalesView; this.edInheritRows = edInheritRows;', ctxA);
const E = await ctxA.edLinks(true);
ok(JSON.stringify(E.ucChain('300')) === '["200","100"]' && JSON.stringify(E.keyChain('aladin_300')) === '["aladin_200","aladin_100"]', '두 번 옮긴 상품 — 새 → 옛 → 더 옛 사슬(코드·열쇠)', { u: E.ucChain('300'), k: E.keyChain('aladin_300') });
ok(!E.ucChain('500').length && !E.ucChain('700').length && !E.ucChain('900').length, '거절한 고리·되돌린 물려받기·다른 종류(bump)는 안 씀', { r: E.ucChain('500'), u: E.ucChain('700'), b: E.ucChain('900') });
ok(E.ucChain('A2').length === 1 && E.ucChain('A2')[0] === 'A1', '돌이 생겨도 멈춤(자기 자신으로 돌아오지 않음)', E.ucChain('A2'));
ok(JSON.stringify(E.ucChain('1200')) === '["1100"]' && E.nI === 1 && E.nOff === 1, 'prd_inherit 장부만 있어도 고리 · 되돌림 셈', { c: E.ucChain('1200'), nI: E.nI, nOff: E.nOff });
ok((await ctxA.edLinks()) === E, '10분 기억(다시 안 읽음)');

console.log('A② 판매 기록 — 새 코드로 물으면 옛 판매도');
const raw = new Map([['100', [{ ono: 'o1', at: 1, price: 3000, src: 'crm' }]], ['200', [{ ono: 'o2', at: 2, price: 3100, src: 'crm' }, { ono: 'o1', at: 1, price: 3000, src: 'shp' }]], ['300', [{ ono: 'o3', at: 3, price: 3200, src: 'crm' }]], ['999', [{ ono: 'o9', at: 9, price: 1000, src: 'crm' }]]]);
const V = ctxA.edSalesView(raw, E);
const g300 = V.get('300'); ok(g300.length === 3 && g300.map((x) => x.ono).sort().join() === 'o1,o2,o3' && g300.filter((x) => x.inhFrom).length === 2, '300 = 자기 판매 + 옛 200·100 판매(주문 번호 겹침 뺌 · inhFrom 표시)', g300);
ok(V.get('100').length === 1 && V.get('999').length === 1 && V.get('nope') === undefined, '옛 코드·고리 없는 코드는 그대로');
ok(V.has('300') && !V.has('nope') && V.has('200'), 'has도 이어받음');
{ const M2 = ctxA.edSalesView(new Map([['100', [{ ono: 'x', at: 1, price: 1 }]]]), E); ok(M2.has('300') && M2.get('300').length === 1 && M2.get('300')[0].inhFrom === '100', '새 코드 판매가 없어도 옛 판매를 돌려줌'); }
let tot = 0; for (const L of V.values()) tot += L.length; ok(tot === 5 && V.size === 4 && [...V.entries()].length === 4, '훑기(values·entries·size)는 원래대로 — 합계를 두 번 세지 않음', { tot, size: V.size });
ok(raw.get('300').length === 1, '받은 판매 기록을 고치지 않음(새 목록)');
ok(ctxA.edSalesView(raw, { uc: new Map() }) === raw, '고리가 없으면 원래 Map 그대로');
ok(/try \{ return edSalesView\(out, await edLinks\(\)\); \} catch \(e\) \{ return out; \} \}/.test(SRC), 'mlSales가 고리 보기로 돌려줌(못 읽으면 원래대로)');

console.log('A③ 하루 모습 이어받기');
S.set('prd_listings/aladin_100', { registeredAt: '2026-06-01 10:00', active: false }); S.set('prd_listings/aladin_200', { registeredAt: '2026-09-01 10:00', origRegAt: '2026-07-01T00:00:00+09:00', active: false });
const lastAct = new Map([['aladin_200', { key: 'aladin_200', at: '2026-11-01', from: 5000, to: 4500 }], ['aladin_100', { key: 'aladin_100', at: '2026-10-01', from: 6000, to: 5000 }]]); const watch = new Map([['aladin_100', 'g9']]);
const L = [{ id: 'aladin_300', usedCode: '300', registeredAt: '2026-11-19 09:00' }, { id: 'aladin_999', usedCode: '999', registeredAt: '2026-01-01 09:00' }];
const IH = await ctxA.edInheritRows(L, lastAct, watch); const h = IH.get('aladin_300');
ok(h && h.from === 'aladin_200' && h.act && h.act.to === 4500 && h.wg === 'g9' && h.reg === '2026-06-01 10:00', '새 상품 = 가까운 옛 상품의 마지막 값 바꾼 기록 · 사슬 안 감시 그룹 · 가장 이른 등록일', h);
ok(!IH.has('aladin_999'), '고리 없는 상품은 그대로');
ok(S.get('prd_listings/aladin_100').active === false && A.writes.length === 0, '옛 상품 문서는 읽기만(지우지도 덮지도 않음)', A.writes);
ok(/const inh = await edInheritRows\(L, lastAct, watch\);/.test(SRC) && /lastAct\.get\(l\.id\) \|\| \(h \? h\.act : undefined\)/.test(SRC), 'mlSnapshot이 새 상품 것이 없을 때만 옛 것을 씀');
ok(/if \(q\.relink\)/.test(SRC), '진단 ?relink=1');

console.log('B R04 그림자 판정(실제 가격 코어)');
const B = fakeDb(); const T = B.store; const now = Date.now(); const today = kday(now); const iso = (ms) => new Date(ms).toISOString();
const cx = { console }; cx.window = cx; vm.createContext(cx); for (const f of ['readnow-sellers-core.js', 'readnow-core.js', 'readnow-pricing-core.js']) vm.runInContext(fs.readFileSync(findUp(f), 'utf8'), cx);
const N = { RNC: cx.ReadNowCore, RS: cx.ReadnowSellers, PRC: cx.ReadnowPricing };
const rows = []; for (let i = 0; i < 60; i++) { const uc = String(7000 + i), key = 'aladin_' + uc, hi = i % 2 === 0; const price = hi ? 6000 : 2500;
  T.set('prd_listings/' + key, { active: true, status: '판매중', usedCode: uc, bookId: 'b' + i, price, grade: '상', registeredAt: '2026-08-01T00:00:00+09:00', ...(i === 4 ? { lock: { on: true } } : {}) });
  T.set('prd_book_metrics/b' + i, { lastCheckedAt: iso(now - 3600e3), usedFirstPage: [{ rank: 1, sellerName: 'A', sellerCode: '111', grade: '상', price: 3000, ship: 0, listingId: 'x' + i, usedCode: 'y' + i }, { rank: 2, sellerName: 'B', sellerCode: '222', grade: '상', price: 3500, ship: 0, listingId: 'z' + i, usedCode: 'w' + i }, { rank: 3, sellerName: '리드나우', sellerCode: '996008', grade: '상', price, ship: 0, listingId: 'o' + i, usedCode: uc }] });
  T.set('prd_price_decisions/' + key, { status: 'ok', action: 'none', delta: 0, current: price, at: iso(now - 3600e3), usedCode: uc, ...(i === 2 ? { watch: { gid: 'g1' } } : {}), ...(i === 6 ? { approvalState: 'approved' } : {}) });
  rows.push({ key, price, grade: 1, age: 100 + i, list: 12000, sp: 300, p1: 3, rank: hi ? 3 : 1 }); }
T.set('sellers/sc_111', { sc: '111', rev6m: 500, cancel3m: 0, outstockRate: 0 }); T.set('sellers/sc_222', { sc: '222', rev6m: 500, cancel3m: 0, outstockRate: 0 }); T.set('prd_system/pricing', { engine: {}, rollout: { treatPct: 0, controlPct: 0 } }); T.set('app_settings/ml_state', { lastDay: today });
const logsB = []; const ctxB = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, console, Promise, C: B.C, db: B.db, W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), kday, shard, ENGX_MEM_N: 600, VER: 'test', log: (...x) => logsB.push(x.join(' ')), mlMod: async () => ML, mlLoadDay: async () => rows, mlSales: async () => new Map(), nodeCls: async () => N, autoBbCtx: async () => ({ margin: null, policy: { fee: null, freeOver: null } }) };
vm.runInNewContext(cut('R04S-START', '/* R04S-END */') + ';this.r04ShadowTick = r04ShadowTick; this.r04SdRun = r04SdRun; this.R04S = R04S;', ctxB);
const before = JSON.stringify([...T.entries()].filter(([k]) => k.startsWith('prd_')));
const r = await ctxB.r04ShadowTick(true); const D = T.get('eng_shadow/R04'); const M0 = T.get('eng_shadow_m/R04_00');
ok(r && !r.err && D && D.sd && D.sd.n === 57 && D.sd.drop === 27, '그림자 판정 — 판매중 60 − 감시 1 − 확정 1 − 잠금 1 = 57건 · 비싼 쪽 27건이 「내리자」', D && D.sd);
const Tr = M0.L.filter((m) => m.arm === 'treat'), Cn = M0.L.filter((m) => m.arm === 'control');
ok(Tr.length === 27 && Tr.every((m) => m.d.dec.src === 'shadowDecide' && /그림자 판정/.test(m.d.why) && m.d.dec.target < m.start) && D.cnt.sdTreat === 27, '처리 무리 27 = 그림자 판정 「내리자」(실제 판정은 모두 그대로)', D.cnt);
ok(!Tr.some((m) => ['aladin_7002', 'aladin_7004', 'aladin_7006'].includes(m.key)) && !Cn.some((m) => ['aladin_7002', 'aladin_7004', 'aladin_7006'].includes(m.key)), '감시 그룹·잠금·확정 상품은 처리·대조 모두 아님');
ok(Cn.length > 0 && Cn.every((c) => +c.key.slice(-4) % 2 === 1 && c.pair), '대조는 그림자 판정이 「그대로」라고 본 상품에서만(짝 있음)', Cn.slice(0, 3));
ok(JSON.stringify([...T.entries()].filter(([k]) => k.startsWith('prd_'))) === before && !B.writes.some((w) => /^prd_|^eng_exp|^app_settings\/(strat|eng_fence)|eng_fence/.test(w)), '판정 문서·상품·판매가·eng_fence는 안 고침(손해 0)', B.writes.filter((w) => /^prd_|fence/.test(w)));
ok(D.observeOnly === true && D.loss === 0, '관찰만 · 손해 0');
T.set('app_settings/r04_shadow_cfg', { sd: false }); ctxB.R04S.day = ''; const r2 = await ctxB.r04ShadowTick(true); ok(r2 && r2.sd === null && T.get('eng_shadow/R04').sd === null, '그림자 판정만 끄기 r04_shadow_cfg {sd:false}');
T.set('app_settings/r04_shadow_cfg', { sdMax: 10 }); const sd10 = await ctxB.r04SdRun({ sdMax: 10 }, now, new Set()); ok(sd10.st.n === 10 && sd10.st.of === 59, '하루 몫 sdMax(날마다 다른 조각)', sd10.st);
ok(/r04ShadowTick\(\)/.test(SRC.slice(SRC.indexOf('async function tick('), SRC.indexOf('async function tick(') + 200000)), '/tick이 하루 한 번 부름(그대로)');
console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
