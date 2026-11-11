/* readnow-sellerlearn-core.js — 🧑‍🏫 판매자 추적(배척 + 배움) 공용 셈 (정범님 11/11 저녁 · 일꾼 sell1)
 * 순수 함수만(저장·네트워크 없음) — 웹앱(🔭 시장조사 › 🏪 경쟁 판매자)과 클라우드(sellerLearnStudy 매일)가 같은 파일을 씀.
 *
 *  ① 판정 조건 여러 개 동시(모두/하나라도) + 충돌 순서: 한 판매자가 여러 조건에 걸리고 판정(배척·주의·배움·정보)이 서로 다르면
 *     사용자가 정한 순서에서 앞의 조건이 이김. 블랙리스트 고객(고객 표시)과 허위 매물 판매자(판매자 표시)는 다른 것(약속 52) — 여기엔 판매자 표시만.
 *  ② 배울 판매자(롤모델): 매출 상위 판매자의 주력(주제 분류·가격대·상태·출간 연도·SP·출판사·저자·등록 주기)을 집중 벤치마킹 회차 기록으로 셈
 *     → 우리와 견줘 '따라 하기' 제안(무엇을 더 매입·어떤 가격대·등록 방식). 제안만 — 값·상태를 바꾸지 않음(약속 36).
 *  ③ 숍 앞 페이지 연구: 알라딘 판매자 숍은 등록순이 기본 → 최근 등록이 앞 1~10쪽. 앞 쪽에 있는 동안 팔린 몫 ÷ 앞 쪽 노출 몫(배),
 *     판매자 사이: 하루 등록 수(앞 쪽이 바뀌는 빠르기)와 판매율·첫 7일 판매 몫의 순위 상관 · 판매자를 다시 뽑는 부트스트랩 95% 구간.
 *     '사라짐' = 팔림 + 판매자가 내림(정확한 팔림은 아님) · 앞 쪽 상품은 갓 올린 상품이라 '새 상품 효과'와 섞임 — 우리 숍은 등록 나이를 맞춰 따로 견줌.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';

  /* ── ① 판정 조건 ── v = 판정 종류: avoid 배척 · watch 주의 · learn 배움 · info 정보 */
  const VERDICT = { avoid: { t: '배척', c: '#B0322A' }, watch: { t: '주의', c: '#B26A00' }, learn: { t: '배움', c: '#1E7B4E' }, info: { t: '정보', c: '#4A5A55' } };
  const CONDS = [
    { k: 'fake', t: '허위 매물 판매자(판매자 표시)', v: 'avoid' },
    { k: 'ignore', t: '🚫 추격 무시 판매자(판매자 블랙리스트)', v: 'avoid' },
    { k: 'cancelHi', t: '품절 취소율 5% 넘음', v: 'avoid' },
    { k: 'rateLo', t: '평점 97% 아래(최근 6개월)', v: 'watch' },
    { k: 'lmatch', t: '우리고객 정보와 일치', v: 'watch' },
    { k: 'lsuspect', t: '우리고객과 일치 의심', v: 'watch' },
    { k: 'role', t: '🧑‍🏫 배울 판매자(롤모델)', v: 'learn' },
    { k: 'topSales', t: '매출 상위 20%', v: 'learn' },
    { k: 'goodShip', t: '품절 취소율 1% 아래 · 평점 99% 넘음', v: 'learn' },
    { k: 'a:전문셀러', t: '전문셀러', v: 'info' }, { k: 'a:파워셀러', t: '파워', v: 'info' }, { k: 'a:골드셀러', t: '골드', v: 'info' }, { k: 'a:실버셀러', t: '실버', v: 'info' }, { k: 'a:새내기셀러', t: '새내기', v: 'info' }
  ];
  const DEFAULT_ORDER = CONDS.map((c) => c.k); // 처음 순서 = 배척 → 주의 → 배움 → 정보(안전 쪽이 먼저)
  const condOf = (k) => CONDS.find((c) => c.k === k) || null;
  function normOrder(order) { const seen = new Set(); const out = []; for (const k of Array.isArray(order) ? order : []) if (condOf(k) && !seen.has(k)) { seen.add(k); out.push(k); } for (const k of DEFAULT_ORDER) if (!seen.has(k)) out.push(k); return out; }
  function moveKey(order, k, dir) { const o = normOrder(order); const i = o.indexOf(k); const j = i + (dir < 0 ? -1 : 1); if (i < 0 || j < 0 || j >= o.length) return o; [o[i], o[j]] = [o[j], o[i]]; return o; }
  function dragKey(order, k, toIdx) { const o = normOrder(order).filter((x) => x !== k); const t = Math.max(0, Math.min(o.length, +toIdx || 0)); o.splice(t, 0, k); return normOrder(o); }
  /* f = { fake, ignore, cancel(0~1|null), rating(0~1|null), lmatch, lsuspect, role, topSales, aGrade } — 판매자마다 미리 만든 사실 */
  function condHit(k, f) { if (!f) return false; switch (k) {
    case 'fake': return !!f.fake; case 'ignore': return !!f.ignore; case 'cancelHi': return f.cancel != null && f.cancel > 0.05; case 'rateLo': return f.rating != null && f.rating < 0.97;
    case 'lmatch': return !!f.lmatch; case 'lsuspect': return !!f.lsuspect && !f.lmatch; case 'role': return !!f.role; case 'topSales': return !!f.topSales;
    case 'goodShip': return f.cancel != null && f.cancel < 0.01 && f.rating != null && f.rating > 0.99;
    default: return k.startsWith('a:') ? f.aGrade === k.slice(2) : false; } }
  /* 판정: 켠 조건(active) 중 걸린 것 → 순서(order)에서 가장 앞의 것이 판정 · 걸린 것의 판정 종류가 둘 이상이면 conflict */
  function judge(f, active, order) { const o = normOrder(order); const on = new Set(Array.isArray(active) && active.length ? active : o); const hits = o.filter((k) => on.has(k) && condHit(k, f));
    if (!hits.length) return { hits, top: null, v: null, conflict: false, lost: [] }; const top = hits[0]; const v = condOf(top).v; const kinds = new Set(hits.map((k) => condOf(k).v));
    return { hits, top, v, conflict: kinds.size > 1, lost: hits.filter((k) => condOf(k).v !== v) }; }
  /* 여러 조건 동시: mode 'and'(모두 걸림) · 'or'(하나라도) · 조건을 하나도 안 켜면 모두 지나감 */
  function pass(f, active, mode) { const A = Array.isArray(active) ? active.filter(condOf) : []; if (!A.length) return true; return mode === 'and' ? A.every((k) => condHit(k, f)) : A.some((k) => condHit(k, f)); }

  /* ── 공용 작은 셈 ── */
  const num = (v) => (v == null || v === '' || !Number.isFinite(+v) ? null : +v);
  const med = (a) => { const s = a.filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const r3 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
  const r4 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10000) / 10000);
  function pearson(a, b) { const n = Math.min(a.length, b.length); if (n < 3) return null; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return va && vb ? c / Math.sqrt(va * vb) : null; }
  function ranks(a) { const o = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); for (let i = 0; i < o.length;) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; }
  const spearman = (a, b) => (a.length >= 3 ? pearson(ranks(a), ranks(b)) : null);
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; } // 같은 자료면 같은 구간(날마다 흔들리지 않게)
  /* 판매자를 다시 뽑는 부트스트랩 — stat(뽑힌 목록) → 숫자 · 95% 구간 */
  function boot(items, stat, B, seed) { const R = rng(seed || 7); const out = []; const n = items.length; if (n < 3) return null; for (let b = 0; b < (B || 400); b++) { const s = []; for (let i = 0; i < n; i++) s.push(items[Math.floor(R() * n)]); const v = stat(s); if (v != null && Number.isFinite(v)) out.push(v); } if (out.length < 20) return null; out.sort((x, y) => x - y); return [out[Math.floor(out.length * 0.025)], out[Math.min(out.length - 1, Math.floor(out.length * 0.975))]]; }
  const rowsOf = (L) => (Array.isArray(L) ? L : []).map((r) => { if (typeof r !== 'string') return r; try { return JSON.parse(r); } catch (e) { return null; } }).filter(Array.isArray);
  /* 주제 분류 = 알라딘 분류 길의 앞 두 칸(예 '국내도서>소설/시/희곡') — 벤치마킹 'a>b>c' 글자와 우리 책 categories[0].path 목록 둘 다 */
  function topicKey(c) { if (!c) return null; const p = Array.isArray(c) ? c.map(String) : String(c).split(/\s*[>›]\s*/); const q = p.filter(Boolean); if (!q.length) return null; return q.slice(0, 2).join('>'); }
  const BANDS = [3000, 6000, 10000, 20000, 40000]; const BAND_LAB = ['~3천', '3~6천', '6천~1만', '1~2만', '2~4만', '4만~'];
  const bandOf = (p) => { p = num(p); if (!p) return '?'; const i = BANDS.findIndex((x) => p < x); return BAND_LAB[i < 0 ? BANDS.length : i]; };
  const dayN = (d) => { const s = String(d || '').replace(/-/g, ''); if (!/^\d{8}$/.test(s)) return null; return Math.round(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) / 864e5); };
  /* 출간 몇 달 전 — ym 'YYYYMM' 또는 'YYYY-MM' */
  const pubAgeM = (ym, day) => { const a = String(ym || '').replace(/[^0-9]/g, ''); const b = String(day || '').replace(/[^0-9]/g, ''); if (a.length < 6 || b.length < 6) return null; const m = (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(4, 6) - +a.slice(4, 6)); return Number.isFinite(m) && m >= -2 ? Math.max(0, m) : null; };
  const share = (cnt, tot) => Object.entries(cnt).map(([k, n]) => ({ k, n, s: tot ? r4(n / tot) : null })).sort((a, b) => b.n - a.n);
  /* 제목 낱말(분류 정보가 없을 때 주력 가늠) — 두 글자 넘는 한글·영문 낱말 · 흔한 낱말·권수 뺌 */
  const STOP = new Set(['세트', '전권', '시리즈', '개정판', '개정', '증보판', '리커버', '에디션', '특별판', '한정판', '양장', '양장본', '반양장', '페이퍼백', 'paperback', 'hardcover', 'the', 'and', 'of', '이야기', '그리고', '위한', '있는', '모든', '우리', '나는', '나의', '나를', '내가', '어떻게', '읽는', '싶은', '않는', '하는', '없는', '되는', '같은', '대한', '함께', '전2권', '전3권', '전4권', '전5권', 'to', 'in', 'for', 'a']);
  const words = (t) => [...new Set(String(t || '').toLowerCase().replace(/[\(\[][^\)\]]*[\)\]]/g, ' ').split(/[^0-9a-z가-힣]+/).filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !/^\d+(권|부|편|판)$/.test(w) && !STOP.has(w)))];
  const inc = (m, k, n) => { if (k == null) return; m[k] = (m[k] || 0) + (n == null ? 1 : n); };

  /* 회차를 셈에 쓸지 — 첫 바퀴(base)·숍을 끝까지 못 읽은 회차·뺀 회차·기간 0은 뺌(클라우드 benchRunUse와 같은 뜻) */
  const runUse = (v) => !!v && !v.base && v.complete !== false && v.full !== false && +v.spanDays > 0 && v.excl !== true;

  /* (정범님 11/11 밤 · bavg1) ⏸ 빈 날 배분 · 사람 값 먼저 — 웹앱 판매자 상세의 🧩 빈 날 채우기(fill.days)·✎ 고치기(edit)가 있으면 그 값을 씀(원래 수집 값은 문서에 그대로)
   *  effRun: 셈에 쓸 회차 값(채운 회차 = 채운 날 값의 합 · 고친 회차 = 고친 값) + _per(날마다 새로 올림 — 채운 날 값 또는 benchFillPlan과 같은 규칙으로 고르게 나눔 · 나머지는 뒤쪽 날)
   *  나눌 날 수 = 그 회차가 담은 날(spanDays 반올림 · 1~60일) — 며칠 건너뛰고 읽은 회차의 몫이 '하루'로 몰려 세지지 않게 */
  const splitInt = (n, k) => { n = Math.max(0, Math.round(+n || 0)); const b = Math.floor(n / k), r = n - b * k; return Array.from({ length: k }, (_, i) => b + (i >= k - r ? 1 : 0)); };
  const SUMK = ['add', 'gone', 'sumGone', 'sumAdd'];
  function effRun(v) { if (!v) return v; const o = { ...v }; const F = v.fill && Array.isArray(v.fill.days) && v.fill.days.length >= 2 ? v.fill.days.filter((d) => d && d.day).slice().sort((a, b) => String(a.day).localeCompare(String(b.day))) : null;
    if (F) { SUMK.forEach((k) => { if (F.some((d) => num(d[k]) != null)) o[k] = F.reduce((t, d) => t + (num(d[k]) || 0), 0); }); o._human = 'fill'; }
    else if (v.edit && typeof v.edit === 'object') { SUMK.forEach((k) => { if (num(v.edit[k]) != null) { o[k] = num(v.edit[k]); o._human = 'edit'; } }); }
    const dd = F ? F.length : Math.max(1, Math.min(60, Math.round(+v.spanDays || 1))); o._per = F ? F.map((d) => num(d.add) || 0) : splitInt(num(o.add) ?? 0, dd); return o; }
  /* 날 수로 무게를 둔 가운데 값 — 4일치 회차는 4일로 셈(예전엔 회차 하나 = 한 표) */
  const wmed = (pairs) => { const a = pairs.filter(([x, w]) => x != null && Number.isFinite(x) && w > 0).sort((p, q) => p[0] - q[0]); const W = a.reduce((t, [, w]) => t + w, 0); if (!W) return null; let c = 0; for (const [x, w] of a) { c += w; if (c >= W / 2) return x; } return a[a.length - 1][0]; };
  /* 회차마다 쓸 사라짐 수 — ① 몰아서 내림(하루 사라짐이 그 판매자 가운데 값의 5배 넘고 100건 넘음)은 가운데 값 3배로 자름(내림을 팔림으로 세지 않게)
   *  ② 기간이 14일 넘는 회차는 14일 몫만(배지 연구 badgeStudy와 같음) → { s 쓴 날, g 사라짐, rev 판매가 합, k 목록 배율, cut 자른 회차 } */
  function goneAdj(R) { const rate = R.map((v) => (num(v.gone) ?? num(v.goneNew) ?? 0) / Math.max(0.5, +v.spanDays)); const m = wmed(R.map((v, i) => [rate[i], Math.max(0.5, +v.spanDays)])) || 0; /* (11/11) 날 수 무게 */
    return R.map((v, i) => { const sp = Math.max(0.5, +v.spanDays); const s = Math.min(sp, 14); let g = num(v.gone) ?? num(v.goneNew) ?? 0; let rev = num(v.sumGone) ?? num(v.sumGoneNew) ?? 0; let cut = false;
      if (m > 0 && rate[i] > 5 * m && g > 100) { const g2 = 3 * m * sp; rev = rev * (g2 / g); g = g2; cut = true; } const f = s / sp; return { s, g: g * f, rev: rev * f, raw: num(v.gone) ?? 0, gk: g / Math.max(1, num(v.gone) ?? g), cut }; }); }
  /* ── ② 판매자 주력(한 판매자 회차 목록 → 요약) ──
   *  runs = bench_days 문서들(그 판매자 · 아무 순서) — 쓰는 칸: day, spanDays, total, add, goneNew, sumGoneNew, addList, goneList, trunc
   *  look = { isbn → { sp, pub, au } } (있으면 SP·출판사·저자) */
  function profile(runs, look, opt) { const O = { minRuns: 2, ...(opt || {}) }; const R = (runs || []).filter(runUse).map(effRun).sort((a, b) => String(a.day).localeCompare(String(b.day)));
    if (R.length < O.minRuns) return null; let days = 0, sold = 0, rev = 0, add = 0, exT = 0; const addByDay = []; const lastDay = R[R.length - 1].day;
    const kw = {}; const cat = {}, catAdd = {}, band = {}, grade = {}, yr = { new12: 0, y3: 0, old: 0, unk: 0 }, life = [], price = [], sp = [], pub = {}, au = {}; let listN = 0, spKnown = 0, paKnown = 0, addListN = 0;
    const GA = goneAdj(R); let cutN = 0; R.forEach((v, i) => { const s = GA[i].s; days += s; sold += GA[i].g; rev += GA[i].rev; if (GA[i].cut) cutN++; /* 사라짐 전부(첫 바퀴부터 있던 것 포함) = 판매 가늠 */ const a = (num(v.add) ?? 0) * (s / Math.max(0.5, +v.spanDays)); add += a; exT += (num(v.total) || 0) * s; addByDay.push(...v._per); }); /* (11/11) ⏸ 날마다 — 며칠치 회차의 새로 올림을 빈 날까지 나눠(사람이 채운 날 값 먼저) · 예전엔 회차 하나 = 하루 */
    for (const v of R) {
      for (const r of rowsOf(v.goneList)) { const lf = num(r[4]); listN++; const p = num(r[2]); if (p) price.push(p); if (lf != null) life.push(lf); /* 걸린 날은 첫 바퀴 뒤 올린 것만 앎 */ words(r[1]).forEach((w) => inc(kw, w)); inc(cat, topicKey(r[8]) || '분류 모름'); inc(band, bandOf(p)); inc(grade, r[3] || '?'); const pa = pubAgeM(r[9], v.day); if (pa == null) yr.unk++; else if (pa <= 12) yr.new12++; else if (pa <= 36) yr.y3++; else yr.old++;
        const L = look && r[7] ? look[r[7]] : null; if (L) { if (L.sp != null) { sp.push(+L.sp); spKnown++; } if (L.pub || L.au) { paKnown++; inc(pub, L.pub || null); inc(au, L.au || null); } } }
      for (const r of rowsOf(v.addList)) { addListN++; inc(catAdd, topicKey(r[8]) || '분류 모름'); } }
    const regDays = addByDay.filter((x) => x > 0).length; const mA = addByDay.reduce((x, y) => x + y, 0) / (addByDay.length || 1); const sdA = Math.sqrt(addByDay.reduce((x, y) => x + (y - mA) ** 2, 0) / (addByDay.length || 1));
    const catS = share(cat, listN).slice(0, 8).map((x) => ({ ...x, addS: addListN ? r4((catAdd[x.k] || 0) / addListN) : null }));
    const top = (m, n) => share(m, Object.values(m).reduce((x, y) => x + y, 0)).slice(0, n);
    return { runs: R.length, days: r3(days), lastDay, cutRuns: cutN, sold: Math.round(sold), soldPerDay: r3(sold / days), revPerDay: Math.round(rev / days), addPerDay: r3(add / days), stock: num(R[R.length - 1].total), turn: exT ? r4(sold / exT) : null,
      regDaysShare: r3(regDays / (addByDay.length || 1)), regDays: addByDay.length, humanRuns: R.filter((v) => v._human).length, addCv: mA ? r3(sdA / mA) : null, listN, cats: catS, bands: share(band, listN), grades: share(grade, listN).slice(0, 6), years: { ...yr, new12S: listN ? r4(yr.new12 / listN) : null },
      lifeMed: med(life), lifeN: life.length, words: top(kw, 12).filter((x) => x.n >= 3), catKnownS: listN ? r3(1 - (cat['분류 모름'] || 0) / listN) : null, priceMed: med(price), spMed: med(sp), spKnownS: listN ? r3(spKnown / listN) : null, pubs: top(pub, 6), authors: top(au, 6), paKnownS: listN ? r3(paKnown / listN) : null }; }

  /* ── 롤모델 고르기 ── profiles = [{ sc, name, p: profile, f: 판정 사실 }] · opt.by: rev(하루 판매가 합)·sold(하루 판매 수)·turn(회전율)·rev6(6개월 평가 수)
   *  거름(블랙리스트 추적의 반대 조건): 허위·추격 무시는 늘 뺌 · 평점 ≥ minRating · 품절 취소율 ≤ maxCancel(모르면 통과 표시) · 숍 크기 ourStock 기준 sizeLo~sizeHi배(켰을 때) */
  const ROLE_DEF = { by: 'rev', minRating: 0.97, maxCancel: 0.05, size: false, sizeLo: 0.3, sizeHi: 3, top: 8, topPct: 0.2 };
  function roleRank(list, opt) { const O = { ...ROLE_DEF, ...(opt || {}) }; const val = (x) => (O.by === 'sold' ? x.p.soldPerDay : O.by === 'turn' ? x.p.turn : O.by === 'rev6' ? num(x.f && x.f.rev6) : x.p.revPerDay);
    const L = (list || []).filter((x) => x && x.p && val(x) != null); const sorted = L.slice().sort((a, b) => val(b) - val(a)); const cut = Math.max(1, Math.ceil(sorted.length * O.topPct));
    const topSet = new Set(sorted.slice(0, cut).map((x) => x.sc)); const out = [];
    for (const x of sorted) { const f = x.f || {}; const why = []; let ok = true;
      if (f.fake) { ok = false; why.push('허위 매물 판매자 표시'); } if (f.ignore) { ok = false; why.push('🚫 추격 무시 판매자'); }
      if (f.rating != null && f.rating < O.minRating) { ok = false; why.push(`평점 ${(f.rating * 100).toFixed(1)}% < ${(O.minRating * 100).toFixed(1)}%`); }
      if (f.cancel != null && f.cancel > O.maxCancel) { ok = false; why.push(`품절 취소율 ${(f.cancel * 100).toFixed(1)}% > ${(O.maxCancel * 100).toFixed(1)}%`); }
      if (O.size && O.ourStock > 0 && x.p.stock > 0) { const k = x.p.stock / O.ourStock; if (k < O.sizeLo || k > O.sizeHi) { ok = false; why.push(`숍 크기 우리의 ${k.toFixed(1)}배`); } }
      out.push({ sc: x.sc, name: x.name, v: val(x), top: topSet.has(x.sc), ok, why, unknown: [f.rating == null ? '평점' : null, f.cancel == null ? '취소율' : null].filter(Boolean) }); }
    const pick = out.filter((x) => x.ok).slice(0, O.top); return { by: O.by, n: L.length, topSet: [...topSet], pick, out }; }

  /* ── 따라 하기 제안 ── m = 롤모델 profile · ours = { cats:{주제:몫}, bands:{띠:몫}, new12S, addPerDay, priceMed, spMed, regDaysShare } (우리 판매중 상품 기준) */
  function followPlan(m, ours, opt) { const O = { gap: 0.03, ...(opt || {}) }; const tips = []; if (!m) return tips; const U = ours || {}; const pc = (x) => (x == null ? '?' : (x * 100).toFixed(1) + '%');
    for (const c of (m.cats || []).filter((c) => c.k !== '분류 모름')) { const u = U.cats ? U.cats[c.k] || 0 : null; if (u == null) continue; if (c.s - u >= O.gap) tips.push({ kind: 'buy', k: c.k, t: `📚 더 매입: ${c.k.split('>').pop()} — 롤모델 판매의 ${pc(c.s)} · 우리 판매중의 ${pc(u)}`, gap: r4(c.s - u) }); }
    const bm = (m.bands || []).filter((b) => b.k !== '?').sort((a, b) => b.s - a.s)[0]; if (bm && U.bands) { const u = U.bands[bm.k] || 0; if (bm.s - u >= O.gap) tips.push({ kind: 'price', k: bm.k, t: `💰 가격대: ${bm.k} 몫 늘리기 — 롤모델 판매의 ${pc(bm.s)} · 우리 판매중의 ${pc(u)}`, gap: r4(bm.s - u) }); }
    if (m.priceMed && U.priceMed) tips.push({ kind: 'price', k: 'med', t: `💰 팔린 값 가운데 ${Math.round(m.priceMed).toLocaleString()}원 · 우리 판매중 가운데 ${Math.round(U.priceMed).toLocaleString()}원`, gap: r4(m.priceMed / U.priceMed - 1) });
    if (m.years && m.years.new12S != null && U.new12S != null && m.years.new12S - U.new12S >= O.gap) tips.push({ kind: 'buy', k: 'new12', t: `🆕 출간 1년 안 책(화제 신간) 몫 — 롤모델 판매의 ${pc(m.years.new12S)} · 우리 판매중의 ${pc(U.new12S)}`, gap: r4(m.years.new12S - U.new12S) });
    if (m.spMed != null && U.spMed != null && m.spMed > U.spMed * 1.2) tips.push({ kind: 'buy', k: 'sp', t: `📈 SP(판매지수) 높은 책 — 롤모델 팔린 책 SP 가운데 ${Math.round(m.spMed).toLocaleString()} · 우리 판매중 ${Math.round(U.spMed).toLocaleString()}`, gap: r4(m.spMed / U.spMed - 1) });
    if (m.addPerDay != null) { const u = U.addPerDay; const t = `🗓 등록 방식: 롤모델 하루 ${m.addPerDay.toFixed(1)}권 · 등록한 날 몫 ${pc(m.regDaysShare)}${m.addCv != null ? ` · 들쭉날쭉 ${m.addCv.toFixed(2)}(0에 가까울수록 고름)` : ''}${u != null ? ` — 우리 하루 ${(+u).toFixed(1)}권` : ''}`; tips.push({ kind: 'reg', k: 'pace', t, gap: u != null && u > 0 ? r4(m.addPerDay / u - 1) : null }); }
    (m.pubs || []).slice(0, 3).forEach((p) => p.k && tips.push({ kind: 'buy', k: 'pub:' + p.k, t: `🏢 롤모델이 많이 판 출판사: ${p.k} (${pc(p.s)})`, gap: null }));
    return tips; }

  /* ── ③ 숍 앞 페이지 연구(한 판매자) ── 앞 쪽 = 최근 등록 fp개(기본 24개 × 10쪽)
   *  사라진 상품마다: 처음 본 날 뒤 사라질 때까지 새로 올라온 수(회차 add 합) < fp → 앞 쪽에 있던 동안 팔림
   *  노출: 회차마다 min(fp, 전체) × 기간 = 앞 쪽 상품-날 · 전체 × 기간 · 첫 7일 판매 몫 = 7일 안에 사라진 수 ÷ 새로 올린 수 · 머문 날 = fp ÷ 하루 등록 */
  const FRONT_DEF = { per: 24, pages: 10 };
  function frontOne(runs, opt) { const O = { ...FRONT_DEF, ...(opt || {}) }; const FP = O.per * O.pages; const R = (runs || []).filter(runUse).map(effRun).sort((a, b) => String(a.day).localeCompare(String(b.day))); if (R.length < 2) return null;
    const cum = []; let c = 0, sp0 = 0; for (const v of R) { c += num(v.add) || 0; sp0 += Math.min(+v.spanDays, 14); cum.push([dayN(v.day), c]); } const apd0 = sp0 ? c / sp0 : 0; /* 첫 회차 앞(기록 없는 날)은 하루 평균 등록으로 메움 */
    const cumAt = (d) => { if (d < cum[0][0]) return (d - cum[0][0]) * apd0; let x = 0; for (const [dd, cc] of cum) { if (dd <= d) x = cc; else break; } return x; };
    let fpDays = 0, allDays = 0, sold = 0, add = 0, days = 0, sFP = 0, sOff = 0, listN = 0, early7 = 0; const tr = { new12: [0, 0], old: [0, 0] }; const trBand = {};
    const GA = goneAdj(R); for (let ri = 0; ri < R.length; ri++) { const v = R[ri]; const s = GA[ri].s; const T = num(v.total) || 0; days += s; fpDays += Math.min(FP, T) * s; allDays += T * s; const g = GA[ri].g; sold += g; add += (num(v.add) || 0) * (s / Math.max(0.5, +v.spanDays));
      const G = rowsOf(v.goneList); const k = G.length ? (GA[ri].raw > G.length ? GA[ri].raw / G.length : 1) * GA[ri].gk * (s / Math.max(0.5, +v.spanDays)) : 1; // 목록이 3,000개로 잘렸으면 비율로 늘림 · 몰아서 내림·긴 회차 몫은 위와 같게 줄임
      /* 첫 바퀴부터 있던 것(걸린 날 null)은 앞 쪽 밖으로 셈 — 오래된 상품이라 그 앞에 최근 등록 fp개가 있을 가능성이 큼(앞 쪽 몫을 적게 잡는 쪽 · 보수적) */
      for (const r of G) { listN++; const lf = num(r[4]); if (lf == null) { sOff += k; continue; } const f0 = dayN(r[5]); const d1 = f0 != null ? f0 + lf : dayN(v.day); const after = f0 != null ? cumAt(d1) - cumAt(f0) : null; const onFP = after != null && after < FP; if (onFP) sFP += k; else sOff += k; if (lf <= 7) early7 += k;
        const pa = pubAgeM(r[9], v.day); const tk = pa != null && pa <= 12 ? 'new12' : 'old'; tr[tk][onFP ? 0 : 1] += k; const b = bandOf(r[2]); trBand[b] = trBand[b] || [0, 0]; trBand[b][onFP ? 0 : 1] += k; } }
    const offDays = allDays - fpDays; const rateFP = fpDays ? sFP / fpDays : null, rateOff = offDays > 0 ? sOff / offDays : null; const apd = days ? add / days : null;
    return { runs: R.length, days: r3(days), spanMed: r3(med(R.map((v) => +v.spanDays))), fp: FP, stock: num(R[R.length - 1].total), addPerDay: r3(apd), dwell: apd ? r3(FP / apd) : null, sold: Math.round(sold), listN,
      soldFP: Math.round(sFP), soldOff: Math.round(sOff), expFPs: allDays ? r4(fpDays / allDays) : null, soldFPs: sFP + sOff ? r4(sFP / (sFP + sOff)) : null,
      rateFP: r4(rateFP), rateOff: r4(rateOff), lift: rateFP != null && rateOff > 0 ? r3(rateFP / rateOff) : null, sellRate: allDays ? r4(sold / allDays) : null, early7S: add ? r4(early7 / add) : null,
      traits: { new12: tr.new12.map(Math.round), old: tr.old.map(Math.round), band: Object.fromEntries(Object.entries(trBand).map(([b, a]) => [b, a.map(Math.round)])) } }; }
  /* 판매자 사이 묶음 — rows = frontOne 결과(+sc) · 신뢰도: 판매자 수와 95% 구간이 1(배)·0(상관)을 넘는지 */
  /* 묶음엔 '거의 날마다 읽은' 판매자만(회차 사이 가운데 2.5일 이하 · 회차 4번 넘음) — 몇 주에 한 번 읽으면 그사이 올렸다 팔린 상품을 아예 못 봐 앞 쪽 판매가 0으로 보임 */
  function frontPool(rows, seed) { const all = (rows || []).filter((r) => r && r.lift != null && r.stock >= 50 && r.fp < r.stock); const L = all.filter((r) => r.spanMed == null || (r.spanMed <= 2.5 && r.runs >= 4)); const sparse = all.length - L.length; const n = L.length;
    const pooled = (S) => { let a = 0, b = 0, c = 0, d = 0; for (const r of S) { a += r.soldFP; b += r.expFPs * r.stock * r.days; c += r.soldOff; d += (1 - r.expFPs) * r.stock * r.days; } return b > 0 && d > 0 && c > 0 ? (a / b) / (c / d) : null; };
    const lifts = L.map((r) => r.lift); const A = L.filter((r) => r.addPerDay != null && r.sellRate != null); const B = L.filter((r) => r.dwell != null && r.early7S != null);
    const sp1 = spearman(A.map((r) => r.addPerDay), A.map((r) => r.sellRate)); const sp2 = spearman(B.map((r) => Math.min(r.dwell, 365)), B.map((r) => r.early7S));
    const ci = boot(L, pooled, 400, seed || 11); const ciS1 = boot(A, (S) => spearman(S.map((r) => r.addPerDay), S.map((r) => r.sellRate)), 300, (seed || 11) + 1);
    const P = pooled(L); const ciM = boot(L, (S) => med(S.map((r) => r.lift)), 400, (seed || 11) + 2); const sideP = ci && (ci[0] > 1 || ci[1] < 1), sideM = ciM && (ciM[0] > 1 || ciM[1] < 1);
    /* 신뢰도: 판매자 15곳 넘고 묶음 배·가운데 배의 구간이 모두 1을 넘음 → 높음 · 8곳 넘고 둘 중 하나 → 보통 · 아니면 낮음 (앞 쪽 = 갓 올린 상품이라 '새 상품 효과'가 섞인 것은 늘 따로 적음) */
    const conf = n >= 15 && sideP && sideM ? '높음' : n >= 8 && (sideP || sideM) ? '보통' : '낮음';
    return { n, sparse, pooledLift: r3(P), ci: ci ? ci.map(r3) : null, liftMed: r3(med(lifts)), liftMedCi: ciM ? ciM.map(r3) : null, liftUp: lifts.filter((x) => x > 1).length, spAddSell: r3(sp1), spAddSellCi: ciS1 ? ciS1.map(r3) : null, nA: A.length, spDwellEarly: r3(sp2), nB: B.length, conf,
      soldFP: L.reduce((x, r) => x + r.soldFP, 0), soldAll: L.reduce((x, r) => x + r.soldFP + r.soldOff, 0) }; }
  /* 우리 숍(등록 나이 맞춤) — rows = 하루 모습 줄 [{ age(등록 뒤 날), y(7일 안 팔림 0/1) }] 여러 날 묶음 · 날마다 나이 순으로 줄 세워 앞 fp개 = 앞 쪽
   *  나이 띠(0~3·4~7·8~14·15~30·31~90일)마다 앞 쪽 vs 뒤 쪽 7일 판매율 — 같은 나이에서 둘 다 있을 때만 견줌(가중 평균 배) */
  const AGE_BINS = [[0, 3], [4, 7], [8, 14], [15, 30], [31, 90]];
  function ourFront(days, opt) { const O = { ...FRONT_DEF, ...(opt || {}) }; const FP = O.per * O.pages; const cell = AGE_BINS.map(() => ({ fp: [0, 0], off: [0, 0] })); let n = 0, fpN = 0, fpY = 0, allY = 0;
    for (const D of days || []) { const rows = (D || []).filter((r) => r && r.age != null && r.age >= 0 && r.y != null).sort((a, b) => a.age - b.age); rows.forEach((r, i) => { n++; allY += r.y; const on = i < FP; if (on) { fpN++; fpY += r.y; } const bi = AGE_BINS.findIndex(([a, b]) => r.age >= a && r.age <= b); if (bi < 0) return; const c = cell[bi][on ? 'fp' : 'off']; c[0] += r.y; c[1]++; }); }
    let wn = 0, ws = 0; const bins = cell.map((c, i) => { const a = c.fp[1] ? c.fp[0] / c.fp[1] : null, b = c.off[1] ? c.off[0] / c.off[1] : null; const lift = a != null && b > 0 && c.fp[1] >= 20 && c.off[1] >= 20 ? a / b : null; if (lift != null) { const w = Math.min(c.fp[1], c.off[1]); wn += w; ws += w * lift; } return { age: AGE_BINS[i].join('~') + '일', fpN: c.fp[1], fpRate: r4(a), offN: c.off[1], offRate: r4(b), lift: r3(lift) }; });
    return { rows: n, fpRows: fpN, fpRate: fpN ? r4(fpY / fpN) : null, allRate: n ? r4(allY / n) : null, ageLift: wn ? r3(ws / wn) : null, matched: wn, bins }; }

  const api = { VERSION, VERDICT, CONDS, DEFAULT_ORDER, condOf, normOrder, moveKey, dragKey, condHit, judge, pass, topicKey, bandOf, pubAgeM, runUse, profile, ROLE_DEF, roleRank, followPlan, FRONT_DEF, frontOne, frontPool, ourFront, spearman, pearson, boot, med, rowsOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowSellerLearn = api;
})(typeof window !== 'undefined' ? window : this);
