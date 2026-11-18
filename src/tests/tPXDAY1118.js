// 📅 tPXDAY1118 — 정범님 11/18 12:08 조회수 페이지
//  ① 방문 구분 맨 앞 '📅 날마다 방문' 카드 · 숍 전체 한눈에 첫 칸도 날마다 방문
//  ② 카드·칸을 누르면 자세히 창(화면 이동 없음) — 그림(svg)·수치 칸·날 표 · 일/주/월/년 · 기간 · 값 고르기 · ⚙ 설정(기기 저장 · 팝업 없음) · 날 고르기
//  ③ 관찰 범위·진행·살필 것 칸 → 새 안 창 · ✕·Esc 닫기 ④ 창 안 상품 이름 → 곧바로 상품 상세(멈춤 없음) ⑤ 페이지 오류·브라우저 팝업 없음
//  사용: RN_PORT=8765 node tPXDAY1118.js · 사진: PX_SHOT=../pxday.png
const SHOT = process.env.PX_SHOT || '';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
  const A = '530000011', B = '530000012';
  R.seed = await p.evaluate(async ({ A, B }) => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const base = S.plist.get('aladin_U215983410'); const now = Date.now();
    [[A, '날마다 시험 책 가'], [B, '날마다 시험 책 나']].forEach(([lid, t], i) => { const uc = 'U8' + (1000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, title: t, status: '판매중', active: true }); });
    const dayAgo = (k) => pxDay(now - k * 864e5);
    const vw = (lid, day, o) => db.collection('px_views').doc(lid + '_' + day.replace(/-/g, '')).set({ lid, day, n: o.human + (o.bot || 0), human: o.human, bot: o.bot || 0, uniq: o.human, lastKind: 'human', ...(o.x ? { x: o.x } : {}) });
    let hA = 0, hB = 0;
    for (let k = 0; k < 24; k++) { const h = 1 + (k % 5); hA += h; await vw(A, dayAgo(k), { human: h, bot: k % 3, x: { hr: { [8 + (k % 12)]: h }, dv: { mobile: h } } }); }
    for (let k = 0; k < 10; k += 2) { hB += 2; await vw(B, dayAgo(k), { human: 2, x: { hr: { 21: 2 } } }); }
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: new Date(now - 30 * 864e5).toISOString(), src: 'manual' });
    await db.collection('px_exp').doc(B).set({ lid: B, on: false, state: 'failed', err: '시험 실패', addedAt: new Date(now - 30 * 864e5).toISOString(), src: 'manual' });
    try { localStorage.removeItem('rn-pxday'); } catch (e) {}
    pxInit(); return { hA, hB, today: dayAgo(0) }; }, { A, B });
  await p.waitForTimeout(1000); await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200);
  // ① 카드 차례 — 숍 전체 한눈에 첫 칸 · 방문 구분 첫 카드(방문 구분 칸을 펼쳐야 그려짐)
  const brk = () => p.evaluate(() => { const d = document.querySelector('[data-pxbrk]'); if (d) { d.open = true; d.scrollIntoView(); } }).then(() => p.waitForTimeout(400));
  await brk(); await p.evaluate(() => document.querySelector('#sheet').scrollTo(0, 0));
  R.first = await p.evaluate(() => { const t = document.querySelector('#px_top .pxtile'); const g = document.querySelector('.pxbgrid'); const c = g && g.firstElementChild; return { tile: t ? t.textContent.replace(/\s+/g, ' ').slice(0, 80) : '', tday: !!(t && t.dataset.pxday), card: !!(c && c.classList.contains('pxdaycard')), cardT: c ? c.textContent.replace(/\s+/g, ' ').slice(0, 120) : '', mini: !!(c && c.querySelector('svg')) }; });
  chk('firstTile', /날마다 방문/.test(R.first.tile) && R.first.tday, R.first);
  chk('firstCard', R.first.card && /날마다 방문/.test(R.first.cardT) && R.first.mini, R.first);
  // 숍 전체 한눈에 칸 — 화면 이동(data-pxjump) 대신 창 열기(data-pxday·data-pxwin)
  R.tiles = await p.evaluate(() => [...document.querySelectorAll('#px_top .pxtile')].map((t) => (t.dataset.pxday ? 'd:' + t.dataset.pxday : t.dataset.pxwin ? 'w:' + t.dataset.pxwin : t.dataset.pxjump ? 'j:' + t.dataset.pxjump : '-')));
  chk('tilesWin', R.tiles.length >= 8 && R.tiles.every((x) => /^[dw]:/.test(x)) && ['w:cov', 'w:prog', 'w:chk'].every((x) => R.tiles.includes(x)), R.tiles);
  // ② 첫 칸 → 날마다 방문 창 (스크롤 그대로)
  const y0 = await p.evaluate(() => document.querySelector('#sheet').scrollTop);
  await p.click('#px_top .pxtile[data-pxday]'); await p.waitForTimeout(400);
  R.win = await p.evaluate(() => { const ov = document.querySelector('.pxdwov'); if (!ov) return null; const t = ov.textContent.replace(/\s+/g, ' '); return { svg: ov.querySelectorAll('svg.pxdc').length, kpi: ov.querySelectorAll('.pxdk').length, rows: ov.querySelectorAll('.pxdtab tbody tr').length, x: !!ov.querySelector('.bigask-x'), wk: /요일/.test(t), hr: /시각|시간대/.test(t), ma: /이동 평균/.test(t), y: document.querySelector('#sheet').scrollTop }; });
  chk('dayWin', R.win && R.win.svg >= 4 && R.win.kpi >= 8 && R.win.rows >= 20 && R.win.x && R.win.wk && R.win.hr && R.win.ma && R.win.y === y0, { ...R.win, y0 });
  // 일 → 주 → 월 → 년
  const pick = async (sel) => { await p.click('.pxdwov ' + sel); await p.waitForTimeout(150); return p.evaluate(() => ({ ...S.px.P.dw, svg: document.querySelectorAll('.pxdwov svg.pxdc').length, open: !!document.querySelector('.pxdwov'), t: (document.querySelector('.pxdwov .bigask-c') || {}).textContent || '' })); };
  R.u = {}; for (const u of ['w', 'm', 'y', 'd']) { const r = await pick(`[data-pxdu="${u}"]`); R.u[u] = { u: r.u, svg: r.svg, open: r.open, per: u === 'w' ? /주/.test(r.t) : u === 'm' ? /월/.test(r.t) : u === 'y' ? /년/.test(r.t) : true }; }
  chk('units', ['w', 'm', 'y', 'd'].every((u) => R.u[u].u === u && R.u[u].open && R.u[u].svg >= 1 && R.u[u].per), R.u);
  R.rng = await pick('[data-pxdr="14"]'); R.met = await pick('[data-pxdm="b"]');
  chk('rngMet', R.rng.rng === 14 && R.met.m === 'b' && R.met.open, { rng: R.rng.rng, m: R.met.m });
  await pick('[data-pxdm="h"]');
  // 사람 합 = 심어 둔 조회(전체 기간 · 일 단위)
  await pick('[data-pxdr="0"]');
  R.tot = await p.evaluate(() => { const { D } = pxDaySeries('all'); return D.reduce((a, o) => a + (o.h || 0), 0); });
  chk('total', R.tot === R.seed.hA + R.seed.hB, { tot: R.tot, want: R.seed.hA + R.seed.hB });
  // ⚙ 설정 — 짧은 이동 평균 5일 · 기기에 저장 · 설정 칸은 열린 채 · 팝업 없음
  R.cfg = await p.evaluate(async () => { const ov = document.querySelector('.pxdwov'); const d = ov.querySelector('details.pxdcfg'); d.open = true; const i = ov.querySelector('[data-pxdcfg2="ma1"]'); i.value = '5'; i.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 150)); let s = null; try { s = JSON.parse(localStorage.getItem('rn-pxday') || 'null'); } catch (e) {} const d2 = document.querySelector('.pxdwov details.pxdcfg'); return { s, open: !!(d2 && d2.open), ma1: pxDayCfg().ma1, lbl: /5일/.test(document.querySelector('.pxdwov .bigask-c').textContent) }; });
  chk('cfgSave', R.cfg.s && R.cfg.s.ma1 === 5 && R.cfg.ma1 === 5 && R.cfg.open && R.cfg.lbl, R.cfg);
  await p.click('.pxdwov [data-pxdreset]'); await p.waitForTimeout(150);
  R.reset = await p.evaluate(() => { let s = 'x'; try { s = localStorage.getItem('rn-pxday'); } catch (e) {} return { s, ma1: pxDayCfg().ma1 }; });
  chk('cfgReset', R.reset.s == null && R.reset.ma1 === 7, R.reset);
  // 날 고르기 — 오늘 막대 → 그날 자세히(상품 이름)
  R.sel = await p.evaluate(async (td) => { const g = document.querySelector(`.pxdwov svg.pxdc [data-pxdd="${td}"]`) || document.querySelector('.pxdwov [data-pxdd]'); if (!g) return null; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 150)); const s = document.querySelector('.pxdwov #pxd_sel'); return { sel: S.px.P.dw.sel, box: !!s, go: s ? s.querySelectorAll('[data-pxgo]').length : 0, hr: s ? s.querySelectorAll('svg').length : 0 }; }, R.seed.today);
  chk('daySel', R.sel && R.sel.sel === R.seed.today && R.sel.box && R.sel.go >= 1, R.sel);
  // ④ 창 안 상품 이름 → 창 닫히고 곧바로 상품 상세
  R.go = await p.evaluate(async () => { const b = document.querySelector('.pxdwov #pxd_sel [data-pxgo]'); const t0 = performance.now(); b.click(); await new Promise((r) => setTimeout(r, 50)); for (let i = 0; i < 40 && !(document.querySelector('#sheet .sh .t') || {}).textContent; i++) await new Promise((r) => setTimeout(r, 50)); const tt = (document.querySelector('#sheet .sh .t') || {}).textContent || ''; return { ms: Math.round(performance.now() - t0), win: !!document.querySelector('.pxdwov'), t: tt.slice(0, 40), p: history.state && history.state.p }; });
  chk('goProd', !R.go.win && /날마다 시험 책/.test(R.go.t) && R.go.ms < 1500, R.go);
  // 돌아와서 카드로 열기 → Esc로 창만 닫힘
  await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(800); await brk();
  await p.evaluate(() => { const c = document.querySelector('.pxbgrid .pxdaycard'); c.scrollIntoView(); }); await p.click('.pxbgrid .pxdaycard'); await p.waitForTimeout(300);
  R.card = await p.evaluate(() => ({ open: !!document.querySelector('.pxdwov'), sc: S.px.P.dw && S.px.P.dw.sc, scope: pxScope().sc }));
  chk('cardOpen', R.card.open && R.card.sc === (R.card.scope || 'all'), R.card);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  R.esc = await p.evaluate(() => ({ win: !!document.querySelector('.pxdwov'), page: !!(S.detail && S.detail.pxexp) })); chk('dayEsc', !R.esc.win && R.esc.page, R.esc);
  // ③ 관찰 범위·진행·살필 것 → 새 안 창 · ✕ 닫기
  R.info = {}; for (const k of ['cov', 'prog', 'chk']) { await p.click(`#px_top .pxtile[data-pxwin="${k}"]`); await p.waitForTimeout(250); R.info[k] = await p.evaluate(() => { const ov = document.querySelector('.pxiwov'); if (!ov) return null; const r = { len: ov.querySelector('.bigask-c').textContent.trim().length, x: !!ov.querySelector('.bigask-x'), go: ov.querySelectorAll('[data-pxgo]').length }; ov.querySelector('.bigask-x').click(); return r; }); await p.waitForTimeout(150); R.info[k] && (R.info[k].closed = await p.evaluate(() => !document.querySelector('.pxiwov'))); }
  chk('infoWins', ['cov', 'prog', 'chk'].every((k) => R.info[k] && R.info[k].len > 30 && R.info[k].x && R.info[k].closed) && R.info.chk.go >= 1, R.info);
  // 오늘 칸 → 오늘이 골라진 창
  await p.click('#px_top .pxtile[data-pxday="today"]'); await p.waitForTimeout(250);
  R.today = await p.evaluate(() => ({ sel: S.px.P.dw && S.px.P.dw.sel, box: !!document.querySelector('.pxdwov #pxd_sel') })); chk('todayTile', R.today.sel === R.seed.today && R.today.box, R.today);
  if (SHOT) { await p.screenshot({ path: SHOT.replace(/\.png$/, '_win.png') }); await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.evaluate(() => { const g = document.querySelector('.pxbgrid .pxdaycard') || document.querySelector('.pxbgrid'); g && g.scrollIntoView({ block: 'start' }); let a = g && g.parentElement; while (a && !(a.scrollHeight > a.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(a).overflowY))) a = a.parentElement; (a || window).scrollBy(0, -130); }); await p.waitForTimeout(200); await p.screenshot({ path: SHOT }); await p.evaluate(() => { const t = document.querySelector('#px_top'); t && t.scrollIntoView({ block: 'start' }); let a = t && t.parentElement; while (a && !(a.scrollHeight > a.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(a).overflowY))) a = a.parentElement; (a || window).scrollBy(0, -110); }); await p.waitForTimeout(150); await p.screenshot({ path: SHOT.replace(/\.png$/, '_top.png') }); console.log('📱 사진', SHOT); }
  else { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  // ⑤ 통합 장부 책 이름 → 상품 상세(data-rlpid 전역 처리 · Enter도)
  R.led = await p.evaluate(async () => { const id = [...S.plist.keys()][0]; const a = ledTitle({ title: '장부 시험', ch: { aladin: { id } } }); const b = ledTitle({ title: '없는 책', ch: { aladin: { id: 'aladin_없음' } } }); const box = document.createElement('div'); box.innerHTML = a; document.body.appendChild(box); S.detail = null; box.firstChild.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await new Promise((r) => setTimeout(r, 400)); const det = Object.keys(S.detail || {}).join(','); box.remove(); return { link: /data-rlpid=/.test(a) && /tabindex/.test(a), plain: !/data-rlpid/.test(b), det }; });
  chk('ledTitle', R.led.link && R.led.plain && R.led.det === 'product', R.led);
  chk('noDialog', dlg.length === 0, dlg);
  chk('noErr', errs.length === 0, errs);
  console.log(JSON.stringify(R, null, 1).slice(0, 5000)); console.log(bad.length ? '❌ tPXDAY1118 실패 — ' + bad.join(', ') : '✓ tPXDAY1118 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
}, SHOT ? { vp: { width: 390, height: 844 }, touch: true } : {});
