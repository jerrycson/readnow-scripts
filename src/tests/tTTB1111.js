// tTTB1111 — 11/11 ttb1: 알라딘 OpenAPI(TTB) 2026-10-30 종료 → TTB 호출 모두 끔(헛호출 0) · 칸마다 대체 출처 · '종료됨 — 대체 출처' 표시
//   ① 공용 파일 readnow-ext-core.js — ttb 출처·키 ended · 켤 수 없음 · run('ttb')가 묻지 않고 '종료됨'
//   ② 클라우드 — TTB 주소 0 · blTtb는 묻지 않음 · alPubItem(공개 상품 화면 → TTB item 꼴) · 벤치마킹 정렬 · 목록 종류는 '종료됨'으로 멈춤
//   ③ 웹앱 ⚙ 설정 ⑱ 외부 정보 — TTB 키 칸 대신 '알라딘 OpenAPI 종료(10/30)' · 출처 표 TTB 줄 = 종료됨 — 대체 출처 · 벤치마킹 목록 종류 표시
//   ④ 번외 수집기 — ext.ttb 종료됨(돌지 않음)
// 실행: cd pw && node tTTB1111.js (../readnow-ext-core.js · ../cloud/index.js · ../src/app.html 또는 ../app.html) · 또는 저장소 src/tests 에서 그대로 · 지어낸 값만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const X = require(find(['readnow-ext-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const APP = fs.readFileSync(find(['src/app.html', 'app.html']), 'utf8');
const TK = require(find(['lab/col2/shadow/col2-tasks.js']));
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
(async () => {
  console.log('① 공용 파일');
  const S = X.SOURCES.ttb; const K = X.KEYS.find((k) => k.k === 'aladinTtb');
  ok(S && S.ended === '2026-10-30' && /종료/.test(S.label) && /공개 상품 화면/.test(S.alt || '') && K && K.ended === '2026-10-30' && /OpenAPI 종료\(10\/30\)/.test(K.label), 'ttb 출처·키 = 종료됨(2026-10-30) · 대체 출처 글', { S, K });
  ok(X.cfgOf({ src: { ttb: { on: true } } }).src.ttb.on === false, '설정에서 켜 두었어도 꺼짐(켤 수 없음)');
  let nh = 0; const http = async () => { nh++; return { status: 200, text: '{"item":[{"title":"x"}]}' }; };
  const r = await X.run('ttb', { isbn: '9788937460449', title: '데미안', keys: { aladinTtb: 'K' }, http, cache: {}, cfg: X.cfgOf({}) });
  ok(nh === 0 && r && !r.ok && r.ended === '2026-10-30' && /종료됨/.test(r.skip || ''), "run('ttb') = 묻지 않고 '종료됨 — 대체 출처'(헛호출 0)", r);
  const r2 = await X.run('naver', { isbn: '9788937460449', keys: { naverId: 'a', naverSecret: 'b' }, http, cache: {}, cfg: X.cfgOf({}) });
  ok(nh === 0 && r2.ended === '2026-07-31', '끝난 네이버 책 검색도 같은 길로 묻지 않음', r2);
  ok(!/ttb\/api/.test(fs.readFileSync(find(['readnow-ext-core.js']), 'utf8')), '공용 파일에 TTB 주소가 남지 않음');

  console.log('② 클라우드');
  ok(!/ttb\/api|ItemLookUp\.aspx|ItemSearch\.aspx|ItemList\.aspx/.test(CSRC) && !/extUsedAddC\('ttb'/.test(CSRC) && !/keys\.aladinTtb/.test(CSRC), 'TTB 주소·TTB 하루 몫 세기·TTB 키 확인이 없음');
  const blTtb = new Function('TTB_END_MSG', cut(CSRC, 'async function blTtb()', '\n') + '\nreturn blTtb;')('알라딘 OpenAPI(TTB) 종료(2026-10-30)');
  let e1 = null; try { await blTtb('https://x', {}); } catch (e) { e1 = e.message; } ok(/종료/.test(e1 || ''), '남은 blTtb를 불러도 묻지 않고 종료 오류', e1);
  const alPubItem = new Function(cut(CSRC, 'async function alPubItem(p, o)', '\n/* 벤치마킹 그룹이 중고 요약') + '\nreturn alPubItem;')();
  const fakeP = (ret) => ({ evaluate: async (fn, o) => { fakeP.last = { src: String(fn), o }; return ret; } });
  const item = { itemId: '111', isbn13: '9790000000011', title: '시험책', priceStandard: 15000, priceSales: 13500, salesPoint: 420, stockStatus: '품절', cids: ['1', '55'], src: 'page' };
  const a1 = await alPubItem(fakeP({ item: { ...item }, mins: { '알라딘 직접배송': { count: 2, min: 5000 }, '광활한 우주점': { count: 1, min: 6000 }, '판매자 중고': { count: 7, min: 3000 } } }), { isbn: '9790000000011', needUsed: true });
  ok(a1 && a1.salesPoint === 420 && a1.usedRead === true && a1.subInfo.usedList.aladinUsed.itemCount === 2 && a1.subInfo.usedList.spaceUsed.minPrice === 6000 && a1.subInfo.usedList.userUsed.itemCount === 7, '공개 화면 값 → TTB item 꼴(SP·정가·재고 · 중고 요약 직접배송/우주점/판매자)', a1);
  const src = fakeP.last.src; ok(/credentials: 'omit'/.test(src) && /wsearchresult\.aspx\?SearchTarget=All&SearchWord=/.test(src) && /\/shop\/wproduct\.aspx\?ItemId=/.test(src) && /wuseditemall\.aspx/.test(src) && !/scm|wlogin\.aspx\?/.test(src), '읽는 곳 = 알라딘 공개 검색·상품·전체중고 화면만(로그인 정보 없이)');
  ok((await alPubItem(fakeP({ gate: 1 }), { isbn: '1' })).gate === 1 && (await alPubItem(fakeP({ none: 1 }), { isbn: '1' })) === null, '19금·로그인 화면 = gate · 못 찾음 = null');
  const a2 = await alPubItem(fakeP({ item: { ...item }, mins: null }), { isbn: '9790000000011' }); ok(a2.usedRead === false && !Object.keys(a2.subInfo.usedList).length, '중고 요약을 안 읽었으면 usedRead=false(벤치마킹이 중고 조건을 0으로 오해하지 않게)');
  const blU = new Function(cut(CSRC, 'const blU = ', '\nfunction blPre') + '\nreturn blU;')(); const blPre = new Function('blU', cut(CSRC, 'function blPre(g, x, ours, soldSet)', '\n/* (0.20.0)') + '\nreturn blPre;')(blU);
  const pr = blPre({ q: { spMin: 400, avail: 'sold', usedMin: 9 }, al: { direct: true, universe: true } }, a1, new Set(), new Set()); ok(!pr.why.length && pr.usedN === 10 && pr.umin === 3000, '일반 조건(SP·품절·중고 수·직접배송·우주점)이 공개 화면 값으로 그대로 걸러짐', pr);
  const NU = new Function(cut(CSRC, 'const blNeedUsed = ', '\n') + '\nreturn blNeedUsed;')(); ok(NU({ q: {}, al: {} }) === false && NU({ q: { usedPMax: 5000 }, al: {} }) && NU({ q: {}, al: { universe: true } }), '중고 조건을 고른 그룹만 전체중고 화면을 한 번 더 읽음');
  const SORT = new Function(cut(CSRC, 'const BL_LOCSORT = ', '\nlet blBusy') + '\nreturn { BL_PGSORT, BL_PGSORT_NAME };')();
  const L = [{ sp: 5, title: '나', pubDate: '2020-01-01', rating: 9, reviews: 1 }, { sp: 50, title: '가', pubDate: '2024-01-01', rating: 7, reviews: 9 }];
  ok(L.slice().sort(SORT.BL_PGSORT.SalesPoint)[0].sp === 50 && L.slice().sort(SORT.BL_PGSORT.Title)[0].title === '가' && L.slice().sort(SORT.BL_PGSORT.PublishTime)[0].pubDate === '2024-01-01' && L.slice().sort(SORT.BL_PGSORT.CustomerRating)[0].rating === 9 && SORT.BL_PGSORT_NAME.MyReviewCount === '리뷰 수', 'TTB Sort 대신 다 본 뒤 줄 세움(판매량·상품명·출간일·평점·리뷰)');
  const cand = cut(CSRC, "  if (g.phase === 'cand') {", "  const L = (await BLI()");
  ok(/q\.list && q\.list !== 'search'/.test(cand) && /ttbEnded: TTB_END/.test(cand) && /wsearchresult\.aspx\?SearchTarget=/.test(cand) && /stage: 'scan'/.test(cand) && /phase: 'look'/.test(cand), "벤치마킹: 목록 종류는 공개 목록 화면(못 읽으면 멈춤) · 검색어는 공개 검색 화면 → look(공개 상품 화면)");
  const look = cut(CSRC, "  if (g.phase === 'look') {", "  if (g.phase === 'cand') {"); ok(/alPubItem\(p, \{ isbn, id: v\.newId/.test(look) && /\(RG && RG\.badges\)/.test(look) && /검색어 없음/.test(look) && /분류 다름/.test(look), 'look 단계 = 공개 상품 화면 · 검색어 그룹도 받음(RG 없음) · 제목·저자·출판사·분류는 읽은 값으로 거름');
  ok(/const TTB_END = '2026-10-30'/.test(CSRC) && /ttbEnded: TTB_END, src:/.test(CSRC), "SP 표본 상태에 '알라딘 OpenAPI 종료 → 대체 출처' 남김");
  const ut = cut(CSRC, 'async function utTick()', '\nasync function'); ok(/wsearchresult\.aspx\?SearchTarget=All&SearchWord=/.test(ut) && !/blTtb/.test(ut), "'전체 중고 (N)' 채우기 = ISBN → 상품 번호를 공개 검색 화면으로");

  console.log('③ 웹앱 ⑱ 외부 정보');
  const code = cut(APP, 'function extSetHtml() {', '\n/* (정범님 11/10) 🌐 외부 연결 키');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const St = { ext: { cfg: {}, run: { last: { ttb: { ok: false, at: '2026-11-01T00:00:00Z', why: '999 종료' } } }, keys: { keys: { aladinTtb: 'OLDKEY9999', kakaoRest: 'KK1234' }, meta: {} }, keysErr: null, cmd: {}, runAt: Date.now() } };
  const html = new Function('EXTF', 'extWatch', 'extRunLoad', 'extKeysLoad', 'isAdminDevice', 'S', 'esc', 'kTime', 'num', 'extMask', 'ebayDelHtml', 'extRedraw', code + '\nreturn extSetHtml();')(() => X, () => {}, () => {}, async () => {}, () => true, St, esc, (t) => String(t || ''), (n) => String(n), (v) => (v ? '저장됨 ••••' + String(v).slice(-4) : ''), () => '', () => {});
  ok(!/data-extkey="aladinTtb"/.test(html) && /data-extkeyend="aladinTtb"/.test(html) && /OpenAPI 종료\(10\/30\)/.test(html) && /종료됨 \(10\/30\)/.test(html) && /data-extdel="aladinTtb"/.test(html), "TTB 키 넣는 칸 없음 → '알라딘 OpenAPI 종료(10/30)' 안내 · 예전 키는 지우기만");
  ok(/data-extkey="kakaoRest"/.test(html) && /data-extkey="nlKey"/.test(html), '다른 키 칸은 그대로');
  const row = (html.match(/<tr data-extsrcend="ttb"[\s\S]*?<\/tr>/) || [''])[0]; ok(row && /종료됨 \(2026-10-30\)/.test(row) && /대체 출처: 알라딘 공개 상품 화면/.test(row) && !/999/.test(row) && !/data-extsrc="ttb"/.test(html), "출처 표 TTB 줄 = '종료됨 — 대체 출처'(실패 ✗ 기록 대신)", row.slice(0, 300));
  ok(/<tr data-extsrcend="naver"/.test(html), '끝난 네이버 책 검색 줄도 같은 꼴');
  ok(/\['Bestseller', '베스트셀러 \(공개 목록 화면\)'\]/.test(APP) && /공개 검색 화면/.test(APP) && /10\/30 종료 전에 받은 값/.test(APP), '벤치마킹 목록 종류 = 공개 목록 화면(adapt1 11/11 되살림) · 설명서에 대체 출처 · 예전 TTB 값엔 「10/30 종료 전」');

  console.log('④ 번외 수집기');
  const t = TK.byK['ext.ttb']; ok(t && t.state === 'ended' && t.ended === '2026-10-30' && !TK.plan('office', {}).includes('ext.ttb') && !TK.plan('logger', { extShare: true }).includes('ext.ttb'), '번외 ext.ttb = 종료됨 · 어느 PC 계획에도 없음', t && t.state);
  console.log(bad ? `❌ tTTB1111 실패 ${bad}` : '✓ tTTB1111 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
