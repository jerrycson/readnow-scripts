/* readnow-adapt-core.js — 🧬 수집 적응 엔진 (정범님 11/11 밤 · 약속 55 · 연구 N10)
 * 알라딘·예스24 공개 화면이 바뀌어도 수집이 멈추지 않게: 칸마다 '여러 길 추출'(선택자 · 문맥 글 · 구조 데이터 JSON-LD/meta · 정규식)을 두고
 * 서로 견줘 합의값 + 신뢰도를 냄 → 화면 구조 지문을 매일 견줘 바뀜 감지 → 깨진 길 표시 → 남은 길로 계속 → 값이 알려진 책으로 새 선택자 후보를 스스로 찾아 검증.
 * 순수 함수(Document → 데이터) · 저장·네트워크 없음 · 클라우드(퍼피티어 화면 안)·웹앱·Node 시험이 같이 씀. 수집기 머리(@require)는 바꾸지 않음 — 수집기는 이 파일을 싣지 않고,
 * 클라우드 매일 점검이 수집기와 같은 공용 파서(readnow-products-core parseProductPage 등)의 값을 이 엔진의 합의값과 견줘(guard) 운영 파서가 깨졌는지 알림.
 * 빈 값은 null. 사람용 글은 한국어.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.1'; // (0.1.1) 목록 화면 정가 길 — 할인율(10%)을 정가로 읽던 것 고침(진단 blist 정가 5·10) // (0.1.0) 첫 판 — 여러 길 추출·합의·지문·칸 건강·새 길 찾기·운영 파서 견줌·TTB 대체 견줌·목록 화면 주소 후보·SP 묶음 검색 계획

  /* ── 도움 함수 ── */
  const txt = (el) => (el ? String(el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '');
  /* 문맥 글 — 글 조각마다 띄어 붙임(textContent는 '4,210'과 '300쪽'을 '4,210300쪽'으로 붙여 숫자를 틀리게 읽음) · script·style 뺌 */
  const ttxt = (el) => { if (!el) return ''; const out = []; const walk = (n) => { if (n.nodeType === 3) { out.push(n.nodeValue); return; } if (n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11) return; const t = n.tagName; if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT' || t === 'TEMPLATE') return; for (let c = n.firstChild; c; c = c.nextSibling) walk(c); }; walk(el); return out.join(' ').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(); };
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
      ] },
      lowest: { type: 'int', range: [10, 3000000], paths: [
        { how: 'sel', fp: '.Ere_usedsell_table .price', f: (C) => { const v = C.$$('.Ere_usedsell_table .price .Ere_fs20').map((e) => toInt(txt(e))).filter((x) => x > 0); return v.length ? Math.min(...v) : null; } },
        { how: 'ctx', f: (C) => { const t = txt(C.$('.Ere_prod_Binfowrap_used2')); const v = [...t.matchAll(/([\d,]{3,})\s*원/g)].map((m) => toInt(m[1])).filter((x) => x > 0); return v.length ? Math.min(...v) : null; } },
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
  const LIST_FIELDS = {
    itemId: { type: 'id', must: true, paths: [
      { how: 'sel', f: (b) => b.getAttribute && b.getAttribute('itemid') },
      { how: 're', f: (b) => ((b.innerHTML || '').match(/wproduct\.aspx\?ItemId=(\d+)/i) || [])[1] || null },
    ] },
    title: { type: 'str', must: true, paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a.bo3')) },
      { how: 'ctx', f: (b) => { const a = [...b.querySelectorAll('a[href*="wproduct.aspx"]')].map((x) => txt(x)).filter((s) => s && !/^\d+$/.test(s)); return a.sort((x, y) => y.length - x.length)[0] || null; } },
    ] },
    priceSales: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('.ss_p2 b') || b.querySelector('.ss_p2')) },
      { how: 'ctx', f: (b) => (ttxt(b).match(/[\d,]+\s*원\s*→\s*([\d,]+)\s*원/) || [])[1] || null },
    ] },
    priceList: { type: 'int', range: [100, 3000000], paths: [
      { how: 'sel', f: (b) => { const t = [...b.querySelectorAll('span.ss_p, del, strike, s')].map((e) => txt(e)).find((x) => x && /원/.test(x) && +String(x).replace(/[^\d]/g, '') >= 100); return t || null; } }, /* (0.1.1 rel4 진단) 첫 span.ss_p가 '(10%할인)'이면 10을 정가로 읽던 것 — '원'이 붙은 100 넘는 값만 */
      { how: 'ctx', f: (b) => (ttxt(b).match(/([\d,]+)\s*원\s*→/) || [])[1] || null },
    ] },
    salesPoint: { type: 'int', range: [0, 10000000], paths: [
      { how: 'sel', f: (b) => { const li = [...b.querySelectorAll('li, span, div')].reverse().find((x) => /Sales\s*Point/i.test(x.textContent || '') && x.querySelector('b, strong')); return li ? txt(li.querySelector('b, strong')) : null; } },
      { how: 'ctx', f: (b) => (ttxt(b).match(/Sales\s*Point\s*:?\s*([\d,]+)/i) || [])[1] || null },
    ] },
    stock: { type: 'avail', paths: [
      { how: 'ctx', f: (b) => { const t = ttxt(b); const m = t.match(/(절판|일시\s*품절|품절)(?=\s|\)|$|,|입니다|되었)/); if (m) return m[1]; return /[\d,]+\s*원/.test(t) && /장바구니|바로구매|cart/i.test((b.innerHTML || '')) ? 'onSale' : null; } },
    ] },
    author: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a[href*="AuthorSearch"]')) },
    ] },
    publisher: { type: 'str', paths: [
      { how: 'sel', f: (b) => txt(b.querySelector('a[href*="PublisherSearch"]')) },
    ] },
    isbn13: { type: 'isbn', paths: [
      { how: 're', f: (b) => { const m = (b.innerHTML || '').match(/\/([0-9Xx]{10}|97[89]\d{10})_\d+\.(?:jpg|jpeg|gif|png)/); return m ? m[1] : null; } },
    ] },
    pubYm: { type: 'date', paths: [
      { how: 'ctx', f: (b) => { const m = ttxt(b).match(/(\d{4})\s*년\s*(\d{1,2})\s*월/) || ttxt(b).match(/\|\s*(\d{4})-(\d{2})(?:-\d{2})?\s*(?:\||$)/); return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : null; } },
    ] },
    used: { type: 'str', paths: [
      { how: 'ctx', f: (b) => (/\[중고\]/.test(ttxt(b)) ? 'used' : 'new') },
    ] },
  };

  /* ── 합의 ── votes = [{how, w, v}] (v는 이미 맞춤 꼴) → { v, conf, n, of, hows, alt } */
  function vote(type, votes, of, tol) { const G = []; for (const x of votes) { if (x.v == null) continue; const g = G.find((y) => same(type, y.v, x.v, tol)); if (g) { g.w += x.w; g.hows.push(x.how); if (keyOf(type, x.v).length > keyOf(type, g.v).length && type === 'str') g.v = g.v; } else G.push({ v: x.v, w: x.w, hows: [x.how] }); }
    if (!G.length) return { v: null, conf: 0, n: 0, of: of || 0, hows: [], alt: [] };
    G.sort((a, b) => b.w - a.w); const tw = G.reduce((s, g) => s + g.w, 0); const g = G[0]; const n = votes.filter((x) => x.v != null).length;
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
  function autoBoxes(doc) { const A = [...doc.querySelectorAll('a[href*="wproduct.aspx?ItemId="], a[href*="wproduct.aspx?itemid="]')]; const seen = new Map();
    for (const a of A) { const id = ((a.getAttribute('href') || '').match(/ItemId=(\d+)/i) || [])[1]; if (!id) continue; let e = a; let best = null;
      for (let k = 0; k < 8 && e && e.parentElement; k++) { e = e.parentElement; const ids = new Set([...(e.innerHTML || '').matchAll(/wproduct\.aspx\?ItemId=(\d+)/gi)].map((m) => m[1])); if (ids.size > 1) break; if (/[\d,]+\s*원/.test(e.textContent || '')) best = e; }
      if (best && !seen.has(id)) seen.set(id, best); }
    return [...new Set(seen.values())]; }
  function extractList(doc, opts) { const o = opts || {}; if (!doc) return null; const tries = LIST_BOX.concat(((o.learned || {}).al_list || {})._box || []).map((b) => { let L = []; try { L = [...doc.querySelectorAll(b.sel)]; } catch (e) {} if (b.sel === '.ss_book_list') L = L.map((x) => x.closest('table') || x.parentElement || x); return { how: b.how || 'learned', sel: b.sel, L }; });
    tries.push({ how: 'auto', sel: '(상품 링크로 묶음)', L: autoBoxes(doc) }); tries.forEach((t) => { t.n = new Set(t.L.map((b) => ((b.getAttribute && b.getAttribute('itemid')) || ((b.innerHTML || '').match(/ItemId=(\d+)/i) || [])[1]))).size; });
    const best = tries.slice().sort((a, b) => b.n - a.n)[0]; const boxes = { tried: tries.map((t) => ({ how: t.how, sel: t.sel, n: t.n })), use: best.n ? best.sel : null };
    const rows = []; const seen = new Set();
    for (const b of best.L) { const r = { _conf: {} }; for (const [fd, spec] of Object.entries(LIST_FIELDS)) { const P = spec.paths.concat((((o.learned || {}).al_list || {})[fd] || []).map((x) => ({ how: 'learned', f: (bx) => { const e = x.sel ? bx.querySelector(x.sel) : bx; const t = txt(e); if (x.re) { const m = t.match(new RegExp(x.re)); return m ? m[1] : null; } return t || null; } })));
        const votes = P.map((p) => { let raw = null; try { raw = p.f(b); } catch (e) {} return { how: p.how, w: W_DEF[p.how] || 1, v: NORM[spec.type](raw) }; }); const v = vote(spec.type, votes, P.length, TOL[fd]); r[fd] = v.v; r._conf[fd] = v.conf; }
      if (!r.itemId || !r.title || seen.has(r.itemId)) continue; seen.add(r.itemId); rows.push(r); }
    return { rows, boxes, fp: o.fp === false ? null : fingerprint(doc, 'al_list') }; }

  /* ── 화면 구조 지문 ── 칸 길이 기대는 조각(fp 선택자)이 있나 + 자주 쓰인 class 이름 묶음 → 서명 */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
  function fingerprint(doc, kind) { const marks = {}; const K = KINDS[kind]; const sels = K ? Object.values(K.fields).flatMap((f) => f.paths.map((p) => p.fp).filter(Boolean)) : LIST_BOX.map((b) => b.sel);
    for (const s of [...new Set(sels)]) { let n = 0; try { n = doc.querySelectorAll(s).length; } catch (e) {} marks[s] = Math.min(n, 99); }
    const cnt = new Map(); const all = doc.querySelectorAll ? doc.querySelectorAll('[class]') : []; let k = 0; for (const e of all) { if (++k > 6000) break; for (const c of String(e.getAttribute('class') || '').split(/\s+/)) { if (!c || /\d{3,}/.test(c) || c.length > 40) continue; cnt.set(c, (cnt.get(c) || 0) + 1); } }
    const cls = [...cnt.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 40).map((x) => x[0]).sort(); const ldN = doc.querySelectorAll ? doc.querySelectorAll('script[type="application/ld+json"]').length : 0;
    return { kind, sig: hash(JSON.stringify([Object.entries(marks).map(([s, n]) => [s, n > 0 ? 1 : 0]), cls.slice(0, 30), ldN > 0])), marks, cls, ld: ldN }; }
  function fpCompare(a, b) { if (!a || !b) return { same: null, lost: [], gained: [], jacc: null, changed: false }; const lost = Object.keys(a.marks || {}).filter((s) => (a.marks[s] || 0) > 0 && !((b.marks || {})[s] > 0)); const gained = Object.keys(b.marks || {}).filter((s) => (b.marks[s] || 0) > 0 && !((a.marks || {})[s] > 0));
    const A = new Set(a.cls || []), B = new Set(b.cls || []); const inter = [...A].filter((x) => B.has(x)).length; const jacc = A.size || B.size ? Math.round((inter / new Set([...A, ...B]).size) * 1000) / 1000 : 1;
    return { same: a.sig === b.sig, lost, gained, jacc, ldLost: !!(a.ld && !b.ld), changed: a.sig !== b.sig && (lost.length > 0 || jacc < 0.7 || (a.ld && !b.ld)) }; }

  /* ── 칸 건강 ── results = 같은 종류 화면 여럿의 extract 결과 → 칸마다 채움률·합의율·범위 안 몫·길마다 채움률 */
  function healthOf(results, kind) { const R = (results || []).filter(Boolean); const K = KINDS[kind] || { fields: LIST_FIELDS }; const out = { kind, n: R.length, fields: {} };
    for (const [fd, spec] of Object.entries(K.fields)) { const F = R.map((r) => (r.fields ? r.fields[fd] : null)).filter(Boolean); if (!F.length) continue; const filled = F.filter((x) => x.v != null); const pf = {};
      R.forEach((r) => ((r.paths || {})[fd] || []).forEach((p) => { const z = (pf[p.how] = pf[p.how] || { n: 0, got: 0, ok: 0 }); z.n++; if (p.v != null) z.got++; if (p.ok) z.ok++; }));
      Object.values(pf).forEach((z) => { z.fill = z.n ? Math.round((z.got / z.n) * 1000) / 1000 : 0; z.agree = z.got ? Math.round((z.ok / z.got) * 1000) / 1000 : null; });
      out.fields[fd] = { fill: Math.round((filled.length / F.length) * 1000) / 1000, conf: filled.length ? Math.round((filled.reduce((s, x) => s + x.conf, 0) / filled.length) * 1000) / 1000 : 0, agree: filled.length ? Math.round((filled.filter((x) => x.n >= 2 && x.hows.length === x.n).length / filled.length) * 1000) / 1000 : 0, inRange: filled.length ? Math.round((filled.filter((x) => !x.outOfRange).length / filled.length) * 1000) / 1000 : 1, must: !!spec.must, paths: pf }; }
    const fs = Object.values(out.fields); out.score = fs.length ? Math.round((fs.reduce((s, f) => s + f.fill * (0.5 + 0.5 * f.conf), 0) / fs.length) * 1000) / 1000 : 0; return out; }
  /* 목록 화면 건강 — 줄들의 칸 채움률(상자 길 이름 포함) */
  function healthOfList(lists) { const L = (lists || []).filter(Boolean); const rows = L.flatMap((x) => x.rows || []); const out = { kind: 'al_list', n: L.length, rows: rows.length, fields: {}, box: L.map((x) => x.boxes && x.boxes.use) };
    for (const [fd, spec] of Object.entries(LIST_FIELDS)) { if (!rows.length) { out.fields[fd] = { fill: 0, conf: 0, must: !!spec.must }; continue; } const got = rows.filter((r) => r[fd] != null); out.fields[fd] = { fill: Math.round((got.length / rows.length) * 1000) / 1000, conf: got.length ? Math.round((got.reduce((s, r) => s + (r._conf[fd] || 0), 0) / got.length) * 1000) / 1000 : 0, must: !!spec.must }; }
    const fs = Object.values(out.fields); out.score = fs.length ? Math.round((fs.reduce((s, f) => s + f.fill * (0.5 + 0.5 * f.conf), 0) / fs.length) * 1000) / 1000 : 0; return out; }
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
  function discover(doc, kind, field, known, opt) { const o = opt || {}; const spec = kind === 'al_list' ? LIST_FIELDS[field] : (KINDS[kind] || { fields: {} }).fields[field]; if (!spec || known == null || !doc) return [];
    const type = spec.type; const kv = NORM[type](known); if (kv == null) return []; const scope = o.scope || doc.body || doc.documentElement || doc; const out = []; const seen = new Set();
    const hit = (t) => { const v = NORM[type](t); return v != null && same(type, v, kv) && (type !== 'int' || String(t).replace(/,/g, '').includes(String(kv)) || String(t).includes(fmtInt(kv))); };
    const els = [...scope.querySelectorAll('*')].filter((e) => { const t = txt(e); return t && t.length <= (type === 'str' ? 240 : 60) && hit(t) && ![...e.children].some((c) => hit(txt(c))); }).slice(0, 20);
    for (const e of els) { const sel = cssPath(e, o.scope || null); if (!sel || seen.has(sel)) continue; seen.add(sel); let L = []; try { L = [...(o.scope || doc).querySelectorAll(sel)]; } catch (er) { continue; } const first = L[0]; const okFirst = first && hit(txt(first));
      if (okFirst) out.push({ sel, uniq: L.length === 1, score: Math.round(((L.length === 1 ? 1 : 0.6) * (/#/.test(sel) ? 1 : /\./.test(sel) ? 0.9 : 0.5) - sel.length / 1000) * 1000) / 1000 }); }
    /* 문맥 정규식: 값 바로 앞의 글자 낱말(숫자 아닌 2~8자) */
    if (type === 'int' || type === 'isbn') { const T = ttxt(scope); const vs = type === 'int' ? [fmtInt(kv), String(kv)] : [String(kv)]; for (const s of vs) { const i = T.indexOf(s); if (i < 0) continue; const pre = T.slice(Math.max(0, i - 14), i).replace(/[\d,.:]+\s*$/, '').match(/([^\d\s:|]{2,8})\s*:?\s*$/); if (pre) { const re = pre[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*([\\d,X]+)'; if (!out.some((x) => x.re === re)) out.push({ re, score: 0.7 }); } break; } }
    return out.sort((a, b) => b.score - a.score).slice(0, o.max || 6); }
  /* 후보 검증 — samples [{doc, known}] 모두에서 같은 값이면 통과 · 견본 2개 넘게 다 맞으면 '스스로 채택' 가능 */
  function verifyCand(kind, field, cand, samples) { const spec = kind === 'al_list' ? LIST_FIELDS[field] : (KINDS[kind] || { fields: {} }).fields[field]; if (!spec || !cand) return { n: 0, ok: 0, pass: false };
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
  const TTB_TOL = { salesPoint: 0.5, priceSales: 0.15, rating: 0.15 }; /* SP·판매가는 그사이 바뀜(10/30 전 값) — 넓게 · 근거: 없음(첫 회차 뒤 다시 정함) */
  function ttbCompare(pairs) { const P = (pairs || []).filter((x) => x && x.ttb); const out = { n: P.length, fields: {}, ok: true, worse: [] };
    for (const [tk, nk, ty] of TTB_FIELDS) { let tf = 0, nf = 0, both = 0, ag = 0; for (const x of P) { let a = x.ttb[tk]; if (tk === 'authors' && a) a = String(a).split(/[,(]/)[0]; const A = NORM[ty](a); const B = NORM[ty]((x.now || {})[nk]); if (A != null) tf++; if (B != null) nf++; if (A != null && B != null) { both++; if (ty === 'str' ? keyOf('str', A).slice(0, 6) === keyOf('str', B).slice(0, 6) : same(ty, A, B, TTB_TOL[tk])) ag++; } }
      const f = { ttbFill: P.length ? Math.round((tf / P.length) * 1000) / 1000 : 0, nowFill: P.length ? Math.round((nf / P.length) * 1000) / 1000 : 0, both, agree: both ? Math.round((ag / both) * 1000) / 1000 : null };
      f.ok = f.nowFill >= f.ttbFill - 0.05 && (f.agree == null || f.agree >= (tk === 'salesPoint' ? 0.6 : 0.9)); out.fields[nk] = f; if (!f.ok) { out.ok = false; out.worse.push(nk); } }
    return out; }

  /* ── 알라딘 공개 목록 화면 주소 후보(벤치마킹 '목록 종류' · TTB ItemList 대신) ── 앞에서부터 시도 · 첫 회차에 맞은 주소를 기억(adapt_sel.lists) */
  const LISTS = {
    Bestseller: { label: '베스트셀러', urls: ['/shop/common/wbest.aspx?BestType=Bestseller&BranchType={b}&CID={c}&page={p}&cnt=50', '/shop/common/wbest.aspx?BranchType={b}&BestType=Bestseller&page={p}'] },
    BlogBest: { label: '블로거 베스트', urls: ['/shop/common/wbest.aspx?BestType=BlogBest&BranchType={b}&CID={c}&page={p}', '/shop/common/wblogbest.aspx?BranchType={b}&page={p}'] },
    ItemNewAll: { label: '신간 전체', urls: ['/shop/common/wnew.aspx?NewType=New&BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?BranchType={b}&page={p}'] },
    ItemNewSpecial: { label: '주목할 만한 신간', urls: ['/shop/common/wnew.aspx?NewType=SpecialNew&BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?NewType=Special&BranchType={b}&page={p}'] },
    ItemEditorChoice: { label: '편집자 추천', urls: ['/shop/common/wchoice.aspx?BranchType={b}&CID={c}&page={p}', '/shop/common/wnew.aspx?NewType=EditorChoice&BranchType={b}&CID={c}&page={p}', '/shop/wbrowse.aspx?CID={c}&BrowseTarget=EditorRecommend&page={p}'] },
  };
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

  /* ── 대기열·캐시·차등 갱신 ── 같은 회차에 같은 화면을 두 번 읽지 않고, 오래된 것·중요한 것부터 */
  function makeCache(ttlMs, max) { const M = new Map(); const T = ttlMs || 6 * 3600e3; const X = max || 2000; return { get: (k) => { const e = M.get(k); if (!e) return undefined; if (Date.now() - e.t > T) { M.delete(k); return undefined; } return e.v; }, set: (k, v) => { if (M.size >= X) M.delete(M.keys().next().value); M.set(k, { v, t: Date.now() }); return v; }, size: () => M.size }; }
  /* 차례 점수 = 지난 읽기부터 흐른 시간(시간) × 무게(우리 매물·벤치마킹·연구) ÷ (최근 값이 안 바뀐 횟수 + 1) — 자주 안 바뀌는 것은 덜 자주 */
  function prioritize(items, now) { const t = now || Date.now(); return (items || []).map((x) => ({ ...x, pri: Math.round((Math.max(0, t - (Date.parse(x.lastAt || 0) || 0)) / 3600e3) * (x.w || 1) / ((x.stableN || 0) + 1) * 1000) / 1000 })).sort((a, b) => b.pri - a.pri); }
  /* 바뀐 칸만(차등 갱신) — 전날 값과 같은 칸은 쓰지 않음 */
  function changed(prev, cur) { const o = {}; for (const [k, v] of Object.entries(cur || {})) { if (v == null) continue; const p = (prev || {})[k]; if (p == null || String(p) !== String(v)) o[k] = v; } return o; }

  /* 하루 요약 한 줄(리드가 매일 봄) — 종류마다 점수·깨진 칸·죽은 길·지문 바뀜 */
  function dailyLine(H) { const parts = []; for (const [k, v] of Object.entries((H && H.kinds) || {})) { const j = v.judge || {}; parts.push(`${(KINDS[k] && KINDS[k].label) || (k === 'al_list' ? '알라딘 목록 화면' : k)} ${v.health ? Math.round(v.health.score * 100) : '-'}점${j.broken && j.broken.length ? ` · 깨짐 ${j.broken.join(',')}` : ''}${j.deadPaths && j.deadPaths.length ? ` · 죽은 길 ${j.deadPaths.map((d) => d.field + '/' + d.how).join(',')}` : ''}${v.fp && v.fp.changed ? ' · 화면 구조 바뀜' : ''}${v.guard && v.guard.bad && v.guard.bad.length ? ` · 운영 파서 어긋남 ${v.guard.bad.join(',')}` : ''}`); } return parts.join(' │ '); }

  const api = { VERSION, KINDS, LIST_FIELDS, LIST_BOX, NORM, same, keyOf, isbn10to13, extract, extractList, autoBoxes, fingerprint, fpCompare, healthOf, healthOfList, healthJudge, discover, verifyCand, heal, cssPath, guardCompare, GUARD_MAP, ttbCompare, TTB_FIELDS, LISTS, listUrls, spBatchPlan, spBatchMatch, makeCache, prioritize, changed, dailyLine, vote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowAdapt = api;
})(typeof window !== 'undefined' ? window : this);
