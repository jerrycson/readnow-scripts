/* 🛍 북스퀸(booksqueen.com) 손님 화면 — 순수 셈(브라우저·node 시험 tSHOP1111 함께) · 외부 라이브러리 없음 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQ = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const won = (n) => (Math.round(+n || 0)).toLocaleString('ko-KR') + '원';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* 등급 풀이 — 알라딘 중고 등급 기준과 같은 말(손님이 가장 많이 본 기준) */
  const GRADE = { 최상: ['최상', '새 책에 가까움 — 사용 흔적이 거의 없음'], 상: ['상', '조금 읽은 흔적 — 깨끗함'], 중: ['중', '읽은 흔적이 보임 — 읽는 데 지장 없음'], 하: ['하', '흔적이 많음 — 값이 쌈'] };
  const gradeOf = (g) => GRADE[g] || [g || '등급 모름', ''];
  const offPct = (p, lp) => (lp > 0 && p > 0 && p < lp ? Math.round((1 - p / lp) * 100) : 0);
  /* 장바구니 = [{ id, t, g, p, im }] · 한 권 상품이라 같은 책은 한 번만 */
  const cartAdd = (cart, it, max) => { const c = (cart || []).filter((x) => x && x.id); if (c.some((x) => x.id === it.id)) return { cart: c, why: '이미 담은 책' }; if (c.length >= (max || 20)) return { cart: c, why: `한 번에 ${max || 20}권까지` }; return { cart: [...c, { id: it.id, t: it.t, g: it.g, p: +it.p || 0, im: it.im || null, ...(+it.p0 > +it.p ? { p0: +it.p0 } : {}) }], why: null }; }; /* (shopc1) 할인 전 값 p0도 담음(줄 그어 보임) */
  const cartDel = (cart, id) => (cart || []).filter((x) => x && x.id !== id);
  const shipFee = (sum, cfg) => { const f = Math.max(0, +((cfg || {}).shipFee) || 0); const fo = Math.max(0, +((cfg || {}).freeOver) || 0); return sum <= 0 ? 0 : fo && sum >= fo ? 0 : f; };
  const cartSum = (cart, cfg) => { const sum = (cart || []).reduce((a, x) => a + (+x.p || 0), 0); const fee = shipFee(sum, cfg); return { n: (cart || []).length, sum, fee, total: sum + fee }; };
  /* 주문서 검사(서버도 같은 검사를 다시 함 — 여기는 손님에게 바로 알려 주기용) */
  const PHONE = /^01[016789]\d{7,8}$/;
  const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,80}\.[a-z]{2,}$/i;
  const phoneFmt = (v) => { const d = String(v || '').replace(/\D/g, '').slice(0, 11); return d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4); };
  function formCheck(f) { const E = {}; const ph = String(f.phone || '').replace(/\D/g, ''); const same = !!f.same;
    if (String(f.name || '').trim().length < 2) E.name = '이름을 두 글자 이상 적어 주세요'; if (!PHONE.test(ph)) E.phone = '010으로 시작하는 휴대폰 번호';
    if (!same) { if (String(f.rname || '').trim().length < 2) E.rname = '받는 분 이름'; if (!PHONE.test(String(f.rphone || '').replace(/\D/g, ''))) E.rphone = '받는 분 휴대폰 번호'; }
    if (!/^\d{5}$/.test(String(f.zip || '').replace(/\D/g, ''))) E.zip = '우편번호 5자리'; if (String(f.addr1 || '').trim().length < 5) E.addr1 = '주소(도로명·지번)';
    if (String(f.email || '').trim() && !EMAIL.test(String(f.email).trim())) E.email = '메일 주소 꼴이 아닙니다(비워 두어도 됩니다)';
    if (!f.agreeP) E.agreeP = '개인정보 수집·이용 동의가 필요합니다'; if (!f.agreeT) E.agreeT = '구매 조건 확인 동의가 필요합니다'; return E; }
  const orderBody = (f, cart) => ({ items: (cart || []).map((x) => x.id), buyer: { name: String(f.name || '').trim(), phone: String(f.phone || '').replace(/\D/g, ''), ...(String(f.email || '').trim() ? { email: String(f.email).trim() } : {}) },
    rcv: f.same ? { name: String(f.name || '').trim(), phone: String(f.phone || '').replace(/\D/g, ''), zip: String(f.zip || '').replace(/\D/g, ''), addr1: String(f.addr1 || '').trim(), addr2: String(f.addr2 || '').trim(), memo: String(f.memo || '').trim() }
      : { name: String(f.rname || '').trim(), phone: String(f.rphone || '').replace(/\D/g, ''), zip: String(f.zip || '').replace(/\D/g, ''), addr1: String(f.addr1 || '').trim(), addr2: String(f.addr2 || '').trim(), memo: String(f.memo || '').trim() },
    depositor: String(f.dep || '').trim() || String(f.name || '').trim(), agree: { privacy: !!f.agreeP, terms: !!f.agreeT }, hp: f.hp || '', ...(String(f.cp || '').trim() ? { cp: String(f.cp).trim() } : {}), ...(f.expect != null ? { expect: +f.expect } : {}) });
  /* ══ (11/11 shopc1) 🏷 배지 · 할인가 · 최근 본 책 · 무료 배송까지 — 배지 이름은 cloud/shop-promo.js BADGES와 같음(시험이 견줌) */
  const BADGE = { sale: '할인', new: 'NEW', pick: '추천', rare: '희귀', last: '마지막 1권', hot: '인기' };
  const badgeH = (bd, max) => (bd || []).filter((k) => BADGE[k]).slice(0, max || 3).map((k) => `<span class="bd bd-${k}">${BADGE[k]}</span>`).join('');
  /* 할인율 — 할인 규칙이 있으면 원래 우리 판매가(p0) 기준 · 없으면 정가 기준(예전 그대로) · { pct, from: 'p0'|'lp' } */
  const saleOf = (x) => { if (x && x.p0 > x.p && x.p > 0) return { pct: Math.round((1 - x.p / x.p0) * 100), from: 'p0', was: x.p0 }; const o = offPct(x && x.p, x && x.lp); return o ? { pct: o, from: 'lp', was: x.lp } : null; };
  /* 할인 끝까지 — '오늘 자정까지'·'N일 남음'·'M/D까지' (한국 날짜) */
  const leftTxt = (pe, now) => { const e = Date.parse(pe || ''); const t = now || Date.now(); if (!Number.isFinite(e) || e <= t) return ''; const d = (v) => new Date(v + 9 * 3600e3).toISOString().slice(0, 10); const n = Math.round((Date.parse(d(e)) - Date.parse(d(t))) / 864e5);
    if (e - t < 864e5 && n <= 0) return '오늘까지'; if (n <= 6) return n + '일 남음'; const k = d(e); return +k.slice(5, 7) + '/' + +k.slice(8, 10) + '까지'; };
  /* 최근 본 책(이 기기만 · 20권) — 같은 책은 맨 앞으로 */
  const seenAdd = (L, x, max) => [{ id: x.id, t: x.t, g: x.g || null, p: +x.p || 0, im: x.im || null, a: x.a || null }, ...(L || []).filter((y) => y && y.id !== x.id)].slice(0, max || 20);
  /* 무료 배송까지 남은 값(0이면 무료) · 기준 없으면 null */
  const freeLeft = (sum, cfg) => { const fo = Math.max(0, +((cfg || {}).freeOver) || 0); return fo ? Math.max(0, fo - (+sum || 0)) : null; };
  const PRICE_RANGES = [['', '모든 값'], ['0-5000', '5천 원 아래'], ['5000-10000', '5천~1만 원'], ['10000-20000', '1만~2만 원'], ['20000-', '2만 원 넘게']];
  const rangeOf = (v) => { const m = /^(\d*)-(\d*)$/.exec(String(v || '')); return m ? { pmin: m[1] || '', pmax: m[2] || '' } : { pmin: '', pmax: '' }; };
  /* (11/11 shop4) 🆕 들어온 날 표 — d·day = 한국 날짜 YYYY-MM-DD(클라우드가 줌) · 7일 넘으면 표 없음 */
  const ago = (d, day) => { const a = Date.parse(d || ''), b = Date.parse(day || ''); if (!Number.isFinite(a) || !Number.isFinite(b)) return ''; const n = Math.round((b - a) / 864e5); return n <= 0 ? '오늘' : n === 1 ? '어제' : n < 7 ? n + '일 전' : ''; };
  /* 새로 들어온 책 자동 갱신 — 앞에 없던 책 수(첫 화면에 그 수만큼 알림) */
  const freshIds = (prev, next) => { const P = new Set((prev || []).map((x) => x && x.id)); return (next || []).filter((x) => x && x.id && !P.has(x.id)).map((x) => x.id); };
  /* 주소 해시 길(#/…) 풀기 */
  function route(h) { const s = String(h || '').replace(/^#/, '') || '/'; const [p, qs] = s.split('?'); const q = {}; (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); try { q[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' ')); } catch (e) {} });
    const seg = p.split('/').filter(Boolean); return { name: seg[0] || 'home', arg: seg[1] ? decodeURIComponent(seg[1]) : null, q }; }
  const qs = (o) => Object.entries(o || {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  return { BADGE, badgeH, saleOf, leftTxt, seenAdd, freeLeft, PRICE_RANGES, rangeOf, won, esc, GRADE, gradeOf, offPct, cartAdd, cartDel, cartSum, shipFee, PHONE, phoneFmt, formCheck, orderBody, route, qs, ago, freshIds };
});
