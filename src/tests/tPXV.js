// 👀 tPXV — 정범님 11/08 '우리 숍 조회 지표 페이지': ① 전체(누적) = 클라우드 합(px_sum) + 아직 안 더한 빈 날 + 최근 30일(같은 날 두 번 안 셈)
//  ② 붙음 표시 한 곳(pxAttach) — 붙음 + 매일 일 차례 = 🟢 + 🔁 · 붙었다 빠짐(on false · addedAt · state fail) = 🟠 · 붙은 기록 없는데 조회 = 🟠
//  ③ 카드 ▸ 자세히 — 날마다·방문 구분·'본 사람 받기' 뒤 방문자 줄 ④ 🛠 운영·🧪 실험 기록이 접혀 있고 그림만 시험 단추·실험 그룹은 실험 기록 안 ⑤ 페이지 오류 없음
//  사용: w/pw 안에서 RN_PORT=8765 node tPXV.js · 휴대폰(390px) 사진도: PX_SHOT=../px_mobile.png RN_PORT=8765 node tPXV.js
const SHOT = process.env.PX_SHOT || '';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
  const A = '530000001', B = '530000002', C = '530000003';
  R.seed = await p.evaluate(async ({ A, B, C }) => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const base = S.plist.get('aladin_U215983410'); const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
    [[A, '조회 시험 책 가'], [B, '조회 시험 책 나'], [C, '조회 시험 책 다']].forEach(([lid, t], i) => { const uc = 'U9' + (1000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, title: t, status: '판매중', active: true }); });
    const since = pxDay(now - (PX_DAYS - 1) * 864e5); const dayAgo = (k) => pxDay(now - k * 864e5); const lastOld = pxDayAdd(since, -1); const thru = pxDayAdd(since, -3); const old = pxDayAdd(since, -5);
    const vw = (lid, day, o) => db.collection('px_views').doc(lid + '_' + day.replace(/-/g, '')).set({ lid, day, n: o.human + (o.bot || 0), human: o.human, bot: o.bot || 0, uniq: o.human, lastAt: o.lastAt || null, lastKind: 'human', ...(o.bs ? { bs: o.bs } : {}), ...(o.x ? { x: o.x } : {}) });
    // A — 최근 30일: 오늘 2(브라우저 둘 · 기기·출처·시간대 칸) + 3일 전 3 · 빈 날(합에 아직 안 들어간 thru 뒤 ~ 실시간 앞) 7 · 이미 합에 든 옛날 999(다시 세면 안 됨)
    await vw(A, dayAgo(0), { human: 2, bs: ['k1aaaaaaaa', 'k2bbbbbbbb'], lastAt: iso(now - 60e3), x: { dv: { mobile: 2 }, os: { iOS: 2 }, br: { Safari: 2 }, rf: { m_prod: 2 }, hr: { 10: 2 } } });
    await vw(A, dayAgo(3), { human: 3, bot: 1, bs: ['k1aaaaaaaa'] });
    await vw(A, lastOld, { human: 7 }); await vw(A, old, { human: 999 });
    await vw(C, dayAgo(1), { human: 4 }); /* C — 붙은 기록 없는데 조회 */
    await db.collection('px_sum').doc('meta').set({ thru, days: 20, docs: 40 }); const L = {}; L[A] = [120, 100, 20, 0, 90, 0, 0, 0, 0, 0, '2026-09-01', thru, 20]; L[B] = [10, 8, 2, 0, 8, 0, 0, 0, 0, 0, '2026-09-02', thru, 4];
    for (let i = 0; i < PXSUM_N; i++) await db.collection('px_sum').doc('s' + i).set({ L: i === 3 ? L : {} }); /* 웹앱은 8칸을 다 읽으므로 어느 칸이든 같음 */
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: iso(now - 10 * 864e5), src: 'g:g_all1107' });
    await db.collection('px_exp').doc(B).set({ lid: B, on: false, state: 'fail', addedAt: iso(now - 20 * 864e5), chkAt: iso(now - 864e5), failMsg: '유의 사항에 그림이 없음 — 다시 붙이지 못함(시험)', src: 'g:g_all1107' });
    await db.collection('px_exp').doc(C).set({ lid: C, on: false, src: 'manual' });
    await db.collection('shp_cmds').doc('cpxd1').set({ type: 'pxExp', op: 'add', status: 'held', gid: 'g_all1107', listingIds: [A], createdAt: iso(now - 600e3) }); /* ⏰ 매일 일 — 이미 붙은 A도 다시 확인 차례 */
    await db.collection('px_exp_groups').doc('g_bare1107').set({ gid: 'g_bare1107', name: '🧪 그림만 시험(11/07)', bare: 10, lids: [A], on: true, importedAt: iso(now), lastImportAt: iso(now) });
    // 방문자 — 가짜 Firebase는 where('p.<번호>')를 문서 맨 위 칸 'p.<번호>'로 찾음 → 같이 넣음
    await db.collection('px_vis').doc('vabcdef123456').set({ key: 'abcdef123456', kind: 'human', n: 5, p: { [A]: 3 }, ['p.' + A]: 3, days: [dayAgo(3), dayAgo(0)], ua: { dv: 'mobile', os: 'iOS', br: 'Safari' }, ckN: 4, noCkN: 1, lastAt: iso(now - 60e3), lastLid: A });
    await db.collection('px_vis').doc('vzzzzzz999999').set({ key: 'zzzzzz999999', kind: 'human', n: 1, p: { [B]: 1 }, ['p.' + B]: 1, days: [dayAgo(2)], ua: { dv: 'pc' }, lastAt: iso(now - 2 * 864e5), lastLid: B });
    try { localStorage.removeItem('rn-pxcd'); } catch (e) {} pxInit(); return { since, thru, lastOld }; }, { A, B, C });
  await p.waitForTimeout(1000); await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200); await p.evaluate(() => pxOldLoad(true)); await p.waitForTimeout(900); await p.evaluate(() => pxDraw(true)); await p.waitForTimeout(500);
  // ① 전체(누적) = 합 100 + 빈 날 7 + 30일 5 = 112 (옛날 999는 합에 이미 든 날이라 안 셈) · B = 합 8만
  R.all = await p.evaluate(({ A, B, C }) => { const a = pxCalc(A), b = pxCalc(B), c = pxCalc(C); return { ok: S.px.oldOk, cut: S.px.oldCut, gap: S.px.oldMeta && S.px.oldMeta.gap, a: a.all && a.all.human, a30: a.M.human, a7: a.W.human, aT: a.T.human, first: a.first, b: b.all && b.all.human, c: c.all && c.all.human, tile: ([...document.querySelectorAll('#px_top .pxtile')].find((t) => /전체\(누적\)/.test(t.textContent)) || {}).textContent }; }, { A, B, C });
  chk('allA', R.all.ok && R.all.a === 112 && R.all.a30 === 5 && R.all.a7 === 5 && R.all.aT === 2 && R.all.first === '2026-09-01', R.all);
  chk('allB', R.all.b === 8 && R.all.c === 4 && R.all.cut === R.seed.lastOld && R.all.gap === 1, R.all);
  chk('allTile', /124/.test((R.all.tile || '').replace(/,/g, '')), R.all.tile); /* 112 + 8 + 4 */
  R.core = await p.evaluate((A) => { const el = document.querySelector(`[data-pxcore="${A}"]`); return el ? el.textContent.replace(/\s+/g, ' ') : null; }, A); chk('cardAll', /전체\s*112/.test(R.core || '') && /오늘\s*2/.test(R.core || '') && /7일\s*5/.test(R.core || ''), R.core);
  // ② 붙음 표시
  R.chip = await p.evaluate((ids) => Object.fromEntries(ids.map((k) => { const c = document.querySelector(`.pxcard[data-pxid="${k}"] .pxstate`); return [k, c ? c.textContent.replace(/\s+/g, ' ').trim() : null]; })), [A, B, C]);
  chk('chipOn', /🟢 그림 붙음/.test(R.chip[A] || '') && /10일째/.test(R.chip[A]) && /🔁 다시 확인 차례/.test(R.chip[A]) && !/붙이는 중/.test(R.chip[A]), R.chip[A]);
  chk('chipLost', /🟠 붙어 있었음 — 지금은 빠짐/.test(R.chip[B] || ''), R.chip[B]);
  chk('chipOdd', /🟠 조회는 있는데 붙은 기록 없음/.test(R.chip[C] || ''), R.chip[C]);
  R.att = await p.evaluate(({ B, C }) => [pxAttach(pxSt(B), pxCalc(B)), pxAttach(pxSt(C), pxCalc(C)), pxAttach(pxSt(C), null)].map((x) => x.k + ':' + (x.tip || '').slice(0, 40)), { B, C }); chk('attTip', /^lost:/.test(R.att[0]) && /^odd:/.test(R.att[1]) && /^none:/.test(R.att[2]), R.att);
  // ③ 카드 ▸ 자세히 — 접혀 있으면 비어 있고, 펼치면 날마다·방문 구분 · '본 사람 받기' 뒤 방문자 줄
  R.cd0 = await p.evaluate((A) => { const d = document.querySelector(`details[data-pxcd="${A}"]`); return d ? { open: d.open, x: d.querySelector('[data-pxcx]').innerHTML.length } : null; }, A); chk('cdClosed', R.cd0 && !R.cd0.open && R.cd0.x === 0, R.cd0);
  await p.evaluate((A) => document.querySelector(`.pxcard[data-pxid="${A}"]`).scrollIntoView(), A); await p.click(`details[data-pxcd="${A}"] > summary`); await p.waitForTimeout(500);
  R.cd = await p.evaluate((A) => { const x = document.querySelector(`[data-pxcx="${A}"]`); const t = x ? x.textContent.replace(/\s+/g, ' ') : ''; return { rows: x ? x.querySelectorAll('.pxvt tbody tr').length : -1, days: /📅 날마다/.test(t), brk: /🧭 이 상품 방문 구분/.test(t) && /📱 기기/.test(t) && /🔗 출처/.test(t) && /휴대폰/.test(t) && /알라딘 모바일 상품 화면/.test(t), hr: !!(x && x.querySelector('.pxhr svg')), rel: /💰 판매 전체/.test(t) && /한 브라우저당/.test(t), whoBtn: !!(x && x.querySelector(`[data-pxwho="${A}"]`)), saved: (() => { try { return JSON.parse(localStorage.getItem('rn-pxcd') || '[]'); } catch (e) { return null; } })() }; }, A);
  chk('cdOpen', R.cd.rows === 2 && R.cd.days && R.cd.brk && R.cd.hr && R.cd.rel && R.cd.whoBtn && (R.cd.saved || []).includes(A), R.cd);
  await p.click(`[data-pxwho="${A}"]`); await p.waitForTimeout(900);
  R.who = await p.evaluate((A) => { const el = document.querySelector(`[data-pxwhoc="${A}"]`); return el ? { rows: el.querySelectorAll('tr.pxvr').length, t: el.textContent.replace(/\s+/g, ' ').slice(0, 300) } : null; }, A);
  chk('who', R.who && R.who.rows === 1 && /abcdef/.test(R.who.t) && !/zzzzzz/.test(R.who.t) && /다시/.test(R.who.t), R.who);
  // ④ 운영·실험 기록 — 처음엔 접힘 · 운영 안에 매일 자동·그룹·직접 붙이기 · 실험 기록 안에 그림만 시험 단추·실험 그룹
  R.sec = await p.evaluate(() => { const ops = document.getElementById('px_ops'), lab = document.getElementById('px_lab'); const inn = (q, box) => { const e = document.querySelector(q); return !!(e && e.closest(box)); };
    return { opsClosed: ops && !ops.open, labClosed: lab && !lab.open, ops: ['#px_daily', '#px_grps', '#px_addc'].every((q) => inn(q, '#px_ops')), bareBtn: [...lab.querySelectorAll('button')].some((b) => /그림만 시험/.test(b.textContent)), labGrp: inn('details[data-pxgid="g_bare1107"]', '#px_lab'), notOps: !inn('details[data-pxgid="g_bare1107"]', '#px_ops') }; });
  chk('secs', R.sec.opsClosed && R.sec.labClosed && R.sec.ops && R.sec.bareBtn && R.sec.labGrp && R.sec.notOps, R.sec);
  // 칸 건너뛰기 — 접힌 🛠 운영으로 가면 펼쳐짐
  await p.click('#px_top .pxnav [data-pxjump="px_ops"]'); await p.waitForTimeout(500); R.jump = await p.evaluate(() => document.getElementById('px_ops').open && S.sec.px_ops === true); chk('jumpOps', R.jump, R.jump);
  if (SHOT) { await p.evaluate(() => { document.querySelectorAll('#px_ops,#px_lab').forEach((d) => (d.open = true)); const sh = document.querySelector('#sheet'); sh.style.position = 'static'; sh.style.height = 'auto'; sh.style.overflow = 'visible'; document.body.style.overflow = 'visible'; document.documentElement.style.overflow = 'visible'; [...document.body.children].forEach((e) => { if (e !== sh && !e.contains(sh) && e.tagName !== 'SCRIPT') e.style.display = 'none'; }); let q = sh.parentElement; while (q && q !== document.body) { [...q.children].forEach((e) => { if (e !== sh && !e.contains(sh)) e.style.display = 'none'; }); q = q.parentElement; } window.scrollTo(0, 0); }); /* 사진엔 조회 페이지만(뒤 홈 화면 숨김) */ await p.waitForTimeout(400);
    R.wide = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('#sheet *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > W + 1 && !e.closest('.pxvt,table,svg,pre,code'); }).slice(0, 12).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right) + ':' + e.textContent.slice(0, 40)); }); /* 화면 밖으로 삐져나간 것(표 안 가로 넘김은 뺌) */
    await p.screenshot({ path: SHOT, fullPage: true }); console.log('📱 사진', SHOT); }
  // ⑤ 페이지 오류 없음
  chk('noErr', errs.length === 0, errs);
  console.log(JSON.stringify(R, null, 1).slice(0, 5000)); console.log(bad.length ? '❌ tPXV 실패 — ' + bad.join(', ') : '✓ tPXV 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
}, SHOT ? { vp: { width: 390, height: 844 }, touch: true } : {});
