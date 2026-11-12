// tLED2_1112 — (11/12 정범님 · 일꾼 ledger2)
//   ① 상품 화면 칸 기본 접기 — ⚙ 📚 '상품 화면 칸 처음에 펼치기'(기본 꺼짐): 상품 탭 칸·🧭 상품 화면 모두·통합 장부 ⚙ 거르기·정렬·🤖 자동 내림·🔍 재고 맞추기가 처음엔 접힘
//      · 펼친 칸은 다시 그려도 그대로(이번 세션) · 큰 화면을 새로 열면 다시 접힘 · 설정을 켜면 예전 그대로(지난 상태 기억·처음 펼침)
//   ② 통합 장부 '🟦 예스24 … 수량 1로/판매중지' = 늘 맡기기(두 번) — 페이지로 넘어가지 않음(새 창·이동 0) · 판매관리는 옆 작은 링크만
//      · 지금 못 보내면(맡은 PC 소식 없음) 까닭 한 줄 + '📥 맡긴 일 줄에 들어감' · 맡은 PC가 살아나면 저절로 col2_y24_cmd에 보냄 · 로그인 필요면 '로그인되면 저절로 반영'
//   ③ 통합 장부 머리 칸(🤖 자동 내림·🔍 재고 맞추기)은 스크롤을 따라 내려오지 않음(position static) · 표 머리(열 이름)는 그대로 붙음 · 다른 큰 화면 머리는 그대로
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tLED2_1112.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const LEDNOW = () => { window.ledNow = () => { const al = [{ id: 'aladin_U215983410', n: 3 }, { id: 'aladin_U215983414', n: 1 }, { id: 'aladin_U215983412', n: 1 }].map(({ id, n }) => { const l = S.plist.get(id); return { id, title: l.title, isbn: l.isbn13, grade: l.grade, price: l.price, qty: n, live: aladinLive(l), st: l.status, skus: n > 1 ? ['SK10', 'SK10b', 'SK10c'] : ['SK' + id.slice(-2)] }; });
    const ord = [{ ch: 'cash', no: 'c1', at: new Date((window.__t0 = window.__t0 || Date.now()) - 864e5).toISOString(), amt: 5000, lines: [{ lid: 'aladin_U215983410', qty: 2, amt: 5000 }] }];
    const l4 = S.plist.get('aladin_U215983410'); const y24 = [{ no: '195968650', title: '예스24 줄', isbn: l4.isbn13, price: 6000, stock: 2, live: true, self: '', alIds: ['aladin_U215983410'], flags: [] }];
    return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); }; };
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); const pops = []; p.on('popup', (x) => pops.push(x.url()));
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__opens = []; const o = window.open; window.open = function (u) { window.__opens.push(String(u)); return null; }; void o; });
  const url0 = p.url();
  console.log('① 상품 탭 칸 — 기본 접힘');
  await p.evaluate(() => uxTabGo('products')); await p.waitForTimeout(1200);
  const P1 = await p.evaluate(() => ({ secs: [...document.querySelectorAll('#main details.sec[data-sec]')].map((d) => [d.dataset.sec, d.open]), nav: !!document.querySelector('#main [data-navhub="products"] .nh-body'), pf: localStorage.getItem('rn-pfold-open') }));
  ok(P1.secs.length >= 5 && P1.secs.every(([, o]) => !o) && !P1.nav && P1.pf == null, '상품 탭 칸 모두 접힘(재고 연령·분류별 추이·🟦 예스24 칸 …) · 🧭 상품 화면 모두도 접힘 · 설정 기본 꺼짐', P1);
  await p.locator('#main details.sec[data-sec="p_age"] > summary').click(); await p.waitForTimeout(300); await p.evaluate(() => renderMain()); await p.waitForTimeout(500);
  await p.locator('#main [data-nhfold="products"]').click(); await p.waitForTimeout(300); await p.evaluate(() => renderMain()); await p.waitForTimeout(400);
  const P2 = await p.evaluate(() => ({ age: document.querySelector('#main details.sec[data-sec="p_age"]').open, cat: document.querySelector('#main details.sec[data-sec="p_cat"]').open, nav: !!document.querySelector('#main [data-navhub="products"] .nh-body') }));
  ok(P2.age && !P2.cat && P2.nav, '사람이 펼친 칸은 다시 그려도 그대로(이번 세션) · 다른 칸은 접힌 채 · 🧭 상품 화면 모두 펼침도 그대로', P2);
  console.log('② 통합 장부 — 접이식 칸·스티키');
  await p.evaluate(LEDNOW); await p.evaluate(() => { S._ledView = 'todo'; S._ledSel = new Set(); openLedger(); }); await p.waitForTimeout(700);
  const L1 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const oc = sh.querySelector('#omni_card'); const rc = sh.querySelector('#omni_rc'); const hd = sh.querySelector('.bt-head'); const th = sh.querySelector('.bt-tb th');
    return { oc: oc && oc.tagName + ':' + oc.open, rc: rc && rc.tagName + ':' + rc.open, fold: sh.querySelector('.bt-fold').open, pos: getComputedStyle(hd).position, th: getComputedStyle(th).position, sum: oc && oc.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), cb: !!(oc && oc.querySelector('summary #omni_on')) }; });
  ok(L1.oc === 'DETAILS:false' && L1.rc === 'DETAILS:false' && !L1.fold, '🤖 자동 내림·🔍 재고 맞추기·⚙ 거르기·정렬 모두 처음엔 접힘', L1);
  ok(L1.cb && /자동 내림/.test(L1.sum) && /(켬|끔)/.test(L1.sum) && /이 기기/.test(L1.sum), '접혀도 머리 줄에 켬/끔 스위치·이 기기 돎·건수가 보임', L1.sum);
  ok(L1.pos === 'static' && L1.th === 'sticky', '③ 장부 머리 칸(자동 내림·재고 맞추기)은 스크롤을 따라오지 않음(static) · 표 머리는 sticky 그대로', L1);
  { const cb0 = await p.evaluate(() => document.querySelector('#omni_on').checked); await p.evaluate(() => { document.querySelector('#omni_on').onchange = null; }); await p.locator('#omni_on').click(); await p.waitForTimeout(200);
    const o = await p.evaluate(() => ({ open: document.querySelector('#omni_card').open, cb: document.querySelector('#omni_on').checked })); ok(!o.open && o.cb !== cb0, '머리 줄 켬/끔 스위치를 눌러도 칸이 펼쳐지지 않음(스위치만 바뀜)', o); }
  await p.locator('#omni_card > summary .omni-fs').click(); await p.waitForTimeout(200); await p.evaluate(() => { S._led = null; ledRedraw(); }); await p.waitForTimeout(300);
  const L2 = await p.evaluate(() => ({ oc: document.querySelector('#omni_card').open, rc: document.querySelector('#omni_rc').open }));
  ok(L2.oc && !L2.rc, '펼친 🤖 자동 내림은 다시 그려도(20초마다) 펼친 채 · 재고 맞추기는 접힌 채', L2);
  await p.evaluate(() => { S._bt_ledger.fo = true; history.back(); }); await p.waitForTimeout(500); await p.evaluate(() => { openLedger(); }); await p.waitForTimeout(500);
  const L3 = await p.evaluate(() => ({ oc: document.querySelector('#omni_card').open, fold: document.querySelector('#sheet .bt-fold').open }));
  ok(!L3.oc && !L3.fold, '장부를 닫았다 다시 열면 다시 접힘(⚙ 거르기·정렬 포함)', L3);
  { const pr = await p.evaluate(async () => { history.back(); await new Promise((r) => setTimeout(r, 300)); openProdAll(); await new Promise((r) => setTimeout(r, 400)); const hd = document.querySelector('#sheet .bt-head'); const v = getComputedStyle(hd).position; history.back(); await new Promise((r) => setTimeout(r, 300)); return v; });
    ok(pr === 'sticky', '다른 큰 화면(📚 상품 전체 보기)의 머리 칸은 예전처럼 sticky', pr); }
  console.log('④ 🟦 예스24 단추 = 맡기기(페이지로 안 넘어감)');
  await p.evaluate(() => { S._ledView = 'all'; openLedger(); }); await p.waitForTimeout(600);
  const Y1 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const b = sh.querySelector('[data-ledy24go]'); const big = [...sh.querySelectorAll('a.btn')].filter((a) => /uscm\.yes24/.test(a.href)); const sm = sh.querySelector('.bt-tb a.ledy24open');
    return { b: b && b.tagName + '|' + b.textContent.trim(), big: big.length, sm: !!sm && sm.target === '_blank' }; });
  ok(Y1.b && /^BUTTON\|🟦 예스24 195968650 수량 1로 맡기기$/.test(Y1.b) && Y1.big === 0 && Y1.sm, '전체 장부 할 일 칸 = 「🟦 예스24 195968650 수량 1로 맡기기」 단추(페이지 여는 큰 단추 없음 · 판매관리는 작은 링크만)', Y1);
  const b1 = p.locator('#sheet [data-ledy24go]').first(); await b1.click(); await p.waitForTimeout(200); const arm = await b1.textContent(); const w0 = await p.evaluate(() => Object.keys(ledY24W()).length);
  await p.waitForTimeout(450); await p.locator('#sheet [data-ledy24go]').first().click(); await p.waitForTimeout(900);
  const Y2 = await p.evaluate(async () => { const W = ledY24W(); const e = Object.entries(W)[0] || []; const sh = document.getElementById('sheet'); const td = [...sh.querySelectorAll('.bt-tb .ledtd')].map((x) => x.textContent.replace(/\s+/g, ' ')).join('|'); const cmd = await db.collection('col2_y24_cmd').get(); const cs = []; cmd.forEach((d) => cs.push(d.data().st)); return { rid: e[0], st: e[1] && e[1].st, msg: e[1] && e[1].msg, td, ncmd: cmd.size, cst: cs.join(','), opens: window.__opens.slice() }; });
  ok(/한 번 더/.test(arm || '') && w0 === 0, '한 번 누름 = 무장(맡기지 않음)', { arm, w0 });
  ok(/\|195968650$/.test(Y2.rid || '') && Y2.st === 'hold' && /예스24 쓰기 대기/.test(Y2.msg) && /맡긴 일 줄에 들어감/.test(Y2.td) && /예스24 쓰기 대기: .*HOME/.test(Y2.td) && Y2.ncmd === 1 && Y2.cst === 'hold', '맡은 PC(HOME) 소식이 없음 → 거절·페이지 대신 그 자리에 까닭 한 줄 + 📥 맡긴 일 줄에 들어감(11/12 pend1 — 공용 줄 col2_y24_cmd st hold 1건 · 맡은 PC 수집기는 new만 받음)', Y2);
  ok(!Y2.opens.length && !pops.length && p.url() === url0, '새 창·페이지 이동 0(예스24 판매관리로 넘어가지 않음)', { opens: Y2.opens, pops, url: p.url() });
  /* 맡은 PC가 살아남(로그인은 풀림) → 1분마다 다시 보내기가 저절로 원격 맡김 */
  const Y3 = await p.evaluate(async () => { await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: new Date().toISOString(), hlp: true, login: 'need', on: true } }); S._y24hAt = 0; await ledY24HoldRetry(); await new Promise((r) => setTimeout(r, 300));
    const W = Object.values(ledY24W())[0] || {}; const cmd = await db.collection('col2_y24_cmd').get(); const L = []; cmd.forEach((d) => L.push(d.data())); S._led = null; ledRedraw(); await new Promise((r) => setTimeout(r, 200));
    const td = [...document.querySelectorAll('#sheet .bt-tb .ledtd')].map((x) => x.textContent.replace(/\s+/g, ' ')).join('|'); return { st: W.st, via: W.via, wait: W.wait, n: L.length, row: L[0] && L[0].job && L[0].job.rows[0], holder: L[0] && L[0].holder, td }; });
  ok(Y3.st === 'run' && Y3.via === 'relay' && Y3.n === 1 && Y3.holder === 'HOME' && Y3.row && Y3.row.no === '195968650' && Y3.row.kind === 'qty' && Y3.row.to === 1, '맡은 PC가 살아나면 맡긴 일 줄 → col2_y24_cmd 1건(195968650 수량 1) 저절로', Y3);
  ok(/HOME 번외 예스24 로그인 필요 — 로그인되면 저절로 반영/.test(Y3.wait || '') && /로그인되면 저절로 반영/.test(Y3.td) && /고치는 중/.test(Y3.td), '로그인 풀림이면 줄에 「예스24 쓰기 대기: HOME 번외 예스24 로그인 필요 — 로그인되면 저절로 반영」', Y3.td);
  /* 처리할 일 화면 — 누르기 전에도 그 까닭 한 줄 */
  const Y4 = await p.evaluate(async () => { localStorage.removeItem('rn-led-y24w'); delete window.__FS.col2_y24_cmd; S.y24p.L = []; /* (11/12 pend1) 맡김을 공용 줄에서도 지우고 새로 — 누르기 전 화면만 봄 */ S.y24h.at = 0; y24HoldLoad(true); await new Promise((r) => setTimeout(r, 300)); S._ledView = 'todo'; S._led = null; openLedger(); await new Promise((r) => setTimeout(r, 300));
    const td = [...document.querySelectorAll('#sheet .ledtd')].map((x) => x.textContent.replace(/\s+/g, ' ')).join('|'); return { td, go: !!document.querySelector('#sheet [data-ledy24go]'), sm: !!document.querySelector('#sheet .ledtd a.ledy24open') }; });
  ok(Y4.go && Y4.sm && /⏸ 예스24 쓰기 대기: HOME 번외 예스24 로그인 필요 — 로그인되면 저절로 반영/.test(Y4.td), '🛠 처리할 일 — 맡기기 단추 옆에 누르기 전부터 「⏸ 예스24 쓰기 대기: … 로그인되면 저절로 반영」 · 판매관리는 작은 링크', Y4.td);
  console.log('⑤ ⚙ 설정 — 상품 화면 칸 처음에 펼치기(켜면 예전 그대로)');
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { S.sec.set_pfold = true; S.tab = 'settings'; renderTabs(); renderMain(); }); await p.waitForTimeout(800);
  const cbx = p.locator('#pfold_set [data-pfold]'); const S1 = await cbx.count(); if (S1) { await cbx.scrollIntoViewIfNeeded(); await cbx.check(); } await p.waitForTimeout(200);
  const S2 = await p.evaluate(async () => { const v = localStorage.getItem('rn-pfold-open'); S._secSess = {}; S.sec.p_cat = true; uxTabGo('products'); await new Promise((r) => setTimeout(r, 800)); const cat = document.querySelector('#main details.sec[data-sec="p_cat"]');
    S._ledView = 'todo'; S._led = null; openLedger(); await new Promise((r) => setTimeout(r, 400)); return { v, cat: cat && cat.open, oc: document.querySelector('#omni_card').open, rc: document.querySelector('#omni_rc').open }; });
  ok(S1 === 1 && S2.v === '1' && S2.cat && S2.oc && S2.rc, '켜면 rn-pfold-open=1 · 상품 탭은 지난 상태(rn-sec) 그대로 · 장부 자동 내림·재고 맞추기 펼친 채(예전 그대로)', { S1, S2 });
  ok(!dlg.length, '브라우저 창(alert/confirm/prompt) 없음', dlg);
  console.log(bad ? `❌ tLED2_1112 ${bad}개 실패` : '✓ tLED2_1112 모두 통과');
}, { vp: { width: 1400, height: 900 } });
