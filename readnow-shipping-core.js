// ==========================================================================
// ReadNow Shipping Core — 0.5.0  (출고: 알라딘 판매관리 화면 읽기 · 서가 순서 · 영업일)
// 웹앱(오늘 출고 화면)과 수집기(발송 요청 읽기)가 같이 쓰는 기준 — 같은 기준은 여기 한 곳에만
// 알라딘 판매관리 흐름: ① 주문확인요청(orderstep=3) → [발송준비시작] → ② 발송 요청(orderstep=4, 송장 입력)
//   → [입력완료] → ③ 배송&구매확정전(출고 후 5일 안에 수령확인 없으면 6일째 자동 구매확정) → ④ 구매확정&정산대기(다음 날 새벽 예치금 정산) → ⑤ 정산완료(3개월 보관)
// 오늘 출고 = ② 발송 요청 탭에 있는 주문. 출고 마감 = 영업일 오후 2시(14:00) 원칙 — 이 시각 전 주문은 그날 출고 묶음, 뒤는 다음 영업일 (2026-10-06 정범 지정)
// 예외 날은 그날 마감 시각을 따로 적음(dayCut) — 웹앱 '출고별 매출'에서 날짜마다 고침
// ==========================================================================
(function (root) {
  'use strict';
  const VERSION = '0.7.0'; // (0.7.0) 🇰🇷 법정 공휴일 미리 넣음·택배 수거 달력(pickup off/on)·실제 발송 묶음(pickupRun)·③ 배송&구매확정전 화면 읽기(parseShippedPage — 그날 출고 = 발송일이 그날인 주문) // (0.6.0) planConfirm — 오늘 출고 확정 목록 계산(웹앱 '출고 확정' 단추와 클라우드 출고 시각 자동 확정이 같은 기준) 
  const T = (el) => (el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const toInt = (s) => { const n = parseInt(String(s || '').replace(/[^\d-]/g, ''), 10); return isNaN(n) ? null : n; };

  // ── ② 발송 요청 화면(worder_delivery.aspx?orderstep=4) · ① 주문확인요청 화면(worder_preparatory_complete.aspx) 읽기 — 두 화면의 줄 구조가 같음(주문확인요청은 4단계 전이라 주소가 가려짐) ──
  // 줄마다 상품 하나(tr#oList{n}) + 아래 줄(tr#oList{n}b: '관리코드, 등록일시'). 같은 주문의 두 번째 상품부터는 주문번호 칸이 '동일 주문'
  // 주문인(viewAddrLayer(n,0)) · 수령인(viewAddrLayer(n,1) + 숨은 표 addrLayer{n}: 성명·전화·주소·배송비·배송요청사항)
  function parseDeliveryPage(doc) {
    const rows = [...doc.querySelectorAll('tr[id^="oList"]')].filter((tr) => /^oList\d+$/.test(tr.id));
    const orders = []; let cur = null;
    for (const tr of rows) {
      const n = tr.id.replace('oList', ''); const sub = doc.getElementById('oList' + n + 'b');
      const oa = tr.querySelector('a[onclick*="viewOrderDetail"]'); const orderNo = oa ? T(oa) : null;
      if (orderNo) { cur = { orderNo, status: null, seq: null, buyer: null, buyerEmail: null, orderedAt: null, recipient: null, carrier: null, deliveryNo: null, items: [] }; orders.push(cur);
        const tds = [...tr.children].filter((td) => td.tagName === 'TD' && !td.getAttribute('bgcolor'));
        cur.status = T(tds[1]) || null; cur.seq = toInt(T(tds[2])); } /* seq = 화면의 순번 */
      if (!cur) continue;
      const pa = tr.querySelector('a[href*="wproduct.aspx?ItemId="]'); const href = pa ? pa.getAttribute('href') : '';
      const titleA = [...tr.querySelectorAll('a[href*="wproduct.aspx?ItemId="]')].find((a) => T(a)); const titleRaw = T(titleA);
      const gm = titleRaw.match(/^\[중고-(최상|상|중)\]\s*/); const img = tr.querySelector('a[href*="wproduct.aspx"] img');
      const cells = [...tr.children].filter((td) => td.tagName === 'TD' && !td.getAttribute('bgcolor'));
      const ti = cells.findIndex((td) => td.contains(titleA)); const after = ti >= 0 ? cells.slice(ti + 1) : []; const qi = after.findIndex((td) => /^\d{1,3}$/.test(T(td)) && !td.querySelector('select,input')); const qty = qi >= 0 ? toInt(T(after[qi])) : null; // 수량 = 제목 뒤 첫 작은 정수 칸 (주문확인요청 화면은 사이에 출판사 칸이 있음)
      const buyerA = tr.querySelector('a[onclick*="viewAddrLayer"][onclick*=",0)"]'); if (buyerA && !cur.buyer) { cur.buyer = T(buyerA); const em = (buyerA.parentElement.getAttribute('title') || '').trim(); cur.buyerEmail = em || null; }
      const priceCell = after.slice(qi + 1).find((td) => /^[\d,]+$/.test(T(td)) && toInt(T(td)) >= 100 && !td.querySelector('select,input')); const price = priceCell ? toInt(T(priceCell)) : null; // 판매가 = 수량 뒤 100원 이상 숫자 칸
      const dt = [...tr.querySelectorAll('td.t1')].map((td) => td.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim()).find((x) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(x)); if (dt && !cur.orderedAt) cur.orderedAt = dt;
      const sel = tr.querySelector('select[name^="deliveryProxy."]'); if (sel && !cur.carrier) { const o = sel.querySelector('option[selected]') || sel.options[sel.selectedIndex]; cur.carrier = o ? { code: o.value, name: T(o) } : null; }
      const inp = tr.querySelector('input[name^="deliveryNo."]'); if (inp) cur.deliveryNo = (inp.getAttribute('value') || '').trim() || null;
      let sku = null, registeredAt = null; const st = sub ? T(sub.querySelector('td')) : ''; const sm = st.match(/^([^,]+?)\s*,\s*(\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?)/); /* 관리코드는 그대로(REDFGN_ms·BLKCMN-260808 등), 서가는 앞 6자리 */ if (sm) { sku = sm[1]; registeredAt = sm[2]; }
      cur.items.push({ listingId: (href.match(/ItemId=(\d+)/) || [])[1] || null, titleRaw, title: titleRaw.replace(/^\[중고-[^\]]*\]\s*/, ''), grade: gm ? gm[1] : null, qty, price, sku, registeredAt, img: img ? img.getAttribute('src') : null });
    }
    // 수령인: 주문의 어느 줄에든 붙어 있는 viewAddrLayer(n,1) + addrLayer{n}
    for (const a of doc.querySelectorAll('a[onclick*="viewAddrLayer"][onclick*=",1)"]')) {
      const m = (a.getAttribute('onclick') || '').match(/viewAddrLayer\((\d+),1\)/); if (!m) continue; const lay = doc.getElementById('addrLayer' + m[1]); const tr = a.closest('tr');
      let o = null; for (let p = tr; p && !o; p = p.previousElementSibling) { const x = p.querySelector && p.querySelector('a[onclick*="viewOrderDetail"]'); if (x) o = orders.find((q) => q.orderNo === T(x)); }
      if (!o) continue; const cell = (label) => { if (!lay) return null; const td = [...lay.querySelectorAll('td')].find((t) => T(t) === label); return td && td.nextElementSibling ? T(td.nextElementSibling) : null; };
      const rn = T(a) || cell('성명'); o.recipient = { name: rn === '상동' ? o.buyer : rn, sameAsBuyer: rn === '상동', phone1: cell('전화1'), phone2: cell('전화2'), address: cell('주소'), shipFee: toInt(cell('배송비')), request: cell('배송요청사항') };
    }
    const tabCounts = {}; T(doc.body).replace(/(주문확인요청|발송 요청|배송&구매확정전|구매확정&정산대기|정산완료)\s*\((\d+)건\)/g, (_, k, v) => { tabCounts[k] = +v; return _; });
    return { orders, tabCounts };
  }

  // ── (0.7.0) ③ 배송&구매확정전 화면(worder_delivery_complete.aspx?orderstep=5 · 쪽 = &page=N · 한 쪽 50주문) — 송장을 넣어 이 탭으로 옮겨 온 차례(맨 위 = 가장 최근)
  //    사장님 10/16 기준: 그날 출고별 매출 = 어제 마지막으로 옮겨 온 주문(A) 다음부터 오늘 마지막(C)까지 = 이 화면의 발송일이 그날인 주문 · 발송일은 아래 줄(oList{n}b)의 'MM-DD' 칸
  //    today = 'YYYY-MM-DD'(한국 날짜) — 발송일에 해를 붙일 때 기준(오늘보다 뒤면 지난해)
  function parseShippedPage(doc, today) { const R = parseDeliveryPage(doc); const td = String(today || ymd(new Date())); const Y = +td.slice(0, 4);
    const byNo = new Map(); for (const tr of doc.querySelectorAll('tr[id^="oList"]')) { if (!/^oList\d+$/.test(tr.id)) continue; const a = tr.querySelector('a[onclick*="viewOrderDetail"]'); if (!a) continue; const no = T(a); if (byNo.has(no)) continue; const sub = doc.getElementById(tr.id + 'b'); const sc = sub ? [...sub.children].filter((x) => x.tagName === 'TD').map((x) => T(x)) : []; const md = sc.find((x) => /^\d{2}-\d{2}$/.test(x)) || null;
      const oc = [...tr.children].map((x) => x.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim()).find((x) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(x)) || null; byNo.set(no, { md, oc }); }
    R.orders.forEach((o, i) => { const x = byNo.get(o.orderNo) || {}; o.pos = i; if (!o.orderedAt && x.oc) o.orderedAt = x.oc; let sd = null; if (x.md) { sd = Y + '-' + x.md; if (sd > td) sd = (Y - 1) + '-' + x.md; } o.shipDay = sd; });
    let last = 1; for (const a of doc.querySelectorAll('a[onclick*="Page_Set"]')) { const m = (a.getAttribute('onclick') || '').match(/Page_Set\('?(\d+)/); if (m) last = Math.max(last, +m[1]); }
    return { ...R, lastPage: last }; }

  // ── 서가 (= 실제 책장 한 칸) ── 정범 지정 2026-10-05, 2026-10-06 바로잡음: 서가는 각각 따로, 단 BLK·YLW·GRY·GRN 한 줄만 한 서가에 섞여 꽂혀 있으므로
  //    서가 안에서는 관리코드를 가리지 않고 이름 철자 순으로 섞어 늘어놓음. 서가 이름(name)은 화면에 그대로 씀. 순서를 바꾸려면 여기만
  const SHELF_ORDER = [
    { name: 'PNKLUX', test: (s) => s === 'PNKLUX' },
    { name: 'BLK · YLW · GRY · GRN', test: (s) => /^(BLK|YLW|GRY|GRN)/.test(s) }, // 이 줄만 한 서가에 섞여 있음
    { name: 'REDFGN', test: (s) => s === 'REDFGN' },
    { name: 'BLU', test: (s) => /^BLU/.test(s) },
    { name: 'SKY', test: (s) => /^SKY/.test(s) },
    { name: 'MGZ', test: (s) => /^MGZ/.test(s) },
    { name: 'ORGCMC', test: (s) => s === 'ORGCMC' },
    { name: 'KHKDVD', test: (s) => s === 'KHKDVD' },
    { name: 'KHKCPD', test: (s) => s === 'KHKCPD' },
  ];
  const shelfOf = (sku) => String(sku || '').toUpperCase().slice(0, 6); // 관리코드 앞 6자리 (뒤에 붙는 _ms·-날짜 등은 매입처·메모)
  const shelfRank = (sku) => { const s = shelfOf(sku); const i = SHELF_ORDER.findIndex((g) => g.test(s)); return i < 0 ? SHELF_ORDER.length : i; };
  const shelfName = (sku) => { const r = shelfRank(sku); return r < SHELF_ORDER.length ? SHELF_ORDER[r].name : '그 외'; }; // 서가 이름 (같은 서가면 같은 이름)
  const SHELF_COLOR = { PNK: '#e8457c', BLK: '#222', GRN: '#2e9d5b', YLW: '#e6b800', GRY: '#888', RED: '#d32f2f', BLU: '#1f5faf', SKY: '#4fb3e8', MGZ: '#a0408c', ORG: '#f57c00', KHK: '#8b7d4a' };
  const shelfColor = (sku) => SHELF_COLOR[String(sku || '').slice(0, 3).toUpperCase()] || '#5B6B66';
  // 출고 목록 정렬: 주문은 절대 섞지 않음(주문이 최우선) → 주문 안의 상품: 서가 순서 → 같은 서가 안에서는 관리코드를 가리지 않고 이름 철자 순
  //   → 주문끼리: 첫 상품의 서가 순서 → 같은 서가면 첫 상품 이름 철자 순
  const byShelfTitle = (a, b) => shelfRank(a.sku) - shelfRank(b.sku) || String(a.title || '').localeCompare(String(b.title || ''), 'ko');
  // 관리코드 순(주문별 보기에서 고를 수 있음): 관리코드 전체 글자 순(숫자는 크기 순, 대소문자 무시) → 같은 관리코드면 이름 철자 순. 코드 없는 상품은 맨 뒤
  const bySku = (a, b) => { const x = String(a.sku || ''), y = String(b.sku || ''); if (!x !== !y) return x ? -1 : 1;
    return x.localeCompare(y, 'en', { numeric: true, sensitivity: 'base' }) || String(a.title || '').localeCompare(String(b.title || ''), 'ko'); };
  const SORTS = { shelf: byShelfTitle, sku: bySku }; // 주문별 보기 정렬 방식 — 기본 shelf(서가 순)
  function sortShipment(orders, mode) { const cmp = SORTS[mode] || byShelfTitle;
    const out = orders.map((o) => ({ ...o, items: [...o.items].sort(cmp) }));
    return out.sort((a, b) => cmp(a.items[0] || {}, b.items[0] || {}));
  }


  // ── 영업일 ── 주말 + 설정한 휴일(웹앱 설정에서 날짜를 넣음)은 출고하지 않음
  const ymd = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); // 한국 날짜
  /* (0.7.0) 🇰🇷 법정 공휴일·대체공휴일·선거일 — 미리 넣어 둠(택배사가 수거하지 않는 날). 택배사가 연휴 앞뒤로 더 쉬는 날은 웹앱 '📅 택배 수거 달력'에서 사람이 표시(pickup 'off'), 공휴일인데 수거하면 'on'
   *  출처: 인사혁신처 공휴일 고시 기준(kholidayz.com 2026·2027 표와 대조 · 2026-10-16) · 해마다 끝에 다음 해를 더함 */
  const KR_HOLIDAYS = {
    '2025-01-01': '신정', '2025-01-27': '임시공휴일', '2025-01-28': '설날 연휴', '2025-01-29': '설날', '2025-01-30': '설날 연휴', '2025-03-01': '삼일절', '2025-03-03': '대체공휴일(삼일절)', '2025-05-05': '어린이날·부처님오신날', '2025-05-06': '대체공휴일', '2025-06-03': '대통령 선거', '2025-06-06': '현충일', '2025-08-15': '광복절', '2025-10-03': '개천절', '2025-10-05': '추석 연휴', '2025-10-06': '추석', '2025-10-07': '추석 연휴', '2025-10-08': '대체공휴일(추석)', '2025-10-09': '한글날', '2025-12-25': '성탄절',
    '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴', '2026-03-01': '삼일절', '2026-03-02': '대체공휴일(삼일절)', '2026-05-01': '노동절', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일(부처님오신날)', '2026-06-03': '지방선거', '2026-06-06': '현충일', '2026-07-17': '제헌절', '2026-08-15': '광복절', '2026-08-17': '대체공휴일(광복절)', '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴', '2026-10-03': '개천절', '2026-10-05': '대체공휴일(개천절)', '2026-10-09': '한글날', '2026-12-25': '성탄절',
    '2027-01-01': '신정', '2027-02-06': '설날 연휴', '2027-02-07': '설날', '2027-02-08': '설날 연휴', '2027-02-09': '대체공휴일(설날)', '2027-03-01': '삼일절', '2027-05-01': '노동절', '2027-05-03': '대체공휴일(노동절)', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날', '2027-06-06': '현충일', '2027-07-17': '제헌절', '2027-07-19': '대체공휴일(제헌절)', '2027-08-15': '광복절', '2027-08-16': '대체공휴일(광복절)', '2027-09-14': '추석 연휴', '2027-09-15': '추석', '2027-09-16': '추석 연휴', '2027-10-03': '개천절', '2027-10-04': '대체공휴일(개천절)', '2027-10-09': '한글날', '2027-10-11': '대체공휴일(한글날)', '2027-12-25': '성탄절', '2027-12-27': '대체공휴일(성탄절)' };
  const holName = (k) => KR_HOLIDAYS[k] || null;
  /* 영업일(= 택배사가 수거하는 날) — pickup = { 'YYYY-MM-DD': 'off'(수거 없음) | 'on'(수거함) } 사람이 달력에 표시한 것이 먼저 · 그다음 주말·법정 공휴일·설정의 휴일 목록 */
  function isBizDay(d, holidays, pickup) { const k = ymd(d); const pk = pickup && pickup[k]; if (pk === 'off') return false; if (pk === 'on') return true; const wd = new Date(k + 'T12:00:00Z').getUTCDay(); /* 한국 날짜의 요일 (실행 기기 시간대와 무관) */ return wd !== 0 && wd !== 6 && !KR_HOLIDAYS[k] && !(holidays || []).includes(k); }
  function nextBizDay(d, holidays, pickup) { let x = new Date(d.getTime()); for (let i = 0; i < 60; i++) { x = new Date(x.getTime() + 864e5); if (isBizDay(x, holidays, pickup)) break; } return x; }
  const dayKeyAdd = (k, n) => new Date(Date.parse(k + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  /* (0.7.0) 📦 실제 발송 묶음 — 수거하는 날 k: 바로 앞의 수거 없는 날들(주말·연휴·택배 휴무)에 송장을 넣은 것까지 그날 한꺼번에 나감 → [앞 쉬는 날들…, k] · 수거 없는 날이면 그날이 들어갈 다음 수거일 */
  function pickupRun(k, opt) { const o = opt || {}; const isP = (x) => isBizDay(new Date(x + 'T12:00:00+09:00'), o.holidays, o.pickup); if (!isP(k)) { let n = k; for (let i = 0; i < 60 && !isP(n); i++) n = dayKeyAdd(n, 1); return { pickup: false, to: n, days: [k] }; }
    const days = [k]; let p = dayKeyAdd(k, -1); for (let i = 0; i < 60 && !isP(p); i++) { days.unshift(p); p = dayKeyAdd(p, -1); } return { pickup: true, to: k, days }; }
  // 출고 마감: 기본 14:00. opt.cutTime('HH:MM') = 평소 마감, opt.dayCut = { 'YYYY-MM-DD': 'HH:MM' } 그날만 다른 마감(수기 입력)
  const DEFAULT_CUT = '14:00';
  const cutMin = (v) => { if (v == null || v === '') return null; const m = String(v).trim().match(/^(\d{1,2})(?::?(\d{2}))?$/); return m && +m[1] < 24 && +(m[2] || 0) < 60 ? +m[1] * 60 + +(m[2] || 0) : null; };
  const cutOf = (dateKey, opt) => { const o = opt || {}; return cutMin(o.dayCut && o.dayCut[dateKey]) ?? cutMin(o.cutTime) ?? cutMin(DEFAULT_CUT); };
  const cutIsSet = (dateKey, opt) => !!(opt && opt.dayCut && cutMin(opt.dayCut[dateKey]) != null);
  // 주문의 출고일(출고 묶음): 영업일이고 그날 마감 전 주문 → 그날, 아니면 다음 영업일
  function dueShipDay(orderedAt, opt) { const o = opt || {}; if (orderedAt == null || orderedAt === '') return null; const t = new Date(String(orderedAt).replace(' ', 'T') + (/[+Z]/.test(String(orderedAt)) ? '' : '+09:00')); if (isNaN(t.getTime())) return null; /* (0.5.2) 날짜를 못 읽으면 null(예전엔 오류로 멈춤) */
    const k = ymd(t); const hm = new Date(t.getTime() + 9 * 3600e3).toISOString().slice(11, 16); const mins = +hm.slice(0, 2) * 60 + +hm.slice(3, 5);
    if (o.daily) return mins < cutOf(k, o) ? k : dayKeyAdd(k, 1); /* (0.7.0) 송장 넣는 날 기준(사장님: 주말·휴일에도 송장은 넣음 — 택배 수거만 쉼) = 날마다 마감 전이면 그날, 뒤면 다음 날 */
    return isBizDay(t, o.holidays, o.pickup) && mins < cutOf(k, o) ? k : ymd(nextBizDay(t, o.holidays, o.pickup)); }

  // ── 알라딘 발송 요청 엑셀(worder_excel.aspx, status=4) → ALPS 일괄주문접수(사용자파일 '알라딘') 업로드 파일 ──
  // 정범이 ALPS에 올려 성공한 파일(판매완료20260925-ALPS업로드성공.xlsx)과 같은 29칸·같은 순서. 숫자 칸은 그 파일처럼 숫자로
  const ALADIN_XLS_HEAD = ['상태', '주문번호', '자체상품관리코드', '상품명', 'ISBN', '원상품ISBN', '원상품바코드', '출판사', '수량', '주문인', '수령인', '주문일', '입금일', '판매가', '판매총액', '판매수수료', '정상발송 마감일', '발송일', '택배사', '송장번호', '주문메모', '우편번호', '수령 주소', '전화1', '전화2', '배송요청사항', '위탁승인번호', '증빙서류', '비고'];
  const XLS_NUM = ['수량', '판매가', '판매총액', '판매수수료', '우편번호'];
  function parseAladinOrderExcel(doc) { // 알라딘이 내려주는 .xls는 사실 HTML 표
    const tb = [...doc.querySelectorAll('table')].find((t) => /주문번호/.test(T(t.rows && t.rows[0]))); if (!tb) return null;
    const rows = [...tb.rows].map((r) => [...r.cells].map((c) => T(c))); const header = rows.shift();
    return { header, rows: rows.filter((r) => r.some((x) => x)) };
  }
  function alpsUploadAoa(excel) { // [[머리 칸], [줄]...] — 머리 칸 이름으로 맞춰 29칸 순서를 지킴
    const ix = ALADIN_XLS_HEAD.map((h) => excel.header.indexOf(h));
    return [ALADIN_XLS_HEAD, ...excel.rows.map((r) => ALADIN_XLS_HEAD.map((h, k) => { const v = ix[k] >= 0 ? r[ix[k]] : ''; if (XLS_NUM.includes(h) && /^-?[\d,]+$/.test(String(v || '').trim())) return Number(String(v).replace(/,/g, '')); return v == null ? '' : v; }))];
  }
  // ── ALPS '통합관리 운송장출력' 엑셀(출력한 운송장 목록) → 주문별 송장번호 ──
  // ALPS 목록에는 알라딘 주문번호가 없음(주문번호 칸이 빔) → 수하인명 + 상품명 + 상품상세내용(= 관리코드)으로 알라딘 주문의 상품과 맞춤. 같은 수하인 여러 권은 합포장(같은 운송장번호)
  function parseAlpsWaybills(aoa) {
    const hi = aoa.findIndex((r) => r && r.includes('운송장번호') && r.includes('수하인명')); if (hi < 0) return null; const H = aoa[hi]; const c = (n) => H.indexOf(n);
    return aoa.slice(hi + 1).filter((r) => r && r[c('운송장번호')]).map((r) => ({ invoice: String(r[c('운송장번호')]).replace(/\D/g, ''), name: String(r[c('수하인명')] || '').trim(), title: String(r[c('상품명')] || '').trim(), sku: String(r[c('상품상세내용')] || '').trim(),
      packKey: c('합포장키') >= 0 ? String(r[c('합포장키')] || '') : '', mgmtNo: c('관리번호') >= 0 ? String(r[c('관리번호')] || '') : '', printed: c('출력여부') >= 0 ? String(r[c('출력여부')] || '') : '', pickedAt: c('집하일자') >= 0 ? String(r[c('집하일자')] || '') : '' }));
  }
  const nTitle = (t) => String(t || '').replace(/^\[중고[^\]]*\]\s*/, '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase(); /* (0.5.2) 한글을 남김 — 예전 [\W]는 한글까지 지워 한국 책 제목이 모두 빈 글자 → 같은 받는 사람의 두 책 송장이 뒤바뀔 수 있었음 */
  const tEq = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))); /* 운송장 목록의 상품명이 잘려 있어도 앞부분이 같으면 같은 책 */
  const nName = (t) => String(t || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '').toLowerCase();
  // 주문마다: ok(운송장 하나로 다 맞음) · partial(일부 상품만 맞음, 운송장 하나) · many(운송장이 여럿 — 확인 필요) · none(못 찾음)
  function matchInvoices(orders, waybills) {
    const used = new Set(); const out = [];
    for (const o of orders) { const rn = nName((o.recipient && o.recipient.name) || o.buyer); const hits = [];
      // (0.5.1) 관리코드가 양쪽에 있고 같을 때만 이름 앞부분 일치(김민 ↔ 김민수)를 허용 · 관리코드가 한쪽에 없으면 이름이 똑같아야 · 관리코드가 서로 다르면 '약한 맞음' → 확인이 필요한 partial
      let weak = 0;
      for (const it of o.items || []) { const t = nTitle(it.title || it.titleRaw); const same = (w) => nName(w.name) === rn;
        /* (0.5.2) 제목이 똑같은 운송장을 먼저 · 없을 때만 잘린 제목(앞부분 같음)을, 그것도 하나뿐일 때만 — '해리포터 1'과 '해리포터 10'을 바꿔 붙이지 않게 */
        const pickT = (pred) => { let k0 = waybills.findIndex((w, i) => !used.has(i) && nTitle(w.title) === t && pred(w)); if (k0 >= 0) return [k0, false]; const C = waybills.map((w, i) => i).filter((i) => !used.has(i) && tEq(nTitle(waybills[i].title), t) && pred(waybills[i])); return C.length === 1 ? [C[0], true] : [-1, false]; };
        let [k, pre] = pickT((w) => w.sku && it.sku && w.sku === it.sku && nameOk(nName(w.name), rn));
        if (k < 0) [k, pre] = pickT((w) => (!w.sku || !it.sku) && same(w));
        if (k < 0) { [k, pre] = pickT((w) => same(w)); if (k >= 0) weak++; } else if (pre) weak++; /* 잘린 제목으로 맞춘 것은 '확인 필요' */
        if (k >= 0) { used.add(k); hits.push(waybills[k]); } }
      const inv = [...new Set(hits.map((w) => w.invoice))]; const n = (o.items || []).length;
      out.push({ orderNo: o.orderNo, recipient: (o.recipient && o.recipient.name) || o.buyer || '', items: (o.items || []).map((i) => i.title), invoice: inv.length === 1 ? inv[0] : inv[0] || null, invoices: inv,
        status: !inv.length ? 'none' : inv.length > 1 ? 'many' : hits.length < n || weak ? 'partial' : 'ok', weak: weak || undefined }); }
    return { byOrder: out, extra: waybills.filter((w, i) => !used.has(i)) };
  }
  const nameOk = (a, b) => !!a && !!b && (a === b || (a.length >= 2 && b.startsWith(a)) || (b.length >= 2 && a.startsWith(b)));

  // ── 실제 집계(날짜별 총 건수·판매 매출)로 우리 주문을 날짜 묶음으로 되짚기 ──
  // orders: 판매 주문 [{ id, at: 'YYYY-MM-DD HH:MM', a: [금액 후보…] }] (금액 후보 = 지금 정상 줄 합계·처음 주문 합계 등 — 그날 집계 때 금액이 무엇이었는지 모르므로)
  // days: [{ d, n, amt }]. 날짜 순서대로, 앞 날짜가 끝난 다음 주문부터 n건을 묶고 합계가 실제 매출과 같은지 봄.
  //   같지 않으면 ① 시작을 뒤로 조금(≤slack) 옮기고 ② 묶음 안에서 1~2건을 빼 보는 순서로 정확히 같은 곳을 찾음(그날 집계에 안 든 취소 주문 등). 끝내 못 찾으면 n건 그대로 두고 '차이'로 표시
  function rebuildDays(days, orders, opt) {
    const slack = (opt && opt.slack) || 6; const O = orders.slice().sort((x, y) => String(x.at).localeCompare(String(y.at))); const D = days.slice().sort((x, y) => x.d.localeCompare(y.d));
    const amtOf = (o, k) => o.a[Math.min(k, o.a.length - 1)]; const K = Math.max(1, ...O.map((o) => o.a.length));
    const sum = (arr, k) => arr.reduce((s2, o) => s2 + amtOf(o, k), 0);
    const tryWin = (st, n, amt) => { for (let k = 0; k < K; k++) { const w = O.slice(st, st + n); if (w.length === n && sum(w, k) === amt) return { ids: w.map((o) => o.id), skip: [] }; }
      for (let extra = 1; extra <= 2; extra++) { const w = O.slice(st, st + n + extra); if (w.length < n + extra) break; const idx = [...w.keys()];
        const combos = extra === 1 ? idx.map((i) => [i]) : idx.flatMap((i) => idx.filter((j) => j > i).map((j) => [i, j]));
        for (const c of combos) for (let k = 0; k < K; k++) { const keep = w.filter((_, i) => !c.includes(i)); if (sum(keep, k) === amt) return { ids: keep.map((o) => o.id), skip: c.map((i) => w[i].id), used: n + extra }; } }
      return null; };
    const out = new Map(); const firstDay = D.length ? D[0].d : null;
    let i = firstDay ? O.findIndex((o) => String(o.at).slice(0, 10) >= ymd(new Date(new Date(firstDay + 'T12:00:00+09:00').getTime() - 864e5))) : 0; if (i < 0) i = O.length;
    for (const day of D) { if (!day.n) { out.set(day.d, { ids: [], status: 'zero', want: day }); continue; }
      let hit = null, st = i; for (let off = 0; off <= slack && !hit; off++) { const r = tryWin(i + off, day.n, day.amt); if (r) { hit = r; st = i + off; } }
      if (hit) { const skipped = O.slice(i, st).map((o) => o.id).concat(hit.skip); out.set(day.d, { ids: hit.ids, status: 'exact', skipped, want: day }); i = st + (hit.used || day.n); }
      else { const w = O.slice(i, i + day.n); out.set(day.d, { ids: w.map((o) => o.id), status: 'diff', diff: sum(w, 0) - day.amt, want: day }); i += day.n; } }
    return out;
  }

  /* (0.6.0) 📦 오늘 출고 확정 목록 — 발송 요청(shp_state/current.orders)에서 오늘 출고 계획(shp_plan/{날}: ex 뺀 주문 · exItems 뺀 상품 · moveTo 다른 날로 · add 더한 주문)과
   *  지난 계획에서 오늘보다 뒤 날로 옮긴 주문(carry: { 주문번호: 옮긴 날 })을 반영 → { ents:[{id, orderNo, ex}], orders, items, total, out }
   *  ents는 shp_days/{날}.entries 모양 · 상품을 모두 뺀 주문은 들어가지 않음 · 금액 = 남은 상품 판매가 × 수량 */
  function planConfirm(o) { const orders = (o && o.orders) || []; const plan = (o && o.plan) || {}; const carry = (o && o.carry) || {}; const exO = plan.ex || {}; const exI = plan.exItems || {}; const mv = { ...carry, ...(plan.moveTo || {}) };
    const isOut = (x) => !!exO[x.orderNo] || !!mv[x.orderNo]; const inc = orders.filter((x) => !isOut(x)); const out = orders.filter(isOut);
    const keep = inc.map((x) => ({ ...x, items: (x.items || []).filter((it) => !(exI[x.orderNo] || []).includes(it.title)) })).filter((x) => x.items.length);
    const ents = keep.map((x) => ({ id: 'aladin_' + x.orderNo, orderNo: x.orderNo, ex: exI[x.orderNo] || [] }));
    (plan.add || []).filter((ono) => !inc.some((x) => x.orderNo === ono) && !ents.some((e) => e.orderNo === ono)).forEach((ono) => ents.push({ id: 'aladin_' + ono, orderNo: ono, ex: [] }));
    const items = keep.flatMap((x) => x.items); const total = items.reduce((a, i) => a + (+i.price || 0) * (+i.qty || 1), 0);
    return { ents, orders: keep, items: items.length, total, out: out.length }; }
  const API = { VERSION, planConfirm, parseDeliveryPage, parseShippedPage, KR_HOLIDAYS, holName, pickupRun, dayKeyAdd, SHELF_ORDER, shelfOf, shelfRank, shelfName, byShelfTitle, bySku, shelfColor, sortShipment, isBizDay, nextBizDay, dueShipDay, ymd, DEFAULT_CUT, cutMin, cutOf, cutIsSet, ALADIN_XLS_HEAD, parseAladinOrderExcel, alpsUploadAoa, parseAlpsWaybills, matchInvoices, rebuildDays };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; root.ReadnowShipping = API;
})(typeof window !== 'undefined' ? window : globalThis);
