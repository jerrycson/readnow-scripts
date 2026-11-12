// tRECHECK1112 — (11/12 정범님 저녁 '재고 자동 처리가 끝난 뒤 다음 날·3일·7일·30일 다시 확인' · 일꾼 recheck1) 🔁 사후 확인
//   ① 순수 셈(◆recheck 덩어리만): 회차 읽기(rcDays) · 오늘 확인할 회차(rcDue) · 판정(rcJudge — ✅ 그대로 · ⚠ 어긋남 · ❓ 자료 없음 · 자료 안 읽음은 미룸) · 상태(rcRows) · 오래된 기록 빼기(rcPrune)
//   ② 화면(harness): 🤖 자동 내림이 알라딘 판매중지를 맡기면 일정 한 줄(src auto) · 1일 뒤 판매중지 그대로 → ✅ · 손으로 맡긴 줄이 다시 판매중(장부 규칙 없음) → ⚠ 사람 확인(1·3일 함께)
//      · 장부 🛠 처리할 일이 3시간째 남은 줄 → 같은 규칙·다시 셈을 거쳐 그 자리에서 다시 맡김(shp_cmds prdEdit · 새 일정 src rc) · 홈 알림 · 🧾 통합 장부 › 🔁 사후 확인 보기 · ✓ 확인함 · ⚙ 회차 저장·끄기
// 실행: pw/ 안(harness.js·seed.js·fbstub.js 옆) RN_PORT=<포트> node tRECHECK1112.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html'), process.env.RN_REPO ? path.join(process.env.RN_REPO, 'src', 'app.html') : ''].filter(Boolean).find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆recheck 시작', '/* ◆recheck 끝 */') + '\nreturn { RC_DEF, RC_GRACE_MS, rcDays, rcId, rcDue, rcNext, rcJudge, rcRows, rcPrune };')();
console.log('① 순수 셈');
{ ok(JSON.stringify(F.RC_DEF) === '[1,3,7,30]', '기본 회차 = 다음 날·3일·7일·30일');
  ok(JSON.stringify(F.rcDays('7, 1,3 30')) === '[1,3,7,30]' && JSON.stringify(F.rcDays('2, 5, 5, 0, -1, 1.5, 400, 가')) === '[2,5]' && F.rcDays('').length === 0 && JSON.stringify(F.rcDays([30, 1])) === '[1,30]', '회차 읽기 — 정렬·중복 빼기·1~365 정수만');
  const at = '2026-11-10T03:00:00.000Z'; const t0 = Date.parse(at); const e = { ch: 'aladin', id: 'aladin_U1', k: 'down', to: 0, at, r: {} };
  ok(F.rcDue(e, [1, 3, 7, 30], t0 + 0.5 * 864e5).length === 0 && JSON.stringify(F.rcDue(e, [1, 3, 7, 30], t0 + 1.01 * 864e5)) === '["1"]' && JSON.stringify(F.rcDue(e, [1, 3, 7, 30], t0 + 3.5 * 864e5)) === '["1","3"]', '오늘 확인할 회차 — 하루 전엔 없음 · 1일 · PC가 꺼져 있었으면 1·3일 함께');
  ok(JSON.stringify(F.rcDue({ ...e, r: { 1: { v: 'ok' } } }, [1, 3], t0 + 3.5 * 864e5)) === '["3"]' && F.rcNext({ ...e, r: { 1: { v: 'ok' } } }, [1, 3]).d === 3 && F.rcNext({ ...e, r: { 1: {}, 3: {} } }, [1, 3]) === null, '확인한 회차는 다시 안 함 · 다음 회차');
  ok(F.rcJudge(e, undefined, null) === null, '판매처 자료를 아직 안 읽음 → 판정 미룸');
  ok(F.rcJudge(e, null, null).v === 'none', '판매처 목록에 없음 → ❓ 자료 없음');
  ok(F.rcJudge(e, { live: false, qty: 1 }, null).v === 'ok', '판매중지 기대 · 판매중 아님 → ✅');
  const b1 = F.rcJudge(e, { live: true, qty: 1 }, null); ok(b1.v === 'bad' && !b1.re && /사람 확인/.test(b1.m), '판매중지 기대 · 다시 판매중 · 장부 규칙 없음 → ⚠ 사람 확인(다시 맡기지 않음)', b1);
  const b2 = F.rcJudge(e, { live: true, qty: 1 }, { todo: 1, age: 3 * 36e5 }); ok(b2.v === 'bad' && b2.re === 1, '다시 판매중 · 🛠 처리할 일 3시간째 → ⚠ 다시 맡길 수 있음', b2);
  const b3 = F.rcJudge(e, { live: true, qty: 1 }, { todo: 1, age: 10 * 60e3 }); ok(b3.v === 'bad' && !b3.re && /방금/.test(b3.m), '할 일이 방금 생김(1시간 안) → ⚠ 표시만(엔진이 맡김)', b3);
  const b4 = F.rcJudge(e, { live: true, qty: 1 }, { todo: 0, age: 2 * 864e5 }); ok(b4.v === 'bad' && !b4.re && /재고 맞추기/.test(b4.m), '🔍 재고 맞추기에 남음 → ⚠ (다시 맡기기는 그 카드에서 사람이)', b4);
  const q = { ...e, k: 'qty', to: 2 };
  ok(F.rcJudge(q, { live: true, qty: 2 }, null).v === 'ok' && F.rcJudge(q, { live: true, qty: 1 }, null).v === 'ok' && F.rcJudge(q, { live: false, qty: 0 }, null).v === 'ok' && F.rcJudge(q, { live: true, qty: 3 }, null).v === 'bad', '수량 2권 기대 — 2권·1권·판매중 아님 ✅ · 3권 ⚠');
  const s1 = F.rcJudge(q, { live: true, qty: 2 }, { todo: 1, age: 5 * 36e5 }); ok(s1.v === 'bad' && s1.re === 1 && /팔렸는데 반영 안 됨/.test(s1.m), '값은 맞아도 장부에 팔린 일이 5시간째 남음 → ⚠ 팔렸는데 반영 안 됨', s1);
  ok(F.rcJudge({ ...e, k: 'up', to: 1 }, { live: true, qty: 1 }, null).v === 'ok' && F.rcJudge({ ...e, k: 'up', to: 1 }, { live: false }, null).v === 'bad', '판매재개 기대 — 판매중 ✅ · 아니면 ⚠');
  ok(F.rcId(e) === F.rcId({ ...e, at: '2026-11-10T09:00:00Z' }) && F.rcId(e) !== F.rcId({ ...e, at: '2026-11-11T03:00:00Z' }) && /^\w+$/.test(F.rcId({ ...e, id: 'a.b/c#d' })), '열쇠 — 같은 날 같은 일은 한 줄 · 글자는 영문·숫자·_만');
  const now = t0 + 3.5 * 864e5; const M = { a: { ...e, r: { 1: { at: '2026-11-11T04:00:00Z', v: 'ok' } } }, b: { ...e, r: { 1: { at: '2026-11-11T04:00:00Z', v: 'bad' } } }, c: { ...e, r: { 1: { at: '2026-11-11T04:00:00Z', v: 'bad' } }, ack: '2026-11-11T05:00:00Z' }, d: { ...e, at: new Date(now - 3600e3).toISOString() }, x: { ...e, r: { 1: { v: 'ok' }, 3: { v: 'ok' } } } };
  const R = Object.fromEntries(F.rcRows(M, [1, 3], now).map((x) => [x.id, x.st]));
  ok(R.a === 'due' && R.b === 'bad' && R.c === 'due' && R.d === 'wait' && R.x === 'done', '상태 — 오늘 확인 · ⚠(확인함 전) · 확인함 뒤엔 다음 회차 · 첫 확인 전 · 모든 회차 끝', R);
  const P = F.rcPrune({ old: { ...e, at: new Date(now - 40 * 864e5).toISOString() }, new: { ...e, at: new Date(now - 864e5).toISOString() } }, [1, 3, 7, 30], now); ok(P.cut === 1 && P.m.new && !P.m.old, '오래된 기록 빼기 — 가장 긴 회차(30일) + 3일 넘은 것', P); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tRECHECK1112 ${bad}개 실패` : '✓ tRECHECK1112 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const cmds = () => p.evaluate(async () => { const g = await db.collection('shp_cmds').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.type === 'prdEdit') L.push({ id: d.id, k: v.listingKey, ch: v.ch }); }); return L; });
  const rcm = () => p.evaluate(async () => { const d = await db.collection('app_settings').doc('omni_recheck').get(); return (d.exists ? d.data() || {} : {}).m || {}; });
  /* 410 = 켠 뒤 예스24에서 팔림(알라딘 판매중 → 엔진이 판매중지) · 412 = 손으로 판매중지 맡긴 줄(시험이 일정을 직접 넣음) · 414 = 켜기 전 3시간 전 예스24에서 팔림(알라딘 판매중 · 밀린 일 미리보기 중 = 엔진이 아직 안 맡김) */
  await p.evaluate(() => { window.__T0 = Date.now(); const ids = ['aladin_U215983410', 'aladin_U215983412', 'aladin_U215983414']; ids.forEach((id) => { const l = S.plist.get(id); l.status = '판매중'; l.active = true; l.qty = 1; });
    window.ledNow = () => { const al = ids.map((id) => { const l = S.plist.get(id); return { id, title: l.title, price: l.price, qty: 1, live: aladinLive(l), st: l.status, skus: ['SK' + id.slice(-2)] }; });
      const ord = [{ ch: 'yes24', no: 'y0', at: new Date(window.__T0 - 10 * 60e3).toISOString(), amt: 5000, lines: [{ sku: 'SK10', qty: 1 }] }, { ch: 'yes24', no: 'y2', at: new Date(window.__T0 - 3 * 3600e3).toISOString(), amt: 5000, lines: [{ sku: 'SK14', qty: 1 }] }];
      return ledBuild({ al, y24: [], ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S.y24.loaded = true; S.y24o.loaded = true; S.prodLoaded = true; localStorage.removeItem('rn-c2seen'); });
  await p.evaluate(async () => { await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); await omniLoad(true); S.omni.at = 0; await omniTick(); });
  await p.waitForTimeout(600);
  const C1 = await cmds(); let M = await rcm(); const e410 = Object.entries(M).find(([, e]) => e.id === 'aladin_U215983410');
  ok(C1.length === 1 && C1[0].k === 'aladin_U215983410' && e410 && e410[1].src === 'auto' && e410[1].k === 'down' && e410[1].ch === 'aladin' && e410[1].key === 'SK10', '🤖 자동 내림이 알라딘 판매중지를 맡김 → 사후 확인 일정 한 줄(공용 문서 · src auto · 기대 판매중지)', { C1, M });
  ok(!Object.values(M).some((e) => e.id === 'aladin_U215983414'), '밀린 일(미리보기 중 · 아직 안 맡김)은 일정 없음', M);
  /* 하루 지남(일정 당김) — 410은 알라딘에서 판매중지 반영 · 412는 손으로 판매중지 맡겼는데 다시 판매중(3.5일 전) · 414는 손으로 맡겼는데 장부 처리할 일이 3시간째 남음(1.5일 전) */
  const R1 = await p.evaluate(async (k410) => { const ref = db.collection('app_settings').doc('omni_recheck'); const d = (await ref.get()).data(); const ago = (dd) => new Date(Date.now() - dd * 864e5).toISOString();
      d.m[k410].at = ago(1.2); d.m.aladin_aladin_U215983412_down_0_x = { ch: 'aladin', key: 'SK12', id: 'aladin_U215983412', no: null, k: 'down', to: 0, t: '손 줄', src: 'hand', at: ago(3.5), dev: 'PC', r: {} };
      d.m.aladin_aladin_U215983414_down_0_x = { ch: 'aladin', key: 'SK14', id: 'aladin_U215983414', no: null, k: 'down', to: 0, t: '남은 줄', src: 'hand', at: ago(1.5), dev: 'PC', r: {} }; await ref.set(d);
      S.plist.get('aladin_U215983410').status = '판매중지'; S._led = null; S.rc.at = 0; const n = await rcTick(true); await new Promise((r) => setTimeout(r, 400)); await rcLoad(true); return { n, m: S.rc.m }; }, e410[0]);
  await p.waitForTimeout(500); M = await rcm(); const g = (id) => Object.values(M).find((e) => e.id === id && e.src === 'hand') || Object.values(M).find((e) => e.id === id);
  const a410 = M[e410[0]]; ok(a410 && a410.r && a410.r['1'] && a410.r['1'].v === 'ok' && /판매중지 그대로/.test(a410.r['1'].m), '1일째 410 — 알라딘 판매중지 그대로 → ✅', { a410, n: R1.n });
  const a412 = M.aladin_aladin_U215983412_down_0_x; ok(a412 && a412.r['1'] && a412.r['3'] && a412.r['1'].v === 'bad' && a412.r['3'].with === '1,3' && /사람 확인/.test(a412.r['1'].m) && !a412.r['1'].re, '412 — 다시 판매중 · 장부 규칙 없음 → ⚠ 사람 확인(PC가 꺼졌던 1·3일 함께 · 다시 맡기지 않음)', a412);
  const a414 = M.aladin_aladin_U215983414_down_0_x; const C2 = await cmds();
  ok(a414 && a414.r['1'] && a414.r['1'].v === 'bad' && /다시 맡김/.test(a414.r['1'].re || '') && C2.some((c) => c.k === 'aladin_U215983414' && c.ch && c.ch.state === '판매중지'), '414 — 🛠 처리할 일 3시간째 → 같은 규칙·다시 셈을 거쳐 엔진 길로 그 자리에서 다시 맡김(shp_cmds prdEdit)', { a414, C2 });
  ok(Object.values(M).some((e) => e.id === 'aladin_U215983414' && e.src === 'rc'), '다시 맡긴 일도 새 일정(src rc)', Object.values(M).map((e) => [e.id, e.src]));
  ok(!C2.some((c) => c.k === 'aladin_U215983412') && C2.filter((c) => c.k === 'aladin_U215983410').length === 1, '규칙 없는 412는 안 보냄 · ✅인 410은 되풀이 0', C2);
  const R2 = await p.evaluate(async () => { const n = await rcTick(true); return n; }); ok(R2 === 0, '다시 돌아도 확인한 회차는 다시 안 함', R2);
  /* 홈 알림 · 🔁 사후 확인 보기 */
  const A = await p.evaluate(() => { const L = []; rcAlerts((lv, t, key, x) => L.push({ lv, t, key, n: x && x.n })); return L; });
  ok(A.length === 1 && A[0].key === 'omnirc' && A[0].n === 2 && /어긋난 일 2건/.test(A[0].t), "홈 '오늘 확인할 것' — 🔁 사후 확인 어긋남 2건", A);
  await p.evaluate(() => { S._ledView = 'todo'; openLedger(); }); await p.waitForTimeout(400);
  const V0 = await p.evaluate(() => { const b = document.querySelector('[data-ledview="rc"]'); return b ? { t: b.textContent, hot: b.classList.contains('hot') } : null; });
  ok(V0 && /사후 확인\s*2/.test(V0.t) && V0.hot, "통합 장부 보기 칸 '🔁 사후 확인 2'(⚠ 수 · 빨강)", V0);
  await p.evaluate(() => document.querySelector('[data-ledview="rc"]').click()); await p.waitForTimeout(500);
  const V = await p.evaluate(() => { const sh = document.getElementById('sheet'); return { txt: sh ? sh.textContent : '', rows: sh ? sh.querySelectorAll('tbody tr').length : 0, ack: sh ? sh.querySelectorAll('[data-rcack]').length : 0, card: !!document.getElementById('rc_card') }; });
  ok(V.card && V.rows >= 4 && V.ack === 2 && /⚠ 어긋남\s*2/.test(V.txt) && /✅ 그대로/.test(V.txt) && /1일 ✅/.test(V.txt) && /3일 ⚠/.test(V.txt), '🔁 사후 확인 보기 — 요약 카드 · 줄마다 회차 칩(1일 ✅ · 3일 ⚠) · ⚠ 줄에 ✓ 확인함', { rows: V.rows, ack: V.ack, t: V.txt.slice(0, 600) });
  await p.locator('[data-rcack]').first().click(); await p.waitForTimeout(500);
  const A2 = await p.evaluate(() => rcBad().length); ok(A2 === 1, '✓ 확인함 → 알림에서 빠짐(1건 남음)', A2);
  /* ⚙ 설정 — 회차 고치기 · 끄기 */
  const ST = await p.evaluate(async () => { const box = document.createElement('div'); box.innerHTML = rcSetHtml(); document.body.appendChild(box); document.getElementById('rc_days').value = '2, 5, 5, 0'; box.querySelector('[data-rcsave]').click(); await new Promise((r) => setTimeout(r, 400));
    const d = await db.collection('app_settings').doc('platforms').get(); const v = ((d.data() || {}).omni || {}).recheck; const c1 = rcCfg();
    document.getElementById('rc_on').checked = false; document.getElementById('rc_days').value = '1, 3, 7, 30'; box.querySelector('[data-rcsave]').click(); await new Promise((r) => setTimeout(r, 400)); const c2 = rcCfg(); const n = await rcAdd([{ ch: 'aladin', id: 'aladin_X', key: 'X', k: 'down', to: 0 }]); const bad = document.createElement('div'); bad.innerHTML = rcSetHtml(); box.remove();
    return { v, c1, c2, n, auto: (((d.data() || {}).omni || {}).autoDown || {}).on }; });
  ok(ST.v && JSON.stringify(ST.v.days) === '[2,5]' && JSON.stringify(ST.c1.days) === '[2,5]' && ST.auto === 1, '⚙ 회차 저장 — 2, 5(중복·0 빼고) · 모든 기기 같은 자리 · 자동 내림 설정은 그대로', ST);
  ok(ST.c2.on === 0 && ST.n === 0, '⚙ 끄기 → 새 일정 안 만듦', ST);
  ok(!dlg.length, '브라우저 창(alert·confirm) 0', dlg);
  console.log(bad ? `❌ tRECHECK1112 ${bad}개 실패` : '✓ tRECHECK1112 모두 통과'); });
