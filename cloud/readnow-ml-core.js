/* readnow-ml-core.js — 스스로 배우기 (개편 6단계 · 공용 파일)
 * 묻는 것 하나: "이 상품이 이 가격이면 7일 안에 팔릴 확률은?" (팔릴 확률 모델)
 * 재료: 클라우드가 매일 쌓는 판매중 상품의 하루 모습(ml_days) + 그 뒤 실제 판매(주문). 같은 행(rawRow)을 클라우드·웹앱이 이 파일 한 곳에서 만듦.
 * 모델: 로지스틱 회귀(특징 표준화 + L2) — 자료가 적을 때 흔들리지 않고, 계수를 사람이 읽을 수 있음. 자료가 쌓이면 더 큰 모델로 바꿀 자리(MODEL_KIND)
 * 순서(클라우드 밤 작업): ① 배우기(7일이 지나 결과를 아는 날들) → ② 그림자(오늘 상품마다 확률을 적어 두기만, 쓰지 않음) → ③ 7일 뒤 실제 판매와 맞춰 채점
 *   → ④ 새 모델이 지금 모델보다 3번 연속 확실히 나으면(로그 손실 1% 넘게 낮음) 승격. 처음 '지금 모델'은 기준선(자리 1위 여부·등급별 평균 판매율)
 * 쓰는 곳: 웹앱 전략도구의 조언 금액(그림자 표시), 앞으로 판정 엔진의 '권당 하루 기대 순이익'. 알라딘에 아무것도 바꾸지 않음 — 계산만. */
(function (root) {
  const VERSION = '0.5.0'; // (0.5.0) 정범님 10/19 '정가가 고객의 첫 기준' — 정가 대비 우리 값 칸(<35%·35~50%·50%+)을 수요×자리 칸 안에서 배움(cells3 · 줄이 적으면 수요×자리 값으로 당김) · valueOf·valueRec가 씀 // (0.4.0) 🧠 valueRec — 등록·매입 때 판매가치 엔진으로 추천가·판매 확률·매입 판단(살 이유·사지 말 이유) 한 곳 // (0.3.0) 🧠 판매가치 엔진 v1(VALUE) — 수요(Sales Point)×자리(첫 페이지 순위)×값(동급 최저 대비)의 하루 판매 확률 표를 우리 판매 자료로 매일 배움 · 희소/희귀 분류 · 상품마다 전략과 기대 판매 // (0.2.2) 판매가 평가 v0.2 — 유효 안에서 기준이 없으면 노랑 → 주황 → 빨강 판매자 매물 안에서 같은 순서로 · out.tier // (0.2.1) 판매가 평가 v0.1 — 동급이 없으면 위 등급(우리보다 쌈)·아래 등급(우리보다 비쌈) 유효 최저가와 견줌 · refKind(same·hi·lo·conv·new)·refG // (0.2.0) 💬 판매가 평가 evalSale v0 — 팔린 상품의 그때 시장으로 '싸게/적정/잘 받음' (정범님 평가를 정답으로 모아 다음 판이 배움)
  const HORIZON_D = 7; // 7일 안에 팔렸나
  const GR = ['최상', '상', '중'];
  /* rawRow: 하루 모습 한 줄 (클라우드 ml_days ML_VER 1과 같은 칸) — l = 상품(prd_listings), m = 시장 지표(prd_book_metrics), a = 마지막 가격 변경 {at, from, batchId}, wg = 감시 그룹, nowMs = 그날 끝 */
  function rawRow(l, m, a, wg, nowMs) { m = m || {}; const P1 = m.usedFirstPage || []; const oth = P1.filter((r) => String(r.sellerCode) !== '996008' && r.usedCode !== l.usedCode && r.price > 0);
    const sameMin = oth.filter((r) => r.grade === l.grade).reduce((x, r) => Math.min(x, r.price), Infinity); const minAll = oth.reduce((x, r) => Math.min(x, r.price), Infinity); const rank = l.price ? oth.filter((r) => r.price < l.price).length + 1 : null;
    return { key: l.id, price: l.price ?? null, grade: GR.indexOf(l.grade), shelf: String(l.sku || '').slice(0, 6), age: l.registeredAt ? Math.round((nowMs - Date.parse(String(l.registeredAt).slice(0, 10) + 'T00:00:00+09:00')) / 864e5) : null,
      list: m.priceList ?? null, sp: m.salesPoint ?? null, used: m.usedTotal ?? null, p1: P1.length, rank, sameMin: Number.isFinite(sameMin) ? sameMin : null, minAll: Number.isFinite(minAll) ? minAll : null, bb: (m.buyback || {})[l.grade] ?? null,
      mkt: m.lastCheckedAt ? Math.round((nowMs - Date.parse(m.lastCheckedAt)) / 864e5) : null, act: a ? Math.round((nowMs - Date.parse(a.at)) / 3600e3) : null, actFrom: a ? a.from ?? null : null, actBatch: a ? a.batchId || null : null, wg: wg || null }; }
  // 가격을 바꾼다면: 같은 줄에서 가격과 그에 따라 바뀌는 자리만 다시 셈 (시장 첫 페이지 다른 매물 가격 목록 others가 있으면 자리를 정확히)
  function withPrice(r, price, others) { const o = { ...r, price }; if (Array.isArray(others)) o.rank = others.filter((p) => p < price).length + 1; else if (r.rank != null && r.price) o.rank = price < r.price ? Math.max(1, r.rank - 1) : r.rank; return o; }
  const FEATURES = ['lp', 'rSame', 'noSame', 'rAll', 'rank', 'top1', 'g0', 'g1', 'g2', 'age', 'rList', 'noList', 'sp', 'used', 'p1', 'bbr', 'mkt', 'recent'];
  const L1 = (x) => Math.log1p(Math.max(0, +x || 0)); const cap = (x, a, b) => Math.max(a, Math.min(b, x));
  function feats(r) { const p = +r.price || 0; if (!(p > 0)) return null;
    return [Math.log(p), r.sameMin ? cap(p / r.sameMin, 0.2, 5) : 1, r.sameMin ? 0 : 1, r.minAll ? cap(p / r.minAll, 0.2, 5) : 1, cap(r.rank || 20, 1, 20), r.rank === 1 ? 1 : 0, r.grade === 0 ? 1 : 0, r.grade === 1 ? 1 : 0, r.grade === 2 ? 1 : 0, L1(r.age), r.list ? cap(p / r.list, 0, 3) : 0.6, r.list ? 0 : 1, L1(r.sp), L1(r.used), cap(+r.p1 || 0, 0, 30), r.bb ? cap(r.bb / p, 0, 3) : 0, cap(r.mkt == null ? 30 : r.mkt, 0, 30), r.act != null && r.act < 168 ? 1 : 0]; }
  const sig = (z) => 1 / (1 + Math.exp(-cap(z, -30, 30)));
  /* train(X, y, {l2, iters, lr}) → 모델 {kind:'logit', w, b, mu, sd, features} — 전체 자료 경사 하강(작은 자료에 안정) */
  function train(X, y, o) { o = o || {}; const n = X.length, d = FEATURES.length; const mu = Array(d).fill(0), sd = Array(d).fill(0);
    for (const x of X) for (let j = 0; j < d; j++) mu[j] += x[j] / n; for (const x of X) for (let j = 0; j < d; j++) sd[j] += (x[j] - mu[j]) ** 2 / n; for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j]) || 1;
    const Z = X.map((x) => x.map((v, j) => (v - mu[j]) / sd[j])); const pos = y.reduce((a, v) => a + v, 0); let b = Math.log((pos + 0.5) / (n - pos + 0.5)); const w = Array(d).fill(0); const l2 = o.l2 ?? 1e-3, lr = o.lr ?? 0.5, it = o.iters ?? 300;
    for (let t = 0; t < it; t++) { const gw = Array(d).fill(0); let gb = 0; for (let i = 0; i < n; i++) { let z = b; const zi = Z[i]; for (let j = 0; j < d; j++) z += w[j] * zi[j]; const e = sig(z) - y[i]; gb += e; for (let j = 0; j < d; j++) gw[j] += e * zi[j]; }
      b -= lr * gb / n; for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / n + l2 * w[j]); }
    return { kind: 'logit', w, b, mu, sd, features: FEATURES.slice(), core: VERSION, n, pos }; }
  // 기준선: 1위인가 × 등급별 평균 판매율 (모델이 이보다 나아야 의미가 있음)
  function trainBase(rows, y) { const k = (r) => `${r.rank === 1 ? 1 : 0}|${r.grade}`; const T = {}; rows.forEach((r, i) => { const o = T[k(r)] || (T[k(r)] = [0, 0]); o[0] += y[i]; o[1]++; }); const all = y.reduce((a, v) => a + v, 0) / Math.max(1, y.length);
    const rate = {}; for (const [kk, [s, n]] of Object.entries(T)) rate[kk] = (s + all * 5) / (n + 5); return { kind: 'base', rate, all, core: VERSION, n: y.length }; }
  function predict(M, r) { if (!M) return null; if (M.kind === 'base') { const v = M.rate[`${r.rank === 1 ? 1 : 0}|${r.grade}`]; return v != null ? v : M.all; } const x = feats(r); if (!x) return null; let z = M.b; for (let j = 0; j < x.length; j++) z += M.w[j] * (x[j] - M.mu[j]) / M.sd[j]; return sig(z); }
  /* evaluate(p, y) → 로그 손실(낮을수록 좋음)·브라이어·AUC(높을수록 좋음) */
  function evaluate(p, y) { const n = y.length; if (!n) return null; let ll = 0, br = 0; for (let i = 0; i < n; i++) { const q = cap(p[i], 1e-6, 1 - 1e-6); ll -= y[i] ? Math.log(q) : Math.log(1 - q); br += (q - y[i]) ** 2; }
    const idx = p.map((v, i) => [v, y[i]]).sort((a, b) => a[0] - b[0]); let rk = 0, rs = 0, np = 0; for (let i = 0; i < idx.length;) { let j = i; while (j < idx.length && idx[j][0] === idx[i][0]) j++; const avg = (i + j + 1) / 2; for (let k = i; k < j; k++) if (idx[k][1]) { rs += avg; np++; } i = j; rk++; }
    const nn = n - np; const auc = np && nn ? (rs - np * (np + 1) / 2) / (np * nn) : null; return { n, pos: np, logloss: ll / n, brier: br / n, auc }; }
  /* 승격 규칙: 최근 채점(오래된 것→새것) 중 마지막 3번 모두 새 모델의 로그 손실이 지금 모델보다 1% 넘게 낮으면 */
  function shouldPromote(evals, k, margin) { k = k || 3; margin = margin ?? 0.01; const L = (evals || []).filter((e) => e && e.champ && e.chall && e.chall.n >= 50).slice(-k); if (L.length < k) return { ok: false, why: `채점 ${L.length}/${k}번` }; const ok = L.every((e) => e.chall.logloss < e.champ.logloss * (1 - margin)); return { ok, why: ok ? `최근 ${k}번 모두 로그 손실 ${(margin * 100).toFixed(0)}% 넘게 낮음` : '최근 채점에서 확실히 낫지 않음' }; }
  // 권당 하루 기대 순이익(가격 p): 7일 안 팔릴 확률 q → 하루 판매 확률 ≈ 1-(1-q)^(1/7), 남는 돈 = p(1-수수료) − 매입가
  function dailyValue(q, price, fee, cost) { if (q == null) return null; const d = 1 - Math.pow(1 - cap(q, 0, 0.999), 1 / HORIZON_D); return d * (price * (1 - (fee ?? 0.1)) - (cost || 0)); }
  /* ══ (0.2.0) 💬 판매가 평가 v0 — "이 판매가는 그때 시장에서 잘 받은 값이었나?" (정범님 10/18 · 머신러닝 로드맵 1단계)
   * 이미 팔린 상품이라 답(정범님 평가)을 붙이기 쉬움 → 그 답이 쌓이면 규칙을 배운 모델로 바꿈(SALE_EVAL_VER가 올라감)
   * 재료(주문 때 화면에 보인 그대로): p 우리 판매가 · g 등급 · rows 온라인 중고 첫 페이지 [{c 판매자 분류(dkgreen·green·aladin·yellow·orange·red·ours…), g, p, lid}] · lid 우리 매물 번호
   *   ps 새상품 판매가 · pl 정가 · av 새상품 판매 상태(onSale·절판·품절·일시품절) · days 등록부터 주문까지 일 · tot 전체 중고 수 · sp 판매지수
   * 유효 상품 = 짙은 초록·초록 판매자 + 알라딘측(파랑) — 북스킹(우리) 줄은 뺌. 동급 유효 최저가 = 같은 등급의 유효 상품 중 가장 싼 판매가
   * 돌려줌: { ver, ref 비교 기준가, refHow, ratio (우리 − 기준)/기준, score −2(많이 싸게)…+2(많이 비싸게 받음), verdict 짧은 말, why 근거 한 줄, missed 더 받을 수 있었던 어림 금액, feat 그때 값 } */
  const SALE_EVAL_VER = 'v0.2-rule'; /* (0.2.1) 동급이 없으면 '더 높은 등급인데 더 싼'·'더 낮은 등급인데 더 비싼' 유효 최저가와 먼저 견줌(정범님 10/18) */
  const GRANK = { 최상: 3, 상: 2, 중: 1, 하: 0 };
  const GCOEF = { 최상: 1, 상: 0.9, 중: 0.75 };
  function evalSale(x) { x = x || {}; const p = +x.p || 0; const g = x.g || ''; const rows = Array.isArray(x.rows) ? x.rows : [];
    const VALID = { dkgreen: 1, green: 1, aladin: 1 }; const oth = rows.filter((r) => r && r.p > 0 && !r.so && !r.srch && r.c !== 'ours' && !(x.lid && String(r.lid || '') === String(x.lid)));
    const valid = oth.filter((r) => VALID[r.c]); const same = valid.filter((r) => r.g === g);
    const effSame = same.length ? Math.min(...same.map((r) => r.p)) : null; const nextAbove = same.filter((r) => r.p > p).reduce((m, r) => Math.min(m, r.p), Infinity);
    const feat = { p, g, n1: rows.length, nValid: valid.length, nSame: same.length, effSame, effAll: valid.length ? Math.min(...valid.map((r) => r.p)) : null, nextAbove: Number.isFinite(nextAbove) ? nextAbove : null,
      rankValid: valid.filter((r) => r.p < p).length + 1, ps: x.ps || null, pl: x.pl || null, av: x.av || null, days: x.days ?? null, tot: x.tot ?? null, sp: x.sp ?? null };
    const out = { ver: SALE_EVAL_VER, feat, ref: null, refHow: '', ratio: null, score: null, verdict: '평가 못 함', why: '', missed: 0 };
    if (!p) { out.why = '판매가 없음'; return out; }
    let ref = null, how = '', kind = null, refG = null, tier = 'valid';
    const gr0 = GRANK[g]; const minOf = (L) => L.reduce((m, r) => (!m || r.p < m.p ? r : m), null);
    /* 한 무리(유효 → 노랑 → 주황 → 빨강) 안에서 같은 순서로: 동급 최저가 → 위 등급 최저가(우리보다 쌀 때) → 아래 등급 최저가(우리보다 비쌀 때) → 등급 환산 */
    const pick = (pool, tag) => { const sm = pool.filter((r) => r.g === g); if (sm.length) return { ref: Math.min(...sm.map((r) => r.p)), kind: 'same', refG: g, how: `동급 ${tag} 최저가` };
      const hi = gr0 != null ? minOf(pool.filter((r) => GRANK[r.g] != null && GRANK[r.g] > gr0)) : null; if (hi && hi.p < p) return { ref: hi.p, kind: 'hi', refG: hi.g, how: `더 높은 등급(${hi.g}) ${tag} 최저가 — 우리보다 쌈` }; /* 더 좋은 책이 더 쌌는데도 우리 것이 팔림 → 비싸게 받음 */
      const lo = gr0 != null ? minOf(pool.filter((r) => GRANK[r.g] != null && GRANK[r.g] < gr0)) : null; if (lo && lo.p > p) return { ref: lo.p, kind: 'lo', refG: lo.g, how: `더 낮은 등급(${lo.g}) ${tag} 최저가 — 우리보다 비쌈` }; /* 더 나쁜 책도 우리보다 비쌌음 → 싸게 팔림 */
      if (pool.length && GCOEF[g]) { const conv = pool.map((r) => (GCOEF[r.g] ? r.p / GCOEF[r.g] * GCOEF[g] : null)).filter((v) => v > 0); if (conv.length) return { ref: Math.round(Math.min(...conv)), kind: 'conv', refG: null, how: `다른 등급 ${tag} 최저가를 등급 환산(최상 1·상 0.9·중 0.75)` }; }
      return null; };
    /* (0.2.2 · 정범님 10/18) 유효(짙은 초록·초록·알라딘측) 안에서 기준을 못 찾으면 노랑 → 주황 → 빨강 판매자 매물 안에서 같은 순서로 — 웹앱은 이 경우 경고 모양 */
    const TIERS = [['valid', valid, '유효'], ['yellow', oth.filter((r) => r.c === 'yellow'), '노랑 판매자'], ['orange', oth.filter((r) => r.c === 'orange'), '주황 판매자'], ['red', oth.filter((r) => r.c === 'red'), '빨강 판매자']];
    for (const [t, pool, tag] of TIERS) { const R = pick(pool, tag); if (R) { ({ ref, kind, refG, how } = R); tier = t; break; } }
    const notes = []; const soldOut = x.av && x.av !== 'onSale';
    if (ref) { const r = (p - ref) / ref; out.ref = ref; out.refHow = how; out.refKind = kind; out.refG = refG; out.tier = tier; feat.refKind = kind; feat.refG = refG; feat.tier = tier; out.ratio = Math.round(r * 1000) / 1000;
      out.score = r <= -0.15 ? -2 : r < -0.03 ? -1 : r <= 0.03 ? 0 : r <= 0.2 ? 1 : 2;
      if (out.score < 0) { const cap = feat.nextAbove && kind === 'same' && tier === 'valid' ? feat.nextAbove : ref; out.missed = Math.max(0, Math.floor((Math.min(cap, ref) - 10 - p) / 10) * 10); }
      out.verdict = ['많이 싸게 팔림', '조금 싸게 팔림', '적정 — 최저가와 비슷', '잘 받음', '아주 잘 받음'][out.score + 2];
      notes.push(`${how} ${ref.toLocaleString()}원보다 ${r >= 0 ? '+' : ''}${(r * 100).toFixed(0)}%`);
      if (out.missed >= 100) notes.push(`약 ${out.missed.toLocaleString()}원 더 받을 수 있었음`);
      if (out.score <= 0 && feat.days != null && feat.days <= 3) notes.push(`등록 ${feat.days}일 만에 팔림 — 값을 더 올려도 됐을 신호`);
      if (out.score < 0 && feat.days != null && feat.days >= 180) notes.push(`${feat.days}일 묵은 재고 — 싸게 판 것이 손해만은 아님`);
      if (tier !== 'valid') notes.push(`⚠ 유효 판매자 매물이 없어 ${{ yellow: '노랑', orange: '주황', red: '빨강' }[tier]} 판매자 매물과 견줌 — 믿음이 낮은 기준`);
      if (out.score >= 1 && same.length && feat.rankValid > 1) notes.push(`더 싼 유효 매물 ${feat.rankValid - 1}개가 있었는데도 팔림`); }
    else if (x.ps > 0) { const sh = p / x.ps; out.ref = x.ps; out.refHow = '새상품 판매가'; out.refKind = 'new'; out.tier = 'new'; feat.refKind = 'new'; feat.tier = 'new'; out.ratio = Math.round((sh - 1) * 1000) / 1000;
      out.score = valid.length === 0 && oth.length === 0 ? (sh < 0.35 ? -1 : 0) : 0; out.verdict = oth.length === 0 ? '단독 매물' : '유효 매물 없음';
      notes.push(`비교할 유효 매물이 없어 새상품 판매가의 ${(sh * 100).toFixed(0)}%로 봄`); if (out.score < 0) notes.push('단독인데 새상품가의 35% 아래 — 더 받을 여지'); }
    else { out.why = '그때 시장 자료(첫 페이지)·새상품가가 없어 평가 못 함'; return out; }
    if (soldOut) notes.push(`새상품 ${x.av} — 희소${out.score != null && out.score <= 0 ? ', 더 받을 여지' : ''}`);
    out.why = notes.join(' · '); return out; }

  /* ══ (0.3.0) 🧠 판매가치 엔진 v1 — VALUE (정범님 10/19 '가격 판정이 사업의 근간 · 근거로 스스로 배우는 도구')
   * 근거(10/19 분석 · 우리 판매중 상품의 하루 모습 17만 상품·일 + 판매 260건 · 판매완료 9,657권): ① 수요(Sales Point)가 높을수록 첫 페이지 '자리'가 판매를 좌우 —
   *   SP 1,000~4,999: 1~3위 하루 7~8‰ vs 4위 밖 1.4‰ · SP 5,000+: 1~3위 10~12‰ vs 4위 밖 0.6‰ · SP 200 미만은 자리가 거의 상관없음(0.5~1.2‰)
   * ② 동급 최저가보다 비쌀수록 판매 확률이 떨어짐(같거나 쌈 2.45‰ → +30~100% 0.95‰ → +100%↑ 0.45‰) ③ 수요 있는데 공급이 적은 책(SP 200+ · 중고 0~2개)은 87%가 팔림
   * 모델 = 칸 표(수요 단계 × 자리) + 값 보정(동급 최저 대비) — 칸마다 판매 수·상품·일 수를 그대로 두고(누구나 검산) 적은 칸은 전체 평균 쪽으로 당김(베이즈 수축) · 매일 밤 클라우드가 다시 배움 */
  const VDEF = { spEdges: [50, 200, 1000, 5000], usedEdges: [2, 9, 29, 99], posTop: 3, ratioEdges: [1.0001, 1.10, 1.30, 2.0], prior: 2000, maxDrop: 40, listEdges: [0.35, 0.5], highDemandBand: 2,
    rareDemandBand: 2, rareSupplyBand: 1, scarceSupplyBand: 0, scarceDemandMax: 1, commonDemandBand: 3, commonSupplyBand: 4 };
  const band = (v, edges) => { if (v == null || !Number.isFinite(+v)) return null; let i = 0; while (i < edges.length && +v >= edges[i] + (edges === VDEF.usedEdges ? 1 : 0)) i++; return i; };
  const spBand = (sp, c) => { if (sp == null) return null; const E = (c || VDEF).spEdges; let i = 0; while (i < E.length && sp >= E[i]) i++; return i; };
  const usedBand = (u, c) => { if (u == null) return null; const E = (c || VDEF).usedEdges; let i = 0; while (i < E.length && u > E[i]) i++; return i; };
  const posBand = (rank, c) => (rank == null ? null : rank <= ((c || VDEF).posTop) ? 0 : 1);
  const listBand = (p, list, c) => { if (!p || !list || list <= 0) return null; const r = p / list, E = (c || VDEF).listEdges || VDEF.listEdges; let i = 0; while (i < E.length && r >= E[i]) i++; return i; };
  const ratioBand = (p, sameMin, c) => { if (!p || !sameMin) return null; const r = p / sameMin, E = (c || VDEF).ratioEdges; let i = 0; while (i < E.length && r > E[i]) i++; return i; };
  /* valueTrain(obs) — obs: [{sp, used, rank, price, sameMin, y(0/1 그날 팔림)}] → 모델 { cells: {'d|p': [판매, 상품·일]}, ratio: {'r': [판매, n]}, all, n, pos } */
  function valueTrain(obs, c) { c = { ...VDEF, ...(c || {}) }; const cells = {}, ratio = {}, demand = {}, cells3 = {}; let n = 0, pos = 0;
    for (const o of obs) { const d = spBand(o.sp, c), p = posBand(o.rank, c); if (d == null || p == null) continue; n++; pos += o.y ? 1 : 0; const k = d + '|' + p; (cells[k] = cells[k] || [0, 0]); cells[k][0] += o.y ? 1 : 0; cells[k][1]++; (demand[d] = demand[d] || [0, 0]); demand[d][0] += o.y ? 1 : 0; demand[d][1]++;
      const lb = listBand(o.price, o.list, c); if (lb != null) { const k3 = k + '|' + lb; (cells3[k3] = cells3[k3] || [0, 0]); cells3[k3][0] += o.y ? 1 : 0; cells3[k3][1]++; }
      const r = ratioBand(o.price, o.sameMin, c); if (r != null) { (ratio[r] = ratio[r] || [0, 0]); ratio[r][0] += o.y ? 1 : 0; ratio[r][1]++; } }
    return { kind: 'value-cells', ver: VERSION, cfg: c, cells, cells3, ratio, demand, all: n ? pos / n : 0, n, pos }; }
  /* (0.5.0) 수요×자리×정가 대비 칸 — 줄이 적으면 수요×자리 값으로 당김(같은 사전) · 표가 없거나 정가를 모르면 수요×자리 값 그대로 */
  function valueRate3(M, d, p, lb) { const base = valueRate(M, d, p); if (base == null || lb == null || p == null || !M || !M.cells3) return base; const pr = (M.cfg && M.cfg.prior) || VDEF.prior; const c = M.cells3[d + '|' + p + '|' + lb] || [0, 0]; return (c[0] + pr * base) / (c[1] + pr); }
  const LBL = ['정가의 35% 미만', '정가의 35~50%', '정가의 50% 이상'];
  // 칸의 하루 판매 확률(수축): (판매 + 사전 × 그 수요 단계 평균) ÷ (상품·일 + 사전)
  function valueRate(M, d, p) { if (!M || d == null) return null; const pr = (M.cfg && M.cfg.prior) || VDEF.prior; const dm = M.demand && M.demand[d] ? (M.demand[d][0] + pr * M.all) / (M.demand[d][1] + pr) : M.all; if (p == null) return dm; const c = M.cells[d + '|' + p] || [0, 0]; return (c[0] + pr * dm) / (c[1] + pr); }
  function ratioMult(M, rb) { if (!M || rb == null || !M.ratio) return 1; const pr = (M.cfg && M.cfg.prior) || VDEF.prior; const base = M.all || 1e-9; const c = M.ratio[rb] || [0, 0]; const r = (c[0] + pr * base) / (c[1] + pr); const r0c = M.ratio[0] || [0, 0]; const r0 = (r0c[0] + pr * base) / (r0c[1] + pr); return r0 ? r / r0 : 1; }
  /* valueOf(x, M) — x: {price, grade, sp, used, avail, rank, sameMin, third(첫 페이지 3번째로 싼 다른 매물 값), bb(알라딘 매입가), list}
   * → { demand, supply, rarity{cls, label, why}, strategy{kind, label, why, target}, p{now, top}, rev{now, top}, gain(하루 기대 매출 차이) } */
  function valueOf(x, M, cfg) { const c = { ...VDEF, ...((M && M.cfg) || {}), ...(cfg || {}) }; x = x || {}; const d = spBand(x.sp, c), u = usedBand(x.used, c); const out = { d, u, sp: x.sp ?? null, used: x.used ?? null };
    const DL = ['수요 매우 낮음', '수요 낮음', '수요 보통', '수요 높음', '수요 매우 높음'], UL = ['공급 0~2', '공급 3~9', '공급 10~29', '공급 30~99', '공급 100+'];
    out.demandLabel = d == null ? '수요 모름' : DL[d]; out.supplyLabel = u == null ? '공급 모름' : UL[u];
    const sold = /절판|품절/.test(String(x.avail || ''));
    let cls = 'normal', why = '';
    if (d != null && u != null && ((d >= c.rareDemandBand && u <= c.rareSupplyBand) || (d >= 3 && u <= 2))) { cls = 'scarce'; why = `찾는 사람(${out.demandLabel} · SP ${x.sp})에 비해 시장에 적음(${out.supplyLabel})`; }
    else if (u != null && u <= c.scarceSupplyBand && (d == null || d <= c.scarceDemandMax)) { cls = 'rare'; why = `시장에 거의 없음(${out.supplyLabel})${sold ? ' · 새상품 ' + x.avail : ''} — 지금 찾는 사람은 적지만(${out.demandLabel}) 만든 수 자체가 적은 책`; }
    else if (d != null && u != null && d >= c.commonDemandBand && u >= c.commonSupplyBand) { cls = 'mass'; why = `찾는 사람도 많고(${out.demandLabel}) 매물도 많음(${out.supplyLabel}) — 자리 싸움`; }
    out.rarity = { cls, label: { scarce: '희소', rare: '희귀(적게 남음)', mass: '대중', normal: '보통' }[cls], why, score: x.sp != null && x.used != null ? Math.round((x.sp + 1) / (x.used + 1) * 10) / 10 : null };
    const p = posBand(x.rank, c); const rb = ratioBand(x.price, x.sameMin, c); const lbNow = listBand(x.price, x.list, c); const rNow = valueRate3(M, d, p, lbNow), rTop0 = valueRate3(M, d, 0, lbNow); let rTop = rTop0; const mNow = ratioMult(M, rb);
    out.p = { now: rNow, top: rTop, pos: p, ratioBand: rb, ratioMult: mNow, listBand: lbNow, listPct: x.price && x.list ? Math.round(x.price / x.list * 100) : null };
    let kind = 'keep', label = '그대로', swhy = '', target = null;
    if (cls === 'rare') { kind = 'collector'; label = '기다림(희귀)'; swhy = '만든 수가 적은 책 — 싸게 내놓지 않음 · 동급 최저 아래로 내리지 않고 찾는 사람을 기다림 · 상태·판매자 허위 여부를 더 꼼꼼히'; target = x.sameMin && x.price < x.sameMin ? x.sameMin : null; }
    else if (cls === 'scarce') { kind = 'premium'; label = '올려도 됨(희소)'; swhy = '찾는 사람에 비해 매물이 적어 87%가 팔리는 칸 — 1위일 필요 없음 · 위 등급 최저가 근처까지 받아도 됨'; target = null; }
    else if (d != null && d >= c.highDemandBand) { if (p === 0) { kind = 'hold'; label = '자리 지킴'; swhy = `찾는 사람이 많은 책은 1~3위 자리가 판매를 좌우(1~3위 ${((rTop || 0) * 1000).toFixed(1)}‰/일 vs 4위 밖 ${((valueRate(M, d, 1) || 0) * 1000).toFixed(1)}‰) — 지금 자리면 더 내리지 않음`; }
      else { kind = 'top3'; label = '3위 안으로'; swhy = `찾는 사람이 많은데 4위 밖 — 1~3위면 하루 판매 확률이 ${(rTop && rNow ? rTop / rNow : 0).toFixed(1)}배 · 1위일 필요는 없고 3위 값 바로 아래면 됨`; target = x.third ? Math.max(1, x.third - (x.third >= 10000 ? 500 : x.third >= 1000 ? 50 : 10)) : x.sameMin || null; const pr0 = +x.price || 0; if (target && pr0 && rTop != null && rNow != null && (target < pr0 * (1 - (c.maxDrop != null ? c.maxDrop : 40) / 100) || rTop * target <= rNow * pr0)) { kind = 'far'; label = '3위가 너무 멂(값 지킴)'; swhy = `3위 값(${target.toLocaleString()}원)이 지금 값보다 ${Math.round((1 - target / pr0) * 100)}% 낮음 — 3위로 가면 판매 확률은 ${(rTop / rNow).toFixed(1)}배지만 기대 매출(확률×값)이 ${rTop * target <= rNow * pr0 ? '오히려 줄어듦' : '최대 인하 폭(' + (c.maxDrop != null ? c.maxDrop : 40) + '%)을 넘음'} · 상태·등급이 더 나은지 확인하고 지금 값 유지`; target = null; }
        else if (target && x.bb && target <= x.bb) { kind = 'buyback'; label = '알라딘에 팔기 검토'; swhy += ` — 3위 값(${target.toLocaleString()}원)이 알라딘 매입가(${x.bb.toLocaleString()}원) 이하: 시장보다 알라딘 매입이 나음`; } } }
    else { kind = 'margin'; label = '값 지킴(자리 무관)'; swhy = `찾는 사람이 적은 책은 1위여도 판매 확률이 거의 같음(1~3위 ${((rTop || 0) * 1000).toFixed(1)}‰ vs 밖 ${((valueRate(M, d, 1) || 0) * 1000).toFixed(1)}‰) — 값을 내려 자리를 잡는 것은 마진만 깎음`; }
    if (target && x.list) { rTop = valueRate3(M, d, 0, listBand(target, x.list, c)); out.p.top = rTop; }
    out.strategy = { kind, label, why: swhy, target };
    const pr = +x.price || 0; out.rev = { now: rNow != null ? rNow * pr : null, top: target && rTop != null ? rTop * target : null }; out.gain = out.rev.now != null && out.rev.top != null ? out.rev.top - out.rev.now : null;
    return out; }
  /* (0.4.0) 🧠 valueRec(x, M, cfg, opt) — 아직 우리 가격이 없는 책(등록·매입 조회)에 판매가치 엔진을 씀. 웹앱 등록 카드·매입 도구가 같은 한 곳
   *  x = { grade, sp, used, avail(새상품 상태 글), bb(그 등급 알라딘 매입가), list(정가), sales(새책 판매가), rows: 첫 페이지 [{p, g, c(판매자 분류: ours·aladin·dkgreen·green·yellow·orange·red·unknown), so(품절)}],
   *        cost(권당 매입가 · 없으면 opt.unitCost), stock(우리 지금 재고 같은 책 권수), sold({ n, days, avg } 우리 같은 책 판매 이력), factors([{ k, label, rate, n, base }] 확정된 요인 판매율) }
   *  opt = { stepDown(p) 한 가격 단위 아래, feeRate 수수료율, unitCost 평균 권당 매입가, fallback({ t, why }) 비교 매물이 없을 때 기존 엔진 추천가 }
   *  돌려줌 { price, how, reasons[], strat, rarity, demandLabel, supplyLabel, p(하루 판매 확률), sell90/180/365, expDays, rank, buy: { verdict(buy·maybe·skip·aladin), label, profit365, net, cost, costFrom, pro[], con[] } } */
  function valueRec(x, M, cfg, opt) { const c = { ...VDEF, ...((M && M.cfg) || {}), ...(cfg || {}) }; x = x || {}; opt = opt || {}; const R = [];
    const step = opt.stepDown || ((p) => Math.max(10, p - (p >= 10000 ? 500 : p >= 1000 ? 50 : 10)));
    const rows = (x.rows || []).filter((w) => w && w.c !== 'ours' && +w.p > 0 && !w.so).map((w) => ({ ...w, p: +w.p })).sort((a, b) => a.p - b.p);
    const VALID = new Set(['aladin', 'dkgreen', 'green']); const sameV = rows.filter((w) => w.g === x.grade && VALID.has(w.c)); const sameMin = sameV.length ? sameV[0].p : null; const anyMin = rows.length ? rows[0].p : null;
    const base = valueOf({ price: null, grade: x.grade, sp: x.sp, used: x.used, avail: x.avail, rank: null, sameMin, third: rows.length ? rows[Math.min(2, rows.length - 1)].p : null, bb: x.bb, list: x.list }, M, cfg);
    const d = base.d; const cls = base.rarity.cls; let price = null, how = '', strat = 'keep';
    const third = rows.length >= c.posTop ? rows[c.posTop - 1].p : null;
    if (cls === 'rare') { strat = 'collector'; if (sameMin) { price = sameMin; how = `💠 희귀 — 같은 등급 유효 최저가 ${sameMin.toLocaleString()}원과 동가(더 싸게 내놓지 않음)`; } }
    else if (cls === 'scarce') { strat = 'premium'; const hi = sameMin || anyMin; if (hi) { price = Math.max(hi, third || 0); how = `💎 희소 — 찾는 사람이 매물보다 많아 1위일 필요 없음: ${third && third > (sameMin || 0) ? `첫 페이지 ${c.posTop}번째 값 ${third.toLocaleString()}원` : `같은 등급 유효 최저가 ${hi.toLocaleString()}원과 동가`}`; } }
    else if (d != null && d >= c.highDemandBand) { strat = 'top3'; if (third) { price = step(third); how = `🎯 수요 높음 — 첫 페이지에서 우리를 뺀 매물 중 ${c.posTop}번째로 싼 ${third.toLocaleString()}원보다 한 단위 아래(1~${c.posTop}위 자리 · 1위일 필요 없음)`; if (sameMin && price < sameMin * 0.6) { price = sameMin; how = `🎯 수요 높음 — ${c.posTop}번째 값(${third.toLocaleString()}원)이 같은 등급 유효 최저가의 60% 아래(무효·싼 등급 매물)라 같은 등급 유효 최저가 ${sameMin.toLocaleString()}원과 동가`; } }
      else if (rows.length) { price = sameMin || rows[rows.length - 1].p; how = `🎯 수요 높음 — 첫 페이지 매물이 ${rows.length}개뿐이라 이 값이면 1~${c.posTop}위: ${sameMin ? '같은 등급 유효 최저가와 동가' : '가장 비싼 매물과 동가'}`; } }
    else if (d == null) { strat = 'keep'; if (sameMin || anyMin) { price = sameMin || anyMin; how = `수요 모름(Sales Point 없음) — 기본: ${sameMin ? '같은 등급 유효 최저가' : '첫 페이지 최저가'} ${price.toLocaleString()}원과 동가 · Sales Point가 읽히면 다시 판정`; } }
    else { strat = 'margin'; if (sameMin || anyMin) { price = sameMin || anyMin; how = `💰 수요 낮음 — 자리가 판매를 거의 안 바꿈: ${sameMin ? '같은 등급 유효 최저가' : '첫 페이지 최저가'} ${price.toLocaleString()}원과 동가(더 싸게 내도 판매가 늘지 않아 마진만 줄어듦)`; } }
    if (price == null && opt.fallback && opt.fallback.t != null) { price = opt.fallback.t; how = `비교할 매물이 없어 기존 판정 엔진 추천가 — ${opt.fallback.why || ''}`.trim(); }
    R.push(how || '판정 재료 부족 — 시장 매물·Sales Point가 없음');
    R.push(`수요: ${base.demandLabel}(Sales Point ${x.sp ?? '-'}) · 공급: ${base.supplyLabel}(알라딘 중고 ${x.used ?? '-'}개)${base.rarity.why ? ' · ' + base.rarity.label + ': ' + base.rarity.why : ''}`);
    let rank = null, p = null; if (price != null) { rank = rows.filter((w) => w.p < price).length + 1; const pb = posBand(rank, c); const lb = listBand(price, x.list, c); p = valueRate3(M, d, pb, lb);
      if (lb != null && M && M.cells3 && d != null) { const rs = [0, 1, 2].map((b) => valueRate3(M, d, pb, b)); R.push(`정가 대비 ${Math.round(price / x.list * 100)}%(${LBL[lb]}) — 같은 수요·자리에서 하루 판매 확률: ${rs.map((v, b) => `${LBL[b].replace('정가의 ', '')} ${((v || 0) * 1000).toFixed(1)}‰`).join(' · ')}`); } if (p != null) R.push(`이 값이면 첫 페이지 ${rank}위 → 하루 판매 확률 ${(p * 1000).toFixed(1)}‰(같은 수요·자리 우리 상품의 실제 판매) · 90일 안 ${Math.round((1 - Math.pow(1 - p, 90)) * 100)}% · 1년 안 ${Math.round((1 - Math.pow(1 - p, 365)) * 100)}%`); }
    if (x.bb && price != null && price <= x.bb) R.push(`⚠ 추천가(${price.toLocaleString()}원)가 알라딘 매입가(${(+x.bb).toLocaleString()}원) 이하 — 등록보다 알라딘에 파는 것이 나음`);
    const sv = (n) => (p == null ? null : 1 - Math.pow(1 - p, n));
    const out = { ver: VERSION, price, how, reasons: R, strat, rarity: base.rarity, demandLabel: base.demandLabel, supplyLabel: base.supplyLabel, d, u: base.u, sp: x.sp ?? null, used: x.used ?? null, rank, p, sell90: sv(90), sell180: sv(180), sell365: sv(365), expDays: p ? Math.round(1 / p) : null, sameMin, anyMin, third };
    /* 매입 판단 — 1년 기대 이익 = 1년 안 팔릴 확률 × (추천가 − 수수료) − 매입가 (안 팔린 몫은 0으로 봄: 폐기·알라딘 매입은 따로 '알라딘에 바로 팔기'로 비교) */
    const fee = opt.feeRate != null ? +opt.feeRate : 0.1; const cost = x.cost != null && x.cost !== '' ? +x.cost : opt.unitCost != null ? +opt.unitCost : null; const costFrom = x.cost != null && x.cost !== '' ? '이 책 매입가' : opt.unitCost != null ? '평균 권당 매입가' : null;
    const pro = [], con = []; const net = price != null ? price * (1 - fee) : null; const profit365 = net != null && out.sell365 != null && cost != null ? out.sell365 * net - cost : null;
    if (d != null && d >= c.highDemandBand) pro.push(`찾는 사람이 많음 — Sales Point ${x.sp}(${base.demandLabel}) · 이 수요의 우리 책은 1~${c.posTop}위면 하루 ${((valueRate(M, d, 0) || 0) * 1000).toFixed(1)}‰ 팔림`);
    else if (d != null && d <= 0) con.push(`찾는 사람이 거의 없음 — Sales Point ${x.sp ?? 0} · 이 수요의 우리 책은 하루 ${((valueRate(M, d, null) || 0) * 1000).toFixed(1)}‰(1년 안 ${Math.round((1 - Math.pow(1 - (valueRate(M, d, null) || 0), 365)) * 100)}%)`);
    if (cls === 'scarce') pro.push('💎 희소 — 매물보다 찾는 사람이 많음 · 우리 판매로 확인한 칸(SP 200~999 & 중고 0~2개)은 87% 팔림');
    if (cls === 'rare') con.push('💠 희귀(적게 남음)이지만 찾는 사람이 적음 — 적게 남았다고 팔리지 않음(SP 50 미만 & 중고 0~2개는 19%만 팔림) · 매입가가 낮을 때만');
    if (x.used != null && x.used >= 100) (d != null && d >= 3 ? pro : con).push(`알라딘 중고가 ${x.used}개 — ${d != null && d >= 3 ? '많이 나도는 만큼 찾는 사람도 많음' : '매물이 많아 값 경쟁이 셈'}`);
    if (/절판|품절/.test(String(x.avail || ''))) pro.push(`새상품 ${String(x.avail).match(/절판|품절/)[0]} — 새책으로 살 수 없음`);
    if (x.bb && cost != null && x.bb * 1 > cost) pro.push(`알라딘 매입가 ${(+x.bb).toLocaleString()}원 > 매입가 ${Math.round(cost).toLocaleString()}원 — 안 팔려도 알라딘에 팔아 남김`);
    if (x.bb && price != null && price <= x.bb) con.push(`시장 값(${price.toLocaleString()}원)이 알라딘 매입가 이하 — 사면 바로 알라딘에 파는 쪽`);
    if (anyMin != null && anyMin <= 1000) con.push(`첫 페이지 최저가 ${anyMin.toLocaleString()}원 — 1,000원 이하 경쟁`);
    if (x.stock) con.push(`우리 재고에 같은 책 ${x.stock}권 — 같은 책끼리 경쟁`);
    if (x.sold && x.sold.n) pro.push(`우리가 이 책을 ${x.sold.n}권 판 적 있음${x.sold.avg ? ` · 평균 ${Math.round(x.sold.avg).toLocaleString()}원` : ''}${x.sold.days != null ? ` · 마지막 판매 ${x.sold.days}일 전` : ''}`);
    (x.factors || []).forEach((f) => { if (!(f.n >= 30) || f.rate == null || f.base == null) return; const r = f.rate / f.base; const t = `${f.label} — 우리 판매율 ${Math.round(f.rate * 100)}%(전체 ${Math.round(f.base * 100)}% · ${f.n.toLocaleString()}권)`; if (r >= 1.25) pro.push(t); else if (r <= 0.75) con.push(t); });
    let verdict = 'maybe', label = '판단 보류';
    if (x.bb && cost != null && x.bb >= cost && (price == null || price <= x.bb * 1.2)) { verdict = 'aladin'; label = '사서 알라딘에 바로 팔기'; }
    else if (profit365 != null) { if (profit365 > 0 && (out.sell365 || 0) >= 0.5) { verdict = 'buy'; label = '매입 추천'; } else if (profit365 > 0) { verdict = 'maybe'; label = '조건부 — 남지만 오래 걸림'; } else { verdict = 'skip'; label = '매입 비추천'; } }
    out.buy = { verdict, label, profit365, net, cost, costFrom, fee, pro, con };
    return out; }
  const api = { VERSION, VDEF, valueRec, valueRate3, listBand, spBand, usedBand, posBand, ratioBand, valueTrain, valueRate, ratioMult, valueOf, HORIZON_D, FEATURES, SALE_EVAL_VER, evalSale, rawRow, withPrice, feats, train, trainBase, predict, evaluate, shouldPromote, dailyValue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowML = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
