/* readnow-adapt-core.js — 🧬 수집 적응 엔진 (정범님 11/11 밤 · 약속 55 · 연구 N10)
 * 알라딘·예스24 공개 화면이 바뀌어도 수집이 멈추지 않게: 칸마다 '여러 길 추출'(선택자 · 문맥 글 · 구조 데이터 JSON-LD/meta · 정규식)을 두고
 * 서로 견줘 합의값 + 신뢰도를 냄 → 화면 구조 지문을 매일 견줘 바뀜 감지 → 깨진 길 표시 → 남은 길로 계속 → 값이 알려진 책으로 새 선택자 후보를 스스로 찾아 검증.
 * 순수 함수(Document → 데이터) · 저장·네트워크 없음 · 클라우드(퍼피티어 화면 안)·웹앱·Node 시험이 같이 씀. 수집기 머리(@require)는 바꾸지 않음 — 수집기는 이 파일을 싣지 않고,
 * 클라우드 매일 점검이 수집기와 같은 공용 파서(readnow-products-core parseProductPage 등)의 값을 이 엔진의 합의값과 견줘(guard) 운영 파서가 깨졌는지 알림.
 * 빈 값은 null. 사람용 글은 한국어.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.4'; // (0.1.4 adapt4) SP 묶음 4판 spBatchPlan3·spMultiLearn·spKeepDays·spKeepPerH · 지문 견줌 양쪽 시험 조각만 // (0.1.3 adapt3) 중고 최저가 요약 칸 · 중고 줄 수 두 번째 길 · 목록 지은이·출판사·출간 연월·재고·중고 표시 두 번째 길 · 제목 문맥 길 · 예스24 목록(같은 틀) · 훈련 화면(drill) · TTB 견줌 기준(공저·SP 0) · 편집자 추천 제목 꺾쇠 // (0.1.2 adapt2) reduce 없앰(알라딘 prototype.js) · 목록 SP · 전자책 값 · 외국책 정가 · 편집자 추천 // (0.1.1) 목록 화면 정가 길 — 할인율(10%)을 정가로 읽던 것 고침(진단 blist 정가 5·10) // (0.1.0) 첫 판 — 여러 길 추출·합의·지문·칸 건강·새 길 찾기·운영 파서 견줌·TTB 대체 견줌·목록 화면 주소 후보·SP 묶음 검색 계획

  /* ── 도움 함수 ── */
  const txt = (el) => (el ? String(el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '');
  /* 문맥 글 — 글 조각마다 띄어 붙임(textContent는 '4,210'과 '300쪽'을 '4,210300쪽'으로 붙여 숫자를 틀리게 읽음) · script·style 뺌 */
  const ttxt = (el) => { if (!el) return ''; const out = []; const walk = (n) => { if (n.nodeType === 3) { out.push(n.nodeValue); return; } if (n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11) return; const t = n.tagName; if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT' || t === 'TEMPLATE') return; for (let c = n.firstChild; c; c = c.nextSibling) walk(c); }; walk(el); return out.join(' ').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(); };
  /* (0.1.2 adapt2) 합 — 알라딘 화면은 옛 prototype.js를 실어 Array.prototype.reduce가 '배열 그대로/첫 값'을 돌려줌 → 화면 안에서 신뢰도가 모두 NaN(진단: 모든 칸 conf null → 점수 50점)
   *  그래서 이 파일은 reduce를 쓰지 않고 이 for 고리만 씀 */
  const sumOf = (L, f) => { let t = 0; for (let i = 0; i < L.length; i++) t += +f(L[i]) || 0; return t; };
  /* (0.1.3) 중고 요약 칸 글 '판매자 중고(12) 4,500원 · 알라딘 직접배송(0) -' → 수가 1 넘는 칸의 값 중 최저 */
  const usedMinOf = (t) => { const v = []; const re = /(중고|우주점|직접\s*배송|직배송|매장)[^()\d]{0,12}\(\s*(\d+)\s*\)[^\d(]{0,14}?([\d,]{3,})\s*원/g; let m; while ((m = re.exec(String(t || '')))) { if (+m[2] >= 1) { const x = +String(m[3]).replace(/,/g, ''); if (x > 0) v.push(x); } } return v.length ? Math.min(...v) : null; };
  const toInt = (s) => { if (s == null) return null; if (typeof s === 'number') return isFinite(s) ? Math.round(s) : null; const m = String(s).replace(/,/g, '').match(/-?\d+/); return m ? +m[0] : null; };
  const toNum = (s) => { if (s == null) return null; if (typeof s === 'number') return isFinite(s) ? s : null; const m = String(s).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return m ? +m[0] : null; };
  const isbn10to13 = (s) => { const d = String(s || '').replace(/[^0-9Xx]/g, ''); if (d.length !== 10) return null; const b = '978' + d.slice(0, 9); let t = 0; for (let i = 0; i < 12; i++) t += +b[i] * (i % 2 ? 3 : 1); return b + ((10 - (t % 10)) % 10); };
  const AVAIL = (s) => { const t = String(s == null ? '' : s); if (!t) return null; if (/Discontinued|절판/i.test(t)) return '절판'; if (/일시\s*품절/.test(t)) return '일시품절'; if (/OutOfStock|SoldOut|품절/i.test(t)) return '품절'; if (/InStock|PreOrder|onSale|판매\s*중|구매\s*가능/i.test(t)) return 'onSale'; return null; };
  const NORM = {
    int: (v) => { const n = toInt(v); return n == null || n < 0 ? null : n; },
    num: (v) => toNum(v),
    str: (v) => { const s = v == null ? '' : String(v).replace(/ /g, ' ').replace(/\s+/g, ' ').trim(); return s || null; },
    id: (v) => { const m = String(v == null ? '' : v).match(/\d{3,}/); return m ? m[0] : null; },
    isbn: (v) => { const s = String(v == null ? '' : v).replace(/[^0-9Xx]/g, '').toUpperCase(); if (/^97[89]\d{10}$/.test(s)) return s; if (s.length === 10) return isbn10to13(s); return null; },
    date: (v) => { const s = String(v == null ? '' : v); let m = s.match(/(\d{4})[-./년]\s*(\d{1,2})[-./월]\s*(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = s.match(/(\d{4})[-./년]\s*(\d{1,2})\s*월?/); return m ? `${m[1]}-${m[2].padStart(2, '0')}` : null; },
    avail: (v) => AVAIL(v),
  };
  const keyOf = (type, v) => (v == null ? null : type === 'str' ? String(v).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '') : String(v));
  /* 두 값이 같은 것으로 보나 — 글은 앞부분이 같으면(부제·꼬리 붙음) · 날짜는 앞 7자(달)가 같으면 · 숫자는 tol(몫) 안이면 */
  function same(type, a, b, tol) { if (a == null || b == null) return false; if (type === 'int' || type === 'num') { const x = +a, y = +b; if (!tol) return x === y; return Math.abs(x - y) <= Math.max(Math.abs(x), Math.abs(y)) * tol; }
    if (type === 'date') return String(a).slice(0, 7) === String(b).slice(0, 7) && (String(a).length < 10 || String(b).length < 10 || a === b);
    const ka = keyOf(type, a), kb = keyOf(type, b); if (ka === kb) return true; if (type === 'str' && Math.min(ka.length, kb.length) >= 4) return ka.startsWith(kb) || kb.startsWith(ka); return false; }

  /* ── 화면 읽기 맥락(한 번만 셈) ── */
  function ctxOf(doc, o) { o = o || {}; const C = { doc, url: o.url || '', _t: null, _ld: null, _h: null };
    C.$ = (s) => { try { return doc.querySelector(s); } catch (e) { return null; } };
    C.$$ = (s) => { try { return [...doc.querySelectorAll(s)]; } catch (e) { return []; } };
    C.text = () => (C._t != null ? C._t : (C._t = ttxt(doc.body || doc.documentElement || doc)));
    C.html = () => (C._h != null ? C._h : (C._h = o.html || (doc.documentElement ? doc.documentElement.outerHTML : '')));
    C.meta = (n) => { const m = C.$(`meta[property="${n}"]`) || C.$(`meta[name="${n}"]`) || C.$(`meta[itemprop="${n}"]`); return m ? m.getAttribute('content') : null; };
    C.ld = () => { if (C._ld) return C._ld; const L = []; C.$$('script[type="application/ld+json"]').forEach((s) => { try { const j = JSON.parse(s.textContent); (Array.isArray(j) ? j : j && j['@graph'] ? j['@graph'] : [j]).forEach((x) => x && L.push(x)); } catch (e) {} }); return (C._ld = L); };
    C.ldBook = () => C.ld().find((j) => { const t = [].concat(j['@type'] || []); return t.includes('Book') || t.includes('Product'); }) || null;
    C.rowAfter = (label, scope) => { const R = scope ? [...scope.querySelectorAll('th, dt, .Litem, .Litem_P')] : C.$$('th, dt, .Litem, .Litem_P'); const th = R.find((e) => txt(e) === label); if (!th) return null; return th.nextElementSibling || (th.parentElement && th.parentElement.querySelector('td, dd, .Ritem')); };
    C.re = (re, src) => { const m = String(src === 'html' ? C.html() : C.text()).match(re); return m ? m[1] : null; };
    return C; }
  const ldName = (x) => (x == null ? null : typeof x === 'string' ? x : Array.isArray(x) ? ldName(x[0]) : x.name || null);

  /* ── 화면 종류마다 칸과 길 ──
   *  path = { how: 'sel'|'ctx'|'ld'|'meta'|'re'|'learned', w: 무게, f(C) → 날 값 } · fp = 지문에 쓰는 선택자(있으면 그 길이 기대는 화면 조각)
   *  같은 칸의 길들은 서로 다른 화면 조각에 기대게 둠 — 한 조각이 바뀌어도 다른 길이 살아 있게 */
  const KINDS = {
    /* 알라딘 공개 상품 화면 /shop/wproduct.aspx?ItemId= */
    al_product: { label: '알라딘 상품 화면', fields: {
      itemId: { type: 'id', must: true, paths: [
        { how: 'sel', fp: 'link[rel="canonical"]', f: (C) => ((C.$('link[rel="canonical"]') || { getAttribute: () => '' }).getAttribute('href') || '').match(/ItemId=(\d+)/i)?.[1] || null },
        { how: 'meta', f: (C) => (String(C.meta('og:url') || '').match(/ItemId=(\d+)/i) || [])[1] || null },
        { how: 're', f: (C) => (String(C.url || '').match(/ItemId=(\d+)/i) || [])[1] || C.re(/name="ItemId"[^>]*value="(\d+)"/i, 'html') },
      ] },
      title: { type: 'str', must: true, paths: [
        { how: 'sel', fp: '.Ere_prod_titlewrap .Ere_bo_title', f: (C) => txt(C.$('.Ere_prod_titlewrap .Ere_bo_title')) },
        { how: 'meta', f: (C) => String(C.meta('og:title') || '').split(/\s[|:-]\s/)[0] },
        { how: 'ld', f: (C) => ldName(C.ldBook()) },
      ] },
      isbn13: { type: 'isbn', paths: [
        { how: 'sel', fp: '.conts_info_list1 li', f: (C) => { const li = C.$$('.conts_info_list1 li').find((x) => /ISBN/.test(txt(x))); return li ? txt(li).replace(/^.*ISBN\s*:?\s*/, '') : null; } },
        { how: 'meta', f: (C) => C.meta('books:isbn') },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && (b.isbn || (b.workExample && [].concat(b.workExample)[0] && [].concat(b.workExample)[0].isbn)); } },
        { how: 'ctx', f: (C) => C.re(/ISBN\s*:?\s*(97[89]\d{10})/) },
      ] },
      priceList: { type: 'int', range: [100, 3000000], paths: [
        { how: 'sel', fp: '.Ere_prod_Binfowrap .info_list li', f: (C) => { const li = C.$$('.Ere_prod_Binfowrap .info_list li').find((x) => txt(x.querySelector('.Litem, .Litem_P')) === '정가'); return li ? txt(li.querySelector('del')) || txt(li.querySelector('.Ritem')) : null; } },
        { how: 'ctx', f: (C) => C.re(/정가\s*:?\s*([\d,]+)\s*원/) },
        { how: 'meta', f: (C) => C.meta('books:price:amount') || C.meta('product:original_price:amount') },
      ] },
      priceSales: { type: 'int', range: [100, 3000000], paths: [
        { how: 'sel', fp: 'em[itemprop="price"]', f: (C) => txt(C.$('.Ere_prod_Binfowrap em[itemprop="price"]') || C.$('em[itemprop="price"]')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); const of = b && [].concat(b.offers || [])[0]; return of ? of.price : null; } },
        { how: 'ctx', f: (C) => C.re(/판매가\s*:?\s*([\d,]+)\s*원/) },
        { how: 'meta', f: (C) => C.meta('product:price:amount') },
      ] },
      salesPoint: { type: 'int', range: [0, 10000000], paths: [
        { how: 'sel', fp: '#wa_product_top1_wa_Top_Ranking_pnlRanking', f: (C) => { const b = C.$('#wa_product_top1_wa_Top_Ranking_pnlRanking'); if (!b) return null; const d = [...b.querySelectorAll('div, span, li')].reverse().find((x) => /Sales\s*Point/i.test(x.textContent || '') && x.querySelector('strong, b')); return d ? txt(d.querySelector('strong, b')) : null; } },
        { how: 'ctx', f: (C) => C.re(/Sales\s*Point\s*:?\s*([\d,]+)/i) },
        { how: 're', f: (C) => C.re(/Sales\s*Point[\s\S]{0,240}?<(?:strong|b)[^>]*>\s*([\d,]+)\s*</i, 'html') },
      ] },
      availability: { type: 'avail', paths: [
        { how: 'sel', fp: '.Ere_prod_Binfowrap', f: (C) => { const s = txt(C.$('.Ere_soldout_info')); if (s) return s; return C.$('.Ere_prod_Binfowrap em[itemprop="price"]') ? 'onSale' : null; } },
        { how: 'ld', f: (C) => { const b = C.ldBook(); const of = b && [].concat(b.offers || [])[0]; return of ? of.availability : null; } },
        { how: 'ctx', f: (C) => { const m = C.text().match(/(절판|일시\s*품절|품절)\s*(?:되었습니다|상품|입니다|된)/); return m ? m[1] : null; } },
      ] },
      pubDate: { type: 'date', paths: [
        { how: 'sel', fp: '.Ere_prod_titlewrap li.Ere_sub2_title', f: (C) => (txt(C.$('.Ere_prod_titlewrap li.Ere_sub2_title')).match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || null },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && (b.datePublished || (b.workExample && [].concat(b.workExample)[0] && [].concat(b.workExample)[0].datePublished)); } },
        { how: 'meta', f: (C) => C.meta('books:release_date') },
        { how: 'ctx', f: (C) => C.re(/\((?:지은이|글|저)\)[^|]{0,80}\|[^|]{0,60}\|\s*(\d{4}-\d{2}-\d{2})/) },
      ] },
      publisher: { type: 'str', paths: [
        { how: 'sel', fp: 'a[href*="PublisherSearch"]', f: (C) => txt(C.$('.Ere_prod_titlewrap a[href*="PublisherSearch"]') || C.$('a[href*="PublisherSearch"]')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && ldName(b.publisher); } },
      ] },
      author: { type: 'str', paths: [
        { how: 'sel', fp: 'a[href*="AuthorSearch"]', f: (C) => txt(C.$('.Ere_prod_titlewrap a[href*="AuthorSearch"]') || C.$('a[href*="AuthorSearch"]')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && ldName(b.author); } },
        { how: 'meta', f: (C) => C.meta('books:author') },
      ] },
      cid: { type: 'id', paths: [
        { how: 'sel', fp: '#ulCategory', f: (C) => { const L = C.$$('#ulCategory > li a[href*="CID="]'); const a = L[L.length - 1]; return a ? ((a.getAttribute('href') || '').match(/CID=(\d+)/) || [])[1] : null; } },
        { how: 're', f: (C) => { const m = [...String(C.html()).matchAll(/[?&]CID=(\d+)/gi)].map((x) => x[1]); return m.length ? m[m.length - 1] : null; } },
      ] },
      rating: { type: 'num', range: [0, 10], paths: [
        { how: 'sel', fp: 'a.Ere_sub_pink.Ere_fs16', f: (C) => txt(C.$('a.Ere_sub_pink.Ere_fs16')) },
        { how: 'meta', f: (C) => C.meta('books:rating:value') },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && b.aggregateRating ? b.aggregateRating.ratingValue : null; } },
      ] },
    } },
    /* 알라딘 전체 중고 화면 /shop/UsedShop/wuseditemall.aspx?ItemId=&TabType=0 */
    al_used: { label: '알라딘 전체 중고 화면', fields: {
      usedTotal: { type: 'int', must: true, range: [0, 100000], paths: [
        { how: 'sel', fp: '.Ere_usedsell_list2', f: (C) => { const a = C.$$('.Ere_usedsell_list2 a').find((x) => /^전체\s*중고/.test(txt(x))); return a ? (txt(a).match(/\((\d+)\)/) || [])[1] : null; } },
        { how: 'ctx', f: (C) => C.re(/전체\s*중고\s*\(\s*(\d+)\s*\)/) },
      ] },
      rows: { type: 'int', paths: [
        { how: 'sel', fp: '.Ere_usedsell_table tr', f: (C) => { const n = C.$$('.Ere_usedsell_table tr').filter((tr) => tr.querySelector('a[href*="ItemId="]')).length; return n || null; } },
        { how: 're', f: (C) => { const s = new Set([...String(C.html()).matchAll(/chkCart\.(\d+)/g)].map((m) => m[1])); return s.size || null; } },
        /* (0.1.3 adapt3) 11/11 진단: chkCart 길이 처음부터 0%(이 화면 줄엔 그 이름이 없음) → 합의 신뢰도 0.6 · 운영 파서(parseUsedPage)가 줄을 세는 칸 sell_tableCF2의 상품 번호 수(원문 HTML)를 두 번째 길로 */
        { how: 're', f: (C) => { const s = new Set([...String(C.html()).matchAll(/class="[^"]*sell_tableCF2[^"]*"[\s\S]{0,600}?ItemId=(\d+)/gi)].map((m) => m[1])); return s.size || null; } },
      ] },
      lowest: { type: 'int', range: [10, 3000000], paths: [
        /* (0.1.3 adapt3) 11/11 진단: 첫 쪽 줄 최저(sel)와 요약 칸 글(ctx)이 6권 중 1권만 같음(신뢰도 0.44) — 첫 쪽은 전체 중고의 일부라 '중고 최저가'가 아님 · 요약 칸 글은 모든 '원'을 다 셈
         *  → 중고 최저가 = 화면 위 요약 칸(판매자 중고(12) · 우주점(3) …)마다 적힌 최저가 중 가장 낮은 값(운영 파서 parseUsedPage.mins와 같은 칸 · 수가 0인 칸은 뺌) · 두 길 = 칸 구조(Litem/Ritem) · 글 꼴('이름(수) 값원') · 첫 쪽 최저는 pageLowest(점수 밖) */
        { how: 'sel', fp: '.Ere_prod_Binfowrap_used2 .info_list li', f: (C) => { const v = C.$$('.Ere_prod_Binfowrap_used2 .info_list li').map((li) => { const m = txt(li.querySelector('.Litem')).match(/\((\d+)\)\s*$/); if (!m || +m[1] < 1) return null; return toInt(txt(li.querySelector('.Ritem'))); }).filter((x) => x > 0); return v.length ? Math.min(...v) : null; } },
        { how: 'ctx', f: (C) => usedMinOf(ttxt(C.$('.Ere_prod_Binfowrap_used2') || C.doc.body || C.doc)) },
      ] },
      /* (0.1.3) 첫 쪽 줄 가운데 최저(예전 sel 길) — 점수 밖(opt) · 쪽 정렬에 따라 달라짐 */
      pageLowest: { type: 'int', opt: true, range: [10, 3000000], paths: [
        { how: 'sel', f: (C) => { const v = C.$$('.Ere_usedsell_table .price .Ere_fs20').map((e) => toInt(txt(e))).filter((x) => x > 0); return v.length ? Math.min(...v) : null; } },
      ] },
    } },
    /* 예스24 공개 상품 화면 /product/goods/번호 */
    y24_product: { label: '예스24 상품 화면', fields: {
      goodsNo: { type: 'id', must: true, paths: [
        { how: 'meta', f: (C) => (String(C.meta('og:url') || '').match(/goods\/(\d+)/) || [])[1] || null },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && b.sku; } },
        { how: 're', f: (C) => (String(C.url || '').match(/goods\/(\d+)/) || [])[1] || C.re(/goods\/(\d+)/, 'html') },
      ] },
      title: { type: 'str', must: true, paths: [
        { how: 'sel', fp: '.gd_name', f: (C) => txt(C.$('.gd_name')) },
        { how: 'meta', f: (C) => String(C.meta('og:title') || '').split(' | ')[0] },
        { how: 'ld', f: (C) => ldName(C.ldBook()) },
      ] },
      isbn13: { type: 'isbn', paths: [
        { how: 'sel', fp: 'th', f: (C) => txt(C.rowAfter('ISBN13')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && b.isbn; } },
        { how: 'ctx', f: (C) => C.re(/ISBN13\s*:?\s*(97[89]\d{10})/) },
      ] },
      priceList: { type: 'int', range: [100, 3000000], paths: [
        { how: 'sel', fp: 'th', f: (C) => txt(C.rowAfter('정가')) },
        { how: 'ctx', f: (C) => C.re(/정가\s*([\d,]+)\s*원/) },
      ] },
      priceSales: { type: 'int', range: [100, 3000000], paths: [
        { how: 'sel', fp: '.nor_price', f: (C) => txt(C.$('.nor_price em') || C.$('.nor_price')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); const of = b && [].concat(b.offers || [])[0]; return of ? of.price : null; } },
        { how: 'ctx', f: (C) => C.re(/판매가\s*([\d,]+)\s*원/) },
      ] },
      salesIndex: { type: 'int', range: [0, 100000000], paths: [
        { how: 'sel', fp: '.gd_sellNum', f: (C) => (txt(C.$('.gd_sellNum')).match(/([\d,]+)/) || [])[1] || null },
        { how: 'ctx', f: (C) => C.re(/판매지수\s*:?\s*([\d,]+)/) },
      ] },
      availability: { type: 'avail', paths: [
        { how: 'ld', f: (C) => { const b = C.ldBook(); const of = b && [].concat(b.offers || [])[0]; return of ? of.availability : null; } },
        { how: 'sel', fp: '.gd_infoTop', f: (C) => { const t = txt(C.$('.gd_infoTop')); const m = t.match(/(절판|일시\s*품절|품절)\s*(?:되었습니다|상품|입니다)/); if (m) return m[1]; return C.$$('a, button').some((e) => txt(e) === '바로구매') ? 'onSale' : null; } },
        { how: 'ctx', f: (C) => { const m = C.text().match(/(절판|일시\s*품절|품절)\s*(?:되었습니다|된 상품|상품입니다)/); return m ? m[1] : null; } },
      ] },
      pubDate: { type: 'date', paths: [
        { how: 'sel', fp: '.gd_date', f: (C) => txt(C.$('.gd_date')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && b.datePublished; } },
      ] },
      publisher: { type: 'str', paths: [
        { how: 'sel', fp: '.gd_pub', f: (C) => txt(C.$('.gd_pub')) },
        { how: 'ld', f: (C) => { const b = C.ldBook(); return b && ldName(b.publisher); } },
        { how: 'meta', f: (C) => (String(C.meta('og:title') || '').split(' | ')[2] || '').replace(/\s*-\s*예스24\s*$/, '') },
      ] },
    } },
  };

  /* 목록 화면(알라딘 검색 결과·베스트셀러·신간·판매자 숍) — 상자 하나 = 상품 하나. 상자 찾는 길도 여럿(못 찾으면 상품 링크로 상자를 스스로 묶음) */
  const LIST_BOX = [
    { how: 'sel', sel: '.ss_book_box' },
    { how: 'sel', sel: 'div[itemid]' },
    { how: 'sel', sel: '.ss_book_list' },
  ];
  /* (0.1.3) 목록 상자의 지은이 줄('가 (지은이), 나 (옮긴이) | 출판사 | 2013년 5월') → 마디 목록 · 없으면 null */
  const bylineOf = (b) => { for (const li of [b, ...b.querySelectorAll('li, div, p')]) { if (li === b && b.querySelector('li, div, p')) continue; if (li.querySelector('li, div, p')) continue; const t = ttxt(li); if (/\|/.test(t) && /(\d{4}\s*년|\d{4}-\d{2})/.test(t) && t.length < 300) return t.split('|').map((x) => x.trim()).filter(Boolean); } return null; };
  const LIST_FIELDS = {
    itemId: { type: 'id', must: true, paths: [
      { how: 'sel', f: (b) => b.getAttribute && b.getAttribute('itemid') },
      { how: 're', f: (b) => ((b.innerHTML || '').match(/wproduct\.aspx\?ItemId=(\d+)/i) || [])[1] || null },
    ] },
    title: { type: 'str', must: true, paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a.bo3')) },
      /* (0.1.3 adapt3) 11/11 진단 blist: 제목 신뢰도 0.33인 줄(가호·싯다르타) — '가장 긴 링크 글'이 다른 판·전자책 링크 글을 집었음 → 이 상자 상품 번호 링크 가운데 첫 글(값·전자책·보러 가기·중고 글 뺌) */
      { how: 'ctx', f: (b) => { const id = (b.getAttribute && b.getAttribute('itemid')) || ((b.innerHTML || '').match(/wproduct\.aspx\?ItemId=(\d+)/i) || [])[1] || null; const a = [...b.querySelectorAll('a[href*="wproduct.aspx"]')].filter((x) => !id || new RegExp('ItemId=' + id + '(?!\\d)', 'i').test(x.getAttribute('href') || '')).map((x) => txt(x)).filter((s) => s && !/^\d+$/.test(s) && !/보러\s*가기|미리\s*보기|[\d,]+\s*원|^\s*\[|전자책|장바구니/.test(s)); return a[0] || null; } },
    ] },
    priceSales: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.ss_p2 b') || b.querySelector('.ss_p2')) },
      { how: 'ctx', f: (b) => (ttxt(b).match(/[\d,]+\s*원\s*→\s*([\d,]+)\s*원/) || [])[1] || null },
    ] },
    priceList: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => { const t = [...b.querySelectorAll('span.ss_p, del, strike, s')].map((e) => txt(e)).find((x) => x && /원/.test(x) && +String(x).replace(/[^\d]/g, '') >= 100); if (t) return t; /* (0.1.2) 실제 목록: <span class="">18,000</span>원 → … — 숫자만 든 span 바로 뒤 글이 '원 →' */ const e = [...b.querySelectorAll('span')].find((x) => /^[\d,]{3,}$/.test(txt(x)) && /^\s*원\s*→/.test((x.nextSibling && x.nextSibling.nodeValue) || '')); return e ? txt(e) : null; } }, /* (0.1.1 rel4 진단) 첫 span.ss_p가 '(10%할인)'이면 10을 정가로 읽던 것 — '원'이 붙은 100 넘는 값만 */
      { how: 'ctx', f: (b) => (ttxt(b).match(/([\d,]+)\s*원\s*→/) || [])[1] || null },
    ] },
    salesPoint: { type: 'int', range: [0, 10000000], paths: [ /* (0.1.2 adapt2) 실제 검색·베스트셀러 목록은 '세일즈포인트 :<span class="sales_point"> 270</span>'(한글 · 2026-11-11 보관 원문) — 'Sales Point'만 찾아 목록 SP가 0%였음 */
      { how: 'sel', f: (b) => { const e = b.querySelector('.sales_point'); if (e) return txt(e); const li = [...b.querySelectorAll('li, span, div')].reverse().find((x) => /Sales\s*Point|세일즈\s*포인트/i.test(x.textContent || '') && x.querySelector('b, strong')); return li ? txt(li.querySelector('b, strong')) : null; } },
      { how: 'ctx', f: (b) => (ttxt(b).match(/(?:Sales\s*Point|세일즈\s*포인트)\s*:?\s*([\d,]+)/i) || [])[1] || null },
    ] },
    stock: { type: 'avail', paths: [
      /* (0.1.3 adapt3) 길이 하나뿐이라 신뢰도 0.7 → '품절/절판'으로 시작하는 작은 칸이 있으면 그 글 · 없고 장바구니·바로구매 단추(링크)가 있으면 판매 중 */
      { how: 'sel', f: (b) => { const btn = [...b.querySelectorAll('a, button, input[type="image"], img[alt]')].find((e) => /wbasket\.aspx|AddBook|Basket|cart/i.test((e.getAttribute('href') || '') + ' ' + (e.getAttribute('onclick') || '')) || /^(장바구니|바로\s*구매|장바구니\s*담기)$/.test(txt(e) || String(e.getAttribute('alt') || ''))); const e = [...b.querySelectorAll('span, em, strong, b, li, div')].find((x) => x.children.length === 0 && /^\s*\(?\s*(절판|품절|일시\s*품절)/.test(txt(x))); if (e) return txt(e); return btn ? 'onSale' : null; } },
      { how: 'ctx', f: (b) => { const t = ttxt(b); const m = t.match(/(절판|일시\s*품절|품절)(?=\s|\)|$|,|입니다|되었)/); if (m) return m[1]; return /[\d,]+\s*원/.test(t) && /장바구니|바로구매|cart/i.test((b.innerHTML || '')) ? 'onSale' : null; } },
    ] },
    author: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a[href*="AuthorSearch"]')) },
      /* (0.1.3 adapt3) 길이 하나뿐이라 신뢰도 0.7 → 지은이 줄 글('가나다 (지은이) | 시험출판 | 2013년 5월')의 첫 마디 · 첫 사람 */
      { how: 'ctx', f: (b) => { const P = bylineOf(b); if (!P) return null; const m = P[0].match(/^\s*(.+?)\s*\((?:지은이|글|저|지음|엮은이|편저|편|원작|그림|글·그림|옮긴이|기획|감수)\)/); return m ? m[1].split(/\s*,\s*/)[0] : null; } },
    ] },
    publisher: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a[href*="PublisherSearch"]')) },
      { how: 'ctx', f: (b) => { const P = bylineOf(b); if (!P || P.length < 2) return null; const k = P.findIndex((x) => NORM.date(x)); const v = k > 0 ? P[k - 1] : P[1]; return v && !/\((?:지은이|옮긴이|글|그림)\)/.test(v) ? v : null; } },
    ] },
    isbn13: { type: 'isbn', paths: [
      { how: 're', f: (b) => { const m = (b.innerHTML || '').match(/\/([0-9Xx]{10}|97[89]\d{10})_\d+\.(?:jpg|jpeg|gif|png)/); return m ? m[1] : null; } },
      /* (0.1.2) 장바구니 네모 이름 chkCart.<ISBN10> · 보관함 상자 isbn="…"(실제 검색 화면) — 표지 그림 이름이 ISBN이 아닐 때도 */
      { how: 'sel', f: (b) => { const c = b.querySelector('input[name^="chkCart."]'); const v = c ? String(c.getAttribute('name')).slice(8) : null; if (v && /^[0-9Xx]{10}$|^97[89]\d{10}$/.test(v)) return v; const e = b.querySelector('[isbn]'); return e ? e.getAttribute('isbn') : null; } },
    ] },
    /* (0.1.2) 표지 그림 이름(ISBN10·K코드 등) — 판매자 숍 상품(bench_items.coverKey)과 같은 책을 잇는 가장 센 열쇠 · 점수에는 안 셈(opt) */
    coverKey: { type: 'str', opt: true, paths: [
      { how: 're', f: (b) => { const im = b.querySelector('img.front_cover') || b.querySelector('img[src*="/cover"]'); const m = String((im && im.getAttribute('src')) || '').match(/\/([0-9A-Za-z]{8,13})_\d+\.(?:jpe?g|gif|png)/i); return m ? m[1] : null; } },
    ] },
    /* (0.1.2) 상품 갈래 [국내도서]·[외국도서]·[전자책]·[중고] — 전자책 줄을 새책으로 잇지 않게 */
    kind: { type: 'str', opt: true, paths: [
      { how: 'sel', f: (b) => (txt(b.querySelector('.tit_category')).match(/\[([^\]]+)\]/) || [])[1] || null },
    ] },
    /* (0.1.2 · 연구 8-6) 이 책의 전자책 값 — TTB가 주던 칸 중 하나 · 목록 한 쪽에서 함께 */
    ebookPrice: { type: 'int', opt: true, range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.ebook_price em')) || null },
      { how: 'ctx', f: (b) => (ttxt(b).match(/전자책\s*:?\s*([\d,]+)\s*원/) || [])[1] || null },
    ] },
    /* (adapt5 11/11) 이 줄에 전자책이 있다는 표시(점수 밖) — '전자책 값 채움 ÷ 전자책 있는 줄'로 TTB ebookList 대체를 판정(전엔 전자책 없는 책까지 분모라 47%에 멈춤) */
    ebookHas: { type: 'str', opt: true, paths: [
      { how: 'sel', f: (b) => (b.querySelector('.ebook_price, a.view_blue_btn[title*="보러"]') ? '1' : null) },
      { how: 'ctx', f: (b) => (/이\s*책의\s*전자책/.test(ttxt(b)) ? '1' : null) },
    ] },
    pubYm: { type: 'date', paths: [
      { how: 'sel', f: (b) => { const P = bylineOf(b); const x = P ? P.find((y) => /^\s*\d{4}\s*(?:년|-)/.test(y)) : null; return x ? NORM.date(x) : null; } }, /* (0.1.3) 지은이 줄의 날짜 마디 */
      { how: 'ctx', f: (b) => { const m = ttxt(b).match(/(\d{4})\s*년\s*(\d{1,2})\s*월/) || ttxt(b).match(/\|\s*(\d{4})-(\d{2})(?:-\d{2})?\s*(?:\||$)/); return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : null; } },
    ] },
    used: { type: 'str', paths: [
      { how: 'sel', f: (b) => { const t = txt(b.querySelector('.tit_category')); if (!t) return null; return /중고/.test(t) ? 'used' : /전자책|eBook/i.test(t) ? 'ebook' : /\[/.test(t) ? 'new' : null; } }, /* (0.1.3) 갈래 글만 보는 길 */
      { how: 'ctx', f: (b) => (/\[중고\]/.test(ttxt(b)) ? 'used' : /^\s*\[전자책\]/.test(txt(b.querySelector('.tit_category'))) ? 'ebook' : 'new') },
    ] },
  };

  /* ── (0.1.3 adapt3) 예스24 공개 검색 목록 — 알라딘 목록과 같은 틀(상자 길 여럿 · 칸마다 두 길 · 합의) ──
   *  상자 = #yesSchList > li .itemUnit(2026-11-08 보관 원문 search_used_goods · 새책 검색도 같은 목록 틀) · 판매지수(saleNum)는 새책 검색 줄에만 */
  const Y24_LIST_BOX = [
    { how: 'sel', sel: '#yesSchList > li' },
    { how: 'sel', sel: '.itemUnit' },
    { how: 'sel', sel: '[data-goods-no]' },
  ];
  const y24Id = (h) => (String(h || '').match(/(?:goods|Hub)\/(\d+)/i) || [])[1] || null;
  const Y24_LIST_FIELDS = {
    goodsNo: { type: 'id', must: true, paths: [
      { how: 'sel', f: (b) => { const a = b.querySelector('a.gd_name'); return a ? y24Id(a.getAttribute('href')) : (b.getAttribute && b.getAttribute('data-goods-no')) || null; } },
      { how: 're', f: (b) => ((b.innerHTML || '').match(/image\.yes24\.com\/goods\/(\d+)/i) || [])[1] || y24Id(((b.querySelector('a[href*="/goods/"], a[href*="/Hub/"]') || { getAttribute: () => '' }).getAttribute('href'))) },
    ] },
    title: { type: 'str', must: true, paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a.gd_name')) },
      { how: 'ctx', f: (b) => { const im = b.querySelector('img[alt]'); return im ? im.getAttribute('alt') : null; } },
    ] },
    author: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.info_auth a')) || null },
      { how: 'ctx', f: (b) => txt(b.querySelector('a[href*="authorNo="]')) || ((ttxt(b.querySelector('.info_pubGrp') || b).match(/^\s*(.+?)\s+(?:저|글|지음|편저|엮음|원작|그림|글그림)(?:\s|\/|$)/) || [])[1] || '').split(/\s*,\s*/)[0] || null },
    ] },
    publisher: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.info_pub')) || null },
      { how: 'ctx', f: (b) => { const L = [...b.querySelectorAll('a[href*="company="]')].map((x) => txt(x)).filter((t) => t && !/</.test(t)); return L[L.length - 1] || null; } },
    ] },
    pubYm: { type: 'date', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.info_date')) || null },
      { how: 'ctx', f: (b) => { const m = ttxt(b).match(/(\d{4})\s*년\s*(\d{1,2})\s*월/); return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : null; } },
    ] },
    priceSales: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.info_price .txt_num .yes_b') || b.querySelector('.info_price .yes_b')) || null },
      { how: 'ctx', f: (b) => (ttxt(b.querySelector('.info_price') ? b.querySelector('.info_price') : b).match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*원/) || [])[1] || null },
    ] },
    priceList: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.info_price .dash .yes_m') || b.querySelector('.info_price .yes_m') || b.querySelector('.info_price del')) || null },
    ] },
    salesIndex: { type: 'int', range: [0, 100000000], paths: [
      { how: 'sel', f: (b) => (txt(b.querySelector('.saleNum')).match(/([\d,]+)/) || [])[1] || null },
      { how: 'ctx', f: (b) => (ttxt(b).match(/판매지수\s*:?\s*([\d,]+)/) || [])[1] || null },
    ] },
    newPrice: { type: 'int', opt: true, range: [100, 3000000], paths: [
      { how: 'ctx', f: (b) => (ttxt(b).match(/새상품\s*:?\s*([\d,]+)\s*원/) || [])[1] || null },
    ] },
    used: { type: 'str', paths: [
      { how: 'sel', f: (b) => { const t = txt(b.querySelector('.gd_res')); return t ? (/중고/.test(t) ? 'used' : /eBook|전자책/i.test(t) ? 'ebook' : 'new') : null; } },
      { how: 'ctx', f: (b) => (/\[중고/.test(ttxt(b)) ? 'used' : /\[eBook|\[전자책/i.test(ttxt(b)) ? 'ebook' : 'new') },
    ] },
  };
  /* 목록 종류마다 상자 길 · 칸 · 상품 링크 꼴 · 상자 하나의 상품 번호 */
  const LISTK = {
    al_list: { label: '알라딘 목록 화면', box: LIST_BOX, fields: LIST_FIELDS, idField: 'itemId', linkSel: 'a[href*="wproduct.aspx?ItemId="], a[href*="wproduct.aspx?itemid="]', linkRe: /ItemId=(\d+)/i, linkReG: /wproduct\.aspx\?ItemId=(\d+)/gi, idOf: (b) => (b.getAttribute && b.getAttribute('itemid')) || ((b.innerHTML || '').match(/ItemId=(\d+)/i) || [])[1] },
    y24_list: { label: '예스24 검색 목록', box: Y24_LIST_BOX, fields: Y24_LIST_FIELDS, idField: 'goodsNo', linkSel: 'a[href*="/goods/"], a[href*="/Hub/"]', linkRe: /(?:goods|Hub)\/(\d+)/i, linkReG: /(?:goods|Hub)\/(\d+)/gi, idOf: (b) => ((b.innerHTML || '').match(/(?:goods|Hub)\/(\d+)/i) || [])[1] || (b.getAttribute && b.getAttribute('data-goods-no')) },
  };

  /* ── 합의 ── votes = [{how, w, v}] (v는 이미 맞춤 꼴) → { v, conf, n, of, hows, alt } */
  function vote(type, votes, of, tol) { const G = []; for (const x of votes) { if (x.v == null) continue; const g = G.find((y) => same(type, y.v, x.v, tol)); if (g) { g.w += x.w; g.hows.push(x.how); if (keyOf(type, x.v).length > keyOf(type, g.v).length && type === 'str') g.v = g.v; } else G.push({ v: x.v, w: x.w, hows: [x.how] }); }
    if (!G.length) return { v: null, conf: 0, n: 0, of: of || 0, hows: [], alt: [] };
    G.sort((a, b) => b.w - a.w); const tw = sumOf(G, (g) => g.w); const g = G[0]; const n = votes.filter((x) => x.v != null).length;
    const share = g.w / tw; const conf = Math.round(share * (g.hows.length >= 2 ? 1 : of > 1 ? 0.6 : 0.7) * 100) / 100;
    return { v: g.v, conf, n, of: of || n, hows: g.hows, alt: G.slice(1, 3).map((y) => ({ v: y.v, hows: y.hows })) }; }
  const TOL = { salesPoint: 0, salesIndex: 0 };
  const W_DEF = { sel: 1, ld: 1.1, meta: 0.9, ctx: 0.8, re: 0.7, learned: 1 };
  function pathsOf(kind, field, spec, learned) { const L = spec.paths.slice(); const add = (((learned || {})[kind] || {})[field] || []).filter((x) => x && x.st !== 'off');
    for (const x of add) L.push({ how: 'learned', sel: x.sel || null, re: x.re || null, f: (C) => { if (x.sel) { const e = C.$ ? C.$(x.sel) : x.sel && C.querySelector ? C.querySelector(x.sel) : null; const t = txt(e); if (!t) return null; if (x.re) { const m = t.match(new RegExp(x.re)); return m ? m[1] : null; } return t; } if (x.re) { const s = C.text ? C.text() : ttxt(C); const m = s.match(new RegExp(x.re)); return m ? m[1] : null; } return null; } });
    return L; }
  /* 한 화면에서 모든 칸 — opts: { url, learned, weights{how:무게}, only[칸] } */
  function extract(kind, doc, opts) { const o = opts || {}; const K = KINDS[kind]; if (!K || !doc) return null; const C = ctxOf(doc, o); const out = { kind, fields: {}, paths: {} };
    for (const [fd, spec] of Object.entries(K.fields)) { if (o.only && !o.only.includes(fd)) continue; const P = pathsOf(kind, fd, spec, o.learned); const votes = [];
      for (const p of P) { let raw = null; try { raw = p.f(C); } catch (e) { raw = null; } const v = NORM[spec.type](raw); const w = ((o.weights || {})[p.how] ?? W_DEF[p.how] ?? 1) * (p.w || 1); votes.push({ how: p.how, w, v }); }
      const r = vote(spec.type, votes, P.length, TOL[fd]); if (r.v != null && spec.range && (r.v < spec.range[0] || r.v > spec.range[1])) { r.outOfRange = true; r.conf = Math.round(r.conf * 0.3 * 100) / 100; }
      out.fields[fd] = r; out.paths[fd] = votes.map((x) => ({ how: x.how, v: x.v, ok: x.v != null && same(spec.type, x.v, r.v, TOL[fd]) })); }
    out.values = Object.fromEntries(Object.entries(out.fields).map(([k, r]) => [k, r.v])); out.conf = Object.fromEntries(Object.entries(out.fields).map(([k, r]) => [k, r.conf])); return out; }

  /* 목록 화면 — 상자 찾기(길 여럿 · 가장 많이 찾은 길) → 상자마다 칸 합의 · 상자를 못 찾으면 상품 링크로 묶음(auto) */
  function autoBoxes(doc, lk) { const K = lk || LISTK.al_list; const A = [...doc.querySelectorAll(K.linkSel)]; const seen = new Map();
    for (const a of A) { const id = ((a.getAttribute('href') || '').match(K.linkRe) || [])[1]; if (!id) continue; if (/view_blue_btn/.test(a.getAttribute('class') || '') || /^\s*보러\s*가기\s*$/.test(txt(a))) continue; /* (0.1.2) '이 책의 전자책 … 보러 가기'를 따로 상품으로 세던 것(베스트셀러 50권 → 74줄) */ let e = a; let best = null;
      for (let k = 0; k < 8 && e && e.parentElement; k++) { e = e.parentElement; const ids = new Set([...(e.innerHTML || '').matchAll(K.linkReG)].map((m) => m[1])); if (ids.size > 1) break; if (/[\d,]+\s*원/.test(e.textContent || '')) best = e; }
      if (best && !seen.has(id)) seen.set(id, best); }
    return [...new Set(seen.values())]; }
  function extractList(doc, opts) { const o = opts || {}; if (!doc) return null; const lk = LISTK[o.kind] || LISTK.al_list; const lkn = LISTK[o.kind] ? o.kind : 'al_list'; const tries = lk.box.concat(((o.learned || {})[lkn] || {})._box || []).map((b) => { let L = []; try { L = [...doc.querySelectorAll(b.sel)]; } catch (e) {} if (b.sel === '.ss_book_list') L = L.map((x) => x.closest('table') || x.parentElement || x); return { how: b.how || 'learned', sel: b.sel, L }; });
    tries.push({ how: 'auto', sel: '(상품 링크로 묶음)', L: autoBoxes(doc, lk) }); tries.forEach((t) => { t.n = new Set(t.L.map((b) => lk.idOf(b))).size; });
    const aut = tries[tries.length - 1]; const sels = tries.slice(0, -1).sort((a, b) => b.n - a.n); /* (0.1.2) 선택자 상자가 자동 묶음 수의 60% 넘으면 선택자 상자(상자 안에 표지·장바구니까지 다 들어 있음) — 자동 묶음은 상자를 잘게 쪼개 ISBN(표지)을 놓쳤음 */
    const best = sels[0] && sels[0].n >= 1 && sels[0].n >= aut.n * 0.6 ? sels[0] : aut.n ? aut : sels[0]; const boxes = { tried: tries.map((t) => ({ how: t.how, sel: t.sel, n: t.n })), use: best.n ? best.sel : null };
    const rows = []; const seen = new Set();
    for (const b of best.L) { const r = { _conf: {} }; for (const [fd, spec] of Object.entries(lk.fields)) { const P = spec.paths.concat((((o.learned || {})[lkn] || {})[fd] || []).map((x) => ({ how: 'learned', f: (bx) => { const e = x.sel ? bx.querySelector(x.sel) : bx; const t = txt(e); if (x.re) { const m = t.match(new RegExp(x.re)); return m ? m[1] : null; } return t || null; } })));
        const votes = P.map((p) => { let raw = null; try { raw = p.f(b); } catch (e) {} return { how: p.how, w: W_DEF[p.how] || 1, v: NORM[spec.type](raw) }; }); const v = vote(spec.type, votes, P.length, TOL[fd]); r[fd] = v.v; r._conf[fd] = v.conf; }
      const rid = r[lk.idField]; if (!rid || !r.title || seen.has(rid)) continue; seen.add(rid); if (o.withEls) Object.defineProperty(r, '_el', { value: b, enumerable: false }); rows.push(r); }
    if (o.withEls) Object.defineProperty(rows, 'els', { value: best.L, enumerable: false }); return { rows, boxes, fp: o.fp === false ? null : fingerprint(doc, lkn) }; }

  /* ── 화면 구조 지문 ── 칸 길이 기대는 조각(fp 선택자)이 있나 + 자주 쓰인 class 이름 묶음 → 서명 */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
  function fingerprint(doc, kind) { const marks = {}; const K = KINDS[kind]; const sels = K ? Object.values(K.fields).flatMap((f) => f.paths.map((p) => p.fp).filter(Boolean)) : (LISTK[kind] || LISTK.al_list).box.map((b) => b.sel);
    for (const s of [...new Set(sels)]) { let n = 0; try { n = doc.querySelectorAll(s).length; } catch (e) {} marks[s] = Math.min(n, 99); }
    const cnt = new Map(); const all = doc.querySelectorAll ? doc.querySelectorAll('[class]') : []; let k = 0; for (const e of all) { if (++k > 6000) break; for (const c of String(e.getAttribute('class') || '').split(/\s+/)) { if (!c || /\d{3,}/.test(c) || c.length > 40) continue; cnt.set(c, (cnt.get(c) || 0) + 1); } }
    const cls = [...cnt.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 40).map((x) => x[0]).sort(); const ldN = doc.querySelectorAll ? doc.querySelectorAll('script[type="application/ld+json"]').length : 0;
    return { kind, sig: hash(JSON.stringify([Object.entries(marks).map(([s, n]) => [s, n > 0 ? 1 : 0]), cls.slice(0, 30), ldN > 0])), marks, cls, ld: ldN }; }
  function fpCompare(a, b) { if (!a || !b) return { same: null, lost: [], gained: [], jacc: null, changed: false }; /* (adapt4 11/11) 양쪽이 모두 시험한 조각만 견줌 — 11/11 '중고 화면 구조 바뀜' 경고의 실체: 공용 파일 0.1.3이 중고 최저가 길을 요약 칸으로 옮기며 '.Ere_usedsell_table .price' 조각을 지문 목록에서 뺐을 뿐(클래스 겹침 1.0 · 그 조각은 첫 쪽 최저가 길로 여전히 읽힘) → 엔진 판이 바뀐 날 헛 경고 · 한쪽만 시험한 조각은 untested로 따로 */
    const am = a.marks || {}, bm = b.marks || {}; const both = (s) => Object.prototype.hasOwnProperty.call(am, s) && Object.prototype.hasOwnProperty.call(bm, s); const untested = [...Object.keys(am), ...Object.keys(bm)].filter((s) => !both(s));
    const lost = Object.keys(am).filter((s) => both(s) && (am[s] || 0) > 0 && !(bm[s] > 0)); const gained = Object.keys(bm).filter((s) => both(s) && (bm[s] || 0) > 0 && !(am[s] > 0));
    const A = new Set(a.cls || []), B = new Set(b.cls || []); const inter = [...A].filter((x) => B.has(x)).length; const jacc = A.size || B.size ? Math.round((inter / new Set([...A, ...B]).size) * 1000) / 1000 : 1;
    return { same: a.sig === b.sig, lost, gained, untested: [...new Set(untested)], jacc, ldLost: !!(a.ld && !b.ld), changed: a.sig !== b.sig && (lost.length > 0 || jacc < 0.7 || (a.ld && !b.ld)) }; }

  /* ── 칸 건강 ── results = 같은 종류 화면 여럿의 extract 결과 → 칸마다 채움률·합의율·범위 안 몫·길마다 채움률 */
  function healthOf(results, kind) { const R = (results || []).filter(Boolean); const K = KINDS[kind] || { fields: LIST_FIELDS }; const out = { kind, n: R.length, fields: {} };
    for (const [fd, spec] of Object.entries(K.fields)) { const F = R.map((r) => (r.fields ? r.fields[fd] : null)).filter(Boolean); if (!F.length) continue; const filled = F.filter((x) => x.v != null); const pf = {};
      R.forEach((r) => ((r.paths || {})[fd] || []).forEach((p) => { const z = (pf[p.how] = pf[p.how] || { n: 0, got: 0, ok: 0 }); z.n++; if (p.v != null) z.got++; if (p.ok) z.ok++; }));
      Object.values(pf).forEach((z) => { z.fill = z.n ? Math.round((z.got / z.n) * 1000) / 1000 : 0; z.agree = z.got ? Math.round((z.ok / z.got) * 1000) / 1000 : null; });
      out.fields[fd] = { fill: Math.round((filled.length / F.length) * 1000) / 1000, conf: filled.length ? Math.round((sumOf(filled, (x) => x.conf) / filled.length) * 1000) / 1000 : 0, agree: filled.length ? Math.round((filled.filter((x) => x.n >= 2 && x.hows.length === x.n).length / filled.length) * 1000) / 1000 : 0, inRange: filled.length ? Math.round((filled.filter((x) => !x.outOfRange).length / filled.length) * 1000) / 1000 : 1, must: !!spec.must, opt: !!spec.opt, paths: pf }; }
    const fs = Object.values(out.fields).filter((f) => !f.opt); out.score = fs.length ? Math.round((sumOf(fs, (f) => f.fill * (0.5 + 0.5 * (+f.conf || 0))) / fs.length) * 1000) / 1000 : 0; return out; }
  /* 목록 화면 건강 — 줄들의 칸 채움률(상자 길 이름 포함) */
  function healthOfList(lists, kind) { const lk = LISTK[kind] || LISTK.al_list; const L = (lists || []).filter(Boolean); const rows = L.flatMap((x) => x.rows || []); const out = { kind: LISTK[kind] ? kind : 'al_list', n: L.length, rows: rows.length, fields: {}, box: L.map((x) => x.boxes && x.boxes.use) };
    for (const [fd, spec] of Object.entries(lk.fields)) { if (!rows.length) { out.fields[fd] = { fill: 0, conf: 0, must: !!spec.must, opt: !!spec.opt }; continue; } const got = rows.filter((r) => r[fd] != null); out.fields[fd] = { fill: Math.round((got.length / rows.length) * 1000) / 1000, conf: got.length ? Math.round((sumOf(got, (r) => (r._conf || {})[fd] || 0) / got.length) * 1000) / 1000 : 0, must: !!spec.must, opt: !!spec.opt }; }
    const fs = Object.values(out.fields).filter((f) => !f.opt); out.score = fs.length ? Math.round((sumOf(fs, (f) => f.fill * (0.5 + 0.5 * (+f.conf || 0))) / fs.length) * 1000) / 1000 : 0; return out; }
  /* 오늘 vs 전날 → 칸마다 판정: broken(못 읽음) · drop(채움률 크게 떨어짐) · path(합의는 살았지만 길 하나가 죽음 — 새 길 찾기 시작) · range · ok */
  function healthJudge(today, prev, opt) { const o = { drop: 0.25, low: 0.5, pathDead: 0.2, pathWas: 0.8, ...(opt || {}) }; const out = { kind: today && today.kind, st: 'ok', fields: {}, broken: [], warn: [], deadPaths: [] }; if (!today) return out;
    for (const [fd, f] of Object.entries(today.fields || {})) { const p = prev && prev.fields ? prev.fields[fd] : null; let st = 'ok'; const why = [];
      if (f.fill < o.low && (f.must || (p && p.fill >= o.pathWas))) { st = 'broken'; why.push(`채움률 ${Math.round(f.fill * 100)}%${p ? ` (전날 ${Math.round(p.fill * 100)}%)` : ''}`); }
      else if (p && p.fill - f.fill > o.drop) { st = 'drop'; why.push(`채움률 ${Math.round(p.fill * 100)}% → ${Math.round(f.fill * 100)}%`); }
      else if (f.inRange != null && f.inRange < 0.9) { st = 'range'; why.push(`값 범위 밖 ${Math.round((1 - f.inRange) * 100)}%`); }
      for (const [h, z] of Object.entries(f.paths || {})) { const pz = p && p.paths ? p.paths[h] : null; if (pz && pz.fill >= o.pathWas && z.fill < o.pathDead) { out.deadPaths.push({ field: fd, how: h, was: pz.fill, now: z.fill }); if (st === 'ok') { st = 'path'; why.push(`길 '${h}'가 죽음(${Math.round(pz.fill * 100)}% → ${Math.round(z.fill * 100)}%) — 남은 길로 계속`); } } }
      out.fields[fd] = { st, why, fill: f.fill, prev: p ? p.fill : null }; if (st === 'broken') out.broken.push(fd); else if (st !== 'ok') out.warn.push(fd); }
    out.st = out.broken.length ? 'broken' : out.warn.length ? 'warn' : 'ok'; return out; }

  /* ── 새 길 찾기 ── 값을 아는 칸(known)이 화면 어디에 있는지 찾아 선택자·문맥 정규식 후보를 만듦 → 다른 견본으로 검증 */
  const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function cssPath(el, stop) { const parts = []; let e = el; for (let k = 0; k < 4 && e && e.nodeType === 1 && e !== stop; k++) { let s = e.tagName.toLowerCase(); const id = e.getAttribute('id'); if (id && !/\d{4,}/.test(id) && /^[A-Za-z][\w-]*$/.test(id)) { parts.unshift(s + '#' + id); break; } const cl = String(e.getAttribute('class') || '').split(/\s+/).filter((c) => c && !/\d{3,}/.test(c) && /^[A-Za-z_][\w-]*$/.test(c)).slice(0, 2); if (cl.length) s += '.' + cl.join('.'); parts.unshift(s); e = e.parentElement; } return parts.join(' > '); }
  function discover(doc, kind, field, known, opt) { const o = opt || {}; const spec = LISTK[kind] ? LISTK[kind].fields[field] : (KINDS[kind] || { fields: {} }).fields[field]; if (!spec || known == null || !doc) return [];
    const type = spec.type; const kv = NORM[type](known); if (kv == null) return []; const scope = o.scope || doc.body || doc.documentElement || doc; const out = []; const seen = new Set();
    const hit = (t) => { const v = NORM[type](t); return v != null && same(type, v, kv) && (type !== 'int' || String(t).replace(/,/g, '').includes(String(kv)) || String(t).includes(fmtInt(kv))); };
    const els = [...scope.querySelectorAll('*')].filter((e) => { const t = txt(e); return t && t.length <= (type === 'str' ? 240 : 60) && hit(t) && ![...e.children].some((c) => hit(txt(c))); }).slice(0, 20);
    for (const e of els) { const sel = cssPath(e, o.scope || null); if (!sel || seen.has(sel)) continue; seen.add(sel); let L = []; try { L = [...(o.scope || doc).querySelectorAll(sel)]; } catch (er) { continue; } const first = L[0]; const okFirst = first && hit(txt(first));
      if (okFirst) out.push({ sel, uniq: L.length === 1, score: Math.round(((L.length === 1 ? 1 : 0.6) * (/#/.test(sel) ? 1 : /\./.test(sel) ? 0.9 : 0.5) - sel.length / 1000) * 1000) / 1000 }); }
    /* 문맥 정규식: 값 바로 앞의 글자 낱말(숫자 아닌 2~8자) */
    if (type === 'int' || type === 'isbn') { const T = ttxt(scope); const vs = type === 'int' ? [fmtInt(kv), String(kv)] : [String(kv)]; for (const s of vs) { const i = T.indexOf(s); if (i < 0) continue; const pre = T.slice(Math.max(0, i - 14), i).replace(/[\d,.:]+\s*$/, '').match(/([^\d\s:|]{2,8})\s*:?\s*$/); if (pre) { const re = pre[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*([\\d,X]+)'; if (!out.some((x) => x.re === re)) out.push({ re, score: 0.7 }); } break; } }
    return out.sort((a, b) => b.score - a.score).slice(0, o.max || 6); }
  /* 후보 검증 — samples [{doc, known}] 모두에서 같은 값이면 통과 · 견본 2개 넘게 다 맞으면 '스스로 채택' 가능 */
  function verifyCand(kind, field, cand, samples) { const spec = LISTK[kind] ? LISTK[kind].fields[field] : (KINDS[kind] || { fields: {} }).fields[field]; if (!spec || !cand) return { n: 0, ok: 0, pass: false };
    let n = 0, ok = 0; const miss = []; for (const s of samples || []) { if (!s || !s.doc || s.known == null) continue; n++; let raw = null; try { if (cand.sel) { const e = (s.scope || s.doc).querySelector(cand.sel); raw = txt(e); if (cand.re && raw) { const m = raw.match(new RegExp(cand.re)); raw = m ? m[1] : null; } } else if (cand.re) { const m = ttxt(s.scope || s.doc.body || s.doc).match(new RegExp(cand.re)); raw = m ? m[1] : null; } } catch (e) { raw = null; }
      const v = NORM[spec.type](raw); if (v != null && same(spec.type, v, NORM[spec.type](s.known))) ok++; else miss.push(raw == null ? null : String(raw).slice(0, 40)); }
    return { n, ok, pass: n >= 1 && ok === n, auto: n >= 3 && ok === n, miss: miss.slice(0, 3) }; }
  /* 새 길 찾고 검증까지 한 번에 — 오늘 깨진(또는 길이 죽은) 칸마다, 값을 아는 견본 화면들로 */
  function heal(kind, field, samples, opt) { const S = (samples || []).filter((s) => s && s.doc && s.known != null); if (!S.length) return { field, cands: [], adopt: null };
    const C = discover(S[0].doc, kind, field, S[0].known, opt); const R = C.map((c) => ({ ...c, check: verifyCand(kind, field, c, S) })).filter((c) => c.check.pass);
    R.sort((a, b) => b.check.ok - a.check.ok || b.score - a.score); const best = R[0] || null; return { field, cands: R.slice(0, 4), adopt: best && best.check.auto ? { sel: best.sel || null, re: best.re || null, n: best.check.n } : null }; }

  /* ── 운영 파서(readnow-products-core) 견줌 ── 수집기·클라우드가 실제로 쓰는 값과 이 엔진의 합의값이 같은가 */
  const GUARD_MAP = { al_product: { itemId: 'aladinItemId', title: 'title', isbn13: 'isbn13', priceList: 'priceList', priceSales: 'priceSales', salesPoint: 'salesPoint', availability: 'availability', pubDate: 'pubDate', publisher: 'publisher' }, al_used: { usedTotal: 'usedTotal' } };
  function guardCompare(kind, op, ex) { const M = GUARD_MAP[kind] || {}; const K = KINDS[kind]; const out = { kind, fields: {}, bad: [] }; if (!op || !ex || !K) return out;
    for (const [fd, ok] of Object.entries(M)) { const spec = K.fields[fd]; const a = NORM[spec.type](op[ok]); const r = ex.fields[fd] || {}; const b = r.v; const st = a == null && b == null ? 'none' : a == null ? 'op_miss' : b == null ? 'ad_miss' : same(spec.type, a, b, TOL[fd]) ? 'same' : 'diff';
      out.fields[fd] = { op: a, ad: b, st, conf: r.conf || 0 }; if (st === 'op_miss' && (r.conf || 0) >= 0.6) out.bad.push(fd); if (st === 'diff' && (r.conf || 0) >= 0.8) out.bad.push(fd); }
    return out; }

  /* ── TTB 대체 견줌 ── 10/30 전에 TTB가 준 값(ext_basic.src.ttb.d)과 지금 대체(공개 화면 읽기)의 같은 칸 */
  const TTB_FIELDS = [['title', 'title', 'str'], ['authors', 'author', 'str'], ['publisher', 'publisher', 'str'], ['pubDate', 'pubDate', 'date'], ['priceList', 'priceList', 'int'], ['priceSales', 'priceSales', 'int'], ['salesPoint', 'salesPoint', 'int'], ['stock', 'availability', 'avail'], ['rating', 'rating', 'num']];
  const TTB_TOL = { salesPoint: 0.5, priceSales: 0.15, rating: 0.15, priceListForeign: 0.15 }; /* (0.1.2 adapt2) 외국 책(ISBN이 978-89·979-11이 아님)의 원화 정가는 환율 따라 바뀜 — 11/11 ttbcmp 정가 일치 0.25(8권 중 원서가 대부분 · 판매가는 15% 너그러움으로 1.0) → 외국 책 정가도 판매가처럼 15% · 틀린 예(miss)를 함께 남김 */
  const isKrIsbn = (i) => /^(97889|97911)\d{8}$/.test(String(i || '')); /* SP·판매가는 그사이 바뀜(10/30 전 값) — 넓게 · 근거: 없음(첫 회차 뒤 다시 정함) */
  /* (0.1.3 adapt3) 지은이 같음 = TTB 첫 지은이가 지금 지은이 목록(공저·옮긴이 포함 '잭 런던, Andrew Sinclair')에 들어 있음 · 이름 앞부분 같음도(부제·괄호 꼬리) — 11/11 ttbcmp 87.5%의 틀린 1권이 이 꼴 */
  /* (0.1.3) 제목 앞 꼬리표 '[POD]'·'[중고]'·'[eBook]'과 앞 'The ' 뗌 — 11/11 ttbcmp 20권 제목 85%의 틀린 3권이 모두 '[POD] …' · 지은이 'Culinary Institute of America' vs 'The Culinary …' */
  const untag = (v) => String(v == null ? '' : v).replace(/^\s*(?:\[[^\]]{1,12}\]\s*)+/, '').replace(/^\s*the\s+/i, '');
  const authorList = (v) => untag(v).replace(/\([^)]*\)/g, ' ').split(/\s*[,·;/|]\s*|\s+외\s*\d*\s*명?/).map((x) => keyOf('str', x)).filter(Boolean);
  function authorSame(a, b) { const A = authorList(a), B = authorList(b); if (!A.length || !B.length) return false; return A.some((x) => B.some((y) => x === y || (Math.min(x.length, y.length) >= 2 && (x.startsWith(y) || y.startsWith(x))))); }
  function ttbCompare(pairs) { const P = (pairs || []).filter((x) => x && x.ttb); const out = { n: P.length, fields: {}, ok: true, worse: [] };
    for (const [tk, nk, ty] of TTB_FIELDS) { let tf = 0, nf = 0, both = 0, ag = 0, bKr = 0, aKr = 0, z0 = 0; const miss = []; for (const x of P) { let a = x.ttb[tk]; if (tk === 'authors' && a) a = String(a).split(/[,(]/)[0]; const A = NORM[ty](a); const B = NORM[ty]((x.now || {})[nk]); if (A != null) tf++; if (B != null) nf++; if (tk === 'salesPoint' && A === 0) { z0++; continue; } /* (0.1.3 adapt3) TTB SP 0 = 그때 판매 기록 없음(값이 아님) → 견줌에서 뺌(채움률엔 셈) */
        if (A != null && B != null) { both++; const kr = isKrIsbn(x.isbn); const tol = tk === 'priceList' && !kr ? TTB_TOL.priceListForeign : TTB_TOL[tk]; const hit = tk === 'authors' ? authorSame(A, B) : ty === 'str' ? keyOf('str', untag(A)).slice(0, 6) === keyOf('str', untag(B)).slice(0, 6) : same(ty, A, B, tol); if (hit) ag++; if (kr) { bKr++; if (hit) aKr++; } if (!hit && miss.length < 4) miss.push({ isbn: x.isbn || null, ttb: A, now: B, kr }); } }
      const f = { ttbFill: P.length ? Math.round((tf / P.length) * 1000) / 1000 : 0, nowFill: P.length ? Math.round((nf / P.length) * 1000) / 1000 : 0, both, agree: both ? Math.round((ag / both) * 1000) / 1000 : null, agreeKr: bKr ? Math.round((aKr / bKr) * 1000) / 1000 : null, nKr: bKr, miss, ...(tk === 'salesPoint' ? { ttbZero: z0 } : {}) };
      f.ok = f.nowFill >= f.ttbFill - 0.05 && (f.agree == null || f.agree >= (tk === 'salesPoint' ? 0.6 : 0.9)); out.fields[nk] = f; if (!f.ok) { out.ok = false; out.worse.push(nk); } }
    return out; }

  /* ── 알라딘 공개 목록 화면 주소 후보(벤치마킹 '목록 종류' · TTB ItemList 대신) ── 앞에서부터 시도 · 첫 회차에 맞은 주소를 기억(adapt_sel.lists) */
  const LISTS = {
    Bestseller: { label: '베스트셀러', urls: ['/shop/common/wbest.aspx?BestType=Bestseller&BranchType={b}&CID={c}&page={p}&cnt=50', '/shop/common/wbest.aspx?BranchType={b}&BestType=Bestseller&page={p}'] },
    BlogBest: { label: '블로거 베스트', urls: ['/shop/common/wbest.aspx?BestType=BlogBest&BranchType={b}&CID={c}&page={p}', '/shop/common/wblogbest.aspx?BranchType={b}&page={p}'] },
    ItemNewAll: { label: '신간 전체', urls: ['/shop/common/wnew.aspx?NewType=New&BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?BranchType={b}&page={p}'] },
    ItemNewSpecial: { label: '주목할 만한 신간', urls: ['/shop/common/wnew.aspx?NewType=SpecialNew&BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?NewType=Special&BranchType={b}&page={p}'] },
    /* (0.1.2 adapt2) 진단 blist: 앞 두 주소는 '알라딘' 빈 화면(9.5만 자 · 상자 0) · wbrowse CID=1&BrowseTarget=EditorRecommend는 분야 첫 화면(값 없는 상품 링크 119개 — 목록 아님)
     *  → 목록 주소를 짐작하지 않고 분야 첫 화면(hubs)에서 '편집장의 선택' 같은 제목 칸(sec)을 찾아 그 칸의 상품만 · 칸 안 '더보기' 링크가 있으면 그 화면을 목록으로 */
    ItemEditorChoice: { label: '편집자 추천', urls: ['/shop/common/wchoice.aspx?BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?NewType=EditorChoice&BranchType={b}&CID={c}&page={p}'], hubs: ['/shop/wbrowse.aspx?CID={c1}', '/'], sec: ['편집장의\\s*선택', '편집자\\s*(?:추천|의\\s*선택)', '에디터\\s*(?:추천|픽|PICK)', 'MD\\s*(?:추천|의\\s*선택)'] },
  };
  /* (0.1.2) 화면 안 제목 칸('편집장의 선택' 등) 아래 상품만 — 제목 글(30자 안)을 찾아 위로 올라가며 상품이 3~60개 든 가장 가까운 상자 · 그 상자 안 '더보기' 주소도 */
  function sectionOf(doc, reSrc) { let re; try { re = new RegExp(reSrc, 'i'); } catch (e) { return null; } const idsIn = (e) => new Set([...(e.innerHTML || '').matchAll(/wproduct\.aspx\?ItemId=(\d+)/gi)].map((m) => m[1])).size;
    const heads = [...doc.querySelectorAll('h1, h2, h3, h4, h5, strong, b, em, span, a, p, li, div, img[alt], dt')].filter((e) => { const t = e.tagName === 'IMG' ? String(e.getAttribute('alt') || '') : txt(e); return t && t.length <= 30 && re.test(t); }).slice(0, 12);
    for (const h of heads) { let e = h; for (let k = 0; k < 7 && e && e.parentElement; k++) { e = e.parentElement; const n = idsIn(e); if (n > 60) break; if (n >= 3) { const more = [...e.querySelectorAll('a[href]')].find((a) => /더\s*보기|전체\s*보기|more/i.test(txt(a) + ' ' + (a.getAttribute('title') || '') + ' ' + ((a.querySelector('img') || { getAttribute: () => '' }).getAttribute('alt') || '')) && !/wproduct\.aspx/i.test(a.getAttribute('href') || '')); return { el: e, head: (h.tagName === 'IMG' ? String(h.getAttribute('alt') || '') : txt(h)).slice(0, 30) || null, n, more: more ? more.getAttribute('href') : null }; } } }
    return null; }
  /* 제목 칸 안 상품 줄 — 값이 없는 칸(그림·제목만)이라도 상품 번호·제목·지은이·출판사·표지 이름만은 · 값이 든 상자가 있으면 extractList 그대로 */
  /* (0.1.3 adapt3) 분야 첫 화면 제목 칸 글은 '<빨강의 자서전>'·'「…」'처럼 꺾쇠로 싸여 있음(11/11 진단 blist ItemEditorChoice) → 뗌 */
  const bareTitle = (t) => { let x = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); for (let k = 0; k < 2; k++) { const m = x.match(/^[<〈《「『【\[]\s*(.+?)\s*[>〉》」』】\]]\s*(.*)$/); if (!m) break; x = (m[1] + (m[2] ? ' ' + m[2] : '')).trim(); } return x || null; };
  function sectionRows(el, opts) { const X = extractList(el, { ...(opts || {}), fp: false }); if (X.rows.length >= 3) return X; const by = new Map();
    for (const a of el.querySelectorAll('a[href*="wproduct.aspx?ItemId="], a[href*="wproduct.aspx?itemid="]')) { const id = ((a.getAttribute('href') || '').match(/ItemId=(\d+)/i) || [])[1]; if (!id) continue; const z = by.get(id) || { itemId: id, title: null, author: null, publisher: null, coverKey: null, used: 'new', _conf: { itemId: 0.6 } }; const t = bareTitle(txt(a)); if (t && !/^\s*보러\s*가기\s*$/.test(t) && (!z.title || t.length > z.title.length)) z.title = t;
      const im = a.querySelector('img'); const m = im ? String(im.getAttribute('src') || '').match(/\/([0-9A-Za-z]{8,13})_\d+\.(?:jpe?g|gif|png)/i) : null; if (m) z.coverKey = m[1]; const box = a.closest('li, dd, td, div') || a.parentElement; if (box && !z.author) { const au = box.querySelector('a[href*="AuthorSearch"]'); const pu = box.querySelector('a[href*="PublisherSearch"]'); z.author = au ? txt(au) || null : null; z.publisher = pu ? txt(pu) || null : null; if (!z.author) { const P = bylineOf(box); if (P) { const lt = txt(a); const p0 = lt && P[0].indexOf(lt) >= 0 ? P[0].slice(P[0].indexOf(lt) + lt.length) : P[0]; const m = p0.match(/^\s*(.+?)\s*\((?:지은이|글|저|지음|엮은이)\)/); if (m) z.author = m[1].split(/\s*,\s*/)[0]; if (!z.publisher && P.length >= 3) z.publisher = P[P.length - 2] || null; } } } by.set(id, z); }
    const rows = [...by.values()].filter((r) => r.title); return { rows, boxes: { tried: X.boxes.tried, use: rows.length ? '(제목 칸 링크)' : X.boxes.use }, fp: null }; }
  function listUrls(type, o) { const L = LISTS[type]; if (!L) return []; const b = (o && o.branch) || 1, c = (o && o.cid) || 0, p = (o && o.page) || 1; const mem = o && o.known ? [o.known] : []; return [...new Set(mem.concat(L.urls))].map((u) => u.replace('{b}', b).replace('{c}', c).replace('{p}', p)); }

  /* ── SP 묶음 검색 계획 ── (정범님 11/11 밤 '검색 결과 목록으로 한꺼번에') 목록 한 쪽 = 상품마다 SP·판매가·정가·재고·ISBN(표지)·저자·출판사·출간 연월 — 상품 화면 한 권씩보다 수십 배 싼 길 SP가 빈 상품을 출판사(없으면 저자)로 묶어 '검색 결과 한 쪽 = 여러 권 SP'
   *  items [{id, isbn, title, publisher, author}] → [{q, field, ids[]}] 묶음이 큰 것부터 · 한 묶음 하나만 남으면 그 책 ISBN 검색 */
  function spBatchPlan(items, opt) { const o = { maxQ: 30, minGroup: 2, ...(opt || {}) }; const by = new Map(); const solo = [];
    for (const it of items || []) { const k = NORM.str(it.publisher) ? 'P:' + NORM.str(it.publisher) : NORM.str(it.author) ? 'A:' + String(NORM.str(it.author)).split(/[,(]/)[0].trim() : null; if (!k) { solo.push(it); continue; } if (!by.has(k)) by.set(k, []); by.get(k).push(it); }
    const Q = []; for (const [k, L] of [...by.entries()].sort((a, b) => b[1].length - a[1].length)) { if (L.length < o.minGroup) { solo.push(...L); continue; } Q.push({ q: k.slice(2), field: k[0] === 'P' ? 'Publisher' : 'Author', ids: L.map((x) => x.id) }); }
    for (const it of solo) if (NORM.isbn(it.isbn)) Q.push({ q: NORM.isbn(it.isbn), field: 'ISBN', ids: [it.id] });
    return Q.slice(0, o.maxQ); }
  /* 목록 줄 → 상품 맞추기(상품 번호 → ISBN → 제목 앞부분+출판사) */
  function spBatchMatch(rows, items, opt) { const all = !!(opt && opt.all); const out = new Map(); const R = (rows || []).filter((r) => r && r.used !== 'used'); const byId = new Map(R.map((r) => [String(r.itemId), r])); const byIsbn = new Map(R.filter((r) => r.isbn13).map((r) => [r.isbn13, r]));
    for (const it of items || []) { let r = (it.itemId && byId.get(String(it.itemId))) || (NORM.isbn(it.isbn) && byIsbn.get(NORM.isbn(it.isbn))) || null; let how = r ? (it.itemId && byId.get(String(it.itemId)) ? 'id' : 'isbn') : null;
      if (!r && it.title) { const kt = keyOf('str', it.title).slice(0, 10); const C = R.filter((x) => kt.length >= 4 && keyOf('str', x.title).startsWith(kt) && (!it.publisher || !x.publisher || same('str', x.publisher, it.publisher))); if (C.length === 1) { r = C[0]; how = 'title'; } }
      if (r && (r.salesPoint != null || all)) out.set(it.id, { sp: r.salesPoint ?? null, itemId: r.itemId, how, priceSales: r.priceSales ?? null, stock: r.stock ?? null, ...(all ? { row: r } : {}) }); }
    return out; }

  /* ── (0.1.2 adapt2) SP 묶음 2판 ── 11/11 진단 spbatch=1: 대상 7,511 · 검색 8쪽 · 맞춤 1 — 까닭 ① 목록 SP 길이 깨짐('세일즈포인트') ② 출판사 이름 낱말 검색 한 쪽(50줄)은 그 출판사 인기책뿐이라 판매자 숍의 옛 책이 거의 안 나옴
   *  ③ 판매자 숍 상품엔 ISBN이 거의 없고(상세 읽은 것만) 표지 그림 이름(coverKey)·정가·지은이|출판사(byline)는 있음 → 시장 지표·SP 표본 맞대기(ISBN으로만)가 0
   *  2판: 표지 이름이 ISBN 꼴(검사 숫자까지 맞음)이면 그 ISBN을 '짐작 ISBN'으로 → ㉠ 맞대기에 씀 · ㉡ ISBN 검색 한 쪽(정확) / 아니면 정리한 제목 검색 한 쪽 · 같은 제목은 한 번만
   *  맞추기: 한 쪽의 모든 줄을 '남은 모든 상품'과 견줌(묶음 덤) — 표지 이름 같음 > ISBN 같음 > 제목 같음 + (출판사·지은이·정가 중 하나 같음 · 후보 하나) */
  function isbnOk(v) { const s = String(v || '').replace(/[^0-9Xx]/g, '').toUpperCase(); if (s.length === 10) { let t = 0; for (let i = 0; i < 9; i++) { if (!/\d/.test(s[i])) return false; t += (10 - i) * +s[i]; } const c = s[9] === 'X' ? 10 : /\d/.test(s[9]) ? +s[9] : -1; return c >= 0 && (t + c) % 11 === 0; }
    if (/^97[89]\d{10}$/.test(s)) { let t = 0; for (let i = 0; i < 12; i++) t += +s[i] * (i % 2 ? 3 : 1); return (10 - (t % 10)) % 10 === +s[12]; } return false; }
  const coverIsbn = (k) => (isbnOk(k) ? NORM.isbn(k) : null);
  /* 판매자 숍 제목 정리 — [중고]·세트 꼬리·괄호 판 정보·부제 뒤를 떼어 검색어로 */
  const cleanTitle = (t) => String(t || '').replace(/^\s*\[[^\]]{1,8}\]\s*/, '').replace(/\s*-\s*전\s*\d+\s*권.*$/, '').replace(/\s*[\(\[][^)\]]{0,30}(판|권|호|개정|증보|합본|세트|양장|무선|반양장)[^)\]]{0,10}[\)\]]\s*/g, ' ').replace(/\s+-\s+.*$/, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  const tkey = (t) => keyOf('str', cleanTitle(t));
  function spBatchPlan2(items, opt) { const o = { maxQ: 60, ...(opt || {}) }; const Q = []; const byT = new Map();
    const byI = new Map(); /* (0.1.3 adapt3) 같은 ISBN(짐작 포함)은 한 묶음 — 여러 판매자가 같은 책을 올린 경우 한 쪽으로 여럿(묶음 덤) */
    for (const it of items || []) { const ib = NORM.isbn(it.isbn) || coverIsbn(it.coverKey); if (ib) { if (!byI.has(ib)) { const z = { q: ib, field: 'ISBN', ids: [], pri: 2 }; byI.set(ib, z); Q.push(z); } byI.get(ib).ids.push(it.id); continue; } const q = cleanTitle(it.title); if (q.length < 2) continue; const k = keyOf('str', q); if (!byT.has(k)) byT.set(k, { q, field: 'Title', ids: [], pri: 1 }); byT.get(k).ids.push(it.id); }
    Q.push(...byT.values()); Q.sort((a, b) => b.pri - a.pri || b.ids.length - a.ids.length); return Q.slice(0, o.maxQ); }
  function spBatchMatch2(rows, items) { const out = new Map(); const R = (rows || []).filter((r) => r && r.itemId && r.used !== 'used' && r.used !== 'ebook' && r.kind !== '전자책' && r.kind !== '중고');
    const byCov = new Map(), byIsbn = new Map(); for (const r of R) { if (r.coverKey) byCov.set(String(r.coverKey).toUpperCase(), r); if (r.isbn13) byIsbn.set(r.isbn13, r); }
    for (const it of items || []) { let r = null, how = null; const ck = it.coverKey ? String(it.coverKey).toUpperCase() : null; const ib = NORM.isbn(it.isbn) || coverIsbn(it.coverKey);
      if (ck && byCov.has(ck)) { r = byCov.get(ck); how = 'cover'; } else if (ib && byIsbn.has(ib)) { r = byIsbn.get(ib); how = 'isbn'; }
      else if (it.title) { const kt = tkey(it.title); if (kt.length >= 2) { const C = R.filter((x) => { const kx = tkey(x.title); return kx && (kx === kt || (Math.min(kx.length, kt.length) >= 4 && (kx.startsWith(kt) || kt.startsWith(kx)))); });
          const agree = (x) => (it.publisher && x.publisher && same('str', x.publisher, it.publisher) ? 1 : 0) + (it.author && x.author && same('str', String(x.author).split(/[,(]/)[0], String(it.author).split(/[,(]/)[0]) ? 1 : 0) + (it.priceList && x.priceList && +it.priceList === +x.priceList ? 1 : 0);
          const S = C.map((x) => ({ x, a: agree(x) })).filter((z) => z.a >= 1).sort((p, q) => q.a - p.a); if (S.length === 1 || (S.length > 1 && S[0].a > S[1].a)) { r = S[0].x; how = 'title'; } } }
      if (r) out.set(it.id, { sp: r.salesPoint ?? null, itemId: r.itemId, how, priceSales: r.priceSales ?? null, stock: r.stock ?? null, row: r }); }
    return out; }

  /* ── (adapt4 11/11) SP 묶음 4판 — 한 검색어에 여러 책 번호(띄어쓰기 = '또는') ──
   *  11/11 진단: ISBN 검색 한 쪽 = 1.17권(48쪽 → 56권) · 남은 6,119권 → 약 109시간. 같은 날 진단 blt로 확인: 알라딘 공개 검색은 'ISBN ISBN …'(띄어쓰기)를 '또는'으로 읽음
   *  (ISBN 14개 한 검색어 → 첫 10줄이 모두 다른 견본 책 · K… 표지 코드도 같은 검색어에 섞여 그 책이 나옴) → 표지 이름이 ISBN 꼴이거나 K… 코드인 상품을 k개씩 한 쪽으로
   *  · 표지 이름이 없는 상품만 지은이 묶음(같은 지은이 2권 넘게) → 제목 검색 · 쪽당 맞춘 수(길마다 성적)를 배워 성적 나쁜 길은 저절로 뒤로(yield) */
  const kCode = (k) => { const s = String(k || '').toUpperCase(); return /^K\d{9}$/.test(s) ? s : null; };
  const idKeyOf = (it) => NORM.isbn(it.isbn) || coverIsbn(it.coverKey) || kCode(it.coverKey) || null;
  /* (adapt5 11/11) 11/11 실제 회차: k 24(쪽 48 · 줄 494 = 쪽당 10.3줄)인데 맞춤률 0.425 — 같은 날 편집자 추천은 번호 12개 검색 3쪽에 36/36권, dry(k 12)는 쪽당 10.75권 0.823
   *  → 한 검색어에 번호가 12개(약 170자)를 넘으면 뒤 번호는 찾지 않음(알라딘이 검색어를 자름 · 쪽 크기 25·50과 무관) · 그런데 쪽이 '꽉 찬 것'(줄 ≥ 25)으로 안 보여 뒤 번호 12개를 '없는 책'으로 7일 쉼에 넣었음
   *  → k 상한 kMax(기본 12) · 검색어 글자 상한 qMax(기본 170자 · 넘으면 그 쪽은 거기서 끊음) · 여러 번호에서 한 번 못 찾은 상품(missM)은 다음엔 지은이·제목 검색으로 */
  function spBatchPlan3(items, opt) { const o = { k: 12, maxQ: 400, kcode: true, author: true, yield: null, kMax: 12, qMax: 170, ...(opt || {}) }; const kMax = Math.min(Math.max(+o.kMax || 12, 2), 30); const k = Math.min(Math.max(+o.k || 12, 2), kMax); const qMax = Math.max(+o.qMax || 170, 30);
    const byI = new Map(), byA = new Map(), byT = new Map(); const solo = [];
    for (const it of items || []) { let key = NORM.isbn(it.isbn) || coverIsbn(it.coverKey); if (!key && o.kcode) key = kCode(it.coverKey); if (key && !(+it.missM > 0)) { if (!byI.has(key)) byI.set(key, []); byI.get(key).push(it.id); continue; } solo.push(it); }
    const Q = []; const keys = [...byI.keys()]; let part = []; const cut = () => { if (part.length) Q.push({ q: part.join(' '), field: 'Multi', keys: part, ids: part.flatMap((x) => byI.get(x)), pri: 3 }); part = []; };
    for (const x of keys) { if (part.length && (part.length >= k || part.join(' ').length + 1 + x.length > qMax)) cut(); part.push(x); } cut();
    const au = (it) => { const a = String(it.author || '').split(/[,(·|]/)[0].replace(/\s+/g, ' ').trim(); return a.length >= 2 && a.length <= 20 && !/^(편집부|편집 ?부|저자|미상|작자 미상|기획|글|그림)$/.test(a) ? a : null; };
    if (o.author) for (const it of solo) { const a = au(it); if (!a) continue; const kk = keyOf('str', a); if (!byA.has(kk)) byA.set(kk, { a, L: [] }); byA.get(kk).L.push(it); }
    const yA = o.yield && (o.yield.Author || o.yield.author), yT = o.yield && (o.yield.Title || o.yield.title); /* (adapt5) 배운 성적 칸 이름은 'Author'·'Title'(전엔 소문자만 봐서 늘 못 읽음) */ const authorOk = !(yA && yA[0] >= 10 && yT && yT[0] >= 10 && yA[1] / yA[0] < yT[1] / yT[0]); /* 지은이 묶음 성적이 제목 검색보다 나쁘면(쪽 10개 넘게 본 뒤) 안 씀 */
    const inA = new Set(); if (authorOk) for (const { a, L } of [...byA.values()].sort((x, y) => y.L.length - x.L.length)) { if (L.length < 2) continue; Q.push({ q: a, field: 'Author', ids: L.map((x) => x.id), pri: 2 }); L.forEach((x) => inA.add(x.id)); }
    for (const it of solo) { if (inA.has(it.id)) continue; const q = cleanTitle(it.title); if (q.length < 2) continue; const kk = keyOf('str', q); if (!byT.has(kk)) byT.set(kk, { q, field: 'Title', ids: [], pri: 1 }); byT.get(kk).ids.push(it.id); }
    Q.push(...byT.values()); Q.sort((a, b) => b.pri - a.pri || b.ids.length - a.ids.length); return Q.slice(0, o.maxQ); }
  /* 한 쪽이 꽉 찼는데(줄 수 ≥ 쪽 크기) 못 맞춘 번호 = 잘렸을 수 있음(없는 책이 아님) → 다음 회차로 · 다 맞고 쪽이 넉넉하면 k를 늘림 */
  function spMultiLearn(k, res) { const kMax = Math.min(Math.max(+((res && res.kMax) || 12), 2), 30); const K = Math.min(Math.max(+k || 12, 2), kMax); if (!res || !res.n) return K; if (res.full && res.miss > 0) return Math.max(4, K - 2); if (!res.full && res.hit / res.n >= 0.8 && res.rows < res.cap * 0.6) return Math.min(24, kMax, K + 2); return K; } /* (adapt5) k는 kMax(기본 12 · 검색어 자름 한도)를 넘지 않음 */
  /* SP 다시 읽기 간격(일) — 7일마다 모두 다시 읽던 것 → 변동 적은 책은 길게(7 → 14 → 28일) · 많이 팔리는 책(3천 넘음)·크게 바뀐 책은 7일 */
  function spKeepDays(prev, cur, prevDays) { const d0 = Math.min(Math.max(+prevDays || 7, 7), 28); if (cur == null || !Number.isFinite(+cur)) return 7; if (prev == null || !Number.isFinite(+prev)) return 7; const a = +prev, b = +cur; if (b >= 3000) return 7;
    const rel = Math.abs(b - a) / Math.max(a, 1); const tiny = Math.abs(b - a) <= 3 && Math.max(a, b) < 30; if (tiny || rel <= 0.1) return Math.min(28, d0 * 2); if (rel <= 0.3) return d0; return 7; }
  /* 유지 비용 셈(시간당 다시 읽을 권수) — 간격 표 [{every}] */
  const spKeepPerH = (L) => { let t = 0; for (const x of L || []) t += 1 / (Math.min(Math.max(+x.every || 7, 7), 28) * 24); return Math.round(t * 10) / 10; }; /* reduce 안 씀(알라딘 화면 prototype.js) */

  /* ── 대기열·캐시·차등 갱신 ── 같은 회차에 같은 화면을 두 번 읽지 않고, 오래된 것·중요한 것부터 */
  function makeCache(ttlMs, max) { const M = new Map(); const T = ttlMs || 6 * 3600e3; const X = max || 2000; return { get: (k) => { const e = M.get(k); if (!e) return undefined; if (Date.now() - e.t > T) { M.delete(k); return undefined; } return e.v; }, set: (k, v) => { if (M.size >= X) M.delete(M.keys().next().value); M.set(k, { v, t: Date.now() }); return v; }, size: () => M.size }; }
  /* 차례 점수 = 지난 읽기부터 흐른 시간(시간) × 무게(우리 매물·벤치마킹·연구) ÷ (최근 값이 안 바뀐 횟수 + 1) — 자주 안 바뀌는 것은 덜 자주 */
  function prioritize(items, now) { const t = now || Date.now(); return (items || []).map((x) => ({ ...x, pri: Math.round((Math.max(0, t - (Date.parse(x.lastAt || 0) || 0)) / 3600e3) * (x.w || 1) / ((x.stableN || 0) + 1) * 1000) / 1000 })).sort((a, b) => b.pri - a.pri); }
  /* 바뀐 칸만(차등 갱신) — 전날 값과 같은 칸은 쓰지 않음 */
  function changed(prev, cur) { const o = {}; for (const [k, v] of Object.entries(cur || {})) { if (v == null) continue; const p = (prev || {})[k]; if (p == null || String(p) !== String(v)) o[k] = v; } return o; }

  /* ── (0.1.3 adapt3) 🏋 훈련 화면(drill) — 오늘 받은 진짜 화면을 일부러 '바뀐 화면'으로 흉내 내어 스스로 고침이 실제로 되는지 매일 시험
   *  흉내: 클래스·id 이름 바뀜(cls) · 구조 데이터 사라짐(ld) · 이름표 글 바뀜(label) · 감싸는 상자 더함(wrap) · 클래스+구조 데이터 함께(both)
   *  ① 지킴(keep): 바뀐 화면에서도 합의값이 원래 값과 같은 몫 — 길이 여럿이라 하나가 죽어도 이어 가나
   *  ② 고침(heal): 죽은 선택자 길·틀린 칸마다 원래 값(아는 값)으로 새 길을 찾고(discover) 다른 견본 화면들로 검증(verifyCand) → 그 길을 붙여 다시 읽어 원래 값이 나오면 고침 성공
   *  새 요청 없음(이미 받은 화면 사본으로) · 원래 화면은 건드리지 않음(cloneNode) · 결과는 매일 adapt_health.drill */
  const tokOf = (kind) => { const set = new Set(); const K = KINDS[kind]; const F = K ? K.fields : (LISTK[kind] || LISTK.al_list).fields; const add = (src) => { for (const m of String(src).matchAll(/[.#]([A-Za-z_][\w-]{2,})/g)) set.add(m[0]); };
    for (const f of Object.values(F)) for (const p of f.paths) { if (p.fp) add(p.fp); add(p.f); } if (!K) (LISTK[kind] || LISTK.al_list).box.forEach((b) => add(b.sel)); return [...set]; };
  const MUTS = {
    cls: { label: '클래스·id 이름 바뀜', f: (d, T) => { const cl = new Set(T.filter((t) => t[0] === '.').map((t) => t.slice(1))); const ids = new Set(T.filter((t) => t[0] === '#').map((t) => t.slice(1)));
      for (const e of d.querySelectorAll('[class]')) { const c = String(e.getAttribute('class')); const n = c.split(/\s+/).map((x) => (cl.has(x) ? x + '_rn' : x)).join(' '); if (n !== c) e.setAttribute('class', n); }
      for (const e of d.querySelectorAll('[id]')) if (ids.has(e.getAttribute('id'))) e.setAttribute('id', e.getAttribute('id') + '_rn'); } },
    ld: { label: '구조 데이터(JSON-LD·meta) 사라짐', f: (d) => { d.querySelectorAll('script[type="application/ld+json"], meta[property], meta[name^="books:"], meta[itemprop], link[rel="canonical"]').forEach((e) => e.remove()); } },
    label: { label: '이름표 글 바뀜', f: (d) => { const R = [[/판매가/g, '판매 가격'], [/정가/g, '정상 가격'], [/Sales\s*Point/gi, '판매 점수'], [/세일즈\s*포인트/g, '판매 점수'], [/판매지수/g, '인기 점수'], [/전체\s*중고/g, '모든 중고']]; const w = (d.ownerDocument || d).createTreeWalker(d.body || d, 4); const L = []; while (w.nextNode()) L.push(w.currentNode); for (const n of L) { let t = n.nodeValue; for (const [a, b] of R) t = t.replace(a, b); if (t !== n.nodeValue) n.nodeValue = t; } } },
    wrap: { label: '감싸는 상자 더함', f: (d) => { const doc = d.ownerDocument || d; for (const e of [...d.querySelectorAll('li, td, dd')].slice(0, 4000)) { const sp = doc.createElement('span'); sp.setAttribute('class', 'rn_wrap'); while (e.firstChild) sp.appendChild(e.firstChild); e.appendChild(sp); } } },
    both: { label: '클래스 + 구조 데이터 함께', f: (d, T) => { MUTS.cls.f(d, T); MUTS.ld.f(d, T); } },
  };
  /* 글로 적히지 않은 칸(주소·속성에서 읽는 번호 id · 단추 유무로 정하는 재고 avail)은 '아는 값'을 화면 글에서 찾을 수 없어 고침 시험 밖(skip) — 남은 길 지킴(keep)만 셈 */
  const NOHEAL = { id: 1, avail: 1 };
  const drillSum = (out) => { const L = Object.values(out.muts); out.score = L.length ? Math.round((sumOf(L, (m) => m.score) / L.length) * 1000) / 1000 : null; out.keep = L.length ? Math.round((sumOf(L, (m) => m.keep) / L.length) * 1000) / 1000 : null; const need = sumOf(L, (m) => m.need), hd = sumOf(L, (m) => m.healed.length); out.heal = need ? Math.round((hd / need) * 1000) / 1000 : 1; out.need = need; out.healedN = hd; return out; };
  const mutScore = (m) => { m.keep = m.tot ? Math.round((m.kept / m.tot) * 1000) / 1000 : 1; m.need = m.healed.length + m.unhealed.length; m.score = Math.round(((m.keep + (m.need ? m.healed.length / m.need : 1)) / 2) * 1000) / 1000; delete m.kept; return m; };
  /* 상품 화면 같은 한 권 화면 — docs [{doc, url}] 2개 넘게(검증은 다른 화면으로) */
  function drill(kind, docs, opt) { const o = opt || {}; const D = (docs || []).filter((x) => x && x.doc); const K = KINDS[kind]; if (!K || !D.length) return null; const T = tokOf(kind); const base = D.map((x) => extract(kind, x.doc, { url: x.url }));
    const out = { kind, n: D.length, muts: {} };
    for (const [mid, M] of Object.entries(MUTS)) { if (o.only && !o.only.includes(mid)) continue; const md = D.map((x) => { const c = x.doc.cloneNode(true); try { M.f(c, T); } catch (e) {} return c; }); const mx = md.map((c, i) => extract(kind, c, { url: D[i].url }));
      const m = { label: M.label, tot: 0, kept: 0, lost: [], dead: [], healed: [], unhealed: [], skip: [] };
      for (const [fd, spec] of Object.entries(K.fields)) { if (spec.opt) continue; let lost = false; for (let i = 0; i < D.length; i++) { const v = base[i].values[fd]; if (v == null) continue; m.tot++; if (same(spec.type, mx[i].values[fd], v, TOL[fd])) m.kept++; else lost = true; }
        const selOf = (r) => ((r.paths[fd] || []).find((p) => p.how === 'sel') || {}).v; const dead = base.some((b) => selOf(b) != null) && base.every((b, i) => selOf(b) == null || selOf(mx[i]) == null);
        if (lost) m.lost.push(fd); if (dead) m.dead.push(fd); if (!lost && !dead) continue; if (NOHEAL[spec.type]) { m.skip.push(fd); continue; }
        const S = md.map((c, i) => ({ doc: c, known: base[i].values[fd] })).filter((x) => x.known != null); if (S.length < Math.min(2, D.length)) { m.unhealed.push(fd); continue; }
        const H = heal(kind, fd, S, { max: 4 }); let won = null;
        for (const c of H.cands || []) { const lr = { [kind]: { [fd]: [{ sel: c.sel || null, re: c.re || null }] } }; const okAll = md.every((d, i) => base[i].values[fd] == null || same(spec.type, extract(kind, d, { url: D[i].url, learned: lr, only: [fd] }).values[fd], base[i].values[fd], TOL[fd])); if (okAll) { won = c; break; } }
        if (won) m.healed.push({ f: fd, sel: won.sel || null, re: won.re || null, n: won.check.n }); else m.unhealed.push(fd); }
      out.muts[mid] = mutScore(m); }
    return drillSum(out); }
  /* 목록 화면 한 쪽 — 상자가 여럿이라 검증은 다른 상자로 · 바뀐 화면의 줄은 상품 번호로 원래 줄과 짝지음 */
  function drillList(kind, doc, opt) { const o = opt || {}; const lk = LISTK[kind]; if (!lk || !doc) return null; const T = tokOf(kind); const base = extractList(doc, { kind, fp: false }).rows.slice(0, o.maxRows || 40); if (base.length < 3) return null; const idf = lk.idField;
    const out = { kind, n: base.length, muts: {} };
    for (const [mid, M] of Object.entries(MUTS)) { if (o.only && !o.only.includes(mid)) continue; const c = doc.cloneNode(true); try { M.f(c, T); } catch (e) {} const X = extractList(c, { kind, fp: false, withEls: true }); const mr = new Map(X.rows.map((r) => [String(r[idf]), r]));
      const m = { label: M.label, tot: 0, kept: 0, lost: [], dead: [], healed: [], unhealed: [], skip: [], box: X.boxes.use, rows: X.rows.length };
      for (const [fd, spec] of Object.entries(lk.fields)) { if (spec.opt) continue; let lost = 0, have = 0; for (const r of base) { if (r[fd] == null) continue; have++; m.tot++; const x = mr.get(String(r[idf])); if (x && same(spec.type, x[fd], r[fd], TOL[fd])) m.kept++; else lost++; }
        if (!have || !lost) continue; m.lost.push(fd); if (NOHEAL[spec.type] && fd !== idf) { m.skip.push(fd); continue; } if (fd === idf) { m.unhealed.push(fd); continue; }
        const S = base.map((r) => ({ r, x: mr.get(String(r[idf])) })).filter((z) => z.x && z.x._el && z.r[fd] != null).slice(0, 8).map((z) => ({ doc: c, scope: z.x._el, known: z.r[fd] })); if (S.length < 3) { m.unhealed.push(fd); continue; }
        const H = heal(kind, fd, S, { max: 4, scope: S[0].scope }); let won = null;
        for (const cd of H.cands || []) { const lr = { [kind]: { [fd]: [{ sel: cd.sel || null, re: cd.re || null }] } }; const Y = extractList(c, { kind, fp: false, learned: lr }); const ym = new Map(Y.rows.map((r) => [String(r[idf]), r])); const chk = base.filter((r) => r[fd] != null && ym.has(String(r[idf]))); const good = chk.filter((r) => same(spec.type, ym.get(String(r[idf]))[fd], r[fd], TOL[fd])).length; if (chk.length >= 3 && good >= chk.length * 0.9) { won = { ...cd, good, of: chk.length }; break; } }
        if (won) m.healed.push({ f: fd, sel: won.sel || null, re: won.re || null, n: won.of }); else m.unhealed.push(fd); }
      out.muts[mid] = mutScore(m); }
    return drillSum(out); }

  /* 하루 요약 한 줄(리드가 매일 봄) — 종류마다 점수·깨진 칸·죽은 길·지문 바뀜 */
  function dailyLine(H) { const parts = []; for (const [k, v] of Object.entries((H && H.kinds) || {})) { const j = v.judge || {}; parts.push(`${(KINDS[k] && KINDS[k].label) || (k === 'al_list' ? '알라딘 목록 화면' : k)} ${v.health ? Math.round(v.health.score * 100) : '-'}점${j.broken && j.broken.length ? ` · 깨짐 ${j.broken.join(',')}` : ''}${j.deadPaths && j.deadPaths.length ? ` · 죽은 길 ${j.deadPaths.map((d) => d.field + '/' + d.how).join(',')}` : ''}${v.fp && v.fp.changed ? ' · 화면 구조 바뀜' : ''}${v.guard && v.guard.bad && v.guard.bad.length ? ` · 운영 파서 어긋남 ${v.guard.bad.join(',')}` : ''}`); } return parts.join(' │ '); }

  const api = { VERSION, drill, drillList, MUTS, tokOf, authorSame, bareTitle, KINDS, LIST_FIELDS, LIST_BOX, LISTK, Y24_LIST_FIELDS, NORM, same, keyOf, isbn10to13, extract, extractList, autoBoxes, fingerprint, fpCompare, healthOf, healthOfList, healthJudge, discover, verifyCand, heal, cssPath, guardCompare, GUARD_MAP, ttbCompare, TTB_FIELDS, LISTS, listUrls, spBatchPlan, spBatchMatch, sectionOf, sectionRows, spBatchPlan2, spBatchMatch2, spBatchPlan3, spMultiLearn, spKeepDays, spKeepPerH, kCode, idKeyOf, coverIsbn, isbnOk, cleanTitle, isKrIsbn, makeCache, prioritize, changed, dailyLine, vote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowAdapt = api;
})(typeof window !== 'undefined' ? window : this);
