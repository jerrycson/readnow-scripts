// tBKFOLD4_1117 — (정범님 11/17 I-1117-1318-08 · 설계안 BKFOLD_DESIGN_1117 판 ④) 📁 묶음 실행기 — 지표 모두 갱신 · 모두 다시 계산 · 매일 자동 켜고 끄기(+되돌리기) · 모두 적용 끄기 — 가격을 바꾸는 코드 0줄
//  ① 순수 셈: 실행 장부 최근 20개 · 확인 창 사이 바뀐 계획 · 결과 세기 · 지표 진행 숫자 · 24시간 남은 때
//  ② 화면: 화면 없는 셈 = 그룹 화면 셈 · 지표 명령 문서 = 그룹 화면 📈 단추 문서(+묶음 표식) · 24시간 건너뜀 · 취소하면 쓰기 0 · 서버를 못 읽으면 시작 안 함
//        다른 기기 실행 중이면 거절·구성 바꾸기·그룹 지우기 막음 · 멈춘 실행 넘겨받기 · 멈추기 · 자동 켜기 → 되돌리기(그 뒤 손으로 바꾼 것은 그대로)
//        적용 끄기 = 세 칸만(다른 돈 설정 그대로) · 브라우저 창 없음 · 가격 결정 문서 안 씀
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD4_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const blk = cut('/* (판 ④) 묶음 실행 장부 — 순수 함수', '/* ◆bkfold 끝 */');
  const F = new Function(blk + '\nreturn { BKF_RUNMAX, bkfRunsTrim, bkfPlanDiff, bkfRunSum };')();
  const R = {}; for (let i = 0; i < 21; i++) R['r' + i] = { op: 'recalc', at: '2026-11-17T0' + Math.floor(i / 10) + ':' + String(i % 10).padStart(2, '0') + ':00Z' }; R.rN = null;
  const tr = F.bkfRunsTrim(R); ok(Object.keys(tr).length === 20 && !tr.r0 && tr.r20 && !('rN' in tr), '실행 장부는 최근 20개만(가장 옛것부터 빠짐 · 빈 칸 버림)', Object.keys(tr));
  const D = F.bkfPlanDiff([{ gid: 'a', name: '가', skip: null }, { gid: 'b', name: '나', skip: null }, { gid: 'c', name: '다', skip: 'cool' }], [{ gid: 'a', name: '가', skip: null }, { gid: 'b', name: '나', skip: 'busy' }, { gid: 'c', name: '다', skip: null }, { gid: 'd', name: '라', skip: null }]);
  ok(D.length === 3 && D.find((x) => x.gid === 'b').to === 'busy' && D.find((x) => x.gid === 'c').to === null && D.find((x) => x.gid === 'd').t === 'new', '확인 창 사이 바뀜 = 새로 들어옴·이제 건너뜀·이제 함', D);
  ok(F.bkfPlanDiff([{ gid: 'a', skip: null }], [{ gid: 'b', skip: null }]).map((x) => x.t).sort().join() === 'gone,new', '빠진 그룹도 찾음');
  const S1 = F.bkfRunSum({ res: { a: { st: 'ok' }, b: { st: 'skip' }, c: { st: 'fail' }, d: { st: 'ok' } } }); ok(S1.ok === 2 && S1.skip === 1 && S1.fail === 1, '결과 세기', S1);
  const ex = cut('/* ◆bqexec 시작', '/* ◆bqexec 끝 */'); const E = new Function('const db = null, S = {}; ' + ex.replace(/async function bqCtx[\s\S]*$/, '') + '\nreturn { bMetProg, bMetCoolLeft };')();
  const P = E.bMetProg({ status: 'running', keys: ['a', 'b', 'c'], doneN: 5, ok: 2, fail: 1 }); ok(P.tot === 3 && P.i === 3 && P.ok === 2 && P.fail === 1, '지표 진행 숫자(넘치지 않음 · 그룹 화면 띠와 같은 셈)', P);
  ok(E.bMetCoolLeft({ lastMetricsReqAt: new Date(Date.now() - 3600e3).toISOString() }) > 22 * 3600e3 && E.bMetCoolLeft({ lastMetricsReqAt: new Date(Date.now() - 25 * 3600e3).toISOString() }) <= 0 && E.bMetCoolLeft({}) === 0, '24시간 남은 때');
  const io = cut('/* ── (판 ④ bkfold1) 📁 묶음 실행기', '/* ◆bkfold-io 끝 */'); const NEW = ex + blk + io;
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창(alert·confirm·prompt) 없음 — 웹앱 확인 창 ask만');
  ok(!/prd_price_decisions'\)\.(doc|add)\(/.test(NEW) && (NEW.match(/collection\('prd_price_decisions'\)/g) || []).length === 1 && /collection\('prd_price_decisions'\)\.where\(/.test(NEW), '가격 결정 문서는 읽기 한 곳만(쓰기 0)');
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음');
  ok(!/applyPrice|setPrice|price_actions'\)\.(doc|add)/.test(NEW), '가격 바꾸는 길을 부르지 않음');
  const names = ['bkfRunRef', 'bkfRunId', 'bkfDev', 'bkfClean', 'bkfGl', 'bkfLedger', 'bkfLock', 'bkfBeat', 'bkfGate', 'bkfResSave', 'bkfUnlock', 'bkfStop', 'bkfTake', 'bkfLog', 'bkfPre', 'bkfAsk', 'BKF_BUSY', 'bkfAutoOp', 'BKF_OPS', 'bkfRun', 'bkfStopAsk', 'bkfTakeAsk', 'bkfDelOk', 'bkfRunListen', 'bkfRunUnlisten', 'bkfMetWatch', 'bkfRunPaint', 'bkfActHtml', 'BKF_RUNMAX', 'bkfRunsTrim', 'bkfPlanDiff', 'bkfRunSum', 'bMetCoolLeft', 'bMetricsSend', 'bMetProg', 'batchSetOnMany', 'bqSrvGet', 'bqSrvFold', 'bqSrvWait', 'bqCtx'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup);
  ok((T.match(/a\.decision !== 'batch' \|\| !a\.at \|\| v\.approvalState === 'cancelled'/g) || []).length === 1, '서버 확정 겹치기 셈은 한 곳(bqSrvFold)');
  ok(/async function batchSetOn\(id, on, name\) \{ return batchSetOnMany\(\[id\], on, \[name\]\); \}/.test(T), '그룹 하나 켜고 끄기도 같은 길(batchSetOnMany)'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD4_1117 ${bad}개 실패` : '✓ tBKFOLD4_1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await W(p, 500);
  const fid = await p.evaluate(async () => { window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); }; window.prompt = () => null;
    window.__AK = []; window.__ANS = true; window.confirm = (m) => { window.__AK.push(String(m)); return window.__ANS; }; if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 8; i++) { const uc = 'U4400000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(505936000 + i), title: '더한 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중', '하'][i % 4], status: '판매중', active: true, sku: ['AAA_hd', 'BBB', 'CCC_ms'][i % 3], registeredAt: '2026-09-0' + (i + 1) + 'T09:00:00', bookId: 'by' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 9000 + n * 900, pubDate: String(1995 + n) + '-03-01' });
      if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: l.price - 400 + n * 60, sellerCode: '1', listingId: '9' + n }, { usedCode: l.usedCode, grade: l.grade, price: l.price, sellerCode: '996008', listingId: l.listingId }], usedTotal: n + 1, salesPoint: n * 37, lastCheckedAt: new Date().toISOString() }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const now = new Date().toISOString(); const put = (id, name, c, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, ...c, name }, createdAt: now, lastRunAt: now, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, ...(x || {}) });
    await put('gA', '그룹 가', { pmin: 5000, pmax: 9000, recentDays: 0 }); await put('gB', '그룹 나', { pmin: 9001, pmax: 30000, recentDays: 0 }); await put('gC', '그룹 다', { pmax: 4999, recentDays: 0 }); await put('gZ', '그룹 보관', { pmin: 1, recentDays: 0 }, { archived: true });
    await db.collection('prd_system').doc('pricing').set({ batchOff: { gX: true }, minPrice: 1234, mode: 'manual' });
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gZ'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '실행 시험' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['gA', 'gB', 'gC', 'gZ'] }); return a.fid; });
  const until = async (fn, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  const FS = (n, id) => p.evaluate(([n, id]) => JSON.parse(JSON.stringify(((window.__FS || {})[n] || {})[id] || null)), [n, id]);
  const nW = () => p.evaluate(() => (window.__FSW || []).length);
  const run = (op, arg) => p.evaluate(async ([fid, op, arg]) => { window.__TL = []; window.__AK = []; await bkfRun(fid, op, arg); return { tl: window.__TL.slice(), ak: window.__AK.slice() }; }, [fid, op, arg]);
  /* ⓐ 화면 없는 셈 = 그룹 화면 셈 */
  await p.evaluate(() => openBatchGroup('gA')); const scr = await until(() => S.batchId === 'gA' && Array.isArray(S.batchRes) && S.batchRes.length && document.querySelector('#b_metrics') ? S.batchRes.map((x) => ['aladin_' + x.l.usedCode, !!x.out, x.target ?? null]) : null, 100);
  const hd = await p.evaluate(async () => { const C = await bqCtx('gA', { dry: true }); return C.err ? C : C.R.map((x) => [C.keyOf(x), !!x.out, x.target ?? null]); });
  ok(scr && Array.isArray(hd) && hd.length === scr.length && JSON.stringify(hd) === JSON.stringify(scr) && hd.length >= 3, `화면 없는 셈(bqCtx) = 그룹 화면 셈 — 상품 ${scr && scr.length}개 · 빠짐 표시 · 목표가까지 같음`, { scr: scr && scr.slice(0, 4), hd: Array.isArray(hd) ? hd.slice(0, 4) : hd });
  /* 그룹 다 화면의 📈 단추로 맡김 → 문서 모양을 묶음 쪽과 견줌(그룹 다는 그 뒤 24시간 건너뜀) */
  await p.evaluate(async () => { history.back(); await new Promise((r) => setTimeout(r, 300)); openBatchGroup('gC'); });
  await until(() => S.batchId === 'gC' && Array.isArray(S.batchRes) && document.querySelector('#b_metrics'), 100); await p.locator('#b_metrics').click();
  const scrDoc = await until(() => { const v = Object.values((window.__FS || {}).shp_cmds || {}).find((x) => x.batchId === 'gC'); return v ? JSON.parse(JSON.stringify(v)) : null; }, 60);
  ok(scrDoc && scrDoc.type === 'metrics' && scrDoc.label === '그룹: 그룹 다' && !('foldId' in scrDoc), '그룹 화면 📈 단추가 같은 함수(bMetricsSend)로 맡김 — 묶음 표식 없음', scrDoc);
  await p.evaluate(async (fid) => { history.back(); await new Promise((r) => setTimeout(r, 300)); openBkfold(fid); await new Promise((r) => setTimeout(r, 300)); }, fid);
  const act = await until(() => { const a = document.querySelector('#bkf_scr #bkf_act'); return a && a.querySelectorAll('[data-bkfrun]').length === 5 ? a.textContent : null; }, 60);
  ok(act && /가격은 바꾸지 않습니다/.test(act) && /켜진 그룹 \d\/4/.test(act) && /매일 자동 지표 0\/4/.test(act), '묶음 화면 「▶ 한꺼번에」 = 단추 다섯 · 켜진·꺼진·매일 자동 수 · 가격은 안 바꾼다는 말', (act || '').slice(0, 200));
  /* ⓑ 취소하면 쓰기 0 */
  let w0 = await nW(); await p.evaluate(() => { window.__ANS = false; }); let r = await run('metrics');
  ok((await nW()) === w0 && r.ak.length === 1, '확인 창에서 취소 → 쓰기 0', { w: (await nW()) - w0, r });
  ok(/할 그룹 2 \/ 4/.test(r.ak[0]) && /보관한 그룹: '그룹 보관'/.test(r.ak[0]) && /24시간 안에 이미 맡김[^:]*: '그룹 다'/.test(r.ak[0]) && /가격은 바꾸지 않음/.test(r.ak[0]), '확인 창 = 할 그룹 수 · 건너뛸 까닭마다 그룹 이름(보관 · 24시간) · 가격 안 바꿈', r.ak[0]);
  /* ⓒ 서버를 못 읽으면 시작하지 않음 */
  await p.evaluate(() => { window.__ANS = true; window.__L0 = window.bkfLedger; window.bkfLedger = async () => { throw new Error('오프라인'); }; }); w0 = await nW(); r = await run('metrics');
  await p.evaluate(() => { window.bkfLedger = window.__L0; });
  ok((await nW()) === w0 && !r.ak.length && r.tl.some((t) => /시작하지 않음/.test(t)), '서버를 못 읽으면 묻지도 않고 시작 안 함(쓰기 0)', r);
  /* ⓓ 다른 기기가 실행 중 — 실행 거절 · 구성 바꾸기·그룹 지우기 막음 · 카드 */
  await p.evaluate(async (fid) => { const now = new Date().toISOString(); await bkfRunRef(fid).set({ kind: 'bkfold-run', fid, lock: { run: 'rX', op: 'recalc', by: 'other@x', dev: 'PC2', at: now, beat: now, k: 1, N: 3 }, runs: { rX: { op: 'recalc', by: 'other@x', at: now, plan: { gids: ['gA', 'gB', 'gC'] }, res: { gA: { st: 'ok', at: now } } } } }); }, fid);
  w0 = await nW(); r = await run('recalc');
  ok((await nW()) === w0 && !r.ak.length && r.tl.some((t) => /지금 이 묶음이 실행 중입니다\(other@x\)/.test(t)), '다른 기기 실행 중 → 거절(쓰기 0)', r);
  const blk = await p.evaluate(async (fid) => { const a = await bkfTx({ t: 'out', fid, gids: ['gC'] }); const b = await bkfTx({ t: 'ren', fid, value: '이름 바꿈' }); window.__AK = []; const d = await batchDelAsk([{ id: 'gA', name: '그룹 가' }]); return { a: a.err || null, b: b.err || null, d, ak: window.__AK.length, tl: window.__TL.slice(-1)[0] }; }, fid);
  ok(/실행 중에는 구성을 바꿀 수 없습니다/.test(blk.a || '') && !blk.b, '실행 중엔 그룹 넣고 빼기 막음 · 이름 바꾸기는 됨', blk);
  ok(blk.d === false && blk.ak === 0 && /실행 중입니다 — 끝난 뒤에 지우세요/.test(blk.tl || ''), '실행 중인 묶음의 그룹 지우기 막음(확인 창도 안 띄움)', blk);
  ok(await until(() => { const e = document.querySelector('#bkf_act [data-bkflock="live"]'); return e && /1\/3/.test(e.textContent) && /other@x · PC2/.test(e.textContent) && [...document.querySelectorAll('#bkf_act [data-bkfrun]')].every((b) => b.disabled); }), '실행 중 카드 = 진행 1/3 · 누가 · 어느 기기 · 단추는 잠김');
  /* ⓔ 멈춘 실행(3분 넘게 신호 없음) → 넘겨받기 */
  await p.evaluate(async (fid) => { const old = new Date(Date.now() - 5 * 60e3).toISOString(); const d = (await bkfRunRef(fid).get()).data(); await bkfRunRef(fid).update({ lock: { ...d.lock, beat: old, at: old } }); S._bkfTakeMs = 60; }, fid);
  ok(await until(() => !!document.querySelector('#bkf_act [data-bkflock="dead"] [data-bkftake]')), '멈춘 실행 카드 = ⚠ · 넘겨받기 단추');
  await p.evaluate(() => { window.__AK = []; }); await p.locator('#bkf_act [data-bkftake]').click();
  const tk = await until(async (fid) => { const d = (window.__FS.prd_price_batches || {})['_bkf_' + fid]; return d && d.lock === null ? JSON.parse(JSON.stringify(d.runs.rX)) : null; }, 60, fid);
  ok(tk && tk.dead === true && tk.endAt && /넘겨받아 닫음/.test(tk.why) && tk.res.gA, '넘겨받기 = 지켜본 뒤 잠금을 닫고 그 실행에 「끊겨 닫음」 · 한 그룹 결과는 그대로', tk);
  ok(await until(() => [...document.querySelectorAll('#bkf_act [data-bkfrun]')].every((b) => !b.disabled) && /끊겨 닫음/.test(document.getElementById('bkf_act').textContent)), '닫은 뒤 단추가 다시 풀리고 최근 실행에 「끊겨 닫음」');
  /* ⓕ 📈 모두 갱신 — 그룹마다 명령 하나 · 문서 모양 = 그룹 화면 것 + 묶음 표식 · 24시간·보관 건너뜀 */
  r = await run('metrics'); const L1 = await FS('prd_price_batches', '_bkf_' + fid); const mr = Object.entries(L1.runs).find(([, x]) => x.op === 'metrics');
  const cmds = await p.evaluate(() => JSON.parse(JSON.stringify(Object.values(window.__FS.shp_cmds || {}).filter((x) => x.foldId))));
  ok(cmds.length === 2 && cmds.map((x) => x.batchId).sort().join() === 'gA,gB' && cmds.every((x) => x.foldRun === mr[0] && x.foldId === fid && x.status === 'queued' && x.keys.length > 0), '그룹 가·나만 하나씩 맡김(그룹 다 24시간 · 보관 건너뜀) · 묶음·실행 표식', cmds.map((x) => [x.batchId, x.keys.length, x.foldRun]));
  ok(scrDoc && cmds.every((x) => JSON.stringify(Object.keys(x).filter((k) => k !== 'foldId' && k !== 'foldRun').sort()) === JSON.stringify(Object.keys(scrDoc).sort())), '명령 문서 칸 = 그룹 화면 📈 단추 문서 칸(+ foldId·foldRun만)', { a: cmds[0] && Object.keys(cmds[0]).sort(), s: scrDoc && Object.keys(scrDoc).sort() });
  const gA1 = await FS('prd_price_batches', 'gA'); ok(gA1.lastMetricsReqAt && cmds.find((x) => x.batchId === 'gA').createdAt === gA1.lastMetricsReqAt && JSON.stringify(gA1.lastKeys) === JSON.stringify(cmds.find((x) => x.batchId === 'gA').keys), '그룹 문서에 맡긴 때·상품 목록(그룹 화면과 같음)', { at: gA1.lastMetricsReqAt, n: (gA1.lastKeys || []).length });
  ok(L1.lock === null && mr[1].endAt && Object.keys(mr[1].res).sort().join() === 'gA,gB' && Object.values(mr[1].res).every((x) => x.st === 'ok'), '실행 장부 = 잠금 풀림 · 끝난 때 · 그룹마다 결과', mr[1]);
  r = await run('metrics'); ok(!r.ak.length && r.tl.some((t) => /할 그룹이 없습니다/.test(t)), '바로 다시 누르면 할 그룹 없음(24시간)', r.tl);
  /* 진행 카드 — 맡긴 명령이 끝나면 「끝났습니다」 */
  await p.evaluate(async () => { for (const [id, v] of Object.entries(window.__FS.shp_cmds)) if (v.foldId) await db.collection('shp_cmds').doc(id).update({ status: 'done', total: v.keys.length, doneN: v.keys.length, ok: v.keys.length }); });
  ok(await until(() => { const t = (document.querySelector('#bkf_act .bkf-met summary') || {}).textContent || ''; return /그룹 2\/2 끝/.test(t) && /끝났습니다/.test(t); }), '지표 모으기 진행 카드 = 그룹 2/2 끝 · 「모두 다시 계산」 안내');
  /* ⓖ 🔄 모두 다시 계산 — 그룹마다 화면 없는 셈으로 상품 목록을 고침 */
  await p.evaluate(async () => { await db.collection('prd_price_batches').doc('gB').update({ lastKeys: ['aladin_X'] }); });
  r = await run('recalc'); const gB2 = await FS('prd_price_batches', 'gB'); const kB = await p.evaluate(async () => { const C = await bqCtx('gB', { dry: true }); return C.R.filter((x) => !x.out).map(C.keyOf); });
  ok(JSON.stringify(gB2.lastKeys) === JSON.stringify(kB) && gB2.lastCount === kB.length && gB2.lastSyncAt, '다시 계산 → 그룹 나 상품 목록 = 그 셈의 상품', { srv: gB2.lastKeys, kB });
  const rc = Object.values((await FS('prd_price_batches', '_bkf_' + fid)).runs).find((x) => x.op === 'recalc' && !x.dead); ok(rc && Object.keys(rc.res).length === 3 && rc.res.gB.ch === true, '다시 계산 장부 = 보관 뺀 셋 · 바뀐 그룹 표시', rc && rc.res);
  /* ⓗ 매일 자동 켜기 → 손으로 하나 바꿈 → 되돌리기(그 하나는 지킴) */
  r = await run('autoOn'); let s = await p.evaluate(() => ['gA', 'gB', 'gC', 'gZ'].map((g) => !!(window.__FS.prd_price_batches[g] || {}).autoMetrics));
  ok(s.join() === 'true,true,true,false', '매일 자동 켜기 = 보관 뺀 셋', s);
  await p.evaluate(() => db.collection('prd_price_batches').doc('gB').update({ autoMetrics: false }));
  const onRun = Object.entries((await FS('prd_price_batches', '_bkf_' + fid)).runs).find(([, x]) => x.op === 'autoOn')[0];
  ok(await until((id) => !!document.querySelector(`#bkf_act [data-bkfrund="${id}"]`), 60, onRun), '끝난 켜기 실행에 「↩ 되돌리기」 단추');
  await p.evaluate(() => { window.__AK = []; window.__TL = []; }); await p.locator(`#bkf_act [data-bkfrund="${onRun}"]`).click();
  await until(() => !S._bkfRun && window.__TL.length, 100);
  s = await p.evaluate(() => ['gA', 'gB', 'gC'].map((g) => !!window.__FS.prd_price_batches[g].autoMetrics)); const ak = await p.evaluate(() => window.__AK[0] || '');
  ok(s.join() === 'false,false,false' && /그 뒤에 다시 바뀜[^:]*: '그룹 나'/.test(ak), '되돌리기 = 그 실행이 바꾼 그룹만 전 값으로 · 그 뒤 손으로 바꾼 그룹 나는 건너뜀(지킴)', { s, ak });
  const und = Object.values((await FS('prd_price_batches', '_bkf_' + fid)).runs).find((x) => x.op === 'autoUndo'); ok(und && und.undoOf === onRun && Object.keys(und.res).sort().join() === 'gA,gC', '되돌리기 장부가 앞 실행을 가리킴', und);
  ok(await until((id) => !document.querySelector(`#bkf_act [data-bkfrund="${id}"]`) && /되돌림/.test(document.getElementById('bkf_act').textContent), 60, onRun), '되돌린 뒤 단추가 사라지고 「되돌림」 표시');
  r = await run('autoUndo', onRun); ok(!r.ak.length && r.tl.some((t) => /이미 되돌린 실행/.test(t)), '두 번 되돌리지 않음', r.tl);
  /* ⓘ 멈추기 — 하던 그룹까지만 */
  await p.evaluate(() => { S._bkfBeatMs = 80; window.__R0 = BKF_OPS.recalc.run; BKF_OPS.recalc.run = async (...a) => { await new Promise((r) => setTimeout(r, 400)); return window.__R0(...a); }; window.__AK = []; window.__TL = []; window.__RP = bkfRun(S.detail.bkfold, 'recalc'); });
  const lk = await until((fid) => { const d = window.__FS.prd_price_batches['_bkf_' + fid]; return d && d.lock && d.lock.op === 'recalc' ? d.lock.beat : null; }, 60, fid);
  await W(p, 250); const bt = await p.evaluate((fid) => window.__FS.prd_price_batches['_bkf_' + fid].lock.beat, fid); ok(lk && bt && bt > lk, '실행 중 신호가 계속 새로 됨', { lk, bt });
  await p.evaluate(async (fid) => { await bkfStop(fid); await window.__RP; BKF_OPS.recalc.run = window.__R0; S._bkfBeatMs = 0; }, fid);
  const st = Object.values((await FS('prd_price_batches', '_bkf_' + fid)).runs).filter((x) => x.op === 'recalc' && !x.dead).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0]; const L2 = await FS('prd_price_batches', '_bkf_' + fid);
  ok(st && Object.keys(st.res).length >= 1 && Object.keys(st.res).length < 3 && /멈추기를 눌렀습니다/.test(st.why) && st.stop && L2.lock === null, '멈추기 → 하던 그룹까지만 · 장부에 까닭 · 잠금 풀림', st && { n: Object.keys(st.res).length, why: st.why });
  /* ⓙ ⏸ 모두 적용 끄기 — 세 칸만 · 다른 돈 설정 그대로 */
  const wp0 = await nW(); r = await run('off'); const pr = await FS('prd_system', 'pricing');
  const wp = await p.evaluate((n) => window.__FSW.slice(n).filter((w) => w.n === 'prd_system').map((w) => Object.keys(w.v).sort().join()), wp0);
  ok(['gA', 'gB', 'gC', 'gZ', 'gX'].every((g) => pr.batchOff[g] === true) && pr.minPrice === 1234 && pr.mode === 'manual', '적용 끄기 = 묶음 네 그룹 꺼짐 · 다른 그룹·다른 돈 설정 그대로', pr);
  ok(wp.length === 1 && wp[0] === 'batchOff,batchOffLog,batchOnce', '돈 설정 문서는 한 번 · 세 칸만 씀', wp);
  ok((pr.batchOffLog || []).filter((x) => x.fold === fid && x.on === false).length === 4 && /반영을 기다리는 0개는 멈춤/.test(r.ak[0] || ''), '끄기 기록에 묶음 표식 · 확인 창에 기다리는 확정 수', { log: (pr.batchOffLog || []).length, ak: r.ak[0] });
  ok(await until(() => /켜진 그룹 0\/4/.test(document.getElementById('bkf_act').textContent)), '끈 뒤 카드 = 켜진 그룹 0/4');
  const W9 = await p.evaluate(() => (window.__FSW || []).map((w) => w.n)); ok(!W9.includes('prd_price_decisions') && !W9.includes('prd_price_actions'), '가격 결정·가격 바꾸기 문서를 한 번도 쓰지 않음', [...new Set(W9)]);
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음 — 웹앱 확인 창만', dlg);
  console.log(bad ? `❌ tBKFOLD4_1117 ${bad}개 실패` : '✓ tBKFOLD4_1117 통과'); process.exitCode = bad ? 1 : 0; });
