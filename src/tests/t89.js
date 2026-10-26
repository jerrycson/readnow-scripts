require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluate(() => { window.__rnAdminForce = 1; try { localStorage.setItem('rn-admin-dev', '1'); } catch (e) {} });
  const r = await p.evaluate(async () => { openAuto(); await new Promise((r) => setTimeout(r, 600)); const A = window.__rnAuto || null;
    const R = ReadnowAuto; const cfg = { budget: { sim: { cur: 's2', list: { s1: { name: '유심 1', gb: 120 }, s2: { name: '유심 2', gb: 120 } }, left: { '2026-10': { s1: { gb: 0, at: '2026-10-26T01:50:00Z' } } } }, ovr: { mk: '2026-10', from: '2026-10-26', remainGB: 23.23, dayGB: 3.871, sim: 's2', dayUsedGB: 1 } } };
    const GiB = 1073741824; const b = R.AS.budget(cfg, { capGB: 83, capBytes: 83 * GiB, month: { key: '2026-10', tether: 50 * GiB }, days: { '2026-10-26': { tether: 2 * GiB } }, today: { key: '2026-10-26', tether: 2 * GiB } }, Date.parse('2026-10-26T12:00:00+09:00'));
    return { share: b.strict && +(b.strict.share / GiB).toFixed(3), sim: b.base.simName, html: !!document.querySelector('#rnas') }; });
  console.log(JSON.stringify(r), errs.join('|')); console.log(r.share === 3.871 && r.sim === '유심 2' && !errs.length ? '✓ t89 통과' : '❌ t89 실패');
});
