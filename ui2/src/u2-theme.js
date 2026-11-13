/* 리드나우 2 — 디자인 (설계안 5-8): 색 토큰·테마(밝음·어두움·높은 대비)·모양(둥근 정도·그림자)·무늬 6가지·글꼴·아이콘 묶음
 * 첫 테마 = 지금 웹앱 색 그대로(같은 이름 --paper --bg --ink …) — Q8 ①
 * 기기마다 고름(rn2-theme) · 공용 기본은 ui2_site/main.theme(관리자)
 * 옛 기능 칸(.u2-lg)은 늘 밝은 색 그대로 둠 — 옛 화면 CSS가 어두운 바탕을 생각하지 않고 만들어져 글이 안 보일 수 있음 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const LIGHT = { '--paper': '#FFFFFF', '--bg': '#F3F5F4', '--ink': '#1E2B28', '--sub': '#56655F', '--line': '#DCE3E0', '--cloth': '#2F5D50', '--cloth2': '#264D42', '--soft': '#E6EFEB', '--amber': '#A8661B', '--amberSoft': '#FFF4E5', '--red': '#B0322A', '--redSoft': '#FDECEA', '--gold': '#8A6D1D', '--goldSoft': '#FBF3DC', '--tap': '#1F5FAF' };
  const T = {
    light: { name: '밝음', tokens: LIGHT },
    dark: { name: '어두움', tokens: { '--paper': '#1B2421', '--bg': '#111816', '--ink': '#E8EFEC', '--sub': '#A9B8B2', '--line': '#33423D', '--cloth': '#6FB39C', '--cloth2': '#8CC7B3', '--soft': '#21302B', '--amber': '#E0A458', '--amberSoft': '#3A2C18', '--red': '#F08A80', '--redSoft': '#3A1E1B', '--gold': '#D9BC62', '--goldSoft': '#332C14', '--tap': '#8DB8F0' } },
    contrast: { name: '높은 대비', tokens: { '--paper': '#FFFFFF', '--bg': '#FFFFFF', '--ink': '#000000', '--sub': '#2A2A2A', '--line': '#000000', '--cloth': '#00473A', '--cloth2': '#00362C', '--soft': '#E9F2EE', '--amber': '#7A4300', '--amberSoft': '#FFF0D9', '--red': '#8E0000', '--redSoft': '#FFE3E0', '--gold': '#5E4700', '--goldSoft': '#FFF5D0', '--tap': '#0038A8' } },
  };
  const SHAPE = { '--u2-radius': '10px', '--u2-gap': '6px', '--u2-sh1': '0 1px 2px rgba(0,0,0,.08)', '--u2-sh2': '0 3px 10px rgba(0,0,0,.12)', '--u2-sh3': '0 10px 30px rgba(0,0,0,.18)', '--u2-fs': '14px' };
  /* 무늬 6가지 — 모두 CSS(그림 파일 없음) */
  const PAT = {
    none: { name: '없음', css: 'none' },
    dots: { name: '점', css: 'radial-gradient(currentColor 1px, transparent 1.2px) 0 0/12px 12px' },
    lines: { name: '줄', css: 'repeating-linear-gradient(0deg, transparent 0 11px, currentColor 11px 12px)' },
    grid: { name: '격자', css: 'linear-gradient(currentColor 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, currentColor 1px, transparent 1px) 0 0/14px 14px' },
    paper: { name: '종이결', css: 'repeating-linear-gradient(45deg, transparent 0 3px, currentColor 3px 4px), repeating-linear-gradient(-45deg, transparent 0 5px, currentColor 5px 6px)' },
    grad: { name: '그라데이션', css: 'linear-gradient(135deg, var(--soft), transparent 70%)' },
  };
  const FONTS = { system: { name: '기기 글꼴', fam: 'Pretendard, "Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif' }, noto: { name: 'Noto Sans KR', fam: '"Noto Sans KR", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap' }, plex: { name: 'IBM Plex Sans KR', fam: '"IBM Plex Sans KR", sans-serif', url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap' } };
  const ICONS = ['🏠', '👤', '📚', '🧑‍💼', '🧾', '🛒', '💹', '🌐', '🧪', '⚙', '🚚', '📦', '🔔', '⚠', '✅', '❌', '⏰', '📅', '📈', '📉', '💰', '🏷', '🔍', '📖', '✏', '🗂', '📋', '📌', '⭐', '❤', '💬', '📱', '💻', '🖨', '🔒', '🔓', '🔁', '↩', '➕', '➖', '🗺', '🏪', '🎯', '🤖', '🐾', '☀', '🌙', '📊', '🧮', '🧰', '🛟', '🚀', '🆕', '🟦', '🟥', '🟩', '🟨', '◆', '●', '▶'];

  const lum = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim()); if (!m) return null; const n = parseInt(m[1], 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); if (x == null || y == null) return null; const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };

  const th = (U2.theme = {
    THEMES: T, SHAPE, PAT, FONTS, ICONS, contrast, LIGHT,
    cur: 'light', site: {},
    tokens(name) { const base = (T[name] || T.light).tokens; return Object.assign({}, base, name === 'light' ? (th.site.tokens || {}) : {}, SHAPE, th.site.shape || {}); },
    apply(name) {
      name = T[name] ? name : 'light'; th.cur = name;
      const tk = th.tokens(name);
      let st = document.getElementById('u2-theme-vars'); if (!st) { st = document.createElement('style'); st.id = 'u2-theme-vars'; document.head.appendChild(st); }
      const body = Object.entries(tk).map(([k, v]) => k + ':' + v).join(';');
      const light = Object.entries(Object.assign({}, LIGHT, th.site.tokens || {})).map(([k, v]) => k + ':' + v).join(';');
      st.textContent = '.u2-root{' + body + '} .u2-root .u2-lg{' + light + ';color:var(--ink)}';
      document.documentElement.dataset.u2Theme = name;
      const f = FONTS[th.site.font] || FONTS.system; document.documentElement.style.setProperty('--u2-font', f.fam);
      if (f.url && !document.querySelector('link[data-u2font="' + th.site.font + '"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.url; l.dataset.u2font = th.site.font; document.head.appendChild(l); }
      U2.emit && U2.emit('theme', name);
    },
    choose(name) { U2.ls.set('theme', name); th.apply(name); },
    init(site) { th.site = (site && site.theme) || {}; th.apply(U2.ls.get('theme', th.site.def || 'light')); },
    pattern(k) { return (PAT[k] || PAT.none).css; },
    /* 접근성 검사(E14): 글자·바탕 대비 4.5:1 */
    check(name) { const t = th.tokens(name); return [['--ink', '--paper'], ['--ink', '--bg'], ['--sub', '--paper'], ['--cloth', '--paper'], ['--red', '--paper']].map(([a, b]) => ({ a, b, r: Math.round(contrast(t[a], t[b]) * 100) / 100 })); },
    icon(k) { try { if (typeof ICON !== 'undefined' && ICON[k]) return ICON[k]; } catch (e) {} return ''; },
  });
})();
