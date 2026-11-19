// tCTRLLK_1119 — (정범님 I-1119-1646-19·1717-22) 🛰 관제소 판 ①-3: 「잠금 상품도 일괄 실행 계획·미리 보기에 넣기」 스위치
//  ㉠ 스위치는 계획·미리 보기에만 영향 — 실제 반영은 완전 잠금을 늘 막고 조건 잠금은 늘 지킴 · 기본 꺼짐 · 한 번만 우회하는 길(㉡) 없음 · 관제소에서 감시 실행을 켜는 길 0
//  판단은 공용 bqLockWhy 한 곳 — 그룹 화면·묶음 실행·모아 보기가 같은 상품·같은 값에 같은 답
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLLK_1119.js · 시험 자료는 가짜 상품만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글 — 관제소 새 코드에 감시 실행을 켜는 길이 없음(동작 시험은 ②)');
{ const blk = (n) => { const a = T.indexOf('◆' + n + ' 시작'), b = T.indexOf('◆' + n + ' 끝'); return a > 0 && b > a ? T.slice(a, b) : ''; };
  const K = blk('ctrllk'), all = blk('ctrlroom') + blk('ctrlhist') + blk('ctrlpre'); ok(K && all, '표시 블록(◆ctrlroom·◆ctrlhist·◆ctrllk·◆ctrlpre)');
  ok(/function ctrlLkOpt\(/.test(K) && /function ctrlLkSet\(/.test(K) && /function ctrlLkOpen\(/.test(K) && /function ctrlLkWhy\(/.test(K), '함수 넷(ctrlLkOpt·ctrlLkSet·ctrlLkOpen·ctrlLkWhy)');
  ok(!/watch\s*:\s*\{|\.watch\s*=|watch\.on|apply\s*:\s*['"]|guardPct|bkfRun\([^,)]*,\s*['"]auto(On|Run|Start)|gswSave|bkcOn|plkSet|plkPut/.test(all), '관제소 새 코드에 감시 켜기·감시 반영 방식·잠금 풀기 길 0', (all.match(/watch\s*:\s*\{|\.watch\s*=|watch\.on|apply\s*:\s*['"]|guardPct|bkfRun\([^,)]*,\s*['"]auto(On|Run|Start)|gswSave|bkcOn|plkSet|plkPut/g) || []));
  const W = K.match(/\.(update|set)\(/g) || []; ok(W.length === 2 && /tx\.update\(ref, \{ lkopt: nx/.test(K) && /tx\.set\(ref, \{ lkopt: nx/.test(K), '설정 저장은 묶음 문서 lkopt 한 칸만(트랜잭션)', W);
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(K), '새 코드에 브라우저 창 없음'); ok(/await ask\(/.test(K), '켤 때 확인 한 번(ask)');
  ok(/감시기·클라우드·수집기/.test(K) && /실제 반영은/.test(K), '설정 창에 「감시기·클라우드·수집기도 막음 · 실제 반영은 막힘」 안내'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLLK_1119 ${bad}개 실패` : '✓ tCTRLLK_1119 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const R = await p.evaluate(() => { const now = Date.now(); S.pmetrics = S.pmetrics || new Map(); S.pmetrics.set('bk1', { lastCheckedAt: new Date(now).toISOString() });
    const mk = (code) => ({ l: { listingId: 'L' + code, status: '판매중', bookId: 'bk1', price: 10000, usedCode: code, title: '가짜' + code }, out: false, floor: 0, page1: [], target: 9800 });
    const xs = { full: mk('uF'), cin: mk('uC1'), cout: mk('uC2'), cx: mk('uC3'), free: mk('uN') };
    const lk = { full: { on: true, mode: 'full' }, cin: { on: true, mode: 'cond', cond: { floor: 9500 } }, cout: { on: true, mode: 'cond', cond: { floor: 9500 } }, cx: { on: true, mode: 'cond', cond: { until: '2020-01-01T00:00:00Z', floor: 9500 } } };
    const Z = { now }; const key = (x) => 'aladin_' + x.l.usedCode; const C = { keyOf: key, startOf: () => 10000 };
    const val = { full: 9800, cin: 9800, cout: 9000, cx: 9800, free: 9800 };
    const setOpt = (o) => { S.bkfold = { ...(S.bkfold || {}), lkopt: o }; };
    const Mrt = (names) => new Map(names.filter((n) => lk[n]).map((n) => [key(xs[n]), lk[n]]));
    const out = {}; out.def = ctrlLkOpt();
    for (const opt of [null, { full: true }]) { setOpt(opt); const tag = opt ? 'on' : 'off'; out[tag] = {};
      for (const n of Object.keys(xs)) { const M = Mrt([n]); const rt = bqLockWhy(xs[n], val[n], M, undefined); /* 실제 실행(새로 읽은 잠금 M) */ const live = bqLockWhy(xs[n], val[n], null, undefined); /* 계획 — 실시간 잠금이 없으면 M 없이는 null */
        out[tag][n] = { real: rt && rt.out, realPlan: rt && rt.plan, itemReal: bkfItemWhy(xs[n], C, val[n], Z, M), ctrlReal: ctrlLkWhy(xs[n], val[n], M), plan: ctrlLkWhy(xs[n], val[n], M) }; }
      /* 계획(M 없음) — 실시간 잠금 S.plk 에 넣고 본다 */
      S.plk = new Map(Object.keys(lk).map((n) => [key(xs[n]), lk[n]])); out[tag].planned = {};
      for (const n of Object.keys(xs)) { const w = bqLockWhy(xs[n], val[n], null); out[tag].planned[n] = { out: w ? w.out : null, cut: !!(w && w.Q && w.Q.cut), plan: w ? !!w.plan : null, item: bkfItemWhy(xs[n], C, val[n], Z, null), mark: ctrlLkWhy(xs[n], val[n], null) }; } }
    return out; });
  console.log('  ', JSON.stringify(R).slice(0, 900));
  ok(!R.def.full, '기본: 꺼짐(계획에도 안 넣음)', R.def);
  const P0 = R.off.planned, P1 = R.on.planned;
  ok(P0.full.out === true && P0.free.out === null, '기본: 완전 잠금은 계획에서 빠짐 · 잠금 없는 상품은 그대로', P0);
  ok(P0.cin.out === false && !P0.cin.item, '기본: 조건 잠금 선 안은 다른 상품과 같게 대상', P0.cin);
  ok(P0.cout.out === true || /조건 잠금/.test(P0.cout.item || ''), '기본: 조건 잠금 선 밖은 조건을 지켜 뺌', P0.cout); ok(P0.cx.out === true && /조건 잠금|🔒/.test(P0.cx.item || ''), '기본: 기한 지난 조건 잠금은 완전 잠금처럼 막음(세 화면 같음)', P0.cx);
  ok(P1.full.out === false && P1.full.plan === true && !P1.full.item, '스위치 켬: 완전 잠금 상품이 계획·미리 보기에 들어감', P1.full);
  ok(P1.cin.out === P0.cin.out && P1.cout.out === P0.cout.out, '스위치 켬: 조건 잠금은 그대로 조건을 지킴(영향 없음)', { cin: [P0.cin, P1.cin], cout: [P0.cout, P1.cout] });
  // 같은 상품·같은 값 = 같은 답 (그룹 화면 bqLockWhy · 묶음 실행 bkfItemWhy · 모아 보기 ctrlLkWhy)
  for (const tag of ['off', 'on']) for (const n of ['full', 'cin', 'cout', 'cx', 'free']) { const e = R[tag].planned[n]; const g = e.out === true, b = !!e.item && /🔒|조건 잠금/.test(e.item), m = !!e.mark;
    if (e.cut) ok(g === false && m === false && /선에 닿음/.test(e.item || ''), `조건 잠금 선에 닿는 값 — 그룹 화면·모아 보기는 남기고 묶음 실행은 「그룹 화면에서 확정」으로 보류(기존 규칙) — 스위치 ${tag} · ${n}`, e); else ok(g === b && b === m, `같은 상품·같은 값 같은 답 — 스위치 ${tag} · ${n}: 그룹 화면 ${g} · 묶음 실행 ${b} · 모아 보기 ${m}`, e); }
  // ㉠ 스위치를 켜도 실제 반영(새로 읽은 잠금 M)은 완전 잠금 상품 0건 · 조건 잠금은 지킴
  const RP = R.on;
  ok(RP.full.real === true && RP.full.itemReal === '🔒 잠금', '스위치 켬 + 실제 반영: 완전 잠금 상품 막힘(🔒 잠금)', RP.full);
  ok(RP.cout.real === true || /조건 잠금/.test(RP.cout.itemReal || ''), '스위치 켬 + 실제 반영: 조건 잠금 선 밖은 그대로 막힘', RP.cout);
  const K = await p.evaluate(() => { const now = Date.now(); const key = (x) => 'aladin_' + x.l.usedCode; const mk = (code, t) => ({ l: { listingId: 'L' + code, status: '판매중', bookId: 'bk1', price: 10000, usedCode: code, title: '가짜' + code }, out: false, floor: 0, page1: [], target: t });
    const R2 = [mk('uF', 9800), mk('uN', 9800), mk('uN2', 9800)]; const C = { R: R2, st: { picks: {}, decided: {}, trashed: {}, held: {}, edkw: {} }, SRV: {}, sold: { set: new Set(), rows: [] }, keyOf: key, startOf: () => 10000 };
    const full = { on: true, mode: 'full' }; S.plk = new Map([[key(R2[0]), full]]); const Z = { now, sIdx: new Map() }; const M = new Map([[key(R2[0]), full]]);
    const tab = (T) => T.keys.map((e) => e[0]); const res = {};
    S.bkfold = { ...(S.bkfold || {}), lkopt: null }; res.offPlan = tab(bkfTabKeys(C, 'sel', Z, null)); res.offSum = bkfTbSum(C, Z);
    S.bkfold = { ...(S.bkfold || {}), lkopt: { full: true } }; const Tp = bkfTabKeys(C, 'sel', Z, null); res.onPlan = tab(Tp); res.onLkp = Tp.lkp; res.onReal = tab(bkfTabKeys(C, 'sel', Z, M)); res.onSum = bkfTbSum(C, Z);
    res.preLine = ctrlPreLine({ todo: [{ info: { keys: Tp.keys, blkBy: {}, lkp: Tp.lkp } }], X: {}, led: { runs: {} } }); return res; });
  ok(K.offPlan.length === 2 && !K.offPlan.includes('aladin_uF'), '기본: 계획 = 잠금 없는 2개(완전 잠금 1개 빠짐)', K.offPlan);
  ok(K.onPlan.length === 3 && K.onPlan.includes('aladin_uF') && K.onLkp === 1, '스위치 켬: 계획 = 3개(잠금 상품 1개 포함 · 잠금 포함 1개로 셈)', { p: K.onPlan, lkp: K.onLkp });
  ok(K.onReal.length === 2 && !K.onReal.includes('aladin_uF'), '스위치 켬 + 실제 반영: 완전 잠금 상품 0건 바뀜(2개만)', K.onReal);
  ok(/🔓 설정으로 잠금 상품 1개가 계획에 들어 있음/.test(K.preLine) && /감시기·클라우드·수집기/.test(K.preLine), '미리 보기 줄: 잠금 포함 수 + 감시기·클라우드·수집기도 막는다는 안내', K.preLine);
  // bkfTbSum — 잠겨서 빠진 상품은 탭 수에서 뺌 · 스위치 켜면 계획대로 셈
  ok(K.offSum.n.sel === 2 && K.offSum.lkx === 1, 'bkfTbSum: 기본에서 잠금 상품(🔒 빠짐)은 선택 대기 수에서 뺌(3개 중 2개 · 빠짐 1)', { n: K.offSum.n, lkx: K.offSum.lkx });
  ok(K.onSum.n.sel === 3 && !K.onSum.lkx, 'bkfTbSum: 스위치 켜면 계획대로 3개', { n: K.onSum.n, lkx: K.onSum.lkx });
  // 설정 저장 — 묶음 문서 lkopt 한 칸만 바뀜(다른 칸·감시·잠금은 손대지 않음)
  await p.evaluate(() => { if (!S.user) S.user = { email: 't@x', uid: 't' }; S.bkfold = { ...(S.bkfold || {}), lkopt: null }; });
  const sv = await p.evaluate(async () => { const ref = db.collection('prd_price_batches').doc('_bkfold'); await ref.set({ order: ['zz'], marker: 'm1' }, { merge: true }); const before = (await ref.get()).data();
    const r = await ctrlLkSet(true); const after = (await ref.get()).data(); const keys = Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]) || !(k in before));
    const wl = S.prBatches ? JSON.stringify(S.prBatches.map((g) => g.watch || null)) : ''; return { r, keys, lk: after.lkopt, marker: after.marker, order: after.order, wl, opt: ctrlLkOpt() }; });
  ok(sv.keys.every((k) => k === 'lkopt' || k === 'uploadedAt') && sv.lk && sv.lk.full === true && sv.opt.full === true && sv.marker === 'm1', '저장: lkopt 칸만 바뀜(다른 칸 그대로) · 다시 읽어도 켜짐', sv);
  // 감시 실행이 켜진 그룹이 하나도 늘지 않음
  const wn = await p.evaluate(async () => { const before = (S.prBatches || []).filter((g) => g.watch && g.watch.on).length; await ctrlLkSet(false); await ctrlLkSet(true); return { before, after: (S.prBatches || []).filter((g) => g.watch && g.watch.on).length }; });
  ok(wn.before === wn.after, '스위치를 켜고 꺼도 감시 실행 켜진 그룹 수가 그대로(관제소에는 감시를 켜는 길이 없음)', wn);
  // 설정 창
  await p.evaluate(() => { S.bkfold = { ...(S.bkfold || {}), lkopt: null }; S.tab = 'products'; renderTabs(); renderMainNow(); });
  await p.evaluate(async () => { const a = await bkfTx({ t: 'new', name: '묶음A' }); openCtrlRoom(a.fid); }); await Wt(p, 800);
  ok(await p.evaluate(() => !!document.querySelector('#bkf_scr [data-cswlk]')), '띠에 ⚙ 잠금 설정 단추');
  await p.evaluate(() => document.querySelector('#bkf_scr [data-cswlk]').click()); await Wt(p, 300);
  const B = await p.evaluate(() => ({ boxes: [...document.querySelectorAll('#csw_pop [data-lkk]')].map((c) => c.checked), txt: (document.querySelector('#csw_pop') || {}).textContent || '', iw: innerWidth, sw: document.documentElement.scrollWidth }));
  ok(B.boxes.length === 1 && B.boxes[0] === false, '설정 창: 스위치 하나 · 기본 꺼짐', B.boxes);
  ok(/계획과 미리 보기에만/.test(B.txt) && /감시기·클라우드·수집기/.test(B.txt), '설정 창 글: 계획·미리 보기에만 · 감시기·클라우드·수집기도 막음', B.txt.slice(0, 300));
  ok(B.sw <= B.iw, '가로 넘침 없음', B);
  // 겹침 검사는 묶음마다 한 번
  const sc = await p.evaluate(() => { const calls = []; const oc = window.ctrlFolds, os = window.bkfScan; window.ctrlFolds = () => ({ N: { folds: { a: { name: 'A', gids: ['g1', 'g2'], color: 0 }, b: { name: 'B', gids: ['g3', 'g4'], color: 1 } } }, ids: ['a', 'b'], pin: [] }); window.bkfScan = (id) => { calls.push(id); return { n: 2 }; };
    let html = ''; try { html = bkfSwHtml('a'); } finally { window.ctrlFolds = oc; window.bkfScan = os; } return { calls, w: (html.match(/csw-w/g) || []).length }; });
  ok(sc.calls.length === 2 && new Set(sc.calls).size === 2 && sc.w === 2, 'bkfSwHtml: 묶음마다 겹침 검사 한 번씩', sc);
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLLK_1119 ${bad}개 실패` : '✓ tCTRLLK_1119 통과'); return bad; });
