// shelf_ink — (11/11 shelf4) 책등 글을 '실제 잉크(그려진 점)'로 재서 겹침을 찾는 시험 조각(혼자 돌리지 않음 · tSHELF3FIT1111이 부름)
//   까닭: 글 상자(getClientRects)는 서로 안 겹쳐도 눕힌 영문(Python)·세운 숫자(1·3)·대체 글꼴은 상자 밖으로 그려져 옆 줄·옆 글자와 엉킴(리드 화면 확인 250%)
//   하는 일: 지금 화면에 보이는 책등마다 배경·무늬·장식을 숨기고 글자를 빨강·초록·파랑으로 칠해 화면을 찍은 뒤 점을 읽음
//     ① 줄(열) 사이: 이웃한 두 줄의 잉크 사이가 글자 크기의 10%(최소 2px)보다 가까운 높이가 2점 넘으면 '줄 엉킴'
//     ② 한 줄 안: 앞 글자 잉크와 다음 글자 잉크 사이 틈이 글자 크기 8%(최소 1px)보다 좁거나 파고들면 '글자 붙음'(한글↔눕힌 영문·세운 숫자·문장 부호 · 영문끼리는 뺌)
//     ③ 줄 시작: 여러 줄인데 둘째 줄부터 첫 줄보다 글자 크기의 60% 넘게 아래에서 시작하면 '줄 어긋남'(가운데 맞춤 때문에 '비밀 1'이 '왕조' 옆에 붙어 읽히던 것)
//     ④ 제목 잉크 ↔ 지은이 잉크 · 글 잉크 ↔ 띠(할인·NEW·주문중)·머리 장식 · 글 잉크가 책등 밖
//   화면을 칠해 두므로 부른 쪽이 page를 닫음
const COLS = ['#ff0000', '#00ff00', '#0000ff'];
const PREP = (COL) => {
  const css = document.createElement('style'); css.id = 'inkcss';
  css.textContent = '.bqs-case.cur .sp .sk{background:#fff!important;filter:none!important;box-shadow:none!important}.bqs-case.cur .sp.tiltl .sk,.bqs-case.cur .sp.tiltr .sk{transform:none!important}.bqs-case.cur .sp .sk::before,.bqs-case.cur .sp .sk::after{display:none!important}.bqs-case.cur .sp .hd,.bqs-case.cur .sp .hb,.bqs-case.cur .sp .bt,.bqs-case.cur .sp .rb,.bqs-case.cur .sp .si{visibility:hidden!important}.bqs-case.cur .sp .tt,.bqs-case.cur .sp .au{text-shadow:none!important;-webkit-text-stroke:0!important;opacity:1!important;color:transparent!important}.bqs-pop,.bqs-tip,.bqs-cart,.bqs-arrow{visibility:hidden!important}';
  document.head.appendChild(css); const out = []; window.__INKU = [];
  for (const b of document.querySelectorAll('.bqs-case.cur .sp')) { if (b.classList.contains('img') && b.classList.contains('ok')) continue; const r = b.querySelector('.sk').getBoundingClientRect(); if (r.bottom < 4 || r.top > innerHeight - 4 || r.right < 0 || r.left > innerWidth) continue;
    const S = { id: b.dataset.id, t: b.querySelector('.tt').textContent, sk: { l: r.left, r: r.right, t: r.top, b: r.bottom }, deco: [...b.querySelectorAll('.hd,.hb,.bt')].map((d) => d.getBoundingClientRect()).filter((d) => d.width && d.height).map((d) => ({ l: d.left, r: d.right, t: d.top, b: d.bottom })), el: [] };
    for (const el of b.querySelectorAll('.tt,.au')) { if (el.style.display === 'none' || !el.textContent.trim()) continue; const units = []; const fs = parseFloat(getComputedStyle(el).fontSize);
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
      for (const tn of ns) { const pa = tn.parentNode; if (pa.classList && pa.classList.contains('tcy')) { units.push(pa); continue; } const frag = document.createDocumentFragment(); /* 글자마다 칸으로 감쌈 — 줄 나눔은 그대로 */
        for (const ch of tn.data) { if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); continue; } const s = document.createElement('span'); s.textContent = ch; frag.appendChild(s); units.push(s); } pa.replaceChild(frag, tn); }
      const U0 = units.map((u) => ({ u, r: u.getBoundingClientRect() })).filter((x) => x.r.width > 0.3 && x.r.height > 0.3);
      const cols = []; for (const x of [...U0].sort((a, c) => (c.r.left + c.r.right) - (a.r.left + a.r.right))) { const cx = (x.r.left + x.r.right) / 2; const c = cols.find((k) => Math.abs(k.cx - cx) < Math.max(2, fs * 0.45)); if (c) c.u.push(x); else cols.push({ cx, u: [x] }); }
      cols.sort((a, c) => c.cx - a.cx); const kk = el.classList.contains('tt') ? 'tt' : 'au';
      const C = cols.map((c, i) => { const u = U0.filter((x) => c.u.includes(x)); u.sort((a, c2) => a.r.top - c2.r.top);
        return { col: COL[i % 3], l: Math.min(...u.map((x) => x.r.left)), r: Math.max(...u.map((x) => x.r.right)), t: Math.min(...u.map((x) => x.r.top)), b: Math.max(...u.map((x) => x.r.bottom)), txt: u.map((x) => x.u.textContent).join(''),
          u: u.map((x, k) => { window.__INKU.push({ e: x.u, k: kk, cc: COL[i % 3], uc: COL[k % 3], par: i % 2 }); return { c: x.u.textContent, uc: COL[k % 3], l: x.r.left, r: x.r.right, t: x.r.top, b: x.r.bottom }; }) }; });
      S.el.push({ k: kk, fs, cols: C }); }
    out.push(S); }
  return out;
};
/* 칠하기: 'tt'·'au' = 그 칸만 줄마다 번갈아 · 'tt0'·'tt1'·'au0'·'au1' = 그 칸의 짝수(0)/홀수(1) 줄만 글자마다 번갈아 */
const PAINT = (mode) => { const k = mode.slice(0, 2), par = mode.length > 2 ? +mode[2] : -1; for (const x of window.__INKU) x.e.style.color = x.k !== k ? 'transparent' : par < 0 ? x.cc : x.par === par ? x.uc : 'transparent'; };
const ANALYZE = async ([png, cases, dpr, mode]) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const D = g.getImageData(0, 0, cv.width, cv.height).data; const W = cv.width, H = cv.height; const CH = { '#ff0000': 0, '#00ff00': 1, '#0000ff': 2 };
  const ink = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const i = (y * W + x) * 4; const v = [D[i], D[i + 1], D[i + 2]]; const o = [0, 1, 2].filter((q) => q !== c); return v[c] - Math.max(v[o[0]], v[o[1]]) > 45; };
  const sx = (v) => Math.round(v * dpr); const k = mode.slice(0, 2), par = mode.length > 2 ? +mode[2] : -1; const res = {};
  /* 창(사각형) 안에서 그 색 잉크 — 높이별 왼끝·오른끝 · 전체 상자 */
  const scan = (col, l, r, t, b, sk) => { const ch = CH[col]; if (sk) { l = Math.max(l, sk.l - 2); r = Math.min(r, sk.r + 2); t = Math.max(t, sk.t - 2); b = Math.min(b, sk.b + 2); } const L = new Map(), R = new Map(); let bx = null; for (let y = sx(t); y <= sx(b); y++) for (let x = sx(l); x <= sx(r); x++) if (ink(x, y, ch)) { if (!L.has(y)) L.set(y, x); R.set(y, x); bx = bx ? { l: Math.min(bx.l, x), r: Math.max(bx.r, x), t: Math.min(bx.t, y), b: Math.max(bx.b, y) } : { l: x, r: x, t: y, b: y }; } return { L, R, bx }; };
  for (const S of cases) { const bad = []; let box = null; const E = S.el.find((e) => e.k === k); if (!E) continue; const em = E.fs * dpr; const nm = k === 'tt' ? '제목' : '지은이';
    if (par < 0) { const P = E.cols.map((c) => { const wd = c.r - c.l; return { ...scan(c.col, c.l - wd * 0.9, c.r + wd * 0.9, c.t - wd * 0.6, c.b + wd * 0.6, S.sk), txt: c.txt }; });
      for (const q of P) if (q.bx) box = box ? { l: Math.min(box.l, q.bx.l), r: Math.max(box.r, q.bx.r), t: Math.min(box.t, q.bx.t), b: Math.max(box.b, q.bx.b) } : { ...q.bx };
      const need = Math.max(2, em * 0.1); /* 이웃 줄 잉크 사이 틈이 글자 크기 10%(최소 2px)보다 좁으면 엉킴 */
      for (let i = 0; i < P.length; i++) for (const d of [1, 2]) { const a = P[i], c = P[i + d]; if (!c) continue; let hit = 0; for (const [y, xl] of a.L) for (const yy of [y - 1, y, y + 1]) { const xr = c.R.get(yy); if (xr != null && xl - xr < need) { hit++; break; } }
        if (hit >= 2) bad.push(`줄 엉킴 ${nm} 「${a.txt.slice(0, 6)}」↔「${c.txt.slice(0, 6)}」`); }
      if (P.length > 1 && P[0].bx) for (let i = 1; i < P.length; i++) if (P[i].bx && P[i].bx.t - P[0].bx.t > em * 0.6) { bad.push(`줄 어긋남 ${nm} 「${P[i].txt.slice(0, 6)}」이 ${Math.round((P[i].bx.t - P[0].bx.t) / em * 10) / 10}글자 아래에서 시작`); break; }
    } else { const need = Math.max(1, Math.round(em * 0.08)); /* 다음 글자 잉크 위끝 − 앞 글자 잉크 아래끝(점 하나가 1) — 한글·한자·세운 숫자·문장 부호가 끼면 글자 크기 8%(최소 1px 틈) 넘게 떨어져야 */
      E.cols.forEach((c, i) => { if (i % 2 !== par) return; const B = c.u.map((u) => { const pad = (u.r - u.l) * 0.35; return { c: u.c, ...scan(u.uc, u.l - pad, u.r + pad, u.t - pad, u.b + pad, S.sk) }; });
        for (let j = 0; j + 1 < B.length; j++) { const a = B[j].bx, n = B[j + 1].bx; if (!a || !n) continue; const lat = (c) => /^[\x21-\x7e]$/.test(c); if (lat(B[j].c) && lat(B[j + 1].c)) continue; /* 같은 낱말 안 영문·숫자끼리는 원래 붙어 있음 */
          const ox = Math.min(a.r, n.r) - Math.max(a.l, n.l); if (ox > 0 && n.t - a.b < need) bad.push(`글자 붙음 ${nm} 「${B[j].c}」↔「${B[j + 1].c}」 틈 ${n.t - a.b - 1}px`); } }); }
    res[S.id] = { box, bad }; }
  return res;
};
const meet = (a, c, e) => !!(a && c && Math.min(a.r, c.r) - Math.max(a.l, c.l) > e && Math.min(a.b, c.b) - Math.max(a.t, c.t) > e);
async function inkCheck(p, opt = {}) {
  const cases = await p.evaluate(PREP, COLS); const dpr = await p.evaluate(() => devicePixelRatio || 1); const R = {};
  for (const mode of ['tt', 'au', 'tt0', 'tt1', 'au0', 'au1']) { await p.evaluate(PAINT, mode); await p.waitForTimeout(40);
    const buf = await p.screenshot({ type: 'png' }); if (opt.shot && mode.length === 2) require('fs').writeFileSync(opt.shot.replace(/\.png$/, '_' + mode + '.png'), buf);
    R[mode] = await p.evaluate(ANALYZE, [buf.toString('base64'), cases, dpr, mode]); }
  const out = [];
  for (const S of cases) { const g = (m) => R[m][S.id] || {}; const bad = ['tt', 'au', 'tt0', 'tt1', 'au0', 'au1'].flatMap((m) => g(m).bad || []); const sx = (v) => Math.round(v * dpr); const box = { tt: g('tt').box, au: g('au').box };
    if (meet(box.tt, box.au, 0)) bad.push('제목 잉크↔지은이 잉크');
    for (const d of S.deco) { const dd = { l: sx(d.l), r: sx(d.r), t: sx(d.t), b: sx(d.b) }; for (const k of ['tt', 'au']) if (meet(box[k], dd, 0.5)) bad.push((k === 'tt' ? '제목' : '지은이') + ' 잉크↔띠·머리 장식'); }
    const sk = { l: sx(S.sk.l) - 2, r: sx(S.sk.r) + 2, t: sx(S.sk.t) - 2, b: sx(S.sk.b) + 2 }; /* 가장자리 번짐 2px까지 봐줌 */ for (const k of ['tt', 'au']) { const x = box[k]; if (x && (x.l < sk.l || x.r > sk.r || x.t < sk.t || x.b > sk.b)) bad.push((k === 'tt' ? '제목' : '지은이') + ` 잉크가 책등 밖(${[sk.l - x.l, x.r - sk.r, sk.t - x.t, x.b - sk.b].map((v) => Math.max(0, v)).join('/')}px)`); }
    if (bad.length) out.push({ id: S.id, t: S.t.slice(0, 18), bad }); }
  return { n: cases.length, bad: out, cases };
}
module.exports = { inkCheck };
