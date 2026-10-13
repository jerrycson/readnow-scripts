const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      col('app_settings').bench = { targets: [{ sc: '349846', name: '딱따구리', on: true }], seed190: true }; S._benchUn = undefined; S.bench = null; benchCfg(); await wait(500);
      const B = col('bench_days'); B['a'] = { sc: '349846', day: '2026-10-09', base: true, total: 60197, pages: 1255, runAt: '2026-10-09T07:39:00Z', missOnce: 0 };
      B['b'] = { sc: '349846', day: '2026-10-10', base: false, partial: true, complete: false, total: 4944, pages: 104, runAt: '2026-10-09T16:24:00Z', missOnce: 55264 };
      B['c'] = { sc: '349846', day: '2026-10-10', total: 60021, pages: 1202, runLastPage: 1201, add: 91, gone: 191, sumGone: 601830, missOnce: 76, spanDays: 1.2, runAt: '2026-10-10T12:38:00Z', lowOn: 125, lowOff: 67 };
      B['d'] = { sc: '349846', day: '2026-10-10', total: 60001, pages: 1202, add: 2, gone: 76, sumGone: 121200, missOnce: 22, spanDays: 0.08, runAt: '2026-10-10T14:35:00Z' };
      B['e'] = { sc: '349846', day: '2026-10-11', total: 59901, pages: 1200, add: 57, gone: 21, sumGone: 90010, missOnce: 158, spanDays: 0.75, runAt: '2026-10-11T08:23:00Z' };
      col('bench_state')['349846'] = { day: '2026-10-11', pages: 1200 };
      await benchLoad('349846', true); await openBench('349846'); await wait(800); const t = document.querySelector('#sheet .bd2t'); if (t) t.open = true; OUT.tbl = t ? t.innerText.replace(/\\t/g, ' | ').split(String.fromCharCode(10)).slice(0, 12).join(' // ') : 'none';
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);
