// tSPFULL1112 — 11/12 spfull: 🧭 클라우드 빈 정보 메우기(spBatchTick) 판매 중 상품도 숍 전체를 돎
//   예전: 판매자마다 .limit(per)로 문서 번호 앞쪽 약 307개만 고르고 다음 자리를 기억하지 않음 → 판매 중 약 122만 개 중 0.4%만 채움
//   이제: 판매자마다 이어 읽을 자리(spBatchSell.first[판매자].lastId) · 빈 칸 있는 것만 후보 · 처리 못 한 후보는 건너뛰지 않음 · 끝나면 처음부터 · 주력 10곳 비중 · 숍 전체 채움률
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tSPFULL1112.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
const i10 = (b9) => { let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +b9[i]; const c = (11 - (s % 11)) % 11; return b9 + (c === 10 ? 'X' : String(c)); };
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[국내도서]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a></li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au}@1">${b.au}</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2">${b.pub}</a>${b.noYm ? '' : ' | 2020년 10월'}</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인)</li><li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div></td>
  <td><div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.cov}">장바구니</a></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><body><form>${L.map(box).join('')}</form></body></html>`;
const MAIN = '349846';

// 여러 회차를 같은 가짜 저장소로 — 쓰기는 bench_items 문서에 바로 합쳐짐(다음 회차가 채운 것을 봄)
function world(spec) { global.FieldPath = { documentId: () => '__name__' };
  const BI = []; const byKey = new Map(); let n = 0;
  for (const [sc, cnt, opt] of spec) for (let i = 0; i < cnt; i++) { const cov = i10('89' + String(3000000 + n * 37).padStart(7, '0')); n++; const id = sc + '_' + String(i).padStart(3, '0'); const v = { sc, coverKey: cov, title: '시험 책 ' + id, ...((opt && opt(i)) || {}) }; BI.push({ id, v }); byKey.set(A.coverIsbn(cov), { id: String(5000000 + n), cov, title: '시험 책 ' + id, pl: 10000, ps: 9000, sp: 100 + n, pub: '시험출판', au: '가가', noYm: !!(opt && opt(i) && opt(i).noYm) }); }
  const mk = (d) => ({ id: d.id, ref: { id: d.id }, data: () => d.v, exists: true }); const byId = new Map(BI.map((d) => [d.id, d]));
  const S = { reads: 0, failOrder: false };
  const qObj = (filt) => { const o = { _after: null, _lim: 1e9, _ord: false }; o.orderBy = () => { if (S.failOrder) throw new Error('색인 없음(시험)'); o._ord = true; return o; }; o.startAfter = (x) => { o._after = typeof x === 'string' ? x : x.id; return o; }; o.select = () => o; o.limit = (k) => { o._lim = k; return o; };
    o.get = async () => { let L = BI.filter((d) => filt(d.v)).sort((a, b) => (a.id < b.id ? -1 : 1)); if (o._after) L = L.filter((d) => d.id > o._after); L = L.slice(0, o._lim); S.reads += L.length; return { docs: L.map(mk), empty: !L.length }; }; return o; };
  const store = {}; const C2 = (name) => ({ doc: (id) => ({ id, get: async () => (name === 'bench_items' && byId.has(id) ? mk(byId.get(id)) : { id, exists: !!store[name + '/' + id], data: () => store[name + '/' + id] }), set: async (v) => { const o0 = store[name + '/' + id] || {}; const n0 = { ...o0 }; for (const [k, x] of Object.entries(v)) n0[k] = x && typeof x === 'object' && !Array.isArray(x) && o0[k] && typeof o0[k] === 'object' && !Array.isArray(o0[k]) ? { ...o0[k], ...x } : x; store[name + '/' + id] = n0; } }),
    where: (k, op, v) => (name !== 'bench_items' ? { select: () => ({ limit: () => ({ get: async () => ({ docs: [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }) } : k === 'goneDay' ? qObj((x) => x.goneDay && x.goneDay >= v) : qObj((x) => x[k] === v)) });
  const sets = []; const db = { batch: () => ({ set: (ref, v) => { sets.push([ref.id, v]); const d = byId.get(ref.id); if (d) Object.assign(d.v, v); }, commit: async () => {} }), getAll: async () => [] };
  const urls = []; const pg = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async (u) => { urls.push(u); const w = decodeURIComponent((u.match(/SearchWord=([^&]*)/) || [])[1] || ''); const L = w.split(' ').map((k) => byKey.get(k)).filter(Boolean); return { ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => listPage(L) }; }; try { return await fn(...a); } finally { global.fetch = sv; } } };
  global.window = { ReadnowAdapt: A }; global.DOMParser = new JSDOM('<html></html>').window.DOMParser;
  const mkT = new Function('A', 'C', 'db', 'getPage', 'jsleep', 'nowIso', 'kDay', 'W', 'ADC', 'adaptMod', 'FieldPath', cut(CSRC, 'let spBatchNextAt = 0;', '\n/* (정범님 11/11 밤 ②') + '\nreturn spBatchTick;');
  const tick = mkT(A, C2, db, async () => pg, async () => {}, () => new Date().toISOString(), () => '2026-11-12', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A, global.FieldPath);
  const setCfg = (targets, cfg) => { store['app_settings/bench'] = { targets }; store['app_settings/adapt_cfg'] = { spBatchHist: [{ day: 'x', list: 40, noMatch: 2 }], spBatchLearn: { k: 12, cap: 25, y: {} }, ...(cfg || {}) }; };
  return { BI, byId, store, sets, urls, tick, setCfg, S, cur: () => (store['app_settings/adapt_cfg'].spBatchSell || {}).first || {} };
}

(async () => {
  console.log('① 판매자마다 이어 읽을 자리 — 숍 전체를 돎');
  { const W = world([['1', 30]]); W.setCfg([{ sc: '1' }], { spBatch: { sellScan: 10, sellWant: 10, gone: false, front: false } });
    const r1 = await W.tick({ force: true }); const c1 = W.cur()['1'];
    ok(r1.sell && r1.sell.on && r1.sell.scan === 10 && c1 && c1.lastId === '1_009' && c1.rounds === 0 && c1.adv === 10, '첫 회차: 문서 번호 차례 10개만 읽고 자리(1_009)를 남김', { sell: r1.sell, c1 });
    ok(['1_000', '1_005', '1_009'].every((k) => W.byId.get(k).v.isbn && W.byId.get(k).v.sp != null) && !W.byId.get('1_010').v.isbn, '읽은 10개는 채움 · 뒤(1_010)는 아직', W.byId.get('1_010').v);
    const r2 = await W.tick({ force: true }); const c2 = W.cur()['1']; ok(c2.lastId === '1_019' && W.byId.get('1_015').v.isbn && r2.sell.adv === 10, '다음 회차는 남긴 자리 뒤부터(예전엔 늘 같은 앞쪽 307개)', c2);
    const r3 = await W.tick({ force: true }); const c3 = W.cur()['1']; ok(c3.lastId === '1_029' && c3.rounds === 0, '셋째 회차 1_029까지(끝 문서지만 쪽이 꽉 차 아직 끝 모름)', c3);
    const r4 = await W.tick({ force: true }); const c4 = W.cur()['1']; ok(c4.lastId === null && c4.rounds === 1 && c4.lastRound && c4.lastRound.n === 30 && c4.lastRound.full === 30 && c4.lastRound.filled === 30, '끝까지 가면 처음부터(바퀴 1) · 한 바퀴 동안 처음 본 판매 중 30개 중 다 찬 것 30', c4);
    ok(W.BI.every((d) => d.v.isbn && d.v.publisher && d.v.pubYm && d.v.priceList != null), '숍 30개 모두 채움(예전 방식이면 앞쪽만)');
    const h = W.store['app_settings/adapt_cfg'].spBatchSellHist; ok(Array.isArray(h) && h[0].day === '2026-11-12' && h[0].ticks === 4 && h[0].fill === 30 && h[0].adv === 30 && h[0].wraps === 1 && r4.sell.known === 30 && r4.sell.rateFull === 1 && r4.sell.rateFilled === 1, '날마다 기록(spBatchSellHist) — 회차·채움 수·나아간 문서 수·바퀴 · 숍 전체 채움률(rateFull)', { h, s: r4.sell });
    ok(r1.sell.rateFull === 1 && r1.sell.known === 10 && r2.sell.known === 20, '채움률은 본 것 기준 · 이번 회차에 채운 것까지 셈(첫 회차 10개 중 10)', [r1.sell, r2.sell]); }

  console.log('② 검색 몫이 모자라면 못 찾은 후보를 건너뛰지 않음');
  { const W = world([['1', 40]]); W.setCfg([{ sc: '1' }], { spBatch: { sellScan: 40, sellWant: 40, maxQ: 1, kMax: 12, gone: false, front: false } });
    const r1 = await W.tick({ force: true }); const c1 = W.cur()['1']; const filled = W.BI.filter((d) => d.v.isbn).length;
    ok(r1.q === 1 && filled > 0 && filled < 40 && c1.un === 40 - filled && c1.lastId != null && W.byId.get(c1.lastId) && !W.byId.get(W.BI[W.BI.findIndex((d) => d.id === c1.lastId) + 1].id).v.isbn, '검색 1쪽만 — 자리는 아직 못 찾은 첫 후보 바로 앞까지만', { filled, c1 });
    for (let i = 0; i < 6; i++) await W.tick({ force: true }); ok(W.BI.filter((d) => d.v.isbn).length === 40, '몇 회차 뒤 40개 모두 채움(건너뛴 것 없음)', W.BI.filter((d) => !d.v.isbn).map((d) => d.id));
    const W2 = world([['1', 5]]); W2.setCfg([{ sc: '1' }], { spBatch: { sellScan: 10, sellWant: 10, maxQ: 1, sellStayMax: 2, gone: false, front: false, on: false } });
    await W2.tick({ force: true }); await W2.tick({ force: true }); const s2 = W2.cur()['1']; ok(s2.lastId === null && s2.stayN === 2 && s2.rounds === 0, '검색이 꺼져 처리 못 하면 같은 자리에 머묾(stayN)', s2);
    await W2.tick({ force: true }); const s3 = W2.cur()['1']; ok(s3.forced && s3.rounds === 1 && s3.stayN === 0, 'sellStayMax 넘게 묶이면 그래도 넘김(못 찾는 상품에 영영 묶이지 않음)', s3); }

  console.log('③ 주력 10곳 비중 — 읽기·후보·검색 쪽');
  { const W = world([[MAIN, 50], ['2', 50]]); W.setCfg([{ sc: MAIN }, { sc: '2' }], { spBatch: { sellScan: 100, sellWant: 100, maxQ: 10, kMax: 12, gone: false, front: false } });
    const r = await W.tick({ force: true }); const c = W.cur();
    ok(c[MAIN].scan === 50 && c['2'].scan === 30 && c[MAIN].main && !c['2'].main, '읽기 몫(100): 주력 70(숍 크기 50까지) · 나머지 30', c);
    const fM = W.BI.filter((d) => d.v.sc === MAIN && d.v.isbn).length, f2 = W.BI.filter((d) => d.v.sc === '2' && d.v.isbn).length; const hasM = (u) => W.BI.some((d) => d.v.sc === MAIN && decodeURIComponent(u).includes(A.coverIsbn(d.v.coverKey)));
    ok(hasM(W.urls[0]) && fM > f2 && f2 > 0, '검색 쪽: 주력 먼저·더 많이(70%) · 나머지도 굶지 않음', { fM, f2, q: r.q });
    const W3 = world([[MAIN, 200], ['2', 200]]); W3.setCfg([{ sc: MAIN }, { sc: '2' }], { spBatch: { sellScan: 300, sellWant: 1000, maxQ: 1, on: false, gone: false, front: false } }); await W3.tick({ force: true }); const c3 = W3.cur(); ok(c3[MAIN].scan === 200 && c3['2'].scan === 90, '읽는 문서 상한(sellScan 300)을 70:30으로 나눔(210→숍 200·90) · 회차당 메모리 그대로', c3); }

  console.log('④ 끝내 빈 칸 · 끄기 · 물음 실패 · 셈만');
  { const W = world([['1', 3, (i) => (i === 0 ? { noYm: true } : null)]]); W.setCfg([{ sc: '1' }], { spBatch: { gone: false, front: false } }); await W.tick({ force: true }); const v0 = W.byId.get('1_000').v;
    ok(v0.isbn && !v0.pubYm && v0.listPartAt && !W.byId.get('1_001').v.listPartAt, '목록에서 맞췄지만 출간 연월이 끝내 없으면 listPartAt(7일 쉼)', v0);
    const n0 = W.urls.length; await W.tick({ force: true }); ok(W.urls.length === n0 && W.cur()['1'].un === 0, '다음 회차엔 그 상품을 다시 찾지 않음(같은 상품 되풀이 검색 막음)', W.cur()['1']); }
  { const W = world([['1', 30]]); W.setCfg([{ sc: '1' }], { spBatch: { sellCur: false, gone: false, front: false } }); const r = await W.tick({ force: true, max: 100 }); ok(!r.sell && !W.store['app_settings/adapt_cfg'].spBatchSell && W.byId.get('1_000').v.isbn, '끄기 adapt_cfg.spBatch.sellCur = false → 예전 동작(자리 없음)', r.sell); }
  { const W = world([['1', 5]]); W.setCfg([{ sc: '1' }], { spBatch: { gone: false, front: false } }); W.S.failOrder = true; const r = await W.tick({ force: true }); ok(r.sell && r.sell.on === false && /색인/.test(r.sell.err) && W.byId.get('1_000').v.isbn, '자리 물음이 실패하면 예전 길로 그대로 채움 · 까닭을 sell.err에', r.sell); }
  { const W = world([['1', 5]]); W.setCfg([{ sc: '1' }], { spBatch: { gone: false, front: false } }); const r = await W.tick({ force: true, dry: true }); ok(r.sell && r.sell.scan === 5 && !W.store['app_settings/adapt_cfg'].spBatchSell && !W.byId.get('1_000').v.isbn, '셈만(spbatch=dry)은 자리·기록을 쓰지 않음', r.sell); }

  console.log('⑤ 진단');
  ok(/if \(q\.spfull \|\| q\.bfill \|\| q\.soldfill\) \{/.test(CSRC) && /out\.spfull = z;/.test(CSRC) && /z\.etaRoundH = /.test(CSRC) && /v\.left = r; v\.pos = /.test(CSRC), '진단 spfull=1 — 판매자별 자리·바퀴·남은 문서 수·한 바퀴 예상 시간 · bfill·soldfill에도 함께');
  ok(/spBatchSellHist: hs\.filter/.test(CSRC) && /rateFull: S\.rateFull, rateFilled: S\.rateFilled/.test(CSRC), '숍 전체 기준 채움률을 날마다 남김');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
