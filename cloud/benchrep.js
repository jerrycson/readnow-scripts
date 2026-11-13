/* 🎯 집중 벤치마킹 회차 보고 — 회차가 끝날 때마다 '매 회차 고정 항목' 19줄을 클라우드가 저절로 셈 (benchfix · 정범님 11/13 「벤치마킹은 왜 자세히 보고를 안 해?」)
 *  왜: 지금까지는 쪽 수·데이터 양만 보고했고, 판매자마다 무엇이 들어오고·팔리고·값이 바뀌었는지는 일꾼이 진단으로 숍 기록(숍마다 9~13MB)을 받아 손으로 셈(scratchpad ana.py·ana2.py·ana3.py) → 매 회차 같은 셈을 여기서
 *  재료(모두 이미 모은 것 · 다른 판매자의 공개 숍 정보만 · 손님 정보 없음):
 *    회차 요약 bench_days(그날 회차 + 0시를 넘겨 끝난 앞날 회차) · 지금 숍 목록 bench_state/{숍}/c/{조각}(한 조각씩 읽고 바로 버림 — 메모리 가볍게)
 *    우리 판매중 상품 prd_listings(제목·값만) · 테더링 prd_jobs/net_{날} · 바퀴 prd_jobs/benchForce · 설정 app_settings/bench(주요·부가 그룹)
 *  결과: app_settings/bench_report(가장 최근) · app_settings/bench_report_{날}(날마다 · 덮어쓰지 않고 그날 것만 새로) — 웹앱 🔬 연구 › 🎯 회차 보고 · 🎯 집중 벤치마킹 카드 링크
 *  같은 셈을 시험이 바로 부를 수 있게 셈(makeAcc)과 읽기·쓰기(run)를 나눔 — src/tests/tBENCHREP1113.js */
'use strict';
/* 📦 대량 사라짐 사건 — 수집기 benchFinish의 MASS와 같은 기준(한 회차에 숍의 8%↑ · 하루로 나눠 2%↑ · 500개↑) · 근거는 수집기 주석(11/13 실측) */
const BENCH_MASS = { share: 0.08, perDay: 0.02, min: 500 };
function massOf(v) { if (!v || v.base || v.full === false || v.light) return null; const g = +v.gone || 0; if (g < BENCH_MASS.min) return null; const prevN = Math.max(1, (+v.total || 0) - (+v.add || 0) + g); const share = g / prevN; const perDay = share / Math.max(1, +v.spanDays || 1);
  if (!(share >= BENCH_MASS.share && perDay >= BENCH_MASS.perDay)) return null; return { on: true, gone: g, prevN, share: Math.round(share * 1000) / 1000, perDay: Math.round(perDay * 1000) / 1000, by: 'cloud', rule: '숍의 8%↑ · 하루 2%↑ · 500개↑' }; }
const massOut = (v) => !!v && v.massGone === true && v.excl !== false; /* 사람이 '↩ 다시 넣기'(excl:false)를 누르면 다시 셈에 넣음 */
/* (anom1 11/13) 🧠 자료 이상 판단 엔진 — 고정 기준 대신 판매자마다 평소(35일)를 배우고 벗어난 회차만 가설(다시 올리기·대량 내림·숍 닫음·읽기 잡음·진짜 대량 판매·긴 틈)로 판정
 *  공용 파일 readnow-anom-core.js(이미지 안 사본 cores_ · 시험은 저장소 맨 위) — 못 읽으면 예전 고정 기준(massOf) 그대로 */
const AN = (() => { for (const f of ['./cores_readnow-anom-core.js', '../readnow-anom-core.js']) { try { return require(f); } catch (e) {} } return null; })();
const ymd = (d) => String(d || '').slice(0, 10).replace(/-/g, '');
const humanSet = (v) => !!v && (v.excl === true || v.excl === false) && !!v.exclBy; /* 사람이 고른 회차 — 엔진은 판정만 적고 빼기/넣기는 안 바꿈(배움 재료로는 안 씀) */
const nt = (t) => String(t || '').slice(0, 40).replace(/\s+/g, '');
const hh = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rows = (L) => (Array.isArray(L) ? L : []).map((r) => { try { return typeof r === 'string' ? JSON.parse(r) : r; } catch (e) { return null; } }).filter(Array.isArray);
const med = (a) => { const b = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const r1 = (x, d) => (x == null || !Number.isFinite(x) ? null : Math.round(x * (d || 1)) / (d || 1));
const band = (p) => (!p ? '?' : p < 3000 ? '~3천' : p < 6000 ? '3~6천' : p < 10000 ? '6천~1만' : p < 20000 ? '1~2만' : p < 40000 ? '2~4만' : '4만~');
const BANDS = ['~3천', '3~6천', '6천~1만', '1~2만', '2~4만', '4만~'];
const lifeB = (l) => (l <= 3 ? '0~3일' : l <= 7 ? '4~7일' : l <= 14 ? '8~14일' : l <= 30 ? '15~30일' : l <= 60 ? '31~60일' : '61일~');
const cnt = (L, f) => L.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const pop = (m) => { m >>>= 0; let c = 0; while (m) { m &= m - 1; c++; } return c; };
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const STOPW = new Set(['세트', '개정판', '전집', '상', '하', '박스', '권', '전권', 'the', 'of', 'and', 'The']);

/* 셈 본체 — 바깥 읽기 없음(시험이 같은 자료로 부름)
 *  ctx = { day, runs:[그날 회차 문서 전부(목록 칸 포함)], hist:[최근 21일 회차 숫자 칸], role:{sc:'main'|'sub'}, force, net, prevRep, cfgDetail } → acc.shop(sc, M) 조각마다 → acc.ours(rows) → acc.done() */
function makeAcc(ctx) {
  const day = ctx.day; const D0 = Date.parse(day + 'T00:00:00+09:00'); const d7 = kday(D0 - 7 * 864e5).replace(/-/g, '');
  const runs = (ctx.runs || []).filter((v) => v && v.sc); const role = ctx.role || {};
  const full = runs.filter((v) => !v.light && !v.partial); const light = runs.filter((v) => v.light);
  const lastBy = new Map(); for (const v of full.slice().sort((a, b) => String(a.runAt || a.at || '').localeCompare(String(b.runAt || b.at || '')))) lastBy.set(String(v.sc), v);
  const lightBy = new Map(); for (const v of light) lightBy.set(String(v.sc), v);
  const SC = [...new Set(runs.map((v) => String(v.sc)))]; const IX = new Map(SC.map((s, i) => [s, i]));
  const nameOf = (sc) => { const v = lastBy.get(sc) || lightBy.get(sc) || {}; return String(v.name || sc).slice(0, 30); };
  /* 팔림(새 상품 사라짐) · 값 바뀜 · 최저가 잃음 — 대량 사라짐 회차·사람이 뺀 회차는 따로 */
  const soldNew = [], soldBase = [], movedA = [], lowOffA = [], massL = []; const movedIds = new Map(); const goneT = new Map();
  /* 🧠 회차마다 앞 회차 둘(기준선·두 번 확인 간격)과 제목 창 — hist는 최근 35일 회차 숫자 칸 */
  const H = (ctx.hist || []).filter((x) => x && x.sc && !x.light && !x.partial && x.complete !== false).sort((a, b) => String(a.runAt || a.at || '').localeCompare(String(b.runAt || b.at || '')));
  const prevOf = (v) => { const t = String(v.runAt || v.at || ''); const L = H.filter((x) => String(x.sc) === String(v.sc) && x.dayId !== v.dayId && String(x.runAt || x.at || '') < t); return [L[L.length - 1] || null, L[L.length - 2] || null]; };
  const RL = new Map(); /* sc → { G: 사라진 제목 해시, a, e(창 YYYYMMDD), win(일), bits(제목→1 옛·2 창 안) } */
  for (const v of full) { if (v.base || v.full === false) continue; const [p, p2] = prevOf(v); const a = ymd((p2 || p || {}).day || v.day); const e = ymd(v.day); const G = new Set(); rows(v.goneList).forEach((g) => { if (g[1]) G.add(hh(nt(g[1]))); }); if (G.size) RL.set(String(v.sc), { G, a, e, bits: new Map(), dayId: v.dayId, p, p2 }); }
  const learnSt = ctx.learn || null; const anomBy = new Map(); const canJ = !!AN && H.filter((x) => !x.base && x.full !== false).length >= 3; /* 기준선 재료가 없으면(처음 며칠·시험) 예전 고정 기준 */
  const judgeRun = (v) => { if (!canJ) return null; const [p, p2] = prevOf(v); const R = RL.get(String(v.sc)); const extra = { [v.dayId]: { prev: p, prev2: p2, relist: R && R.rel ? R.rel : null } };
    const T = Date.parse(v.runAt || v.at || 0); const win = (x) => { const t = Date.parse(x.runAt || x.at || 0); return t < T && T - t <= 35 * 864e5; }; const keepIn = (x) => !(x.anom ? x.anom.act !== 'in' : x.massGone === true && x.excl !== false) && x.excl !== true;
    const hist = H.filter((x) => String(x.sc) === String(v.sc) && win(x) && keepIn(x)); const pool = H.filter((x) => String(x.sc) !== String(v.sc) && win(x) && keepIn(x));
    const ex2 = {}; for (const x of [...hist, ...pool]) { const [q, q2] = prevOf(x); ex2[x.dayId] = { prev: q, prev2: q2 }; } Object.assign(ex2, extra);
    try { const r = AN.judge('bench', v, { hist, pool, extra: ex2, learn: learnSt, now: new Date().toISOString() }); const m = AN.judge('benchMove', v, { hist, pool, extra: ex2, learn: learnSt }); return { r, m }; } catch (e) { return { err: String(e && e.message || e).slice(0, 120) }; } };
  for (const v of full) { const sc = String(v.sc); let m;
    if (canJ && !v.base && v.full !== false && !humanSet(v)) { m = null; /* 엔진 판정은 숍 목록을 다 본 뒤(done) — 여기서는 사건 후보만 모아 둠 */ if (+v.gone >= 200) m = { pend: 1, share: (+v.gone || 0) / Math.max(1, (+v.total || 0) - (+v.add || 0) + (+v.gone || 0)), perDay: null, by: 'anom' }; }
    else m = massOut(v) ? v.mass || massOf(v) : !v.massGone && v.excl !== false ? massOf(v) : null;
    const out = v.excl === true || (!!m && !m.pend && v.excl !== false);
    if (m) massL.push({ sc, name: nameOf(sc), dayId: v.dayId || null, gone: +v.gone || 0, total: +v.total || 0, spanDays: +v.spanDays || null, share: m.share, perDay: m.perDay, by: m.by || (v.mass && v.mass.by) || 'cloud', marked: v.massGone === true, still: 0, chk: 0, baseShare: null, pend: !!m.pend });
    const G = rows(v.goneList); const nw = G.filter((g) => g[4] != null); const bs = G.filter((g) => g[4] == null);
    if (m) { const mi = massL[massL.length - 1]; mi.baseShare = G.length ? r1(bs.length / G.length, 100) : null; const S = new Set(); G.slice(0, 3000).forEach((g) => S.add(hh(nt(g[1])))); goneT.set(sc, { S, mi }); mi.chk = S.size; }
    /* 판정을 기다리는 회차(pend)도 일단 셈 재료로 모으되 숍 이름표를 달아 done에서 걸러 냄 */
    if (!out) { nw.forEach((g) => soldNew.push({ sc, id: g[0], t: g[1], h: hh(nt(g[1])), p: +g[2] || 0, g: g[3] || null, life: +g[4], low: !!g[6], pend: !!(m && m.pend) })); bs.forEach((g) => soldBase.push({ sc, p: +g[2] || 0, pend: !!(m && m.pend) })); }
    const M = rows(v.movedList); const ms = new Set(); M.forEach((x) => { movedA.push({ sc, id: String(x[0]), from: +x[1] || 0, to: +x[2] || 0 }); ms.add(String(x[0])); }); movedIds.set(sc, { ids: ms, t: new Map() });
    rows(v.lowOffList).forEach((x) => lowOffA.push({ sc, id: String(x[0]), t: x[1], p: +x[2] || 0 })); }
  /* 시장 지도 — 제목(앞 40자 · 띄어쓰기 뺌) 해시마다: 가진 숍(비트) · 가장 싼 값과 그 숍 · 그 숍을 뺀 가장 싼 값 · 가장 비싼 값 (조각마다 바로 넣고 조각은 버림) */
  const HX = new Map(); let cap = 1 << 16; let mask = new Uint32Array(cap), m1 = new Int32Array(cap), s1 = new Uint8Array(cap), m2 = new Int32Array(cap), mx = new Int32Array(cap), nH = 0;
  const grow = () => { cap *= 2; const g = (A, T) => { const B = new T(cap); B.set(A); return B; }; mask = g(mask, Uint32Array); m1 = g(m1, Int32Array); s1 = g(s1, Uint8Array); m2 = g(m2, Int32Array); mx = g(mx, Int32Array); };
  const BIG = 2147483647;
  const put = (h, si, p) => { let i = HX.get(h); if (i == null) { if (nH >= cap) grow(); i = nH++; HX.set(h, i); mask[i] = 0; m1[i] = BIG; s1[i] = 255; m2[i] = BIG; mx[i] = 0; } mask[i] |= 1 << (si % 32); if (!(p > 0)) return; if (p > mx[i]) mx[i] = p;
    if (s1[i] === si) { if (p < m1[i]) m1[i] = p; } else if (p < m1[i]) { m2[i] = m1[i]; m1[i] = p; s1[i] = si; } else if (p < m2[i]) m2[i] = p; };
  const othersMin = (h, sc) => { const i = HX.get(h); if (i == null) return null; const si = IX.get(sc); const v = s1[i] === si ? m2[i] : m1[i]; return v >= BIG ? null : v; };
  const shopSt = new Map(); const shop = (sc, M) => { sc = String(sc); let si = IX.get(sc); if (si == null) { si = SC.length; SC.push(sc); IX.set(sc, si); }
    const S = shopSt.get(sc) || { live: 0, isbn: 0, cat: 0, det: 0, recent7: 0, tc: new Map(), prices: [] }; shopSt.set(sc, S); const mv = movedIds.get(sc); const gt = goneT.get(sc); const rl = RL.get(sc);
    for (const [id, v] of Object.entries(M || {})) { if (!Array.isArray(v) || v[6]) continue; S.live++; if (v[7]) S.isbn++; if (v[8]) S.cat++; if (v[10] === 1) S.det++; if (String(v[1] || '') >= d7) S.recent7++; const t = nt(v[4]); if (!t) continue; const h = hh(t); put(h, si, +v[0] || 0); S.tc.set(h, (S.tc.get(h) || 0) + 1); if (S.prices.length < 200000 && +v[0] > 0) S.prices.push(+v[0]); if (mv && mv.ids.has(String(id))) mv.t.set(String(id), h); if (gt && gt.S.has(h)) { gt.mi.still++; gt.S.delete(h); } if (rl) { const fs = String(v[1] || ''); rl.bits.set(h, (rl.bits.get(h) || 0) | (fs && fs >= rl.a && fs <= rl.e ? 2 : fs && fs < rl.a ? 1 : 0) | 4); } } };
  const endShop = (sc) => { const rl = RL.get(String(sc)); if (rl && rl.bits && rl.bits.size) { let o = 0, on = 0, hit = 0, still = 0; for (const b of rl.bits.values()) if (b & 1) { o++; if (b & 2) on++; } const hitS = new Set(); for (const h of rl.G) { const b = rl.bits.get(h) || 0; if (b & 4) still++; if (b & 2) { hit++; hitS.add(h); } }
      rl.rel = { n: rl.G.size, hit: r1(hit / rl.G.size, 1000), ctrl: o ? r1(on / o, 1000) : null, still: r1(still / rl.G.size, 1000), a: rl.a, e: rl.e }; rl.hitS = hitS; rl.bits = null; }
    const S = shopSt.get(String(sc)); if (!S || !S.tc) return; let multi = 0; for (const c of S.tc.values()) if (c >= 2) multi += c; S.multi = multi; S.tc = null; S.med = med(S.prices); S.p3k = S.prices.length ? S.prices.filter((p) => p < 3000).length / S.prices.length : null; S.prices = null; };
  let OURS = null; const ours = (L) => { OURS = L || []; };
  function done() {
    for (const sc of shopSt.keys()) endShop(sc);
    /* 🧠 판정 — 숍 목록을 다 본 뒤라 '다시 올리기' 제목 증거(rel)가 있음 */
    const anomL = []; const outSc = new Set(); const inSc = new Set(); const relistCut = new Map();
    for (const v of full) { if (!canJ || v.base || v.full === false) continue; const J = judgeRun(v); if (!J || J.err || !J.r) continue; const r = J.r; anomBy.set(v.dayId, J); const sc = String(v.sc); const hs = humanSet(v);
      const act = hs ? (v.excl ? 'out' : 'in') : r.act; if (act === 'in') inSc.add(sc); else outSc.add(sc);
      const R = RL.get(sc); const w = r.f && r.f.win;
      /* 짧은 창(7일 안)이면 '같은 제목이 창 안에 새 번호로 다시 올라온' 새 상품 사라짐은 팔림이 아니라 다시 올리기 — 그 줄만 팔림에서 뺌(대조군 몫만큼은 우연일 수 있어 숫자로 남김) */
      if (act === 'in' && !hs && R && R.hitS && R.hitS.size && w != null && w <= 7) relistCut.set(sc, R.hitS); /* 사람이 넣은 회차는 손대지 않음 */
      anomL.push({ sc, name: nameOf(sc), dayId: v.dayId, human: hs ? (v.excl ? 'out' : 'in') : null, act, anom: r.anom, pick: r.pick, line: AN.line(r), why: (r.why || []).slice(0, 9), warn: r.warn || [], metrics: (r.metrics || []).map((m) => ({ k: m.k, name: m.name, x: m.x, med: m.med, n: m.n, z: m.z, hi: m.hi })), ranked: (r.ranked || []).slice(0, 6), win: w, relist: R && R.rel ? R.rel : null, move: J.m && J.m.anom ? { line: AN.line(J.m), why: (J.m.why || []).slice(0, 3) } : null, gone: +v.gone || 0, total: +v.total || 0, span: +v.spanDays || null }); }
    if (canJ) { /* 판정 기다린 회차: 엔진이 뺐으면 셈 재료에서 걸러 내고 📦 목록에 남김 · 넣었으면 목록에서 지움 */
      for (let i = soldNew.length - 1; i >= 0; i--) { const x = soldNew[i]; if (x.pend && outSc.has(x.sc)) soldNew.splice(i, 1); }
      for (let i = soldBase.length - 1; i >= 0; i--) { const x = soldBase[i]; if (x.pend && outSc.has(x.sc)) soldBase.splice(i, 1); }
      for (let i = massL.length - 1; i >= 0; i--) { const mi = massL[i]; const J = anomBy.get(mi.dayId); if (mi.pend && !outSc.has(mi.sc)) { massL.splice(i, 1); continue; } if (J && J.r) { mi.by = 'anom'; mi.pick = J.r.pick ? J.r.pick.name : null; mi.perDay = J.r.metrics && J.r.metrics[0] ? J.r.metrics[0].x : mi.perDay; } }
      let cutN = 0; const cutBy = {}; for (let i = soldNew.length - 1; i >= 0; i--) { const x = soldNew[i]; const S = relistCut.get(x.sc); if (S && S.has(x.h)) { soldNew.splice(i, 1); cutN++; cutBy[x.sc] = (cutBy[x.sc] || 0) + 1; } }
      ctx._relistCut = { n: cutN, by: cutBy }; }
    const P = { round: {}, data: {}, shops: [], light: [], sold: {}, mass: massL, moves: {}, market: {}, predict: {}, noOther: {}, buy: {}, signal: {}, ours: {}, groups: {}, problems: [], hours: { ok: false, why: '숍 목록 줄에는 처음 본 날만 있고 시각이 없음 — 하루 한 번 읽기로는 등록·값 고친 시각대를 모름(주요 10곳 첫 쪽만 2~3시간마다 읽으면 알 수 있음 · 하루 약 44MiB · 정범님 허락 필요)' } };
    const prevOf = (v) => (ctx.hist || []).filter((x) => String(x.sc) === String(v.sc) && !x.light && !x.partial && x.full !== false && x.complete !== false && !x.base && String(x.runAt || x.at || '') < String(v.runAt || v.at || '') && x.dayId !== v.dayId).sort((a, b) => String(b.runAt || b.at || '').localeCompare(String(a.runAt || a.at || '')))[0] || null;
    /* ① 판 */ { const F = ctx.force || {}; const pagesF = full.reduce((a, v) => a + (+v.readTo || Math.max(0, (+v.pages || 1) - 1)), 0); const pagesL = light.reduce((a, v) => a + (+v.readTo || Math.max(0, (+v.pages || 1) - 1)), 0);
      P.round = { start: F.resumeOf || F.startedAt || null, end: F.doneAt || null, done: !!F.done, failed: (F.failed || []).map((s) => nameOf(String(s))), pagesFull: pagesF, pagesLight: pagesL, pages: pagesF + pagesL, items: full.reduce((a, v) => a + (+v.total || 0), 0), newLight: light.reduce((a, v) => a + (+v.newN || 0), 0), shopsFull: lastBy.size, shopsOk: [...lastBy.values()].filter((v) => v.full !== false && v.complete !== false).length, shopsLight: lightBy.size, first: [...lastBy.values()].filter((v) => v.base).map((v) => ({ name: nameOf(String(v.sc)), pages: +v.readTo || +v.pages || 0, total: +v.total || 0 })), main: [...lastBy.keys()].filter((s) => role[s] === 'main').length, sub: [...lastBy.keys()].filter((s) => role[s] !== 'main').length, detail: F.detail || null }; }
    /* ② 데이터 */ { const N = ctx.net || {}; P.data = { ...N, pages: P.round.pages, perPageMiB: N.benchBytes && P.round.pages ? r1(N.benchBytes / 1048576 / P.round.pages, 100) : null }; }
    /* ③ 판매자 표 */
    for (const v of [...lastBy.values()].sort((a, b) => String(a.runAt || '').localeCompare(String(b.runAt || '')))) { const sc = String(v.sc); const mv = movedA.filter((x) => x.sc === sc); const up = mv.filter((x) => x.to > x.from), dn = mv.filter((x) => x.to < x.from); const pc = (L) => (L.length ? r1((L.reduce((a, x) => a + (x.to - x.from) / x.from, 0) / L.length) * 100, 1) : null); const pv = prevOf(v); const S = shopSt.get(sc) || {};
      P.shops.push({ sc, name: nameOf(sc), role: role[sc] === 'main' ? '주요' : '부가', first: !!v.base, total: +v.total || 0, live: S.live || null, pages: +v.readTo || null, lastPage: +v.runLastPage || null, runAt: v.runAt || null, at: v.at || null, add: v.base ? null : +v.add || 0, gone: v.base || !(v.full !== false && v.complete !== false) ? null : +v.gone || 0, goneNew: v.base || !(v.full !== false && v.complete !== false) ? null : +v.goneNew || 0, unk: !v.base && !(v.full !== false && v.complete !== false), up: up.length, upPct: pc(up), dn: dn.length, dnPct: pc(dn), moved: +v.moved || 0, span: v.spanDays != null ? +v.spanDays : null, perDay: !v.base && +v.spanDays > 0 && v.full !== false && v.complete !== false ? Math.round((+v.gone || 0) / +v.spanDays) : null, full: v.full !== false && v.complete !== false, cover: v.cover != null ? +v.cover : null, notRead: +v.notRead || 0, missOnce: +v.missOnce || 0, mass: !!massL.find((m) => m.sc === sc), excl: v.excl === true, prev: pv ? { day: pv.day, gone: +pv.gone || 0, add: +pv.add || 0, span: +pv.spanDays || null, perDay: +pv.spanDays > 0 ? Math.round((+pv.gone || 0) / +pv.spanDays) : null } : null }); }
    /* ④ 새 상품만 읽은 숍 */
    for (const v of lightBy.values()) { const sc = String(v.sc); const pv = (ctx.hist || []).filter((x) => String(x.sc) === sc && x.light && String(x.runAt || x.at || '') < String(v.runAt || v.at || '')).sort((a, b) => String(b.runAt || '').localeCompare(String(a.runAt || '')))[0]; P.light.push({ sc, name: nameOf(sc), total: +v.total || null, pages: +v.readTo || Math.max(0, (+v.pages || 1) - 1), newN: +v.newN || 0, prevNewN: pv ? +pv.newN || 0 : null, prevDay: pv ? pv.day : null }); }
    /* ⑤ 팔린 것 특징 */ { const L = soldNew; const ws = new Map(); L.forEach((x) => (String(x.t || '').match(/[가-힣A-Za-z]{2,}/g) || []).forEach((w) => { if (!STOPW.has(w)) ws.set(w, (ws.get(w) || 0) + 1); }));
      const by = new Map(); L.forEach((x) => { const a = by.get(x.sc) || []; a.push(x.p); by.set(x.sc, a); });
      P.sold = { n: L.length, base: soldBase.length, med: med(L.map((x) => x.p)), band: cnt(L, (x) => band(x.p)), grade: cnt(L, (x) => x.g || '?'), low: L.filter((x) => x.low).length, life: cnt(L, (x) => lifeB(x.life)), byShop: [...by.entries()].map(([sc, a]) => ({ name: nameOf(sc), n: a.length, med: med(a) })).sort((a, b) => (a.med || 0) - (b.med || 0)), words: [...ws.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20), fast7: L.filter((x) => x.life <= 7).length, fastTop: L.filter((x) => x.life <= 7).sort((a, b) => b.p - a.p).slice(0, 15).map((x) => ({ name: nameOf(x.sc), t: String(x.t || '').slice(0, 40), p: x.p, g: x.g, life: x.life })) }; }
    /* ⑥ 사라짐 믿음도 */ P.mass = massL.map((m) => ({ ...m, stillShare: m.chk ? r1(m.still / m.chk, 100) : null }));
    /* 🧠 자료 이상 판단 — 회차마다 판정·근거 · 판매자 표에 '실제 간격'과 하루 사라짐 */
    P.anom = { v: AN ? AN.VERSION : null, on: canJ, list: anomL, relistCut: ctx._relistCut || null, learn: learnSt ? { n: learnSt.n || null, zCut: learnSt.zCut || {}, log: (learnSt.log || []).slice(0, 5), how: '판정 뒤 다음 회차들의 상품 수 회복·사라짐 흐름으로 스스로 채점(사람 판단은 배움에 안 씀)' } : null, chk: (ctx.hist || []).filter((x) => x.anom && x.anom.chk && x.anom.chk.ok != null).slice(-10).map((x) => ({ dayId: x.dayId, name: x.name || x.sc, pick: x.anom.pick ? x.anom.pick.name : null, ok: x.anom.chk.ok, why: x.anom.chk.why })), rule: AN ? '판매자마다 최근 35일 평소(사라짐·처음 안 보임·새로 올림·값 바뀜의 하루 몫)를 배우고, 크게 벗어난 회차만 가설 6가지를 증거로 점수 매겨 판정 — 다시 올리기·대량 내림·숍 닫음은 팔림에서 뺌 · 읽기 잡음·가설이 비슷하면 모름(뺌) · 긴 틈·진짜 대량 판매는 넣음 · 사람이 고른 것이 그 회차 처리에는 앞섬(배움 재료로는 안 씀) · 판정 뒤 다음 회차 증거로 스스로 채점' : '엔진 파일 없음 — 고정 기준(8%·2%·500)' };
    for (const s of P.shops) { const a = anomL.find((x) => x.sc === s.sc); if (!a) continue; s.anom = a.line; s.act = a.act; if (a.win != null && s.gone != null) { s.win = a.win; s.perDayReal = Math.round(s.gone / Math.max(0.25, a.win)); } if (a.act !== 'in') s.mass = true; }
    /* ⑦ 값 매김 움직임 */ { const up = movedA.filter((x) => x.to > x.from && x.from > 0), dn = movedA.filter((x) => x.to < x.from && x.from > 0); const pr = cnt(dn, (x) => `${x.from}→${x.to}`); const dpc = dn.map((x) => (x.to - x.from) / x.from);
      P.moves = { n: movedA.length, up: up.length, dn: dn.length, dnMedPct: r1(med(dpc) * 100, 1), dnMedWon: med(dn.map((x) => x.to - x.from)), dnDist: cnt(dpc, (p) => (p > -0.1 ? '−10% 안' : p > -0.3 ? '−10~30%' : p > -0.5 ? '−30~50%' : '−50% 넘게')), pairs: Object.entries(pr).sort((a, b) => b[1] - a[1]).slice(0, 8), tail: Object.entries(cnt(dn, (x) => String(x.to % 1000).padStart(3, '0'))).sort((a, b) => b[1] - a[1]).slice(0, 4), byShop: SC.map((sc) => ({ name: nameOf(sc), up: up.filter((x) => x.sc === sc).length, dn: dn.filter((x) => x.sc === sc).length })).filter((x) => x.up + x.dn) }; }
    /* ⑧ 정가 대비 · ⑪ 매입 경로 · ⑫ 주력 변화 · ⑩ 재고 회전 (숍마다) */
    const per = []; for (const v of lastBy.values()) { const sc = String(v.sc); const A = rows(v.addList); const pl = A.filter((a) => +a[2] > 0 && +a[6] > 0).map((a) => +a[2] / +a[6]); const tc = cnt(A, (a) => nt(a[1])); const dup = Object.values(tc).filter((c) => c >= 2).reduce((a, c) => a + c, 0); const S = shopSt.get(sc) || {}; const nwS = soldNew.filter((x) => x.sc === sc);
      const gr = cnt(A, (a) => a[3] || '?'); const topG = Object.entries(gr).sort((a, b) => b[1] - a[1])[0]; const ratio = pl.length >= 3 ? med(pl) : null; const sMed = med(nwS.map((x) => x.p));
      const addB = v.addBand || cnt(A, (a) => band(+a[2])), stB = v.totalBand || {}; const sh = (B, k) => { const t = Object.values(B || {}).reduce((a, c) => a + c, 0); return t ? (B[k] || 0) / t : null; }; const shift = BANDS.map((k) => [k, sh(addB, k), sh(stB, k)]).filter((x) => x[1] != null && x[2] != null && Math.abs(x[1] - x[2]) >= 0.08).map((x) => `${x[0]} ${Math.round(x[1] * 100)}% (재고 ${Math.round(x[2] * 100)}%)`);
      const route = !A.length ? '새로 올린 것 없음 — 있는 재고 값만 조정' : ratio != null && ratio <= 0.25 && dup >= 20 ? '같은 책 여러 권·정가의 25% 아래 → 덩어리(뭉치) 매입' : ratio != null && ratio >= 0.35 && dup < 10 ? '낱권 골라 올림(같은 책 거의 없음) → 선별 매입' : ratio != null && ratio <= 0.25 ? '싸게 많이 올림 → 저가 뭉치형' : '섞임';
      const grp = (ratio != null && ratio <= 0.25) || (sMed != null && sMed <= 3000) || (ratio == null && sMed == null && S.p3k != null && S.p3k >= 0.5) ? '대량 회전형' : (ratio != null && ratio >= 0.35) || (sMed != null && sMed >= 5000) || (ratio == null && sMed == null && S.med != null && S.med >= 10000) ? '선별형' : '중간';
      per.push({ sc, name: nameOf(sc), addN: A.length, plN: pl.length, ratio: r1(ratio, 1000), addGrade: topG ? `${topG[0]} ${Math.round((topG[1] / A.length) * 100)}%` : null, dup, multiShare: S.live ? r1((S.multi || 0) / S.live, 1000) : null, recent7: S.live ? r1(S.recent7 / S.live, 1000) : null, turnDay: !v.base && +v.spanDays > 0 && S.live ? r1(nwS.length / +v.spanDays / S.live, 100000) : null, lifeMed: med(nwS.map((x) => x.life)), lowShare: S.live && v.lowNow != null ? r1(+v.lowNow / S.live, 1000) : null, soldLow: nwS.length ? r1(nwS.filter((x) => x.low).length / nwS.length, 100) : null, soldMed: sMed, stockMed: S.med, route, group: grp, shift, isbn: S.isbn || 0, cat: S.cat || 0, det: S.det || 0, live: S.live || 0 }); }
    P.per = per; P.groups = { volume: per.filter((x) => x.group === '대량 회전형').map((x) => x.name), select: per.filter((x) => x.group === '선별형').map((x) => x.name), mid: per.filter((x) => x.group === '중간').map((x) => x.name) };
    /* ⑨ 시장 최저 대비 · ⑭ 살 곳 없는 책 · ⑮ 매입 기회 · ⑯ 시장 신호 */ { let le = 0, gt = 0; const ratios = []; const none = []; const cheap = []; const multi = new Map();
      for (const x of soldNew) { const o = othersMin(x.h, x.sc); if (o != null && x.p > 0) { ratios.push(x.p / o); if (x.p <= o) le++; else gt++; if (o >= 20000 && x.p < o * 0.8) cheap.push({ name: nameOf(x.sc), t: String(x.t || '').slice(0, 40), p: x.p, min: o }); } else if (o == null) none.push(x); const s = multi.get(x.h) || { t: x.t, s: new Set() }; s.s.add(x.sc); multi.set(x.h, s); }
      let below = 0, eq = 0, above = 0, nT = 0; const mvBy = new Map(); for (const x of movedA) { const mv = movedIds.get(x.sc); const h = mv && mv.t.get(x.id); if (h == null) continue; nT++; const s = mvBy.get(h) || new Set(); s.add(x.sc); mvBy.set(h, s); if (x.to < x.from) { const o = othersMin(h, x.sc); if (o == null) continue; if (x.to < o) below++; else if (x.to === o) eq++; else above++; } }
      let k2 = 0, k4 = 0, k8 = 0; const spread = []; for (let i = 0; i < nH; i++) { const c = pop(mask[i]); if (c >= 2) k2++; if (c >= 4) { k4++; if (m1[i] < BIG && m1[i] > 0 && mx[i] > 0) spread.push(mx[i] / m1[i]); } if (c >= 8) k8++; }
      P.market = { titles: nH, k2, k4, k8, spreadMed: r1(med(spread), 10), soldMatched: ratios.length, soldLeMin: le, soldGtMin: gt, soldRatioMed: r1(med(ratios), 100), cutTitled: nT, cutBelow: below, cutEq: eq, cutAbove: above };
      const n5 = none.filter((x) => x.p >= 5000), n10 = none.filter((x) => x.p >= 10000);
      P.noOther = { n: none.length, n5: n5.length, n10: n10.length, top: n10.sort((a, b) => b.p - a.p).slice(0, 30).map((x) => ({ name: nameOf(x.sc), t: String(x.t || '').slice(0, 40), p: x.p, g: x.g, life: x.life })) };
      const two = [...multi.values()].filter((v) => v.s.size >= 2);
      P.buy = { n10: n10.length, cheap: cheap.sort((a, b) => (b.min - b.p) - (a.min - a.p)).slice(0, 20), cheapN: cheap.length, together: two.length, togetherTop: two.sort((a, b) => b.s.size - a.s.size).slice(0, 20).map((v) => ({ t: String(v.t || '').slice(0, 40), shops: v.s.size })) };
      P.signal = { sameMoved: [...mvBy.values()].filter((s) => s.size >= 2).length, spreadMed: P.market.spreadMed, dnShare: movedA.length ? r1(P.moves.dn / movedA.length, 100) : null, cheapGone: soldNew.length + soldBase.length ? r1((soldNew.filter((x) => x.p < 3000).length + soldBase.filter((x) => x.p < 3000).length) / (soldNew.length + soldBase.length), 100) : null }; }
    /* ⑬ 행동 예측과 맞힘률 — 앞 보고의 '최저가 잃은 상품'이 이번에 실제로 내렸나 */ { const prev = (ctx.prevRep && ctx.prevRep.lowOffIds) || null; let tot = 0, hit = 0; if (prev) { const dnS = new Set(movedA.filter((x) => x.to < x.from).map((x) => x.sc + '_' + x.id)); for (const [sc, ids] of Object.entries(prev)) { if (!lastBy.has(sc)) continue; for (const id of ids) { tot++; if (dnS.has(sc + '_' + id)) hit++; } } }
      P.predict = { lowOff: lowOffA.length, byShop: Object.entries(cnt(lowOffA, (x) => nameOf(x.sc))).sort((a, b) => b[1] - a[1]).slice(0, 10), prevDay: ctx.prevRep ? ctx.prevRep.day || null : null, prevN: tot, prevHit: hit, hitRate: tot ? r1(hit / tot, 1000) : null, floor: Object.entries(cnt(movedA.filter((x) => x.to < x.from && x.to <= 500), (x) => `${nameOf(x.sc)} ${x.from}→${x.to}`)).sort((a, b) => b[1] - a[1]).slice(0, 5) };
      const lo = {}; lowOffA.forEach((x) => { (lo[x.sc] = lo[x.sc] || []).length < 500 && lo[x.sc].push(x.id); }); P.lowOffIds = lo; }
    /* ⑰ 우리와 겹침 — 우리 판매중 제목을 롤모델 지금 숍 목록과 맞춤(제목 앞 40자) · 우리가 롤모델 최저보다 20% 넘게 비싸면 '내릴 후보'(사람이 볼 목록 — 엔진이 값을 바꾸지 않음 · 약속 36) */ { if (OURS) { let ov = 0, hi = 0, hi20 = 0, lo = 0, same = 0; const hiL = []; const comp = []; for (const o of OURS) { const h = hh(nt(o.t)); const i = HX.get(h); if (i == null || !(+o.p > 0)) continue; const mn = m1[i] < BIG ? m1[i] : null; if (mn == null) continue; ov++; comp.push(pop(mask[i])); if (o.p > mn) { hi++; if (o.p > mn * 1.2) { hi20++; hiL.push({ t: String(o.t || '').slice(0, 40), p: +o.p, min: mn, shops: pop(mask[i]), gap: r1((o.p - mn) / mn, 100) }); } } else if (o.p < mn) lo++; else same++; }
        P.ours = { ok: true, n: OURS.length, overlap: ov, hi, hi20, lo, same, compMed: med(comp), top: hiL.sort((a, b) => (b.p - b.min) - (a.p - a.min)).slice(0, 30), how: '제목 앞 40자(띄어쓰기 뺌)로 맞춤 — 같은 책 다른 판(개정판·세트)이 섞일 수 있음 · ISBN이 채워지면 ISBN으로' }; } else P.ours = { ok: false, why: '우리 상품 목록을 못 읽음' };
      const isbnN = per.reduce((a, x) => a + x.isbn, 0), liveN = per.reduce((a, x) => a + x.live, 0); P.ours.isbnShare = liveN ? r1(isbnN / liveN, 1000) : 0; }
    /* (intel1 규칙 · 정범님 11/13) 못 읽은 판매자는 '0 팔림'이 아니라 '모름' — 팔림 셈에 넣지 않고 따로 적음 */ { const fullOk = new Set([...lastBy.values()].filter((v) => v.full !== false && v.complete !== false && !v.base).map((v) => String(v.sc))); const plan = (ctx.plan || []).map((x) => ({ sc: String(x.sc), name: String(x.name || x.sc).slice(0, 30) }));
      P.unknown = { notFull: [...lastBy.values()].filter((v) => !(v.full !== false && v.complete !== false)).map((v) => nameOf(String(v.sc))), first: [...lastBy.values()].filter((v) => v.base).map((v) => nameOf(String(v.sc))), light: [...lightBy.keys()].filter((sc) => !lastBy.has(sc)).map((sc) => nameOf(sc)), notRead: plan.filter((x) => !lastBy.has(x.sc) && !lightBy.has(x.sc)).map((x) => x.name), known: fullOk.size, mass: massL.map((m) => m.name) };
      P.sold.known = fullOk.size - massL.filter((m) => fullOk.has(m.sc)).length; P.sold.rule = '팔림은 숍 끝까지 읽은 숍만 셈 — 끝까지 못 읽은 숍·새 상품만 읽은 숍·안 읽은 숍·처음 읽은 숍은 0이 아니라 모름 · 대량 사라짐 숍은 따로'; }
    P.intel = ctx.intel || null;
    /* ⑲ 문제 */ { const pb = P.problems;
      for (const s of P.shops) if (!s.full) pb.push(`🎯 ${s.name}: 숍 전체 판정 안 남(덮은 비율 ${s.cover ?? '?'} · 못 본 상품 ${s.notRead.toLocaleString()}개) → 이번 회차 팔림·값 바뀜 셈 안 함`);
      for (const a of (P.anom && P.anom.list) || []) { if (a.anom && a.act === 'in' && !a.human) pb.push(`🧠 ${a.name}: ${a.line} — ${(a.why || []).find((w) => /^📏/.test(w)) || (a.why || [])[0] || ''}`); if (a.move) pb.push(`🧠 ${a.name}: 값 바뀜 ${a.move.line}`); }
      if (P.anom && P.anom.relistCut && P.anom.relistCut.n) pb.push(`🔁 다시 올리기로 본 새 상품 사라짐 ${P.anom.relistCut.n}개를 팔림에서 뺌(같은 제목이 7일 안 창에 새 번호로 올라옴) — ${Object.entries(P.anom.relistCut.by).map(([sc, n]) => `${nameOf(sc)} ${n}`).join(' · ')}`);
      for (const m of P.mass) pb.push(`📦 ${m.name}: 대량 사라짐 ${m.gone.toLocaleString()}개(숍의 ${Math.round(m.share * 100)}% · 하루 ${Math.round(m.perDay * 1000) / 10}%)${m.stillShare != null ? ` · 사라진 제목의 ${Math.round(m.stillShare * 100)}%가 숍에 아직 있음(다시 올리기 의심)` : ''} → 팔림 통계에서 뺌${m.pick ? `(🧠 ${m.pick})` : ''}`);
      const fp = P.round.first.reduce((a, x) => a + x.pages, 0); if (fp) pb.push(`🆕 처음 읽은 숍 ${P.round.first.length}곳(${P.round.first.map((x) => x.name).join('·')}) ${fp.toLocaleString()}쪽 — 비교 기준만 만들고 팔림은 다음 숍 전체 회차부터`);
      if ((P.unknown.notRead || []).length) pb.push(`❔ 오늘 안 읽은 판매자 ${P.unknown.notRead.length}곳(${P.unknown.notRead.slice(0, 8).join(', ')}${P.unknown.notRead.length > 8 ? ' …' : ''}) — 팔림 모름`);
      if (P.intel && P.intel.stale7) pb.push(`🕵 7일 넘게 숍 끝까지 못 읽은 판매자 ${P.intel.stale7}곳(정보 수집 방법 연구 지표)`); if (P.intel && P.intel.anomN) pb.push(`🕵 기준선 경보 ${P.intel.anomN}건 — ${(P.intel.anom || []).slice(0, 3).map((a) => `${a.name} ${a.kind} z=${a.z}`).join(' · ')}`);
      if (P.round.failed.length) pb.push(`⏸ 못 끝낸 판매자: ${P.round.failed.join(', ')}`);
      if (!(P.ours.isbnShare > 0)) pb.push('🔖 롤모델 숍 목록에 ISBN·분류가 없음(상품 페이지 정보 채우기 0) — 분야별 팔림·ISBN으로 우리와 맞추기 못 함(제목으로만)');
      const dt = P.round.detail; if (dt && dt.day === day && dt.stop) pb.push(`📖 상품 페이지 정보 읽기 멈춤 — ${dt.stop} (${(+dt.filled || 0).toLocaleString()}/${(+dt.tried || 0).toLocaleString()}개)`);
      if (P.data.runOutDay) pb.push(`📶 지금 속도면 쓰는 휴대폰 이달 남은 양이 ${P.data.runOutDay}쯤 바닥`); if (P.data.noNet && P.data.noNet.length) pb.push(`📵 인터넷이 안 되는 휴대폰: ${P.data.noNet.join(', ')}`); }
    return P; }
  return { shop, endShop, ours, done, massOf, IX, SC, lastBy, anomBy, anomOn: canJ };
}

/* 테더링 문서(prd_jobs/net_{날}) → 데이터 쓰임 요약 — 칸 이름이 판마다 조금씩 달라 있는 것만 씀 */
function netSum(doc, day) { const out = { tetherBytes: null, benchBytes: null, phones: [], noNet: [] }; try { const pcs = (doc && doc.pcs) || {}; const H = Object.values(pcs).map((p) => p && p.helper).filter(Boolean)[0]; if (!H) return out;
    const tb = +H.tether || +(H.today && H.today.tether) || null; out.tetherBytes = tb; const J = H.todayJobs || {}; let b = 0, any = false; for (const [k, v] of Object.entries(J)) if (/^bench/i.test(k)) { any = true; b += typeof v === 'number' ? v : +(v && (v.bytes ?? v.b)) || 0; } out.benchBytes = any ? b : null;
    const ph = Array.isArray(H.phones) ? H.phones : []; const now = Date.parse(day + 'T12:00:00+09:00'); const dim = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7), 0)).getUTCDate(); const daysLeft = Math.max(1, dim - +day.slice(8, 10));
    for (const p of ph) { if (p.connected === false && !(+p.used > 0)) continue; const used = +(p.used ?? p.monthUsed ?? p.devUsed) || 0; const capB = +(p.capBytes || (p.capGB ? p.capGB * 1073741824 : 0)) || null; const left = capB ? Math.max(0, capB - used) : null; const bad = !!(p.netBad || (p.inet && p.inet.ok === false) || p.noNet); out.phones.push({ name: String(p.name || p.label || '휴대폰').slice(0, 20), used, today: +p.today || 0, cap: capB, left, perDayLeft: left != null ? Math.round(left / daysLeft) : null, bad, act: !!(p.active || p.act), conn: p.connected !== false }); if (bad) out.noNet.push(String(p.name || '휴대폰').slice(0, 20)); }
    { const M = H.month || {}; out.monthTether = +M.tether || null; out.monthBench = M.jobs ? +M.jobs.bench || null : null; }
    const act = out.phones.filter((p) => p.left != null && !p.bad).sort((x, y) => y.today - x.today)[0] || out.phones.find((p) => p.act); if (act) out.mainPhone = act.name; if (act && act.left != null && tb) { const d = Math.floor(act.left / tb); out.runOutDay = d < daysLeft ? kday(now + d * 864e5) : null; out.runOutDays = d; } out.daysLeft = daysLeft; void now; } catch (e) { out.err = String(e && e.message || e).slice(0, 120); } return out; }

function makeBenchRep({ C, db, log, W }) {
  const REF = () => C('app_settings').doc('bench_report'); let busy = false;
  async function run(day, opt) { opt = opt || {}; if (busy) return { skip: 'busy' }; busy = true; const t0 = Date.now(); try {
    const D0 = Date.parse(day + 'T00:00:00+09:00'); const prevDay = kday(D0 - 864e5); const since = kday(D0 - 36 * 864e5); /* (anom1) 기준선 35일 */
    const [cfgS, forceS, netS, prevS] = await Promise.all([C('app_settings').doc('bench').get(), C('prd_jobs').doc('benchForce').get(), C('prd_jobs').doc('net_' + day).get(), C('app_settings').doc('bench_report_' + prevDay).get()]);
    const cfg = (cfgS.exists && cfgS.data()) || {}; const role = {}; for (const g of cfg.groups || []) for (const s of g.scs || []) role[String(s)] = /main/.test(String(g.id || '')) || /주요/.test(String(g.name || '')) ? 'main' : role[String(s)] || 'sub';
    /* 그날 회차 + 앞날 시작해 오늘 0시 뒤 끝난 회차 — 문서 하나씩(목록 칸 포함 · 문서마다 1MB 아래) */
    const ids = []; const q1 = await C('bench_days').where('day', '==', day).select('sc', 'at').get(); q1.forEach((d) => ids.push(d.id)); const q0 = await C('bench_days').where('day', '==', prevDay).select('sc', 'at', 'light').get(); q0.forEach((d) => { const v = d.data() || {}; if (!v.light && Date.parse(v.at || '') >= D0) ids.push(d.id); });
    const runs = []; let srcAt = ''; for (const id of ids) { const s = await C('bench_days').doc(id).get(); if (!s.exists) continue; const v = { ...(s.data() || {}), dayId: id }; delete v.html; runs.push(v); if (String(v.at || '') > srcAt) srcAt = String(v.at || ''); }
    if (!runs.length) return { skip: 'noRuns', day };
    const F = ['sc', 'name', 'day', 'dayId', 'light', 'partial', 'full', 'complete', 'base', 'gone', 'goneNew', 'add', 'spanDays', 'runAt', 'at', 'newN', 'total', 'missOnce', 'missBack', 'moved', 'cover', 'notRead', 'runLastPage', 'excl', 'exclBy', 'exclAt', 'massGone', 'anom']; /* (anom1) 🧠 기준선·두 번 확인 간격·사람 되먹임 재료 */
    const hq = await C('bench_days').where('day', '>=', since).select(...F).get(); const hist = []; hq.forEach((d) => hist.push({ ...(d.data() || {}), dayId: d.id }));
    const F0 = (forceS.exists && forceS.data()) || {}; const force = { startedAt: F0.startedAt || null, resumeOf: F0.resumeOf || null, doneAt: F0.doneAt || null, done: !!F0.done, failed: F0.failed || [], detail: F0.detail || null };
    const net = netSum(netS.exists ? netS.data() : null, day);
    const plan = (cfg.targets || []).filter((t) => t && t.sc && t.on !== false).map((t) => ({ sc: String(t.sc), name: t.name || String(t.sc) })); const offS = new Set(); for (const g of cfg.groups || []) if (g.off) (g.scs || []).forEach((x) => offS.add(String(x)));
    /* 🕵 정보 수집 방법 연구 회차 지표(intel1 · cloud/intel.js가 6시간마다 셈) — 같은 셈을 두 번 하지 않고 그 문서를 붙임 */ let intel = null; try { const a = await C('research_intel_days').doc(day).get(); intel = a.exists ? (a.data() || {}).m || null : null; if (!intel) { const mt = (await C('app_settings').doc('research_intel_meta').get()).data() || {}; if (mt.latest && mt.latest.day === day) intel = mt.latest.m || null; } if (intel) intel = { ...intel, src: 'research_intel_days/' + day }; } catch (e) { intel = null; }
    /* 🧠 스스로 채점하고 배움(정범님 11/13 12:16 — 사람을 표본으로 삼지 않음) — 앞서 사건으로 판정한 회차마다, 그 뒤 숍 전체 회차의 상품 수·사라짐 흐름으로 맞음/틀림을 매김
     *  사람의 '↩ 다시 넣기'·'📉 빼기'는 통계 처리만 바꾸고 배움에는 안 씀(기록만) · 채점 결과는 그 회차 문서 anom.chk와 app_settings/anom_learn에 */
    let learnSt = null; let learnCh = 0; const chkW = []; if (AN) { try { const ls = await C('app_settings').doc('anom_learn').get(); learnSt = (ls.exists && ls.data()) || AN.learnInit();
        const allR = [...hist, ...runs].filter((x) => x && x.sc).sort((a, b) => String(a.runAt || a.at || '').localeCompare(String(b.runAt || b.at || ''))); const outs = [];
        for (const x of allR) { const a = x.anom; if (!a || !a.anom || !a.f || (a.chk && a.chk.ok != null)) continue; const later = allR.filter((y) => String(y.sc) === String(x.sc) && String(y.runAt || y.at || '') > String(x.runAt || x.at || '') && y.dayId !== x.dayId);
          const c = AN.verify('bench', a, later); if (!c || c.ok == null) continue; outs.push({ id: x.dayId, dom: 'bench', key: String(x.sc), pickId: a.pick && a.pick.id, pickName: a.pick && a.pick.name, act: a.act, ok: c.ok, why: c.why, at: new Date().toISOString() }); chkW.push([x.dayId, { ok: c.ok, why: c.why, at: new Date().toISOString() }]); }
        const L = AN.learn(learnSt, outs); learnSt = L.learn; learnCh = L.changed;
        if (!opt.dry) { if (learnCh) await C('app_settings').doc('anom_learn').set(JSON.parse(JSON.stringify(learnSt))); for (const [id, c] of chkW) await C('bench_days').doc(id).set({ anom: { chk: c } }, { merge: true }).catch(() => {}); } } catch (e) { log('🧠 이상 판단 채점 실패', e.message); } }
    const acc = makeAcc({ day, runs, hist, learn: learnSt, role, force, net, intel, plan: plan.filter((x) => !offS.has(x.sc)), prevRep: prevS.exists ? prevS.data() : null });
    /* 숍 목록 조각 — 한 조각씩 읽어 셈에 넣고 버림 */
    let chunks = 0; const scs = [...new Set(runs.map((v) => String(v.sc)))]; for (const sc of scs) { const st = (await C('bench_state').doc(sc).get()).data() || {}; const nC = +st.chunks || 0; for (let k = 0; k < nC; k++) { const c = (await C('bench_state').doc(sc).collection('c').doc(String(k)).get()).data(); let M = c && c.m; if (c && c.s) { try { M = JSON.parse(c.s); } catch (e) { M = null; } } if (M) acc.shop(sc, M); chunks++; M = null; } acc.endShop(sc); }
    try { const oq = await C('prd_listings').where('status', '==', '판매중').select('title', 'price').get(); const L = []; oq.forEach((d) => { const v = d.data() || {}; if (v.title && +v.price > 0) L.push({ t: v.title, p: +v.price }); }); acc.ours(L); } catch (e) { log('🎯 회차 보고: 우리 상품 못 읽음', e.message); }
    const P = acc.done(); const rep = { day, at: new Date().toISOString(), srcAt, ver: 1, by: 'cloud', runs: runs.length, chunks, ms: Date.now() - t0, ...P };
    /* 📦 대량 사라짐 표시가 없는 회차에 표시(수집기 새 판 전 회차 · 11/13 어린왕자·소득공제가능서점) — 사람이 '↩ 다시 넣기'(excl:false)한 회차는 안 건드림 */
    let marked = 0, judged = 0; if (!opt.dry) for (const v of runs) {
      const J = acc.anomBy && acc.anomBy.get(v.dayId);
      if (J && J.r && !J.r.skip) { /* 🧠 엔진 판정을 회차 문서에 적음 — massGone은 엔진 판정을 따름(사람이 고른 회차는 판정만 적고 빼기/넣기는 그대로) · 판정이 같으면 안 씀 */
        const r = J.r; const a = { v: r.v, act: r.act, anom: !!r.anom, pick: r.pick ? { id: r.pick.id, name: r.pick.name, conf: r.pick.conf } : null, why: (r.why || []).slice(0, 9), win: r.f ? r.f.win : null, ...(r.anom && r.f ? { f: { g: r.f.g, add: r.f.add, total: r.f.total, totP: r.f.totP || null, win: r.f.win, rGone: r.f.rGone } } : {}), z: (r.metrics || []).map((m) => [m.k, m.x, m.med, m.z]), at: new Date().toISOString(), ...(J.m && J.m.anom ? { move: AN.line(J.m) } : {}) };
        const old0 = v.anom || {}; const same = old0.v === a.v && old0.act === a.act && (old0.pick || {}).id === (a.pick || {}).id; const hs = humanSet(v); const mg = a.act !== 'in';
        if (same && (hs || !!v.massGone === mg)) continue;
        await C('bench_days').doc(v.dayId).set({ anom: a, ...(hs ? {} : { massGone: mg, ...(mg && !v.mass ? { mass: { on: true, gone: +v.gone || 0, by: 'anom', why: a.pick ? a.pick.name : '모름' } } : {}) }), ...(W ? W() : {}) }, { merge: true }).catch(() => {}); judged++; if (mg && !v.massGone) marked++; continue; }
      if (acc.anomOn || v.massGone || v.excl === false || v.massChk) continue; const m = massOf(v); if (!m) continue; await C('bench_days').doc(v.dayId).set({ massGone: true, mass: m, ...(W ? W() : {}) }, { merge: true }).catch(() => {}); marked++; }
    rep.massMarked = marked; rep.anomJudged = judged; rep.anomLearn = learnCh; rep.anomChk = chkW.length;
    if (!opt.dry) { await C('app_settings').doc('bench_report_' + day).set(rep); await REF().set(rep); }
    log(`🎯 회차 보고 ${day}: 회차 ${runs.length} · 조각 ${chunks} · 팔림 ${P.sold.n} · ${Math.round((Date.now() - t0) / 1000)}초${marked ? ` · 대량 사라짐 표시 ${marked}` : ''}`);
    return rep; } finally { busy = false; } }
  /* 한 시간마다: 오늘 바퀴가 끝났고(benchForce.done) 오늘 보고가 없거나, 보고 뒤 새 회차가 끝났으면(2시간 넘게 지남) 다시 셈 */
  async function tick() { try { const f = (await C('prd_jobs').doc('benchForce').get()).data() || {}; if (!f.done || !f.doneAt) return { skip: 'notDone' }; const day = kday(Date.parse(f.doneAt)); const r = (await REF().get()).data() || {};
      if (r.day === day) { if (Date.now() - Date.parse(r.at || 0) < 2 * 3600e3) return { skip: 'fresh' }; const q = await C('bench_days').where('day', '==', day).select('at').get(); let mx = ''; q.forEach((d) => { const a = String((d.data() || {}).at || ''); if (a > mx) mx = a; }); if (mx <= String(r.srcAt || '')) return { skip: 'same' }; }
      return await run(day); } catch (e) { log('🎯 회차 보고 실패', e.message); return { err: e.message }; } }
  return { run, tick, makeAcc, massOf, netSum };
}
module.exports = { makeBenchRep, makeAcc, massOf, netSum, BENCH_MASS, AN };
