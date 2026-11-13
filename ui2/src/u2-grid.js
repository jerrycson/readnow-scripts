/* 리드나우 2 — 격자 엔진 (설계안 5-1 · 정범님 Q7 답)
 * 가로 24칸(반 칸 맞춤을 켜면 0.5칸씩 = 48 위치) · 세로는 끝없이(칸 높이 기본 16px, 페이지마다 설정)
 * 화면이 좁으면 12 / 6 / 4칸으로 저절로(Q6 ①: PC 배치에서 저절로 만들고, 그 폭에서 따로 고칠 수 있음)
 * 위젯 자리 = { id, x, y, w, h } (x·w는 칸 단위 — 0.5 가능 · y·h는 줄 단위) + 고를 수 있는 lock(못 움직임)·float(겹쳐 놓기)
 * 그리기는 CSS Grid(브라우저가 배치 — 계산 적고 빠름) · 열 길(track)은 칸 수 × 2 (반 칸 맞춤용)
 * 이 파일의 계산 부분은 브라우저 밖(node)에서도 돌아감 — tests/t_grid_unit.js */
(function (root) {
  'use strict';
  const G = {};
  /* 폭 단계 — 근거: 없음(설계안은 1024·600) · 정범님 답 '24 → 12/6/4'에 맞춘 기본값, 설정으로 바꿈 */
  G.BPS = [
    { k: 'pc', min: 1200, cols: 24, name: 'PC' },
    { k: 'tab', min: 900, cols: 12, name: '12칸' },
    { k: 'sm', min: 600, cols: 6, name: '6칸' },
    { k: 'phone', min: 0, cols: 4, name: '휴대폰' },
  ];
  G.ROW_H = 16; /* 정범님 Q7 답: 칸 높이 16px 기본(설정) */
  G.bpOf = (width, bps) => { bps = bps || G.BPS; for (const b of bps) if (width >= b.min) return b; return bps[bps.length - 1]; };
  G.bpByKey = (k) => G.BPS.find((b) => b.k === k) || G.BPS[0];
  G.snap = (v, step) => Math.round(v / step) * step;
  G.overlap = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h && b.y < a.y + a.h;
  G.bottom = (list) => list.reduce((m, it) => Math.max(m, it.y + it.h), 0);
  G.clamp = (it, cols, step, lim) => {
    step = step || 1; lim = lim || {};
    const minW = Math.min(cols, lim.minW || step), minH = lim.minH || 1;
    let w = G.snap(+it.w || minW, step); w = Math.max(minW, Math.min(cols, lim.maxW ? Math.min(lim.maxW, w) : w));
    let x = G.snap(+it.x || 0, step); x = Math.max(0, Math.min(cols - w, x));
    let h = Math.round(+it.h || minH); h = Math.max(minH, lim.maxH ? Math.min(lim.maxH, h) : h);
    const y = Math.max(0, Math.round(+it.y || 0));
    it.x = x; it.y = y; it.w = w; it.h = h; return it;
  };
  const byPos = (a, b) => a.y - b.y || a.x - b.x;
  /* 겹침 밀어내기: 먼저 놓을 것(움직이지 않는 것·방금 옮긴 것)을 놓고, 나머지는 위→아래 차례로 겹치는 동안 아래로 밂 */
  G.resolve = (list, firstId) => {
    /* firstId: 먼저 놓을 위젯 id 하나 또는 여럿(배열 — 앞이 이김) */
    const fids = Array.isArray(firstId) ? firstId : firstId == null ? [] : [firstId]; const fset = new Set(fids);
    const solid = list.filter((it) => !it.float);
    const placed = [];
    solid.filter((it) => it.lock && !fset.has(it.id)).forEach((it) => placed.push(it));
    const pushDown = (it) => { let moved = true; while (moved) { moved = false; for (const p of placed) if (p !== it && G.overlap(it, p)) { it.y = p.y + p.h; moved = true; } } };
    fids.map((id) => solid.find((it) => it.id === id)).filter(Boolean).forEach((it) => { pushDown(it); placed.push(it); });
    solid.filter((it) => !it.lock && !fset.has(it.id)).sort(byPos).forEach((it) => { pushDown(it); placed.push(it); });
    return list;
  };
  /* 위로 붙이기(빈 줄을 위로 당김) — 페이지 설정으로 켬 */
  G.compact = (list) => {
    const placed = list.filter((it) => it.float || it.lock);
    list.filter((it) => !it.float && !it.lock).sort(byPos).forEach((it) => {
      while (it.y > 0) { it.y--; if (placed.some((p) => !p.float && G.overlap(it, p))) { it.y++; break; } }
      placed.push(it);
    });
    return list;
  };
  G.hasOverlap = (list) => { const s = list.filter((it) => !it.float); for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (G.overlap(s[i], s[j])) return [s[i].id, s[j].id]; return null; };
  /* 빈 곳 찾기(위→아래, 왼→오) */
  G.findSpace = (list, w, h, cols, step) => {
    step = step || 1; w = Math.min(w, cols); const s = list.filter((it) => !it.float); const maxY = G.bottom(s);
    for (let y = 0; y <= maxY; y++) for (let x = 0; x + w <= cols + 1e-9; x += step) { const c = { x, y, w, h }; if (!s.some((p) => G.overlap(c, p))) return { x, y }; }
    return { x: 0, y: maxY };
  };
  G.move = (list, id, x, y, cols, step, lim) => { const it = list.find((i) => i.id === id); if (!it || it.lock) return list; it.x = x; it.y = y; G.clamp(it, cols, step, lim); return G.resolve(list, id); };
  G.resize = (list, id, w, h, cols, step, lim) => { const it = list.find((i) => i.id === id); if (!it || it.lock) return list; it.w = w; it.h = h; G.clamp(it, cols, step, lim); return G.resolve(list, id); };
  /* 칸 수 바꾸기(비율대로) — 24 → 12 → 6 등 */
  G.scale = (src, fromCols, toCols, step) => {
    step = step || 1; const f = toCols / fromCols;
    const out = src.map((it) => { const n = Object.assign({}, it); n.w = Math.max(step, G.snap(it.w * f, step)); n.x = G.snap(it.x * f, step); return G.clamp(n, toCols, step); });
    return G.resolve(out.sort(byPos), null);
  };
  /* 휴대폰(좁은 폭) 흘리기: 읽는 차례(위→아래, 왼→오)대로 · 좁은 위젯(PC 6칸 이하)은 둘씩 한 줄, 나머지는 한 줄 다 씀 */
  G.flow = (src, fromCols, toCols) => {
    const half = Math.max(1, Math.floor(toCols / 2)); let x = 0, y = 0, rowH = 0; const out = [];
    src.filter((it) => !it.float).slice().sort(byPos).forEach((it) => {
      const w = it.w / fromCols <= 0.25 + 1e-9 ? half : toCols;
      if (x + w > toCols) { y += rowH; x = 0; rowH = 0; }
      out.push(Object.assign({}, it, { x, y, w })); x += w; rowH = Math.max(rowH, it.h);
      if (x >= toCols) { y += rowH; x = 0; rowH = 0; }
    });
    src.filter((it) => it.float).forEach((it) => out.push(G.clamp(Object.assign({}, it), toCols, 1)));
    return out;
  };
  G.derive = (pc, bp) => { const b = typeof bp === 'string' ? G.bpByKey(bp) : bp; if (b.cols >= 24) return pc.map((i) => Object.assign({}, i)); if (b.cols <= 4) return G.flow(pc, 24, b.cols); return G.scale(pc, 24, b.cols, 1); };
  /* 정범님 Q6: 좁은 폭 배치 = PC 배치를 저절로 흘린 것 위에 '그 폭에서 따로 고친 위젯'만 덮어 씀
   * → PC를 바꾸면 따로 고치지 않은 위젯은 다시 흘러가고, 따로 고친 위젯은 그 자리를 지킴 */
  G.overlay = (pc, bp, ov) => {
    const b = typeof bp === 'string' ? G.bpByKey(bp) : bp; const list = G.derive(pc, b);
    if (!ov || !ov.length) return list;
    const m = new Map(ov.map((i) => [i.id, i])); const ids = [];
    list.forEach((it) => { const o = m.get(it.id); if (o) { it.x = o.x; it.y = o.y; it.w = o.w; it.h = o.h; G.clamp(it, b.cols, 0.5); ids.push(it); } });
    return G.resolve(list, ids.sort(byPos).map((i) => i.id));
  };
  G.css = (it) => ({ gridColumn: Math.round(it.x * 2) + 1 + ' / span ' + Math.max(1, Math.round(it.w * 2)), gridRow: it.y + 1 + ' / span ' + Math.max(1, it.h) });

  /* ── 보기(브라우저) — 칸 틀을 만들고 자리만 바꿈(위젯 내용은 다시 그리지 않음) ── */
  G.View = function (host, opt) {
    this.host = host; this.opt = opt || {}; this.cells = new Map();
    this.el = document.createElement('div'); this.el.className = 'u2-grid'; host.appendChild(this.el);
  };
  G.View.prototype.setup = function (cols, rowH, half) {
    this.cols = cols; this.rowH = rowH || G.ROW_H; this.half = !!half;
    const s = this.el.style; s.gridTemplateColumns = 'repeat(' + cols * 2 + ', minmax(0, 1fr))'; s.gridAutoRows = this.rowH + 'px';
    this.el.dataset.cols = cols;
  };
  G.View.prototype.cell = function (id) { return this.cells.get(id); };
  G.View.prototype.place = function (items, extraRows) {
    if (this.dead) return;
    const keep = new Set();
    for (const it of items) {
      let c = this.cells.get(it.id);
      if (!c) { c = document.createElement('div'); c.className = 'u2-cell'; c.dataset.wid = it.id; this.el.appendChild(c); this.cells.set(it.id, c); if (this.opt.onNew) this.opt.onNew(c, it); }
      const st = G.css(it); const key = st.gridColumn + '|' + st.gridRow + '|' + (it.float ? 1 : 0) + (it.lock ? 1 : 0) + (it.z || 0);
      if (c._pk !== key) { c._pk = key; c.style.gridColumn = st.gridColumn; c.style.gridRow = st.gridRow; c.style.zIndex = it.float ? 5 + (it.z || 0) : ''; c.classList.toggle('u2-float', !!it.float); c.classList.toggle('u2-locked', !!it.lock); } /* 자리가 그대로인 칸은 건드리지 않음(끌기 중 장면마다 80칸 → 움직인 칸만) */
      keep.add(it.id);
    }
    for (const [id, c] of this.cells) if (!keep.has(id)) { if (this.opt.onGone) this.opt.onGone(c, id); c.remove(); this.cells.delete(id); }
    const mh = (G.bottom(items) + (extraRows || 0)) * this.rowH + 'px'; if (this.el.style.minHeight !== mh) this.el.style.minHeight = mh;
  };
  /* 화면 좌표 → 칸 좌표 */
  G.View.prototype.toCell = function (px, py) {
    const r = this.el.getBoundingClientRect(); const cw = r.width / this.cols;
    return { x: (px - r.left) / cw, y: (py - r.top) / this.rowH, cw, rh: this.rowH };
  };
  G.View.prototype.destroy = function () { this.dead = true; for (const [id, c] of this.cells) if (this.opt.onGone) this.opt.onGone(c, id); this.cells.clear(); this.el.remove(); };

  root.U2Grid = G;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
