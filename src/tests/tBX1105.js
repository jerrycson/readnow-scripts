// tBX1105 — 정범님 11/05: 🎯 집중 벤치마킹 판매자 상세 › 회차별 기록에서 회차를 골라 「📉 통계에서 빼기」/「↩ 다시 넣기」
//  두 번 누르기(판매자·회차 때 표시) · 문서는 지우지 않음(excl·exclBy·exclAt·exclWhy·exclLog) · 상세·종합(benchAgg) 수치가 곧바로 바뀜 · 다시 넣으면 원래 수치
//  다른 기기(구독 exclRev) · 팝업 없음 · 클라우드 셈 함수(benchRunUse·benchExclRuns)도 뺀 회차를 뺌
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
/* ① 클라우드 — 원본 cloud/index.js에서 benchRunUse·benchExclRuns를 떼어 가짜 db로 */
{ const cands = [path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js')]; const f = cands.find((x) => fs.existsSync(x)); const src = fs.readFileSync(f, 'utf8');
  const a = src.indexOf('function benchRunUse('), b = src.indexOf('async function benchObs('); ok(a > 0 && b > a, '클라우드: benchRunUse·benchExclRuns 함수가 있음');
  const docs = [{ sc: '222', excl: true, goneList: [JSON.stringify(['900', '책', 1000]), JSON.stringify(['901', '책2', 2000])] }, { sc: '333', excl: true, goneList: [['50', 't', 1]] }];
  const C = (n) => ({ where: (k, op, v) => ({ select: () => ({ get: async () => { const L = n === 'bench_days' && k === 'excl' && op === '==' && v === true ? docs : []; return { forEach: (fn) => L.forEach((x) => fn({ data: () => x })) }; } }) }) });
  const M = new Function('C', 'log', src.slice(a, b) + '\nreturn { benchRunUse, benchExclRuns };')(C, () => {});
  const use = M.benchRunUse; const r0 = { sc: '222', spanDays: 1, complete: true, full: true };
  ok(use(r0) && !use({ ...r0, excl: true }) && use({ ...r0, excl: false }) && !use({ ...r0, base: true }) && !use({ ...r0, complete: false }) && !use({ ...r0, spanDays: 0 }), '클라우드: 뺀 회차(excl:true)는 셈에 안 씀 · 다시 넣은 회차(excl:false)는 씀 · 첫 바퀴·끝까지 못 읽음은 그대로 안 씀');
  M.benchExclRuns().then((ex) => { ok(ex.n === 2 && ex.gone.has('222_900') && ex.gone.has('222_901') && ex.gone.has('333_50') && ex.gone.size === 3, '클라우드: 뺀 회차가 확정한 사라짐(판매자_상품번호)을 모음 — 판매 표본·팔린 비율 연구에서 뺌'); });
  ok(/if \(!benchRunUse\(v\)\) return; win\.set/.test(src) && /if \(!benchRunUse\(v\) \|\| !\(\+v\.total > 0\)/.test(src) && /EX\.gone\.has\(/.test(src) && /BEX\.gone\.has\(d\.id\)/.test(src), '클라우드: 판매가치 엔진 학습(지켜본 날·사라짐)·최저가배지 연구·팔린 비율 연구가 뺀 회차를 거름'); }
require('/home/user/w/pw/harness.js')(async (p) => { await p.evaluate(require('/home/user/w/pw/seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; S.user = S.user || { email: 'tester@x' }; out.me = S.user.email;
    let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
    const ref = db.collection('app_settings').doc('bench'); await ref.set({ seed190: true, mig1105: true, targets: [{ sc: '222', name: '판매자이', on: true }], groups: [] });
    const run = (day, o) => ({ sc: '222', name: '판매자이', day, runAt: `${day}T00:05:00+09:00`, strict: 1, complete: true, cover: 1, pages: 10, runLastPage: 10, total: 100, ...o });
    const docs = { a: run('2026-10-20', { base: true }), b: run('2026-10-21', { add: 4, gone: 5, sumGone: 50000, sumAdd: 40000, spanDays: 1 }),
      c: run('2026-10-22', { add: 1, gone: 300, sumGone: 3000000, sumAdd: 10000, spanDays: 1, total: 3 }), // 명백히 잘못 수집(숍이 비어 보임)
      d: run('2026-10-23', { add: 3, gone: 4, sumGone: 40000, sumAdd: 30000, spanDays: 1 }), e: run('2026-10-24', { add: 2, gone: 2, sumGone: 20000, sumAdd: 20000, spanDays: 1 }) };
    for (const [k, v] of Object.entries(docs)) await db.collection('bench_days').doc('222_' + k).set(v);
    S._benchUn = undefined; S.bench = null; benchCfg(); await W(300); S.benchD = {};
    const sn = () => { const st = benchStats(S.benchD['222']); return { n: Math.round(st.n * 100) / 100, add: st.addN, gone: st.goneN, perGone: st.perDayGone != null ? Math.round(st.perDayGone * 100) / 100 : null, won: st.money && st.money.goneWonPerDay != null ? Math.round(st.money.goneWonPerDay) : null, total: st.total }; };
    const agg = () => { const r = benchAgg(true).rows.find((x) => String(x.t.sc) === '222'); return r && r.st ? r.st.goneN : null; };
    await benchLoad('222', true); out.s0 = sn(); out.a0 = agg();
    openBench('222'); await W(1500); let sh = document.getElementById('sheet');
    out.bar = !!sh.querySelector('.bxbar'); out.cks = sh.querySelectorAll('.bxck').length; out.rows0 = sh.querySelectorAll('tr[data-bxrow]').length;
    out.kpi0 = sh.querySelector('.mgrid.kpi') ? sh.querySelector('.mgrid.kpi').textContent : '';
    // 고르지 않고 누르면 안내만
    sh.querySelector('[data-bxdo="out"]').click(); await W(200); out.noSel = (await db.collection('bench_days').doc('222_c').get()).data().excl;
    // c 고르기 → 첫 번째 누름(무장) → 문서 그대로
    const ck = sh.querySelector('.bxck[data-bxid="222_c"]'); ck.checked = true; ck.dispatchEvent(new Event('change')); out.nSel = sh.querySelector('.bxn').textContent;
    sh.querySelector('.bxwhy').value = '숍이 비어 보임';
    const bo = sh.querySelector('[data-bxdo="out"]'); bo.click(); await W(200); out.armTxt = bo.textContent; out.armed = bo.classList.contains('armed'); out.afterOne = (await db.collection('bench_days').doc('222_c').get()).data().excl;
    bo.click(); await W(1200); const dc = (await db.collection('bench_days').doc('222_c').get()); out.doc1 = dc.exists ? dc.data() : null;
    out.s1 = sn(); out.a1 = agg(); sh = document.getElementById('sheet');
    const rc = sh.querySelector('tr[data-bxrow="222_c"]'); out.rowEx = rc ? { cls: rc.className, op: rc.style.opacity, txt: rc.textContent } : null; out.rows1 = sh.querySelectorAll('tr[data-bxrow]').length;
    out.card1 = !!sh.querySelector('.bxcard'); out.kpi1 = sh.querySelector('.mgrid.kpi') ? sh.querySelector('.mgrid.kpi').textContent : '';
    out.rev = ((await ref.get()).data() || {}).exclRev || null;
    // 다시 넣기: 📉 줄 고르기 → 두 번
    const ck2 = sh.querySelector('.bxck[data-bxid="222_c"]'); out.ck2ex = ck2 && ck2.dataset.bxex; ck2.checked = true; ck2.dispatchEvent(new Event('change'));
    const bi = sh.querySelector('[data-bxdo="in"]'); bi.click(); await W(200); out.armIn = bi.textContent; out.afterOneIn = (await db.collection('bench_days').doc('222_c').get()).data().excl; bi.click(); await W(1200);
    out.doc2 = (await db.collection('bench_days').doc('222_c').get()).data(); out.s2 = sn(); out.a2 = agg(); sh = document.getElementById('sheet'); const rc2 = sh.querySelector('tr[data-bxrow="222_c"]'); out.rowIn = rc2 ? { cls: rc2.className, op: rc2.style.opacity } : null; out.card2 = !!sh.querySelector('.bxcard');
    // 다른 기기에서 뺌(문서 excl + exclRev 알림) → 구독으로 다시 받아 곧바로
    await db.collection('bench_days').doc('222_d').set({ excl: true, exclBy: 'other@x', exclAt: '2026-11-05T13:00:00Z' }, { merge: true }); await ref.set({ exclRev: { sc: '222', at: '2026-11-05T13:00:00Z', by: 'other@x', n: 1, act: 'out' } }, { merge: true }); await W(1500);
    out.s3 = sn(); sh = document.getElementById('sheet'); const rd = sh.querySelector('tr[data-bxrow="222_d"]'); out.rowOther = rd ? rd.textContent : '';
    out.pops = pops; out.docsN = (await db.collection('bench_days').where('sc', '==', '222').get()).size; return out; });
  console.log(JSON.stringify(R).replace(/[\w.+-]+@[\w.-]+/g, '(메일)').slice(0, 1500));
  ok(R.s0 && R.s0.gone === 311 && R.s0.add === 10 && R.s0.n === 4 && R.a0 === 311, '처음: 다섯 회차(첫 바퀴 + 넷) — 사라짐 311 · 올림 10 · 4일 · 종합(benchAgg)도 311');
  ok(R.bar && R.cks === 5 && R.rows0 === 5, '회차별 기록: 고르기 줄(빼기·다시 넣기) · 줄마다 ☑ 5개');
  ok(R.noSel === undefined, '고르지 않고 누르면 안내만(문서 그대로)');
  ok(R.nSel === '1' && R.armed && /한 번 더 누르면/.test(R.armTxt) && /판매자이/.test(R.armTxt) && /10\/22|2026-10-22/.test(R.armTxt) && R.afterOne === undefined, '두 번 누르기: 첫 번째는 판매자·회차 때를 보여 주고 아직 저장 안 함');
  ok(R.doc1 && R.doc1.excl === true && R.doc1.exclBy === R.me && !!R.doc1.exclAt && R.doc1.exclWhy === '숍이 비어 보임' && R.doc1.gone === 300 && R.doc1.add === 1, '두 번째: 문서를 지우지 않고 excl·누가·언제·까닭만 더함(원래 숫자 그대로)');
  ok(R.s1.gone === 11 && R.s1.add === 9 && R.s1.n === 3 && R.s1.perGone === Math.round(11 / 3 * 100) / 100 && R.s1.won === Math.round(110000 / 3) && R.a1 === 11, '뺀 뒤 곧바로: 사라짐 311→11 · 올림 10→9 · 날 4→3(뺀 기간도 분모에서 뺌) · 하루 사라짐 11/3 · 하루 사라진 판매가 110,000/3 · 종합도 11');
  ok(R.rowEx && /bxout/.test(R.rowEx.cls) && R.rowEx.op === '0.55' && /📉 통계에서 뺌/.test(R.rowEx.txt) && R.rowEx.txt.includes(String(R.me).split('@')[0]) && /숍이 비어 보임/.test(R.rowEx.txt) && R.rows1 === 5, '뺀 회차 줄은 지우지 않고 흐리게 + \'📉 통계에서 뺌\'(누가·까닭) · 줄 수 그대로');
  ok(R.card1 && R.rev && R.rev.sc === '222' && R.rev.act === 'out', '상세 위 안내 카드 · 다른 기기 알림(app_settings/bench.exclRev)');
  ok(R.ck2ex === '1' && /한 번 더 누르면/.test(R.armIn) && /다시 넣음/.test(R.armIn) && R.afterOneIn === true, '다시 넣기도 두 번 누르기');
  ok(R.doc2 && R.doc2.excl === false && Array.isArray(R.doc2.exclLog) && R.doc2.exclLog.length === 2 && R.doc2.exclLog[0].act === 'out' && R.doc2.exclLog[1].act === 'in' && R.doc2.exclWhy === '숍이 비어 보임', '다시 넣음: excl:false · 기록(exclLog) 덧붙임 2줄(뺌·다시 넣음)');
  ok(JSON.stringify(R.s2) === JSON.stringify(R.s0) && R.a2 === 311 && R.rowIn && !/bxout/.test(R.rowIn.cls) && R.rowIn.op === '' && !R.card2, '다시 넣은 뒤: 원래 수치 그대로 · 줄 흐림·안내 카드 사라짐');
  ok(R.s3.gone === 307 && R.s3.n === 3 && /📉 통계에서 뺌/.test(R.rowOther) && /other/.test(R.rowOther), '다른 기기에서 뺌 → 구독으로 곧바로(사라짐 307 · 날 3) · 줄에 누가');
  ok(R.pops === 0 && R.docsN === 5, '브라우저 팝업 없음 · 회차 문서 5개 그대로(지우지 않음)');
  await p.waitForTimeout(300); console.log(bad ? `❌ tBX1105 실패 ${bad}` : '✓ tBX1105 통과'); });
