/* 📊 우리숍 booksqueen.com 백오피스 — 방문·행동 모으기와 셈 · 손님 활동 시간줄 · 상품 전환 · 문의 · 배너 · 손님 화면 미리 보기 (11/13 · 일꾼 shopadm1)
 *  정범님 11/13 21:44 「백오피스도 좀 더 확장해서 개선 · 손님의 활동·상품 및 숍 방문 등 대표 플랫폼 참고해 최대한 기능을 가져와 모두 구현」 · 작업판 v11 「손님 화면을 내가 직접 볼 수 있게」
 *  견준 사례(헌장 제27조 · readnow-chats reports/SHOPADM1_1113.md 표): Shopify 관리자(실시간 방문·전환 깔때기·손님 시간줄·메모·태그) · 카페24(방문자 분석·유입 경로·인기 검색어) ·
 *   네이버 스마트스토어 센터(비즈어드바이저 — 유입 채널·기기·상품별 조회→결제율) · 쿠팡 윙(상품별 조회·장바구니·판매) · 아임웹(방문 통계·배너) · GA4(실시간·참여·이탈) ·
 *   Amplitude류(행동 깔때기·사용자 경로) · Zendesk류(문의함 — 새 문의·답함·끝남 · 답 글)
 *  손님 정보(F39 · 정범님 11/13 23:30 「파기하지 않고 파기 기간도 지금은 정하지 않음 · 오픈 전 법적 자문 뒤 적용 · 손님 정보·IP 수집을 막는 기능은 넣지 않음」):
 *   · 활동 시간줄을 손님마다(로그인 = 손님 번호 · 비회원 = 무작위 기기 번호) 하루 문서로 남김 · IP 주소(전체)·기기 정보(브라우저 이름 글)도 그 문서에
 *   · 보존 기간 없음 · 지우지 않음(헌장 제7조) · 개인정보 처리방침 8번에 수집 항목과 '별도 고지 전까지 보관'(shop-track.js가 화면에 넣음)
 *   · 🧪 시험 계정 행동은 합계에서 빼고 시간줄은 시험 표시로 백오피스 기록에만(F37)
 *  비용: 모은 수는 기억에 두었다가 1분마다 하루 몫 문서 하나(shop_stats/<날짜>)에 더하기(increment)로 한 번 씀 · 로그인 손님 시간줄은 1분마다 손님·하루 문서 하나
 *  창구
 *    POST /shop/t                 손님 화면 shop-track.js가 모아 보냄(text/plain JSON · sendBeacon) → 204
 *    POST /shop/ask · GET /shop/ask  💬 문의 남기기 · 내 문의 보기(문의 번호 + 조회 열쇠)
 *    GET/POST /shop/pv            👀 손님 화면 미리 보기(관리자가 받은 30분 표 · 읽기만 — 쓰는 일은 모두 막음)
 *  운영자(관리 웹앱 → 클라우드 /shop-anl · 로그인 허용 계정만): dash · users · user · memo · items · asks · askAns · pvTicket · cfg */
'use strict';
const crypto = require('crypto');
const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 200);
const sLong = (v, n) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n);
const H = (x) => crypto.createHash('sha256').update(String(x)).digest('hex');
const rnd = (n) => crypto.randomBytes(n).toString('hex');
const kday = (t) => new Date((t == null ? Date.now() : +t) + 9 * 3600e3).toISOString().slice(0, 10);
const khour = (t) => new Date((t == null ? Date.now() : +t) + 9 * 3600e3).getUTCHours();
const kmin10 = (t) => { const d = new Date((t == null ? Date.now() : +t) + 9 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + String(Math.floor(d.getUTCMinutes() / 10)); };
const dayAdd = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

/* ── 설정(app_settings/shop.anl) — 기본값 · 모두 웹앱 📊 백오피스 › ⚙ 설정에서 바꿈(약속 79) */
const ANL_DEF = {
  aggDays: 730, /* 합계 수(개인 정보 없음) 보여 줄 범위 */
  exTest: 1, /* 🧪 시험 계정 행동은 합계에서 뺌(따로 '시험' 수로만) */
  topN: 20, /* 표마다 줄 수 */
  staleDays: 90, /* 오래 안 팔림 기준(등록 뒤 일) */
  hotMin: 15, /* 많이 보는데 안 팔림 — 기간 안 조회 이만큼 넘고 주문 0 */
  lowStock: 1, /* 같은 책(ISBN) 판매중 권수가 이 수 이하인데 찜·알림이 걸리면 재고 알림 */
  tiers: [[1, '첫 구매'], [2, '다시 산 손님'], [5, '단골'], [10, 'VIP']], /* [입금 확인 주문 수, 등급 이름] — 0번은 '구매 전' */
  ask: 1, /* 손님 화면 💬 문의 단추 */
  emShow: 1, /* 손님 목록 메일: 1 = 모두(기본 · F39) · 0 = 가려서(a***@n***.com) */
  dash: ['live', 'sum', 'daily', 'hour', 'ref', 'dev', 'geo', 'funnel', 'exit', 'items', 'search', 'cats'], /* 대시보드에 보일 칸과 차례 */
  bnr: [], /* 📢 배너 [{ id, tx, url, tone, on, from, to }] */
};
const DASH_ALL = { live: '🟢 지금', sum: '📈 기간 합계', daily: '📅 날마다', hour: '🕐 시간대', ref: '🧭 유입 경로', dev: '📱 기기·브라우저', geo: '🗺 지역(시·도)', funnel: '🛒 장바구니 → 주문 깔때기', exit: '🚪 이탈 지점', items: '📚 많이 본 상품', search: '🔎 인기 검색어', cats: '🗂 많이 본 분류' };
const ANL_SCHEMA = [
  { k: 'aggDays', t: '합계 수 보는 범위(일)', ty: 'num', min: 30, max: 3650 },
  { k: 'exTest', t: '🧪 시험 계정 행동은 합계에서 뺌', ty: 'bool' },
  { k: 'topN', t: '표마다 줄 수', ty: 'num', min: 5, max: 100 },
  { k: 'staleDays', t: '오래 안 팔림 — 등록 뒤 며칠', ty: 'num', min: 7, max: 1000 },
  { k: 'hotMin', t: '많이 보는데 안 팔림 — 기간 안 조회 몇 번 넘게', ty: 'num', min: 1, max: 10000 },
  { k: 'lowStock', t: '재고 알림 — 같은 책 판매중 몇 권 이하', ty: 'num', min: 0, max: 20 },
  { k: 'tiers', t: '손님 등급(입금 확인 주문 수:이름 · 쉼표)', ty: 'tiers' },
  { k: 'ask', t: '손님 화면 💬 문의 단추', ty: 'bool' },
  { k: 'emShow', t: '손님 목록에 메일 모두 보이기', ty: 'bool', why: '끄면 화면에서만 가려 보임(모으는 것은 그대로)' },
  { k: 'dash', t: '대시보드 칸(차례대로 · 쉼표)', ty: 'list', all: DASH_ALL },
];
function tiersOf(v) { const L = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((x) => x.split(':')) : []).map((x) => [Math.max(1, Math.round(+x[0] || 0)), s(x[1], 12)]).filter((x) => x[0] > 0 && x[1]); const seen = new Set(); return L.filter((x) => !seen.has(x[0]) && seen.add(x[0])).sort((a, b) => a[0] - b[0]).slice(0, 8); }
function cfgOf(raw) { const r = raw && typeof raw === 'object' ? raw : {}; const o = { ...ANL_DEF };
  for (const p of ANL_SCHEMA) { if (!(p.k in r)) continue; const v = r[p.k];
    if (p.ty === 'bool') o[p.k] = v ? 1 : 0; else if (p.ty === 'num') { const n = Math.round(+v); if (Number.isFinite(n)) o[p.k] = Math.max(p.min, Math.min(p.max, n)); }
    else if (p.ty === 'tiers') { const t = tiersOf(v); if (t.length) o[p.k] = t; } else if (p.ty === 'list') { const L = (Array.isArray(v) ? v : String(v).split(',')).map((x) => s(x, 12)).filter((x) => DASH_ALL[x]); o[p.k] = [...new Set(L)]; } }
  o.bnr = bnrClean(r.bnr); return o; }
/* ── 📢 배너 — 관리자가 적은 것 · 손님 화면엔 지금 켜진 것만(기간 안) · 주소는 우리숍 안(#/…) 또는 https만 */
const TONES = ['info', 'sale', 'warn', 'new'];
function bnrClean(L) { return (Array.isArray(L) ? L : []).slice(0, 12).map((b, i) => { b = b || {}; const url = s(b.url, 300); return { id: s(b.id, 20) || 'b' + (i + 1), tx: s(b.tx, 120).replace(/[<>]/g, ''), url: /^#\/[^\s]*$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url) ? url : '', tone: TONES.includes(b.tone) ? b.tone : 'info', on: b.on ? 1 : 0, from: /^\d{4}-\d\d-\d\d$/.test(String(b.from || '')) ? b.from : '', to: /^\d{4}-\d\d-\d\d$/.test(String(b.to || '')) ? b.to : '' }; }).filter((b) => b.tx); }
function bnrPub(L, now) { const d = kday(now); return bnrClean(L).filter((b) => b.on && (!b.from || b.from <= d) && (!b.to || b.to >= d)).slice(0, 3).map((b) => ({ id: b.id, tx: b.tx, url: b.url, tone: b.tone })); }

/* ── 유입 경로 · 기기 · 브라우저 */
const SEARCH = /(^|\.)(google\.|naver\.com$|search\.naver|m\.search\.naver|daum\.net$|search\.daum|bing\.com$|yahoo\.|duckduckgo\.com$|zum\.com$|baidu\.com$|yandex\.)/i;
const SNS = /(^|\.)(instagram\.com|facebook\.com|fb\.com|t\.co|twitter\.com|x\.com|threads\.net|youtube\.com|youtu\.be|kakao\.com|kakaocdn|band\.us|blog\.naver\.com|cafe\.naver\.com|cafe\.daum\.net|tiktok\.com|pinterest\.|linkedin\.com|reddit\.com)$/i;
const OWN = /(^|\.)(booksqueen\.(com|web\.app|firebaseapp\.com))$/i;
const AD_MED = /^(cpc|ppc|paid|ad|ads|display|banner|cpm|paidsocial|paid_social|sa|gfa)$/i;
function refKind(host, utm) { const h = String(host || '').toLowerCase(); const u = utm || {};
  if (u.m && AD_MED.test(u.m)) return '광고'; if (u.gclid || u.n) return '광고'; if (u.s && /^(insta|instagram|facebook|fb|kakao|band|twitter|x|threads|youtube|tiktok)/i.test(u.s)) return 'SNS'; if (u.s && /^(naver|google|daum|bing)$/i.test(u.s) && !u.m) return '검색';
  if (!h) return u.s ? '다른 사이트' : '직접'; if (OWN.test(h)) return '직접'; if (SNS.test(h)) return 'SNS'; if (SEARCH.test(h)) return '검색'; return '다른 사이트'; }
function uaInfo(ua0) { const ua = String(ua0 || ''); const bot = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|preview|python-requests|curl\/|wget|go-http|node-fetch|axios|playwright|puppeteer/i.test(ua);
  const tab = /iPad|Tablet|SM-T|Tab(?!le)|Nexus (7|9|10)/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)); const mob = !tab && /Mobi|iPhone|iPod|Android.*Mobile|SamsungBrowser.*Mobile/i.test(ua);
  const br = /SamsungBrowser/i.test(ua) ? '삼성 인터넷' : /NAVER\(inapp|Whale/i.test(ua) ? (/Whale/i.test(ua) ? '웨일' : '네이버 앱') : /KAKAOTALK/i.test(ua) ? '카카오톡 안' : /Instagram|FBAN|FBAV/i.test(ua) ? 'SNS 앱 안' : /Edg\//i.test(ua) ? '엣지' : /OPR\/|Opera/i.test(ua) ? '오페라' : /Firefox|FxiOS/i.test(ua) ? '파이어폭스' : /CriOS|Chrome\//i.test(ua) ? '크롬' : /Safari\//i.test(ua) ? '사파리' : '그 밖';
  const os = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? '안드로이드' : /Windows/i.test(ua) ? '윈도' : /Mac OS X|Macintosh/i.test(ua) ? '맥' : /Linux|CrOS/i.test(ua) ? '리눅스·크롬북' : '그 밖';
  return { dev: tab ? '태블릿' : mob ? '휴대폰' : 'PC', br, os, bot: bot ? 1 : 0 }; }
const swB = (w) => { const n = +w || 0; return !n ? '모름' : n < 400 ? '~399' : n < 768 ? '400~767' : n < 1024 ? '768~1023' : n < 1440 ? '1024~1439' : '1440~'; };
/* 지역 — Cloud Run 앞(구글 앞단)이 지역 머리를 붙여 줄 때만 씀(IP는 안 봄) · 없으면 '모름' · 주문 배송지 시·도는 웹앱이 주문에서 셈 */
const SIDO = [['서울', /^서울/], ['부산', /^부산/], ['대구', /^대구/], ['인천', /^인천/], ['광주', /^광주/], ['대전', /^대전/], ['울산', /^울산/], ['세종', /^세종/], ['경기', /^경기/], ['강원', /^강원/], ['충북', /^(충북|충청북)/], ['충남', /^(충남|충청남)/], ['전북', /^(전북|전라북)/], ['전남', /^(전남|전라남)/], ['경북', /^(경북|경상북)/], ['경남', /^(경남|경상남)/], ['제주', /^제주/]];
const sido = (a) => { const t = String(a || '').trim().replace(/^\(?\d{5}\)?\s*/, ''); for (const [k, re] of SIDO) if (re.test(t)) return k; return t ? '그 밖' : '모름'; };
const GEO_RE = [[/^(seoul|11)$/i, '서울'], [/^(busan|26)$/i, '부산'], [/^(daegu|27)$/i, '대구'], [/^(incheon|28)$/i, '인천'], [/^(gwangju|29)$/i, '광주'], [/^(daejeon|30)$/i, '대전'], [/^(ulsan|31)$/i, '울산'], [/^(sejong|50)$/i, '세종'], [/^(gyeonggi|41)/i, '경기'], [/^(gangwon|42|51)/i, '강원'], [/^(chungcheongbuk|north chungcheong|43)/i, '충북'], [/^(chungcheongnam|south chungcheong|44)/i, '충남'], [/^(jeollabuk|north jeolla|45|52)/i, '전북'], [/^(jeollanam|south jeolla|46)/i, '전남'], [/^(gyeongsangbuk|north gyeongsang|47)/i, '경북'], [/^(gyeongsangnam|south gyeongsang|48)/i, '경남'], [/^(jeju|49)/i, '제주']];
function geoOf(hd) { hd = hd || {}; const c = String(hd['x-client-geo-country'] || hd['x-appengine-country'] || hd['cf-ipcountry'] || '').toUpperCase(); const r0 = String(hd['x-client-geo-region'] || hd['x-client-geo-subdivision'] || hd['x-appengine-region'] || '').replace(/^KR-/i, '').trim();
  if (c && c !== 'KR' && c !== 'ZZ') return '나라 밖'; if (!r0) return '모름'; for (const [re, k] of GEO_RE) if (re.test(r0)) return k; return '그 밖'; }

/* ── 손님 화면이 보낸 묶음 검사 — 이상한 것은 버림 · 글자 길이 자름 */
const ROUTES = new Set(['home', 'list', 'b', 'cart', 'order', 'done', 'shelf', 'me', 'wish', 'login', 'p', 'my', 'pf', 'bl', 'feed', 'lib', 'al', 'ask', 'etc']);
const KINDS = new Set(['p', 's', 'c', 'v', 'ca', 'cr', 'w', 'wr', 'o', 'od', 'x', 'f']);
const ID_RE = /^[0-9A-Za-z_-]{1,40}$/;
function cleanBatch(b) { b = b && typeof b === 'object' ? b : {}; const E = [];
  for (const e of (Array.isArray(b.E) ? b.E : []).slice(0, 60)) { if (!Array.isArray(e)) continue; const k = String(e[0] || ''); if (!KINDS.has(k)) continue; let a = s(e[1], k === 's' ? 40 : k === 'c' ? 120 : 40); const x = s(e[2], 40); const t = Math.round(+e[3] || 0);
    if ((k === 'p' || k === 'x') && !ROUTES.has(a)) a = 'etc'; if (['v', 'ca', 'cr', 'w', 'wr'].includes(k) && !ID_RE.test(a)) continue; if (k === 'f' && !['v', 'c', 'o', 'd'].includes(a)) continue; if (k === 's') a = a.toLowerCase().replace(/\s+/g, ' '); if (k === 's' && [...a].length < 1) continue;
    E.push([k, a, x, t]); }
  const utm = b.utm && typeof b.utm === 'object' ? { s: s(b.utm.s, 30), m: s(b.utm.m, 30), c: s(b.utm.c, 40), n: b.utm.n ? 1 : 0, gclid: b.utm.g ? 1 : 0 } : null;
  return { vid: /^[0-9a-f]{16}$/.test(String(b.vid || '')) ? b.vid : null, sid: /^[0-9a-f]{12}$/.test(String(b.sid || '')) ? b.sid : null, nv: b.nv ? 1 : 0, ns: b.ns ? 1 : 0, ref: s(b.ref, 80).toLowerCase().replace(/^www\./, ''), utm, sw: Math.max(0, Math.min(10000, Math.round(+b.sw || 0))), no: b.no ? 1 : 0, tk: /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(String(b.tk || '')) ? b.tk : null, E }; }

/* ── 기억 속 모음(acc) → 하루 몫 문서에 더할 꼴 */
const CAP = { it: 3000, ic: 2000, iw: 2000, sq: 1500, cp: 1500, rh: 400, utm: 200 }; /* 하루 문서 칸 수 한도(문서 1MB 한도 안 · 근거: 칸 하나 ≈ 40바이트 → 3,000칸 ≈ 120KB) */
function accNew(day) { return { day, n: 0, m: {} }; }
function bump(acc, path, k, n) { const m = acc.m[path] || (acc.m[path] = {}); if (k == null) { acc.m[path] = (typeof acc.m[path] === 'number' ? acc.m[path] : 0) + (n || 1); return; } m[k] = (m[k] || 0) + (n || 1); acc.n++; }
function bumpN(acc, path, n) { acc.m[path] = (typeof acc.m[path] === 'number' ? acc.m[path] : 0) + (n || 1); acc.n++; }
/* 한 묶음을 모음에 더함 · meta = { ua, geo, test(시험 계정), keys(하루 칸 수 셈 — 한도 넘는 새 칸은 '그 밖') } */
function addBatch(acc, B, meta) { meta = meta || {}; const ui = uaInfo(meta.ua); if (ui.bot) { bumpN(acc, 'bot'); return { bot: 1 }; }
  if (meta.test && meta.exTest) { bumpN(acc, 'tst', B.E.length || 1); return { test: 1 }; }
  const keys = meta.keys || (acc.keys || (acc.keys = {})); const key = (path, k) => { const K = keys[path] || (keys[path] = new Set()); if (K.has(k)) return k; if (K.size >= (CAP[path] || 1e9)) return '(그 밖)'; K.add(k); return k; };
  if (B.nv) bumpN(acc, 'uv'); if (B.ns) { bumpN(acc, 'ss'); bump(acc, 'ref', refKind(B.ref, B.utm)); if (B.ref && !OWN.test(B.ref)) bump(acc, 'rh', key('rh', B.ref.replace(/\./g, '·'))); if (B.utm && B.utm.s) bump(acc, 'utm', key('utm', B.utm.s)); bump(acc, 'dev', ui.dev); bump(acc, 'br', ui.br); bump(acc, 'os', ui.os); bump(acc, 'sw', swB(B.sw)); bump(acc, 'geo', meta.geo || '모름'); if (meta.login) bumpN(acc, 'li'); }
  for (const [k, a, , t] of B.E) { const tt = t || Date.now();
    if (k === 'p') { bumpN(acc, 'pv'); bump(acc, 'rt', a); bump(acc, 'h', String(khour(tt))); bump(acc, 'mn', kmin10(tt)); }
    else if (k === 'v') bump(acc, 'it', key('it', a)); else if (k === 'ca') { bump(acc, 'ic', key('ic', a)); bumpN(acc, 'cadd'); } else if (k === 'cr') bumpN(acc, 'crm');
    else if (k === 'w') { bump(acc, 'iw', key('iw', a)); bumpN(acc, 'wadd'); } else if (k === 's') bump(acc, 'sq', key('sq', a.replace(/[.~*/[\]]/g, ' ').trim() || '(기호)')); else if (k === 'c') bump(acc, 'cp', key('cp', a.replace(/[.~*/[\]]/g, '·')));
    else if (k === 'od') bumpN(acc, 'od'); else if (k === 'x') bump(acc, 'ex', a); else if (k === 'f') bump(acc, 'fun', a); }
  if (B.ns) bump(acc, 'fun', 's'); return { ok: 1 }; }
/* 모음 → Firestore 쓰기 꼴(FV.increment) */
function toWrite(acc, FV, extra) { const o = { day: acc.day, up: new Date().toISOString(), ...(extra || {}) }; for (const [p, v] of Object.entries(acc.m)) { if (typeof v === 'number') o[p] = FV.increment(v); else { o[p] = {}; for (const [k, n] of Object.entries(v)) o[p][k] = FV.increment(n); } } return o; }

/* ── 여러 날 문서 합치기 · 깔때기 · 견주기 */
const NUMS = ['pv', 'uv', 'ss', 'bot', 'tst', 'li', 'cadd', 'crm', 'wadd', 'od'];
function mergeDays(docs) { const o = { days: 0, daily: [] }; for (const k of NUMS) o[k] = 0;
  for (const d of docs || []) { if (!d) continue; o.days++; o.daily.push({ day: d.day, pv: +d.pv || 0, uv: +d.uv || 0, ss: +d.ss || 0, od: +d.od || 0, cadd: +d.cadd || 0 });
    for (const k of NUMS) o[k] += +d[k] || 0; for (const [p, v] of Object.entries(d)) { if (!v || typeof v !== 'object' || Array.isArray(v) || p === 'live') continue; const m = o[p] || (o[p] = {}); for (const [k, n] of Object.entries(v)) if (typeof n === 'number') m[k] = (m[k] || 0) + n; } }
  o.daily.sort((a, b) => String(a.day).localeCompare(String(b.day))); return o; }
function funnel(m) { const f = (m && m.fun) || {}; const st = [['s', '방문(세션)'], ['v', '상품을 봄'], ['c', '장바구니에 담음'], ['o', '주문서를 엶'], ['d', '주문 마침']]; const top = +f.s || 0;
  return st.map(([k, t], i) => { const n = +f[k] || 0; const prev = i ? +f[st[i - 1][0]] || 0 : n; return { k, t, n, of: top ? Math.round((n / top) * 1000) / 10 : 0, step: prev ? Math.round((n / prev) * 1000) / 10 : 0, drop: i && prev ? Math.max(0, prev - n) : 0 }; }); }
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : a ? null : 0); /* 지난 기간 대비(%) — 지난 기간 0이면 null('새로') */
const topOf = (m, n) => Object.entries(m || {}).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n || 20);

/* ── 상품 표 — 조회·찜·담기·주문 · 오래 안 팔림 · 많이 보는데 안 팔림 · 재고 알림 */
function itemRows(M, items, ords, c, now, demand) { c = c || ANL_DEF; now = now || Date.now(); const V = (M && M.it) || {}, W = (M && M.iw) || {}, A = (M && M.ic) || {}; const O = {}; for (const o of ords || []) for (const x of o.items || []) if (x && x.lid) O[x.lid] = (O[x.lid] || 0) + 1;
  const ids = new Set([...Object.keys(V), ...Object.keys(W), ...Object.keys(A), ...Object.keys(O)]); const I = items || new Map(); const rows = [];
  for (const id of ids) { if (id === '(그 밖)') continue; const it = I.get(id); const v = V[id] || 0, w = W[id] || 0, a = A[id] || 0, od = O[id] || 0; rows.push({ id, t: it ? it.t : null, p: it ? it.p : null, g: it ? it.g : null, at: it ? it.at : null, on: it ? 1 : 0, v, w, a, od, cv: v ? Math.round((od / v) * 1000) / 10 : 0, ca: v ? Math.round((a / v) * 1000) / 10 : 0 }); }
  const hot = rows.filter((r) => r.on && r.v >= c.hotMin && !r.od).sort((p, q) => q.v - p.v);
  const age = (x) => (x && x.at ? Math.floor((now - Date.parse(x.at)) / 864e5) : null);
  const stale = []; for (const [id, it] of I) { const d = age(it); if (d != null && d >= c.staleDays) stale.push({ id, t: it.t, p: it.p, g: it.g, at: it.at, d, v: V[id] || 0, w: W[id] || 0 }); }
  stale.sort((p, q) => p.v - q.v || q.d - p.d);
  const low = []; const D = demand || new Map(); /* ISBN → { wish, alert, t } (손님 찜·재입고 알림) */ const byIsbn = new Map(); for (const it of I.values()) if (it.isbn) byIsbn.set(it.isbn, (byIsbn.get(it.isbn) || 0) + 1);
  for (const [isbn, d] of D) { const n = byIsbn.get(isbn) || 0; if (n <= c.lowStock && (d.wish || d.alert)) low.push({ isbn, t: d.t, n, wish: d.wish || 0, alert: d.alert || 0 }); }
  low.sort((p, q) => q.alert + q.wish - (p.alert + p.wish) || p.n - q.n);
  return { rows: rows.sort((p, q) => q.v - p.v || q.od - p.od), hot, stale, low, staleN: stale.length }; }

/* ── 손님 등급 · 메일 가리기 */
function tierOf(paidN, c) { const T = tiersOf((c || ANL_DEF).tiers); let t = '구매 전'; for (const [n, nm] of T) if (paidN >= n) t = nm; return t; }
function maskEm(em) { const m = /^([^@]{0,64})@(.+)$/.exec(String(em || '')); if (!m) return ''; const [a, d] = [m[1], m[2]]; const dd = d.split('.'); return (a.slice(0, 1) || '') + '***@' + (dd[0] ? dd[0].slice(0, 1) + '***' : '') + (dd.length > 1 ? '.' + dd.slice(1).join('.') : ''); }
/* CSV(엑셀에서 한글이 깨지지 않게 BOM · 수식으로 읽힐 글자 앞에 ') */
function csv(rows, cols) { const q = (v) => { let t = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }; return '﻿' + [cols.map((c) => q(c[1])).join(','), ...(rows || []).map((r) => cols.map((c) => q(typeof c[0] === 'function' ? c[0](r) : r[c[0]])).join(','))].join('\r\n'); }
/* 손님 시간줄 한 줄 글(웹앱이 그대로 보여 줌) */
const EV_T = { p: '화면', s: '🔎 찾기', c: '🗂 분류', v: '👀 상품 봄', ca: '🛒 담음', cr: '🛒 뺌', w: '♡ 찜', wr: '♡ 찜 뺌', o: '🧾 주문서', od: '✅ 주문 마침', x: '🚪 나감' };

function makeAnl({ db, C, FV, log, authOf, cfg, ready, vw, held, soldX, view, acctLib, srv }) {
  const A = acctLib || {}; const INST = s(srv || process.env.K_SERVICE || 'local', 30) + '-' + rnd(3);
  const M = { acc: accNew(kday()), ua: new Map(), live: new Map(), keys: {}, flushAt: 0, t: null, busy: null, err: null, n: 0, drop: 0 };
  let CF = { at: 0, v: cfgOf({}) };
  async function conf() { if (Date.now() - CF.at < 60e3) return CF.v; try { const c = await cfg(); CF = { at: Date.now(), v: cfgOf(c && c.anl) }; } catch (e) { CF.at = Date.now() - 30e3; } return CF.v; }
  /* 1분마다 한 번 씀 — 하루가 바뀌면 바로 */
  async function flush() { if (M.busy) return M.busy; const acc = M.acc; const U = M.ua; const t = Date.now(); const lv = [...M.live.values()].filter((x) => t - x < 300e3).length; for (const [k, x] of M.live) if (t - x > 600e3) M.live.delete(k);
    if (!acc.n && !U.size && !(acc.m.uv || acc.m.ss || acc.m.bot || acc.m.tst)) return null; M.acc = accNew(kday()); if (M.acc.day !== acc.day) M.keys = {}; M.ua = new Map(); M.flushAt = t;
    M.busy = (async () => { try { const W = [C('shop_stats').doc(acc.day).set(toWrite(acc, FV, { live: { [INST]: { at: new Date(t).toISOString(), n: lv } } }), { merge: true })];
        for (const [id, v] of U) W.push(C('shop_uact').doc(id).set({ uid: v.uid, vid: v.vid, day: v.day, test: v.test, n: FV.increment(v.ev.length), up: new Date(t).toISOString(), dev: v.dev, ua: v.ua, ...(v.ref ? { ref: v.ref } : {}), ...(v.utm ? { utm: v.utm } : {}), ...(v.ip.size ? { ip: FV.arrayUnion(...v.ip) } : {}), ...(v.ev.length ? { ev: FV.arrayUnion(...v.ev) } : {}) }, { merge: true }));
        await Promise.all(W); M.err = null; } catch (e) { M.err = s(e.message, 120); log && log('📊 우리숍 방문 셈 쓰기 실패', M.err); } finally { M.busy = null; } })(); return M.busy; }
  const tick = () => { if (M.t) return; M.t = setTimeout(() => { M.t = null; flush().catch(() => {}); }, 60e3); if (M.t.unref) M.t.unref(); };
  /* POST /shop/t */
  const ipOf = (req) => s(String((req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || '').split(',')[0], 60) || null; /* (F39) IP 전체 */
  async function ingest(req, body) { const c = await conf(); const B = cleanBatch(body); if (!B.sid || !B.E.length && !B.ns) return; if (kday() !== M.acc.day) await flush();
    M.live.set(B.sid, Date.now()); M.n++;
    let au = null; if (B.tk && authOf) { try { au = await authOf({ headers: { authorization: 'Bearer ' + B.tk } }); } catch (e) { au = null; } }
    const ua0 = s(req.headers['user-agent'], 300); const r = addBatch(M.acc, B, { ua: ua0, geo: geoOf(req.headers), test: au && au.u && au.u.test, exTest: c.exTest, login: !!au, keys: M.keys });
    if (r.bot || (!au && !B.vid)) { tick(); return; } /* 시간줄 = 로그인 손님은 손님 번호 · 비회원은 기기 번호(F39) */
    const day = kday(); const id = (au ? au.uid : 'v' + B.vid) + '_' + day.replace(/-/g, ''); const ui = uaInfo(ua0); const ip = ipOf(req);
    const u = M.ua.get(id) || { uid: au ? au.uid : null, vid: B.vid || null, day, test: au && au.u.test ? 1 : 0, ev: [], ip: new Set(), dev: ui.dev + ' · ' + ui.os + ' · ' + ui.br, ua: ua0, ref: null };
    if (ip) u.ip.add(ip); if (B.ns && B.ref) u.ref = B.ref; if (B.ns && B.utm && B.utm.s) u.utm = B.utm.s;
    for (const [k, a, x, t] of B.E) { if (k === 'f') continue; if (u.ev.length >= 300) break; const tt = t && Math.abs(t - Date.now()) < 864e5 ? t : Date.now(); u.ev.push({ t: new Date(tt).toISOString(), k, a, ...(x ? { x } : {}), q: M.n % 1000 }); }
    M.ua.set(id, u); tick(); }
  /* 💬 문의 — 손님이 남김(로그인 안 해도 · 연락처 선택) · 답은 같은 화면에서 문의 번호+열쇠로 봄 */
  const ASKW = new Map();
  async function askNew(req, b, ipk) { const c = await conf(); if (!c.ask) return [403, { ok: false, err: '지금은 문의를 받지 않습니다' }]; if (b.hp) return [400, { ok: false, err: '잘못된 요청' }];
    const k = ipk || 'x'; const L = (ASKW.get(k) || []).filter((x) => Date.now() - x < 3600e3); if (L.length >= 5) return [429, { ok: false, err: '잠시 뒤 다시 남겨 주세요(한 시간에 5번까지)' }];
    const tx = sLong(b.tx, 2000); if ([...tx].length < 5) return [400, { ok: false, err: '문의 글을 5자 넘게 적어 주세요' }]; if ([...tx].length > 1000) return [400, { ok: false, err: '문의는 1,000자까지' }];
    const kind = ['book', 'order', 'ship', 'etc'].includes(b.kind) ? b.kind : 'etc'; const ct = s(b.ct, 80); const nm = s(b.nm, 20);
    let au = null; if (b.tk && authOf) { try { au = await authOf({ headers: { authorization: 'Bearer ' + b.tk } }); } catch (e) {} }
    const aid = 'q' + kday().replace(/-/g, '').slice(2) + rnd(4); const tok = rnd(8); const at = new Date().toISOString();
    await C('shop_asks').doc(aid).set({ aid, at, st: 'new', kind, tx, nm: nm || null, ct: ct || null, id: s(b.id, 40) || null, t: s(b.t, 120) || null, no: s(b.no, 30) || null, uid: au ? au.uid : null, nick: au ? au.u.nick : null, test: au && au.u.test ? 1 : 0, tokH: H(tok), ip: ipOf(req), ua: s(req.headers && req.headers['user-agent'], 300), ans: [], up: at });
    L.push(Date.now()); ASKW.set(k, L); if (ASKW.size > 5000) ASKW.clear(); log && log('💬 우리숍 문의 ' + aid); return [200, { ok: true, aid, t: tok }]; }
  async function askGet(q) { const aid = String(q.aid || ''); if (!/^q\d{6}[0-9a-f]{8}$/.test(aid)) return [400, { ok: false, err: '문의 번호가 이상함' }]; const d = await C('shop_asks').doc(aid).get(); const v = d.exists ? d.data() : null; if (!v || v.tokH !== H(String(q.t || ''))) return [404, { ok: false, err: '문의를 찾을 수 없습니다' }];
    return [200, { ok: true, aid, at: v.at, st: v.st, kind: v.kind, tx: v.tx, t: v.t, ans: (v.ans || []).filter((a) => a && !a.hid).map((a) => ({ tx: a.tx, at: a.at })) }]; }
  /* 👀 손님 화면 미리 보기 — 표(30분) 확인 · 읽는 일만 그 손님 것으로 · 쓰는 일은 모두 막음 */
  const PVC = new Map();
  async function pvOf(tk) { if (!/^[0-9a-f]{40}$/.test(String(tk || ''))) return null; const c = PVC.get(tk); if (c && Date.now() - c.at < 60e3) return c.v; const d = await C('shop_pv').doc(H(tk)).get(); const v = d.exists ? d.data() : null; const ok = v && Date.parse(v.exp) > Date.now() ? v : null; PVC.set(tk, { at: Date.now(), v: ok }); if (PVC.size > 200) PVC.clear(); return ok; }
  const READ_OPS = new Set(['me', 'orders', 'myRv', 'mine', 'alerts', 'blMine', 'folList', 'feed', 'myLikes']);
  const PV_NO = [403, { ok: false, pv: 1, err: '👀 손님 화면 미리 보기 — 읽기만 합니다(저장·주문·글쓰기는 하지 않음)' }];
  async function pvOp(tk, b) { const T = await pvOf(tk); if (!T) return [401, { ok: false, err: '미리 보기 표가 끝났습니다 — 관리 웹앱에서 다시 여세요', pvEnd: 1 }]; b = b || {}; const o = String(b.op || '');
    if (!T.uid) return o === 'me' ? [401, { ok: false, login: 1, err: '로그아웃 손님 화면' }] : PV_NO; if (!READ_OPS.has(o)) return PV_NO;
    const ud = await C('shop_users').doc(T.uid).get(); const u = ud.exists ? ud.data() : null; if (!u || u.gone) return [401, { ok: false, login: 1, err: '없는 손님' }]; const uid = u.uid;
    const rdList = Object.entries(u.rd || {}).filter(([, r]) => r && r.s).map(([k, r]) => ({ k, ...r })).sort((a, b2) => String(b2.at || '').localeCompare(String(a.at || '')));
    const qPub = (x) => ({ qid: x.qid, uid: x.uid, nick: x.nick, tx: x.tx, pg: x.pg || null, at: x.at, t: x.t || null, k: x.k, ...(x.uid === uid ? { mine: 1 } : {}) }); const rvPub = A.rvPub || ((r) => r);
    if (o === 'me') { const cnt = { want: 0, ing: 0, done: 0 }; rdList.forEach((r) => { if (cnt[r.s] != null) cnt[r.s]++; });
      return [200, { ok: true, me: { uid, em: maskEm(u.em), nick: u.nick, bio: u.bio || '', test: u.test ? 1 : 0, at: u.at, notif: { order: 1, restock: 1, price: 1, follow: 1, news: 0, ...(u.notif || {}) }, goal: A.goalOf ? A.goalOf(u) : { n: 0 }, rd: rdList, rdN: cnt, wish: u.wish || [], seen: u.seen || [], fol: u.fol || [], folN: u.folN || 0, alertN: Object.values(u.alerts || {}).filter(Boolean).length, ordN: (u.ords || []).length, rvN: u.rvN || 0, pts: 0, cps: [], pv: 1 } }]; }
    if (o === 'orders') { const L = (u.ords || []).slice(0, 100); if (!L.length) return [200, { ok: true, L: [] }]; const ds = await db.getAll(...L.map((x) => C('shop_orders').doc(x.no))); const out = []; ds.forEach((d, i) => { const ob = d.exists ? d.data() : null; if (ob && ob.uid === uid) out.push({ ...(view ? view(ob) : { no: ob.no, st: ob.st }), t: L[i].t || null }); }); return [200, { ok: true, L: out }]; }
    if (o === 'myRv' || o === 'mine' || o === 'feed') { const [a, c2] = await Promise.all([C('shop_reviews').where('uid', '==', uid).get(), C('shop_quotes').where('uid', '==', uid).get()]); const L = [], Q = []; a.forEach((d) => { const r = d.data(); if (r && r.hid !== 'self' && !r.gone) L.push(r); }); c2.forEach((d) => { const x = d.data(); if (x && !x.hid && !x.gone) Q.push(x); });
      if (o === 'feed') return [200, { ok: true, L: [], Q: [] }];
      if (o === 'mine') { const k = String(b.k || ''); const r = L.find((x) => x.k === k); return [200, { ok: true, rv: r ? rvPub(r, uid) : null, rd: (u.rd || {})[k] || null, al: [], lists: [], q: Q.filter((x) => x.k === k).map(qPub) }]; }
      return [200, { ok: true, L: (A.rvSort ? A.rvSort(L, 'new') : L).map((r) => rvPub(r, uid)), Q: Q.sort((p, q2) => String(q2.at).localeCompare(String(p.at))).map(qPub) }]; }
    if (o === 'alerts') { if (!A.alertState) return [200, { ok: true, L: [] }]; await ready(); return [200, { ok: true, L: A.alertState(u.alerts, await vw(), await held(), await soldX()) }]; }
    if (o === 'blMine') { const LS = await C('shop_lists').where('uid', '==', uid).get(); const L = []; LS.forEach((x) => { const v = x.data(); if (v && !v.hid && !v.gone) L.push({ lid: v.lid, nm: v.nm, ds: v.ds, pub: v.pub, items: v.items || [], up: v.up }); }); return [200, { ok: true, L: L.sort((p, q2) => String(q2.up).localeCompare(String(p.up))) }]; }
    if (o === 'folList') { const F = (u.fol || []).slice(0, 100); if (!F.length) return [200, { ok: true, L: [] }]; const ds = await db.getAll(...F.map((x) => C('shop_users').doc(x))); const out = []; ds.forEach((d) => { const v = d.exists ? d.data() : null; if (v && !v.gone && !v.arch) out.push({ uid: v.uid, nick: v.nick, bio: v.bio || '', rvN: v.rvN || 0, folN: v.folN || 0 }); }); return [200, { ok: true, L: out }]; }
    if (o === 'myLikes') return [200, { ok: true, on: [] }]; return PV_NO; }
  async function handle(req, res, path, q, send, readBody, ipKey) {
    if (path === '/shop/t' && req.method === 'POST') { let b = {}; try { b = await readBody(req); } catch (e) { b = {}; } try { await ingest(req, b); } catch (e) { M.drop++; } res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return true; }
    if (path === '/shop/ask' && req.method === 'POST') { const b = await readBody(req); const [c2, o] = await askNew(req, b, ipKey ? ipKey(req) : null); return send(c2, o); }
    if (path === '/shop/ask') { const [c2, o] = await askGet(q); return send(c2, o); }
    if (path === '/shop/pv' && req.method === 'POST') { const b = await readBody(req); if (b.tk && !b.b) { const T = await pvOf(b.tk); return send(T ? 200 : 401, T ? { ok: true, uid: T.uid || null, nick: T.nick || null, test: T.test || 0, exp: T.exp } : { ok: false, err: '미리 보기 표가 끝났습니다', pvEnd: 1 }); } const [c2, o] = await pvOp(b.tk, b.b); return send(c2, o); }
    return false; }

  /* ── 운영자 일(관리 웹앱 → /shop-anl) — 지우기 없음 */
  const ordCache = { at: 0, L: [] };
  async function ordsSince(days) { if (Date.now() - ordCache.at < 60e3 && ordCache.days >= days) return ordCache.L.filter((o) => Date.parse(o.at) >= Date.now() - days * 864e5); const since = new Date(Date.now() - days * 864e5).toISOString(); const ss = await C('shop_orders').where('at', '>=', since).get(); const L = []; ss.forEach((d) => L.push(d.data())); ordCache.at = Date.now(); ordCache.days = days; ordCache.L = L; return L; }
  const PAID = new Set(['paid', 'ship', 'sent', 'done']);
  async function statDocs(from, to) { const ids = []; for (let d = from; d <= to && ids.length < 400; d = dayAdd(d, 1)) ids.push(d); if (!ids.length) return []; const out = []; for (let i = 0; i < ids.length; i += 100) { const ds = await db.getAll(...ids.slice(i, i + 100).map((x) => C('shop_stats').doc(x))); ds.forEach((d) => { if (d.exists) out.push(d.data()); }); } return out; }
  async function admin(b, who) { b = b || {}; const o = String(b.op || ''); const by = s(who && who.email, 80) || 'admin'; const c = await conf(); const now = Date.now();
    if (o === 'cfg') return { cfg: c, schema: ANL_SCHEMA, dashAll: DASH_ALL, inst: INST, mem: { n: M.n, drop: M.drop, err: M.err, flushAt: M.flushAt ? new Date(M.flushAt).toISOString() : null } };
    if (o === 'dash') { const today = kday(now); const to = /^\d{4}-\d\d-\d\d$/.test(String(b.to || '')) && b.to <= today ? b.to : today; const span = Math.max(1, Math.min(c.aggDays, Math.round(+b.days || 7))); const from = /^\d{4}-\d\d-\d\d$/.test(String(b.from || '')) && b.from <= to ? b.from : dayAdd(to, -(span - 1));
      const n = Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1; const pTo = dayAdd(from, -1), pFrom = dayAdd(pTo, -(n - 1));
      const [cur, prev, td] = await Promise.all([statDocs(from, to), b.cmp === 0 ? [] : statDocs(pFrom, pTo), C('shop_stats').doc(today).get()]);
      const T = td.exists ? td.data() : {}; const live = Object.values(T.live || {}).filter((x) => x && now - Date.parse(x.at) < 180e3).reduce((a, x) => a + (+x.n || 0), 0) + (kday() === today ? [...M.live.values()].filter((x) => now - x < 300e3).length : 0);
      const ords = await ordsSince(Math.min(400, n * 2 + 2)); const inR = (o2, f, t) => { const d = kday(Date.parse(o2.at)); return d >= f && d <= t; }; const ordC = ords.filter((x) => inR(x, from, to) && x.st !== 'cancel' && !x.test), ordP = ords.filter((x) => inR(x, pFrom, pTo) && x.st !== 'cancel' && !x.test);
      const Mc = mergeDays(cur), Mp = mergeDays(prev); const sum = (L) => L.reduce((a, x) => a + (+x.total || 0), 0);
      const geoO = {}; for (const x of ordC) { const k = sido(x.rcv && x.rcv.addr1); geoO[k] = (geoO[k] || 0) + 1; }
      const itT = {}; try { await ready(); const V = await vw(); for (const [id] of topOf(Object.assign({}, Mc.it || {}, Mc.ic || {}), 80)) { const it = V.get(id); if (it) itT[id] = [it.t, it.p, it.g || null]; } } catch (e) {} /* 많이 본 상품 제목·값(판매가 끝난 책은 번호만) */
      return { from, to, pFrom, pTo, n, live, itT, today: { pv: +T.pv || 0, uv: +T.uv || 0, ss: +T.ss || 0, mn: T.mn || {} }, cur: Mc, prev: { pv: Mp.pv, uv: Mp.uv, ss: Mp.ss, od: Mp.od, cadd: Mp.cadd, fun: Mp.fun || {} }, fun: funnel(Mc), funP: funnel(Mp),
        ord: { n: ordC.length, sum: sum(ordC), paid: ordC.filter((x) => PAID.has(x.st)).length, pn: ordP.length, psum: sum(ordP), geo: geoO }, cmp: { pv: pct(Mc.pv, Mp.pv), uv: pct(Mc.uv, Mp.uv), ss: pct(Mc.ss, Mp.ss), ord: pct(ordC.length, ordP.length), sum: pct(sum(ordC), sum(ordP)) }, cfg: c }; }
    if (o === 'users' || o === 'user') { const [us, ms, ords] = await Promise.all([o === 'users' ? C('shop_users').get() : null, o === 'users' ? C('shop_umemo').get() : null, ordsSince(Math.min(3650, c.aggDays))]); const by = new Map(); for (const x of ords) if (x.uid) { const v = by.get(x.uid) || { n: 0, paid: 0, sum: 0, last: null }; v.n++; if (PAID.has(x.st)) { v.paid++; v.sum += +x.total || 0; } if (!v.last || x.at > v.last) v.last = x.at; by.set(x.uid, v); }
      const memo = new Map(); if (ms) ms.forEach((d) => memo.set(d.id, d.data()));
      const row = (u, mm) => { const ov = by.get(u.uid) || { n: (u.ords || []).length, paid: 0, sum: 0, last: null }; return { uid: u.uid, nick: u.nick, em: c.emShow ? u.em : maskEm(u.em), at: u.at, last: u.last || null, test: u.test ? 1 : 0, qa: A.qaAcct ? (A.qaAcct(u) ? 1 : 0) : u.test ? 1 : 0, arch: u.arch ? 1 : 0, gone: u.gone ? 1 : 0, ordN: ov.n, paid: ov.paid, sum: ov.sum, lastOrd: ov.last, rvN: u.rvN || 0, wishN: (u.wish || []).length, alertN: Object.values(u.alerts || {}).filter(Boolean).length, rdN: Object.keys(u.rd || {}).length, folN: u.folN || 0, news: u.notif && u.notif.news ? 1 : 0, tier: tierOf(ov.paid, c), tags: (mm && mm.tags) || [], memo: mm && mm.memo ? 1 : 0 }; };
      if (o === 'users') { const L = []; us.forEach((d) => { const u = d.data(); if (u && u.uid) L.push(row(u, memo.get(u.uid))); }); return { L: L.sort((p, q2) => String(q2.last || q2.at).localeCompare(String(p.last || p.at))).slice(0, 3000), tiers: tiersOf(c.tiers) }; }
      const uid = String(b.uid || ''); if (!/^u_[0-9a-f]{16}$/.test(uid)) return { err: '손님 번호가 이상함' }; const [ud, md] = await Promise.all([C('shop_users').doc(uid).get(), C('shop_umemo').doc(uid).get()]); const u = ud.exists ? ud.data() : null; if (!u) return { err: '없는 손님' };
      const [ua, rv, qs, ls, ak] = await Promise.all([C('shop_uact').where('uid', '==', uid).get(), C('shop_reviews').where('uid', '==', uid).get(), C('shop_quotes').where('uid', '==', uid).get(), C('shop_lists').where('uid', '==', uid).get(), C('shop_asks').where('uid', '==', uid).get()]);
      const ev = []; ua.forEach((d) => { const v = d.data(); if (v) for (const e of v.ev || []) ev.push({ t: e.t, k: e.k, a: e.a, x: e.x || null, w: EV_T[e.k] || e.k }); });
      rv.forEach((d) => { const r = d.data(); if (r) ev.push({ t: r.at, k: 'rv', a: r.k, x: r.t || null, w: '⭐ 리뷰 ' + (r.st / 2).toFixed(1) + (r.hid ? ' (가려짐)' : ''), tx: s(r.s100, 100) }); }); qs.forEach((d) => { const x = d.data(); if (x) ev.push({ t: x.at, k: 'q', a: x.k, x: x.t || null, w: '✏ 밑줄', tx: s(x.tx, 100) }); });
      ak.forEach((d) => { const x = d.data(); if (x) ev.push({ t: x.at, k: 'ask', a: x.aid, w: '💬 문의', tx: s(x.tx, 100) }); }); for (const x of ords.filter((y) => y.uid === uid)) ev.push({ t: x.at, k: 'ord', a: x.no, w: '🧾 주문 ' + x.no + ' · ' + (x.st || ''), tx: (x.items || []).map((y) => y.t).filter(Boolean).slice(0, 3).join(' · '), sum: x.total });
      ev.push({ t: u.at, k: 'join', w: u.test ? '🧪 시험 계정 만듦' : '👤 가입' }); ev.sort((p, q2) => String(q2.t).localeCompare(String(p.t)));
      const L = []; ls.forEach((d) => { const v = d.data(); if (v && !v.gone) L.push({ nm: v.nm, n: (v.items || []).length, pub: v.pub ? 1 : 0 }); });
      return { u: { ...row(u, md.exists ? md.data() : null), bio: u.bio || '', notif: u.notif || {}, goal: A.goalOf ? A.goalOf(u) : null, wish: (u.wish || []).slice(0, 60), seen: (u.seen || []).slice(0, 30), alerts: Object.entries(u.alerts || {}).filter(([, a]) => a).slice(0, 60).map(([k, a]) => ({ k, kind: a.k, t: a.t || null, id: a.id || null, isbn: a.isbn || null, at: a.at || null })), lists: L }, memo: md.exists ? md.data() : null, ev: ev.slice(0, 3000), ips: [...new Set((() => { const L = []; ua.forEach((d) => { const v = d.data(); for (const x of (v && v.ip) || []) L.push(x); }); return L; })())].slice(0, 50), devs: [...new Set((() => { const L = []; ua.forEach((d) => { const v = d.data(); if (v && v.dev) L.push(v.dev); }); return L; })())].slice(0, 20) }; }
    if (o === 'visitors') { const days = Math.max(1, Math.min(3650, Math.round(+b.days || 7))); const cut = kday(now - (days - 1) * 864e5); const ss = await C('shop_uact').where('day', '>=', cut).get(); const by = new Map();
      ss.forEach((d) => { const v = d.data(); if (!v || v.uid) return; const k = v.vid || d.id; const x = by.get(k) || { vid: k, days: 0, n: 0, first: v.day, last: v.day, ip: new Set(), dev: v.dev || null, ref: v.ref || null, test: 0 }; x.days++; x.n += +v.n || 0; if (v.day < x.first) x.first = v.day; if (v.day > x.last) { x.last = v.day; x.dev = v.dev || x.dev; } if (v.ref && !x.ref) x.ref = v.ref; for (const i of v.ip || []) x.ip.add(i); by.set(k, x); });
      return { days, L: [...by.values()].map((x) => ({ ...x, ip: [...x.ip].slice(0, 10) })).sort((p, q2) => String(q2.last).localeCompare(String(p.last)) || q2.n - p.n).slice(0, 2000) }; } /* 🕶 비회원 방문(기기 번호) */
    if (o === 'visitor') { const vid = String(b.vid || ''); if (!/^[0-9a-f]{16}$/.test(vid)) return { err: '기기 번호가 이상함' }; const ss = await C('shop_uact').where('vid', '==', vid).get(); const ev = []; const ips = new Set(); const devs = new Set(); let ref = null;
      ss.forEach((d) => { const v = d.data(); if (!v) return; for (const i of v.ip || []) ips.add(i); if (v.dev) devs.add(v.dev); if (v.ref && !ref) ref = v.ref; for (const e of v.ev || []) ev.push({ t: e.t, k: e.k, a: e.a, x: e.x || null, w: EV_T[e.k] || e.k, who: v.uid || null }); });
      ev.sort((p, q2) => String(q2.t).localeCompare(String(p.t))); return { vid, ev: ev.slice(0, 3000), ips: [...ips].slice(0, 50), devs: [...devs].slice(0, 20), ref }; }
    if (o === 'memo') { const uid = String(b.uid || ''); if (!/^u_[0-9a-f]{16}$/.test(uid)) return { err: '손님 번호가 이상함' }; const memo = sLong(b.memo, 2000); const tags = [...new Set((Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',')).map((x) => s(x, 16)).filter(Boolean))].slice(0, 12); const at = new Date().toISOString();
      await C('shop_umemo').doc(uid).set({ uid, memo, tags, by, at, hist: FV.arrayUnion({ at, by, memo: memo.slice(0, 300), tags }) }, { merge: true }); return { ok: 1, memo, tags }; } /* 고친 옛 메모는 hist에 쌓임(지우지 않음) */
    if (o === 'items') { const days = Math.max(1, Math.min(c.aggDays, Math.round(+b.days || 30))); const to = kday(now); const from = dayAdd(to, -(days - 1)); await ready(); const [docs, ords, us] = await Promise.all([statDocs(from, to), ordsSince(days), C('shop_users').get()]); const Mx = mergeDays(docs);
      const V = await vw(); const X = await soldX(); const I = new Map(); for (const [id, it] of V) if (!X.has(id)) I.set(id, it);
      const D = new Map(); const add = (isbn, t, f) => { if (!/^97[89]\d{10}$/.test(String(isbn || ''))) return; const v = D.get(isbn) || { t, wish: 0, alert: 0 }; v[f]++; if (!v.t && t) v.t = t; D.set(isbn, v); };
      const wishBy = {}; us.forEach((d) => { const u = d.data(); if (!u || u.gone || (c.exTest && u.test)) return; for (const w of u.wish || []) { if (w && w.id) wishBy[w.id] = (wishBy[w.id] || 0) + 1; const it = w && V.get(w.id); add((it && it.isbn) || w.isbn, w.t, 'wish'); } for (const a of Object.values(u.alerts || {})) if (a && a.k === 'restock') add(a.isbn, a.t, 'alert'); });
      const R = itemRows(Mx, I, ords.filter((x) => x.st !== 'cancel' && !x.test), c, now, D); const top = (L) => L.slice(0, c.topN * 5);
      return { from, to, days, rows: top(R.rows).map((r) => ({ ...r, wn: wishBy[r.id] || 0 })), hot: top(R.hot), stale: R.stale.slice(0, c.topN * 5), staleN: R.staleN, low: top(R.low), onSale: I.size, cfg: c }; }
    if (o === 'asks') { const ss = await C('shop_asks').orderBy('at', 'desc').limit(Math.max(10, Math.min(500, +b.n || 200))).get(); const L = []; ss.forEach((d) => { const v = d.data(); if (v) L.push({ aid: v.aid, at: v.at, st: v.st, kind: v.kind, tx: v.tx, nm: v.nm, ct: v.ct, t: v.t, id: v.id, no: v.no, uid: v.uid, nick: v.nick, test: v.test || 0, ip: v.ip || null, ans: v.ans || [], up: v.up }); }); return { L }; }
    if (o === 'askAns') { const aid = String(b.aid || ''); if (!/^q\d{6}[0-9a-f]{8}$/.test(aid)) return { err: '문의 번호가 이상함' }; const ref = C('shop_asks').doc(aid); const d = await ref.get(); if (!d.exists) return { err: '없는 문의' }; const tx = sLong(b.tx, 2000); const st = ['new', 'ans', 'done'].includes(b.st) ? b.st : tx ? 'ans' : null; const at = new Date().toISOString();
      if ([...tx].length > 1000) return { err: '답은 1,000자까지' }; await ref.set({ ...(tx ? { ans: FV.arrayUnion({ tx, at, by }) } : {}), ...(st ? { st } : {}), up: at, hist: FV.arrayUnion({ at, by, what: tx ? '답 ' + tx.slice(0, 40) : '상태 ' + st }) }, { merge: true }); return { ok: 1 }; }
    if (o === 'pvTicket') { const uid = b.uid ? String(b.uid) : null; let nick = null, test = 0; if (uid) { if (!/^u_[0-9a-f]{16}$/.test(uid)) return { err: '손님 번호가 이상함' }; const d = await C('shop_users').doc(uid).get(); const u = d.exists ? d.data() : null; if (!u || u.gone) return { err: '없는 손님' }; nick = u.nick; test = u.test ? 1 : 0; }
      const tk = rnd(20); const exp = new Date(now + 30 * 60e3).toISOString(); await C('shop_pv').doc(H(tk)).set({ uid, nick, test, by, at: new Date(now).toISOString(), exp }); return { tk, exp, uid, nick }; } /* 표(원문)는 돌려주기만 · 문서엔 해시 · 30분 뒤 저절로 못 씀(지우지 않음 — 누가 언제 봤는지 기록) */
    return { err: '없는 일' }; }
  return { handle, admin, flush, ingest, conf, _m: M, INST };
}
module.exports = { ANL_DEF, ANL_SCHEMA, DASH_ALL, cfgOf, tiersOf, bnrClean, bnrPub, refKind, uaInfo, swB, sido, geoOf, cleanBatch, accNew, addBatch, toWrite, mergeDays, funnel, pct, topOf, itemRows, tierOf, maskEm, csv, kday, dayAdd, EV_T, makeAnl };
