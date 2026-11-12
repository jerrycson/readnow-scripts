/* grid.js — 🧩 모니터를 칸으로 나누는 셈 (PC 배치 도우미 · 브라우저 화면과 Node가 함께 씀 — 같은 셈이 두 곳에서 어긋나지 않게)
 *  기준(정범님 11/12): '일반 모니터'(기본 16:9)를 가로 4칸 · 세로 3칸으로 나눔.
 *   더 넓은 모니터는 칸 모양(가로세로 비)을 그대로 두고 가로 칸을 늘림 — 일반보다 가로가 1칸만큼 넓으면 5:3, 2칸이면 6:3 …
 *   세로로 세운 모니터는 거꾸로(세로 칸을 늘림) — 16:9를 세우면 3:4
 *  모니터마다 고를 수 있음: auto(위 셈) · fine(auto의 두 배로 잘게) · 'CxR'(8x6·2x2·3x2·2x1 …) · { cols, rows }(직접)
 *  자리는 모두 '실제 화소'(윈도우가 배율을 적용하기 전 · PowerShell이 DPI 인식 모드로 읽은 값)
 */
(function (root, factory) { const M = factory(); if (typeof module === 'object' && module.exports) module.exports = M; else root.PDGrid = M; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const BASE = { aw: 16, ah: 9, cols: 4, rows: 3 };
  const PRESETS = [
    { v: 'auto', t: '기본(자동)' }, { v: 'fine', t: '더 잘게(두 배)' },
    { v: '8x6', t: '8 × 6' }, { v: '6x4', t: '6 × 4' }, { v: '3x2', t: '3 × 2' }, { v: '2x2', t: '2 × 2' }, { v: '2x1', t: '2 × 1' }, { v: '1x1', t: '1 × 1(통째로)' }, { v: 'custom', t: '직접 입력' }];
  const MAXN = 24;
  const clampN = (n) => Math.max(1, Math.min(MAXN, Math.round(+n) || 1));
  function baseOf(b) { b = b || {}; const o = { ...BASE };
    for (const k of Object.keys(BASE)) if (Number.isFinite(+b[k]) && +b[k] > 0) o[k] = k === 'cols' || k === 'rows' ? clampN(b[k]) : +b[k];
    return o; }
  /* 모니터 비(가로/세로) — 일하는 칸(작업 표시줄 뺀 것)이 아니라 화면 전체로 셈(작업 표시줄 때문에 칸 수가 바뀌지 않게) */
  const aspectOf = (m) => { const b = (m && (m.b || m.wa)) || {}; return b.w > 0 && b.h > 0 ? b.w / b.h : 16 / 9; };
  function autoGrid(m, base) { base = baseOf(base); const a = aspectOf(m); const B = base.aw / base.ah;
    if (a >= 1) return { cols: clampN(Math.round((a * base.cols) / B)), rows: base.rows };
    return { cols: base.rows, rows: clampN(Math.round(((1 / a) * base.cols) / B)) }; }
  /* opt: 'auto' | 'fine' | '8x6' | { cols, rows } — 모르는 값이면 auto */
  function gridOf(m, opt, base) {
    if (opt && typeof opt === 'object' && (opt.cols != null || opt.rows != null)) return { cols: clampN(opt.cols), rows: clampN(opt.rows) };
    const s = String(opt || 'auto');
    if (s === 'fine') { const g = autoGrid(m, base); return { cols: clampN(g.cols * 2), rows: clampN(g.rows * 2) }; }
    const k = /^(\d{1,2})\s*[x×:]\s*(\d{1,2})$/i.exec(s); if (k) return { cols: clampN(k[1]), rows: clampN(k[2]) };
    return autoGrid(m, base); }
  /* 칸 → 화면 자리(실제 화소) · 칸 경계는 반올림해 틈·겹침이 없게(이웃 칸이 같은 선을 나눠 씀) */
  function cellRect(m, g, c, r, w, h) { const a = m.wa || m.b; w = w || 1; h = h || 1;
    const X = (i) => a.x + Math.round((a.w * i) / g.cols), Y = (j) => a.y + Math.round((a.h * j) / g.rows);
    return { x: X(c), y: Y(r), w: X(c + w) - X(c), h: Y(r + h) - Y(r) }; }
  /* 한 덩이를 창 n개로 나눔(크롬 '창 몇 개') — 넓으면 가로로, 높으면 세로로 */
  function splitRect(rc, n) { n = Math.max(1, Math.min(8, n | 0 || 1)); if (n === 1) return [rc]; const out = []; const horiz = rc.w >= rc.h;
    for (let i = 0; i < n; i++) { if (horiz) { const x0 = rc.x + Math.round((rc.w * i) / n), x1 = rc.x + Math.round((rc.w * (i + 1)) / n); out.push({ x: x0, y: rc.y, w: x1 - x0, h: rc.h }); }
      else { const y0 = rc.y + Math.round((rc.h * i) / n), y1 = rc.y + Math.round((rc.h * (i + 1)) / n); out.push({ x: rc.x, y: y0, w: rc.w, h: y1 - y0 }); } }
    return out; }
  /* 놓은 것(place)이 그 모니터 칸 안인가 */
  const inGrid = (p, g) => p && g && p.c >= 0 && p.r >= 0 && p.w >= 1 && p.h >= 1 && p.c + p.w <= g.cols && p.r + p.h <= g.rows;
  /* 같은 모니터에서 칸이 겹치는가(한 칸에 하나) */
  const hit = (a, b) => a.mon === b.mon && a.c < b.c + b.w && b.c < a.c + a.w && a.r < b.r + b.h && b.r < a.r + a.h;
  function overlaps(places) { const L = []; for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++) if (hit(places[i], places[j])) L.push([i, j]); return L; }
  /* 화면에 그릴 배치도 — 모든 모니터를 실제 상대 크기·위치대로 W×H 안에 맞춤 */
  function view(mons, W, H, pad) { pad = pad == null ? 8 : pad; if (!mons || !mons.length) return { s: 1, T: (r) => r, mons: [] };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const m of mons) { const b = m.b; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
    const s = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0)); const ox = pad + ((W - pad * 2) - (x1 - x0) * s) / 2, oy = pad + ((H - pad * 2) - (y1 - y0) * s) / 2;
    const T = (r) => ({ x: Math.round(ox + (r.x - x0) * s), y: Math.round(oy + (r.y - y0) * s), w: Math.round(r.w * s), h: Math.round(r.h * s) });
    return { s, T, mons: mons.map((m) => ({ id: m.id, b: T(m.b), wa: T(m.wa || m.b) })) }; }
  /* 배율(%) — DPI 96 = 100% */
  const scaleOf = (m) => Math.round(((m && m.dpi) || 96) / 96 * 100);
  return { BASE, PRESETS, MAXN, baseOf, aspectOf, autoGrid, gridOf, cellRect, splitRect, inGrid, overlaps, view, scaleOf };
});
