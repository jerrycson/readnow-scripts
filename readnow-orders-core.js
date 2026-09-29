/* readnow-orders-core.js
 * 알라딘 샵매니저 주문 관련 페이지 파서 (순수 함수: Document → 데이터)
 * Tampermonkey·웹앱·PC 엔진에서 공통 사용. 저장·네트워크 코드는 넣지 않는다.
 * 빈 값은 null로 반환하고, 화면 표시 단계에서 "-"로 바꾼다.
 */
(function (root) {
  'use strict';
  const VERSION = '0.3.0';
  const EMPTY = '-'; // 화면 표시용

  const txt = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');
  // <br>을 공백으로 바꿔 읽기 (날짜+시간 칸용)
  const txtBr = (el) => (el ? el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const nullIfEmpty = (s) => (s == null || s === '' ? null : s);
  const toInt = (s) => {
    if (s == null) return null;
    const m = String(s).replace(/[,원₩\s]/g, '').match(/-?\d+/);
    return m ? parseInt(m[0], 10) : null;
  };

  // 전화번호: "--", "00-000-0000", 빈칸 → null
  function normPhone(s) {
    s = (s || '').trim();
    if (!s || /^[-\s]*$/.test(s) || /^0+-0+-0+$/.test(s)) return null;
    return s;
  }
  const phoneKey = (s) => (s ? s.replace(/\D/g, '') : null); // 비교·검색용 숫자만

  // "[중고-상] 제목" → {condition:'상', title:'제목'} / "[중고] 제목" → condition null
  function splitTitle(raw) {
    raw = (raw || '').trim();
    const m = raw.match(/^\[중고(?:-([^\]]+))?\]\s*/);
    if (!m) return { condition: null, title: raw, raw };
    return { condition: m[1] ? m[1].trim() : null, title: raw.slice(m[0].length).trim(), raw };
  }

  // 표시 날짜 "26.09.28 10:21" / "2026-09-27" → ISO 문자열, 아니면 null
  function parseDate(s) {
    s = (s || '').trim();
    let m = s.match(/^(\d{2})\.(\d{2})\.(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) return `20${m[1]}-${m[2]}-${m[3]}` + (m[4] ? `T${m[4].padStart(2, '0')}:${m[5]}` : '');
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}` + (m[4] ? `T${m[4].padStart(2, '0')}:${m[5]}` : '');
    return null;
  }
  // 날짜면 date, 아니면 원문(예: 출고작업중)을 status로
  function dateOrStatus(s) {
    const d = parseDate(s);
    return { date: d, raw: nullIfEmpty((s || '').trim()) };
  }

  // 주소 "(01030) 서울..." → {zip, address}
  function splitAddress(s) {
    s = (s || '').trim();
    const m = s.match(/^\((\d{5})\)\s*(.*)$/);
    return m ? { zip: m[1], address: m[2] } : { zip: null, address: nullIfEmpty(s) };
  }

  function platformFromUrl(url) {
    if (/aladin\.co\.kr/i.test(url || '')) return 'aladin';
    return null;
  }

  // 라벨 칸(class t1) 다음의 값 칸을 찾는다. 폭 1px 구분선 칸은 건너뜀.
  function valueCellAfter(td) {
    let n = td.nextElementSibling;
    while (n && (n.getAttribute('width') === '1' || (n.getAttribute('bgcolor') || '').toUpperCase() === '#E1E1E1')) n = n.nextElementSibling;
    return n;
  }
  function labelPairs(doc) {
    const out = [];
    doc.querySelectorAll('td.t1').forEach((td) => {
      const v = valueCellAfter(td);
      out.push({ label: txt(td), cell: v, value: txt(v) });
    });
    return out;
  }

  /* ───────── 주문 상세 팝업 (wpopup_order.aspx?ono=) ───────── */
  function parseOrderPopup(doc, url) {
    const pairs = labelPairs(doc);
    const o = {
      platform: platformFromUrl(url) || 'aladin',
      orderNo: null, stage: null, orderedDate: null, shipped: null, invoiceNo: null,
      orderStatus: null, totalAmount: null, fee: null, shippingFee: null,
      customerKey: null, buyer: null, recipient: null, recipientSameAsBuyer: null,
      shippingRequest: null, items: [], piiAvailable: false,
    };
    const blk = doc.querySelector('[data-custkey]');
    if (blk) o.customerKey = blk.getAttribute('data-custkey'); // 알라딘 고객 고유번호 (개인정보 폐기 후에도 남음)

    let section = 'order'; let item = null;
    const buyer = {}; const rcpt = {};
    for (const { label, cell, value } of pairs) {
      switch (label) {
        case '주문번호': o.orderNo = value; break;
        case '주문단계': o.stage = nullIfEmpty(value); break;
        case '주문일': o.orderedDate = parseDate(value); break;
        case '발송일': o.shipped = dateOrStatus(value); break;
        case '송장번호': o.invoiceNo = nullIfEmpty(value.replace(/수정$/, '').trim()); break;
        case '주문상태': o.orderStatus = nullIfEmpty(value); break;
        case '판매총액': o.totalAmount = toInt(value); break;
        case '수수료': o.fee = toInt(value); break;
        case '배송비': o.shippingFee = /무료/.test(value) ? 0 : toInt(value); break;
        case '주문인': section = 'buyer'; buyer.name = nullIfEmpty(value); o.piiAvailable = true; break;
        case 'E-Mail': buyer.email = nullIfEmpty(value); break;
        case '수령자': section = 'recipient'; rcpt.name = nullIfEmpty(value); break;
        case '전화1': (section === 'recipient' ? rcpt : buyer).phone1 = normPhone(value); break;
        case '전화2': (section === 'recipient' ? rcpt : buyer).phone2 = normPhone(value); break;
        case '주소': Object.assign(rcpt, splitAddress(value)); break;
        case '배송 요청사항': o.shippingRequest = nullIfEmpty(value); break;
        case '제품명': item = { ...splitTitle(value), option: null, qty: null, cancelQty: 0, cancelled: false, isbn13: null, isbnAlt: null, sku: null, note: null }; o.items.push(item); section = 'item'; break;
        case '옵션': if (item) item.option = nullIfEmpty(value); break;
        case '수량': if (item) { // "1개(취소 1개)" → 수량 1, 취소 1 (판매자 품절 취소 등, 판매총액에서 빠짐)
          item.qty = toInt(value); const c = value.match(/취소\s*(\d+)/); item.cancelQty = c ? parseInt(c[1], 10) : 0;
          item.cancelled = item.cancelQty > 0 && item.cancelQty >= (item.qty || 1); } break;
        case 'ISBN': if (item) { // "9788960301658<br>(8960301655)" — 괄호 안은 ISBN10 또는 K코드
          const m = value.match(/(\d{13}|\S+?)\s*\(([^)]+)\)/);
          item.isbn13 = m ? m[1] : nullIfEmpty(value); item.isbnAlt = m ? m[2] : null; } break;
        case '자체상품코드': if (item) item.sku = nullIfEmpty(value); break;
        case '비고': if (item) item.note = nullIfEmpty(value); break;
      }
    }
    if (o.piiAvailable) {
      o.buyer = { name: buyer.name || null, email: buyer.email || null, phone1: buyer.phone1 || null, phone2: buyer.phone2 || null };
      const r = { name: rcpt.name || null, phone1: rcpt.phone1 || null, phone2: rcpt.phone2 || null, zip: rcpt.zip || null, address: rcpt.address || null };
      o.recipientSameAsBuyer = isSamePerson(o.buyer, r);
      o.recipient = r; // 주소는 항상 수령인 쪽에 있으므로 객체는 유지, 같은 사람 여부는 플래그로
    }
    return o;
  }

  // 주문인=수령인 판정: 이름이 "상동"이거나, 이름이 같고 번호가 하나 이상 겹침(또는 수령인 번호 없음)
  function isSamePerson(b, r) {
    if (!b || !r) return null;
    if (r.name === '상동') return true;
    if (!r.name || r.name !== b.name) return false;
    const bp = [b.phone1, b.phone2].map(phoneKey).filter(Boolean);
    const rp = [r.phone1, r.phone2].map(phoneKey).filter(Boolean);
    if (!rp.length || !bp.length) return true;
    return rp.some((p) => bp.includes(p));
  }

  // 취소주문 목록의 비고 "취소요청09.28 07:49" → 주문일의 연도를 붙여 ISO로 (12월 주문·1월 취소는 다음 해)
  function cancelReqAt(note, orderedIso) {
    const m = (note || '').match(/취소요청\s*(\d{2})\.(\d{2})\s+(\d{1,2}):(\d{2})/);
    if (!m) return null;
    let y = orderedIso ? parseInt(orderedIso.slice(0, 4), 10) : new Date().getFullYear();
    if (orderedIso && parseInt(m[1], 10) < parseInt(orderedIso.slice(5, 7), 10)) y += 1;
    return `${y}-${m[1]}-${m[2]}T${m[3].padStart(2, '0')}:${m[4]}`;
  }

  /* ───────── 주문 조회 목록 (worders.aspx) ─────────
   * 전체주문(searchType=20)·취소주문(7)·반품주문(8) 목록이 모두 같은 구조라 이 함수 하나로 읽는다. */
  function parseOrderList(doc, url) {
    const res = { platform: platformFromUrl(url) || 'aladin', searchType: null, total: null, page: null, lastPage: null, rows: [] };
    const u = (url || '').match(/searchType=(\d+)/); if (u) res.searchType = u[1];
    const tot = doc.querySelector('.total2'); if (tot) res.total = toInt(txt(tot));
    doc.querySelectorAll('input[id^="chkOrder."]').forEach((chk, idx) => {
      const tr1 = chk.closest('tr');
      const td1 = [...tr1.children].filter((td) => td.getAttribute('width') !== '1' || td.getAttribute('bgcolor') == null);
      const tds = [...tr1.children].filter((td) => !(td.getAttribute('width') === '1' && td.getAttribute('bgcolor')));
      // tds: [체크, 상태, 주문번호, 상품명, 수량, 주문인, 주문일, 발송일, 판매가, 처리]
      let tr3 = tr1.nextElementSibling; while (tr3 && tr3.previousElementSibling !== tr1.nextElementSibling) tr3 = tr3.nextElementSibling;
      tr3 = tr1.nextElementSibling && tr1.nextElementSibling.nextElementSibling;
      const t3 = tr3 ? [...tr3.children] : [];
      const buyerCell = tds[5];
      const buyerName = buyerCell ? txt(buyerCell.querySelector('a')) : null;
      const emailMasked = buyerCell ? (buyerCell.textContent.match(/([A-Za-z0-9._%+\-]+@\.\.)/) || [])[1] || null : null;
      const layer = tr3 ? tr3.querySelector('.addrLayers') : null;
      const lp = {};
      if (layer) layer.querySelectorAll('td').forEach((td) => {
        const lab = txt(td); const v = td.nextElementSibling;
        if (v && ['성명', '전화1', '전화2', '주소', '배송비', '증빙서류', '배송요청사항'].includes(lab)) lp[lab] = txt(v);
      });
      const shippedTxt = tds[7] ? txtBr(tds[7]) : '';
      const t = splitTitle(tds[3] ? txt(tds[3]) : '');
      res.rows.push({
        seq: idx,
        orderNo: txt(tds[2]),
        rowStatus: nullIfEmpty(txt(tds[1])),
        condition: t.condition, title: t.title, rawTitle: t.raw,
        qty: toInt(txt(tds[4])),
        buyerName: nullIfEmpty(buyerName), buyerEmailMasked: emailMasked,
        orderedAt: parseDate(txtBr(tds[6])),
        shipped: { date: parseDate(shippedTxt), raw: nullIfEmpty(shippedTxt) },
        price: toInt(tds[8] ? txt(tds[8]) : null),
        returnReason: nullIfEmpty(t3[0] ? txt(t3[0]) : ''),
        cancelQty: t3[1] ? toInt(txt(t3[1])) : null,
        recipientLabel: nullIfEmpty(t3[2] ? txt(t3[2].querySelector('a')) : ''),
        paidAt: t3[3] ? parseDate(txtBr(t3[3])) : null,
        rowNote: nullIfEmpty(t3[4] ? txt(t3[4]) : ''),
        cancelRequestedAt: cancelReqAt(t3[4] ? txt(t3[4]) : '', parseDate(txtBr(tds[6]))),
        recipient: layer ? { name: nullIfEmpty(lp['성명']), phone1: normPhone(lp['전화1']), phone2: normPhone(lp['전화2']), ...splitAddress(lp['주소']), shippingRequest: nullIfEmpty(lp['배송요청사항']) } : null,
      });
    });
    // 페이지: 현재·마지막
    const pages = [...doc.querySelectorAll('a[onclick*="Page_Set"]')].map((a) => toInt((a.getAttribute('onclick').match(/Page_Set\('(\d+)'\)/) || [])[1]));
    const cur = doc.querySelector('.pagenum_on'); res.page = cur ? toInt(txt(cur)) : 1;
    res.lastPage = pages.length ? Math.max(res.page || 1, ...pages.filter(Boolean)) : res.page;
    return res;
  }

  // 목록 행(같은 주문번호 묶음) ↔ 팝업 상품 연결: 제목 일치 우선, 남으면 순서대로
  // 전체주문 목록에는 주문 안에서 취소된 상품이 나오지 않으므로, 취소 안 된 상품끼리 비교한다.
  function matchListToPopup(listRows, popup) {
    const items = popup.items.map((it, i) => ({ ...it, _i: i, _used: false }));
    const active = (it) => !it.cancelled;
    const out = [];
    for (const r of listRows) {
      let hit = items.find((it) => !it._used && active(it) && it.title === r.title) || items.find((it) => !it._used && it.title === r.title)
        || items.find((it) => !it._used && active(it)) || items.find((it) => !it._used);
      if (hit) hit._used = true;
      out.push({ row: r, item: hit || null, matchedBy: hit ? (hit.title === r.title ? 'title' : 'order') : null });
    }
    const leftover = items.filter((it) => !it._used);
    const activeCount = popup.items.filter(active).length;
    return { lines: out, leftoverItems: leftover, cancelledInOrder: leftover.filter((it) => it.cancelled),
      countMismatch: listRows.length !== activeCount, activeItemCount: activeCount };
  }

  /* ───────── 반품 목록 (반품관리) ───────── */
  // 반품은 claimId 단위. 알라딘 상품번호(ItemId)가 있어 등록 상품과 정확히 연결된다.
  function parseReturnList(doc) {
    const rows = [];
    doc.querySelectorAll('input.chkClaimId').forEach((chk) => {
      const tr1 = chk.closest('tr'); const tr2 = tr1.nextElementSibling;
      const c1 = [...tr1.children]; const c2 = tr2 ? [...tr2.children] : [];
      const who = tr1.querySelector('.btnDisplayAddressLayer');
      const link = tr1.querySelector('a[href*="ItemId="]');
      const info = tr1.querySelectorAll('.Rbook2_info li');
      const regSku = info[1] ? txt(info[1]).match(/^(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})\s*,\s*(.*)$/) : null;
      const t = splitTitle(link ? txt(link) : '');
      const g = (k) => (who ? who.getAttribute(k) : null);
      rows.push({
        claimId: chk.value, halfReturn: chk.getAttribute('data-halfreturn'),
        orderNo: txt(tr1.querySelector('.btnOrderNoPopupOpen')),
        buyerName: who && who.firstChild ? nullIfEmpty(who.firstChild.textContent.trim()) : null,
        buyerEmailMasked: who ? nullIfEmpty(txt(who.querySelector('.ordererEmail'))) : null,
        recipient: who ? { name: nullIfEmpty(g('data-receivername')), phone1: normPhone(g('data-receivephone1')), phone2: normPhone(g('data-receivephone2')),
          ...splitAddress(g('data-receiveaddress')), shippingRequest: nullIfEmpty(g('data-deliverymsg')) } : null,
        itemId: link ? (link.getAttribute('href').match(/ItemId=(\d+)/) || [])[1] : null,
        condition: t.condition, title: t.title,
        registeredAt: regSku ? parseDate(regSku[1]) : null, sku: regSku ? nullIfEmpty(regSku[2].trim()) : null,
        price: toInt(txt(c1[5])), reason: nullIfEmpty(txt(c1[6])), status: nullIfEmpty(txt(c1[7])),
        returnInvoice: nullIfEmpty(txt(c1[9])),
        requestedAt: parseDate(txt(c1[10])), approvedAt: parseDate(txt(c1[11])), holdAt: parseDate(txt(c1[12])), completedAt: parseDate(txt(c1[13])),
        qty: toInt(txt(c2[1])), cancelledAt: parseDate(txt(c2[2])), holdReleasedAt: parseDate(txt(c2[3])),
      });
    });
    return rows;
  }

  /* ───────── 묻고 답하기 목록 ───────── */
  function parseQnaList(doc) {
    const rows = [];
    doc.querySelectorAll('a[href*="wUsedShopC2CAnswer.aspx?questionid="]:not([href*="method=edit"])').forEach((a) => {
      const tr = a.closest('tr'); const tds = [...tr.children].filter((td) => td.getAttribute('width') !== '1');
      rows.push({
        questionId: (a.getAttribute('href').match(/questionid=(\d+)/) || [])[1],
        no: toInt(txt(tds[0])), question: a.textContent.trim(),
        authorMasked: nullIfEmpty(txt(tds[2])), createdDate: parseDate(txt(tds[3])), answered: nullIfEmpty(txt(tds[4])),
      });
    });
    return rows;
  }

  /* ───────── 묻고 답하기 상세 (wUsedShopC2CAnswer.aspx?questionid=) ─────────
   * 목록에는 작성자가 가려져 있지만 상세에는 알라딘 고객번호·상품번호·관련 주문번호·답변이 있다. */
  function parseQnaDetail(doc, url) {
    const block = doc.querySelector('.btnAccountBlock[data-custkey]');
    const item = doc.querySelector('#lnkQuestionItem2') || doc.querySelector('a[href*="ItemId="]');
    const t = splitTitle(item ? txt(item) : '');
    const html = (el) => (el ? el.innerHTML.replace(/\s*<br\s*\/?>\s*/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      .split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim() : null);
    let orderNo = null;
    doc.querySelectorAll('td.t1').forEach((td) => { if (txt(td) === '관련 주문번호') { const v = valueCellAfter(td); const m = txt(v).match(/\d{3}-[A-Z]\d{9}/); if (m) orderNo = m[0]; } });
    return {
      questionId: (url || '').match(/questionid=(\d+)/) ? url.match(/questionid=(\d+)/)[1] : (block ? block.getAttribute('data-sp') : null),
      customerKey: block ? block.getAttribute('data-custkey') : null,
      authorMasked: nullIfEmpty(txt(doc.querySelector('#labQuestionCustomerName'))),
      authorEmail: nullIfEmpty(txt(doc.querySelector('#labQuestionEmail'))),
      createdDate: parseDate(txt(doc.querySelector('#labQuestionAddDate')).replace(/\./g, '-')),
      orderNo,
      itemId: item ? (item.getAttribute('href').match(/ItemId=(\d+)/) || [])[1] || null : null,
      condition: t.condition, title: t.title || null,
      question: nullIfEmpty(html(doc.querySelector('#divQuestion'))),
      answer: nullIfEmpty(html(doc.querySelector('#divAnswer'))),
    };
  }

  /* ───────── 차단한 구매자 (BlockList.aspx) ─────────
   * 현재 차단 0건이라 행 구조를 아직 모름: 고객번호가 있는 요소만 원문 보존으로 수집 */
  function parseBlockList(doc) {
    if (/차단한 구매자가 없습니다/.test(doc.body ? doc.body.textContent : '')) return [];
    return [...doc.querySelectorAll('[data-custkey]')].map((el) => {
      const tr = el.closest('tr');
      return { customerKey: el.getAttribute('data-custkey'), cells: tr ? [...tr.children].map(txt) : [txt(el)] };
    });
  }

  /* ───────── 구매평 목록 ───────── */
  function parseReviewList(doc) {
    const rows = [];
    doc.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children].filter((td) => td.getAttribute('width') !== '1').map(txt);
      const oi = cells.findIndex((c) => /^\d{3}-[A-Z]\d{9}$/.test(c));
      if (oi < 0 || tr.querySelector('tr')) return;
      const t = splitTitle(cells[oi + 1]);
      rows.push({ rating: cells[oi - 3] || null, comment: cells[oi - 2] === '-' ? null : cells[oi - 2] || null,
        authorMasked: cells[oi - 1] || null, orderNo: cells[oi], condition: t.condition, title: t.title, createdDate: parseDate(cells[oi + 2]) });
    });
    return rows;
  }

  const api = { VERSION, EMPTY, splitTitle, normPhone, phoneKey, parseDate, splitAddress, platformFromUrl,
    parseOrderPopup, parseOrderList, matchListToPopup, parseReturnList, parseQnaList, parseQnaDetail, parseBlockList, parseReviewList, isSamePerson, cancelReqAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowOrders = api;
})(typeof window !== 'undefined' ? window : globalThis);
