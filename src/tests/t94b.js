// 🔬 조회수 실험 10/26 밤 — 다른 브라우저(추정)·우리 기기(뺌) 표시 · 개수 제한 없음(50개씩 나눔) · 수동 일괄 처리 그룹 → 실험 페이지 그룹 칸 · 중복 상품 한 번만 · 그룹 끝내기 남김 규칙 · 우리 기기 등록 그림
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {};
  await p.evaluate(async () => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true }); const day = (o) => new Date(Date.now() + 9 * 3600e3 - o * 864e5).toISOString().slice(0, 10); const now = new Date().toISOString();
    const base = S.plist.get('aladin_U215983410'); for (let i = 0; i < 120; i++) { const uc = 'U9' + String(1000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: String(500000000 + i), title: '많은 책 ' + i, status: '판매중', active: true }); }
    await db.collection('px_exp').doc('404935000').set({ lid: '404935000', on: true, state: 'done', addedAt: new Date(Date.now() - 2 * 864e5).toISOString(), last: { state: 'done', keptScm: true, txtSame: true, pub: { kept: true } } }); /* src 없음 = 옛 샘플(개별) */
    await db.collection('px_views').doc('404935000_' + day(0).replace(/-/g, '')).set({ lid: '404935000', day: day(0), n: 12, human: 6, bot: 1, ours: 5, ck: 4, noCk: 2, uniq: 5, bs: ['aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc'], fromAladin: 12, mobile: 3, lastAt: now });
    await db.collection('px_views').doc('404935000_' + day(1).replace(/-/g, '')).set({ lid: '404935000', day: day(1), n: 4, human: 4, bs: ['aaaaaaaaaa', 'dddddddddd'], ours: 1, lastAt: now });
    await db.collection('px_views').doc('404935000_' + day(3).replace(/-/g, '')).set({ lid: '404935000', day: day(3), n: 2, human: 2, lastAt: now }); /* 쿠키로 세기 전 기록(bs 없음) → '+' */
    pxInit(); });
  await p.waitForTimeout(1000);
  // 1) 실험 페이지 숫자 — 오늘 브라우저 3 · 30일 브라우저 4+ (합집합) · 우리 기기 6(뺌)
  await p.evaluate(() => openPxExp()); await p.waitForTimeout(1200);
  R.nums = await p.evaluate(() => { const c = document.querySelector('#sheet .pxcard[data-pxid="404935000"]'); const t = c.textContent.replace(/\s+/g, ' '); return { today: /오늘6사람 · 브라우저 3개/.test(t), ub30: /다른 브라우저\(추정\)4\+/.test(t), ours: /우리 기기\(뺌\)6/.test(t), ib: !!c.querySelector('[data-ipop="pxwho"]'), sum: document.querySelector('#px_sum').textContent.replace(/\s+/g, ' ') }; });
  await p.click('#sheet .pxcard [data-ipop="pxwho"]'); await p.waitForTimeout(300); R.pop = await p.evaluate(() => { const d = document.querySelector('.rn-ipop'); return d ? /왜 추정인가/.test(d.textContent) && /우리 기기 빼기/.test(d.textContent) : false; });
  await p.mouse.click(5, 300); await p.waitForTimeout(200); R.popClosed = await p.evaluate(() => !document.querySelector('.rn-ipop'));
  // 2) 개수 제한 없음 — 12개 고르기 → 맡긴 일 1개(12개) · 제한 문구 없음
  await p.click('[data-pxadd]'); await p.waitForTimeout(300); await p.fill('#px_q', '많은 책'); await p.waitForTimeout(500);
  const boxes = await p.$$('#px_res [data-pxsel]'); for (const bx of boxes.slice(0, 12)) await bx.check(); await p.waitForTimeout(200);
  R.sel = await p.evaluate(() => ({ n: S.px.P.sel.size, txt: document.querySelector('.pxsel').textContent.slice(0, 12), no10: !/최대 10개/.test(document.querySelector('#sheet').textContent) }));
  await p.click('[data-pxgo1]'); await p.waitForTimeout(200); await p.click('[data-pxgo1]'); await p.waitForTimeout(900);
  R.q12 = await p.evaluate(() => { const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp'); return { n: C.length, ids: C.map((c) => c.listingIds.length), src: (window.__FS.px_exp['500000000'] || {}).src }; });
  // 3) pxQueue 직접 — 120개 중 앞 일이 진행 중인 12개는 건너뜀 → 108개 = 50·50·8 세 묶음
  R.q120 = await p.evaluate(async () => { const before = Object.keys(window.__FS.shp_cmds || {}).length; const ids = Array.from({ length: 120 }, (_, i) => String(500000000 + i)); const r = await pxQueue('remove', ids); const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'pxExp' && c.op === 'remove'); return { r: r && { n: r.n, parts: r.parts, skipped: r.skipped }, sizes: C.map((c) => c.listingIds.length).sort((a, b) => b - a), parts: C.map((c) => c.part).sort(), added: Object.keys(window.__FS.shp_cmds).length - before }; });
  // 앞 일이 끝난 것으로(시험 뒷정리)
  await p.evaluate(async () => { for (const [id, c] of Object.entries(window.__FS.shp_cmds || {})) if (c.type === 'pxExp') await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); S.px.cmdBy.forEach((c) => { c.status = 'done'; c._local = 0; }); });
  await p.waitForTimeout(600);
  // 4) 수동 일괄 처리 그룹 화면 → '🔬 조회수 실험으로 보내기' (두 번)
  await p.evaluate(() => history.back()); await p.waitForTimeout(400);
  await p.evaluate(() => { S.prBatches = [{ id: 'gA', name: '시험 그룹 A', lastKeys: ['aladin_U215983410', 'aladin_U215983411', 'aladin_U215983412', 'aladin_U215983413', 'aladin_U215983414'] }, { id: 'gB', name: '시험 그룹 B', lastKeys: ['aladin_U215983412', 'aladin_U215983415'] }]; S.batchId = 'gA'; S.batchRes = null; S.batchSt = { picks: {}, decided: {}, start: {} }; S.batchMeta = {}; S.batchC = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹 A' }; openBatch(S.batchC); });
  await p.waitForTimeout(800);
  R.bar = await p.evaluate(() => !!document.querySelector('#sheet .pxbatchbar [data-pxsend]'));
  await p.click('#sheet [data-pxsend]'); await p.waitForTimeout(200); R.sendArm = await p.evaluate(() => ({ armed: /한 번 더/.test(document.querySelector('#sheet [data-pxsend]').textContent), g: !!(window.__FS.px_exp_groups || {}).gA }));
  await p.click('#sheet [data-pxsend]'); await p.waitForTimeout(900);
  R.sent = await p.evaluate(() => { const g = (window.__FS.px_exp_groups || {}).gA || {}; return { lids: (g.lids || []).slice().sort(), name: g.name, on: g.on, hist: (g.hist || []).length, noCmd: !Object.values(window.__FS.shp_cmds).some((c) => c.gid === 'gA'), bar: document.querySelector('#sheet .pxbatchbar').textContent.includes('보냄') }; });
  // 다시 보내도 덧붙기만(지우지 않음) — 상품 하나 빠진 결과로
  await p.evaluate(async () => { S.batchRes = [{ l: S.plist.get('aladin_U215983410') }]; await pxBatchSend(); }); await p.waitForTimeout(400);
  R.resend = await p.evaluate(() => new Set(window.__FS.px_exp_groups.gA.lids || []).size);
  await p.evaluate(async () => { S.batchId = 'gB'; S.batchRes = null; S.batchC = { ...S.batchC, name: '시험 그룹 B' }; await pxBatchSend(); }); await p.waitForTimeout(600);
  // 5) 실험 페이지 그룹 칸
  await p.evaluate(() => openPxExp('g:gA')); await p.waitForTimeout(1200);
  R.grp = await p.evaluate(() => { const d = document.querySelector('#sheet details[data-pxgid="gA"]'); return d ? { open: d.open, t: d.querySelector('.pxgsum').textContent.replace(/\s+/g, ' '), rows: d.querySelectorAll('.pxgrow').length, other: /다른 곳에서 이미 실험 중 — 개별로 더한 실험/.test(d.textContent), notSale: /판매 중 아님/.test(d.textContent), btn: d.querySelector('[data-pxgadd]').textContent } : null; });
  await p.click('#sheet [data-pxgadd="gA"]'); await p.waitForTimeout(200); await p.click('#sheet [data-pxgadd="gA"]'); await p.waitForTimeout(1000);
  R.gadd = await p.evaluate(() => { const C = Object.values(window.__FS.shp_cmds).filter((c) => c.gid === 'gA'); const g = window.__FS.px_exp_groups.gA; return { n: C.length, ids: C[0] && C[0].listingIds.slice().sort(), gname: C[0] && C[0].gname, on: g.on, src: (window.__FS.px_exp['404935001'] || {}).src, h: g.hist.map((x) => x.op).join(',') }; });
  // 그룹 B: 404935002는 그룹 A가 붙이는 중 → 건너뜀(두 번 안 붙임)
  await p.evaluate(async () => { S.px.P.gopen.add('gB'); pxDraw(true); }); await p.waitForTimeout(300);
  R.gB1 = await p.evaluate(() => { const X = pxGrpPlan(S.px.grp.get('gB')); return { add: X.add, run: X.run }; });
  // 클라우드가 A를 끝냈다고 치고(on · src g:gA) → B에는 '다른 곳에서 이미 실험 중 — 그룹 「시험 그룹 A」'
  await p.evaluate(async () => { for (const [id, c] of Object.entries(window.__FS.shp_cmds)) if (c.gid === 'gA') { await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); for (const k of c.listingIds) await db.collection('px_exp').doc(k).set({ on: true, addedAt: new Date().toISOString() }, { merge: true }); } S.px.cmdBy.forEach((c) => { c.status = 'done'; c._local = 0; }); pxChanged(); });
  await p.waitForTimeout(1200);
  R.gB2 = await p.evaluate(() => { const X = pxGrpPlan(S.px.grp.get('gB')); const d = document.querySelector('#sheet details[data-pxgid="gB"]'); return { add: X.add, other: X.other, txt: d ? /다른 곳에서 이미 실험 중 — 그룹 「시험 그룹 A」/.test(d.textContent) : false }; });
  await p.click('#sheet [data-pxgadd="gB"]'); await p.waitForTimeout(200); await p.click('#sheet [data-pxgadd="gB"]'); await p.waitForTimeout(900);
  R.gBadd = await p.evaluate(() => { const C = Object.values(window.__FS.shp_cmds).filter((c) => c.gid === 'gB'); return C.map((c) => c.listingIds.join(',')); });
  await p.evaluate(async () => { for (const [id, c] of Object.entries(window.__FS.shp_cmds)) if (c.gid === 'gB') { await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); for (const k of c.listingIds) await db.collection('px_exp').doc(k).set({ on: true, addedAt: new Date().toISOString() }, { merge: true }); } S.px.cmdBy.forEach((c) => { c.status = 'done'; c._local = 0; }); pxChanged(); });
  await p.waitForTimeout(1000);
  // 6) 그룹 A 끝내기 — 404935000(개별)·404935002(B도 켜짐)는 남기고 001·004만 뺌
  R.gArm = await p.evaluate(() => { const X = pxGrpPlan(S.px.grp.get('gA')); return { rm: X.rm.slice().sort(), keep: X.keep.slice().sort() }; });
  await p.click('#sheet [data-pxgrm="gA"]'); await p.waitForTimeout(200); await p.click('#sheet [data-pxgrm="gA"]'); await p.waitForTimeout(900);
  R.gArm2 = await p.evaluate(() => { const C = Object.values(window.__FS.shp_cmds).filter((c) => c.gid === 'gA' && c.op === 'remove'); return { ids: C.map((c) => c.listingIds.slice().sort().join(',')), on: window.__FS.px_exp_groups.gA.on }; });
  // 7) 그 뒤 그룹 B를 끝내면 404935002(A가 붙였지만 A는 꺼짐)도 B가 넘겨받아 뺌
  await p.evaluate(async () => { for (const [id, c] of Object.entries(window.__FS.shp_cmds)) if (c.status !== 'done') await db.collection('shp_cmds').doc(id).set({ status: 'done' }, { merge: true }); S.px.cmdBy.forEach((c) => { c.status = 'done'; c._local = 0; }); pxChanged(); }); await p.waitForTimeout(800);
  R.gBrm = await p.evaluate(() => { const X = pxGrpPlan(S.px.grp.get('gB')); return X.rm.slice().sort(); });
  // 8) 우리 기기 등록 그림
  R.ping = await p.evaluate(() => { const got = []; const I = window.Image; window.Image = function () { const o = {}; Object.defineProperty(o, 'src', { set: (v) => got.push(v) }); return o; }; try { localStorage.removeItem('rn-pxself-at'); localStorage.setItem('rn-device', '사무실1'); pxSelfPing(); pxSelfPing(); } finally { window.Image = I; } return got; });
  // 9) 기능 찾기
  R.feat = await p.evaluate(() => FEAT.filter((f) => /조회수 실험으로 보내기|우리 기기 조회 빼기/.test(f.t)).length);
  console.log(JSON.stringify(R, null, 1)); console.log('errs', errs.join(' | '));
  const ok = R.nums.today && R.nums.ub30 && R.nums.ours && R.nums.ib && /우리 기기 오늘 5 · 7일 6번\(뺌\)/.test(R.nums.sum) && R.pop && R.popClosed && R.sel.n === 12 && R.sel.no10 && R.q12.n === 1 && R.q12.ids[0] === 12 && R.q12.src === 'manual'
    && R.q120.r.n === 108 && R.q120.r.skipped === 12 && R.q120.r.parts === 3 && R.q120.sizes.join() === '50,50,8' && R.q120.parts.join() === '1/3,2/3,3/3' && R.bar && R.sendArm.armed && !R.sendArm.g
    && R.sent.lids.join() === '404935000,404935001,404935002,404935003,404935004' && R.sent.name === '시험 그룹 A' && R.sent.on === false && R.sent.noCmd && R.sent.bar && R.resend === 5
    && R.grp && R.grp.open && R.grp.other && R.grp.notSale && /\(3개\)/.test(R.grp.btn) && R.gadd.n === 1 && R.gadd.ids.join() === '404935001,404935002,404935004' && R.gadd.gname === '시험 그룹 A' && R.gadd.on === true && R.gadd.src === 'g:gA' && R.gadd.h === 'import,import,add'
    && R.gB1.add.join() === '404935005' && R.gB1.run.join() === '404935002' && R.gB2.add.join() === '404935005' && R.gB2.other.join() === '404935002' && R.gB2.txt && R.gBadd.join() === '404935005'
    && R.gArm.rm.join() === '404935001,404935004' && R.gArm.keep.join() === '404935000,404935002' && R.gArm2.ids.join() === '404935001,404935004' && R.gArm2.on === false && R.gBrm.join() === '404935002,404935005'
    && R.ping.length === 1 && /^https:\/\/cloud\.test\/px\/me\.gif\?d=%EC%82%AC%EB%AC%B4%EC%8B%A41&_=\d+$/.test(R.ping[0]) && R.feat === 2 && !errs.length;
  console.log(ok ? '✓ t94b 통과' : '❌ t94b 실패');
});
