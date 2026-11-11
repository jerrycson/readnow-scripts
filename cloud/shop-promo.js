/* 🏷 우리숍(booksqueen.com) 판매가 규칙 · 배지 · 묶음 할인 · 쿠폰 — 순수 셈 (11/11 일꾼 shopc1 · 시험 tSHOPC1111)
 *  우리숍 판매가만 바꿈: 상품 문서(prd_listings.price = 알라딘 판매가)는 그대로 두고, 클라우드 창구가 손님에게 보일 때·주문 받을 때 규칙을 얹어 셈
 *    → 알라딘·예스24 판매가와 따로 · 되돌리기 = 규칙 끄기(기록은 남음 · 지우지 않음) · 끄면 다음 1분 안에 원래 판매가
 *  설정 자리: app_settings/shop_promo { rules[], newDays, saleBadge, bundle{on,n,pct,won}, coupons[], at, by } — 관리 웹앱 🛍 우리숍 › 🏷 할인·배지에서 씀
 *  규칙 하나 = { id, nm, on, at, by, from, until, w(고르기), act{how:'pct'|'won', v(−는 할인 · +는 인상)}|null, b[배지], round, floor, cap, off{at,by}|null }
 *  겹칠 때(근거: Shopify 자동 할인·쿠팡 즉시 할인은 '한 상품에 할인 하나'): 값은 '가장 나중에 만든 켜진 규칙 하나'만 · 배지는 맞는 규칙 것을 모두 합침
 *  고르기(w) — 조건을 여러 개 주면 모두 맞아야 함(그리고) · 목록 칸 안은 하나만 맞으면 됨(또는):
 *    ids 상품 번호[] · isbn[] · k 상품 종류[](kr 국내도서·en 외국도서·cd·dvd·br 블루레이·etc) · g 등급[] · pMin·pMax 판매가(규칙 전 값) · code 관리 코드(SKU) 앞부분[]
 *    q 낱말(모두 들어감 — 제목·지은이·출판사·분야) · xq 뺄 낱말(하나라도 있으면 뺌) · a 지은이 · pb 출판사 · c 분야 경로 낱말 · atFrom·atTo 들어온 날(한국 날짜) · ageMin 들어온 지 N일 넘음 · yMin·yMax 출판 연도 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQP = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const BADGES = { sale: '할인', new: 'NEW', pick: '추천', rare: '희귀', last: '마지막 1권', hot: '인기' };
  /* 'new' 배지 글은 '새상품'이 아니라 NEW(새로 들어옴) — 헌책방에서 '새상품'은 '안 쓴 새 책'으로 읽혀 표시광고법상 오해 소지 */
  const KINDS = { kr: '국내도서', en: '외국도서', cd: 'CD(음반)', dvd: 'DVD', br: '블루레이', etc: '기타·분류 모름' };
  const GRADES = ['최상', '상', '중', '하'];
  const ROUNDS = [1, 10, 100, 500, 1000];
  const DEFP = { rules: [], newDays: 7, saleBadge: true, bundle: { on: 0, n: 3, pct: 10, won: 0 }, coupons: [] };
  /* 근거: newDays 7일 = 손님 화면 '오늘·어제·N일 전' 표(shop4)와 같은 7일 · 묶음 3권 10%는 기본값일 뿐(근거 없음 · 꺼 둠) · 최저가 1,000원(근거 없음 — 배송비보다 싼 책을 더 깎지 않게 · 규칙마다 바꿈) */
  const FLOOR = 1000;
  const norm = (x) => String(x || '').toLowerCase().replace(/[\s\-_.,·:;!?'"()[\]{}<>/\\]+/g, '');
  const toks = (q) => String(q || '').split(/[\s,]+/).map(norm).filter(Boolean);
  const kst = (t) => { const v = typeof t === 'number' ? t : Date.parse(t || ''); return Number.isFinite(v) ? new Date(v + 9 * 3600e3).toISOString().slice(0, 10) : null; };
  const tms = (v) => { if (!v) return null; const t = Date.parse(v); return Number.isFinite(t) ? t : null; };
  const n0 = (v) => { const x = Math.round(+v); return Number.isFinite(x) && x > 0 ? x : 0; };
  const arr = (v, max) => (Array.isArray(v) ? v : String(v || '').split(/[\n,]+/)).map((x) => String(x == null ? '' : x).trim()).filter(Boolean).slice(0, max || 200);

  /* 상품 종류 — 알라딘 분류 경로 첫 칸(국내도서>…·외국도서>…·음반>…·DVD>…·블루레이>…) · 없으면 관리 코드(KHKDVD = DVD/블루레이 · KHKCPD = 음반 — 등록 화면 서가 코드) */
  function kindOf(path, sku) { const p = String(path || ''); const r = p.split('>')[0].trim(); const sk = String(sku || '').toUpperCase();
    if (/블루레이|blu-?ray/i.test(p)) return 'br'; if (/DVD/i.test(r)) return 'dvd'; if (/음반|^CD|music/i.test(r)) return 'cd'; if (/외국|foreign/i.test(r)) return 'en'; if (/국내|^도서|^책/.test(r)) return 'kr';
    if (/DVD/.test(sk)) return 'dvd'; if (/CPD/.test(sk)) return 'cd'; return 'etc'; }

  /* 고르기 다듬기(웹앱이 보낸 것 · 저장된 것 모두 이것을 거침) */
  function whereOf(w) { w = w && typeof w === 'object' ? w : {}; const o = {};
    const ids = arr(w.ids, 3000).filter((x) => /^[\w.-]{1,80}$/.test(x)); if (ids.length) o.ids = ids;
    const isbn = arr(w.isbn, 3000).map((x) => x.replace(/\D/g, '')).filter((x) => /^97[89]\d{10}$/.test(x)); if (isbn.length) o.isbn = isbn;
    const k = arr(w.k, 10).filter((x) => KINDS[x]); if (k.length) o.k = [...new Set(k)];
    const g = arr(w.g, 10).filter((x) => GRADES.includes(x)); if (g.length) o.g = [...new Set(g)];
    const code = arr(w.code, 50).map((x) => x.toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean); if (code.length) o.code = code;
    for (const f of ['pMin', 'pMax', 'ageMin', 'yMin', 'yMax']) { const v = n0(w[f]); if (v) o[f] = v; }
    for (const f of ['q', 'xq', 'a', 'pb', 'c']) { const v = String(w[f] || '').trim().slice(0, 80); if (v) o[f] = v; }
    for (const f of ['atFrom', 'atTo']) { const v = String(w[f] || '').slice(0, 10); if (/^\d{4}-\d\d-\d\d$/.test(v)) o[f] = v; }
    return o; }
  const whereEmpty = (w) => !Object.keys(whereOf(w)).length;
  /* 한 상품이 고르기에 맞나 — x = 공개 요약(규칙 전 값 p) · pv = 숨은 칸 { sku, cp(분류 경로), k } (밖으로 안 나감) */
  function match(x, pv, w, now) { if (!x) return false; pv = pv || {}; w = w || {}; const W = w;
    if (W.ids && !W.ids.includes(x.id)) return false; if (W.isbn && !(x.isbn && W.isbn.includes(x.isbn))) return false;
    if (W.k && !W.k.includes(pv.k || kindOf(pv.cp, pv.sku))) return false; if (W.g && !W.g.includes(x.g)) return false;
    if (W.pMin && !(x.p >= W.pMin)) return false; if (W.pMax && !(x.p <= W.pMax)) return false;
    if (W.code) { const sk = String(pv.sku || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!W.code.some((c) => sk.startsWith(c))) return false; }
    const hay = W.q || W.xq ? norm([x.t, x.a, x.pb, x.c, pv.cp].join(' ')) : '';
    if (W.q && !toks(W.q).every((t) => hay.includes(t))) return false; if (W.xq && toks(W.xq).some((t) => hay.includes(t))) return false;
    if (W.a && !norm(x.a).includes(norm(W.a))) return false; if (W.pb && !norm(x.pb).includes(norm(W.pb))) return false; if (W.c && !norm([x.c, pv.cp].join(' ')).includes(norm(W.c))) return false;
    const d = kst(x.at); if ((W.atFrom || W.atTo || W.ageMin) && !d) return false; if (W.atFrom && d < W.atFrom) return false; if (W.atTo && d > W.atTo) return false;
    if (W.ageMin) { const t = Date.parse(x.at); if (!((now || Date.now()) - t >= W.ageMin * 864e5)) return false; }
    if (W.yMin || W.yMax) { const y = parseInt(String(x.pd || '').slice(0, 4), 10); if (!y) return false; if (W.yMin && y < W.yMin) return false; if (W.yMax && y > W.yMax) return false; }
    return true; }

  /* 규칙 다듬기 */
  function ruleOf(r) { r = r && typeof r === 'object' ? r : {}; const a = r.act && typeof r.act === 'object' ? r.act : null; let act = null;
    if (a && (a.how === 'pct' || a.how === 'won')) { let v = Math.round(+a.v || 0); v = a.how === 'pct' ? Math.max(-90, Math.min(300, v)) : Math.max(-1e6, Math.min(1e6, v)); if (v) act = { how: a.how, v }; }
    const b = arr(r.b, 10).filter((x) => BADGES[x]); const rd = ROUNDS.includes(+r.round) ? +r.round : 100;
    return { id: String(r.id || '').replace(/[^\w-]/g, '').slice(0, 40) || 'r' + Date.now().toString(36), nm: String(r.nm || '').trim().slice(0, 60), on: r.on === 0 || r.on === false ? 0 : 1,
      at: r.at || null, by: r.by || null, from: tms(r.from) ? new Date(tms(r.from)).toISOString() : null, until: tms(r.until) ? new Date(tms(r.until)).toISOString() : null,
      w: whereOf(r.w), act, b: [...new Set(b)], round: rd, floor: r.floor === 0 || r.floor === '0' ? 0 : n0(r.floor) || FLOOR, cap: r.cap === 0 || r.cap === false ? 0 : 1, off: r.off && r.off.at ? { at: r.off.at, by: r.off.by || null } : null, n0: r.n0 != null ? +r.n0 || 0 : null }; }
  /* 지금 살아 있나 — 'on'(켜짐) · 'wait'(시작 전) · 'end'(기간 끝) · 'off'(되돌림·끔) */
  function ruleSt(r, now) { now = now || Date.now(); if (!r || r.off || !r.on) return 'off'; const f = tms(r.from), u = tms(r.until); if (f && now < f) return 'wait'; if (u && now >= u) return 'end'; return 'on'; }
  /* 판매가 하나 바꾸기 — 할인은 원래 값보다 오르지 않고 최저가(floor) 밑으로 안 내려감(이미 그 밑이면 그대로) · 인상은 정가(lp)를 넘지 않음(cap) */
  function newPrice(p, lp, r) { p = n0(p); if (!p || !r || !r.act) return p; const { how, v } = r.act; const rd = r.round || 100; const raw = how === 'pct' ? p * (1 + v / 100) : p + v; let x = Math.round(raw / rd) * rd;
    if (v < 0) { x = Math.min(x, p); const fl = Math.min(r.floor == null ? FLOOR : r.floor, p); x = Math.max(x, fl, rd === 1 ? 1 : rd); x = Math.min(x, p); }
    else { x = Math.max(x, p); if (r.cap !== 0 && lp > 0 && x > lp) x = Math.max(p, lp); } return x; }
  function promoOf(P) { P = P && typeof P === 'object' ? P : {}; const bd = P.bundle || {};
    return { rules: (Array.isArray(P.rules) ? P.rules : []).map(ruleOf).sort((a, b) => String(a.at || '').localeCompare(String(b.at || ''))), newDays: P.newDays == null ? DEFP.newDays : Math.max(0, Math.min(60, Math.round(+P.newDays) || 0)), saleBadge: P.saleBadge !== false && P.saleBadge !== 0,
      bundle: { on: bd.on ? 1 : 0, n: Math.max(2, Math.min(20, Math.round(+bd.n) || DEFP.bundle.n)), pct: Math.max(0, Math.min(50, Math.round(+bd.pct) || 0)), won: Math.max(0, Math.min(100000, Math.round(+bd.won) || 0)) },
      coupons: (Array.isArray(P.coupons) ? P.coupons : []).map(couponOf).filter(Boolean), at: P.at || null, _pp: 1 }; }
  /* 한 상품에 규칙 얹기 → { ...x, p(우리숍 판매가), p0(원래 값 — 바뀌었을 때만), bd[배지], pe(할인 끝 시각), rid(값을 정한 규칙) } */
  function applyOne(x, pv, PP, now) { if (!x) return x; now = now || Date.now(); const R = PP.rules || []; let pr = null; const bd = new Set();
    for (const r of R) { if (ruleSt(r, now) !== 'on' || !match(x, pv, r.w, now)) continue; if (r.act) pr = r; for (const b of r.b) bd.add(b); }
    const p = pr ? newPrice(x.p, x.lp, pr) : x.p; const o = { ...x, p };
    if (p !== x.p) { o.p0 = x.p; o.rid = pr.id; if (p < x.p && pr.until) o.pe = pr.until; }
    if (PP.newDays > 0 && x.at && now - Date.parse(x.at) < PP.newDays * 864e5) bd.add('new'); if (PP.saleBadge && p < x.p) bd.add('sale');
    if (bd.size) o.bd = Object.keys(BADGES).filter((k) => bd.has(k)); return o; }

  /* 👀 미리 보기 — 새 규칙 r을 '지금 켜진 가장 새 규칙'으로 얹었을 때 · items = 공개 요약[](규칙 전) · pvOf(id) = 숨은 칸 */
  function preview(items, pvOf, P, r, now) { now = now || Date.now(); const PP = P && P._pp ? P : promoOf(P); const R = ruleOf({ ...r, on: 1, off: null, from: null, until: null, at: '9999' }); const PP2 = { ...PP, rules: [...PP.rules, R] };
    const out = { n: 0, all: 0, up: 0, down: 0, same: 0, sum0: 0, sum1: 0, over: 0, floorHit: 0, capHit: 0, kinds: {}, grades: {}, sample: [], whole: whereEmpty(R.w) };
    for (const x of items || []) { if (!x) continue; out.all++; const pv = (pvOf && pvOf(x.id)) || {}; if (!match(x, pv, R.w, now)) continue; out.n++;
      const a = applyOne(x, pv, PP, now), b = applyOne(x, pv, PP2, now); out.sum0 += a.p; out.sum1 += b.p; if (b.p > a.p) out.up++; else if (b.p < a.p) out.down++; else out.same++;
      if (a.rid && R.act) out.over++; if (R.act && R.act.v < 0) { const raw = R.act.how === 'pct' ? x.p * (1 + R.act.v / 100) : x.p + R.act.v; if (b.p > Math.round(raw / R.round) * R.round) out.floorHit++; } if (R.act && R.act.v > 0 && x.lp && b.p === x.lp && R.cap) out.capHit++;
      const k = pv.k || kindOf(pv.cp, pv.sku); out.kinds[k] = (out.kinds[k] || 0) + 1; if (x.g) out.grades[x.g] = (out.grades[x.g] || 0) + 1;
      if (out.sample.length < 40) out.sample.push({ id: x.id, t: x.t, g: x.g || null, k, p: x.p, a: a.p, b: b.p, bd: b.bd || [] }); }
    return out; }

  /* 🎟 쿠폰 { code, nm, how pct|won, v, min(이 값 넘게 사면), from, until, on } — 번호는 손님 화면에 나가지 않음(가게가 따로 알림) */
  function couponOf(c) { if (!c || typeof c !== 'object') return null; const code = String(c.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20); if (code.length < 3) return null; const how = c.how === 'won' ? 'won' : 'pct';
    const v = how === 'pct' ? Math.max(1, Math.min(50, Math.round(+c.v) || 0)) : Math.max(100, Math.min(100000, Math.round(+c.v) || 0));
    return { code, nm: String(c.nm || '').trim().slice(0, 40) || code, how, v, min: n0(c.min), from: tms(c.from) ? new Date(tms(c.from)).toISOString() : null, until: tms(c.until) ? new Date(tms(c.until)).toISOString() : null, on: c.on === 0 || c.on === false ? 0 : 1, at: c.at || null }; }
  const couponFind = (PP, code, now) => { const k = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!k) return { c: null, why: null }; const c = (PP.coupons || []).find((x) => x.code === k); if (!c) return { c: null, why: '없는 쿠폰 번호입니다' };
    if (ruleSt(c, now) === 'wait') return { c: null, why: '아직 쓸 수 없는 쿠폰입니다' }; if (ruleSt(c, now) !== 'on') return { c: null, why: '기간이 끝났거나 멈춘 쿠폰입니다' }; return { c, why: null }; };
  const shipFeeOf = (sum, cfg) => { const f = n0((cfg || {}).shipFee); const fo = n0((cfg || {}).freeOver); return sum <= 0 ? 0 : fo && sum >= fo ? 0 : f; };
  /* 🧮 장바구니 값 — lines [{ id, p(규칙 얹은 우리숍 판매가) }] → 묶음 할인·쿠폰을 책마다 나눠 깎음(10원 단위 · 끝수는 가장 비싼 책) — 주문 기록·현금 판매 기록은 책값 합 = 낸 책값 그대로
   *  배송비는 깎은 뒤 책값으로 무료 배송 기준을 봄(근거: 쿠팡·알라딘 '결제 금액 기준 무료배송') */
  function quote(lines, P, cfg, code, now) { now = now || Date.now(); const PP = P && P._pp ? P : promoOf(P); const L = (lines || []).map((x) => ({ id: x.id, p: n0(x.p) })); const sum0 = L.reduce((a, x) => a + x.p, 0);
    const B = PP.bundle; let bun = 0; if (B.on && L.length >= B.n && sum0 > 0) bun = B.pct ? Math.floor((sum0 * B.pct) / 100 / 10) * 10 : Math.min(B.won, sum0);
    const cf = couponFind(PP, code, now); let cp = 0; let cpWhy = cf.why; const after = sum0 - bun;
    if (cf.c) { if (cf.c.min && after < cf.c.min) cpWhy = `${cf.c.min.toLocaleString('ko-KR')}원 넘게 담으면 쓸 수 있는 쿠폰입니다`; else cp = cf.c.how === 'pct' ? Math.floor((after * cf.c.v) / 100 / 10) * 10 : Math.min(cf.c.v, after); }
    const D = Math.min(sum0, bun + cp); const out = L.map((x) => ({ id: x.id, p0: x.p, p: x.p }));
    if (D > 0) { let left = D; out.forEach((x) => { const d = Math.min(x.p, Math.floor((D * x.p) / sum0 / 10) * 10); x.p -= d; left -= d; }); const big = out.slice().sort((a, b) => b.p - a.p); for (const x of big) { if (left <= 0) break; const d = Math.min(x.p, left); x.p -= d; left -= d; } }
    const sum = out.reduce((a, x) => a + x.p, 0); const fee = shipFeeOf(sum, cfg); const fo = n0((cfg || {}).freeOver);
    const nextB = B.on && L.length < B.n ? { need: B.n - L.length, pct: B.pct, won: B.won } : null;
    return { lines: out, n: L.length, sum0, bundle: bun, coupon: cf.c && cp ? { code: cf.c.code, nm: cf.c.nm, d: cp } : null, cpErr: code ? cpWhy || null : null, disc: sum0 - sum, sum, fee, total: sum + fee, free: fo ? { over: fo, left: Math.max(0, fo - sum) } : null, nextB }; }
  /* 손님 화면에 넘길 것 — 쿠폰 번호·규칙 내용은 안 나감 */
  function pubPromo(P, now) { const PP = promoOf(P); return { bundle: PP.bundle.on ? { n: PP.bundle.n, pct: PP.bundle.pct, won: PP.bundle.won } : null, newDays: PP.newDays, coupon: PP.coupons.some((c) => ruleSt(c, now) === 'on') ? 1 : 0, badges: BADGES }; }
  /* 규칙 한 줄 풀이(관리 화면 목록) */
  function whereTxt(w) { w = whereOf(w); const T = []; if (w.k) T.push('종류 ' + w.k.map((k) => KINDS[k]).join('·')); if (w.g) T.push('등급 ' + w.g.join('·')); if (w.pMin || w.pMax) T.push(`판매가 ${w.pMin ? w.pMin.toLocaleString('ko-KR') : ''}~${w.pMax ? w.pMax.toLocaleString('ko-KR') : ''}원`);
    if (w.code) T.push('코드 ' + w.code.join('·')); if (w.q) T.push(`낱말 '${w.q}'`); if (w.xq) T.push(`뺄 낱말 '${w.xq}'`); if (w.a) T.push('지은이 ' + w.a); if (w.pb) T.push('출판사 ' + w.pb); if (w.c) T.push('분야 ' + w.c);
    if (w.atFrom || w.atTo) T.push(`들어온 날 ${w.atFrom || ''}~${w.atTo || ''}`); if (w.ageMin) T.push(`들어온 지 ${w.ageMin}일 넘음`); if (w.yMin || w.yMax) T.push(`출판 ${w.yMin || ''}~${w.yMax || ''}년`); if (w.ids) T.push(`상품 ${w.ids.length}개`); if (w.isbn) T.push(`ISBN ${w.isbn.length}개`);
    return T.length ? T.join(' · ') : '전체 상품'; }
  const actTxt = (a) => (!a ? '값 그대로' : a.how === 'pct' ? `${a.v < 0 ? Math.abs(a.v) + '% 할인' : a.v + '% 인상'}` : `${a.v < 0 ? Math.abs(a.v).toLocaleString('ko-KR') + '원 할인' : a.v.toLocaleString('ko-KR') + '원 인상'}`);
  return { BADGES, KINDS, GRADES, ROUNDS, DEFP, FLOOR, kindOf, whereOf, whereEmpty, match, ruleOf, ruleSt, newPrice, promoOf, applyOne, preview, couponOf, couponFind, quote, pubPromo, whereTxt, actTxt, kst };
});
