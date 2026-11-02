/* ══════════ 🐾 책방 친구 v2 (15차 · 정범님 10/28 21:42 '근본 구조부터 다시') ══════════
 *  바이블(mascot_bible.md) 숫자를 그대로 데이터로 · 뼈대 → 덩어리 → 한 실루엣 → 얼굴 → 옷 → 세부 차례(법칙 1)
 *  새 맨 바깥 이름은 모두 msc2 / MSC2_ 접두(웹앱·boot 파일 이름과 겹치지 않게)
 *  좌표: 몸 계산은 H(대머리 머리 높이) 단위 · y = 정수리 0에서 아래로 · x = 몸 가운데에서 오른쪽(화면) + · z = 보는 사람 쪽 +
 *  그림: viewBox 0..100 × 0..200 · 발바닥 y = 196 · 1H = MSC2_U 칸(어른 머리 크기는 모두 같음 — 바이블 §2.1) */
const MSC2_U = 25, MSC2_SOLE = 196;
/* ── (15m · 정범님 10/29 13:58 '수치는 전부 설정으로') 수치 설정 칸 — 기본값은 여기 한 곳에만 둠 · 이 기기에만 저장(rn-msc-t-<이름>) · 바꾸면 바로 적용 ── */
const MSC2_TUNE = [
  { k: 'eyeKid', n: '꼬마 눈 크기', lo: 0.6, hi: 1.1, st: 0.02, d: 0.82, u: '배', tip: '꼬마 눈 가로·세로 배율 · 1 = 예전 크기 · 0.82 = 눈 크기 18% 줄임(눈 면적 약 33% 줄어듦 — 불쾌감 대응 1차 시험값)' },
  { k: 'lashKid', n: '꼬마 속눈썹 굵기', lo: 0.3, hi: 1.0, st: 0.05, d: 0.7, u: '배', tip: '꼬마 눈 위 속눈썹 띠 굵기 배율 · 1 = 예전 굵기' },
  { k: 'outK', n: '외곽선 굵기 배율(바깥 ÷ 안쪽)', lo: 1.0, hi: 2.5, st: 0.05, d: 1.2, u: '배', tip: '바깥 실루엣 선 = 안쪽 선 × 이 값 · 기본 1.2(r16j ⑤ · 감사 STYLE_GAP 5위 "바깥선 굵고 안쪽과 차이 큼" · 바이블 01 §1.2 TV 1.0 쪽으로) · 예전 1.4 = 설문 근거 1.25~1.5(research/anime_style 항목 11) · 2 = 바이블 값(시험: 성인 실루엣이 무거워 보임) · 예전 2' },
  { k: 'stepRate', n: '걸음 속도', lo: 80, hi: 110, st: 1, d: 95, u: '걸음/분', tip: '사람 정상 범위 80~110걸음/분(anatomy 항목 9) · 기본 95 = 한 걸음 약 15f(24fps) · 예전 120(12f)' },
  { k: 'footLift', n: '걸을 때 발끝 들기', lo: 0.05, hi: 0.5, st: 0.01, d: 0.25, u: 'H', tip: '걸음 최고 발끝 높이(머리 1H = 키÷7.5 ≈ 22.5cm) · 0.25H ≈ 5.6cm · 근거: 걸음 중 발끝 간격 실측 1.3~4.2cm(anatomy 항목 11) · 과장 약 1.3~1.5배 · 예전 0.5H' },
  { k: 'oldBend', n: '노인 등 굽음(꼬부라진 등 높이)', lo: 0, hi: 0.3, st: 0.01, d: 0.11, u: 'H', tip: '노인 여자 등 솟음 높이 · 남자 노인은 ×1.18 · 기본 0.11H = 예전 값 유지 (근거: 흉추 후만은 34년 추적에서 변하지 않음 — 크게 굽히면 근거와 어긋남)' },
];
const msc2TD = (k) => { const d = MSC2_TUNE.find((q) => q.k === k); return d ? d.d : 0; };
const msc2T = (k) => { try { const v = localStorage.getItem('rn-msc-t-' + k); if (v != null && v !== '' && isFinite(+v)) { const d = MSC2_TUNE.find((q) => q.k === k); return d ? Math.max(d.lo, Math.min(d.hi, +v)) : +v; } } catch (e) {} return msc2TD(k); };
/* ── 바이블 §2.2 표(10 객체) — 꼬마·청소년 팔 길이는 '매단 팔: 팔꿈치 = 허리(여·꼬마)/갈비 아래(남) · 손목 = 샅' 규칙에 맞춰 고침(15차 결정 · 바이블에 적음) ── */
const MSC2_OBJ = (() => { const K = ['kf', 'km', 'tf', 'tm', 'af', 'am', 'mf', 'mm', 'of', 'om'];
  const T = { hc: [4.0, 4.0, 6.5, 6.8, 7.0, 7.5, 7.0, 7.4, 6.4, 6.7], hw: [.90, .90, .78, .79, .76, .78, .78, .80, .77, .79], sn: [1.12, 1.12, 1.27, 1.28, 1.30, 1.30, 1.30, 1.28, 1.18, 1.18], sh: [1.15, 1.15, 1.30, 1.30, 1.35, 1.30, 1.35, 1.30, 1.25, 1.22], bust: [1.55, 1.55, 1.80, 1.85, 1.85, 2.00, 1.95, 2.05, 1.95, 2.00], rib: [1.75, 1.75, 2.30, 2.45, 2.40, 2.65, 2.40, 2.65, 2.30, 2.50], wa: [1.85, 1.85, 2.45, 2.62, 2.60, 2.85, 2.65, 2.90, 2.55, 2.75], nav: [1.95, 1.95, 2.65, 2.72, 2.80, 2.95, 2.85, 3.00, 2.75, 2.90], il: [2.00, 2.00, 2.75, 2.90, 2.95, 3.15, 2.95, 3.15, 2.85, 3.05], tro: [2.10, 2.10, 3.10, 3.20, 3.30, 3.50, 3.30, 3.48, 3.15, 3.35], cr: [2.25, 2.25, 3.25, 3.40, 3.50, 3.75, 3.50, 3.70, 3.30, 3.50], kn: [3.05, 3.05, 4.62, 4.85, 4.95, 5.35, 4.95, 5.30, 4.60, 4.85], an: [3.85, 3.85, 6.22, 6.52, 6.70, 7.18, 6.70, 7.10, 6.12, 6.42], so: [4.0, 4.0, 6.5, 6.8, 7.0, 7.5, 7.0, 7.4, 6.4, 6.7],
    nkW: [.28, .29, .32, .40, .34, .48, .36, .52, .34, .48] /* (P1) 여자 목 폭 = 바이블 v2 02 §2.2 표(청소년 .32 · 20대 .34 · 중년 .36 · 노인 .34 — 02 §2.3-2 정면 목 폭 0.40~0.60HW) */, shW: [1.05, 1.08, 1.36, 1.58, 1.50, 1.85, 1.50, 1.85, 1.38, 1.70], chW: [.92, .94, 1.02, 1.20, 1.16, 1.55, 1.16, 1.52, 1.08, 1.38] /* (16f · 05 §5.1·§5.4 · a91d443a·7f56ba2b 설정표와 나란히 · 4묶음: 여자는 아니메 설정표 쪽으로 어깨 1.50 · 가슴 1.16 · 허리를 골반의 0.62배로 = 모래시계가 옷 위에서도 읽힘) 20대 여 · 겨드랑이 가슴 폭을 넓혀 허리가 읽힘(허리/가슴 0.95 → 0.85) · 20대 남 = 가슴 V(어깨:허리 1.54 유지 · 가슴:허리 1.21 → 1.29) · 중년은 조금만 */, waW: [.95, .96, .92, 1.05, .94, 1.20, 1.18, 1.38, 1.16, 1.32] /* (16f 4묶음) 20대 여 허리 1.04 → 0.94H(골반의 0.62 · 아니메 설정표 a91d443a) */, hpW: [.92, .92, 1.30, 1.15, 1.52, 1.30, 1.58, 1.36, 1.50, 1.30], thW: [.40, .40, .60, .55, .70, .62, .72, .64, .66, .58], knW: [.27, .27, .30, .34, .33, .38, .34, .39, .34, .38], caW: [.29, .29, .34, .38, .37, .42, .38, .42, .34, .38], anW: [.18, .18, .18, .21, .19, .24, .20, .24, .20, .23],
    ua: [.61, .61, 1.05, 1.06, 1.12, 1.30, 1.16, 1.30, 1.08, 1.25], fa: [.42, .42, .88, .99, .97, 1.07, .93, 1.07, .94, 1.04], hand: [.45, .46, .62, .70, .68, .75, .68, .76, .68, .76], foot: [.62, .64, .88, 1.00, .90, 1.05, .92, 1.06, .92, 1.04],
    /* 얼굴(바이블 §3.9 · 머리 높이 0~1) */ eyY: [.62, .62, .57, .55, .54, .52, .53, .51, .53, .51], eyH: [.20, .20, .16, .13, .14, .11, .12, .095, .10, .085], eyW: [.25, .25, .24, .22, .23, .21, .22, .21, .21, .20], eyG: [1.25, 1.25, 1.05, 1.0, 1.0, 1.0, 1.0, 1.05, 1.0, 1.05], noY: [.74, .74, .71, .70, .70, .70, .70, .69, .72, .71], moY: [.84, .84, .82, .81, .81, .80, .81, .80, .82, .81], chinW: [.35, .35, .20, .26, .18, .30, .22, .33, .22, .32] };
  const O = {}; K.forEach((k, i) => { const o = { k, sex: k[1] === 'f' ? 'f' : 'm', kid: k[0] === 'k', old: k[0] === 'o' }; Object.keys(T).forEach((f) => (o[f] = T[f][i])); O[k] = o; }); ['kf', 'km'].forEach((k) => { O[k].sn = 1 + msc2NeckN(O[k].hc, 0.27); }); /* (P1 · 02 §2.6) 꼬마 4등신 목 = n(4) = 0.15H(예전 표 0.12 — SD 4등신과 같은 식) */ return O; })();
/* 관절 범위(바이블 §1.4 · 도) */
const MSC2_ROM = { neckF: [-50, 50], neckT: [-40, 40], neckR: [-80, 80], twist: [-70, 70], shAbd: [-10, 180], shFlex: [-55, 180], elb: [-5, 145], wrF: [-70, 80], wrR: [-20, 30], hipF: [-25, 120], hipAbd: [-30, 45], knee: [-5, 150], ankF: [-20, 50], toe: [-40, 70] };
const msc2Cl = (v, r) => Math.max(r[0], Math.min(r[1], v));
const msc2R = (d) => (d * Math.PI) / 180;
const msc2L = (a, b, t) => a + (b - a) * t;
const msc2SS = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
/* 단조 3차 보간(Fritsch–Carlson) — 바이블 §5.3 규칙 6: 극단(0·1)을 먼저 맞추고 사이는 '튀지 않게' 단조로 · 곡률이 뒤집히지 않음 */
function msc2Mono(x, X, Y) { const n = X.length; if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1]; const d = [], m = []; for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2; for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  let i = 0; while (x > X[i + 1]) i++; const h = X[i + 1] - X[i], t = (x - X[i]) / h, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h * m[i + 1]; }
/* ── 몸 모양 값(바이블 §2.4) — 꾸미기 체형 값(cu.body)을 그대로 읽음(예전 패드·밀대가 새 몸에서도 움직임) ──
 *  bust 0..1 · hip 0..1(기본 0.4) · waist −1(잘록)..+1 · fat 0..1 · muscle 0..1 · sh/th/cf/arm −1..1 */
const MSC2_BUILD = { slim: [0.05, 0.15], average: [0.3, 0.3], toned: [0.22, 0.5], athletic: [0.18, 0.68], muscular: [0.22, 0.92], stocky: [0.6, 0.55], chubby: [0.85, 0.2] }; /* [fat, muscle] */
function msc2Shape(o, bd) { bd = { ...(bd || {}) }; const SK = MSC2_SHAPEK[bd.shape]; if (SK) Object.entries(SK).forEach(([k, v]) => (bd[k] = (+bd[k] || 0) + v)); /* 실루엣 미리 정한 값 = 밀대에 더함 */ const cl = (v, a, b) => Math.max(a, Math.min(b, +v || 0)); const bu = MSC2_BUILD[bd.build] || MSC2_BUILD.average; const f = o.sex === 'f' && !o.kid;
  const hv = cl((+bd.hip || 0) + 0.7 * (+bd.hipW || 0), -1, 1); const S = { bust: f ? (bd.bust != null ? cl(bd.bust, 0, 1) : o.old ? 0.25 : 0.35) : 0, hip: f ? (hv >= 0 ? 0.4 + 0.6 * hv : 0.4 + 0.4 * hv) : 0.4 + 0.25 * cl(+bd.hipW || 0, -1, 1), waist: f ? cl(bd.waist, -1, 1) : 0, fat: o.kid ? Math.min(0.5, bu[0]) : bu[0], muscle: o.kid ? 0.1 : bu[1], sh: cl(bd.sh, -1, 1), th: cl(bd.th, -1, 1), cf: cl(bd.cf, -1, 1), arm: cl(bd.arm, -1, 1), belly: cl(bd.belly, 0, 1) };
  if (o.k[0] === 't' && f) S.bust = Math.min(S.bust, 0.5); /* 청소년 가슴 상한 0.5(바이블 §2.3) */ if (o.kid) { S.bust = 0; S.hip = 0.4; S.waist = 0; } return S; }
/* ── 길이 꾸미기(예전 밀대 그대로): 등신 hr(6.5~8) · 다리 leg · 몸통 tor · 목 nk(−1..1) · 실루엣 shape — 머리 크기는 그대로, 턱 아래만 늘고 줄음(바이블 §2.1) ── */
const MSC2_SHAPEK = { rect: { waist: 0.45 }, tri: { hip: 0.35, sh: -0.5 }, itri: { sh: 0.7, hip: -0.4, waist: -0.1 }, hour: { waist: -0.6, hip: 0.25, bust: 0.1 }, oval: { waist: 0.7, belly: 0.6 }, fem: { sh: -0.4, waist: -0.5, hip: 0.4, bust: 0.15 } };
function msc2ObjMod(o, bd) { bd = bd || {}; /* r15e hook */ if ((o.sd || o.kid) && typeof msc2SdMod === 'function') { const r = msc2SdMod(o, bd); if (r) return r; } const cl = (v) => Math.max(-1, Math.min(1, +v || 0)); const hr = +bd.hr ? Math.max(o.kid ? 3.5 : 6.5, Math.min(o.kid ? 6 : 8, +bd.hr)) : 0; /* (15m) 꼬마 2~4등신은 msc2SdMod가 먼저 받음 */ const leg = cl(bd.leg), tor = cl(bd.tor), nk = cl(bd.nk); if (!hr && !leg && !tor && !nk) return o; const O = { ...o };
  const Y = ['sn', 'sh', 'bust', 'rib', 'wa', 'nav', 'il', 'tro', 'cr', 'kn', 'an', 'so']; const dn = 0.07 * nk; Y.forEach((k) => (O[k] = o[k] + dn)); /* 목: 턱 아래 전부 옮김 */
  const tk = 1 + 0.07 * tor; ['bust', 'rib', 'wa', 'nav', 'il', 'tro', 'cr'].forEach((k) => (O[k] = O.sn + (O[k] - O.sn) * tk)); const dT = O.cr - (o.cr + dn); ['kn', 'an', 'so'].forEach((k) => (O[k] += dT)); /* 몸통: 목 패임~샅 */
  const lk = 1 + 0.09 * leg; ['kn', 'an', 'so'].forEach((k) => (O[k] = O.cr + (O[k] - O.cr) * lk)); /* 다리: 샅 아래 */
  if (hr) { const k = (hr - 1) / (O.so - 1); Y.forEach((q) => (O[q] = 1 + (O[q] - 1) * k)); O.ua *= k; O.fa *= k; } else { const k2 = (O.so - 1) / (o.so - 1); O.ua = o.ua * (1 + (k2 - 1) * 0.8); O.fa = o.fa * (1 + (k2 - 1) * 0.8); } /* 팔은 몸통·다리 비율을 따라감(손목 = 샅 유지) */
  { const sn1 = 1 + Math.max(0, msc2NeckN(O.so, msc2NeckBase(o.k)) + dn); if (Math.abs(sn1 - O.sn) > 1e-4 && O.cr - O.sn > 0.2) { const kk = (O.cr - sn1) / (O.cr - O.sn); ['sh', 'bust', 'rib', 'wa', 'nav', 'il', 'tro'].forEach((q) => (O[q] = sn1 + (O[q] - O.sn) * kk)); O.sn = sn1; } } /* (P1 · 02 §2.6) 목 길이 = n(등신) 한 식(+ 목 밀대) — 샅 아래는 그대로 · 몸통만 맞춰 줄임/늘임 */
  O.hc = O.so; return O; }
/* ── 단면 폭(반 폭 · H) — 극단 값을 먼저 정하고(바이블 §5.3 표) 단조 보간 ── */
function msc2Widths(o, S) { const f = o.sex === 'f' && !o.kid, fat = S.fat, fk = (k) => (1 + k * fat) / (1 + k * 0.3); const W = {};
  const hipK = o.hpW / 1.52; /* 20대 여자 표(0 / 0.4 / 1)를 각 객체 엉덩이 폭에 맞춤 */
  const hpW = f ? msc2Mono(S.hip, [0, 0.4, 1], [1.45, 1.52, 1.82]) * hipK : o.hpW * (1 + 0.12 * (S.hip - 0.4)); W.hp = (hpW / 2) * fk(0.18);
  const wr = f ? (o.k[0] === 't' ? msc2Mono(S.hip, [0, 0.4, 1], [0.78, 0.684, 0.58]) : msc2Mono(S.hip, [0, 0.4, 1], [0.72, 0.62, 0.54])) /* (16f 4묶음) 어른 여자만 모래시계를 진하게 · 청소년은 예전 값 */ : o.waW / o.hpW; let wa = (hpW * wr) / 2 * (1 + 0.16 * S.waist) * fk(0.4) * (o.sex === 'm' ? 1 - 0.05 * (S.muscle - 0.3) : 1); if (f && fat < 0.8) wa = Math.min(wa, W.hp * 0.95); W.wa = wa; /* 아래에서 갈비 아래 폭(가슴 폭 0.955)보다 넓지 않게 — 바이블 표의 엉덩이 극단(0.78·0.58배)을 그대로 쓰면 허리가 갈비보다 넓어 바깥으로 불룩(허리선이 사라짐) · 정리: 허리 ≤ 갈비 아래 − 0.015H */ /* 여자는 허리가 엉덩이를 넘지 않음(fat > 0.8 빼고) */
  W.ch0 = (o.chW / 2) * fk(0.06) * (o.sex === 'm' ? 1 + 0.08 * (S.muscle - 0.3) : 1); if (o.sex === 'f' && !o.kid && fat < 0.7) W.wa = Math.min(W.wa, W.ch0 * 0.955 - 0.015);
  W.sh = (o.shW / 2) * (1 + 0.07 * S.sh) * fk(0.1) * (o.sex === 'm' ? 1 + 0.12 * (S.muscle - 0.3) : 1); W.ch = (o.chW / 2) * fk(0.06) * (o.sex === 'm' ? 1 + 0.08 * (S.muscle - 0.3) : 1); W.nk = (o.nkW / 2) * (o.sex === 'm' ? 1 + 0.4 * Math.max(0, S.muscle - 0.3) : 1) * fk(0.05);
  W.thT = f ? Math.max(W.hp - 0.02 - 0.0, (msc2Mono(S.hip, [0, 0.4, 1], [0.62, 0.70, 0.82]) * hipK) / 1) * fk(0.45) * (1 + 0.22 * S.th) : (o.thW / 1) * fk(0.35) * (1 + 0.22 * S.th) * (1 + 0.1 * (S.muscle - 0.3)); /* 허벅지 위 폭(한쪽) = (엉덩이 − 0.04H)/2 — 골반이 넓어지면 허벅지 위도 함께(정범님 지적 · 바이블 §5.3 규칙 2) */
  W.kn = (o.knW / 2) * fk(0.12) * (1 + 0.05 * S.th); W.ca = (o.caW / 2) * fk(0.2) * (1 + 0.3 * S.cf); W.an = o.anW / 2;
  const ua = o.kid ? 0.22 : f ? 0.265 : 0.33; W.ua = (ua / 2) * fk(0.5) * (1 + 0.28 * S.arm) * (o.sex === 'm' ? 1 + 0.25 * (S.muscle - 0.3) : 1); W.fa = W.ua * (f ? 0.88 : 0.9); W.wr = W.ua * 0.5;
  W.hipE = f ? Math.max(0, Math.min(1, (S.hip - 0.4) / 0.6)) : 0; /* (15차g) 엉덩이 극단 정도(기본 0.4 → 1) — 넓적다리·무릎을 함께 채움 */ if (W.hipE) { const e = W.hipE * W.hipE * (3 - 2 * W.hipE); W.kn *= 1 + 0.12 * e; W.ca *= 1 + 0.07 * e; } W.bust = S.bust; W.belly = S.belly + Math.max(0, fat - 0.5) * 0.6; /* r15e hook */ if (o.sd && typeof msc2SdW === 'function') msc2SdW(o, S, W); if (!o.ani && typeof msc2NkClamp === 'function') W.nk = msc2NkClamp(o, W.nk); /* (P1 · 02 §2.3-2) 사람 목 위 폭 = 나이·성별 범위(× HW) 안으로 */ return W; }
/* ── 3D 벡터 ── */
const msc2V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
/* 점 p를 z축(화면 평면) 둘레로 c 중심 θ 돌림 */
const msc2Rz = (p, c, th) => { const s = Math.sin(th), k = Math.cos(th), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k, p[2] || 0]; };
/* 두 마디 3D IK — 길이 고정(법칙 4) · pole = 굽는 쪽(무릎 = 앞 · 팔꿈치 = 뒤·바깥) */
const MSC2_IKMINC = Math.cos((30 * Math.PI) / 180);
function msc2IK3(A, T, l1, l2, pole, rom) { const V = msc2V; let d = V.sub(T, A); let L = V.len(d); const Lc = Math.max(rom ? Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * MSC2_IKMINC) : 0, Math.abs(l1 - l2) + 1e-4, Math.min(l1 + l2 - 1e-4, L)); /* (r17 arms R1) 팔꿈치·무릎 굽힘 ≤150°(바이블 02 §2.4) — 닿지 않는 목표를 받으면 끝까지 접혀 아래팔이 위팔에 포개졌음 */ const dir = V.norm(d); const E = V.add(A, V.mul(dir, Lc)); const ca = (l1 * l1 + Lc * Lc - l2 * l2) / (2 * l1 * Lc); const a = Math.acos(Math.max(-1, Math.min(1, ca)));
  let pp = V.sub(pole, V.mul(dir, V.dot(pole, dir))); if (V.len(pp) < 1e-6) pp = [0, 0, 1]; pp = V.norm(pp); const M = V.add(A, V.add(V.mul(dir, Math.cos(a) * l1), V.mul(pp, Math.sin(a) * l1))); return { M, E, reach: L <= l1 + l2 }; }
/* ── 자세 값(바이블 §9.2 콘트라포스토 · §9.3 고유 자세) — w = 디딘 다리(+1 오른쪽 · −1 왼쪽 · 0 두 발) ── */
const MSC2_CP = { /* (15차b) 정면에서 '보이게' — d9b2964f·dcaa6a34를 재어 맞춤: 골반선 8~12° · 어깨선 반대 4~7° · 쉬는 무릎 12~28° · 쉬는 발 바깥·앞 · 뒤꿈치는 필요한 만큼만 들림(hl = 최대)
   ht 골반 기울기° · st 어깨 반대 기울기° · sh 디딘 엉덩이 옆 이동(H) · hd 고개° · kf 쉬는 무릎° · fo 쉬는 발 바깥 돌림° · fx 쉬는 발 바깥(H) · fz 쉬는 발 앞(H) · hl 뒤꿈치 최대 들림(H) */
  light: { ht: 6, st: 3.5, sh: 0.13, hd: 4, kf: 14, fo: 20, fx: 0.2, fz: 0.08, hl: 0.04 }, std: { ht: 10, st: 6, sh: 0.22, hd: 7, kf: 22, fo: 26, fx: 0.4, fz: 0.16, hl: 0.09 }, strong: { ht: 13, st: 8, sh: 0.28, hd: 10, kf: 30, fo: 32, fx: 0.5, fz: 0.26, hl: 0.14 }, rel: { ht: 11, st: 7, sh: 0.24, hd: 8, kf: 28, fo: 34, fx: 0.52, fz: 0.2, hl: 0.08 } }; /* (16f) rel = 편히 서기(dcaa6a34 · d9b2964f '무게 중심이 거의 한쪽 다리에만 · 쉬는 다리는 바깥으로 · 발끝 바깥') — 쉬는 발을 옆으로(0.52H) 내놓고 골반을 더 기울여(어깨 반대 7° — 몸짓 손이 입을 가리지 않는 만큼) 정면에서 〈가 읽힘 */ /* (15차g · 정범님 '전봇대처럼 서 있음' · dcaa6a34 '〈 모양' · d9b2964f) 엉덩이 옆 이동 sh·쉬는 발 벌림 fx를 약 1.7배 — 정면에서 '〈'가 읽히게(무게 다리는 머리 아래 그대로 · 다림줄 0) */
const MSC2_CPK = ['ht', 'st', 'sh', 'hd', 'kf', 'fo', 'fx', 'fz', 'hl'];
const MSC2_SC = { ac: 0.65, pl: 1, sh: 0.6 }; /* sh = 골반을 디딘 쪽으로 내미는 몫(자세 표 sh × 0.6 · 표준 0.13H ≈ dcaa6a34 0.14H) */
/* (15차h) 캐릭터 몸가짐(바이블 §9.3 성격표 · §2.3 나이) — hd 고유 고개 기울기°(디딘 쪽 +) · shY 어깨 올림(H · − = 으쓱/긴장 · + = 툭 떨굼) · shK 어깨 말림(관절 폭 배) · lean 몸통 앞(+)/뒤(−)° · pit 고개 숙임°(쉬는 동안 · 노인 앞으로 나온 머리)
 *  꼬마 여 = 갸웃 크게 · 꼬마 남 = 가슴 펴고(뒤로) · 청소년 여 = 갸웃 · 청소년 남 = 구부정(어깨 말리고 앞으로 · 고개 반대) · 20대 여 = 부드러운 갸웃 · 20대 남 = 곧게 · 중년 = 살짝 · 노인 = 머리 앞·아래 */
const MSC2_CARRY = { kf: { hd: 5, shY: -0.01, lean: 2, pit: -2 }, km: { hd: -1, shY: 0.01, lean: -2.5, pit: -3 }, tf: { hd: 4, shY: -0.005, lean: 0.5, pit: 0 }, tm: { hd: -3, shY: 0.025, shK: 0.97, lean: 2.5, pit: 3 }, af: { hd: 3, shY: 0.005, lean: 0, pit: 1 }, am: { hd: 1, shY: 0, lean: -1, pit: 0 }, mf: { hd: 2.5, shY: 0.01, shK: 0.99, lean: 0.5, pit: 2 }, mm: { hd: 0.5, shY: 0.005, lean: -1.2, pit: 1 }, of: { hd: 2, shY: 0.045, shK: 0.95, lean: 0, pit: 6 }, om: { hd: -1, shY: 0.05, shK: 0.95, lean: 0, pit: 7 } /* (16f 3묶음 · 코디네이터 '노인 정면에서도 굽어 보이게') 어깨가 앞으로 말림 = 정면에서 어깨 관절이 안으로·아래로(shK 0.98→0.95 · shY 0.02→0.045) */ };
const MSC2_CARRY_ID = { n_mori: { hd: -4, shY: 0.03, shK: 0.965, lean: 3, pit: 4 }, n_daon: { hd: 6 }, n_dodam: { hd: -2, lean: -3 }, n_harin: { hd: -2, lean: -1.5 }, n_jiho: { hd: 4, shY: -0.008 }, n_seoyun: { hd: 3.5 } };
function msc2Carry(id, k, cu) { const a = MSC2_CARRY[k] || {}, b = MSC2_CARRY_ID[id] || {}; return msc2CarryPf({ ...a, ...b, pid: id, pcu: (cu && cu.persona) || null, ck: k }); } /* (r18 회차 4) 반항·오그림 몸가짐(msc2CarryPf) */ /* (r18 회차 3) pid·pcu = 서는 자세 성격 층(msc2PostureProfile)이 캐릭터를 알게 */ /* (15차h) S자: ac = 가슴 상자 축이 어깨선 기울기 중 맡는 몫 · pl = 골반을 다림줄 자리로 옮기는 몫(1 = 전부 · 가슴 전단 0) */
/* 팔 자세: 'hang'(편히 · ab 벌림° · fl 앞으로° · el 팔꿈치° · ki 굽는 면이 안쪽으로) 또는 손목 목표 'ik' [x, y, z](H · 가슴 틀) · 'hipR/L'(엉덩뼈 능선) · 'pocketR/L'(바지 앞주머니) · hand = 손 모양
 *  (15차b) 자세는 모두 '무게 다리 + 골반·어깨 반대 기울기'를 가짐(바로 서기 at 하나만 대칭 — 시험·차렷용) · 편한 팔은 늘 10~22° 굽음(바이블 §9.1-4) */
const MSC2_HANG = (ab, el, fl) => ({ k: 'hang', ab, fl: fl == null ? 4 : fl, el });
const MSC2_POSES = {
  at: { w: 0, cp: 'light', arms: { L: MSC2_HANG(7, 12), R: MSC2_HANG(6, 14, 6) }, hand: { L: 'relaxed', R: 'relaxed' } }, /* 차렷(대칭 · 시험 기준) */
  st: { w: 0, cp: 'light', arms: { L: MSC2_HANG(7, 12), R: MSC2_HANG(6, 14, 6) }, hand: { L: 'relaxed', R: 'relaxed' } }, /* 예전 이름(대칭) — 움직임에서는 rl로 바꿔 씀 */
  rl: { n: '편히 서기(가벼운 무게 옮김)', w: 1, cp: 'rel', hd: -4, arms: { L: MSC2_HANG(16, 20, 6), R: MSC2_HANG(14, 24, 12) }, hand: { L: 'relaxed', R: 'relaxed' } }, /* (16f · 감사 S-08 '어른 전반 차렷한 전봇대 자세') (16f 2묶음 · 코디네이터 '전과 후가 거의 같음' · 고개 기울기는 예전 가벼운 자세 4°로 — 몸짓 손이 입·눈을 가리지 않게 tR15f) 편히 서기 = 강한 콘트라포스토(dcaa6a34 〈 자세: 골반 11° · 어깨 반대 7° · 쉬는 무릎 28° · 쉬는 발 바깥 0.52H) · 무게 쪽 팔은 몸에서 떨어지고(벌림 15°) 쉬는 쪽 팔꿈치 24° 굽혀(05 §5.7 · tR15b 10~25°) 손이 허벅지 앞에서 떨어짐(05 §5.7 쉬는 팔 · 4ef6658d·a91d443a) — 7.5~8등신에서 가벼운 자세(6°)는 전봇대로 보였음 */
  cpL: { n: '무게 옮김(왼다리)', w: -1, cp: 'std', arms: { L: MSC2_HANG(10, 12, 3), R: MSC2_HANG(7, 22, 10) }, hand: { L: 'relaxed', R: 'relaxed' } },
  cpR: { n: '무게 옮김(오른다리)', w: 1, cp: 'std', arms: { L: MSC2_HANG(7, 22, 10), R: MSC2_HANG(10, 12, 3) }, hand: { L: 'relaxed', R: 'relaxed' } },
  /* 한 무릎 굽힘: 쉬는 무릎을 앞·안으로 크게 · 뒤꿈치 들림(56d2335e · c2cf76f5) */
  kn: { n: '한 무릎 굽혀 서기', w: 1, cp: 'strong', heel: 0.07, hd: 2, arms: { L: MSC2_HANG(8, 20, 8), R: MSC2_HANG(12, 12, 2) }, hand: { L: 'relaxed', R: 'relaxed' } },
  /* 20대 여자 고유: 책을 두 손으로 가슴 앞에 · 콘트라포스토 · 고개 6°(바이블 §9.3) */
  book: { n: '책을 가슴에 안기', w: 1, cp: 'std', hd: 4, arms: { L: { k: 'ik', t: [-0.36, 2.02, 0.5], pole: [-0.35, 1, -0.45] }, R: { k: 'ik', t: [0.34, 2.08, 0.52], pole: [0.35, 1, -0.45] } }, hand: { L: 'bookhold', R: 'bookhold' }, prop: 'book' },
  /* 한 손 허리: 손목 뒤로 꺾어 손등·손가락이 엉덩뼈 능선 위 · 팔꿈치는 뒤·바깥으로(2c528dc8 · 33c54801) · 무게는 그 손 쪽 엉덩이 */
  hip: { n: '한 손 허리', w: 1, cp: 'std', hd: 3, arms: { L: MSC2_HANG(9, 18, 6), R: { k: 'ik', t: 'hipR', pole: [1, -0.15, -1.25] } }, hand: { L: 'relaxed', R: 'hip' } },
  hipL: { n: '한 손 허리(왼손)', w: -1, cp: 'std', hd: 3, arms: { L: { k: 'ik', t: 'hipL', pole: [-1, -0.15, -1.25] }, R: MSC2_HANG(9, 18, 6) }, hand: { L: 'hip', R: 'relaxed' } },
  hipB: { n: '두 손 허리(당당하게)', w: 0.5, cp: 'light', stance: 1.5, lean: -3, arms: { L: { k: 'ik', t: 'hipxL', pole: [-1, 0.1, -0.35] }, R: { k: 'ik', t: 'hipxR', pole: [1, 0.1, -0.35] } }, /* (15차h) 주먹이 배 앞으로 모이던 것 → 엉덩이 옆(손목이 엉덩이 윤곽 바깥 · 팔꿈치 옆으로) */ hand: { L: 'hipfist', R: 'hipfist' } },
  /* 20대 남자 고유: 가슴 아래 팔짱 · 한 다리에 무게 — 위 팔꿈치가 0.15~0.2H 높음 · 아래 팔은 배 위 · 두 아래팔 아래선이 S(a18ba06b · 바이블 §9.4) */
  xl: { n: '팔짱', w: 1, cp: 'std', arms: { L: { k: 'ik', t: 'xlTL', pole: [-1, 0.6, 0.25] }, R: { k: 'ik', t: 'xlBR', pole: [1, 1, 0.2] } }, hand: { L: 'grip', R: 'tuck' } }, /* (r17 arms) 팔꿈치가 몸통 옆선 안으로 들어가 위팔이 셔츠에 묻히고 위 손 주먹이 몸 밖 허공에 뜨던 것 → 두 팔꿈치는 옆선 바깥·앞(극 앞으로) · 위 팔꿈치가 높음 · 손목은 몸 기준점(MSC2_ARMT) */
  cf: { n: '앞으로 두 손 모음', w: 1, cp: 'light', hd: 3, arms: { L: { k: 'ik', t: 'cfWL', pole: [-0.25, 1, -0.3] }, R: { k: 'ik', t: 'cfWR', pole: [0.25, 1, -0.3] } }, hand: { L: 'clasp', R: 'clasp' } }, /* (r17 arms) 팔꿈치가 옆·뒤로 벌어져 아래팔이 X로 엇갈리고 손이 반대쪽 엉덩이 밖으로 뻗던 것 → 팔꿈치는 옆구리 아래 · 손목은 자기 쪽에 두고 손만 포갬 */
  bk: { n: '뒷짐', w: -1, cp: 'light', arms: { L: { k: 'ik', t: 'bkWL', pole: [-0.5, 0.45, -1] }, R: { k: 'ik', t: 'bkWR', pole: [0.5, 0.45, -1] } }, hand: { L: 'relaxed', R: 'relaxed' }, back: 1 }, /* (r17 arms) 극이 앞(+z)이라 팔꿈치가 옆·앞으로 튀고 아래팔이 옆으로 뻗은 '닭 날개' 토막이 보이던 것 → 팔꿈치는 옆선 바로 바깥·뒤 · 손목은 엉치 높이 등 가운데 */
  /* 주머니에 한 손: 손은 주머니 속(손목·엄지 쪽만) · 다른 팔은 편히 · 무게는 뒤 다리 · 살짝 구부정(청소년 남 · 47f124e0) */
  pk: { n: '주머니에 한 손', w: -1, cp: 'std', lean: -2, hd: 3, arms: { L: MSC2_HANG(9, 16, 4), R: { k: 'ik', t: 'pocketR', pole: [1, 0.2, -0.9] } }, hand: { L: 'relaxed', R: 'pocket' } },
  pk2: { n: '두 손 주머니', w: 1, cp: 'std', lean: -3, arms: { L: { k: 'ik', t: 'pocketL', pole: [-1, 0.2, -0.9] }, R: { k: 'ik', t: 'pocketR', pole: [1, 0.2, -0.9] } }, hand: { L: 'pocket', R: 'pocket' } },
  lean: { n: '골반 내밀어 기대듯', w: 1, cp: 'strong', hd: 3, arms: { L: MSC2_HANG(8, 22, 10), R: MSC2_HANG(14, 10, 2) }, hand: { L: 'relaxed', R: 'relaxed' } },
  /* 발목 꼬기: 쉬는 발이 디딘 발 앞을 건너감 · 손은 앞으로 모음 */
  xa: { n: '발목 꼬고 서기', w: 1, cp: 'light', cross: 1, hd: 4, arms: { L: { k: 'ik', t: 'cfWL', pole: [-0.25, 1, -0.3] }, R: { k: 'ik', t: 'cfWR', pole: [0.25, 1, -0.3] } }, hand: { L: 'clasp', R: 'clasp' } }, /* (r17 arms) 손목이 반대쪽으로 넘어가(L x +0.06) 아래팔 X · 손이 반대 허벅지 밖으로 → 앞 두 손 모음과 같은 포갬 */
  /* 청소년 여 고유: 얼굴 옆 브이 · 골반 10° · 다른 손은 허리(56d2335e) */
  pv: { n: '얼굴 옆 브이', w: 1, cp: 'strong', hd: 6, arms: { L: { k: 'ik', t: 'hipL', pole: [-1, -0.15, -1.2] }, R: { k: 'ik', t: [0.6, 1.08, 0.42], pole: [0.45, 1, 0.55] } }, hand: { L: 'hip', R: 'peace' } },
  /* 머리 긁적(쑥스러움 · ac9500a1) */
  hs: { n: '뒤통수 긁적', w: -1, cp: 'std', hd: -5, arms: { L: MSC2_HANG(9, 16, 4), R: { k: 'ik', t: [0.3, 0.3, -0.25], pole: [1, 0.2, -0.3] } }, hand: { L: 'relaxed', R: 'cup' } },
  /* 턱 괴고 생각: 한 손 턱 · 다른 팔이 그 팔꿈치를 받침 */
  th: { n: '턱에 손(생각)', w: 1, cp: 'light', hd: -4, arms: { L: { k: 'ik', t: [0.2, 2.42, 0.42], pole: [-0.6, 1, -0.4] }, R: { k: 'ik', t: [0.12, 1.34, 0.42], pole: [1, 1, -0.2] } }, hand: { L: 'grip', R: 'chin' } },
  /* 볼에 손(중년 여 둘째) */
  ck: { n: '볼에 손', w: -1, cp: 'light', hd: 6, arms: { L: MSC2_HANG(8, 16, 4), R: { k: 'ik', t: [0.58, 1.3, 0.62], pole: [0.15, 1, 0.7] } }, hand: { L: 'relaxed', R: 'cheek' } }, /* (r17 arms R6) 손목이 어깨 0.4H 앞이라 팔꿈치가 160° 넘게 접혀 아래팔이 얼굴 앞을 가로지르고 손바닥이 입을 덮던 것 → 손목은 턱 옆 앞 · 팔꿈치는 가슴 앞 아래(극 아래·앞) · 손바닥이 볼 옆(cheek 틀) */
  /* 꼬마 여 고유: 뒷짐 · 앞으로 8° · 한 뒤꿈치 들기 · 고개 12° */
  kbk: { n: '뒷짐 지고 몸 앞으로', w: 1, cp: 'std', heel: 0.06, lean: 8, hd: 9, arms: { L: { k: 'ik', t: 'bkWL', pole: [-0.5, 0.45, -1] }, R: { k: 'ik', t: 'bkWR', pole: [0.5, 0.45, -1] } }, hand: { L: 'relaxed', R: 'relaxed' }, back: 1 } }; /* (r17 arms) 뒷짐과 같은 기준점 · 극 뒤로 */
/* ══ (r18 회차 3 · 정범님 10/30 '전봇대처럼 서 있지 말라는 말에 모든 캐릭터를 비스듬하게 만들어 버렸어 — 나이·성격·직업에 따라') 서는 자세 성격 층 — 설계 r17/redesign/01_자세_성격.md(2판) §1.3~1.5
 *  MSC2_PERSONA = 24명 성격 값(01 §1.4 값표 · D2 확정): E 외향 · S 수줍음 · J 정적 직업 · C 자신감 · Rb 반항 성향(없으면 기본식) · K 노인 허리 굽음 유형(S = S자 · none = 곧음 · D1)
 *  rnd = 꼬마·동물(T·R 범위 Tr·Rr — 자세 바꿀 때마다 무작위는 회차 6) · fix = 로봇(대칭 정자세 · D3 — 회차 6) · 이 둘은 회차 6 전까지 예전(0.15.16) 자세 그대로
 *  T 비틂 정도 = 나이 곡선 Aage × (0.35+0.65E) × (1−0.6J) × (1−0.3S) + 0.25R → 골반 2+10T° · p 비튼 자세 계열을 고를 확률 = min(0.95, 0.15+0.75T+0.2R) */
const MSC2_PERSONA = { n_bogi: { E: 0.35, S: 0.5, J: 0.9, C: 0.3, Rb: 0 }, n_yuna: { E: 0.45, S: 0.35, J: 0.7, C: 0.45, Rb: 0.13 }, n_seoyun: { E: 0.6, S: 0.15, J: 0.4, C: 0.6, Rb: 0.43 }, n_harin: { E: 0.5, S: 0.1, J: 0.7, C: 0.75, Rb: 0.49 }, n_mori: { E: 0.85, S: 0.1, J: 0.3, C: 0.5, Rb: 0.66 }, n_geonu: { E: 0.8, S: 0.05, J: 0.1, C: 0.6, Rb: 0.71 }, n_jiho: { E: 0.55, S: 0.3, J: 0.4, C: 0.35, Rb: 0.32 }, n_taeo: { E: 0.4, S: 0, J: 0.6, C: 0.75, Rb: 0.3 },
  n_dodam: { E: 0.8, S: 0.1, J: 0.2, C: 0.5, Rb: 0.65 }, n_daon: { E: 0.9, S: 0.05, J: 0.2, C: 0.5, Rb: 0.75 }, n_danu: { E: 0.25, S: 0.8, J: 0.5, C: 0.2, Rb: 0 }, n_mikyung: { E: 0.9, S: 0, J: 0.3, C: 0.8 }, n_sungho: { E: 0.2, S: 0.3, J: 1, C: 0.6 }, n_oksun: { E: 0.5, S: 0.2, J: 0.9, C: 0.4, K: 'S' }, n_manbok: { E: 0.85, S: 0, J: 0.4, C: 0.7, K: 'none' },
  n_arong: { rnd: 1, E: 0.6, S: 0.3, J: 0.2, C: 0.5, Tr: [0, 1.2], Rr: [0, 0.6] }, n_tori: { rnd: 1, E: 0.9, S: 0.05, J: 0.1, C: 0.7, Tr: [0, 1.2], Rr: [0, 0.6] }, n_neogul: { rnd: 1, E: 0.5, S: 0.2, J: 0.5, C: 0.5, Tr: [0, 0.8], Rr: [0, 0.3] }, n_gomsil: { rnd: 1, E: 0.6, S: 0.2, J: 0.3, C: 0.6, Tr: [0, 0.9], Rr: [0, 0.2] }, n_tosil: { rnd: 1, E: 0.3, S: 0.8, J: 0.4, C: 0.3, Tr: [0, 0.6], Rr: [0, 0] },
  n_eoheung: { rnd: 1, E: 1, S: 0, J: 0.1, C: 0.8, Tr: [0.5, 1.2], Rr: [0.2, 0.6] }, n_neugi: { rnd: 1, E: 0.4, S: 0.1, J: 0.4, C: 0.7, Tr: [0.2, 0.8], Rr: [0.4, 0.7], cool: 1 }, n_bolt: { fix: 1, E: 0.5, S: 0.2, J: 0.6, C: 0.6 }, n_ppyorong: { rnd: 1, E: 0.6, S: 0.2, J: 0.3, C: 0.5, Tr: [0, 1], Rr: [0, 0.3] } };
const MSC2_PDEF = { E: 0.5, S: 0.3, J: 0.5, C: 0.5 }; /* 값표에 없는 새 캐릭터(+α) 기본값 — 꾸미기 '성격' 칸(회차 6)이 덮어씀 */
const msc2PCl = (v, a, b) => Math.max(a, Math.min(b, v));
const msc2Pw = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + ((vb - va) * (x - a)) / (b - a); } return pts[pts.length - 1][1]; }; /* 꺾은선 */
const MSC2_AAGE = [[15, 1], [70, 0.25]]; /* 비틂 나이 곡선(10~15세 1.0 → 70세 0.25 · 추정) */
const MSC2_AR = [[10, 0.4], [13, 0.8], [15, 1], [17, 1], [20, 0.7], [25, 0.3], [30, 0.1], [35, 0]]; /* 반항 나이 곡선(자극 추구 정점 15~19세 · 갈등 감정 세기 중기 청소년기) */
function msc2AgeOf(id, D) { const a = parseInt(String((D && D.age) || ((MSC_DES[id] || {}).age) || ''), 10); return isFinite(a) && a > 0 ? a : 6; } /* 동물·로봇·외계인 = 6세로 봄 */
/* 성격 값(꾸미기 덮어쓰기 cu.persona = {E,S,J,C,Rb,K} · 0~1) */
function msc2Persona(id, cu) { const b = MSC2_PERSONA[id] || MSC2_PDEF; const P = { ...b }; const o = cu && cu.persona; if (o && typeof o === 'object') ['E', 'S', 'J', 'C', 'Rb'].forEach((k) => { if (o[k] != null && isFinite(+o[k])) P[k] = msc2PCl(+o[k], 0, 1); }); if (o && /^(none|S|flex|knee)$/.test(o.K || '')) P.K = o.K;
  if (P.Rb == null) P.Rb = msc2PCl(0.2 + 0.7 * P.E - 0.5 * P.S - 0.3 * P.J, 0, 1); P.age = msc2AgeOf(id, MSC_DES[id]); return P; }
/* 서는 자세 방식(설정 · 이 기기): per = 성격대로(기본) · sq = 모두 정자세 · old = 모두 편히(예전 0.15.12 — 성격 층 끔) */
const MSC2_STAND = [['per', '성격대로', '나이·성격·직업에 따라 — 정적인 사람은 바른 자세가 잦고, 활발한 젊은 사람은 비튼 자세가 잦아요'], ['sq', '모두 정자세', '모든 캐릭터가 두 발에 고르게 바로 서요(골반 2°)'], ['old', '모두 편히(예전)', '0.15.12 그대로 — 모든 캐릭터가 늘 한쪽 다리에 무게를 싣고 비스듬히 서요']];
const msc2StandMode = () => { try { const v = localStorage.getItem('rn-msc-stand'); return MSC2_STAND.some(([k]) => k === v) ? v : 'per'; } catch (e) { return 'per'; } };
const MSC2_PFC = new Map();
const msc2ErOf = (P, K) => (K !== 'none' ? 0 : msc2PCl(P.E * msc2PCl((P.age - 28) / 22, 0, 1) + 0.3 * P.C * (1 - P.S), 0, 1)); /* (r18 회차 5) 가슴 펴기 Er = E × 나이(28→50세) + 0.3C(1−S) · 굽은 노인은 0 */
const msc2KOf = (P) => (P.age >= 65 ? (/^(none|S|flex|knee)$/.test(P.K || '') ? P.K : 'S') : 'none'); /* (r18 회차 5) 허리 굽음 유형은 65세↑만 · 값표에 없는 노인(+α)은 예전처럼 S자(꾸미기 성격 칸에서 바꿈 · 회차 6) */
/* 자세 프로필 — 캐릭터·성격·설정이 바뀔 때만 계산(열쇠로 기억) · T = null이면 예전 자세 그대로 */
function msc2PostureProfile(id, cu) { const mode = msc2StandMode(); const pc = cu && cu.persona ? JSON.stringify(cu.persona) : ''; const key = id + '|' + mode + '|' + pc; let r = MSC2_PFC.get(key); if (r) return r;
  const P = msc2Persona(id, cu); const a = P.age;
  if (mode === 'old') r = { mode, T: null, p: 1, R: 0 };
  else if (mode === 'sq') { const K = msc2KOf(P), Er = msc2ErOf(P, K); r = { mode, T: 0, p: 0, R: 0, K, age: a, Er, up: 6 * Er * (a < 28 ? 0.3 : 1) }; } /* (r18 회차 5) 모두 정자세: 비틂·반항은 끄고 노인 허리 굽음 유형·가슴 펴기(곧게 서는 쪽)는 그대로 */
  else if (P.rnd || P.fix) r = { mode, T: null, p: 1, R: 0, wait: P.rnd ? 'rnd' : 'fix' }; /* 꼬마·동물 무작위 · 로봇 대칭 = 회차 6 */
  else { const Ag = a < 10 ? 1 : msc2Pw(MSC2_AAGE, a); const Ar = a < 10 ? 0.3 : msc2Pw(MSC2_AR, a); const R = P.Rb * Ar; let T = Ag * (0.35 + 0.65 * P.E) * (1 - 0.6 * P.J) * (1 - 0.3 * P.S) + 0.25 * R; if (P.K && P.K !== 'none' && a >= 65) T *= 0.3; T = msc2PCl(T, 0, 1.2);
    const K = msc2KOf(P); const Er = msc2ErOf(P, K);
    r = { mode, T, p: Math.min(0.95, 0.15 + 0.75 * T + 0.2 * R), R, E: P.E, S: P.S, J: P.J, C: P.C, Rb: P.Rb, K, age: a, Er, up: 6 * Er * (a < 28 ? 0.3 : 1) }; }
  if (MSC2_PFC.size > 200) MSC2_PFC.clear(); MSC2_PFC.set(key, r); return r; }
/* 비틂 보간: 정자세 끝점 sq(골반 2° · 어깨 반대 1° · 쉬는 무릎 6° · 엉덩이 옆 0.04H) ↔ 자세의 비틂 값 — 몫 g = T × 10/9(편히 서기 rl에서 골반 = 2+10T°) · 1.07에서 멈춤 */
MSC2_CP.sq = { ht: 2, st: 1, sh: 0.04, hd: 1, kf: 6, fo: 12, fx: 0.06, fz: 0.02, hl: 0 };
function msc2CpLerp(c, T) { const q = MSC2_CP.sq, g = msc2PCl(T * (10 / 9), 0, 1.07), r = {}; MSC2_CPK.forEach((k) => { r[k] = (q[k] || 0) + ((c[k] || 0) - (q[k] || 0)) * g; }); return r; }
const MSC2_TWC = new WeakMap();
function msc2PoseTw(P, CY) { if (!P || typeof P.cp !== 'string' || !CY || !CY.pid) return P; const pf = msc2PostureProfile(CY.pid, CY.pcu ? { persona: CY.pcu } : null); if (pf.T == null) return P; const sq = P.cp === 'sq'; const R = sq ? 0 : pf.R || 0, S = pf.S || 0; if (sq && !(S > 0)) return P; let m = MSC2_TWC.get(P); if (!m) { m = new Map(); MSC2_TWC.set(P, m); } const kT = Math.round(pf.T * 1000) + '|' + Math.round(R * 1000) + '|' + Math.round(S * 1000); let r = m.get(kT); if (!r) { r = { ...P }; if (!sq) { const c = msc2CpLerp(MSC2_CP[P.cp] || MSC2_CP.light, pf.T); c.sh += 0.06 * R; r.cp = c; r.cpN = P.cp; } r.stance = (P.stance || 1) * (1 + 0.3 * R) * (P.k0 === 'slC' ? 1 : 1 - 0.5 * S * (S >= 0.3 ? 1 : 0)); r.toe = (P.toe || 0) + 8 * R - 10 * S; m.set(kT, r); } return r; } /* (r18 회차 4) 반항 R: 엉덩이 옆 +0.06R H(짝다리 깊게) · 발 벌림 ×(1+0.3R) · 발끝 바깥 +8R° / 수줍음 S: 두 발 사이 ×(1−0.5S)(S ≥ 0.3) · 발끝 안 −10S° — 바른 판(sq)은 수줍음만 */
/* 정자세 계열 자세(01 §1.5): sqA 바로 서기 · sqX 정자세 팔짱 · 고유 자세마다 '바른 판'(_q = 같은 팔·손 · 골반 sq · 뒤꿈치 안 듦) */
const MSC2_SQV = { st: 'sqA', rl: 'sqA', cpL: 'sqA', cpR: 'sqA', kn: 'sqA', lean: 'sqA', xa: 'sqA', xl: 'sqX' }; /* 무릎 굽혀 서기·기대기·발목 꼬기의 바른 판 = 바로 서기(고유 자세 몫이 두 계열에서 같게) */
MSC2_POSES.sqA = { n: '바로 서기(바른 자세)', w: 1, cp: 'sq', hd: -1, arms: { L: MSC2_HANG(8, 14, 4), R: MSC2_HANG(7, 16, 6) }, hand: { L: 'relaxed', R: 'relaxed' } };
MSC2_POSES.sqX = { ...MSC2_POSES.xl, n: '팔짱(바른 자세)', cp: 'sq' };
['book', 'hip', 'hipL', 'hipB', 'cf', 'bk', 'pk', 'pk2', 'pv', 'hs', 'th', 'ck', 'kbk'].forEach((k) => { const P = MSC2_POSES[k]; if (!P) return; const q = k + '_q'; MSC2_POSES[q] = { ...P, n: P.n + '(바른 자세)', cp: 'sq', heel: 0, lean: k === 'kbk' ? 4 : P.lean }; MSC2_SQV[k] = q; });
[['sqA', 'st'], ['sqX', 'xl']].concat(Object.entries(MSC2_SQV).filter(([, q]) => /_q$/.test(q)).map(([k, q]) => [q, k])).forEach(([q, k]) => { if (!MSC_STANCE[q]) MSC_STANCE[q] = { ...(MSC_STANCE[k] || {}), n: MSC2_POSES[q].n, w: MSC2_POSES[q].w || 0 }; }); /* 예전 자세 표에도(팔 열쇠 arm 그대로 — 가슴 옆 볼록 숨김 등) */
const msc2IsSq = (k) => k === 'sqA' || k === 'sqX' || k === 'slC' || /_q$/.test(k || ''); /* (r18 회차 4) 오그림 slC도 바른 계열(비틂 없음) */
/* ══ (r18 회차 4 · 정범님 10/30 2판 "'외향이면 젊을 때'는 꾸부정이 아니라 반항적인 자세야 … 청소년과 성격에 따라 적용해") 반항·수줍음 층 — 설계 r17/redesign/01_자세_성격.md §1.3(R 출력·수줍음 표지)·§1.5
 *  반항 계열 새 자세 4: rvP 짝다리 깊게 + 한 손 주머니 + 한 어깨 내림(건들) · rvH 머리 뒤 깍지 + 상체 뒤로(건들) · rvX 짝다리 팔짱 + 고개 옆(쿨) · rvL 등 기대듯 뒤로 + 발목 꼬기 + 두 손 주머니(공통)
 *  치마(주머니 없음)는 rvPs(한 손 허리 낮게) · rvLb(두 손 뒤로 짚고 기대기)로 바꿈 · 오그림 slC(수줍 · 상체 앞 · 발끝 안 · 두 손 앞 · 어깨 안으로·올림) */
MSC2_POSES.rvP = { n: '짝다리 주머니(반항)', w: 1, cp: 'strong', lean: -3, hd: 5, rvS: 1, arms: { L: MSC2_HANG(10, 14, 2), R: { k: 'ik', t: 'pocketR', pole: [1, 0.2, -0.9] } }, hand: { L: 'relaxed', R: 'pocket' } };
MSC2_POSES.rvPs = { n: '짝다리 한 손 허리(반항)', w: 1, cp: 'strong', lean: -3, hd: 5, rvS: 1, arms: { L: MSC2_HANG(10, 14, 2), R: { k: 'ik', t: 'hipR', pole: [1, -0.15, -1.25] } }, hand: { L: 'relaxed', R: 'hip' } };
MSC2_POSES.rvH = { n: '머리 뒤 깍지(반항)', w: 1, cp: 'std', lean: -4, hd: 4, rvS: 0.5, arms: { L: { k: 'ik', t: [-0.2, 0.42, -0.34], pole: [-1, -0.5, -0.15] }, R: { k: 'ik', t: [0.2, 0.42, -0.34], pole: [1, -0.5, -0.15] } }, hand: { L: 'cup', R: 'cup' } };
MSC2_POSES.rvX = { ...MSC2_POSES.xl, n: '짝다리 팔짱(반항)', cp: 'strong', lean: -2.5, hd: -6, rvS: 0.6 };
MSC2_POSES.rvL = { n: '기대듯 발목 꼬기(반항)', w: 1, cp: 'light', cross: 1, lean: -4.5, hd: 3, rvS: 0.4, arms: { L: { k: 'ik', t: 'pocketL', pole: [-1, 0.2, -0.9] }, R: { k: 'ik', t: 'pocketR', pole: [1, 0.2, -0.9] } }, hand: { L: 'pocket', R: 'pocket' } };
MSC2_POSES.rvLb = { n: '뒤로 짚고 발목 꼬기(반항)', w: 1, cp: 'light', cross: 1, lean: -4.5, hd: 3, rvS: 0.4, back: 1, arms: { L: { k: 'ik', t: 'bkWL', pole: [-0.5, 0.45, -1] }, R: { k: 'ik', t: 'bkWR', pole: [0.5, 0.45, -1] } }, hand: { L: 'relaxed', R: 'relaxed' } };
MSC2_POSES.slC = { n: '오그린 수줍 서기', k0: 'slC', w: 0.3, cp: 'sq', lean: 6, stance: 0.7, toe: -4, hd: -3, shY: -0.008, shK: 0.96, arms: { L: { k: 'ik', t: 'slWL', pole: [-0.12, 0.6, -1] }, R: { k: 'ik', t: 'slWR', pole: [0.12, 0.6, -1] } }, hand: { L: 'clasp', R: 'clasp' } }; /* (코디네이터 판독 · 회차 4) 손이 샅 가까이까지 내려가 팔이 늘어나 보이던 것 → 손 모음은 배꼽~아랫배(허리선 근처) · 팔꿈치는 굽혀 몸통 옆에 붙임 · 어깨 올림은 작게(성호 어깨 솟음) */
const MSC2_RV = { rvP: 'pk', rvPs: 'hip', rvH: 'hs', rvX: 'xl', rvL: 'pk2', rvLb: 'bk', slC: 'cf' }; /* 예전 자세 표(MSC_STANCE) 팔 열쇠를 빌려 올 자세 */
Object.entries(MSC2_RV).forEach(([q, k]) => { if (!MSC_STANCE[q]) MSC_STANCE[q] = { ...(MSC_STANCE[k] || {}), n: MSC2_POSES[q].n, w: MSC2_POSES[q].w || 0 }; });
const msc2IsRv = (k) => /^rv/.test(k || '');
/* 성격 층 몸가짐(캐릭터마다 한 번) — R 반항 세기 · E로 건들(E)/쿨(1−E) · S 수줍음 · Sl 오그림(0.4S + 0.15J)
 *  상체 뒤 −4R° · 턱 들기 4R°(pit −) · 고개 비스듬 4+6R°(R ≥ 0.3) · 오그림 몸통 앞 +6Sl° · 어깨 말림 ×(1−0.04Sl)(1−0.03S) · 머리 앞은 회차 5(노인 굽음과 같이) */
function msc2CarryPf(c) { const pf = msc2PostureProfile(c.pid, c.pcu ? { persona: c.pcu } : null); if (pf.T == null) return c; const R = pf.R || 0, S = pf.S || 0, Sl = 0.4 * S + 0.15 * (pf.J || 0);
  if ((c.ck === 'of' || c.ck === 'om') && pf.K === 'none') c = { ...MSC2_CARRY[c.ck === 'of' ? 'mf' : 'mm'], ...(MSC2_CARRY_ID[c.pid] || {}), pid: c.pid, pcu: c.pcu, ck: c.ck }; /* (r18 회차 5 · 정범님 '모든 노인이 허리가 휘는 건 아니야') 곧은 노인 = 노인 몸가짐(고개 숙임 6~7° · 어깨 솟음 · 말림) 대신 중년 값 위에 성격 */
  const r = { ...c, rvR: R, rvE: pf.E, shyS: S, Sl }; r.lean = (c.lean || 0) - 4 * R + 6 * Sl; r.pit = (c.pit || 0) * (1 - Math.min(1, 1.5 * R)) - 4 * R; r.lean0 = c.lean || 0; if (R >= 0.3 && r.lean0 > 0) r.lean -= r.lean0 * Math.min(1, 1.5 * R); /* 반항이 큰 청소년은 바탕 구부정(숙임·앞 기울기)을 걷어 냄 */ r.shK = (c.shK || 1) * (1 - 0.04 * Sl) * (1 - 0.03 * S);
  if (R >= 0.3) { const hd = c.hd || 0; const m = 4 + 6 * R; if (Math.abs(hd) < m) r.hd = (hd < 0 ? -1 : 1) * m; }
  const Er = pf.Er || 0, up = pf.up || 0; r.Er = Er; r.kypho = pf.K || 'none'; if (Er) { r.lean -= 2 * Er; r.shY = (c.shY || 0) - 0.008 * Er; r.shK = r.shK * (1 + 0.015 * Er); } /* (r18 회차 5 · 정범님 '외향적이면 나이가 들수록 정자세에 가슴을 펴고') 가슴 펴기 Er: 몸통 뒤 −2Er° · 가슴 들기(어깨 0.008Er H 올림 · 폭 +1.5%Er) */
  if (up) { r.pit -= up; r.eyD = up / 2; } /* 고개 들기 6Er°(28세 미만 ×0.3) · 눈은 그 절반만큼 아래(약간 내려다봄 · 위세) */
  if (Sl > 0.05) { r.hf = 0.08 * Sl; r.hdn = 0.03 * Sl; } /* (r18 회차 5) 오그림·어깨 말림 Sl: 머리 앞 0.08Sl H(조금 내려앉음 0.03Sl) — 몸통 앞 +6Sl°·어깨 말림은 회차 4 */
  return r; }
/* ══ (r18 회차 3.s1 · 정범님 10/30 '팔 모양을 따로 준비해 필요할 때 바꿔 끼우고 풀면 일반 모양으로') 부품 바꿈 슬롯 틀 — 05_부품바꿈_연구.md §1 공통 규칙·§2 차용안
 *  자리(슬롯) 하나에 그림 여러 벌 · 뼈·변형(msc2Solve 결과)은 슬롯에 붙어 있어 벌이 바뀌어도 '어디에'는 그대로, '무엇을'만 바뀜(Spine 슬롯·Harmony 그림 바꿈·Unity Sprite Resolver)
 *  고르는 차례: ① 자세·몸짓 조건(pose·act 정규식)이 맞는 벌 ② 아니면 몸 돌림(yaw) 구간 — 구간 경계에 ±hy° 히스테리시스(경계에서 깜박임 0) ③ 아니면 def
 *  한 슬롯은 한 번에 한 벌만 바뀜(Character Animator 스왑 세트) — 바뀌는 중(xf초) 새 요청은 대기열 1칸 · 그리는 쪽은 cur(바뀌는 중엔 prev와 t)만 그림 = 안 보이는 벌은 DOM에 넣지 않음
 *  이번 판은 틀만(벌 그림은 비어 있음 → 그림 그대로) · 첫 벌(팔짱 아래팔 굴곡형·뒷짐 손목)은 회차 4(4.s1), 3/4 손 각도 벌은 회차 14 */
const MSC2_SLOTS = {
  foreL: { def: 'tube', sets: [{ n: 'xlFold', pose: /^(xl|sqX|rvX)$/ }, { n: 'bkWrist', pose: /^(bk|kbk|rvLb)(_q)?$/ }] }, foreR: { def: 'tube', sets: [{ n: 'xlFold', pose: /^(xl|sqX|rvX)$/ }, { n: 'bkWrist', pose: /^(bk|kbk|rvLb)(_q)?$/ }] },
  handL: { def: 'front', yaw: [[20, 'q34'], [50, 'side']], hy: 5 }, handR: { def: 'front', yaw: [[20, 'q34'], [50, 'side']], hy: 5 },
  sleeveL: { def: 'none', sets: [{ n: 'press', pose: /^(xl|sqX|rvX)$/ }] }, sleeveR: { def: 'none', sets: [{ n: 'press', pose: /^(xl|sqX|rvX)$/ }] } };
const MSC2_SLOT_XF = 0.1; /* 짧은 교차(80~120ms · Live2D Pose) — 가림 순간 바꿈(t 0)은 회차 4에서 벌마다 */
/* 원하는 벌(히스테리시스 포함) — cur = 지금 벌 */
function msc2SlotWant(D, c, cur) { for (const s of D.sets || []) if ((s.pose && s.pose.test(c.pose || '')) || (s.act && s.act.test(c.act || ''))) return s.n;
  if (D.yaw && c.yaw != null) { const y = Math.abs(c.yaw), hy = D.hy || 0, E = D.yaw; let band = 0; while (band < E.length && y >= E[band][0]) band++; /* 0 = def 구간 · i = E[i−1] 구간 */
    const names = [D.def].concat(E.map((e) => e[1])); const ci = names.indexOf(cur); if (ci >= 0 && ci !== band) { const lo = ci > 0 ? E[ci - 1][0] - hy : -Infinity, hi = ci < E.length ? E[ci][0] + hy : Infinity; if (y >= lo && y < hi) return cur; } /* 지금 구간 ±hy 안이면 그대로 */
    return names[band]; }
  return D.def; }
/* 한 프레임: st = 슬롯 상태(캐릭터마다 · {}로 시작) · c = { pose, act, yaw, now(초) } → { n: 그릴 벌, prev, t: 교차 0~1(1 = 끝) } · st.sw = 바뀐 횟수 */
function msc2SwapPick(st, slot, c) { const D = MSC2_SLOTS[slot]; if (!D) return { n: null, t: 1 }; const now = c.now || 0; if (!st.n) { st.n = msc2SlotWant(D, c, null); st.t0 = -1e9; st.sw = 0; st.q = null; }
  const busy = now - st.t0 < MSC2_SLOT_XF; const want = msc2SlotWant(D, c, st.q || st.n);
  if (busy) { st.q = want !== st.n ? want : null; } else { const nx = st.q && st.q !== st.n ? st.q : want; st.q = null; if (nx !== st.n) { st.prev = st.n; st.n = nx; st.t0 = now; st.sw++; } }
  const t = Math.min(1, (now - st.t0) / MSC2_SLOT_XF); return { n: st.n, prev: t < 1 ? st.prev : null, t }; }
/* (r17 arms · 정범님 10/30 '팔을 꼬거나 뒷짐을 졌을 때 등 팔 연구를 더 반영') 몸 기준점 손목 목표 — s = 그 팔 쪽(−1 왼 · +1 오른) · 값 = 연구.md §2 · 머리 단위 고정값(예전 xl 2.3 · bk 3.05 · cf 3.2)은 7등신 어른에만 맞아 꼬마(4등신)는 손이 무릎·쇄골, SD는 몸 밖으로 갔음
   xlT = 팔짱 위 팔(손이 반대 위팔 바깥을 감쌈 · 팔꿈치가 0.15~0.2H 높음) · xlB = 팔짱 아래 팔(아래팔이 배 위 · 손은 반대 위팔 뒤에 끼움) · bkW = 뒷짐 손목(등 가운데 엉치 높이에서 두 손목이 맞닿음) · cfW = 앞으로 두 손 모음(샅 앞에서 포갬 · 손목 교차 X) */
const MSC2_ARMT = {
  xlT: (o, W, s) => ({ c: 'chest', p: [-s * W.ch * 0.3, o.bust + (o.rib - o.bust) * 0.25, W.ch * 0.42] }),
  xlB: (o, W, s) => ({ c: 'chest', p: [-s * W.ch * 0.42, o.bust + (o.rib - o.bust) * 0.55, W.ch * 0.32] }),
  bkW: (o, W, s) => ({ c: 'pel', p: [s * W.wa * 0.1, o.il + (o.tro - o.il) * 0.35, -(W.wa * 0.62 + 0.05)] }),
  slW: (o, W, s) => ({ c: 'pel', p: [s * W.wa * 0.2, o.wa + (o.il - o.wa) * 0.75, W.wa * 0.62 + 0.1] }), /* (r18 회차 4) 오그림 두 손 모음 = 배꼽~아랫배 앞(손목 맞닿음 직전) */
  cfW: (o, W, s) => ({ c: 'pel', p: [s * W.hp * 0.22, o.tro + (o.cr - o.tro) * 0.3 + (s < 0 ? -0.03 : 0.03), Math.max(0.22, W.hp * 0.42)] }) };
/* (r17 arms) 팔짱 속 손(tuck = 숨김)은 반대 위팔이 덮어 줄 때만 — 몸짓으로 반대 팔이 떠나면(손 흔들기·볼 긁기 등) 손 없는 아래팔 토막이 배 앞에 가로로 떠 있었음 → 반대 위팔에서 멀면 옆구리를 잡은 손(grip)으로 그림 */
function msc2HandFix(sk, H) { const J = sk.J, o = sk.o, V = msc2V; let out = H; ['L', 'R'].forEach((S) => { if (H[S] !== 'tuck') return; const O = S === 'L' ? 'R' : 'L'; const a = J['sh' + O], b = J['el' + O], w = J['wr' + S]; if (!a || !b || !w) return; const ab = V.sub(b, a), aw = V.sub(w, a); const t = Math.max(0, Math.min(1, V.dot(aw, ab) / (V.dot(ab, ab) || 1))); const d = V.len(V.sub(w, V.add(a, V.mul(ab, t)))); if (d > Math.max(0.3, o.ua * 0.5) || t < 0.15) { if (out === H) out = { ...H }; out[S] = 'grip'; } }); return out; }
/* 좌우 뒤집기(고유 자세는 번갈아 뒤집어 '붙여 넣은 듯' 보이지 않게 · 바이블 §9.3) */
function msc2Mirror(P) { if (!P || P.w === 0 && !P.arms) return P; const fx = (a) => { if (!a) return a; const b = { ...a }; if (a.k === 'ik' || a.k === 'ikw') { if (typeof a.t === 'string') b.t = a.t.replace(/[LR]$/, (c) => (c === 'L' ? 'R' : 'L')); else b.t = [-a.t[0], a.t[1], a.t[2]]; if (a.pole) b.pole = [-a.pole[0], a.pole[1], a.pole[2]]; } return b; };
  const A = P.arms || {}, Hd = P.hand || {}; return { ...P, w: -(P.w || 0), hd: P.hd, arms: { L: fx(A.R), R: fx(A.L) }, hand: { L: Hd.R, R: Hd.L }, legs: P.legs ? { L: -(P.legs.R || 0), R: -(P.legs.L || 0), k: P.legs.k, lift: P.legs.lift ? { L: P.legs.lift.R || 0, R: P.legs.lift.L || 0 } : undefined } : P.legs, mir: !P.mir }; }
/* 객체 고유 자세(가장 자주 · 바이블 §9.3 · 정범님 '자기만의 독특한 포즈를 가장 많이') — 캐릭터마다 바꿀 수 있음(MSC2_CSIG) */
const MSC2_SIG = { af: 'book', am: 'xl', tf: 'pv', tm: 'pk', mf: 'cf', mm: 'bk', of: 'cf', om: 'bk', kf: 'kbk', km: 'hipB' };
const MSC2_SIG2 = { af: 'hip', am: 'th', tf: 'xa', tm: 'hs', mf: 'ck', mm: 'hip', of: 'cf', om: 'bk', kf: 'cf', km: 'kn' }; /* 둘째 자세 */
/* 캐릭터 성격에 맞춘 고유 자세(바이블 §9.3 성격표) */
const MSC2_CSIG = { n_bogi: ['book', 'cf'], n_seoyun: ['hip', 'xl'], n_harin: ['xl', 'hip'], n_mikyung: ['hip', 'ck'], n_mori: ['pk', 'xl'], n_geonu: ['pk2', 'lean'], n_jiho: ['hs', 'cf'], n_sungho: ['bk', 'xl'], n_dodam: ['hipB', 'hs'], n_daon: ['pv', 'kbk'], n_danu: ['pk', 'hs'], n_arong: ['kbk', 'cf'], n_tori: ['hipB', 'kn'], n_oksun: ['cf', 'ck'], n_manbok: ['bk', 'hip'], n_yuna: ['book', 'hip'], n_taeo: ['xl', 'th'] };
/* 서는 자세 고르기 가중치(v2): 고유 45% · 가벼운 무게 옮김 35% · 나머지(둘째 자세 · 무릎 · 발목 꼬기 · 기대기) 20% — 지금 자세는 빼고 고르므로 고유 자세로 자주 돌아옴 */
function msc2StW0(id, k, fit) { const cs = MSC2_CSIG[id] || [MSC2_SIG[k], MSC2_SIG2[k]]; const W = { [cs[0]]: 12, rl: 1.4, cpL: 1.1, cpR: 1.1 }; if (cs[1]) W[cs[1]] = (W[cs[1]] || 0) + 1.0; const kid = k[0] === 'k', old = k[0] === 'o';
  if (!old) { W.kn = (W.kn || 0) + 0.5; W.lean = (W.lean || 0) + (kid ? 0.2 : 0.5); W.xa = (W.xa || 0) + (kid ? 0.2 : 0.5); }
  const pants = fit && fit.bottom && /^(pants|shorts)$/.test(fit.bottom.t); if (!pants) { delete W.pk; delete W.pk2; } else if (k[1] === 'm' && !kid) W.pk = (W.pk || 0) + 0.4;
  return W; }
/* (r18 회차 3 · 01 §1.5 고르기) 먼저 p로 '비튼 계열 / 정자세 계열'을 나누고, 그 안에서는 예전 가중치 그대로(고유 자세 몫 45% 규칙 유지) — 정자세 계열 = 각 자세의 바른 판(rl·cpL·cpR → sqA · xl → sqX · 고유 자세 → _q) · 예전 방식(old)·회차 6 대상(꼬마·동물·로봇)은 예전 가중치 */
function msc2StW(id, k, fit, cu) { const W0 = msc2StW0(id, k, fit); const pf = msc2PostureProfile(id, cu); if (pf.T == null) return W0;
  const R = pf.R || 0, E = pf.E == null ? 0.5 : pf.E, S = pf.S || 0; if (R > 0.02) { const pants = fit && fit.bottom && /^(pants|shorts)$/.test(fit.bottom.t); const G = MSC2_RVG * (1 + 4.5 * R * R); const ad = (q, v) => { if (v > 0) W0[q] = (W0[q] || 0) + v * G; }; ad(pants ? 'rvP' : 'rvPs', 6 * R); ad('rvH', 3 * R * E); ad('rvX', 4 * R * (1 - E)); ad(pants ? 'rvL' : 'rvLb', 3 * R); } /* (r18 회차 4 · 01 §1.3 반항 손·발 가중) 주머니 +6R · 머리 뒤 깍지 +3R·E(건들) · 팔짱 +4R·(1−E)(쿨) · 기대기·발목 꼬기 +3R — × G(반항 세기 R이 큰 청소년이 반항 계열에 머무는 몫 ≥40%) · 반항 자세는 비튼 계열(바른 판 없음) */
  if (S >= 0.3) W0.cf = (W0.cf || 0) + 6 * S * MSC2_SHYG; /* (r18 회차 4) 수줍음: 손 앞 모음 +6S */
  const Wq = {}; Object.entries(W0).forEach(([q, v]) => { const s = MSC2_SQV[q]; if (s && MSC2_POSES[s]) Wq[s] = (Wq[s] || 0) + v; }); if (S >= 0.5) Wq.slC = (Wq.slC || 0) + 4 * S; /* 오그린 수줍 서기(바른 계열) */
  const sum = (o) => Object.values(o).reduce((a, v) => a + v, 0); const St = sum(W0), Sq = sum(Wq); const p = pf.p, W = {};
  if (p > 0 && St > 0) Object.entries(W0).forEach(([q, v]) => { W[q] = (W[q] || 0) + (20 * p * v) / St; });
  if (p < 1 && Sq > 0) Object.entries(Wq).forEach(([q, v]) => { W[q] = (W[q] || 0) + (20 * (1 - p) * v) / Sq; });
  Object.keys(W).forEach((q) => { W[q] = Math.round(W[q] * 1000) / 1000; }); return W; }
const MSC2_RVG = 1, MSC2_SHYG = 0.25; /* (r18 회차 4) 반항·수줍 가중 배수(시험 T97로 맞춤) */
/* 첫 자세(처음 본 모습 · 가장 자주) = 고유 자세 — 비틂 확률 p가 0.5 아래면 그 바른 판 */
function msc2SigOf(id, k, cu) { const sig = (MSC2_CSIG[id] || [MSC2_SIG[k]])[0]; if (!sig) return sig; const pf = msc2PostureProfile(id, cu); if (pf.T == null || pf.p >= 0.5) return sig; const q = MSC2_SQV[sig]; return q && MSC2_POSES[q] ? q : 'sqA'; }
/* ── 뼈대 풀기(정면 · 3D) — 차례: 골반 → 척추 → 가슴 → 머리 → 팔 → 다리(바이블 §1.6) · 다림줄을 맞춤(법칙 5) ──
 *  P = { w, cp:{ht,st,sh,hd,kf,fo,hl}, arms, hd(고개 기울기 더함), lean(앞뒤), twist } · 결과: J(관절 3D) · fr(틀: 골반·가슴 회전) · plumb */
/* (15차d) 나이 자세(바이블 §2.3 중년·노인 · 2a67b3cc · Dessindigo): lean 몸통 앞 숙임° · hf 머리가 가슴보다 앞(H · 숙임 몫 뺀 나머지) · hd 목 굽힘으로 머리가 내려감(H) · knee 무릎 굽힘° · shK 어깨 말림(어깨 관절 폭 배) · fl 매단 팔이 허벅지 앞으로°
 *  노인 = 등 굽음 +25° · 목 30° 앞 · 머리가 가슴보다 0.30H(여)/0.35H(남) 앞 · 무릎 8° · 엉덩이 5° · 어깨 말림 · 팔이 허벅지 앞 / 중년 여 = 머리 0.05H 앞 · 어깨 5° 말림 / 중년 남 = 살짝 둥근 등 */
const MSC2_POST = { /* (16f · 정범님 캡처 '노인인데 꼿꼿함') 바이블 05 §5.6 '노인: 척추 굽음(머리 앞 0.30H 여/0.35 남)' · 정면에서 읽히게 머리가 어깨 사이로 내려앉음(hd) · 허리 앞 굽힘 · 무릎 굽힘 · 둥근 어깨(shK) · 팔이 앞으로 매달림(fl) — 예전 값(0.19/0.23H · 6~7°)은 정면에서 거의 안 보였음 */ of: { lean: 6, hf: 0.19, hd: 0.13, knee: 12, shK: 0.965, fl: 9 }, om: { lean: 7, hf: 0.23, hd: 0.12, knee: 13, shK: 0.96, fl: 10 }, /* 머리 앞 = 가슴 굽힘(lean)+목 앞(hf)이 합쳐 0.30/0.35H(tR15d가 잼) — 그 값은 그대로 두고 정면에서 읽히는 몫(머리 내려앉음 hd · 무릎)만 키움(어깨 폭·팔 앞 들림은 3/4 층 순서·허리 손 시험값이 묶여 있어 그대로) */ mf: { lean: 1, hf: 0.04, hd: 0.01, knee: 3, shK: 0.99, fl: 3 }, mm: { lean: 2.5, hf: 0.05, hd: 0.015, knee: 3, shK: 0.985, fl: 4 } };
/* ══ (r18 회차 5 · 정범님 '노인은 비튼 자세라기보다 허리가 휘는 거야. 그렇다고 모든 노인이 허리가 휘는 건 아니야' · D1 옥순 S자 · 만복 곧음) 노인 허리 굽음 4형 — 01 §1.3 · 中田 분류[P4]
 *  ky = 등(가슴 위) 앞 굽음°(목 높이 끝값 · 허리→목 사이를 부드럽게 휨) · lo = 허리 앞 굽음(요추 전만 · 아랫몸통이 뒤로)° · lean = 허리에서 통째 숙임° · hf/hd = 목 위 머리 앞·내려앉음(H) · knee 무릎° · shK 어깨 말림 · fl 팔 앞으로° · hump = 등 솟음 그림 몫(예전 노인 1)
 *  예전(0.15.17)은 모든 노인이 같은 굽음(통째 숙임 6~7° + 머리 앞 0.19~0.23H) — 이제 곧은 노인(none)은 굽음 0, 굽은 노인은 등이 휘어 머리가 몸통을 따라 나감(목 위 머리 따로 옮김 hf가 작아 목·머리 이음이 덜 벌어짐) */
const MSC2_KYPHO = { none: { lean: 0, ky: 0, lo: 0, hf: 0, hd: 0, knee: 3, shK: 1, fl: 2, hump: 0, hn: 0.5 }, S: { lean: 1, ky: 24, lo: 7, hf: 0.03, hd: 0.10, knee: 6, shK: 0.96, fl: 9, hump: 1.25, hn: 0.5 }, flex: { lean: 12, ky: 22, lo: 0, hf: 0.04, hd: 0.12, knee: 12, shK: 0.96, fl: 12, hump: 1.15, hn: 0.4 }, knee: { lean: 16, ky: 22, lo: 0, hf: 0.04, hd: 0.12, knee: 18, shK: 0.955, fl: 22, hump: 1.15, hn: 0.4 } }; /* knee(손무릎)의 '손 허벅지 앞'은 팔 앞 22°로만(손 짚는 자세는 회차 6 설정 때) */
const MSC2_POC = new WeakMap();
/* 등 휨 표: 허리에서 높이 h인 몸통 점 → [세로 높이, 앞 깊이] — 굽음각 θ(s) = lean − lo + (lo + ky)·부드러운계단(0.2→1, s = h/(허리−목 패임)) · 목 위(머리 받침)는 θ가 hn 몫까지 되돌아 고개를 듦 */
const MSC2_KYT = new Map();
function msc2KyTab(o, lean, ky, lo, hn) { const Ht = o.wa - o.sn, key = [Ht, lean, ky, lo, hn].map((v) => Math.round(v * 1e4)).join('|'); let T = MSC2_KYT.get(key); if (!T) { const N = 48, hM = Ht * 2.2, dh = hM / N; const th = (h) => { const s = h / Ht; if (s <= 1) { const t = Math.max(0, Math.min(1, (s - 0.2) / 0.8)); return lean - lo + (lo + ky) * t * t * (3 - 2 * t); } const t = Math.min(1, (s - 1) / 0.35); return lean + ky - (ky * (1 - (hn == null ? 0.5 : hn))) * t * t * (3 - 2 * t); };
    const Y = [0], Z = [0]; for (let i = 0; i < N; i++) { const a = th((i + 0.5) * dh); Y.push(Y[i] + dh * Math.cos(a)); Z.push(Z[i] + dh * Math.sin(a)); } const a0 = th(0);
    T = (h) => { if (h <= 0) return [h * Math.cos(a0), h * Math.sin(a0)]; const f = h / dh; const i = Math.min(N - 1, Math.floor(f)), u = f - i; if (h >= hM) { const a = th(hM); return [Y[N] + (h - hM) * Math.cos(a), Z[N] + (h - hM) * Math.sin(a)]; } return [Y[i] + (Y[i + 1] - Y[i]) * u, Z[i] + (Z[i + 1] - Z[i]) * u]; };
    if (MSC2_KYT.size > 64) MSC2_KYT.clear(); MSC2_KYT.set(key, T); } return T; }
function msc2PostOf(o, CY) { const b = MSC2_POST[o.k] || {}; if (!CY || CY.Er == null) return b; let m = MSC2_POC.get(CY); if (!m) { m = {}; MSC2_POC.set(CY, m); } if (m[o.k]) return m[o.k]; let r;
  if (o.k === 'of' || o.k === 'om') { const K = MSC2_KYPHO[CY.kypho] ? CY.kypho : 'S'; r = { ...MSC2_KYPHO[K], K }; if (K !== 'none' && o.k === 'om') { r.hd += 0.01; r.knee += 1; } }
  else { const e = 1 - Math.min(1, CY.Er || 0); r = { ...b, lean: (b.lean || 0) * e, hf: (b.hf || 0) * e, hd: (b.hd || 0) * e, fl: (b.fl || 0) * e, shK: 1 - (1 - (b.shK || 1)) * e, hump: e }; } /* 중년 굽음(머리 앞 0.04~0.05H · 앞 1~2.5°)은 가슴 펴기만큼 걷음 */
  if (CY.hf) { r.hf = (r.hf || 0) + CY.hf; r.hd = (r.hd || 0) + (CY.hdn || 0); }
  m[o.k] = r; return r; }
function msc2Solve(o, W, P, opt) { opt = opt || {}; const V = msc2V; P = P || MSC2_POSES.st; /* r15e hook */ if (o.sd && P.n && typeof msc2SdPose === 'function') P = msc2SdPose(o, P); P = msc2PoseTw(P, P.carry || opt.carry); /* (r18 회차 3) 비틂 정도 T로 정자세 sq ↔ 자세의 비틂 보간 */ const cp0 = typeof P.cp === 'string' ? MSC2_CP[P.cp] : P.cp || MSC2_CP.light; const cp = o.kid && cp0 ? { ...cp0, fx: cp0.fx * 0.6, sh: cp0.sh * 0.65, fz: cp0.fz * 0.6 } : cp0; /* (15차g) 꼬마는 다리가 짧아 같은 H로 벌리면 쉬는 다리가 곧게 펴짐 → 벌림·옆 이동을 다리 길이만큼 줄임 */ const w = P.w || 0, aw = Math.abs(w) > 0.01 ? Math.sign(w) : 0, ws = Math.abs(w); const wc = P.cpAbs ? 1 : ws; const sg = P.cpSg ? 1 : aw; /* (15차h) cpSg = 섞은 자세가 부호 있는 값(골반·어깨·고개 기울기가 왼↔오른 사이에서 0을 지남 · 툭 뒤집힘 X) */ const CY = P.carry || (opt && opt.carry) || null; /* (15차h) 캐릭터 몸가짐(고개 기울기·어깨) */ /* cpAbs = 섞은 자세(값에 이미 무게가 곱해짐) */ const J = {};
  const k = o.hc / 7; const hipY = o.cr - 0.35 * Math.min(1, k + 0.15), hipX = Math.max(0.12, W.hp * 0.53); /* 넙다리뼈 머리 사이 ≈ 엉덩이 폭의 53%(해부) */
  /* 발: 여자 = 무릎을 모으고 발은 조금 벌림 · 남자 = 1~1.5 HW(바이블 §2.3) · 고유 자세가 발 사이를 바꿀 수 있음(P.st) */ const fx = (o.kid ? 0.2 : o.sex === 'f' ? 0.18 : 0.31) * (P.stance || 1);
  const ank0 = { L: [-fx, o.an, 0], R: [fx, o.an, 0] }; const sup = aw > 0 ? 'R' : aw < 0 ? 'L' : null, fre = sup === 'R' ? 'L' : sup === 'L' ? 'R' : null;
  /* (15차b) 디딘 발 = 목 패임 바로 아래(몸 가운데 가까이 · d9b2964f 다림줄) · 쉬는 발 = 바깥(fx)·앞(fz)으로 · 발목 꼬기(P.cross) = 쉬는 발이 디딘 발 앞을 건너 반대쪽에 */
  if (fre) { const s = fre === 'R' ? 1 : -1; ank0[sup] = [-s * msc2L(fx, 0.05, ws), o.an, 0]; ank0[fre] = P.cross ? [-s * (0.05 + 0.13 * ws), o.an, 0.2 * ws] : [s * (fx + (cp.fx || 0) * wc), o.an, (cp.fz || 0) * wc]; }
  const AA = P.ankAbs || null; if (AA) { ['L', 'R'].forEach((S) => { if (AA[S]) ank0[S] = AA[S].slice(0, 3); }); } /* (15차h) 무게 옮김 중 디딘 발 = 제자리(미끄러짐 X) — 발목 자리를 그대로 받음 */
  if (P.legs) { ank0.L[0] += P.legs.L || 0; ank0.R[0] += P.legs.R || 0; } /* 몸짓 다리(넓게 벌림 등) */ if (P.legs && P.legs.lift) { ank0.L[1] -= P.legs.lift.L || 0; ank0.R[1] -= P.legs.lift.R || 0; } /* (15l ②) 걸음: 발을 땅에서 들어 올림(무릎이 굽으며 들림 · 미끄러지지 않음) */
  /* 골반: 디딘 쪽 위로(ht) · 디딘 쪽으로 옮김(sh) — (15차b) 뼈(엉덩 관절)도 그림 윤곽과 같은 각으로 기욺 · 쉬는 다리는 무릎을 굽히고(kf) 모자라면 뒤꿈치를 들어(≤ hl) 땅에 닿음 */
  const th = -msc2R(cp.ht * wc) * sg; const pc = [(cp.sh || 0) * wc * sg, (o.il + o.cr) / 2, 0]; const pcY = pc[1];
  const thc0 = msc2R(cp.st * wc) * sg; let thc = thc0 * MSC2_SC.ac; /* (15차h S자) 가슴 상자 축 기울기 = 어깨선 기울기의 55% — 나머지 45%는 어깨뼈(빗장·날개뼈)가 내려감(girdle) · 가슴 상자가 디딘 쪽으로 기울어 허리에서 '〈'로 꺾임(dcaa6a34 · d9b2964f) */
  const tx0 = AA && AA.tx != null ? AA.tx : P.cross ? ank0[sup][0] * 0.5 + ank0[fre][0] * 0.5 : sup ? ank0[sup][0] : (ank0.L[0] + ank0.R[0]) / 2;
  if (!P.noSC && (sup || AA || P.cpSg)) { pc[0] = tx0 + (cp.sh || 0) * wc * sg * MSC2_SC.sh; const wx = pc[0] + (pcY - o.wa) * Math.sin(th); const m = Math.abs(thc0); thc = Math.max(-m, Math.min(m, Math.asin(Math.max(-1, Math.min(1, (tx0 - wx) / (o.wa - o.sn)))))); } if (thc * th > 0 && Math.abs(thc) > 0.29 * Math.abs(th)) thc = Math.sign(thc) * 0.29 * Math.abs(th); /* (P1 16차b) 허리 꺾임(골반 축 − 가슴 축) ≥ 골반의 71% 유지(S자 7°/4°) — 꼬마 목 패임이 n(4)=0.15H로 내려가 허리~목이 짧아지면 다림줄 돌림이 커져 꺾임이 6.9°로 줄던 것(다림줄 차이 ≤0.002H) */ /* (15차h) 골반은 디딘 발 쪽으로 내밀고(dcaa6a34 · 목 아래에서 ≈0.14H) · 가슴 상자는 목 패임이 디딘 발목 위에 오도록 돌림(전단 없이 · 허리에서 꺾임) · 어깨선의 나머지는 어깨뼈(girdle)가 맡음 */ /* (15차h) 골반 가운데 = 목 패임이 디딘 발목 위에 오도록(다림줄 · 가슴을 옆으로 미는 전단 없이) */
 
  const th1 = Math.hypot(hipX - W.kn - 0.02, o.kn - hipY), sn1 = o.an - o.kn; const ref = sup || (P.legs && Math.abs(P.legs.L || 0) > Math.abs(P.legs.R || 0) ? 'L' : 'R');
  const V3ang = (a, b, c) => { const u = V.norm(V.sub(a, b)), q = V.norm(V.sub(c, b)); return 180 - (Math.acos(Math.max(-1, Math.min(1, V.dot(u, q)))) * 180) / Math.PI; };
  const thB = th * 0.65; /* 뼈(엉덩 관절 사이) 기울기 = 그림 골반선의 65% — 그림 속 골반선은 디딘 쪽 엉덩이 살·엉덩뼈 능선이 바깥·위로 나온 윤곽까지 포함(뼈만 9° 기울이면 쉬는 무릎이 40° 넘게 굽음) */ const pr = (p) => { const q = msc2Rz([p[0], p[1], 0], [0, pcY], thB); return [q[0] + pc[0], q[1], 0]; }; let H = { L: pr([-hipX, hipY]), R: pr([hipX, hipY]) };
  /* 디딘 다리 = 거의 곧게(3°) — 엉덩이 높이를 그 길이에 맞춤 */ const dd = V.len(V.sub(ank0[ref], H[ref])); const PO = msc2PostOf(o, CY); const want = Math.sqrt(th1 * th1 + sn1 * sn1 + 2 * th1 * sn1 * Math.cos(msc2R(Math.max(sup ? 3 : 2, PO.knee || 0)))); let drop = Math.max(-0.08, Math.min(0.14, ((dd - want) * (ank0[ref][1] - H[ref][1])) / (dd || 1)));
  if (AA) { const mxL = th1 + sn1 - 0.004; ['L', 'R'].forEach((S) => { const a = ank0[S], h = H[S]; const dx = a[0] - h[0], dz = (a[2] || 0) - (h[2] || 0); const r2 = mxL * mxL - dx * dx - dz * dz; if (r2 > 0) { const need = (a[1] - h[1]) - Math.sqrt(r2); if (need > drop) drop = need; } }); } /* (15차h) 두 발을 제자리에 둘 때: 두 다리가 모두 발목에 닿도록 엉덩이를 내림(발이 뜨지 않음) */
  if (P.sq) drop += P.sq; /* (15l ①) 어른이 무릎을 굽혀 몸을 낮춤(하이파이브 · 꼬마 손 높이에 맞춤) — 엉덩이를 내리면 두 무릎이 굽음(발은 제자리) */ if (P.legs) drop += 0.05 * Math.min(1, (P.legs.k || 0) / 16); H = { L: [H.L[0], H.L[1] + drop, CY && CY.rvR ? 0.03 * CY.rvR : 0], R: [H.R[0], H.R[1] + drop, CY && CY.rvR ? 0.03 * CY.rvR : 0] }; const D = (p) => [p[0], p[1] + drop, p[2]];
  let lift = 0; if (fre && !AA) { const s = fre === 'R' ? 1 : -1; const pole = P.cross ? [s * 0.2, 0, 1] : [-s * 0.35, 0, 1]; lift = (P.heel || 0) * wc; const A0 = ank0[fre]; const kAt = (z) => { const A2 = [A0[0], A0[1] - lift, z]; const r = msc2IK3(H[fre], A2, th1, sn1, pole); return V3ang(H[fre], r.M, r.E); }; const tg = (cp.kf || 0) * wc;
    /* (15차b) 쉬는 엉덩이가 내려간 만큼 다리가 남음 → 무릎이 kf만큼 굽고 남는 길이는 발을 앞으로 내놓아 맞춤(d9b2964f · dcaa6a34: 쉬는 발은 바깥·앞) · 앞으로 최대 0.55H — 그보다 더 남으면 무릎이 더 굽음 */
    let z = A0[2]; if (kAt(z) > tg) { let a = z, b = Math.max(z, 0.55 * (o.hc / 7)); if (kAt(b) > tg) z = b; else { for (let i = 0; i < 16; i++) { const m = (a + b) / 2; if (kAt(m) > tg) a = m; else b = m; } z = (a + b) / 2; } } ank0[fre] = [A0[0], A0[1] - lift, z]; }
  if (P.ankT && H[P.ankT.S]) { const S = P.ankT.S, hp = H[S]; let t = P.ankT.t; const v = V.sub(t, hp), dl = V.len(v), mx = th1 + sn1 - 0.02; if (dl > mx) t = V.add(hp, V.mul(v, mx / dl)); { const d2 = V.sub(t, hp), sx = Math.hypot(d2[0], d2[2] * 0.4), aMax = 0.95; if (Math.atan2(sx, Math.max(1e-6, d2[1])) > aMax || d2[1] < 0.05) { const L2 = Math.max(0.2, V.len(d2)), k = Math.sin(aMax) * L2 / (sx || 1); t = [hp[0] + d2[0] * k, hp[1] + Math.cos(aMax) * L2, hp[2] + d2[2] * k]; } } /* (r17 · 정범님 캡처 '다리가 판자처럼 옆으로') 끌린 다리는 엉덩이에서 옆·앞으로 54°까지(사람 다리 벌림 한계) — 예전엔 수평까지 들려 곧은 판자처럼 */ if (t[1] > o.an) t = [t[0], o.an, t[2]]; const w0 = P.ankT.w == null ? 1 : P.ankT.w; ank0[S] = [msc2L(ank0[S][0], t[0], w0), msc2L(ank0[S][1], t[1], w0), msc2L(ank0[S][2], t[2], w0)]; if (S === fre) lift = 0; } /* 끌린 발(발목 목표 · 다리 길이 안으로) */
  const pz = CY && CY.rvR ? 0.03 * CY.rvR : 0; /* (r18 회차 4) 반항: 골반을 앞으로 0.03R H(상체는 뒤로) */ const pel = (p) => { const q = msc2Rz([p[0], p[1], p[2] || 0], [0, pcY], th); return [q[0] + pc[0], q[1], q[2] + pz]; }; const pelC = D(pel([0, pcY, 0]));
  /* 척추: 가슴(갈비 = 단단한 덩어리)은 골반과 반대로 st만큼 기욺 · 허리(부드러운 마디)가 옆으로 휘어 목 패임을 디딘 발 위로 옮김(다림줄 · 기울기는 그대로 — 예전엔 다림줄을 맞추다 어깨 기울기가 1.6°로 줄었음) */
  const waist = D(pel([0, o.wa, 0])); const neck0 = [0, o.sn, 0]; const ribC = [0, (o.sh + o.rib) / 2, 0];
  const tx = tx0; const rot0 = (p) => { const q0 = [p[0], p[1] - o.wa, p[2] || 0]; const s = Math.sin(thc), c = Math.cos(thc); return [waist[0] + q0[0] * c - q0[1] * s, waist[1] + q0[0] * s + q0[1] * c, q0[2]]; };
  const bendX = Math.max(-0.22, Math.min(0.22, tx - rot0(neck0)[0])); if (P.sb) thc += msc2R(P.sb); /* (15차k ③) 허리에서 옆으로 굽힘(몸짓 sb · + = 화면 오른쪽) — 가슴 상자·목·머리가 함께 · 다림줄(bendX)을 맞춘 뒤에 더함(먼저 더하면 목을 다시 발 위로 되돌려 굽힘이 사라짐) */ const lean = msc2R((P.lean || 0) + (PO.lean || 0) + (CY && CY.lean || 0)); const KT = PO.ky || PO.lo ? msc2KyTab(o, lean, msc2R(PO.ky || 0), msc2R(PO.lo || 0), PO.hn) : null; /* (r18 회차 5) 등 휨 */ /* 허리 옆 휨 = 가슴을 옆으로 옮김(목 패임 x = 디딘 발목 x) */
  const brA = (P.br || 0) * msc2BrAmp(o); J.br = brA; const chest = (p) => { if (brA) p = msc2BrP(o, brA, p); const q = rot0(p); /* (15차i ①) 숨: 가슴 상자 점이 올라감(아래로 갈수록 덜 · 허리 아래 0) */ const y0 = waist[1]; const up = Math.max(0, Math.min(1, (y0 - q[1]) / (o.wa - o.rib + 0.3))); const qx = q[0] + bendX * (0.55 + 0.45 * up); if (!lean) return [qx, q[1], q[2]]; if (KT) { const h = y0 - q[1]; const g = KT(h); return [qx, y0 - g[0], q[2] + g[1]]; } const dz = (y0 - q[1]) * Math.sin(lean); return [qx, y0 - (y0 - q[1]) * Math.cos(lean), q[2] + dz]; };
  J.pelvis = pelC; J.waist = [waist[0] + bendX * 0.3, waist[1], waist[2]]; J.neck = chest(neck0); J.chest = chest(ribC); J.crown = chest([0, 0, 0]); J.chin = chest([0, 1, 0]); J.hipL = H.L; J.hipR = H.R; J.bendX = bendX; J.hump = PO.hump; /* (r18 회차 5) 등 솟음 그림 몫(곧은 노인 0) */
  /* 머리: 목(뒤로 기운 원기둥)이 머리뼈 아래 뒤쪽으로(바이블 §1.3) · 머리 굴림(+ = 정수리가 화면 오른쪽) = 디딘 쪽으로(dcaa6a34) + 성격 기울기 */ J.headPiv = chest([0, 0.72, -0.12]); if (PO.hf) { const mv = (q) => [q[0], q[1] + PO.hd, q[2] + PO.hf]; J.headPiv = mv(J.headPiv); J.crown = mv(J.crown); J.chin = mv(J.chin); } J.headRoll = (cp.hd || 0) * wc * sg + (P.cpSg ? (P.hd || 0) : (P.hd || 0) * (aw || 1)) + (CY ? (CY.hd || 0) * (P.cpSg ? Math.max(-1, Math.min(1, w / 0.3)) : (aw || 1)) : 0); J.chestRot = thc; J.pelRot = th; J.girdle = thc0 - thc - (CY && CY.rvR ? msc2R(4 * CY.rvR) * Math.max(-1, Math.min(1, w / 0.3)) : 0); /* (r18 회차 4) 반항: 쉬는 다리 쪽 어깨를 4R° 더 내림 */ /* (15차h) 고개 = 디딘 쪽으로 되돌아 기욺 + 캐릭터 고유 기울기 · 어깨뼈 추가 기울기 */
  /* 어깨 관절 = 어깨선 0.10H 아래 · 바깥 삼각근 안쪽 */ const shX = (W.sh - (o.kid ? 0.11 : 0.15) * (W.sh / 0.74)) * (PO.shK || 1) * (CY && CY.shK || 1) * (P.shK || 1), shY = o.sh + 0.10 + (P.shY || 0) + (CY && CY.shY || 0); const gTan = Math.tan(J.girdle || 0); const gY = (x) => x * gTan; /* (15차h) 어깨뼈 기울기: 디딘 쪽(+) 어깨가 더 내려감 */ /* 어깨 관절 = 삼각근 바깥(어깨 폭)에서 안으로 — 매단 위팔 안쪽이 가슴 옆선을 덮음(5d6400d6) */
  const csY = (CY && CY.shY || 0); J.acL = chest([-(W.sh - 0.085), o.sh + 0.01 + (P.shY || 0) + csY + gY(-(W.sh - 0.085)), 0]); J.acR = chest([W.sh - 0.085, o.sh + 0.01 + (P.shY || 0) + csY + gY(W.sh - 0.085), 0]);
  ['L', 'R'].forEach((S) => { const s = S === 'L' ? -1 : 1; const sh = chest([s * shX, shY + gY(s * shX), 0]); J['sh' + S] = sh; const A = (P.arms || {})[S] || { k: 'hang', ab: 8, fl: 4, el: 14 };
    let E, Wr; if (A.k === 'iks') { const r = msc2IK3(sh, V.add(sh, A.t), o.ua, o.fa, A.pole || [s, 0.3, -1], 1); E = r.M; Wr = r.E; } /* (15차h) 어깨 기준 손목 목표(자세 사이 섞기 · 몸이 옮겨 가도 손이 몸을 따라감) */ else if (A.k === 'ik' || A.k === 'ikw') { let t = A.t; if (t === 'hipR' || t === 'hipL') { const yH = o.il - MSC2_HIPT.y * (o.hc / 7), xH = msc2L(W.wa, W.hp, Math.max(0, Math.min(1, (yH + 0.12 - o.wa) / Math.max(0.1, o.tro - o.wa)))); const q = pel([s * (xH + (MSC2_HIPT.x + (o.sex === 'm' && !o.kid ? MSC2_HIPT.xm : 0)) * (o.hc / 7)), yH, MSC2_HIPT.z]); t = [q[0], q[1] + drop, q[2]]; } /* (15차i ③ 정범님 '손이 허리에 실제로 얹히게') 손목 = 엉덩뼈 능선 바로 위·몸 윤곽 바깥 → 손바닥이 아래·안쪽으로 꺾여(aim) 엉덩뼈 옆에 얹힘(예전: 손목이 배 위 0.93 · 손이 배 앞으로 누움) */ else if (t === 'hipxR' || t === 'hipxL') { const q = pel([s * (W.hp + 0.2 * (o.hc / 7)), o.il - 0.02, -0.06]); /* 주먹 가운데가 엉덩이 옆선에 오도록 손목은 그 바깥 */ t = [q[0], q[1] + drop, q[2]]; } else if (t === 'pocketR' || t === 'pocketL') { const q = pel([s * (W.hp * 0.78), o.cr - 0.12, 0.16]); t = [q[0], q[1] + drop, q[2]]; } else if (typeof t === 'string' && typeof MSC2_ARMT !== 'undefined' && MSC2_ARMT[t.slice(0, -1)]) { const q = MSC2_ARMT[t.slice(0, -1)](o, W, s); t = q.c === 'pel' ? pel(q.p) : chest(q.p); t = [t[0], t[1] + (q.c === 'pel' ? drop : 0), t[2]]; } /* (r17 arms R2) 몸 기준점 목표 — 팔짱·뒷짐·앞 두 손: 머리 단위 고정값이면 꼬마·SD·노인에서 손이 무릎·쇄골로 감(연구.md §3) */ else if (A.k === 'ik') { t = chest([t[0], t[1], t[2]]); if (A.fc && PO.hf) t = [t[0], t[1] + PO.hd, t[2] + PO.hf]; if (A.fc && J.headRoll) { const q = msc2Rz(t, [J.headPiv[0], J.headPiv[1]], msc2R(J.headRoll)); t = [q[0], q[1], t[2]]; } } /* (15차h) 얼굴 목표는 고개 기울기(성격 몸가짐 포함)도 따라감 */ /* (15차f) 얼굴 목표는 머리 자리를 따라감 */ /* ikw = 세계 좌표 그대로(섞은 자세) */ const r = msc2IK3(sh, t, o.ua, o.fa, A.pole || [s, 0.3, -1], 1); E = r.M; Wr = r.E; }
    else { const ab = msc2R(msc2Cl(A.ab + Math.min(5, Math.max(0, W.hp - W.ch - 0.15) * 30), MSC2_ROM.shAbd)), /* 엉덩이가 넓으면 매단 팔이 엉덩이 옆을 지나도록 조금 더 벌어짐 */ fl = msc2R(msc2Cl((A.fl || 0) + (PO.fl || 0), MSC2_ROM.shFlex)), el = msc2R(msc2Cl(A.el, MSC2_ROM.elb)); const dU = V.norm([s * Math.sin(ab), Math.cos(ab) * Math.cos(fl), Math.sin(fl) * Math.cos(ab)]); E = V.add(sh, V.mul(dU, o.ua));
      /* (15차b) 편한 팔: 위팔이 안으로 조금 돌아 아래팔이 앞·안쪽(허벅지 쪽)으로 굽음 → 정면에서도 팔꿈치 굽음이 보임(dcaa6a34 · 바이블 §9.1-4 '편한 팔은 굽음') */ const ki = A.ki != null ? A.ki : 0.62; const bd0 = [-s * ki, 0, 1]; const bd = V.norm(V.sub(bd0, V.mul(dU, V.dot(bd0, dU)))); const f2 = V.norm(V.add(V.mul(dU, Math.cos(el)), V.mul(bd, Math.sin(el)))); Wr = V.add(E, V.mul(f2, o.fa)); }
    J['el' + S] = E; J['wr' + S] = Wr; });
  /* 다리 IK: 무릎은 앞으로(+z) · 쉬는 다리 무릎은 안쪽으로(바이블 §9.2) · 발 돌림: 쉬는 발 바깥 fo° · 디딘 발 8° */
  ['L', 'R'].forEach((S) => { const s = S === 'L' ? -1 : 1; const free = S === fre; const pole = free ? (P.cross ? [s * 0.2, 0, 1] : [-s * 0.35, 0, 1]) : [s * 0.05, 0, 1]; const r = msc2IK3(H[S], ank0[S], th1, sn1, pole); J.pelRotS = thB; J['kn' + S] = r.M; J['an' + S] = r.E; J['turn' + S] = msc2R(((free ? (P.cross ? -6 : (cp.fo || 0) * wc) : 8) + (P.toe || 0)) * s); /* (r18 회차 4) P.toe = 반항 발끝 바깥(+) · 수줍 안쪽(−) */ J['heel' + S] = free ? lift : 0; if (AA) { if (AA.turn && AA.turn[S] != null) J['turn' + S] = AA.turn[S]; if (AA.hl && AA.hl[S] != null) J['heel' + S] = AA.hl[S]; } });
  J.sup = sup; J.fre = fre; J.cross = !!P.cross; J.drop = drop; J.shX = shX; J.hipX = hipX; J.L = { th: th1, sn: sn1, ua: o.ua, fa: o.fa }; return { o, W, J, P }; }
/* 다림줄(법칙 5): |목 패임 x − 디딘 발목 x| (두 발이면 가운데) */
/* (15차i ① 정범님 '몸 전체가 늘었다 줄었다 X') 숨 = 가슴 상자만: 갈비 아래(o.rib) 위는 다 · 허리(o.wa)에서 0 · 머리는 60%(바이블 §11.1) · 가슴 폭 +1% · 앞으로 0.01H
 *  크기 = 키의 0.45%(꼬마 ×1.3 · SD ×2.5) · 몸짓 shY(으쓱)와 따로 더해짐 · 어깨·팔은 가슴 상자를 따라 같이 올라감 */
const MSC2_HIPT = { y: 0.11, x: 0.06, xm: 0.075, z: -0.07 }; /* (15차k) xm 0.06 → 0.075: 손가락을 더 가로로 눕히니(④) 손 가운데가 배 쪽으로 들어가 — 남자 손목을 조금 더 바깥에 */ /* xm = 남자 손이 크고 엉덩이가 좁아 손바닥이 배 쪽으로 너무 들어가지 않게 바깥으로 더 */ /* (15차j ③) 허리 손 손목 = 엉덩뼈 능선 위 0.11H(허리 옆) · 몸 윤곽 바깥 0.06H · 살짝 뒤(아래팔이 옆·뒤에서 옴 · 2c528dc8) — 예전 0.06 / 0.07 / −0.03 */
const msc2BrAmp = (o) => 0.0045 * o.so * (o.sd ? 2.5 : o.kid ? 1.3 : 1);
function msc2BrP(o, a, p) { const y = p[1]; const f = y < 1 ? 0.6 : Math.max(0, Math.min(1, (o.wa - y) / Math.max(0.1, o.wa - o.rib))); if (!f) return p; const k = a / msc2BrAmp(o); return [p[0] * (1 + 0.01 * k * f * (y < 1 ? 0 : 1)), y - a * f, (p[2] || 0) + 0.3 * a * f * (y < 1 ? 0 : 1)]; }
function msc2Plumb(sk) { const J = sk.J; const ax = J.sup ? J['an' + J.sup][0] : (J.anL[0] + J.anR[0]) / 2; return Math.abs(J.neck[0] - ax); }
/* (15m) 바깥 실루엣 선 배율 — 설정 '외곽선 굵기 배율'(기본 2 · 바이블 §0.3) */
const msc2OutK = () => msc2T('outK');

