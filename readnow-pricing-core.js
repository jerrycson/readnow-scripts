/* readnow-pricing-core.js — 판매가 자동 결정(판정 엔진) 핵심 계산
 * 순수 함수만 둔다 (저장·네트워크·화면 없음). 같은 입력이면 항상 같은 출력.
 * 수집기(Tampermonkey)·웹앱·나중의 PC 작업 엔진·클라우드(Cloud Run)가 모두 이 파일 하나로 같은 판정을 낸다.
 *
 * 입력 4가지
 *   listing : 우리 상품 1개 (prd_listings 문서 + 매입원가)
 *   market  : 그 책의 온라인 중고 목록 관측 (parseUsedPage 결과를 쪽 순서대로 이어 붙인 것 + 관측 시각 정보)
 *   sellers : Firestore sellers 문서 그대로 (키 = 'sc_번호'). 분류는 readnow-core.js classifySellerDoc 한 곳의 기준 (이 파일에 복사본 없음)
 *   ctx     : 지금 시각·우리 배송비 정책·운영 비용·추격자 상태·설정
 * 출력 : decide() → 판정 1건 (추천가·적용 규칙·근거·자동 적용 가능 여부·막힌 이유)
 *
 * 원칙 (정범과 합의한 것)
 *   - 판매자 분류(유효·노랑·주황·무효)는 '판매가 기준점을 믿어도 되는가'의 분류. 지금은 판매자 기준, 자료가 쌓이면 상품 기준으로 교체(ctx.classify)
 *   - 재고 기간은 '최저가 등록 기간'(우리가 최저가 자리를 지킨 날수)으로 잼. 측정 전 상품은 등록 후 일수로 임시 판정하되 T3까지만
 *   - 유효 상품 = 유효 판매자(초록·짙은 초록) + 알라딘측. 노랑·주황·빨강은 기본 무시, 재고 기간이 길어지면 노랑→주황 순으로 포함. 빨강은 절대 기준이 아님
 *   - 비교는 목록 첫 페이지만. 단 특별판 키워드가 제목에 있으면 첫 페이지 조건 제외(뒤쪽 쪽까지 봄). 비교 대상 없으면 관리자 대기열
 *   - 목표는 유효 최저가와 '정확히' 동가 → 기준 상품이 목록 맨 위면 그대로 동가, 아니면 배송비 차이를 반영해 구매자에게 1~5% 이점
 *   - 가격 단위 = 가격대의 5% (100원대 5원, 1,000원대 50원, 10,000원대 500원). 상대 가격과 정확히 같게 맞출 때만 단위 예외
 *   - 하한선은 알라딘 매입가 하나뿐. 목표가가 그 하한가보다 10% 넘게 낮을 때만 멈춤 (원가 하한선 없음)
 *   - 알라딘 반영 지연(대부분 24시간 내) → 새로 나타난 싼 매물·사라진 매물·우리 가격 변경은 24시간 지나 확정된 뒤에 판단
 *   - 일시판매중지는 우리 전용 보관함: 관리코드 뒤 3자리로 구분 — PND = 판매보류풀(가격상승대기), BAD = 불용(4년 초과, 관리자 승인)
 *     (판매중지는 알라딘이 다른 이유로 쓰는 일이 많아 쓰지 않음 · '판매금지'는 알라딘만 정하는 상태)
 */
(function (root) {
  'use strict';
  const VERSION = '0.8.0';

  // ───────────────────────── 기본 설정 (웹앱 설정에서 모두 바꿈) ─────────────────────────
  // 데이터에는 코드(T1~T8)만 저장하고 이름은 화면용 → 이름을 바꿔도 과거 기록이 깨지지 않음
  const DEFAULTS = {
    ourSeller: '996008',
    // 재고 기간 경계(등록 후 일수). 경계 하나만 저장 → 앞뒤 구간이 자동으로 이어짐. 마지막 경계를 넘으면 T8(불용)
    tierBounds: [90, 180, 365, 548, 730, 1095, 1460],
    tiers: {
      T1: { name: '신규 재고', colors: ['dkgreen', 'green'], disc: [0, 0] },
      T2: { name: '정상 재고', colors: ['dkgreen', 'green'], disc: [0.05, 0.10] },
      T3: { name: '둔화 재고', colors: ['dkgreen', 'green'], disc: [0.11, 0.20] },
      T4: { name: '장기 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0.11, 0.20] },
      T5: { name: '체화 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0.15, 0.30] },
      T6: { name: '부동 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0.50, 0.50] },
      T7: { name: '청산 재고', colors: ['dkgreen', 'green', 'yellow', 'orange'], disc: [0.70, 0.70] },
      T8: { name: '불용 재고', colors: [], disc: [0, 0] },
    },
    discPick: 'low', // 범위 중 어느 값을 쓸지: 'low'(작은 할인) / 'high'. 판매 자료가 쌓이면 학습값으로 바꿈
    // 판매자 분류 기준은 이 파일에 없음 → readnow-core.js(1.2.0) sellerBg 한 곳. 못 읽으면 판정하지 않음
    // 재고 기간의 기준 = '최저가 등록 기간'(우리 매물이 최저가 자리를 지킨 날수). 측정 안 된 상품은 임시 기준(등록 후 일수)을 쓰되 tempTierCap 단계까지만
    tempTierCap: 'T3',
    cutoverAt: null,        // 매일 감시를 처음 시작한 날 (한 번 정하면 바꾸지 않음 — prd_system/pricing 에 저장)
    tempSunsetDays: 365,    // 감시 시작 후 이 날수가 지나면 임시 기준은 완전히 꺼짐
    // 적용 단계: A = 적용 1% · 3일 → B = 적용 25% / 비교 25% · 1주 → (확인 후) C = 적용 묶음 안에서 강도 나누기. 비교 묶음은 계속 유지
    // 자동 감시에서 항상 빼는 관리코드 (관리자 확인 필수). KHKDVD = 음반·영상 — 마진 구조가 달라 따로 정할 때까지 무조건 사람 확인
    excludeSku: ['KHKDVD'],
    rollout: { treatPct: 1, controlPct: 0 }, // 실제 적용 비율: 상품코드로 고정 배정(0~99) → 비율을 올려도 이미 들어간 상품은 그대로

    lowestMaxGapHours: 48, // 두 관측 사이가 이보다 길면 그 사이는 최저가 기간에 넣지 않음 (정확히 아는 것만 셈)
    aladinSideNames: ['알라딘 직접 배송', '이 광활한 우주점'],
    gradeCoef: { '최상': 1, '상': 0.9, '중': 0.75 },
    // 첫 페이지 예외 키워드 (제목에 있으면 뒤쪽 쪽까지 봄)
    specialKeywords: ['한정', '특별', '특전', '특장', '기념', '리커버', '초판', '초회', '교보', '알라딘', '예스24', '밀리의', '인터파크'],
    specialMaxPages: 10,
    firstTieMaxShipGap: 1000, // 맨 위 매물의 배송비가 우리보다 이만큼 넘게 비싸면 판매가 동가 대신 총액 기준 (배송비로 남기는 판매자에게 마진을 퍼주지 않음)
    advPct: 0.05,          // 맨 위가 아닌 기준 상품과 비교할 때 구매자에게 주는 이점 (총액 기준 1~5%의 위쪽). 단위로 내림
    confirmHours: 24,      // 알라딘 반영 지연: 이 시간 지나야 '확정'
    staleHours: 48,        // 관측이 이보다 오래되면 판정하지 않음
    buybackTolerance: 0.10, // 목표가가 알라딘 매입가 하한가보다 이만큼 이상 낮을 때만 하한가에 멈춤
    feeRate: 0.10,
    packPerOrder: 394,
    courierPerOrder: 2500,
    booksPerOrder: 1,      // 주문당 평균 권수 (실제 주문 자료로 계산해 넣음. 없으면 1 = 가장 보수적)
    insaneMult: 3,         // 다른 매물 중앙값의 3배 초과 = 터무니없는 가격 (웹앱 유효 최저가와 같은 철학)
    insaneListMult: 1.5,   // 정가의 1.5배 초과 = 터무니없는 가격
    queueGapMult: 3,       // 유효 기준이 목록 맨 위(빨강 포함)보다 3배 넘게 비싸면 사람 확인 (판매자 점수로 진짜 싼 매물을 버린 사고 방지)
    // 자동 적용 (L0 = 전부 사람 확인, L1 = 조건 맞는 것만 자동, L2 = 예외만 사람 확인)
    autoLevel: 'L0',
    maxAutoDropPct: 0.30,  // 한 번에 이보다 많이 내리면 사람 확인
    maxAutoRaisePct: 0.50, // 한 번에 이보다 많이 올리면 사람 확인
    autoAllowConverted: false, // 등급 환산으로 만든 기준은 자동 적용 안 함
    // 희소 후보: 우리 말고 유효 판매자 0~1곳 + 전체 판매자 2곳 이하
    rareMaxValid: 1, rareMaxAll: 2,
    // 추격자
    useYes24Proxy: true,   // 기준보다 앞의 무효·보류 매물을 예스24로 대조: 같은 판매자이거나 대행해도 이윤이 남으면(배송비 포함) 실제로 팔리는 경쟁 매물로 봄
    chase: { windowHours: 24, lookbackDays: 7, minEvents: 3, halfLifeDays: 14, releaseDays: 30, sellerMinBooks: 3 },
  };

  const LABEL = { // 한글 사전 (필드명은 영어로 저장)
    dkgreen: '짙은 초록', green: '초록', yellow: '노랑', orange: '주황', red: '빨강', aladin: '알라딘측', proxy: '대행 가능(예스24 대조)',
  };

  // ───────────────────────── 작은 도구 ─────────────────────────
  const HOUR = 3600e3, DAY = 864e5;
  const t = (iso) => (iso == null ? null : typeof iso === 'number' ? iso : Date.parse(String(iso).length === 10 ? iso + 'T00:00:00+09:00' : iso));
  const merge = (a, b) => { const o = JSON.parse(JSON.stringify(a)); for (const k of Object.keys(b || {})) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && o[k] && typeof o[k] === 'object') o[k] = merge(o[k], b[k]); else if (b[k] !== undefined) o[k] = b[k]; } return o; };

  // 가격 단위: 가격이 속한 자릿수 구간 시작값의 5% (100~999 → 5, 1,000~9,999 → 50, 10,000~99,999 → 500 …). 100원 미만은 1원
  function priceStep(p) { if (!(p > 0)) return 1; const band = Math.pow(10, Math.floor(Math.log10(p))); return band < 100 ? 1 : band * 0.05; }
  // 단위에 맞춰 내림/올림. 구간 경계에서는 '결과 가격'의 단위를 씀 (10,000에서 한 단위 내리면 9,950)
  function snapDown(p) { if (!(p > 0)) return 0; let s = priceStep(p); let v = Math.floor(p / s) * s; const s2 = priceStep(v); if (s2 !== s) v = Math.floor(p / s2) * s2; return Math.round(v); }
  function snapUp(p) { if (!(p > 0)) return 0; const s = priceStep(p); return Math.round(Math.ceil(p / s) * s); }
  function stepDown(p) { const v = snapDown(p); return v < p ? v : snapDown(p - 1); } // p보다 한 단위 아래

  // 재고 기간: 등록 후 일수 → T1~T8
  function tierOf(days, bounds) {
    const b = bounds || DEFAULTS.tierBounds;
    for (let i = 0; i < b.length; i++) if (days <= b[i]) return 'T' + (i + 1);
    return 'T' + (b.length + 1);
  }
  // 경계 하나를 바꾸면 앞뒤가 자동으로 이어지게: 구간 i의 [시작,끝] 을 고치면 경계 배열 전체를 다시 만듦
  function setTierRange(bounds, i, from, to) {
    const b = bounds.slice();
    if (i > 0 && from != null) b[i - 1] = from - 1;
    if (i < b.length && to != null) b[i] = to;
    for (let k = 1; k < b.length; k++) if (!(b[k] > b[k - 1])) throw new Error('재고 기간 경계는 앞에서 뒤로 커져야 합니다');
    return b;
  }

  // ── 판매자 분류: 이 파일에는 기준이 없음. readnow-core.js(1.2.0)의 classifySellerDoc 한 곳만 부름 (툴팁·웹앱과 같은 함수) ──
  // ctx.core = ReadNowCore, ctx.RS = ReadnowSellers 를 넘기거나 전역에 있어야 함. 없으면 판정하지 않음(복사본으로 계산하지 않음)
  // 나중에 '상품 기준'으로 바꿀 때는 ctx.classify(row, listing) 만 갈아 끼움
  const coreOf = (ctx) => ctx.core || (root && root.ReadNowCore) || null;
  const rsOf = (ctx) => ctx.RS || (root && root.ReadnowSellers) || null;
  const isAladinSide = (row, S) => !row.sellerCode && (S.aladinSideNames || []).some((n) => String(row.sellerName || '').includes(n));
  function specialHit(title, S) { const s = String(title || ''); return (S.specialKeywords || []).filter((k) => k && s.includes(k)); }

  // ───────────────────────── 남는 돈과 하한선 ─────────────────────────
  // 한 권 팔았을 때 손에 남는 돈 (매입원가 빼기 전): 판매가 − 수수료 − 주문당 비용(택배 − 고객 배송비 + 포장재) ÷ 주문당 평균 권수
  function sellNet(p, ctx, S) {
    const pol = ctx.policy || {}; const custShip = pol.freeOver != null && p >= pol.freeOver ? 0 : (pol.fee || 0);
    const orderCost = S.packPerOrder + Math.max(0, S.courierPerOrder - custShip);
    return p * (1 - S.feeRate) - orderCost / Math.max(1, S.booksPerOrder);
  }
  // sellNet(p) >= need 를 만족하는 가장 낮은 단위 가격 (가격이 오르면 남는 돈이 줄지 않는 범위에서 찾음)
  function minPriceFor(need, ctx, S) {
    if (need == null) return null; let lo = 1, hi = 10000000;
    if (sellNet(hi, ctx, S) < need) return null;
    while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (sellNet(m, ctx, S) >= need) hi = m; else lo = m; }
    let p = snapUp(hi); while (sellNet(p, ctx, S) < need) p = snapUp(p + 1); return p;
  }
  // 하한선: 매입가 하한(모든 단계) + 원가 하한(T1~T3) / 처분 하한(T4~: 매입원가는 이미 쓴 돈 → 팔아서 손해만 안 보면 됨)
  // 하한선 = 알라딘 매입가 하나뿐 (정범 결정 2026-10-04: 원가·손해선 같은 다른 제약은 걸지 않음)
  // 매입가 하한가 = 팔아서 손에 남는 돈(판매가 − 수수료 − 주문당 비용)이 알라딘 매입가와 같아지는 판매가.
  // 목표가가 그보다 낮아도 차이가 buybackTolerance(10%) 안이면 그대로 둠(최저가 자리가 더 중요) — 10% 넘게 낮을 때만 하한가에 멈추고 '알라딘에 팔기' 검토로 표시
  function floors(listing, tier, ctx, S) {
    const bb = listing.grade && ctx.buyback ? ctx.buyback[listing.grade] : null;
    const fBuyback = bb ? minPriceFor(bb, ctx, S) : null;
    return { buyback: bb || null, fBuyback, tolerance: S.buybackTolerance, applied: fBuyback };
  }

  // ── 관리코드 표시 (일시판매중지 보관함 구분) ── 기준은 여기 한 곳: 앞 3자리 = 서가(절대 안 건드림), 뒤 3자리 = 가격 코드 자리에 표시를 씀
  const SKU_TAGS = { hold: 'PND', retire: 'BAD' }; // PND = 판매보류풀(가격상승대기) · BAD = 불용
  function skuTag(sku) { const t = String(sku || '').slice(3, 6).toUpperCase(); return t === SKU_TAGS.hold ? 'hold' : t === SKU_TAGS.retire ? 'retire' : null; }
  function skuWith(sku, kind) { const s0 = String(sku || ''); if (s0.length < 3) return null; return s0.slice(0, 3) + SKU_TAGS[kind] + s0.slice(6); } // 예: BLKCMN → BLKPND / BLKBAD

  // ── 대행형 판별 (예스24 대조) ──
  // ① 같은 판매자: 알라딘 판매자 이름 = 예스24 이 책의 판매자 이름(또는 아이디) → 두 곳에 같은 재고를 올린 것 = 실제로 팔리는 경쟁 매물
  // ② 대행 이윤: 알라딘에서 받는 돈(판매가 − 수수료 + 배송비) − 예스24에서 같은 등급 이상을 사서 바로 보내는 비용(판매가 + 배송비) ≥ 0 → 대행해도 남음 = 실제로 보낼 수 있음
  //    배송비를 높게 받는 판매자는 판매가가 조금 낮아도 배송비에서 남기므로 반드시 배송비까지 셈
  const GRADE_RANK = { '최상': 3, '상': 2, '중': 1, '하': 0 };
  const normName = (x) => String(x || '').toLowerCase().replace(/[\s·.,'"()\[\]{}<>\-_=~!@#$%^&*+|/\\:;?]/g, '');
  function proxyCheck(row, y24, S0) {
    const S = S0 || DEFAULTS;
    if (!y24 || !y24.offers) return { verdict: 'noData', why: '예스24 자료 없음' };
    const nm = normName(row.sellerName);
    const same = nm && y24.offers.find((o) => normName(o.shopName) === nm || normName(o.shopId) === nm);
    if (same) return { verdict: 'sameSeller', why: `예스24에도 같은 판매자(${same.shopName})가 이 책을 올림 ${same.price.toLocaleString()}원`, offer: same };
    const need = GRADE_RANK[row.grade] ?? 0;
    const src = y24.offers.filter((o) => (GRADE_RANK[o.grade] ?? -1) >= need && o.price > 0).map((o) => ({ o, cost: o.price + (o.freeOver != null && o.price >= o.freeOver ? 0 : o.ship || 0) })).sort((a, b) => a.cost - b.cost)[0];
    if (!src) return { verdict: 'noSource', why: `예스24에 ${row.grade || ''} 이상 매물 없음 → 대행 불가 → 실물 없을 가능성 큼` };
    const income = row.price * (1 - S.feeRate) + (row.ship || 0); const margin = Math.round(income - src.cost);
    return margin >= 0
      ? { verdict: 'profitable', why: `대행해도 ${margin.toLocaleString()}원 남음 (알라딘 ${row.price.toLocaleString()}+배송 ${(row.ship || 0).toLocaleString()} vs 예스24 ${src.o.shopName} ${src.cost.toLocaleString()})`, margin, offer: src.o }
      : { verdict: 'loss', why: `대행하면 ${(-margin).toLocaleString()}원 손해 → 실제로 보낼 가능성 낮음`, margin, offer: src.o };
  }

  // ───────────────────────── 판정 ─────────────────────────
  function decide(listing, market, sellers, ctxIn) {
    const ctx = ctxIn || {}; const S = merge(DEFAULTS, ctx.settings || {}); const now = t(ctx.now) || Date.now();
    const R = []; const block = []; const out = { v: VERSION, key: listing.key, at: new Date(now).toISOString(), current: listing.price, reasons: R, autoBlock: block };
    out.group = groupOfListing(listing, S);
    const done = (status, extra) => { Object.assign(out, { status }, extra || {}); out.auto = out.action === 'set' && block.length === 0 && autoAllowed(out, S); out.execute = out.group === 'treat' && out.action === 'set'; if (out.group === 'control') out.reasons.push('비교군 — 판정만 기록, 가격은 바꾸지 않음'); return out; };

    // 0. 대상: 판매중만
    if (listing.status && listing.status !== '판매중') { R.push(`판매 상태가 '${listing.status}' — 수정 모드는 판매중만`); return done('skip', { action: 'none' }); }
    // 재고 기간 = '최저가 등록 기간'(측정값). 임시 기준은 '감시 시작일(cutoverAt) 전에 등록된 상품'에만, 그리고 스스로 끝남:
    //   임시 단계 = 감시 시작일 당시의 등록 후 일수로 고정(시간이 지나도 늘지 않음) → 최대 tempTierCap(T3)
    //   적용 단계 = max(측정 단계, 임시 단계) → 측정 단계가 T3에 닿는 순간 임시는 의미가 없어짐
    //   감시 시작일 + tempSunsetDays(365일)가 지나면 임시 기준은 코드에서 완전히 꺼짐 (그 뒤엔 측정값만)
    //   → 1년 뒤 '등록 2년차'로 잘못 뛰는 일 없음: 감시 전 시간은 T3 이상으로 절대 세지 않고, 감시 뒤에는 최저가를 지킨 날만 셈
    const regDays = Math.floor((now - t(listing.registeredAt)) / DAY);
    const lw = listing.lowest || { days: 0 }; const lowDays = Math.floor(lw.days || 0);
    const cut = S.cutoverAt ? t(S.cutoverAt) : null;
    const legacy = cut != null && t(listing.registeredAt) < cut;
    const sunset = cut != null ? cut + S.tempSunsetDays * DAY : null;
    let tier = tierOf(lowDays, S.tierBounds), basis = `최저가 등록 기간 ${lowDays}일`, days = lowDays, temp = null;
    if (cut == null) { tier = tierOf(regDays, S.tierBounds); if (tier !== 'T8' && +tier.slice(1) > +S.tempTierCap.slice(1)) tier = S.tempTierCap; basis = `감시 시작 전: 등록 후 ${regDays}일 (${S.tempTierCap}까지만)`; days = regDays; }
    else if (legacy && now < sunset) {
      const frozen = Math.floor((cut - t(listing.registeredAt)) / DAY); let tt = tierOf(frozen, S.tierBounds); if (+tt.slice(1) > +S.tempTierCap.slice(1)) tt = S.tempTierCap;
      if (+tt.slice(1) > +tier.slice(1)) { temp = { tier: tt, frozenDays: frozen, endsAt: new Date(sunset).toISOString().slice(0, 10) }; tier = tt; basis = `임시 기준: 감시 시작일까지 등록 ${frozen}일 → ${tt} (최저가 기간 ${lowDays}일이 따라잡거나 ${temp.endsAt}에 자동 종료)`; }
    }
    if (listing.registeredAt && regDays > S.tierBounds[S.tierBounds.length - 1]) { tier = 'T8'; basis = `등록 ${regDays}일 — 불용은 등록일 기준`; days = regDays; }
    const T = S.tiers[tier];
    out.tier = { code: tier, name: T.name, days, basis, regDays, lowestDays: lowDays, temp };
    if (listing.lock) { R.push('가격 잠금 상품 — 자동 수정 안 함'); return done('hold', { action: 'none' }); }
    const excl = isExcluded(listing, S); if (excl) { block.push(`${listing.sku}: 관리자 확인 필수 (자동 감시 제외 코드)`); R.push(`관리코드 ${listing.sku} — 자동 감시에서 제외, 판정은 참고용으로만 계산`); }
    if (tier === 'T8') { R.push(`등록 ${days}일 — 불용 재고: 일시판매중지 + 관리코드 뒤 3자리 ${SKU_TAGS.retire} (관리자 승인 필요, 원래 관리코드는 기록에 남김)`); return done('retire', { action: 'retire', toStatus: '일시판매중지', newSku: skuWith(listing.sku, 'retire'), origSku: listing.sku || null, autoBlock: block.concat('불용 처리는 항상 관리자 승인') }); }

    // 1. 관측이 쓸 만한가
    if (!market || !market.rows) { R.push('온라인 중고 관측이 없음'); return done('queue', { action: 'review', why: 'noMarket' }); }
    const age = (now - t(market.at)) / HOUR;
    if (age > S.staleHours) { R.push(`관측이 ${Math.round(age)}시간 전 — ${S.staleHours}시간 넘은 자료로는 판정하지 않음`); return done('wait', { action: 'none', why: 'stale' }); }
    if (listing.pendingChange && now - t(listing.pendingChange.at) < S.confirmHours * HOUR) {
      R.push(`우리가 ${listing.pendingChange.price.toLocaleString()}원으로 바꾼 지 ${S.confirmHours}시간이 안 됨 — 알라딘 반영 대기`); return done('wait', { action: 'none', why: 'ourReflect' });
    }

    // 2. 비교 범위: 첫 페이지 / 특별판 키워드면 뒤쪽 쪽까지
    const hits = specialHit(listing.title, S); const special = hits.length > 0;
    out.special = special ? hits : null;
    const maxPage = special ? S.specialMaxPages : 1;
    if (special && (market.pagesSeen || 1) < Math.min(S.specialMaxPages, market.lastPage || 1)) {
      R.push(`특별판 키워드(${hits.join(', ')}) — ${Math.min(S.specialMaxPages, market.lastPage)}쪽까지 봐야 하는데 ${market.pagesSeen || 1}쪽만 관측됨`);
      return done('wait', { action: 'none', why: 'needPages', needPages: Math.min(S.specialMaxPages, market.lastPage) });
    }
    // 우리 매물 빼기, 판매중지 줄 빼기. 24시간 안에 사라진 매물은 아직 있는 것으로 봄(반영 지연), 24시간 안에 새로 생긴 싼 매물은 '미확정'
    const ours = String(S.ourSeller);
    const all = market.rows.map((r, i) => ({ ...r, rank: i + 1 }))
      .concat((market.recentGone || []).filter((g) => now - t(g.goneAt) < S.confirmHours * HOUR).map((g) => ({ ...g, rank: (g.rank != null ? g.rank : 1) - 0.5, ghost: true })))
      .filter((r) => (r.page || 1) <= maxPage && !r.soldOut && r.price > 0);
    const others = all.filter((r) => String(r.sellerCode || '') !== ours && !(listing.usedCode && r.usedCode === listing.usedCode));
    others.sort((a, b) => a.rank - b.rank);
    if (!others.length) { R.push('비교할 다른 매물이 없음 (우리만 있음)'); return done('queue', { action: 'review', why: 'alone', rare: true }); }

    // 3. 터무니없는 가격 빼기 (다른 매물 중앙값 3배 초과 · 정가 1.5배 초과)
    const ps = others.map((r) => r.price).sort((a, b) => a - b); const med = ps[Math.floor(ps.length / 2)];
    const lp = listing.priceList || ctx.priceList || 0;
    const sane = others.filter((r) => r.price <= Math.max(med * S.insaneMult, lp * S.insaneListMult, 20000));
    if (sane.length < others.length) R.push(`터무니없는 가격 ${others.length - sane.length}건 뺌`);

    // 4. 판매자 색 붙이기
    const Core = coreOf(ctx); const RSx = rsOf(ctx);
    if (!ctx.classify && !(Core && Core.classifySellerDoc)) { R.push('기준 파일 readnow-core.js(1.2.0)를 못 읽음 — 판매자 분류 없이 판정하지 않음'); return done('queue', { action: 'review', why: 'noCore' }); }
    const classify = ctx.classify || ((r) => Core.classifySellerDoc(sellers && r.sellerCode ? sellers['sc_' + r.sellerCode] || sellers[r.sellerCode] || null : null, RSx));
    sane.forEach((r) => { if (isAladinSide(r, S)) { r.color = 'aladin'; r.why = '알라딘측'; } else { const c = classify(r, listing); r.color = c.cls; r.why = c.why; } });
    // 예스24 대조 (대행형 판별): 허위 매물로 직접 표시한 판매자는 사람이 정한 것이 우선이라 제외
    if (S.useYes24Proxy) sane.forEach((r) => {
      if (!['red', 'orange', 'yellow'].includes(r.color) || r.color === 'unknown') return;
      const doc = sellers && r.sellerCode ? sellers['sc_' + r.sellerCode] || sellers[r.sellerCode] : null; if (doc && (doc.ourGrade || doc.grade) === 'fake') return;
      const pc = proxyCheck(r, ctx.yes24, S); r.proxy = pc; if (pc.verdict === 'sameSeller' || pc.verdict === 'profitable') { r.color = 'proxy'; r.why = pc.why; }
    });
    const tot = (r) => r.price + (r.ship || 0);
    const first = sane[0]; // 목록 맨 위 (우리 제외)
    const allow = new Set(T.colors.concat('aladin', 'proxy'));
    let pool = sane.filter((r) => allow.has(r.color));
    out.rows = sane.map((r) => [r.rank, r.sellerCode || null, r.color, r.grade || null, r.price, r.ship || 0, r.sellerName || null]); // 학습용 근거 (상품 기준으로 옮겨 갈 자료)
    out.counts = { all: sane.length, valid: sane.filter((r) => ['dkgreen', 'green', 'aladin'].includes(r.color)).length, inPool: pool.length };

    // 희소 후보: 기간 할인에서 빼고 사람 확인
    const nValid = out.counts.valid; const rare = nValid <= S.rareMaxValid && sane.length <= S.rareMaxAll;
    out.rare = rare;
    if (listing.protect || rare) { R.push(listing.protect ? `보호 재고(${listing.protect}) — 기간 할인·자동 인하 안 함` : `희소 후보 — 유효 판매자 ${nValid}곳·전체 ${sane.length}곳`); }

    // 5. 기준 상품 고르기 — 상태 등급: 최상 > 상 > 중 (최상이 가장 좋음)
    // ★ 소비자는 상태가 같거나 더 좋은 매물이 더 싸면 그쪽을 산다 → 같은 등급뿐 아니라 '더 좋은 등급' 유효 매물도 모두 기준 후보.
    //   더 좋은 등급 매물은 판매가를 우리 등급 값으로 환산(등급 계수 비율)해 비교 → 우리 가격은 항상 그 매물보다 확실히 싸짐
    //   (2026-10-04 사고: 우리 '중' 1,000원 위에 '상' 590원 유효 매물이 있는데 같은 등급만 봐서 놓침)
    //   더 나쁜 등급 매물은 기준으로 삼지 않되(상태 이점 유지), 우리보다 싸면 이유 칸에 알림
    const gr = (g) => (GRADE_RANK[g] != null ? GRADE_RANK[g] : -1); const myR = gr(listing.grade);
    const myC = S.gradeCoef[listing.grade];
    const effTotal = (r) => { if (myR < 0 || r.grade === listing.grade) return tot(r); const c = S.gradeCoef[r.grade]; return c && myC ? Math.round(r.price * (myC / c)) + (r.ship || 0) : tot(r); }; // 환산은 판매가에만, 배송비는 그대로
    let cand = pool.filter((r) => myR < 0 || gr(r.grade) >= myR);
    let ref = null, how = '';
    if (tier === 'T1') {
      const fresh = listing.pubDate && now - t(listing.pubDate) < 365 * DAY;
      if (!fresh && cand.some((r) => r.color === 'dkgreen')) { cand = cand.filter((r) => r.color === 'dkgreen' || r.color === 'aladin'); how = '신규: 짙은 초록(·알라딘측) 기준'; }
      else if (fresh) how = '신규 + 출간 12개월 이내: 초록 기준';
    }
    const ourShip0 = listing.ship != null ? listing.ship : (ctx.policy && ctx.policy.fee) || 0;
    if (cand.length) {
      const best = cand.reduce((a, b) => (effTotal(b) < effTotal(a) ? b : a));
      const firstOk = first && cand.includes(first) && first.grade === listing.grade && (first.ship || 0) - ourShip0 <= S.firstTieMaxShipGap
        && !cand.some((r) => r.grade !== listing.grade && effTotal(r) < tot(first)); // 더 좋은 등급이 환산해서 더 싸면 맨 위 동가로 끝내지 않음
      if (firstOk) { ref = first; ref.conv = null; how = how || '목록 맨 위(최저가 표시)가 같은 등급 유효 상품'; }
      else if (best.grade === listing.grade || myR < 0) { ref = best; ref.conv = null; how = how || '같은 등급 유효 최저(배송비 포함 총액)'; }
      else { ref = { ...best, conv: effTotal(best) }; how = `더 좋은 등급(${best.grade}) 매물이 더 쌈 → ${listing.grade} 값으로 환산 (판매가 ${best.price.toLocaleString()} × ${myC}/${S.gradeCoef[best.grade]})`; R.push(`상태가 더 좋은 ${best.grade} 매물(${best.sellerName || best.sellerCode || '알라딘측'})이 ${best.price.toLocaleString()}원 — 우리 상품(${listing.grade})은 그보다 싸야 팔림`); if (!S.autoAllowConverted) block.push('더 좋은 등급 기준(환산)'); }
    }
    const worse = pool.filter((r) => myR >= 0 && gr(r.grade) >= 0 && gr(r.grade) < myR).sort((a, b) => tot(a) - tot(b))[0];
    if (worse) out.worseCheapest = { grade: worse.grade, price: worse.price, ship: worse.ship || 0, sellerName: worse.sellerName || null };
    if (!ref) { R.push(`${special ? `${maxPage}쪽까지` : '첫 페이지에'} 기준이 될 매물(${T.colors.map((c) => LABEL[c]).join('·')}·알라딘측)이 없음`); return done('queue', { action: 'review', why: 'noRef' }); }
    const refTotal = ref.conv != null ? ref.conv : tot(ref);
    if (S.useYes24Proxy && !ctx.yes24 && sane.some((r) => r.rank < ref.rank && ['red', 'orange', 'yellow'].includes(r.color))) { out.needYes24 = true; R.push('기준보다 앞에 무효·보류 매물이 있음 — 예스24 대조 자료가 없어 일단 제외하고 판정 (다음 감시 때 예스24를 같이 봄)'); }
    const unknownAhead = sane.filter((r) => r.color === 'unknown' && r.rank < ref.rank);
    if (unknownAhead.length) { R.push(`기준보다 앞에 판매자 기록이 없는 매물 ${unknownAhead.length}건 — 판매자 정보를 먼저 모아야 판정 가능`); return done('wait', { action: 'none', why: 'needSellers', needSellers: [...new Set(unknownAhead.map((r) => r.sellerCode))] }); }
    out.ref = { rank: ref.rank, sellerCode: ref.sellerCode || null, sellerName: ref.sellerName || null, color: ref.color, grade: ref.grade, price: ref.price, ship: ref.ship || 0, total: refTotal, how, isFirst: !!(first && (ref === first || (ref.listingId && ref.listingId === first.listingId))), ghost: !!ref.ghost };
    if (ref.ghost) { R.push('기준 매물이 사라졌지만 24시간이 안 돼 아직 있는 것으로 봄 — 확정될 때까지 지금 가격 유지'); return done('wait', { action: 'none', why: 'refGone' }); }
    // 안전: 유효 기준이 목록 맨 위보다 터무니없이 비쌈 → 진짜 싼 매물을 판매자 점수로 버린 것일 수 있음
    if (first && refTotal > tot(first) * S.queueGapMult) { R.push(`유효 기준(${refTotal.toLocaleString()}원)이 목록 맨 위(${tot(first).toLocaleString()}원, ${LABEL[first.color] || first.color})보다 ${S.queueGapMult}배 넘게 비쌈`); return done('queue', { action: 'review', why: 'gapToFirst' }); }
    // 24시간 안에 새로 생긴 기준은 아직 확정 아님 (내리는 쪽만 기다림)
    const refYoung = ref.firstSeenAt && now - t(ref.firstSeenAt) < S.confirmHours * HOUR;

    // 6. 소매 기준가: 맨 위면 동가, 아니면 배송비 차이 반영 + 구매자 이점
    const ourShip = listing.ship != null ? listing.ship : (ctx.policy && ctx.policy.fee) || 0;
    let base, rule;
    if (ref.conv != null) { const tie = ref.conv - ourShip; base = snapDown(tie); if (base >= ref.price) base = stepDown(ref.price); rule = `더 좋은 등급 매물의 환산 총액 ${ref.conv.toLocaleString()} − 우리 배송비 ${ourShip.toLocaleString()} (그 매물 판매가 ${ref.price.toLocaleString()}원보다 반드시 쌈)`; }
    else if (out.ref.isFirst && (ref.ship || 0) - ourShip <= S.firstTieMaxShipGap) { base = ref.price; rule = '기준이 목록 맨 위(최저가 표시) → 동가, 더 내리지 않음'; }
    else if (out.ref.isFirst) { const tie = ref.price + (ref.ship || 0) - ourShip; base = snapDown(tie * (1 - S.advPct)); if (base >= tie) base = stepDown(tie); rule = `맨 위지만 배송비가 우리보다 ${((ref.ship || 0) - ourShip).toLocaleString()}원 비쌈 → 판매가 동가로 맞추면 배송비 차이만큼 마진을 버림 → 총액 기준 ${Math.round(S.advPct * 100)}% 이점`; }
    else { const tie = ref.price + (ref.ship || 0) - ourShip; base = snapDown(tie * (1 - S.advPct)); if (base >= tie) base = stepDown(tie); rule = `총액 동가 ${tie.toLocaleString()}원에서 구매자 이점 ${Math.round(S.advPct * 100)}% (단위 내림)`; }

    // 7. 재고 기간 할인 (보호·희소는 할인 없음). 추격자가 기준이면 '맨 위 동가'보다 더 내리지 않음
    let d = T.disc[S.discPick === 'high' ? 1 : 0];
    if (listing.protect || rare) d = 0;
    const chased = ctx.chase && ref.sellerCode && (ctx.chase[ref.sellerCode] || {}).active;
    if (chased && d > 0) { R.push(`기준 판매자가 추격자(${ref.sellerName || ref.sellerCode}) — 할인 없이 동가 유지 (가격 싸움 피함)`); d = 0; }
    let target = d > 0 ? snapDown(base * (1 - d)) : base;
    if (d > 0) rule += ` → ${T.name} 할인 ${Math.round(d * 100)}%`;

    // 8. 하한선 (알라딘 매입가만)
    const F = floors(listing, tier, ctx, S); out.floors = F;
    let floored = false;
    if (F.fBuyback && target < F.fBuyback) {
      const gap = (F.fBuyback - target) / F.fBuyback;
      if (gap >= S.buybackTolerance) { R.push(`목표가 ${target.toLocaleString()}원이 알라딘 매입가 하한가 ${F.fBuyback.toLocaleString()}원보다 ${Math.round(gap * 100)}% 낮음 → 하한가에 멈춤 (알라딘 매입가 ${F.buyback.toLocaleString()}원 — 이 가격에 팔면 알라딘에 파는 것보다 덜 남음)`); target = F.fBuyback; floored = true; out.sellToAladin = true; block.push('알라딘 매입가 하한'); }
      else R.push(`목표가가 알라딘 매입가 하한가보다 ${Math.round(gap * 100)}% 낮지만 ${Math.round(S.buybackTolerance * 100)}% 안이라 최저가를 그대로 맞춤`);
    }

    if (out.worseCheapest && out.worseCheapest.price + out.worseCheapest.ship < target + ourShip) R.push(`참고: 상태가 낮은 ${out.worseCheapest.grade} 매물(${out.worseCheapest.sellerName || ''})이 ${out.worseCheapest.price.toLocaleString()}원 + 배송 ${out.worseCheapest.ship.toLocaleString()}원으로 더 쌈 — 상태 이점이 있어 기준으로 삼지 않음 (판단 기록으로 확인 중)`);
    // 9. 바꿀 만한가: 한 단위 미만 차이는 그대로. 단 기준 가격을 넘나드는 변화(순위가 바뀜)는 바꿈
    const cur = listing.price; const delta = target - cur; const crosses = ref.conv == null && ((cur > ref.price && target <= ref.price) || (cur <= ref.price && target > ref.price));
    out.target = target; out.delta = delta; out.deltaPct = cur ? delta / cur : null; out.rule = rule; out.discount = d;
    if (delta === 0 || (Math.abs(delta) < priceStep(cur) && !crosses)) { R.push(`지금 가격 유지 (${rule})`); return done('ok', { action: 'none' }); }
    if (delta < 0 && refYoung) { R.push(`기준 매물이 ${S.confirmHours}시간 안에 새로 나타남 — 확정될 때까지 내리지 않음`); return done('wait', { action: 'none', why: 'refYoung' }); }
    if (delta < 0 && (listing.protect || rare)) { R.push('보호·희소 상품은 자동으로 내리지 않음'); block.push(listing.protect ? '보호 재고' : '희소 후보'); }
    if (special) block.push(`특별판 키워드(${hits.join(', ')})`);
    if (delta < 0 && -out.deltaPct > S.maxAutoDropPct) block.push(`한 번에 ${Math.round(-out.deltaPct * 100)}% 인하`);
    if (delta > 0 && out.deltaPct > S.maxAutoRaisePct) block.push(`한 번에 ${Math.round(out.deltaPct * 100)}% 인상`);
    R.push(`${delta > 0 ? '올림' : '내림'} ${cur.toLocaleString()} → ${target.toLocaleString()}원 (${rule})`);
    return done(floored ? 'floor' : 'ok', { action: 'set' });
  }

  // 실험 묶음: 상품코드를 0~99 칸에 고정 배정 (FNV 해시). 0..treat-1 = 적용, 그다음 control 칸 = 비교군(판정만 기록, 절대 안 바꿈), 나머지 = 꺼짐
  function bucketOf(code) { let h = 2166136261; const s = String(code || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h % 100; }
  function groupOf(code, S0) { const S = merge(DEFAULTS, S0 || {}); const b = bucketOf(code); const tp = S.rollout.treatPct, cp = S.rollout.controlPct;
    return b < tp ? 'treat' : b >= 100 - cp ? 'control' : 'off'; }
  // 상품 단위 묶음: 제외 관리코드(KHKDVD 등)와 보관함(PND·BAD)을 먼저 보고, 그다음 상품코드 칸으로 적용·비교·꺼짐
  function isExcluded(listing, S0) { const S = merge(DEFAULTS, S0 || {}); const sku = String((listing && listing.sku) || '').toUpperCase(); return (S.excludeSku || []).some((x) => x && sku === String(x).toUpperCase()); }
  function groupOfListing(listing, S0) {
    if (!listing) return 'off'; const tag = skuTag(listing.sku); if (tag) return tag; if (isExcluded(listing, S0)) return 'excluded';
    if (listing.status && listing.status !== '판매중') return 'off'; return groupOf(listing.usedCode || listing.key, S0);
  }
  function autoAllowed(o, S) {
    if (S.autoLevel === 'L0') { o.autoBlock.push('자동 단계 L0 (전부 사람 확인)'); return false; }
    if (S.autoLevel === 'L1' && Math.abs(o.deltaPct || 0) > 0.15) { o.autoBlock.push('L1: 15% 넘는 변경은 사람 확인'); return false; }
    return true;
  }

  // ───────────────────────── 추격자 ─────────────────────────
  // 추격 사건 = 우리가 가격을 바꾼 뒤 windowHours(기본 24시간) 안에 그 판매자가 같은 책에서 우리 새 가격 이하로 바꾼 것 (가격 폭은 안 봄, 횟수만)
  // ourChanges: [{at, price}]  theirChanges: [{sellerCode, at, price}]  (둘 다 같은 책)
  function chaseEvents(ourChanges, theirChanges, S0) {
    const S = merge(DEFAULTS, S0 || {}).chase; const ev = [];
    for (const o of ourChanges || []) for (const c of theirChanges || []) { const dt = t(c.at) - t(o.at); if (dt > 0 && dt <= S.windowHours * HOUR && c.price <= o.price) ev.push({ sellerCode: c.sellerCode, at: c.at, ourAt: o.at }); }
    return ev;
  }
  // 책 단위 판정: lookbackDays(7일) 안에 minEvents(3회) 이상 → 추격자. 점수는 halfLifeDays(14일)마다 절반, releaseDays(30일) 동안 사건 없으면 해제
  function chaseState(events, now0, S0) {
    const S = merge(DEFAULTS, S0 || {}).chase; const now = t(now0) || Date.now(); const by = {};
    for (const e of events || []) (by[e.sellerCode] = by[e.sellerCode] || []).push(t(e.at));
    const out = {};
    for (const [sc, ts] of Object.entries(by)) {
      const recent = ts.filter((x) => now - x <= S.lookbackDays * DAY).length; const last = Math.max(...ts);
      const score = ts.reduce((a, x) => a + Math.pow(0.5, (now - x) / (S.halfLifeDays * DAY)), 0);
      const active = recent >= S.minEvents || (score >= 1 && now - last < S.releaseDays * DAY && ts.length >= S.minEvents);
      out[sc] = { active, recent, score: Math.round(score * 100) / 100, last: new Date(last).toISOString() };
    }
    return out;
  }
  // 판매자 단위: 서로 다른 책 sellerMinBooks(3권) 이상에서 추격자면 판매자 전체 표시
  function sellerChase(bookStates, S0) {
    const S = merge(DEFAULTS, S0 || {}).chase; const n = {};
    for (const st of Object.values(bookStates || {})) for (const [sc, x] of Object.entries(st)) if (x.active) n[sc] = (n[sc] || 0) + 1;
    const out = {}; for (const [sc, c] of Object.entries(n)) out[sc] = { books: c, active: c >= S.sellerMinBooks }; return out;
  }

  // ───────────────────────── 최저가 등록 기간 ─────────────────────────
  // 하루 관측(확정된 것)마다 호출. atLowest = 그 관측에서 우리 매물이 기준(유효 최저가·맨 위 동가) 자리였는가 (decide 결과 action 'none' + status 'ok' 또는 방금 그 자리로 맞춘 뒤 확정)
  // 두 관측이 모두 최저가였고 간격이 lowestMaxGapHours 이하일 때만 그 사이 시간을 더함 → 정확히 아는 시간만 셈. 처음 관측부터 측정 시작(measured=true)
  function trackLowest(state, obs, S0) {
    const S = merge(DEFAULTS, S0 || {}); const st = state ? { ...state } : { days: 0, measured: true, since: obs.at, lastAt: null, lastLowest: false, obsN: 0 };
    const at = t(obs.at); const prev = st.lastAt ? t(st.lastAt) : null;
    if (prev != null && at <= prev) return st; // 같은·옛 관측은 무시
    if (prev != null && st.lastLowest && obs.atLowest && at - prev <= S.lowestMaxGapHours * HOUR) st.days = Math.round((st.days + (at - prev) / DAY) * 1000) / 1000;
    st.lastAt = new Date(at).toISOString(); st.lastLowest = !!obs.atLowest; st.obsN = (st.obsN || 0) + 1; return st;
  }

  const api = { VERSION, DEFAULTS, LABEL, priceStep, snapDown, snapUp, stepDown, tierOf, setTierRange, trackLowest, bucketOf, groupOf, groupOfListing, isExcluded, proxyCheck, SKU_TAGS, skuTag, skuWith, specialHit, sellNet, minPriceFor, floors, decide, chaseEvents, chaseState, sellerChase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowPricing = api;
})(typeof window !== 'undefined' ? window : this);
