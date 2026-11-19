// tEDREFRESH — (11/19 정범님 I-1119-1438-13 · 판본 판 ② 걸음 ①③) 시장 지표를 새로 받을 때 판본 다시 판정
//  · 지표가 바뀌면(중고 수·최저가) edDecide를 다시 불러 판정을 고침 · 같은 판정이면 읽지도 쓰지도 않음 · 판본 검색 기록이 없으면 만들지 않음
//  · 사람이 고른 판(edPick)은 절대 덮지 않음 — 새 판정이 다르면 edRe(「다시 확인」)만 · 사람이 다시 정하면 지움
//  · 지표를 저장·맡기는 모든 지점(등록·수동 일괄·재고 품목·감시·상품 상세·잠금 서랍)에 고리
//  · ⚙ 판본 신호 문턱 edSigCut {auto:95, check:90} — 30번 넘게 맞대 본 신호에만 · 통계가 없으면 판정 그대로(틀만)
// 실행: node tEDREFRESH_1119.js · 시험 자료는 지어낸 책 이름·번호만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'readnow-products-core.js')));
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.join(ROOT, 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (src, a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return src.slice(i, j); };
const P = require(path.join(ROOT, 'readnow-products-core.js'));
const BLK = cut(T, '/* (edall2 판본 판 ② 시작', '/* (edall2 판본 판 ② 끝) */');
const DEL = { __del: 1 }; const AU = (v) => ({ __au: v });
const STORE = new Map(); let reads = 0, writes = 0; const W = [];
const docRef = (c, id) => ({ c, id, get: async () => { reads++; const v = STORE.get(c + '/' + id); return { exists: !!v, data: () => v && JSON.parse(JSON.stringify(v)) }; }, set: async (v) => { writes++; W.push([c, id, v]); } });
const db = { collection: (c) => ({ doc: (id) => docRef(c, id) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v) => { writes++; W.push([r.c, r.id, v]); const k = r.c + '/' + r.id; const o = { ...(STORE.get(k) || {}) }; for (const [a, b] of Object.entries(v)) { if (b === DEL) delete o[a]; else if (b && b.__au) o[a] = [...(o[a] || []), b.__au]; else o[a] = b; } STORE.set(k, o); } }) };
const S = { plist: new Map(), nbm: new Map(), pbooks: new Map(), pmetrics: new Map(), user: { email: 't@x' }, app: {}, prodLoaded: true, pmLoaded: true, nbmLoaded: false }; const toasts = []; let draws = 0;
const env = { S, db, PRDF: () => P, firebase: { firestore: { FieldValue: { delete: () => DEL, arrayUnion: AU } } }, TS: () => 'TS', isMedia: () => false, toast: (m) => toasts.push(m), num: (n) => String(n), esc: (x) => String(x), errKo: (e) => e.message, $: () => null, CSS: { escape: (x) => x },
  slimNbm: (x) => { const { candSig, query, market, ...r } = x || {}; if (market) { const { points, ...m } = market; r.market = m; } return r; }, bump: () => {}, edRedraw: () => { draws++; }, _edC: new WeakMap(), edOf: (l) => (P.edSuspect(l.title).on ? { kw: ['리커버'] } : null), edPickOf: (l) => ((S.nbm.get(l.id) || {}).edPick) || null, edKwHits: () => ['리커버'], stkEkPanel: (l) => `<div data-stkek="${l.id}"></div>`, stkMetSend: async () => ({}), isAdminDevice: () => true,
  p1Scan: (m, fn) => (m.first || []).forEach((x, i) => fn(x.sc, x.price, 'A', !!x.soldOut, i, x.usedCode)), document: { addEventListener: () => {}, querySelectorAll: () => [] } };
const names = Object.keys(env); const F = new Function(...names, BLK + '; return { edOurOf, edJudge, edSigOf, edRefresh, edRefreshMany, edWant, edMetHit, edLiveHit, edRegWant, edRegHit, edReOf, edReTag, edSigCutCfg, edSigStage, edSigApply, edSigCutHtml, edCardBox, ED_SIG_CUT, ED_SIG_MIN };')(...names.map((k) => env[k]));

// 지어낸 상품 — 「가상 고양이 산책 (리커버 특별판)」 · 우리 값 20,000원 · 검색 후보: 자동 지표 상품 자신(같은 판 · 리커버) · 보통판 하나
const ID = 'aladin_900001', BID = '9000001';
const L = { id: ID, usedCode: '900001', bookId: BID, title: '가상 고양이 산책 (리커버 특별판)', price: 20000, isbn13: '9791100000017' }; S.plist.set(ID, L); S.pbooks.set(BID, { title: '가상 고양이 산책 (리커버 특별판)' }); /* 자동 지표 상품도 같은 판(리커버) → 자동 지표 길 */
const ch = (v) => ({ seller: { name: '판매자 중고', min: v, count: 3 } });
const CANDS = [{ itemId: BID, title: '가상 고양이 산책 (리커버 특별판)', cov: 1, vol: true, match: true, channels: ch(18000) }, { itemId: '8000002', title: '가상 고양이 산책', cov: 0.95, vol: true, match: true, channels: ch(4000) }];
const DOC0 = { src: 'usedSearch', usedCode: '900001', title: L.title, at: '2026-11-19T00:00:00Z', cands: CANDS };
const setMet = (n, low) => S.pmetrics.set(BID, { usedTotal: n, first: low ? [{ sc: 's1', price: low, usedCode: '1' }, { sc: 's2', price: low + 1000, usedCode: '2' }] : [] });
const reset = (extra) => { const d = { ...JSON.parse(JSON.stringify(DOC0)), ...(extra || {}) }; STORE.set('prd_market_nobook/' + ID, d); S.nbm.set(ID, env.slimNbm(JSON.parse(JSON.stringify(d)))); W.length = 0; reads = 0; writes = 0; };
(async () => {
  console.log('① 지표가 바뀌면 판정을 고침 · 같으면 쓰지 않음');
  setMet(5, 15000); reset(); const j1 = F.edJudge(L, S.nbm.get(ID), 'detail'); ok(j1 && j1.ed && j1.ed.by === 'app' && j1.ed.re === 'detail' && j1.ed.autoN === 5 && j1.ed.autoLow === 15000, '웹앱 판정 — 수집기와 같은 재료(중고 수·최저가)', j1 && j1.ed);
  ok(j1.ed.evV != null && Array.isArray(j1.ed.ev), '판본 낱말 대조 증거(ev·evV)도 함께');
  setMet(80, 6000); const j2 = F.edJudge(L, S.nbm.get(ID), 'detail'); ok(!!j2.ed.gap && !j1.ed.gap, '중고 80부·최저가 우리 값 절반 아래 → 값 틈 경보가 새로 생김', [j1.ed.gap, j2.ed.gap]);
  ok(F.edSigOf(j1.ed, j1.cands, null) !== F.edSigOf(j2.ed, j2.cands, null), '판정 서명이 달라짐');
  setMet(5, 15000); const S0 = STORE.get('prd_market_nobook/' + ID); S0.ed = j1.ed; S0.cands = j1.cands; S.nbm.set(ID, env.slimNbm(JSON.parse(JSON.stringify(S0)))); reads = 0; writes = 0;
  ok(await F.edRefresh(L, 'detail') === 'same' && reads === 0 && writes === 0, '판정이 같으면 읽지도 쓰지도 않음', [reads, writes]);
  setMet(80, 6000); const r2 = await F.edRefresh(L, 'batch'); const d2 = STORE.get('prd_market_nobook/' + ID);
  ok(r2 === 'chg' && writes === 1 && d2.ed && d2.ed.gap && d2.ed.re === 'batch' && d2.uploadedAt === 'TS' && d2.market && d2.market.n != null, '지표가 바뀌면 그 자리에서 다시 판정해 씀(ed·cands·market)', [r2, writes, d2.ed && d2.ed.gap]);
  ok(Array.isArray(d2.edHist) && d2.edHist.length >= 0 && !('edPick' in W[0][2]), 'edPick은 쓰지 않음');
  ok(S.nbm.get(ID).ed && S.nbm.get(ID).ed.gap && draws > 0, '메모리도 고치고 다시 그림');
  ok(await F.edRefresh(L, 'batch') === 'same', '곧바로 다시 불러도 같음');
  setMet(5, 15000); ok(await F.edRefresh(L, 'batch') === 'soon', '한 상품은 1분에 한 번만 다시 씀');

  console.log('② 사람이 고른 판은 그대로 · 다르면 「다시 확인」만');
  const HP = { itemId: BID, t: '가상 고양이 산책', at: '2026-11-19T01:00:00Z', by: 't@x' }; /* 사람이 「우리 상품 자신(자동 지표) 판」을 고름 */
  setMet(5, 15000); reset({ edPick: HP }); const jh = F.edJudge(L, S.nbm.get(ID), 'detail'); ok(jh.ed.human && !jh.re, '지표가 평범하면 사람 판을 따르고 표시 없음', [jh.ed.use, jh.re]);
  setMet(80, 6000); S._edRfAt = new Map(); const rh = await F.edRefresh(L, 'stock'); const dh = STORE.get('prd_market_nobook/' + ID);
  ok(rh === 're' && dh.edPick && dh.edPick.itemId === BID && dh.edPick.at === HP.at, '새 지표로 다르게 보여도 사람 판(edPick)은 그대로', [rh, dh.edPick]);
  ok(dh.edRe && dh.edRe.hp === BID && dh.edRe.src === 'stock', '「다시 확인」 기록(edRe) 남김', dh.edRe);
  ok(/다시 확인/.test(F.edReTag(L)) && F.edReOf(L), '카드·목록에 「다시 확인」 꼬리표');
  S.nbm.set(ID, { ...S.nbm.get(ID), edPick: { itemId: '8000001', t: 'x' } }); ok(!F.edReOf(L) && F.edReTag(L) === '', '사람이 다른 판으로 다시 정하면 옛 표시는 안 보임');
  setMet(5, 15000); S._edRfAt = new Map(); reset({ edPick: HP, edRe: { hp: BID, use: 'check' } }); const rc = await F.edRefresh(L, 'stock'); const dc = STORE.get('prd_market_nobook/' + ID);
  ok(rc === 'chg' && !dc.edRe && dc.edPick.itemId === BID, '지표가 돌아오면 「다시 확인」을 지움(사람 판은 그대로)', [rc, dc.edRe]);
  ok(/edPick: v \|\| FV\.delete\(\), edPickAt: now, edRe: FV\.delete\(\)/.test(T), '사람이 다시 정하거나 되돌리면(edSetPick) 「다시 확인」 지움');

  console.log('③ 기록 없으면 만들지 않음 · 문 닫힘');
  STORE.delete('prd_market_nobook/' + ID); S.nbm.delete(ID); S._edNbOne = new Set(); S._edRfAt = new Map(); W.length = 0; writes = 0;
  ok(await F.edRefresh(L, 'batch') === 'none' && writes === 0, '판본 검색 기록이 없으면 새로 만들지 않음(검색은 수집기 몫)');
  const L2 = { id: 'aladin_900002', usedCode: '900002', bookId: '9000002', title: '가상 바다 일기', price: 9000 }; ok(await F.edRefresh(L2, 'batch') === 'skip', '판본 낱말 없는 상품은 건드리지 않음');
  S.app.edSearch = false; ok(await F.edRefresh(L, 'batch') === 'skip', '⚙ 판본 검색 끔이면 건드리지 않음'); delete S.app.edSearch;
  S.pmLoaded = false; reset(); ok(await F.edRefresh(L, 'batch') === 'wait', '지표를 다 받기 전엔 기다림'); S.pmLoaded = true;

  console.log('④ 맡긴 상품의 지표가 들어오면 다시 판정');
  S._edWant = new Map(); ok(F.edWant([ID, 'aladin_900002', 'nope'], 'watch') === 1 && S._edWant.get(BID).src === 'watch', '맡긴 상품 기억(판본 낱말 있는 것만)');
  F.edLiveHit('prd_book_metrics', BID, {}, {}); ok(S._edHit && S._edHit.has(BID), '실시간으로 그 책 지표가 오면 다시 판정 대기'); clearTimeout(S._edHitT);
  S._edHit = new Set(); F.edLiveHit('prd_book_metrics', '777', {}, {}); ok(!S._edHit.has('777'), '맡기지 않은 책은 그냥 지나감'); clearTimeout(S._edHitT);
  F.edRegWant([{ isbn: '979-11-0000001-7', title: '가상' }]); S._edWant = new Map(); F.edRegHit({ id: ID, isbn13: '9791100000017' }); await new Promise((r) => setTimeout(r, 5)); ok(S._edWant.has(BID) && S._edWant.get(BID).src === 'reg', '등록한 상품이 들어오면 그 지표를 기다림(24시간)');
  const hooks = [[/function pmPut\(bid, v\)[^\n]*edMetHit\(bid, 1\)/, '상품 상세·잠금 서랍 지표 새로 읽음(pmPut)'], [/map\.set\(c\.doc\.id, coll === 'prd_book_metrics' \? pmMem\(o\) : o\); if \(typeof edLiveHit === 'function'\) edLiveHit\(coll, c\.doc\.id, o, pv\)/, '실시간 받기'], [/async function pmkRequest\(l, auto\) \{ const pid = l\.id; if \(typeof edWant === 'function'\) edWant\(\[pid\], 'detail'\)/, '상품 상세 다시 읽기 맡김'], [/stkMetMem\(P\.go\); if \(typeof edWant === 'function'\) edWant\(P\.go, 'stock'\)/, '재고 품목'], [/k === 'stale'[^\n]*edWant\(keys, 'batch'\)/, '수동 일괄 오래된 지표'], [/edWant\(keys, 'watch'\)/, '감시'], [/async function bMetricsSend[^\n]*edWant\(keys, 'batch'\)/, '수동 일괄 그룹'], [/async function plkMkSend[^\n]*edWant\(keys, 'stock'\)/, '잠금 서랍'], [/if \(okRows\.length\) \{ n \+= okRows\.length; if \(typeof edRegWant === 'function'\) edRegWant\(okRows\)/, '등록']];
  hooks.forEach(([re, m]) => ok(re.test(T), '고리 — ' + m));
  const nMet = (T.match(/type: 'metrics'/g) || []).length; ok(nMet === 6, `지표 맡기는 곳 ${nMet}곳 — 새로 생기면 이 시험에 고리를 더함`, nMet);

  console.log('⑤ ⚙ 판본 신호 문턱(틀만)');
  ok(JSON.stringify(F.edSigCutCfg({})) === JSON.stringify({ auto: 95, check: 90 }) && F.ED_SIG_MIN === 30, '기본 자동 95% · 사람 확인 90% · 30번 넘게');
  const c2 = F.edSigCutCfg({ auto: 120, check: 99 }); ok(c2.auto === 100 && c2.check === 99, '100 넘으면 100'); const c3 = F.edSigCutCfg({ auto: 80, check: 92 }); ok(c3.check === 80, '사람 확인은 자동보다 높을 수 없음'); ok(F.edSigCutCfg({ auto: 10 }).auto === 50, '50 아래는 50');
  ok(F.edSigStage({ n: 30, ok: 30 }) === 'shadow' && F.edSigStage({ n: 31, ok: 31 }) === 'auto' && F.edSigStage({ n: 40, ok: 37 }) === 'check' && F.edSigStage({ n: 40, ok: 30 }) === 'shadow', '30번까지는 그림자 · 넘으면 비율로');
  const R = P.edDecide(F.edOurOf(L), { src: 'usedSearch', cands: JSON.parse(JSON.stringify(CANDS)), at: 'x' }, { th: 0.9 });
  ok(F.edSigApply(R) === R && F.edSigApply(R, {}) === R, '통계가 없으면 판정 그대로(지금)');
  ok(F.edSigApply(R, { kw: { n: 20, ok: 20 } }) === R, '30번 이하 신호는 쓰지 않음');
  const neg = F.edSigApply({ on: true, use: 'srch', ev: [{ k: 'kw', v: -2 }] }, { kw: { n: 50, ok: 49 } }); ok(neg.use === 'check' && neg.hold && neg.sigUsed.length === 1, '믿을 만한 신호가 다르다고 보면 사람 확인으로');
  ok(F.edSigApply({ on: true, use: 'auto', human: true, ev: [{ k: 'kw', v: -2 }] }, { kw: { n: 50, ok: 49 } }).use === 'auto', '사람이 정한 판정은 건드리지 않음');
  ok(/edSigCutHtml\(\)/.test(T) && /edSigCut: c, edSigCutAt/.test(T) && /data-edsigsave/.test(F.edSigCutHtml()), '⚙ 칸·저장(app_settings/main.edSigCut)');
  ok(!/PRDF\(\)\.edSigApply|P\.edSigApply/.test(fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8')), '수집기는 아직 신호 문턱을 쓰지 않음(통계가 생기면 다음 판)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌', e && e.stack); process.exit(1); });
