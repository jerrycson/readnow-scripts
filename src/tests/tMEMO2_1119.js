// tMEMO2_1119 — (11/19 정범님 I-1119-0007-01.2 「이걸 전부 구현해서 적용해줘」) 📝 판단 메모를 실제로 쓰는 일곱 길 + memo1 남은 일
//  ① 규칙·울타리(출판사 범위 pub) ② 엔진이 못 보는 요인(factor) ③ 가설 채점(score — 지난 판매·시장 매물만 · 헌장 제43조) ④ 예외(exc)
//  ⑤ 비슷한 상품 메모(similar) ⑥ 값 바꾼 내력(timeline) ⑦ 엔진이 틀린 사례(wrongCases) · 남은 일: 값 판정 valueRec가 메모를 읽음 · 클라우드 쓰임 기록·매일 대조 · 재고 품목 카드
//  돈 안전 한도(최대 인하·최소 판매가)는 메모보다 늘 앞 · 값을 낮추는 규칙은 맞음 뒤에만 · 시험 자료에 손님 정보·판매자 실명·메모 실제 글 없음
// 실행: node tMEMO2_1119.js
const fs = require('fs'); const path = require('path');
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((d) => fs.existsSync(path.join(d, 'readnow-pricing-core.js')));
const SRC = [path.resolve(__dirname, '..'), path.join(ROOT, 'src')].find((d) => fs.existsSync(path.join(d, 'app.html')));
const PRC = require(path.join(ROOT, 'readnow-pricing-core.js')); const ML = require(path.join(ROOT, 'readnow-ml-core.js'));
const M = PRC.Memo;
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const L = { grade: '상', price: 10000, priceList: 15000, usedCode: 'U1', registeredAt: '2026-10-01' };
const row = (p, c, sc, n) => ({ c, g: '상', p, s: 0, n: n || c, sc: sc || null });
const crit = { mode: 'same', maxDrop: 40, minPrice: 1000 };
const ctx = (memos) => ({ now: Date.now(), policy: {}, memos });
const mm = (text, o) => ({ id: 'lid:U1:price', scope: 'lid', key: 'U1', kind: 'price', text, ...(o || {}) });
const P1 = [row(6000, 'green', 'S1', '가게가')];

console.log('① 출판사 범위(pub) — 「이 출판사는 ○원 밑으로 안 내림」');
{ const pm = { id: 'pub:출판A:price', scope: 'pub', key: '(주)출판 A', kind: 'price', text: '8천원 밑으로 내리지 마' };
  const I = M.index([pm]); ok(M.forItem(I, { lid: 'x', pub: '출판A' }).length === 1, '출판사 이름 띄어쓰기·(주)가 달라도 같은 출판사로 찾음');
  ok(M.forItem(I, { lid: 'x', pub: '출판B' }).length === 0, '다른 출판사엔 안 걸림');
  const c = PRC.critTarget(L, P1, {}, crit, ctx(M.forItem(I, { lid: 'U1', pub: '출판A' }))); ok(c.t === 8000, '출판사 바닥 메모 → 8,000원', c.t); }

console.log('② 엔진이 못 보는 요인(factor)');
{ const p = M.parse('사은품 엽서 있음'); ok(p.rules[0] && p.rules[0].k === 'factor' && p.rules[0].f === 'gift' && p.rules[0].dir === '+' && !p.need.length, '「사은품 엽서 있음」 → 요인 사은품 ↑ (사람 확인 필요 아님)', p);
  ok(M.parse('얼룩 있음').rules[0].dir === '-' && M.parse('부록 CD 없음').rules[0].dir === '-', '얼룩·부록 없음 → 요인 ↓');
  const c = PRC.critTarget(L, P1, {}, crit, ctx([mm('수능 철이라 찾는 사람 많음')])); ok(c.t === 10000 && c.memoHold === 'factor', '값을 받치는 요인 ↑ → 저절로 내리지 않음(지금 10,000원)', { t: c.t, h: c.memoHold });
  const c2 = PRC.critTarget(L, P1, {}, crit, ctx([mm('얼룩 있음')])); ok(c2.t === 6000 && c2.reasons.some((x) => /엔진이 못 보는 요인/.test(x)), '깎을 요인 ↓ → 알림만(엔진 값 6,000원 그대로 · 더 내리지 않음)', { t: c2.t });
  ok(c.memo && c.memo.eng === 6000 && c.memo.factors.includes('season+'), 'out.memo.eng = 메모 앞 엔진 값 6,000원', c.memo); }

console.log('④ 예외(exc) — 엔진이 따로 다룸');
{ const c = PRC.critTarget(L, P1, {}, crit, ctx([mm('이 상품은 예외로 따로 다룸')])); ok(c.t === 10000 && c.memoHold === 'exc' && c.memoExc === true, '예외 → 엔진 값 안 씀 · 지금 가격 그대로 · memoExc', { t: c.t, h: c.memoHold });
  const e = ML.evalSale({ p: 5000, g: '상', rows: [row(6000, 'green', 'S1')], memo: M.digest([mm('예외로 따로 관리')]) }); ok(e.memoStop && /예외/.test(e.verdict), '판매가 평가 → memoStop(자동 출고 사람 검토)', e); }

console.log('돈 안전 한도가 언제나 앞(메모보다)');
{ const c = PRC.critTarget(L, [row(3000, 'green', 'S1')], {}, { ...crit, maxDrop: 10 }, ctx([mm('얼룩 있음')])); ok(c.t >= 9000, '최대 인하 10% → 9,000원 밑으로 안 감', c.t);
  const c2 = PRC.critTarget(L, P1, {}, crit, ctx([mm('5천원으로 팔아')])); ok(c2.t === 6000 && c2.reasons.some((x) => /확인 전/.test(x)), '맞음 전 낮추는 메모는 안 씀(엔진 6,000원 그대로 · 확인 전 알림)', c2.t); }

console.log('③ 가설 채점(score) — 지난 판매·시장 매물로만');
{ const now = Date.parse('2026-11-19T00:00:00Z'); const D = (n) => new Date(now - n * 864e5).toISOString(); const m = mm('8천원 밑으로 내리지 마');
  ok(M.dirOf(m) === 'keep' && M.dirOf(mm('천장 9000원')) === 'cut' && M.dirOf(mm('리커버라 다른 상품')) === 'mkt', 'dirOf: keep · cut · mkt');
  const ctrl = (k, s) => Array.from({ length: k }, (_, i) => ({ k: 'c' + i, sold: i < s }));
  let r = M.score({ memo: m, items: [{ k: 'a', at: D(40), sold: true, soldAt: D(30) }, { k: 'b', at: D(40), sold: true, soldAt: D(20) }], ctrl: ctrl(10, 5), now }); ok(r.verdict === 'hit' && r.rateM === 1, '값을 지켰는데도 다 팔림 → 맞음', r);
  r = M.score({ memo: m, items: [{ k: 'a', at: D(40) }, { k: 'b', at: D(40) }, { k: 'c', at: D(40) }], ctrl: ctrl(10, 6), now }); ok(r.verdict === 'miss', '하나도 안 팔림·대조 60% → 틀림', r);
  r = M.score({ memo: m, items: [{ k: 'a', at: D(5) }], ctrl: ctrl(10, 6), now }); ok(r.verdict === 'wait', '30일 안 참 → 기다림', r);
  r = M.score({ memo: m, items: [{ k: 'a', at: D(40) }], ctrl: ctrl(2, 1), now }); ok(r.verdict === 'na', '대조 3개 미만 → 판단 못 함', r);
  const pool = [{ k: 'p1', pub: '출판A', price: 9500 }, { k: 'p2', pub: '출판A', price: 20000 }, { k: 'p3', pub: '출판B', cat: '소설', price: 10000 }, { k: 'a', pub: '출판A', price: 10000 }];
  const C = M.pickCtrl({ k: 'x', pub: '출판A', cat: '소설', price: 10000 }, pool, { keys: new Set(['a']) }); ok(C.map((c) => c.k).join() === 'p1,p3', '대조 = 같은 출판사/분야 · 값 ±20% · 메모 상품 뺌', C); }

console.log('⑤ 비슷한 상품 메모(similar)');
{ const L2 = [{ id: 'm1', scope: 'lid', key: 'K1', text: '8천원 밑으로 내리지 마', title: '어떤 이야기 1', pub: '출판A' }, { id: 'm2', scope: 'lid', key: 'K2', text: '그대로', title: '전혀 다른 책', pub: '출판C' }, { id: 'm3', scope: 'lid', key: 'K3', text: '그대로', title: '어떤 이야기 2', off: true }];
  const s = M.similar(L2, { title: '어떤 이야기 3', pub: '출판A', key: 'K9' }); ok(s.length === 1 && s[0].m.id === 'm1' && /시리즈/.test(s[0].why), '같은 시리즈 메모를 찾음 · 꺼진 메모·다른 책은 뺌', s.map((x) => [x.m.id, x.sim, x.why]));
  ok(M.similar(L2, { title: '어떤 이야기 1', key: 'K1' }).length === 0, '이미 이 상품에 걸린 메모는 뺌'); }

console.log('⑥ 값 바꾼 내력(timeline)');
{ const m = { id: 'm1', at: '2026-11-18T01:00:00Z', byName: '사람A', text: '그대로', hist: [{ at: '2026-11-18T02:00:00Z', by: 'a@x', what: '고침 — 옛 글', text: '옛' }], use: { K1: { at: '2026-11-18T03:00:00Z', src: 'cloud', from: 10000, to: 10000, eng: 8000, why: 'w' } } };
  const T = M.timeline([m], 'K1', { changes: [{ at: '2026-11-18T04:00:00Z', by: 'b@x', from: 10000, to: 9000, why: '사람' }] });
  ok(T.length === 4 && T[0].what === '💲 값 바꿈' && T[1].who === '클라우드' && T[1].eng === 8000, '메모 적음·고침·엔진 판정(클라우드·엔진 값)·사람 값 바꿈 — 새것 먼저', T); }

console.log('⑦ 엔진이 틀린 사례(wrongCases)');
{ const m = { id: 'm1', text: '8천원 밑으로 내리지 마', use: { K1: { at: '2026-11-18T03:00:00Z', from: 10000, to: 8000, eng: 6000 }, K2: { at: '2026-11-18T03:00:00Z', from: 10000, to: 9000, eng: 9000 } } };
  let W = M.wrongCases([m], { m1: { verdict: 'hit' } }); ok(W.length === 1 && W[0].k === 'K1' && W[0].state.startsWith('엔진이 틀림') && W[0].eng === 6000, '메모가 엔진 값을 바꿨고 채점이 맞음 → 엔진이 틀린 사례', W);
  ok(M.wrongCases([m], { m1: { verdict: 'miss' } }).length === 0, '메모가 틀렸으면 사례에서 뺌');
  ok(!JSON.stringify(W).includes('내리지 마'), '사례에는 메모 글을 넣지 않음(규칙 종류만)'); }

console.log('남은 일 ① 값 판정(valueRec)이 메모를 읽음');
{ const x = { grade: '상', sp: 100, used: 5, list: 15000, rows: [row(6000, 'green', 'S1'), row(6500, 'green', 'S2')], cur: 10000 };
  const v0 = ML.valueRec(x, null, {}, {}); const v1 = ML.valueRec({ ...x, memo: M.digest([mm('8천원 밑으로 내리지 마')]) }, null, {}, {});
  ok(v0.price < 8000 && v1.price === 8000 && /메모 반영됨/.test(v1.how), '바닥 메모 → 값 판정도 8,000원', [v0.price, v1.price, v1.how]);
  const v2 = ML.valueRec({ ...x, memo: M.digest([mm('리커버라 다른 상품')]) }, null, {}, {}); ok(v2.price === 10000 && v2.memoStop, '다른 상품 → 시장 값 안 씀(지금 가격) · memoStop', [v2.price, v2.memoStop]);
  const v3 = ML.valueRec({ ...x, memo: M.digest([mm('S1 판매자 허위 재고라 빼', { ref: { sc: 'S1' } })]) }, null, {}, {}); ok(v3.sameMin === 6500, '메모로 뺀 판매자 매물은 견주지 않음', v3.sameMin);
  const v4 = ML.valueRec({ ...x, memo: M.digest([mm('5천원으로 팔아')]) }, null, {}, {}); ok(v4.price !== 5000, '맞음 전 낮추는 메모는 값 판정에도 안 씀', v4.price); }

console.log('소스 자리(웹앱·클라우드·수집기)');
{ const app = fs.readFileSync(path.join(SRC, 'app.html'), 'utf8'); const cl = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
  ok(/function vrEval[\s\S]{0,1500}memo:/.test(app), '웹앱 vrEval이 메모 묶음을 넘김');
  ok(/jmemoHtml\(\{ l[^}]*kind: 'stock'/.test(app), '재고 품목 카드에 📝 칸');
  ok(/M\.similar\(/.test(app) && /M\.timeline\(/.test(app) && /M\.score\(/.test(app) && /M\.wrongCases\(/.test(app), '웹앱이 비슷한 메모·내력·채점·틀린 사례를 씀');
  ok(/jm_read/.test(app) && /jm_audit/.test(cl), '매일 대조 — 웹앱 jm_read · 클라우드 jm_audit');
  ok(/function jmUseCloud/.test(cl), '클라우드 자동 출고 memoStop → 쓰임 기록');
  ok(!/\balert\(|\bconfirm\(/.test(app.slice(app.indexOf('const JM_COL'), app.indexOf('function batchCompute('))), '메모 덩어리에 브라우저 팝업 없음'); }

console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
