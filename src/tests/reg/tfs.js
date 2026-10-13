const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; OUT.fsOkAfterBoot = S.fsOk; OUT.ordersLoaded = S.ordersLoaded;
    S.fsOk = false; fsWatchdog(); await wait(44000); const b = document.querySelector('#fsstall'); OUT.banner = b ? b.textContent.slice(0, 300) : 'NONE'; OUT.btns = b ? b.querySelectorAll('button').length : 0;
    S.fsOk = true; await wait(5500); OUT.gone = !document.querySelector('#fsstall'); return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);
