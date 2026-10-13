const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob'; eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP} window.confirm = () => true; window.alert = (m) => { OUT.alert = m; };
    S.devOk = true; S.app.adminDevices = [deviceName()]; OUT.adm = isAdminDevice();
    const T = []; for (let i = 0; i < 15; i++) T.push({ sc: String(500 + i), name: '판매' + i, on: true });
    col('app_settings').bench = { targets: T, seed190: true }; S._benchUn = undefined; S.bench = null; S._benchSelf = 0; benchCfg(); await wait(800);
    for (const sc of ['500', '501', OUR_SC]) { col('bench_days')[sc + '_2026-10-09'] = { sc, day: '2026-10-09', base: true, total: 1000, add: 0, gone: 0, lowNow: 40, runAt: '2026-10-09T01:00:00Z' }; col('bench_days')[sc + '_2026-10-10'] = { sc, day: '2026-10-10', base: false, total: 1010, add: sc === OUR_SC ? 30 : 20, gone: sc === OUR_SC ? 25 : 10, lowNow: sc === OUR_SC ? 80 : 40, runAt: '2026-10-10T01:00:00Z' }; col('bench_state')[sc] = { day: '2026-10-10', pages: 21, lastPage: 21, secPerPage: 3 }; await benchLoad(sc, true); }
    S.plist.set('L1', { id: 'L1', title: 'x', price: 9000, active: true, bookId: 'b1' }); S.plist.set('L2', { id: 'L2', title: 'y', price: 5000, active: true, bookId: 'b2' }); S._mc && 0;
    S.pmetrics = new Map([['b1', { usedFirstPage: [{ sellerCode: 777, sellerName: '경쟁A', price: 7000 }, { sellerCode: 888, sellerName: '경쟁B', price: 9500 }, { sellerCode: 500, sellerName: '판매0', price: 8000 }] }], ['b2', { usedFirstPage: [{ sellerCode: 777, sellerName: '경쟁A', price: 4000 }] }]]); S.pmLoaded = true; bump();
    await openBenchHub('board'); await wait(800); const sh = document.querySelector('#sheet');
    OUT.maxBox = (sh.querySelector('#bh_max') || {}).value + ' | ' + (sh.querySelector('#bh_maxest') || {}).textContent;
    OUT.self = (sh.querySelector('.bh-self') || {}).innerText.replace(/\\s+/g, ' ');
    S._bhRecOpen = true; await openBenchHub(null, true); await wait(300); OUT.rec = (document.querySelector('#bh_rec') || {}).innerText.replace(/\\s+/g, ' ').slice(0, 400);
    await benchSet('999', '열여섯', true); await wait(300); OUT.block = OUT.alert || 'none'; OUT.n16 = !!col('app_settings').bench.targets.find((t) => t.sc === '999');
    const mi = sh.querySelector('#bh_max'); mi.value = '20'; mi.dispatchEvent(new Event('input', { bubbles: true })); OUT.est20 = sh.querySelector('#bh_maxest').textContent;
    sh.querySelector('#bh_maxsave').click(); await wait(500); OUT.saved = JSON.stringify({ max: col('app_settings').bench.max, hist: col('app_settings').bench.maxHist });
    OUT.alert = null; await benchSet('999', '열여섯', true); await wait(400); OUT.after = OUT.alert || 'ok'; OUT.n16b = !!(col('app_settings').bench.targets.find((t) => t.sc === '999') || {}).on;
    await openBenchHub(null, true); await wait(500); OUT.maxBox2 = (document.querySelector('#bh_maxest') || {}).textContent;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.evaluate(() => document.querySelectorAll('.verbar').forEach((x) => x.remove())); await p.screenshot({ path: SP + '/reg/bmax_${MOB ? 'm' : 'pc'}.png' }); await br.close(); })();`);
