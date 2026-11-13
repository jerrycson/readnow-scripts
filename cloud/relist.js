/* 🔁 다시 올리기 목적 — 클라우드 쪽 (일꾼 anom2 · 정범님 11/13 14:03 「판매자들이 판매가 아닌 사라짐을 일부러 하는 이유도 엔진이 알아내게 · 어떤 목적으로 왜」)
 *  셈 본체는 공용 readnow-relist-core.js(순수 함수 · 이미지 안 사본 cores_) — 여기서는 읽기·쓰기만
 *  회차 보고(cloud/benchrep.js run)가 숍마다 부름: prep(숍) → 숍 목록 조각마다 feed(숍, 조각) → finish() = 보고 칸 P.relist
 *  재료(이미 모은 것 · 다른 판매자의 공개 숍 정보만 · 손님 정보 없음 · 값을 바꾸거나 돈 드는 일 없음 — 헌장 제33조):
 *    bench_days 회차 문서의 사라짐 줄·새로 올림 줄(새 회차와 그 앞 회차만 · 처음 한 번은 35일 거슬러) · 지금 숍 목록(우연 몫·옛 상품 수)
 *  저장: bench_relist/{숍} — 회차마다 숫자(runs) · 다시 올린 무리와 대조군 번호(coh — 뒤 회차 사라짐으로 팔림 속도) · 판정 기록과 채점(jh)
 *        app_settings/relist_learn — 스스로 채점으로 고친 가설 무게(사람 판단은 쓰지 않음 · 사실 F32) */
'use strict';
const RL = (() => { for (const f of ['./cores_readnow-relist-core.js', '../readnow-relist-core.js']) { try { return require(f); } catch (e) {} } return null; })();
const KEEP = 36; /* 일 — 판정 창 35일 */

function makeRelist({ C, log }) {
  if (!RL) return null;
  function begin({ day, dry, hist, now }) {
    const D = RL.dN(day); const shops = new Map(); let learnSt = null; let learnLoaded = false;
    const nowIso = now || new Date().toISOString();
    async function loadLearn() { if (learnLoaded) return; learnLoaded = true; try { const s = await C('app_settings').doc('relist_learn').get(); learnSt = (s.exists && s.data()) || RL.learnInit(); } catch (e) { learnSt = RL.learnInit(); } }
    async function getDoc(id) { try { const s = await C('bench_days').doc(id).get(); if (!s.exists) return null; const v = s.data() || {}; return { goneList: v.goneList || [], addList: v.addList || [] }; } catch (e) { return null; } }
    async function prep(sc) {
      sc = String(sc); await loadLearn();
      let st = null; try { const s = await C('bench_relist').doc(sc).get(); st = s.exists ? s.data() || null : null; } catch (e) { st = null; }
      if (!st || st.v == null) st = { v: RL.VERSION, sc, runs: {}, coh: {}, jh: [], baseLive: 0 };
      st.runs = st.runs || {}; st.coh = st.coh || {}; st.jh = st.jh || [];
      const H = (hist || []).filter((x) => x && String(x.sc) === sc && !x.light && !x.partial && x.complete !== false).sort((a, b) => String(a.runAt || a.at || '').localeCompare(String(b.runAt || b.at || '')));
      const S = { sc, st, pend: [], live: 0, name: null, newRuns: 0, err: null }; shops.set(sc, S);
      const cache = new Map(); const dget = async (id) => { if (cache.has(id)) return cache.get(id); const d = await getDoc(id); cache.set(id, d); if (cache.size > 3) cache.delete(cache.keys().next().value); return d; };
      for (let i = 1; i < H.length; i++) { const v = H[i]; const p = H[i - 1]; const p2 = H[i - 2] || null; if (v.base || v.full === false || st.runs[v.dayId]) continue; if (D != null && RL.dN(v.day) != null && D - RL.dN(v.day) > KEEP) continue;
        try { const dv = await dget(v.dayId); const dp = p.base ? null : await dget(p.dayId); if (!dv) continue; if (v.name) S.name = String(v.name).slice(0, 30);
          const A = []; if (dp) for (const r of RL.rows(dp.addList)) A.push({ j: 0, d: p.day, r }); for (const r of RL.rows(dv.addList)) A.push({ j: 1, d: v.day, r });
          const g = +v.gone || 0; const moP = +p.missOnce || 0; const twoStep = p.full !== false && moP > 0 && Math.abs(g - moP) <= Math.max(30, 0.35 * moP); const win = twoStep && +p.spanDays > 0 ? +p.spanDays : +v.spanDays > 0 ? +v.spanDays : 1;
          const td = !!(v.anom && v.anom.pick && /^(takedown|close)$/.test(String(v.anom.pick.id || '')));
          const rs = RL.runStat(dv.goneList, A, { day: v.day, prevDay: p.day, win, mo: moP, mb: +v.missBack || 0, td });
          /* 앞서 다시 올린 무리 · 대조군의 운명 — 이번 사라짐 줄 */
          const gIds = new Set(RL.rows(dv.goneList).map((x) => String(x[0]))); for (const co of Object.values(st.coh)) if (String(co.d) < String(v.day)) RL.fate(co, gIds, v.day, rs.T);
          st.runs[v.dayId] = rs.R; st.coh[v.dayId] = { d: String(v.day).slice(0, 10), y: rs.y, c: rs.c, yE: { ev: 0, t: 0, re: 0 }, cE: { ev: 0, t: 0, re: 0 } };
          S.pend.push({ R: rs.R, a: RL.dN((p2 || p).day), T: rs.T, o: 0, oh: 0 }); S.newRuns++;
        } catch (e) { S.err = String((e && e.message) || e).slice(0, 120); } }
      if (!S.name) { const v = H[H.length - 1]; S.name = v ? String(v.name || sc).slice(0, 30) : sc; }
      return S.newRuns;
    }
    /* 지금 숍 목록 조각 — 우연 몫(창 앞부터 있던 안 사라진 상품의 제목이 같은 창 새로 올림에 있는 몫 · 상품 수 무게) · 옛 상품('처음부터 있던 것') 수 */
    function feed(sc, M) { const S = shops.get(String(sc)); if (!S) return; const P = S.pend;
      for (const v of Object.values(M || {})) { if (!Array.isArray(v) || v[6]) continue; if (v[3]) S.live++; if (!P.length || !v[4]) continue; const fs = RL.dN(v[1]); if (fs == null) continue; const h = RL.th(v[4]);
        for (const q of P) if (q.a != null && fs < q.a) { q.o++; if (q.T.has(h)) q.oh++; } } }
    async function finish() {
      const list = []; const outs = []; const writes = [];
      for (const S of shops.values()) { const st = S.st;
        for (const q of S.pend) { q.R.chO = q.o; q.R.chH = q.oh; q.R.ch = q.o >= 50 ? Math.round(q.R.n * (q.oh / q.o) * 10) / 10 : null; q.T = null; }
        if (S.live > 0) st.baseLive = S.live;
        /* 35일 밖은 걷음(숫자만 · 회차 문서는 그대로) */
        for (const [id, R] of Object.entries(st.runs)) if (D != null && D - RL.dN(R.d) > KEEP) delete st.runs[id];
        for (const [id, co] of Object.entries(st.coh)) if (D != null && D - RL.dN(co.d) > KEEP) delete st.coh[id];
        const runsL = Object.values(st.runs); if (!runsL.length) continue; const cohL = Object.values(st.coh);
        const latest = runsL.map((r) => r.d).sort().pop();
        /* 처음 한 번(판정 기록 없음): 되돌려 판정 — 지난 회차들을 7일 간격으로 끊어 '그때까지 회차만'으로 판정하고(습관·주된 목적 예측만 · 효과는 뒤 운명이 섞이므로 안 함) 바로 아래에서 그 뒤 회차로 채점 → 첫날부터 스스로 채점·배움 */
        if (!st.jh.length && runsL.length >= 4) { const ds = [...new Set(runsL.map((r) => r.d))].sort(); const cuts = []; let nx = RL.dN(ds[0]) + 7; for (const d of ds) { const n = RL.dN(d); if (n >= nx && ds.filter((x) => x > d).length >= 2) { cuts.push(d); nx = n + 7; } }
          for (const cut of cuts) { const J0 = RL.judge(RL.agg(runsL.filter((r) => r.d <= cut), st.baseLive), null, learnSt, { sc: S.sc }); st.jh.unshift({ at: `되돌려:${cut}`, bt: true, last: cut, habit: J0.habit, share: J0.share, main: J0.main, eff: null, preds: J0.preds.filter((x) => x.k !== 'eff') }); } }
        /* 스스로 채점 — 앞 판정의 예측을 그 뒤 회차들로 */
        for (const rec of st.jh) { if (!rec || !rec.last || rec.last >= latest || (rec.chk && rec.chk.done)) continue; const Rn = runsL.filter((r) => r.d > rec.last); const Cn = cohL.filter((c) => c.d > rec.last);
          const vs = RL.verify(rec, RL.agg(Rn, st.baseLive), RL.haz(Cn, day), learnSt); const got = vs.filter((x) => x.ok != null); rec.chk = { at: nowIso, done: vs.length > 0 && got.length === vs.length, r: vs };
          for (const x of got) outs.push({ ...x, key: `${S.sc}|${rec.at}`, sc: S.sc, name: S.name, at: nowIso }); }
        if (outs.length) { const L = RL.learn(learnSt, outs.splice(0)); learnSt = L.learn; S.learnCh = L.changed; }
        const J = RL.judge(RL.agg(runsL, st.baseLive), RL.haz(cohL, day), learnSt, { sc: S.sc, name: S.name, now: nowIso });
        const lastJ = st.jh[0]; if (!lastJ || lastJ.last !== J.last) st.jh.unshift({ at: nowIso, last: J.last, habit: J.habit, share: J.share, main: J.main, eff: J.eff ? J.eff.v : null, preds: J.preds });
        st.jh = st.jh.slice(0, 12); st.v = RL.VERSION; st.at = nowIso; st.name = S.name;
        /* 문서 크기 — 1MB 아래(오래된 무리부터 대조군 번호를 줄임) */
        let sz = JSON.stringify(st).length; if (sz > 850000) { for (const co of Object.values(st.coh).sort((a, b) => String(a.d).localeCompare(String(b.d)))) { co.y = co.y.slice(0, 60); co.c = co.c.slice(0, 60); sz = JSON.stringify(st).length; if (sz <= 850000) break; } }
        writes.push([S.sc, st]);
        const chk = st.jh.filter((r) => r.chk && (r.chk.r || []).some((x) => x.ok != null)).slice(0, 3).map((r) => ({ at: r.at, last: r.last, r: r.chk.r.filter((x) => x.ok != null) }));
        list.push({ sc: S.sc, name: S.name, habit: J.habit, share: J.share, excess: J.excess, pairs: J.pairs, chance: J.chance, purity: J.purity, n: J.n, runs: J.runs, from: J.from, to: J.to, main: J.main, also: J.also, hyps: J.hyps, line: J.line, why: J.why,
          eff: J.eff ? { v: J.eff.v, line: J.eff.line, y: J.eff.y, c: J.eff.c, old: J.eff.old, rOld: J.eff.rOld, rNew: J.eff.rNew } : null, newRuns: S.newRuns, err: S.err, chk }); }
      if (!dry) { for (const [sc, st] of writes) await C('bench_relist').doc(sc).set(JSON.parse(JSON.stringify(st))).catch((e) => log && log('🔁 다시 올리기 저장 실패', sc, e.message)); if (learnSt && [...shops.values()].some((s) => s.learnCh)) await C('app_settings').doc('relist_learn').set(JSON.parse(JSON.stringify(learnSt))).catch(() => {}); }
      const rank = { strong: 0, some: 1, none: 2, few: 3 }; list.sort((a, b) => (rank[a.habit] - rank[b.habit]) || (b.share || 0) - (a.share || 0));
      return { v: RL.VERSION, list, learn: learnSt ? { n: learnSt.n || null, bias: learnSt.bias || {}, habitCut: learnSt.habitCut, log: (learnSt.log || []).slice(0, 5) } : null,
        rule: '사라진 상품(X)과 같은 제목이 같은 창(앞 회차·이번 회차)에 새 번호로 올라온 것(Y)을 짝 지어, 우연 몫(안 사라진 옛 상품도 같은 창에 한 권 더 올라오는 몫)을 빼고 넘친 몫을 다시 올리기로 봄 · 짝의 앞뒤(값·등급·최저가 표시·나이·정가 대비)로 목적 가설 여덟에 점수 · 다시 올린 Y가 그 뒤 하루에 사라지는 몫을 그대로 둔 옛 상품·같은 창 새 상품과 견줘 효과 · 판정 때 남긴 예측(습관·주된 목적·효과)을 뒤 회차로 스스로 채점해 가설 무게를 고침(사람 판단은 안 씀) · 값을 바꾸거나 돈 드는 실험 없음' };
    }
    return { prep, feed, finish };
  }
  return { begin };
}
module.exports = { makeRelist, RL };
