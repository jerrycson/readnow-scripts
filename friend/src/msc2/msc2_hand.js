/* ── v2 손(바이블 §6): 손바닥 덩어리 + 다섯 손가락 사슬(3D) → 정면 투영 · 깊이 차례로 그림 ──
 *  손 길이: 어른 여 0.68H · 남 0.75H · 손바닥 = 손가락 = 1/2 · 마디 1 : 0.7 : 0.55 · 길이 가운데 1 · 검지≈약지 0.92 · 새끼 0.75(약지 끝마디에서 끝남)
 *  말림 연쇄(편한 손): 검지 15~25° · 가운데 25~35° · 약지 35~45° · 새끼 45~60°(MCP : PIP : DIP = 0.4 : 0.4 : 0.2) · 약지 ≥ 0.6 × 가운데 · 새끼 ≥ 0.7 × 약지(묶임)
 *  엄지: 손목 쪽 1/3에서 손바닥 면 밖으로 30~45° · 쉬면 끝이 검지 가운데 마디 옆 · 손가락은 MCP에서만 벌어짐(굽은 손가락은 못 벌림) */
const MSC2_HP = { /* c: [검지·가운데·약지·새끼] 각 [MCP, PIP, DIP]° · sp: 벌림° · t: 엄지 [벌림, 앞으로, MCP, IP]° · wr: [손목 굽힘(+손바닥 쪽), 옆 꺾임] · pr: 엎침(+손바닥이 뒤로) · n: 손바닥 방향 힌트(몸 좌표 · s = 바깥 부호를 곱함) */
  relaxed: { c: [[12, 12, 6], [16, 16, 8], [20, 20, 10], [24, 24, 12]], sp: [2, 0, -2, -4], t: [12, 3, 8, 10], wr: [10, 0], pr: 0, n: [-0.94, 0, -0.34] }, /* 손바닥이 허벅지를 봄 · 거의 옆에서 보임(엄지가 앞 · 손가락이 겹쳐 말림) */ /* 손바닥은 허벅지 쪽 · 손등이 조금 앞·바깥으로(5d6400d6) */
  open: { c: [[0, 4, 2], [0, 4, 2], [0, 5, 2], [0, 6, 3]], sp: [8, 0, -8, -16], t: [40, 22, 10, 14], wr: [-5, 0], pr: 0, n: [0, 0, 1] },
  wave: { c: [[0, 4, 2], [0, 4, 2], [0, 5, 2], [0, 6, 3]], sp: [7, 0, -7, -14], t: [38, 22, 10, 14], wr: [-10, 0], pr: 0, n: [0, 0, 1] },
  point: { c: [[0, 2, 0], [55, 95, 55], [65, 100, 60], [72, 100, 60]], sp: [0, 0, -2, -4], t: [15, 55, 30, 25], wr: [0, 0], pr: 0, n: [-0.7, 0, -0.7] },
  fist: { c: [[80, 95, 60], [84, 98, 62], [86, 100, 64], [88, 100, 64]], sp: [0, 0, 0, 0], t: [15, 58, 40, 30], wr: [5, 0], pr: 0, n: [-0.7, 0, -0.7] },
  peace: { c: [[0, 2, 0], [0, 2, 0], [80, 98, 62], [84, 100, 64]], sp: [13, -13, -4, -6], t: [20, 60, 38, 30], wr: [-25, 0], pr: 0, n: [0, 0, 1] },
  cup: { c: [[30, 38, 25], [34, 40, 25], [36, 42, 26], [38, 44, 26]], sp: [4, 0, -2, -4], t: [30, 34, 15, 10], wr: [5, 0], pr: 0, n: [-0.6, 0, -0.8] },
  offer: { c: [[8, 12, 8], [8, 12, 8], [10, 14, 8], [12, 16, 10]], sp: [6, 0, -6, -12], t: [40, 24, 12, 16], wr: [-10, 0], pr: 0, n: [0, -1, 0.3] },
  thumbsup: { c: [[82, 96, 60], [86, 98, 62], [88, 100, 64], [90, 100, 64]], sp: [0, 0, 0, 0], t: [62, -8, 0, 4], wr: [0, 0], pr: 0, n: [-0.75, 0, 0.66] },
  bookhold: { c: [[22, 24, 14], [24, 26, 14], [26, 28, 16], [30, 30, 18]], sp: [2, 0, -2, -4], t: [62, 8, 4, 6], wr: [-8, 0], pr: 0, n: [-1, 0, 0] },
  hip: { c: [[18, 26, 14], [20, 28, 14], [22, 30, 16], [26, 32, 16]], sp: [3, 0, -3, -6], t: [40, -20, 10, 10], wr: [28, 0], pr: 0, n: [-1, 0, 0.35] }, /* 손바닥이 엉덩이 옆을 감싸고 손가락은 앞·아래로 · 엄지는 뒤(2c528dc8) */
  grip: { c: [[30, 40, 22], [34, 44, 24], [36, 46, 26], [40, 48, 26]], sp: [3, 0, -3, -6], t: [40, 25, 10, 8], wr: [5, 0], pr: 0, n: [0, 0, -1] },
  tuck: { hide: 1 }, chin: { c: [[40, 70, 40], [60, 90, 50], [70, 95, 55], [75, 95, 55]], sp: [0, 0, 0, 0], t: [30, 30, 10, 10], wr: [-30, 0], pr: 0, n: [-0.3, 0, 1] }, clasp: { c: [[35, 40, 20], [38, 42, 22], [40, 44, 22], [44, 46, 24]], sp: [2, 0, -2, -4], t: [25, 30, 10, 10], wr: [10, 30], /* (r17 arms R5) 모은 손은 손목을 자쪽으로 30° 꺾어 손가락이 아래·가운데로 — 아래팔 방향 그대로 뻗어 두 손이 X로 엇갈리던 것 */ pr: 0, n: [0, -0.3, -1] }, pocket: { hide: 1, pocket: 1 }, /* 주머니 속(손은 안 보임 · 옷이 주머니 입구를 그림) */
  hipfist: { c: [[70, 90, 55], [74, 92, 58], [76, 94, 60], [78, 94, 60]], sp: [0, 0, 0, 0], t: [15, 50, 35, 25], wr: [-25, 0], pr: 10, n: [1, 0, 0] } };
/* 예전 손 모양 이름(MSC_HPOSE 19가지) → 새 손 */
const MSC2_HP_OLD = { cupS: 'cup', cupB: 'cup', cupP: 'cup', relaxedS: 'relaxed', relaxedB: 'relaxed', relaxedP: 'relaxed', palm: 'open', cheek: 'hip', tuck2: 'hip', push: 'point', scratch: 'cup', fistF: 'fist', fistB: 'fist', fistS: 'fist', vee: 'peace', think: 'chin', pocket: 'tuck', book: 'bookhold', pinch: 'point',  claw: 'cup', fistpump: 'fist', hairtouch: 'cup', covermouth: 'cup', hold: 'cup', gun: 'point', ok: 'peace' };
const msc2HP = (k) => MSC2_HP[k] || MSC2_HP[MSC2_HP_OLD[k]] || MSC2_HP.relaxed;
if (typeof MSC2_HP !== 'undefined' && MSC2_HP.open && !MSC2_HP.clap) MSC2_HP.clap = { ...MSC2_HP.open, wr: [-5, 40] }; /* (r17 arms) 박수 손 = 펼친 손 + 손목 노쪽 40°(손가락이 위 · 두 손바닥 맞댐) */
/* 3D 회전(축 a · 각 θ) */ function msc2Rot(v, a, th) { const V = msc2V; const c = Math.cos(th), s = Math.sin(th); return V.add(V.add(V.mul(v, c), V.mul(V.cross(a, v), s)), V.mul(a, V.dot(a, v) * (1 - c))); }
/* 손 뼈대(H · 3D) — 결과 { palm: 점들, fingers: [ [MCP, PIP, DIP, 끝] ×5(엄지 = 4번) ], r: 반지름, z: 깊이 } */
function msc2HandSk(sk, S, hk) { const V = msc2V; const { o, J } = sk; const s = S === 'L' ? -1 : 1; const H = msc2HP(hk); if (H.hide) return { hide: 1 }; const m = o.sex === 'm' && !o.kid; const hl = o.hand; const PL = hl * 0.5, PW = hl * (m ? 0.47 : o.kid ? 0.48 : 0.43);
  const W = J['wr' + S], E = J['el' + S]; let f = V.norm(V.sub(W, E)); let n0 = V.mul([H.n[0] * s, H.n[1], H.n[2]], 1); let n = V.norm(V.sub(n0, V.mul(f, V.dot(n0, f)))); if (V.len(V.sub(n0, V.mul(f, V.dot(n0, f)))) < 0.2) n = V.norm(V.cross(f, [0, 0, 1])); let l = V.mul(V.norm(V.cross(f, n)), s);
  const fx = msc2R(H.wr[0]); { const f2 = V.norm(V.add(V.mul(f, Math.cos(fx)), V.mul(n, Math.sin(fx)))); n = V.norm(V.sub(V.mul(n, Math.cos(fx)), V.mul(f, Math.sin(fx)))); f = f2; } /* 손목 굽힘(손바닥 쪽 +) */
  if (H.wr[1]) { const d = msc2R(H.wr[1]); f = msc2Rot(f, n, d * s); l = msc2Rot(l, n, d * s); }
  if (H.pr) { const d = msc2R(H.pr) * s; n = msc2Rot(n, f, d); l = msc2Rot(l, f, d); } /* 엎침 */
  const at = (a, b, c) => V.add(W, V.add(V.add(V.mul(f, a), V.mul(l, b)), V.mul(n, c)));
  const L0 = [0.92, 1.0, 0.92, 0.75].map((k) => (PL * k) / 1.0), lat = [0.37, 0.12, -0.13, -0.36].map((k) => k * PW), fwd = [0.97, 1.0, 0.97, 0.88].map((k) => k * PL), arch = [0.0, -0.015, -0.01, 0.01].map((k) => k * hl);
  const fingers = []; for (let i = 0; i < 4; i++) { const base = at(fwd[i], lat[i], arch[i]); const c = H.c[i]; const ph = [1, 0.7, 0.55].map((k) => (L0[i] * k) / 2.25); let d = msc2Rot(f, n, msc2R(H.sp[i]) * -s * -1); let nn = n; const pts = [base]; let q = base;
    for (let j = 0; j < 3; j++) { const th = msc2R(c[j]); const d2 = V.norm(V.add(V.mul(d, Math.cos(th)), V.mul(nn, Math.sin(th)))); nn = V.norm(V.sub(V.mul(nn, Math.cos(th)), V.mul(d, Math.sin(th)))); d = d2; q = V.add(q, V.mul(d, ph[j])); pts.push(q); } fingers.push(pts); }
  /* 엄지: CMC(손목 쪽 · 검지 쪽 · 손바닥 쪽) → 손바닥 면에서 벌림 · 면 밖으로(앞으로) · MCP·IP 굽힘은 손바닥 가운데 쪽 */ { const t = H.t; const cmc = at(PL * 0.14, PW * 0.36, hl * 0.06); let d = V.norm(V.add(V.mul(f, Math.cos(msc2R(t[0]))), V.mul(l, Math.sin(msc2R(t[0]))))); d = V.norm(V.add(V.mul(d, Math.cos(msc2R(t[1]))), V.mul(n, Math.sin(msc2R(t[1]))))); const flexAx = V.norm(V.add(V.mul(l, -0.75), V.mul(n, 0.65)));
    const seg = [0.22, 0.16, 0.13].map((k) => k * hl); const pts = [cmc]; let q = cmc; let dd = d; [0, msc2R(t[2]), msc2R(t[3])].forEach((th, j) => { if (th) dd = V.norm(V.add(V.mul(dd, Math.cos(th)), V.mul(flexAx, Math.sin(th)))); q = V.add(q, V.mul(dd, seg[j])); pts.push(q); }); fingers.push(pts); }
  /* 손바닥(손목 상자 2:1 · 손목 = 손바닥 폭의 0.8) — 새끼 쪽 두덩 · 엄지 두덩(손바닥 폭 1/3) */
  const T0 = fingers[4]; const tm = V.add(T0[0], V.mul(V.sub(T0[1], T0[0]), 0.62)); /* 엄지 두덩(손바닥 폭 1/3) — 엄지 손허리뼈는 이 살 속(보이는 관은 MCP부터) */
  const palm = [at(0, PW * 0.36, 0.0), V.add(tm, V.mul(n, -0.01)), at(PL * 0.62, PW * 0.5, hl * 0.02), fingers[0][0], fingers[1][0], fingers[2][0], fingers[3][0], at(PL * 0.55, -PW * 0.52, 0), at(0, -PW * 0.4, 0)]; fingers[4] = [tm].concat(T0.slice(1));
  /* (15차b) 손바닥은 두께가 있는 상자(손목 2:1 · 손등 ↔ 손바닥 0.2~0.24 손 길이) — 옆에서 볼 때 납작한 선으로 사라지지 않게 위·아래 면 점을 모두 투영해 껍질로 */ const th = hl * 0.1; const palm3 = []; palm.forEach((q, i) => { const k = i <= 2 ? 1.15 : 0.85; palm3.push(V.add(q, V.mul(n, th * k))); palm3.push(V.add(q, V.mul(n, -th * 0.9))); });
  const r = hl * (m ? 0.058 : o.kid ? 0.066 : 0.052); return { palm, palm3, fingers, r, f, n, l, hide: !!H.hide, H }; }
/* ══ (15차f) 손 그리기 다시 — '부품 합집합' 손(바이블 §6 · 5220b279 · 3c2dc31e · 850a8942 · 532dc7ba · 60391896)
 *  15차d = 손 하나를 손으로 찍은 실루엣 점 목록 → 4배에서 '지느러미(편한 손)·벙어리장갑(주먹·엄지척)' — 손가락 무리·마디 계단·엄지 두 마디가 안 읽힘
 *  지금 = 손바닥 판 + 손가락 마디마다 캡슐(끝으로 가늘어짐 · 마디 끝이 다음 마디 시작보다 살짝 굵음 = 마디 계단) + 엄지 두덩 + 엄지 두 마디(IP 주름)
 *         → 부품을 모두 한 path(같은 감김 · nonzero = 합집합)로 칠하고 같은 path를 굵은 선으로 뒤에 깜 = 바깥 윤곽만(선 뒤 칠 · 계획 §2.4)
 *         + 앞 부품이 뒤 부품 위에 겹친 둘레만 가는 붓선(자동 · 손가락 사이 · 엄지가 손가락 위) = 검은 틈 대신 윤곽 홈 + 짧은 안쪽 선(5220b279)
 *         + 정해 둔 안쪽 선: 주먹 마디 줄(m2-hk-kn) · 엄지 IP 주름(m2-hk-ip) · 마디 주름·손금(확대) · 손톱(손등 쪽 · 확대)
 *  틀 좌표: 손목 가운데 (0,0) · y = 손바닥 축(손목 → 가운데 손가락 뿌리 0.5 · 손끝 1) · x+ = 틀의 기준 쪽(ref: thumb 엄지 쪽 / palm 손바닥 쪽) · 단위 = 손 길이
 *  남자 틀 따로(바이블 §6.1 · 60391896): 손가락 굵게(×1.12) · 끝이 덜 가늘고 각짐(sq) · 손바닥 넓게 · 손등 마디 / 여자: 끝으로 가늘어짐 · 마디 거의 안 보임 / 꼬마: 통통·짧게 */
const msc2HPts = (s) => s.trim().split(/\s+/).map((t) => { const c = t.endsWith('*'); const [x, y] = t.replace('*', '').split(',').map(Number); return c ? [x, y, 1] : [x, y]; });
const MSC2_HGEO = { f: { fw: 1, sq: 0.06, tip: 0.8, pw: 1, kn: 0 }, m: { fw: 1.12, sq: 0.42, tip: 0.93, pw: 1.05, kn: 1 }, k: { fw: 1.2, sq: 0.12, tip: 0.9, pw: 1.03, kn: 0 }, o: { fw: 1.04, sq: 0.3, tip: 0.86, pw: 1.02, kn: 1 } };
/* 도형 → 3차 베지어 마디(틀 좌표) · 모두 같은 감김(시계) */
function msc2HCapB(a, b, ra, rb, sq) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6; const u = [dx / l, dy / l], v = [-u[1], u[0]]; const k = 0.5523 + (sq || 0) * 0.38; const P = (c, x, y) => [c[0] + u[0] * x + v[0] * y, c[1] + u[1] * x + v[1] * y];
  const A1 = P(a, 0, ra), B1 = P(b, 0, rb), T = P(b, rb, 0), B2 = P(b, 0, -rb), A2 = P(a, 0, -ra), T0 = P(a, -ra, 0);
  return { s: A1, g: [['L', B1], ['C', P(b, rb * k, rb), P(b, rb, rb * k), T], ['C', P(b, rb, -rb * k), P(b, rb * k, -rb), B2], ['L', A2], ['C', P(a, -ra * k, -ra), P(a, -ra, -ra * k), T0], ['C', P(a, -ra, ra * k), P(a, -ra * k, ra), A1]] }; }
/* (15차f) 손가락 하나 = 사슬 한 도형(마디 점마다 폭 · 끝 반원 · 뿌리 반원) — 마디마다 캡슐 셋보다 짧음 · 마디에서 살짝 도톰(계단) */
function msc2HChainB(J, R, sq) { const n = J.length; const k = 0.5523 + (sq || 0) * 0.38; const dir = (i) => { const a = J[Math.max(0, i - 1)], b = J[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6; return [dx / l, dy / l]; };
  const side = (i, sg) => { const u = dir(i), v = [-u[1], u[0]]; return [J[i][0] + v[0] * R[i] * sg, J[i][1] + v[1] * R[i] * sg]; };
  const ue = dir(n - 1), ve = [-ue[1], ue[0]], u0 = dir(0), v0 = [-u0[1], u0[0]]; const e = J[n - 1], b = J[0], re = R[n - 1], r0 = R[0]; const P = (c, u, v, x, y) => [c[0] + u[0] * x + v[0] * y, c[1] + u[1] * x + v[1] * y];
  const g = []; for (let i = 1; i < n; i++) g.push(['L', side(i, 1)]); const T = P(e, ue, ve, re, 0); g.push(['C', P(e, ue, ve, re * k, re), P(e, ue, ve, re, re * k), T], ['C', P(e, ue, ve, re, -re * k), P(e, ue, ve, re * k, -re), side(n - 1, -1)]);
  for (let i = n - 2; i >= 0; i--) g.push(['L', side(i, -1)]); const T0 = P(b, u0, v0, -r0, 0); g.push(['C', P(b, u0, v0, -r0 * k, -r0), P(b, u0, v0, -r0, -r0 * k), T0], ['C', P(b, u0, v0, -r0, r0 * k), P(b, u0, v0, -r0 * k, r0), side(0, 1)]); return { s: side(0, 1), g }; }
function msc2HEllB(c, rx, ry, rot) { const r = ((rot || 0) * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r); const P = (x, y) => [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs]; const k = 0.5523;
  return { s: P(-rx, 0), g: [['C', P(-rx, ry * k), P(-rx * k, ry), P(0, ry)], ['C', P(rx * k, ry), P(rx, ry * k), P(rx, 0)], ['C', P(rx, -ry * k), P(rx * k, -ry), P(0, -ry)], ['C', P(-rx * k, -ry), P(-rx, -ry * k), P(-rx, 0)]] }; }
const msc2HArea = (P) => P.reduce((a, q, i) => { const n = P[(i + 1) % P.length]; return a + q[0] * n[1] - n[0] * q[1]; }, 0);
function msc2HPolyB(P) { const cw = msc2HArea(msc2HCapB([0, 0], [0, 1], 0.1, 0.1).g.map((x) => x[x.length - 1])) > 0; if ((msc2HArea(P) > 0) !== cw) P = P.slice().reverse(); const n = P.length; const g = []; for (let i = 0; i < n; i++) { const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n]; const t1 = p1[2] ? [0, 0] : [(p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6], t2 = p2[2] ? [0, 0] : [(p3[0] - p1[0]) / 6, (p3[1] - p1[1]) / 6]; g.push(['C', [p1[0] + t1[0], p1[1] + t1[1]], [p2[0] - t2[0], p2[1] - t2[1]], [p2[0], p2[1]]]); } return { s: [P[0][0], P[0][1]], g }; }
/* 베지어 → 점(겹침 계산용) */
function msc2HSamp(sh, n) { const out = []; let p = sh.s; sh.g.forEach((sg) => { if (sg[0] === 'L') { for (let i = 1; i <= 2; i++) out.push([p[0] + ((sg[1][0] - p[0]) * i) / 2, p[1] + ((sg[1][1] - p[1]) * i) / 2]); p = sg[1]; } else { const [, c1, c2, e] = sg; for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; out.push([m * m * m * p[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * e[0], m * m * m * p[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * e[1]]); } p = e; } }); return out; }
const msc2HIn = (q, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
/* 틀 만들개: 부품(깊이 d · 무리 gr · 위에 선을 긋는 무리 ov) · 손가락 사슬 */
function msc2HBld(G) { const B = { parts: [], lines: [], nails: [], kn: [] };
  B.add = (sh, gr, d, ov, x) => { B.parts.push({ ...sh, gr, d: d || 0, ov: ov || null, ...(x || {}) }); return sh; };
  B.cap = (a, b, ra, rb, gr, d, ov, x) => B.add(msc2HCapB(a, b, ra, rb, G.sq), gr, d, ov, x);
  B.poly = (s, gr, d, ov) => B.add(msc2HPolyB(typeof s === 'string' ? msc2HPts(s) : s), gr, d, ov);
  B.ell = (c, rx, ry, rot, gr, d, ov) => B.add(msc2HEllB(c, rx, ry, rot), gr, d, ov);
  /* 손가락: 뿌리 b · 방향 ang°(+y에서 +x 쪽으로) · 길이 L · 반지름 r · 마디마다 더 굽음 cu[3]° · 마디 1 : 0.7 : 0.55 · 끝 반지름 = r × tip */
  B.fin = (b, ang, L, r, cu, gr, d, ov, o2) => { o2 = o2 || {}; const ls = (o2.ph || [1, 0.7, 0.55]).map((k) => (L * k) / 2.25); let a = ang, p = b; const J = [b]; const rr = [r, r * 0.95, r * 0.9, r * (o2.tip || G.tip) * 0.92]; let segs = 0;
    const chain = Math.max(...(cu || [0, 0, 0]).slice(1).map(Math.abs)) <= 35; /* 많이 굽은 손가락(주먹·가리키기 접힌 손가락)은 마디 캡슐(꺾임이 둥글게) · 펴진 손가락은 사슬 한 도형(짧음) */ const CJ = [b], CR = [r]; for (let j = 0; j < 3; j++) { a += (cu || [0, 0, 0])[j]; const rad = (a * Math.PI) / 180; const q = [p[0] + Math.sin(rad) * ls[j], p[1] + Math.cos(rad) * ls[j]]; if (ls[j] > 1e-4) { if (chain) { CJ.push(q); CR.push(j === 2 ? rr[3] : rr[j + 1] * 1.04); } else B.cap(p, q, rr[j] * (j ? 0.97 : 1), j === 2 ? rr[3] : rr[j + 1] * 1.03, gr, d, ov, { ow: o2.ow }); segs++; } else if (CJ.length === 1) CJ[0] = q; J.push(q); p = q; }
    if (chain && CJ.length >= 2) B.add(msc2HChainB(CJ, CR, G.sq), gr, d, ov, { ow: o2.ow });
    return { J, a, tipR: rr[3], segs }; };
  B.ln = (s, w, k, cls) => B.lines.push({ p: typeof s === 'string' ? msc2HPts(s) : s, w: w || 1, k: k == null ? 2 : k, cls });
  /* 마디를 가로지르는 짧은 주름(관절 J에서 방향에 수직 · 한쪽만) */
  B.crease = (F, j, r, w, k, cls, side) => { const a = F.J[j], b = F.J[Math.min(F.J.length - 1, j + 1)], c = F.J[Math.max(0, j - 1)]; const dx = b[0] - c[0], dy = b[1] - c[1], l = Math.hypot(dx, dy) || 1; const v = [-dy / l, dx / l]; const s0 = side == null ? 0.75 : side; B.ln([[a[0] - v[0] * r * s0, a[1] - v[1] * r * s0], [a[0] + v[0] * r * 0.75, a[1] + v[1] * r * 0.75]], w || 0.55, k == null ? 3 : k, cls); };
  B.nail = (F, w) => { const a = F.J[2], b = F.J[3]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; B.nails.push({ c: [b[0] - (dx / l) * F.tipR * 0.75, b[1] - (dy / l) * F.tipR * 0.75], u: [dx / l, dy / l], r: F.tipR * (w || 0.62) }); };
  return B; }
/* 겹친 둘레 선(틀 좌표 · 틀마다 한 번): 부품 i의 둘레 점이 ov 무리의 더 낮은 깊이 부품 안이고, 더 높은 깊이 부품 밖이면 긋기 */
function msc2HOverlap(parts) { const S = parts.map((p) => msc2HSamp(p, 6)); const out = [];
  parts.forEach((p, i) => { if (!p.ov) return; const P = S[i], n = P.length; const ins = P.map((q) => !parts.some((o, j) => o.gr === 'm' && msc2HIn(q, S[j])) && parts.some((o, j) => j !== i && o.gr !== p.gr && p.ov.includes(o.gr) && o.d < p.d && msc2HIn(q, S[j])) && !parts.some((o, j) => j !== i && o.gr !== p.gr && o.d > p.d && msc2HIn(q, S[j])));
    if (ins.every(Boolean)) return; let st = ins.findIndex((v) => !v); const runs = []; let cur = null; for (let c = 1; c <= n; c++) { const k = (st + c) % n; if (ins[k]) { if (!cur) cur = [P[(k - 1 + n) % n]]; cur.push(P[k]); } else if (cur) { cur.push(P[k]); runs.push(cur); cur = null; } } if (cur) runs.push(cur);
    runs.forEach((r) => { const L = r.slice(1).reduce((a, q, m) => a + Math.hypot(q[0] - r[m][0], q[1] - r[m][1]), 0); if (L > 0.035) out.push({ p: r.filter((q, m) => m % 2 === 0 || m === r.length - 1), w: p.ow || 0.62, k: p.ok == null ? 2 : p.ok, cls: p.ocls }); }); });
  return out; }
/* ── 틀 모음(성별 G마다 만들어 둠) ── */
/* (15차j ③ · 2c528dc8) 허리에 얹은 손 = 손목은 뒤로 젖혀 허리 옆 · 손가락은 앞으로 눌러 엉덩뼈를 감쌈 — 마디마다 앞(몸 가운데 쪽)으로 굽고(cu°) 감기며 짧아 보임(L · 앞으로 돌아 들어감) · 손끝 방향은 몸 안쪽·아래(aim) */
const MSC2_HIPW = { cu: [-8, -16, -14], k: [0.8, 1, 1, 0.9], L: [0.86, 0.84, 0.82, 0.84], aim: [3.7, 1, 88], wk: 0.84, oldK: 0.75 }; /* (15차k ④) 손끝 방향 = 세로에서 ≈75°(70~80° · 예전 2.4:1 = 65°) — 손가락이 엉덩뼈 위에 거의 가로로 눕힘 */ /* wk = 손 폭(손등이 옆으로 돌아 좁아 보임) */
const MSC2_HTB = {
  /* 펼친 손(open · 손바닥 또는 손등이 보임 · ref 엄지) — 손가락 5~10° 벌림 · 물갈퀴 · 엄지 두덩 + 엄지 두 마디 50° */
  open: (G, sp) => { const B = msc2HBld(G); sp = sp || 1; const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.15,0.12 ${-0.163 * pw},0.3 ${-0.166 * pw},0.45 -0.15,0.54 -0.09,0.565 0,0.57 0.085,0.565 0.135,0.545 ${0.158 * pw},0.45 ${0.158 * pw},0.3 0.145,0.13 0.125,-0.07*`, 'p', 0);
    B.ell([0.105, 0.2], 0.085, 0.14, -20, 'm', 0); B.ell([-0.115, 0.27], 0.055, 0.17, 6, 'm', 0);
    const F = [[[-0.118, 0.5], -6 * sp, 0.36, 0.033, [0, 3, 3]], [[-0.04, 0.515], -2 * sp, 0.45, 0.037, [0, 2, 2]], [[0.038, 0.515], 1 * sp, 0.48, 0.039, [0, 1, 1]], [[0.116, 0.5], 4.5 * sp, 0.45, 0.037, [0, 0, 0]]] /* (r16i ④ · 펼친 손이 갈퀴처럼 벌어짐) 손가락 벌림 19° → 10° · 끝이 살짝 모임(설정표 펼친 손 5220b279 첫 줄 둘째) */.map(([b, a, L, r, cu], i) => B.fin(b, a, L, r * fw, cu, 'f' + i, 1 + (i % 2), ['f0', 'f1', 'f2', 'f3']));
    const T = B.fin([0.165, 0.2], 40 * (sp > 1 ? 1.15 : 1), 0.43, 0.052 * fw, [0, 0, -9], 't', 3, ['f3'], { ph: [0.0001, 1, 0.82] });
    B.crease(T, 2, 0.05 * fw, 0.6, 2, 'm2-hk-ip'); F.forEach((f, i) => { B.crease(f, 1, 0.034 * fw, 0.45, 3); B.crease(f, 2, 0.03 * fw, 0.4, 3); B.nail(f); }); B.nail(T, 0.7);
    B.palm = [B.lines.length]; B.ln('0.17,0.42 0.1,0.36 0.06,0.22 0.07,0.1', 0.55, 2, 'm2-hk-palm'); B.ln('-0.155,0.37 -0.06,0.35 0.05,0.4 0.1,0.45', 0.45, 3, 'm2-hk-palm');
    B.kn = F.map((f) => f.J[0]); return { ref: 'thumb', B, nlOn: 'back' }; },
  wave: (G) => ({ ...MSC2_HTB.open(G, 1.35), aim: [0, -1, 65] }),
  /* 편한 손(relaxed · 옆 · ref 손바닥) — 검지가 가장 덜 말림 · 가운데·약지·새끼 끝이 계단처럼 손바닥 쪽으로 · 엄지가 앞에서 끝이 검지 가운데 마디 옆(850a8942 · 바이블 §6.2) */
  relaxed: (G, cu0) => { const B = msc2HBld(G); const fw = G.fw; const k = cu0 || 1;
    B.poly(`-0.112,-0.07* -0.118,0.12 -0.115,0.3 -0.105,0.44 -0.088,0.515 -0.04,0.548 0.03,0.54 0.075,0.5 0.105,0.42 0.135,0.3 0.15,0.2 0.135,0.08 0.115,-0.07*`, 'p', 0);
    const fc = [[12, 18, 9], [15, 22, 11], [19, 26, 13], [24, 30, 15]].map((c) => c.map((x) => Math.min(95, x * k)));
    const sp = [[-0.03, 0.47, 0.375, 0.036], [-0.042, 0.5, 0.46, 0.04], [-0.046, 0.51, 0.5, 0.042], [-0.05, 0.505, 0.46, 0.041]]; /* 새끼 → 검지(뒤 → 앞) · 손등 선은 같고 끝만 계단(말림 연쇄) · 새끼 뿌리는 낮음(마디 줄 호) */
    sp.forEach(([x, y, L, r], i) => B.fin([x, y], -2, L, r * fw, fc[3 - i], 'f' + i, 1 + i, ['f0', 'f1', 'f2'], { ow: 0.55 }));
    const T = B.fin([0.1, 0.16], -10, 0.42, 0.05 * fw, [0, 10, 18], 't', 6, ['f0', 'f1', 'f2', 'f3', 'p'], { ph: [0.0001, 1, 0.8] }); B.ell([0.105, 0.21], 0.06, 0.12, 10, 'm', 0);
    B.crease(T, 2, 0.048 * fw, 0.6, 2, 'm2-hk-ip', 0.2); B.nail(T, 0.6);
    B.ln('-0.105,0.45 -0.098,0.5 -0.075,0.535', 0.45, 3); B.kn = []; /* (15차g · 떠 있는 분홍 선) 옆에서 본 편한 손은 마디가 윤곽 위 — 마디 표시가 윤곽 밖으로 삐져 떠 보였음 */ return { ref: 'palm', B, nlOn: 'any' }; },
  cup: (G) => ({ ...MSC2_HTB.relaxed(G, 1.6) }),
  /* 내미는 손(offer · 옆 · 손바닥 위) — 손가락 펴고 마디마다 살짝 휨 · 엄지는 손바닥 쪽 위로(55ed9a23) */
  offer: (G) => { const B = msc2HBld(G); const fw = G.fw;
    B.poly('-0.125,-0.07* -0.136,0.15 -0.136,0.35 -0.125,0.5 -0.08,0.56 0.03,0.56 0.1,0.5 0.15,0.38 0.16,0.25 0.15,0.12 0.125,-0.07*', 'p', 0);
    [[-0.03, 0.48, 0.36, 0.033, [12, 18, 12]], [-0.036, 0.5, 0.44, 0.038, [8, 13, 9]], [-0.04, 0.505, 0.48, 0.04, [5, 9, 7]], [-0.045, 0.5, 0.44, 0.039, [2, 6, 5]]].forEach(([x, y, L, r, cu], i) => B.fin([x, y], -1 + i * 0.6, L, r * fw, cu, 'f' + i, 1 + i, ['f0', 'f1', 'f2']));
    const T = B.fin([0.12, 0.2], 26, 0.42, 0.05 * fw, [0, 8, 4], 't', 6, ['f3', 'p'], { ph: [0.0001, 1, 0.82] }); B.ell([0.11, 0.22], 0.06, 0.12, 15, 'm', 0); B.crease(T, 2, 0.048 * fw, 0.6, 2, 'm2-hk-ip'); B.nail(T, 0.6);
    return { ref: 'palm', B, nlOn: 'any' }; },
  /* 주먹 — 보는 쪽마다 틀 셋: F 손가락 쪽(가운데 마디 넷 · 엄지가 검지·가운데를 가로지름) · B 손등(마디 혹 넷 · 마디 줄) · S 옆(엄지 쪽 · 검지 말림 + 엄지 위) */
  fist: (G) => ({ ...MSC2_HTB.fistF(G), v: { palm: 'fistF', back: 'fistB', side: 'fistS' } }),
  fistF: (G) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.15,0.12 ${-0.168 * pw},0.3 ${-0.17 * pw},0.44 ${0.165 * pw},0.44 ${0.162 * pw},0.28 0.15,0.12 0.125,-0.07*`, 'p', 0);
    const X = [-0.126, -0.044, 0.038, 0.12].map((x) => x * pw), top = [0.6, 0.645, 0.665, 0.655], r = [0.037, 0.042, 0.044, 0.042];
    const F = X.map((x, i) => { B.cap([x, 0.44], [x + (i - 1.5) * 0.004, top[i] - r[i] * fw], r[i] * fw * 1.02, r[i] * fw, 'f' + i, 1 + (i % 2), ['f0', 'f1', 'f2', 'f3'], { fj: 1 }); return { J: [[x, 0.44], [x, top[i] - r[i] * fw]] }; });
    B.ln(X.map((x, i) => [x, top[i] - r[i] * fw * 1.9 - (i === 3 ? 0.008 : 0)]).map((q, i, a) => (i === 0 ? [q[0] - 0.03, q[1] + 0.01] : q)).concat([[X[3] + 0.035, top[3] - r[3] * fw * 2.1]]), 0.55, 1, 'm2-hk-kn'); /* 마디 줄(PIP 접힌 줄 · 검지 쪽이 가장 높음 · 바이블 §6.2-2) */
    B.ell([0.12, 0.22], 0.07, 0.14, -12, 'm', 0); const T1 = [0.175, 0.3], T2 = [0.11, 0.455], T3 = [-0.015, 0.49];
    B.cap(T1, T2, 0.054 * fw, 0.05 * fw, 't', 6, ['f0', 'f1', 'f2', 'f3', 'p'], { ok: 1 }); B.cap(T2, T3, 0.047 * fw, 0.04 * fw * G.tip * 1.1, 't', 6, ['f0', 'f1', 'f2', 'f3', 'p'], { ok: 1 });
    B.ln([[T2[0] + 0.025, T2[1] + 0.04], [T2[0] - 0.012, T2[1] - 0.038]], 0.6, 2, 'm2-hk-ip'); B.nails.push({ c: [T3[0] + 0.02, T3[1] - 0.004], u: [-0.96, 0.28], r: 0.026 * fw });
    B.kn = X.map((x, i) => [x, top[i] - 0.01]); return { ref: 'thumb', B, nlOn: 'any', fistV: 'F' }; },
  fistB: (G) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.152,0.12 ${-0.166 * pw},0.3 ${-0.168 * pw},0.47 ${0.16 * pw},0.5 ${0.158 * pw},0.3 0.145,0.12 0.125,-0.07*`, 'p', 0);
    const X = [-0.128, -0.045, 0.038, 0.12].map((x) => x * pw), ky = [0.475, 0.51, 0.525, 0.52], bot = [0.6, 0.655, 0.675, 0.665], r = [0.034, 0.04, 0.042, 0.04];
    X.forEach((x, i) => { B.ell([x, ky[i]], r[i] * fw * 1.05, r[i] * fw * 0.8, 0, 'k' + i, 2, null); B.cap([x, ky[i]], [x + (1.5 - i) * 0.003, bot[i] - r[i] * fw], r[i] * fw, r[i] * fw * 1.04, 'f' + i, 1, null, { fj: 0 }); }); /* (r16i ④ · '#' 모양 선 없앰) 손가락 사이 선은 아래 끝 짧게만 */ for (let i = 0; i < 3; i++) { const xm = (X[i] + X[i + 1]) / 2, yb = (bot[i] + bot[i + 1]) / 2 - 0.006; B.ln([[xm, yb - 0.075], [xm + 0.002, yb - 0.01]], 0.55, 2); }
    B.ln(X.map((x, i) => [x, ky[i] + r[i] * fw * 0.6]).map((q, i) => (i === 0 ? [q[0] - 0.035, q[1] - 0.012] : q)).concat([[X[3] + 0.038, ky[3] + 0.012]]), 0.6, 1, 'm2-hk-kn');
        const T1 = [0.15, 0.2], T2 = [0.185, 0.36], T3 = [0.165, 0.475]; B.cap(T1, T2, 0.05 * fw, 0.047 * fw, 't', 0, null); B.cap(T2, T3, 0.045 * fw, 0.038 * fw, 't', 0, null); B.ln([[T2[0] - 0.035, T2[1] - 0.008], [T2[0] + 0.02, T2[1] + 0.006]], 0.55, 2, 'm2-hk-ip');
    B.kn = X.map((x, i) => [x, ky[i] - 0.004]); return { ref: 'thumb', B, nlOn: 'none', fistV: 'B' }; },
  fistS: (G) => { const B = msc2HBld(G); const fw = G.fw; /* 옆(엄지 쪽 · ref 손바닥): 손등 선 x− · 검지 첫 마디가 올라가 둘째 마디가 손바닥 쪽으로 꺾임 · 뒤 손가락 끝은 손바닥 쪽에 층층이 · 엄지가 검지 둘째·셋째 마디 위(5220b279 둘째 줄) */
    B.poly('-0.12,-0.07* -0.13,0.15 -0.13,0.35 -0.118,0.5 -0.08,0.56 0.02,0.56 0.12,0.48 0.15,0.36 0.15,0.2 0.125,-0.07*', 'p', 0);
    [[0.13, 0.4, 0.034], [0.128, 0.47, 0.037], [0.115, 0.535, 0.039]].forEach(([x, y, r], i) => B.cap([x - 0.09, y + 0.035], [x, y], r * fw, r * fw * 0.95, 'f' + i, 1 + i, i === 2 ? ['f0', 'f1'] : null, { ow: 0.5 })); /* (r16i ④) 뒤 손가락끼리 겹친 선 없앰 — 끝 계단만 */
    const r = 0.042 * fw, I1 = [-0.072, 0.5], I2 = [-0.05, 0.655], I3 = [0.075, 0.635], I4 = [0.088, 0.545];
    B.cap(I1, I2, r, r * 0.98, 'f3', 4, ['f0', 'f1', 'f2', 'p']); B.cap(I2, I3, r * 0.97, r * 0.92, 'f3', 4, ['f0', 'f1', 'f2', 'p']); B.cap(I3, I4, r * 0.9, r * 0.8, 'f3', 4, ['f0', 'f1', 'f2', 'p']);
    B.ln([[I2[0] - 0.02, I2[1] - 0.045], [I2[0] + 0.012, I2[1] - 0.022]], 0.55, 1, 'm2-hk-kn'); /* 마디 줄(짧게 · 엄지와 엇갈리지 않게) */ B.ell([0.11, 0.2], 0.06, 0.12, 6, 'm', 0); const T1 = [0.125, 0.26], T2 = [0.145, 0.42], T3 = [0.06, 0.53]; B.cap(T1, T2, 0.052 * fw, 0.049 * fw, 't', 6, ['f0', 'f1', 'f2', 'f3', 'p'], { ok: 1 }); B.cap(T2, T3, 0.046 * fw, 0.038 * fw, 't', 6, ['f0', 'f1', 'f2', 'f3', 'p'], { ok: 1 });
    B.ln([[T2[0] - 0.045, T2[1] + 0.008], [T2[0] + 0.03, T2[1] - 0.016]], 0.6, 2, 'm2-hk-ip'); B.nails.push({ c: [T3[0] + 0.024, T3[1] - 0.018], u: [-0.62, 0.78], r: 0.025 * fw });
    B.kn = [[-0.11, 0.5]]; return { ref: 'palm', B, nlOn: 'any', fistV: 'S' }; },
  hipfist: (G) => ({ ...MSC2_HTB.fistB(G) }),
  /* 엄지척(thumbsup · 주먹을 옆으로 · 틀 x+ = 화면 위) — 접힌 네 손가락 가운데 마디가 층층이 · 엄지 두 마디 + 두덩(5220b279 넷째 줄) */
  thumbsup: (G) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.12,-0.07* -0.146,0.15 ${-0.158 * pw},0.34 ${-0.15 * pw},0.46 0.15,0.46 0.17,0.36 0.16,0.16 0.13,-0.07*`, 'p', 0);
    const X = [-0.118, -0.04, 0.036, 0.11], r = [0.036, 0.04, 0.041, 0.04], tip = [0.555, 0.6, 0.615, 0.6];
    X.forEach((x, i) => B.cap([x * pw, 0.43], [x * pw + 0.002, tip[i] - r[i] * fw], r[i] * fw * 1.04, r[i] * fw, 'f' + i, 1 + (i % 2), ['f0', 'f1', 'f2', 'f3'], { fj: 1 }));
    B.ln(X.map((x, i) => [x * pw - (i === 0 ? 0.03 : 0), 0.468 + i * 0.006]).concat([[X[3] * pw + 0.04, 0.495]]), 0.55, 1, 'm2-hk-kn');
    B.ell([0.135, 0.25], 0.085, 0.11, -25, 'm', 0); const T1 = [0.17, 0.34], T2 = [0.29, 0.365], T3 = [0.395, 0.36];
    B.cap(T1, T2, 0.058 * fw, 0.052 * fw, 't', 6, ['f3', 'p'], { ok: 1 }); B.cap(T2, T3, 0.05 * fw, 0.042 * fw * (G.tip + 0.1), 't', 6, ['f3', 'p'], { ok: 1 });
    B.ln([[T2[0] + 0.004, T2[1] - 0.05], [T2[0] - 0.008, T2[1] + 0.035]], 0.65, 1, 'm2-hk-ip'); B.ln('0.17,0.4 0.2,0.43 0.25,0.42', 0.45, 2); B.nails.push({ c: [T3[0] - 0.012, T3[1] - 0.026], u: [1, -0.08], r: 0.027 * fw });
    B.kn = []; return { ref: 'thumb', up: 1, B, nlOn: 'any' }; },
  /* 가리키기(point · 옆 · ref 손바닥) — 검지만 펴고 나머지는 말림(연쇄 + 20°) · 엄지는 가운데 손가락 위(바이블 §6.2-4) · chin/push/scratch는 검지 굽힘만 다름 */
  point: (G, ic, mid) => { const B = msc2HBld(G); const fw = G.fw;
    B.poly('-0.122,-0.07* -0.136,0.15 -0.138,0.35 -0.13,0.5 -0.06,0.54 0.05,0.53 0.14,0.44 0.17,0.29 0.15,0.12 0.125,-0.07*', 'p', 0);
    [[0.03, 0.455, 0.36, 0.031], [0.02, 0.485, 0.42, 0.035], [0.01, 0.5, mid ? 0.48 : 0.45, 0.037]].forEach(([x, y, L, r], i) => B.fin([x, y], 6 - i * 2, L, r * fw, i === 2 && mid ? mid : [16 + i * 4, 96, 66], 'f' + i, 1 + i, ['f0', 'f1', 'f2', 'p'], { ph: [1, 0.72, 0.45] }));
    const I = B.fin([-0.035, 0.5], -2, 0.47, 0.036 * fw, ic || [0, 2, 2], 'f3', 5, ['f0', 'f1', 'f2', 'p']); B.crease(I, 1, 0.034 * fw, 0.45, 3, null, 0.1); B.crease(I, 2, 0.03 * fw, 0.4, 3, null, 0.1); B.nail(I, 0.55);
    B.ell([0.12, 0.2], 0.06, 0.12, 6, 'm', 0); const T1 = [0.14, 0.27], T2 = [0.165, 0.425], T3 = [0.12, 0.545]; B.cap(T1, T2, 0.052 * fw, 0.049 * fw, 't', 6, ['f0', 'f1', 'f2', 'p'], { ok: 1 }); B.cap(T2, T3, 0.046 * fw, 0.038 * fw, 't', 6, ['f0', 'f1', 'f2', 'p'], { ok: 1 });
    B.ln([[T2[0] - 0.045, T2[1] + 0.006], [T2[0] + 0.03, T2[1] - 0.01]], 0.6, 2, 'm2-hk-ip'); B.nails.push({ c: [T3[0] + 0.025, T3[1] - 0.018], u: [-0.4, 0.92], r: 0.025 * fw });
    B.kn = [[-0.13, 0.5]]; return { ref: 'palm', B, nlOn: 'any' }; },
  chin: (G) => MSC2_HTB.point(G, [18, 34, 24]),
  push: (G) => ({ ...MSC2_HTB.point(G, [-6, 8, 4]), aim: [0.25, -1, 50] }),
  scratch: (G) => ({ ...MSC2_HTB.point(G, [20, 50, 35], [16, 46, 32]), aim: [0.12, -1, 45] }),
  /* 브이(peace · ref 엄지) — 검지·가운데 25~30° 벌림 · 약지·새끼는 접혀 엄지가 누름(532dc7ba 다섯째 줄) */
  peace: (G) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.15,0.12 ${-0.163 * pw},0.3 ${-0.166 * pw},0.45 -0.15,0.54 -0.06,0.56 0.04,0.57 0.13,0.55 ${0.158 * pw},0.45 ${0.158 * pw},0.3 0.145,0.13 0.125,-0.07*`, 'p', 0);
    [[-0.126, 0.6, 0.034], [-0.044, 0.632, 0.039]].forEach(([x, t, r], i) => B.cap([x * pw, 0.47], [x * pw + 0.004, t - r * fw], r * fw * 1.03, r * fw, 'f' + i, 1 + i, ['f0', 'f1', 'p'], { fj: 1 }));
    B.ln([[-0.165, 0.56], [-0.126, 0.552], [-0.044, 0.578], [-0.01, 0.585]], 0.5, 2, 'm2-hk-kn');
    const M = B.fin([0.035, 0.515], -12, 0.5, 0.038 * fw, [0, 1, 1], 'f2', 3, ['f0', 'f1', 'f3', 'p']), I = B.fin([0.115, 0.5], 15, 0.46, 0.036 * fw, [0, -1, -1], 'f3', 4, ['f0', 'f1', 'f2', 'p']);
    [M, I].forEach((f) => { B.crease(f, 1, 0.034 * fw, 0.45, 3); B.crease(f, 2, 0.03 * fw, 0.4, 3); B.nail(f); });
    B.ell([0.11, 0.21], 0.085, 0.14, -18, 'm', 0); const T1 = [0.15, 0.3], T2 = [0.06, 0.44], T3 = [-0.06, 0.5];
    B.cap(T1, T2, 0.053 * fw, 0.049 * fw, 't', 6, ['f0', 'f1', 'p'], { ok: 1 }); B.cap(T2, T3, 0.046 * fw, 0.038 * fw * G.tip * 1.1, 't', 6, ['f0', 'f1', 'p'], { ok: 1 }); B.ln([[T2[0] + 0.028, T2[1] + 0.035], [T2[0] - 0.018, T2[1] - 0.035]], 0.6, 2, 'm2-hk-ip'); B.nails.push({ c: [T3[0] + 0.02, T3[1] - 0.002], u: [-0.9, 0.42], r: 0.025 * fw });
    B.kn = [[-0.126 * pw, 0.5], [-0.044 * pw, 0.52], [0.035, 0.52], [0.115, 0.505]]; return { ref: 'thumb', B, aim: [0, -1, 70], nlOn: 'back' }; },
  /* 허리 손(hip · 손등 · ref 엄지) — 손가락 붙여 앞·아래로 · 엄지는 뒤(2c528dc8) · 볼에 댄 손(cheek)도 같은 손등(손가락 위로) */
  hip: (G, up) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.152,0.12 ${-0.164 * pw},0.3 ${-0.166 * pw},0.47 -0.13,0.54 0,0.56 0.12,0.55 ${0.158 * pw},0.47 ${0.16 * pw},0.3 0.16,0.15 0.125,-0.07*`, 'p', 0);
    const WR = MSC2_HIPW; const F = [[[-0.122, 0.5], -3, 0.375, 0.033, [0, 6, 6]], [[-0.042, 0.515], -1, 0.46, 0.039, [0, 6, 6]], [[0.04, 0.515], 0.5, 0.5, 0.041, [0, 5, 5]], [[0.12, 0.5], 2.5, 0.46, 0.039, [0, 4, 4]]].map(([b, a, L, r, cu], i) => B.fin([b[0] * pw, b[1]], a * (up ? 0.5 : 1), up ? L : L * WR.L[i], r * fw, up ? cu.map((c) => c * 0.3) : WR.cu.map((c) => c * WR.k[i]), 'f' + i, 1 + (i % 2), ['f0', 'f1', 'f2', 'f3']));
    F.forEach((f) => { B.crease(f, 1, 0.034 * fw, 0.42, 3, null, 0.5); B.nail(f, 0.66); }); B.ell([0.15, 0.24], 0.045, 0.12, -8, 'm', 0);
    if (!up) { B.ln([[-0.1 * pw, 0.03], [0, 0.012], [0.1 * pw, 0.03]], 0.5, 2, 'm2-hk-wr'); } /* (15차j ③) 손목 젖힘 주름(손등 쪽 · 손목이 뒤로 꺾임) */
    B.kn = F.map((f) => f.J[0]); return { ref: 'thumb', B, nlOn: 'back', ...(up ? {} : { aim: WR.aim, wk: WR.wk }) }; }, /* (15차i ③) 허리에 얹은 손: 손끝이 아래·안쪽(엉덩이 앞)으로 꺾임(≤80°) — 손바닥이 엉덩뼈 옆에 얹힘 */
  cheek: (G) => ({ ...MSC2_HTB.hip(G, 1), aim: [0, -1, 60] }),
  tuck2: (G) => ({ ...MSC2_HTB.hip(G, 1), aim: [-0.1, -1, 80] }), /* 머리 넘기기: 손가락이 귀 위로(살짝 바깥) */
  /* 감싸 쥔 손(grip · 팔짱 위 손 · 손등) — 손가락이 팔을 감아 뒤로 사라짐(둥근 끝 넷 · 계단) · 엄지 안 보임 */
  grip: (G) => { const B = msc2HBld(G); const fw = G.fw, pw = G.pw;
    B.poly(`-0.125,-0.07* -0.152,0.12 ${-0.164 * pw},0.3 ${-0.166 * pw},0.48 0,0.53 ${0.158 * pw},0.48 ${0.16 * pw},0.3 0.16,0.15 0.125,-0.07*`, 'p', 0);
    const X = [-0.124, -0.043, 0.039, 0.12], bot = [0.7, 0.765, 0.79, 0.77], r = [0.034, 0.039, 0.041, 0.039]; X.forEach((x, i) => B.fin([x * pw, 0.49 + (i ? 0.02 : 0)], (1.5 - i) * -1.2, (bot[i] - 0.49) * 2.25 / 1.7, r[i] * fw, [0, 0, 0], 'f' + i, 1 + (i % 2), ['f0', 'f1', 'f2', 'f3'], { ph: [1, 0.7, 0.0001] }));
    B.ln(X.map((x, i) => [x * pw, 0.5 + (i ? 0.02 : 0) + 0.005]).map((q, i) => (i === 0 ? [q[0] - 0.035, q[1] - 0.01] : q)).concat([[X[3] * pw + 0.038, 0.515]]), 0.45, 3, 'm2-hk-kn');
    B.kn = X.map((x, i) => [x * pw, 0.5 + (i ? 0.02 : 0)]); return { ref: 'thumb', B, nlOn: 'none' }; },
};
MSC2_HTB.clasp = MSC2_HTB.grip; MSC2_HTB.grip0 = MSC2_HTB.cup;
MSC2_HTB.bookhold0 = (G) => ({ ...MSC2_HTB.relaxed(G, 1.7), th: msc2HPts('0.15,0.2 0.22,0.25 0.3,0.33 0.37,0.42 0.4,0.47 0.39,0.505 0.355,0.505 0.29,0.47 0.21,0.43 0.16,0.4') });
/* ══ (r16i ④ · 정범님 10/29~30 '갈퀴·국수처럼 꼬인 손가락 · 크게 벌어진 늘어진 손') 쉬는 손·모은 손·맞잡은 손 다시 짬 — 아니메 설정표 손(850a8942 둘째 줄 · 5220b279 · 3c2dc31e · 바이블 §5.8)
 *  예전: 쉬는 손 틀 하나(옆에서 본 손)를 손등·손바닥이 보일 때도 그대로 써서 손가락 끝이 낫·갈퀴처럼 갈라져 보였고, 맞잡은 손(clasp)은 팔짱 손(grip) 틀(곧은 네 손가락 빗)을 써서 손가락이 부채처럼 퍼졌음
 *  지금: 보는 쪽마다 틀 셋(옆 S · 손등 B · 손바닥 P) — 손가락은 한 덩어리로 모이고(사이 틈 0 · 겹친 둘레만 가는 선) · 말림은 작게(검지 < 가운데 < 약지 < 새끼 · 계단) · 손등·손바닥에서 말림은 '짧아 보임'(마디 단축)으로만 · 엄지는 손바닥 옆에 붙어 검지 가운데 마디 옆에서 끝남 */
const MSC2_HRF = [[0.92, 0.036], [1.0, 0.039], [0.94, 0.038], [0.76, 0.034]]; /* 검지·가운데·약지·새끼 길이 비(가운데 = 1) · 반지름 */
function msc2HRelS(G, k) { const B = msc2HBld(G); const fw = G.fw; k = k || 1; /* 옆(엄지 쪽 · ref 손바닥 x+) — 손등 선 x− 거의 곧게 · 손바닥 쪽 엄지 두덩 볼록 */
  B.poly(k > 2 ? '-0.1,-0.07* -0.104,0.14 -0.098,0.3 -0.085,0.43 -0.06,0.5 -0.02,0.53 0.02,0.53 0.06,0.5 0.095,0.43 0.122,0.33 0.14,0.2 0.128,0.06 0.106,-0.07*' : '-0.104,-0.07* -0.112,0.14 -0.113,0.3 -0.106,0.43 -0.09,0.5 -0.05,0.53 0.0,0.53 0.045,0.505 0.085,0.44 0.118,0.33 0.14,0.2 0.128,0.06 0.106,-0.07*', 'p', 0);
  const base = [[0.014, 0.488], [-0.012, 0.508], [-0.037, 0.514], [-0.062, 0.502]]; /* 새끼(뒤) → 검지(앞) — 마디 줄 호 */
  const cu = [[11, 16, 10], [8, 13, 9], [6, 10, 7], [4, 8, 5]].map((c) => c.map((x) => Math.min(80, x * k)));
  const Lr = [0.76, 0.94, 1.0, 0.92], rr = [0.036, 0.041, 0.043, 0.042]; const F = [];
  const kl = k > 2 ? 0.84 : 1; if (k > 2) base.forEach((b) => (b[0] += 0.03)); /* 깊게 말린 손은 마디 줄이 손바닥 쪽으로 들어감(손등 선이 위로 솟지 않게) */ /* 깊게 말린 손(모은 손 옆)은 손가락이 짧아 보임 */ for (let i = 0; i < 4; i++) F.push(B.fin(base[i], -4 + i * 0.6, 0.47 * Lr[i] * kl, rr[i] * fw, cu[i], 'f' + i, 1 + i, i === 3 ? ['f0', 'f1', 'f2'] : null, { ow: 0.5 })); /* 선은 맨 앞 검지 윤곽 하나만 — 뒤 손가락끼리는 선 없이 끝만 계단으로 비침(국수 줄 없앰) */
  if (G.fw < 1.15) F.forEach((f, i) => [1, 2].forEach((j) => { const q = f.J[j]; if (q) B.ell(q, rr[i] * G.fw * 1.1, rr[i] * G.fw * 0.92, 0, 'f' + i, 1 + i, null); })); /* (3묶음) 옆에서 본 손도 마디 굴곡 */
  B.ell([0.1, 0.22], 0.055, 0.12, 6, 'm', 0);
  const T = B.fin([0.118, 0.2], -12, k > 2 ? 0.4 : 0.46, 0.048 * fw, [0, 6, 10], 't', 6, ['f0', 'f1', 'f2', 'f3', 'p', 'm'], { ph: [0.0001, 1, 0.82], ow: 0.55 });
  B.crease(T, 2, 0.045 * fw, 0.5, 2, 'm2-hk-ip', 0.2); B.nail(T, 0.55); B.crease(F[3], 1, 0.03 * fw, 0.4, 3, null, 0.2);
  B.kn = []; return { ref: 'palm', B, nlOn: 'any' }; }
function msc2HRelF(G, k, palm, clasp) { const B = msc2HBld(G); const fw = G.fw, pw = G.pw; k = k || 1; /* 손등(B) · 손바닥(P) — ref 엄지 x+ */
  /* (r16i ④ 2묶음 · 코디네이터 '판자처럼 곧게 펴짐 · 맞잡은 손이 발처럼') 쉬는 손 = 손가락을 살짝 말아(검지가 가장 덜 · 새끼가 가장 많이 — 말린 만큼 짧아 보임 + 끝이 가운데로 모임) · 엄지는 앞으로 조금 떼어 따로 보임 · 손등 너클 굴곡
   *  맞잡은 손 = 위 손의 네 손가락이 아래 손등을 감싸 둥글게 접혀(첫 마디 + 둥근 끝) · 엄지는 따로 · 사이 선 짧게 */
  B.poly(`-0.122,-0.07* -0.146,0.12 ${-0.156 * pw},0.3 ${-0.154 * pw},0.44 -0.128,0.515 -0.06,0.54 0.02,0.546 0.09,0.536 0.133,0.5 ${0.15 * pw},0.4 ${0.153 * pw},0.28 0.14,0.12 0.122,-0.07*`, 'p', 0);
  const X = [-0.11, -0.038, 0.034, 0.104].map((x) => x * pw), Y = [0.49, 0.512, 0.518, 0.504], Lr = [0.76, 0.94, 1.0, 0.92], R = [0.034, 0.0385, 0.04, 0.0375];
  const F = X.map((x, i) => { const c = clasp || palm ? 3 - i : [3, 2, 0.4, 0.9][i]; /* 말림(짧아 보임) 순위: 새끼 3 · 약지 2 · 검지 0.9 · 가운데 0.4 → 손끝 높이가 엇갈리고 가운데가 가장 김(코디네이터 3묶음) */
    if (clasp) return B.fin([x, Y[i]], [1.5, 0.5, -0.5, -1.5][i], 0.5 * Lr[i], R[i] * fw * 1.03, [0, -7 - c, -10 - c], 'f' + i, 1, null, { ph: [1, 0.86, 0.72], tip: 0.95 }); /* 손가락 네 개가 아래 손등 위로 길게 걸쳐 감싸며 둥글게 휨(5220b279 맞잡은 손) — 끝까지 보임 */
    const kk = Math.min(1, 0.55 + 0.45 * k * 0.6); const sh = [1, Math.max(0.28, (0.82 - 0.11 * c) * (k > 1.2 ? 0.72 : 1)), Math.max(0.1, (0.68 - 0.15 * c) * (k > 1.2 ? 0.6 : 1))];
    const Fi = B.fin([x, Y[i]], [2.2, 0.8, -0.3, -1.3][i], 0.5 * Lr[i] * kk, R[i] * fw * 1.03, [0, 0, 0], 'f' + i, 1, null, { ph: sh, tip: 0.95 }); if (!palm && G.fw < 1.15) [1, 2].forEach((j) => { const q = Fi.J[j]; if (q) B.ell(q, R[i] * fw * 1.12, R[i] * fw * 0.9, 0, 'f' + i, 1, null); }); /* 첫마디·둘째 마디 굴곡(손가락 윤곽이 마디에서 살짝 불룩 — 굽어 보임) · 꼬마·동물(통통한 손 · 관절 없는 동물 손 774d99e5)은 매끈하게 */ return Fi; }); /* 손가락은 나란히(끝이 한 점으로 모이면 뾰족한 발처럼 보임) · 끝은 둥글게 */
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  if (clasp) { [0, 1, 2].forEach((i) => { const m1 = mid(F[i].J[1], F[i + 1].J[1]), m2 = mid(F[i].J[2], F[i + 1].J[2]), m3 = mid(F[i].J[3], F[i + 1].J[3]); B.ln([lp(m1, m2, 0.1), m2, lp(m2, m3, 0.6)], 0.38, 1); }); /* 사이 선 3개 · 끝 쪽만 */ F.forEach((f, i) => { if (i) B.nail(f, 0.45); });
    const Tc = B.fin([0.152, 0.15], 5, 0.4, 0.049 * fw, [0, -4, -8], 't', 3, ['p', 'm', 'f3'], { ph: [0.0001, 1, 0.82], ow: 0.55 }); B.ell([0.125, 0.19], 0.05, 0.11, 4, 'm', 0); B.crease(Tc, 2, 0.045 * fw, 0.45, 2, 'm2-hk-ip', 0.3); B.nail(Tc, 0.5); /* 엄지는 따로(손 옆을 따라 아래로 · 끝이 검지 쪽으로) */
    B.ln('-0.1,0.47 -0.04,0.49 0.03,0.495 0.09,0.48', 0.45, 3); /* 너클 굴곡 */ B.kn = F.map((f) => f.J[0]); return { ref: 'thumb', B, nlOn: 'back' }; }
  for (let i = 0; i < 3; i++) { if (palm && i === 0) continue; const m0 = mid(F[i].J[0], F[i + 1].J[0]), m1 = mid(F[i].J[1], F[i + 1].J[1]), m2 = mid(F[i].J[2], F[i + 1].J[2]), m3 = mid(F[i].J[3], F[i + 1].J[3]); B.ln([lp(m0, m1, 0.45), m1, m2, lp(m2, m3, 0.5)], 0.36, 1); } /* 손가락 사이 = 마디에서 끝 앞까지 가는 선(설정표 850a8942 둘째 줄 첫 손 · 끝은 둥근 홈) */
  if (palm) { F.forEach((f) => B.crease(f, 1, 0.03 * fw, 0.38, 3)); B.ell([0.1, 0.2], 0.075, 0.13, -16, 'm', 0); const T = B.fin([0.14, 0.17], -16, 0.42, 0.05 * fw, [0, -6, -10], 't', 6, ['p', 'm', 'f2', 'f3'], { ph: [0.0001, 1, 0.82] }); B.crease(T, 2, 0.045 * fw, 0.5, 2, 'm2-hk-ip'); B.nail(T, 0.55);
    B.palm = [B.lines.length]; B.ln('0.1,0.38 0.05,0.31 0.03,0.2 0.05,0.08', 0.5, 2, 'm2-hk-palm'); B.ln('-0.14,0.36 -0.06,0.34 0.03,0.38', 0.42, 3, 'm2-hk-palm'); B.kn = []; return { ref: 'thumb', B, nlOn: 'none' }; }
  /* 손등: 엄지는 앞으로 조금 떼어(검지와 틈) 아래로 · 끝이 검지 쪽으로 살짝 */ const T = B.fin([0.152, 0.15], 9, 0.42, 0.049 * fw, [0, -5, -9], 't', 3, ['p', 'm', 'f3'], { ph: [0.0001, 1, 0.82], ow: 0.55 }); B.ell([0.125, 0.19], 0.05, 0.11, 4, 'm', 0); B.crease(T, 2, 0.045 * fw, 0.45, 2, 'm2-hk-ip', 0.3);
  F.forEach((f, i) => { if (i) B.nail(f, 0.46); }); B.ln('-0.06,0.478 0.0,0.492 0.06,0.488', 0.4, 3); /* 너클 선은 하나만(코디네이터 '1~2개') */
  B.kn = []; return { ref: 'thumb', B, nlOn: 'back' }; }
MSC2_HTB.relaxedS0 = MSC2_HTB.relaxed; /* 예전 쉬는 손(되돌리기·비교용) */
MSC2_HTB.relaxedS = (G) => msc2HRelS(G, 1); MSC2_HTB.relaxedB = (G) => msc2HRelF(G, 1, 0); MSC2_HTB.relaxedP = (G) => msc2HRelF(G, 1, 1);
MSC2_HTB.cupS = (G) => msc2HRelS(G, 2.6); /* 모은 손(옆): 손가락이 손바닥 쪽으로 깊게 말림(하품 입 가림 · 컵 쥔 손) */ MSC2_HTB.cupB = (G) => msc2HRelF(G, 1.8, 0); MSC2_HTB.cupP = (G) => msc2HRelF(G, 1.8, 1);
MSC2_HTB.relaxed = (G) => ({ ...MSC2_HTB.relaxedS(G), v: { palm: 'relaxedP', back: 'relaxedB', side: 'relaxedS' } });
MSC2_HTB.cup = (G) => ({ ...MSC2_HTB.cupS(G), v: { palm: 'cupP', back: 'cupB', side: 'cupS' } });
MSC2_HTB.clasp = (G) => msc2HRelF(G, 1, 0, 1); /* 맞잡은 손 = 손등 · 손가락 모아 다른 손을 감쌈(짧아 보임) · 엄지는 아래로 숨음 */
MSC2_HTB.bookhold = (G) => ({ ...msc2HRelS(G, 1.6), th: msc2HPts('-0.02,-0.048 0.08,-0.046 0.16,-0.042 0.205,-0.034 0.232,-0.012 0.234,0.012 0.216,0.032 0.17,0.04 0.08,0.044 -0.02,0.048') });
/* (r16i ④) 벙어리장갑 손(아주 작은 손 · 2~2.5등신 · 로봇) — 예전엔 다섯 손가락 틀을 굵은 살색 선으로 메워 울퉁불퉁한 덩어리·홈이 남음 → 둥근 노 모양 손 + 엄지 하나(설정표 '장갑' 단계 · 바이블 §5.8 LOD) */
MSC2_HTB.mittB = (G) => { const B = msc2HBld(G); B.poly('-0.122,-0.07* -0.15,0.12 -0.162,0.34 -0.158,0.56 -0.13,0.72 -0.065,0.79 0.02,0.795 0.09,0.755 0.13,0.65 0.146,0.46 0.15,0.26 0.14,0.1 0.122,-0.07*', 'p', 0); B.cap([0.13, 0.17], [0.205, 0.4], 0.058 * G.fw, 0.048 * G.fw, 't', 1, ['p'], { ow: 0.6 }); B.kn = []; return { ref: 'thumb', B, nlOn: 'none' }; };
MSC2_HTB.mittS = (G) => { const B = msc2HBld(G); B.poly('-0.102,-0.07* -0.112,0.28 -0.104,0.56 -0.07,0.75 0.0,0.8 0.06,0.75 0.09,0.58 0.118,0.36 0.13,0.18 0.112,-0.07*', 'p', 0); B.cap([0.1, 0.2], [0.115, 0.48], 0.052 * G.fw, 0.044 * G.fw, 't', 1, ['p'], { ow: 0.6 }); B.kn = []; return { ref: 'palm', B, nlOn: 'none' }; };
MSC2_HTB.mitt = (G) => ({ ...MSC2_HTB.mittS(G), v: { palm: 'mittB', back: 'mittB', side: 'mittS' } });
/* ══ (r16i ④) 손 틀 끝 ══ */
/* 틀 완성(성별마다 한 번): 겹친 둘레 선 + 실루엣 점(시험·끌기용) */
const MSC2_HTC = {}; function msc2HTm(hk, gk) { const id = hk + ':' + gk; if (MSC2_HTC[id]) return MSC2_HTC[id]; const f = MSC2_HTB[hk] || MSC2_HTB[MSC2_HP_OLD[hk]] || MSC2_HTB.relaxed; const T = f(MSC2_HGEO[gk] || MSC2_HGEO.f); const B = T.B;
  const ov = msc2HOverlap(B.parts); const sil = []; B.parts.forEach((p) => msc2HSamp(p, 3).forEach((q) => sil.push(q)));
  return (MSC2_HTC[id] = { ...T, parts: B.parts, ln: B.lines.concat(ov), ovN: ov.length, nails: B.nails, kn: B.kn, sil, hk }); }
const MSC2_HT = new Proxy({}, { get: (o, k) => (typeof k === 'string' && MSC2_HTB[k] ? msc2HTm(k, 'f') : undefined), ownKeys: () => Object.keys(MSC2_HTB), getOwnPropertyDescriptor: (o, k) => (MSC2_HTB[k] ? { enumerable: true, configurable: true } : undefined), has: (o, k) => !!MSC2_HTB[k] });
/* 손 LOD(바이블 §6.4): 손 길이 화면 px < 14 = 장갑 · 14~30 = 덩어리 · 30~60 = 다섯 손가락 · > 60 = 손톱·손금 */
const msc2HandLod = (o, pxH) => { if (o.mit) return 0; /* r15e hook: 2~2.5등신·로봇 = 벙어리장갑 손 */ const px = o.hand * (pxH || 40); return px < 14 ? 0 : px < 30 ? 1 : px < 60 ? 2 : 3; };
/* 닫힌 매끈한 곡선(캣멀롬 · 모서리 표시 * 는 꺾임) — 다른 부품(옷·머리)도 씀 */
function msc2HClosed(P) { const n = P.length; const ext = [P[n - 1]].concat(P, [P[0], P[1]]); const S = msc2Segs(ext).slice(1, n + 1); return msc2SD(S) + 'Z'; }
function msc2HOpen(P) { return msc2SD(msc2Segs(P)); }
/* 틀 → 화면: 손목 점 + 축(손바닥 축 y · 기준 쪽 x) · 손목 폭은 아래팔 끝에 맞춤 */
function msc2HXf(sk, S, M, hs, Tm) { const V = msc2V; const { o, J } = sk; const s = S === 'L' ? -1 : 1; const Wj = J['wr' + S], E = J['el' + S]; const hl = o.hand, u = M.u; const PL = hl * 0.5;
  const w2 = [M.X(Wj[0]), M.Y(Wj[1])]; const mc = hs.fingers[1][0]; let d = [(mc[0] - Wj[0]) * u, (mc[1] - Wj[1]) * u]; let dl = Math.hypot(d[0], d[1]); const fa = [(Wj[0] - E[0]) * u, (Wj[1] - E[1]) * u]; const fal = Math.hypot(fa[0], fa[1]) || 1;
  if (dl < PL * u * 0.25) { d = [fa[0] / fal, fa[1] / fal]; dl = PL * u * 0.6; } else d = [d[0] / dl, d[1] / dl]; const fs = Math.max(0.6, Math.min(1, dl / (PL * u)));
  const ref = Tm.ref === 'palm' ? hs.n : hs.l; const med = [-s, 0]; let xa, ya;
  if (Tm.up) { xa = [0, -1]; const sx = d[0] || fa[0] || -s; ya = [sx >= 0 ? 1 : -1, 0]; return { o: w2, xa, ya, sx: 1, sy: 1, fs: 1, mir: 0 }; }
  if (Tm.aim) { const ad = Math.atan2(d[1], d[0]); const am = [Tm.aim[0] * -s, Tm.aim[1]]; const at = Math.atan2(am[1], am[0]); let df = at - ad; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; const lim = ((Tm.aim[2] || 60) * Math.PI) / 180; df = Math.max(-lim, Math.min(lim, df)); if (Tm.aim === MSC2_HIPW.aim && sk.o && sk.o.old) df *= MSC2_HIPW.oldK; /* (15l ③) 노인 허리 손 손목 젖힘을 줄임(40° → 25~35° · 노인 손목 가동 범위) */ if (typeof window !== 'undefined' && window.MSC2_WR) window.MSC2_WR.push({ aim: Tm.aim.join(','), df: +(df * 180 / Math.PI).toFixed(1), old: !!(sk.o && sk.o.old) }); d = [Math.cos(ad + df), Math.sin(ad + df)]; } /* 손목 꺾임으로 손끝을 겨눔(브이·흔들기·볼·안경 = 손가락 위로 · 손목 젖힘 ≤ 60~70°) · aim x는 몸 안쪽(−s) 기준 */
  ya = d; const p1 = [-d[1], d[0]]; let k = ref[0] * p1[0] + ref[1] * p1[1]; if (Math.abs(k) < 0.12) k = med[0] * p1[0] + med[1] * p1[1] || 1; xa = k >= 0 ? p1 : [-p1[0], -p1[1]];
  return { o: w2, xa, ya, fs, mir: k < 0 }; }
/* 그리기(틀 공간 → 화면): 칠 한 path(합집합) + 뒤 굵은 선(손목 쪽은 잘라 아래팔과 이어짐) + 겹친 둘레·정해 둔 선 + 손톱·마디 */
function msc2HDraw(Tm, X, o2) { const { hl, sxB, ww, kid, lod, sk0, ln, skS, lw, facing, m, old } = o2; let id = o2.id;
  const tf = (q) => { let x = q[0], y = q[1]; if (kid && y > 0.5) y = 0.5 + (y - 0.5) * 0.84; const kw = y <= 0.02 ? ww : y >= 0.26 ? 1 : ww + (1 - ww) * ((y - 0.02) / 0.24) ** 1.3; x *= sxB * kw; y *= X.fs || 1; return [X.o[0] + (X.xa[0] * x + X.ya[0] * y) * hl, X.o[1] + (X.xa[1] * x + X.ya[1] * y) * hl]; };
  const R0 = (q) => { const t = tf(q); return [mscF(t[0]), mscF(t[1])]; }; const sd = (p) => { let c = R0(p.s); let s = 'M' + c[0] + ' ' + c[1]; const rl = (q) => mscF(q[0] - c[0]) + ' ' + mscF(q[1] - c[1]); p.g.forEach((g) => { if (g[0] === 'L') { const e = R0(g[1]); s += 'l' + rl(e); c = e; } else { const a = R0(g[1]), b = R0(g[2]), e = R0(g[3]); s += 'c' + rl(a) + ' ' + rl(b) + ' ' + rl(e); c = e; } }); return s.replace(/ -/g, '-') + 'z'; }; /* (15차f) 상대 좌표(짧은 수) — 손 그림 크기 절반 */
  const d = Tm.parts.map(sd).join(''); id += msc2HHash(d + '|' + lod + facing); /* (15차j ①) 공용 손 id = 캐릭터 그림(p) + 손 쪽 + 손 모양(실루엣 글자) 해시 — 예전엔 손 자리만으로 지어 한 화면 두 캐릭터의 손 자리가 같으면 남의 손 모양을 use가 집어 옴 */ const close = [0.075, 0.034, 0, 0][lod] * hl; /* 작을수록 살색 덧선으로 좁은 틈을 메움(장갑 한 덩어리) */
  const cp = [[-0.6, -0.055], [0.6, -0.055], [0.6, 1.6], [-0.6, 1.6]].map((q) => { const a = [X.o[0] + (X.xa[0] * q[0] * sxB + X.ya[0] * q[1] * (X.fs || 1)) * hl, X.o[1] + (X.xa[1] * q[0] * sxB + X.ya[1] * q[1] * (X.fs || 1)) * hl]; return msc2Q(a); });
  const cpS = [[-0.6, 0.06], [0.6, 0.06], [0.6, 1.6], [-0.6, 1.6]].map((q) => msc2Q([X.o[0] + (X.xa[0] * q[0] * sxB + X.ya[0] * q[1] * (X.fs || 1)) * hl, X.o[1] + (X.xa[1] * q[0] * sxB + X.ya[1] * q[1] * (X.fs || 1)) * hl])); /* (15차g · 손목 분홍 띠) 그늘은 손목 자른 곳에서 0.06 손 길이 위부터 — 예전(−0.055)엔 손목 끝 전체에 그늘 띠가 가로로 남음 */
  const Ls = []; if (lod >= 1) Tm.ln.forEach((L) => { if (lod < L.k && !(lod === 1 && L.k <= 1)) return; if (lod === 1 && L.k > 1) return; if (L.cls === 'm2-hk-palm' && facing !== 'palm') return; const P = L.p.map(tf); Ls.push(`<path${L.cls ? ` class="${L.cls}"` : ''} d="${mscTpr(P, lw * (lod === 1 ? 0.6 : 0.52) * L.w, 0, 0.45)}" fill="${ln}"/>`); });
  if (lod >= 3) { const nOk = Tm.nlOn === 'any' || (Tm.nlOn === 'back' && facing !== 'palm'); if (nOk) Tm.nails.forEach((n) => { const c = tf(n.c), e = tf([n.c[0] + n.u[0] * 0.05, n.c[1] + n.u[1] * 0.05]); const ang = (Math.atan2(e[1] - c[1], e[0] - c[0]) * 180) / Math.PI; const rr = n.r * hl * sxB; Ls.push(`<ellipse cx="${mscF(c[0])}" cy="${mscF(c[1])}" rx="${mscF(rr * 1.25)}" ry="${mscF(rr * 0.85)}" transform="rotate(${mscF(ang)} ${mscF(c[0])} ${mscF(c[1])})" fill="${mscL1(sk0)}" stroke="${skS}" stroke-width="${mscF(lw * 0.4)}"/>`); });
    if (!kid && facing !== 'palm' && Tm.kn) Tm.kn.forEach((q) => { const a = tf([q[0] - 0.024, q[1] - 0.004]), b = tf([q[0], q[1] + 0.014]), c = tf([q[0] + 0.024, q[1] - 0.004]); Ls.push(`<path d="M${msc2Q(a)}Q${msc2Q(b)} ${msc2Q(c)}" fill="none" stroke="${skS}" stroke-width="${mscF(lw * (m || old ? 0.55 : 0.4))}" stroke-linecap="round"/>`); }); } /* 손등 너클(여자도 · 가늘게) */
  const shade = lod >= 2 ? `<clipPath id="${id}"><use href="#${id}d"/></clipPath><clipPath id="${id}ws"><path d="M${cpS.join('L')}Z"/></clipPath><g clip-path="url(#${id}ws)"><g clip-path="url(#${id})"><use href="#${id}d" fill="${skS}" fill-opacity=".8"/><use href="#${id}d" fill="${sk0}" transform="translate(${mscF(-hl * 0.05)} ${mscF(-hl * 0.035)})"/></g></g>` : ''; /* 셀 그늘: 빛(왼쪽 위) 쪽으로 민 실루엣을 뺀 오른쪽 아래 초승달 · 손목 쪽은 잘라 띠처럼 보이지 않게 */
  const body = `<defs><path id="${id}d" d="${d}"/></defs><clipPath id="${id}w"><path d="M${cp.join('L')}Z"/></clipPath><use href="#${id}d" clip-path="url(#${id}w)" fill="none" stroke="${ln}" stroke-width="${mscF(lw * 2 + close)}" stroke-linejoin="round"/><path d="${d}" fill="${sk0}"${close ? ` stroke="${sk0}" stroke-width="${mscF(close)}" stroke-linejoin="round"` : ''}/>`; /* (15차f) 같은 실루엣은 defs 한 벌 + 칠 한 벌만(선·그늘·자름은 use) — 그림 크기 */
  return { body, shade, lines: Ls.join(''), d }; }
/* (15차j ①) 짧은 해시(FNV-1a 32비트 → 36진수) — 같은 그림 안에서는 같은 모양 = 같은 id(defs 한 벌 + use 그대로) */
function msc2HHash(t) { let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
if (typeof MSC2_HTB !== 'undefined' && !MSC2_HTB.clap) MSC2_HTB.clap = MSC2_HTB.open; /* (r17 arms) 박수 손 그림 = 펼친 손 틀 */
function msc2HandSvg(sk, S, M, C, hk, pxH, part, p) { hk = hk || 'relaxed'; const hs = msc2HandSk(sk, S, hk); if (hs.hide) return ''; const { o, W } = sk; const s0 = S === 'L' ? -1 : 1; const lod = msc2HandLod(o, pxH);
  const m = o.sex === 'm' && !o.kid, kid = !!o.kid, old = !!o.old; const gk = kid ? 'k' : old ? 'o' : m ? 'm' : 'f'; const facing = hs.n[2] > 0.2 ? 'palm' : hs.n[2] < -0.2 ? 'back' : 'side';
  let Tm = msc2HTm(MSC2_HTB[hk] ? hk : MSC2_HP_OLD[hk] && MSC2_HTB[MSC2_HP_OLD[hk]] ? MSC2_HP_OLD[hk] : 'relaxed', gk); if (lod === 0 && !/fist|point|peace|thumbs|chin|push|scratch/.test(hk) && !Tm.th) Tm = msc2HTm('mitt', gk); /* (r16i ④) 장갑 단계는 둥근 장갑 손 */ if (Tm.v) Tm = msc2HTm(Tm.v[facing], gk); /* 주먹은 보는 쪽(손바닥·손등·옆)마다 다른 틀 */
  const sk0 = C.skin, ln = mscLn(sk0), skS = mscSkS(sk0); const X = msc2HXf(sk, S, M, hs, Tm); const hl = o.hand * M.u * (old ? 1.05 : 1) * (kid || o.mit || !/^(relaxed|clasp|grip|hip$|hipfist|bookhold|cup$|cupB|cupP|fist|open|wave)/.test(hk) ? 1 : 1.12); /* 얼굴 가까이 가는 손(볼·안경·턱·하품·긁기·브이)은 몸짓 자리가 손 크기에 맞춰져 있어 그대로(tR15f 손 가림) */ /* 노인 손은 조금 커 보임 · 마디가 보임(바이블 §2.3) · (r16i ④ 2묶음 · 감사 STYLE_GAP 9 '어른 손이 얼굴의 0.6 남짓 — 참고 0.75~0.8') 어른·청소년 손 그림 ×1.12 */
  const sxB = 1.2 * (m ? 1.06 : kid ? 1.08 : 0.94) * (Tm.wk || 1); const ww = (W.wr * 2 * M.u) / (0.26 * hl * sxB); /* 손목 폭(틀 0.25) → 아래팔 끝 폭 */
  const lw = MSC2_LW * (m ? 0.8 : 0.72) * (lod <= 1 ? 1.12 : 1); const id = `m2h-${p || 'x'}-${S}`; /* (15차j ①) 앞부분 = 그림 하나(캐릭터 하나)의 이름 · 뒤에 모양 해시를 붙임(msc2HDraw) */
  const R = msc2HDraw(Tm, X, { hl, sxB, ww, kid, lod, sk0, ln, skS, lw, facing, m, old, id });
  let thumb = null, r0x = null; if (Tm.th) { const ow = sk.J['wr' + (S === 'L' ? 'R' : 'L')]; let ax = [M.X(ow[0]) - X.o[0], 0]; ax = [Math.sign(ax[0]) || -s0, 0.32]; const r0 = [X.o[0] - ax[0] * hl * 0.03, X.o[1] + hl * 0.1]; const al = Math.hypot(ax[0], ax[1]); ax = [ax[0] / al, ax[1] / al]; const px = [-ax[1], ax[0]]; const TH = msc2HPts('-0.03,-0.066 0.03,-0.058 0.09,-0.048 0.15,-0.043 0.2,-0.038 0.232,-0.026 0.248,-0.003 0.242,0.021 0.217,0.035 0.16,0.04 0.09,0.046 0.03,0.054 -0.03,0.062'); /* (r16i ④) 책 잡은 엄지: 예전 쐐기(뿌리가 굵고 둘레를 다 그어 떠 있는 덩어리) → 뿌리는 책 옆 가장자리에서 열린 채 시작(책 뒤 손에서 감아 나옴) · 끝은 둥근 엄지 · 선은 뿌리 쪽을 열어 둠 · 손톱 */ const ky = Math.max(1.15, (MSC2_LW * (m ? 0.8 : 0.72) * 2.4) / (0.05 * hl * sxB)), kx = Math.max(1, Math.min(1.5, ky * 0.75)); /* (r16i ④) 작은 손(꼬마·동물·외계인)은 엄지 굵기가 선 굵기보다 얇아져 '><' 같은 선만 남던 것 → 엄지 반폭 ≥ 선 2.4배 */ r0x = (x, y) => [r0[0] + (ax[0] * x * kx + px[0] * y * ky) * hl * sxB, r0[1] + (ax[1] * x * kx + px[1] * y * ky) * hl * sxB]; thumb = TH.map((q) => r0x(q[0], q[1])); } /* 책 잡기 엄지: 책 옆 가장자리에서 앞 표지 위로 */
  const paw = thumb && kid; const thd = paw ? (() => { /* (r16i ④) 꼬마·동물·외계인·로봇(작은 손): 엄지 한 가닥은 선만 남아 책 위에 '><' 눈썹처럼 떠 보임 → 책 앞을 덮은 둥근 손(손가락 두 줄) — SD 설정표 '책 든 손' */ const P0 = msc2HPts('-0.02,-0.07 0.08,-0.085 0.17,-0.078 0.23,-0.045 0.25,0.005 0.235,0.05 0.17,0.075 0.08,0.08 -0.02,0.07'); const pp = P0.map((q) => r0x(q[0] - 0.09, q[1] * 0.85)); /* 손목(책 옆 가장자리 소매 끝)에 붙게 0.09 손목 쪽으로 */ const td = msc2HClosed(pp); const ln2 = [[0.08, -0.06, 0.11, -0.015], [0.08, 0.0, 0.11, 0.04]].map(([a1, b1, a2, b2]) => `<path d="M${msc2Q(r0x(a1, b1 * 0.85))}L${msc2Q(r0x(a2, b2 * 0.85))}" stroke="${ln}" stroke-width="${mscF(lw * 0.55)}" stroke-linecap="round"/>`).join(''); return `<path d="${td}" fill="${sk0}" stroke="${ln}" stroke-width="${mscF(lw * 1.1)}" stroke-linejoin="round"/>${lod >= 1 ? ln2 : ''}`; })() : thumb ? (() => { const td = msc2HClosed(thumb); const op = msc2HOpen(thumb.slice(1, -1)); const tq = (x, y) => [r0x(x, y)[0], r0x(x, y)[1]]; const nc = tq(0.205, -0.008), nd = tq(0.25, -0.012); const na = (Math.atan2(nd[1] - nc[1], nd[0] - nc[0]) * 180) / Math.PI; const rr = Math.hypot(tq(0, 0.026)[0] - tq(0, 0)[0], tq(0, 0.026)[1] - tq(0, 0)[1]); /* 손톱도 엄지 굵기에 맞춤 */ const ip = [tq(0.13, -0.044), tq(0.142, -0.012)];
    return `<path d="${td}" fill="${sk0}"/><path d="${op}" fill="none" stroke="${ln}" stroke-width="${mscF(lw * 1.1)}" stroke-linejoin="round" stroke-linecap="round"/><path d="M${msc2Q(ip[0])}L${msc2Q(ip[1])}" stroke="${ln}" stroke-width="${mscF(lw * 0.5)}" stroke-linecap="round"/>${lod >= 2 ? `<ellipse cx="${mscF(nc[0])}" cy="${mscF(nc[1])}" rx="${mscF(rr * 1.2)}" ry="${mscF(rr * 0.8)}" transform="rotate(${mscF(na)} ${mscF(nc[0])} ${mscF(nc[1])})" fill="${mscL1(sk0)}" stroke="${skS}" stroke-width="${mscF(lw * 0.4)}"/>` : ''}`; })() : '';
  if (part === 'thumb') return thumb ? `<g class="m2-hand m2-hand${S} m2-thumb" data-hp="${hk}" data-lod="${lod}">${thd}</g>` : '';
  const cls = `m2-hand m2-hand${S}`; const meta = `data-hp="${hk}" data-lod="${lod}" data-ref="${Tm.ref}${X.mir ? '-m' : ''}" data-face="${facing}" data-ht="${Tm.hk}:${gk}"`;
  return `<g class="${cls}" ${meta}>${R.body}${R.shade}${R.lines}${part ? '' : thd}</g>`; }

