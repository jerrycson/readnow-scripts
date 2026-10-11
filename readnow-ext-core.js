/* readnow-ext-core.js — 🌐 외부 정보 엔진 (공용 파일 · 웹앱·PC 수집기가 같은 기준을 씀 · 나중에 클라우드도 그대로)
 * 알라딘 밖에서 책 정보를 모음 — ① 기본 정보(교보·예스24·구글 북스 + 공식 API: 알라딘 TTB·카카오·네이버·국립중앙도서관)
 *   ② 중고 시세(예스24 중고·번개장터·중고나라·당근) ③ 외국 시세(eBay 공식 API 먼저, AbeBooks 보조) ④ 도서관 대출(도서관 정보나루)
 *   ⑤ 전자책(리디) ⑥ 환율(한국수출입은행 → 안 되면 frankfurter)
 * 이 파일은 '어떻게 묻고 어떻게 읽는지'와 '숫자 계산'만 — 요청을 보내는 길(http)은 쓰는 쪽이 넣어 줌:
 *   수집기 = GM_xmlhttpRequest (다른 사이트도 막힘 없이) · 클라우드 = fetch · 시험 = 가짜 응답
 * 기록은 쓰지 않음(쓰기는 수집기가: 같은 내용이면 다시 쓰지 않고, 바뀌면 옛 값을 ext_hist에 남긴 뒤 바꿈).
 * 화면 모양이 바뀌어 못 읽으면 '못 읽음'과 함께 받은 화면 일부(probe)를 돌려줌 → 수집기가 ext_probe에 남겨 나중에 읽는 법을 고침. 추측으로 채우지 않음.
 * ISBN이 있는 책 정보(교보·예스24)는 받은 상품 페이지 안에 그 ISBN이 정확히 있을 때만 받아들임(다른 책을 잘못 붙이지 않게). */
(function (root) {
  const VERSION = '0.1.0';

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
    naver: { grp: 'basic', label: '네이버 책 검색 (공식)', kind: 'api', host: 'openapi.naver.com', keys: ['naverId', 'naverSecret'], cap: 5000, paceMs: 500 },
    nl: { grp: 'basic', label: '국립중앙도서관 ISBN 서지 (공식)', kind: 'api', host: 'www.nl.go.kr', keys: ['nlKey'], cap: 3000, paceMs: 800 },
    yes24used: { grp: 'used', label: '예스24 중고', kind: 'page', host: 'www.yes24.com', keys: [], cap: 400, paceMs: 3000 },
    bunjang: { grp: 'used', label: '번개장터', kind: 'page', host: 'api.bunjang.co.kr', keys: [], cap: 400, paceMs: 3000 },
    joongna: { grp: 'used', label: '중고나라', kind: 'page', host: 'web.joongna.com', keys: [], cap: 300, paceMs: 3500 },
    daangn: { grp: 'used', label: '당근', kind: 'page', host: 'www.daangn.com', keys: [], cap: 300, paceMs: 3500 },
    ebay: { grp: 'foreign', label: 'eBay (공식 API)', kind: 'api', host: 'api.ebay.com', keys: ['ebayAppId', 'ebayCertId'], cap: 4000, paceMs: 700 },
    abebooks: { grp: 'foreign', label: 'AbeBooks (보조)', kind: 'page', host: 'www.abebooks.com', keys: [], cap: 200, paceMs: 4000 },
    lib: { grp: 'lib', label: '도서관 정보나루 (공식)', kind: 'api', host: 'data4library.kr', keys: ['d4lKey'], cap: 450, paceMs: 1000 },
    ridi: { grp: 'ebook', label: '리디', kind: 'page', host: 'ridibooks.com', keys: [], cap: 300, paceMs: 3000 },
  };
  const ORDER = ['kyobo', 'yes24', 'google', 'ttb', 'kakao', 'naver', 'nl', 'yes24used', 'bunjang', 'joongna', 'daangn', 'ebay', 'abebooks', 'lib', 'ridi'];
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
  const cfgOf = (c) => { const o = { ...CFG_DEF, ...(c || {}) }; o.src = {}; for (const k of ORDER) { const d = SOURCES[k]; const u = ((c && c.src) || {})[k] || {}; o.src[k] = { on: u.on !== false, cap: Math.max(0, +(u.cap ?? d.cap) || 0), refreshDays: Math.max(1, +(u.refreshDays ?? GROUPS[d.grp].refreshDays) || 1) }; } o.gradeMap = { ...CFG_DEF.gradeMap, ...((c && c.gradeMap) || {}) }; return o; };
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
    const re = /window\.(__[A-Za-z0-9_]+|[A-Za-z_]*(?:STATE|State|Context|DATA|Data)[A-Za-z_]*)\s*=\s*/g; let m; while ((m = re.exec(H))) { const st = m.index + m[0].length; const ch = H[st]; if (ch !== '{' && ch !== '[') continue; const end = balanced(H, st); if (end > st) tryP(H.slice(st, end + 1)); }
    return out; }
  function balanced(s, i) { const open = s[i], close = open === '{' ? '}' : ']'; let d = 0, q = null, esc = false; for (let j = i; j < s.length && j < i + 5e6; j++) { const c = s[j]; if (q) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (d === 0) return j; } } return -1; }
  /* 표의 이름표 → 값 (th/td · dt/dd) — 화면이 '쪽수 | 320쪽' 같은 표로 보여 주는 칸을 모두 그대로 */
  function tableKV(html) { const o = {}; const H = String(html || ''); const put = (k, v) => { k = strip(k).replace(/\s+/g, ' ').replace(/[:：]$/, '').trim(); v = strip(v).replace(/\s+/g, ' ').trim(); if (k && v && k.length <= 30 && !(k in o)) o[k] = clip(v, 400); };
    H.replace(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi, (m, k, v) => { put(k, v); return m; });
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
      if (Array.isArray(x)) { const ok = x.filter((o) => o && typeof o === 'object' && !Array.isArray(o) && typeof pick(o, TK) === 'string' && priceOf(o) != null); if (ok.length >= 1 && (!best || ok.length > best.length)) best = ok; x.forEach((y) => walk(y, depth + 1)); return; }
      for (const k of Object.keys(x)) walk(x[k], depth + 1); };
    walk(root0, 0); return best || []; }
  const locOf = (o) => { const v = pick(o, ['location', 'locationName', 'regionName', 'region', 'locationNames', 'area', 'address']); if (v == null) return null; if (Array.isArray(v)) return clip(v.map((y) => (typeof y === 'object' ? pick(y, ['name', 'fullName']) : y)).filter(Boolean).join(', '), 60); if (typeof v === 'object') return clip(pick(v, ['name', 'fullName', 'name3', 'name2']) || '', 60) || null; return clip(String(v), 60); };
  const dateOf = (o) => { const v = pick(o, DK); if (v == null) return null; if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString(); const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : clip(String(v), 30); };
  /* 장터 글 상태 → 판매중 / 예약 / 판매완료 */
  /* 숫자로만 된 상태 번호(장터마다 뜻이 다름 — 확인 전엔 추측하지 않음)는 '#번호' 그대로 두고 판매중으로 셈 */
  const stOf = (v) => { const s = String(v == null ? '' : v).toLowerCase().trim(); if (!s) return null; if (/^\d+$/.test(s)) return '#' + s; if (/sold|완료|closed|complete|done/.test(s)) return 'sold'; if (/reserv|예약/.test(s)) return 'rsv'; if (/sale|ongoing|판매|selling|active|on_sale/.test(s)) return 'sell'; return clip(s, 12); };
  /* 잘라 둘 화면 일부 (못 읽었을 때 수집기가 ext_probe에 남김 — 읽는 법 고칠 때 씀) */
  const probe = (text, why, url) => ({ ok: false, why, probe: { url: url || null, len: String(text || '').length, head: clip(String(text || ''), 120000) } });

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
    const r = await http({ method: 'GET', url, headers: { 'X-Naver-Client-Id': keys.naverId, 'X-Naver-Client-Secret': keys.naverSecret } }); if (r.status === 401 || r.status === 403) return { ok: false, why: `키가 맞지 않음 (HTTP ${r.status})` }; if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
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
  const usedOut = (items, q, title, url, cfg) => { const L = items.map((x) => ({ ...x, sim: sim(title, x.t) })).filter((x) => x.t).sort((a, b) => b.sim - a.sim || (a.p || 0) - (b.p || 0)).slice(0, 60); return { ok: true, d: { q, url, n: L.length, items: L } }; };
  ADP.yes24used = async ({ isbn, title, http, cfg }) => { const url = `https://www.yes24.com/Product/Search?domain=USED&query=${isbn}`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; const H = String(r.text);
    const items = []; const parts = H.split(/<li[^>]+data-goods-no=|<div[^>]+class=["'][^"']*itemUnit/i).slice(1);
    for (const seg0 of parts) { const seg = seg0.slice(0, 8000); const id = (seg.match(/\/Product\/Goods\/(\d+)/) || [])[1]; const nm = strip((seg.match(/class=["'][^"']*gd_name[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) || [])[1] || ''); const pr = toNum(strip((seg.match(/class=["'][^"']*yes_b[^"']*["'][^>]*>([\s\S]*?)<\/em>/i) || [])[1] || ''));
      if (id && nm && pr != null) { const gr = (nm.match(/\[중고\s*[-–]?\s*(최상|상|중|하)\]/) || [])[1] || null; items.push({ id, t: nm.replace(/^\[중고[^\]]*\]\s*/, ''), p: pr, g: gr, st: 'sell', url: `https://www.yes24.com/Product/Goods/${id}` }); } }
    if (!items.length) return NORES.test(H) ? { ok: true, d: { q: isbn, url, n: 0, items: [] } } : probe(H, '중고 목록을 못 읽음', url); const o = usedOut(items, isbn, title, url, cfg); o.d.items.forEach((x) => { x.sim = 1; x.byIsbn = true; }); return o; }; /* ISBN으로 찾은 글은 같은 책 — 제목 닮음과 상관없이 */
  ADP.bunjang = async ({ title, author, http, cfg }) => { const q = marketQuery(title, author); if (!q) return { skip: '제목 없음' }; const url = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${enc(q)}&order=score&page=0&n=60&stat_device=w`;
    const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` }; let j; try { j = J(r.text); } catch (e) { return probe(r.text, 'JSON이 아님', url); }
    const L = Array.isArray(j.list) ? j.list : findListings(j); const items = L.map((o) => ({ id: String(pick(o, IK) ?? ''), t: String(pick(o, TK) || ''), p: priceOf(o), st: stOf(pick(o, SK)) || 'sell', at: dateOf(o), loc: locOf(o), url: pick(o, IK) != null ? `https://m.bunjang.co.kr/products/${pick(o, IK)}` : null })).filter((x) => x.t);
    if (!items.length && !Array.isArray(j.list)) return probe(r.text, '목록 칸을 못 찾음', url); return usedOut(items, q, title, `https://m.bunjang.co.kr/search/products?q=${enc(q)}`, cfg); };
  const pageMarket = async ({ title, author, http, cfg }, mk, idUrl) => { const q = marketQuery(title, author); if (!q) return { skip: '제목 없음' }; const url = mk(q); const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
    const B = jsonBlobs(r.text); let L = []; for (const b of B) { const x = findListings(b); if (x.length > L.length) L = x; }
    const absU = (h) => { try { return new URL(String(h), url).href; } catch (e) { return null; } }; const items = L.map((o) => { const id = pick(o, IK); const href = pick(o, ['href', 'url', 'link', 'webUrl']); return { id: id != null ? String(id) : null, t: String(pick(o, TK) || ''), p: priceOf(o), st: stOf(pick(o, SK)), at: dateOf(o), loc: locOf(o), url: href && typeof href === 'string' ? absU(href) : id != null ? idUrl(id) : null }; }).filter((x) => x.t);
    if (!items.length) return NORES.test(r.text) ? { ok: true, d: { q, url, n: 0, items: [] } } : probe(r.text, '화면 안에서 글 목록을 못 찾음', url); return usedOut(items, q, title, url, cfg); };
  ADP.joongna = (a) => pageMarket(a, (q) => `https://web.joongna.com/search/${enc(q)}`, (id) => `https://web.joongna.com/product/${id}`);
  ADP.daangn = (a) => pageMarket(a, (q) => `https://www.daangn.com/kr/buy-sell/?search=${enc(q)}`, (id) => `https://www.daangn.com/kr/buy-sell/${id}`);

  /* ── 외국: eBay 공식 Browse API (미국 eBay · 한국으로 배송되는 즉시 구매 매물만 · 한국까지 배송비 포함) ── */
  const b64 = (s) => (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'utf8').toString('base64'));
  async function ebayToken({ keys, http, cache }) { const c = cache || {}; if (c.ebayTok && c.ebayTok.exp > Date.now() + 60000) return c.ebayTok.v;
    const r = await http({ method: 'POST', url: 'https://api.ebay.com/identity/v1/oauth2/token', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + b64(`${keys.ebayAppId}:${keys.ebayCertId}`) }, data: 'grant_type=client_credentials&scope=' + enc('https://api.ebay.com/oauth/api_scope') });
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
  ADP.ridi = async ({ isbn, title, author, http, cfg }) => { const q = marketQuery(title, author) || isbn; const url = `https://ridibooks.com/search?q=${enc(q)}`; const r = await http({ method: 'GET', url }); if (!okStatus(r)) return { ok: false, why: `HTTP ${r.status}` };
    let L = []; for (const b of jsonBlobs(r.text)) { const x = findListings(b); if (x.length > L.length) L = x; } if (!L.length) return NORES.test(r.text) ? { ok: true, none: true } : probe(r.text, '책 목록을 못 찾음', url);
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
    const U = dropOutliers(used.map((u) => u.v)); const N = dropOutliers(fresh); const base = lowQ(U.keep); const g = grade && C[grade] ? grade : '최상';
    const byG = {}; used.forEach((u) => { byG[u.g] = (byG[u.g] || 0) + 1; });
    return { n: (items || []).length, nUsed: used.length, nNew: fresh.length, ex, outUsed: U.out.length, outNew: N.out.length, base: base != null ? Math.round(base) : null, grade: g, value: base != null ? Math.round(base * C[g]) : null, usedMin: U.keep.length ? Math.round(U.keep[0] * C[g]) : null, usedMed: U.keep.length ? Math.round(median(U.keep) * C[g]) : null, newLowQ: N.keep.length ? Math.round(lowQ(N.keep)) : null, newMin: N.keep.length ? Math.round(N.keep[0]) : null, byG, fxDate: fx && fx.date, fxSrc: fx && fx.src, cur }; }
  /* 중고 장터 시세: 제목이 닮은 글(설정 '같은 책 닮음' 이상)만 · 값이 너무 낮은 글(나눔·가격 문의) 빼고 · 판매중·예약과 판매완료를 나눠 · 튀는 값 뺀 뒤 가장 싼 값·가운데 값·낮은 쪽 25% 가운데 값 */
  function usedStats(d, th, minP) { const T = th ?? CFG_DEF.sim, M = minP ?? CFG_DEF.usedMinPrice; const L = ((d && d.items) || []).filter((x) => (x.sim ?? 0) >= T && x.p != null && x.p >= M);
    const f = (a) => { const o = dropOutliers(a.map((x) => x.p)); return { n: a.length, out: o.out.length, min: o.keep.length ? o.keep[0] : null, med: o.keep.length ? Math.round(median(o.keep)) : null, lowQ: o.keep.length ? Math.round(lowQ(o.keep)) : null }; };
    return { match: L.length, all: ((d && d.items) || []).length, sell: f(L.filter((x) => x.st !== 'sold')), sold: f(L.filter((x) => x.st === 'sold')) }; }
  /* 기본 정보 합치기: 칸마다 정한 차례(설정 basicOrder)에서 처음 값이 있는 출처 — 어디서 왔는지(from)도 같이 */
  const BASIC_FIELDS = [['title', '제목'], ['sub', '부제'], ['authors', '지은이'], ['translators', '옮긴이'], ['publisher', '출판사'], ['pubDate', '출간일'], ['pages', '쪽수'], ['size', '크기'], ['weightG', '무게(g)'], ['priceList', '정가'], ['kdc', 'KDC 분류'], ['series', '시리즈'], ['lang', '언어'], ['desc', '소개']];
  function mergeBasic(doc, order) { const O = (order && order.length ? order : BASIC_ORDER).filter((k) => SOURCES[k] && SOURCES[k].grp === 'basic'); const src = (doc && doc.src) || {}; const out = {}, from = {}, diff = {};
    for (const [f] of BASIC_FIELDS) { const vals = []; for (const k of O) { const v = src[k] && src[k].d ? src[k].d[f] : null; if (v != null && v !== '') vals.push([k, v]); } if (vals.length) { out[f] = vals[0][1]; from[f] = vals[0][0]; const norm = (v) => (typeof v === 'number' ? v : String(v).replace(/\s+/g, '').toLowerCase()); const set = new Set(vals.map(([, v]) => norm(v))); if (set.size > 1 && f !== 'desc') diff[f] = vals.map(([k, v]) => ({ k, v })); } }
    return { v: out, from, diff }; }
  /* 저장할 때 '같은 내용인지' 보는 지문 — 시각처럼 늘 바뀌는 칸은 빼고 */
  function sig(d) { const norm = (x) => { if (Array.isArray(x)) return x.map(norm); if (x && typeof x === 'object') { const o = {}; Object.keys(x).sort().forEach((k) => { o[k] = norm(x[k]); }); /* 모든 칸을 봄(표·글 날짜까지) — 조금이라도 다르면 '바뀜'으로 옛 값을 남김 */ return o; } return x; }; const s = JSON.stringify(norm(d)); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + s.length; }
  const shard = (isbn) => (+String(isbn).slice(-2) || 0) % 8; // 출처별 '언제 봤나' 색인을 8개 문서로 나눔(문서 하나가 1MB를 넘지 않게)

  async function run(src, a) { const f = ADP[src]; if (!f) return { ok: false, why: '모르는 출처' }; const s = SOURCES[src]; if (!keysReady(src, a.keys)) return { skip: '키 없음' };
    if (s.grp === 'used' && src !== 'yes24used' && !a.title) return { skip: '제목 없음' }; try { return await f(a); } catch (e) { return { ok: false, why: e.message || String(e) }; } }

  const api = { VERSION, KEYS, GROUPS, SOURCES, ORDER, BASIC_ORDER, BASIC_FIELDS, CFG_DEF, cfgOf, keysReady, isKrIsbn, coreTitle, sim, marketQuery, jsonBlobs, findListings, tableKV, meta, strip, ymd, toNum, run, fxRun, toKrw, median, lowQ, dropOutliers, foreignStats, usedStats, mergeBasic, sig, shard, stOf, FX_CUR, _adp: ADP, _pageBook: pageBook };
  if (typeof module === 'object' && module.exports) module.exports = api; root.ReadnowExt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
