/* col2-go.js — 🔗 바로 가기 (0.1.7 정범님 11/09 밤 '이 창에서 예스24나 알라딘으로 바로 갈 수 있는 게 없네? 넣어줘')
 * 단추를 누르면 **정범님이 평소 쓰는 크롬(로그인된 그 크롬)** 에 새 탭으로 엶 — 도우미가 크롬을 '--user-data-dir 없이' 불러 평소 프로필로 넘김
 *  · 번외 크롬(col2-work-chrome·col2-stat-chrome 등)에서는 열지 않음(그 크롬들은 어디에도 로그인하지 않음 — 약속)
 *  · 이 도우미는 연 탭을 읽거나 조종하지 않음(조종 길 --remote-debugging-port 를 붙이지 않음 · 주소만 넘기고 끝)
 *  · 로거 PC(이름 LOGGER…)에서는 우리 숍·계정 화면(shop:true) 단추를 보이지 않고, 도우미도 거절(약속 0 — 로거에 우리 숍 화면 열기 금지)
 *  · 주소는 이 표에 있는 것만(아무 주소나 열지 않음) · 찾기 낱말은 60자까지 · 줄바꿈·꺾쇠 빼고 주소 꼴로 바꿔 붙임
 * 표의 주소는 운영 웹앱·수집기가 이미 쓰는 주소에서 따옴(src/app.html · src/readnow-collector.src.js) */
(function (root) {
  'use strict';
  const AL = 'https://www.aladin.co.kr', YU = 'https://uscm.yes24.com', YW = 'https://www.yes24.com';
  /* g: 무리(al 알라딘 · y24 예스24 · doc 설명서) · shop: 우리 숍·판매자 계정 화면(로거에서 숨김·거절) · q: 찾기 낱말을 붙이는 주소 */
  const LINKS = [
    { id: 'al-home', g: 'al', icon: '🏠', t: '알라딘 첫 화면', url: AL + '/' },
    { id: 'al-find', g: 'al', icon: '🔎', t: '알라딘 중고 찾기', url: AL + '/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=', q: true },
    { id: 'al-shop', g: 'al', icon: '🛒', t: '우리 숍', url: AL + '/shop/usedshop/wshopitem.aspx?SC=996008', shop: true },
    { id: 'al-scm', g: 'al', icon: '🧰', t: '샵매니저 첫 화면', url: AL + '/scm/wmain.aspx', shop: true },
    { id: 'al-orders', g: 'al', icon: '📦', t: '중고 판매 관리(주문)', url: AL + '/scm/worders.aspx', shop: true },
    { id: 'al-ship', g: 'al', icon: '🚚', t: '발송 관리', url: AL + '/scm/worder_delivery.aspx?orderstep=4', shop: true },
    { id: 'al-reg', g: 'al', icon: '➕', t: '상품 등록', url: AL + '/scm/wrecord.aspx', shop: true },
    { id: 'y24-scm', g: 'y24', icon: '🟦', t: '예스24 판매관리', url: YU + '/', shop: true },
    { id: 'y24-prd', g: 'y24', icon: '📋', t: '예스24 등록상품', url: YU + '/Product/ProductList', shop: true },
    { id: 'y24-find', g: 'y24', icon: '🔎', t: '예스24 중고 찾기', url: YW + '/product/search?domain=USED_GOODS&query=', q: true, shop: true },
    { id: 'manual', g: 'doc', icon: '📘', t: '웹앱 설명서(판 보관)', url: 'https://github.com/jerrycson/readnow-scripts/tree/main/manual' },
  ];
  const GROUPS = { al: '알라딘', y24: '예스24', doc: '설명서' };
  const isLogger = (kind) => kind === 'logger';
  const forPc = (kind) => LINKS.filter((l) => !(isLogger(kind) && l.shop)); /* 로거는 알라딘 공개 화면·설명서만 */
  const cleanQ = (q) => String(q == null ? '' : q).replace(/[\r\n\t<>"]/g, ' ').trim().slice(0, 60);
  /* 열 주소 — 표에 없으면 null · 로거에서 우리 숍·계정 화면이면 { err } */
  function urlOf(id, q, kind) { const l = LINKS.find((x) => x.id === id); if (!l) return { err: '모르는 바로 가기: ' + String(id).slice(0, 40) };
    if (isLogger(kind) && l.shop) return { err: '로거 PC에서는 우리 숍·계정 화면을 열지 않음(약속 0)', logger: true };
    const qq = cleanQ(q); return { url: l.q ? l.url + encodeURIComponent(qq) : l.url, link: l, q: qq }; }
  /* 평소 크롬 프로필 이름(비우면 크롬이 마지막에 쓴 프로필) — 예: Default · Profile 1 */
  const profOk = (p) => /^[\w .-]{0,40}$/.test(String(p == null ? '' : p));
  /* 크롬에 넘길 인자 — 평소 프로필(데이터 폴더를 따로 주지 않음) · 조종 길 없음 · 새 탭 */
  function chromeArgs(url, prof) { const a = []; if (prof && profOk(prof)) a.push('--profile-directory=' + String(prof).trim()); a.push(url); return a; }
  const api = { LINKS, GROUPS, forPc, urlOf, cleanQ, profOk, chromeArgs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Go = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
