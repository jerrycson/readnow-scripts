// tSD1 — (4시간 점검 11/14) 발송준비시작 맡김의 단계 줄만 바뀌면 출고 화면 전체를 다시 그리지 않고 🛰 칸만 · 상태·결과가 바뀌면 전체
require('./harness.js')(async (p) => {
  await p.waitForFunction(() => typeof cmdHubApply === 'function' && typeof cmdHubOn === 'function', null, { timeout: 60000 });
  const r = await p.evaluate(async () => {
    const out = [];
    const ss = (docs) => ({ docChanges: () => docs.map((d) => ({ type: 'modified', doc: { id: d.id, data: () => d } })), forEach: () => {} });
    let nR = 0, nL = 0; const R0 = window.shipRerender, L0 = window.shipLiveSoon; window.shipRerender = () => { nR++; }; window.shipLiveSoon = () => { nL++; };
    S.detail = { ship: true };
    if (!(S._cmdFns || []).some((f) => f.types.has('startDelivery'))) { try { loadShip(); } catch (e) {} }
    const hasSd = (S._cmdFns || []).some((f) => f.types.has('startDelivery')); out.push(['startDelivery 받는 쪽 있음', hasSd]);
    const base = { id: 'sdT1', type: 'startDelivery', status: 'running', createdAt: '2026-11-14T02:00:00Z', orderNos: ['001-T1'], claim: { pc: 'JS-MAIN' }, results: {} };
    cmdHubApply('act', ss([{ ...base, log: [{ at: '1', l: 'a' }] }])); const r1 = nR;
    cmdHubApply('act', ss([{ ...base, log: [{ at: '1', l: 'a' }, { at: '2', l: 'b' }], stepNow: { at: '2', l: 'b' } }])); out.push(['단계 줄만 바뀜 → 전체 안 그림', nR === r1, nR, r1]); out.push(['단계 줄만 바뀜 → 🛰 칸 고침', nL >= 1, nL]);
    cmdHubApply('act', ss([{ ...base, status: 'done', results: { '001-T1': { state: 'done', msg: '발송준비' } } }])); out.push(['상태·결과 바뀜 → 전체 그림', nR === r1 + 1, nR]);
    cmdHubApply('act', ss([{ ...base, status: 'done', results: { '001-T1': { state: 'done', msg: '발송준비' } }, cloudErr: '오류X' }])); out.push(['오류 바뀜 → 전체 그림', nR === r1 + 2, nR]);
    S.detail = null; cmdHubApply('act', ss([{ ...base, status: 'done', results: { '001-T1': { state: 'done', msg: '발송준비' } }, cloudErr: '오류X', log: [1, 2, 3] }])); out.push(['출고 화면 닫힘 → 🛰 칸도 안 건드림', nL === 1, nL]);
    window.shipRerender = R0; window.shipLiveSoon = L0; return out; });
  let bad = 0; for (const x of r) { const ok = x[1] === true; if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + x.join(' · ')); }
  console.log(bad ? '❌ 실패 ' + bad : '✓ 통과 tSD1');
});
