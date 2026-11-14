/* 🎨 북스퀸 숍 꾸밈 설정 틀(BQL · 11/13 shopux1 · 정범님 11/13 20:12 「디자인·UI·기능·로고 대폭 개편 · 설정에서 바꿀 수 있게」)
 *  이 파일 하나가 '꾸밈 설정 틀(SCHEMA) + 색 셈'을 가짐 — 손님 화면(shop.js)·관리 웹앱(⚙ 🎨 우리숍 꾸밈)·리드나우2 템플릿이 같은 틀을 읽음(약속 53 · shelf-core.js SCHEMA와 같은 꼴)
 *   · SCHEMA 한 줄 = { k, label, type: number|select|check|text|multi, def, min, max, opts, group, help }
 *   · 저장 자리: Firestore app_settings/shop.look(기본값과 다른 칸만) · 로고는 app_settings/shop.brandLogo(shop/brand/brand-core.js BQB)
 *   · 순수 셈 · 브라우저(window.BQL)·node 시험 함께 · 바깥 라이브러리 없음 */
(function (root) {
  'use strict';
  /* 색 묶음 — [이름, 바탕색(brand), 곁색(accent)] · 곁색은 단추·할인 아닌 강조(금색 계열) · 할인·품절 빨강은 따로(바꾸지 않음 — 손님이 늘 같은 뜻으로 읽게) */
  const THEMES = { classic: ['남색·금색(북스퀸 기본)', '#1d2b45', '#c9a24a'], forest: ['짙은 초록·놋쇠', '#1f3d2f', '#c7a457'], wine: ['포도주·금색', '#4a1d2b', '#d4af6a'], ink: ['먹색·주황', '#1c1c1e', '#e0782d'],
    ocean: ['깊은 바다·살구', '#0f3b4f', '#f0b65a'], plum: ['자주·금색', '#3b2245', '#d9b26a'], brick: ['벽돌·크림', '#7a2e1f', '#e8c48a'], slate: ['잿빛 남색·하늘', '#2b3442', '#7fb3d5'] };
  const ROWS = { kinds: '종류(국내도서·외국도서·잡지·음반…)', new: '새로 들어온 책', rare: '희귀본', pick: '가게 추천', sale: '할인 중인 책', cheap: '5천 원 아래 책', cats: '분야 바로 가기', seen: '최근 본 책', reviews: '새로 올라온 리뷰', trust: '믿고 사는 까닭(실물 사진·등급·한 권뿐)' };
  /* ══ (shopfont1 · 정범님 11/14 14:36 「손님이 직접 쓰거나 우리가 쓰는 글·홍보글·소개글, 출판사 소개글, 사람이 말하는 입장인 글(리뷰·평가글)은 고운돋움 기본 · 모든 글꼴을 분류해 설정에서 바꾸게」)
   *  🔤 글꼴 쓰임(역할) 다섯 — ① 사람 목소리 글 ② 본문·설명 ③ 제목·상호 ④ 숫자·값 ⑤ 단추·메뉴 (서가 책등 글꼴은 📚 서가 책장 설정 몫 · 그대로)
   *   · 판: v1(11/14 새 판 — ①만 고운돋움) · v0(옛 판 — 모두 기기 기본 · 11/14 전 모양 그대로 · 약속 79)
   *   · 받기: 기기 기본이 아닌 글꼴만, 그 역할의 글이 화면에 있을 때만(shop.js fontNeed) · Google Fonts css2 · display=swap(못 받아도 기기 글꼴로 바로 보임) · 필요한 굵기만
   *   · 글꼴은 모두 무료(SIL OFL 1.1 — 고운돋움·IBM Plex Sans KR·Noto Sans/Serif KR·나눔명조·나눔손글씨 펜·개구·고운바탕 · Pretendard도 OFL) */
  const PRET = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css';
  /* id → [고르기 글, CSS 글꼴 이름, 있는 굵기, 갈래(sans·serif·hand), (따로 받는 주소)] */
  const FONTS = { sys: ['기기 기본 글꼴(받지 않음 · 가장 가벼움)', '', [], 'sans'], gowun: ['고운돋움 Gowun Dodum', 'Gowun Dodum', [400], 'sans'], plex: ['IBM Plex Sans KR', 'IBM Plex Sans KR', [400, 500, 600, 700], 'sans'],
    noto: ['본고딕 Noto Sans KR', 'Noto Sans KR', [400, 500, 700], 'sans'], pretendard: ['프리텐다드 Pretendard', 'Pretendard', [400, 600, 700], 'sans', PRET], notoserif: ['본명조 Noto Serif KR', 'Noto Serif KR', [400, 700], 'serif'],
    nanummj: ['나눔명조 Nanum Myeongjo', 'Nanum Myeongjo', [400, 700], 'serif'], gowunbt: ['고운바탕 Gowun Batang', 'Gowun Batang', [400, 700], 'serif'], nanumpen: ['나눔손글씨 펜 Nanum Pen Script', 'Nanum Pen Script', [400], 'hand'], gaegu: ['개구 Gaegu', 'Gaegu', [400, 700], 'hand'] };
  /* 역할 — [열쇠, 이름, 무엇에 쓰임, 쓰는 굵기] */
  const ROLES = [['voice', '① 사람 목소리 글', '손님 리뷰·한 줄 평·밑줄 친 문장·가게 답글 · 우리 소개·홍보 글(첫 화면 큰 띠·배너) · 책소개·책 속으로·출판사 서평·저자/옮긴이/출판사 소개·추천평 · 손님 자기소개·북리스트 설명', [400, 700]],
    ['body', '② 본문·설명', '화면 전체 바탕 글 · 안내·풀이·표 · 목차', [400, 700]], ['head', '③ 제목·상호', '화면·칸 제목 · 책 제목 · 글자 로고(북스퀸)', [700]],
    ['num', '④ 숫자·값', '값·할인·합계·입금액(자릿수 맞춤은 그대로)', [400, 700]], ['ui', '⑤ 단추·메뉴', '단추·고르기 칸·둘러보기 줄·위 메뉴·아래 탭', [400, 600]]];
  const SETS = { v1: { voice: 'gowun', body: 'sys', head: 'sys', num: 'sys', ui: 'sys' }, v0: { voice: 'sys', body: 'sys', head: 'sys', num: 'sys', ui: 'sys' } };
  /* 역할마다 손님 화면 자리(선택자) — 하나뿐인 원본(손님 화면이 쓰는 CSS도 여기서 만듦) · .bqv = 화면 코드가 직접 붙이는 사람 목소리 표 */
  const ROLE_Q = { voice: '.bqv, .hero h1, .hero > div > p, .bkinfo .bki:not(.toc) .bkt, .bqa-rv .s100, .bqa-rv .tx, .bqa-reply p, .bqa-q > p, .bqa-nr p, .bqa-bl p, .bqa-me .who h1 + .hint, .bqt-bn',
    voiceIn: '#bqaQt, #bqaS1, #bqaBd, #nbd, #bqtTx, #p_bio', body: 'body', head: 'h1, h2, h3, .logo .lt', num: '.num, .price b, .pr b, .sum b, .bank .amt', ui: 'button, .btn, .chip, select, .nav a, .cbar a, #tabbar a' };
  const FOPTS = { auto: '판 기본값', ...Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [k, v[0]])) };
  const FK = { voice: 'fVoice', body: 'fBody', head: 'fHead', num: 'fNum', ui: 'fUi' };
  const SCHEMA = [
    { k: 'headStyle', group: '머리띠·로고', label: '머리띠 모양', type: 'select', def: 'light', opts: { light: '흰 머리띠(교보·29CM·쿠팡처럼 · 로고는 밝은 바탕용)', brand: '색 머리띠(바탕색 · 로고는 어두운 바탕용)' } },
    { k: 'logoH', group: '머리띠·로고', label: '로고 높이(px · 넓은 화면)', type: 'number', def: 32, min: 22, max: 48, help: '휴대폰은 이 값의 85%' },
    { k: 'tagline', group: '머리띠·로고', label: '글자 로고 옆 작은 글(로고 그림을 고르면 안 보임)', type: 'text', def: '헌책방', max: 12 },
    { k: 'topBar', group: '머리띠·로고', label: '머리띠 위 안내 한 줄(비우면 무료 배송 기준이 있을 때 그 안내 · 「-」면 없음)', type: 'text', def: '', max: 60 },
    { k: 'theme', group: '색', label: '색 묶음', type: 'select', def: 'classic', opts: Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, v[0]])) },
    { k: 'brandColor', group: '색', label: '바탕색 직접(#1d2b45 꼴 · 비우면 색 묶음대로)', type: 'text', def: '', max: 7 },
    { k: 'accentColor', group: '색', label: '곁색 직접(#c9a24a 꼴 · 비우면 색 묶음대로)', type: 'text', def: '', max: 7 },
    { k: 'mode', group: '색', label: '밤 화면', type: 'select', def: 'auto', opts: { auto: '손님 기기 설정 따라(밤이면 어둡게)', light: '늘 밝게', dark: '늘 어둡게' } },
    { k: 'corner', group: '색', label: '모서리', type: 'select', def: 'soft', opts: { soft: '살짝 둥글게(기본)', round: '더 둥글게', sharp: '각지게' } },
    { k: 'heroOn', group: '첫 화면', label: '첫 화면 맨 위 큰 띠(소개 글) 보이기', type: 'check', def: true },
    { k: 'heroTitle', group: '첫 화면', label: '큰 띠 제목', type: 'text', def: '한 권 한 권, 다음 주인을 기다리는 책', max: 40 },
    { k: 'heroSub', group: '첫 화면', label: '큰 띠 풀이', type: 'text', def: '직접 살펴 등급을 매긴 헌책 · 받으실 그 책의 실물 사진 그대로', max: 80 },
    { k: 'rows', group: '첫 화면', label: '첫 화면에 보일 줄(차례는 아래 차례 그대로)', type: 'multi', def: ['kinds', 'new', 'rare', 'pick', 'sale', 'cheap', 'cats', 'seen', 'reviews', 'trust'], opts: ROWS },
    { k: 'rowN', group: '첫 화면', label: '줄마다 보일 책 수', type: 'number', def: 12, min: 4, max: 24 },
    { k: 'mobCols', group: '책 목록', label: '휴대폰 한 줄 책 수', type: 'select', def: '2', opts: { 2: '두 권(사진 크게 · 기본)', 3: '세 권(더 많이)' } },
    { k: 'listMore', group: '책 목록', label: '다음 쪽 불러오기', type: 'select', def: 'auto', opts: { auto: '끝까지 내리면 저절로(쿠팡·무신사)', button: '「더 보기」 단추를 눌러서' } },
    { k: 'showAuthor', group: '책 목록', label: '책 카드에 지은이 보이기', type: 'check', def: true },
    { k: 'pcSwitch', group: '휴대폰', label: '휴대폰에서 「PC 화면으로 보기 ↔ 휴대폰 화면으로 보기」 전환 단추 보이기(바닥글·서가)', type: 'check', def: true, help: '정범님 11/13 20:49 · 손님이 고른 값은 그 기기에 기억' },
    { k: 'pcWidth', group: '휴대폰', label: 'PC 화면으로 볼 때 화면 폭(px)', type: 'number', def: 1280, min: 960, max: 1600, help: '손가락으로 확대·축소해 봄' },
    { k: 'tabbar', group: '휴대폰', label: '휴대폰 아래 탭 막대(홈·분류·서가·찜·내 정보)', type: 'check', def: true },
    { k: 'multiOn', group: '담기·주문', label: '수량이 2권 넘는 책은 손님이 여러 권 담기(재고 수량까지)', type: 'check', def: true, help: '정범님 11/13 20:47 · 끄면 예전처럼 한 권씩 · 클라우드 주문 검사도 이 값을 따름' },
    { k: 'multiMax', group: '담기·주문', label: '같은 책 한 번에 최대 권 수(0 = 재고까지 · 제한 없음)', type: 'number', def: 0, min: 0, max: 999, help: '정범님 11/13 22:53 — 기본은 재고까지' },
    { k: 'shipNote', group: '책 한 권 화면', label: '배송 안내 한 줄', type: 'text', def: '입금이 확인되면 1~3일(영업일) 안에 보냅니다', max: 80 },
    { k: 'gradeTable', group: '책 한 권 화면', label: '등급 기준표(최상·상·중·하 풀이) 보이기', type: 'check', def: true },
    { k: 'shareOn', group: '책 한 권 화면', label: '공유 단추(휴대폰 공유 창 · 안 되면 주소 복사)', type: 'check', def: true },
    { k: 'fontSet', group: '글꼴', label: '글꼴 판', type: 'select', def: 'v1', opts: { v1: '새 판 v1(11/14) — ①만 고운돋움', v0: '옛 판 v0 — 11/14 전 그대로' }, help: 'v1 = ① 사람 목소리 글은 고운돋움 · 나머지는 기기 기본 / v0 = 모든 글을 기기 기본 글꼴로 · 아래 칸이 「판 기본값」이면 이 판을 따름(정범님 11/14 14:36)' },
    ...ROLES.map(([r, nm, what]) => ({ k: FK[r], group: '글꼴', label: `${nm} — ${what}`, type: 'select', def: 'auto', opts: FOPTS })),
    { k: 'fVoiceIn', group: '글꼴', label: '손님이 쓰는 칸(리뷰 쓰기·한 줄 평·밑줄 문장·문의·자기소개·북리스트 설명)에도 ① 사람 목소리 글꼴', type: 'check', def: true },
  ];
  const DEF = Object.fromEntries(SCHEMA.map((p) => [p.k, p.def]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const HEX = /^#[0-9a-f]{6}$/i;
  /* 날것 설정 → 범위 지킨 설정(모르는 칸 버림 · 틀린 값은 기본값) — shelf-core.js cfgOf와 같은 규칙 */
  function cfgOf(raw) { const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}; const o = {};
    for (const p of SCHEMA) { const v = r[p.k];
      if (p.type === 'number') { const n = +v; o[p.k] = v != null && v !== '' && Number.isFinite(n) ? clamp(Math.round(n), p.min, p.max) : p.def; }
      else if (p.type === 'check') o[p.k] = v == null ? p.def : !!v && v !== '0' && v !== 'false';
      else if (p.type === 'select') o[p.k] = v != null && Object.prototype.hasOwnProperty.call(p.opts, String(v)) ? String(v) : p.def;
      else if (p.type === 'multi') { const L = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\s]+/) : []).map(String).filter((x) => Object.prototype.hasOwnProperty.call(p.opts, x)); o[p.k] = v == null ? p.def.slice() : [...new Set(L)]; }
      else o[p.k] = v == null ? p.def : String(v).replace(/[<>]/g, '').slice(0, p.max || 200); }
    if (o.brandColor && !HEX.test(o.brandColor)) o.brandColor = ''; if (o.accentColor && !HEX.test(o.accentColor)) o.accentColor = '';
    return o; }
  function cfgDiff(c) { const o = cfgOf(c); const d = {}; for (const p of SCHEMA) if (JSON.stringify(o[p.k]) !== JSON.stringify(p.def)) d[p.k] = o[p.k]; return d; }
  /* 색 셈 — 밝기(WCAG 상대 휘도)·대비 · 바탕 위 글자색을 흰/검정 중 대비 큰 쪽으로 */
  const rgb = (h) => { let x = String(h).replace('#', ''); if (x.length === 3) x = x.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); };
  const hex = (a) => '#' + a.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const lum = (h) => { const L = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const inkOn = (bg) => (contrast(bg, '#ffffff') >= contrast(bg, '#111418') ? '#ffffff' : '#111418');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
  /* 고른 설정 → 실제 두 색 + 거기서 나온 색(밝은 바탕에서 글자로 쓸 진한 곁색 · 엷은 바탕색) */
  function colors(c) { c = c && c.theme ? c : cfgOf(c); const T = THEMES[c.theme] || THEMES.classic; const brand = c.brandColor || T[1]; const accent = c.accentColor || T[2];
    /* 곁색을 흰 바탕 글자로 쓰면 흐릴 수 있어 대비 4.5 넘을 때까지 검정 쪽으로 섞음(접근성 AA) */ let accentText = accent; for (let i = 0; i < 12 && contrast(accentText, '#ffffff') < 4.5; i++) accentText = mix(accentText, '#000000', 0.12);
    let brandText = brand; for (let i = 0; i < 12 && contrast(brandText, '#ffffff') < 4.5; i++) brandText = mix(brandText, '#000000', 0.15);
    let brandDark = brand; for (let i = 0; i < 14 && contrast(brandDark, '#14161b') < 4.5; i++) brandDark = mix(brandDark, '#ffffff', 0.12); /* 밤 화면 글자용 */
    return { brand, accent, brandInk: inkOn(brand), accentInk: inkOn(accent), accentText, brandText, brandDark, brandSoft: mix(brand, '#ffffff', 0.92), accentSoft: mix(accent, '#ffffff', 0.82) }; }
  const RAD = { soft: [6, 10, 14], round: [10, 14, 20], sharp: [2, 4, 6] };
  /* :root에 얹을 CSS 변수 글(손님 화면이 <style id="bqLook">로 넣음) */
  function cssText(c) { c = cfgOf(c); const K = colors(c); const R = RAD[c.corner] || RAD.soft;
    return `:root{--c-brand:${K.brand};--c-brand-ink:${K.brandInk};--c-accent:${K.accent};--c-accent-ink:${K.accentInk};--c-accent-text:${K.accentText};--c-brand-text:${K.brandText};--c-brand-soft:${K.brandSoft};--c-accent-soft:${K.accentSoft};--r-sm:${R[0]}px;--r-md:${R[1]}px;--r-lg:${R[2]}px;--logo-h:${c.logoH}px;--mob-cols:${c.mobCols}}`
      + `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--c-brand-text:${K.brandDark};--c-brand-soft:${mix(K.brand, '#14161b', 0.7)};--c-accent-soft:${mix(K.accent, '#14161b', 0.78)}}}:root[data-theme="dark"]{--c-brand-text:${K.brandDark};--c-brand-soft:${mix(K.brand, '#14161b', 0.7)};--c-accent-soft:${mix(K.accent, '#14161b', 0.78)}}` + fontCss(c); }
  /* 🔤 고른 설정 → 역할마다 글꼴 id · CSS 글꼴 줄(받지 못하면 기기 글꼴) · 받을 주소(기기 기본이 아닌 것만 · 굵기는 그 글꼴이 쓰이는 역할 몫만) · CSS 규칙(기기 기본인 역할은 규칙 0 = 옛 모양 그대로) */
  function fontOf(c) { c = c && c.fontSet ? c : cfgOf(c); const S0 = SETS[c.fontSet] || SETS.v1; const o = {}; for (const [r] of ROLES) { const v = c[FK[r]]; o[r] = v && v !== 'auto' && FONTS[v] ? v : S0[r]; } return o; }
  const GEN = { sans: '', serif: '"Noto Serif KR", "Apple Myungjo", "AppleMyungjo", Batang, serif', hand: '' };
  const stackOf = (id) => { const F = FONTS[id]; if (!F || !F[1]) return 'var(--font)'; const g = (GEN[F[3]] || '').split(', ').filter((x) => x && x !== `"${F[1]}"`).join(', '); return `"${F[1]}", ${g ? g + ', ' : ''}var(--font)`; };
  function fontUrls(c) { const R = fontOf(c); const by = {}; for (const [r, , , w] of ROLES) { const id = R[r]; if (id === 'sys' || !FONTS[id]) continue; (by[id] = by[id] || { id, roles: [], w: new Set() }).roles.push(r); w.forEach((x) => by[id].w.add(x)); }
    return Object.values(by).map((x) => { const F = FONTS[x.id]; if (F[4]) return { id: x.id, roles: x.roles, url: F[4] }; const W = [...new Set([...x.w].map((v) => F[2].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) || (Math.abs(b - v) === Math.abs(a - v) && b > a) ? b : a))))].sort((a, b) => a - b); /* 없는 굵기는 가장 가까운 굵기로(같으면 굵은 쪽) */
      return { id: x.id, roles: x.roles, url: 'https://fonts.googleapis.com/css2?family=' + F[1].replace(/ /g, '+') + (W.length === 1 && W[0] === 400 ? '' : ':wght@' + W.join(';')) + '&display=swap' }; }); }
  const pre = (q) => q.split(',').map((x) => 'html ' + x.trim()).join(',');
  function fontCss(c) { c = cfgOf(c); const R = fontOf(c); let v = ''; let css = ''; for (const [r] of ROLES) v += `--f-${r}:${stackOf(R[r])};`;
    for (const r of ['body', 'ui', 'head', 'num', 'voice']) if (R[r] !== 'sys') css += `${pre(ROLE_Q[r])}{font-family:var(--f-${r})}`;
    if (R.voice !== 'sys' && c.fVoiceIn) css += `${pre(ROLE_Q.voiceIn)}{font-family:var(--f-voice)}`;
    return `:root{${v}}${css}`; }
  /* 머리띠 위 안내 한 줄 — 설정 글 · 비면 무료 배송 기준(가게 설정)으로 · '-'면 없음 */
  function topBarText(c, shop) { c = cfgOf(c); const t = String(c.topBar || '').trim(); if (t === '-') return ''; if (t) return t; const fo = shop && +shop.freeOver; return fo > 0 ? fo.toLocaleString('ko-KR') + '원 넘게 담으면 무료 배송' : ''; }
  /* 관리 화면 미리 보기 주소 꼬리(저장 없이 손님 화면에서 보기) — #/?look=<base64url JSON> */
  const previewArg = (c) => { const s = JSON.stringify(cfgDiff(c)); try { return (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } };
  const previewCfg = (a) => { try { const b = String(a || '').replace(/-/g, '+').replace(/_/g, '/'); const s = typeof atob === 'function' ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, 'base64').toString('utf8'); const o = JSON.parse(s); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  const API = { VER: '0.1.3', THEMES, ROWS, SCHEMA, FONTS, ROLES, SETS, ROLE_Q, FK, fontOf, fontUrls, fontCss, stackOf, DEF, cfgOf, cfgDiff, colors, cssText, topBarText, previewArg, previewCfg, lum, contrast, inkOn, mix };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.BQL = API;
})(typeof window !== 'undefined' ? window : this);
