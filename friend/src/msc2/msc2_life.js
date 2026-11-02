/* ══════════ 🐾 v2 살아 있는 몸 — 15차h (바이블 §9.2~9.3 · §11.1~11.6 · 웹 노트 §1-2~1-8 · Live2D 기본 흔들림) ══════════
 *  ① 서는 자세 바꾸기 = '발 디딤 계획'(디딘 발은 절대 미끄러지지 않음): 옮겨야 하는 발은 무게가 없을 때만 들어서 호를 그리며 옮김 → 무게 옮김(두 발 붙인 채 골반·가슴·고개 차례로) → 남은 발 옮김
 *  ② 쉬는 동안: 작은 무게 옮김(6~15초마다 · 발은 제자리) · 몸 흔들림(15.5초) · 고개 흔들림(6.5/3.5/5.5초 사인 + 주파수가 천천히 떠도는 잡음 → 되풀이 안 보임) · 숨(들숨 40% · 날숨 60% · 끝에 쉼)
 *  ③ 성격마다 빠르기(tempo)·크기·버릇(가중치) · 깜박임 = 상태별(쉼 4.3초 · 말 3초 · 읽기 8초) + 큰 시선 이동 때 · 두 번 깜박 15%
 *  ④ 몸짓 다듬기(msc2ActP): 예비 동작이 없는 몸짓은 주된 채널에 반대 방향 예비(본 동작의 12%) · 끝은 살짝 지나쳤다 정착 — 원래 표는 그대로(예전 그림 엔진은 안 바뀜) */
const MSC2_LIFE = {
  kf: { tp: 1.25, am: 1.15, br: 2.2, bl: 5.2, hold: [7, 16], ms: [4, 10], hab: [8, 16], H: { heels: 3, hop: 2, hairtuck: 1.5, lookaround: 1.5, humnote: 2, smallwave: 1.5, tilt: 2, giggle: 1.5, peek: 1 } },
  km: { tp: 1.45, am: 1.25, br: 2.2, bl: 5.2, hold: [6, 14], ms: [4, 9], hab: [7, 14], H: { hop: 3, fistpump: 2, foottap: 2, lookaround: 2, dance: 1.5, stretchup: 1.5, thumbsup: 1.5, scratch: 1 } },
  tf: { tp: 1.1, am: 1.05, br: 3.8, bl: 4.9, hold: [9, 22], ms: [6, 13], hab: [9, 18], H: { hairtuck: 3, sleeve: 2, humnote: 2, tilt: 1.5, lookaround: 1.5, smallwave: 1.2, heels: 1, giggle: 1 } },
  tm: { tp: 0.85, am: 0.9, br: 3.8, bl: 4.6, hold: [10, 26], ms: [7, 15], hab: [10, 22], H: { necks: 2.5, lookaround: 2.5, scratch: 2, shoulderroll: 1.5, foottap: 1.5, yawnstretch: 1, glance: 1.5 } },
  af: { tp: 0.95, am: 1, br: 3.4, bl: 4.5, hold: [10, 26], ms: [6, 15], hab: [10, 22], H: { hairtuck: 2.5, pageturn: 2.5, bookflip: 2, humnote: 1.5, lookaround: 1.2, sleeve: 1, tilt: 1 }, G: { push: 2, cleang: 1 } },
  am: { tp: 0.9, am: 0.95, br: 3.4, bl: 4.6, hold: [10, 28], ms: [7, 15], hab: [11, 24], H: { sleeve: 2, shoulderroll: 2, watch: 2, necks: 1.5, lookaround: 1.5, chinrest: 1.5, crossarms: 1 }, G: { push: 1.5, cleang: 1 } },
  mf: { tp: 0.9, am: 0.9, br: 3.5, bl: 4.6, hold: [12, 30], ms: [7, 15], hab: [11, 24], H: { nodsmile: 2.5, dust: 2, humnote: 2, sipcup: 1.5, lookaround: 1.5, tilt: 1 }, G: { push: 1.5 } },
  mm: { tp: 0.85, am: 0.85, br: 3.5, bl: 4.8, hold: [12, 30], ms: [8, 16], hab: [12, 26], H: { watch: 2.5, stretchup: 1.5, shoulderroll: 1.5, necks: 1.5, lookaround: 1.5, crossarms: 1 }, G: { push: 2, cleang: 1.5 } },
  of: { tp: 0.65, am: 0.7, br: 3.6, bl: 5.3, hold: [16, 40], ms: [9, 18], hab: [14, 30], H: { nodsmile: 2, nodoff: 1.5, lookaround: 1, humnote: 1.5, sipcup: 1.5, dust: 1 }, G: { push: 1.5 } },
  om: { tp: 0.65, am: 0.7, br: 3.6, bl: 5.3, hold: [16, 40], ms: [9, 18], hab: [14, 30], H: { lookup: 1.5, nodoff: 1.5, necks: 1.5, watch: 1, lookaround: 1.5, nodsmile: 1.5 }, G: { push: 1.5, cleang: 1 } } };
const MSC2_LIFE_ID = { n_mori: { tp: 0.8, H: { necks: 2, lookaround: 2.5, scratch: 1.5, foottap: 2, glance: 2, fingergun: 1 } }, n_daon: { tp: 1.2, H: { hairtuck: 2.5, giggle: 2, smallwave: 2, heels: 2, humnote: 2, tilt: 1.5 } }, n_dodam: { tp: 1.5, am: 1.3 } };
/* 결정적 난수(시험·영상이 같은 결과를 원하면 window.MSC2_SEED) */
function msc2Rnd(seed) { let s = (seed >>> 0) || 0x9e3779b9; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const msc2Io = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - Math.cos(Math.PI * u) / 2); /* 바이블 §11.3 pose-to-pose ≈ cubic-bezier(.45,0,.55,1) */
const msc2Cl01 = (u) => Math.max(0, Math.min(1, u));
/* 방향(단위 벡터) 구면 보간 — 0..1 밖(예비·지나침)도 큰 원을 따라 늘림 · 거의 반대면 bias 쪽 중간 방향을 거쳐 돎(팔꿈치 뒤집힘 X) */
function msc2Slp(p, q, e) { const V3 = msc2V; const d = Math.max(-1, Math.min(1, V3.dot(p, q))); const a = Math.acos(d); if (a < 1e-4) return p; const sa = Math.sin(a); return V3.add(V3.mul(p, Math.sin((1 - e) * a) / sa), V3.mul(q, Math.sin(e * a) / sa)); }
function msc2Nl(p, q, e, bias) { const V3 = msc2V; if (V3.dot(p, q) > -0.2) return V3.norm(msc2Slp(p, q, e)); const m = V3.norm(V3.add(V3.mul(V3.add(p, q), 0.5), V3.norm(V3.sub(bias, V3.mul(p, V3.dot(bias, p)))))); return V3.norm(e < 0.5 ? msc2Slp(p, m, e * 2) : msc2Slp(m, q, e * 2 - 1)); }
function msc2LifeOf(X) { const k = X.k in MSC2_LIFE ? X.k : (X.o && X.o.kid ? 'kf' : 'af'); const a = MSC2_LIFE[k], b = MSC2_LIFE_ID[X.id] || {}; const L = { ...a, ...b, H: { ...(b.H || a.H) } };
  let gl = false; try { gl = mscAccList(X.D, 'face').concat(mscAccList(X.D, 'head')).some(([n]) => MSC_GLASS.has(n)); } catch (e) {} if (gl && a.G) Object.assign(L.H, a.G); /* 안경 쓴 캐릭터만 안경 버릇 */
  if (X.fit && !(X.fit.bottom && /^(pants|shorts)$/.test(X.fit.bottom.t))) delete L.H.foottap; Object.keys(L.H).forEach((k2) => { if (!mscActOf(k2)) delete L.H[k2]; }); return L; }
/* ── 쉬는 동안 신호(잡음) — 오른슈타인-울렌벡(상관 시간 tau · 분산 1) ── */
function msc2Ou(st, dt, tau, rnd) { const g = Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd()); st.v += (-st.v / tau) * dt + Math.sqrt((2 * dt) / tau) * g; return st.v; }
function msc2LifeInit(R) { const V = R.v2; if (!V || V.life) return; const X = V.X; const seed = typeof window !== 'undefined' && window.MSC2_SEED != null ? window.MSC2_SEED + (R.p || '').length * 7919 : Math.floor(Math.random() * 4e9); const rnd = msc2Rnd(seed);
  const L = msc2LifeOf(X); const ph = () => rnd() * Math.PI * 2;
  V.life = { L, rnd, t: 0, sn: [{ p: 6.5, a: 3.75, ph: ph(), f: { v: 0 } }, { p: 3.5, a: 2.0, ph: ph(), f: { v: 0 } }, { p: 5.5, a: 2.5, ph: ph(), f: { v: 0 } }, { p: 15.5, a: 1, ph: ph(), f: { v: 0 } }, { p: 10.3, a: 1.6, ph: ph(), f: { v: 0 } }, { p: 7.7, a: 1.0, ph: ph(), f: { v: 0 } }, { p: 13.1, a: 1.2, ph: ph(), f: { v: 0 } }] /* 0~3 = Live2D 기본(AngleX 6.5 · Y 3.5 · Z 5.5 · 몸 15.5초) · 4~6 = 서로 배수 아닌 둘째 주기(되풀이 안 보이게) */, nA: [{ v: 0 }, { v: 0 }, { v: 0 }], nY: { v: 0 }, nP: { v: 0 }, nR: { v: 0 }, sm: [0, 0, 0], br: rnd(), msAt: 0, ms: null, f: 1, blN: 0 };
  /* 깜박임(상태별 간격 · 두 번 15% · 꼬마는 어른보다 덜 깜박임) — 예전 엔진 R.blinkArm을 v2에서 바꿔 끼움 */
  R.blinkArm = () => { clearTimeout(R.tm.bl); if (R.dead || R.rm) return; const now = performance.now(); const talk = now < (R.talkUntil || 0); const rd = /^(xread|pageturn|bookflip|read)$/.test(R.act_ || '') || /read/.test(R.ex || ''); const m = (talk ? 3.0 : rd ? 8 : L.bl) * 1000; const iv = Math.max(1200, m * (0.45 + 1.1 * rnd())); R.tm.bl = setTimeout(() => { if (!document.hidden) { R.blink(rnd() < 0.15); V.life.blN++; } R.blinkArm(); }, iv); };
  /* 버릇(성격 가중치 · 같은 것 연속 X · 간격 무작위) — 메인 캐릭터는 웹앱 대기 고르기도 있으니 1.8배 드물게 */
  let hab1 = 2; R.habArm = () => { clearTimeout(R.tm.hab); if (R.dead || R.rm) return; const main = typeof M_ !== 'undefined' && M_.rig === R; const g = hab1 === 2 ? (2500 + rnd() * 3500) / Math.sqrt(L.tp) : hab1 === 1 ? 4500 + rnd() * 3000 : (L.hab[0] + rnd() * (L.hab[1] - L.hab[0])) * 1000 * (main ? 1.8 : 1); const vis = hab1 > 0; hab1 = Math.max(0, hab1 - 1); /* (15차i ④ 정범님 '모리가 가만히 서 있음') 처음 두 버릇 = 2.5~6초 · 그 뒤 4.5~7.5초(15초 안에 둘) · 둘 다 눈에 띄는 팔 몸짓(발 까딱·고개 갸웃처럼 작은 것 X) — 고유 자세는 그대로(자세 바꿈은 20초 넘어서) */ /* 첫 버릇은 곧(2.5~7초) — 켜자마자 30초 동안 가만히 서 있지 않게 */
    R.tm.hab = setTimeout(() => { if (!document.hidden && !R.act_ && !R.ex && !R.drag && !R.sleep && performance.now() > (R.talkUntil || 0)) { const hist = (V.life.hh = V.life.hh || []); let E = Object.entries(L.H).filter(([k]) => !hist.includes(k)); if (vis) { const Ev = E.filter(([k]) => msc2HabVis(k)); if (Ev.length) E = Ev; } const sum = E.reduce((a, x) => a + x[1], 0); let r = rnd() * sum, pick = null; for (const [k, w] of E) { r -= w; if (r <= 0) { pick = k; break; } } if (pick) { hist.push(pick); if (hist.length > 2) hist.shift(); R.act(pick); } } R.habArm(); }, g); };
  /* 서는 자세 바꾸기 간격(성격) — 고유 자세에 가장 오래(가중치) */
  let first = 1; R.stArm = () => { clearTimeout(R.tm.st); if (R.dead) return; const g = (L.hold[0] + rnd() * (L.hold[1] - L.hold[0])) * 1000 + (first ? 20000 : 0); first = 0; /* 처음엔 고유 자세로 20초 넘게(가장 자주 · 처음 본 모습) */ R.tm.st = setTimeout(() => { if (!R.dead && !R.drag && !R.sleep && !document.hidden && !R.act_) { const STI = R.pose.st || { w: { st: 1 } }; R.stance(mscStPick(STI.w, R.st.k, rnd)); } R.stArm(); }, g); };
  R.blinkArm(); R.habArm(); R.stArm(); }
/* 쉬는 동안 고개·몸 흔들림 — 서로 배수가 아닌 주기의 사인 + 주파수 떠돎(±18%) + 크기 떠돎 + 느린 잡음(되풀이 안 보임 · 바이블 §11.1) */
function msc2LifeIdle(R, dt) { const V = R.v2, F = V.life; if (!F) return { yaw: 0, pit: 0, roll: 0, body: 0 }; const L = F.L, rnd = F.rnd; const tp = L.tp, am = L.am;
  if (dt > 0) { const h = Math.min(dt, 0.1); F.t += h; F.sn.forEach((s) => { const fj = msc2Ou(s.f, h, s.p * 0.8, rnd); s.ph += (2 * Math.PI * h * tp * (1 + 0.3 * Math.max(-2, Math.min(2, fj)))) / s.p; }); /* 주파수가 ±30% 떠돎(상관 시간 = 주기의 0.8) */ F.nA.forEach((n, i) => msc2Ou(n, h, 7 + i * 3, rnd)); msc2Ou(F.nY, h, 2.6, rnd); msc2Ou(F.nP, h, 2.1, rnd); msc2Ou(F.nR, h, 3.3, rnd);
    const k = Math.min(1, h * 3); F.sm[0] += (F.nY.v - F.sm[0]) * k; F.sm[1] += (F.nP.v - F.sm[1]) * k; F.sm[2] += (F.nR.v - F.sm[2]) * k; } /* 잡음은 한 번 더 부드럽게(덜덜 떨림 X) */
  const A = (i) => Math.max(0.35, 1 + 0.35 * F.nA[i].v); const s = F.sn;
  return { yaw: am * (s[0].a * A(0) * Math.sin(s[0].ph) + s[4].a * Math.sin(s[4].ph) + 2.0 * F.sm[0]), pit: am * (s[1].a * A(1) * Math.sin(s[1].ph) + s[5].a * Math.sin(s[5].ph) + 1.1 * F.sm[1]), roll: am * (s[2].a * A(2) * Math.sin(s[2].ph) + s[6].a * Math.sin(s[6].ph) + 1.3 * F.sm[2]), body: Math.sin(s[3].ph) }; }
/* 숨 모양(바이블 §11.1): 들숨 40% · 날숨 60% · 날숨 끝 0.3초 쉼 → −1..1 */
function msc2Breath(F, dt) { const p = F.L.br * (F.brK || 1); F.br = (F.br + (dt || 0) / p) % 1; const u = F.br, ps = Math.min(0.12, 0.3 / p), ia = 0.4 * (1 - ps); if (u < ia) return -1 + 2 * msc2Io(u / ia); if (u < 1 - ps) return 1 - 2 * msc2Io((u - ia) / (1 - ps - ia)); return -1; }
/* (15차i ④) 눈에 띄는 버릇 = 팔을 쓰는 몸짓(손이 0.35H 넘게 움직임) */
function msc2HabVis(k) { const A = typeof mscActOf === 'function' ? mscActOf(k) : null; return !!(A && A.arms); }
/* ── 서는 자세 '발 디딤 계획' ── */
const MSC2_MIRC = {};
function msc2PoseOf(k, mir) { const k2 = k === 'st' ? 'rl' : k; const P0 = MSC2_POSES[k2] || MSC2_POSES.rl; if (!mir) return P0; return (MSC2_MIRC[k2] = MSC2_MIRC[k2] || msc2Mirror(P0)); }
function msc2Snap(o, W, carry, k, mir) { let P = msc2PoseOf(k, mir); if (o.sd && P.n && typeof msc2SdPose === 'function') P = msc2SdPose(o, P); const sk = msc2Solve(o, W, { ...P, carry }); const J = sk.J; const cp0 = typeof P.cp === 'string' ? MSC2_CP[P.cp] : P.cp || MSC2_CP.light;
  const w = P.w || 0, aw = Math.abs(w) > 0.01 ? Math.sign(w) : 0, ws = Math.abs(w); const cp = o.kid ? { ...cp0, sh: cp0.sh * 0.65 } : cp0;
  const arms = {}; ['L', 'R'].forEach((S) => { arms[S] = { rel: msc2V.sub(J['wr' + S], J['sh' + S]), el: msc2V.sub(J['el' + S], J['sh' + S]) }; });
  return { k, mir: !!mir, w, cp: { ht: cp.ht * ws * aw, st: cp.st * ws * aw, sh: (cp.sh || 0) * ws * aw, hd: (cp.hd || 0) * ws * aw + (P.hd || 0) * (aw || 1) }, an: { L: J.anL.slice(), R: J.anR.slice() }, turn: { L: J.turnL, R: J.turnR }, hl: { L: J.heelL || 0, R: J.heelR || 0 }, arms, hand: P.hand || {}, prop: P.prop, back: P.back, lean: P.lean || 0, stance: P.stance || 1, cross: P.cross || 0 }; }
const msc2SupOf = (w) => (w > 0.05 ? 'R' : w < -0.05 ? 'L' : null);
const msc2FootD = (a, b) => Math.hypot(a[0] - b[0], (a[2] || 0) - (b[2] || 0)) + Math.abs(a[1] - b[1]);
/* 계획: 무게가 실린 발은 움직이지 않음 — 옮길 발이 디딘 발이면 먼저 무게를 다른 발로 옮김 */
function msc2Plan(A, B, L, o) { const tp = L.tp || 1, ph = []; const k7 = o.hc / 7; const eps = 0.02 * k7; let w = A.w, c = msc2SupOf(w);
  const mv = { L: msc2FootD(A.an.L, B.an.L) > eps, R: msc2FootD(A.an.R, B.an.R) > eps }; const oth = (S) => (S === 'L' ? 'R' : 'L');
  if (!c) c = mv.L && !mv.R ? 'R' : mv.R && !mv.L ? 'L' : msc2SupOf(B.w) ? oth(msc2SupOf(B.w)) : 'R'; /* 두 발에 무게면: 안 옮기는 발을 디딘 발로 */
  const stepD = (S) => (0.3 + 0.3 * Math.min(1, msc2FootD(A.an[S], B.an[S]) / (0.5 * k7))) / tp;
  const shiftD = (dw) => (0.85 + 0.45 * Math.min(1, Math.abs(dw) / 1.6)) / Math.sqrt(tp); /* 24~36f(바이블 §9.3) */
  const free = oth(c); if (mv[free]) ph.push({ k: 'step', S: free, d: stepD(free) });
  if (mv[c]) { const sb = msc2SupOf(B.w); if (sb === free) { ph.push({ k: 'shift', to: 'B', d: shiftD(B.w - w) }); w = B.w; } else { const tw = (c === 'R' ? -1 : 1) * 0.7; ph.push({ k: 'shift', to: 'T', tw, d: shiftD(tw - w) }); w = tw; } ph.push({ k: 'step', S: c, d: stepD(c) }); }
  if (Math.abs(B.w - w) > 0.01 || !ph.some((p) => p.k === 'shift')) ph.push({ k: 'shift', to: 'B', d: shiftD(B.w - w) * (ph.length ? 1 : 1) });
  let t = 0, end = 0; ph.forEach((p, i) => { p.t0 = t; end = Math.max(end, t + p.d); const nx = ph[i + 1]; t += p.d * (p.k === 'step' && nx && nx.k === 'shift' ? 0.72 : p.k === 'shift' && nx && nx.k === 'step' ? 0.85 : 1); }); return { ph, T: Math.max(end, 0.75 / tp) }; } /* 겹침: 발이 거의 닿을 즈음 무게가 옮겨 가기 시작(디딘 발은 그대로) */
/* 계획 안 시각 t(초)의 상태 */
function msc2PlanAt(A, B, pl, t, o, L) { const k7 = o.hc / 7; const an = { L: A.an.L.slice(), R: A.an.R.slice() }, turn = { ...A.turn }, hl = { ...A.hl }; let w = A.w; const cp = { ...A.cp }; let tx = null; const lift = { L: 0, R: 0 }; let wu = 0;
  const supX = (an2, ww) => { const S = msc2SupOf(ww); return S ? an2[S][0] : (an2.L[0] + an2.R[0]) / 2; };
  for (const p of pl.ph) { const u = msc2Cl01((t - p.t0) / p.d); if (u <= 0) break;
    if (p.k === 'step') { const S = p.S, e = msc2Io(u); const a = an[S], b = B.an[S]; const dd = msc2FootD(a, b); const up = (0.07 + 0.08 * Math.min(1, dd / (0.4 * k7))) * k7 * Math.sin(Math.PI * Math.min(1, u * 1.08)); /* (15l ②) 무릎 들기 강하게(예전 0.035 → 0.07 · 0.05 → 0.08) */ an[S] = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - up, a[2] + (b[2] - a[2]) * e + 0.04 * k7 * Math.sin(Math.PI * u)]; turn[S] = turn[S] + (B.turn[S] - turn[S]) * e; hl[S] = hl[S] + (B.hl[S] - hl[S]) * e + 0.05 * Math.sin(Math.PI * u) * k7; lift[S] = up; }
    else { const tw = p.to === 'B' ? B.w : p.tw; const tc = p.to === 'B' ? B.cp : { ht: Math.sign(tw) * 6 * Math.abs(tw), st: Math.sign(tw) * 3.5 * Math.abs(tw), sh: Math.sign(tw) * 0.13 * Math.abs(tw) * (o.kid ? 0.65 : 1), hd: Math.sign(tw) * 3 * Math.abs(tw) };
      /* 겹친 동작(바이블 §11.5): 골반 → 가슴(+2~3f) → 고개(+2~3f) · 골반 도착은 살짝 지나쳤다 정착 */ const ep = msc2Io(u) + 0.06 * Math.sin(Math.PI * msc2Cl01((u - 0.55) / 0.45)), ec = msc2Io(msc2Cl01((u - 0.1) / 0.9)), eh = msc2Io(msc2Cl01((u - 0.2) / 0.8));
      const x0 = supX(an, w); w = w + (tw - w) * ep; cp.ht += (tc.ht - cp.ht) * ep; cp.sh += (tc.sh - cp.sh) * ep; cp.st += (tc.st - cp.st) * ec; cp.hd += (tc.hd - cp.hd) * eh; const x1 = msc2SupOf(tw) ? an[msc2SupOf(tw)][0] : (an.L[0] + an.R[0]) / 2; tx = x0 + (x1 - x0) * msc2Io(u); if (u >= 1) tx = null; if (p.to === 'B') wu = u; } }
  if (tx == null) tx = supX(an, w); return { w, cp, an, turn, hl, tx, lift, wu }; }
/* 한 프레임의 바탕 자세(P 모양) — R.st 목표가 바뀌면 지금 상태에서 새 계획(끊고 들어와도 툭 튀지 않음) */
const MSC2_OLDST = { lean: 0 }; /* (r16g ③) 노인 굽은 등은 ② 몸 담당 MSC2_POST(16f · 척추 굽음·머리 앞)가 맡음 — 겹치지 않게 0(둘 다 켜면 두 번 굽음) */
function msc2Stand(R, V, X, now, dt) { const o = X.o, F = V.life, L = F ? F.L : MSC2_LIFE.af; const ST = R.st || { k: 'st', t0: 0, dur: 1 }; const S = (V.sd = V.sd || {});
  if (!S.clk) S.clk = 0; if (!R.drag) S.clk += Math.min(dt || 0, 0.1);
  const key = ST; if (S.key !== key) { const mir = ST.k === S.tk ? S.mir : F ? F.rnd() < 0.5 : Math.random() < 0.5; const B = msc2Snap(o, X.W, X.carry, ST.k, mir);
    if (!S.cur || ST.dur === 0) { S.A = B; S.B = B; S.pl = { ph: [], T: 0.001 }; S.t0 = S.clk; } else { S.A = S.cur; S.B = B; S.pl = msc2Plan(S.A, B, L, o); S.t0 = S.clk; const tr = Math.max(...['L', 'R'].map((s) => msc2V.len(msc2V.sub(S.A.arms[s].rel, B.arms[s].rel)))); S.pl.T = Math.max(S.pl.T, (0.6 + 0.42 * tr) / Math.sqrt(L.tp || 1)); } /* (15차h) 팔이 멀리 가면 더 오래(손목 최고 속도 ≈ 키의 1.6배/초 아래) */
    S.key = key; S.tk = ST.k; S.mir = mir; S.msT = S.clk + (L.ms[0] + (F ? F.rnd() : 0.5) * (L.ms[1] - L.ms[0])); S.ms = null; }
  const A = S.A, B = S.B, pl = S.pl; const t = S.clk - S.t0; const T = pl.T; const u = msc2Cl01(t / T); const st = msc2PlanAt(A, B, pl, Math.min(t, T + 1), o, L);
  /* 팔·손·몸 기울임 = 계획 전체에 걸쳐(골반보다 2f 늦게 출발 · 끝 정착) */ const ea = msc2Io(msc2Cl01((u - 0.08) / 0.92)); const arms = {};
  const V3 = msc2V; const nl = msc2Nl;
  ['L', 'R'].forEach((s) => { const a = A.arms[s], b = B.arms[s]; const sg = s === 'L' ? -1 : 1; const ua = o.ua, fa = o.fa; const uA = V3.norm(a.el), uB = V3.norm(b.el), fA = V3.norm(V3.sub(a.rel, a.el)), fB = V3.norm(V3.sub(b.rel, b.el)); /* (15차h) 팔은 관절 각으로 섞음(위팔 방향 → 아래팔 방향 · 손목 길은 저절로 호) — IK 극 방향 섞기는 팔꿈치가 뒤집혔음 */
    const du = nl(uA, uB, ea, [sg * 0.8, 0.4, 0.2]), df = nl(fA, fB, msc2Io(msc2Cl01((ea - 0.06) / 0.94)), [sg * 0.3, 0.6, 0.6]); const el = V3.mul(du, ua), rel = V3.add(el, V3.mul(df, fa)); arms[s] = { k: 'iks', t: rel, pole: el, elv: el }; }); /* 아래팔이 2f 늦게 따라옴(겹침) */
  /* 쉬는 동안 작은 무게 옮김(발 제자리) + 몸 흔들림(15.5초) — 1/25 단계로 계단(몸 다시 그리기를 1초 1번 아래로) */
  let f = 1; if (t >= T && F && !R.drag) { if (!S.ms && S.clk > S.msT) { const r = F.rnd(); S.ms = { a: S.f || 1, b: r < 0.7 ? 0.5 + 0.25 * F.rnd() : 1.12, t0: S.clk, d: (1 + 0.5 * F.rnd()) / Math.sqrt(L.tp), hold: (1.2 + 2.8 * F.rnd()) / L.tp }; }
    if (S.ms) { const m = S.ms, e = S.clk - m.t0; if (e < m.d) f = m.a + (m.b - m.a) * msc2Io(e / m.d); else if (e < m.d + m.hold) f = m.b; else if (e < 2 * m.d + m.hold) f = m.b + (1 - m.b) * msc2Io((e - m.d - m.hold) / m.d); else { f = 1; S.ms = null; S.msT = S.clk + (L.ms[0] + F.rnd() * (L.ms[1] - L.ms[0])); } }
    const bs = F.sn ? Math.sin(F.sn[3].ph) : 0; f = Math.round((f + 0.1 * bs * (L.am || 1)) * 25) / 25; }
  S.f = f; const cp = { ht: st.cp.ht * f, st: st.cp.st * (0.6 + 0.4 * f), sh: st.cp.sh * f, hd: st.cp.hd * (0.7 + 0.3 * f), kf: 0 }; const w = st.w * f; const mid = (st.an.L[0] + st.an.R[0]) / 2; const tx = f === 1 ? st.tx : mid + (st.tx - mid) * Math.min(1.1, f);
  const pick = (k) => (ea < 0.5 ? A[k] : B[k]); const prop = ea < 0.1 ? A.prop : ea > 0.9 ? B.prop : A.prop === B.prop && msc2V.len(msc2V.sub(A.arms.L.rel, B.arms.L.rel)) < 0.05 ? A.prop : null; /* 손이 움직이는 동안 소품은 내려놓음(책이 손 사이로 커지지 않게) */
  S.cur = { k: ST.k, w, cp: { ht: cp.ht, st: cp.st, sh: cp.sh, hd: cp.hd }, an: { L: st.an.L.slice(), R: st.an.R.slice() }, turn: { ...st.turn }, hl: { ...st.hl }, arms: { L: { rel: arms.L.t, el: arms.L.elv }, R: { rel: arms.R.t, el: arms.R.elv } }, hand: pick('hand'), prop, back: pick('back'), lean: A.lean + (B.lean - A.lean) * ea, stance: A.stance + (B.stance - A.stance) * ea, cross: pick('cross') };
  S.lift = st.lift; S.u = u; S.wu = st.wu; S.arms = arms;
  return { w, cp, cpAbs: 1, cpSg: 1, ankAbs: { L: st.an.L, R: st.an.R, tx, turn: st.turn, hl: st.hl }, arms, hand: { ...S.cur.hand }, prop: S.cur.prop, back: S.cur.back, lean: S.cur.lean + (o.old ? MSC2_OLDST.lean : 0), stance: S.cur.stance, cross: S.cur.cross, hd: 0 }; }
/* ── 몸짓 다듬기(v2만 · 바이블 §11.4): 주된 채널(가장 크게 움직이는 것)에 예비 동작이 없으면 — 본 동작 방향 반대로 본 동작의 12%(SD 20%) · 본 동작 시작 전에(필요하면 몸짓 전체를 0.1~0.16초 늦게 시작하고 나머지를 같은 길이로 맞춤) · 돌아오는 끝은 5% 지나쳤다 정착
 *  원래 표(MSC_ACTS·HAB·IDA)는 그대로(예전 그림 엔진 · 예전 시험) — v2 엔진만 이 사본을 씀 */
const MSC2_ACTP = new Map(); const MSC2_ACH = ['aw', 'ty', 'pitch', 'lean', 'hr', 'yaw', 'rot', 'tx', 'shY', 'lw', 'hy', 'sy', 'sx', 'sb']; /* (15차k) sb = 허리 옆 굽힘(°) */
const MSC2_ACW = { aw: 12, lw: 10, sx: 60, sy: 60, ty: 3, tx: 3, shY: 4, hy: 4 }; /* 채널 크기를 '도' 비슷하게 맞춤(주된 채널 고르기) */
function msc2ChanStat(K, ms) { const N = 120, v = []; for (let i = 0; i <= N; i++) v.push(mscTrk(K, (ms * i) / N)); const v0 = v[0]; let amp = 0, ie = 0; v.forEach((x, i) => { if (Math.abs(x - v0) > amp + 1e-9) { amp = Math.abs(x - v0); ie = i; } }); if (amp < 1e-6) return null; const d = Math.sign(v[ie] - v0); let i5 = 0; for (let i = 0; i <= N; i++) if (Math.abs(v[i] - v0) > 0.04 * amp) { i5 = i; break; }
  let pre = false; for (let i = 1; i < ie; i++) if ((v[i] - v0) * d < -0.03 * amp) { pre = true; break; } return { v0, amp, d, t5: (ms * i5) / N, pre }; } /* 주된 방향 = 가장 크게 간 쪽 · 그 전에 반대로 3% 넘게 = 예비 있음 */
function msc2MainCh(A) { let best = null; MSC2_ACH.forEach((c) => { if (!A[c]) return; const st = msc2ChanStat(A[c], A.ms); if (!st) return; const sc = st.amp * (MSC2_ACW[c] || 1); if (!best || sc > best.sc) best = { c, sc, st }; }); return best; }
function msc2Settle(K) { /* 마지막 돌아옴: 쉼 값을 6% 지나쳤다 정착(2~6f) */ if (!Array.isArray(K) || K.length < 3 || !Array.isArray(K[0])) return K; const n = K.length - 1, a = K[n - 1], b = K[n]; if (typeof a[1] !== 'number' || Math.abs(b[1] - K[0][1]) > 1e-6 || Math.abs(a[1] - b[1]) < 1e-6) return K; const dtt = b[0] - a[0]; if (dtt < 200) return K; const os = (b[1] - a[1]) * 0.06; return K.slice(0, n).concat([[b[0] - Math.min(125, dtt * 0.25), b[1] + os, 'io'], [b[0], b[1], 'io']]); }
/* (r16g ③ 정범님 '전봇대 · 굳은 자세') 예전(14차) 몸짓 표는 꼬마 머리 큰 그림에 맞춘 몸 움직임이라 v2 어른 몸(키 ≈190)에서는 몸통이 거의 안 움직임(꾸벅 인사 몸 굽힘 4.5° · 폴짝 0.7% · 놀라 뜀 1.2%)
 *  → v2에서만 몸 채널을 키움: 위아래(ty) 2.2배 · 앞으로 굽힘(lean) 3배 · 몸 돌림(rot) 1.5배 — 모양(예비·지나침·정착 순서)은 그대로 · 예전 그림 엔진 표는 안 바뀜 · x(새) 몸짓은 이미 v2 크기 */
/* (r16g ③) 정면에서 안 보이던 예전 몸짓 따로 고침 — 꾸벅 인사: 몸 굽힘 4.5° → 21°(+머리 내림·몸 눌림 · 정중한 인사 xbow와 같은 그림 말) */
const MSC2_ACTFIX = { bow: (A) => { A.lean = [[0, 0], [200, -0.4, 'io'], [650, 8.5, 'o'], [1250, 8, 'l'], [1800, 0, 'io']]; A.hy = [[0, 0], [650, 1.6, 'o'], [1250, 1.5, 'l'], [1800, 0, 'io']]; A.sy = [[0, 1], [200, 1.01, 'io'], [650, 0.965, 'o'], [1250, 0.97, 'l'], [1800, 1, 'io']]; A.gy = [[0, 0], [650, 0.5, 'io'], [1250, 0.5, 'l'], [1800, 0, 'io']]; } };
const MSC2_RET = { f: 10 };
const MSC2_AMP = { ty: 2.2, lean: 3, rot: 1.5 };
function msc2ActAmp(A) { Object.entries(MSC2_AMP).forEach(([c, k]) => { const K = A[c]; if (!K) return; if (typeof K === 'function') A[c] = (t) => K(t) * k; else if (Array.isArray(K)) A[c] = K.map((e) => (Array.isArray(e) && typeof e[1] === 'number' ? [e[0], e[1] * k].concat(e.slice(2)) : e)); }); }
function msc2ActP(k) { if (!k) return null; let A = MSC2_ACTP.get(k); if (A) return A; const A0 = mscActOf(k); if (!A0) return null; A = { ...A0 }; if (!/^x/.test(k)) msc2ActAmp(A); /* (r16g ③) 예전 몸짓 몸 움직임 키움 */ if (MSC2_ACTFIX[k]) MSC2_ACTFIX[k](A); ['aw', 'lw'].forEach((c) => { const K = A[c]; if (!Array.isArray(K) || K.length < 3 || !Array.isArray(K[0])) return; const n = K.length - 1, e = K[n], q = K[n - 1]; if (typeof e[1] !== 'number' || Math.abs(e[1]) > 0.01 || Math.abs(q[1]) < 0.5) return; const want = msc2F(MSC2_RET.f); if (e[0] - q[0] >= want) return; const t1 = Math.max(K[n - 2][0] + 1, e[0] - want); A[c] = K.slice(0, n - 1).concat([[t1, q[1], q[2]], [e[0], 0, 'io']]); }); /* (r16g ③ 2묶음) 몸짓 끝 돌아옴이 6f(0.25초)면 팔짱·책 자세로 '툭' 돌아감 → 팔·다리 돌아옴은 최소 10f(0.42초 · 08 §8.6 정착) */ MSC2_ACH.forEach((c) => { if (Array.isArray(A[c])) A[c] = msc2Settle(A[c]); });
  const mc = msc2MainCh(A); if (mc && !mc.st.pre) { const ms = A.ms, st = mc.st; let td = 0; if (st.t5 < 120) td = Math.min(160, ms * 0.08); const ta = td ? td : Math.min(260, st.t5 * 0.9); const wp = td ? (t) => Math.max(0, Math.min(ms, ((t - td) * ms) / (ms - td))) : null;
    const amp = Math.min(st.amp * 0.12, 4 / (MSC2_ACW[mc.c] || 1)), d = st.d, bump = (t) => (t > 0 && t < ta ? -d * amp * Math.pow(Math.sin((Math.PI * t) / ta), 2) : 0);
    if (wp) { MSC2_ACH.forEach((c) => { if (A[c] == null) return; const K = A[c]; A[c] = (t) => mscTrk(K, wp(t)); }); ['gx', 'gy'].forEach((c) => { if (A[c] == null) return; const K = A[c]; A[c] = (t) => mscTrk(K, wp(t)); }); A.wp = wp; if (A.ev) A.ev = A.ev.map((e) => [td + (e[0] * (ms - td)) / ms].concat(e.slice(1))); }
    const K1 = A[mc.c]; A[mc.c] = (t) => mscTrk(K1, t) + bump(t); A.antC = mc.c; }
  MSC2_ACTP.set(k, A); return A; }
/* 시험·점검용: 주된 채널이 처음 극값으로 가기 전에 반대로 ≥3% 움직이는지 */
function msc2HasAntic(A) { const mc = msc2MainCh(A); return mc && mc.st.pre ? mc.c : null; }
/* 팔 관절 각 속도 한도(바이블 §11.5 · '스냅 없음'): 위팔·아래팔 방향을 목표로 돌리되 1프레임쯤 늦게(τ 36ms) · 초당 515°(9 rad)를 넘지 않음 — 빠른 몸짓은 다시 그리기를 24fps(1코마)로 */
const MSC2_IB = { v: 2.8, mn: 0.28, mx: 0.6, cap: 0.75 }; /* (15차k ①) 몸짓을 끊고 새 몸짓: 끊는 순간의 팔(관절 방향)에서 새 목표로 이어 섞는 시간 = 가장 큰 각 ÷ v(rad/s) · 0.28~0.6초 · 처음·끝 속도 0(io) */
function msc2ArmSlew(V, P, o, dt, drag, cut) { const V3 = msc2V; const S0 = (V.slew = V.slew || {}); let fast = 0; const tq = V.life ? Math.min(1, Math.sqrt(V.life.L.tp)) : 1; const k = 1 - Math.exp(-dt / 0.036), cap = 9 * tq * dt * (V.slewK || 1); /* 노인·차분한 성격은 더 느리게 · (15차k) 짝과 손을 맞추는 동안은 1.8배까지(늦게 닿아 엇갈림 X) */
  if (cut && !drag) { const F = {}; ['L', 'R'].forEach((S) => { const c = S0[S]; if (c) F[S] = { du: (c.tu || c.du).slice(), df: (c.tf || c.df).slice() }; }); /* 섞기 출발 = 앞 몸짓의 마지막 목표(팔은 속도 한도로 그쪽으로 가던 길을 이어 가다 새 목표로 — 뚝 멈춤 X) */ V.ib = { t: 0, dur: 0, F }; V.ibN = (V.ibN || 0) + 1; } /* (15차k ①) 예전: 끊으면 목표가 한 프레임에 바뀌어 손목이 한 번에 ≈27px(속도 한도 안이지만 앞뒤 프레임 0 → 튐) */
  if (drag) V.ib = null; const IB = V.ib;
  if (IB && !IB.dur) { let mxA = 0; ['L', 'R'].forEach((S) => { const a = P.arms[S], f = IB.F[S]; if (!a || a.k !== 'iks' || !f) return; const du = V3.norm(a.pole), df = V3.norm(V3.sub(a.t, a.pole)); mxA = Math.max(mxA, Math.acos(Math.max(-1, Math.min(1, V3.dot(du, f.du)))), Math.acos(Math.max(-1, Math.min(1, V3.dot(df, f.df))))); }); IB.dur = Math.max(MSC2_IB.mn, Math.min(MSC2_IB.mx, mxA / (MSC2_IB.v * Math.max(0.6, tq)))); }
  const ibE = IB ? MSC_EASE.io(Math.min(1, IB.t / IB.dur)) : 1; const ibS = (p, q) => { const d = V3.dot(p, q); if (d < -0.995) { const m = V3.norm(V3.add(V3.mul(p, 1 - ibE), V3.mul([p[1] || 0.01, -p[0], p[2]], Math.sin(ibE * Math.PI)))); return V3.norm(V3.add(V3.mul(m, 1 - ibE), V3.mul(q, ibE))); } return V3.norm(msc2Slp(p, q, ibE)); }; /* 거의 반대 방향이면 옆으로 돌아감(slerp 0으로 나누기 X) */
  ['L', 'R'].forEach((S) => { const a = P.arms[S]; if (!a || a.k !== 'iks' || drag) { S0[S] = null; return; } const el = a.pole, rel = a.t; let du = V3.norm(el), df = V3.norm(V3.sub(rel, el)); if (IB && IB.F[S] && ibE < 1) { du = ibS(IB.F[S].du, du); df = ibS(IB.F[S].df, df); } const c = S0[S]; if (!c) { S0[S] = { du, df, tu: du, tf: df }; return; } c.tu = du; c.tf = df;
    const rot = (p, q) => { const ang = Math.acos(Math.max(-1, Math.min(1, V3.dot(p, q)))); if (ang < 1e-5) return [q, 0]; const st = Math.min(ang, Math.max(ang * k, Math.min(ang, 0.004))); const e = Math.min(st, IB ? cap * MSC2_IB.cap : cap) / ang; /* (15차k) 이어 섞는 동안은 속도 한도를 조금 낮춤(새 몸짓의 빠른 첫 동작 + 섞기가 겹쳐 보통보다 빨라지지 않게) */ return [V3.norm(msc2Slp(p, q, e)), ang]; };
    const [u2, a1] = rot(c.du, du), [f2, a2] = rot(c.df, df); c.du = u2; c.df = f2; if (Math.max(a1, a2) * k / dt > 3.5) fast = 1; const e2 = V3.mul(u2, o.ua); P.arms[S] = { ...a, t: V3.add(e2, V3.mul(f2, o.fa)), pole: e2 }; });
  if (IB) { IB.t += dt; if (IB.t >= IB.dur) V.ib = null; }
  V.fast = fast ? 4 : Math.max(0, (V.fast || 0) - 1); }

