// tBAVG — 정범님 11/11 밤: 🎯 집중 벤치마킹 판매자 상세 — 중간에 날짜가 빈 회차(며칠 건너뛰고 읽은 숫자)를 평균 낼 때 '통으로 하루'가 아니라 ⏸ 빈 날 배분
//  ① 배분 셈(benchSpread — 🧩 빈 날 채우기 benchFillPlan과 같은 규칙 · 저장 안 함) ② 사람이 채운(fill)·고친(edit) 값 먼저 ③ 새로 올라온 것만 읽은 회차(무효)는 빼기
//  ④ 보는 기간 하루 값(benchDeep)이 '통으로'일 때보다 맞음(참값 하루 3권·3만 원) ⑤ 최근 30일 경계 ⑥ 화면 '⏸ 빈 날 n일 배분 반영'·근거 풍선·기간 칸·종합 비교 표시
//  꾸민 판매자 번호·값만(손님 정보 없음) · 사용: w/pw 안에서 RN_PORT=<포트> node tBAVG.js
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; S.user = S.user || { email: 'tester@x' };
    let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; };
    await db.collection('app_settings').doc('bench').set({ seed190: true, mig1105: true, targets: [{ sc: '555', name: '시험 판매자', on: true }, { sc: '556', name: '시험 판매자2', on: true }], groups: [] });
    const gl = (day, n, p0) => Array.from({ length: n }, (_, i) => JSON.stringify([`${day}-${i}`, '책' + i, p0, '상', 5, null, 0, null, null, null]));
    const run = (day, o) => ({ sc: '555', name: '시험 판매자', day, runAt: `${day}T00:05:00+09:00`, strict: 1, complete: true, cover: 1, pages: 10, runLastPage: 10, total: 100, ...o });
    // 참값: 날마다 3권(1만 원짜리)씩 팔림 — 12일·17일은 매일 읽고, 13~15일은 숍 전체를 안 읽어(14일은 새 것만 읽은 무효 회차) 16일 회차에 4일치가 몰림
    const docs = { a: run('2026-11-11', { base: true }), b: run('2026-11-12', { add: 1, gone: 3, sumGone: 30000, sumAdd: 10000, spanDays: 1, goneList: gl('b', 3, 10000) }),
      l: run('2026-11-14', { partial: true, light: true, complete: false, newN: 2, add: 2, gone: 0 }),
      c: run('2026-11-16', { add: 4, gone: 12, sumGone: 120000, sumAdd: 40000, spanDays: 4, goneList: gl('c', 12, 10000) }), d: run('2026-11-17', { add: 1, gone: 3, sumGone: 30000, sumAdd: 10000, spanDays: 1, goneList: gl('d', 3, 10000) }) };
    for (const [k, v] of Object.entries(docs)) await db.collection('bench_days').doc('555_' + k).set(v);
    // 최근 30일 경계용 판매자(오늘 기준 날짜)
    const kd = (n) => new Date(Date.now() + 9 * 3600e3 - n * 864e5).toISOString().slice(0, 10); const run2 = (n, o) => ({ sc: '556', name: '시험 판매자2', day: kd(n), runAt: `${kd(n)}T00:05:00+09:00`, strict: 1, complete: true, cover: 1, pages: 10, runLastPage: 10, total: 100, ...o });
    const d2 = { a: run2(33, { base: true }), b: run2(26, { add: 7, gone: 14, sumGone: 140000, spanDays: 7 }), c: run2(1, { add: 0, gone: 50, sumGone: 500000, spanDays: 25 }) };
    for (const [k, v] of Object.entries(d2)) await db.collection('bench_days').doc('556_' + k).set(v);
    S._benchUn = undefined; S.bench = null; benchCfg(); await W(300); S.benchD = {};
    const v = await benchLoad('555', true); const st = benchStats(v);
    out.n = st.n; out.perGone = st.perDayGone; out.goneWon = st.money.goneWonPerDay; out.va = { runs: st.va.runs, days: st.va.days };
    const U = benchSpread(v.days); out.units = U.map((u) => `${u.day}:${u.gone}${u.va ? '*' : ''}`).join(' '); out.unitSp = Math.round(U.reduce((t, u) => t + (u.sp || 0), 0) * 100) / 100;
    out.bad = v.badDays.map((x) => x.day).join(',');
    const X = benchDeep(v, [], { days: 0, catDepth: 2 }); out.deepDays = X.days; out.deepCal = X.daysCal; out.deepWon = X.money.gone.sum / X.days; out.deepWonOld = X.money.gone.sum / X.daysCal; out.deepPer = X.gones.length / X.days;
    out.mark = benchVaMark(st); out.tip = benchVaTip(st.va);
    // ② 사람이 고친 값 먼저: c 사라짐 12 → 8 (✎) → 배분 2·2·2·2
    await db.collection('bench_days').doc('555_c').set({ edit: { gone: 8, at: new Date().toISOString(), by: 'tester@x' } }, { merge: true });
    const v2 = await benchLoad('555', true); out.unitsEd = benchSpread(v2.days).map((u) => `${u.day}:${u.gone}`).join(' '); out.goneEd = benchStats(v2).goneN;
    // ② 사람이 채운 값 먼저: 🧩 fill(1·5·0·6) → 그 값 그대로 · 가상 배분 안 함
    await db.collection('bench_days').doc('555_c').set({ edit: null, fill: { at: new Date().toISOString(), by: 'tester@x', days: [{ day: '2026-11-13', add: 1, gone: 1, sumGone: 10000 }, { day: '2026-11-14', add: 1, gone: 5, sumGone: 50000 }, { day: '2026-11-15', add: 1, gone: 0, sumGone: 0 }, { day: '2026-11-16', add: 1, gone: 6, sumGone: 60000 }] } }, { merge: true });
    const v3 = await benchLoad('555', true); const st3 = benchStats(v3); out.unitsFill = benchSpread(v3.days).map((u) => `${u.day}:${u.gone}${u.va ? '*' : ''}`).join(' '); out.va3 = { runs: st3.va.runs, fillRuns: st3.va.fillRuns, fillDays: st3.va.fillDays }; out.n3 = st3.n; out.deep3 = benchDeep(v3, [], { days: 0, catDepth: 2 }).days;
    await db.collection('bench_days').doc('555_c').set({ fill: null }, { merge: true });
    // ⑤ 최근 30일 경계 — 30일 앞에 걸친 7일 회차는 30일 안 4일 몫만
    const w2 = await benchLoad('556', true); const s2 = benchStats(w2); out.r30 = s2.r30 ? { days: Math.round(s2.r30.days * 100) / 100, gone: Math.round(s2.r30.gone * 100) / 100 } : null;
    // ⑥ 화면
    await benchLoad('555', true); openBench('555'); await W(1500); const sh = document.getElementById('sheet'); const nt = sh.querySelector('.bvanote'); out.note = nt ? nt.textContent : null; out.noteTip = nt ? nt.getAttribute('title') : null;
    const bv = [...sh.querySelectorAll('.bd2tbl small.bva')]; out.cellVa = bv.map((x) => x.textContent).join('|'); out.cellTip = bv[0] ? bv[0].getAttribute('title') : null;
    out.estTxt = [...sh.querySelectorAll('[data-bdest]')].map((x) => x.getAttribute('data-bdtip') || x.getAttribute('title') || '').join(' ').slice(0, 300);
    history.back(); await W(500); out.pops = pops; return out; });
  let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
  console.log(JSON.stringify(R).slice(0, 2500));
  ok(R.units === '2026-11-12:3 2026-11-13:3* 2026-11-14:3* 2026-11-15:3* 2026-11-16:3 2026-11-17:3' && R.unitSp === 6, '① 16일 회차 사라짐 12를 13~16일 4일로 고르게(3·3·3·3) — 빈 날 3일은 가상(*) · 조각 기간 합 6일 = 회차 기간 합');
  ok(R.bad === '2026-11-14' && !/14:0/.test(R.units), '③ 새로 올라온 것만 읽은 14일 회차는 무효로 빼고(그날 0으로 세지 않음) 그 몫은 16일 회차 배분으로');
  ok(R.n === 6 && Math.abs(R.perGone - 3) < 1e-9 && Math.abs(R.goneWon - 30000) < 1e-6 && R.va.runs === 1 && R.va.days === 3, `전체 하루 평균 = 사라짐 18 ÷ 6일 = 3권 · 3만 원(참값) · 빈 날 3일 배분 (${R.perGone} · ${R.goneWon})`);
  ok(R.deepDays === 6 && R.deepCal === 3 && Math.abs(R.deepWon - 30000) < 1e-6 && Math.abs(R.deepPer - 3) < 1e-9 && R.deepWonOld === 60000, `④ 보는 기간 하루 사라진 판매가 = 18만 ÷ 6일 = 3만 원(참값) — 예전 '통으로'(회차 있는 날 3일)는 6만 원으로 2배 부풂`);
  ok(R.unitsEd === '2026-11-12:3 2026-11-13:2 2026-11-14:2 2026-11-15:2 2026-11-16:2 2026-11-17:3' && R.goneEd === 14, '② ✎ 고친 값(12→8)이 먼저 — 고친 값을 4일로 나눔(2·2·2·2) · 합 14');
  ok(R.unitsFill === '2026-11-12:3 2026-11-13:1 2026-11-14:5 2026-11-15:0 2026-11-16:6 2026-11-17:3' && R.va3.runs === 0 && R.va3.fillRuns === 1 && R.va3.fillDays === 3 && R.n3 === 6 && R.deep3 === 6, '② 🧩 사람이 채운 날 값(1·5·0·6) 그대로 — 가상 배분 안 함 · 날 수 그대로 6일');
  ok(R.r30 && R.r30.days === 29 && Math.abs(R.r30.gone - 58 / 29) < 0.01, `⑤ 최근 30일: 30일 앞에 걸친 7일 회차는 30일 안 4일 몫만(예전엔 통째로 7일) — ${JSON.stringify(R.r30)}`);
  ok(/⏸3/.test(R.mark || '') && /11-12 다음 날 ~ 2026-11-16 \(4일\)/.test(R.tip || '') && /새로 올라온 것만 읽은 날/.test(R.tip || ''), '종합 비교 칸 표시 ⏸3 · 근거 풍선(앞 회차 다음 날 ~ 이 회차 · 무효 회차는 뺌)');
  ok(/빈 날 3일 배분 반영/.test(R.note || '') && /4일/.test(R.noteTip || ''), "⑥ 판매자 상세 카드 아래 '⏸ 빈 날 3일 배분 반영' · 근거 풍선");
  ok(/⏸ 4일 배분/.test(R.cellVa || '') && /3·3·3·3/.test(R.cellTip || ''), "⑥ 회차별 기록 기간 칸 '⏸ 4일 배분' · 풍선에 날마다 3·3·3·3");
  ok(R.pops === 0 && errs.length === 0, '팝업·오류 없음 ' + JSON.stringify(errs).slice(0, 200));
  console.log(bad ? `❌ tBAVG 실패 ${bad}` : '✓ tBAVG 통과');
});
