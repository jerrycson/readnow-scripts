/* 👑 북스퀸 로고 시안(11/13 shoplogo1 · 정범님 11/13 20:12 「로고 10개 시안 · 설정에서 바꿔 헤더에」) — 순수 셈 · 브라우저(window.BQB)·node 시험 함께
 *  설정 값: app_settings/shop.brandLogo = 'q01'~'q10' · 빈 값('')·모르는 값 = 지금 글자 로고(♛북스퀸) 그대로
 *  파일: shop/brand/<id>.svg(밝은 바탕) · <id>-dark.svg(어두운 바탕 = 숍 머리띠 남색) · <id>-icon.svg(정사각 512 · 파비콘·앱 아이콘)
 *  글자는 모두 윤곽선(OFL 글꼴에서 바꿈) — 손님 기기 글꼴과 상관없이 똑같이 보임 · 목록은 logos.json과 같아야 함(tBRAND1113이 지킴) */
(function (root) {
  'use strict';
  // [id, 이름, 가로형 너비÷높이]
  const LIST = [
    ['q01', '왕관 책', 2.859],
    ['q02', 'BQ 모노그램', 4.405],
    ['q03', '장서표(엑스리브리스)', 4.497],
    ['q04', '현대 글자로고', 3.635],
    ['q05', '붓글씨와 낙관', 3.168],
    ['q06', '책등 왕관', 2.729],
    ['q07', '체스 퀸', 4.047],
    ['q08', '책갈피 리본', 3.226],
    ['q09', '한글 북스퀸', 3.153],
    ['q10', '미니멀 기하', 4.431],
  ];
  const IDS = LIST.map((x) => x[0]);
  const of = (v) => { const s = String(v == null ? '' : v).trim().toLowerCase(); return IDS.includes(s) ? s : ''; };
  const info = (v) => { const id = of(v); const x = LIST.find((y) => y[0] === id); return x ? { id: x[0], name: x[1], ratio: x[2] } : null; };
  // kind: 'light' | 'dark' | 'icon' · base = 'brand/'(손님 화면) 또는 'https://booksqueen.com/brand/'(관리 웹앱)
  const src = (v, kind, base) => { const id = of(v); if (!id) return ''; return (base == null ? 'brand/' : base) + id + (kind === 'dark' ? '-dark' : kind === 'icon' ? '-icon' : '') + '.svg'; };
  // 머리띠 로고 그림 한 줄(높이 h px · 너비는 비율로 · 글자 대신 그림이라 alt로 이름) — 빈 값이면 '' → 지금 글자 로고를 그대로 둠
  const headerImg = (v, h, base) => { const x = info(v); if (!x) return ''; h = Math.max(16, Math.min(80, Math.round(+h || 34)));
    return '<img class="logo-img" src="' + src(x.id, 'dark', base) + '" alt="북스퀸" width="' + Math.round(h * x.ratio) + '" height="' + h + '" decoding="async">'; };
  // 관리 웹앱 설정 고르기 칸의 선택지(첫 칸 = 지금 글자 로고)
  const options = () => [['', '지금 글자 로고(♛북스퀸)']].concat(LIST.map((x) => [x[0], x[0] + ' · ' + x[1]]));
  const API = { LIST, IDS, of, info, src, headerImg, options, VER: '0.1.0' };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.BQB = API;
})(typeof window !== 'undefined' ? window : this);
