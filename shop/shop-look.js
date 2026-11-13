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
    { k: 'multiMax', group: '담기·주문', label: '같은 책 한 번에 최대 권 수', type: 'number', def: 10, min: 1, max: 50 },
    { k: 'shipNote', group: '책 한 권 화면', label: '배송 안내 한 줄', type: 'text', def: '입금이 확인되면 1~3일(영업일) 안에 보냅니다', max: 80 },
    { k: 'gradeTable', group: '책 한 권 화면', label: '등급 기준표(최상·상·중·하 풀이) 보이기', type: 'check', def: true },
    { k: 'shareOn', group: '책 한 권 화면', label: '공유 단추(휴대폰 공유 창 · 안 되면 주소 복사)', type: 'check', def: true },
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
      + `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--c-brand-text:${K.brandDark};--c-brand-soft:${mix(K.brand, '#14161b', 0.7)};--c-accent-soft:${mix(K.accent, '#14161b', 0.78)}}}:root[data-theme="dark"]{--c-brand-text:${K.brandDark};--c-brand-soft:${mix(K.brand, '#14161b', 0.7)};--c-accent-soft:${mix(K.accent, '#14161b', 0.78)}}`; }
  /* 머리띠 위 안내 한 줄 — 설정 글 · 비면 무료 배송 기준(가게 설정)으로 · '-'면 없음 */
  function topBarText(c, shop) { c = cfgOf(c); const t = String(c.topBar || '').trim(); if (t === '-') return ''; if (t) return t; const fo = shop && +shop.freeOver; return fo > 0 ? fo.toLocaleString('ko-KR') + '원 넘게 담으면 무료 배송' : ''; }
  /* 관리 화면 미리 보기 주소 꼬리(저장 없이 손님 화면에서 보기) — #/?look=<base64url JSON> */
  const previewArg = (c) => { const s = JSON.stringify(cfgDiff(c)); try { return (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } };
  const previewCfg = (a) => { try { const b = String(a || '').replace(/-/g, '+').replace(/_/g, '/'); const s = typeof atob === 'function' ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, 'base64').toString('utf8'); const o = JSON.parse(s); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  const API = { VER: '0.1.0', THEMES, ROWS, SCHEMA, DEF, cfgOf, cfgDiff, colors, cssText, topBarText, previewArg, previewCfg, lum, contrast, inkOn, mix };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.BQL = API;
})(typeof window !== 'undefined' ? window : this);
