/* ⭐👑 북스퀸 로고 고르기 · 변형 창 — shop/brand/studio/logopick.js
   (11/18 logopick1 · 정범님 I-1118-1208-11.7 「아이디어 100·개선안 페이지에서 고른 로고를 상단에 모으고, 안의 창에서 여러 변형 조절」)
   ■ 페이지에 붙이는 법(앞으로 나올 시안 페이지도 같음)
     카드 요소에 data-lp-key(꼴 /^[A-Za-z0-9:@_-]{1,60}$/ · 예 idea:i080 · q01@v3) · data-lp-name · data-lp-from(어느 묶음) ·
     data-lp-light · data-lp-dark · data-lp-icon(brand 폴더 기준 SVG 경로) · data-lp-href(돌아갈 자리 · 없으면 페이지#카드id)를 달고
     이 파일을 불러 LP.mount({ base, page, label }) 한 번 — 카드 제목 옆에 ☆ 고르기가 저절로 붙고(나중에 그린 카드도), 고른 것은 머리의 「⭐ 내가 고른 로고」에 모임.
   ■ 저장: 이 기기(localStorage rnlp-v1) + 웹앱(readnow.kr/app)에 로그인한 브라우저면 Firestore brand_studio/main 한 문서(모든 기기 같게 · 새 시각이 이김)
     지우지 않음 — 고르기 빼기 = on:false · 변형 버리기 = gone:true(⚙ 「버린 변형도 보기」로 되살림)
   ■ 원본 SVG는 바꾸지 않음 — 변형은 '고침 기록'(색 바꿈·크기·모양·글씨 등)만 두고 열 때마다 원본 위에 얹어 그림 · 받기(SVG·PNG)도 그 자리에서 만듦
   ■ 손님 사이트(booksqueen.com)에는 나가지 않음 — hosting/build-shop.js가 brand/ 아래 하위 폴더는 qNN만 담음(시험 tLOGOPICK1118)
   ■ 브라우저 팝업(alert·confirm·prompt) 없음 — 안의 창(dialog)·토스트만 · 닫기는 ✕ · Esc · 바깥 누르기 */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const r3 = (n) => +(+n).toFixed(3);

  /* ───────── 색 ───────── */
  const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', gold: '#ffd700', navy: '#000080', gray: '#808080', grey: '#808080', silver: '#c0c0c0', orange: '#ffa500', yellow: '#ffff00', green: '#008000', blue: '#0000ff' };
  function parseColor(s) {
    if (s == null) return null; s = String(s).trim().toLowerCase();
    if (!s || s === 'none' || s === 'transparent' || s === 'currentcolor' || s === 'inherit' || s.indexOf('url(') === 0) return null;
    if (NAMED[s]) s = NAMED[s];
    let m = /^#([0-9a-f]{3,8})$/.exec(s);
    if (m) {
      let h = m[1]; if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
      if (h.length !== 6 && h.length !== 8) return null;
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
    }
    m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
    if (m) {
      const ch = (v) => clamp(Math.round(v.slice(-1) === '%' ? parseFloat(v) * 2.55 : parseFloat(v)), 0, 255);
      const al = m[4] ? (m[4].slice(-1) === '%' ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
      return { r: ch(m[1]), g: ch(m[2]), b: ch(m[3]), a: clamp(al, 0, 1) };
    }
    return null;
  }
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const norm = (s) => { const c = parseColor(s); return c ? hex(c) : null; };
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = t < 0 ? t + 1 : t > 1 ? t - 1 : t; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  /* 채도(sat %·100=그대로) · 밝기(light −100~100) · 색조(hue °) */
  function adjust(h, a) {
    if (!a) return h; const sat = a.sat == null ? 100 : num(a.sat, 100), li = num(a.light, 0), hu = num(a.hue, 0);
    if (sat === 100 && !li && !hu) return h;
    const c = parseColor(h); if (!c) return h;
    let [H, S, L] = rgb2hsl(c.r, c.g, c.b);
    H += hu; S = clamp(S * sat / 100, 0, 1); L = clamp(li > 0 ? L + (1 - L) * li / 100 : L + L * li / 100, 0, 1);
    const [r, g, b] = hsl2rgb(H, S, L); return hex({ r, g, b });
  }

  /* ───────── 윤곽선 글자(글꼴을 path로 바꾼 것) 알아보기 ───────── */
  const NUM = '(-?\\d*\\.?\\d+(?:e-?\\d+)?)';
  const GLY = new RegExp('^\\s*translate\\(\\s*' + NUM + '[\\s,]+' + NUM + '\\s*\\)\\s*scale\\(\\s*' + NUM + '[\\s,]+-\\s*' + NUM + '\\s*\\)\\s*$', 'i');
  function glyph(tr) {
    const m = GLY.exec(tr || ''); if (!m) return null; const s = +m[3], s2 = +m[4];
    if (!(s > 0) || Math.abs(s - s2) > s * 1e-6) return null; return { x: +m[1], y: +m[2], s };
  }
  const maxCoord = (d) => { let mx = 0; String(d || '').replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, (v) => { const a = Math.abs(+v); if (a > mx) mx = a; return v; }); return mx; };

  /* ───────── 맞붙이기(기기 ↔ 클라우드 · 새 시각이 이김 · 지우지 않음) ───────── */
  function mergeMap(local, remote) {
    const out = Object.assign({}, local || {}); const R = remote || {}; const up = [];
    for (const k of Object.keys(R)) { const x = out[k], y = R[k]; if (!y || typeof y !== 'object') continue; if (!x || num(y.t, 0) > num(x.t, 0)) out[k] = y; }
    for (const k of Object.keys(out)) { const y = R[k]; if (!y || num(out[k].t, 0) > num(y.t, 0)) up.push(k); }
    return { out, up };
  }

  /* ───────── 바꿀 모양 모음(100×100 칸 · '!'로 시작하면 속 빈 꼴) ───────── */
  const leafP = (cx, cy, rx, ry, deg) => { const a = deg * Math.PI / 180, ux = Math.cos(a) * rx, uy = Math.sin(a) * rx; return 'M' + r3(cx + ux) + ' ' + r3(cy + uy) + ' A' + rx + ' ' + ry + ' ' + r3(deg) + ' 1 0 ' + r3(cx - ux) + ' ' + r3(cy - uy) + ' A' + rx + ' ' + ry + ' ' + r3(deg) + ' 1 0 ' + r3(cx + ux) + ' ' + r3(cy + uy) + ' Z'; };
  const circ = (cx, cy, r) => 'M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0 Z';
  const starP = (n, R, r0, cx, cy) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (-90 + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r0 : R; p.push(r3(cx + Math.cos(a) * rr) + ' ' + r3(cy + Math.sin(a) * rr)); } return 'M' + p.join(' L') + ' Z'; };
  const laurel = () => { const out = []; for (const sd of [-1, 1]) { out.push('M' + (50 + sd * 2) + ' 92 Q' + (50 + sd * 40) + ' 70 ' + (50 + sd * 30) + ' 14 L' + (50 + sd * 27) + ' 15 Q' + (50 + sd * 35) + ' 70 ' + (50 + sd * 1) + ' 94 Z'); for (let i = 0; i < 6; i++) { const t = 0.1 + i * 0.15; const y = 90 - t * 80, x = 50 + sd * (8 + 34 * Math.sin(t * Math.PI * 0.95)); out.push(leafP(r3(x + sd * 6), r3(y), 9, 4, sd > 0 ? -50 - i * 6 : 230 + i * 6)); } } return out; };
  const SHAPES = [
    { id: 'crown', n: '왕관(뾰족)', d: ['M8 80 L8 30 L29 52 L50 14 L71 52 L92 30 L92 80 Z', 'M8 86 H92 V94 H8 Z'] },
    { id: 'crown2', n: '왕관(구슬)', d: ['M12 82 L14 42 L32 60 L50 32 L68 60 L86 42 L88 82 Z', circ(14, 38, 7), circ(50, 26, 8), circ(86, 38, 7), 'M12 86 H88 V94 H12 Z'] },
    { id: 'tiara', n: '티아라', d: ['M6 78 C22 52 34 44 50 24 C66 44 78 52 94 78 C70 70 30 70 6 78 Z', circ(50, 18, 6), circ(24, 52, 4), circ(76, 52, 4)] },
    { id: 'queen', n: '체스 여왕', d: ['M26 92 H74 V84 H26 Z', 'M32 82 L37 56 H63 L68 82 Z', 'M30 54 H70 V46 H30 Z', 'M34 44 L24 18 L40 30 L50 12 L60 30 L76 18 L66 44 Z', circ(24, 15, 4), circ(50, 8, 4.5), circ(76, 15, 4)] },
    { id: 'bookopen', n: '펼친 책', d: ['M48 26 C36 18 20 18 6 22 L6 82 C20 78 36 78 48 86 Z', 'M52 26 C64 18 80 18 94 22 L94 82 C80 78 64 78 52 86 Z'] },
    { id: 'book', n: '덮은 책', d: ['M16 6 H84 V82 H24 Q16 82 16 74 Z', 'M24 86 H84 V94 H24 Q16 94 16 90 Q16 86 24 86 Z'] },
    { id: 'books', n: '책 더미', d: ['M10 72 H90 V92 H10 Z', 'M16 48 H84 V68 H16 Z', 'M22 24 H78 V44 H22 Z'] },
    { id: 'bookmark', n: '책갈피', d: ['M28 4 H72 V96 L50 76 L28 96 Z'] },
    { id: 'ribbon', n: '리본 띠', d: ['M4 32 H22 V22 H78 V32 H96 L86 48 L96 64 H70 V56 H30 V64 H4 L14 48 Z'] },
    { id: 'star', n: '별', d: [starP(5, 46, 19, 50, 54)] },
    { id: 'sparkle', n: '반짝임', d: ['M50 4 C54 38 62 46 96 50 C62 54 54 62 50 96 C46 62 38 54 4 50 C38 46 46 38 50 4 Z'] },
    { id: 'heart', n: '하트', d: ['M50 90 C20 68 4 52 4 33 C4 19 15 9 28 9 C38 9 46 15 50 23 C54 15 62 9 72 9 C85 9 96 19 96 33 C96 52 80 68 50 90 Z'] },
    { id: 'circle', n: '동그라미', d: [circ(50, 50, 46)] },
    { id: 'ring', n: '고리', d: ['!' + circ(50, 50, 46) + ' ' + circ(50, 50, 32)] },
    { id: 'square', n: '둥근 네모', d: ['M20 4 H80 Q96 4 96 20 V80 Q96 96 80 96 H20 Q4 96 4 80 V20 Q4 4 20 4 Z'] },
    { id: 'shield', n: '방패', d: ['M50 4 L90 18 V48 C90 72 72 88 50 96 C28 88 10 72 10 48 V18 Z'] },
    { id: 'gem', n: '보석', d: ['M22 12 H78 L96 36 L50 92 L4 36 Z'] },
    { id: 'glasses', n: '안경', d: ['!' + circ(26, 56, 20) + ' ' + circ(26, 56, 13), '!' + circ(74, 56, 20) + ' ' + circ(74, 56, 13), 'M42 50 Q50 42 58 50 L58 55 Q50 48 42 55 Z'] },
    { id: 'laurel', n: '월계수', d: laurel() },
    { id: 'leaf', n: '잎', d: ['M50 96 C20 70 14 36 50 4 C86 36 80 70 50 96 Z'] },
    { id: 'nib', n: '펜촉', d: ['!M50 4 L82 50 L60 96 H40 L18 50 Z ' + circ(50, 52, 6)] },
    { id: 'diamond', n: '마름모', d: ['M50 2 L98 50 L50 98 L2 50 Z'] }
  ];
  const SHAPE = (id) => SHAPES.find((s) => s.id === id);
  function fit(bb, keep) {
    if (!bb || !(bb.w > 0) || !(bb.h > 0)) return '';
    if (keep === false) return 'translate(' + r3(bb.x) + ' ' + r3(bb.y) + ') scale(' + r3(bb.w / 100) + ' ' + r3(bb.h / 100) + ')';
    const k = Math.min(bb.w, bb.h) / 100; return 'translate(' + r3(bb.x + (bb.w - 100 * k) / 2) + ' ' + r3(bb.y + (bb.h - 100 * k) / 2) + ') scale(' + r3(k) + ')';
  }

  /* ───────── 글꼴(무료 · Google Fonts · 쓸 때만 불러옴) ───────── */
  const FONTS = [
    ['Noto Sans KR', [300, 400, 500, 700, 900], '한'], ['Noto Serif KR', [400, 600, 700, 900], '한'], ['Black Han Sans', [400], '한'], ['Do Hyeon', [400], '한'], ['Jua', [400], '한'],
    ['Gowun Batang', [400, 700], '한'], ['Gowun Dodum', [400], '한'], ['Nanum Myeongjo', [400, 700, 800], '한'], ['Nanum Gothic', [400, 700, 800], '한'], ['Nanum Pen Script', [400], '한'],
    ['Nanum Brush Script', [400], '한'], ['Song Myung', [400], '한'], ['Gaegu', [300, 400, 700], '한'], ['Gothic A1', [300, 400, 700, 900], '한'], ['Hahmlet', [300, 400, 600, 800], '한'],
    ['Gugi', [400], '한'], ['East Sea Dokdo', [400], '한'], ['Yeon Sung', [400], '한'], ['Sunflower', [300, 500, 700], '한'],
    ['Playfair Display', [400, 700, 900], '영'], ['Cinzel', [400, 700, 900], '영'], ['Montserrat', [300, 400, 700, 900], '영'], ['DM Serif Display', [400], '영'], ['Cormorant Garamond', [400, 600, 700], '영'],
    ['Josefin Sans', [300, 400, 700], '영'], ['Bungee', [400], '영'], ['Italiana', [400], '영'], ['Limelight', [400], '영'], ['Outfit', [300, 400, 700, 900], '영']
  ].map((x) => ({ n: x[0], w: x[1], k: x[2] }));
  const FONT = (n) => FONTS.find((f) => f.n === n);
  const fontQ = (f, w) => encodeURIComponent(f.n).replace(/%20/g, '+') + (f.w.length === 1 && f.w[0] === 400 ? '' : ':wght@' + (w ? w : f.w.join(';')));

  /* ───────── 원본 SVG 읽어 부분 나누기 ───────── */
  const SKIP = new Set(['defs', 'clipPath', 'mask', 'pattern', 'symbol', 'marker', 'linearGradient', 'radialGradient', 'filter', 'style', 'title', 'desc', 'metadata', 'script', 'foreignObject']);
  const LEAF = new Set(['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'use']);
  const TAGKO = { path: '모양', circle: '동그라미', rect: '네모', ellipse: '타원', polygon: '다각형', polyline: '꺾은선', line: '선', text: '글', use: '되풀이', shape: '더한 모양', addtext: '더한 글씨', line_: '글자 줄' };
  const styleOf = (el, p) => { const s = el.getAttribute && el.getAttribute('style'); if (!s) return null; const m = new RegExp('(?:^|;)\\s*' + p + '\\s*:\\s*([^;]+)').exec(s); return m ? m[1].trim() : null; };
  const unstyle = (el, p) => { const s = el.getAttribute('style'); if (!s) return; const n = s.split(';').filter((x) => x.trim() && x.split(':')[0].trim() !== p).join(';'); if (n) el.setAttribute('style', n); else el.removeAttribute('style'); };
  function eff(el, p, dflt) { for (let n = el; n && n.nodeType === 1; n = n.parentNode) { const v = styleOf(n, p) || n.getAttribute(p); if (v && v !== 'inherit') return v; } return dflt; }
  const tchain = (el) => { const a = []; for (let n = el; n && n.nodeType === 1 && n.localName !== 'svg'; n = n.parentNode) a.push(n.getAttribute('transform') || ''); return a.join('|'); };

  function prep(text, W) {
    W = W || root;
    const doc = new W.DOMParser().parseFromString(String(text), 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.localName !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error('SVG를 읽지 못함');
    for (const s of Array.from(svg.getElementsByTagName('script'))) s.remove();
    for (const el of Array.from(svg.getElementsByTagName('*'))) for (const a of Array.from(el.attributes)) if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    const leaves = [];
    const walk = (el) => { for (const c of Array.from(el.children)) { const t = c.localName; if (SKIP.has(t)) continue; if (LEAF.has(t)) leaves.push(c); else if (t === 'g' || t === 'a' || t === 'switch' || t === 'svg') walk(c); } };
    walk(svg);
    const byKey = {}, lines = [], shapes = []; let n = 0;
    for (const el of leaves) {
      const id = 'p' + (n++);
      const w = doc.createElementNS(NS, 'g'); w.setAttribute('data-lp', id); el.parentNode.insertBefore(w, el); w.appendChild(el);
      const f = eff(el, 'fill', '#000000'), s = eff(el, 'stroke', 'none'); const fh = norm(f), sh = norm(s);
      if (fh) el.setAttribute('data-lpf', fh); if (sh) el.setAttribute('data-lps', sh);
      const gl = el.localName === 'path' ? glyph(el.getAttribute('transform')) : null;
      if (gl) {
        const key = tchain(w.parentNode) + '#' + gl.y.toFixed(2) + '#' + gl.s;
        let L = byKey[key];
        if (!L) { L = byKey[key] = { id: 'L' + lines.length, tag: 'line', y: gl.y, s: gl.s, x0: gl.x, g: [], col: fh || sh || '', mx: 0 }; lines.push(L); }
        L.g.push(id); L.mx = Math.max(L.mx, maxCoord(el.getAttribute('d'))); w.setAttribute('data-lpl', L.id);
      } else shapes.push({ id, tag: el.localName, col: fh || sh || (String(f).indexOf('url(') === 0 ? '그라데이션' : '') });
    }
    lines.forEach((L) => { L.U = L.mx > 1200 ? 2048 : 1000; L.n = L.g.length; delete L.mx; });
    for (const st of Array.from(svg.getElementsByTagName('stop'))) { const c = norm(styleOf(st, 'stop-color') || st.getAttribute('stop-color') || '#000000'); if (c) st.setAttribute('data-lpc', c); }
    const cnt = {};
    for (const el of Array.from(svg.querySelectorAll('[data-lpf],[data-lps],[data-lpc]'))) for (const a of ['data-lpf', 'data-lps', 'data-lpc']) { const v = el.getAttribute(a); if (v) cnt[v] = (cnt[v] || 0) + 1; }
    const vbA = String(svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const vb = vbA.length === 4 && vbA.every(isFinite) ? { x: vbA[0], y: vbA[1], w: vbA[2], h: vbA[3] } : { x: 0, y: 0, w: num(svg.getAttribute('width'), 100), h: num(svg.getAttribute('height'), 100) };
    const tt = svg.getElementsByTagName('title')[0];
    return { svg, W, lines, shapes, parts: lines.concat(shapes), pal: Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]), vb, bb: {}, title: tt ? tt.textContent : '' };
  }

  /* 부분 가운데(돌리기·크기의 중심) */
  function addBox(P, a) {
    const m = Math.min(P.vb.w, P.vb.h), cx = P.vb.x + P.vb.w * num(a.cx, 50) / 100, cy = P.vb.y + P.vb.h * num(a.cy, 50) / 100;
    if (a.type === 'text') { const fs = m * num(a.size, 30) / 100, w = fs * 0.62 * Math.max(1, String(a.txt || '').length); return { x: cx - w / 2, y: cy - fs * 0.62, w, h: fs * 0.95, fs, cx, cy }; }
    const sz = m * num(a.size, 30) / 100; return { x: cx - sz / 2, y: cy - sz / 2, w: sz, h: sz, cx, cy };
  }
  function boxOf(P, st, pid) {
    const a = (st.adds || []).find((x) => x.id === pid); if (a) return addBox(P, Object.assign({}, a, a.type === 'text' ? { txt: ((st.parts || {})[pid] || {}).txt || a.txt } : {}));
    return P.bb[pid] || null;
  }
  function tf(o, c, vb) {
    const S = num(o.s, 100) / 100, sx = S * num(o.sx, 100) / 100, sy = S * num(o.sy, 100) / 100, r = num(o.r, 0), k = num(o.k, 0), dx = num(o.dx, 0) * vb.w / 100, dy = num(o.dy, 0) * vb.h / 100;
    if (sx === 1 && sy === 1 && !r && !k && !dx && !dy) return '';
    return 'translate(' + r3(dx + c.x) + ' ' + r3(dy + c.y) + ')' + (r ? ' rotate(' + r3(r) + ')' : '') + (k ? ' skewX(' + r3(k) + ')' : '') + (sx !== 1 || sy !== 1 ? ' scale(' + r3(sx) + ' ' + r3(sy) + ')' : '') + ' translate(' + r3(-c.x) + ' ' + r3(-c.y) + ')';
  }
  const ffam = (n) => (FONT(n) ? "'" + n + "', " : '') + "'Noto Sans KR', sans-serif";
  function mkText(doc, o, x, y, fs, anchor, col) {
    const t = doc.createElementNS(NS, 'text');
    t.setAttribute('x', r3(x)); t.setAttribute('y', r3(y)); t.setAttribute('font-family', ffam(o.font)); t.setAttribute('font-size', r3(fs));
    t.setAttribute('font-weight', String(num(o.wt, 700))); if (num(o.ls, 0)) t.setAttribute('letter-spacing', r3(fs * num(o.ls, 0) / 100));
    t.setAttribute('text-anchor', anchor); if (col) t.setAttribute('data-lpf', col); t.textContent = String(o.txt || '');
    return t;
  }
  /* 고침 기록(st)을 원본 위에 얹어 SVG 글로 */
  function render(P, st, opt) {
    st = st || {}; opt = opt || {};
    const svg = P.svg.cloneNode(true), doc = svg.ownerDocument; const parts = st.parts || {}, g = st.g || {}, pal = st.pal || {}; const vb = P.vb;
    const q = (s) => Array.from(svg.querySelectorAll(s));
    // ① 글자 줄 → 글꼴 글씨(글씨를 넣었을 때만)
    for (const L of P.lines) {
      const o = parts[L.id]; if (!o || !String(o.txt || '').trim()) continue;
      const ws = q('[data-lpl="' + L.id + '"]'); if (!ws.length) continue;
      const bb = P.bb[L.id] || { x: L.x0, y: L.y - L.s * L.U * 0.75, w: 0, h: L.s * L.U };
      const al = o.al || 'start'; const x = al === 'middle' ? bb.x + bb.w / 2 : al === 'end' ? bb.x + bb.w : bb.x;
      const gw = doc.createElementNS(NS, 'g'); gw.setAttribute('data-lp', L.id);
      gw.appendChild(mkText(doc, o, x, L.y, L.s * L.U * num(o.fs, 100) / 100, al, L.col || '#1d2b45'));
      ws[0].parentNode.insertBefore(gw, ws[0]); ws.forEach((w) => w.remove());
    }
    // ② 더한 모양·글씨(맨 위 층)
    for (const a of st.adds || []) {
      if (a.gone) continue; const o = parts[a.id] || {}; const b = addBox(P, Object.assign({}, a, { txt: o.txt || a.txt }));
      const gw = doc.createElementNS(NS, 'g'); gw.setAttribute('data-lp', a.id);
      if (a.type === 'text') gw.appendChild(mkText(doc, Object.assign({ txt: a.txt }, o, { txt: o.txt || a.txt }), b.cx, b.cy + b.fs * 0.33, b.fs * num(o.fs, 100) / 100, 'middle', a.col || '#1d2b45'));
      else { const S = SHAPE(a.shape) || SHAPES[0]; const sg = doc.createElementNS(NS, 'g'); sg.setAttribute('transform', fit(b, true)); for (const d of S.d) { const p = doc.createElementNS(NS, 'path'); if (d[0] === '!') { p.setAttribute('fill-rule', 'evenodd'); p.setAttribute('d', d.slice(1)); } else p.setAttribute('d', d); p.setAttribute('data-lpf', a.col || '#c9a24a'); sg.appendChild(p); } gw.appendChild(sg); }
      svg.appendChild(gw);
    }
    // ③ 모양 바꾸기(원래 부분 자리·크기에 새 모양)
    for (const pid of Object.keys(parts)) {
      const o = parts[pid]; if (!o.rep || pid[0] !== 'p') continue; const S = SHAPE(o.rep); const w = q('[data-lp="' + pid + '"]')[0]; const bb = P.bb[pid]; if (!S || !w || !bb) continue;
      const el = w.firstElementChild; const col = (el && (el.getAttribute('data-lpf') || el.getAttribute('data-lps'))) || '#1d2b45';
      while (w.firstChild) w.removeChild(w.firstChild);
      const sg = doc.createElementNS(NS, 'g'); sg.setAttribute('transform', fit(bb, o.keep !== false));
      for (const d of S.d) { const p = doc.createElementNS(NS, 'path'); if (d[0] === '!') { p.setAttribute('fill-rule', 'evenodd'); p.setAttribute('d', d.slice(1)); } else p.setAttribute('d', d); p.setAttribute('data-lpf', col); sg.appendChild(p); }
      w.appendChild(sg);
    }
    // ④ 색(같은 색 한꺼번에 → 부분 색 → 부분 채도·밝기·색조 → 전체 채도·밝기·색조)
    const partOf = (el) => { const l = el.closest('[data-lpl]'); if (l) return l.getAttribute('data-lpl'); const p = el.closest('[data-lp]'); return p ? p.getAttribute('data-lp') : ''; };
    for (const el of q('[data-lpf],[data-lps]')) {
      const o = parts[partOf(el)] || {};
      const f0 = el.getAttribute('data-lpf'), s0 = el.getAttribute('data-lps');
      if (f0) { el.setAttribute('fill', adjust(adjust(o.fill || pal[f0] || f0, o), g)); unstyle(el, 'fill'); }
      if (s0) { el.setAttribute('stroke', adjust(adjust(o.stroke || pal[s0] || s0, o), g)); unstyle(el, 'stroke'); }
    }
    for (const el of q('[data-lpc]')) { const c0 = el.getAttribute('data-lpc'); el.setAttribute('stop-color', adjust(pal[c0] || c0, g)); unstyle(el, 'stop-color'); }
    // ⑤ 크기·늘이기·돌리기·기울이기·옮기기·둥글기·선 굵기·투명도·숨기기
    for (const pid of Object.keys(parts)) {
      const o = parts[pid]; const ts = q('[data-lp="' + pid + '"],[data-lpl="' + pid + '"]'); if (!ts.length) continue;
      if (o.hide) { ts.forEach((w) => w.remove()); continue; }
      const bb = boxOf(P, st, pid) || { x: vb.x, y: vb.y, w: vb.w, h: vb.h };
      const t = tf(o, { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 }, vb); if (t) ts.forEach((w) => w.setAttribute('transform', t));
      if (o.op != null && num(o.op, 100) !== 100) ts.forEach((w) => w.setAttribute('opacity', r3(clamp(num(o.op, 100), 0, 100) / 100)));
      const rd = num(o.round, 0), sw = num(o.sw, 100);
      if (!rd && sw === 100) continue;
      const L = P.lines.find((x) => x.id === pid);
      for (const w of ts) for (const el of Array.from(w.querySelectorAll('path,rect,polygon,circle,ellipse,polyline,line,text'))) {
        const loc = L && el.localName === 'path' ? L.s : 1;
        if (rd && el.localName === 'rect') { const rw = num(el.getAttribute('width'), 0), rh = num(el.getAttribute('height'), 0); const rr = r3(Math.min(rw, rh) / 2 * rd / 100); el.setAttribute('rx', rr); el.setAttribute('ry', rr); }
        else if (rd && el.getAttribute('data-lpf') && !el.getAttribute('data-lps') && el.localName !== 'circle' && el.localName !== 'ellipse') { el.setAttribute('stroke', el.getAttribute('fill')); el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('stroke-width', r3(Math.min(bb.w, bb.h) * 0.12 * rd / 100 / loc)); }
        if (sw !== 100 && el.getAttribute('data-lps')) el.setAttribute('stroke-width', r3(num(eff(el, 'stroke-width', '1'), 1) * sw / 100));
      }
    }
    // ⑥ 여백(돌리거나 키워서 잘릴 때)
    const pad = num(g.pad, 0);
    if (pad) {
      const px = vb.w * pad / 100, py = vb.h * pad / 100; svg.setAttribute('viewBox', [vb.x - px, vb.y - py, vb.w + 2 * px, vb.h + 2 * py].map(r3).join(' '));
      const wa = num(svg.getAttribute('width'), 0), ha = num(svg.getAttribute('height'), 0); if (wa) svg.setAttribute('width', r3(wa * (1 + 2 * pad / 100))); if (ha) svg.setAttribute('height', r3(ha * (1 + 2 * pad / 100)));
    }
    if (opt.title) { const tt = svg.getElementsByTagName('title')[0]; if (tt) tt.textContent = opt.title; }
    if (opt.css) { const s = doc.createElementNS(NS, 'style'); s.textContent = opt.css; svg.insertBefore(s, svg.firstChild); }
    let out = new P.W.XMLSerializer().serializeToString(svg);
    if (opt.clean) out = out.replace(/\s(data-lp[a-z]*|data-lpl)="[^"]*"/g, '');
    return out;
  }
  /* 쓴 글꼴과 글자(내보낼 때 글꼴을 SVG 안에 넣으려고) */
  function usedFonts(st, P) {
    const m = {}; const parts = st.parts || {};
    const add = (o, txt) => { const f = FONT(o.font) || FONTS[0]; const w = num(o.wt, 700); const k = f.n + '|' + w; m[k] = m[k] || { f, w, t: '' }; m[k].t += txt; };
    for (const L of P.lines) { const o = parts[L.id]; if (o && String(o.txt || '').trim() && !o.hide) add(o, o.txt); }
    for (const a of st.adds || []) if (a.type === 'text' && !a.gone) { const o = parts[a.id] || {}; if (!o.hide) add(o, o.txt || a.txt || ''); }
    return Object.values(m);
  }
  const blank = () => ({ g: {}, pal: {}, parts: {}, adds: [] });
  const isBlank = (st) => !st || (!Object.keys(st.g || {}).some((k) => st.g[k] != null && st.g[k] !== '' && +st.g[k] !== (k === 'sat' ? 100 : 0)) && !Object.keys(st.pal || {}).length && !Object.keys(st.parts || {}).length && !(st.adds || []).length);

  const H = { parseColor, hex, norm, rgb2hsl, hsl2rgb, adjust, glyph, maxCoord, mergeMap, SHAPES, FONTS, fit, tf, prep, render, usedFonts, blank, isBlank, KEY: /^[A-Za-z0-9:@_-]{1,60}$/, FILE: /^(?!.*\.\.)[\w./-]{1,140}\.svg$/ };
  if (typeof module === 'object' && module.exports) { module.exports = H; return; }

  /* ═════════════════ 여기부터 화면(브라우저에서만) ═════════════════ */
  const LS = 'rnlp-v1', LSD = 'rnlp-draft-v1';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => Date.now();
  let O = null; const S = { picks: {}, vars: {}, cfg: {} }; let SY = { st: 'local', msg: '' }; let CL = null;
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 사생활 창 등 — 화면은 그대로 */ } };
  function loadLocal() { const v = jget(LS, {}); S.picks = v.picks || {}; S.vars = v.vars || {}; S.cfg = Object.assign({ png: 1024, flt: 'all', fold: false, gone: false, hl: true }, v.cfg || {}); }
  const saveLocal = () => jset(LS, { picks: S.picks, vars: S.vars, cfg: S.cfg });
  const url = (f) => (H.FILE.test(String(f || '')) ? (O.base || '') + f : '');

  function toast(msg, act) {
    let box = document.getElementById('lp-toast'); if (!box) { box = document.createElement('div'); box.id = 'lp-toast'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'lp-t'; t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button">' + esc(act[0]) + '</button>' : '') + '<button type="button" class="lp-tx" aria-label="닫기">✕</button>';
    box.appendChild(t); const off = () => t.remove(); t.querySelector('.lp-tx').onclick = off; if (act) t.querySelector('button').onclick = () => { off(); act[1](); };
    setTimeout(off, act ? 9000 : 4200);
  }

  function css() {
    if (document.getElementById('lp-css')) return;
    const s = document.createElement('style'); s.id = 'lp-css';
    s.textContent = [
      '.lp-star{margin-left:8px;font:600 12px/1 inherit;border:1px solid var(--line,#ddd);background:var(--chip,#f3eee2);color:var(--ink,#222);border-radius:999px;padding:4px 9px;cursor:pointer;vertical-align:2px;white-space:nowrap}',
      '.lp-star[aria-pressed="true"]{background:#e0a500;border-color:#e0a500;color:#1d2b45}',
      '[data-lp-on="1"]{box-shadow:0 0 0 2px #e0a500 inset}',
      '#lp-picks{margin:14px 0 6px;background:var(--card,#fff);border:1px solid #e0a500;border-radius:14px;padding:12px 14px}',
      '#lp-picks .lp-hd{display:flex;flex-wrap:wrap;align-items:center;gap:8px}#lp-picks h2{font-size:18px;margin:0}#lp-picks h2 small{color:var(--mut,#666);font-weight:400;font-size:13px;margin-left:6px}',
      '.lp-sync{font-size:12px;color:var(--mut,#666)}.lp-sync a{color:inherit}.lp-sp{flex:1}',
      '.lp-b{font:13px/1.2 inherit;border:1px solid var(--line,#ddd);background:var(--chip,#f3eee2);color:var(--ink,#222);border-radius:8px;padding:5px 10px;cursor:pointer}.lp-b.on{background:var(--navy,#1d2b45);color:#fff;border-color:var(--navy,#1d2b45)}.lp-b.pri{background:#e0a500;border-color:#e0a500;color:#1d2b45;font-weight:700}',
      '.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:10px}',
      '.lp-c{border:1px solid var(--line,#ddd);border-radius:12px;padding:8px;min-width:0;background:var(--bg,#faf7f0)}',
      '.lp-c .th{display:flex;gap:6px;cursor:pointer}.lp-c .th div{flex:1;border-radius:8px;padding:6px;min-width:0;overflow:hidden}.lp-c .th .l{background:#faf7f0;border:1px solid #e7e1d3}.lp-c .th .d{background:#0f1726}.lp-c .th img{display:block;height:34px;max-width:100%;object-fit:contain;object-position:left center}',
      '.lp-c b{display:block;font-size:14px;margin:6px 0 2px;overflow-wrap:anywhere}.lp-c small{color:var(--mut,#666);font-size:12px}.lp-c .ac{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}',
      '.lp-vs{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.lp-v{font-size:12px;border-radius:999px;padding:2px 8px;border:1px solid #e0a500;background:transparent;color:var(--ink,#222);cursor:pointer}.lp-v.gone{opacity:.55;text-decoration:line-through}',
      '.lp-empty{color:var(--mut,#666);font-size:14px;margin:8px 0 0}.lp-cfg{display:flex;flex-wrap:wrap;gap:12px;font-size:13px;margin-top:8px;padding:8px;border-radius:8px;background:var(--chip,#f3eee2)}',
      '#lp-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;display:flex;flex-direction:column;gap:6px;align-items:center}',
      '.lp-t{background:#1d2b45;color:#fff;border-radius:10px;padding:9px 12px;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center;max-width:92vw}.lp-t button{background:#e0a500;color:#1d2b45;border:0;border-radius:6px;padding:3px 8px;cursor:pointer}.lp-t .lp-tx{background:transparent;color:#fff}',
      '#lp-dlg{width:min(1240px,97vw);height:min(860px,94vh);max-width:none;max-height:none;padding:0;border:0;border-radius:14px;background:var(--card,#fff);color:var(--ink,#222)}#lp-dlg::backdrop{background:rgba(10,14,22,.55)}',
      '#lp-dlg .lp-in{display:grid;grid-template-columns:minmax(0,1fr) 380px;grid-template-rows:auto minmax(0,1fr) auto;height:100%}',
      '#lp-dlg .lp-top{grid-column:1/3;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line,#ddd)}#lp-dlg .lp-top h3{margin:0 8px 0 0;font-size:16px}',
      '#lp-dlg .lp-x{margin-left:auto;font-size:18px;line-height:1;padding:6px 10px}',
      '#lp-dlg .lp-pv{min-width:0;min-height:0;display:flex;flex-direction:column}#lp-prev{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}#lp-prev svg{max-width:100%;max-height:100%;width:auto;height:auto;min-width:40%;cursor:crosshair}',
      '#lp-prev.bl{background:#faf7f0}#lp-prev.bd{background:#0f1726}#lp-prev.bc{background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/18px 18px}',
      '#lp-prev [data-lp-hl]{filter:drop-shadow(0 0 1.5px #ff3d7f) drop-shadow(0 0 3px #ff3d7f)}',
      '.lp-pvb{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 12px;border-top:1px solid var(--line,#ddd);font-size:13px}',
      '#lp-panel{overflow:auto;border-left:1px solid var(--line,#ddd);padding:8px 12px 16px;font-size:13px}',
      '#lp-panel details{border:1px solid var(--line,#ddd);border-radius:10px;padding:6px 10px;margin:8px 0}#lp-panel summary{cursor:pointer;font-weight:700;font-size:14px}',
      '.lp-sl{display:grid;grid-template-columns:78px 1fr 46px;align-items:center;gap:6px;margin:5px 0}.lp-sl input{width:100%}.lp-sl output{text-align:right;font-variant-numeric:tabular-nums;color:var(--mut,#666)}',
      '.lp-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}.lp-row select,.lp-row input[type=text]{font:13px inherit;padding:4px 6px;border:1px solid var(--line,#ccc);border-radius:6px;background:var(--bg,#fff);color:var(--ink,#222);max-width:100%}',
      '.lp-pal{display:flex;flex-wrap:wrap;gap:6px}.lp-pal label{display:flex;flex-direction:column;align-items:center;font-size:10px;color:var(--mut,#666)}.lp-pal input{width:36px;height:28px;padding:0;border:1px solid var(--line,#ccc);border-radius:6px;background:none}',
      '.lp-sh{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}.lp-sh button{aspect-ratio:1;min-width:0;overflow:hidden;display:block;border:1px solid var(--line,#ccc);border-radius:6px;background:var(--bg,#fff);padding:3px;cursor:pointer}.lp-sh button.on{border-color:#e0a500;box-shadow:0 0 0 2px #e0a500}.lp-sh svg{width:100%;height:100%;fill:var(--ink,#1d2b45)}',
      '.lp-bot{grid-column:1/3;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;border-top:1px solid var(--line,#ddd)}.lp-bot input{font:13px inherit;padding:5px 8px;border:1px solid var(--line,#ccc);border-radius:6px;min-width:180px;background:var(--bg,#fff);color:var(--ink,#222)}',
      '.lp-vlist{display:flex;gap:4px;flex-wrap:wrap}.lp-vlist .lp-v.cur{background:#e0a500;color:#1d2b45}',
      '.lp-note{color:var(--mut,#666);font-size:12px;margin:4px 0}',
      '@media (max-width:820px){#lp-dlg .lp-in{grid-template-columns:1fr;grid-template-rows:auto 42vh minmax(0,1fr) auto}#lp-panel{border-left:0;border-top:1px solid var(--line,#ddd)}#lp-dlg .lp-top,#lp-dlg .lp-bot{grid-column:1}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ───────── 카드에 ☆ 고르기 ───────── */
  const cardRec = (c) => ({ name: (c.getAttribute('data-lp-name') || c.getAttribute('data-lp-key')).slice(0, 120), from: (c.getAttribute('data-lp-from') || O.label || '').slice(0, 60), page: O.page,
    href: (c.getAttribute('data-lp-href') || (c.id ? O.page + '#' + c.id : O.page)).slice(0, 160), light: c.getAttribute('data-lp-light') || '', dark: c.getAttribute('data-lp-dark') || '', icon: c.getAttribute('data-lp-icon') || '' });
  function syncCard(c) {
    const k = c.getAttribute('data-lp-key'); const on = !!(S.picks[k] && S.picks[k].on);
    const b = c.querySelector('.lp-star'); if (b && b.getAttribute('aria-pressed') !== String(on)) { b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '★ 고름' : '☆ 고르기'; b.title = on ? '다시 누르면 고른 줄에서 뺌' : '고르면 위 「⭐ 내가 고른 로고」에 모임'; }
    if ((c.getAttribute('data-lp-on') === '1') !== on) { if (on) c.setAttribute('data-lp-on', '1'); else c.removeAttribute('data-lp-on'); }
  }
  function decorate() {
    for (const c of document.querySelectorAll('[data-lp-key]:not([data-lp-done])')) {
      if (!H.KEY.test(c.getAttribute('data-lp-key') || '')) continue; c.setAttribute('data-lp-done', '1');
      const h = c.querySelector('h3,h4,h2') || c; const b = document.createElement('button'); b.type = 'button'; b.className = 'lp-star'; b.setAttribute('aria-pressed', 'x'); h.appendChild(b); syncCard(c);
    }
  }
  const syncAll = () => document.querySelectorAll('[data-lp-key][data-lp-done]').forEach(syncCard);
  function togglePick(c) {
    const k = c.getAttribute('data-lp-key'); const cur = S.picks[k]; const on = !(cur && cur.on);
    S.picks[k] = Object.assign({}, cur || {}, cardRec(c), { on, t: now() }); saveLocal(); push('picks', [k]); syncAll(); drawPicks();
    toast(on ? '⭐ 골랐습니다 — 위 「내가 고른 로고」에서 ✏ 변형' : '고른 줄에서 뺐습니다', on ? null : ['되돌리기', () => { S.picks[k] = Object.assign({}, S.picks[k], { on: true, t: now() }); saveLocal(); push('picks', [k]); syncAll(); drawPicks(); }]);
  }

  /* ───────── 머리의 「⭐ 내가 고른 로고」 ───────── */
  const varsOf = (k) => Object.keys(S.vars).map((id) => Object.assign({ id }, S.vars[id])).filter((v) => v.k === k && (S.cfg.gone || !v.gone)).sort((a, b) => num(a.c, a.t) - num(b.c, b.t));
  function drawPicks() {
    const sec = document.getElementById('lp-picks'); if (!sec) return;
    const all = Object.keys(S.picks).filter((k) => H.KEY.test(k) && S.picks[k] && S.picks[k].on).map((k) => Object.assign({ k }, S.picks[k])).sort((a, b) => num(b.t, 0) - num(a.t, 0));
    const list = S.cfg.flt === 'page' ? all.filter((p) => p.page === O.page) : all;
    const sync = SY.st === 'cloud' ? '☁ 모든 기기에 같게 저장(웹앱 로그인)' : SY.st === 'wait' ? '☁ 잇는 중…' : SY.st === 'deny' ? '⚠ 저장소 권한 없음 — 이 기기에만 저장' : '📱 이 기기에만 저장 — <a href="/app/" target="_blank" rel="noopener">웹앱(readnow.kr/app)</a>에 로그인한 브라우저에서 열면 모든 기기에 같게';
    sec.innerHTML = '<div class="lp-hd"><h2>⭐ 내가 고른 로고<small>' + all.length + '개' + (S.cfg.flt === 'page' ? ' · 이 페이지 ' + list.length + '개' : '') + '</small></h2><span class="lp-sync">' + sync + '</span><span class="lp-sp"></span>' +
      '<button type="button" class="lp-b' + (S.cfg.flt !== 'page' ? ' on' : '') + '" data-lpa="flt" data-v="all">모든 페이지</button><button type="button" class="lp-b' + (S.cfg.flt === 'page' ? ' on' : '') + '" data-lpa="flt" data-v="page">이 페이지만</button>' +
      '<button type="button" class="lp-b" data-lpa="fold">' + (S.cfg.fold ? '▾ 펴기' : '▴ 접기') + '</button><button type="button" class="lp-b" data-lpa="cfg" title="설정">⚙</button></div>' +
      (S.cfg.open ? '<div class="lp-cfg"><label>PNG 받기 크기 <select data-lpc="png">' + [512, 1024, 2048, 4096].map((n) => '<option' + (+S.cfg.png === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> px(긴 쪽)</label>' +
        '<label><input type="checkbox" data-lpc="gone"' + (S.cfg.gone ? ' checked' : '') + '> 버린 변형도 보기(되살리기)</label><label><input type="checkbox" data-lpc="hl"' + (S.cfg.hl ? ' checked' : '') + '> 변형 창에서 고른 부분 빛내기</label>' +
        '<button type="button" class="lp-b" data-lpa="cfg">✕ 설정 닫기</button></div>' : '') +
      (S.cfg.fold ? '' : list.length ? '<div class="lp-grid">' + list.map((p) => {
        const vs = varsOf(p.k);
        return '<div class="lp-c" data-k="' + esc(p.k) + '"><div class="th" data-lpa="ed" title="눌러 변형 창 열기">' + (url(p.light) ? '<div class="l"><img loading="lazy" alt="" src="' + esc(url(p.light)) + '"></div>' : '') + (url(p.dark) ? '<div class="d"><img loading="lazy" alt="" src="' + esc(url(p.dark)) + '"></div>' : '') + '</div>' +
          '<b>' + esc(p.name) + '</b><small>' + esc(p.from) + (p.page !== O.page ? ' · 다른 페이지' : '') + '</small>' +
          (vs.length ? '<div class="lp-vs">' + vs.map((v) => '<button type="button" class="lp-v' + (v.gone ? ' gone' : '') + '" data-lpa="ed" data-vid="' + esc(v.id) + '">🎨 ' + esc(v.name || '변형') + '</button>').join('') + '</div>' : '') +
          '<div class="ac"><button type="button" class="lp-b pri" data-lpa="ed">✏ 변형</button><a class="lp-b" href="' + esc(/^[\w.-]+\.html(#[\w@:-]*)?$/.test(p.href || '') ? p.href : '#') + '">↗ 원래 자리</a><button type="button" class="lp-b" data-lpa="un">★ 빼기</button></div></div>';
      }).join('') + '</div>' : '<p class="lp-empty">아직 고른 로고가 없습니다 — 아래 카드 제목 옆 「☆ 고르기」를 누르면 여기에 모이고, ✏ 변형으로 색·크기·모양·글씨를 바꿔 볼 수 있습니다.</p>');
  }
  function onPickClick(e) {
    const a = e.target.closest('[data-lpa]'); if (!a) return; const act = a.getAttribute('data-lpa'); const c = a.closest('.lp-c'); const k = c && c.getAttribute('data-k');
    if (act === 'flt') { S.cfg.flt = a.getAttribute('data-v'); saveLocal(); drawPicks(); }
    else if (act === 'fold') { S.cfg.fold = !S.cfg.fold; saveLocal(); drawPicks(); }
    else if (act === 'cfg') { S.cfg.open = !S.cfg.open; drawPicks(); }
    else if (act === 'ed' && k) openEd(k, a.getAttribute('data-vid'));
    else if (act === 'un' && k) { S.picks[k] = Object.assign({}, S.picks[k], { on: false, t: now() }); saveLocal(); push('picks', [k]); syncAll(); drawPicks(); toast('고른 줄에서 뺐습니다(변형은 남아 있음)', ['되돌리기', () => { S.picks[k] = Object.assign({}, S.picks[k], { on: true, t: now() }); saveLocal(); push('picks', [k]); syncAll(); drawPicks(); }]); }
  }
  function onPickChange(e) {
    const el = e.target.closest('[data-lpc]'); if (!el) return; const f = el.getAttribute('data-lpc');
    S.cfg[f] = el.type === 'checkbox' ? el.checked : +el.value; saveLocal(); drawPicks(); if (f === 'hl' && E) pv();
  }

  /* ───────── 클라우드(웹앱 로그인 그대로 · Firestore brand_studio/main) ───────── */
  async function cloudStart() {
    if (!/^https:$/.test(location.protocol)) return;
    SY = { st: 'wait' }; drawPicks();
    try {
      const sdk = 'https://www.gstatic.com/firebasejs/10.12.2/';
      const [A, Au, F] = await Promise.all([import(sdk + 'firebase-app.js'), import(sdk + 'firebase-auth.js'), import(sdk + 'firebase-firestore.js')]);
      const cfg = await fetch('/__/firebase/init.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('init ' + r.status))));
      const app = A.getApps().length ? A.getApp() : A.initializeApp(cfg);
      const auth = Au.getAuth(app); if (auth.authStateReady) await auth.authStateReady();
      const db = F.getFirestore(app); const ref = F.doc(db, 'brand_studio', 'main');
      let unsub = null;
      const go = (u) => {
        if (unsub) { unsub(); unsub = null; } CL = null;
        if (!u) { SY = { st: 'local' }; drawPicks(); return; }
        CL = { F, ref }; SY = { st: 'wait' }; drawPicks();
        unsub = F.onSnapshot(ref, (snap) => {
          const d = (snap.exists() && snap.data()) || {}; const a = H.mergeMap(S.picks, d.picks), b = H.mergeMap(S.vars, d.vars);
          S.picks = a.out; S.vars = b.out; saveLocal(); SY = { st: 'cloud' }; syncAll(); drawPicks(); if (E) drawVList();
          if (a.up.length) push('picks', a.up); if (b.up.length) push('vars', b.up);
        }, (err) => { CL = null; SY = { st: /permission/i.test(String(err && err.code)) ? 'deny' : 'local' }; drawPicks(); });
      };
      go(auth.currentUser); Au.onAuthStateChanged(auth, (u) => { if (!!u !== !!CL) go(u); });
    } catch (e) { CL = null; SY = { st: 'local' }; drawPicks(); }
  }
  function push(field, keys) {
    if (!CL || !keys || !keys.length) return; const src = field === 'picks' ? S.picks : S.vars; const o = {};
    for (const k of keys) if (src[k]) o[k] = src[k];
    CL.F.setDoc(CL.ref, { [field]: o, t: now() }, { merge: true }).catch((err) => { if (/permission/i.test(String(err && err.code))) { SY = { st: 'deny' }; drawPicks(); } toast('클라우드에 못 올림 — 이 기기에는 저장됨'); });
  }

  /* ═════════ 변형 창 ═════════ */
  const SRC = {}; let E = null; let dlg = null;
  async function source(f) {
    const u = url(f); if (!u) throw new Error('그림 경로가 없음');
    if (!SRC[u]) SRC[u] = fetch(u, { cache: 'force-cache' }).then((r) => { if (!r.ok) throw new Error('그림을 못 읽음 ' + r.status); return r.text(); }).then((t) => { const P = H.prep(t, window); measure(P); return P; });
    try { return await SRC[u]; } catch (e) { delete SRC[u]; throw e; }
  }
  function measure(P) {
    const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-20000px;top:0;width:900px;visibility:hidden;pointer-events:none';
    box.innerHTML = new XMLSerializer().serializeToString(P.svg); document.body.appendChild(box);
    try {
      for (const w of box.querySelectorAll('[data-lp]')) { try { const b = w.getBBox(); P.bb[w.getAttribute('data-lp')] = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch (e) { /* 안 보이는 부분 */ } }
      for (const L of P.lines) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const id of L.g) { const b = P.bb[id]; if (!b) continue; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); } if (x0 < Infinity) P.bb[L.id] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
    } finally { box.remove(); }
  }
  const KINDS = [['light', '밝은 바탕'], ['dark', '어두운 바탕'], ['icon', '아이콘']];
  const loadedFonts = {};
  function loadFont(n) { const f = FONT(n); if (!f || loadedFonts[n]) return; loadedFonts[n] = 1; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + fontQ(f) + '&display=swap'; document.head.appendChild(l); }

  function ensureDlg() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog'); dlg.id = 'lp-dlg';
    dlg.innerHTML = '<div class="lp-in"><div class="lp-top"><h3 id="lp-tt"></h3><span id="lp-kinds"></span><span class="lp-vlist" id="lp-vl"></span><button type="button" class="lp-b lp-x" data-ea="close" aria-label="닫기" title="닫기(Esc · 바깥 누르기)">✕</button></div>' +
      '<div class="lp-pv"><div id="lp-prev" class="bl"></div><div class="lp-pvb">바탕 <button type="button" class="lp-b" data-ea="bg" data-v="bl">밝게</button><button type="button" class="lp-b" data-ea="bg" data-v="bd">어둡게</button><button type="button" class="lp-b" data-ea="bg" data-v="bc">투명 칸</button><span class="lp-sp" style="flex:1"></span><span id="lp-hint" class="lp-note">그림의 부분을 누르면 그 부분을 고칩니다</span></div></div>' +
      '<div id="lp-panel"></div>' +
      '<div class="lp-bot"><button type="button" class="lp-b" data-ea="undo" title="Ctrl+Z">↶ 되돌리기</button><button type="button" class="lp-b" data-ea="redo" title="Ctrl+Shift+Z">↷ 다시</button><button type="button" class="lp-b" data-ea="reset">처음으로</button>' +
      '<span style="flex:1"></span><input id="lp-name" type="text" maxlength="40" placeholder="변형 이름"><button type="button" class="lp-b pri" data-ea="save">💾 새로 저장</button><button type="button" class="lp-b" data-ea="over" id="lp-over">덮어쓰기</button><button type="button" class="lp-b" data-ea="trash" id="lp-trash">버리기</button>' +
      '<button type="button" class="lp-b" data-ea="svg">⬇ SVG</button><button type="button" class="lp-b" data-ea="png">⬇ PNG</button></div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) { closeEd(); return; } onEdClick(e); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeEd(); });
    dlg.addEventListener('input', onEdInput); dlg.addEventListener('change', onEdChange);
    dlg.addEventListener('dblclick', (e) => { const r = e.target.closest('input[type=range][data-f]'); if (r) { setF(r.getAttribute('data-f'), null); commit(); drawPanel(); pv(); } });
    dlg.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') return;
      const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    });
    return dlg;
  }
  async function openEd(k, vid) {
    const rec = S.picks[k]; if (!rec) return; ensureDlg();
    const V = vid && S.vars[vid] && S.vars[vid].k === k ? S.vars[vid] : null; const dr = !V && jget(LSD, {})[k];
    E = { k, rec, kind: (V && V.kind) || (dr && dr.kind) || 'light', sts: JSON.parse(JSON.stringify((V && V.sts) || (dr && dr.sts) || {})), vid: V ? vid : (dr && dr.vid && S.vars[dr.vid] ? dr.vid : null), sel: '*', hist: [], fut: [], P: null, bg: null, nm: V ? V.name : (dr && dr.name) || '' };
    E.base = JSON.stringify(E.sts);
    document.getElementById('lp-tt').textContent = '✏ ' + rec.name; document.getElementById('lp-name').value = E.nm;
    if (!dlg.open) dlg.showModal();
    drawVList(); await useKind(E.kind);
    if (dr && !V) toast('지난번 고치던 것을 이어서 엽니다 — 처음으로를 누르면 원래 그림', ['처음으로', () => doReset()]);
  }
  function closeEd() { if (!E) { if (dlg && dlg.open) dlg.close(); return; } saveDraft(); E = null; if (dlg.open) dlg.close(); drawPicks(); }
  async function useKind(kind) {
    if (!E) return; const f = E.rec[kind]; E.kind = kind; E.sel = '*';
    document.getElementById('lp-kinds').innerHTML = KINDS.filter((x) => E.rec[x[0]]).map((x) => '<button type="button" class="lp-b' + (x[0] === kind ? ' on' : '') + '" data-ea="kind" data-v="' + x[0] + '">' + x[1] + '</button>').join(' ');
    const pr = document.getElementById('lp-prev'); pr.innerHTML = '<p class="lp-note">그림을 읽는 중…</p>'; pr.className = E.bg || (kind === 'dark' ? 'bd' : 'bl');
    try { E.P = await source(f); } catch (e) { E.P = null; pr.innerHTML = '<p class="lp-note">그림을 읽지 못했습니다(' + esc(e.message) + ') — 닫고 다시 열어 주세요.</p>'; document.getElementById('lp-panel').innerHTML = ''; return; }
    if (!E || E.kind !== kind) return;
    const st = cur(); for (const L of E.P.lines) { const o = st.parts[L.id]; if (o && o.font) loadFont(o.font); } for (const a of st.adds) { const o = st.parts[a.id]; if (o && o.font) loadFont(o.font); }
    drawPanel(); pv();
  }
  const cur = () => { const st = E.sts[E.kind] = E.sts[E.kind] || H.blank(); st.g = st.g || {}; st.pal = st.pal || {}; st.parts = st.parts || {}; st.adds = st.adds || []; return st; };
  const partList = () => {
    const st = cur(); const P = E.P; let i = 0, j = 0;
    return [['*', '전체(모든 부분)']].concat(P.lines.map((L) => [L.id, '글자 줄 ' + (++i) + ' · 윤곽선 ' + L.n + '자' + (L.col ? ' · ' + L.col : '')]),
      P.shapes.map((s) => [s.id, (TAGKO[s.tag] || s.tag) + ' ' + (++j) + (s.col ? ' · ' + s.col : '')]),
      st.adds.filter((a) => !a.gone).map((a, n) => [a.id, (a.type === 'text' ? '더한 글씨 ' : '더한 모양 ') + (n + 1) + (a.type === 'text' ? ' · ' + String((st.parts[a.id] || {}).txt || a.txt || '').slice(0, 10) : ' · ' + ((SHAPE(a.shape) || {}).n || ''))]));
  };
  const kindOf = (pid) => (pid === '*' ? 'all' : pid[0] === 'L' ? 'line' : pid[0] === 'a' ? ((cur().adds.find((a) => a.id === pid) || {}).type === 'text' ? 'addtext' : 'addshape') : 'shape');
  const SL_G = [['sat', '채도', 0, 200, 100, '%'], ['light', '밝기', -100, 100, 0, ''], ['hue', '색조', -180, 180, 0, '°'], ['pad', '여백', 0, 40, 0, '%']];
  const SL_C = [['sat', '채도', 0, 200, 100, '%'], ['light', '밝기', -100, 100, 0, ''], ['hue', '색조', -180, 180, 0, '°']];
  const SL_T = [['s', '크기', 10, 300, 100, '%'], ['sx', '가로 늘이기', 10, 300, 100, '%'], ['sy', '세로 늘이기', 10, 300, 100, '%'], ['r', '돌리기', -180, 180, 0, '°'], ['k', '기울이기', -60, 60, 0, '°'], ['dx', '옮기기 ↔', -100, 100, 0, '%'], ['dy', '옮기기 ↕', -100, 100, 0, '%'], ['round', '둥글기', 0, 100, 0, ''], ['sw', '선 굵기', 0, 400, 100, '%'], ['op', '진하기', 0, 100, 100, '%']];
  const SL_X = [['fs', '글씨 크기', 20, 300, 100, '%'], ['ls', '자간', -20, 80, 0, '']];
  function getF(f) { const st = cur(); const [a, b] = f.split('.'); if (a === 'g') return st.g[b]; if (a === 'pal') return st.pal[b]; if (a === 'add') { const x = st.adds.find((y) => y.id === E.sel); return x ? x[b] : undefined; } return (st.parts[E.sel] || {})[b]; }
  function setF(f, v) {
    const st = cur(); const [a, b] = f.split('.');
    if (a === 'g') { if (v == null) delete st.g[b]; else st.g[b] = v; return; }
    if (a === 'pal') { if (v == null || v === b) delete st.pal[b]; else st.pal[b] = v; return; }
    if (a === 'add') { const x = st.adds.find((y) => y.id === E.sel); if (x) { if (v == null) delete x[b]; else x[b] = v; } return; }
    if (E.sel === '*') return; const o = st.parts[E.sel] = st.parts[E.sel] || {};
    if (v == null || v === '') delete o[b]; else o[b] = v; if (!Object.keys(o).length) delete st.parts[E.sel];
  }
  const slider = (pre, d) => { const v = getF(pre + '.' + d[0]); const val = v == null ? d[4] : v; return '<label class="lp-sl"><span>' + d[1] + '</span><input type="range" data-f="' + pre + '.' + d[0] + '" min="' + d[2] + '" max="' + d[3] + '" step="1" value="' + esc(val) + '" title="두 번 누르면 원래대로"><output>' + esc(val) + d[5] + '</output></label>'; };
  const colorIn = (f, base, lab) => { const v = getF(f) || base || '#000000'; return '<label class="lp-row">' + lab + ' <input type="color" data-f="' + f + '" value="' + esc(H.norm(v) || '#000000') + '"><button type="button" class="lp-b" data-ea="clr" data-f="' + f + '">원래 색</button></label>'; };
  const shapeGrid = (curId, act) => '<div class="lp-sh">' + SHAPES.map((s) => '<button type="button" title="' + esc(s.n) + '" data-ea="' + act + '" data-v="' + s.id + '"' + (s.id === curId ? ' class="on"' : '') + '><svg viewBox="0 0 100 100">' + s.d.map((d) => d[0] === '!' ? '<path fill-rule="evenodd" d="' + d.slice(1) + '"/>' : '<path d="' + d + '"/>').join('') + '</svg></button>').join('') + '</div>';
  function drawPanel() {
    if (!E || !E.P) return; const st = cur(); const P = E.P; const sel = E.sel; const kd = kindOf(sel); const o = st.parts[sel] || {};
    const opts = partList().map((x) => '<option value="' + esc(x[0]) + '"' + (x[0] === sel ? ' selected' : '') + '>' + esc(x[1]) + '</option>').join('');
    let h = '<div class="lp-row"><b>고칠 부분</b> <select data-ea2="sel" style="flex:1">' + opts + '</select></div>';
    h += '<details open><summary>🎨 전체 — 채도·밝기·색조·여백</summary>' + SL_G.map((d) => slider('g', d)).join('') + '</details>';
    if (P.pal.length) h += '<details' + (sel === '*' ? ' open' : '') + '><summary>🖌 같은 색 한꺼번에 바꾸기 (' + P.pal.length + '색)</summary><div class="lp-pal">' + P.pal.slice(0, 24).map((c) => '<label><input type="color" data-f="pal.' + c + '" value="' + esc(st.pal[c] || c) + '" title="원래 ' + c + '">' + c + '</label>').join('') + '</div><p class="lp-note">원래 색을 쓰는 모든 부분이 함께 바뀝니다 · 되돌리기는 ↶</p></details>';
    if (sel !== '*') {
      const sp = P.shapes.find((s) => s.id === sel); const L = P.lines.find((x) => x.id === sel); const A = st.adds.find((a) => a.id === sel);
      const baseF = sp ? (sp.col && sp.col[0] === '#' ? sp.col : '') : L ? L.col : A ? A.col : '';
      const hasStroke = sp && E.P.svg.querySelector('[data-lp="' + sel + '"] [data-lps]');
      h += '<details open><summary>✏ 고른 부분 — 색·채도</summary>' + colorIn('p.fill', baseF, '채우기 색') + (hasStroke ? colorIn('p.stroke', hasStroke.getAttribute('data-lps'), '선 색') : '') + SL_C.map((d) => slider('p', d)).join('') +
        '<label class="lp-row"><input type="checkbox" data-f="p.hide"' + (o.hide ? ' checked' : '') + '> 이 부분 숨기기</label></details>';
      h += '<details open><summary>📐 크기·모양 바꾸기</summary>' + SL_T.filter((d) => !(d[0] === 'sw' && !hasStroke)).map((d) => slider('p', d)).join('') + '<p class="lp-note">둥글기 — 네모는 모서리, 다른 모양·글자는 같은 색 둥근 테두리로 모서리를 굴림</p></details>';
      if (kd === 'shape') h += '<details' + (o.rep ? ' open' : '') + '><summary>🔁 다른 모양으로 대체</summary>' + shapeGrid(o.rep, 'rep') + '<div class="lp-row"><label><input type="checkbox" data-f="p.keep"' + (o.keep === false ? '' : ' checked') + '> 비율 지키기</label><button type="button" class="lp-b" data-ea="rep" data-v="">원래 모양</button></div></details>';
      if (kd === 'addshape') h += '<details open><summary>🔁 모양 고르기 · 자리</summary>' + shapeGrid(A.shape, 'ashape') + slider('add', ['cx', '가로 자리', 0, 100, 50, '%']) + slider('add', ['cy', '세로 자리', 0, 100, 50, '%']) + slider('add', ['size', '바탕 크기', 2, 100, 30, '%']) + '<button type="button" class="lp-b" data-ea="agone">이 더한 것 빼기</button></details>';
      if (kd === 'line' || kd === 'addtext') {
        const fo = FONT(o.font) || FONTS[0];
        h += '<details open><summary>🔤 글씨 — 바꾸기·글꼴·크기</summary>' +
          (kd === 'line' ? '<p class="lp-note">원래 글씨는 윤곽선(그림)이라 글자를 알 수 없습니다 — 아래에 글씨를 넣으면 고른 글꼴로 바꿔 그립니다(비우면 원래 윤곽선)</p>' : '') +
          '<div class="lp-row"><input type="text" data-f="p.txt" maxlength="40" style="flex:1" placeholder="새 글씨 입력" value="' + esc(o.txt != null ? o.txt : kd === 'addtext' ? A.txt : '') + '"></div>' +
          '<div class="lp-row">' + ['북스퀸', 'BOOKSQUEEN', 'booksqueen', 'Books Queen', '책방'].map((t) => '<button type="button" class="lp-b" data-ea="qt" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
          '<div class="lp-row">글꼴 <select data-f="p.font" style="flex:1">' + ['한', '영'].map((g) => '<optgroup label="' + (g === '한' ? '한글' : '영문') + '">' + FONTS.filter((f) => f.k === g).map((f) => '<option' + (f.n === fo.n ? ' selected' : '') + '>' + esc(f.n) + '</option>').join('') + '</optgroup>').join('') + '</select></div>' +
          '<div class="lp-row">굵기 <select data-f="p.wt">' + fo.w.map((w) => '<option' + (num(o.wt, fo.w.indexOf(700) >= 0 ? 700 : fo.w[fo.w.length - 1]) === w ? ' selected' : '') + '>' + w + '</option>').join('') + '</select>' +
          (kd === 'line' ? ' 맞춤 <select data-f="p.al">' + [['start', '왼쪽'], ['middle', '가운데'], ['end', '오른쪽']].map((x) => '<option value="' + x[0] + '"' + ((o.al || 'start') === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select>' : '') + '</div>' +
          SL_X.map((d) => slider('p', d)).join('') + '</details>';
      }
    }
    h += '<details' + (sel === '*' ? ' open' : '') + '><summary>➕ 모양·글씨 더하기</summary>' + shapeGrid('', 'addshape') + '<div class="lp-row"><button type="button" class="lp-b" data-ea="addtext">＋ 글씨 줄 더하기</button></div><p class="lp-note">더한 것은 맨 위 층 · 고칠 부분에서 골라 색·크기·자리를 바꿈</p></details>';
    h += '<p class="lp-note">원본 파일은 바뀌지 않습니다 — 변형은 고침 기록으로만 저장(' + (SY.st === 'cloud' ? '모든 기기 같게' : '이 기기') + ') · 저장하지 않고 닫아도 임시로 남습니다</p>';
    document.getElementById('lp-panel').innerHTML = h;
  }
  let pvT = 0;
  function pv() {
    if (pvT) return; pvT = requestAnimationFrame(() => {
      pvT = 0; if (!E || !E.P) return; const pr = document.getElementById('lp-prev');
      try { pr.innerHTML = H.render(E.P, cur()); } catch (e) { pr.innerHTML = '<p class="lp-note">그리지 못함: ' + esc(e.message) + '</p>'; return; }
      const sv = pr.querySelector('svg'); if (sv) { sv.removeAttribute('width'); sv.removeAttribute('height'); sv.style.width = '100%'; sv.style.height = '100%'; }
      if (S.cfg.hl !== false && E.sel !== '*') pr.querySelectorAll('[data-lp="' + E.sel + '"],[data-lpl="' + E.sel + '"]').forEach((x) => x.setAttribute('data-lp-hl', '1'));
      document.getElementById('lp-over').hidden = !E.vid; document.getElementById('lp-trash').hidden = !E.vid;
    });
  }
  function drawVList() {
    if (!E) return; const vs = varsOf(E.k);
    document.getElementById('lp-vl').innerHTML = vs.length ? '변형: ' + vs.map((v) => '<button type="button" class="lp-v' + (v.id === E.vid ? ' cur' : '') + (v.gone ? ' gone' : '') + '" data-ea="var" data-v="' + esc(v.id) + '">' + esc(v.name || '변형') + (v.gone ? ' (버림 · 눌러 되살림)' : '') + '</button>').join('') + '<button type="button" class="lp-v" data-ea="orig">원래 그림</button>' : '';
  }
  function commit() { if (!E) return; const s = JSON.stringify(E.sts); if (s === E.base) return; E.hist.push(E.base); if (E.hist.length > 120) E.hist.shift(); E.fut = []; E.base = s; saveDraft(); }
  function undo() { if (!E || !E.hist.length) { toast('되돌릴 것이 없습니다'); return; } E.fut.push(E.base); E.base = E.hist.pop(); E.sts = JSON.parse(E.base); saveDraft(); drawPanel(); pv(); }
  function redo() { if (!E || !E.fut.length) { toast('다시 할 것이 없습니다'); return; } E.hist.push(E.base); E.base = E.fut.pop(); E.sts = JSON.parse(E.base); saveDraft(); drawPanel(); pv(); }
  function doReset() { if (!E) return; E.sts[E.kind] = H.blank(); commit(); E.sel = '*'; drawPanel(); pv(); toast('이 그림을 처음 모습으로 — ↶ 되돌리기로 돌아갈 수 있음'); }
  function saveDraft() { if (!E) return; const all = jget(LSD, {}); const empty = Object.keys(E.sts).every((k) => H.isBlank(E.sts[k])); if (empty && !E.vid) delete all[E.k]; else all[E.k] = { kind: E.kind, sts: E.sts, vid: E.vid, name: document.getElementById('lp-name').value, t: now() }; jset(LSD, all); }
  const cleanSts = () => { const o = {}; for (const k of Object.keys(E.sts)) if (!H.isBlank(E.sts[k])) o[k] = E.sts[k]; return o; };
  function saveVar(over) {
    if (!E) return; const name = (document.getElementById('lp-name').value || '').trim().slice(0, 40) || (E.rec.name.split(' ').slice(-1)[0] + ' 변형 ' + (varsOf(E.k).length + 1));
    const sts = cleanSts(); if (!Object.keys(sts).length) { toast('아직 바꾼 것이 없습니다'); return; }
    let id = over && E.vid; const t = now();
    if (!id) { id = 'v' + t.toString(36) + Math.random().toString(36).slice(2, 5); S.vars[id] = { k: E.k, name, kind: E.kind, sts, c: t, t }; }
    else S.vars[id] = Object.assign({}, S.vars[id], { name, kind: E.kind, sts, gone: false, t });
    E.vid = id; document.getElementById('lp-name').value = name; saveLocal(); push('vars', [id]); const all = jget(LSD, {}); delete all[E.k]; jset(LSD, all);
    drawVList(); drawPicks(); pv(); toast((over ? '덮어썼습니다 — ' : '저장했습니다 — ') + name + (SY.st === 'cloud' ? ' (모든 기기)' : ' (이 기기)'));
  }
  function trashVar() {
    if (!E || !E.vid) return; const id = E.vid; S.vars[id] = Object.assign({}, S.vars[id], { gone: true, t: now() }); saveLocal(); push('vars', [id]); E.vid = null; drawVList(); drawPicks(); pv();
    toast('변형을 버렸습니다(지우지 않음 · ⚙ 버린 변형도 보기로 되살림)', ['되살리기', () => { S.vars[id] = Object.assign({}, S.vars[id], { gone: false, t: now() }); saveLocal(); push('vars', [id]); if (E) { E.vid = id; drawVList(); pv(); } drawPicks(); }]);
  }
  const fname = (ext) => ('booksqueen_' + E.k + '_' + E.kind + '_' + ((document.getElementById('lp-name').value || '').trim() || '변형')).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 90) + '.' + ext;
  async function fontCss(st) {
    const fs = H.usedFonts(st, E.P); if (!fs.length) return '';
    const out = [];
    for (const x of fs) {
      try {
        const chars = Array.from(new Set(Array.from(x.t))).join('');
        const cssT = await fetch('https://fonts.googleapis.com/css2?family=' + fontQ(x.f, x.f.w.length === 1 ? 0 : x.w) + '&text=' + encodeURIComponent(chars)).then((r) => (r.ok ? r.text() : ''));
        const m = /src:\s*url\(([^)]+)\)\s*format\('([\w-]+)'\)/.exec(cssT); if (!m) throw new Error('no src');
        const buf = await fetch(m[1].replace(/["']/g, '')).then((r) => r.arrayBuffer()); let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        out.push("@font-face{font-family:'" + x.f.n + "';font-weight:" + x.w + ";src:url(data:font/" + (m[2] === 'woff2' ? 'woff2' : m[2]) + ';base64,' + btoa(bin) + ") format('" + m[2] + "')}");
      } catch (e) { out.push(''); toast('글꼴 ' + x.f.n + '을(를) 그림 안에 넣지 못해 다른 기기에선 비슷한 글꼴로 보일 수 있음'); }
    }
    return out.join('');
  }
  async function exportSvg() { const st = cur(); const c = await fontCss(st); return H.render(E.P, st, { clean: true, css: c || '', title: '북스퀸 로고 변형 — ' + E.rec.name + ' · ' + ((document.getElementById('lp-name').value || '').trim() || '변형') }); }
  const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); };
  async function doSvg() { if (!E || !E.P) return; toast('SVG를 만드는 중…'); const s = await exportSvg(); dl(new Blob([s], { type: 'image/svg+xml' }), fname('svg')); }
  async function doPng() {
    if (!E || !E.P) return; toast('PNG를 만드는 중…'); const s = await exportSvg(); const pad = num(cur().g.pad, 0); const vw = E.P.vb.w * (1 + 2 * pad / 100), vh = E.P.vb.h * (1 + 2 * pad / 100);
    const L = clamp(+S.cfg.png || 1024, 64, 8192); const k = L / Math.max(vw, vh); const W = Math.max(1, Math.round(vw * k)), Hh = Math.max(1, Math.round(vh * k));
    const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; cv.getContext('2d').drawImage(im, 0, 0, W, Hh); cv.toBlob((b) => (b ? dl(b, fname('png')) : toast('PNG를 만들지 못함')), 'image/png'); };
    im.onerror = () => toast('PNG를 만들지 못함 — SVG 받기를 써 주세요'); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1').replace('<svg', '<svg width="' + W + '" height="' + Hh + '"'));
  }
  function onEdClick(e) {
    const pr = e.target.closest('#lp-prev');
    if (pr && E && E.P) { const l = e.target.closest('[data-lpl]'); const p = e.target.closest('[data-lp]'); const id = l ? l.getAttribute('data-lpl') : p ? p.getAttribute('data-lp') : '*'; if (id !== E.sel) { E.sel = id; drawPanel(); pv(); } return; }
    const b = e.target.closest('[data-ea]'); if (!b || !E) { if (b && b.getAttribute('data-ea') === 'close') closeEd(); return; }
    const a = b.getAttribute('data-ea'), v = b.getAttribute('data-v'); const st = E.P ? cur() : null;
    if (a === 'close') closeEd();
    else if (a === 'kind') { commit(); useKind(v); }
    else if (a === 'bg') { E.bg = v; document.getElementById('lp-prev').className = v; }
    else if (a === 'undo') undo(); else if (a === 'redo') redo(); else if (a === 'reset') doReset();
    else if (a === 'save') saveVar(false); else if (a === 'over') saveVar(true); else if (a === 'trash') trashVar();
    else if (a === 'svg') doSvg().catch((err) => toast('SVG를 만들지 못함: ' + err.message)); else if (a === 'png') doPng().catch((err) => toast('PNG를 만들지 못함: ' + err.message));
    else if (a === 'var') { const V = S.vars[v]; if (!V) return; if (V.gone) { S.vars[v] = Object.assign({}, V, { gone: false, t: now() }); saveLocal(); push('vars', [v]); toast('되살렸습니다'); } commit(); E.vid = v; E.sts = JSON.parse(JSON.stringify(V.sts || {})); E.base = JSON.stringify(E.sts); document.getElementById('lp-name').value = V.name || ''; drawVList(); useKind(V.kind || 'light'); }
    else if (a === 'orig') { commit(); E.vid = null; E.sts = {}; commit(); document.getElementById('lp-name').value = ''; drawVList(); useKind(E.kind); }
    else if (!st) return;
    else if (a === 'clr') { setF(b.getAttribute('data-f'), null); commit(); drawPanel(); pv(); }
    else if (a === 'rep') { setF('p.rep', v || null); commit(); drawPanel(); pv(); }
    else if (a === 'ashape') { setF('add.shape', v); commit(); drawPanel(); pv(); }
    else if (a === 'addshape') { const id = 'a' + now().toString(36); st.adds.push({ id, type: 'shape', shape: v, cx: 50, cy: 50, size: 30, col: '#c9a24a' }); E.sel = id; commit(); drawPanel(); pv(); }
    else if (a === 'addtext') { const id = 'a' + now().toString(36); st.adds.push({ id, type: 'text', txt: '북스퀸', cx: 50, cy: 50, size: 22, col: E.kind === 'dark' ? '#f3d58a' : '#1d2b45' }); E.sel = id; commit(); drawPanel(); pv(); }
    else if (a === 'agone') { setF('add.gone', true); E.sel = '*'; commit(); drawPanel(); pv(); toast('더한 것을 뺐습니다', ['되돌리기', undo]); }
    else if (a === 'qt') { setF('p.txt', v); commit(); drawPanel(); pv(); }
  }
  const fval = (el) => (el.type === 'checkbox' ? (el.getAttribute('data-f') === 'p.keep' ? (el.checked ? null : false) : el.checked || null) : el.type === 'range' ? +el.value : el.value);
  function onEdInput(e) {
    const el = e.target; if (!E || !E.P) return;
    if (el.getAttribute('data-ea2') === 'sel') return;
    const f = el.getAttribute('data-f'); if (!f) return;
    if (el.type === 'range') { const o = el.parentNode.querySelector('output'); if (o) o.textContent = el.value + (o.textContent.replace(/^-?[\d.]+/, '') || ''); }
    if (el.type === 'range' || el.type === 'color' || el.type === 'text') { setF(f, fval(el)); pv(); }
  }
  function onEdChange(e) {
    const el = e.target; if (!E || !E.P) return;
    if (el.getAttribute('data-ea2') === 'sel') { E.sel = el.value; drawPanel(); pv(); return; }
    const f = el.getAttribute('data-f'); if (!f) return;
    setF(f, fval(el)); if (f === 'p.font') { loadFont(el.value); const fo = FONT(el.value); const w = getF('p.wt'); if (fo && w != null && fo.w.indexOf(+w) < 0) setF('p.wt', null); }
    if (f === 'p.wt') setF(f, +el.value);
    commit(); if (el.type !== 'range' && el.type !== 'color' && el.type !== 'text') drawPanel(); else if (f === 'p.txt') drawPanel(); pv();
  }

  /* ───────── 붙이기 ───────── */
  function mount(opt) {
    if (O) return; O = Object.assign({ base: '', page: (location.pathname.split('/').pop() || 'index.html'), label: document.title }, opt || {});
    if (!/^[\w.-]{1,60}$/.test(O.page)) O.page = 'page';
    loadLocal(); css();
    const sec = document.createElement('section'); sec.id = 'lp-picks';
    const hd = document.querySelector(O.after || 'header'); if (hd && hd.parentNode) hd.parentNode.insertBefore(sec, hd.nextSibling); else document.body.insertBefore(sec, document.body.firstChild);
    sec.addEventListener('click', onPickClick); sec.addEventListener('change', onPickChange);
    document.addEventListener('click', (e) => { const b = e.target.closest('.lp-star'); if (!b) return; const c = b.closest('[data-lp-key]'); if (c) { e.preventDefault(); e.stopPropagation(); togglePick(c); } }, true);
    drawPicks(); decorate();
    let t = 0; new MutationObserver(() => { if (!t) t = requestAnimationFrame(() => { t = 0; decorate(); }); }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('storage', (e) => { if (e.key === LS) { loadLocal(); syncAll(); drawPicks(); } });
    cloudStart();
  }
  root.LP = { mount, H, open: openEd };
})(typeof window !== 'undefined' ? window : globalThis);
