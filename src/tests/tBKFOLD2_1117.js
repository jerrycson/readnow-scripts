// tBKFOLD2_1117 — (정범님 11/17 I-1117-1318-08 · 설계안 BKFOLD_DESIGN_1117 판 ②) 🧮 수동 일괄 📁 묶음 — 만들기·담기(옮기기·복사)·꺼내기·풀기·보관 · 겹침 검사(읽기만)
//  ① 순수 셈: 묶음 바꿈 하나하나 · 무작위 500번 바꿔도 불변식(한 그룹은 한 묶음 · 맨 위 줄에 안 겹침 · 'f:' 칸 = 묶음) · 한도 · 같은 이름 · 담은 시각 쌓기만 · 겹침 셈
//  ② 화면: 상품 탭 줄에 📁 칸 · 가운데에 놓으면 담기(가장자리는 차례만) · 차례 저장해도 묶음 그대로 · 푼 묶음 열쇠가 안 남음 · 복사 = 새 그룹과 같은 칸 + copiedFrom
//        띠 숫자 = 그룹 대상 상품의 교집합 · 휴지통 상품은 빠지고 보류 상품은 남음 · 두 저장이 겹쳐도 한 그룹은 한 묶음 · 판 ① 기기가 덮어도 모든 그룹이 보임 · 가격(결정 문서)을 쓰지 않음 · 브라우저 창 없음
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD2_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const blk = cut('/* ◆bkfold 시작', '/* ◆bkfold 끝 */');
  const F = new Function(blk + '\nreturn { bkfNorm, bkfApply, bkfTop, bkfOverlap, bkfSig, bkfOf, BKF_MAXF, BKF_MAXG, BKF_JMAX };')();
  const A = new Set(['a', 'b', 'c', 'd', 'e']); let t = 0; const M = () => ({ now: new Date(Date.UTC(2026, 10, 17, 0, 0, t++)).toISOString(), by: 'x' });
  const ap = (d, op, al) => { const r = F.bkfApply(d, op, al === undefined ? A : al, M()); return r; };
  let d = { order: ['a', 'b', 'c', 'd', 'e'] };
  let r = ap(d, { t: 'new', name: ' 여름  정리 ' }); ok(!r.err && r.fid && r.folds[r.fid].name === '여름 정리' && r.order[0] === 'f:' + r.fid, '새 묶음 = 이름 다듬고 맨 앞', r); const f1 = r.fid; d = { order: r.order, folds: r.folds };
  ok(ap(d, { t: 'new', name: '여름 정리' }).err === '같은 이름의 묶음이 있습니다' && ap(d, { t: 'new', name: '  ' }).err, '같은 이름·빈 이름은 막음');
  r = ap(d, { t: 'put', fid: f1, gids: ['b', 'c', 'zz'] }); ok(!r.err && r.folds[f1].gids.join() === 'b,c' && !r.order.includes('b') && !r.order.includes('c') && r.moved.join() === 'b,c', '담기 = 묶음 안으로 · 맨 위 줄에서 빠짐 · 죽은 그룹은 거름', r); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'new', name: '가을', fid: 'f_2' }); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'put', fid: 'f_2', gids: ['c'] }); ok(r.folds[f1].gids.join() === 'b' && r.folds.f_2.gids.join() === 'c', '다른 묶음에 담으면 앞 묶음에서 빠짐(한 그룹은 한 묶음)', r.folds); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'out', fid: 'f_2', gids: ['c'] }); ok(r.folds.f_2.gids.length === 0 && r.order.indexOf('c') === r.order.indexOf('f:f_2') + 1, '꺼내기 = 묶음 칸 바로 뒤로', r.order); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'put', fid: 'f_2', gids: ['c'] }); ok(r.folds.f_2.joined.c.length === 2 && r.folds.f_2.joined.c[0] < r.folds.f_2.joined.c[1], '담은 시각은 쌓기만(꺼냈다 다시 담으면 둘 — 생성후판매완료 기준 시각)', r.folds.f_2.joined); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'ord', vis: ['e', 'd', 'a'] }); ok(!r.err && Object.keys(r.folds).length === 2 && r.order.filter((k) => k.startsWith('f:')).length === 2, '맨 위 차례만 바꿔도 묶음은 그대로', r.order); d = { order: r.order, folds: r.folds };
  r = ap(d, { t: 'ord', fid: f1, gids: [] }); ok(!r.err, '빈 묶음 안 차례도 깨지지 않음');
  r = ap(d, { t: 'arch', fid: 'f_2', on: true, archGids: ['c', 'zz'] }); ok(r.folds.f_2.archived && r.folds.f_2.archGids.join() === 'c' && ap({ order: r.order, folds: r.folds }, { t: 'put', fid: 'f_2', gids: ['a'] }).err, '보관 = 함께 보관한 그룹만 기억 · 보관한 묶음에는 못 담음', r.folds.f_2);
  r = ap(d, { t: 'del', fid: f1 }); ok(!r.folds[f1] && r.order.includes('b') && !r.order.includes('f:' + f1) && r.gone[f1] && r.gone[f1].joined.b, '묶음 풀기 = 그룹은 맨 위 줄로 · 담은 시각은 기록(foldsGone)에 남음', r);
  ok(ap(d, { t: 'ren', fid: 'f_2', value: '여름 정리' }).err && !ap(d, { t: 'ren', fid: 'f_2', value: '겨울' }).err && ap(d, { t: 'col', fid: 'f_2', value: 99 }).folds.f_2.color === 0 && ap(d, { t: 'note', fid: 'f_2', value: 'x'.repeat(900) }).folds.f_2.note.length === 500 && ap(d, { t: 'put', fid: 'nope', gids: ['a'] }).err && ap(d, { t: 'zzz' }).err, '이름(같은 이름 막음)·색(범위 밖 = 0)·메모(500자)·없는 묶음·모르는 바꿈');
  /* 한도 */ { let D = {}; for (let i = 0; i < F.BKF_MAXF; i++) { const q = F.bkfApply(D, { t: 'new', name: 'n' + i, fid: 'f_' + (i + 1) }, null, M()); D = { order: q.order, folds: q.folds }; } ok(F.bkfApply(D, { t: 'new', name: 'over' }, null, M()).err, `묶음은 ${F.BKF_MAXF}개까지`);
    const many = Array.from({ length: F.BKF_MAXG + 1 }, (_, i) => 'g' + i); ok(F.bkfApply(D, { t: 'put', fid: 'f_1', gids: many }, null, M()).err && !F.bkfApply(D, { t: 'put', fid: 'f_1', gids: many.slice(0, F.BKF_MAXG) }, null, M()).err, `묶음 하나에 그룹 ${F.BKF_MAXG}개까지`);
    let J = { folds: { f: { name: 'j', gids: [] } }, order: [] }; for (let i = 0; i < F.BKF_JMAX + 5; i++) { const p = F.bkfApply(J, { t: 'put', fid: 'f', gids: ['g'] }, null, M()); const o = F.bkfApply({ order: p.order, folds: p.folds }, { t: 'out', fid: 'f', gids: ['g'] }, null, M()); J = { order: o.order, folds: o.folds }; } ok(J.folds.f.joined.g.length === F.BKF_JMAX, `담은 시각은 ${F.BKF_JMAX}개까지(오래된 것부터 접음)`); }
  /* 깨진 문서 · 판 ① 기기가 차례를 덮음 */
  { const bad1 = { order: ['a', 'a', 'f:x', 'f:gone', 'zz'], folds: { x: { name: 'X', gids: ['a', 'b', 'b', 'f:y'] }, y: { name: 'Y', gids: ['b', 'c'] }, junk: 5 } };
    const N = F.bkfNorm(bad1, A); ok(N.folds.x.gids.join() === 'a,b' && N.folds.y.gids.join() === 'c' && !N.folds.junk && N.order.join() === 'f:x,f:y', '깨진 문서 = 겹친 그룹은 먼저 든 묶음에만 · 없는 묶음 칸·죽은 그룹은 거름 · 빠진 묶음 칸은 되살림', N);
    const top = F.bkfTop({ order: ['d', 'e'], folds: { x: { name: 'X', gids: ['a'] } } }, [...A].map((id) => ({ id }))); ok(top.map((x) => x.id).join() === 'b,c,d,e,f:x' && top.find((x) => x.fid).kids.map((g) => g.id).join() === 'a', '판 ① 기기가 차례에서 묶음 칸을 빼도 묶음·모든 그룹이 보임', top.map((x) => x.id)); }
  /* 무작위 500번 — 불변식 */
  { let D = {}; let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; }; const G = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; const AL = new Set(G); let broken = null;
    for (let i = 0; i < 500 && !broken; i++) { const N0 = F.bkfNorm(D, AL); const fs0 = Object.keys(N0.folds); const fid = fs0.length ? fs0[rnd(fs0.length)] : null; const pick = () => G.filter(() => rnd(3) === 0);
      const ops = [{ t: 'new', name: 'n' + rnd(6) }, { t: 'put', fid, gids: pick() }, { t: 'out', fid, gids: pick() }, { t: 'ord', vis: [...G, ...fs0.map((x) => 'f:' + x)].sort(() => rnd(3) - 1) }, { t: 'ord', fid, gids: G.slice().reverse() }, { t: 'del', fid }, { t: 'arch', fid, on: !!rnd(2), archGids: pick() }, { t: 'gc' }];
      const q = F.bkfApply(D, ops[rnd(ops.length)], AL, M()); if (!q.err) D = { order: q.order, folds: q.folds, foldsGone: q.gone };
      const all = Object.values(D.folds || {}).flatMap((f) => f.gids); const fk = (D.order || []).filter((k) => k.startsWith('f:')).map((k) => k.slice(2)).sort().join(); const top = (D.order || []).filter((k) => !k.startsWith('f:'));
      if (new Set(all).size !== all.length) broken = ['한 그룹이 두 묶음', i, D]; else if (top.some((g) => all.includes(g))) broken = ['묶음 그룹이 맨 위 줄에도', i, D]; else if (fk !== Object.keys(D.folds || {}).sort().join()) broken = ["'f:' 칸 ≠ 묶음", i, D]; else if (new Set(D.order).size !== D.order.length) broken = ['차례에 겹친 칸', i, D];
      else if (G.some((g) => !all.includes(g) && !top.includes(g) && (D.order || []).length && i > 0 && F.bkfTop(D, G.map((id) => ({ id }))).every((x) => x.id !== g && !(x.kids || []).some((k) => k.id === g)))) broken = ['그룹이 사라짐', i, D]; }
    ok(!broken, '무작위 500번 바꿔도 불변식(한 그룹은 한 묶음 · 맨 위 줄과 안 겹침 · 묶음 칸 = 묶음 · 겹친 칸 없음 · 그룹이 안 사라짐)', broken); }
  /* 겹침 셈 */
  { const O = F.bkfOverlap([{ keys: ['k1', 'k2', 'k3'] }, { keys: ['k2', 'k3', 'k4'] }, { keys: ['k3', 'k5'] }, { keys: [] }]);
    ok(O.n === 2 && O.total === 5 && O.pairs.get('0|1') === 2 && O.pairs.get('0|2') === 1 && O.pairs.get('1|2') === 1 && O.dup.get('k3').length === 3, '겹침 셈 = 두 그룹 이상에 든 상품 수 · 쌍마다 수', [O.n, O.total, [...O.pairs]]);
    ok(F.bkfOverlap([{ keys: ['a', 'a'] }]).n === 0, '한 그룹 안의 같은 열쇠는 겹침 아님');
    ok(F.bkfSig([{ id: 'a', cond: { x: 1 }, trashed: { k: 1 } }]) !== F.bkfSig([{ id: 'a', cond: { x: 1 }, trashed: {} }]) && F.bkfSig([{ id: 'a', held: {} }]) !== F.bkfSig([{ id: 'a', held: { k: 1 } }]), '조건·휴지통·보류가 바뀌면 셈이 낡음'); }
  const bkf3 = (t) => t.replace(/\/\* ◆bkf3 시작[\s\S]*?\/\* ◆bkf3 끝 \*\//g, ''); /* (11/18 bkfold3) 정범님 24.5·24.6 — 「한꺼번에」·재분류는 가격을 씀 · tBKFOLD3_1118이 봄 */ const io = bkf3(cut('/* ◆bkfold-io 시작', '/* ◆bkfold-io 끝 */'));
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(io) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(io), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  ok(!/prd_price_decisions|batchApply|approvalState|applyPrice/.test(io), '묶음 코드는 가격 결정 문서를 건드리지 않음(가격을 바꾸는 코드 0줄)');
  const names = ['bkfTx', 'bkfLine', 'bkfBind', 'bkfScan', 'bkfKick', 'bkfMembers', 'bkfPut', 'bkfCopyGroup', 'openBkfold', 'bkfPaint', 'bkfMenu', 'bkfGMenu', 'bkfBand', 'batchArchive', 'bkfNorm', 'bkfApply', 'bkfOverlap'];
  const dup = names.filter((n) => (T.match(new RegExp(`(function\\*? |const |let |var )${n}\\b`, 'g')) || []).length !== 1); ok(!dup.length, '새 이름은 파일 전체에서 한 번만 선언', dup); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD2_1117 ${bad}개 실패` : '✓ tBKFOLD2_1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async () => { window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); }; window.__OPEN = []; window.openBatchGroup = (g) => { window.__OPEN.push(g); };
    window.__PQ = []; window.prompt = (m, d) => { const a = window.__PQ.length ? window.__PQ.shift() : null; (window.__PM = window.__PM || []).push(String(m)); return a; }; window.confirm = () => true;
    const now = new Date().toISOString(); await db.collection('prd_price_batches').doc('b_chk1109').set({ name: '확인용', archived: true, createdAt: '2026-11-09T00:00:00.000Z', viewOnly: true });
    const G = [['gA', '그룹 가', {}], ['gB', '그룹 나', {}], ['gC', '그룹 다', { kw: '없는낱말zzqq' }], ['gD', '그룹 라', {}]];
    for (const [id, name, c] of G) await db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, ...c, name }, createdAt: now, lastRunAt: now, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0 });
    await db.collection('prd_price_batches').doc('_bkfold').set({ order: ['gC', 'gA', 'gB', 'gD'] });
    S.prBatches = undefined; S.bkfold = undefined; S._bkfUn = null; S.bslotArch = false; S.bkfExp = {}; try { localStorage.removeItem('rn-bkfexp'); localStorage.removeItem('rn-thin-sec'); } catch (e) {} S.tab = 'products'; S.thinPick = null; S.q = ''; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !document.querySelector('#main .bslot-row [data-bkf="gA"]'); i++) await new Promise((r) => setTimeout(r, 150)); await new Promise((r) => setTimeout(r, 300));
    const dl = document.getElementById('dlp'); if (dl) dl.style.display = 'none'; const r = document.querySelector('#main .bslot-row'); if (r) r.scrollIntoView({ block: 'center' }); }); };
const top = (p) => p.evaluate(() => [...document.querySelectorAll('#main .bslot-row > [data-bkf]')].map((x) => x.dataset.bkf).filter((k) => /^(g|f:)/.test(k)));
const doc = (p) => p.evaluate(() => JSON.parse(JSON.stringify((window.__FS.prd_price_batches || {})._bkfold || {})));
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); await setup(p);
  ok(await p.evaluate(() => !!document.querySelector('#main [data-bkfnew]') && S.prBatches.every((b) => b.id !== '_bkfold')), '상품 탭 그룹 카드에 「＋ 📁 묶음」 · _bkfold 문서는 그룹이 아님');
  /* 만들기(웹앱 입력 창) */
  await p.evaluate(() => { window.__PQ.push('여름 정리'); }); await p.locator('#main [data-bkfnew]').click(); await W(p, 500);
  const d1 = await doc(p); const fid = Object.keys(d1.folds || {})[0]; ok(fid && d1.folds[fid].name === '여름 정리' && d1.order[0] === 'f:' + fid, '「＋ 📁 묶음」 → 이름 넣으면 묶음 칸이 맨 앞(모든 기기 공유 문서)', d1);
  ok((await top(p))[0] === 'f:' + fid, '상품 탭 줄에 📁 칸', await top(p));
  /* 그룹 ⋯ → 옮겨 담기 → 그 묶음 */
  await p.evaluate(() => { window.__PQ.push('1', '1'); }); await p.locator('#main [data-bkfg="gA"]').click(); await W(p, 500);
  let d2 = await doc(p); ok(d2.folds[fid].gids.join() === 'gA' && !d2.order.includes('gA') && (await top(p)).every((k) => k !== 'gA'), '그룹 ⋯ → 「옮겨 담기」 = 묶음 안으로 · 맨 위 줄에서 빠짐', [d2, await top(p)]);
  ok(await p.evaluate(() => !!document.querySelector('#bkf-bar') && /되돌리기/.test(document.querySelector('#bkf-bar').textContent)), '담은 뒤 8초 「되돌리기」 띠');
  /* 끌어서 묶음 이름 가운데에 놓기 = 담기 묻기 → 옮겨 담기 */
  const box = async (sel) => { for (let i = 0; i < 20; i++) { const b = await p.locator(sel).boundingBox().catch(() => null); if (b) return b; await W(p, 100); } throw new Error('칸을 못 찾음: ' + sel); }; /* 실시간 수신으로 줄이 막 다시 그려진 때는 잠깐 기다림 */
  /* 사람처럼 끌기 — 지나가는 칸이 자리를 바꾸며 줄이 다시 흐르니(여러 줄) 목표를 다시 재어 가며 다가감 */
  const drag = async (fromSel, aim) => { const g = await box(fromSel); await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down(); await p.mouse.move(g.x + 25, g.y + 4, { steps: 4 });
    for (let k = 0; k < 4; k++) { const [x, y] = await aim(); await p.mouse.move(x, y, { steps: k ? 3 : 12 }); await W(p, 60); } await p.mouse.up(); await W(p, 600); };
  await p.evaluate(() => { window.__PQ.push('1'); }); await drag('#main [data-bkf="gB"] .bkf-grip', async () => { const h = await box(`#main [data-bkfopen="${fid}"]`); return [h.x + h.width / 2, h.y + h.height / 2]; });
  d2 = await doc(p); ok(d2.folds[fid].gids.join() === 'gA,gB' && await p.evaluate(() => (window.__PM || []).some((m) => /그룹 나.*📁 '여름 정리'에/.test(m))), '그룹 칸을 📁 이름 가운데에 놓으면 「옮겨 담기·복사…」를 묻고 담음', [d2.folds[fid].gids, await p.evaluate(() => window.__PM.slice(-2))]);
  /* 가장자리에 놓으면 차례만 */
  const pm0 = await p.evaluate(() => window.__PM.length); await drag('#main [data-bkf="gD"] .bkf-grip', async () => { const f = await box(`#main [data-bkf="f:${fid}"]`); return [f.x + f.width - 3, f.y + f.height / 2]; });
  const d3 = await doc(p); ok(d3.folds[fid].gids.join() === 'gA,gB' && await p.evaluate((n) => window.__PM.length === n, pm0) && d3.order.indexOf('gD') > d3.order.indexOf('f:' + fid), '묶음 칸 가장자리에 놓으면 담지 않고 차례만 바뀜', [d3.order, await top(p)]);
  /* 차례 저장해도 묶음 그대로 · 판 ① 기기가 차례를 덮어도 */
  await p.evaluate(async () => { await bkfSaveOrder(['gD', 'gC']); }); const d4 = await doc(p); ok(d4.folds[fid] && d4.folds[fid].gids.join() === 'gA,gB', '맨 위 차례를 저장해도 묶음 칸은 그대로', d4);
  const r5 = await p.evaluate(async () => { await db.collection('prd_price_batches').doc('_bkfold').set({ order: ['gD', 'gC', 'gA'] }, { merge: true }); await new Promise((r) => setTimeout(r, 400)); const L = bkfTop(S.bkfold, S.prBatches.filter((b) => /^g/.test(b.id))); return { ids: L.map((x) => x.id), kids: (L.find((x) => x.fid) || { kids: [] }).kids.map((k) => k.id) }; });
  ok(r5.ids.includes('f:' + fid) && r5.ids.includes('gC') && r5.ids.includes('gD') && r5.kids.join() === 'gA,gB' && !r5.ids.includes('gA'), '판 ① 기기가 차례만 덮어써도 묶음·모든 그룹이 보임', r5);
  /* 복사해서 담기 — 새 그룹 저장과 같은 칸 + copiedFrom */
  const r6 = await p.evaluate(async (fid) => { const r = await bkfCopyGroup('gD', '그룹 라 (사본)', { fid }); const v = (window.__FS.prd_price_batches || {})[r.id] || {}; return { r, keys: Object.keys(v).sort(), v: JSON.parse(JSON.stringify(v)), inF: S.bkfold.folds[fid].gids, local: !!S.prBatches.find((b) => b.id === r.id), srcOn: batchIsOn('gD') }; }, fid);
  ok(!r6.r.err && r6.keys.join() === ['by', 'cond', 'copiedFrom', 'createdAt', 'lastCount', 'lastKeys', 'lastRunAt', 'name', 'uploadedAt', 'writerSchema'].join() && r6.v.cond.name === '그룹 라 (사본)' && r6.v.copiedFrom.gid === 'gD', '복사 = 손으로 만든 새 그룹과 같은 칸 + copiedFrom(고른 것·결정·휴지통·감시는 옮기지 않음)', r6);
  ok(r6.inF.includes(r6.r.id) && r6.local && r6.srcOn, '복사본은 묶음에 담기고 그룹 목록에 바로 보임 · 원본은 켜진 그대로', r6);
  ok((await p.evaluate(() => bkfCopyGroup('b_chk1109', 'x'))).err === '보기 전용 그룹은 복사하지 않습니다', '보기 전용 그룹은 복사하지 않음');
  /* 두 저장이 겹쳐도 한 그룹은 한 묶음 */
  const r7 = await p.evaluate(async (fid) => { const a = await bkfTx({ t: 'new', name: '가을' }); await Promise.all([bkfTx({ t: 'put', fid, gids: ['gC'] }), bkfTx({ t: 'put', fid: a.fid, gids: ['gC'] })]); const v = window.__FS.prd_price_batches._bkfold; return { a: a.fid, n: Object.values(v.folds).filter((f) => f.gids.includes('gC')).length, inB: v.folds[a.fid].gids }; }, fid);
  ok(r7.n === 1 && r7.inB.join() === 'gC', '두 저장이 겹쳐도(이 기기 줄 세움 + 트랜잭션) 한 그룹은 한 묶음 — 나중 것', r7);
  /* 겹침 검사 — 띠 숫자 = 교집합 · 휴지통은 빠짐 · 보류는 남음 */
  const r8 = await p.evaluate(async (fid) => { S.pmLoaded = true; S.sellersLoaded = true; const g = (id) => S.prBatches.find((b) => b.id === id); const mem = (id) => { const b = g(id); const c = { ...BATCH_DEF, ...b.cond }; if (!c.coef) c.coef = { ...window.ReadnowPricing.DEFAULTS.gradeCoef }; return bkfMembers(c, id, b).keys; };
    const inter = () => { const c = new Map(); for (const id of S.bkfold.folds[fid].gids) for (const k of new Set(mem(id))) c.set(k, (c.get(k) || 0) + 1); return [...c.values()].filter((n) => n > 1).length; }; /* 두 그룹 이상에 든 상품 수 */
    const wait = async () => { for (let i = 0; i < 60; i++) { const C = (S._bkfC || {})[fid]; if (C && C.sig === bkfSig(bkfGroups(fid))) return C; bkfScan(fid); await new Promise((r) => setTimeout(r, 100)); } return null; };
    const C1 = await wait(); const e1 = inter(); const k = mem('gA')[0]; const oth = S.bkfold.folds[fid].gids.filter((x) => x !== 'gB').map(g); /* gB 말고 모두의 휴지통에 넣으면 그 상품은 gB에만 남음 → 겹침 하나 줄어듦 */ for (const b of oth) b.trashed = { ...(b.trashed || {}), [k]: { at: new Date().toISOString() } }; const C2 = await wait(); const e2 = inter();
    for (const b of oth) { delete b.trashed[k]; b.held = { [k]: { at: new Date().toISOString() } }; } const C3 = await wait(); const e3 = inter(); for (const b of oth) b.held = {};
    return { n1: C1 && C1.n, e1, n2: C2 && C2.n, e2, n3: C3 && C3.n, e3, mA: mem('gA').length, pairs: C1 && C1.pairs.length, mk: (document.querySelector(`[data-bkfmk="${fid}"]`) || {}).textContent }; }, fid);
  ok(r8.mA > 0 && r8.n1 === r8.e1 && r8.n1 > 0, '겹침 수 = 그룹들 대상 상품의 교집합(묶음 칸 표식에도)', r8);
  ok(r8.n2 === r8.e2 && r8.n2 === r8.n1 - 1, '휴지통에 넣은 상품은 겹침에서 빠짐', r8);
  ok(r8.n3 === r8.n1, '보류한 상품은 겹침에 남음(보류는 가격만 멈춤)', r8);
  ok(/겹침/.test(r8.mk || ''), '상품 탭 📁 칸에 「겹침 n」 표식', r8.mk);
  /* 📁 묶음 화면 */
  await p.evaluate(async (fid) => { openBkfold(fid); await new Promise((r) => setTimeout(r, 300)); }, fid);
  for (let i = 0; i < 60; i++) { if (await p.evaluate(() => { const t = (document.querySelector('[data-bkfband]') || {}).textContent || ''; return !/검사 중/.test(t) && /충돌|문제 없음/.test(t); })) break; await W(p, 150); }
  const r9 = await p.evaluate((fid) => ({ band: (document.querySelector('[data-bkfband]') || {}).textContent || '', rows: [...document.querySelectorAll('#bkf_scr .bkf-glist > [data-bkf]')].map((x) => x.dataset.bkf), det: S.detail && S.detail.bkfold, n: S._bkfC[fid].n }), fid);
  ok(r9.det === fid && r9.rows.join() === 'gA,gB,' + r6.r.id && r9.band.replace(/,/g, '').includes('충돌 ' + r9.n) && /↔/.test(r9.band), "📁 묶음 화면 = 안의 그룹 줄 · 띠 「⛔ 충돌 n개 — 그룹↔그룹 …」", r9);
  ok(/곧 겹칠|묶음 밖|검사/.test(r9.band), '띠에 숨은 겹침·묶음 밖 겹침·검사 시각 줄', r9.band);
  await p.locator('#bkf_scr [data-bkfgo="gB"]').click(); await W(p, 200); ok(await p.evaluate(() => window.__OPEN.join() === 'gB'), '그룹 이름을 누르면 그 그룹 화면');
  await p.evaluate(async () => { history.back(); await new Promise((r) => setTimeout(r, 300)); });
  /* 묶음만 풀기 — 열쇠가 안 남음 */
  await p.evaluate(async (fid) => { if (!(S.detail && S.detail.bkfold)) { openBkfold(fid); await new Promise((r) => setTimeout(r, 300)); } window.__PQ.push('5'); await bkfMenu(fid); await new Promise((r) => setTimeout(r, 500)); }, fid);
  const d9 = await doc(p); ok(!(fid in (d9.folds || {})) && d9.order.includes('gA') && d9.order.includes('gB') && !d9.order.includes('f:' + fid) && d9.foldsGone && d9.foldsGone[fid], '「묶음만 풀기」 = 묶음 열쇠가 남지 않음 · 그룹은 맨 위 줄로 · 기록은 foldsGone', d9);
  ok(await p.evaluate(() => !(S.detail && S.detail.bkfold)), '연 묶음을 풀면 화면이 그룹 줄로 돌아감');
  /* 보관 — 안의 그룹도 함께 · 풀면 함께 보관한 것만 */
  const r10 = await p.evaluate(async (b) => { window.__PQ.push('4'); await bkfMenu(b); const a1 = ['gC'].map((id) => S.prBatches.find((x) => x.id === id).archived); const f1 = JSON.parse(JSON.stringify(S.bkfold.folds[b])); window.__PQ.push('4'); await bkfMenu(b); const a2 = S.prBatches.find((x) => x.id === 'gC').archived; return { a1, f1, a2, srv: (window.__FS.prd_price_batches.gC || {}).archived }; }, r7.a);
  ok(r10.a1[0] === true && r10.f1.archived && r10.f1.archGids.join() === 'gC' && r10.a2 === false && r10.srv === false, '📁 보관 = 안의 그룹도 보관 · 보관 풀기 = 함께 보관한 그룹만 꺼냄', r10);
  const W9 = await p.evaluate(() => (window.__FSW || []).map((w) => w.n)); ok(!W9.includes('prd_price_decisions'), '묶음 일은 가격 결정 문서를 한 번도 쓰지 않음', [...new Set(W9)]);
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음 — 웹앱 확인 창만', dlg);
  console.log(bad ? `❌ tBKFOLD2_1117 ${bad}개 실패` : '✓ tBKFOLD2_1117 통과'); process.exitCode = bad ? 1 : 0; });
