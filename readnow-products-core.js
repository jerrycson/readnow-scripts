/* readnow-products-core.js
 * 알라딘 상품 관련 페이지·파일 파서 (순수 함수: Document/배열 → 데이터)
 * 상품 수집기(Tampermonkey)·웹앱·PC 엔진에서 공통 사용. 저장·네트워크 코드는 넣지 않는다.
 * 빈 값은 null. 화면 표시 단계에서 "-"로 바꾼다.
 */
(function (root) {
  'use strict';
  const VERSION = '0.14.0';

  // ---------- 공용 ----------
  const txt = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const txtBr = (el) => (el ? el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const nz = (s) => (s == null || String(s).trim() === '' || String(s).toLowerCase() === 'nan' ? null : String(s).trim());
  const toInt = (s) => {
    if (s == null) return null;
    const m = String(s).replace(/[,원₩\s]/g, '').match(/-?\d+/);
    return m ? parseInt(m[0], 10) : null;
  };
  const toFloat = (s) => {
    if (s == null) return null;
    const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  const pad = (n) => String(n).padStart(2, '0');

  // 날짜: "2026-09-29 11:40" / "2025-09-29 오전 4:50:23" / "09-29 11:40"(연도 없음 → refYear) / Date / 엑셀 일련번호
  function parseDate(v, refYear) {
    if (v == null || v === '') return null;
    if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}T${pad(v.getHours())}:${pad(v.getMinutes())}`;
    if (typeof v === 'number' && v > 20000 && v < 80000) { // 엑셀 일련번호
      const d = new Date(Math.round((v - 25569) * 86400000));
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(오전|오후)?\s*(\d{1,2}):(\d{2})(?::\d{2})?)?/);
    if (m) {
      let h = m[5] != null ? parseInt(m[5], 10) : null;
      if (h != null && m[4] === '오후' && h < 12) h += 12;
      if (h != null && m[4] === '오전' && h === 12) h = 0;
      return `${m[1]}-${pad(m[2])}-${pad(m[3])}` + (h != null ? `T${pad(h)}:${m[6]}` : '');
    }
    m = s.match(/^(\d{2})\.(\d{2})\.(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) return `20${m[1]}-${m[2]}-${m[3]}` + (m[4] ? `T${pad(m[4])}:${m[5]}` : '');
    m = s.match(/^(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/); // 연도 없음(샵매니저 목록의 올해 등록분)
    if (m && refYear) return `${refYear}-${pad(m[1])}-${pad(m[2])}` + (m[3] ? `T${pad(m[3])}:${m[4]}` : '');
    return null;
  }

  // "[중고-상] 제목" → {condition, title}
  function splitTitle(raw) {
    raw = (raw || '').trim();
    const m = raw.match(/^\[중고(?:-([^\]]+))?\]\s*/);
    if (!m) return { condition: null, title: raw || null, raw: raw || null };
    return { condition: m[1] ? m[1].trim() : null, title: raw.slice(m[0].length).trim(), raw };
  }

  // ---------- 식별자 분류 (형식·검증·추측·근거) ----------
  function isbn10Valid(s) {
    if (!/^\d{9}[\dX]$/.test(s)) return false;
    let t = 0;
    for (let i = 0; i < 10; i++) t += (10 - i) * (s[i] === 'X' ? 10 : +s[i]);
    return t % 11 === 0;
  }
  function ean13Valid(s) {
    if (!/^\d{13}$/.test(s)) return false;
    let t = 0;
    for (let i = 0; i < 13; i++) t += +s[i] * (i % 2 ? 3 : 1);
    return t % 10 === 0;
  }
  function isbn10to13(s) {
    const b = '978' + s.slice(0, 9);
    let t = 0;
    for (let i = 0; i < 12; i++) t += +b[i] * (i % 2 ? 3 : 1);
    return b + ((10 - (t % 10)) % 10);
  }

  function gs1Country(v) {
    const p3 = +v.slice(0, 3);
    const T = [[0, 139, '미국·캐나다'], [300, 379, '프랑스'], [400, 440, '독일'], [450, 459, '일본'], [490, 499, '일본'], [500, 509, '영국'], [760, 769, '스위스'], [880, 880, '한국'], [690, 699, '중국'], [471, 471, '대만'], [489, 489, '홍콩']];
    const hit = T.find(([a, b]) => p3 >= a && p3 <= b);
    return hit ? hit[2] : null;
  }
  // kind: isbn13 | isbn10 | usedCode | aladinCode | aladinDvdCode | issn13 | ean13 | setBarcode | invalid | unknown
  function classifyCode(raw) {
    const r0 = nz(raw);
    if (!r0) return null;
    const v = r0.replace(/\s+/g, '').toUpperCase();
    const out = (kind, valid, guess, reason) => ({ raw: r0, value: v, kind, valid, guess, reason });
    if (/^97[89]\d{10}$/.test(v)) return ean13Valid(v)
      ? out('isbn13', true, '정상 ISBN13', '978/979 접두어, 검증숫자 일치')
      : out('isbn13', false, 'ISBN13 형태이나 검증숫자 불일치', '978/979 접두어이지만 마지막 자리 계산이 맞지 않음 → 입력 오류 가능');
    if (/^\d{9}[\dX]$/.test(v)) {
      if (isbn10Valid(v)) return out('isbn10', true, '정상 ISBN10', 'ISBN10 검증숫자 일치');
      if (/^[56]000\d{6}$/.test(v)) return out('aladinCode', null, '알라딘 내부 상품코드', 'ISBN10 검증 규칙에 맞지 않고 6000/5000으로 시작. 세트·구판 등 알라딘이 별도 등록한 상품에 붙음');
      return out('invalid', false, 'ISBN10 형태이나 검증숫자 불일치', '10자리이지만 ISBN10 계산이 맞지 않음 → 입력 오류, 또는 DVD 등 비도서에 붙은 내부코드(확인 필요)');
    }
    if (/^U\d{9}$/.test(v)) return out('usedCode', null, '중고 상품 고유코드', '샵매니저 상품 목록·주문 엑셀의 상품별 코드와 같은 형식(U+9자리)');
    if (/^K\d{9}$/.test(v)) return out('aladinCode', null, '알라딘 내부 상품코드', '979로 시작하는 ISBN은 10자리 ISBN이 없어 알라딘이 대체 코드를 부여. 판매완료 엑셀에서 짝 ISBN13의 94%가 979');
    if (/^D\d{9}$/.test(v)) return out('aladinDvdCode', null, 'DVD·블루레이 알라딘 코드', 'D+9자리. 확인된 상품이 모두 블루레이·DVD');
    if (/^F\d{9}$/.test(v)) return out('aladinForeignCode', null, '수입품(외서·수입 DVD 등) 알라딘 코드', 'F+9자리. 확인된 상품이 외국 도서·수입 DVD·일본 상품');
    if (/^C\d{9}$/.test(v)) return out('aladinMediaCode', null, '음반·DVD 알라딘 코드', 'C+9자리. 확인된 상품이 수입 음반·DVD');
    if (/^977\d{10}$/.test(v)) return out('issn13', ean13Valid(v), '잡지·정기간행물 바코드', '977은 ISSN 국제 바코드 접두어');
    if (/^880\d{10}$/.test(v)) return out('ean13', ean13Valid(v), '국내 일반상품 바코드(음반·DVD·완구 등)', '880은 한국 상품 바코드 접두어');
    if (/^S\d{12}$/.test(v)) return out('setBarcode', null, '세트 전용 바코드', 'S로 시작하는 13자리. 박스 세트 상품에서 확인');
    if (/^(8[0-3]\d)\d{10}$/.test(v)) return out('ean13', ean13Valid(v), '수입 상품 바코드 가능성', '800~839는 이탈리아 상품 바코드 대역. 근거 약함, 확인 필요');
    if (/^2\d{12}$/.test(v)) return out('ean13', ean13Valid(v), '매장 내부용 번호', '200~299는 매장 내부용으로 예약된 바코드 대역');
    if (/^\d{13}$/.test(v)) {
      const cc = gs1Country(v);
      return out('ean13', ean13Valid(v), cc ? `${cc} 상품 바코드` : '일반 상품 바코드', cc ? `13자리 EAN, 앞자리 ${v.slice(0, 3)}은 ${cc} 상품 대역` : '13자리 EAN. 접두어로 종류를 특정할 수 없음');
    }
    if (/^\][A-Z]\d+$/.test(v) || /^[A-Z]\d{7,8}$/.test(v)) return out('invalid', false, '입력 오류', "앞에 ']'가 붙었거나 자리수가 모자람");
    return out('unknown', null, '알 수 없는 형식', '알려진 규칙에 맞지 않음 → 확인 필요');
  }

  // 한 상품의 여러 코드를 모아 정리. ISBN10↔13 불일치도 표시
  function collectIds(list) {
    const ids = [];
    const seen = new Set();
    for (const r of list) {
      const c = classifyCode(r);
      if (!c || seen.has(c.value)) continue;
      seen.add(c.value); ids.push(c);
    }
    const i10 = ids.find((x) => x.kind === 'isbn10' && x.valid);
    const i13 = ids.find((x) => x.kind === 'isbn13' && x.valid && x.value.startsWith('978'));
    const warn = [];
    if (i10 && i13 && isbn10to13(i10.value) !== i13.value) warn.push('ISBN10과 ISBN13이 서로 다른 책을 가리킴 → 확인 필요');
    const pick = (k) => { const x = ids.find((y) => y.kind === k); return x ? x.value : null; };
    return {
      ids, warn,
      isbn13: pick('isbn13') || (i10 ? isbn10to13(i10.value) : null),
      isbn10: pick('isbn10'),
      usedCode: pick('usedCode'),
      aladinCode: pick('aladinCode') || pick('aladinDvdCode') || pick('aladinForeignCode') || pick('aladinMediaCode'),
      barcode: pick('issn13') || pick('ean13') || pick('setBarcode'),
    };
  }

  // ---------- 기준 키 ----------
  // 내부 번호(bookId)는 한 번 정해지면 바뀌지 않는다. 기준(scheme)은 "같은 책 판단"에만 쓰는 꼬리표.
  const KEY_SCHEMES = ['aladinItemId', 'isbn13', 'aladinCode', 'usedCode'];
  function lookupKeys(book) { // prd_ids 색인에 넣을 꼬리표들
    const out = [];
    if (book.aladinItemId) out.push('itemId_' + book.aladinItemId);
    for (const c of book.ids || []) out.push(c.kind + '_' + c.value);
    return [...new Set(out)];
  }
  function newBookId(book, scheme) {
    const s = scheme || 'aladinItemId';
    const v = s === 'aladinItemId' ? book.aladinItemId : book[s];
    if (v) return 'bk_' + String(v).replace(/[^\w-]/g, '');
    return 'bk_x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ---------- 등록 상품 엑셀(알라딘 제공 .xls = HTML 표) ----------
  const REG_HEAD = { '상품명': 'titleRaw', 'ISBN': 'c1', '자체관리코드': 'sku', '원상품ISBN': 'c2', '바코드': 'c3', '출판사': 'publisher', '품질등급': 'grade', '판매상태': 'status', '정가': 'priceList', '판매가': 'price', '잔여수량': 'qty', '상품등록일': 'registered' };
  function tableToRows(doc) {
    const tr = [...doc.querySelectorAll('table tr')];
    return tr.map((r) => [...r.querySelectorAll('th,td')].map((c) => txt(c)));
  }
  function parseRegExportRows(rows) {
    const head = rows[0].map((h) => String(h || '').trim());
    const idx = {}; head.forEach((h, i) => { if (REG_HEAD[h]) idx[REG_HEAD[h]] = i; });
    const miss = Object.values(REG_HEAD).filter((k) => idx[k] == null);
    const out = [];
    for (const r of rows.slice(1)) {
      const g = (k) => (idx[k] == null ? null : nz(r[idx[k]]));
      if (!g('c1') && !g('titleRaw')) continue;
      const t = splitTitle(g('titleRaw'));
      const ids = collectIds([g('c1'), g('c2'), g('c3')]);
      out.push({
        usedCode: ids.usedCode, title: t.title, titleRaw: t.raw, condition: t.condition,
        grade: g('grade'), sku: g('sku'), publisher: g('publisher'), status: g('status'),
        priceList: toInt(g('priceList')), price: toInt(g('price')), qty: toInt(g('qty')),
        registeredAt: parseDate(g('registered')), ...pickIds(ids),
      });
    }
    return { rows: out, missingColumns: miss };
  }
  function pickIds(ids) { return { ids: ids.ids, idWarn: ids.warn, isbn13: ids.isbn13, isbn10: ids.isbn10, aladinCode: ids.aladinCode, barcode: ids.barcode }; }

  // ---------- 판매완료 엑셀(주문 내역) → 상품 쪽 정보만 ----------
  // 고객 정보(이름·주소·전화)는 고객 수집기가 저장하므로 여기서는 읽지 않는다.
  const SOLD_HEAD = { '상태': 'status', '주문번호': 'orderNo', '자체상품관리코드': 'sku', '상품명': 'titleRaw', 'ISBN': 'c1', '원상품ISBN': 'c2', '원상품바코드': 'c3', '출판사': 'publisher', '수량': 'qty', '주문일': 'orderedAt', '입금일': 'paidAt', '판매가': 'price', '판매총액': 'total', '판매수수료': 'fee', '정상발송 마감일': 'dueAt', '발송일': 'shipped', '택배사': 'courier', '송장번호': 'invoice', '위탁승인번호': 'consign', '증빙서류': 'proof', '비고': 'note' };
  function parseSoldRows(rows) {
    const head = rows[0].map((h) => String(h == null ? '' : h).trim());
    const idx = {}; head.forEach((h, i) => { if (SOLD_HEAD[h]) idx[SOLD_HEAD[h]] = i; });
    const out = [];
    for (const r of rows.slice(1)) {
      const g = (k) => (idx[k] == null ? null : r[idx[k]]);
      const titleRaw = nz(g('titleRaw'));
      if (!titleRaw && !nz(g('c1'))) continue;
      const t = splitTitle(titleRaw);
      const ids = collectIds([g('c1'), g('c2'), g('c3')]);
      const orderNo = nz(g('orderNo'));
      const status = nz(g('status'));
      let channel = 'aladin', channelWhy = '주문번호가 알라딘 형식(001-A…)';
      if (orderNo && /^Y\d+/.test(orderNo)) { channel = 'yes24'; channelWhy = '주문번호가 Y로 시작(예스24 형식)'; }
      else if (!orderNo || !/^\d{3}-[A-Z]\d+/.test(orderNo)) { channel = 'other'; channelWhy = '알라딘 주문번호 형식이 아님(수기 기록 추정)'; }
      out.push({
        orderNo, status, channel, channelWhy, needsCheck: channel !== 'aladin' || (status && status !== '정상'),
        usedCode: ids.usedCode, title: t.title, titleRaw: t.raw, condition: t.condition, sku: nz(g('sku')), publisher: nz(g('publisher')),
        qty: toInt(g('qty')), price: toInt(g('price')), total: toInt(g('total')), fee: toInt(g('fee')),
        orderedAt: parseDate(g('orderedAt')), paidAt: parseDate(g('paidAt')), dueAt: parseDate(g('dueAt')),
        shipped: nz(g('shipped')), courier: nz(g('courier')), invoice: nz(g('invoice')), note: nz(g('note')), ...pickIds(ids),
      });
    }
    return { rows: out };
  }

  // ---------- 샵매니저 상품 조회/수정 목록 (wrecord_edit.aspx) ----------
  function parseScmList(doc, nowYear) {
    const y = nowYear || new Date().getFullYear();
    const rows = [];
    doc.querySelectorAll('input.batchChkBox').forEach((cb) => {
      const tr = cb.closest('tr'); if (!tr) return;
      const tds = [...tr.children];
      const listingId = cb.value;
      const codeCell = tds[1];
      const codeParts = txtBr(codeCell).replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
      const pop = tr.innerHTML.match(/openpop_c2ctoc2b\('([A-Z]\d{9})'\)/);
      const ids = collectIds([...codeParts, pop && pop[1]]);
      const t = splitTitle(txt(tr.querySelector('a.name2')));
      const q = (s) => tr.querySelector(s);
      const regCell = tds.find((td) => td.classList && td.classList.contains('name') && /\d{1,2}-\d{1,2}/.test(td.textContent));
      const regRaw = regCell ? txtBr(regCell) : null;
      const statusA = q(`a[onclick*="stockStatusChgLayerOpen(${listingId})"]`);
      rows.push({
        listingId, usedCode: ids.usedCode, title: t.title, titleRaw: t.raw, condition: t.condition,
        sku: nz(txt(q(`#supCodeChg_val_${listingId}`))), publisher: nz(txt(tds[7])),
        status: nz(txt(statusA)), grade: nz(txt(q('div.tdQa'))), qty: toInt(txt(q(`#stockChg_val_${listingId}`))),
        price: toInt(txt(q(`#priceSalesChg_val_${listingId}`))),
        registeredRaw: regRaw, registeredAt: parseDate(regRaw, y), registeredYearGuessed: !!(regRaw && !/^\d{4}-/.test(regRaw)),
        ...pickIds(ids),
      });
    });
    let lastPage = 1;
    doc.querySelectorAll('.pageNavCtl a[onclick*="Page_Set"]').forEach((a) => {
      const m = (a.getAttribute('onclick') || '').match(/Page_Set\('?(\d+)/); if (m) lastPage = Math.max(lastPage, +m[1]);
    });
    const cur = toInt(txt(doc.querySelector('.pageNavCtl .pagenum_on'))) || 1;
    const loggedIn = !!doc.querySelector('a[href*="wC2Cuser_logout"]');
    return { rows, page: cur, lastPage: Math.max(lastPage, cur), loggedIn };
  }

  // ---------- 새상품 페이지 (wproduct.aspx) ----------
  function parseProductPage(doc, url) {
    const canon = doc.querySelector('link[rel="canonical"]');
    const itemId = ((canon && canon.getAttribute('href')) || url || '').match(/ItemId=(\d+)/i);
    const meta = (p) => { const m = doc.querySelector(`meta[property="${p}"]`); return m ? nz(m.getAttribute('content')) : null; };
    const titleLi = doc.querySelector('.Ere_prod_titlewrap .tlist');
    // 기여자: "이름 (역할)" 반복
    const contributors = [];
    const sub2 = doc.querySelector('.Ere_prod_titlewrap li.Ere_sub2_title');
    if (sub2) {
      const nodes = [...sub2.childNodes];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.nodeType === 1 && n.tagName === 'A' && /AuthorSearch=/.test(n.getAttribute('href') || '')) {
          let role = null;
          const nx = nodes[i + 1];
          if (nx && nx.nodeType === 3) { const m = nx.textContent.match(/\(([^)]+)\)/); if (m) role = m[1].trim(); }
          const am = (n.getAttribute('href') || '').match(/@(\d+)/);
          contributors.push({ name: txt(n), role, aladinAuthorId: am ? am[1] : null });
        }
      }
    }
    const pubA = sub2 && sub2.querySelector('a[href*="PublisherSearch"]');
    const pubM = pubA && (pubA.getAttribute('href') || '').match(/@(\d+)/);
    const dateM = sub2 && txt(sub2).match(/(\d{4}-\d{2}-\d{2})/);
    const origA = sub2 && [...sub2.querySelectorAll('a')].find((a) => /원제\s*:/.test(txt(a)));
    // 기본정보: 쪽수·크기·무게·ISBN
    const basic = { pages: null, size: null, weightG: null, isbn13: null, extra: [] };
    doc.querySelectorAll('.conts_info_list1 li').forEach((li) => {
      const s = txt(li);
      let m;
      if ((m = s.match(/^(\d+)쪽$/))) basic.pages = +m[1];
      else if ((m = s.match(/^(\d+)g$/i))) basic.weightG = +m[1];
      else if (/^\d+\*\d+/.test(s)) basic.size = s;
      else if ((m = s.match(/ISBN\s*:\s*(\S+)/))) basic.isbn13 = m[1];
      else basic.extra.push(s);
    });
    const categories = [...doc.querySelectorAll('#ulCategory > li')].map((li) => {
      const a = [...li.querySelectorAll('a[href*="CID="], a[href*="wbookmain"], a[href*="main"]')].filter((x) => !/foreignCategoryFold/.test(x.className));
      return { path: a.map((x) => txt(x)).filter(Boolean), cids: a.map((x) => ((x.getAttribute('href') || '').match(/CID=(\d+)/) || [])[1]).filter(Boolean) };
    });
    // 가격
    let priceList = null, priceSales = null;
    doc.querySelectorAll('.Ere_prod_Binfowrap .info_list li').forEach((li) => {
      const l = txt(li.querySelector('.Litem, .Litem_P'));
      if (l === '정가' && priceList == null) priceList = toInt(txt(li.querySelector('del')) || txt(li.querySelector('.Ritem')));
      if (l === '판매가' && priceSales == null) priceSales = toInt(txt(li.querySelector('em[itemprop="price"]')) || txt(li.querySelector('.Ritem')));
    });
    // 순위·Sales Point
    const rankBox = doc.querySelector('#wa_product_top1_wa_Top_Ranking_pnlRanking');
    const ranks = [];
    let salesPoint = null;
    if (rankBox) {
      const first = rankBox.querySelector('.Ere_fs15.Ere_ht18');
      if (first) {
        const clone = first.cloneNode(true);
        const spBox = [...clone.querySelectorAll('div')].find((d) => /Sales Point/.test(d.textContent));
        if (spBox) { salesPoint = toInt(txt(spBox.querySelector('strong'))); spBox.remove(); }
        const s = txt(clone).replace(/\|/g, ' ').trim();
        s.split(',').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean).forEach((x) => ranks.push(x));
      }
    }
    const reviewBox = rankBox && rankBox.querySelector('.info_list.Ere_fs15');
    const rtxt = reviewBox ? txt(reviewBox) : '';
    const rating = toFloat(txt(doc.querySelector('a.Ere_sub_pink.Ere_fs16'))) || toFloat(meta('books:rating:value'));
    const comment = rtxt.match(/100자평\((\d+)\)/); const review = rtxt.match(/리뷰\((\d+)\)/);
    // 이미지
    const img = (sel) => { const e = doc.querySelector(sel); return e ? nz(e.getAttribute('src')) : null; };
    const front = img('#CoverMainImage') || meta('og:image');
    const back = img('.c_back img');
    const spine = img('.c_left img');
    const preview = [...doc.querySelectorAll('#swiper-container-cover img')].map((e) => e.getAttribute('src')).filter((s) => /letslook\/.*_t\d+/.test(s || ''));
    // 판매 상태(절판·품절)
    const soldout = txt(doc.querySelector('.Ere_soldout_info'));
    const soldoutDate = (txt(doc.querySelector('#topbtn_soldout_layer')).match(/확인일\s*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
    const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }).find((j) => j && j['@type'] === 'Book');
    const isbnHidden = doc.querySelector('input.hd_ISBN');
    return {
      aladinItemId: itemId ? itemId[1] : null,
      title: nz(txt(titleLi && titleLi.querySelector('.Ere_bo_title'))),
      subtitle: nz(txt(titleLi && titleLi.querySelector('.Ere_sub1_title')).replace(/^-\s*/, '')),
      series: nz(txt(titleLi && titleLi.querySelector('a[href*="wseriesitem"]'))),
      contributors, publisher: nz(txt(pubA)), aladinPublisherId: pubM ? pubM[1] : null,
      pubDate: dateM ? dateM[1] : (ld && ld.workExample && ld.workExample[0] && ld.workExample[0].datePublished) || null,
      originalTitle: origA ? txt(origA).replace(/^원제\s*:\s*/, '') : null,
      isbn13: basic.isbn13 || meta('books:isbn'), isbnKey: isbnHidden ? isbnHidden.value : null,
      pages: basic.pages, size: basic.size, weightG: basic.weightG, basicExtra: basic.extra,
      categories, priceList, priceSales,
      salesPoint, ranks, rating, commentCount: comment ? +comment[1] : null, reviewCount: review ? +review[1] : null,
      images: { front, back, spine, preview },
      availability: soldout ? (soldout.match(/^(절판|품절|일시품절)/) || [null, soldout])[1] : 'onSale', availabilityNote: nz(soldout), soldoutCheckedAt: soldoutDate,
      ldAvailability: ld && ld.offers ? ld.offers.availability : null,
      fetchedFrom: 'aladin',
    };
  }

  // ---------- 온라인 중고 페이지 (wuseditemall.aspx) ----------
  function parseUsedPage(doc) {
    const tabs = {};
    doc.querySelectorAll('.Ere_usedsell_list2 a').forEach((a) => {
      const m = txt(a).match(/^(.+?)\s*\((\d+)\)$/); if (m) tabs[m[1].trim()] = +m[2];
    });
    const mins = {};
    doc.querySelectorAll('.Ere_prod_Binfowrap_used2 .info_list li').forEach((li) => {
      const l = txt(li.querySelector('.Litem')); const r = txt(li.querySelector('.Ritem'));
      const m = l.match(/^(.+?)\((\d+)\)$/);
      if (m) mins[m[1].trim()] = { count: +m[2], min: /\d/.test(r) ? toInt(r) : null };
    });
    const buyback = {};
    const bt = doc.querySelector('.Ere_usednum_box table');
    if (bt) {
      const tr = bt.querySelectorAll('tr');
      if (tr.length >= 2) {
        const h = [...tr[0].children].map((c) => txt(c)); const v = [...tr[1].children].map((c) => toInt(txt(c)));
        h.forEach((k, i) => { if (k) buyback[k] = v[i]; });
      }
    }
    const listings = [];
    doc.querySelectorAll('.Ere_usedsell_table tr').forEach((tr) => {
      const a = tr.querySelector('.sell_tableCF2 a[href*="ItemId="]'); if (!a) return;
      const seller = tr.querySelector('.seller a[href*="SC="]');
      const store = tr.querySelector('.Ere_used_store');
      const priceUl = tr.querySelector('.price');
      const pt = txt(priceUl);
      listings.push({
        listingId: ((a.getAttribute('href') || '').match(/ItemId=(\d+)/) || [])[1] || null,
        usedCode: ((tr.querySelector('input[name^="chkCart."]') || {}).name || '').replace('chkCart.', '') || null,
        grade: nz(txt(tr.querySelector('.Ere_sub_top > span'))),
        price: toInt(txt(tr.querySelector('.price .Ere_fs20'))),
        ship: toInt((pt.match(/배송비\s*:\s*([\d,]+)/) || [])[1]), halfShip: toInt((pt.match(/반값택배\s*:\s*([\d,]+)/) || [])[1]),
        sellerCode: seller ? ((seller.getAttribute('href') || '').match(/SC=(\d+)/) || [])[1] : null,
        sellerName: seller ? txt(seller) : (store ? txt(store) : null),
        sellerBadge: nz(txt(tr.querySelector('[class^="Ere_used_"]:not(.Ere_used_store)'))),
        soldOut: /판매중지/.test(tr.textContent),
      });
    });
    const pages = [...doc.querySelectorAll('.Ere_usedsell_num_box a')].map((a) => toInt(txt(a))).filter((n) => n);
    return {
      usedTotal: tabs['전체 중고'] != null ? tabs['전체 중고'] : null, tabs, mins, buyback,
      listings, lastPage: pages.length ? Math.max(...pages) : 1,
    };
  }

  // ---------- 지연 로딩 부분 (getContents.aspx 추정) ----------
  function parseBuyerDist(docOrHtml) {
    const d = docOrHtml;
    const rows = [...d.querySelectorAll('.analysis_box tr')];
    const female = {}, male = {};
    for (const tr of rows) {
      const age = txt(tr.querySelector('.tb_tit')); if (!/대/.test(age)) continue;
      const k = age.replace(/\s+/g, '');
      female[k] = toFloat(txt(tr.querySelector('.tb_woman .per')));
      male[k] = toFloat(txt(tr.querySelector('.tb_man .per')));
    }
    return Object.keys(female).length ? { female, male } : null;
  }
  function parseRelationBuy(d) {
    const out = []; const seen = new Set();
    d.querySelectorAll('a[href*="utm_campaign=relbuy"]').forEach((a) => {
      const t = txt(a); const id = ((a.getAttribute('href') || '').match(/ItemId=(\d+)/) || [])[1] || null;
      if (!t || seen.has(id || t)) return; seen.add(id || t); out.push({ title: t, aladinItemId: id });
    });
    return out;
  }

  // 알라딘 검색 결과: 상품마다 상자(.ss_book_box) — 번호(itemid), 제목(a.bo3), 사진, 링크
  function parseSearchResults(d) {
    return [...d.querySelectorAll('.ss_book_box')].map((b) => { const a = b.querySelector('a.bo3'); const img = b.querySelector('img.front_cover') || b.querySelector('img');
      const id = b.getAttribute('itemid') || (((a && a.getAttribute('href')) || '').match(/ItemId=(\d+)/) || [])[1] || null; const src = img ? img.getAttribute('src') || '' : '';
      const ck = b.querySelector('input[name^="chkCart."]'); return { itemId: id, title: a ? txt(a) : '', href: a ? a.getAttribute('href') : null, img: /^\/\//.test(src) ? 'https:' + src : src, used: /\[중고\]/.test(b.textContent || ''), channels: searchChannels(b), cart: ck ? ck.getAttribute('name').replace('chkCart.', '') : null, ours: /scm996008/.test(src) }; }).filter((x) => x.itemId && x.title); // (0.14.0) cart = 장바구니 상품코드 · ours = 사진 주소가 우리 판매자(scm996008…)
  }
  // 검색 결과 상품 칸 아래 작은 표(table.usedtable02): 머리 줄 = 알라딘 중고 / ○○점(알라딘 매장) / 판매자 중고 (개수), 아래 줄 = 각 최저가 ('-' = 없음)
  function searchChannels(box) {
    const t = box.querySelector('table.usedtable02'); if (!t) return null; const rows = [...t.querySelectorAll('tr')]; if (rows.length < 2) return null;
    const hd = [...rows[0].children], vl = [...rows[1].children]; const out = {};
    hd.forEach((th, i) => { const name = txt(th).replace(/\(\d+\)/, '').trim(); const cnt = (txt(th).match(/\((\d+)\)/) || [])[1]; const v = vl[i] ? toInt((txt(vl[i]).match(/[\d,]+\s*원/) || [])[0]) : null;
      const key = /판매자/.test(name) ? 'seller' : /알라딘 중고/.test(name) ? 'aladin' : 'store'; out[key] = { name, min: v, count: cnt != null ? +cnt : v != null ? null : 0 }; });
    return out;
  }
  // ── 새상품 페이지가 없는 상품의 시세 (0.7.0) ──
  // 재료: 같은 책을 상품명으로 검색한 결과 중 이름 일치 90% 이상인 상품들의 채널별 최저가 (우리 상품 자신은 뺌, 우리 가게 다른 상품은 '우리'로 표시)
  // 방법: ① 비교 가격 = 상품마다 판매자 중고 최저가 + 알라딘 중고·매장 최저가(있으면) ② 튀는 값 제거: 중앙값의 3배 초과·1/3 미만 빼기
  //       ③ 시세 = 남은 값의 중앙값, 범위 = 25~75% 구간, 유효 최저 = 남은 값 중 가장 낮은 값 ④ 신뢰도 = 가격 수와 흩어짐(변동계수)
  function marketNoBook(cands, opts) {
    const o = opts || {}; const th = o.match ?? 0.9; const ours = String(o.ourSeller || '996008');
    const pts = [];
    (cands || []).forEach((c) => { if ((c.cov ?? 1) < th || (o.selfItemId && String(c.itemId) === String(o.selfItemId))) return; const ch = c.channels || {}; const mine = c.ours || new RegExp('scm' + ours).test(c.img || '');
      if (ch.seller && ch.seller.min) pts.push({ v: ch.seller.min, ch: 'seller', itemId: c.itemId, title: c.title, ours: mine, count: ch.seller.count });
      if (ch.aladin && ch.aladin.min) pts.push({ v: ch.aladin.min, ch: 'aladin', itemId: c.itemId, title: c.title, ours: false });
      if (ch.store && ch.store.min) pts.push({ v: ch.store.min, ch: 'store', itemId: c.itemId, title: c.title, ours: false }); });
    const others = pts.filter((x) => !x.ours); const vals = others.map((x) => x.v).sort((a, b) => a - b);
    const q = (arr, p) => { if (!arr.length) return null; const i = (arr.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return Math.round(arr[lo] + (arr[hi] - arr[lo]) * (i - lo)); };
    const med0 = q(vals, 0.5); // 튀는 값: 중앙값의 3배 넘거나 1/3 밑 (앞서 정한 '터무니없는 가격'과 같은 기준). 가격 수가 적을 때도 정상 값을 잘못 빼지 않음
    const keep = vals.filter((v) => med0 == null || (v <= med0 * 3 && v >= med0 / 3)); const out = vals.filter((v) => !keep.includes(v));
    const med = q(keep, 0.5), p25 = q(keep, 0.25), p75 = q(keep, 0.75); const mean = keep.length ? keep.reduce((a, b) => a + b, 0) / keep.length : null;
    const sd = keep.length > 1 ? Math.sqrt(keep.reduce((a, b) => a + (b - mean) ** 2, 0) / (keep.length - 1)) : null; const cv = sd && mean ? sd / mean : null;
    const conf = !keep.length ? '없음' : keep.length === 1 ? '낮음' : keep.length >= 4 && cv != null && cv < 0.35 ? '높음' : '보통';
    const our = o.ourPrice != null ? +o.ourPrice : null; const pos = our != null && keep.length ? keep.filter((v) => v < our).length / keep.length : null;
    return { n: keep.length, nAll: vals.length, outliers: out, median: med, p25, p75, low: keep.length ? keep[0] : null, high: keep.length ? keep[keep.length - 1] : null, cv, conf, ourPrice: our, ourVsMedian: our != null && med ? our / med - 1 : null, cheaperShare: pos, points: pts };
  }
  // 검색어가 상품 이름에 얼마나 들어 있나 (0~1): 띄어쓰기·문장부호를 빼고, 검색어 글자가 순서대로 몇 개 들어 있는지(최장 공통 부분수열) ÷ 검색어 길이
  /* (0.14.0) 세트 상품 알아보기 — 기계 학습·관찰 도구·가격 판단에서 상품을 가르는 중요한 기준 (정범 2026-10-08)
   *  강함(strong, 거의 늘 세트): [세트]·(세트)·【세트】 · 끝 쪽 '1~10'·'1-10'·'Ⅰ~Ⅴ'(권·편·부·집 붙어도) · 전10권 · 총 10권 · 10권 세트·일괄·묶음 · 상·하권 · (1+2)
   *  약함(weak, 확인 필요): 괄호 없이 '세트'·'전집'·'박스'·'+색인' — 제목에 우연히 들어간 경우가 있음
   *  연도 범위(1985-1990)·학년(2-3학년)·쪽수는 세트로 보지 않음. 세트라고 꼭 ISBN·새상품이 없는 것은 아님 */
  function setInfo(title) { const t0 = String(title || '').replace(/^\[중고[^\]]*\]\s*/, ''); const t = t0.split(/\s\/\s?|\/\s/)[0]; const L = t.length; const why = [];
    if (/[\[\(（【]\s*(세트|SET|Set|set|박스\s*세트|전집)\s*[\]\)）】]/.test(t0)) why.push('[세트] 표시');
    if (/전\s*\d{1,3}\s*(권|책|巻|부)/.test(t0)) why.push('전 n권');
    if (/총\s*\d{1,3}\s*(권|책)/.test(t0)) why.push('총 n권');
    if (/\d{1,3}\s*권\s*(세트|일괄|묶음|합본)/.test(t0)) why.push('n권 세트');
    if (/(상\s*[·.,/+~\-]\s*하|상하)\s*권|\(\s*상\s*[,·/]\s*하\s*\)|상\s*·\s*중\s*·\s*하/.test(t0)) why.push('상·하권');
    if (/\(\s*\d{1,3}\s*\+\s*\d{1,3}\s*(권)?\s*\)/.test(t0)) why.push('(1+2)');
    { const re = /(^|[\s(\[,])(\d{1,3})\s*[~∼〜\-–]\s*(\d{1,3})\s*(권|편|부|집|화|호)?(?=\s*[)\]]|\s|$|\+|,)/g; let m; while ((m = re.exec(t))) { const a = +m[2], b = +m[3]; const rest = t.slice(m.index + m[0].length); if (a < b && b - a <= 300 && m.index + m[1].length >= L * 0.2 && !/^\s*(학년|세(?!트)|살|쪽|p\b|페이지|년|월|일|시|분|명|인|개월)/.test(rest)) { why.push(`${a}~${b}`); break; } } }
    if (/(^|[\s(\[])([IⅠ]{1,3}|Ⅰ)\s*[~∼\-–]\s*([IVXⅠ-Ⅻ]{1,4})(?=\s*[)\]]|\s|$|\+)/.test(t)) why.push('Ⅰ~Ⅴ');
    if (why.length) return { set: true, level: 'strong', why };
    const weak = []; if (/세트(?!장|포인트|업|팅)/.test(t0)) weak.push("'세트' 단어"); if (/전집(?!\s*(제\s*)?\d)/.test(t0)) weak.push('전집'); /* '한국민화전집 6' = 전집의 한 권 */ if (/박스\s*(세트|판)|BOX\s*SET/i.test(t0)) weak.push('박스'); if (/\+\s*(색인|별권|부록\s*\d)/.test(t0)) weak.push('+색인·별권');
    return weak.length ? { set: true, level: 'weak', why: weak } : { set: false, level: null, why: [] }; }
  // (0.14.0) 알라딘 미등록 상품: 알라딘 상품(새책 카탈로그)에 붙이지 않고 정보를 직접 써서 등록한 것 — 샵매니저 목록의 번호 칸이 ISBN이 아니라 상품코드(U…)
  //  다른 판매자는 그 상세에 붙을 수 없고, 같은 책을 각자 따로 등록하므로 '전체 중고' 목록이 아니라 검색(SearchTarget=Used)으로 경쟁 상품을 찾음
  //  판단 근거가 있을 때만: 샵매니저에서 읽은 번호(ids)가 상품코드(usedCode)뿐이고 ISBN·알라딘 상품코드가 없을 때. 번호 기록이 없으면 '모름'(false) — 근거 없이 미등록으로 보지 않음
  const isUnregistered = (l) => { if (!l || l.isbn13 || l.isbn10 || l.aladinCode) return false; const ids = Array.isArray(l.ids) ? l.ids.filter(Boolean) : []; return ids.length > 0 && ids.some((x) => x.kind === 'usedCode') && !ids.some((x) => ['isbn13', 'isbn10', 'aladinCode', 'barcode'].includes(x.kind)); };
  // (0.14.0) 검색어: [중고]·앞 [..] 떼고, '/' 뒤(저자·출판사) 떼고, 끝 (..) 떼기 — 정범이 확인한 방법('포스트모더니즘 : 이합 핫산의 문화 및 문학 이론')
  function searchQueryOf(title) { let t = String(title || '').replace(/^\[중고[^\]]*\]\s*/, '').replace(/^(\s*\[[^\]]*\]\s*)+/, ''); t = t.split(/\s*\/\s*/)[0]; for (let i = 0; i < 3; i++) t = t.replace(/\s*[\(（][^()（）]*[\)）]\s*$/, ''); return t.replace(/\s+/g, ' ').trim(); }
  // (0.14.0) 권 번호가 같은지: '한국사론 1'과 '한국사론 10'은 이름 일치가 높아도 다른 책 — 연도(1800~2099)는 빼고, 제목 본문(앞 [..]·'/' 뒤·끝 (..) 뺀 것)의 숫자들이 같아야 같은 상품
  function sameVolume(a, b) { const nums = (x) => (searchQueryOf(x).match(/\d+/g) || []).map(Number).filter((n) => !(n >= 1800 && n <= 2099)).sort((p, q) => p - q).join(','); return nums(a) === nums(b); }
  function nameCoverage(query, title) { const n = (x) => String(x || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); const q = n(query), t = n(title); if (!q.length) return 0;
    const dp = new Array(t.length + 1).fill(0); for (let i = 1; i <= q.length; i++) { let prev = 0; for (let j = 1; j <= t.length; j++) { const tmp = dp[j]; dp[j] = q[i - 1] === t[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]); prev = tmp; } } return dp[t.length] / q.length; }
  // 우리(판매자) 중고 상품 페이지의 상품 사진: 위쪽 표지 영역(#CoverMainImage·표지 넘김 사진) + '중고상품 구매 유의 사항'(#usedDecription) 안 사진
  // 같은 사진이 크기만 다르게 여러 번 나오므로 파일 이름으로 하나만 남김. 표지 영역 작은 크기(coversum 등)는 cover500으로 바꿔 둔 주소도 함께 줌
  function parseUsedItemPhotos(d) {
    const out = []; const seen = new Set(); const base = (u) => String(u || '').split('?')[0].split('/').pop().replace(/\(\d+\)(?=\.)/, '');
    const add = (img, where) => { const src = img && (img.getAttribute('src') || img.getAttribute('data-src') || ''); if (!src || /icon|btn|blank|noimg|spacer/i.test(src)) return; const k = base(src); if (!k || seen.has(k)) return; seen.add(k);
      const abs = /^\/\//.test(src) ? 'https:' + src : src; const big = abs.replace(/\/(coversum|cover150|cover200|cover|cover300)\//, '/cover500/'); out.push({ src: abs, big: big !== abs ? big : null, where, file: k }); };
    const main = d.getElementById('CoverMainImage'); if (main) add(main, 'top');
    d.querySelectorAll('#swiper-container-cover img.imgbox, #swiper-container-cover .swiper-slide img').forEach((im) => add(im, 'top'));
    d.querySelectorAll('#usedDecription img').forEach((im) => add(im, 'desc'));
    return out;
  }
  // 다른 판매자 중고 매물 페이지(wproduct.aspx?ItemId=매물번호): '중고상품 구매 유의 사항' 글 전체 + 사진(위쪽 표지 영역·유의 사항 안)
  // newCoverFile(새상품 표지 파일 이름)을 주면 '새상품 사진과 다른 사진이 있는가'를 계산 — 위쪽 영역에 새상품 표지가 아닌 사진이 있거나 유의 사항 안에 사진이 있으면 다름
  // ---------- (0.13.0) 중고 상품 페이지(wproduct.aspx?ItemId=중고 상품번호) 판매가 — 실제 화면(2026-10-08 저장본)에서 확인한 자리 ----------
  //  판매가 = 'schema.org/Offer' 칸의 큰 글자(.Ere_fs24) (그 아래 카드 할인가 .Ere_fs24 와 헷갈리지 않게 Offer 칸 안에서만) · 없으면 <meta property="og:price">
  //  판매자 = '판매자' 줄의 wshopitem.aspx?SC= 링크
  function parseUsedItemPrice(d) {
    const off = d.querySelector('[itemtype="https://schema.org/Offer"] .Ere_fs24'); const og = d.querySelector('meta[property="og:price"]');
    const price = off ? toInt(txt(off)) : og ? toInt(og.getAttribute('content')) : null;
    let sellerCode = null, sellerName = null; for (const li of d.querySelectorAll('.info_list li')) { if (txt(li.querySelector('.Litem')) !== '판매자') continue; const a = li.querySelector('a[href*="SC="]'); if (a) { sellerCode = ((a.getAttribute('href') || '').match(/SC=(\d+)/) || [])[1] || null; sellerName = txt(a) || null; } break; }
    return { price, ogPrice: og ? toInt(og.getAttribute('content')) : null, sellerCode, sellerName };
  }
  // ---------- (0.13.0) 알라딘에 중고 팔기: 매입가 조회 화면(wc2b_search.aspx) · 팔기 장바구니(wc2b_sales.aspx) — 실제 화면 저장본에서 확인한 자리 ----------
  //  조회 결과 #searchResult 의 줄마다: 체크칸 input.chk[isbn] · 제목 a.c2b_b · 'ISBN13, ISBN10 (ISBN)' 글 · '팔기 장바구니에 추가' 단추 .c2b_add[isbn] (없으면 지금 매입 불가)
  //  매입가 표: 머리 칸 .c2b_tablet2 (정가 · 매입가 최상 · 상 · 중) ↔ 값 칸 .c2b_tablet3
  function parseC2BSearch(d) { const out = [];
    for (const chk of d.querySelectorAll('#searchResult input.chk[isbn]')) { const tr = chk.closest('tr'); if (!tr) continue; const t = txt(tr);
      const isbn13 = (t.match(/(97[89]\d{10})/) || [])[1] || null; const title = txt(tr.querySelector('a.c2b_b')) || null; const add = tr.querySelector('.c2b_add');
      const heads = [...tr.querySelectorAll('.c2b_tablet2')].map((x) => txt(x).replace(/\s+/g, '')); const vals = [...tr.querySelectorAll('.c2b_tablet3')].map((x) => toInt(txt(x)));
      const price = {}; heads.forEach((h, i) => { const k = h === '정가' ? 'list' : h.replace(/^매입가/, '') || h; price[k] = vals[i] ?? null; });
      out.push({ isbn10: chk.getAttribute('isbn') || null, isbn13, title, canSell: !!add, price, note: add ? null : (t.match(/(매입\s*불가[^.]*|판매\s*불가[^.]*|매입하지 않[^.]*)/) || [])[1] || '팔기 장바구니에 추가 단추 없음' }); }
    return out; }
  function parseC2BCart(d) { return [...d.querySelectorAll('tr.item[pkid]')].map((tr) => { const t = txt(tr.querySelector('.c2b_td_int')); return { pkid: tr.getAttribute('pkid'), itemId: tr.getAttribute('itemid') || null, isbn13: (t.match(/ISBN13\s*:\s*(97[89]\d{10})/) || [])[1] || null, isbn10: (t.match(/ISBN10\s*:\s*([0-9A-Z]{10})/) || [])[1] || null, title: txt(tr.querySelector('.c2b_bbb strong')) || null, priceStd: toInt(txt(tr.querySelector('.pricestd'))), grade: /균일가/.test(txt(tr.querySelector('.c2b_td_u'))) ? '균일가' : null, gradeOpts: [...tr.querySelectorAll('.c2b_td_u li')].map((li) => txt(li)).filter(Boolean), c2bPrice: toInt(txt(tr.querySelector('.c2bprice'))) }; }); }
  function parseUsedItemInfo(d, newCoverFile) {
    const box = d.getElementById ? d.getElementById('usedDecription') : null;
    const note = box ? txtBr(box) : '';
    const photos = parseUsedItemPhotos(d);
    const baseOf = (f) => String(f || '').split('?')[0].split('/').pop().replace(/\(\d+\)(?=\.)/, '');
    const nc = newCoverFile ? baseOf(newCoverFile) : null;
    const sellerPhotos = photos.filter((p) => p.where === 'desc' || (nc && p.where === 'top' && p.file !== nc));
    return { note, hasNote: !!(note && note.replace(/\s/g, '').length), photos, sellerPhotoCount: sellerPhotos.length, photoDiff: sellerPhotos.length > 0, coverKnown: !!nc, found: !!(box || photos.length) };
  }
  // '지금 이 상품을 클릭한 분들이 다음 상품도 클릭' (알라딘 지니 추천, 늘 나오지는 않음)
  function parseClickRelation(d) {
    let box = d.getElementById ? (d.getElementById('w_jiny_recentContent') || d.getElementById('w_jiny_recentRecomList') || d.getElementById('swiper_nowClick')) : null;
    if (!box) { const h = [...d.querySelectorAll('div,p,span,h3,h4')].find((e) => /지금 이 상품을 클릭한/.test(e.textContent || '') && (e.textContent || '').length < 200); box = h ? h.closest('div[id]') || h.parentElement : null; } if (!box) return [];
    const out = []; const seen = new Set();
    box.querySelectorAll('a[href*="wproduct.aspx?ItemId="]').forEach((a) => { const id = ((a.getAttribute('href') || '').match(/ItemId=(\d+)/) || [])[1]; if (!id || seen.has(id)) return;
      const img = a.querySelector('img'); const t = txt(a) || (img && (img.getAttribute('alt') || '').trim()) || ''; if (!t) { seen.add(id); out.push({ title: null, aladinItemId: id }); return; } seen.add(id); out.push({ title: t, aladinItemId: id }); });
    // 제목이 비어 있으면 같은 번호의 다른 링크에서 찾음
    out.forEach((x) => { if (x.title) return; const a = [...box.querySelectorAll(`a[href*="ItemId=${x.aladinItemId}"]`)].map((y) => txt(y) || ((y.querySelector('img') || {}).alt || '')).find(Boolean); x.title = a || null; });
    return out;
  }
  // 알라딘에 중고팔기 내역 (내 계정): 목록 → 접수번호들, 상세 → 신청 정보 + 권별 매입 결과
  function parseC2BList(d) { const ids = new Set(); d.querySelectorAll('a[href*="c2bsalesno="]').forEach((a) => { const m = (a.getAttribute('href') || '').match(/c2bsalesno=(\d+)/i); if (m) ids.add(m[1]); });
    const pages = [...(d.documentElement ? d.documentElement.innerHTML : '').matchAll(/Page_Set\('(\d+)'\)/g)].map((m) => +m[1]); return { orders: [...ids], lastPage: pages.length ? Math.max(...pages) : 1 }; }
  function parseC2BDetail(d) {
    const head = {}; d.querySelectorAll('th').forEach((th) => { const k = txt(th); const td = th.nextElementSibling; if (k && td && td.tagName === 'TD' && k.length < 20 && !(k in head)) head[k] = txt(td); });
    const items = [];
    d.querySelectorAll('tr').forEach((tr) => { const c = [...tr.children].map(txt); if (c.length < 5 || !/^\d+$/.test(c[0])) return; const idc = c.find((x) => /^(97[89]\d{10})/.test(x.replace(/\s/g, '')) || /^K\d+/.test(x)) || ''; const ids = idc.replace(/\s/g, ''); if (!ids) return;
      const i13 = (ids.match(/^(97[89]\d{10})/) || [])[1] || null; const i10 = i13 ? (ids.slice(13).match(/^[\dX]{10}/) || [])[0] || null : null;
      const buy = c[c.length - 1] || ''; const req = c[c.length - 2] || ''; const num = (t) => { const m = String(t).match(/([\d,]+)\s*원/); return m ? +m[1].replace(/,/g, '') : null; };
      const result = /매입\s*불가|불가|반송|폐기/.test(buy) ? 'discard' : num(buy) != null ? 'bought' : null;
      items.push({ no: +c[0], title: c[1], isbn13: i13, isbn10: i10, code: (ids.match(/K\d+/) || [])[0] || null, req, reqPrice: num(req), reqGrade: (req.match(/^([^\d]+)/) || [])[1] || null, buy: buy || null, buyPrice: num(buy), result }); });
    const tot = (head['판매금액'] || '').match(/총\s*(\d+)\s*권,\s*([\d,]+)\s*원/);
    return { head, items, date: head['신청일'] || null, type: head['판매타입'] || null, shipDate: head['발송일'] || null, doneDate: head['매입완료일'] || null, status: head['상태'] || head['신청 상태'] || head['신청상태'] || null, settle: head['정산방법'] || null, discardPolicy: head['매입불가처리'] || null, buyer: head['매입처'] || null, reqN: tot ? +tot[1] : items.length, reqAmount: tot ? +tot[2].replace(/,/g, '') : null };
  }

  // ---------- 상품 유형: 책 / 영상(DVD·블루레이·VHS) / 음반(CD·LP) / 기타 상품 ----------
  // 근거 순서: 제목의 매체 표시 → 알라딘 분류 → 코드 종류 → ISBN → 기타 상품 낱말 → 나머지는 책(세트 등)으로 추정
  const MEDIA = { book: '책', video: 'DVD·블루레이·VHS', music: 'CD·LP', other: '기타 상품' };
  const RE_VIDEO = /\[(?:\d+\s*K\s*|UHD\s*|3D\s*)?(?:블루레이|blu-?ray|DVD|VHS|UHD)[^\]]*\]|블루레이|blu-?ray|\bDVDs?\b|\bVHS\b|4K\s*UHD|스틸북|\[dts\]|\b\d+\s*disc\b|디스크\)/i;
  const RE_MUSIC = /\[(?:LP|CD|SACD|카세트|cassette|수입\s*LP|2LP|3LP)[^\]]*\]|\(\s*\d?\s*LP\s*\)|\b\d?LP\b|바이닐|vinyl|\bSACD\b|\[CD\]|카세트\s*테이프/i;
  const RE_OTHER = /굿즈|피규어|키링|머그컵|에코백|문구|퍼즐(?!\s*북)|보드\s*게임|카드\s*게임|SD\s*카드|메모리\s*카드|아크릴\s*스탠드(?!.*권)|포스터(?!\s*북)|달력(?!.*책)/i;
  function mediaType(x) {
    const title = String(x.title || x.titleRaw || ''); const cats = (x.categories || []).map((c) => (c.path || [])[0]).filter(Boolean);
    const ids = x.ids || []; const kinds = new Set(ids.map((c) => c.kind));
    const hasIsbn = ids.some((c) => (c.kind === 'isbn13' || c.kind === 'isbn10') && c.valid) || /^97[89]\d{10}$/.test(String(x.isbn13 || ''));
    const r = (t, why) => ({ type: t, label: MEDIA[t], why });
    // 1) 제목 앞의 매체 표시가 가장 확실 (책에 딸린 CD·DVD는 ISBN이 있어 책으로 둠)
    const head = title.slice(0, 40);
    if (/^\s*(\[[^\]]*\]\s*)*\[(?:\d+\s*K\s*|UHD\s*|3D\s*)?(?:블루레이|blu-?ray|DVD|VHS|UHD)/i.test(head)) return r('video', '제목의 [블루레이]·[DVD]·[VHS] 표시');
    if (/^\s*(\[[^\]]*\]\s*)*\[(?:LP|CD|SACD|카세트|수입\s*LP|\d?LP)/i.test(head)) return r('music', '제목의 [CD]·[LP] 표시');
    // 2) 알라딘 분류 (도서 정보를 받은 상품)
    if (cats.some((c) => /음반/.test(c))) return r('music', `알라딘 분류: ${cats[0]}`);
    if (cats.some((c) => /DVD|블루레이|Blu/i.test(c))) return r('video', `알라딘 분류: ${cats[0]}`);
    if (cats.some((c) => /도서|전자책/.test(c))) return RE_OTHER.test(title) && !hasIsbn ? r('other', '기타 상품 낱말') : r('book', `알라딘 분류: ${cats[0]}`);
    // 3) 코드 종류
    if (kinds.has('aladinDvdCode')) return r('video', 'D코드 (알라딘 DVD·블루레이 코드)');
    if (hasIsbn) return r('book', 'ISBN이 있음');
    if (kinds.has('issn13')) return r('book', '잡지 (ISSN 바코드)');
    if (RE_VIDEO.test(title)) return r('video', '제목에 블루레이·DVD·disc 낱말');
    if (RE_MUSIC.test(title)) return r('music', '제목에 LP·CD 낱말');
    if (RE_OTHER.test(title)) return r('other', '기타 상품 낱말');
    if (kinds.has('aladinMediaCode')) return r('music', 'C코드 (알라딘 음반·DVD 코드, 제목에 영상 표시 없음)');
    const ac = String(x.aladinCode || (ids.find((c) => c.kind === 'aladinCode') || {}).value || '');
    const bc = String(x.barcode || (ids.find((c) => c.kind === 'ean13') || {}).value || '');
    if (/^K/.test(ac)) return r('book', 'K코드 (알라딘 도서 코드)');
    if (/^49\d/.test(bc)) return r('book', '일본 잡지·도서 바코드 (491)');
    if (/^F/.test(ac)) return r('book', 'F코드 (수입 도서), 영상·음반 표시 없음');
    if (kinds.has('ean13') && /^[56]000/.test(ac)) return r('video', '책이 아닌 바코드 + 알라딘 6000번대 코드 — 영상으로 추정, 확인 필요');
    if (kinds.has('ean13')) return r('music', '책이 아닌 바코드(음반·DVD 대역), 영상 표시 없음 — 확인 필요');
    return r('book', 'ISBN 없음 — 세트·구판 등 책으로 추정');
  }


  // ========== 예스24 (2026-10-04 실제 화면 저장본으로 확인한 구조) ==========
  // 검색: https://www.yes24.com/Product/Search?domain=USED_GOODS&query=ISBN → 상품 묶음(Hub)마다 '매장ON N'·'판매자 배송 N'·'(총 N개)'
  const Y24_GRADE = { '01': '최상', '02': '상', '03': '중', '04': '하' };
  function parseYes24Search(doc) {
    const out = [];
    doc.querySelectorAll('li').forEach((li) => {
      const a = li.querySelector('a.gd_name[href*="UsedShopHub/Hub/"]'); if (!a) return;
      const hubId = ((a.getAttribute('href') || '').match(/Hub\/(\d+)/) || [])[1]; if (!hubId || out.some((x) => x.hubId === hubId)) return;
      const off = li.querySelector('.used_online strong'), c2c = li.querySelector('.used_seller strong'), tot = li.querySelector('.btn_used .num');
      const nw = (txt(li.querySelector('.info_usedNew')) || '').match(/새상품\s*:\s*([\d,]+)원/);
      out.push({ hubId, title: txt(a), offstore: off ? toInt(txt(off)) : 0, c2c: c2c ? toInt(txt(c2c)) : 0, total: tot ? toInt((txt(tot) || '').replace(/\D/g, '')) : null, newPrice: nw ? toInt(nw[1]) : null });
    });
    return out;
  }
  // 여러 묶음이면 판매자 배송 + 매장 수가 가장 많은 묶음 (같으면 먼저 나온 것)
  function pickYes24Hub(items) { if (!items || !items.length) return null; return items.slice().sort((a, b) => (b.c2c + b.offstore) - (a.c2c + a.offstore))[0]; }
  // 묶음 화면: https://www.yes24.com/Product/UsedShopHub/Hub/{hubId} — 가격 낮은 순, 줄마다 판매가·등급·배송비·판매자·평가 수·출고
  function parseYes24Hub(doc) {
    const offers = [];
    doc.querySelectorAll('li[saleprice][data-goods-no]').forEach((li, i) => {
      const deli = txt(li.querySelector('.info_deli')) || '';
      const shop = li.querySelector('.store_name a[href*="usedShop/mall/"]');
      const typ = [...li.querySelectorAll('.info_usedIco .txt')].map((e) => txt(e)).join(' ');
      const rc = (txt(li.querySelector('.store_txt')) || '').match(/([\d,]+)\s*명/);
      const rs = (li.querySelector('.store_rating .rating') || {}).className || ''; const score = (rs.match(/rating_(\d+)/) || [])[1];
      offers.push({
        pos: i + 1, goodsNo: li.getAttribute('data-goods-no'), price: toInt(li.getAttribute('saleprice')),
        grade: Y24_GRADE[li.getAttribute('levelgb')] || nz(txt(li.querySelector('.ico_used'))), levelgb: li.getAttribute('levelgb'),
        ship: toInt((deli.match(/배송비\s*:\s*([\d,]+)원/) || [])[1]), freeOver: toInt((deli.match(/([\d,]+)원\s*이상\s*구매\s*시\s*무료배송/) || [])[1]),
        shopId: shop ? ((shop.getAttribute('href') || '').match(/mall\/([^/]+)/) || [])[1] : null, shopName: shop ? txt(shop) : null,
        store: /매장/.test(typ) ? 'OFFSTORE' : 'C2C', ratingCount: rc ? toInt(rc[1]) : null, score: score ? +score : null,
        shipDays: nz(txt(li.querySelector('.deli_act'))), lowestBadge: /동급최저가/.test(txt(li.querySelector('.info_price')) || ''),
      });
    });
    return { offers };
  }
  // 판매자 가게: https://www.yes24.com/24/usedShop/mall/{shopId}/main (저장본은 EUC-KR — 받을 때 글자 판독 주의)
  function parseYes24Shop(doc) {
    const t = (txt(doc.body) || '').replace(/\s+/g, ' ');
    const g = (re) => (t.match(re) || [])[1];
    return {
      shopName: nz(g(/중고샵\s*>\s*(.+?)님의 가게/)), score: toInt(g(/판매자 만족도\s*(\d)\s*점/)), ratingCount: toInt(g(/\(\s*([\d,]+)\s*명 평가\)/)),
      avgShipDays: toInt(g(/평균 발송일:\s*주문완료 후\s*(\d+)일/)), totalItems: toInt(g(/총\s*([\d,]+)\s*건/)),
      shipFee: toInt(g(/배송비 안내:\s*([\d,]+)원/)), freeOver: toInt(g(/([\d,]+)원 이상 구매 시 무료배송/)),
      usedBooks: toInt(g(/중고도서\s*\(([\d,]+)\)/)),
    };
  }

  // ========== 샵매니저 상품 조회/수정의 실제 동작 (wrecord_edit.js·화면 저장본으로 확인) ==========
  // 가격: GET /scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=..&priceSales=.. → {"result":true,"resultValue":".."} (10원 이상)
  // 수량: GET cmd=chg.stock&ItemId=..&realStock=.. (1 이상) · 관리코드: POST cmd=chg.supplieritemcode&ItemId=..&supCode=escape(코드)
  // 판매상태: POST /scm/wrecord_edit_usedbatch.aspx  fn=stockstatusbulkchg · stockStatusBefore(지금 상태) · stockStatusToDo(바꿀 상태) · items(쉼표로 이은 ItemId) → 화면 전체가 다시 열림
  // 판매자가 고를 수 있는 상태는 판매중·일시판매중지·판매중지·삭제뿐 ('판매금지'는 알라딘이 정하는 상태라 우리가 바꿀 수 없음)
  const SCM_STATUS = { '판매중': 1, '일시판매중지': 3, '판매중지': 15, '삭제': 17 };
  const scmAction = {
    price: (itemId, price) => ({ method: 'GET', url: `/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=${encodeURIComponent(itemId)}&priceSales=${Math.round(price)}&_=${Date.now()}` }),
    stock: (itemId, n) => ({ method: 'GET', url: `/scm/ajaxCmd.aspx?cmd=chg.stock&ItemId=${encodeURIComponent(itemId)}&realStock=${Math.round(n)}&_=${Date.now()}` }),
    supCode: (itemId, code) => ({ method: 'POST', url: '/scm/ajaxCmd.aspx', body: `cmd=chg.supplieritemcode&ItemId=${encodeURIComponent(itemId)}&supCode=${escape(code)}` }),
    status: (fromName, toName, itemIds) => ({ method: 'POST', url: '/scm/wrecord_edit_usedbatch.aspx', body: `fn=stockstatusbulkchg&stockStatusBefore=${SCM_STATUS[fromName]}&stockStatusToDo=${SCM_STATUS[toName]}&items=${[].concat(itemIds).join(',')}` }),
  };
  function parseAjaxResult(text) { try { const j = JSON.parse(text); return { ok: !!j.result, value: j.resultValue ?? null, error: j.result ? null : `${j.errorCode || ''} ${j.errorMsg || ''}`.trim() || '실패' }; } catch (e) { return { ok: false, value: null, error: '응답을 읽지 못함(로그인 풀림일 수 있음)' }; } }

  // ========== 알라딘 요청 속도 조절 (모든 수집·감시가 같이 씀) ==========
  // 같은 브라우저의 모든 탭·스크립트(상품 수집·고객 수집·가격 감시)가 '마지막 요청 시각'과 '지금 간격'을 같이 봄(알라딘 화면의 localStorage)
  // → 탭·스크립트를 여러 개 열어도 이 PC에서 알라딘으로 가는 요청 속도는 하나로 묶임
  // 자동 조절(AIMD): 시작 1초 간격 → 연속 성공 20번마다 10%씩 빨라짐(최소 간격까지) → 실패·시간초과는 2배, 로그인 풀림은 3배로 즉시 느려짐(최대 간격까지)
  // 목표: 막히지 않는 범위에서 가장 빠르게. 숫자는 설정(상품 수집기 설정 → Firestore prd_system/settings)에서 바꾸고, 그 값이 여기로 전달됨
  const PACER_DEFAULTS = { minMs: 700, startMs: 1200, maxMs: 20000, upEvery: 20, upMul: 0.9, failMul: 2, loginMul: 3, tooManyMul: 4 };
  // 429 = 알라딘이 '요청이 너무 많다'고 거절 → 간격 4배 + 이 PC의 모든 탭·스크립트가 함께 쉼(1분, 거듭되면 2·3…10분). 성공이 쌓이면 다시 빨라짐
  function makePacer(key) {
    const LSx = (() => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } })();
    const K = 'rnPacer:' + key; const mem = {};
    const rd = (k) => { try { return LSx ? JSON.parse(LSx.getItem(k) || 'null') : mem[k] || null; } catch (e) { return null; } };
    const wr = (k, v) => { try { if (LSx) LSx.setItem(k, JSON.stringify(v)); else mem[k] = v; } catch (e) {} };
    const cfg = () => ({ ...PACER_DEFAULTS, ...(rd('rnPacer:cfg') || {}) });
    const st = () => { const c = cfg(); const x = rd(K) || {}; if (!(x.gap > 0)) x.gap = c.startMs; x.gap = Math.min(c.maxMs, Math.max(c.minMs, x.gap)); return x; };
    return {
      async wait(sleep, mult = 1) { for (;;) { const x = st(); const cool = (x.coolUntil || 0) - Date.now(); if (cool > 0) { await sleep(Math.min(cool, 4000)); continue; } const gap = x.gap * (mult || 1) * (0.85 + Math.random() * 0.3); const w = (x.last || 0) + gap - Date.now(); if (w > 0) { await sleep(Math.min(w, 4000)); continue; } x.last = Date.now(); wr(K, x); return; } },
      ok() { const c = cfg(); const x = st(); x.ok = (x.ok || 0) + 1; if (x.ok >= c.upEvery) { x.gap = Math.max(c.minMs, Math.round(x.gap * c.upMul)); x.ok = 0; x.n429 = 0; } wr(K, x); },
      fail(kind) { const c = cfg(); const x = st(); x.ok = 0; x.gap = Math.min(c.maxMs, Math.round(x.gap * (kind === '429' ? c.tooManyMul : kind === 'login' ? c.loginMul : c.failMul))); x.failAt = Date.now(); x.failKind = kind || 'error';
        if (kind === '429') { x.n429 = (x.n429 || 0) + 1; x.coolUntil = Date.now() + Math.min(10, x.n429) * 60000; } wr(K, x); },
      cooling() { const x = st(); return Math.max(0, (x.coolUntil || 0) - Date.now()); },
      state() { return { ...st(), cfg: cfg() }; },
      kindOf(status) { return status === 429 || status === 503 ? '429' : 'error'; },
      setCfg(o) { const c = { ...cfg(), ...o }; wr('rnPacer:cfg', { minMs: c.minMs, startMs: c.startMs, maxMs: c.maxMs }); },
    };
  }

  // ---------- 변경 비교 ----------
  function diff(prev, next, fields) {
    const ch = {};
    for (const f of fields) {
      const a = prev ? prev[f] : undefined; const b = next[f];
      if (b === undefined) continue;
      if (JSON.stringify(a) !== JSON.stringify(b)) ch[f] = { from: a === undefined ? null : a, to: b };
    }
    return ch;
  }
  // 온라인 중고 목록(첫 페이지) 변화: 같은 내용이면 아무것도 돌려주지 않음 → 바뀐 것만 기록 (데이터 수집 철칙)
  // 매물 열쇠 = 판매 상품코드(usedCode) → 없으면 상품번호(listingId) → 없으면 판매자+등급+가격
  // add = 새로 보인 매물(전체 내용 + 순위), del = 첫 페이지에서 빠진 매물(팔림·내림·뒤 페이지로 밀림을 구분 못 함 — 그대로 '빠짐'으로만 기록), chg = 같은 매물의 가격·배송비·등급·판매중지 변화
  function listingKey(r) { return r.usedCode || (r.listingId ? 'L' + r.listingId : `${r.sellerCode || r.sellerName}|${r.grade}|${r.price}`); }
  function listingsDiff(prev, next) {
    if (!next) return null; const P0 = prev || []; const pm = new Map(P0.map((r, i) => [listingKey(r), { r, pos: i + 1 }]));
    const nm = new Map(next.map((r, i) => [listingKey(r), { r, pos: i + 1 }])); const F = ['price', 'ship', 'halfShip', 'grade', 'soldOut', 'sellerBadge'];
    const add = [], del = [], chg = [];
    for (const [k, { r, pos }] of nm) { const o = pm.get(k); if (!o) { add.push({ k, pos, ...r }); continue; } const f = {}; for (const x of F) if (JSON.stringify(o.r[x] ?? null) !== JSON.stringify(r[x] ?? null)) f[x] = [o.r[x] ?? null, r[x] ?? null]; if (Object.keys(f).length) chg.push({ k, sellerCode: r.sellerCode || null, pos, f }); }
    for (const [k, { r, pos }] of pm) if (!nm.has(k)) del.push({ k, sellerCode: r.sellerCode || null, sellerName: r.sellerName || null, grade: r.grade || null, price: r.price ?? null, ship: r.ship ?? null, pos });
    return add.length || del.length || chg.length ? { add, del, chg, first: !prev } : null;
  }

  // 순위 타이틀 기간: 이전 활성 목록과 현재 목록 비교
  function rankTransitions(prevActive, nowList) {
    const a = new Set(prevActive || []); const b = new Set(nowList || []);
    return { started: [...b].filter((x) => !a.has(x)), ended: [...a].filter((x) => !b.has(x)), continuing: [...b].filter((x) => a.has(x)) };
  }

  const api = {
    VERSION, parseDate, splitTitle, classifyCode, collectIds, isbn10Valid, ean13Valid, isbn10to13,
    KEY_SCHEMES, lookupKeys, newBookId,
    tableToRows, parseRegExportRows, parseSoldRows, parseScmList, parseProductPage, parseUsedPage,
    parseBuyerDist, parseRelationBuy, parseClickRelation, parseUsedItemPhotos, parseSearchResults, searchChannels, marketNoBook, nameCoverage, setInfo, isUnregistered, searchQueryOf, sameVolume, parseC2BList, parseC2BDetail, diff, rankTransitions, listingKey, listingsDiff, mediaType, MEDIA,
    parseUsedItemInfo, parseUsedItemPrice, parseC2BSearch, parseC2BCart, makePacer, PACER_DEFAULTS, parseYes24Search, pickYes24Hub, parseYes24Hub, parseYes24Shop, Y24_GRADE, SCM_STATUS, scmAction, parseAjaxResult,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowProducts = api;
})(typeof window !== 'undefined' ? window : this);
