// (10/26 wX3) ❓ 답할 문의 알림 설정·이동 · 🏷 출고 SKU · 📊 출고 시장 요약 · ✅/🟡 사실·추정 표시(문제 상품)
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = {};
  // 1) factTag · IPOP.fact
  R.fact = await p.evaluate(() => { const h = factTag('guess', '근거 A', '까닭 B'); const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); const b = d.firstElementChild; const pop = IPOP.fact(b); d.remove(); return { cls: b.className, lab: b.textContent, t: b.title, pop }; });
  // 2) 출고 시장 요약
  R.sum = await p.evaluate(() => { const rows = [{ c: 'g', p: 5000 }, { c: 'g', p: 7000 }, { c: 'g', p: 9000 }, { c: 'ours', p: 8500 }];
    const a = shpSumLine(rows, { usedTotal: 4 }, { price: 8500 }, null); const b = shpSumLine(rows, { usedTotal: 4 }, { price: 5000 }, null); const c = shpSumLine(rows, { usedTotal: 4 }, { price: 4000 }, null);
    const q = (h, s) => { const d = document.createElement('div'); d.innerHTML = h; const e = d.querySelector(s); return e ? e.textContent.trim() : null; };
    return { aD: q(a, '.ss-d .ss-v'), aCls: /ss-d pos/.test(a), bD: q(b, '.ss-d .ss-v'), bCls: /ss-d zero/.test(b), cD: q(c, '.ss-d .ss-v'), cCls: /ss-d neg/.test(c), tot: q(a, '.ss-c .ss-v'), rank: q(a, '.ss-c:nth-child(2) .ss-v'), bar: /ss-me pos" style="left:87\.5%/.test(a), ax: q(a, '.ss-ax') }; });
  // 3) 출고 SKU — 상품 기록에 SKU를 붙이고 출고 카드
  R.sku = await p.evaluate(async () => { const l = S.plist.get('aladin_U215983410'); S.sku.seqUn = S.sku.seqUn || (() => {}); S.sku.map.set(l.id, { c: ['RNab12c'] }); const one = shipSkuHtml(l); const none = shipSkuHtml(S.plist.get('aladin_U215983411'));
    S._shipLive = 1; S.shipC = { orders: [{ orderNo: '777001', buyer: '김테스트', orderedAt: '2026-10-26 10:00', items: [{ listingId: l.listingId, title: l.title, price: 8500, qty: 1, sku: 'PNK_ms', grade: '최상' }] }], at: new Date().toISOString() }; S.shipTab = 'confirm'; await openShip(); await new Promise((r) => setTimeout(r, 300));
    const el = document.querySelector('#sheet .shp-sku .shp-skuc'); const r = { one, none, shipChip: el ? el.textContent : null, big: el ? getComputedStyle(el).fontSize : null };
    const pr = prodRow(l); r.prodRow = /tag sku/.test(pr); history.back(); await new Promise((x) => setTimeout(x, 200)); return r; });
  // 4) 문제 상품 — 확정·추정 나눔
  R.prob = await p.evaluate(async () => { const t0 = '2026-10-10T01:00:00.000Z';
    S.testReg.set('r1', { id: 'r1', test: true, confirmedAt: t0, result: { state: 'live', usedCode: 'U215983410', listingId: '404935000' } }); // 확정(등록일 10-10)
    S.testReg.set('r2', { id: 'r2', test: true, confirmedAt: t0, result: { state: 'live', usedCode: 'U999999999', listingId: '1' }, final: { title: '목록에 없는 시험책' } }); // 목록에 없음 → 추정
    S.testReg.set('r3', { id: 'r3', test: true, confirmedAt: t0, result: { state: 'live', usedCode: 'U215983412', listingId: '404935002' } }); // 등록일 10-12 ≠ 10-10 → 추정
    S._testV++; S._probV++; S._pA = null; const M = probAll(); const G = probGuess();
    const out = { conf: [...M.keys()], guess: [...G.keys()], gWhy: G.get('aladin_U215983412') && G.get('aladin_U215983412').P[0].notWhy, sure: (M.get('aladin_U215983410') || { P: [{}] }).P[0].sure || null };
    out.band = probBand(S.plist.get('aladin_U215983412')); const A = []; probGuessAlerts((lv, t) => A.push([lv, t])); out.alerts = A;
    openProblems(); await new Promise((r) => setTimeout(r, 200)); out.gCards = document.querySelectorAll('#sheet .probguess').length; out.gDel = document.querySelectorAll('#sheet .probguess [data-probdel],#sheet .probguess [data-probrgdel]').length; out.facts = [...document.querySelectorAll('#sheet .fact')].map((x) => x.className); history.back(); await new Promise((r) => setTimeout(r, 200)); return out; });
  // 5) 설정 🔔 — 답할 문의 체크칸 · 출고 고객 추정 배지
  R.set = await p.evaluate(() => { S.snSubs = { 폰A: { sub: { e: 1 } }, 폰B: { sub: { e: 1 }, kinds: { qna: false } } }; S._snUn = 1; const h = shipNotifyHtml(); const d = document.createElement('div'); d.innerHTML = h; const a = d.querySelector('[data-snk="폰A|qna"]'), b = d.querySelector('[data-snk="폰B|qna"]');
    return { a: a && a.checked, b: b && !b.checked, cust: custLinkFact({ how: '이름만 같음(추정)', weak: true, cands: [1, 2] }).includes('f-guess'), custSure: custLinkFact({ how: '이메일 같음' }) === '' }; });
  // 6) 알림 누름 → 문의 모음 · 그 문의 답변 창
  R.go = await p.evaluate(async () => { S.qnaAll = [{ questionId: 'Q55', answerStatus: '', body: '언제 오나요', createdAt: '2026-10-26', title: '테스트 책' }]; qnaGoOpen('Q55'); await new Promise((r) => setTimeout(r, 400)); const ov = document.getElementById('qr_ov'); const r = { tab: S.tab, view: S.custView, f: S.qnaF, ov: !!ov }; try { qrClose(); } catch (e) {} return r; });
  console.log(JSON.stringify(R, null, 1), errs.join('|'));
  const ok = R.fact.cls.includes('f-guess') && /추정/.test(R.fact.lab) && /근거 A/.test(R.fact.pop) && /까닭 B/.test(R.fact.pop)
    && R.sum.aD === '+3,500원' && R.sum.aCls && R.sum.bD === '＝' && R.sum.bCls && R.sum.cD === '−1,000원' && R.sum.cCls && R.sum.tot === '4' && R.sum.rank === '3위' && R.sum.bar
    && /RNab12c|ab12c/.test(R.sku.one) && /없음/.test(R.sku.none) && R.sku.shipChip && R.sku.big === '15px' && R.sku.prodRow
    && R.prob.conf.includes('aladin_U215983410') && !R.prob.conf.includes('aladin_U215983412') && R.prob.guess.length === 2 && /날짜가 다름/.test(R.prob.gWhy) && R.prob.sure && /추정/.test(R.prob.band) && R.prob.alerts.length === 1 && R.prob.alerts[0][0] === 'info' && R.prob.gCards === 2 && R.prob.gDel === 0 && R.prob.facts.some((c) => /f-sure/.test(c)) && R.prob.facts.some((c) => /f-guess/.test(c))
    && R.set.a === true && R.set.b === true && R.set.cust && R.set.custSure
    && R.go.tab === 'search' && R.go.view === 'qna' && R.go.ov && !errs.length;
  console.log(ok ? '✓ tX3 통과' : '❌ tX3 실패');
});
