// tEXTFIX — 정범님 11/08 '로거의 외부 정보(중고닷·예스24·eBay·DVDPrime·AbeBooks·국립중앙도서관 등)가 제대로 수집되지 않는 것 같다'
//   ① 거짓 '바뀜' — 같은 책·같은 매물인데 지문이 달라지던 것(같은 화면 두 번 → 같음 · 옛 지문 → 새 지문 첫 비교도 같음(resign) · 진짜 바뀌면 바뀜)
//      DVDPrime 닮지 않은 글 · 번개장터 제목 담김 0.5~0.6 글 · 첫 쪽 가장 비싼 값 · 예스24 중고 허브 화면을 읽었나/못 읽었나 · eBay 환율로 바꾼 값
//   ② 헛요청 — 중고닷·번개장터는 그려 읽기가 되면 글자 요청(늘 헛됨)을 하지 않음 · 네이버 막힘 안내는 바로 오래 쉼(limit)
//   ③ 수집기(진짜 코드 덩어리 + 가짜 Firestore): 기본 정보 '없음'이 받아 둔 값을 지우지 않음(keep) · 중고닷이 하루 최대면 중고나라가 기다리지 않고 직접
//      · 와이파이 도서 정보: 최근 '없음·다른 책'이라 한 출처는 다시 묻지 않음 · 네이버가 쉬면 '일부만'(part — 차례를 멈추지 않음)
// 실행: node src/tests/tEXTFIX.js (pw/ 사본은 ../readnow-collector.user.js · ../readnow-ext-core.js)
const fs = require('fs'); const path = require('path');
const core = (n) => [path.join(__dirname, '..', '..', n), path.join(__dirname, '..', n)].find((p) => fs.existsSync(p)); const X = require(core('readnow-ext-core.js'));
const SRC = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const csrc = fs.readFileSync(SRC, 'utf8');
let bad = 0; const ok = (c, t) => { console.log((c ? '  ✓ ' : '  ❌ ') + t); if (!c) bad++; }; const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const S = (src, d, none) => X.sig({ none: !!none, d }, src);
(async () => {
  console.log('▶ ① 거짓 바뀜 — 지문 요약');
  { // DVDPrime: '왕과 나' → 첫 낱말 '왕'으로 찾아 닮지 않은 글이 25개 · 그중 하나가 새로 올라옴
    const base = { q: '왕과', url: 'u', n: 3, items: [{ id: '1', t: '왕과 나 블루레이 판매', p: 15000, st: 'sell', sim: 0.9, hit: 30 }, { id: '2', t: '왕좌의 게임 시즌1', p: 40000, st: 'sell', sim: 0.2 }, { id: '3', t: '킹스맨 왕의 남자', p: null, st: 'sell', sim: 0.3 }] };
    const more = clone(base); more.items.push({ id: '4', t: '왕의 귀환 4K', p: 30000, st: 'sell', sim: 0.25 }); more.n = 4;
    ok(S('dvdprime', base) === S('dvdprime', more), 'DVDPrime · 닮지 않은 다른 글이 하나 올라와도 → 같음');
    const cheap = clone(base); cheap.items[0].p = 12000; ok(S('dvdprime', base) !== S('dvdprime', cheap), 'DVDPrime · 같은 상품 글 값 15,000 → 12,000 → 바뀜');
  }
  { // 번개장터: 제목 담김 0.55(세트·다른 권 아님)·삽니다 글·세트 글이 들고 남 · 같은 책 글은 그대로
    const it = (id, t, p, o) => ({ id, t, p, st: 'sell', sim: 0.9, kind: 'one', ...(o || {}) });
    const a = { q: '총 균 쇠', url: 'u', n: 3, all: 9, items: [it('1', '총균쇠 양장', 15000), it('2', '총균쇠 반양장 깨끗', 12000), it('3', '총 균 쇠 세트 일괄', 30000, { kind: 'set' })] };
    const b = clone(a); b.items.push(it('9', '총 쏘는 게임 삽니다', 5000, { sim: 0.55, kind: 'buy', st: 'buy' }), it('10', '균형 잡힌 쇠고기', 9000, { sim: 0.55 })); b.n = 5; b.all = 14;
    ok(S('bunjang', a) === S('bunjang', b), '번개장터 · 닮은 듯한 다른 글(0.55)·삽니다 글이 들고 나도 → 같음');
    const c = clone(a); c.items[1].st = 'sold'; ok(S('bunjang', a) !== S('bunjang', c), '번개장터 · 같은 책 글이 팔림 → 바뀜');
    const e = clone(a); e.items.push(it('11', '총균쇠 새책', 11000)); ok(S('bunjang', a) !== S('bunjang', e), '번개장터 · 같은 책 글이 더 싸게 하나 더 → 바뀜');
    const f = clone(a); f.items.push(it('12', '총균쇠 사인본', 90000)); ok(S('bunjang', a) !== S('bunjang', f), '번개장터 · 같은 책 글 수가 늘면(비싼 글이라도) → 바뀜(글 수는 봄)');
  }
  { // 첫 쪽 가장 비싼 값(max)만 다름
    const a = { items: [{ p: 7000, g: '상', st: 'sell', ship: 2500 }, { p: 9000, g: '상', st: 'sell', ship: 2500 }] }; const b = clone(a); b.items[1].p = 9500;
    ok(S('abebooks', a) === S('abebooks', b), '첫 쪽의 가장 비싼 값만 다름(최저·수 같음) → 같음');
  }
  { // 예스24 중고: 허브 화면(낱개 24개)을 읽었을 때와 못 읽었을 때(요약 한 줄) — 같은 검색 목록의 최저가·중고 수
    const sumD = { q: 'i', url: 'u', n: 1, items: [{ id: '100', t: '옥스퍼드 과학사', p: 25000, pMax: 72600, cnt: 18, st: 'sell', g: null, hub: true, sim: 1, kind: 'one' }], hub: true, min: 25000, cnt: 18, mv: 2 };
    const hubD = { q: 'i', url: 'hu', n: 3, items: [{ id: 'a', p: 25000, g: '상', st: 'sell', ship: 3300, sim: 1, kind: 'one' }, { id: 'b', p: 26000, g: '최상', st: 'sell', ship: 3500, sim: 1, kind: 'one' }, { id: 'c', p: 28100, g: '중', st: 'sell', ship: 6000, sim: 1, kind: 'one' }], hub: true, min: 25000, cnt: 18, mv: 3, hubSum: { id: '100', min: 25000, max: 72600, cnt: 18, tab: {}, mins: { 매장ON: { n: 0, min: 25000 } }, newList: 38000, newSale: 34200 } };
    ok(S('yes24used', sumD) === S('yes24used', hubD), '예스24 중고 · 허브 화면을 못 읽은 날(요약 한 줄) ↔ 읽은 날(낱개 24개) → 같음');
    const hub2 = clone(hubD); hub2.items[2].p = 27000; ok(S('yes24used', hubD) === S('yes24used', hub2), '예스24 중고 · 허브 낱개 중 최저가 아닌 값만 바뀜 → 같음(최저가·중고 수 그대로)');
    const hub3 = clone(hubD); hub3.min = 24000; hub3.hubSum.min = 24000; ok(S('yes24used', hubD) !== S('yes24used', hub3), '예스24 중고 · 최저가 25,000 → 24,000 → 바뀜');
    const hub4 = clone(hubD); hub4.cnt = 17; hub4.hubSum.cnt = 17; ok(S('yes24used', hubD) !== S('yes24used', hub4), '예스24 중고 · 중고 수 18 → 17(팔림) → 바뀜');
    ok(X.sameSig('yes24used', { sig: '옛방식:9', d: clone(hubD) }, S('yes24used', sumD)) === 'resign', '예스24 중고 · 옛 지문(허브 낱개로 만든 것) → 오늘 요약 한 줄과 첫 비교도 같음(resign)');
    const none0 = { q: 'i', url: 'u', n: 0, items: [], hub: true, all: 2 }; ok(S('yes24used', none0) === S('yes24used', clone(none0)), '예스24 중고 · 같은 책 묶음 0개 → 같음');
  }
  { // eBay: 파운드로 올린 매물 — 달러로 바꾼 값이 환율 따라 움직임
    const mk = (usd, gbp, shipUsd) => ({ items: [{ id: '1', t: 'Permaculture', p: usd, cur: 'USD', p0: gbp, cur0: 'GBP', ship: shipUsd, shipCur: 'USD', g: '상', st: 'sell' }, { id: '2', t: 'Permaculture', p: 40, cur: 'USD', ship: 20, shipCur: 'USD', g: '상', st: 'sell' }] });
    ok(S('ebay', mk(38.1, 30, 25)) === S('ebay', mk(38.9, 30, 25.6)), 'eBay · 파운드 매물 값은 그대로(30파운드)인데 달러 환산만 38.1 → 38.9 → 같음');
    ok(S('ebay', mk(38.1, 30, 25)) !== S('ebay', mk(35.6, 28, 25)), 'eBay · 파운드 값 30 → 28 → 바뀜');
    ok(X.sameSig('ebay', { sig: '옛:1', d: { items: [{ id: '2', t: 'P', p: 40, cur: 'USD', ship: 20, shipCur: 'USD', g: '상', st: 'sell' }] } }, S('ebay', { items: [{ id: '2', t: 'P', p: 40, cur: 'USD', ship: 20, shipCur: 'USD', g: '상', st: 'sell' }] })) === 'resign', 'eBay · 달러 매물만 있으면 옛 지문도 첫 비교 같음(resign)');
    // ADP.ebay가 원래 값을 남기는지 — 가짜 응답
    const http = async (o) => /oauth2/.test(o.url) ? { status: 200, text: JSON.stringify({ access_token: 't', expires_in: 7200 }) } : { status: 200, text: JSON.stringify({ total: 2, itemSummaries: [{ itemId: 'v1|1', title: 'Permaculture', price: { value: '38.10', currency: 'USD', convertedFromValue: '30.00', convertedFromCurrency: 'GBP' }, shippingOptions: [{ shippingCost: { value: '25.00', currency: 'USD', convertedFromValue: '19.70', convertedFromCurrency: 'GBP' } }], conditionId: '4000' }, { itemId: 'v1|2', title: 'Permaculture', price: { value: '40.00', currency: 'USD' }, shippingOptions: [{ shippingCost: { value: '20.00', currency: 'USD' } }], conditionId: '4000' }] }) };
    const r = await X.run('ebay', { isbn: '9780908228010', keys: { ebayAppId: 'a-PRD-1', ebayCertId: 'c' }, http, cache: {}, cfg: X.cfgOf({}) });
    ok(r.ok && r.d.items[0].p === 38.1 && r.d.items[0].p0 === 30 && r.d.items[0].cur0 === 'GBP' && r.d.items[0].ship0 === 19.7 && r.d.items[1].p0 === undefined, 'eBay 읽기 · 다른 나라 돈 매물은 원래 값(30 GBP · 배송 19.7 GBP)도 남김 · 달러 매물은 그대로');
    const fx = { rates: { USD: 1400, GBP: 1800 } }; const st = X.foreignStats(r.d.items, fx, null, '상'); ok(st.n === 2 && st.nUsed === 2, '값 계산(foreignStats)은 예전처럼 달러 값으로');
  }
  console.log('▶ ② 헛요청 줄이기');
  { const calls = []; const http = async (o) => { calls.push(o.url); return { status: 200, text: '<html>_next/static</html>' }; };
    const render = async (url, o) => ({ ok: true, links: [{ h: 'https://www.joongmo.com/detail/daangn/abc?productUrl=https%3A%2F%2Fwww.daangn.com%2Fkr%2Fbuy-sell%2Fabc&title=%EC%B4%9D%EA%B7%A0%EC%87%A0%20%EC%96%91%EC%9E%A5&price=15000&timeAgo=3%EB%B6%84%20%EC%A0%84' }] });
    const r = await X.run('joongmo', { isbn: '1', title: '총균쇠', author: '', http, render, cfg: X.cfgOf({}), keys: {} });
    ok(r.ok && r.d.items.length === 1 && r.d.rendered && calls.length === 0, '중고닷 · 그려 읽기가 되면 글자 요청(첫 화면·/search·API — 2026-11 모두 헛요청) 0번');
    const calls2 = []; const http2 = async (o) => { calls2.push(o.url); return { status: 404, text: '' }; }; let rn = 0; const render2 = async () => { rn++; return { ok: false, why: '시험 실패' }; };
    const r2 = await X.run('joongmo', { isbn: '1', title: '총균쇠', author: '', http: http2, render: render2, cfg: X.cfgOf({}), keys: {} });
    ok(!r2.ok && rn === 1 && calls2.length >= 1, '중고닷 · 그려 읽기가 안 되면 예전 차례(글자 요청)로 · 그려 읽기는 한 번만');
    const r3 = await X.run('joongmo', { isbn: '1', title: '총균쇠', author: '', http: http2, cfg: X.cfgOf({}), keys: {} }); ok(r3.skip, '중고닷 · 클라우드(그려 읽기 없음)는 예전처럼 건너뜀');
    const calls4 = []; const http4 = async (o) => { calls4.push(o.url); return { status: 404, text: '' }; }; const render4 = async () => ({ ok: true, links: [{ h: 'https://m.bunjang.co.kr/products/123', t: '총균쇠 양장\n15,000원' }] });
    const r4 = await X.run('bunjang', { isbn: '1', title: '총균쇠', author: '', http: http4, render: render4, cfg: X.cfgOf({}), keys: {} });
    ok(r4.ok && r4.d.items.length === 1 && calls4.length === 0, '번개장터 · 그려 읽기가 되면 옛 API(늘 404)를 묻지 않음');
    const rN = await X.run('naverbook', { isbn: '9788937460449', render: async () => ({ ok: true, links: [], html: '<p>비정상적인 접근이 감지되었습니다</p>' }), http: async () => ({ status: 200, text: '' }), cfg: X.cfgOf({}), keys: {} });
    ok(!rN.ok && rN.limit === true, '네이버 도서 · 막힘 안내 → limit(수집기가 5번 더 묻지 않고 바로 6시간 쉼)');
  }
  console.log('▶ ③ 수집기(진짜 코드) + 가짜 Firestore');
  const DB = {}; const DEL = { __del: 1 }; const setPath = (o, p, v) => { const ks = p.split('.'); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]] = x[ks[i]] || {}; if (v === DEL) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = v; };
  let reads = 0; const C = (col) => ({ doc: (id) => ({ get: async () => { reads++; const v = (DB[col] || {})[id]; return { exists: !!v, data: () => clone(v) }; }, set: async (v) => { DB[col] = DB[col] || {}; DB[col][id] = { ...(DB[col][id] || {}), ...clone(v) }; }, update: async (u) => { const v = DB[col][id]; for (const [k, val] of Object.entries(u)) setPath(v, k, val === DEL ? DEL : clone(val)); } }) });
  let tick = 0; const nowIso = () => `2026-11-08T0${++tick % 10}:00:00.000Z`;
  { const a0 = csrc.indexOf('  const extBytes = '); const a1 = csrc.indexOf("return prev ? 'changed' : 'new'; }", a0); ok(a0 > 0 && a1 > a0, '수집기에서 extSave 덩어리를 찾음'); const CODE = csrc.slice(a0, a1 + "return prev ? 'changed' : 'new'; }".length);
    const env = { C, nowIso, PC_NAME: 'LOGGER', TS: () => 'ts', W: () => ({}), firebase: { firestore: { FieldValue: { delete: () => DEL } } }, EXT: () => X, log: () => {}, extKst: () => '2026-11-08' };
    const extSave = new Function(...Object.keys(env), CODE + '\nreturn extSave;')(...Object.values(env));
    const B = { isbn: '9791191071481', title: '월든' }; const d = { title: '월든', pages: 448, cover: 'https://contents.kyobobook.co.kr/x.jpg?t=1', url: 'https://product.kyobobook.co.kr/detail/S1', id: 'S1' };
    ok(await extSave('kyobo', B, { ok: true, d }) === 'new', '교보 · 처음 → 새로');
    ok(await extSave('kyobo', B, { ok: true, none: true, why: '교보 검색에 이 ISBN 책이 없음(추천 상품만 나옴)' }) === 'keep' && DB.ext_basic[B.isbn].src.kyobo.d.pages === 448 && DB.ext_basic[B.isbn].src.kyobo.noneAt && !DB.ext_hist, '교보 · 받아 둔 값이 있는데 이제 검색 결과 없음 → 받아 둔 값 그대로(keep) · 옛 값 보관 0');
    ok(await extSave('kyobo', B, { ok: true, none: true }) === 'keep' && DB.ext_basic[B.isbn].src.kyobo.d.title === '월든' && !DB.ext_hist, '교보 · 두 번째 없음도 → 그대로(예전엔 여기서 바뀜 · 11/08 로거 교보 바뀜 53)');
    ok(await extSave('kyobo', B, { ok: true, d: { ...d, pages: 450 } }) === 'changed' && Object.keys(DB.ext_hist || {}).length === 1, '교보 · 쪽수가 실제로 바뀌면 → 바뀜(옛 값 보관)');
    const U = { isbn: '9788934951711', title: '총균쇠' }; const ud = { q: '총균쇠', url: 'u', n: 1, items: [{ id: '1', t: '총균쇠', p: 15000, st: 'sell', sim: 0.9, kind: 'one' }] };
    ok(await extSave('bunjang', U, { ok: true, d: ud }) === 'new' && await extSave('bunjang', U, { ok: true, none: true }) === 'none1', '번개장터(시세) · 없음은 예전처럼 한 번은 기다림(none1)');
  }
  { // extOne: 중고닷이 오늘 하루 최대면 중고나라가 기다리지 않고 직접
    const a0 = csrc.indexOf('  async function extOne(src, b, why) {'); const a1 = csrc.indexOf("return { src, st, why: res.why || null, n: res.d && (res.d.n ?? null), none: !!res.none, cover: (res.d && res.d.cover) || null }; }", a0); ok(a0 > 0 && a1 > a0, '수집기에서 extOne 덩어리를 찾음');
    const CODE = csrc.slice(a0, a1 + "return { src, st, why: res.why || null, n: res.d && (res.d.n ?? null), none: !!res.none, cover: (res.d && res.d.cover) || null }; }".length);
    let ran = []; const FX = { ...X, run: async (src, a) => { ran.push(src); if (src === 'naverbook') { await a.render('u', {}); await a.render('u2', {}); return { ok: true, d: { title: 't' } }; } return { ok: true, d: { q: 'q', n: 0, items: [] } }; } };
    const EXT_S = { errs: {}, pauseUntil: {}, used: {}, next: {}, cache: {} }; const usedAdd = []; const cfg = X.cfgOf({});
    const env = { EXT: () => FX, extKeys: async () => ({}), extCfg: async () => cfg, C, EXT_S, extIdxErrK: () => 0, extIdxSet: () => {}, sleep: async () => {}, extHttp: async () => ({ status: 200, text: '' }), extRender: async () => ({ ok: true, links: [] }), extSave: async () => 'same', extUsedAdd: (s, n) => usedAdd.push([s, n]), nowIso, PC_NAME: 'LOGGER', EXT_RUN: () => ({ set: async () => {} }), log: () => {}, window: {}, EXT_BACKOFF: [1, 3, 7, 14, 30], extKst: () => '2026-11-08', extRampDown: () => {}, firebase: { firestore: { FieldValue: { increment: (n) => n } } } };
    const extOne = new Function(...Object.keys(env), CODE + '\nreturn extOne;')(...Object.values(env));
    const B = { isbn: '9788954671873', title: '룬의 아이들' };
    reads = 0; let r = await extOne('joongna', B, 'auto'); ok(r.st === 'skip' && r.why === '중고닷 먼저' && !ran.length, '중고닷이 오늘 더 물을 수 있으면 → 예전처럼 중고닷 먼저(건너뜀)');
    EXT_S.used.joongmo = cfg.src.joongmo.cap; r = await extOne('joongna', B, 'auto'); ok(r.st === 'same' && ran.includes('joongna'), '중고닷이 오늘 하루 최대 → 중고나라가 기다리지 않고 직접 물음(11/08 02:13~16:10 건너뜀만 181번)');
    EXT_S.used.joongmo = 0; EXT_S.pauseUntil.joongmo = Date.now() + 3600e3; ran = []; r = await extOne('daangn', B, 'auto'); ok(r.st === 'same' && ran.includes('daangn'), '중고닷이 쉬는 중 → 당근도 직접');
    EXT_S.pauseUntil.joongmo = 0; EXT_S.errs.joongmo = 5; ran = []; let thrown = null; try { r = await extOne('bunjang', B, 'auto'); } catch (e) { thrown = e; } ok(!thrown && r.st === 'same', '중고닷 기록이 없고 중고닷 오류가 잦을 때 — 예전엔 jm.d에서 멈춤(TypeError) → 이제 직접 물음');
    EXT_S.errs.joongmo = 0; usedAdd.length = 0; ran = []; await extOne('naverbook', { isbn: '9788937460449', title: '데미안' }, 'auto'); ok(usedAdd.length === 1 && usedAdd[0][0] === 'naverbook' && usedAdd[0][1] === 1, '그리기만 한 출처(네이버 도서)도 하루 최대에 1번으로 셈 — 예전엔 0(하루 최대가 없는 셈)');
  }
  { // extBasicFor: 와이파이 도서 정보 — 최근 '없음·다른 책'은 다시 묻지 않음 · 네이버가 쉬면 '일부만'
    const a0 = csrc.indexOf('  async function extBasicFor(isbn, live, st) {'); const end = 'return { ...o, cover: cov, from: (M && M.from) || null, srcs: have, reviews }; }'; const a1 = csrc.indexOf(end, a0); ok(a0 > 0 && a1 > a0, '수집기에서 extBasicFor 덩어리를 찾음');
    const CODE = csrc.slice(a0, a1 + end.length); const asked = []; const answers = {}; const FX = { ...X, run: async (src) => { asked.push(src); return answers[src] || { ok: true, none: true }; } };
    const EXT_S = { errs: {}, pauseUntil: {}, used: {}, next: {}, cache: {}, idxAt: 0, idx: {} }; const cfg = X.cfgOf({}); const saved = [], idxs = [], logs = [];
    const env = { EXT: () => FX, C, extCfg: async () => cfg, EXT_S, extDue: () => true, extIdxSet: (s, i, v) => idxs.push([s, i, v || 'd']), extIdxErrK: () => 0, EXT_BACKOFF: [1, 3, 7, 14, 30], extKst: () => '2026-11-08', sleep: async () => {}, extUsedAdd: () => {}, extKeys: async () => ({}), extHttp: async () => ({}), extRender: async () => ({}), extSave: async (s, b, res) => { saved.push([s, res.none ? 'none' : res.mismatch ? 'mismatch' : 'd']); return 'new'; }, log: (m) => logs.push(m), extRampDown: () => {} };
    const extBasicFor = new Function(...Object.keys(env), CODE + '\nreturn extBasicFor;')(...Object.values(env));
    const I = '9788904080199';
    // 네이버가 쉬는 중 · 교보 없음 · 예스24 다른 책 → 일부만(part) — 예전엔 '답 없음'(차례 멈춤)
    EXT_S.pauseUntil.naverbook = Date.now() + 3600e3; answers.yes24 = { ok: false, mismatch: true, why: '다른 책' }; let st = { own: true }; await extBasicFor(I, true, st);
    ok(asked.join(',') === 'kyobo,yes24' && !st.allNone && st.part === true, '교보 없음 · 예스24 다른 책 · 네이버 쉼 → 일부만(part · 하루 뒤 다시 · 차례를 멈추지 않음)');
    ok(saved.some(([s, k]) => s === 'kyobo' && k === 'none') && saved.some(([s, k]) => s === 'yes24' && k === 'mismatch') && idxs.some(([s, , v]) => s === 'yes24' && /^E /.test(v)), '우리 상품이면 교보 없음·예스24 다른 책도 출처 기록·색인에 적음(자동 외부 정보와 같은 규칙)');
    // 같은 책을 다시: 저장된 문서가 교보 없음·예스24 다른 책이고 색인이 아직 새것 → 다시 묻지 않음
    DB.ext_basic = DB.ext_basic || {}; DB.ext_basic[I] = { isbn: I, src: { kyobo: { none: true, d: null, chk: '2026-11-08T00:00:00.000Z' }, yes24: { err: { at: '2026-11-08T00:00:00.000Z', why: '다른 책', mismatch: true } } } };
    asked.length = 0; EXT_S.idxAt = Date.now(); env.extDue; const extBasicFor2 = new Function(...Object.keys(env), CODE + '\nreturn extBasicFor;')(...Object.values({ ...env, extDue: (s) => s === 'naverbook' }));
    st = { own: true }; await extBasicFor2(I, true, st); ok(asked.length === 0 && st.part === true, '다시 볼 날 안 된 출처(교보 없음·예스24 다른 책)는 다시 묻지 않음 → 네이버가 쉬면 일부만 · 요청 0번');
    delete EXT_S.pauseUntil.naverbook; answers.naverbook = { ok: true, none: true }; st = { own: true }; await extBasicFor2(I, true, st); ok(asked.join(',') === 'naverbook' && st.allNone === true, '네이버가 쉬지 않으면 네이버만 물음 → 셋 다 없음(allNone · 120일 건너뜀)');
    answers.naverbook = { ok: false, why: '네이버가 그린 화면에서도 막음(비정상 접근 안내) — 잠시 쉼', limit: true }; asked.length = 0; st = { own: true }; await extBasicFor2(I, true, st);
    ok(EXT_S.pauseUntil.naverbook > Date.now() + 5 * 3600e3 && st.part === true && logs.some((m) => /6시간 쉼/.test(m)), '네이버 막힘 안내 → 바로 6시간 쉼(예전 1시간마다 5번씩 다시) · 이 책은 일부만');
    // 모두 오류(예: 연결 끊김) → 예전처럼 '답 없음'(part 아님)
    const J = '9788937460449'; delete DB.ext_basic[J]; EXT_S.pauseUntil = {}; for (const k of ['kyobo', 'yes24', 'naverbook']) answers[k] = { ok: false, why: '연결 실패' }; st = { own: true }; const extBasicFor3 = new Function(...Object.keys(env), CODE + '\nreturn extBasicFor;')(...Object.values(env)); await extBasicFor3(J, true, st);
    ok(!st.allNone && !st.part, '세 곳 모두 오류 → 예전처럼 답 없음(일부만 아님 — 10권이면 차례 멈춤)');
    // 알라딘 구매 풀(우리 상품 아님)은 출처 기록에 '없음'을 새로 적지 않음(ext_basic이 늘지 않게)
    saved.length = 0; for (const k of ['kyobo', 'yes24', 'naverbook']) answers[k] = { ok: true, none: true }; st = { own: false }; await extBasicFor3('9791160803143', true, st); ok(st.allNone && saved.length === 0, '알라딘 구매 풀 책(우리 상품 아님) · 셋 다 없음 → 없음 · 출처 기록은 새로 적지 않음');
  }
  { // extFill: 한 권도 안 물은 출처는 까닭을 한 줄로(3시간에 한 번) — 11/08 eBay·DVDPrime·국중·TTB·카카오·네이버 기록 0줄
    const a0 = csrc.indexOf('  async function extFill(cfg) {'); const end = '    return tally; }'; const a1 = csrc.indexOf(end, a0); ok(a0 > 0 && a1 > a0, '수집기에서 extFill 덩어리를 찾음');
    const CODE = csrc.slice(a0, a1 + end.length); const cfg = X.cfgOf({ src: { ridi: { on: false } } }); const logs = []; const asked = [];
    const EXT_S = { errs: {}, pauseUntil: { daangn: Date.now() + 2 * 3600e3 }, used: { joongna: cfg.src.joongna.cap }, next: {}, cache: {}, cur: {}, authPause: { lib: 'k' } };
    const keys = { kakaoRest: 'k', nlKey: 'k', ebayAppId: 'a', ebayCertId: 'c', d4lKey: 'k', aladinTtb: 'k' }; // 국중·카카오 키 있음 · 네이버 키 없음
    const books = [{ isbn: '9788937460449', title: '데미안', p: 9000 }];
    const env = { EXT: () => X, extKeys: async () => keys, extIdxLoad: async () => {}, extUsedLoad: async () => {}, extCands: async () => books, PUBONLY: true, EXT_S, nightExtMs: () => 0, PAR_STOP: {}, window: {}, auth: { currentUser: {} }, extLease: async () => true,
      extEligible: (s, b) => X.eligible(s, b, cfg), extDue: (s) => s === 'kakao' && !asked.includes('kakao'), extOne: async (s) => { asked.push(s); return { src: s, st: 'same' }; }, sleep: async () => {}, log: (m) => logs.push(m) };
    const extFill = new Function(...Object.keys(env), CODE + '\nreturn extFill;')(...Object.values(env));
    await extFill(cfg); const L = logs.find((m) => /이번 바퀴에 안 물은 출처/.test(m)) || '';
    ok(asked.join(',') === 'kakao' && !/카카오/.test(L), '할 책이 있는 출처(카카오)만 물음 · 그 출처는 까닭 줄에 없음');
    ok(/알라딘 TTB[^—]*— 서비스 끝/.test(L) && /네이버 책 검색[^—]*(서비스 종료|종료 확인 필요[^—]*)\) — 서비스 끝/.test(L) && /리디 — 설정에서 끔/.test(L) && /도서관 정보나루[^·]*— 키 문제로 쉼/.test(L), '까닭: TTB(2026-10-30)·네이버 API 서비스 끝 · 끈 출처 · 키 문제');
    ok(/당근 — 쉼\(앞으로 2시간 안\)/.test(L) && /중고나라 — 오늘 하루 최대\(300\) 다 씀/.test(L) && /eBay[^·]*— 다시 볼 책 없음/.test(L) && /DVDPrime 장터 — 다시 볼 책 없음/.test(L) && /국립중앙도서관[^·]*— 다시 볼 책 없음/.test(L), '까닭: 쉼 · 하루 최대 · 다시 볼 책 없음(eBay는 외국 책만 · DVDPrime은 영상·음반만)');
    logs.length = 0; await extFill(cfg); ok(!logs.some((m) => /안 물은 출처/.test(m)), '까닭 줄은 3시간에 한 번만(기록이 넘치지 않게)');
  }
  { // biTick·refreshOne 연결 — 소스 글로 확인
    ok(/e && e\.extPart\) \{ mark = \{ at: nowIso\(\), none: true, part: true/.test(csrc) && /BI\.tmpRun = 0; CS && CS\.add\('bi', 'part'/.test(csrc), '와이파이 도서 정보 · 일부만이면 표시(part)하고 다음 책으로(차례를 멈추지 않음)');
    ok(/x\.part \? BI_PART_DAYS : 120/.test(csrc) && /const BI_PART_DAYS = 1;/.test(csrc), '일부만 표시는 하루 뒤 다시(셋 다 없음은 예전처럼 120일)');
    ok(/EBS = \{ own: !l\.pool \}/.test(csrc) && /EBS\.part\) throw Object\.assign\(new Error\([^)]*\), \{ extPart: true \}\)/.test(csrc), 'refreshOne — 우리 상품 표시(own)·일부만(extPart)');
  }
  console.log(bad ? `❌ tEXTFIX ${bad}개 실패` : '✓ tEXTFIX 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
