const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob'; eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  const cdp = await p.context().newCDPSession(p); await cdp.send('Debugger.enable'); cdp.on('Debugger.paused', (ev) => { console.log('STACK', ev.callFrames.slice(0, 10).map((f) => f.functionName + ':' + f.location.lineNumber + ':' + f.location.columnNumber).join(' <- ')); process.exit(0); }); setTimeout(() => cdp.send('Debugger.pause'), 40000); await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
    const T = [{ sc: '123', name: '큰서점', on: true }]; for (let i = 0; i < 14; i++) T.push({ sc: String(500 + i), name: '판매' + i, on: true });
    col('app_settings').bench = { targets: T, seed190: true }; S._benchUn = undefined; S.bench = null; S._benchSelf = 0; benchCfg(); await wait(1000);
    const T1 = col('app_settings').bench.targets; OUT.n = T1.length; OUT.self = JSON.stringify(T1.find((t) => t.sc === OUR_SC)); OUT.cnt = benchCount(T1);
    for (const sc of ['123', OUR_SC]) { col('bench_days')[sc + '_2026-10-10'] = { sc, day: '2026-10-10', base: true, total: sc === OUR_SC ? 900 : 1500, add: 0, gone: 0, totalBand: { '~3천': 400 }, lowNow: 50 }; col('bench_state')[sc] = { day: '2026-10-10', pages: 30 }; }
    await benchLoad('123', true); await benchLoad(OUR_SC, true);
    await openBenchHub('board'); await wait(1000); const sh = document.querySelector('#sheet'); const sc = sh.querySelector('.bh-self'); OUT.has = !!sc; OUT.txt = sc && sc.innerText.replace(/\\s+/g, ' ').slice(0, 300);
    OUT.boardSelf = [...sh.querySelectorAll('[data-benchopen]')].filter((b) => b.dataset.benchopen === OUR_SC && !b.closest('.bh-self')).length;
    OUT.tabsTxt = sh.querySelector('.ptabs').innerText.replace(/\\s+/g,' ');
    window.confirm = () => true; sh.querySelector('.bh-self .btn').click(); await wait(600); const T2 = col('app_settings').bench.targets.find((t) => t.sc === OUR_SC); OUT.off = T2.on; await wait(500); const sc2 = document.querySelector('#sheet .bh-self'); OUT.offTxt = sc2.innerText.replace(/\s+/g, ' ').slice(0, 260); OUT.grp = [...document.querySelectorAll('#sheet .bg-blk .hint')].map((x) => x.textContent).join(' | ').slice(0, 200);
    S._benchSelf = 0; benchSelfEnsure(); await wait(300); OUT.stillOff = col('app_settings').bench.targets.find((t) => t.sc === OUR_SC).on;
    document.querySelector('#sheet .bh-self .btn').click(); await wait(500); OUT.on = col('app_settings').bench.targets.find((t) => t.sc === OUR_SC).on; return JSON.stringify(OUT, null, 1);
    const filler = document.createElement('div'); filler.style.height = '3000px'; sh.querySelector('.bh-self').parentNode.appendChild(filler);
    const scroller = [sh, sh.querySelector('.sheet-body')].find((x) => x && x.scrollHeight > x.clientHeight + 10) || sh; scroller.scrollTop = 1200; await wait(300);
    const rr = sc.getBoundingClientRect(), hr = (sh.querySelector('.sh') || sh).getBoundingClientRect(), tr = sh.querySelector('.ptabs').getBoundingClientRect(); OUT.selfTop = Math.round(rr.top); OUT.headBottom = Math.round(hr.bottom); OUT.tabsTop = Math.round(tr.top); OUT.st = scroller.scrollTop;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/self_${MOB ? 'm' : 'pc'}.png' }); await br.close(); })();`);
