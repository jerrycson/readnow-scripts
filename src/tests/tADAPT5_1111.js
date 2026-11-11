// tADAPT5_1111 — 11/11 adapt5: 🧬 수집 적응 엔진 5회차(약속 0·55 · 연구 N10)
//   ① SP 묶음 실제 맞춤률 0.425(셈 0.823)의 까닭: 배운 k 24 — 알라딘은 한 검색어의 번호 12개(약 170자)까지만 찾음(같은 날 편집자 추천 12개 3쪽 = 36/36권)
//      → k 상한 12·검색어 170자 · 4판까지 '못 맞춤'으로 7일 쉰 것 다시 · 여러 번호에서 못 찾은 상품은 지은이·제목으로 · 자리마다 맞춘 수(pos)
//   ② 진단 run=1(동시 처리·메모리·처리 중 요청 수·보낸 429) · 배포 뒤 설정 알림
//   ③ 편집자 추천 여러 번호 검색 12개·170자·8쪽 · 상품 화면은 ISBN 없는 줄까지 · 목록 ISBN 상품 화면 하루 20권
//   ④ 전자책 있는 줄 표시(ebookHas) — 전자책 값 채움을 전자책 있는 줄 가운데로
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tADAPT5_1111.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const WF = fs.readFileSync(find(['.github/workflows/deploy-cloud.yml']), 'utf8');
const D = (h) => new JSDOM(h).window.document;
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
/* 맞는 검사 숫자의 ISBN10(지어낸 앞 9자리) */
const i10 = (b9) => { let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +b9[i]; const c = (11 - (s % 11)) % 11; return b9 + (c === 10 ? 'X' : String(c)); };
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[국내도서]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a></li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au}@1">${b.au}</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2">${b.pub}</a> | 2020년 10월</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인)</li><li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div>
  <div class="ss_book_list"><ul>${b.eb ? `<li><span class="ebook_price">이 책의 전자책 : <em>${fmt(b.eb)}</em>원</span> <a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}9" title="보러 가기" class="view_blue_btn">보러 가기</a></li>` : ''}</ul></div></td>
  <td><div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.cov}">장바구니</a></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><body><form>${L.map(box).join('')}</form></body></html>`;

(async () => {
  console.log('① SP 묶음 — 검색어 번호 12개·170자 상한');
  const covs = Array.from({ length: 30 }, (_, i) => i10('89' + String(1000000 + i * 37).padStart(7, '0')));
  const items = covs.map((c, i) => ({ id: 'b' + i, coverKey: c })).concat([{ id: 'km', coverKey: 'K123456789', missM: 1, title: '여러 번호 못 찾은 시험 책', author: '가나' }]);
  const P = A.spBatchPlan3(items, { k: 24 }); const M = P.filter((g) => g.field === 'Multi');
  ok(M.length === 3 && M.every((g) => g.keys.length <= 12 && g.q.length <= 170) && M.reduce((a, g) => a + g.keys.length, 0) === 30, '배운 k 24여도 한 검색어 번호 12개·170자까지(30개 → 12·12·6)', M.map((g) => [g.keys.length, g.q.length]));
  const P2 = A.spBatchPlan3(items, { k: 24, kMax: 24, qMax: 120 }); ok(P2.filter((g) => g.field === 'Multi').every((g) => g.q.length <= 120) && P2.filter((g) => g.field === 'Multi')[0].keys.length === 8, '글자 상한(qMax)이 먼저 닿으면 거기서 끊음(ISBN 13자 + 띄어쓰기 · 8개 = 111자)', P2.filter((g) => g.field === 'Multi').map((g) => g.q.length));
  ok(!M.some((g) => g.ids.includes('km')) && P.some((g) => g.field === 'Title' && g.ids.includes('km')), '여러 번호 검색에서 한 번 못 찾은 상품(missM)은 제목 검색으로');
  const P3 = A.spBatchPlan3([{ id: 't1', title: '가 시험', author: '다다' }, { id: 't2', title: '나 시험', author: '다다' }], { yield: { Author: [20, 4], Title: [20, 18] } }); ok(!P3.some((g) => g.field === 'Author') && P3.filter((g) => g.field === 'Title').length === 2, "배운 성적 칸('Author'·'Title' 대문자 — 회차가 쓰는 이름)을 읽음(전엔 소문자만 봐서 늘 지은이 묶음)", P3.map((g) => g.field));
  ok(A.spMultiLearn(24, { n: 24, hit: 10, miss: 14, full: false, rows: 10, cap: 25 }) === 12 && A.spMultiLearn(12, { n: 12, hit: 12, miss: 0, full: false, rows: 5, cap: 25 }) === 12 && A.spMultiLearn(10, { n: 10, hit: 10, miss: 0, full: false, rows: 5, cap: 25 }) === 12, 'k 배움은 kMax(기본 12)를 넘지 않음 · 배운 24도 12로');

  console.log('  spBatchTick 한 회차 — 알라딘이 검색어 앞 12개 번호만 찾는 흉내');
  const store = {}; const sets = []; const mkDoc = (id, v) => ({ id, ref: { id }, data: () => v });
  const BI = covs.slice(0, 24).map((c, i) => mkDoc('s_' + i, { sc: '1', coverKey: c, title: '시험 책 ' + i, ...(i === 0 ? { listTryAt: new Date(Date.now() - 864e5).toISOString() } : {}), ...(i === 1 ? { listTryAt: new Date(Date.now() - 864e5).toISOString(), listTryV: 5 } : {}) }))
    .concat([mkDoc('s_gone', { sc: '1', coverKey: covs[29], title: '알라딘에 없는 책' }), mkDoc('s_km', { sc: '1', coverKey: 'K123456789', title: '여러 번호 못 찾은 시험 책', listMissM: 1 })]);
  const C2 = (name) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[name + '/' + id], data: () => store[name + '/' + id] }), set: async (v) => { store[name + '/' + id] = { ...(store[name + '/' + id] || {}), ...v }; } }), where: (k, op, v) => ({ select: () => ({ limit: () => ({ get: async () => ({ docs: name === 'bench_items' ? BI.filter((d) => d.data().sc === v) : [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }) }) });
  store['app_settings/bench'] = { targets: [{ sc: '1' }] }; store['app_settings/adapt_cfg'] = { spBatchHist: [{ day: 'x', list: 40, noMatch: 2 }], spBatchLearn: { k: 24, cap: 25, y: {} } };
  const db = { batch: () => ({ set: (ref, v) => sets.push([ref.id, v]), commit: async () => {} }), getAll: async () => [] };
  const byKey = new Map(covs.slice(0, 24).map((c, i) => [A.coverIsbn(c), { id: String(3000000 + i), cov: c, title: '시험 책 ' + i, pl: 10000, ps: 9000, sp: 100 + i, pub: '시험출판', au: '가가' }]));
  const urls = []; const pg = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async (u) => { urls.push(u); const w = decodeURIComponent((u.match(/SearchWord=([^&]*)/) || [])[1] || ''); const ks = w.split(' ').slice(0, 12); const L = ks.map((k) => byKey.get(k)).filter(Boolean); return { ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => listPage(L) }; }; try { return await fn(...a); } finally { global.fetch = sv; } } };
  global.window = { ReadnowAdapt: A }; global.DOMParser = new JSDOM('<html></html>').window.DOMParser;
  const mk = new Function('A', 'C', 'db', 'getPage', 'jsleep', 'nowIso', 'kDay', 'W', 'ADC', 'adaptMod', cut(CSRC, 'let spBatchNextAt = 0;', '\n/* (정범님 11/11 밤 ②') + '\nreturn spBatchTick;');
  const tick = mk(A, C2, db, async () => pg, async () => {}, () => '2026-11-11T10:00:00Z', () => '2026-11-11', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A);
  const r = await tick({ force: true });
  const multiUrls = urls.filter((u) => /SearchTarget=All/.test(u));
  ok(r.kMax === 12 && r.learn.k <= 12 && multiUrls.every((u) => decodeURIComponent(u.match(/SearchWord=([^&]*)/)[1]).split(' ').length <= 12), '배운 k 24 → 12 · 모든 여러 번호 검색어가 12개 이하', { kMax: r.kMax, k: r.learn && r.learn.k, n: multiUrls.map((u) => decodeURIComponent(u.match(/SearchWord=([^&]*)/)[1]).split(' ').length) });
  ok(r.list === 23 && r.noMatch === 2 && r.posHit.reduce((a, b) => a + b, 0) === 23 && r.posN.reduce((a, b) => a + b, 0) === 24, '실제 맞춤: 여러 번호 23/24(알라딘에 없는 1권만 · 전엔 뒤 12개를 없는 책으로 셈) + 제목 검색 못 찾은 1', { list: r.list, noMatch: r.noMatch, rate: r.matchRate, posHit: r.posHit });
  const w = {}; for (const [id, v] of sets) w[id] = { ...(w[id] || {}), ...v };
  ok(w.s_0 && w.s_0.sp === 100 && !w.s_1, "4판까지 '못 맞춤'으로 쉰 상품(판 표시 없음)은 다시 찾고 · 5판이 쉬게 한 것(listTryV 5)은 7일 쉼", { s0: w.s_0, s1: w.s_1 });
  ok(w.s_gone && w.s_gone.listMissM === 1 && !w.s_gone.listTryAt, '여러 번호 검색에서 못 찾은 상품 = 7일 쉬지 않고 다음 회차에 제목 검색(listMissM)', w.s_gone);
  ok(Array.isArray(r.posN) && r.posN.length === 12 && r.posHit.slice(0, 12).every((x) => x >= 1) && r.qLenMax <= 170 && r.rowsBy && Object.keys(r.rowsBy).length, '자리마다 맞춘 수(posN·posHit)·검색어 최대 길이·쪽 줄 수 나눔 — 다음 진단에서 자름 한도를 바로 봄', { posN: r.posN, posHit: r.posHit, qLenMax: r.qLenMax, rowsBy: r.rowsBy });
  const tq = urls.find((u) => /SearchTarget=Book/.test(u) && /SearchWord=[^&]*%EC%97%AC%EB%9F%AC/.test(u)); ok(!!tq && w.s_km && w.s_km.listTryAt && w.s_km.listTryV === 5, '여러 번호에서 못 찾았던 K… 책(listMissM 1)은 이번엔 제목 검색 · 그것도 못 찾으면 7일 쉼(판 표시 5)', w.s_km);
  ok(store['app_settings/adapt_cfg'].spBatchLearn.k <= 12, '저장한 배운 k도 12 이하', store['app_settings/adapt_cfg'].spBatchLearn);

  console.log('② 진단 run=1 · 배포 뒤 설정 알림');
  ok(/const RUNM = \{ inf: 0, max: 0/.test(CSRC) && /res\.on\('finish', done\); res\.on\('close', done\);/.test(CSRC) && /if \(q\.run\) \{/.test(CSRC) && /process\.memoryUsage\(\)/.test(CSRC) && /maxInstanceRequestConcurrency/.test(CSRC) && /sent429: RUNM\.n429/.test(CSRC), '진단 run=1: 처리 중 요청 수·가장 많았던 수·보낸 429·메모리·서비스 설정(동시 처리 칸)');
  const srv = cut(CSRC, 'const server = http.createServer(async (req, res) => {', "if (req.method === 'OPTIONS')"); ok(srv.indexOf('RUNM.n++') >= 0 && srv.indexOf('RUNM.n++') < srv.indexOf('SHOP.handle'), '숍 창구(/shop·/b) 요청까지 셈(먼저 돌려보내는 길보다 앞)');
  { const RUNM = { inf: 0, max: 0, n: 0, n429: 0, n5xx: 0 }; const EE = require('events'); const mkRes = () => Object.assign(new EE(), { statusCode: 200 }); const L = [mkRes(), mkRes(), mkRes()]; const body = cut(srv, '{ RUNM.n++;', '\n'); for (const res of L) new Function('RUNM', 'res', body)(RUNM, res); L[1].statusCode = 429; L[1].emit('finish'); L[1].emit('close'); ok(RUNM.max === 3 && RUNM.inf === 2 && RUNM.n429 === 1 && RUNM.n === 3, '셈: 동시 3 · 끝난 1(429) — finish·close 두 번 와도 한 번만 뺌', RUNM); }
  ok(/containerConcurrency/.test(WF) && /::notice::클라우드 설정/.test(WF) && /--concurrency 8/.test(WF), '배포 기록에 실제 동시 처리·메모리·CPU·판 알림(실패해도 배포 성공)');

  console.log('③ 편집자 추천 · 목록 ISBN');
  const ed = cut(CSRC, 'async function adaptListRead(p, type, o)', '\n/* ② TTB 대체 견줌'); ok(/pt\.length >= 12/.test(ed) && /> 170\)/.test(ed) && /multiQ < 8/.test(ed) && /x\.priceSales != null && !x\.isbn13/.test(ed), '편집자 추천: 번호 12개·170자 한 검색어 · 8쪽까지 · 상품 화면은 값 없는 줄 먼저, 남으면 ISBN 없는 줄');
  ok(/const mx = C1\.isbnEnrich == null \? 20 : \+C1\.isbnEnrich/.test(CSRC), '목록 ISBN 상품 화면 하루 20권(공용 상한 · 읽은 번호는 기억)');

  console.log('④ 전자책 있는 줄 표시');
  const doc = new DOMParser().parseFromString(listPage([0, 1, 2, 3].map((i) => ({ id: String(2000010 + i), cov: covs[i], title: '전자책 시험 ' + i, pl: 1000, ps: 900, sp: 1, pub: 'p', au: 'a', eb: i % 2 ? null : 700 }))), "text/html");
  const X = A.extractList(doc, { fp: false }); const h = A.healthOfList([X]);
  ok(X.rows.length === 4 && X.rows[0].ebookHas === '1' && X.rows[0].ebookPrice === 700 && X.rows[1].ebookHas == null && h.fields.ebookHas.fill === 0.5 && h.fields.ebookHas.opt && h.fields.ebookPrice.fill === 0.5, "전자책 있는 줄 2/4 · 그 줄 전자책 값 2/2 → '전자책 있는 책 가운데 채움' 100%(점수 밖)", { rows: X.rows.map((r) => [r.ebookHas, r.ebookPrice]), f: h.fields.ebookHas });
  ok(A.drill && Array.isArray(A.tokOf('al_list')), '훈련 화면 재료(tokOf)가 새 칸에서도 그대로');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
