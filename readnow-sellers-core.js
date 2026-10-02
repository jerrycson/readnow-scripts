/* readnow-sellers-core.js
 * 판매자 점수(본보기·득실) 계산 — 웹앱과 알라딘 화면(판매자 툴팁)이 같은 파일을 써서 항상 같은 점수를 보여준다.
 * 순수 함수만 둔다 (저장·네트워크 없음). ERP·PC 엔진에서도 그대로 재사용.
 *
 *  모범 (배울 만한가, 100점, 반대는 불량): 돈을 잘 벌면서 오래 갈 수 있는 방식인가. 상도·기본 윤리를 어기면 상한을 강제로 낮춘다.
 *  우리 이득 (우리 돈에 어떤가, 50 = 중립: 우리에게 이득 / 우리에게 불익): 순전히 북스킹의 매출·이익에 이득인가 손해인가.
 */
(function (root) {
  'use strict';
  const VERSION = '1.3.0';
  const DEFAULT_THRESHOLDS = { modelHigh: 70, modelLow: 35, gainHigh: 60, gainLow: 40 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const numK = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null; const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : null; };
  const won = (n) => (n == null ? '-' : Math.round(n).toLocaleString('ko-KR') + '원');
  const numTxt = (n) => (n == null ? '-' : Math.round(n).toLocaleString('ko-KR'));

  // 판매자 기록(웹앱 sellers 문서 / 툴팁 정보) → 계산용 값
  //  평점: 비율(0.985). 품절 취소율: 비율. 툴팁 기록(sc 있음)은 퍼센트 숫자로 저장돼 있어 100으로 나눔
  function normalize(s, now) {
    const t = now || Date.now();
    const r = s.rating ?? s.rating6m; const rating = r == null || r === '' ? null : Number(r) > 1 ? Number(r) / 100 : Number(r);
    const o = s.outstockRate; const outRatio = o == null || o === '' ? null : s.sc ? Number(o) / 100 : Number(o) > 1 ? Number(o) / 100 : Number(o);
    return {
      rating: Number.isFinite(rating) ? rating : null,
      outRatio: Number.isFinite(outRatio) ? outRatio : null,
      reviews: numK(s.totalReviewCount) || numK(s.reviewsAll) || null,
      items: numK(s.totalItems) || numK(s.stock) || null,
      years: s.firstReviewDate ? (t - new Date(String(s.firstReviewDate).slice(0, 10))) / (365.25 * 864e5) : null,
      days: numK(s.shippingDays) ?? numK(s.actualDays) ?? null,
      freeShipping: numK(s.freeShipping), shippingFee: numK(s.shippingFee),
      grade: s.aladinGrade || '', fake: (s.ourGrade || s.grade) === 'fake',
    };
  }
  const linkLevel = (l) => (l.level ? l.level : (l.reasons || []).some((r) => r === '전화' || r === '이메일') ? 'match' : 'suspect');

  // opts: { bought: 우리고객 정보와 일치하는 고객들의 순매출 합, thresholds, now }
  function score(s, opts) {
    const o = opts || {}; const T = { ...DEFAULT_THRESHOLDS, ...(o.thresholds || {}) }; const n = normalize(s, o.now);
    const mp = []; let got = 0, wsum = 0;
    const add = (w, v, label, why) => { if (v == null) { mp.push({ label, pts: null, w, why: '자료 없음' }); return; } const p = clamp(v, 0, 1) * w; got += p; wsum += w; mp.push({ label, pts: p, w, why }); };
    add(25, n.rating == null ? null : (n.rating - 0.95) / 0.045, '고객 신뢰 (평점)', n.rating == null ? '' : `평점 ${(n.rating * 100).toFixed(1)}%`);
    add(20, n.outRatio == null ? null : 1 - (n.outRatio - 0.002) / 0.028, '약속 이행 (품절 취소율 낮음)', n.outRatio == null ? '' : `품절 취소율 ${(n.outRatio * 100).toFixed(2)}%`);
    add(20, n.reviews == null ? null : Math.log10(n.reviews + 1) / Math.log10(50000), '판매 성과 (누적 평가 수)', n.reviews == null ? '' : `평가 ${numTxt(n.reviews)}건 (판매량의 대리 지표)`);
    add(15, n.years == null ? null : n.years / 10, '지속성 (업력)', n.years == null ? '' : `첫 평가부터 ${n.years.toFixed(1)}년`);
    add(10, n.days == null ? null : 1 - (n.days - 1) / 4, '속도 (출고일)', n.days == null ? '' : `출고 ${n.days}일`);
    add(10, n.items == null ? null : Math.log10(n.items + 1) / 5, '상품력 (보유 상품 수)', n.items == null ? '' : `보유 ${numTxt(n.items)}개`);
    const known = mp.filter((x) => x.pts != null).length;
    let model = known >= 3 && wsum ? Math.round((got / wsum) * 100) : null; const gates = [];
    if (n.fake) { gates.push('허위 매물 판매자 — 상도 위반'); model = model != null ? Math.min(model, 15) : 10; }
    if (n.outRatio != null && n.outRatio > 0.05) { gates.push(`품절 취소율 ${(n.outRatio * 100).toFixed(1)}% — 없는 재고를 파는 방식으로 의심`); if (model != null) model = Math.min(model, 30); }
    // 득실: 50에서 시작
    const gp = []; let gain = 50; const g = (v, label) => { if (!v) return; gain += v; gp.push({ v, label }); };
    const bought = o.bought || 0;
    if (bought) g(Math.round(clamp(bought / 50000, 0, 1) * 20), `우리 책을 ${won(bought)} 사 감 (우리 고객으로서 매출)`);
    if (n.items != null) g(-Math.round(clamp(Math.log10(n.items + 1) / 5, 0, 1) * 15), `보유 ${numTxt(n.items)}개 — 같은 책에서 부딪칠 가능성`);
    if (/파워|골드/.test(n.grade)) g(-5, `${n.grade} — 검색·노출에서 유리`);
    if (n.freeShipping != null && n.freeShipping > 0 && n.freeShipping <= 15000) g(-5, `무료배송 ${won(n.freeShipping)}부터 — 묶음 구매 고객을 끌어감`);
    if (n.shippingFee != null) { if (n.shippingFee >= 3000) g(5, `배송비 ${won(n.shippingFee)} — 우리 쪽이 상대적으로 쌈`); else if (n.shippingFee <= 1500) g(-5, `배송비 ${won(n.shippingFee)} — 싼 배송비로 고객을 끌어감`); }
    if (n.rating != null && n.rating < 0.97) g(5, `평점 ${(n.rating * 100).toFixed(1)}% — 고객이 떠날 여지`);
    if (n.outRatio != null && n.outRatio > 0.01) g(5, `품절 취소 ${(n.outRatio * 100).toFixed(1)}% — 취소된 고객이 다른 판매자로 옴`);
    if (n.fake) g(-20, '허위 매물 — 가짜 최저가로 고객을 빼앗고 가격 판단을 흐림');
    gain = clamp(Math.round(gain), 0, 100);
    const mcls = model == null ? 'na' : model >= T.modelHigh ? 'good' : model <= T.modelLow || gates.length ? 'bad' : 'mid';
    const gcls = gain >= T.gainHigh ? 'good' : gain <= T.gainLow ? 'bad' : 'mid';
    return { model, mcls, mp, gates, gain, gcls, gp, norm: n };
  }
  const MODEL_TXT = { good: '모범', mid: '보통', bad: '불량', na: '판단 보류' };
  const GAIN_TXT = { good: '우리에게 이득', mid: '중립', bad: '우리에게 불익' };
  const GAIN_SHORT = { good: '이득', mid: '중립', bad: '불익' };
  function quadrant(x) {
    if (x.mcls === 'good' && x.gcls === 'bad') return '강한 경쟁자 — 배우되 경계';
    if (x.mcls === 'good') return '좋은 본보기 — 적극적으로 배움';
    if (x.mcls === 'bad' && x.gcls === 'good') return '약한 경쟁자 — 우리에겐 이득, 따라 하지 않음';
    if (x.mcls === 'bad' && x.gcls === 'bad') return '위협 — 따라 하지 말고 대응';
    return '';
  }
  function modelReasons(x, k) { const n = k || 2; const pos = x.mp.filter((p) => p.pts != null).sort((a, b) => b.pts / b.w - a.pts / a.w); return { good: pos.slice(0, n).filter((p) => p.pts / p.w >= 0.6).map((p) => p.why), weak: [...x.gates, ...pos.slice(-n).filter((p) => p.pts / p.w < 0.4).map((p) => p.why)] }; }
  function gainReasons(x) { const s = x.gp.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v)); return { plus: s.filter((a) => a.v > 0).map((a) => a.label), minus: s.filter((a) => a.v < 0).map((a) => a.label) }; }
  // 툴팁이 알라딘에서 막 읽은 정보(아직 웹앱 기록에 없는 판매자) → 임시 판매자 기록
  function fromTooltip(info, company, sc) {
    const pct = (v) => { const x = numK(v); return x == null ? null : x > 1 ? x / 100 : x; };
    return { sc, name: info.sellerName || null, aladinGrade: info.sellerGrade || null, rating: pct(info.rating), totalReviewCount: numK(info.totalReviewCount), outstockRate: numK(info.outstockRate),
      totalItems: numK(info.totalItems), shippingDays: numK(info.shippingDays), freeShipping: /무조건/.test(info.freeShipping || '') ? null : numK(info.freeShipping), shippingFee: numK(info.shippingFee),
      firstReviewDate: company && company.firstReviewDate ? company.firstReviewDate : null, linkedCustomers: [] };
  }
  // 판매자 평가 목록 한 페이지 → [{d: 작성일, r: 'good'|'mid'|'bad', c: 코멘트, a: 작성자(보이는 그대로)}]
  //  날짜 칸(class="y_usedsmall")이 있는 줄을 평가 한 건으로 보고, 같은 줄에서 만족도·작성자·코멘트를 읽는다.
  function parseSurveyPage(doc) {
    const txt = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');
    const out = [];
    doc.querySelectorAll('td.y_usedsmall').forEach((td) => {
      const d = txt(td); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      const tr = td.closest('tr'); if (!tr) return;
      const cells = [...tr.children].map(txt).filter((t) => t && t !== d);
      const all = cells.join(' | ');
      const r = /불만족/.test(all) ? 'bad' : /보통/.test(all) ? 'mid' : /만족/.test(all) ? 'good' : null;
      const img = tr.querySelector('img[alt*="만족"], img[alt*="보통"]'); const ra = img ? img.getAttribute('alt') : '';
      const r2 = r || (/불만족/.test(ra) ? 'bad' : /보통/.test(ra) ? 'mid' : /만족/.test(ra) ? 'good' : null);
      const a = cells.find((t) => /\*/.test(t) && t.length <= 30) || null;
      const c = cells.filter((t) => t !== a && !/^(만족|보통|불만족)$/.test(t)).sort((x, y) => y.length - x.length)[0] || '';
      out.push({ d, r: r2, c: c.slice(0, 500), a });
    });
    const nums = [...(doc.documentElement ? doc.documentElement.innerHTML : '').matchAll(/Page_Set\('(\d+)'\)/g)].map((m) => +m[1]);
    return { rows: out, lastPage: nums.length ? Math.max(...nums) : 1 };
  }
  // 날짜별 [만족, 보통, 불만족] 묶음 → 기간별 합계
  function reviewStats(days, now) {
    const t = now || Date.now(); const ds = (n) => new Date(t - n * 864e5).toISOString().slice(0, 10);
    const cut = { d7: ds(7), d30: ds(30), d90: ds(90), d180: ds(180), d365: ds(365) }; const st = { d7: 0, d30: 0, d90: 0, d180: 0, d365: 0, total: 0, good: 0, mid: 0, bad: 0, first: null, last: null };
    for (const [d, v] of Object.entries(days || {})) { const n = (v[0] || 0) + (v[1] || 0) + (v[2] || 0); st.total += n; st.good += v[0] || 0; st.mid += v[1] || 0; st.bad += v[2] || 0;
      for (const k of Object.keys(cut)) if (d > cut[k]) st[k] += n; if (!st.first || d < st.first) st.first = d; if (!st.last || d > st.last) st.last = d; }
    return st;
  }
  // 판매자 숍 첫 화면의 '구매 만족도' 표 → 기간별 평점·평가 수 (최근 6개월 평가 수가 판매량을 가늠하는 핵심 값)
  // 판매자 숍 첫 화면 → 등급·구매만족도(기간별)·품절취소율·판매자 정보
  // · 등급: 이름 옆 라벨(span.usedseller_label_*) — 전문셀러(사업자, 알라딘 인증) / 파워·골드·실버·새내기셀러(= 모두 개인셀러)
  // · 구매만족도 표: 기간 · 평점 · 평가수 · 만족 · 보통 · 불만족. '-' = 그 기간 평가가 3건 미만이라 알라딘이 표시하지 않음 (0이 아님)
  // · 판매자 정보: 전문셀러만 상호·대표자·전화·이메일·사업자등록번호 등이 보임. 개인셀러는 '최근 7일 내 거래 고객에게만 연락처 제공' 문구뿐
  // 반환 status: 'ok'(6개월 평가 수 있음) · 'lt3'(6개월 줄은 있으나 '-' = 최근 6개월 평가 3건 미만, 활동 없음에 가까움) · 'missing'(표 자체가 없음 = 화면 구조 문제)
  function parseShopSummary(doc) {
    const txt = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');
    const num = (c) => (/^[\d,]+$/.test(c || '') ? parseInt(c.replace(/,/g, ''), 10) : null);
    const periods = {}; let sawTable = false;
    const gp = doc.getElementById('guide_GoodPoint'); const rowsRoot = gp || doc;
    rowsRoot.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children].map(txt); if (!cells.length) return;
      const label = cells.find((c) => /^(최근\s*\d+\s*(개월|주|일)|전체\s*기간)$/.test(c)); if (!label) return;
      const rest = cells.slice(cells.indexOf(label) + 1); const key = label.replace(/\s+/g, ' ');
      if (gp || rest.length >= 5) sawTable = true;
      if (gp) { // 구매만족도 표: 평점 · 평가수 · 만족 · 보통 · 불만족
        const [r, n, g, so, bad] = rest; periods[key] = { rating: /^[\d.]+\s*%$/.test(r || '') ? parseFloat(r) / 100 : null, count: num(n), good: num(g), soso: num(so), bad: num(bad), lt3: (n || '').trim() === '-' };
      } else { const rating = rest.find((c) => /^[\d.]+\s*%$/.test(c)); const count = rest.find((c) => /^[\d,]+$/.test(c)); if (rating || count) periods[key] = { rating: rating ? parseFloat(rating) / 100 : null, count: count ? num(count) : null }; }
    });
    // 품절취소율 (최근 3개월)
    let cancel3m = null; const oc = doc.getElementById('guide_OutStockCancelRate'); if (oc) { const m = txt(oc).match(/최근\s*3\s*개월\s*([\d.]+)\s*%/); if (m) cancel3m = parseFloat(m[1]) / 100; }
    // 등급
    const gl = doc.querySelector('span[class^="usedseller_label"], span[class*=" usedseller_label"]'); const grade = gl ? txt(gl) : null; const isPro = grade ? /전문/.test(grade) : null;
    // 판매자 정보 (전문셀러만 내용 있음)
    const info = {}; let infoNote = null; const il = doc.getElementById('sellerInfoLayer');
    if (il) { il.querySelectorAll('.seller_infolayer_list li').forEach((li) => { const k = txt(li.querySelector('.left')), v = txt(li.querySelector('.right')); if (k) info[k] = v; }); if (!Object.keys(info).length) { const t = txt(il).replace(/판매자 정보|닫기/g, '').trim(); infoNote = t.slice(0, 200) || null; } }
    const p6 = periods['최근 6개월']; let rev6m = p6 ? p6.count : null;
    if (rev6m == null && !(p6 && p6.lt3)) { const m = (doc.body ? doc.body.textContent : '').match(/최근\s*6\s*개월,?\s*([\d,]+)\s*개\s*평가/); if (m) rev6m = parseInt(m[1].replace(/,/g, ''), 10); }
    const status = rev6m != null ? 'ok' : p6 && p6.lt3 ? 'lt3' : sawTable || gp ? 'lt3' : 'missing';
    const tot = periods['전체 기간'];
    return { status, periods, rev6m, rev6mLt3: !!(p6 && p6.lt3), total: tot ? tot.count : null, totalLt3: !!(tot && tot.lt3), grade, isPro, cancel3m, info: Object.keys(info).length ? info : null, infoNote };
  }
  // 최근 6개월 평가 수: 숍 화면 값(가장 정확) → 모은 평가(6개월 이상 모았을 때) → 툴팁 기록 → 구글 시트
  function rev6m(s) {
    if (s.rev6m != null) return { n: s.rev6m, src: '숍 화면', at: s.rev6mAt || null };
    const st = s.reviewStats; if (st && st.d180 != null && (st.complete || (st.first && st.first <= new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10)))) return { n: st.d180, src: '모은 평가', at: st.at || null };
    if (s.rev6mLt3) return { n: null, lt3: true, src: '숍 화면: 3건 미만', at: s.rev6mAt || null }; // 알라딘이 '-'로 표시 = 최근 6개월 평가 3건 미만 (0이 아님)
    const tc = numK(s.reviewCount); if (tc != null) return { n: tc, src: '툴팁 기록', at: s.lastFetchedAt || null };
    const sh = numK(s.reviews6m ?? (s.sheet && s.sheet.reviews6m)); if (sh != null) return { n: sh, src: '구글 시트', at: null };
    return { n: null, src: null, at: null };
  }
  const api = { VERSION, DEFAULT_THRESHOLDS, normalize, score, linkLevel, quadrant, modelReasons, gainReasons, fromTooltip, MODEL_TXT, GAIN_TXT, GAIN_SHORT, parseSurveyPage, reviewStats, parseShopSummary, rev6m };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowSellers = api;
})(typeof window !== 'undefined' ? window : this);
