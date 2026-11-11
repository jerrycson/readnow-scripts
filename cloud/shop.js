/* 🛍 우리숍 booksqueen.com — 손님 창구 (11/11 · 일꾼 shop1 · PLATFORM_PLAN 3-3 '손님 브라우저는 Firestore를 직접 읽지 않음')
 *  손님 화면(shop/ · Firebase Hosting 둘째 사이트)이 부르는 클라우드 주소 — 모두 로그인 없음 · 손님 정보는 shop_orders에만(관리 기기·클라우드만 읽음)
 *    GET  /shop/cfg              가게 설정 중 공개할 것(열림·배송비·입금 기한·사업자 표시·분야 목록·상품 수) — 계좌는 열렸을 때만
 *    GET  /shop/list?q&c&g&s&p   판매중 책 목록(24권씩) · q 낱말(제목·지은이·출판사·ISBN) · c 분야 · g 등급 · s new|low|high
 *    GET  /shop/shelf?k          (11/11 shelf1) 📚 서가 책장 — 판매중 책 전부 가볍게(4,000권씩 k번째 묶음 · gzip)
 *    GET  /shop/item?id          책 한 권(사진·정가·출판일·같은 책 다른 매물)
 *    POST /shop/order            주문 접수(무통장 입금) — 값은 서버가 다시 셈 · 한 권 상품은 접수 즉시 '주문 중'(shop_holds · 트랜잭션 — 같은 책 두 주문 0)
 *    GET  /shop/order?no&t       주문 확인(주문 번호 + 조회 열쇠 — 열쇠는 해시만 저장) · 이름은 가려서
 *    POST /shop/cancel {no,t}    손님 취소(입금 확인 전만) → '주문 중' 풂
 *  (11/11 shop2) 검색 노출 — Firebase Hosting(booksqueen.com)이 /b/**·/sitemap.xml을 이 클라우드로 넘김(hosting/shop.json rewrites)
 *    GET  /b/<상품 번호>          책 한 권 미리 만든 HTML(제목·지은이·등급·값·사진 · schema.org Book/Offer) — 팔리면 '품절'(SoldOut · noindex) · 모르는 번호는 404
 *    GET  /sitemap.xml           판매중 책 주소 목록(팔린 책·주문 중인 책은 빠짐) · robots.txt는 손님 화면 빌드(hosting/build-shop.js)가 Sitemap 줄과 함께
 *  (11/11 shop2) 다른 판매처에서 팔림 — 🤖 자동 내림(웹앱·클라우드)이 shop_holds에 { on:1, sold:1, until }를 적으면 알라딘 목록이 늦게 바뀌어도 우리숍은 곧바로 품절(목록에서 빠짐 · 주문 막음)
 *  공개 요약에 넣는 칸(이것뿐): 상품 번호·제목·지은이·출판사·출판일·분야·등급·판매가·정가·표지/실물 사진·ISBN·들어온 날
 *  넣지 않는 것: SKU(서가·매입처 칸이 들어 있음)·매입가·판매자 분류·시장 지표·손님 정보 · 미끼(DUPES)·19금·판매중 아님·값 없음은 목록에서 뺌
 *  읽기 비용: 처음(또는 FULL_H시간마다) 판매중 상품 전체 + 그 도서 정보 한 번 → 그 뒤 DELTA_MIN분마다 바뀐 상품(uploadedAt)만 · 도서 정보는 새 책만 */
'use strict';
const crypto = require('crypto'); const zlib = require('zlib');
const IMG_BASE = 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/';
const SHOP_ORIGINS = ['https://booksqueen.com', 'https://www.booksqueen.com', 'https://booksqueen.web.app', 'https://booksqueen.firebaseapp.com'];
const DEF = { open: 0, name: '북스퀸', shipFee: 3500, freeOver: 0, payDays: 2, maxItems: 20, fullH: 12, deltaMin: 10 };
/* 근거: 배송비 3,500원 = 알라딘 지정 택배 배송비와 같게(웹앱 숍 설정 안내 원문) · 입금 기한 2일·한 주문 20권·읽기 주기는 근거 없음 → app_settings/shop에서 바꿈 */
const PAGE = 24;
const BAD_SKU = /^\s*DUPES/i;

const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200);
const num = (v) => { const x = Math.round(+v); return Number.isFinite(x) && x > 0 ? x : 0; };
const imgOf = (im, thumb) => { if (!im) return null; if (typeof im === 'string') return /^https:\/\//.test(im) ? im : null; const p = thumb ? im.thumb || im.stored : im.stored || im.thumb; if (p) return IMG_BASE + encodeURIComponent(p) + '?alt=media'; return typeof im.src === 'string' && /^https:\/\//.test(im.src) ? im.src : null; };
const catOf = (b) => { const p = String((b && b.categories && b.categories[0] && (b.categories[0].path || b.categories[0].name)) || ''); const seg = p.split('>').map((x) => x.trim()).filter(Boolean); return s(seg[1] || seg[0] || '', 24) || null; };
const pd = (v) => { const d = String(v || '').replace(/[^\d]/g, ''); return d.length >= 6 ? d.slice(0, 4) + '-' + d.slice(4, 6) : null; };
const tsIso = (v) => { if (!v) return null; if (typeof v.toDate === 'function') return v.toDate().toISOString(); const t = Date.parse(v); return t ? new Date(t).toISOString() : null; };

/* 판매중인 우리 상품 한 줄 → 손님에게 보일 요약(아니면 null) */
function pubItem(id, l, b) {
  if (!l) return null; b = b || {};
  if (String(l.status || '') !== '판매중' || l.active === false || l.qty === 0) return null;
  if (BAD_SKU.test(String(l.sku || '')) || l.adult || b.adult) return null;
  const p = num(l.price); const t = s(l.title || b.title, 120); if (!p || !t) return null;
  const ph = (l.photos || []).filter((x) => x && x.stored).slice(0, 6).map((x) => imgOf(x, true)).filter(Boolean);
  const cover = imgOf(b.images && b.images.front, true) || imgOf(b.cover, true);
  const author = s(b.author || (b.contributors || []).slice(0, 2).map((c) => c && c.name).filter(Boolean).join(', ') || l.author, 60) || null;
  return { id: String(id), t, a: author, pb: s(b.publisher || l.publisher, 40) || null, pd: pd(b.pubDate), c: catOf(b), g: s(l.grade, 4) || null, p, lp: num(b.priceList || l.priceList) || null,
    im: cover || ph[0] || null, ph, sp: imgOf(b.images && b.images.spine, false) || null, bk: imgOf(b.images && b.images.back, true) || null, pg: num(b.pages) || null, isbn: /^97[89]\d{10}$/.test(String(l.isbn13 || b.isbn13 || '')) ? String(l.isbn13 || b.isbn13) : null, q: Math.max(1, +l.qty || 1), at: tsIso(l.registeredAt) || tsIso(l.firstSeenAt) || null };
}
/* ══ (11/11 shelf1) 📚 서가 책장 — 판매중 책 전부를 가볍게(칸 이름 cols · 줄마다 배열 · 그림 주소 앞부분은 pre 번호로 줄임) · 4,000권씩 나눠 받음
 *  판매지수(sp)는 숫자를 내보내지 않고 순위(sr · 1이 가장 많이 팔림)만 — 공개 요약 칸 밖의 시장 지표를 새지 않게 · 주문 중 'o' · 다른 판매처에서 팔린 책은 뺌 */
const SHELF_COLS = ['id', 't', 'a', 'c', 'p', 'lp', 'g', 'at', 'im', 'sp', 'bk', 'st', 'sr', 'pg', 'pb'];
const SHELF_PRE = [IMG_BASE, 'https://image.aladin.co.kr/product/'];
const SHELF_PART = 4000; /* 근거: 한 묶음 ≈ 4,000권 × 250바이트 ≈ 1MB(gzip ≈ 200KB) — 휴대폰 첫 화면이 1~2초 안에 그려지게 */
const preOf = (u) => { if (!u) return null; for (let i = 0; i < SHELF_PRE.length; i++) if (u.startsWith(SHELF_PRE[i])) return '~' + i + u.slice(SHELF_PRE[i].length); return u; };
function shelfRows(all, held, sold, sp) { const H = held || new Set(); const X = sold || new Set(); const SP = sp || new Map();
  const L = (all || []).filter((x) => x && !X.has(x.id)).slice().sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.id).localeCompare(String(b.id))); /* 등록순(오래된 것 먼저) */
  const R = L.map((x) => [x.id, SP.has(x.id) ? +SP.get(x.id) || 0 : -1]).filter((r) => r[1] >= 0).sort((a, b) => b[1] - a[1]); const rank = new Map(R.map((r, i) => [r[0], i + 1]));
  return L.map((x) => [x.id, x.t, x.a || null, x.c || null, x.p, x.lp || null, x.g || null, x.at ? String(x.at).slice(0, 10) : null, preOf(x.im), preOf(x.sp), preOf(x.bk), H.has(x.id) ? 'o' : 's', rank.get(x.id) || null, x.pg || null, x.pb || null]); }
const shelfParts = (rows) => { const P = []; for (let i = 0; i < rows.length; i += SHELF_PART) P.push({ rows: rows.slice(i, i + SHELF_PART) }); if (!P.length) P.push({ rows: [] }); return P; };
/* shop_holds 한 장이 지금 살아 있나 — until(다른 판매처 팔림 표시 · 하루)이 지나면 풂 */
const holdOn = (h, now) => !!(h && h.on && !(h.until && Date.parse(h.until) < (now || Date.now())));
const norm = (x) => String(x || '').toLowerCase().replace(/[\s\-_.,·:;!?'"()[\]{}<>/\\]+/g, '');
/* 목록 거르기·정렬·쪽 — 순수 셈(시험 tSHOP1111) */
/* (11/11 shop4) 🆕 들어온 날(한국 날짜) — 손님 화면 '오늘·어제·N일 전' 표 · 첫 화면 '오늘 N권 새로' 셈 */
const kstDay = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? new Date(t + 9 * 3600e3).toISOString().slice(0, 10) : null; };
function listItems(all, o, held, sold, now) {
  o = o || {}; const X = sold || new Set(); if (X.size) all = all.filter((x) => !X.has(x.id)); const q = String(o.q || '').trim(); const toks = q.split(/\s+/).map(norm).filter(Boolean); const dig = q.replace(/\D/g, '');
  let L = all.filter((x) => (!o.c || x.c === o.c) && (!o.g || x.g === o.g));
  if (toks.length) L = L.filter((x) => { if (dig.length >= 10 && x.isbn && x.isbn.includes(dig)) return true; const h = norm(x.t + ' ' + (x.a || '') + ' ' + (x.pb || '')); return toks.every((k) => h.includes(k)); });
  const srt = o.s === 'low' ? (a, b) => a.p - b.p : o.s === 'high' ? (a, b) => b.p - a.p : (a, b) => String(b.at || '').localeCompare(String(a.at || ''));
  L = L.slice().sort(srt); const p = Math.max(0, Math.min(500, parseInt(o.p, 10) || 0)); const H = held || new Set();
  const t0 = now || Date.now(); const today = kstDay(new Date(t0).toISOString()); const wk0 = kstDay(new Date(t0 - 6 * 864e5).toISOString()); let nT = 0, nW = 0;
  for (const x of L) { const d = kstDay(x.at); if (!d) continue; if (d === today) nT++; if (d >= wk0) nW++; }
  return { total: L.length, p, more: (p + 1) * PAGE < L.length, today: nT, wk: nW, day: today, items: L.slice(p * PAGE, (p + 1) * PAGE).map((x) => ({ id: x.id, t: x.t, a: x.a, g: x.g, p: x.p, lp: x.lp, im: x.im, d: kstDay(x.at), st: H.has(x.id) ? 'o' : 's' })) };
}
/* 손님 주문 입력 검사 — 순수 셈 · 돌려줌 { ok, err, v } */
const PHONE = /^01[016789]\d{7,8}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,80}\.[a-z]{2,}$/i;
function checkOrder(b, cfg) {
  cfg = cfg || DEF; b = b && typeof b === 'object' ? b : {}; const err = (m) => ({ ok: false, err: m });
  if (b.hp) return err('잘못된 요청'); /* 사람에게 안 보이는 칸(로봇 막기) */
  const ids = [...new Set((Array.isArray(b.items) ? b.items : []).map((x) => s(x, 80)).filter(Boolean))];
  if (!ids.length) return err('담은 책이 없습니다'); if (ids.length > (cfg.maxItems || DEF.maxItems)) return err(`한 번에 ${cfg.maxItems || DEF.maxItems}권까지 주문할 수 있습니다`);
  const name = s(b.buyer && b.buyer.name, 30), ph = String((b.buyer && b.buyer.phone) || '').replace(/\D/g, '');
  if (name.length < 2) return err('주문하시는 분 이름을 적어 주세요'); if (!PHONE.test(ph)) return err('휴대폰 번호를 다시 확인해 주세요(010으로 시작하는 숫자)');
  const r = b.rcv || {}; const rn = s(r.name, 30) || name, rp = String(r.phone || '').replace(/\D/g, '') || ph, zip = String(r.zip || '').replace(/\D/g, ''), a1 = s(r.addr1, 120), a2 = s(r.addr2, 80);
  if (rn.length < 2) return err('받는 분 이름을 적어 주세요'); if (!PHONE.test(rp)) return err('받는 분 휴대폰 번호를 다시 확인해 주세요');
  if (!/^\d{5}$/.test(zip)) return err('우편번호 5자리를 적어 주세요'); if (a1.length < 5) return err('주소를 적어 주세요');
  if (!(b.agree && b.agree.privacy && b.agree.terms)) return err('개인정보 수집·이용과 구매 조건에 동의해 주세요');
  const dep = s(b.depositor, 20) || name; const em = s(b.buyer && b.buyer.email, 80).toLowerCase(); if (em && !EMAIL.test(em)) return err('메일 주소를 다시 확인해 주세요(비워 두어도 됩니다)');
  return { ok: true, v: { ids, buyer: { name, phone: ph, ...(em ? { email: em } : {}) }, rcv: { name: rn, phone: rp, zip, addr1: a1, addr2: a2, memo: s(r.memo, 100) || null }, depositor: dep } };
}
const shipFeeOf = (sum, cfg) => { const f = num((cfg || DEF).shipFee); const fo = num((cfg || DEF).freeOver); return fo && sum >= fo ? 0 : f; };
const maskName = (n) => { const a = [...String(n || '')]; return a.length <= 1 ? '*' : a[0] + '*'.repeat(Math.max(1, a.length - 2)) + (a.length > 2 ? a[a.length - 1] : ''); };
const B32 = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const orderNo = (now, rnd) => { const d = new Date(now + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); const r = rnd || crypto.randomBytes(5); let x = ''; for (let i = 0; i < 5; i++) x += B32[r[i] % B32.length]; return 'BQ' + d + '-' + x; };
const hashTok = (t) => crypto.createHash('sha256').update('bq|' + String(t || '')).digest('hex');
/* 공개해도 되는 가게 설정만 */
/* (11/11 shelf1) 📚 서가 책장 설정(app_settings/shop.shelf) — 관리 웹앱이 shop/shelf-core.js 틀로 저장 · 여기선 꼴만 지킴(칸 이름 영문·숫자 · 값은 수·참거짓·짧은 글·글 목록) · 범위는 손님 화면 BQS.cfgOf가 다시 지킴 */
function shelfPub(v) { if (!v || typeof v !== 'object' || Array.isArray(v)) return {}; const o = {}; let n = 0;
  for (const [k, x] of Object.entries(v)) { if (!/^[A-Za-z][A-Za-z0-9]{0,23}$/.test(k) || ++n > 60) continue;
    if (typeof x === 'number' && Number.isFinite(x)) o[k] = x; else if (typeof x === 'boolean') o[k] = x; else if (typeof x === 'string') o[k] = s(x, k === 'picks' ? 8000 : 200).replace(/[<>]/g, '');
    else if (Array.isArray(x)) o[k] = x.filter((y) => typeof y === 'string' || typeof y === 'number').slice(0, 60).map((y) => s(y, 30)); }
  return o; }
function pubCfg(c, meta) {
  c = { ...DEF, ...(c || {}) }; const bz = c.biz || {}; const bank = c.bank || {}; const bankOk = !!(bank.name && bank.acct && bank.holder);
  return { open: c.open ? 1 : 0, name: s(c.name, 20) || DEF.name, shipFee: num(c.shipFee), freeOver: num(c.freeOver), payDays: Math.max(1, Math.min(7, +c.payDays || DEF.payDays)), maxItems: Math.max(1, Math.min(50, +c.maxItems || DEF.maxItems)),
    pay: c.open && bankOk ? { how: 'bank', bank: s(bank.name, 20), acct: s(bank.acct, 30), holder: s(bank.holder, 20) } : { how: 'wait' }, pg: 0 /* 카드·간편결제(PG)는 계약 뒤 — 자리만 */,
    biz: { name: s(bz.name, 40) || null, ceo: s(bz.ceo, 20) || null, addr: s(bz.addr, 120) || null, tel: s(bz.tel, 20) || null, email: s(bz.email, 60) || null, no: s(bz.no, 20) || null, mo: s(bz.mo, 40) || null, cpo: s(bz.cpo, 20) || null, host: 'Google Firebase(구글)' },
    notice: s(c.notice, 300) || null, shelf: shelfPub(c.shelf), n: meta ? meta.n : null, cats: meta ? meta.cats : [], at: meta ? meta.at : null };
}

/* ══ (11/11 shop2) 🔎 검색 노출 — 책마다 미리 만든 HTML · sitemap.xml (순수 셈 · 시험 tSHOP1111)
 *  근거(약속 42): 알라딘 중고·예스24 중고·아마존·Shopify 상품 쪽은 모두 '자바스크립트 없이도 읽히는 상품 주소 하나 + schema.org Product/Offer'로 구글·네이버 검색에 뜸
 *   · 지금 손님 화면은 #/b/… (해시 주소)라 검색 로봇이 첫 화면 하나만 봄 → /b/<상품 번호> 진짜 주소를 클라우드가 만들어 줌(목록과 같은 공개 요약만)
 *   · 팔린 한 권짜리 헌책은 Google 안내대로 SoldOut + noindex(검색에서 빠짐 · 같은 책 다른 매물로 안내) · sitemap에선 바로 빠짐
 *  넣는 것 = pubItem 공개 요약(제목·지은이·출판사·출판일·분야·등급·값·정가·사진·ISBN) + 가게 이름·사업자 표시(전자상거래법) — SKU·매입가·손님 정보 0 */
const BASE = 'https://booksqueen.com';
const SITEMAP_MAX = 45000; /* 근거: sitemaps.org 한 파일 50,000 주소 한도 — 여유 두고 45,000마다 나눔 */
const GONE_MAX = 20000; /* 근거: 없음 — 품절 화면용 기억 수(공개 요약 한 권 ~0.5KB → 10MB 안) */
const GR_TXT = { 최상: '새 책에 가까움 — 사용 흔적이 거의 없음', 상: '조금 읽은 흔적 — 깨끗함', 중: '읽은 흔적이 보임 — 읽는 데 지장 없음', 하: '흔적이 많음 — 값이 쌈' }; /* shop/shop-core.js GRADE와 같은 말 */
const hx = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wonK = (n) => (Math.round(+n || 0)).toLocaleString('ko-KR') + '원';
/* st: 's' 판매중 · 'o' 주문 중(입금 기다림) · 'x' 품절(팔림·내림) */
function bookLd(it, st, base) { base = base || BASE; const url = base + '/b/' + encodeURIComponent(it.id);
  const av = st === 'x' ? 'https://schema.org/SoldOut' : st === 'o' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock';
  const ld = { '@context': 'https://schema.org', '@type': 'Book', name: it.t, url, ...(it.a ? { author: { '@type': 'Person', name: it.a } } : {}), ...(it.pb ? { publisher: { '@type': 'Organization', name: it.pb } } : {}), ...(it.pd ? { datePublished: it.pd } : {}), ...(it.isbn ? { isbn: it.isbn } : {}), ...(it.c ? { genre: it.c } : {}),
    ...(it.im || (it.ph && it.ph.length) ? { image: [it.im, ...(it.ph || [])].filter(Boolean).slice(0, 4) } : {}),
    offers: { '@type': 'Offer', price: it.p, priceCurrency: 'KRW', availability: av, itemCondition: 'https://schema.org/UsedCondition', url, seller: { '@type': 'Organization', name: '북스퀸' }, ...(it.g ? { description: `중고 등급 ${it.g}` } : {}) } };
  return JSON.stringify(ld).replace(/</g, '\\u003c'); }
function bookPage(it, o) { o = o || {}; const st = o.st || 's'; const base = o.base || BASE; const c = o.cfg || {}; const bz = c.biz || {}; const nm = s(c.name, 20) || '북스퀸'; const url = base + '/b/' + encodeURIComponent(it.id);
  const title = `${it.t}${it.a ? ' — ' + it.a : ''} · 중고 ${it.g || ''} ${wonK(it.p)}${st === 'x' ? ' (품절)' : ''} | ${nm}`; const off = it.lp > 0 && it.p < it.lp ? Math.round((1 - it.p / it.lp) * 100) : 0;
  const desc = `${it.t}${it.a ? ' · ' + it.a : ''}${it.pb ? ' · ' + it.pb : ''} 중고 헌책 — 등급 ${it.g || '확인'}(${GR_TXT[it.g] || '사진으로 확인'}) · ${wonK(it.p)}${off ? `(정가보다 ${off}% 쌈)` : ''} · 실물 사진 그대로 보내 드리는 ${nm} 헌책방`.slice(0, 160);
  const stTxt = st === 'x' ? '품절 — 이 책은 팔렸습니다' : st === 'o' ? '주문 중 — 다른 분이 주문해 입금을 기다리는 책(기한 안에 입금이 없으면 다시 판매)' : '판매중 · 한 권뿐인 실물';
  const pics = [it.im, ...(it.ph || [])].filter(Boolean).slice(0, 6); const same = (o.same || []).filter((x) => x && x.id !== it.id).slice(0, 6);
  const biz = [bz.name && '상호 ' + bz.name, bz.ceo && '대표 ' + bz.ceo, bz.no && '사업자등록번호 ' + bz.no, bz.mo && '통신판매업 ' + bz.mo, bz.addr, bz.tel && '전화 ' + bz.tel].filter(Boolean).map(hx).join(' · ');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${hx(title)}</title>
<meta name="description" content="${hx(desc)}"><link rel="canonical" href="${hx(url)}">${st === 'x' ? '<meta name="robots" content="noindex, follow">' : ''}
<meta property="og:type" content="product"><meta property="og:title" content="${hx(title)}"><meta property="og:description" content="${hx(desc)}"><meta property="og:url" content="${hx(url)}">${pics[0] ? `<meta property="og:image" content="${hx(pics[0])}">` : ''}
<meta property="product:price:amount" content="${it.p}"><meta property="product:price:currency" content="KRW"><meta property="product:condition" content="used"><meta property="product:availability" content="${st === 'x' ? 'out of stock' : 'in stock'}">
<link rel="stylesheet" href="/shop.css?v=0.1.0"><script type="application/ld+json">${bookLd(it, st, base)}</script></head>
<body><header class="top"><a class="logo" href="/#/"><span class="crown">♛</span>${hx(nm)}<small>헌책방</small></a><nav class="nav"><a href="/#/list?s=new">책 찾기</a><a href="/#/cart">🛒</a></nav></header>
<main class="wrap bp"><nav class="hint"><a href="/#/">첫 화면</a>${it.c ? ` › <a href="/#/list?c=${encodeURIComponent(it.c)}">${hx(it.c)}</a>` : ''}</nav>
<article class="bk${st === 'x' ? ' sold' : ''}"><div class="bp-ph">${pics.length ? pics.map((u, i) => `<img src="${hx(u)}" alt="${hx(it.t)} ${i ? '실물 사진 ' + i : '표지'}" loading="${i ? 'lazy' : 'eager'}" width="320">`).join('') : '<div class="noimg">사진 준비 중</div>'}</div>
<div class="bp-tx"><h1>${hx(it.t)}</h1><p>${[it.a, it.pb, it.pd].filter(Boolean).map(hx).join(' · ')}</p>
<p class="gr"><b>등급 ${hx(it.g || '-')}</b> — ${hx(GR_TXT[it.g] || '사진으로 상태를 확인해 주세요')}</p>
<p class="pr"><b>${wonK(it.p)}</b>${it.lp ? ` <s>정가 ${wonK(it.lp)}</s>${off ? ` <em>${off}%↓</em>` : ''}` : ''}</p>
<p class="stt st-${st}"><b>${hx(stTxt)}</b></p>${it.isbn ? `<p class="hint">ISBN ${hx(it.isbn)}</p>` : ''}
${st === 's' ? `<p><a class="btn wide" href="/#/b/${encodeURIComponent(it.id)}">장바구니에 담기 · 주문하기</a></p>` : `<p><a class="btn ghost" href="/#/list?q=${encodeURIComponent(it.isbn || it.t)}">같은 책 다른 매물 찾기</a></p>`}
${same.length ? `<h2>같은 책 다른 매물</h2><ul>${same.map((x) => `<li><a href="/b/${encodeURIComponent(x.id)}">등급 ${hx(x.g || '-')} · ${wonK(x.p)}</a></li>`).join('')}</ul>` : ''}
<p class="hint">모든 책은 한 권뿐인 중고 실물 — 사진과 설명에 없는 큰 흠이 있으면 교환·환불해 드립니다. <a href="/#/p/terms">구매 조건</a></p></div></article></main>
<footer class="foot wrap"><div class="hint">${biz || hx(nm)} · <a href="/#/p/privacy">개인정보 처리방침</a></div></footer></body></html>`; }
/* sitemap — n 없으면: 45,000 이하면 주소 목록 하나, 넘으면 목차(sitemap-1.xml…) · n = 그 쪽 */
function sitemapXml(items, o) { o = o || {}; const base = o.base || BASE; const L = (items || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id))); const day = (v) => String(v || '').slice(0, 10);
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n';
  if (!o.n && L.length > SITEMAP_MAX) { const k = Math.ceil(L.length / SITEMAP_MAX); return head + `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({ length: k }, (_, i) => `<sitemap><loc>${base}/sitemap-${i + 1}.xml</loc></sitemap>`).join('')}</sitemapindex>`; }
  const n = Math.max(1, +o.n || 1); const part = L.slice((n - 1) * SITEMAP_MAX, n * SITEMAP_MAX); if (o.n && !part.length) return null;
  const urls = (n === 1 ? [`<url><loc>${base}/</loc><changefreq>daily</changefreq></url>`] : []).concat(part.map((x) => `<url><loc>${base}/b/${hx(encodeURIComponent(x.id))}</loc>${/^\d{4}-\d\d-\d\d/.test(day(x.at)) ? `<lastmod>${day(x.at)}</lastmod>` : ''}</url>`));
  return head + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`; }

function makeShop({ db, C, FV, log }) {
  const CAT = { items: new Map(), books: new Map(), gone: new Map(), sp: new Map(), full: 0, delta: 0, busy: null, err: null }; const SHELF = { key: '', parts: [] }; /* (11/11 shelf1) sp = 상품 → 알라딘 판매지수(밖으로는 순위만) · SHELF = 서가 책장 묶음 기억 */
  let CFG = { v: null, at: 0 }; let HELD = { v: new Set(), x: new Set(), at: 0 }; const RL = new Map();
  const cfg = async () => { if (CFG.v && Date.now() - CFG.at < 60e3) return CFG.v; try { const d = await C('app_settings').doc('shop').get(); CFG = { v: { ...DEF, ...(d.exists ? d.data() : {}) }, at: Date.now() }; } catch (e) { CFG = { v: CFG.v || { ...DEF }, at: Date.now() - 50e3 }; } return CFG.v; };
  const held = async (force) => { if (!force && Date.now() - HELD.at < 20e3) return HELD.v; try { const ss = await C('shop_holds').where('on', '==', 1).get(); const v = new Set(); const x = new Set(); const now = Date.now(); ss.forEach((d) => { const h = d.data() || {}; if (!holdOn(h, now)) return; (h.sold ? x : v).add(d.id); }); HELD = { v, x, at: now }; } catch (e) { HELD.at = Date.now() - 10e3; } return HELD.v; };
  const soldX = async () => { await held(); return HELD.x || new Set(); }; /* (11/11 shop2) 다른 판매처에서 팔림(🤖 자동 내림이 적음) */
  async function booksFor(ids) { const need = [...new Set(ids.filter((x) => x && !CAT.books.has(x)))]; for (let i = 0; i < need.length; i += 200) { const ss = await db.getAll(...need.slice(i, i + 200).map((x) => C('prd_books').doc(String(x)))); const part = need.slice(i, i + 200); let ms = []; try { ms = await db.getAll(...part.map((x) => C('prd_book_metrics').doc(String(x)))); } catch (e) {} const SPM = new Map(); ms.forEach((d) => { if (d.exists) { const v = (d.data() || {}).salesPoint; if (v != null && !isNaN(+v)) SPM.set(d.id, +v); } });
      ss.forEach((d) => CAT.books.set(d.id, d.exists ? slimB({ ...d.data(), ...(SPM.has(d.id) ? { _sp: SPM.get(d.id) } : {}) }) : null)); } }
  const slimB = (b) => ({ title: b.title, author: b.author, contributors: (b.contributors || []).slice(0, 2).map((c) => ({ name: c && c.name })), publisher: b.publisher, pubDate: b.pubDate, categories: (b.categories || []).slice(0, 1), images: b.images && (b.images.front || b.images.spine || b.images.back) ? { front: b.images.front || null, spine: b.images.spine || null, back: b.images.back || null } : null, cover: b.cover, priceList: b.priceList, isbn13: b.isbn13, adult: b.adult, pages: b.pages || null, sp: b._sp != null ? b._sp : (b.salesPoint != null ? +b.salesPoint || 0 : null) }); /* (11/11 shelf1) 📚 서가 책장 — 책등·뒤표지 그림·쪽수(책 두께)·판매지수(순서만 공개) */
  const put = (id, l) => { const bk0 = l && l.bookId ? CAT.books.get(String(l.bookId)) : null; const it = pubItem(id, l, bk0); const k = String(id); if (it) { CAT.items.set(k, it); if (bk0 && bk0.sp != null) CAT.sp.set(k, bk0.sp); else CAT.sp.delete(k); CAT.gone.delete(k); } else { const was = CAT.items.get(k); if (was) goneAdd(k, was); CAT.items.delete(k); } };
  /* (11/11 shop2) 팔렸거나 내린 책 — '품절' 화면용 요약(공개 요약 그대로 · 30일 · 최대 GONE_MAX) */
  const goneAdd = (k, it) => { CAT.gone.set(k, { ...it, goneAt: new Date().toISOString() }); if (CAT.gone.size > GONE_MAX) { const old = CAT.gone.keys().next().value; CAT.gone.delete(old); } };
  async function build() { if (CAT.busy) return CAT.busy; CAT.busy = (async () => { try { const c = await cfg(); const now = Date.now(); const full = !CAT.full || now - CAT.full > (c.fullH || DEF.fullH) * 3600e3;
      if (!full && now - CAT.delta < (c.deltaMin || DEF.deltaMin) * 60e3) return;
      const F = ['status', 'active', 'qty', 'price', 'grade', 'sku', 'adult', 'title', 'isbn13', 'bookId', 'photos', 'registeredAt', 'firstSeenAt', 'priceList', 'author', 'publisher'];
      let ss; const since = new Date((full ? now : CAT.delta) - 5 * 60e3); /* 5분 겹쳐 읽음(쓰기 시각 어긋남) */
      if (full) ss = await C('prd_listings').where('status', '==', '판매중').select(...F).get(); else ss = await C('prd_listings').where('uploadedAt', '>', since).select(...F).get();
      const docs = []; ss.forEach((d) => docs.push([d.id, d.data() || {}])); await booksFor(docs.map(([, l]) => l.bookId && String(l.bookId)).filter(Boolean));
      if (full) { const seen = new Set(docs.map(([id]) => String(id))); for (const [k, it] of CAT.items) if (!seen.has(k)) goneAdd(k, it); CAT.items.clear(); } for (const [id, l] of docs) put(id, l); if (full) CAT.full = now; CAT.delta = now; CAT.err = null;
      const cats = {}; for (const x of CAT.items.values()) if (x.c) cats[x.c] = (cats[x.c] || 0) + 1;
      CAT.meta = { n: CAT.items.size, at: new Date(now).toISOString(), cats: Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 30) };
      C('app_settings').doc('shop_pub').set({ n: CAT.items.size, at: CAT.meta.at, full: new Date(CAT.full).toISOString(), read: docs.length, cats: CAT.meta.cats.slice(0, 12).map(([k, n]) => k + ' ' + n) }, { merge: true }).catch(() => {});
      log && log(`🛍 우리숍 목록 ${full ? '전체' : '바뀐 것'} ${docs.length}줄 읽음 → 판매 ${CAT.items.size}권`); } catch (e) { CAT.err = e.message; log && log('🛍 우리숍 목록 실패', e.message); } finally { CAT.busy = null; } })(); return CAT.busy; }
  const ready = async () => { const p = build(); if (!CAT.full) await p; }; /* 처음만 기다림 · 그 뒤엔 뒤에서 새로 고침 */
  const ipKey = (req) => crypto.createHash('sha256').update('bq-ip|' + String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()).digest('hex').slice(0, 16);
  const limited = (k, n, ms) => { const now = Date.now(); const a = (RL.get(k) || []).filter((t) => now - t < ms); if (a.length >= n) { RL.set(k, a); return true; } a.push(now); RL.set(k, a); if (RL.size > 5000) RL.clear(); return false; };

  async function order(req, body) {
    const c = await cfg(); if (!c.open) return [403, { ok: false, err: '아직 주문을 받지 않습니다 — 곧 문을 엽니다' }];
    const ik = ipKey(req); if (limited('o' + ik, 5, 3600e3)) return [429, { ok: false, err: '잠시 뒤 다시 해 주세요(짧은 시간에 주문이 많음)' }];
    const chk = checkOrder(body, c); if (!chk.ok) return [400, chk]; const v = chk.v;
    const refs = v.ids.map((id) => C('prd_listings').doc(id)); const now = Date.now(); const no = orderNo(now); const tok = crypto.randomBytes(16).toString('hex');
    const pc = pubCfg(c, null); const due = new Date(now + pc.payDays * 864e5).toISOString();
    let out = null;
    await db.runTransaction(async (tx) => { out = null;
      const ls = await tx.getAll(...refs); const hs = await tx.getAll(...v.ids.map((id) => C('shop_holds').doc(id)));
      const bad = []; const lines = [];
      ls.forEach((d, i) => { const l = d.exists ? d.data() : null; const b = l && l.bookId ? CAT.books.get(String(l.bookId)) : null; const it = pubItem(v.ids[i], l, b); const h = hs[i].exists ? hs[i].data() : null;
        if (!it) return bad.push({ id: v.ids[i], why: '방금 팔렸거나 판매를 멈춘 책' }); if (holdOn(h, now)) return bad.push({ id: v.ids[i], t: it.t, why: h.sold ? '방금 다른 곳에서 팔린 책' : '다른 분이 먼저 주문한 책' });
        lines.push({ lid: v.ids[i], t: it.t, g: it.g, p: it.p, lp: it.lp, isbn: it.isbn, im: it.im, sku: s(l.sku, 40) || null, qty: 1 }); });
      if (bad.length) { out = [409, { ok: false, err: '주문할 수 없는 책이 있습니다', bad }]; return; }
      const sum = lines.reduce((a, x) => a + x.p, 0); const fee = shipFeeOf(sum, pc); const total = sum + fee;
      const ref = C('shop_orders').doc(no);
      tx.set(ref, { no, ch: 'shop', st: 'new', at: new Date(now).toISOString(), due, items: lines, sum, shipFee: fee, total, pay: { how: pc.pay.how, ...(pc.pay.how === 'bank' ? { bank: pc.pay.bank, acct: pc.pay.acct, holder: pc.pay.holder } : {}) }, depositor: v.depositor,
        buyer: v.buyer, rcv: v.rcv, agree: { privacy: new Date(now).toISOString(), terms: new Date(now).toISOString(), ver: '2026-11-11' }, tokH: hashTok(tok), ipk: ik, ua: s(req.headers['user-agent'], 120),
        hist: [{ at: new Date(now).toISOString(), by: '손님', what: `주문 접수 ${lines.length}권 · ${total}원` }], uploadedAt: FV.serverTimestamp(), writer: 'cloud-shop' });
      for (const x of lines) tx.set(C('shop_holds').doc(x.lid), { on: 1, no, at: new Date(now).toISOString(), t: x.t, uploadedAt: FV.serverTimestamp() });
      out = [200, { ok: true, no, t: tok, total, sum, shipFee: fee, due, pay: pc.pay, items: lines.map((x) => ({ id: x.lid, t: x.t, g: x.g, p: x.p })) }]; });
    HELD.at = 0; if (out && out[0] === 200) log && log(`🛍 우리숍 주문 접수 ${no} · ${out[1].items.length}권`); return out || [500, { ok: false, err: '주문을 저장하지 못했습니다 — 잠시 뒤 다시' }];
  }
  async function lookup(no, tok) { no = s(no, 30); if (!/^BQ\d{8}-[A-Z0-9]{5}$/.test(no) || !/^[0-9a-f]{32}$/.test(String(tok || ''))) return null; const d = await C('shop_orders').doc(no).get(); if (!d.exists) return null; const o = d.data() || {};
    const a = Buffer.from(String(o.tokH || '')), b = Buffer.from(hashTok(tok)); if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null; return { ref: d.ref, o }; }
  const ST = { new: '주문 접수 — 입금을 기다립니다', paid: '입금 확인 — 포장 준비 중', ship: '출고 준비 중', sent: '보냈습니다', done: '끝', cancel: '취소됨' };
  const view = (o) => ({ ok: true, no: o.no, at: o.at, st: o.st, stTxt: ST[o.st] || o.st, due: o.due, total: o.total, sum: o.sum, shipFee: o.shipFee, pay: o.st === 'new' ? o.pay : { how: (o.pay || {}).how }, name: maskName(o.buyer && o.buyer.name), dep: maskName(o.depositor),
    items: (o.items || []).map((x) => ({ id: x.lid, t: x.t, g: x.g, p: x.p })), inv: o.inv && o.inv.no ? { courier: o.inv.courier || null, no: o.inv.no } : null, cxl: o.st === 'cancel' ? (o.cxl || {}).why || null : null });

  /* (11/11 shop2) 책 한 권 HTML — 판매중·주문 중은 목록 요약 · 팔린 책은 기억(CAT.gone) → 없으면 상품 문서를 한 번 봄(같은 번호는 10분 기억) */
  const MISS = new Map();
  async function seoPage(res, id) { const html = (code, body, cache) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache || 'public, max-age=300, s-maxage=600' }); res.end(body); return true; };
    const nf = () => html(404, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>없는 책 | 북스퀸</title><link rel="stylesheet" href="/shop.css?v=0.1.0"></head><body><main class="wrap"><h1>찾는 책이 없습니다</h1><p><a class="btn" href="/#/">책 둘러보기</a></p></main></body></html>`, 'public, max-age=120');
    if (!/^[\w.-]{1,80}$/.test(id)) return nf(); await ready(); const c = await cfg(); const H = await held(); const X = await soldX();
    const same = (it) => (it.isbn ? [...CAT.items.values()].filter((x) => x.isbn === it.isbn && x.id !== it.id && !X.has(x.id) && !H.has(x.id)) : []);
    let it = CAT.items.get(id); let st = it ? (X.has(id) ? 'x' : H.has(id) ? 'o' : 's') : null;
    if (!it && CAT.gone.has(id)) { it = CAT.gone.get(id); st = 'x'; }
    if (!it) { const m = MISS.get(id); if (m && Date.now() - m < 600e3) return nf(); if (limited('seo-miss', 300, 60e3)) return nf();
      try { const d = await C('prd_listings').doc(id).get(); const l = d.exists ? d.data() || {} : null; const pub = l && pubItem(id, { ...l, status: '판매중', active: true, qty: 1 }, null); /* 미끼·19금·값 없음은 품절 화면도 안 만듦 */
        if (!pub) { MISS.set(id, Date.now()); if (MISS.size > 5000) MISS.clear(); return nf(); } it = { ...pub, ph: [] }; st = 'x'; goneAdd(id, it); } catch (e) { return nf(); } }
    return html(200, bookPage(it, { st, cfg: c, same: same(it) }), st === 'x' ? 'public, max-age=3600, s-maxage=86400' : undefined); }

  /* HTTP — 처리했으면 true */
  async function handle(req, res, path) {
    if (/^\/b\/[^/]+$/.test(path) || /^\/sitemap(-\d+)?\.xml$/.test(path)) path = '/shop' + path; /* (11/11 shop2) Hosting이 넘긴 검색 주소 */
    if (!/^\/shop\//.test(path)) return false;
    const origin = req.headers.origin || ''; const extra = String(process.env.SHOP_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
    if ([...SHOP_ORIGINS, ...extra].includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
    const send = (code, obj, cache) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store', 'X-Robots-Tag': 'noindex' }); res.end(JSON.stringify(obj)); return true; };
    const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    try {
      if (limited('r' + ipKey(req), 240, 60e3)) return send(429, { ok: false, err: '잠시 뒤 다시 해 주세요' });
      if (path.startsWith('/shop/b/') && req.method === 'GET') return await seoPage(res, decodeURIComponent(path.slice(8)).slice(0, 80));
      { const m = /^\/shop\/sitemap(?:-(\d+))?\.xml$/.exec(path); if (m) { await ready(); const X = await soldX(); const H = await held(); const xml = sitemapXml([...CAT.items.values()].filter((x) => !X.has(x.id) && !H.has(x.id)), { n: m[1] ? +m[1] : 0 }); if (!xml) return send(404, { ok: false, err: '없는 쪽' });
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800, s-maxage=3600' }); res.end(xml); return true; } }
      if (path === '/shop/cfg') { await ready(); return send(200, { ok: true, ...pubCfg(await cfg(), CAT.meta), err: CAT.err && !CAT.items.size ? '목록 준비 중' : null }, 'public, max-age=60'); }
      if (path === '/shop/list') { await ready(); const H = await held(); const r = listItems([...CAT.items.values()], q, H, await soldX()); return send(200, { ok: true, ...r, at: CAT.meta && CAT.meta.at }, 'public, max-age=30'); }
      if (path === '/shop/shelf') { await ready(); const H = await held(); const X = await soldX(); const key = [CAT.meta && CAT.meta.at, HELD.at, CAT.items.size].join('|');
        if (SHELF.key !== key) { SHELF.parts = shelfParts(shelfRows([...CAT.items.values()], H, X, CAT.sp)); SHELF.key = key; SHELF.gz = new Map(); }
        const k = Math.max(0, Math.min(SHELF.parts.length - 1, parseInt(q.k, 10) || 0)); const P = SHELF.parts[k] || { rows: [] };
        const body = JSON.stringify({ ok: true, v: 1, n: SHELF.parts.reduce((a, x) => a + x.rows.length, 0), k, kn: SHELF.parts.length, at: CAT.meta && CAT.meta.at, pre: SHELF_PRE, cols: SHELF_COLS, rows: P.rows });
        const gz = /\bgzip\b/.test(String(req.headers['accept-encoding'] || '')); const hd = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Robots-Tag': 'noindex', Vary: 'Accept-Encoding, Origin' };
        if (gz) { let z = SHELF.gz.get(k); if (!z) { z = zlib.gzipSync(body, { level: 6 }); SHELF.gz.set(k, z); } res.writeHead(200, { ...hd, 'Content-Encoding': 'gzip' }); res.end(z); } else { res.writeHead(200, hd); res.end(body); } return true; }
      if (path === '/shop/item') { await ready(); const H = await held(); const X = await soldX(); const it0 = CAT.items.get(s(q.id, 80)); const it = it0 && !X.has(it0.id) ? it0 : null; if (!it) return send(404, { ok: false, err: '판매가 끝났거나 없는 책입니다' });
        const same = it.isbn ? [...CAT.items.values()].filter((x) => x.isbn === it.isbn && x.id !== it.id && !X.has(x.id)).slice(0, 6).map((x) => ({ id: x.id, g: x.g, p: x.p, st: H.has(x.id) ? 'o' : 's' })) : [];
        return send(200, { ok: true, item: { ...it, st: H.has(it.id) ? 'o' : 's' }, same }, 'public, max-age=30'); }
      if (path === '/shop/order' && req.method === 'POST') { const body = await readBody(req); const [code, obj] = await order(req, body); return send(code, obj); }
      if (path === '/shop/order') { const r = await lookup(q.no, q.t); if (!r) return send(404, { ok: false, err: '주문을 찾을 수 없습니다(주문 번호·조회 주소 확인)' }); return send(200, view(r.o)); }
      if (path === '/shop/cancel' && req.method === 'POST') { const body = await readBody(req); const r = await lookup(body.no, body.t); if (!r) return send(404, { ok: false, err: '주문을 찾을 수 없습니다' });
        let res2 = null; await db.runTransaction(async (tx) => { res2 = null; const d = await tx.get(r.ref); const o = d.data() || {}; if (o.st !== 'new') { res2 = [409, { ok: false, err: '입금 확인 뒤에는 화면에서 취소할 수 없습니다 — 가게로 연락 주세요' }]; return; }
          const at = new Date().toISOString(); tx.set(r.ref, { st: 'cancel', cxl: { by: '손님', at, why: '손님이 취소' }, hist: FV.arrayUnion({ at, by: '손님', what: '손님 취소(입금 전)' }), uploadedAt: FV.serverTimestamp() }, { merge: true });
          for (const x of o.items || []) tx.set(C('shop_holds').doc(x.lid), { on: 0, freeAt: at, freeWhy: '손님 취소 ' + o.no }, { merge: true }); res2 = [200, { ok: true }]; });
        HELD.at = 0; return send(res2[0], res2[1]); }
      return send(404, { ok: false, err: '없는 주소' });
    } catch (e) { log && log('🛍 우리숍 창구 오류', path, e.message); return send(e.code === 413 ? 413 : 500, { ok: false, err: '잠시 문제가 생겼습니다 — 잠시 뒤 다시 해 주세요' }); }
  }
  const readBody = (req) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > 32e3) { no(Object.assign(new Error('너무 큼'), { code: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { ok(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { ok({}); } }); req.on('error', no); });
  let CHK = null; /* (11/11 shop3) 🔍 문 열기 전 점검 — 5분 기억(관리 기기 여럿이 열어도 한 번) */
  async function check(force) { if (!force && CHK && Date.now() - CHK.t < 5 * 60e3) return CHK.v; try { await build(); } catch (e) {} const it = [...CAT.items.values()].find((x) => x && x.ph && x.ph.length) || [...CAT.items.values()][0] || null; const v = await selfCheck({ item: it }); v.n = CAT.items.size; CHK = { t: Date.now(), v }; return v; }
  return { handle, build, check, _cat: CAT };
}

/* (11/11 shop3) 🔍 문 열기 전 점검 — 공개 주소를 클라우드가 직접 열어 봄(브라우저는 다른 출처라 상태 번호를 못 읽음) · 손님 정보 없음 · 결과 5분 기억
 *  ① booksqueen.com 도메인(DNS A·TXT · https 열림 → 도메인 연결·인증서) ② booksqueen.web.app(사이트가 만들어지고 손님 화면이 올라감)
 *  ③ /sitemap.xml · /b/<판매중 한 권>(Hosting → Cloud Run 넘김 · Cloud Run 공개 호출) ④ 실물 사진 한 장(Storage 사진 공개 읽기)
 *  돌려줌 { at, dom: { a, txt, err }, https: { ok, st, err, why }, web: {...}, sm: {...}, b: {...}, ph: {...}, base } — 각 칸 ok(참·거짓·null = 못 봄) */
const CHK_HOST = 'booksqueen.com'; const CHK_WEB = 'https://booksqueen.web.app';
function chkWhy(e) { const c = String((e && ((e.cause && (e.cause.code || e.cause.message)) || e.code || e.message)) || ''); if (/ENOTFOUND|EAI_AGAIN|ENODATA/.test(c)) return { k: 'dns', t: '도메인을 못 찾음(DNS A 레코드가 아직 없음)' };
  if (/CERT|SSL|TLS|ALTNAME|self.signed|UNABLE_TO_VERIFY|DEPTH_ZERO/i.test(c)) return { k: 'cert', t: '인증서가 아직(https 안 됨 — Firebase가 DNS를 보고 저절로 발급 · 몇 분~24시간)' };
  if (/abort|timeout|ETIMEDOUT/i.test(c)) return { k: 'time', t: '응답이 늦음(10초)' }; if (/ECONNREFUSED|ECONNRESET/.test(c)) return { k: 'conn', t: '연결 거절(다른 서버를 가리킴?)' }; return { k: 'err', t: c.slice(0, 80) || '열기 실패' }; }
async function chkGet(u, f, ms) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms || 10e3); try { const r = await f(u, { redirect: 'manual', signal: ac.signal, headers: { 'User-Agent': 'readnow-shop-check' } }); const ct = String((r.headers && r.headers.get && r.headers.get('content-type')) || ''); let body = ''; try { body = (await r.text()).slice(0, 2000); } catch (e) {} return { st: r.status, ct, body }; } catch (e) { return { err: chkWhy(e) }; } finally { clearTimeout(t); } }
async function selfCheck(o) { o = o || {}; const f = o.fetch || fetch; const dns = o.dns || require('dns').promises; const out = { at: new Date().toISOString() };
  const dn = {}; try { dn.a = await dns.resolve4(CHK_HOST); } catch (e) { dn.a = []; dn.err = chkWhy(e).t; } try { dn.txt = (await dns.resolveTxt(CHK_HOST)).map((x) => x.join('')).filter((x) => /hosting-site|firebase/i.test(x)).slice(0, 4); } catch (e) { dn.txt = []; } out.dom = dn;
  const h = await chkGet('https://' + CHK_HOST + '/robots.txt', f); out.https = h.err ? { ok: false, k: h.err.k, why: h.err.t } : { ok: h.st === 200, st: h.st, why: h.st === 200 ? '' : h.st === 404 ? '도메인은 열리는데 손님 화면이 없음(Firebase 사이트에 아직 안 이어짐)' : 'HTTP ' + h.st };
  const w = await chkGet(CHK_WEB + '/robots.txt', f); out.web = w.err ? { ok: false, why: w.err.t } : { ok: w.st === 200 && /Sitemap/i.test(w.body), st: w.st, why: w.st === 200 ? '' : w.st === 404 ? '사이트 booksqueen이 아직 없음(🛍 우리숍 내기 작업을 기다림)' : 'HTTP ' + w.st };
  const base = out.https.ok ? 'https://' + CHK_HOST : CHK_WEB; out.base = base; const rw = (r, want) => r.err ? { ok: false, why: r.err.t } : { ok: r.st === 200 && want(r), st: r.st, why: r.st === 200 ? (want(r) ? '' : '내용이 다름(넘김 설정 확인)') : r.st === 403 ? 'Cloud Run이 공개 호출을 막음(allUsers 호출 권한)' : r.st === 404 ? '넘김(rewrites)이 아직 안 올라감 — 🛍 우리숍 내기 작업' : 'HTTP ' + r.st };
  const sm = await chkGet(base + '/sitemap.xml', f); out.sm = rw(sm, (r) => /<(urlset|sitemapindex)/.test(r.body));
  const it = o.item || null; if (it && it.id) { const b = await chkGet(base + '/b/' + encodeURIComponent(it.id), f); out.b = { ...rw(b, (r) => /schema\.org|ld\+json/.test(r.body)), id: it.id }; } else out.b = { ok: null, why: '판매중 공개 책이 아직 없음' };
  const pu = it && ((it.ph && it.ph[0]) || null); if (pu) { const p = await chkGet(pu, f); out.ph = p.err ? { ok: false, why: p.err.t } : { ok: p.st === 200 && /^image\//.test(p.ct), st: p.st, why: p.st === 200 ? '' : p.st === 403 || p.st === 401 ? 'Storage 규칙이 사진 공개 읽기를 막음(손님 화면에 사진이 안 보임)' : 'HTTP ' + p.st }; } else out.ph = { ok: null, why: '실물 사진이 있는 공개 책이 아직 없음(표지만)' };
  return out; }

module.exports = { selfCheck, chkWhy, makeShop, shelfPub, shelfRows, shelfParts, SHELF_COLS, SHELF_PRE, SHELF_PART, pubItem, listItems, kstDay, checkOrder, bookPage, bookLd, sitemapXml, holdOn, BASE, SITEMAP_MAX, shipFeeOf, pubCfg, maskName, orderNo, hashTok, DEF, SHOP_ORIGINS, PAGE };
