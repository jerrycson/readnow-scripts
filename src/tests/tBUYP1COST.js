// tBUYP1COST — (buyp1 11/20 · 정범님 I-1119-1916 Ⓕ 뒤이음) 매입가 「0원(진짜 0)」과 「모름」을 클라우드·가격 공용 바닥 셈도 웹앱(1.78.812 pmCost0)과 같이 가름
//   ① 공용 stratFloor·🐢 decay: 표시 없는 0 = 모름(cost null · 내리지 않음) · costZero 0 = 0원(바닥 = 최저가) · 0보다 크면 예전 그대로
//   ② 클라우드 cloud/index.js 두 곳(판매 학습 상품 줄 slOurItems · 전략 실행 stratTick)이 pur_matches를 읽을 때 같은 규칙 · 전략 ctx에 costZero
//   ③ 웹앱 stratCtx(전략 미리 보기)가 pmCost0을 써서 같은 결과 · 클라우드 사본 공용이 원본과 같음
//  쓰는 법: cd pw && RN_PORT=<포트> node tBUYP1COST.js   (시험 자료는 지어낸 값 — 손님 정보 없음 · Firestore 안 씀)
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const up = (f) => { for (const d of ['..', '../..', '../../..']) { const p = path.join(__dirname, d, f); if (fs.existsSync(p)) return p; } return null; };
console.log('— ① 공용 바닥 셈(node)');
const coreP = up('readnow-ml-core.js'); const ML = require(coreP); const now = Date.now();
const mk = (cost, costZero) => ({ l: { id: 'L1', price: 12000, grade: '상', registeredAt: new Date(now - 100 * 864e5).toISOString() }, m: { usedFirstPage: [{ price: 8000, grade: '상' }, { price: 9000, grade: '중' }], usedAt: new Date(now - 3600e3).toISOString() }, st: {}, cost, costZero, now });
{ const f = ML.stratFloor(mk(3000), {}); ok(f.cost === 3000 && f.v === 3400, '매입가 3,000원 → 바닥 3,400원(예전 그대로)', f); }
{ const f = ML.stratFloor(mk(0), {}); ok(f.cost === null && f.v === 1000 && !/매입가/.test(f.why), '표시 없는 0(예전 기록) = 모름', f); }
{ const f = ML.stratFloor(mk(0, true), {}); ok(f.cost === 0 && f.v === 1000 && /매입가 0원/.test(f.why), 'costZero 0 = 진짜 0원(바닥은 최저가 · 까닭에 「매입가 0원」)', f); }
{ const f = ML.stratFloor(mk(''), {}); ok(f.cost === null, '빈칸 = 모름', f); }
{ const f = ML.stratFloor(mk(2000, true), {}); ok(f.cost === 2000, '낡은 표시(값을 2,000원으로 고침)는 해 없음', f); }
{ const d = ML.stratDecide('decay', mk(0), {}, {}); ok(d.act === 'none' && /몰라/.test(d.why), '🐢 표시 없는 0 → 내리지 않음(손해 막기)', d.why); }
{ const d = ML.stratDecide('decay', mk(0, true), {}, {}); ok(d.act === 'price' && d.to === 11400, '🐢 진짜 0원 → 내림(바닥 1,000원)', d); }
{ const d = ML.stratDecide('decay', mk(3000), {}, {}); ok(d.act === 'price' && d.to === 11400 && /3,400/.test(d.why), '🐢 3,000원 → 예전 그대로', d.why); }
{ const d = ML.stratDecide('floor', mk(0), {}, {}); ok(d && d.act !== undefined, '🛡 floor도 같은 바닥 셈으로 돎', d); }
ok(/0\.10\.(\d+)/.test(ML.VERSION) && +ML.VERSION.split('.')[2] >= 3, '공용 판 0.10.3 이상', ML.VERSION);

console.log('— ② 클라우드 pur_matches 읽기');
const cloudP = up('cloud/index.js'); const src = fs.readFileSync(cloudP, 'utf8');
{ const conds = []; let i = 0; for (;;) { const a = src.indexOf("if (v && v.kind !== 'none'", i); if (a < 0) break; const b = src.indexOf(') COST.set(', a); if (b < 0) break; conds.push(src.slice(a + 4, b)); i = b; }
  ok(conds.length >= 2, '매입가를 읽는 두 곳(slOurItems·stratTick)을 찾음', conds.length);
  const T = [[{ kind: 'auto', cost: 1200 }, true], [{ kind: 'auto', cost: 0 }, false], [{ kind: 'auto', cost: 0, costZero: true }, true], [{ kind: 'auto' }, false], [{ kind: 'auto', cost: '' }, false], [{ kind: 'none', cost: 0, costZero: true }, false], [{ kind: 'auto', cost: 'x' }, false]];
  conds.forEach((c, n) => { const f = new Function('v', 'return !!(' + c + ')'); const got = T.map(([v]) => f(v)); ok(T.every(([, want], j) => got[j] === want), `클라우드 ${n + 1}번째 곳 — 0은 costZero일 때만 · 표시 없는 0·빈칸·없음 = 모름`, { c: c.slice(0, 200), got }); });
  ok(/fieldMask: \['cost', 'kind', 'costZero'\]/.test(src), '판매 학습 상품 줄 — costZero 칸도 읽음(fieldMask)');
  ok(/costZero: COST\.get\(lid\) === 0/.test(src), '전략 실행 ctx에 costZero(공용 바닥 셈에 알림)'); }
{ const a = fs.readFileSync(coreP, 'utf8'), b = up('cloud/readnow-ml-core.js') && fs.readFileSync(up('cloud/readnow-ml-core.js'), 'utf8'); ok(a === b, '클라우드 사본 공용 = 원본'); }

require('./harness.js')(async (p) => { let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.dismiss().catch(() => {}); });
  console.log('— ③ 웹앱 전략 미리 보기');
  const r = await p.evaluate(() => { S.pmatch = new Map([['A', { kind: 'auto', cost: 0 }], ['B', { kind: 'auto', cost: 0, costZero: true }], ['C', { kind: 'auto', cost: 2500 }], ['D', { kind: 'none', cost: 0, costZero: true }]]); S.strat = S.strat || {}; S.strat.items = S.strat.items || new Map(); S.pmetrics = S.pmetrics || new Map(); S.plist = S.plist || new Map();
    const o = {}; for (const id of ['A', 'B', 'C', 'D', 'E']) { const c = stratCtx({ id, price: 9000 }, { k: 'floor' }, []); o[id] = { cost: c.cost, z: c.costZero, fl: ReadnowML.stratFloor(c, {}).cost }; } return { o, v: ReadnowML.VERSION }; });
  ok(r.o.A.cost === null && r.o.A.fl === null, '웹앱 예전 0 → 모름', r.o.A); ok(r.o.B.cost === 0 && r.o.B.z === true && r.o.B.fl === 0, '웹앱 진짜 0원 → 0원(costZero 함께)', r.o.B);
  ok(r.o.C.cost === 2500 && r.o.C.z === false && r.o.C.fl === 2500, '웹앱 2,500원 → 그대로', r.o.C); ok(r.o.D.cost === null && r.o.E.cost === null, '연결 없음(none)·매입 연결 없는 상품 → 모름', [r.o.D, r.o.E]);
  ok(r.v === ML.VERSION, '웹앱이 부르는 공용 판 = 원본 판', [r.v, ML.VERSION]);
  ok(dialogs === 0, '브라우저 팝업 없음', dialogs);
  console.log(bad ? `✗ tBUYP1COST 실패 ${bad}` : '✓ tBUYP1COST 모두 통과');
});
