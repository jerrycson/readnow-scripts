/* 🕵 정보 수집 방법 연구 — 클라우드 셈·받기 (intel1 · 정범님 11/13 「최상위 정보기관·대기업이 정보를 모으는 방식을 웹앱에 기록·연구 페이지 · 계속 쌓고 다른 연구와 이어 배우기」)
 *  자리(공개 저장소엔 이 코드만 — 연구 글은 Firestore·비공개 저장소 readnow-chats/research/INTEL에만):
 *    app_settings/research_intel       { j(조직·항목·연계 전부 · JSON 글), at, by, nOrg, nItem, nDoc } — /kp-in 암호문의 intel:{…}로만 씀(리드·일꾼 src/tools/intel.sh)
 *    app_settings/research_intel_meta  { at, latest:{ day, m }, hist:[{ day, m }] 최근 60회차, ver } — 웹앱 🕵 화면은 이 두 문서만 읽음(읽기 2번)
 *    research_intel_days/{YYYY-MM-DD}  { day, at, m } — 회차(날)마다 지표를 쌓음(지우지 않음 · 같은 날은 고쳐 씀)
 *  셈 재료 = 이미 모은 것만: 🎯 집중 벤치마킹 회차 요약 bench_days(숫자 칸만 select · 최근 35일) · 판매자 상태 bench_state(select)
 *    알라딘을 새로 읽지 않고 PC(로거·사무실)에 일을 주지 않음(약속 0 — 로거와 엮이는 일 없음) · 값·판매 상태를 바꾸지 않음(약속 36)
 *  지표(m) 이름 = 연구 항목(I01~I60)의 '지금 데이터' 칸이 가리키는 열쇠 — 웹앱이 항목 표에 그대로 꽂음 */
'use strict';
const KST = (t) => new Date((t == null ? Date.now() : t) + 9 * 3600e3).toISOString().slice(0, 10);
const addDay = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const med = (a) => { const b = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const r3 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
const PAGE_MB = 0.575; /* 근거: 발견 f_261104_page_cost — 테더링 집중 벤치마킹 한 쪽(50개) 약 0.55~0.6MB */
/* 순수 셈 — days: bench_days 문서들(최근 35일) · state: bench_state 문서들 · day: 셈할 날(KST) · H: { runUse, goneEff } (클라우드 index.js의 benchRunUse·benchGoneEff) */
function intelCalc(days, state, day, H) {
  const runUse = (H && H.runUse) || ((v) => !!v && !v.base && v.complete !== false && v.full !== false && +v.spanDays > 0 && v.excl !== true);
  const goneEff = (H && H.goneEff) || ((v) => (v ? v.gone : null));
  const now = Date.parse(day + 'T23:59:59+09:00');
  const plan = (state || []).filter((s) => s && !s.off && !s.skip); const planN = plan.length;
  const today = (days || []).filter((v) => v && v.day === day); const scs = new Set(today.map((v) => String(v.sc)));
  const full = today.filter((v) => v.complete === true && v.full !== false && !v.partial && !v.light); const light = today.filter((v) => v.light); const part = today.filter((v) => v.partial || v.complete === false);
  const pages = today.reduce((t, v) => t + (+v.pages || 0), 0); const seen = today.reduce((t, v) => t + (+v.seen || 0), 0); const newN = today.reduce((t, v) => t + (+v.newN || 0), 0);
  const use = today.filter(runUse); const gone = use.reduce((t, v) => t + (+goneEff(v) || 0), 0); const total = use.reduce((t, v) => t + (+v.total || 0), 0); const low = use.reduce((t, v) => t + (+v.lowNow || 0), 0);
  const cut = today.reduce((t, v) => t + (+v.resumes || 0) + (v.anchorLost ? 1 : 0), 0);
  const pcs = {}; today.forEach((v) => { const p = String(v.pc || '?'); pcs[p] = (pcs[p] || 0) + 1; });
  /* 신선도 — 판매자마다 마지막으로 숍 끝까지 읽은 때(bench_state.endAt · complete)부터 며칠 */
  const age = plan.map((s) => { const t = Date.parse((s.complete && (s.endAt || s.runAt)) || ''); return Number.isFinite(t) ? (now - t) / 864e5 : null; });
  const ageOk = age.filter((x) => x != null && x >= 0); const stale7 = age.filter((x) => x == null || x > 7).length; const stale14 = age.filter((x) => x == null || x > 14).length;
  /* 출처 등급(Admiralty 꼴) — A 숍 끝까지(비교 기준) · B 끝까지 읽었으나 비교 밖(첫 바퀴·뺌) · C 새로 올라온 것만 · D 중간에 멈춤 */
  const gA = today.filter((v) => runUse(v)).length; const gC = light.length; const gD = today.filter((v) => !v.light && (v.partial || v.complete === false)).length; const gB = Math.max(0, today.length - gA - gC - gD);
  /* 기준선·변화(I&W) — 판매자마다 하루 판매율(사라짐 ÷ 기간 ÷ 전체)을 앞 회차들의 가운데 값·MAD와 견줌 · 새 등록(light newN)도 같은 셈 */
  const bySc = new Map(); (days || []).forEach((v) => { if (!v || v.day > day) return; const k = String(v.sc); if (!bySc.has(k)) bySc.set(k, []); bySc.get(k).push(v); });
  const anom = []; const dow = [0, 0, 0, 0, 0, 0, 0]; const dowN = [0, 0, 0, 0, 0, 0, 0]; let base = 0;
  for (const [sc, L] of bySc) {
    L.sort((a, b) => (a.day < b.day ? -1 : 1));
    const rate = (v) => (runUse(v) && +v.total > 0 && goneEff(v) != null ? +goneEff(v) / +v.spanDays / +v.total : null);
    const reg = (v) => (v.light && +v.total > 0 && v.newN != null ? +v.newN / +v.total : null);
    for (const v of L) { const r = rate(v); if (r != null) { const w = new Date(Date.parse(v.day + 'T00:00:00Z')).getUTCDay(); dow[w] += r; dowN[w]++; } if (v.base) base++; }
    const cur = L.filter((v) => v.day === day); if (!cur.length) continue;
    for (const [kind, f] of [['판매율', rate], ['새 등록', reg]]) {
      const x = cur.map(f).find((y) => y != null); if (x == null) continue; const prev = L.filter((v) => v.day < day).map(f).filter((y) => y != null); if (prev.length < 4) continue;
      const m0 = med(prev); const mad = med(prev.map((y) => Math.abs(y - m0))) || 0; const sd = mad * 1.4826; const z = sd > 0 ? (x - m0) / sd : x > m0 * 2 && m0 > 0 ? 9 : 0;
      if (Math.abs(z) >= 3) anom.push({ sc, name: String((cur[0] && cur[0].name) || sc).slice(0, 24), kind, z: Math.round(z * 10) / 10, x: r3(x * 100), base: r3(m0 * 100), n: prev.length });
    }
  }
  anom.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const span = med(today.filter(runUse).map((v) => +v.spanDays));
  const m = {
    day, planN, readN: scs.size, cov: planN ? r3(scs.size / planN) : null, fullN: full.length, lightN: light.length, partN: part.length, done: today.length ? r3(full.length / today.length) : null,
    useN: use.length, fresh: ageOk.length ? Math.round(med(ageOk) * 10) / 10 : null, stale7, stale14, pages, mb: Math.round(pages * PAGE_MB * 10) / 10, seen, newN, gone,
    gpp: pages ? r3(gone / pages * 100) : null, mbPerGone: gone ? r3(pages * PAGE_MB / gone) : null, cut, pcs, pcN: Object.keys(pcs).length, lowShare: total ? r3(low / total) : null,
    gA, gB, gC, gD, aShare: today.length ? r3(gA / today.length) : null, anomN: anom.length, anom: anom.slice(0, 8), span, baseRuns: base,
    dow: dow.map((t, i) => (dowN[i] ? r3(t / dowN[i] * 100) : null)), win: 35,
  };
  return m;
}
function makeIntel({ C, FV, log, W, H }) {
  const META = () => C('app_settings').doc('research_intel_meta');
  async function load(day) {
    const since = addDay(day, -35); const F = ['sc', 'name', 'day', 'base', 'complete', 'full', 'light', 'partial', 'newN', 'total', 'seen', 'gone', 'goneLow', 'lowNow', 'pages', 'pc', 'resumes', 'anchorLost', 'spanDays', 'excl', 'edit', 'fill'];
    const qs = await C('bench_days').where('day', '>=', since).select(...F).get(); const days = []; qs.forEach((d) => days.push(d.data() || {}));
    const ss = await C('bench_state').select('name', 'complete', 'runAt', 'endAt', 'skip', 'off').get(); const state = []; ss.forEach((d) => state.push({ id: d.id, ...(d.data() || {}) }));
    return { days, state };
  }
  /* 회차 지표 셈 → research_intel_days/{날} + 요약(meta) — dry면 셈만(진단) · 오늘·어제 두 날(밤 0시 회차가 이튿날까지 이어 읽음) */
  async function tick(o) {
    o = o || {}; const today = KST(); const want = o.day && /^\d{4}-\d{2}-\d{2}$/.test(o.day) ? [o.day] : [addDay(today, -1), today];
    const { days, state } = await load(want[want.length - 1]); const out = {};
    for (const d of want) out[d] = intelCalc(days, state, d, H);
    if (o.dry) return { dry: true, m: out, nDays: days.length, nState: state.length };
    const at = new Date().toISOString(); for (const d of want) await C('research_intel_days').doc(d).set({ day: d, at, m: out[d], ...W() }, { merge: false });
    let prev = {}; try { prev = (await META().get()).data() || {}; } catch (e) {}
    const H0 = (Array.isArray(prev.hist) ? prev.hist : []).filter((x) => x && !want.includes(x.day)); for (const d of want) { const { anom, pcs, dow, ...slim } = out[d]; H0.push({ day: d, m: { ...slim, anom: (anom || []).slice(0, 3) } }); }
    H0.sort((a, b) => (a.day < b.day ? -1 : 1)); const hist = H0.slice(-60); const last = want[want.length - 1];
    await META().set({ at, latest: { day: last, m: out[last] }, hist, ver: 1, ...W() }, { merge: false });
    log('🕵 정보 수집 방법 연구 지표', last, `판매자 ${out[last].readN}/${out[last].planN} · 끝까지 ${out[last].fullN} · 경보 ${out[last].anomN}`); return { n: want.length, last, m: out[last] };
  }
  /* /kp-in intel:{ orgs, items, links, … } — 조직·항목 글을 통째로 바꿔 씀(이전 판은 research_intel_hist/{시각}에 남김 · 지우지 않음) */
  async function put(J, by) {
    if (!J || typeof J !== 'object' || !Array.isArray(J.orgs) || !Array.isArray(J.items)) return { ok: false, err: 'orgs·items 없음' };
    const j = JSON.stringify(J); if (j.length > 900000) return { ok: false, err: '너무 큼 ' + j.length };
    if (/01[016789][- ]?\d{3,4}[- ]?\d{4}/.test(j.replace(/010-0000-0000/g, ''))) return { ok: false, err: '휴대전화 번호 꼴' };
    const ref = C('app_settings').doc('research_intel'); const old = (await ref.get()).data();
    if (old && old.j) await C('research_intel_hist').doc(String(old.at || new Date().toISOString()).replace(/[^0-9TZ]/g, '')).set({ j: old.j, at: old.at || null, by: old.by || null }).catch(() => {});
    const nDoc = J.orgs.reduce((t, x) => t + ((x && x.docs) || []).length, 0);
    await ref.set({ j, at: new Date().toISOString(), by: String(by || 'claude').slice(0, 40), nOrg: J.orgs.length, nItem: J.items.length, nDoc, ...W() }, { merge: false });
    return { ok: true, nOrg: J.orgs.length, nItem: J.items.length, nDoc, bytes: j.length };
  }
  return { tick, put, calc: intelCalc };
}
module.exports = { makeIntel, intelCalc, KST };
