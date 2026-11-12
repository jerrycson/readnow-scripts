// tPEND1112 — (11/12 정범님 · 일꾼 pend1) 맡긴 일의 규칙 — 🟦 예스24 맡긴 일 줄이 기기 브라우저가 아니라 Firestore 공용 줄(col2_y24_cmd st hold)에
//   ① 창 닫기 시뮬레이션: 맡긴 뒤 페이지를 닫고 다른 기기(새 브라우저 · 빈 localStorage)로 열어도 줄이 남고 보임
//   ② 다른 기기가 보냄: 맡은 PC가 살아나면 다른 기기 웹앱이 할 일을 다시 세고 st new로(트랜잭션 · 같은 줄 두 번 안 보냄 · 중복 맡기기 막음)
//   ③ 취소는 '↩ 맡김 취소' 두 번만(한 번 = 무장 · 받은 뒤(took)엔 취소 안 됨)
//   ④ 처리 직전에 다시 셈: 이미 맞으면 '할 일 없음'으로 닫음(new 안 만듦) ⑤ 6시간 지나면 '만료(사람 확인)' · 홈 알림 · ↻ 다시 맡기기
// 실행: pw/ 안(harness.js·seed.js·fbstub.js 옆) RN_PORT=<포트> node tPEND1112.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const LEDNOW = (stock) => { window.__y24stock = stock; window.ledNow = () => { const al = [{ id: 'aladin_U215983410', n: 3 }, { id: 'aladin_U215983414', n: 1 }, { id: 'aladin_U215983412', n: 1 }].map(({ id, n }) => { const l = S.plist.get(id); return { id, title: l.title, isbn: l.isbn13, grade: l.grade, price: l.price, qty: n, live: aladinLive(l), st: l.status, skus: n > 1 ? ['SK10', 'SK10b', 'SK10c'] : ['SK' + id.slice(-2)] }; });
    const ord = [{ ch: 'cash', no: 'c1', at: '2026-11-11T01:00:00.000Z', amt: 5000, lines: [{ lid: 'aladin_U215983410', qty: 2, amt: 5000 }] }];
    const l4 = S.plist.get('aladin_U215983410'); const y24 = [{ no: '195968650', title: '예스24 줄', isbn: l4.isbn13, price: 6000, stock: window.__y24stock, live: true, self: '', alIds: ['aladin_U215983410'], flags: [] }];
    return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); }; };
const SP = __dirname; const stub = fs.readFileSync(path.join(SP, 'fbstub.js'), 'utf8');
async function openDev(browser, FS) { const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage(); const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); p.__dlg = dlg;
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' }));
  await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
  await p.addInitScript((fsj) => { try { if (localStorage.getItem('rn-msc-inapp') == null) localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} if (fsj) window.__FS = JSON.parse(fsj); }, FS || '');
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500); await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); return p; }
const rowTxt = (p) => p.evaluate(() => [...document.querySelectorAll('#sheet .bt-tb .ledtd')].map((x) => x.textContent.replace(/\s+/g, ' ')).join('|'));
const cmds = (p) => p.evaluate(() => { const o = {}; for (const [k, v] of Object.entries((window.__FS || {}).col2_y24_cmd || {})) o[k] = v; return o; });
require('./harness.js')(async (pA) => { const browser = pA.context().browser(); const dlgA = []; pA.on('dialog', (d) => { dlgA.push(d.type()); d.dismiss().catch(() => {}); });
  await pA.evaluate(require('./seed.js')); await pA.waitForTimeout(500); await pA.evaluate(LEDNOW, 2);
  console.log('① 기기 A — 맡은 PC 소식 없음 → 맡긴 일 줄(공용)');
  await pA.evaluate(() => { S._ledView = 'all'; openLedger(); }); await pA.waitForTimeout(600);
  await pA.locator('#sheet [data-ledy24go]').first().click(); await pA.waitForTimeout(450); await pA.locator('#sheet [data-ledy24go]').first().click(); await pA.waitForTimeout(900);
  const C1 = await cmds(pA); const k1 = Object.keys(C1); const d1 = C1[k1[0]] || {};
  ok(k1.length === 1 && d1.st === 'hold' && d1.k === 'w' && d1.job.rows[0].no === '195968650' && d1.job.rows[0].to === 1 && /HOME/.test(d1.holdWhy || ''), '맡김 = Firestore col2_y24_cmd 한 문서 st hold(195968650 수량 1 · 까닭 HOME 소식 없음)', d1);
  ok(/맡긴 일 줄에 들어감/.test(await rowTxt(pA)) && /↩ 맡김 취소/.test(await rowTxt(pA)), '기기 A 줄: 📥 맡긴 일 줄에 들어감 + ↩ 맡김 취소 단추', await rowTxt(pA));
  console.log('② 창 닫기 — 기기 A를 닫고 기기 B(빈 브라우저)로 엶');
  const FS1 = await pA.evaluate(() => JSON.stringify(window.__FS)); await pA.evaluate(() => { localStorage.clear(); }); /* A 브라우저 기록도 지움 = 닫힘 */
  const pB = await openDev(browser, FS1); await pB.evaluate(LEDNOW, 2);
  const B0 = await pB.evaluate(() => localStorage.getItem('rn-led-y24w')); await pB.evaluate(async () => { await y24PLoad(true); S._ledView = 'all'; openLedger(); }); await pB.waitForTimeout(600);
  const tB = await rowTxt(pB); ok(B0 == null && /맡긴 일 줄에 들어감/.test(tB) && /↩ 맡김 취소/.test(tB) && !(await pB.$('#sheet [data-ledy24go]')), '기기 B(이 기기 기록 없음)에도 같은 줄이 맡긴 일 줄로 보임 · 맡기기 단추 대신 취소 단추', { B0, tB });
  const dupB = await pB.evaluate(async () => { const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; return await ledY24Go([it], { hold: 1 }); });
  ok(/이미 맡김\(맡긴 일 줄/.test(dupB || '') && Object.keys(await cmds(pB)).length === 1, '기기 B가 같은 할 일을 또 맡기려 하면 막음(이미 맡김 — 맡긴 일 줄)', dupB);
  console.log('③ ↩ 맡김 취소 — 두 번만');
  await pB.evaluate(() => { S._ledView = 'todo'; S._led = null; openLedger(); }); await pB.waitForTimeout(500);
  const xb = pB.locator('#sheet [data-y24px]').first(); await xb.click(); await pB.waitForTimeout(250); const armT = await xb.textContent(); const s1 = (Object.values(await cmds(pB))[0] || {}).st;
  await pB.waitForTimeout(450); await pB.locator('#sheet [data-y24px]').first().click(); await pB.waitForTimeout(800); const d3 = Object.values(await cmds(pB))[0] || {};
  ok(/한 번 더/.test(armT || '') && s1 === 'hold', '한 번 누름 = 무장(아직 hold)', { armT, s1 });
  ok(d3.st === 'cancelled' && d3.res && d3.res.state === 'cancelled' && (d3.job.rows || []).length === 1, '두 번 = st cancelled(문서는 남음 · 지우지 않음)', d3);
  ok(!!(await pB.$('#sheet [data-ledy24go]')) && !/맡긴 일 줄에 들어감/.test(await rowTxt(pB)), '취소 뒤 그 줄에 다시 맡기기 단추', await rowTxt(pB));
  console.log('④ 다시 맡김 → 다른 기기가 보냄(다시 셈) · 받은 뒤엔 취소 안 됨');
  await pB.evaluate(async () => { const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; await ledY24Go([it], { hold: 1 }); });
  const FS2 = await pB.evaluate(() => JSON.stringify(window.__FS)); const pC = await openDev(browser, FS2); await pC.evaluate(LEDNOW, 2); /* 기기 C — 맡긴 기기가 아님 */
  const C4 = await pC.evaluate(async () => { await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: new Date().toISOString(), hlp: true, login: 'ok', on: true } }); S.y24h.at = 0; S._y24hAt = 0; await ledY24HoldRetry(); const o = []; for (const [k, v] of Object.entries(window.__FS.col2_y24_cmd)) o.push({ k, st: v.st, n: (v.job.rows || []).length, at: v.at, holdAt: v.holdAt, sentBy: v.sentBy }); return o; });
  const nw = C4.find((x) => x.st === 'new'); ok(C4.length === 2 && nw && nw.n === 1 && nw.at > nw.holdAt, '기기 C가 할 일을 다시 세고 같은 문서를 hold → new로(맡은 PC 수집기가 받음 · 보낸 시각 at 새로)', C4);
  const C5 = await pC.evaluate(async () => { S._y24hAt = 0; await ledY24HoldRetry(); return Object.values(window.__FS.col2_y24_cmd).filter((v) => v.st === 'new').length; }); ok(C5 === 1, '한 번 더 돌아도 두 번 보내지 않음', C5);
  const late = await pC.evaluate(async () => { const id = Object.entries(window.__FS.col2_y24_cmd).find(([, v]) => v.st === 'new')[0]; await db.collection('col2_y24_cmd').doc(id).set({ st: 'took', tookBy: 'HOME' }, { merge: true }); const rid = window.__FS.col2_y24_cmd[id].job.rows[0].rid; return await y24PCancel(id, rid); });
  ok(late === 'late', '맡은 PC가 받은 뒤(took)엔 취소 안 됨(late)', late);
  console.log('⑤ 처리 직전 다시 셈 — 이미 맞으면 할 일 없음으로 닫음');
  const C6 = await pC.evaluate(async () => { for (const [k, v] of Object.entries(window.__FS.col2_y24_cmd)) if (v.st === 'took') await db.collection('col2_y24_cmd').doc(k).set({ st: 'done', res: { state: 'done', msg: '시험' } }, { merge: true });
    localStorage.removeItem('rn-led-y24w'); S.y24p.L = []; const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: '2026-01-01T00:00:00.000Z', hlp: true, login: 'ok', on: true } }); S.y24h.at = 0;
    const w = await ledY24Go([it], { hold: 1 }); const id = Object.entries(window.__FS.col2_y24_cmd).find(([, v]) => v.st === 'hold')[0];
    window.__y24stock = 1; /* 그사이 사람이 예스24에서 손으로 1권으로 고침 */ await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: new Date().toISOString(), hlp: true, login: 'ok', on: true } }); S._y24hAt = 0; await ledY24HoldRetry(); const v = window.__FS.col2_y24_cmd[id]; return { w, st: v.st, res: v.res && v.res.state, n: Object.values(window.__FS.col2_y24_cmd).filter((x) => x.st === 'new').length }; });
  ok(/^대기/.test(C6.w) && C6.st === 'done' && C6.res === 'already' && C6.n === 0, '다시 세어 보니 할 일 없음 → st done(already) · 예스24에 보내지 않음(new 0)', C6);
  console.log('⑥ 6시간 만료 — 자동 취소 아님 · 사람 확인 · ↻ 다시 맡기기');
  const C7 = await pC.evaluate(async () => { window.__y24stock = 2; S.y24p.L = []; localStorage.removeItem('rn-led-y24w'); await db.collection('col2_ctl').doc('HOME').set({ y24hb: { at: '2026-01-01T00:00:00.000Z', hlp: true, login: 'ok', on: true } }); S.y24h.at = 0;
    const it = ledTodoNow().flatMap((T) => T.acts.filter((a) => a.ch === 'yes24').map((a) => ({ T, a })))[0]; await ledY24Go([it], { hold: 1 }); const id = Object.entries(window.__FS.col2_y24_cmd).find(([, v]) => v.st === 'hold')[0];
    await db.collection('col2_y24_cmd').doc(id).set({ holdAt: new Date(Date.now() - 7 * 3600e3).toISOString() }, { merge: true }); S._y24hAt = 0; await ledY24HoldRetry(); const A = []; y24PAlerts((lv, t) => A.push(lv + ':' + t));
    S._ledView = 'all'; S._led = null; openLedger(); await new Promise((r) => setTimeout(r, 400)); const td = [...document.querySelectorAll('#sheet .bt-tb .ledtd')].map((x) => x.textContent.replace(/\s+/g, ' ')).join('|'); return { id, st: window.__FS.col2_y24_cmd[id].st, A, td }; });
  ok(C7.st === 'expired' && C7.A.length === 1 && /^red:.*만료.*사람 확인/.test(C7.A[0]) && /만료 — 사람 확인 필요/.test(C7.td) && /↻ 다시 맡기기/.test(C7.td) && /↩ 맡김 취소/.test(C7.td), '6시간 넘음 → st expired(문서·줄 남음) · 홈 빨강 알림 · 줄에 ↻ 다시 맡기기·↩ 맡김 취소', C7);
  const rb = pC.locator('#sheet [data-y24pre]').first(); await rb.click(); await pC.waitForTimeout(450); await pC.locator('#sheet [data-y24pre]').first().click(); await pC.waitForTimeout(900);
  const C8 = await pC.evaluate((id) => { const v = window.__FS.col2_y24_cmd[id]; return { st: v.st, fresh: Date.now() - Date.parse(v.holdAt) < 60e3 }; }, C7.id); ok(C8.st === 'hold' && C8.fresh, '↻ 다시 맡기기(두 번) → 다시 hold · 시계 새로', C8);
  ok(!dlgA.length && !pB.__dlg.length && !pC.__dlg.length, '브라우저 창(alert/confirm/prompt) 없음', [dlgA, pB.__dlg, pC.__dlg]);
  await pB.context().close(); await pC.context().close();
  console.log(bad ? `❌ tPEND1112 ${bad}개 실패` : '✓ tPEND1112 모두 통과');
}, { vp: { width: 1400, height: 900 } });
