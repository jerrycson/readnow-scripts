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
const crypto = require('crypto'); const zlib = require('zlib'); const BQP = require('./shop-promo.js'); const ANLX = require('./shop-analytics.js'); /* (11/13 shopadm1) 📊 백오피스 방문 셈·배너·문의·미리 보기 */ /* (11/11 shopc1) 🏷 우리숍 판매가 규칙·배지·묶음 할인·쿠폰 */
const IMG_BASE = 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/';
const SHOP_ORIGINS = ['https://booksqueen.com', 'https://www.booksqueen.com', 'https://booksqueen.web.app', 'https://booksqueen.firebaseapp.com'];
const DEF = { open: 0, name: '북스퀸', shipFee: 3500, freeOver: 0, payDays: 2, maxItems: 20, fullH: 12, deltaMin: 10 };
/* 근거: 배송비 3,500원 = 알라딘 지정 택배 배송비와 같게(웹앱 숍 설정 안내 원문) · 입금 기한 2일·한 주문 20권·읽기 주기는 근거 없음 → app_settings/shop에서 바꿈 */
const PAGE = 24;
const BAD_SKU = /^\s*DUPES/i;

const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200);
const num = (v) => { const x = Math.round(+v); return Number.isFinite(x) && x > 0 ? x : 0; };
/* (shelf2) 판형 '148*210*20mm' → '148x210x20'(가로x세로x두께 mm · 서가 책장 책 키·두께) · 이상하면 null */
const szOf = (v) => { const m = /(\d{2,3})\s*[*x×]\s*(\d{2,3})(?:\s*[*x×]\s*(\d{1,3}))?/i.exec(String(v || '')); if (!m) return null; const w = +m[1], h = +m[2], d = m[3] ? +m[3] : 0; if (w < 60 || h < 80 || w > 450 || h > 500 || d > 200) return null; return w + 'x' + h + (d ? 'x' + d : ''); };
const imgOf = (im, thumb) => { if (!im) return null; if (typeof im === 'string') return /^https:\/\//.test(im) ? im : null; const p = thumb ? im.thumb || im.stored : im.stored || im.thumb; if (p) return IMG_BASE + encodeURIComponent(p) + '?alt=media'; return typeof im.src === 'string' && /^https:\/\//.test(im.src) ? im.src : null; };
/* (shelf3) 분류 경로는 '>' 또는 ','로 이어 옴('국내도서,종교/역학,기독교(개신교),…') — 둘 다 나눔(전엔 쉼표 경로가 통째로 들어가 책장 이름표가 잘렸음) · c = 둘째 칸(큰 분야) · c2 = 셋째 칸(작은 분야 표찰) */
const catSeg = (b) => { const c0 = b && b.categories && b.categories[0]; const v = (c0 && (c0.path || c0.name)) || (b && (b.categoryName || (typeof b.category === 'string' ? b.category : ''))) || ''; return (Array.isArray(v) ? v.map(String) : String(v).split(/\s*[>,]\s*/)).map((x) => x.trim()).filter(Boolean); }; /* path가 배열이면 그대로(배열을 글로 바꾸면 쉼표로 이어짐) */
/* (shop2 · 정범님 11/13 19:42 '외국도서·CD·블루레이·DVD·잡지가 없음 · 알라딘 가장 작은 분류까지') 🗂 상품 종류 + 분류 경로
 *  알라딘 분류 경로 첫 칸이 몰(국내도서·외국도서·음반·DVD·블루레이 · 중고 상품은 '온라인 중고샵>중고국내도서>…' 꼴 · 영상은 'DVD/블루레이>블루레이>…')
 *  → 종류(KINDS 차례) + 나머지 칸 · 잡지는 국내·외국 모두 '잡지' 종류로 모음 · 음반 경로에 LP가 있으면 'LP' · 경로가 없으면 관리 코드(KHKDVD·KHKCPD)
 *  근거: 실제 판매중 4,000권 표본(11/13 booksqueen.com/shop/shelf) — 블루레이 194 · 중고국내도서 340 · 중고외국도서 36 · 외국도서 분야(ELT·인문/사회·일본 도서) · DVD(드라마/코미디·애니메이션) */
const KINDS = ['국내도서', '외국도서', '잡지', '음반', 'LP', 'DVD', '블루레이', '그 밖'];
function kindPath(b, sku) { let seg = catSeg(b).map((x) => s(x, 30)).filter(Boolean); if (seg.length && /중고샵|^중고$/.test(seg[0])) seg = seg.slice(1);
  const r0 = String(seg[0] || '').replace(/^중고\s*/, ''); let k = null, rest = seg.slice(1);
  if (/^국내도서$|^도서$/.test(r0)) k = '국내도서'; else if (/^외국도서$/.test(r0)) k = '외국도서'; else if (/^(음반|CD|music)$/i.test(r0)) k = '음반'; else if (/^블루레이$|blu-?ray/i.test(r0)) k = '블루레이';
  else if (/^DVD/i.test(r0)) { if (/^블루레이$|blu-?ray/i.test(rest[0] || '')) { k = '블루레이'; rest = rest.slice(1); } else { k = 'DVD'; if (/^DVD$/i.test(rest[0] || '')) rest = rest.slice(1); } }
  else if (r0) { k = '국내도서'; rest = seg; } /* 몰 칸이 없는 옛 경로 */
  else { const sk = String(sku || '').toUpperCase(); k = /DVD/.test(sk) ? 'DVD' : /CPD/.test(sk) ? '음반' : '그 밖'; }
  if (k === '음반' && rest.some((x) => /\bLP\b|바이닐|vinyl/i.test(x))) { k = 'LP'; rest = rest.filter((x) => !/^(LP|바이닐|vinyl)$/i.test(x)); }
  const mi = rest.findIndex((x) => /잡지|magazine/i.test(x)); if ((k === '국내도서' || k === '외국도서') && mi >= 0 && mi <= 1) rest = k === '국내도서' ? rest.slice(mi + 1) : ['외국 잡지', ...rest.slice(0, mi), ...rest.slice(mi + 1)].filter((x, i, A) => !(i > 0 && /잡지/.test(x) && x === A[i - 1])), k = '잡지';
  return { k, rest: rest.slice(0, 6) }; }
const cpOf = (P) => [P.k, ...P.rest].join('>').slice(0, 160);
const catOf = (b, sku) => { const P = kindPath(b, sku); return s(P.k === '국내도서' ? P.rest[0] || '' : P.k, 24) || null; }; /* (shop2) 국내도서는 둘째 칸(소설/시/희곡…) · 다른 종류는 종류 이름(외국도서·블루레이…) — 전엔 '중고국내도서'·'인문/사회'(외국도서)가 분야로 섞였음 */
const cat2Of = (b, sku) => { const P = kindPath(b, sku); const v = P.k === '국내도서' ? P.rest[1] : P.rest[0]; return v ? s(v, 24) || null : null; };
const pd = (v) => { const d = String(v || '').replace(/[^\d]/g, ''); return d.length >= 6 ? d.slice(0, 4) + '-' + d.slice(4, 6) : null; };
const tsIso = (v) => { if (!v) return null; if (typeof v.toDate === 'function') return v.toDate().toISOString(); const t = Date.parse(v); return t ? new Date(t).toISOString() : null; };

/* 판매중인 우리 상품 한 줄 → 손님에게 보일 요약(아니면 null) */
/* (rel10 · 11/11 정밀 점검 1-3) '품절' 화면은 실제로 팔린 책만 — 판매중지·일시판매중지·보류·삭제(숨긴 재고)는 일반 '없는 책' 화면(제목·등급·값을 밖에 보이지 않음) */
const soldLike = (l) => !!l && (String(l.status || '') === '판매완료' || !!l.soldAt || (String(l.status || '') === '판매중' && l.qty === 0));
function pubItem(id, l, b) {
  if (!l) return null; b = b || {};
  if (String(l.status || '') !== '판매중' || l.active === false || l.qty === 0) return null;
  if (BAD_SKU.test(String(l.sku || '')) || l.adult || b.adult) return null;
  const p = num(l.price); const t = s(l.title || b.title, 120); if (!p || !t) return null;
  const ph = (l.photos || []).filter((x) => x && x.stored && x.kind !== 'preview' && !/\/letslook\//i.test(String(x.src || ''))) /* (shelf8) 예전 사진 받기가 넣어 둔 알라딘 미리보기(letslook)는 실물 사진이 아님 — 샘플 칸으로 따로 */.slice(0, 6).map((x) => imgOf(x, true)).filter(Boolean);
  const cover = imgOf(b.images && b.images.front, true) || imgOf(b.cover, true);
  const author = s(b.author || (b.contributors || []).slice(0, 2).map((c) => c && c.name).filter(Boolean).join(', ') || l.author, 60) || null;
  return { id: String(id), t, a: author, pb: s(b.publisher || l.publisher, 40) || null, pd: pd(b.pubDate), c: catOf(b, l.sku), c2: cat2Of(b, l.sku), cp: cpOf(kindPath(b, l.sku)), g: s(l.grade, 4) || null, p, lp: num(b.priceList || l.priceList) || null,
    im: cover || ph[0] || null, ph, sp: imgOf(b.images && b.images.spine, false) || null, bk: imgOf(b.images && b.images.back, true) || null, pg: num(b.pages) || null, sz: szOf(b.size), pv: ['done', 'shared'].includes(String(l.previewsStatus || '')) ? 1 : null, isbn: /^97[89]\d{10}$/.test(String(l.isbn13 || b.isbn13 || '')) ? String(l.isbn13 || b.isbn13) : null, q: Math.max(1, +l.qty || 1), at: tsIso(l.registeredAt) || tsIso(l.firstSeenAt) || null };
}
/* ══ (11/11 shelf1) 📚 서가 책장 — 판매중 책 전부를 가볍게(칸 이름 cols · 줄마다 배열 · 그림 주소 앞부분은 pre 번호로 줄임) · 4,000권씩 나눠 받음
 *  판매지수(sp)는 숫자를 내보내지 않고 순위(sr · 1이 가장 많이 팔림)만 — 공개 요약 칸 밖의 시장 지표를 새지 않게 · 주문 중 'o' · 다른 판매처에서 팔린 책은 뺌 */
const SHELF_COLS = ['id', 't', 'a', 'c', 'p', 'lp', 'g', 'at', 'im', 'sp', 'bk', 'st', 'sr', 'pg', 'pb', 'sz', 'lk', 'c2', 'p0', 'bd', 'cv', 'pv', 'rv', 'q', 'cp']; /* (shop2 11/13) cp = 종류>분류>…>가장 작은 분류 */ /* (shop2 11/13) q = 수량(2 넘을 때만 · 서가 '여러 권 모두 진열/수량 표시') */ /* (shelf8) rv = 손님 별점 [평균, 수](공개 리뷰 0이면 없음) */ /* (shelf2) sz 판형 · lk 영구 책등 모양 · (shelf3) c2 작은 분야 · p0 할인 전 값 · bd 배지 · (shelf4) cv 앞표지 대표색.글꼴 갈래(클라우드 셈) */
const SHELF_PRE = [IMG_BASE, 'https://image.aladin.co.kr/product/'];
/* (shelf6) 서가 창구 제한 — IP당 1분 120번(손님 한 명이 서가를 열 때 2번: 첫 묶음 + 나머지 한꺼번에 · 같은 IP 손님 60명이 1분 안에 열어도 됨) · 나머지 창구는 그대로 240번 */
const SHELF_RL = [120, 60e3];
/* (shelf6) 묶음 고르기 — k=0(한 묶음) · k=1-(1번부터 끝까지 한꺼번에) · k=1-3(1~3) → [첫, 끝] (범위 밖은 안으로) */
const shelfK = (q, n) => { const m = /^(\d{1,3})(?:-(\d{0,3}))?$/.exec(String(q == null ? '0' : q).trim()); const last = Math.max(0, n - 1); if (!m) return [0, 0]; const a = Math.min(last, +m[1]); const b = m[2] === undefined ? a : m[2] === '' ? last : Math.min(last, Math.max(a, +m[2])); return [a, b]; };
const SHELF_PART = 4000; /* 근거: 한 묶음 ≈ 4,000권 × 250바이트 ≈ 1MB(gzip ≈ 200KB) — 휴대폰 첫 화면이 1~2초 안에 그려지게 */
const preOf = (u) => { if (!u) return null; for (let i = 0; i < SHELF_PRE.length; i++) if (u.startsWith(SHELF_PRE[i])) return '~' + i + u.slice(SHELF_PRE[i].length); return u; };
function shelfRows(all, held, sold, sp, lk, cvf, rvf) { const H = held || new Set(); const X = sold || new Set(); const SP = sp || new Map(); const LK = lk || new Map();
  const L = (all || []).filter((x) => x && !X.has(x.id)).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')) || String(b.id).localeCompare(String(a.id))); /* 등록순(오래된 것 먼저) */ /* (shelf4) 새 책 먼저 — 손님 화면이 첫 묶음(4,000권)만 받고 바로 첫 책장을 그림(나머지는 뒤에서) */
  const R = L.map((x) => [x.id, SP.has(x.id) ? +SP.get(x.id) || 0 : -1]).filter((r) => r[1] >= 0).sort((a, b) => b[1] - a[1]); const rank = new Map(R.map((r, i) => [r[0], i + 1]));
  return L.map((x) => [x.id, x.t, x.a || null, x.c || null, x.p, x.lp || null, x.g || null, x.at ? String(x.at).slice(0, 10) : null, preOf(x.im), preOf(x.sp), preOf(x.bk), H.has(x.id) ? 'o' : 's', rank.get(x.id) || null, x.pg || null, x.pb || null, x.sz || null, LK.get(x.id) || null, x.c2 || null, x.p0 || null, x.bd && x.bd.length ? x.bd : null, cvf ? cvf(x.im) : null, x.pv ? 1 : null, (rvf && rvf(x)) || null, x.q > 1 ? Math.min(999, Math.floor(x.q)) : null, x.cp || null]); } /* (shelf8) pv 샘플 있음 */
/* (shelf2) 📚 책등 모양 영구 저장 — shop_spines/b00~b31 문서(상품 번호 해시로 32칸 · {m:{상품:모양}}) · 손님 화면이 정해 보내면 '먼저 정한 것'이 이김
 *  모양 글 = '세대.출처.디자인.색.무늬.글꼴.모양.장식.방향'(shop/shelf-core.js encode) · 세대(lookGen)가 지금 설정과 다른 것은 안 씀(지우지 않음 — 관리 화면 '다시 정하기') */
const SPINE_RE = /^(\d{1,4})\.[scrt]\.\d{1,2}\.\d{1,3}\.\d{1,2}\.\d{1,2}\.\d{1,3}\.\d\.[vh](?:\.\d{1,3})?$/; /* (shelf7) 끝 '.곁색' · 모양 세 자리 */
const UQX = require('./shop-uniq.js'); /* (shelf7) 📚 책등 고유 모양 지킴이 — 겹치면 곁색·무늬·모양만 바꿔 빈 조합으로 */
const SPINE_N = 32; const spineBucket = (id) => { let h = 2166136261 >>> 0; const t = String(id); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'b' + String(h % SPINE_N).padStart(2, '0'); };
/* 들어온 것 거르기 → 새로 받을 [상품, 모양] (have = 이미 있는 Map · ok = 판매중 상품인지 · gen = 지금 세대) */
function spineTake(L, have, ok, gen) { const out = []; const seen = new Set(); for (const r of Array.isArray(L) ? L.slice(0, 300) : []) { if (!Array.isArray(r)) continue; const id = s(r[0], 80), code = String(r[1] || ''); const m = SPINE_RE.exec(code);
    if (!id || !m || +m[1] !== gen || seen.has(id) || !ok(id)) continue; const was = have.get(id); const wm = was && SPINE_RE.exec(was); if (wm && +wm[1] === gen) continue; seen.add(id); out.push([id, code]); } return out; }
const shelfParts = (rows) => { const P = []; for (let i = 0; i < rows.length; i += SHELF_PART) P.push({ rows: rows.slice(i, i + SHELF_PART) }); if (!P.length) P.push({ rows: [] }); return P; };
/* shop_holds 한 장이 지금 살아 있나 — until(다른 판매처 팔림 표시 · 하루)이 지나면 풂 */
const holdOn = (h, now) => !!(h && h.on && !(h.until && Date.parse(h.until) < (now || Date.now())));
const norm = (x) => String(x || '').toLowerCase().replace(/[\s\-_.,·:;!?'"()[\]{}<>/\\]+/g, '');
/* 목록 거르기·정렬·쪽 — 순수 셈(시험 tSHOP1111) */
/* (11/11 shop4) 🆕 들어온 날(한국 날짜) — 손님 화면 '오늘·어제·N일 전' 표 · 첫 화면 '오늘 N권 새로' 셈 */
const kstDay = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? new Date(t + 9 * 3600e3).toISOString().slice(0, 10) : null; };
/* (shop2) 🗂 분류 나무 — 판매중 상품이 있는 칸만(손님이 눌렀는데 빈 칸이 없게 · 쿠팡·알라딘 중고샵도 상품 있는 분류만) · tree = [[경로, 권 수]] 경로 차례 · kinds = [[종류, 권 수]] KINDS 차례 */
function catTree(items) { const M = new Map(); for (const x of items) { if (!x || !x.cp) continue; const seg = x.cp.split('>'); for (let i = 1; i <= seg.length; i++) { const k = seg.slice(0, i).join('>'); M.set(k, (M.get(k) || 0) + 1); } }
  const tree = [...M].sort((a, b) => { const A = a[0].split('>'), B = b[0].split('>'); const ka = KINDS.indexOf(A[0]), kb = KINDS.indexOf(B[0]); return ka - kb || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
  return { tree, kinds: KINDS.filter((k) => M.has(k)).map((k) => [k, M.get(k)]) }; }
function listItems(all, o, held, sold, now) {
  o = o || {}; const X = sold || new Set(); if (X.size) all = all.filter((x) => !X.has(x.id)); const q = String(o.q || '').trim(); const toks = q.split(/\s+/).map(norm).filter(Boolean); const dig = q.replace(/\D/g, '');
  const pMin = Math.max(0, parseInt(o.pmin, 10) || 0), pMax = Math.max(0, parseInt(o.pmax, 10) || 0); /* (11/11 shopc1) 값 범위·할인만·배지 거르기 — 값은 규칙을 얹은 우리숍 판매가 */
  const cpq = s(o.cp, 160); /* (shop2) 분류 경로 거르기 — 그 칸과 그 아래 모두 */
  let L = all.filter((x) => (!o.c || x.c === o.c) && (!cpq || (x.cp && (x.cp === cpq || x.cp.startsWith(cpq + '>')))) && (!o.g || x.g === o.g) && (!pMin || x.p >= pMin) && (!pMax || x.p <= pMax) && (!o.sale || (x.p0 && x.p < x.p0)) && (!o.bd || (x.bd || []).includes(o.bd)));
  if (toks.length) L = L.filter((x) => { if (dig.length >= 10 && x.isbn && x.isbn.includes(dig)) return true; const h = norm(x.t + ' ' + (x.a || '') + ' ' + (x.pb || '')); return toks.every((k) => h.includes(k)); });
  const offOf = (x) => (x.p0 && x.p < x.p0 ? 1 - x.p / x.p0 : 0); const byNew = (a, b) => String(b.at || '').localeCompare(String(a.at || ''));
  const srt = o.s === 'low' ? (a, b) => a.p - b.p : o.s === 'high' ? (a, b) => b.p - a.p : o.s === 'off' ? (a, b) => offOf(b) - offOf(a) || byNew(a, b) : byNew;
  L = L.slice().sort(srt); const p = Math.max(0, Math.min(500, parseInt(o.p, 10) || 0)); const H = held || new Set();
  const t0 = now || Date.now(); const today = kstDay(new Date(t0).toISOString()); const wk0 = kstDay(new Date(t0 - 6 * 864e5).toISOString()); let nT = 0, nW = 0;
  for (const x of L) { const d = kstDay(x.at); if (!d) continue; if (d === today) nT++; if (d >= wk0) nW++; }
  return { total: L.length, p, more: (p + 1) * PAGE < L.length, today: nT, wk: nW, day: today, items: L.slice(p * PAGE, (p + 1) * PAGE).map((x) => ({ id: x.id, t: x.t, a: x.a, g: x.g, p: x.p, lp: x.lp, im: x.im, d: kstDay(x.at), st: H.has(x.id) ? 'o' : 's', ...(x.p0 ? { p0: x.p0 } : {}), ...(x.bd ? { bd: x.bd } : {}), ...(x.pe ? { pe: x.pe } : {}) })) };
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
  /* (11/13 shopux1 · 정범님 20:47 카드 n1113cartqty ⓑ) 같은 책 2권 넘게 — qty = { 상품: 권 수 }(2 넘을 때만 · 없으면 예전과 같은 한 권) · 권 수 합이 한 번에 담는 최대를 넘으면 안 됨 */
  const qty = {}; if (b.qty && typeof b.qty === 'object' && !Array.isArray(b.qty)) for (const [k, n0] of Object.entries(b.qty)) { const id = s(k, 80); const n = Math.round(+n0); if (ids.includes(id) && Number.isFinite(n) && n > 1) qty[id] = Math.min(50, n); }
  if (ids.length + Object.values(qty).reduce((a, n) => a + n - 1, 0) > (cfg.maxItems || DEF.maxItems)) return err(`한 번에 ${cfg.maxItems || DEF.maxItems}권까지 주문할 수 있습니다`);
  const cp = s(b.cp, 30).toUpperCase().replace(/[^A-Z0-9]/g, '') || null; const ex = b.expect != null && Number.isFinite(+b.expect) ? Math.round(+b.expect) : null; /* (11/11 shopc1) 쿠폰 번호 · 손님 화면이 본 합계(서버 셈과 다르면 주문하지 않고 새 값을 알림) */
  return { ok: true, v: { ids, buyer: { name, phone: ph, ...(em ? { email: em } : {}) }, rcv: { name: rn, phone: rp, zip, addr1: a1, addr2: a2, memo: s(r.memo, 100) || null }, depositor: dep, cp, expect: ex, ...(Object.keys(qty).length ? { qty } : {}) } };
}
/* (shopux1) 2권 넘게 담기 설정 — app_settings/shop.look(shop/shop-look.js 틀 multiOn·multiMax · 기본 켬·10권) */
const multiOf = (c) => { const L = (c && c.look) || {}; const on = L.multiOn !== false && L.multiOn !== 0 && L.multiOn !== '0'; const mx = Math.max(1, Math.min(50, Math.round(+L.multiMax) || 10)); return { on, mx }; };
const shipFeeOf = (sum, cfg) => { const f = num((cfg || DEF).shipFee); const fo = num((cfg || DEF).freeOver); return fo && sum >= fo ? 0 : f; }; /* (shopc1) 주문 값은 BQP.quote(묶음 할인·쿠폰 뒤 책값 기준)가 셈 — 이건 옛 시험·바깥 쓰임 그대로 */
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
function pubCfg(c, meta, promo) {
  c = { ...DEF, ...(c || {}) }; const bz = c.biz || {}; const bank = c.bank || {}; const bankOk = !!(bank.name && bank.acct && bank.holder);
  return { open: c.open ? 1 : 0, name: s(c.name, 20) || DEF.name, shipFee: num(c.shipFee), freeOver: num(c.freeOver), payDays: Math.max(1, Math.min(7, +c.payDays || DEF.payDays)), maxItems: Math.max(1, Math.min(50, +c.maxItems || DEF.maxItems)),
    pay: c.open && bankOk ? { how: 'bank', bank: s(bank.name, 20), acct: s(bank.acct, 30), holder: s(bank.holder, 20) } : { how: 'wait' }, pg: 0 /* 카드·간편결제(PG)는 계약 뒤 — 자리만 */,
    biz: { name: s(bz.name, 40) || null, ceo: s(bz.ceo, 20) || null, addr: s(bz.addr, 120) || null, tel: s(bz.tel, 20) || null, email: s(bz.email, 60) || null, no: s(bz.no, 20) || null, mo: s(bz.mo, 40) || null, cpo: s(bz.cpo, 20) || null, host: 'Google Firebase(구글)' },
    notice: s(c.notice, 300) || null, bnr: ANLX.bnrPub(c.anl && c.anl.bnr), trk: { on: ANLX.cfgOf(c.anl).on, ask: ANLX.cfgOf(c.anl).ask, keep: ANLX.cfgOf(c.anl).uactDays, ua: ANLX.cfgOf(c.anl).uact } /* (shopadm1) 📢 배너 · 💬 문의 · 방문 셈 켬/끔 · 시간줄 보존 일(개인정보 처리방침에 나감) */, shelf: shelfPub(c.shelf), /* (11/13 shopux1) 🎨 꾸밈(app_settings/shop.look · shop/shop-look.js 틀 — 꼴만 지킴 · 범위는 손님 화면 BQL.cfgOf가 다시) · 👑 로고 시안 번호(q01~q10 · 빈 값 = 글자 로고) */ look: shelfPub(c.look), brandLogo: /^q(0[1-9]|10)$/.test(String(c.brandLogo || '')) ? String(c.brandLogo) : '', n: meta ? meta.n : null, cats: meta ? meta.cats : [], kinds: meta && meta.kinds ? meta.kinds : [], at: meta ? meta.at : null, promo: BQP.pubPromo(promo || {}) };
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
function bookLd(it, st, base, rv) { base = base || BASE; const url = base + '/b/' + encodeURIComponent(it.id);
  const av = st === 'x' ? 'https://schema.org/SoldOut' : st === 'o' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock';
  const ld = { '@context': 'https://schema.org', '@type': 'Book', name: it.t, url, ...(it.a ? { author: { '@type': 'Person', name: it.a } } : {}), ...(it.pb ? { publisher: { '@type': 'Organization', name: it.pb } } : {}), ...(it.pd ? { datePublished: it.pd } : {}), ...(it.isbn ? { isbn: it.isbn } : {}), ...(it.c ? { genre: it.c } : {}),
    ...(it.im || (it.ph && it.ph.length) ? { image: [it.im, ...(it.ph || [])].filter(Boolean).slice(0, 4) } : {}),
    offers: { '@type': 'Offer', price: it.p, priceCurrency: 'KRW', availability: av, itemCondition: 'https://schema.org/UsedCondition', url, seller: { '@type': 'Organization', name: '북스퀸' }, ...(it.g ? { description: `중고 등급 ${it.g}` } : {}) },
    ...(rv && rv.n ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rv.avg, reviewCount: rv.n, bestRating: 5, worstRating: 0.5 }, review: (rv.top || []).map((r) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: r.st / 2, bestRating: 5 }, author: { '@type': 'Person', name: r.nick }, reviewBody: r.s100, ...(r.at ? { datePublished: String(r.at).slice(0, 10) } : {}) })) } : {}) }; /* (shop9 2회) 리뷰가 화면에 있을 때만 별점(구글 리뷰 구조화 자료 규칙) */
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
<link rel="stylesheet" href="/shop.css?v=0.1.3"><script type="application/ld+json">${bookLd(it, st, base, o.rv)}</script></head>
<body><header class="top"><a class="logo" href="/#/"><span class="crown">♛</span>${hx(nm)}<small>헌책방</small></a><nav class="nav"><a href="/#/list?s=new">책 찾기</a><a href="/#/cart">🛒</a></nav></header>
<main class="wrap bp"><nav class="hint"><a href="/#/">첫 화면</a>${it.c ? ` › <a href="/#/list?c=${encodeURIComponent(it.c)}">${hx(it.c)}</a>` : ''}</nav>
<article class="bk${st === 'x' ? ' sold' : ''}"><div class="bp-ph">${pics.length ? pics.map((u, i) => `<img src="${hx(u)}" alt="${hx(it.t)} ${i ? '실물 사진 ' + i : '표지'}" loading="${i ? 'lazy' : 'eager'}" width="320">`).join('') : '<div class="noimg">사진 준비 중</div>'}</div>
<div class="bp-tx"><h1>${hx(it.t)}</h1><p>${[it.a, it.pb, it.pd].filter(Boolean).map(hx).join(' · ')}</p>
<p class="gr"><b>등급 ${hx(it.g || '-')}</b> — ${hx(GR_TXT[it.g] || '사진으로 상태를 확인해 주세요')}</p>
<p class="pr"><b>${wonK(it.p)}</b>${it.lp ? ` <s>정가 ${wonK(it.lp)}</s>${off ? ` <em>${off}%↓</em>` : ''}` : ''}</p>
<p class="stt st-${st}"><b>${hx(stTxt)}</b></p>${it.isbn ? `<p class="hint">ISBN ${hx(it.isbn)}</p>` : ''}
${o.rv && o.rv.n ? `<section class="bp-rv"><h2>손님 리뷰 ★ ${o.rv.avg.toFixed(1)} <small>(${o.rv.n})</small></h2>${o.rv.top.map((r) => `<p><b>${'★'.repeat(Math.round(r.st / 2))}</b> ${hx(r.s100)} <small>— ${hx(r.nick)}</small></p>`).join('')}</section>` : ''}
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

/* (11/11 shopc1) 📚 함께 보면 좋은 책 — 근거(약속 42): 알라딘 '이 분야 다른 책'·AbeBooks 'More from this author'·쿠팡 '함께 보면 좋은 상품' — 우리 실물 중 ① 같은 지은이 ② 같은 분야 값이 비슷한 것 · 같은 책(ISBN)·주문 중·팔림 뺌 · 최대 8 */
function relItems(it, all, H, X) { H = H || new Set(); X = X || new Set(); if (!it) return []; const ok = (x) => x && x.id !== it.id && !(it.isbn && x.isbn === it.isbn) && !H.has(x.id) && !X.has(x.id); const out = []; const seen = new Set();
  const take = (L) => { for (const x of L) { if (out.length >= 8) break; if (seen.has(x.t)) continue; seen.add(x.t); out.push(x); } }; seen.add(it.t);
  if (it.a) take(all.filter((x) => ok(x) && x.a && norm(x.a) === norm(it.a)).sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))));
  if (it.c && out.length < 8) take(all.filter((x) => ok(x) && x.c === it.c).sort((a, b) => Math.abs(a.p - it.p) - Math.abs(b.p - it.p) || String(a.id).localeCompare(String(b.id))));
  return out.map((x) => ({ id: x.id, t: x.t, a: x.a, g: x.g, p: x.p, lp: x.lp, im: x.im, ...(x.p0 ? { p0: x.p0 } : {}), ...(x.bd ? { bd: x.bd } : {}) })); }
/* (11/11 shopc1) 🔎 찾기 자동완성 — 낱말(2글자부터)이 들어간 제목 6 · 지은이 3 · 출판사 2 (권수와 함께) · 팔린 책 뺌 */
function suggest(all, q0, X) { const q = norm(q0); X = X || new Set(); if (q.length < 2) return { s: [] }; const T = new Map(), A = new Map(), P = new Map(); const bump = (m, k) => { if (k) m.set(k, (m.get(k) || 0) + 1); };
  for (const x of all) { if (!x || X.has(x.id)) continue; if (norm(x.t).includes(q)) bump(T, x.t); if (x.a && norm(x.a).includes(q)) bump(A, x.a); if (x.pb && norm(x.pb).includes(q)) bump(P, x.pb); }
  const top = (m, n, k) => [...m.entries()].sort((a, b) => (norm(a[0]).startsWith(q) ? 0 : 1) - (norm(b[0]).startsWith(q) ? 0 : 1) || b[1] - a[1] || a[0].length - b[0].length).slice(0, n).map(([v, c]) => ({ v, k, n: c }));
  return { s: [...top(T, 6, 't'), ...top(A, 3, 'a'), ...top(P, 2, 'pb')] }; }

function makeShop({ db, C, FV, log, bucket, bg }) {
  /* (11/12 shopsrv) bg === false = 🛍 숍 전용 서비스(readnow-shop · cloud/shop-main.js) — 표지 대표색 셈·책등 규칙 주소 묻기(뒷일 · 쓰기)는 하지 않고 읽기만(표지 셈 결과 shop_cover는 1시간마다 다시 읽음) · 뒷일은 원래 서비스(readnow-cloud)가 맡음(여러 대가 같은 일을 겹쳐 하지 않게) */
  const BG = bg !== false; const SRV = String(process.env.K_SERVICE || 'local').slice(0, 40);
  /* (bookinfo1 11/12) 📖 책 정보 공개 요약 — bk_info/{ISBN}(클라우드 bookinfo.js가 모음) · 10분 기억 · 미리보기는 저장소 주소로 */
  const BKM = new Map(); const BKP = require('./bookinfo.js');
  async function bkInfoOf(isbn) { if (!/^97[89]\d{10}$/.test(String(isbn || ''))) return null; const m = BKM.get(isbn); if (m && Date.now() - m.t < 10 * 60e3) return m.v; let v = null;
    try { const d = await C('bk_info').doc(isbn).get(); const p = d.exists ? BKP.pubOf(d.data()) : null; if (p && (Object.keys(p.t).length || Object.keys(p.b).length || p.pv.length)) v = { t: p.t, b: p.b, pv: p.pv.map((x) => imgOf({ stored: x.s }, false)).filter(Boolean), dimg: p.dimg.filter((u) => /^https:\/\/image\.yes24\.com\//.test(u)) }; } catch (e) { v = null; }
    BKM.set(isbn, { t: Date.now(), v }); if (BKM.size > 800) BKM.delete(BKM.keys().next().value); return v; }
  const fr = (k) => { const b = CAT.books.get(k); const f = b && b.images && b.images.front; return f && typeof f === 'object' ? f : null; }; /* (shelf6) 표지 셈 — 도서 정보의 실제 저장 길(png·gif일 수 있음)·알라딘 원래 주소 */
  const COV = bucket ? require('./shop-cover.js').makeCover({ C, bucket, log, pathOf: (k) => { const f = fr(k); return f && typeof f.stored === 'string' && f.stored.startsWith('img/' + k + '/') ? f.stored : null; }, srcOf: (k) => { const f = fr(k); return f && typeof f.src === 'string' ? f.src : null; } }) : null; /* (shelf4) 📚 앞표지 대표색·글꼴 갈래 — 저장소 그림을 클라우드가 미리 셈 */
  const FONT = require('./shop-font.js').makeFont({ log }); /* (shelf5) 📚 글자만 자른 글꼴 창구 */
  const SPX = require('./shop-spine.js').makeSpine({ C, FV, log }); /* (shelf5) 📚 책등 없는 책에 알라딘 책등 규칙 주소를 물어 채움(공개 그림 HEAD만) */
  const CAT = { bk: new Map(), items: new Map(), books: new Map(), gone: new Map(), sp: new Map(), pv: new Map(), full: 0, delta: 0, busy: null, err: null }; /* (11/11 shopc1) pv = 상품 → 숨은 칸 { sku, cp(분류 경로), k(종류) } — 할인 규칙 고르기에만 · 밖으로 안 나감 */ const SHELF = { key: '', parts: [] }; /* (11/11 shelf1) sp = 상품 → 알라딘 판매지수(밖으로는 순위만) · SHELF = 서가 책장 묶음 기억 */
  const SPN = { m: new Map(), at: 0, v: 0, lv: 0, dirty: new Map(), t: null, busy: null, uq: UQX.makeIndex(), uqKey: '' }; /* (shelf2) 책등 모양 영구 저장 — 10분마다 다시 읽음 · 받은 것은 15초 모아 칸(문서)마다 한 번 씀 */
  const spinesLoad = async () => { if (SPN.at && Date.now() - SPN.at < 600e3) return; if (SPN.busy) return SPN.busy; SPN.busy = (async () => { try { const ss = await C('shop_spines').get(); ss.forEach((d) => { const m = (d.data() || {}).m || {}; for (const k in m) if (typeof m[k] === 'string' && !SPN.dirty.has(k)) SPN.m.set(k, m[k]); }); SPN.v++; SPN.lv++; } catch (e) { log && log('🛍 책등 모양 읽기 실패', e.message); } SPN.at = Date.now(); SPN.busy = null; })(); return SPN.busy; };
  /* (shelf7) 쓰인 조합 장부를 다시 세움(새로 읽었거나 세대가 바뀔 때) — 지금 세대 모양만 · 먼저 등록된 책이 제 모양을 지키고 겹친 뒤 책만 빈 조합으로(고친 것은 저장) */
  const uqSync = (gen) => { const key = SPN.lv + '|' + gen; if (SPN.uqKey === key) return 0; SPN.uqKey = key; const at = (id) => { const it = CAT.items.get(id); return (it && it.at) || '9999'; };
    const L = [...SPN.m].filter(([, code]) => { const m = SPINE_RE.exec(code); return m && +m[1] === gen; }).sort((a, b) => String(at(a[0])).localeCompare(String(at(b[0]))) || String(a[0]).localeCompare(String(b[0])));
    const fix = SPN.uq.rebuild(L); for (const [id, code] of fix) { SPN.m.set(id, code); SPN.dirty.set(id, code); } if (fix.length) { SPN.v++; if (!SPN.t) SPN.t = setTimeout(() => spinesFlush().catch(() => {}), 15e3); log && log('📚 겹친 책등 다시 정함', fix.length); } return fix.length; };
  const spinesFlush = async () => { SPN.t = null; const by = new Map(); for (const [id, code] of SPN.dirty) { const b = spineBucket(id); if (!by.has(b)) by.set(b, {}); by.get(b)[id] = code; } SPN.dirty.clear(); const at = new Date().toISOString();
    for (const [b, m] of by) { try { await C('shop_spines').doc(b).set({ m, at, uploadedAt: FV.serverTimestamp(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { log && log('🛍 책등 모양 쓰기 실패', b, e.message); } } };
  let CFG = { v: null, at: 0 }; let HELD = { v: new Set(), x: new Set(), at: 0 }; const RL = new Map();
  const cfg = async () => { if (CFG.v && Date.now() - CFG.at < 60e3) return CFG.v; try { const d = await C('app_settings').doc('shop').get(); CFG = { v: { ...DEF, ...(d.exists ? d.data() : {}) }, at: Date.now() }; } catch (e) { CFG = { v: CFG.v || { ...DEF }, at: Date.now() - 50e3 }; } return CFG.v; };
  const held = async (force) => { if (!force && Date.now() - HELD.at < 20e3) return HELD.v; try { const ss = await C('shop_holds').where('on', '==', 1).get(); const v = new Set(); const x = new Set(); const now = Date.now(); ss.forEach((d) => { const h = d.data() || {}; if (!holdOn(h, now)) return; (h.sold ? x : v).add(d.id); }); HELD = { v, x, at: now }; } catch (e) { HELD.at = Date.now() - 10e3; } return HELD.v; };
  const soldX = async () => { await held(); return HELD.x || new Set(); }; /* (11/11 shop2) 다른 판매처에서 팔림(🤖 자동 내림이 적음) */
  /* (11/11 shopc1) 🏷 판매가 규칙 — app_settings/shop_promo 1분 기억 · VIEW = 규칙을 얹은 공개 요약(목록이 바뀌거나 규칙이 바뀌거나 1분 지나면 다시 셈 — 기간 시작·끝이 1분 안에 반영) */
  let PROMO = { v: null, at: 0, ver: 0 }; const VIEW = { key: '', m: new Map() };
  const promo = async (force) => { if (!force && PROMO.v && Date.now() - PROMO.at < 60e3) return PROMO.v; try { const d = await C('app_settings').doc('shop_promo').get(); PROMO = { v: BQP.promoOf(d.exists ? d.data() : {}), at: Date.now(), ver: PROMO.ver + 1 }; } catch (e) { PROMO = { v: PROMO.v || BQP.promoOf({}), at: Date.now() - 50e3, ver: PROMO.ver + (PROMO.v ? 0 : 1) }; } return PROMO.v; };
  const vw = async () => { const P = await promo(); const now = Date.now(); const key = [CAT.meta && CAT.meta.at, CAT.items.size, PROMO.ver, Math.floor(now / 60e3)].join('|'); if (VIEW.key === key) return VIEW.m;
    const m = new Map(); for (const [k, x] of CAT.items) m.set(k, BQP.applyOne(x, CAT.pv.get(k), P, now)); VIEW.key = key; VIEW.m = m; return m; };
  /* (shelf5) 서가 뒷일 — 표지 대표색(5분마다 300권 · 책등 없는 책·새 책 먼저) · 책등 규칙 주소(10분마다 40권) · 서가를 부를 때와 1분 시계 둘 다에서(손님이 없어도 돎) */
  const covKick = () => { if (!BG) { return COV ? COV.load().catch(() => {}) : null; } /* 숍 전용: 결과만 읽음(1시간에 한 번 · 서가는 이 읽기를 기다림) */ if (!COV || !CAT.items.size) return; const CV = require('./shop-cover.js'); if (Date.now() - (COV.state().runAt || 0) < CV.TICK_MS) return; COV.tick(CV.order([...CAT.items.values()]), CV.TICK_N).catch(() => {}); };
  const spxKick = async () => { if (!BG || !CAT.items.size) return; const st = SPX.state(); if (Date.now() - (st.runAt || 0) < ((st.auto && st.auto.every) || 600e3)) return; const c = await cfg(); const sc = (c && c.shelf) || {};
    const pl = await SPX.plan(sc); if (!pl.n) { return; } /* (shelf6) 맞춤률이 낮으면 저절로 '천천히'(1시간 10권)·'멈춤'(14일) — 설정 spineRule·spineRuleAuto·spineRuleMin은 그대로 둠 */
    const cand = []; for (const [k, x] of CAT.items) { const id = CAT.bk.get(k); if (id && !x.sp) cand.push({ id, at: x.at }); } return SPX.tick(cand, CAT.books, { n: pl.n }).catch(() => {}); };
  const kickT = setInterval(() => { try { covKick(); spxKick().catch(() => {}); } catch (e) {} }, 60e3); if (kickT.unref) kickT.unref();
  async function booksFor(ids) { const need = [...new Set(ids.filter((x) => x && !CAT.books.has(x)))]; for (let i = 0; i < need.length; i += 200) { const ss = await db.getAll(...need.slice(i, i + 200).map((x) => C('prd_books').doc(String(x)))); const part = need.slice(i, i + 200); let ms = []; try { ms = await db.getAll(...part.map((x) => C('prd_book_metrics').doc(String(x)))); } catch (e) {} const SPM = new Map(); ms.forEach((d) => { if (d.exists) { const v = (d.data() || {}).salesPoint; if (v != null && !isNaN(+v)) SPM.set(d.id, +v); } });
      ss.forEach((d) => CAT.books.set(d.id, d.exists ? slimB({ ...d.data(), ...(SPM.has(d.id) ? { _sp: SPM.get(d.id) } : {}) }) : null)); } }
  const slimB = (b) => ({ title: b.title, author: b.author, contributors: (b.contributors || []).slice(0, 2).map((c) => ({ name: c && c.name })), publisher: b.publisher, pubDate: b.pubDate, categories: (b.categories || []).slice(0, 1), categoryName: b.categoryName || null, images: b.images && (b.images.front || b.images.spine || b.images.back) ? { front: b.images.front || null, spine: b.images.spine || null, back: b.images.back || null } : null, cover: b.cover, priceList: b.priceList, isbn13: b.isbn13, adult: b.adult, pages: b.pages || null, size: b.size || null, sp: b._sp != null ? b._sp : (b.salesPoint != null ? +b.salesPoint || 0 : null) }); /* (11/11 shelf1) 📚 서가 책장 — 책등·뒤표지 그림·쪽수(책 두께)·판매지수(순서만 공개) */
  const put = (id, l) => { const bk0 = l && l.bookId ? CAT.books.get(String(l.bookId)) : null; const it = pubItem(id, l, bk0); const k = String(id); if (it) { CAT.items.set(k, it); if (l.bookId) CAT.bk.set(k, String(l.bookId)); { const cp = s((bk0 && bk0.categories && bk0.categories[0] && (bk0.categories[0].path || bk0.categories[0].name)) || '', 160); const sku = s(l.sku, 40); CAT.pv.set(k, { sku, cp, k: BQP.kindOf(cp, sku) }); } if (bk0 && bk0.sp != null) CAT.sp.set(k, bk0.sp); else CAT.sp.delete(k); CAT.gone.delete(k); } else { const was = CAT.items.get(k); if (was && soldLike(l)) goneAdd(k, was); else if (!soldLike(l)) CAT.gone.delete(k); /* (rel10) 숨긴 재고는 품절 화면 기억에도 안 남김 */ CAT.items.delete(k); CAT.pv.delete(k); CAT.bk.delete(k); } };
  /* ══ (shelf8 · 정범님 11/12) 📖 책 한 권 더 — 서가 '펼친 책' 아래 기본 정보 · 책소개 · 목차 · 앞 몇 쪽 샘플
   *  읽는 곳(그 책 하나만 · 10분 기억): prd_books/{도서}(옮긴이·분류 경로·무게) · ext_basic/{ISBN}(교보·예스24 등 외부 기본 정보 — 무게·옮긴이·소개) · book_info/{ISBN}(일꾼 bookinfo1이 모으는 책소개·목차·출판사 글 — 칸이 오면 저절로 참)
   *  · prd_listings/{상품}.previews(우리 저장소에 받아 둔 알라딘 미리보기 쪽 그림 — 쪽 차례대로) · 공개해도 되는 책 정보만(손님·판매자 정보 없음) */
  const MORE = new Map(); const MORE_MS = 10 * 60e3;
  const txt = (v, n) => { const t = String(v == null ? '' : v).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); return t ? t.slice(0, n) : null; };
  const firstOf = (src, f) => { for (const k of Object.keys(src || {})) { const d = src[k] && src[k].d; const v = d && d[f]; if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) return v; } return null; };
  async function itemMore(id, it) { const k = String(id); const h = MORE.get(k); if (h && Date.now() - h.at < MORE_MS) return h.v; const v = {};
    const bid = CAT.bk.get(k); const isbn = it && it.isbn; const get = (col, doc) => (doc ? C(col).doc(String(doc)).get().then((d) => (d.exists ? d.data() || {} : null), () => null) : Promise.resolve(null));
    const lget = C('prd_listings').doc(k).get ? C('prd_listings').doc(k).get().then((d) => (d.exists ? d.data() || {} : null), () => null) : Promise.resolve(null);
    const [b, x, bi, l] = await Promise.all([get('prd_books', bid), get('ext_basic', isbn), get('book_info', isbn), lget]);
    const xs = (x && x.src) || {}; const bi2 = bi || (b && (b.bookInfo || b.bi)) || {};
    const tr = (b && (b.contributors || []).filter((c) => c && /옮|역/.test(String(c.role || ''))).map((c) => c.name).filter(Boolean).join(', ')) || firstOf(xs, 'translators'); if (tr) v.tr = s(Array.isArray(tr) ? tr.join(', ') : tr, 60);
    const wt = num((b && (b.weightG || b.weight)) || firstOf(xs, 'weightG')); if (wt && wt < 20000) v.wt = wt;
    if (it && it.cp) v.cpk = it.cp; /* (shop2) 종류>분류 경로(목록 거르기 열쇠 · 상세의 분류 길 링크) — 아래 cp는 사람이 읽는 꼴 */ const cp = b && b.categories && b.categories[0] && (b.categories[0].path || b.categories[0].name); if (cp) v.cp = s((Array.isArray(cp) ? cp.join(' > ') : String(cp)).split(/\s*[>,]\s*/).filter((q) => q && !/^(국내도서|외국도서|중고도서)$/.test(q)).join(' › '), 80);
    if (!(it && it.sz)) { const z = szOf(firstOf(xs, 'size')); if (z) v.sz = z; } if (!(it && it.pg)) { const pg = num(firstOf(xs, 'pages')); if (pg) v.pg = pg; }
    const info = { intro: txt(bi2.intro || (b && (b.description || b.intro)) || firstOf(xs, 'desc'), 1600), toc: txt(bi2.toc || (b && b.toc), 2400), pubRev: txt(bi2.pubRev || bi2.pubReview, 1600), auIntro: txt(bi2.auIntro || bi2.authorIntro, 1000), trIntro: txt(bi2.trIntro, 600), pbIntro: txt(bi2.pbIntro, 600) };
    Object.keys(info).forEach((q) => { if (!info[q]) delete info[q]; }); if (Object.keys(info).length) v.info = info;
    const pv = ((l && l.previews) || []).filter((p) => p && p.stored && !p.error).sort((a, z) => (+a.n || 0) - (+z.n || 0)).slice(0, 40).map((p) => IMG_BASE + encodeURIComponent(p.stored) + '?alt=media'); if (pv.length) v.pvs = pv;
    MORE.set(k, { at: Date.now(), v }); if (MORE.size > 400) MORE.delete(MORE.keys().next().value); return v; }
  /* (11/11 shop2) 팔렸거나 내린 책 — '품절' 화면용 요약(공개 요약 그대로 · 30일 · 최대 GONE_MAX) */
  const goneAdd = (k, it) => { CAT.gone.set(k, { ...it, goneAt: new Date().toISOString() }); if (CAT.gone.size > GONE_MAX) { const old = CAT.gone.keys().next().value; CAT.gone.delete(old); } };
  async function build() { if (CAT.busy) return CAT.busy; CAT.busy = (async () => { try { const c = await cfg(); const now = Date.now(); const full = !CAT.full || now - CAT.full > (c.fullH || DEF.fullH) * 3600e3;
      if (!full && now - CAT.delta < (c.deltaMin || DEF.deltaMin) * 60e3) return;
      const F = ['status', 'active', 'qty', 'price', 'grade', 'sku', 'adult', 'title', 'isbn13', 'bookId', 'photos', 'registeredAt', 'firstSeenAt', 'priceList', 'author', 'publisher', 'previewsStatus']; /* (shelf8) 샘플 있음 표시만(쪽 그림 목록은 /shop/item이 그 책만 읽음) */
      let ss; const since = new Date((full ? now : CAT.delta) - 5 * 60e3); /* 5분 겹쳐 읽음(쓰기 시각 어긋남) */
      if (full) ss = await C('prd_listings').where('status', '==', '판매중').select(...F).get(); else ss = await C('prd_listings').where('uploadedAt', '>', since).select(...F).get();
      const docs = []; ss.forEach((d) => docs.push([d.id, d.data() || {}])); if (full && SPX.wait.size) { for (const id of SPX.wait) CAT.books.delete(id); } /* (shelf5) 책등 규칙 주소를 찾은 도서 — 수집기가 우리 저장소에 받아 둔 뒤의 그림 길을 다시 읽음 */ await booksFor(docs.map(([, l]) => l.bookId && String(l.bookId)).filter(Boolean));
      if (full) { /* (auditfix 11/13 B3) 전체 다시 세우기에서 사라진 상품은 팔렸는지 모름(지워짐·판매중지·보류를 바뀐 것 읽기가 놓친 것일 수 있음) → 품절 기억에 넣지 않음 · /b/ 방문 때 처음 보는 상품 길(MISS)이 prd_listings를 한 번 보고 팔린 것(soldLike)만 품절 화면 */ CAT.items.clear(); CAT.pv.clear(); } for (const [id, l] of docs) put(id, l); if (full) { CAT.full = now; for (const id of [...SPX.wait]) { const b = CAT.books.get(id); if (b && b.images && b.images.spine && b.images.spine.stored) SPX.wait.delete(id); } } CAT.delta = now; CAT.err = null;
      const cats = {}; for (const x of CAT.items.values()) if (x.c) cats[x.c] = (cats[x.c] || 0) + 1;
      CAT.meta = { n: CAT.items.size, at: new Date(now).toISOString(), cats: Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 30), ...catTree(CAT.items.values()) };
      C('app_settings').doc('shop_pub').set({ n: CAT.items.size, at: CAT.meta.at, full: new Date(CAT.full).toISOString(), read: docs.length, cats: CAT.meta.cats.slice(0, 12).map(([k, n]) => k + ' ' + n) }, { merge: true }).catch(() => {});
      log && log(`🛍 우리숍 목록 ${full ? '전체' : '바뀐 것'} ${docs.length}줄 읽음 → 판매 ${CAT.items.size}권`); } catch (e) { CAT.err = e.message; log && log('🛍 우리숍 목록 실패', e.message); } finally { CAT.busy = null; } })(); return CAT.busy; }
  const ready = async () => { const p = build(); if (!CAT.full) await p; }; /* 처음만 기다림 · 그 뒤엔 뒤에서 새로 고침 */
  const ipKey = (req) => crypto.createHash('sha256').update('bq-ip|' + String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()).digest('hex').slice(0, 16);
  /* (shelf6) 막혔으면 다시 해도 되는 때까지 남은 ms(> 0) · 안 막혔으면 0 — 429 응답의 Retry-After에 씀 */
  const limitWait = (k, n, ms) => { const now = Date.now(); const a = (RL.get(k) || []).filter((t) => now - t < ms); if (a.length >= n) { RL.set(k, a); return Math.max(1000, ms - (now - a[0])); } a.push(now); RL.set(k, a); if (RL.size > 5000) RL.clear(); return 0; };
  const limited = (k, n, ms) => limitWait(k, n, ms) > 0;

  async function order(req, body) {
    const c = await cfg(); if (!c.open) return [403, { ok: false, err: '아직 주문을 받지 않습니다 — 곧 문을 엽니다' }];
    const ik = ipKey(req); if (limited('o' + ik, 5, 3600e3)) return [429, { ok: false, err: '잠시 뒤 다시 해 주세요(짧은 시간에 주문이 많음)' }];
    const chk = checkOrder(body, c); if (!chk.ok) return [400, chk]; const v = chk.v;
    const au = await ACCT.authOf(req).catch(() => null); if (au && au.u.test) return [403, { ok: false, err: '🧪 시험 계정은 실제 주문을 넣지 않습니다(매출·재고에 섞이지 않게) — 둘러보기·리뷰·마이페이지만 써 보세요' }]; /* (11/12 shop9) 로그인한 손님 주문은 계정에 이어 둠(마이페이지·구매 인증) */
    const refs = v.ids.map((id) => C('prd_listings').doc(id)); const now = Date.now(); const no = orderNo(now); const tok = crypto.randomBytes(16).toString('hex');
    const pc = pubCfg(c, null); const due = new Date(now + pc.payDays * 864e5).toISOString();
    const P = await promo(); if (v.cp) { const f = BQP.couponFind(P, v.cp, now); if (f.why) return [400, { ok: false, err: f.why, cp: 1 }]; } /* (11/11 shopc1) 쿠폰 번호가 틀리면 주문 전에 알림 */
    let out = null;
    await db.runTransaction(async (tx) => { out = null;
      const ls = await tx.getAll(...refs); const hs = await tx.getAll(...v.ids.map((id) => C('shop_holds').doc(id)));
      const bad = []; const lines = [];
      ls.forEach((d, i) => { const l = d.exists ? d.data() : null; const b = l && l.bookId ? CAT.books.get(String(l.bookId)) : null; const it = pubItem(v.ids[i], l, b); const h = hs[i].exists ? hs[i].data() : null;
        if (!it) return bad.push({ id: v.ids[i], why: '방금 팔렸거나 판매를 멈춘 책' }); if (holdOn(h, now)) return bad.push({ id: v.ids[i], t: it.t, why: h.sold ? '방금 다른 곳에서 팔린 책' : '다른 분이 먼저 주문한 책' });
        const pv0 = CAT.pv.get(v.ids[i]) || {}; const sku = s(l.sku, 40); const ap = BQP.applyOne(it, { sku, cp: pv0.cp || '', k: BQP.kindOf(pv0.cp, sku) }, P, now); /* (shopc1) 손님 화면과 같은 규칙으로 값을 다시 셈 */
        const want = (v.qty && v.qty[v.ids[i]]) || 1; const have = Math.max(1, Math.round(+l.qty || 1)); const MU = multiOf(c); if (want > 1 && !MU.on) return bad.push({ id: v.ids[i], t: it.t, why: '같은 책은 한 권씩만 주문할 수 있습니다' }); if (want > have) return bad.push({ id: v.ids[i], t: it.t, why: `남은 수량이 ${have}권입니다` }); if (want > MU.mx) return bad.push({ id: v.ids[i], t: it.t, why: `같은 책은 한 번에 ${MU.mx}권까지` });
        const ln = { lid: v.ids[i], t: it.t, g: it.g, p: ap.p, lp: it.lp, isbn: it.isbn, im: it.im, sku: sku || null, qty: 1, ...(ap.p0 ? { p0: ap.p0, rid: ap.rid } : {}) }; lines.push(ln); for (let k = 1; k < want; k++) lines.push({ ...ln, cpy: k + 1 }); }); /* (shopux1) cpy = 같은 책 몇째 권(둘째부터) */
      if (bad.length) { out = [409, { ok: false, err: '주문할 수 없는 책이 있습니다', bad }]; return; }
      const q = BQP.quote(lines.map((x) => ({ id: x.lid, p: x.p })), P, pc, v.cp, now); if (v.cp && q.cpErr) { out = [400, { ok: false, err: q.cpErr, cp: 1 }]; return; }
      lines.forEach((x, i) => { if (q.lines[i].p !== x.p) { x.pp = x.p; x.p = q.lines[i].p; } }); /* 묶음 할인·쿠폰은 책마다 나눠 깎음(pp = 깎기 전 우리숍 판매가) — 책값 합 = 낸 책값 */
      const sum = q.sum; const fee = q.fee; const total = q.total;
      if (v.expect != null && v.expect !== total) { out = [409, { ok: false, err: '그사이 값이 바뀌었습니다(할인 기간이 끝났거나 새로 시작) — 바뀐 값을 확인하고 다시 주문해 주세요', price: { items: lines.map((x) => ({ id: x.lid, p: x.pp || x.p })), sum, fee, total, disc: q.disc } }]; return; }
      const ref = C('shop_orders').doc(no);
      tx.set(ref, { no, ch: 'shop', st: 'new', at: new Date(now).toISOString(), due, items: lines, sum, shipFee: fee, total, ...(q.disc ? { sum0: q.sum0, disc: { total: q.disc, bundle: q.bundle || 0, coupon: q.coupon || null } } : {}), pay: { how: pc.pay.how, ...(pc.pay.how === 'bank' ? { bank: pc.pay.bank, acct: pc.pay.acct, holder: pc.pay.holder } : {}) }, depositor: v.depositor,
        ...(au ? { uid: au.uid } : {}), buyer: v.buyer, rcv: v.rcv, agree: { privacy: new Date(now).toISOString(), terms: new Date(now).toISOString(), ver: '2026-11-11' }, tokH: hashTok(tok), ipk: ik, ua: s(req.headers['user-agent'], 120),
        hist: [{ at: new Date(now).toISOString(), by: '손님', what: `주문 접수 ${lines.length}권 · ${total}원` }], uploadedAt: FV.serverTimestamp(), writer: 'cloud-shop' });
      for (const x of lines) { if (x.cpy) continue; tx.set(C('shop_holds').doc(x.lid), { on: 1, no, at: new Date(now).toISOString(), t: x.t, uploadedAt: FV.serverTimestamp() }); } /* (shopux1) 같은 책 둘째 권부터는 같은 잡아 둠 — 한 번만 씀 */
      out = [200, { ok: true, no, t: tok, total, sum, shipFee: fee, due, pay: pc.pay, disc: q.disc || 0, items: lines.map((x) => ({ id: x.lid, t: x.t, g: x.g, p: x.p })) }]; });
    if (au && out && out[0] === 200) await ACCT.addOrder(au.uid, { no, t: out[1].t, at: new Date(now).toISOString(), total: out[1].total, n: out[1].items.length }).catch((e) => log && log('👤 주문을 계정에 잇지 못함', no, e.message));
    HELD.at = 0; if (out && out[0] === 200) log && log(`🛍 우리숍 주문 접수 ${no} · ${out[1].items.length}권`); return out || [500, { ok: false, err: '주문을 저장하지 못했습니다 — 잠시 뒤 다시' }];
  }
  async function lookup(no, tok) { no = s(no, 30); if (!/^BQ\d{8}-[A-Z0-9]{5}$/.test(no) || !/^[0-9a-f]{32}$/.test(String(tok || ''))) return null; const d = await C('shop_orders').doc(no).get(); if (!d.exists) return null; const o = d.data() || {};
    const a = Buffer.from(String(o.tokH || '')), b = Buffer.from(hashTok(tok)); if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null; return { ref: d.ref, o }; }
  const ST = { new: '주문 접수 — 입금을 기다립니다', paid: '입금 확인 — 포장 준비 중', ship: '출고 준비 중', sent: '보냈습니다', done: '끝', cancel: '취소됨' };
  const ACCT = require('./shop-acct.js').makeAcct({ db, C, FV, log, bucket, ready: () => ready(), vw: () => vw(), held: () => held(), soldX: () => soldX(), ipKey: (r) => ipKey(r), limitWait: (k, n, ms) => limitWait(k, n, ms), view: (o) => view(o) }); /* (11/12 shop9) 👤⭐ */
  const ANL = ANLX.makeAnl({ db, C, FV, log, srv: SRV, authOf: (r) => ACCT.authOf(r), cfg: () => cfg(), ready: () => ready(), vw: () => vw(), held: () => held(), soldX: () => soldX(), view: (o) => view(o), acctLib: require('./shop-acct.js') }); /* (11/13 shopadm1) 📊 */
  const rvTag = (L, V) => (L || []).map((x) => { const y = V && V.get(x.id); const v = ACCT.ratingOf(y || x); return v ? { ...x, rv: v } : x; }); /* (shop9 2회) ⭐ 카드 별점 [평균, 수] */
  const view = (o) => ({ ok: true, no: o.no, at: o.at, st: o.st, stTxt: ST[o.st] || o.st, due: o.due, total: o.total, sum: o.sum, shipFee: o.shipFee, disc: (o.disc && o.disc.total) || 0, pay: o.st === 'new' ? o.pay : { how: (o.pay || {}).how }, name: maskName(o.buyer && o.buyer.name), dep: maskName(o.depositor),
    items: (o.items || []).map((x) => ({ id: x.lid, t: x.t, g: x.g, p: x.p })), inv: o.inv && o.inv.no ? { courier: o.inv.courier || null, no: o.inv.no } : null, cxl: o.st === 'cancel' ? (o.cxl || {}).why || null : null });

  /* (11/11 shop2) 책 한 권 HTML — 판매중·주문 중은 목록 요약 · 팔린 책은 기억(CAT.gone) → 없으면 상품 문서를 한 번 봄(같은 번호는 10분 기억) */
  const MISS = new Map();
  async function seoPage(res, id) { const html = (code, body, cache) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache || 'public, max-age=300, s-maxage=600' }); res.end(body); return true; };
    const nf = () => html(404, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>없는 책 | 북스퀸</title><link rel="stylesheet" href="/shop.css?v=0.1.3"></head><body><main class="wrap"><h1>찾는 책이 없습니다</h1><p><a class="btn" href="/#/">책 둘러보기</a></p></main></body></html>`, 'public, max-age=120');
    if (!/^[\w.-]{1,80}$/.test(id)) return nf(); await ready(); const c = await cfg(); const H = await held(); const X = await soldX(); const V = await vw(); /* (shopc1) 값은 규칙을 얹은 우리숍 판매가 */
    const same = (it) => (it.isbn ? [...V.values()].filter((x) => x.isbn === it.isbn && x.id !== it.id && !X.has(x.id) && !H.has(x.id)) : []);
    let it = V.get(id); let st = it ? (X.has(id) ? 'x' : H.has(id) ? 'o' : 's') : null;
    if (!it && CAT.gone.has(id)) { it = CAT.gone.get(id); st = 'x'; }
    if (!it) { const m = MISS.get(id); if (m && Date.now() - m < 600e3) return nf(); if (limited('seo-miss', 300, 60e3)) return nf();
      try { const d = await C('prd_listings').doc(id).get(); const l = d.exists ? d.data() || {} : null; const pub = l && soldLike(l) && pubItem(id, { ...l, status: '판매중', active: true, qty: 1 }, null); /* (rel10) 팔린 책만 — 숨긴 재고는 404 */ /* 미끼·19금·값 없음은 품절 화면도 안 만듦 */
        if (!pub) { MISS.set(id, Date.now()); if (MISS.size > 5000) MISS.clear(); return nf(); } it = { ...pub, ph: [] }; st = 'x'; goneAdd(id, it); } catch (e) { return nf(); } }
    const rv = await ACCT.seoRv(it); /* (shop9 2회) 공개 리뷰 별점 */
    return html(200, bookPage(it, { st, cfg: c, same: same(it), rv }), st === 'x' ? 'public, max-age=3600, s-maxage=86400' : undefined); }

  /* HTTP — 처리했으면 true */
  async function handle(req, res, path) {
    if (/^\/b\/[^/]+$/.test(path) || /^\/sitemap(-\d+)?\.xml$/.test(path)) path = '/shop' + path; /* (11/11 shop2) Hosting이 넘긴 검색 주소 */
    if (!/^\/shop\//.test(path)) return false;
    const origin = req.headers.origin || ''; const extra = String(process.env.SHOP_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
    if ([...SHOP_ORIGINS, ...extra].includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Expose-Headers', 'Retry-After, ETag'); res.setHeader('Access-Control-Max-Age', '600'); } /* (shelf6) 손님 화면이 Retry-After를 읽어 기다렸다 다시 · 미리 묻기(OPTIONS)는 10분 기억 */
    try { res.setHeader('X-RN-Srv', SRV); } catch (e) {} /* (11/12 shopsrv) 어느 서비스가 답했는지(readnow-shop · readnow-cloud) — 응답 머리로 확인 */
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
    const send = (code, obj, cache, extraH) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store', 'X-Robots-Tag': 'noindex', ...(extraH || {}) }); res.end(JSON.stringify(obj)); return true; };
    /* (shelf6) 막힘 응답 — 출처(CORS) 머리는 위에서 이미 붙음 · Retry-After(초)로 언제 다시 할지 알려 줌 */
    const busy = (ms, err) => send(429, { ok: false, err: err || '잠시 뒤 다시 해 주세요', retry: Math.ceil(ms / 1000) }, 'no-store', { 'Retry-After': String(Math.min(600, Math.ceil(ms / 1000))) });
    const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    try {
      /* (shelf6) 제한 갈래 — 서가 자료(/shop/shelf)·글꼴(/shop/font)은 따로 넉넉히(같은 주소를 쓰는 회사·학교 손님 여럿이 한꺼번에 서가를 열어도) · 나머지는 IP당 1분 240번 그대로 */
      { const ik = ipKey(req); const w = path === '/shop/shelf' ? limitWait('sh' + ik, SHELF_RL[0], SHELF_RL[1]) : path === '/shop/font' ? 0 : limitWait('r' + ik, 240, 60e3); if (w) return busy(w); }
      if (path === '/shop/ping') return send(200, { ok: true, srv: SRV, bg: BG ? 1 : 0, n: CAT.items.size, at: new Date().toISOString() }); /* (11/12 shopsrv) 손님 화면이 숍 전용 서비스가 살아 있는지 먼저 봄(목록을 만들지 않음 · 가벼움) */
      if (path.startsWith('/shop/b/') && req.method === 'GET') return await seoPage(res, decodeURIComponent(path.slice(8)).slice(0, 80));
      { const m = /^\/shop\/sitemap(?:-(\d+))?\.xml$/.exec(path); if (m) { await ready(); const X = await soldX(); const H = await held(); const xml = sitemapXml([...CAT.items.values()].filter((x) => !X.has(x.id) && !H.has(x.id)), { n: m[1] ? +m[1] : 0 }); if (!xml) return send(404, { ok: false, err: '없는 쪽' });
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800, s-maxage=3600' }); res.end(xml); return true; } }
      if (path === '/shop/cfg') { await ready(); return send(200, { ok: true, ...pubCfg(await cfg(), CAT.meta, await promo()), err: CAT.err && !CAT.items.size ? '목록 준비 중' : null }, 'public, max-age=60, s-maxage=60'); }
      if (path === '/shop/cats') { await ready(); return send(200, { ok: true, at: CAT.meta && CAT.meta.at, n: CAT.meta ? CAT.meta.n : 0, kinds: (CAT.meta && CAT.meta.kinds) || [], tree: (CAT.meta && CAT.meta.tree) || [] }, 'public, max-age=300, s-maxage=300'); } /* (shop2) 🗂 분류 나무(상품 있는 칸만) */
      if (path === '/shop/list') { await ready(); const H = await held(); const V0 = await vw(); const r = listItems([...V0.values()], q, H, await soldX()); r.items = rvTag(r.items, V0); return send(200, { ok: true, ...r, at: CAT.meta && CAT.meta.at }, 'public, max-age=30, s-maxage=30'); }
      if (path === '/shop/shelf') { await ready(); const H = await held(); const X = await soldX(); const V = await vw(); await spinesLoad(); try { const c0 = await cfg(); uqSync(Math.max(0, Math.round(+((c0.shelf || {}).lookGen) || 0))); } catch (e) {} if (SPN.kv !== SPN.v && !(Date.now() - (SPN.kvAt || 0) < 60e3)) { SPN.kv = SPN.v; SPN.kvAt = Date.now(); } /* 새 모양은 1분에 한 번만 묶음에 다시 넣음(gzip 다시 만들기 줄임) · (shopc1) 값 = 우리숍 판매가(규칙 얹음) */ await covKick(); spxKick().catch(() => {}); const key = [CAT.meta && CAT.meta.at, HELD.at, CAT.items.size, SPN.kv, VIEW.key, COV ? Math.floor((COV.state().runAt || 0) / 600e3) : 0, Math.floor(Date.now() / 600e3) /* (shelf8) 별점 요약이 10분마다 바뀜 */].join('|'); /* 표지 셈은 5분마다 300권씩(뒤에서 · 묶음은 10분에 한 번만 다시 만듦) */
        if (SHELF.key !== key) { SHELF.parts = shelfParts(shelfRows([...V.values()], H, X, CAT.sp, SPN.m, COV && COV.cvOf, (x) => { try { return ACCT.ratingOf(x); } catch (e) { return null; } })); SHELF.key = key; SHELF.gz = new Map(); }
        const [k, k2] = shelfK(q.k, SHELF.parts.length); const gk = k + '-' + k2; /* (shelf6) 나머지 묶음을 한 번에(k=1-) — 손님 한 명 요청 5번 → 2번 */
        const etag = '"' + crypto.createHash('sha1').update(SHELF.key + '|' + gk).digest('hex').slice(0, 20) + '"'; /* (shelf6) 같은 자료면 브라우저·CDN이 304로(본문 안 보냄) */
        const hd = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120', 'X-Robots-Tag': 'noindex', Vary: origin ? 'Accept-Encoding, Origin' : 'Accept-Encoding', ETag: etag }; /* s-maxage — booksqueen.com 같은 주소(Hosting 넘김)로 부르면 Firebase CDN이 1분 동안 대신 답함(클라우드에 안 옴) */
        if (String(req.headers['if-none-match'] || '').split(/\s*,\s*/).some((t) => t.replace(/^W\//, '') === etag)) { res.writeHead(304, hd); res.end(); return true; }
        const rows = k === k2 ? (SHELF.parts[k] || { rows: [] }).rows : SHELF.parts.slice(k, k2 + 1).reduce((a, x) => a.concat(x.rows), []);
        const body = JSON.stringify({ ok: true, v: 1, n: SHELF.parts.reduce((a, x) => a + x.rows.length, 0), k, k2, kn: SHELF.parts.length, at: CAT.meta && CAT.meta.at, pre: SHELF_PRE, cols: SHELF_COLS, rows });
        const gz = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
        if (gz) { let z = SHELF.gz.get(gk); if (!z) { z = zlib.gzipSync(body, { level: 6 }); SHELF.gz.set(gk, z); } res.writeHead(200, { ...hd, 'Content-Encoding': 'gzip' }); res.end(z); } else { res.writeHead(200, hd); res.end(body); } return true; }
      if (path === '/shop/check') { /* (shelf2 · 원칙 56) 장바구니 살펴보기 — 담은 책이 아직 판매중인지·값이 바뀌었는지(최대 50권 · 손님 정보 없음) */ await ready(); const H = await held(); const X = await soldX(); const V = await vw(); const ids = [...new Set(String(q.ids || '').split(',').map((x) => s(x, 80)).filter(Boolean))].slice(0, 50); const st = {}, p = {};
        for (const id of ids) { const it = V.get(id); st[id] = !it || X.has(id) ? 'x' : H.has(id) ? 'o' : 's'; if (it) p[id] = it.p; } return send(200, { ok: true, st, p }); }
      if (path === '/shop/item') { await ready(); const H = await held(); const X = await soldX(); const V = await vw(); const it0 = V.get(s(q.id, 80)); const it = it0 && !X.has(it0.id) ? it0 : null; if (!it) return send(404, { ok: false, err: '판매가 끝났거나 없는 책입니다' });
        const same = it.isbn ? [...V.values()].filter((x) => x.isbn === it.isbn && x.id !== it.id && !X.has(x.id)).slice(0, 6).map((x) => ({ id: x.id, g: x.g, p: x.p, st: H.has(x.id) ? 'o' : 's' })) : [];
        const [info, more0] = await Promise.all([bkInfoOf(it.isbn).catch(() => null), itemMore(it.id, it).catch(() => ({}))]); /* (bookinfo1 11/12) 📖 bk_info 공개 요약 · (shelf8) 서가 펼친 책 칸(옮긴이·무게·분류 경로·책소개·목차·샘플 쪽) */
        const more = { ...more0 }; if (info) { const T = info.t || {}, Bb = info.b || {}; const I = { ...(more.info || {}) }; for (const [f, k, n] of [['intro', 'intro', 1600], ['toc', 'toc', 2400], ['pubRev', 'pubrev', 1600], ['auIntro', 'auth', 1000], ['trIntro', 'trans', 600], ['pbIntro', 'pubintro', 600]]) { const v = txt(T[k], n); if (v) I[f] = v; } if (Object.keys(I).length) more.info = I;
          if (!more.tr && Bb.translators) more.tr = s(Array.isArray(Bb.translators) ? Bb.translators.join(', ') : Bb.translators, 60); if (!more.wt && num(Bb.weightG)) more.wt = num(Bb.weightG); if (!it.sz && !more.sz && szOf(Bb.size)) more.sz = szOf(Bb.size); if (!more.pvs && info.pv && info.pv.length) more.pvs = info.pv.slice(0, 40); } /* bk_info가 먼저 · 없으면 prd_books·ext_basic */
        return send(200, { ok: true, item: { ...it, ...more, ...(() => { try { const v = ACCT.ratingOf(it); return v ? { rv: v } : {}; } catch (e) { return {}; } })(), st: H.has(it.id) ? 'o' : 's' }, same, rel: rvTag(relItems(it, [...V.values()], H, X), V), info }, 'public, max-age=30'); }
      if (path === '/shop/suggest') { await ready(); return send(200, { ok: true, ...suggest([...(await vw()).values()], q.q, await soldX()) }, 'public, max-age=120'); } /* (11/11 shopc1) 🔎 찾기 자동완성 */
      if (path === '/shop/quote' && req.method === 'POST') { await ready(); const b = await readBody(req); const c = await cfg(); const pc = pubCfg(c, null); const P = await promo(); const V = await vw(); const H = await held(); const X = await soldX(); /* (11/11 shopc1) 🧮 장바구니 값(묶음 할인·쿠폰·배송비) — 잡아 두지 않음 · 주문 때 다시 셈 */
        const ids = [...new Set((Array.isArray(b.items) ? b.items : []).map((x) => s(x, 80)).filter(Boolean))].slice(0, pc.maxItems); const bad = []; const L = [];
        for (const id of ids) { const x = V.get(id); if (!x || X.has(id)) bad.push({ id, why: '방금 팔렸거나 판매를 멈춘 책' }); else if (H.has(id)) bad.push({ id, t: x.t, why: '다른 분이 먼저 주문한 책' }); else L.push({ id, p: x.p, p0: x.p0 || null, t: x.t }); }
        { const MU = multiOf(c); const qm = b.qty && typeof b.qty === 'object' && !Array.isArray(b.qty) ? b.qty : null; if (qm && MU.on) { const L2 = []; for (const x of L) { const vx = V.get(x.id) || {}; const n = Math.max(1, Math.min(Math.round(+qm[x.id]) || 1, MU.mx, Math.max(1, +vx.q || 1))); for (let k = 0; k < n; k++) L2.push(x); } L.length = 0; L.push(...L2.slice(0, pc.maxItems)); } } /* (shopux1) 같은 책 n권 — 견적도 권마다 */
        const r = BQP.quote(L, P, pc, s(b.cp, 30), Date.now()); return send(200, { ok: true, ...r, items: L.filter((x, i, A) => A.findIndex((y) => y.id === x.id) === i).map((x) => ({ id: x.id, p: x.p, p0: x.p0 })), bad }); }
      if (path === '/shop/font') { /* (shelf5) 📚 쓰인 글자만 자른 글꼴(woff2) — 공개 글꼴이라 어느 곳에서 불러도 됨(리드나우2 꾸밈 블록 포함) · 같은 글자 묶음은 1년 캐시 */ { const w = limitWait('ft' + ipKey(req), 1200, 600e3); if (w) return busy(w, '잠시 뒤 다시'); }
        try { const b = await FONT.get(s(q.f, 40), String(q.t || '').slice(0, 2000)); res.writeHead(200, { 'Content-Type': 'font/woff2', 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex', 'Cross-Origin-Resource-Policy': 'cross-origin' }); res.end(b); return true; }
        catch (e) { return send(e.code === 404 ? 404 : e.code === 400 ? 400 : 502, { ok: false, err: e.code ? e.message : '글꼴을 잠시 못 만듦' }); } }
      if (path === '/shop/spines' && req.method === 'POST') { { const w = limitWait('sp' + ipKey(req), 40, 600e3); if (w) return busy(w, '잠시 뒤 다시'); } const body = await readBody(req); await ready(); await spinesLoad(); const c = await cfg(); const gen = Math.max(0, Math.round(+((c.shelf || {}).lookGen) || 0));
        uqSync(gen); const fix = []; const take = spineTake(body.L, SPN.m, (id) => CAT.items.has(id), gen); for (const [id, code0] of take) { const r = SPN.uq.claim(id, code0); const code = r.code; if (r.fixed) fix.push([id, code]); SPN.m.set(id, code); SPN.dirty.set(id, code); } if (take.length) { SPN.v++; if (!SPN.t) SPN.t = setTimeout(() => spinesFlush().catch(() => {}), 15e3); } return send(200, { ok: true, n: take.length, gen, fix }); } /* (shelf7) 이미 다른 책이 쓴 조합이면 고친 모양을 돌려줌(손님 화면이 바로 바꿈) */
      { const r = await ANL.handle(req, res, path, q, send, readBody, ipKey); if (r) return r; } /* (11/13 shopadm1) 📊 /shop/t 방문 셈 · 💬 /shop/ask · 👀 /shop/pv */
      { const r = await ACCT.handle(req, res, path, q, send, readBody); if (r) return r; } /* (11/12 shop9) 👤 손님 계정·⭐ 리뷰·서재(cloud/shop-acct.js) */
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
  /* (11/11 shopc1) 👀 관리 웹앱 🏷 할인·배지 미리 보기 — 지금 판매중 우리숍 상품 전부에 규칙을 얹어 봄(쓰기 없음) · index.js /shop-promo(관리자 로그인만) */
  async function promoPreview(b) { b = b || {}; await ready(); const P = await promo(true); const items = [...CAT.items.values()]; const kinds = {}; for (const x of items) { const k = (CAT.pv.get(x.id) || {}).k || 'etc'; kinds[k] = (kinds[k] || 0) + 1; }
    const live = P.rules.filter((r) => BQP.ruleSt(r) === 'on').length; if (!b.rule) return { n: items.length, kinds, live, at: CAT.meta && CAT.meta.at };
    return { ...BQP.preview(items, (id) => CAT.pv.get(id), P, b.rule, Date.now()), kinds0: kinds, live, at: CAT.meta && CAT.meta.at }; }
  return { BG, SRV, handle, build, check, promoPreview, acctAdmin: (b, who) => ACCT.admin(b, who), anlAdmin: (b, who) => ANL.admin(b, who), anlFlush: () => ANL.flush(), _anl: ANL, _acct: ACCT, _cat: CAT, _spn: SPN, spinesFlush, _cov: COV, _spx: SPX, jobs: () => ({ font: FONT.state(), cover: COV ? COV.state() : null, spine: SPX.state(), uniq: { ...SPN.uq.state(), space: UQX.space().N }, items: CAT.items.size, noSpine: [...CAT.items.values()].filter((x) => !x.sp).length }) };
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

module.exports = { multiOf, KINDS, kindPath, catTree, soldLike, shelfK, SHELF_RL, relItems, suggest, selfCheck, chkWhy, makeShop, shelfPub, shelfRows, shelfParts, spineTake, spineBucket, SPINE_RE, szOf, SHELF_COLS, SHELF_PRE, SHELF_PART, pubItem, listItems, kstDay, checkOrder, bookPage, bookLd, sitemapXml, holdOn, BASE, SITEMAP_MAX, shipFeeOf, pubCfg, maskName, orderNo, hashTok, DEF, SHOP_ORIGINS, PAGE };
