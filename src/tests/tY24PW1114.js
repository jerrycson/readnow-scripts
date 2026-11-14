// tY24PW1114 — (11/14 일꾼 y24ops1) 🟦 예스24 운영: 🛰 가격 감시 결정 대기(판정·하루 한도·시험 1건 고르기) · 🔁 재고 돌아오면 판매재개 · ❓ 문의·반품 알림 — 순수 셈만(app.html ◆y24pw·◆y24up·◆y24qa 덩어리)
// 실행: node src/tests/tY24PW1114.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x ? String(x).slice(0, 300) : ''); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const fnOf = (name) => { const i = T.indexOf('function ' + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0, k = T.indexOf('{', i); for (let j = k; j < T.length; j++) { if (T[j] === '{') d++; else if (T[j] === '}') { d--; if (!d) return T.slice(i, j + 1); } } throw new Error('끝 없음 ' + name); };
const F = new Function(cut('/* ◆y24pw 시작', '/* ◆y24pw 셈 끝 */') + "\nconst Y24UP_DEF = { on: 1, days: 3, max: 10 };\n" + fnOf('y24UpPlan') + '\n' + fnOf('y24QaAlertOf') + '\nreturn { Y24PW_DEF, y24PwCfg, y24PwJudge, y24PwGate, y24PwTestPick, y24PwDay, y24UpPlan, y24QaAlertOf };')();
console.log('① 설정');
{ const c = F.y24PwCfg({ y24: { pw: { dayLoss: '5000', dayN: 2, chunk: 99, test: 0 } } }); ok(c.dayLoss === 5000 && c.dayN === 2 && c.chunk === 30 && c.test === 0, '설정 칸(하루 내림 합계·하루 건수·한 맡김 30줄까지·시험 끔)'); const d = F.y24PwCfg(null); ok(d.dayLoss === 100000 && d.dayN === 300 && d.test === 1, '기본값(하루 내림 10만 원 · 300건 · 시험 켬)'); }
console.log('② 판정 — 알라딘 감시기와 같은 틀(y24PriceOf 결과)');
{ const J = F.y24PwJudge; ok(J(10000, { price: 9000, mode: 'match', t: '유효 동급 최저' }).k === 'down' && J(10000, { price: 9000, mode: 'match' }).d === -1000, '유효 동급 최저가 더 쌈 → 내림');
  ok(J(8000, { price: 9600, mode: 'solo', t: '우리뿐 +20%' }).k === 'up', '우리뿐 +20% → 올림(하루 올림 상한 없음 · F45)');
  ok(J(8000, { price: 8000, mode: 'noData' }).k === 'same' && J(8000, { price: 8004, mode: 'match' }).k === 'same', '같음(10원 아래 차이) → 그대로');
  ok(J(8000, { price: null, sug: 5000, mode: 'stop', t: '⛔ 사람 확인' }).k === 'stop' && J(8000, { price: null, sug: 5000, mode: 'stop' }).to === 5000, '25% 넘게 쌈(멈춤) → 사람 확인(제안 값 · 미리 고르지 않음)');
  ok(J(8000, { mode: 'hold', price: null, t: '🔒' }).k === 'hold' && J(8000, null).k === 'none' && J(0, { price: 9000, mode: 'match' }).k === 'none', '약속 36 울타리 → 안 바꿈 · 판정 없음 · 지금 값 모름');
  ok(J(10000, { price: 4000, mode: 'match' }).k === 'jump' && J(10000, { price: 16000, mode: 'solo' }).k === 'jump', '50% 넘게 바뀜 → 고르지 못함(번외도 안 누름)');
  ok(J(10000, { price: 9994, mode: 'match' }).to === 9990, '10원 단위'); }
console.log('③ 하루 한도 — 실행 전에 막음(헌장 제8조)');
{ const day = '2026-11-14'; const cfg = { dayLoss: 2500, dayN: 4 }; const sel = [{ no: 'a', cur: 10000, to: 9000 }, { no: 'b', cur: 5000, to: 6000 }, { no: 'c', cur: 8000, to: 6500 }, { no: 'd', cur: 7000, to: 6500 }];
  const G = F.y24PwGate(sel, { day, loss: 500, n: 0 }, cfg, day); ok(G.ok.map((r) => r.no).join() === 'a,b,d' && G.over.map((r) => r.no).join() === 'c' && G.loss === 2000 && G.n === 3 && /내림 합계/.test(G.why), '오늘 이미 내린 500원 + 1,000원(a) · 올림(b)은 셈 안 함 · 1,500원(c)은 2,500원 넘어 막음 · d는 들어감', JSON.stringify(G));
  const G2 = F.y24PwGate(sel, { day: '2026-11-13', loss: 2900, n: 3 }, cfg, day); ok(G2.ok.length === 3 && G2.n === 3, '어제 쓴 몫은 오늘 셈에 안 들어감');
  const G3 = F.y24PwGate(sel, { day, loss: 0, n: 4 }, cfg, day); ok(G3.ok.length === 0 && /4건/.test(G3.why), '하루 건수를 다 쓰면 아무것도 안 보냄'); }
console.log('④ 🧪 판매가 길 시험 1건 고르기(+10원 → 되돌림)');
{ const P = F.y24PwTestPick([{ no: '1', cur: 900, self: 'A' }, { no: '2', cur: 3000, self: '' }, { no: '3', cur: 5000, self: 'B', held: true }, { no: '4', cur: 4000, self: 'C' }, { no: '5', cur: 2000, self: 'D' }]); ok(P && P.no === '5', '1,000원 이상 · 자체코드 있음 · 주문 진행 중 아님 · 가장 싼 것', JSON.stringify(P)); ok(F.y24PwTestPick([]) === null, '고를 것 없음'); }
console.log('⑤ 🔁 재고 돌아오면 예스24 판매재개');
{ const now = '2026-11-14T10:00:00Z'; const e = { key: 'SKU1', ch: 'yes24', k: 'down', to: 0, no: '195000001', self: 'SKU1', st: 'sent', at: '2026-11-13T09:00:00Z', title: '시험 책' };
  const row = (o) => ({ key: 'SKU1', title: '시험 책', sku: 'SKU1', ch: { aladin: { live: true, qty: 1, id: 'aladin_U1' } }, mc: { P: 1, sold: 0, rem: 1, acts: [], over: false }, y24c: [{ no: '195000001', self: 'SKU1', live: false }], ord: {}, ...o });
  const L = F.y24UpPlan({ log: [e], rows: [row()], now }); ok(L.length === 1 && L[0].a.k === 'up' && L[0].a.no === '195000001' && /알라딘이 다시 판매중/.test(L[0].a.why), '자동 내림으로 판매중지한 예스24 · 알라딘 다시 판매중 · 남은 실물 1 → 판매재개', JSON.stringify(L));
  ok(F.y24UpPlan({ log: [e], rows: [row({ ch: { aladin: { live: false } } })], now }).length === 0, '알라딘이 판매중이 아니면 안 엶');
  ok(F.y24UpPlan({ log: [e], rows: [row({ mc: { rem: 0, acts: [], over: false } })], now }).length === 0, '남은 실물 0(다른 곳 주문이 셈에 있음) → 안 엶');
  ok(F.y24UpPlan({ log: [e], rows: [row({ mc: { rem: 1, acts: [{ ch: 'naver', k: 'down' }], over: false } })], now }).length === 0, '그 실물에 내릴 일이 남았으면 안 엶');
  ok(F.y24UpPlan({ log: [e], rows: [row({ ord: { shop: { n: 1, last: '2026-11-13T12:00:00Z' } } })], now }).length === 0, '내린 뒤 새 주문이 있으면 안 엶');
  ok(F.y24UpPlan({ log: [e], rows: [row({ y24c: [{ no: '195000001', live: false }, { no: '195000009', live: true }] })], now }).length === 0, '이어진 다른 예스24 매물이 판매중이면 안 엶(이중 판매 막이)');
  ok(F.y24UpPlan({ log: [{ ...e, st: 'fail' }], rows: [row()], now }).length === 0 && F.y24UpPlan({ log: [{ ...e, k: 'qty', to: 1 }], rows: [row()], now }).length === 0 && F.y24UpPlan({ log: [{ ...e, ch: 'aladin' }], rows: [row()], now }).length === 0, '맡김이 실패했거나 수량 줄이기·알라딘 기록이면 안 엶');
  ok(F.y24UpPlan({ log: [{ ...e, at: '2026-11-01T00:00:00Z' }], rows: [row()], now }).length === 0, '3일 넘은 기록은 안 봄(무엇을 내렸는지 모름)');
  const rk = L[0].rk; ok(F.y24UpPlan({ log: [e], rows: [row()], now, done: new Set([rk]) }).length === 0, '같은 내림 기록은 한 번만(되풀이 0)'); }
console.log('⑥ ❓ 문의·반품 알림');
{ const A = F.y24QaAlertOf({ qa: 2, ret: 1 }); ok(A.length === 2 && A[0].k === 'qa' && /미답변 문의 2건/.test(A[0].t) && A[1].lv === 'red', '미답변 문의·반품 요청 → 홈 알림'); ok(F.y24QaAlertOf({ qa: 0, ret: null }).length === 0 && F.y24QaAlertOf(null).length === 0, '없으면 알림 없음'); }
console.log(bad ? `❌ tY24PW1114 실패 ${bad}` : '✓ tY24PW1114 모두 통과'); process.exit(bad ? 1 : 0);
