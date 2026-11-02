// tCHeng — 🎯 추격자 엔진(ReadnowChase · readnow-pricing-core.js 안) 시험: 옛 5전략 회귀(3,000 사례) + 새 태세·규칙 시나리오 + 기록 줄
// 실행: node src/tests/chase/tCHeng.js [판정 엔진 파일 경로]
const path = require('path'); const PR = require(process.argv[2] || path.join(__dirname, '../../../readnow-pricing-core.js')); const CH = PR.Chase;
const B = require('./chase_baseline.json'); const cases = require('./gen_cases.js')(3000);
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const J = (x) => JSON.stringify(x);
// ① 회귀: 옛 chaseStep(엔진 0.17.4에서 저장한 출력) = 새 step = 정책 꺼진 judge(plan 칸만 덧붙음)
let d1 = 0, d2 = 0, d3 = 0; const H = (x) => require('crypto').createHash('sha256').update(J(x)).digest('hex').slice(0, 12); cases.forEach((c, i) => { const exp = B.stepH[i]; const a = (() => { try { return PR.chaseStep(JSON.parse(J(c))); } catch (e) { return { err: e.message }; } })(); if (H(a) !== exp) d1++;
  const b = (() => { try { return CH.step(JSON.parse(J(c))); } catch (e) { return { err: e.message }; } })(); if (H(b) !== exp) d2++;
  const j = (() => { try { const r = CH.judge({ ...JSON.parse(J(c)), groupStrat: c.strat, policy: null }); delete r.plan; return r; } catch (e) { return { err: e.message }; } })(); if (H(j) !== exp) d3++; });
ok(d1 === 0, `회귀 chaseStep 3,000 사례 같음 (다름 ${d1})`); ok(d2 === 0, `회귀 Chase.step 같음 (다름 ${d2})`); ok(d3 === 0, `회귀 정책 꺼진 judge 같음 (다름 ${d3})`);
{ const D = B.detect; const maps = ['2026-10-10T00:00:00Z', '2026-10-20T00:00:00Z', '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z'].map((nw) => PR.chaseMap(D.acts, D.docs, nw, { chase: { minEvents: 2 } }));
  ok(J(maps) === J(D.maps), '회귀 chaseMap(찾기) 같음'); const pages = maps.map((m) => PR.chaserOn([{ c: 'ours', sc: '996008', p: 10 }, ...Object.keys(m).map((sc, i) => ({ sc, p: 1000 + i * 37, g: ['최상', '상', '중'][i % 3] }))], m, '상'));
  ok(J(pages) === J(D.pages), '회귀 chaserOn 같음'); ok(J(CH.find([{ c: 'ours', sc: '996008', p: 10 }, ...Object.keys(maps[2]).map((sc, i) => ({ sc, p: 1000 + i * 37, g: ['최상', '상', '중'][i % 3] }))], maps[2], '상', null)) === J(D.pages[2]), '정책 꺼진 find = chaserOn');
  ok(J(PR.sellerChase({ a: maps[1], b: maps[2], c: maps[3] }, { chase: { sellerMinBooks: 2 } })) === J(D.sel), '회귀 sellerChase 같음');
  const col = CH.collect(D.acts, D.docs, '2026-11-01T00:00:00Z', { chase: { minEvents: 2 } }); ok(J(col.map) === J(D.maps[2]) && Object.keys(col.moves).length >= 8 && !col.moves['996008'] === false, 'collect = chaseMap + 판매자마다 마지막 값 바꾼 때'); }
ok(typeof globalThis.ReadnowChase === 'undefined' || globalThis.ReadnowChase === CH, '전역 이름');
// ② 새 태세·규칙 시나리오
const NOW = '2026-11-02T03:00:00.000Z'; const pg = (rows) => [{ c: 'ours', sc: '996008', p: 10000, g: '상' }, ...rows];
const POL = (x) => ({ on: true, ...x });
{ // 무시: 추격 기록 없어도 추격자로 → 양보(yieldT) · 판정 엔진 양보 지도에도
  const P = POL({ sellers: { 111: { name: '갑', stance: 'ignore' } } }); const ch = CH.find(pg([{ sc: '111', p: 9000, g: '상' }, { sc: '222', p: 9500, g: '상' }]), {}, '상', P);
  ok(ch && ch.sellerCode === '111' && ch.who === 'specific' && ch.stance === 'ignore', '무시 판매자는 추격 기록 없이도 찾음');
  const r = CH.judge({ policy: P, groupStrat: { name: 'match' }, chaser: ch, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(r.t === 9500 && r.plan.rule === 'ignore' && r.state.name === 'yield', `무시 → 따라가지 않고 다음 유효 매물(9,500) — 그룹이 동가여도 (${r.t})`);
  ok(CH.mapWithPolicy({}, P)['111'].active === true && CH.mapWithPolicy({}, { ...P, on: false })['111'] === undefined, '무시 판매자 → 판정 엔진 양보 지도에 켬 · 정책 끄면 그대로');
  const P2 = POL({ sellers: { 111: { stance: 'normal' } } }); ok(CH.find(pg([{ sc: '111', p: 9000, g: '상' }]), { 111: { active: true } }, '상', P2) === null && CH.mapWithPolicy({ 111: { active: true } }, P2)['111'].active === false, "'추격자로 보지 않음' → 찾지 않고 판정 엔진 지도에서도 끔"); }
{ // 공격적(기본 끌어내린 뒤 빠지기) · 방어적(기본 양보) · 판매자마다 전략 지정
  const P = POL({ sellers: { 111: { stance: 'aggressive' }, 222: { stance: 'defensive' }, 333: { stance: 'aggressive', strat: 'match' } } });
  const a = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: { sellerCode: '111', price: 9000, who: 'specific', stance: 'aggressive' }, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(a.state.name === 'lure' && a.state.phase === 'probe' && a.t === 8950, `공격적 → 끌어내리기 1회 8,950 (${a.t})`);
  const d = CH.judge({ policy: P, groupStrat: { name: 'lure' }, chaser: { sellerCode: '222', price: 9000 }, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(d.state.name === 'yield' && d.t === 9500, `방어적 → 양보 9,500 (${d.t})`);
  const m = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: { sellerCode: '333', price: 9000 }, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(m.state.name === 'match' && m.t === 9000, '판매자마다 전략 지정(공격적 + 동가)'); }
{ // 불특정 n회만 따르기 (2회 · 범위 10%) → 그 뒤 그대로
  const P = POL({ anon: { rules: { follow: true }, cond: { maxFollow: 2, rangePct: 10 } } }); const base = { policy: P, groupStrat: { name: 'yield' }, floor: 0, start: 10000, yieldT: 9800 };
  let st = null; let r = CH.judge({ ...base, chaser: { sellerCode: '555', price: 9500 }, state: st, now: NOW, cur: 10000, base: 9500 }); ok(r.t === 9500 && r.state.follows === 1 && r.plan.who === 'anon' && r.plan.rule === 'follow', `1번째 따름 9,500 (${r.t})`); st = r.state;
  r = CH.judge({ ...base, chaser: { sellerCode: '555', price: 9500 }, state: st, now: '2026-11-02T10:00:00Z', cur: 9500, base: 9500 }); ok(r.t === 9500 && r.state.follows === 1, '추격자 그대로면 따른 값 유지'); st = r.state;
  r = CH.judge({ ...base, chaser: { sellerCode: '555', price: 9200 }, state: st, now: '2026-11-02T16:00:00Z', cur: 9500, base: 9200 }); ok(r.t === 9200 && r.state.follows === 2, `2번째 따름 9,200 (${r.t})`); st = r.state;
  r = CH.judge({ ...base, chaser: { sellerCode: '555', price: 9100 }, state: st, now: '2026-11-03T00:00:00Z', cur: 9200, base: 9100 }); ok(r.t === 9200 && r.state.phase === 'stop', `3번째는 따르지 않음 → 9,200 그대로 (${r.t} · ${r.reasons[0]})`); st = r.state;
  r = CH.judge({ ...base, chaser: { sellerCode: '555', price: 8000 }, state: st, now: '2026-11-03T08:00:00Z', cur: 9200, base: 8000 }); ok(r.t === 9200, '그만둔 뒤엔 더 내려도 그대로');
  const r2 = CH.judge({ ...base, chaser: { sellerCode: '555', price: 8800 }, state: null, now: NOW, cur: 10000, base: 8800 }); ok(r2.t === 10000 && r2.state.phase === 'stop', `범위(시작 10,000의 10% = 9,000) 밖이면 처음부터 따르지 않음 (${r2.t})`);
  const P3 = POL({ anon: { rules: { follow: true }, cond: { maxFollow: 0, stopAt: 'yield' } } }); const r3 = CH.judge({ ...base, policy: P3, chaser: { sellerCode: '555', price: 9500 }, state: null, now: NOW, cur: 10000, base: 9500 }); ok(r3.t === 9800, '그만둔 뒤 양보를 고르면 다음 유효 매물 값'); }
{ // 불특정 되돌아가 2위: 추격자 8,000 · 가만히 있는 높은 판매자 10,000 (20% ≥ 15%) → 9,950
  const P = POL({ anon: { rules: { second: true, follow: true }, cond: { backPct: 15, quietH: 48 } } }); const page = pg([{ sc: '555', p: 8000, g: '상' }, { sc: '777', n: '조용', p: 10000, g: '상' }, { sc: '888', p: 10500, g: '상' }]);
  const ch = CH.find(page, { 555: { active: true } }, '상', P); const r = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: ch, page1: page, moves: {}, grade: '상', state: null, now: NOW, cur: 9000, base: 8000, yieldT: 10000, floor: 0, start: 10000 });
  ok(r.t === 9950 && r.state.name === 'second' && r.plan.rule === 'second', `2위로 되돌아감 9,950 (${r.t} · ${r.reasons[0]})`);
  const r2 = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: ch, page1: page, moves: { 777: '2026-11-02T00:00:00Z' }, grade: '상', state: null, now: NOW, cur: 9000, base: 8000, yieldT: 10000, floor: 0, start: 10000 });
  ok(r2.state.name === 'second' && r2.t === 10000 && r2.state.hsc === '888', `높은 판매자가 방금 값을 바꿨으면(가만히 있지 않음) 그다음 조용한 판매자(10,500) 한 단위 아래 (${r2.t})`);
  const page3 = pg([{ sc: '555', p: 9500, g: '상' }, { sc: '777', p: 10000, g: '상' }]); const r3 = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: { sellerCode: '555', price: 9500 }, page1: page3, moves: {}, grade: '상', state: null, now: NOW, cur: 10000, base: 9500, yieldT: 10000, floor: 0, start: 10000 });
  ok(r3.state.name === 'follow' && r3.t === 9500, `간격이 작으면(5%) 2위 대신 n회만 따르기 (${r3.state.name} ${r3.t})`); }
{ // 유동적 = 2위 → 따르기 → (기본 그림자) · 조건: 시간대·쉼·작은 차이·하한·재고 기간
  const P = POL({ sellers: { 111: { stance: 'flexible', cond: { backPct: 50 } } } }); const page = pg([{ sc: '111', p: 9000, g: '상' }, { sc: '222', p: 9900, g: '상' }]);
  const r = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: CH.find(page, {}, '상', P), page1: page, moves: {}, grade: '상', state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9900, floor: 0, start: 10000 }); ok(r.plan.stance === 'flexible' && r.state.name === 'follow', '유동적: 간격이 작으면 n회만 따르기');
  const Ph = POL({ sellers: { 111: { stance: 'aggressive', cond: { hours: '9-18' } } } }); const rh = CH.judge({ policy: Ph, groupStrat: {}, chaser: { sellerCode: '111', price: 9000 }, state: null, now: '2026-11-02T13:00:00Z' /* 22시 한국 */, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(rh.t === 10000 && rh.held === 'hours', '시간대 밖이면 움직이지 않음');
  const Pr = POL({ sellers: { 111: { stance: 'aggressive', strat: 'match', cond: { restH: 12 } } } }); const r1 = CH.judge({ policy: Pr, groupStrat: {}, chaser: { sellerCode: '111', price: 9000 }, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 });
  ok(r1.state.lastMoveAt === NOW, '값을 바꾸면 lastMoveAt 남김'); const r1b = CH.judge({ policy: Pr, groupStrat: {}, chaser: { sellerCode: '111', price: 8500 }, state: { ...r1.state, ourP: 9000 }, now: '2026-11-02T09:00:00Z', cur: 9000, base: 8500, yieldT: 9500, floor: 0, start: 10000 });
  ok(r1b.t === 9000 && r1b.held === 'rest', '쉼 12시간 안이면 다시 바꾸지 않음');
  const Pg = POL({ anon: { rules: { follow: true }, cond: { minGapPct: 3 } } }); const rg = CH.judge({ policy: Pg, groupStrat: {}, chaser: { sellerCode: '9', price: 9800 }, state: null, now: NOW, cur: 10000, base: 9800, yieldT: 9900, floor: 0, start: 10000 }); ok(rg.t === 10000 && rg.held === 'gap', '작은 차이(2%) 무시');
  const Pf = POL({ sellers: { 111: { stance: 'aggressive', cond: { minPrice: 9500 } } } }); const rf = CH.judge({ policy: Pf, groupStrat: {}, chaser: { sellerCode: '111', price: 9000 }, state: null, now: NOW, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 }); ok(rf.t === 9500, `최저가 하한 9,500 아래로 안 감 (${rf.t})`);
  const Pt = POL({ sellers: { 111: { stance: 'aggressive', cond: { maxTier: 'T3' } } } }); const rt = CH.judge({ policy: Pt, groupStrat: { name: 'match' }, chaser: { sellerCode: '111', price: 9000 }, state: null, now: NOW, tier: 'T5', cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 }); ok(rt.plan.rule === 'tier' && rt.state.name === 'match', '재고 기간이 넘으면 그룹 전략'); }
{ // 조건 묶음(같이 쓰는 조건): 판매자가 묶음을 쓰고 자기 칸으로 덮음
  const P = POL({ condSets: { c1: { name: '조심', cond: { maxFollow: 1, rangePct: 5 } } }, sellers: { 111: { stance: 'flexible', condSet: 'c1', cond: { rangePct: 20 } } } }); const c = CH.condOf(CH.normPolicy(P), P.sellers['111']); ok(c.maxFollow === 1 && c.rangePct === 20 && c.backPct === 15, '조건 묶음 + 판매자 칸 덮기'); }
// ③ 기록 줄
{ const P = POL({ anon: { rules: { follow: true } } }); const x = { key: 'aladin_1', usedCode: '1', bookId: 'b1', title: '책', now: NOW, cur: 10000, start: 10000, chaser: { sellerCode: '555', name: '을', price: 9500 } };
  const r = CH.judge({ policy: P, groupStrat: {}, chaser: x.chaser, state: null, now: NOW, cur: 10000, base: 9500, yieldT: 9800, floor: 0, start: 10000 }); const L = CH.logEntry(null, r, x);
  ok(L && L.sc === '555' && L.strat === 'follow' && L.from === 10000 && L.to === 9500 && L.day === '2026-11-02' && L.who === 'anon', '기록 한 줄: 누가·무엇을·우리가 무엇을');
  const r2 = CH.judge({ policy: P, groupStrat: {}, chaser: x.chaser, state: r.state, now: '2026-11-02T09:00:00Z', cur: 9500, base: 9500, yieldT: 9800, floor: 0, start: 10000 }); ok(CH.logEntry(r.state, r2, { ...x, cur: 9500, now: '2026-11-02T09:00:00Z' }) === null, '같은 판정이면 기록 안 함');
  const E = CH.episode(null, r, x); ok(E && E.id === 'aladin_1_20261102030000' && E.data.startP === 10000 && E.data.lastP === 9500, '전략 한 판 요약 문서');
  const end = CH.step({ strat: { name: 'follow' }, state: r.state, now: '2026-11-03T00:00:00Z', cur: 9500, base: 10000, chaser: null }); ok(end.state.end === 'chaserGone' && CH.logEntry(r.state, end, { ...x, chaser: null }).end === 'chaserGone', '추격자가 사라지면 끝 기록');
  const pf = CH.perf([E.data, { ...E.data, key: 'aladin_2', strat: 'yield', startP: 8000 }], (k) => (k === 'aladin_1' ? [{ ms: Date.parse('2026-11-05T03:00:00Z'), p: 9500 }] : []), (k) => (k === 'aladin_1' ? 4000 : null));
  const f = pf.find((y) => y.k === 'follow'); ok(f.sold === 1 && Math.round(f.daysMed) === 3 && f.saleRatio === 0.95 && f.profit === 5500 && pf.find((y) => y.k === 'yield').sold === 0, '성과: 판매까지 3일 · 판매가 ÷ 시작 95% · 이익 5,500'); }
console.log(`tCHeng: ${n - bad}/${n} 통과`); process.exit(bad ? 1 : 0);
