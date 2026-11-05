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
  const VERSION = '0.7.10'; // (0.7.10) 공용 매입 후보 판정 bbNear·bbNetParts(웹앱 bbNearJ와 같은 답) · 저가·관리코드 규칙이 이것을 씀(정범님 11/05 밤) // (판 번호는 합칠 때) 저가·관리코드 상품 매입가를 알면 웹앱 '매입 후보'와 같은 판정(bbNear — 순이익 − 매입가 < 기준 차액 · bbNetParts·bbMarginOf) // (0.7.9) 저가·관리코드 상품: 알라딘 매입가를 모르면 25% 기준 안 쓰고 통과 — 매입가보다 쌀 때만 검토(정범님 11/05 밤) // (판 번호는 합칠 때) 저가·관리코드 상품은 매입가를 몰라도 25% 기준 안 씀 — 매입가보다 쌀 때만 검토(정범님 11/05 밤) // (0.7.8) 예스24 주문 칸 이름 후보에 ORD_JOB_PROC(_NM)·ORD_DTS·PAY_DTS·TEL_NO // (0.7.7) 예스24 예전 주문(y24OrdGone·y24OrdOld)·알라딘 먼저 팔림(y24AlFirst)·허브 요약·ALPS 줄(y24AlpsRows) · '발송처리 예정' 바르게 읽기 // (0.7.6) 예스24 주문 응답 풀기(y24OrdParse·y24OrdGroup·y24OrdMerge·y24OrdLeft) · 검색으로 찾은 같은 책 견주기(srchOthers) · 시장 자료 없음 다시 판단(autoRetry*) // (11/04 · 판 번호는 합칠 때) ⑨ 미등록·ISBN 없는 상품은 검색으로 찾은 같은 책(srch)을 견줄 대상으로(srchOthers — 같은 책 sure·애매 loose) · ⑩ 시장 자료 없음·단독 검토는 자료가 들어오면 다시 판단(autoRetryInit·autoRetryCheck·autoRetryTxt) // (0.7.5) 🤖 자동 발송요청 ① 권수·묶음 평균(정범님 10/29): qtyMax 20까지 권수 검토 없음 · 넘으면 bundleSize 20권 묶음(bundleRound ceil 기본)당 총액 평균 ≥ bundleWon 60,000이면 통과 · 미만 검토 · bundleOn 끄면 예전처럼 무조건 검토 · ⑧ maxItemWon·maxTotalWon(기본 0 = 안 씀 · kind 'big') · 돌려줌에 bundle{n,avg,size,won,ok,why} · minQty는 옛 이름(= qtyMax) // (0.7.4) ⑦ 단독 매물 검토(aloneOn · mktOthers · kind 'alone') // 🤖 자동 발송요청 ⑦ 단독 매물(첫 페이지에 우리 매물뿐 — 견줄 다른 판매자 매물 없음)이면 검토(aloneOn · 기본 켬 · kind 'alone') // (0.7.3) 저가·YLW 매입가: 우리 등급 칸이 없으면 가장 가까운 다른 등급 매입가와 견줌(bbPick) // (0.7.2) 🤖 자동 발송요청 YLW·저가 상품 알라딘 매입가 기준(autoLowOf·bbOf) // (0.7.1) 🤖 자동 발송요청 판단(autoShipDecide · AUTO_DEFAULTS · custRisk) — 판매가 비교는 출고 카드 판매가 평가와 같은 ReadnowML.evalSale // (0.7.0) 🇰🇷 법정 공휴일 미리 넣음·택배 수거 달력(pickup off/on)·실제 발송 묶음(pickupRun)·③ 배송&구매확정전 화면 읽기(parseShippedPage — 그날 출고 = 발송일이 그날인 주문) // (0.6.0) planConfirm — 오늘 출고 확정 목록 계산(웹앱 '출고 확정' 단추와 클라우드 출고 시각 자동 확정이 같은 기준) 
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
  /* ══ 🤖 자동 발송요청 판단 (정범님 10/26) — 주문확인요청에 새로 들어온 주문을 클라우드가 판단해 통과면 '발송준비시작'(발송요청)을 맡기고, 아래 조건이면 사람 검토로 남김
   *  같은 기준은 여기 한 곳 — 클라우드(판단)·웹앱(설정 화면·설명)이 같이 씀. 판매가 비교는 출고 카드 '판매가 평가' 알약과 같은 계산(readnow-ml-core.js evalSale — 주입)
   *  관리자 검토 조건(설정 app_settings/ship_auto에서 바꿈):
   *   ① 권수·묶음 평균(정범님 10/29 확정 — 예전 '5권 이상이면 검토'를 바꿈): 한 주문 권수(수량 합)가 qtyMax(기본 20)까지는 권수로 검토하지 않음 · qtyMax를 넘으면 bundleSize(기본 20)권을 한 묶음으로(올림 — bundleRound ceil|floor|round)
   *      묶음 수 = 올림(권수 ÷ 20)(1권만 넘어도 한 묶음) · 평균 = 총 주문 금액 ÷ 묶음 수 → 평균이 bundleWon(기본 60,000원) 미만이면 검토, 이상이면 통과(정확히 60,000원도 통과)
   *      검산(정범님 예): 38권 12만 → 2묶음 6만 통과 · 21권 5.8만 → 2묶음 2.9만 검토 · 30권 12만 → 2묶음 6만 통과 · 42권 17만 → 3묶음 5.67만 검토 · 72권 24만 → 4묶음 6만 통과
   *      bundleOn을 끄면 예전처럼 qtyMax를 넘는 주문은 무조건 검토(kind 'qty' 그대로)
   *   ⑧ (선택·기본 끔 = 0) 금액 상한: 한 상품 판매가 ≥ maxItemWon 또는 총 주문 금액 ≥ maxTotalWon이면 검토(kind 'big') — 정범님이 값을 정할 때만 켜짐(기준을 지어내지 않음)
   *   ② 상품 판매가가 그때 시장(주문 뒤 읽은 알라딘 온라인 중고 첫 페이지)의 유효 최저가보다 cheapPct%(기본 25 — 정범님 지정) 넘게 쌈
   *      유효 = 짙은 초록·초록 판매자 + 알라딘측(판매가 평가 알약과 같음 · 우리 매물·팔린 우리 줄은 뺌) · 정확히 25%면 통과('넘게')
   *   ③ (선택·기본 켬) 주문인·수령인 이름(또는 주문인 이메일)으로 찾은 우리 고객 기록이 ⛔ 블랙리스트·🔗 판매자 연관 — 웹앱 고객 표시와 같은 뜻(custRisk)
   *   ④ 시장 자료가 끝내 없음 — 주문을 처음 본 뒤 waitMin분(기본 10)까지 기다림(클라우드 시장 읽기는 보통 1분 안 · 실패하면 2·4분 뒤 다시 → 10분이면 세 번 시도가 들어감)
   *      시장을 못 읽는다고 확정된 상품(알라딘 상품 번호를 못 찾음 등 mktErr)은 기다리지 않고 바로 검토
   *   ⑤ (선택·기본 끔) 첫 페이지에 유효 매물이 하나도 없어 판매가를 견줄 수 없음
   *   ⑥ (정범님 10/28 · 기본 켬) 저가·YLW 상품 = 관리코드가 lowSku(기본 'YLW')로 시작하거나 판매가가 lowPrice원(기본 4,000) 이하 → ② 25% 규칙 대신
   *      알라딘 매입가(그 상품 · 우리 등급 — 주문 뒤 읽은 온라인 중고 화면의 '알라딘 중고 매입가' 표 = shp_enrich mkt.buyback)를 알면 웹앱 '매입 후보'와 같은 판정(bbNear):
   *      순이익(판매가 − 수수료 − 포장·택배비 + 손님 배송비) − 매입가 < 기준 차액(기본 500원 · app_settings/main.bbMargin)이면 매입 후보 → 검토(bbLow) · 아니면 통과
   *      (정범님 11/05 밤 '매입가 후보 안에 들지 않는 한 무조건 자동 결정' — 예전엔 판매가 < 매입가일 때만 검토라 웹앱이 매입 후보라 하는 책도 통과했음 · 넘겨받는 x.bb = { margin, policy, D })
   *      매입가를 모르면(알라딘이 안 사는 책·그 등급 칸 없음·표를 못 읽음) = 매입가 후보 아님 → 25% 기준 안 쓰고 통과(정범님 11/05 밤 바로잡음 — 예전엔 25% 규칙으로 봤음)
   *   ⑦ (정범님 10/28 · 기본 켬 aloneOn) 단독 매물 = 그 상품의 시장(주문 뒤 읽은 첫 페이지)에 우리 매물 말고는 다른 판매자 매물이 하나도 없음 → 견줄 대상이 없어 검토(kind 'alone')
   *      우리 줄 = c 'ours'(판매자 번호 996008 북스킹 · 클라우드/수집기가 시장 줄에 붙인 표시) · sc '996008' · 이 주문 상품 번호(lid)와 같은 줄 — 판매가 평가(ReadnowML.evalSale)가 '다른 매물'에서 빼는 것과 같음
   *      다른 판매자 매물 = 그 밖의 줄 중 값이 있고 품절(so)이 아니며 바깥 검색 줄(srch)이 아닌 것 — 알라딘측(직접 배송·중고매장)도 견줄 대상으로 셈 · 판매가가 몇이든(저가·YLW 매입가 통과여도) 검토
   *  ※ 더 비싸게 팔린 것은 어느 길에서도 검토가 아님(정범님 10/28 '위로는 얼마든지 비싸도 상관 없어') — 검토는 '싸게'(②·⑥)·권수·고객·시장 없음·(선택)유효 매물 없음뿐
   *  돌려줌: { state: 'wait'|'pass'|'review', reasons:[글], kinds:[qty|big|cheap|bbLow|alone|cust|nomkt|novalid|read], bundle:{n,avg,size,won,ok,why}|null(qtyMax 넘는 주문만), qty, total, top:{title,price,qty,lid,grade}, items:[상품마다 판정 근거 · rule 'bb'|'bbNone'|'pct'], waitLeftMs } */
  const AUTO_DEFAULTS = { on: true, qtyMax: 20, bundleOn: true, bundleSize: 20, bundleWon: 60000, bundleRound: 'ceil', maxItemWon: 0, maxTotalWon: 0, cheapPct: 25, waitMin: 10, noValid: false, custBlock: true, lowOn: true, lowPrice: 4000, lowSku: 'YLW', aloneOn: true, srchOn: true, srchDays: 7, mktRetryOn: true, mktRetryMax: 12 }; /* (11/04) ⑨ srchOn·srchDays — 미등록·ISBN 없는 상품은 검색으로 찾은 같은 책을 견줄 대상으로(srchDays = 그 검색 자료를 쓰는 최대 나이 · 근거: 수집기 검색 시세가 기본 7일에 한 번 다시 봄) · ⑩ mktRetryOn·mktRetryMax — 시장 자료가 없어 검토로 간 주문은 시장을 다시 읽게 맡기고 자료가 들어오면 저절로 다시 판단(mktRetryMax 12번 · 근거: 없음, 설정으로 바꿈 — 2·4·8·16·32·60분… 간격이면 약 8시간) */
  /* ⑥ 저가·YLW 상품인지 — 같은 판단을 웹앱(설정 설명·출고 카드)이 같이 씀 · 돌려줌 null(아님) 또는 { sku, price } (어느 조건으로 걸렸나) */
  function autoLowOf(it, cfg, sku) { cfg = autoCfg(cfg); if (!cfg.lowOn) return null; const k = String(sku || (it && it.sku) || '').trim().toUpperCase(); const pre = String(cfg.lowSku || '').trim().toUpperCase(); const pr = +(it && it.price) || 0;
    const bySku = !!(pre && k.startsWith(pre)), byPrice = cfg.lowPrice > 0 && pr > 0 && pr <= cfg.lowPrice; return bySku || byPrice ? { sku: bySku, price: byPrice } : null; }
  /* 알라딘 매입가(그 등급) — mkt.buyback {최상, 상, 중} 숫자만 · 0·빈 칸·모르는 등급 = 모름(null) */
  /* (정범님 10/28 11:32) 우리 등급 칸에 매입가가 없으면 다른 등급이라도 매입가가 있으면 그것과 견줌 — 우리 등급에 가장 가까운 등급부터(같은 거리면 더 좋은 등급 = 더 높은 매입가라 더 엄격). 돌려줌 { v, g, alt } */
  const BB_ORD = ['최상', '상', '중', '하'];
  function bbPick(m, grade) { const B = m && m.buyback; if (!B || typeof B !== 'object') return null; const ok = (x) => Number.isFinite(x) && x > 0;
    if (grade && ok(+B[grade])) return { v: +B[grade], g: grade, alt: false };
    const gi = BB_ORD.indexOf(grade); const c = Object.keys(B).filter((k) => ok(+B[k])).map((k) => { const i = BB_ORD.indexOf(k); return { k, d: i < 0 ? 9 : gi < 0 ? i : Math.abs(i - gi), i: i < 0 ? 9 : i }; }).sort((a, b) => a.d - b.d || a.i - b.i);
    return c.length ? { v: +B[c[0].k], g: c[0].k, alt: true } : null; }
  function bbOf(m, grade) { const x = bbPick(m, grade); return x ? x.v : null; }
  /* (정범님 11/05 밤 '매입가 후보 안에 들지 않는 한 무조건 자동 결정') 🏷 알라딘 매입 후보 판정 — 한 곳
   *  웹앱 📥 등록·🏷 알라딘 매입·수동 일괄·상품 상세·경영(bbNearJ)과 자동 발송요청 저가·관리코드 규칙(autoShipDecide ⑥)이 같이 부름 — 같은 책이면 같은 답
   *  직접 팔아 남는 돈(순이익) = 판매가 × (1 − 수수료율) − (포장비 + 택배비 − 손님 배송비) ÷ 주문당 권수 — 판정 엔진 sellNet과 같은 셈(반올림)
   *  더 남는 돈(차) = 순이익 − 알라딘 매입가 · 차 < 기준 차액(기본 500원 · app_settings/main.bbMargin)이면 매입 후보 · 차 ≤ 0이면 '매입이 나음'
   *  o = { margin: 기준 차액(원), policy: { fee: 손님 배송비, freeOver: 무료배송 기준 } (crm_system/shopPolicy.current), D: { feeRate, packPerOrder, courierPerOrder, booksPerOrder } (판정 엔진 DEFAULTS) }
   *  D가 없으면 판정 엔진 DEFAULTS와 같은 값(BB_NET_DEF) · policy가 없으면 손님 배송비 0원으로 셈(가장 보수적 — 더 자주 후보) */
  const BB_MARGIN_DEF = 500; const BB_NET_DEF = { feeRate: 0.10, packPerOrder: 394, courierPerOrder: 2500, booksPerOrder: 1 };
  function bbMarginOf(v) { return v != null && v !== '' && Number.isFinite(+v) && +v >= 0 && +v <= 100000 ? Math.round(+v) : BB_MARGIN_DEF; }
  function bbNetParts(P, o) { P = +P; if (!(P > 0)) return null; o = o || {}; const D = o.D || {}; const pol = o.policy || {}; const num = (v, d) => (v != null && Number.isFinite(+v) ? +v : d);
    const fr = num(D.feeRate, BB_NET_DEF.feeRate), pk = num(D.packPerOrder, BB_NET_DEF.packPerOrder), cr = num(D.courierPerOrder, BB_NET_DEF.courierPerOrder), bpo = Math.max(1, num(D.booksPerOrder, BB_NET_DEF.booksPerOrder));
    const cust = pol.freeOver != null && pol.freeOver !== '' && P >= +pol.freeOver ? 0 : num(pol.fee, 0); const fee = Math.round(P * fr), shipNet = Math.max(0, cr - cust), per = Math.round((pk + shipNet) / bpo);
    const net = Math.round(P * (1 - fr) - (pk + shipNet) / bpo); return { fee, fr, pk, cr, cust, shipNet, bpo, per, net }; }
  function bbNear(P, buy, o) { P = +P; buy = +buy; if (!(P > 0) || !(buy > 0)) return null; o = o || {}; const k = bbMarginOf(o.margin); const x = bbNetParts(P, o); if (!x) return null;
    const net = x.net, gain = net - buy; const W = (v) => Math.round(+v || 0).toLocaleString('ko-KR') + '원';
    const calc = `순이익 ${W(net)} − 알라딘 매입가 ${W(buy)} = 차 ${gain < 0 ? '−' + W(-gain) : W(gain)} ${gain < k ? '<' : '≥'} 기준 ${W(k)}`;
    return { in: gain < k, below: gain <= 0, P, buy, k, net, gain, parts: x, calc }; }
  function autoCfg(c) { const x = { ...AUTO_DEFAULTS, ...(c || {}) }; const n = (v, d, lo, hi) => { v = +v; return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    x.qtyMax = Math.round(n(x.qtyMax, AUTO_DEFAULTS.qtyMax, 1, 999)); x.bundleOn = x.bundleOn !== false; x.bundleSize = Math.round(n(x.bundleSize, AUTO_DEFAULTS.bundleSize, 1, 999)); x.bundleWon = Math.round(n(x.bundleWon, AUTO_DEFAULTS.bundleWon, 0, 1e9));
    x.bundleRound = ['ceil', 'floor', 'round'].includes(x.bundleRound) ? x.bundleRound : AUTO_DEFAULTS.bundleRound; x.maxItemWon = Math.round(n(x.maxItemWon, 0, 0, 1e9)); x.maxTotalWon = Math.round(n(x.maxTotalWon, 0, 0, 1e9)); x.minQty = x.qtyMax; /* minQty = 옛 이름(옛 판 화면·기록 호환) */ x.cheapPct = n(x.cheapPct, AUTO_DEFAULTS.cheapPct, 0, 100); x.waitMin = n(x.waitMin, AUTO_DEFAULTS.waitMin, 1, 120); x.on = x.on !== false; x.noValid = !!x.noValid; x.custBlock = x.custBlock !== false;
    x.lowOn = x.lowOn !== false; x.aloneOn = x.aloneOn !== false; x.srchOn = x.srchOn !== false; x.srchDays = n(x.srchDays, AUTO_DEFAULTS.srchDays, 1, 60); x.mktRetryOn = x.mktRetryOn !== false; x.mktRetryMax = Math.round(n(x.mktRetryMax, AUTO_DEFAULTS.mktRetryMax, 0, 48)); x.lowPrice = Math.round(n(x.lowPrice, AUTO_DEFAULTS.lowPrice, 0, 1e7)); x.lowSku = String(x.lowSku == null ? AUTO_DEFAULTS.lowSku : x.lowSku).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12); return x; }
  /* 고객 기록(crm_customers 문서) → ⛔ 블랙리스트 · 🔗 판매자 연관 (웹앱 effFlag·flagsOf와 같은 뜻: 사람이 정한 표시가 먼저, 블랙리스트는 시트 표시도 · 판매자 연관 = 강한 연결 sellerLinks) */
  function custRisk(c) { c = c || {}; const m = (c.flags || {}).blacklist; const bl = m && (m.on === true || m.on === false) ? m.on === true : !!(c.sheetFlags && c.sheetFlags.blacklist);
    const sl = (c.sellerLinks || []).filter((x) => x && x.strong !== false); return { bl, seller: sl.length > 0, sellers: sl.map((x) => x.name || x.sc || x.sellerCode || '').filter(Boolean).slice(0, 3), blWhy: bl ? String((m && m.reason) || (c.sheetFlags && c.sheetFlags.blacklist && c.sheetFlags.blacklist.reason) || '') : '' }; }
  /* ⑦ 단독 매물 — 첫 페이지 줄에서 우리 줄을 뺀 '다른 판매자 매물' 수 (evalSale의 다른 매물과 같은 거르기) */
  const OUR_SC = '996008';
  function mktOthers(rows, lid) { lid = String(lid || ''); return (Array.isArray(rows) ? rows : []).filter((w) => w && +w.p > 0 && !w.so && !w.srch && w.c !== 'ours' && String(w.sc || '') !== OUR_SC && !(lid && String(w.lid || '') === lid)).length; }
  /* ⑨ (정범님 11/04 '선종 영가집 — 미등록 상품이라 단독은 맞는데 검색으로 같은 책의 다른 판매자 상품을 가져왔잖아')
   *  미등록 상품(알라딘 도서 정보 없이 우리가 직접 만든 상품)·ISBN 없는 상품은 그 상품 페이지에 다른 판매자가 붙지 않아 '첫 페이지에 우리 매물뿐'으로 보임
   *  → 클라우드가 주문 뒤 시장을 읽을 때 알라딘 바깥 중고 검색(SearchTarget=Used)으로 같은 책 후보를 함께 읽어 shp_enrich srch에 둠(못 읽으면 수집기 검색 시세 prd_market_nobook)
   *  같은 책(sure) = 이름 일치(공용 상품 파일 match: 이름 90%↑·권 번호 같음) + 판매 가격이 있음 + 우리 상품이 아님 + 제목 본문(앞 [..]·'/' 뒤·끝 (..) 뗀 것)이 검색어와 글자째 같음
   *  애매(loose) = 이름 일치는 했지만 제목에 다른 말이 더 붙음(예: '선종영가집 강해'·'… 해설'·'… 영인본') — 같은 책인지 기계가 확신 못 함 → 견줄 대상으로 쓰지 않고, 단독이면 까닭에 적어 검토 */
  const srchNorm = (t) => { let x = String(t || '').normalize('NFKC').replace(/^\s*\[중고[^\]]*\]\s*/, '').replace(/^(\s*[\[【][^\]】]*[\]】]\s*)+/, ''); x = x.split(/\s*\/\s*/)[0]; for (let i = 0; i < 3; i++) x = x.replace(/\s*[(（\[][^()（）\[\]]*[)）\]]\s*$/, ''); return x.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); };
  /* 검색 줄 하나 → { id, t, cov, m(같은 상품 후보), o(우리 상품), p(그 상품의 가장 싼 중고 값 — 판매자·알라딘·매장 중) } · 클라우드 저장 모양(ps·pa·pt)과 수집기·등록 조회 모양(channels) 둘 다 받음 */
  function srchRowsOf(S) { return (S && Array.isArray(S.rows) ? S.rows : []).filter(Boolean).map((c) => { const ch = c.channels || {}; const ps = [c.ps, c.pa, c.pt, ch.seller && ch.seller.min, ch.aladin && ch.aladin.min, ch.store && ch.store.min].map(Number).filter((v) => Number.isFinite(v) && v > 0);
    return { id: String(c.itemId || c.id || ''), t: String(c.title || c.t || ''), cov: +c.cov || 0, m: c.match != null ? !!c.match : !!c.m, o: !!(c.ours || c.o || /scm996008/.test(String(c.img || ''))), p: ps.length ? Math.min(...ps) : 0 }; }); }
  function srchOthers(S, self, cfg, now) { cfg = autoCfg(cfg); now = now == null ? Date.now() : +now; const me = new Set((self || []).map((x) => String(x || '')).filter(Boolean)); const q = srchNorm(S && (S.q || S.query)); const sure = [], loose = [];
    for (const r of srchRowsOf(S)) { if (!r.m || r.o || !(r.p > 0) || (r.id && me.has(r.id))) continue; (q && srchNorm(r.t) === q ? sure : loose).push(r); }
    sure.sort((a, b) => a.p - b.p); loose.sort((a, b) => a.p - b.p); const at = (S && S.at) || null; const ageD = at ? (now - (Date.parse(at) || 0)) / 864e5 : null;
    return { sure, loose, min: sure.length ? sure[0].p : null, at, ageD, old: ageD != null && ageD > cfg.srchDays, src: (S && S.src) || null, err: (S && S.err) || null }; }
  /* ⑩ (정범님 11/04 '신의 아이들은 모두 춤춘다 — 시장 자료 없음을 처음에 한 번 보고 끝이야?') 시장 자료 없음(nomkt)·단독(alone)만으로 검토가 된 주문
   *  → 판단한 기기가 판단 기록에 mktRetry {on, n, lids, next}를 남기고, 클라우드가 1분마다 봄: 그 상품의 시장 자료(또는 검색으로 찾은 같은 책)가 들어오면 그 주문을 '대기'로 되돌려 다시 판단
   *     아직 없으면 next 시각에 시장 다시 읽기를 맡김(shp_cmds type 'market') — 간격 2·4·8·16·32·60·60…분(클라우드 시장 읽기 실패 뒤 다시 간격과 같음) · 그 상품이 실패 중이면(mktFail.next) 그 시각까지 · 상품 번호를 못 찾은 상품(mktErr)은 1시간 뒤
   *  다른 검토 이유(권수·싼 값·고객 등)가 같이 있으면 다시 판단해도 검토라 하지 않음 · 사람이 맡긴(발송준비시작·✖ 취소) 주문·목록에서 빠진 주문은 멈춤(클라우드가 확인) */
  const RETRY_KINDS = new Set(['nomkt', 'alone']);
  const retryGapMin = (n) => Math.min(60, 2 ** ((+n || 0) + 1));
  const mktUsable = (e) => !!(e && e.mkt && !(e.via === 'search' && !e.mkt.isbnOk));
  function retryLidsOf(items) { return (items || []).filter((p) => p && (p.mkt === 'none' || p.mkt === 'err' || p.srchWait)).map((p) => String(p.lid || '')).filter(Boolean); }
  function autoRetryInit(D, cfg, now) { cfg = autoCfg(cfg); if (!cfg.mktRetryOn || !D || D.state !== 'review') return null; const ks = D.kinds || []; if (!ks.length || !ks.every((k) => RETRY_KINDS.has(k))) return null;
    const lids = retryLidsOf(D.items); if (!lids.length) return null; now = now == null ? Date.now() : +now;
    return { on: true, n: 0, lids, at: new Date(now).toISOString(), next: new Date(now + retryGapMin(0) * 60e3).toISOString() }; }
  /* 돌려줌 act: 'rejudge'(자료가 들어옴 → 다시 판단) · 'reread'(시장 다시 읽기 맡김 · n·next) · 'wait'(다음 시각 전) · 'init'(옛 기록 — 계획을 새로 시작) · 'stop'(end·why) · 'none'(할 일 없음) */
  function autoRetryCheck(v, E, now, cfg) { cfg = autoCfg(cfg); now = now == null ? Date.now() : +now; E = E || {}; if (!v || v.state !== 'review') return { act: 'stop', end: 'state', why: '검토 상태가 아님(이미 다시 판단했거나 사람이 처리)' };
    if (!cfg.mktRetryOn) return { act: 'stop', end: 'off', why: '설정에서 시장 다시 읽기를 끔' };
    const ks = v.kinds || []; if (!ks.length || !ks.every((k) => RETRY_KINDS.has(k))) return { act: 'stop', end: 'other', why: '시장 자료 말고 다른 검토 이유가 있어 다시 판단해도 검토' };
    const items = v.items || []; const dAt = Date.parse(v.decidedAt || v.at || '') || 0; const R = v.mktRetry || null;
    const srchNew = (e) => !!(cfg.srchOn && e && e.srch && (Date.parse(e.srch.at || '') || 0) > dAt);
    const aloneNew = items.filter((p) => p && p.alone && !p.srchWait && srchNew(E[String(p.lid)])).map((p) => String(p.lid));
    const lids = R && Array.isArray(R.lids) ? R.lids.map(String) : retryLidsOf(items);
    const ready = (l) => { const e = E[l]; const p = items.find((x) => x && String(x.lid) === l) || {}; if (p.srchWait) return srchNew(e); return mktUsable(e) || (cfg.srchOn && !!(e && e.srch) && srchOthers(e.srch, [l, e.itemId], cfg, now).sure.length > 0); };
    const wait = lids.filter((l) => !ready(l));
    if (!wait.length && (lids.length || aloneNew.length)) return { act: 'rejudge', lids: [...new Set([...lids, ...aloneNew])], why: lids.length ? '시장 자료가 들어옴' : '검색으로 같은 책 다른 판매자 매물을 새로 찾음' };
    if (!lids.length) return { act: 'none' };
    if (!R) return { act: 'init' };
    const n = +R.n || 0; if (n >= cfg.mktRetryMax) return { act: 'stop', end: 'max', why: `${n}번 다시 읽어도 시장 자료가 없음 — 사람이 확인` };
    let nx = Date.parse(R.next || '') || 0; for (const l of wait) { const e = E[l]; if (e && e.mktFail && e.mktFail.next) nx = Math.max(nx, Date.parse(e.mktFail.next) || 0); if (e && e.mktErr && e.at) nx = Math.max(nx, (Date.parse(e.at) || 0) + 60 * 60e3); }
    if (now < nx) return { act: 'wait', lids: wait, next: new Date(nx).toISOString() };
    return { act: 'reread', lids: wait, n: n + 1, next: new Date(now + retryGapMin(n + 1) * 60e3).toISOString() }; }
  /* 웹앱 출고 카드·알림이 같이 쓰는 한 줄 — 검토 까닭 뒤에 붙임 */
  function autoRetryTxt(v) { const R = v && v.mktRetry; if (!R) return ''; const hm = (s) => { const t = Date.parse(s || ''); return t ? new Date(t + 9 * 3600e3).toISOString().slice(11, 16) : '-'; };
    if (R.on) return R.n ? `시장 다시 읽는 중 — ${R.n}번째 맡김 · 다음 ${hm(R.next)} · 자료가 들어오면 저절로 다시 판단` : `시장 자료가 들어오면 저절로 다시 판단 · 다시 읽기 ${hm(R.next)}에 맡김`;
    if (R.end === 'max') return `${R.n || 0}번 다시 읽어도 시장 자료가 없어 멈춤 — 사람이 확인`; if (R.end === 'human') return '사람이 처리 중이라 다시 읽기 멈춤'; if (R.end === 'gone') return '주문확인요청에서 빠져 다시 읽기 멈춤'; if (R.end === 'off') return '설정에서 시장 다시 읽기를 꺼 멈춤'; return ''; }
  function autoShipDecide(x) { x = x || {}; const cfg = autoCfg(x.cfg); const o = x.order || {}; const items = (o.items || []).filter(Boolean); const E = x.enrich || {}; const ev = typeof x.evalSale === 'function' ? x.evalSale : null; const BBX = x.bb || {}; /* (11/05 밤) 매입 후보 판정 재료 { margin(app_settings/main.bbMargin), policy(crm_system/shopPolicy.current), D(판정 엔진 DEFAULTS) } — 없으면 기본값 */
    const now = x.now != null ? +x.now : Date.now(); const first = x.firstAt != null ? +x.firstAt : now; const W = (v) => Math.round(+v || 0).toLocaleString('ko-KR') + '원'; const sh = (t) => { t = String(t || ''); return t.length > 22 ? t.slice(0, 21) + '…' : t; };
    const qty = items.reduce((a, it) => a + (+it.qty || 1), 0); const total = items.reduce((a, it) => a + (+it.price || 0) * (+it.qty || 1), 0);
    const topIt = items.reduce((m, it) => (!m || (+it.price || 0) > (+m.price || 0) ? it : m), null); const top = topIt ? { title: topIt.title || '', price: +topIt.price || 0, qty: +topIt.qty || 1, lid: topIt.listingId ? String(topIt.listingId) : null, grade: topIt.grade || null } : null;
    const R = [], kinds = new Set(); const add = (k, t) => { kinds.add(k); R.push(t); };
    if (!items.length) add('read', '주문 상품을 하나도 못 읽음 — 알라딘 화면에서 직접 확인'); items.forEach((it) => { if (!(+it.price > 0)) add('read', `「${sh(it.title)}」 판매가를 못 읽음 — 알라딘 화면에서 직접 확인`); });
    /* ① 권수·묶음 평균 (정범님 10/29) */ let BQ = null; const RN = { ceil: '올림', floor: '내림', round: '반올림' }[cfg.bundleRound];
    if (qty > cfg.qtyMax) { if (cfg.bundleOn) { const nb = Math.max(1, Math[cfg.bundleRound](qty / cfg.bundleSize)); const avg = total / nb; BQ = { n: nb, avg: Math.round(avg), size: cfg.bundleSize, won: cfg.bundleWon, ok: avg >= cfg.bundleWon };
        BQ.why = `${qty}권(${cfg.qtyMax}권 넘음) · 총 ${W(total)} ÷ ${cfg.bundleSize}권 묶음 ${nb}개(${RN}) = 묶음당 평균 ${W(avg)}`; if (!BQ.ok) add('qty', `한 주문 ${BQ.why} — 기준 ${W(cfg.bundleWon)} 미만 (묶음당 평균이 기준 이상이면 자동)`); else BQ.why += ` — 기준 ${W(cfg.bundleWon)} 이상이라 통과`; }
      else add('qty', `한 주문 상품 ${qty}권 (기준 ${cfg.qtyMax}권 넘음 · 묶음 평균 기준 꺼짐)`); }
    /* ⑧ 금액 상한(선택) */ if (cfg.maxItemWon > 0 && top && top.price >= cfg.maxItemWon) add('big', `「${sh(top.title)}」 ${W(top.price)} — 한 상품 ${W(cfg.maxItemWon)} 이상 (설정한 금액 상한)`);
    if (cfg.maxTotalWon > 0 && total >= cfg.maxTotalWon) add('big', `총 주문 금액 ${W(total)} — ${W(cfg.maxTotalWon)} 이상 (설정한 총액 상한)`);
    if (cfg.custBlock && x.cust) { (x.cust.hits || []).forEach((h) => { const who = `${h.who || '주문인'} ${h.name || ''}`.trim(); const how = h.weak ? ' (이름만 같은 고객 — 불확실)' : ''; if (h.bl) add('cust', `${who}: ⛔ 블랙리스트 고객${h.blWhy ? ' — ' + h.blWhy : ''}${how}`); if (h.seller) add('cust', `${who}: 🔗 판매자 연관 고객${(h.sellers || []).length ? ' (' + h.sellers.join(', ') + ')' : ''}${how}`); }); if (x.cust.err) add('cust', '고객 기록을 확인하지 못함 — ' + String(x.cust.err).slice(0, 80)); }
    const per = []; const waitL = [], errL = [];
    for (const it of items) { const lid = String(it.listingId || ''); const e = E[lid] || null; const m = e && e.mkt; const byName = !!(m && e.via === 'search' && !m.isbnOk);
      const b = { lid, title: it.title || '', price: +it.price || 0, qty: +it.qty || 1, grade: it.grade || (e && e.grade) || null };
      const SO = cfg.srchOn && e && e.srch ? srchOthers(e.srch, [lid, e.itemId], cfg, now) : null; const W0 = (v) => W(v);
      const srchCheap = (P) => { /* 검색으로 찾은 같은 책 다른 판매자 최저가와 견줌 — 25% 규칙과 같은 기준 · 판매자 색은 모름(검색 화면엔 판매자가 없음) */ const ratio = SO.min ? b.price / SO.min - 1 : null; P.srchRatio = ratio != null ? Math.round(ratio * 1000) / 1000 : null;
        if (ratio != null && ratio < -cfg.cheapPct / 100) { P.flag = 'cheap'; P.why = `검색으로 찾은 같은 책 다른 판매자 최저가 ${W0(SO.min)}보다 ${Math.round(-ratio * 100)}% 쌈 → 검토`; add('cheap', `「${sh(b.title)}」 ${W(b.price)} — 검색으로 찾은 같은 책 다른 판매자 최저가 ${W0(SO.min)}보다 ${Math.round(-ratio * 100)}% 쌈 (기준 ${cfg.cheapPct}% 넘게)`); }
        else P.why = `검색으로 찾은 같은 책 다른 판매자 매물 ${SO.sure.length}개 · 최저 ${W0(SO.min)} 대비 ${ratio > 0 ? '+' : ''}${Math.round((ratio || 0) * 100)}%${P.why ? ' · ' + P.why : ''}`; };
      const srchTag = (P) => { if (!SO) return; P.srchN = SO.sure.length; P.srchLoose = SO.loose.length; P.srchMin = SO.min; P.srchAt = SO.at; if (SO.src) P.srchSrc = SO.src; };
      if ((!m || byName) && SO && SO.sure.length && !SO.old) { /* ⑨ 시장 페이지를 못 읽었어도(미등록·ISBN 없음 — 상품 번호를 못 찾음 등) 검색으로 찾은 같은 책으로 판단 */
        const P = { ...b, mkt: 'srch', at: SO.at, nOther: SO.sure.length, alone: false, rule: 'srch' }; srchTag(P); srchCheap(P); per.push(P); continue; }
      if (!m || byName) { const err = e && e.mktErr && !byName ? String(e.mktErr) : null; per.push({ ...b, mkt: err ? 'err' : 'none', why: err || (byName ? '이름으로 찾은 시장(다른 판일 수 있음)이라 쓰지 않음 — 클라우드가 ISBN으로 다시 읽는 중' : e && e.mktFail ? '시장 읽기 실패 — 다시 읽는 중: ' + String(e.mktFail.msg || '').slice(0, 60) : '시장을 아직 못 읽음') }); if (SO) { const q0 = per[per.length - 1]; srchTag(q0); q0.why += SO.old ? ` · 검색으로 찾은 같은 책 자료가 ${Math.floor(SO.ageD)}일 전 것이라 쓰지 않음` : SO.loose.length ? ` · 검색으로 이름이 비슷한 매물 ${SO.loose.length}개를 찾았지만 같은 책인지 애매` : ' · 검색으로도 같은 책 다른 판매자 매물을 못 찾음'; } (err ? errL : waitL).push(b); continue; }
      const r = ev ? ev({ p: b.price, g: b.grade || '', rows: (m.rows || []).slice(0, 20), lid, ps: m.np && m.np.ps, pl: m.np && m.np.pl, av: m.np && m.np.av }) : null;
      const P = { ...b, mkt: 'ok', at: m.at || null, ratio: r && r.ratio != null ? r.ratio : null, ref: r ? r.ref : null, refHow: r ? r.refHow || '' : '', tier: r ? r.tier || null : null, verdict: r ? r.verdict || '' : '평가 파일 없음', nValid: r && r.feat ? r.feat.nValid : null };
      P.nOther = mktOthers((m.rows || []).slice(0, 20), lid); let alone = P.nOther === 0;
      if (alone && SO) { srchTag(P); if (SO.old) P.srchWhy = `검색으로 찾은 같은 책 자료가 ${Math.floor(SO.ageD)}일 전 것이라 쓰지 않음(${cfg.srchDays}일까지)`; else if (SO.sure.length) { alone = false; P.nOther = SO.sure.length; P.rule0 = 'srch'; } else if (SO.loose.length) P.srchWhy = `검색으로 이름이 비슷한 매물 ${SO.loose.length}개(${SO.loose.slice(0, 2).map((r) => `「${sh(r.t)}」 ${W(r.p)}`).join(' · ')}${SO.loose.length > 2 ? ' 등' : ''})를 찾았지만 같은 책인지 애매 — 사람이 확인`; else P.srchWhy = SO.err && !srchRowsOf(e.srch).length ? `검색을 못 읽음(${String(SO.err).slice(0, 40)})` : '검색으로도 같은 책 다른 판매자 매물을 못 찾음'; }
      else if (alone && cfg.srchOn && e && e.srchNeed && !e.srch) { P.srchWait = true; P.srchWhy = '미등록·ISBN 없는 상품 — 검색으로 같은 책을 찾는 중(찾으면 저절로 다시 판단)'; }
      if (alone) P.alone = true;
      const aloneChk = () => { if (!alone || !cfg.aloneOn) return; if (!P.flag || P.flag === 'novalid') P.flag = 'alone'; P.why = '첫 페이지에 우리 매물뿐 — 견줄 다른 판매자 매물이 없어 사람이 값 확인' + (P.srchWhy ? ' · ' + P.srchWhy : '') + (P.why ? ' · ' + P.why : ''); add('alone', `「${sh(b.title)}」 ${W(b.price)} — 첫 페이지에 우리 매물뿐(단독 매물) · 견줄 다른 판매자 매물이 없음${P.srchWhy ? ' · ' + P.srchWhy : ''}`); };
      const sku = it.sku || (e && e.sku) || null; if (sku) P.sku = String(sku); const low = autoLowOf(it, cfg, sku);
      const lowT = low ? [low.sku ? `관리코드 ${cfg.lowSku}…` : '', low.price ? `${W(cfg.lowPrice)} 이하` : ''].filter(Boolean).join(' · ') : '';
      if (low) { const bp = bbPick(m, b.grade); const bb = bp ? bp.v : null; P.low = lowT; P.bb = bb; if (bp) { P.bbG = bp.g; P.bbAlt = bp.alt; } const bgT = bp ? (bp.alt ? `${bp.g} — 우리 등급(${b.grade || '모름'}) 칸이 없어 가장 가까운 등급` : bp.g) : '';
        if (bb != null) { P.rule = 'bb'; /* (정범님 11/05 밤) 웹앱 '매입 후보'와 같은 판정(bbNear — 순이익 − 매입가 < 기준 차액) · 예전: 판매가 < 매입가만 */ const J = bbNear(b.price, bb, BBX);
          if (J) { P.bbNet = J.net; P.bbGain = J.gain; P.bbK = J.k; P.bbIn = J.in; P.bbCalc = J.calc; }
          if (J && J.in) { P.flag = 'bbLow'; P.why = `알라딘 매입 후보 — ${J.calc}(알라딘 매입가 등급 ${bgT}) → 검토`; add('bbLow', `「${sh(b.title)}」 ${W(b.price)} — 알라딘 매입 후보: ${J.calc} (알라딘 매입가 등급 ${bgT} · ${lowT} 상품: 매입 후보가 아니면 통과)`); }
          else P.why = `${lowT} 상품 — 알라딘 매입 후보 아님(${J ? J.calc : '셈 못 함'} · 매입가 등급 ${bgT})이라 통과 (25% 기준 안 씀)`; aloneChk(); per.push(P); continue; }
        /* (정범님 11/05 밤 '해당 코드 혹은 금액 이하면 퍼센트 따지지 않고 매입가 후보 안에 들지 않는 한 무조건 자동 결정') 매입가를 모르면 = 알라딘이 사지 않는 책 = 매입가 후보가 아님 → 25% 기준을 쓰지 않고 통과(예전: 25% 기준으로 봄) */
        P.rule = 'bbNone'; P.bbWhy = `${lowT} 상품 — 알라딘 매입가 없음(알라딘이 안 사는 책 · 매입가 후보 아님)`; P.why = `${lowT} 상품 — 알라딘 매입가 후보가 아니라 통과 (25% 기준 안 씀)`; aloneChk(); per.push(P); continue; } else P.rule = 'pct';
      if (r && r.tier === 'valid' && r.ratio != null && r.ratio < -cfg.cheapPct / 100) { P.flag = 'cheap'; add('cheap', `「${sh(b.title)}」 ${W(b.price)} — ${r.refHow} ${W(r.ref)}보다 ${Math.round(-r.ratio * 100)}% 쌈 (기준 ${cfg.cheapPct}% 넘게)${P.rule === 'bbNone' ? ' · 알라딘 매입가를 몰라 25% 기준으로 봄' : ''}`); }
      else if (P.rule0 === 'srch' && (!r || r.tier !== 'valid')) srchCheap(P);
      else if (!r || r.tier !== 'valid') { P.flag = 'novalid'; P.why = '첫 페이지에 유효 매물이 없어 유효 최저가가 없음' + (P.bbWhy ? ' · ' + P.bbWhy : ''); if (cfg.noValid && !(alone && cfg.aloneOn)) add('novalid', `「${sh(b.title)}」 유효 매물이 없어 판매가를 견줄 수 없음`); }
      else if (P.bbWhy) P.why = P.bbWhy;
      aloneChk(); per.push(P); }
    errL.forEach((b) => add('nomkt', `「${sh(b.title)}」 시장 자료 없음 — ${per.find((p) => p.lid === b.lid).why}`));
    const left = Math.max(0, first + cfg.waitMin * 60e3 - now);
    if (waitL.length && !R.length && left > 0) return { state: 'wait', reasons: [], kinds: [], qty, total, top, bundle: BQ, items: per, waitLeftMs: left, cfg };
    waitL.forEach((b) => add('nomkt', `「${sh(b.title)}」 시장 자료 없음 — ${left > 0 ? '아직 못 읽음(다른 검토 이유가 있어 기다리지 않음)' : `${cfg.waitMin}분 기다려도 못 읽음`}`));
    return { state: R.length ? 'review' : 'pass', reasons: R, kinds: [...kinds], qty, total, top, bundle: BQ, items: per, waitLeftMs: 0, cfg }; }
  // ── 🟦 예스24 주문 응답 풀기 (정범님 11/04 '예스24 주문도 웹앱에서 인식하고 알림으로 처리한 뒤 함께 출고') ──
  // 수집기가 예스24 판매관리('리드나우 연결' 창)에서 가로챈 응답(crm_y24_raw: sig·body·at)을 주문 줄로 · 웹앱(오늘 출고 🟦 예스24 탭)과 클라우드(휴대폰 알림)가 같은 함수를 씀
  // ⚠ 11/04 현재 주문 목록 응답에 줄이 든 표본이 아직 없음(10/30 받은 신규 주문·발송관리 응답은 모두 빈 목록) → 칸 이름을 모름 → 칸마다 여러 후보 이름으로 찾고, 주문번호 칸을 못 찾으면 '모양 모름'으로 돌려줌(웹앱이 '응답 모양 확인 필요'·칸 이름 보기)
  //   칸 이름 후보의 근거: 예스24 판매관리 다른 응답의 이름 규칙(GOODS_NO·GOODS_NM·EAN·GOODS_LEVEL_GB_NM·SALE_STATE_GB·ORD_REMAIN_CNT·DELIVERY_LIST·RESULT_LIST·TOTAL_COUNT) · 주문 칸 자체는 근거 없음(첫 실제 응답을 받으면 맞춤)
  const Y24O_LIST = /^POST \/api\/(Order|Claim)\//i; // 주문·클레임 응답만 (Init·GetCode·GetNewOrderYn 은 코드표·신호라 줄이 없음 → 아래에서 줄 없음으로 끝)
  const Y24O_STAGE = { NewOrderConfirmList: 'new', OrderDeliveryList: 'deliv', CalculatePlannedList: 'sent', OrderTotalList: null, OrderList: null }; // 그 목록에 있으면 예스24 쪽 단계(근거: 메뉴 이름 — 신규 주문(접수확인 전) · 발송관리(발송 대기) · 정산 예정(발송 뒤))
  const Y24O_F = {
    ono: [/^ORD(ER)?_?NO$/i, /^ORD(ER)?_?(NUM|ID|CD)$/i, /^(M|MALL|PAY)_?ORD(ER)?_?NO$/i],
    line: [/^ORD(ER)?_?(DTL|DETAIL|ITEM|GOODS|PROD)_?(NO|SEQ|SN|ID)$/i, /^ORD(ER)?_?SEQ$/i, /^(DTL|DETAIL)_?(NO|SEQ)$/i],
    goodsNo: [/^(USED_)?GOODS_?NO$/i, /^(PROD|PRODUCT|ITEM)_?NO$/i],
    title: [/^GOODS_?(NM|NAME)$/i, /^(PROD|PRODUCT|ITEM)_?(NM|NAME)$/i, /GOODS_?NM/i],
    qty: [/^ORD(ER)?_?(QTY|CNT|COUNT|QUANTITY)$/i, /^(GOODS_|ITEM_)?(QTY|CNT|QUANTITY)$/i, /QTY$/i],
    price: [/^(ORD_|GOODS_|USED_)?(SALE|SELL)_?(PRICE|PRC)$/i, /^(ORD|GOODS)_?(PRICE|PRC|UNIT_?PRICE)$/i, /^PRICE$/i],
    amt: [/^(ORD|PAY|TOT|TOTAL|SETTLE|GOODS)_?(AMT|AMOUNT|PRICE_?SUM|SUM)$/i, /AMT$/i],
    fee: [/(DELV|DLV|DELIVERY|SHIP|BAESONG)_?(FEE|AMT|COST|PRICE|PRC|CHARGE)$/i],
    stCd: [/^ORD_?JOB_?PROC$/i, /^ORD(ER)?_?(STAT|STATE|STS|STATUS)(_?(GB|CD))?$/i, /^(DELV|DLV|DELIVERY|CLAIM)_?(STAT|STATE|STS|STATUS)(_?(GB|CD))?$/i, /^(STAT|STATE|STS|STATUS)(_?(GB|CD))?$/i],
    stNm: [/^ORD_?JOB_?PROC_?NM$/i, /^ORD(ER)?_?(STAT|STATE|STS|STATUS)(_?(GB|CD))?_?NM$/i, /^(DELV|DLV|DELIVERY|CLAIM)_?(STAT|STATE|STS|STATUS)(_?(GB|CD))?_?NM$/i, /(STAT|STATE|STS|STATUS)(_?(GB|CD))?_?NM$/i],
    at: [/^ORD_?DTS$/i, /^PAY_?DTS$/i, /^ORD(ER)?_?(DT|DATE|DTM|DTTM|DATETIME|TIME|YMD|YMDHMS)$/i, /^(PAY|PAYMENT|ACPT|ACCEPT|REG)_?(DT|DATE|DTM|DTTM|YMD)$/i],
    buyer: [/^(ORDR|ORDER|ORD|ORDERER|BUYER|BUY|MEM|MEMBER|CUST)_?(NM|NAME)$/i],
    rcv: [/^(RCVR|RCV|RECV|RECEIVER|RECIPIENT|RCPT|TAKE|DELV_?RCV|ACPR)_?(NM|NAME)$/i],
    phone: [/^(RCVR|RCV|RECV|RECEIVER|RECIPIENT|RCPT|TAKE|ACPR)_?(HP|MOBILE|CELL|TEL|PHONE)(_?NO)?$/i, /^TEL_?NO$/i, /^(HP|MOBILE|CELL)(_?NO)?$/i],
    zip: [/(ZIP|POST)_?(NO|CD|CODE)?$/i],
    addr: [/^(RCVR|RCV|RECV|RECEIVER|RECIPIENT|RCPT|TAKE|DELV|DLV|ACPR)?_?ADDR(ESS)?_?(1|BASE)?$/i],
    addr2: [/ADDR(ESS)?_?(2|DTL|DETAIL)$/i],
    req: [/^(DELV|DLV|DELIVERY)_?(MSG|MEMO|REQ|REQUEST)$/i, /^(REQ|REQUEST)_?(MSG|MEMO)?$/i, /MSG$|MEMO$/i],
    due: [/^(DELV|DLV|SEND|SHIP|DELIVERY)_?(PLAN|DUE|EXP|EXPECT|LIMIT|SCHD)_?(DT|DATE|YMD)$/i, /(PLAN|DUE|LIMIT)_?(DT|DATE|YMD)$/i],
    invNo: [/(INVOICE|WAYBILL|INV|SONGJANG|TRACKING)_?(NO|NUM)$/i, /^(DELV|DLV)_?NO$/i],
    courier: [/^(DELV|DLV|DELIVERY)_?(ENTR|COMP|COMPANY|CO|CORP)_?(NM|NAME)$/i],
    sentAt: [/^(DELV|DLV|SEND|SHIP)_?(DT|DATE|DTM|YMD)$/i],
    ean: [/^(EAN|BARCODE|ISBN|ISBN13)$/i],
    grade: [/^GOODS_?LEVEL_?GB_?NM$/i, /^GOODS_?LEVEL_?GB$/i, /LEVEL.*NM$/i],
    self: [/(SELF|OWN|ENTR_GOODS|SELLER_GOODS|SELR_GOODS|CUST_GOODS)_?(CD|CODE|NO)$/i],
  };
  const Y24O_LV = { '01': '최상', '02': '상', '03': '중', '04': '하' };
  const y24oKey = (row, res) => { const ks = Object.keys(row || {}); for (const re of res) { const k = ks.find((x) => re.test(x) && !(res !== Y24O_F.stNm && res !== Y24O_F.grade && /_?NM$/i.test(x) && /STAT|STATE|STS/i.test(x))); if (k) return k; } return null; };
  const y24oVal = (row, f) => { const k = y24oKey(row, Y24O_F[f]); const v = k ? row[k] : null; return v == null || v === '' ? null : v; };
  const y24oDate = (v) => { if (v == null || v === '') return null; let s = String(v).trim(); const ms = s.match(/^\/Date\((\d+)\)\/$/); if (ms) return new Date(+ms[1]).toISOString(); if (/^\d{13}$/.test(s)) return new Date(+s).toISOString();
    let m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2}))?)?/); if (!m) return null; const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}+09:00`; const t = Date.parse(iso); return isNaN(t) ? null : new Date(t).toISOString(); };
  const y24oNum = (v) => { if (v == null || v === '') return null; const n = +String(v).replace(/[^\d.-]/g, ''); return isNaN(n) ? null : n; };
  const y24oStage = (nm, sigStage) => { const s = String(nm || ''); if (/취소|미입금|결제\s*실패/.test(s)) return 'cancel'; if (/반품|교환|클레임|환불/.test(s)) return 'claim'; if (/구매\s*확정|정산/.test(s)) return 'done'; if (/(발송|배송|출고)\s*(처리\s*)?(예정|대기|준비|요청)|접수\s*확인|주문\s*확인|상품\s*준비/.test(s)) return 'deliv'; /* (11/04 정범님) 예스24 '발송처리 예정' = 주문접수확인 뒤 발송 기다림(알라딘의 발송 요청 탭) — 예전엔 '발송처리'에 걸려 발송 끝으로 읽었음 */ if (/배송\s*중|배송\s*완료|발송\s*완료|출고\s*완료|발송\s*처리/.test(s)) return 'sent'; if (/신규|주문\s*접수|결제\s*완료|입금\s*완료|주문\s*완료/.test(s)) return 'new'; return sigStage || null; };
  function y24oLists(j) { const out = []; const seen = new Set(); const pref = ['RESULT_LIST', 'DELIVERY_LIST', 'ORDER_LIST', 'ORDER_DETAIL_LIST', 'CLAIM_LIST', 'LIST', 'DATA', 'ROWS'];
    const walk = (v, d, k) => { if (!v || d > 3 || seen.has(v)) return; if (typeof v !== 'object') return; seen.add(v); if (Array.isArray(v)) { if (v.length && v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) out.push({ k, a: v }); else if (!v.length && k) out.push({ k, a: v }); return; } const ks = Object.keys(v).sort((a, b) => (pref.indexOf(a) < 0 ? 99 : pref.indexOf(a)) - (pref.indexOf(b) < 0 ? 99 : pref.indexOf(b))); for (const kk of ks) walk(v[kk], d + 1, kk); };
    walk(j, 0, null); return out.filter((L) => !(L.a[0] && ('CD_NO' in L.a[0] || 'CD_DTL_NO' in L.a[0]))); /* 코드표(택배사·판매불가 사유 등)는 주문 줄이 아님 */ }
  // 응답 하나 → { sig, kind(목록 이름), stageHint, lists:[{k, n, keys, map}], rows:[주문 줄], total, unknown(줄은 있는데 주문번호 칸을 모름), empty(목록이 비었음) }
  function y24OrdParse(sig, body, at) { const S0 = String(sig || ''); const R = { sig: S0, at: at || null, kind: (S0.match(/\/api\/\w+\/(\w+)/) || [])[1] || null, stageHint: null, lists: [], rows: [], total: null, unknown: 0, empty: false, json: true };
    R.stageHint = Object.prototype.hasOwnProperty.call(Y24O_STAGE, R.kind) ? Y24O_STAGE[R.kind] : null; if (!Y24O_LIST.test(S0)) return R;
    let j = body; if (typeof body === 'string') { try { j = JSON.parse(body); } catch (e) { R.json = false; return R; } } if (!j || typeof j !== 'object') { R.json = false; return R; } if (j.file) { R.file = true; return R; }
    if (/Init$/i.test(R.kind || '')) { R.init = true; const C = []; for (const L of y24oLists(j)) { if (!/DELIVERY_?COMPANY|DELV_?(ENTR|COMP)|COURIER/i.test(L.k || '')) continue; for (const x of L.a) { const k = Object.keys(x).find((kk) => /(NM|NAME)$/i.test(kk)); if (k && x[k]) C.push(String(x[k]).trim()); } } R.couriers = [...new Set(C)].slice(0, 40); return R; } /* 화면 처음 자료(코드표·택배사 목록) — 주문 줄 아님 · 택배사 이름만 */
    R.total = y24oNum(j.TOTAL_COUNT != null ? j.TOTAL_COUNT : j.TOTAL_CNT != null ? j.TOTAL_CNT : j.totalCount);
    for (const L of y24oLists(j)) { const r0 = L.a[0] || null; const keys = r0 ? Object.keys(r0) : []; const map = {}; if (r0) for (const f of Object.keys(Y24O_F)) { const k = y24oKey(r0, Y24O_F[f]); if (k) map[f] = k; } R.lists.push({ k: L.k, n: L.a.length, keys: keys.slice(0, 120), map });
      if (!L.a.length) continue; if (!map.ono) { R.unknown += L.a.length; continue; }
      L.a.forEach((row, i) => { const ono = String(y24oVal(row, 'ono') || '').trim(); if (!ono) { R.unknown++; return; } const g0 = y24oVal(row, 'grade'); const grade = (String(g0 || '').match(/최상|상|중|하/) || [])[0] || Y24O_LV[String(g0 || '').padStart(2, '0')] || null; const ad = [y24oVal(row, 'addr'), y24oVal(row, 'addr2')].filter(Boolean).join(' ');
        const stNm = y24oVal(row, 'stNm'); const stCd = y24oVal(row, 'stCd');
        R.rows.push({ ono, line: String(y24oVal(row, 'line') || '') || null, idx: i, goodsNo: y24oVal(row, 'goodsNo') != null ? String(y24oVal(row, 'goodsNo')) : null, title: y24oVal(row, 'title') != null ? String(y24oVal(row, 'title')).slice(0, 200) : null, qty: Math.max(1, y24oNum(y24oVal(row, 'qty')) || 1), price: y24oNum(y24oVal(row, 'price')), amt: y24oNum(y24oVal(row, 'amt')), fee: y24oNum(y24oVal(row, 'fee')),
          stCd: stCd != null ? String(stCd) : null, stNm: stNm != null ? String(stNm) : null, stage: y24oStage(stNm, R.stageHint), orderedAt: y24oDate(y24oVal(row, 'at')), due: y24oDate(y24oVal(row, 'due')), sentAt: y24oDate(y24oVal(row, 'sentAt')),
          buyer: y24oVal(row, 'buyer') != null ? String(y24oVal(row, 'buyer')) : null, rcv: y24oVal(row, 'rcv') != null ? String(y24oVal(row, 'rcv')) : null, phone: y24oVal(row, 'phone') != null ? String(y24oVal(row, 'phone')) : null, zip: y24oVal(row, 'zip') != null ? String(y24oVal(row, 'zip')) : null, addr: ad || null, req: y24oVal(row, 'req') != null ? String(y24oVal(row, 'req')).slice(0, 300) : null,
          invNo: y24oVal(row, 'invNo') != null ? String(y24oVal(row, 'invNo')) : null, courier: y24oVal(row, 'courier') != null ? String(y24oVal(row, 'courier')) : null, ean: y24oVal(row, 'ean') != null ? String(y24oVal(row, 'ean')) : null, grade, self: y24oVal(row, 'self') != null ? String(y24oVal(row, 'self')) : null }); }); }
    R.empty = !R.rows.length && !R.unknown && R.lists.length > 0; return R; }
  // 줄들 → 주문(주문번호마다) · 같은 주문의 상품은 items
  function y24OrdGroup(P) { const M = new Map(); for (const r of (P && P.rows) || []) { const o = M.get(r.ono) || M.set(r.ono, { orderNo: r.ono, items: [], stNm: null, stCd: null, stage: null, orderedAt: null, due: null, sentAt: null, buyer: null, rcv: null, phone: null, zip: null, addr: null, req: null, invNo: null, courier: null, fee: null, amt: null }).get(r.ono);
      const lk = r.line || (r.goodsNo ? 'g' + r.goodsNo : 'i' + r.idx); if (!o.items.some((x) => x.k === lk)) o.items.push({ k: lk, goodsNo: r.goodsNo, title: r.title, qty: r.qty, price: r.price != null ? r.price : r.amt != null && r.qty ? Math.round(r.amt / r.qty) : null, ean: r.ean, grade: r.grade, self: r.self, stNm: r.stNm });
      for (const f of ['stNm', 'stCd', 'stage', 'orderedAt', 'due', 'sentAt', 'buyer', 'rcv', 'phone', 'zip', 'addr', 'req', 'invNo', 'courier', 'fee']) if (o[f] == null && r[f] != null) o[f] = r[f]; if (r.amt != null) o.amt = (o.amt || 0) + r.amt; }
    return [...M.values()]; }
  // 주문 기록(crm_y24_orders 문서) 고치기 — 같은 응답을 두 번 풀어도 같은 결과(웹앱·클라우드가 함께 풀어도 됨) · 바뀐 것이 없으면 null · 사람이 적은 칸(man·alStop·mkt·log)은 건드리지 않음
  function y24OrdMerge(prev, o, ctx) { prev = prev || null; const at = (ctx && ctx.at) || new Date().toISOString(); const sig = (ctx && ctx.kind) || 'x'; const P = prev || {};
    const newer = !P.srcAt || String(at) >= String(P.srcAt); const pick = (f) => (newer ? (o[f] != null ? o[f] : P[f] != null ? P[f] : null) : P[f] != null ? P[f] : o[f] != null ? o[f] : null);
    const D = { id: 'y24_' + o.orderNo, platform: 'yes24', orderNo: String(o.orderNo), firstSeenAt: P.firstSeenAt && String(P.firstSeenAt) <= String(at) ? P.firstSeenAt : at, lastSeenAt: P.lastSeenAt && String(P.lastSeenAt) > String(at) ? P.lastSeenAt : at,
      srcAt: newer ? at : P.srcAt, srcKind: newer ? sig : P.srcKind || sig, seen: { ...(P.seen || {}), [sig]: P.seen && String(P.seen[sig] || '') > String(at) ? P.seen[sig] : at },
      items: newer && o.items && o.items.length ? o.items : P.items || o.items || [], ystage: pick('stage'), stNm: pick('stNm'), stCd: pick('stCd'), orderedAt: P.orderedAt || o.orderedAt || null, due: pick('due'), sentAt: pick('sentAt'), fee: pick('fee'), amt: pick('amt'),
      buyer: pick('buyer'), recipient: { name: pick('rcv'), phone: pick('phone'), zip: pick('zip'), address: pick('addr'), request: pick('req') }, yInv: pick('invNo') ? { no: pick('invNo'), courier: pick('courier') } : P.yInv || null };
    if (D.left && newer) delete D.left; if (P.left) { const L = { ...P.left }; if (newer) delete L[sig]; if (Object.keys(L).length) D.left = L; }
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b); const K = ['firstSeenAt', 'lastSeenAt', 'srcAt', 'srcKind', 'seen', 'items', 'ystage', 'stNm', 'stCd', 'orderedAt', 'due', 'sentAt', 'fee', 'amt', 'buyer', 'recipient', 'yInv', 'left'];
    if (prev && K.every((k) => same(prev[k] == null ? null : prev[k], D[k] == null ? null : D[k]))) return null; if (!D.left) D.left = null; return D; }
  // 같은 목록의 더 새 응답(전부 받은 목록일 때만)에 없는 주문 → 그 목록에서 빠짐(예: 신규 주문 → 접수확인됐거나 취소) · { orderNo: 빠진 때 }
  function y24OrdLeft(prevDocs, P) { const out = {}; if (!P || !P.kind || !P.lists.length || P.unknown) return out; const n = P.rows.length; if (P.total != null && P.total > new Set(P.rows.map((r) => r.ono)).size) return out; /* 쪽 나눔으로 일부만 받은 응답이면 판단 안 함 */
    const here = new Set(P.rows.map((r) => r.ono)); for (const d of prevDocs || []) { if (!d || here.has(String(d.orderNo))) continue; const s = d.seen && d.seen[P.kind]; if (s && String(s) < String(P.at) && !(d.left && d.left[P.kind])) out[d.orderNo] = P.at; } return n >= 0 ? out : {}; }
  // ── (11/04 정범님 '예전 주문 3개는 이미 처리됨 · 오늘 주문은 1개') 예전 주문 저절로 닫기 규칙 — 웹앱·클라우드가 같은 판단 ──
  // 예스24 주문 기능을 켠 때(Y24O_START = 1.78.354 판을 낸 커밋 시각) 전에 주문됐고, 예스24 신규 주문·발송관리 두 목록의 더 새 응답(줄을 다 받은 것)에 모두 없으면 = 예스24에서 이미 처리된 예전 주문
  //   한 목록이라도 아직 들어 있거나(예: 오늘 주문 — 접수확인 뒤 발송관리 '발송처리 예정'), 그 목록 응답을 아직 못 받았거나, 사람이 단계를 적었으면 닫지 않음
  const Y24O_START = '2026-11-04T03:11:23.000Z';
  const Y24O_PEND = ['NewOrderConfirmList', 'OrderDeliveryList'];
  function y24OrdGone(o, K, kinds) { const k = (kinds || {})[K]; if (!o || !k || !k.at || k.unknown || k.json === false || k.file) return false; const s = (o.seen || {})[K]; if (s) return !!((o.left || {})[K]); return String(k.at) > String(o.lastSeenAt || o.firstSeenAt || ''); }
  function y24OrdOld(o, kinds, opt) { if (!o || !o.orderNo) return null; const M = o.man || {}; if (M.old) return null; /* 한 번 닫았거나(되돌렸어도) 사람이 정한 것은 다시 판단 안 함 */
    if (['ack', 'out', 'inv'].some((x) => M[x] && !M[x].undo)) return null; const start = (opt && opt.start) || Y24O_START; const at = o.orderedAt || o.firstSeenAt || ''; if (!at || String(at) >= start) return null;
    const st = o.ystage; if (['sent', 'done', 'claim'].includes(st)) return { kind: 'done', why: `기능을 켜기 전 주문 · 예스24 상태 '${o.stNm || st}' — 이미 끝남` };
    if (st === 'cancel') return { kind: 'cancel', why: `기능을 켜기 전 주문 · 예스24에서 취소됨${o.stNm ? `('${o.stNm}')` : ''}` };
    if (Y24O_PEND.every((K) => y24OrdGone(o, K, kinds))) return { kind: 'gone', why: '기능을 켜기 전 주문 · 예스24 신규 주문·발송관리 목록의 더 새 응답에 없음 — 예스24에서 이미 처리됨' };
    return null; }
  // 알라딘에서 먼저 팔림 — 예스24 주문 시각보다 먼저 알라딘 판매(주문)가 있고 지금 알라딘에서 판매중이 아님
  function y24AlFirst(y24At, sales, live) { if (live || !y24At) return null; const L = (sales || []).filter((x) => x && x.at && String(x.at) < String(y24At)).sort((a, b) => String(b.at).localeCompare(String(a.at))); return L[0] || null; }
  // ── 예스24 중고 허브(공개 화면 /Product/UsedShopHub/Hub/번호) 요약 — 다른 판매자 매물 값·등급 (우리 매물은 따로) ──
  function y24HubSum(HP, opt) { const o = opt || {}; const mine = new Set((o.own || []).map(String)); const gOf = (x) => (String(x || '').match(/최상|상|중|하/) || [])[0] || null;
    const all = ((HP && HP.items) || []).filter((x) => x && +x.p > 0).map((x) => ({ id: String(x.id || ''), p: +x.p, g: gOf(x.g), s: x.ship == null ? null : +x.ship, seller: x.seller ? String(x.seller).slice(0, 30) : null, chan: x.chan || null, mine: mine.has(String(x.id)) || (!!o.ownSeller && x.sellerId === o.ownSeller) }));
    const oth = all.filter((x) => !x.mine).sort((a, b) => a.p - b.p); const g = gOf(o.grade); const same = g ? oth.filter((x) => x.g === g) : [];
    return { n: oth.length, nAll: all.length, grade: g, min: oth.length ? oth[0].p : null, minSame: same.length ? same[0].p : null, nSame: same.length, low: oth.slice(0, 8).map(({ id, mine: _m, ...r }) => r), mine: all.filter((x) => x.mine).map((x) => ({ p: x.p, g: x.g })), tab: (HP && HP.tab) || null, newSale: (HP && HP.newSale) || null, newList: (HP && HP.newList) || null }; }
  // ── (11/04 정범님 '송장 출력까지 함께') 📦 ALPS에 예스24 주문을 함께 — 넣을 수 있는지 · 알라딘 발송 요청 엑셀과 같은 칸의 줄 ──
  // 넣는 조건: ① 접수확인함(예스24 발송관리 '발송처리 예정' 또는 사람이 ①을 누름) · 송장 없음(예스24 송장·사람이 적은 송장·② 출고함 모두 없음) · 아직 어떤 ALPS 일에도 넣지 않음 · 받는 분 이름·전화·주소가 있음
  function y24AlpsWhy(o, step) { if (!o) return '주문 없음'; const M = o.man || {}; const on = (k) => M[k] && !M[k].undo; if (step !== 'ack') return step === 'new' ? '예스24 주문접수확인 전' : '처리할 단계가 아님';
    if (o.yInv && o.yInv.no) return '이미 송장 있음'; if (on('inv') || on('out')) return '이미 출고·송장을 적음'; if (o.alps && o.alps.runId && !o.alps.undo) return '이미 ALPS 일에 넣음';
    const R = o.recipient || {}; if (!R.name) return '받는 분 이름 없음'; if (String(R.phone || '').replace(/\D/g, '').length < 9) return '받는 분 전화 없음'; if (!R.address || String(R.address).length < 6) return '받는 분 주소 없음'; if (!(o.items || []).length) return '상품 줄 없음'; return null; }
  const kstStr = (iso) => { const t = Date.parse(iso || ''); return isNaN(t) ? '' : new Date(t + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' '); };
  function y24AlpsRows(o, header, skuOf) { const H = header || ALADIN_XLS_HEAD; const R = o.recipient || {}; return (o.items || []).map((it, k) => { const v = { 상태: '발송요청', 주문번호: String(o.orderNo), 자체상품관리코드: (skuOf && skuOf(it, k)) || '', 상품명: String(it.title || '(상품명 모름)'), ISBN: it.ean || '', 수량: String(+it.qty || 1), 주문인: o.buyer || R.name || '', 수령인: R.name || '', 주문일: kstStr(o.orderedAt || o.firstSeenAt), 판매가: it.price != null ? String(it.price) : '', 판매총액: it.price != null ? String((+it.price || 0) * (+it.qty || 1)) : '', 우편번호: R.zip || '', '수령 주소': R.address || '', 전화1: R.phone || '', 전화2: '', 배송요청사항: R.request || '', 비고: '예스24 주문' };
      return H.map((h) => (v[h] == null ? '' : v[h])); }); }
  const API = { VERSION, planConfirm, AUTO_DEFAULTS, autoCfg, mktOthers, autoLowOf, bbOf, bbPick, BB_MARGIN_DEF, BB_NET_DEF, bbMarginOf, bbNetParts, bbNear, custRisk, autoShipDecide, srchNorm, srchRowsOf, srchOthers, autoRetryInit, autoRetryCheck, autoRetryTxt, retryGapMin, parseDeliveryPage, parseShippedPage, KR_HOLIDAYS, holName, pickupRun, dayKeyAdd, SHELF_ORDER, shelfOf, shelfRank, shelfName, byShelfTitle, bySku, shelfColor, sortShipment, isBizDay, nextBizDay, dueShipDay, ymd, DEFAULT_CUT, cutMin, cutOf, cutIsSet, ALADIN_XLS_HEAD, parseAladinOrderExcel, alpsUploadAoa, parseAlpsWaybills, matchInvoices, rebuildDays, y24OrdParse, y24OrdGroup, y24OrdMerge, y24OrdLeft, Y24O_F, Y24O_START, y24OrdGone, y24OrdOld, y24AlFirst, y24HubSum, y24AlpsWhy, y24AlpsRows };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; root.ReadnowShipping = API;
})(typeof window !== 'undefined' ? window : globalThis);
