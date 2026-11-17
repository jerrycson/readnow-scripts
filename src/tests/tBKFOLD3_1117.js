// tBKFOLD3_1117 — (정범님 11/17 I-1117-1318-08 · 설계안 BKFOLD_DESIGN_1117 판 ③) 📁 묶음 겹친 두 그룹 진단 · 칸 하나 고침 · 겹친 상품만 한 그룹에서 빼기 · 되돌리기 — 가격을 바꾸는 코드 0줄
//  ① 순수 셈: 고침 후보(범위·목록·대상 고정·같은 조건·다른 점) · 앞뒤 바뀐 범위 · 이름표(같은 결과·한쪽만·엇갈림) · 남길 그룹
//  ② 화면: 칸마다 batchFilter와 같은 셈 · 진단 숫자 = 고친 뒤 실제로 다시 센 값 · 고치면 ✅ · 되돌리면 다시 ⛔ · 고침 기록 모양 · 「모두 되돌리기」는 묶음에서 뺀 것만(손으로 뺀 것은 그대로)
//        「같은 결과」도 충돌로 셈(이름표만) · 조건으로 못 가르는 경우 · 그 칸으로 가기 · 브라우저 창 없음 · 가격 결정 문서 안 씀
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD3_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const blk = cut('/* ◆bkfold 시작', '/* ◆bkfold 끝 */');
  const F = new Function(blk + '\nreturn { BKF_DIM, bkfCands, bkfSelfBad, bkfTag, bkfKeepOf, bkfSameCond, bkfBound, bkfStepV, bkfDimHas };')();
  const D0 = { pmin: '', pmax: '', grades: [], src: [], only: [], kw: '', rankMax: '', copiesMin: '', regFrom: '', regTo: '', ageMin: '', ageMax: '' };
  const C = (o) => ({ ...D0, ...o });
  /* 범위 — 두 범위가 안 겹치게 한쪽 끝을 다른 쪽 끝 바로 옆으로 */
  let R = F.bkfCands(C({ pmin: 5000, pmax: 9000 }), C({ pmin: 7000, pmax: 12000 }));
  const P = R.cands.filter((x) => x.dim === 'price').map((x) => `${x.side}.${x.key}=${x.to}`).sort();
  ok(P.join() === ['a.pmax=6999', 'b.pmin=9001'].join() && !R.same, '판매가 범위 = A 최대를 B 최소 바로 아래로 · B 최소를 A 최대 바로 위로', R.cands);
  R = F.bkfCands(C({ pmin: 5000 }), C({ pmax: 8000 })); ok(R.cands.some((x) => x.side === 'a' && x.key === 'pmin' && x.to === 8001) && R.cands.some((x) => x.side === 'b' && x.key === 'pmax' && x.to === 4999), '한쪽만 쓴 끝도 옆으로(빈 끝은 끝없음)', R.cands);
  R = F.bkfCands(C({ discMin: 10.5 }), C({ discMax: 40 })); ok(R.cands.some((x) => x.key === 'discMin' && x.to === 40.01) && R.cands.some((x) => x.key === 'discMax' && x.to === 10.49), '소수 칸은 0.01 단위', R.cands);
  R = F.bkfCands(C({ regFrom: '2026-10-12' }), C({ regTo: '2026-10-15' })); ok(R.cands.some((x) => x.key === 'regFrom' && x.to === '2026-10-16') && R.cands.some((x) => x.key === 'regTo' && x.to === '2026-10-11'), '등록일은 하루 단위', R.cands);
  R = F.bkfCands(C({ gapMax: 5 }), C({ gapMin: -10 })); ok(R.cands.some((x) => x.key === 'gapMax' && x.to === -10.01), '최저가 대비(%)는 음수 끝도 됨', R.cands);
  R = F.bkfCands(C({ usedMax: 3 }), C({ usedMin: 0 })); ok(!R.cands.some((x) => x.key === 'usedMax' && x.to < 0), '개수 칸은 음수로 안 감', R.cands);
  R = F.bkfCands(C({ pmax: 8000 }), C({ pmin: 1 })); ok(!R.cands.some((x) => x.key === 'pmax' && !(x.to > 0)), '판매가 최대는 0 이하로 안 감(0 = 끝없음)', R.cands);
  /* 목록 — 겹친 상품이 가진 값만 한쪽에서 뺌 */
  R = F.bkfCands(C({ grades: [] }), C({ grades: ['상', '중'] }), { vals: { grades: new Set(['상']), src: new Set() } });
  const G = R.cands.filter((x) => x.dim === 'grades'); ok(G.length === 2 && G.find((x) => x.side === 'a').to.join() === '최상,중,하' && G.find((x) => x.side === 'b').to.join() === '중' && G.every((x) => x.cut.join() === '상'), '상태 등급 = 겹친 상품의 등급만 한쪽에서 뺌(빈 목록 = 전부)', G);
  R = F.bkfCands(C({ grades: ['상'] }), C({ grades: ['상'] }), { vals: { grades: new Set(['상']) } }); ok(!R.cands.some((x) => x.dim === 'grades'), '다 빠지는 목록 고침은 내지 않음');
  /* 대상 고정 */
  R = F.bkfCands(C({ only: ['1', '2', '3'] }), C({ only: ['1'] }), { codes: new Set(['1']) });
  ok(R.cands.length === 1 && R.cands[0].op === 'only' && R.cands[0].side === 'a' && R.cands[0].to.join() === '2,3' && R.onlyEmpty.join() === 'b', '대상 고정 = 겹친 상품만 목록에서 뺌 · 다 빠지는 쪽은 onlyEmpty(휴지통 길로)', R);
  R = F.bkfCands(C({ only: ['1', '2'] }), C({ only: ['1', '2'] }), { codes: new Set(['1', '2']) }); ok(!R.cands.length && R.onlyEmpty.join() === 'a,b' && R.same, '대상 고정이 모두 겹치면 조건으로 못 가름', R);
  /* 같은 조건 · 다른 점 */
  ok(F.bkfCands(C({ pmin: 1000, kw: '가' }), C({ pmin: 1000, kw: '가' })).same && !F.bkfSameCond(C({ kw: '가' }), C({ kw: '나' })) && F.bkfSameCond(C({ grades: ['상', '중'] }), C({ grades: ['중', '상'] })), '같은 조건(목록 차례는 안 봄)');
  R = F.bkfCands(C({ kw: '가', rankMax: 3 }), C({ kw: '나', rankMax: '' })); ok(R.diffs.some((x) => x.key === 'kw') && R.diffs.some((x) => x.key === 'rankMax') && !R.cands.some((x) => x.key === 'rankMax'), '낱말 칸·한쪽에만 쓴 칸(우리 순위)은 「다른 점」만', R);
  ok(F.bkfSameCond(C({ exCtrl: undefined }), C({ exCtrl: true })) && !F.bkfSameCond(C({ exCtrl: false }), C({ exCtrl: true })), '켜고 끄기 칸 — 비어 있으면 켜짐과 같음(batchFilter처럼)');
  /* 앞뒤가 바뀐 범위 */
  const SB = F.bkfSelfBad(C({ pmin: 9000, pmax: 5000, ageMin: 3, ageMax: 9, regFrom: '2026-10-20', regTo: '2026-10-01' })); ok(SB.map((x) => x.dim).sort().join() === 'price,reg', '앞뒤가 바뀐 범위만 찾음', SB);
  ok(!F.bkfSelfBad(C({ pmin: 0, pmax: 5000 })).length && !F.bkfSelfBad(C({ pmin: 6000, pmax: 0 })).length, '판매가 0은 끝없음이라 바뀜 아님');
  /* 이름표 */
  const tg = (p, a, b) => { const t = F.bkfTag(p, a, b); return t.t + (t.opp ? '!' : ''); };
  ok(tg(1000, null, null) === 'same' && tg(1000, 1200, 1200) === 'same' && tg(1000, 1000, 1000) === 'same' && tg(1000, 1200, null) === 'one' && tg(1000, 1000, 900) === 'one' && tg(1000, 1200, 1300) === 'x' && tg(1000, 1200, 900) === 'x!', '이름표 = 같은 결과 · 한쪽만 바꿈 · 엇갈림(반대 방향 표시)');
  /* 남길 그룹 */
  ok(F.bkfKeepOf('k', [{ id: 'a', decided: { k: { at: '2026-11-01' } } }, { id: 'b', decided: { k: { at: '2026-11-05' } } }]) === 'b' && F.bkfKeepOf('k', [{ id: 'a' }, { id: 'b' }]) === 'a' && F.bkfKeepOf('k', []) === null, '남길 그룹 = 가장 늦게 확정한 그룹 · 없으면 앞 그룹');
  ok(F.BKF_DIM.length === 17 && new Set(F.BKF_DIM.map((d) => d.id)).size === 17, '조건 칸 17개 · 이름 겹침 없음');
  const io = cut('/* ◆bkfold-io 시작', '/* ◆bkfold-io 끝 */');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(io + blk) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(io + blk), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  ok(!/prd_price_decisions|batchApply|approvalState|applyPrice|batchRun\(|prPush/.test(io + blk), '가격을 바꾸는 코드 0줄(결정 문서·실행 함수를 안 부름)');
  const names = ['BKF_DIM', 'BKF_TXT', 'bkfN0', 'bkfNz', 'bkfNv', 'bkfDimHas', 'bkfBound', 'bkfStepV', 'bkfSameCond', 'bkfCands', 'bkfSelfBad', 'bkfTag', 'bkfKeepOf', 'bkfCond', 'bkfSt', 'bkfX', 'bkfCause', 'bkfPairKey', 'bkfPairRun', 'bkfTgOf', 'BKF_TAGH', 'bkfPairHtml', 'bkfFixList', 'bkfFixHtml', 'bkfBadHtml', 'bkfPP', 'bkfMirror', 'bkfCondFix', 'bkfCondUndo', 'bkfTrash', 'bkfUntrash', 'bkfUndoAll', 'bkfDirtyAll', 'bkfGoField', 'bkfPairBind', 'bkfDOf', 'bkfCid', 'bkfCut', 'bkfReG'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD3_1117 ${bad}개 실패` : '✓ tBKFOLD3_1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await W(p, 500);
  const fid = await p.evaluate(async () => { window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); }; window.prompt = () => null; window.confirm = () => true;
    if (!S.user) S.user = { email: 't@x', uid: 't' };
    /* 상품을 더함 — 판매가 7000~8750(그룹 가·나가 겹치는 곳) · 등급·매입처·책 섞음 · 같은 책 여럿(bk5) */
    for (let i = 0; i < 8; i++) { const uc = 'U3300000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(505935000 + i), title: '더한 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중', '하'][i % 4], status: '판매중', active: true, sku: ['AAA_hd', 'BBB', 'CCC_ms'][i % 3], registeredAt: '2026-09-0' + (i + 1) + 'T09:00:00', bookId: i >= 6 ? 'bk5' : 'bx' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (n % 7 === 0) continue; /* 몇 권은 책 정보·시장 자료가 없음 */ if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 9000 + n * 900, pubDate: String(1995 + n) + '-03-01' });
      const P1 = [{ usedCode: 'OTH' + n, grade: l.grade, price: l.price - 400 + n * 60, sellerCode: '1', listingId: '9' + n }, { usedCode: 'OTB' + n, grade: '하', price: 3000 + n, sellerCode: '2', listingId: '8' + n }]; if (n % 3) P1.splice(n % 2, 0, { usedCode: l.usedCode, grade: l.grade, price: l.price, sellerCode: '996008', listingId: l.listingId });
      if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { usedFirstPage: P1, usedTotal: n + 1, salesPoint: n % 5 ? n * 37 : null, commentCount: n % 4, reviewCount: n % 6, rating: n % 5 ? 6 + (n % 5) : null, lastCheckedAt: new Date().toISOString() }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const now = new Date().toISOString(); const put = (id, name, c) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, ...c, name }, createdAt: now, lastRunAt: now, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0 });
    await put('gA', '그룹 가', { pmin: 5000, pmax: 9000, recentDays: 0 }); await put('gB', '그룹 나', { pmin: 7000, pmax: 12000, recentDays: 0 });
    await put('gE', '그룹 마', { only: ['U215983410', 'U215983411'], recentDays: 0 }); await put('gF', '그룹 바', { only: ['U215983410', 'U215983411'], recentDays: 0 });
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gF'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '겹침 시험' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['gA', 'gB'] }); const b = await bkfTx({ t: 'new', name: '대상 고정 시험' }); await bkfTx({ t: 'put', fid: b.fid, gids: ['gE', 'gF'] }); window.__F2 = b.fid; return a.fid; });
  /* ⓐ 칸마다 batchFilter와 같은 셈 */
  const par = await p.evaluate(() => { const X = bkfX(); const base = { ...BATCH_DEF, recentDays: 0, exCtrl: false, exPx: false, exHold: false, exControl: false, exExcl: false, exSolo: false, rndPct: 0 };
    const L = [...S.plist.values()].filter((l) => l.status === '판매중' && l.usedCode); const ids = (A) => A.map((l) => l.usedCode).sort().join();
    const r = { base: ids(batchFilter(base, 'zz')) === ids(L), n: L.length, bad: [], tried: 0, hits: 0 };
    for (const d of BKF_DIM) { let conds = [];
      if (d.set) conds = d.id === 'grades' ? [['상'], ['최상', '하']].map((v) => ({ grades: v })) : [['hd'], ['ms', 'etc']].map((v) => ({ src: v }));
      else if (d.id === 'rank') conds = [{ rankMax: 1 }, { rankMax: 2 }]; else if (d.id === 'copies') conds = [{ copiesMin: 2 }, { copiesMin: 3 }];
      else if (d.kind === 'd') conds = [{ regFrom: '2026-10-12' }, { regTo: '2026-10-15' }, { regFrom: '2026-09-03', regTo: '2026-10-13' }];
      else { const vs = L.map((l) => d.val(l, X)).filter((v) => v != null).sort((x, y) => x - y); if (!vs.length) { r.bad.push(d.id + ' 값 없음'); continue; } const q = (f) => Math.round(vs[Math.floor((vs.length - 1) * f)] * 100) / 100;
        conds = [{ [d.lo]: q(0.3) }, { [d.hi]: q(0.6) }, { [d.lo]: q(0.25), [d.hi]: q(0.75) }]; }
      for (const o of conds) { const c = { ...base, ...o }; r.tried++; const A = ids(batchFilter(c, 'zz')); const B = ids(L.filter((l) => bkfDimHas(d, c, l, X))); if (A !== B) r.bad.push({ d: d.id, o, A, B }); const k = A ? A.split(',').length : 0; if (k > 0 && k < L.length) r.hits++; } }
    return r; });
  ok(par.base && par.n >= 15, '기본 조건 = 판매 중 상품 전부(비교 바탕)', par);
  ok(!par.bad.length && par.tried >= 45, `칸 17개 × 끝값 여러 개(${par.tried}가지) — 칸 하나 셈이 batchFilter와 같음`, par.bad);
  ok(par.hits >= par.tried * 0.6, '시험 조건 대부분이 실제로 상품을 가름(빈 시험이 아님)', par);
  /* ⓑ 묶음 화면 → 겹친 쌍 단추 → 진단 */
  await p.evaluate(async (fid) => { openBkfold(fid); await new Promise((r) => setTimeout(r, 300)); }, fid);
  const band = () => p.evaluate(() => (document.querySelector('[data-bkfband]') || {}).textContent || '');
  const until = async (fn, n) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  await until(() => !!document.querySelector('#bkf_scr [data-bkfpair]'));
  const b0 = await band(); ok(/충돌 \d/.test(b0) && /↔/.test(b0) && await p.evaluate(() => document.querySelector('[data-bkfpair]').tagName === 'BUTTON'), '띠의 겹친 쌍은 누를 수 있는 단추', b0);
  await p.locator('#bkf_scr [data-bkfpair]').first().click();
  const D = await until(() => { const D = S._bkfD; const O = S._bkfOpen; return D && O && bkfCut(D.key) === bkfCut(bkfPairKey(O.fid, O.a, O.b)) && document.querySelector('#bkf_pp .bkf-cand') ? JSON.parse(JSON.stringify({ K: D.K, n0: D.n0, cands: D.cands, why: D.why, a: O.a, b: O.b })) : null; }, 100);
  ok(D && D.K.length >= 3 && D.cands.length >= 2, '쌍 단추 → 진단(겹친 상품 · 고침 후보)', D && { K: D.K.length, c: D.cands.length });
  if (!D) { console.log('❌ 진단이 안 나옴 — 멈춤'); process.exitCode = 1; return; }
  const pp = await p.evaluate(() => document.getElementById('bkf_pp').textContent);
  ok(pp.includes(`겹친 상품 ${D.K.length}개`) && /겹치는 까닭/.test(pp) && D.why.some((w) => w.lbl === '판매가') && /같은 결과|한쪽만 바꿈|가격이 엇갈림/.test(pp), '진단 화면 = 겹친 수 · 겹치는 까닭(칸마다 범위) · 상품 줄마다 이름표', pp.slice(0, 400));
  const c0 = D.cands[0]; ok(c0.left === 0 && c0.solved === D.K.length, '맨 위 후보 = 겹침을 모두 푸는 길', c0);
  ok(D.cands.every((c, i) => !i || (D.cands[i - 1].left ? 1 : 0) <= (c.left ? 1 : 0)), '다 푸는 길이 먼저', D.cands.map((c) => [c.key, c.left, c.gone, c.lost]));
  /* 상품 자료가 바뀌어도(다시 세는 중) 진단·단추는 그대로 · 다 세면 새 진단 */
  const st = await p.evaluate(() => { const D0 = S._bkfD; window.__D0at = D0.at; S.dv.p++; S._bkfPPh = null; bkfPP(S._bkfOpen.fid); const t = document.getElementById('bkf_pp').textContent; return { kept: !!document.querySelector('#bkf_pp [data-bkffix]'), note: /다시 세는 중/.test(t), was: D0.key }; });
  ok(st.kept && st.note, '상품 자료가 바뀌면 옛 진단을 그대로 보이며 다시 셈(단추가 사라지지 않음)', st);
  ok(await until(() => S._bkfD && S._bkfD.at > window.__D0at && !!document.querySelector('#bkf_pp [data-bkffix]'), 100), '다 세면 새 진단으로 바뀜(자료가 잇따라 바뀌어도 5초에 한 번만 다시 셈)');
  /* 다른 곳이 그룹 목록을 비우면(확인용 그룹 심기·그룹 지우기) 묶음 화면이 다시 불러와 다시 그림 */
  const rg = await p.evaluate(() => { S.prBatches = undefined; S._bkfPPh = null; bkfPP(S._bkfOpen.fid); return document.getElementById('bkf_pp').textContent; });
  ok(/다시 불러오는 중/.test(rg) || !!(await p.evaluate(() => document.querySelector('#bkf_pp [data-bkffix]'))), '그룹 목록이 비면 「다시 불러오는 중」(「없습니다」로 잘못 말하지 않음)', rg.slice(0, 80));
  ok(await until(() => Array.isArray(S.prBatches) && !!document.querySelector('#bkf_pp [data-bkffix]') && /그룹 가/.test(document.getElementById('bkf_scr').textContent), 100), '다시 불러오면 진단·단추가 돌아옴');
  /* ⓒ 「같은 결과」 이름표 — 같아도 충돌로 셈(막는 일은 판 ⑦) */
  const tg = await p.evaluate(() => { const o = window.batchCompute; const run = (f) => { window.batchCompute = f; S._bkfD.tg = {}; S._bkfPPh = null; bkfPP(S._bkfOpen.fid); const t = document.querySelector('#bkf_pp .bkf-tb tbody'); return { ts: t.querySelectorAll('.bkf-ts').length, to: t.querySelectorAll('.bkf-to').length, tx: t.querySelectorAll('.bkf-tx').length, opp: /반대 방향/.test(t.textContent), rows: t.querySelectorAll('tr').length }; };
    const A = S._bkfOpen.a; const isA = (c) => +c.pmax === +S.prBatches.find((g) => g.id === A).cond.pmax && +c.pmin === +S.prBatches.find((g) => g.id === A).cond.pmin;
    const r = { same: run((c, rows) => rows.map((l) => ({ target: l.price }))), one: run((c, rows) => rows.map((l) => ({ target: isA(c) ? l.price + 500 : l.price }))), x: run((c, rows) => rows.map((l) => ({ target: isA(c) ? l.price + 500 : l.price - 500 }))), band: (document.querySelector('[data-bkfband]') || {}).textContent };
    window.batchCompute = o; S._bkfD.tg = {}; S._bkfPPh = null; bkfPP(S._bkfOpen.fid); return r; });
  ok(tg.same.ts === tg.same.rows && tg.same.rows === D.K.length && /충돌 \d/.test(tg.band), '두 그룹 결과가 같아도 충돌로 셈 · 줄마다 「같은 결과」 이름표', tg);
  ok(tg.one.to === tg.one.rows && tg.x.tx === tg.x.rows && tg.x.opp, '「한쪽만 바꿈」 · 「가격이 엇갈림 · 반대 방향」', tg);
  /* ⓓ 이대로 고치기(두 번 누름) → 실제 다시 센 값 = 진단 숫자 → ✅ */
  const before = await p.evaluate((g) => bkfMembers(bkfCond(S.prBatches.find((x) => x.id === g)), g, bkfSt(S.prBatches.find((x) => x.id === g))).keys.length, c0.gid);
  await p.locator('#bkf_pp [data-bkffix]').first().click(); await W(p, 550); ok(await p.evaluate(() => /한 번 더/.test(document.querySelector('#bkf_pp [data-bkffix]').textContent)), '첫 누름은 「한 번 더」(바로 안 바뀜)');
  ok(await p.evaluate(() => { const b0 = document.querySelector('#bkf_pp [data-bkffix]'); S._bkfPPh = 'x'; bkfPP(S.detail.bkfold); const b1 = document.querySelector('#bkf_pp [data-bkffix]'); return b0 !== b1 && /한 번 더/.test(b1.textContent) && b1.classList.contains('ux2-armed'); }), '기다리는 사이 다시 그려져도 「한 번 더」 상태가 새 단추로 옮겨 감');
  await p.locator('#bkf_pp [data-bkffix]').first().click();
  const after = await until(() => { const fid = S.detail && S.detail.bkfold; const C = (S._bkfC || {})[fid]; return C && C.sig === bkfSig(bkfGroups(fid)) ? { n: C.n } : null; }, 100);
  const srv = await p.evaluate((g) => JSON.parse(JSON.stringify(window.__FS.prd_price_batches[g])), c0.gid);
  const now1 = await p.evaluate((g) => bkfMembers(bkfCond(S.prBatches.find((x) => x.id === g)), g, bkfSt(S.prBatches.find((x) => x.id === g))).keys.length, c0.gid);
  ok(+srv.cond[c0.key] === +c0.to && srv.cond.pmin !== undefined, `서버 조건 = 그 칸 하나만 바뀜(${c0.key} → ${c0.to})`, srv.cond);
  ok(after && after.n === c0.n1 && now1 === before - c0.solved - c0.lost, '고친 뒤 실제로 다시 센 값 = 진단이 말한 숫자(묶음 충돌 · 빠지는 상품)', { after, c0: { n1: c0.n1, solved: c0.solved, lost: c0.lost }, before, now1 });
  const e1 = (srv.condLog || []).slice(-1)[0] || {}; ok(e1.at && e1.by && Array.isArray(e1.changed) && e1.changed.length === 1 && e1.fold === fid && e1.why === '묶음 겹침 풀기' && JSON.stringify(Object.keys(e1.next)) === JSON.stringify([c0.key]) && String(e1.prev[c0.key]) === String(c0.from), '고침 기록(condLog) = 언제·누가·바뀐 칸·묶음·전/후 값', e1);
  ok(await until(() => /문제 없음/.test((document.querySelector('[data-bkfband]') || {}).textContent || '') && /이제 겹치지 않습니다/.test(document.getElementById('bkf_pp').textContent)), '고친 뒤 띠 ✅ · 진단 「이제 겹치지 않습니다」', await band());
  ok(await p.evaluate(() => !!document.querySelector('#bkf_pp .bkf-fix [data-bkfundo]')), '「최근 고침」 카드에 되돌리기 단추');
  /* ⓔ 되돌리기 → 다시 ⛔ */
  await p.locator('#bkf_pp [data-bkfundo]').first().click(); await W(p, 550); await p.locator('#bkf_pp [data-bkfundo]').first().click();
  ok(await until(() => /충돌 \d/.test((document.querySelector('[data-bkfband]') || {}).textContent || ''), 100), '되돌리면 띠가 다시 ⛔ 충돌', await band());
  const srv2 = await p.evaluate((g) => JSON.parse(JSON.stringify(window.__FS.prd_price_batches[g])), c0.gid); const e2 = srv2.condLog.slice(-1)[0];
  ok(String(srv2.cond[c0.key]) === String(c0.from) && e2.undo === e1.at && e2.why === '묶음 고침 되돌리기', '되돌림 = 옛 값으로 · 되돌림 기록이 앞 기록을 가리킴', { c: srv2.cond[c0.key], e2 });
  ok(await until(() => /되돌림/.test((document.querySelector('#bkf_pp .bkf-fix') || {}).textContent || '')), '「최근 고침」에 「되돌림」 표시');
  /* ⓕ 겹친 상품만 빼기 — 손으로 뺀 것·고른 가격 준비 */
  const prep = await p.evaluate(async () => { const O = S._bkfOpen; const gA = S.prBatches.find((g) => g.id === O.a); const D = S._bkfD; const k1 = D.K[0];
    const mine = bkfMembers(bkfCond(gA), gA.id, bkfSt(gA)).keys.find((k) => !D.K.includes(k)); await batchSave(gA.id, { trashed: { [mine]: { at: new Date().toISOString(), by: 't', from: 'list' } }, picks: { [k1]: { price: 7777, at: new Date().toISOString(), by: 't' } } });
    gA.trashed = { ...(gA.trashed || {}), [mine]: { at: 'x', by: 't', from: 'list' } }; gA.picks = { ...(gA.picks || {}), [k1]: { price: 7777 } }; bkfDirtyAll(O.fid); return { mine, k1, a: O.a }; });
  await until(() => !!(S._bkfD && document.querySelector('#bkf_pp [data-bkfrm="a"]')), 100);
  await p.locator('#bkf_pp [data-bkfrm="a"]').click(); await W(p, 550); await p.locator('#bkf_pp [data-bkfrm="a"]').click();
  ok(await until(() => /문제 없음/.test((document.querySelector('[data-bkfband]') || {}).textContent || ''), 100), "'그룹 가'에서 겹친 상품 빼기 → 띠 ✅", await band());
  const s3 = await p.evaluate((a) => { const v = window.__FS.prd_price_batches; const sh = Object.entries(v).filter(([id, x]) => x && x.shardOf === a).map(([, x]) => x); const tr = Object.assign({}, ...sh.map((x) => x.trashed || {})); const pk = Object.assign({}, ...sh.map((x) => x.picks || {})); return JSON.parse(JSON.stringify({ tr, pk, log: (v[a].listLog || []).slice(-1)[0] })); }, prep.a);
  const ft = Object.entries(s3.tr).filter(([, v]) => v.why === 'fold'); ok(ft.length === D.K.length && ft.every(([, v]) => v.fold === fid && v.from === 'fold' && v.keep === D.b && v.at && v.by), "뺀 상품 = 그 그룹 🗑 휴지통(까닭 'fold' · 묶음 · 남긴 그룹)", ft.slice(0, 2));
  ok(s3.tr[prep.k1] && s3.tr[prep.k1].pick === 7777 && !s3.pk[prep.k1], '고른 가격은 휴지통 기록에 남기고 고른 칸에서는 지움', { tr: s3.tr[prep.k1], pk: s3.pk[prep.k1] });
  ok(s3.log && s3.log.what === 'trash' && s3.log.from === 'fold' && s3.log.n === D.K.length && s3.log.fold === fid, '그룹 기록(listLog)에 한 줄', s3.log);
  /* ⓖ 모두 되돌리기 — 묶음에서 뺀 것만 · 손으로 뺀 것은 그대로 · 고른 가격 되살림 */
  await until(() => !!document.querySelector('#bkf_pp [data-bkfundoall]'));
  await p.locator('#bkf_pp [data-bkfundoall]').click(); await W(p, 550); await p.locator('#bkf_pp [data-bkfundoall]').click();
  ok(await until(() => /충돌 \d/.test((document.querySelector('[data-bkfband]') || {}).textContent || ''), 100), '모두 되돌리면 다시 ⛔', await band());
  const s4 = await p.evaluate((a) => { const v = window.__FS.prd_price_batches; const sh = Object.entries(v).filter(([id, x]) => x && x.shardOf === a).map(([, x]) => x); return JSON.parse(JSON.stringify({ tr: Object.assign({}, ...sh.map((x) => x.trashed || {})), pk: Object.assign({}, ...sh.map((x) => x.picks || {})) })); }, prep.a);
  ok(!Object.values(s4.tr).some((v) => v.why === 'fold') && s4.tr[prep.mine] && s4.tr[prep.mine].from === 'list', '모두 되돌리기 = 묶음에서 뺀 것만 꺼냄 · 손으로 뺀 상품은 휴지통에 그대로', s4.tr);
  ok(s4.pk[prep.k1] && s4.pk[prep.k1].price === 7777 && s4.pk[prep.k1].why === '묶음 되돌리기', '뺄 때 있던 고른 가격을 되살림', s4.pk[prep.k1]);
  /* ⓗ 조건으로 못 가르는 경우(대상 고정이 모두 겹침 · 조건이 똑같음) */
  const f2 = await p.evaluate(() => window.__F2); await p.evaluate(async (f2) => { history.back(); await new Promise((r) => setTimeout(r, 300)); openBkfold(f2); await new Promise((r) => setTimeout(r, 300)); }, f2);
  await until(() => !!document.querySelector('#bkf_scr [data-bkfpair]'), 100); await p.locator('#bkf_scr [data-bkfpair]').first().click();
  const pp2 = await until(() => { const t = (document.getElementById('bkf_pp') || {}).textContent || ''; return /겹친 상품 \d/.test(t) ? t : null; }, 100);
  ok(pp2 && /조건이 똑같습니다/.test(pp2) && /조건으로는 못 가릅니다/.test(pp2) && /한 칸으로는 가를 수 없습니다/.test(pp2) && await p.evaluate(() => !document.querySelector('#bkf_pp [data-bkffix]') && !!document.querySelector('#bkf_pp [data-bkfrm="keep"]')), '못 가르는 경우 = 까닭을 말하고 「빼기」 길만', (pp2 || '').slice(0, 300));
  /* ⓘ 그 칸으로 가기 — 그룹 화면의 그 조건 칸을 펼쳐 보여 줌 */
  await p.evaluate(async (fid) => { history.back(); await new Promise((r) => setTimeout(r, 300)); openBkfold(fid); await new Promise((r) => setTimeout(r, 300)); }, fid);
  await until(() => !!document.querySelector('#bkf_scr [data-bkfpair]'), 100); await p.locator('#bkf_scr [data-bkfpair]').first().click(); await until(() => !!document.querySelector('#bkf_pp [data-bkfgof]'), 100);
  const key0 = await p.evaluate(() => S._bkfD.cands[0].key); await p.locator('#bkf_pp [data-bkfgof]').first().click();
  const hit = await until(() => { const h = document.querySelector('.bkf-hit'); return h ? { has: !!h.querySelector(`[data-bf="${S._bkfD ? S._bkfD.cands[0].key : ''}"]`) || h.matches('[data-bf]'), vis: h.getBoundingClientRect().height > 0 } : null; }, 40);
  ok(hit && hit.has && hit.vis, `「그 칸으로 가기」 = 그룹 화면의 「${key0}」 칸을 펼쳐 표시`, hit);
  const W9 = await p.evaluate(() => (window.__FSW || []).map((w) => w.n)); ok(!W9.includes('prd_price_decisions'), '가격 결정 문서를 한 번도 쓰지 않음', [...new Set(W9)]);
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음 — 웹앱 확인 창만', dlg);
  console.log(bad ? `❌ tBKFOLD3_1117 ${bad}개 실패` : '✓ tBKFOLD3_1117 통과'); process.exitCode = bad ? 1 : 0; });
