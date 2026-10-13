const fs = require('fs'); const { wrapped, chromium } = require('./page.js');
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 950 } }); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.setContent('<html><body style="font-family:sans-serif"><div id="rnp" style="width:360px"><div class="sec rnp-sched" id="rnpSched"></div></div></body></html>');
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/harness.js', 'utf8') });
  // 예전 문서(1.59 모양) + 회차 기록 + 일 기록
  await p.evaluate(() => { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const iso = (h, m) => new Date(Date.parse(`${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+09:00`)).toISOString();
    FS.docs['prd_system/autoSched'] = { on: true, items: { qna: { on: true, times: ['09:00', '13:00', '17:00'] }, returns: { on: true, times: ['10:00', '16:00'] }, scanDaily: { on: true, times: ['00:01', '20:00'] }, buyback: { on: true, times: ['21:00'] }, aladinBuy: { on: true, times: ['22:00'] }, crmBulk: { on: false, times: ['06:00'] }, chain: { on: false, times: ['17:00'] } } };
    FS.docs['prd_jobs/autoSched'] = { runs: { [`qna@${day}@09:00`]: { by: 'HOME', at: iso(9, 4), state: 'done', ms: 240000 } } };
    FS.docs['prd_system/jobStats'] = { jobs: { 'prd:market': { runs: [{ at: iso(1, 0), ms: 35 * 60e3, st: 'done', src: 'job' }, { at: iso(2, 0), ms: 45 * 60e3, st: 'done', src: 'log' }] }, 'prd:scanDaily': { runs: [{ at: iso(0, 30), ms: 12 * 60e3, st: 'done' }] } } }; });
  await p.addScriptTag({ content: require('./page.js').core }); await p.addScriptTag({ content: wrapped }); await p.waitForTimeout(500);
  const R = {};
  R.panel = await p.evaluate(() => document.getElementById('rnpSched').innerText.slice(0, 700));
  // 틱: 00:01 scanDaily 회차(어느 시각이든 지났음) → 실행
  await p.evaluate(() => __T.schedTick()); await p.waitForTimeout(1800);
  R.runs = await p.evaluate(() => ({ called: RUNS_CALLED.slice(), runs: Object.entries(__T.RUNS).map(([k, v]) => k + '=' + v.state + (v.ms ? ':' + v.ms : '') + (v.job ? ':' + v.job : '')), stats: Object.keys(__T.JSTATS), logs: LOGS.slice(-4) }));
  // 편집기
  await p.evaluate(() => __T.asEdOpen()); await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/ed1.png', fullPage: false });
  R.cards0 = await p.evaluate(() => [...document.querySelectorAll('#rnas .as-card .as-nm')].map((x) => x.textContent));
  // 끌어 순서 바꾸기: 1번(qna)을 3번 자리로
  const h = await p.$$('#rnas .as-h'); const b0 = await h[0].boundingBox(); const c2 = await (await p.$$('#rnas .as-card'))[2].boundingBox();
  await p.mouse.move(b0.x + 4, b0.y + 6); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(b0.x + 4, b0.y + 6 + (c2.y + c2.height / 2 - b0.y) * i / 12 + 4); await p.waitForTimeout(16); }
  R.midShift = await p.evaluate(() => [...document.querySelectorAll('#rnas .as-card')].map((c) => c.style.transform || '-').join(' | ')); await p.screenshot({ path: __dirname + '/ed_drag.png' });
  await p.mouse.up(); await p.waitForTimeout(500);
  R.cards1 = await p.evaluate(() => [...document.querySelectorAll('#rnas .as-card .as-nm')].map((x) => x.textContent)); R.dirty = await p.evaluate(() => __T.ED.dirty);
  // 넣을 일 끌어 2번 자리에
  const cat = await p.$('#rnas [data-cat="prd:market"]'); const cb = await cat.boundingBox(); const t1 = await (await p.$$('#rnas .as-card'))[1].boundingBox();
  await p.mouse.move(cb.x + 30, cb.y + 10); await p.mouse.down(); for (let i = 1; i <= 15; i++) { await p.mouse.move(cb.x + 30 + (t1.x + 100 - cb.x - 30) * i / 15, cb.y + 10 + (t1.y + 8 - cb.y - 10) * i / 15); await p.waitForTimeout(16); }
  R.ph = await p.evaluate(() => !!document.querySelector('#rnas .as-ph.on')); await p.screenshot({ path: __dirname + '/ed_cat.png' }); await p.mouse.up(); await p.waitForTimeout(700);
  R.cards2 = await p.evaluate(() => [...document.querySelectorAll('#rnas .as-card .as-nm')].map((x) => x.textContent)); R.formOpen = await p.evaluate(() => { const f = document.querySelector('#rnas .as-fw.open .as-form'); return f ? f.innerText.slice(0, 260) : null; });
  await p.screenshot({ path: __dirname + '/ed_form.png' });
  // 폼: '일정 간격'으로 · 2시간 · 시간 창 08~22
  await p.click('#rnas [data-ft="every"]'); await p.waitForTimeout(400); await p.click('#rnas [data-gd] summary'); await p.waitForTimeout(200); await p.check('#rnas [data-fwon]'); await p.waitForTimeout(400);
  R.slotNew = await p.evaluate(() => JSON.stringify(__T.ED.draft[1]));
  // 요일 토·일 빼기
  await p.click('#rnas [data-fday="0"]'); await p.waitForTimeout(200); await p.click('#rnas [data-fday="6"]'); await p.waitForTimeout(300);
  R.pv = await p.evaluate(() => document.querySelector('#rnas .as-pv').innerText);
  // after 순환 만들기 → 저장 막힘
  await p.evaluate(() => { const D = __T.ED.draft; D.push(__T.AS.sanitize({ id: 'x1', job: 'prd:buyback', trig: { t: 'after', of: 'x2' } }), __T.AS.sanitize({ id: 'x2', job: 'prd:aladinBuy', trig: { t: 'after', of: 'x1' } })); __T.asEdDraw(); });
  R.cycle = await p.evaluate(() => [document.querySelector('#rnas .as-msg.bad') && document.querySelector('#rnas .as-msg.bad').innerText, document.querySelector('#as_save').disabled]);
  await p.evaluate(() => { __T.ED.draft = __T.ED.draft.filter((x) => !['x1', 'x2'].includes(x.id)); __T.asEdDraw(); });
  // 시간표: 'returns' 10:00 블록 끌어 옮김
  const blk = await p.$('#rnas [data-tlt="returns|10:00"]'); const bb = await blk.boundingBox(); const tr = await (await blk.evaluateHandle((e) => e.parentElement)).asElement().boundingBox();
  await p.mouse.move(bb.x + 2, bb.y + 5); await p.mouse.down(); await p.mouse.move(bb.x + 2 + tr.width / 24 * 1.5, bb.y + 5, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
  R.tl = await p.evaluate(() => JSON.stringify(__T.ED.draft.find((x) => x.id === 'returns').trig) + ' | ' + (document.querySelector('#rnas .as-msg') || {}).innerText);
  // 저장
  await p.click('#as_save'); await p.waitForTimeout(500);
  R.saved = await p.evaluate(() => { const D = FS.docs['prd_system/autoSched']; return { rev: D.rev, ver: D.ver, n: D.slots.length, order: D.slots.map((s) => s.id).join(','), items: JSON.stringify(D.items), edits: Object.keys(FS.docs).filter((k) => /edits/.test(k)), msg: (document.querySelector('#rnas .as-msg') || {}).innerText }; });
  // 충돌: 다른 곳이 rev 올림 → 고친 뒤 저장 막힘
  await p.evaluate(() => { const c = document.querySelector('#rnas [data-con]'); c.checked = !c.checked; c.dispatchEvent(new Event('change')); }); await p.waitForTimeout(200);
  await p.evaluate(() => { fsSet('prd_system/autoSched', { rev: 99, at: 'x' }, { merge: true }); }); await p.waitForTimeout(300);
  R.conf = await p.evaluate(() => [__T.ED.conf, !!document.querySelector('#as_reload')]);
  await p.click('#as_save').catch(() => {}); await p.waitForTimeout(400); R.confSave = await p.evaluate(() => [FS.docs['prd_system/autoSched'].rev, (document.querySelector('#rnas .as-msg.bad') || {}).innerText]);
  await p.click('#as_reload'); await p.waitForTimeout(100); await p.click('#as_reload'); await p.waitForTimeout(300); R.afterReload = await p.evaluate(() => [__T.ED.dirty, __T.ED.conf]);
  // 다음 틱: 새 칸(간격) 실행 여부 · 이 PC 이름
  await p.evaluate(() => { RUNS_CALLED.length = 0; }); await p.evaluate(() => __T.schedTick()); await p.waitForTimeout(2000);
  R.tick2 = await p.evaluate(() => ({ called: RUNS_CALLED.slice(), last: LOGS.slice(-3) }));
  await p.screenshot({ path: __dirname + '/ed_final.png' });
  R.panel2 = await p.evaluate(() => { document.getElementById('rnas').style.display = 'none'; return document.getElementById('rnpSched').innerText.slice(0, 900); });
  await p.screenshot({ path: __dirname + '/panel.png', clip: { x: 0, y: 0, width: 380, height: 900 } });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
