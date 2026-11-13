/* readnow-anom-core.js — 🧠 자료 이상 판단 엔진 (일꾼 anom1 · 정범님 11/13 11:54 「이런 판단을 엔진이 할 수 있도록 만들 수 있어?」 · 약속 55·64)
 * 왜: 벤치마킹 '📦 대량 사라짐'은 고정 기준(한 회차에 숍의 8%↑·하루 2%↑·500개↑)으로 정했음 — 판매자마다 평소가 다르고(대량 회전형·선별형) 상대는 방식을 바꾸므로(약속 64)
 *   고정 숫자 대신 ① 판매자마다 평소(기준선 35일)를 배우고(정보 수집 연구 I19 기준선) ② 크게 벗어난 사건만 골라 ③ '왜 그런지' 가설 여럿을 증거로 점수 매겨(I15 경쟁 가설 분석 ACH — 맞는 증거보다 어긋나는 증거를 더 무겁게)
 *   ④ 판정에 따라 통계에서 빼기/넣기/모름 ⑤ 사람이 '↩ 다시 넣기'·'📉 빼기'하면 그 결과로 기준·가설 무게를 고침(틀린 판정 줄이기).
 * 공용: 판정 틀(baseline · zOf · ach · judge · learn)은 자료 종류와 상관없음 — 종류마다 '도메인'(특징·지표·가설·증거)만 더함
 *   지금 도메인: bench(벤치마킹 사라짐) · benchMove(벤치마킹 값 바뀜) · series(어떤 숫자 줄이든 — 시장 지표·판매자 숍 요약·우리 판매 수·예스24 수 등)
 * 순수 함수 · 저장·네트워크 없음 · 클라우드(cloud/benchrep.js)·웹앱·Node 시험이 같이 씀. 사람용 글은 한국어.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  const EPS = 1e-5;
  const ln = (x) => Math.log(Math.max(+x || 0, 0) + EPS);
  const fin = (x) => typeof x === 'number' && isFinite(x);
  const r3 = (x) => (fin(x) ? Math.round(x * 1000) / 1000 : null);
  const pct = (x, d) => (fin(x) ? `${Math.round(x * 100 * (d || 1)) / (d || 1)}%` : '-');
  const nf = (x) => (fin(+x) ? Math.round(+x).toLocaleString('ko-KR') : '-');
  function medOf(a) { const b = a.filter(fin).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
  function madOf(a, m) { const d = a.filter(fin).map((x) => Math.abs(x - m)); return medOf(d); }

  /* ── ① 기준선(I19) — 로그 눈금에서 가운데·흩어짐(MAD) · 자기 회차가 적으면 모두의 기준선 쪽으로 당김(k회차 몫) ──
   *  own/pool: 숫자 배열(하루 비율 등) · 반환 { n, m(로그 가운데), s(로그 흩어짐), med(원래 눈금) } */
  function baseline(own, pool, opt) {
    opt = opt || {}; const k = opt.k != null ? opt.k : 5; const sMin = opt.sMin != null ? opt.sMin : 0.35;
    const A = (own || []).filter(fin).map(ln); const P = (pool || []).filter(fin).map(ln);
    const mA = medOf(A), mP = medOf(P); const sA = A.length >= 3 ? 1.4826 * madOf(A, mA) : null; const sP = P.length >= 3 ? 1.4826 * madOf(P, mP) : null;
    if (mA == null && mP == null) return null;
    const n = A.length; const w = n / (n + k);
    const m = mA == null ? mP : mP == null ? mA : w * mA + (1 - w) * mP;
    let s = sA == null ? sP : sP == null ? sA : w * sA + (1 - w) * sP; if (s == null || !(s >= sMin)) s = Math.max(sMin, s || 0);
    return { n, nPool: P.length, m, s, med: Math.exp(m) - EPS };
  }
  const zOf = (x, b) => (!b || !fin(+x) ? null : (ln(x) - b.m) / b.s);

  /* ── ② 경쟁 가설 분석(I15 ACH) ──
   *  H: [{id, name, act:'in'|'out'|'unk'|'tag', prior}] · E: [{k, why, w, c:{가설id: -2~+2}}]
   *  점수 = prior + Σ w×c (어긋남 c<0는 1.5배 — ACH는 '가장 덜 반박된 가설'을 고름) · 1등과 2등 차이가 작거나 1등도 약하면 '모름' */
  function ach(H, E, opt) {
    opt = opt || {}; const bias = opt.bias || {};
    const S = H.map((h) => { let sc = (h.prior || 0) + (bias[h.id] || 0); let inc = 0; const ev = [];
      for (const e of E) { const c = e.c && e.c[h.id]; if (!c) continue; const d = (e.w || 1) * (c < 0 ? c * 1.5 : c); sc += d; if (c < 0) inc++; ev.push({ k: e.k, d: Math.round(d * 10) / 10 }); }
      return { id: h.id, name: h.name, act: h.act, score: Math.round(sc * 10) / 10, inc, ev }; }).sort((a, b) => b.score - a.score || a.inc - b.inc);
    const top = S[0], sec = S[1]; const margin = top && sec ? top.score - sec.score : top ? top.score : 0;
    const minTop = opt.minTop != null ? opt.minTop : 2; const minMargin = opt.minMargin != null ? opt.minMargin : 1.5;
    const sure = !!top && top.score >= minTop && margin >= minMargin;
    const conf = top ? Math.round(100 / (1 + Math.exp(-(margin - minMargin)))) / 100 : 0;
    return { ranked: S, pick: sure ? top : null, margin: Math.round(margin * 10) / 10, conf };
  }

  /* ── 도메인 등록 ── */
  const DOMAINS = {};
  function domain(id, def) { DOMAINS[id] = def; return def; }

  /* 기본 배움 상태 — 클라우드가 app_settings/anom_learn에 둠 */
  function learnInit() { return { v: VERSION, zCut: {}, bias: {}, sc: {}, n: { fp: 0, fn: 0, ok: 0 }, seen: [], log: [] }; }
  const cutOf = (L, dom, sc, def) => { const z = (L && L.zCut && L.zCut[dom]) || def; const a = (L && L.sc && sc && L.sc[dom + ':' + sc]) || 0; return z + a; };

  /* ── ③ 판정 ──
   *  judge(domId, item, ctx) — ctx = { hist:[같은 대상의 앞 기록(기준선 재료)], pool:[모든 대상의 기록], learn, extra }
   *  반환 { dom, v, sc, metrics:[{k, name, x, med, z, hi}], anom, pick:{id,name,act,conf}|null, act, ranked, why:[글], at } */
  function judge(domId, item, ctx) {
    const D = DOMAINS[domId]; if (!D) return null; ctx = ctx || {}; const L = ctx.learn || null;
    const f = D.feat(item, ctx); if (!f || f.skip) return { dom: domId, v: VERSION, skip: f ? f.skip : 'noFeat', act: 'in' };
    const own = (ctx.hist || []).map((x) => D.feat(x, ctx)).filter((x) => x && !x.skip && !x.out);
    const pool = (ctx.pool || []).map((x) => D.feat(x, ctx)).filter((x) => x && !x.skip && !x.out);
    const cut = cutOf(L, domId, f.key, D.zCut || 3);
    const metrics = D.metrics.map((M) => { const x = f[M.k]; if (!fin(x)) return null; const b = baseline(own.map((o) => o[M.k]), pool.map((o) => o[M.k]), D.base); const z = zOf(x, b);
      return { k: M.k, name: M.name, x: r3(x), med: b ? r3(b.med) : null, n: b ? b.n : 0, bm: b ? b.m : null, bs: b ? b.s : null, z: z == null ? null : Math.round(z * 10) / 10, hi: z != null && (M.two ? Math.abs(z) : z) >= cut && (!M.min || (f[M.k + 'N'] || 0) >= M.min) }; }).filter(Boolean);
    const anom = metrics.some((m) => m.hi && (D.metrics.find((M) => M.k === m.k) || {}).main !== false);
    const ex = D.evidence(f, metrics, { ...ctx, cut, own });
    const warn = metrics.filter((m) => m.hi && (D.metrics.find((M) => M.k === m.k) || {}).main === false).map((m) => `⏳ ${m.name} ${m.x}(평소 ${m.med} · z=${m.z})`);
    if (!anom && !ex.force) { return { dom: domId, v: VERSION, key: f.key, metrics, anom: false, warn, pick: { id: 'normal', name: D.normalName || '평소', act: 'in', conf: 1 }, act: 'in', why: ex.quiet || [], cut, at: ctx.now || null, f: D.keep ? D.keep(f) : undefined }; }
    const A = ach(D.hyps, ex.E, { bias: (L && L.bias && L.bias[domId]) || {}, minTop: D.minTop, minMargin: D.minMargin });
    const pick = A.pick ? { id: A.pick.id, name: A.pick.name, act: A.pick.act, conf: A.conf } : { id: 'unk', name: '모름(가설끼리 비슷함)', act: D.unkAct || 'unk', conf: A.conf };
    const why = [...(ex.why || [])]; const top = A.ranked.slice(0, 3).map((h) => `${h.name} ${h.score}`).join(' · ');
    why.push(`가설 점수: ${top}${A.pick ? '' : ` → 1·2등 차이 ${A.margin}점(기준 ${D.minMargin != null ? D.minMargin : 1.5}점 아래)이라 모름`}`);
    return { dom: domId, v: VERSION, key: f.key, metrics, anom: true, warn, pick, act: pick.act, ranked: A.ranked.map((h) => ({ id: h.id, name: h.name, score: h.score, inc: h.inc, ev: h.ev })), margin: A.margin, why, cut, at: ctx.now || null, f: D.keep ? D.keep(f) : undefined };
  }

  /* ── ④ 스스로 채점하고 배움 (정범님 11/13 12:16 「내가 필요하지 않게 해 … 확신되지 않는 건 나를 표본으로 삼지 마」) ──
   *  사람의 '↩ 다시 넣기'는 배움 재료가 아님(기록만). 판정 뒤에 저절로 드러나는 증거(다음 회차들의 숍 상품 수 회복·새로 올림·사라짐 흐름 등)로
   *  도메인의 verify(판정 기록, 뒤 기록들)가 맞음/틀림/아직 모름을 매기고, 그 결과로 기준·가설 무게를 고침.
   *  out = [{ id, dom, key, pickId, pickName, act, ok:true|false, why, at }]
   *  틀림 + 뺐던 판정(틀린 경보) → 그 대상 기준 +0.25 · 그 가설 −0.5 / 틀림 + 넣었던 판정(놓침) → 도메인 기준 −0.25(바닥 2) · 그 가설 −0.5 / 맞음 → 그 가설 +0.1(위 1)
   *  같은 판정은 한 번만 채점(seen) · 기록 log 최근 50 */
  function verify(domId, rec, later) { const D = DOMAINS[domId]; if (!D || !D.verify || !rec) return null; try { return D.verify(rec, (later || []).filter(Boolean)); } catch (e) { return null; } }
  function learn(state, outs) {
    const L = state && state.v ? state : { ...learnInit(), ...(state || {}) }; L.zCut = L.zCut || {}; L.bias = L.bias || {}; L.sc = L.sc || {}; L.n = L.n || { fp: 0, fn: 0, ok: 0 }; L.seen = L.seen || []; L.log = L.log || [];
    const seen = new Set(L.seen); let ch = 0;
    for (const x of outs || []) { if (!x || !x.id || x.ok == null || seen.has(x.id)) continue; seen.add(x.id); const D = DOMAINS[x.dom] || {}; const def = D.zCut || 3; const B = (L.bias[x.dom] = L.bias[x.dom] || {});
      if (x.ok) { L.n.ok++; if (x.pickId) B[x.pickId] = Math.min(1, (B[x.pickId] || 0) + 0.1); ch++; continue; }
      const wasOut = x.act === 'out' || x.act === 'unk';
      if (wasOut) { L.n.fp++; const k = x.dom + ':' + x.key; L.sc[k] = Math.min(3, (L.sc[k] || 0) + 0.25); }
      else { L.n.fn++; L.zCut[x.dom] = Math.max(2, (L.zCut[x.dom] || def) - 0.25); }
      if (x.pickId) B[x.pickId] = Math.max(-4, (B[x.pickId] || 0) - 0.5);
      L.log.unshift({ id: x.id, at: x.at || null, k: wasOut ? 'fp' : 'fn', why: `뒤 증거로 틀림 — '${x.pickName || x.pickId || '?'}': ${String(x.why || '').slice(0, 140)} → ${wasOut ? `${x.key} 기준 +0.25` : `${x.dom} 기준 −0.25`} · 그 가설 −0.5` }); ch++; }
    L.seen = [...seen].slice(-600); L.log = L.log.slice(0, 50); L.v = VERSION; return { learn: L, changed: ch };
  }

  /* ════ 도메인: bench — 벤치마킹 회차의 '사라짐' ════
   *  회차 칸(bench_days): total·add·gone·goneNew·missOnce·missBack·moved·spanDays·full·complete·cover·notRead·runLastPage·base·light·partial
   *  📌 발견(anom1 11/13 실측 · 16곳 250여 회차): 사라짐은 두 번 확인 — 회차 k의 gone ≈ 앞 회차 k−1의 missOnce(처음 안 보인 것)
   *     → gone이 실제로 일어난 때는 '앞 회차의 간격'(span k−1)이지 이번 간격이 아님. 앞 간격이 25일이면 25일치가 한 번에 '사라짐'으로 들어옴.
   *  extra(있으면): { prev: 앞 숍 전체 회차, prev2: 그 앞, relist: { hit, ctrl, still, n } 사라진 제목이 창 안에 새 번호로 다시 올라온 몫·대조군 몫 } */
  function benchPrev(v, ctx) { const e = (ctx.extra && ctx.extra[v.dayId]) || {}; return e; }
  domain('bench', {
    name: '벤치마킹 사라짐', zCut: 3, base: { k: 5, sMin: 0.35 }, minTop: 2, minMargin: 1.5, unkAct: 'unk', normalName: '평소',
    metrics: [
      { k: 'rGone', name: '사라짐(하루·숍 대비 · 실제 일어난 간격으로 나눔)', min: 200 },
      { k: 'rMiss', name: '처음 안 보임(하루·숍 대비 · 다음 회차 사라짐 미리 알림)', min: 300, main: false },
      { k: 'rAdd', name: '새로 올림(하루·숍 대비)', min: 300, main: false },
    ],
    feat(v, ctx) {
      if (!v || v.base || v.light || v.partial || v.complete === false) return { skip: 'notFull' };
      const E = benchPrev(v, ctx); const p = E.prev || null; const p2 = E.prev2 || null;
      const total = +v.total || 0; const g = +v.gone || 0; const add = +v.add || 0; const mo = +v.missOnce || 0; const sp = +v.spanDays || 0;
      const prevN = Math.max(1, (p && +p.total) || total - add + g);
      /* 사라짐이 실제로 일어난 간격 — 앞 회차가 숍 전체이고 그 회차의 '처음 안 보임'이 이번 사라짐과 비슷하면(±35%) 앞 간격 */
      const moP = p ? +p.missOnce || 0 : null; const spP = p ? +p.spanDays || 0 : 0;
      const twoStep = p && p.full !== false && moP > 0 && Math.abs(g - moP) <= Math.max(30, 0.35 * moP);
      const win = twoStep && spP > 0 ? spP : sp > 0 ? sp : 1;
      const full = v.full !== false; const out = v.excl === true || (v.anom ? v.anom.act !== 'in' : v.massGone === true && v.excl !== false);
      return { key: String(v.sc), id: v.dayId, full, total, g, add, mo, sp, win, twoStep: !!twoStep, prevN, spP, moP,
        rGone: full && g >= 0 ? g / prevN / win : null, rGoneN: g, rGoneNaive: full ? g / prevN / Math.max(sp, 0.25) : null,
        rMiss: full && sp > 0 ? mo / Math.max(1, total) / sp : null, rMissN: mo,
        rAdd: sp > 0 ? add / prevN / sp : null, rAddN: add,
        addWin: twoStep && p ? +p.add || 0 : add, totP2: p2 ? +p2.total || null : null, totP: p ? +p.total || null : null,
        missBack: +v.missBack || 0, goneNew: +v.goneNew || 0, cover: v.cover != null ? +v.cover : 1, notRead: +v.notRead || 0, lastPage: +v.runLastPage || null, lastPageP: p ? +p.runLastPage || null : null,
        relist: E.relist || null, cheapG: E.cheapG, cheapT: E.cheapT, out, name: v.name || null };
    },
    keep: (f) => ({ win: r3(f.win), twoStep: f.twoStep, rGoneNaive: r3(f.rGoneNaive), prevN: f.prevN, addWin: f.addWin, relist: f.relist, g: f.g, add: f.add, total: f.total, totP: f.totP, rGone: r3(f.rGone) }),
    /* 뒤 증거로 채점 — rec = 회차 문서의 anom(판정 · f 숫자 · z 칸) · later = 그 뒤 숍 전체 회차(시간 순 · 2회차까지 봄)
     *  다시 올리기: 뒤 회차에 숍 상품 수가 앞 수준으로 돌아옴(새로 올림이 채움) = 맞음 · 줄어든 채 그대로 = 틀림(내림이었음)
     *  대량 내림·진짜 판매: 줄어든 채 그대로 = 맞음 · 앞 수준으로 돌아옴 = 틀림(다시 올리기였음)
     *  숍 닫음: 뒤에도 앞 수의 30% 아래 = 맞음 · 돌아옴 = 틀림
     *  읽기 잡음·모름: 뒤 회차에 상품 수가 그대로(사라진 게 아니었음) = 맞음 · 실제로 줄어 그대로 = 틀림
     *  긴 틈·평소(넣음): 뒤 짧은 간격 회차의 하루 사라짐이 기준선 안 = 맞음 · 기준선을 크게 넘음 = 틀림(사건의 시작을 놓침) */
    verify(rec, later) { const a = rec || {}; const f = a.f || {}; const id = (a.pick && a.pick.id) || (a.act === 'in' ? 'normal' : 'unk'); const L = later.filter((x) => x && x.full !== false && !x.base && !x.light && !x.partial && x.complete !== false).slice(0, 2);
      if (!L.length) return { ok: null, why: '뒤 회차 아직 없음' }; const totP = +f.totP || 0; const g = +f.g || 0; const tot = Math.max(...L.map((x) => +x.total || 0)); if (!totP || !g) return { ok: null, why: '숫자 모자람' };
      const back = tot >= totP - 0.2 * g; const stay = tot <= totP - 0.5 * g; const tx = `뒤 ${L.length}회차 상품 수 최고 ${nf(tot)}(판정 전 ${nf(totP)} · 사라짐 ${nf(g)})`;
      if (id === 'relist') return back ? { ok: true, why: `${tx} — 돌아옴` } : stay && L.length >= 2 ? { ok: false, why: `${tx} — 줄어든 채 그대로(내림이었음)` } : { ok: null, why: tx };
      if (id === 'takedown' || id === 'sale') return stay && L.length >= 2 ? { ok: true, why: `${tx} — 줄어든 채 그대로` } : back ? { ok: false, why: `${tx} — 앞 수준으로 돌아옴(다시 올리기였음)` } : { ok: null, why: tx };
      if (id === 'close') return tot <= 0.3 * totP ? (L.length >= 2 ? { ok: true, why: `${tx} — 비운 채 그대로` } : { ok: null, why: tx }) : { ok: false, why: `${tx} — 다시 찼음` };
      if (id === 'noise' || id === 'unk') return back ? { ok: true, why: `${tx} — 상품이 그대로 있었음` } : stay && L.length >= 2 ? { ok: false, why: `${tx} — 실제로 줄었음` } : { ok: null, why: tx };
      /* 넣었던 판정 — 짧은 간격의 다음 회차 하루 사라짐을 그때 기준선(z 칸의 가운데)과 견줌 */
      const zg = (a.z || []).find((r) => r[0] === 'rGone'); const med = zg ? +zg[2] : null; const x = L.find((y) => +y.spanDays > 0 && +y.spanDays <= 4); if (!x || !(med > 0)) return { ok: null, why: '견줄 짧은 간격 회차 없음' };
      const r2 = (+x.gone || 0) / Math.max(1, +x.total || 1) / Math.max(0.25, +x.spanDays); const ratio = r2 / med;
      return ratio <= 4 ? { ok: true, why: `다음 짧은 회차 하루 사라짐 ${pct(r2, 100)} — 평소(${pct(med, 100)})의 ${Math.round(ratio * 10) / 10}배` } : { ok: false, why: `다음 짧은 회차 하루 사라짐 ${pct(r2, 100)} — 평소의 ${Math.round(ratio)}배(사건의 시작을 놓침)` }; },
    hyps: [
      { id: 'longgap', name: '긴 틈에 쌓인 평소 사라짐', act: 'in', prior: 0 },
      { id: 'relist', name: '다시 올리기(내렸다 새 번호로 올림)', act: 'out', prior: 0 },
      { id: 'takedown', name: '대량 내림(올리지 않음)', act: 'out', prior: 0 },
      { id: 'close', name: '숍 닫음·비움', act: 'out', prior: -1 },
      { id: 'noise', name: '읽기 잡음(쪽 빠짐·화면 바뀜)', act: 'unk', prior: 0 },
      { id: 'sale', name: '진짜 대량 판매', act: 'in', prior: -1.5 }, /* 하루에 숍의 몇 %를 한 사람이 사 가는 일은 드묾 — 대량 내림과 증거가 같으면 내림 쪽(뺌 = 조심스러운 쪽) */
    ],
    evidence(f, M, ctx) {
      const E = [], why = []; const mg = M.find((m) => m.k === 'rGone'); const mm = M.find((m) => m.k === 'rMiss'); const ma = M.find((m) => m.k === 'rAdd');
      const share = f.g / f.prevN;
      why.push(`사라짐 ${nf(f.g)}개 = 숍의 ${pct(share, 10)} · 실제 일어난 간격 ${r3(f.win)}일${f.twoStep ? `(앞 회차가 처음 못 본 ${nf(f.moP)}개를 이번에 확정 — 두 번 확인)` : ''} → 하루 ${pct(f.rGone, 100)}${mg ? ` · 평소 ${pct(mg.med, 100)}(기준선 ${mg.n}회차) · 벗어남 z=${mg.z}` : ''}`);
      /* 긴 틈 — 이번 간격으로 나누면 크지만 실제 간격으로 나누면 평소 */
      if (mg && f.twoStep && f.win >= 4) { const bz = mg.bm != null && fin(f.rGoneNaive) ? (ln(f.rGoneNaive) - mg.bm) / mg.bs : null;
        const naiveHi = bz != null && bz >= ctx.cut; const realOk = mg.z != null && mg.z < ctx.cut;
        E.push({ k: 'gap', w: 1.5, c: { longgap: realOk ? 2 : -2, relist: realOk ? -1 : 0, takedown: realOk ? -1 : 0, sale: realOk ? -1 : 0 } });
        if (realOk) why.push(`📏 이번 간격(${r3(f.sp)}일)으로 나누면 하루 ${pct(f.rGoneNaive, 100)}${bz != null ? `(z=${Math.round(bz * 10) / 10})` : ''}로 커 보이지만, 실제로 사라진 때는 앞 간격 ${r3(f.win)}일 — 하루로는 평소와 같음${naiveHi ? '(고정 기준이 사건으로 잡은 까닭)' : ''}`);
      } else E.push({ k: 'gap', w: 1, c: { longgap: -2 } });
      /* 다시 올리기 — 사라진 제목이 같은 창 안에 새 번호로 올라온 몫(hit)과, 대조군(남은 옛 제목이 창 안에 한 권 더 올라온 몫 ctrl)의 차이 */
      const R = f.relist; if (R && R.n >= 30 && fin(R.hit) && fin(R.ctrl)) { const ex = R.hit - R.ctrl; const c = ex >= 0.15 ? 2 : ex >= 0.06 ? 1 : ex < 0.03 ? -2 : 0;
        E.push({ k: 'relist', w: 2, c: { relist: c, takedown: ex >= 0.15 ? -2 : ex < 0.03 ? 1 : 0, sale: ex >= 0.15 ? -1 : ex < 0.03 ? 1 : 0, close: ex >= 0.15 ? -2 : ex < 0.03 ? 1 : 0 } });
        why.push(`🔁 사라진 제목 ${nf(R.n)}개 중 같은 창에 새 번호로 다시 올라온 몫 ${pct(R.hit)} · 대조군(안 사라진 옛 제목) ${pct(R.ctrl)} → 넘친 몫 ${pct(ex)}${ex >= 0.15 ? ' — 다시 올리기 증거' : ex < 0.03 ? ' — 다시 올리기 아님' : ''}${fin(R.still) ? ` · 같은 제목이 숍에 남음 ${pct(R.still)}` : ''}`); }
      else why.push('🔁 다시 올리기 견줄 제목 자료 없음(사라진 목록·숍 목록이 없는 회차)');
      /* 같은 창에 새로 올린 수 ÷ 사라진 수 */
      if (f.g > 0) { const ra = f.addWin / f.g; E.push({ k: 'addRatio', w: 1, c: { relist: ra >= 0.6 && ra <= 1.6 ? 1 : ra < 0.3 ? -1 : 0, takedown: ra < 0.3 ? 1 : ra >= 0.6 ? -1 : 0, sale: ra < 0.5 ? 1 : 0, close: ra >= 0.3 ? -2 : 1 } });
        why.push(`➕ 같은 창에 새로 올림 ${nf(f.addWin)}개(사라짐의 ${pct(ra)})`); }
      /* 전체 수 바뀜 */
      if (f.totP && f.total) { const d = f.total / f.totP - 1; E.push({ k: 'total', w: 1.5, c: { close: d <= -0.6 ? 3 : -3, relist: Math.abs(d) < 0.05 ? 1 : d <= -0.6 ? -2 : 0, takedown: d <= -0.6 ? -1 : d <= -0.5 * share ? 1 : -1, sale: d <= -0.6 ? -2 : d <= -0.5 * share ? 1 : -1 } }); why.push(`📦 전체 상품 ${nf(f.totP)} → ${nf(f.total)}(${d >= 0 ? '+' : ''}${pct(d, 10)})`); }
      /* 읽기 상태 */
      const bad = !f.full || f.cover < 0.999 || f.notRead > 0 || (f.lastPage && f.lastPageP && f.lastPage < 0.9 * f.lastPageP);
      const back = f.moP > 0 ? f.missBack / f.moP : 0;
      E.push({ k: 'read', w: 1.5, c: { noise: bad ? 3 : back >= 0.5 ? 2 : -2 } });
      why.push(bad ? `🧩 읽기 상태 나쁨 — 끝까지 ${f.full ? '✓' : '✗'} · 덮은 비율 ${f.cover} · 못 본 ${nf(f.notRead)} · 끝 쪽 ${nf(f.lastPage)}(앞 ${nf(f.lastPageP)})` : `🧩 읽기 상태 좋음(끝까지 · 덮음 ${f.cover}${f.missBack ? ` · 다시 보인 것 ${nf(f.missBack)}` : ''})`);
      /* 처음 안 보임이 크게 벗어났는데 새로 올림도 함께 크면 → 다시 올리기 진행 중(다음 회차 사라짐 미리 알림) */
      if (mm && mm.hi && ma) { const both = ma.z != null && ma.z >= ctx.cut - 1; E.push({ k: 'missAdd', w: 1, c: { relist: both ? 1 : -1, takedown: both ? -1 : 1 } }); why.push(`⏳ 처음 안 보임 ${nf(f.mo)}개(z=${mm.z}) — 다음 회차 사라짐 미리 알림${both ? ' · 새로 올림도 함께 큼(다시 올리기 진행 중일 수 있음)' : ''}`); }
      /* 값대 쏠림(싼 것만 치움 = 내림) */
      if (fin(f.cheapG) && fin(f.cheapT)) { const d = f.cheapG - f.cheapT; E.push({ k: 'cheap', w: 0.5, c: { takedown: d >= 0.15 ? 1 : 0, sale: d >= 0.15 ? -1 : 0 } }); }
      const quiet = [why[0]]; if (f.twoStep && f.win >= 4) quiet.push(`📏 실제로 사라진 때는 앞 간격 ${r3(f.win)}일 — 하루로는 평소`);
      return { E, why, quiet, force: !!(f.twoStep && f.win >= 4 && fin(f.rGoneNaive) && f.g >= 500 && f.g / f.prevN >= 0.08) };
    },
  });

  /* ════ 도메인: benchMove — 벤치마킹 회차의 '값 바뀜'(일괄 값 고침 감지 · 통계는 넣되 표시) ════ */
  domain('benchMove', {
    name: '벤치마킹 값 바뀜', zCut: 3, base: { k: 5, sMin: 0.5 }, minTop: 1.5, minMargin: 1, unkAct: 'tag',
    metrics: [{ k: 'rMove', name: '값 바뀜(하루·숍 대비)', min: 200 }],
    feat(v) { if (!v || v.base || v.light || v.partial || v.complete === false) return { skip: 'notFull' }; const total = +v.total || 0; const sp = +v.spanDays || 0; const mv = +v.moved || 0;
      return { key: String(v.sc), id: v.dayId, rMove: total && sp > 0 ? mv / total / sp : null, rMoveN: mv, full: v.full !== false, cover: v.cover != null ? +v.cover : 1, mv, total }; },
    hyps: [{ id: 'bulkPrice', name: '판매자 일괄 값 고침', act: 'tag', prior: 1 }, { id: 'noise', name: '읽기 잡음(값 칸 바뀜)', act: 'tag', prior: 0 }],
    evidence(f, M) { const m = M[0]; const bad = !f.full || f.cover < 0.999; return { E: [{ k: 'read', w: 1.5, c: { noise: bad ? 2 : -1, bulkPrice: bad ? -1 : 1 } }],
      why: [`💱 값 바뀜 ${nf(f.mv)}개 = 숍의 ${pct(f.mv / Math.max(1, f.total), 10)}${m ? ` · 하루 ${pct(m.x, 100)} · 평소 ${pct(m.med, 100)} · z=${m.z}` : ''}${bad ? ' · 읽기 상태 나쁨' : ''}`] }; },
  });

  /* ════ 도메인: series — 어떤 숫자 줄이든(시장 지표·판매자 숍 요약·우리 판매 수·예스24 수 …) ════
   *  item = { key, t, v, prev:[앞 값들(시간 순)], next:[뒤 값들(있으면)], read:{ok:false|true, why} }
   *  가설: 읽기 잡음(0·빈 값·읽기 실패·한 번 튀고 바로 되돌아옴) · 진짜 수준 바뀜(뒤 값들도 새 수준) · 한 번 튐(뒤 값이 되돌아옴 — 행사·몰림) */
  domain('series', {
    name: '숫자 줄', zCut: 3, base: { k: 3, sMin: 0.2 }, minTop: 1.5, minMargin: 1, unkAct: 'unk',
    metrics: [{ k: 'v', name: '값', two: true }],
    feat(it) { if (!it || !fin(+it.v)) return { skip: 'noVal' }; return { key: String(it.key || ''), id: it.id || `${it.key}:${it.t}`, v: +it.v, vN: Infinity, next: (it.next || []).filter(fin), prev: (it.prev || []).filter(fin), read: it.read || null, out: !!it.out }; },
    hyps: [{ id: 'noise', name: '읽기 잡음', act: 'out', prior: 0 }, { id: 'level', name: '진짜 수준 바뀜', act: 'in', prior: 0 }, { id: 'spike', name: '한 번 튐(행사·몰림)', act: 'in', prior: 0 }],
    evidence(f, M, ctx) { const m = M[0]; const E = [], why = []; const med = m ? m.med : null;
      why.push(`값 ${f.v}${m ? ` · 평소 ${r3(med)} · z=${m.z}` : ''}`);
      if (f.read && f.read.ok === false) { E.push({ k: 'read', w: 2, c: { noise: 3 } }); why.push(`읽기 실패 표시: ${f.read.why || ''}`); }
      if (f.v === 0 && med > 0) { E.push({ k: 'zero', w: 1, c: { noise: 2, level: -1 } }); why.push('갑자기 0 — 읽기 잡음 의심'); }
      if (f.next.length && med != null) { const back = f.next.filter((x) => Math.abs(ln(x) - ln(med)) < Math.abs(ln(f.v) - ln(med)) / 2).length / f.next.length;
        E.push({ k: 'next', w: 1.5, c: { level: back < 0.3 ? 2 : -2, spike: back >= 0.6 ? 2 : -1, noise: back >= 0.6 ? 1 : -1 } }); why.push(`뒤 값 ${f.next.length}개 중 평소로 되돌아온 몫 ${pct(back)}`); }
      else why.push('뒤 값 없음 — 수준 바뀜인지 한 번 튐인지 다음 값을 봐야 앎');
      /* 일어나는 쪽으로 기울기(z 부호) — 떨어짐이 크면 잡음 쪽 */
      if (m && m.z != null) { const lowSide = ln(f.v) < ln(med || 0); if (lowSide) E.push({ k: 'down', w: 0.5, c: { noise: 1 } }); }
      return { E, why, force: (m && m.z != null && Math.abs(m.z) >= (ctx.cut || 3)) || (f.read && f.read.ok === false) }; },
  });
  /* 숫자 줄 하나 판정 — 앞 값(prev)이 기준선 재료 · 위·아래 모두 벗어남을 봄(two) */
  function judgeSeries(it, ctx) { return judge('series', it, { ...(ctx || {}), hist: (it.prev || []).map((v, i) => ({ key: it.key, id: `${it.key}:p${i}`, v })) }); }

  /* 판정 결과를 사람이 읽는 한 줄로 */
  function line(r) { if (!r) return ''; if (!r.anom) return `✓ ${r.pick ? r.pick.name : '평소'}`; const a = r.act === 'out' ? '통계에서 뺌' : r.act === 'unk' ? '모름(통계에서 뺌)' : r.act === 'tag' ? '표시만' : '통계에 넣음'; return `${r.act === 'in' ? '🟢' : r.act === 'out' ? '📦' : r.act === 'tag' ? '🏷' : '❔'} ${r.pick ? r.pick.name : '모름'} → ${a}${r.pick && r.pick.conf != null ? ` (확신 ${Math.round(r.pick.conf * 100)}%)` : ''}`; }

  const API = { VERSION, baseline, zOf, ach, domain, DOMAINS, judge, judgeSeries, verify, learn, learnInit, line, _ln: ln };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.ReadnowAnom = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null);
