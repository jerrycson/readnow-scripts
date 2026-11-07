// tBFILL — 정범님 11/07 밤 ⑦: 🎯 집중 벤치마킹 판매자 상세 › 회차별 기록
//  🧩 빈 날 채우기(12일 다음 16일 회차의 몫을 13·14·15·16 4일로 나눠 줄 3개 더) · ✎ 고치기(채운 날·보통 회차) · ↩ 되돌리기 · 고친 기록(editLog) · 그래프 곧바로 · 행·열 고정
//  사용: w/pw 안에서 RN_PORT=8765 node tBFILL.js
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; S.user = S.user || { email: 'tester@x' };
    let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; };
    await db.collection('app_settings').doc('bench').set({ seed190: true, mig1105: true, targets: [{ sc: '444', name: '별 헤는 밤', on: true }], groups: [] });
    const run = (day, o) => ({ sc: '444', name: '별 헤는 밤', day, runAt: `${day}T00:05:00+09:00`, strict: 1, complete: true, cover: 1, pages: 10, runLastPage: 10, total: 100, ...o });
    const docs = { a: run('2026-11-11', { base: true }), b: run('2026-11-12', { add: 2, gone: 3, sumGone: 30000, sumAdd: 20000, spanDays: 1 }), c: run('2026-11-16', { add: 5, gone: 10, sumGone: 100001, sumAdd: 50000, spanDays: 4, lowOn: 2, lowOff: 1 }) };
    for (const [k, v] of Object.entries(docs)) await db.collection('bench_days').doc('444_' + k).set(v);
    S._benchUn = undefined; S.bench = null; benchCfg(); await W(300); S.benchD = {};
    const st = () => { const s = benchStats(S.benchD['444']); return { n: Math.round(s.n * 100) / 100, gone: s.goneN, add: s.addN }; };
    await benchLoad('444', true); out.s0 = st();
    openBench('444'); await W(1500); let sh = document.getElementById('sheet'); sh.querySelector('details.bd2t').open = true;
    out.sticky = (() => { const th = sh.querySelector('.bd2tw .bd2tbl th'); const td = sh.querySelector('.bd2tw .bd2tbl tbody tr td'); return th && td ? getComputedStyle(th).position + '/' + getComputedStyle(td).position : null; })();
    const fb = sh.querySelector('[data-bfill="444_c"]'); out.fillBtn = fb ? fb.textContent : null; out.fillB = !!sh.querySelector('[data-bfill="444_b"]'); // b는 앞 회차와 하루 — 단추 없음
    fb.click(); await W(200); out.armed = fb.textContent; out.after1 = (await db.collection('bench_days').doc('444_c').get()).data().fill || null;
    fb.click(); await W(1500); const d1 = (await db.collection('bench_days').doc('444_c').get()).data(); out.fill = d1.fill ? d1.fill.days : null; out.log1 = (d1.editLog || []).map((l) => l.act); out.orig = { gone: d1.gone, sumGone: d1.sumGone };
    out.s1 = st(); sh = document.getElementById('sheet');
    out.vrows = [...sh.querySelectorAll('tr.bfillr')].map((tr) => tr.children[0].textContent.replace(/\s+/g, ' ').trim() + ' | ' + tr.children[4].textContent.trim());
    out.bars = [...sh.querySelectorAll('.bd2 .bd2c')].map((c) => c.querySelector('.d').textContent + ':' + c.querySelector('.g').textContent).join(' ');
    out.unfillBtn = !!sh.querySelector('[data-bunfill="444_c"]'); out.logShown = (sh.querySelector('.bedlog summary') || {}).textContent || null;
    // ✎ 채운 날(11-14) 사라짐 3 → 5 · 판매가 비움(그대로)
    sh.querySelector('[data-bed="444_c|2026-11-14"]').click(); await W(1200); sh = document.getElementById('sheet'); const tr = sh.querySelector('[data-bedsave="444_c|2026-11-14"]').closest('tr'); out.edInputs = tr.querySelectorAll('[data-bedk]').length;
    tr.querySelector('[data-bedk="gone"]').value = '5'; tr.querySelector('[data-bedsave]').click(); await W(1500);
    const d2 = (await db.collection('bench_days').doc('444_c').get()).data(); out.fill2 = d2.fill.days.find((d) => d.day === '2026-11-14'); out.log2 = (d2.editLog || []).filter((l) => l.act === 'edit').map((l) => `${l.day}:${l.k}:${l.from}->${l.to}`);
    out.s2 = st();
    // Esc로 고치기 취소
    sh = document.getElementById('sheet'); sh.querySelector('[data-bed="444_b"]').click(); await W(1200); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(1200); out.escGone = !document.querySelector('[data-bedsave]') && !!(S.detail && S.detail.bench);
    // ✎ 보통 회차(b) 새로 올림 2 → 7
    sh = document.getElementById('sheet'); sh.querySelector('[data-bed="444_b"]').click(); await W(1200); sh = document.getElementById('sheet'); const tb = sh.querySelector('[data-bedsave="444_b"]').closest('tr'); tb.querySelector('[data-bedk="add"]').value = '7'; tb.querySelector('[data-bedsave]').click(); await W(1500);
    const db2 = (await db.collection('bench_days').doc('444_b').get()).data(); out.edit = db2.edit ? { add: db2.edit.add, by: !!db2.edit.by } : null; out.bAdd = db2.add; out.s3 = st();
    sh = document.getElementById('sheet'); out.uneditBtn = !!sh.querySelector('[data-bunedit="444_b"]');
    // ↩ 채우기 되돌림(두 번)
    const ub = sh.querySelector('[data-bunfill="444_c"]'); ub.click(); await W(200); ub.click(); await W(1500); const d3 = (await db.collection('bench_days').doc('444_c').get()).data(); out.fill3 = d3.fill; out.log3 = (d3.editLog || []).map((l) => l.act);
    out.s4 = st(); sh = document.getElementById('sheet'); out.vrows4 = sh.querySelectorAll('tr.bfillr').length; out.pops = pops; return out; });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; }; let bad = 0;
  console.log(JSON.stringify(R).slice(0, 2500));
  ok(R.sticky === 'sticky/sticky', '회차 표 — 칸 이름 줄·읽은 때 칸 고정(sticky)');
  ok(/빈 날 채우기\(4일\)/.test(R.fillBtn || '') && !R.fillB, '16일 회차에만 🧩 빈 날 채우기(4일) — 하루 떨어진 회차엔 없음');
  ok(/한 번 더/.test(R.armed || '') && R.after1 === null, '한 번 누르면 무장만(저장 안 함)');
  ok(Array.isArray(R.fill) && R.fill.map((d) => d.day).join(',') === '2026-11-13,2026-11-14,2026-11-15,2026-11-16' && R.fill.map((d) => d.gone).join(',') === '2,2,3,3' && R.fill.reduce((a, d) => a + d.sumGone, 0) === 100001 && R.fill.reduce((a, d) => a + d.add, 0) === 5, '두 번 누르면 13~16일 4일로 나눔(사라짐 10 → 2,2,3,3 · 판매가 합 그대로 · 나머지는 뒤 날)');
  ok(R.orig.gone === 10 && R.orig.sumGone === 100001 && R.log1.includes('fill'), '원래 회차 값은 그대로(덧씌움) · 고친 기록 fill');
  ok(R.s1.gone === R.s0.gone && R.s1.n === R.s0.n, `통계 합·기간은 같음(사라짐 ${R.s0.gone} · ${R.s0.n}일)`);
  ok(R.vrows.length === 3 && /11-13|2026-11-13/.test(R.vrows[R.vrows.length - 1]), '채운 날 줄 3개(🧩 채운 날)');
  ok(/11\/13:2/.test(R.bars) && /11\/14:2/.test(R.bars) && /11\/15:3/.test(R.bars) && /11\/16:3/.test(R.bars), '그래프에 13~16일 막대가 곧바로');
  ok(R.unfillBtn && /고친 기록 1건/.test(R.logShown || ''), '↩ 채우기 되돌림 단추 · 🧾 고친 기록 1건');
  ok(R.edInputs === 3 && R.fill2 && R.fill2.gone === 5 && R.fill2.edBy && R.log2.includes('2026-11-14:gone:2->5'), '✎ 채운 날 사라짐 2→5 저장 · 누가·언제 · 기록');
  ok(R.s2.gone === R.s0.gone + 3, '고친 값이 통계에 곧바로(+3)');
  ok(R.escGone, 'Esc로 고치기 취소');
  ok(R.edit && R.edit.add === 7 && R.edit.by && R.bAdd === 2 && R.s3.add === R.s2.add + 5 && R.uneditBtn, '✎ 보통 회차 새로 올림 2→7(edit 덧씌움 · 원래 값 그대로) · ↩ 고침 되돌림 단추');
  ok(R.fill3 === null && R.log3.join(',') === 'fill,edit,unfill' && R.vrows4 === 0 && R.s4.gone === R.s0.gone, '↩ 되돌리면 한 줄로 · 기록은 남음(fill,edit,unfill) · 통계 원래대로');
  ok(R.pops === 0 && errs.length === 0, '팝업·오류 없음 ' + JSON.stringify(errs).slice(0, 200));
  console.log(bad ? `❌ tBFILL 실패 ${bad}` : '✓ tBFILL 통과');
});
