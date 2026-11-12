let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  await p.evaluate(require('./seed.js'));
  const r = await p.evaluate(async () => { const A = { sum: { list_sp: { id: 'list_sp', label: '검색 목록 SP 읽기', goal: '목록 줄마다 SP', unit: '줄', st: 'ok', champ: { id: 'lbl:세일즈포인트', label: "이름표 '세일즈포인트'", r: 0.97, n: 400, eff: 11, recent: 1 }, cands: [{ id: 'base', label: '기본 길', st: 'arch', r: 0.1, n: 30 }], arch: 1, last: { at: '2026-11-12T10:00:00Z', kind: '채택', t: '🔄 바꿈' } } }, at: '2026-11-12T10:00:00Z' };
    db.collection('app_settings').doc('adapt_goals').set(A); S.tab = 'research'; renderTabs(); renderMainNow(); afterRender(); await new Promise((r) => setTimeout(r, 300));
    const card = [...document.querySelectorAll('#main .np-c, #main [data-navx], #main button, #main a')].find((b) => /엔진 적응 상태/.test(b.textContent)); if (card) card.click(); else openAdaptSt(); await new Promise((r) => setTimeout(r, 600));
    return { card: !!card, txt: (document.querySelector('#sheet') || {}).innerText || '' }; });
  ok(r.card, '연구 탭에 🔄 엔진 적응 상태 카드'); ok(/검색 목록 SP 읽기/.test(r.txt) && /세일즈포인트/.test(r.txt) && /97%/.test(r.txt) && /보관/.test(r.txt), '화면에 지금 방법·성공률·최근 바뀜·대체 후보', r.txt.slice(0, 500));
  await p.evaluate(() => history.back()); await p.waitForTimeout(300); ok(await p.evaluate(() => !S.ags), '닫으면 받은 요약 버림');
}).then(() => { console.log(bad ? '❌ ' + bad : '✓ 모두 통과'); });
