// tFBCARD1117 — 📦 상품 탭 위 카드 줄에 「⬆ 앞 페이지 올리기」 카드(fbcard1 · 정범님 11/17 15:28 「상품탭 상단 서가지도, 알라딘매입 등의 카드들이 있는 곳에 카드로」)
//   카드가 🗺 서가 지도 바로 뒤에 있음 · 누르면 이미 있는 ⬆ 앞 페이지 올리기 화면(openFrontBump) · 카드 글은 이미 받은 자료만(새 읽기 없음) · 📱 카드 고르기에서 숨길 수 있음
//   꾸민 자료·가짜 Firestore만 — 앞 페이지 올리기를 실제로 실행하지 않음
// 실행: cd pw && RN_PORT=<포트> node tFBCARD1117.js (harness.js·fbstub.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const W = (ms) => p.waitForTimeout(ms);
  /* ① 카드 자리·글 — 자료를 받기 전에는 안내 글, 새 읽기를 하지 않음 */
  const a = await p.evaluate(() => { S.detail = null; document.getElementById('sheet').classList.remove('on'); S.tab = 'products'; S.q = ''; localStorage.removeItem('rn-thin-sec');
    const un0 = !!S._fbCfgUn, w0 = !!(S.fb && S.fb.un); renderTabs(); renderMainNow(); const b = document.getElementById('fbumpbtn'); const m = document.getElementById('smapbtn');
    return { has: !!b, after: !!(b && m && m.nextElementSibling === b), q: b && b.classList.contains('allcard') && b.classList.contains('q'), fb: b && b.dataset.fbopen, t: b && b.querySelector('b').textContent, sub: b && b.querySelector('span').textContent,
      noRead: S._fbCfgUn === undefined || !!S._fbCfgUn === un0, noWatch: !(S.fb && S.fb.un) || w0, list: PT_SECS.some((x) => x[0] === 'pt_fbump'), page: PG_SCR.some((x) => x[0] === 'frontBump' && x[3] === 'openFrontBump') && GO_PAGES.some((x) => x[0] === 'frontBump' && /openFrontBump/.test(String(x[3]))) }; });
  ok(a.has && a.after && a.q, '상품 탭 위 카드 줄에 ⬆ 앞 페이지 올리기 카드 — 🗺 서가 지도 바로 뒤 · 같은 카드 꼴', a);
  ok(a.t === '⬆ 앞 페이지 올리기' && a.fb === '1', '카드 이름 · 누름 길 = 이미 있는 data-fbopen(openFrontBump)', a);
  ok(a.noRead && a.noWatch && a.sub === '오래된 상품을 다시 앞으로', '자료 받기 전: 카드를 그려도 설정·작업 기록 새 읽기 없음 · 안내 한 줄', a);
  ok(a.list && a.page, '📱 카드 고르기 목록(PT_SECS)에 pt_fbump · 화면 목록(PG_SCR·GO_PAGES) frontBump → openFrontBump 그대로', a);

  /* ② 이미 받은 자료가 있으면 카드 한 줄이 상태를 보임 */
  const b = await p.evaluate(() => { S.fbCfg = { auto: true }; S.fb.jobs = new Map([['j1', { state: 'done', at: '2026-11-10T01:00:00Z', doneAt: '2026-11-10T03:00:00Z' }], ['j2', { state: 'del_wait', open: true, at: '2026-11-16T01:00:00Z' }]]);
    renderMainNow(); const s1 = document.querySelector('#fbumpbtn span').textContent; S.fbCfg = { auto: false }; S.fb.jobs = new Map(); renderMainNow(); const s2 = document.querySelector('#fbumpbtn span').textContent; return { s1, s2 }; });
  ok(/자동 켜짐/.test(b.s1) && /진행 1건/.test(b.s1) && /마지막 11-10/.test(b.s1), '받은 설정·작업 기록 → 자동 켜짐 · 진행 건수 · 마지막 올린 날', b);
  ok(b.s2 === '자동 꺼짐', '자동 꺼짐 · 작업 없음', b);

  /* ③ 누르면 이미 있는 화면이 열림 */
  await p.evaluate(() => { document.getElementById('fbumpbtn').click(); }); await W(400);
  const c = await p.evaluate(() => ({ det: !!(S.detail && S.detail.fbump), on: document.getElementById('sheet').classList.contains('on'), txt: (document.getElementById('sheet').innerText || '').slice(0, 2000) }));
  ok(c.det && c.on && /앞 페이지 올리기/.test(c.txt), '카드 누름 → ⬆ 앞 페이지 올리기 화면(openFrontBump)이 열림', { det: c.det, on: c.on, txt: c.txt.slice(0, 200) });
  await p.evaluate(() => { S.detail = null; document.getElementById('sheet').classList.remove('on'); document.body.style.overflow = ''; });

  /* ④ 📱 카드 고르기 — 고르지 않으면 숨김 · 고르면 보임 */
  const d = await p.evaluate(() => { const m = document.querySelector('#main'); const set = (ids) => { S.tab = 'products'; S.ptOnly = new Set(ids); try { renderProducts(m); } finally { S.ptOnly = null; } return !!document.getElementById('fbumpbtn'); }; /* PC는 늘 전부 — 휴대폰 고르기(S.ptOnly)를 그대로 흉내 */
    const r = { off: set(['pt_map']), on: set(['pt_fbump']), need: thinNeedOf('products', ['pt_fbump']) }; renderMainNow(); return r; });
  ok(!d.off && d.on && !d.need.includes('prod') && !d.need.includes('pm'), '📱 카드 고르기: 안 고르면 숨김 · 고르면 보임 · 이 카드만 고르면 큰 자료(상품·시장 지표)를 받지 않음', d);

  ok(!errs.length, '화면 오류 없음', errs);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exitCode = bad ? 1 : 0;
});
