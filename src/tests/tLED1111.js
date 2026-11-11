// tLED1111 — (11/11 정범님) ① 🧾 통합 장부 '🛠 처리할 일' 보기 ② 재고 품목 🗑 = 두 번 누르기(글자 입력 창 없앰) ③ 약속 44 — 웹앱에 '그대로 입력하세요' 글자 입력 확인이 남지 않음
//   ① 순수 셈: app.html의 ◆ledger 덩어리만 떼어 돌림 — 처리할 일 고르기(팔린 실물만 · 과판매 포함) · 고칠 값 = 팔린 뒤 남은 실물 수 · 0 = 판매중지 · 이상한 값은 맡기지 않음
//   ② 화면(harness): 처리할 일 보기 → 알라딘 맡기기 한 번 = 아무것도 안 함 · 두 번 = shp_cmds prdEdit 1건(판매중지) · ⏳ 반영 기다림 · 반영되면 줄이 사라짐(실물 줄은 전체 장부에 그대로)
//        · 일괄(고른 줄) 두 번 · 예스24 = 판매관리 바로 가기 + ✓ 고쳤음(두 번) · 로거 PC는 맡기지 않음
//        · 재고 품목 🗑 한 번 = 무장(대상 표시) · 0.4초 안 겹누름 무시 · 4초 안 다시 = regDel 1건 · 검토 판·입력 칸 없음 · 여러 개 검토 판도 입력 칸 없이 확인 단추 두 번
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tLED1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, ledAlCh, MC_DAYS };')();
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
      const ord = [...window.__ledSold].map((id, i) => ({ ch: 'yes24', no: 'y' + i, at: new Date(Date.now() - 864e5).toISOString(), amt: 5000, lines: [{ sku: 'SK' + id.slice(-2), qty: 1, amt: 5000 }] }));
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
