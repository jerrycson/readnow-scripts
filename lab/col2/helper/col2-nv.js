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
    rcv: a && (a.name || a.baseAddress) ? { name: a.name || '', tel: a.tel1 || '', zip: a.zipCode || '', addr: a.baseAddress || '', addr2: a.detailedAddress || '' } : null, memo: p.shippingMemo ? String(p.shippingMemo).slice(0, 300) : null };
}
/* 상품 목록(POST /v1/products/search 의 contents[]) → 판매처 매물 줄(스마트스토어 채널만) — 장부 other 꼴 { ch, no, sku, live, qty, price, st } 바탕 */
function nvPrd(c) { const L = []; for (const ch of (c && c.channelProducts) || []) { if (ch.channelServiceType && ch.channelServiceType !== 'STOREFARM') continue;
    L.push({ originNo: String(c.originProductNo || ch.originProductNo || ''), no: String(ch.channelProductNo || ''), name: String(ch.name || '').slice(0, 200), sku: ch.sellerManagementCode ? String(ch.sellerManagementCode) : null, price: num(ch.salePrice), disc: ch.discountedPrice != null ? num(ch.discountedPrice) : null, qty: num(ch.stockQuantity), st: String(ch.statusType || ''), disp: ch.channelProductDisplayStatusType || null, live: ch.statusType === 'SALE' && ch.channelProductDisplayStatusType !== 'SUSPENSION', cat: ch.categoryId || null, regAt: ch.regDate || null, modAt: ch.modifiedDate || null }); }
  return L; }
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
  const ST = rd(SF, {}); const st = { ordCur: ST.ordCur || 0, ordAt: ST.ordAt || 0, ordN: ST.ordN || 0, ordErr: ST.ordErr || null, prdAt: ST.prdAt || 0, prdN: ST.prdN || 0, prdErr: ST.prdErr || null, test: ST.test || null, write: ST.write || { on: false }, seen: ST.seen || [], sig: ST.sig || {}, cats: ST.cats || null };
  const save = () => wr(SF, { ordCur: st.ordCur, ordAt: st.ordAt, ordN: st.ordN, ordErr: st.ordErr, prdAt: st.prdAt, prdN: st.prdN, prdErr: st.prdErr, test: st.test, write: st.write, seen: st.seen.slice(-60), sig: st.sig, cats: st.cats });
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
  let chain = Promise.resolve(); /* 한 번에 하나씩 */
  function raw(method, p, opt) { const run = async () => { const gap = Math.max(TEST ? 0 : 300, +NC().minGapMs || 600); const w = M.last + gap - now(); if (w > 0) await sleep(w); if (M.cool > now()) return { http: 0, j: { code: 'COOL' }, cool: true };
      M.last = now(); if (M.calls.d !== kday()) M.calls = { d: kday(), n: 0 }; M.calls.n++;
      const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), (opt && opt.ms) || 30000); let r, txt = '';
      try { r = await fetch(BASE() + p, { method, headers: { Accept: 'application/json;charset=UTF-8', ...((opt && opt.headers) || {}) }, body: opt && opt.body, signal: ac.signal, redirect: 'error' }); txt = await r.text(); } catch (e) { clearTimeout(tm); return { http: 0, j: { code: 'NET', message: '네이버에 닿지 못함(' + (e.name === 'AbortError' ? '시간 넘음' : '연결') + ')' } }; }
      clearTimeout(tm); let j = null; try { j = txt ? JSON.parse(txt) : {}; } catch (e) { j = { message: txt.slice(0, 120) }; }
      if (r.status === 429) { M.coolN++; const s = Math.min(600, (+NC().cool429Sec || 30) * 2 ** (M.coolN - 1)); M.cool = now() + s * 1000; note(`🟩 네이버 요청량 제한(429) — ${s}초 쉼`, { k: 'rest', m: '네이버' }); } else if (r.ok) M.coolN = 0;
      return { http: r.status, j, ok: r.ok }; }; const pr = chain.then(run, run); chain = pr.catch(() => {}); return pr; }
  async function token(force, cr) { cr = cr || (await credLoad()); if (!cr) return { ok: false, err: '저장된 애플리케이션 ID·시크릿 없음 — 웹앱 ⚙ 🟩 칸에서 넣어 주세요', none: true };
    if (!force && M.tok && M.tokExp - now() > 5 * 60e3) return { ok: true };
    let sign; const ts = now(); try { sign = nvSign(cr.id, cr.sec, ts); } catch (e) { return { ok: false, err: '시크릿 꼴이 아님($2a$로 시작하는 값이어야 함 — 커머스API센터에서 복사한 그대로)', auth: true, code: 'SECRET_FORM' }; }
    const body = new URLSearchParams({ client_id: cr.id, timestamp: String(ts), client_secret_sign: sign, grant_type: 'client_credentials', type: 'SELF' }).toString(); sign = null;
    const r = await raw('POST', '/v1/oauth2/token', { body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (r.ok && r.j && r.j.access_token) { M.tok = String(r.j.access_token); M.tokExp = now() + Math.max(60, +r.j.expires_in || 10800) * 1000; return { ok: true }; }
    M.tok = null; const e = r.cool ? { code: 'COOL', msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: e.msg, code: e.code, auth: !!e.auth, ip: !!e.ip, later: !!(e.later || e.rate || r.http === 0) }; }
  async function call(method, p, body, q) { const t = await token(); if (!t.ok) return { ok: false, err: t.err, code: t.code, ip: t.ip };
    const qs = q ? '?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== '').flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]))).toString() : '';
    const go = () => raw(method, p + qs, { body: body == null ? undefined : JSON.stringify(body), headers: { Authorization: 'Bearer ' + M.tok, ...(body == null ? {} : { 'Content-Type': 'application/json' }) } });
    let r = await go(); if (r.http === 401) { const t2 = await token(true); if (t2.ok) r = await go(); } /* 원문 docs/auth 'API 인증 실패 후 재시도' */
    if (r.ok) return { ok: true, j: r.j }; const e = r.cool ? { code: 'COOL', msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: e.msg, code: e.code, ip: !!e.ip, later: !!(e.later || e.rate || r.cool), http: r.http, j: r.j }; }

  /* ── 연결 시험 = 토큰 받기 + 상품 1건 조회(읽기만) ── */
  async function test(cr, why) { M.step = '연결 시험'; const t0 = now(); const t = await token(true, cr); let res;
    if (!t.ok) res = { ok: false, at: now(), msg: t.err, code: t.code || null, auth: !!t.auth, ip: !!t.ip, later: !!t.later };
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
  async function pullOrd(why) { const C = NC(); const t0 = now(); let from = st.ordCur || t0 - (+C.firstH || 72) * 3600e3; const ids = new Set(); let calls = 0, more = null, err = null;
    M.step = '주문 변경 읽기';
    while (calls < (+C.maxCalls || 60) / 2 && from < t0) { const to = Math.min(from + 24 * 3600e3 - 1, t0); const q = { lastChangedFrom: kstIso(more ? more.from : from), lastChangedTo: kstIso(to), ...(more ? { moreSequence: more.seq } : {}) };
      const r = await call('GET', '/v1/pay-order/seller/product-orders/last-changed-statuses', null, q); calls++; if (!r.ok) { err = r.err; break; }
      const d = (r.j && r.j.data) || {}; for (const x of d.lastChangeStatuses || []) if (x && x.productOrderId) ids.add(String(x.productOrderId));
      if (d.more && d.more.moreFrom && d.more.moreSequence) { more = { from: Date.parse(d.more.moreFrom) || from, seq: String(d.more.moreSequence) }; continue; } more = null; from = to + 1; }
    const L = [...ids]; let n = 0;
    for (let i = 0; i < L.length && !err; i += 300) { M.step = `주문 상세 ${i}/${L.length}`; const r = await call('POST', '/v1/pay-order/seller/product-orders/query', { productOrderIds: L.slice(i, i + 300), quantityClaimCompatibility: true }); if (!r.ok) { err = r.err; break; }
      for (const x of (r.j && r.j.data) || []) { const v = nvOrd(x); if (!v.id) continue; v.ch = 'naver'; v.seenAt = new Date().toISOString(); const s = sigOf({ ...v, seenAt: 0 }); if (st.sig['o' + v.id] === s) continue; st.sig['o' + v.id] = s; push('crm_naver_orders', v.id, v); n++; } }
    if (!err) st.ordCur = Math.max(st.ordCur || 0, from - 5 * 60e3); /* 5분 겹쳐 읽음(같은 줄은 지문으로 거름) */
    st.ordAt = now(); st.ordN = n; st.ordErr = err; trimSig(); save(); M.step = '';
    note(`🟩 네이버 주문 읽기 — 바뀐 상품 주문 ${L.length}건 · 새로 넘길 ${n}건${err ? ' · 실패: ' + err : ''} (${why || ''})`, { k: err ? 'err' : 'read', l: err ? 'warn' : 'detail', m: '네이버' }); return { ok: !err, n, ids: L.length, err }; }
  /* ── 상품 목록 읽기(search · 100개씩 · 바뀐 줄만 넘김) ── */
  async function pullPrd(why) { const C = NC(); let page = 1, total = 0, n = 0, err = null; M.step = '상품 목록 읽기';
    for (; page <= Math.max(1, +C.maxCalls || 60); page++) { const r = await call('POST', '/v1/products/search', { page, size: 100, orderType: 'NO' }); if (!r.ok) { err = r.err; break; } const cs = (r.j && r.j.contents) || []; total = num(r.j && r.j.totalElements) || total;
      for (const c of cs) for (const v of nvPrd(c)) { if (!v.originNo) continue; const s = sigOf(v); if (st.sig['p' + v.originNo] === s) continue; st.sig['p' + v.originNo] = s; push('nv_listings', v.originNo, { ...v, ch: 'naver', seenAt: new Date().toISOString() }); n++; }
      if (cs.length < 100 || (r.j && r.j.last)) break; }
    st.prdAt = now(); st.prdN = total; st.prdErr = err; save(); M.step = ''; note(`🟩 네이버 상품 목록 — 전체 ${total}건 · 바뀐 ${n}건${err ? ' · 실패: ' + err : ''} (${why || ''})`, { k: err ? 'err' : 'read', l: err ? 'warn' : 'detail', m: '네이버' }); return { ok: !err, total, n, err }; }
  const trimSig = () => { const ks = Object.keys(st.sig); if (ks.length > 20000) for (const k of ks.slice(0, ks.length - 20000)) delete st.sig[k]; };
  /* 도서 › 중고 카테고리 찾기(등록 설정용 · 읽기만) */
  async function cats() { const r = await call('GET', '/v1/categories', null, { last: true }); if (!r.ok) return { ok: false, err: r.err }; const L = (Array.isArray(r.j) ? r.j : (r.j && r.j.contents) || []).filter((c) => /^도서/.test(String(c.wholeCategoryName || '')) && /중고/.test(String(c.wholeCategoryName || ''))).slice(0, 40).map((c) => ({ id: String(c.id), n: String(c.wholeCategoryName) })); st.cats = { at: now(), L }; save(); return { ok: true, L }; }

  /* ── 실제 쓰기(기본 끔) — 할 일 { id, k: confirm|dispatch|status|reg, ... } ── */
  const wOn = () => !!(st.write && st.write.on);
  function setWrite(on, by) { if (on && !(st.test && st.test.ok)) return { ok: false, err: '연결 시험이 맞은 뒤에 켤 수 있음' }; st.write = { on: !!on, by: String(by || '').slice(0, 40), at: now() }; save(); note(`🟩 네이버 실제 쓰기 ${on ? '켬' : '끔'} — ${st.write.by}`, { k: 'sys', l: on ? 'warn' : 'ok', m: '네이버' }); return { ok: true, write: st.write }; }
  function jobPut(j, by) { if (!wOn()) return { ok: false, err: '네이버 실제 쓰기가 꺼져 있음(⚙ 🟩 칸에서 두 번 눌러 켬)' }; const id = String((j && j.id) || ''); if (!/^[\w.:|-]{4,120}$/.test(id)) return { ok: false, err: '할 일 열쇠 없음' };
    if (M.jd[id]) return { ok: true, dup: true, res: M.jd[id] }; if (M.jobs.some((x) => x.id === id)) return { ok: true, dup: true, queued: true };
    const k = String(j.k || ''); if (!/^(confirm|dispatch|status|reg)$/.test(k)) return { ok: false, err: '모르는 할 일' };
    if (k === 'dispatch') { for (const d of j.rows || []) { const key = String(d.co || '') + ':' + String(d.no || ''); const was = M.inv[key]; if (was && was !== String(d.po)) return { ok: false, err: `송장번호 ${String(d.no).slice(-4)}는 다른 주문에 이미 썼음(약속 10)` }; } }
    M.jobs.push({ ...j, id, k, by: String(by || '').slice(0, 40), at: now() }); M.jres[id] = { st: 'queued', at: now() }; kick(300); return { ok: true, queued: true }; }
  /* (0.1.22 naver2) 상품 사진 올리기 — 우리 Firebase 사진 저장소 주소만 받아(다른 곳은 거절) 내려받고 → POST /v1/product-images/upload(multipart · imageFiles 최대 10장 · JPG·GIF·PNG·BMP) → 네이버 주소
   *  원문: 등록 몸의 이미지 주소는 반드시 이 API로 올리고 받은 주소여야 함(RAW_API.md 'images') · 사진은 메모리에서만(파일로 남기지 않음) */
  const IMG_OK = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/readnow-3a385\.firebasestorage\.app\/o\//;
  async function upImgs(urls) { const L = (urls || []).map(String).filter((u) => IMG_OK.test(u)).slice(0, 10); if (!L.length) return { ok: false, err: '사진 주소 없음(우리 사진 저장소 주소만 받음)' }; const fd = new FormData(); let n = 0;
    for (const u of L) { try { const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 30000); const r = await fetch(TEST && process.env.RN_COL2_NVIMG ? process.env.RN_COL2_NVIMG + '?u=' + encodeURIComponent(u) : u, { signal: ac.signal, redirect: 'error' }); clearTimeout(tm); if (!r.ok) continue; const b = Buffer.from(await r.arrayBuffer()); if (!b.length || b.length > 10 * 1048576) continue; const ty = /png/i.test(r.headers.get('content-type') || '') ? 'image/png' : 'image/jpeg'; fd.append('imageFiles', new Blob([b], { type: ty }), `p${++n}.${ty === 'image/png' ? 'png' : 'jpg'}`); } catch (e) {} }
    if (!n) return { ok: false, err: '사진을 내려받지 못함' }; const t = await token(); if (!t.ok) return { ok: false, err: t.err };
    const go = () => raw('POST', '/v1/product-images/upload', { body: fd, headers: { Authorization: 'Bearer ' + M.tok }, ms: 60000 }); let r = await go(); if (r.http === 401) { const t2 = await token(true); if (t2.ok) r = await go(); }
    if (!r.ok) { const e = r.cool ? { msg: '요청량 제한으로 쉬는 중' } : nvErr(r.http, r.j); return { ok: false, err: '사진 올리기 실패 — ' + e.msg, later: !!(e.later || e.rate || r.cool) }; }
    const out = ((r.j && r.j.images) || []).map((x) => x && x.url).filter(Boolean); return out.length ? { ok: true, urls: out } : { ok: false, err: '사진 올리기 응답에 주소 없음' }; }
  async function jobRun(j) { M.step = '쓰기 ' + j.k; let r;
    if (j.k === 'confirm') r = await call('POST', '/v1/pay-order/seller/product-orders/confirm', { productOrderIds: (j.ids || []).map(String).slice(0, 30) });
    else if (j.k === 'dispatch') r = await call('POST', '/v1/pay-order/seller/product-orders/dispatch', { dispatchProductOrders: (j.rows || []).slice(0, 30).map((d) => ({ productOrderId: String(d.po), deliveryMethod: 'DELIVERY', deliveryCompanyCode: String(d.co), trackingNumber: String(d.no), dispatchDate: kstIso(now()) })) });
    else if (j.k === 'status') r = await call('PUT', `/v1/products/origin-products/${encodeURIComponent(String(j.originNo))}/change-status`, { statusType: String(j.to || 'SUSPENSION'), ...(j.stock != null ? { stockQuantity: +j.stock } : {}) });
    else if (j.k === 'reg') { const g = { ...(NC().reg || {}), ...(j.g || {}) }; let book = { ...(j.book || {}) }; const m0 = nvBody({ ...book, images: book.images && book.images.length ? book.images : ['x'] }, g); /* 사진 말고 빠진 칸이 있으면 사진을 올리지 않음 */
      if (!m0.ok) r = { ok: false, err: '빠진 칸: ' + m0.miss.join('·') }; else { if (!(book.images && book.images.length)) { M.step = '사진 올리기'; const u = await upImgs(j.imgs); if (u.ok) book.images = u.urls; else r = { ok: false, err: u.err, later: u.later }; }
        if (!r) { const b = nvBody(book, g); if (!b.ok) r = { ok: false, err: '빠진 칸: ' + b.miss.join('·') }; else r = await call('POST', '/v2/products', b.body); } } }
    /* 원문: 발주 확인·발송 처리 응답 data.successProductOrderIds / failProductOrderInfos */
    const d = (r && r.j && r.j.data) || {}; const fails = (d.failProductOrderInfos || []).map((x) => `${x.productOrderId}: ${x.message || x.code || ''}`).slice(0, 5);
    const res = r.ok && !fails.length ? { st: 'done', at: now(), ok: true, ...(j.k === 'reg' ? { originNo: r.j && r.j.originProductNo ? String(r.j.originProductNo) : null, chNo: r.j && r.j.smartstoreChannelProductNo ? String(r.j.smartstoreChannelProductNo) : null } : {}) } : { st: 'fail', at: now(), ok: false, err: (r.ok ? '일부 실패 — ' + fails.join(' · ') : r.err).slice(0, 300), later: !!r.later };
    if (res.ok && j.k === 'dispatch') { for (const x of j.rows || []) M.inv[String(x.co) + ':' + String(x.no)] = String(x.po); wr(INVF, M.inv); }
    /* (0.1.22 naver2) 판매 상태가 맞게 바뀌면 그 매물 줄을 곧바로 고쳐 넘김(6시간 목록 읽기를 기다리지 않음 — 🧾 🛠 처리할 일·🤖 자동 내림이 반영을 바로 봄) · 지문을 지워 다음 목록 읽기가 네이버 값으로 다시 덮음 */
    if (res.ok && j.k === 'status' && j.originNo) { const to = String(j.to || 'SUSPENSION'); const on = to === 'SALE'; push('nv_listings', String(j.originNo), { originNo: String(j.originNo), st: to, live: on && !(j.stock != null && +j.stock <= 0), ...(j.stock != null ? { qty: +j.stock } : on ? {} : { qty: 0 }), ch: 'naver', chgAt: new Date().toISOString(), chgBy: 'job' }); delete st.sig['p' + String(j.originNo)]; save(); }
    if (res.ok && j.k === 'reg') nextPrd = 0; /* (naver2) 등록이 맞으면 다음 돌기에 상품 목록을 다시 읽음(통합 장부에 바로 붙게) */
    if (res.ok && (j.k === 'dispatch' || j.k === 'confirm')) nextOrd = 0; /* (naver2) 발주 확인·발송 처리가 맞으면 다음 돌기에 주문을 곧바로 다시 읽음(📦 오늘 출고 단계가 10분 기다리지 않음) */
    if (!res.later) { M.jd[j.id] = res; wr(JDF, M.jd); } M.jres[j.id] = res; push('col2_naver_jobs', j.id.replace(/[^\w.-]/g, '_').slice(0, 140), { id: j.id, k: j.k, by: j.by, ...res }); M.step = '';
    note(`🟩 네이버 쓰기 ${j.k} — ${res.ok ? '맞음' : '실패: ' + res.err}`, { k: res.ok ? 'sys' : 'err', l: res.ok ? 'ok' : 'warn', m: '네이버' }); return res; }

  /* ── 돌기 ── */
  let nextOrd = 0, nextPrd = 0;
  async function tick(why) { if (M.busy || !mine()) return; M.busy = true; try { if (!(await keyReady()).ok) return; const cr = await credLoad(); if (!cr) return; if (M.cool > now()) return;
      if (st.test && st.test.auth) return; /* 인증이 틀린 값으로 되풀이해 두드리지 않음 — 새 값을 넣거나 다시 시험하면 풀림 */
      while (M.jobs.length && wOn()) { const j = M.jobs.shift(); await jobRun(j); if (M.cool > now()) break; }
      const C = NC(); if (now() >= nextOrd) { nextOrd = now() + Math.max(1, +C.ordMin || 10) * 60e3; await pullOrd(why || '주기'); }
      if (now() >= nextPrd) { nextPrd = now() + Math.max(0.5, +C.prdH || 6) * 3600e3; await pullPrd(why || '주기'); } }
    catch (e) { log('네이버 돌기 오류: ' + e.message); } finally { M.busy = false; } }
  function kick(ms) { clearTimeout(M.t); M.t = setTimeout(() => tick('바로').catch(() => {}), ms || 500); }
  function start() { setInterval(() => tick().catch(() => {}), TEST ? 1000 : 60e3); if (mine()) setTimeout(() => keyReady().catch(() => {}), TEST ? 100 : 3000); kick(TEST ? 400 : 20e3); }

  /* ── 웹앱 다리 ── */
  function sum() { const on = mine(); return { on, why: on ? '' : '네이버 일은 로거 PC만(정범님 11/11 지정)', pub: on ? M.pub : null, cred: on ? credSum() : { has: false }, test: st.test, write: st.write, step: M.step,
    ord: { at: st.ordAt, n: st.ordN, err: st.ordErr, cur: st.ordCur }, prd: { at: st.prdAt, n: st.prdN, err: st.prdErr }, cool: M.cool > now() ? M.cool : 0, q: M.q.length, jobs: M.jobs.length, calls: M.calls.n, cats: st.cats }; }
  async function cmd(c) { c = c || {}; const k = String(c.k || ''); if (!mine()) return { ok: false, err: '네이버 일은 로거 PC만' };
    if (k === 'cred') return credPut(c.env, c.by); if (k === 'test') return retest('웹앱 단추 · ' + String(c.by || '').slice(0, 30));
    if (k === 'sync') { nextOrd = 0; if (c.prd) nextPrd = 0; kick(200); return { ok: true }; }
    if (k === 'write') return setWrite(c.on === true, c.by); if (k === 'job') return jobPut(c.job, c.by); if (k === 'cats') return cats();
    return { ok: false, err: '모르는 명령' }; }
  function feed(o2) { for (const k of (o2 && o2.ack) || []) { const i = M.q.findIndex((x) => x.k === k); if (i >= 0) { M.q.splice(i, 1); M.qk.delete(k); } } return { ok: true, st: sum(), out: M.q.slice(0, 150), jres: M.jres }; }
  return { start, tick, kick, sum, cmd, feed, keyReady, M, st };
}
module.exports = { makeNv, nvOrd, nvPrd, nvBody, nvErr, kstIso };
