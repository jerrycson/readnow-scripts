/* 📚 북스퀸 서가 책장 — 순수 셈(브라우저·node 시험 tSHELF1111 함께) · 외부 라이브러리 없음 (11/11 shelf1 · 정범님 11/11 저녁 요청)
 *  이 파일 하나가 '설정 틀(SCHEMA) + 셈'을 모두 가짐 — 손님 화면(shelf.js)·관리 웹앱(⚙ 서가 책장 설정)·리드나우2 꾸밈 템플릿 블록이 같은 틀을 읽음(약속 53)
 *   · SCHEMA 한 줄 = { k, label, type: number|select|check|text|area|multi, def, min, max, step, opts, group, help } — 리드나우2 U2W.def props와 같은 꼴(multi만 더함 · 없으면 쉼표 글로)
 *   · cfgOf(날것) → 범위를 지킨 설정 · plan(책, 설정, 정렬) → 책장 묶음 · look(책, 설정) → 책등 모양(같은 책은 늘 같은 모양 — 섞기 번호 seed로 바꿈)
 *  참고한 사례(약속 42): 교보·영풍 매장 서가(분야 표찰·칸 나눔) · 츠타야 서점(주제별 편집 서가) · Apple Books 옛 나무 책장 · 알라딘 중고 매장 '책등 보기' · Steam 3D 책장 데모(원형 진열) */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQS = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* ── 무료 한글 글꼴 20 (모두 Google Fonts · SIL Open Font License — 상업 사용·웹 삽입 자유) */
  const FONTS = [
    ['noto-sans', 'Noto Sans KR', 'wght@500;700', 'sans-serif'], ['noto-serif', 'Noto Serif KR', 'wght@500;700', 'serif'], ['nanum-gothic', 'Nanum Gothic', 'wght@700', 'sans-serif'],
    ['nanum-myeongjo', 'Nanum Myeongjo', 'wght@700', 'serif'], ['nanum-pen', 'Nanum Pen Script', '', 'cursive'], ['nanum-brush', 'Nanum Brush Script', '', 'cursive'],
    ['black-han', 'Black Han Sans', '', 'sans-serif'], ['do-hyeon', 'Do Hyeon', '', 'sans-serif'], ['jua', 'Jua', '', 'sans-serif'], ['gowun-dodum', 'Gowun Dodum', '', 'sans-serif'],
    ['gowun-batang', 'Gowun Batang', 'wght@700', 'serif'], ['gaegu', 'Gaegu', 'wght@700', 'cursive'], ['hi-melody', 'Hi Melody', '', 'cursive'], ['song-myung', 'Song Myung', '', 'serif'],
    ['sunflower', 'Sunflower', 'wght@500', 'sans-serif'], ['yeon-sung', 'Yeon Sung', '', 'cursive'], ['gothic-a1', 'Gothic A1', 'wght@600', 'sans-serif'], ['ibm-plex', 'IBM Plex Sans KR', 'wght@600', 'sans-serif'],
    ['hahmlet', 'Hahmlet', 'wght@600', 'serif'], ['dongle', 'Dongle', 'wght@700', 'sans-serif']].map(([id, name, ax, gen]) => ({ id, name, ax, gen }));
  /* ── 책등 디자인 30 (모양 그림은 shelf.css의 .sp[data-d="번호"]) */
  const DESIGNS = ['민무늬', '위아래 띠', '금박 두 줄', '가운데 이름표', '가는 세로줄', '가죽 결', '천 결', '빛 번짐', '위 색 바꿈', '아래 색 바꿈', '마름모', '점무늬', '체크', '물결', '가로 줄 여럿', '금박 테두리', '사선 리본',
    '문고판', '고전 양장(마디)', '모던 블록', '잔꽃', '헤링본', '별빛', '반짝 결', '바랜 빛', '사선 나눔', '동그라미 둘', '지그재그', '금장 띠', '전집 번호'];
  /* ── 색 묶음 (책 천·가죽에 흔한 색 위주) */
  const PALETTES = {
    classic: ['#7a1f2b', '#1f3a5f', '#2f5d3a', '#5b3a29', '#3b2f4a', '#8a5a1f', '#24443f', '#6b2d2d', '#2d3b55', '#4a4a2a', '#5a2340', '#1d4d5c'],
    pastel: ['#e8c7c8', '#c9d8e8', '#cfe3cf', '#efe0b9', '#dccfe8', '#f2d3b8', '#c7e3df', '#e6d7c3', '#d5dbe0', '#f0c9d8', '#d9e4bf', '#c4cde8'],
    vivid: ['#d7263d', '#1b998b', '#f46036', '#2e294e', '#c5d86d', '#0096c7', '#ff9f1c', '#6a4c93', '#e71d36', '#2ec4b6', '#ffbf00', '#3a86ff'],
    earth: ['#8c6a43', '#a0522d', '#6b705c', '#a5a58d', '#7f5539', '#b08968', '#606c38', '#283618', '#bc6c25', '#dda15e', '#4a5759', '#9c6644'],
    mono: ['#1f1f1f', '#3a3a3a', '#575757', '#7a7a7a', '#a3a3a3', '#cfcfcf', '#e9e4da', '#2b2b33', '#45403a', '#f2efe8', '#5f5a52', '#141414'] };
  PALETTES.mix = [].concat(PALETTES.classic, PALETTES.vivid, PALETTES.earth, PALETTES.pastel.slice(0, 6), PALETTES.mono.slice(0, 4));
  /* ── 장바구니·찜 움직임 */
  const CART_ANIMS = [['pull', '꺼내서 날아가기'], ['arc', '포물선 던지기'], ['cover', '표지 보이며 미끄러지기'], ['tumble', '빙글빙글 굴러 담기'], ['drop', '쏙 뽑혀 위에서 떨어지기']];
  const WISH_ANIMS = [['heart', '하트 퐁퐁'], ['blush', '수줍게 몸 비틀기(볼 빨개짐)'], ['bookmark', '빨간 책갈피 꽂힘'], ['jump', '신나서 깡총깡총'], ['wink', '윙크하며 "데려가 주세요!"']];
  const SORTS = [['cat', '주제 분류'], ['title', '상품명(가나다)'], ['price', '가격대'], ['reg', '등록순'], ['sales', '판매량'], ['rec', '추천순']];
  const opt = (L) => Object.fromEntries(L.map((x) => (Array.isArray(x) ? x : [x, x])));
  /* ── 설정 틀 — 관리 웹앱 설정 화면·리드나우2 블록 속성이 이것을 그대로 그림 */
  const SCHEMA = [
    { k: 'on', group: '책장', label: '서가 책장 보이기(메뉴에 「서가 책장」)', type: 'check', def: true },
    { k: 'title', group: '책장', label: '쪽 제목', type: 'text', def: '서가 책장', max: 20 },
    { k: 'cap', group: '책장', label: '책장 하나에 꽂는 책 수', type: 'number', def: 200, min: 20, max: 300, step: 10, help: '넘치면 책장이 저절로 늘어남' },
    { k: 'pack', group: '책장', label: '작은 분야는 한 책장에 표찰로 나눠 함께 꽂기', type: 'check', def: true },
    { k: 'bayW', group: '책장', label: '칸 너비(px · 넓은 화면에서 칸이 몇 개로 나뉠지)', type: 'number', def: 460, min: 240, max: 1400, step: 20 },
    { k: 'rowH', group: '책장', label: '선반 높이(px · 확대 1배 기준)', type: 'number', def: 190, min: 120, max: 320, step: 10 },
    { k: 'wood', group: '책장', label: '나무 색', type: 'select', def: 'oak', opts: { oak: '참나무', walnut: '호두나무', maple: '단풍나무(밝음)', cherry: '벚나무(붉음)', white: '흰 칠', black: '검은 칠' } },
    { k: 'room', group: '책장', label: '방 바탕', type: 'select', def: 'warm', opts: { warm: '따뜻한 조명', paper: '한지', night: '밤 서재', green: '초록 벽' } },
    { k: 'sort0', group: '정렬', label: '처음 정렬', type: 'select', def: 'cat', opts: opt(SORTS) },
    { k: 'sorts', group: '정렬', label: '손님이 고를 수 있는 정렬', type: 'multi', def: SORTS.map((x) => x[0]), opts: opt(SORTS) },
    { k: 'inner', group: '정렬', label: '주제 분류 안의 차례', type: 'select', def: 'reg', opts: { reg: '우리 등록순', title: '상품명', price: '낮은 값', sales: '판매량' } },
    { k: 'regDir', group: '정렬', label: '등록순 방향', type: 'select', def: 'new', opts: { new: '새로 들어온 책 먼저', old: '먼저 들어온 책 먼저' } },
    { k: 'catOrder', group: '정렬', label: '분야 차례', type: 'select', def: 'n', opts: { n: '책이 많은 분야 먼저', name: '분야 이름 가나다' } },
    { k: 'bands', group: '정렬', label: '가격대 경계(원 · 쉼표)', type: 'text', def: '5000,10000,20000,30000' },
    { k: 'picks', group: '정렬', label: '추천 책 상품 번호(한 줄에 하나 · 추천순 맨 앞)', type: 'area', def: '' },
    { k: 'remember', group: '정렬', label: '손님이 고른 정렬을 그 기기에 기억', type: 'check', def: true },
    { k: 'spineImg', group: '책등', label: '알라딘 책등 그림이 있으면 쓰기', type: 'check', def: true },
    { k: 'designs', group: '책등', label: '쓸 책등 디자인(비우면 30가지 모두)', type: 'multi', def: [], opts: Object.fromEntries(DESIGNS.map((n, i) => [String(i + 1), (i + 1) + '. ' + n])) },
    { k: 'palette', group: '책등', label: '색 묶음', type: 'select', def: 'mix', opts: { mix: '고루 섞기', classic: '고전 천 색', vivid: '선명한 색', earth: '흙빛', pastel: '파스텔', mono: '흑백' } },
    { k: 'orient', group: '책등', label: '글 방향', type: 'select', def: 'rand', opts: { rand: '책마다 랜덤', v: '세로쓰기(한 글자씩 세움)', h: '가로쓰기(눕혀 씀)' } },
    { k: 'wMin', group: '책등', label: '가장 얇은 책(px)', type: 'number', def: 20, min: 12, max: 40 },
    { k: 'wMax', group: '책등', label: '가장 두꺼운 책(px)', type: 'number', def: 46, min: 24, max: 80 },
    { k: 'hVar', group: '책등', label: '책 키 들쭉날쭉(%)', type: 'number', def: 16, min: 0, max: 35 },
    { k: 'seed', group: '책등', label: '섞기 번호(바꾸면 색·디자인·글꼴이 새로 섞임)', type: 'number', def: 1, min: 0, max: 99999 },
    { k: 'fontsOn', group: '글꼴', label: '무료 한글 글꼴 받아 쓰기(끄면 기기 글꼴만 — 더 가벼움)', type: 'check', def: true },
    { k: 'fonts', group: '글꼴', label: '쓸 글꼴(비우면 20가지 모두)', type: 'multi', def: [], opts: Object.fromEntries(FONTS.map((f) => [f.id, f.name])) },
    { k: 'cartAnim', group: '움직임', label: '장바구니 담기 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(CART_ANIMS), off: '움직임 없음' } },
    { k: 'wishAnim', group: '움직임', label: '찜 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(WISH_ANIMS), off: '움직임 없음' } },
    { k: 'turn3d', group: '움직임', label: '책장 넘길 때 3D로 돌기(끄면 옆으로 밀기)', type: 'check', def: true },
    { k: 'turnMs', group: '움직임', label: '책장 도는 시간(ms)', type: 'number', def: 900, min: 250, max: 2500, step: 50 },
    { k: 'tip', group: '움직임', label: '책등에 마우스를 올리면 앞·뒤 표지와 책 정보', type: 'check', def: true },
    { k: 'tipMs', group: '움직임', label: '정보가 뜨기까지(ms)', type: 'number', def: 280, min: 0, max: 1500, step: 20 },
    { k: 'zoom0', group: '확대', label: '처음 확대(배)', type: 'number', def: 1, min: 0.5, max: 2.5, step: 0.1 },
    { k: 'viewerCfg', group: '확대', label: '손님이 ⚙ 보기에서 움직임·글 방향을 자기 기기만 바꿀 수 있음', type: 'check', def: true }];
  const DEF = Object.fromEntries(SCHEMA.map((p) => [p.k, p.def]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  /* 날것 설정 → 범위 지킨 설정(모르는 칸은 버림 · 틀린 값은 기본값) */
  function cfgOf(raw) { const r = raw && typeof raw === 'object' ? raw : {}; const o = {};
    for (const p of SCHEMA) { let v = r[p.k];
      if (p.type === 'number') { v = +v; o[p.k] = Number.isFinite(v) && v !== null && r[p.k] !== '' && r[p.k] != null ? clamp(p.step && p.step < 1 ? Math.round(v * 100) / 100 : Math.round(v), p.min, p.max) : p.def; }
      else if (p.type === 'check') o[p.k] = v == null ? p.def : !!v && v !== '0' && v !== 'false';
      else if (p.type === 'select') o[p.k] = v != null && Object.prototype.hasOwnProperty.call(p.opts, String(v)) ? String(v) : p.def;
      else if (p.type === 'multi') { const L = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\s]+/) : []).map(String).filter((x) => Object.prototype.hasOwnProperty.call(p.opts, x)); o[p.k] = v == null ? p.def.slice() : [...new Set(L)]; }
      else o[p.k] = v == null ? p.def : String(v).slice(0, p.type === 'area' ? 8000 : p.max || 200); }
    if (o.wMax < o.wMin + 4) o.wMax = Math.min(80, o.wMin + 4);
    if (!o.sorts.length) o.sorts = SORTS.map((x) => x[0]); if (!o.sorts.includes(o.sort0)) o.sort0 = o.sorts[0];
    return o; }
  /* 관리 화면 저장용 — 기본값과 같은 칸은 빼서 짧게(Firestore 문서·공개 설정 4KB 안) */
  function cfgDiff(c) { const o = cfgOf(c); const d = {}; for (const p of SCHEMA) { const a = o[p.k], b = p.def; if (JSON.stringify(a) !== JSON.stringify(b)) d[p.k] = a; } return d; }
  /* ── 같은 책은 늘 같은 모양 — 문자열 해시 + 작은 난수기 */
  const hash = (s) => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hex2 = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x777777; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = (h) => { const [r, g, b] = hex2(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const shade = (h, k) => { const c = hex2(h).map((v) => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255)); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };
  /* 글자색: 바탕과 대비 4.5:1 넘게(WCAG AA) — 밝은 바탕엔 먹색, 어두운 바탕엔 흰색 또는 금색 */
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const inkFor = (bg, r) => { const dk = '#1b1712', lt = '#fbf7ee', gold = '#f1d488'; if (contrast(bg, dk) >= contrast(bg, lt)) return dk; return r < 0.3 && contrast(bg, gold) >= 4.5 ? gold : lt; };
  function look(it, c, i) { c = c || DEF; const R = rng(hash((it && it.id) + '|' + (c.seed || 0))); const pal = PALETTES[c.palette] || PALETTES.mix;
    const D = (c.designs && c.designs.length ? c.designs.map(Number) : DESIGNS.map((_, k) => k + 1)); const F = c.fonts && c.fonts.length ? c.fonts : FONTS.map((f) => f.id);
    const base = pal[Math.floor(R() * pal.length)]; const d = D[Math.floor(R() * D.length)]; const f = F[Math.floor(R() * F.length)];
    const pg = +(it && it.pg) || 0; const span = c.wMax - c.wMin; const w = pg ? Math.round(clamp(c.wMin + (pg / 640) * span, c.wMin, c.wMax) + (R() - 0.5) * 3) : Math.round(c.wMin + Math.pow(R(), 1.4) * span);
    const h = Math.round((1 - R() * (c.hVar / 100)) * 1000) / 10; const o = c.orient === 'rand' ? (R() < 0.62 ? 'v' : 'h') : c.orient; const r2 = R();
    return { w: clamp(w, c.wMin, c.wMax), h, d, f, o, c: base, c2: lum(base) > 0.4 ? shade(base, -0.28) : shade(base, 0.32), k: inkFor(base, r2), tilt: R() < 0.04 ? (R() < 0.5 ? -1 : 1) : 0 }; }
  /* ── 한글 첫소리 · 상품명 묶음 */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; const CHO1 = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
  const initial = (t) => { const s = String(t || '').replace(/^[\s"'(\[{<〈《「『【]+/, ''); const ch = s.charCodeAt(0); if (ch >= 0xac00 && ch <= 0xd7a3) { const c = CHO[Math.floor((ch - 0xac00) / 588)]; return CHO1[c] || c; } if (/[a-z]/i.test(s[0] || '')) return 'A–Z'; if (/[0-9]/.test(s[0] || '')) return '숫자'; if (/[ㄱ-ㅎ]/.test(s[0] || '')) return CHO1[s[0]] || s[0]; return '기호·그 밖'; };
  const ORDER_INIT = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ', 'A–Z', '숫자', '기호·그 밖'];
  const KO = typeof Intl !== 'undefined' && Intl.Collator ? new Intl.Collator('ko', { numeric: true, sensitivity: 'base' }) : { compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0) };
  const bandsOf = (s) => [...new Set(String(s || '').split(/[,\s]+/).map((x) => Math.round(+x)).filter((x) => x > 0))].sort((a, b) => a - b).slice(0, 12);
  const wonS = (n) => (n >= 10000 ? (n % 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') : n / 10000) + '만' : n >= 1000 ? n / 1000 + '천' : n) + '원';
  const bandName = (B, p) => { let i = 0; while (i < B.length && p >= B[i]) i++; return [i, i === 0 ? wonS(B[0]) + ' 아래' : i === B.length ? wonS(B[B.length - 1]) + ' 넘게' : wonS(B[i - 1]) + '~' + wonS(B[i])]; };
  const GW = { 최상: 3, 상: 2, 중: 1, 하: 0 };
  /* 추천 점수: 정범님 추천(맨 앞) → 많이 팔리는 책 + 정가보다 많이 쌈 + 좋은 등급 + 새로 들어옴 (근거: 알라딘 중고 '추천' = 판매·할인·상태를 함께 봄 — 무게는 근거 없음 → 설정의 추천 책으로 손봄) */
  function recScore(x, now) { const off = x.lp > 0 && x.p > 0 && x.p < x.lp ? 1 - x.p / x.lp : 0; const sr = x.sr ? 1 / Math.log2(1 + x.sr) : 0; const age = x.at ? (now - Date.parse(x.at)) / 864e5 : 365; return sr * 3 + off * 2 + (GW[x.g] || 0) * 0.35 + (age < 14 ? 0.6 : age < 60 ? 0.25 : 0); }
  const regCmp = (dir) => (a, b) => (dir === 'old' ? 1 : -1) * (String(a.at || '').localeCompare(String(b.at || '')) || (a._o || 0) - (b._o || 0));
  function cmpOf(key, c, now) { if (key === 'title') return (a, b) => KO.compare(a.t || '', b.t || '');
    if (key === 'price') return (a, b) => a.p - b.p || KO.compare(a.t || '', b.t || ''); if (key === 'sales') return (a, b) => (a.sr || 1e9) - (b.sr || 1e9) || regCmp('new')(a, b);
    if (key === 'rec') return (a, b) => b._rs - a._rs || regCmp('new')(a, b); return regCmp(c.regDir); }
  /* ── 책장 묶음 짜기: 정렬 → 무리(분야·첫소리·가격대 · 없으면 하나) → 책장(수용 cap)마다 자리(slots: 책 또는 표찰 {lab})
   *  pack: 작은 무리는 앞 책장의 남은 자리에 표찰을 세워 이어 꽂음(실제 서점처럼) · 큰 무리는 cap마다 나눠 '문학 2/3' */
  function plan(items, c, key, now) { c = c || DEF; now = now || Date.now(); key = SORTS.some((s) => s[0] === key) ? key : c.sort0; const L = (items || []).filter((x) => x && x.id);
    const picks = String(c.picks || '').split(/[\s,]+/).map((x) => x.trim()).filter(Boolean); const P = new Map(picks.map((id, i) => [id, i]));
    if (key === 'rec') for (const x of L) x._rs = P.has(x.id) ? 1e6 - P.get(x.id) : recScore(x, now);
    let groups;
    if (key === 'cat') { const M = new Map(); for (const x of L) { const g = x.c || '분야 모름'; if (!M.has(g)) M.set(g, []); M.get(g).push(x); } const ic = cmpOf(c.inner === 'reg' ? 'reg' : c.inner, c, now);
      groups = [...M].map(([name, xs]) => ({ name, xs: xs.sort(ic) })).sort((a, b) => (a.name === '분야 모름') - (b.name === '분야 모름') || (c.catOrder === 'name' ? KO.compare(a.name, b.name) : b.xs.length - a.xs.length || KO.compare(a.name, b.name))); }
    else if (key === 'title') { const M = new Map(); for (const x of L.slice().sort(cmpOf('title'))) { const g = initial(x.t); if (!M.has(g)) M.set(g, []); M.get(g).push(x); } groups = ORDER_INIT.filter((g) => M.has(g)).map((g) => ({ name: g, xs: M.get(g) })); }
    else if (key === 'price') { const B = bandsOf(c.bands).length ? bandsOf(c.bands) : bandsOf(DEF.bands); const M = new Map(); for (const x of L.slice().sort(cmpOf('price'))) { const [i, nm] = bandName(B, x.p); if (!M.has(i)) M.set(i, { name: nm, xs: [] }); M.get(i).xs.push(x); } groups = [...M.keys()].sort((a, b) => a - b).map((i) => M.get(i)); }
    else { const nm = { reg: c.regDir === 'old' ? '먼저 들어온 차례' : '새로 들어온 차례', sales: '많이 팔리는 차례', rec: '추천 차례' }[key]; groups = [{ name: nm, xs: L.slice().sort(cmpOf(key, c, now)), seq: 1 }]; }
    const cap = c.cap; const cases = []; let cur = null; const open = () => { cur = { slots: [], groups: [], n: 0 }; cases.push(cur); };
    for (const g of groups) { const parts = Math.ceil(g.xs.length / cap) || 1;
      if (g.seq) { for (let i = 0; i < parts; i++) { open(); const xs = g.xs.slice(i * cap, (i + 1) * cap); cur.slots = xs; cur.n = xs.length; cur.groups.push({ name: g.name, from: i * cap + 1, to: i * cap + xs.length, of: g.xs.length }); cur.name = g.name; cur.sub = `${(i * cap + 1).toLocaleString('ko-KR')}~${(i * cap + xs.length).toLocaleString('ko-KR')}번째`; } cur = null; continue; }
      if (c.pack && cur && g.xs.length <= cap - cur.n && cur.n > 0) { cur.slots.push({ lab: g.name, n: g.xs.length }, ...g.xs); cur.n += g.xs.length; cur.groups.push({ name: g.name, n: g.xs.length }); continue; }
      for (let i = 0; i < parts; i++) { open(); const xs = g.xs.slice(i * cap, (i + 1) * cap); cur.slots.push({ lab: parts > 1 ? `${g.name} ${i + 1}/${parts}` : g.name, n: xs.length }, ...xs); cur.n = xs.length; cur.groups.push({ name: g.name, part: parts > 1 ? i + 1 : 0, parts, n: xs.length }); }
      if (!c.pack) cur = null; }
    for (const cs of cases) if (!cs.name) { const g = cs.groups; cs.name = g[0].part ? `${g[0].name} ${g[0].part}/${g[0].parts}` : g[0].name; cs.sub = g.length > 1 ? `외 ${g.length - 1}분야` : ''; }
    return { key, cases, n: L.length }; }
  /* ── 넓이 → 칸 수(넓은 화면은 칸을 나눠 실제 책장처럼 · 좁으면 한 칸에 선반이 늘어남) */
  const bays = (innerW, c, z) => clamp(Math.floor(innerW / Math.max(120, (c || DEF).bayW * (z || 1))), 1, 5);
  /* 칸 나누기: 표찰은 다음 책과 같은 칸에 · 칸마다 책 수가 고르게 */
  function split(slots, k) { if (k <= 1) return [slots]; const books = slots.filter((s) => !s.lab).length; const per = Math.ceil(books / k); const out = [[]]; let n = 0;
    for (let i = 0; i < slots.length; i++) { const s = slots[i]; if (!s.lab && n >= per && out.length < k) { out.push([]); n = 0; } if (s.lab && n >= per && out.length < k) { out.push([]); n = 0; } out[out.length - 1].push(s); if (!s.lab) n++; }
    while (out.length < k) out.push([]); return out; }
  /* ── 원형 배치: N개 책장을 사용자 둘레에 — i번 책장 각도 = i × 360/N(시계 반대쪽으로 다음 책장 · 오른쪽 화살표 = 책장들이 시계 방향으로 돌아 서쪽(다음) 책장이 북쪽으로)
   *  반지름 = 정N각형 변심거리(W/2 ÷ tan(π/N)) — 이웃 책장 모서리가 맞닿음 · N=2는 등 맞댐 · N=1은 돌지 않음 */
  function ring(N, W) { N = Math.max(1, N | 0); const step = 360 / N; const R = N >= 3 ? (W / 2) / Math.tan(Math.PI / N) : N === 2 ? W * 0.5 : 0; return { N, step, R: Math.round(R), persp: Math.round(clamp(R || W, 700, 2600)) }; }
  const mod = (a, n) => ((a % n) + n) % n;
  /* 나침반 이름: 지금 책장이 북쪽일 때 i번 책장의 방위(4개면 북·서·남·동 — 다음 책장이 서쪽) */
  function compass(i, cur, N) { const a = mod((i - cur) * (360 / N), 360); const D = ['북', '북서', '서', '남서', '남', '남동', '동', '북동']; return D[Math.round(a / 45) % 8]; }
  /* ── 찜 목록(이 기기) */
  const wishHas = (w, id) => (w || []).some((x) => x && x.id === id);
  const wishToggle = (w, it, max) => { const L = (w || []).filter((x) => x && x.id); if (wishHas(L, it.id)) return { wish: L.filter((x) => x.id !== it.id), on: false }; const n = [{ id: it.id, t: it.t, a: it.a || null, p: +it.p || 0, g: it.g || null, im: it.im || null, at: new Date().toISOString() }, ...L].slice(0, max || 300); return { wish: n, on: true }; };
  /* ── 받은 줄(cols + rows) → 책 · 그림 주소 앞부분 되살림 */
  function unpack(J) { const C = J.cols || []; const pre = J.pre || []; const ix = Object.fromEntries(C.map((k, i) => [k, i])); const U = (u) => (typeof u === 'string' && u[0] === '~' ? (pre[+u[1]] || '') + u.slice(2) : u || null);
    return (J.rows || []).map((r, o) => ({ id: String(r[ix.id]), t: r[ix.t] || '', a: r[ix.a] || null, c: r[ix.c] || null, p: +r[ix.p] || 0, lp: +r[ix.lp] || 0, g: r[ix.g] || null, at: r[ix.at] || null, im: U(r[ix.im]), sp: U(r[ix.sp]), bk: U(r[ix.bk]), st: r[ix.st] || 's', sr: +r[ix.sr] || 0, pg: +r[ix.pg] || 0, pb: r[ix.pb] || null, _o: o })); }
  /* ── 시범 자료(#/shelf?demo=N) — 실제 자료가 없을 때 보기·시험용 · 손님·상품 정보 아님 */
  const DW = ['바다', '별', '시간', '고양이', '여름', '도시', '숲', '편지', '기억', '노래', '정원', '바람', '겨울', '사람', '빛', '밤', '길', '섬', '꿈', '집', '창문', '나무', '강', '모래', '구름', '불꽃', '종이', '시계', '거울', '여행'];
  const DT = ['의 끝에서', '을 걷는 법', ' 이야기', '과 나', '의 문법', ' 산책', '이 오는 소리', '의 역사', ' 수업', '을 위한 변명', ' 일기', '에게', ' 안내서', '의 모든 것', ''];
  const DC = ['소설/시/희곡', '에세이', '인문학', '역사', '과학', '경제경영', '자기계발', '어린이', '만화', '예술/대중문화', '사회과학', '종교/역학', '요리/살림', '여행', '외국어', '컴퓨터/모바일', '건강/취미', '청소년', '유아', '수험서/자격증'];
  const DA = ['지은이 가', '지은이 나', '지은이 다', '지은이 라', '지은이 마', '지은이 바', '지은이 사', '지은이 아', '글쓴이 갑', '글쓴이 을', 'A. Writer', 'B. Author', '옮긴이 하나', '엮은이 둘', '그린이 셋']; /* 지어낸 이름(실제 사람 아님) */
  function demoItems(n, seed) { const R = rng(hash('demo' + (seed || 7))); const out = []; const day0 = Date.parse('2026-08-01');
    for (let i = 0; i < n; i++) { const w = DW[Math.floor(R() * DW.length)]; const t = (R() < 0.12 ? 'The ' + ['Sea', 'Star', 'Garden', 'Night', 'Road'][Math.floor(R() * 5)] : w + DT[Math.floor(R() * DT.length)]) + (R() < 0.15 ? ' ' + (1 + Math.floor(R() * 3)) : '');
      const lp = (8 + Math.floor(R() * 30)) * 1000; const p = Math.max(1000, Math.round(lp * (0.2 + R() * 0.6) / 100) * 100); const ci = Math.floor(Math.pow(R(), 1.7) * DC.length);
      out.push({ id: 'demo' + i, t, a: DA[Math.floor(R() * DA.length)], c: DC[ci], p, lp, g: ['최상', '상', '상', '중', '하'][Math.floor(R() * 5)], at: new Date(day0 + Math.floor(R() * 100) * 864e5).toISOString().slice(0, 10), im: null, sp: null, bk: null, st: R() < 0.03 ? 'o' : 's', sr: R() < 0.7 ? 1 + Math.floor(R() * n) : 0, pg: 80 + Math.floor(R() * 600), pb: '시범출판', _o: i }); }
    return out; }
  /* ── 글꼴: 책장 하나에 쓰인 글자만 받는 주소(Google Fonts text= — 한 글꼴 수십 KB) */
  const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
  const fontUrl = (id, text) => { const f = fontById(id); return 'https://fonts.googleapis.com/css2?family=' + f.name.replace(/ /g, '+') + (f.ax ? ':' + f.ax : '') + '&display=swap&text=' + encodeURIComponent([...new Set(String(text || ''))].sort().join('').slice(0, 900)); };
  /* 설정 미리 보기 주소(관리 화면 → 손님 화면 #/shelf?cfg=… · 저장 안 하고 그 화면만) */
  const b64e = (s) => { try { return (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } };
  const b64d = (s) => { try { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); } catch (e) { return ''; } };
  const previewArg = (c) => b64e(JSON.stringify(cfgDiff(c)));
  const previewCfg = (arg) => { try { return JSON.parse(b64d(arg)) || {}; } catch (e) { return {}; } };
  return { VER: '0.1.0', FONTS, DESIGNS, PALETTES, CART_ANIMS, WISH_ANIMS, SORTS, SCHEMA, DEF, cfgOf, cfgDiff, hash, rng, lum, contrast, inkFor, shade, look, initial, bandsOf, bandName, recScore, plan, bays, split, ring, mod, compass, wishHas, wishToggle, unpack, demoItems, fontById, fontUrl, previewArg, previewCfg };
});
