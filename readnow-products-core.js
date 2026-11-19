/* readnow-products-core.js
 * 알라딘 상품 관련 페이지·파일 파서 (순수 함수: Document/배열 → 데이터)
 * 상품 수집기(Tampermonkey)·웹앱·PC 엔진에서 공통 사용. 저장·네트워크 코드는 넣지 않는다.
 * 빈 값은 null. 화면 표시 단계에서 "-"로 바꾼다.
 */
(function (root) {
  'use strict';
  const VERSION = '0.19.15'; // (0.19.15 edall3) 🔖 판본 판 ③ 차이 표 — 후보 둘의 판형·출판사·연월 같고 다름을 표로 견줌(edDiff) · 검색 상자에 출판사·연월 · 후보·목록 줄 안 작은 글 · 읽기 0 · 점수는 그대로 // (0.19.14 edall3) 🔖 판본 판 ② — edIdSig(읽기 0 정체 신호 넷: 찍은 번호·표지 코드·978+K코드·지표에만 있는 낱말) · edDecide가 our.scan·doc.book을 받음 · 처음엔 그림자 · 찍은 번호 다름+판본 낱말만 사람 확인 // (0.19.13 edall1b) 🔖 판본 판 ① — edDecide가 근거 줄 ev·점수 sc·틀 번호 evV를 더 돌려줌(판정은 그대로) · 「초판 N쇄(N≥2)」는 판 아님 // (0.19.12 edkw2·edkw3) 🔖 판본 확인 판 ② — 판본 낱말 표 ED_TBL·ED_ALL(69개 · 강·중·약 · 자리 규칙 · 일반판 뒤집기) · 괄호 갈래(권 번호·디스크 수·세트 범위·연도 = 판본 아님 → 권·구성 대조) · sameVolume 끝 괄호 구멍 막음 · edCands(후보 문턱) · edGap(값 틈 경보) · edCodeOf(표지 주소 상품 코드) · edDecide 사람이 고른 판 // (0.19.11 tether1) 🔢 중고 상품 화면 ISBN — 그 화면엔 기본 정보 ISBN 줄·books:isbn·og:barcode가 없고 hd_ISBN은 'U+중고 번호'라 늘 null이었음(11/17 벤치마킹 상세 23,553쪽 · ISBN 0) → 제목 옆 검색 고리 SearchWord·미리보기 ISBN=·출간알림 인자·표지 그림 이름에서 검사 숫자가 맞는 것만(isbnNorm·isbnFromCover·isbnFromPage · isbnFrom에 어디서 읽었는지) // (0.19.10 edkw1) 🔖 판본 의심 상품 — 판본 낱말 16개 ED_KW · edSuspect(낱말·괄호) · edMatch(낱말 빠짐·더 붙음·세트↔낱권 = 다른 상품 · 낱말 겹침 닮음) · edDecide(검색의 같은 판본 상품 우선 · 비슷한 후보 둘이면 사람 확인 · 정범님 11/17 14:00) // (0.19.9 shopmisc1) 📏 상품 단위 unitOf·qtyTxt·qtyMix(책 권 · 세트 · 디스크 장 · 그 밖 개) // (0.19.8 adapt2) marketNoBook 평균·흩어짐을 reduce 대신 for 고리로(알라딘 화면 prototype.js의 reduce 바꿔치기로 NaN) // (0.19.7) 429·503 뒤 30분 동안 요청 간격 최소 2초(설정 floor429Min·floor429Ms · 정범님 11/05) · 로그인은 이 바닥과 상관없음 // (0.19.6) 미등록 상품 새책 같은 책 판단(newBookJudge·newBookPick) // (0.19.5) 📷 제품 사진 판정 photoKind·isProductPhoto·parseUsedItemProductPhotos·productPhotosOf(판매자 사진만) // (10/27) 📷 제품 사진 판정 photoKind·isProductPhoto·parseUsedItemProductPhotos·productPhotosOf (판 번호는 나중에) // (0.19.4) 📝 peerNoteTargets — 출고 시장에서 유의 사항을 읽을 다른 판매자 매물 고르기(중 전부 · 상 유효 중 우리 판매가 아래 2·위 2) // (0.19.3) 📖 미리보기(letslook)와 제품 사진 가르는 공용 함수(parseUsedItemPreviews·isPreviewPhoto·productPhotos·previewsOf 등) // (0.19.2) 📷 알라딘 미리보기(letslook) 사진은 상품 사진으로 받지 않음 // (0.19.1) 🔬 조회수 실험 1×1 그림(/px/숫자.gif)은 상품 사진으로 받지 않음 // (0.19.0) aladinQ — 알라딘 상품명 검색어 다듬기(정범님 10/23: 앞뒤 괄호와 그 안 · 부제(: 뒤) · 글자·숫자 아닌 기호 모두 뺌) // (0.18.0) resolveItemId — 주문 때 시장을 읽을 알라딘 상품을 ISBN으로 확인(이름 검색으로 다른 판을 잡던 것 · 정범님 10/20 빌리 배스게이트) // (0.17.0) scmSmart — 상품명·지은이 낱말 일부를 섞어 쳐도 찾음(정범님 10/20 '톨레 지금 순간') // (0.16.0) parseC2BDetail이 '매입불가 상품 내역'(불가 사유)도 읽음 · usedSearchRows(바깥 중고 검색 → 같은 상품 후보) // (0.15.1) parseScmEditNote — 샵매니저 상품 수정 화면의 구매 유의 사항(bookDesc) // (0.15.0) parseScmSearch — 샵매니저 상품등록 '알라딘 등록 상품 검색' 결과(등록 조회는 이 검색으로 · 사장님 10/16)

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

  // (0.19.11 tether1) 🔢 ISBN 낱말 다듬기 — ISBN13(978·979 · 검사 숫자 맞음)은 그대로 · ISBN10(검사 숫자 맞음)은 13자리로 · 그 밖(중고 번호 U…·알라딘 K코드·가린 ＊·검사 숫자 틀림)은 null
  function isbnNorm(s) {
    const v = String(s == null ? '' : s).trim().replace(/-/g, '').toUpperCase();
    if (/^97[89]\d{10}$/.test(v) && ean13Valid(v)) return v;
    if (isbn10Valid(v)) return isbn10to13(v);
    return null;
  }
  // 표지 그림 주소의 이름(…/cover500/8972596809_1.gif)이 ISBN일 때만(K코드 k142532394_1.jpg는 null)
  function isbnFromCover(u) {
    const m = String(u || '').match(/\/cover\d*\/(\d{9}[\dXx]|\d{13})_\d+\.[a-z]+/i);
    return m ? isbnNorm(m[1]) : null;
  }
  // 저장해 둔 상품 화면 정보(parseProductPage 결과)에서 ISBN 되살리기 — 화면을 다시 받지 않음
  function isbnFromPage(pg) {
    if (!pg) return null;
    return isbnNorm(pg.isbn13) || isbnFromCover(pg.images && pg.images.front) || null;
  }
  // 중고 상품 화면(wproduct.aspx?ItemId=중고 번호)에서 ISBN 찾기 — 차례: 제목 옆 검색 고리 → 미리보기 → hd_ISBN → 출간알림 → 표지 이름
  function pageIsbnFallback(doc, front) {
    const at = (sel, attr) => [...doc.querySelectorAll(sel)].map((e) => e.getAttribute(attr) || '');
    const tries = [
      ['search', at('.Ere_prod_titlewrap a[href*="SearchWord="]', 'href').map((h) => (h.match(/SearchWord=([^&#]+)/i) || [])[1])],
      ['preview', at('a[href*="wletslookViewer.aspx?ISBN="]', 'href').map((h) => (h.match(/ISBN=([0-9A-Za-z]+)/) || [])[1])],
      ['hidden', at('input.hd_ISBN', 'value')],
      ['alarm', at('[onclick*="fn_newEbookAlarm2"]', 'onclick').map((h) => (h.match(/fn_newEbookAlarm2\(\s*["']?([0-9Xx]{10,13})/) || [])[1])],
    ];
    for (const [from, list] of tries) for (const raw of list) { let v = raw; try { v = decodeURIComponent(raw || ''); } catch (e) {} const n = isbnNorm(v); if (n) return { isbn: n, from }; }
    const c = isbnFromCover(front);
    return c ? { isbn: c, from: 'cover' } : { isbn: null, from: null };
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
    const isbnMain = basic.isbn13 || meta('books:isbn');
    const isbnAlt = isbnMain ? null : pageIsbnFallback(doc, front); /* (0.19.11 tether1) 중고 상품 화면엔 위 두 자리가 없음 */
    return {
      aladinItemId: itemId ? itemId[1] : null,
      title: nz(txt(titleLi && titleLi.querySelector('.Ere_bo_title'))),
      subtitle: nz(txt(titleLi && titleLi.querySelector('.Ere_sub1_title')).replace(/^-\s*/, '')),
      series: nz(txt(titleLi && titleLi.querySelector('a[href*="wseriesitem"]'))),
      contributors, publisher: nz(txt(pubA)), aladinPublisherId: pubM ? pubM[1] : null,
      pubDate: dateM ? dateM[1] : (ld && ld.workExample && ld.workExample[0] && ld.workExample[0].datePublished) || null,
      originalTitle: origA ? txt(origA).replace(/^원제\s*:\s*/, '') : null,
      isbn13: isbnMain || (isbnAlt && isbnAlt.isbn) || null, isbnFrom: isbnMain ? (basic.isbn13 ? 'basic' : 'meta') : (isbnAlt && isbnAlt.from) || null, isbnKey: isbnHidden ? isbnHidden.value : null,
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
  /* (0.19.15 edall3 판본 판 ③) 검색 상자 글 「지은이 | 출판사 | 2024년 3월」에서 지은이·출판사·출간 연월을 더 뽑음(있을 때만 — 없으면 칸 자체가 없음 · 지금 칸은 그대로) */
  function searchMetaOf(t, title) { let s = String(t || '').replace(/\s+/g, ' '); const tt = String(title || '').replace(/\s+/g, ' ').trim(); if (tt) { const k = s.indexOf(tt); if (k >= 0) s = s.slice(k + tt.length); } const m = s.match(/([^|]{0,200}?)\|\s*([^|]{1,40}?)\s*\|\s*(\d{4})년\s*(\d{1,2})월/); if (!m) return {}; const o = {}; const by = m[1].replace(/\(\s*(지은이|저자|글|그림|지음)[^)]*\)/g, ' ').replace(/(^|\s)(지은이|지음)(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim(); if (by && by.length <= 60) o.by = by; const pub = m[2].trim(); if (pub) o.publisher = pub; o.ym = `${m[3]}-${String(m[4]).padStart(2, '0')}`; return o; }
  function parseSearchResults(d) {
    return [...d.querySelectorAll('.ss_book_box')].map((b) => { const a = b.querySelector('a.bo3'); const img = b.querySelector('img.front_cover') || b.querySelector('img');
      const id = b.getAttribute('itemid') || (((a && a.getAttribute('href')) || '').match(/ItemId=(\d+)/) || [])[1] || null; const src = img ? img.getAttribute('src') || '' : '';
      const ck = b.querySelector('input[name^="chkCart."]'); const mt = searchMetaOf(b.textContent || '', a ? txt(a) : ''); return { ...mt, itemId: id, title: a ? txt(a) : '', href: a ? a.getAttribute('href') : null, img: /^\/\//.test(src) ? 'https:' + src : src, used: /\[중고\]/.test(b.textContent || ''), channels: searchChannels(b), cart: ck ? ck.getAttribute('name').replace('chkCart.', '') : null, ours: /scm996008/.test(src) }; }).filter((x) => x.itemId && x.title); // (0.14.0) cart = 장바구니 상품코드 · ours = 사진 주소가 우리 판매자(scm996008…)
  }
  // (0.15.0) 샵매니저 상품등록의 '알라딘 등록 상품 검색' 창(/scm/wpopup_sISBN.aspx?ISBN=검색어&SearchISBNType=ISBN|NAME&BranchType=1 국내도서·2 음반·3 DVD/블루레이·7 외국도서 — 로그인 필요) 결과
  //  줄마다 submitParent2('코드', '상품번호', '제목') — 코드 = 등록 화면 wrecord.aspx?ISBN=에 넣는 값(책은 ISBN10, DVD 등은 'D492939320' 같은 알라딘 코드) · 사장님 10/16: 등록 조회는 이 검색으로
  function parseScmSearch(doc) { const rows = [];
    for (const t of doc.querySelectorAll('table[onclick*="submitParent2"]')) { const m = (t.getAttribute('onclick') || '').match(/submitParent2\('([^']*)',\s*'(\d+)'/); if (!m) continue;
      const td = [...t.querySelectorAll('td')].find((x) => /정가\s*:/.test(x.textContent || '') && !x.querySelector('table')); if (!td) continue; const first = [...td.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); const title = (first ? first.textContent : '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const gw = td.querySelector('.gw'); const pm = (td.textContent || '').match(/정가\s*:\s*([\d,]+)/); const img = t.querySelector('img[src*="_1."], img[src*="cover"]'); const src = img ? img.getAttribute('src') || '' : '';
      if (rows.some((r) => r.itemId === m[2])) continue; rows.push({ code: m[1], itemId: m[2], title, by: gw ? txt(gw) : null, priceList: pm ? toInt(pm[1]) : null, img: /^\/\//.test(src) ? 'https:' + src : /^https?:/.test(src) ? src : /^\//.test(src) ? 'https://www.aladin.co.kr' + src : null }); }
    let last = 1; for (const x of doc.querySelectorAll('[onclick*="Page_Set"]')) { const mm = (x.getAttribute('onclick') || '').match(/Page_Set\('?(\d+)/); if (mm) last = Math.max(last, +mm[1]); }
    return { rows, last }; }
  /* (0.15.0) 샵매니저 등록 검색을 실제로 부름(로그인된 알라딘 화면 안에서만 — 로거는 부르지 않음) · 1쪽 GET → 더 있으면 2쪽은 그 화면 양식(frmBrand) 그대로 POST · get(url, init) = fetch 대신(수집기는 GM 요청) */
  async function scmSearch(q, kind, branch, get, pages) { const u = '/scm/wpopup_sISBN.aspx?ISBN=' + encodeURIComponent(q) + '&SearchISBNType=' + (kind === 'ISBN' ? 'ISBN' : 'NAME') + '&BranchType=' + (+branch || 1); const g = get || (async (url, init) => { const r = await fetch(url, { credentials: 'include', cache: 'no-store', ...(init || {}) }); return { url: r.url, text: await r.text() }; });
    const r1 = await g(u); if (/\/login\/|wlogin/i.test(r1.url || '')) return { login: false, rows: [] }; const d1 = new DOMParser().parseFromString(r1.text, 'text/html'); const R = parseScmSearch(d1); let rows = R.rows;
    for (let pg = 2; pg <= Math.min(R.last, pages || 2); pg++) { try { const f = d1.querySelector('form#frmBrand'); if (!f) break; const fd = new URLSearchParams(); f.querySelectorAll('input').forEach((i) => { if (!i.name || (i.type === 'radio' && !i.checked)) return; fd.set(i.name, i.value || ''); }); fd.set('page', String(pg)); fd.set('BranchType', String(+branch || 1)); if (kind === 'ISBN') fd.set('ISBN', q); else { fd.set('Key', q); fd.set('KeyWord', q); }
        const r2 = await g('/scm/wpopup_sISBN.aspx', { method: 'POST', body: fd.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); const R2 = parseScmSearch(new DOMParser().parseFromString(r2.text, 'text/html')); const have = new Set(rows.map((x) => x.itemId)); const add = R2.rows.filter((x) => !have.has(x.itemId)); if (!add.length) break; rows = rows.concat(add); } catch (e) { break; } }
    return { login: true, rows, last: R.last }; }
  /* (0.17.0) 📥 등록 검색 똑똑하게(정범님 10/20 21:44): '톨레 지금 순간' · '지금 이 순간 톨레' · '순간을 살아라 에크하'처럼 상품명 낱말 일부 + 지은이 이름 일부를 아무 차례로 쳐도 찾음
   *  샵매니저 등록 검색은 상품명만 봄 → ① 친 그대로 ② 낱말 하나씩 뺀 묶음(긴 묶음부터) ③ 긴 낱말 하나씩 — 차례로 찾아 후보를 모으고, 모든 낱말이 '상품명 + 지은이·출판사' 안에 (띄어쓰기 없이 부분으로) 다 들어 있는 후보가 나오면 멈춤
   *  후보마다 all(모든 낱말 들어 있음)·hit(들어 있는 낱말 비율) — 모든 낱말이 맞는 후보를 맨 앞에. 찾기 횟수는 많아야 7번(알라딘 부담) */
  const smTok = (q) => String(q || '').split(/[\s,·/|]+/).map((w) => w.toLowerCase().replace(/[\p{P}\p{S}]/gu, '')).filter((w) => w.length >= 1);
  const smNorm = (x) => String(x || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  function smHit(toks, row) { const h = smNorm((row.title || '') + ' ' + (row.by || '')); let k = 0; for (const w of toks) if (h.includes(w)) k++; return toks.length ? k / toks.length : 0; }
  function smVariants(toks) { const n = toks.length; const out = []; const seen = new Set(); const add = (L) => { const q = L.join(' '); if (q && !seen.has(q)) { seen.add(q); out.push(q); } };
    for (let k = n - 1; k >= 1; k--) { const C = []; const rec = (i, acc) => { if (acc.length === k) { C.push(acc.slice()); return; } for (let j = i; j < n; j++) { acc.push(toks[j]); rec(j + 1, acc); acc.pop(); } }; rec(0, []);
      C.sort((a, b) => b.join('').length - a.join('').length); C.forEach((L) => { if (k > 1 || L[0].length >= 2) add(L); }); if (out.length > 12) break; }
    return out; }
  async function scmSmart(q0, branch, get, pages) { const q = aladinQ(q0) || String(q0 || '').trim(); /* (0.19.0) 기호·앞뒤 괄호·부제 뺀 검색어로 */ const toks = smTok(q); const R0 = await scmSearch(q, 'NAME', branch, get, pages); if (!R0.login) return R0; const by = new Map(); const put = (rows, via) => rows.forEach((r) => { if (!by.has(r.itemId)) by.set(r.itemId, { ...r, via }); });
    put(R0.rows, q); const tries = [q]; const full = () => [...by.values()].some((r) => smHit(toks, r) === 1);
    if (toks.length >= 2 && !full()) { for (const v of smVariants(toks)) { if (tries.length >= 7) break; tries.push(v); try { const R = await scmSearch(v, 'NAME', branch, get, Math.min(pages || 2, 5)); if (!R.login) break; put(R.rows, v); } catch (e) {} if (full()) break; } }
    const rows = [...by.values()].map((r, i) => { const hit = smHit(toks, r); return { ...r, hit: Math.round(hit * 100) / 100, all: hit === 1, _i: i }; }); rows.sort((a, b) => (b.all - a.all) || (b.hit - a.hit) || (a._i - b._i)); rows.forEach((r) => delete r._i);
    return { login: true, rows, last: R0.last, tries, nAll: rows.filter((r) => r.all).length }; }
  /* (0.18.0) 🛡 우리 상품의 알라딘 상품 번호(ItemId) 정하기 — 정범님 10/20 '빌리 배스게이트 주문 때 시장이 실제와 완전히 다름': 도서 정보에 상품 번호가 없을 때 상품명 검색 첫 후보(이름 90%↑)를 써서 같은 이름의 다른 판(1990년대판 · 정가 9,900 · 품절)의 시장을 읽었음
   *  ① ISBN이 있으면 ISBN으로 찾고, 후보의 상품 화면 ISBN이 우리 ISBN과 같을 때만 씀 — ISBN이 있는데 못 맞추면 이름으로 넘어가지 않음(틀린 시장보다 '못 읽음'이 안전)
   *  ② ISBN이 없을 때만 상품명 — 이름 90%↑ 후보가 딱 하나일 때만(여럿이면 판을 정할 수 없어 읽지 않음)
   *  get(url) → { doc } · 돌려줌 { itemId, how: 'isbn'|'title1', isbnOk } 또는 { err } */
  const isbnN = (x) => String(x || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  async function resolveItemId(o) { const get = o.get; const isbn = isbnN(o.isbn); const title = aladinQ(o.title) || String(o.title || '').replace(/^\[[^\]]*\]\s*/, '').trim();
    if (isbn.length >= 10) { let cands = []; try { const sr = await get('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(isbn)); cands = parseSearchResults(sr.doc).filter((x) => !x.used); } catch (e) { return { err: 'ISBN 검색 실패: ' + e.message }; }
      for (const c of cands.slice(0, 4)) { try { const g = await get('/shop/wproduct.aspx?ItemId=' + c.itemId); const b = parseProductPage(g.doc, g.url); const bi = isbnN(b && b.isbn13); if (bi && (bi === isbn || bi.slice(-10, -1) === isbn.slice(-10, -1))) return { itemId: String(c.itemId), how: 'isbn', isbnOk: true }; } catch (e) {} }
      return { err: `ISBN ${isbn}으로 알라딘 상품을 못 찾음(후보 ${cands.length}개 중 ISBN이 같은 것 없음) — 이름이 같은 다른 판일 수 있어 시장을 읽지 않음` }; }
    if (!title) return { err: 'ISBN·상품명 모두 없음' };
    let L = []; try { const sr = await get('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(title)); L = parseSearchResults(sr.doc).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: nameCoverage(title, x.title), title: x.title })).filter((x) => x.cov >= 0.9); } catch (e) { return { err: '상품명 검색 실패: ' + e.message }; }
    if (L.length === 1) return { itemId: String(L[0].itemId), how: 'title1', isbnOk: null };
    return { err: L.length ? `이름이 같은 알라딘 상품이 ${L.length}개(판이 여럿) — 어느 것인지 몰라 시장을 읽지 않음` : '상품명으로 알라딘 상품을 못 찾음' }; }
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
    const med = q(keep, 0.5), p25 = q(keep, 0.25), p75 = q(keep, 0.75); const sumK = (f) => { let t = 0; for (let i = 0; i < keep.length; i++) t += f(keep[i]); return t; }; /* (0.19.8) 알라딘 화면의 옛 prototype.js가 Array.prototype.reduce를 바꿔 NaN이 나던 것 → for 고리(adapt2와 같은 방식) */ const mean = keep.length ? sumK((b) => b) / keep.length : null;
    const sd = keep.length > 1 ? Math.sqrt(sumK((b) => (b - mean) ** 2) / (keep.length - 1)) : null; const cv = sd && mean ? sd / mean : null;
    const conf = !keep.length ? '없음' : keep.length === 1 ? '낮음' : keep.length >= 4 && cv != null && cv < 0.35 ? '높음' : '보통';
    const our = o.ourPrice != null ? +o.ourPrice : null; const pos = our != null && keep.length ? keep.filter((v) => v < our).length / keep.length : null;
    return { n: keep.length, nAll: vals.length, outliers: out, median: med, p25, p75, low: keep.length ? keep[0] : null, high: keep.length ? keep[keep.length - 1] : null, cv, conf, ourPrice: our, ourVsMedian: our != null && med ? our / med - 1 : null, cheaperShare: pos, points: pts };
  }
  /* (0.16.0) 바깥 중고 검색(SearchTarget=Used) 결과 → 같은 상품 후보(이름 일치·권 번호 같음 = match) — 수집기 '새상품 없는 상품 시세'와 📥 등록 조회(기본값 판매가 ②)가 같이 씀 */
  function usedSearchRows(doc, qy, th, selfItemId) { const t = th ?? 0.9; return parseSearchResults(doc).map((r) => ({ ...r, cov: Math.round(nameCoverage(qy, r.title) * 1000) / 1000, vol: sameVolume(qy, r.title) })).filter((r) => r.cov >= 0.5).slice(0, 30).map((r) => ({ itemId: r.itemId, title: r.title, img: r.img || null, cov: r.cov, vol: r.vol, ours: !!r.ours, channels: r.channels || null, match: r.cov >= t && r.vol && !(selfItemId && String(r.itemId) === String(selfItemId)) })); }
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
  /* (0.19.0) 🔎 알라딘 상품명 검색어 — 정범님 10/23 '상품명은 통째로 검색하지 말고 앞뒤의 대·중·소괄호와 그 안을 빼고 · 글자와 숫자 말고 기호는 넣지 말고 · : 뒤 부제·설명은 빼고'
   *  ① 유니코드 정규화(NFKC — 전각 괄호·숫자 → 보통 글자) ② [중고 …] 뗌 ③ 앞·뒤 괄호 묶음을 그 안 글자째(여러 겹·닫히지 않은 끝 괄호도) ④ 부제 자름: ':' '：' '=' '/' '|' 와 띄어 쓴 ' - ' ' – ' ' — ' ' ~ ' 뒤 (앞쪽이 2글자 이상일 때만)
   *  ⑤ 가운데 괄호는 기호만 빼고 안 글자는 둠(예: '해리 포터 (1) 마법사의 돌' → 1을 지킴) ⑥ 글자·숫자·띄어쓰기만 남김 — 단 영문 낱말 안의 - ' + # . &는 둠(X-Men · Harry's · C++) ⑦ 빈 결과면 기호만 뺀 원래 제목
   *  알라딘 검색 연구(진단 srchlab)는 PROJECT_STATE '알라딘 검색 규칙'에 */
  const AQ_O = '\\(\\[\\{<〈《「『【〔', AQ_C = '\\)\\]\\}>〉》」』】〕';
  const AQ_LEAD = new RegExp('^\\s*[' + AQ_O + '][^' + AQ_C + ']*[' + AQ_C + ']\\s*'), AQ_TAIL = new RegExp('\\s*[' + AQ_O + '][^' + AQ_O + ']*[' + AQ_C + ']\\s*$'), AQ_OPEN = new RegExp('\\s*[' + AQ_O + '][^' + AQ_C + ']*$');
  /* 낱말 안의 영문 기호는 둠 — 진단 srchlab(10/23): 'X-Men' 정확 · 'X Men' 엉뚱 / "Harry's" 정확 · 'Harrys' 해리 포터 / 'C++ 기초' 67건 정확 · 'C 기초' 1,630건 */
  const aqTok = (w) => /^[A-Za-z0-9][A-Za-z0-9\-'+.#&]*$/.test(w) && /[A-Za-z]/.test(w) ? w.replace(/[^A-Za-z0-9+#]+$/, '') : w.replace(/[^\p{L}\p{N}]+/gu, ' ');
  const aqClean = (x) => String(x || '').replace(/[’‘`´]/g, "'").split(/\s+/).map((w) => aqTok(w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}+#]+$/gu, ''))).join(' ').replace(/\s+/g, ' ').trim();
  function aladinQ(title) { const raw = String(title || ''); if (/^[\d\s\-Xx]{10,20}$/.test(raw.trim()) && /\d{3}/.test(raw)) return raw.replace(/[^\dXx]/g, ''); /* ISBN·바코드는 붙여서 */ let t = raw.normalize('NFKC').replace(/^\s*\[중고[^\]]*\]\s*/, '');
    for (let i = 0; i < 6; i++) { const u = t.replace(AQ_LEAD, '').replace(AQ_TAIL, '').replace(AQ_OPEN, ''); if (u === t || !aqClean(u)) break; t = u; }
    const cut = t.split(/\s*[:：=|]\s*|\s+[-–—~]\s+|\s*\/\s+|\s+\/\s*|(?<![A-Za-z0-9])\/|\/(?![A-Za-z0-9])/); if (cut.length > 1 && aqClean(cut[0]).replace(/\s/g, '').length >= 2) t = cut[0];
    return aqClean(t) || aqClean(raw); }
  /* (0.19.0) 알라딘 검색은 낱말이 모두 들어간 상품만 냄(진단: '미키7 미키 반즈 장편소설' 0건 · '미키7' 56건) → 0건이면 뒤 낱말부터 하나씩 빼서 다시(최대 4번) */
  function aladinQTries(title) { const q = aladinQ(title); const w = q.split(' ').filter(Boolean); const out = q ? [q] : []; for (let n = w.length - 1; n >= 1 && out.length < 4; n--) { const v = w.slice(0, n).join(' '); if (v.replace(/\s/g, '').length >= 2) out.push(v); } return out; }
  /* (0.19.11 edkw2 · 정범님 11/17 19:52 (c)) 권·구성 대조 — 예전엔 끝 괄호를 떼고 숫자만 봐서 '(1)'과 '(2)', '(1disc)'와 '(2disc)'를 같은 상품으로 봄(구멍)
   *  ① 권: 제목 본문 숫자(연도 1800~2099 뺌) + 권 괄호((1)·1권·상/하·vol.2)의 번호를 합쳐 같아야 함 — 한쪽에만 권 괄호가 있고 다른 쪽엔 권 표시가 아예 없으면 예전처럼 본문 숫자만 견줌(알라딘 제목이 권 번호를 빼고 쓴 경우)
   *  ② 디스크 수(2disc·2CD)·세트 범위(1~5권·전5권)는 양쪽에 다 있을 때만 견줌 */
  function volInfo(x) { const base = (searchQueryOf(x).match(/\d+/g) || []).map(Number).filter((n) => !(n >= 1800 && n <= 2099)); const bv = [], disc = [], rng = [];
    for (const b of edBrAll(x).out) { const c = edN(b.v).replace(/\s+/g, ''); if (b.k === 'vol') { const n = c.match(/\d+/); bv.push(n ? +n[0] : ({ 상: 'u', 중: 'm', 하: 'd' })[c.replace(/권$/, '').replace(/^\d+/, '')] || c); } else if (b.k === 'disc') disc.push(c.replace(/(discs|disks|disc|disk|디스크)/g, 'd')); else if (b.k === 'range') rng.push(c.replace(/(세트|set)$/, '')); }
    const body = searchQueryOf(x); const lt = (body.match(/(?:^|\s)([상중하])(?:권)?$/) || [])[1]; if (lt) bv.push(({ 상: 'u', 중: 'm', 하: 'd' })[lt]);
    const od = edN(x).match(/(\d+)\s*(disc|discs|disk|cd|dvd|bd|lp)\b/g); if (od && !disc.length) disc.push(...od.map((v) => v.replace(/\s+/g, '').replace(/(discs|disks|disc|disk)/g, 'd')));
    const full = [...new Set([...base, ...bv].map(String))].sort().join(','); return { base: [...base].sort((p, q) => p - q).join(','), bv: bv.length, full, disc: disc.sort().join(','), rng: rng.sort().join(',') }; }
  function sameVolume(a, b) { const A = volInfo(a), B = volInfo(b); if (A.disc && B.disc && A.disc !== B.disc) return false; if (A.rng && B.rng && A.rng !== B.rng) return false;
    if (A.full === B.full) return true; if (!!A.bv !== !!B.bv) return A.base === B.base; return false; }
  function nameCoverage(query, title) { const n = (x) => String(x || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); const q = n(query), t = n(title); if (!q.length) return 0;
    const dp = new Array(t.length + 1).fill(0); for (let i = 1; i <= q.length; i++) { let prev = 0; for (let j = 1; j <= t.length; j++) { const tmp = dp[j]; dp[j] = q[i - 1] === t[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]); prev = tmp; } } return dp[t.length] / q.length; }
  /* (0.19.10 edkw1 · 정범님 11/17 14:00 I-1117-1400-12) 🔖 판본 의심 상품 — 리커버·한정판처럼 같은 이름의 다른 판이 있는 상품
   *  ED_KW: 판본 낱말 16개 한 곳(웹앱 판본 대조·수집기 검색 시세·가격 판정 엔진 specialKeywords 기본값이 이것을 씀)
   *  edSuspect(제목): 낱말 하나라도 있거나 괄호 ( ) { } [ ] 가 있으면 의심 → 자동 시장 지표만 믿지 않고 상품명 검색으로 대조
   *    맨 앞 분류 꼬리표([중고-상]·[국내도서]·[외국도서]·[eBook]·[블루레이]·[DVD]·[CD]·[LP] 등)는 괄호로 세지 않음(판 표시가 아니라 상품 갈래 — 알라딘 영상·음반은 판마다 상품이 따로라 자동 지표가 맞음, 진단 11/17 한정판 블루레이 4개 모두 제목 같음)
   *  edMatch(우리, 후보): 우리 제목의 낱말이 후보에 없으면(miss) 또는 후보에만 있으면(extra) 다른 상품(ok false) · 닮음 sim = 낱말 겹침(dice)·글자 두 개씩 겹침(cloud/edition.js dice와 같은 셈) 반씩
   *  edDecide(우리, 검색 시세 문서): 어느 시장을 쓸지 — srch(검색의 같은 판본 상품 우선) · auto(자동 지표 그대로 · 검색이 확인) · check(사람 확인 · hold면 가격 바꾸지 않음) · none */
  const ED_KW = ['한정', '특별', '특전', '특장', '기념', '주년', '리커버', '초판', '초회', '교보', '알라딘', '예스24', '밀리의', '인터파크', '텀블벅', '펀딩'];
  const ED_ALIAS = { '예스24': /예스24|yes24/, '밀리의': /밀리의/ };
  /* (0.19.11 edkw2 · 정범님 11/17 19:52 I-1117-1952-22 (c)) 🔖 판본 낱말 표 한 곳 — [낱말, 갈래, 무게, 자리꼴]
   *  갈래: A 특별판(한정·리커버·에디션) · B 판매처 단독(교보·알라딘·예스24) · C 펀딩(텀블벅·와디즈) · D 제본·꼴(양장·문고판·큰글자) · E 판차·개정(개정판·완역) · F 서명·부록(사인본·굿즈) · G 매체 포장(스틸북 — 영상·음반에서만)
   *  무게 (정범님 11/17 20:27 I-1117-2027-23 「괄호 없이도」): s 강한 낱말 — 괄호가 없어도 제목 어디서나(리커버·한정판·사인본·양장·개정판·에디션…) · 약한 낱말(흔한 말)만 자리 규칙 — m 괄호 안이거나 제목 끝 낱말일 때만(스페셜·무선·신판·부록·굿즈·컬렉터) · w 자리꼴(뒤에 판·본·에디션·리커버… 가 붙은 꼴)이거나 괄호 안 그 낱말 하나·제목 끝 낱말일 때(알라딘·특별·기념·교보·한정·펀딩 — 혼자면 책 이름일 수 있음)
   *  ED_KW 16개는 가격 판정 엔진 specialKeywords 기본값과 ⑮ 한정판 키워드 칸이 그대로 씀(가격 코어가 읽는 쪽수가 바뀌지 않게) — 판본 대조(edKwOf·edSuspect·edMatch)는 이 표 전부 */
  const ED_TBL = [
    ['한정', 'A', 'w', /한정(판|본|수량|특전|발매|에디션|세트|생산|부수|증정|리커버|양장|굿즈|특별)/], ['특별', 'A', 'w', /특별(판|본|한정|에디션|기념|세트|증정|부록|리커버|양장|합본)/], ['특전', 'A', 's', /특전(?!사)/], ['특장', 'A', 'w', /특장(판|본|세트|에디션|한정)/],
    ['기념', 'A', 'w', /기념(판|본|에디션|한정|특별|세트|리커버|양장|합본|개정)|\d+주년기념/], ['주년', 'A', 's', /\d+주년|주년(기념|판|에디션|특별|한정|리커버)/], ['리커버', 'A', 's', /리커버|recover/], ['예스리커버', 'B', 's', /예스(24)?리커버|yes(24)?리커버/],
    ['초판', 'E', 's', /초판(?!본)/], ['초회', 'A', 's'], ['에디션', 'A', 's', /에디션|edition/], ['스페셜', 'A', 'm', /스페셜|special/], ['리미티드', 'A', 's', /리미티드|limited/], ['애장판', 'A', 's'], ['완전판', 'A', 's'],
    ['디럭스', 'A', 's', /디럭스|deluxe/], ['컬렉터', 'A', 'm', /컬렉터|컬렉터즈|collector/], ['감독판', 'A', 's'], ['확장판', 'A', 's'],
    ['교보', 'B', 'w', /교보(문고)?(리커버|단독|한정|특별|에디션|판|스페셜|독점|굿즈|에디션|양장)/], ['알라딘', 'B', 'w', /알라딘(단독|한정|특별|리커버|에디션|판|굿즈|독점|스페셜|양장)/], ['예스24', 'B', 's', /예스24|yes24/], ['밀리의', 'B', 's', /밀리의/], ['인터파크', 'B', 's'],
    ['동네서점', 'B', 'w', /동네서점(에디션|판|한정|리커버|단독|특별|전용)/],
    ['텀블벅', 'C', 's'], ['와디즈', 'C', 's'], ['펀딩', 'C', 'w', /펀딩(판|굿즈|한정|에디션|리워드|본|특전|후원)/], ['북펀드', 'C', 's'],
    ['양장', 'D', 's', /(?<!반)양장/], ['하드커버', 'D', 's', /하드커버|hardcover|hardback/], ['반양장', 'D', 's'], ['무선', 'D', 'm', /^무선(제본|판|본)?$|무선(제본|판|본)/], ['페이퍼백', 'D', 's', /페이퍼백|paperback/],
    ['보급판', 'D', 's'], ['문고판', 'D', 's'], ['문고본', 'D', 's'], ['핸디북', 'D', 's'], ['포켓판', 'D', 's', /포켓(판|북|에디션)/], ['미니북', 'D', 's', /미니북|미니판/], ['큰글자', 'D', 's', /큰글(자|씨)/],
    ['개정판', 'E', 's', /개정\d*판|\d+차개정/], ['전면개정', 'E', 's'], ['개정증보', 'E', 's', /개정증보|증보개정/], ['증보판', 'E', 's'], ['신판', 'E', 'm', /^신판$|(?<![가-힣])신판/], ['구판', 'E', 'm', /^구판$|(?<![가-힣])구판/],
    ['완역', 'E', 's', /완역(판|본)?/], ['무삭제', 'E', 's'], ['풀컬러', 'E', 's', /풀컬러|올컬러|fullcolou?r/], ['현대어판', 'E', 's'], ['초판본', 'E', 's'], ['합본', 'E', 's', /합본/],
    ['사인본', 'F', 's', /사인본|친필사인|저자사인|사인인쇄/], ['서명본', 'F', 's'], ['넘버링', 'F', 's'], ['부록', 'F', 'm'], ['별책', 'F', 's', /별책/], ['굿즈', 'F', 'm'], ['박스세트', 'F', 's', /박스세트|boxset/], ['슬립케이스', 'F', 's', /슬립케이스|slipcase/],
    ['스틸북', 'G', 's', /스틸북|steelbook/], ['풀슬립', 'G', 's'], ['렌티큘러', 'G', 's'], ['오링케이스', 'G', 's', /오링|o-?ring/], ['아웃박스', 'G', 's'], ['디지북', 'G', 's', /디지북|digibook/], ['디지팩', 'G', 's', /디지팩|digipak|digipack/], ['콤보팩', 'G', 's', /콤보팩|combo/]];
  const ED_ALL = ED_TBL.map((r) => r[0]); const ED_GRP = Object.fromEntries(ED_TBL.map((r) => [r[0], r[1]]));
  const ED_GEN = /일반판|통상판|보통판|일반본|일반에디션/; /* 뒤집는 낱말 — 특별판(A·B·C) 표시를 지움 */
  const ED_NSSAE = /초판\D{0,2}(?:[2-9]|\d{2,})쇄/; /* (0.19.13 edall1b) 「초판 6쇄」= 첫 판의 여섯 번째 찍음 = 흔한 보통판 → 초판(특별판 낱말) 표시를 지움 · 「초판 1쇄」는 그대로 초판 */
  const ED_CAT = /^(중고.*|새\s*상품|국내\s*도서|외국\s*도서|e-?book|전자책|오디오북|수입|예약\s*판매|(\d+\s*k\s*)?(uhd\s*)?(3d\s*)?(블루레이|blu-?ray)|(\d+\s*k\s*)?uhd|dvd|vhs|s?a?cd|lp|음반|굿즈|잡지)$/i;
  const ED_MEDIA = /^\s*(\[[^\]]*\]\s*)*\[[^\]]*(블루레이|blu-?ray|uhd|dvd|vhs|cd|lp|음반)[^\]]*\]/i;
  const edN = (t) => String(t || '').normalize('NFKC').toLowerCase();
  const edBody = (t) => { let s = edN(t).trim(); for (let i = 0; i < 4; i++) { const m = s.match(/^\[([^\]]*)\]\s*/); if (!m || !ED_CAT.test(m[1].trim())) break; s = s.slice(m[0].length); } return s; };
  const ED_BR = /[(\[{（【〔<〈《]([^()\[\]{}（）【】〔〕<>〈〉《》]*)[)\]}）】〕>〉》]/g;
  /* (0.19.11) 판본과 상관없는 괄호 — 판본 의심에서 빼고 권·구성 대조(sameVolume)에만 씀: vol 권 번호 (1)·1권·상/하·vol.2 · disc 디스크 수 (2disc)·2CD · range 세트 범위 (1~5권)·전5권 · year 연도만 (2020)·2020년 */
  function edBrKind(x) { const c = edN(x).replace(/\s+/g, '').replace(/[.,·]$/, ''); if (!c) return 'empty';
    if (/^(18|19|20)\d{2}([.\-/]\d{1,2}){0,2}(년)?$/.test(c)) return 'year';
    if (/^(\d+(disc|discs|disk|cd|dvd|bd|lp|디스크|장)s?\+?)+$/.test(c)) return 'disc';
    if (/^(제?\d+(권|부|편|집|호|화|막|기)?|vol\.?\d+|volume\d+|no\.?\d+|part\.?\d+|book\d+|[상중하](권)?|\d+[상중하]|시즌\d+|season\d+|\d+[~\-–]\d+화)$/.test(c)) return /\d+[~\-–]\d+화/.test(c) ? 'range' : 'vol';
    if (/^(전\d+권(세트|set)?|\d+[~\-–]\d+(권)?(세트|set)?|전\d+(권|책)|\d+권세트|\d+권set)$/.test(c)) return 'range';
    return null; }
  function edBrAll(title) { const s = edBody(title); const out = []; let m; ED_BR.lastIndex = 0; while ((m = ED_BR.exec(s)) && out.length < 8) { const v = m[1].trim(); out.push({ v: v.slice(0, 30), k: edBrKind(v) }); } return { s, out, open: !out.length && /[()\[\]{}]/.test(s) }; }
  function edBrOf(title) { const B = edBrAll(title); const out = B.out.filter((b) => !b.k).map((b) => b.v).slice(0, 6); if (!out.length && B.open) out.push('(짝 없는 괄호)'); return out; }
  function edBrxOf(title) { return edBrAll(title).out.filter((b) => b.k && b.k !== 'empty').map((b) => ({ v: b.v, k: b.k })); }
  /* 낱말 찾기: kws를 주면 예전(0.19.10)처럼 띄어쓰기 없는 제목에 그 글자가 들어 있는지(⑮ 사용자 낱말) · 안 주면 ED_TBL의 무게·자리꼴 · opt.media(또는 제목 앞 [블루레이]·[DVD] 꼬리표)면 G 갈래도 */
  function edHits(title, kws, opt) { const s0 = edBody(title); const ns = s0.replace(/\s+/g, '');
    if (Array.isArray(kws) && kws.length) return { kw: kws.map((k) => String(k).trim()).filter(Boolean).filter((k) => (ED_ALIAS[k] ? ED_ALIAS[k].test(ns) : ns.includes(edN(k).replace(/\s+/g, '')))), gen: false };
    const brs = []; let m; ED_BR.lastIndex = 0; while ((m = ED_BR.exec(s0))) brs.push(m[1].replace(/\s+/g, ''));
    const out0 = s0.replace(ED_BR, ' ').split(/\s+\/\s*|\s*\/\s+/)[0].trim().split(/\s+/); const last = String(out0[out0.length - 1] || '').replace(/[\p{P}\p{S}]+$/u, '');
    const media = !!((opt && opt.media) || ED_MEDIA.test(edN(title)));
    let kw = ED_TBL.filter(([k, g, w, re]) => { if (g === 'G' && !media) return false; const t = (x) => (re ? re.test(x) : x.includes(k)); return w === 'm' ? brs.some(t) || t(last) : w === 'w' ? t(ns) || brs.some((x) => x === k) || last === k : t(ns); }).map((r) => r[0]);
    if (kw.includes('반양장')) kw = kw.filter((k) => k !== '양장'); if (kw.includes('초판본')) kw = kw.filter((k) => k !== '초판'); if (kw.includes('예스리커버')) kw = kw.filter((k) => k !== '리커버' && k !== '예스24');
    const gen = ED_GEN.test(ns); if (gen) kw = kw.filter((k) => !'ABC'.includes(ED_GRP[k])); if (ED_NSSAE.test(ns)) kw = kw.filter((k) => k !== '초판'); return { kw, gen }; }
  function edKwOf(title, kws, opt) { return edHits(title, kws, opt).kw; }
  /* edSuspect → { on, kw(판본 낱말), br(판본과 닿을 수 있는 괄호), brx(판본과 상관없는 괄호 — 권·디스크·범위·연도), tier(검색 차례 1 낱말·Edition/Limited 괄호 · 2 그 밖 괄호 · 0 의심 아님), gen(일반판 표시) } */
  /* (0.19.11 · 정범님 11/17 20:27 I-1117-2027-23 「유의 사항 속 판본 낱말」) 우리 상품의 유의 사항(prd_used_info/{listingId}.note — 수집기 readOurUsed·note2 「📝 유의 사항 바로 보기」가 같은 칸에 씀)에 사인본·친필·서명·넘버링·한정이 있으면 판본 의심
   *  좁게: 「사인펜」·「서명란」·「한정식」 같은 말은 안 잡히게 꼴을 정함 · 바로 뒤(8자 안)에 「아님·없음·아니」가 오면 뺌(「사인본 아님」) · 실제 사례: 동방신기 정규 8집 New Chapter #1(제목엔 없고 유의 사항에 사인본) */
  const ED_NOTE = [['사인본', /사인본|싸인본|친필\s*사인|저자\s*사인|싸인\s*(있|포함|cd|앨범)|사인\s*(있|포함|인쇄|cd|앨범|된)/g], ['친필', /친필(?!\s*사인)/g], ['서명본', /서명본|저자\s*서명|서명\s*(있|포함|된)/g], ['넘버링', /넘버링|일련\s*번호/g], ['한정판', /한정\s*(판|본|수량|생산|발매|에디션|부수)/g]];
  function edNoteKw(text) { const s = edN(text); if (!s.trim()) return []; const out = [];
    for (const [k, re] of ED_NOTE) { re.lastIndex = 0; let m; while ((m = re.exec(s))) { const after = s.slice(m.index + m[0].length, m.index + m[0].length + 8); if (!/^[\s:·,.]*(아님|아니|없|x\b)/.test(after)) { out.push(k); break; } } } return out; }
  /* edSuspect(제목, 낱말, opt) — opt.extra: 시리즈 칸·부제(문자열 또는 배열 · 판본 낱말을 제목처럼 찾음) · opt.note: 유의 사항 글(판본 낱말이 있으면 note에 담고 검색 차례 1) */
  function edSuspect(title, kws, opt) { const H = edHits(title, kws, opt), br = edBrOf(title), brx = edBrxOf(title); let kw = H.kw; const ex = [].concat((opt && opt.extra) || []).filter(Boolean).map(String);
    for (const x of ex) for (const k of edHits(x, kws, opt).kw) if (!kw.includes(k)) kw = [...kw, k];
    const note = opt && opt.note ? edNoteKw(opt.note) : []; const t1 = kw.length > 0 || note.length > 0 || br.some((b) => /edition|limited|special|에디션|리미티드/i.test(b)); return { on: !!(kw.length || br.length || note.length), kw, br, brx, note, tier: t1 ? 1 : br.length ? 2 : 0, gen: H.gen }; }
  const edTok = (t) => edBody(t).replace(/[\s\p{P}\p{S}]+/gu, ' ').trim().split(' ').filter(Boolean);
  const edBig = (s) => { const o = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); o.set(g, (o.get(g) || 0) + 1); } return o; };
  function edDice(a, b) { a = String(a || ''); b = String(b || ''); if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0; const A = edBig(a), B = edBig(b); let x = 0, n = 0; for (const [g, c] of A) { n += c; if (B.has(g)) x += Math.min(c, B.get(g)); } for (const c of B.values()) n += c; return (2 * x) / n; }
  function edSim(a, b) { const A = new Set(edTok(a)), B = new Set(edTok(b)); let k = 0; for (const w of A) if (B.has(w)) k++; const wd = A.size + B.size ? (2 * k) / (A.size + B.size) : 0; const cd = edDice(edTok(a).join(''), edTok(b).join('')); return Math.round((wd + cd) * 500) / 1000; }
  const edMediaOf = (t) => { const m = edN(t).match(/^\s*(?:\[[^\]]*\]\s*)*?\[([^\]]*(블루레이|blu-?ray|uhd|dvd|vhs|cd|lp|음반)[^\]]*)\]/i); if (!m) return null; const v = m[1]; return /uhd/.test(v) ? 'uhd' : /블루레이|blu-?ray/.test(v) ? 'bd' : /dvd/.test(v) ? 'dvd' : /vhs/.test(v) ? 'vhs' : /lp/.test(v) ? 'lp' : 'cd'; };
  /* (0.19.11) 표지 그림 주소 속 상품 코드 — 알라딘 표지 파일 이름 = 10자리 ISBN 또는 K코드(979 ISBN 책) · 같으면 같은 판(읽는 수 0) */
  const edOurCode = (l) => { if (!l) return null; if (l.aladinCode && /^K\d{9}$/i.test(l.aladinCode)) return String(l.aladinCode).toUpperCase(); if (l.isbn10 && /^\d{9}[\dXx]$/.test(l.isbn10)) return String(l.isbn10).toUpperCase(); const d = String(l.isbn13 || '').replace(/\D/g, ''); if (/^978\d{10}$/.test(d)) { const b = d.slice(3, 12); let t = 0; for (let i = 0; i < 9; i++) t += (10 - i) * +b[i]; const c = (11 - (t % 11)) % 11; return b + (c === 10 ? 'X' : String(c)); } return null; }; /* 우리 상품의 표지 코드: K코드 · 10자리 ISBN · 978 ISBN13 → 10자리 */
  const edCodeOf = (u) => { const m = String(u || '').match(/\/([0-9]{9}[0-9xX]|K\d{9})(?:_\d+)?\.(?:jpe?g|png|gif|webp)/); return m ? m[1].toUpperCase() : null; };
  /* edMatch: 막는 규칙(다른 상품) — 판본 낱말 빠짐(miss)·더 붙음(extra) · 세트↔낱권(setDiff) · (0.19.11) 권·디스크·범위 다름(volDiff) · 매체 꼬리표 다름(mediaDiff — 양쪽에 다 있고 다를 때만) */
  function edMatch(our, cand, kws, opt) { const a = edKwOf(our, kws), b = edKwOf(cand, kws); const miss = a.filter((k) => !b.includes(k)), extra = b.filter((k) => !a.includes(k)); const setDiff = !!setInfo(our).set !== !!setInfo(cand).set; /* 세트 ↔ 낱권은 낱말이 같아도 다른 상품 */
    const volDiff = !sameVolume(our, cand); const ma = edMediaOf(our), mb = edMediaOf(cand); const mediaDiff = !!(ma && mb && ma !== mb);
    const ok = !miss.length && !(opt && opt.extraOk ? false : extra.length) && !setDiff && !volDiff && !mediaDiff; return { ok, miss, extra, setDiff, volDiff, mediaDiff, sim: edSim(our, cand) }; }
  /* gapN·gapR (0.19.11 · EDKW_MORE 판 ② ①) 값 틈 경보: 우리 제목에 강한 특별판 낱말(A·B·C 갈래)이 있는데 자동 지표가 '맞다'로 끝났고, 그 중고가 30부 넘게 있고 최저가가 우리 값의 절반 아래면 보통판 지표일 수 있음 → 사람 확인 · 30·0.5 근거: EDKW_MORE 표본(리커버 상품의 보통판 중고는 대개 수십 부·반값 아래) — th처럼 opt로 바꿈 */
  const ED_DEF = { th: 0.9, close: 0.05, minSim: 0.3, gapN: 30, gapR: 0.5 };
  function edGap(our, sus, o) { const strong = sus.kw.filter((k) => 'ABC'.includes(ED_GRP[k] || '')); const n = +our.autoN || 0, low = +our.autoLow || 0, p = +our.price || 0; return strong.length && n > o.gapN && low > 0 && p > 0 && low < p * o.gapR ? { kw: strong, n, low, p } : null; }
  /* (0.19.13 edall1b · 판본 판 ① 근거 틀) edDecide가 돌려주는 것에 근거 줄 ev(많아야 12줄) · 점수 sc({same,diff} 무게 합) · 틀 판 번호 evV를 더함 — 판정(use·pick·hold·why…)은 edDecide0이 한 글자도 안 바뀌게 그대로 냄
   *  ev 한 줄 = { k 신호 이름, v +1 같은 판 쪽 · −1 다른 판 쪽 · 0 모름, w 무게 0~1, d 짧은 까닭(60자 안) } · 처음 무게는 설계서의 강·중·약 0.9·0.5·0.2 */
  const ED_EVV = 1, ED_EVMAX = 12, ED_W = { s: 0.9, m: 0.5, w: 0.2 };
  const edEvD = (x) => String(x == null ? '' : x).slice(0, 60);
  function edEvOf(R) { const ev = []; const add = (k, v, w, d) => { if (ev.length < ED_EVMAX) ev.push({ k, v, w, d: edEvD(d) }); };
    for (const k of (R.kw || []).slice(0, 4)) add('kw', 0, ED_W[(ED_TBL.find((r) => r[0] === k) || [])[2]] || ED_W.w, `제목 낱말 ${k}`);
    if (R.br && R.br.length) add('br', 0, ED_W.w, `괄호 ${R.br.slice(0, 2).join('·')}`);
    if (R.note && R.note.length) add('note', 0, ED_W.m, `유의 사항 ${R.note.join('·')}`);
    if (R.book) add('kw', R.book.ok ? 1 : -1, R.book.ok ? ED_W.m : ED_W.s, R.book.ok ? `자동 지표 상품 낱말 같음(닮음 ${Math.round(R.book.sim * 100)}%)` : `자동 지표 상품 낱말·권 다름${R.book.miss.length ? ' 빠짐 ' + R.book.miss.join('·') : ''}${R.book.extra.length ? ' 더 ' + R.book.extra.join('·') : ''}`);
    const top = R.pick && R.pick.itemId ? (R.cands || []).find((c) => c.itemId === R.pick.itemId) : null; if (top && top.codeHit) add('code', 1, ED_W.s, `표지 코드 ${top.code} 같음`);
    if (R.gap) add('gap', -1, ED_W.m, `값 틈 중고 ${R.gap.n}부 최저 ${R.gap.low}원`);
    if (R.human) add('human', R.pick && R.pick.itemId ? 1 : -1, 1, R.pick && R.pick.itemId ? '사람이 고른 판' : '사람이 「다 아님」');
    return ev; }
  /* (0.19.14 edall3 · 판본 판 ② 읽기 0 정체 신호) edIdSig(our, book, o) — 우리 상품과 붙은 지표 책(book)의 「누구인가」 신호 네 줄(읽기 0 · 이미 있는 값만)
   *  our.scan = 등록 때 사람이 찍은 번호(없으면 신호 없음) · our.code = 우리 표지 코드(edOurCode) · our.title·note·extra = 우리 글
   *  book = { isbn13, img(앞표지 그림 주소), code(표지 코드 — img가 없을 때), title, sub, series, bind } 붙은 지표 책 정보(없으면 신호 없음)
   *  scan: 찍은 번호 ≠ 지표 ISBN → 다른 판에 붙음(강 −1) · 같음(+1 약 — 같은 ISBN 다른 상품은 남음)
   *  code: 우리 표지 코드 ≠ 지표 표지 코드 → 다른 상품(강 −1) · 같음(+1 중)
   *  kcode: 지표가 978 책인데 표지 코드가 K코드 → 같은 ISBN의 둘째 상품(특별판)일 수 있음(중 −1 · 판 ⓪ 가설 0.472 ≥ 0.3이라 무게 유지 · 979+K·978+ISBN-10 코드는 조용)
   *  rev: 지표 제목·부제·시리즈·제본에만 판본 낱말이 있고 우리 제목·유의 사항엔 없음(중 −1 · 거꾸로 견주기)
   *  단계 o.sig = { scan:'check', code:'shadow', kcode:'shadow', rev:'shadow' } (off·shadow·check·auto) · off면 그 줄을 안 만듦 · 돌려주는 것 = [{ k, v, w, d }] */
  const ED_SIG_DEF = { scan: 'check', code: 'shadow', kcode: 'shadow', rev: 'shadow', tbl: 'shadow', split: 'shadow', add: 'shadow' }, ED_SIG_ST = ['off', 'shadow', 'check', 'auto'];
  const edSigCfg = (opt) => { const x = opt ? opt.sig : undefined; if (x === false || (opt && opt.idSig === false)) return null; const c = { ...ED_SIG_DEF }; if (x && typeof x === 'object') for (const k of Object.keys(c)) if (ED_SIG_ST.includes(x[k])) c[k] = x[k]; return c; };
  const edIsbnOf = (v) => { const d = String(v == null ? '' : v).replace(/[^0-9Xx]/g, ''); return d.length === 13 || d.length === 10 ? isbnNorm(d) : null; };
  /* (0.19.15 edall3) 🔖 판본 판 ③ — edDiff(a, b): 두 책(우리 쪽 a · 견줄 쪽 b)의 차이 표(순수 · 읽기 0 · 이미 쌓인 값만). 칸: 정가 price · 쪽수 pages · 크기 size · 제본 bind · 출판사 pub · 출간 연월 ym · 지은이 au · 옮긴이 tr · 상태 st(구판·절판).
   *  칸마다 { k, a, b, r } — r: 'same'(같음) · 'diff'(다름) · null(한쪽이라도 비어 모름 — 다름으로 치지 않음). 쪽수는 ±2쪽 안 · 크기는 5mm 안 · 출판사는 번호가 같으면 이름이 달라도 같음.
   *  돌려줌: { rows, diff[칸 이름], same[칸 이름], unk[칸 이름], pages:{a,b,ratio}, pub:{same}, hint, txt(줄 안 작은 글 「정가 13,800 ↔ 16,800 · 쪽수 320 ↔ 352 · 양장 ↔ 무선 · 구판(절판)」) } */
  const edNm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '');
  const edPubSame = (a, b) => { if (a.pubId && b.pubId && String(a.pubId) === String(b.pubId)) return true; const x = edNm(a.publisher), y = edNm(b.publisher); if (!x || !y) return null; return x === y || (x.length >= 2 && y.includes(x)) || (y.length >= 2 && x.includes(y)); };
  const edBindOf = (v) => { const s = String(v == null ? '' : v); if (!s.trim()) return null; if (/반양장|세미\s*하드/.test(s)) return '반양장'; if (/양장|하드\s*커버|hard\s*cover|hardback/i.test(s)) return '양장'; if (/무선|소프트|페이퍼|paper\s*back|soft\s*cover|trade/i.test(s)) return '무선'; if (/스프링|링\s*제본|와이어/.test(s)) return '스프링'; if (/중철|떡제본|잡지/.test(s)) return '중철'; return s.trim().slice(0, 8); };
  const edSizeOf = (v) => { if (v == null || v === '') return null; if (typeof v === 'object') { const w = +v.w, h = +v.h; return w > 0 && h > 0 ? { w, h } : null; } const m = String(v).match(/(\d{2,3}(?:\.\d+)?)\s*[x×*]\s*(\d{2,3}(?:\.\d+)?)/i); if (!m) return null; const w = +m[1], h = +m[2]; return w > 0 && h > 0 ? { w: Math.min(w, h), h: Math.max(w, h) } : null; };
  const edYmOf = (v) => { const m = String(v == null ? '' : v).match(/(\d{4})\D{0,3}(\d{1,2})?/); return m && +m[1] >= 1900 && +m[1] <= 2100 ? `${m[1]}-${String(m[2] || '').padStart(2, '0') || '00'}`.replace(/-$/, '') : null; };
  const edStOf = (x) => { const s = String((x && (x.st || x.status)) || ''); const f = []; if (x && x.old) f.push('구판'); else if (/구판/.test(s)) f.push('구판'); if (x && x.oop) f.push('절판'); else if (/절판/.test(s)) f.push('절판'); else if (/품절/.test(s)) f.push('품절'); return f; };
  const edNmList = (L) => (Array.isArray(L) ? L : L ? [L] : []).map((x) => edNm(String(x).replace(/\(.*?\)/g, ''))).filter((x) => x.length >= 2);
  const edListOv = (A, B) => { A = edNmList(A); B = edNmList(B); if (!A.length || !B.length) return null; let k = 0; for (const a of A) if (B.some((b) => a === b || (a.length >= 3 && b.includes(a)) || (b.length >= 3 && a.includes(b)))) k++; return k / Math.min(A.length, B.length); };
  function edDiff(a, b) { a = a || {}; b = b || {}; const rows = []; const fmt = (n) => (+n).toLocaleString('en-US');
    const num = (v) => { const n = +String(v == null ? '' : v).replace(/[^0-9.]/g, ''); return n > 0 ? n : null; };
    const pa = num(a.pages), pb = num(b.pages), pr = pa && pb ? Math.min(pa, pb) / Math.max(pa, pb) : null;
    const pp = num(a.price), qq = num(b.price); const sa = edSizeOf(a.size), sb = edSizeOf(b.size); const ba = edBindOf(a.bind), bb = edBindOf(b.bind); const ya = edYmOf(a.ym || a.pubDate), yb = edYmOf(b.ym || b.pubDate);
    const ps = edPubSame(a, b); const au = edListOv(a.authors, b.authors), tr = edListOv(a.translators, b.translators);
    const add = (k, av, bv, r, txt) => rows.push({ k, a: av, b: bv, r, txt });
    add('price', pp, qq, pp && qq ? (pp === qq ? 'same' : 'diff') : null, pp && qq && pp !== qq ? `정가 ${fmt(pp)} ↔ ${fmt(qq)}` : '');
    add('pages', pa, pb, pa && pb ? (Math.abs(pa - pb) <= 2 ? 'same' : 'diff') : null, pa && pb && Math.abs(pa - pb) > 2 ? `쪽수 ${pa} ↔ ${pb}` : '');
    add('size', sa, sb, sa && sb ? (Math.abs(sa.w - sb.w) <= 5 && Math.abs(sa.h - sb.h) <= 5 ? 'same' : 'diff') : null, sa && sb && (Math.abs(sa.w - sb.w) > 5 || Math.abs(sa.h - sb.h) > 5) ? `크기 ${sa.w}×${sa.h} ↔ ${sb.w}×${sb.h}` : '');
    add('bind', ba, bb, ba && bb ? (ba === bb ? 'same' : 'diff') : null, ba && bb && ba !== bb ? `${ba} ↔ ${bb}` : '');
    add('pub', a.publisher || null, b.publisher || null, ps == null ? null : ps ? 'same' : 'diff', ps === false ? `출판사 ${String(a.publisher).slice(0, 10)} ↔ ${String(b.publisher).slice(0, 10)}` : '');
    add('ym', ya, yb, ya && yb ? (ya === yb ? 'same' : 'diff') : null, ya && yb && ya !== yb ? `출간 ${ya} ↔ ${yb}` : '');
    add('au', a.authors || null, b.authors || null, au == null ? null : au > 0 ? 'same' : 'diff', au === 0 ? '지은이 다름' : '');
    add('tr', a.translators || null, b.translators || null, tr == null ? null : tr > 0 ? 'same' : 'diff', tr === 0 ? '옮긴이 다름' : '');
    const stb = edStOf(b), sta = edStOf(a); const stTxt = stb.length ? `${stb.includes('구판') ? '구판' : ''}${stb.includes('구판') && stb.some((x) => x !== '구판') ? '(' + stb.filter((x) => x !== '구판').join('·') + ')' : stb.filter((x) => x !== '구판').join('·')}` : '';
    add('st', sta.join('·') || null, stb.join('·') || null, stb.length || sta.length ? (stb.join() === sta.join() ? 'same' : 'diff') : null, stTxt);
    const sel = (r) => rows.filter((x) => x.r === r).map((x) => x.k); const diff = sel('diff'), same = sel('same'), unk = rows.filter((x) => x.r == null).map((x) => x.k);
    const sameIsbn = !!(edIsbnOf(a.isbn13 || a.isbn) && edIsbnOf(a.isbn13 || a.isbn) === edIsbnOf(b.isbn13 || b.isbn));
    const hint = sameIsbn && diff.length === 1 && diff[0] === 'price' ? 'price' : null; /* 번호가 같고 정가만 다름 = 같은 책의 값 올림(다른 판 아님) */
    const txt = rows.map((x) => x.txt).filter(Boolean).join(' · ') + (hint ? ' · 같은 번호 값 올림' : '');
    return { rows, diff, same, unk, pages: { a: pa, b: pb, ratio: pr }, pub: { same: ps }, hint, txt: txt.slice(0, 120) }; }
  /* (0.19.16 edall3 · 판본 판 ④) edSplit(rows, o) — 같은 지표 안 중고 값이 두 무리로 갈리는지(순수 · 읽기 0 · 이미 쌓인 usedFirstPage 줄만)
   *  rows = [{ price, grade, soldOut }] 우리 줄은 부르는 쪽이 뺌 · 같은 등급끼리만 셈(등급 섞임은 등급별로 — 값 없는 줄·판매중지는 뺌) · 값에 로그를 씌워 줄 세우고 가장 큰 틈 하나를 찾음
   *  양쪽에 minSide(3)개 이상 · 틈(위 무리 최저 ÷ 아래 무리 최고)이 ratio(1.8)배 이상이면 on · 문턱은 어림값(방안 10 표본으로 맞춤)
   *  돌려줌 { on, grade, lo:{n,min,max}, hi:{n,min,max}, ratio, msg } · msg = 「이 시장은 값이 두 무리(6,000원대 6 · 28,000원대 3)」 · 셋 이상 무리는 가장 큰 틈 하나만 */
  const ED_SPLIT_DEF = { ratio: 1.8, minSide: 3 };
  function edSplit(rows, o) { const c = { ...ED_SPLIT_DEF, ...(o || {}) }; const G = new Map(); for (const r of Array.isArray(rows) ? rows : []) { const p = +(r && r.price); if (!(p > 0) || (r && r.soldOut)) continue; const g = String((r && r.grade) || ''); if (!G.has(g)) G.set(g, []); G.get(g).push(p); }
    let best = null; for (const [g, L] of G) { if (L.length < c.minSide * 2) continue; const v = L.slice().sort((a, b) => a - b); let at = -1, big = 0; for (let i = c.minSide; i <= v.length - c.minSide; i++) { const q = v[i] / v[i - 1]; if (q > big) { big = q; at = i; } }
      if (at < 0 || big < c.ratio) continue; const lo = v.slice(0, at), hi = v.slice(at); if (!best || big > best.ratio) best = { g, lo, hi, ratio: big }; }
    if (!best) return { on: false, grade: null, lo: null, hi: null, ratio: null, msg: '' };
    const st = (a) => ({ n: a.length, min: a[0], max: a[a.length - 1] }); const lo = st(best.lo), hi = st(best.hi); const band = (x) => { const t = Math.floor(x.min / 1000) * 1000; return `${t.toLocaleString('en-US')}원대 ${x.n}`; };
    return { on: true, grade: best.g || null, lo, hi, ratio: Math.round(best.ratio * 100) / 100, msg: `이 시장은 값이 두 무리(${band(lo)} · ${band(hi)})`.slice(0, 80) }; }
  /* 값 두 무리 → 근거 줄(그림자 · 약 0.2) — 우리 값이 위 무리이고 우리 제목에 판본 낱말이 있으면 「자동 시장(보통 아래 무리)이 우리 판이 아닐 수 있음」 쪽(−1) · 그 밖엔 알림(0) */
  function edSplitEv(S, our, kw) { if (!S || !S.on) return []; const p = +(our && our.price) || 0; const up = p > 0 && p >= S.hi.min * 0.9; const hasKw = Array.isArray(kw) && kw.length > 0; return [{ k: 'split', v: up && hasKw ? -1 : 0, w: ED_W.w, d: edEvD(S.msg + (up ? ' · 우리 값은 위 무리' : '')) }]; }
  /* 부가기호 둘째 자리(add) — 우리 값·지표 값이 둘 다 넘어올 때만(없으면 줄 없음) · 둘째 자리가 다르면 문고판·단행본·세트·전자책이 갈릴 수 있어 다른 판 쪽(약 −1) · 같으면 약한 같은 판 쪽(+1) */
  const edAdd2 = (v) => { const d = String(v == null ? '' : v).replace(/\D/g, ''); return d.length === 5 ? d[1] : null; };
  function edAddEv(our, book) { const a = edAdd2(our && our.addCode), b = edAdd2(book && book.addCode); if (a == null || b == null) return []; return [a === b ? { k: 'add', v: 1, w: ED_W.w, d: edEvD(`부가기호 둘째 자리 ${a} 같음`) } : { k: 'add', v: -1, w: ED_W.w, d: edEvD(`부가기호 둘째 자리 ${a} ↔ ${b} 다름(판형·세트 구분)`) }]; }
  /* 차이 표 → 근거 줄(그림자) — 제본·크기가 다르면 다른 판 쪽 · 쪽수가 ±2쪽 밖이면 약하게 · 정가만 다르고 번호 같음은 값 올림이라 같은 책 쪽 */
  function edDiffEv(D) { const out = []; if (!D || !D.rows) return out; const g = (k) => D.rows.find((x) => x.k === k) || {}; const add = (k, v, w, d) => out.push({ k, v, w, d: edEvD(d) });
    if (g('bind').r === 'diff') add('bind', -1, ED_W.m, `제본 ${g('bind').a} ↔ ${g('bind').b}`); if (g('size').r === 'diff') add('size', -1, ED_W.w, '크기가 다름');
    if (g('pages').r === 'diff' && D.pages.ratio != null && D.pages.ratio < 0.9) add('pages', -1, ED_W.w, `쪽수 ${D.pages.a} ↔ ${D.pages.b}`); else if (g('pages').r === 'same') add('pages', 1, ED_W.w, '쪽수 같음(±2쪽)');
    if (D.hint === 'price') add('price', 1, ED_W.w, '번호가 같고 정가만 다름(값 올림)'); return out; }
  function edIdSig(our, book, o) { const out = []; if (!our || !book) return out; const cfg = (o && o.cfg) || edSigCfg(o) || ED_SIG_DEF; const on = (k) => cfg[k] !== 'off'; const add = (k, v, w, d) => { if (on(k)) out.push({ k, v, w, d: edEvD(d) }); };
    const bIsbn = edIsbnOf(book.isbn13 || book.isbn); const bCode = book.code ? String(book.code).toUpperCase() : edCodeOf(book.img);
    const sc = edIsbnOf(our.scan);
    if (sc && bIsbn) { if (sc !== bIsbn) add('scan', -1, ED_W.s, `찍은 번호 ${sc} ↔ 지표 ${bIsbn}`); else add('scan', 1, ED_W.w, '찍은 번호가 지표 번호와 같음'); }
    const oc = our.code ? String(our.code).toUpperCase() : null;
    if (oc && bCode) { if (oc !== bCode) add('code', -1, ED_W.s, `표지 코드 ${oc} ↔ 지표 ${bCode}`); else add('code', 1, ED_W.m, `표지 코드 ${oc} 같음`); }
    if (bIsbn && bCode && bIsbn.startsWith('978') && /^K\d{9}$/.test(bCode)) add('kcode', -1, ED_W.m, `978 책인데 지표 표지 코드가 ${bCode}(K코드)`);
    const kws = o && Array.isArray(o.kws) && o.kws.length ? o.kws : undefined; const ours = edSuspect(String(our.title || ''), kws, { note: our.note, extra: our.extra });
    if (on('rev') && !ours.kw.length && !ours.note.length) { const bx = edSuspect(String(book.title || ''), kws, { extra: [book.sub, book.series, book.bind] }); if (bx.kw.length) add('rev', -1, ED_W.m, `지표에만 「${bx.kw.slice(0, 3).join('·')}」`); }
    return out; }
  function edDecide(our, doc, opt) { const R0 = edDecide0(our, doc, opt); if (!R0) return R0; const cfg = edSigCfg(opt); const book = doc && doc.book && typeof doc.book === 'object' ? doc.book : null;
    const spl = cfg && cfg.split !== 'off' && doc ? (doc.split && typeof doc.split === 'object' ? doc.split : Array.isArray(doc.rows) ? edSplit(doc.rows, opt && opt.splitCfg) : null) : null;
    const sig = (cfg && book ? edIdSig(our, book, { ...(opt || {}), cfg }) : []).concat(cfg && cfg.tbl !== 'off' && doc && doc.diff && doc.diff.rows ? edDiffEv(doc.diff) : [], spl ? edSplitEv(spl, our, R0.kw) : [], cfg && cfg.add !== 'off' && book ? edAddEv(our, book) : []); if (!R0.on && !sig.length) return R0;
    let R = R0; /* 단계가 check·auto인 신호가 다른 판 쪽(−1)이고 우리 제목에 판본 낱말이 있으며 자동 지표를 그대로 쓰려던 판정이면 → 사람 확인(값은 안 움직임) */
    if (R0.on && R0.use === 'auto' && R0.kw && R0.kw.length) { const hit = sig.find((e) => e.v < 0 && e.k !== 'split' && e.k !== 'add' && e.k !== 'tbl' && (cfg[e.k] === 'check' || cfg[e.k] === 'auto')); /* (판 ④) 값 두 무리·부가기호·차이 표는 약한 보조 근거 — 혼자서는 판정을 안 바꿈(설정을 올려도 그림자 줄로만) */ if (hit) R = { ...R0, use: 'check', hold: true, idsig: hit.k, why: `${hit.d} — 다른 판에 붙었을 수 있음(우리 제목에 ${R0.kw.slice(0, 3).join('·')}) · 사람 확인 · 가격을 바꾸지 않음` }; }
    const ev = (R.on ? edEvOf(R) : []).concat(sig).slice(0, ED_EVMAX); let same = 0, diff = 0; for (const e of ev) { if (e.v > 0) same += e.w; else if (e.v < 0) diff += e.w; } const r2 = (x) => Math.round(x * 100) / 100; return { ...R, ev, sc: { same: r2(same), diff: r2(diff) }, evV: ED_EVV, ...(spl && spl.on ? { split: { grade: spl.grade, lo: spl.lo, hi: spl.hi, ratio: spl.ratio, msg: spl.msg } } : {}) }; }
  function edDecide0(our, doc, opt) { const o = { ...ED_DEF, ...(opt || {}) }; const t = String((our && our.title) || ''); const sus = edSuspect(t, o.kws, { note: our && our.note, extra: our && our.extra }); if (!sus.on) return { on: false, kw: [], br: [], use: null };
    const self = our.bookId ? String(our.bookId).replace(/^bk_/, '') : null; const bm = our.bookTitle ? edMatch(t, our.bookTitle, o.kws) : null; const code = our.code ? String(our.code).toUpperCase() : null;
    const book = bm ? { t: String(our.bookTitle).slice(0, 80), ok: bm.ok, miss: bm.miss, extra: bm.extra, setDiff: bm.setDiff, volDiff: bm.volDiff, sim: bm.sim } : null; const multi = !!(our.unreg || our.set || !our.bookId);
    const C = doc && doc.src === 'usedSearch' && Array.isArray(doc.cands) ? doc.cands : null; const base = { on: true, kw: sus.kw, br: sus.br, note: sus.note, tier: sus.tier, book, multi, searched: !!C, at: (doc && doc.at) || null, pick: null, alt: null, ids: [], hold: false };
    const kwTxt = (b) => [b.miss.length ? `빠진 낱말 ${b.miss.join('·')}` : '', b.extra.length ? `더 붙은 낱말 ${b.extra.join('·')}` : '', b.setDiff ? '세트↔낱권 다름' : '', b.volDiff ? '권·구성 다름' : ''].filter(Boolean).join(' · ');
    const gapCheck = (R) => { if (R.use !== 'auto') return R; const g = edGap(our, sus, o); return g ? { ...R, use: 'check', hold: true, gap: g, why: `값 틈 경보 — 우리 제목에 ${g.kw.join('·')}인데 자동 지표 중고 ${g.n}부·최저 ${g.low}원이 우리 값 ${g.p}원의 절반 아래(보통판 지표일 수 있음) — 사람 확인 · 가격을 바꾸지 않음` } : R; };
    if (!C && sus.note.length && !(o.pick && o.pick.itemId)) return { ...base, use: 'check', hold: true, why: `유의 사항에 판본 낱말(${sus.note.join('·')}) — 같은 이름의 보통판 시장일 수 있어 사람 확인 · 판매가 그대로` };
    if (!C) return book && !book.ok ? { ...base, use: 'check', hold: true, why: `자동 지표 상품(${book.t})의 판본 낱말이 다름(${kwTxt(book)}) — 검색 대조 전이라 가격을 바꾸지 않음` } : gapCheck({ ...base, use: 'auto', why: book ? '자동 지표 상품 제목의 판본 낱말이 같음 · 검색 대조는 아직' : '검색 대조 아직' });
    const E = C.map((c) => { const m = edMatch(t, c.title, o.kws); const cc = edCodeOf(c.img); const codeHit = !!(code && cc && cc === code); return { itemId: String(c.itemId), t: String(c.title || '').slice(0, 80), ok: m.ok || (codeHit && !m.setDiff && !m.volDiff), miss: m.miss, extra: m.extra, setDiff: m.setDiff, volDiff: m.volDiff, sim: codeHit ? Math.max(m.sim, 0.99) : m.sim, cov: c.cov ?? null, vol: c.vol !== false && !m.volDiff, self: !!(self && String(c.itemId) === self), ours: !!c.ours, ...(cc ? { code: cc } : {}), ...(codeHit ? { codeHit: true } : {}) }; });
    const good = E.filter((e) => e.ok && e.vol && (e.codeHit || e.cov == null || e.cov >= o.th) && e.sim >= o.minSim).sort((a, b) => (b.codeHit ? 1 : 0) - (a.codeHit ? 1 : 0) || b.sim - a.sim || (a.self ? -1 : b.self ? 1 : 0)); const cut = E.filter((e) => !e.ok).length;
    const slim = (e) => (e ? { itemId: e.itemId, t: e.t, sim: e.sim, self: e.self, ...(e.codeHit ? { codeHit: true } : {}) } : null); const R = { ...base, cands: E.slice(0, 12), good: good.length, cut };
    const hp = o.pick; if (hp && hp.itemId) { const e = E.find((x) => x.itemId === String(hp.itemId)); if (e) return { ...R, use: 'srch', human: true, pick: slim(e), ids: [e.itemId], why: `사람이 고른 판(${e.t}) — 🔖 판본 확인 목록에서 정함` }; } /* (0.19.11 (b)) 사람이 「이 판으로 정함」 → 그 후보 시장 · 후보가 검색에서 사라지면 다시 기계 판단 */
    if (hp && hp.none) return { ...R, use: 'check', hold: true, human: true, why: '사람 확인 — 검색 후보가 모두 다른 판(「다 아님」) · 가격을 바꾸지 않음' };
    if (sus.note.length) return { ...R, use: 'check', hold: true, why: `유의 사항에 판본 낱말(${sus.note.join('·')}) — 같은 이름의 보통판 시장일 수 있어 사람 확인 · 판매가 그대로` }; /* (0.19.11 I-1117-2027-23) 사람이 판을 고르기 전까지 */
    if (multi) { const ids = good.filter((e) => !e.self).map((e) => e.itemId); return { ...R, use: ids.length ? 'srch' : 'none', ids, why: ids.length ? `검색 후보 ${E.length}개 중 판본 낱말이 같은 ${ids.length}개로 비교${cut ? ` · 낱말·권이 다른 ${cut}개 뺌` : ''}` : `판본 낱말이 같은 검색 후보 없음${cut ? `(낱말·권이 다른 ${cut}개 뺌)` : ''}` }; }
    const top = good[0] || null; const near = top && !top.codeHit ? good.filter((e) => e !== top && top.sim - e.sim < o.close) : [];
    if (!top) return book && !book.ok ? { ...R, use: 'check', hold: true, why: `자동 지표 상품(${book.t})도 검색 후보도 판본 낱말이 다름(${kwTxt(book)}) — 사람 확인 · 가격을 바꾸지 않음` } : gapCheck({ ...R, use: 'auto', why: `검색에 같은 판본 상품 없음${cut ? `(낱말·권이 다른 ${cut}개 뺌)` : ''} — 자동 지표 그대로${book ? '(자동 지표 상품의 판본 낱말은 같음)' : ''}` });
    if (top.self) return gapCheck({ ...R, use: 'auto', pick: slim(top), why: `검색에서 가장 닮은 같은 판본 상품 = 자동 지표 상품(닮음 ${Math.round(top.sim * 100)}%) — 확인됨` });
    if (near.some((e) => e.self)) return gapCheck({ ...R, use: 'auto', pick: slim(near.find((e) => e.self)), alt: slim(top), why: `자동 지표 상품과 검색 1위(${top.t})가 거의 같게 닮음 — 자동 지표 그대로` });
    if (near.length) return { ...R, use: 'check', hold: !!(book && !book.ok), pick: slim(top), alt: slim(near[0]), why: `같은 판본 후보 둘이 비슷함(${top.t} ${Math.round(top.sim * 100)}% · ${near[0].t} ${Math.round(near[0].sim * 100)}%) — 바꾸지 않고 사람 확인` };
    return { ...R, use: 'srch', pick: slim(top), ids: [top.itemId], why: top.codeHit ? `표지 상품 코드(${top.code})가 우리 상품과 같은 검색 상품(${top.t})으로` : book && !book.ok ? `자동 지표 상품(${book.t})은 판본 낱말이 다름(${kwTxt(book)}) → 검색의 같은 판본 상품(${top.t})으로` : `검색의 같은 판본 상품(${top.t} · 닮음 ${Math.round(top.sim * 100)}%)으로${book ? ` — 자동 지표 상품 닮음 ${Math.round(book.sim * 100)}%` : ''}` }; }
  /* (0.19.11 · 정범님 11/17 19:52 (b)) 🔖 판본 확인 목록의 후보 — 막는 규칙(권·구성 다름·세트↔낱권·매체 다름)을 통과하고 이름 겹침(cov · 없으면 닮음) ≥ minCov(기본 0.60 · ⚙ 느슨 0.45·보통 0.60·보수 0.75 · 0.30~0.95)인 것 모두, 점수 높은 순
   *  loose(⚙ 「낱말이 다른 특별판도 후보로 보이기」): 판본 낱말이 다른 후보도 넣고 kwDiff 표시 · 끄면 낱말 같은 것만 · 수집기가 cov 0.5 아래는 저장하지 않아 0.45를 골라도 0.5부터 보임 */
  function edCands(our, doc, opt) { const o = { minCov: 0.6, loose: false, ...(opt || {}) }; const th = Math.min(0.95, Math.max(0.3, +o.minCov || 0.6)); const t = String((our && our.title) || ''); const C = doc && Array.isArray(doc.cands) ? doc.cands : []; const self = our && our.bookId ? String(our.bookId).replace(/^bk_/, '') : null; const code = our && our.code ? String(our.code).toUpperCase() : null;
    return C.map((c) => { const m = edMatch(t, c.title, o.kws); const cc = edCodeOf(c.img); const score = c.cov != null ? +c.cov : m.sim; return { itemId: String(c.itemId), t: String(c.title || ''), kw: edKwOf(c.title, o.kws), miss: m.miss, extra: m.extra, block: m.setDiff ? '세트↔낱권' : m.volDiff || c.vol === false ? '권·구성 다름' : m.mediaDiff ? '매체 다름' : null, kwDiff: !!(m.miss.length || m.extra.length), score: Math.round(score * 1000) / 1000, sim: m.sim, code: cc, codeHit: !!(code && cc === code), self: !!(self && String(c.itemId) === self), ours: !!c.ours, channels: c.channels || null, price: c.price ?? null, ...(c.publisher ? { publisher: c.publisher } : {}), ...(c.ym ? { ym: c.ym } : {}), ...(c.by ? { by: c.by } : {}) }; })
      .filter((e) => !e.block && !e.ours && (e.codeHit || e.score >= th) && (o.loose || !e.kwDiff || e.codeHit)).sort((a, b) => (b.codeHit ? 1 : 0) - (a.codeHit ? 1 : 0) || b.score - a.score || b.sim - a.sim); }
  /* (정범님 11/04) 🆕 미등록 상품의 새책(새상품) 찾기 — 같은 책인지 판단(제목·지은이·출판사·출간 연도)
   *  our = { t: 우리 상품명, a: 지은이(쉼표·· 로 여럿), pb: 출판사, y: 출간 연도(4자리) } · b = parseProductPage 결과(새책 상품 화면) 또는 { title, contributors[{name}], publisher, pubDate }
   *  ① 제목: 우리 검색어(aladinQ)가 새책 제목에 90% 이상 들어 있고(nameCoverage) 거꾸로도 80% 이상(우리 제목이 짧아 더 긴 다른 책에 맞는 것 막음) · 권 번호 같음(sameVolume)
   *  ② 지은이·출판사·출간 연도: 양쪽에 다 있을 때만 견줌(맞음 true · 다름 false · 견줄 수 없음 null)
   *  결과 v: 'same'(제목 맞음 + 다른 것 하나 이상 맞음 + 다른 것 없음) · 'diff'(제목이 안 맞거나 하나라도 다름) · 'unsure'(제목만 맞고 견줄 것이 없음 — 애매하면 모름)
   *  기준 90%·80%는 이 파일의 다른 같은 상품 판단(검색 시세 photoMatch 0.9)과 같은 값 — 거꾸로 80%는 근거: 없음, th로 바꿈 */
  const nbNorm = (x) => String(x || '').normalize('NFKC').toLowerCase().replace(/\(주\)|㈜|주식회사|^\s*도서출판\s*/g, ' ').replace(/\s*(출판사|출판부|출판)\s*$/, '').replace(/[\(\[][^\)\]]*[\)\]]/g, ' ').replace(/(^|\s)(지음|지은이|옮김|옮긴이|엮음|엮은이|그림|펴냄|글|저|역|편|편저|외)(?=\s|$)/g, ' ').replace(/[\s\p{P}\p{S}]/gu, ''); /* 역할 말(지음·옮김…)은 따로 떨어진 낱말일 때만 뗌 — 이름 속 글자는 그대로 */
  const nbYear = (x) => { const m = String(x || '').match(/(1[89]\d{2}|20\d{2})/); return m ? +m[1] : null; };
  const nbNames = (x) => (Array.isArray(x) ? x.map((c) => (c && typeof c === 'object' ? c.name : c)) : String(x || '').split(/[,·;|/]|\s{2,}/)).map(nbNorm).filter((s) => s.length >= 2);
  function newBookJudge(our, b, th) { th = th || {}; const T1 = th.cov ?? 0.9, T2 = th.rev ?? 0.8; const o = our || {}; const x = b || {}; const why = [];
    const qt = aladinQ(o.t) || String(o.t || ''); const bt = aladinQ(x.title) || String(x.title || ''); if (!qt || !bt) return { v: 'diff', why: ['제목이 없음'], f: {} };
    const cov = Math.round(nameCoverage(qt, x.title) * 1000) / 1000, rev = Math.round(nameCoverage(bt, qt) * 1000) / 1000, vol = sameVolume(o.t, x.title);
    if (!(cov >= T1) || !(rev >= T2)) return { v: 'diff', why: [`제목이 다름(우리→새책 ${Math.round(cov * 100)}% · 새책→우리 ${Math.round(rev * 100)}%)`], cov, rev, f: {} };
    if (!vol) return { v: 'diff', why: ['권 번호가 다름'], cov, rev, f: {} };
    const eqN = (p, q) => p === q || (p.length >= 2 && q.length >= 2 && (p.includes(q) || q.includes(p)));
    const A = nbNames(o.a), BA = nbNames(x.contributors || x.a); const fa = A.length && BA.length ? A.some((p) => BA.some((q) => eqN(p, q))) : null;
    const P0 = nbNorm(o.pb), P1 = nbNorm(x.publisher || x.pb); const fp = P0 && P1 ? eqN(P0, P1) : null;
    const Y0 = nbYear(o.y), Y1 = nbYear(x.pubDate || x.d || x.y); const fy = Y0 && Y1 ? Y0 === Y1 : null;
    const f = { a: fa, pb: fp, y: fy }; const L = { a: '지은이', pb: '출판사', y: '출간 연도' };
    for (const k of ['a', 'pb', 'y']) { if (f[k] === true) why.push(L[k] + ' 같음'); else if (f[k] === false) why.push(L[k] + ' 다름'); }
    if (Object.values(f).some((v) => v === false)) return { v: 'diff', why, cov, rev, f };
    if (Object.values(f).some((v) => v === true)) return { v: 'same', why: ['제목 같음', ...why], cov, rev, f };
    return { v: 'unsure', why: ['제목만 같음 — 지은이·출판사·출간 연도를 견줄 수 없음(애매하면 모름)'], cov, rev, f }; }
  /* 여러 후보를 판단한 결과 → 하나로: 같은 책이 딱 하나면 found · 둘 이상이면 unsure(어느 판인지 모름) · 같은 책 없음 + 애매한 것/못 읽은 제목 맞는 후보가 있으면 unsure · 다 다르거나 후보가 없으면 none */
  function newBookPick(J, unread) { const same = (J || []).filter((j) => j && j.v === 'same'); const ids = [...new Set(same.map((j) => String(j.itemId)))];
    if (ids.length === 1) return { st: 'found', itemId: ids[0], why: '같은 책 새상품 1개' };
    if (ids.length > 1) return { st: 'unsure', why: `같은 책으로 보이는 새상품이 ${ids.length}개 — 어느 판인지 몰라 정하지 않음` };
    if ((J || []).some((j) => j && j.v === 'unsure')) return { st: 'unsure', why: '제목은 같은데 지은이·출판사·출간 연도를 견줄 수 없음 — 사람이 골라 주세요' };
    if (unread > 0) return { st: 'unsure', why: `제목이 맞는 후보 ${unread}개를 아직 열어 보지 않음` };
    return { st: 'none', why: (J || []).length ? `제목이 비슷한 새상품 ${(J || []).length}개를 열어 봤지만 모두 다른 책` : '검색에 같은 제목의 새상품이 없음' }; }
  // 우리(판매자) 중고 상품 페이지의 상품 사진: 위쪽 표지 영역(#CoverMainImage·표지 넘김 사진) + '중고상품 구매 유의 사항'(#usedDecription) 안 사진
  // 같은 사진이 크기만 다르게 여러 번 나오므로 파일 이름으로 하나만 남김. 표지 영역 작은 크기(coversum 등)는 cover500으로 바꿔 둔 주소도 함께 줌
  function parseUsedItemPhotos(d) {
    const out = []; const seen = new Set(); const base = (u) => String(u || '').split('?')[0].split('/').pop().replace(/\(\d+\)(?=\.)/, '');
    const add = (img, where) => { const src = img && (img.getAttribute('src') || img.getAttribute('data-src') || ''); if (!src || /icon|btn|blank|noimg|spacer/i.test(src) || /\/px\/\d+\.gif/i.test(src) || /\/letslook\//i.test(src)) return; /* (10/26 18:21 정범님 '받은 이미지를 다시 받는다') 알라딘 '미리보기'(letslook — 새상품 책 속 쪽 사진, 상품마다 20~30장)는 판매자 사진이 아니고 같은 책이면 모두 같음 — 받지 않음 */ /* (10/26) 🔬 조회수 실험 1×1 그림은 사진이 아님 */ const k = base(src); if (!k || seen.has(k)) return; seen.add(k);
      const abs = /^\/\//.test(src) ? 'https:' + src : src; const big = abs.replace(/\/(coversum|cover150|cover200|cover|cover300)\//, '/cover500/'); out.push({ src: abs, big: big !== abs ? big : null, where, file: k }); };
    const main = d.getElementById('CoverMainImage'); if (main) add(main, 'top');
    d.querySelectorAll('#swiper-container-cover img.imgbox, #swiper-container-cover .swiper-slide img').forEach((im) => add(im, 'top'));
    d.querySelectorAll('#usedDecription img').forEach((im) => add(im, 'desc'));
    return out;
  }
  /* 📖 (10/26 정범님 '미리보기는 제품 이미지와 별개') 알라딘 '미리보기'(letslook — 새상품 책의 처음 몇 쪽 샘플 사진 · 같은 책이면 모든 매물이 같음)는 우리 '제품 사진'이 아님
   *  isPreviewPhoto(p): 사진 한 장이 미리보기인가 — 주소에 /letslook/ 이 있거나 kind:'preview' · 예전(10/26 전) 사진 받기가 photos[]에 넣어 둔 것도 이것으로 가려냄(기록은 지우지 않고 읽는 쪽이 뺌)
   *  pvPageNo(src): 파일 이름 끝 _t12 → 12 (쪽 차례) · parseUsedItemPreviews(d): 우리 매물 화면 위쪽 사진 칸에서 미리보기만 (쪽 차례대로)
   *  previewsFromPhotos(photos, at): 예전 photos[] 안의 미리보기 → 미리보기 칸(previews) 모양 [{src, file, stored, thumb, bytes, n, at, from:'photos'}] · productPhotos(photos): 미리보기를 뺀 제품 사진만
   *  previewsOf(l): 상품 기록의 미리보기 — previews 칸이 있으면 그것, 없으면 photos[] 안에서 가려냄 */
  const PV_RX = /\/letslook\//i;
  function isPreviewPhoto(p) { return !!(p && (p.kind === 'preview' || PV_RX.test(String(p.src || '')) || PV_RX.test(String(p.big || '')))); }
  function pvPageNo(src) { const m = String(src || '').split('?')[0].split('/').pop().match(/_t(\d+)\.[a-z]+$/i); return m ? +m[1] : null; }
  function pvSort(L) { return L.map((x, i) => ({ x, i })).sort((a, b) => ((a.x.n ?? 1e6 + a.i) - (b.x.n ?? 1e6 + b.i)) || a.i - b.i).map((o) => o.x); }
  function parseUsedItemPreviews(d) { const out = []; const seen = new Set();
    const add = (img) => { const src = img && (img.getAttribute('src') || img.getAttribute('data-src') || ''); if (!src || !PV_RX.test(src)) return; const file = src.split('?')[0].split('/').pop(); if (!file || seen.has(file)) return; seen.add(file); const abs = /^\/\//.test(src) ? 'https:' + src : src; out.push({ src: abs, file, n: pvPageNo(abs) }); };
    const main = d.getElementById ? d.getElementById('CoverMainImage') : null; if (main) add(main);
    d.querySelectorAll('#swiper-container-cover img.imgbox, #swiper-container-cover .swiper-slide img, #swiper-container-cover img').forEach(add);
    return pvSort(out); }
  function previewsFromPhotos(photos, at) { if (!Array.isArray(photos)) return []; const out = [];
    photos.forEach((x) => { if (!isPreviewPhoto(x)) return; const src = x.src || null; out.push({ src, file: x.file || (src ? String(src).split('?')[0].split('/').pop() : null), stored: x.stored || null, thumb: x.thumb || null, bytes: x.bytes ?? null, n: pvPageNo(src), at: at || null, from: 'photos', ...(x.error ? { error: x.error } : {}) }); });
    return pvSort(out); }
  /* 📷 (10/27 정범님 '이번엔 확실히 구분해서 제품 사진만(!!!)') 제품 사진 판정 — 같은 기준은 여기 한 곳(수집기 '📷 제품 사진 다시 받기'·웹앱 상품 상세·출고 카드·클라우드가 모두 이것만 씀)
   *  photoKind(p, where) → 'product'(판매자가 올린 제품 사진) | 'preview'(알라딘 미리보기 letslook) | 'cover'(알라딘 표지·상품 그림 — 같은 책 공용) | 'px'(🔬 조회수 실험 1×1 그림) | 'icon'(알라딘 화면 꾸밈 그림) | 'other'(다른 매물 사진·알 수 없음)
   *  허용 목록(위쪽 사진 칸 · 우리 매물 화면 #CoverMainImage·표지 넘김):
   *   ① 파일 이름이 scm+숫자(예: scm996008826671.jpg) — 샵매니저 '대표·추가 사진' 올리기(/scm/upload/imgUpPopup.aspx)가 칸 mainCover에 돌려주는 이름이 'scm{판매자번호}{번호}.jpg'(수집기 1.52.0 사진 올리기)이고,
   *      알라딘 검색 결과에서 우리 가게 매물 그림 주소를 'scm996008'으로 가려 온 규칙(parseSearchResults·벤치마킹 · 우리 매물은 경쟁에서 뺌)과 같은 근거 · 판매자 번호는 가리지 않음(다른 판매자 사진도 그 판매자의 제품 사진)
   *   ② 주소 경로에 /usedshop/ (샵매니저 사진 올리기 응답의 그림 주소 image.aladin.co.kr/usedshop/…)
   *   → 위 둘이 아니면 위쪽 칸 그림은 제품 사진이 아님(알라딘 표지 /product/{n}/{n}/cover…/ · 미리보기 /letslook/ · 그 밖 모두)
   *  유의 사항 안(#usedDecription · where 'desc') 그림 = 판매자가 글에 넣은 그림 → 빼는 목록(미리보기·조회수 실험·꾸밈 그림·알라딘 표지·알라딘 화면 그림 /img/)에 안 걸리면 제품 사진
   *   (편집기 사진 올리기 /scm/upload/wimage_upload_scm.aspx 가 돌려주는 주소 꼴은 실제 화면으로 확인 전 — 그래서 유의 사항 칸은 빼는 목록 방식)
   *  where 'search'(예전 사진 받기가 '상품명 검색'으로 다른 매물에서 가져온 사진) = 우리 제품 사진 아님 */
  const PP_V = 2;
  const PP_FILE = (s) => String(s || '').split('?')[0].split('#')[0].split('/').pop();
  function photoKind(p, where) { const o = typeof p === 'string' ? { src: p } : p || {}; const w = where || o.where || '';
    const s = String(o.src || ''), b = String(o.big || ''); if (o.kind === 'preview' || PV_RX.test(s) || PV_RX.test(b)) return 'preview';
    const u = s || b; if (!u) return 'other'; const path = u.split('?')[0].split('#')[0]; const f = PP_FILE(path);
    if (/\/px\/\d+\.gif$/i.test(path)) return 'px';
    if (/icon|btn|blank|noimg|spacer/i.test(f)) return 'icon';
    if (w === 'search') return 'other';
    if (/^scm\d{3,}[^/]*\.(jpe?g|png|gif|webp)$/i.test(f) || /\/usedshop\//i.test(path)) return 'product';
    if (/\/product\/\d+\/\d+\//i.test(path) || /\/(cover|coversum|cover\d{2,3}|cover_[a-z0-9]+)\/[^/]+$/i.test(path)) return 'cover';
    if (/(^|\/\/)[^/]*aladin\.co\.kr\/img\//i.test(path)) return 'icon';
    if (w === 'desc') return 'product';
    return 'other'; }
  function isProductPhoto(p, where) { return photoKind(p, where) === 'product'; }
  /* 우리(판매자) 매물 공개 화면에서 제품 사진만 — 표지·미리보기·조회수 실험·꾸밈은 받지도 저장하지도 않음 */
  function parseUsedItemProductPhotos(d) { return parseUsedItemPhotos(d).filter((x) => isProductPhoto(x)); }
  /* 상품 기록 한 건의 제품 사진 — productPhotos 칸(📷 다시 받기 · 판정 v2)이 있으면 그것만 · 없으면 예전 photos[]를 판정으로 거른 것('상품명 검색'으로 다른 매물에서 가져온 기록은 없음) */
  function productPhotosOf(l) { if (!l) return []; if (Array.isArray(l.productPhotos)) return l.productPhotos.filter(Boolean); if (l.photosFrom === 'search') return []; return Array.isArray(l.photos) ? l.photos.filter((x) => x && isProductPhoto(x)) : []; }
  /* 예전 이름 — 미리보기만 빼던 것 → (10/27) 제품 사진 판정으로 */
  function productPhotos(photos) { return Array.isArray(photos) ? photos.filter((x) => x && isProductPhoto(x)) : []; }
  function previewsOf(l) { if (!l) return []; if (Array.isArray(l.previews) && l.previews.length) return l.previews; return previewsFromPhotos(l.photos, l.photosAt); }
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
  /* (0.15.1) 샵매니저 상품 수정 화면(/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=매물번호 · 로그인)의 구매 유의 사항 = textarea#bookDesc(HTML) — 2026-10-17 실제 화면에서 확인
   *  공개 상품 화면은 주문이 들어온 동안 '비공개'가 되거나 유의 사항 칸이 안 보일 수 있어, 우리 매물은 이 화면이 확실한 출처 · 글은 공개 화면(#usedDecription)과 같은 방식(txtBr)으로 꺼냄 */
  function parseScmEditNote(d) { const ta = d.getElementById ? d.getElementById('bookDesc') : null; if (!ta) return { found: false }; const html = ta.value != null && ta.value !== '' ? ta.value : ta.textContent || ''; const box = d.createElement('div'); box.innerHTML = html; const note = txtBr(box);
    const photos = [...box.querySelectorAll('img')].map((im) => { const src = im.getAttribute('src') || ''; const abs = /^\/\//.test(src) ? 'https:' + src : src; return { src: abs, big: null, where: 'desc', file: String(abs).split('?')[0].split('/').pop() }; }).filter((x) => x.src);
    return { found: true, note, hasNote: !!(note && note.replace(/\s/g, '').length), photos, src: 'scm' }; }
  function parseUsedItemInfo(d, newCoverFile) {
    const box = d.getElementById ? d.getElementById('usedDecription') : null;
    const note = box ? txtBr(box) : '';
    const photos = parseUsedItemPhotos(d);
    const baseOf = (f) => String(f || '').split('?')[0].split('/').pop().replace(/\(\d+\)(?=\.)/, '');
    const nc = newCoverFile ? baseOf(newCoverFile) : null;
    photos.forEach((p) => { p.kind = photoKind(p); }); /* (10/27) 사진마다 판정 결과(제품·표지·…)를 함께 — 읽는 쪽은 isProductPhoto로 다시 봐도 같음 */
    const sellerPhotos = photos.filter((p) => p.kind === 'product'); /* (10/27) 판매자 사진 = 제품 사진 판정(예전: 유의 사항 안 사진 + 새상품 표지 파일과 다른 위쪽 사진) */
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
    /* (0.16.0) 정범님 10/20: '매입불가 상품 내역' 표(번호·상품명·ISBN·불가사유 — 4칸)도 읽음 · 예전엔 5칸 줄만 읽어 매입 불가 책이 빠졌음 → 통계가 매입률을 부풀림 */
    const rejected = []; d.querySelectorAll('table').forEach((tb) => { const cap = txt(tb.querySelector('caption')); const ttl = (() => { let p = tb.closest('div'); for (let k = 0; k < 4 && p; k++) { const pv = p.previousElementSibling; const t0 = pv ? txt(pv) : ''; if (/매입\s*불가\s*상품\s*내역|매입\s*상품\s*내역/.test(t0)) return t0; p = p.parentElement; } return ''; })();
      if (!/매입\s*불가/.test(cap) && !/^매입\s*불가\s*상품\s*내역/.test(ttl)) return;
      tb.querySelectorAll('tr').forEach((tr) => { const c = [...tr.children].map(txt); if (c.length < 4 || !/^\d+$/.test(c[0])) return; const ids = String(c[2] || '').replace(/\s/g, ''); const i13 = (ids.match(/^(97[89]\d{10})/) || [])[1] || null; const rest = i13 ? ids.slice(13) : ids;
        rejected.push({ no: +c[0], title: c[1], isbn13: i13, isbn10: i13 ? (rest.match(/^[\dX]{10}/) || [])[0] || null : null, code: (ids.match(/K\d+/) || [])[0] || null, req: null, reqPrice: null, reqGrade: null, buy: c[3] || null, buyPrice: null, result: 'rejected', reason: c[3] || null, sec: 'rej' }); }); });
    rejected.forEach((r) => items.push(r));
    const tot = (head['판매금액'] || '').match(/총\s*(\d+)\s*권,\s*([\d,]+)\s*원/);
    return { head, items, date: head['신청일'] || null, type: head['판매타입'] || null, shipDate: head['발송일'] || null, doneDate: head['매입완료일'] || null, status: head['상태'] || head['신청 상태'] || head['신청상태'] || null, settle: head['정산방법'] || null, discardPolicy: head['매입불가처리'] || null, buyer: head['매입처'] || null, reqN: tot ? +tot[1] : items.length, reqAmount: tot ? +tot[2].replace(/,/g, '') : null, nRejected: rejected.length, rejV: 1 };
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
  /* (0.19.9 shopmisc1 · 정범님 11/14 18:13 「책은 '권' · 다른 상품은 '개' 혹은 그 상품의 고유 단위」) 📏 상품 단위 — 한 곳
   *  책·잡지 '권' · 책 세트(제목으로 알아본 강한 세트) '세트' · 디스크(CD·LP·DVD·블루레이) '장' · 테이프(VHS·카세트)·굿즈·그 밖 '개'
   *  같은 표가 cloud/shop-cat.js(우리숍 서버)·shop/shop-core.js(손님 화면)에 있음 — 시험 tUNIT1114가 셋이 같은 답인지 봄
   *  x = 상품 줄(title·mediaType·categories·ids) 또는 제목 글 · 모르면 '권'(예전과 같음) */
  const UNIT = { book: '권', set: '세트', disc: '장', item: '개' };
  const RE_TAPE = /^\s*(?:\[[^\]]*\]\s*)*\[(?:VHS|비디오|카세트|cassette|테이프)|\bVHS\b|비디오\s*테이프|카세트\s*테이프|\bcassette\b/i;
  function unitKind(x) { if (x == null || x === '') return 'book'; if (typeof x === 'string') x = { title: x }; const t = String(x.title || x.titleRaw || x.t || '');
    const mt = x.mediaType || mediaType(x).type;
    if (mt === 'video' || mt === 'music') return RE_TAPE.test(t) ? 'item' : 'disc'; if (mt === 'other') return 'item';
    const s = setInfo(t); return s.set && s.level === 'strong' ? 'set' : 'book'; }
  const unitOf = (x) => UNIT[unitKind(x)];
  const qtyTxt = (n, x) => `${(+n || 0).toLocaleString('ko-KR')}${unitOf(x)}`;
  /* 여러 상품 합 — 단위가 하나면 'N권' · 섞이면 '3권 · 1장 · 1세트'(권 → 세트 → 장 → 개 차례) · L = [[상품, 수]] */
  function qtyMix(L) { const m = { book: 0, set: 0, disc: 0, item: 0 }; for (const [x, n] of L || []) m[unitKind(x)] += +n || 0; const P = Object.keys(m).filter((k) => m[k]); if (!P.length) return '0권'; return P.map((k) => m[k].toLocaleString('ko-KR') + UNIT[k]).join(' · '); }


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
  const PACER_DEFAULTS = { minMs: 700, startMs: 1200, maxMs: 20000, upEvery: 20, upMul: 0.9, failMul: 2, loginMul: 3, tooManyMul: 4, floor429Ms: 2000, floor429Min: 30 };
  // 429 = 알라딘이 '요청이 너무 많다'고 거절 → 간격 4배 + 이 PC의 모든 탭·스크립트가 함께 쉼(1분, 거듭되면 2·3…10분). 성공이 쌓이면 다시 빨라짐
  /* (정범님 11/05 '그렇게 해' — 11/04 매일 정밀 점검 제안 ④-5) 429 뒤 floor429Min분(기본 30) 동안은 간격 바닥을 floor429Ms(기본 2초)로 올려 둠
   *  예전: 성공 20번마다 10%씩 빨라져 9분이면 바닥(0.7초)으로 돌아왔음(11/04 14시 429 뒤 4,417쪽 vs 13시 4,822쪽) → 다시 429·503으로 번질 위험
   *  흩음(0.85~1.15배) 뒤에도 바닥 아래로 내려가지 않음 · 쉬는 동안 새 429가 오면 그때부터 다시 floor429Min분 · 0이면 끔
   *  로그인 자체(로그인 탭 열기·로그인 확인)는 이 속도 조절기를 거치지 않으므로 늦어지지 않음 · 근거: 정밀 점검 제안·정범님 결정 — 숫자는 설정(prd_system/settings floor429Ms·floor429Min)으로 바꿈 */
  const floorOf = (c, x, now) => (x && +x.floorUntil > now && +c.floor429Ms > 0 ? Math.max(c.minMs, Math.min(c.maxMs, +c.floor429Ms)) : c.minMs);
  function makePacer(key) {
    const LSx = (() => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } })();
    const K = 'rnPacer:' + key; const mem = {};
    const rd = (k) => { try { return LSx ? JSON.parse(LSx.getItem(k) || 'null') : mem[k] || null; } catch (e) { return null; } };
    const wr = (k, v) => { try { if (LSx) LSx.setItem(k, JSON.stringify(v)); else mem[k] = v; } catch (e) {} };
    const cfg = () => ({ ...PACER_DEFAULTS, ...(rd('rnPacer:cfg') || {}) });
    const st = () => { const c = cfg(); const x = rd(K) || {}; if (!(x.gap > 0)) x.gap = c.startMs; x.gap = Math.min(c.maxMs, Math.max(floorOf(c, x, Date.now()), x.gap)); return x; };
    return {
      /* (0.15.2) prio = 사람이 기다리는 조회(등록 조회·사진 가격) — 간격(막히지 않게)은 그대로 지키되 다음 차례를 먼저 받음
       *  예전: 같은 PC에서 자동 수집(전체 재검토 등)이 계속 돌면 조회는 최대 4초씩 자다 깨는 사이 매번 자리를 빼앗겨 두 화면 읽기에 2분 43초(10/17 HOME)
       *  이제: 조회가 '기다리는 중' 표시(prioAt)를 남기고 짧게(0.15초) 깨어 바로 받음 · 다른 요청은 그 표시가 5초 안이면 양보 */
      async wait(sleep, mult = 1, prio = false) { for (;;) { const x = st(); const now = Date.now(); const cool = (x.coolUntil || 0) - now; if (cool > 0) { await sleep(Math.min(cool, prio ? 1000 : 4000)); continue; }
          if (!prio && x.prioAt && now - x.prioAt < 5000) { await sleep(300); continue; } if (prio && (!x.prioAt || now - x.prioAt > 1000)) { x.prioAt = now; wr(K, x); }
          const gap = Math.max(+x.floorUntil > now ? floorOf(cfg(), x, now) : 0, x.gap * (mult || 1) * (0.85 + Math.random() * 0.3)); const w = (x.last || 0) + gap - now; if (w > 0) { await sleep(Math.min(w, prio ? 150 : 4000)); continue; } x.last = now; if (prio) x.prioAt = 0; wr(K, x); return; } },
      ok() { const c = cfg(); const x = st(); x.ok = (x.ok || 0) + 1; if (x.ok >= c.upEvery) { x.gap = Math.max(floorOf(c, x, Date.now()), Math.round(x.gap * c.upMul)); x.ok = 0; x.n429 = 0; } wr(K, x); },
      fail(kind) { const c = cfg(); const x = st(); x.ok = 0; x.gap = Math.min(c.maxMs, Math.round(x.gap * (kind === '429' ? c.tooManyMul : kind === 'login' ? c.loginMul : c.failMul))); x.failAt = Date.now(); x.failKind = kind || 'error';
        if (kind === '429') { x.n429 = (x.n429 || 0) + 1; x.coolUntil = Date.now() + Math.min(10, x.n429) * 60000; if (+c.floor429Min > 0) x.floorUntil = Date.now() + +c.floor429Min * 60000; } wr(K, x); },
      /* 429 뒤 바닥이 올라가 있는 남은 시간(ms) · 그때 바닥(ms) — 화면·기록용 */
      floor() { const c = cfg(); const x = st(); const now = Date.now(); const left = Math.max(0, (+x.floorUntil || 0) - now); return { left, ms: left > 0 ? floorOf(c, x, now) : c.minMs }; },
      cooling() { const x = st(); return Math.max(0, (x.coolUntil || 0) - Date.now()); },
      state() { return { ...st(), cfg: cfg() }; },
      kindOf(status) { return status === 429 || status === 503 ? '429' : 'error'; },
      setCfg(o) { const c = { ...cfg(), ...o }; const n = (v, d) => (Number.isFinite(+v) && +v >= 0 ? +v : d); wr('rnPacer:cfg', { minMs: c.minMs, startMs: c.startMs, maxMs: c.maxMs, floor429Ms: n(c.floor429Ms, PACER_DEFAULTS.floor429Ms), floor429Min: n(c.floor429Min, PACER_DEFAULTS.floor429Min) }); },
    };
  }

  /* (정범님 10/26) 📝 출고 시장 블록에서 유의 사항을 읽어 보여 줄 다른 판매자 매물 — 클라우드(읽기)·웹앱(표시)이 같은 기준을 씀
   *  rows = 시장 블록 줄({ r, g, p, lid, c, sc, n, so } — 클라우드 marketOf·웹앱 page1FromRows 모양) · me = { g, p } 우리 주문 등급·판매가
   *  · '중' 등급 = 첫 페이지(20줄) 전부 — 우리 판매가에 가까운 것부터
   *  · '상' 등급 = 우리 판매가 바로 아래(같거나 싼 쪽 가장 비싼 것) · 바로 위(비싼 쪽 가장 싼 것) 한 줄씩 — 우리 판매가를 모르면 없음
   *  · 우리 줄(북스킹)·판매 끝난 줄·매물 번호 없는 줄은 뺌 · 돌려주는 차례 = 읽는 차례('중' 먼저) */
  function peerNoteTargets(rows, me) {
    const myP = me && +me.p > 0 ? +me.p : null;
    const L = (rows || []).slice(0, 20).filter((r) => r && r.lid && !r.so && r.c !== 'ours' && String(r.sc || '') !== '996008');
    const dist = (r) => (myP == null ? +r.r || 0 : Math.abs((+r.p || 0) - myP));
    const mid = L.filter((r) => r.g === '중').sort((a, b) => dist(a) - dist(b));
    /* (정범님 10/26 23:30) '상'은 유효 판매가(짙은 초록·초록 판매자 + 알라딘측 — 판매자 분류를 모르는 줄은 넣음) 가운데 우리 판매가 아래(같음 포함) 가까운 2개 + 위 가까운 2개 = 4개 */
    const VAL = new Set(['dkgreen', 'green', 'aladin']); const valid = (r) => r.c == null || r.c === '' || VAL.has(r.c);
    const sang = myP == null ? [] : L.filter((r) => r.g === '상' && valid(r) && +r.p > 0);
    const lows = sang.filter((r) => +r.p <= myP).sort((a, b) => +b.p - +a.p).slice(0, 2); const highs = sang.filter((r) => +r.p > myP).sort((a, b) => +a.p - +b.p).slice(0, 2);
    const out = [], seen = new Set();
    const add = (r, why) => { const k = String(r.lid); if (seen.has(k)) return; seen.add(k); out.push({ lid: k, g: r.g || null, p: r.p ?? null, sc: r.sc || null, n: r.n || null, why }); };
    mid.forEach((r) => add(r, 'mid')); lows.forEach((r) => add(r, 'sangLo')); highs.forEach((r) => add(r, 'sangHi'));
    return out;
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
    VERSION, parseDate, splitTitle, classifyCode, collectIds, isbn10Valid, ean13Valid, isbn10to13, isbnNorm, isbnFromCover, isbnFromPage,
    KEY_SCHEMES, lookupKeys, newBookId,
    tableToRows, parseRegExportRows, parseSoldRows, parseScmList, parseProductPage, parseUsedPage,
    parseBuyerDist, parseRelationBuy, parseClickRelation, parseUsedItemPhotos, parseSearchResults, parseScmSearch, scmSearch, scmSmart, aladinQ, aladinQTries, resolveItemId, isbnN, smHit, smTok, searchChannels, marketNoBook, nameCoverage, newBookJudge, newBookPick, setInfo, isUnregistered, searchQueryOf, sameVolume, parseC2BList, parseC2BDetail, usedSearchRows, ED_KW, ED_TBL, ED_ALL, ED_GRP, ED_DEF, edKwOf, edBrOf, edBrxOf, edBrKind, edSuspect, edNoteKw, edSim, edMatch, edDecide, edIdSig, edDiff, edDiffEv, edSplit, edSplitEv, edAddEv, edSigCfg, ED_SIG_DEF, edEvOf, ED_EVV, edCands, edCodeOf, edOurCode, volInfo, diff, rankTransitions, listingKey, listingsDiff, mediaType, MEDIA, UNIT, unitKind, unitOf, qtyTxt, qtyMix,
    parseUsedItemInfo, parseUsedItemPreviews, isPreviewPhoto, pvPageNo, previewsFromPhotos, productPhotos, previewsOf, PP_V, photoKind, isProductPhoto, parseUsedItemProductPhotos, productPhotosOf, parseScmEditNote, parseUsedItemPrice, parseC2BSearch, parseC2BCart, makePacer, PACER_DEFAULTS, parseYes24Search, pickYes24Hub, parseYes24Hub, parseYes24Shop, Y24_GRADE, SCM_STATUS, scmAction, parseAjaxResult, peerNoteTargets,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowProducts = api;
})(typeof window !== 'undefined' ? window : this);
