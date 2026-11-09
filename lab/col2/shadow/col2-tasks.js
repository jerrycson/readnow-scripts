/* col2-tasks.js — (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 운영 수집기의 로그인 없는 일 목록 · 그림자 일 차림표 (순수 · Node·브라우저 같이)
 * 일마다: 운영 일 이름(JOBS 열쇠) · 읽는 주소 꼴 · 해석 함수(운영 공용 파일 또는 운영 본체에서 떼어 온 함수 — 고치지 않음) · 운영이 쓰는 Firestore 칸 · 누가(로거/사무실)
 *   reader  al = 번외 크롬 알라딘 탭 안 떨어진 칸에서 fetch(쿠키 없이) → 해석 · ext = 도우미(Node)가 운영과 같은 ReadnowExt.run(쿠키 없이 · 손님으로)
 *           dyn = (0.1.10) 상품 화면을 번외 크롬 따로 된 칸 탭에 실제로 그려 운영 본체 getProductFull 그대로 · nb = 운영 본체 nbMarketJob 그대로(메모리 받침) · kp = KPIPA 탭에서 운영 본체 kp* 함수 그대로
 *           외부 정보 render = 도우미 /render 꼴로 그려 운영 extRenderHelper로 해석 · keys = 웹앱이 메모리로만 넘긴 운영 키(사무실 PC만)
 *   state   run = 그림자로 돎 · hold = 아직 안 돎(까닭 why) — 0.1.10부터 27가지 모두 run
 *   who     logger = 🌐 로거 고유 일(알라딘 비로그인 · 로거만 · 사무실 PC는 안 함) · office = 사무실 PC만 · share = 나눠 함(외부 정보 — ISBN 끝자리로 나눠 겹치지 않음)
 *   map     { 운영 칸: 그림자 칸 } — 견줄 칸 · move = 시간 따라 움직이는 값(운영이 읽은 뒤 바뀔 수 있음 → 까닭 '때가 다름'으로 밝힘)
 * 결과는 col2_jobs/<일>_<문서>(한 건) · col2_jday/<날짜>_<PC>(하루 요약 · 일마다 같음 비율·다름 까닭·넘길 수 있음)에만 씀 — 운영 칸에는 쓰지 않음 */
(function (root) {
  'use strict';
  const BOOK_FIXED = ['title', 'subtitle', 'series', 'contributors', 'publisher', 'aladinPublisherId', 'pubDate', 'originalTitle', 'isbn13', 'pages', 'size', 'weightG', 'categories', 'basicExtra'];
  const PRODUCT = '/shop/wproduct.aspx?ItemId={itemId}';
  const T = [
    { k: 'product', name: '📘 공개 상품 화면 — 도서 정보', ops: ['market', 'poolInfo', 'explore', 'benchDetail'], cls: 'pub', reader: 'al', path: PRODUCT, parse: 'P.parseProductPage', col: 'prd_books', id: 'bookId', fields: BOOK_FIXED, input: 'book', who: 'office', state: 'run',
      note: '0.1.2부터 사무실 PC에서 돌던 그림자(그대로 · 자동 읽기 차례표 pool) — 로거와 같은 목록을 읽지 않게 로거는 이 일을 하지 않음' },
    { k: 'metrics', name: '📈 시장 지표 — 상품 화면 값', ops: ['market', 'metricsReq', 'metricsAuto'], cls: 'pub', reader: 'al', path: PRODUCT, parse: 'P.parseProductPage', col: 'prd_book_metrics', id: 'bookId', input: 'book', who: 'logger', state: 'run',
      map: { priceList: 'priceList', priceSales: 'priceSales', salesPoint: 'salesPoint', rating: 'rating', commentCount: 'commentCount', reviewCount: 'reviewCount', availability: 'availability' }, move: ['priceSales', 'salesPoint', 'rating', 'commentCount', 'reviewCount', 'availability'] },
    { k: 'usedPage', name: '🏷 온라인 중고 첫 쪽', ops: ['market'], cls: 'pub', reader: 'al', path: '/shop/UsedShop/wuseditemall.aspx?ItemId={itemId}&TabType=0', parse: 'P.parseUsedPage', col: 'prd_book_metrics', id: 'bookId', input: 'book', who: 'logger', state: 'run',
      map: { usedTotal: 'usedTotal', usedTabs: 'tabs', usedMins: 'mins', buyback: 'buyback' }, move: ['usedTotal', 'usedTabs', 'usedMins', 'buyback'], feeds: 'shop' },
    { k: 'shopSum', name: '🏪 숍 요약 — 6개월 평가 수·등급·품절취소율', ops: ['rev6mAll', 'rev6mStale', 'rev6m'], cls: 'pub', reader: 'al', path: '/shop/usedshop/wshopitem.aspx?SC={sc}', parse: 'S.parseShopSummary', col: 'sellers', id: 'sc_{sc}', input: 'shop', who: 'logger', state: 'run',
      map: { rev6m: 'rev6m', shopTotal: 'total', aladinGrade: 'grade', isPro: 'isPro', cancel3m: 'cancel3m' }, move: ['rev6m', 'shopTotal', 'cancel3m'] },
    { k: 'survey', name: '⭐ 숍 구매 평가 첫 쪽(날짜별 만족·보통·불만족)', ops: ['revTop', 'revAll'], cls: 'pub', reader: 'al', path: '/shop/UsedShop/wshopsurvey.aspx?SC={sc}&page=1', parse: 'S.parseSurveyPage', col: 'seller_review_daily', id: 'sc_{sc}', input: 'shop', who: 'logger', state: 'run', shape: 'survey' },
    { k: 'bench', name: '🎯 집중 벤치마킹 — 숍 목록 첫 쪽', ops: ['bench', 'benchForce', 'benchHelp', 'benchResume'], cls: 'pub', reader: 'al', path: '/shop/usedshop/wshopitem.aspx?SC={sc}&ViewType=Simple&ViewRowsCount=48&SortOrder=6&page=1', parse: 'L.benchParse', col: 'bench_items', id: '{sc}_{id}', input: 'bench', who: 'logger', state: 'run', rows: 10,
      map: { title: 't', price: 'p', grade: 'g' }, move: ['price'], note: '해석 함수는 운영 수집기 본체(benchParse·benchParseSimple·coverKey)를 그대로 받아 떼어 씀 · 대상 숍은 운영 app_settings/bench(읽기만)' },
    { k: 'dynamic', name: '👥 구매자 분포·함께 산 책', ops: ['dynamic', 'dynamic0', 'dynAll'], cls: 'pub', reader: 'dyn', path: PRODUCT, col: 'prd_book_metrics', id: 'bookId', input: 'book', who: 'logger', state: 'run', cost: 3,
      map: { buyerDist: 'buyerDist', relationBuyIds: 'relationBuy', clickRelation: 'clickRelation' }, move: ['buyerDist', 'relationBuyIds', 'clickRelation'], at: 'dynAt',
      note: '(0.1.10) 번외 크롬 안 쿠키 없는 따로 된 칸의 보이지 않는 탭에 상품 화면을 실제로 그려, 운영 본체 getProductFull(숨은 창을 내려 보며 지연 로딩 칸이 찰 때까지 기다림)을 글자 그대로 떼어 그 화면에 부름 · 운영처럼 요청 3장 몫으로 셈' },
    { k: 'nbMarket', name: '🔍 새상품 없는 상품 시세(알라딘 중고 검색)', ops: ['nbMarket'], cls: 'pub', reader: 'nb', col: 'prd_market_nobook', id: '{key}', input: 'nb', who: 'office', state: 'run',
      map: { median: 'median', low: 'low', n: 'n', candSig: 'candSig' }, move: ['median', 'low', 'n', 'candSig'], at: 'at',
      note: '(0.1.10) 검색어가 우리 상품 이름이라 사무실 PC만(로거엔 우리 매물·상품 이름을 두지 않음 — 약속 0) · 대상 = 운영이 이미 본 prd_market_nobook 문서(웹앱이 대신 넘김 · 읽기만) · 운영 본체 nbMarketJob을 글자 그대로 떼어 메모리 칸 받침으로 한 건만 돌림(운영 칸엔 안 씀)' },
    { k: 'kpipa', name: '📚 출판 판매 통계(KPIPA)', ops: ['kpipa'], cls: 'ext', reader: 'kp', col: 'mkt_kpipa', id: '{date}', input: 'day', who: 'office', state: 'run', cost: 3,
      note: '(0.1.10) 운영 본체 kpParse·kpFetch·kpToken·kpReq·kpSig·kpYmd·kpAdd를 글자 그대로 떼어 KPIPA 화면 탭(쿠키 없는 따로 된 칸)에서 부름 · 하루 한 번 최근 7일(판매채널별·도서유형별) · 날짜마다 운영 mkt_kpipa/<날짜>와 견줌 · 공용 파일로 옮기는 안은 README' },
  ];
  /* 🔎 외부 정보(운영 extBurst·extJob) — 출처마다 한 일 · 칸 = 운영 GROUPS[grp].col · 견주기 = 운영 저장 지문(ReadnowExt.sig · sameSig)
   *  키 없는 화면·공개 API만 돎 · 키가 필요한 공식 API는 hold(키는 app_secrets에만) · 그려 읽기만 되는 출처(네이버 도서)는 hold */
  const EXT = [
    ['kyobo', '교보문고', 'basic', 'run'], ['yes24', '예스24 도서 정보', 'basic', 'run'], ['naverbook', '네이버 도서(화면)', 'basic', 'render'], ['google', '구글 북스', 'basic', 'run'],
    ['ttb', '알라딘 TTB(공식)', 'basic', 'key'], ['kakao', '카카오 책 검색', 'basic', 'key'], ['nl', '국립중앙도서관 ISBN 서지', 'basic', 'key'],
    ['joongmo', '중고닷(통합 장터)', 'used', 'run'], ['yes24used', '예스24 중고', 'used', 'run'], ['bunjang', '번개장터', 'used', 'run'], ['joongna', '중고나라', 'used', 'run'], ['daangn', '당근', 'used', 'run'], ['dvdprime', 'DVDPrime 장터', 'used', 'run'],
    ['ebay', 'eBay(공식)', 'foreign', 'key'], ['abebooks', 'AbeBooks', 'foreign', 'run'], ['lib', '도서관 정보나루', 'lib', 'key'], ['ridi', '리디(전자책)', 'ebook', 'run'],
  ];
  const GCOL = { basic: 'ext_basic', used: 'ext_used', foreign: 'ext_foreign', lib: 'ext_lib', ebook: 'ext_ebook' };
  /* (0.1.10) 그려 읽기(render)는 번외 크롬 따로 된 칸 탭으로 돎(운영 도우미 /render와 같은 꼴 · 해석은 운영 본체 extRenderHelper 그대로) · 키(key)는 사무실 PC만(웹앱이 메모리로만 넘김 · 로거엔 안 줌) */
  for (const [src, label, grp, st] of EXT) T.push({ k: 'ext.' + src, src, name: '🔎 ' + label, ops: ['extBurst'], cls: 'ext', reader: 'ext', col: GCOL[grp], grp, id: '{isbn}', input: 'book', who: st === 'key' ? 'office' : 'share', state: 'run',
    ...(st === 'key' ? { keys: true, note: '운영 키(Firestore app_secrets/ext.keys)는 이 PC 운영 웹앱이 읽어 번외 도우미 메모리로만 넘김(파일·기록·Firestore에 안 남김) · 우리 계정 키라 로거엔 주지 않음 → 사무실 PC만' } : st === 'render' ? { render: true, note: '글자로 받으면 늘 막힘(418) — 번외 크롬 따로 된 칸 탭에 그려 읽음' } : {}) });
  T.push({ k: 'ext.fx', src: 'fx', name: '💱 환율(수출입은행 → frankfurter)', ops: ['extBurst'], cls: 'ext', reader: 'ext', col: 'ext_fx', id: '{day}', input: 'day', who: 'share', state: 'run', note: '키 없는 frankfurter 길만(수출입은행은 키 필요) — 운영과 출처가 다르면 까닭 \'출처 다름\'' });

  /* (0.1.10) 🔑 키 규칙 — 운영 키는 Firestore app_secrets/ext.keys(운영 수집기 extKeys가 읽는 곳 · 웹앱 설정 ⑱에서 넣음)
   *  번외는 그 PC 운영 웹앱이 대신 읽어 도우미 메모리로만 넘김(POST /relay/keys) · 파일·기록창·col2_*·상태엔 이름만(값 없음)
   *  로거: 어느 키도 받지 않음 — TTB는 우리 알라딘 계정(판매자와 같은 계정)으로 받은 키 · 나머지도 우리 이름으로 받은 개발자 계정 키(로거가 우리와 엮이지 않게 · 약속 0) */
  const KEY_RULE = { aladinTtb: { who: '우리 알라딘 계정의 TTB 키 — 판매자 계정과 엮임', logger: false }, kakaoRest: { who: '우리 카카오 개발자 계정', logger: false }, nlKey: { who: '우리 이름으로 받은 국립중앙도서관 인증키', logger: false },
    d4lKey: { who: '우리 이름으로 받은 도서관 정보나루 인증키', logger: false }, ebayAppId: { who: '우리 eBay 개발자 계정', logger: false }, ebayCertId: { who: '우리 eBay 개발자 계정(비밀 짝)', logger: false },
    googleBooks: { who: '우리 구글 클라우드 계정(없어도 됨)', logger: false }, eximKey: { who: '우리 이름으로 받은 수출입은행 인증키(없어도 됨)', logger: false } };
  const KEY_OK = Object.keys(KEY_RULE);
  const keyLogger = (k) => !!(KEY_RULE[k] && KEY_RULE[k].logger);
  const byK = {}; T.forEach((t) => (byK[t.k] = t));
  /* 이 PC가 할 일 — 로거: 로거 고유 일만(+ 외부 정보는 나눔이 켜졌을 때 ISBN 끝자리 홀수만) · 사무실: 로거 고유 일은 하지 않음(+ 외부 정보는 나눔이면 짝수만) */
  function plan(kind, cfg) { cfg = cfg || {}; const off = new Set(Array.isArray(cfg.off) ? cfg.off : []); const lg = kind === 'logger';
    return T.filter((t) => t.state === 'run' && !off.has(t.k) && (lg ? t.who === 'logger' || (t.who === 'share' && cfg.extShare === true) : t.who === 'office' || t.who === 'share')).map((t) => t.k); }
  /* 외부 정보 나눔: 같은 책을 두 PC가 묻지 않게(같은 목록·차례를 이어받지 않음) — 나눔이 꺼지면 사무실 PC가 다 함 */
  const shard = (isbn) => (+String(isbn || '').replace(/\D/g, '').slice(-1) || 0) % 2;
  function shareOk(kind, key, cfg) { if (!(cfg && cfg.extShare === true)) return kind !== 'logger'; return kind === 'logger' ? shard(key) === 1 : shard(key) === 0; }
  /* 주소 — 정한 꼴의 알라딘 공개 화면만(판매자 센터·로그인·계정 화면은 꼴에 없음) · 우리 숍은 열지 않음 */
  const ALLOW = [/^\/shop\/wproduct\.aspx\?ItemId=\d{1,13}$/, /^\/shop\/UsedShop\/wuseditemall\.aspx\?ItemId=\d{1,13}&TabType=0$/, /^\/shop\/usedshop\/wshopitem\.aspx\?SC=\d{1,10}(&ViewType=Simple&ViewRowsCount=48&SortOrder=6&page=1)?$/, /^\/shop\/UsedShop\/wshopsurvey\.aspx\?SC=\d{1,10}&page=1$/];
  function pathOf(t, a, own) { if (!t || !t.path) return null; if (a && a.sc != null && (own || []).map(String).includes(String(a.sc))) return null; let bad = false;
    const p = t.path.replace(/\{(\w+)\}/g, (m, k) => { const v = a ? a[k] : null; if (v == null || !/^\d{1,13}$/.test(String(v))) bad = true; return String(v); }); return !bad && ALLOW.some((re) => re.test(p)) ? p : null; }
  const docId = (t, a) => String(t.id || '').replace(/\{(\w+)\}/g, (m, k) => String(a && a[k] != null ? a[k] : ''));

  /* 하루 셈 — 일마다 { n(견줌) · same · diff · un(까닭 모를 다름) · why{까닭:수} · fail · noprod · skip } */
  const dayNew = (d) => ({ d, t: {} });
  function dayAdd(D, k, v, reasons) { const s = D.t[k] || (D.t[k] = { n: 0, same: 0, diff: 0, un: 0, why: {}, fail: 0, noprod: 0, skip: 0 });
    if (v === 'same' || v === 'diff') { s.n++; s[v]++; } else if (v === 'fail') s.fail++; else if (v === 'skip') s.skip++; else s.noprod++;
    if (v === 'diff') { let un = false; for (const r of reasons || []) { s.why[r] = (s.why[r] || 0) + 1; if (UNEXPLAINED.includes(r)) un = true; } if (un) s.un++; }
    return s; }
  const UNEXPLAINED = ['diff', 'lack'];
  const WHY = { diff: '다름(까닭 모름)', lack: '그림자 칸 빔(해석이 달라졌을 수)', move: '때가 다름(움직이는 값 · 운영이 읽은 뒤 바뀜)', fill: '운영 칸 빔(그림자만 값)', seen: '운영도 지금 이 값을 봄(처음 값 지킴)', ext: '출처 다름(운영은 바깥 정보 값)', old: '운영 값이 오래됨(그 뒤 바뀔 수 있음)', none: "운영은 '없음' 전 값을 지킴", cfg: '설정 차이(번외는 기본 설정)' };
  /* '넘길 수 있음' — 하루 표본 n ≥ minN · 까닭 모를 다름(un) 0 · 못 읽음 비율 ≤ maxFailPct% (같음 비율은 보여 주기만 — 까닭을 다 밝힌 다름은 막지 않음) */
  function passOf(s, P) { P = { minN: 30, maxFailPct: 20, ...(P || {}) }; s = s || { n: 0, same: 0, diff: 0, un: 0, fail: 0, noprod: 0 };
    const tried = s.n + s.fail; const failPct = tried ? Math.round((s.fail / tried) * 1000) / 10 : 0; const rate = s.n ? Math.round((s.same / s.n) * 1000) / 10 : null;
    const why = []; if (s.n < P.minN) why.push(`표본 ${s.n}/${P.minN}`); if (s.un) why.push(`까닭 모를 다름 ${s.un}`); if (failPct > P.maxFailPct) why.push(`못 읽음 ${failPct}%`);
    return { n: s.n, rate, failPct, un: s.un || 0, can: !why.length, why: why.join(' · ') || '넘길 수 있음', rule: `하루 표본 ${P.minN}개 이상 · 까닭 모를 다름 0 · 못 읽음 ${P.maxFailPct}% 이하` }; }
  /* 숍 평가 쪽 → 날짜별 [만족, 보통, 불만족] — 첫 쪽에 다 든 날만(가장 오래된 날은 다음 쪽에 이어질 수 있어 뺌) */
  function surveyDays(pg) { const R = (pg && pg.rows) || []; const o = {}; for (const x of R) { if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(String(x.d || ''))) continue; const a = o[x.d] || (o[x.d] = [0, 0, 0]); const i = { good: 0, mid: 1, bad: 2 }[x.r]; if (i != null) a[i]++; }
    const ds = Object.keys(o).sort(); if ((pg && pg.lastPage) > 1 && ds.length) delete o[ds[0]]; return o; }
  const api = { KEY_RULE, KEY_OK, keyLogger, TASKS: T, byK, EXT, GCOL, plan, shard, shareOk, pathOf, docId, ALLOW, dayNew, dayAdd, passOf, WHY, UNEXPLAINED, surveyDays, BOOK_FIXED };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Tasks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
