/* ── v2 머리(바이블 §3.1): 머리뼈 공 + 깎은 턱 — 얼굴은 한 덩어리 살(안쪽 턱선·V선 없음) ──
 *  머리 좌표(H): 정수리 (0,0) · 턱 끝 (0,1) · 옆 = 얼굴 반폭 · 그림은 기본 자리(가운데 x 50 · 정수리 = 뼈대의 정수리 높이)에 그리고 머리 묶음을 목 자리로 옮김
 *  턱 끝은 볼에서 내려오는 '깎은 초승달 곡선 위'에 있음(덧붙이지 않음) — 서윤 '턱이 튀어나옴'을 짜임으로 막음 · 아래 얼굴 윤곽은 볼록(꺾여 들어갔다 나오지 않음 · 시험 tR15a) */
/* (fix_face · 16차e · 정범님 10/30 00:30 '얼굴 형태 자체가 비정상 · 역삼각·사다리꼴·네모 상자') 얼굴형 다시 짬 — 03 §3.1 · 1afa34ec '곡선 → 곧음 → 곡선' · 487a3c20 '달걀 + 턱 대각선' · b3609d0d
 *  예전(15차): 광대~턱 끝 = 초타원 한 줄 → 볼이 턱 가까이까지 넓게 내려와 아래 얼굴이 U자 상자(턱 0.9 높이에서 폭 0.61 · 아니메 설정표는 0.35~0.45)
 *  지금: 꼭짓점 넷(관자 · 광대 B · 턱 모서리 C · 턱끝 모서리 D) 다각형의 모서리를 반지름 r로 둥글린 선 — 광대 아래 볼은 곧게 안으로 · 턱 모서리(0.66~0.78)에서 꺾여 턱끝까지 35~50° 곧은 턱선 · 턱끝은 작게 둥근 면
 *  늘 볼록(꺾임 방향 하나 · tR15a msc2JawConvex) · 이목구비 자리는 그대로 · 표정 중 불변
 *  [관자 반폭 비율, 광대 반폭 비율, 광대 높이 yB, 턱 모서리 높이 yc, 턱 모서리 반폭(×광대), 턱끝 반폭(×HW), 광대 둥글기 rB, 턱 모서리 둥글기 rC, 턱끝 둥글기 rD (H)] */
const MSC2_FS = { oval: [0.99, 1.0, 0.54, 0.72, 0.9, 0.065, 0.09, 0.2, 0.09], round: [1.0, 1.02, 0.56, 0.71, 0.94, 0.09, 0.1, 0.22, 0.1], heart: [1.01, 1.0, 0.52, 0.69, 0.87, 0.05, 0.08, 0.18, 0.07], square: [0.99, 1.0, 0.53, 0.76, 0.91, 0.11, 0.07, 0.07, 0.07], diamond: [0.93, 1.04, 0.55, 0.72, 0.87, 0.06, 0.06, 0.16, 0.08], triangle: [0.95, 1.0, 0.53, 0.7, 0.86, 0.05, 0.07, 0.16, 0.07] }; /* (감사 A-01 '턱 V 너무 뾰족' · bb11e66a 여자 = 짧고 둥근 턱) 여자 턱 모서리 둥글기 0.16~0.22 = 볼에서 턱끝까지 한 곡선 · 턱끝 반폭 0.05~0.09HW + 둥글기 0.07~0.1 */ /* 턱끝: 여 = 부드러운 점(반폭 0.035~0.05HW + 둥글기 0.05~0.07 → 아래가 납작한 사다리꼴 X) · 남 = 0.11~0.13 */
MSC2_FS.long = [0.97, 0.97, 0.53, 0.74, 0.86, 0.06, 0.08, 0.16, 0.07]; /* (fix_face 2묶음) 긴 얼굴 = 광대 폭 0.97 · 턱 모서리 낮게 · 좁은 턱(성호 '아직 넓고 네모' · 하린) */
const MSC2_FS_OLD = {  softsq: 'square', narrow: 'heart', chubby: 'round', kid: 'round', sd: 'round' }; /* 예전 얼굴형 이름 → 새 6가지 */
/* 다각형 모서리 둥글리기(2차 베지어 · 반지름 = 양쪽 변 길이의 절반을 넘지 않음) → 촘촘한 점 */
function msc2RoundPoly(V, R, n) { const out = []; for (let i = 1; i < V.length - 1; i++) { const U = V[i - 1], P = V[i], W = V[i + 1]; const l1 = Math.hypot(P[0] - U[0], P[1] - U[1]) || 1e-9, l2 = Math.hypot(W[0] - P[0], W[1] - P[1]) || 1e-9; const d1 = Math.min(R[i] || 0, l1 * 0.5), d2 = Math.min(R[i] || 0, l2 * 0.5);
    const S = [P[0] + ((U[0] - P[0]) * d1) / l1, P[1] + ((U[1] - P[1]) * d1) / l1], T = [P[0] + ((W[0] - P[0]) * d2) / l2, P[1] + ((W[1] - P[1]) * d2) / l2]; const k = (Array.isArray(n) ? n[i] : n) || 6; for (let j = 0; j <= k; j++) { const t = j / k, m = 1 - t; out.push([m * m * S[0] + 2 * m * t * P[0] + t * t * T[0], m * m * S[1] + 2 * m * t * P[1] + t * t * T[1]]); } }
  return out; }
function msc2FaceHalf(o, ft) { const F = (MSC2_FS[ft] || MSC2_FS[MSC2_FS_OLD[ft]] || (o.sex === 'm' ? MSC2_FS.square : MSC2_FS.oval)).slice(); const h = o.hw / 2; const m = o.sex === 'm' && !o.kid;
  let [tk, ak, yB, yc, xc, xk, rB, rC, rD] = F;
  if (o.ani) { yB = 0.56; yc = 0.68; xc = 0.97; xk = 0.2; rB = 0.1; rC = 0.24; rD = 0.16; } /* 동물·로봇·외계인 = 주둥이·볼 털이 받치는 넓고 둥근 아래 얼굴(V 턱 X) */ else if (o.kid) { yB = 0.58; yc = 0.7; xc = 0.95; xk = 0.085; rB = 0.1; rC = 0.22; rD = 0.14; } /* 꼬마 = 통통한 볼에서 둥근 U 턱(턱끝 폭 0.17HW) */ /* 꼬마 = 볼이 통통한 넓은 U(턱끝 폭 0.10~0.18HW) */
  else if (m) { const tn = o.k && o.k[0] === 't'; const ln = ft === 'long'; const T = { square: [0.9, 0.14, 0.035], diamond: [0.8, 0.095, 0.07], triangle: [0.82, 0.09, 0.06], oval: [0.85, 0.115, 0.05], round: [0.9, 0.13, 0.09], heart: [0.82, 0.09, 0.06], long: [0.8, 0.1, 0.05] }[MSC2_FS[ft] ? ft : MSC2_FS_OLD[ft] || 'oval'] || [0.85, 0.12, 0.045]; /* (fix_face 3묶음 · 코디네이터 '남자 넷 얼굴 차별화') 남 얼굴형마다 턱 모서리 반폭·턱끝 반폭·모서리 둥글기: 네모(건우·태오) = 넓은 턱 각 · 마름모(모리) = 광대 넓고 좁은 턱 · 역삼각(지호) = 좁은 턱 · 둥근 = 부드러운 턱 */ xk = tn ? Math.min(0.09, T[1]) : T[1]; yc = tn ? 0.73 : 0.765; xc = Math.min(xc, tn ? Math.min(0.88, T[0]) : T[0]); rB = 0.06; rC = tn ? 0.08 : T[2]; rD = tn ? 0.06 : 0.05; } /* (코디네이터 10/30 ① '성호 얼굴 여전히 네모 상자') 어른 남 = 광대(0.53) 아래 볼이 안으로 들어가(턱 모서리 반폭 = 광대의 0.85) 0.765에서 분명한 각(둥글기 0.045) → 곧은 턱선 → 넓은 턱끝(반폭 0.12HW) · 7f56ba2b·bb11e66a 남 */ /* 어른 남 = 턱끝 폭 0.28~0.35HW · 턱 모서리 0.75~0.78(03 §3.1 표) */
  else { if (o.k && o.k[0] === 't') xk = Math.min(xk, 0.075); }
  if (o.old) { xk = Math.max(xk, o.sex === 'm' ? 0.12 : 0.07); yc = Math.max(yc, 0.73); }
  /* (fix_face 3묶음 · 코디네이터 10/30 'T67 목선 윗끝 턱끝 위 0.02~0.12H · 기대값 그대로') 목 윗고리가 턱끝 가까이(0.88 이상)에서 턱 안쪽 0.05HW 넘게 들어가려면 그 높이 얼굴 반폭 ≥ 목 반폭 + 0.07HW(02 §2.3-1·2)
   *  → 턱끝 반폭 xk를 '목이 들어갈 만큼'으로 아래에서 받침(턱 모서리 반폭·높이·둥글기는 얼굴형 그대로 → 볼–턱 곡선과 턱 모서리 각은 남고 턱끝만 그 사람 목 폭만큼 넓어짐) */
  if (MSC2_NKFIT && !o.ani && typeof MSC2_NKR !== 'undefined') { const cls = o.kid ? 'kid' : (o.k && o.k[0] === 't' ? 't' : 'a') + (o.sex === 'f' ? 'f' : 'm'); const r = MSC2_NKR[cls]; if (r) { const nk = Math.min(r[1], Math.max(r[0] + 0.005, (o.nkW || 0) / o.hw)); const yq = 0.885, tq = (1 - yq) / (1 - yc); rC = Math.min(rC, (yq - yc) * 0.8); const need = (nk / 2 + 0.085) * o.hw; const xkN = (need - xc * ak * h * tq) / (1 - tq) / o.hw; if (xkN > xk) xk = xkN; } }
  const a = ak * h; const tw = Math.min(a * 0.995, tk * h); const up = [[0, 0], [h * 0.56, 0.035], [h * 0.87 * Math.min(1, tw / (h * 0.99)), 0.13], [Math.min(h * 0.985, tw * 1.0, a * 0.99), 0.27], [tw, 0.4]]; /* 머리뼈 위쪽은 관자 폭을 넘지 않음 */
  const V = [[tw, 0.4], [a, yB], [xc * a, yc], [xk * o.hw, 1], [-xk * o.hw, 1]]; const lo = msc2RoundPoly(V, [0, rB, rC, rD, 0], [0, 2, 3, 3, 0]).filter((q) => q[0] > 1e-4 && q[1] > 0.4);
  const lx = lo.length ? lo[lo.length - 1] : [0, 1]; const tail = lx[0] > 0.05 && lx[1] > 0.999 ? [[lx[0] * 0.4, 1]] : []; /* 넓은 턱끝(네모 남·노인)은 바닥 평평한 몫에 점 하나 더 — 턱 끝 점이 가운데 가까이(tR15g '턱 끝 안쪽') */
  return up.concat(lo, tail, [[0, 1]]); }
/* (fix_face) 얼굴에 닿는 손 목표 보정(몸 좌표 H) — 눈을 키우고(여 ×1.18 · 남 ×1.12/×1.2) 얼굴형을 바꾼 뒤 브이·수줍음·하품·안경 올리기 손이 눈·입을 10% 넘게 가렸음(tR15f 손 가림) → 손을 얼굴 바깥·아래로 조금 */
const MSC2_FACEOFF = { vR: [0.12, -0.03], sL: [-0.08, 0.02], yR: [0, 0.07], nR: [0.06, 0.04] };
/* (fix_face · 03 §3.3.4 꼬마·동물 눈 8기준 6·8) 꼬마·동물 눈 = 낱개 속눈썹·꼬리 날개·아래 속눈썹·쌍꺼풀 없음 · 반짝이 여럿/별은 '반짝' 표정에서만 · 동물은 흰자 거의 없음(홍채가 눈을 채움) — 사람 어른 눈을 오려 붙인 '화장한 눈' 불쾌감 제거 */
function msc2EyeD(o, D) { if (!o.kid && !o.ani && o.sex === 'f' && !o.old) { const e0 = { ...(D.ey || {}) }; const bt = (MSC_EYE_LT[e0.t] || [1])[0]; e0.lt = (e0.lt || bt) * 1.22; return { ...D, ey: e0 }; } /* (fix_face 2묶음 · 코디네이터 '여자 = 눈 위 속눈썹 덩어리') 청소년·어른 여 위 눈꺼풀 띠 ×1.22 */ if (!o.kid && !o.ani) return D; const e = { ...(D.ey || {}) }; e.fl = 0; e.wing = 0; e.lw = 'none'; e.crease = 0; e.hl = 'round2'; e.lt = Math.min(e.lt || 1, 0.72); /* 큰 둥근 반사광 + 작은 하나(기준 1) · 위 눈꺼풀 띠 바깥 끝 굵기 ≤0.10W(기준 6) */ e.lo2 = 0; if (e.ir === 'layer' || !e.ir) e.ir = 'ray'; if (o.ani) { e.g = 0.02; } return { ...D, ey: e }; } /* lo2 = 아래 바깥 속눈썹 덩어리(꼬마 눈꼬리 검은 막대) · layer 홍채 = 반짝 점·별 → 꼬마는 결(ray) 홍채 */
/* 얼굴 경로(머리 좌표 → 그림 좌표) — 대칭 */
function msc2FacePath(half, hx, hy) { const L = half.map(([x, y]) => [-x, y]).reverse(); const R = half.slice(1, -1); const pts = L.concat(R).map(([x, y]) => [hx(x), hy(y)]); return msc2SD(msc2Segs(pts.concat([pts[0]]))) + 'Z'; }
/* 아래 얼굴 볼록 검사(시험) — 광대 아래에서 턱 끝까지 꺾인 방향이 한쪽으로만 */
function msc2JawConvex(half) { const i0 = half.reduce((bi, q, i) => (q[0] > half[bi][0] ? i : bi), 0); const P = half.slice(i0); let sg = 0, bad = 0; for (let i = 1; i < P.length - 1; i++) { const a = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]], b = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]]; const c = a[0] * b[1] - a[1] * b[0]; if (Math.abs(c) < 1e-6) continue; const s = Math.sign(c); if (!sg) sg = s; else if (s !== sg) bad++; } return bad === 0; }
/* 옛 얼굴 부품(눈·눈썹·입·코 · 표정 층)에 줄 몸 값(B) — 바이블 §3.9 자리 */
/* (r17 face · 정범님 10/30 '대부분 캐릭터가 처음부터 혹은 특정 액션 후 눈을 감은 채로 있어') 가만히 눈의 벌어짐 바닥
 *  재 보니(PC 1920×1080 · dpr 1.25 · 기본 크기) 모리(여우 눈) 열린 눈 높이/폭 0.32 · 보이는 홍채 54% · 만복(무거운 눈꺼풀) 0.32 · 42% · 다누(졸린 눈) 54% · 옥순 60% · 서윤 63% — 머리 60px 화면에서 눈 높이 2px = 감은 눈으로 읽힘
 *  바닥: 높이/폭 ≥ hw(0.46 · 아니메 설정표 어른 남 실눈 쪽 끝) · 위 눈꺼풀 덮임 ≤ cMax(0.3 · 보이는 홍채 ≥ 약 70%) — 눈 종류(모양·기울기·속눈썹)는 그대로, 높이만 키움 · 표정(실눈·졸림·감음)은 이 위에 그대로 */
const MSC2_EYEOPEN = { hw: 0.5, cMax: 0.3 };
function msc2EyeOpenK(ET, r) { if (!ET || !ET.up || !ET.lo) return 1; const up = Math.min(...ET.up.map((q) => q[1])), lo = Math.max(...ET.lo.map((q) => q[1])); const hw = r * (lo - up) / 2; return hw > 0 && hw < MSC2_EYEOPEN.hw ? MSC2_EYEOPEN.hw / hw : 1; }
function msc2FB(o, D, M, y0c) { const u = M.u, hw = o.hw / 2; const ET = mscEyeT(D); const e = (D.ey || {}); const fm = o.sex === 'f'; const eR = o.eyY + (((D.face || {}).fh) || 0);
  const B = { H: u, crown: y0c, chin: y0c + u, fw: hw * u, kid: o.kid, sex: o.sex, old: o.old, eR, sd: 0, stoop: 0, pxH: msc2FB.px || 40, v2: 1, ok: o.k, lidC: { kf: 0.1, km: 0.1, tf: 0.15, tm: 0.17, af: 0.2, am: 0.24, mf: 0.25, mm: 0.28, of: 0.36, om: 0.36 }[o.k] || 0.2 /* (감사 STYLE 4 '어른 남자 눈이 가늘고 반쯤 감겨 졸려 보임') 남 0.30→0.24 · 중년 남 0.33→0.28 */ }; /* (15차f E3) 나이·성별 눈꺼풀 덮임 */ /* pxH = 화면에서 1H가 몇 px(눈 LOD · E6·E9) */ B.vm = (v) => (v <= 0.3 || v >= 1 ? v : v <= 0.6 ? 0.3 + ((v - 0.3) * (eR - 0.3)) / 0.3 : eR + ((v - 0.6) * (1 - eR)) / 0.4);
  B.eyeY = y0c + eR * u; B.ew = ((o.eyW * o.hw) / 2) * u * 1.12 * (o.kid ? 1 : o.old ? 1.05 : o.sex === 'f' ? 1.18 : 1.12) * (ET.wk || 1) * (o.kid && typeof msc2T === 'function' ? msc2T('eyeKid') : 1); /* (15m) 꼬마 눈 크기 설정 */ B.eh = B.ew * ET.hk * (ET.open || 1) * (!o.kid && !o.old && o.sex === 'f' ? 1.14 : !o.kid && !o.old ? 1.2 : o.old ? 1.06 : 1); B.eh *= msc2EyeOpenK(ET, B.eh / B.ew); /* (r17 face) 눈 벌어짐 바닥 — 가만히 있을 때 눈 높이/폭이 MSC2_EYEOPEN.hw 아래면 높이를 키움(눈 종류의 모양·기울기는 그대로) */ /* (fix_face) 청소년·어른 눈 = 설정표 아니메 눈(눈 폭 ×1.1 · 여 높이 ×1.1) — 예전 값은 얼굴 크기에 비해 작고 가늘어 '사진 같은 무표정'(정범님 '아니메 매력') */ B.ex = B.ew * (1 + (o.eyG || 1)) * (e.gapK || 1); /* 눈 사이 = 눈 폭 × eyG(바이블 §3.9) */
  B.noseY = y0c + o.noY * u; B.mY = y0c + o.moY * u; B.nb = B.chin + 0.22 * u; return B; }
/* 귀(바이블 03 §3.4 · 80f603d1·3ef83b8c · 7f56ba2b): 위 = 윗눈꺼풀 높이 · 귓불 = 코 밑 높이 · 턱 모서리 뒤 옆면
 *  (fix_face · 정범님 10/30 '귀가 머리 윤곽과 따로 노는 판') 예전 = 길쭉한 살색 판(사방 굵은 선 · 안쪽 결 옅음) → 얼굴 옆에 붙인 조각처럼 보임
 *  지금 = 위가 넓은 C(귓바퀴)가 얼굴 윤곽 '뒤'에서 나와 귓불로 말려 들어감(붙는 쪽 선 없음 · 얼굴 덮개 선이 귀 뿌리를 지나감) · 안쪽 오목(귓구멍 쪽)은 피부 1号影 면 · 맞은귓바퀴 곡선 하나(색 선) — 셀 2단으로 '머리 옆면에 붙은 귀'로 읽힘 */
function msc2Ears(o, half, hx, hy, sk, ln, skS) { const at = (y) => { for (let i = 1; i < half.length; i++) if (half[i][1] >= y) { const a = half[i - 1], b = half[i]; return msc2L(a[0], b[0], (y - a[1]) / (b[1] - a[1] || 1)); } return half[half.length - 1][0]; };
  const y0 = o.eyY - (o.kid ? 0.03 : 0.055), y1 = o.noY + (o.old ? 0.04 : 0.0), hg = y1 - y0; const w = o.kid ? 0.058 : o.old ? 0.066 : 0.06; const lw = MSC2_LW * 0.62;
  return [-1, 1].map((s) => { const P = (x, y) => msc2Q([hx(s * x), hy(y)]); const e = (y) => at(y) - 0.012; /* 귀 뿌리 = 얼굴 윤곽 조금 안쪽(덮개 선 뒤) */
    const xa = e(y0 + 0.02), xb = e(y1 - 0.02), xm = e(y0 + hg * 0.5);
    const d = `M${P(xa - 0.006, y0 + 0.03)}C${P(xa + w * 0.25, y0 - 0.03)} ${P(xa + w * 0.95, y0 - 0.025)} ${P(xa + w * 1.02, y0 + hg * 0.2)}C${P(xa + w * 1.06, y0 + hg * 0.42)} ${P(xm + w * 0.78, y0 + hg * 0.62)} ${P(xm + w * 0.62, y0 + hg * 0.78)}C${P(xb + w * 0.52, y1 - 0.01)} ${P(xb + w * 0.22, y1 + 0.012)} ${P(xb - 0.004, y1 - 0.025)}Z`;
    const ins = `M${P(xa + w * 0.08, y0 + hg * 0.22)}C${P(xa + w * 0.5, y0 + hg * 0.08)} ${P(xa + w * 0.72, y0 + hg * 0.25)} ${P(xm + w * 0.52, y0 + hg * 0.5)}C${P(xm + w * 0.42, y0 + hg * 0.66)} ${P(xb + w * 0.25, y0 + hg * 0.74)} ${P(xb + 0.002, y0 + hg * 0.72)}Z`; /* 안쪽 오목 그늘 */
    const ah = `M${P(xa + w * 0.28, y0 + hg * 0.12)}C${P(xa + w * 0.72, y0 + hg * 0.06)} ${P(xa + w * 0.86, y0 + hg * 0.3)} ${P(xm + w * 0.64, y0 + hg * 0.56)}`; /* 귓바퀴 안쪽 테 */
    
    return `<g class="m2-ear m2-ear${s < 0 ? 'L' : 'R'}"><path d="${d}" fill="${sk}" stroke="${ln}" stroke-width="${mscF(lw)}" stroke-linejoin="round"/><path d="${ins}" fill="${skS}"/><path d="${ah}" fill="none" stroke="${ln}" stroke-width="${mscF(lw * 0.7)}" stroke-linecap="round" opacity=".75"/></g>`; /* 안쪽 = 오목 그늘 면 + 귓바퀴 테 선(얼굴과 같은 선 색) — 작은 화면에서도 귀로 읽힘 */ }).join(''); }
/* (fix_face · 감사 S-13 · 정범님 v1 영상 40초 '입이 검은 네모 + 살색 네모 조각') 외치는 입(m-sh)이 예전 판 그대로 = 곧은 사다리꼴 검은 판 + 곧은 흰 띠 → 작은 화면에서 네모 조각 둘로 보임
 *  v2 = 아니메 외침 입: 위는 양끝이 올라간 완만한 호 · 아래는 깊고 둥근 U · 윗니는 위 호를 따라 휜 띠(입 안에서 잘림) · 혀 = 아래 둥근 덩어리 · 선은 입 둘레 하나 */
function msc2MouthSh(B, C) { const k = (B.fw / 9.3) * (B.kid ? 0.92 : 1), mx = 50, my = B.mY; const M = (x, y) => mscP(mx + x * k, my + y * k); const ln = C.mline || '#5E2A30', lw = mscF(0.36 * k + 0.08);
  const o = `M${M(-1.9, -0.4)}Q${M(0, -0.65)} ${M(1.9, -0.4)}C${M(1.75, 1.2)} ${M(0.95, 2.6)} ${M(0, 2.6)}C${M(-0.95, 2.6)} ${M(-1.75, 1.2)} ${M(-1.9, -0.4)}Z`; /* 윗니 = 위 호와 그 아래 얕은 호 사이(입 안에만 · 자르기 없이) · 혀 = 아래 둥근 덩어리 */
  return `<g class="m-sh"><path d="${o}" fill="#7A2836" stroke="${ln}" stroke-width="${lw}" stroke-linejoin="round"/><path d="M${M(-1.7, -0.31)}Q${M(0, -0.55)} ${M(1.7, -0.31)}Q${M(0, 0.02)} ${M(-1.7, -0.31)}Z" fill="#FFFDF8"/><ellipse cx="${mscF(mx)}" cy="${mscF(my + 2.0 * k)}" rx="${mscF(0.95 * k)}" ry="${mscF(0.45 * k)}" fill="#E4848E"/></g>`; }
/* (15차f) 표정 입(v2) — 바이블 §3.5 · a94c3e98: 여자 웃는 열린 입 = '카레빵' 렌즈(양끝 뾰족 · 윗입술이 위로 둥글게 부풂 · 아래는 더 깊게) · 남자 = 위가 납작하고 넓게(아랫니 띠)
 *  이·혀는 단순하게: 윗니 = 위 가장자리를 따라 흰 띠 하나(이 사이 선 없음) · 혀 = 아래 밝은 덩어리 하나(가운데 선 없음) · 입 아래 그늘 한 줄 */
function msc2XMouth(B, C, t) { const L = { open: [1.55, 0.5, 1.9, 0, 1], grinO: [2.0, 0.55, 2.5, 1, 1], laugh: [2.5, 0.7, 3.5, 1, 1], kira: [2.2, 0.45, 1.6, 1, 0], catO: [1.4, 0.55, 2.0, 0, 1] }[t]; if (!L) return null;
  const m = B.sex === 'm' && !B.kid; const k = (B.fw / 9.3) * (B.kid ? 0.92 : 1) * 1.12, mx = 50, my = B.mY; const M = (x, y) => mscP(mx + x * k, my + y * k); const ln = C.mline || '#5E2A30', lw = mscF(0.36 * k + 0.08); let [w, up, dn, teeth, tongue] = L; if (m) { w *= 1.12; up *= 0.35; dn *= 0.85; }
  const lc = -0.35 - up * 0.3; /* 입꼬리(웃음 = 올라감) */ const outD = `M${M(-w, lc)}C${M(-w * 0.55, lc - up * 1.25)} ${M(w * 0.55, lc - up * 1.25)} ${M(w, lc)}C${M(w * 0.62, dn)} ${M(-w * 0.62, dn)} ${M(-w, lc)}Z`; const id = `${C.p || 'm'}-xl${t}`;
  let s = `<clipPath id="${id}"><path d="${outD}"/></clipPath><path d="${outD}" fill="#7A2836"/><g clip-path="url(#${id})"><path d="M${M(-w, lc - up - 0.2)}C${M(-w * 0.5, lc - up * 1.3 + 0.75)} ${M(w * 0.5, lc - up * 1.3 + 0.75)} ${M(w, lc - up - 0.2)}L${M(w, lc - 2)}L${M(-w, lc - 2)}Z" fill="#5A1A26" opacity=".55"/>`;
  if (teeth) s += `<path d="M${M(-w, lc - 0.05)}C${M(-w * 0.55, lc - up * 1.25)} ${M(w * 0.55, lc - up * 1.25)} ${M(w, lc - 0.05)}L${M(w, lc + 0.25)}C${M(w * 0.55, lc - up * 0.9 + 0.75)} ${M(-w * 0.55, lc - up * 0.9 + 0.75)} ${M(-w, lc + 0.25)}Z" fill="#FFFDF8"/>`;
  if (m && teeth) s += `<path d="M${M(-w * 0.8, dn * 0.78)}C${M(-w * 0.3, dn * 0.68)} ${M(w * 0.3, dn * 0.68)} ${M(w * 0.8, dn * 0.78)}L${M(w * 0.8, dn + 1)}L${M(-w * 0.8, dn + 1)}Z" fill="#FFFDF8" opacity=".95"/>`; /* 남자 = 아랫니 띠 */
  if (tongue) s += `<ellipse cx="${mscF(mx)}" cy="${mscF(my + (dn * 0.78) * k)}" rx="${mscF(w * 0.58 * k)}" ry="${mscF(dn * 0.34 * k)}" fill="#E4848E"/>`;
  s += `</g><path d="${outD}" fill="none" stroke="${ln}" stroke-width="${lw}" stroke-linejoin="round"/>`;
  s += mscPs(`M${M(-w * 0.35, dn * 0.62 + 0.75)}Q${M(0, dn * 0.62 + 1.15)} ${M(w * 0.35, dn * 0.62 + 0.75)}Q${M(0, dn * 0.62 + 0.95)} ${M(-w * 0.35, dn * 0.62 + 0.75)}Z`, mscSkS(C.skin), 0.7); /* 아랫입술 아래 그늘 */
  return `<g class="m2-xmo" data-mo="${t}">${s}</g>`; }

