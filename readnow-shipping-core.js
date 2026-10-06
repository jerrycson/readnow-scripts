// ==========================================================================
// ReadNow Shipping Core — 0.2.1  (출고: 알라딘 판매관리 화면 읽기 · 서가 순서 · 영업일)
// 웹앱(오늘 출고 화면)과 수집기(발송 요청 읽기)가 같이 쓰는 기준 — 같은 기준은 여기 한 곳에만
// 알라딘 판매관리 흐름: ① 주문확인요청(orderstep=3) → [발송준비시작] → ② 발송 요청(orderstep=4, 송장 입력)
//   → [입력완료] → ③ 배송&구매확정전(출고 후 5일 안에 수령확인 없으면 6일째 자동 구매확정) → ④ 구매확정&정산대기(다음 날 새벽 예치금 정산) → ⑤ 정산완료(3개월 보관)
// 오늘 출고 = ② 발송 요청 탭에 있는 주문 (영업일 오후 1~3시 출고, 고객에게는 1시 안내)
// ==========================================================================
(function (root) {
  'use strict';
  const VERSION = '0.2.1';
  const T = (el) => (el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const toInt = (s) => { const n = parseInt(String(s || '').replace(/[^\d-]/g, ''), 10); return isNaN(n) ? null : n; };

  // ── ② 발송 요청 화면(worder_delivery.aspx?orderstep=4) 읽기 ──
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
      const ti = cells.findIndex((td) => td.contains(titleA)); const qty = ti >= 0 ? toInt(T(cells[ti + 1])) : null;
      const buyerA = tr.querySelector('a[onclick*="viewAddrLayer"][onclick*=",0)"]'); if (buyerA && !cur.buyer) { cur.buyer = T(buyerA); const em = (buyerA.parentElement.getAttribute('title') || '').trim(); cur.buyerEmail = em || null; }
      const priceCell = cells.find((td, k) => k > ti + 1 && /^[\d,]+$/.test(T(td)) && !td.querySelector('select,input')); const price = priceCell ? toInt(T(priceCell)) : null;
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
  function sortShipment(orders) {
    const out = orders.map((o) => ({ ...o, items: [...o.items].sort(byShelfTitle) }));
    return out.sort((a, b) => byShelfTitle(a.items[0] || {}, b.items[0] || {}));
  }


  // ── 영업일 ── 주말 + 설정한 휴일(웹앱 설정에서 날짜를 넣음)은 출고하지 않음
  const ymd = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); // 한국 날짜
  function isBizDay(d, holidays) { const k = ymd(d); const wd = new Date(k + 'T12:00:00Z').getUTCDay(); /* 한국 날짜의 요일 (실행 기기 시간대와 무관) */ return wd !== 0 && wd !== 6 && !(holidays || []).includes(k); }
  function nextBizDay(d, holidays) { let x = new Date(d.getTime()); do { x = new Date(x.getTime() + 864e5); } while (!isBizDay(x, holidays)); return x; }
  // 주문의 출고 예정일: 영업일 출고 마감(기본 15시) 전 주문 → 그날, 아니면 다음 영업일
  function dueShipDay(orderedAt, opt) { const o = opt || {}; const cut = o.cutHour ?? 15; const t = new Date(String(orderedAt).replace(' ', 'T') + (/[+Z]/.test(String(orderedAt)) ? '' : '+09:00'));
    const h = +new Date(t.getTime() + 9 * 3600e3).toISOString().slice(11, 13); return isBizDay(t, o.holidays) && h < cut ? ymd(t) : ymd(nextBizDay(t, o.holidays)); }

  const API = { VERSION, parseDeliveryPage, SHELF_ORDER, shelfOf, shelfRank, shelfName, byShelfTitle, shelfColor, sortShipment, isBizDay, nextBizDay, dueShipDay, ymd };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; root.ReadnowShipping = API;
})(typeof window !== 'undefined' ? window : globalThis);
