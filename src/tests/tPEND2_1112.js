// tPEND2_1112 — (11/12 정범님 · 일꾼 pend2) 맡긴 일의 규칙 2단계 — 남은 맡김도 같은 규칙(공용 줄 · ↩ 맡김 취소 두 번만 · 보내기 직전 다시 셈 · 오래 못 보내면 ⏸ 만료(사람 확인))
//   ① 🟩 네이버: 로거 소식 없음 → 거절 대신 col2_naver_cmd st hold(만료 6시간) · 다른 기기에도 보임 · 중복 막음 · 쓰기 꺼짐(설정 까닭)은 예전처럼 거절
//      로거가 살아나면 다른 기기가 다시 셈 → new(job.sendAt) · 10분 넘게 안 받으면 hold로 되돌림 · 할 일이 없어지면 '할 일 없음' · ↻ 다시 맡기기 · ↩ 맡김 취소(두 번)
//   만료는 종류별(리드 결정 · 정범님 지적): 재고·판매중지·🤖 자동 내림 = 만료 없음(⏳ n시간 늦음만) · 💲 가격 2시간 · 📥 등록 24시간 · 그 밖 6시간 → 사람 확인 · ⚙에서 시한 고침
//   ② 🟦 예스24: 🔍 재고 맞추기 판매중지 = 공용 줄(src recon · 그날 맞추기에서 빠지면 할 일 없음) · 💲 판매가 다시 셈·2시간 시한 · 맡은 PC 거울(st local)
//   ③ 🟥 알라딘 상품 수정: 시한(가격 2시간 · 그 밖 6시간)을 넘게 아무도 안 받은 사람 맡김 = ⏸ 만료(⚡ 전략 자동 일은 그대로) · ↩ 맡김 취소(받기 전만)
// 실행: pw/ 안(harness.js·seed.js·fbstub.js 옆) RN_PORT=<포트> node tPEND2_1112.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const LEDNOW = (stock) => { window.__y24stock = stock; window.ledNow = () => { const al = [{ id: 'aladin_U215983410', n: 3 }, { id: 'aladin_U215983414', n: 1 }, { id: 'aladin_U215983412', n: 1 }].map(({ id, n }) => { const l = S.plist.get(id); return { id, title: l.title, isbn: l.isbn13, grade: l.grade, price: l.price, qty: n, live: aladinLive(l), st: l.status, skus: n > 1 ? ['SK10', 'SK10b', 'SK10c'] : ['SK' + id.slice(-2)] }; });
    const ord = [{ ch: 'cash', no: 'c1', at: '2026-11-11T01:00:00.000Z', amt: 5000, lines: [{ lid: 'aladin_U215983410', qty: 2, amt: 5000 }] }];
    const l4 = S.plist.get('aladin_U215983410'); const y24 = [{ no: '195968650', title: '예스24 줄', isbn: l4.isbn13, price: 6000, stock: window.__y24stock, live: true, self: '', alIds: ['aladin_U215983410'], flags: [] }];
    return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); }; };
/* 네이버 할 일 하나(원상품 669 판매중지) — 처리할 일 목록을 이것으로 */
/* 알라딘에서 팔린 실물(S1) → 네이버 원상품 669 판매중지 할 일 · __nvOn false = 그 주문이 없어짐(할 일 없음) */
const NVSET = () => { window.__nvOn = true; window.ledNow = () => ledBuild({ al: [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }], y24: [], other: [ledNvLst({ originNo: '669', no: '779', sku: 'S1', live: true, qty: 1, price: 9000, st: 'SALE' })], ord: window.__nvOn === false ? [] : [{ ch: 'aladin', no: 'o1', at: '2026-11-11T00:00:00Z', amt: 8000, lines: [{ lid: 'aladin_U1', qty: 1, amt: 8000 }] }], reg: [], days: 30, now: new Date().toISOString() });
  Object.defineProperty(window, '__nvT', { configurable: true, get: () => ledTodoNow().find((T) => T.key === 'S1' && T.acts.some((a) => a.ch === 'naver')) || null }); S.prodLoaded = true; S.nvoOk = 1; S.nvlOk = 1; };
const NVST = (fresh, write) => db.collection('col2_naver').doc('state').set({ pc: 'LOGGER', ver: '0.1.35', at: fresh ? new Date().toISOString() : '2026-01-01T00:00:00.000Z', nv: { test: { ok: true }, write: { on: write !== false } } });
const SP = __dirname; const stub = fs.readFileSync(path.join(SP, 'fbstub.js'), 'utf8');
async function openDev(browser, FS) { const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage(); const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); p.__dlg = dlg;
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' }));
  await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
  await p.addInitScript((fsj) => { try { if (localStorage.getItem('rn-msc-inapp') == null) localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} if (fsj) window.__FS = JSON.parse(fsj); }, FS || '');
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500); await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); return p; }
const nvc = (p) => p.evaluate(() => { const o = {}; for (const [k, v] of Object.entries((window.__FS || {}).col2_naver_cmd || {})) if (v.k === 'job') o[k] = v; return o; });
require('./harness.js')(async (pA) => { const browser = pA.context().browser(); const dlgA = []; pA.on('dialog', (d) => { dlgA.push(d.type()); d.dismiss().catch(() => {}); });
  await pA.evaluate(require('./seed.js')); await pA.waitForTimeout(500);
  console.log('① 🟩 네이버 — 로거 소식 없음이면 맡긴 일 줄(공용)');
  const N1 = await pA.evaluate(async (a) => { eval(a.NVSET)(); await eval(a.NVST)(false, false); await new Promise((r) => setTimeout(r, 200)); const T = window.__nvT; const A0 = T.acts.find((x) => x.ch === 'naver'); const off = await ledNvGo([{ T, a: A0 }]); /* 쓰기 꺼짐(설정 까닭) */
    await eval(a.NVST)(false, true); await new Promise((r) => setTimeout(r, 200)); const why = nvWriteWhy(); const w = await ledNvGo([{ T, a: A0 }]); const cell = ledTodoCell(T); const dup = await ledNvGo([{ T, a: A0 }]); return { off, why, w, cell: cell.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), btn: /data-nvpx=/.test(cell), dup }; }, { NVSET: NVSET.toString(), NVST: NVST.toString() });
  const C1 = await nvc(pA); const d1 = Object.values(C1)[0] || {};
  ok(/꺼져/.test(N1.off) && /소식/.test(N1.why), '쓰기 꺼짐(설정 까닭)은 예전처럼 거절 · 로거 소식 없음은 기다릴 까닭', N1);
  ok(/^대기/.test(N1.w) && Object.keys(C1).length === 1 && d1.st === 'hold' && d1.led && d1.led.rid === 'S1|nv|669' && d1.job.to === 'SUSPENSION' && !d1.job.exp && !d1.job.sendAt, '거절 대신 col2_naver_cmd 한 문서 st hold(재고·판매중지 = 만료 없음 · 아직 안 보냄)', d1);
  ok(/맡긴 일 줄에 들어감/.test(N1.cell) && N1.btn && /이미 맡김\(맡긴 일 줄/.test(N1.dup || ''), '줄 = 📥 맡긴 일 줄에 들어감 + ↩ 맡김 취소 · 같은 할 일 두 번 안 맡김', N1);
  console.log('② 다른 기기 B — 로거가 살아나면 다시 셈 뒤 보냄 · 10분 넘게 안 받으면 되돌림');
  const pB = await openDev(browser, await pA.evaluate(() => JSON.stringify(window.__FS)));
  const B1 = await pB.evaluate(async (a) => { eval(a.NVSET)(); await nvPLoad(true); const c0 = ledTodoCell(window.__nvT).replace(/<[^>]+>/g, ' '); await eval(a.NVST)(true, true); await new Promise((r) => setTimeout(r, 200)); S._nvpBusy = 0; await nvPTick(); const v = Object.values(window.__FS.col2_naver_cmd).find((x) => x.k === 'job');
    S._nvpBusy = 0; await nvPTick(); const n = Object.values(window.__FS.col2_naver_cmd).filter((x) => x.k === 'job' && x.st === 'new').length; return { c0: /맡긴 일 줄에 들어감/.test(c0), st: v.st, sendAt: v.job.sendAt, exp: v.job.exp, n }; }, { NVSET: NVSET.toString(), NVST: NVST.toString() });
  ok(B1.c0 && B1.st === 'new' && B1.sendAt && Date.now() - Date.parse(B1.sendAt) < 60e3 && !B1.exp && B1.n === 1, '기기 B에도 같은 줄 · 로거가 살아나니 할 일을 다시 세고 같은 문서를 hold → new(job.sendAt 새로) · 한 번 더 돌아도 두 번 안 보냄', B1);
  const B2 = await pB.evaluate(async () => { const [id] = Object.entries(window.__FS.col2_naver_cmd).find(([, x]) => x.k === 'job'); await db.collection('col2_naver_cmd').doc(id).set({ job: { ...window.__FS.col2_naver_cmd[id].job, sendAt: new Date(Date.now() - 11 * 60e3).toISOString() } }, { merge: true }); await db.collection('col2_naver').doc('state').set({ at: '2026-01-01T00:00:00.000Z' }, { merge: true });
    S._nvpBusy = 0; await nvPTick(); const v = window.__FS.col2_naver_cmd[id]; return { st: v.st, why: v.holdWhy }; });
  ok(B2.st === 'hold' && /10분/.test(B2.why || ''), '보냈는데 로거가 10분 넘게 안 받음 → 다시 hold(다시 셈 뒤에만 다시 보냄)', B2);
  console.log('③ 다시 셈 — 할 일이 없어지면 아무것도 안 보내고 닫음');
  const B3 = await pB.evaluate(async () => { window.__nvOn = false; await db.collection('col2_naver').doc('state').set({ at: new Date().toISOString() }, { merge: true }); await new Promise((r) => setTimeout(r, 200)); S._nvpBusy = 0; await nvPTick(); const v = Object.values(window.__FS.col2_naver_cmd).find((x) => x.k === 'job'); return { st: v.st, res: v.res, n: Object.values(window.__FS.col2_naver_cmd).filter((x) => x.st === 'new').length }; });
  ok(B3.st === 'done' && B3.res && B3.res.state === 'already' && B3.n === 0, '할 일 없음 → st done(already) · 로거에 보내지 않음(new 0)', B3);
  console.log('④ 종류별 만료 — 재고·판매중지는 없음(늦음만) · 가격 시한 지나면 만료 · 홈 알림 · ↻ 다시 맡기기 · ↩ 맡김 취소(두 번)');
  const B4 = await pB.evaluate(async () => { window.__nvOn = true; await db.collection('col2_naver').doc('state').set({ at: '2026-01-01T00:00:00.000Z' }, { merge: true }); await new Promise((r) => setTimeout(r, 200)); const T = window.__nvT; const w = await ledNvGo([{ T, a: T.acts.find((x) => x.ch === 'naver') }]);
    const [id] = Object.entries(window.__FS.col2_naver_cmd).find(([, x]) => x.k === 'job' && x.st === 'hold'); await db.collection('col2_naver_cmd').doc(id).set({ holdAt: new Date(Date.now() - 7 * 3600e3).toISOString() }, { merge: true }); S._nvpBusy = 0; await nvPTick(); const st7 = window.__FS.col2_naver_cmd[id].st; await nvPLoad(true); const c7 = ledTodoCell(window.__nvT).replace(/<[^>]+>/g, ' ');
    await db.collection('col2_naver_cmd').doc('cpx1').set({ k: 'job', job: { id: 'nvpx:669:9000', k: 'price', originNo: '669', price: 9000, exp: new Date(Date.now() - 60e3).toISOString() }, st: 'new', by: 'HOME', at: new Date(Date.now() - 3 * 3600e3).toISOString() }); S._nvpBusy = 0; await nvPTick(); const px = window.__FS.col2_naver_cmd.cpx1;
    await db.collection('col2_naver_cmd').doc(id).set({ st: 'expired', expMsg: '시험 — 만료된 줄(예전 판)' }, { merge: true }); await nvPLoad(true);
    const A = []; nvPAlerts((lv, t) => A.push(lv + ':' + t)); const cell = ledTodoCell(window.__nvT); document.body.insertAdjacentHTML('beforeend', `<div id="tcell" style="position:fixed;top:0;left:0;z-index:99999;background:#fff">${cell}</div>`); return { w, id, st7, c7: /7시간 늦음/.test(c7) && /만료 없음/.test(c7), px: px.st, pxm: px.expMsg, st: window.__FS.col2_naver_cmd[id].st, A, cell: cell.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') }; });
  ok(B4.st7 === 'hold' && B4.c7, '재고·판매중지(다시 셀 수 있는 일) — 7시간이 지나도 만료 없음 · 줄에 ⏳ 7시간 늦음', B4);
  ok(B4.px === 'expired' && /가격/.test(B4.pxm || ''), '💲 가격 맡김(다시 셀 수 없는 일) — 시한(2시간)이 지나도록 로거가 안 받으면 st expired(사람 확인 · 로거는 new만 받음)', B4);
  ok(/^대기/.test(B4.w) && B4.st === 'expired' && B4.A.length === 1 && /^red:.*만료.*사람 확인/.test(B4.A[0]) && /만료 — 사람 확인 필요/.test(B4.cell) && /↻ 다시 맡기기/.test(B4.cell) && /↩ 맡김 취소/.test(B4.cell), '만료된 줄 → 홈 빨강 알림 한 줄 · 줄에 ↻ 다시 맡기기·↩ 맡김 취소', B4);
  await pB.locator('#tcell [data-nvpre]').click(); await pB.waitForTimeout(450); const s4a = (await nvc(pB))[B4.id].st; await pB.locator('#tcell [data-nvpre]').click(); await pB.waitForTimeout(900);
  const B5 = await pB.evaluate((id) => { const v = window.__FS.col2_naver_cmd[id]; return { st: v.st, fresh: Date.now() - Date.parse(v.holdAt) < 60e3, exp: v.job.exp || null }; }, B4.id);
  ok(s4a === 'expired' && B5.st === 'hold' && B5.fresh && !B5.exp, '↻ 다시 맡기기 — 한 번 = 무장 · 두 번 = 다시 hold(시계 새로 · 재고 일이라 만료 없음)', { s4a, B5 });
  await pB.evaluate(() => { const c = document.getElementById('tcell'); c.innerHTML = ledTodoCell(window.__nvT); });
  await pB.locator('#tcell [data-nvpx]').click(); await pB.waitForTimeout(450); const s5a = (await nvc(pB))[B4.id].st; await pB.locator('#tcell [data-nvpx]').click(); await pB.waitForTimeout(900);
  const B6 = await pB.evaluate((id) => { const v = window.__FS.col2_naver_cmd[id]; document.getElementById('tcell').remove(); return { st: v.st, res: v.res && v.res.state, late: null }; }, B4.id);
  ok(s5a === 'hold' && B6.st === 'cancelled' && B6.res === 'cancelled', '↩ 맡김 취소 — 한 번 = 무장 · 두 번 = st cancelled(문서는 남음)', { s5a, B6 });
  const B7 = await pB.evaluate(async () => { const T = window.__nvT; const w = await ledNvGo([{ T, a: T.acts.find((x) => x.ch === 'naver') }], { auto: 1 }); const v = Object.values(window.__FS.col2_naver_cmd).find((x) => x.k === 'job' && x.st === 'hold'); const id = Object.keys(window.__FS.col2_naver_cmd).find((k) => window.__FS.col2_naver_cmd[k] === v);
    await db.collection('col2_naver_cmd').doc(id).set({ st: 'took', tookBy: 'LOGGER' }, { merge: true }); const late = await nvPCancel(id); return { w, src: v.led.src, exp: v.job.exp || null, late }; });
  ok(/^대기/.test(B7.w) && B7.src === 'auto' && !B7.exp && B7.late === 'late', '🤖 자동 내림이 맡긴 것도 다시 셀 수 있는 일 = 만료 없음 · 로거가 받은 뒤(took)엔 취소 안 됨', B7);
  console.log('⑤ 🟦 예스24 — 재고 맞추기 판매중지·자동 내림도 공용 줄 · 판매가 다시 셈 · 맡은 PC 거울');
  await pB.evaluate(() => { delete window.__nvT; }); await pB.evaluate(LEDNOW, 2);
  const Y1 = await pB.evaluate(async () => { delete window.__FS.col2_y24_cmd; S.y24p.L = []; localStorage.removeItem('rn-led-y24w'); await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: '2026-01-01T00:00:00.000Z', hlp: true, login: 'ok', on: true } }); S.y24h.at = 0;
    const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; const R0 = ledY24Row(it.T, it.a);
    S.omni = S.omni || {}; S.omni.recon = { day: kst(new Date()), at: new Date().toISOString(), bad: [{ kind: 'gone', ch: 'yes24', no: R0.no, self: R0.self, title: '나간 책', cur: 1, to: 0, why: '시험' }] };
    const w = await ledY24Go([{ T: { key: it.T.key, title: '나간 책', last: S.omni.recon.at }, a: { ch: 'yes24', k: 'down', to: 0, no: R0.no, self: R0.self, cands: it.a.cands, isbn: it.a.isbn } }], { hold: 1, src: 'recon' });
    const D = Object.values(window.__FS.col2_y24_cmd || {}); const d = D[0] || {}; const src = ((d.job || {}).rows || [])[0] && d.job.rows[0].src;
    S.omni.recon.bad = []; await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: new Date().toISOString(), hlp: true, login: 'ok', on: true } }); S._y24hAt = 0; await ledY24HoldRetry(); const v = Object.values(window.__FS.col2_y24_cmd)[0]; return { w, n: D.length, st0: d.st, src, st: v.st, res: v.res && v.res.state, nNew: Object.values(window.__FS.col2_y24_cmd).filter((x) => x.st === 'new').length }; });
  ok(/^대기/.test(Y1.w) && Y1.n === 1 && Y1.st0 === 'hold' && Y1.src === 'recon', '🔍 재고 맞추기 판매중지 — 못 보내면 거절 대신 공용 줄(st hold · 출처 recon)', Y1);
  ok(Y1.st === 'done' && Y1.res === 'already' && Y1.nNew === 0, '그날 재고 맞추기에서 그 줄이 빠지면 → 할 일 없음으로 닫음(보내지 않음)', Y1);
  const Y2 = await pB.evaluate(async () => { S.y24p.L = []; localStorage.removeItem('rn-led-y24w'); await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: '2026-01-01T00:00:00.000Z', hlp: true, login: 'ok', on: true } }); S.y24h.at = 0;
    const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; const w = await ledY24Go([it], { hold: 1, src: 'auto' }); const [id, d] = Object.entries(window.__FS.col2_y24_cmd).find(([, x]) => x.st === 'hold');
    await db.collection('col2_y24_cmd').doc(id).set({ holdAt: new Date(Date.now() - 9 * 3600e3).toISOString() }, { merge: true }); S._y24hAt = 0; await ledY24HoldRetry(); const stA = window.__FS.col2_y24_cmd[id].st;
    const pid = 'y24p-t1'; await db.collection('col2_y24_cmd').doc(pid).set({ k: 'w', st: 'hold', job: { id: pid, rows: [{ rid: 'y24p|195968650', no: '195968650', self: 'SK10', to: 7000, src: 'price', kind: 'price' }] }, holdAt: new Date(Date.now() - 3 * 3600e3).toISOString(), at: new Date(Date.now() - 3 * 3600e3).toISOString(), holdWhy: '시험' });
    const e0 = y24PExpMs(window.__FS.col2_y24_cmd[pid]); S.app.platforms = { ...(S.app.platforms || {}), pendExp: { price: 4 } }; const e4 = y24PExpMs(window.__FS.col2_y24_cmd[pid]); S._y24hAt = 0; await ledY24HoldRetry(); const stP4 = window.__FS.col2_y24_cmd[pid].st;
    S.app.platforms.pendExp = {}; S._y24hAt = 0; await ledY24HoldRetry(); return { w, src: d.job.rows[0].src, stA, e0, e4, stP4, stP: window.__FS.col2_y24_cmd[pid].st, msg: window.__FS.col2_y24_cmd[pid].expMsg }; });
  ok(/^대기/.test(Y2.w) && Y2.src === 'auto' && Y2.stA === 'hold', '🤖 자동 내림 예스24 쪽 — 공용 줄 · 9시간이 지나도 만료 없음(다시 셀 수 있는 일)', Y2);
  ok(Y2.e0 === 2 * 3600e3 && Y2.e4 === 4 * 3600e3 && Y2.stP4 === 'hold' && Y2.stP === 'expired' && /2시간/.test(Y2.msg || ''), '💲 판매가 줄 = 가격 시한 2시간(⚙에서 4시간으로 바꾸면 3시간째엔 그대로) → 2시간이면 만료(사람 확인)', Y2);
  const Y3 = await pB.evaluate(async () => { const a0 = S.y24.adm; S.y24.adm = { m: new Map([['195968650', { price: 6000 }]]), t: Date.now() }; S.y24.loaded = true; const a = y24PFind({ src: 'price', no: '195968650', to: 6000, rid: 'y24p|195968650' }); const b = y24PFind({ src: 'price', no: '195968650', to: 7000, rid: 'y24p|195968650' }); S.y24.adm = a0; return { a, b: !!(b && b.price) }; });
  ok(Y3.a === null && Y3.b, '💲 판매가 맡긴 일 줄 — 보내기 직전 지금 값이 이미 그 값이면 할 일 없음 · 아니면 보냄', Y3);
  const Y4 = await pB.evaluate(async () => { const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; const R0 = ledY24Row(it.T, it.a); for (const [k, v] of Object.entries(window.__FS.col2_y24_cmd)) if (v.st === 'expired' || v.st === 'hold') await db.collection('col2_y24_cmd').doc(k).set({ st: 'cancelled' }, { merge: true });
    await y24PLoad(true); const jid = 'y24w-mirror1'; const row = { rid: R0.rid, rk: R0.rk, no: R0.no, self: R0.self, kind: R0.kind, to: R0.to, title: R0.title }; await y24PMirror(jid, [row]); const d = window.__FS.col2_y24_cmd[jid]; S._y24pRidM = null; const P = y24PRid()[R0.rid]; const h = P ? ledY24PendHtml(R0.rid, P).replace(/<[^>]+>/g, ' ') : '';
    const dup = await ledY24Go([it], { hold: 1 }); await y24PMirrorFin({ [jid]: { [R0.rid]: { st: 'done', msg: '시험' } } }); S._y24pRidM = null; return { st0: d.st, h, dup, st1: window.__FS.col2_y24_cmd[jid].st, gone: !y24PRid()[R0.rid] }; });
  ok(Y4.st0 === 'local' && /직접 고치는 중/.test(Y4.h) && !/맡김 취소/.test(Y4.h) && /이미 맡김/.test(Y4.dup || ''), '맡은 PC가 제 번외에 바로 맡김 → 공용 거울(st local · 수집기는 안 받음) · 다른 기기에 진행 보임 · 같은 일 다시 맡기기 막음 · 취소 단추 없음', Y4);
  ok(Y4.st1 === 'done' && Y4.gone, '번외 결과를 받으면 거울도 done · 줄에서 빠짐', Y4);
  console.log('⑥ 🟥 알라딘 상품 수정 — 6시간 아무도 안 받으면 만료(사람 맡김만) · ↩ 맡김 취소');
  const L1 = await pB.evaluate(async () => { const old = new Date(Date.now() - 7 * 3600e3).toISOString(); const mk = (id, by, extra) => db.collection('shp_cmds').doc(id).set({ type: 'prdEdit', status: 'queued', claim: null, listingKey: 'aladin_U215983410', ch: { state: '판매중지' }, f: { state: { st: 'queued', at: old } }, createdAt: old, by, ...(extra || {}) });
    await mk('pe1', 'a@test.kr'); await mk('pe2', 'strategy'); await mk('pe3', 'a@test.kr', { createdAt: new Date().toISOString() }); await mk('pe5', 'a@test.kr', { ch: { price: 9000 }, f: { price: { st: 'queued' } }, createdAt: new Date(Date.now() - 3 * 3600e3).toISOString() }); await mk('pe6', 'a@test.kr', { createdAt: new Date(Date.now() - 3 * 3600e3).toISOString() }); await mk('pe4', 'a@test.kr', { createdAt: new Date().toISOString(), claim: 'cloud' });
    S.cmdAll = new Map([...(S.cmdAll || new Map())]); for (const id of ['pe1', 'pe2', 'pe3', 'pe4', 'pe5', 'pe6']) S.cmdAll.set(id, { id, ...window.__FS.shp_cmds[id] }); S._peExpAt = 0; await peExpSweep();
    const st = Object.fromEntries(['pe1', 'pe2', 'pe3', 'pe5', 'pe6'].map((k) => [k, window.__FS.shp_cmds[k].status])); const x3 = await peCancelQueued('pe3'); const x4 = await peCancelQueued('pe4'); return { st, msg: window.__FS.shp_cmds.pe1.msg, f1: window.__FS.shp_cmds.pe1.f.state.st, x3, s3: window.__FS.shp_cmds.pe3.status, x4, s4: window.__FS.shp_cmds.pe4.status }; });
  ok(L1.st.pe1 === 'expired' && /만료/.test(L1.msg || '') && L1.f1 === 'fail' && L1.st.pe2 === 'queued' && L1.st.pe3 === 'queued' && L1.st.pe5 === 'expired' && L1.st.pe6 === 'queued', '판매상태 수정 7시간(그 밖 6시간 시한) · 가격 수정 3시간(가격 2시간 시한) = status expired(클라우드·PC는 queued만 받음) · 판매상태 3시간·⚡ 전략 일·새 맡김은 그대로', L1);
  ok(L1.x3 === true && L1.s3 === 'cancelled' && L1.x4 === false && L1.s4 === 'queued', '↩ 맡김 취소 — 받기 전이면 cancelled · 클라우드가 붙잡은 뒤면 취소 안 됨', L1);
  ok(!dlgA.length && !pB.__dlg.length, '브라우저 창(alert/confirm/prompt) 없음', [dlgA, pB.__dlg]);
  await pB.context().close();
  console.log(bad ? `❌ tPEND2_1112 ${bad}개 실패` : '✓ tPEND2_1112 모두 통과');
}, { vp: { width: 1400, height: 900 } });
