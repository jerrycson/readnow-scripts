const fs = require('fs'); const { wrapped, chromium } = require('./page.js');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.setContent('<div id="rnpSched"></div>'); await p.addScriptTag({ content: fs.readFileSync(__dirname + '/harness.js', 'utf8') });
  await p.evaluate(() => { window.JOB_MS = 100; const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); window.DAY = day; const nowMin = new Date(Date.now() + 9 * 3600e3); const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; const cur = nowMin.getUTCHours() * 60 + nowMin.getUTCMinutes();
    window.T_LATE = hm(Math.max(0, cur - 90)); window.T_OK = hm(Math.max(0, cur - 5));
    FS.docs['prd_system/autoSched'] = { on: true, rev: 3, slots: [
      { id: 'late', job: 'prd:market', on: true, trig: { t: 'time', times: [T_LATE] }, late: 30 },
      { id: 'gap', job: 'prd:scanDaily', on: true, trig: { t: 'time', times: [T_OK] }, gapH: 6 },
      { id: 'err', job: 'prd:buyback', on: true, trig: { t: 'time', times: [T_OK] }, retry: { n: 1, gap: 5 } },
      { id: 'crm', job: 'crm:qna', on: true, trig: { t: 'time', times: [T_OK] } },
      { id: 'gone', job: 'prd:noSuchJob', on: true, trig: { t: 'time', times: [T_OK] } }] };
    FS.docs['prd_system/jobStats'] = { jobs: { 'prd:scanDaily': { runs: [{ at: new Date(Date.now() - 2 * 3600e3).toISOString(), ms: 60000, st: 'done' }] } } };
    window.__rnLogDay = async (d) => ({ day: d, lines: d === DAY ? [{ t: Date.now() - 5 * 3600e3, x: "■ '알라딘 팔기 내역' 끝남 — 7분" }, { t: Date.now() - 4 * 3600e3, x: "⏰ 매일 자동: '묻고 답하기' 끝 (3분)" }, { t: Date.now() - 3 * 3600e3, x: "■ '도서 정보·시장 지표' 끝남 — 2분 (멈춤)" }] : [] }); });
  await p.addScriptTag({ content: require('./page.js').core }); await p.addScriptTag({ content: wrapped }); await p.waitForTimeout(400); const R = {};
  await p.evaluate(() => { window.__failNext = 1; return __T.schedTick(); }); await p.waitForTimeout(600);
  R.t1 = await p.evaluate(() => ({ called: RUNS_CALLED.slice(), runs: Object.entries(__T.RUNS).map(([k, v]) => k.replace(DAY, 'D') + '=' + v.state + (v.why ? ' (' + v.why + ')' : '') + (v.err ? ' err:' + v.err : '')) }));
  await p.evaluate(() => __T.schedTick()); await p.waitForTimeout(600); await p.evaluate(() => __T.schedTick()); await p.waitForTimeout(600);
  R.t2 = await p.evaluate(() => ({ called: RUNS_CALLED.slice(), runs: Object.entries(__T.RUNS).map(([k, v]) => k.replace(DAY, 'D') + '=' + v.state) }));
  // busy: runJob returns false
  await p.evaluate(() => { FS.docs['prd_system/autoSched'].slots.push({ id: 'busy', job: 'prd:aladinBuy', on: true, trig: { t: 'time', times: [T_OK] } }); fsSet('prd_system/autoSched', { rev: 4 }, { merge: true }); }); await p.waitForTimeout(100);
  R.busy = await p.evaluate(async () => { const orig = window.JOB_MS; window.__T; let k = Object.keys(__T.RUNS).length; /* runJob false 흉내: 회차 열쇠를 먼저 보고 바로 지우는지 */ return k; });
  R.next = await p.evaluate(() => JSON.stringify(window.__rnSchedNext()));
  // 이 PC 기록에서 채우기
  await p.evaluate(() => { const m = document.createElement('x'); }); await p.waitForTimeout(100);
  R.seed = await p.evaluate(async () => { await __T.jobStatSeed(); await new Promise((r) => setTimeout(r, 100)); const J = FS.docs['prd_system/jobStats'].jobs; return [Object.entries(J).map(([k, v]) => k + ':' + v.runs.map((x) => x.st + '/' + x.ms + '/' + (x.src || '')).join(',')), GMV['rn-jobstats-seed'], LOGS.slice(-1)]; });
  console.log(JSON.stringify(R, null, 1)); console.log(errs.join('\n')); await br.close(); })();
