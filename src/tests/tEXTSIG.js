// tEXTSIG — 🔬 11/06 외부 정보 '바뀜(옛 값 보관)' 되풀이(3번째) — 원인 증명 + 요약 지문 + 옛 지문 다시 만들기 비교
//   ① 원인: 옛 방식 지문(0.6.4·0.6.6)과 0.6.7 지문을 같은 내용으로 만들어 비교 — 내용이 같아도 방식이 바뀌면 첫 비교는 늘 '바뀜'(다시 볼 날 7·14일 → 고친 다음 날 비교 상대가 모두 옛 방식)
//      + 0.6.7에서도 출처마다 매번 달라지는 칸(예스24 중고 출고 예정일·판매자 평가 수 · eBay total·판매자 평점 · DVDPrime 조회 수·댓글 수 · 교보 리뷰 수·판매지수) 때문에 '늘 바뀜'
//   ② 새 지문(요약): 출처마다 같은 내용 두 번(매번 달라지는 칸만 다름) → 같음 · 최저가·글 수가 실제로 바뀌면 → 바뀜
//   ③ 수집기 extSave(진짜 코드 덩어리) + 가짜 Firestore: 새로 → 같음 · 옛 방식 지문 → 같음(지문만 새로 · ext_hist 0) · 최저가 바뀜 → 바뀜(ext_hist 1)
// 실행: node src/tests/tEXTSIG.js (pw/ 사본은 ../readnow-collector.user.js · ../readnow-ext-core.js)
const fs = require('fs'); const path = require('path');
const core = (n) => [path.join(__dirname, '..', '..', n), path.join(__dirname, '..', n)].find((p) => fs.existsSync(p)); const X = require(core('readnow-ext-core.js'));
const SRC = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const csrc = fs.readFileSync(SRC, 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const clone = (o) => JSON.parse(JSON.stringify(o));
/* 옛 방식 지문 — 판마다 SIG_SKIP만 달랐음(같은 해시) */
const oldSig = (skip) => (d) => { const S = new Set(skip); const norm = (x) => { if (Array.isArray(x)) return x.map(norm); if (x && typeof x === 'object') { const o = {}; Object.keys(x).sort().forEach((k) => { if (S.has(k)) return; o[k] = norm(x[k]); }); return o; } return x; }; const s = JSON.stringify(norm(d)); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + s.length; };
const sig064 = oldSig(['hit', 'ago']); const sig066 = oldSig(['hit', 'ago', 'all', 'byPlat', 'queryEcho']); const sig067 = oldSig(['hit', 'ago', 'all', 'byPlat', 'queryEcho', 'url', 'api', 'rendered', 'apiTried', 'trunc']);

/* ── 진짜 읽는 법으로 결과 만들기: 중고닷(글 링크 화면) · eBay(공식 API 응답) ── */
const jmLink = (plat, id, t, p, ago) => `<a href="/detail/${plat}/${id}?title=${encodeURIComponent(t)}&price=${p}&timeAgo=${encodeURIComponent(ago)}&location=${encodeURIComponent('서울')}&productUrl=${encodeURIComponent('https://m.bunjang.co.kr/products/' + id)}">x</a>`;
const fakeHttp = (pages) => async ({ url }) => { for (const [re, body] of pages) if (re.test(url)) return { status: 200, text: typeof body === 'function' ? body(url) : body }; return { status: 404, text: '' }; };
const ebayJson = (total, fb, items) => JSON.stringify({ total, itemSummaries: items.map((x) => ({ itemId: x.id, title: '해리 포터와 마법사의 돌 Harry Potter', price: { value: String(x.p), currency: 'USD' }, shippingOptions: [{ shippingCost: { value: String(x.ship), currency: 'USD' } }], condition: 'Very Good', conditionId: '4000', itemWebUrl: 'https://www.ebay.com/itm/' + x.id + '?_trkparms=' + Math.random(), itemLocation: { country: 'US' }, seller: { feedbackPercentage: String(fb) } })) });
(async () => {
  console.log('▶ ① 원인 증명 — 같은 내용인데 지문이 다름');
  const T = '해리 포터와 마법사의 돌'; const keys = { ebayAppId: 'APP-PRD-1', ebayCertId: 'CERT-1' };
  // 중고닷 0개(그려 읽기 길) — 11/06 로거 '중고닷 … 바뀜(옛 값 보관) 0개' 206줄과 같은 꼴
  const jm0a = { ok: true, d: { q: T, url: 'https://www.joongmo.com/?keyword=x', n: 0, items: [], rendered: true } };
  const jm0b = clone(jm0a);
  ok(sig067({ none: false, d: jm0a.d }) === sig067({ none: false, d: jm0b.d }), '중고닷 0개 · 0.6.7 방식끼리는 같음(같은 날 두 번이면 둘째는 같음 — 매번 바뀌는 칸 없음)');
  ok(sig064({ none: false, d: jm0a.d }) !== sig067({ none: false, d: jm0b.d }) && sig066({ none: false, d: jm0a.d }) !== sig067({ none: false, d: jm0b.d }), '중고닷 0개 · 7일 전에 적은 옛 방식(0.6.4·0.6.6) 지문 ≠ 0.6.7 지문 — 내용이 같아도 첫 비교는 늘 바뀜(원인 ①)');
  // 예스24 중고 허브 — 같은 매물인데 출고 예정일·판매자 평가 수만 달라짐
  const y24 = (deli, rn, p0) => ({ q: '9788983920683', url: 'https://www.yes24.com/Product/UsedShopHub/Hub/1', n: 2, hub: true, mv: 3, min: p0, cnt: 2, hubSum: { id: '1', url: 'u', min: p0, max: 9000, cnt: 2, tab: { ALL: 2 }, mins: { 판매자배송: { n: 2, min: p0 } }, newList: 12000, newSale: 10800 },
    items: [{ id: '11', t: T, p: p0, g: '최상', st: 'sell', ship: 3000, seller: '판매자가', rating: 5, ratingN: rn, chan: '판매자 배송', deliDate: deli, off: 30, url: 'u1', sim: 1, byIsbn: true, kind: 'one' }, { id: '12', t: T, p: 9000, g: '상', st: 'sell', ship: 0, seller: '판매자나', rating: 4, ratingN: 77, chan: '예스24배송', deliDate: deli, url: 'u2', sim: 1, byIsbn: true, kind: 'one' }] });
  ok(sig067({ none: false, d: y24('11/06(목) 출고 예정', 120, 5000) }) !== sig067({ none: false, d: y24('11/07(금) 출고 예정', 121, 5000) }), '예스24 중고 · 0.6.7은 출고 예정일·판매자 평가 수만 달라도 바뀜(원인 ② 늘 바뀌는 칸)');
  // eBay — 같은 매물인데 eBay 전체 수(total)·판매자 평점(fb)·추적 주소만 달라짐 (진짜 ADP.ebay로)
  const ebayRun = async (total, fb, items) => (await X.run('ebay', { isbn: '9780747532699', keys, cache: {}, http: fakeHttp([[/oauth2\/token/, JSON.stringify({ access_token: 't', expires_in: 7200 })], [/item_summary/, ebayJson(total, fb, items)]]) }));
  const EI = [{ id: 'v1|1', p: 12.5, ship: 20 }, { id: 'v1|2', p: 30, ship: 18.99 }];
  const e1 = await ebayRun(41, 99.1, EI), e2 = await ebayRun(43, 99.2, EI.slice().reverse());
  ok(e1.ok && e2.ok && e1.d.n === 2, `eBay 진짜 읽는 법으로 2개 매물 읽음: ${e1.ok} ${e1.d && e1.d.n}`);
  ok(sig067({ none: false, d: e1.d }) !== sig067({ none: false, d: e2.d }), 'eBay · 0.6.7은 전체 수(total)·판매자 평점·매물 차례만 달라도 바뀜(원인 ②)');
  // DVDPrime — 글을 열어 읽은 조회 수(hits)·댓글 수만 달라짐 (SIG_SKIP의 'hit'과 칸 이름이 달라 안 빠짐)
  const dp = (hits, cm, p) => ({ q: '해리포터 블루레이', url: 'u', n: 1, items: [{ id: '9', t: '해리포터 블루레이 8disc', p, st: 'sell', sim: 0.9, at: '2026-11-01', url: 'u9', post: { seller: '닉', hits, comments: cm, pubAt: '2026-11-01 10:00' } }], cats: { 블루레이: 3 }, buyN: 0, noPrice: 0, opened: 1, content: true });
  ok(sig067({ none: false, d: dp(120, 3, 30000) }) !== sig067({ none: false, d: dp(140, 4, 30000) }), 'DVDPrime · 0.6.7은 조회 수(hits)·댓글 수만 달라도 바뀜(원인 ②)');
  // 교보 — 리뷰 수 하나 늘고 판매지수 바뀜
  const kb = (rv, si) => ({ title: T, authors: 'J.K. 롤링', publisher: '문학수첩', pubDate: '2019-11-19', priceList: 12000, priceSales: 10800, rating: 9.62, ratingMax: 10, ratingN: 312, reviewN: rv, salesIndex: si, cover: 'c', desc: '소개', url: 'u', kv: { 판매지수: String(si) } });
  ok(sig067({ none: false, d: kb(512, 30120) }) !== sig067({ none: false, d: kb(513, 30155) }), '교보 · 0.6.7은 리뷰 수 +1·판매지수만 달라도 바뀜(원인 ②)');

  console.log('▶ ② 새 지문(요약) — 같은 내용 두 번 → 같음 · 실제로 바뀌면 바뀜');
  const S = (src, d, none) => X.sig({ none: !!none, d }, src);
  // 중고닷: 진짜 ADP.joongmo로 — 첫째 화면 / 둘째는 글 차례·'n분 전'·장터별·전체 글 수(남의 글 하나 더)만 다름
  const H1 = jmLink('bungaejangtu', '101', T + ' 1판', 6000, '3분 전') + jmLink('daangn', '202', T, 8000, '1시간 전') + jmLink('joonggonara', '303', '전혀 다른 요리책', 15000, '2일 전');
  const H2 = jmLink('daangn', '202', T, 8000, '2시간 전') + jmLink('joonggonara', '304', '또 다른 소설책', 9000, '1분 전') + jmLink('bungaejangtu', '101', T + ' 1판', 6000, '1시간 전') + jmLink('joonggonara', '303', '전혀 다른 요리책', 15000, '3일 전');
  const H3 = jmLink('bungaejangtu', '101', T + ' 1판', 5000, '3분 전') + jmLink('daangn', '202', T, 8000, '1시간 전');
  const jmRun = async (H) => X.run('joongmo', { title: T, author: 'J.K. 롤링', http: fakeHttp([[/joongmo\.com\/\?keyword/, H]]), cfg: X.cfgOf({}) });
  const j1 = await jmRun(H1), j2 = await jmRun(H2), j3 = await jmRun(H3);
  ok(j1.ok && j1.d.n >= 2, `중고닷 진짜 읽는 법: 닮은 글 ${j1.d && j1.d.n}개`);
  ok(S('joongmo', j1.d) === S('joongmo', j2.d), '중고닷 · 글 차례·n분 전·남의 글 늘어남만 다름 → 같음');
  ok(S('joongmo', j1.d) !== S('joongmo', j3.d), '중고닷 · 같은 책 글 최저가 6,000 → 5,000 → 바뀜');
  ok(S('joongmo', jm0a.d) === S('joongmo', { q: T, url: 'https://www.joongmo.com/api/search?keyword=x', n: 0, items: [], api: '/api/search', all: 37, byPlat: { daangn: 37 }, queryEcho: false }), '중고닷 0개 · 그려 읽기 길 ↔ API 길·전체 글 수 달라도 → 같음');
  // 번개장터·중고나라·당근(같은 usedOut 모양)
  const mk = (items) => ({ q: T, url: 'u', n: items.length, all: items.length + 5, th: 0.5, mv: 2, items });
  const it = (id, p, st, extra) => ({ id, t: T, p, st: st || 'sell', at: '2026-11-0' + (id.length % 9), loc: '서울', url: 'u' + id, sim: 0.9, kind: 'one', why: '', ...(extra || {}) });
  for (const src of ['bunjang', 'joongna', 'daangn']) {
    const a = mk([it('1', 7000), it('2', 9000, 'sold')]), b = mk([it('2', 9000, 'sold', { at: '어제', hit: 99 }), it('1', 7000, 'sell', { loc: '서울 강남', desc: '깨끗해요' })]), c = mk([it('1', 7000), it('2', 9000, 'sold'), it('3', 6500)]);
    ok(S(src, a) === S(src, b) && S(src, a) !== S(src, c), `${X.SOURCES[src].label} · 같은 내용(차례·날짜·지역·설명만 다름) → 같음 · 판매중 글 하나 더(최저가 6,500) → 바뀜`);
  }
  ok(S('yes24used', y24('11/06(목) 출고 예정', 120, 5000)) === S('yes24used', y24('11/07(금) 출고 예정', 121, 5000)), '예스24 중고 · 출고 예정일·판매자 평가 수만 다름 → 같음');
  ok(S('yes24used', y24('11/06(목) 출고 예정', 120, 5000)) !== S('yes24used', y24('11/06(목) 출고 예정', 120, 4500)), '예스24 중고 · 최저가 5,000 → 4,500 → 바뀜');
  ok(S('ebay', e1.d) === S('ebay', e2.d), 'eBay · 전체 수·판매자 평점·차례·추적 주소만 다름 → 같음');
  const e3 = await ebayRun(41, 99.1, [{ id: 'v1|1', p: 11, ship: 20 }, EI[1]]); ok(S('ebay', e1.d) !== S('ebay', e3.d), 'eBay · 최저가 12.5 → 11 USD → 바뀜');
  const ab = (p) => ({ n: 2, items: [{ t: T, p, cur: 'USD', ship: 5, shipCur: 'USD', cond: 'Very Good', g: '상', url: 'a1' }, { t: T, p: 40, cur: 'USD', ship: 5, shipCur: 'USD', cond: 'New', g: 'new', url: 'a2' }], to: 'KR?', note: '배송비는…' });
  ok(S('abebooks', ab(20)) === S('abebooks', clone(ab(20))) && S('abebooks', ab(20)) !== S('abebooks', ab(18)), 'AbeBooks · 같음 → 같음 · 최저가 20 → 18 → 바뀜');
  ok(S('dvdprime', dp(120, 3, 30000)) === S('dvdprime', dp(140, 4, 30000)) && S('dvdprime', dp(120, 3, 30000)) !== S('dvdprime', dp(120, 3, 25000)), 'DVDPrime · 조회 수·댓글 수만 다름 → 같음 · 값 30,000 → 25,000 → 바뀜');
  ok(S('kyobo', kb(512, 30120)) === S('kyobo', kb(513, 30155)), '교보 · 리뷰 수 512 → 513·판매지수만 → 같음(평점 수·리뷰 수는 20 넘으면 앞 두 자리)');
  ok(S('kyobo', kb(512, 30120)) !== S('kyobo', { ...kb(512, 30120), priceSales: 9720 }) && S('kyobo', kb(512, 30120)) !== S('kyobo', kb(560, 30120)), '교보 · 판매가 바뀜 → 바뀜 · 리뷰 수 512 → 560 → 바뀜');
  ok(S('nl', { title: 'A', pages: 100 }) === X.sig({ none: false, d: { title: 'A', pages: 100 } }) && S('nl', { title: 'A', pages: 100 }) !== S('nl', { title: 'A', pages: 101 }), '국중 등 다른 출처는 예전처럼 모든 칸(국중 같음 58 그대로)');
  ok(S('joongmo', null, true) === S('joongmo', null, true) && S('joongmo', null, true) !== S('joongmo', jm0a.d), '그 책 없음(none) · 같음/다름 구분');

  console.log('▶ ③ 옛 방식 지문 다시 만들기(sameSig)');
  ok(X.sameSig('joongmo', { sig: sig064({ none: false, d: jm0a.d }), d: jm0a.d, none: false }, S('joongmo', jm0b.d)) === 'resign', "중고닷 0개 · 7일 전 옛 방식 지문 + 같은 내용 → 'resign'(같음 · 지문만 새로)");
  ok(X.sameSig('yes24used', { sig: sig067({ none: false, d: y24('a', 1, 5000) }), d: y24('a', 1, 5000) }, S('yes24used', y24('b', 2, 5000))) === 'resign', "예스24 중고 · 0.6.7 지문 + 출고 예정일만 다름 → 'resign'");
  ok(X.sameSig('yes24used', { sig: 'x', d: y24('a', 1, 5000) }, S('yes24used', y24('a', 1, 4000))) === '', "예스24 중고 · 최저가가 실제로 바뀜 → ''(바뀜)");
  ok(X.sameSig('joongmo', null, 'x') === '' && X.sameSig('joongmo', { sig: 'y' }, 'x') === '', '받아 둔 값 없음·옛 값(d) 없음 → 바뀜/새로');

  console.log('▶ ④ 수집기 extSave(진짜 코드) + 가짜 Firestore');
  const a0 = csrc.indexOf('  const extBytes = '); const a1 = csrc.indexOf("return prev ? 'changed' : 'new'; }", a0); ok(a0 > 0 && a1 > a0, '수집기에서 extSave 덩어리를 찾음'); const CODE = csrc.slice(a0, a1 + "return prev ? 'changed' : 'new'; }".length);
  const DB = {}; const DEL = { __del: 1 }; const setPath = (o, p, v) => { const ks = p.split('.'); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]] = x[ks[i]] || {}; if (v === DEL) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = v; };
  const C = (col) => ({ doc: (id) => ({ get: async () => { const v = (DB[col] || {})[id]; return { exists: !!v, data: () => clone(v) }; }, set: async (v) => { DB[col] = DB[col] || {}; DB[col][id] = { ...(DB[col][id] || {}), ...clone(v) }; }, update: async (u) => { const v = DB[col][id]; for (const [k, val] of Object.entries(u)) setPath(v, k, val === DEL ? DEL : clone(val)); } }) });
  let tick = 0; const env = { C, nowIso: () => `2026-11-06T0${++tick % 10}:00:00.000Z`, PC_NAME: 'LOGGER', TS: () => 'ts', W: () => ({}), firebase: { firestore: { FieldValue: { delete: () => DEL } } }, EXT: () => X, log: () => {}, extKst: () => '2026-11-06' };
  const extSave = new Function(...Object.keys(env), CODE + '\nreturn extSave;')(...Object.values(env));
  const B = { isbn: '9788983920683', title: T };
  ok(await extSave('yes24used', B, { ok: true, d: y24('11/06', 120, 5000) }) === 'new', '처음 → 새로');
  ok(await extSave('yes24used', B, { ok: true, d: y24('11/07', 121, 5000) }) === 'same' && !DB.ext_hist, '출고 예정일·평가 수만 다름 → 같음 · 옛 값 보관 0');
  // 옛 방식 지문으로 적힌 문서(7일 전 0.6.4)를 흉내 → 같음 + 지문만 새 방식으로
  DB.ext_used[B.isbn].src.joongmo = { at: '2026-10-30T01:00:00.000Z', chk: '2026-10-30T01:00:00.000Z', sig: sig064({ none: false, d: jm0a.d }), none: false, d: clone(jm0a.d), by: 'LOGGER', q: T };
  ok(await extSave('joongmo', B, { ok: true, d: clone(jm0b.d) }) === 'same' && !DB.ext_hist, '중고닷 0개 · 옛 방식 지문 → 같음 · 옛 값 보관 0');
  ok(DB.ext_used[B.isbn].src.joongmo.sig === S('joongmo', jm0b.d) && DB.ext_used[B.isbn].src.joongmo.at === '2026-10-30T01:00:00.000Z', '지문만 새 방식으로 고쳐 적음(받은 때 at·옛 값 d는 그대로)');
  ok(await extSave('joongmo', B, { ok: true, d: { ...clone(jm0b.d), url: 'https://www.joongmo.com/api/x', rendered: undefined } }) === 'same', '고친 지문으로 다음 비교도 같음');
  ok(await extSave('yes24used', B, { ok: true, d: y24('11/07', 121, 4500) }) === 'changed' && Object.keys(DB.ext_hist || {}).length === 1, '최저가 5,000 → 4,500 → 바뀜 · 옛 값 보관 1건');
  ok(DB.ext_used[B.isbn].src.yes24used.d.items[0].p === 4500 && DB.ext_used[B.isbn].src.yes24used.d.items[0].deliDate === '11/07', '전체 글은 그대로 저장(결과 화면·시세 계산 d 그대로)');
  const hk = Object.keys(DB.ext_hist)[0]; ok(DB.ext_hist[hk].d.items[0].p === 5000, '옛 값(최저가 5,000 전체 글)은 ext_hist에 남음(지우지 않음)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
