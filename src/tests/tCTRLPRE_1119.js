// tCTRLPRE_1119 — (정범님 I-1119-1552-16) 🛰 관제소 판 ①-2: 묶음 전체 미리 보기 한 줄(K1) · 🕘 실행 기록 한곳(K4)
//  ① 글: 합계 함수·평소 2배 경고·실행 기록 창·되돌리기는 기존 bkfRun(bulkUndo·autoUndo)만 · 실행 길(bkfRun 인자) 그대로 · 브라우저 창 없음 · 전화번호 모양 없음
//  ② 화면(RN_PORT): 합계 한 줄 값(내림·올림·바닥·잠금) · 평소의 2배 넘으면 경고 · 실행 기록 창이 두 묶음 장부를 한곳에 모음 · 되돌릴 수 없는 것은 까닭 · 되돌리기 단추가 기존 길을 부름
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLPRE_1119.js · 시험 자료는 「묶음A」 같은 가짜 이름만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('◆ctrlpre 시작'), b = T.indexOf('◆ctrlpre 끝'), c = T.indexOf('◆ctrlhist 시작'), d = T.indexOf('◆ctrlhist 끝'); ok(a > 0 && b > a && c > 0 && d > c, '표시 두 블록(◆ctrlpre·◆ctrlhist)');
  const P = T.slice(a, b), H = T.slice(c, d);
  for (const fn of ['ctrlPreSum', 'ctrlPreAvg', 'ctrlPreLine']) ok(new RegExp('function ' + fn + '\\(').test(P), `함수 ${fn}`);
  for (const fn of ['ctrlHistRows', 'ctrlHistOpen']) ok(new RegExp('function ' + fn + '\\(').test(H), `함수 ${fn}`);
  ok(/T\.n > A\.avg \* 2/.test(P) && /평소의/.test(P), '지난 실행 평균의 2배 넘으면 「평소의 n배」 경고');
  ok(/slice\(0, 5\)/.test(P), '지난 5번 평균');
  ok(/bkfRun\(fid, kind, id\)/.test(H) && /'bulkUndo'/.test(H) && /'autoUndo'/.test(H), '되돌리기는 기존 bkfRun(bulkUndo·autoUndo)만');
  ok(!/\.(set|update|delete)\(|runTransaction|batchSave/.test(H) && !/\.(set|update|delete)\(|runTransaction|batchSave/.test(P), '새 코드는 쓰기 0(읽기·합계만)');
  ok(/되돌릴 수 없|되돌릴 것이 없|이미 되돌림/.test(H), '되돌릴 수 없는 것은 까닭을 적음');
  ok(/data-cswhist/.test(T), '띠에 🕘 실행 기록 단추');
  ok(/async function bkfRun\(fid, opk, arg\)/.test(T), '실행 길 bkfRun 인자 그대로');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(P + H), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(P + H), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLPRE_1119 ${bad}개 실패` : '✓ tCTRLPRE_1119 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  // 합계 한 줄 (가짜 계획)
  const L = await p.evaluate(() => { const mk = (keys, blkBy) => ({ r: { info: { keys, blkBy } } });
    const P = { todo: [{ info: { keys: [['a', 9000, 10000], ['b', 8000, 8500], ['c', 12000, 11000]], blkBy: { '하한선 아래': 2, '🔒 잠금': 3 } } }, { info: { keys: [['d', 5000, 5000 + 100]], blkBy: { '🎚 조건 잠금 선에 닿음(그룹 화면에서 확정)': 1 } } }], X: { opk: 'execAll' },
      led: { runs: { r1: { op: 'execAll', endAt: 'x', at: '2026-11-10', res: { gA: { st: 'ok', n: 1 } } }, r2: { op: 'execAll', endAt: 'x', at: '2026-11-11', res: { gA: { st: 'ok', n: 2 } } } } } };
    const S1 = ctrlPreSum(P); const line = ctrlPreLine(P); const A = ctrlPreAvg(P); return { S1, line, A }; });
  ok(L.S1.n === 4 && L.S1.dn === -1600 && L.S1.up === 1000 && L.S1.dnN === 3 && L.S1.upN === 1, '바뀔 상품 4 · 내림 합 −1,600 · 올림 합 +1,000', L.S1);
  ok(L.S1.floor === 3 && L.S1.lock === 3, '바닥가에 닿음 3 · 잠겨 건너뜀 3', L.S1);
  ok(/바뀔 상품 4/.test(L.line) && /내림 합 −₩1,600/.test(L.line) && /올림 합 \+₩1,000/.test(L.line) && /🔒 잠겨 건너뜀 3/.test(L.line), '한 줄 글', L.line);
  ok(L.A && Math.abs(L.A.avg - 1.5) < 1e-9 && L.A.k === 2 && /평소의 2\.7배/.test(L.line), '평균 1.5개의 2배(3개)를 넘는 4개 → 「평소의 2.7배입니다」', { A: L.A, line: L.line });
  const L2 = await p.evaluate(() => ctrlPreLine({ todo: [{ info: { keys: [['a', 9000, 10000]], blkBy: {} } }], X: { opk: 'execAll' }, led: { runs: { r1: { op: 'execAll', endAt: 'x', at: '2026-11-10', res: { gA: { st: 'ok', n: 1 } } } } } }));
  ok(!/평소의/.test(L2), '평균의 2배 이하면 경고 없음', L2);
  // 실행 기록 한곳
  const SEED = async () => { if (!S.user) S.user = { email: 't@x', uid: 't' }; S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    const a = await bkfTx({ t: 'new', name: '묶음A' }), b = await bkfTx({ t: 'new', name: '묶음B' }); const now = new Date().toISOString(); const led = (fid, runs) => db.collection('prd_price_batches').doc('_bkf_' + fid).set({ kind: 'bkfold-run', fid, lock: null, runs });
    await led(a.fid, { r1: { op: 'execAll', by: 't@x', at: '2026-11-18T01:00:00Z', endAt: '2026-11-18T01:05:00Z', res: { gA: { st: 'ok', n: 4 } } }, r2: { op: 'metrics', by: 't@x', at: '2026-11-18T02:00:00Z', endAt: '2026-11-18T02:01:00Z', res: { gA: { st: 'ok' } } }, r3: { op: 'bulkUndo', undoOf: 'r0', by: 't@x', at: '2026-11-18T03:00:00Z', endAt: '2026-11-18T03:01:00Z', res: { gA: { st: 'ok', n: 1 } } } });
    await led(b.fid, { q1: { op: 'pickAll', by: 't@x', at: '2026-11-19T01:00:00Z', endAt: '2026-11-19T01:05:00Z', res: { gB: { st: 'ok', n: 2 } } }, q2: { op: 'autoOn', by: 't@x', at: '2026-11-17T01:00:00Z', endAt: '2026-11-17T01:05:00Z', res: { gB: { st: 'ok', set: true } } }, q3: { op: 'execAll', by: 't@x', at: '2026-11-16T01:00:00Z', res: { gB: { st: 'ok', n: 1 } } } });
    return [a.fid, b.fid]; };
  const fids = await p.evaluate(SEED); for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f]), fids[1])) break; await Wt(p, 150); }
  await p.evaluate((f) => openCtrlRoom(f), fids[0]); await Wt(p, 500);
  ok(await p.evaluate(() => !!document.querySelector('#bkf_scr [data-cswhist]')), '띠에 🕘 실행 기록 단추');
  await p.evaluate(() => document.querySelector('#bkf_scr [data-cswhist]').click()); await Wt(p, 1200);
  const H = await p.evaluate(() => { const rows = [...document.querySelectorAll('#csw_pop .csw-hr')].map((e) => ({ t: e.querySelector('summary').textContent, u: !!e.querySelector('[data-cswundo]') })); return { n: rows.length, rows, iw: innerWidth, sw: document.documentElement.scrollWidth }; });
  ok(H.n === 6, '두 묶음의 장부 6줄이 한 창에 모임', H);
  ok(H.rows[0].t.includes('묶음B') && H.rows[H.n - 1].t.includes('묶음B'), '최근 것이 먼저(묶음B 11/19 → … → 11/16)', H.rows.map((r) => r.t.slice(0, 40)));
  const by = (re) => H.rows.find((r) => re.test(r.t)) || {};
  ok(by(/execAll|확정/).u !== undefined, '확정 실행 줄이 있음');
  ok(H.rows.filter((r) => r.u).length === 3, '되돌릴 수 있는 것 = 묶음A 확정 · 묶음B 모두 결정 대기 · 묶음B 자동 지표 켜기 3줄', H.rows.map((r) => [r.u, r.t.slice(0, 60)]));
  ok(H.rows.some((r) => !r.u && /가격·설정을 바꾸지 않은/.test(r.t)), '지표 모으기는 「되돌릴 것이 없음」 까닭', H.rows.map((r) => r.t.slice(0, 80)));
  ok(H.rows.some((r) => !r.u && /끝 기록이 없어/.test(r.t)), '끝 기록 없는 실행은 까닭', H.rows.map((r) => r.t.slice(0, 80)));
  ok(H.sw <= H.iw, '가로 넘침 없음', H);
  // 되돌리기 단추 → 기존 bkfRun 길
  await p.evaluate(() => { window.__calls = []; window.bkfRun = async (f, k, a) => { window.__calls.push([f, k, a]); }; });
  await p.evaluate(() => { const b = [...document.querySelectorAll('#csw_pop [data-cswundo]')].find((x) => /\|r1\|/.test(x.dataset.cswundo)); b.click(); }); await Wt(p, 300);
  const C = await p.evaluate(() => ({ calls: window.__calls, open: !!document.getElementById('csw_pop') }));
  ok(C.calls.length === 1 && C.calls[0][0] === fids[0] && C.calls[0][1] === 'bulkUndo' && C.calls[0][2] === 'r1' && !C.open, '↩ 되돌리기 → bkfRun(묶음, bulkUndo, 실행 번호) 한 번 · 창 닫힘', C);
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLPRE_1119 ${bad}개 실패` : '✓ tCTRLPRE_1119 통과'); return bad; });
