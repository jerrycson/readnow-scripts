// tOMNI1111 — (11/11 omni1 · 통합 솔루션) 🤖 자동 내림 · 🔍 재고 맞추기 · 📋 주문 모음 · 팔린 알라딘 상품이 장부에서 빠지던 것
//   ① 순수 셈: ◆ledger 덩어리만 떼어 돌림 — omniPick(켠 뒤 주문만 · 팔린 판매처는 안 건드림 · 예스24는 자체코드 = SKU만 · 같은 열쇠 한 번 · 상한) · omniRecon(실물 없음·짝 없음·자체코드 없음 · 판매처 합계)
//   ② 화면(harness): 🛠 처리할 일 위 🤖 자동 내림 카드(기본 켬) → 1분 돌기(omniTick) 한 번 = 예스24 주문 → 알라딘 판매중지 맡김 1건 · 다시 돌아도 되풀이 0 · 단계 줄
//        · 알라딘 주문 → 예스24 판매중지를 번외(가짜 127.0.0.1:8797)에 맡김 · 끄면(두 기기 같은 설정) 맡기지 않음 · 켜기 전 주문은 안 맡김 · 로거 PC는 안 돎
//        · 🔍 재고 맞추기 카드 · 실물 없음 줄 🟦 맡기기 두 번 = 번외에 판매중지 1건 · 📋 주문 모음 보기(판매처 칩·상태)
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tOMNI1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, omniPick, omniRk, omniRecon, OMNI_LIM };')();
console.log('① 순수 셈');
{ const I = { now: '2026-11-11T05:00:00Z', days: 30,
    al: [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U3', title: '책3', price: 3000, qty: 0, live: false, st: '판매완료', skus: ['S3'] }, { id: 'aladin_U4', title: '책4', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S4'] }],
    y24: [{ no: '900', title: '책1', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '903', title: '책3', price: 3000, stock: 1, live: true, self: 'S3', flags: [] }, { no: '904', title: '책4', price: 3000, stock: 1, live: true, self: '', alIds: ['aladin_U4'], flags: [] }],
    ord: [{ ch: 'yes24', no: 'y1', at: '2026-11-11T04:00:00Z', amt: 8500, lines: [{ sku: 'S1', qty: 1 }] }, { ch: 'aladin', no: 'o3', at: '2026-11-11T04:10:00Z', amt: 3000, lines: [{ lid: 'aladin_U3', qty: 1 }] }, { ch: 'aladin', no: 'o4', at: '2026-11-11T04:20:00Z', amt: 3000, lines: [{ lid: 'aladin_U4', qty: 1 }] }] };
  const TD = F.ledTodo(F.ledBuild(I)); const t1 = TD.find((x) => x.key === 'S1'), t3 = TD.find((x) => x.key === 'S3');
  ok(t1 && t1.from.join() === 'yes24' && t3 && t3.from.join() === 'aladin', '처리할 일에 어디서 팔렸는지(from)', TD.map((x) => [x.key, x.from]));
  ok(t3 && t3.acts.some((a) => a.ch === 'yes24' && a.k === 'down' && a.no === '903'), '알라딘에서 팔려 판매완료가 된 상품도 장부에 남아 → 예스24 내릴 일이 생김(예전엔 사라졌음)', t3);
  const P = F.omniPick(TD, { from: '2026-11-11T03:00:00Z' }); const ks = P.map((p) => p.T.key + ':' + p.a.ch).sort();
  ok(JSON.stringify(ks) === JSON.stringify(['S1:aladin', 'S3:yes24']), '고르기: 예스24 주문 → 알라딘 · 알라딘 주문 → 예스24(자체코드 = SKU) · 자체코드 없는 예스24(짐작 짝)는 사람 손', ks);
  ok(!P.some((p) => p.a.ch === p.T.from[0]), '팔린 판매처 자신은 건드리지 않음');
  ok(F.omniPick(TD, { from: '2026-11-11T04:15:00Z' }).length === 0 && F.omniPick(TD, { from: '' }).length === 0, '켠 시각 앞 주문은 안 고름 · 켠 시각이 없으면 아무것도 안 고름');
  const done = new Set([P[0].rk]); ok(F.omniPick(TD, { from: '2026-11-11T03:00:00Z', done }).length === 1, '같은 할 일 열쇠는 한 번만');
  ok(F.omniPick(TD, { from: '2026-11-11T03:00:00Z', lim: { aladin: 0 } }).every((p) => p.a.ch !== 'aladin'), '판매처마다 한 번에 맡기는 수 상한');
  const t1b = { ...t1, last: '2026-11-11T06:00:00Z' }; ok(F.omniRk(t1b, t1.acts[0]) !== F.omniRk(t1, t1.acts[0]), '새로 팔리면(주문 시각이 바뀌면) 새 열쇠');
  const R = F.omniRecon({ al: [{ id: 'a', st: '판매중', live: true, skus: ['K1'], qty: 1 }, { id: 'b', st: '판매완료', live: false, skus: ['K2'] }, { id: 'c', st: '판매중지', live: false, skus: ['K5'] }],
    y24: [{ no: '1', self: 'K1', live: true, stock: 1 }, { no: '2', self: 'K2', live: true, stock: 1, title: '나간 책' }, { no: '3', self: 'K9', live: true, stock: 1 }, { no: '4', self: '', live: true, stock: 1 }, { no: '5', self: 'K5', live: true, stock: 1 }, { no: '6', self: 'K2', live: false, stock: 1 }] });
  ok(R.bad.map((b) => b.no + b.kind).join() === '2gone,3nomatch,4noself' && R.bad[0].to === 0, '재고 맞추기: 실물 없음(알라딘 판매완료) · 짝 없음 · 자체코드 없음 — 판매중지(실물은 있음)·예스24 판매 안 함은 어긋남 아님', R.bad);
  ok(R.sum.yes24.live === 5 && R.sum.yes24.phys === 2 && R.sum.aladin.live === 1, '판매처 합계(판매중 줄·실물)', R.sum); }
{ ok(!/\b(alert|confirm|prompt)\s*\(/.test(cut('/* ══ (11/11 omni1 · 통합 솔루션)', 'function openLedger() {')), '새 코드에 브라우저 창 없음');
  ok(!/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(cut('/* ══ (11/11 omni1 · 통합 솔루션)', 'function openLedger() {')), '새 코드에 휴대전화 번호 꼴 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tOMNI1111 ${bad}개 실패` : '✓ tOMNI1111 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const C2 = { puts: [], res: {}, wait: [] };
  await p.route(/127\.0\.0\.1:8797\//, async (rt) => { const u = new URL(rt.request().url()); let b = {}; try { b = JSON.parse(rt.request().postData() || '{}'); } catch (e) {} const J = (o, st) => rt.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (u.pathname === '/y24/w/put') { C2.puts.push(b); C2.wait = [{ id: b.id, n: b.rows.length }]; return J({ ok: true, took: b.id }); }
    if (u.pathname === '/y24/w/state') return J({ ok: true, ok1: 1, stop: null, wait: C2.wait, cur: null, res: C2.res });
    if (u.pathname === '/y24/w/ack') return J({ ok: true });
    return J({ ok: false }, 404); });
  const cmds = () => p.evaluate(async () => { const g = await db.collection('shp_cmds').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.type === 'prdEdit') L.push({ id: d.id, ...v }); }); return L; });
  /* 장부 자료: 410 = 예스24에서 팔림(알라딘 판매중) · 414 = 알라딘에서 팔림(예스24 777 판매중 · 자체코드 SK14) */
  await p.evaluate(() => { window.__T0 = Date.now(); window.__sold = [['yes24', 'aladin_U215983410'], ['aladin', 'aladin_U215983414']];
    window.ledNow = () => { const al = ['aladin_U215983410', 'aladin_U215983414'].map((id) => { const l = S.plist.get(id); return { id, title: l.title, price: l.price, qty: 1, live: aladinLive(l), st: l.status, skus: ['SK' + id.slice(-2)] }; });
      const ord = window.__sold.map(([ch, id], i) => ({ ch, no: 'n' + i, at: new Date(window.__T0 - 60e3).toISOString(), amt: 5000, lines: [ch === 'yes24' ? { sku: 'SK' + id.slice(-2), qty: 1 } : { lid: id, qty: 1 }] }));
      return ledBuild({ al, y24: [{ no: '777', title: '예스24 줄', price: 6000, stock: 1, live: true, self: 'SK14', flags: [] }], ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S.y24.loaded = true; S.y24o.loaded = true; localStorage.removeItem('rn-c2seen'); });
  await p.evaluate(async () => { await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); S.app = { ...S.app }; delete S.app.platforms; /* 다른 설정 듣기가 S.app을 통째로 바꾼 꼴 */ S._ledView = 'todo'; openLedger(); });
  await p.waitForTimeout(600);
  const A0 = await p.evaluate(() => { const c = document.querySelector('#omni_card'); return { card: !!c, on: !!(c && c.querySelector('#omni_on').checked), txt: c ? c.textContent : '', rc: !!document.querySelector('#omni_rc'), tabs: [...document.querySelectorAll('[data-ledview]')].map((b) => b.textContent.trim()) }; });
  ok(A0.card && A0.on && /켬/.test(A0.txt) && A0.rc && A0.tabs.length === 3 && /주문 모음/.test(A0.tabs[2]), '🛠 처리할 일 위 🤖 자동 내림 카드(켬) · 🔍 재고 맞추기 카드 · 보기 칸 셋(전체·처리할 일·📋 주문 모음)', A0);
  /* 돌기 한 번 — 이 기기엔 번외 없음 → 알라딘 쪽만 */
  await p.evaluate(async () => { await omniTick(); }); await p.waitForTimeout(600); const C1 = await cmds();
  const L1 = await p.evaluate(async () => { await omniLoad(true); return Object.values(S.omni.log); });
  ok(C1.length === 1 && C1[0].listingKey === 'aladin_U215983410' && C1[0].ch && C1[0].ch.state === '판매중지', '예스24 주문 → 1분 돌기에서 알라딘 판매중지 저절로 맡김 1건(🛠 맡기기와 같은 길 · shp_cmds prdEdit)', C1.map((c) => [c.listingKey, c.ch]));
  ok(L1.length === 1 && L1[0].st === 'sent' && L1[0].ch === 'aladin' && L1[0].dev !== undefined && !C2.puts.length, '기록(app_settings/omni_auto) — 누가·어느 기기·맡김 · 번외 없는 기기는 예스24 쪽을 안 함', L1);
  await p.evaluate(async () => { S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(500); ok((await cmds()).length === 1, '다시 돌아도 같은 할 일은 되풀이 0');
  /* 번외가 있는 기기 → 예스24 쪽 */
  await p.evaluate(async () => { localStorage.setItem('rn-c2seen', '1'); S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(600);
  const r0 = C2.puts[0] && C2.puts[0].rows[0];
  ok(C2.puts.length === 1 && r0 && r0.no === '777' && r0.self === 'SK14' && r0.kind === 'stop', '알라딘 주문 → 예스24 777(자체코드 SK14) 판매중지를 번외에 저절로 맡김', C2.puts);
  const V = await p.evaluate(() => { S._omniWhy = null; ledRedraw(); const c = document.querySelector('#omni_card'); return { stp: c.querySelectorAll('.shl-stp li').length, rows: c.querySelectorAll('.omni-r').length, txt: c.textContent }; });
  ok(V.stp === 4 && V.rows === 2 && /반영 기다림|고치는 중/.test(V.txt) && /에서 팔림/.test(V.txt), '카드: 단계 줄(주문 확인 → 맡김 → 판매처 반영 → 목록 확인) · 줄마다 어디서 팔렸는지·지금 상태', V);
  /* 끄기 → 새 주문이 와도 맡기지 않음 */
  await p.evaluate(async () => { const cb = document.querySelector('#omni_on'); cb.checked = false; await cb.onchange(); });
  await p.waitForTimeout(400); const off = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('platforms').get(); window.__sold.push(['yes24', 'aladin_U215983415']); return { cfg: (((d.data() || {}).omni || {}).autoDown) || null, card: document.querySelector('#omni_card .omni-st').textContent }; });
  await p.evaluate(async () => { const l = S.plist.get('aladin_U215983415'); if (l) { window.ledNow0 = window.ledNow; } S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(400);
  ok(off.cfg && off.cfg.on === 0 && off.cfg.by && off.card === '끔' && (await cmds()).length === 1, '끄기 = 설정 저장(모든 기기 · 누가·언제) · 끈 동안 맡기지 않음', off);
  /* 다시 켜면 켠 시각부터 — 앞서 온 주문은 안 맡김 */
  const on2 = await p.evaluate(async () => { window.__sold = [['yes24', 'aladin_U215983410'], ['aladin', 'aladin_U215983414'], ['yes24', 'aladin_U215983411']]; const l = S.plist.get('aladin_U215983411'); l.status = '판매중'; l.active = true;
    const n0 = window.ledNow; window.ledNow = () => { const v = n0(); return v; }; const cb = document.querySelector('#omni_on'); cb.checked = true; await cb.onchange(); S.omni.at = 0; await omniTick(); return omniCfg(); });
  await p.waitForTimeout(400); ok(on2.on === 1 && Date.parse(on2.from) > Date.now() - 60e3 && (await cmds()).length === 1, '다시 켜면 그 시각 뒤 주문부터(밀린 줄은 사람이 🛠에서)', on2);
  /* 로거 PC는 안 돎 */
  const LG = await p.evaluate(() => { const d0 = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'LOGGER'); const w = omniWhy(); if (d0 == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', d0); return w; });
  ok(/로거/.test(LG), '로거 PC에서는 자동 내림이 돌지 않음(약속 0)', LG);
  /* 🔍 재고 맞추기 카드 — 실물 없음 줄 맡기기 두 번 */
  const RC = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); S.omni.recon = { day: kst(new Date()), at: new Date().toISOString(), dev: 'TEST', sum: { aladin: { live: 9, qty: 9, phys: 9 }, yes24: { live: 2, qty: 2, phys: 1 } }, nBad: 1, bad: [{ kind: 'gone', ch: 'yes24', no: '555', self: 'SK99', title: '나간 책', cur: 1, to: 0, why: '같은 SKU 알라딘 상품이 판매완료' }] }; ledRedraw(); await w(200);
    const sh = document.getElementById('sheet'); const b = sh.querySelector('[data-omnirc]'); const tab = (sh.querySelector('[data-ledview="todo"]') || {}).textContent || ''; const txt = sh.querySelector('#omni_rc').textContent; if (!b) return { b: false, txt }; b.click(); await w(500); const mid = window.__puts; return { b: true, txt, tab, arm: (sh.querySelector('[data-omnirc]') || {}).textContent || '' }; });
  const nRc0 = C2.puts.length; await p.locator('[data-omnirc]').click(); await p.waitForTimeout(800); const pr = C2.puts[C2.puts.length - 1]; const rr = pr && pr.rows[0];
  ok(RC.b && /실물 없음/.test(RC.txt) && /어긋남\s*1/.test(RC.txt) && /🔍1/.test(RC.tab) && /한 번 더/.test(RC.arm), '🔍 재고 맞추기 카드 — 판매처 합계·어긋남 · 처리할 일 칸에 🔍 수 · 한 번 = 무장', RC);
  ok(C2.puts.length === nRc0 + 1 && rr && rr.no === '555' && rr.self === 'SK99' && rr.kind === 'stop', '두 번 = 번외에 예스24 555 판매중지 1건', pr);
  const RN = await p.evaluate(async () => { S.y24LinkAll0 = window.y24LinkAll; const l = S.plist.get('aladin_U215983410'); S.sku.map.set(l.id, { c: ['ab12c'] }); const sk = (y24SkuSelf(l) || [])[0] || ''; window.y24LinkAll = () => [{ x: { goodsNo: 321 }, v: { self: sk, stock: 1, title: '예스24 줄' }, live: true }]; l.status = '판매완료'; l.active = false; const r = await omniReconRun(true); window.y24LinkAll = S.y24LinkAll0; const d = await db.collection('app_settings').doc('omni_auto').get(); return { r, sk, saved: !!((d.data() || {}).recon) }; });
  ok(RN.sk && RN.r && RN.r.bad.some((b) => b.kind === 'gone' && b.no === '321') && RN.saved && RN.r.force === 1, '↻ 지금 다시 맞추기 = 상품 기록·예스24 목록으로 다시 견줌 · 결과는 모든 기기 같은 자리(omni_auto.recon)', RN);
  /* 📋 주문 모음 */
  const OV = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); S.orders.set('o_t1', { id: 'o_t1', kind: 'sale', orderNo: 'AL0001', orderedAt: now, items: [{ title: '테스트 책 1', price: 5000, qty: 1 }] }); S.orders.set('o_t2', { id: 'o_t2', kind: 'sale', orderNo: 'AL0002', orderedAt: now, invoice: '1234', items: [{ title: '테스트 책 2', price: 6000, qty: 1 }] });
    S.y24o.m.set('Y0001', { orderNo: 'Y0001', orderedAt: now, ystage: 'new', items: [{ title: '예스24 책', price: 7000, qty: 1, self: 'SK14' }] }); S._ledO = null; S.y24o.ver = (S.y24o.ver || 0) + 1;
    document.querySelector('#sheet [data-ledview="ord"]').click(); await w(500); const sh = document.getElementById('sheet'); const rows = [...sh.querySelectorAll('.bt-tb tr')].slice(1).map((tr) => tr.textContent);
    const f = [...sh.querySelectorAll('[data-btf^="och|"]')].map((b) => b.textContent.trim()); const st = [...sh.querySelectorAll('[data-btf^="ost|"]')].map((b) => b.textContent.trim()); return { rows, f, st, on: (sh.querySelector('[data-ledview].on') || {}).dataset.ledview, ship: !!sh.querySelector('[data-ledship]') }; });
  ok(OV.on === 'ord' && OV.rows.length === 3 && OV.rows.some((t) => /예스24/.test(t) && /진행 중/.test(t)) && OV.rows.some((t) => /AL0002|0002/.test(t) && /출고·송장/.test(t)), '📋 주문 모음 — 알라딘·예스24 주문 한 목록 · 상태(진행 중·출고·송장)', OV);
  ok(OV.f.some((t) => /예스24\s*1/.test(t)) && OV.f.some((t) => /알라딘\s*2/.test(t)) && OV.st.some((t) => /진행 중\s*2/.test(t)) && OV.ship, '판매처 칩·상태 거르기 · 진행 중 주문은 출고 › 바로 가기', { f: OV.f, st: OV.st });
  ok(!dlg.length, '브라우저 창(alert/confirm/prompt) 0', dlg);
  console.log(bad ? `❌ tOMNI1111 ${bad}개 실패` : '✓ tOMNI1111 통과');
});
