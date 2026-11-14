/* 🗂 우리숍(북스퀸) 주제분류 — 알라딘 분류 → 우리 분류 바꿈표 · 세트 · 상품 단위 (11/14 shopmisc1 · 정범님 11/14 18:13)
 *  정범님: 「우리숍에만 주제분류를 다르게 구성 및 다른 이름으로 — 알라딘화에서 벗어나 우리화 · 다른 플랫폼에서도 쓰는 것은 그대로」
 *         「우리숍 및 웹앱의 주제분류에 세트 추가」 · 「책은 '권' · 다른 상품은 '개' 혹은 고유 단위」
 *  ▸ 자료는 그대로: 상품·도서 정보(prd_books의 알라딘 분류 경로)는 건드리지 않음 — 손님 화면에 내보낼 때(cp·c·c2)만 이 표로 바꿈
 *    할인 규칙(shop-promo)은 예전처럼 알라딘 경로(CAT.pv.cp)와 우리 이름(c)을 함께 봄 → 예전 규칙 그대로 맞음
 *  ▸ 옛 주소(#/list?cp=국내도서>소설/시/희곡…)는 legacyCp가 우리 경로로 바꿔 읽음(검색·공유된 주소가 빈 목록이 되지 않게)
 *  ▸ 까닭·후보·출처: readnow-chats reports/SHOPCAT_1114.md (비공개)
 *  같은 세트 판단이 readnow-products-core.js setInfo(강한 신호) · 같은 단위 표가 readnow-products-core.js UNIT·shop/shop-core.js — 시험 tSHOPCAT1114·tUNIT1114 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQCAT = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* 국내도서 둘째 칸(알라딘 1단계) → [우리 이름, (선택) 아래 칸 앞에 붙일 이름]
   *  고른 기준(SHOPCAT_1114.md 표): 예스24·교보문고·한국십진분류(KDC) 가운데 둘 넘게 같은 말을 쓰면 그 말 · 알라딘만 쓰는 말·묶음은 바꿈 · 이어 쓰는 표는 '/' 대신 '·' */
  const DOM = [
    [/^소설\/시\/희곡$/, '소설·시·희곡'],
    [/^장르소설$/, '소설·시·희곡', '장르소설'], /* 알라딘만 따로 1단계 — 예스24·교보는 소설 아래 */
    [/^고전$/, '인문', '고전'], /* 동·서양 고전 — 교보·예스24는 인문·문학 아래 */
    [/^에세이$/, '에세이'],
    [/^인문학$/, '인문'], /* 예스24 '인문' · 교보 '인문' */
    [/^사회과학$/, '사회·정치'], /* 예스24 '사회 정치' · 교보 '정치/사회' — KDC 사회과학은 경제·교육까지 넓어 알라딘 쓰임과 다름 */
    [/^역사$/, '역사'],
    [/^경제경영$/, '경제·경영'],
    [/^자기계발$/, '자기계발'],
    [/^과학$/, '과학'],
    [/^예술\/대중문화$/, '예술·대중문화'], /* 교보 '예술/대중문화' 그대로 */
    [/^종교\/역학$/, '종교'], /* 예스24·교보·KDC '종교' — 역학(사주)은 아래 칸으로 그대로 남음 */
    [/^가톨릭$/, '종교', '가톨릭'],
    [/^유아$/, '유아'],
    [/^어린이$/, '어린이'],
    [/^청소년$/, '청소년'],
    [/^좋은부모$/, '가정·육아'], /* 알라딘만 쓰는 말 — 교보 '가정/육아' */
    [/^요리\/살림$/, '요리·살림'],
    [/^건강\/취미$/, '건강·취미'],
    [/^여행$/, '여행'],
    [/^만화$/, '만화'],
    [/^컴퓨터\/모바일$/, '컴퓨터·IT'], /* 교보 '컴퓨터/IT' · 예스24 'IT 모바일' */
    [/^외국어$/, '외국어'],
    [/^수험서\/자격증$/, '수험서·자격증'],
    [/^공무원\s*수험서$/, '수험서·자격증', '공무원'],
    [/^대학교재\/전문서적$/, '대학교재·전문서'],
    [/^초등학교참고서$/, '초등참고서'], /* 예스24·교보 '초등참고서' */
    [/^중학교참고서$/, '중고등참고서', '중학교'], /* 교보 '중/고등참고서' */
    [/^고등학교참고서$/, '중고등참고서', '고등학교'],
    [/^달력\/기타$/, '달력·기타'],
    [/^한국소개도서$/, '한국 소개 도서'],
  ];
  /* 우리 1단계 차례(분류 화면·첫 화면 분야 칩은 권 수 차례지만, 같은 수일 때 이 차례) */
  const OURS = ['소설·시·희곡', '에세이', '인문', '역사', '사회·정치', '경제·경영', '자기계발', '과학', '예술·대중문화', '종교', '유아', '어린이', '청소년', '가정·육아', '요리·살림', '건강·취미', '여행', '만화', '컴퓨터·IT', '외국어', '수험서·자격증', '대학교재·전문서', '초등참고서', '중고등참고서', '달력·기타', '한국 소개 도서'];
  const SET_K = '세트'; const SET_ALL = /^전집\/중고전집$|^전집$/; /* 알라딘 '전집/중고전집'은 우리숍에선 세트 */
  /* 국내도서 나머지 칸(알라딘 1단계부터) → 우리 칸 · 모르는 1단계는 그대로(새 분류가 생겨도 빠지지 않게) */
  function mapDomestic(rest) { const R = (rest || []).slice(); if (!R.length) return R; const top = String(R[0] || '').trim();
    for (const [re, nm, sub] of DOM) if (re.test(top)) { const tail = R.slice(1); return sub ? [nm, sub, ...tail.filter((x, i) => !(i === 0 && x === sub))] : [nm, ...tail]; }
    return R; }
  /* ── 세트 — readnow-products-core.js setInfo의 '강한 신호'와 같음(약한 신호 '세트' 낱말만·전집 낱말만은 세트로 보지 않음) + 영문 세트 꼴(shelf-core setOf와 같은 꼴) */
  function setStrong(title) { const t0 = String(title || '').replace(/^\[중고[^\]]*\]\s*/, ''); const t = t0.split(/\s\/\s?|\/\s/)[0]; const L = t.length;
    if (/[\[\(（【]\s*(세트|SET|Set|set|박스\s*세트|전집)\s*[\]\)）】]/.test(t0)) return '[세트] 표시';
    if (/전\s*\d{1,3}\s*(권|책|巻|부)/.test(t0)) return '전 n권';
    if (/총\s*\d{1,3}\s*(권|책)/.test(t0)) return '총 n권';
    if (/\d{1,3}\s*권\s*(세트|일괄|묶음|합본)/.test(t0)) return 'n권 세트';
    if (/(상\s*[·.,/+~\-]\s*하|상하)\s*권|\(\s*상\s*[,·/]\s*하\s*\)|상\s*·\s*중\s*·\s*하/.test(t0)) return '상·하권';
    if (/\(\s*\d{1,3}\s*\+\s*\d{1,3}\s*(권)?\s*\)/.test(t0)) return '(1+2)';
    { const re = /(^|[\s(\[,])(\d{1,3})\s*[~∼〜\-–]\s*(\d{1,3})\s*(권|편|부|집|화|호)?(?=\s*[)\]]|\s|$|\+|,)/g; let m; while ((m = re.exec(t))) { const a = +m[2], b = +m[3]; const rest = t.slice(m.index + m[0].length); if (a < b && b - a <= 300 && m.index + m[1].length >= L * 0.2 && !/^\s*(학년|세(?!트)|살|쪽|p\b|페이지|년|월|일|시|분|명|인|개월)/.test(rest)) return `${a}~${b}`; } }
    if (/(^|[\s(\[])([IⅠ]{1,3}|Ⅰ)\s*[~∼\-–]\s*([IVXⅠ-Ⅻ]{1,4})(?=\s*[)\]]|\s|$|\+)/.test(t)) return 'Ⅰ~Ⅴ';
    if (/\b(?:box(?:ed)?\s*set|\d{1,2}\s*-?\s*books?\s*(?:box(?:ed)?\s*)?set|gift\s*set)\b/i.test(t0) || /\bvolumes?\s*\d{1,3}\s*(?:to|-|–)\s*\d{1,3}\b/i.test(t0)) return '영문 세트';
    return null; }
  /* 관리자 바로잡기(서가 설정 setFix 「상품번호 권수」 · 권수 0 = 세트 아님 · 2 넘음 = 세트) — 제목 판단보다 먼저 */
  const FIXC = { k: null, m: {} };
  function fixOf(txt) { const s = String(txt || ''); if (FIXC.k === s) return FIXC.m; const m = {}; for (const ln of s.split(/\n+/)) { const p = ln.trim().split(/[\s,]+/); if (p.length >= 2 && /^[\w-]{1,60}$/.test(p[0]) && /^\d{1,3}$/.test(p[1])) m[p[0]] = +p[1]; } FIXC.k = s; FIXC.m = m; return m; }
  /* 책 종류(국내도서·외국도서·잡지)만 세트가 됨 — 음반·영상 박스는 그 종류 그대로 */
  function isSet(k, rest, title, id, fix) { if (k !== '국내도서' && k !== '외국도서') return false; const f = id != null && fix ? fixOf(fix)[String(id)] : undefined;
    if (f != null) return f >= 2; if (k === '국내도서' && SET_ALL.test(String((rest || [])[0] || ''))) return true; return !!setStrong(title); }
  /* 종류·나머지(cloud/shop.js kindPath 결과) → 우리숍 경로 { k, rest } */
  function ourPath(P, title, id, fix) { let k = P.k, rest = (P.rest || []).slice();
    if (isSet(k, rest, title, id, fix)) { const sub = k === '외국도서' ? ['외국도서'] : SET_ALL.test(String(rest[0] || '')) ? (rest[1] ? [rest[1]] : ['전집']) : mapDomestic(rest).slice(0, 1); return { k: SET_K, rest: sub.filter(Boolean).slice(0, 2) }; }
    if (k === '국내도서') rest = mapDomestic(rest); return { k, rest: rest.slice(0, 6) }; }
  /* 옛 주소의 알라딘 경로 → 우리 경로(국내도서 둘째 칸만 바꿈 · 이미 우리 경로면 그대로) */
  function legacyCp(cp) { const seg = String(cp || '').split('>'); if (seg[0] !== '국내도서' || seg.length < 2) return String(cp || ''); if (SET_ALL.test(seg[1])) return [SET_K, ...seg.slice(2)].join('>') || SET_K; const m = mapDomestic(seg.slice(1)); return ['국내도서', ...m].join('>'); }
  /* 📏 상품 단위 — readnow-products-core.js UNIT과 같은 말 · 종류(cp 첫 칸)로 */
  const UNIT = { book: '권', set: '세트', disc: '장', item: '개' };
  function unitKind(k, title) { k = String(k || '').split('>')[0]; const t = String(title || '');
    if (k === SET_K) return 'set'; if (k === '국내도서' || k === '외국도서' || k === '잡지') return 'book';
    if (k === '음반' || k === 'LP' || k === 'DVD' || k === '블루레이') return /^\s*(?:\[[^\]]*\]\s*)*\[(?:VHS|비디오|카세트|cassette|테이프)|\bVHS\b|비디오\s*테이프|카세트\s*테이프|\bcassette\b/i.test(t) ? 'item' : 'disc';
    return k ? 'item' : 'book'; }
  const unitOf = (k, title) => UNIT[unitKind(k, title)];
  /* 바꿈표 통째(보고서·시험·관리 화면 안내용) */
  const TABLE = () => DOM.map(([re, nm, sub]) => ({ al: String(re.source).replace(/^\^|\$$/g, '').replace(/\\\//g, '/').replace(/\\s\*/g, ' '), ours: sub ? nm + ' › ' + sub : nm }));
  return { DOM, OURS, SET_K, mapDomestic, setStrong, fixOf, isSet, ourPath, legacyCp, UNIT, unitKind, unitOf, TABLE };
});
