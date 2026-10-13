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
  const st = () => p.evaluate(() => { const s = document.querySelector('#as_save'), u = document.querySelector('#as_undo'); return { dirty: __T.ED.dirty, save: s && !s.disabled, undo: u && !u.disabled, hd: document.querySelector('#rnas .as-hd').innerText.split('\n')[1], msg: [...document.querySelectorAll('#rnas .as-msg')].map((x) => x.innerText.slice(0, 90)), on: FS.docs['prd_system/autoSched'].on, ext: FS.docs['app_settings/ext'].on, hist: __T.E.histN(), fut: __T.E.histN(1) }; });
  await p.evaluate(() => __T.asEdOpen()); await p.waitForTimeout(500);
  await p.click('#rnas .as-hd label.sw'); await p.waitForTimeout(800); R.off = await st();
  await p.keyboard.press('Control+z'); await p.waitForTimeout(800); R.undoOn = await st();
  await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(800); R.redoOff = await st();
  // 끈 상태에서 칸 고치기 → 저장 / 모두 되돌리기
  await p.locator('#rnas label:has([data-con])').nth(1).click(); await p.waitForTimeout(400); R.edit = await st();
  await p.click('#as_undo'); await p.waitForTimeout(150); await p.click('#as_undo'); await p.waitForTimeout(400); R.revert = await st();
  await p.locator('#rnas label:has([data-con])').nth(1).click(); await p.waitForTimeout(400); await p.click('#as_save'); await p.waitForTimeout(800); R.saved = await st();
  // Ctrl+Z 순서: 칸 고침(저장 뒤) → 그 전 '전체 끔'
  await p.keyboard.press('Control+z'); await p.waitForTimeout(500); R.z1 = await st();
  // 늘 도는 일 스위치
  await p.locator('#rnas label:has([data-bik])').first().click(); await p.waitForTimeout(800); R.bi = await st();
  await p.keyboard.press('Control+z'); await p.waitForTimeout(800); R.biUndo = await st();
  // 다른 곳이 그사이 바꾼 경우: 전체 켬 → 밖에서 끔 → Ctrl+Z는 덮지 않음
  await p.click('#rnas .as-hd label.sw'); await p.waitForTimeout(800); R.on2 = await st(); await p.evaluate(() => fsSet('prd_system/autoSched', { on: false }, true)); await p.waitForTimeout(800);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(800); R.conf = await st();
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
