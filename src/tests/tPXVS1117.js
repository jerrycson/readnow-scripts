// 👀 tPXVS1117 — 정범님 11/17 조회수 페이지 손질
//  ① 전체(누적) — 옛 합을 아직 못 받았어도 '…' 대신 들은 날 합(≥) · 클라우드 합(px_sum)을 못 읽어도 옛 조회 문서로 셈 · 다시 읽으면 바른 합
//  ② 기간 묶기 pxPerKey(일·주(월요일)·월·년) · pxPeriods 합 · pxBreak 전체(30일 전 날 포함)
//  ③ 방문 구분 '전체' 단추 · 칸을 누르면 자세히 창(시간대 = 요일×시각) · 정렬·값 고르기·Esc 닫기 · 글쇠로 열기
//  ④ 칸 차례 — 방문 구분이 상품별 조회 위 · 한 줄 보기 ↔ 크게 보기 · 📅 기간별 한눈에 펼치기 ⑤ 페이지 오류 없음
//  사용: RN_PORT=8765 node tPXVS1117.js · 사진: PX_SHOT=../pxvs.png
const SHOT = process.env.PX_SHOT || '';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
  const A = '530000001', B = '530000002';
  R.seed = await p.evaluate(async ({ A, B }) => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const base = S.plist.get('aladin_U215983410'); const now = Date.now();
    [[A, '조회 시험 책 가'], [B, '조회 시험 책 나']].forEach(([lid, t], i) => { const uc = 'U9' + (1000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, title: t, status: '판매중', active: true }); });
    const since = pxDay(now - (PX_DAYS - 1) * 864e5); const dayAgo = (k) => pxDay(now - k * 864e5); const lastOld = pxDayAdd(since, -1); const thru = pxDayAdd(since, -3); const old = pxDayAdd(since, -5);
    const vw = (lid, day, o) => db.collection('px_views').doc(lid + '_' + day.replace(/-/g, '')).set({ lid, day, n: o.human + (o.bot || 0), human: o.human, bot: o.bot || 0, uniq: o.human, lastKind: 'human', ...(o.x ? { x: o.x } : {}) });
    await vw(A, dayAgo(0), { human: 2, x: { dv: { mobile: 2 }, rf: { m_prod: 2 }, hr: { 10: 2 }, gap: { lt10s: 1, '1_5m': 1 }, nav: { first: 2 } } });
    await vw(A, dayAgo(3), { human: 3, bot: 1, x: { dv: { pc: 3 }, rf: { w_prod: 3 }, hr: { 21: 3 }, gap: { lt10s: 3 } } });
    await vw(B, dayAgo(1), { human: 4, x: { dv: { mobile: 4 }, hr: { 21: 4 } } });
    await vw(A, lastOld, { human: 7, x: { dv: { tablet: 7 }, hr: { 3: 7 } } }); /* 빈 날(합에 아직 안 들어간 날) — 30일 전 */
    await vw(A, old, { human: 999 }); /* 이미 합에 든 날 — 합을 읽으면 다시 세면 안 됨 */
    await db.collection('px_sum').doc('meta').set({ thru, days: 20, docs: 40 }); const L = {}; L[A] = [120, 100, 20, 0, 90, 0, 0, 0, 0, 0, '2026-09-01', thru, 20];
    for (let i = 0; i < PXSUM_N; i++) await db.collection('px_sum').doc('s' + i).set({ L: i === 2 ? L : {} });
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: new Date(now - 10 * 864e5).toISOString(), src: 'manual' });
    await db.collection('px_exp').doc(B).set({ lid: B, on: true, state: 'done', addedAt: new Date(now - 10 * 864e5).toISOString(), src: 'manual' });
    pxInit(); return { since, thru, lastOld, old }; }, { A, B });
  await p.waitForTimeout(1000); await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200);
  const tileA = () => p.evaluate(() => ([...document.querySelectorAll('#px_top .pxtile')].find((t) => /전체\(누적\)/.test(t.textContent)) || {}).textContent || '');
  // ① 옛 합을 아직 못 받은 때 — '…'가 아니라 들은 날 합 + ≥ 표시
  R.part = await p.evaluate(() => { S.px.oldOk = false; S.px.oldErr = 'px_sum unavailable'; S.px._tot = null; const G = pxShopTot(); pxDraw(true); return { part: !!G.A.part, h: G.A.human }; });
  await p.waitForTimeout(300); R.partTile = (await tileA()).replace(/\s+/g, ' ');
  chk('partSum', R.part.part && R.part.h >= 9 && /≥/.test(R.partTile) && !/…/.test(R.partTile.split('전체(누적)')[1].slice(0, 6)) && /10분 뒤 다시/.test(R.partTile), { ...R.part, t: R.partTile });
  // 클라우드 합(px_sum)을 못 읽음(규칙·끊김) → 옛 조회 문서만으로 셈: 999 + 7 + 30일 5 = 1011
  R.noSum = await p.evaluate(async (A) => { const oc = db.collection.bind(db); db.collection = (n) => { const c = oc(n); if (n !== 'px_sum') return c; return { doc: () => ({ get: () => Promise.reject(Object.assign(new Error('denied'), { code: 'permission-denied' })) }) }; };
    try { await pxOldLoad(true); } finally { db.collection = oc; } const a = pxCalc(A); return { ok: S.px.oldOk, err: S.px.oldErr, sumErr: S.px.oldMeta && S.px.oldMeta.sumErr, a: a && a.all && a.all.human, part: !!pxShopTot().A.part }; }, A);
  chk('noSum', R.noSum.ok && !R.noSum.err && /px_sum/.test(R.noSum.sumErr || '') && R.noSum.a === 1011 && !R.noSum.part, R.noSum);
  // 다시 읽으면(합 읽힘) 합 100 + 빈 날 7 + 30일 5 = 112 · 옛 날마다 수(oldD)·칸별 합(oldX)
  R.full = await p.evaluate(async ({ A, lastOld, old }) => { await pxOldLoad(true); const a = pxCalc(A); const G = pxShopTot(); return { ok: S.px.oldOk, a: a.all.human, tot: G.A.human, part: !!G.A.part, odGap: S.px.oldD && S.px.oldD.get(lastOld) && S.px.oldD.get(lastOld).get(A), odOld: !!(S.px.oldD && S.px.oldD.get(old)), oxGap: S.px.oldX && S.px.oldX.get(lastOld) }; }, { ...R.seed, A, B });
  chk('fullSum', R.full.ok && R.full.a === 112 && R.full.tot === 116 && !R.full.part, R.full); /* 112 + B 4 */
  chk('oldD', R.full.odGap && R.full.odGap[0] === 7 && !R.full.odOld && R.full.oxGap && R.full.oxGap.dv && R.full.oxGap.dv.tablet === 7, R.full);
  await p.waitForTimeout(700); R.fullTile = (await tileA()).replace(/\s+/g, ' '); chk('fullTile', /116/.test(R.fullTile.replace(/,/g, '')) && !/≥/.test(R.fullTile), R.fullTile);
  // ② 기간 묶기 — 2026-11-16(월) → 자기 · 11-22(일) → 11-16 · 11-23(월) → 11-23 · 해 넘는 주 2027-01-01(금) → 2026-12-28
  R.key = await p.evaluate(() => [pxPerKey('2026-11-16', 'w'), pxPerKey('2026-11-22', 'w'), pxPerKey('2026-11-23', 'w'), pxPerKey('2027-01-01', 'w'), pxPerKey('2026-11-05', 'm'), pxPerKey('2026-11-05', 'y'), pxPerKey('2026-11-05', 'd'), pxPerLbl('2026-11-16', 'w'), pxPerLbl('2026-11', 'm')]);
  chk('perKey', R.key.slice(0, 7).join('|') === '2026-11-16|2026-11-16|2026-11-23|2026-12-28|2026-11|2026|2026-11-05' && /11\/16~11\/22 주/.test(R.key[7]) && R.key[8] === '2026년 11월', R.key);
  R.per = await p.evaluate(({ A, B, lastOld }) => { const sum = (L) => L.reduce((a, o) => a + o.h, 0); const D = pxPeriods('d'), W = pxPeriods('w'), M = pxPeriods('m'), Y = pxPeriods('y'); const g = D.find((o) => o.k === lastOld); const one = pxPeriods('d', new Set([B])); return { d: sum(D), w: sum(W), m: sum(M), y: sum(Y), nD: D.length, gap: g ? { h: g.h, n: g.n, tab: g.X.dv && g.X.dv.tablet } : null, onlyB: sum(one), wkMon: W.every((o) => new Date(o.k + 'T00:00:00Z').getUTCDay() === 1) }; }, { ...R.seed, A, B });
  chk('periods', R.per.d === 16 && R.per.w === 16 && R.per.m === 16 && R.per.y === 16 && R.per.nD === 4 && R.per.gap && R.per.gap.h === 7 && R.per.gap.n === 1 && R.per.gap.tab === 7 && R.per.onlyB === 4 && R.per.wkMon, R.per); /* 2+3+4+7 · 합에 든 옛날(999)은 날짜별 자료가 없어 빠짐 */
  R.brk = await p.evaluate(() => { const a = pxBreak(null, 0), w = pxBreak(null, 7), g = pxBreak(new Set(['530000002']), 0); return { allHum: a.hum, allTab: (a.T.dv || {}).tablet, allHr3: a.hr[3], old: a.old, wHum: w.hum, wTab: (w.T.dv || {}).tablet || 0, gHum: g.hum, gOld: g.old }; });
  chk('breakAll', R.brk.allHum === 16 && R.brk.allTab === 7 && R.brk.allHr3 === 7 && R.brk.old === 1 && R.brk.wHum === 9 && R.brk.wTab === 0 && R.brk.gHum === 4 && R.brk.gOld === 0, R.brk);
  // ④ 칸 차례 — 방문 구분이 상품별 조회 위 · 머리줄 바로 가기
  R.ord = await p.evaluate(() => { const v = document.getElementById('px_visit'), l = document.getElementById('px_list'), per = document.getElementById('px_perd'); const jb = [...document.querySelectorAll('#sheet .pxjbar [data-pxjump]')].map((b) => b.dataset.pxjump); const nav = [...document.querySelectorAll('#px_top .pxnav [data-pxjump]')].map((b) => b.dataset.pxjump); return { vBeforeL: !!(v && l && v.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING), perBeforeL: !!(per && l && per.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING), jb, nav: nav.slice(0, 4) }; });
  chk('order', R.ord.vBeforeL && R.ord.perBeforeL && R.ord.jb.includes('px_visit') && R.ord.jb.includes('px_perd') && R.ord.jb.indexOf('px_visit') < R.ord.jb.indexOf('px_list') && R.ord.nav.indexOf('px_visit') < R.ord.nav.indexOf('px_list'), R.ord);
  // ③ 방문 구분 펼침 → '전체' 단추
  await p.evaluate(() => { const d = document.querySelector('[data-pxbrk]'); d.open = true; d.scrollIntoView(); }); await p.waitForTimeout(400);
  await p.click('#px_brk [data-pxbd="0"]'); await p.waitForTimeout(300);
  R.bd = await p.evaluate(() => { const s = document.querySelector('#px_brk .pxbsum'); return { bd: S.px.P.bd, on: !!document.querySelector('#px_brk [data-pxbd="0"].on'), t: s ? s.textContent.replace(/\s+/g, ' ') : '' }; });
  chk('bdAll', R.bd.bd === 0 && R.bd.on && /전체\(기록이 있는 모든 날\)/.test(R.bd.t) && /사람 16/.test(R.bd.t) && /30일 전 1일 포함/.test(R.bd.t), R.bd);
  // 시간대 칸을 누르면 자세히 창 — 설명·24시 막대·요일×시각·표
  await p.click('#px_brk [data-pxbg="hr"]'); await p.waitForTimeout(400);
  R.gw = await p.evaluate(() => { const ov = document.querySelector('.pxgwov'); if (!ov) return null; const t = ov.textContent.replace(/\s+/g, ' '); return { heat: !!ov.querySelector('.pxheat'), ex: !!ov.querySelector('.pxgex'), rows: ov.querySelectorAll('.pxgt tbody tr[data-pxgwv]').length, trend: !!ov.querySelector('.pxgtr svg, svg.pxgtr, .pxgtr'), peak: /21시/.test(t), first: (ov.querySelector('.pxgt tbody tr[data-pxgwv]') || {}).dataset }; });
  chk('gwOpen', R.gw && R.gw.heat && R.gw.ex && R.gw.rows >= 3 && R.gw.peak, R.gw);
  // 정렬 — '합' 머리를 누르면 큰 차례(21시 7이 맨 위) · 또 누르면 반대
  R.sort = await p.evaluate(async () => { const ov = document.querySelector('.pxgwov'); const first = () => (ov.querySelector('.pxgt tbody tr[data-pxgwv]') || { dataset: {} }).dataset.pxgwv; const hd = [...ov.querySelectorAll('[data-pxgws]')]; const v = hd.find((b) => b.dataset.pxgws === 'v'); if (!v) return { noV: hd.map((b) => b.dataset.pxgws) }; v.click(); await new Promise((r) => setTimeout(r, 100)); const a = first(); ov.querySelector('[data-pxgws="v"]').click(); await new Promise((r) => setTimeout(r, 100)); const b = first(); return { a, b, gw: { ...S.px.P.gw } }; });
  chk('gwSort', R.sort.a === '21' && R.sort.b !== '21', R.sort);
  // 값 고르기 — 그 값의 날마다 그림·상품 줄
  R.sel = await p.evaluate(async () => { const ov = document.querySelector('.pxgwov'); const tr = ov.querySelector('.pxgt tbody tr[data-pxgwv="21"]'); tr.click(); await new Promise((r) => setTimeout(r, 100)); return { sel: S.px.P.gw && S.px.P.gw.sel, go: ov.querySelectorAll('[data-pxgo]').length, t: ov.textContent.replace(/\s+/g, ' ').includes('21시') }; });
  chk('gwSel', R.sel.sel === '21' && R.sel.go >= 1 && R.sel.t, R.sel);
  // 창 안 기간 바꾸기(7일) → 바깥 방문 구분도 같이
  R.gwd = await p.evaluate(async () => { const ov = document.querySelector('.pxgwov'); const b = ov.querySelector('[data-pxgwd="7"]'); if (!b) return null; b.click(); await new Promise((r) => setTimeout(r, 100)); return { bd: S.px.P.bd, open: !!document.querySelector('.pxgwov') }; });
  chk('gwPeriod', R.gwd && R.gwd.bd === 7 && R.gwd.open, R.gwd);
  // Esc → 창만 닫힘(조회 페이지는 그대로)
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  R.esc = await p.evaluate(() => ({ gw: !!document.querySelector('.pxgwov'), sheet: !!(S.detail && S.detail.pxexp) })); chk('gwEsc', !R.esc.gw && R.esc.sheet, R.esc);
  // 다른 칸(기기 종류) — 글쇠(Enter)로 열기 · 바탕 눌러 닫기
  await p.focus('#px_brk [data-pxbg="dv"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  R.kb = await p.evaluate(() => { const ov = document.querySelector('.pxgwov'); const t = ov ? ov.textContent.replace(/\s+/g, ' ') : ''; return { open: !!ov, g: S.px.P.gw && S.px.P.gw.g, mob: /휴대폰/.test(t) }; });
  chk('gwKey', R.kb.open && R.kb.g === 'dv' && R.kb.mob, R.kb);
  await p.evaluate(() => { const ov = document.querySelector('.pxgwov'); ov.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(200); chk('gwBack', await p.evaluate(() => !document.querySelector('.pxgwov') && !S.px.P.gw));
  // 📅 기간별 한눈에 — 펼치면 그려짐 · 월로 묶기 · 줄 펼치면 상품 표
  await p.evaluate(() => { const d = document.getElementById('px_perd'); d.open = true; d.scrollIntoView(); }); await p.waitForTimeout(400);
  R.perUi = await p.evaluate(() => ({ rows: document.querySelectorAll('#px_per details.pxpr').length, sec: S.sec.px_per }));
  await p.click('#px_per [data-pxpu="m"]'); await p.waitForTimeout(300);
  R.perM = await p.evaluate(async () => { const rows = [...document.querySelectorAll('#px_per details.pxpr')]; const r = rows[0]; if (!r) return { n: 0 }; r.open = true; await new Promise((x) => setTimeout(x, 200)); return { n: rows.length, u: S.px.P.perU, prod: r.querySelectorAll('[data-pxgo]').length, sum: !!r.querySelector('.pxpsum') }; });
  chk('perUi', R.perUi.rows === 4 && R.perUi.sec === true && R.perM.u === 'm' && R.perM.n >= 1 && R.perM.prod >= 1, { ...R.perUi, ...R.perM });
  // 한 줄 보기(처음) ↔ 크게 보기
  R.slim = await p.evaluate(() => { const c = [...document.querySelectorAll('#px_list .pxcard')]; return { n: c.length, slim: c.filter((x) => x.classList.contains('slim')).length, row: !!document.querySelector('#px_list .pxcard .pxslim') }; });
  await p.click('#px_list [data-pxview]'); await p.waitForTimeout(400);
  R.card = await p.evaluate(() => { const c = [...document.querySelectorAll('#px_list .pxcard')]; return { n: c.length, slim: c.filter((x) => x.classList.contains('slim')).length, view: S.px.P.view }; });
  chk('slimView', R.slim.n >= 2 && R.slim.slim === R.slim.n && R.slim.row && R.card.view === 'card' && R.card.slim === 0, { s: R.slim, c: R.card });
  await p.click('#px_list [data-pxview]'); await p.waitForTimeout(400);
  R.open1 = await p.evaluate(async () => { const c = document.querySelector('#px_list .pxcard.slim'); c.querySelector('.pxslim').click(); await new Promise((r) => setTimeout(r, 100)); return c.classList.contains('open'); }); chk('slimOpen', R.open1, R.open1);
  if (SHOT) { await p.evaluate(() => { document.querySelectorAll('[data-pxbrk]').forEach((d) => (d.open = true)); const sh = document.querySelector('#sheet'); sh.style.position = 'static'; sh.style.height = 'auto'; sh.style.overflow = 'visible'; document.body.style.overflow = 'visible'; document.documentElement.style.overflow = 'visible'; let q = sh; while (q && q !== document.body) { [...q.parentElement.children].forEach((e) => { if (e !== q && e.tagName !== 'SCRIPT') e.style.display = 'none'; }); q = q.parentElement; } window.scrollTo(0, 0); }); await p.waitForTimeout(400); await p.screenshot({ path: SHOT, fullPage: true });
    await p.evaluate(() => pxGrpWin('hr')); await p.waitForTimeout(300); await p.screenshot({ path: SHOT.replace(/\.png$/, '_win.png') }); console.log('📱 사진', SHOT); }
  chk('noErr', errs.length === 0, errs);
  console.log(JSON.stringify(R, null, 1).slice(0, 5000)); console.log(bad.length ? '❌ tPXVS1117 실패 — ' + bad.join(', ') : '✓ tPXVS1117 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
}, SHOT ? { vp: { width: 390, height: 844 }, touch: true } : {});
