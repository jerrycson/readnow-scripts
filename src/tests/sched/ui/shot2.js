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
  // 긴 일(자정 넘김): scanDaily 20:00 회차가 6시간 걸린다고
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(FS.docs['prd_system/jobStats'])); j.jobs['prd:aladinBuy'] = { runs: [{ at: new Date().toISOString(), ms: 5 * 3600e3, st: 'done' }, { at: new Date(Date.now() - 864e5).toISOString(), ms: 4 * 3600e3, st: 'done' }] }; fsSet('prd_system/jobStats', j); }); await p.waitForTimeout(300);
  await p.evaluate(() => __T.asEdOpen()); await p.waitForTimeout(600);
  const g = async (n) => { const w = await p.$('#rnas .tl-w'); await w.screenshot({ path: __dirname + '/' + n + '.png' }); };
  await g('tl_a');
  R.m = await p.evaluate(() => { const sc = document.querySelector('#rnas .tl-scroll'); return { sw: sc.scrollWidth, cw: sc.clientWidth, sl: sc.scrollLeft, hrs: document.querySelectorAll('#rnas .tl-hr span').length, nd: !!document.querySelector('#rnas .tl-nd'), ov: [document.getElementById('rnas').scrollWidth, document.getElementById('rnas').clientWidth] }; });
  // 블록 고르기 (벤치마킹)
  await p.evaluate(() => { const b = [...document.querySelectorAll('#rnas .tl-b')].find((x) => /벤치/.test(x.title)); b.scrollIntoView({ block: 'center', inline: 'center' }); });
  const bb = await p.evaluate(() => { const b = [...document.querySelectorAll('#rnas .tl-b')].find((x) => /벤치/.test(x.title)); const r = b.getBoundingClientRect(); return [r.x + 4, r.y + 6]; });
  await p.mouse.click(bb[0], bb[1]); await p.waitForTimeout(300); R.info1 = await p.evaluate(() => document.querySelector('#rnas .tl-info').innerText); await g('tl_sel');
  // 기록 없는 칸 고르기
  const b2 = await p.evaluate(() => { const b = [...document.querySelectorAll('#rnas .tl-b')].find((x) => /알라딘 팔기/.test(x.title)); b.scrollIntoView({ block: 'center', inline: 'center' }); const r = b.getBoundingClientRect(); return [r.x + 3, r.y + 6]; });
  await p.mouse.click(b2[0], b2[1]); await p.waitForTimeout(300); R.info2 = await p.evaluate(() => document.querySelector('#rnas .tl-info').innerText); R.selBlk = await p.evaluate(() => __T.ED.selBlk);
  await p.keyboard.press('Delete'); await p.waitForTimeout(300); R.afterDel = await p.evaluate(() => __T.ED.draft.find((s) => s.id === 'buyback').trig.times);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(300); R.afterZ = await p.evaluate(() => __T.ED.draft.find((s) => s.id === 'buyback').trig.times);
  // 빈 곳 끌기 + 관성
  const sb = await p.evaluate(() => { const sc = document.querySelector('#rnas .tl-scroll'); sc.scrollIntoView({ block: 'center' }); const r = sc.getBoundingClientRect(); return [r.x + 400, r.y + r.height - 12, sc.scrollLeft]; });
  R.pt = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.className || e.tagName); }, [sb[0], sb[1]]); await p.mouse.move(sb[0], sb[1]); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(sb[0] + i * 30, sb[1]); await p.waitForTimeout(12); } await p.mouse.up();
  const s1 = await p.evaluate(() => document.querySelector('#rnas .tl-scroll').scrollLeft); await p.waitForTimeout(900); const s2 = await p.evaluate(() => document.querySelector('#rnas .tl-scroll').scrollLeft);
  R.pan = [sb[2], s1, s2]; R.cursor = await p.evaluate(() => getComputedStyle(document.querySelector('#rnas .tl-scroll')).cursor);
  // 다시 그리기 뒤 자리 유지
  await p.evaluate(() => __T.E.refresh(true)); await p.waitForTimeout(200); R.keep = await p.evaluate(() => document.querySelector('#rnas .tl-scroll').scrollLeft);
  // 블록 끌어 시각 바꾸기
  const qb = await p.evaluate(() => { const b = [...document.querySelectorAll('#rnas .tl-b.drag')].find((x) => /묻고/.test(x.title) && /13:00/.test(x.title)); b.scrollIntoView({ block: 'center', inline: 'center' }); const r = b.getBoundingClientRect(); return [r.x + 3, r.y + 6]; });
  await p.mouse.move(qb[0], qb[1]); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(qb[0] + i * 8, qb[1]); await p.waitForTimeout(15); } await p.mouse.up(); await p.waitForTimeout(300);
  R.moved = await p.evaluate(() => __T.ED.draft.find((s) => s.id === 'qna').trig.times); await g('tl_end');
  await p.setViewportSize({ width: 700, height: 900 }); await p.waitForTimeout(300); R.narrow = await p.evaluate(() => { const o = document.getElementById('rnas'); return [o.scrollWidth, o.clientWidth]; });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
