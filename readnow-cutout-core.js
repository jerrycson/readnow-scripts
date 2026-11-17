/* ✂ 묶음 사진 판별 엔진 — 공용 셈 (readnow-cutout-core.js · 일꾼 spine2 · 2026-11-14 · 정범님 11/14 18:13)
 *  「책등 나란히 놓고 찍은 사진 · 앞표지를 나란히·바둑판으로 놓고 찍은 사진 · 같은 배열로 뒤집어 찍은 뒷면 사진」에서
 *   물건 하나하나를 가르고(가르기) · 자를 자리를 정하고(자르기) · 어느 상품인지 맞추고(맞추기) · 얼마나 믿을지 매기고(확신) · 사람이 고친 것으로 다음 문턱을 다시 셈(배우기)
 *  돈 드는 길 없음(그림 AI·유료 API 안 씀) — 브라우저·휴대폰 캔버스 화소만으로 · 바코드 글자는 웹앱의 기존 바코드 읽기(기기 BarcodeDetector · ZXing wasm)가 줌
 *  그림 = { w, h, d: RGBA 화소 배열(Uint8ClampedArray) } · 모든 좌표는 받은 그림의 화소 · 결과 상자 = { cx, cy, w, h, a(라디안 · 긴 변 아님 · 그림 가로축 기준) }
 *  웹앱: window.ReadnowCutout · 클라우드(노드): module.exports — 화면·Firestore·저장소를 모름(순수 셈 · 시험 tCUT1114) */
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.ReadnowCutout = m; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = '0.1.3';
  /* 설정 기본값 — 근거: 시험 그림(tCUT1114)과 휴대폰 사진 크기에서 정한 첫 값 · 근거 없는 값은 '첫 값'이라 적고 웹앱 설정·배우기로 바꿈 */
  const DEF = {
    side: 640,          // 가르기는 긴 변 640화소로 줄여서(휴대폰 4000화소 그대로 셈하면 느림 · 자르기는 원본에서)
    band: 0.03,         // 가장자리 띠(바탕 색을 재는 곳) — 그림 변의 3%
    minDist: 34,        // 바탕과 이만큼(RGB 거리) 넘게 다르면 물건 화소 — 첫 값
    spreadK: 3.2,       // 바탕 색 흔들림(중앙 절대 편차) × 이 값도 문턱 후보(큰 쪽)
    close: 2,           // 글자·무늬 구멍 메우기(늘렸다 줄이기 반지름)
    open: 1,            // 바탕 잡티 지우기(줄였다 늘리기)
    minArea: 0.004,     // 그림 넓이의 0.4%보다 작은 덩어리는 잡티
    /* (0.1.1 · 일꾼 resume3 11/17 잰 값 — research/ENGINES/CUTOUT_LOG.md) 아래 다섯은 켜면 앞면·권수 앎이 예전보다 떨어져 기본은 꺼 둠(설정으로만 켬) */
    bgK: 1,             // 바탕 색 무리 수(나뭇결·천 무늬) — 1 = 예전처럼 한 색(3으로 켜면 앞면 권수 앎 74%→69%·뒷면 자리+ISBN 60%→46%)
    valley: false,      // 덩어리를 골짜기에서 나눔(켜면 앞면 검증 권수 앎 54%→48%)
    junk: 0,            // 네모 채움이 이보다 낮은 덩어리는 물건 아님(0 = 끔 · 켜도 잰 값 같음)
    merge: false,       // 기대 수보다 많으면 이웃 조각 합침(켜면 앞면 권수 앎 74%→66%)
    lineT: 0,           // 곧은 경계로 나누는 문턱(권수 모를 때만 · 0 = 끔 · 0.65로 켜면 앞면 개발 권수 모름 28%→25%)
    /* (0.1.2 · 일꾼 spine3 11/17 잰 값 — research/ENGINES/CUTOUT_LOG.md 11/17 spine3) 앞면이 나쁜 까닭은 지나친 쪼갬이 아니라 덜 쪼갬: 빛 번짐·그림자로 책 사이 바탕이 가장자리 바탕 색과 달라져 그림 전체가 한 덩어리
     *  → 바코드 자리(seeds)가 없을 때(앞면)만 front를, 거기에 권수도 모를 때만 unk를 얹음 · 뒷면(바코드 자리 있음)은 0.1.1 그대로 */
    front: { flood: 16, floodA: 0.1, close: 0 },  // flood = 바탕 번져 찾기 문턱(따라온 길의 바탕 색과 RGB 거리) · floodA = 길 바탕 색을 따라가는 빠르기 · close 0 = 책 사이 좁은 틈을 메우지 않음
    unk: { lineT: 0.8 },                           // 권수 모를 때 곧은 경계로 나눔
    maxTilt: 0.12,      // 섞인 덩어리의 기울기가 이보다 크면 바로 세워 나눔(라디안 ≈ 7°) — 바코드 자리(seeds)가 있을 때(뒷면)만 · 앞면은 예전 그대로(켜면 앞면 검증 권수 앎 54%→48%)
    edgeT: 16,          // 경계(세로·가로 줄)를 셀 때 밝기 차 문턱
    splitWin: 0.35,     // 나눌 자리를 같은 몫 자리에서 ±35% 안에서 찾음
    gapK: 0.55,         // 바코드 끼리 이만큼(물건 크기 몫) 떨어지면 다른 줄·칸
    auto: 0.97,         // 이 확신 넘으면 '저절로 적용 후보'(실제 저절로는 단계 3부터)
    ask: 0.55,          // 이 확신 넘으면 '한 번 눌러 확인' · 아래는 '사람이 고름'
    target: 0.98,       // 배우기: 저절로 문턱은 맞힌 몫이 이 값 넘는 칸부터
    minN: 30,           // 배우기: 칸마다 이만큼 사람 확인이 쌓여야 문턱을 옮김
  };
  const cfgOf = (o) => Object.assign({}, DEF, o || {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const med = (A) => { if (!A.length) return 0; const s = A.slice().sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  /* ── 줄이기: 넓이 평균(긴 변 side) ── */
  function down(img, side) {
    const k = Math.min(1, side / Math.max(img.w, img.h)); if (k >= 1) return { w: img.w, h: img.h, d: img.d, k: 1 };
    const W = Math.max(1, Math.round(img.w * k)), H = Math.max(1, Math.round(img.h * k)); const d = new Uint8ClampedArray(W * H * 4); const sx = img.w / W, sy = img.h / H;
    for (let y = 0; y < H; y++) { const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (let x = 0; x < W; x++) { const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)); let r = 0, g = 0, b = 0, n = 0;
        for (let yy = y0; yy < y1; yy += 1) for (let xx = x0; xx < x1; xx += 1) { const i = (yy * img.w + xx) * 4; r += img.d[i]; g += img.d[i + 1]; b += img.d[i + 2]; n++; }
        const o = (y * W + x) * 4; d[o] = r / n; d[o + 1] = g / n; d[o + 2] = b / n; d[o + 3] = 255; } }
    return { w: W, h: H, d, k: W / img.w };
  }
  const grayOf = (im) => { const g = new Float32Array(im.w * im.h); for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = 0.299 * im.d[i] + 0.587 * im.d[i + 1] + 0.114 * im.d[i + 2]; return g; };

  /* ── 바탕 색: 가장자리 띠의 중앙값 + 흔들림 ── */
  function bgOf(im, band) {
    const bw = Math.max(1, Math.round(Math.min(im.w, im.h) * band)); const R = [], G = [], B = [];
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { if (x >= bw && x < im.w - bw && y >= bw && y < im.h - bw) continue; if ((x + y) % 2) continue; const i = (y * im.w + x) * 4; R.push(im.d[i]); G.push(im.d[i + 1]); B.push(im.d[i + 2]); }
    const r = med(R), g = med(G), b = med(B); const D = R.map((v, i) => Math.hypot(v - r, G[i] - g, B[i] - b));
    /* (0.1.1) 바탕 색 무리 — 나뭇결·천 무늬·그림자처럼 바탕이 한 색이 아니면 가장자리 화소를 3무리로(k-평균) · 바탕 = 어느 무리에든 가까운 화소 */
    const step = Math.max(1, Math.floor(R.length / 4000)); const P = []; for (let i = 0; i < R.length; i += step) P.push([R[i], G[i], B[i]]);
    let cen = [P[0], P[Math.floor(P.length / 3)], P[Math.floor((2 * P.length) / 3)]].map((x) => x.slice()); let asg = new Int8Array(P.length);
    for (let it = 0; it < 10; it++) { const sum = cen.map(() => [0, 0, 0, 0]); P.forEach((q, i) => { let bi = 0, bd = 1e9; cen.forEach((c, k) => { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = k; } }); asg[i] = bi; const S = sum[bi]; S[0] += q[0]; S[1] += q[1]; S[2] += q[2]; S[3]++; }); cen = cen.map((c, k) => (sum[k][3] ? [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]] : c)); }
    const cl = cen.map((c, k) => { const ds = []; P.forEach((q, i) => { if (asg[i] === k) ds.push(Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2])); }); return { r: c[0], g: c[1], b: c[2], n: ds.length / P.length, s: med(ds) }; }).filter((c) => c.n >= 0.08);
    return { r, g, b, s: med(D), cl };
  }
  /* ── 물건 화소: 바탕과 색이 다름 ── */
  function maskOf(im, bg, C) {
    const t = Math.max(C.minDist, bg.s * C.spreadK); const m = new Uint8Array(im.w * im.h); const CL = C.bgK > 1 && bg.cl && bg.cl.length > 1 ? bg.cl.map((c) => ({ ...c, t: Math.max(C.minDist * 0.8, c.s * C.spreadK) })) : null;
    if (CL) { for (let j = 0, i = 0; j < m.length; j++, i += 4) { let fg = 1; for (const c of CL) if (Math.hypot(im.d[i] - c.r, im.d[i + 1] - c.g, im.d[i + 2] - c.b) <= c.t) { fg = 0; break; } m[j] = fg; } return { m, t: Math.round(Math.max(...CL.map((c) => c.t))) }; }
    for (let j = 0, i = 0; j < m.length; j++, i += 4) if (Math.hypot(im.d[i] - bg.r, im.d[i + 1] - bg.g, im.d[i + 2] - bg.b) > t) m[j] = 1;
    if (C.flood) floodBg(im, m, C);
    return { m, t };
  }
  /* (0.1.2) 바탕 번져 찾기 — 가장자리의 바탕 화소에서 이웃(상하좌우)으로 번지며, 따라온 길의 바탕 색(천천히 바뀌는 평균 · floodA)과 C.flood 안이면 바탕으로 고침
   *  빛 번짐·그림자처럼 바탕 밝기가 천천히 바뀌어도 따라가고 · 물건 가장자리는 색이 뚝 바뀌어 멈춤 · 화소 배열은 그대로 읽음(흐리기 없음 — 잰 값이 같고 메모리 덜 씀) */
  function floodBg(im, m, C) {
    const w = im.w, h = im.h, N = w * h, d = im.d, al = C.floodA == null ? 0.1 : C.floodA, T2 = C.flood * C.flood; const e = new Float32Array(N * 3), seen = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const start = (j) => { if (seen[j] || m[j]) return; seen[j] = 1; e[j * 3] = d[j * 4]; e[j * 3 + 1] = d[j * 4 + 1]; e[j * 3 + 2] = d[j * 4 + 2]; q[qt++] = j; };
    for (let x = 0; x < w; x++) { start(x); start((h - 1) * w + x); } for (let y = 0; y < h; y++) { start(y * w); start(y * w + w - 1); }
    const go = (p, j) => { if (seen[j]) return; const r = d[j * 4], g = d[j * 4 + 1], b = d[j * 4 + 2], er = e[p * 3], eg = e[p * 3 + 1], eb = e[p * 3 + 2]; const dr = r - er, dg = g - eg, db = b - eb; if (dr * dr + dg * dg + db * db > T2) return; seen[j] = 1; m[j] = 0; e[j * 3] = er + dr * al; e[j * 3 + 1] = eg + dg * al; e[j * 3 + 2] = eb + db * al; q[qt++] = j; };
    while (qh < qt) { const p = q[qh++]; const x = p % w; if (x > 0) go(p, p - 1); if (x < w - 1) go(p, p + 1); if (p >= w) go(p, p - w); if (p < N - w) go(p, p + w); }
  }
  /* 늘리기(dil=1)·줄이기(dil=0) — 네모 반지름 r · 가로 세로 두 번 */
  function morph(m, w, h, r, dil) {
    if (r <= 0) return m; const a = new Uint8Array(m.length), b = new Uint8Array(m.length); const want = dil ? 1 : 0; /* 늘리기: 둘레에 1이 하나라도 → 1 · 줄이기: 둘레에 0이 하나라도 → 0 (그림 밖은 늘 그대로 둠) */
    for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) { let v = dil ? 0 : 1; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= w) continue; if (m[row + xx] === want) { v = want; break; } } a[row + x] = v; } }
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { let v = dil ? 0 : 1; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy < 0 || yy >= h) continue; if (a[yy * w + x] === want) { v = want; break; } } b[y * w + x] = v; }
    return b;
  }
  /* 구멍 메우기 — 가장자리에서 닿는 바탕만 바탕 */
  function fillHoles(m, w, h) {
    const seen = new Uint8Array(m.length); const st = []; const push = (j) => { if (!seen[j] && !m[j]) { seen[j] = 1; st.push(j); } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (st.length) { const j = st.pop(); const x = j % w, y = (j / w) | 0; if (x > 0) push(j - 1); if (x < w - 1) push(j + 1); if (y > 0) push(j - w); if (y < h - 1) push(j + w); }
    const o = new Uint8Array(m.length); for (let j = 0; j < m.length; j++) o[j] = seen[j] ? 0 : 1; return o;
  }
  /* 이어진 덩어리 → 기운 네모(모멘트로 기울기 · 그 기울기에서 바깥 네모) */
  function comps(m, w, h, minA) {
    const lab = new Int32Array(m.length).fill(-1); const out = []; const st = [];
    for (let s = 0; s < m.length; s++) { if (!m[s] || lab[s] >= 0) continue; const id = out.length; let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; const px = []; lab[s] = id; st.push(s);
      while (st.length) { const j = st.pop(); const x = j % w, y = (j / w) | 0; n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; px.push(j);
        const nb = [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]; for (const q of nb) if (q >= 0 && m[q] && lab[q] < 0) { lab[q] = id; st.push(q); } }
      out.push({ id, n, sx, sy, sxx, syy, sxy, px }); }
    return out.filter((c) => c.n >= minA).map((c) => rectOf(c.px, w, h));
  }
  /* 화소 목록 → 기운 네모(모멘트 기울기 · 그 기울기의 바깥 네모) · 화소 목록은 px로 남김(골짜기 나누기에 씀) */
  function rectOf(px, w, h) { let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; for (const j of px) { const x = j % w, y = (j / w) | 0; n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; }
    const cx = sx / n, cy = sy / n; const mxx = sxx / n - cx * cx, myy = syy / n - cy * cy, mxy = sxy / n - cx * cy; let a = normA(0.5 * Math.atan2(2 * mxy, mxx - myy)); const co = Math.cos(a), si = Math.sin(a); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const j of px) { const x = j % w - cx, y = ((j / w) | 0) - cy; const u = x * co + y * si, v = -x * si + y * co; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
    const bw = u1 - u0 + 1, bh = v1 - v0 + 1; const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
    return { cx: cx + uc * co - vc * si, cy: cy + uc * si + vc * co, w: bw, h: bh, a, n, fill: n / (bw * bh), touch: touchEdge(px, w, h), px }; }
  /* (0.1.1) 골짜기 나누기 — 덩어리를 그 기울기로 펴서 줄·열마다 물건 화소 수를 세고, 가운데 쪽에 '거의 빈' 골짜기(가장 높은 칸의 25% 아래)가 있으면 거기서 둘로 · 되풀이(깊이 5)
   *  틈이 가늘게 이어져 여러 권이 한 덩어리가 된 것(바탕 무늬·그림자 다리)을 가름 · 바로 붙인 책은 골짜기가 없어 그대로(뒤의 경계 나누기가 맡음) */
  function splitValley(r, w, h, minA, depth) { if (depth > 5 || r.fill > 0.93 || r.n < minA * 2) return [r]; const co = Math.cos(r.a), si = Math.sin(r.a); const U = new Float32Array(r.px.length), V = new Float32Array(r.px.length); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    r.px.forEach((j, i) => { const x = j % w - r.cx, y = ((j / w) | 0) - r.cy; U[i] = x * co + y * si; V[i] = -x * si + y * co; if (U[i] < u0) u0 = U[i]; if (U[i] > u1) u1 = U[i]; if (V[i] < v0) v0 = V[i]; if (V[i] > v1) v1 = V[i]; });
    const best = (A, a0, a1) => { const L = Math.max(1, Math.ceil(a1 - a0 + 1)); const hst = new Float32Array(L); for (const v of A) hst[Math.min(L - 1, Math.floor(v - a0))]++; const mx = Math.max(...hst); let bi = -1, bv = 1e9; for (let i = Math.floor(L * 0.12); i < Math.ceil(L * 0.88); i++) { const v = (hst[i - 1] + hst[i] + hst[i + 1]) / 3; if (v < bv) { bv = v; bi = i; } } return bv < mx * 0.25 ? { at: a0 + bi + 0.5, depth: bv / mx } : null; };
    const cu = best(U, u0, u1), cv = best(V, v0, v1); const pick = cu && (!cv || cu.depth <= cv.depth) ? ['u', cu] : cv ? ['v', cv] : null; if (!pick) return [r];
    const A = pick[0] === 'u' ? U : V; const a = [], b = []; r.px.forEach((j, i) => (A[i] < pick[1].at ? a : b).push(j)); if (a.length < minA || b.length < minA) return [r];
    return [...splitValley(rectOf(a, w, h), w, h, minA, depth + 1), ...splitValley(rectOf(b, w, h), w, h, minA, depth + 1)]; }
  /* (0.1.1) 기대 수보다 많으면 이웃 둘을 합침 — 합친 네모가 가장 네모다운(두 넓이 합 ÷ 합친 네모 넓이가 큰) 짝부터 · 가까운 것끼리만 */
  function mergeTo(items, want) { const L = items.slice(); let guard = 0; const corners = (b) => { const co = Math.cos(b.a), si = Math.sin(b.a); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [b.cx + (u * b.w / 2) * co - (v * b.h / 2) * si, b.cy + (u * b.w / 2) * si + (v * b.h / 2) * co]); };
    while (L.length > want && guard++ < 200) { let best = null; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const p = L[i], q = L[j]; const d = Math.hypot(p.cx - q.cx, p.cy - q.cy); if (d > 0.75 * (Math.max(p.w, p.h) + Math.max(q.w, q.h))) continue; const a = (p.a + q.a) / 2, co = Math.cos(a), si = Math.sin(a); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
        for (const [x, y] of [...corners(p), ...corners(q)]) { const u = x * co + y * si, v = -x * si + y * co; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); } const U = (u1 - u0) * (v1 - v0); const sc = (p.w * p.h + q.w * q.h) / U; if (!best || sc > best.sc) best = { i, j, sc, a, u0, u1, v0, v1 }; }
      if (!best) break; const { i, j, a, u0, u1, v0, v1 } = best; const co = Math.cos(a), si = Math.sin(a); const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2; const m = { cx: uc * co - vc * si, cy: uc * si + vc * co, w: u1 - u0, h: v1 - v0, a, fill: Math.min(L[i].fill, L[j].fill), merged: 1, touch: L[i].touch || L[j].touch };
      L.splice(j, 1); L.splice(i, 1, m); }
    return L; }
  function noop() {
  }
  const touchEdge = (px, w, h) => { let t = 0; for (const j of px) { const x = j % w, y = (j / w) | 0; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) { t++; if (t > 3) return true; } } return false; };
  /* 기울기는 −45°~45°로(가로·세로 어느 쪽이든 물건 변이 축에 가깝게) */
  function normA(a) { while (a > Math.PI / 4) a -= Math.PI / 2; while (a < -Math.PI / 4) a += Math.PI / 2; return a; }
  /* 상자 안 점인가(여유 pad 몫) */
  function inBox(b, x, y, pad) { const co = Math.cos(b.a), si = Math.sin(b.a); const dx = x - b.cx, dy = y - b.cy; const u = dx * co + dy * si, v = -dx * si + dy * co; const p = 1 + (pad || 0); return Math.abs(u) <= (b.w / 2) * p && Math.abs(v) <= (b.h / 2) * p; }
  const toLocal = (b, x, y) => { const co = Math.cos(b.a), si = Math.sin(b.a); const dx = x - b.cx, dy = y - b.cy; return { u: dx * co + dy * si + b.w / 2, v: -dx * si + dy * co + b.h / 2 }; };
  const fromLocal = (b, u, v) => { const co = Math.cos(b.a), si = Math.sin(b.a); const x = u - b.w / 2, y = v - b.h / 2; return { x: b.cx + x * co - y * si, y: b.cy + x * si + y * co }; };
  /* 상자 안을 반듯하게 펴서 밝기 판(가르기 그림 화소) */
  function straight(g, w, h, b) {
    const W = Math.max(2, Math.round(b.w)), H = Math.max(2, Math.round(b.h)); const o = new Float32Array(W * H); const co = Math.cos(b.a), si = Math.sin(b.a);
    for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) { const x = b.cx + (u - W / 2) * co - (v - H / 2) * si, y = b.cy + (u - W / 2) * si + (v - H / 2) * co; const xi = clamp(Math.round(x), 0, w - 1), yi = clamp(Math.round(y), 0, h - 1); o[v * W + u] = g[yi * w + xi]; }
    return { W, H, g: o };
  }
  /* 세로 경계 세기: 열 x마다 '위에서 아래까지 이어진 세로 줄'인 줄 몫(글자는 띄엄띄엄 · 책 경계는 끝까지) */
  function colEdge(S, t) { const c = new Float32Array(S.W); for (let x = 1; x < S.W - 1; x++) { let n = 0; for (let y = 0; y < S.H; y++) { const i = y * S.W + x; if (Math.abs(S.g[i + 1] - S.g[i - 1]) > t) n++; } c[x] = n / S.H; } return c; }
  function rowEdge(S, t) { const r = new Float32Array(S.H); for (let y = 1; y < S.H - 1; y++) { let n = 0; for (let x = 0; x < S.W; x++) { const i = y * S.W + x; if (Math.abs(S.g[i + S.W] - S.g[i - S.W]) > t) n++; } r[y] = n / S.W; } return r; }
  const smooth = (p) => { const o = new Float32Array(p.length); for (let i = 0; i < p.length; i++) o[i] = Math.max(p[i], ((p[i - 1] || 0) + p[i] + (p[i + 1] || 0)) / 3); return o; };
  /* n 몫으로 나눌 자리 — 같은 몫 자리 ± 창 안에서 경계가 가장 센 곳(바코드 사이 범위가 있으면 그 안) · 자리마다 세기(확신 재료) */
  function cutsOf(prof, n, C, ranges) {
    const L = prof.length; const cuts = [];
    for (let j = 1; j < n; j++) { const e = (j * L) / n; const win = (C.splitWin * L) / n; let lo = Math.max(2, Math.round(e - win)), hi = Math.min(L - 3, Math.round(e + win)); if (ranges && ranges[j - 1]) { lo = Math.max(lo, Math.round(ranges[j - 1][0])); hi = Math.min(hi, Math.round(ranges[j - 1][1])); if (lo > hi) { lo = Math.max(2, Math.round(ranges[j - 1][0])); hi = Math.min(L - 3, Math.round(ranges[j - 1][1])); } }
      let best = Math.round(e), bv = -1; for (let x = lo; x <= hi; x++) { const v = prof[x] - 0.15 * Math.abs(x - e) / Math.max(1, win); if (v > bv) { bv = v; best = x; } } cuts.push({ at: best, s: prof[best] || 0 }); }
    return cuts;
  }
  /* 한 상자를 nx × ny로 가름(반듯한 자리에서 자른 뒤 다시 그림 좌표로) */
  function splitBox(g, w, h, b, nx, ny, C, seeds) {
    const S = straight(g, w, h, b); const ce = smooth(colEdge(S, C.edgeT)); const loc = (seeds || []).map((p) => toLocal(b, p.x, p.y));
    const rngX = nx > 1 && loc.length ? seedRanges(loc.map((p) => p.u), nx) : null; const cx = nx > 1 ? cutsOf(ce, nx, C, rngX) : [];
    const xs = [0, ...cx.map((c) => c.at), S.W]; const out = [];
    for (let i = 0; i < xs.length - 1; i++) { const u0 = xs[i], u1 = xs[i + 1]; const sub = { cx: 0, cy: 0, w: u1 - u0, h: S.H, a: b.a }; const ctr = fromLocal(b, (u0 + u1) / 2, S.H / 2); sub.cx = ctr.x; sub.cy = ctr.y;
      let parts = [sub]; const sX = cx[i - 1] ? cx[i - 1].s : 1, sX2 = cx[i] ? cx[i].s : 1;
      if (ny > 1) { const S2 = straight(g, w, h, sub); const re = smooth(rowEdge(S2, C.edgeT)); const myS = loc.filter((p) => p.u >= u0 && p.u < u1).map((p) => toLocal(sub, fromLocal(b, p.u, p.v).x, fromLocal(b, p.u, p.v).y).v); const ry = cutsOf(re, ny, C, myS.length ? seedRanges(myS, ny) : null); const ys = [0, ...ry.map((c) => c.at), S2.H]; parts = [];
        for (let k = 0; k < ys.length - 1; k++) { const c2 = fromLocal(sub, S2.W / 2, (ys[k] + ys[k + 1]) / 2); parts.push({ cx: c2.x, cy: c2.y, w: S2.W, h: ys[k + 1] - ys[k], a: b.a, cut: Math.min(sX, sX2, ry[k - 1] ? ry[k - 1].s : 1, ry[k] ? ry[k].s : 1) }); } }
      else parts[0].cut = Math.min(sX, sX2);
      out.push(...parts); }
    return out;
  }
  /* 씨앗(바코드 가운데) 좌표를 n 무리로 → 무리 사이 범위 [끝, 다음 시작] */
  function seedRanges(us, n) { const s = us.slice().sort((p, q) => p - q); if (s.length < n) return null; const gaps = []; for (let i = 0; i < s.length - 1; i++) gaps.push([s[i + 1] - s[i], i]); gaps.sort((p, q) => q[0] - p[0]); const cut = gaps.slice(0, n - 1).map((x) => x[1]).sort((p, q) => p - q); return cut.map((i) => [s[i], s[i + 1]]); }
  /* 씨앗을 줄 수 세기 — 이웃 간격이 물건 크기 × gapK 넘으면 새 무리 */
  function clusters(vals, gap) { const s = vals.slice().sort((p, q) => p - q); if (!s.length) return 0; let k = 1; for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] > gap) k++; return k; }

  /* (0.1.1) 센 곧은 경계로 나누기 — 덩어리를 펴서 열마다 '위에서 아래까지 이어진 경계 몫'과 '양쪽 색 차이' 중 큰 값 → 문턱을 넘는 봉우리에서 자름(열 먼저, 그다음 각 띠의 줄)
   *  권수를 몰라도 씀 · 책과 책 사이 틈이 바탕 무늬로 메워져 한 덩어리가 된 것을 가름 · 조각이 너무 얇아지면(덩어리의 12% 아래) 그 자리는 안 자름 */
  function lineCuts(prof, thr, minFrac) { const L = prof.length; const mn = Math.max(6, L * minFrac); const P = peaks(prof, 0, mn, thr); return P.filter((c) => c.at > L * 0.1 && c.at < L * 0.9); }
  /* 몇 몫으로 나눌까: 2~6 몫마다 같은 몫 자리 ±25% 안에서 가장 센 경계를 찾고, 그 경계가 '모두' 문턱을 넘는 가장 많은 몫(책 크기는 비슷하다는 바둑판 전제) · 조각 모양이 책답지 않으면(가로/세로 0.35~1.6 밖) 버림 */
  function bestN(prof, C, other, isCol) { let best = { n: 1, cuts: [] }; for (let n = 2; n <= 6; n++) { const cuts = cutsOf(prof, n, { ...C, splitWin: 0.25 }, null); if (!cuts.length || Math.min(...cuts.map((c) => c.s)) < C.lineT) continue; const xs = [0, ...cuts.map((c) => c.at), prof.length]; const ok = xs.slice(1).every((x, i) => { const w = x - xs[i]; const r = isCol ? w / other : other / w; return r > 0.35 && r < 1.6; }); if (ok) best = { n, cuts }; } return best; }
  function splitAuto(g, D, b, C) { const S = straight(g, D.w, D.h, b); const J = jumpOf(D, b); const pc = smooth(maxArr(colEdge(S, C.edgeT), J.c)); const bx = bestN(pc, C, S.H, true); const xs = [0, ...bx.cuts.map((c) => c.at), S.W]; const out = [];
    for (let i = 0; i < xs.length - 1; i++) { const u0 = xs[i], u1 = xs[i + 1]; const ctr = fromLocal(b, (u0 + u1) / 2, S.H / 2); const sub = { cx: ctr.x, cy: ctr.y, w: u1 - u0, h: S.H, a: b.a }; const S2 = straight(g, D.w, D.h, sub); const J2 = jumpOf(D, sub); const pr = smooth(maxArr(rowEdge(S2, C.edgeT), J2.r)); const by = bestN(pr, C, S2.W, false); const ys = [0, ...by.cuts.map((c) => c.at), S2.H];
      for (let k = 0; k < ys.length - 1; k++) { const c2 = fromLocal(sub, S2.W / 2, (ys[k] + ys[k + 1]) / 2); out.push({ cx: c2.x, cy: c2.y, w: S2.W, h: ys[k + 1] - ys[k], a: b.a, cut: Math.min(...[bx.cuts[i - 1], bx.cuts[i], by.cuts[k - 1], by.cuts[k]].filter(Boolean).map((c) => c.s), 1) }); } }
    return out; }

  /* ═══ 가르기: 그림 한 장 → 물건 상자들 ═══
   *  opt.seeds = [{x, y}] 바코드 가운데(받은 그림 화소) · opt.expect = 기대 물건 수(사람이 적으면) · opt.grid = {r, c}
   *  결과 { items:[{cx,cy,w,h,a, conf, why[]}], bg, note } — 좌표는 받은 그림 화소 */
  function segment(img, opt) {
    const sd = !!(opt && opt.seeds && opt.seeds.length), ex = !!(opt && (opt.expect || opt.grid)); /* (0.1.2) 앞면(바코드 자리 없음)만 front · 거기에 권수 모름이면 unk */
    const C = cfgOf({ ...(sd ? {} : DEF.front), ...(sd || ex ? {} : DEF.unk), ...((opt && opt.cfg) || {}) }); const D = down(img, C.side); const k = D.k; const g = grayOf(D); const bg = bgOf(D, C.band);
    let { m, t } = maskOf(D, bg, C); m = morph(morph(m, D.w, D.h, C.open, 0), D.w, D.h, C.open, 1); m = morph(morph(m, D.w, D.h, C.close, 1), D.w, D.h, C.close, 0); m = fillHoles(m, D.w, D.h);
    const minA = C.minArea * D.w * D.h; let B = comps(m, D.w, D.h, minA); const why0 = []; if (C.valley) B = B.flatMap((b) => splitValley(b, D.w, D.h, minA, 0));
    if (C.junk) { const nB = B.length; const keepSeed = (b) => ((opt && opt.seeds) || []).some((p) => inBox(b, p.x * k, p.y * k, 0.02)); const big = med(B.map((b) => b.w * b.h)); B = B.filter((b) => b.fill >= C.junk || keepSeed(b) || (b.w * b.h > big * 0.5 && b.fill >= C.junk * 0.8)); if (B.length < nB) why0.push(`물건 아닌 얼룩 ${nB - B.length}개 뺌`); }
    for (const b of B) delete b.px;
    if (B.length === 1 && B[0].touch && B[0].n > 0.9 * D.w * D.h) why0.push('바탕을 못 찾음(물건이 그림을 거의 다 채움)');
    const seeds = ((opt && opt.seeds) || []).map((p) => ({ x: p.x * k, y: p.y * k, ref: p }));
    /* 한 덩어리에 물건이 여럿(붙여 놓음)이면 나눔 — 씨앗 무리 수 > 넓이 몫 > 기대 수 차례 */
    const singles = B.filter((b) => seeds.filter((p) => inBox(b, p.x, p.y, 0.02)).length <= 1 && b.fill > 0.85);
    const refA = singles.length ? med(singles.map((b) => b.w * b.h)) : 0; const refW = singles.length ? med(singles.map((b) => b.w)) : 0, refH = singles.length ? med(singles.map((b) => b.h)) : 0;
    const out = [];
    /* (0.1.1) 여러 권이 붙은 섞인 덩어리(채움 낮음)는 모멘트 기울기가 엉뚱함(사진 시험: 20° 넘게 기울어 모든 자름이 대각선) → 큰 기울기면 바로 선 바깥 네모로 고쳐 나눔 */
    { const mA = med(B.map((b) => b.w * b.h)); B = B.map((b) => { const nS = seeds.filter((p) => inBox(b, p.x, p.y, 0.02)).length; if (!(seeds.length && b.fill < 0.85 && Math.abs(b.a) > C.maxTilt && (nS >= 2 || b.w * b.h > mA * 2.5 || B.length === 1))) return b; const co = Math.abs(Math.cos(b.a)), si = Math.abs(Math.sin(b.a)); const W = b.w * co + b.h * si, H = b.w * si + b.h * co; return { ...b, w: W, h: H, a: 0, fill: b.n / (W * H) }; }); }
    for (const b of B) { const my = seeds.filter((p) => inBox(b, p.x, p.y, 0.02)); let nx = 1, ny = 1, how = '';
      if (my.length >= 2) { const loc = my.map((p) => toLocal(b, p.x, p.y)); const gu = Math.max(8, (refW || b.w / my.length) * C.gapK), gv = Math.max(8, (refH || b.h / my.length) * C.gapK); nx = clusters(loc.map((p) => p.u), gu); ny = clusters(loc.map((p) => p.v), gv); if (nx * ny < my.length) { if (b.w >= b.h) nx = Math.max(nx, Math.ceil(my.length / ny)); else ny = Math.max(ny, Math.ceil(my.length / nx)); } how = `바코드 ${my.length}개 → ${nx}×${ny}로 나눔`; }
      else if (refA && b.w * b.h > refA * 1.6) { nx = Math.max(1, Math.round(b.w / refW)); ny = Math.max(1, Math.round(b.h / refH)); if (nx * ny > 1) how = `홀로 놓인 물건 크기로 ${nx}×${ny}로 나눔`; }
      if (nx * ny === 1 && my.length <= 1 && C.lineT && !(opt && (opt.expect || opt.grid)) && (b.fill < 0.9 || !refA || b.w * b.h > refA * 1.6)) { /* 권수를 알면 예전 길이 더 나음(잰 값) */ const P = splitAuto(g, D, b, C); if (P.length > 1) { for (const p of P) out.push({ ...p, n: p.w * p.h, fill: b.fill, split: `곧은 경계 ${P.length}조각으로 나눔` }); continue; } }
      if (nx * ny > 1) { for (const p of splitBox(g, D.w, D.h, b, nx, ny, C, my)) out.push({ ...p, n: p.w * p.h, fill: b.fill, split: how }); }
      else out.push({ ...b }); }
    /* 기대 수(사람이 적은 수·바둑판)보다 적으면 가장 큰 상자부터 둘로 */
    const want = (opt && opt.grid && opt.grid.r * opt.grid.c) || (opt && opt.expect) || 0; let guard = 0;
    if (want && C.merge && out.length > want) { const before = out.length; const M = mergeTo(out, want); out.length = 0; out.push(...M); why0.push(`기대 수 ${want}에 맞춰 조각 ${before - want}개를 이웃과 합침`); }
    while (want && out.length < want && guard++ < 60) { out.sort((p, q) => q.w * q.h - p.w * p.h); const b = out.shift(); const byW = b.w >= b.h; const parts = splitBox(g, D.w, D.h, b, byW ? 2 : 1, byW ? 1 : 2, C, []); for (const p of parts) out.push({ ...p, n: p.w * p.h, fill: b.fill, split: '기대 수에 맞춰 나눔' }); }
    const items = out.map((b) => { const why = []; let c = 1;
      if (b.fill < 0.85) { c *= clamp(b.fill / 0.85, 0.3, 1); why.push(`네모 모양이 덜 반듯함(채움 ${Math.round(b.fill * 100)}%)`); }
      if (b.touch) { c *= 0.6; why.push('그림 가장자리에 걸림(잘렸을 수 있음)'); }
      if (b.split) { const s = b.cut == null ? 0.5 : clamp(b.cut / 0.6, 0.25, 1); c *= 0.55 + 0.45 * s; why.push(b.split + (b.cut != null ? ` · 경계 세기 ${Math.round(b.cut * 100)}%` : '')); }
      if (refA) { const r = (b.w * b.h) / refA; if (r < 0.55 || r > 1.6) { c *= 0.7; why.push(`크기가 다른 물건과 많이 다름(${Math.round(r * 100)}%)`); } }
      return { cx: b.cx / k, cy: b.cy / k, w: b.w / k, h: b.h / k, a: b.a, conf: round3(c), why }; });
    return { items: order(items), bg: { r: Math.round(bg.r), g: Math.round(bg.g), b: Math.round(bg.b), t: Math.round(t) }, note: why0, scale: k };
  }
  const round3 = (v) => Math.round(v * 1000) / 1000;

  /* ═══ 줄·칸 차례 — 위→아래 줄, 줄 안 왼→오른 · 각 물건에 r, c ═══ */
  function order(items) {
    if (!items.length) return items; const hs = med(items.map((b) => b.h)); const L = items.slice().sort((p, q) => p.cy - q.cy); const rows = []; let cur = [L[0]];
    for (let i = 1; i < L.length; i++) { const ry = cur.reduce((s, b) => s + b.cy, 0) / cur.length; if (Math.abs(L[i].cy - ry) < hs * 0.5) cur.push(L[i]); else { rows.push(cur); cur = [L[i]]; } } rows.push(cur);
    const out = []; rows.forEach((R, r) => R.sort((p, q) => p.cx - q.cx).forEach((b, c) => out.push({ ...b, r, c, n: out.length + 1 }))); return out;
  }

  /* ═══ 바코드 ↔ 물건 ═══ codes = [{text, x, y, w?, h?, hits?, unsure?}] (받은 그림 화소 · 가운데)
   *  ISBN(978·979) 먼저 · 같은 물건에 ISBN 둘이면 '확인 필요' · 5자리 부가기호(옆 작은 바코드)는 add로 붙임 · 물건 밖 바코드 = 없는 물건(orphan) */
  const eanOk = (t) => { if (!/^\d{13}$/.test(t)) return false; let s = 0; for (let i = 0; i < 12; i++) s += +t[i] * (i % 2 ? 3 : 1); return (10 - (s % 10)) % 10 === +t[12]; };
  const isIsbn = (t) => /^97[89]/.test(t) && eanOk(t);
  function assign(items, codes, opt) {
    const C = cfgOf(opt && opt.cfg); const out = items.map((b) => ({ ...b, codes: [], isbn: null, add: null })); const orphan = [];
    for (const c of codes || []) { const t = String(c.text || ''); let best = -1, bd = 1e18; out.forEach((b, i) => { if (inBox(b, c.x, c.y, 0.03)) { const d = (b.cx - c.x) ** 2 + (b.cy - c.y) ** 2; if (d < bd) { bd = d; best = i; } } });
      if (best < 0) { orphan.push(c); continue; } out[best].codes.push(c); }
    for (const b of out) { const L = b.codes; const isb = L.filter((c) => isIsbn(String(c.text))); const ean = L.filter((c) => eanOk(String(c.text)) && !isIsbn(String(c.text))); const add = L.find((c) => /^\d{5}$/.test(String(c.text)));
      if (add) b.add = String(add.text); let pick = isb.length ? isb : ean; const uniq = [...new Set(pick.map((c) => String(c.text)))];
      if (uniq.length === 1) { b.isbn = uniq[0]; const c0 = pick[0]; const sure = pick.some((c) => !c.unsure && (c.hits == null || c.hits >= 2)); b.codeConf = sure ? 0.99 : 0.8; if (!sure) b.why = [...(b.why || []), '바코드가 한 번만 읽힘'];
        if (!isb.length) b.why = [...(b.why || []), 'ISBN이 아닌 바코드(음반·영상·잡화 바코드일 수 있음)']; b.codeAt = { x: c0.x, y: c0.y }; }
      else if (uniq.length > 1) { b.isbn = null; b.cands = uniq; b.codeConf = 0.3; b.why = [...(b.why || []), `한 물건에 바코드 ${uniq.length}개 — 물건이 붙어 있어 덜 나뉘었을 수 있음`]; }
      else { b.codeConf = 0; b.why = [...(b.why || []), '바코드 못 읽음 — 앞뒤 짝·그림 대조로 맞춤']; } }
    /* 물건 밖 바코드: 가장 가까운 '바코드 없는' 물건에 붙이거나(가까우면) · 그 자리에 물건 크기 상자를 지어 둠(확신 낮음) */
    const hs = med(out.map((b) => b.h)) || 200, ws = med(out.map((b) => b.w)) || 150; const made = [];
    for (const c of orphan) { const t = String(c.text); if (!eanOk(t)) continue; let bi = -1, bd = 1e18; out.forEach((b, i) => { if (b.isbn) return; const d = Math.hypot(b.cx - c.x, b.cy - c.y); if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0 && bd < Math.max(hs, ws) * 0.75) { const b = out[bi]; b.isbn = t; b.codeConf = 0.6; b.why = [...(b.why || []), '바코드가 상자 바로 밖에 있어 가까운 물건에 붙임']; }
      else made.push({ cx: c.x, cy: c.y, w: ws, h: hs, a: 0, conf: 0.35, why: ['물건 윤곽을 못 찾아 바코드 둘레를 물건 크기로 어림(자른 그림을 꼭 확인)'], codes: [c], isbn: t, codeConf: 0.6, made: 1 }); }
    const all = order([...out, ...made]); for (const b of all) b.conf = round3(b.conf * (b.isbn ? b.codeConf : b.cands ? 0.3 : 0.5)); return all;
  }

  /* ═══ 앞·뒤 짝: 같은 배열로 뒤집어 찍은 두 장 — 줄·칸 자리로 짝(그대로 · 좌우 뒤바뀜 · 위아래 뒤바뀜 중 맞는 쪽)
   *  hint(i, j) = 앞 i와 뒤 j가 같은 상품일 점수 0~1(그림 대조가 되면 · 없으면 null) — 배열 고르기에 씀 ═══ */
  function pairFB(front, back, hint) {
    const rowsOf = (L) => { const m = new Map(); for (const b of L) { if (!m.has(b.r)) m.set(b.r, []); m.get(b.r).push(b); } return [...m.keys()].sort((p, q) => p - q).map((k) => m.get(k).sort((p, q) => p.c - q.c)); };
    const F = rowsOf(front), B = rowsOf(back); const shapeF = F.map((r) => r.length).join(','), shapeB = B.map((r) => r.length).join(',');
    const ways = [['그대로', (r, c) => [r, c]], ['좌우 뒤바뀜(책을 옆으로 뒤집음)', (r, c, R) => [r, R[r].length - 1 - c]], ['위아래 뒤바뀜(책을 위아래로 뒤집음)', (r, c, R) => [R.length - 1 - r, c]], ['반 바퀴 돌림', (r, c, R) => [R.length - 1 - r, R[R.length - 1 - r] ? R[R.length - 1 - r].length - 1 - c : c]]];
    const res = [];
    for (const [nm, f] of ways) { const pairs = []; let sc = 0, nh = 0; F.forEach((row, r) => row.forEach((fb, c) => { const [r2, c2] = f(r, c, B); const bb = B[r2] && B[r2][c2]; if (!bb) return; pairs.push([fb, bb]); const h = hint ? hint(fb, bb) : null; if (h != null) { sc += h; nh++; } }));
      res.push({ way: nm, pairs, score: nh ? sc / nh : null, nh }); }
    const same = shapeF === shapeB; let best = res[0]; const withH = res.filter((x) => x.score != null);
    if (withH.length) { withH.sort((p, q) => q.score - p.score); best = withH[0]; const second = withH[1]; const margin = second ? best.score - second.score : best.score; best.conf = round3(clamp((same ? 0.55 : 0.35) + margin, 0, 0.99)); }
    else best.conf = same ? 0.7 : 0.35;
    best.why = [same ? `두 장의 줄·칸 모양 같음(${shapeF})` : `줄·칸 모양이 다름 — 앞 ${shapeF} · 뒤 ${shapeB}`, withH.length ? `그림 대조로 '${best.way}' 고름` : '그림 대조 없음 — 같은 자리끼리 짝(그대로)'];
    return best;
  }

  /* ═══ 그림 지문 — 작은 판(8×8 평균 · 9×8 차이) + 색 64칸 ═══ */
  function sig(img, box) {
    const b = box || { cx: img.w / 2, cy: img.h / 2, w: img.w, h: img.h, a: 0 }; const N = 32; const co = Math.cos(b.a), si = Math.sin(b.a); const P = new Float32Array(N * N * 3);
    for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) { let r = 0, g = 0, bl = 0, n = 0; for (let s = 0; s < 2; s++) for (let q = 0; q < 2; q++) { const uu = ((u + (s + 0.5) / 2) / N - 0.5) * b.w * 0.9, vv = ((v + (q + 0.5) / 2) / N - 0.5) * b.h * 0.9; const x = clamp(Math.round(b.cx + uu * co - vv * si), 0, img.w - 1), y = clamp(Math.round(b.cy + uu * si + vv * co), 0, img.h - 1); const i = (y * img.w + x) * 4; r += img.d[i]; g += img.d[i + 1]; bl += img.d[i + 2]; n++; }
        const o = (v * N + u) * 3; P[o] = r / n; P[o + 1] = g / n; P[o + 2] = bl / n; }
    const L = (u, v, S) => { let s = 0, n = 0; for (let y = v * S; y < (v + 1) * S; y++) for (let x = u * S; x < (u + 1) * S; x++) { const o = (y * N + x) * 3; s += 0.299 * P[o] + 0.587 * P[o + 1] + 0.114 * P[o + 2]; n++; } return s / n; };
    const a8 = []; for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) a8.push(L(u, v, 4)); const am = med(a8); const ah = a8.map((x) => (x > am ? 1 : 0));
    const g9 = []; for (let v = 0; v < 8; v++) for (let u = 0; u < 9; u++) { const x = Math.min(N - 1, Math.round((u * (N - 1)) / 8)); let s = 0; for (let y = v * 4; y < v * 4 + 4; y++) { const o = (y * N + x) * 3; s += 0.299 * P[o] + 0.587 * P[o + 1] + 0.114 * P[o + 2]; } g9.push(s / 4); }
    const dh = []; for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) dh.push(g9[v * 9 + u + 1] > g9[v * 9 + u] ? 1 : 0);
    const hist = new Float32Array(64); for (let i = 0; i < N * N; i++) { const o = i * 3; hist[((P[o] >> 6) << 4) | ((P[o + 1] >> 6) << 2) | (P[o + 2] >> 6)] += 1 / (N * N); }
    let mr = 0, mg = 0, mb = 0; for (let i = 0; i < N * N; i++) { mr += P[i * 3]; mg += P[i * 3 + 1]; mb += P[i * 3 + 2]; } const nn = N * N;
    const g16 = []; for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) g16.push(Math.round(L(u, v, 2)));
    return { ah, dh, g16, hist: Array.from(hist, (x) => Math.round(x * 1000) / 1000), mean: [Math.round(mr / nn), Math.round(mg / nn), Math.round(mb / nn)] };
  }
  /* 두 지문이 같은 그림일 점수 0~1 — 모양(평균·차이 지문 해밍) 0.6 + 색(칸 겹침) 0.4 */
  function simil(p, q) { if (!p || !q) return 0; let ov = 0; for (let i = 0; i < 64; i++) ov += Math.min(p.hist[i] || 0, q.hist[i] || 0); let shape;
    if (p.g16 && q.g16) shape = clamp((ncc(p.g16, q.g16) - 0.2) / 0.7, 0, 1); else { let ha = 0, hd = 0; for (let i = 0; i < 64; i++) { if (p.ah[i] !== q.ah[i]) ha++; if (p.dh[i] !== q.dh[i]) hd++; } shape = clamp((1 - (ha + hd) / 128 - 0.5) / 0.5, 0, 1); }
    return round3(clamp(0.6 * shape + 0.4 * ov, 0, 1)); }
  /* 작은 회색 판 두 개의 상관(−1~1) — 밝기·대비가 달라도(조명) 무늬가 같으면 높음 */
  function ncc(a, b) { const n = Math.min(a.length, b.length); let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; } return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0; }
  /* 색만(책등 ↔ 표지 — 모양은 달라도 색이 같음) */
  function colorSim(p, q) { if (!p || !q) return 0; let ov = 0; for (let i = 0; i < 64; i++) ov += Math.min(p.hist[i] || 0, q.hist[i] || 0); const dm = Math.hypot(p.mean[0] - q.mean[0], p.mean[1] - q.mean[1], p.mean[2] - q.mean[2]) / 441; return round3(clamp(0.6 * ov + 0.4 * (1 - dm), 0, 1)); }
  /* 여럿 ↔ 여럿 맞추기: 점수 큰 짝부터(한 번 쓴 것은 다시 안 씀) · 확신 = 그 줄에서 1등과 2등의 차 */
  function matchSet(A, B, f) {
    const M = A.map((a) => B.map((b) => f(a, b))); const used = new Set(), took = new Set(); const all = []; M.forEach((row, i) => row.forEach((s, j) => all.push([s, i, j]))); all.sort((p, q) => q[0] - p[0]); const res = new Array(A.length).fill(null);
    for (const [s, i, j] of all) { if (took.has(i) || used.has(j)) continue; took.add(i); used.add(j); const row = M[i].slice().sort((p, q) => q - p); const margin = s - (row[1] || 0); res[i] = { j, s: round3(s), margin: round3(margin), conf: round3(clamp(s * 0.5 + margin * 2, 0, 0.99)) }; }
    return res;
  }

  /* ═══ 책등: 나란히 세운(또는 눕힌) 책등 사진 → 책등 띠들 ═══
   *  물건 영역 안에서 '위에서 아래까지 이어진 세로 경계'가 센 열을 자름 · 띠 폭이 너무 좁으면(1.2% 아래) 합침
   *  opt.expect = 책 수(알면 그 수에 맞춤) · opt.orient = 'v'(세운 책등 · 기본 저절로) | 'h'(눕혀 쌓은 책등) */
  function spines(img, opt) {
    const C = cfgOf({ bgK: 1, ...((opt && opt.cfg) || {}) }); /* (0.1.1) 책등 줄은 바탕 한 색이 더 나음(밝은 책등이 바탕 무리에 섞임 — 시험 ⑥) */ const D = down(img, Math.max(C.side, 900)); const k = D.k; const g = grayOf(D); const bg = bgOf(D, C.band);
    let { m } = maskOf(D, bg, C); m = morph(morph(m, D.w, D.h, C.close, 1), D.w, D.h, C.close, 0); m = fillHoles(m, D.w, D.h); let B = comps(m, D.w, D.h, C.minArea * D.w * D.h);
    let box = B.length ? B.reduce((p, q) => (q.n > p.n ? q : p)) : { cx: D.w / 2, cy: D.h / 2, w: D.w, h: D.h, a: 0 }; if (B.length > 1) { /* 여러 덩어리 = 띄워 놓은 책등 — 덩어리가 곧 띠 */ const big = B.filter((b) => b.n > 0.25 * med(B.map((x) => x.n))); if (big.length >= 2 && !(opt && opt.expect && big.length < opt.expect * 0.6)) return spOut(big.map((b) => ({ ...b, cut: 1 })), k, 'v'); }
    let orient = opt && opt.orient; const S = straight(g, D.w, D.h, box);
    const J = jumpOf(D, box); const ce = smooth(maxArr(colEdge(S, C.edgeT), J.c)), re = smooth(maxArr(rowEdge(S, C.edgeT), J.r)); /* 경계 = 이어진 줄 몫과 양쪽 색 차이 중 큰 쪽 */ const pk = (p) => { const s = Array.from(p).slice(2, -2).sort((a, b) => b - a); return (s[Math.floor(s.length * 0.03)] || 0) - med(s); };
    if (!orient) orient = pk(ce) >= pk(re) ? 'v' : 'h'; const prof = orient === 'v' ? ce : re; const L = prof.length; const thick = orient === 'v' ? S.H : S.W;
    const n = opt && opt.expect; const cuts = peaks(prof, n ? n - 1 : 0, n ? (0.4 * L) / n : Math.max(4, L * 0.012), n ? -1 : med(Array.from(prof)) + Math.max(0.18, pk(prof) * 0.45));
    const xs = [0, ...cuts.map((c) => c.at), L]; const parts = [];
    for (let i = 0; i < xs.length - 1; i++) { const a0 = xs[i], a1 = xs[i + 1]; if (a1 - a0 < 2) continue; const c = orient === 'v' ? fromLocal(box, (a0 + a1) / 2, S.H / 2) : fromLocal(box, S.W / 2, (a0 + a1) / 2);
      parts.push({ cx: c.x, cy: c.y, w: orient === 'v' ? a1 - a0 : S.W, h: orient === 'v' ? S.H : a1 - a0, a: box.a, cut: Math.min(cuts[i - 1] ? cuts[i - 1].s : 1, cuts[i] ? cuts[i].s : 1) }); }
    void thick; return spOut(parts, k, orient);
  }
  /* 양쪽 색 차이: 상자를 펴서 열(줄)마다 평균 색 → x−3..x−1 과 x+1..x+3 평균 색 거리 ÷ 80(0~1) */
  function jumpOf(im, b) { const W = Math.max(2, Math.round(b.w)), H = Math.max(2, Math.round(b.h)); const co = Math.cos(b.a), si = Math.sin(b.a); const cm = new Float32Array(W * 3), rm = new Float32Array(H * 3);
    for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) { const x = clamp(Math.round(b.cx + (u - W / 2) * co - (v - H / 2) * si), 0, im.w - 1), y = clamp(Math.round(b.cy + (u - W / 2) * si + (v - H / 2) * co), 0, im.h - 1); const i = (y * im.w + x) * 4; for (let k = 0; k < 3; k++) { cm[u * 3 + k] += im.d[i + k] / H; rm[v * 3 + k] += im.d[i + k] / W; } }
    const J = (M, n) => { const o = new Float32Array(n); for (let x = 3; x < n - 3; x++) { let d = 0; for (let k = 0; k < 3; k++) { const l = (M[(x - 1) * 3 + k] + M[(x - 2) * 3 + k] + M[(x - 3) * 3 + k]) / 3, r = (M[(x + 1) * 3 + k] + M[(x + 2) * 3 + k] + M[(x + 3) * 3 + k]) / 3; d += (l - r) ** 2; } o[x] = Math.min(1, Math.sqrt(d) / 80); } return o; };
    return { c: J(cm, W), r: J(rm, H) }; }
  const maxArr = (a, b) => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.max(a[i], b[i] || 0); return o; };
  /* 봉우리 고르기: 센 것부터 · 서로 minGap 넘게 떨어진 것만 · want개(0이면 문턱 thr 넘는 것 전부) · 끝 2칸은 뺌 */
  function peaks(prof, want, minGap, thr) { const L = prof.length; const C = []; for (let x = 2; x < L - 2; x++) if (prof[x] >= prof[x - 1] && prof[x] >= prof[x + 1] && prof[x] > 0) C.push({ at: x, s: prof[x] }); C.sort((p, q) => q.s - p.s); const out = [];
    for (const c of C) { if (want && out.length >= want) break; if (!want && c.s <= thr) break; if (c.at < minGap * 0.5 || L - c.at < minGap * 0.5) continue; if (out.some((o) => Math.abs(o.at - c.at) < minGap)) continue; out.push(c); }
    return out.sort((p, q) => p.at - q.at); }
  function spOut(parts, k, orient) { const ws = med(parts.map((p) => (orient === 'v' ? p.w : p.h))); const items = parts.map((p) => { const why = []; let c = clamp(0.45 + 0.55 * clamp((p.cut || 0) / 0.6, 0, 1), 0, 0.99); const r = (orient === 'v' ? p.w : p.h) / (ws || 1); if (r > 1.8) { c *= 0.6; why.push(`다른 띠보다 ${Math.round(r * 10) / 10}배 넓음 — 책등 둘이 붙었을 수 있음`); } if (r < 0.45) { c *= 0.6; why.push('다른 띠보다 많이 좁음 — 책등 하나가 둘로 갈렸을 수 있음'); } return { cx: p.cx / k, cy: p.cy / k, w: p.w / k, h: p.h / k, a: p.a || 0, conf: round3(c), why }; });
    items.sort((p, q) => (orient === 'v' ? p.cx - q.cx : p.cy - q.cy)); items.forEach((b, i) => { b.n = i + 1; b.r = orient === 'v' ? 0 : i; b.c = orient === 'v' ? i : 0; }); return { items, orient }; }
  /* 책등 띠 ↔ 상품(차례 있음): 왼→오른 차례를 지키며(건너뛰기 허용) 점수 합이 가장 큰 짝 — 사람이 같은 차례로 세웠을 때 · sim(i, j) 0~1 */
  function alignOrder(nA, nB, sim, skip) {
    const P = skip == null ? 0.15 : skip; const D = []; for (let i = 0; i <= nA; i++) { D.push(new Float64Array(nB + 1)); } const T = []; for (let i = 0; i <= nA; i++) T.push(new Int8Array(nB + 1));
    for (let i = 1; i <= nA; i++) { D[i][0] = D[i - 1][0] - P; T[i][0] = 1; } for (let j = 1; j <= nB; j++) { D[0][j] = D[0][j - 1] - P; T[0][j] = 2; }
    for (let i = 1; i <= nA; i++) for (let j = 1; j <= nB; j++) { const m = D[i - 1][j - 1] + sim(i - 1, j - 1), u = D[i - 1][j] - P, l = D[i][j - 1] - P; if (m >= u && m >= l) { D[i][j] = m; T[i][j] = 0; } else if (u >= l) { D[i][j] = u; T[i][j] = 1; } else { D[i][j] = l; T[i][j] = 2; } }
    const pairs = []; let i = nA, j = nB; while (i > 0 || j > 0) { const t = i > 0 && j > 0 ? T[i][j] : i > 0 ? 1 : 2; if (t === 0) { pairs.push([i - 1, j - 1, round3(sim(i - 1, j - 1))]); i--; j--; } else if (t === 1) i--; else j--; }
    return pairs.reverse();
  }

  /* ═══ 글자로 맞추기(견본 그림 없이 · 정범님 11/14 19:33) — 조각에서 읽은 글자(OCR · 어느 읽기 도구든) ↔ 우리 상품 이름·지은이·출판사
   *  cands = [{ id, title, author, publisher }] (매입 묶음 목록이 있으면 그것 · 없으면 상품 전체) · 글자 두 개씩 묶음(바이그램) 겹침 + 들어 있음 덤
   *  결과 [{ id, s(0~1), why }] 점수 순 · 책등 글자는 세로로 읽혀 띄어쓰기·순서가 흐트러지므로 낱자 순서에 덜 민감한 바이그램을 씀 ═══ */
  const normTxt = (t) => String(t || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/[^0-9a-z가-힣]/g, '');
  const grams = (t) => { const g = new Map(); for (let i = 0; i < t.length - 1; i++) { const k = t.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } if (t.length === 1) g.set(t, 1); return g; };
  function dice(a, b) { if (!a.size || !b.size) return 0; let n = 0, na = 0, nb = 0; for (const v of a.values()) na += v; for (const v of b.values()) nb += v; for (const [k, v] of a) if (b.has(k)) n += Math.min(v, b.get(k)); return (2 * n) / (na + nb); }
  /* 짧은 이름(상품 쪽)이 긴 글(읽은 쪽)에 얼마나 들어 있나 — 책등엔 이름+지은이+출판사가 한 줄로 섞임 */
  function cover(name, text) { if (!name.size) return 0; let n = 0, tot = 0; for (const [k, v] of name) { tot += v; if (text.has(k)) n += Math.min(v, text.get(k)); } return n / tot; }
  function textMatch(text, cands, opt) { const T = grams(normTxt(text)); if (!T.size) return []; const W = Object.assign({ title: 1, author: 0.35, publisher: 0.2 }, (opt && opt.w) || {}); const out = [];
    for (const c of cands || []) { const ti = grams(normTxt(c.title)), au = grams(normTxt(c.author)), pu = grams(normTxt(c.publisher)); if (!ti.size) continue;
      const st = Math.max(dice(ti, T), cover(ti, T) * (ti.size >= 3 ? 1 : 0.7)), sa = au.size ? cover(au, T) : 0, sp = pu.size ? cover(pu, T) : 0;
      const s = clamp((W.title * st + W.author * sa + W.publisher * sp) / (W.title + (au.size ? W.author : 0) + (pu.size ? W.publisher : 0)) * (0.85 + 0.15 * st), 0, 1);
      out.push({ id: c.id, s: round3(s), why: `이름 ${Math.round(st * 100)}%${au.size ? ` · 지은이 ${Math.round(sa * 100)}%` : ''}${pu.size ? ` · 출판사 ${Math.round(sp * 100)}%` : ''}` }); }
    out.sort((p, q) => q.s - p.s); return out.slice(0, (opt && opt.top) || 5); }
  /* 여러 조각 글자 ↔ 묶음 목록(사람이 매입한 책들) — 한 상품은 한 조각에만 · 확신 = 점수와 다음 후보와의 차 */
  function textAssign(texts, cands) { const R = texts.map((t) => textMatch(t, cands, { top: cands.length })); const ids = cands.map((c) => c.id); const M = R.map((r) => ids.map((id) => { const x = r.find((y) => y.id === id); return x ? x.s : 0; }));
    return matchSet(M.map((_, i) => i), ids.map((_, j) => j), (i, j) => M[i][j]).map((m, i) => (m && m.s > 0.2 ? { id: ids[m.j], s: m.s, conf: round3(clamp(m.s * 0.6 + m.margin * 1.5, 0, 0.99)), why: (R[i].find((y) => y.id === ids[m.j]) || {}).why || '' } : null)); }

  /* ═══ 확신 → 할 일 ═══ stage: 1 그림자(셈만) · 2 안내(한 번 눌러 확인 · 기본) · 3 작게 실제(문턱 넘는 것만 저절로) · 4 전부 */
  function decide(conf, cal, stage) { const A = (cal && cal.auto) || DEF.auto, K = (cal && cal.ask) || DEF.ask; if (conf >= A) return stage >= 3 ? 'auto' : 'ask'; if (conf >= K) return 'ask'; return 'pick'; }

  /* ═══ 배우기: 사람 확인 기록 → 방법마다 확신 칸별 맞힌 몫(베타 사후) → 저절로 문턱 · 묻기 문턱 · 단계 ═══
   *  recs = [{ m:'back'|'front'|'spine', conf, ok: true(맞음)|false(틀려서 고침) }] · 결과 { m: { n, acc, auto, ask, bins:[[lo, n, ok, mean]] }, all }
   *  단계 규칙(WIRING 2장과 같은 틀): 그림자 → 안내는 확인 30건 · 안내 → 작게 실제는 문턱 위 칸 맞힌 몫 98% 넘고 확인 100건 · 틀린 몫이 5% 넘으면 한 단계 내림 */
  function learn(recs, opt) {
    const C = cfgOf(opt && opt.cfg); const by = {}; for (const r of recs || []) { if (!r || r.conf == null || r.ok == null) continue; const k = r.m || 'all'; (by[k] = by[k] || []).push(r); }
    const out = {};
    for (const [m, L] of Object.entries(by)) { const bins = []; for (let b = 0; b < 10; b++) { const lo = b / 10; const X = L.filter((r) => r.conf >= lo && (r.conf < lo + 0.1 || (b === 9 && r.conf <= 1))); const ok = X.filter((r) => r.ok).length; bins.push([lo, X.length, ok, round3((ok + 1) / (X.length + 2))]); }
      let auto = C.auto; for (let b = 9; b >= 0; b--) { const above = L.filter((r) => r.conf >= b / 10); const ok = above.filter((r) => r.ok).length; const mean = (ok + 1) / (above.length + 2); const lo95 = betaLo(ok + 1, above.length - ok + 1); if (above.length >= C.minN && ok / above.length >= C.target && lo95 >= 0.9) auto = Math.min(auto, b / 10); else if (above.length >= C.minN) break; void mean; }
      auto = Math.max(0.6, auto); let ask = C.ask; const lowOk = bins.filter((x) => x[0] < 0.5 && x[1] >= 10); if (lowOk.length && lowOk.every((x) => x[3] < 0.3)) ask = Math.max(ask, 0.5);
      const ok = L.filter((r) => r.ok).length; out[m] = { n: L.length, ok, acc: round3(L.length ? ok / L.length : 0), auto: round3(auto), ask: round3(ask), bins }; }
    return out;
  }
  /* 베타 분포 아래 5% 어림(정규 근사 · 표본 적으면 보수적으로) */
  function betaLo(a, b) { const n = a + b; const m = a / n; const v = (a * b) / (n * n * (n + 1)); return clamp(m - 1.645 * Math.sqrt(v), 0, 1); }
  function stageNext(cur, st, opt) { const C = cfgOf(opt && opt.cfg); const s = cur || 1; if (!st || !st.n) return { stage: s, why: '사람 확인 기록 없음 — 그대로' }; const wrong = 1 - st.acc;
    if (s > 1 && st.n >= 20 && wrong > 0.05) return { stage: s - 1, why: `틀린 몫 ${Math.round(wrong * 100)}% > 5% — 한 단계 내림` };
    if (s === 1 && st.n >= C.minN) return { stage: 2, why: `사람 확인 ${st.n}건 — 안내(한 번 눌러 확인)로 올림` };
    if (s === 2 && st.n >= 100 && st.acc >= C.target) return { stage: 3, why: `확인 ${st.n}건 · 맞힌 몫 ${Math.round(st.acc * 1000) / 10}% — 문턱 넘는 것만 저절로 적용 후보(켜기는 설정)` };
    return { stage: s, why: `그대로(확인 ${st.n}건 · 맞힌 몫 ${Math.round(st.acc * 1000) / 10}%)` }; }

  /* ══ (0.1.3 · 일꾼 spine4 11/18 · 리드 결정 F57) 📚 책 한 권 옆 사진의 책등 · 펼친 한 장 쪼개기 — 돈 0(화소 셈만)
   *  sideSpine: 비스듬히 세운 책 한 권 사진(왼쪽에 책등이 보임)에서 책등 띠 하나 → { ok, conf, box, why } · 오른쪽 책등(옛 세로쓰기 책)은 다루지 않음
   *   잰 값(우리 'o' 사진 72장+옛 13장 · 사람 정답표 · reports/SPINE4_1118.md): 문턱 0.95에서 받아들임 7장 모두 맞음(7/7) · 책등 보이는 한 권 26장 중 7장 찾음(27%) · 책등 아닌 사진 53장 0장 넘음
   *  splitSpread: 펼친 한 장(뒤표지|책등|앞표지)을 세로선 둘로 셋 → { ok, conf, back, spine, front, seams } · 앞·뒤 표지 폭이 같고 책등 경계는 위에서 아래까지 곧게 이어진다는 것만 씀
   *   opt.ratio = 짐작 책등 폭 ÷ 펼친 폭(도서 크기 '가로x세로x두께' 또는 쪽수에서) — 주면 맞음이 크게 오름(합성 50장: 없이 31/50 · 있으면 43~44/50) · 그림자 단계(기록만) */
  const SIDE = { side: 400, slope: 0.3, minRun: 0.38, edgeT: 14, gap: 0.03, auto: 0.95 };
  const cdist = (d, i, c) => (Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2])) / 3;
  /* 책 테두리: 줄마다 왼쪽·오른쪽 가장자리 색과 3화소 잇달아 다른 첫 자리 */
  function silh(D) { const W = D.w, H = D.h, d = D.d; const bw = Math.max(2, Math.round(W * 0.03)); const xl = new Int16Array(H).fill(-1), xr = new Int16Array(H).fill(-1);
    for (let y = 0; y < H; y++) { const cl = [0, 0, 0], cr = [0, 0, 0]; for (let x = 0; x < bw; x++) { const i = (y * W + x) * 4, j = (y * W + W - 1 - x) * 4; for (let c = 0; c < 3; c++) { cl[c] += d[i + c] / bw; cr[c] += d[j + c] / bw; } }
      for (let x = bw; x < W - 3; x++) { let k = 0; for (let t = 0; t < 3; t++) if (cdist(d, (y * W + x + t) * 4, cl) > 22) k++; if (k === 3) { xl[y] = x; break; } }
      for (let x = W - 1 - bw; x > 3; x--) { let k = 0; for (let t = 0; t < 3; t++) if (cdist(d, (y * W + x - t) * 4, cr) > 22) k++; if (k === 3) { xr[y] = x; break; } } }
    return { xl, xr }; }
  /* 강건 곧은 줄 x = a + s·(y − 가운데) — 세 번 걸러 맞춤 */
  function fitLine(P) { let pts = P.slice(); let a = 0, s = 0; for (let it = 0; it < 3; it++) { const n = pts.length; if (n < 5) return null; let sy = 0, sx = 0, syy = 0, sxy = 0; for (const [y, x] of pts) { sy += y; sx += x; syy += y * y; sxy += x * y; } const vy = syy - sy * sy / n; s = vy > 0 ? (sxy - sx * sy / n) / vy : 0; a = sx / n - s * sy / n; const r = pts.map(([y, x]) => Math.abs(x - (a + s * y))); const t = Math.max(2, med(r) * 2.5); pts = pts.filter((p, i) => r[i] <= t); } return { a, s, n: pts.length }; }
  /* 세로(조금 기운) 곧은 줄 — x마다 기울기를 바꿔 가며 가장 길게 이어진 경계 · 이웃 3칸에서 가장 긴 것만 */
  function vLines(D, o) { const W = D.w, H = D.h, d = D.d; const E = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 2; x < W - 2; x++) { const a = (y * W + x - 2) * 4, b = (y * W + x + 2) * 4; E[y * W + x] = (Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2])) / 3 > o.edgeT ? 1 : 0; }
    const gapN = Math.max(2, Math.round(H * o.gap)); const best = []; const hm = H / 2;
    for (let x0 = 2; x0 < W - 2; x0++) { let bb = null;
      for (let s = -o.slope; s <= o.slope + 1e-9; s += 0.015) { let run = 0, rs = -1, cs = -1, last = -1;
        for (let y = 0; y < H; y++) { const x = Math.round(x0 + s * (y - hm)); if (x < 1 || x >= W - 1) continue; const j = y * W + x; if (E[j] || E[j - 1] || E[j + 1]) { if (cs < 0 || y - last > gapN) cs = y; last = y; const cur = last - cs + 1; if (cur > run) { run = cur; rs = cs; } } }
        if (!bb || run > bb.run) bb = { x: x0, s, run, ys: rs, ye: rs + run - 1 }; }
      best.push(bb); }
    const L = []; for (let i = 0; i < best.length; i++) { const b = best[i]; if (b.run < o.minRun * H) continue; let pk = true; for (let j = Math.max(0, i - 3); j <= Math.min(best.length - 1, i + 3); j++) if (j !== i && (best[j].run > b.run || (best[j].run === b.run && j < i))) pk = false; if (pk) L.push(b); }
    return L; }
  function regionOf(D, xa, sa, xb, sb, y0, y1) { const W = D.w, d = D.d, hm = D.h / 2; let r = 0, g = 0, b = 0, n = 0; const Ls = [];
    for (let y = Math.round(y0); y <= y1; y++) { const a = Math.round(xa + sa * (y - hm)), e = Math.round(xb + sb * (y - hm)); for (let x = Math.max(0, a); x <= Math.min(W - 1, e); x++) { const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; Ls.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); } }
    if (!n) return null; const L = (0.299 * r + 0.587 * g + 0.114 * b) / n; let dev = 0, ink = 0; for (const v of Ls) { dev += Math.abs(v - L); if (v < L - 45) ink++; } const mx = Math.max(r, g, b) / n, mn = Math.min(r, g, b) / n; return { mean: [r / n, g / n, b / n], L, dev: dev / n, ink: ink / n, sat: mx ? (mx - mn) / mx : 0, n }; }
  /* 책 테두리(왼·오른 곧은 줄 · 위·아래) — 둘이 같이 씀 */
  function bookFrame(D, minRows, q) { const W = D.w, H = D.h, hm = H / 2; const { xl, xr } = silh(D); const rows = []; for (let y = 0; y < H; y++) if (xl[y] >= 0 && xr[y] > xl[y] + 0.3 * W) rows.push(y); if (rows.length < minRows * H) return null;
    const top = rows[Math.floor(rows.length * q)], bot = rows[Math.floor(rows.length * (1 - q))]; const mid = rows.filter((y) => y > top + (bot - top) * 0.1 && y < bot - (bot - top) * 0.1);
    const FL = fitLine(mid.map((y) => [y - hm, xl[y]])), FR = fitLine(mid.map((y) => [y - hm, xr[y]])); if (!FL || !FR) return null; return { xl, xr, top, bot, FL, FR, wb: FR.a - FL.a, bh: bot - top }; }
  function sideSpine(img, opt) {
    const o = Object.assign({}, SIDE, opt || {}); const D = down(img, o.side); const W = D.w, H = D.h, hm = H / 2, k = D.k;
    const F = bookFrame(D, 0.4, 0.02); if (!F) return { ok: false, conf: 0, why: '책 테두리 못 찾음' }; const { xl, xr, top, bot, FL, FR, wb, bh } = F;
    const inner = vLines(D, o).filter((c) => c.x > FL.a + 0.012 * W && c.x < FR.a - 0.012 * W && Math.abs(c.s - FL.s) < 0.12);
    const full = inner.filter((c) => c.ye - c.ys > 0.6 * bh && Math.abs(c.ys - top) < 0.12 * bh && Math.abs(c.ye - bot) < 0.12 * bh);
    const folds = full.filter((c) => c.x - FL.a > 0.015 * W && c.x - FL.a < 0.2 * wb); if (!folds.length) return { ok: false, conf: 0, why: '접힌 줄(책등과 표지 사이) 없음' };
    const colM = (x, sl) => { let r = 0, g = 0, b = 0, n = 0; for (let y = Math.round(top + bh * 0.08); y <= bot - bh * 0.08; y++) { const xx = Math.round(x + sl * (y - hm)); if (xx < 0 || xx >= W) continue; const i = (y * W + xx) * 4; r += D.d[i]; g += D.d[i + 1]; b += D.d[i + 2]; n++; } return n ? [r / n, g / n, b / n] : [0, 0, 0]; };
    const jump = (c) => { const a = [0, 0, 0], b = [0, 0, 0]; for (let t = 1; t <= 4; t++) { const p = colM(c.x - t - 1, c.s), q = colM(c.x + t + 1, c.s); for (let u = 0; u < 3; u++) { a[u] += p[u] / 4; b[u] += q[u] / 4; } } return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
    for (const c of folds) { c.j = jump(c); c.fs = (c.run / bh >= 0.7 ? 1 : 0.4) * c.j * (1 + 0.5 * Math.min(1, (c.x - FL.a) / (0.08 * wb))); }
    const B = folds.reduce((p, q) => (q.fs > p.fs ? q : p)); const gw = B.x - FL.a; const y0 = top + bh * 0.1, y1 = bot - bh * 0.1;
    const sp = regionOf(D, FL.a + gw * 0.2, FL.s, FL.a + gw * 0.8, B.s, y0, y1), cv = regionOf(D, B.x + 3, B.s, B.x + 3 + Math.min(wb * 0.5, gw * 4), B.s, y0, y1); if (!sp || !cv) return { ok: false, conf: 0, why: '띠가 비었음' };
    const others = full.filter((c) => c !== B && c.x > B.x + gw * 0.8).length; /* 표지 안 다른 온 높이 줄 = 여러 권·틀 */
    const hAt = (fx) => { let c = 0; for (let y = 0; y < H; y++) if (xl[y] >= 0 && xl[y] <= fx && xr[y] >= fx) c++; return c; }; const hL = hAt(B.x + 4), hR = hAt(FR.a - 4); const persp = (hL - hR) / Math.max(1, hL); /* 원근 — 책등 쪽이 가까워 더 높음 */
    const dL = sp.L - cv.L; const paper = sp.L > 150 && sp.sat < 0.16 && sp.ink < 0.02 && sp.dev < 14; /* 종이 단면(책 배)은 밝고 무늬 없음 */
    let sc = clamp(B.run / bh, 0, 1); sc *= paper ? 0.2 : 1; sc *= others ? 0.5 : 1; sc *= 0.55 + 0.45 * clamp(persp / 0.06, 0, 1); sc *= 0.6 + 0.4 * clamp(-dL / 25, 0, 1);
    const xm = FL.a + gw / 2, s = (FL.s + B.s) / 2, ym = (top + bot) / 2; const box = { cx: (xm + s * (ym - hm)) / k, cy: ym / k, w: gw / k, h: bh * Math.sqrt(1 + s * s) / k, a: -Math.atan(s) };
    return { ok: true, conf: round3(sc), auto: sc >= o.auto, box, side: 'L', why: { w: round3(gw / wb), line: round3(B.run / bh), j: Math.round(B.j), dL: Math.round(dL), persp: round3(persp), others, paper: paper ? 1 : 0 } };
  }
  function splitSpread(img, opt) {
    const o = Object.assign({ side: 500, bands: 3, balT: 0.025, ratio: 0 }, opt || {}); const D = down(img, o.side); const W = D.w, H = D.h, hm = H / 2, k = D.k;
    const F = bookFrame(D, 0.25, 0.03); if (!F) return { ok: false, conf: 0, why: '책 테두리 못 찾음' }; const { top, bot, FL, FR, wb, bh } = F; const s = (FL.s + FR.s) / 2;
    if (wb < 0.3 * W) return { ok: false, conf: 0, why: '책 폭 좁음' }; if (wb / bh < 1.15 || wb / bh > 3) return { ok: false, conf: 0, why: `펼친 한 장 비율 아님(가로÷세로 ${round3(wb / bh)})` };
    const n = Math.round(wb), Bn = o.bands; const Jb = [];
    for (let b = 0; b < Bn; b++) { const y0 = Math.round(top + bh * (0.08 + 0.84 * b / Bn)), y1 = Math.round(top + bh * (0.08 + 0.84 * (b + 1) / Bn)); const M = new Float32Array(n * 3), E = new Float32Array(n);
      for (let u = 0; u < n; u++) { let r = 0, g = 0, bl = 0, c = 0, e = 0; for (let y = y0; y < y1; y++) { const x = Math.round(FL.a + u + s * (y - hm)); if (x < 1 || x >= W - 1) continue; const i = (y * W + x) * 4; r += D.d[i]; g += D.d[i + 1]; bl += D.d[i + 2]; c++; if (cdist(D.d, i - 4, [D.d[i + 4], D.d[i + 5], D.d[i + 6]]) > 14) e++; } if (c) { M[u * 3] = r / c; M[u * 3 + 1] = g / c; M[u * 3 + 2] = bl / c; E[u] = e / c; } }
      const J = new Float32Array(n); for (let u = 6; u < n - 6; u++) { const p = [0, 0, 0], q = [0, 0, 0]; for (let t = 2; t <= 5; t++) for (let z = 0; z < 3; z++) { p[z] += M[(u - t) * 3 + z] / 4; q[z] += M[(u + t) * 3 + z] / 4; } J[u] = Math.min(1, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 60) * 0.6 + Math.max(E[u - 1], E[u], E[u + 1]) * 0.4; }
      Jb.push(J); }
    const Jm = (u) => { let m = 1; for (const J of Jb) { let v = 0; for (let t = -1; t <= 1; t++) v = Math.max(v, J[u + t] || 0); m = Math.min(m, v); } return m; }; /* 위·가운데·아래 셋 다에서 경계여야 함 */
    const wmin = Math.max(3, 0.008 * wb), wmax = 0.2 * wb; const C = [];
    for (let x1 = Math.round(0.38 * wb); x1 < 0.5 * wb; x1++) for (let x2 = Math.round(x1 + wmin); x2 <= x1 + wmax && x2 < 0.62 * wb; x2++) { const bal = Math.abs(x1 - (n - x2)) / wb; if (bal > o.balT) continue; let sc = Math.min(Jm(x1), Jm(x2)) * (1 - (bal / o.balT) * 0.5); if (o.ratio > 0) { const l = Math.log((x2 - x1) / (o.ratio * wb)); sc *= Math.exp(-(l * l) / (2 * 0.3 * 0.3)); } C.push({ x1, x2, sc }); }
    if (!C.length) return { ok: false, conf: 0, why: '세로선 짝 없음' }; C.sort((p, q) => q.sc - p.sc); const best = C[0]; const sec = (C.find((c) => Math.abs(c.x1 - best.x1) > 3 || Math.abs(c.x2 - best.x2) > 3) || { sc: 0 }).sc;
    const ym = (top + bot) / 2; const X = (u) => (FL.a + u + s * (ym - hm)) / k; const box = (u0, u1) => ({ cx: X((u0 + u1) / 2), cy: ym / k, w: (u1 - u0) / k, h: (bh * Math.sqrt(1 + s * s)) / k, a: -Math.atan(s) });
    const conf = clamp(best.sc * 1.5, 0, 1) * clamp(((best.sc - sec) / Math.max(1e-6, best.sc)) * 4, 0, 1);
    return { ok: true, conf: round3(conf), back: box(0, best.x1), spine: box(best.x1, best.x2), front: box(best.x2, n), seams: [X(best.x1), X(best.x2)], why: { sc: round3(best.sc), sec: round3(sec), w: round3((best.x2 - best.x1) / wb), prior: o.ratio > 0 ? round3(o.ratio) : null } };
  }
  /* 짐작 책등 몫(책등 폭 ÷ 펼친 폭) — 크기 '가로x세로x두께'(mm) 먼저 · 없으면 쪽수(한 쪽 약 0.06mm · 첫 값) · 모르면 0 */
  function spineRatio(sz, pages) { const m = /^(\d{2,3})x(\d{2,3})(?:x(\d{1,3}))?$/.exec(String(sz || '')); const w = m ? +m[1] : 140; const d = m && m[3] ? +m[3] : pages > 0 ? pages * 0.06 + 1 : 0; return d > 0 ? round3(d / (2 * w + d)) : 0; }
  /* 기운 상자를 원본에서 잘라 세운 그림(RGBA) — 책등 띠 저장용 · 겹선형 보간 */
  function cropBox(img, b, maxH) { const sc = Math.min(1, (maxH || 1e9) / b.h); const w = Math.max(1, Math.round(b.w * sc)), h = Math.max(1, Math.round(b.h * sc)); const d = new Uint8ClampedArray(w * h * 4); const co = Math.cos(b.a), si = Math.sin(b.a);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x + 0.5) / sc - b.w / 2, v = (y + 0.5) / sc - b.h / 2; const X = b.cx + u * co - v * si - 0.5, Y = b.cy + u * si + v * co - 0.5; const x0 = Math.max(0, Math.min(img.w - 2, Math.floor(X))), y0 = Math.max(0, Math.min(img.h - 2, Math.floor(Y))); const fx = clamp(X - x0, 0, 1), fy = clamp(Y - y0, 0, 1); const o = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) { const p = (q, r) => img.d[((y0 + r) * img.w + x0 + q) * 4 + c]; d[o + c] = (p(0, 0) * (1 - fx) + p(1, 0) * fx) * (1 - fy) + (p(0, 1) * (1 - fx) + p(1, 1) * fx) * fy; } d[o + 3] = 255; }
    return { w, h, d }; }


  return { VERSION, DEF, ncc, peaks, textMatch, textAssign, normTxt, down, bgOf, segment, order, assign, pairFB, sig, simil, colorSim, matchSet, spines, alignOrder, decide, learn, stageNext, eanOk, isIsbn, inBox, sideSpine, splitSpread, spineRatio, cropBox, SIDE, _t: { silh, fitLine, vLines, bookFrame, comps, morph, fillHoles, maskOf, splitBox, colEdge, straight, seedRanges, clusters, betaLo } };
});
