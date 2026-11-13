/* 👑 북스퀸 로고 시안 — 순수 셈 · 브라우저(window.BQB)·node(시험·클라우드) 함께
 *  (11/13 shoplogo1 · 정범님 20:12 「로고 10개 시안 · 설정에서 바꿔 헤더에」 · 20:47 「6개 더 개선 · 옛 판은 버리지 않고 판을 붙여 비교」)
 *  설정 값: app_settings/shop.brandLogo = 'q01'(그 시안의 지금 판) · 'q01@v2'(판까지 고름) · ''·모르는 값 = 지금 글자 로고(♛북스퀸) 그대로
 *           app_settings/shop.brandUi = { mode, h, hm, fav, tag } — 머리띠 세세 설정(uiOf가 범위를 지킴 · 약속 79)
 *  파일: shop/brand/<id>/<판>.svg(밝은 바탕) · <판>-dark.svg(어두운 바탕 = 숍 머리띠 남색) · <판>-icon.svg(정사각 512)
 *  글자는 모두 윤곽선(OFL 글꼴) · 목록은 logos.json과 같아야 함(시험 tBRAND1113이 지킴) · 새 판 = 폴더에 파일 + logos.json·아래 LIST에 한 줄 */
(function (root) {
  'use strict';
  // [id, 이름, 지금 판, { 판: 가로형 너비÷높이 }]
  const LIST = [
    ['q01', '왕관 책', 'v2', { v1: 2.859, v2: 2.97, v3: 2.977, v4: 4.018, v5: 4.071, v6: 4.275, v7: 4.547, v8: 4.455, v9: 3.148, v10: 3.518, v11: 3.925, v12: 3.1 }],
    ['q02', 'BQ 모노그램', 'v2', { v1: 4.405, v2: 4.296, v3: 2.977, v4: 4.018, v5: 4.071, v6: 4.275, v7: 4.547, v8: 4.455, v9: 3.148, v10: 3.518, v11: 3.925, v12: 3.1 }],
    ['q03', '장서표(엑스리브리스)', 'v2', { v1: 4.497, v2: 4.469, v3: 2.977, v4: 4.018, v5: 4.071, v6: 4.275, v7: 4.547, v8: 4.455, v9: 3.148, v10: 3.518, v11: 3.925, v12: 3.1 }],
    ['q04', '현대 글자로고', 'v2', { v1: 3.635, v2: 3.715, v3: 4.121, v4: 4.059, v5: 3.746, v6: 3.996, v7: 3.996, v8: 2.57, v9: 3.269, v10: 3.902, v11: 4.059, v12: 4.246 }],
    ['q05', '붓글씨와 낙관', 'v1', { v1: 3.168 }],
    ['q06', '책등 왕관', 'v2', { v1: 2.729, v2: 2.777, v3: 2.977, v4: 4.018, v5: 4.071, v6: 4.275, v7: 4.547, v8: 4.455, v9: 3.148, v10: 3.518, v11: 3.925, v12: 3.1 }],
    ['q07', '체스 퀸', 'v1', { v1: 4.047 }],
    ['q08', '책갈피 리본', 'v1', { v1: 3.226 }],
    ['q09', '한글 북스퀸', 'v1', { v1: 3.153 }],
    ['q10', '미니멀 기하', 'v2', { v1: 4.431, v2: 4.185, v3: 2.977, v4: 4.018, v5: 4.071, v6: 4.275, v7: 4.547, v8: 4.455, v9: 3.148, v10: 3.518, v11: 3.925, v12: 3.1 }],
  ];
  const IDS = LIST.map((x) => x[0]);
  const row = (id) => LIST.find((x) => x[0] === id) || null;
  // 'q01' · 'Q01@V2' · ' q01@v1 ' → { id, v, pin } · 모르는 시안·판 = null
  const parse = (val) => { const m = /^(q\d{2})(?:@(v\d{1,2}))?$/.exec(String(val == null ? '' : val).trim().toLowerCase()); if (!m) return null; const r = row(m[1]); if (!r) return null;
    if (m[2] && !(m[2] in r[3])) return null; return { id: r[0], v: m[2] || r[2], pin: !!m[2] }; };
  const of = (val) => { const p = parse(val); return p ? p.id + (p.pin ? '@' + p.v : '') : ''; };
  const info = (val) => { const p = parse(val); if (!p) return null; const r = row(p.id); return { id: p.id, name: r[1], v: p.v, cur: r[2], pin: p.pin, ratio: r[3][p.v] }; };
  // kind: 'light' | 'dark' | 'icon' · base = 'brand/'(손님 화면) · 'https://booksqueen.com/brand/'(관리 웹앱)
  const src = (val, kind, base) => { const x = info(val); if (!x) return ''; return (base == null ? 'brand/' : base) + x.id + '/' + x.v + (kind === 'dark' ? '-dark' : kind === 'icon' ? '-icon' : '') + '.svg'; };
  // 머리띠 세세 설정 — mode: full(가로형 로고) · icon(정사각 아이콘만) · iconText(아이콘 + '북스퀸' 글자) · h = PC 높이 · hm = 휴대폰 높이 · fav = 파비콘도 이 로고 아이콘 · tag = '헌책방' 작은 글 함께
  const UI_DEF = { mode: 'full', h: 34, hm: 28, fav: true, tag: false };
  const MODES = { full: '가로형 로고(상징 + 글자)', icon: '아이콘만', iconText: '아이콘 + 북스퀸 글자' };
  const clamp = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
  const uiOf = (o) => { o = o && typeof o === 'object' ? o : {}; return { mode: Object.prototype.hasOwnProperty.call(MODES, o.mode) ? o.mode : UI_DEF.mode, h: clamp(o.h, 20, 56, UI_DEF.h), hm: clamp(o.hm, 18, 44, UI_DEF.hm),
    fav: o.fav == null ? UI_DEF.fav : !!o.fav, tag: o.tag == null ? UI_DEF.tag : !!o.tag }; };
  // 머리띠 <a class="logo"> 안에 넣을 HTML — 빈 글이면 지금 글자 로고를 그대로 둠 · phone = 휴대폰 폭(520 아래)
  // bg: 'dark'(색 머리띠 · 기본) | 'light'(흰 머리띠 — 밝은 바탕용 그림)
  const headerHtml = (val, ui, phone, base, bg) => { const x = info(val); if (!x) return ''; const u = uiOf(ui); const h = phone ? u.hm : u.h;
    const img = (k, w) => '<img class="logo-img" src="' + src(x.id + '@' + x.v, k, base) + '" alt="' + (k === 'icon' ? '' : '북스퀸') + '" width="' + w + '" height="' + h + '" decoding="async">';
    let s = u.mode === 'full' ? img(bg === 'light' ? 'light' : 'dark', Math.round(h * x.ratio)) : img('icon', h) + (u.mode === 'iconText' ? '<span class="logo-t">북스퀸</span>' : '<span class="sr">북스퀸</span>');
    if (u.tag && !phone) s += '<small>헌책방</small>'; return s; };
  const headerImg = (val, h, base) => headerHtml(val, { mode: 'full', h: h, hm: h }, false, base); /* (0.1.0 이름 그대로) 가로형 그림 한 장 */
  const favicon = (val, ui, base) => (uiOf(ui).fav ? src(val, 'icon', base) : '');
  // 관리 웹앱 고르기 칸 — 첫 칸 = 지금 글자 로고 · 시안(지금 판) · 그 밑에 판마다 고정
  const options = () => [['', '지금 글자 로고(♛북스퀸)']] /* (0.3.0) 판이 많아도 시안마다 지금 판 + 판 고정 칸 */.concat(...LIST.map((r) => [[r[0], r[0] + ' · ' + r[1] + ' (지금 판 ' + r[2] + ')']].concat(Object.keys(r[3]).map((v) => [r[0] + '@' + v, '　' + r[0] + ' · ' + r[1] + ' ' + v + ' 고정']))));
  const API = { LIST, IDS, parse, of, info, src, UI_DEF, MODES, uiOf, headerHtml, headerImg, favicon, options, VER: '0.3.0' };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.BQB = API;
})(typeof window !== 'undefined' ? window : this);
