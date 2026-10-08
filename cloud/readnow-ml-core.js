/* readnow-ml-core.js — 스스로 배우기 (개편 6단계 · 공용 파일)
 * 묻는 것 하나: "이 상품이 이 가격이면 7일 안에 팔릴 확률은?" (팔릴 확률 모델)
 * 재료: 클라우드가 매일 쌓는 판매중 상품의 하루 모습(ml_days) + 그 뒤 실제 판매(주문). 같은 행(rawRow)을 클라우드·웹앱이 이 파일 한 곳에서 만듦.
 * 모델: 로지스틱 회귀(특징 표준화 + L2) — 자료가 적을 때 흔들리지 않고, 계수를 사람이 읽을 수 있음. 자료가 쌓이면 더 큰 모델로 바꿀 자리(MODEL_KIND)
 * 순서(클라우드 밤 작업): ① 배우기(7일이 지나 결과를 아는 날들) → ② 그림자(오늘 상품마다 확률을 적어 두기만, 쓰지 않음) → ③ 7일 뒤 실제 판매와 맞춰 채점
 *   → ④ 새 모델이 지금 모델보다 3번 연속 확실히 나으면(로그 손실 1% 넘게 낮음) 승격. 처음 '지금 모델'은 기준선(자리 1위 여부·등급별 평균 판매율)
 * 쓰는 곳: 웹앱 전략도구의 조언 금액(그림자 표시), 앞으로 판정 엔진의 '권당 하루 기대 순이익'. 알라딘에 아무것도 바꾸지 않음 — 계산만. */
(function (root) {
  const VERSION = '0.1.0';
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
  const api = { VERSION, HORIZON_D, FEATURES, rawRow, withPrice, feats, train, trainBase, predict, evaluate, shouldPromote, dailyValue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowML = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
