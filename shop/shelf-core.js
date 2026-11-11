/* 📚 북스퀸 서가 책장 — 순수 셈(브라우저·node 시험 tSHELF1111 함께) · 외부 라이브러리 없음 (11/11 shelf1 · shelf2 — 정범님 11/11 밤 요청)
 *  이 파일 하나가 '설정 틀(SCHEMA) + 셈'을 모두 가짐 — 손님 화면(shelf.js)·관리 웹앱(⚙ 서가 책장 설정)·리드나우2 꾸밈 템플릿 블록이 같은 틀을 읽음(약속 53)
 *   · SCHEMA 한 줄 = { k, label, type: number|select|check|text|area|multi, def, min, max, step, opts, group, help, hide } — 리드나우2 U2W.def props와 같은 꼴(multi만 더함 · 없으면 쉼표 글로)
 *   · cfgOf(날것) → 범위를 지킨 설정 · plan(책, 설정, 정렬) → 책장 묶음 · look(책, 설정) → 책등 모양
 *  (shelf2) 책등 모양 = 7가지 칸의 조합(디자인 50 × 색 108 × 무늬 40 × 글꼴 50 × 모양 10 × 장식색 4 × 글 방향 2 — combos()가 실제 목록 길이로 셈)
 *   · 한 번 정한 조합은 짧은 글(code '세대.출처.디자인.색.무늬.글꼴.모양.장식.방향')로 상품 번호에 영구히 저장(클라우드 shop_spines · 이 기기) — 설정을 바꿔도 이미 정한 책은 그대로 · 다시 정하기는 lookGen을 올림
 *   · ⚠ 그래서 DESIGNS·COLORS(만드는 식 포함)·PATTERNS·FONTS·SHAPES·ACCENTS는 '뒤에 덧붙이기만' — 순서를 바꾸거나 빼면 저장된 책등이 달라짐
 *   · 고르는 차례(정범님 11/11): 알라딘 책등 그림 → 앞표지 대표색(가장 가까운 색) → 제목 낱말·분야(색 무리·무늬·디자인·글꼴) → 그것도 없으면 랜덤 · 크기는 판형(가로×세로×두께 mm)·쪽수로
 *  참고한 사례(약속 42): 교보·영풍 매장 서가(분야 표찰·칸 나눔) · 츠타야 서점(주제별 편집 서가) · Apple Books 옛 나무 책장 · 알라딘 중고 매장 '책등 보기' · Steam 3D 책장 데모(원형 진열)
 *   · 책등 디자인: 펭귄 클래식 띠·민음사 세계문학 색 띠·열린책들 양장 · 도서관 청구기호 라벨 · 띠지(일본·한국 신간) · 문고판 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQS = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  /* ── 무료 한글 글꼴 50 (모두 Google Fonts · SIL Open Font License — 상업 사용·웹 삽입 자유 · 11/11 글꼴 주소 50개 모두 열어 확인)
   *  [별칭, 이름, 굵기 축, 대체 글꼴, 굵기] — 같은 글꼴의 다른 굵기(가늘게·아주 굵게)도 한 글꼴로 셈(37 글꼴 집안 + 굵기 변형 13) · 덧붙이기만 */
  const FONTS = [
    ['noto-sans', 'Noto Sans KR', 'wght@700', 'sans-serif', 700], ['noto-serif', 'Noto Serif KR', 'wght@700', 'serif', 700], ['nanum-gothic', 'Nanum Gothic', 'wght@700', 'sans-serif', 700],
    ['nanum-myeongjo', 'Nanum Myeongjo', 'wght@700', 'serif', 700], ['nanum-pen', 'Nanum Pen Script', '', 'cursive', 400], ['nanum-brush', 'Nanum Brush Script', '', 'cursive', 400],
    ['black-han', 'Black Han Sans', '', 'sans-serif', 400], ['do-hyeon', 'Do Hyeon', '', 'sans-serif', 400], ['jua', 'Jua', '', 'sans-serif', 400], ['gowun-dodum', 'Gowun Dodum', '', 'sans-serif', 400],
    ['gowun-batang', 'Gowun Batang', 'wght@700', 'serif', 700], ['gaegu', 'Gaegu', 'wght@700', 'cursive', 700], ['hi-melody', 'Hi Melody', '', 'cursive', 400], ['song-myung', 'Song Myung', '', 'serif', 400],
    ['sunflower', 'Sunflower', 'wght@500', 'sans-serif', 500], ['yeon-sung', 'Yeon Sung', '', 'cursive', 400], ['gothic-a1', 'Gothic A1', 'wght@600', 'sans-serif', 600], ['ibm-plex', 'IBM Plex Sans KR', 'wght@600', 'sans-serif', 600],
    ['hahmlet', 'Hahmlet', 'wght@600', 'serif', 600], ['dongle', 'Dongle', 'wght@700', 'sans-serif', 700],
    ['nanum-coding', 'Nanum Gothic Coding', 'wght@700', 'monospace', 700], ['bw-picture', 'Black And White Picture', '', 'sans-serif', 400], ['cute-font', 'Cute Font', '', 'cursive', 400], ['dokdo', 'Dokdo', '', 'cursive', 400],
    ['east-sea', 'East Sea Dokdo', '', 'cursive', 400], ['gamja', 'Gamja Flower', '', 'cursive', 400], ['gugi', 'Gugi', '', 'sans-serif', 400], ['kirang', 'Kirang Haerang', '', 'cursive', 400], ['poor-story', 'Poor Story', '', 'cursive', 400],
    ['single-day', 'Single Day', '', 'cursive', 400], ['stylish', 'Stylish', '', 'sans-serif', 400], ['bagel', 'Bagel Fat One', '', 'sans-serif', 400], ['diphylleia', 'Diphylleia', '', 'serif', 400], ['gasoek', 'Gasoek One', '', 'sans-serif', 400],
    ['grandiflora', 'Grandiflora One', '', 'serif', 400], ['moirai', 'Moirai One', '', 'sans-serif', 400], ['orbit', 'Orbit', '', 'sans-serif', 400],
    ['noto-sans-l', 'Noto Sans KR', 'wght@300', 'sans-serif', 300], ['noto-sans-b', 'Noto Sans KR', 'wght@900', 'sans-serif', 900], ['noto-serif-l', 'Noto Serif KR', 'wght@300', 'serif', 300], ['noto-serif-b', 'Noto Serif KR', 'wght@900', 'serif', 900],
    ['gothic-a1-l', 'Gothic A1', 'wght@300', 'sans-serif', 300], ['gothic-a1-b', 'Gothic A1', 'wght@900', 'sans-serif', 900], ['ibm-plex-l', 'IBM Plex Sans KR', 'wght@300', 'sans-serif', 300], ['ibm-plex-b', 'IBM Plex Sans KR', 'wght@700', 'sans-serif', 700],
    ['hahmlet-l', 'Hahmlet', 'wght@300', 'serif', 300], ['hahmlet-b', 'Hahmlet', 'wght@900', 'serif', 900], ['nanum-myeongjo-b', 'Nanum Myeongjo', 'wght@800', 'serif', 800], ['nanum-gothic-b', 'Nanum Gothic', 'wght@800', 'sans-serif', 800],
    ['sunflower-b', 'Sunflower', 'wght@700', 'sans-serif', 700]].map(([id, name, ax, gen, wt]) => ({ id, name, ax, gen, wt, label: name + (wt === 300 ? ' 가늘게' : wt >= 800 ? ' 아주 굵게' : '') }));
  /* ── 책등 디자인 50 = 짜임(띠·이름표·금박·나눔 — 그림은 shelf.css의 .sp[data-d="번호"] .sk) · 덧붙이기만 */
  const DESIGNS = ['민무늬', '위아래 띠', '금박 두 줄', '가운데 이름표', '위 색 바꿈', '아래 색 바꿈', '금박 테두리', '사선 리본', '문고판(가운데 흰 종이)', '고전 양장(마디 넷)',
    '모던 블록', '사선 나눔', '동그라미 둘', '아래 톱니 띠', '금장 띠', '전집 번호', '좌우 두 색', '가운데 굵은 띠', '세 줄 띠', '위 이름표 · 아래 띠',
    '두 겹 금박 테두리', '아래 세모', '위 아치', '가운데 마름모', '위 가는 테 세 겹', '아래 출판사 네모', '무지개 띠', '가죽 머리·꼬리', '양옆 금줄', '아래로 짙어짐',
    '위로 짙어짐', '빛 번짐', '바랜 빛', '아래 큰 원', '가운데 원', '위 별 장식', '도서관 청구기호 라벨', '띠지', '비닐 커버 광택', '위 사선 띠',
    '체스판 머리', '위아래 톱니', '두 색 대각', '가운데 흰 창', '금박 점선', '세 칸 나눔', '위 가는 줄 · 아래 굵은 줄', '리본 매듭', '안쪽 점선 칼선', '가죽 덧댄 모서리'];
  /* ── 무늬 40 = 겉감 결(책등 위에 한 겹 더 — .sp[data-p="번호"] .sk::before) · 덧붙이기만 */
  const PATTERNS = ['민결', '천 결', '리넨', '가죽 결', '마블', '잔 점', '큰 물방울', '가는 세로줄', '굵은 세로줄', '가로 줄무늬', '사선 줄무늬', '체크', '깅엄', '타탄', '헤링본', '물결', '비늘', '마름모 격자', '벌집', '별빛',
    '잔꽃', '나뭇잎', '지그재그', '동심원', '물결 반원', '바구니 짜임', '벽돌', '종이 결', '바랜 얼룩', '금빛 반짝이', '줄 노트', '모눈종이', '십자', '세모', '굵은 사선 띠', '빗살', '구름', '한지 섬유', '코르덴', '빛 결'];
  /* ── 모양 10 = 책 몸(모서리·등 볼록·머리띠 — .sp[data-s="번호"] .sk) · 덧붙이기만 */
  const SHAPES = ['반듯', '둥근 등', '둥근 모서리', '양장 머리띠', '낡아 깎인 모서리', '얇은 문고판', '천 장정 테', '반짝이 비닐', '머리가 좁은 책', '오래 읽은 책'];
  /* ── 장식색 4(금박·띠·테두리에 쓰는 색 --g) · 덧붙이기만 */
  const ACCENTS = [['gold', '금박'], ['silver', '은박'], ['ink', '먹(또는 흰)'], ['tone', '곁색']];
  /* ── 색 108 = 색 무리 12 × 밝기 9 (HSL 식으로 만듦 — 식·숫자를 바꾸면 저장된 책등 색이 바뀜 · 무리·밝기는 덧붙이기만) */
  const FAMS = [['red', '빨강', 356, 62], ['orange', '주황', 22, 70], ['yellow', '노랑', 44, 72], ['olive', '올리브', 72, 38], ['green', '초록', 140, 42], ['teal', '청록', 178, 48],
    ['blue', '파랑', 208, 58], ['navy', '남색', 228, 50], ['purple', '보라', 272, 38], ['pink', '분홍', 334, 55], ['brown', '갈색', 26, 36], ['gray', '먹·회색', 30, 6]];
  const TONES = [16, 24, 32, 40, 50, 60, 70, 80, 90];
  const hsl = (h, s, l) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
  const COLORS = []; FAMS.forEach(([fam, name, h, s]) => TONES.forEach((l, t) => COLORS.push({ hex: hsl(h, t >= 6 ? s * 0.78 : s, l), fam, t, name: name + ' ' + (t + 1) })));
  /* 색 묶음(설정) = 108색 가운데 고르는 거름 */
  const PALS = { mix: () => true, classic: (x) => ['red', 'green', 'navy', 'brown', 'purple', 'teal'].includes(x.fam) && x.t >= 1 && x.t <= 3 || (x.fam === 'gray' && x.t <= 1), vivid: (x) => x.fam !== 'gray' && x.fam !== 'brown' && x.t >= 3 && x.t <= 5,
    earth: (x) => ['brown', 'olive', 'orange', 'yellow'].includes(x.fam) && x.t >= 1 && x.t <= 5 || (x.fam === 'gray' && x.t >= 3 && x.t <= 6), pastel: (x) => x.t >= 6 && x.t <= 8, mono: (x) => x.fam === 'gray' || (x.fam === 'navy' && x.t <= 1) };
  const PALETTES = Object.fromEntries(Object.keys(PALS).map((k) => [k, COLORS.filter(PALS[k]).map((x) => x.hex)])); /* 옛 꼴(색 글 목록) 그대로 */
  /* ── 책장 종류 13 (그림은 shelf.css의 .bqs.wood-이름) */
  const CASES = [['oak', '참나무'], ['walnut', '호두나무'], ['maple', '단풍나무(밝음)'], ['cherry', '벚나무(붉음)'], ['pine', '소나무(옹이)'], ['white', '흰 칠'], ['black', '검은 칠'],
    ['nordic', '하얀 북유럽(자작 합판)'], ['steel', '철제 앵글'], ['antique', '고서점 원목(조각 장식)'], ['library', '도서관 서가(철제·표지판)'], ['brick', '벽돌 받침 송판'], ['ladder', '사다리 서가'], ['pipe', '쇠 파이프 공방']];
  /* ── 장바구니·찜 움직임 */
  const CART_ANIMS = [['pull', '꺼내서 날아가기'], ['arc', '포물선 던지기'], ['cover', '표지 보이며 미끄러지기'], ['tumble', '빙글빙글 굴러 담기'], ['drop', '쏙 뽑혀 위에서 떨어지기']];
  const WISH_ANIMS = [['heart', '하트 퐁퐁'], ['blush', '수줍게 몸 비틀기(볼 빨개짐)'], ['bookmark', '빨간 책갈피 꽂힘'], ['jump', '신나서 깡총깡총'], ['wink', '윙크하며 "데려가 주세요!"']];
  const SORTS = [['cat', '주제 분류'], ['title', '상품명(가나다)'], ['price', '가격대'], ['reg', '등록순'], ['sales', '판매량'], ['rec', '추천순']];
  const opt = (L) => Object.fromEntries(L.map((x) => (Array.isArray(x) ? x : [x, x])));
  const num1 = (L) => Object.fromEntries(L.map((n, i) => [String(i + 1), (i + 1) + '. ' + n]));
  /* ── 설정 틀 — 관리 웹앱 설정 화면·리드나우2 블록 속성이 이것을 그대로 그림 */
  const SCHEMA = [
    { k: 'on', group: '책장', label: '서가 책장 보이기(메뉴에 「서가 책장」)', type: 'check', def: true },
    { k: 'title', group: '책장', label: '쪽 제목', type: 'text', def: '서가 책장', max: 20 },
    { k: 'wood', group: '책장', label: '책장 종류', type: 'select', def: 'oak', opts: opt(CASES), help: '손님도 ⚙ 보기에서 자기 기기만 바꿀 수 있음' },
    { k: 'room', group: '책장', label: '방 바탕', type: 'select', def: 'warm', opts: { warm: '따뜻한 조명', paper: '한지', night: '밤 서재', green: '초록 벽' } },
    { k: 'cap', group: '책장', label: '책장 하나에 꽂는 책 수', type: 'number', def: 200, min: 20, max: 300, step: 10, help: '넘치면 책장이 저절로 늘어남' },
    { k: 'pack', group: '책장', label: '작은 분야는 한 책장에 표찰로 나눠 함께 꽂기', type: 'check', def: true },
    { k: 'bayW', group: '책장', label: '칸 너비(px · 넓은 화면에서 칸이 몇 개로 나뉠지)', type: 'number', def: 460, min: 240, max: 1400, step: 20 },
    { k: 'rowH', group: '책장', label: '선반 높이(px · 확대 1배 기준)', type: 'number', def: 190, min: 120, max: 320, step: 10 },
    { k: 'sort0', group: '정렬', label: '처음 정렬', type: 'select', def: 'cat', opts: opt(SORTS) },
    { k: 'sorts', group: '정렬', label: '손님이 고를 수 있는 정렬', type: 'multi', def: SORTS.map((x) => x[0]), opts: opt(SORTS) },
    { k: 'inner', group: '정렬', label: '주제 분류 안의 차례', type: 'select', def: 'reg', opts: { reg: '우리 등록순', title: '상품명', price: '낮은 값', sales: '판매량' } },
    { k: 'regDir', group: '정렬', label: '등록순 방향', type: 'select', def: 'new', opts: { new: '새로 들어온 책 먼저', old: '먼저 들어온 책 먼저' } },
    { k: 'catOrder', group: '정렬', label: '분야 차례', type: 'select', def: 'n', opts: { n: '책이 많은 분야 먼저', name: '분야 이름 가나다' } },
    { k: 'bands', group: '정렬', label: '가격대 경계(원 · 쉼표)', type: 'text', def: '5000,10000,20000,30000' },
    { k: 'picks', group: '정렬', label: '추천 책 상품 번호(한 줄에 하나 · 추천순 맨 앞)', type: 'area', def: '' },
    { k: 'remember', group: '정렬', label: '손님이 고른 정렬을 그 기기에 기억', type: 'check', def: true },
    { k: 'spineImg', group: '책등', label: '알라딘 책등 그림이 있으면 쓰기', type: 'check', def: true },
    { k: 'coverColor', group: '책등', label: '책등 그림이 없으면 앞표지 대표색과 비슷한 색으로', type: 'check', def: true },
    { k: 'themeOn', group: '책등', label: '표지 그림도 없으면 제목 낱말·분야로 색·무늬·글꼴 고르기(바다→푸른 물결 · 어린이→동글동글)', type: 'check', def: true },
    { k: 'sizeOn', group: '책등', label: '판형(세로·두께 mm)·쪽수로 책 키·두께 맞추기', type: 'check', def: true },
    { k: 'lookKeep', group: '책등', label: '한 번 정한 책등 모양을 그 책에 영구히(상품 번호 기준 · 설정을 바꿔도 이미 정한 책은 그대로)', type: 'check', def: true },
    { k: 'lookGen', group: '책등', label: '책등 모양 세대', type: 'number', def: 0, min: 0, max: 9999, hide: true, help: '「책등 모양 모두 다시 정하기」 단추가 1씩 올림 — 옛 세대 모양은 지우지 않고 안 씀' },
    { k: 'fullText', group: '책등', label: '책등에 제목·지은이를 되도록 전체로(크게 보면 전체 · 작게 보면 줄임)', type: 'check', def: true },
    { k: 'minFs', group: '책등', label: '전체로 쓸 때 가장 작은 글자(px)', type: 'number', def: 9, min: 6, max: 14, step: 0.5, help: '이보다 작아지면 줄여(…) 씀' },
    { k: 'designs', group: '책등', label: '쓸 책등 디자인(비우면 50가지 모두)', type: 'multi', def: [], opts: num1(DESIGNS) },
    { k: 'pats', group: '책등', label: '쓸 무늬(비우면 40가지 모두)', type: 'multi', def: [], opts: num1(PATTERNS) },
    { k: 'shapes', group: '책등', label: '쓸 책 모양(비우면 10가지 모두)', type: 'multi', def: [], opts: num1(SHAPES) },
    { k: 'palette', group: '책등', label: '색 묶음', type: 'select', def: 'mix', opts: { mix: '고루 섞기(108색)', classic: '고전 천 색', vivid: '선명한 색', earth: '흙빛', pastel: '파스텔', mono: '흑백' } },
    { k: 'orient', group: '책등', label: '글 방향', type: 'select', def: 'rand', opts: { rand: '책마다 랜덤', v: '세로쓰기(한 글자씩 세움)', h: '가로쓰기(눕혀 씀)' } },
    { k: 'wMin', group: '책등', label: '가장 얇은 책(px)', type: 'number', def: 20, min: 12, max: 40 },
    { k: 'wMax', group: '책등', label: '가장 두꺼운 책(px)', type: 'number', def: 48, min: 24, max: 80 },
    { k: 'hVar', group: '책등', label: '크기 정보 없는 책의 키 들쭉날쭉(%)', type: 'number', def: 16, min: 0, max: 35 },
    { k: 'seed', group: '책등', label: '섞기 번호(바꾸면 새로 정하는 책의 색·디자인·글꼴이 새로 섞임)', type: 'number', def: 1, min: 0, max: 99999 },
    { k: 'fontsOn', group: '글꼴', label: '무료 한글 글꼴 받아 쓰기(끄면 기기 글꼴만 — 더 가벼움)', type: 'check', def: true },
    { k: 'fonts', group: '글꼴', label: '쓸 글꼴(비우면 50가지 모두)', type: 'multi', def: [], opts: Object.fromEntries(FONTS.map((f) => [f.id, f.label])) },
    { k: 'popMode', group: '움직임', label: '책등을 누르면', type: 'select', def: 'spine', opts: { spine: '책등 표면에 바로 단추(장바구니·찜·자세히)', bubble: '책등 위 말풍선 창' } },
    { k: 'cartAnim', group: '움직임', label: '장바구니 담기 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(CART_ANIMS), off: '움직임 없음' } },
    { k: 'wishAnim', group: '움직임', label: '찜 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(WISH_ANIMS), off: '움직임 없음' } },
    { k: 'turn3d', group: '움직임', label: '책장 넘길 때 3D로 돌기(끄면 옆으로 밀기)', type: 'check', def: true },
    { k: 'turnMs', group: '움직임', label: '책장 도는 시간(ms)', type: 'number', def: 900, min: 250, max: 2500, step: 50 },
    { k: 'tip', group: '움직임', label: '책등에 마우스를 올리면 앞·뒤 표지와 책 정보', type: 'check', def: true },
    { k: 'tipMs', group: '움직임', label: '정보가 뜨기까지(ms)', type: 'number', def: 280, min: 0, max: 1500, step: 20 },
    { k: 'zoom0', group: '확대', label: '처음 확대(배)', type: 'number', def: 1, min: 0.5, max: 2.5, step: 0.1 },
    { k: 'viewerCfg', group: '확대', label: '손님이 ⚙ 보기에서 책장 종류·움직임·글 방향을 자기 기기만 바꿀 수 있음', type: 'check', def: true }];
  const DEF = Object.fromEntries(SCHEMA.map((p) => [p.k, p.def]));
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
  /* ── 같은 입력은 늘 같은 결과 — 문자열 해시 + 작은 난수기 */
  const hash = (s) => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hex2 = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x777777; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = (h) => { const [r, g, b] = hex2(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const shade = (h, k) => { const c = hex2(h).map((v) => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255)); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };
  /* 글자색: 바탕과 대비 4.5:1 넘게(WCAG AA) — 밝은 바탕엔 먹색, 어두운 바탕엔 흰색 또는 금색 */
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const inkFor = (bg, r) => { const dk = '#1b1712', lt = '#fbf7ee', gold = '#f1d488'; if (contrast(bg, dk) >= contrast(bg, lt)) return dk; return r < 0.3 && contrast(bg, gold) >= 4.5 ? gold : lt; };
  /* 가장 가까운 색(사람 눈에 맞춘 무게 — 빨강 0.3 · 초록 0.59 · 파랑 0.11 근사 'redmean') */
  const cdist = (a, b) => { const [r1, g1, b1] = hex2(a), [r2, g2, b2] = hex2(b); const rm = (r1 + r2) / 2; const dr = r1 - r2, dg = g1 - g2, db = b1 - b2; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); };
  const nearest = (hex, idx) => { let best = idx[0], bd = 1e9; for (const i of idx) { const d = cdist(hex, COLORS[i].hex); if (d < bd) { bd = d; best = i; } } return best; };
  /* 표지 대표색 — 작게 줄인 그림의 RGBA 바이트 배열에서(브라우저 canvas 16×16) · 흰 여백·검은 글씨는 무게를 낮추고 채도 높은 색에 무게 */
  function dominant(px) { const B = new Map(); const n = px ? px.length : 0;
    for (let i = 0; i + 3 < n; i += 4) { if (px[i + 3] < 128) continue; const r = px[i], g = px[i + 1], b = px[i + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const sat = mx ? (mx - mn) / mx : 0;
      let w = 1 + sat * 2.5; if (mn > 232) w *= 0.15; else if (mx < 22) w *= 0.35; const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4); const o = B.get(k) || [0, 0, 0, 0]; o[0] += w; o[1] += r * w; o[2] += g * w; o[3] += b * w; B.set(k, o); }
    let top = null; for (const v of B.values()) if (!top || v[0] > top[0]) top = v; if (!top) return null;
    return '#' + [top[1], top[2], top[3]].map((x) => Math.round(x / top[0]).toString(16).padStart(2, '0')).join(''); }
  /* ── 제목 낱말·분야 → 색 무리·무늬·디자인·글꼴(번호는 1부터) — 근거: 표지 디자인 관습(바다=푸른색·어린이=원색·고전=가죽·경제=남색 블록) · 맞는 것이 없으면 랜덤 */
  const SERIF = [2, 4, 11, 14, 19, 33, 35, 41, 47, 48], SANS_B = [7, 8, 32, 34, 39, 43, 45, 49], CUTE = [9, 12, 13, 23, 26, 27, 29, 30], HAND = [5, 6, 13, 16, 24, 25, 28], TECH = [17, 18, 21, 37, 44, 31];
  const WORDS = [
    [/바다|파도|섬|물결|강물|호수|항구|해변|비 |빗|고래|ocean|sea|wave/i, { fam: ['blue', 'teal', 'navy'], pat: [16, 17, 25, 37], des: [5, 6, 30] }],
    [/숲|나무|정원|꽃|풀|잎|봄|초록|산책|forest|garden|tree|flower/i, { fam: ['green', 'olive'], pat: [21, 22, 38, 3], des: [4, 20] }],
    [/밤|별|달|우주|꿈|새벽|은하|night|star|moon|dream/i, { fam: ['navy', 'purple'], tone: [0, 1, 2, 3], pat: [20, 30, 37], des: [36, 32, 34] }],
    [/불|여름|태양|햇|열정|붉은|불꽃|fire|sun|summer/i, { fam: ['red', 'orange', 'yellow'], pat: [24, 40, 11], des: [8, 12] }],
    [/겨울|눈 |눈송이|얼음|하얀|snow|winter|ice/i, { fam: ['gray', 'blue'], tone: [5, 6, 7, 8], pat: [28, 38, 20], des: [44, 9] }],
    [/마음|사랑|연애|그리움|편지|안녕|love|heart|letter/i, { fam: ['pink', 'red'], pat: [6, 21, 7], font: HAND, des: [48, 13] }],
    [/고양이|강아지|개 |동물|새 |토끼|곰|cat|dog|bear/i, { fam: ['orange', 'yellow', 'brown'], pat: [6, 7, 13], font: CUTE, shape: [3, 2] }],
    [/돈|부자|투자|주식|경제|부동산|마케팅|money|invest/i, { fam: ['navy', 'green', 'gray'], pat: [8, 32, 1], des: [11, 18, 47], font: SANS_B }],
    [/역사|전쟁|왕|조선|제국|고려|삼국|history|war|empire/i, { fam: ['brown', 'red'], tone: [0, 1, 2, 3], pat: [4, 29], des: [10, 28, 15, 50], font: SERIF, shape: [4, 10] }],
    [/시간|기억|시계|옛|추억|어제|time|memory/i, { fam: ['brown', 'yellow', 'olive'], pat: [29, 28, 3], des: [33, 31] }],
    [/도시|거리|빌딩|지하철|city|street/i, { fam: ['gray', 'navy'], pat: [10, 27, 32], des: [11, 46] }],
    [/여행|길|기차|떠나|비행|travel|road|trip/i, { fam: ['teal', 'orange', 'blue'], pat: [31, 32, 16], des: [37, 38] }],
    [/철학|생각|존재|진리|사유|philosoph/i, { fam: ['gray', 'navy', 'brown'], des: [3, 21, 45], font: SERIF }],
    [/과학|물리|수학|코딩|프로그래밍|컴퓨터|인공지능|데이터|science|code|data/i, { fam: ['teal', 'blue', 'gray'], pat: [32, 19, 8], des: [11, 47, 46], font: TECH }]];
  const CATS = [
    [/소설|시\/|희곡/, { pat: [3, 2, 4, 1], des: [3, 10, 21, 28, 38], font: SERIF }], [/에세이/, { tone: [5, 6, 7], pat: [3, 28, 21], font: [10, 11, 5, 26, 46] }],
    [/인문|종교|역학|사회과학/, { tone: [0, 1, 2, 3], des: [3, 7, 10, 21, 45], font: SERIF }], [/역사/, { fam: ['brown', 'red'], des: [10, 28], pat: [4] }],
    [/과학|컴퓨터|수험|자격/, { fam: ['blue', 'teal', 'gray'], des: [11, 18, 47, 37], pat: [32, 8], font: TECH }], [/경제|경영|자기계발/, { fam: ['navy', 'red', 'yellow'], des: [11, 18, 19, 38], font: SANS_B }],
    [/어린이|유아|만화|청소년/, { tone: [3, 4, 5, 6], des: [16, 34, 35, 36, 13], pat: [6, 7, 12, 21], font: CUTE, shape: [3, 2] }], [/예술|대중문화/, { tone: [3, 4, 5], des: [8, 12, 43, 27], pat: [5, 24, 25] }],
    [/요리|살림/, { fam: ['orange', 'yellow', 'red'], tone: [4, 5, 6, 7], pat: [13, 12], font: [10, 9] }], [/여행/, { fam: ['teal', 'blue', 'orange'], pat: [31, 37] }],
    [/외국어/, { fam: ['blue', 'red'], des: [2, 19] }], [/건강|취미/, { fam: ['green', 'teal'], pat: [3, 2] }]];
  function themeOf(it) { const out = {}; const add = (o) => { for (const k in o) if (!out[k]) out[k] = o[k]; }; const t = ' ' + String((it && it.t) || '') + ' ';
    for (const [re, o] of WORDS) if (re.test(t)) { add(o); break; } const c = String((it && it.c) || ''); for (const [re, o] of CATS) if (re.test(c)) { add(o); break; } return Object.keys(out).length ? out : null; }
  /* ── 고르기: 설정의 거름(쓸 디자인·무늬·모양·글꼴·색 묶음) 안에서 · 추천 목록이 있으면 4번 중 3번은 그 안에서 */
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const allowed = (c) => ({ D: c.designs && c.designs.length ? c.designs.map(Number) : range(DESIGNS.length), P: c.pats && c.pats.length ? c.pats.map(Number) : range(PATTERNS.length), S: c.shapes && c.shapes.length ? c.shapes.map(Number) : range(SHAPES.length),
    F: (c.fonts && c.fonts.length ? c.fonts : FONTS.map((f) => f.id)).map((id) => FONTS.findIndex((f) => f.id === id) + 1).filter((i) => i > 0), C: COLORS.map((x, i) => i).filter((i) => (PALS[c.palette] || PALS.mix)(COLORS[i])) });
  const pickIn = (R, pref, all) => { const P = (pref || []).filter((x) => all.includes(x)); return P.length && R() < 0.75 ? P[Math.floor(R() * P.length)] : all[Math.floor(R() * all.length)]; };
  /* 책 한 권의 조합 정하기 → { g, src, d, ci, p, fi, s, a, o } (cc = 앞표지 대표색 #rrggbb · 없으면 null) */
  function assign(it, c, cc) { c = c || DEF; const A = allowed(c); const R = rng(hash(((it && it.id) || '') + '|' + (c.seed || 0) + '|' + (c.lookGen || 0)));
    const th = c.themeOn !== false ? themeOf(it) : null; let src = it && it.sp && c.spineImg ? 's' : cc && c.coverColor ? 'c' : th ? 't' : 'r';
    let ci; if (cc && c.coverColor) ci = nearest(cc, A.C); else if (th && (th.fam || th.tone)) { const L = A.C.filter((i) => (!th.fam || th.fam.includes(COLORS[i].fam)) && (!th.tone || th.tone.includes(COLORS[i].t))); ci = (L.length ? L : A.C)[Math.floor(R() * (L.length || A.C.length))]; }
    else ci = A.C[Math.floor(R() * A.C.length)];
    const d = pickIn(R, th && th.des, A.D), p = pickIn(R, th && th.pat, A.P), fi = pickIn(R, th && th.font, A.F), s = pickIn(R, th && th.shape, A.S);
    const a = Math.floor(R() * ACCENTS.length); const o = c.orient === 'rand' ? (R() < 0.62 ? 'v' : 'h') : c.orient;
    return { g: c.lookGen || 0, src, d, ci: ci + 1, p, fi, s, a: a + 1, o }; }
  const CODE_RE = /^(\d{1,4})\.([scrt])\.(\d{1,2})\.(\d{1,3})\.(\d{1,2})\.(\d{1,2})\.(\d{1,2})\.(\d)\.([vh])$/;
  const encode = (A) => [A.g, A.src, A.d, A.ci, A.p, A.fi, A.s, A.a, A.o].join('.');
  function decode(code) { const m = CODE_RE.exec(String(code || '')); if (!m) return null; const A = { g: +m[1], src: m[2], d: +m[3], ci: +m[4], p: +m[5], fi: +m[6], s: +m[7], a: +m[8], o: m[9] };
    if (!A.d || A.d > DESIGNS.length || !A.ci || A.ci > COLORS.length || !A.p || A.p > PATTERNS.length || !A.fi || A.fi > FONTS.length || !A.s || A.s > SHAPES.length || !A.a || A.a > ACCENTS.length) return null; return A; }
  /* ── 크기: 판형 '가로x세로x두께'(mm · 클라우드 sz) → 키(선반 높이의 %)·두께(px) · 없으면 쪽수 · 그것도 없으면 랜덤(같은 책은 늘 같음)
   *  근거: 국내 판형 46판 127×188 · 신국판 152×225 · 크라운판 176×248 · 46배판 188×257 · A4 210×297 → 297mm = 선반 높이 100% · 종이 한 쪽 ≈ 0.06mm + 표지 2mm */
  const SZ_RE = /^(\d{2,3})x(\d{2,3})(?:x(\d{1,3}))?$/;
  function sizeOf(it, c) { c = c || DEF; const R = rng(hash(((it && it.id) || '') + '|sz')); const m = c.sizeOn !== false ? SZ_RE.exec(String((it && it.sz) || '')) : null; const H = m ? +m[2] : 0, D = m && m[3] ? +m[3] : 0; const pg = +(it && it.pg) || 0;
    const dmm = D || (pg ? pg * 0.06 + 2 : 0); const span = c.wMax - c.wMin; const j = (R() - 0.5) * 2;
    const w = dmm ? clamp(c.wMin + ((dmm - 5) / 40) * span + j, c.wMin, c.wMax) : c.wMin + Math.pow(R(), 1.4) * span;
    const h = H ? clamp(H / 2.97, 50, 100) : clamp((225 + j * (c.hVar / 16) * 35 - R() * 4) / 2.97, 50, 100);
    return { w: Math.round(w), h: Math.round(h * 10) / 10, tilt: R() < 0.04 ? (R() < 0.5 ? -1 : 1) : 0, real: !!(H || dmm) }; }
  /* ── 책등 글 맞추기: 제목·지은이가 다 들어가는 가장 큰 글자(확대 1배 기준 px) — 세로쓰기 줄(열) 여러 개로 감김 · 손님 화면이 (글자 × 확대 < minFs)면 줄임(…) */
  const glen = (s) => [...String(s || '')].length;
  function textFit(t, a, w, hp) { const W = Math.max(6, w * 0.8), nt = Math.max(1, glen(t)), na = glen(a); const Ht = hp * (na ? 0.66 : 0.86), Ha = hp * 0.22;
    const fit = (n, H, top) => { for (let f = top; f >= 4; f -= 0.5) { const k = Math.floor(W / (f * 1.14)); const per = Math.floor(H / (f * 1.04)); if (k >= 1 && per >= 1 && k * per >= n) return f; } return 4; };
    const ft = fit(nt, Ht, 22); const fa = na ? Math.min(ft * 0.8, fit(na, Ha, 14)) : 0; return { ft, fa }; }
  /* 책등 하나의 모든 것(화면이 쓰는 꼴) — A(조합)는 저장된 것 또는 assign() 결과 */
  function dress(it, A, c) { c = c || DEF; const z = sizeOf(it, c); const col = COLORS[A.ci - 1]; const base = col.hex; const R = rng(hash(((it && it.id) || '') + '|ink'));
    const c2 = lum(base) > 0.4 ? shade(base, -0.28) : shade(base, 0.32); const k = A.d === 9 || A.d === 44 ? '#1b1712' : inkFor(base, R());
    const g = ['#d9b45a', '#cfd3d8', lum(base) > 0.35 ? '#1b1712' : '#f4efe4', lum(base) > 0.4 ? shade(base, -0.45) : shade(base, 0.55)][A.a - 1]; const f = FONTS[A.fi - 1];
    const skH = (c.rowH - 24) * z.h / 100; const T = textFit(it && it.t, it && it.a, z.w, skH);
    return { code: encode(A), src: A.src, g: A.g, d: A.d, ci: A.ci, p: A.p, s: A.s, a: A.a, o: A.o, f: f.id, fw: f.wt, c: base, c2, k, ac: g, w: z.w, h: z.h, tilt: z.tilt, ft: T.ft, fa: T.fa, real: z.real }; }
  /* 옛 부름(look) 그대로 — 저장된 조합이 없을 때 새로 정함 */
  function look(it, c, cc) { c = c || DEF; return dress(it, assign(it, c, cc || (it && it.cc) || null), c); }
  /* 조합 수 — 실제로 만든 목록 길이를 곱함(정범님 11/11: 1억 넘게) */
  function combos() { const D = DESIGNS.length, C = COLORS.length, P = PATTERNS.length, F = FONTS.length, S = SHAPES.length, A = ACCENTS.length, O = 2; return { D, C, P, F, S, A, O, core: D * C * P * F * S, total: D * C * P * F * S * A * O }; }
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
    return (J.rows || []).map((r, o) => ({ id: String(r[ix.id]), t: r[ix.t] || '', a: r[ix.a] || null, c: r[ix.c] || null, p: +r[ix.p] || 0, lp: +r[ix.lp] || 0, g: r[ix.g] || null, at: r[ix.at] || null, im: U(r[ix.im]), sp: U(r[ix.sp]), bk: U(r[ix.bk]), st: r[ix.st] || 's', sr: +r[ix.sr] || 0, pg: +r[ix.pg] || 0, pb: r[ix.pb] || null, sz: ix.sz != null ? r[ix.sz] || null : null, lk: ix.lk != null ? r[ix.lk] || null : null, _o: o })); }
  /* ── 시범 자료(#/shelf?demo=N) — 실제 자료가 없을 때 보기·시험용 · 손님·상품 정보 아님 */
  const DW = ['바다', '별', '시간', '고양이', '여름', '도시', '숲', '편지', '기억', '노래', '정원', '바람', '겨울', '사람', '빛', '밤', '길', '섬', '꿈', '집', '창문', '나무', '강', '모래', '구름', '불꽃', '종이', '시계', '거울', '여행'];
  const DT = ['의 끝에서', '을 걷는 법', ' 이야기', '과 나', '의 문법', ' 산책', '이 오는 소리', '의 역사', ' 수업', '을 위한 변명', ' 일기', '에게', ' 안내서', '의 모든 것', ''];
  const DC = ['소설/시/희곡', '에세이', '인문학', '역사', '과학', '경제경영', '자기계발', '어린이', '만화', '예술/대중문화', '사회과학', '종교/역학', '요리/살림', '여행', '외국어', '컴퓨터/모바일', '건강/취미', '청소년', '유아', '수험서/자격증'];
  const DA = ['지은이 가', '지은이 나', '지은이 다', '지은이 라', '지은이 마', '지은이 바', '지은이 사', '지은이 아', '글쓴이 갑', '글쓴이 을', 'A. Writer', 'B. Author', '옮긴이 하나', '엮은이 둘', '그린이 셋']; /* 지어낸 이름(실제 사람 아님) */
  function demoItems(n, seed) { const R = rng(hash('demo' + (seed || 7))); const out = []; const day0 = Date.parse('2026-08-01');
    for (let i = 0; i < n; i++) { const w = DW[Math.floor(R() * DW.length)]; const t = (R() < 0.12 ? 'The ' + ['Sea', 'Star', 'Garden', 'Night', 'Road'][Math.floor(R() * 5)] : w + DT[Math.floor(R() * DT.length)]) + (R() < 0.15 ? ' ' + (1 + Math.floor(R() * 3)) : '');
      const lp = (8 + Math.floor(R() * 30)) * 1000; const p = Math.max(1000, Math.round(lp * (0.2 + R() * 0.6) / 100) * 100); const ci = Math.floor(Math.pow(R(), 1.7) * DC.length);
      out.push({ id: 'demo' + i, t, a: DA[Math.floor(R() * DA.length)], c: DC[ci], p, lp, g: ['최상', '상', '상', '중', '하'][Math.floor(R() * 5)], at: new Date(day0 + Math.floor(R() * 100) * 864e5).toISOString().slice(0, 10), im: null, sp: null, bk: null, st: R() < 0.03 ? 'o' : 's', sr: R() < 0.7 ? 1 + Math.floor(R() * n) : 0, pg: 80 + Math.floor(R() * 600), pb: '시범출판', sz: R() < 0.7 ? ['127x188', '128x188', '140x210', '145x210', '152x225', '153x224', '170x230', '176x248', '188x257', '210x297', '110x175'][Math.floor(R() * 11)] + 'x' + (6 + Math.floor(R() * 40)) : null, _o: i }); }
    return out; }
  /* ── 글꼴: 책장 하나에 쓰인 글자만 받는 주소(Google Fonts text= — 한 글꼴 수십 KB) */
  const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
  /* 같은 글꼴 집안의 다른 굵기는 받는 주소가 달라 별칭도 따로(bqf-별칭) */
  const fontUrl = (id, text) => { const f = fontById(id); return 'https://fonts.googleapis.com/css2?family=' + f.name.replace(/ /g, '+') + (f.ax ? ':' + f.ax : '') + '&display=swap&text=' + encodeURIComponent([...new Set(String(text || ''))].sort().join('').slice(0, 900)); };
  /* 설정 미리 보기 주소(관리 화면 → 손님 화면 #/shelf?cfg=… · 저장 안 하고 그 화면만) */
  const b64e = (s) => { try { return (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } };
  const b64d = (s) => { try { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); } catch (e) { return ''; } };
  const previewArg = (c) => b64e(JSON.stringify(cfgDiff(c)));
  const previewCfg = (arg) => { try { return JSON.parse(b64d(arg)) || {}; } catch (e) { return {}; } };
  return { VER: '0.2.0', FONTS, DESIGNS, PATTERNS, SHAPES, ACCENTS, COLORS, FAMS, PALETTES, CASES, CART_ANIMS, WISH_ANIMS, SORTS, SCHEMA, DEF, cfgOf, cfgDiff, hash, rng, lum, contrast, inkFor, shade, cdist, nearest, dominant, themeOf, assign, encode, decode, CODE_RE, sizeOf, textFit, dress, look, combos, initial, bandsOf, bandName, recScore, plan, bays, split, ring, mod, compass, wishHas, wishToggle, unpack, demoItems, fontById, fontUrl, previewArg, previewCfg };
});
