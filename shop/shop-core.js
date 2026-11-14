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
  /* (11/13 shopux1) 같은 책 여러 권 — mul = 같은 책 최대 권 수(설정 · 없으면 예전처럼 한 권) · 줄의 n = 권 수(2 넘을 때만 · q = 재고 수량) · max는 권 수 합 */
  /* (shopmisc1 · 정범님 11/14) 📏 상품 단위 — 책·잡지 '권' · 세트 '세트' · CD·LP·DVD·블루레이 '장' · VHS·카세트·그 밖 '개'
   *  cloud/shop-cat.js unitKind·readnow-products-core.js UNIT과 같은 표(시험 tUNIT1114) · x.cp 첫 칸(종류)과 제목으로 · 장바구니 줄은 담을 때 u를 적어 둠(없으면 '권' — 예전 줄) */
  const UNIT = { book: '권', set: '세트', disc: '장', item: '개' };
  const RE_TAPE = /^\s*(?:\[[^\]]*\]\s*)*\[(?:VHS|비디오|카세트|cassette|테이프)|\bVHS\b|비디오\s*테이프|카세트\s*테이프|\bcassette\b/i;
  function unitKind(x) { if (!x) return 'book'; if (x.u) return Object.keys(UNIT).find((k) => UNIT[k] === x.u) || 'book'; const k = String(x.cp || x.cpk || '').split('>')[0]; const t = String(x.t || '');
    if (k === '세트') return 'set'; if (k === '국내도서' || k === '외국도서' || k === '잡지') return 'book'; if (k === '음반' || k === 'LP' || k === 'DVD' || k === '블루레이') return RE_TAPE.test(t) ? 'item' : 'disc'; return k ? 'item' : 'book'; }
  const unitOf = (x) => UNIT[unitKind(x)];
  /* 여러 줄 합 — 한 단위면 'N권' · 섞이면 '3권 · 1장'(권 → 세트 → 장 → 개) */
  const unitsTxt = (c) => { const m = { book: 0, set: 0, disc: 0, item: 0 }; for (const x of c || []) if (x) m[unitKind(x)] += x.n > 1 ? x.n : 1; const P = Object.keys(m).filter((k) => m[k]); return P.length ? P.map((k) => m[k].toLocaleString('ko-KR') + UNIT[k]).join(' · ') : '0권'; };
  /* 종류 이름(분류 화면 'N권')의 단위 */
  const kindUnit = (k) => unitOf({ cp: String(k || '') });
  /* ══ (shopmisc1 · 정범님 11/14 18:13) 💿 CD·DVD·블루레이 보이기 — 「디스크만큼 앞뒤 표지가 중요 · 앞뒤 표지와 디스크를 함께 · LP와 확연히 다르게」
   *  꼴: 뒤표지(왼쪽, 안쪽으로 비스듬히) | 앞표지(오른쪽, 맨 앞) — 펼친 소책자처럼 두 면을 함께 세움 · 그 사이 케이스 속에서 디스크가 위로 반쯤 솟아오름(라벨 = 앞표지 그림)
   *  LP는 그대로(정사각 재킷 하나 + 판이 옆으로 미끄러져 나옴) — CD·영상은 '두 면 + 위로 솟는 디스크'라 한눈에 다름
   *  케이스 결: CD 투명 주얼 케이스(가로가 조금 긺 142×125) · DVD 검은 킵 케이스(135×190) · 블루레이 파란 케이스 + 머리 띠(135×171)
   *  누름: 앞표지·뒤표지·디스크 단추 = 그 면을 앞으로 크게(손님이 뒤표지 곡 목록·바코드를 읽을 수 있게) · 뒤표지 그림이 없으면 바탕 그림 + '뒤표지 사진 없음'(지어내지 않음)
   *  참고(SHOPCAT_1114.md): Discogs 상품 사진 차례(앞·뒤·디스크·속지) · 타워레코드·HMV 재킷 사진 + 뒤 사진 · 아마존 표지 + '뒷면' 사진 · 예스24·알라딘 음반은 앞표지 하나가 대부분 */
  const DKN = { cd: 'CD', dvd: 'DVD', bd: '블루레이' };
  function discKind(x) { if (!x) return null; const k = String(x.cp || x.cpk || '').split('>')[0]; const t = String(x.t || ''); const tag = (/^\s*[\[(【]\s*(블루레이|blu-?ray|BD|4K|UHD|DVD|CD|LP|VHS|비디오)/i.exec(t) || [])[1] || '';
    if (/^(VHS|비디오)$/i.test(tag) || (k === 'DVD' && /\bVHS\b|비디오\s*테이프/i.test(t))) return null; if (k === 'LP' || /^LP$/i.test(tag) || ((k === '음반' || /^CD$/i.test(tag)) && /\bLP\b|바이닐|vinyl/i.test(t))) return null;
    if (k === '블루레이' || /^(블루레이|blu-?ray|BD|4K|UHD)$/i.test(tag)) return 'bd'; if (k === 'DVD' || /^DVD$/i.test(tag)) return 'dvd'; if (k === '음반' || /^CD$/i.test(tag)) return 'cd'; return null; }
  function discH(x, o) { o = o || {}; const kd = o.kd || discKind(x); if (!kd || !DKN[kd]) return ''; const t = esc(x.t || ''); const who = esc([x.a, x.pb].filter(Boolean).join(' · '));
    const fr = x.im ? `<img src="${esc(x.im)}" alt="앞표지" decoding="async"${o.lazy ? ' loading="lazy"' : ''}>` : `<div class="dk-art"><b>${t}</b><small>${esc(x.a || '')}</small></div>`;
    const bk = x.bk ? `<img src="${esc(x.bk)}" alt="뒤표지" decoding="async"${o.lazy ? ' loading="lazy"' : ''}>` : `<div class="dk-art dk-bkd"><b>${t}</b><small>${who}</small><i class="dk-bc" aria-hidden="true"></i><em>뒤표지 사진 없음</em></div>`;
    return `<figure class="dk dk-${kd}" data-dk="${kd}" data-on="front"><div class="dk-row"><div class="dk-p dk-back" role="img" aria-label="${t} 뒤표지${x.bk ? '' : '(사진 없음)'}">${bk}</div><div class="dk-disc" aria-hidden="true"><i class="dk-lbl"${x.im ? ` style="background-image:url('${esc(x.im)}')"` : ''}></i></div><div class="dk-p dk-front" role="img" aria-label="${t} 앞표지">${fr}</div></div>`
      + `<figcaption class="dk-cap"><span class="dk-k">${DKN[kd]}</span><button type="button" class="dk-sw" data-dk-sw="front" aria-pressed="true">앞표지</button><button type="button" class="dk-sw" data-dk-sw="back" aria-pressed="false">뒤표지</button><button type="button" class="dk-sw" data-dk-sw="disc" aria-pressed="false">디스크</button></figcaption></figure>`; }
  /* 단추 누름(손님 화면·서가 같은 처리 — 문서에 한 번) */
  function discSw(e) { const b = e.target && e.target.closest && e.target.closest('[data-dk-sw]'); if (!b) return false; const f = b.closest('.dk'); if (!f) return false; e.preventDefault(); e.stopPropagation(); f.dataset.on = b.dataset.dkSw; f.querySelectorAll('[data-dk-sw]').forEach((q) => q.setAttribute('aria-pressed', String(q === b))); return true; }
  const units = (c) => (c || []).reduce((a, x) => a + (x && x.n > 1 ? x.n : 1), 0);
  const cartAdd = (cart, it, max, mul) => { const c = (cart || []).filter((x) => x && x.id); const ex = c.find((x) => x.id === it.id); if (ex && mul > 1 && +it.q > 1) { const lim = Math.min(+it.q, mul); const n = ex.n > 1 ? ex.n : 1; if (n >= lim) { const u = unitOf(it); return { cart: c, why: `이 상품은 ${lim}${u}까지 담을 수 있습니다(재고 ${+it.q}${u})` }; } return { cart: c.map((x) => (x.id === it.id ? { ...x, n: n + 1, q: +it.q } : x)), why: null, n: n + 1 }; }
    if (ex) return { cart: c, why: '이미 담은 책' }; if (c.length >= (max || 20)) return { cart: c, why: `한 번에 ${max || 20}권까지` }; const u = unitOf(it); return { cart: [...c, { id: it.id, t: it.t, g: it.g, p: +it.p || 0, im: it.im || null, ...(+it.p0 > +it.p ? { p0: +it.p0 } : {}), ...(u !== '권' ? { u } : {}) }], why: null }; }; /* (shopmisc1) u = 단위(책이 아닐 때만) */ /* (shopc1) 할인 전 값 p0도 담음(줄 그어 보임) */
  const cartDel = (cart, id) => (cart || []).filter((x) => x && x.id !== id);
  /* 같은 책 권 수 바꾸기(장바구니 −·+) — 1이면 n을 뺌(한 권 줄과 같은 꼴) */
  const cartSetN = (cart, id, n, lim) => (cart || []).map((x) => { if (!x || x.id !== id) return x; const k = Math.max(1, Math.min(Math.round(+n) || 1, lim || 9999, +x.q > 1 ? +x.q : 1)); const o = { ...x }; if (k > 1) o.n = k; else delete o.n; return o; });
  const shipFee = (sum, cfg) => { const f = Math.max(0, +((cfg || {}).shipFee) || 0); const fo = Math.max(0, +((cfg || {}).freeOver) || 0); return sum <= 0 ? 0 : fo && sum >= fo ? 0 : f; };
  const cartSum = (cart, cfg) => { const sum = (cart || []).reduce((a, x) => a + (+x.p || 0) * (x.n > 1 ? x.n : 1), 0); const fee = shipFee(sum, cfg); return { n: units(cart), sum, fee, total: sum + fee }; };
  /* (shelf2 · 원칙 56) 장바구니 살펴보기 — 클라우드 /shop/check 결과(st: 상품 → s 판매중·o 주문 중·x 팔림/내림 · p: 지금 값)로 고침 → { cart, gone:[{…, why}], moved:[{t, a, b}] }
   *  근거: 쿠팡·아마존 장바구니는 품절·가격 바뀜을 결제 전에 먼저 알림 — 주문 단추를 누른 뒤에야 '팔린 책' 오류가 나지 않게 */
  const cartFix = (cart, st, p) => { const out = [], gone = [], moved = []; for (const x of cart || []) { if (!x || !x.id) continue; const k = st && st[x.id];
      if (k === 'x' || k === 'o') { gone.push({ ...x, why: k === 'o' ? '다른 분이 먼저 주문한 책' : '방금 팔렸거나 판매를 멈춘 책' }); continue; }
      const np = p && +p[x.id]; if (np > 0 && np !== +x.p) { moved.push({ id: x.id, t: x.t, a: +x.p || 0, b: np }); out.push({ ...x, p: np }); } else out.push(x); } return { cart: out, gone, moved }; };
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
  const qtyOf = (cart) => { const o = {}; (cart || []).forEach((x) => { if (x && x.n > 1) o[x.id] = x.n; }); return Object.keys(o).length ? o : null; }; /* 2권 넘게 담은 책만 — 한 권뿐이면 null(주문 글이 예전과 똑같음) */
  const orderBody = (f, cart) => ({ items: (cart || []).map((x) => x.id), ...(qtyOf(cart) ? { qty: qtyOf(cart) } : {}), buyer: { name: String(f.name || '').trim(), phone: String(f.phone || '').replace(/\D/g, ''), ...(String(f.email || '').trim() ? { email: String(f.email).trim() } : {}) },
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
  return { DKN, discKind, discH, discSw, UNIT, unitKind, unitOf, unitsTxt, kindUnit, units, cartSetN, qtyOf, BADGE, badgeH, saleOf, leftTxt, seenAdd, freeLeft, PRICE_RANGES, rangeOf, won, esc, GRADE, gradeOf, offPct, cartAdd, cartDel, cartSum, cartFix, shipFee, PHONE, phoneFmt, formCheck, orderBody, route, qs, ago, freshIds };
});
