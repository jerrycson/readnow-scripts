/* readnow-ml-core.js — 스스로 배우기 (개편 6단계 · 공용 파일)
 * 묻는 것 하나: "이 상품이 이 가격이면 7일 안에 팔릴 확률은?" (팔릴 확률 모델)
 * 재료: 클라우드가 매일 쌓는 판매중 상품의 하루 모습(ml_days) + 그 뒤 실제 판매(주문). 같은 행(rawRow)을 클라우드·웹앱이 이 파일 한 곳에서 만듦.
 * 모델: 로지스틱 회귀(특징 표준화 + L2) — 자료가 적을 때 흔들리지 않고, 계수를 사람이 읽을 수 있음. 자료가 쌓이면 더 큰 모델로 바꿀 자리(MODEL_KIND)
 * 순서(클라우드 밤 작업): ① 배우기(7일이 지나 결과를 아는 날들) → ② 그림자(오늘 상품마다 확률을 적어 두기만, 쓰지 않음) → ③ 7일 뒤 실제 판매와 맞춰 채점
 *   → ④ 새 모델이 지금 모델보다 3번 연속 확실히 나으면(로그 손실 1% 넘게 낮음) 승격. 처음 '지금 모델'은 기준선(자리 1위 여부·등급별 평균 판매율)
 * 쓰는 곳: 웹앱 전략도구의 조언 금액(그림자 표시), 앞으로 판정 엔진의 '권당 하루 기대 순이익'. 알라딘에 아무것도 바꾸지 않음 — 계산만. */
(function (root) {
  const VERSION = '0.9.1'; // (0.9.1) ⚡ 전략 독립 검토 고침 — 자기가 멈춘 것만 내놓기·기다림 되풀이 막기·빈 첫 쪽/우리 줄 없음/오래된 신호 안 씀·등급 모르는 매물도 경쟁·🐢는 매입가 알 때만·사람 수정 감지·되돌림 쉬기·설정 값 범위 // (0.9.0) ⚡ 전략 실행(STRATS · stratDecide · stratGuard — 웹앱 미리 보기와 클라우드 실행이 같은 판단) // (0.8.2) extrasOf: 도서관·바코드·가격표 스티커와 넘버링 도장은 특전·한정에서 뺌 // (0.8.1) bbAccept: 불가 내역을 다 읽기 전엔 우리 상태별 매입률을 쓰지 않음 // (0.8.0) valueTrain 무게(w)·판매 수(y) — 벤치마킹 사라짐 표본 · extrasOf(유의 사항의 박스·미개봉·특전·한정판·사인) // (0.7.0) // (0.7.0) 기대 매입가에 매입될 확률(bbAccept — 매입불가 상품 내역까지 읽은 실측) // (0.6.0) 알라딘 매입 기대값(bbExpect — 우리 실제 매입 기록의 등급별 지급 비율 · 유의 사항에 하자가 있으면 매입 없음) · 하자 표시(defectOf) // (0.5.1) rawRow: 첫 페이지 못 읽으면 자리 null · top(맨 윗줄이 우리 = 최저가배지) // (0.5.0) 정범님 10/19 '정가가 고객의 첫 기준' — 정가 대비 우리 값 칸(<35%·35~50%·50%+)을 수요×자리 칸 안에서 배움(cells3 · 줄이 적으면 수요×자리 값으로 당김) · valueOf·valueRec가 씀 // (0.4.0) 🧠 valueRec — 등록·매입 때 판매가치 엔진으로 추천가·판매 확률·매입 판단(살 이유·사지 말 이유) 한 곳 // (0.3.0) 🧠 판매가치 엔진 v1(VALUE) — 수요(Sales Point)×자리(첫 페이지 순위)×값(동급 최저 대비)의 하루 판매 확률 표를 우리 판매 자료로 매일 배움 · 희소/희귀 분류 · 상품마다 전략과 기대 판매 // (0.2.2) 판매가 평가 v0.2 — 유효 안에서 기준이 없으면 노랑 → 주황 → 빨강 판매자 매물 안에서 같은 순서로 · out.tier // (0.2.1) 판매가 평가 v0.1 — 동급이 없으면 위 등급(우리보다 쌈)·아래 등급(우리보다 비쌈) 유효 최저가와 견줌 · refKind(same·hi·lo·conv·new)·refG // (0.2.0) 💬 판매가 평가 evalSale v0 — 팔린 상품의 그때 시장으로 '싸게/적정/잘 받음' (정범님 평가를 정답으로 모아 다음 판이 배움)
  const HORIZON_D = 7; // 7일 안에 팔렸나
  const GR = ['최상', '상', '중'];
  /* rawRow: 하루 모습 한 줄 (클라우드 ml_days ML_VER 1과 같은 칸) — l = 상품(prd_listings), m = 시장 지표(prd_book_metrics), a = 마지막 가격 변경 {at, from, batchId}, wg = 감시 그룹, nowMs = 그날 끝 */
  /* (0.6.0) 🏷 알라딘 매입은 '시세'가 아니라 조건부 출구 — 정범님 10/20: 알라딘은 눈에 보이는 손상·3쪽 넘는 낙서가 있으면 매입하지 않을 만큼 보수적 → 알라딘 매입가에 너무 기대지 않음
   *  우리 실제 매입 기록(pur_buyback · 끝난 접수 40건 627권, 10/20 집계): 보낸 책은 모두 매입됐지만 최상으로 신청한 31권 중 24권(77%)을 중·상으로 낮춰 사서 받은 돈은 신청액의 86% · 상 37권 중 2권·중 34권 중 2권만 낮춤
   *  → 기대 매입가 = 견적 × 등급별 지급 비율(클라우드가 매일 다시 셈: app_settings/buyback_stats → setBuyback) · 유의 사항에 낙서·필기·밑줄·얼룩·찢김 같은 하자가 있으면 매입 없음(null)
   *  ⚠ 견적이 있는 책 자체가 시장 지표의 38%뿐(33,493권 중 12,850권) — 견적 없는 책은 처음부터 매입 출구가 없음 */
  const BB_PAY = { 최상: 0.86, 상: 1.0, 중: 0.99 }; let BBS = null;
  function setBuyback(doc) { BBS = doc && (doc.byGrade || doc.byOur) ? doc : null; }
  /* (0.7.0) 정범님 10/20: 매입불가 상품 내역까지 읽어 다시 셈 — 기대 매입가 = 견적 × 지급 비율 × 매입될 확률
   *  매입될 확률 = 우리 상태별 실측(15권 넘으면) → 전체 실측(buyback_stats.accept = 매입 ÷ 신청) → 없으면 BB_ACC(2026-10-20 실측 627 ÷ 928권) */
  const BB_ACC = 0.676; function bbAccept(grade) { const o = BBS && BBS.byOur && !(BBS.unread > 0) && BBS.byOur[grade]; /* (0.8.1) 불가 사유를 아직 다 안 읽었으면 우리 상태별 줄에 불가 책이 빠져 있어 100%로 보임 → 그동안은 전체 매입률(매입 ÷ 신청)만 */ if (o && o.bought + o.rejected >= 15 && o.accept != null) return { p: o.accept, src: `우리 ${grade} ${o.bought}/${o.bought + o.rejected}권` }; if (BBS && BBS.accept != null) return { p: BBS.accept, src: `전체 ${BBS.bought}/${BBS.reqN}권` }; return { p: BB_ACC, src: '10/20 실측 627/928권' }; }
  const DEFECT_RX = /낙서|필기|밑줄|형광펜|공부\s*(한\s*)?흔적|줄\s*긋|줄\s*그|메모\s*(있|흔적)|얼룩|물\s*(먹|젖)|곰팡|찢|파손|훼손|낱장|떨어짐|분리|제본\s*(불량|풀림)|냄새/;
  const HEAVY_RX = /전반|전체|절반|대부분|상당|많|다수|곳곳|군데군데|여러\s*(쪽|장|페이지|곳)|심함|심한/;
  function defectOf(t) { t = String(t || '').replace(/\s+/g, ' '); if (!t || !DEFECT_RX.test(t)) return null; const pg = (t.match(/(\d+)\s*(쪽|장|페이지|p)/i) || [])[1]; return { heavy: HEAVY_RX.test(t) || (pg != null && +pg > 3), text: t.slice(0, 120) }; }
  /* (0.8.0) 🎁 희귀 요소 — 정범님 10/20: 박스·공장 비닐 그대로(미개봉·밀봉 — 판매자가 OPP로 다시 싼 것은 아님)·특전/부록/사은품·한정판·사인 같은 '값을 부풀리는 요소'를 유의 사항 글에서 찾음
   *  extrasOf(글) → { box, sealed, opp, bonus, limited, signed, missing:[빠졌다고 쓴 요소] } — '없음·미포함·분실·빠짐'이 바로 뒤에 붙으면 그 요소는 '빠짐'으로 */
  const EX_RX = { box: /(박스|케이스|슬립\s*케이스|하드\s*케이스|함\s*포함|양장\s*케이스|BOX)/i, sealed: /(미개봉|밀봉|공장\s*(비닐|포장)|비닐\s*(포장\s*)?(그대로|미개봉|안\s*뜯|뜯지\s*않)|수축\s*(비닐|포장)|새\s*상품\s*그대로|포장\s*그대로|씰\s*(그대로|미개봉))/, opp: /(OPP|opp|재\s*포장|비닐\s*(커버|로\s*(감|싸|포장))|비닐\s*(을|는)?\s*(뜯|개봉|제거|벗))/, bonus: /(특전|부록|사은품|엽서|포스터|굿즈|스티커|책갈피|북마크|별책|포토\s*카드|포토카드|브로마이드|키링|CD\s*포함|DVD\s*포함|증정)/, limited: /(한정\s*판|한정\s*수량|초판\s*한정|리미티드|limited|넘버링|일련\s*번호|초판\s*1쇄|초판본)/i, signed: /(사인본|싸인본|친필\s*(사인|싸인|서명)|저자\s*(사인|싸인|서명)|사인\s*(있|포함|된)|서명본)/ };
  const EX_NEG = /^[^.。!\n]{0,8}(없|미포함|분실|빠짐|빠져|누락|불포함|제외|X\b)/;
  function extrasOf(text) { const t = String(text || ''); const out = { box: false, sealed: false, opp: false, bonus: false, limited: false, signed: false, missing: [] }; if (!t.trim()) return out;
    for (const [k, rx] of Object.entries(EX_RX)) { const g = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g'); let m, pos = false, neg = false; while ((m = g.exec(t))) { const after = t.slice(m.index + m[0].length, m.index + m[0].length + 12); if (k === 'box' && /^\s*(에\s*)?(포장|발송|배송|택배|담아|담겨|으로|로\s*(포장|발송|배송|보내))/.test(after)) continue; /* 배송 박스는 아님 */ const before = t.slice(Math.max(0, m.index - 12), m.index); if ((k === 'bonus' || k === 'limited') && (/(도서관|바코드|가격|라벨|레이블|대여점|관리)\s*$|(도서관|바코드|가격표|라벨|레이블)[^.,\n]{0,6}$/.test(before) || /^\s*(스탬프|스템프|도장|제거|자국|흔적|떼)/.test(after))) continue; /* (0.8.2) 도서관 바코드 스티커·넘버링 도장은 특전·한정이 아님 */ if (EX_NEG.test(after)) neg = true; else pos = true; } if (pos) out[k] = true; else if (neg) out.missing.push(k); }
    if (out.opp && out.sealed && /(비닐\s*(을|는)?\s*(뜯|개봉|제거|벗))/.test(t)) out.sealed = false; /* 뜯었다는 말이 있으면 공장 비닐 그대로가 아님 */ return out; }
  const EX_LABEL = { box: '박스·케이스', sealed: '공장 비닐 그대로(미개봉)', opp: 'OPP·다시 싼 비닐', bonus: '특전·부록·사은품', limited: '한정판·초판', signed: '사인본' };
  function bbExpect(quote, grade, cond) { if (!(+quote > 0)) return null; if (defectOf(cond)) return null; const g = BBS && BBS.byGrade && BBS.byGrade[grade]; const f = g && g.n >= 10 && g.pay > 0 ? g.pay : BB_PAY[grade] || 1; return Math.round(+quote * f * bbAccept(grade).p / 10) * 10; }
  function rawRow(l, m, a, wg, nowMs) { m = m || {}; const P1 = m.usedFirstPage || []; const oth = P1.filter((r) => String(r.sellerCode) !== '996008' && r.usedCode !== l.usedCode && r.price > 0);
    const sameMin = oth.filter((r) => r.grade === l.grade).reduce((x, r) => Math.min(x, r.price), Infinity); const minAll = oth.reduce((x, r) => Math.min(x, r.price), Infinity); const rank = l.price && P1.length ? oth.filter((r) => r.price < l.price).length + 1 : null; /* (0.5.1) 첫 페이지를 못 읽었으면 자리 모름(예전엔 1위) */ const live = P1.filter((r) => r.price > 0 && !r.soldOut); const top = live.length ? (live[0].usedCode ? (live[0].usedCode === l.usedCode ? 1 : 0) : (String(live[0].sellerCode) === '996008' && +live[0].price === +l.price ? 1 : 0)) : null; /* (0.5.1) 최저가배지 = 첫 페이지 맨 윗줄이 우리 */
    return { key: l.id, price: l.price ?? null, grade: GR.indexOf(l.grade), shelf: String(l.sku || '').slice(0, 6), age: l.registeredAt ? Math.round((nowMs - Date.parse(String(l.registeredAt).slice(0, 10) + 'T00:00:00+09:00')) / 864e5) : null,
      list: m.priceList ?? null, sp: m.salesPoint ?? null, used: m.usedTotal ?? null, p1: P1.length, rank, top, sameMin: Number.isFinite(sameMin) ? sameMin : null, minAll: Number.isFinite(minAll) ? minAll : null, bb: bbExpect((m.buyback || {})[l.grade], l.grade, l.condition), df: defectOf(l.condition) ? (defectOf(l.condition).heavy ? 2 : 1) : 0,
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
  /* (0.6.0) ⚠ 정범님 판매가 평가(ml_sale_evals.label)는 정답이 아님(정범님 10/20): 유의 사항·품절/절판·매물 수·판매 이력·책 사정·그때 상황(급함·현금 필요)까지 섞인 직감 — 1차 정답은 실제 판매(판매 장부), 평가는 약한 참고로 그때 재료·시각(labelLog)과 함께 배움 · 한 요인에 매몰되지 말고 판매가치 엔진 전체로 */
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
  /* (0.8.0) 줄마다 무게 w(= 상품·일 수)·판매 수 y — 벤치마킹 판매자 상품은 상품 하나를 '본 날 수' 무게 한 줄로(사라짐 = 판매 1) · 우리 하루 모습 줄은 w 1 그대로 */
  function valueTrain(obs, c) { c = { ...VDEF, ...(c || {}) }; const cells = {}, ratio = {}, demand = {}, cells3 = {}; let n = 0, pos = 0;
    for (const o of obs) { const d = spBand(o.sp, c), p = posBand(o.rank, c); if (d == null || p == null) continue; const w = o.w > 0 ? +o.w : 1; const y = o.y ? (o.w > 0 ? +o.y : 1) : 0; n += w; pos += y; const k = d + '|' + p; (cells[k] = cells[k] || [0, 0]); cells[k][0] += y; cells[k][1] += w; (demand[d] = demand[d] || [0, 0]); demand[d][0] += y; demand[d][1] += w;
      const lb = listBand(o.price, o.list, c); if (lb != null) { const k3 = k + '|' + lb; (cells3[k3] = cells3[k3] || [0, 0]); cells3[k3][0] += y; cells3[k3][1] += w; }
      const r = ratioBand(o.price, o.sameMin, c); if (r != null) { (ratio[r] = ratio[r] || [0, 0]); ratio[r][0] += y; ratio[r][1] += w; } }
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
    const df = x.defect || defectOf(x.cond); if (df) { out.defect = df; swhy += df.heavy ? ` · ⚠ 심한 하자(${df.text.slice(0, 40)}) — 알라딘 매입 안 됨 · 같은 등급 최저가의 50%까지 내려도 폐지값보다 나음(정범님 기준) · 상태 할인은 일반 등급 할인율보다 크게` : ` · 유의 사항 하자(${df.text.slice(0, 40)}) — 알라딘 매입은 기대하지 않음`; }
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
  /* ══════════ (0.9.0) ⚡ 전략 실행 — 정범님 10/23 '희소 전략 5가지 + 더 · 상품을 그룹으로 솎아 전략을 배정하면 상품이 저절로 전략대로 행동 · 실수하면 치명적이니 잘못될 경우를 모두 막고'
   *  이 파일 한 곳에서 '무엇을 할지'(stratDecide)와 '해도 되는지'(stratGuard)를 정함 → 웹앱 미리 보기와 클라우드 실행이 똑같은 판단(따로 짜면 미리 보기와 실제가 달라짐)
   *  ctx = { l: 우리 상품(prd_listings), m: 시장 지표(prd_book_metrics · 첫 쪽 매물 usedFirstPage), sig: 시장 흐름(mkt_signals 한 줄), sib: 같은 책 우리 다른 상품들, st: 이 상품의 전략 기록, cost: 권당 매입가, watch: 가격 감시 묶음/결정 진행 중, busy: 앞서 맡긴 수정 진행 중, now }
   *  돌려줌: { act: 'none'|'price'|'pause'|'resume'|'suggest', to, why, warn[] } — 'suggest'는 사람에게 알리기만(절대 스스로 하지 않음) */
  const ST_GR = { '최상': 3, '상': 2, '중': 1, '하': 0 };
  const stG = (g) => String(g || '').replace(/^중고\s*-?\s*/, '').trim(); const grN = (g) => ST_GR[stG(g)]; /* l.grade가 '중고-상'처럼 올 때도 */
  const SDEF = { ourSeller: '996008', maxAgeH: 30, coolH: 20, flipH: 48, humanLockH: 48, newH: 24, maxStep: 0.15, minPrice: 1000, costMult: 1.1, bbMult: 1.15, unit: 100, dayMax: 40, runMax: 15, tripPct: 0.35, tripMin: 8 };
  const SDEF_R = { maxAgeH: [1, 72], coolH: [1, 240], flipH: [6, 720], humanLockH: [1, 720], newH: [0, 240], maxStep: [0.01, 0.15], minPrice: [100, 100000], costMult: [1, 3], bbMult: [1, 3], unit: [10, 1000], dayMax: [0, 300], runMax: [0, 100], tripPct: [0.05, 1], tripMin: [1, 500] };
  /* (검토) 설정 값은 숫자로 바꾸고 범위에 맞춤 — 글자 '0.15'가 오면 한도 검사가 글자 붙이기가 되어 꺼지던 것 */ const stCfg = (cfg) => { const o = { ...SDEF }; for (const [k, v] of Object.entries(cfg || {})) { if (!(k in SDEF_R)) { if (k === 'ourSeller') o[k] = String(v); continue; } const n = +v; if (Number.isFinite(n)) o[k] = Math.min(SDEF_R[k][1], Math.max(SDEF_R[k][0], n)); } return o; };
  const stR = (p, unit) => { const u = p >= 1000 ? (unit || 100) : 10; return Math.round(p / u) * u; };
  const stDn = (p, unit) => { const u = p >= 1000 ? (unit || 100) : 10; return Math.floor(p / u) * u; }; /* 올릴 때는 버림 · 내릴 때는 올림 — 반올림으로 한도(15%)를 넘지 않게 */
  const stFloorUp = (p, unit) => { const u = p >= 1000 ? (unit || 100) : 10; return Math.ceil(p / u) * u; };
  /* 시장 읽기 — 첫 쪽 매물에서 우리 줄을 빼고, 우리 등급 이상인 다른 판매자 매물만 '경쟁'으로 셈 */
  function stratMarket(ctx, cfg) { const C = stCfg(cfg); const l = ctx.l || {}, m = ctx.m || {}; const rows0 = Array.isArray(m.usedFirstPage) && m.usedFirstPage.length ? m.usedFirstPage : null; /* (검토) 빈 첫 쪽 []은 '읽음'이 아님 */ const at = Date.parse(m.usedAt || m.lastCheckedAt || m.at || '') || null; /* usedAt = 첫 쪽을 실제로 읽은 때(수집기 1.89.42~) — 없으면 예전처럼 lastCheckedAt */ const now = ctx.now || Date.now();
    const out = { ok: !!rows0, ageH: at ? (now - at) / 36e5 : null, total: m.usedTotal != null ? +m.usedTotal : null, rows: 0, ours: 0, comp: 0, compAll: 0, ahead: 0, first: null, next: null, full: false };
    if (!rows0) return out; const myG = grN(l.grade) != null ? grN(l.grade) : 2; const isOurs = (r) => String(r.sellerCode || '') === String(C.ourSeller) || (l.usedCode && String(r.usedCode || '') === String(l.usedCode)) || (l.listingId && String(r.listingId || '') === String(l.listingId));
    const rows = rows0.filter((r) => r && !r.soldOut && +r.price > 0); out.rows = rows.length; const comp = []; for (const r of rows) { if (isOurs(r)) { out.ours++; continue; } out.compAll++; if ((grN(r.grade) != null ? grN(r.grade) : 99) >= myG) comp.push(+r.price); /* 등급을 못 읽은 매물은 우리 등급 이상으로(올리는 쪽에 안전) */ }
    comp.sort((a, b) => a - b); out.comp = comp.length; const p = +l.price || 0; out.ahead = comp.filter((x) => x <= p).length; out.first = comp.length ? comp[0] : null; out.next = comp.find((x) => x > p) ?? null;
    /* 첫 쪽에 모든 매물이 들어 있을 때만 '다른 매물이 없다'를 믿음(전체 중고 수 ≤ 첫 쪽 줄 수) */ out.full = out.total != null && out.total >= 1 && out.total <= rows0.length; out.others = out.total != null ? Math.max(out.compAll, out.total - out.ours) : out.compAll; return out; }
  function stratFloor(ctx, cfg) { const C = stCfg(cfg); const l = ctx.l || {}, m = ctx.m || {}; const bb = m.buyback && l.grade && m.buyback[stG(l.grade)] != null ? +m.buyback[stG(l.grade)] || 0 : 0; const f = Math.max(C.minPrice, ctx.cost ? ctx.cost * C.costMult : 0, bb ? bb * C.bbMult : 0); return { v: stFloorUp(f, C.unit), why: [`최저 ${C.minPrice.toLocaleString()}원`, ctx.cost ? `매입가 ${Math.round(ctx.cost).toLocaleString()}×${C.costMult}` : null, bb ? `알라딘 매입가 ${bb.toLocaleString()}×${C.bbMult}` : null].filter(Boolean).join(' · ') }; }
  function stratCeil(ctx, p) { const m = ctx.m || {}; const list = +m.priceList || 0, sales = +m.priceSales || 0; const inPrint = /재고|출고|구매\s*가능|주문|정상/.test(String(m.availability || '')) && !/절판|품절|구할 수 없/.test(String(m.availability || '')); const cap = inPrint && sales ? sales * (p.inPrintCap || 0.9) : list ? list * (p.oopCap || 1.3) : null; return { v: cap ? Math.floor(cap / 100) * 100 : null, inPrint, why: inPrint && sales ? `새 책 판매가 ${sales.toLocaleString()}×${p.inPrintCap || 0.9}(새 책을 살 수 있음)` : list ? `정가 ${list.toLocaleString()}×${p.oopCap || 1.3}(절판·품절)` : '정가를 몰라 올리지 않음' }; }
  const STRATS = [
    { k: 'waitlist', icon: '⏳', label: '앞 매물 기다렸다 내놓기', mode: 'state',
      what: '우리보다 싸거나 같은 값의 같은 등급 이상 매물이 있으면 일시판매중지로 두고, 그 매물들이 팔려 사라지면(앞 매물 수 ≤ 정한 수) 판매중으로 되돌림 — 매물이 적은 책에서 가격을 깎지 않고 차례를 기다림',
      when: '첫 쪽 경쟁 매물(우리 등급 이상)이 정한 수 이하 · 기다림 한도(일)가 지나면 그대로 내놓음',
      basis: 'Ellison & Ellison(2018, NBER w24197): 온라인 중고책은 찾는 사람이 적은 책일수록 값이 높고 서로 이어지면 값이 오름 · 출판사의 의도적 품절과 같은 원리(공급을 잠시 거둬 들임)',
      fails: ['시장 지표가 오래돼 이미 사라진 매물을 보고 계속 기다림 → 시장 지표 30시간 안 것만 · 오래되면 아무것도 안 함', '첫 쪽 읽기 실패를 \'매물 없음\'으로 오해해 내놓음 → 첫 쪽 줄이 있고 전체 중고 수와 맞을 때만', '하루에도 여러 번 내놨다 거뒀다(깜빡임) → 상태는 48시간에 한 번만 바꿈', '영원히 기다림(재고가 묶임) → 기다림 한도(기본 30일) 뒤 내놓음', '우리 다른 상품을 경쟁으로 셈 → 우리 판매자 코드·우리 상품 번호 줄은 뺌', '매물이 많은 책에서 기다리면 끝이 없음 → 다른 매물이 정한 수(기본 5)보다 많으면 거두지 않음'],
      params: [{ k: 'aheadMax', l: '내놓아도 되는 앞 매물 수', d: 0, min: 0, max: 5 }, { k: 'fewMax', l: '이 수보다 매물이 많으면 거두지 않음', d: 5, min: 1, max: 30 }, { k: 'maxWaitD', l: '기다림 한도(일)', d: 30, min: 3, max: 180 }, { k: 'pause', l: '판매중인 상품도 거둠(1=예)', d: 1, min: 0, max: 1 }],
      decide(ctx, p, M) { const l = ctx.l, st = ctx.st || {}; const paused = /일시판매중지/.test(l.status || ''); if (!M.ok) return { act: 'none', why: '첫 쪽 매물을 못 읽음' }; const mine = st.last && st.last.k === 'waitlist' && st.last.act === 'pause';
        if (paused) { if (!mine) return { act: 'none', why: '사람(또는 다른 일)이 멈춘 상품 — 이 전략은 자기가 멈춘 것만 내놓음' }; if (M.ahead <= p.aheadMax) return { act: 'resume', why: `앞 매물 ${M.ahead}개(≤${p.aheadMax}) — 차례가 옴` }; const since = Date.parse(st.pausedAt || st.last.at || '') || null; if (since && (ctx.now - since) / 864e5 >= p.maxWaitD) return { act: 'resume', why: `기다림 ${p.maxWaitD}일이 지남 — 그대로 내놓고 이 상품은 다시 거두지 않음`, mark: { waitDone: new Date(ctx.now).toISOString() } }; return { act: 'none', why: `앞 매물 ${M.ahead}개 — 기다리는 중${since ? ` (${Math.floor((ctx.now - since) / 864e5)}일째)` : ''}` }; }
        if (st.waitDone) return { act: 'none', why: '기다림 한도를 한 번 채움 — 다시 거두지 않음(되풀이 막기)' }; if (st.last && st.last.k === 'waitlist' && st.last.act === 'resume' && (ctx.now - Date.parse(st.last.at)) / 864e5 < 7 && M.ahead > p.aheadMax) return { act: 'none', why: '내놓은 지 7일 안 — 바로 다시 거두지 않음' };
        if (st.last && st.last.act === 'pause' && st.last.k === 'waitlist' && /^판매중$/.test(l.status || '') && (ctx.now - Date.parse(st.last.at)) / 864e5 < 7) return { act: 'none', why: '거둔 뒤 사람이 다시 판매중으로 바꿈 — 7일 동안 사람 뜻대로' };
        if (+p.pause && M.ahead > p.aheadMax && M.others <= p.fewMax) return { act: 'pause', why: `앞 매물 ${M.ahead}개 · 다른 매물 ${M.others}개(≤${p.fewMax}) — 앞 매물이 팔릴 때까지 거둠` }; return { act: 'none', why: M.ahead > p.aheadMax ? `다른 매물 ${M.others}개 — 많아서 거두지 않음` : '이미 앞에 있음' }; } },
    { k: 'sole', icon: '💎', label: '혼자 남은 책 값 올리기', mode: 'price',
      what: '전체 중고에 우리 매물만 있을 때 한 번에 정한 폭(기본 10%)씩 값을 올림 — 새 책을 살 수 있으면 새 책 판매가의 90%, 절판·품절이면 정가의 130%를 넘지 않음',
      when: '첫 쪽이 전체 중고를 다 담고(전체 수 ≤ 첫 쪽 줄) 다른 판매자 매물이 0개 · 하루에 한 번',
      basis: 'Ellison & Ellison(2018): 경쟁 매물이 없을 때 값은 찾는 사람의 지불 의사로 정해짐 · 미국 중고책 시장의 단독 판매자 가격 분포',
      fails: ['다른 판매자 매물이 2쪽에 있는데 없다고 봄 → 전체 중고 수와 첫 쪽 줄이 맞을 때만', '새 책이 더 싼데 중고를 비싸게 → 새 책을 살 수 있으면 새 책 판매가의 90%가 한도', '정가를 몰라 끝없이 오름 → 정가·판매가를 모르면 올리지 않음', '한 번에 크게 올라 팔릴 기회를 놓침 → 한 번에 최대 15% · 20시간에 한 번', '찾는 사람이 아예 없는 책을 올려 무의미 → Sales Point가 정한 값 미만이면 올리지 않음'],
      params: [{ k: 'step', l: '한 번에 올릴 폭(%)', d: 10, min: 2, max: 15 }, { k: 'spMin', l: 'Sales Point 이 값 이상만', d: 1, min: 0, max: 5000 }, { k: 'inPrintCap', l: '새 책 있으면 새 책 판매가 대비 한도', d: 0.9, min: 0.5, max: 1 }, { k: 'oopCap', l: '절판·품절이면 정가 대비 한도', d: 1.3, min: 1, max: 3 }],
      decide(ctx, p, M) { const l = ctx.l, m = ctx.m || {}; if (!M.ok || !M.full) return { act: 'none', why: '첫 쪽이 전체 매물을 다 담지 않아 혼자인지 모름' }; if (/^판매중$/.test(l.status || '') && !M.ours) return { act: 'none', why: '판매중인데 첫 쪽에 우리 상품이 안 보임 — 시장 기록이 오래됨' }; if (M.compAll > 0) return { act: 'none', why: `다른 매물 ${M.compAll}개` }; if ((+m.salesPoint || 0) < p.spMin) return { act: 'none', why: `Sales Point ${m.salesPoint || 0} < ${p.spMin}` };
        const cap = stratCeil(ctx, p); if (!cap.v) return { act: 'none', why: cap.why }; const cur = +l.price; if (cur >= cap.v) return { act: 'none', why: `이미 한도(${cap.v.toLocaleString()}원 = ${cap.why})` }; const to = Math.min(cap.v, stDn(cur * (1 + p.step / 100))); return to > cur ? { act: 'price', to, why: `우리만 남음 → +${p.step}% (한도 ${cap.v.toLocaleString()}원 = ${cap.why})` } : { act: 'none', why: '올릴 폭이 없음' }; } },
    { k: 'ladder', icon: '🥇', label: '1위 지키며 다음 매물 바로 아래로', mode: 'price',
      what: '우리가 같은 등급 이상 매물 중 가장 싼데 다음 매물과 값 차이가 크면, 1위를 지키는 선(다음 매물 − 100원)까지 올림',
      when: '우리 앞 매물 0개 · 다음 매물이 우리보다 정한 폭 이상 비쌈 · 한 번에 최대 15%',
      basis: '최저가 자리(첫 줄)가 판매를 가름(우리 판매가치 엔진의 자리×수요 학습) · 1위를 잃지 않는 가장 높은 값',
      fails: ['다음 매물이 우리보다 낮은 등급인데 그 값에 맞춤 → 우리 등급 이상 매물만 비교', '다음 매물이 곧 내려가 우리가 2위가 됨 → 다음 시장 읽기에서 \'1위 아님\'이면 이 전략은 아무것도 안 함(내리지 않음 · 내리는 일은 사람·다른 전략)', '배송비 차이로 실제 순서가 다름 → 차이가 정한 폭(기본 500원)보다 클 때만', '한 번에 크게 오름 → 최대 15%'],
      params: [{ k: 'gapMin', l: '다음 매물과 이만큼 이상 차이(원)', d: 500, min: 100, max: 10000 }, { k: 'under', l: '다음 매물보다 이만큼 아래(원)', d: 100, min: 10, max: 2000 }, { k: 'step', l: '한 번에 최대(%)', d: 15, min: 2, max: 15 }],
      decide(ctx, p, M) { const cur = +ctx.l.price; if (!M.ok) return { act: 'none', why: '첫 쪽 매물을 못 읽음' }; if (/^판매중$/.test(ctx.l.status || '') && !M.ours) return { act: 'none', why: '판매중인데 첫 쪽에 우리 상품이 안 보임 — 시장 기록이 오래됨' }; if (M.ahead > 0) return { act: 'none', why: `앞 매물 ${M.ahead}개 — 1위가 아님` }; if (M.next == null) return { act: 'none', why: '다음 매물이 없음(혼자면 💎 전략)' }; if (M.next - cur < p.gapMin) return { act: 'none', why: `다음 매물과 ${(M.next - cur).toLocaleString()}원 차이(< ${p.gapMin})` };
        const to = Math.min(stDn(M.next - p.under), stDn(cur * (1 + p.step / 100))); return to > cur && to < M.next ? { act: 'price', to, why: `1위 유지 · 다음 매물 ${M.next.toLocaleString()}원 → ${to.toLocaleString()}원` } : { act: 'none', why: '올릴 폭이 없음' }; } },
    { k: 'scarceUp', icon: '📈', label: '희소해지면 올리기', mode: 'price',
      what: '시장 흐름에서 매물이 30% 넘게(3개 이상) 줄었거나, 남은 매물 3개 이하인데 30일 동안 2개 넘게 팔려 사라지면 정한 폭(기본 8%)씩 올림 — 7일에 한 번 · 한도 = 새 책 판매가 90% 또는 정가 130%',
      when: '📈 시장 흐름 🔺 희소해짐 신호(클라우드 6시간마다) · 7일에 한 번',
      basis: '공급이 줄면 같은 수요에서 값이 오름(Ellison & Ellison 2018) · 우리 시장 흐름 모음(mkt_signals)',
      fails: ['한 판매자가 매물을 잠깐 내렸다 다시 올려 줄어든 것처럼 보임 → 30일 동안 실제 사라진 수(팔림 추정)도 함께 · 7일에 한 번만', '희소해졌지만 우리 값이 이미 시장보다 비쌈 → 우리 앞 매물이 2개 이상이면 올리지 않음', '끝없이 오름 → 한도(새 책 90%·정가 130%)'],
      params: [{ k: 'step', l: '한 번에 올릴 폭(%)', d: 8, min: 2, max: 15 }, { k: 'everyD', l: '며칠에 한 번', d: 7, min: 2, max: 60 }, { k: 'inPrintCap', l: '새 책 대비 한도', d: 0.9, min: 0.5, max: 1 }, { k: 'oopCap', l: '정가 대비 한도', d: 1.3, min: 1, max: 3 }],
      decide(ctx, p, M) { const s = ctx.sig; const l = ctx.l, st = ctx.st || {}; if (!s) return { act: 'none', why: '시장 흐름 기록이 없음' }; const a1 = Date.parse(String(s.at1 || '').replace(' ', 'T')) || 0; if (!a1 || (ctx.now - a1) / 864e5 > 30) return { act: 'none', why: '시장 흐름이 30일 넘게 그대로 — 오래된 신호는 안 씀' };
        const sup = s.n0 ? (s.n1 - s.n0) / s.n0 : 0; const scarce = ((sup <= -0.3 && s.n0 - s.n1 >= 3) || s.n1 <= 3) && (s.g30 || 0) >= 2; /* (검토) 다른 판매자 매물이 실제로 사라진 것(30일 2개↑ · 우리 줄은 뺀 수)이 있어야 — 우리가 거둔 것으로 줄어든 것처럼 보이지 않게 */ if (!scarce) return { act: 'none', why: `희소해짐 아님(매물 ${s.n0}→${s.n1} · 30일 사라짐 ${s.g30 || 0})` };
        if (st.sigAt && st.sigAt === String(s.at1)) return { act: 'none', why: '같은 신호로 이미 올림 — 새 신호를 기다림' }; if (M.ok && M.ahead >= 2) return { act: 'none', why: `앞 매물 ${M.ahead}개 — 이미 비쌈` }; const last = Date.parse((st.last && st.last.k === 'scarceUp' && st.last.at) || '') || 0; if (last && (ctx.now - last) / 864e5 < p.everyD) return { act: 'none', why: `${p.everyD}일 안에 이미 올림` };
        const cap = stratCeil(ctx, p); if (!cap.v) return { act: 'none', why: cap.why }; const cur = +l.price; if (cur >= cap.v) return { act: 'none', why: '이미 한도' }; const to = Math.min(cap.v, stDn(cur * (1 + p.step / 100))); return to > cur ? { act: 'price', to, why: `🔺 희소해짐(매물 ${s.n0}→${s.n1} · 30일 사라짐 ${s.g30}) → +${p.step}%`, mark: { sigAt: String(s.at1) } } : { act: 'none', why: '올릴 폭이 없음' }; } },
    { k: 'drip', icon: '🧺', label: '같은 책 여러 권이면 하나씩 내놓기', mode: 'state',
      what: '같은 책(같은 ISBN)의 우리 상품이 여럿이면 가장 싼 한 개만 판매중, 나머지는 일시판매중지 — 그것이 팔리면 다음 것을 내놓음(우리끼리 첫 쪽을 다투지 않고, 시장에 \'많이 남은 책\'으로 보이지 않게)',
      when: '같은 ISBN 우리 상품 2개 이상(같은 배정 안) · 상태는 48시간에 한 번',
      basis: '공급을 한 번에 다 보이지 않는 것(drip/Scarcity cue) — 남은 수량 신호가 지불 의사를 바꿈(희소성 효과, Lynn 1991)',
      fails: ['판매중인 것이 팔렸는데 우리 기록이 아직 판매중 → 다음 회차에 다시 봄(늦어도 몇 시간) · 수량 0·판매완료는 뺌', '모두 거둬져 하나도 안 팔림 → 판매중이 하나도 없으면 가장 싼 것을 먼저 내놓음(거두기보다 앞)', '등급이 다른데 같은 것으로 봄 → 등급이 같은 것끼리만 묶음'],
      params: [{ k: 'keep', l: '판매중으로 둘 개수', d: 1, min: 1, max: 5 }],
      decide(ctx, p) { const l = ctx.l; const SS = ctx.sibSt || {}; const byUs = (x, st) => /^판매중$/.test(x.status || '') || (/일시판매중지/.test(x.status || '') && st && st.last && st.last.k === 'drip' && st.last.act === 'pause'); /* 사람이 멈춘 같은 책은 셈에서 뺌 */
        const mySt = ctx.st || {}; if (!byUs(l, mySt)) return { act: 'none', why: '사람(또는 다른 일)이 멈춘 상품 — 손대지 않음' }; const sib = (ctx.sib || []).filter((x) => x && x.id !== l.id && stG(x.grade) === stG(l.grade) && +x.qty > 0 && byUs(x, SS[x.id])); if (!sib.length) return { act: 'none', why: '같은 책·같은 등급 우리 상품이 하나뿐' };
        const all = [l, ...sib].sort((a, b) => (+a.price - +b.price) || String(a.registeredAt || '').localeCompare(String(b.registeredAt || '')) || String(a.id).localeCompare(String(b.id))); const keepL = all.slice(0, p.keep); const keep = new Set(keepL.map((x) => x.id)); const on = /^판매중$/.test(l.status || '');
        if (keep.has(l.id) && !on) return { act: 'resume', why: `같은 책 ${all.length}개 중 가장 싼 ${p.keep}개 — 내놓음` }; if (!keep.has(l.id) && on) { if (!keepL.every((x) => /^판매중$/.test(x.status || ''))) return { act: 'none', why: '더 싼 것이 아직 판매중이 아님 — 그것을 먼저 내놓은 뒤 거둠(하나도 안 팔리는 때가 없게)' }; return { act: 'pause', why: `같은 책 ${all.length}개 중 더 싼 것이 판매중 — 그것이 팔릴 때까지 거둠` }; } return { act: 'none', why: keep.has(l.id) ? '판매중으로 둠' : '기다리는 중' }; } },
    { k: 'decay', icon: '🐢', label: '안 팔리면 천천히 내리기', mode: 'price',
      what: '등록 뒤 정한 날(기본 60일)이 지나도 안 팔리고 우리 앞에 매물이 있으면 정한 폭(기본 5%)씩 내림 — 바닥값(최저 1,000원 · 매입가×1.1 · 알라딘 매입가×1.15) 아래로는 절대 안 내림 · 14일에 한 번',
      when: '등록 후 n일 · 앞 매물 1개 이상 · 14일에 한 번',
      basis: '재고 기간이 길수록 보관 비용·기회 비용이 쌓임 — 우리 판매가치 엔진의 \'자리×수요\' 판매 확률이 낮은 자리',
      fails: ['바닥 아래로 내려 손해 → 바닥값(매입가·알라딘 매입가 기준) 아래는 막음', '여러 전략이 서로 올리고 내림(핑퐁) → 한 상품엔 전략 하나만(배정 우선순위) · 같은 상품 20시간에 한 번', '희귀한 책을 싸게 → 💠 희귀·💎 희소로 분류된 책은 내리지 않음(그 책은 ⏳·💎 전략으로)'],
      params: [{ k: 'afterD', l: '등록 후 며칠부터', d: 60, min: 14, max: 365 }, { k: 'step', l: '한 번에 내릴 폭(%)', d: 5, min: 1, max: 15 }, { k: 'everyD', l: '며칠에 한 번', d: 14, min: 3, max: 90 }],
      decide(ctx, p, M, C) { const l = ctx.l, st = ctx.st || {}; const reg = Date.parse(l.registeredAt || '') || null; if (!reg || (ctx.now - reg) / 864e5 < p.afterD) return { act: 'none', why: `등록 ${reg ? Math.floor((ctx.now - reg) / 864e5) : '?'}일 < ${p.afterD}일` }; if (!M.ok) return { act: 'none', why: '첫 쪽 매물을 못 읽음' }; if (M.ahead < 1) return { act: 'none', why: '이미 1위' };
        if (ctx.cost == null) return { act: 'none', why: '매입가를 몰라 내리지 않음(손해 막기 — 매입 연결이 있는 상품만)' }; if (ctx.rarity && /scarce|rare/.test(ctx.rarity)) return { act: 'none', why: '희소·희귀 책은 내리지 않음' }; const last = Date.parse((st.last && st.last.k === 'decay' && st.last.at) || '') || 0; if (last && (ctx.now - last) / 864e5 < p.everyD) return { act: 'none', why: `${p.everyD}일 안에 이미 내림` };
        const fl = stratFloor(ctx, C); const cur = +l.price; const to = Math.max(fl.v, stFloorUp(cur * (1 - p.step / 100), C.unit)); return to < cur ? { act: 'price', to, why: `등록 ${Math.floor((ctx.now - reg) / 864e5)}일 · 앞 매물 ${M.ahead}개 → −${p.step}% (바닥 ${fl.v.toLocaleString()}원)` } : { act: 'none', why: `바닥값 ${fl.v.toLocaleString()}원(${fl.why})` }; } },
    { k: 'floor', icon: '🛡', label: '바닥값 지키기', mode: 'price',
      what: '우리 값이 바닥값(최저 1,000원 · 매입가×1.1 · 알라딘 매입가×1.15 중 큰 것)보다 낮으면 바닥값으로 올림 — 팔수록 손해 보는 값을 막음',
      when: '언제나 · 20시간에 한 번',
      basis: '알라딘 매입가보다 싸게 팔면 알라딘에 넘기는 것보다 못함 · 매입가 아래 판매는 손해',
      fails: ['매입가를 잘못 연결해 지나치게 올림 → 한 번에 최대 15%씩만 · 매입가를 모르면 알라딘 매입가·최저값만', '알라딘 매입가가 등급과 다름 → 우리 상품 등급의 매입가만'],
      params: [],
      decide(ctx, p, M, C) { const fl = stratFloor(ctx, C); const cur = +ctx.l.price; if (cur >= fl.v) return { act: 'none', why: `바닥값 ${fl.v.toLocaleString()}원 이상` }; return { act: 'price', to: Math.min(fl.v, stDn(cur * 1.15)), why: `바닥값 ${fl.v.toLocaleString()}원(${fl.why})보다 낮음` }; } },
    { k: 'exit', icon: '🏷', label: '알라딘에 넘길 후보 알리기', mode: 'suggest',
      what: '오래(기본 120일) 안 팔렸고 알라딘 매입가가 우리 값에서 수수료를 뺀 금액의 80% 이상이면 \'알라딘에 넘기기 후보\'로 알림 — 스스로 하지 않음(택배로 보내는 일이라 사람이 정함)',
      when: '등록 후 n일 · 알라딘 매입가 있음',
      basis: '못 팔 때의 회수 값 = 알라딘 매입가(★ 추천 매입가의 기대 회수 계산과 같은 틀)',
      fails: ['알라딘이 실제로는 안 사는 상태 → 알림만(사람이 확인)'],
      params: [{ k: 'afterD', l: '등록 후 며칠부터', d: 120, min: 30, max: 720 }, { k: 'ratio', l: '매입가 ≥ 우리 순수입 × 이 값', d: 0.8, min: 0.3, max: 1.5 }],
      decide(ctx, p) { const l = ctx.l, m = ctx.m || {}; const reg = Date.parse(l.registeredAt || '') || null; if (!reg || (ctx.now - reg) / 864e5 < p.afterD) return { act: 'none', why: '아직 이름' }; const bb = m.buyback && m.buyback[stG(l.grade)] != null ? +m.buyback[stG(l.grade)] : 0; if (!bb) return { act: 'none', why: '알라딘 매입가 없음' }; const net = (+l.price || 0) * 0.9; return bb >= net * p.ratio ? { act: 'suggest', why: `등록 ${Math.floor((ctx.now - reg) / 864e5)}일 · 알라딘 매입가 ${bb.toLocaleString()}원 ≥ 순수입 ${Math.round(net).toLocaleString()}×${p.ratio}` } : { act: 'none', why: '매입가가 낮음' }; } },
  ];
  /* 희소·희귀 분류(판매가치 엔진 valueOf)를 웹앱 valueIn과 같은 재료로 — 클라우드·웹앱 같은 값 */
  function stratRarity(l, m, VM, VC) { if (!l || !m) return null; try { const P = (m.usedFirstPage || []).filter((r) => String(r.sellerCode) !== SDEF.ourSeller && r.usedCode !== l.usedCode && +r.price > 0 && !r.soldOut); const ps = P.map((r) => +r.price).sort((a, b) => a - b); const same = P.filter((r) => r.grade === l.grade).map((r) => +r.price); const bb0 = (m.buyback || {})[l.grade];
    const x = { price: +l.price || 0, grade: l.grade || null, sp: m.salesPoint ?? null, used: m.usedTotal ?? null, avail: m.availability || null, rank: l.price ? ps.filter((p) => p < l.price).length + 1 : null, sameMin: same.length ? Math.min(...same) : null, third: ps.length ? ps[Math.min(2, ps.length - 1)] : null, bb: bbExpect ? bbExpect(bb0, l.grade, l.condition) : bb0 ?? null, cond: l.condition || null, list: m.priceList ?? null };
    const v = valueOf(x, VM || null, VC || {}); return (v && v.rarity && v.rarity.cls) || null; } catch (e) { return null; } }
  const STRAT_K = Object.fromEntries(STRATS.map((s) => [s.k, s]));
  const stratParams = (k, p) => { const S0 = STRAT_K[k]; const o = {}; for (const x of (S0 && S0.params) || []) { let v = p && p[x.k] != null && p[x.k] !== '' ? +p[x.k] : x.d; if (!Number.isFinite(v)) v = x.d; o[x.k] = Math.min(x.max, Math.max(x.min, v)); } return o; };
  function stratDecide(k, ctx, p0, cfg) { const S0 = STRAT_K[k]; if (!S0) return { act: 'none', why: '모르는 전략' }; const C = stCfg(cfg); const p = stratParams(k, p0); const M = stratMarket(ctx, C); let d; try { d = S0.decide({ now: Date.now(), ...ctx }, p, M, C) || { act: 'none' }; } catch (e) { d = { act: 'none', why: '계산 오류: ' + e.message }; } return { ...d, k, M }; }
  /* 🛡 해도 되는지 — 하나라도 걸리면 하지 않음(이유를 모두 남김) */
  function stratGuard(d, ctx, cfg) { const C = stCfg(cfg); const l = ctx.l || {}, st = ctx.st || {}, now = ctx.now || Date.now(); const no = []; if (!d || d.act === 'none') return { ok: false, no: ['할 일 없음'] }; if (d.act === 'suggest') return { ok: true, no: [] };
    if (!/^(판매중|일시판매중지)$/.test(l.status || '')) no.push(`판매 상태가 ${l.status || '모름'} — 판매중·일시판매중지만`); if (!(+l.qty > 0)) no.push('수량 0');
    if (!l.listingId) no.push('알라딘 상품 번호(listingId) 없음 — 샵매니저 수정을 할 수 없음'); if (st.hold) no.push(`사람이 ↩ 되돌림(${String(st.hold.at || '').slice(0, 10)}) — 이 상품은 전략에서 쉼`); const reg = Date.parse(l.registeredAt || '') || null; if (reg && (now - reg) / 36e5 < C.newH) no.push(`등록 ${C.newH}시간 안(시장 기록이 아직 안정되지 않음)`);
    const M = d.M || stratMarket(ctx, C); if (d.k !== 'drip' && d.k !== 'floor') { if (!M.ok) no.push('첫 쪽 매물 기록 없음'); else if (M.ageH == null || M.ageH > C.maxAgeH) no.push(`시장 지표가 ${M.ageH == null ? '언제 것인지 모름' : Math.round(M.ageH) + '시간 전'}(${C.maxAgeH}시간 안 것만)`); }
    if (ctx.busy) no.push('앞서 맡긴 수정이 아직 진행 중'); { const tg = String(l.sku || '').slice(3, 6).toUpperCase(); if (tg === 'PND' || tg === 'BAD') no.push(`관리코드 ${tg} — 가격 감시가 보류(PND)·은퇴(BAD)로 둔 상품은 사람이 정함`); } if (ctx.watch) no.push('가격 감시 묶음·결정이 이 상품을 맡고 있음(겹치면 서로 덮음)');
    const hEd = Date.parse(l.editAt || '') || 0; if (hEd && !/strategy|전략/.test(String(l.editBy || '')) && (now - hEd) / 36e5 < C.humanLockH) no.push(`사람이 ${Math.round((now - hEd) / 36e5)}시간 전에 고침 — ${C.humanLockH}시간 동안 사람 값이 우선`);
    const last = Date.parse((st.last && st.last.at) || '') || 0; if (st.last && st.last.act === 'price' && last && (now - last) / 864e5 < 7 && +l.price !== +st.last.to && +l.price !== +st.last.from) no.push(`전략이 ${Number(st.last.to).toLocaleString()}원으로 바꾼 뒤 값이 ${Number(l.price).toLocaleString()}원 — 사람이 고친 것으로 보고 7일 동안 손대지 않음`); if (last && (now - last) / 36e5 < C.coolH) no.push(`이 상품에 ${Math.round((now - last) / 36e5)}시간 전에 이미 함(${C.coolH}시간에 한 번)`);
    if (d.act === 'pause' || d.act === 'resume') { const lf = Date.parse(st.flipAt || '') || 0; if (lf && (now - lf) / 36e5 < C.flipH) no.push(`판매 상태를 ${Math.round((now - lf) / 36e5)}시간 전에 바꿈(${C.flipH}시간에 한 번 — 깜빡임 막기)`); if (d.act === 'pause' && !/^판매중$/.test(l.status || '')) no.push('이미 판매중이 아님'); if (d.act === 'resume' && !/일시판매중지/.test(l.status || '')) no.push('일시판매중지가 아님'); }
    if (d.act === 'price') { const cur = +l.price || 0, to = +d.to || 0; if (!(to >= 10)) no.push('새 값이 이상함'); if (cur && Math.abs(to - cur) / cur > C.maxStep + 1e-9) no.push(`한 번에 ${Math.round(Math.abs(to - cur) / cur * 100)}% — ${Math.round(C.maxStep * 100)}%까지만`); const fl = stratFloor(ctx, C); if (to < fl.v && to < cur) no.push(`바닥값 ${fl.v.toLocaleString()}원(${fl.why}) 아래로 내림`); if (to === cur) no.push('값이 같음'); }
    return { ok: !no.length, no }; }
  const api = { VERSION, VDEF, setBuyback, bbExpect, bbAccept, BB_ACC, extrasOf, EX_LABEL, defectOf, BB_PAY, valueRec, valueRate3, listBand, spBand, usedBand, posBand, ratioBand, valueTrain, valueRate, ratioMult, valueOf, HORIZON_D, FEATURES, SALE_EVAL_VER, evalSale, rawRow, withPrice, feats, train, trainBase, predict, evaluate, shouldPromote, dailyValue, STRATS, STRAT_K, SDEF, stratDecide, stratGuard, stratMarket, stratFloor, stratCeil, stratParams, stratRarity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowML = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
