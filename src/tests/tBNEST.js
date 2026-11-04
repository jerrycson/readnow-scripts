// tBNEST — 정범님 11/05: 🎯 집중 벤치마킹 판매자 상세 — 앞 회차와 3일 이상 떨어진 회차는 '그간 일평균' · 읽지 않은 날마다 흐린 추정 줄(사라짐·판매가만) · 그래프에 추정 표시 · 합계는 실제 값만 · 설정으로 바꿈 · 360px
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('/home/user/w/pw/harness.js')(async (p) => { await p.evaluate(require('/home/user/w/pw/seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const ref = db.collection('app_settings').doc('bench'); await ref.set({ seed190: true, mig1105: true, targets: [{ sc: '111', name: '판매자일', on: true }], groups: [] });
    const run = (day, hh, o) => ({ sc: '111', day, runAt: `${day}T${hh}:05:00+09:00`, strict: 1, complete: true, cover: 1, pages: 10, runLastPage: 10, total: 100, ...o });
    const docs = {
      a: run('2026-10-20', '00', { base: true }),
      b: run('2026-10-21', '00', { add: 4, gone: 5, sumGone: 50000, sumAdd: 40000, spanDays: 1, missOnce: 1 }),
      c: run('2026-10-22', '00', { add: 2, gone: 3, sumGone: 30000, sumAdd: 20000, spanDays: 1, missOnce: 0 }),
      d: run('2026-10-24', '00', { add: 3, gone: 4, sumGone: 40000, sumAdd: 30000, spanDays: 2, missOnce: 0 }), // 2일 — 3일 미만이면 그대로
      e: { sc: '111', day: '2026-10-27', runAt: '2026-10-27T00:05:00+09:00', strict: 1, partial: true, complete: false, light: true, newN: 2, pages: 1, runLastPage: 10, total: 100 }, // 새 것만 읽은 날(무효 회차)
      f: run('2026-10-31', '00', { add: 7, gone: 14, sumGone: 140000, sumAdd: 70000, spanDays: 7, missOnce: 2 }), // 7일 — 일평균 2권 · 20,000원
      g: run('2026-11-01', '00', { add: 1, gone: 0, sumGone: 0, sumAdd: 10000, spanDays: 1, missOnce: 0 }),
      h: run('2026-11-05', '00', { add: 0, gone: 0, sumGone: 0, sumAdd: 0, spanDays: 4, missOnce: 0 }), // 휴일처럼 0 판매 · 4일 — 추정도 0
    };
    for (const [k, v] of Object.entries(docs)) await db.collection('bench_days').doc('111_' + k).set(v);
    S._benchUn = undefined; S.bench = null; benchCfg(); await W(300); S.benchD = {};
    const v = await benchLoad('111', true); out.bad = v.badDays.length; out.days = v.days.length;
    const mk = (V) => { const d = document.createElement('div'); d.innerHTML = benchDailyHtml(v, V); return d; };
    const d0 = mk({ estGap: 3 });
    const est = [...d0.querySelectorAll('tr.bdest')]; out.estDays = est.map((r) => r.dataset.bdest);
    const r1025 = d0.querySelector('tr.bdest[data-bdest="2026-10-25"]'); out.estCells = r1025 ? [...r1025.cells].map((c) => c.textContent.trim()) : null;
    out.estTxt = est.map((r) => r.textContent).join(' | ');
    const pile = [...d0.querySelectorAll('tr[data-bdpile]')].map((r) => r.cells[4].textContent.trim()); out.pile = pile;
    out.c1024 = [...d0.querySelectorAll('tbody tr')].filter((r) => /10\/24|2026-10-24/.test(r.cells[0].textContent) && !r.classList.contains('bdest')).map((r) => r.cells[4].textContent.trim());
    out.chEst = [...d0.querySelectorAll('.bd2c.est')].map((c) => c.dataset.bdest); out.chEstBar = d0.querySelectorAll('.bd2c.est i.g.est').length; out.chPile = d0.querySelectorAll('.bd2c.pile').length;
    out.legend = (d0.querySelector('.bdlegest') || {}).textContent || ''; out.tipEst = (d0.querySelector('.bd2c.est[data-bdest="2026-10-26"]') || { dataset: {} }).dataset.bdtip || '';
    out.chEstNum = ((d0.querySelector('.bd2c.est[data-bdest="2026-10-26"] .bd2n .g') || {}).textContent || '');
    // 합계 — 실제 줄의 사라짐 확정 합(추정 줄 뺌) · 통계는 estGap과 상관없음
    const realRows = [...d0.querySelectorAll('tbody tr')].filter((r) => !r.classList.contains('bdest')); out.realN = realRows.length; out.realSum = realRows.reduce((a, r) => a + (parseInt(r.cells[4].firstChild && r.cells[4].firstChild.textContent.replace(/[^\d]/g, ''), 10) || 0), 0);
    const st = benchStats(v); out.stats = JSON.stringify({ n: st.n, addN: st.addN, goneN: st.goneN });
    // 스타일 — 흐림·기울임
    document.body.appendChild(d0); const td = d0.querySelector('tr.bdest td'); const cs = td ? getComputedStyle(td) : {}; out.style = { fs: cs.fontStyle, color: cs.color }; d0.remove();
    // 설정 바꿈
    out.gap8 = mk({ estGap: 8 }).querySelectorAll('tr.bdest').length; out.gap2 = [...mk({ estGap: 2 }).querySelectorAll('tr.bdest')].map((r) => r.dataset.bdest);
    // 화면에서 — 판매자 상세 열기 · 설정 저장
    openBench('111'); await W(1500); const sh = document.getElementById('sheet'); out.sheetEst = sh.querySelectorAll('tr.bdest').length; out.sheetLeg = !!sh.querySelector('.bdlegest');
    const inp = sh.querySelector('[data-bvk="estGap"]'); out.inpVal = inp && inp.value; if (inp) { inp.value = '5'; sh.querySelector('#bv_save').click(); await W(1200); }
    out.saved = (((await ref.get()).data() || {}).view || {}).estGap; S.bench = (await ref.get()).data(); openBench('111', true); await W(1200); out.after5 = [...document.querySelectorAll('#sheet tr.bdest')].map((r) => r.dataset.bdest);
    out.stats2 = (() => { const s2 = benchStats(v); return JSON.stringify({ n: s2.n, addN: s2.addN, goneN: s2.goneN }); })();
    return out; });
  console.log(JSON.stringify(R).slice(0, 2500));
  const E = ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-04', '2026-11-03', '2026-11-02'];
  ok(R.days >= 6 && R.bad === 1, '회차 읽음 — 온전한 회차와 새 것만 읽은 무효 회차 1개');
  ok(R.estDays.length === 9 && E.every((d) => R.estDays.includes(d)) && !R.estDays.includes('2026-10-23'), '3일 이상 빈 사이(10/24→10/31 · 11/01→11/05)만 읽지 않은 날마다 추정 줄 · 2일 사이(10/22→10/24)는 그대로');
  ok(R.estCells && /읽지 않음 · 추정/.test(R.estCells[0]) && R.estCells[4] === '≈2' && R.estCells[5] === '≈20,000원' && [1, 2, 3, 6, 7, 8, 9].every((i) => R.estCells[i] === '—'), '추정 줄: 일평균 사라짐 ≈2 · 판매가 ≈20,000원만 — 다른 칸은 —');
  ok(R.pile.some((t) => /^14/.test(t) && /그간 일평균 2권 · 20,000원\(7일\)/.test(t)) && R.pile.some((t) => /그간 일평균 0권 · 0원\(4일\)/.test(t)), '몰린 회차 줄: 그 회차 수량 그대로 + 작게 \'그간 일평균 2권 · 20,000원(7일)\' · 0 판매면 0');
  ok(R.c1024.length === 1 && !/일평균/.test(R.c1024[0]), '2일 사이 회차(10/24)는 일평균 표시 없음');
  ok(R.estTxt.includes('10/27 읽지 않음') && R.estDays.filter((d) => d === '2026-10-27').length === 1, '새 것만 읽은 날(10/27)도 숍 전체는 안 읽었으니 추정 줄 하나');
  ok(R.style.fs === 'italic', '추정 줄은 흐린 기울임 글자');
  ok(R.chEst.length === 9 && R.chEstBar === 9 && R.chPile === 2 && R.chEstNum === '≈2', '그래프: 추정 날 9칸 빗금 막대(≈2) · 몰린 회차 2칸 점선 표시');
  ok(/추정\(읽지 않은 날 · 일평균\)/.test(R.legend) && /추정/.test(R.tipEst) && /보기용/.test(R.tipEst), '범례 \'추정(읽지 않은 날 · 일평균)\' · 풍선에 추정·보기용');
  ok(R.realSum === 5 + 3 + 4 + 14 && R.stats === R.stats2 && JSON.parse(R.stats).goneN === 26, '합계·통계는 실제 회차 값만(사라짐 26 · 추정 줄 안 셈 · 설정 바꿔도 같음)');
  ok(R.gap8 === 0 && R.gap2.includes('2026-10-23') && R.gap2.length === 10, '설정: 8일이면 추정 없음 · 2일이면 10/23도 추정');
  ok(R.sheetEst === 9 && R.sheetLeg && R.inpVal === '3', '판매자 상세 화면에 추정 줄·범례 · 보기 기준 칸 처음 값 3');
  ok(R.saved === 5 && R.after5.length === 6 && !R.after5.includes('2026-11-02'), '보기 기준에서 5일로 저장 → 7일 사이만 추정(4일 사이는 그대로)');
  // 360px — 가로로 넘치지 않음(표·그래프는 제 안에서 밀기)
  await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(500);
  const M = await p.evaluate(async () => { openBench('111', true); await new Promise((r) => setTimeout(r, 1200)); const sh = document.getElementById('sheet'); const t = sh.querySelector('.bd2t'); if (t) t.open = true; await new Promise((r) => setTimeout(r, 200)); const rt = (sel) => Math.max(0, ...[...sh.querySelectorAll(sel)].map((e) => Math.round(e.getBoundingClientRect().right))); return { sw: document.documentElement.scrollWidth, box: Math.max(rt('.bd2t'), rt('.bd2'), rt('.bdlegest')), est: sh.querySelectorAll('tr.bdest').length }; }); /* 시트 머리의 📖 설명서 단추가 28px 넘치는 것은 이 일 전부터 있던 것(추정 줄과 상관없음) — 화면 전체·회차 표·그래프 상자만 봄 */
  console.log(JSON.stringify(M)); ok(M.sw <= 362 && M.box <= 362 && M.est > 0, '360px: 화면 가로 넘침 없음 · 추정 줄 보임');
  await p.screenshot({ path: '/tmp/claude-0/-home-user/c0417e7a-f1d3-5230-91e7-c394cf2b63b1/scratchpad/bnest360.png', fullPage: false });
  console.log(bad ? `❌ tBNEST 실패 ${bad}` : '✓ tBNEST 통과'); });
