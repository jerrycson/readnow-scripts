/* 🛍 우리숍 booksqueen.com — 손님 창구 (11/11 · 일꾼 shop1 · PLATFORM_PLAN 3-3 '손님 브라우저는 Firestore를 직접 읽지 않음')
 *  손님 화면(shop/ · Firebase Hosting 둘째 사이트)이 부르는 클라우드 주소 — 모두 로그인 없음 · 손님 정보는 shop_orders에만(관리 기기·클라우드만 읽음)
 *    GET  /shop/cfg              가게 설정 중 공개할 것(열림·배송비·입금 기한·사업자 표시·분야 목록·상품 수) — 계좌는 열렸을 때만
 *    GET  /shop/list?q&c&g&s&p   판매중 책 목록(24권씩) · q 낱말(제목·지은이·출판사·ISBN) · c 분야 · g 등급 · s new|low|high
 *    GET  /shop/item?id          책 한 권(사진·정가·출판일·같은 책 다른 매물)
 *    POST /shop/order            주문 접수(무통장 입금) — 값은 서버가 다시 셈 · 한 권 상품은 접수 즉시 '주문 중'(shop_holds · 트랜잭션 — 같은 책 두 주문 0)
 *    GET  /shop/order?no&t       주문 확인(주문 번호 + 조회 열쇠 — 열쇠는 해시만 저장) · 이름은 가려서
 *    POST /shop/cancel {no,t}    손님 취소(입금 확인 전만) → '주문 중' 풂
 *  공개 요약에 넣는 칸(이것뿐): 상품 번호·제목·지은이·출판사·출판일·분야·등급·판매가·정가·표지/실물 사진·ISBN·들어온 날
 *  넣지 않는 것: SKU(서가·매입처 칸이 들어 있음)·매입가·판매자 분류·시장 지표·손님 정보 · 미끼(DUPES)·19금·판매중 아님·값 없음은 목록에서 뺌
 *  읽기 비용: 처음(또는 FULL_H시간마다) 판매중 상품 전체 + 그 도서 정보 한 번 → 그 뒤 DELTA_MIN분마다 바뀐 상품(uploadedAt)만 · 도서 정보는 새 책만 */
'use strict';
const crypto = require('crypto');
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
    im: cover || ph[0] || null, ph, isbn: /^97[89]\d{10}$/.test(String(l.isbn13 || b.isbn13 || '')) ? String(l.isbn13 || b.isbn13) : null, q: Math.max(1, +l.qty || 1), at: tsIso(l.registeredAt) || tsIso(l.firstSeenAt) || null };
}
const norm = (x) => String(x || '').toLowerCase().replace(/[\s\-_.,·:;!?'"()[\]{}<>/\\]+/g, '');
/* 목록 거르기·정렬·쪽 — 순수 셈(시험 tSHOP1111) */
function listItems(all, o, held) {
  o = o || {}; const q = String(o.q || '').trim(); const toks = q.split(/\s+/).map(norm).filter(Boolean); const dig = q.replace(/\D/g, '');
  let L = all.filter((x) => (!o.c || x.c === o.c) && (!o.g || x.g === o.g));
  if (toks.length) L = L.filter((x) => { if (dig.length >= 10 && x.isbn && x.isbn.includes(dig)) return true; const h = norm(x.t + ' ' + (x.a || '') + ' ' + (x.pb || '')); return toks.every((k) => h.includes(k)); });
  const srt = o.s === 'low' ? (a, b) => a.p - b.p : o.s === 'high' ? (a, b) => b.p - a.p : (a, b) => String(b.at || '').localeCompare(String(a.at || ''));
  L = L.slice().sort(srt); const p = Math.max(0, Math.min(500, parseInt(o.p, 10) || 0)); const H = held || new Set();
  return { total: L.length, p, more: (p + 1) * PAGE < L.length, items: L.slice(p * PAGE, (p + 1) * PAGE).map((x) => ({ id: x.id, t: x.t, a: x.a, g: x.g, p: x.p, lp: x.lp, im: x.im, st: H.has(x.id) ? 'o' : 's' })) };
}
/* 손님 주문 입력 검사 — 순수 셈 · 돌려줌 { ok, err, v } */
const PHONE = /^01[016789]\d{7,8}$/;
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
  const dep = s(b.depositor, 20) || name;
  return { ok: true, v: { ids, buyer: { name, phone: ph }, rcv: { name: rn, phone: rp, zip, addr1: a1, addr2: a2, memo: s(r.memo, 100) || null }, depositor: dep } };
}
const shipFeeOf = (sum, cfg) => { const f = num((cfg || DEF).shipFee); const fo = num((cfg || DEF).freeOver); return fo && sum >= fo ? 0 : f; };
const maskName = (n) => { const a = [...String(n || '')]; return a.length <= 1 ? '*' : a[0] + '*'.repeat(Math.max(1, a.length - 2)) + (a.length > 2 ? a[a.length - 1] : ''); };
const B32 = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const orderNo = (now, rnd) => { const d = new Date(now + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); const r = rnd || crypto.randomBytes(5); let x = ''; for (let i = 0; i < 5; i++) x += B32[r[i] % B32.length]; return 'BQ' + d + '-' + x; };
const hashTok = (t) => crypto.createHash('sha256').update('bq|' + String(t || '')).digest('hex');
/* 공개해도 되는 가게 설정만 */
function pubCfg(c, meta) {
  c = { ...DEF, ...(c || {}) }; const bz = c.biz || {}; const bank = c.bank || {}; const bankOk = !!(bank.name && bank.acct && bank.holder);
  return { open: c.open ? 1 : 0, name: s(c.name, 20) || DEF.name, shipFee: num(c.shipFee), freeOver: num(c.freeOver), payDays: Math.max(1, Math.min(7, +c.payDays || DEF.payDays)), maxItems: Math.max(1, Math.min(50, +c.maxItems || DEF.maxItems)),
    pay: c.open && bankOk ? { how: 'bank', bank: s(bank.name, 20), acct: s(bank.acct, 30), holder: s(bank.holder, 20) } : { how: 'wait' }, pg: 0 /* 카드·간편결제(PG)는 계약 뒤 — 자리만 */,
    biz: { name: s(bz.name, 40) || null, ceo: s(bz.ceo, 20) || null, addr: s(bz.addr, 120) || null, tel: s(bz.tel, 20) || null, email: s(bz.email, 60) || null, no: s(bz.no, 20) || null, mo: s(bz.mo, 40) || null, cpo: s(bz.cpo, 20) || null, host: 'Google Firebase(구글)' },
    notice: s(c.notice, 300) || null, n: meta ? meta.n : null, cats: meta ? meta.cats : [], at: meta ? meta.at : null };
}

function makeShop({ db, C, FV, log }) {
  const CAT = { items: new Map(), books: new Map(), full: 0, delta: 0, busy: null, err: null };
  let CFG = { v: null, at: 0 }; let HELD = { v: new Set(), at: 0 }; const RL = new Map();
  const cfg = async () => { if (CFG.v && Date.now() - CFG.at < 60e3) return CFG.v; try { const d = await C('app_settings').doc('shop').get(); CFG = { v: { ...DEF, ...(d.exists ? d.data() : {}) }, at: Date.now() }; } catch (e) { CFG = { v: CFG.v || { ...DEF }, at: Date.now() - 50e3 }; } return CFG.v; };
  const held = async (force) => { if (!force && Date.now() - HELD.at < 20e3) return HELD.v; try { const ss = await C('shop_holds').where('on', '==', 1).get(); const v = new Set(); ss.forEach((d) => v.add(d.id)); HELD = { v, at: Date.now() }; } catch (e) { HELD.at = Date.now() - 10e3; } return HELD.v; };
  async function booksFor(ids) { const need = [...new Set(ids.filter((x) => x && !CAT.books.has(x)))]; for (let i = 0; i < need.length; i += 200) { const ss = await db.getAll(...need.slice(i, i + 200).map((x) => C('prd_books').doc(String(x)))); ss.forEach((d) => CAT.books.set(d.id, d.exists ? slimB(d.data()) : null)); } }
  const slimB = (b) => ({ title: b.title, author: b.author, contributors: (b.contributors || []).slice(0, 2).map((c) => ({ name: c && c.name })), publisher: b.publisher, pubDate: b.pubDate, categories: (b.categories || []).slice(0, 1), images: b.images && b.images.front ? { front: b.images.front } : null, cover: b.cover, priceList: b.priceList, isbn13: b.isbn13, adult: b.adult });
  const put = (id, l) => { const it = pubItem(id, l, l && l.bookId ? CAT.books.get(String(l.bookId)) : null); if (it) CAT.items.set(String(id), it); else CAT.items.delete(String(id)); };
  async function build() { if (CAT.busy) return CAT.busy; CAT.busy = (async () => { try { const c = await cfg(); const now = Date.now(); const full = !CAT.full || now - CAT.full > (c.fullH || DEF.fullH) * 3600e3;
      if (!full && now - CAT.delta < (c.deltaMin || DEF.deltaMin) * 60e3) return;
      const F = ['status', 'active', 'qty', 'price', 'grade', 'sku', 'adult', 'title', 'isbn13', 'bookId', 'photos', 'registeredAt', 'firstSeenAt', 'priceList', 'author', 'publisher'];
      let ss; const since = new Date((full ? now : CAT.delta) - 5 * 60e3); /* 5분 겹쳐 읽음(쓰기 시각 어긋남) */
      if (full) ss = await C('prd_listings').where('status', '==', '판매중').select(...F).get(); else ss = await C('prd_listings').where('uploadedAt', '>', since).select(...F).get();
      const docs = []; ss.forEach((d) => docs.push([d.id, d.data() || {}])); await booksFor(docs.map(([, l]) => l.bookId && String(l.bookId)).filter(Boolean));
      if (full) CAT.items.clear(); for (const [id, l] of docs) put(id, l); if (full) CAT.full = now; CAT.delta = now; CAT.err = null;
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
        if (!it) return bad.push({ id: v.ids[i], why: '방금 팔렸거나 판매를 멈춘 책' }); if (h && h.on) return bad.push({ id: v.ids[i], t: it.t, why: '다른 분이 먼저 주문한 책' });
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

  /* HTTP — 처리했으면 true */
  async function handle(req, res, path) {
    if (!/^\/shop\//.test(path)) return false;
    const origin = req.headers.origin || ''; const extra = String(process.env.SHOP_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
    if ([...SHOP_ORIGINS, ...extra].includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
    const send = (code, obj, cache) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store', 'X-Robots-Tag': 'noindex' }); res.end(JSON.stringify(obj)); return true; };
    const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    try {
      if (limited('r' + ipKey(req), 240, 60e3)) return send(429, { ok: false, err: '잠시 뒤 다시 해 주세요' });
      if (path === '/shop/cfg') { await ready(); return send(200, { ok: true, ...pubCfg(await cfg(), CAT.meta), err: CAT.err && !CAT.items.size ? '목록 준비 중' : null }, 'public, max-age=60'); }
      if (path === '/shop/list') { await ready(); const H = await held(); const r = listItems([...CAT.items.values()], q, H); return send(200, { ok: true, ...r, at: CAT.meta && CAT.meta.at }, 'public, max-age=30'); }
      if (path === '/shop/item') { await ready(); const it = CAT.items.get(s(q.id, 80)); const H = await held(); if (!it) return send(404, { ok: false, err: '판매가 끝났거나 없는 책입니다' });
        const same = it.isbn ? [...CAT.items.values()].filter((x) => x.isbn === it.isbn && x.id !== it.id).slice(0, 6).map((x) => ({ id: x.id, g: x.g, p: x.p, st: H.has(x.id) ? 'o' : 's' })) : [];
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
  return { handle, build, _cat: CAT };
}

module.exports = { makeShop, pubItem, listItems, checkOrder, shipFeeOf, pubCfg, maskName, orderNo, hashTok, DEF, SHOP_ORIGINS, PAGE };
