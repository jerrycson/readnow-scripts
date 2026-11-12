// tLED3_1112 — (11/12 정범님 '엔진이 스스로 알라딘 개별 상품 안 재고수와 예스24 재고를 대조하면 되지 않나' · 일꾼 led3)
//   ① 순수 셈(◆ledger 덩어리만): 켜기 전 주문으로 생긴 할 일 = 밀린 일 → o.bl일 때만 고름 · 미리보기 상태(omniBl none·wait·go·stop)
//      · 보내기 직전 다시 셈(omniStill — 이미 맞으면 닫음 · 알라딘 기준이 바뀌면 이번엔 안 보냄)
//      · 주문 없음: 예스24 > 알라딘 개별 상품(≤ SKU) → 예스24를 알라딘 수량에 맞춤(fit) · 알라딘 > SKU → 🔍 실사 목록(처리할 일·자동 내림에서 빠짐) · 예스24 < 알라딘 → 올리지 않고 표시만
//   ② 화면(harness): 밀린 주문 할 일 → 장부 맨 위 '밀린 n건 엔진이 처리 예정' 미리보기 줄 · 1분 돌기 = 미리보기 시작(1시간 뒤) · 그 사이 맡기지 않음
//      · ⏸ 멈추기(두 번) → 시간이 지나도 맡기지 않음 · ▶ 다시 시작(두 번) → 1시간 뒤(시간을 당겨) 맡김 · 다시 셈으로 이미 맞은 줄은 닫음(맡기지 않음)
//      · 처리할 일 머리 '엔진이 처리 중 n · 사람이 고를 것 n · 실사 필요 n' · 🔍 실사 목록 보기 칸
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tLED3_1112.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, ledAudit, omniPick, omniBl, omniStill, omniReMap, omniRk, OMNI_BL_MS, OMNI_RE_MAX, OMNI_RE_GAP_MS, OMNI_Y24_RESET };')();
console.log('① 순수 셈');
{ const from = '2026-11-12T03:00:00Z';
  const I = { now: '2026-11-12T05:00:00Z', days: 30,
    al: [{ id: 'aladin_B1', title: '밀린 책', qty: 1, live: true, st: '판매중', skus: ['B1'] }, { id: 'aladin_N1', title: '새 주문 책', qty: 1, live: true, st: '판매중', skus: ['N1'] },
      { id: 'aladin_F1', title: '예스24 많음', qty: 1, live: true, st: '판매중', skus: ['F1'] }, { id: 'aladin_A1', title: '알라딘 많음', qty: 3, live: true, st: '판매중', skus: ['A1'] },
      { id: 'aladin_L1', title: '예스24 적음', qty: 2, live: true, st: '판매중', skus: ['L1', 'L1b'] }],
    y24: [{ no: '801', title: '밀린 책', stock: 1, live: true, self: 'B1', flags: [] }, { no: '803', title: '예스24 많음', stock: 3, live: true, self: 'F1', flags: [] }, { no: '804', title: '알라딘 많음', stock: 1, live: true, self: 'A1', flags: [] }, { no: '805', title: '예스24 적음', stock: 1, live: true, self: 'L1', flags: [] }, { no: '806', title: '새 주문 책', stock: 1, live: true, self: 'N1', flags: [] }],
    ord: [{ ch: 'aladin', no: 'o1', at: '2026-11-12T01:00:00Z', amt: 3000, lines: [{ lid: 'aladin_B1', qty: 1 }] }, { ch: 'aladin', no: 'o2', at: '2026-11-12T04:00:00Z', amt: 3000, lines: [{ lid: 'aladin_N1', qty: 1 }] }] };
  const V = F.ledBuild(I); const TD = F.ledTodo(V); const g = (k) => TD.find((x) => x.key === k);
  const P0 = F.omniPick(TD, { from }).map((p) => p.T.key + ':' + p.a.ch); const P1 = F.omniPick(TD, { from, bl: 1 }); const k1 = P1.map((p) => p.T.key + ':' + p.a.ch + (p.bl ? ':bl' : ''));
  ok(JSON.stringify(P0) === JSON.stringify(['N1:yes24']), '미리보기 전(o.bl 없음) = 켠 뒤 주문만(예전 그대로)', P0);
  ok(k1.includes('B1:yes24:bl') && k1.includes('N1:yes24') && k1.includes('F1:yes24:bl') && !k1.some((x) => /^A1|^L1/.test(x)), '시작 뒤(o.bl) = 켜기 전 주문(B1)·주문 없는 예스24 > 알라딘(F1)도 · 알라딘 > SKU(A1)·예스24 적음(L1)은 안 고름', k1);
  const f = g('F1').acts.find((a) => a.ch === 'yes24'); ok(f && f.fit === 'al' && f.to === 1 && f.k === 'qty' && /알라딘에 맞춤/.test(f.why), '예스24 3권 > 알라딘 개별 상품 1권(SKU 1) → 예스24 수량 1로(알라딘에 맞춤)', f);
  ok(g('A1') && g('A1').aud && !(g('A1').acts.some((a) => a.fit)), '알라딘 3권 > SKU 1권(주문 없음) → aud(실사 필요 — 엔진은 알라딘을 내리지 않음)', g('A1'));
  const AU = F.ledAudit(V); const au = (k) => AU.find((x) => x.key === k);
  ok(au('A1') && au('A1').kind === 'aud' && au('A1').alq === 3 && au('A1').P === 1 && au('L1') && au('L1').kind === 'y24low' && au('L1').y24q === 1 && !au('F1') && !au('B1'), '🔍 실사 목록: A1 실사 필요 · L1 예스24 적음(올리지 않고 표시만) · 맞춤·주문 줄은 없음', AU);
  const t0 = Date.parse('2026-11-12T05:00:00Z');
  ok(F.omniBl({}, t0) === 'none' && F.omniBl({ at: '2026-11-12T04:30:00Z', go: '2026-11-12T05:30:00Z' }, t0) === 'wait' && F.omniBl({ at: '2026-11-12T03:30:00Z', go: '2026-11-12T04:30:00Z' }, t0) === 'go' && F.omniBl({ at: '2026-11-12T03:30:00Z', go: '2026-11-12T04:30:00Z', stop: 1 }, t0) === 'stop' && F.OMNI_BL_MS === 3600e3, '미리보기 상태: 전·1시간 기다림·시작·멈춤', null);
  ok(F.omniBl({ at: '2026-11-12T04:30:00Z' }, t0) === 'wait' && F.omniBl({ at: '2026-11-12T03:59:00Z' }, t0) === 'go', 'go 칸이 없으면 at + 1시간');
  const b1 = g('B1').acts.find((a) => a.ch === 'yes24');
  ok(F.omniStill(b1, { live: true, qty: 1 }).go === 1 && b1.to === 0, '다시 셈 — 아직 판매중이면 보냄', b1);
  ok(!!F.omniStill(b1, { live: false, qty: 1 }).shut && !!F.omniStill({ ...b1, to: 1 }, { live: true, qty: 1 }).shut, '다시 셈 — 이미 판매중이 아니거나 수량이 이미 맞으면 닫음');
  ok(F.omniStill(f, { live: true, qty: 3, alq: 1 }).go && !!F.omniStill(f, { live: true, qty: 3, alq: 2 }).wait && !!F.omniStill(f, { live: true, qty: 3, alq: null }).wait && !!F.omniStill(f, { live: true, qty: 1, alq: 1 }).shut, '알라딘에 맞춤 — 알라딘 수량이 바뀌었으면 이번엔 안 보냄(다음 셈) · 예스24가 이미 같으면 닫음');
  ok(F.omniStill(b1, null).go, '지금 값을 모르면(자료 없음) 장부 셈 그대로');
  /* (리드 덧붙임) 번외·로거가 늦게 받아 거절한 맡김 → 엔진이 새 열쇠로 다시(같은 열쇠 중복 막기 유지) */
  const L = { a: { st: 'sent' }, b: { st: 'sent' }, c: { st: 'fail' }, d: { st: 'sent' }, 'd#2': { st: 'sent' }, e: { st: 'sent' }, 'e#2': { st: 'dup' }, 'e#3': { st: 'sent' }, 'e#4': { st: 'sent' }, 'e#5': { st: 'sent' }, f: { st: 'sent' }, 'f#2': { st: 'sent' }, g: { st: 'claim' } };
  const RM = F.omniReMap(L, (k) => ['a', 'c', 'd#2', 'e#5', 'g'].includes(k));
  ok(RM.a === 'a#2' && !RM.b && !RM.c && RM.d === 'd#3' && !RM.e && RM.f === 'f#2' && RM.g === 'g#2' && F.OMNI_RE_MAX === 5, '다시 맡길 열쇠: 거절·끊김 → 열쇠#2 · 두 번째도 거절 → #3 · 5번째까지만 · 맡기기 전 실패는 사람 손 · 다시 맡긴 것이 괜찮으면 그 열쇠로 막음', RM);
  { /* (y24chk 11/12) 번외가 '못 함'으로 끝낸 맡김은 30분 뒤에 다시 — 같은 고장에 1분마다 걸려 상한을 2분 만에 다 쓰던 것 */ const t1 = Date.parse('2026-11-13T08:48:00Z'); const L2 = { h: { ch: 'yes24', st: 'sent', at: '2026-11-13T08:46:23Z', doneAt: '2026-11-13T08:46:26Z' }, i: { ch: 'yes24', st: 'sent', at: '2026-11-13T08:46:23Z' }, 'i#3': { ch: 'yes24', st: 'sent', at: '2026-11-13T08:48:59Z', doneAt: '2026-11-13T08:48:59Z' }, j: { ch: 'aladin', st: 'sent', at: '2026-11-13T08:47:00Z' }, k: { ch: 'yes24', st: 'claim', at: '2026-11-13T08:40:00Z' } };
    { const RS = F.OMNI_Y24_RESET; const L3 = { m: { ch: 'yes24', st: 'sent', at: '2026-11-12T10:00:00Z' }, 'm#5': { ch: 'yes24', st: 'sent', at: '2026-11-12T10:49:39Z', doneAt: '2026-11-12T10:49:39Z' }, n: { ch: 'yes24', st: 'sent', at: '2026-11-12T12:00:00Z' }, 'n#5': { ch: 'yes24', st: 'sent', at: '2026-11-12T12:00:00Z', doneAt: '2026-11-12T12:00:00Z' } };
      const A0 = F.omniReMap(L3, () => true, RS - 60e3), A1 = F.omniReMap(L3, () => true, RS + 60e3), A2 = F.omniReMap(L3, () => true, Date.parse('2026-11-12T13:00:00Z'));
      ok(F.omniReMap({ q: { ch: 'yes24', st: 'sent', at: '2026-11-12T10:00:00Z' }, 'q#6': { ch: 'yes24', st: 'later', at: '2026-11-12T11:55:11Z', doneAt: '2026-11-12T11:55:11Z' } }, () => false, Date.parse('2026-11-12T11:58:00Z')).q === 'q#7', "6번째가 '처음 한 건을 확인하는 중'이어도 2분 뒤 7번째로(상한 OMNI_RE_MAX + 2)");
      ok(A0.m === 'm#5' && A1.m === 'm#6' && !A2.n && RS === Date.parse('2026-11-12T11:55:00Z'), '(한 번만) 번외 고침 전에 상한까지 간 예스24 맡김은 고친 판이 닿은 뒤 한 번 더 · 그 전엔 같은 열쇠로 막음 · 그 뒤 맡김은 상한 그대로', { A0, A1, A2 }); }
    const R1 = F.omniReMap(L2, () => true, t1), R2 = F.omniReMap(L2, () => true, t1 + 31 * 60e3), R3 = F.omniReMap(L2, () => true, Date.parse('2026-11-13T09:30:00Z'));
    ok(R1.h === 'h' && R2.h === 'h#2' && R3['i'] === 'i#4' && F.omniReMap(L2, () => true, Date.parse('2026-11-13T09:10:00Z')).i === 'i#3' && R1.j === 'j#2' && R1.k === 'k#2' && F.OMNI_RE_GAP_MS === 30 * 60e3, "예스24 번외 '못 함' 뒤 다시 맡기기는 30분 간격(그 전엔 같은 열쇠로 막음) · 상한에 닿은 #3도 #4로(새 판 뒤) · 끊김·알라딘은 예전처럼 곧바로", { R1, R2, R3 }); }
  const b1T = g('B1'); const rk0 = F.omniRk(b1T, b1); const P2 = F.omniPick(TD, { from, bl: 1, done: new Set([rk0]) }).map((p) => p.T.key); const P3 = F.omniPick(TD, { from, bl: 1, done: new Set([rk0]), re: { [rk0]: rk0 + '#2' } }).find((p) => p.T.key === 'B1');
  ok(!P2.includes('B1') && P3 && P3.rk === rk0 + '#2', '고르기: 맡긴 열쇠는 다시 안 고름 · 다시 맡길 열쇠가 있으면 새 열쇠로 고름', { P2, rk: P3 && P3.rk }); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tLED3_1112 ${bad}개 실패` : '✓ tLED3_1112 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const cmds = () => p.evaluate(async () => { const g = await db.collection('shp_cmds').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.type === 'prdEdit') L.push({ id: d.id, k: v.listingKey, ch: v.ch }); }); return L; });
  /* 410 = 켜기 전 예스24에서 팔림(알라딘 판매중 · 밀린 일) · 414 = 켜기 전 예스24에서 팔림 — 알라딘은 이미 판매중지(장부 셈은 아직 판매중 = 목록이 늦음 → 다시 셈으로 닫음) · 412 = 알라딘 3권 > SKU 1(실사) */
  await p.evaluate(() => { window.__T0 = Date.now(); const ids = ['aladin_U215983410', 'aladin_U215983414', 'aladin_U215983412']; ids.forEach((id) => { const l = S.plist.get(id); l.status = '판매중'; l.active = true; });
    window.ledNow = () => { const al = ids.map((id) => { const l = S.plist.get(id); return { id, title: l.title, price: l.price, qty: id.endsWith('12') ? 3 : 1, live: true, st: '판매중', skus: ['SK' + id.slice(-2)] }; });
      const ord = ['aladin_U215983410', 'aladin_U215983414'].map((id, i) => ({ ch: 'yes24', no: 'y' + i, at: new Date(window.__T0 - 3 * 3600e3).toISOString(), amt: 5000, lines: [{ sku: 'SK' + id.slice(-2), qty: 1 }] }));
      return ledBuild({ al, y24: [], ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S.y24.loaded = true; S.y24o.loaded = true; localStorage.removeItem('rn-c2seen'); });
  await p.evaluate(async () => { await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); await omniLoad(true); S._led = null; S._ledView = 'todo'; openLedger(); });
  await p.waitForTimeout(600);
  const A = await p.evaluate(() => { const b = document.getElementById('omni_bl'); const sp = document.getElementById('led_split'); const sh = document.getElementById('sheet'); return { bl: b ? b.textContent : '', st: b && b.dataset.blst, top: !!(b && sh && sh.querySelector('#omni_bl') && sh.innerHTML.indexOf('omni_bl') < sh.innerHTML.indexOf('data-ledview')), sp: sp ? sp.textContent : '', tabs: [...document.querySelectorAll('[data-ledview]')].map((x) => x.textContent.trim()) }; });
  ok(/밀린\s*2건 엔진이 처리 예정/.test(A.bl) && A.st === 'none' && A.top, '장부 맨 위 미리보기 줄 — 밀린 2건 엔진이 처리 예정(아직 미리보기 전)', A);
  ok(/엔진이 처리 중\s*2/.test(A.sp) && /고를 것\([^)]*\)\s*0/.test(A.sp) && /실사 필요\s*1/.test(A.sp) && A.tabs.some((t) => /실사 목록\s*1/.test(t)), "처리할 일 머리 '엔진이 처리 중 2 · 사람이 고를 것 0 · 실사 필요 1' · 🔍 실사 목록 칸", A);
  await p.evaluate(async () => { S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(400);
  const B = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('platforms').get(); return { b: ((d.data() || {}).omni || {}).backlog || null, cfg: omniCfg().bl }; });
  ok(B.b && B.b.at && Date.parse(B.b.go) - Date.parse(B.b.at) === 3600e3 && B.b.n === 2 && (await cmds()).length === 0, '1분 돌기 = 미리보기 시작(모든 기기 같은 자리 · 1시간 뒤 시작) · 그 사이 맡기지 않음', B);
  await p.evaluate(() => ledRedraw()); await p.waitForTimeout(300);
  const W = await p.evaluate(() => (document.getElementById('omni_bl') || {}).textContent || ''); ok(/남은\s*\d+분/.test(W) && /멈추기/.test(W), '미리보기 줄 — 시작 시각·남은 분 · ⏸ 멈추기', W);
  /* ⏸ 멈추기 두 번 */
  await p.locator('#omni_blstop').click(); await p.waitForTimeout(150); const s1 = await p.evaluate(() => omniCfg().bl.stop || 0); await p.waitForTimeout(450); await p.locator('#omni_blstop').click(); await p.waitForTimeout(500);
  const S1 = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('platforms').get(); const b = ((d.data() || {}).omni || {}).backlog; await db.collection('app_settings').doc('platforms').set({ omni: { backlog: { go: new Date(Date.now() - 60e3).toISOString() } } }, { merge: true }); await omniLoad(true); S.omni.at = 0; await omniTick(); return { b, st: omniBl(omniCfg().bl) }; });
  await p.waitForTimeout(400);
  ok(!s1 && S1.b && S1.b.stop === 1 && S1.st === 'stop' && (await cmds()).length === 0, '⏸ 멈추기 = 두 번(한 번은 무장) · 멈춘 뒤엔 시간이 지나도 맡기지 않음', S1);
  await p.evaluate(() => ledRedraw()); await p.waitForTimeout(300);
  const W2 = await p.evaluate(() => (document.getElementById('omni_bl') || {}).textContent || ''); ok(/엔진 처리 멈춤/.test(W2) && /다시 시작/.test(W2), '멈춘 줄 — 사람이 🛠에서 · ▶ 다시 시작', W2);
  await p.locator('#omni_blgo').click(); await p.waitForTimeout(600); await p.locator('#omni_blgo').click(); await p.waitForTimeout(500);
  const G = await p.evaluate(async () => { const b = omniCfg().bl; S.omni.at = 0; await omniTick(); return { b, st: omniBl(b) }; }); await p.waitForTimeout(300);
  ok(G.b && !G.b.stop && G.st === 'wait' && (await cmds()).length === 0, '▶ 다시 시작(두 번) = 1시간 미리보기부터 다시', G);
  /* 1시간 지남(당김) — 414는 알라딘에서 이미 판매중지(장부 셈만 늦음) → 다시 셈으로 닫음 · 410은 맡김 */
  const H = await p.evaluate(async () => { S.plist.get('aladin_U215983414').status = '판매중지'; await db.collection('app_settings').doc('platforms').set({ omni: { backlog: { go: new Date(Date.now() - 60e3).toISOString() } } }, { merge: true }); await omniLoad(true); S.omni.at = 0; await omniTick(); await omniLoad(true); return Object.values(S.omni.log).map((e) => ({ key: e.key, ch: e.ch, st: e.st, msg: e.msg })); });
  await p.waitForTimeout(400); const C3 = await cmds();
  const e410 = H.find((e) => e.key === 'SK10'), e414 = H.find((e) => e.key === 'SK14');
  ok(C3.length === 1 && C3[0].k === 'aladin_U215983410' && C3[0].ch && C3[0].ch.state === '판매중지' && e410 && e410.st === 'sent', '1시간 뒤 = 밀린 410 알라딘 판매중지 맡김(기존 자동 내림 길 · shp_cmds prdEdit)', { C3, H });
  ok(e414 && e414.st === 'shut' && /다시 셈/.test(e414.msg) && !C3.some((c) => c.k === 'aladin_U215983414'), '414 = 보내기 직전 다시 셈 — 알라딘이 이미 판매중이 아님 → 닫음(맡기지 않음)', e414);
  await p.evaluate(async () => { S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(300); ok((await cmds()).length === 1, '다시 돌아도 되풀이 0(닫은 줄도 다시 안 고름)');
  const K = await p.evaluate(() => { S._omniWhy = null; ledRedraw(); const c = document.querySelector('#omni_card'); return c ? c.textContent : ''; }); ok(/다시 셈/.test(K), '🤖 자동 내림 기록에 닫은 줄(다시 셈 — 이미 판매중이 아님) 보임', K.slice(0, 300));
  /* 🔍 실사 목록 */
  await p.evaluate(() => { const b = document.querySelector('[data-ledview="aud"]'); b.click(); }); await p.waitForTimeout(500);
  const U = await p.evaluate(() => { const sh = document.getElementById('sheet'); return { txt: sh ? sh.textContent : '', rows: sh ? sh.querySelectorAll('tbody tr').length : 0, pid: !!(sh && sh.querySelector('[data-pid="aladin_U215983412"]')) }; });
  ok(/실사 필요\s*1/.test(U.txt) && U.rows >= 1 && U.pid && /SK12/.test(U.txt) && /3권/.test(U.txt), '🔍 실사 목록 보기 — 알라딘 3권 > SKU 1권 줄 · 상품 상세 단추', { rows: U.rows, pid: U.pid, t: U.txt.slice(0, 400) });
  /* (리드 덧붙임) 맡긴 410이 끊김(번외·로거가 받지 않음 · 5분 넘게 claim)으로 끝남 → 엔진이 열쇠#2로 다시 · 홈 ⚠ 셈에서는 앞 기록이 빠짐 */
  const RT = await p.evaluate(async () => { await omniLoad(true); const k0 = Object.keys(S.omni.log).find((k) => (S.omni.log[k] || {}).key === 'SK10'); const ref = db.collection('app_settings').doc('omni_auto'); const d = (await ref.get()).data(); d.c[k0] = { ...d.c[k0], st: 'claim', at: new Date(Date.now() - 10 * 60e3).toISOString() }; await ref.set(d);
    await omniLoad(true); const bad0 = omniBadL().map((e) => e.rk); S.omni.at = 0; await omniTick(); await omniLoad(true); return { k0, bad0, keys: Object.keys(S.omni.log), bad1: omniBadL().map((e) => e.rk), e2: S.omni.log[k0 + '#2'] || null }; });
  ok(RT.bad0.includes(RT.k0) && RT.e2 && RT.e2.re === 2 && !RT.bad1.includes(RT.k0), '끊긴 맡김 → 엔진이 새 열쇠(#2)로 다시 맡김 · 앞 기록은 ⚠ 못 맡김 셈에서 빠짐', RT);
  ok(!dlg.length, '브라우저 창(alert·confirm) 0', dlg);
  console.log(bad ? `❌ tLED3_1112 ${bad}개 실패` : '✓ tLED3_1112 모두 통과'); });
