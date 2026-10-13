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
  const st = () => p.evaluate(() => { const s = document.querySelector('#as_save'), u = document.querySelector('#as_undo'); return { dirty: __T.ED.dirty, save: s && !s.disabled, undo: u && !u.disabled, msg: [...document.querySelectorAll('#rnas .as-msg')].map((x) => x.innerText.slice(0, 120)), on: FS.docs['prd_system/autoSched'].on, act: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }; });
  await p.evaluate(() => __T.asEdOpen()); await p.waitForTimeout(500);
  R.s0 = await st();
  // A: 카드 하나 끄기 (data-con)
  const con = await p.$$('#rnas [data-con]'); R.conN = con.length; await p.locator('#rnas label:has([data-con])').nth(0).click(); await p.waitForTimeout(400); R.a1 = await st();
  await p.click('#as_undo'); await p.waitForTimeout(150); await p.click('#as_undo'); await p.waitForTimeout(400); R.a2 = await st();
  await p.locator('#rnas label:has([data-con])').nth(0).click(); await p.waitForTimeout(400); await p.click('#as_save'); await p.waitForTimeout(800); R.a3 = await st();
  // B: 전체 끄기 (#as_on)
  await p.click('#rnas .as-hd label.sw'); await p.waitForTimeout(1500); R.b1 = await st(); R.b1hd = await p.evaluate(() => document.querySelector('#rnas .as-hd').innerText.slice(0, 80));
  await p.locator('#rnas label:has([data-con])').nth(1).click(); await p.waitForTimeout(400); R.b2 = await st();
  await p.click('#as_save'); await p.waitForTimeout(800); R.b3 = await st();
  await p.locator('#rnas label:has([data-con])').nth(1).click(); await p.waitForTimeout(400); await p.click('#as_undo'); await p.waitForTimeout(150); await p.click('#as_undo'); await p.waitForTimeout(400); R.b4 = await st();
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
