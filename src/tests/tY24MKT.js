// tY24MKT — 정범님 11/09: 🟦 예스24 시장 지표(알라딘과 따로) · 판매자 카드·믿음 점수 · 검색 주소 고침 · 우리 매물 순위 · 바이백 매입가
//   ① 공용 파일(readnow-ext-core.js) 가짜 예스24 응답 풀기 ② 클라우드 회차(y24MktTick) — 따로 기록(y24_mkt·y24_mkt_changes) · 사람 속도(화면 사이 4~8초) · 하루 상한 · 403/429/캡차 멈춤 · 알라딘 칸은 안 건드림
//   ③ 웹앱 — 상품 카드 시장 지표 알라딘/예스24 기본값 = 🪟 알라딘 창 첫 화면 판정(refPick)과 같음 · 📊 시장 지표 전체 보이기/숨기기(rn-mkt-all · 모든 블록 함께)
// 실행: cd pw && RN_PORT=<포트> node tY24MKT.js   (공용 파일·클라우드는 ../readnow-ext-core.js · ../cloud/index.js — 빌드 복사본 자리)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 240)); };
const ROOT = path.join(__dirname, '..'); const X = require(path.join(ROOT, 'readnow-ext-core.js'));
// ── 가짜 예스24 응답(실제 화면 꼴을 줄여 흉내 · 손님 정보 없음)
const li = (o) => `<li salePrice="${o.p}" levelGb="${o.lv}" data-goods-no="${o.id}"><div class="itemUnit"><div class="item_info"><div class="info_row info_status"><span class="ico_used">${o.g}</span></div>
<div class="info_row info_name"><a class="gd_name" href="/product/goods/${o.id}">시험 책</a></div><div class="info_row info_price"><span class="txt_sale"><em class="num">30</em>%</span><strong class="txt_num"><em class="yes_b">${o.p.toLocaleString()}</em>원</strong></div>
${o.cmt ? `<div class="info_row info_storeCmt">${o.cmt}</div>` : ''}<div class="info_row info_deli">배송비 : ${(o.s || 3000).toLocaleString()}원, ${o.sn}에서 ${(o.fo || 30000).toLocaleString()}원 이상 구매 시 무료배송</div><div class="info_row info_usedIco"><span class="iconC icon_deliS"><em class="txt">판매자 배송</em></span></div></div>
<div class="item_storeCol">${o.biz ? '<span class="iconC isSeller"><em class="txt">사업자</em></span>' : ''}<div class="store_name deliS"><a href="https://www.yes24.com/24/usedShop/mall/${o.sid}/main">${o.sn}</a></div><div class="store_rating deliS"><span class="bgYUI rating rating_${o.rt}">판매자 만족도</span></div><div class="store_txt">(${o.rn}명 평가)</div></div>
<input type="hidden" name="ORD_GOODS_OPT" value="{&quot;goods_no&quot;:${o.id},&quot;order_remain_count&quot;:${o.rem || 1}}"></div></li>`;
const rowsA = Array.from({ length: 24 }, (_, i) => ({ id: String(300000 + i), p: 5000 + i * 500, lv: i % 3 ? '02' : '01', g: i % 3 ? '상' : '최상', sid: i === 4 ? 'jerrycson' : 'shop' + (i % 5), sn: i === 4 ? '북스퀸' : '가게' + (i % 5), rt: 4, rn: i === 1 ? 0 : 50, biz: i % 2 === 0, cmt: i === 1 ? '계좌이체 할인 카톡 문의' : i === 2 ? '빠른 배송' : '', fo: i === 3 ? 100 : 30000, rem: i === 5 ? 4 : 1 }));
rowsA[1].p = 900; /* 같은 등급 가운데 값의 30% 아래 · 평가 0 · 직거래 글귀 → 주의 */
const rowsB = Array.from({ length: 6 }, (_, i) => ({ id: String(300100 + i), p: 20000 + i * 1000, lv: '03', g: '중', sid: 'shop9', sn: '가게9', rt: 5, rn: 120 }));
const hubDoc = (rows) => `<html><body><a onclick="getUsedGoodsListTab(&#39;ALL&#39;,this,&#39;001_001&#39;)"><span class="txt">전체 (30)</span></a><a onclick="getUsedGoodsListTab(&#39;C2C&#39;,this,&#39;001_004&#39;)"><span class="txt">판매자 배송 (30)</span></a>
<input type="hidden" id="hdnLevelMinAmount01" value="5000" /><input type="hidden" id="hdnLevelMinAmount04" value="10000000" /><table><tr><th scope="row">새상품 정가</th><td>18,000원</td></tr><tr><th scope="row">새상품 판매가</th><td>16,200원</td></tr></table>
<ul>${rows.map(li).join('')}</ul><div class="hubPagen"><a onclick="getUsedGoodsListPage(this, 2);">2</a></div></body></html>`;
const listDoc = (rows) => `<ul>${rows.map(li).join('')}</ul><div class="hubPagen"><strong class="num">2</strong></div>`;
const topDoc = (biz, notes) => `<h3 class="used-shop-name">${biz ? '<span class="iconC isSeller"><em class="txt">사업자</em></span>' : ''} 가게0님의 가게</h3><ul>${notes.map((n) => `<li><a style="cursor:pointer;" class="click_noti" >${n[0]}</a>\n<input class="noti_cont" id="a" name="a" type="hidden" value="${n[1]}" /></li>`).join('')}</ul><p><big>배송비 안내:</big> 3,000원, 가게0에서 30,000원 이상 구매 시 무료배송</p>`;
const mainDoc = `<dd class="shop-satis"><a><strong class="valid-value4"><span>4점</span></strong></a> (<a><span>320</a>명</span> 평가)</dd><dt class="send-date">평균 발송일:</dt><dd class="send-date">주문완료 후 1일</dd><a href="https://www.yes24.com/Mall/Help/CS/Apply?AplNo=33&AplGb=36&entrNo=111222&nickName=x">문의</a>`;
const leftDoc = `<a href="javascript:;" class="selected clickCate">중고도서 (1,234)</a><a class="selected clickCate">중고음반 (66)</a>`;
const ratingDoc = `<h4>판매자 평가 <span class="data">평균 평가 : <strong class="valid-value4"><span>4점</span></strong> (전체 <em>320</em>명의 평가가 있습니다.)</span></h4><tr><td class="col2"><strong class="valid-value5"><span>5점</span></strong></td><td class="col3">좋아요</td><td class="col4">손님A**</td><td class="col5">2026.11.01</td></tr>`;
const bbDoc = `<h3><strong>'9791100000017'</strong> 검색결과 <strong>1건</strong></h3><div class="bbGoodsList"><ul><li><div class="bbG_img"><a href="/product/goods/555"></a></div><div class="bbG_info"><strong class="name">시험 책</strong><span class="bbG_isbn13">ISBN13 - 9791100000017</span><table><tbody><tr><td>18,000원</td><td>7,000원</td><td>6,000원</td><td>5,000원</td></tr></tbody></table></div></li></ul></div>`;
const searchDoc = `<div class="itemUnit"><a href="/Product/UsedShopHub/Hub/777">시험 책</a></div>`;
(async () => {
  console.log('① 공용 파일 — 가짜 예스24 응답 풀기');
  const P = X._y24HubPage(hubDoc(rowsA), '777'); ok(P.items.length === 24 && P.tab.ALL === 30 && P.tab.C2C === 30, '허브 머리 탭 개수(&#39; 따옴표) · 첫 쪽 24줄', { n: P.items.length, tab: P.tab });
  ok(P.lvMin['최상'] === 5000 && !('하' in P.lvMin) && P.lastPage === 2 && P.newList === 18000, '등급별 최저가 숨은 칸(10000000은 없음) · 쪽 수 · 새상품 정가', { lv: P.lvMin, last: P.lastPage });
  const a1 = P.items[1]; ok(a1.cmt === '계좌이체 할인 카톡 문의' && P.items[0].biz === true && a1.biz === false && P.items[5].remain === 4, '판매자 한마디 · 사업자 표시 · 남은 수(숨은 JSON)', { cmt: a1.cmt, rem: P.items[5].remain });
  const Q = X._y24HubPage(listDoc(rowsB), '777'); ok(Q.items.length === 6 && Q.lastPage === 2, 'GoodsList 조각(2쪽)도 같은 함수로 풂', Q.items.length);
  ok(X.y24GoodsListUrl({ hubId: '777', page: 2 }) === 'https://www.yes24.com/Product/UsedShopHub/GoodsList?goodsNo=777&masterGoodsNo=777&delvType=ALL&pageNumber=2&sortGb=01&levelGb=00&saleTypeGb=00', '허브 목록 주소(delvType·pageNumber·sortGb·levelGb·saleTypeGb)');
  const su = X.y24SearchUrl('[중고] 한강'); ok(/domain=USED_GOODS&query=%ED%95%9C%EA%B0%95&page=1&size=24&order=SINDEX_ONLY$/.test(su), '검색 주소에 page·size·order를 늘 붙임(인기어 첫 화면 넘김 피함)', su);
  const all = { ...P, items: P.items.concat(Q.items) }; const rec = X.y24MktRec(all, { isbn: '9791100000017', hubId: '777', at: '2026-11-09T10:00:00Z' });
  ok(rec.src === 'yes24' && rec.total === 30 && rec.n === 30 && rec.full === true && rec.page1.length === 24 && rec.byG['중'].n === 6 && rec.min === 900, '시장 지표 기록(예스24 따로 · 전체 30 · 등급별)', { n: rec.n, byG: rec.byG });
  const rec2 = X.y24MktRec({ ...all, items: [all.items[0], ...all.items.slice(2)].map((x, i) => (i === 3 ? { ...x, p: x.p + 100 } : x)) }, { isbn: '9791100000017' }); const D = X.y24MktDiff(rec, rec2); const D0 = X.y24MktDiff(rec, rec);
  ok(!D.same && D.gone.includes('300001') && D.px.length === 1 && D.add.length === 1 && D0.same, '첫 쪽 바뀜 견주기(사라짐·새로·값 바뀜 · 같으면 same)', { gone: D.gone, add: D.add, px: D.px });
  const ours = X.y24OurRank(all.items, { sellerIds: ['jerrycson'] }); ok(ours.length === 1 && ours[0].rank === 5 && ours[0].gOf === 16 && ours[0].gRank === 3, '우리 매물 순위(최저가순 · 같은 등급)', ours);
  const card = X.y24SellerCard({ top: topDoc(true, [['직거래 환영', '계좌 입금 주시면 010-0000-0000로 연락'], ['반품 안내', '반품 불가합니다']]), main: mainDoc, left: leftDoc, rating: ratingDoc }, 'shop0', { now: Date.parse('2026-11-09') });
  ok(card.biz && card.entr === '111222' && card.rating === 4 && card.ratingN === 320 && card.send === 1 && card.items === 1300 && card.ship.fo === 30000, '판매자 카드(사업자·만족도·평가 수·평균 발송일·분야별 판매 수·무료 기준)', card);
  ok(card.flags.includes('direct') && card.flags.includes('phone') && card.flags.includes('noReturn') && !JSON.stringify(card.notes).includes('0000-0000'), '공지 글귀 지문(직거래·전화·반품 불가) · 전화번호는 가려 남김', { flags: card.flags, notes: card.notes });
  const T = X.y24TrustAll(rec, { shop0: card }); const bad1 = T[1].tr, good0 = T[2].tr, sh0 = T[0].tr;
  ok(bad1.lv === 'warn' && bad1.why.some((w) => /평가 0명/.test(w)) && bad1.why.some((w) => /한마디에 직거래/.test(w)) && bad1.why.some((w) => /30% 아래/.test(w)), '허위 매물 의심(평가 0·직거래 한마디·턱없이 싼 값) → 주의', bad1);
  ok(T[3].tr.why.some((w) => /사실상 무료/.test(w)) && T[5].tr.why.some((w) => /남은 수 4/.test(w)) && sh0.why.some((w) => /공지에 직거래/.test(w)), '무료 기준 100원 · 중고인데 남은 수 4 · 판매자 공지 직거래 글귀 감점', { t3: T[3].tr.why, t5: T[5].tr.why, t0: sh0.why });
  ok(good0.s >= 50 && typeof good0.s === 'number' && T.every((x) => x.tr.s >= 0 && x.tr.s <= 100), '점수 0~100 · 까닭을 늘 남김', good0);
  const B = X.y24Buyback(bbDoc, '9791100000017'); ok(B.hit && B.hit.best === 7000 && B.hit.high === 6000 && B.hit.mid === 5000 && B.hit.list === 18000, '바이백 매입가(최상·상·중·정가)', B.hit);
  ok(X.y24HubIds(searchDoc).join() === '777', '검색 화면 → 허브 번호');
  // 사람 속도·하루 상한·멈춤(순수 함수)
  const pace = [0, 0.5, 1, -3, 9].map((r) => X.y24PaceMs(r)); ok(pace.every((x) => x >= 4000 && x <= 8000) && X.y24PaceMs(0, { paceMin: 1000 }) === 4000, '화면 사이 4~8초(설정으로도 4초 아래는 못 내림)', pace);
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  ok(X.y24Gate({ day, n: 120 }).ok === false && X.y24Gate({ day: '2000-01-01', n: 999 }).ok === true && X.y24Gate({ cap: 10, day, n: 3 }).left === 7, '하루 상한(기본 120화면 · 날이 바뀌면 다시)');
  ok(X.y24Blocked(429, '') && X.y24Blocked(403, '') && X.y24Blocked(200, '<div>자동입력 방지 문자를 입력</div>') && !X.y24Blocked(200, hubDoc(rowsA)), '403·429·캡차 화면 알아봄');
  ok(X.y24Gate({ stopUntil: new Date(Date.now() + 3600e3).toISOString(), stopWhy: 'HTTP 429' }).stopped === true, '멈춤 시각 전엔 읽지 않음');

  console.log('② 클라우드 회차 — 가짜 예스24 · 가짜 Firestore');
  const src = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const i0 = src.indexOf('let y24mAt = 0;'); const i1 = src.indexOf('/* (0.26.0) 🟦 예스24 우리 가게 매물'); ok(i0 > 0 && i1 > i0, '클라우드에 y24MktTick 있음');
  const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); let seq = 0; const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
    const Q = (n, fl, lim, ord) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]], lim, ord), orderBy: (k) => Q(n, fl, lim, k), limit: (x) => Q(n, fl, x, ord), select: () => Q(n, fl, lim, ord),
      get: async () => { let L = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => { const a = get(v, k); return a != null && (op === '>=' ? a >= x : op === '<' ? a < x : op === '==' ? a === x : true); })); if (ord) L.sort((a, b) => String(get(a[1], ord)).localeCompare(String(get(b[1], ord)))); L = L.slice(0, lim || 1e9); const docs = L.map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })); return { docs, empty: !docs.length, forEach: (f) => docs.forEach(f) }; } });
    const C = (n) => ({ ...Q(n, [], 0, null), doc: (id) => ({ get: async () => ({ exists: !!col(n)[id], data: () => (col(n)[id] ? JSON.parse(JSON.stringify(col(n)[id])) : undefined) }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...JSON.parse(JSON.stringify(v)) } : JSON.parse(JSON.stringify(v)); } }), add: async (v) => { col(n)['a' + ++seq] = JSON.parse(JSON.stringify(v)); } });
    return { D, C }; };
  const run = async (FS, resp, opt) => { const calls = [], waits = []; const fetch = async (u) => { calls.push(u); const r = resp(u); return { ok: r.status === 200, status: r.status, text: async () => r.body, arrayBuffer: async () => Buffer.from(r.body), headers: { get: () => 'text/html; charset=utf-8' } }; };
    const sleep = async (ms) => { waits.push(ms); }; const y24Dec = async (r) => String(Buffer.from(await r.arrayBuffer())); const logs = [];
    const f = new Function('C', 'extMod', 'fetch', 'sleep', 'nowIso', 'log', 'UA', 'VER', 'y24Dec', src.slice(i0, i1) + '\nreturn y24MktTick;')(FS.C, async () => X, fetch, sleep, () => new Date().toISOString(), (m) => logs.push(m), 'UA', 'test', y24Dec);
    const out = await f(); return { out, calls, waits, logs }; };
  const ok200 = (u) => /product\/search/.test(u) ? { status: 200, body: searchDoc } : /GoodsList/.test(u) ? { status: 200, body: listDoc(rowsB) } : /UsedShopHub\/Hub/.test(u) ? { status: 200, body: hubDoc(rowsA) } : /Buyback/.test(u) ? { status: 200, body: bbDoc } : /Main_topnotice/.test(u) ? { status: 200, body: topDoc(true, [['안내', '빠른 발송']]) } : /SellerRating/.test(u) ? { status: 200, body: ratingDoc } : /Main_leftmenu/.test(u) ? { status: 200, body: leftDoc } : /mall\/.*\/main/.test(u) ? { status: 200, body: mainDoc } : { status: 404, body: '' };
  const F1 = mkFS(); F1.D.y24_mkt = { 9791100000017: { isbn: '9791100000017', req: { at: new Date().toISOString() } } }; F1.D.app_settings = { y24_mkt_state: { tickMax: 9, sellerMax: 1 } }; F1.D.prd_book_metrics = { b1: { usedTotal: 5 } }; F1.D.y24_listings = { 300004: { goodsNo: '300004', isbn13: '9791100000017' } };
  const R1 = await run(F1, ok200); const M1 = F1.D.y24_mkt['9791100000017'];
  ok(R1.out && R1.out.pages >= 5 && M1.hubId === '777' && M1.n === 30 && M1.total === 30 && M1.bb.best === 7000 && M1.ours[0].rank === 5 && M1.page1[0].tr, '요청한 책: 검색→허브→2쪽→바이백→판매자 카드 · y24_mkt에 따로 기록', { out: R1.out, n: M1.n, ours: M1.ours });
  ok(R1.calls[0].includes('&page=1&size=24&order=') && R1.calls.some((u) => /GoodsList\?.*pageNumber=2/.test(u)), '검색은 고친 주소 · 2쪽은 GoodsList', R1.calls.slice(0, 3));
  ok(R1.waits.length === R1.calls.length - 1 && R1.waits.every((w) => w >= 3900 && w <= 8000), '사람 속도: 화면 사이마다 4~8초 쉼', R1.waits);
  ok(Object.values(F1.D.y24_mkt_changes || {}).length === 1 && Object.values(F1.D.y24_mkt_changes)[0].kind === 'y24Listings' && JSON.stringify(F1.D.prd_book_metrics) === '{"b1":{"usedTotal":5}}' && !F1.D.prd_metric_changes, '첫 쪽 기록은 y24_mkt_changes에만(알라딘 prd_book_metrics·prd_metric_changes 안 건드림)');
  ok(Object.keys(F1.D.y24_sellers || {}).length === 1 && F1.D.app_settings.y24_mkt_state.n === R1.out.pages, '판매자 카드 한 곳(한 회차 상한) · 오늘 쓴 화면 수 기록', { sellers: Object.keys(F1.D.y24_sellers || {}), st: F1.D.app_settings.y24_mkt_state });
  // 같은 첫 쪽을 다시 읽으면 바뀜 기록이 늘지 않음
  F1.D.y24_mkt['9791100000017'].req = { at: new Date(Date.now() + 1000).toISOString() }; const R1b = await run(F1, ok200); ok(R1b.out && Object.values(F1.D.y24_mkt_changes).length === 1, '같은 첫 쪽이면 바뀜 기록 안 더함', R1b.out);
  // 하루 상한
  const F2 = mkFS(); const day2 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); F2.D.y24_mkt = { 9791100000017: { req: { at: new Date().toISOString() } } }; F2.D.app_settings = { y24_mkt_state: { day: day2, n: 118, cap: 120 } };
  const R2 = await run(F2, ok200); ok(R2.calls.length === 2 && F2.D.app_settings.y24_mkt_state.n === 120, '하루 상한 120화면에서 멈춤(남은 2화면만)', { calls: R2.calls.length, st: F2.D.app_settings.y24_mkt_state });
  const R2b = await run(F2, ok200); ok(R2b.calls.length === 0, '상한을 다 쓰면 그날은 더 읽지 않음');
  // 429 · 캡차 → 멈춤
  const F3 = mkFS(); F3.D.y24_mkt = { 9791100000017: { req: { at: new Date().toISOString() } } }; F3.D.app_settings = { y24_mkt_state: {} };
  const R3 = await run(F3, (u) => (/UsedShopHub\/Hub/.test(u) ? { status: 429, body: '' } : ok200(u))); const st3 = F3.D.app_settings.y24_mkt_state;
  ok(R3.calls.length === 2 && /429/.test(st3.stopWhy || '') && Date.parse(st3.stopUntil) > Date.now() + 5 * 3600e3, '429 → 그 자리에서 멈추고 6시간 쉼', st3);
  const R3b = await run(F3, ok200); ok(R3b.calls.length === 0 && R3b.out && /멈춤/.test(R3b.out.stop || ''), '멈춘 동안은 아무 화면도 안 읽음', R3b.out);
  const F4 = mkFS(); F4.D.y24_mkt = { 9791100000017: { req: { at: new Date().toISOString() } } }; F4.D.app_settings = { y24_mkt_state: {} };
  const R4 = await run(F4, (u) => (/product\/search/.test(u) ? { status: 200, body: '<form>자동입력 방지 문자</form>' } : ok200(u))); ok(R4.calls.length === 1 && /캡차/.test(F4.D.app_settings.y24_mkt_state.stopWhy || ''), '캡차 화면 → 멈춤', F4.D.app_settings.y24_mkt_state);

  console.log('③ 웹앱 — 카드 고름 기본값 · 전체 토글');
  let ran3 = false; await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    const r = await p.evaluate(async (rowsJ) => { const W = (ms) => new Promise((z) => setTimeout(z, ms)); const out = {}; S.user = S.user || { email: 'tester@x' };
      try { localStorage.removeItem('rn-refplat'); localStorage.removeItem('rn-mkt-all'); } catch (e) {} mktAllApply();
      const l = { id: 'aladin_U9', usedCode: 'U9', listingId: 'L9', status: '판매중', active: true, qty: 1, grade: '상', price: 9000, title: '시험 책', isbn13: '9791100000017', bookId: 'bk9' }; S.plist.set(l.id, l);
      const same = () => { const P = refPick(pmkRefCtx(l)); return pmkSrcOf(l).k === (P && P.p.k === 'yes24' ? 'yes24' : 'aladin'); };
      const pg0 = window.pgdCur; out.def = pmkSrcOf(l); out.same0 = same();
      window.pgdCur = () => 'y24Product'; out.scr = pmkSrcOf(l); out.same1 = same(); window.pgdCur = () => 'register'; out.reg = pmkSrcOf(l); out.same2 = same(); window.pgdCur = pg0;
      refSeenSet(pmkRefCtx(l), 'yes24'); out.seen = pmkSrcOf(l); out.same3 = same(); out.alw = refPick(pmkRefCtx(l)).p.k; try { localStorage.removeItem('rn-refplat'); } catch (e) {}
      // 예스24 기록(가짜) → 카드
      await db.collection('y24_mkt').doc('9791100000017').set(JSON.parse(rowsJ)); S.pmk.pref = true; S.pmk.open[l.id] = true;
      document.body.insertAdjacentHTML('beforeend', '<div id="t24"></div>'); const box = document.getElementById('t24'); const draw = () => { box.innerHTML = pmkCardHtml(l); }; S._prodDraw = draw; draw();
      out.segN = box.querySelectorAll('[data-pmksrc]').length; box.querySelector('[data-pmksrc$="|yes24"]').click(); await W(500); draw(); await W(200); draw();
      const t = box.innerText; out.y = { pick: S.pmkSrc[l.id], seenSet: (JSON.parse(localStorage.getItem('rn-refplat') || '{}') || {})['b9791100000017'], buy: /바이백 최상/.test(t), rank: /최저가순 5번째/.test(t), trust: /주의/.test(t), diff: /사라짐/.test(t), tab: /판매자 배송 30/.test(t) };
      box.querySelector('[data-y24mreq]').click(); await W(300); out.req = !!((window.__FS.y24_mkt || {})['9791100000017'] || {}).req && !!(window.__FS.y24_mkt['9791100000017'].req || {}).by;
      // 전체 토글 — 상품 카드·시장 블록(prBlocks) 모두 같은 함수
      S._prodDraw = () => {}; /* 아래 블록을 다시 그려 지우지 않게 */ document.body.insertAdjacentHTML('beforeend', '<div id="t24b"></div>'); const box2 = document.getElementById('t24b'); box2.innerHTML = prBlocks({ page1: [{ p: 9000, g: '상', s: 3000, c: 'other', n: '가게' }], noTools: 1 }); const AL = () => [...box.querySelectorAll('.mktw'), ...box2.querySelectorAll('.mktw')]; out.wraps = AL().length; const vis = () => AL().map((w) => w.querySelector('.mktx')).map((x) => getComputedStyle(x).display !== 'none');
      out.v0 = vis(); box.querySelector('[data-mktall="0"]').click(); await W(100); out.v1 = vis(); out.k1 = localStorage.getItem('rn-mkt-all'); out.off = document.body.classList.contains('mkt-off'); out.showBtn = AL().map((w) => w.querySelector('.mkta-show')).every((b) => getComputedStyle(b).display !== 'none');
      box2.querySelector('[data-mktall="1"]').click(); await W(100); out.v2 = vis(); out.k2 = localStorage.getItem('rn-mkt-all');
      out.url = yes24Used('한강'); box.remove(); box2.remove(); return out; }, JSON.stringify({ isbn: '9791100000017', at: new Date().toISOString(), hubId: '777', total: 30, n: 30, tab: { ALL: 30, C2C: 30 }, byG: { 상: { n: 16, min: 900 } }, bb: { at: '2026-11-09', best: 7000, high: 6000, mid: 5000, list: 18000 }, ours: [{ id: '300004', g: '상', p: 7000, rank: 5, of: 30, gRank: 3, gOf: 16, gLow: false, cheaper: 4 }], lastDiff: { at: '2026-11-09T09:00:00Z', add: 1, gone: 1, px: 0, min: { from: 900, to: 900 } }, page1: [{ r: 1, id: '300001', g: '상', p: 900, s: 3000, sid: 'shop1', sn: '가게1', rt: 4, rn: 0, biz: 0, cmt: '계좌이체', tr: { s: 5, lv: 'warn', why: ['-20 평가 0명'] } }, { r: 5, id: '300004', g: '상', p: 7000, sid: 'jerrycson', sn: '북스퀸', tr: { s: 80, lv: 'good', why: [] } }] }));
    ok(r.def.k === 'aladin' && r.def.why === 'def' && r.same0, '기본(처음 보는 상품) = 알라딘 · 🪟 창 판정과 같음', r.def);
    ok(r.scr.k === 'yes24' && r.scr.why === 'scr' && r.same1 && r.reg.k === 'aladin' && r.same2, '지금 화면의 일(🟦 예스24 화면 → 예스24 · 등록 → 알라딘) — refPick 그대로', { scr: r.scr, reg: r.reg });
    ok(r.seen.k === 'yes24' && r.seen.why === 'seen' && r.same3 && r.alw === 'yes24', '이 상품에서 최근 본 곳(예스24) → 카드도 창도 예스24', r.seen);
    ok(r.segN === 2 && r.y.pick === 'yes24' && r.y.seenSet === 'yes24', '카드 [알라딘|예스24]를 누르면 그쪽 · 최근 본 곳에도 남김(창과 같은 기억)', r.y);
    ok(r.y.buy && r.y.rank && r.y.trust && r.y.diff && r.y.tab, '예스24 시장 지표 카드: 탭별 개수·바이백·우리 순위·믿음 점수·첫 쪽 바뀜', r.y);
    ok(r.req, '⇢ 예스24 시장 다시 읽기 → y24_mkt 요청(req) 남김 — 클라우드가 읽음');
    ok(r.wraps >= 2 && r.v0.every(Boolean) && r.v1.every((x) => !x) && r.k1 === '0' && r.off && r.showBtn, '전체 숨기기: 상품 카드·시장 블록이 함께 숨고 「보이기」만 남음 (rn-mkt-all=0)', { v0: r.v0, v1: r.v1 });
    ok(r.v2.every(Boolean) && r.k2 === '1', '어느 블록의 「보이기」로든 전체가 다시 보임', r.v2);
    ok(/product\/search\?domain=USED_GOODS&query=.*&page=1&size=24&order=/.test(r.url), '웹앱 예스24 검색 링크도 고친 주소', r.url); ran3 = true;
  });
  ok(ran3, '③ 웹앱 시험이 끝까지 돌았음');
  console.log(bad ? `❌ tY24MKT 실패 ${bad}` : '✓ tY24MKT 통과'); process.exitCode = bad ? 1 : 0; })();
