// tBM1105 — 정범님 11/04 '바로 세팅해줘' 집중 벤치마킹 새 일정(22명 · 요일마다 숍 전체) 한 번만 넣기 · 옛 그룹 남김 · 새 14명 첫 주는 정한 요일만 · 11/12부터 매일
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('/home/user/w/pw/harness.js')(async (p) => { await p.evaluate(require('/home/user/w/pw/seed.js'));
  const R = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const ref = db.collection('app_settings').doc('bench');
    const all = ['349846','467702','434643','964167','903578','579718','404821','464202','463795','492775','406966','988951','122039','996071','404730','266540','204965','19745','632450','13695','1025425','920547','823140'];
    await ref.set({ seed190: true, targets: all.map((sc) => ({ sc, name: 'S' + sc, on: sc !== '823140' })), groups: [{ id: 'gA', name: '그룹 1', scs: all.slice(0, 8), light: { on: true, by: 'd', fullDays: 2 } }, { id: 'gB', name: '그룹 3', off: true, scs: all.slice(8, 22) }] });
    S.bench = (await ref.get()).data(); await benchMig1105(); const D = (await ref.get()).data(); S.bench = D; S._benchMig = 0; await benchMig1105(); const D2 = (await ref.get()).data();
    const RB = window.ReadnowRegistry.BENCH; const G = D.groups; const now = Date.parse('2026-11-05T00:10:00+09:00'); const st = {}; for (const sc of all) st[sc] = { day: '2026-11-04', runAt: '2026-11-04T00:05:00+09:00', endAt: '2026-11-04T03:00:00+09:00', completeEndAt: '2026-11-04T03:00:00+09:00' };
    const P = RB.plan({ ...D, targets: D.targets.filter((t) => t.on !== false) }, st, now); const md = {}; P.forEach((x) => (md[x.sc] = x.mode));
    return { n: G.length, scs: G.reduce((a, g) => a + g.scs.length, 0), off: G.filter((g) => g.off).length, bak: (D.groupsBak1105 || []).length, mig: !!D.mig1105, same: JSON.stringify(D.groups) === JSON.stringify(D2.groups), g1: G[0].sched.w.length, gNew: G[2].sched.w, md, on823: (D.targets.find((t) => t.sc === '823140') || {}).on }; });
  console.log(JSON.stringify(R).slice(0, 900));
  ok(R.n === 9 && R.scs === 22 && R.off === 0, '그룹 9개 · 판매자 22명 · 꺼진 그룹 없음');
  ok(R.bak === 2 && R.mig && R.same, '옛 그룹을 남김 · 한 번만(다시 불러도 그대로)');
  ok(R.g1 === 7 && JSON.stringify(R.gNew) === '[0]', '지금 8명은 매일 · 새 판매자는 첫 주 정한 요일만');
  ok(R.md['467702'] === 'full' && R.md['996071'] === 'full' && R.md['349846'] === 'light' && R.md['204965'] === 'light', '목요일(11/05): 그룹 1-나·목요일 판매자는 숍 전체, 그룹 1-가·다른 요일 판매자는 새 것만');
  ok(R.on823 === false, '꺼 둔 판매자는 그대로 꺼짐');
  console.log(bad ? `❌ tBM1105 실패 ${bad}` : '✓ tBM1105 통과'); });
