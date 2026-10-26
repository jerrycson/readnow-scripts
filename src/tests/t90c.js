// 🧯 문제 상품 — 시험 상품 통계 빼기·카드 띠·맨 위 고정·알림·기록(생김→풀림)·문제 페이지·두 번 눌러 시험 표시 풀기
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ok = []; const chk = (name, v) => { ok.push([name, !!v]); };
  const r1 = await p.evaluate(async () => { S.leader = true; for (const k of ['aladin_U215983411','aladin_U215983415','aladin_U215983417']) { const l0 = S.plist.get(k); if (l0) l0.registeredAt = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }  const before = prodInv(); const t = new Date().toISOString();
    await db.collection('reg_items').doc('rt1').set({ test: true, stage: 'done', confirmedAt: t, createdAt: t, final: { title: '테스트 책 1' }, result: { state: 'live', listingId: '404935001', usedCode: 'U215983411' } });
    await db.collection('reg_items').doc('rt2').set({ test: true, stage: 'done', confirmedAt: t, createdAt: t, final: { title: '테스트 책 5' }, result: { state: 'live', listingId: '404935005', usedCode: 'U215983415' } });
    await new Promise((r) => setTimeout(r, 1200)); const l = S.plist.get('aladin_U215983411'); const after = prodInv(); const A = []; probAlerts((lv, t0, k) => A.push([lv, t0, k]));
    const all = [...S.plist.values()]; const pin = probPin(all); const card = prodCard2(l);
    return { isT: isTestL(l), isS: isStock(l), n0: before.n, n1: after.n, prob: probAll().size, kinds: [...probAll().values()].map((e) => e.P.map((x) => x.k).join('+')), A, pin0: pin.slice(0, 2).map((x) => x.id), card: /probband t/.test(card) && /probc/.test(card), stat: [...plStat()].length, total: S.plist.size }; });
  console.log(JSON.stringify(r1));
  chk('시험 판별', r1.isT && !r1.isS); chk('재고 통계에서 빠짐', r1.n1 === r1.n0 - 2); chk('문제 2개', r1.prob === 2 && r1.kinds.every((k) => k === 'test')); chk('알림', r1.A.some((a) => a[2] === 'prob' && /시험 상품 2개/.test(a[1])));
  chk('맨 위 고정', r1.pin0.includes('aladin_U215983411') && r1.pin0.includes('aladin_U215983415')); chk('카드 띠', r1.card); chk('plStat', r1.stat === r1.total - 2);
  // 상품 탭 맨 위 · 재고 품목 머리 단추·맨 위 · 목록 창 맨 위
  const r2 = await p.evaluate(async () => { document.querySelector('[data-tab="products"]').click(); await new Promise((r) => setTimeout(r, 300)); renderMainNow(); await new Promise((r) => setTimeout(r, 200)); const top = document.querySelector('#main .probtop'); const topOk = !!(top && top.classList.contains('on') && top.querySelector('[data-pid="aladin_U215983411"]'));
    openStockView(); await new Promise((r) => setTimeout(r, 1000)); const sh = document.getElementById('sheet'); const first = sh.querySelector('.stk-row [data-pid]'); const hd = sh.querySelector('.sh .problink.on'); const sum = sh.querySelector('.bt-sum').textContent;
    history.back(); await new Promise((r) => setTimeout(r, 300)); openProdList({ title: '시험 목록', rows: [...S.plist.values()], sort: 't' }); await new Promise((r) => setTimeout(r, 300)); const f2 = sh.querySelector('.list [data-pid]'); const hd2 = sh.querySelector('.sh .problink.on');
    return { topOk, first: first && first.dataset.pid, hd: !!hd, sum, f2: f2 && f2.dataset.pid, hd2: !!hd2 }; });
  console.log(JSON.stringify(r2));
  chk('상품 탭 맨 위 칸', r2.topOk); chk('재고 품목 맨 위', /U21598341[15]/.test(r2.first || '')); chk('재고 품목 머리 🧯', r2.hd); chk('재고 합계 시험 뺌', /시험 2개 뺌/.test(r2.sum)); chk('목록 창 맨 위', /U21598341[15]/.test(r2.f2 || '')); chk('목록 창 머리 🧯', r2.hd2);
  // 기록: 생김
  await p.waitForTimeout(3500);
  const r3 = await p.evaluate(async () => { const d = (window.__FS.prd_problems || {})['test__aladin_U215983411']; openProblems(); await new Promise((r) => setTimeout(r, 300)); const sh = document.getElementById('sheet'); return { d, cur: sh.querySelectorAll('.probcur').length, logs: sh.querySelectorAll('.problog').length, del: !!sh.querySelector('[data-probdel="aladin_U215983411"]'), unt: !!sh.querySelector('[data-probuntest="rt2"]') }; });
  console.log(JSON.stringify(r3));
  chk('기록 생김', r3.d && r3.d.open === true && (r3.d.log || []).some((x) => x.ev === 'open')); chk('문제 페이지', r3.cur === 2 && r3.logs >= 2 && r3.del && r3.unt);
  // 두 번 눌러 시험 표시 풀기(rt2) · 상품 삭제 상태로(rt1) → 풀림 · 원래대로
  const r4 = await p.evaluate(async () => { const b = document.querySelector('[data-probuntest="rt2"]'); b.click(); const armed = b.dataset.arm === '1'; const after1 = (window.__FS.reg_items.rt2 || {}).test; b.click(); await new Promise((r) => setTimeout(r, 600));
    const l = S.plist.get('aladin_U215983411'); S.plist.set(l.id, { ...l, status: '삭제', active: false }); bump('p'); probChanged(); await new Promise((r) => setTimeout(r, 3600));
    const P = window.__FS.prd_problems; const all = [...S.plist.values()]; return { armed, after1, rt2: window.__FS.reg_items.rt2.test, d1: P['test__aladin_U215983411'], d2: P['test__aladin_U215983415'], prob: probAll().size, pin: probPin(all) === all, band: prodCard2(S.plist.get('aladin_U215983411')), page: document.querySelectorAll('#sheet .probcur').length }; });
  console.log(JSON.stringify({ ...r4, band: r4.band.slice(0, 0) }));
  chk('두 번 눌러야', r4.armed && r4.after1 === true && r4.rt2 === false); chk('풀림 기록(지움)', r4.d1 && r4.d1.open === false && /지워짐/.test(r4.d1.how || '') && r4.d1.log.some((x) => x.ev === 'close'));
  chk('풀림 기록(시험 풂)', r4.d2 && r4.d2.open === false && /시험 표시가 풀림/.test(r4.d2.how || '') && r4.d2.log.some((x) => x.ev === 'act')); chk('원래대로', r4.prob === 0 && r4.pin && !/probc/.test(r4.band) && /probband t off/.test(r4.band)); chk('페이지 갱신', r4.page === 0);
  // 🗑 삭제 못 함 판정(이미 있는 DEL_ST)
  const r5 = await p.evaluate(async () => { S.cmdAll = S.cmdAll || new Map(); S.cmdAll.set('c1', { id: 'c1', type: 'regDel', status: 'done', createdAt: new Date().toISOString(), items: [{ listingKey: 'aladin_U215983412', listingId: '404935002' }], results: { aladin_U215983412: { state: 'refused', msg: '대조 안 맞음' } } }); probChanged(); return { k: (probAll().get('aladin_U215983412') || { P: [] }).P.map((x) => x.k) }; });
  console.log(JSON.stringify(r5)); chk('삭제 못 함', r5.k.includes('del'));
  console.log(ok.map(([n, v]) => (v ? '✓ ' : '✗ ') + n).join(' | '));
  console.log(ok.every((x) => x[1]) && !errs.length ? '✓ t90 통과' : '❌ t90 실패 ' + errs.join(' | '));
});
