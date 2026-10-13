/* readnow-ext-core.js — 🌐 외부 정보 엔진 (공용 파일 · 웹앱·PC 수집기가 같은 기준을 씀 · 나중에 클라우드도 그대로)
 * 알라딘 밖에서 책 정보를 모음 — ① 기본 정보(교보·예스24·구글 북스 + 공식 API: 알라딘 TTB·카카오·네이버·국립중앙도서관)
 *   ② 중고 시세(예스24 중고·번개장터·중고나라·당근 · (0.3.0) DVDPrime 장터 — 영상·음반만) ③ 외국 시세(eBay 공식 API 먼저, AbeBooks 보조) ④ 도서관 대출(도서관 정보나루)
 *   ⑤ 전자책(리디) ⑥ 환율(한국수출입은행 → 안 되면 frankfurter)
 * 이 파일은 '어떻게 묻고 어떻게 읽는지'와 '숫자 계산'만 — 요청을 보내는 길(http)은 쓰는 쪽이 넣어 줌:
 *   수집기 = GM_xmlhttpRequest (다른 사이트도 막힘 없이) · 클라우드 = fetch · 시험 = 가짜 응답
 * 기록은 쓰지 않음(쓰기는 수집기가: 같은 내용이면 다시 쓰지 않고, 바뀌면 옛 값을 ext_hist에 남긴 뒤 바꿈).
 * 화면 모양이 바뀌어 못 읽으면 '못 읽음'과 함께 받은 화면 일부(probe)를 돌려줌 → 수집기가 ext_probe에 남겨 나중에 읽는 법을 고침. 추측으로 채우지 않음.
 * ISBN이 있는 책 정보(교보·예스24)는 받은 상품 페이지 안에 그 ISBN이 정확히 있을 때만 받아들임(다른 책을 잘못 붙이지 않게). */
(function (root) {
  const VERSION = '0.4.4'; // (0.4.4) 리디 검색 화면 HTML 칸에서 책·저자·소장가 읽기(화면 속 JSON이 없어짐) // (0.4.3) 네이버 책 검색 종료(2026-07-31) — 묻지 않음 · 장터 글은 제목이 닮은 것만 · 못 읽은 화면을 글·자료만 더 많이 남김 // (0.4.2) 못 읽음(HTTP 오류)도 응답 머리를 남김(ext_probe · 알림 줄에 응답 앞부분) · 네이버·eBay 키 앞뒤 빈칸 무시 // (0.4.1) DVDPrime 판매자 연락처(전화·메일·카톡 아이디·오픈채팅)를 그대로 기록 — 판매자 = 매입처 · 한글로 적은 번호도 숫자로 // (0.4.0) DVDPrime 글 화면 읽기(dpPost) — 줄마다 상품·값(사람마다 다른 적는 법)·판매 상태(가운데 줄·판완)·상품 상태 · 판매자·글 날짜·조회 수·댓글 수·택배·직거래·연락 방법

  /* ── 키 (웹앱 설정 ⑱에서 넣음 → Firebase app_secrets/ext · 백업 파일엔 넣지 않음) ── */
  const KEYS = [
    { k: 'aladinTtb', label: '알라딘 TTB 키', for: ['ttb'], get: 'https://www.aladin.co.kr/ttb/wblog_manage.aspx', note: '알라딘 블로그 › TTB 키 발급 (하루 5,000번)' },
    { k: 'kakaoRest', label: '카카오 REST API 키', for: ['kakao'], get: 'https://developers.kakao.com/console/app', note: '카카오 개발자 › 내 애플리케이션 › 앱 키 › REST API 키' },
    { k: 'naverId', label: '네이버 Client ID', for: ['naver'], get: 'https://developers.naver.com/apps/#/register', note: '네이버 개발자 › 애플리케이션 등록(검색 API) › Client ID (하루 25,000번)' },
    { k: 'naverSecret', label: '네이버 Client Secret', for: ['naver'], get: 'https://developers.naver.com/apps/#/list', note: '같은 애플리케이션의 Client Secret', secret: true },
    { k: 'nlKey', label: '국립중앙도서관 ISBN 서지 API 인증키', for: ['nl'], get: 'https://www.nl.go.kr/NL/contents/N31101030700.do', note: '국립중앙도서관 › 서지정보유통지원시스템 OPEN API 인증키 신청' },
    { k: 'googleBooks', label: '구글 북스 API 키', for: ['google'], get: 'https://console.cloud.google.com/apis/credentials', note: '없으면 키 없이 — 하루 묻는 수가 적게 막힘. 넣으면 하루 1,000번 이상', optional: true },
    { k: 'd4lKey', label: '도서관 정보나루 인증키', for: ['lib'], get: 'https://www.data4library.kr/apiUtilization', note: '도서관 정보나루 › 마이페이지 › 인증키 (처음 하루 500번 · 승인 뒤 늘어남)' },
    { k: 'ebayAppId', label: 'eBay App ID (Client ID)', for: ['ebay'], get: 'https://developer.ebay.com/my/keys', note: 'eBay 개발자 › Application Keys › Production 키 묶음의 App ID' },
    { k: 'ebayCertId', label: 'eBay Cert ID (Client Secret)', for: ['ebay'], get: 'https://developer.ebay.com/my/keys', note: '같은 Production 키 묶음의 Cert ID', secret: true },
    { k: 'eximKey', label: '한국수출입은행 환율 API 인증키', for: ['fx'], get: 'https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2&viewtype=C', note: '수출입은행 Open API › 현재환율 인증키 (없으면 frankfurter로 대신)', optional: true },
  ];

  /* ── 묶음 (같은 묶음의 출처끼리 한 책에 대해 이 차례로) ── */
  const GROUPS = {
    basic: { label: '기본 정보', col: 'ext_basic', refreshDays: 120, why: '제목·지은이·출판사·출간일·쪽수·크기·무게·정가·소개 — 알라딘에 없거나 틀린 칸을 채우고 서로 맞춰 봄' },
    used: { label: '중고 시세 (국내 다른 곳)', col: 'ext_used', refreshDays: 7, why: '예스24 중고·번개장터·중고나라·당근에 같은 책이 얼마에 나왔는지 · 팔린 값' },
    foreign: { label: '외국 시세', col: 'ext_foreign', refreshDays: 14, why: '외국 책(원서)을 외국에서 사 오면 드는 값(배송 포함, 원화) — 원서 판매가 기준' },
    lib: { label: '도서관 대출', col: 'ext_lib', refreshDays: 30, why: '전국 공공도서관 대출 수·월별 흐름·함께 빌린 책 — 꾸준히 찾는 책인지' },
    ebook: { label: '전자책', col: 'ext_ebook', refreshDays: 30, why: '리디에 전자책이 있는지·값 — 전자책이 싸면 종이 중고 수요가 줄 수 있음' },
  };

  /* ── 출처 (on 기본값 · 하루 최대 cap · 요청 사이 paceMs) — 화면 읽기 출처는 그 사이트가 막지 않게 낮게 시작(설정 ⑱에서 늘림) · 수집기는 로그인 쿠키 없이(손님으로) 물음 ── */
  const SOURCES = {
    kyobo: { grp: 'basic', label: '교보문고', kind: 'page', host: 'search.kyobobook.co.kr', keys: [], cap: 500, paceMs: 2500 },
    yes24: { grp: 'basic', label: '예스24', kind: 'page', host: 'www.yes24.com', keys: [], cap: 500, paceMs: 2500 },
    google: { grp: 'basic', label: '구글 북스', kind: 'api', host: 'www.googleapis.com', keys: ['googleBooks'], keyOptional: true, cap: 900, paceMs: 1200 },
    ttb: { grp: 'basic', label: '알라딘 TTB (공식)', kind: 'api', host: 'www.aladin.co.kr', keys: ['aladinTtb'], cap: 4500, paceMs: 800 },
    kakao: { grp: 'basic', label: '카카오 책 검색 (공식)', kind: 'api', host: 'dapi.kakao.com', keys: ['kakaoRest'], cap: 5000, paceMs: 500 },
    naver: { grp: 'basic', label: '네이버 책 검색 (공식 · 2026-07-31 서비스 종료)', ended: '2026-07-31', /* (0.4.3) 네이버가 책 검색 API를 2026-07-31에 끝냄(NAVER API HUB로 옮기지 않음) — 응답 SE05 '존재하지 않는 검색 api' · 묻지 않음 */ kind: 'api', host: 'openapi.naver.com', keys: ['naverId', 'naverSecret'], cap: 5000, paceMs: 500 },
    nl: { grp: 'basic', label: '국립중앙도서관 ISBN 서지 (공식)', kind: 'api', host: 'www.nl.go.kr', keys: ['nlKey'], cap: 3000, paceMs: 800 },
    joongmo: { grp: 'used', label: '중고닷 (통합 검색)', kind: 'page', host: 'www.joongmo.com', keys: [], cap: 600, paceMs: 3000 }, /* (0.2.0) 당근·중고나라·번개장터·헬로마켓·후르츠를 한 번에 — 정범 지정: 중고 검색은 여기 먼저, 없을 때만 각 장터에 직접 */
    yes24used: { grp: 'used', label: '예스24 중고', kind: 'page', host: 'www.yes24.com', keys: [], cap: 400, paceMs: 3000 },
    bunjang: { grp: 'used', label: '번개장터', kind: 'page', host: 'api.bunjang.co.kr', keys: [], cap: 400, paceMs: 3000 },
    joongna: { grp: 'used', label: '중고나라', kind: 'page', host: 'web.joongna.com', keys: [], cap: 300, paceMs: 3500 },
    daangn: { grp: 'used', label: '당근', kind: 'page', host: 'www.daangn.com', keys: [], cap: 300, paceMs: 3500 },
    dvdprime: { grp: 'used', label: 'DVDPrime 장터', kind: 'page', host: 'dvdprime.com', keys: [], cap: 200, paceMs: 4000, media: ['video', 'music'] }, /* (0.3.0) 영상·음반만 — 책은 묻지 않음 */
    ebay: { grp: 'foreign', label: 'eBay (공식 API)', kind: 'api', host: 'api.ebay.com', keys: ['ebayAppId', 'ebayCertId'], cap: 4000, paceMs: 700 },
    abebooks: { grp: 'foreign', label: 'AbeBooks (보조)', kind: 'page', host: 'www.abebooks.com', keys: [], cap: 200, paceMs: 4000 },
    lib: { grp: 'lib', label: '도서관 정보나루 (공식)', kind: 'api', host: 'data4library.kr', keys: ['d4lKey'], cap: 450, paceMs: 1000 },
    ridi: { grp: 'ebook', label: '리디', kind: 'page', host: 'ridibooks.com', keys: [], cap: 300, paceMs: 3000 },
  };
  const ORDER = ['kyobo', 'yes24', 'google', 'ttb', 'kakao', 'naver', 'nl', 'joongmo', 'yes24used', 'bunjang', 'joongna', 'daangn', 'dvdprime', 'ebay', 'abebooks', 'lib', 'ridi'];
  /* 기본 정보 칸마다 어느 출처를 먼저 믿는지 (정범 지정: 교보 → 예스24 → 구글 북스, 그 뒤 공식 API) — 설정 ext.basicOrder로 바꿈 */
  const BASIC_ORDER = ['kyobo', 'yes24', 'google', 'ttb', 'nl', 'kakao', 'naver'];

  /* 설정 처음 값 (app_settings/ext) — 숫자는 모두 웹앱 설정 ⑱에서 바꿈 */
  const CFG_DEF = {
    on: true,              // 자동 채우기 켬
    sim: 0.6,              // 중고 장터·전자책 글이 '같은 책'이라고 볼 제목 닮음 정도(0~1) — 장터 글엔 ISBN이 없어 제목으로만 맞춤
    foreignKr: false,      // 외국 시세를 한국 책(ISBN 978-89·979-11)에도 볼지 — 꺼 두면 외국 책만
    basicOrder: BASIC_ORDER,
    usedMinPrice: 1000,    // 장터 글 값이 이보다 낮으면(나눔·0원·'가격 문의') 시세에서 뺌
    gradeMap: { 1000: 'new', 1500: 'new', 2750: '최상', 4000: '상', 5000: '중', 6000: '하' }, // eBay 상태 번호 → 우리 등급 (책: Brand New / Like New / Very Good / Good / Acceptable)
    src: {},               // 출처마다 { on, cap, refreshDays } 덮어쓰기
  };
  const cfgOf = (c) => { const o = { ...CFG_DEF, ...(c || {}) }; o.src = {}; for (const k of ORDER) { const d = SOURCES[k]; const u = ((c && c.src) || {})[k] || {}; o.src[k] = { on: u.on !== false && !d.ended, cap: Math.max(0, +(u.cap ?? d.cap) || 0), refreshDays: Math.max(1, +(u.refreshDays ?? GROUPS[d.grp].refreshDays) || 1) }; } o.gradeMap = { ...CFG_DEF.gradeMap, ...((c && c.gradeMap) || {}) }; return o; };
  /* 중고닷이 대신 찾아 주는 장터 — 중고닷에서 같은 책을 찾았으면 이 장터들엔 직접 묻지 않음 */
  const VIA_JOONGMO = ['bunjang', 'joongna', 'daangn'];
  /* 외부 정보 문서 번호: ISBN이 있으면 ISBN · 없으면(DVD·CD 등) 바코드 'B…' · 그것도 없으면 알라딘 상품코드 'U…' — ISBN이 없는 상품은 중고 시세만 봄 */
  const keyOf = (l) => { const i = String((l && l.isbn13) || '').replace(/[^0-9]/g, ''); if (/^97[89]\d{10}$/.test(i)) return i; const b = String((l && l.barcode) || '').replace(/[^0-9]/g, ''); if (b.length >= 8) return 'B' + b; return l && l.usedCode ? 'U' + String(l.usedCode).replace(/[^0-9A-Za-z_-]/g, '') : null; };
  const isIsbnKey = (k) => /^97[89]\d{10}$/.test(String(k || ''));
  const keysReady = (k, K) => { const s = SOURCES[k]; if (!s) return false; return s.keyOptional || s.keys.every((x) => K && String(K[x] || '').trim()); };

  /* ══════════ 작은 도구 ══════════ */
  const isKrIsbn = (isbn) => /^(97889|97911)/.test(String(isbn || ''));
  const digits = (s) => String(s == null ? '' : s).replace(/[^\d]/g, '');
  const toNum = (s) => { if (s == null) return null; if (typeof s === 'number') return Number.isFinite(s) ? s : null; const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; };
  const decodeEnt = (s) => String(s == null ? '' : s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)));
  const strip = (s) => decodeEnt(String(s == null ? '' : s).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t\r\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  const clip = (s, n) => { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; };
  const ymd = (s) => { s = String(s || ''); let m = s.match(/(\d{4})\s*[-.\/년]\s*(\d{1,2})\s*[-.\/월]\s*(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = s.match(/^(\d{4})(\d{2})(\d{2})$/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; m = s.match(/(\d{4})\s*[-.\/년]\s*(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}`; m = s.match(/^(\d{4})$/); return m ? m[1] : null; };
  /* 제목 맞추기: 괄호·부제·특수문자·'[중고]' 같은 말머리를 빼고, 글자 두 개씩 묶어 겹치는 정도(Dice) — 0(다름) ~ 1(같음) */
  const coreTitle = (t) => String(t || '').toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)|【[^】]*】|<[^>]*>/g, ' ').replace(/\s[:\-–—|]\s.*$/, ' ').replace(/[:：].*$/, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const bigrams = (s) => { s = s.replace(/\s+/g, ''); const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  function sim(a, b) { const A = coreTitle(a), B = coreTitle(b); if (!A || !B) return 0; if (A === B) return 1; const x = bigrams(A), y = bigrams(B); let n = 0, ta = 0, tb = 0; x.forEach((v) => (ta += v)); y.forEach((v) => (tb += v)); if (!ta || !tb) { return A.replace(/\s/g, '') === B.replace(/\s/g, '') ? 1 : 0; } x.forEach((v, g) => { n += Math.min(v, y.get(g) || 0); }); const d = (2 * n) / (ta + tb); /* 장터 글 제목은 책 제목에 말을 덧붙이는 일이 많음('데미안 헤르만헤세 민음사 새책같음') — 책 제목이 글 제목 안에 통째로 들어 있으면 같은 책으로 봄 */ const As = A.replace(/\s/g, ''), Bs = B.replace(/\s/g, ''); const inc = As.length >= 2 && Bs.length >= 2 && (Bs.includes(As) || As.includes(Bs)) ? Math.min(As.length, Bs.length) >= 4 || As.length === Bs.length ? 0.9 : 0.75 : 0; return Math.round(Math.max(d, inc) * 100) / 100; }
  /* 장터 검색어: 부제·괄호를 뺀 제목 — 너무 짧으면(3글자 이하) 지은이 앞 이름을 붙임 */
  function marketQuery(title, author) { const c = coreTitle(title); if (!c) return ''; if (c.replace(/\s/g, '').length <= 3 && author) { const a = String(author).split(/[,;^·]/)[0].replace(/\(.*?\)|지음|옮김|글|그림|저|역/g, ' ').trim().split(/\s+/)[0]; return a ? `${c} ${a}` : c; } return c; }
  const meta = (html, name) => { const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name.replace(/[:.]/g, '\\$&')}["'][^>]*>`, 'i'); const t = (String(html).match(re) || [])[0]; if (!t) return null; const c = t.match(/content=["']([^"']*)["']/i); return c ? decodeEnt(c[1]).trim() : null; };
  /* 화면 안에 묻힌 JSON 덩어리 모두: ld+json · __NEXT_DATA__ · application/json · window.__XXX = {...}; */
  function jsonBlobs(html) { const out = []; const H = String(html || ''); const tryP = (s) => { try { out.push(JSON.parse(s)); } catch (e) {} };
    H.replace(/<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi, (m, s) => { tryP(s.trim()); return m; });
    H.replace(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi, (m, s) => { tryP(s.trim()); return m; });
    /* (0.2.0) Next.js 새 방식(App Router) 화면: self.__next_f.push([1,"…"]) 조각을 이어 붙이고, 줄마다 '번호:JSON' 꼴을 읽음 — 중고나라·중고닷·교보가 이 방식 */
    { let rsc = ''; H.replace(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g, (m, x) => { try { rsc += JSON.parse('"' + x + '"'); } catch (e) {} return m; });
      if (rsc) rsc.split('\n').forEach((ln) => { const mm = ln.match(/^[0-9a-f]{1,6}:(?:[A-Z]?)([\[{].*)$/); if (mm) tryP(mm[1]); }); }
    const re = /window\.(__[A-Za-z0-9_]+|[A-Za-z_]*(?:STATE|State|Context|DATA|Data)[A-Za-z_]*)\s*=\s*/g; let m; while ((m = re.exec(H))) { const st = m.index + m[0].length; const ch = H[st]; if (ch !== '{' && ch !== '[') continue; const end = balanced(H, st); if (end > st) tryP(H.slice(st, end + 1)); }
    return out; }
  function balanced(s, i) { const open = s[i], close = open === '{' ? '}' : ']'; let d = 0, q = null, esc = false; for (let j = i; j < s.length && j < i + 5e6; j++) { const c = s[j]; if (q) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (d === 0) return j; } } return -1; }
  /* 표의 이름표 → 값 (th/td · dt/dd) — 화면이 '쪽수 | 320쪽' 같은 표로 보여 주는 칸을 모두 그대로 */
  function tableKV(html) { const o = {}; const H = String(html || ''); const put = (k, v) => { k = strip(k).replace(/\s+/g, ' ').replace(/[:：]$/, '').trim(); v = strip(v).replace(/\s+/g, ' ').trim(); if (k && v && k.length <= 30 && !(k in o)) o[k] = clip(v, 400); };
    H.replace(/<th[^>]*>((?:(?!<\/?th[\s>])[\s\S]){0,2000}?)<\/th>\s*<td[^>]*>((?:(?!<\/?td[\s>])[\s\S]){0,20000}?)<\/td>/gi, (m, k, v) => { put(k, v); return m; }); /* (0.3.0) 한 칸 안에서만 — 제목만 있는 줄을 건너 다음 줄 값과 잘못 짝짓던 것 · 긴 화면에서 느리던 것 */
    H.replace(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi, (m, k, v) => { put(k, v); return m; }); return o; }
  const kvFind = (kv, re) => { for (const [k, v] of Object.entries(kv || {})) if (re.test(k)) return v; return null; };
  /* JSON 안에서 '책·매물' 같은 줄 목록 찾기: 제목 칸과 값 칸이 있는 물건이 3개 이상 든 배열 중 가장 긴 것 */
  const TK = ['title', 'name', 'productTitle', 'subject', 'productName', 'goodsName'], PK = ['price', 'salePrice', 'productPrice', 'sellPrice', 'priceValue', 'amount'];
  const IK = ['pid', 'seq', 'id', 'productSeq', 'productId', 'articleId', 'b_id', 'bookId', 'goodsNo', 'itemId'];
  const SK = ['status', 'state', 'saleStatus', 'productState', 'tradeStatus', 'productStatus', 'saleState'];
  const DK = ['sortDate', 'updateDate', 'updatedAt', 'createdAt', 'update_time', 'boostedAt', 'publishedAt', 'regDate', 'time', 'date'];
  const pick = (o, ks) => { for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]; return null; };
  const priceOf = (o) => { let p = pick(o, PK); if (p && typeof p === 'object') p = pick(p, ['value', 'amount', 'price']); if (p == null && o && o.offers) { const f = Array.isArray(o.offers) ? o.offers[0] : o.offers; p = f && (f.price ?? f.lowPrice); } return toNum(p); };
  function findListings(root0) { let best = null; const seen = new Set(); let guard = 0;
    const walk = (x, depth) => { if (!x || typeof x !== 'object' || depth > 14 || seen.has(x) || guard++ > 200000) return; seen.add(x);
      if (Array.isArray(x)) { if (x.some((o) => o && o.item && typeof o.item === 'object' && /ListItem/i.test(String(o['@type'] || '')))) x = x.map((o) => (o && o.item && typeof o.item === 'object' ? o.item : o)); /* (0.2.0) ld+json ItemList(당근) */ const ok = x.filter((o) => o && typeof o === 'object' && !Array.isArray(o) && typeof pick(o, TK) === 'string' && priceOf(o) != null); if (ok.length >= 1 && (!best || ok.length > best.length)) best = ok; x.forEach((y) => walk(y, depth + 1)); return; }
      for (const k of Object.keys(x)) walk(x[k], depth + 1); };
    walk(root0, 0); return best || []; }
  const locOf = (o) => { const v = pick(o, ['location', 'locationName', 'regionName', 'region', 'locationNames', 'area', 'address']); if (v == null) return null; if (Array.isArray(v)) return clip(v.map((y) => (typeof y === 'object' ? pick(y, ['name', 'fullName']) : y)).filter(Boolean).join(', '), 60); if (typeof v === 'object') return clip(pick(v, ['name', 'fullName', 'name3', 'name2']) || '', 60) || null; return clip(String(v), 60); };
  const dateOf = (o) => { const v = pick(o, DK); if (v == null) return null; if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString(); const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : clip(String(v), 30); };
  /* 장터 글 상태 → 판매중 / 예약 / 판매완료 */
  /* 숫자로만 된 상태 번호(장터마다 뜻이 다름 — 확인 전엔 추측하지 않음)는 '#번호' 그대로 두고 판매중으로 셈 */
  const stOf = (v) => { const s = String(v == null ? '' : v).toLowerCase().trim(); if (!s) return null; if (/schema\.org\/(soldout|outofstock|discontinued)/.test(s)) return 'sold'; if (/schema\.org\/(instock|limitedavailability|preorder)/.test(s)) return 'sell'; if (/^\d+$/.test(s)) return '#' + s; if (/sold|완료|closed|complete|done/.test(s)) return 'sold'; if (/reserv|예약/.test(s)) return 'rsv'; if (/sale|ongoing|판매|selling|active|on_sale/.test(s)) return 'sell'; return clip(s, 12); };
  /* 잘라 둘 화면 일부 (못 읽었을 때 수집기가 ext_probe에 남김 — 읽는 법 고칠 때 씀) */
  const noKey = (u) => (u == null ? null : String(u).replace(/([?&](?:ttbkey|cert_key|key|authKey|authkey|apikey|api_key|serviceKey|client_secret)=)[^&#]*/gi, '$1***')); /* (0.3.0) 남기는 주소에서 연결 키를 가림 — ext_probe에 키가 남지 않게 */
  const probeSlim = (t) => String(t || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi, '').replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (m, body) => (/__NEXT_DATA__|__next_f|application\/(ld\+)?json|window\.__|__INITIAL|__APOLLO|__NUXT/i.test(m) ? m : '')).replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t]{2,}/g, ' ').replace(/\n\s*\n+/g, '\n');
  /* (0.4.3) 못 읽은 화면은 글·자료만 남겨 더 많이(최대 28만 자 · 예전 12만) — 꾸밈(style·svg)과 프로그램(script)은 빼고 자료 담은 script(Next·JSON)는 남김 · 예전엔 앞 12만 자만이라 예스24·리디는 메뉴만 담기고 정작 목록은 잘렸음 */
  /* 너무 길면 앞 3만 자(머리) + 목록이 있을 만한 곳(검색 결과·상품·자료 script가 처음 나오는 곳)부터 25만 자 */
  const probePick = (t) => { if (t.length <= 280000) return t; const re = /검색\s*결과|searchResult|search-result|goods|product|itemList|item_list|__NEXT_DATA__|__next_f|application\/json/gi; re.lastIndex = 20000; const m = re.exec(t); const st = m ? Math.max(30000, m.index - 2000) : 30000; return t.slice(0, 30000) + '\n<!-- …(중간 생략)… -->\n' + t.slice(st, st + 250000); };
  const probe = (text, why, url) => ({ ok: false, why, probe: { url: noKey(url), len: String(text || '').length, head: probePick(probeSlim(String(text || '').replace(/(ttbkey|cert_key|authKey|serviceKey)=[^&"'\s<]*/gi, '$1=***'))) } }); /* 한 문서 1MB 한도 — 한글이 섞여도 넘지 않게 28만 자 */

  /* ══════════ 출처마다: 묻기 → 읽기 ══════════
   * run({ isbn, title, author, keys, http, cache, cfg }) → { ok:true, d } | { ok:true, none:true } (그 책이 없음) | { ok:false, why, probe? } | { skip: '까닭' }
   * http({ method, url, headers, data }) → { status, text } (실패하면 던짐) */
  const enc = encodeURIComponent;
  /* '검색 결과 없음' 화면 — '10건'처럼 0이 들어간 다른 숫자에 걸리지 않게 문장으로만 */
  const NORES = /검색\s*결과가\s*없|검색결과가\s*없|결과가\s*없(습니다|어요)|총\s*0\s*건|[^\d,]0\s*건의\s*검색/;
  const okStatus = (r) => r && r.status >= 200 && r.status < 300;
  const J = (t) => { const s = String(t || '').trim().replace(/;\s*$/, ''); try { return JSON.parse(s); } catch (e) { return JSON.parse(s.replace(/\\'/g, "'")); } }; /* 알라딘 TTB output=js는 작은따옴표를 \\'로 내보냄 — JSON이 받지 않으므로 고쳐 다시 읽음 */
  const ADP = {};

  /* 알라딘 TTB ItemLookUp — 공식. 중고 재고 요약(알라딘·회원·매장)과 전자책 목록까지 한 번에 */
  ADP.ttb = async ({ isbn, keys, http }) => { const url = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${enc(keys.aladinTtb)}&itemIdType=ISBN13&ItemId=${isbn}&output=js&Version=20131101&OptResult=ebookList,usedList,packing,ratingInfo,bestSellerRank`;
    const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); }
    if (j.errorCode) return /존재하지|없습니다|not found/i.test(j.errorMessage || '') ? { ok: true, none: true } : { ok: false, why: `${j.errorCode} ${j.errorMessage || ''}`.trim() };
    const it = (j.item || [])[0]; if (!it) return { ok: true, none: true }; const si = it.subInfo || {}; const pk = si.packing || {}; const U = si.usedList || {};
    const u = (x) => (x && (x.itemCount || x.minPrice) ? { n: +x.itemCount || 0, min: +x.minPrice || null } : null);
    return { ok: true, d: { title: it.title || null, sub: si.subTitle || null, orig: si.originalTitle || null, authors: it.author || null, publisher: it.publisher || null, pubDate: ymd(it.pubDate), priceList: toNum(it.priceStandard), priceSales: toNum(it.priceSales), pages: toNum(si.itemPage), size: pk.sizeWidth ? `${pk.sizeWidth}*${pk.sizeHeight}*${pk.sizeDepth}mm` : null, weightG: toNum(pk.weight), cover: it.cover || null, cat: it.categoryName || null, desc: clip(strip(it.description || ''), 1500) || null, url: it.link || null, salesPoint: toNum(it.salesPoint), rating: toNum(it.customerReviewRank), rank: si.bestSellerRank || null, stock: it.stockStatus || null,
      used: { aladin: u(U.aladinUsed), user: u(U.userUsed), space: u(U.spaceUsed) }, ebook: (si.ebookList || []).slice(0, 3).map((e) => ({ id: e.itemId, p: toNum(e.priceSales), isbn: e.isbn13 || e.isbn || null })) } }; };

  ADP.kakao = async ({ isbn, keys, http }) => { const url = `https://dapi.kakao.com/v3/search/book?target=isbn&query=${isbn}&size=10`;
    const r = await http({ method: 'GET', url, headers: { Authorization: `KakaoAK ${keys.kakaoRest}` } }); if (r.status === 401 || r.status === 403) return { ok: false, why: `키가 맞지 않음 (HTTP ${r.status})` }; if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
    let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); } const doc = (j.documents || []).find((d) => String(d.isbn || '').split(/\s+/).includes(isbn)); if (!doc) return { ok: true, none: true };
    return { ok: true, d: { title: doc.title || null, authors: (doc.authors || []).join(', ') || null, translators: (doc.translators || []).join(', ') || null, publisher: doc.publisher || null, pubDate: ymd(doc.datetime), priceList: toNum(doc.price), priceSales: toNum(doc.sale_price) > 0 ? toNum(doc.sale_price) : null, status: doc.status || null, cover: doc.thumbnail || null, desc: clip(doc.contents || '', 1500) || null, url: doc.url || null } }; };

  ADP.naver = async ({ isbn, keys, http }) => { const url = `https://openapi.naver.com/v1/search/book.json?query=${isbn}&display=10`;
    const r = await http({ method: 'GET', url, headers: { 'X-Naver-Client-Id': String(keys.naverId || '').trim(), 'X-Naver-Client-Secret': String(keys.naverSecret || '').trim() } }); if (r.status === 401 || r.status === 403) return { ok: false, why: `키가 맞지 않음 (HTTP ${r.status})` }; if (!okStatus(r)) return probe(r.text, `HTTP ${r.status}${r.text ? ' — ' + clip(String(r.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 90) : ''}`, url); /* (0.4.2) 못 읽은 화면·응답을 남김(ext_probe) — 까닭을 보고 고치게 */
    let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); } const it = (j.items || []).find((x) => String(x.isbn || '').split(/\s+/).includes(isbn)); if (!it) return { ok: true, none: true };
    return { ok: true, d: { title: strip(it.title) || null, authors: String(it.author || '').split('^').join(', ') || null, publisher: strip(it.publisher) || null, pubDate: ymd(it.pubdate), priceSales: toNum(it.discount) || null, cover: it.image || null, desc: clip(strip(it.description || ''), 1500) || null, url: it.link || null } }; };

  ADP.google = async ({ isbn, keys, http }) => { const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=5${keys.googleBooks ? `&key=${enc(keys.googleBooks)}` : ''}`;
    const r = await http({ method: 'GET', url }); if (r.status === 429) return { ok: false, why: '하루 묻는 수를 넘음 (429) — 키를 넣으면 늘어남', limit: true }; if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
    let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); } const v0 = (j.items || []).find((x) => ((x.volumeInfo || {}).industryIdentifiers || []).some((y) => digits(y.identifier) === isbn)); if (!v0) return { ok: true, none: true };
    const v = v0.volumeInfo || {}; const sl = v0.saleInfo || {}; return { ok: true, d: { title: v.title || null, sub: v.subtitle || null, authors: (v.authors || []).join(', ') || null, publisher: v.publisher || null, pubDate: ymd(v.publishedDate), pages: toNum(v.pageCount), cats: (v.categories || []).slice(0, 5), lang: v.language || null, cover: (v.imageLinks || {}).thumbnail || null, desc: clip(strip(v.description || ''), 1500) || null, url: v.infoLink || null, gid: v0.id || null, listPrice: sl.listPrice ? { a: sl.listPrice.amount, c: sl.listPrice.currencyCode } : null } }; };

  ADP.nl = async ({ isbn, keys, http }) => { const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${enc(keys.nlKey)}&result_style=json&page_no=1&page_size=10&isbn=${isbn}`;
    const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님 (인증키 확인)', url); }
    if (j.ERR_CODE || j.RESULT === 'ERROR') return { ok: false, why: `${j.ERR_CODE || ''} ${j.ERR_MESSAGE || j.MESSAGE || ''}`.trim() }; const doc = (j.docs || []).find((d) => digits(d.EA_ISBN) === isbn) || null; if (!doc) return { ok: true, none: true };
    return { ok: true, d: { title: doc.TITLE || null, authors: doc.AUTHOR || null, publisher: doc.PUBLISHER || null, pubDate: ymd(doc.REAL_PUBLISH_DATE || doc.PUBLISH_PREDATE), pages: toNum(doc.PAGE), size: doc.BOOK_SIZE || null, priceList: toNum(doc.PRE_PRICE), kdc: doc.KDC || null, ddc: doc.DDC || null, subject: doc.SUBJECT || null, series: doc.SERIES_TITLE || null, vol: doc.VOL || null, form: [doc.FORM, doc.FORM_DETAIL].filter(Boolean).join(' ') || null, ebook: doc.EBOOK_YN || null, addCode: doc.EA_ADD_CODE || null, setIsbn: doc.SET_ISBN || null, related: doc.RELATED_ISBN || null, cover: doc.TITLE_URL || null, introUrl: doc.BOOK_INTRODUCTION_URL || null, tocUrl: doc.BOOK_TB_CNT_URL || null } }; };

  /* 교보·예스24: 검색 화면에서 상품 번호 → 상품 화면을 읽음. 상품 화면 안에 그 ISBN이 있어야만 받아들임 */
  function pageBook(html, isbn, url, site) { const H = String(html || ''); if (!H.includes(isbn) && !H.includes(isbn.replace(/^(\d{3})(\d+)$/, '$1-$2'))) return { ok: false, why: '상품 화면에 이 ISBN이 없음 — 다른 책일 수 있어 받지 않음', mismatch: true };
    const kv = tableKV(H); const ld = jsonBlobs(H).flatMap((b) => (Array.isArray(b) ? b : b && b['@graph'] ? b['@graph'] : [b])).find((b) => b && /Book|Product/i.test(String(b['@type'] || ''))) || null;
    const ogT = meta(H, 'og:title'); const title = (ld && ld.name) || (ogT ? ogT.replace(/\s*[|:\-]\s*(교보문고|예스24|YES24).*$/i, '').trim() : null);
    const spec = Object.entries(kv).filter(([k]) => /쪽수|무게|크기|규격|판형/.test(k)).map(([, v]) => v).join(' | '); const pgs = toNum((spec.match(/([\d,]+)\s*(쪽|p|페이지)/i) || [])[1]) ?? toNum(kvFind(kv, /^쪽수$/)) ?? toNum(ld && ld.numberOfPages);
    const wt = toNum((spec.match(/([\d,.]+)\s*g\b/i) || [])[1]); const sz = (spec.match(/\d{2,4}\s*[*x×]\s*\d{2,4}(\s*[*x×]\s*\d{1,3})?\s*mm/i) || [])[0] || null;
    const pd = ymd(kvFind(kv, /발행일|출간일|발행\(출시\)일자|출시일/) || (ld && ld.datePublished)); const offer = ld && (Array.isArray(ld.offers) ? ld.offers[0] : ld.offers);
    const plist = toNum(kvFind(kv, /^정가$/)) ?? toNum((H.match(/정가[^0-9]{0,40}([\d,]{3,9})\s*원/) || [])[1]); const psale = toNum(offer && offer.price) ?? toNum((H.match(/판매가[^0-9]{0,40}([\d,]{3,9})\s*원/) || [])[1]);
    const sales = toNum((H.match(/판매지수\s*[:\s]*([\d,]+)/) || [])[1]);
    const auth = ld && ld.author ? (Array.isArray(ld.author) ? ld.author : [ld.author]).map((a) => (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ') : null;
    return { ok: true, d: { title, authors: auth, publisher: (ld && ld.publisher && (ld.publisher.name || ld.publisher)) || kvFind(kv, /^출판사$/) || null, pubDate: pd, pages: pgs, size: sz ? sz.replace(/\s+/g, '') : null, weightG: wt, priceList: plist, priceSales: psale, salesIndex: sales, cover: meta(H, 'og:image'), desc: clip(meta(H, 'og:description') || (ld && ld.description) || '', 1500) || null, url, kv } }; }
  ADP.kyobo = async ({ isbn, http }) => { const s = `https://search.kyobobook.co.kr/search?keyword=${isbn}&gbCode=TOT&target=total`; const r = await http({ method: 'GET', url: s }); if (!okStatus(r)) return { ok: false, why: `검색 HTTP ${r.status}` };
    const m = String(r.text).match(/https?:\/\/product\.kyobobook\.co\.kr\/detail\/(S\d{6,})/) || String(r.text).match(/\/detail\/(S\d{6,})/); if (!m) return NORES.test(r.text) ? { ok: true, none: true } : probe(r.text, '검색 화면에서 상품 번호를 못 찾음', s);
    const url = `https://product.kyobobook.co.kr/detail/${m[1]}`; const p = await http({ method: 'GET', url }); if (!okStatus(p)) return { ok: false, why: `상품 화면 HTTP ${p.status}` }; const o = pageBook(p.text, isbn, url, 'kyobo'); if (!o.ok && !o.mismatch) return probe(p.text, o.why, url); if (o.ok) o.d.id = m[1]; return o; };
  ADP.yes24 = async ({ isbn, http }) => { const s = `https://www.yes24.com/Product/Search?domain=BOOK&query=${isbn}`; const r = await http({ method: 'GET', url: s }); if (!okStatus(r)) return { ok: false, why: `검색 HTTP ${r.status}` };
    const m = String(r.text).match(/\/Product\/Goods\/(\d{4,})/) || String(r.text).match(/\/goods\/(\d{4,})/i); if (!m) return NORES.test(r.text) ? { ok: true, none: true } : probe(r.text, '검색 화면에서 상품 번호를 못 찾음', s);
    const url = `https://www.yes24.com/Product/Goods/${m[1]}`; const p = await http({ method: 'GET', url }); if (!okStatus(p)) return { ok: false, why: `상품 화면 HTTP ${p.status}` }; const o = pageBook(p.text, isbn, url, 'yes24'); if (!o.ok && !o.mismatch) return probe(p.text, o.why, url); if (o.ok) o.d.id = m[1]; return o; };

  /* ── 중고 시세: 장터 글 목록 → [{t 제목, p 값, st 상태(sell·rsv·sold), id, url, at 올린 때, loc 지역, sim 제목 닮음}] ── */
  const usedOut = (items, q, title, url, cfg) => { const th = Math.max(0.3, ((cfg && cfg.sim) ?? CFG_DEF.sim) - 0.25); const A = items.map((x) => ({ ...x, sim: sim(title, x.t) })).filter((x) => x.t); const L = A.filter((x) => x.sim >= th).sort((a, b) => b.sim - a.sim || (a.p || 0) - (b.p || 0)).slice(0, 60); return { ok: true, d: { q, url, n: L.length, all: A.length, th, items: L } }; }; /* (0.4.3) 제목이 닮은 글만 남김(닮음 = 설정 '같은 책' 기준 − 0.25, 최소 0.3) — 예전엔 검색 결과 60개를 모두 담아 당근은 책마다 늘 '새로 60개'(대부분 다른 물건)였음 */
  ADP.yes24used = async ({ isbn, title, http, cfg }) => { const url = `https://www.yes24.com/Product/Search?domain=USED&query=${isbn}`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return probe(r.text, `HTTP ${r.status}${r.text ? ' — ' + clip(String(r.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 90) : ''}`, url); /* (0.4.2) 못 읽은 화면·응답을 남김(ext_probe) — 까닭을 보고 고치게 */ const H = String(r.text);
    const items = []; const parts = H.split(/<li[^>]+data-goods-no=|<div[^>]+class=["'][^"']*itemUnit/i).slice(1);
    for (const seg0 of parts) { const seg = seg0.slice(0, 8000); const id = (seg.match(/\/Product\/Goods\/(\d+)/) || [])[1]; const nm = strip((seg.match(/class=["'][^"']*gd_name[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) || [])[1] || ''); const pr = toNum(strip((seg.match(/class=["'][^"']*yes_b[^"']*["'][^>]*>([\s\S]*?)<\/em>/i) || [])[1] || ''));
      if (id && nm && pr != null) { const gr = (nm.match(/\[중고\s*[-–]?\s*(최상|상|중|하)\]/) || [])[1] || null; items.push({ id, t: nm.replace(/^\[중고[^\]]*\]\s*/, ''), p: pr, g: gr, st: 'sell', url: `https://www.yes24.com/Product/Goods/${id}` }); } }
    if (!items.length) return NORES.test(H) ? { ok: true, d: { q: isbn, url, n: 0, items: [] } } : probe(H, '중고 목록을 못 읽음', url); const o = usedOut(items, isbn, title, url, cfg); o.d.items.forEach((x) => { x.sim = 1; x.byIsbn = true; }); return o; }; /* ISBN으로 찾은 글은 같은 책 — 제목 닮음과 상관없이 */
  ADP.bunjang = async ({ title, author, http, cfg }) => { const q = marketQuery(title, author); if (!q) return { skip: '제목 없음' }; const url = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${enc(q)}&order=score&page=0&n=60&stat_device=w`;
    const r = await http({ method: 'GET', url }); if (!okStatus(r)) return probe(r.text, `HTTP ${r.status}${r.text ? ' — ' + clip(String(r.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 90) : ''}`, url); /* (0.4.2) 못 읽은 화면·응답을 남김(ext_probe) — 까닭을 보고 고치게 */ let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); }
    const L = Array.isArray(j.list) ? j.list : findListings(j); const items = L.map((o) => ({ id: String(pick(o, IK) ?? ''), t: String(pick(o, TK) || ''), p: priceOf(o), st: stOf(pick(o, SK)) || 'sell', at: dateOf(o), loc: locOf(o), url: pick(o, IK) != null ? `https://m.bunjang.co.kr/products/${pick(o, IK)}` : null })).filter((x) => x.t);
    if (!items.length && !Array.isArray(j.list)) return probe(r.text, '목록 칸을 못 찾음', url); return usedOut(items, q, title, `https://m.bunjang.co.kr/search/products?q=${enc(q)}`, cfg); };
  const pageMarket = async ({ title, author, http, cfg }, mk, idUrl) => { const q = marketQuery(title, author); if (!q) return { skip: '제목 없음' }; const url = mk(q); const r = await http({ method: 'GET', url }); if (!okStatus(r)) return probe(r.text, `HTTP ${r.status}${r.text ? ' — ' + clip(String(r.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 90) : ''}`, url); /* (0.4.2) 못 읽은 화면·응답을 남김(ext_probe) — 까닭을 보고 고치게 */
    const B = jsonBlobs(r.text); let L = []; for (const b of B) { const x = findListings(b); if (x.length > L.length) L = x; }
    const absU = (h) => { try { return new URL(String(h), url).href; } catch (e) { return null; } }; const items = L.map((o) => { const id = pick(o, IK); const href = pick(o, ['href', 'url', 'link', 'webUrl']); return { id: id != null ? String(id) : null, t: String(pick(o, TK) || ''), p: priceOf(o), st: stOf(pick(o, SK) ?? (o.offers && (Array.isArray(o.offers) ? o.offers[0] : o.offers) || {}).availability), at: dateOf(o), loc: locOf(o), url: href && typeof href === 'string' && !/\.(jpe?g|png|webp|gif|avif)(\?|$)|\/\/img\d*\.|[?&]impolicy=/i.test(href) ? absU(href) : id != null ? idUrl(id) : null, /* 그림 주소(중고나라 url 칸은 사진)는 글 주소로 쓰지 않음 */ ...(o.description ? { desc: clip(String(o.description), 300) } : {}) }; }).filter((x) => x.t);
    if (!items.length) return NORES.test(r.text) ? { ok: true, d: { q, url, n: 0, items: [] } } : probe(r.text, '화면 안에서 글 목록을 못 찾음', url); return usedOut(items, q, title, url, cfg); };
  ADP.joongna = (a) => pageMarket(a, (q) => `https://web.joongna.com/search/${enc(q)}`, (id) => `https://web.joongna.com/product/${id}`);
  ADP.daangn = (a) => pageMarket(a, (q) => `https://www.daangn.com/kr/search/buy-sell/?search=${enc(q)}`, /* (0.2.0) 저장된 당근 검색 화면 주소 — 화면 속 ld+json ItemList(이름·값·판매중/판매완료·주소)를 읽음 */ (id) => `https://www.daangn.com/kr/buy-sell/${id}`);

  /* ── (0.2.0) 중고닷: 검색 결과의 글 링크(/detail/{장터}/{번호}?productUrl=…&title=…&price=…&timeAgo=…&location=…)에 필요한 칸이 다 들어 있어 링크만 읽음 (정범이 준 중고닷 화면으로 확인) ── */
  const JM_PLAT = { bungaejangtu: '번개장터', daangn: '당근', joonggonara: '중고나라', hellomarket: '헬로마켓', fruitsfamily: '후르츠패밀리' };
  function jmParse(html) { const out = []; const seen = new Set(); String(html || '').replace(/href=["'](?:https?:\/\/www\.joongmo\.com)?\/detail\/([a-z]+)\/([^"'?]+)\?([^"']+)["']/g, (m, plat, id, qs) => { const k = plat + '/' + id; if (seen.has(k)) return m; seen.add(k); let P; try { P = new URLSearchParams(decodeEnt(qs)); } catch (e) { return m; }
      const t = P.get('title') || ''; out.push({ id: k, plat, platName: JM_PLAT[plat] || plat, t: t.replace(/\s+-\s+안심되는 중고거래$/, ''), p: toNum(P.get('price')), st: 'sell', ago: P.get('timeAgo') || null, loc: P.get('location') && !/^@/.test(P.get('location')) ? P.get('location') : null, url: /^https?:\/\//.test(P.get('productUrl') || '') ? P.get('productUrl') : `https://www.joongmo.com/detail/${plat}/${id}` }); return m; }); return out; }
  ADP.joongmo = async ({ title, author, http, cfg }) => { const q = marketQuery(title, author); if (!q) return { skip: '제목 없음' }; const tried = [];
    let lastT = '', lastU = null; for (const url of [`https://www.joongmo.com/?keyword=${enc(q)}`, `https://www.joongmo.com/search?keyword=${enc(q)}`]) { const r = await http({ method: 'GET', url }); tried.push(`${url.split('?')[0]} HTTP ${r.status}`); if (!okStatus(r)) continue; lastT = r.text; lastU = url;
      const items = jmParse(r.text); if (!items.length) continue; const o = usedOut(items, q, title, url, cfg); o.d.byPlat = items.reduce((m, x) => { m[x.plat] = (m[x.plat] || 0) + 1; return m; }, {}); /* 검색어가 화면에 안 먹고 첫 화면(인기 글)이 왔으면 닮은 글이 하나도 없음 → 표시만 */ o.d.queryEcho = items.some((x) => sim(q, x.t) >= 0.3); return o; }
    return { ok: false, why: '중고닷 검색 화면에서 글을 못 읽음 (' + tried.join(' · ') + ') — 검색이 화면을 연 뒤 따로 불러오는 방식이면 수집기 쪽 길을 바꿔야 함', ...(lastT ? { probe: probe(lastT, '', lastU).probe } : {}) }; };

  /* ── (0.3.0) DVDPrime 중고장터 (dvdprime.com/g2 · 그누보드 게시판 bo_table=market) — 영상·음반(DVD·블루레이·CD·LP)만
   *  정범이 준 장터 목록 화면 원본으로 확인한 모양: 줄마다 <div id="list_row_{글번호}"> · 말머리(list_category_text: 블루레이·DVD·LP·CD·프로젝터·TV·…·삽니다·그냥드림·공지)
   *  · 글 제목(list_subject_span_mobile = 잘리지 않은 제목) · 날짜(list_table_dates: 오늘 글은 '19:56') · 글쓴이(sideview_a 안 title)
   *  목록 화면엔 값 칸이 없음 — 글 제목에 값이 하나만 적혀 있을 때만 그 값을 씀(여러 개 파는 글·값이 둘 이상인 제목은 값 없이 '글 있음'만). 본문 값은 아직 읽지 않음(글 화면 원본을 받아 확인한 뒤에) */
  const DP_MEDIA_CAT = ['블루레이', 'DVD', 'LP', 'CD', '정성글'];          // 우리 상품과 같은 종류일 수 있는 말머리 (정성글 = 말머리 대신 쓰는 칸 — 제목으로 맞춤)
  const DP_SKIP_CAT = ['공지', '그냥드림', '구독공유'];                      // 시세가 아닌 글
  const dpFmt = /\b(?:4k|uhd|bd|blu-?ray|dvd|cd|lp|sacd|xrcd|ost)\b|블루레이|디브이디|스틸북|steelbook|풀슬립|렌티큘러|원클릭|한정판|한정반|초회판|일반판|정발|북미판|일본판|미개봉|\d+\s*(?:discs?|디스크)\b|\b\d+(?:dvd|bd|cd)\b/gi; /* '2disc'·'2 디스크'·'2dvd'(붙여 씀)만 장수 — '대부 2 DVD'의 2는 편 번호라 남김 */
  /* 영상·음반 제목 맞추기용: 말머리 [블루레이]·괄호·포맷 낱말·'판매/팝니다' 같은 글 말을 빼되, 쌍점(:) 뒤 부제는 남김 — '스파이더맨: 노 웨이 홈'과 '어메이징 스파이더맨 2'를 가르는 게 부제라서 */
  const mediaCore = (t) => String(t || '').toLowerCase().replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, ' ').replace(/[<>《》〈〉「」『』]/g, ' ').replace(dpFmt, ' ').replace(/판매(?:합니다|해요|중)?|팝니다|구매(?:합니다)?|삽니다|구합니다|미개봉|새제품|새상품|중고|완료|예약/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const SEQ_RE = /^(?:\d{1,2}|[ivx]{1,4}|part\s*\d+|파트\s*\d+|시즌\s*\d+|season\s*\d+|리턴즈|returns|vs.*|대\s.*|2부|3부|속편|비긴즈|begins)$/i;
  /* 영상·음반은 '에일리언'과 '에일리언 2'처럼 이어지는 편이 다른 상품 — 한쪽이 다른 쪽을 품고 남는 말이 편 번호·속편 말뿐이면 같은 상품으로 보지 않음 */
  const simMedia = (a, b) => { const A = mediaCore(a), B = mediaCore(b); const v = sim(A, B); if (v < 0.6) return v; const [S0, L0] = A.length <= B.length ? [A, B] : [B, A]; if (!S0 || S0 === L0) return v; const i = L0.indexOf(S0); if (i < 0) return v; const rest = (L0.slice(0, i) + ' ' + L0.slice(i + S0.length)).replace(/\s+/g, ' ').trim(); return rest && SEQ_RE.test(rest) ? Math.min(v, 0.5) : v; };
  /* 검색어: 그누보드 제목 검색은 띄어 쓴 낱말이 모두 든 글만 찾고('노 웨이 홈' ≠ '노웨이홈') 첫 쪽만 읽으므로 짧게 — 첫 낱말(두 글자 이하면 둘째 낱말까지) · 같은 책인지는 받은 뒤 제목 닮음으로 가림 */
  const MQ_STOP = new Set(['the', 'a', 'an', 'of', 'and', 'le', 'la', 'les', 'der', 'die', 'das']); const mediaQuery = (title) => { const w0 = mediaCore(title).split(' ').filter(Boolean); const w = w0.filter((x) => !MQ_STOP.has(x)).length ? w0.filter((x) => !MQ_STOP.has(x)) : w0; if (!w.length) return coreTitle(title).split(' ')[0] || ''; return w[0].length <= 2 && w[1] ? `${w[0]} ${w[1]}` : w[0]; };
  /* 제목 안 값: '25,000원'·'25000원'·'2.5만'·'3만원' — 값이 정확히 하나일 때만 (둘 이상이면 어느 물건 값인지 모름) */
  const dpPrices = (t) => { const out = []; let x = String(t || '');
    /* '2만 5천원'·'1만5천' → 25,000·15,000 (만·천을 함께) · '3만원'·'2.5만' · '25,000원' — '원작'·'원클릭'처럼 '원' 뒤에 한글이 붙은 말은 값이 아님 · '1만 년'처럼 만 뒤에 원·끝·쉼이 없으면 값이 아님 */
    x = x.replace(/(\d+(?:\.\d+)?)\s*만\s*(\d)\s*천\s*(?:원(?![가-힣]))?/g, (m, a, b) => { out.push(Math.round(+a * 10000 + +b * 1000)); return ' '; });
    x = x.replace(/(\d+(?:\.\d+)?)\s*만\s*(?:원(?![가-힣])|(?=택포|택배|판매|팝니|에\s|에$|씩|$|[,./)\]!~]))/g, (m, a) => { out.push(Math.round(+a * 10000)); return ' '; });
    x = x.replace(/(\d+)\s*천\s*원(?![가-힣])/g, (m, a) => { out.push(+a * 1000); return ' '; });
    x.replace(/(\d{1,3}(?:,\d{3})+|\d+)\s*원(?![가-힣])/g, (m, n) => { out.push(+n.replace(/,/g, '')); return m; });
    return [...new Set(out)].filter((v) => v >= 100); };
  const dpMulti = (t) => /[,，、/]|여러|등\b|등\)|\d+\s*(?:개|장|종|편|권|타이틀)|일괄|모음|정리|처분|상품추가|리스트/i.test(String(t || '').replace(/(\d),(?=\d{3})/g, '$1')); /* 값의 천 단위 쉼표는 '여러 개'로 보지 않음 */
  /* 날짜: 오늘 글은 '시:분'만 → 한국 날짜로 · 'MM-DD' · 'YY-MM-DD' · 'YYYY-MM-DD' (다른 꼴이면 받은 글자 그대로) */
  const dpDate = (s, now) => { s = String(s || '').trim(); const k = new Date((now || Date.now()) + 9 * 3600e3); const Y = k.getUTCFullYear(); const td = k.toISOString().slice(0, 10); let m;
    if ((m = s.match(/^(\d{1,2}):(\d{2})$/))) return td; /* (0.3.0) 날짜만 — 시각은 다음 날 '10-11'로 바뀌어 같은 글이 '바뀜'으로 잡히던 것 */
    if ((m = s.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = s.match(/^(\d{2})[-.](\d{1,2})[-.](\d{1,2})$/))) return `20${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = s.match(/^(\d{1,2})[-.\/](\d{1,2})$/))) { const md = `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; const y = md > td.slice(5) ? Y - 1 : Y; return `${y}-${md}`; } /* 오늘(월-일)보다 뒤면 작년 글 */
    return s ? clip(s, 20) : null; };
  function dpParse(html, now) { const H = String(html || ''); const out = []; const segs = H.split(/<div[^>]+id=["']list_row_(?=\d)/i).slice(1);
    for (const sg0 of segs) { const id = (sg0.match(/^(\d+)/) || [])[1]; const sg = sg0.slice(0, 9000); if (!id) continue;
      const href = (sg.match(/class=["']list_subject_a["'][^>]*href=["']([^"']+)["']/i) || sg.match(/href=["']([^"']*bo_table=[^"']*wr_id=\d+[^"']*)["']/i) || [])[1] || '';
      if (href && !/bo_table=market\b/.test(href)) continue; /* 공지 게시판 글(bo_table=notice) */
      const cat = strip((sg.match(/class=["'][^"']*list_category_text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '') || null;
      if (cat && DP_SKIP_CAT.includes(cat)) continue;
      const t = strip((sg.match(/class=["']list_subject_span_mobile["'][^>]*>([\s\S]*?)<\/span>/i) || sg.match(/class=["']list_subject_span_pc["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ''); if (!t) continue;
      const dt = strip((sg.match(/class=["']list_table_dates["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
      const who = strip((sg.match(/class=["']sideview_a["'][\s\S]*?<span title=["']([^"']+)["']/i) || [])[1] || '') || null;
      const hit = toNum(strip((sg.match(/list_table_col_hit[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || ''));
      const buy = cat === '삽니다' || /삽니다|구매합니다|구합니다|구입합니다|매입합니다|\[(?:구매|삽니다|구함)\]|\((?:구매|삽니다|구함)\)/.test(t);
      const st = buy ? 'buy' : /판매\s*완료|거래\s*완료|\[완료\]|\(완료\)|완료\s*$|^완료|sold/i.test(t) ? 'sold' : /예약/.test(t) ? 'rsv' : 'sell';
      const ps = dpPrices(t); const multi = dpMulti(t); const p = !multi && ps.length === 1 ? ps[0] : null;
      out.push({ id, t, p, st, cat, at: dpDate(dt, now), who, hit, ...(multi ? { multi: true } : {}), ...(ps.length && p == null ? { pt: ps.slice(0, 4) } : {}), url: `https://dvdprime.com/g2/bbs/board.php?bo_table=market&wr_id=${id}` }); }
    return out; }

  /* ── (0.4.0) DVDPrime 글 화면(board.php?bo_table=market&wr_id=…) 읽기 — 정범이 준 글 원본 3개로 맞춤
   *  머리: 제목 h1#writeSubject · 말머리 .view_ca_static · 글쓴이 .sideview_a(data-mb-id = 회원 아이디) 안 span.member(별명) · 등급 title='N Tier' · 조회 #view_hit · 작성 #view_datetime('Updated at …' = 고친 글) · meta article:published_time(처음 쓴 때) · 댓글 #comment_start_num
   *  본문 #resContents: 줄(<br>·</p>·</div>)마다 상품 한 개 — '이름 : 4,000원 : 판매완료' · '이름 - 38,000원' · '이름 미개봉 5.5'(= 5.5만 원) · '2.5만원' · '1.9'(= 19,000원) · '4천원'
   *   판매 끝 = 그 줄에 가운데 줄(<s>·<strike>·<del>·line-through)이 있거나 판완·판매완료·거래완료·완판·팔림 · 예약 = 예약(중)
   *   상품 상태 = 미개봉 · 개봉(품) · 겉비닐 개봉 · 스파인 변색 · 띠지 없음 · 기스·스크래치 / 판 = 한정판·스틸북·풀슬립·렌티큘러·넘버링·초회·아웃박스 · 지역 = 국내정발·북미판·일본판… · 형태 = 4K·블루레이·DVD·3D·n디스크
   *  값이 없는 줄 = 거래 조건(택배비·무료 조건·직거래 지역·입금순·환불 불가·연락 방법) — 전화번호·메일 같은 연락처 숫자는 남기지 않고 '연락 방법'만(쪽지·문자·전화·댓글·카톡) */
  const DP_SOLD = /판\s*완|판매\s*완료|거래\s*완료|완\s*판|팔렸|팔림|\bsold\b|\(완료\)|\[완료\]/i;
  const DP_RSV = /예약\s*(?:중|됨|완료)?(?![xX×불안])/;
  const DP_COND = [['sealed', /미개봉|새제품|새상품|신품/], ['opened', /(?<!미)개봉(?:품)?|중고/], ['wrapOpened', /겉\s*비닐\s*개봉|비닐\s*개봉/], ['spine', /스파인\s*변색|변색/], ['noObi', /띠지\s*(?:없|x)/i], ['scratch', /기스|스크래치|흠집|찍힘|눌림/], ['noSlip', /슬립\s*(?:없|x)|아웃케이스\s*(?:없|x)/i]];
  const DP_ED = [['한정판', /한정판|한정반|limited/i], ['스틸북', /스틸북|steelbook/i], ['풀슬립', /풀\s*슬립|full\s*slip/i], ['렌티큘러', /렌티큘러|lenticular/i], ['넘버링', /넘버링|numbered/i], ['초회', /초회|초도/], ['아웃박스', /아웃\s*(?:박스|케이스)/], ['콤보팩', /콤보\s*팩|combo/i], ['감독판', /감독판|director/i], ['일반판', /일반판/]];
  const DP_REGION = [['국내', /국내\s*정발|정발|국내판/], ['북미', /북미판|미국판|us판/i], ['일본', /일본판|일판/], ['영국', /영국판|uk판/i], ['프랑스', /프랑스판|불판/], ['독일', /독일판/], ['홍콩', /홍콩판/], ['한글자막', /한글\s*자막|한자/]];
  const DP_FORMAT = [['4K', /4k|uhd/i], ['3D', /\b3d\b/i], ['블루레이', /블루레이|blu-?ray|\bbd\b/i], ['DVD', /dvd|디브이디/i], ['CD', /\bcd\b/i], ['LP', /\blp\b/i]];
  const dpTags = (t, L) => L.filter(([, re]) => re.test(t)).map(([k]) => k);
  /* 줄 끝의 값 하나 — 단위가 없으면: 소수(5.5·1.9)는 만 원 · 1,000 이상은 원 · 그 밖(47 로닌의 47 등)은 값이 아님 */
  function dpLinePrice(line) { let t = String(line || '').replace(DP_SOLD, ' ').replace(/예약\s*(?:중|됨)?/g, ' ').replace(/[\s:：\-–—=~]+$/g, '').trim();
    const m = t.match(/(?:^|[\s:：\-–—=~(])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(만\s*(\d)\s*천\s*원?|만\s*원?|천\s*원?|원)?\s*(?:택포|택배\s*포함|에\s*판매|씩)?\s*\)?$/); if (!m) return null;
    const raw = m[0].trim(); const n = +m[1].replace(/,/g, ''); const u = (m[2] || '').replace(/\s/g, ''); let p = null;
    if (/^만\d천/.test(u)) p = Math.round(n * 10000 + +m[3] * 1000); else if (/^만/.test(u)) p = Math.round(n * 10000); else if (/^천/.test(u)) p = n * 1000; else if (u === '원') p = n;
    else if (/\./.test(m[1]) && n > 0 && n < 100) p = Math.round(n * 10000); else if (n >= 1000 && !/\./.test(m[1])) p = n;
    if (p == null || p < 100 || p > 5000000) return null; return { p, raw, name: t.slice(0, t.length - m[0].length + (m[0].length - m[0].trimStart().length)).replace(/[\s:：\-–—=~]+$/g, '').trim() }; }
  const dpPhoneLike = (t) => /01[016789][\s.\-]?\d{3,4}[\s.\-]?\d{4}|공일[공영]|영일[공영]|[공영일이삼사오육칠팔구]{7,}/.test(String(t || '').replace(/\s/g, ''));
  /* (0.4.1) 판매자 연락처를 그대로 기록 — DVDPrime 판매자는 곧 매입처(연락할 수단이 있어야 함) · 한글로 적은 번호(공일공 구육사삼…)는 숫자로 바꿔 함께 */
  const DP_KDIG = { 공: '0', 영: '0', 일: '1', 이: '2', 삼: '3', 사: '4', 오: '5', 육: '6', 륙: '6', 칠: '7', 팔: '8', 구: '9' };
  const dpKNum = (t) => String(t || '').replace(/[공영일이삼사오육륙칠팔구](?:[\s.\-]*[공영일이삼사오육륙칠팔구]){8,}/g, (m) => m.replace(/[공영일이삼사오육륙칠팔구]/g, (c) => DP_KDIG[c]));
  const dpFmtTel = (d) => (/^02/.test(d) ? `02-${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d);
  function dpContacts(text, html) { const T = dpKNum(String(text || '')); const uniq = (a) => [...new Set(a.filter(Boolean))];
    const phones = uniq((T.match(/(?<!\d)0(?:[ .\-]{0,2}\d){8,10}(?!\d)/g) || []).map((x) => x.replace(/\D/g, '')).filter((d) => /^01[016789]\d{7,8}$|^0(?:2|[3-6][1-5]|70|50\d?)\d{6,8}$/.test(d)).map(dpFmtTel));
    const emails = uniq((T.replace(/\s*(?:골뱅이|\(at\)|\[at\])\s*/gi, '@').match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) || []).map((x) => x.toLowerCase()));
    const kakao = uniq([...T.matchAll(/(?:카톡|카카오톡?|kakao(?:talk)?)\s*(?:아이디|id)?\s*[:：]?\s*([A-Za-z][A-Za-z0-9_.\-]{2,29})/gi)].map((m) => m[1]).filter((x) => !/^(?:id|talk)$/i.test(x)));
    const openchat = uniq((String(html || '') + ' ' + T).match(/https?:\/\/open\.kakao\.com\/o\/[A-Za-z0-9]+/g) || []);
    return { phones, emails, kakao, openchat }; }
  function dpPost(html, now) { const H = String(html || ''); const g = (re) => { const m = H.match(re); return m ? m[1] : null; };
    const id = g(/bo_table=market(?:&amp;|&)wr_id=(\d+)/) || g(/view_recommend_list_(\d+)/); const title = strip(g(/<h1[^>]+id=["']writeSubject["'][^>]*>([\s\S]*?)<\/h1>/i) || '') || null;
    if (!title && !/id=["']resContents["']/.test(H)) return null;
    const cat = strip(g(/class=["'][^"']*view_ca_static[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) || '') || null;
    const nickBox = g(/id=["']view_nickname["'][^>]*>([\s\S]*?)<\/div>/i) || ''; const nick = strip((nickBox.match(/class=['"]member['"][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '') || null;
    const mbId = (nickBox.match(/data-mb-id=['"]([^'"]+)['"]/) || [])[1] || null; const tier = toNum((nickBox.match(/title=['"](\d+)\s*Tier['"]/i) || [])[1]);
    const hits = toNum(strip(g(/id=["']view_hit["'][^>]*>([\s\S]*?)<\/div>/i) || '')); const dtRaw = strip(g(/id=["']view_datetime["'][^>]*>([\s\S]*?)<\/div>/i) || '');
    const pub = g(/property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i); const mod = g(/property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i);
    const comments = toNum(strip(g(/id=["']comment_start_num["'][^>]*>([\s\S]*?)<\/div>/i) || ''));
    let body = (H.match(/id=["']resContents["'][^>]*>([\s\S]*?)<!--\s*영화평점|id=["']resContents["'][^>]*>([\s\S]*?)<div class=["']relative ad_content/i) || [])[1] || (H.match(/id=["']resContents["'][^>]*>([\s\S]*?)<\/div>\s*<!--/i) || [])[1] || '';
    const images = (body.match(/<img\b/gi) || []).length;
    body = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<img\b[^>]*>/gi, ' ');
    /* 줄 나누기 — 가운데 줄 표시는 줄마다 따로 보아야 하므로 태그를 남긴 채로 나눔 */
    const rawLines = body.split(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<p\b[^>]*>|<div\b[^>]*>|<li\b[^>]*>/i);
    const items = []; const terms = [];
    let depth = 0; for (const rl of rawLines) { const op = (rl.match(/<(?:s|strike|del)\b/gi) || []).length, cl = (rl.match(/<\/(?:s|strike|del)>/gi) || []).length; const struck = depth > 0 || op > 0 || /line-through/i.test(rl); depth = Math.max(0, depth + op - cl);
      const t = strip(rl).replace(/\s+/g, ' ').trim(); if (!t || t.length < 2) continue;
      const pr = dpLinePrice(t);
      if (pr && pr.name && pr.name.length >= 2 && !/택배|배송|반값|편의점|^gs\b|^cu\b|직거래|송장|운임|착불|선불|입금|계좌/i.test(pr.name)) {
        const sold = struck || DP_SOLD.test(t); const rsv = !sold && DP_RSV.test(t);
        items.push({ t: clip(pr.name, 120), raw: clip(t, 200), p: pr.p, pr: pr.raw, st: sold ? 'sold' : rsv ? 'rsv' : 'sell', ...(struck ? { strike: true } : {}), cond: dpTags(t, DP_COND), ed: dpTags(t, DP_ED), region: dpTags(t, DP_REGION), fmt: dpTags(t, DP_FORMAT), disc: toNum((t.match(/(\d+)\s*(?:disc|디스크|dvd|bd)\b/i) || [])[1]) || null }); continue; }
      if (/택배|배송|반값|편의점|직거래|입금|예약\s*[x×불안]|환불|쪽지|문자|연락|전화|카톡|오픈\s*채팅|톡|네고|에눌|교환|포장|송장|일괄|무료/i.test(t) || dpPhoneLike(t)) terms.push(t); }
    const T = terms.join(' \n '); const fees = []; T.replace(/(반값\s*택배|gs\s*(?:반값|일반)?\s*택배|cu\s*(?:반값|일반)?\s*택배|편의점\s*택배|일반\s*택배|택배(?:비|거래시?\s*배송료)?|배송(?:비|료))[^\d\n]{0,14}(\d{1,3}(?:,\d{3})+|\d+)\s*(천\s*원?|원)?/gi, (m, k, n, u) => { const v = +n.replace(/,/g, '') * (/천/.test(u || '') ? 1000 : 1); if (v >= 500 && v <= 30000) fees.push({ k: k.replace(/\s+/g, ' ').trim(), won: v }); return m; });
    const free = (T.match(/[^\n]{0,30}(?:택배비|배송비)?\s*무료[^\n]{0,20}/) || [])[0] || null;
    const direct = /직거래/.test(T) ? { ok: !/직거래\s*(?:x|불가|안)/i.test(T), place: ((T.match(/직거래[^\n]{0,20}?([가-힣]{2,8}(?:역|시|구|동))/) || T.match(/([가-힣]{2,6})\s*(?:자택|근처)?에서\s*(?:직거래|가능)/) || [])[1]) || null } : null;
    const CT = dpContacts(rawLines.map((rl) => strip(rl)).join('\n'), body);
    const contact = [['쪽지', /쪽지/], ['문자', /문자/], ['전화', /전화|통화/], ['댓글', /댓글/], ['카톡', /카톡|카카오|오픈\s*채팅/]].filter(([, re]) => re.test(T)).map(([k]) => k); if (!contact.length && (dpPhoneLike(T) || CT.phones.length)) contact.push('번호(문자·전화)'); if (CT.emails.length && !contact.includes('메일')) contact.push('메일'); /* '○○○ 연락주세요'처럼 방법 없이 번호만 */
    const buy = cat === '삽니다' || /삽니다|구매합니다|구합니다|구입합니다/.test(title || '');
    const sold = items.filter((x) => x.st === 'sold').length;
    return { id, url: id ? `https://dvdprime.com/g2/bbs/board.php?bo_table=market&wr_id=${id}` : null, title: title ? clip(title, 160) : null, cat, kind: buy ? 'buy' : 'sell',
      seller: { nick, mbId, tier: tier != null ? tier : null }, hits, comments, pubAt: pub ? pub.replace(' ', 'T') + (/[+Z]/.test(pub) ? '' : '+09:00') : null, modAt: mod ? mod.replace(' ', 'T') + (/[+Z]/.test(mod) ? '' : '+09:00') : null, updated: /updated/i.test(dtRaw), shownAt: dtRaw.replace(/^updated at\s*/i, '') || null,
      images, items, n: items.length, soldN: sold, sellN: items.length - sold, terms: { fees, free: free ? clip(free.trim(), 60) : null, direct, firstPay: /입금\s*순|선\s*입금|예약\s*[x×불안]/.test(T), noRefund: /환불[이은]?\s*(?:불가|안\s*(?:됨|돼|됩)|x|어렵)/i.test(T), nego: /네고|에눌/.test(T) ? !/(?:네고|에눌)[^\n]{0,10}(?:x|불가|안\s*(?:해|받|됩)|받지\s*않|사절)/i.test(T) : null, bundleFree: /\d+\s*장\s*이상[^\n]{0,20}무료/.test(T), contact, phoneGiven: dpPhoneLike(T) || CT.phones.length > 0, phones: CT.phones, emails: CT.emails, kakao: CT.kakao, openchat: CT.openchat, notes: terms.slice(0, 8).map((x) => clip(x, 120)) } }; }
  /* 글 하나에서 우리 상품과 닮은 줄 — 같은 줄이 여럿이면 판매중을 먼저, 그다음 싼 것 */
  /* 형태(4K·블루레이·DVD·3D)가 우리 상품 제목과 맞는 줄을 먼저 — '살인의 추억 4K'면 4K 줄이 일반판 줄보다 앞 */
  const dpPick = (post, title, min) => { if (!post || !post.items) return []; const F = dpTags(title, DP_FORMAT); const fit = (x) => (F.length ? F.filter((k) => x.fmt.includes(k)).length - (F.includes('4K') && !x.fmt.includes('4K') ? 1 : 0) - (!F.includes('4K') && x.fmt.includes('4K') ? 1 : 0) : 0);
    return post.items.map((x) => ({ ...x, sim: simMedia(title, x.t), fit: fit(x) })).filter((x) => x.sim >= (min || 0.6)).sort((a, b) => (a.st === 'sell' ? 0 : 1) - (b.st === 'sell' ? 0 : 1) || b.fit - a.fit || b.sim - a.sim || a.p - b.p); };
  ADP.dvdprime = async ({ title, http, cfg }) => { const q = mediaQuery(title); if (!q) return { skip: '제목 없음' };
    /* (0.4.0) 제목+본문으로 찾음 — '블루레이 판매합니다'처럼 제목엔 없고 본문 줄에만 우리 상품이 있는 글이 많음(받은 글 3개 모두 그랬음) · 그 검색이 안 먹으면(글 0개) 제목으로 다시 */
    const U = (sfl) => `https://dvdprime.com/g2/bbs/board.php?bo_table=market&sca=&sfl=${sfl}&sop=and&stx=${enc(q)}`; let url = U(enc('wr_subject||wr_content'));
    let r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; let H = String(r.text);
    if (!/id=["']list_row_\d/.test(H)) { const u2 = U('wr_subject'); const r2 = await http({ method: 'GET', url: u2 }); if (okStatus(r2)) { r = r2; H = String(r2.text); url = u2; } }
    if (!/bo_table[=_]market/.test(H) || !/list_search_div|name=["']fsearch["']/.test(H)) return probe(H, /login|로그인/.test(H.slice(0, 20000)) && !/list_row_/.test(H) ? '장터 목록 대신 다른 화면(로그인 등)이 옴' : '장터 목록 화면이 아님', url);
    const all = dpParse(H); const items = all.filter((x) => !x.cat || DP_MEDIA_CAT.includes(x.cat) || x.cat === '삽니다');
    const L = items.map((x) => ({ ...x, sim: simMedia(title, x.t) })).sort((a, b) => b.sim - a.sim || (a.p || 0) - (b.p || 0)).slice(0, 60); const o = { ok: true, d: { q, url, n: L.length, items: L } }; o.d.cats = all.reduce((m, x) => { const k = x.cat || '?'; m[k] = (m[k] || 0) + 1; return m; }, {}); o.d.buyN = o.d.items.filter((x) => x.st === 'buy').length; o.d.noPrice = o.d.items.filter((x) => x.p == null && x.st !== 'buy').length; o.d.note = '목록 화면엔 값이 없어 제목에 값이 하나만 적힌 글만 값을 씀 — 닮은 글(최대 3개)은 글 화면을 열어 줄마다 값·판매 상태를 읽음';
    /* (0.4.0) 닮은 글 중 값이 글 안에만 있는 것(여러 개 파는 글 등)은 글 화면을 열어 우리 상품 줄의 값·상태를 읽음 — 한 번에 최대 3개 · 4초 간격 */
    /* 열 글: ① 제목이 닮았는데 값이 글 안에만 있는 글 ② 제목은 안 닮았지만 본문 검색에 걸린 글(본문 줄에 우리 상품이 있을 수 있음) — 최근 글부터 · 판매완료 제목은 뺌 · 모두 합쳐 최대 4개 */
    const content = /wr_content/.test(decodeURIComponent(url)); const open = [...L.filter((x) => x.sim >= 0.6 && x.st !== 'buy' && x.st !== 'sold' && (x.multi || x.p == null)), ...(content ? L.filter((x) => x.sim < 0.6 && x.st !== 'sold').sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))) : [])].filter((x, i, A) => A.indexOf(x) === i).slice(0, 4); let opened = 0;
    for (const x of open) { await new Promise((res) => setTimeout(res, 4000)); let r2; try { r2 = await http({ method: 'GET', url: x.url }); } catch (e) { break; } if (!okStatus(r2)) break; const P = dpPost(r2.text); if (!P) continue; opened++;
      const hit = dpPick(P, title, 0.6)[0] || null; x.post = { seller: P.seller.nick, mbId: P.seller.mbId, tier: P.seller.tier, hits: P.hits, comments: P.comments, pubAt: P.pubAt, updated: P.updated, n: P.n, sellN: P.sellN, soldN: P.soldN, terms: { fees: P.terms.fees, free: P.terms.free, direct: P.terms.direct, firstPay: P.terms.firstPay, noRefund: P.terms.noRefund, nego: P.terms.nego, contact: P.terms.contact, phoneGiven: P.terms.phoneGiven, phones: P.terms.phones, emails: P.terms.emails, kakao: P.terms.kakao, openchat: P.terms.openchat, notes: P.terms.notes } };
      if (hit) { x.line = hit.raw; x.p = hit.p; x.pr = hit.pr; x.st = P.kind === 'buy' ? 'buy' : hit.st; x.cond = hit.cond; x.ed = hit.ed; x.region = hit.region; x.fmt = hit.fmt; x.lineSim = hit.sim; delete x.multi; delete x.pt; x.sim = hit.sim; /* 닮음 = 그 줄의 닮음(글 제목이 아니라) */ } else { x.post.noLine = true; x.sim = Math.min(x.sim, 0.5); /* 글을 열어 보니 우리 상품 줄이 없음 — 시세에서 뺌 */ } }
    o.d.opened = opened; o.d.content = content; o.d.items.sort((a, b) => b.sim - a.sim || (a.p || 0) - (b.p || 0)); return o; };

  /* ── 외국: eBay 공식 Browse API (미국 eBay · 한국으로 배송되는 즉시 구매 매물만 · 한국까지 배송비 포함) ── */
  const b64 = (s) => (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'utf8').toString('base64'));
  async function ebayToken({ keys, http, cache }) { const c = cache || {}; if (c.ebayTok && c.ebayTok.exp > Date.now() + 60000) return c.ebayTok.v;
    const r = await http({ method: 'POST', url: 'https://api.ebay.com/identity/v1/oauth2/token', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + b64(`${String(keys.ebayAppId || '').trim()}:${String(keys.ebayCertId || '').trim()}`) }, data: 'grant_type=client_credentials&scope=' + enc('https://api.ebay.com/oauth/api_scope') });
    if (!okStatus(r)) { let m = ''; try { m = J(r.text).error_description || ''; } catch (e) {} throw new Error(`eBay 토큰을 못 받음 (HTTP ${r.status}${m ? ' · ' + m : ''}) — App ID·Cert ID 확인`); } const j = J(r.text); c.ebayTok = { v: j.access_token, exp: Date.now() + (+j.expires_in || 7200) * 1000 }; return c.ebayTok.v; }
  ADP.ebay = async (a) => { const { isbn, http, cfg } = a; let tok; try { tok = await ebayToken(a); } catch (e) { return { ok: false, why: e.message }; }
    const H = { Authorization: 'Bearer ' + tok, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', 'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DKR' }; const F = enc('buyingOptions:{FIXED_PRICE},deliveryCountry:KR');
    const get = async (qs) => { const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${qs}&limit=100&filter=${F}`; const r = await http({ method: 'GET', url, headers: H }); if (!okStatus(r)) throw new Error(`HTTP ${r.status} ${clip(r.text, 160)}`); return J(r.text); };
    let j, how = 'gtin'; try { j = await get(`gtin=${isbn}`); if (!(j.itemSummaries || []).length) { how = 'q'; j = await get(`q=${isbn}`); } } catch (e) { return { ok: false, why: e.message }; }
    const gm = (cfg && cfg.gradeMap) || CFG_DEF.gradeMap; const items = (j.itemSummaries || []).map((x) => { const sh = (x.shippingOptions || []).map((o) => o.shippingCost).filter((c) => c && c.value != null).sort((p, q) => +p.value - +q.value)[0];
      return { id: x.itemId, t: clip(x.title, 160), p: toNum(x.price && x.price.value), cur: (x.price && x.price.currency) || 'USD', ship: sh ? toNum(sh.value) : null, shipCur: sh ? sh.currency : null, cond: x.condition || null, cid: x.conditionId ? +x.conditionId : null, g: x.conditionId ? gm[+x.conditionId] || null : null, url: x.itemWebUrl || null, from: (x.itemLocation || {}).country || null, fb: x.seller ? toNum(x.seller.feedbackPercentage) : null }; }).filter((x) => x.p != null);
    return { ok: true, d: { how, total: j.total ?? items.length, n: items.length, items, market: 'EBAY_US', to: 'KR' } }; };
  /* AbeBooks (보조): 검색 화면의 schema.org 표시(itemprop)로 값·통화·상태를 읽음 — 배송비는 화면에 보이면 읽고, 못 읽으면 비워 둠(배송비 모르는 매물은 시세 계산에서 뺌) */
  const abeGrade = (c) => { const s = String(c || '').toLowerCase(); if (/\bnew\b/.test(s) && !/like new|as new/.test(s)) return 'new'; if (/fine|like new|as new/.test(s)) return '최상'; if (/very good/.test(s)) return '상'; if (/\bgood\b/.test(s)) return '중'; if (/fair|poor|acceptable/.test(s)) return '하'; return null; };
  ADP.abebooks = async ({ isbn, http }) => { const url = `https://www.abebooks.com/servlet/SearchResults?isbn=${isbn}&sortby=17&n=100046498`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; const H = String(r.text);
    const segs = H.split(/data-cy=["']listing-item["']|itemtype=["']https?:\/\/schema\.org\/(?:Book|Product|Offer)["']/i).slice(1); const items = [];
    for (const s0 of segs) { const s = s0.slice(0, 12000); const pr = toNum((s.match(/itemprop=["']price["'][^>]*content=["']([\d.]+)["']/i) || s.match(/content=["']([\d.]+)["'][^>]*itemprop=["']price["']/i) || [])[1]); if (pr == null) continue;
      const cur = (s.match(/itemprop=["']priceCurrency["'][^>]*content=["']([A-Z]{3})["']/i) || s.match(/content=["']([A-Z]{3})["'][^>]*itemprop=["']priceCurrency["']/i) || [])[1] || 'USD';
      const cond = strip((s.match(/itemprop=["']itemCondition["'][^>]*content=["']([^"']+)["']/i) || s.match(/class=["'][^"']*(?:opt-subcondition|condition)[^"']*["'][^>]*>([\s\S]{0,80}?)</i) || [])[1] || '') || null;
      const shp = s.match(/(?:US\$|\$|USD)\s*([\d.]+)\s*(?:<[^>]*>\s*)*(?:shipping|배송)/i) || s.match(/data-cy=["']listing-shipping[^>]*>[\s\S]{0,200}?([\d.]+)/i); const shipFree = /free shipping|무료 배송/i.test(s);
      const t = strip((s.match(/itemprop=["']name["'][^>]*content=["']([^"']+)["']/i) || s.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1] || '') || null; const href = (s.match(/href=["'](\/[^"']*\/bd[^"']*|https:\/\/www\.abebooks\.com\/[^"']+)["']/i) || [])[1] || null;
      items.push({ t: clip(t, 160), p: pr, cur, ship: shipFree ? 0 : shp ? toNum(shp[1]) : null, shipCur: cur, cond: cond && clip(cond, 60), g: abeGrade(cond), url: href ? (href.startsWith('http') ? href : `https://www.abebooks.com${href}`) : null }); }
    if (!items.length) return /no results|0 results|We couldn.t find/i.test(H) ? { ok: true, d: { n: 0, items: [] } } : probe(H, '목록을 못 읽음', url); return { ok: true, d: { n: items.length, items: items.slice(0, 100), to: 'KR?', note: '배송비는 AbeBooks가 보여 주는 값(받는 나라 설정에 따라 다를 수 있음)' } }; };

  /* ── 도서관 정보나루 (공식): 이용 분석 — 대출 수·월별 대출·나이대별·함께 빌린 책·키워드 ── */
  ADP.lib = async ({ isbn, keys, http }) => { const url = `http://data4library.kr/api/usageAnalysisList?authKey=${enc(keys.d4lKey)}&isbn13=${isbn}&format=json`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
    let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); } const R = j.response || {}; if (R.error) return { ok: false, why: String(R.error) }; const b = R.book || {}; if (!b.isbn13 && !b.bookname) return { ok: true, none: true };
    const un = (a, k) => (Array.isArray(a) ? a.map((x) => (x && x[k]) || x).filter(Boolean) : []);
    return { ok: true, d: { title: b.bookname || null, loanCnt: toNum(b.loanCnt), cls: b.class_nm || null, clsNo: b.class_no || null, year: b.publication_year || null, hist: un(R.loanHistory, 'loan').map((x) => ({ m: x.month, n: toNum(x.loanCnt), r: toNum(x.ranking) })).slice(-36), grps: un(R.loanGrps, 'loanGrp').slice(0, 12).map((x) => ({ age: x.age, sex: x.gender, n: toNum(x.loanCnt), r: toNum(x.ranking) })), kw: un(R.keywords, 'keyword').slice(0, 15).map((x) => ({ w: x.word, v: toNum(x.weight) })), co: un(R.coLoanBooks, 'book').slice(0, 10).map((x) => ({ t: x.bookname, isbn: x.isbn13, n: toNum(x.loanCnt) })) } }; };

  /* ── 리디 (전자책): 검색 화면 안의 책 목록 → 제목이 닮은 첫 책 ── */
  /* (0.4.4) 리디 검색 화면의 책 칸(HTML) — 화면 속 JSON이 없어져서(2026-10 ext_probe) 칸마다 /books/번호 · 표지 이름(aria-label) · 저자 · '소장 N원'(없으면 '대여 N원')을 읽음 */
  function ridiHtml(html) { const out = []; const seen = new Set(); for (const seg0 of String(html || '').split(/<li\b/i).slice(1)) { const seg = seg0.split(/<\/li>/i)[0]; const id = (seg.match(/href=["']\/books\/(\d{5,})/) || [])[1]; if (!id || seen.has(id)) continue;
      const t = decodeEnt((seg.match(/role=["']img["'][^>]*aria-label=["']([^"']+)["']/) || seg.match(/aria-label=["']([^"']+)["'][^>]*role=["']img["']/) || [])[1] || '') || strip((seg.match(/href=["']\/books\/\d+[^"']*["'][^>]*>\s*<span>([\s\S]*?)<\/span>\s*<\/a>/) || [])[1] || ''); if (!t) continue;
      const au = strip((seg.match(/href=["'](?:\/author\/\d+|\/search\?q=(?!%EC%B6%9C%ED%8C%90%EC%82%AC))[^"']*["'][^>]*>([\s\S]*?)<\/a>/) || [])[1] || '') || null; const pm = strip(seg).replace(/<!--\s*-->/g, '').match(/소장\s*([\d,]+)\s*원/) || strip(seg).match(/대여\s*([\d,]+)\s*원/);
      seen.add(id); out.push({ b_id: id, title: t, author: au, price: pm ? toNum(pm[1]) : null }); } return out; }
  ADP.ridi = async ({ isbn, title, author, http, cfg }) => { const q = marketQuery(title, author) || isbn; const url = `https://ridibooks.com/search?q=${enc(q)}`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return probe(r.text, `HTTP ${r.status}${r.text ? ' — ' + clip(String(r.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 90) : ''}`, url); /* (0.4.2) 못 읽은 화면·응답을 남김(ext_probe) — 까닭을 보고 고치게 */
    let L = []; for (const b of jsonBlobs(r.text)) { const x = findListings(b); if (x.length > L.length) L = x; } if (!L.length) L = ridiHtml(r.text); if (!L.length) return NORES.test(r.text) ? { ok: true, none: true } : probe(r.text, '책 목록을 못 찾음', url);
    const th = (cfg && cfg.sim) ?? CFG_DEF.sim; const C = L.map((o) => ({ id: String(pick(o, ['b_id', 'bookId', 'id']) ?? ''), t: String(pick(o, TK) || ''), p: priceOf(o), au: (() => { const a = pick(o, ['author', 'authors', 'author2']); return Array.isArray(a) ? a.map((y) => (typeof y === 'object' ? y.name : y)).join(', ') : a ? String(a) : null; })() })).map((x) => ({ ...x, sim: sim(title, x.t) })).sort((a, b) => b.sim - a.sim);
    const best = C[0]; if (!best || best.sim < th) return { ok: true, none: true, d: { q, cands: C.slice(0, 5) } }; return { ok: true, d: { q, id: best.id, t: best.t, p: best.p, au: best.au, sim: best.sim, url: best.id ? `https://ridibooks.com/books/${best.id}` : url, cands: C.slice(0, 5) } }; };

  /* ── 환율: 한국수출입은행(영업일 11시쯤 고시 · 주말·공휴일은 빈 목록 → 앞 영업일로) → 안 되면 frankfurter(유럽중앙은행 기준) · 1단위가 몇 원인지 ── */
  const FX_CUR = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'HKD', 'SGD', 'CHF', 'NZD', 'TWD'];
  async function fxRun({ keys, http, day }) { const errs = []; const d0 = day ? new Date(day + 'T12:00:00+09:00') : new Date();
    if (keys && keys.eximKey) for (let back = 0; back < 7; back++) { const d = new Date(d0.getTime() - back * 864e5); const ds = new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
      let got = null; for (const host of ['oapi.koreaexim.go.kr', 'www.koreaexim.go.kr']) { try { const r = await http({ method: 'GET', url: `https://${host}/site/program/financial/exchangeJSON?authkey=${enc(keys.eximKey)}&searchdate=${ds}&data=AP01` }); if (!okStatus(r)) { errs.push(`${host} HTTP ${r.status}`); continue; } const a = J(r.text); if (!Array.isArray(a)) { errs.push(`${host} 목록 아님`); continue; } if (a.length && +a[0].result !== 1) { errs.push(`${host} result ${a[0].result}${+a[0].result === 3 ? ' (인증키 틀림)' : +a[0].result === 4 ? ' (하루 1,000번 넘음)' : ''}`); break; } got = a; break; } catch (e) { errs.push(`${host} ${e.message}`); } }
      if (got && got.length) { const rates = {}; got.forEach((x) => { const u = String(x.cur_unit || '').trim(); const v = toNum(x.deal_bas_r); const m = u.match(/^([A-Z]{3})(?:\((\d+)\))?$/); if (m && v) rates[m[1]] = v / (+m[2] || 1); }); if (rates.USD) return { ok: true, rates, src: 'koreaexim', date: `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6)}` }; }
      if (got == null) break; }
    for (const u of [`https://api.frankfurter.app/latest?from=KRW&to=${FX_CUR.join(',')}`, `https://api.frankfurter.dev/v1/latest?base=KRW&symbols=${FX_CUR.join(',')}`]) { const host = u.split('/')[2]; try { const r = await http({ method: 'GET', url: u }); if (!okStatus(r)) { errs.push(`${host} HTTP ${r.status}`); continue; } const j = J(r.text); const rates = {}; Object.entries(j.rates || {}).forEach(([c, v]) => { if (+v > 0) rates[c] = Math.round((1 / +v) * 10000) / 10000; }); if (rates.USD) return { ok: true, rates, src: 'frankfurter', date: j.date || null, warn: errs.join(' · ') || null }; } catch (e) { errs.push(`${host} ${e.message}`); } }
    return { ok: false, why: errs.join(' · ') || '환율을 못 받음' }; }
  const toKrw = (amt, cur, fx) => { if (amt == null) return null; if (!cur || cur === 'KRW') return amt; const r = fx && fx.rates ? fx.rates[cur] : null; return r ? Math.round(amt * r) : null; };

  /* ══════════ 계산 ══════════ */
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); const n = s.length; if (!n) return null; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const quantile = (s, q) => { if (!s.length) return null; const p = (s.length - 1) * q; const lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); };
  /* 튀는 값 빼기: 4개 이상일 때만 사분위 범위(Q1−1.5×IQR ~ Q3+1.5×IQR) 밖을 뺌 (튜키 방식 — 통계에서 흔히 쓰는 기준) */
  function dropOutliers(vals) { const s = vals.slice().sort((x, y) => x - y); if (s.length < 4) return { keep: s, out: [] }; const q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), iqr = q3 - q1; const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr; return { keep: s.filter((v) => v >= lo && v <= hi), out: s.filter((v) => v < lo || v > hi), lo, hi }; }
  /* 낮은 쪽 25%의 가운데 값: 싼 순으로 늘어놓고 앞 4분의 1(적어도 1개)만 모아 그 가운데 값 — 사는 사람이 실제로 고르는 싼 쪽 값 */
  function lowQ(vals) { const s = vals.slice().sort((x, y) => x - y); if (!s.length) return null; const k = Math.max(1, Math.ceil(s.length / 4)); return median(s.slice(0, k)); }
  /* 외국 시세 (정범 지정 방식): ① 배송비 포함 값(배송비 모르면 뺌) ② 원화로 ③ 중고는 등급 계수(설정 '등급 환산 계수' 최상·상·중 — 판정 엔진과 같은 값)로 '최상' 기준값에 맞춤(값 ÷ 계수)
   *  ④ 튀는 값 빼기 ⑤ 낮은 쪽 25%의 가운데 값 → 우리 등급 값 = 그 값 × 우리 등급 계수. 새책(공장에서 바로 온 새상품)은 따로(환산하지 않음).
   *  등급을 모르는 매물(상태 '하'·'Used'처럼 등급이 안 나뉜 것 포함)은 중고 계산에서 빼고 개수만 셈 */
  function foreignStats(items, fx, coef, grade) { const C = coef || { '최상': 1, '상': 0.95, '중': 0.85 }; const ex = { noShip: 0, noFx: 0, noGrade: 0 }; const used = [], fresh = []; let cur = null;
    for (const x of items || []) { if (x.ship == null) { ex.noShip++; continue; } const sh = toKrw(x.ship, x.shipCur || x.cur, fx), pp = toKrw(x.p, x.cur, fx); if (sh == null || pp == null) { ex.noFx++; continue; } cur = cur || x.cur; const tot = pp + sh;
      if (x.g === 'new') fresh.push(tot); else if (x.g && C[x.g]) used.push({ v: tot / C[x.g], g: x.g, tot }); else ex.noGrade++; }
    const U = dropOutliers(used.map((u) => u.v)); const N = dropOutliers(fresh); const base = lowQ(U.keep); const g = grade && C[grade] ? grade : grade ? null : '최상'; /* (0.3.0) 계수가 없는 등급('하' 등)은 값 없이 — 예전엔 '최상'으로 셈(비싸게 나옴) */ const cg = g ? C[g] : null;
    const byG = {}; used.forEach((u) => { byG[u.g] = (byG[u.g] || 0) + 1; });
    return { n: (items || []).length, nUsed: used.length, nNew: fresh.length, ex, outUsed: U.out.length, outNew: N.out.length, base: base != null ? Math.round(base) : null, grade: g, ...(g ? {} : { noCoef: grade }), value: base != null && cg ? Math.round(base * cg) : null, usedMin: U.keep.length && cg ? Math.round(U.keep[0] * cg) : null, usedMed: U.keep.length && cg ? Math.round(median(U.keep) * cg) : null, newLowQ: N.keep.length ? Math.round(lowQ(N.keep)) : null, newMin: N.keep.length ? Math.round(N.keep[0]) : null, byG, fxDate: fx && fx.date, fxSrc: fx && fx.src, cur }; }
  /* 중고 장터 시세: 제목이 닮은 글(설정 '같은 책 닮음' 이상)만 · 값이 너무 낮은 글(나눔·가격 문의) 빼고 · 판매중·예약과 판매완료를 나눠 · 튀는 값 뺀 뒤 가장 싼 값·가운데 값·낮은 쪽 25% 가운데 값 */
  function usedStats(d, th, minP) { const T = th ?? CFG_DEF.sim, M = minP ?? CFG_DEF.usedMinPrice; const L = ((d && d.items) || []).filter((x) => (x.sim ?? 0) >= T && x.p != null && x.p >= M);
    const f = (a) => { const o = dropOutliers(a.map((x) => x.p)); return { n: a.length, out: o.out.length, min: o.keep.length ? o.keep[0] : null, med: o.keep.length ? Math.round(median(o.keep)) : null, lowQ: o.keep.length ? Math.round(lowQ(o.keep)) : null }; };
    return { match: L.length, all: ((d && d.items) || []).length, sell: f(L.filter((x) => x.st !== 'sold' && x.st !== 'buy')), sold: f(L.filter((x) => x.st === 'sold')), buy: ((d && d.items) || []).filter((x) => (x.sim ?? 0) >= T && x.st === 'buy').length }; } /* (0.3.0) '삽니다' 글(사려는 사람)은 파는 값에 섞지 않고 수만 */
  /* 기본 정보 합치기: 칸마다 정한 차례(설정 basicOrder)에서 처음 값이 있는 출처 — 어디서 왔는지(from)도 같이 */
  const BASIC_FIELDS = [['title', '제목'], ['sub', '부제'], ['authors', '지은이'], ['translators', '옮긴이'], ['publisher', '출판사'], ['pubDate', '출간일'], ['pages', '쪽수'], ['size', '크기'], ['weightG', '무게(g)'], ['priceList', '정가'], ['kdc', 'KDC 분류'], ['series', '시리즈'], ['lang', '언어'], ['desc', '소개']];
  function mergeBasic(doc, order) { const O = (order && order.length ? order : BASIC_ORDER).filter((k) => SOURCES[k] && SOURCES[k].grp === 'basic'); const src = (doc && doc.src) || {}; const out = {}, from = {}, diff = {};
    for (const [f] of BASIC_FIELDS) { const vals = []; for (const k of O) { const v = src[k] && src[k].d ? src[k].d[f] : null; if (v != null && v !== '') vals.push([k, v]); } if (vals.length) { out[f] = vals[0][1]; from[f] = vals[0][0]; const norm = (v) => (typeof v === 'number' ? v : String(v).replace(/\s+/g, '').toLowerCase()); const set = new Set(vals.map(([, v]) => norm(v))); if (set.size > 1 && f !== 'desc') diff[f] = vals.map(([k, v]) => ({ k, v })); } }
    return { v: out, from, diff }; }
  /* 저장할 때 '같은 내용인지' 보는 지문 — 시각처럼 늘 바뀌는 칸은 빼고 */
  const SIG_SKIP = new Set(['hit', 'ago']); /* (0.3.0) 늘 바뀌는 칸(조회수·'3분 전') — 같은 글인데 '바뀜'으로 옛 값을 매번 쌓던 것 */
  function sig(d) { const norm = (x) => { if (Array.isArray(x)) return x.map(norm); if (x && typeof x === 'object') { const o = {}; Object.keys(x).sort().forEach((k) => { if (SIG_SKIP.has(k)) return; o[k] = norm(x[k]); }); /* 모든 칸을 봄(표·글 날짜까지) — 조금이라도 다르면 '바뀜'으로 옛 값을 남김 */ return o; } return x; }; const s = JSON.stringify(norm(d)); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + s.length; }
  const shard = (isbn) => (+String(isbn).slice(-2) || 0) % 8; // 출처별 '언제 봤나' 색인을 8개 문서로 나눔(문서 하나가 1MB를 넘지 않게)

  /* (0.3.0) 이 출처로 이 상품을 물을지 — 수집기·클라우드가 같은 기준을 쓰게 여기 한 곳에 (b: { isbn(ISBN 또는 B바코드·U상품코드), title, media }) */
  function eligible(src, b, cfg) { const s = SOURCES[src]; if (!s || !b || s.ended) return false; const g = s.grp; const isI = /^97[89]\d{10}$/.test(String(b.isbn || ''));
    if (s.media) return s.media.includes(b.media) && !!b.title; /* 영상·음반 전용 장터(DVDPrime) */
    if (!isI) return g === 'used' && src !== 'yes24used' && !!b.title; /* ISBN 없는 상품: 장터 시세만 */
    if (g === 'foreign' && !(cfg && cfg.foreignKr) && isKrIsbn(b.isbn)) return false; if ((g === 'used' && src !== 'yes24used') || g === 'ebook') return !!b.title; return true; }
  async function run(src, a) { const f = ADP[src]; if (!f) return { ok: false, why: '모르는 출처' }; const s = SOURCES[src]; if (!keysReady(src, a.keys)) return { skip: '키 없음' };
    if (s.grp === 'used' && src !== 'yes24used' && !a.title) return { skip: '제목 없음' }; try { return await f(a); } catch (e) { return { ok: false, why: e.message || String(e) }; } }

  const api = { ridiHtml, VERSION, VIA_JOONGMO, eligible, mediaQuery, mediaCore, simMedia, dpParse, dpPost, dpPick, dpLinePrice, dpContacts, _dpDate: (s, n) => dpDate(s, n), keyOf, isIsbnKey, jmParse, KEYS, GROUPS, SOURCES, ORDER, BASIC_ORDER, BASIC_FIELDS, CFG_DEF, cfgOf, keysReady, isKrIsbn, coreTitle, sim, marketQuery, jsonBlobs, findListings, tableKV, meta, strip, ymd, toNum, run, fxRun, toKrw, median, lowQ, dropOutliers, foreignStats, usedStats, mergeBasic, sig, shard, stOf, FX_CUR, _adp: ADP, _pageBook: pageBook };
  if (typeof module === 'object' && module.exports) module.exports = api; root.ReadnowExt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
