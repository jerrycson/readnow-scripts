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
  const VERSION = '0.2.0';

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

  /* (11/11 밤 sell2 · 정범님 지시) 몰아서 읽은 회차는 잘라 세지 않고 빈 날에 고르게 나눔 — 웹앱 benchFillPlan·benchOverlay와 같은 규칙
   *  앞 온전한 회차 다음 날 ~ 이 회차까지 하루씩 · 사람이 채운 값(x.fill.days)·고친 값(x.edit)이 먼저 · 못 쓰는 회차(runUse 아님)는 뺌 · 60일 넘게 떨어지면 나누지 않음
   *  (일꾼 bavg1이 웹앱·공용 배분 함수를 만드는 중 — 합칠 때 그 이름으로 바꿈 · 여기 이름은 benchSpread) */
  const splitInt = (n, k) => { n = Math.max(0, Math.round(+n || 0)); const b = Math.floor(n / k), r = n - b * k; return Array.from({ length: k }, (_, i) => b + (i >= k - r ? 1 : 0)); };
  const nz0 = (v) => (v == null || v === '' || !Number.isFinite(+v) ? null : Math.max(0, Math.round(+v)));
  function benchFix(x) { if (!x || !x.edit || typeof x.edit !== 'object') return x; const o = { ...x, edited: 1 }; ['add', 'gone', 'sumGone', 'sumAdd'].forEach((k) => { if (x.edit[k] != null) o[k] = nz0(x.edit[k]); }); if (x.edit.gone != null) o.goneNew = o.gone; if (x.edit.sumGone != null) o.sumGoneNew = o.sumGone; return o; }
  const addDay = (d, k) => new Date((dayN(d) + k) * 864e5).toISOString().slice(0, 10);
  function benchSpread(runs) { const R = (runs || []).filter(runUse).sort((a, b) => String(a.day).localeCompare(String(b.day))); const out = []; let prev = null;
    for (const x0 of R) { const x = benchFix(x0); const dd = prev ? dayN(x.day) - dayN(prev.day) : 0; const F = x.fill && Array.isArray(x.fill.days) && x.fill.days.length >= 2 ? x.fill.days.filter((d) => d && d.day).slice().sort((a, b) => String(a.day).localeCompare(String(b.day))) : null;
      const piece = (day, a, g, sg, last) => ({ ...(last ? x : { sc: x.sc, total: x.total, complete: true, full: true, goneList: [], addList: [], _vf: 1, fillOf: x.day }), day, spanDays: 1, add: a, gone: g, goneNew: g, sumGone: sg, sumGoneNew: sg });
      if (F) { F.forEach((d, i) => out.push(piece(d.day, nz0(d.add) || 0, nz0(d.gone) || 0, nz0(d.sumGone), i === F.length - 1))); }
      else if (dd >= 2 && dd <= 60) { const g0 = num(x.gone) ?? num(x.goneNew) ?? 0, s0 = num(x.sumGone) ?? num(x.sumGoneNew); const A = splitInt(x.add, dd), G = splitInt(g0, dd), SG = s0 != null ? splitInt(s0, dd) : null; for (let i = 0; i < dd; i++) out.push(piece(addDay(prev.day, i + 1), A[i], G[i], SG ? SG[i] : null, i === dd - 1)); }
      else out.push(x);
      prev = x; }
    return out; }
  /* 회차마다 쓸 사라짐 수 — ① 몰아서 내림(하루 사라짐이 그 판매자 가운데 값의 5배 넘고 100건 넘음)은 가운데 값 3배로 자름(내림을 팔림으로 세지 않게)
   *  ② 기간이 14일 넘는 회차는 14일 몫만(배지 연구 badgeStudy와 같음) → { s 쓴 날, g 사라짐, rev 판매가 합, k 목록 배율, cut 자른 회차 } */
  function goneAdj(R) { const rate = R.map((v) => (num(v.gone) ?? num(v.goneNew) ?? 0) / Math.max(0.5, +v.spanDays)); const m = med(rate) || 0;
    return R.map((v, i) => { const sp = Math.max(0.5, +v.spanDays); const s = sp; /* (sell2) 14일 자르기 없앰 — 긴 회차는 benchSpread로 나눔 */ let g = num(v.gone) ?? num(v.goneNew) ?? 0; let rev = num(v.sumGone) ?? num(v.sumGoneNew) ?? 0; let cut = false;
      if (m > 0 && rate[i] > 5 * m && g > 100) { const g2 = 3 * m * sp; rev = rev * (g2 / g); g = g2; cut = true; } const f = s / sp; return { s, g: g * f, rev: rev * f, raw: num(v.gone) ?? 0, gk: g / Math.max(1, num(v.gone) ?? g), cut }; }); }
  /* ── ② 판매자 주력(한 판매자 회차 목록 → 요약) ──
   *  runs = bench_days 문서들(그 판매자 · 아무 순서) — 쓰는 칸: day, spanDays, total, add, goneNew, sumGoneNew, addList, goneList, trunc
   *  look = { isbn → { sp, pub, au } } (있으면 SP·출판사·저자) */
  function profile(runs, look, opt) { const O = { minRuns: 2, ...(opt || {}) }; const R0 = (runs || []).filter(runUse); if (R0.length < O.minRuns) return null; const R = benchSpread(R0); /* (sell2) 빈 날에 고르게 나눈 회차 */
    if (R.length < O.minRuns) return null; let days = 0, sold = 0, rev = 0, add = 0, exT = 0; const addByDay = []; const lastDay = R[R.length - 1].day;
    const kw = {}; const cat = {}, catAdd = {}, band = {}, grade = {}, yr = { new12: 0, y3: 0, old: 0, unk: 0 }, life = [], price = [], sp = [], pub = {}, au = {}; let listN = 0, spKnown = 0, paKnown = 0, addListN = 0;
    const GA = goneAdj(R); let cutN = 0; R.forEach((v, i) => { const s = GA[i].s; days += s; sold += GA[i].g; rev += GA[i].rev; if (GA[i].cut) cutN++; /* 사라짐 전부(첫 바퀴부터 있던 것 포함) = 판매 가늠 */ const a = (num(v.add) ?? 0) * (s / Math.max(0.5, +v.spanDays)); add += a; exT += (num(v.total) || 0) * s; addByDay.push((num(v.add) ?? 0) / Math.max(1, +v.spanDays)); });
    for (const v of R) {
      for (const r of rowsOf(v.goneList)) { const lf = num(r[4]); listN++; const p = num(r[2]); if (p) price.push(p); if (lf != null) life.push(lf); /* 걸린 날은 첫 바퀴 뒤 올린 것만 앎 */ words(r[1]).forEach((w) => inc(kw, w)); inc(cat, topicKey(r[8]) || '분류 모름'); inc(band, bandOf(p)); inc(grade, r[3] || '?'); const pa = pubAgeM(r[9], v.day); if (pa == null) yr.unk++; else if (pa <= 12) yr.new12++; else if (pa <= 36) yr.y3++; else yr.old++;
        const L = look && r[7] ? look[r[7]] : null; if (L) { if (L.sp != null) { sp.push(+L.sp); spKnown++; } if (L.pub || L.au) { paKnown++; inc(pub, L.pub || null); inc(au, L.au || null); } } }
      for (const r of rowsOf(v.addList)) { addListN++; inc(catAdd, topicKey(r[8]) || '분류 모름'); } }
    const regDays = addByDay.filter((x) => x > 0).length; const mA = addByDay.reduce((x, y) => x + y, 0) / (addByDay.length || 1); const sdA = Math.sqrt(addByDay.reduce((x, y) => x + (y - mA) ** 2, 0) / (addByDay.length || 1));
    const catS = share(cat, listN).slice(0, 8).map((x) => ({ ...x, addS: addListN ? r4((catAdd[x.k] || 0) / addListN) : null }));
    const top = (m, n) => share(m, Object.values(m).reduce((x, y) => x + y, 0)).slice(0, n);
    return { runs: R0.length, spread: R.length - R0.length, days: r3(days), lastDay, cutRuns: cutN, sold: Math.round(sold), soldPerDay: r3(sold / days), revPerDay: Math.round(rev / days), addPerDay: r3(add / days), stock: num(R[R.length - 1].total), turn: exT ? r4(sold / exT) : null,
      regDaysShare: r3(regDays / R.length), addCv: mA ? r3(sdA / mA) : null, listN, cats: catS, bands: share(band, listN), grades: share(grade, listN).slice(0, 6), years: { ...yr, new12S: listN ? r4(yr.new12 / listN) : null },
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
    if (m.addPerDay != null) { const u = U.addPerDay; const t = `🗓 등록 방식: 롤모델 하루 ${m.addPerDay.toFixed(1)}권 · 등록한 회차 몫 ${pc(m.regDaysShare)}${m.addCv != null ? ` · 들쭉날쭉 ${m.addCv.toFixed(2)}(0에 가까울수록 고름)` : ''}${u != null ? ` — 우리 하루 ${(+u).toFixed(1)}권` : ''}`; tips.push({ kind: 'reg', k: 'pace', t, gap: u != null && u > 0 ? r4(m.addPerDay / u - 1) : null }); }
    (m.pubs || []).slice(0, 3).forEach((p) => p.k && tips.push({ kind: 'buy', k: 'pub:' + p.k, t: `🏢 롤모델이 많이 판 출판사: ${p.k} (${pc(p.s)})`, gap: null }));
    return tips; }

  /* ── ③ 숍 앞 페이지 연구(한 판매자) ── 앞 쪽 = 최근 등록 fp개(기본 24개 × 10쪽)
   *  사라진 상품마다: 처음 본 날 뒤 사라질 때까지 새로 올라온 수(회차 add 합) < fp → 앞 쪽에 있던 동안 팔림
   *  노출: 회차마다 min(fp, 전체) × 기간 = 앞 쪽 상품-날 · 전체 × 기간 · 첫 7일 판매 몫 = 7일 안에 사라진 수 ÷ 새로 올린 수 · 머문 날 = fp ÷ 하루 등록 */
  const FRONT_DEF = { per: 24, pages: 10 };
  function frontOne(runs, opt) { const O = { ...FRONT_DEF, ...(opt || {}) }; const FP = O.per * O.pages; const R = (runs || []).filter(runUse).map(benchFix).sort((a, b) => String(a.day).localeCompare(String(b.day))); if (R.length < 2) return null;
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

  /* ══════════ 0.2.0 (11/11 밤 · 일꾼 sell2 · 정범님 뜻 바로잡음) ══════════
   *  ④ 숍 앞 페이지 '구성' → 그 숍 '전체' 판매: 앞 페이지(최근 등록 240개)에 어떤 종류의 상품이 놓였느냐(주제·가격·상태·최저가 배지·세트·신선도·
   *     희귀성(다른 판매자에 없는 제목)·제목 낱말·출간 연도·표지 수치)가 같은 숍의 다음 며칠 전체 사라짐·매출과 어떤 관계인지 — 숍 고정효과(숍 안에서 견줌) ·
   *     시차 1·2·3회차 · 지금 판매·등록·재고는 빼고(통제) · 숍 안 시간 돌려 섞기(순환 이동) 순열 시험 · 다중 비교 보정(BH) · 앞뒤 절반 재현
   *  ⑤ 가설 원장(스스로 진화): 날마다 검증 → 점수(베타) → 지지·후보·기각 · 잘 버틴 가설끼리 엮은 새 가설(곱)을 다음 날 시험
   *  ⑥ 구매자 분포·함께 산 책: 알라딘 새상품 화면의 연령·성별 분포와 함께 산 책 연결망 → 판매 속도·값·매입값·앞 페이지 구성
   *  ⑦ 판정 조건·롤모델 기준 스스로 진화: 결과(나중에 실제로 나빴나·따라 했더니 어땠나)로 무게·순서 '제안'만(바꾸기는 웹앱에서 두 번 눌러 확정) */
  const sd = (a) => { const s = a.filter(Number.isFinite); if (s.length < 2) return null; const m = s.reduce((x, y) => x + y, 0) / s.length; return Math.sqrt(s.reduce((x, y) => x + (y - m) ** 2, 0) / (s.length - 1)); };
  const mean = (a) => { const s = a.filter(Number.isFinite); return s.length ? s.reduce((x, y) => x + y, 0) / s.length : null; };
  function hashT(t) { const s = String(t || '').toLowerCase().replace(/[\(\[][^\)\]]*[\)\]]/g, '').replace(/[^0-9a-z가-힣]+/g, ''); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return s ? h | 0 : 0; }
  /* 제목 낱말로 가늠하는 종류(분류 정보가 비어 있어서) — 기계로 셀 수 있는 것부터 */
  const KIND = { comic: ['만화', '코믹', '웹툰', '라노벨', '라이트노벨', '애니'], kid: ['초등', '어린이', '유아', '그림책', '동화', '아동', '유치원', '키즈', 'why', '전집', '학습만화'], study: ['수능', '문제집', '기출', '토익', '자격증', '수험', '공무원', '교재', '모의고사', '개념', '유형', '내신'],
    lit: ['소설', '시집', '장편', '단편', '에세이', '산문', '문학'], hum: ['철학', '역사', '사상', '인문', '고전', '종교', '신학'], biz: ['경제', '경영', '투자', '주식', '마케팅', '부동산', '자기계발', '리더십'], art: ['사진', '미술', '디자인', '건축', '음악', '도록', '화집'] };
  const KIND_T = { comic: '만화', kid: '어린이·학습', study: '수험·교재', lit: '문학', hum: '인문·역사', biz: '경제·자기계발', art: '예술' };
  const FEAT_T = { pMed: '가격 가운데(로그)', pCv: '가격 들쭉날쭉', sCheap: '3천원 아래 몫', sMid: '6천~2만 몫', sHigh: '2만원 넘는 몫', sLux: '4만원 넘는 몫', gTop: '상태 최상 몫', gLow: '상태 중·하 몫', low: '최저가 배지 몫', set: '세트·전권 몫', ageMed: '앞 쪽 상품 나이(일)',
    engT: '영문 제목 몫', dup: '같은 제목 겹침 몫', tLen: '제목 길이', wDiv: '제목 낱말 다양성', rare: '다른 판매자에 없는 제목 몫(희귀)', newPub: '출간 1년 안 몫(화제 신간)', oldPub: '출간 10년 넘은 몫', disc: '정가 대비 값', covB: '표지 밝기', covS: '표지 채도', covC: '표지 색 다양성', spMed: 'SP 가운데(로그)', spHi: 'SP 1천 넘는 몫',
    aFem: '앞 쪽 구매자 여성 몫', aAge: '앞 쪽 구매자 나이 평균', aFit: '앞 쪽과 우리 고객층 닮음', aYoung: '앞 쪽 구매자 10·20대 몫', aOld: '앞 쪽 구매자 50·60대 몫' };
  Object.keys(KIND).forEach((k) => (FEAT_T['k_' + k] = KIND_T[k] + ' 몫'));
  const featT = (k) => { if (FEAT_T[k]) return FEAT_T[k]; if (k.includes('*')) return k.split('*').map(featT).join(' × '); if (k.startsWith('w:')) return `제목 '${k.slice(2)}' 몫`; if (k.startsWith('c:')) return `분야 '${k.slice(2).split('>').pop()}' 몫`; if (k === 'catDiv') return '분야 다양성'; if (k.includes('*')) return k.split('*').map(featT).join(' × '); return k; };
  const YT = { g1: '다음 회차 사라짐/일', g2: '2회차 뒤 사라짐/일', g3: '다음 3일 사라짐/일', r1: '다음 회차 매출/일', r3: '다음 3일 매출/일' };

  /* 한 숍의 상품 줄(지금 목록 + 회차마다 사라진 것) → 상품 번호 큰 것(나중 등록)부터 · 그날 살아 있던 것 중 앞 FP개 = 그날 앞 페이지
   *  cur = bench_state 목록 { 상품번호: [값, 처음 본 날, 상태, 수량, 제목, 최저가, …, ISBN, 분류, 출간 연월] } · runs = bench_days */
  function shopItems(cur, runs) { const M = new Map();
    for (const [id, a] of Object.entries(cur || {})) { if (!Array.isArray(a)) continue; M.set(id, { id, p: num(a[0]), first: dayN(a[1]), g: a[2] || null, t: String(a[4] || ''), low: a[5] ? 1 : 0, isbn: a[7] || null, cat: a[8] || null, ym: a[9] || null, cov: a[11] && typeof a[11] === 'object' ? a[11] : null, sp: a[11] && typeof a[11] === 'object' ? num(a[11].sp) : null, gone: Infinity }); }
    for (const v of runs || []) { const d = dayN(v.day); if (d == null) continue;
      for (const r of rowsOf(v.goneList)) { const id = String(r[0]); const o = M.get(id); if (o && o.gone === Infinity) continue; if (o) { o.gone = Math.min(o.gone, d); continue; } M.set(id, { id, p: num(r[2]), first: dayN(r[5]), g: r[3] || null, t: String(r[1] || ''), low: r[6] ? 1 : 0, isbn: r[7] || null, cat: r[8] || null, ym: r[9] || null, gone: d }); }
      for (const r of rowsOf(v.addList)) { const o = M.get(String(r[0])); if (!o) continue; if (o.pl == null && num(r[6])) o.pl = num(r[6]); if (!o.ym && r[4]) o.ym = r[4]; if (!o.isbn && r[5]) o.isbn = r[5]; if (!o.cat && r[8]) o.cat = r[8]; } }
    const L = [...M.values()]; L.forEach((x) => (x.h = hashT(x.t))); return L.sort((a, b) => (+b.id || 0) - (+a.id || 0)); }
  function frontAt(L, d, FP) { const out = []; for (const it of L) { if ((it.first == null || it.first <= d) && it.gone > d) { out.push(it); if (out.length >= FP) break; } } return out; }
  /* 앞 페이지 구성 특징 — ctx = { rare(h) → 다른 판매자 수 · kw: [낱말] · look: isbn → { sp, bd } · U: 우리 고객층 12칸 } */
  function frontFeat(F, d, ctx) { const n = F.length; if (n < 24) return null; const C = ctx || {}; const sh = (fn) => r4(F.filter(fn).length / n); const P = F.map((x) => x.p).filter((p) => p > 0); const shP = (fn) => (P.length ? r4(P.filter(fn).length / P.length) : null);
    const T = F.map((x) => String(x.t || '').toLowerCase()); const W = T.map(words); const allW = W.flat(); const f = {
      pMed: P.length ? r4(Math.log(med(P))) : null, pCv: P.length > 2 ? r3(sd(P) / mean(P)) : null, sCheap: shP((p) => p < 3000), sMid: shP((p) => p >= 6000 && p < 20000), sHigh: shP((p) => p >= 20000), sLux: shP((p) => p >= 40000),
      gTop: sh((x) => x.g === '최상'), gLow: sh((x) => /^(중|하)/.test(x.g || '')), low: sh((x) => x.low), set: r4(T.filter((t) => /세트|전\s?\d+\s?권|\d+\s?~\s?\d+/.test(t)).length / n), ageMed: med(F.map((x) => (x.first != null ? d - x.first : null))),
      engT: r4(T.filter((t) => t.trim() && /^[\x00-\x7f]+$/.test(t.trim())).length / n), dup: r4(1 - new Set(F.map((x) => x.h)).size / n), tLen: med(T.map((t) => t.length)), wDiv: allW.length ? r4(new Set(allW).size / allW.length) : null };
    for (const [k, L] of Object.entries(KIND)) f['k_' + k] = r4(T.filter((t) => L.some((w) => t.includes(w))).length / n);
    if (C.rare) f.rare = sh((x) => x.h && C.rare(x.h) === 0);
    const ys = F.map((x) => pubAgeM(x.ym, String(d != null ? new Date(d * 864e5).toISOString().slice(0, 7) : ''))).filter((x) => x != null); if (ys.length >= n * 0.3) { f.newPub = r4(ys.filter((m) => m <= 12).length / ys.length); f.oldPub = r4(ys.filter((m) => m > 120).length / ys.length); }
    const ds = F.filter((x) => x.p > 0 && x.pl > 0).map((x) => x.p / x.pl); if (ds.length >= n * 0.3) f.disc = r3(med(ds));
    const cv = F.map((x) => x.cov).filter(Boolean); if (cv.length >= n * 0.3) { f.covB = r3(med(cv.map((c) => num(c.b)))); f.covS = r3(med(cv.map((c) => num(c.s)))); f.covC = r3(med(cv.map((c) => num(c.c)))); } /* 표지 수치 칸(밝기 b·채도 s·색 다양성 c 0~1) — 모으는 곳이 생기면 저절로 들어옴 */
    /* (sell2) 분야·SP 자리 — 일꾼 adapt1이 검색 결과 목록으로 판매자 상품의 분류·SP·출판사를 메우면(줄의 cat·sp 칸 또는 look[isbn]) '제목 낱말' 대신 실제 분야·SP로 */
    const cats = F.map((x) => topicKey(x.cat)).filter(Boolean); if (cats.length >= n * 0.3) { const cc = {}; cats.forEach((k) => (cc[k] = (cc[k] || 0) + 1)); Object.entries(cc).filter(([, m]) => m >= 3).forEach(([k, m]) => (f['c:' + k] = r4(m / cats.length))); f.catDiv = r4(Object.keys(cc).length / cats.length); }
    const spRow = F.map((x) => num(x.sp)).filter((v) => v != null); if (spRow.length >= n * 0.3) { f.spMed = r4(Math.log1p(med(spRow))); f.spHi = r4(spRow.filter((v) => v > 1000).length / spRow.length); }
    if (C.look) { const sp = [], A = []; for (const x of F) { const L = (x.isbn && C.look[x.isbn]) || (x.bid && C.look[x.bid]) || null; if (!L) continue; if (L.sp != null) sp.push(+L.sp); if (L.bd) { const a = audFeat(L.bd); if (a) A.push(a); } }
      if (sp.length >= n * 0.3 && f.spMed == null) { f.spMed = r4(Math.log1p(med(sp))); f.spHi = r4(sp.filter((s) => s > 1000).length / sp.length); }
      if (A.length >= n * 0.3) { f.aFem = r4(mean(A.map((a) => a.fem))); f.aAge = r3(mean(A.map((a) => a.age))); f.aYoung = r4(mean(A.map((a) => a.young))); f.aOld = r4(mean(A.map((a) => a.old))); if (C.U) f.aFit = r4(mean(A.map((a) => cosv(a.v, C.U)))); } }
    for (const w of C.kw || []) f['w:' + w] = r4(T.filter((t) => t.includes(w)).length / n);
    return f; }
  /* 숍 하나의 날짜 줄(패널) — 회차마다 그날 앞 페이지 구성 · 그 회차·다음 회차들의 사라짐·매출(몰아서 내림은 자름) */
  function shopFronts(runs, L, FP) { const R = benchSpread(runs); /* 나눈 날마다 = 하루 줄 · 사람이 고친 값 먼저 */ if (R.filter((v) => !v._vf).length < 5) return null; R.sort((a, b) => String(a.day).localeCompare(String(b.day))); if (R.length < 5) return null; const GA = goneAdj(R); const fp = FP || 240;
    const rate = R.map((v, i) => ({ d: dayN(v.day), s: GA[i].s, g: GA[i].g / GA[i].s, r: GA[i].rev / GA[i].s, a: (num(v.add) || 0) / Math.max(0.5, +v.spanDays), T: num(v.total) || 0 }));
    const slim = (x) => ({ sp: x.sp, p: x.p, g: x.g, t: x.t, low: x.low, first: x.first, ym: x.ym, isbn: x.isbn, cat: x.cat, pl: x.pl, cov: x.cov, h: x.h, bid: x.bid });
    return { rate, fronts: rate.map((q) => frontAt(L, q.d, fp).map(slim)) }; }
  function panelFrom(g, pre, ctx) { if (!pre) return []; const { rate, fronts } = pre; const R = rate;
    const win = (i, days) => { let s = 0, gg = 0, r = 0, a = 0; for (let j = i + 1; j < R.length && R[j].d - R[i].d <= days + 0.5; j++) { s += R[j].s; gg += R[j].g * R[j].s; r += R[j].r * R[j].s; a += R[j].a * R[j].s; } return s > 0 ? { g: gg / s, r: r / s, a: a / s } : null; };
    const out = []; for (let i = 0; i < R.length - 1; i++) { const d = R[i].d; const x = frontFeat(fronts[i], d, ctx); if (!x) continue; const n1 = R[i + 1], n2 = R[i + 2] || null, w3 = win(i, 3);
      out.push({ g, t: i, d, x, y: { g1: Math.log1p(n1.g), g2: n2 ? Math.log1p(n2.g) : null, g3: w3 ? Math.log1p(w3.g) : null, r1: Math.log1p(n1.r), r3: w3 ? Math.log1p(w3.r) : null }, c: [Math.log1p(R[i].g), Math.log1p(n1.a), Math.log1p(R[i].T)] }); }
    return out; }
  const shopPanel = (g, runs, L, ctx, FP) => panelFrom(g, shopFronts(runs, L, FP), ctx);
  /* 희귀(다른 판매자에 없는 제목) — 숍마다 제목 지문을 줄 세운 Int32Array로 → 몇 곳에 있나 */
  function hashSet(L) { const a = Int32Array.from(new Set((L || []).map((x) => x.h).filter(Boolean))); a.sort(); return a; }
  function hasH(a, h) { let lo = 0, hi = a.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m] === h) return true; if (a[m] < h) lo = m + 1; else hi = m - 1; } return false; }
  const rareOf = (sets, self) => (h) => { let n = 0; for (const [g, a] of sets) if (g !== self && hasH(a, h)) n++; return n; };
  /* 제목 낱말 후보 — 숍 여럿의 앞 페이지에 두루 나오는 낱말(한 숍에만 몰린 낱말은 뺌) */
  function topWords(panelsF, k) { const C = {}, S = {}; for (const [g, F] of panelsF) { const seen = new Set(); for (const it of F) for (const w of words(it.t)) { C[w] = (C[w] || 0) + 1; if (!seen.has(w)) { seen.add(w); S[w] = (S[w] || 0) + 1; } } }
    return Object.keys(C).filter((w) => (S[w] || 0) >= 3 && !Object.values(KIND).some((L) => L.includes(w))).sort((a, b) => C[b] - C[a]).slice(0, k || 20); }

  /* ── 탐색(수많은 조합) — rows = [{ g 무리(숍), t 시간 차례, x:{특징}, y:{결과}, c:[통제] }]
   *  무리 안 평균을 빼고(고정효과) · 통제를 빼낸 나머지끼리 상관 r · 순열 = 무리 안 순환 이동(시간 이어짐을 지킴) · time 없으면 무리 안 섞기 · BH q · 앞뒤 절반 같은 방향이면 재현 */
  function demean(rows, get) { const G = new Map(); for (const r of rows) { const v = get(r); if (!G.has(r.g)) G.set(r.g, []); G.get(r.g).push(v); } const M = new Map([...G].map(([g, a]) => [g, a.reduce((x, y) => x + y, 0) / a.length])); return rows.map((r) => get(r) - M.get(r.g)); }
  function resid(y, Cm) { const k = Cm.length ? Cm[0].length : 0; if (!k) return y.slice(); const n = y.length; const A = Array.from({ length: k }, () => new Array(k).fill(0)), b = new Array(k).fill(0);
    for (let i = 0; i < n; i++) for (let p = 0; p < k; p++) { b[p] += Cm[i][p] * y[i]; for (let q = 0; q < k; q++) A[p][q] += Cm[i][p] * Cm[i][q]; } for (let p = 0; p < k; p++) A[p][p] += 1e-9;
    const M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < k; c++) { let pv = c; for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r; [M[c], M[pv]] = [M[pv], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < k; r++) if (r !== c) { const f = M[r][c] / d; for (let q = c; q <= k; q++) M[r][q] -= f * M[c][q]; } }
    const beta = M.map((r, i) => r[k] / (r[i] || 1e-12)); return y.map((v, i) => v - Cm[i].reduce((s, c, p) => s + c * beta[p], 0)); }
  function corr(a, b) { const n = a.length; if (n < 3) return null; let sa = 0, sb = 0, sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; } const ma = sa / n, mb = sb / n; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; } return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null; }
  function bh(ps) { const o = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]); const m = o.length; const q = new Array(m); let mn = 1; for (let k = m - 1; k >= 0; k--) { mn = Math.min(mn, (o[k][0] * m) / (k + 1)); q[o[k][1]] = Math.min(1, mn); } return q; }
  const getX = (r, f) => { if (f.includes('*')) { const [a, b] = f.split('*'); const u = r.z && r.z[a], v = r.z && r.z[b]; return u != null && v != null ? u * v : null; } const v = r.x[f]; return v == null || !Number.isFinite(+v) ? null : +v; };
  function test1(rows, f, yk, O, R) { const S = rows.filter((r) => getX(r, f) != null && r.y[yk] != null && Number.isFinite(r.y[yk]) && r.c.every(Number.isFinite)); const cnt = new Map(); S.forEach((r) => cnt.set(r.g, (cnt.get(r.g) || 0) + 1)); const S2 = S.filter((r) => cnt.get(r.g) >= O.minG); const groups = new Set(S2.map((r) => r.g)).size;
    if (S2.length < O.minN) return null; const x = demean(S2, (r) => getX(r, f)), y = demean(S2, (r) => r.y[yk]); const cn = S2[0].c.length; const Cm = S2.map(() => []); for (let p = 0; p < cn; p++) { const c = demean(S2, (r) => r.c[p]); c.forEach((v, i) => Cm[i].push(v)); }
    const ex = resid(x, Cm), ey = resid(y, Cm); if ((sd(ex) || 0) < 1e-9) return null; const r = corr(ex, ey); if (r == null) return null;
    /* 순열: 무리마다 x 나머지를 돌려 섞음 */ const idx = new Map(); S2.forEach((row, i) => { if (!idx.has(row.g)) idx.set(row.g, []); idx.get(row.g).push(i); }); for (const L of idx.values()) L.sort((a, b) => S2[a].t - S2[b].t);
    let hit = 0; const B = O.B; const ep = new Array(ex.length); for (let b = 0; b < B; b++) { for (const L of idx.values()) { const m = L.length; if (O.time) { const s = 1 + Math.floor(R() * (m - 1)); for (let j = 0; j < m; j++) ep[L[j]] = ex[L[(j + s) % m]]; } else { const P = L.slice(); for (let j = m - 1; j > 0; j--) { const k = Math.floor(R() * (j + 1)); [P[j], P[k]] = [P[k], P[j]]; } for (let j = 0; j < m; j++) ep[L[j]] = ex[P[j]]; } } const rb = corr(ep, ey); if (rb != null && Math.abs(rb) >= Math.abs(r) - 1e-12) hit++; }
    const half = (k) => { const I = []; for (const L of idx.values()) { const m = L.length >> 1; (k ? L.slice(m) : L.slice(0, m)).forEach((i) => I.push(i)); } return corr(I.map((i) => ex[i]), I.map((i) => ey[i])); }; const h1 = half(0), h2 = half(1);
    const sY = sd(ey); return { f, y: yk, n: S2.length, groups, r: r4(r), p: r4((hit + 1) / (B + 1)), eff: sY != null ? r3(Math.exp(r * sY) - 1) : null, h1: r3(h1), h2: r3(h2), rep: h1 != null && h2 != null && Math.sign(h1) === Math.sign(r) && Math.sign(h2) === Math.sign(r) }; }
  const EX_DEF = { B: 199, minN: 30, minG: 4, time: true, top: 8, seed: 13, ys: null, feats: null, extra: [], q: 0.1 };
  function explore(rows, opt) { const O = { ...EX_DEF, ...(opt || {}) }; const R = rng(O.seed); const fs = O.feats || [...new Set(rows.flatMap((r) => Object.keys(r.x)))]; const ys = O.ys || [...new Set(rows.flatMap((r) => Object.keys(r.y)))];
    /* 곱(조합)을 위한 무리 안 z 값 */ for (const f of fs) { const S = rows.filter((r) => r.x[f] != null && Number.isFinite(+r.x[f])); const G = new Map(); S.forEach((r) => { if (!G.has(r.g)) G.set(r.g, []); G.get(r.g).push(+r.x[f]); }); const st = new Map([...G].map(([g, a]) => [g, [mean(a), sd(a) || 0]])); S.forEach((r) => { const [m, s] = st.get(r.g); (r.z = r.z || {})[f] = s > 0 ? (+r.x[f] - m) / s : 0; }); }
    const T = []; for (const yk of ys) for (const f of fs) { const t = test1(rows, f, yk, O, R); if (t) T.push(t); }
    const top = [...new Set(T.slice().sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).map((t) => t.f))].slice(0, O.top); const pairs = new Set(O.extra.filter((k) => k.includes('*')));
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) pairs.add(top[i] + '*' + top[j]);
    for (const k of pairs) for (const yk of ys) { const [a, b] = k.split('*'); if (!fs.includes(a) || !fs.includes(b)) continue; const t = test1(rows, k, yk, O, R); if (t) T.push({ ...t, combo: 1 }); }
    /* 작은 p는 더 많이 섞어 다시(199번이면 가장 작은 p가 0.005라 시험이 많으면 보정 뒤 못 넘음) */ for (let i = 0; i < T.length; i++) if (T[i].p <= 0.03) { const t2 = test1(rows, T[i].f, T[i].y, { ...O, B: O.B2 || 1999 }, R); if (t2) T[i] = { ...t2, combo: T[i].combo }; }
    const q = bh(T.map((t) => t.p)); T.forEach((t, i) => (t.q = r4(q[i]))); const sig = T.filter((t) => t.q < O.q).sort((a, b) => a.q - b.q || Math.abs(b.r) - Math.abs(a.r));
    return { tests: T.length, rows: rows.length, groups: new Set(rows.map((r) => r.g)).size, sig: sig.length, sigRep: sig.filter((t) => t.rep).length, top: T.slice().sort((a, b) => a.q - b.q || a.p - b.p || Math.abs(b.r) - Math.abs(a.r)).slice(0, 30), all: T }; }

  /* ── 가설 원장(스스로 진화) — 날마다 검증 결과로 베타 점수: 성공 = q<0.1 · 처음과 같은 방향 · 앞뒤 절반 재현 ──
   *  지지(3번 넘게 보고 점수 0.6 넘음) · 기각(3번 넘게 보고 0.25 아래) · 후보 · 다음 날 시험할 새 가설 = 잘 버틴 가설 × 다른 특징(곱) */
  function hypEvolve(ledger, res, day, opt) { const O = { keep: 400, gen: 6, pend: 24, ...(opt || {}) }; const L = ledger && ledger.H ? { ...ledger, H: { ...ledger.H } } : { v: 1, H: {}, pending: [] }; let nNew = 0, nUp = 0;
    for (const t of (res && res.all) || []) { const id = t.f + '|' + t.y; const h0 = L.H[id]; if (h0 && h0.lastDay === day) continue; const h = h0 ? { ...h0 } : { f: t.f, y: t.y, a: 1, b: 1, n: 0, sign: Math.sign(t.r) || 1, first: day, hist: [] }; if (!h0) nNew++; else nUp++;
      const ok = t.q < (O.q || 0.1) && Math.sign(t.r) === h.sign && t.rep; h.a += ok ? 1 : 0; h.b += ok ? 0 : 1; h.n++; h.lastDay = day; h.last = { r: t.r, q: t.q, eff: t.eff, n: t.n, rep: t.rep }; h.score = r3(h.a / (h.a + h.b)); h.hist = [...(h.hist || []), [day, t.r, t.q]].slice(-10);
      h.st = h.n >= 3 && h.score >= 0.6 ? '지지' : h.n >= 3 && h.score <= 0.25 ? '기각' : '후보'; L.H[id] = h; }
    const ids = Object.keys(L.H); if (ids.length > O.keep) { ids.sort((a, b) => (L.H[a].st === '기각') - (L.H[b].st === '기각') || L.H[b].score - L.H[a].score); ids.slice(O.keep).forEach((k) => delete L.H[k]); }
    const singles = [...new Set(Object.values(L.H).filter((h) => !h.f.includes('*')).map((h) => h.f))]; const good = Object.values(L.H).filter((h) => h.st !== '기각' && !h.f.includes('*')).sort((a, b) => b.score * Math.abs(b.last.r) - a.score * Math.abs(a.last.r)).slice(0, 5);
    const R = rng([...String(day)].reduce((s, c) => s * 31 + c.charCodeAt(0), 7)); const P = new Set((L.pending || []).filter((k) => !Object.values(L.H).some((h) => h.f === k && h.st === '기각')));
    for (const h of good) { for (let g = 0; g < 3 && P.size < O.pend; g++) { const o = singles[Math.floor(R() * singles.length)]; if (!o || o === h.f) continue; const k = [h.f, o].sort().join('*'); if (!Object.values(L.H).some((x) => x.f === k)) P.add(k); } }
    L.pending = [...P].slice(-O.pend); L.day = day; const V = Object.values(L.H); L.sum = { n: V.length, sup: V.filter((h) => h.st === '지지').length, cand: V.filter((h) => h.st === '후보').length, rej: V.filter((h) => h.st === '기각').length, nNew, nUp };
    L.best = V.filter((h) => h.st !== '기각').sort((a, b) => b.score - a.score || Math.abs(b.last.r) - Math.abs(a.last.r)).slice(0, 12).map((h) => ({ f: h.f, t: featT(h.f), y: h.y, yt: YT[h.y] || h.y, st: h.st, score: h.score, n: h.n, r: h.last.r, q: h.last.q, eff: h.last.eff }));
    return L; }
  /* 채점(그날까지 자료만): 숍마다 시간 앞 2/3로 배우고 뒤 1/3 맞히기 — 챔피언 = 통제만(지금 판매·등록·재고) · 도전자 = 통제 + 원장 위 특징 k개 · 평균 절대 오차(로그) */
  function oosScore(rows, feats, yk, opt) { const O = { frac: 2 / 3, ...(opt || {}) }; const F = (feats || []).filter(Boolean); const S = rows.filter((r) => r.y[yk] != null && Number.isFinite(r.y[yk]) && F.every((f) => getX(r, f) != null) && r.c.every(Number.isFinite)); const G = new Map(); S.forEach((r) => { if (!G.has(r.g)) G.set(r.g, []); G.get(r.g).push(r); });
    const tr = [], te = []; for (const L of G.values()) { if (L.length < 6) continue; L.sort((a, b) => a.t - b.t); const m = Math.floor(L.length * O.frac); const mu = mean(L.slice(0, m).map((r) => r.y[yk])); const mx = F.map((f) => mean(L.slice(0, m).map((r) => getX(r, f)))); const mc = L[0].c.map((_, p) => mean(L.slice(0, m).map((r) => r.c[p])));
      L.forEach((r, i) => { const o = { y: r.y[yk] - mu, c: r.c.map((v, p) => v - mc[p]), x: F.map((f, j) => getX(r, f) - mx[j]) }; (i < m ? tr : te).push(o); }); }
    if (tr.length < 20 || te.length < 8) return { n: te.length };
    const fit = (cols) => { const k = cols(tr[0]).length; const A = Array.from({ length: k }, () => new Array(k).fill(0)), b = new Array(k).fill(0); for (const o of tr) { const v = cols(o); for (let p = 0; p < k; p++) { b[p] += v[p] * o.y; for (let q = 0; q < k; q++) A[p][q] += v[p] * v[q]; } } for (let p = 0; p < k; p++) A[p][p] += 1e-6 + 0.5; /* 능선(작게) */
      const M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < k; c++) { let pv = c; for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r; [M[c], M[pv]] = [M[pv], M[c]]; for (let r = 0; r < k; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let q = c; q <= k; q++) M[r][q] -= f * M[c][q]; } } const be = M.map((r, i) => r[k] / r[i]); return (o) => cols(o).reduce((s, v, p) => s + v * be[p], 0); };
    const fc = fit((o) => o.c), fh = fit((o) => [...o.c, ...o.x]); const mae = (f) => te.reduce((s, o) => s + Math.abs(o.y - f(o)), 0) / te.length; return { n: te.length, champ: r4(mae(fc)), chall: r4(mae(fh)), feats: F }; }

  /* ── ⑥ 구매자 분포 · 함께 산 책 ── bd = { female:{'10대':%…}, male:{…} } (알라딘 새상품 화면 · 수집기 dynOne → prd_book_metrics.buyerDist) */
  const AGE_K = ['10대', '20대', '30대', '40대', '50대', '60대']; const AGE_MID = [15, 25, 35, 45, 55, 65];
  function audVec(bd) { if (!bd || !bd.female || !bd.male) return null; const v = [...AGE_K.map((a) => +bd.female[a] || 0), ...AGE_K.map((a) => +bd.male[a] || 0)]; const s = v.reduce((x, y) => x + y, 0); return s > 0 ? v.map((x) => x / s) : null; }
  function cosv(a, b) { if (!a || !b) return null; let s = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return na && nb ? s / Math.sqrt(na * nb) : null; }
  function audFeat(bd) { const v = audVec(bd); if (!v) return null; const ag = AGE_K.map((_, i) => v[i] + v[i + 6]); const fem = v.slice(0, 6).reduce((x, y) => x + y, 0); const ent = -v.filter((x) => x > 0).reduce((s, x) => s + x * Math.log(x), 0) / Math.log(12);
    return { v, fem, age: ag.reduce((s, x, i) => s + x * AGE_MID[i], 0), ent, young: ag[0] + ag[1], old: ag[4] + ag[5], top: AGE_K[ag.indexOf(Math.max(...ag))] }; }
  /* items = [{ id 책, bd, rel:[책 id(우리 책으로 바꾼 것)], relN 함께 산 책 수, price, pl 정가, cost 매입값, reg 등록 날(일 번호), sold 판 날|null, gone 내린 날|null, sp, cat, now }]
   *  우리 고객층 U = 판 권수로 가중한 분포 · 특징: 여성 몫·나이 평균·고름(엔트로피)·10·20대·50·60대·우리 고객층과 닮음 · 함께 산 책 수·그중 우리 책·이웃 판매율(자기 빼고)·이웃 판매중
   *  결과: 30일 안 팔림 · 팔리기까지 날(로그) · 정가 대비 값 · 매입값 ÷ 정가 · 값 대비 남는 몫 */
  function audStudy(items, opt) { const O = { B: 199, seed: 17, ...(opt || {}) }; const I = (items || []).filter((x) => x && x.id); const by = new Map(I.map((x) => [x.id, x])); const now = O.now || Math.max(...I.map((x) => x.now || 0), 0);
    const withBd = I.filter((x) => audVec(x.bd)); let U = null; { const acc = new Array(12).fill(0); let w = 0; for (const x of withBd) if (x.sold != null) { const v = audVec(x.bd); v.forEach((a, i) => (acc[i] += a)); w++; } if (w) U = acc.map((a) => a / w); }
    const s30 = (x) => (x.reg == null || now - x.reg < 30 ? null : x.sold != null && x.sold - x.reg <= 30 ? 1 : 0);
    const rows = []; for (const x of I) { const a = audFeat(x.bd); const rel = (x.rel || []).filter((k) => by.has(k) && k !== x.id); const nb = rel.map((k) => s30(by.get(k))).filter((v) => v != null);
      const X = { relN: x.relN ?? (x.rel || []).length, relIn: rel.length, nbSold: nb.length >= 2 ? r3(mean(nb)) : null, nbAct: rel.length ? r3(rel.filter((k) => { const o = by.get(k); return o.sold == null && o.gone == null; }).length / rel.length) : null };
      if (a) Object.assign(X, { aFem: r4(a.fem), aAge: r3(a.age), aEnt: r3(a.ent), aYoung: r4(a.young), aOld: r4(a.old), aFit: U ? r4(cosv(a.v, U)) : null });
      const Y = { sold30: s30(x), dts: x.sold != null && x.reg != null ? Math.log1p(Math.max(0, x.sold - x.reg)) : null, pr: x.price > 0 && x.pl > 0 ? Math.log(x.price / x.pl) : null, cr: x.cost != null && x.pl > 0 ? r4(x.cost / x.pl) : null, mg: x.cost != null && x.price > 0 ? r4((x.price - x.cost) / x.price) : null };
      rows.push({ g: topicKey(x.cat) ? topicKey(x.cat).split('>').slice(0, 2).join('>') : bandOf(x.price), t: 0, x: X, y: Y, c: [Math.log1p(+x.sp || 0)] }); }
    const ex = explore(rows, { B: O.B, seed: O.seed, time: false, minN: 40, minG: 5, top: 6 });
    /* 함께 산 책끼리 같이 팔리나: 우리 책 짝(둘 다 판 적 있음)에서 판 날 차이 7일 안 몫 vs 아무 짝 */ const sold = I.filter((x) => x.sold != null); let pr = 0, near = 0; const seen = new Set(); for (const x of sold) for (const k of x.rel || []) { const o = by.get(k); if (!o || o.sold == null || k === x.id) continue; const key = [x.id, k].sort().join('|'); if (seen.has(key)) continue; seen.add(key); pr++; if (Math.abs(o.sold - x.sold) <= 7) near++; }
    let base = null; if (sold.length > 20) { const R = rng(O.seed + 5); let m = 0, nn = 0; for (let i = 0; i < 4000; i++) { const a = sold[Math.floor(R() * sold.length)], b = sold[Math.floor(R() * sold.length)]; if (a === b) continue; nn++; if (Math.abs(a.sold - b.sold) <= 7) m++; } base = nn ? m / nn : null; }
    const hubs = I.map((x) => ({ id: x.id, t: x.t || null, inN: 0 })); const hm = new Map(hubs.map((h) => [h.id, h])); for (const x of I) for (const k of x.rel || []) if (hm.has(k) && k !== x.id) hm.get(k).inN++;
    const ageBy = AGE_K.map((a, i) => ({ a, f: U ? r4(U[i]) : null, m: U ? r4(U[i + 6]) : null }));
    return { n: I.length, bd: withBd.length, cover: I.length ? r3(withBd.length / I.length) : null, relN: I.filter((x) => (x.rel || []).length || x.relN).length, soldN: sold.length, U: ageBy, explore: { ...ex, all: undefined }, all: ex.all,
      coSell: { pairs: pr, near7: pr ? r3(near / pr) : null, base7: base != null ? r3(base) : null, lift: pr >= 10 && base > 0 ? r3(near / pr / base) : null }, hubs: hubs.filter((h) => h.inN >= 2).sort((a, b) => b.inN - a.inN).slice(0, 10) }; }
  /* 우리 숍 날짜 줄 — 우리 매물 줄(등록·판 날)로 그날 앞 페이지(최근 등록 FP개) 구성 → 다음 1·3일 우리 판매 수 · 무리 'ours' 하나(숍 고정효과 = 우리 평균) */
  function ourPanel(items, d0, d1, ctx, FP) { const fp = FP || 240; const L = (items || []).filter((x) => x.reg != null).map((x) => ({ id: x.key || x.id, bid: x.id, p: x.price, pl: x.pl, g: x.grade || null, t: x.t || '', low: 0, first: x.reg, gone: x.sold != null ? x.sold : x.gone != null ? x.gone : Infinity, isbn: x.isbn || null, ym: x.ym || null, cat: x.cat || null, h: hashT(x.t), ord: x.regAt || x.reg })).sort((a, b) => (b.ord > a.ord ? 1 : b.ord < a.ord ? -1 : 0));
    const soldOn = new Map(); for (const x of items || []) if (x.sold != null) soldOn.set(x.sold, (soldOn.get(x.sold) || 0) + 1); const regOn = new Map(); for (const x of items || []) if (x.reg != null) regOn.set(x.reg, (regOn.get(x.reg) || 0) + 1);
    const rows = []; for (let d = d0, t = 0; d <= d1 - 1; d++, t++) { const F = frontAt(L, d, fp); const x = frontFeat(F, d, ctx); if (!x) continue; const s = (a, b) => { let n = 0; for (let k = a; k <= b; k++) n += soldOn.get(k) || 0; return n; }; const T = L.filter((it) => it.first <= d && it.gone > d).length;
      rows.push({ g: 'ours', t, d, x, y: { g1: Math.log1p(s(d + 1, d + 1)), g2: d + 2 <= d1 ? Math.log1p(s(d + 2, d + 2)) : null, g3: d + 3 <= d1 ? Math.log1p(s(d + 1, d + 3) / 3) : null }, c: [Math.log1p(s(d, d)), Math.log1p(regOn.get(d + 1) || 0), Math.log1p(T)] }); }
    return rows; }

  /* ── ⑦ 판정 조건·롤모델 기준 스스로 진화(제안만) ──
   *  snaps = [{ day, F:{ sc: 판정 사실 f } }] 날짜 차례 · 날 t의 조건 걸림 → h일(기본 7) 넘게 뒤 결과: 나쁨 = 허위 표시·품절 취소율 5% 넘음·평점 97% 아래 · 좋음 = 나쁨 아님 + 6개월 평가 수가 줄지 않음
   *  조건마다 베타(1,1)로 줄인 몫 → 무게 = 배척·주의는 나쁨 몫 ÷ 기본 나쁨 몫 · 배움은 좋음 몫 ÷ 기본 · 충돌(배척·주의와 배움에 함께 걸린) 판매자가 실제로 나빴나 → 어느 쪽을 앞에 둘지 */
  const isBad = (f) => !!f && (!!f.fake || (f.cancel != null && f.cancel > 0.05) || (f.rating != null && f.rating < 0.97));
  function condEvolve(snaps, order, opt) { const O = { h: 7, minN: 5, ...(opt || {}) }; const S = (snaps || []).filter((s) => s && s.F && dayN(s.day) != null).sort((a, b) => String(a.day).localeCompare(String(b.day))); const st = {}; CONDS.forEach((c) => (st[c.k] = { n: 0, bad: 0, good: 0 })); let pairs = 0, bad0 = 0, good0 = 0; const cf = { n: 0, bad: 0 };
    for (let i = 0; i < S.length; i++) { const d = dayN(S[i].day); const j = S.findIndex((s, k) => k > i && dayN(s.day) - d >= O.h); if (j < 0) break; for (const [sc, f0] of Object.entries(S[i].F)) { const f1 = S[j].F[sc]; if (!f1) continue; pairs++; const b = isBad(f1) ? 1 : 0; const g = !b && (num(f1.rev6) ?? 0) >= (num(f0.rev6) ?? 0) ? 1 : 0; bad0 += b; good0 += g;
      const hits = CONDS.filter((c) => condHit(c.k, f0)); hits.forEach((c) => { st[c.k].n++; st[c.k].bad += b; st[c.k].good += g; }); const kinds = new Set(hits.map((c) => c.v)); if ((kinds.has('avoid') || kinds.has('watch')) && kinds.has('learn')) { cf.n++; cf.bad += b; } } }
    const baseB = pairs ? (bad0 + 1) / (pairs + 2) : null, baseG = pairs ? (good0 + 1) / (pairs + 2) : null;
    const conds = CONDS.map((c) => { const s = st[c.k]; const pB = (s.bad + 1) / (s.n + 2), pG = (s.good + 1) / (s.n + 2); const w = c.v === 'learn' ? (baseG ? pG / baseG : null) : c.v === 'info' ? null : baseB ? pB / baseB : null; return { k: c.k, t: c.t, v: c.v, n: s.n, bad: s.bad, good: s.good, pBad: r3(pB), pGood: r3(pG), w: r3(w), enough: s.n >= O.minN }; });
    const cur = normOrder(order); const avoidFirst = cf.n >= O.minN ? (cf.bad + 1) / (cf.n + 2) >= (baseB || 0) : true; const kOrd = avoidFirst ? ['avoid', 'watch', 'learn', 'info'] : ['learn', 'avoid', 'watch', 'info']; const W = new Map(conds.map((c) => [c.k, c]));
    const sug = []; for (const v of kOrd) { const ks = cur.filter((k) => condOf(k).v === v); const en = ks.filter((k) => W.get(k).enough && W.get(k).w != null).sort((a, b) => W.get(b).w - W.get(a).w); let ei = 0; for (const k of ks) sug.push(W.get(k).enough && W.get(k).w != null ? en[ei++] : k); }
    const changed = sug.some((k, i) => k !== cur[i]); return { pairs, base: { bad: r3(baseB), good: r3(baseG) }, conds, conflict: { n: cf.n, bad: cf.bad, avoidFirst }, order: sug, changed, ready: pairs >= 30 }; }
  /* 롤모델 기준 견줌: 날 t의 판정 사실로 기준마다 롤모델을 다시 골라 → h일 뒤 그 판매자들의 하루 판매가 합 순위(백분위) 평균 · 지금 기준보다 3번 넘게 나으면 바꾸기 제안 */
  function roleEvolve(hist, cur, opt) { const O = { h: 7, ...(opt || {}) }; const H = (hist || []).filter((x) => x && Array.isArray(x.profiles) && dayN(x.day) != null).sort((a, b) => String(a.day).localeCompare(String(b.day))); const BY = ['rev', 'sold', 'turn', 'rev6']; const acc = Object.fromEntries(BY.map((b) => [b, []]));
    for (let i = 0; i < H.length; i++) { const d = dayN(H[i].day); const j = H.findIndex((s, k) => k > i && dayN(s.day) - d >= O.h); if (j < 0) break; const later = H[j].profiles.filter((x) => x.p && x.p.revPerDay != null).sort((a, b) => a.p.revPerDay - b.p.revPerDay); if (later.length < 5) continue; const pct = new Map(later.map((x, k) => [String(x.sc), k / (later.length - 1)]));
      for (const by of BY) { const rr = roleRank(H[i].profiles.map((x) => ({ sc: String(x.sc), name: x.name, p: x.p, f: x.f || {} })), { ...(H[i].cfg || {}), by }); const v = rr.pick.map((x) => pct.get(String(x.sc))).filter((x) => x != null); if (v.length) acc[by].push(mean(v)); } }
    const res = Object.fromEntries(BY.map((b) => [b, { n: acc[b].length, m: r3(mean(acc[b])) }])); const c = cur || 'rev'; const wins = BY.filter((b) => b !== c).map((b) => ({ b, w: acc[b].filter((v, i) => acc[c][i] != null && v > acc[c][i] + 0.02).length })).sort((x, y) => y.w - x.w)[0];
    return { by: res, cur: c, best: wins && wins.w >= 3 && res[wins.b].m > (res[c].m || 0) ? wins.b : c, wins: wins || null }; }
  /* 따라 하기 결과: decs = [{ key, kind 'buy'|'price'|'reg', k(분야·가격대), state 'go'|'hold', at 일 번호 }] · sales = [{ d 일 번호, cat, band }]
   *  '진행'으로 고른 제안마다 고른 날 앞 30일과 뒤 30일의 우리 판매 중 그 분야(가격대) 몫 → 배 · 종류마다 평균 배 = 다음 제안 차례 무게 */
  function followEval(decs, sales, now, opt) { const O = { win: 30, ...(opt || {}) }; const S = sales || []; const out = []; for (const x of decs || []) { if (x.state !== 'go' || x.at == null) continue; const inW = (a, b) => S.filter((s) => s.d >= a && s.d < b); const tgt = (s) => (x.kind === 'price' ? s.band === x.k : topicKey(s.cat) === x.k || String(s.cat || '').startsWith(x.k));
      const B = inW(x.at - O.win, x.at), A = inW(x.at, Math.min(now || x.at + O.win, x.at + O.win)); const sb = B.length ? B.filter(tgt).length / B.length : null, sa = A.length ? A.filter(tgt).length / A.length : null; out.push({ key: x.key, kind: x.kind, k: x.k, days: Math.min(O.win, (now || 0) - x.at), before: r4(sb), after: r4(sa), nA: A.length, lift: sb > 0 && sa != null && A.length >= 20 ? r3(sa / sb) : null }); }
    const W = {}; for (const o of out) if (o.lift != null) (W[o.kind] = W[o.kind] || []).push(o.lift); return { items: out, w: Object.fromEntries(Object.entries(W).map(([k, a]) => [k, r3(mean(a))])) }; }

  const api = { VERSION, VERDICT, CONDS, DEFAULT_ORDER, condOf, normOrder, moveKey, dragKey, condHit, judge, pass, topicKey, bandOf, pubAgeM, runUse, profile, ROLE_DEF, roleRank, followPlan, FRONT_DEF, frontOne, frontPool, ourFront, spearman, pearson, boot, med, rowsOf,
    KIND, FEAT_T, YT, featT, hashT, shopItems, frontAt, frontFeat, shopFronts, panelFrom, shopPanel, hashSet, hasH, rareOf, topWords, explore, test1, bh, benchSpread, benchFix, hypEvolve, oosScore, AGE_K, audVec, audFeat, cosv, audStudy, ourPanel, isBad, condEvolve, roleEvolve, followEval, dayN, words };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowSellerLearn = api;
})(typeof window !== 'undefined' ? window : this);
