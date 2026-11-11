/* col2-nv.js — 🟩 네이버 스마트스토어 커머스API 어댑터 (정범님 11/11 결정 (나): 고정 IP 로거 PC의 번외가 부름 · 약속 0의 정범님 예외 — 네이버 일만)
 * 원문(받은 날 11/11 · 문서 2.91.0): readnow-chats reports/NAVER_1111/RAW_GUIDE.md · RAW_API.md · 설계 DESIGN.md
 * 길: 웹앱(아무 기기) ⚙ 🟩 칸 → 애플리케이션 ID·시크릿을 그 자리에서 로거 공개 열쇠(RSA-OAEP 3072 + AES-GCM 256)로 잠가 Firestore col2_naver_cmd에 암호문만
 *     → 로거 PC 웹앱(대신 쓰기)이 이 도우미 POST /nv/cmd 로 넘김 → 여기서만 풀고 곧바로 토큰 받기로 연결 시험 → 맞으면 그 PC Windows DPAPI 잠근 파일(<HOME>/cred/naver.dat)에만
 *     → 주문 변경(10분)·상품 목록(6시간)을 읽어 줄에 쌓음 → 로거 웹앱이 POST /nv/feed 로 받아 crm_naver_orders·nv_listings·col2_naver(상태)에 씀
 * 지킴: ① 로거 PC만(NAVER.pc) — 다른 PC는 칸도 저장도 없음 ② 시크릿·토큰·전자서명은 메모리·DPAPI 파일에만(답·상태·기록·Firestore·화면 어디에도 없음 — 아이디도 끝 4자만)
 *       ③ 실제 쓰기(발주 확인·발송·판매 상태·등록)는 write 켬일 때만(기본 끔 · 켜기는 연결 시험이 맞은 뒤) · 같은 할 일 두 번 안 함(nv-jdone.json) · 같은 송장번호를 다른 주문에 두 번 안 씀(nv-inv.json · 약속 10)
 *       ④ 요청 사이 최소 간격(minGapMs) · 429면 쉼(두 배씩 · 최대 10분) · 401 GW.AUTHN이면 토큰 한 번 다시 받고 한 번 더(원문 docs/auth 권장 fallback)
 *       ⑤ 알라딘·예스24 주소는 부르지 않음(base만) · 손님 이름·주소는 기록에 남기지 않음(주문 줄 안에만 · 출고에 필요한 받는 분 칸만) */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const http = require('http'), net = require('net'), tls = require('tls'), dns = require('dns'); /* (naver4) 와이파이 주소에 묶은 요청 — fetch 대신 */
const { nvSign } = require('./col2-bcrypt.js'); const { PS } = require('./col2-cred.js');

/* ── 순수 셈(시험이 바로 부름) ── */
const pad = (n, w) => String(n).padStart(w || 2, '0');
/* 원문 restful-api: 날짜 시간은 yyyy-MM-dd'T'HH:mm:ss.SSS+09:00 */
function kstIso(ms) { const d = new Date(+ms + 9 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}+09:00`; }
const num = (v) => (v == null || v === '' || isNaN(+v) ? 0 : +v);
/* 상품 주문 상세(POST /v1/pay-order/seller/product-orders/query 의 data[] 한 줄) → 우리 주문 줄 — 주문자 이름·연락처는 옮기지 않음(받는 분만 · 출고용) */
function nvOrd(x) { const o = (x && x.order) || {}, p = (x && x.productOrder) || {}, d = (x && x.delivery) || {}, a = p.shippingAddress || {};
  const fee = num(p.paymentCommission) + num(p.saleCommission) + num(p.channelCommission) + num(p.knowledgeShoppingSellingInterlockCommission);
  const st = String(p.productOrderStatus || ''); const cl = String(p.claimType || ''); const cs = String(p.claimStatus || '');
  return { id: String(p.productOrderId || ''), orderId: String(o.orderId || ''), at: o.orderDate || o.paymentDate || null, payAt: o.paymentDate || null, st, claim: cl || null, claimSt: cs || null, place: p.placeOrderStatus || null,
    cancel: st === 'CANCELED' || st === 'CANCELED_BY_NOPAYMENT' || (cl === 'CANCEL' && /DONE/.test(cs)), ret: st === 'RETURNED' || (cl === 'RETURN' && /DONE/.test(cs)),
    name: String(p.productName || '').slice(0, 200), opt: p.productOption ? String(p.productOption).slice(0, 120) : null, qty: num(p.remainQuantity != null ? p.remainQuantity : p.quantity) || num(p.quantity) || 1,
    unit: num(p.unitPrice), amt: num(p.totalPaymentAmount), fee, settle: p.expectedSettlementAmount != null ? num(p.expectedSettlementAmount) : null, dlvFee: num(p.deliveryFeeAmount),
    sku: p.sellerProductCode ? String(p.sellerProductCode) : null, chNo: p.productId ? String(p.productId) : null, originNo: p.originalProductId ? String(p.originalProductId) : null,
    shipDue: p.shippingDueDate || null, inv: d.trackingNumber ? { co: d.deliveryCompany || null, no: String(d.trackingNumber), at: d.sendDate || null } : null,
    rcv: a && (a.name || a.baseAddress) ? { name: a.name || '', tel: a.tel1 || '', zip: a.zipCode || '', addr: a.baseAddress || '', addr2: a.detailedAddress || '' } : null, memo: p.shippingMemo ? String(p.shippingMemo).slice(0, 300) : null, cl: nvClaimOf(x, cl, cs) };
}
/* (0.1.23 naver3) 클레임(취소·반품·교환) 자세히 — 원문 상품 주문 상세 응답 currentClaim.{cancel|return|exchange}(옛 cancel·return·exchange 칸도) · 요청 사유 코드·요청일·수량·클레임 번호만(손님 이름·연락처 없음 · 상세 사유는 손님 글이라 120자까지)
 *  돌려줌 null(클레임 없음) | { type, st, id, at, reason, why, qty } */
const NV_CLR = { INTENT_CHANGED: '구매 의사 취소', COLOR_AND_SIZE: '색상·사이즈 변경', WRONG_ORDER: '다른 상품 잘못 주문', PRODUCT_UNSATISFIED: '서비스 불만족', DELAYED_DELIVERY: '배송 지연', SOLD_OUT: '상품 품절', DROPPED_DELIVERY: '배송 누락', BROKEN: '상품 파손', INCORRECT_INFO: '상품 정보 상이', WRONG_DELIVERY: '오배송', WRONG_OPTION: '색상 등이 다른 상품을 잘못 배송' };
function nvClaimOf(x, type, st) { if (!type) return null; const k = type === 'CANCEL' || type === 'ADMIN_CANCEL' ? 'cancel' : type === 'RETURN' ? 'return' : type === 'EXCHANGE' ? 'exchange' : null; const cc = (x && x.currentClaim) || {}; const c = (k && (cc[k] || (x && x[k]))) || {};
  const code = String(c[k + 'Reason'] || c.claimReason || ''); const det = c[k + 'DetailedReason'];
  return { type, st: st || null, id: c.claimId ? String(c.claimId) : null, at: c.claimRequestDate || null, reason: code ? NV_CLR[code] || code : null, why: det ? String(det).slice(0, 120) : null, qty: c.requestQuantity != null ? num(c.requestQuantity) : null }; }
/* (0.1.23 naver3) 고객 문의(GET /v1/pay-user/inquiries content[]) · 상품 문의(GET /v1/contents/qnas contents[]) → 문의 줄(nv_inq) — 원문 받은 날 11/11(readnow-chats reports/NAVER_1111/RAW_API.md 덧붙임)
 *  구매자 이름·아이디(customerName·customerId·maskedWriterId)는 옮기지 않음 · 글은 300자까지 · 답은 스마트스토어센터에서(이 판은 읽기만) */
function nvInq(x) { if (!x || x.inquiryNo == null) return null; return { id: 'c' + String(x.inquiryNo), kind: 'cust', no: String(x.inquiryNo), cat: x.category ? String(x.category).slice(0, 20) : null, title: String(x.title || '').slice(0, 80), body: String(x.inquiryContent || '').slice(0, 300), at: x.inquiryRegistrationDateTime || null, ans: !!x.answered, ansAt: x.answerRegistrationDateTime || null, orderId: x.orderId ? String(x.orderId) : null, poIds: String(x.productOrderIdList || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10), prodNo: x.productNo ? String(x.productNo) : null, prodName: String(x.productName || '').slice(0, 100) }; }
function nvQna(x) { if (!x || x.questionId == null) return null; const A = Array.isArray(x.answers) ? x.answers : []; const la = A.length ? A[A.length - 1] : null; return { id: 'q' + String(x.questionId), kind: 'qna', no: String(x.questionId), cat: '상품', title: String(x.productName || '').slice(0, 80), body: String(x.question || '').slice(0, 300), at: x.createDate || null, ans: !!x.answered, ansAt: la && la.createDate ? la.createDate : null, orderId: null, poIds: [], prodNo: x.productId != null ? String(x.productId) : null, prodName: String(x.productName || '').slice(0, 100) }; }
/* (0.1.23 naver3) 정산 — 일별(GET /v1/pay-settle/settle/daily elements[]) · 건별(GET /v1/pay-settle/settle/case elements[]) → nv_settle · nv_settle_case
 *  계좌 번호·예금주·은행·가맹점·구매자 이름은 옮기지 않음(돈 셈에 쓰는 칸만) */
function nvStlDay(x) { if (!x || !x.settleBasisStartDate) return null; const d = String(x.settleBasisStartDate).slice(0, 10); return { id: d.replace(/-/g, '') + (x.settleMethodType ? '_' + String(x.settleMethodType).slice(0, 12) : ''), d, d2: x.settleBasisEndDate ? String(x.settleBasisEndDate).slice(0, 10) : d, exp: x.settleExpectDate || null, done: x.settleCompleteDate || null, amt: num(x.settleAmount), pay: num(x.paySettleAmount), fee: num(x.commissionSettleAmount), ben: num(x.benefitSettleAmount), hold: num(x.payHoldbackAmount), minus: num(x.minusChargeAmount), quick: num(x.quickSettleAmount), normal: num(x.normalSettleAmount), how: x.settleMethodType || null }; }
function nvStlCase(x) { if (!x || !x.productOrderId) return null; const ty = String(x.productOrderType || ''); return { id: (String(x.productOrderId) + '_' + ty + '_' + String(x.settleType || '')).replace(/[^\w-]/g, '_').slice(0, 120), po: String(x.productOrderId), orderId: x.orderId ? String(x.orderId) : null, type: ty, st: x.settleType || null, basis: x.settleBasisDate || null, exp: x.settleExpectDate || null, done: x.settleCompleteDate || null, pay: num(x.paySettleAmount), fee: num(x.totalPayCommissionAmount) + num(x.sellingInterlockCommissionAmount) + num(x.freeInstallmentCommissionAmount), ben: num(x.benefitSettleAmount), expAmt: num(x.settleExpectAmount), name: String(x.productName || '').slice(0, 80) }; }
/* (0.1.23 naver3 · 리드 판단: 우리 사진 저장소는 네이버 등록 사진 올리기용 = 네이버 예외 안) 로거 번외 네이버 길이 부르는 주소 허용 목록 — 네이버 커머스API · 우리 Firebase 사진 저장소(우리 버킷만) 밖은 부르지 않음(설정을 바꿔도) */
const NV_API = 'https://api.commerce.naver.com/external';
const IMG_OK = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/readnow-3a385\.firebasestorage\.app\/o\//;
function nvUrlOk(u, test) { let x; try { x = new URL(String(u || '')); } catch (e) { return false; } if (x.username || x.password) return false; /* 주소를 풀어(.. 정리 뒤) 집·길을 봄 — 글자 앞머리만 보면 '/o/../../남의 버킷'이 지나감 */
  if (x.protocol === 'https:' && !x.port && x.hostname === 'api.commerce.naver.com' && x.pathname.startsWith('/external/')) return true;
  if (x.protocol === 'https:' && !x.port && x.hostname === 'firebasestorage.googleapis.com' && x.pathname.startsWith('/v0/b/readnow-3a385.firebasestorage.app/o/') && IMG_OK.test(x.origin + x.pathname)) return true;
  if (test) { for (const b of [process.env.RN_COL2_NV, process.env.RN_COL2_NVIMG].filter(Boolean)) { let y; try { y = new URL(b); } catch (e) { continue; } if (y.origin === x.origin && /^(127\.0\.0\.1|localhost)$/.test(x.hostname)) return true; } } return false; }
/* 상품 목록(POST /v1/products/search 의 contents[]) → 판매처 매물 줄(스마트스토어 채널만) — 장부 other 꼴 { ch, no, sku, live, qty, price, st } 바탕 */
function nvPrd(c) { const L = []; for (const ch of (c && c.channelProducts) || []) { if (ch.channelServiceType && ch.channelServiceType !== 'STOREFARM') continue;
    L.push({ originNo: String(c.originProductNo || ch.originProductNo || ''), no: String(ch.channelProductNo || ''), name: String(ch.name || '').slice(0, 200), sku: ch.sellerManagementCode ? String(ch.sellerManagementCode) : null, price: num(ch.salePrice), disc: ch.discountedPrice != null ? num(ch.discountedPrice) : null, qty: num(ch.stockQuantity), st: String(ch.statusType || ''), disp: ch.channelProductDisplayStatusType || null, live: ch.statusType === 'SALE' && ch.channelProductDisplayStatusType !== 'SUSPENSION', cat: ch.categoryId || null, regAt: ch.regDate || null, modAt: ch.modifiedDate || null }); }
  return L; }
/* (11/11 nvfix1 · 정범님 절대 지시 '로거 번외가 네이버 일을 할 때는 절대로 테더링을 쓰지 않고 오로지 와이파이만') 🛑 나가는 길 가르기 — 순수 셈(시험이 바로 부름)
 *  L = Windows 기본 경로(0.0.0.0/0) 목록 [{ m: 경로+인터페이스 metric, name, desc, media(NdisPhysicalMedium), pmt(PhysicalMediaType), itype(InterfaceType), pnp, gw, ip }] — 연결된(Up) 것만
 *  와이파이 = 802.11(media 9 또는 PhysicalMediaType에 802.11) 이고 InterfaceType 71(무선) 이고 이름·설명에 테더링 장치 낌새(RNDIS·블루투스·Android·iPhone·Apple Mobile·휴대폰·핫스팟·Wi-Fi Direct·모바일 광대역)가 없을 때만
 *  가장 낮은 metric 길이 와이파이여도 같은 metric에 다른 길이 있으면 모름(어느 길로 나갈지 Windows 마음) — 모르면 막음(fail-closed) */
const NET_TETHER = /rndis|remote ndis|bluetooth|android|iphone|apple mobile|ipheth|tether|테더링|휴대폰|핫스팟|hotspot|wi-?fi direct|mobile broadband|모바일 광대역|wwan|usb ethernet|usb 10\/100|samsung|galaxy|pixel|xiaomi|lg-?electronics/i;
/* (naver5) 한글 Windows 이름·설명 — '로컬 영역 연결* 12'(휴대폰 핫스팟 켤 때 생기는 가상 어댑터)·블루투스 네트워크 연결·원격 NDIS·휴대전화 · 이런 낌새가 이름·설명·PnP 어디에든 있으면 테더링 */
const NET_TETHER_KO = /블루투스|원격\s*ndis|휴대\s*전화|스마트폰|안드로이드|아이폰|모바일\s*핫스팟|로컬 영역 연결\*|local area connection\*/i;
function netKind(x) { if (!x || typeof x !== 'object') return 'unknown'; const t = `${x.name || ''} ${x.desc || ''} ${x.pnp || ''}`; if (NET_TETHER.test(t) || NET_TETHER_KO.test(t) || +x.media === 10 || +x.media === 8) return 'tether';
  const w = (+x.media === 9 || /802\.11/i.test(String(x.pmt || ''))) && +x.itype === 71; if (w) return 'wifi'; if (+x.itype === 6 || +x.media === 14 || /802\.3/i.test(String(x.pmt || ''))) return 'wired'; return 'unknown'; }
const NET_KO = { wifi: '와이파이', tether: '휴대폰 테더링', wired: '유선(이더넷)', unknown: '알 수 없는 길' };
function netPick(L) { if (!Array.isArray(L)) return { ok: false, kind: 'unknown', why: '나가는 길을 읽지 못함' }; const A = L.filter((x) => x && Number.isFinite(+x.m)).sort((a, b) => +a.m - +b.m);
  if (!A.length) return { ok: false, kind: 'unknown', why: '나가는 길(기본 경로)이 없음 — 인터넷 연결 없음' }; const b = A[0]; const k = netKind(b); const tie = A.filter((x) => +x.m === +b.m && x !== b && netKind(x) !== 'wifi');
  const nm = String(b.name || b.desc || '').slice(0, 60);
  if (k !== 'wifi') return { ok: false, kind: k, name: nm, why: `지금 나가는 길이 ${NET_KO[k]}(${nm})` };
  if (tie.length) return { ok: false, kind: 'unknown', name: nm, why: `와이파이(${nm})와 ${NET_KO[netKind(tie[0])]}(${String(tie[0].name || tie[0].desc || '').slice(0, 40)})가 같은 우선순위 — 어느 길로 나갈지 모름` };
  const lip = ipv4(b.ip); if (!lip || /^(0\.|169\.254\.|255\.)/.test(lip)) return { ok: false, kind: 'unknown', name: nm, why: `와이파이(${nm})의 주소(IPv4)를 모름 — 그 주소에 묶어야만 보내므로 보내지 않음` }; /* (naver4) */
  return { ok: true, kind: 'wifi', name: nm, gw: b.gw || null, lip, ix: b.ix != null ? +b.ix : null }; }
/* (naver4) PowerShell 경로 읽기 출력 → 목록 · 하나라도 꼴이 이상하면 통째로 '모름'(null) — 순수 셈 */
/* (naver5) 실제 Windows PowerShell 5.1 꼴을 더 받음 — ① 앞머리 BOM·경고 줄 뒤 'ok:'로 시작하는 마지막 줄만(경고 글 안의 'ok:'에 속지 않음) ② 하나짜리는 객체로 나옴 → 목록 ③ 5.1이 배열을 {"value":[…],"Count":n}로 싸서 내는 경우 → 속 목록
 *  ④ m·ix·media·itype이 글자("35")로 와도 숫자로 · 그 밖의 꼴(빈 칸·null·m 없음)은 모두 '모름'(netPick이 막음) */
function netParse(e, t) { t = String(t || '').replace(/^\uFEFF/, '').replace(/\r/g, ''); if (e) return { v: null, err: String(e.code || e.message || 'PowerShell 실패').slice(0, 80) }; const ln = t.split('\n').map((y) => y.replace(/^\uFEFF/, '').trim()).filter((y) => y.startsWith('ok:')); if (!ln.length) return { v: null, err: "'ok:' 표시가 없음" };
  let x; try { x = JSON.parse(ln[ln.length - 1].slice(3).trim() || '[]'); } catch (er) { return { v: null, err: 'JSON 해석 실패' }; } if (x && !Array.isArray(x) && typeof x === 'object' && Array.isArray(x.value) && 'Count' in x) x = x.value;
  let v = Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : null; if (v) v = v.map((r) => (r && typeof r === 'object' ? { ...r, ...['m', 'ix', 'rm', 'im', 'media', 'itype'].reduce((o, k) => (r[k] != null && r[k] !== '' && Number.isFinite(+r[k]) ? { ...o, [k]: +r[k] } : o), {}) } : r));
  if (!v || v.some((r) => !r || typeof r !== 'object' || !Number.isFinite(+r.m) || r.m === '' || r.m == null)) return { v: null, err: '꼴이 다름(경로 우선순위 m이 없거나 숫자 아님)' }; return { v, err: '' }; }
const ipv4 = (t) => { const m = String(t || '').trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/); return m && m.slice(1).every((x) => +x <= 255) ? m.slice(1).map((x) => String(+x)).join('.') : null; };
/* 우리 상품 한 권 → 원상품 등록 몸(POST /v2/products) — 원문 RAW_API.md '상품 등록 요청 칸 전체 나무' · 중고(saleType OLD) · 상품정보제공고시 BOOKS · ISBN(도서_중고는 isbn13 필수)
 * b = { title, isbn13, author, publisher, pubDate, pages, size, grade, gradeNote, price, qty, sku, images:[네이버에 올린 주소], desc }
 * g = 판매자 설정 { leafCategoryId, deliveryCompany, baseFee, freeOver, returnFee, exchangeFee, asTel, asGuide, returnAddressId, shippingAddressId }
 * 돌려줌 { ok, body } | { ok:false, miss:[빠진 칸] } — 빠진 칸이 있으면 보내지 않음 */
function nvBody(b, g) { b = b || {}; g = g || {}; const miss = []; const need = (v, n) => { if (v == null || v === '' || (Array.isArray(v) && !v.length)) miss.push(n); return v; };
  const isbn = String(b.isbn13 || '').replace(/\D/g, ''); if (!/^97[89]\d{10}$/.test(isbn)) miss.push('ISBN13'); need(g.leafCategoryId, '카테고리(도서 › 중고)'); need(b.title, '제목'); need(b.images, '사진'); need(b.publisher, '출판사'); need(b.author, '저자'); need(g.asTel, 'A/S 전화'); need(g.deliveryCompany, '택배사'); need(g.shippingAddressId, '출고지 주소록 번호'); need(g.returnAddressId, '반품지 주소록 번호'); /* (naver2) 정범님 11/11 — 출고지·반품지는 판매자 주소록 번호로 꼭 */
  const price = Math.round(num(b.price)); if (!(price >= 100)) miss.push('판매가'); const qty = Math.max(1, Math.min(999, Math.round(num(b.qty) || 1)));
  const pub = String(b.pubDate || '').replace(/[^\d]/g, ''); const pubDay = pub.length >= 8 ? `${pub.slice(0, 4)}-${pub.slice(4, 6)}-${pub.slice(6, 8)}` : pub.length >= 6 ? `${pub.slice(0, 4)}-${pub.slice(4, 6)}-01` : null; if (!pubDay) miss.push('출간일');
  if (miss.length) return { ok: false, miss };
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const name = `${String(b.title).slice(0, 90)} [중고-${b.grade || '중'}]`;
  const detail = `<div><p><b>중고 도서 · 상태 ${esc(b.grade || '')}</b></p>${b.gradeNote ? `<p>${esc(b.gradeNote)}</p>` : ''}${b.desc ? `<p>${esc(b.desc)}</p>` : ''}${(b.images || []).map((u) => `<p><img src="${esc(u)}"></p>`).join('')}</div>`;
  const fee = g.freeOver ? { deliveryFeeType: 'CONDITIONAL_FREE', baseFee: num(g.baseFee), freeConditionalAmount: num(g.freeOver), deliveryFeePayType: 'PREPAID' } : num(g.baseFee) ? { deliveryFeeType: 'PAID', baseFee: num(g.baseFee), deliveryFeePayType: 'PREPAID' } : { deliveryFeeType: 'FREE' };
  const body = { originProduct: { statusType: 'SALE', saleType: 'OLD', leafCategoryId: String(g.leafCategoryId), name, detailContent: detail,
      images: { representativeImage: { url: b.images[0] }, optionalImages: b.images.slice(1, 10).map((url) => ({ url })) }, salePrice: price, stockQuantity: qty,
      deliveryInfo: { deliveryType: 'DELIVERY', deliveryAttributeType: 'NORMAL', deliveryCompany: g.deliveryCompany, deliveryFee: fee, claimDeliveryInfo: { returnDeliveryFee: num(g.returnFee), exchangeDeliveryFee: num(g.exchangeFee), ...(g.shippingAddressId ? { shippingAddressId: +g.shippingAddressId } : {}), ...(g.returnAddressId ? { returnAddressId: +g.returnAddressId } : {}) } },
      detailAttribute: { afterServiceInfo: { afterServiceTelephoneNumber: String(g.asTel), afterServiceGuideContent: String(g.asGuide || '판매자에게 문의') }, originAreaInfo: { originAreaCode: '05' /* 원산지 표기 의무 대상 아님 */ },
        sellerCodeInfo: { sellerManagementCode: b.sku ? String(b.sku) : undefined }, minorPurchasable: true, isbnInfo: { isbn13: isbn },
        bookInfo: { publishDay: pubDay, publisher: { text: String(b.publisher) }, authors: String(b.author).split(/[,·]/).map((t) => t.trim()).filter(Boolean).slice(0, 5).map((text) => ({ text })) },
        productInfoProvidedNotice: { productInfoProvidedNoticeType: 'BOOKS', books: { returnCostReason: '0', noRefundReason: '0', qualityAssuranceStandard: '0', compensationProcedure: '0', troubleShootingContents: '0', title: String(b.title).slice(0, 200), author: String(b.author), publisher: String(b.publisher), size: String(b.size || '상품상세 참조'), pages: String(b.pages || '상품상세 참조'), publishDate: pubDay, description: String(b.desc || '상품상세 참조').slice(0, 500) } } } },
    smartstoreChannelProduct: { naverShoppingRegistration: false, channelProductDisplayStatusType: 'ON' } };
  return { ok: true, body }; }
/* 게이트웨이 오류 → 한국어 까닭·할 일(원문 docs/trouble-shooting 게이트웨이 오류 표) */
function nvErr(http, j) { const c = String((j && j.code) || ''); const tr = j && j.traceId ? ` · 추적 번호 ${String(j.traceId).slice(0, 60)}` : '';
  if (c === 'NOWIFI') return { code: c, msg: String(j.message || '🛑 와이파이 아님 — 네이버 일 멈춤').slice(0, 240), later: true, net: true }; /* (nvfix1) 바깥에 안 나감 — 길이 와이파이·등록 IP로 돌아오면 저절로 다시 */
  if (c === 'GW.IP_NOT_ALLOWED') return { code: c, msg: '호출이 허용되지 않은 IP — 커머스API센터 › 애플리케이션 › API 호출 IP에 로거 PC 공인 IP를 넣어 주세요' + tr, ip: true };
  if (c === 'GW.AUTHN' || http === 401) return { code: c || 'AUTHN', msg: '인증 실패 — 애플리케이션 ID·시크릿을 다시 확인해 주세요(커머스API센터 › 애플리케이션 상세)' + tr, auth: true };
  if (c === 'GW.RATE_LIMIT' || c === 'GW.QUOTA_LIMIT' || http === 429) return { code: c || '429', msg: '요청이 많아 잠시 쉼(네이버 요청량 제한)' + tr, rate: true };
  if (/^GW\.BLOCK/.test(c) || http === 503) return { code: c || '503', msg: '네이버 점검·일시 차단 — 잠시 뒤 저절로 다시' + tr, later: true };
  if (/^GW\.(TIMEOUT|PROXY|INTERNAL)/.test(c) || http >= 500) return { code: c || String(http), msg: '네이버 쪽 일시 오류 — 잠시 뒤 저절로 다시' + tr, later: true };
  if (http === 403) return { code: c || '403', msg: '권한 없음 — 애플리케이션 API 그룹(상품·주문)을 확인해 주세요' + tr };
  if (http === 400) { const inv = Array.isArray(j && j.invalidInputs) ? j.invalidInputs.slice(0, 3).map((x) => `${x.name || ''}: ${x.message || ''}`).join(' · ') : ''; const m = String((j && (j.message || j.error_description)) || ''); return { code: c || '400', msg: '요청 칸 오류 — ' + (inv || m || '칸 확인').slice(0, 200) + tr, bad: true, auth: /client|secret|sign|인증|서명/i.test(m) }; }
  return { code: c || String(http || 'NET'), msg: (j && j.message ? String(j.message).slice(0, 160) : `응답 ${http || '없음'}`) + tr }; }
const tail4 = (s) => { s = String(s || ''); return s.length > 4 ? '…' + s.slice(-4) : '…'; };

function makeNv(o) { const { HOME, note, log } = o; const TEST = !!o.TEST; const now = () => Date.now();
  const NC = () => ({ ...(o.base || {}), ...((o.cfg() || {}).nvcfg || {}) }); /* col2-config NAVER + col2.json nvcfg */
  const BASE = () => String(TEST && process.env.RN_COL2_NV ? process.env.RN_COL2_NV : NC().base).replace(/\/$/, '');
  const pcName = () => String((o.cfg() || {}).pc || require('os').hostname() || '');
  const mine = () => { const re = NC().pc; return re instanceof RegExp ? re.test(pcName()) : new RegExp(String(re || '^LOGGER'), 'i').test(pcName()); };
  const D = path.join(HOME, 'cred'), OLD = path.join(D, 'old'); const CF = path.join(D, 'naver.dat'), KF = path.join(D, 'nv-key.dat'); const SF = path.join(HOME, 'nv-state.json'), JDF = path.join(HOME, 'nv-jdone.json'), INVF = path.join(HOME, 'nv-inv.json');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const wr = (f, v) => { try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.t', JSON.stringify(v)); fs.renameSync(f + '.t', f); return true; } catch (e) { log('네이버 파일 저장 실패: ' + e.message); return false; } };
  const ST = rd(SF, {}); const st = { ordCur: ST.ordCur || 0, ordAt: ST.ordAt || 0, ordN: ST.ordN || 0, ordErr: ST.ordErr || null, prdAt: ST.prdAt || 0, prdN: ST.prdN || 0, prdErr: ST.prdErr || null, test: ST.test || null, write: ST.write || { on: false }, seen: ST.seen || [], sig: ST.sig || {}, cats: ST.cats || null, ip: ST.ip || null, netRaw: ST.netRaw || null, inq: ST.inq || null, stl: ST.stl || null, stlCase: ST.stlCase || '' };
  const save = () => wr(SF, { ordCur: st.ordCur, ordAt: st.ordAt, ordN: st.ordN, ordErr: st.ordErr, prdAt: st.prdAt, prdN: st.prdN, prdErr: st.prdErr, test: st.test, write: st.write, seen: st.seen.slice(-60), sig: st.sig, cats: st.cats, ip: st.ip, netRaw: st.netRaw || null, inq: st.inq, stl: st.stl, stlCase: st.stlCase });
  const M = { key: null, pub: null, cred: null, tok: null, tokExp: 0, last: 0, cool: 0, coolN: 0, busy: false, q: [], qk: new Set(), jobs: [], jres: {}, jd: rd(JDF, {}), inv: rd(INVF, {}), calls: { d: '', n: 0 }, t: null, step: '' };

  /* ── Windows DPAPI(그 PC 같은 사용자만 풂) — col2-cred.js와 같은 잠그개(PS) · 값은 표준 입력으로만 ── */
  const psFile = path.join(HOME, 'col2-dpapi.ps1'); const exe = () => process.env.RN_COL2_DPAPI || 'powershell.exe';
  function dp(act, input) { return new Promise((res) => { try { const want = '﻿' + PS.replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(psFile, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(psFile, want, 'utf8'); } catch (e) { return res({ ok: false, err: '잠그개 파일을 못 씀' }); }
    let p; try { p = cp.execFile(exe(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile, '-Act', act], { windowsHide: true, timeout: 30000, maxBuffer: 1048576 }, (e, out) => { const s = String(out || ''); const i = s.indexOf('ok:'); if (e || i < 0) return res({ ok: false, err: act === 'protect' ? 'Windows 잠그기(DPAPI) 실패' : 'Windows 풀기(DPAPI) 실패 — 다른 사용자·다른 PC에서 만든 파일이면 다시 넣어 주세요' }); res({ ok: true, v: s.slice(i + 3).replace(/\r?\n$/, '') }); }); } catch (e) { return res({ ok: false, err: 'PowerShell을 못 켬' }); }
    try { p.stdin.end(String(input), 'utf8'); } catch (e) {} }); }
  const moveOld = (f, tag) => { try { if (fs.existsSync(f)) { fs.mkdirSync(OLD, { recursive: true }); fs.renameSync(f, path.join(OLD, `${tag}-${now()}.dat`)); } } catch (e) {} }; /* 지우지 않음 — 잠긴 채 옮김 */

  /* ── 열쇠 쌍(받는 쪽 공개 열쇠) — 처음 한 번 만들고, 비밀 열쇠는 DPAPI로 잠가 둠 ── */
  let keyP = null; /* 한 번에 하나(두 곳이 함께 부르면 열쇠가 둘 생겨 봉투를 못 풀던 것) */
  function keyReady() { if (M.key) return Promise.resolve({ ok: true }); if (!keyP) keyP = keyMake().finally(() => { keyP = null; }); return keyP; }
  async function keyMake() { if (M.key) return { ok: true }; if (!mine()) return { ok: false, err: '네이버 일은 로거 PC만(정범님 11/11 지정)' }; const j = rd(KF, null);
    if (j && j.v === 1 && j.pub && j.priv) { const r = await dp('unprotect', j.priv); if (r.ok) { try { M.key = crypto.createPrivateKey(r.v); M.pub = j.pub; return { ok: true }; } catch (e) {} } note('🟩 네이버 받는 열쇠를 못 풂 — 새로 만듦(예전 것은 cred/old로)', { k: 'sys', l: 'warn', m: '네이버' }); moveOld(KF, 'nv-key'); }
    const kp = crypto.generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'der' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    const r = await dp('protect', kp.privateKey); if (!r.ok) return r; const pub = Buffer.from(kp.publicKey).toString('base64'); if (!wr(KF, { v: 1, at: now(), pub, priv: r.v })) return { ok: false, err: '열쇠 파일을 못 씀' };
    M.key = crypto.createPrivateKey(kp.privateKey); M.pub = pub; note('🟩 네이버 받는 열쇠(공개 열쇠만 웹앱에 보임)를 만듦', { k: 'sys', l: 'ok', m: '네이버' }); return { ok: true }; }
  /* 웹앱이 잠근 봉투 { alg, ek, iv, ct } → { id, sec, ts } (메모리만) */
  function openEnv(env) { if (!env || env.alg !== 'RSA-OAEP-256+A256GCM') return { ok: false, err: '봉투 꼴이 아님' };
    try { const raw = crypto.privateDecrypt({ key: M.key, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(String(env.ek), 'base64')); const iv = Buffer.from(String(env.iv), 'base64'); const all = Buffer.from(String(env.ct), 'base64');
      const dc = crypto.createDecipheriv('aes-256-gcm', raw, iv); dc.setAuthTag(all.subarray(all.length - 16)); const t = Buffer.concat([dc.update(all.subarray(0, all.length - 16)), dc.final()]).toString('utf8'); raw.fill(0); const j = JSON.parse(t); return { ok: true, j }; }
    catch (e) { return { ok: false, err: '봉투를 못 풂 — 로거 열쇠가 바뀌었으면 웹앱 칸에서 다시 넣어 주세요' }; } }
  async function credLoad() { if (M.cred) return M.cred; const j = rd(CF, null); if (!(j && j.v === 1 && j.id && j.sec)) return null; const a = await dp('unprotect', j.id); if (!a.ok) return null; const b = await dp('unprotect', j.sec); if (!b.ok) return null; M.cred = { id: a.v, sec: b.v }; return M.cred; }
  const credSum = () => { const j = rd(CF, null); return j && j.v === 1 ? { has: true, at: j.at, chk: j.chk || 'ok', idTail: j.idTail || null } : { has: false }; };

  /* ── 부르기(속도·쉼·토큰) ── */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const kday = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 10);
  /* ── 🛑 와이파이 문(정범님 11/11 절대 지시) — 네이버·사진 저장소로 나가는 요청 하나하나 바로 앞에서 ①기본 경로가 와이파이인지(Windows 경로·어댑터 · 이 PC 안에서만 읽음) ②지금 공인 IP가 네이버에 등록한 고정 IP와 같은지
   *  ①이 와이파이가 아니면 바깥 요청 0건(공인 IP 확인도 안 함) · 하나라도 모르거나 다르면 부르지 않음(fail-closed) · 운영 수집기가 넘기는 '테더링 문'은 믿지 않음(이 PC가 직접 확인)
   *  공인 IP 확인은 바깥 IP 확인 주소 둘(api.ipify.org → checkip.amazonaws.com)만 · 그 답도 와이파이 확인 뒤에만 · 결과 M.net(상태·화면 '🛑 와이파이 아님 — 네이버 일 멈춤') */
  const NET_PS = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; $ErrorActionPreference='Stop'; $o=@(); foreach($r in @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -PolicyStore ActiveStore)){ $a=Get-NetAdapter -InterfaceIndex $r.ifIndex -ErrorAction SilentlyContinue; $i=Get-NetIPInterface -InterfaceIndex $r.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue; if(-not $a -or -not $i -or $a.Status -ne 'Up' -or [string]$i.ConnectionState -ne 'Connected'){ continue }; $ip=(@(Get-NetIPAddress -InterfaceIndex $r.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { [string]$_.AddressState -eq 'Preferred' -and $_.IPAddress -notlike '169.254.*' }) | Select-Object -First 1).IPAddress; $o+=[pscustomobject]@{ m=([int]$r.RouteMetric+[int]$i.InterfaceMetric); ix=[int]$r.ifIndex; rm=[int]$r.RouteMetric; im=[int]$i.InterfaceMetric; name=[string]$a.Name; desc=[string]$a.InterfaceDescription; media=[int]$a.NdisPhysicalMedium; pmt=[string]$a.PhysicalMediaType; itype=[int]$a.InterfaceType; pnp=[string]$a.PnpDeviceID; gw=[string]$r.NextHop; ip=[string]$ip } }; 'ok:' + (ConvertTo-Json -Compress -Depth 3 -InputObject @($o))";
  /* (naver5) -PolicyStore ActiveStore — 수동 게이트웨이는 저장된 값(PersistentStore)이 한 줄 더 나와 같은 길이 두 번 보이던 것 · 지금 쓰는 길만 */
  function netRoutes() { return new Promise((res) => {
      if (TEST) { const f = process.env.RN_COL2_NET; if (!f) return res(null); try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); if (v && typeof v.ps === 'string') { const p = netParse(null, v.ps); netRawKeep(v.ps, p.v, p.err, ''); return res(p.v); } return res(v && v.fail ? null : v); } catch (e) { return res(null); } } /* (naver4) {ps: PowerShell 출력 그대로} = 실제와 같은 해석 길 */ /* 시험: 파일 내용 = 경로 목록(바꾸면 다음 요청부터 반영) · 없거나 fail이면 모름 */
      if (process.platform !== 'win32') return res(null);
      try { cp.execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', NET_PS], { windowsHide: true, timeout: 15000, maxBuffer: 262144 }, (e, out, er2) => { const t = String(out || ''); const p = netParse(e, t); netRawKeep(t, p.v, p.err, String(er2 || '')); res(p.v); }); } catch (e) { netRawKeep('', null, 'PowerShell을 못 켬', ''); res(null); } }); }
  /* (naver4) 첫 실행 때(그리고 해석에 실패할 때마다) PowerShell 경로 읽기 원문을 상태에 남김 — 웹앱 ⚙ 🟩 「나가는 길」 줄에서 펼쳐 봄 · 실제 Windows가 내는 꼴을 가정하지 않기 위해
   *  남기는 것: 어댑터 이름·설명·종류·인터페이스 번호·metric·게이트웨이·사설 주소 · PnP 장치 번호는 앞 두 마디만(뒤 일련번호는 가림) · 해석 실패면 그 판단은 '모름'(netPick이 막음) */
  const pnpMask = (t) => String(t || '').replace(/("pnp"\s*:\s*")((?:[^"\\]|\\.)*)"/g, (_, a, v) => { const p = v.split(/\\\\/); return a + p.slice(0, 2).join('\\\\') + (p.length > 2 ? '\\\\…' : '') + '"'; });
  function netRawKeep(txt, v, err, se) { if (M.netRawAt && !err) return; M.netRawAt = now(); const ok2 = !err && Array.isArray(v);
    st.netRaw = { at: now(), ok: ok2, n: ok2 ? v.length : null, err: err || null, txt: pnpMask(txt).replace(/\r/g, '').slice(0, 3000), se: se ? String(se).replace(/\r/g, '').slice(0, 400) : null, L: ok2 ? v.slice(0, 8).map((x) => ({ ix: x && x.ix != null ? +x.ix : null, name: String((x && x.name) || '').slice(0, 60), desc: String((x && x.desc) || '').slice(0, 80), itype: x && x.itype, media: x && x.media, pmt: String((x && x.pmt) || '').slice(0, 30), m: x && x.m, rm: x && x.rm, im: x && x.im, kind: netKind(x), ip: ipv4(x && x.ip) })) : null };
    save(); if (!ok2) note(`🛑 나가는 길 읽기(PowerShell) 해석 실패 — '모름'으로 막음: ${err}`, { k: 'rest', l: 'warn', m: '네이버' }); }
  /* (naver4) 🔒 와이파이 주소에 묶은 요청 — fetch(어느 길로 나갈지 Windows 마음) 대신: ① 받는 곳 주소를 IPv4로만 찾고 ② TCP 소켓을 와이파이 IPv4(localAddress)에 묶어 열고
   *  ③ 열린 소켓의 나가는 주소가 와이파이 주소인지 보고 나서야 TLS·요청을 보냄 ④ 응답이 온 소켓 주소도 다시 봄 — 다르면 그 결과를 쓰지 않고 멈춤(기록) · IPv6는 아예 안 씀(family 4)
   *  확인과 요청 사이에 기본 경로가 테더링으로 바뀌어도 와이파이 주소에 묶인 소켓은 와이파이로만 나감(와이파이가 끊기면 묶기가 실패해 안 나감) · 연결은 요청마다 새로(재사용 없음) */
  const la4 = (s) => String((s && s.localAddress) || '').replace(/^::ffff:/i, '');
  const bindX = (u) => { if (!TEST || !process.env.RN_COL2_NVBINDX) return null; try { const x = JSON.parse(fs.readFileSync(process.env.RN_COL2_NVBINDX, 'utf8')); return x && (!x.only || String(u).includes(x.only)) ? x : null; } catch (e) { return null; } }; /* 시험: 일부러 다른 주소에 묶어 '길이 어긋남'을 흉내 */
  const lookup4 = (h) => new Promise((res) => { if (ipv4(h)) return res(ipv4(h)); try { dns.lookup(h, { family: 4 }, (e, a, f) => res(!e && f === 4 && ipv4(a) ? ipv4(a) : null)); } catch (e) { res(null); } });
  async function bound(u, o) { o = o || {}; let U; try { U = new URL(u); } catch (e) { return { err: '주소 꼴이 아님', code: 'URL', sent: false }; }
    const lip = ipv4(o.lip); if (!lip) return { err: '와이파이 주소(IPv4)를 모름 — 보내지 않음', code: 'NOLIP', net: true, sent: false };
    const sec = U.protocol === 'https:'; if (!sec && !(TEST && U.protocol === 'http:')) return { err: 'https 주소만', code: 'URL', sent: false };
    const dst = await lookup4(U.hostname); if (!dst) return { err: '받는 곳 주소(IPv4)를 찾지 못함', code: 'DNS', sent: false };
    const X = bindX(u); const port = +U.port || (sec ? 443 : 80);
    return new Promise((res) => { let done = false, sent = false, sock = null; const tm = setTimeout(() => fin({ err: '시간 넘음', code: 'TIME' }), o.ms || 30000);
      function fin(v) { if (done) return; done = true; clearTimeout(tm); if (v.err && sock) { try { sock.destroy(); } catch (e) {} } res({ ...v, sent }); }
      try { sock = net.connect({ host: dst, port, family: 4, localAddress: (X && X.bind) || lip }); } catch (e) { return fin({ err: '와이파이 주소에 묶지 못함', code: 'BIND', net: true }); }
      sock.on('error', (e) => { const nb = e && (e.code === 'EADDRNOTAVAIL' || e.code === 'EINVAL'); fin(nb ? { err: '와이파이 주소에 묶지 못함(와이파이가 끊겼을 수 있음)', code: 'BIND', net: true } : { err: '연결 실패(' + String((e && e.code) || '') + ')', code: 'NET' }); });
      sock.once('connect', () => { const a = la4(sock); if (a !== lip && !(X && X.skipConn)) return fin({ err: `나가는 주소 ${a || '모름'}가 와이파이 주소 ${lip}와 다름 — 보내기 전에 끊음`, code: 'SOCK', la: a, net: true });
        let s2 = sock; if (sec) { s2 = tls.connect({ socket: sock, servername: U.hostname, ALPNProtocols: ['http/1.1'] }); s2.on('error', () => fin({ err: '보안 연결(TLS) 실패', code: 'NET' })); }
        const body = o.body == null ? null : Buffer.isBuffer(o.body) ? o.body : Buffer.from(String(o.body), 'utf8'); const h = { Host: U.host, Connection: 'close', ...(o.headers || {}) }; if (body) h['Content-Length'] = String(body.length);
        let q; try { q = http.request({ host: U.hostname, port, path: U.pathname + U.search, method: o.method || 'GET', headers: h, createConnection: () => s2 }, (r) => {
            const a2 = la4(sock) || la4(r.socket); if (a2 !== lip) { try { r.destroy(); } catch (e) {} return fin({ err: `응답이 온 소켓 주소 ${a2 || '모름'}가 와이파이 주소 ${lip}와 다름 — 결과를 버림`, code: 'SOCK', la: a2, net: true }); }
            const C = []; let n = 0; const max = o.max || 16 * 1048576; r.on('data', (c) => { n += c.length; if (n > max) { try { r.destroy(); } catch (e) {} return fin({ err: '응답이 너무 큼', code: 'BIG' }); } C.push(c); });
            r.on('end', () => fin({ status: r.statusCode, ok: r.statusCode >= 200 && r.statusCode < 300, headers: r.headers, buf: Buffer.concat(C), la: a2 })); r.on('error', () => fin({ err: '응답 중 끊김', code: 'NET' })); }); }
        catch (e) { return fin({ err: '요청을 못 만듦', code: 'NET' }); }
        q.on('error', () => fin({ err: '연결 끊김', code: 'NET' })); if (body) q.write(body); q.end(); sent = true; }); }); }
  /* (naver4) 소켓 주소가 어긋남 = 묶기가 듣지 않았다는 뜻 — 결과를 버리고 한동안(기본 10분) 네이버 일 전체를 멈춤 · 기록·상태에 남김 */
  const HOLD = () => (TEST ? 6000 : Math.max(60, +NC().sockHoldSec || 600) * 1000);
  function sockStop(x, what) { M.netHold = now() + HOLD(); M.sockN = (M.sockN || 0) + 1; const why = `${x.err} — ${Math.round(HOLD() / 60e3) || 1}분 멈춤(${String(what || '').slice(0, 30)})`; M.sockLast = { at: now(), la: x.la || null, sent: !!x.sent, what: String(what || '').slice(0, 40) };
    note(`🛑 나가는 소켓 주소가 와이파이 주소와 다름 — ${x.sent ? '보낸 요청의 결과를 버림' : '보내기 전에 끊음'} · 네이버 일 멈춤: ${why}`, { k: 'err', l: 'err', m: '네이버' }); netSet({ ok: false, kind: 'unknown', why: '나가는 소켓 주소가 와이파이 주소와 다름 — ' + why }, what, now()); }
  async function pubIp(lip) { const U = TEST ? [process.env.RN_COL2_NVIP].filter(Boolean) : ['https://api.ipify.org', 'https://checkip.amazonaws.com']; M.ipN = (M.ipN || 0);
    let last = ''; for (const u of U) { M.ipN++; const x = await bound(u, { lip, ms: 8000, headers: { 'Cache-Control': 'no-cache' }, max: 4096 }); if (x.code === 'SOCK') return { sock: x }; if (x.code === 'BIND' || x.code === 'NOLIP') return { bind: x }; const ip = x.ok ? ipv4(x.buf.toString('utf8')) : null; if (ip) return { ip }; last = x.err || ('HTTP ' + x.status); } return { last }; }
  const regIp = () => ipv4(st.ip) || ipv4(NC().ip);
  function netSet(o, what, t0) { const was = M.net; M.net = { ...o, at: now(), ms: now() - t0, what: String(what || '').slice(0, 40) }; if (!o.ok && (!was || was.ok || was.why !== o.why)) note(`🛑 와이파이 아님 — 네이버 일 멈춤: ${o.why}`, { k: 'rest', l: 'warn', m: '네이버' }); if (o.ok && was && !was.ok) note('🟢 와이파이·등록 IP 확인 — 네이버 일 다시', { k: 'sys', l: 'ok', m: '네이버' }); M.netN = (M.netN || 0) + 1; return o; }
  async function netGate(what) { const t0 = now(); const fin = (o) => netSet(o, what, t0);
    if (M.netHold > now()) return fin({ ok: false, kind: 'unknown', why: `나가는 소켓 주소가 와이파이 주소와 달랐음 — ${new Date(M.netHold + 9 * 3600e3).toISOString().slice(11, 16)}까지 멈춤` }); /* (naver4) 바깥 요청 0건 */
    const p = netPick(await netRoutes()); if (!p.ok) return fin({ ok: false, kind: p.kind, why: p.why }); /* 와이파이가 아니면 여기서 끝 — 바깥 요청 0건 */
    if (!TEST && /^127\./.test(p.lip)) return fin({ ok: false, kind: 'unknown', name: p.name, why: '와이파이 주소가 이 PC 안 주소(127.*)로 읽힘 — 모름' });
    const reg = regIp(); const pi = await pubIp(p.lip); if (pi.sock) { sockStop(pi.sock, '공인 IP 확인'); return { ...M.net }; } const ip = pi.ip;
    if (pi.bind) return fin({ ok: false, kind: 'wifi', name: p.name, why: '와이파이 주소에 묶지 못함(와이파이가 끊겼을 수 있음) — 부르지 않음' });
    if (!ip) return fin({ ok: false, kind: 'wifi', name: p.name, why: `공인 IP 확인 실패${pi.last ? '(' + String(pi.last).slice(0, 40) + ')' : ''} — 지금 길을 확인하지 못해 부르지 않음` });
    if (!reg) return fin({ ok: false, kind: 'wifi', name: p.name, ip, why: `네이버에 등록한 고정 IP를 아직 안 넣음(지금 공인 IP ${ip}) — 웹앱 ⚙ 🟩 칸 「등록한 고정 IP」` });
    if (ip !== reg) return fin({ ok: false, kind: 'wifi', name: p.name, ip, why: `지금 공인 IP ${ip}가 등록한 고정 IP ${reg}와 다름 — 와이파이가 다른 망(휴대폰 핫스팟 등)일 수 있음` });
    const p2 = netPick(await netRoutes()); if (!p2.ok || p2.name !== p.name || p2.lip !== p.lip) return fin({ ok: false, kind: p2.kind, why: p2.ok ? `확인하는 사이 길이 바뀜(${p.name} ${p.lip} → ${p2.name} ${p2.lip})` : p2.why }); /* 공인 IP를 묻는 사이에 바뀌었나 */
    return fin({ ok: true, kind: 'wifi', name: p.name, ip, lip: p.lip }); } /* lip = 이번 요청을 묶을 와이파이 주소 */
  const netBlock = (g) => ({ http: 0, j: { code: 'NOWIFI', message: '🛑 와이파이 아님 — 네이버 일 멈춤: ' + g.why }, net: true });
  let chain = Promise.resolve(); /* 한 번에 하나씩 */
  function raw(method, p, opt) { const run = async () => { const gap = Math.max(TEST ? 0 : 300, +NC().minGapMs || 600); const w = M.last + gap - now(); if (w > 0) await sleep(w); if (M.cool > now()) return { http: 0, j: { code: 'COOL' }, cool: true };
      if (!nvUrlOk(BASE() + p, TEST)) { M.blocked = (M.blocked || 0) + 1; log('네이버 길: 허용 목록 밖 주소라 부르지 않음'); return { http: 0, j: { code: 'BLOCKED', message: '허용 목록 밖 주소(네이버 커머스API·우리 사진 저장소만)' } }; } /* (0.1.23 naver3) */
      let body = opt && opt.body; const hd = { Accept: 'application/json;charset=UTF-8', ...((opt && opt.headers) || {}) };
      if (body && typeof body === 'object' && !Buffer.isBuffer(body) && typeof body.append === 'function') { const rq = new Response(body); hd['Content-Type'] = rq.headers.get('content-type'); body = Buffer.from(await rq.arrayBuffer()); } /* (naver4) 사진 올리기 multipart를 미리 바이트로 */
      const g = await netGate(p.split('?')[0]); if (!g.ok) return netBlock(g); /* 🛑 바로 앞에서 — 와이파이·등록 IP가 아니면 네이버에 한 건도 안 보냄 */
      M.last = now(); if (M.calls.d !== kday()) M.calls = { d: kday(), n: 0 }; M.calls.n++;
      const x = await bound(BASE() + p, { method, headers: hd, body, ms: (opt && opt.ms) || 30000, lip: g.lip }); /* (naver4) 🔒 와이파이 주소에 묶어 보냄 */
      if (x.code === 'SOCK') { sockStop(x, p.split('?')[0]); return { ...netBlock(M.net), sent: !!x.sent, sock: true }; } /* 결과를 쓰지 않음 */
      if (x.net) { netSet({ ok: false, kind: 'wifi', why: x.err }, p.split('?')[0], now()); return netBlock(M.net); }
      if (x.err) return { http: 0, j: { code: 'NET', message: '네이버에 닿지 못함(' + x.err + ')' } };
      const r = { status: x.status, ok: x.ok }; const txt = x.buf.toString('utf8'); let j = null; try { j = txt ? JSON.parse(txt) : {}; } catch (e) { j = { message: txt.slice(0, 120) }; }
      if (r.status === 429) { M.coolN++; const s = Math.min(600, (+NC().cool429Sec || 30) * 2 ** (M.coolN - 1)); M.cool = now() + s * 1000; note(`🟩 네이버 요청량 제한(429) — ${s}초 쉼`, { k: 'rest', m: '네이버' }); } else if (r.ok) M.coolN = 0;
      return { http: r.status, j, ok: r.ok }; }; const pr = chain.then(run, run); chain = pr.catch(() => {}); return pr; }
  async function token(force, cr) { cr = cr || (await credLoad()); if (!cr) return { ok: false, err: '저장된 애플리케이션 ID·시크릿 없음 — 웹앱 ⚙ 🟩 칸에서 넣어 주세요', none: true };
    if (!force && M.tok && M.tokExp - now() > 5 * 60e3) return { ok: true };
    let sign; const ts = now(); try { sign = nvSign(cr.id, cr.sec, ts); } catch (e) { return { ok: false, err: '시크릿 꼴이 아님($2a$로 시작하는 값이어야 함 — 커머스API센터에서 복사한 그대로)', auth: true, code: 'SECRET_FORM' }; }
    const body = new URLSearchParams({ client_id: cr.id, timestamp: String(ts), client_secret_sign: sign, grant_type: 'client_credentials', type: 'SELF' }).toString(); sign = null;
    const r = await raw('POST', '/v1/oauth2/token', { body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (r.ok && r.j && r.j.access_token) { M.tok = String(r.j.access_token); M.tokExp = now() + Math.max(60, +r.j.expires_in || 10800) * 1000; return { ok: true }; }
    if (!r.net) M.tok = null; const e = r.cool ? { code: 'COOL', msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: e.msg, code: e.code, auth: !!e.auth, ip: !!e.ip, later: !!(e.later || e.rate || r.http === 0), net: !!r.net }; }
  async function call(method, p, body, q) { const t = await token(); if (!t.ok) return { ok: false, err: t.err, code: t.code, ip: t.ip, net: !!t.net, later: !!t.later }; /* 토큰 받기에서 어긋나면 쓰기는 아직 안 보냄(sent 없음) */
    const qs = q ? '?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== '').flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]))).toString() : '';
    const go = () => raw(method, p + qs, { body: body == null ? undefined : JSON.stringify(body), headers: { Authorization: 'Bearer ' + M.tok, ...(body == null ? {} : { 'Content-Type': 'application/json' }) } });
    let r = await go(); if (r.http === 401) { const t2 = await token(true); if (t2.ok) r = await go(); } /* 원문 docs/auth 'API 인증 실패 후 재시도' */
    if (r.ok) return { ok: true, j: r.j }; const e = r.cool ? { code: 'COOL', msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: e.msg, code: e.code, ip: !!e.ip, later: !!(e.later || e.rate || r.cool), http: r.http, j: r.j, net: !!r.net, sent: !!r.sent }; }

  /* ── 연결 시험 = 토큰 받기 + 상품 1건 조회(읽기만) ── */
  async function test(cr, why) { M.step = '연결 시험'; const t0 = now(); const t = await token(true, cr); let res;
    if (!t.ok) res = { ok: false, at: now(), msg: t.err, code: t.code || null, auth: !!t.auth, ip: !!t.ip, later: !!t.later, ...(t.net ? { net: true } : {}) };
    else { M.cred = cr || M.cred; const r = await call('POST', '/v1/products/search', { page: 1, size: 1 }); res = r.ok ? { ok: true, at: now(), msg: `✅ 연결됨 — 토큰 받음 · 상품 목록 읽기 맞음(전체 ${num(r.j && r.j.totalElements)}건)`, n: num(r.j && r.j.totalElements), ms: now() - t0 } : { ok: false, at: now(), msg: '토큰은 받았으나 상품 읽기 실패 — ' + r.err, code: r.code || null, ip: !!r.ip }; }
    st.test = { ...res, why: String(why || '').slice(0, 40) }; save(); M.step = ''; note(`🟩 네이버 연결 시험 — ${res.ok ? '맞음' : '실패: ' + res.msg}`, { k: 'sys', l: res.ok ? 'ok' : 'warn', m: '네이버' }); return res; }
  /* 봉투로 받은 ID·시크릿 → 시험 → 저장 · 인증이 틀리면 저장 안 함 · IP·일시 오류면 '확인 기다림'으로 잠가 저장(다음 시험 때 확인) */
  async function credPut(env, by) { const k = await keyReady(); if (!k.ok) return { ok: false, err: k.err };
    const sg = crypto.createHash('sha256').update(String(env && env.ct)).digest('hex').slice(0, 24); if (st.seen.includes(sg)) return { ok: false, err: '이미 받은 봉투(같은 것을 두 번 쓰지 않음)' };
    const o2 = openEnv(env); if (!o2.ok) return o2; let { id, sec, ts } = o2.j || {}; st.seen.push(sg); save();
    if (!(now() - +ts < 30 * 60e3 && +ts <= now() + 5 * 60e3)) { id = sec = null; return { ok: false, err: '오래된 봉투(30분 넘음) — 다시 넣어 주세요' }; }
    id = String(id || '').trim(); sec = String(sec || '').trim(); if (!/^[\w-]{6,80}$/.test(id) || !sec || sec.length > 200) { id = sec = null; return { ok: false, err: '애플리케이션 ID·시크릿 꼴이 이상함(빈 칸·너무 김)' }; }
    const cr = { id, sec }; const prevCred = M.cred, prevTok = M.tok, prevExp = M.tokExp; M.tok = null; const res = await test(cr, '새 값 받음 · ' + String(by || '').slice(0, 30));
    if (!res.ok && (res.auth || res.code === 'SECRET_FORM')) { M.cred = prevCred; M.tok = prevTok; M.tokExp = prevExp; cr.id = cr.sec = null; return { ok: false, saved: false, test: res, err: '저장 안 함 — ' + res.msg }; }
    const a = await dp('protect', cr.id); const b = await dp('protect', cr.sec); if (!a.ok || !b.ok) { M.cred = prevCred; return { ok: false, saved: false, test: res, err: (a.ok ? b : a).err }; }
    moveOld(CF, 'naver'); const okW = wr(CF, { v: 1, how: process.env.RN_COL2_DPAPI ? 'test' : 'dpapi-user', at: now(), chk: res.ok ? 'ok' : 'pending', idTail: tail4(cr.id), id: a.v, sec: b.v });
    M.cred = cr; if (!res.ok) M.tok = null; note(`🟩 네이버 애플리케이션 ID(${tail4(cr.id)})·시크릿을 이 PC에만 잠가 저장 — ${res.ok ? '연결 맞음' : '확인 기다림(' + res.msg.slice(0, 60) + ')'}`, { k: 'sys', l: res.ok ? 'ok' : 'warn', m: '네이버' });
    if (res.ok) kick(1500); return { ok: okW, saved: okW, test: res }; }
  async function retest(why) { const cr = await credLoad(); if (!cr) return { ok: false, err: '저장된 값 없음' }; const r = await test(cr, why); const j = rd(CF, null); if (j && j.v === 1) { j.chk = r.ok ? 'ok' : r.auth ? 'bad' : j.chk || 'pending'; wr(CF, j); } if (r.ok) kick(1000); return { ok: true, test: r }; }

  /* ── 줄(웹앱 대신 쓰기가 받아 감) ── */
  const push = (c, id, v) => { const k = c + '/' + id; if (M.qk.has(k)) { const i = M.q.findIndex((x) => x.k === k); if (i >= 0) M.q[i].v = v; return; } M.qk.add(k); M.q.push({ k, c, id: String(id), v, merge: true }); if (M.q.length > 3000) { const x = M.q.shift(); M.qk.delete(x.k); } };
  const sigOf = (v) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 12);

  /* ── 주문 읽기: 변경 상품 주문(last-changed-statuses · 24시간 창 · more 이어 받기) → 상세(query · 300개씩) ── */
  async function pullOrd(why) { const C = NC(); const t0 = now(); let from = st.ordCur || t0 - (+C.firstH || 72) * 3600e3; const ids = new Set(); let calls = 0, more = null, err = null, net = false;
    M.step = '주문 변경 읽기';
    while (calls < (+C.maxCalls || 60) / 2 && from < t0) { const to = Math.min(from + 24 * 3600e3 - 1, t0); const q = { lastChangedFrom: kstIso(more ? more.from : from), lastChangedTo: kstIso(to), ...(more ? { moreSequence: more.seq } : {}) };
      const r = await call('GET', '/v1/pay-order/seller/product-orders/last-changed-statuses', null, q); calls++; if (!r.ok) { err = r.err; net = !!r.net; break; }
      const d = (r.j && r.j.data) || {}; for (const x of d.lastChangeStatuses || []) if (x && x.productOrderId) ids.add(String(x.productOrderId));
      if (d.more && d.more.moreFrom && d.more.moreSequence) { more = { from: Date.parse(d.more.moreFrom) || from, seq: String(d.more.moreSequence) }; continue; } more = null; from = to + 1; }
    const L = [...ids]; let n = 0;
    for (let i = 0; i < L.length && !err; i += 300) { M.step = `주문 상세 ${i}/${L.length}`; const r = await call('POST', '/v1/pay-order/seller/product-orders/query', { productOrderIds: L.slice(i, i + 300), quantityClaimCompatibility: true }); if (!r.ok) { err = r.err; net = !!r.net; break; }
      for (const x of (r.j && r.j.data) || []) { const v = nvOrd(x); if (!v.id) continue; v.ch = 'naver'; v.seenAt = new Date().toISOString(); const s = sigOf({ ...v, seenAt: 0 }); if (st.sig['o' + v.id] === s) continue; st.sig['o' + v.id] = s; push('crm_naver_orders', v.id, v); n++; } }
    if (!err) st.ordCur = Math.max(st.ordCur || 0, from - 5 * 60e3); /* 5분 겹쳐 읽음(같은 줄은 지문으로 거름) */
    st.ordAt = now(); st.ordN = n; st.ordErr = err; trimSig(); save(); M.step = '';
    note(`🟩 네이버 주문 읽기 — 바뀐 상품 주문 ${L.length}건 · 새로 넘길 ${n}건${err ? ' · 실패: ' + err : ''} (${why || ''})`, { k: err ? 'err' : 'read', l: err ? 'warn' : 'detail', m: '네이버' }); return { ok: !err, n, ids: L.length, err, net }; }
  /* ── 상품 목록 읽기(search · 100개씩 · 바뀐 줄만 넘김) ── */
  async function pullPrd(why) { const C = NC(); let page = 1, total = 0, n = 0, err = null, net = false; M.step = '상품 목록 읽기';
    for (; page <= Math.max(1, +C.maxCalls || 60); page++) { const r = await call('POST', '/v1/products/search', { page, size: 100, orderType: 'NO' }); if (!r.ok) { err = r.err; net = !!r.net; break; } const cs = (r.j && r.j.contents) || []; total = num(r.j && r.j.totalElements) || total;
      for (const c of cs) for (const v of nvPrd(c)) { if (!v.originNo) continue; const s = sigOf(v); if (st.sig['p' + v.originNo] === s) continue; st.sig['p' + v.originNo] = s; push('nv_listings', v.originNo, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); n++; }
      if (cs.length < 100 || (r.j && r.j.last)) break; }
    st.prdAt = now(); st.prdN = total; st.prdErr = err; save(); M.step = ''; note(`🟩 네이버 상품 목록 — 전체 ${total}건 · 바뀐 ${n}건${err ? ' · 실패: ' + err : ''} (${why || ''})`, { k: err ? 'err' : 'read', l: err ? 'warn' : 'detail', m: '네이버' }); return { ok: !err, total, n, err, net }; }
  const trimSig = () => { const ks = Object.keys(st.sig); if (ks.length > 20000) for (const k of ks.slice(0, ks.length - 20000)) delete st.sig[k]; };
  /* (0.1.23 naver3) ── 문의 읽기(30분) — 고객 문의(pay-user/inquiries · 30일) + 상품 문의(contents/qnas · 30일) · 바뀐 줄만 넘김 · 권한이 없으면 까닭만(주문·상품 읽기는 그대로) ── */
  const kdOff = (d) => new Date(now() + 9 * 3600e3 + d * 864e5).toISOString().slice(0, 10);
  const why403 = (r, g) => (r.http === 403 ? `권한 없음 — 커머스API센터 › 애플리케이션 › API 그룹에 「${g}」를 더해 주세요` : r.err);
  async function pullInq(why) { const C = NC(); const days = Math.max(1, Math.min(90, +C.inqDays || 30)); let n = 0, un = 0, tot = 0, net = false; const err = [];
    M.step = '문의 읽기';
    for (let page = 1; page <= 5; page++) { const r = await call('GET', '/v1/pay-user/inquiries', null, { page, size: 100, startSearchDate: kdOff(-days + 1), endSearchDate: kdOff(0) }); if (!r.ok) { net = net || !!r.net; /* (rel3) 🛑 길 막힘 */  err.push('고객 문의: ' + why403(r, '문의')); break; }
      const cs = (r.j && r.j.content) || []; for (const x of cs) { const v = nvInq(x); if (!v) continue; tot++; if (!v.ans) un++; const s = sigOf(v); if (st.sig['i' + v.id] === s) continue; st.sig['i' + v.id] = s; push('nv_inq', v.id, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); n++; }
      if (!cs.length || (r.j && r.j.last) || cs.length < 100) break; }
    for (let page = 1; page <= 5; page++) { const r = await call('GET', '/v1/contents/qnas', null, { page, size: 100, fromDate: kstIso(now() - days * 864e5), toDate: kstIso(now()) }); if (!r.ok) { net = net || !!r.net; /* (rel3) 🛑 길 막힘 */  err.push('상품 문의: ' + why403(r, '문의')); break; }
      const cs = (r.j && r.j.contents) || []; for (const x of cs) { const v = nvQna(x); if (!v) continue; tot++; if (!v.ans) un++; const s = sigOf(v); if (st.sig['i' + v.id] === s) continue; st.sig['i' + v.id] = s; push('nv_inq', v.id, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); n++; }
      if (!cs.length || (r.j && r.j.last) || cs.length < 100) break; }
    st.inq = { at: now(), n: tot, un, err: err.length ? err.join(' · ').slice(0, 300) : null }; trimSig(); save(); M.step = '';
    note(`🟩 네이버 문의 읽기 — ${tot}건(답 안 함 ${un}) · 새로 넘길 ${n}건${err.length ? ' · ' + err.join(' · ') : ''} (${why || ''})`, { k: err.length ? 'err' : 'read', l: err.length ? 'warn' : 'detail', m: '네이버' }); return { ok: !err.length, n, un, tot, net }; }
  /* (0.1.23 naver3) ── 정산 읽기(6시간) — 일별(최근 35일) + 건별(정산 기준일마다 · 처음 14일, 그 뒤 최근 3일) ── */
  async function pullStl(why) { const C = NC(); let n = 0, nc = 0, net = false; const err = []; M.step = '정산 읽기'; let dn = 0, sum = 0;
    { const r = await call('GET', '/v1/pay-settle/settle/daily', null, { startDate: kdOff(-34), endDate: kdOff(0), pageNumber: 1, pageSize: 100 }); if (!r.ok) { net = net || !!r.net; err.push('일별 정산: ' + why403(r, '정산')); }
      else for (const x of (r.j && r.j.elements) || []) { const v = nvStlDay(x); if (!v) continue; dn++; sum += v.amt; const s = sigOf(v); if (st.sig['s' + v.id] === s) continue; st.sig['s' + v.id] = s; push('nv_settle', v.id, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); n++; } }
    if (!err.length) { const first = !st.stlCase; const back = first ? Math.max(3, Math.min(35, +C.stlFirstD || 14)) : 3; let d = 0;
      for (; d < back; d++) { const day = kdOff(-d); let page = 1, bad = null;
        for (; page <= 3; page++) { const r = await call('GET', '/v1/pay-settle/settle/case', null, { searchDate: day, periodType: 'SETTLE_CASEBYCASE_SETTLE_BASIS_DATE', pageNumber: page, pageSize: 1000 }); if (!r.ok) { net = net || !!r.net; /* (rel3) 🛑 길 막힘 */  bad = '건별 정산: ' + why403(r, '정산'); break; }
          const es = (r.j && r.j.elements) || []; for (const x of es) { const v = nvStlCase(x); if (!v) continue; const s = sigOf(v); if (st.sig['c' + v.id] === s) continue; st.sig['c' + v.id] = s; push('nv_settle_case', v.id, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); nc++; }
          const pg = (r.j && r.j.pagination) || {}; if (!es.length || es.length < 1000 || (pg.totalPages && page >= pg.totalPages)) break; }
        if (bad) { err.push(bad); break; } }
      if (!err.length) st.stlCase = kday(); }
    st.stl = { at: now(), days: dn, sum, n, nc, err: err.length ? err.join(' · ').slice(0, 300) : null }; trimSig(); save(); M.step = '';
    note(`🟩 네이버 정산 읽기 — 일별 ${dn}줄 · 새로 넘길 ${n}줄 · 건별 ${nc}건${err.length ? ' · ' + err.join(' · ') : ''} (${why || ''})`, { k: err.length ? 'err' : 'read', l: err.length ? 'warn' : 'detail', m: '네이버' }); return { ok: !err.length, n, nc, net }; }
  /* 도서 › 중고 카테고리 찾기(등록 설정용 · 읽기만) */
  async function cats() { const r = await call('GET', '/v1/categories', null, { last: true }); if (!r.ok) return { ok: false, err: r.err }; const L = (Array.isArray(r.j) ? r.j : (r.j && r.j.contents) || []).filter((c) => /^도서/.test(String(c.wholeCategoryName || '')) && /중고/.test(String(c.wholeCategoryName || ''))).slice(0, 40).map((c) => ({ id: String(c.id), n: String(c.wholeCategoryName) })); st.cats = { at: now(), L }; save(); return { ok: true, L }; }

  /* ── 실제 쓰기(기본 끔) — 할 일 { id, k: confirm|dispatch|status|reg, ... } ── */
  const wOn = () => !!(st.write && st.write.on);
  function setWrite(on, by) { if (on && !(st.test && st.test.ok)) return { ok: false, err: '연결 시험이 맞은 뒤에 켤 수 있음' }; st.write = { on: !!on, by: String(by || '').slice(0, 40), at: now() }; save(); note(`🟩 네이버 실제 쓰기 ${on ? '켬' : '끔'} — ${st.write.by}`, { k: 'sys', l: on ? 'warn' : 'ok', m: '네이버' }); return { ok: true, write: st.write }; }
  function jobPut(j, by) { if (!wOn()) return { ok: false, err: '네이버 실제 쓰기가 꺼져 있음(⚙ 🟩 칸에서 두 번 눌러 켬)' }; const id = String((j && j.id) || ''); if (!/^[\w.:|-]{4,120}$/.test(id)) return { ok: false, err: '할 일 열쇠 없음' };
    if (M.jd[id]) return { ok: true, dup: true, res: M.jd[id] }; if (M.jobs.some((x) => x.id === id)) return { ok: true, dup: true, queued: true };
    const k = String(j.k || ''); if (!/^(confirm|dispatch|status|reg|price|claim)$/.test(k)) return { ok: false, err: '모르는 할 일' };
    if (k === 'price' && !(/^\d{1,20}$/.test(String(j.originNo || '')) && Number.isInteger(+j.price) && +j.price >= 100 && +j.price <= 10000000)) return { ok: false, err: '판매가 바꾸기 — 원상품번호·판매가(100원 이상 정수)가 필요' }; /* (0.1.23 naver3) */
    if (k === 'claim' && !(/^[\w-]{2,40}$/.test(String(j.po || '')) && /^(cancel|return|exchange)$/.test(String(j.act || '')))) return { ok: false, err: '요청 승인 — 상품 주문 번호·종류(취소·반품·교환 수거)가 필요' }; /* (0.1.23 naver3) */
    if (k === 'dispatch') { for (const d of j.rows || []) { const key = String(d.co || '') + ':' + String(d.no || ''); const was = M.inv[key]; if (was && was !== String(d.po)) return { ok: false, err: `송장번호 ${String(d.no).slice(-4)}는 다른 주문에 이미 썼음(약속 10)` }; } }
    M.jobs.push({ ...j, id, k, by: String(by || '').slice(0, 40), at: now() }); M.jres[id] = { st: 'queued', at: now() }; kick(300); return { ok: true, queued: true }; }
  /* (0.1.22 naver2) 상품 사진 올리기 — 우리 Firebase 사진 저장소 주소만 받아(다른 곳은 거절) 내려받고 → POST /v1/product-images/upload(multipart · imageFiles 최대 10장 · JPG·GIF·PNG·BMP) → 네이버 주소
   *  원문: 등록 몸의 이미지 주소는 반드시 이 API로 올리고 받은 주소여야 함(RAW_API.md 'images') · 사진은 메모리에서만(파일로 남기지 않음) */
  async function upImgs(urls) { const L = (urls || []).map(String).filter((u) => IMG_OK.test(u)).slice(0, 10); if (!L.length) return { ok: false, err: '사진 주소 없음(우리 사진 저장소 주소만 받음)' }; const fd = new FormData(); let n = 0;
    for (const u of L) { const g = await netGate('사진 받기'); if (!g.ok) return { ok: false, err: '🛑 와이파이 아님 — 네이버 일 멈춤: ' + g.why, later: true, net: true }; /* (nvfix1) 사진 저장소 요청도 하나하나 앞에서 */ const fu = TEST && process.env.RN_COL2_NVIMG ? process.env.RN_COL2_NVIMG + '?u=' + encodeURIComponent(u) : u; if (!nvUrlOk(fu, TEST)) { M.blocked = (M.blocked || 0) + 1; continue; } /* (naver3) 허용 목록 */ const r = await bound(fu, { lip: g.lip, ms: 30000, max: 10 * 1048576 + 1 }); /* (naver4) 🔒 와이파이 주소에 묶어 받음 */
      if (r.code === 'SOCK') { sockStop(r, '사진 받기'); return { ok: false, err: '🛑 나가는 소켓 주소가 와이파이 주소와 다름 — 사진을 버리고 멈춤', later: true, net: true }; } if (r.net) return { ok: false, err: '🛑 와이파이 아님 — 네이버 일 멈춤: ' + r.err, later: true, net: true };
      try { if (!r.ok) continue; const b = r.buf; if (!b.length || b.length > 10 * 1048576) continue; const ty = /png/i.test(String((r.headers && r.headers['content-type']) || '')) ? 'image/png' : 'image/jpeg'; fd.append('imageFiles', new Blob([b], { type: ty }), `p${++n}.${ty === 'image/png' ? 'png' : 'jpg'}`); } catch (e) {} }
    if (!n) return { ok: false, err: '사진을 내려받지 못함' }; const t = await token(); if (!t.ok) return { ok: false, err: t.err };
    const go = () => raw('POST', '/v1/product-images/upload', { body: fd, headers: { Authorization: 'Bearer ' + M.tok }, ms: 60000 }); let r = await go(); if (r.http === 401) { const t2 = await token(true); if (t2.ok) r = await go(); }
    if (!r.ok) { const e = r.cool ? { msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: '사진 올리기 실패 — ' + e.msg, later: !!(e.later || e.rate || r.cool) }; }
    const out = ((r.j && r.j.images) || []).map((x) => x && x.url).filter(Boolean); return out.length ? { ok: true, urls: out } : { ok: false, err: '사진 올리기 응답에 주소 없음' }; }
  async function jobRun(j) { M.step = '쓰기 ' + j.k; let r;
    if (j.k === 'confirm') r = await call('POST', '/v1/pay-order/seller/product-orders/confirm', { productOrderIds: (j.ids || []).map(String).slice(0, 30) });
    else if (j.k === 'dispatch') r = await call('POST', '/v1/pay-order/seller/product-orders/dispatch', { dispatchProductOrders: (j.rows || []).slice(0, 30).map((d) => ({ productOrderId: String(d.po), deliveryMethod: 'DELIVERY', deliveryCompanyCode: String(d.co), trackingNumber: String(d.no), dispatchDate: kstIso(now()) })) });
    else if (j.k === 'status') r = await call('PUT', `/v1/products/origin-products/${encodeURIComponent(String(j.originNo))}/change-status`, { statusType: String(j.to || 'SUSPENSION'), ...(j.stock != null ? { stockQuantity: +j.stock } : {}) });
    else if (j.k === 'price') r = await call('PATCH', '/v1/products/origin-products/multi-update', { multiProductUpdateRequestVos: [{ originProductNo: +j.originNo, multiUpdateTypes: ['SALE_PRICE'], productSalePrice: { salePrice: Math.round(+j.price) } }] }); /* (0.1.23 naver3) 판매가만 — 원문 RAW_API.md multi-update */
    else if (j.k === 'claim') r = await call('POST', `/v1/pay-order/seller/product-orders/${encodeURIComponent(String(j.po))}/claim/${j.act === 'exchange' ? 'exchange/collect' : j.act}/approve`, null); /* (0.1.23 naver3) 취소 요청 승인 · 반품 요청 승인 · 교환 수거 완료 승인 — 원문 seller-approve-* */
    else if (j.k === 'reg') { const g = { ...(NC().reg || {}), ...(j.g || {}) }; let book = { ...(j.book || {}) }; const m0 = nvBody({ ...book, images: book.images && book.images.length ? book.images : ['x'] }, g); /* 사진 말고 빠진 칸이 있으면 사진을 올리지 않음 */
      if (!m0.ok) r = { ok: false, err: '빠진 칸: ' + m0.miss.join('·') }; else { if (!(book.images && book.images.length)) { M.step = '사진 올리기'; const u = await upImgs(j.imgs); if (u.ok) book.images = u.urls; else r = { ok: false, err: u.err, later: u.later }; }
        if (!r) { const b = nvBody(book, g); if (!b.ok) r = { ok: false, err: '빠진 칸: ' + b.miss.join('·') }; else r = await call('POST', '/v2/products', b.body); } } }
    if (r && r.net && r.sent) r = { ok: false, err: '보냈으나 응답이 와이파이 주소가 아닌 소켓으로 와 결과를 버림 — 네이버 판매자센터에서 실제로 됐는지 확인해 주세요(같은 일을 저절로 다시 보내지 않음)', unsure: true }; /* (naver4) 두 번 보내 겹치지 않게 */
    else if (r && r.net) { M.step = ''; return { wait: true, why: r.err }; } /* (nvfix1) 길이 와이파이가 아니게 됨 — 이 할 일은 끝·실패로 남기지 않고 줄 맨 앞에서 기다림(같은 할 일 두 번 안 함 장부도 그대로) */
    /* 원문: 발주 확인·발송 처리 응답 data.successProductOrderIds / failProductOrderInfos */
    const d = (r && r.j && r.j.data) || {}; const fails = (d.failProductOrderInfos || []).map((x) => `${x.productOrderId}: ${x.message || x.code || ''}`).slice(0, 5);
    const res = r.ok && !fails.length ? { st: 'done', at: now(), ok: true, ...(j.k === 'reg' ? { originNo: r.j && r.j.originProductNo ? String(r.j.originProductNo) : null, chNo: r.j && r.j.smartstoreChannelProductNo ? String(r.j.smartstoreChannelProductNo) : null } : {}) } : { st: 'fail', at: now(), ok: false, err: (r.ok ? '일부 실패 — ' + fails.join(' · ') : r.err).slice(0, 300), later: !!r.later, ...(r.unsure ? { unsure: true } : {}) };
    if (res.ok && j.k === 'dispatch') { for (const x of j.rows || []) M.inv[String(x.co) + ':' + String(x.no)] = String(x.po); wr(INVF, M.inv); }
    /* (0.1.22 naver2) 판매 상태가 맞게 바뀌면 그 매물 줄을 곧바로 고쳐 넘김(6시간 목록 읽기를 기다리지 않음 — 🧾 🛠 처리할 일·🤖 자동 내림이 반영을 바로 봄) · 지문을 지워 다음 목록 읽기가 네이버 값으로 다시 덮음 */
    if (res.ok && j.k === 'status' && j.originNo) { const to = String(j.to || 'SUSPENSION'); const on = to === 'SALE'; push('nv_listings', String(j.originNo), { originNo: String(j.originNo), st: to, live: on && !(j.stock != null && +j.stock <= 0), ...(j.stock != null ? { qty: +j.stock } : on ? {} : { qty: 0 }), ch: 'naver', chgAt: new Date().toISOString(), chgBy: 'job' }); delete st.sig['p' + String(j.originNo)]; save(); }
    if (res.ok && j.k === 'price' && j.originNo) { push('nv_listings', String(j.originNo), { originNo: String(j.originNo), price: Math.round(+j.price), disc: null, ch: 'naver', pxAt: new Date().toISOString(), pxBy: 'job' }); delete st.sig['p' + String(j.originNo)]; save(); } /* (naver3) 값이 맞게 바뀌면 매물 줄 곧바로 · 다음 목록 읽기가 네이버 값으로 덮음 */
    if (res.ok && j.k === 'claim') nextOrd = 0; /* (naver3) 승인 뒤 주문을 곧바로 다시 읽음(클레임 상태가 바로 보이게) */
    if (res.ok && j.k === 'reg') nextPrd = 0; /* (naver2) 등록이 맞으면 다음 돌기에 상품 목록을 다시 읽음(통합 장부에 바로 붙게) */
    if (res.ok && (j.k === 'dispatch' || j.k === 'confirm')) nextOrd = 0; /* (naver2) 발주 확인·발송 처리가 맞으면 다음 돌기에 주문을 곧바로 다시 읽음(📦 오늘 출고 단계가 10분 기다리지 않음) */
    if (!res.later) { M.jd[j.id] = res; wr(JDF, M.jd); } M.jres[j.id] = res; push('col2_naver_jobs', j.id.replace(/[^\w.-]/g, '_').slice(0, 140), { id: j.id, k: j.k, by: j.by, ...res }); M.step = '';
    note(`🟩 네이버 쓰기 ${j.k} — ${res.ok ? '맞음' : '실패: ' + res.err}`, { k: res.ok ? 'sys' : 'err', l: res.ok ? 'ok' : 'warn', m: '네이버' }); return res; }

  /* ── 돌기 ── */
  let nextOrd = 0, nextPrd = 0, nextInq = 0, nextStl = 0;
  async function tick(why) { if (M.busy || !mine()) return; M.busy = true; try { if (!(await keyReady()).ok) return; const cr = await credLoad(); if (!cr) return; if (M.cool > now()) return;
      if (st.test && st.test.auth) return; /* 인증이 틀린 값으로 되풀이해 두드리지 않음 — 새 값을 넣거나 다시 시험하면 풀림 */
      const jobs = async () => { while (M.jobs.length && wOn()) { const j = M.jobs.shift(); const jr = await jobRun(j); if (jr && jr.wait) { M.jobs.unshift(j); M.jres[j.id] = { st: 'queued', at: now(), wait: String(jr.why || '').slice(0, 200) }; break; } if (M.cool > now()) break; } }; /* (rel3) 읽기 사이사이에도 — 정산·문의 읽기가 길어도 맡긴 쓰기(판매중지·발송)가 그 뒤로 밀리지 않게 */
      await jobs();
      if (M.net && !M.net.ok) { nextOrd = Math.min(nextOrd, now() + 60e3); return; } /* (nvfix1) 🛑 길이 막혔으면 남은 일(읽기 포함)은 대기 — 1분 뒤 다시 확인 */
      const C = NC(); if (now() >= nextOrd) { nextOrd = now() + Math.max(1, +C.ordMin || 10) * 60e3; const r1 = await pullOrd(why || '주기'); if (r1 && r1.net) { nextOrd = now() + 60e3; return; } } /* (nvfix1) 길이 바뀌어 멈췄으면 상품 읽기로 넘어가지 않음 · 1분 뒤 다시 */
      if (now() >= nextPrd) { nextPrd = now() + Math.max(0.5, +C.prdH || 6) * 3600e3; const r2 = await pullPrd(why || '주기'); if (r2 && r2.net) { nextPrd = now() + 60e3; return; } }
      await jobs(); if ((M.net && !M.net.ok) || M.cool > now()) return;
      if (M.cool <= now() && now() >= nextInq) { nextInq = now() + Math.max(5, +C.inqMin || 30) * 60e3; const r3 = await pullInq(why || '주기'); if (r3 && r3.net) { nextInq = now() + 60e3; return; } } /* (0.1.23 naver3) 문의 30분 */
      await jobs(); if ((M.net && !M.net.ok) || M.cool > now()) return;
      if (M.cool <= now() && now() >= nextStl) { nextStl = now() + Math.max(1, +C.stlH || 6) * 3600e3; const r4 = await pullStl(why || '주기'); if (r4 && r4.net) nextStl = now() + 60e3; }
      await jobs(); } /* (0.1.23 naver3) 정산 6시간 */
    catch (e) { log('네이버 돌기 오류: ' + e.message); } finally { M.busy = false; } }
  function kick(ms) { clearTimeout(M.t); M.t = setTimeout(() => tick('바로').catch(() => {}), ms || 500); }
  function start() { setInterval(() => tick().catch(() => {}), TEST ? 1000 : 60e3); if (mine()) setTimeout(() => keyReady().catch(() => {}), TEST ? 100 : 3000); kick(TEST ? 400 : 20e3); }

  /* ── 웹앱 다리 ── */
  function sum() { const on = mine(); return { on, why: on ? '' : '네이버 일은 로거 PC만(정범님 11/11 지정)', pub: on ? M.pub : null, cred: on ? credSum() : { has: false }, test: st.test, write: st.write, step: M.step,
    ord: { at: st.ordAt, n: st.ordN, err: st.ordErr, cur: st.ordCur }, prd: { at: st.prdAt, n: st.prdN, err: st.prdErr }, inq: st.inq, stl: st.stl, blocked: M.blocked || 0, cool: M.cool > now() ? M.cool : 0, q: M.q.length, jobs: M.jobs.length, calls: M.calls.n, cats: st.cats, net: M.net ? { ...M.net, raw: st.netRaw || null, sockN: M.sockN || 0 } : null, ipReg: regIp() }; } /* (nvfix1) net = 🛑 와이파이 문 마지막 판단(ok·kind·why·ip) · ipReg = 등록한 고정 IP(비밀 아님) */
  async function cmd(c) { c = c || {}; const k = String(c.k || ''); if (!mine()) return { ok: false, err: '네이버 일은 로거 PC만' };
    if (k === 'cred') return credPut(c.env, c.by); if (k === 'test') return retest('웹앱 단추 · ' + String(c.by || '').slice(0, 30));
    if (k === 'sync') { nextOrd = 0; if (c.prd) nextPrd = 0; if (c.prd || c.all) { nextInq = 0; nextStl = 0; } kick(200); return { ok: true }; }
    if (k === 'write') return setWrite(c.on === true, c.by); if (k === 'job') return jobPut(c.job, c.by); if (k === 'cats') return cats();
    if (k === 'ip') { const ip = ipv4(c.ip); if (!ip) return { ok: false, err: '고정 IP 꼴이 아님(예: 211.0.0.1)' }; st.ip = ip; save(); note(`🟩 네이버에 등록한 고정 IP를 ${ip}로 둠 — ${String(c.by || '').slice(0, 30)}`, { k: 'sys', l: 'ok', m: '네이버' }); kick(500); return { ok: true, ip }; } /* (nvfix1) 와이파이 문이 견줄 IP */
    return { ok: false, err: '모르는 명령' }; }
  function feed(o2) { for (const k of (o2 && o2.ack) || []) { const i = M.q.findIndex((x) => x.k === k); if (i >= 0) { M.q.splice(i, 1); M.qk.delete(k); } } return { ok: true, st: sum(), out: M.q.slice(0, 150), jres: M.jres }; }
  return { start, tick, kick, sum, cmd, feed, keyReady, M, st, pullInq, pullStl };
}
module.exports = { makeNv, nvOrd, nvPrd, nvBody, nvErr, kstIso, nvClaimOf, nvInq, nvQna, nvStlDay, nvStlCase, nvUrlOk, NV_API, netKind, netPick, netParse, ipv4 };
