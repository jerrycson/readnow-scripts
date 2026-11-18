// tCTRLIMP3_BEO — (ctrlimp3 · 설계 CTRLDES3 1.3·1.4·1.6·1.7 · 정범님 11/18 23:44 결정) 🔭 판매자 관찰 ② — 추격 칩 · ⚔ 우리와 다툰 기록 · 상품으로 찾기
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 쓰기 0 · 읽기는 chase_rel·chase_log·chase_eps만 · 판매자 탭·판매자 창·상품 창·관제창·추격자 엔진에 이어짐 · 설명서 문단
//  ② vm: 공용 관계 캐시(같이 불러도 한 번 · 10분 · 다시 읽기) · 칩 판정(30일 · 24시간 · 3번 아래 아직 모름 · 30일 넘음) · 그리고 · 상품으로 찾기 읽기 0
//        · 우리 가게 줄 빼고 판매자 셈 · 다툰 기록은 펼칠 때만 그 판매자 것만 읽음(10분 캐시) · 전략별 결과
// 실행: node tCTRLIMP3_BEO.js · 판매자는 모두 지어낸 번호(9000001~) · 실제 기록·손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const d0 = T.indexOf('/* (판 버 · ctrlimp3'), d1 = T.indexOf('/* (판 버) 끝 */'); const BEO = d0 > 0 && d1 > d0 ? T.slice(d0, d1) : '';
const fnBody = (name) => { const i = T.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) return ''; let d = 0, j = T.indexOf('{', i); for (let k = j; k < T.length; k++) { if (T[k] === '{') d++; else if (T[k] === '}' && --d === 0) return T.slice(i, k + 1); } return ''; };
console.log('① 글');
ok(!!BEO, '판 버 덩이가 있음');
{ const names = ['SLCH_DAY', 'chRelSt', 'chRelGet', 'chRelOf', 'slChAge', 'SLCH_CHIPS', 'slChOn', 'slChFilter', 'slChWhy', 'slChBar', 'slChBind', 'slBookIdx', 'slBookSellers', 'slBookFind', 'slBookSet', 'slBookGo', 'slBookFilter', 'slBookWhy', 'slBookChip', 'slBookNone', 'slBookBind', 'slBookDoor', 'slBkfBids', 'slFightOv', 'slFightSt', 'slFightLoad', 'slFightPerf', 'slFightFolds', 'sellerFightHtml', 'slFightBody', 'slFightBind'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BEO), '브라우저 창 없음');
ok(!/\d{2,3}-\d{3,4}-\d{4}/.test(BEO), '전화번호 모양 없음');
{ const cols = [...BEO.matchAll(/db\.collection\('([^']+)'\)/g)].map((m) => m[1]); ok(cols.length === 3 && cols.join() === 'chase_rel,chase_log,chase_eps' && [...BEO.matchAll(/db\.collection\('[^']+'\)(\.\w+)/g)].every((m) => m[1] === '.get' || m[1] === '.where') && !/\.doc\(|onSnapshot|localStorage\.setItem|\.batch\(|FieldValue/.test(BEO), '읽기는 chase_rel·chase_log·chase_eps만 · 쓰기 0', cols); }
ok((T.match(/db\.collection\('chase_rel'\)\.get\(\)/g) || []).length === 1, '웹앱에서 chase_rel 전체 읽기는 공용 캐시 한 곳뿐(추격자 엔진 두 곳도 이 캐시로)');
ok(/chRelGet\(\)\.then\(\(L\) => \{ E\.relCache = L;/.test(T) && /E\.relCache = await chRelGet\(\); E\.relFresh = 1;/.test(T), '추격자 엔진 설정 탭·「관계 기록」이 공용 캐시를 씀');
{ const R = fnBody('renderSellers'); ok(/arr = slBookFilter\(slChFilter\(arr\)\);/.test(R) && /\$\{slChBar\(all\)\}\$\{slBookChip\(\)\}/.test(R) && /\$\{slChWhy\(s\)\}\$\{slBookWhy\(s\)\}/.test(R) && /\(q \? slBookNone\(q\)/.test(R) && /slChBind\(m\); slBookBind\(m\);/.test(R), '판매자 탭에 추격 칩·상품 거름·근거 줄·상품으로 찾기·누름이 이어짐'); }
{ const R = fnBody('openSeller'); ok(/\$\{sellerOnOurBooks\(s\)\}\s*\$\{sellerFightHtml\(s\)\}/.test(R) && /slFightBind\(sh, s\);/.test(R), '판매자 창에 「⚔ 우리와 다툰 기록」이 이어짐'); }
ok(/\['money', slBookDoor\(l\)\]/.test(fnBody('openProduct')), '상품 창 「🔭 이 책의 판매자」 문');
{ const C = fnBody('ctrlClick'); ok(/if \(d\.cslbk\) \{ const bids = slBkfBids\(P\.fid\);[^\n]*ctrlClose\(\); return slBookGo\(bids, nm\); \}/.test(C) && /data-cslbk="1"/.test(T), '관제창 🎯 판매자 칸 「🔭 이 묶음과 겹치는 판매자」 문'); }
ok(/<p><b>🔭 판매자 관찰 ② \(판 버\)<\/b>/.test(T), '설명서 문단');

console.log('② 흉내 실행');
const NOW = Date.now(); const ago = (h) => new Date(NOW - h * 3600e3).toISOString();
let READS = []; const REL = [
  { id: '9000001', d: { n: 12, moves: 7, lastAt: ago(2) } }, // 🔥·🎯·🔁
  { id: '9000002', d: { n: 2, moves: 2, lastAt: ago(48) } }, // 🎯 · 🔁 아직 모름
  { id: '9000003', d: { n: 9, moves: 1, lastAt: ago(24 * 40) } }, // 🕊 · 🔁 아님
  { id: '9000004', d: { n: 4, moves: 6, lastAt: 'x' } } ]; // 시각 모름 → 🎯·🔥·🕊 아님
const LOGS = [{ sc: '9000001', at: ago(1), strat: 'match', from: 10000, to: 9900, chPrev: 10000, chP: 9900, title: '책1' }, { sc: '9000001', at: ago(3), strat: 'match', from: 9900, to: 9900 }, { sc: '9000001', at: ago(5), strat: 'gap', from: 9800, to: 9700 }, { sc: '9000002', at: ago(1), strat: 'match', from: 1, to: 2 }];
const EPS = [{ sc: '9000001', strat: 'match', active: true }, { sc: '9000001', strat: 'match', active: false, end: 'floor' }, { sc: '9000001', strat: 'gap', active: false, end: 'floor' }];
const snap = (arr) => ({ docs: arr.map((x) => ({ id: x.id || 'e', data: () => x.d || x })) });
let relWait = null;
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite, setTimeout: () => 0,
  S: { tab: 'sellers', limit: 30 }, window: {}, history: { back: () => { ctx.BACK++; } }, BACK: 0,
  document: { addEventListener: () => {}, getElementById: () => null },
  esc: (s) => String(s), errKo: (e) => String(e && e.message), toast: () => {}, renderMain: () => { ctx.RM++; }, renderTabs: () => {}, RM: 0, $: () => null,
  memo: (k, fn) => fn(), norm: (s) => String(s || '').toLowerCase().replace(/\s+/g, ''), num: (n) => String(n), won: (n) => n + '원',
  cheEng: () => ({ STRATS_ALL: { match: '같은 값', gap: '틈 두기' } }), bkfNorm: () => ({ folds: { F1: { name: '묶음1', gids: ['G1'] } } }), ctrlKids: () => [{ id: 'G1' }],
  p1Has: (m) => !!m && Array.isArray(m.rows), p1Scan: (m, fn) => m.rows.forEach((r) => fn(r.sc, r.p, r.g, !!r.so)),
  slObsCfg: () => ({ fastLagMin: 60 }), // (판 서) ⚡ 칩 문턱 — 판 머 덩이 밖이라 흉내
  slObsSc: (s) => String(s.sc || s.sellerCode || String(s.id || '').replace(/^sc_/, '')),
  db: { collection: (c) => ({ get: async () => { READS.push(c); if (relWait) await relWait; return snap(REL); },
    where: (f, op, v) => ({ get: async () => { READS.push(c + ':' + f + op + v); return snap((c === 'chase_log' ? LOGS : EPS).filter((x) => x[f] === v)); } }) }) } };
vm.createContext(ctx);
vm.runInContext("var OUR_SC = '996008'; var PHONE_THIN = false;\n" + BEO + '\nthis.F = { chRelGet, chRelOf, SLCH_CHIPS, slChOn, slChFilter, slChWhy, slChBar, slBookFind, slBookSet, slBookFilter, slBookWhy, slBookSellers, slBookDoor, slBkfBids, slFightOv, slFightLoad, slFightPerf, slFightFolds, sellerFightHtml, slFightSt, slBookNone };', ctx);
const F = ctx.F;
const R = (sc, p, g = '상', so) => ({ sc: String(sc), p, g, so });
ctx.S.plist = new Map([['L1', { id: 'L1', active: true, bookId: 'B1', title: '가나다 리커버', isbn13: '9790000000011', price: 10000 }], ['L2', { id: 'L2', active: true, bookId: 'B2', title: '라마바', price: 8000 }], ['L3', { id: 'L3', active: false, bookId: 'B3', title: '가나다 옛판', price: 5000 }]]);
ctx.S.pmetrics = new Map([['B1', { rows: [R(996008, 10000), R(9000001, 9000), R(9000001, 9500), R(9000002, 10000), R(9000005, 1, '상', true)] }], ['B2', { rows: [R(9000001, 8500), R(9000003, 8000)] }], ['B3', { rows: [R(9000004, 100)] }]]);
ctx.S._bkfTb = { G1: { cls: new Map([['L1', 'done'], ['L2', 'wait'], ['Lx', 'done']]) } };
(async () => {
  // 공용 관계 캐시
  let rr; relWait = new Promise((r) => (rr = r)); const p1 = F.chRelGet(), p2 = F.chRelGet(); rr(); const [a, b] = await Promise.all([p1, p2]); relWait = null;
  ok(READS.length === 1 && a === b && a.length === 4 && a[0].sc === '9000001', '같이 불러도 chase_rel 한 번만 읽음 · 많은 차례', READS);
  ctx.S.chE = { relCache: null }; await F.chRelGet(); ok(READS.length === 1, '10분 안이면 다시 안 읽음');
  await F.chRelGet(true); ok(READS.length === 2 && ctx.S.chE.relCache && ctx.S.chE.relCache.length === 4, '「관계 다시 읽기」는 새로 읽고 추격자 엔진 캐시도 채움');
  ctx.S._chRel.at = NOW - 11 * 60e3; await F.chRelGet(); ok(READS.length === 3, '10분이 지나면 다시 읽음');
  // 칩 판정
  const V = (k, sc) => F.SLCH_CHIPS.find((c) => c[0] === k)[3](F.chRelOf(sc) || undefined);
  const exp = [['chase', '9000001', true], ['chase', '9000002', true], ['chase', '9000003', false], ['chase', '9000004', false], ['chase', '9000009', false],
    ['hot', '9000001', true], ['hot', '9000002', false], ['moves', '9000001', true], ['moves', '9000002', null], ['moves', '9000003', false], ['moves', '9000009', false],
    ['cool', '9000003', true], ['cool', '9000001', false], ['cool', '9000004', false], ['cool', '9000009', false]];
  const wrong = exp.filter(([k, sc, v]) => V(k, sc) !== v).map(([k, sc, v]) => [k, sc, v, V(k, sc)]); ok(!wrong.length, `칩 판정 ${exp.length}가지(30일 · 24시간 · 3번 아래 아직 모름 · 관계 없음 = 아님)`, wrong);
  const SL = ['9000001', '9000002', '9000003', '9000004', '9000009'].map((sc) => ({ id: 'sc_' + sc }));
  F.slChOn().push('chase'); ok(F.slChFilter(SL).map((s) => s.id).join() === 'sc_9000001,sc_9000002', '🎯 추격함 — 추격 기록 많은 차례');
  F.slChOn().push('moves'); ok(F.slChFilter(SL).map((s) => s.id).join() === 'sc_9000001', '두 칩은 「그리고」(아직 모름은 빠짐)');
  ok(/추격 기록 12번 · 우리 값 바꿈 7번 · 마지막 2시간 전/.test(F.slChWhy(SL[0])) && /아직 모름/.test(F.slChWhy(SL[1])), '근거 줄');
  ok(/data-slch="chase">🎯 추격함 2/.test(F.slChBar(SL)), '칩 숫자 = 판정 맞는 판매자 수');
  ctx.S._slCh.on = []; ok(F.slChFilter(SL).length === 5 && F.slChWhy(SL[0]) === '', '칩을 끄면 그대로');
  // 상품으로 찾기 — 읽기 0
  const n0 = READS.length;
  const H = F.slBookFind('가나다'); ok(H.length === 1 && H[0].bid === 'B1' && H[0].n === 2, '판매 중 책만 찾음(옛판 빠짐) · 판매자 수는 우리 가게·품절 줄을 빼고 셈', H);
  ok(F.slBookFind('9790000000011').length === 1 && F.slBookFind('없는책').length === 0, 'ISBN으로도 찾음 · 없으면 0');
  ok(/data-blgo="1"/.test(F.slBookNone('없는책')) && /이 책을 파는 판매자 2명 보기/.test(F.slBookNone('가나다')), '없으면 🧭 벤치마킹 조회로 · 있으면 「판매자 N명 보기」');
  ctx.S.q = '가나다'; F.slBookSet(['B1'], '가나다 리커버'); ok(ctx.S.q === '' && ctx.S._slBook.m.size === 2, '책으로 거르면 검색 칸을 비움');
  const BF = F.slBookFilter(SL.concat([{ id: 'sc_9000005' }])); ok(BF.map((s) => s.id).join() === 'sc_9000001,sc_9000002', '그 책 첫 쪽 판매자만', BF.map((s) => s.id));
  ok(/이 책 첫 쪽에 매물 · 가장 싼 값 9000원/.test(F.slBookWhy(SL[0])), '근거 줄 = 그 판매자 가장 싼 값');
  ok(F.slBkfBids('F1').sort().join() === 'B1,B2', '관제창 문 — 묶음 상태판 상품 → 책 번호(모르는 상품은 빠짐)');
  F.slBookSet(F.slBkfBids('F1'), '묶음 묶음1'); ok(ctx.S._slBook.m.get('9000001').n === 2 && ctx.S._slBook.m.get('9000001').p === 8500, '묶음 — 겹친 책 수 · 가장 싼 값');
  ok(/data-slbookgo="B1"/.test(F.slBookDoor(ctx.S.plist.get('L1'))) && F.slBookDoor({ id: 'L9', bookId: 'B9' }) === '', '상품 창 문(첫 쪽 판매자 없으면 숨김)');
  ctx.S._slBook = null; ok(READS.length === n0, '상품으로 찾기·문 셈 동안 Firestore 읽기 0');
  // ⚔ 우리와 다툰 기록
  const ov = F.slFightOv('9000001'); ok(ov.length === 2 && ov.find((x) => x.bid === 'B1').their === 9000 && ov.find((x) => x.bid === 'B1').cls === 'cheap' && ov.find((x) => x.bid === 'B2').cls === 'ours', '겹치는 상품 — 그 판매자 가장 싼 값 vs 우리', ov);
  ok(F.slFightOv('9000002')[0].cls === 'eq' && F.slFightOv('9000004').length === 0, '같음 · 판매 중지 상품은 안 셈');
  const h0 = F.sellerFightHtml({ id: 'sc_9000001', name: '판매자A' }); ok(/겹침 2권/.test(h0) && !/ open/.test(h0) && READS.length === n0, '접힌 채로는 읽지 않음 · 머리줄은 가진 자료로');
  ok(F.sellerFightHtml({ id: 'sc_996008' }) === '', '우리 가게는 칸 없음');
  ctx.S.pmetrics = new Map(); ok(/이 기기에 첫 쪽 자료 없음/.test(F.sellerFightHtml({ id: 'sc_9000001' })), '첫 쪽 자료가 없으면 그렇게 말함');
  const X = await F.slFightLoad('9000001'); ok(READS.slice(n0).sort().join() === 'chase_eps:sc==9000001,chase_log:sc==9000001' && X.logs.length === 3 && X.logs[0].at === LOGS[0].at && X.eps.length === 3, '펼치면 그 판매자 것만 읽음(최근 차례)', READS.slice(n0));
  await F.slFightLoad('9000001'); ok(READS.length === n0 + 2, '10분 안 다시 펼쳐도 안 읽음');
  const P = F.slFightPerf(X.eps, X.logs); const pm = P.find((o) => o.k === 'match'), pg = P.find((o) => o.k === 'gap');
  ok(P[0].k === 'match' && pm.n === 2 && pm.act === 1 && pm.mv === 1 && pm.end.floor === 1 && pg.n === 1 && pg.mv === 1, '전략별 판 수 · 진행 중 · 우리가 값 바꿈(같은 값은 안 셈) · 끝난 까닭', P);
  ok(F.slFightFolds(new Set(['B1']))[0].fid === 'F1', '겹치는 상품이 든 묶음');
  ok(!/\.set\(|\.update\(/.test(JSON.stringify(READS)), '시험 내내 쓰기 0');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
