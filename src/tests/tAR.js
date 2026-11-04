// (11/04 wship) 🤖 자동 발송요청 — 정범님 11/04 두 가지
//  ⑨ '선종 영가집 (개정판)': 미등록 상품이라 상품 페이지엔 우리 매물뿐이지만 검색으로 같은 책 다른 판매자 매물을 찾았으면 단독이 아님 (srchOthers · srch)
//  ⑩ '신의 아이들은 모두 춤춘다': 시장 자료 없음으로 검토된 주문 — 시장을 다시 읽게 맡기고(2·4·8…분) 자료가 들어오면 저절로 다시 판단 (autoRetryInit·autoRetryCheck · 클라우드 autoMktRetryTick · 밤 시간 nightMkt)
//  노드(가짜 Firestore) + Playwright(웹앱 🤖 줄·설정 칸)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const row = (c, g, p, extra) => ({ c, g, p, s: 0, so: 0, ...(extra || {}) });
const NOW = Date.parse('2026-11-04T03:00:00Z'); const iso = (ms) => new Date(ms).toISOString();
const ord = (items) => ({ orderNo: 'O1', buyer: '손님A', items }); const it = (lid, price, title) => ({ listingId: lid, title: title || '책' + lid, price, qty: 1, grade: '상' });
const base = { evalSale: ML.evalSale, now: NOW, firstAt: NOW - 60e3 };
// 진단(11/04)으로 본 실제 모양을 줄인 검색 후보 — 우리 상품(scm996008) · 같은 제목 · 다른 말이 붙은 제목 · 값 없는(새책 카탈로그) 후보
const srchRows = [
  { itemId: '194807575', title: '선종 영가집', cov: 1, vol: true, match: true, ours: false, ps: 10000 },
  { itemId: '399231321', title: '선종 영가집 (개정판)', cov: 1, vol: true, match: true, ours: true, ps: 9000 },
  { itemId: '273254585', title: '선종영가집', cov: 1, vol: true, match: true, ours: false, ps: 15000 },
  { itemId: '319628660', title: '선종영가집 (1977 초판)', cov: 1, vol: true, match: true, ours: false, ps: 10000 },
  { itemId: '254235140', title: '선종영가집 해설', cov: 1, vol: true, match: true, ours: false },
  { itemId: '372977741', title: '선종영가집언해 (상.하) 합본 - 영인본', cov: 1, vol: true, match: true, ours: false, ps: 40000 },
  { itemId: '133985231', title: '선종영가집언해 1~3 세트 - 전3권', cov: 1, vol: false, match: false, ours: false, ps: 30000 } ];
const ownMkt = (extra) => ({ mkt: { at: iso(NOW - 120e3), rows: [row('ours', '상', 9000, { sc: '996008', lid: 'L1' })], usedTotal: 1, np: null, isbnOk: null }, via: 'ours', itemId: '399231322', isbn: null, srchNeed: true, ...(extra || {}) });
const S_ = (rows, at, extra) => ({ at: at || iso(NOW - 100e3), src: 'cloud', q: '선종 영가집', rows, ...(extra || {}) });

console.log('⑨ 미등록 상품 — 검색으로 찾은 같은 책');
{ let D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt() } });
  ok(D.state === 'review' && D.kinds.includes('alone'), '검색 자료가 없으면 예전처럼 단독 매물 → 검토');
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srch: S_(srchRows) }) } }); const P = D.items[0];
  ok(D.state === 'pass' && !D.kinds.includes('alone'), '검색으로 같은 책 다른 판매자 매물을 찾았으면 단독 아님 → 통과(9,000 vs 최저 10,000 = -10%)');
  ok(P.srchN === 3 && P.srchMin === 10000 && P.srchLoose === 1 && P.rule0 === 'srch' && /검색으로 찾은 같은 책 다른 판매자 매물 3개/.test(P.why), `같은 책 3개(제목 본문이 같음) · 애매 1개(영인본) · 우리 상품·권 번호 다른 세트·값 없는 후보(해설)는 뺌: ${P.why}`);
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 6000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srch: S_(srchRows) }) } });
  ok(D.state === 'review' && D.kinds.includes('cheap') && /검색으로 찾은 같은 책 다른 판매자 최저가 10,000원보다 40% 쌈/.test(D.reasons.join(' ')), '검색 최저가보다 25% 넘게 싸면 검토(25% 규칙과 같은 기준): ' + D.reasons.join(' / '));
  const loose = srchRows.filter((r) => /해설|영인본/.test(r.title) || r.ours).map((r) => (/해설/.test(r.title) ? { ...r, ps: 12000 } : r));
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srch: S_(loose) }) } });
  ok(D.state === 'review' && D.kinds.includes('alone') && /같은 책인지 애매/.test(D.reasons.join(' ')) && /선종영가집 해설/.test(D.reasons.join(' ')), '이름만 비슷한 매물뿐 → 같은 책인지 애매 — 검토 · 까닭에 후보 이름: ' + D.reasons.join(' / '));
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srch: S_(srchRows, iso(NOW - 10 * 864e5)) }) } });
  ok(D.state === 'review' && D.kinds.includes('alone') && /10일 전 것이라 쓰지 않음/.test(D.reasons.join(' ')), '검색 자료가 7일(설정 srchDays)보다 오래면 쓰지 않음 → 단독 검토 · 까닭 적음');
  D = SH.autoShipDecide({ ...base, cfg: { srchOn: false }, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srch: S_(srchRows) }) } });
  ok(D.state === 'review' && D.kinds.includes('alone'), '설정 srchOn 끄면 검색 자료를 안 씀(예전과 같음)');
  // 상품 페이지 자체를 못 읽음(상품 번호 못 찾음 mktErr) — 검색으로 판단
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: { mktErr: '알라딘 상품번호를 못 찾음', at: iso(NOW - 60e3), srchNeed: true, srch: S_(srchRows) } } });
  ok(D.state === 'pass' && D.items[0].mkt === 'srch', '상품 페이지를 못 읽어도(mktErr) 검색으로 찾은 같은 책으로 판단 → 통과');
  D = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: { mktErr: '알라딘 상품번호를 못 찾음', at: iso(NOW - 60e3), srchNeed: true, srch: S_(loose) } } });
  ok(D.state === 'review' && D.kinds.includes('nomkt') && /같은 책인지 애매/.test(D.reasons.join(' ')), '못 읽음 + 검색은 애매뿐 → 시장 자료 없음 검토 · 애매 까닭 같이');
  // 검색 줄 모양 둘 다(클라우드 ps·수집기 channels)
  const R2 = SH.srchOthers({ q: '선종 영가집', at: iso(NOW), rows: [{ itemId: '1', title: '선종 영가집', match: true, cov: 1, channels: { seller: { min: 11000, count: 2 }, aladin: { min: 8000 } } }, { itemId: '2', title: '선종 영가집', match: true, img: 'https://image.aladin.co.kr/x/scm996008_1.jpg', channels: { seller: { min: 5000 } } }] }, [], {}, NOW);
  ok(R2.sure.length === 1 && R2.min === 8000, '수집기 검색 시세 모양(channels)도 받음 · 사진 주소 scm996008 = 우리 상품은 뺌 · 알라딘 중고 값도 견줌');
  ok(SH.srchNorm('[중고] 선종영가집/1986년초판본') === SH.srchNorm('선종 영가집') && SH.srchNorm('禪宗永嘉集(선종영가집)') !== SH.srchNorm('선종 영가집'), '제목 본문 비교: 끝 (..)·/ 뒤 뗌 · 띄어쓰기 무시'); }

console.log('⑩ 시장 자료 없음 — 다시 읽기 계획·다시 판단(공용 판정)');
{ const order = ord([it('A', 9000, '신의 아이들은 모두 춤춘다')]);
  let D = SH.autoShipDecide({ ...base, firstAt: NOW - 11 * 60e3, order, enrich: {} });
  ok(D.state === 'review' && D.kinds.join() === 'nomkt', '10분 기다려도 시장 없음 → 검토(nomkt)');
  const R = SH.autoRetryInit(D, {}, NOW); ok(R && R.on && R.n === 0 && R.lids.join() === 'A' && Date.parse(R.next) === NOW + 2 * 60e3, '다시 읽기 계획: 그 상품 · 2분 뒤 첫 다시 읽기');
  const D2 = SH.autoShipDecide({ ...base, firstAt: NOW - 11 * 60e3, order: ord([it('A', 9000), it('B', 1000)]), enrich: { B: { mkt: { at: iso(NOW), rows: [row('green', '상', 9000)], isbnOk: true }, via: 'ours' } } });
  ok(D2.kinds.includes('cheap') && SH.autoRetryInit(D2, {}, NOW) === null, '다른 검토 이유(싼 값)가 같이 있으면 계획 안 함(다시 판단해도 검토)');
  ok(SH.autoRetryInit(D, { mktRetryOn: false }, NOW) === null, '설정 mktRetryOn 끄면 계획 안 함');
  const v = { state: 'review', kinds: D.kinds, items: D.items, decidedAt: iso(NOW), mktRetry: R };
  let X = SH.autoRetryCheck(v, {}, NOW + 60e3, {}); ok(X.act === 'wait', '다음 시각 전 → 기다림');
  X = SH.autoRetryCheck(v, {}, NOW + 2 * 60e3, {}); ok(X.act === 'reread' && X.n === 1 && Date.parse(X.next) === NOW + 2 * 60e3 + 4 * 60e3 && X.lids.join() === 'A', '2분 뒤 → 다시 읽기 맡김 1번째 · 그다음은 4분 뒤');
  ok([0, 1, 2, 3, 4, 5, 6, 9].map(SH.retryGapMin).join() === '2,4,8,16,32,60,60,60', '간격 2·4·8·16·32·60·60…분(클라우드 시장 읽기 실패 뒤 다시 간격과 같음)');
  X = SH.autoRetryCheck(v, { A: { mktFail: { n: 3, msg: '시간 초과', next: iso(NOW + 30 * 60e3) } } }, NOW + 3 * 60e3, {}); ok(X.act === 'wait' && Date.parse(X.next) === NOW + 30 * 60e3, '그 상품이 실패 중이면 실패 뒤 다시 시각(mktFail.next)까지 기다림');
  X = SH.autoRetryCheck(v, { A: { mktErr: '알라딘 상품번호를 못 찾음', at: iso(NOW) } }, NOW + 10 * 60e3, {}); ok(X.act === 'wait' && Date.parse(X.next) === NOW + 60 * 60e3, '상품 번호를 못 찾은 상품은 1시간 뒤');
  X = SH.autoRetryCheck(v, { A: { mkt: { at: iso(NOW + 5 * 60e3), rows: [row('green', '상', 10000)], isbnOk: true }, via: 'ours' } }, NOW + 5 * 60e3, {}); ok(X.act === 'rejudge' && /시장 자료가 들어옴/.test(X.why), '시장 자료가 들어오면 → 다시 판단');
  X = SH.autoRetryCheck(v, { A: { mkt: { at: iso(NOW), rows: [], isbnOk: false }, via: 'search' } }, NOW + 5 * 60e3, {}); ok(X.act !== 'rejudge', '이름으로 찾은 시장(다른 판일 수 있음)은 들어온 것으로 안 봄');
  X = SH.autoRetryCheck({ ...v, mktRetry: { ...R, n: 12 } }, {}, NOW + 9e6, {}); ok(X.act === 'stop' && X.end === 'max', '12번(설정 mktRetryMax) 다시 읽어도 없으면 멈춤 — 사람이 확인');
  X = SH.autoRetryCheck({ ...v, state: 'sent' }, {}, NOW, {}); ok(X.act === 'stop', '검토가 아니면(이미 다시 판단·사람이 처리) 멈춤');
  X = SH.autoRetryCheck({ ...v, mktRetry: null }, {}, NOW, {}); ok(X.act === 'init', '옛 판단 기록(계획 없음) → 계획을 새로 시작');
  // 단독(옛 판단) + 판단 뒤 검색 자료가 들어옴 → 다시 판단
  const Da = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt({ srchNeed: undefined }) } });
  const va = { state: 'review', kinds: Da.kinds, items: Da.items, decidedAt: iso(NOW) };
  ok(SH.autoRetryCheck(va, { L1: ownMkt() }, NOW + 60e3, {}).act === 'none', '단독(검색 자료 없음) — 할 일 없음');
  ok(SH.autoRetryCheck(va, { L1: ownMkt({ srch: S_(srchRows, iso(NOW + 30e3)) }) }, NOW + 60e3, {}).act === 'rejudge', '판단 뒤 검색으로 같은 책을 찾으면 → 다시 판단');
  const Dw = SH.autoShipDecide({ ...base, order: ord([it('L1', 9000, '선종 영가집 (개정판)')]), enrich: { L1: ownMkt() } });
  ok(Dw.items[0].srchWait && SH.autoRetryInit(Dw, {}, NOW).lids.join() === 'L1', 'ISBN 없는 상품인데 검색 자료가 아직 없음 → 검색을 기다리는 상품으로 계획');
  ok(/2번째 맡김 · 다음 \d\d:\d\d/.test(SH.autoRetryTxt({ mktRetry: { on: true, n: 2, next: iso(NOW) } })) && /12번 다시 읽어도/.test(SH.autoRetryTxt({ mktRetry: { on: false, n: 12, end: 'max' } })), '화면 글: 다시 읽는 중 n번째 · 다음 시각 / 멈춤 까닭'); }

/* ── 가짜 Firestore (tR과 같은 모양 + 점 이름(mktRetry.on)·>= 거르기) ── */
function mkStore() { const store = {}; const col = (c) => (store[c] = store[c] || {}); let txQ = Promise.resolve();
  const AU = (v) => (v && v.__au ? v : null); const mergeSet = (old, v) => { const o = { ...(old || {}) }; for (const [k, x] of Object.entries(v)) o[k] = AU(x) ? [...(o[k] || []), ...x.__au] : x; return o; };
  const ref = (c, id) => ({ id, _c: c, get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { col(c)[id] = o && o.merge ? mergeSet(col(c)[id], v) : mergeSet(null, v); }, create: async (v) => { if (col(c)[id]) throw new Error('ALREADY_EXISTS'); col(c)[id] = v; }, update: async (v) => { col(c)[id] = { ...(col(c)[id] || {}), ...v }; } });
  const dig = (d, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), d);
  const match = (d, [k, o, x]) => { const y = dig(d, k); return o === '==' ? y === x : o === '>=' ? String(y || '') >= x : o === 'in' ? x.includes(y) : o === 'array-contains' ? Array.isArray(y) && y.includes(x) : true; };
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + Math.random().toString(36).slice(2, 8)), add: async (v) => { const id = 'a' + Math.random().toString(36).slice(2, 8); col(c)[id] = v; return ref(c, id); }, where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, orderBy: () => q, limit: () => q, get: async () => { const docs = Object.entries(col(c)).filter(([, d]) => q._f.every((f) => match(d, f))).map(([id, d]) => ({ id, ref: ref(c, id), data: () => d })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } }; return q; } });
  const db = { runTransaction: (fn) => { const run = txQ.then(async () => { const w = []; const tx = { get: async (r) => r.get(), set: (r, v, o) => w.push(() => r.set(v, o)), update: (r, v) => w.push(() => r.update(v)) }; const out = await fn(tx); for (const f of w) await f(); return out; }); txQ = run.catch(() => {}); return run; } };
  return { store, col, C, db }; }
const clSrc = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const ca = clSrc.indexOf("/* (11/04 정범님 '신의 아이들은 모두 춤춘다 — 시장 자료 없음을"); const cb = clSrc.indexOf('async function shipNotifyTick'); const wonDef = clSrc.match(/const wonT = [^\n]*/)[0];
function cloudCtx(F, extra) { const pushes = []; const logs = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: 'cloud' }), FV: { serverTimestamp: () => 'TS', arrayUnion: (...a) => ({ __au: a }) }, nowIso: () => new Date().toISOString(), log: (...a) => logs.push(a.join(' ')), VER: '0.t', kickFlag: false, lastConfirm: [], lastConfirmAt: new Date().toISOString(), confirmDocAt: 0, enrichMem: new Map(),
    shipCoreNode: () => SH, mlMod: async () => ML, pushSend: async (n, p, k) => { pushes.push({ k, p }); return { ok: 1 }; }, Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number, ...(extra || {}) };
  vm.runInNewContext(wonDef + '\n' + clSrc.slice(ca, cb) + '\nthis.shipAutoTick = shipAutoTick; this.autoMktRetryTick = autoMktRetryTick; this.mem = autoMem; this.amrReset = () => { amrAt = 0; };', ctx); return { ctx, pushes, logs }; }
const colSrc = fs.readFileSync(path.join(__dirname, '../readnow-collector.user.js'), 'utf8');
const pa = colSrc.indexOf('  const AU = { mem: new Map()'); const pb = colSrc.indexOf('  window.__rnAutoShipPc = (orders) => autoShipPc(orders);');
function pcCtx(F, name) { const ran = []; const ctx = { C: F.C, db: F.db, W: () => ({ writer: name }), TS: () => 'TS', nowIso: () => new Date().toISOString(), log: () => {}, PC_NAME: name, APP_VER: '1.89.t', PUBONLY: false, auth: { currentUser: { email: 'x' } }, pcLoggedNow: () => true, runCmd: async (id) => { ran.push(id); }, setTimeout: (f) => f(), Date, Math, String, JSON, Object, Array, Set, Map, Promise, Number, isFinite,
    window: { ReadnowShipping: SH, ReadnowML: ML, __rnFeat: () => true }, globalThis: {} };
  vm.runInNewContext(colSrc.slice(pa, pb) + '\nthis.autoShipPc = autoShipPc; this.AU = AU;', ctx); return { ctx, ran }; }
const ordAt = (min) => { const d = new Date(Date.now() + 9 * 3600e3 - min * 60e3); return d.toISOString().slice(0, 16).replace('T', ' '); };
const E = (rows) => ({ mkt: { at: new Date().toISOString(), rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours' });

(async () => {
  console.log('⑩ 클라우드 autoMktRetryTick — 다시 읽기 맡김 · 자료가 들어오면 다시 판단 · 사람 몫은 건드리지 않음');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 864e5).toISOString() };
    const o = { orderNo: 'N-1', buyer: '손님A', orderedAt: ordAt(15), items: [{ listingId: 'A', title: '신의 아이들은 모두 춤춘다', price: 9000, qty: 1, grade: '상' }] };
    // 11분 전에 처음 본 주문 — 시장 없음 → 클라우드가 검토로 정함(+ 다시 읽기 계획)
    F.col('shp_auto')['N-1'] = { orderNo: 'N-1', state: 'wait', firstAt: new Date(Date.now() - 11 * 60e3).toISOString(), at: new Date().toISOString() };
    const cl = cloudCtx(F); cl.ctx.lastConfirm = [o]; await cl.ctx.shipAutoTick({ enrich: {} }, { cmds: true, confirm: true });
    let A = F.col('shp_auto')['N-1']; ok(A.state === 'review' && A.kinds.join() === 'nomkt' && A.mktRetry && A.mktRetry.on && A.mktRetry.lids.join() === 'A', '시장 없음 검토 → 판단 기록에 다시 읽기 계획(mktRetry)');
    ok(cl.pushes.filter((x) => x.k === 'autorev').length === 1, '처음 검토 알림은 한 번');
    // 2분 지남 → 다시 읽기 맡김
    A.mktRetry.next = new Date(Date.now() - 1000).toISOString(); cl.ctx.amrReset(); let r = await cl.ctx.autoMktRetryTick();
    const K = F.col('shp_cmds'); const kid = Object.keys(K).find((k) => /^mkr_N-1_1$/.test(k));
    ok(r && r.rd === 1 && kid && K[kid].type === 'market' && K[kid].listingIds.join() === 'A' && K[kid].status === 'queued' && K[kid].auto === true, '정한 시각 → 시장 다시 읽기 맡김(shp_cmds type market · 그 상품만)');
    A = F.col('shp_auto')['N-1']; ok(A.mktRetry.n === 1 && A.mktRetry.cmd === kid && Date.parse(A.mktRetry.next) > Date.now() + 3 * 60e3 && cl.ctx.kickFlag === true, '1번째 맡김 기록 · 다음은 4분 뒤 · 클라우드 회차 깨움');
    cl.ctx.amrReset(); r = await cl.ctx.autoMktRetryTick(); ok(!r && !K['mkr_N-1_2'], '다음 시각 전엔 또 맡기지 않음');
    // 시장 자료가 들어옴 → 대기로 되돌림 → 다음 판단에서 통과
    F.col('shp_enrich').A = E([row('green', '상', 10000)]); cl.ctx.amrReset(); r = await cl.ctx.autoMktRetryTick();
    A = F.col('shp_auto')['N-1']; ok(r && r.rj === 1 && A.state === 'wait' && A.rejudge && A.rejudge.auto === 'mkt' && A.rejudge.prev.state === 'review' && (A.rjHist || []).length === 1 && A.mktRetry.on === false && A.mktRetry.end === 'rejudge', '자료가 들어오면 → 대기로 되돌림 · 전 판단은 rejudge.prev·rjHist에 남김');
    ok(F.col('app_settings').ship_auto.rejudgeOrders.includes('N-1') && F.col('app_settings').ship_auto.rejudgeAt, 'PC가 판단 중일 때를 위해 rejudgeAt·rejudgeOrders 남김');
    await cl.ctx.shipAutoTick({ enrich: { A: F.col('shp_enrich').A } }, { cmds: true, confirm: true }); A = F.col('shp_auto')['N-1'];
    ok(A.state === 'sent' && F.col('shp_cmds')['auto_N-1'] && F.col('shp_cmds')['auto_N-1'].type === 'startDelivery', '다시 판단 → 통과 → 자동 발송요청(발송준비시작 맡김)');
    // 사람이 맡긴 주문 · 목록에서 빠진 주문 · 다른 이유
    const F2 = mkStore(); F2.col('app_settings').ship_auto = { on: true };
    const R0 = { on: true, n: 0, lids: ['B'], at: new Date().toISOString(), next: new Date(Date.now() - 1000).toISOString() };
    F2.col('shp_auto')['H-1'] = { orderNo: 'H-1', state: 'review', kinds: ['nomkt'], items: [{ lid: 'B', mkt: 'none' }], decidedAt: new Date().toISOString(), mktRetry: { ...R0 } };
    F2.col('shp_cmds').cx1 = { type: 'cancelOrder', orderNos: ['H-1'], status: 'queued' };
    F2.col('shp_auto')['G-1'] = { orderNo: 'G-1', state: 'review', kinds: ['nomkt'], items: [{ lid: 'C', mkt: 'none' }], decidedAt: new Date().toISOString(), mktRetry: { ...R0, lids: ['C'] } };
    F2.col('shp_auto')['X-1'] = { orderNo: 'X-1', state: 'review', kinds: ['nomkt', 'cheap'], items: [{ lid: 'D', mkt: 'none' }], decidedAt: new Date().toISOString(), mktRetry: { ...R0, lids: ['D'] } };
    const c2 = cloudCtx(F2); c2.ctx.lastConfirm = [{ orderNo: 'H-1', items: [] }, { orderNo: 'X-1', items: [] }]; F2.col('shp_enrich').B = E([row('green', '상', 10000)]);
    r = await c2.ctx.autoMktRetryTick(); const H = F2.col('shp_auto')['H-1'], G = F2.col('shp_auto')['G-1'], X1 = F2.col('shp_auto')['X-1'];
    ok(H.state === 'review' && H.mktRetry.on === false && H.mktRetry.end === 'human', '사람이 ✖ 취소를 맡긴 주문 → 시장이 들어와도 다시 판단 안 함(멈춤 human)');
    ok(G.state === 'review' && G.mktRetry.end === 'gone', '주문확인요청에서 빠진 주문 → 멈춤(gone)');
    ok(X1.state === 'review' && X1.mktRetry.end === 'other' && !Object.keys(F2.col('shp_cmds')).some((k) => /^mkr_/.test(k)), '다른 검토 이유가 같이 있으면 멈춤 · 다시 읽기 안 맡김');
    // 옛 기록(계획 없음) — 30분마다 2일 안 검토 중 시장 자료 없음·단독뿐인 것
    const F3 = mkStore(); F3.col('app_settings').ship_auto = { on: true }; F3.col('shp_auto')['Old-1'] = { orderNo: 'Old-1', state: 'review', kinds: ['nomkt'], items: [{ lid: 'Z', mkt: 'none' }], decidedAt: new Date(Date.now() - 10 * 3600e3).toISOString() };
    F3.col('shp_enrich').Z = E([row('green', '상', 10000)]); const c3 = cloudCtx(F3); c3.ctx.lastConfirm = [{ orderNo: 'Old-1', items: [] }]; await c3.ctx.autoMktRetryTick();
    ok(F3.col('shp_auto')['Old-1'].state === 'wait' && F3.col('shp_auto')['Old-1'].rejudge.auto === 'mkt', '고치기 전 판단 기록(어젯밤 시장 자료 없음 검토)도 자료가 있으면 다시 판단'); }

  console.log('⑩ PC 수집기 — 검토 기록에 계획 · 클라우드가 되돌리면 PC가 다시 판단');
  { const F = mkStore(); F.col('app_settings').ship_auto = { on: true, since: new Date(Date.now() - 864e5).toISOString() };
    F.col('shp_auto')['P-9'] = { orderNo: 'P-9', state: 'wait', firstAt: new Date(Date.now() - 11 * 60e3).toISOString(), at: new Date().toISOString() };
    const o = { orderNo: 'P-9', buyer: '손님A', orderedAt: ordAt(15), items: [{ listingId: 'Q', title: '책Q', price: 9000, qty: 1, grade: '상' }] };
    const pc = pcCtx(F, 'JS-MAIN'); await pc.ctx.autoShipPc([o]); let A = F.col('shp_auto')['P-9'];
    ok(A.state === 'review' && A.by === 'JS-MAIN' && A.mktRetry && A.mktRetry.on && A.pushWant === true, 'PC가 시장 없음 검토 → 계획(mktRetry) · 알림은 클라우드(pushWant)');
    F.col('shp_enrich').Q = E([row('green', '상', 10000)]); const cl = cloudCtx(F); cl.ctx.lastConfirm = [o]; await cl.ctx.autoMktRetryTick();
    ok(F.col('shp_auto')['P-9'].state === 'wait', '클라우드가 대기로 되돌림');
    pc.ctx.AU.cfgAt = 0; await pc.ctx.autoShipPc([o]); A = F.col('shp_auto')['P-9'];
    ok(A.state === 'sent' && pc.ran.includes('auto_P-9'), 'PC가 rejudgeAt을 보고 기억을 지워 다시 판단 → 통과 → 그 PC가 바로 발송준비시작'); }

  console.log('⑩ 밤 시간 — PC가 5분마다 읽는 동안에도 클라우드가 새 주문 시장을 읽음(nightMkt)');
  { ok(/async function nightMkt\(J, pf\)/.test(clSrc) && /const nm = await nightMkt\(J, pf\)/.test(clSrc), '밤에 회차를 쉬는 길에서 nightMkt(PC 목록 · 공개 화면 시장만)');
    const fn = clSrc.match(/async function nightMkt\(J, pf\)[\s\S]*?\n  return \{ n: cr\.n, enrich: en, auto: au \}; \}/)[0]; const calls = [];
    const ctx = { NIGHT: { mkAt: null }, lastConfirm: [], enrichMem: new Map(), skipUntil: new Map(), mktForce: new Map(), Date, String, loginQuiet: false,
      confirmFromPc: async () => { calls.push('list'); return { n: 1, enrich: {} }; }, getPage: async () => ({}), enrichConfirm: async () => { calls.push('enrich'); return { n: 1 }; }, mktJobsTick: async () => null, shipAutoTick: async () => { calls.push('auto'); return null; } };
    vm.runInNewContext(fn + '\nthis.nightMkt = nightMkt;', ctx);
    let r = await ctx.nightMkt({ enrich: true }, { pc: 'JS-MAIN', changed: false, at: 'a' }); ok(r === null && !calls.length, '목록이 그대로이고 시장을 못 읽은 상품이 없으면 쉼(밤 간격 그대로)');
    r = await ctx.nightMkt({ enrich: true }, { pc: 'JS-MAIN', changed: true, at: 't1' }); ok(r && calls.join() === 'list,enrich,auto', 'PC가 목록을 바꿨으면 → PC 목록으로 시장 읽기 → 자동 판단');
    calls.length = 0; r = await ctx.nightMkt({ enrich: true }, { pc: 'JS-MAIN', changed: true, at: 't1' }); ok(r === null, '같은 바뀜은 한 번만');
    ctx.lastConfirm = [{ orderNo: 'Z', items: [{ listingId: 'M' }] }]; r = await ctx.nightMkt({ enrich: true }, { pc: 'JS-MAIN', changed: false, at: 't1' }); ok(r && calls.includes('enrich'), '목록에 시장을 아직 못 읽은 상품이 있으면 계속 읽음');
    calls.length = 0; ctx.skipUntil.set('M', Date.now() + 60e3); r = await ctx.nightMkt({ enrich: true }, { pc: 'JS-MAIN', changed: false, at: 't1' }); ok(r === null, '그 상품이 실패 뒤 기다리는 중이면(skipUntil) 쉼 — 실패 뒤 다시 간격 그대로'); }

  console.log('⑨ 클라우드 srchOf — 바깥 중고 검색 · 못 읽으면 수집기 검색 시세');
  { const fn = clSrc.match(/const srchSlim = [^\n]*/)[0] + '\n' + clSrc.match(/async function srchOf\(p, title, self, key\)[\s\S]*?\n  return \{ at, src: 'cloud', q: null, rows: \[\], err \}; \}/)[0];
    const F = mkStore(); F.col('prd_market_nobook').K1 = { src: 'usedSearch', at: '2026-10-19T13:48:53Z', query: '선종 영가집', cands: [{ itemId: '1', title: '선종 영가집', cov: 1, vol: true, match: true, ours: false, channels: { seller: { min: 10000, count: 1 } } }] };
    const ctx = { C: F.C, nowIso: () => new Date().toISOString(), String, Promise }; vm.runInNewContext(fn + '\nthis.srchOf = srchOf;', ctx);
    let S0 = await ctx.srchOf({ evaluate: async () => ({ q: '선종 영가집', rows: [{ itemId: '1', title: '선종 영가집', cov: 1, vol: true, match: true, channels: { seller: { min: 10000, count: 2 } } }, { itemId: '2', title: '딴책', cov: 0.3 }] }) }, '선종 영가집 (개정판)', '399231322', 'K1');
    ok(S0.src === 'cloud' && S0.rows.length === 1 && S0.rows[0].ps === 10000 && S0.rows[0].pn === 2 && S0.q === '선종 영가집', '검색 결과를 줄인 모양으로(이름 50% 넘는 후보만 · 값·개수)');
    S0 = await ctx.srchOf({ evaluate: async () => { throw new Error('화면 닫힘'); } }, '선종 영가집 (개정판)', null, 'K1');
    ok(S0.src === 'nobook' && S0.at === '2026-10-19T13:48:53Z' && S0.rows[0].ps === 10000 && /화면 닫힘/.test(S0.err), '검색을 못 읽으면 수집기 검색 시세(그때 시각 그대로 — 오래되면 판단이 안 씀)'); }

  console.log('웹앱 🤖 줄 · 설정 칸 (Playwright)');
  await new Promise((res) => require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const pe = []; p.on('pageerror', (e) => pe.push(e.message));
    const r = await p.evaluate(() => { S.shipAutoCfg = { on: true, beatAt: new Date().toISOString(), beatBy: 'JS-MAIN' }; S._saW = 1; const now = Date.now();
      S.shipAuto = new Map([['R-1', { orderNo: 'R-1', state: 'review', by: 'cloud', total: 9000, kinds: ['nomkt'], reasons: ['「신의 아이들은 모두 춤춘다」 시장 자료 없음 — 10분 기다려도 못 읽음'], items: [{ lid: 'A', title: '신의 아이들은 모두 춤춘다', price: 9000, mkt: 'none', why: '시장을 아직 못 읽음' }], decidedAt: new Date(now).toISOString(), mktRetry: { on: true, n: 2, lids: ['A'], next: new Date(now + 8 * 60e3).toISOString() } }],
        ['R-2', { orderNo: 'R-2', state: 'sent', by: 'cloud', total: 9000, items: [{ lid: 'L1', title: '선종 영가집 (개정판)', price: 9000, mkt: 'ok', rule: 'pct', rule0: 'srch', srchN: 3, srchMin: 10000, srchLoose: 2, srchAt: new Date(now).toISOString(), why: '검색으로 찾은 같은 책 다른 판매자 매물 3개 · 최저 10,000원 대비 -10%' }], decidedAt: new Date(now).toISOString(), rejudge: { auto: 'mkt', at: new Date(now).toISOString(), why: '검색으로 같은 책 다른 판매자 매물을 새로 찾음', prev: { state: 'review', reasons: ['단독 매물'], decidedAt: new Date(now - 3600e3).toISOString() } } }]]);
      const a = shipAutoLine('R-1', true), b = shipAutoLine('R-2', true), d = shipAutoSetHtml(); const rows = shipSrchRowsE({ srch: { at: 'x', rows: [{ itemId: '1', title: '선종 영가집', match: true, ps: 10000 }, { itemId: '2', title: '우리', match: true, ours: true, ps: 9000 }] } });
      return { a, b, d, rows }; });
    ok(/시장 자료 없음/.test(r.a) && /시장 다시 읽는 중 — 2번째 맡김 · 다음 \d\d:\d\d/.test(r.a) && /저절로 다시 판단/.test(r.a), '검토 줄: 시장 자료 없음 — 다시 읽는 중(2번째 · 다음 시각)');
    ok(/검색으로 찾은 같은 책과 견줌/.test(r.b) && /🔄 [^<]*검색으로 같은 책 다른 판매자 매물을 새로 찾음 다시 판단/.test(r.b) && /검색으로 찾은 같은 책 다른 판매자 매물 3개/.test(r.b), '통과 줄: 검색으로 견줌 · 🔄 다시 판단(처음 판단과 함께) · 상품 근거');
    ok(/data-sau="srchOn"/.test(r.d) && /data-sau="mktRetryOn"/.test(r.d) && /data-sau="mktRetryMax"/.test(r.d) && /data-sau="srchDays"/.test(r.d), '⚙ 설정 칸: 검색으로 견줌·검색 자료 나이·시장 다시 읽기·최대 횟수');
    ok(r.rows && r.rows.length === 1 && r.rows[0].srch === 1 && r.rows[0].p === 10000, '출고 카드 시장 블록: 주문 뒤 검색으로 찾은 같은 책을 보라 줄로(우리 상품은 뺌)');
    ok(!pe.length, '화면 오류 없음 ' + pe.join(' | ')); res(); }));
  console.log(bad ? `❌ tAR 실패 ${bad}` : '✓ tAR 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tAR 오류', e); process.exit(1); });
