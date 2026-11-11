// tY24REG — (11/10) 📤 예스24에 새로 올리기(알라딘 → 예스24 바코드용 대량 등록 엑셀) · 🧾 통합 장부(읽기 전용)
//   ① 순수 셈: 웹앱 app.html의 ◆y24reg·◆ledger 덩어리만 떼어 돌림 — 후보 고르기·까닭 · 되풀이 0(장부·SKU) · 처음엔 한 건씩 · 올라감 판정 · 엑셀 칸 · 통합 장부 합계·위험
//   ② 화면(RN_PORT가 있을 때): harness로 웹앱을 열어 📤 화면·1건 미리 보기·두 번 누르기(한 번은 아무것도 안 함)·장부 기록·두 번째 확정 막힘 · 🧾 통합 장부 화면 · 브라우저 창(alert/confirm) 0
// 실행: node src/tests/tY24REG.js  · 화면까지: RN_PORT=<포트> node tY24REG.js (pw/ 안 · harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { Y24R_BAN, Y24R_DEF, Y24R_HEAD, y24RegCfg, y24RegPrice, y24RegState, y24RegGate, y24RegJudge, y24RegAoa, y24RegFilter, ledBuild };')();
console.log('① 순수 셈');
{ const c = F.y24RegCfg({ day: '0', pct: 99, staleDays: 'x' }); ok(c.day === 0 && c.pct === 50 && c.staleDays === F.Y24R_DEF.staleDays && F.y24RegCfg({ day: 999 }).day === 300 && F.Y24R_DEF.day === 0, '설정 울타리(하루 상한 0=없음(기본 · 정범님 11/10)~300 · ±50% · 날 수 기본값)'); ok(F.y24RegPrice(12345, 0) === 12350 && F.y24RegPrice(10000, -10) === 9000 && F.y24RegPrice(0, 0) === 0, '판매가 10원 단위 · ±%'); }
const L = (o) => ({ id: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, skus: ['A01BC123PK'], dupes: false, adult: false, ...o });
const X0 = () => ({ onY24: new Map(), selfSet: new Set(), led: {}, ledSku: new Set(), cfg: F.Y24R_DEF });
{ const j = F.y24RegJudge(L(), X0()); ok(j.ok && j.row.isbn === '9788900000001' && j.row.self === 'A01BC123PK' && j.row.price === 8000 && j.row.qty === 1, '판매중·ISBN·등급·SKU 있음 → 올릴 줄(자체코드 = SKU)');
  const why = (o, X) => F.y24RegJudge(L(o), X || X0()).why || '';
  ok(/판매중 아님/.test(why({ live: false })) && /DUPES/.test(why({ dupes: true })) && /ISBN/.test(why({ isbn: null })) && /등급/.test(why({ grade: null })) && /판매가/.test(why({ price: 0 })) && /SKU 없음/.test(why({ skus: [] })) && /19금/.test(why({ adult: true })), '못 올리는 까닭 7가지(판매중 아님·미끼·ISBN·등급·판매가·SKU·19금)');
  ok(/새 책/.test(why({ title: '새책 같은 상태' })) && /새 책/.test(why({ title: '미개봉 박스' })) && F.y24RegJudge(L({ title: '새로운 시작' }), X0()).ok, "'새 책' 뜻 낱말은 막고 '새로운'은 통과");
  const X = X0(); X.led['aladin_U1'] = { st: 'sent', at: '2026-11-10T01:00:00Z' }; ok(/이미 올림/.test(why({}, X)), '되풀이 0 ① 장부에 있는 상품은 빠짐');
  const X2 = X0(); X2.led['aladin_U1'] = { st: 'retry', at: '2026-11-10T01:00:00Z' }; ok(F.y24RegJudge(L(), X2).ok, "사람이 '다시 올릴 수 있게' 푼 줄은 다시 후보");
  const X3 = X0(); X3.ledSku.add('A01BC123PK'); ok(/같은 SKU/.test(why({ id: 'aladin_U2' }, X3)), '되풀이 0 ② 다른 줄이라도 같은 SKU는 빠짐');
  const X4 = X0(); X4.selfSet.add('A01BC123PK'); ok(/자체코드/.test(why({}, X4)), '예스24 자체코드에 이미 있는 SKU는 빠짐');
  const X5 = X0(); X5.onY24.set('9788900000001|상', ['200000001']); ok(/같은 책·등급/.test(why({}, X5)) && F.y24RegJudge(L({ grade: '최상' }), X5).ok, '예스24에 같은 ISBN·등급이 있으면 빠짐(등급이 다르면 후보)');
  ok(F.y24RegJudge(L({ qty: 3, skus: ['S1', 'S2'] }), { ...X0(), cfg: { ...F.Y24R_DEF, maxQty: 5 } }).row.qty === 2, '재고 = 실물 SKU 수를 넘지 않음');
  ok(F.y24RegJudge(L({ qty: 3, skus: ['S1', 'S2', 'S3'] }), X0()).row.qty === 1 && F.y24RegJudge(L({ qty: 3, skus: ['S1', 'S2', 'S3'] }), X0()).row.self === 'S1' && F.Y24R_DEF.maxQty === 1 && F.y24RegCfg({ maxQty: 99 }).maxQty === 10, '(y24ui) 예스24 수량 상한 기본 1권(Max Listed) · 1~10');
  ok(/주문 진행 중/.test(why({ held: '주문 12345678' })), '(y24ui) 최근 주문에 들어온 상품(실물이 묶임)은 올리지 않음');
  ok(F.y24RegJudge(L({ unpub: { until: '2027-01-01' } }), X0()).row.unpub.until === '2027-01-01', '(y24ui) 미출간 표시가 올릴 줄에 따라감(막지는 않음)'); }
{ const aoa = F.y24RegAoa([{ isbn: '9788900000001', qty: 1, grade: '상', price: 8000, title: '시험 책(새책급)', self: 'A01BC123PK' }]);
  ok(aoa.length === 28 && aoa[26].slice(1).join('|') === F.Y24R_HEAD.join('|') && aoa[27][1] === '9788900000001' && aoa[27][7] === 'A01BC123PK' && aoa[27][4] === 8000 && !/새책/.test(aoa[27][5]) && aoa[27][10] === 1 && aoa[27][11] === 1, '엑셀: 27행 머리 B~L · 28행 바코드·재고·등급·판매가·상품명(금지 낱말 지움)·자체코드·판매상태·판매형태');
  const head = (T.match(/const Y24_XH = (\[[^\]]+\])/) || [])[1]; ok(head && JSON.stringify(eval(head)) === JSON.stringify(F.Y24R_HEAD), '🔗 연결 표 1줄 시험 엑셀과 같은 머리 칸'); }
{ const R = [{ lid: 'a', skus: ['S1'] }, { lid: 'b', skus: ['S2'] }, { lid: 'c', skus: ['S1'] }, { lid: 'd', skus: ['S3'] }]; const f = F.y24RegFilter(R, { b: { st: 'sent', skus: ['S2'] }, x: { st: 'retry', skus: ['S3'] } });
  ok(f.ok.map((r) => r.lid).join() === 'a,d' && f.skip.map((r) => r.lid).join() === 'b,c', '확정 직전 다시 보기: 장부 상품(b)·같은 묶음 안 같은 SKU(c) 뺌 · 풀린 줄의 SKU(d)는 됨'); }
{ const now = '2026-11-12T03:00:00Z'; const e = { lid: 'a', isbn: '9788900000001', grade: '상', skus: ['S1'], at: '2026-11-10T01:00:00Z', st: 'sent', before: ['111'] };
  ok(F.y24RegState(e, { adm: [], pub: [] }, '2026-11-10T05:00:00Z').k === 'wait', '올린 직후: 기다림');
  ok(F.y24RegState(e, { adm: [{ no: '222', ean: 'x', self: 'S9, S1', at: '2026-11-10T00:00:00Z' }], pub: [] }, now).k === 'listed', '자체코드 = 우리 SKU면 올라감(언제 읽었든)');
  ok(F.y24RegState(e, { adm: [], pub: [{ no: '333', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-11T00:00:00Z' }] }, now).gno === '333', '같은 ISBN·등급 새 매물(올린 뒤 처음 보임)이면 올라감');
  ok(F.y24RegState(e, { adm: [], pub: [{ no: '111', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-11T00:00:00Z' }, { no: '444', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-09T00:00:00Z' }] }, '2026-11-10T05:00:00Z').k === 'wait', '올리기 전부터 있던 매물·예전 매물은 판정에 안 씀');
  ok(F.y24RegState(e, { adm: [], pub: [] }, '2026-11-14T03:00:00Z').k === 'stale' && F.y24RegState({ ...e, ok: 1 }, { adm: [], pub: [] }, now).k === 'listed', '3일 지나도 안 보이면 확인 필요 · 사람 확인이면 올라감');
  const G0 = F.y24RegGate({}, { adm: [], pub: [] }, now); const G1 = F.y24RegGate({ a: e }, { adm: [], pub: [] }, '2026-11-10T05:00:00Z'); const G2 = F.y24RegGate({ a: { ...e, ok: 1 }, b: { ...e, lid: 'b', at: '2026-11-12T01:00:00Z', day: '2026-11-12' } }, { adm: [], pub: [] }, now, { ...F.Y24R_DEF, day: 5 });
  ok(G0.mode === 'first' && G0.max === 1 && G1.mode === 'wait' && G1.max === 0 && G2.mode === 'bulk' && G2.max === 4, '처음엔 한 건씩: 비었으면 1건 → 결과 전엔 0건 → 올라간 뒤 하루 상한 − 오늘 올린 수'); }
{ const V = F.ledBuild({ now: '2026-11-10T03:00:00Z', days: 30, fee: { yes24: 0.1 },
    al: [{ id: 'aladin_U1', title: '책1', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U2', title: '책2', isbn: '9788900000002', grade: '중', price: 5000, qty: 1, live: true, st: '판매중', skus: ['S2'] }, { id: 'aladin_U3', title: '책3', price: 3000, qty: 1, live: false, st: '판매중지', skus: [] }],
    y24: [{ no: '900', title: '책1', isbn: '9788900000001', grade: '상', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '901', title: '책9', isbn: '9788900000009', grade: '최상', price: 9000, stock: 1, live: true, self: '', alIds: [], flags: [] }, { no: '902', title: '책2', isbn: '9788900000002', grade: '중', price: 5000, stock: 2, live: true, self: '', alIds: ['aladin_U2'], flags: ['red', 'orange'] }],
    ord: [{ ch: 'aladin', no: 'o1', at: '2026-11-05T00:00:00Z', amt: 10000, fee: 1080, lines: [{ lid: 'aladin_U1', qty: 1, amt: 10000 }] }, { ch: 'yes24', no: 'y1', at: '2026-11-06T00:00:00Z', amt: 9000, lines: [{ sku: 'S2', qty: 1, amt: 9000 }] }, { ch: 'yes24', no: 'y0', at: '2026-09-01T00:00:00Z', amt: 7000, lines: [] }, { ch: 'cash', no: 'c1', at: '2026-11-07T00:00:00Z', amt: 3000, fee: 0, lines: [] }, { ch: 'yes24', no: 'y2', at: '2026-11-08T00:00:00Z', amt: 5000, cancel: true, lines: [] }],
    reg: [{ lid: 'aladin_U2', st: 'sent', k: 'wait' }, { lid: 'aladin_U3', st: 'retry' }] });
  const r1 = V.rows.find((r) => r.key === 'S1'); const r2 = V.rows.find((r) => r.key === 'S2'); const r9 = V.rows.find((r) => r.key === 'y24:901');
  ok(V.rows.length === 4 && r1.ch.yes24 && r1.ch.yes24.no === '900' && r2.ch.yes24.no === '902' && r9 && !r9.ch.aladin, '예스24 매물을 자체코드 = SKU → 🔗 짝 순서로 붙이고, 짝 없는 것은 따로 한 줄');
  ok(V.n.both === 2 && V.n.onlyY === 1 && V.n.none === 1 && V.n.onlyAl === 0, '어디에 올라 있나 셈(둘 다 2 · 예스24만 1 · 판매 안 함 1)');
  ok(r2.risk.includes('이중 판매 위험') && r2.risk.includes('예스24 재고 많음') && V.n.reg === 1, '위험(🔗 연결 표 깃발) · 📤 올림 중(풀린 줄은 셈 안 함)');
  /* (y24ui) 예전엔 판매처 수량을 더해(알라딘 1 + 예스24 1) 알라딘에서 1권 팔린 책1을 위험으로 못 봤음 → 실물 수 기준으로 책1도 🔻 예스24 내리기 */
  ok(r1.mc.P === 1 && r1.mc.rem === 0 && r1.mc.acts.some((a) => a.ch === 'yes24' && a.k === 'down') && r1.risk.includes('이중 판매 위험') && V.n.risk === 2 && V.n.down === 2, '(y24ui) 실물 수 기준: 알라딘에서 팔린 1권 → 예스24 내리기(판매처 수량을 더하지 않음)');
  ok(r2.mc.acts.some((a) => a.ch === 'aladin' && a.k === 'down') && r2.mc.acts.some((a) => a.ch === 'yes24'), '(y24ui) 예스24에서 팔린 1권 → 알라딘도 내리기');
  const s = V.sum; ok(s.aladin.ord === 1 && s.aladin.fee === 1080 && s.aladin.net === 8920 && s.yes24.ord === 1 && s.yes24.fee === 900 && s.yes24.net === 8100 && s.yes24.cancel === 1 && s.cash.amt === 3000 && s.cash.fee === 0, '판매처별 30일 주문·수수료(예스24 10%)·정산 어림 · 30일 밖·취소 뺌');
  ok(s.aladin.live === 2 && s.aladin.val === 13000 && s.yes24.live === 3 && s.yes24.qty === 4, '판매처별 판매중 줄·권·금액');
  ok(r1.ord.aladin.n === 1 && r2.ord.yes24.n === 1, '주문 줄을 상품(id)·SKU로 장부 줄에 붙임'); }
{ /* (y24ui) 판매처 목록 · 미출간 · 여러 판매처 안전 셈 */ const G = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { chList, CH_DEF, y24Unpub, mcPlan, ledBuild, MC_DAYS };')();
  const C = G.chList({ yes24: { fee: 0.12, n: '예스24' }, naver: { on: 1 }, coupang: { n: '쿠팡', on: 0, ord: 9 }, 'Bad Key': { n: 'x' }, aladin: { on: 0 } });
  ok(C.map((c) => c.k).join() === 'aladin,yes24,naver,shop,cash,coupang' && C.find((c) => c.k === 'yes24').fee === 0.12 && C.find((c) => c.k === 'naver').on === 1 && C.find((c) => c.k === 'shop').host === 'booksqueen.com' && C.find((c) => c.k === 'aladin').role === 'master', '판매처 목록 = 설정 하나(네이버 켬·우리숍 booksqueen.com·새 판매처 쿠팡 · 틀린 열쇠 뺌 · 기준 판매처 역할은 그대로)');
  ok(G.chList({ x1: { n: 'a' }, x2: { n: 'b' }, x3: { n: 'c' }, x4: { n: 'd' }, x5: { n: 'e' }, x6: { n: 'f' } }).length === 10, '판매처 많아도 10곳까지');
  const now = '2026-11-10T03:00:00Z';
  ok(G.y24Unpub('2026-08-15', '9791100000001', [], now).until === '2027-02-15' && G.y24Unpub('20260815', '9788900000001', ['국내도서>소설'], now).days > 90, '📅 출간 6개월 안 국내도서(979-11·978-89 · 날짜 꼴 둘)');
  ok(!G.y24Unpub('2026-03-01', '9791100000001', [], now) && !G.y24Unpub('2026-09-01', '9780000000002', [], now) && !G.y24Unpub('2026-09-01', '9788900000001', ['외국도서>영미'], now) && !G.y24Unpub('', '9788900000001', [], now) && G.y24Unpub('2026-09', '9788900000001', [], now).until === '2027-03-01', '6개월 지남·외국 ISBN·외국도서 분류·출간일 없음 → 아님 · 달만 있으면 1일로');
  const P = (r) => G.mcPlan(r, G.chList());
  const a = P({ nsku: 1, ch: { aladin: { live: true, qty: 1 }, yes24: { live: true, qty: 1 } }, ord14: {} }); ok(!a.acts.length && a.rem === 1 && a.P === 1, '안 팔림: 알라딘 1·예스24 1 = 실물 1 → 할 일 없음(더하지 않음)');
  const b = P({ nsku: 3, ch: { aladin: { live: true, qty: 2 }, yes24: { live: true, qty: 3 } }, ord14: { aladin: { n: 1, first: '2026-11-09' } } }); ok(b.rem === 2 && b.acts.length === 1 && b.acts[0].ch === 'yes24' && b.acts[0].k === 'qty' && b.acts[0].to === 2, '3권 중 1권 팔림 → 예스24 수량 3 → 2로');
  const c = P({ nsku: 1, ch: { aladin: { live: false, qty: 0 }, yes24: { live: true, qty: 1 } }, ord14: { aladin: { n: 1, first: '2026-11-08T01:00:00Z' }, yes24: { n: 1, first: '2026-11-08T02:00:00Z' } } }); ok(c.over && c.keep === 'aladin' && c.acts[0].k === 'down', '⛔ 과판매(동시 주문): 먼저 온 알라딘 주문만 보냄 · 예스24 내리기');
  const d = P({ nsku: 0, ch: { aladin: { live: false, qty: 1, st: '판매중지' }, yes24: { live: true, qty: 1 } }, ord14: {} }); ok(!d.acts.length, '사람이 알라딘만 판매중지(팔림 없음) → 예스24는 그대로');
  const V = G.ledBuild({ now, chs: G.chList({ naver: { on: 1 } }), al: [{ id: 'a1', title: '책', skus: ['S1'], live: true, qty: 1, price: 5000 }], other: [{ ch: 'naver', no: 'n9', sku: 'S1', live: true, qty: 1, price: 5500 }, { ch: 'zz', no: 'q', sku: 'S1', live: true }], ord: [{ ch: 'naver', no: 'o9', at: '2026-11-09T00:00:00Z', amt: 5500, lines: [{ sku: 'S1', qty: 1, amt: 5500 }] }] });
  const r = V.rows[0]; ok(V.rows.length === 1 && r.ch.naver && r.ch.naver.no === 'n9' && !r.ch.zz && r.mc.acts.some((x) => x.ch === 'aladin' && x.k === 'down') && V.sum.naver.ord === 1 && V.n.multi === 1 && 'shop' in r.ch, '3번째 판매처(네이버) 매물·주문이 같은 실물 줄로 · 목록에 없는 판매처는 뺌 · 네이버에서 팔리면 알라딘 내리기'); }
{ /* (y24ui) 등록 카드 함수 · 예스24 함께 · 화면 코드 꼴 */ ok(/function regCardFns\(F, RG, T, V\)/.test(T) && /const \{ card, card0 \} = regCardFns\(F, RG, T\);/.test(T), '등록 카드 그리기 = 바깥 함수 하나(등록 탭·📤 화면이 같이 씀)');
  ok(/regKindChips\(it\) \+ y24wChip\(it\)/.test(T) && /const yc = y24wChip\(it, true\)/.test(T) /* (11/10 ux2) 한눈에는 상태 줄 맨 앞에 늘 */ && /\$\{y24wRow\(L\)\}<div class=\"rgbk-r\">/.test(T), '등록 카드(자세히·한눈에)·고른 상품 창에 🟦 예스24도(고르기 줄에도 단추 · ux2)');
  const yb = cut('/* ══ 🟦 등록에서 예스24도 함께', '/* (11/10 개편) 📤 예스24 이전 화면'); ok(!/collection\('reg_items'\)/.test(yb) && /doc\('y24_reg'\)/.test(yb), '예스24 함께 = 올림 장부 문서에만 적음(등록 줄 reg_items는 안 건드림)'); }
{ const blk = cut('/* ══════════ 📤 예스24 새로 올리기', '/* ══════════ 🟦 예스24 주문'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(blk) && !/\balert\(|\bconfirm\(|\bprompt\(/.test(blk), '새 코드에 휴대전화 번호 꼴·브라우저 창 없음');
  ok(/PAGE_GUIDES\['y24Reg'\]/.test(blk) && /PAGE_GUIDES\['ledger'\]/.test(blk) && /\['y24Reg', '📤 예스24에 새로 올리기', \(d\) => d\.bigTable === 'y24reg', 'openY24Reg'\]/.test(T) && /\['ledger', '🧾 통합 장부', \(d\) => d\.bigTable === 'ledger', 'openLedger'\]/.test(T), '화면 설명서·화면 목록(PG_SCR) 둘 다');
  ok(!/collection\('(inv_items|ch_links|ord_ch|led_days)'\)/.test(blk), '통합 장부는 새 칸에 쓰지 않음(읽기 전용 · 설계만)'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tY24REG ${bad}개 실패` : '✓ tY24REG 순수 셈 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('② 화면');
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); }); const dl = []; p.on('download', (d) => dl.push(d.suggestedFilename()));
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    try { await p.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'xlsx.full.min.js'), 'utf8') }); } catch (e) {} /* 시험 PC는 cdnjs가 막힘 — npm xlsx 0.18.5(웹앱이 부르는 것과 같은 판) */
    const o = await p.evaluate(async () => { try { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {};
      let i = 0; S.plist.forEach((l, k) => { l.sku = 'A01'; l.isbn13 = '97889000000' + String(10 + i).padStart(2, '0'); S.sku.map.set(l.id, { c: ['t' + String(1000 + i++)] }); }); S.ver++;
      window.__xn = []; if (window.XLSX) { const w0 = XLSX.writeFile; XLSX.writeFile = (wb, n, o2) => { window.__xn.push(n); return w0(wb, n, o2); }; } S.y24.loaded = true; S.y24.adm = { t: Date.now(), m: new Map() }; S.app.platforms = { y24: {} };
      openY24Reg(); await Wt(500); const sh = document.getElementById('sheet'); o.open = sh.classList.contains('on') && /예스24에 새로 올리기/.test(sh.textContent);
      o.cand = y24RegRows().filter((r) => r.k === 'ok').length; o.btn = sh.querySelectorAll('[data-y24rone]').length; o.bulkDis = sh.querySelector('#y24r_bulk').disabled;
      const lid = sh.querySelector('[data-y24rone]').dataset.y24rone; sh.querySelector('[data-y24rone]').click(); await Wt(300); const pop = document.getElementById('y24rp'); o.pop = !!pop && /9788900000/.test(pop.textContent) && /자체코드/.test(pop.textContent);
      const go = pop.querySelector('#y24rp_go'); go.click(); await Wt(300); o.arm1 = /한 번 더/.test(go.textContent) && !Object.keys(y24RegLed()).length;
      go.click(); await Wt(1500); o.led = Object.keys(y24RegLed()); o.ent = y24RegLed()[lid] || null; o.popGone = !document.getElementById('y24rp'); o.xn = window.__xn.slice();
      o.again = y24RegRows().some((r) => r.k === 'ok' && r.row.lid === lid); o.ledRow = y24RegRows().some((r) => r.k === 'led' && r.e.lid === lid && r.s.k === 'wait');
      const res = await y24RegCommit(y24RegRows().filter((r) => r.k === 'ok').slice(0, 2).map((r) => r.row)); o.gate2 = res && res.gate.mode; o.n2 = res && res.ok.length;
      S._bt_y24reg.f.k = 'led'; openY24Reg(); await Wt(400); const okb = document.querySelector(`[data-y24rok="${lid}"]`); okb.click(); await Wt(200); okb.click(); await Wt(800); o.okMark = !!(y24RegLed()[lid] || {}).ok;
      const G = y24RegGate(y24RegLed(), y24RegC(), new Date().toISOString(), y24RegCfgNow()); o.gate3 = G.mode;
      openLedger(); await Wt(600); o.led1 = sh.classList.contains('on') && /통합 장부/.test(sh.textContent) && /우리숍|자사 숍/.test(sh.textContent) && !!sh.querySelector('.ledchs') && !!sh.querySelector('.ledcfg') && /예스24/.test(sh.textContent); o.ledRows = ledNow().rows.length; o.ledReg = ledNow().n.reg;
      /* (y24ui) 카드 = 등록 탭 카드 그리기 · 보기 · 끊긴 단추 · 📅 참조 · 등록에서 함께 */
      S._bt_y24reg.f.k = 'all'; openY24Reg(); await Wt(500); o.cards = sh.querySelectorAll('.y24rc').length; o.rgCard = sh.querySelectorAll('.y24rc .rgc2').length; o.noAct = !sh.querySelector('.y24rc [data-rgpurge],.y24rc [data-rgtest],.y24rc [data-pcf],.y24rc .rgchk'); o.tabs = sh.querySelectorAll('.y24rtabs [data-btf]').length; o.cardErr = /카드를 못 그림/.test(sh.textContent);
      sh.querySelector('[data-y24view="compact"]').click(); await Wt(400); o.compact = sh.querySelectorAll('.y24rc .rgrow, .y24rc [class*="rgr-"]').length > 0 && sh.querySelectorAll('.y24rc').length === o.cards; sh.querySelector('[data-y24view="full"]').click(); await Wt(300);
      const l0 = [...S.plist.values()].find((x) => aladinLive(x)); l0.bookId = l0.bookId || 'bkY'; S.pbooks.set(l0.bookId, { ...(S.pbooks.get(l0.bookId) || {}), id: l0.bookId, title: l0.title, isbn13: l0.isbn13, pubDate: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), categories: ['국내도서>소설'] }); S.ver++; S._y24R = null; S._bt_y24reg.f.k = 'ref'; openY24Reg(); await Wt(400); o.ref = y24RegRows().filter((r) => r.unpub && r.k !== 'led').length; o.refCards = sh.querySelectorAll('.y24rc').length; o.refTag = /예스24 미출간/.test(sh.textContent); o.refNote = /실물은 「전체」/.test(sh.textContent);
      /* 등록에서 함께 — 확정(올라감) 등록 줄 하나 + 고르기 줄 */ const l1 = [...S.plist.values()].find((x) => aladinLive(x) && !y24RegLed()[x.id]); S.regItems = S.regItems || new Map(); const rid = 'rgY1'; const rd = { stage: 'done', isbn: l1.isbn13, grade: 2, qty: 1, price: 9000, createdAt: new Date().toISOString(), ws: regWsCur(), info: { title: l1.title, isbn13: l1.isbn13, categories: [], page1: [] }, final: { price: 9000, qty: 1, code: 'A01' }, result: { state: 'live', usedCode: String(l1.id).replace(/^aladin_/, '') } }; await db.collection('reg_items').doc(rid).set(rd); S.regItems.set(rid, { id: rid, ...rd });
      localStorage.removeItem('rn-regplat-y24'); o.chipDefOff = !/ on"/.test(y24wChip(S.regItems.get(rid))) && !y24WantLids().has(l1.id); /* (11/11) 🚦 처음 기본 = 🟦 예스24 끔(이 기기) */ localStorage.setItem('rn-regplat-y24', '1');
      o.chipDefOn = o.chipDefOff && / on"/.test(y24wChip(S.regItems.get(rid))) && / on"/.test(y24wChip(S.regItems.get(rid), true)); /* (11/10 y24auto · 정범님 '왜 숨겨 놓는 거야?') 새로 등록한 줄은 기본 켬(누른 기록 없어도) */
      S.regItems.set('rgOld', { ...S.regItems.get(rid), id: 'rgOld', createdAt: '2026-11-01T00:00:00Z' }); o.oldOff = !/ on"/.test(y24wChip(S.regItems.get('rgOld'))) && /data-y24w=/.test(y24wChip(S.regItems.get('rgOld'), true)); S.regItems.delete('rgOld'); /* 기본 시작일(wantFrom) 전 예전 줄은 따라오지 않음(꺼짐 · 단추는 늘 보임) */
      o.wantDefRow = y24WantLids().get(l1.id) === rid; /* 기본 켬도 📤 「등록에서 고름」에 들어감 */
      S.regChk = new Set([rid]); o.bar = /함께 올림/.test(y24wRow([S.regItems.get(rid)])) && /예스24 끄기/.test(y24wRow([S.regItems.get(rid)])) && /data-y24wbulk="0"/.test(regChkPanelHtml([rid], regCfg())) && /끄기/.test(regChkPanelHtml([rid], regCfg()));
      await y24WantSet([rid], false); o.offChip = !/ on"/.test(y24wChip(S.regItems.get(rid))) && !y24WantLids().has(l1.id); /* 끄면 그 줄만 꺼짐(기록 on 0) */
      await y24WantSet([rid], true); o.wantLid = (y24W()[rid] || {}).lid === l1.id; S._y24R = null; o.wantRow = y24RegRows().some((r) => r.lid === l1.id && r.want === rid); S._bt_y24reg.f.k = 'want'; openY24Reg(); await Wt(400); o.wantPick = S._y24Pick.has(l1.id) || y24RegRows().some((r) => r.lid === l1.id && r.k !== 'ok'); o.wantTab = sh.querySelectorAll('.y24rc').length >= 1 && /등록에서 고름/.test(sh.textContent);
      o.chipOn = / on"/.test(y24wChip(S.regItems.get(rid))) && /예스24/.test(y24wChip(S.regItems.get(rid), true)); await y24WantSet([rid], false); o.wantOff = (y24W()[rid] || {}).on === 0 && !!(y24W()[rid] || {}).by; S.regChk = new Set();
      S.regT = 'done'; openRegister(); await Wt(900); o.regOpen = !!document.querySelector('#sheet .rgc2, #sheet [data-rgcid], #sheet .rgtools, #sheet .btabs'); history.back(); await Wt(300);
      o.go = GO_PAGES.some((g) => g[0] === 'ledger') && GO_PAGES.some((g) => g[0] === 'y24Reg'); o.feat = FEAT.filter((f) => /📤 예스24에 새로 올리기|🧾 통합 장부/.test(f.t)).length;
      return o; } catch (e) { return { err: e.message + ' · ' + JSON.stringify(o).slice(0, 400) }; } });
    if (o && o.err) { ok(false, '화면 시험 오류: ' + o.err); return; }
    if (!o) { ok(false, '화면 시험이 중간에 멈춤(ERRORS 보기)'); return; }
    console.log('   ', JSON.stringify({ ...o, ent: o.ent && { st: o.ent.st, skus: o.ent.skus, isbn: o.ent.isbn } }));
    ok(o.open && o.cand > 0 && o.btn > 0 && o.bulkDis, `📤 화면 열림 · 후보 ${o.cand} · 처음엔 여러 건 단추 꺼짐`);
    ok(o.pop && o.arm1, '1건 미리 보기 판 · 확정 한 번 누름 = 아무것도 안 함(한 번 더)');
    ok(o.led.length === 1 && o.ent && o.ent.st === 'sent' && o.ent.skus.length === 1 && o.popGone && dl.length === 1 && o.xn.length === 1 && /예스24_새로올리기_\d{8}_1줄\.xlsx/.test(o.xn[0]), `두 번째 누름 = 장부에 1줄 · 엑셀 1개 내려받음(${o.xn.join(',')})`);
    ok(!o.again && o.ledRow, '장부에 적은 상품은 후보에서 빠지고 장부 줄(⏳ 기다림)로');
    ok(o.gate2 === 'wait' && o.n2 === 0 && dl.length === 1, '첫 건 결과 전엔 더 못 올림(트랜잭션 안에서도 막힘 · 엑셀 안 생김)');
    ok(o.okMark && o.gate3 === 'bulk', "'올라감 확인'(두 번 누르기) 뒤 여러 건이 열림");
    ok(o.led1 && o.ledRows > 0 && o.ledReg === 1 && o.go && o.feat === 2, '🧾 통합 장부 화면 · 📤 올림 1 · 바로 가기·기능 찾기');
    ok(o.cards > 0 && o.rgCard === o.cards && !o.cardErr && o.tabs >= 6, `(y24ui) 📤 카드 = 등록 탭 카드(${o.rgCard}/${o.cards}) · 보기 ${o.tabs}개`);
    ok(o.noAct, '(y24ui) 카드 안 단추 동작은 끊김(🗑·🧪·샵매니저 고치기·고르기 칸 없음)');
    ok(o.compact, '(y24ui) 📋 한눈에 보기도 등록 카드 그대로');
    ok(o.ref >= 1 && o.refCards === o.ref && o.refTag && o.refNote, `(y24ui) 📅 참조 = 출간 6개월 안 국내도서만(${o.ref}) · 실물은 전체에 그대로`);
    ok(o.chipDefOn && o.oldOff && o.wantDefRow && o.bar && o.offChip, '(y24auto · 11/11) 등록 카드 🟦 예스24도 — 처음 기본 끔 · 이 기기 🚦 「🟦 예스24 등록」을 켜면 새 줄 기본 켬(자세히·한눈에) · 기본 시작일 전 줄은 꺼짐 · 기본 켬도 📤 「등록에서 고름」 · 고르기 줄은 「예스24 끄기」 쪽 · 끄면 그 줄만', JSON.stringify({ d: o.chipDefOn, old: o.oldOff, row: o.wantDefRow, bar: o.bar, off: o.offChip }));
    ok(o.wantLid && o.wantRow && o.wantPick && o.wantTab && o.chipOn && o.wantOff, '(y24ui) 고르면 → 올라간 상품이 📤 「🟦 등록에서 고름」에 미리 골라짐 · 끄면 on 0(기록 남음)');
    ok(o.regOpen, '(y24ui) 등록 화면이 그대로 열림');
    ok(!dlg.length, '브라우저 창 0: ' + dlg.join(' / ')); });
  console.log(bad ? `❌ tY24REG ${bad}개 실패` : '✓ tY24REG 모두 통과'); process.exit(bad ? 1 : 0); })();
