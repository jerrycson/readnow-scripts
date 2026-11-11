// tLED1111 — (11/11 정범님) ① 🧾 통합 장부 '🛠 처리할 일' 보기 ② 재고 품목 🗑 = 두 번 누르기(글자 입력 창 없앰) ③ 약속 44 — 웹앱에 '그대로 입력하세요' 글자 입력 확인이 남지 않음
//   ① 순수 셈: app.html의 ◆ledger 덩어리만 떼어 돌림 — 처리할 일 고르기(팔린 실물만 · 과판매 포함) · 고칠 값 = 팔린 뒤 남은 실물 수 · 0 = 판매중지 · 이상한 값은 맡기지 않음
//   ② 화면(harness): 처리할 일 보기 → 알라딘 맡기기 한 번 = 아무것도 안 함 · 두 번 = shp_cmds prdEdit 1건(판매중지) · ⏳ 반영 기다림 · 반영되면 줄이 사라짐(실물 줄은 전체 장부에 그대로)
//        · 일괄(고른 줄) 두 번 · 예스24 = 판매관리 바로 가기 + ✓ 고쳤음(두 번) · 로거 PC는 맡기지 않음
//        · (11/11 y24w) 🟦 예스24 맡기기 두 번 → 이 PC 번외(가짜 127.0.0.1:8797) /y24/w/put 1건(상품번호·자체코드·판매중지·할 일 열쇠) · ⏳ 고치는 중 · 결과 done → ack · 처리할 일에서 빠짐
//          · 실패면 까닭·할 일 + 단추 다시 · 멈춤이면 [▶ 예스24 쓰기 이어 가기](두 번) · MJ-MAIN·번외 없는 기기는 맡기지 않음
//        · (11/11 led2b · 정범님 '여기서 바로 예스24 수량 조절·판매중지') 자체코드 없는 예스24 줄도 장부가 이은 예스24 상품이 꼭 하나면 🟦 맡기기 단추(번호로 찾고 자체코드 칸에 우리 SKU 채움 맡김)
//          · 같은 ISBN 예스24 상품이 여럿이면 그 자리 '어느 상품인지 고르기' → 고른 상품으로 맡기기 · 보이는 줄 모두 고르기 → 고른 줄 예스24 맡기기에 자체코드 없는 줄도 · 로그인 풀림 = 🔐 로그인 기다림(맡김은 그대로)
//        · 재고 품목 🗑 한 번 = 무장(대상 표시) · 0.4초 안 겹누름 무시 · 4초 안 다시 = regDel 1건 · 검토 판·입력 칸 없음 · 여러 개 검토 판도 입력 칸 없이 확인 단추 두 번
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tLED1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, ledAlCh, MC_DAYS, ledY24One, omniPick };')();
const FW = new Function('ledGuard', 'deviceName', 'localStorage', 'S', 'ledY24One', cut('/* (11/11 y24w) 🟦 예스24 맡기기 — 이 기기 기록', '/* 맡김 — 돌려줌') + '\nreturn { ledY24Row, ledY24Guard, ledY24Can };');
console.log('① 순수 셈');
const INP = (o) => ({ now: '2026-11-11T03:00:00Z', days: 30,
  al: [{ id: 'aladin_U1', title: '책1', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U2', title: '책2', isbn: '9788900000002', grade: '중', price: 5000, qty: 3, live: true, st: '판매중', skus: ['S2a', 'S2b', 'S2c'] }, { id: 'aladin_U3', title: '책3', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S3'] }],
  y24: [{ no: '900', title: '책1', isbn: '9788900000001', grade: '상', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '903', title: '책3', price: 3000, stock: 1, live: true, self: 'S3', flags: [] }],
  ord: [{ ch: 'yes24', no: 'y1', at: '2026-11-09T00:00:00Z', amt: 8500, lines: [{ sku: 'S1', qty: 1, amt: 8500 }] }, { ch: 'aladin', no: 'o2', at: '2026-11-08T00:00:00Z', amt: 5000, lines: [{ lid: 'aladin_U2', qty: 1, amt: 5000 }] }, { ch: 'aladin', no: 'o0', at: '2026-10-01T00:00:00Z', amt: 3000, lines: [{ lid: 'aladin_U3', qty: 1, amt: 3000 }] }], ...(o || {}) });
{ const V = F.ledBuild(INP()); const TD = F.ledTodo(V); const t1 = TD.find((x) => x.key === 'S1'); const t2 = TD.find((x) => x.key === 'S2a');
  ok(TD.length === 2 && t1 && t2 && !TD.some((x) => x.key === 'S3'), '처리할 일 = 최근 14일에 팔린 실물만(30일 넘은 주문 책3·안 팔린 책은 빠짐)', TD.map((x) => x.key));
  const a1 = t1.acts.find((a) => a.ch === 'aladin'); ok(a1 && a1.k === 'down' && a1.to === 0 && a1.id === 'aladin_U1' && t1.rem === 0 && t1.last === '2026-11-09T00:00:00Z', '예스24에서 1권 팔림 → 알라딘 판매중지 · 고칠 값 0(남은 실물) · 상품 열쇠·마지막 주문 시각', t1);
  const a2 = t2.acts.find((a) => a.ch === 'aladin'); ok(!a2 || a2.to === 2, '3권 중 1권 팔림 — 알라딘이 이미 3권이면 남은 2권으로(알라딘이 팔린 판매처면 할 일 아님)', t2.acts);
  ok(V.rows.length === 3, '실물 줄은 장부에 그대로(처리할 일은 보기일 뿐 — 옮기지 않음)');
  const V2 = F.ledBuild(INP({ al: INP().al.map((l) => (l.id === 'aladin_U1' ? { ...l, live: false, st: '판매중지' } : l)) })); ok(!F.ledTodo(V2).some((x) => x.key === 'S1' && x.acts.some((a) => a.ch === 'aladin')), '알라딘 판매중지가 반영되면 그 할 일이 저절로 빠짐');
  const V3 = F.ledBuild(INP({ ord: INP().ord.concat([{ ch: 'aladin', no: 'o9', at: '2026-11-10T00:00:00Z', amt: 8000, lines: [{ lid: 'aladin_U1', qty: 1, amt: 8000 }] }]) })); const t3 = F.ledTodo(V3).find((x) => x.key === 'S1'); ok(t3 && t3.over, '⛔ 과판매(동시 주문)도 처리할 일에');
  { const y = TD.find((x) => x.key === 'S3') || null; void y; const V4 = F.ledBuild(INP({ ord: INP().ord.concat([{ ch: 'aladin', no: 'o7', at: '2026-11-10T00:00:00Z', amt: 3000, lines: [{ lid: 'aladin_U3', qty: 1, amt: 3000 }] }]) })); const t4 = F.ledTodo(V4).find((x) => x.key === 'S3'); const ay = t4 && t4.acts.find((a) => a.ch === 'yes24');
    ok(ay && ay.no === '903' && ay.self === 'S3' && ay.k === 'down', '(y24w) 알라딘에서 팔림 → 예스24 할 일에 상품번호·자체코드(SKU)', t4 && t4.acts);
    const mem = {}; const LS = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)) }; let dev = 'HOME'; const W = FW(() => '', () => dev, LS, {}, F.ledY24One);
    const r1 = W.ledY24Row(t4, ay); ok(r1.kind === 'stop' && r1.to === null && r1.no === '903' && r1.self === 'S3' && r1.rid === 'S3|903' && /^S3\|903\|stop\|\|20261110/.test(r1.rk), '(y24w) 맡길 줄 = 상품번호·자체코드·판매중지 · 할 일 열쇠(줄+할 일+값+마지막 주문 시각)', r1);
    const r2 = W.ledY24Row({ ...t4, last: '2026-11-11T00:00:00Z' }, { ...ay, k: 'qty', to: 2 }); ok(r2.kind === 'qty' && r2.to === 2 && r2.rk !== r1.rk, '(y24w) 수량이면 qty·고칠 값 · 새로 팔리면 새 열쇠(같은 할 일만 되풀이 0)', r2);
    ok(/번외 수집기가 없음/.test(W.ledY24Guard()) && (LS.setItem('rn-c2seen', '1'), W.ledY24Guard() === '') && ((dev = 'MJ-MAIN'), /MJ-MAIN/.test(W.ledY24Guard())), '(y24w) 번외 없는 기기·MJ-MAIN은 맡기지 않음'); }
  { /* (11/11 led2b) 정범님 화면 그대로 — 실물 3권(SKU 3개)·현금으로 2권 팔림 → 남은 1권 · 예스24 지금 2권(자체코드 없음 · ISBN으로 이은 상품 하나) → 1권 */
    const mem = {}; const LS = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)) }; const W = FW(() => '', () => 'HOME', LS, {}, F.ledY24One);
    const I5 = { now: '2026-11-11T06:00:00Z', days: 30, al: [{ id: 'aladin_H1', title: '핫 시험 책', isbn: '9788900000301', grade: '상', price: 9000, qty: 3, live: true, st: '판매중', skus: ['PNKt0301EX', 'PNKt0302EX', 'PNKt0303EX'] }],
      y24: [{ no: '3010001', title: '핫 시험 책', isbn: '9788900000301', grade: '상', price: 9500, stock: 2, live: true, self: '', alIds: ['aladin_H1'], flags: [] }],
      ord: [{ ch: 'cash', no: 'c1', at: '2026-11-11T02:00:00Z', amt: 9000, lines: [{ lid: 'aladin_H1', qty: 2 }] }] };
    const T5 = F.ledTodo(F.ledBuild(I5)).find((x) => x.key === 'PNKt0301EX'); const a5 = T5 && T5.acts.find((a) => a.ch === 'yes24'); const R5 = a5 && W.ledY24Row(T5, a5);
    ok(T5 && T5.P === 3 && T5.rem === 1 && a5 && a5.k === 'qty' && a5.to === 1 && a5.cur === 2 && !a5.self && a5.how === 'pick' && a5.cands.length === 1, '(led2b) 실물 3권·남은 1권 · 예스24 지금 2권 → 1권 — 자체코드 없음 · 장부가 이은 예스24 상품 하나', { T5, a5 });
    ok(R5 && R5.mode === 'fill' && R5.no === '3010001' && R5.self === '' && R5.fill === 'PNKt0301EX' && R5.isbn === '9788900000301' && R5.kind === 'qty' && R5.to === 1 && W.ledY24Can(R5) && R5.rid === 'PNKt0301EX|3010001', '(led2b) 맡길 줄 = 예스24 상품 번호로 · 자체코드 칸에 우리 SKU 채움 · ISBN으로 찾음', R5);
    const P5 = F.omniPick([T5], { from: '2026-11-11T01:00:00Z' }); ok(P5.some((p) => p.a.ch === 'yes24'), '(led2b) 🤖 자동 내림도 같은 규칙 — 하나로 정해지면 자동', P5.map((p) => p.a.ch));
    const I6 = { ...I5, y24: I5.y24.concat([{ no: '3010002', title: '핫 시험 책', isbn: '9788900000301', grade: '상', price: 9800, stock: 1, live: true, self: '', alIds: ['aladin_H1'], flags: [] }]) }; const T6 = F.ledTodo(F.ledBuild(I6)).find((x) => x.key === 'PNKt0301EX'); const a6 = T6.acts.find((a) => a.ch === 'yes24'); const R6 = W.ledY24Row(T6, a6);
    ok(R6.mode === 'pick' && !W.ledY24Can(R6) && /2개/.test(R6.why) && !F.omniPick([T6], { from: '2026-11-11T01:00:00Z' }).some((p) => p.a.ch === 'yes24'), '(led2b) 같은 ISBN 예스24 상품이 둘 = 하나로 못 정함 → 고르기(맡기기·자동 안 함)', R6);
    LS.setItem('rn-led-y24pk', JSON.stringify({ PNKt0301EX: { no: '3010002', at: Date.now() } })); const R7 = W.ledY24Row(T6, a6, { PNKt0301EX: '3010002' });
    ok(R7.mode === 'fill' && R7.no === '3010002' && R7.rid === 'PNKt0301EX|' + a6.no && W.ledY24Can(R7), '(led2b) 고르면 그 예스24 상품 번호로 맡김(줄 열쇠는 그대로)', R7); }
  ok(JSON.stringify(F.ledAlCh(0, 1)) === '{"state":"판매중지"}' && JSON.stringify(F.ledAlCh('2', 3)) === '{"qty":2}' && F.ledAlCh(3, 3) === null && F.ledAlCh(-1, 3) === null && F.ledAlCh('1.5', 3) === null && F.ledAlCh('', 3) === null && F.ledAlCh('x', 3) === null, '고친 값 → 0 = 판매중지 · 지금보다 적으면 수량 · 같음·음수·소수·빈칸은 맡기지 않음'); }
console.log('③ 약속 44 — 글자 입력 확인');
{ ok(!/그대로 입력하세요/.test(T) && !/id="bdel_in"/.test(T), "웹앱에 '그대로 입력하세요' 글자 입력 확인 창이 없음");
  const fnPd = cut('async function prdDelReview(', 'function drawBatchRes('); ok(/twiceArm\(b, `\$\{need\}/.test(fnPd) && /async function prdDelQueue\(/.test(fnPd) && /async function prdDel1Twice\(/.test(fnPd), '여러 개 검토 판 = 확인 단추 두 번 · 한 개 = 그 단추 두 번 · 맡기기는 한 함수(prdDelQueue)');
  const nw = cut('/* ══ (11/11 led2 · 정범님) 🛠 처리할 일 화면', 'function openLedger() {'); ok(!/\b(alert|confirm|prompt)\s*\(/.test(nw) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(nw), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tLED1111 ${bad}개 실패` : '✓ tLED1111 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const cmds = (type) => p.evaluate(async (ty) => { const g = await db.collection('shp_cmds').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.type === ty) L.push({ id: d.id, ...v }); }); return L; }, type);
  /* 장부 자료: 시험 상품 두 권(aladin_U215983410 1권 · aladin_U215983412 1권)을 예스24에서 팔린 것으로 */
  await p.evaluate(() => { const uni = '/* ◆ledger 시작'; void uni; window.__ledSold = new Set(['aladin_U215983410', 'aladin_U215983412']);
    window.ledNow = () => { const al = ['aladin_U215983410', 'aladin_U215983412', 'aladin_U215983414'].map((id) => { const l = S.plist.get(id); return { id, title: l.title, isbn: l.isbn13, grade: l.grade, price: l.price, qty: 1, live: aladinLive(l), st: l.status, skus: ['SK' + id.slice(-2)] }; });
      const ord = [...window.__ledSold].map((id, i) => ({ ch: 'yes24', no: 'y' + i, at: new Date((window.__ledT0 = window.__ledT0 || Date.now()) - 864e5).toISOString(), amt: 5000, lines: [{ sku: 'SK' + id.slice(-2), qty: 1, amt: 5000 }] }));
      const y24 = [{ no: '777', title: '예스24 줄', price: 6000, stock: 1, live: true, self: 'SK14', flags: [] }];
      return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S._ledView = 'todo'; S._ledSel = new Set(); openLedger(); });
  await p.waitForTimeout(800);
  const R = await p.evaluate(() => { const sh = document.getElementById('sheet'); const tabs = [...sh.querySelectorAll('[data-ledview]')].map((b) => b.textContent.trim()); const go = sh.querySelectorAll('[data-ledgo]'); const inp = sh.querySelectorAll('[data-ledto]');
    return { tabs, todoOn: !!sh.querySelector('[data-ledview="todo"].on'), rows: sh.querySelectorAll('.bt-tb tr').length - 1, go: go.length, val: inp[0] && inp[0].value, bar: !!sh.querySelector('#led_bulkal') }; });
  ok(R.todoOn && R.tabs.length >= 2 && /처리할 일\s*2/.test(R.tabs.join('|')) && R.rows === 2 && R.go === 2 && R.val === '0' && R.bar, '🛠 처리할 일 보기 — 팔린 2줄만 · 줄마다 알라딘 맡기기 · 고칠 값 0(남은 실물)으로 미리 채움 · 일괄 줄', R);
  const b1 = p.locator('[data-ledgo="SK10"]'); await b1.click(); await p.waitForTimeout(150); const arm = await b1.textContent(); const n0 = (await cmds('prdEdit')).length;
  await b1.click(); await p.waitForTimeout(100); const n0b = (await cmds('prdEdit')).length; /* 0.4초 안 겹누름 = 무시 */
  await p.waitForTimeout(450); await p.locator('[data-ledgo="SK10"]').click(); await p.waitForTimeout(900); const C1 = await cmds('prdEdit');
  ok(/한 번 더/.test(arm || '') && n0 === 0 && n0b === 0, '한 번 누름 = 무장(대상 표시 · 맡기지 않음) · 0.4초 안 겹누름 무시', { arm, n0, n0b });
  ok(C1.length === 1 && C1[0].listingKey === 'aladin_U215983410' && C1[0].ch && C1[0].ch.state === '판매중지', '두 번째 누름 = 알라딘 상품 정보 수정 맡김 1건(판매중지)', C1.map((c) => [c.listingKey, c.ch]));
  const P1 = await p.evaluate(() => { ledRedraw(); const sh = document.getElementById('sheet'); const td = [...sh.querySelectorAll('.ledtd')].map((x) => x.textContent); return { pend: td.some((t) => /반영 기다림/.test(t)), go: sh.querySelectorAll('[data-ledgo]').length }; });
  ok(P1.pend && P1.go === 1, '맡김 진행 중 = ⏳ 반영 기다림(그 줄 단추 숨김)', P1);
  /* 반영: 알라딘 상품이 판매중지로 바뀜 → 그 줄이 처리할 일에서 사라짐 · 전체 장부엔 실물 줄 그대로 */
  const G1 = await p.evaluate(() => { const l = S.plist.get('aladin_U215983410'); l.status = '판매중지'; l.active = false; S._led = null; ledRedraw(); const sh = document.getElementById('sheet'); const n = sh.querySelectorAll('.bt-tb tr').length - 1; S._ledView = 'all'; openLedger(); const all = [...document.querySelectorAll('#sheet .bt-tb tr')].some((tr) => /SK10/.test(tr.textContent)); S._ledView = 'todo'; openLedger(); return { n, all }; });
  ok(G1.n === 1 && G1.all, '반영되면 처리할 일에서 저절로 빠짐 · 실물 줄은 전체 장부 원래 자리에 그대로', G1);
  /* 일괄: 남은 줄 고르고 두 번 */
  await p.evaluate(() => { const cb = document.querySelector('#sheet [data-ledsel="SK12"]'); cb.checked = true; cb.onchange(); }); await p.waitForTimeout(200);
  const bk = p.locator('#led_bulkal'); await bk.click(); await p.waitForTimeout(500); const nB0 = (await cmds('prdEdit')).length; await p.locator('#led_bulkal').click(); await p.waitForTimeout(900); const CB = await cmds('prdEdit');
  ok(nB0 === 1 && CB.length === 2 && CB.some((c) => c.listingKey === 'aladin_U215983412'), '고른 줄 일괄 맡기기 — 두 번 눌러야 맡김', { nB0, n: CB.length });
  /* 예스24 할 일: 판매관리 바로 가기 + ✓ 고쳤음(두 번) → ⏳ */
  const Y = await p.evaluate(async () => { window.__ledSold = new Set(['aladin_U215983414']); S._led = null; ledRedraw(); const w = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet');
    const a = [...sh.querySelectorAll('.ledtd a')].find((x) => /uscm\.yes24\.com/.test(x.href)); const b = sh.querySelector('[data-ledy24]'); if (!b) return { a: !!a, b: false }; b.click(); await w(500); const mid = !!sh.querySelector('[data-ledy24]') && !Object.keys(ledY24Mk()).length; document.querySelector('#sheet [data-ledy24]').click(); await w(300);
    const td = [...document.querySelectorAll('#sheet .ledtd')].map((x) => x.textContent).join('|'); return { a: !!a, b: true, mid, mk: Object.keys(ledY24Mk()), pend: /반영 기다림/.test(td) }; });
  ok(Y.a && Y.b && Y.mid && Y.mk.length === 1 && Y.pend, '예스24 = 판매관리 바로 가기 + ✓ 예스24에서 고쳤음(두 번) → ⏳ 반영 기다림', Y);
  /* (11/11 y24w) 🟦 예스24 맡기기 — 가짜 번외(127.0.0.1:8797) */
  const C2 = { puts: [], acks: [], resumes: 0, res: {}, stop: null, wait: [] };
  await p.route(/127\.0\.0\.1:8797\//, async (rt) => { const u = new URL(rt.request().url()); let b = {}; try { b = JSON.parse(rt.request().postData() || '{}'); } catch (e) {} const J = (o, st) => rt.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (u.pathname === '/y24/w/put') { C2.puts.push(b); C2.wait = [{ id: b.id, n: b.rows.length, rids: b.rows.map((r) => r.rid) }]; return J({ ok: true, took: b.id }); }
    if (u.pathname === '/y24/w/state') return J({ ok: true, ok1: 1, stop: C2.stop, wait: C2.wait, cur: null, res: C2.res, login: C2.login || 'ok', why: C2.why || null });
    if (u.pathname === '/y24/w/ack') { C2.acks.push(...(b.ids || [])); for (const id of b.ids || []) delete C2.res[id]; return J({ ok: true }); }
    if (u.pathname === '/y24/w/resume') { C2.resumes++; C2.stop = null; return J({ ok: true, was: true }); }
    return J({ ok: false }, 404); });
  const W1 = await p.evaluate(async () => { localStorage.setItem('rn-c2seen', '1'); localStorage.removeItem('rn-led-y24mk'); S._led = null; ledRedraw(); const w = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet');
    const b = sh.querySelector('[data-ledy24go]'); if (!b) return { b: false, td: [...sh.querySelectorAll('.ledtd')].map((x) => x.textContent).join('|') }; const hand = !!sh.querySelector('[data-ledy24]') && [...sh.querySelectorAll('.ledtd a')].some((x) => /uscm\.yes24\.com/.test(x.href)); const t0 = b.textContent;
    b.click(); await w(500); return { b: true, t0, hand, arm: (sh.querySelector('[data-ledy24go]') || {}).textContent || '' }; });
  const nP0 = C2.puts.length; await p.locator('[data-ledy24go]').first().click(); await p.waitForTimeout(900);
  const W2 = await p.evaluate(() => ({ td: [...document.querySelectorAll('#sheet .ledtd')].map((x) => x.textContent).join('|'), go: document.querySelectorAll('#sheet [data-ledy24go]').length, w: ledY24W(), n: ledTodoNow().length }));
  ok(W1.b && /맡기기/.test(W1.t0) && W1.hand && /한 번 더/.test(W1.arm) && nP0 === 0, '🟦 예스24 맡기기 한 번 = 무장(맡기지 않음) · 대체 길(판매관리 열기·✓ 고쳤음)은 그대로', W1);
  const P0 = C2.puts[0]; const r0 = P0 && P0.rows[0];
  ok(C2.puts.length === 1 && r0 && r0.no === '777' && r0.self === 'SK14' && r0.kind === 'stop' && r0.rid === 'SK14|777' && /^SK14\|777\|stop\|/.test(r0.rk) && /^y24w-/.test(P0.id), '두 번 = 번외에 맡김 1건(상품번호·자체코드·판매중지·할 일 열쇠)', P0);
  ok(/번외 수집기가 예스24에서 고치는 중/.test(W2.td) && W2.go === 0 && W2.w['SK14|777'] && W2.w['SK14|777'].st === 'run', '맡김 진행 중 = ⏳ 고치는 중(맡기기 단추 숨김 — 되풀이 0)', W2);
  const nW1 = W2.n; C2.res = { [P0.id]: { state: 'done', rows: { 'SK14|777': { state: 'done', msg: '판매중지 — 등록상품 목록에서 확인' } } } }; C2.wait = [];
  const W3 = await p.evaluate(async () => { await ledY24WPoll(); await new Promise((r) => setTimeout(r, 400)); return { n: ledTodoNow().length, w: ledY24W()['SK14|777'], left: [...document.querySelectorAll('#sheet [data-ledy24go]')].length, td: [...document.querySelectorAll('#sheet .ledtd')].map((x) => x.textContent).join('|') }; });
  ok(C2.acks.includes(P0.id) && W3.w && W3.w.st === 'done' && W3.n === nW1 - 1 && !/SK14/.test(W3.td) && !/777/.test(W3.td), '결과 done(번외가 목록을 다시 읽어 확인) → 받았음(ack) · 처리할 일 탭에서 빠짐', { acks: C2.acks, W3, nW1 });
  const W4 = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const T = ledTodo(ledNow()).find((x) => x.key === 'SK14'); const a = T.acts.find((x) => x.ch === 'yes24'); const R = ledY24Row(T, a); localStorage.removeItem('rn-led-y24mk');
    ledY24WSet({ [R.rid]: { job: 'y24w-x', rk: R.rk, at: Date.now(), st: 'unsure', msg: '눌렀지만 등록상품 목록 값이 판매중·1권', todo: '예스24 판매관리에서 손으로' } }); S._y24wStop = { why: '눌렀지만 등록상품 목록 값이 판매중·1권' }; S._led = null; ledRedraw(); await w(200); const sh = document.getElementById('sheet');
    const td = [...sh.querySelectorAll('.ledtd')].map((x) => x.textContent).join('|'); const rb = sh.querySelector('#led_y24resume'); const r = { td, go: !!sh.querySelector('[data-ledy24go]'), rb: !!rb }; if (rb) { rb.click(); await w(500); sh.querySelector('#led_y24resume').click(); await w(500); } r.stop = S._y24wStop; return r; });
  ok(/확실하지 않음/.test(W4.td) && /할 일/.test(W4.td) && W4.go && W4.rb && C2.resumes === 1 && !W4.stop, "실패·확실하지 않음 = 줄에 까닭·할 일 + 맡기기 다시 · 멈춤 띠 [▶ 예스24 쓰기 이어 가기] 두 번 = 이어 감", { W4, res: C2.resumes });
  const W5 = await p.evaluate(async () => { const d0 = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'MJ-MAIN'); const T = ledTodo(ledNow()).find((x) => x.key === 'SK14'); const why = await ledY24Go([{ T, a: T.acts.find((x) => x.ch === 'yes24') }]); if (d0 == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', d0); return why; });
  ok(/MJ-MAIN/.test(W5) && C2.puts.length === 1, 'MJ-MAIN에서는 예스24 맡기기 안 함', W5);
  /* (11/11 led2b) 자체코드 없는 예스24 줄 — 정범님 화면(실물 3권·남은 1권 · 예스24 지금 2권 → 1권)과 같은 꼴 · A = 이은 예스24 상품 하나 · B = 같은 ISBN 예스24 상품 둘(고르기) · C = 하나(판매중지) */
  await p.evaluate(() => { localStorage.removeItem('rn-led-y24w'); localStorage.removeItem('rn-led-y24pk'); localStorage.removeItem('rn-led-y24mk'); S._y24wStop = null; S._y24wWhy = null;
    window.ledNow = () => { const now = new Date().toISOString(); const t1 = new Date(Date.now() - 3600e3).toISOString();
      const al = [{ id: 'aladin_H1', title: '핫 시험 책', isbn: '9788900000301', grade: '상', price: 9000, qty: 3, live: true, st: '판매중', skus: ['PNKt0301EX', 'PNKt0302EX', 'PNKt0303EX'] }, { id: 'aladin_H2', title: '둘 있는 시험 책', isbn: '9788900000302', grade: '중', price: 5000, qty: 1, live: true, st: '판매중', skus: ['PNKt0311EX'] }, { id: 'aladin_H3', title: '셋째 시험 책', isbn: '9788900000303', grade: '상', price: 4000, qty: 1, live: true, st: '판매중', skus: ['PNKt0321EX'] }];
      const y24 = [{ no: '3010001', title: '핫 시험 책', isbn: '9788900000301', grade: '상', price: 9500, stock: 2, live: true, self: '', alIds: ['aladin_H1'], flags: [] }, { no: '3020001', title: '둘 있는 시험 책', isbn: '9788900000302', grade: '중', price: 5200, stock: 1, live: true, self: '', alIds: ['aladin_H2'], flags: [] }, { no: '3020002', title: '둘 있는 시험 책', isbn: '9788900000302', grade: '중', price: 5600, stock: 1, live: true, self: '', alIds: ['aladin_H2'], flags: [] }, { no: '3030001', title: '셋째 시험 책', isbn: '9788900000303', grade: '상', price: 4200, stock: 1, live: true, self: '', alIds: ['aladin_H3'], flags: [] }];
      const ord = [{ ch: 'cash', no: 'c1', at: t1, amt: 9000, lines: [{ lid: 'aladin_H1', qty: 2 }] }, { ch: 'cash', no: 'c2', at: t1, amt: 5000, lines: [{ lid: 'aladin_H2', qty: 1 }] }, { ch: 'cash', no: 'c3', at: t1, amt: 4000, lines: [{ lid: 'aladin_H3', qty: 1 }] }];
      return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now }); };
    S._led = null; S._ledSel = new Set(); ledRedraw(); });
  await p.waitForTimeout(400);
  const Z1 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const td = [...sh.querySelectorAll('.ledtd')].map((x) => x.textContent).join('|'); const gA = sh.querySelector('[data-ledy24go="PNKt0301EX|3010001"]'), gC = sh.querySelector('[data-ledy24go="PNKt0321EX|3030001"]'); const pk = sh.querySelector('[data-ledy24pk]');
    return { td, gA: gA && gA.textContent, gC: gC && gC.textContent, pk: pk && pk.dataset.ledy24pk, opts: pk ? [...pk.options].map((o) => o.value).filter(Boolean) : [], goB: !!sh.querySelector('[data-ledy24go^="PNKt0311EX|"]'), hand: /자체코드\(SKU\)가 없어 자동으로 못 찾음/.test(td), fill: /＋ 자체코드 PNKt0301EX 채움/.test(td) }; });
  ok(Z1.gA && /🟦 예스24 3010001 수량 1로 맡기기/.test(Z1.gA) && Z1.fill && /예스24 지금 2권/.test(Z1.td) && !Z1.hand, "(led2b) 자체코드 없는 예스24 줄(실물 3권·남은 1권 · 예스24 지금 2권) = 「🟦 예스24 3010001 수량 1로 맡기기」 + '＋ 자체코드 채움' · '자동으로 못 찾음 — 손으로'가 없음", Z1);
  ok(Z1.pk === 'PNKt0311EX|3020001' && Z1.opts.join() === '3020001,3020002' && !Z1.goB && Z1.gC && /판매중지 맡기기/.test(Z1.gC), '(led2b) 같은 ISBN 예스24 상품이 둘이면 그 자리 「어느 상품인지 고르기」(맡기기 단추 대신) · 하나면 판매중지 맡기기', Z1);
  if (process.env.RN_SHOT2) { await p.locator('[data-ledy24pk]').scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await p.screenshot({ path: process.env.RN_SHOT2 }); }
  const nZ0 = C2.puts.length; C2.wait = []; await p.locator('[data-ledy24go="PNKt0301EX|3010001"]').click(); await p.waitForTimeout(500); const nZ1 = C2.puts.length; await p.locator('[data-ledy24go="PNKt0301EX|3010001"]').click(); await p.waitForTimeout(900);
  const zr = (C2.puts[nZ0] || { rows: [] }).rows[0] || {};
  ok(nZ1 === nZ0 && C2.puts.length === nZ0 + 1 && zr.no === '3010001' && zr.self === '' && zr.fill === 'PNKt0301EX' && zr.isbn === '9788900000301' && zr.kind === 'qty' && zr.to === 1 && zr.rid === 'PNKt0301EX|3010001', '(led2b) 두 번 = 번외에 맡김(예스24 상품 번호 · 자체코드 없음 → ISBN으로 찾기 · 자체코드 칸에 우리 SKU 채우기 · 수량 1)', zr);
  await p.selectOption('[data-ledy24pk="PNKt0311EX|3020001"]', '3020002'); await p.waitForTimeout(700);
  const Z2 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const g = sh.querySelector('[data-ledy24go="PNKt0311EX|3020001"]'); return { g: g && g.textContent, pk: ledY24Pk(), sel: !!sh.querySelector('[data-ledy24pk]') }; });
  ok(Z2.g && /3020002 판매중지 맡기기/.test(Z2.g) && Z2.pk.PNKt0311EX === '3020002' && !Z2.sel, '(led2b) 고르면 그 자리에서 고른 상품(3020002) 맡기기 단추 · 이 기기에 기억', Z2);
  /* 보이는 줄 모두 고르기 → 고른 줄 예스24 맡기기(자체코드 없는 줄도) — A는 이미 맡김(진행 중)이라 빠짐 */
  await p.locator('#led_selall').click(); await p.waitForTimeout(400); const nZ2 = C2.puts.length; C2.wait = [];
  await p.locator('#led_bulky24go').click(); await p.waitForTimeout(500); const nZ3 = C2.puts.length; await p.locator('#led_bulky24go').click(); await p.waitForTimeout(900);
  const zb = (C2.puts[nZ2] || { rows: [] }).rows; const nos = zb.map((r) => r.no).sort();
  ok(nZ3 === nZ2 && C2.puts.length === nZ2 + 1 && nos.join() === '3020002,3030001' && zb.every((r) => r.self === '' && /^PNKt03[12]1EX$/.test(r.fill) && r.kind === 'stop'), "(led2b) '보이는 줄 모두 고르기' → 「🟦 고른 줄 예스24 맡기기」 두 번 = 자체코드 없는 줄도 한꺼번에(고른 상품 3020002 · 3030001)", zb);
  /* 예스24 로그인이 풀림 → 맡김은 그대로 '🔐 로그인 기다림'(실패로 버리지 않음) */
  C2.login = 'need'; C2.why = '예스24 로그인 기다림(누르기 전)'; C2.wait = [{ id: C2.puts[nZ0].id, n: 1, rids: ['PNKt0301EX|3010001'] }, { id: C2.puts[nZ2].id, n: 2, rids: zb.map((r) => r.rid) }];
  const Z3 = await p.evaluate(async () => { await ledY24WPoll(); S._led = null; ledRedraw(); await new Promise((r) => setTimeout(r, 300)); const td = [...document.querySelectorAll('#sheet .ledtd')].map((x) => x.textContent).join('|'); const w = ledY24W(); return { td, st: Object.values(w).map((x) => x.st) }; });
  ok(/🔐 예스24 로그인 기다림/.test(Z3.td) && /풀리면 이어 감/.test(Z3.td) && Z3.st.length === 3 && Z3.st.every((s) => s === 'run'), "(led2b) 예스24 로그인이 풀려 있으면 맡긴 줄은 '🔐 로그인 기다림'으로 그대로(실패 아님)", Z3);
  if (process.env.RN_SHOT) { await p.evaluate(() => { localStorage.removeItem('rn-led-y24w'); S._y24wWhy = null; S._led = null; ledRedraw(); }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.RN_SHOT, fullPage: false }); }
  C2.login = 'ok'; C2.why = null;
  /* 로거 PC는 맡기지 않음 */
  const LG = await p.evaluate(async () => { const d0 = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'LOGGER'); const g = ledGuard(); const why = await ledAlGo('SK14', 0); if (d0 == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', d0); return { g, why }; });
  ok(/약속 0/.test(LG.g) && /로거/.test(LG.why), '로거 PC에서는 맡기지 않음', LG);
  /* ② 재고 품목 🗑 = 두 번 누르기 */
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { STK.ch = 'aladin'; STK.del = false; openStockView(); }); await p.waitForTimeout(900);
  const db0 = (await cmds('regDel')).length; const del = p.locator('[data-stkdel1="aladin_U215983411"]'); await del.click(); await p.waitForTimeout(200);
  const D1 = await p.evaluate(() => ({ txt: (document.querySelector('[data-stkdel1="aladin_U215983411"]') || {}).textContent || '', sheet: !!document.querySelector('.bigask-ov'), inp: !!document.querySelector('#bdel_in, .askbox .askin'), tip: (document.querySelector('.ux2-armtip') || {}).textContent || '' }));
  const n1 = (await cmds('regDel')).length; await p.locator('[data-stkdel1="aladin_U215983411"]').click(); await p.waitForTimeout(100); const n1b = (await cmds('regDel')).length;
  await p.waitForTimeout(450); await p.locator('[data-stkdel1="aladin_U215983411"]').click(); await p.waitForTimeout(1000); const RD = await cmds('regDel');
  ok(/한 번 더/.test(D1.txt) && /테스트 책 1/.test(D1.txt + D1.tip) && !D1.sheet && !D1.inp && n1 === db0 && n1b === db0, '🗑 한 번 = 무장(단추에 대상 표시) · 검토 판·글자 입력 창 없음 · 0.4초 안 겹누름 무시', { D1, n1, n1b });
  ok(RD.length === db0 + 1 && RD.some((c) => (c.items || [])[0] && c.items[0].listingKey === 'aladin_U215983411' && c.status === 'queued' && /재고 품목/.test(c.why || '')), '4초 안 다시 = 샵매니저 삭제 맡김 1건(대조 뒤 지움 · 기록 남음)', RD.map((c) => [c.why, c.status]));
  /* 여러 개 검토 판 — 입력 칸 없이 확인 단추 두 번 */
  const M = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); prdDelReview('__prd', ['aladin_U215983413', 'aladin_U215983415']); await w(300); const ov = document.querySelector('.bigask-ov'); if (!ov) return { ov: false };
    const okb = ov.querySelector('.bigask-ok'); const r = { ov: true, inp: !!ov.querySelector('input'), dis: okb.disabled }; okb.click(); await w(500); r.still = !!document.querySelector('.bigask-ov'); r.arm = okb.textContent; okb.click(); await w(800); r.closed = !document.querySelector('.bigask-ov'); return r; });
  const RD2 = await cmds('regDel');
  ok(M.ov && !M.inp && !M.dis && M.still && /한 번 더/.test(M.arm) && M.closed && RD2.length === RD.length + 1, '여러 개 검토 판: 입력 칸 없음 · 확인 한 번 = 무장 · 두 번 = 맡김', { M, n: RD2.length });
  ok(!dlg.length, '브라우저 창(alert/confirm/prompt) 0', dlg);
  console.log(bad ? `❌ tLED1111 ${bad}개 실패` : '✓ tLED1111 통과');
});
