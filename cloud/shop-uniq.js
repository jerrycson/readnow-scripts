/* 📚 우리숍 서가 — 책등 고유 모양 지킴이 (shelf7 · 정범님 11/12)
 *  정범님: '겉으로 뚜렷이 보이는 전체 모습이 고유한 형태가 1억 개 넘게 · 디자인·색·무늬·크기/모양만의 조합으로 · 새로 정해도 지금 정한 것과 겹치지 않게'
 *  · 고유 셈 = 디자인 묶음 × 색 짝(바탕 + 곁색) × 무늬 묶음 × 모양 묶음(몸 × 머리) — 글꼴·장식색(금박 종류)·글 방향·미세 색 흔들림은 덤(셈에서 뺌)
 *  · 비슷해 보이는 것은 한 묶음(사진으로 보고 정함) · 색은 서로 CIEDE2000 ΔE 15 넘게 다른 50색(PAL)만 '다른 색'으로 셈
 *  · 표는 shop/shelf-core.js UQ와 같음(덧붙이기만 · src/tests/tSHELF7_1112.js가 같은지 봄) — 클라우드는 cloud/*.js만 실어 가서 따로 둠
 *  · 하는 일: 모양 글(세대.출처.디자인.색.무늬.글꼴.모양.장식.방향[.곁색]) → 고유 번호(sig) · 이미 쓴 번호면 같은 디자인·바탕색은 두고 곁색·무늬·모양만 바꿔 빈 번호로(전단사 섞기로 빠짐없이 훑음)
 *  · 브라우저·node 함께(UMD) · 외부 라이브러리 없음 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BQU = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const T = {
    PAL: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 20, 28, 44, 45, 50, 68, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98],
    GONLY: [3, 7, 10, 15, 21, 24, 25, 26, 29, 35, 36, 45, 47, 48, 49],
    NOSEC: [1, 9, 16, 27, 32, 33, 37, 39, 44],
    DG: [[1, 32, 33, 39], [9, 44], [16], [27], [37], [7, 21, 49], [5, 31], [6, 30], [14, 41, 42], [15, 47], [19, 25], [22, 50], [3, 45], [28, 46], [34, 53],
      [2], [4], [8], [10], [11], [12], [13], [17], [18], [20], [23], [24], [26], [29], [35], [36], [38], [40], [43], [48], [51], [52], [54], [55], [56], [57]],
    PG: [[1, 2, 3, 15, 28, 38, 40, 42, 47, 50], [4, 5, 29, 46], [6, 20, 21, 30, 41, 48], [7, 22, 37], [8, 9, 39, 45, 49], [10, 31, 43], [11, 35, 36], [12, 13, 14, 26, 27, 32, 33], [17, 18, 19, 23, 34, 44], [16, 24, 25],
      [51, 67], [52], [53, 71], [54], [55], [56, 63], [57], [58, 61], [59], [60], [62, 69], [64], [65], [66], [68], [70], [72]],
    BG: [[1, 2, 6, 7], [3], [4], [5, 9], [8], [10], [11], [12], [13], [14], [15], [16], [17], [18], [19], [20], [21], [22], [23]],
    HG: [[1], [2, 3, 4], [5]],
    NOB: [10],
    HEADS: 5,
    /* COLORS 번호-1 → PAL 칸(가장 가까운 색 · CIEDE2000) — 옛 70색 책등도 이 칸으로 셈(겉모습은 그대로) */
    CI2B: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 20, 10, 10, 11, 12, 13, 14, 15, 24, 16, 41, 1, 1, 0, 35, 47, 15, 17, 47, 31, 3, 3, 47, 33, 4, 4, 27, 6, 5, 34, 8, 5, 18, 18, 19, 7, 9, 9, 37, 20, 11, 11, 39, 11, 30, 12, 11, 29, 40, 45, 14, 15, 2, 15, 40, 17, 39, 21, 33, 16,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    /* COLORS 번호-1 → 바탕이 밝은가(밝기 > 0.35 · 옛 책등의 '먹' 장식색이 검정인지 미색인지) */
    LIGHT: '00010010101000010001000000011011010000001000000001000010000100000100110100001010000000100011010100',
    /* 옛 책등(곁색 없음)에서 장식색만 쓰는 디자인의 장식 → PAL 칸: 금박 · 은박 · 먹(밝은 바탕 검정 / 어두운 바탕 미색) · 곁색(= 바탕을 짙게·옅게 → AUTO) */
    ACC: { gold: 3, silver: 16, inkDark: 24, inkLight: 16 }
  };
  const NP = T.PAL.length, AUTO = NP; /* 곁색 칸: 0~49 = PAL · 50 = '바탕을 짙게·옅게'(옛 책등만) */
  const dOf = new Map(); T.DG.forEach((g, i) => g.forEach((d) => dOf.set(d, i)));
  const dSec = T.DG.map((g) => g.some((d) => !T.NOSEC.includes(d)));
  const pOf = new Map(); T.PG.forEach((g, i) => g.forEach((p) => pOf.set(p, i)));
  const bOf = new Map(); T.BG.forEach((g, i) => g.forEach((b) => bOf.set(b, i)));
  const hOf = new Map(); T.HG.forEach((g, i) => g.forEach((h) => hOf.set(h, i)));
  const BA = T.BG.map((g, i) => i).filter((i) => !T.BG[i].some((b) => T.NOB.includes(b))); /* 새로 줄 수 있는 몸 묶음 */
  const ND = T.DG.length, NPG = T.PG.length, NBG = T.BG.length, NHG = T.HG.length, NBA = BA.length;
  const CODE_RE = /^(\d{1,4})\.([scrt])\.(\d{1,2})\.(\d{1,3})\.(\d{1,2})\.(\d{1,2})\.(\d{1,3})\.(\d)\.([vh])(?:\.(\d{1,3}))?$/;
  const parse = (code) => { const m = CODE_RE.exec(String(code || '')); if (!m) return null; const A = { g: +m[1], src: m[2], d: +m[3], ci: +m[4], p: +m[5], fi: +m[6], s: +m[7], a: +m[8], o: m[9] }; if (m[10]) A.k = +m[10]; return A; };
  const encode = (A) => [A.g, A.src, A.d, A.ci, A.p, A.fi, A.s, A.a, A.o].concat(A.k ? [A.k] : []).join('.');
  /* 모양 글 → 네 칸 { dg 디자인 묶음, b 바탕 칸, kc 곁색 칸(곁색이 안 보이는 디자인은 0), pc 무늬 묶음, bc 몸 묶음, hc 머리 묶음 } · 모르는 번호면 null */
  function tupleOf(A) { if (!A) return null; const dg = dOf.get(A.d); const b = T.CI2B[A.ci - 1]; const pc = pOf.get(A.p); const body = Math.floor((A.s - 1) / T.HEADS) + 1, head = ((A.s - 1) % T.HEADS) + 1; const bc = bOf.get(body), hc = hOf.get(head);
    if (dg == null || b == null || pc == null || bc == null || hc == null) return null; let kc = 0;
    if (dSec[dg] && !T.NOSEC.includes(A.d)) { if (A.k) { kc = T.CI2B[A.k - 1]; if (kc == null) return null; } else if (T.GONLY.includes(A.d)) { kc = A.a === 1 ? T.ACC.gold : A.a === 2 ? T.ACC.silver : A.a === 3 ? (T.LIGHT[A.ci - 1] === '1' ? T.ACC.inkDark : T.ACC.inkLight) : AUTO; } else kc = AUTO; }
    else if (dSec[dg]) kc = AUTO; /* 섞인 묶음 안의 곁색 없는 디자인(지금은 없음) */
    return { dg, b, kc, pc, bc, hc }; }
  const sigOfT = (t) => ((((t.dg * NP + t.b) * (NP + 1) + t.kc) * NPG + t.pc) * NBG + t.bc) * NHG + t.hc;
  const sigOf = (code) => { const t = tupleOf(typeof code === 'string' ? parse(code) : code); return t ? sigOfT(t) : null; };
  /* ── 새로 줄 수 있는 칸(전체 공간) — 디자인 묶음마다 크기가 다름(곁색이 보이면 바탕 50 × 곁색 49 · 아니면 바탕 50) */
  const REST = NPG * NBA * NHG; const gSize = dSec.map((s) => (s ? NP * (NP - 1) : NP) * REST); const gOff = []; let N = 0; for (const z of gSize) { gOff.push(N); N += z; }
  function space() { return { N, D: ND, Dsec: dSec.filter(Boolean).length, C: NP, pairs: NP * (NP - 1), P: NPG, B: NBA, H: NHG, S: NBA * NHG, rest: REST }; }
  /* 번호 i(0 ~ N-1) ↔ 네 칸 — 섞인 진법(디자인 묶음 → 바탕 → 곁색 → 무늬 → 몸 → 머리) */
  function tupleAt(i) { i = ((i % N) + N) % N; let dg = 0; while (dg + 1 < ND && gOff[dg + 1] <= i) dg++; let r = i - gOff[dg]; const hc = r % NHG; r = (r - hc) / NHG; const bi = r % NBA; r = (r - bi) / NBA; const pc = r % NPG; r = (r - pc) / NPG;
    let b, kc; if (dSec[dg]) { const kk = r % (NP - 1); b = (r - kk) / (NP - 1); kc = kk < b ? kk : kk + 1; } else { b = r; kc = 0; } return { dg, b, kc, pc, bc: BA[bi], hc }; }
  function indexOf(t) { const bi = BA.indexOf(t.bc); if (bi < 0 || t.kc === AUTO) return -1; let r = dSec[t.dg] ? t.b * (NP - 1) + (t.kc < t.b ? t.kc : t.kc - 1) : t.b; if (dSec[t.dg] && t.kc === t.b) return -1; return gOff[t.dg] + ((r * NPG + t.pc) * NBA + bi) * NHG + t.hc; }
  /* 전단사 섞기 — i → (a·i + c) mod M (a는 M과 서로소 → 0~M-1을 한 번씩 모두 지남) */
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const coprime = (M, want) => { let a = Math.max(1, Math.floor(want) % M || 1); while (gcd(a, M) !== 1) a++; return a; };
  const hash = (s) => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const mulmod = (a, b, m) => Number((BigInt(a) * BigInt(b)) % BigInt(m));
  const AG = coprime(N, N * 0.6180339887); const perm = (i) => (mulmod(AG, ((i % N) + N) % N, N) + 1234567) % N; /* 책 순번 → 조합 번호(겹침 없음) */
  const comboAt = (i) => tupleAt(perm(i));
  /* 네 칸 → 모양 글(바뀌지 않는 칸은 원래 것 그대로 · 묶음이 같으면 원래 번호를 둠) */
  function codeFor(A, t) { const B = { ...A }; if (dSec[t.dg]) B.k = T.PAL[t.kc]; if (pOf.get(A.p) !== t.pc) B.p = T.PG[t.pc][0];
    const body0 = Math.floor((A.s - 1) / T.HEADS) + 1, head0 = ((A.s - 1) % T.HEADS) + 1; const body = bOf.get(body0) === t.bc ? body0 : T.BG[t.bc][0]; const head = hOf.get(head0) === t.hc ? head0 : T.HG[t.hc][0]; B.s = (body - 1) * T.HEADS + head;
    if (dOf.get(A.d) !== t.dg) B.d = T.DG[t.dg].find((d) => !T.NOSEC.includes(d)) || T.DG[t.dg][0]; if (T.CI2B[A.ci - 1] !== t.b) B.ci = T.PAL[t.b]; return encode(B); }
  /* 겹친 책등 고치기 — 디자인 묶음·바탕은 늘 그대로 · 바꾸는 칸을 적게부터: 곁색만 → 무늬만 → 머리만 → 곁색+무늬 → 몸+머리 → 곁색·무늬·몸·머리 모두(이 단계는 빈칸을 빠짐없이 훑음)
   *  · 각 단계는 전단사 섞기(i → a·i + j0 mod M, a와 M 서로소)로 책마다 다른 차례 · 그 안이 다 차면(사실상 없음) 전체 공간 */
  function repair(A, taken, seed) { const t0 = tupleOf(A); if (!t0) return null; const h = hash(seed || encode(A)); const sec = dSec[t0.dg];
    const KC = sec ? Array.from({ length: NP }, (_, i) => i).filter((k) => k !== t0.b) : [t0.kc]; const PC = Array.from({ length: NPG }, (_, i) => i); const BC = BA.slice(); const HC = Array.from({ length: NHG }, (_, i) => i);
    const one = (x) => [x]; const kc0 = sec && t0.kc !== AUTO && t0.kc !== t0.b ? [t0.kc] : KC; const bc0 = BA.includes(t0.bc) ? [t0.bc] : BC;
    const tiers = [[KC, one(t0.pc), bc0, one(t0.hc)], [kc0, PC, bc0, one(t0.hc)], [kc0, one(t0.pc), bc0, HC], [KC, PC, bc0, one(t0.hc)], [kc0, one(t0.pc), BC, HC], [KC, PC, BC, HC]];
    for (const [K, P, Bb, H] of tiers) { const M = K.length * P.length * Bb.length * H.length; if (!M) continue; const a = coprime(M, M * 0.381966 + (h % 997)); const j0 = h % M;
      for (let n = 0; n < M; n++) { let r = (j0 + mulmod(a, n, M)) % M; const hi = r % H.length; r = (r - hi) / H.length; const bi = r % Bb.length; r = (r - bi) / Bb.length; const pi = r % P.length; r = (r - pi) / P.length;
        const t = { dg: t0.dg, b: t0.b, kc: K[r], pc: P[pi], bc: Bb[bi], hc: H[hi] }; const sg = sigOfT(t); if (!taken.has(sg)) return { code: codeFor(A, t), sig: sg }; } }
    for (let n = 0; n < N; n++) { const t = tupleAt((perm(n) + h) % N); const sg = sigOfT(t); if (!taken.has(sg)) return { code: codeFor(A, t), sig: sg }; } return null; }
  /* 쓰인 번호 장부 — claim(상품, 모양 글) → { code, fixed } · rebuild([[상품, 모양 글]] 먼저 정한 차례) → 겹친 것 고친 목록 */
  function makeIndex() { const bySig = new Map(), byId = new Map(); const st = { n: 0, dup: 0, fixedPost: 0, bad: 0, at: null };
    const put = (id, sg) => { bySig.set(sg, id); byId.set(id, sg); };
    function claim(id, code) { id = String(id); const A = parse(code); const sg = A ? sigOf(A) : null; if (sg == null) { st.bad++; return { code, fixed: false, sig: null }; }
      const was = byId.get(id); if (was != null && bySig.get(was) === id) bySig.delete(was); const own = bySig.get(sg); if (own == null || own === id) { put(id, sg); st.n = byId.size; return { code, fixed: false, sig: sg }; }
      const r = repair(A, RES ? { has: (x) => bySig.has(x) || RES.has(x) } : bySig, id); if (!r) return { code, fixed: false, sig: sg }; put(id, r.sig); st.fixedPost++; st.n = byId.size; return { code: r.code, fixed: true, sig: r.sig }; }
    let RES = null; /* 다시 세울 때: 아직 장부에 안 넣은 뒤 책들의 원래 번호도 비워 둠(고친 책이 뒤 책 자리를 빼앗아 또 고치는 일 없게) */
    function rebuild(entries) { bySig.clear(); byId.clear(); RES = new Set(); for (const [, code] of entries) { const sg = sigOf(code); if (sg != null) RES.add(sg); } const fix = [];
      try { for (const [id, code] of entries) { const r = claim(id, code); if (r.fixed) fix.push([String(id), r.code]); } } finally { RES = null; } st.dup = fix.length; st.fixedPost = 0; st.at = new Date().toISOString(); return fix; }
    return { claim, rebuild, has: (sg) => bySig.has(sg), size: () => byId.size, taken: bySig, state: () => ({ ...st, n: byId.size }) }; }
  return { T, AUTO, CODE_RE, parse, encode, tupleOf, sigOf, sigOfT, space, tupleAt, indexOf, perm, comboAt, codeFor, repair, makeIndex, hash, VER: '0.1.0' };
});
