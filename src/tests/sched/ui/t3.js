const fs = require('fs'); const { wrapped, core, chromium } = require('./page.js');
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1350, height: 950 } }); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.setContent('<html><body style="font-family:sans-serif"><div id="rnp" style="width:360px"><div class="sec rnp-sched" id="rnpSched"></div></div></body></html>');
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/harness.js', 'utf8') });
  await p.evaluate(() => { window.JOBS.kpipa = ['출판 판매 통계 (KPIPA 판매 보고서)']; window.JOBS.bench = ['🎯 집중 벤치마킹 — 정한 순서대로 모두']; window.JOBS.shipRead = ['발송 요청 읽기']; window.JOBS.metricsAuto = ['그룹 시장 지표 맡기기'];
    window.BENCH0 = { targets: [{ sc: '1', name: '알파서점' }, { sc: '2', name: '베타북스' }, { sc: '3', name: '감마' }] };
    const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); window.DAY = day;
    FS.docs['prd_system/autoSched'] = { on: true, items: { qna: { on: true, times: ['09:00', '13:00', '17:00'] }, returns: { on: true, times: ['10:00', '16:00'] }, scanDaily: { on: true, times: ['08:00', '20:00'] }, buyback: { on: true, times: ['21:00'] }, aladinBuy: { on: true, times: ['22:00'] }, crmBulk: { on: false, times: ['06:00'] }, chain: { on: false, times: ['17:00'] } } };
    FS.docs['app_settings/bench'] = { autoOn: true, targets: [{ sc: '1', on: true }] }; FS.docs['app_settings/kpipa'] = {}; FS.docs['app_settings/ext'] = { on: true };
    FS.docs['prd_system/jobStats'] = { jobs: { 'bench:1': { runs: [{ at: new Date().toISOString(), ms: 40 * 60e3, st: 'done' }] }, 'bench:2': { runs: [{ at: new Date().toISOString(), ms: 20 * 60e3, st: 'done' }] }, 'prd:scanDaily': { runs: [{ at: new Date().toISOString(), ms: 50 * 60e3, st: 'done' }] }, 'prd:kpipa': { runs: [{ at: new Date().toISOString(), ms: 8 * 60e3, st: 'done' }] } } };
    window.SET = { shipAutoMin: 15 }; });
  await p.addScriptTag({ content: core }); await p.addScriptTag({ content: wrapped }); await p.waitForTimeout(800);
  const R = {};
  R.slots = await p.evaluate(() => (FS.docs['prd_system/autoSched'].slots || []).map((s) => s.id + ':' + s.trig.t + (s.on ? '' : '(off)')).join(', ') + ' | mig ' + JSON.stringify(FS.docs['prd_system/autoSched'].mig161));
  R.panel = await p.evaluate(() => document.getElementById('rnpSched').innerText.slice(0, 400));
  await p.evaluate(() => __T.asEdOpen()); await p.waitForTimeout(500);
  R.tl = await p.evaluate(() => ({ segs: document.querySelectorAll('#rnas .tl-b .sg').length, par: document.querySelectorAll('#rnas .tl-b.par').length, shift: document.querySelectorAll('#rnas .tl-b.shift').length, bi: [...document.querySelectorAll('#rnas .bi')].map((x) => x.innerText.slice(0, 80)) }));
  await p.screenshot({ path: __dirname + '/ed3.png' });
  // block select + Delete + undo/redo
  const blk = await p.$('#rnas [data-tlt^="qna|"]'); const bb = await blk.boundingBox(); await p.mouse.click(bb.x + 2, bb.y + 4); await p.waitForTimeout(200);
  R.sel = await p.evaluate(() => [!!document.querySelector('#rnas .tl-b.sel'), (document.querySelector('#rnas .as-msg') || {}).innerText]);
  await p.keyboard.press('Delete'); await p.waitForTimeout(200); R.del = await p.evaluate(() => JSON.stringify(__T.E && document.querySelectorAll('#rnas [data-tlt^="qna|"]').length));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200); R.undo = await p.evaluate(() => document.querySelectorAll('#rnas [data-tlt^="qna|"]').length);
  await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(200); R.redo = await p.evaluate(() => document.querySelectorAll('#rnas [data-tlt^="qna|"]').length);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  // ext toggle
  await p.evaluate(() => { const c = document.querySelector('#rnas [data-bik="ext"]'); c.checked = false; c.dispatchEvent(new Event('change')); }); await p.waitForTimeout(300); R.ext = await p.evaluate(() => FS.docs['app_settings/ext'].on);
  // par tick
  await p.evaluate(() => { const S = FS.docs['prd_system/autoSched']; const k = S.slots.find((x) => x.id === 'kpipa'); k.trig.times = ['00:01']; k.on = true; fsSet('prd_system/autoSched', { slots: S.slots, rev: (S.rev || 0) + 1 }, { merge: true }); }); await p.waitForTimeout(200);
  await p.evaluate(() => __T.parTick()); await p.waitForTimeout(800); R.par = await p.evaluate(() => [RUNS_CALLED.slice(), Object.entries(__T.RUNS).filter(([k]) => k.startsWith('kpipa')).map(([k, v]) => k + '=' + v.state + (v.par ? '(par)' : ''))]);
  // shipRead skipped when cloud on
  await p.evaluate(() => { window.CLOUD_ON = 1; RUNS_CALLED.length = 0; }); await p.evaluate(() => __T.schedTick()); await p.waitForTimeout(1500); R.cloud = await p.evaluate(() => [RUNS_CALLED.slice(), Object.keys(__T.RUNS).filter((k) => k.startsWith('shipRead'))]);
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
