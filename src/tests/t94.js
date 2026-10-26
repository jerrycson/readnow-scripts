// 🔬 상품 조회수 실험 — 페이지·카드 띠·거르기·두 번 눌러 맡기기·상세·실시간 숫자
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {};
  await p.evaluate(async () => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true }); const day = (o) => new Date(Date.now() + 9 * 3600e3 - o * 864e5).toISOString().slice(0, 10); const now = new Date().toISOString();
    await db.collection('px_exp').doc('404935000').set({ lid: '404935000', on: true, state: 'done', addedAt: new Date(Date.now() - 2 * 864e5).toISOString(), before: 'x'.repeat(50), last: { state: 'done', keptScm: true, txtSame: true, pub: { kept: true }, msg: '샵매니저·공개 화면 모두 우리 그림 주소 그대로 — 셀 수 있음' }, hist: [{ at: now, op: 'add', r: '붙임' }] });
    await db.collection('px_exp').doc('404935001').set({ lid: '404935001', on: false, state: 'done', addedAt: new Date(Date.now() - 5 * 864e5).toISOString(), removedAt: now, last: { keptScm: false, txtSame: true, msg: '그림을 뺌' } });
    for (const [o, h, b] of [[0, 5, 2], [1, 3, 0], [3, 7, 1]]) await db.collection('px_views').doc('404935000_' + day(o).replace(/-/g, '')).set({ lid: '404935000', day: day(o), n: h + b, human: h, bot: b, uniq: h - 1, fromAladin: h, fromOther: b, mobile: 2, lastAt: now });
    pxInit(); });
  await p.waitForTimeout(1200);
  R.mark = await p.evaluate(() => [pxMark(S.plist.get('aladin_U215983410')), pxMark(S.plist.get('aladin_U215983411')), pxEver(S.plist.get('aladin_U215983411')), pxMark(S.plist.get('aladin_U215983412'))]);
  // 상품 탭 — 카드 띠·실험 상품만 보기 칩
  await p.evaluate(() => { S.tab = 'products'; S.q = ''; renderTabs(); renderMain(); }); await p.waitForTimeout(800);
  R.top = await p.waitForSelector('[data-pxonly]', { timeout: 4000 }).then(() => true, () => false);
  await p.click('[data-pxonly]'); await p.waitForTimeout(700);
  R.only = await p.evaluate(() => ({ rows: document.querySelectorAll('.list .prow2').length, band: document.querySelectorAll('.list .pxband').length, h: (document.querySelector('h2') || {}).textContent }));
  await p.evaluate(() => { S.q = '테스트 책'; renderMain(); }); await p.waitForTimeout(500);
  R.onlyQ = await p.evaluate(() => document.querySelectorAll('.list .prow2').length);
  await p.evaluate(() => { S.pxOnly = false; S.q = ''; renderMain(); }); await p.waitForTimeout(500);
  // 실험 페이지
  await p.evaluate(() => openPxExp()); await p.waitForTimeout(1200);
  R.page = await p.evaluate(() => { const sh = document.querySelector('#sheet'); return { t: /상품 조회수 실험/.test(sh.textContent), how: /그림이 불린 횟수/.test(sh.textContent), cards: sh.querySelectorAll('.pxcard').length, svg: sh.querySelectorAll('svg.pxbars rect').length > 10, nums: [...sh.querySelectorAll('.pxcard .pxn b')].slice(0, 3).map((b) => b.textContent), sum: sh.querySelector('#px_sum').textContent }; });
  await p.click('[data-pxf="all"]'); await p.waitForTimeout(300); R.allCards = await p.evaluate(() => document.querySelectorAll('#sheet .pxcard').length);
  // 실시간: 오늘 조회가 늘면 숫자 칸만 바뀜(카드는 그대로)
  await p.evaluate(async () => { window.__card = document.querySelector('#sheet .pxcard[data-pxid="404935000"]'); const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); await db.collection('px_views').doc('404935000_' + day.replace(/-/g, '')).set({ human: firebase.firestore.FieldValue.increment(4) }, { merge: true }); });
  await p.waitForTimeout(1200);
  R.live = await p.evaluate(() => ({ same: window.__card === document.querySelector('#sheet .pxcard[data-pxid="404935000"]'), today: document.querySelector('#sheet .pxcard[data-pxid="404935000"] .pxn b').textContent }));
  // 더하기 — 찾고 고르고 두 번 눌러 맡김
  await p.evaluate(() => { S.app.cloudUrl = 'https://cloud.test'; }); await p.click('[data-pxadd]'); await p.waitForTimeout(400); await p.fill('#px_q', '테스트 책 5'); await p.waitForTimeout(500);
  await p.check('[data-pxsel="404935005"]'); await p.waitForTimeout(200);
  await p.click('[data-pxgo1]'); await p.waitForTimeout(300);
  R.arm1 = await p.evaluate(() => ({ armed: (document.querySelector('[data-pxgo1]') || {}).textContent, n: Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp').length }));
  await p.click('[data-pxgo1]'); await p.waitForTimeout(900);
  R.arm2 = await p.evaluate(() => { const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp'); const e = (window.__FS.px_exp || {})['404935005'] || {}; return { n: C.length, op: C[0] && C[0].op, ids: C[0] && C[0].listingIds, st: C[0] && C[0].status, ask: !!e.askAt, hist: (e.hist || []).length, mark: pxMark(S.plist.get('aladin_U215983415')), before: (window.__FS.px_exp || {})['404935000'].before.length }; });
  // 끝내기 — 두 번
  await p.evaluate(() => { S.px.P.f = 'all'; pxDraw(true); }); await p.waitForTimeout(300);
  await p.click('[data-pxrm="404935000"]'); await p.waitForTimeout(200); const n1 = await p.evaluate(() => Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp' && c.op === 'remove').length);
  await p.click('[data-pxrm="404935000"]'); await p.waitForTimeout(800); const n2 = await p.evaluate(() => Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp' && c.op === 'remove').length); R.rm = [n1, n2];
  // 재고 품목 거르기
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { STK.px = 'on'; openStockView(); }); await p.waitForTimeout(1200);
  R.stock = await p.evaluate(() => ({ rows: document.querySelectorAll('#sheet .stk-row').length, chip: !!document.querySelector('#sheet [data-stk="px|on"]') }));
  await p.evaluate(() => { STK.px = 'all'; history.back(); }); await p.waitForTimeout(500);
  // 상품 전체 표
  await p.evaluate(() => openProdAll()); await p.waitForTimeout(1200);
  R.all = await p.evaluate(() => ({ f: /조회수 실험/.test(document.querySelector('#sheet').textContent), band: document.querySelectorAll('#sheet .pxband').length }));
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  // 상품 상세
  await p.evaluate(() => openProduct('aladin_U215983410')); await p.waitForTimeout(1200);
  R.pd = await p.evaluate(() => { const x = document.querySelector('#sheet .pxpd'); return x ? x.textContent.replace(/\s+/g, ' ').slice(0, 120) : null; });
  await p.click('#sheet .pxpd [data-pxgo]'); await p.waitForTimeout(900); R.pdGo = await p.evaluate(() => !!(S.detail && S.detail.pxexp) && !!document.querySelector('#sheet .pxcard.focus'));
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(400); await p.evaluate(() => { history.back(); }); await p.waitForTimeout(400);
  // 경영 탭 카드 · 기능 찾기 · 홈 카드
  await p.evaluate(() => { S.tab = 'biz'; renderTabs(); renderMain(); }); await p.waitForTimeout(1200);
  R.biz = await p.evaluate(() => !!document.querySelector('#main [data-gopage="pxExp"]') && FEAT.some((f) => /조회수 실험/.test(f.t)) && !!WIDGETS.go_pxExp);
  console.log(JSON.stringify(R, null, 1)); console.log('errs', errs.join(' | '));
  const ok = R.mark.join() === 'true,false,true,false' && R.top && R.only.rows === 1 && R.only.band === 1 && R.onlyQ === 1 && R.page.t && R.page.how && R.page.cards === 1 && R.page.svg && R.page.nums[0] === '5' && R.allCards === 2 && R.live.same && R.live.today === '9' && R.arm1.n === 0 && /한 번 더/.test(R.arm1.armed) && R.arm2.n === 1 && R.arm2.op === 'add' && String(R.arm2.ids) === '404935005' && R.arm2.st === 'queued' && R.arm2.ask && R.arm2.mark && R.arm2.before === 50 && R.rm[0] === 0 && R.rm[1] === 1 && R.stock.rows === 2 && R.stock.chip && R.all.f && R.all.band >= 1 && R.pd && /오늘 사람 조회 9/.test(R.pd) && R.pdGo && R.biz && !errs.length;
  console.log(ok ? '✓ t94 통과' : '❌ t94 실패');
});
