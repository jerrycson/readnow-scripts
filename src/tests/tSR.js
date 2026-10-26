// (10/26) 📝 판매가 평가 사유 — 사유 펼치기·고르기·새로 쓰기(모음 저장+붙임)·자주 쓴 순·빼기·내력·사유별 묶음
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '❌ ') + m);
  const r0 = await p.evaluate(async () => { const it = { price: 9000, listingId: 'L77', title: '사유책', sku: 'X1' }; const P1 = [{ c: 'green', g: '상', p: 10000, lid: 'a1' }, { c: 'dkgreen', g: '상', p: 11000, lid: 'a2' }];
    const SV = saleEvalBits({ it, l: null, gr: '상', P1, ono: 'O1', isC: true, src: 'confirm', at: new Date().toISOString() });
    const root = document.createElement('div'); root.id = 'tsev'; root.style.cssText = 'position:fixed;top:0;left:0;width:700px;background:#fff;z-index:99999;max-height:880px;overflow:auto'; root.innerHTML = SV.box; document.body.appendChild(root);
    const early = !!root.querySelector('[data-sevrst]'); await saleEvalFill(root); return { early, has: !!root.querySelector('[data-sevrs="O1__L77"]'), done: S._sevDone.has('O1__L77') }; });
  ok(r0.has && r0.early, '평가 상자에 📝 사유 칸이 바로 그려짐'); ok(r0.done, '평가 기록 읽음');
  // 평가만 (사유 없이) 저장
  await p.click('#tsev [data-sevv="-1"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const d = window.__FS.ml_sale_evals['O1__L77']; return d && d.label && d.label.v === -1 && !d.reasons; }), '사유 없이 평가 저장됨');
  // 펼치기
  await p.click('#tsev [data-sevrst]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!document.querySelector('#tsev .sev-rs-ph [data-rgphadd]') && document.querySelectorAll('#tsev .sev-rs-ph .pt[data-rgphi]').length >= 5), '📝 사유 ▸ 누르면 모음이 펼쳐짐(처음 모음)');
  // 처음 모음의 '급함·현금' 고르기
  await p.click('#tsev .sev-rs-ph .pt[data-t="급함·현금이 필요했음"]'); await p.waitForTimeout(300);
  let d = await p.evaluate(() => window.__FS.ml_sale_evals['O1__L77']);
  ok(d.reasons && d.reasons.length === 1 && d.reasons[0].t === '급함·현금이 필요했음' && d.reasons[0].id && d.reasonText === '급함·현금이 필요했음', '사유 붙임 → reasons·reasonText 저장');
  ok(d.label && d.label.v === -1, '사유를 붙여도 평가(label) 그대로');
  ok(await p.evaluate(() => document.querySelector('#tsev .sev-rs-ph .pt[data-t="급함·현금이 필요했음"]').closest('.rgpb').classList.contains('on')), '고른 사유 ✓ 표시');
  // 새 사유 쓰고 Enter
  await p.fill('#tsev .sev-rs-ph [data-rgphadd]', '손님이 깎아 달라 함'); await p.press('#tsev .sev-rs-ph [data-rgphadd]', 'Enter'); await p.waitForTimeout(400);
  d = await p.evaluate(() => window.__FS.ml_sale_evals['O1__L77']);
  const lib = await p.evaluate(() => window.__FS.app_settings.sale_eval_reasons);
  ok(d.reasons.length === 2 && d.reasons[1].t === '손님이 깎아 달라 함', '새로 쓴 사유가 이 판매에 바로 붙음');
  ok(lib && Array.isArray(lib.q) && lib.q.some((x) => x.t === '손님이 깎아 달라 함'), '새 사유가 모음에 저장(다음에 고름)');
  ok(lib.uses && Object.values(lib.uses).some((u) => u.t === '급함·현금이 필요했음'), '쓴 횟수 기록(uses)');
  // 자주 쓴 순: 새 사유를 다른 판매에서 두 번 더 → 맨 앞
  const ord = await p.evaluate(async () => { S._sevDone.set('O2__L78', {}); S._sevDone.set('O3__L79', {}); await sevRsToggle('O2__L78', '손님이 깎아 달라 함'); await sevRsToggle('O3__L79', '손님이 깎아 달라 함'); return sevRsPh().q.map((x) => x.t).slice(0, 3); });
  ok(ord[0] === '손님이 깎아 달라 함', '자주 쓴 사유가 맨 앞: ' + ord.join(' / '));
  // 같은 사유 Enter 다시 → 중복 저장 안 함
  await p.fill('#tsev .sev-rs-ph [data-rgphadd]', '손님이 깎아 달라 함'); await p.press('#tsev .sev-rs-ph [data-rgphadd]', 'Enter'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__FS.app_settings.sale_eval_reasons.q.filter((x) => x.t === '손님이 깎아 달라 함').length === 1 && window.__FS.ml_sale_evals['O1__L77'].reasons.length === 2), '이미 있는 사유는 모음·판매에 두 번 안 들어감');
  // 접기(Esc) 후 칩으로 빼기
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('#tsev .sev-rs-ph') && document.querySelectorAll('#tsev .sev-rc').length === 2), 'Esc로 접힘 · 붙은 사유는 칩으로 보임');
  await p.click('#tsev .sev-rc[data-sevrsx="급함·현금이 필요했음"]'); await p.waitForTimeout(300);
  d = await p.evaluate(() => window.__FS.ml_sale_evals['O1__L77']);
  ok(d.reasons.length === 1 && d.reasonText === '손님이 깎아 달라 함', '칩 ✕로 빼기 저장');
  ok(Array.isArray(d.reasonHist) && d.reasonHist.length >= 3 && d.reasonHist.some((h) => h.act === 'off'), '붙이고 뺀 내력(reasonHist) 남음: ' + (d.reasonHist || []).length);
  // 읽기 전 판매에는 붙이지 않음
  ok(await p.evaluate(async () => { await sevRsToggle('NOPE__1', '아무거나'); return !(window.__FS.ml_sale_evals || {})['NOPE__1']; }), '평가 기록을 읽기 전에는 사유를 쓰지 않음(덮어쓰기 막기)');
  // 사유별 묶음 — 평가 모음
  await p.evaluate(() => { const E = window.__FS.ml_sale_evals; E['O2__L78'].label = { v: 0 }; E['O2__L78'].model = { score: 1 }; S.sevAll = null; return openSevList(); }); await p.waitForTimeout(600);
  const g = await p.evaluate(() => ({ t: (document.querySelector('#sheet') || {}).innerText || '', rows: document.querySelectorAll('#sheet tr[data-sevf]').length }));
  ok(/📝 사유별/.test(g.t) && g.rows >= 1, '평가 모음에 📝 사유별 표: ' + g.rows + '줄');
  await p.click('#sheet tr[data-sevf^="r:"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => String(S.sevL.f).startsWith('r:')), '사유 줄 누르면 그 사유로 거름');
  await p.screenshot({ path: '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/tSR.png' });
  console.log(R.join('\n')); console.log(R.every((x) => x.startsWith('✓')) ? '✓ tSR 통과' : '❌ tSR 실패');
});
