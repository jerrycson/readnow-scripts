/* 📚 북스퀸 서가 책장 — 순수 셈(브라우저·node 시험 tSHELF1111 함께) · 외부 라이브러리 없음 (11/11 shelf1 · shelf2 — 정범님 11/11 밤 요청)
 *  이 파일 하나가 '설정 틀(SCHEMA) + 셈'을 모두 가짐 — 손님 화면(shelf.js)·관리 웹앱(⚙ 서가 책장 설정)·리드나우2 꾸밈 템플릿 블록이 같은 틀을 읽음(약속 53)
 *   · SCHEMA 한 줄 = { k, label, type: number|select|check|text|area|multi, def, min, max, step, opts, group, help, hide } — 리드나우2 U2W.def props와 같은 꼴(multi만 더함 · 없으면 쉼표 글로)
 *   · cfgOf(날것) → 범위를 지킨 설정 · plan(책, 설정, 정렬) → 책장 묶음 · look(책, 설정) → 책등 모양
 *  (shelf2) 책등 모양 = 7가지 칸의 조합(디자인 50 × 색 20 × 무늬 40 × 글꼴 50 × 모양 50 × 장식색 4 × 글 방향 2 — combos()가 실제 목록 길이로 셈 · 정범님 11/11: 색은 줄이고 크기·모양을 늘림)
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
    ['sunflower-b', 'Sunflower', 'wght@700', 'sans-serif', 700],
    /* (shelf5 · 51~68) 스스로 올려 쓰는 상업 무료 글꼴 18 — 모두 SIL OFL 1.1(근거 shop/FONTS_LICENSE.md 2절) · 클라우드 /shop/font가 쓰인 글자만 잘라 줌(cloud/shop-font.js LIST와 같은 별칭) · 여섯째 칸 1 = 우리 클라우드 글꼴 */
    ['pretendard-b', 'Pretendard', '', 'sans-serif', 700, 1], ['pretendard-k', 'Pretendard', '', 'sans-serif', 900, 1], ['suit-b', 'SUIT', '', 'sans-serif', 700, 1], ['suit-h', 'SUIT', '', 'sans-serif', 900, 1],
    ['wanted-b', 'Wanted Sans', '', 'sans-serif', 700, 1], ['wanted-k', 'Wanted Sans', '', 'sans-serif', 950, 1], ['galmuri', '갈무리11', '', 'monospace', 700, 1], ['maruburi-b', '마루 부리', '', 'serif', 700, 1],
    ['maruburi-l', '마루 부리', '', 'serif', 300, 1], ['nsquare-b', '나눔스퀘어', '', 'sans-serif', 700, 1], ['nsquare-k', '나눔스퀘어', '', 'sans-serif', 800, 1], ['nsround-b', '나눔스퀘어 라운드', '', 'sans-serif', 700, 1],
    ['nsround-k', '나눔스퀘어 라운드', '', 'sans-serif', 800, 1], ['barun-gothic', '나눔바른고딕', '', 'sans-serif', 700, 1], ['barun-pen', '나눔바른펜', '', 'cursive', 700, 1], ['ridi-batang', '리디바탕', '', 'serif', 400, 1],
    ['line-seed', 'LINE Seed KR', '', 'sans-serif', 700, 1], ['neodgm', 'Neo둥근모', '', 'monospace', 400, 1]].map(([id, name, ax, gen, wt, bq]) => ({ id, name, ax, gen, wt, ...(bq ? { bq: 1 } : {}), label: name + (wt === 300 ? ' 가늘게' : wt >= 800 ? ' 아주 굵게' : '') }));
  /* ── (shelf4 · 정범님 11/12) 글꼴 갈래 — 앞표지 제목 글꼴과 '느낌'이 비슷한 것을 고르려고 FONTS마다 갈래를 붙임(목록 순서와 같음 · 새 글꼴도 뒤에 덧붙이며 갈래도 함께)
   *  my 명조·바탕 · go 고딕 · bd 굵은 제목체 · rd 둥근 · hw 손글씨 · br 붓글씨 · tw 타자기·코딩 · dp 꾸밈 */
  const FGEN = ['go', 'my', 'go', 'my', 'hw', 'br', 'bd', 'bd', 'rd', 'go', 'my', 'hw', 'hw', 'my', 'go', 'hw', 'go', 'go', 'my', 'rd', 'tw', 'dp', 'hw', 'br', 'br', 'hw', 'dp', 'dp', 'hw', 'hw', 'go', 'bd', 'my', 'bd', 'dp', 'dp', 'tw', 'go', 'bd', 'my', 'my', 'go', 'bd', 'go', 'go', 'my', 'my', 'my', 'bd', 'go',
    /* 51~68 (shelf5) */ 'go', 'bd', 'go', 'bd', 'go', 'bd', 'dp', 'my', 'my', 'go', 'bd', 'rd', 'rd', 'go', 'hw', 'my', 'go', 'dp'];
  const THIN = ['grandiflora', 'moirai', 'bw-picture', 'hi-melody', 'single-day', 'noto-sans-l', 'noto-serif-l', 'gothic-a1-l', 'ibm-plex-l', 'hahmlet-l', 'diphylleia', 'maruburi-l']; /* 획이 가는 글꼴 — 작은 글자에선 흐려 보여 얇은 테를 더함 */
  const GENRES = { my: '명조·바탕', go: '고딕', bd: '굵은 제목체', rd: '둥근', hw: '손글씨', br: '붓글씨', tw: '타자기', dp: '꾸밈' };
  const fontsOfGenre = (g) => FONTS.map((f, i) => i + 1).filter((i) => FGEN[i - 1] === g);
  /* 디자인 갈래 — 고전(금박·양장·가죽)은 명조·붓, 현대(블록·나눔)는 고딕·굵은 제목체, 귀여움(동그라미·아치·별)은 둥근·손글씨와 어울림 · 그 밖은 아무 글꼴 */
  const DGEN = { classic: [3, 7, 10, 15, 21, 28, 29, 45, 50, 48, 2], modern: [11, 12, 17, 18, 43, 46, 47, 19, 16, 5, 6], cute: [13, 23, 24, 34, 35, 36, 22, 42, 14, 27] };
  const DFIT = { classic: ['my', 'br', 'dp'], modern: ['go', 'bd', 'tw'], cute: ['rd', 'hw', 'dp', 'bd'] };
  const dgenOf = (d) => Object.keys(DGEN).find((k) => DGEN[k].includes(d)) || null;
  /* (shelf4) 도서관 청구기호 라벨(디자인 37)에 넣을 번호 — 한국십진분류(KDC) 큰 갈래 + 제목 첫소리 (빈 흰 네모로 보이던 것) */
  const KDC = { '소설·시': '813', 에세이: '814', 인문: '100', 역사: '911', 과학: '400', 경제경영: '320', 자기계발: '325', 어린이: '808', 만화: '657', 예술: '600', 사회: '300', 종교: '200', 요리: '594', 여행: '981', 외국어: '740', '컴퓨터·IT': '004', 건강: '512', 청소년: '808', 유아: '808', '수험서·참고서': '370' };
  const callNo = (it) => { const b = catOf(it || {}).b || ''; const k = Object.keys(KDC).find((x) => b.startsWith(x)); return [(k ? KDC[k] : '000') + '.' + ((hash(String((it && it.id) || '')) % 9) + 1), (initial(it && it.t) || '') + ((hash(String((it && it.t) || '')) % 89) + 11)]; };
  /* 지은이 칸은 이름만(정범님 11/12 — '지은이'·'글쓴이'·'옮긴이' 같은 항목 표시는 책등에 넣지 않음) · '(지은이)' 꼴도 · 이름 안 낱말('지은이와')은 그대로 */
  const ROLE = '지은이|글쓴이|옮긴이|엮은이|그린이|글·그림|글그림|그림|글|지음|옮김|엮음|편저|편역|감수|해설|사진|기획|원작|역자|저자|역|저|편|공저|공역';
  const ROLE_RE = new RegExp('\\s*\\((?:' + ROLE + ')\\)|(^|[\\s,·/])(?:' + ROLE + ')(?=$|[\\s,·/:])\\s*:?', 'g');
  const auName = (a) => String(a || '').replace(ROLE_RE, '$1').replace(/\s*,\s*/g, ', ').replace(/\s*·\s*/g, '·').replace(/(^[\s,·]+|[\s,·]+$)/g, '').replace(/\s{2,}/g, ' ').replace(/(,\s*){2,}/g, ', ').trim();
  /* ── 책등 디자인 50 = 짜임(띠·이름표·금박·나눔 — 그림은 shelf.css의 .sp[data-d="번호"] .sk) · 덧붙이기만 */
  const DESIGNS = ['민무늬', '위아래 띠', '금박 두 줄', '가운데 이름표', '위 색 바꿈', '아래 색 바꿈', '금박 테두리', '사선 리본', '문고판(가운데 흰 종이)', '고전 양장(마디 넷)',
    '모던 블록', '사선 나눔', '동그라미 둘', '아래 톱니 띠', '금장 띠', '전집 번호', '좌우 두 색', '가운데 굵은 띠', '세 줄 띠', '위 이름표 · 아래 띠',
    '두 겹 금박 테두리', '아래 세모', '위 아치', '가운데 마름모', '위 가는 테 세 겹', '아래 출판사 네모', '무지개 띠', '가죽 머리·꼬리', '양옆 금줄', '아래로 짙어짐',
    '위로 짙어짐', '빛 번짐', '바랜 빛', '아래 큰 원', '가운데 원', '위 별 장식', '도서관 청구기호 라벨', '띠지', '비닐 커버 광택', '위 사선 띠',
    '체스판 머리', '위아래 톱니', '두 색 대각', '가운데 흰 창', '금박 점선', '세 칸 나눔', '위 가는 줄 · 아래 굵은 줄', '리본 매듭', '안쪽 점선 칼선', '가죽 덧댄 모서리',
    /* (shelf7) 덧붙인 7 — 곁색(--c2) 칸이 크게 보이는 것 */ '양옆 굵은 띠', '위 세로 줄무늬 덮개', '아래 언덕', '아래 가로 줄무늬', '위 세모 깃발', 'ㄱ자 모서리 띠', '아래 바둑 띠'];
  /* ── 무늬 40 = 겉감 결(책등 위에 한 겹 더 — .sp[data-p="번호"] .sk::before) · 덧붙이기만 */
  const PATTERNS = ['민결', '천 결', '리넨', '가죽 결', '마블', '잔 점', '큰 물방울', '가는 세로줄', '굵은 세로줄', '가로 줄무늬', '사선 줄무늬', '체크', '깅엄', '타탄', '헤링본', '물결', '비늘', '마름모 격자', '벌집', '별빛',
    '잔꽃', '나뭇잎', '지그재그', '동심원', '물결 반원', '바구니 짜임', '벽돌', '종이 결', '바랜 얼룩', '금빛 반짝이', '줄 노트', '모눈종이', '십자', '세모', '굵은 사선 띠', '빗살', '구름', '한지 섬유', '코르덴', '빛 결',
    /* (shelf3 · 정범님 11/11: 무늬 50) 덧붙인 10 */ '돋을 점', '가는 격자', '대나무 마디', '청해파(파도 비늘)', '세로 나뭇결', '바랜 물 얼룩', '가는 사선 망', '사방 꽃 연속', '책 천 굵은 결', '먼지 낀 결',
    /* (shelf7 · 정범님 11/12) 덧붙인 22 — 멀리서도 보이는 굵은 무늬(위 50개는 옅은 결이라 10묶음으로만 셈) */ '굵은 가로 띠', '굵은 세로 띠', '굵은 사선 띠', '큰 바둑판', '큰 먹 물방울', '마름모 체크', '지그재그', '물결 비늘 테', '고리', '두 줄 레일',
    '채운 비늘', '굵은 벽돌', '먹 사선 격자', '세로 물결', '사다리', '가로 점선', '짙어지는 가로 띠', '십자 별', '네모 칸', '네 잎 점', '굵은 역사선 띠', '큰 흰 물방울'];
  /* ── 모양 50 = 책 몸 10(모서리·등 굴림·홈·닳음 — .sp[data-s="번호"] .sk) × 머리 5(헤드밴드·금박 머리선·닳은 머리 — .sp[data-h="번호"] .hd) · 덧붙이기만
   *  모양 번호 s = (몸-1)×5 + 머리 (1~50) */
  const BODIES = ['반듯', '둥근 등', '둥근 모서리', '양장 홈 줄', '낡아 깎인 모서리', '얇은 문고판', '천 장정 테', '반짝이 비닐', '머리가 좁은 책', '오래 읽은 책',
    /* (shelf7) 덧붙인 13 = 머리 실루엣(둥근 모서리·깎인 모서리·아치·V 홈·비스듬) × 겉면(민·양장 홈 줄·반짝이) 가운데 없던 것 · 모양 번호 s = (몸-1)×5 + 머리 그대로(최대 115) */
    '둥근 모서리 · 홈 줄', '둥근 모서리 · 반짝이', '깎인 모서리 · 홈 줄', '깎인 모서리 · 반짝이', '아치 머리', '아치 머리 · 홈 줄', '아치 머리 · 반짝이', 'V 홈 머리', 'V 홈 머리 · 홈 줄', 'V 홈 머리 · 반짝이', '비스듬한 머리', '비스듬한 머리 · 홈 줄', '비스듬한 머리 · 반짝이'];
  const HEADS = ['머리 그대로', '빨강·흰 헤드밴드', '파랑·금 헤드밴드', '금박 머리선', '닳아 바랜 머리'];
  const SHAPES = []; BODIES.forEach((b) => HEADS.forEach((h) => SHAPES.push(b + ' · ' + h)));
  const shapeOf = (s) => ({ body: Math.floor((s - 1) / HEADS.length) + 1, head: ((s - 1) % HEADS.length) + 1 });
  /* ── 장식색 4(금박·띠·테두리에 쓰는 색 --g) · 덧붙이기만 */
  const ACCENTS = [['gold', '금박'], ['silver', '은박'], ['ink', '먹(또는 흰)'], ['tone', '곁색']];
  /* ── 색 70(처음 20 + shelf3 덧붙인 50) = 책 천·가죽에 흔한 색(색 무리 12 · 밝기 0 짙음~8 옅음 · HSL 식) — 정범님 11/11: 색은 줄임 · 무리·밝기는 덧붙이기만 */
  const FAMS = [['red', '빨강', 356, 62], ['orange', '주황', 22, 70], ['yellow', '노랑', 44, 72], ['olive', '올리브', 72, 38], ['green', '초록', 140, 42], ['teal', '청록', 178, 48],
    ['blue', '파랑', 208, 58], ['navy', '남색', 228, 50], ['purple', '보라', 272, 38], ['pink', '분홍', 334, 55], ['brown', '갈색', 26, 36], ['gray', '먹·회색', 30, 6]];
  const TONES = [16, 24, 32, 40, 50, 60, 70, 80, 90];
  const hsl = (h, s, l) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
  const C20 = [['red', 1, '포도주'], ['red', 4, '다홍'], ['orange', 4, '주황'], ['yellow', 5, '겨자'], ['olive', 2, '올리브'], ['green', 1, '짙은 초록'], ['green', 5, '연두'], ['teal', 2, '짙은 청록'], ['teal', 6, '옥색'], ['blue', 3, '파랑'],
    ['blue', 7, '하늘'], ['navy', 0, '먹남색'], ['navy', 1, '남색'], ['purple', 2, '보라'], ['pink', 3, '장미'], ['pink', 6, '분홍'], ['brown', 1, '고동'], ['brown', 3, '밤색'], ['gray', 0, '먹'], ['gray', 7, '미색'],
    /* (shelf3 · 정범님 11/11: 색 70) 덧붙인 50색 — 헌책방 천·가죽·바랜 종이 빛 · [무리, 밝기, 이름, 색] · 서로 구별되게(시험이 가장 가까운 두 색 거리를 잼) */
    ['red', 2, '벽돌', '#8e3b2f'], ['red', 4, '주홍', '#c8442c'], ['red', 2, '연지', '#a8243b'], ['red', 1, '팥', '#6e2a2a'], ['red', 5, '산호', '#e07a5f'],
    ['orange', 4, '호박', '#d9822b'], ['orange', 3, '구리', '#a8572c'], ['orange', 6, '살구', '#f2b38a'], ['orange', 5, '귤', '#eda02a'],
    ['yellow', 4, '황토', '#b8913a'], ['yellow', 5, '개나리', '#f0d23c'], ['yellow', 7, '바랜 노랑', '#e6d39a'], ['yellow', 4, '꿀', '#c98f1e'], ['yellow', 6, '모래', '#bfa57a'],
    ['olive', 3, '쑥', '#7d8a4e'], ['olive', 2, '국방', '#55582e'], ['olive', 3, '이끼', '#7a8c1c'],
    ['green', 5, '청자', '#7fa98f'], ['green', 1, '소나무', '#3b5a1f'], ['green', 3, '풀', '#4f8a3c'], ['green', 7, '박하', '#a9d3b8'], ['green', 0, '짙은 녹', '#1f3d2b'],
    ['teal', 4, '청록 회', '#5f8c8a'], ['teal', 4, '물빛', '#3e9fab'], ['teal', 1, '짙은 바다', '#1e4d55'], ['teal', 3, '비취', '#2f8f78'],
    ['blue', 2, '쪽', '#2c4f86'], ['blue', 3, '코발트', '#2f62c0'], ['blue', 4, '회청', '#6c84a3'], ['blue', 7, '바랜 하늘', '#8fb4d6'], ['blue', 1, '군청', '#23337a'],
    ['navy', 1, '청람', '#40407a'], ['navy', 2, '청회', '#46536b'],
    ['purple', 1, '가지', '#4a2f4f'], ['purple', 6, '라벤더', '#a99bc7'], ['purple', 2, '자주', '#7a2e5c'], ['purple', 2, '포도', '#6a3a9a'],
    ['pink', 4, '진달래', '#c95d8a'], ['pink', 6, '바랜 장미', '#b98a8f'], ['pink', 7, '복숭아', '#f2c2b8'],
    ['brown', 0, '초콜릿', '#4a2414'], ['brown', 2, '가죽', '#7b4a2a'], ['brown', 3, '계피', '#b0683a'], ['brown', 4, '모카', '#6f5a4a'], ['brown', 5, '크라프트', '#b8916a'], ['brown', 7, '낡은 종이', '#d9c3a0'],
    ['gray', 0, '숯', '#4a4a4a'], ['gray', 3, '쥐색', '#77736b'], ['gray', 5, '은회', '#aaa69d'], ['gray', 8, '한지', '#efe8d6'],
    /* (shelf7 · 정범님 11/12 '겉으로 뚜렷한 색') 덧붙인 28색 — 위 70색 가운데 서로 CIEDE2000 ΔE 15 넘게 다른 것은 22색뿐이라, 그 22색과 ΔE 15 넘게 떨어진 색을 멀리 있는 것부터 채움(UQ.PAL 50색) */
    ['purple', 5, '전기 보라', '#c038f8'], ['yellow', 4, '라임', '#b8f800'], ['gray', 0, '흑녹', '#081000'], ['gray', 4, '회보라', '#807098'], ['navy', 4, '울트라마린', '#0028f8'], ['yellow', 2, '청포도', '#88a808'], ['yellow', 8, '연연두', '#e8f8c8'],
    ['pink', 4, '자홍', '#f82098'], ['purple', 8, '연보라', '#d8c8f8'], ['yellow', 2, '올리브 금', '#a08000'], ['pink', 0, '흑자주', '#300020'], ['gray', 5, '세이지', '#a0a080'], ['green', 2, '에메랄드', '#009050'], ['red', 6, '수박', '#f87870'],
    ['yellow', 0, '짙은 올리브', '#383800'], ['navy', 6, '수레국화', '#7878f0'], ['purple', 6, '난초', '#f080f8'], ['gray', 2, '흑연', '#484850'], ['orange', 5, '로즈 그레이', '#a88880'], ['orange', 2, '적갈', '#982800'], ['teal', 4, '아쿠아', '#00f8d8'],
    ['green', 4, '네온 초록', '#00f868'], ['navy', 1, '감청', '#000088'], ['red', 8, '벚꽃', '#f8c8c8'], ['orange', 0, '흑갈', '#200800'], ['yellow', 4, '황금 주황', '#e89010'], ['purple', 2, '마젠타', '#a000a0'], ['gray', 3, '말린 장미', '#785860']];
  const COLORS = C20.map(([fam, t, name, hx]) => { const F = FAMS.find((x) => x[0] === fam); return { hex: hx || hsl(F[2], t >= 6 ? F[3] * 0.78 : F[3], TONES[t]), fam, t, name }; });

  /* ── (shelf7 · 정범님 11/12) 겉으로 뚜렷한 고유 모양 = 디자인 묶음 × 색 짝(바탕 + 곁색) × 무늬 묶음 × 모양 묶음(몸 × 머리) — 글꼴·장식색·글 방향·미세 색은 덤(고유 셈에서 뺌)
   *  · 비슷해 보이는 것은 한 묶음으로 침(사진으로 직접 보고 정함 — src/tests/tSHELF7_1112.js가 사진을 남김) · 같은 표가 cloud/shop-uniq.js에도 있음(시험이 같은지 봄 · 둘 다 덧붙이기만)
   *  · PAL = 바탕·곁색으로 쓰는 50색(COLORS 번호) — 서로 CIEDE2000 ΔE 15 넘게 다름 · GONLY = 곁색을 장식색(--g) 자리에 보이는 디자인 */
  const UQ = {
    PAL: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 20, 28, 44, 45, 50, 68, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98],
    GONLY: [3, 7, 10, 15, 21, 24, 25, 26, 29, 35, 36, 45, 47, 48, 49],
    NOSEC: [1, 9, 16, 27, 32, 33, 37, 39, 44] /* 곁색이 안 보이는 디자인(민무늬·흰 종이·무지개 등) — 바탕색만 셈 */,
    DG: [[1, 32, 33, 39], [9, 44], [16], [27], [37], [7, 21, 49], [5, 31], [6, 30], [14, 41, 42], [15, 47], [19, 25], [22, 50], [3, 45], [28, 46], [34, 53],
      [2], [4], [8], [10], [11], [12], [13], [17], [18], [20], [23], [24], [26], [29], [35], [36], [38], [40], [43], [48], [51], [52], [54], [55], [56], [57]],
    PG: [[1, 2, 3, 15, 28, 38, 40, 42, 47, 50], [4, 5, 29, 46], [6, 20, 21, 30, 41, 48], [7, 22, 37], [8, 9, 39, 45, 49], [10, 31, 43], [11, 35, 36], [12, 13, 14, 26, 27, 32, 33], [17, 18, 19, 23, 34, 44], [16, 24, 25],
      [51, 67], [52], [53, 71], [54], [55], [56, 63], [57], [58, 61], [59], [60], [62, 69], [64], [65], [66], [68], [70], [72]],
    /* (shelf8 · 정범님 11/12 '직사각형에서 변형된 모양은 모두 빼고 직사각형으로') 둥근·깎인 모서리·아치·V 홈·비스듬 머리·좁은 머리는 화면에서 모두 반듯한 직사각형으로 그림(shelf.css) → 겉으로 남는 몸은 셋뿐: 민·홈 줄·반짝이 */
    BG: [[1, 2, 3, 5, 6, 7, 9, 15, 18, 21], [4, 11, 13, 16, 19, 22], [8, 12, 14, 17, 20, 23], [10]],
    HG: [[1], [2, 3, 4], [5]],
    /* (shelf8) 크기 묶음 — 실제 판형(mm)이 눈에 띄게 다른 차례: 키 6(문고·소형 / 46판 / 국판·A5 / 신국판 / 크라운·46배판 / A4 넘음) × 두께 6(얇음~아주 두꺼움) · 경계 mm */
    ZH: [170, 200, 215, 240, 270], ZD: [9, 15, 22, 31, 43],
    NOB: [10] /* '오래 읽은 책'은 색을 바래게 해 색 칸과 헷갈림 — 옛 책등은 그대로 두고 새로 정할 때는 안 씀 */ };
  /* 색 묶음(설정) = 20색 가운데 고르는 거름 */
  const PALS = { mix: () => true, classic: (x) => (['red', 'green', 'navy', 'brown', 'purple', 'teal'].includes(x.fam) && x.t <= 3) || (x.fam === 'gray' && x.t <= 1), vivid: (x) => x.fam !== 'gray' && x.t >= 3 && x.t <= 6,
    earth: (x) => ['brown', 'olive', 'orange', 'yellow'].includes(x.fam) || (x.fam === 'gray'), pastel: (x) => x.t >= 5, mono: (x) => x.fam === 'gray' || (x.fam === 'navy' && x.t <= 1) };
  const PALETTES = Object.fromEntries(Object.keys(PALS).map((k) => [k, COLORS.filter(PALS[k]).map((x) => x.hex)])); /* 옛 꼴(색 글 목록) 그대로 */
  /* ── 책장 종류 13 (그림은 shelf.css의 .bqs.wood-이름) */
  const CASES = [['oak', '참나무'], ['walnut', '호두나무'], ['maple', '단풍나무(밝음)'], ['cherry', '벚나무(붉음)'], ['pine', '소나무(옹이)'], ['white', '흰 칠'], ['black', '검은 칠'],
    ['nordic', '하얀 북유럽(자작 합판)'], ['steel', '철제 앵글'], ['antique', '고서점 원목(조각 장식)'], ['library', '도서관 서가(철제·표지판)'], ['brick', '벽돌 받침 송판'], ['ladder', '사다리 서가'], ['pipe', '쇠 파이프 공방']];
  /* ── 장바구니·찜 움직임 */
  const CART_ANIMS = [['pull', '꺼내서 날아가기'], ['arc', '포물선 던지기'], ['cover', '표지 보이며 미끄러지기'], ['tumble', '빙글빙글 굴러 담기'], ['drop', '쏙 뽑혀 위에서 떨어지기']];
  const WISH_ANIMS = [['heart', '하트 퐁퐁'], ['blush', '수줍게 몸 비틀기(볼 빨개짐)'], ['bookmark', '빨간 책갈피 꽂힘'], ['jump', '신나서 깡총깡총'], ['wink', '윙크하며 "데려가 주세요!"']];
  const SORTS = [['cat', '주제 분류'], ['title', '상품명(가나다)'], ['price', '가격대'], ['reg', '등록순'], ['sales', '판매량'], ['rec', '추천순'], /* (shelf8 · 정범님 11/12) 앞 몇 쪽 샘플을 모은 책만 */ ['pv', '샘플 있는 책']];
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
    /* (shop2 · 정범님 11/13) 수량이 2권 넘는 상품 — 서가에 모두 꽂을지 · 한 권만 꽂고 수량을 표시할지(장바구니·주문은 그대로 상품 하나씩) */
    { k: 'qtyMode', group: '책장', label: '수량이 여러 권인 상품', type: 'select', def: 'one', opts: { one: '한 권만 진열하고 수량 표시(×3)', all: '여러 권 모두 진열(같은 책등을 수량만큼 나란히)' } },
    { k: 'qtyMax', group: '책장', label: '여러 권 모두 진열할 때 한 상품 최대 권 수', type: 'number', def: 10, min: 2, max: 50, help: '수량이 이보다 많으면 이만큼만 꽂고 나머지는 수량 표시' },
    { k: 'bayW', group: '책장', label: '칸 너비(px · 넓은 화면에서 칸이 몇 개로 나뉠지)', type: 'number', def: 460, min: 240, max: 1400, step: 20 },
    { k: 'rowH', group: '책장', label: '선반 높이(px · 확대 1배 기준 · A4 297mm가 선반 높이 − 24px)', type: 'number', def: 220, min: 120, max: 360, step: 10 }, /* (shelf8) 190 → 220 — 책 두께를 실제 비율로 그리며(아래 thickK) 보통 책(21mm)이 15px 안팎이 되게 */
    { k: 'sort0', group: '정렬', label: '처음 정렬', type: 'select', def: 'cat', opts: opt(SORTS) },
    { k: 'sorts', group: '정렬', label: '손님이 고를 수 있는 정렬', type: 'multi', def: SORTS.map((x) => x[0]), opts: opt(SORTS) },
    { k: 'inner', group: '정렬', label: '주제 분류 안의 차례', type: 'select', def: 'reg', opts: { reg: '우리 등록순', title: '상품명', price: '낮은 값', sales: '판매량' } },
    { k: 'regDir', group: '정렬', label: '등록순 방향', type: 'select', def: 'new', opts: { new: '새로 들어온 책 먼저', old: '먼저 들어온 책 먼저' } },
    { k: 'catOrder', group: '정렬', label: '분야 차례(손님이 들어오자마자 보는 책장)', type: 'select', def: 'shop', opts: { shop: '서점 일반 차례(소설·에세이·인문… 종교는 뒤)', sales: '많이 팔리는 분야 먼저', n: '책이 많은 분야 먼저', name: '분야 이름 가나다' } },
    { k: 'catFirst', group: '정렬', label: '맨 앞에 둘 분야(쉼표 · 예: 소설·시,에세이)', type: 'text', def: '', max: 200, help: '여기 적은 큰 분야가 차례보다 먼저' },
    { k: 'catDepth', group: '정렬', label: '주제 분류 표찰(작은 분야)의 깊이', type: 'select', def: 'c2', opts: { c2: '알라딘 둘째 단계까지(한국소설·외국소설 …)', deep: '알라딘 가장 작은 분류까지(세계의 소설 › 중동/튀르키예소설 …)' }, help: '외국도서·잡지·음반·LP·DVD·블루레이는 따로 책장(정범님 11/13)' },
    { k: 'bands', group: '정렬', label: '가격대 경계(원 · 쉼표 · 최대 12개)', type: 'text', def: '1000,2000,3000,4000,5000,10000,20000,30000,40000,50000', help: '정범님 11/13 기본: 1천원대·2천원대·3천원대·4천원대 · 5천원대(5,000~9,999) · 1만원대·2만원대·3만원대·4만원대 · 5만원 이상' },
    { k: 'bandStyle', group: '정렬', label: '가격대 이름', type: 'select', def: 'dae', opts: { dae: '「1천원대」처럼(마지막은 「5만원 이상」)', range: '「1천원~2천원」처럼 범위로' } },
    { k: 'titleGroup', group: '정렬', label: '상품명 정렬의 글자 묶음', type: 'select', def: 'cho', opts: { cho: '한글 첫소리 ㄱ·ㄴ·ㄷ…(ㄲ은 ㄱ에) · 영문 한 묶음(A–Z) · 숫자 · 기호', az: '한글 첫소리 ㄱ·ㄴ·ㄷ… · 영문은 글자마다(A·B·C…) · 숫자 · 기호', wide: '크게 다섯 묶음(ㄱ~ㄷ·ㄹ~ㅂ·ㅅ~ㅇ·ㅈ~ㅊ·ㅋ~ㅎ) · 영문 · 숫자·기호' } },
    /* (shop2 · 정범님 11/13) 🔖 구역 바로 가기 — 서가 위에 그 구역(주제·글자·가격대) 첫 자리로 가는 링크 줄 · 위치 길잡이(‹ 책장 ›)는 그대로 */
    { k: 'jumpOn', group: '구역 바로 가기', label: '서가 위에 구역 바로 가기 링크 줄 보이기', type: 'check', def: true, help: '누르면 그 구역이 있는 책장(쪽)으로 넘어가 그 자리로' },
    { k: 'jumpSorts', group: '구역 바로 가기', label: '링크 줄을 보일 정렬', type: 'multi', def: ['cat', 'title', 'price', 'pv'], opts: { cat: '주제 분류', title: '상품명(가나다)', price: '가격대', pv: '샘플 있는 책' } },
    { k: 'jumpCat', group: '구역 바로 가기', label: '주제 분류 링크 나누기', type: 'select', def: 'big', opts: { big: '큰 주제마다(소설·시 · 에세이 · 인문 …)', small: '작은 주제까지(소설·시 › 한국소설 · 외국소설 …)' } },
    { k: 'jumpN', group: '구역 바로 가기', label: '링크에 권 수 함께 보이기', type: 'check', def: true },
    { k: 'jumpMob', group: '구역 바로 가기', label: '휴대폰 링크 줄', type: 'select', def: 'scroll', opts: { scroll: '한 줄 — 옆으로 밀어 보기(쿠팡·무신사 앱 분류 줄처럼)', wrap: '여러 줄로 모두 펼치기' } },
    { k: 'jumpStick', group: '구역 바로 가기', label: '휴대폰에서 위치 표시·링크 줄을 화면 위에 붙여 두기(내려도 보임)', type: 'check', def: true },
    { k: 'picks', group: '정렬', label: '추천 책 상품 번호(한 줄에 하나 · 추천순 맨 앞)', type: 'area', def: '' },
    { k: 'remember', group: '정렬', label: '손님이 고른 정렬을 그 기기에 기억', type: 'check', def: true },
    { k: 'spineImg', group: '책등', label: '알라딘 책등 그림이 있으면 쓰기', type: 'check', def: true },
    { k: 'coverColor', group: '책등', label: '책등 그림이 없으면 앞표지 대표색과 비슷한 색으로', type: 'check', def: true },
    { k: 'edgeSpine', group: '책등', label: '책등 그림이 없으면 앞표지 왼쪽 가장자리 띠를 늘려 책등처럼(대표색·글꼴 갈래와 함께 · 표지와 닮게)', type: 'check', def: true, help: '작은 표지 그림(약 10KB)을 화면 가까이 온 책만 받음' },
    { k: 'edgePct', group: '책등', label: '가장자리 띠 너비(앞표지 폭의 %)', type: 'number', def: 8, min: 3, max: 25 },
    { k: 'spineRule', group: '책등', label: '책등 그림 없는 책은 클라우드가 알라딘 책등 주소를 물어 채우기', type: 'check', def: true },
    { k: 'spineRuleAuto', group: '책등', label: '찾는 비율이 낮으면 저절로 천천히(1시간 10권)·멈춤(14일)', type: 'check', def: true, help: '배포 뒤 확인: 40권 중 1권만 있었음 — 끄면 늘 10분마다 묻음' },
    { k: 'spineRuleMin', group: '책등', label: '바라는 찾는 비율(%) — 이보다 낮으면 천천히 · 절반보다 낮으면 멈춤', type: 'number', def: 5, min: 1, max: 50 },
    { k: 'themeOn', group: '책등', label: '표지 그림도 없으면 제목 낱말·분야로 색·무늬·글꼴 고르기(바다→푸른 물결 · 어린이→동글동글)', type: 'check', def: true },
    { k: 'sizeOn', group: '책등', label: '판형(세로·두께 mm)·쪽수로 책 키·두께 맞추기', type: 'check', def: true },
    { k: 'lookKeep', group: '책등', label: '한 번 정한 책등 모양을 그 책에 영구히(상품 번호 기준 · 설정을 바꿔도 이미 정한 책은 그대로)', type: 'check', def: true },
    { k: 'lookGen', group: '책등', label: '책등 모양 세대', type: 'number', def: 0, min: 0, max: 9999, hide: true, help: '「책등 모양 모두 다시 정하기」 단추가 1씩 올림 — 옛 세대 모양은 지우지 않고 안 씀' },
    { k: 'fullText', group: '책등', label: '책등에 제목·지은이를 되도록 전체로(크게 보면 전체 · 작게 보면 줄임)', type: 'check', def: true },
    { k: 'minFs', group: '책등', label: '전체로 쓸 때 가장 작은 글자(px)', type: 'number', def: 9, min: 6, max: 14, step: 0.5, help: '이보다 작아지면 줄여(…) 씀' },
    { k: 'designs', group: '책등', label: '쓸 책등 디자인(비우면 ' + DESIGNS.length + '가지 모두)', type: 'multi', def: [], opts: num1(DESIGNS) },
    { k: 'pats', group: '책등', label: '쓸 무늬(비우면 ' + PATTERNS.length + '가지 모두)', type: 'multi', def: [], opts: num1(PATTERNS) },
    { k: 'shapes', group: '책등', label: '쓸 책 모양(비우면 ' + SHAPES.length + '가지 모두 = 몸 ' + BODIES.length + ' × 머리 ' + HEADS.length + ')', type: 'multi', def: [], opts: num1(SHAPES) },
    { k: 'palette', group: '책등', label: '색 묶음', type: 'select', def: 'mix', opts: { mix: '고루 섞기(70색)', classic: '고전 천 색', vivid: '선명한 색', earth: '흙빛', pastel: '파스텔', mono: '흑백' } },
    { k: 'orient', group: '책등', label: '글 방향', type: 'select', def: 'rand', opts: { rand: '책마다 랜덤', v: '세로쓰기(한 글자씩 세움)', h: '가로쓰기(눕혀 씀)' } },
    { k: 'wMin', group: '책등', label: '가장 얇은 책(px · 이보다 얇은 책만 이 두께로 — 누르기 쉽게)', type: 'number', def: 8, min: 4, max: 40 },
    { k: 'wMax', group: '책등', label: '가장 두꺼운 책(px)', type: 'number', def: 90, min: 24, max: 140 },
    { k: 'thickK', group: '책등', label: '두께 배율(1 = 실제 비율 — 세로 mm와 같은 자로 두께 mm를 잼)', type: 'number', def: 1, min: 1, max: 3, step: 0.1, help: '정범님 11/12: 크기 비율을 실제와 맞게 · 1보다 크면 두께만 부풀림' },
    { k: 'hVar', group: '책등', label: '크기 정보 없는 책의 키 들쭉날쭉(%)', type: 'number', def: 16, min: 0, max: 35 },
    { k: 'seed', group: '책등', label: '섞기 번호(바꾸면 새로 정하는 책의 색·디자인·글꼴이 새로 섞임)', type: 'number', def: 1, min: 0, max: 99999 },
    { k: 'fontsOn', group: '글꼴', label: '무료 한글 글꼴 받아 쓰기(끄면 기기 글꼴만 — 더 가벼움)', type: 'check', def: true },
    { k: 'fonts', group: '글꼴', label: '쓸 글꼴(비우면 68가지 모두)', type: 'multi', def: [], opts: Object.fromEntries(FONTS.map((f) => [f.id, f.label])) },
    { k: 'mobPop', group: '움직임', label: '책등을 누르면(휴대폰)', type: 'select', def: 'sheet', opts: { sheet: '아래에서 책 정보 창이 올라옴(지금까지 방식)', open: '책이 뽑혀 앞으로 나와 펼쳐짐(넓은 화면과 같음)', lift: '첫 누름에 책등이 앞으로 쏙 나오고 · 한 번 더 누르면 펼쳐짐' }, help: '손님도 ⚙ 보기에서 자기 기기만 바꿀 수 있음' },
    { k: 'popMode', group: '움직임', label: '책등을 누르면(넓은 화면)', type: 'select', def: 'open', opts: { open: '책이 뽑혀 앞으로 나와 펼쳐짐(앞·책등·뒤 표지 + 책 정보)', spine: '책등 표면에 바로 단추(장바구니·찜·자세히)', bubble: '책등 위 말풍선 창' } },
    { k: 'cartAnim', group: '움직임', label: '장바구니 담기 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(CART_ANIMS), off: '움직임 없음' } },
    { k: 'wishAnim', group: '움직임', label: '찜 움직임', type: 'select', def: 'rand', opts: { rand: '매번 랜덤', ...opt(WISH_ANIMS), off: '움직임 없음' } },
    { k: 'turn3d', group: '움직임', label: '책장 넘길 때 3D로 돌기(끄면 옆으로 밀기)', type: 'check', def: true },
    { k: 'turnFx', group: '움직임', label: '책장이 돌 때 먼지·종이 날림(가벼운 효과 · 움직임 줄이기 설정이면 안 함)', type: 'check', def: true },
    { k: 'peek', group: '움직임', label: '화살표에 다가가면 책장이 살짝 고개 돌려 다음 책장 이름을 엿보게', type: 'check', def: true },
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
  /* ── (shelf3) 큰 분야 — 알라딘 분류 경로('국내도서>소설/시/희곡>한국소설' 또는 쉼표로 이은 것)에서 사람이 읽는 짧은 이름 · 서점 일반 차례
   *  근거(약속 42): 교보·영풍 매장 안내도(문학 → 에세이 → 인문 → 역사 → 사회 → 경제경영 → 자기계발 → 과학 → 예술 → 어린이·청소년 → 취미·실용 → 외국어·수험 → 종교) · 알라딘 1단계 분류 이름 */
  const BIG = [['novel', '소설·시', /소설|시\/|희곡|^시$|^(한국|외국|세계|영미|일본|고전)?문학$/], ['essay', '에세이', /에세이/], ['human', '인문', /인문|철학|심리/], ['history', '역사', /역사|(?<!대중)문화/] /* (shop2) 알라딘 '예술/대중문화'가 역사로 가던 것 */, ['society', '사회·정치', /사회|정치|법/],
    ['econ', '경제경영', /경제|경영/], ['self', '자기계발', /자기계발/], ['science', '과학', /과학|공학|의학/], ['art', '예술', /예술|대중문화|음악|미술|사진|건축/], ['kids', '어린이', /어린이|초등/], ['baby', '유아', /유아/],
    ['teen', '청소년', /청소년/], ['comic', '만화', /만화|라이트\s?노벨/], ['family', '가정·육아', /가정|육아|부모|임신/], ['cook', '요리·살림', /요리|살림/], ['travel', '여행', /여행/], ['health', '건강·취미', /건강|취미|레저|스포츠/],
    ['lang', '외국어', /외국어|영어|일본어|중국어/], ['it', '컴퓨터·IT', /컴퓨터|모바일|IT/], ['exam', '수험서·참고서', /수험|자격|참고서|교재|대학교재|전집|교육/], ['religion', '종교', /종교|역학|기독교|불교|천주교|가톨릭/],
    /* (shop2 · 정범님 11/13 19:42) 상품 종류 책장 — 클라우드 cp 첫 칸(종류)으로 정함(외국도서·음반·LP·DVD·블루레이) · 국내 잡지는 분류 '잡지'로도 */
    ['foreign', '외국도서', /$^/], ['magazine', '잡지', /^잡지$/], ['music', '음반(CD)', /$^/], ['lp', 'LP', /$^/], ['dvd', 'DVD', /$^/], ['bluray', '블루레이', /$^/], ['etc', '여러 분야', /$^/]];
  const KIND_BIG = { 외국도서: 'foreign', 잡지: 'magazine', 음반: 'music', LP: 'lp', DVD: 'dvd', 블루레이: 'bluray' };
  const BIGK = Object.fromEntries(BIG.map((b, i) => [b[0], i]));
  /* 분류가 없는 책 — 제목·지은이 낱말로 큰 분야 짐작(맞는 것이 없으면 '여러 분야') · 차례가 중요(앞이 먼저) */
  const GUESS = [['religion', /성경|성서|기도|교회|하나님|하느님|예수|그리스도|복음|설교|신앙|묵상|큐티|찬송|목사|불교|불경|부처|사찰|스님|명상|선禪|천주교|가톨릭|성당|교리/], ['exam', /기출|문제집|모의고사|수능|공무원|자격증|검정고시|EBS|해커스|시나공|에듀윌|참고서|교과서|개념원리|쎈|평가문제/i],
    ['lang', /영어|일본어|중국어|회화|토익|토플|TOEIC|TOEFL|IELTS|JLPT|HSK|문법|단어장|English|Japanese/i], ['it', /파이썬|자바스크립트|자바|코딩|프로그래밍|엑셀|파워포인트|컴퓨터|인공지능|머신러닝|딥러닝|챗GPT|Python|Java|SQL|C\+\+|리눅스/i],
    ['cook', /요리|레시피|베이킹|밥상|반찬|도시락|살림|정리 수납/], ['travel', /여행|가이드북|트래블|배낭|걷기 여행/], ['family', /육아|임신|출산|태교|엄마표|아이 키우|부모 수업|자녀교육/], ['health', /건강|다이어트|요가|필라테스|운동|등산|낚시|바둑|골프|캠핑|뜨개|정원 가꾸/],
    ['kids', /그림책|동화|어린이|초등|유치원|전래/], ['comic', /만화|코믹|웹툰|애니메이션/], ['econ', /경제|경영|투자|주식|부동산|마케팅|재테크|회계|창업|브랜딩|세금/], ['self', /자기계발|성공|습관|리더십|화술|말하기|시간 관리|부자/],
    ['history', /역사|조선|고려|삼국|백제|신라|세계사|한국사|전쟁사|문명/], ['science', /과학|물리|화학|생물|우주|수학|뇌과학|진화|유전/], ['human', /철학|심리|인문|사유|니체|소크라테스/], ['art', /미술|음악|사진|디자인|영화|건축|그림 그리기|드로잉/],
    ['society', /사회|정치|민주주의|법률|헌법|노동|페미니즘/], ['essay', /에세이|산문|수필|산문집/], ['novel', /장편소설|단편소설|소설|시집|연작|추리|미스터리|스릴러|판타지|로맨스|문학/]];
  /* 분류 글 → 큰 분야 번호(없으면 -1) · c는 '종교/역학' 같은 둘째 칸 또는 경로 통째 */
  function bigOfCat(c) { const seg = String(c || '').split(/\s*[>,]\s*/).map((x) => x.trim()).filter((x) => x && !/^(국내도서|외국도서|중고도서|eBook|전자책|음반|DVD|중고샵)$/i.test(x)); if (!seg.length) return -1;
    for (const x of seg.slice(0, 2)) for (let i = 0; i < BIG.length - 1; i++) if (BIG[i][2].test(x)) return i; return -1; }
  /* 작은 분야(표찰) 이름 다듬기 — '기독교(개신교)' → '기독교' · 너무 길면 12자 */
  const smallName = (x) => { const t = String(x || '').replace(/\([^)]*\)?/g, '').replace(/\s+/g, ' ').trim(); return t.length > 12 ? t.slice(0, 12) : t; };
  /* 책 → { k: 큰 분야 열쇠, b: 큰 이름, s: 작은 이름(없으면 ''), g: 짐작했나 } — c2 = 셋째 칸(클라우드) · 없으면 c 경로에서 */
  /* (shop2) cp('종류>분류>…>가장 작은 분류')가 있으면 그것으로 — 국내도서는 둘째 칸이 큰 분야 · 다른 종류는 종류가 큰 분야(책장)이고 그 아래가 표찰 · deep = 표찰을 가장 작은 분류까지(설정 catDepth) */
  function catOf(x, deep) { const P = x && x.cp ? String(x.cp).split('>').map((v) => v.trim()).filter(Boolean) : null;
    if (P && P.length) { const kb = KIND_BIG[P[0]]; if (kb) { const i = BIGK[kb]; let sm = deep ? P.slice(1).join(' › ') : P[1] || ''; sm = deep ? sm.slice(0, 40) : smallName(sm); return { k: kb, b: BIG[i][1], s: sm, g: false }; }
      if (P[0] === '국내도서' && P.length > 1) return catOf0({ ...x, c: P[1], c2: deep ? P.slice(2).join(' › ') : P[2] || null }, deep); }
    return catOf0(x, deep); }
  function catOf0(x, deep) { const c = String((x && x.c) || ''); let i = bigOfCat(c); let g = false; const seg = c.split(/\s*[>,]\s*/).map((v) => v.trim()).filter((v) => v && !/^(국내도서|외국도서|중고도서)$/.test(v));
    let sm = x && x.c2 ? (deep ? String(x.c2).slice(0, 40) : smallName(x.c2)) : seg.length > 1 ? smallName(seg[1]) : '';
    if (i < 0) { const t = ' ' + String((x && x.t) || '') + ' ' + String((x && x.a) || '') + ' '; const G = GUESS.find((q) => q[1].test(t)); i = G ? BIGK[G[0]] : BIGK.etc; g = true; if (!G) sm = ''; else if (!sm && seg.length === 1) sm = ''; }
    if (sm && sm === BIG[i][1]) sm = ''; return { k: BIG[i][0], b: BIG[i][1], s: sm, g }; }
  /* ── 고르기: 설정의 거름(쓸 디자인·무늬·모양·글꼴·색 묶음) 안에서 · 추천 목록이 있으면 4번 중 3번은 그 안에서 */
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const allowed = (c) => ({ D: c.designs && c.designs.length ? c.designs.map(Number) : range(DESIGNS.length), P: c.pats && c.pats.length ? c.pats.map(Number) : range(PATTERNS.length), S: c.shapes && c.shapes.length ? c.shapes.map(Number) : range(SHAPES.length),
    F: (c.fonts && c.fonts.length ? c.fonts : FONTS.map((f) => f.id)).map((id) => FONTS.findIndex((f) => f.id === id) + 1).filter((i) => i > 0), C: ((L) => (L.length ? L : UQ.PAL.map((n) => n - 1)))(UQ.PAL.map((n) => n - 1).filter((i) => (PALS[c.palette] || PALS.mix)(COLORS[i]))) }); /* (shelf7) 새로 정하는 바탕색은 서로 뚜렷한 50색(UQ.PAL)에서만 */
  /* (shelf7) 묶음을 고르게 — 옅은 결 무늬처럼 한 묶음에 여럿 있는 것이 더 자주 뽑히지 않게(묶음 먼저 · 그 안에서 하나) */
  const pickCls = (R, pref, all, G) => { const P = (pref || []).filter((x) => all.includes(x)); if (P.length && R() < 0.75) return P[Math.floor(R() * P.length)]; const L = G.map((g) => g.filter((x) => all.includes(x))).filter((g) => g.length); if (!L.length) return all[Math.floor(R() * all.length)]; const g = L[Math.floor(R() * L.length)]; return g[Math.floor(R() * g.length)]; };
  const RECT = [1, 2, 4, 6, 7, 8]; /* (shelf8) 새로 정할 때 쓰는 몸 = 처음부터 직사각형인 것만(민·둥근 등 그림자·홈 줄·문고판·천 테·반짝이) */
  const bodyOk = (s) => RECT.includes(Math.floor((s - 1) / HEADS.length) + 1);
  const pickShape = (R, pref, all0) => { const all = all0.filter(bodyOk).length ? all0.filter(bodyOk) : all0; const P = (pref || []).filter((x) => all.includes(x)); if (P.length && R() < 0.75) return P[Math.floor(R() * P.length)]; const L = UQ.BG.filter((g) => !g.some((b) => UQ.NOB.includes(b))).map((g) => g.flatMap((b) => UQ.HG.map((hs) => hs.map((h) => (b - 1) * HEADS.length + h).filter((x) => all.includes(x)))).filter((x) => x.length)).filter((g) => g.length);
    if (!L.length) return all[Math.floor(R() * all.length)]; const g = L[Math.floor(R() * L.length)]; const hs = g[Math.floor(R() * g.length)]; return hs[Math.floor(R() * hs.length)]; };
  const pickIn = (R, pref, all) => { const P = (pref || []).filter((x) => all.includes(x)); return P.length && R() < 0.75 ? P[Math.floor(R() * P.length)] : all[Math.floor(R() * all.length)]; };
  /* 책 한 권의 조합 정하기 → { g, src, d, ci, p, fi, s, a, o } (cc = 앞표지 대표색 #rrggbb · 없으면 null) */
  function assign(it, c, cc) { c = c || DEF; const A = allowed(c); const R = rng(hash(((it && it.id) || '') + '|' + (c.seed || 0) + '|' + (c.lookGen || 0)));
    const th = c.themeOn !== false ? themeOf(it) : null; let src = it && it.sp && c.spineImg ? 's' : cc && c.coverColor ? 'c' : th ? 't' : 'r';
    let ci; if (cc && c.coverColor) ci = nearest(cc, A.C); else if (th && (th.fam || th.tone)) { const L = A.C.filter((i) => (!th.fam || th.fam.includes(COLORS[i].fam)) && (!th.tone || th.tone.includes(COLORS[i].t))); ci = (L.length ? L : A.C)[Math.floor(R() * (L.length || A.C.length))]; }
    else ci = A.C[Math.floor(R() * A.C.length)];
    const shp = th && th.shape ? th.shape.flatMap((b) => range(HEADS.length).map((h) => (b - 1) * HEADS.length + h)) : null; let d = pickIn(R, th && th.des, A.D); const p = pickCls(R, th && th.pat, A.P, UQ.PG), s = pickShape(R, shp, A.S);
    /* (shelf4) 글꼴: 앞표지 제목 글꼴 갈래(클라우드 셈 it.fg) → 그 갈래 안에서 · 없으면 제목 낱말·분야(themeOf) · 디자인은 글꼴 갈래와 어울리는 것으로 한 번 더 고름 */
    const fg = it && GENRES[it.fg] ? it.fg : null; const gF = fg ? fontsOfGenre(fg).filter((i) => A.F.includes(i)) : []; const fi = gF.length ? gF[Math.floor(R() * gF.length)] : pickIn(R, th && th.font, A.F);
    { const fgen = FGEN[fi - 1]; const dg = dgenOf(d); if (dg && !DFIT[dg].includes(fgen)) { const ok = A.D.filter((x) => { const g2 = dgenOf(x); return !g2 || DFIT[g2].includes(fgen); }); if (ok.length) d = ok[Math.floor(R() * ok.length)]; } }
    const a = Math.floor(R() * ACCENTS.length); const o = c.orient === 'rand' ? (R() < 0.62 ? 'v' : 'h') : c.orient;
    const KL = UQ.PAL.filter((n) => n !== ci + 1); const k = KL[Math.floor(R() * KL.length)]; /* (shelf7) 곁색 = 바탕과 다른 뚜렷한 색(띠·덮개·금박 자리) */
    return { g: c.lookGen || 0, src, d, ci: ci + 1, p, fi, s, a: a + 1, o, k }; }
  /* (shelf7) 끝에 '.곁색'(COLORS 번호)이 붙을 수 있음 — 없으면 옛 책등(곁색 = 바탕을 짙게·옅게) · 모양 번호는 세 자리까지 */
  const CODE_RE = /^(\d{1,4})\.([scrt])\.(\d{1,2})\.(\d{1,3})\.(\d{1,2})\.(\d{1,2})\.(\d{1,3})\.(\d)\.([vh])(?:\.(\d{1,3}))?$/;
  const encode = (A) => [A.g, A.src, A.d, A.ci, A.p, A.fi, A.s, A.a, A.o].concat(A.k ? [A.k] : []).join('.');
  function decode(code) { const m = CODE_RE.exec(String(code || '')); if (!m) return null; const A = { g: +m[1], src: m[2], d: +m[3], ci: +m[4], p: +m[5], fi: +m[6], s: +m[7], a: +m[8], o: m[9] }; if (m[10]) A.k = +m[10];
    if (!A.d || A.d > DESIGNS.length || !A.ci || A.ci > COLORS.length || !A.p || A.p > PATTERNS.length || !A.fi || A.fi > FONTS.length || !A.s || A.s > SHAPES.length || !A.a || A.a > ACCENTS.length || (m[10] && (!A.k || A.k > COLORS.length))) return null; return A; }
  /* ── 크기: 판형 '가로x세로x두께'(mm · 클라우드 sz) → 키(선반 높이의 %)·두께(px) — (shelf8 · 정범님 11/12 '크기 비율이 실제와 맞게')
   *  · 세로·두께를 같은 자로 잼: 선반 높이 − 24px = 297mm(A4) → 1mm = (rowH − 24) / 297 px · 두께 px = 두께 mm × 그 값 × thickK(1 = 실제)
   *    (전엔 두께를 20~48px 사이로 늘려 그려 보통 책이 실제보다 3배 두꺼워 보였음 — 21mm 책이 30px · 키 126px)
   *  · 두께 mm가 없으면 쪽수(한 쪽 0.06mm + 표지 2mm) · 크기 자체가 없으면 판형을 분야·쪽수로 어림(est — 화면엔 '판형 추정'으로만 알림 · 저장 안 함)
   *  근거: 국내 판형 46판 127×188 · 신국판 152×225 · 크라운판 176×248 · 46배판 188×257 · A4 210×297 */
  const SZ_RE = /^(\d{2,3})x(\d{2,3})(?:x(\d{1,3}))?$/;
  const FMT = { novel: [128, 188], essay: [128, 188], teen: [140, 205], comic: [125, 185], kids: [152, 210], baby: [200, 230], art: [176, 248], cook: [188, 240], travel: [140, 205],
    lang: [188, 257], it: [188, 257], exam: [188, 257], _: [152, 225] };
  const FMT_N = { '128x188': '46판', '125x185': '만화책(46판)', '140x205': '변형 46판', '152x225': '신국판', '152x210': '어린이 단행본', '200x230': '유아 그림책', '230x260': '그림책', '176x248': '크라운판', '188x240': '변형 크라운판', '188x257': '46배판' };
  function fmtGuess(it) { const k = (BIG[bigOfCat(it && it.c)] || [])[0]; const pg = +(it && it.pg) || 0; let f = FMT[k] || FMT._; if (k === 'kids' && pg && pg < 80) f = [230, 260]; const key = f[0] + 'x' + f[1]; return { W: f[0], H: f[1], name: FMT_N[key] || '' }; }
  /* 실제 크기(mm)와 어디서 왔는지 — 화면 글·펼친 책 비율이 함께 씀 · real = 판형 칸이 있음 · dEst = 두께는 쪽수로 셈 · est = 판형도 어림 */
  function dimOf(it) { const m = SZ_RE.exec(String((it && it.sz) || '')); const pg = +(it && it.pg) || 0; const g = m ? null : fmtGuess(it);
    const W = m ? +m[1] : g.W, H = m ? +m[2] : g.H; const D0 = m && m[3] ? +m[3] : 0; const D = D0 || (pg ? Math.round(pg * 0.06 + 2) : 15);
    return { W, H, D, real: !!m, dReal: !!D0, dEst: !D0, est: !m, fmt: g ? g.name : '' }; }
  function sizeOf(it, c) { c = c || DEF; const R = rng(hash(((it && it.id) || '') + '|sz')); const on = c.sizeOn !== false; const d = dimOf(it);
    const pxmm = (c.rowH - 24) / 297; const w = on ? d.D * pxmm * (+c.thickK || 1) : c.wMin + R() * (c.wMax - c.wMin) * 0.4;
    const h = on ? clamp(d.H / 2.97, 30, 100) : clamp((225 + (R() - 0.5) * 2 * (c.hVar / 16) * 35) / 2.97, 50, 100);
    return { w: Math.round(clamp(w, c.wMin, c.wMax) * 10) / 10, h: Math.round(h * 10) / 10, tilt: 0 /* (shelf8 · 정범님 '반듯한 직사각형만') 비스듬히 기댄 책도 없앰 */, real: on && (d.real || !!(it && it.pg)), est: d.est, mm: d }; }
  const glen = (s) => [...String(s || '')].length;
  function textFit(t, a, w, hp) { const W = Math.max(6, w * 0.8), nt = Math.max(1, glen(t)), na = glen(a); const Ht = hp * (na ? 0.66 : 0.86), Ha = hp * 0.22;
    const fit = (n, H, top) => { for (let f = top; f >= 4; f -= 0.5) { const k = Math.floor(W / (f * 1.14)); const per = Math.floor(H / (f * 1.04)); if (k >= 1 && per >= 1 && k * per >= n) return f; } return 4; };
    const ft = fit(nt, Ht, 22); const fa = na ? Math.min(ft * 0.8, fit(na, Ha, 14)) : 0; return { ft, fa }; }
  /* ── (shelf3) 책등 글 자리 — 디자인마다 장식(띠·동그라미·이름표·라벨)이 없는 곳 [위 %, 아래 %, 옆 %] · 글은 이 안에서만(넘치면 화면이 재서 글을 줄이거나 줄 수를 늘림)
   *  정범님 11/11(리드 화면 확인): '장식이 글을 가림' — 장식은 글 뒤 또는 글 없는 자리 */
  /*  배경 위치 %는 '(칸 높이 − 그림 높이) × %'라서 라벨 등은 실제로 그 자리 위쪽에 그려짐 — 그 범위로 셈(예 37 라벨 = 82~93%) */
  const ZONE_D = { 2: [8, 8], 3: [10, 10], 7: [7, 7, 9], 9: [17, 17, 8], 11: [6, 13], 13: [24, 22], 14: [6, 15], 15: [6, 25], 16: [6, 24], 19: [19, 5], 20: [23, 15], 21: [6, 6, 11], 22: [6, 13], 23: [15, 5], 25: [9, 5], 26: [6, 13], 27: [6, 21],
    28: [18, 18], 29: [6, 5, 17], 34: [6, 31], 36: [17, 5], 37: [6, 20], 38: [6, 39], 41: [12, 5], 42: [12, 12], 44: [14, 17, 13], 45: [11, 11], 47: [6, 17], 50: [9, 9],
    51: [6, 5, 9], 52: [31, 5], 53: [6, 27], 54: [6, 40], 55: [29, 5], 56: [15, 5, 9], 57: [6, 12] /* (shelf7) */ };
  const C2T = [4, 5, 6, 8, 12, 13, 17, 18, 23, 30, 31, 34, 40, 43, 46, 51, 56]; /* (shelf7) 곁색 칸이 글 자리에 걸치는 디자인 */
  const zoneOf = (d) => { const z = ZONE_D[d] || []; return { zt: z[0] || 6, zb: z[1] || 5, zs: z[2] || 6 }; };
  /* 책등 하나의 모든 것(화면이 쓰는 꼴) — A(조합)는 저장된 것 또는 assign() 결과 */
  function dress(it, A, c) { c = c || DEF; const z = sizeOf(it, c); const col = COLORS[A.ci - 1]; const base = col.hex; const R = rng(hash(((it && it.id) || '') + '|ink'));
    const kc = A.k && COLORS[A.k - 1] ? COLORS[A.k - 1].hex : null; /* (shelf7) 곁색이 정해진 책등 — 띠·덮개(--c2), 장식색만 쓰는 디자인은 장식(--g)도 곁색 */
    const c2 = kc || (lum(base) > 0.4 ? shade(base, -0.28) : shade(base, 0.32)); const k = A.d === 9 || A.d === 44 ? '#1b1712' : inkFor(base, R());
    const g = kc && UQ.GONLY.includes(A.d) ? kc : ['#d9b45a', '#cfd3d8', lum(base) > 0.35 ? '#1b1712' : '#f4efe4', lum(base) > 0.4 ? shade(base, -0.45) : shade(base, 0.55)][A.a - 1]; const f = FONTS[A.fi - 1];
    const skH = (c.rowH - 24) * z.h / 100; const T = textFit(it && it.t, it && it.a, z.w, skH);
    /* (shelf4 · 정범님 11/12 '일률적·붕 뜬 느낌') 제목 맵시 tk: 금박(g) · 먹(i) · 흰 글씨(w) · 글 상자 띠(tp — 밋밋한 디자인에서만 · 띠색과 글자 대비 4.5 넘을 때) */
    let tk = k === '#f1d488' || (A.a === 1 && A.d !== 9 && A.d !== 44 && lum(base) < 0.18 && contrast(base, '#e8c66a') >= 4.5) ? 'g' : lum(k) < 0.2 ? 'i' : 'w'; let kk = tk === 'g' ? (k === '#f1d488' ? k : '#e8c66a') : k;
    const plain = [1, 4, 5, 6, 30, 31, 32, 33, 40].includes(A.d); const pc = lum(kk) > 0.5 ? shade(base, -0.42) : shade(base, 0.5); let tp = plain && A.d !== 9 && A.d !== 44 && R() < 0.45 && contrast(pc, kk) >= 4.5 ? pc : null;
    /* 바탕과 글자 대비가 6 아래(중간 밝기 바탕 · 가는 글꼴이면 흐려 보임 — 리드 화면 '길의 끝에서')면 어느 디자인이든 글 상자 띠로 대비 7 넘게 */
    const paper = A.d === 9 || A.d === 44; /* 문고판·흰 창 = 글이 흰 종이 위 — 대비 손질 안 함 */ const need = paper ? 0 : THIN.includes(f.id) || f.wt <= 300 ? 6.5 : 4.5; /* 가는 글꼴은 더 높은 대비 */
    if (!paper && !tp && contrast(base, kk) < need + 1 && tk !== 'g') { const pure = contrast(base, '#0d0b09') >= contrast(base, '#ffffff') ? '#0d0b09' : '#ffffff'; if (contrast(base, pure) > contrast(base, kk)) kk = pure; } /* 먼저 아주 짙은 먹·흰 글씨로 */
    if (!tp && contrast(base, kk) < need) { const want = lum(kk) > 0.5 ? [shade(base, -0.6), '#1d1a16'] : [shade(base, 0.7), '#f6efdf']; tp = want.find((x) => contrast(x, kk) >= 7) || want[1]; }
    /* (shelf7) 곁색이 뚜렷한 색이라 글 자리를 덮는 디자인(위·아래 큰 덮개·반반·대각·가운데 띠)에서는 글자가 바탕과 곁색 둘 다에서 읽혀야 함 — 둘 다 되는 먹·흰 글씨로 · 안 되면 글 상자 띠 */
    if (kc && !paper && C2T.includes(A.d)) { const ok2 = (x) => contrast(base, x) >= Math.min(need, 4.5) && contrast(kc, x) >= 3.2; if (!ok2(kk)) { const alt = ['#0d0b09', '#ffffff', '#1b1712', '#fbf7ee'].find(ok2); if (alt) { kk = alt; tk = lum(alt) < 0.2 ? 'i' : 'w'; } else if (!tp) tp = lum(kk) > 0.5 ? '#1d1a16' : '#f6efdf'; } }
    const sh = shapeOf(A.s); return { tk, tp, thin: THIN.includes(f.id) ? 1 : 0, code: encode(A), src: A.src, g: A.g, d: A.d, ci: A.ci, kx: A.k || 0, p: A.p, s: A.s, body: sh.body, head: sh.head, a: A.a, o: A.o, f: f.id, fw: f.wt, fg: FGEN[A.fi - 1] || 'go', c: base, c2, k: kk, ac: g, w: z.w, h: z.h, tilt: z.tilt, ft: T.ft, fa: T.fa, real: z.real, ...zoneOf(A.d) }; }
  /* 옛 부름(look) 그대로 — 저장된 조합이 없을 때 새로 정함 */
  function look(it, c, cc) { c = c || DEF; return dress(it, assign(it, c, cc || (it && it.cc) || null), c); }
  /* 조합 수 — 실제로 만든 목록 길이를 곱함(정범님 11/11: 1억 넘게) */
  /* (shelf7) uq = 겉으로 뚜렷한 고유 모양 수(디자인 묶음 × 색 짝 × 무늬 묶음 × 모양 묶음 · 클라우드 cloud/shop-uniq.js space()와 같은 셈 — 시험이 견줌) · 옛 칸(D·C·P·F·S·core·total)은 목록 길이 곱 그대로 */
  function combos() { const D = DESIGNS.length, C = COLORS.length, P = PATTERNS.length, F = FONTS.length, S = SHAPES.length, A = ACCENTS.length, O = 2; return { D, C, P, F, S, A, O, core: D * C * P * F * S, total: D * C * P * F * S * A * O, uq: uqCount() }; }
  const zClass = (d) => { const f = (v, E) => E.filter((e) => v >= e).length; return d ? f(d.H, UQ.ZH) * (UQ.ZD.length + 1) + f(d.D, UQ.ZD) : 0; }; /* (shelf8) 크기 묶음 번호 0~35 */
  function uqCount() { const n = UQ.PAL.length; let dc = 0, ds = 0; for (const g of UQ.DG) { const sec = g.some((d) => !UQ.NOSEC.includes(d)); dc += sec ? n * (n - 1) : n; if (sec) ds++; }
    const B = UQ.BG.filter((g) => !g.some((b) => UQ.NOB.includes(b))).length; const N = dc * UQ.PG.length * B * UQ.HG.length; const Z = (UQ.ZH.length + 1) * (UQ.ZD.length + 1); return { D: UQ.DG.length, Dsec: ds, C: n, pairs: n * (n - 1), P: UQ.PG.length, B, H: UQ.HG.length, S: B * UQ.HG.length, N, Z, Nall: N * Z }; } /* (shelf8) N = 장부가 겹침 0을 지키는 조합(크기와 상관없이) · Nall = 거기에 실제 크기 묶음까지 곱한 겉모습 수 */
  /* ── 한글 첫소리 · 상품명 묶음 */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; const CHO1 = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
  const initial = (t) => { const s = String(t || '').replace(/^[\s"'(\[{<〈《「『【]+/, ''); const ch = s.charCodeAt(0); if (ch >= 0xac00 && ch <= 0xd7a3) { const c = CHO[Math.floor((ch - 0xac00) / 588)]; return CHO1[c] || c; } if (/[a-z]/i.test(s[0] || '')) return 'A–Z'; if (/[0-9]/.test(s[0] || '')) return '숫자'; if (/[ㄱ-ㅎ]/.test(s[0] || '')) return CHO1[s[0]] || s[0]; return '기호·그 밖'; };
  const ORDER_INIT = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ', 'A–Z', '숫자', '기호·그 밖'];
  /* (shop2 · 정범님 11/13 '상품명은 철자로') 글자 묶음 — cho: 첫소리 14 + A–Z 한 묶음 · az: 영문은 글자마다 · wide: 크게 다섯 + 영문 + 숫자·기호 */
  const WIDE = { ㄱ: 'ㄱ~ㄷ', ㄴ: 'ㄱ~ㄷ', ㄷ: 'ㄱ~ㄷ', ㄹ: 'ㄹ~ㅂ', ㅁ: 'ㄹ~ㅂ', ㅂ: 'ㄹ~ㅂ', ㅅ: 'ㅅ~ㅇ', ㅇ: 'ㅅ~ㅇ', ㅈ: 'ㅈ~ㅊ', ㅊ: 'ㅈ~ㅊ', ㅋ: 'ㅋ~ㅎ', ㅌ: 'ㅋ~ㅎ', ㅍ: 'ㅋ~ㅎ', ㅎ: 'ㅋ~ㅎ', 'A–Z': 'A–Z', 숫자: '숫자·기호', '기호·그 밖': '숫자·기호' };
  const AZ = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const titleKey = (t, mode) => { const k = initial(t); if (mode === 'wide') return WIDE[k] || '숫자·기호'; if (mode === 'az' && k === 'A–Z') { const s = String(t || '').replace(/^[\s"'(\[{<〈《「『【]+/, ''); return (s[0] || 'A').toUpperCase(); } return k; };
  const titleOrder = (mode) => (mode === 'wide' ? ['ㄱ~ㄷ', 'ㄹ~ㅂ', 'ㅅ~ㅇ', 'ㅈ~ㅊ', 'ㅋ~ㅎ', 'A–Z', '숫자·기호'] : mode === 'az' ? [...ORDER_INIT.slice(0, 14), ...AZ, '숫자', '기호·그 밖'] : ORDER_INIT);
  const KO = typeof Intl !== 'undefined' && Intl.Collator ? new Intl.Collator('ko', { numeric: true, sensitivity: 'base' }) : { compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0) };
  const bandsOf = (s) => [...new Set(String(s || '').split(/[,\s]+/).map((x) => Math.round(+x)).filter((x) => x > 0))].sort((a, b) => a - b).slice(0, 12);
  const wonS = (n) => (n >= 10000 ? (n % 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') : n / 10000) + '만' : n >= 1000 ? n / 1000 + '천' : n) + '원';
  /* (shop2) style 'dae' = 「1천원대」(경계 아래 칸은 「1천원 아래」 · 마지막 칸은 「5만원 이상」) · 없거나 'range' = 옛 「5천원~1만원」 */
  const bandName = (B, p, style) => { let i = 0; while (i < B.length && p >= B[i]) i++; if (style === 'dae') return [i, i === 0 ? wonS(B[0]) + ' 아래' : i === B.length ? wonS(B[B.length - 1]) + ' 이상' : wonS(B[i - 1]).replace(/원$/, '원대')];
    return [i, i === 0 ? wonS(B[0]) + ' 아래' : i === B.length ? wonS(B[B.length - 1]) + ' 넘게' : wonS(B[i - 1]) + '~' + wonS(B[i])]; };
  /* (shop2) 가격대 칸의 실제 범위 글(링크 풀이용) — 「5,000~9,999원」 */
  const bandRange = (B, i) => { const f = (n) => n.toLocaleString('ko-KR'); return i === 0 ? f(B[0] - 1) + '원까지' : i === B.length ? f(B[B.length - 1]) + '원부터' : f(B[i - 1]) + '~' + f(B[i] - 1) + '원'; };
  const GW = { 최상: 3, 상: 2, 중: 1, 하: 0 };
  /* 추천 점수: 정범님 추천(맨 앞) → 많이 팔리는 책 + 정가보다 많이 쌈 + 좋은 등급 + 새로 들어옴 (근거: 알라딘 중고 '추천' = 판매·할인·상태를 함께 봄 — 무게는 근거 없음 → 설정의 추천 책으로 손봄) */
  function recScore(x, now) { const off = x.lp > 0 && x.p > 0 && x.p < x.lp ? 1 - x.p / x.lp : 0; const sr = x.sr ? 1 / Math.log2(1 + x.sr) : 0; const age = x.at ? (now - Date.parse(x.at)) / 864e5 : 365; return sr * 3 + off * 2 + (GW[x.g] || 0) * 0.35 + (age < 14 ? 0.6 : age < 60 ? 0.25 : 0); }
  const regCmp = (dir) => (a, b) => (dir === 'old' ? 1 : -1) * (String(a.at || '').localeCompare(String(b.at || '')) || (a._o || 0) - (b._o || 0));
  function cmpOf(key, c, now) { if (key === 'title') return (a, b) => KO.compare(a.t || '', b.t || '');
    if (key === 'price') return (a, b) => a.p - b.p || KO.compare(a.t || '', b.t || ''); if (key === 'sales') return (a, b) => (a.sr || 1e9) - (b.sr || 1e9) || regCmp('new')(a, b);
    if (key === 'rec') return (a, b) => b._rs - a._rs || regCmp('new')(a, b); return regCmp(c.regDir); }
  /* ── 책장 묶음 짜기: 정렬 → 무리(분야·첫소리·가격대 · 없으면 하나) → 책장(수용 cap)마다 자리(slots: 책 또는 표찰 {lab})
   *  pack: 작은 무리는 앞 책장의 남은 자리에 표찰을 세워 이어 꽂음(실제 서점처럼) · 큰 무리는 cap마다 나눠 '문학 2/3' */
  /* (shop2 · 정범님 11/13) 수량 q가 2 넘는 상품 — qtyMode 'all'이면 같은 책을 수량만큼(최대 qtyMax) 나란히 꽂음(사본 _dup = 2,3… · 같은 상품 번호) · 'one'이면 한 권(화면이 ×수량 표시) */
  function qtyOut(L, c) { if (!c || c.qtyMode !== 'all') return L; const out = []; for (const x of L) { const q = Math.min(Math.max(1, Math.floor(+x.q || 1)), c.qtyMax || 10); out.push(x); for (let k = 2; k <= q; k++) out.push({ ...x, _dup: k, _dq: q }); } return out; }
  /* (shop2) 🔖 구역 바로 가기 목록 — plan 결과의 표찰에서 무리마다 첫 자리 [{ k, name, ci(책장 번호), n(권), lv 0 큰 · 1 작은 주제, tip }] · 설정이 끄거나 이 정렬이 아니면 빈 목록 */
  function jumps(P, c) { c = c || DEF; if (!P || !c.jumpOn || !(c.jumpSorts || []).includes(P.key)) return []; const out = [], M = new Map(); const sub = c.jumpCat === 'small' && (P.key === 'cat' || P.key === 'pv');
    P.cases.forEach((cs, ci) => cs.slots.forEach((s) => { if (!s.lab || s.gi == null) return; const k = 'g' + s.gi; let J = M.get(k); if (!J) { J = { k, name: s.g, ci, n: 0, lv: 0, ...(s.tip ? { tip: s.tip } : {}) }; M.set(k, J); out.push(J); } J.n += s.n || 0;
      if (sub && s.sm != null) { const k2 = k + '|' + s.sm; let J2 = M.get(k2); if (!J2) { J2 = { k: k2, name: s.sm || '그 밖', ci, n: 0, lv: 1, up: k }; M.set(k2, J2); out.push(J2); } J2.n += s.n || 0; } }));
    if (sub) { const L = []; for (const J of out.filter((x) => !x.lv)) { L.push(J); const S = out.filter((x) => x.up === J.k); if (S.length > 1 || (S.length === 1 && S[0].name !== '그 밖')) L.push(...S); } return L; } return out; }
  /* 표찰의 링크 열쇠(화면 data-jk · data-jk2) */
  const jumpKeys = (s) => (s && s.gi != null ? ['g' + s.gi, s.sm != null ? 'g' + s.gi + '|' + s.sm : ''] : ['', '']);
  function plan(items, c, key, now) { c = c || DEF; now = now || Date.now(); key = SORTS.some((s) => s[0] === key) ? key : c.sort0; const key0 = key; const L = qtyOut((items || []).filter((x) => x && x.id && (key0 !== 'pv' || x.pv)), c); if (key === 'pv') key = 'cat'; /* (shelf8) 샘플 있는 책 = 샘플 모은 책만 주제 분류로 */
    const picks = String(c.picks || '').split(/[\s,]+/).map((x) => x.trim()).filter(Boolean); const P = new Map(picks.map((id, i) => [id, i]));
    if (key === 'rec') for (const x of L) x._rs = P.has(x.id) ? 1e6 - P.get(x.id) : recScore(x, now);
    let groups;
    if (key === 'cat') { const M = new Map(); for (const x of L) { const k = catOf(x, c.catDepth === 'deep'); x._k = k; if (!M.has(k.k)) M.set(k.k, { key: k.k, name: k.b, xs: [] }); M.get(k.k).xs.push(x); } const ic = cmpOf(c.inner === 'reg' ? 'reg' : c.inner, c, now);
      const first = String(c.catFirst || '').split(/[,，]/).map((v) => v.trim()).filter(Boolean); const fi = (g) => { const i = first.findIndex((v) => v === g.name || v === g.key); return i < 0 ? 99 : i; };
      const salesOf = (g) => g.xs.reduce((a, x) => a + (x.sr ? 1 / Math.log2(1 + x.sr) : 0), 0);
      groups = [...M.values()]; for (const g of groups) { const SM = new Map(); for (const x of g.xs) { const k = x._k.s || ''; if (!SM.has(k)) SM.set(k, []); SM.get(k).push(x); }
        const subs = [...SM].sort((a, b) => (a[0] === '') - (b[0] === '') || b[1].length - a[1].length || KO.compare(a[0], b[0])); g.xs = subs.flatMap(([k, xs]) => xs.sort(ic)); g.subs = subs.map(([k, xs]) => [k, xs.length]); }
      const ord = c.catOrder === 'name' ? (a, b) => KO.compare(a.name, b.name) : c.catOrder === 'n' ? (a, b) => b.xs.length - a.xs.length : c.catOrder === 'sales' ? (a, b) => salesOf(b) - salesOf(a) || b.xs.length - a.xs.length : (a, b) => BIGK[a.key] - BIGK[b.key];
      groups.sort((a, b) => (a.key === 'etc') - (b.key === 'etc') || fi(a) - fi(b) || ord(a, b) || KO.compare(a.name, b.name)); }
    else if (key === 'title') { const M = new Map(); for (const x of L.slice().sort(cmpOf('title'))) { const g = titleKey(x.t, c.titleGroup); if (!M.has(g)) M.set(g, []); M.get(g).push(x); } groups = titleOrder(c.titleGroup).filter((g) => M.has(g)).map((g) => ({ name: g, xs: M.get(g) })); }
    else if (key === 'price') { const B = bandsOf(c.bands).length ? bandsOf(c.bands) : bandsOf(DEF.bands); const M = new Map(); for (const x of L.slice().sort(cmpOf('price'))) { const [i, nm] = bandName(B, x.p, c.bandStyle); if (!M.has(i)) M.set(i, { name: nm, xs: [], tip: bandRange(B, i) }); M.get(i).xs.push(x); } groups = [...M.keys()].sort((a, b) => a - b).map((i) => M.get(i)); }
    else { const nm = { reg: c.regDir === 'old' ? '먼저 들어온 차례' : '새로 들어온 차례', sales: '많이 팔리는 차례', rec: '추천 차례' }[key]; groups = [{ name: nm, xs: L.slice().sort(cmpOf(key, c, now)), seq: 1 }]; }
    const cap = c.cap; const cases = []; let cur = null; const open = () => { cur = { slots: [], groups: [], n: 0 }; cases.push(cur); };
    groups.forEach((g, gi) => { g.gi = gi; }); /* (shop2) 표찰마다 무리 번호(gi)·이름(g) — 구역 바로 가기 링크가 그 첫 자리를 찾음 */
    for (const g of groups) { const parts = Math.ceil(g.xs.length / cap) || 1;
      if (g.seq) { for (let i = 0; i < parts; i++) { open(); const xs = g.xs.slice(i * cap, (i + 1) * cap); cur.slots = xs; cur.n = xs.length; cur.groups.push({ name: g.name, from: i * cap + 1, to: i * cap + xs.length, of: g.xs.length }); cur.name = g.name; cur.sub = `${(i * cap + 1).toLocaleString('ko-KR')}~${(i * cap + xs.length).toLocaleString('ko-KR')}번째`; } cur = null; continue; }
      const labsOf = (xs, head) => { if (!g.subs) return [{ lab: head, n: xs.length, g: g.name, gi: g.gi, ...(g.tip ? { tip: g.tip } : {}) }, ...xs]; const out = []; let k = null, at = -1; xs.forEach((x) => { const sk = (x._k && x._k.s) || ''; if (sk !== k) { k = sk; at = out.length; out.push({ lab: out.length ? (sk || '그 밖') : (sk ? g.name + ' › ' + sk : head), n: 0, big: g.name, sm: sk, g: g.name, gi: g.gi }); } out[at].n++; out.push(x); }); return out; };
      if (c.pack && cur && g.xs.length <= cap - cur.n && cur.n > 0) { cur.slots.push(...labsOf(g.xs, g.name)); cur.n += g.xs.length; cur.groups.push({ name: g.name, n: g.xs.length }); continue; }
      for (let i = 0; i < parts; i++) { open(); const xs = g.xs.slice(i * cap, (i + 1) * cap); cur.slots.push(...labsOf(xs, parts > 1 ? `${g.name} ${i + 1}/${parts}` : g.name)); cur.n = xs.length; cur.groups.push({ name: g.name, part: parts > 1 ? i + 1 : 0, parts, n: xs.length }); }
      if (!c.pack) cur = null; }
    for (const cs of cases) if (!cs.name) { const g = cs.groups; cs.name = g[0].part ? `${g[0].name} ${g[0].part}/${g[0].parts}` : g[0].name; const sm = [...new Set(cs.slots.filter((x) => x.lab && x.sm && x.big === g[0].name).map((x) => x.sm))];
      cs.sub = [sm.length ? sm.slice(0, 2).join(' · ') + (sm.length > 2 ? ` 외 ${sm.length - 2}` : '') : '', g.length > 1 ? `+ ${g.slice(1, 3).map((v) => v.name).join(' · ')}${g.length > 3 ? ` 외 ${g.length - 3}분야` : ''}` : ''].filter(Boolean).join(' '); }
    return { key: key0, cases, n: L.length }; }
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
  /* 나침반 이름: 지금 책장이 북쪽일 때 i번 책장의 방위(4개면 북·동·남·서 — (shelf3 · 정범님 11/12: 도는 방향을 뒤집음) 다음 책장이 동쪽(오른쪽) → 오른쪽 화살표·] ·왼쪽으로 쓸기로 다가옴) */
  function compass(i, cur, N) { const a = mod((cur - i) * (360 / N), 360); const D = ['북', '북서', '서', '남서', '남', '남동', '동', '북동']; let k = Math.round(a / 45) % 8; if (k === 0 && a > 0.01) k = a > 180 ? 7 : 1; /* 책장이 많아도 옆 책장이 '북'으로 안 나오게 */ return D[k]; }
  /* ── (shelf3) 할인가·배지 — 우리숍 손님 화면(shop-core saleOf·BADGE)과 같은 뜻 · 서가 책장 칸에도 */
  const BADGE = { sale: '할인', new: 'NEW', pick: '추천', rare: '희귀', last: '마지막 1권', hot: '인기' };
  const saleOf = (x) => { if (x && x.p0 > x.p && x.p > 0) return { pct: Math.round((1 - x.p / x.p0) * 100), from: 'p0', was: x.p0 }; return x && x.lp > 0 && x.p > 0 && x.p < x.lp ? { pct: Math.round((1 - x.p / x.lp) * 100), from: 'lp', was: x.lp } : null; };
  const tagOf = (x) => { const o = saleOf(x); if (o && o.from === 'p0') return { k: 'sale', t: '−' + o.pct + '%' }; const b = (x && x.bd || []).find((k) => BADGE[k] && k !== 'sale'); return b ? { k: b, t: b === 'last' ? '1권' : BADGE[b] } : null; };
  /* ── 찜 목록(이 기기) */
  const wishHas = (w, id) => (w || []).some((x) => x && x.id === id);
  const wishToggle = (w, it, max) => { const L = (w || []).filter((x) => x && x.id); if (wishHas(L, it.id)) return { wish: L.filter((x) => x.id !== it.id), on: false }; const n = [{ id: it.id, t: it.t, a: it.a || null, p: +it.p || 0, g: it.g || null, im: it.im || null, at: new Date().toISOString() }, ...L].slice(0, max || 300); return { wish: n, on: true }; };
  /* ── 받은 줄(cols + rows) → 책 · 그림 주소 앞부분 되살림 */
  /* (shelf4) 클라우드가 앞표지를 미리 셈한 칸 cv = 'rrggbb' 또는 'rrggbb.갈래' (예 '8a2b1c.my') · 'x' = 셈했는데 쓸 만한 색 없음 */
  const cvOf = (v) => { const m = /^([0-9a-f]{6})(?:\.([a-z]{2}))?$/.exec(String(v || '')); return m ? { cc: '#' + m[1], fg: GENRES[m[2]] ? m[2] : null, cv: 1 } : v === 'x' ? { cv: 1 } : {}; };
  function unpack(J) { const C = J.cols || []; const pre = J.pre || []; const ix = Object.fromEntries(C.map((k, i) => [k, i])); const U = (u) => (typeof u === 'string' && u[0] === '~' ? (pre[+u[1]] || '') + u.slice(2) : u || null);
    return (J.rows || []).map((r, o) => ({ id: String(r[ix.id]), t: r[ix.t] || '', a: r[ix.a] || null, c: r[ix.c] || null, p: +r[ix.p] || 0, lp: +r[ix.lp] || 0, g: r[ix.g] || null, at: r[ix.at] || null, im: U(r[ix.im]), sp: U(r[ix.sp]), bk: U(r[ix.bk]), st: r[ix.st] || 's', sr: +r[ix.sr] || 0, pg: +r[ix.pg] || 0, pb: r[ix.pb] || null, sz: ix.sz != null ? r[ix.sz] || null : null, lk: ix.lk != null ? r[ix.lk] || null : null, c2: ix.c2 != null ? r[ix.c2] || null : null, p0: ix.p0 != null ? +r[ix.p0] || 0 : 0, bd: ix.bd != null && Array.isArray(r[ix.bd]) ? r[ix.bd] : null, pv: ix.pv != null ? +r[ix.pv] || 0 : 0, q: ix.q != null ? Math.max(1, +r[ix.q] || 1) : 1, /* (shop2) 수량 */ cp: ix.cp != null ? r[ix.cp] || null : null, /* (shop2) 종류>분류 경로 */ rv: ix.rv != null && Array.isArray(r[ix.rv]) && r[ix.rv][1] > 0 ? r[ix.rv] : null, /* (shelf8) 손님 별점 [평균, 수] */ ...cvOf(ix.cv != null ? r[ix.cv] : null), _o: o })); } /* (shelf8) pv = 앞 몇 쪽 샘플이 있음(1) */
  /* ── 시범 자료(#/shelf?demo=N) — 실제 자료가 없을 때 보기·시험용 · 손님·상품 정보 아님 */
  const DW = ['바다', '별', '시간', '고양이', '여름', '도시', '숲', '편지', '기억', '노래', '정원', '바람', '겨울', '사람', '빛', '밤', '길', '섬', '꿈', '집', '창문', '나무', '강', '모래', '구름', '불꽃', '종이', '시계', '거울', '여행'];
  const DT = ['의 끝에서', '을 걷는 법', ' 이야기', '과 나', '의 문법', ' 산책', '이 오는 소리', '의 역사', ' 수업', '을 위한 변명', ' 일기', '에게', ' 안내서', '의 모든 것', ''];
  const DC = ['소설/시/희곡', '에세이', '인문학', '역사', '과학', '경제경영', '자기계발', '어린이', '만화', '예술/대중문화', '사회과학', '종교/역학', '요리/살림', '여행', '외국어', '컴퓨터/모바일', '건강/취미', '청소년', '유아', '수험서/자격증'];
  const DS = { '소설/시/희곡': ['한국소설', '외국소설', '추리소설', '시'], '에세이': ['한국에세이', '여행에세이'], '인문학': ['철학', '심리학'], '역사': ['한국사', '세계사'], '종교/역학': ['기독교(개신교)', '불교', '천주교'], '어린이': ['그림책', '동화'], '경제경영': ['투자', '마케팅'] };
  const DA = ['지은이 가', '지은이 나', '지은이 다', '지은이 라', '지은이 마', '지은이 바', '지은이 사', '지은이 아', '글쓴이 갑', '글쓴이 을', 'A. Writer', 'B. Author', '옮긴이 하나', '엮은이 둘', '그린이 셋']; /* 지어낸 이름(실제 사람 아님) */
  function demoItems(n, seed) { const R = rng(hash('demo' + (seed || 7))); const out = []; const day0 = Date.parse('2026-08-01');
    for (let i = 0; i < n; i++) { const w = DW[Math.floor(R() * DW.length)]; const t = (R() < 0.12 ? 'The ' + ['Sea', 'Star', 'Garden', 'Night', 'Road'][Math.floor(R() * 5)] : w + DT[Math.floor(R() * DT.length)]) + (R() < 0.15 ? ' ' + (1 + Math.floor(R() * 3)) : '');
      const lp = (8 + Math.floor(R() * 30)) * 1000; const p = Math.max(1000, Math.round(lp * (0.2 + R() * 0.6) / 100) * 100); const ci = Math.floor(Math.pow(R(), 1.7) * DC.length); const sale = R() < 0.12;
      const sub = DS[DC[ci]]; const c2 = sub ? sub[Math.floor(R() * sub.length)] : null; const noC = R() < 0.05;
      out.push({ id: 'demo' + i, t, a: DA[Math.floor(R() * DA.length)], c: noC ? null : DC[ci], c2: noC ? null : c2, p, lp, g: ['최상', '상', '상', '중', '하'][Math.floor(R() * 5)], at: new Date(day0 + Math.floor(R() * 100) * 864e5).toISOString().slice(0, 10), im: null, sp: null, bk: null, st: R() < 0.03 ? 'o' : 's', sr: R() < 0.7 ? 1 + Math.floor(R() * n) : 0, pg: 80 + Math.floor(R() * 600), pb: '시범출판', p0: sale ? Math.round(p / (0.7 + R() * 0.2) / 100) * 100 : 0, bd: sale ? ['sale'] : R() < 0.05 ? ['new'] : R() < 0.03 ? ['pick'] : null, sz: R() < 0.7 ? ['127x188', '128x188', '140x210', '145x210', '152x225', '153x224', '170x230', '176x248', '188x257', '210x297', '110x175'][Math.floor(R() * 11)] + 'x' + (6 + Math.floor(R() * 40)) : null, _o: i }); }
    return out; }
  /* ── 글꼴: 책장 하나에 쓰인 글자만 받는 주소(Google Fonts text= — 한 글꼴 수십 KB) */
  const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
  /* 같은 글꼴 집안의 다른 굵기는 받는 주소가 달라 별칭도 따로(bqf-별칭) */
  /* (shelf5) 우리 클라우드 글꼴(bq) — CSS를 받지 않고 바로 만듦(@font-face 하나 · 글자는 정렬·겹침 뺌 → 같은 책장이면 같은 주소라 캐시가 맞음) */
  const FONT_API = 'https://readnow-cloud-63884079760.asia-northeast3.run.app';
  const fontText = (text) => [...new Set(String(text || ''))].sort().join('').slice(0, 900);
  const fontCss = (id, text, alias, api) => { const f = fontById(id); if (!f.bq) return null; const t = fontText(text); if (!t) return null;
    /* (11/12 verify1) 둘째 주소 = 같은 글꼴(r=1 · 서버는 r을 안 봄) — 첫 요청이 클라우드 앞문 'Rate exceeded'(429)로 거절되면 브라우저가 둘째 주소로 한 번 더 받음(11/12 09:47 휴대폰 서가에서 /shop/font 429 1건) */
    const u = `${String(api || FONT_API).replace(/\/+$/, '')}/shop/font?f=${encodeURIComponent(f.id)}&t=${encodeURIComponent(t)}`;
    return `@font-face{font-family:'${String(alias || f.id).replace(/['\\]/g, '')}';src:url(${u}) format('woff2'),url(${u}&r=1) format('woff2');font-weight:${f.wt};font-style:normal;font-display:swap}`; };
  /* (shelf7) 우리 클라우드 글꼴 주소·굵기 — 손님 화면이 FontFace로 직접 받아 429면 기다렸다 다시 받음(fontCss와 같은 주소) */
  const fontSrc = (id, text, api) => { const f = fontById(id); if (!f.bq) return null; const t = fontText(text); if (!t) return null; return { url: `${String(api || FONT_API).replace(/\/+$/, '')}/shop/font?f=${encodeURIComponent(f.id)}&t=${encodeURIComponent(t)}`, wt: f.wt }; };
  const fontUrl = (id, text) => { const f = fontById(id); return 'https://fonts.googleapis.com/css2?family=' + f.name.replace(/ /g, '+') + (f.ax ? ':' + f.ax : '') + '&display=swap&text=' + encodeURIComponent([...new Set(String(text || ''))].sort().join('').slice(0, 900)); };
  /* 설정 미리 보기 주소(관리 화면 → 손님 화면 #/shelf?cfg=… · 저장 안 하고 그 화면만) */
  const b64e = (s) => { try { return (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } };
  const b64d = (s) => { try { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); } catch (e) { return ''; } };
  const previewArg = (c) => b64e(JSON.stringify(cfgDiff(c)));
  const previewCfg = (arg) => { try { return JSON.parse(b64d(arg)) || {}; } catch (e) { return {}; } };
  return { fontCss, fontSrc, fontText, FONT_API, callNo, FGEN, GENRES, fontsOfGenre, dgenOf, auName, cvOf, dimOf, fmtGuess, zClass, BIG, GUESS, catOf, bigOfCat, smallName, zoneOf, BADGE, saleOf, tagOf, VER: '0.3.4', qtyOut, jumps, jumpKeys, titleKey, titleOrder, bandRange, UQ, pickCls, pickShape, FONTS, DESIGNS, PATTERNS, SHAPES, BODIES, HEADS, shapeOf, ACCENTS, COLORS, FAMS, PALETTES, CASES, CART_ANIMS, WISH_ANIMS, SORTS, SCHEMA, DEF, cfgOf, cfgDiff, hash, rng, lum, contrast, inkFor, shade, cdist, nearest, dominant, themeOf, assign, encode, decode, CODE_RE, sizeOf, textFit, dress, look, combos, initial, bandsOf, bandName, recScore, plan, bays, split, ring, mod, compass, wishHas, wishToggle, unpack, demoItems, fontById, fontUrl, previewArg, previewCfg };
});
