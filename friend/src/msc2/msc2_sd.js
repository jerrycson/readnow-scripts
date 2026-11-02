/* ══════════ 🐾 v2 꼬마(SD · 치비) 몸 — 15차e (바이블 §10.1 · 계획 M8) ══════════
 *  2 / 2.5 / 3 / 3.5 / 4등신 프리셋(7b3a86f9 · 0f4f0fcf · f6d66582 · 96dfe001 · 04a45838 · e6bd830d · b078d6db)
 *  · 머리 = 공(얼굴형 round · 이목구비가 낮게 · 눈 0.62~0.64) · 짧고 통통한 팔다리(끝이 거의 안 가늘어짐) · 2~2.5등신 = 벙어리장갑 손 · 작은 발
 *  · 몸통:다리 = 0.5:0.5(2) · 0.75:0.75(2.5) · 1:1(3) · 1.1:1.4(3.5) · 1.3:1.7(4) · 목 = 없음 → 0.08(3) → 0.15(3.5)
 *  · 정범님 규칙(e6bd830d): 2등신은 손이 정수리에 닿지 않음 — 팔 길이 = 어깨 관절에서 샅까지(매단 손 = 샅 · 바이블 §10.1) → 들어 올려도 관자·귀 높이에서 멈춤(시험 tR15e)
 *  · 체형 3가지: 배(pear: 아래가 넓고 배가 나옴) · 날씬(slim) · 역삼각(tri: 어깨가 넓고 엉덩이가 좁음)
 *  · 객체 열쇠 'ks<등신×10><f|m>[-동물]' — 첫 글자 k = 꼬마 규칙(자세 가중치 · 숨 2.2초)을 그대로 받음 */
const MSC2_SDH = [2, 2.5, 3, 3.5, 4];
/* (15m · 정범님 10/29 13:58 '등신 설정이 그림에 반영 안 됨') 2~4등신 사이는 표를 이어서 읽음 — 예전엔 가장 가까운 칸으로 잘라 슬라이더 값을 바꿔도 그림이 그대로였음 */
const sdIp = (arr, hc) => { const H = MSC2_SDH, n = H.length; if (!(hc > H[0])) return arr[0]; if (hc >= H[n - 1]) return arr[n - 1]; let j = 0; while (hc > H[j + 1]) j++; const t = (hc - H[j]) / (H[j + 1] - H[j]); return arr[j] + (arr[j + 1] - arr[j]) * t; };
const MSC2_SDT = { pear: { n: '배 모양(아래가 통통)', sh: 0.9, wa: 1.12, hp: 1.06, th: 1.2, belly: 0.7 }, slim: { n: '날씬', sh: 0.9, wa: 0.84, hp: 0.86, th: 0.82, belly: 0 }, tri: { n: '역삼각(어깨가 넓음)', sh: 1.3, wa: 0.92, hp: 0.84, th: 0.92, belly: 0.1 } };
/* 동물·로봇·외계인 몸 조정(774d99e5 '좁은 어깨 · 짧은 위팔 · 긴 등 · 팔이 앞으로' — 가볍게) · 얼굴 자리(코 패드가 눈에 가깝고 입이 주둥이 위) */
const MSC2_CRK = { tanuki: { sh: 0.9, hw: 1.04, noY: -0.035, moY: -0.035, sdt: 'pear' }, bear: { sh: 0.92, hw: 1.08, noY: -0.03, moY: -0.03, sdt: 'pear' }, rabbit: { sh: 0.9, hw: 1.0, noY: -0.03, moY: -0.035, sdt: 'slim' }, tiger: { sh: 0.95, hw: 1.04, noY: -0.03, moY: -0.03, sdt: 'tri' }, wolf: { sh: 0.92, hw: 1.0, noY: -0.04, moY: -0.035, sdt: 'tri' },
  robot: { sh: 1.0, hw: 1.04, noY: 0.0, moY: 0.0, sdt: 'tri', mit: 1 }, alien: { sh: 0.86, hw: 1.15, eyY: 0.04, eyH: 1.18, eyW: 1.15, noY: 0.03, moY: 0.025, nk: 0.55, sdt: 'pear' } };
function msc2SdBuild(hc, sex, ani, sdt) { const i = (Math.max(2, Math.min(4, hc)) - 2) / 0.5; /* 칸 번호 대신 이어진 위치(0~4) */ const A = MSC2_CRK[ani] || {}; const T = MSC2_SDT[sdt || A.sdt || 'slim'] || MSC2_SDT.slim; const kf = MSC2_OBJ.kf;
  const tor = sdIp([0.5, 0.75, 1.0, 1.1, 1.175], hc) /* (P1 · 등신 한 식) 4등신 끝값 1.3 → 1.175 = 꼬마 객체(4등신 · 샅 2.25 = 56% · 07 §7.1 '샅 56%')와 같은 몸 — 기기 설정 4등신과 캐릭터 기본 4등신이 같은 그림 */, nk = msc2NeckN(hc, 0.27); /* (P1 · 12 §12.3 버림: 등신별 목 길이 예외표 [0 .03 .08 .15 .12]) → 02 §2.6 n(HC) 한 식 · 외계인도 같은 길이(가는 목은 폭으로) */ const sn = 1 + nk, cr = 1 + nk * 0.5 + tor, so = hc; const B = cr - sn, L = so - cr;
  const sw = sdIp([0.56, 0.63, 0.73, 0.88, 1.0], hc), lw = sdIp([0.74, 0.78, 0.84, 0.91, 1.0], hc); const hw = sdIp([1.06, 1.04, 1.0, 0.97, 0.94], hc) * (A.hw || 1);
  const o = { k: `ks${Math.round(hc * 10)}${sex}${ani ? '-' + ani : ''}`, sex, kid: true, old: false, sd: hc, sdt: sdt || A.sdt || 'slim', ani: ani || '', mit: hc <= 2.5 || !!A.mit, hc: so, hw,
    sn, sh: sn + 0.04 + 0.04 * tor, bust: sn + 0.3 * B, rib: sn + 0.45 * B, wa: sn + 0.58 * B, nav: sn + 0.66 * B, il: sn + 0.72 * B, tro: sn + 0.84 * B, cr, kn: cr + 0.47 * L, an: so - 0.09 * L - 0.015, so,
    nkW: sdIp([0.2, 0.22, 0.24, 0.26, 0.28], hc) * (A.nk ? 0.7 : 1), shW: kf.shW * sw * T.sh * (A.sh || 1), chW: kf.chW * sw * T.sh * (A.sh || 1) * 0.98, waW: kf.waW * sw * T.wa, hpW: kf.hpW * sw * T.hp, thW: kf.thW * lw * T.th, knW: kf.knW * lw * T.th, caW: kf.caW * lw * T.th, anW: kf.anW * lw,
    hand: sdIp([0.15, 0.19, 0.23, 0.3, 0.36], hc), foot: sdIp([0.32, 0.38, 0.44, 0.52, 0.6], hc),
    eyY: sdIp([0.64, 0.635, 0.62, 0.61, 0.62], hc) + (A.eyY || 0), eyH: sdIp([0.24, 0.23, 0.22, 0.21, 0.2], hc) * (A.eyH || 1), eyW: sdIp([0.27, 0.27, 0.265, 0.255, 0.25], hc) * (A.eyW || 1), eyG: 1.22, noY: sdIp([0.775, 0.77, 0.76, 0.75, 0.74], hc) + (A.noY || 0), moY: sdIp([0.875, 0.87, 0.86, 0.85, 0.84], hc) + (A.moY || 0), chinW: 0.42, sdBelly: T.belly };
  /* 팔: 어깨 관절(sh + 0.10 · msc2Solve)에서 샅까지 + 조금(편한 팔 굽음) — 위팔 : 아래팔 = 0.54 : 0.46 · 동물은 위팔이 조금 짧음 */ const arm = Math.max(0.2, cr - (o.sh + 0.1) + 0.02 + 0.03 * i); const ur = ani && !/robot|alien/.test(ani) ? 0.5 : 0.54; o.ua = arm * ur; o.fa = arm * (1 - ur); return o; }
/* 미리 만들어 MSC2_OBJ에 올림(5 등신 × 2 성별 × 8 종류 = 80개 · 체형은 고를 때 따로) */
const MSC2_SDANI = ['', 'tanuki', 'bear', 'rabbit', 'tiger', 'wolf', 'robot', 'alien'];
MSC2_SDH.forEach((hc) => ['f', 'm'].forEach((sx) => MSC2_SDANI.forEach((a) => { const o = msc2SdBuild(hc, sx, a); MSC2_OBJ[o.k] = o; })));
/* ── 이 기기 설정(정범님 '설정은 기기마다'): 꼬마 등신 · 꼬마 체형 ── 'auto' = 동물·로봇·외계인 3등신(캐릭터 기본 체형) · 꼬마 사람(아롱·토리)은 4등신 꼬마 그대로 */
const MSC2_SDSET = { hc: [['auto', '자동'], ['20', '2'], ['25', '2.5'], ['30', '3'], ['35', '3.5'], ['40', '4']], t: [['auto', '캐릭터마다'], ['pear', '배 모양'], ['slim', '날씬'], ['tri', '역삼각']] };
const msc2SdGet = (k, d) => { try { return localStorage.getItem('rn-msc-sd' + k) || d; } catch (e) { return d; } };
const MSC2_SDC = new Map();
/* 객체 바꾸기(msc2ObjMod 첫머리 훅) — null = 그대로 */
function msc2SdMod(o, bd) { bd = bd || {}; const set = msc2SdGet('hc', 'auto'); /* (15m) 캐릭터 개별 머리:키(bd.hr)가 있으면 기기 설정보다 우선 — 예전엔 기기 설정이 켜지면 개별 슬라이더가 무시됨 */ let hc = +bd.hr > 0 ? +bd.hr : (+bd.sdhc || (set !== 'auto' ? +set / 10 : 0)); if (!o.sd && !hc) return null; /* 꼬마 사람 + 자동 = 예전 4등신 꼬마 */
  if (!hc) hc = o.sd; if (hc > 4.001) return null; /* 4등신 넘음 = 예전 꼬마 몸(msc2ObjMod의 hr 경로가 맡음) */ hc = Math.max(2, Math.round(hc * 20) / 20); const st = bd.sdt || (msc2SdGet('t', 'auto') !== 'auto' ? msc2SdGet('t', 'auto') : '') || o.sdt || (MSC2_CRK[o.ani] || {}).sdt || 'slim';
  const key = `${hc}|${o.sex}|${o.ani || ''}|${st}`; let r = MSC2_SDC.get(key); if (!r) { r = msc2SdBuild(hc, o.sex, o.ani || '', st); MSC2_SDC.set(key, r); } return r; }
/* 팔다리 굵기(msc2Widths 끝 훅): 짧고 통통 — 끝(손목·발목)이 거의 안 가늘어짐(0f4f0fcf ① 관절형 · '끝이 통통') · 배가 살짝 나옴(배 모양) */
function msc2SdW(o, S, W) { W.ua = sdIp([0.062, 0.07, 0.08, 0.092, 0.105], o.sd || 3) * (o.ani === 'robot' ? 1.12 : 1); W.fa = W.ua * 0.95; W.wr = W.ua * 0.78; W.nk = (o.nkW / 2); W.kn = Math.max(W.kn, W.thT * 0.42); W.an = Math.max(W.an, W.kn * 0.82); W.belly = Math.max(W.belly || 0, o.sdBelly || 0); }
/* 표 자세(어른·꼬마 몸 기준 손목 목표 H)를 꼬마 몸 이정표로 옮김(msc2Solve 첫머리 훅) — 얼굴 높이(≤1.15H) 목표는 머리가 같은 1H라 그대로(2등신은 닿지 않아 IK가 멈춤 = 규칙) */
const MSC2_SDPC = new WeakMap();
function msc2SdPose(o, P) { let m = MSC2_SDPC.get(P); if (!m) { m = new Map(); MSC2_SDPC.set(P, m); } let r = m.get(o.k + o.sdt); if (r) return r; const ref = P.n === (MSC2_POSES.kbk || {}).n || P.n === (MSC2_POSES.hipB || {}).n ? MSC2_OBJ.kf : MSC2_OBJ.af;
  const Ly = [0, 1, ref.sn, ref.bust, ref.wa, ref.cr, ref.kn, ref.so], Ty = [0, 1, o.sn, o.bust, o.wa, o.cr, o.kn, o.so]; const my = (y) => { if (y <= 1) return y; for (let j = 1; j < Ly.length; j++) if (y <= Ly[j]) return msc2L(Ty[j - 1], Ty[j], (y - Ly[j - 1]) / (Ly[j] - Ly[j - 1])); return o.so; };
  const kx = o.shW / ref.shW, kh = o.hw / ref.hw; const arms = {}; ['L', 'R'].forEach((S) => { const a = (P.arms || {})[S]; if (a && a.k === 'ik' && Array.isArray(a.t)) { const [x, y, z] = a.t; const k = y <= 1.15 ? kh : kx; arms[S] = { ...a, t: [x * k, my(y), z * Math.min(1, kx * 1.15)] }; } else arms[S] = a; });
  const kst = Math.max(0.5, Math.min(1, o.hpW / MSC2_OBJ.kf.hpW)); /* 발 사이도 몸 폭만큼(2등신 = 다리가 몸 아래로 · 96dfe001) */ r = { ...P, arms, lean: (P.lean || 0) * 0.7, stance: (P.stance || 1) * kst, hd: (P.hd || 0) * 0.6, n: undefined }; m.set(o.k + o.sdt, r); return r; }
/* 손이 닿는 가장 높은 곳(정수리 0 · 시험) — 어깨 관절에서 위팔+아래팔+손 길이를 곧게 위로 */
function msc2SdReach(o) { const W = msc2Widths(o, msc2Shape(o, {})); const sk = msc2Solve(o, W, MSC2_POSES.at); const sh = sk.J.shR; return { top: sh[1] - (o.ua + o.fa + o.hand), sh: sh[1] }; }
/* 넓은 화면: 꼬마 몸만큼 확대(머리 위 귀·더듬이 자리 0.8H) — 칸 비율 1:2 그대로 */
if (typeof msc2View === 'function') { const v0 = msc2View; msc2View = function (R, v) { const o = R && R.o; if (o && o.sd && (!v || v === 'full')) { const h = (o.so + (o.ani === 'rabbit' ? 1.3 : 0.95)) * R.M.u * 1.08; return [50 - h / 4, MSC2_SOLE + 4 - h, h / 2, h]; } return v0(R, v); }; }
/* 설정 줄(⚙ 그림 줄 아래) */
function msc2SdHtml() { const a = msc2SdGet('hc', 'auto'), b = msc2SdGet('t', 'auto'); const row = (k, L, cur, tip) => `<div class="row"><b>${k === 'hc' ? '꼬마 등신' : '꼬마 체형'}</b> ${L.map(([v, l]) => `<button type="button" class="btn ghost sm msc-st ${cur === v ? 'on' : ''}" data-msd="${k}" data-v="${v}" title="${esc(tip)} — 바로 적용 · 이 기기에만 저장">${esc(l)}</button>`).join('')}</div>`;
  return row('hc', MSC2_SDSET.hc, a, '동물·로봇·외계인 친구와 꼬마 사람의 머리:몸 비율(자동 = 동물 친구 3등신 · 꼬마 사람은 4등신 그대로)') + row('t', MSC2_SDSET.t, b, '꼬마(SD) 몸 모양 — 캐릭터마다 = 곰·너구리 배 모양 · 토끼·사람 날씬 · 호랑이·늑대·로봇 역삼각'); }
if (typeof document !== 'undefined' && !window.__msc2SdBound) { window.__msc2SdBound = 1; document.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('[data-msd]'); if (!b) return; const k = b.dataset.msd, v = b.dataset.v; try { localStorage.setItem('rn-msc-sd' + k, v); } catch (e) {} b.parentNode.querySelectorAll('[data-msd]').forEach((x) => x.classList.toggle('on', x === b)); MSC2_SDC.clear(); const c = document.getElementById('msc_ch'); if (c) c.dataset.sig = ''; try { mscApply(); } catch (e) {} try { toast('🐾 ' + (k === 'hc' ? '꼬마 등신' : '꼬마 체형') + ': ' + b.textContent + ' — 이 기기에 저장했어요'); } catch (e) {} }); }

