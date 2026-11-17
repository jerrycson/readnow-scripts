// tLISTFIX1117 — (11/17 일꾼 listfix1 · h4 점검 🚨) 상품 기록을 덜 받은 채 '새 상품'으로 덮어 적지 않음 · 브라우저 필요 없음
//  사고: 11/17 12:37 HOME이 Firestore가 잠깐 끊긴 사이 상품 기록 26,710건 중 11,999건만 받고 → 12:41~13:40 상품 조회가 14,686개를 새 상품으로 보고 처음 본 날·등록일·수량을 덮어 적음
//        11/08 JS-MAIN도 같은 일(이 PC 보관본 10,023건을 그대로 받아 17,446개를 새 상품으로)
//  ① lfShort: 서버 건수보다 3% 넘게 모자라면 모자람 · 건수를 못 세면 지난번보다 20% 적은지
//  ② lfTrip: 상품 조회 한 번에 '지난 번호인데 처음 보는 상품'이 50개를 넘으면 멈춤(평소 가장 많은 날 24)
//  ③ 통째 읽기 — 7번째 묶음이 PC 안 사본(fromCache)이면 실패 · 서버가 조용히 덜 주면(11,999) 건수와 대어 실패 · 둘 다 상품 지도·보관본을 바꾸지 않음
//  ④ 보관본 길 — 10,023건 보관본은 받지 않고 통째로 다시 읽음 · 건수가 맞으면 보관본 그대로(통째 읽기 안 함) · 바뀐 것 읽기는 서버 답만
//  ⑤ 겹친 통째 읽기는 하나만 · ⑥ 바뀐 것 읽기가 끊기면 가진 지도 그대로(받은 자리 안 앞당김) · ⑦ 30분마다 건수가 모자라면 통째로
//  ⑧ lcPut: 서버 건수보다 모자란 지도는 보관본으로 안 둠 · ⑨ lfStop: 진단 기록 · 방금 맞춘 지도면 되풀이 읽기 안 함 · 허락(allowUntil)이면 그대로
//  ⑩ 상품 조회(scan)에서 안전띠가 listingOps(쓰기)보다 앞에 있음
// 실행: node src/tests/tLISTFIX1117.js · 시험 자료는 모두 지어낸 값
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.user.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const cut = (a0, b0) => { const a = SRC.indexOf(a0); const b = SRC.indexOf(b0, a + 1); return a > 0 && b > a ? SRC.slice(a, b) : ''; };
const BLK = cut('let LIST_LAST = 0, LIST_FULL = 0', 'const stabJ = ');
ok(BLK.length > 3000 && /function loadListings0\(/.test(BLK) && /function lfStop\(/.test(BLK), '운영 상품 기록 읽기 묶음(loadListings·lcPut·안전띠) 떼어 냄');

function mk(opt) {
  const N = opt.n || 26710; const ids = Array.from({ length: N }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
  const st = { pages: 0, delta: 0, nonServer: 0, counts: 0, sets: [], puts: [], logs: [] };
  const snap = (docs, fromCache) => ({ size: docs.length, docs, metadata: { fromCache: !!fromCache }, forEach: (f) => docs.forEach(f) });
  const D = (id) => ({ id, data: () => ({ listingId: id.slice(7), status: '판매중', up: 1000 }) });
  const C = (name) => { const q = { _w: null, _after: null, _lim: 0,
    where(f) { q._w = f; return q; }, orderBy() { return q; }, limit(n) { q._lim = n; return q; }, startAfter(d) { q._after = d; return q; },
    count() { return { get: async () => { st.counts++; if (opt.countFail) throw Object.assign(new Error('unavailable'), { code: 'unavailable' }); return { data: () => ({ count: N }) }; } }; },
    doc(id) { return { get: async () => ({ data: () => (opt.docs || {})[name + '/' + id] }), set: async (v) => { st.sets.push([name + '/' + id, v]); } }; },
    async get(o) {
      if (q._w === 'uploadedAt') { st.delta++; if (!o || o.source !== 'server') st.nonServer++; if (opt.deltaFail) throw Object.assign(new Error('unavailable'), { code: 'unavailable' }); return snap((opt.delta || []).map(D), opt.deltaCache); }
      if (q._w === 'markAt') return snap([]);
      st.pages++; if (!o || o.source !== 'server') st.nonServer++;
      const s0 = q._after ? ids.indexOf(q._after.id) + 1 : 0; const p = Math.round(s0 / 2000);
      if (opt.blipPage === p) return snap(ids.slice(s0, s0 + 1999).map(D), true); /* 끊긴 사이 PC 안 사본 */
      if (opt.shortPage === p) return snap(ids.slice(s0, s0 + 1999).map(D), false); /* 서버가 조용히 덜 줌 */
      return snap(ids.slice(s0, s0 + q._lim).map(D), false); } }; return q; };
  const firebase = { firestore: { Timestamp: { fromMillis: (x) => ({ ms: x }) }, FieldPath: { documentId: () => '__id__' }, FieldValue: { increment: (n) => ({ inc: n }) } } };
  const LCACHE = { get: async () => opt.cache || null, put: async (v) => { st.puts.push(v); } };
  /* 1.89.351(lfcount1): 운영은 바탕 모듈의 공용 건수 세기(globalThis.__rnSrvCount · count() 없으면 REST 집계)를 부름 — 여기선 가짜 count() 길 */
  const __rnSrvCount = async (c) => (await C(c).count().get()).data().count;
  const sb = { __rnSrvCount, C, firebase, LCACHE, log: (m, lv) => st.logs.push(String(m)), ui: () => {}, markReady: async () => {}, lcMs: (v) => (v && v.up) || 0, lcRevive: (v) => v, sleep: async () => {}, nowIso: () => new Date().toISOString(), PC_NAME: 'TESTPC', W: () => ({ writer: 'TESTPC' }), Date, JSON, console };
  vm.createContext(sb);
  vm.runInContext(`let LISTINGS = null;\n${BLK}\n;this.api = { loadListings, lcPut, lfShort, lfTrip, lfStop, LMap, get L() { return LISTINGS; }, set L(v) { LISTINGS = v; }, get v() { return { LF_SRVN, LF_SRVN_AT, LF_STALE, LIST_LAST, LIST_FULL }; }, set srvAt(x) { LF_SRVN_AT = x; }, set full(x) { LIST_FULL = x; }, set last(x) { LIST_LAST = x; } };`, sb);
  return { A: sb.api, st, ids };
}
const rows = (ids) => ids.map((id) => [id, { listingId: id.slice(7), up: 1000 }]);

(async () => {
  console.log('① lfShort — 모자람 판정');
  { const { A } = mk({});
    ok(A.lfShort(11999, 26710, 0) !== '', '11,999 / 서버 26,710 → 모자람(11/17 HOME)');
    ok(A.lfShort(10023, 26710, 0) !== '', '10,023 / 서버 26,710 → 모자람(11/08 JS-MAIN 보관본)');
    ok(A.lfShort(26700, 26710, 0) === '' && A.lfShort(25950, 26710, 0) === '', '3% 안쪽(26,700·25,950) → 괜찮음');
    ok(A.lfShort(25800, 26710, 0) !== '', '3% 넘게 모자람(25,800) → 모자람');
    ok(A.lfShort(11999, 0, 26710) !== '' && A.lfShort(25000, 0, 26710) === '', '건수를 못 세면 지난번보다 20% 적은지(11,999 모자람 · 25,000 괜찮음)');
    ok(A.lfShort(500, 0, 0) === '' && A.lfShort(500, 800, 0) === '', '처음(지난번 없음)·작은 표본은 막지 않음'); }

  console.log('② lfTrip — 처음 보는 옛 번호 상품 문턱 50(평소 가장 많은 날 24)');
  { const { A } = mk({});
    ok(A.lfTrip(0, 50) === false && A.lfTrip(0, 24) === false && A.lfTrip(undefined, 3) === false, '50개까지는 그대로');
    ok(A.lfTrip(0, 51) === true && A.lfTrip(40, 11) === true && A.lfTrip(0, 100) === true, '51개부터 멈춤(한 쪽 100줄이 모두 처음 보는 것이면 첫 쪽에서)'); }

  console.log('③ 통째 읽기');
  { const { A, st } = mk({ blipPage: 6 }); let err = null; try { await A.loadListings(); } catch (e) { err = e; }
    ok(err && /서버에서 다 받지 못함/.test(err.message), '7번째 묶음이 PC 안 사본 → 실패', err && err.message);
    ok(A.L === null && st.puts.length === 0, '상품 지도·보관본 그대로(새 상품으로 볼 자리 없음)', { L: A.L && A.L.size, puts: st.puts.length }); ok(st.nonServer === 0, '모든 묶음을 서버 답으로 받음'); }
  { const { A, st } = mk({ shortPage: 5 }); let err = null; try { await A.loadListings(); } catch (e) { err = e; }
    ok(err && /덜 받음/.test(err.message), '서버가 조용히 11,999건만 줌 → 건수(26,710)와 대어 실패', err && err.message);
    ok(A.L === null && st.puts.length === 0 && st.counts === 1, '상품 지도·보관본 그대로 · 건수 한 번 셈', { puts: st.puts.length, counts: st.counts });
    ok(st.logs.some((l) => /서버 26,710건 중 11,999건/.test(l)), '한국어 기록 줄에 두 숫자', st.logs); }
  { const { A, st } = mk({ shortPage: 5, countFail: true }); A.L = new A.LMap(rows(Array.from({ length: 26000 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0')))); let err = null; try { await A.loadListings(true); } catch (e) { err = e; }
    ok(err && A.L.size === 26000, '건수를 못 세도 지난번(26,000)보다 20% 넘게 적으면 실패 · 가진 지도 그대로', { err: err && err.message, n: A.L.size }); }
  { const { A, st } = mk({}); const m = await A.loadListings();
    ok(m.size === 26710 && A.L === m && st.puts.length === 1 && st.puts[0].rows.length === 26710, '평소 → 26,710건 · 보관본 한 번', { n: m.size, puts: st.puts.length });
    ok(A.v.LF_SRVN === 26710 && A.v.LF_STALE === false, '서버 건수 기억 · 모자람 표시 없음', A.v); ok(st.logs.some((l) => /26,710건 읽음 \(서버 26,710건\)/.test(l)), '기록 줄에 서버 건수', st.logs.slice(-2)); }

  console.log('④ 보관본 길');
  { const short = Array.from({ length: 10023 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(short), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0 } }); const m = await A.loadListings();
    ok(m.size === 26710 && st.pages === 14, '10,023건 보관본 → 받지 않고 서버에서 통째로(14묶음) 26,710건', { n: m.size, pages: st.pages });
    ok(st.logs.some((l) => /보관본으로 읽기 실패.*보관본이 모자람/.test(l)), '왜 다시 읽는지 기록', st.logs); ok(st.nonServer === 0, '바뀐 것 읽기도 서버 답만'); }
  { const full = Array.from({ length: 26700 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(full), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0 }, delta: ['aladin_026705', 'aladin_026710'] }); const m = await A.loadListings();
    ok(m.size === 26702 && st.pages === 0 && st.counts === 1, '건수가 맞는 보관본(26,700 + 바뀐 2) → 그대로 · 통째 읽기 없음 · 건수 한 번', { n: m.size, pages: st.pages, counts: st.counts }); }
  { const full = Array.from({ length: 26700 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(full), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0 }, deltaCache: true }); const m = await A.loadListings();
    ok(m.size === 26710 && st.pages === 14, '바뀐 것이 PC 안 사본으로만 오면 보관본을 버리고 통째로', { n: m.size, pages: st.pages }); }
  { const full = Array.from({ length: 26700 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(full), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0 }, countFail: true, shortPage: 99 }); const m = await A.loadListings();
    ok(m.size === 26710 && st.pages === 14, '건수를 못 세면 보관본을 믿지 않고 통째로(통째 읽기는 지난번 기준으로 검사)', { n: m.size, pages: st.pages }); }
  /* (lfcount1 · 리드 11/17 h4 소견 ③) 세는 길이 다 막혀도 서버가 센 적 있는 건수(보관본에 적힌 그때 서버 건수 srvN)가 있으면 그것과 3% 대조해 보관본을 씀 — 켤 때마다 통째 읽기(하루 약 170만 읽기)로 빠지지 않게 */
  { const full = Array.from({ length: 26700 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(full), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0, srvN: 26710 }, countFail: true, delta: ['aladin_026705'] }); const m = await A.loadListings();
    ok(m.size === 26701 && st.pages === 0, '건수를 못 세도 보관본에 서버가 센 건수(26,710)가 있으면 3% 대조 뒤 보관본 그대로(통째 읽기 없음)', { n: m.size, pages: st.pages });
    ok(st.logs.some((l) => /아는 기준 26,710건\(서버 건수를 못 셈: unavailable\)/.test(l)), '아는 기준을 썼다는 것과 못 센 까닭을 기록 줄에', st.logs.slice(-2)); }
  { const short = Array.from({ length: 10023 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(short), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0, srvN: 26710 }, countFail: true }); const m = await A.loadListings();
    ok(st.pages === 14 && st.logs.some((l) => /보관본이 모자람\(서버 26,710건 중 10,023건\)/.test(l)), '아는 기준(26,710)보다 3% 넘게 모자란 보관본(10,023) → 통째로', { pages: st.pages, logs: st.logs.slice(-3) }); }
  { const full = Array.from({ length: 26700 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'));
    const { A, st } = mk({ cache: { rows: rows(full), last: Date.now() - 3600e3, fullAt: Date.now() - 7200e3, mark: 0, srvN: 1500 }, countFail: true }); await A.loadListings();
    ok(st.pages === 14, '아는 기준이 2천 건 이하(믿을 수 없음)면 쓰지 않고 통째로', { pages: st.pages }); }
  { const { A, st } = mk({}); await A.loadListings(true); A.lcPut(A.L, Date.now(), Date.now(), true); const v = st.puts[st.puts.length - 1] || {};
    ok(v.srvN === 26710, '보관본에 그때 서버가 센 건수(srvN)를 함께 둠', { srvN: v.srvN, puts: st.puts.length }); }

  console.log('⑤ 겹친 통째 읽기는 하나만(11/08 16:19 두 읽기가 겹쳐 21,999·5,999건)');
  { const { A, st } = mk({}); const [a, b, c] = await Promise.all([A.loadListings(), A.loadListings(), A.loadListings('inc')]);
    ok(a === b && b === c && a.size === 26710 && st.pages === 14, '셋이 함께 불러도 묶음 14번(한 번 읽기)', { pages: st.pages });
    const st2 = st.pages; await Promise.all([A.loadListings(true), A.loadListings(true)]); ok(st.pages === st2 + 28 || st.pages === st2 + 14, '강제 다시 읽기(true)는 차례로 — 겹치지 않음', { more: st.pages - st2 }); }

  console.log('⑥ 바뀐 것 읽기가 끊기면 가진 지도 그대로');
  { const { A, st } = mk({ deltaFail: true }); await A.loadListings(); const m0 = A.L; const last0 = A.v.LIST_LAST; const p0 = st.pages; A.srvAt = Date.now();
    const m = await A.loadListings('inc'); ok(m === m0 && m.size === 26710 && st.pages === p0, '같은 지도 · 통째 읽기 없음', { pages: st.pages - p0 }); ok(A.v.LIST_LAST === last0, '받은 자리(LIST_LAST)를 앞당기지 않음 — 다음에 다시 받음');
    ok(st.logs.some((l) => /바뀐 것을 서버에서 못 받음/.test(l)), '한국어 기록 줄', st.logs.slice(-2)); }

  console.log('⑦ 30분마다 서버 건수와 대어 모자라면 통째로');
  { const { A, st } = mk({}); await A.loadListings(); const p0 = st.pages; const sm = new A.LMap(rows(Array.from({ length: 12000 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0')))); A.L = sm; A.srvAt = Date.now() - 31 * 60e3;
    const m = await A.loadListings('inc'); ok(m.size === 26710 && st.pages === p0 + 14 && A.v.LF_STALE === false, '12,000건 지도 → 통째로 다시 읽어 26,710건', { n: m.size, pages: st.pages - p0 });
    A.srvAt = Date.now(); const c0 = st.counts; await A.loadListings('inc'); ok(st.counts === c0, '30분 안엔 건수를 다시 세지 않음(읽기 아낌)'); }

  console.log('⑧ lcPut — 모자란 지도는 보관본으로 두지 않음');
  { const { A, st } = mk({}); await A.loadListings(); const p0 = st.puts.length; const sm = new A.LMap(rows(Array.from({ length: 12000 }, (_, i) => 'aladin_' + String(i + 1).padStart(6, '0'))));
    A.lcPut(sm, Date.now(), Date.now(), true); ok(st.puts.length === p0, '12,000 / 서버 26,710 → 안 둠'); A.lcPut(A.L, Date.now(), Date.now(), true); ok(st.puts.length === p0 + 1, '26,710 → 둠'); }

  console.log('⑨ lfStop — 진단 기록 · 되풀이 읽기 막음 · 허락');
  { const { A, st } = mk({}); A.L = new A.LMap(rows(['aladin_000001'])); A.full = 0;
    const r = await A.lfStop({ mode: 'daily', status: '판매완료', page: 1, n: 60, sofar: 0, maxKnown: 407254067, sample: ['406000001'] });
    const w = st.sets.find((x) => x[0] === 'prd_system/listfix');
    ok(r === true && A.v.LF_STALE === true, '멈춤 · 다음 회차에 통째로(LF_STALE)'); ok(w && w[1].last.n === 60 && w[1].last.fresh === false && w[1].last.status === '판매완료' && w[1].trips && w[1].trips.inc === 1, '진단 기록 prd_system/listfix', w && w[1]);
    ok(st.logs.some((l) => /상품 조회 멈춤: 판매완료 1쪽.*처음 보는 상품이 60개\(문턱 50\)/.test(l)), '한국어 기록 줄', st.logs); }
  { const { A, st } = mk({}); await A.loadListings(); A.full = Date.now();
    const r = await A.lfStop({ mode: 'daily', status: '판매중', page: 3, n: 70, sofar: 0, maxKnown: 407254067, sample: [] });
    const w = st.sets.find((x) => x[0] === 'prd_system/listfix'); ok(r === true && A.v.LF_STALE === false && w[1].last.fresh === true, '방금 서버와 건수를 맞춘 지도 → 멈추되 다시 읽기를 되풀이하지 않음(사람 확인 기다림)', w && w[1].last);
    ok(st.logs.some((l) => /allowUntil/.test(l)), '어떻게 이어 가는지 기록 줄에'); }
  { const { A, st } = mk({ docs: { 'prd_system/listfix': { allowUntil: new Date(Date.now() + 3600e3).toISOString() } } }); A.L = new A.LMap(); A.full = 0;
    const r = await A.lfStop({ mode: 'daily', status: '판매중', page: 1, n: 80, sofar: 0, maxKnown: 1, sample: [] }); ok(r === false && A.v.LF_STALE === false && !st.sets.length, '허락(allowUntil 앞) → 멈추지 않고 그대로 적음'); }

  console.log('⑩ 상품 조회 안에서 안전띠 자리');
  { const S = cut('async function scan(mode) {', '/* ───────── 2. 도서 정보·시장 지표'); const g = S.indexOf('lfTrip(prog.lfOld'), w = S.indexOf("listingOps(row, 'scm', seenAt)"), cm = S.indexOf('if (ops.length) await commitBatches(ops);');
    ok(g > 0 && w > g && cm > w, '쪽마다 쓰기(listingOps·commitBatches)보다 먼저 셈', { g, w, cm });
    ok(/x\.usedCode && \+x\.listingId && \+x\.listingId <= maxKnown && !LISTINGS\.has\('aladin_' \+ x\.usedCode\)/.test(S), '셈 = 커서(maxListingId) 아래 번호 · 우리 지도에 없음(listingOps의 prev 없음과 같은 열쇠)');
    ok(/throw new Error\(`상품 기록을 덜 받은 것 같아 멈춤/.test(S), '멈추면 그 쪽은 하나도 안 적고 회차를 실패로'); }

  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 중 오류', e && e.stack); process.exit(1); });
