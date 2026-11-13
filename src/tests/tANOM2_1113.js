// tANOM2_1113 — (anom2 11/13) 🔁 다시 올리기 목적 엔진 · 브라우저 필요 없음
//  ① 짝 찾기(같은 제목 · 값이 가장 가까운 것 · 한 번만) · 회차 셈(값·등급·최저가·나이·바로 올림)
//  ② 우연 몫을 빼고 넘친 몫으로 습관(강함·조금·거의 안 함·자료 적음) · 가설 여덟 점수 · 주된 목적
//  ③ 효과 — 다시 올린 무리의 운명(뒤 회차 사라짐) ÷ 그대로 둔 옛 상품 · 또 다시 올림은 팔림으로 안 셈
//  ④ 스스로 채점(판정 때 예측 → 뒤 회차로 맞음/틀림 → 가설 무게) · 같은 예측 두 번 안 셈 · 사람 판단 안 씀
//  ⑤ 클라우드(cloud/relist.js · 회차 보고에 붙음) — 가짜 저장소로 처음 한 번 35일 거슬러 · 되돌려 채점 · 두 번째는 새 회차만 · 웹앱 6-2 칸 글
// 실행: node src/tests/tANOM2_1113.js · 시험 자료는 모두 지어낸 값(가게 번호 9300001…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'readnow-relist-core.js')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const RL = require(path.join(ROOT, 'readnow-relist-core.js'));
const APP = (() => { for (const f of ['src/app.html', 'app.html']) { const p = path.join(ROOT, f); if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); } return ''; })();
const J = (a) => JSON.stringify(a);

console.log('① 짝 찾기 · 회차 셈');
{ const G = [J(['x1', '어떤 책 한 권', 5000, '상', null, '20261001', 0]), J(['x2', '두 번째 책', 3000, '중', 5, '20261020', 1]), J(['x3', '남는 책', 2000, '상', null, '20261001', 0])];
  const A = [{ j: 0, d: '2026-11-10', r: ['y1', '어떤  책 한 권', 4000, '중', null, null, 20000, 1] }, { j: 1, d: '2026-11-11', r: ['y2', '두 번째 책', 3000, '중', null, null, 10000, 1] }, { j: 1, d: '2026-11-11', r: ['y3', '두 번째 책', 9000, '중', null, null, 10000, 0] }, { j: 1, d: '2026-11-11', r: ['c1', '다른 책', 4100, '상', null, null, 15000, 0] }];
  const P = RL.pairs(RL.rows(G), A); ok(P.length === 2 && P[0].y[0] === 'y1' && P[1].y[0] === 'y2', '같은 제목(띄어쓰기 뺌) · 값이 가장 가까운 것', P.map((p) => p.y[0]));
  const s = RL.runStat(G, A, { day: '2026-11-11', prevDay: '2026-11-10', win: 1, mo: 3, mb: 0 }); const R = s.R;
  ok(R.n === 3 && R.pr === 2 && R.imm === 1 && R.base === 1 && R.dn === 1 && R.same === 1 && R.gch === 1 && R.gDn === 1 && R.lg === 1, '회차 셈(내림·같은 값·등급 내림·최저가 생김·바로 올림)', R);
  ok(R.bG === 1, '옛 상품 사라짐은 짝이 아닌 것만(x3)', R.bG); ok(s.y.length === 2 && s.c.length === 1 && s.c[0][0] === 'c1', '대조군은 사라진 제목이 아닌 새로 올림에서 값 맞춤(y3은 사라진 제목이라 뺌)', s.c);
  ok(R.plX.length === 2 && Math.abs(R.plX[0] - 0.25) < 1e-9, '정가 대비(새로 올림의 정가 칸)', R.plX); }

console.log('② 습관 · 가설 · 주된 목적');
const mkR = (o) => ({ d: '2026-11-01', n: 200, pr: 60, ch: 2, imm: 50, base: 55, old14: 58, same: 10, up: 5, dn: 45, sameAll: 8, gch: 10, gUp: 2, gDn: 8, lg: 30, ll: 2, xl: 10, yl: 38, bG: 40, gN: 140, win: 1, mo: 200, mb: 2, td: 0, dnR: Array(20).fill(0.7), upR: [1.1], age: [30], plX: [0.2], plY: [0.15], ...o });
{ const runs = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((d) => mkR({ d }));
  const S = RL.agg(runs, 5000); const Jd = RL.judge(S, null, null, { sc: '9300001', name: '가게A' });
  ok(Jd.habit === 'strong' && Jd.share > 0.25, '넘친 몫이 크면 습관 강함', [Jd.habit, Jd.share]);
  const h = Object.fromEntries(Jd.hyps.map((x) => [x.id, x])); ok(h.reprice.score >= 60 && h.lowbadge.score >= 60, '값 내림·최저가 되찾기 강함', [h.reprice.score, h.lowbadge.score]);
  ok(['reprice', 'lowbadge'].includes(Jd.main.id), '주된 목적 = 값 다시 매기기 또는 최저가 표시 되찾기', Jd.main); ok(h.move.score == null && /알 수 없음/.test(h.move.verdict), '다른 판매처로 옮김 = 알 수 없음(자료 없음)');
  ok(h.restock.score < 35, '우연 몫이 작으면 같은 책 다시 들여옴은 약함', h.restock.score);
  const S2 = RL.agg(runs.map((r) => ({ ...r, ch: 59 })), 5000); const J2 = RL.judge(S2, null, null, {}); ok(J2.habit === 'none' && J2.main.id === 'none' && /참고/.test(J2.hyps[0].verdict), '짝이 거의 우연이면 다시 올리기 거의 안 함 · 목적 가설은 참고', [J2.habit, J2.hyps[0].verdict]);
  const J3 = RL.judge(RL.agg([mkR({ n: 50 })], 10), null, null, {}); ok(J3.habit === 'few', '사라짐 100개·2회차 아래면 자료 적음', J3.habit);
  const S4 = RL.agg(runs.map((r) => ({ ...r, mo: 1000, mb: 900 })), 5000); const J4 = RL.judge(S4, null, null, {}); ok(J4.hyps.find((x) => x.id === 'stock').score <= 15, '절반 넘게 다시 보임 = 읽기 잡음(재고 확인 아님)', J4.hyps.find((x) => x.id === 'stock')); }

console.log('③ 효과 — 무리 운명');
{ const co = { d: '2026-11-01', y: Array.from({ length: 40 }, (_, i) => ['y' + i, RL.dN('2026-11-01'), 100 + i]), c: [['c0', RL.dN('2026-11-01'), 9]], yE: { ev: 0, t: 0, re: 0 }, cE: { ev: 0, t: 0, re: 0 } };
  const g = new Set(Array.from({ length: 20 }, (_, i) => 'y' + i)); RL.fate(co, g, '2026-11-05', new Set([100, 101])); ok(co.yE.ev === 18 && co.yE.re === 2 && co.y.length === 20, '뒤 회차 사라짐 18 · 같은 제목이 또 올라온 2는 팔림 아님(또 다시 올림)', co.yE);
  RL.fate(co, g, '2026-11-06', new Set()); ok(co.yE.ev === 18, '같은 번호는 한 번만 셈');
  const H = RL.haz([co], '2026-11-11'); ok(H.y.ev === 18 && Math.abs(H.y.exp - (18 * 4 + 20 * 10)) < 1e-6, '지켜본 날 = 사라질 때까지 + 남은 것은 오늘까지', H.y);
  const runs = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((d) => mkR({ d, bG: 10 })); const S = RL.agg(runs, 5000);
  const Jd = RL.judge(S, H, null, {}); ok(Jd.eff.v === 'fast' && Jd.eff.rOld.lo > 1, '다시 올린 무리가 옛 상품보다 뚜렷이 빠르면 더 빨리 팔림', Jd.eff); ok(Jd.preds.some((p) => p.k === 'eff' && p.exp === 'fast'), '효과 예측을 남김');
  const Hs = { y: { ev: 2, exp: 100 }, c: { ev: 0, exp: 0 } }; ok(RL.judge(S, Hs, null, {}).eff.v === 'unk', '사건 5개 아래면 모름'); }

console.log('④ 스스로 채점 · 배움');
{ const runs = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((d) => mkR({ d })); const J0 = RL.judge(RL.agg(runs, 5000), null, null, {});
  const rec = { at: 'T1', last: '2026-11-04', preds: J0.preds }; const later = ['2026-11-05', '2026-11-06'].map((d) => mkR({ d }));
  const vs = RL.verify(rec, RL.agg(later, 5000), RL.haz([], '2026-11-06'), null); ok(vs.find((x) => x.k === 'habit').ok === true && vs.find((x) => x.k === 'main').ok === true, '뒤 회차도 다시 올리기 · 같은 목적 → 맞음', vs);
  const later2 = ['2026-11-05', '2026-11-06'].map((d) => mkR({ d, pr: 3, ch: 2, dn: 0, lg: 0, same: 3, sameAll: 3 })); const vs2 = RL.verify(rec, RL.agg(later2, 5000), null, null); ok(vs2.find((x) => x.k === 'habit').ok === false, '뒤 회차에 다시 올리기가 사라지면 틀림', vs2);
  const later3 = ['2026-11-05', '2026-11-06'].map((d) => mkR({ d, dn: 0, up: 0, same: 60, sameAll: 60, lg: 0, ll: 0, gch: 0, dnR: [], upR: [] })); const vs3 = RL.verify(rec, RL.agg(later3, 5000), null, null); ok(vs3.find((x) => x.k === 'main').ok === false, '뒤 회차에 그 목적의 증거가 없으면 주된 목적 틀림', vs3);
  const outs = [...vs2.filter((x) => x.k === 'habit'), ...vs3.filter((x) => x.k === 'main')].map((x) => ({ ...x, key: '9300001|T1', sc: '9300001' }));
  const L1 = RL.learn(null, outs); ok(L1.learn.n.bad === 2 && L1.learn.bias[J0.main.id] <= -0.5 && L1.learn.habitCut > 0.03, '틀리면 그 가설 −0.5 · 습관 기준 올림', L1.learn);
  const L2 = RL.learn(L1.learn, outs); ok(L2.changed === 0, '같은 예측은 한 번만 채점');
  const J1 = RL.judge(RL.agg(runs, 5000), null, L1.learn, {}); ok(J1.hyps.find((x) => x.id === J0.main.id).score < J0.hyps.find((x) => x.id === J0.main.id).score, '배운 무게가 다음 판정 점수에 들어감');
  ok(!/excl|human|사람이 고/.test(fs.readFileSync(path.join(ROOT, 'readnow-relist-core.js'), 'utf8').replace(/사람 판단은 쓰지 않음|사람을 교사·표본으로 쓰지 않음|사람용 글/g, '')), '배움 재료에 사람 판단(빼기·넣기)을 쓰지 않음(사실 F32)'); }

console.log('⑤ 클라우드 · 회차 보고 · 웹앱');
(async () => {
  const RX = require(path.join(ROOT, 'cloud', 'relist.js')); ok(!!RX.RL && RX.RL.VERSION === RL.VERSION, '클라우드가 공용 파일을 읽음');
  const DB = { bench_days: {}, bench_relist: {}, app_settings: {} };
  const snap = (v) => ({ exists: v != null, data: () => (v == null ? undefined : JSON.parse(JSON.stringify(v))) });
  const C = (n) => { DB[n] = DB[n] || {}; return { doc: (id) => ({ get: async () => snap(DB[n][id]), set: async (v) => { DB[n][id] = JSON.parse(JSON.stringify(v)); } }) }; };
  const sc = '9300001'; const days = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-31', '2026-11-01', '2026-11-02']; const hist = [];
  days.forEach((d, i) => { const id = `${sc}_${d}`; const G = i === 0 ? [] : Array.from({ length: 120 }, (_, k) => J([`g${i}_${k}`, `책 ${i}-${k}`, 5000, '상', null, '20261001', 0]));
    const A = i === 0 ? [] : [...Array.from({ length: 40 }, (_, k) => J([`r${i}_${k}`, `책 ${i + 1}-${k}`, 3500, '상', null, null, 20000, 1, null])), ...Array.from({ length: 40 }, (_, k) => J([`n${i}_${k}`, `새 책 ${i}-${k}`, 3500, '상', null, null, 20000, 0, null]))];
    DB.bench_days[id] = { goneList: G, addList: A }; hist.push({ sc, dayId: id, day: d, name: '가게A', runAt: d + 'T01:00:00Z', at: d + 'T02:00:00Z', full: true, complete: true, base: i === 0, gone: G.length, missOnce: 120, missBack: 0, spanDays: 1, total: 5000 }); });
  /* 뒤 회차 사라짐에 앞 회차 다시 올린 것 몇 개를 넣음(팔림) */
  for (let i = 3; i < days.length; i++) { const v = DB.bench_days[`${sc}_${days[i]}`]; for (let k = 0; k < 6; k++) v.goneList.push(J([`r${i - 2}_${k}`, `팔린 ${i}-${k}`, 3500, '상', 2, '20261020', 1])); }
  const M = Object.fromEntries(Array.from({ length: 400 }, (_, k) => [`o${k}`, [3000, '20261001', '상', 1, `옛 책 ${k}`, 0, 0]]));
  const RLM = RX.makeRelist({ C, log: () => {} }); let X = RLM.begin({ day: '2026-11-02', dry: false, hist }); const n1 = await X.prep(sc); X.feed(sc, M); const out = await X.finish();
  const a = out.list[0]; ok(n1 === days.length - 1 && a && a.habit === 'strong', '처음 한 번 35일 거슬러 모든 회차 · 습관 강함', [n1, a && a.habit, a && a.share]);
  ok(a.main && ['reprice', 'lowbadge', 'expose'].includes(a.main.id) && a.hyps.length === 8, '가설 여덟 · 주된 목적', a.main);
  ok(a.eff && a.eff.y.ev > 0, '다시 올린 무리의 뒤 사라짐을 셈', a.eff); ok((a.chk || []).length > 0 && DB.app_settings.relist_learn && DB.app_settings.relist_learn.n.ok + DB.app_settings.relist_learn.n.bad > 0, '첫날 되돌려 채점 → 배움 저장', DB.app_settings.relist_learn && DB.app_settings.relist_learn.n);
  ok(DB.bench_relist[sc] && Object.keys(DB.bench_relist[sc].runs).length === days.length - 1 && JSON.stringify(DB.bench_relist[sc]).length < 900000, 'bench_relist 저장(1MB 아래)');
  X = RLM.begin({ day: '2026-11-02', dry: false, hist }); const n2 = await X.prep(sc); X.feed(sc, M); await X.finish(); ok(n2 === 0, '두 번째는 새 회차만(같은 회차 두 번 안 셈)', n2);
  const before = JSON.stringify(DB.bench_relist[sc]); X = RLM.begin({ day: '2026-11-02', dry: true, hist }); await X.prep(sc); await X.finish(); ok(JSON.stringify(DB.bench_relist[sc]) === before, '미리 보기(dry)는 안 씀');
  const BRS = fs.readFileSync(path.join(ROOT, 'cloud', 'benchrep.js'), 'utf8'); ok(/RLX\.prep\(sc\)/.test(BRS) && /RLX\.feed\(sc, M\)/.test(BRS) && /P\.relist = await RLX\.finish\(\)/.test(BRS), '회차 보고가 숍마다 prep·feed·finish');
  ok(!/\.set\([^)]*(price|listPrice)/.test(fs.readFileSync(path.join(ROOT, 'cloud', 'relist.js'), 'utf8')), '값을 바꾸는 쓰기 없음(무손해)');
  ok(/function brRelistHtml\(R\)/.test(APP) && /6-2/.test(APP) && /다시 올리기 목적/.test(APP) && /br_relist/.test(APP), '웹앱 🎯 회차 보고 6-2 칸');
  ok(/🔁 다시 올리기 목적 — 판매자가 팔림이 아닌 사라짐/.test(APP), '🔍 기능 찾기 항목');
  console.log(bad ? `❌ tANOM2_1113 실패 ${bad}` : '✓ tANOM2_1113 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
