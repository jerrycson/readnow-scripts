// 1.7.0: 취소 목록 대조 · 집중 벤치마킹 화면 · 참고 가격 · 예스24 · 묻고답하기 문구 넣기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}

    window.toast = (m) => { OUT.toasts = (OUT.toasts || []).concat([m]); };
    col('app_settings').bench = { targets: [{ sc: '123', name: '큰서점', on: true }, { sc: '349846', name: '딱따구리', on: false }] }; S._benchUn = undefined; S.bench = null; benchCfg(); await wait(800);
    const T1 = col('app_settings').bench.targets; OUT.seedN = T1.length; OUT.seedOn = T1.filter((t) => t.on !== false).length; OUT.seed123 = JSON.stringify(T1.find((t) => t.sc === '123')); OUT.seedDak = (T1.find((t) => t.sc === '349846') || {}).on; OUT.seedFlag = !!col('app_settings').bench.seed190;
    /* 다시 열어도 다시 넣지 않음 — 관리자가 뺀 판매자 */
    await benchSet('19745', '집현전', false); await wait(300); S._benchUn(); S._benchUn = undefined; benchCfg(); await wait(800); OUT.reseed = (col('app_settings').bench.targets.find((t) => t.sc === '19745') || {}).on;
    await benchSet('19745', '집현전', true); await benchSet('777', '열여섯째', true); await wait(300); OUT.limit = (OUT.alerts || []).slice(-1)[0]; OUT.has777 = !!col('app_settings').bench.targets.find((t) => t.sc === '777');
    /* 최저가 통계 */
    col('bench_days')['349846_2026-10-08'] = { sc: '349846', day: '2026-10-08', base: true, total: 1000, add: 0, gone: 0, totalBand: { '~3천': 400, '3~6천': 600 }, lowNow: 50, lowOn: 50, lowOff: 0, goneLow: 0, addLow: 0, lowBand: { '~3천': 30, '3~6천': 20 } };
    col('bench_days')['349846_2026-10-09'] = { sc: '349846', day: '2026-10-09', base: false, total: 1000, add: 20, gone: 20, addBand: { '~3천': 20 }, goneBand: { '~3천': 20 }, addGrade: {}, goneGrade: {}, addYear: {}, goneLife: {}, addList: [], goneList: [['801', '팔린 최저가 책', 2500, '중', null, '20261008', 1], ['802', '그냥 책', 2600, '상', null, '20261008', 0]], totalBand: { '~3천': 400, '3~6천': 600 }, lowNow: 55, lowOn: 12, lowOff: 3, goneLow: 4, goneLowNew: 0, addLow: 2, lowBand: { '~3천': 35, '3~6천': 20 }, lowOnList: [['901', '새 최저가', 2400, '상', 3]], lowOffList: [['902', '밀린 책', 3000, '중']] };
    col('bench_probe')['349846'] = { n: 25, withPrice: 25, withGrade: 25, withLow: 3 }; col('bench_state')['349846'] = { day: '2026-10-09', pages: 40 };
    S.tab = 'biz'; renderMain(); await wait(1200); await benchLoad('349846', true); OUT.row = benchHtml().replace(/<[^>]+>/g, ' ').split('딱따구리')[1].slice(0, 300);
    await openBench('349846'); await wait(800); const tx = document.querySelector('#sheet').innerText.replace(/\s+/g, ' '); const k = tx.indexOf('🏷 최저가 표시'); OUT.low = tx.slice(k, k + 700); OUT.goneMark = tx.includes('사라질 때 최저가');
    /* 취소 되돌리기 */
    S.cxDocs = new Map([['L1', { resolved: { kind: 'undo', at: '2026-10-09T10:00:00Z' } }], ['L2', { resolved: { kind: 'done', at: '2026-10-09T10:00:00Z' } }]]);
    OUT.cxUndo = cxRes({ l: { id: 'L1' }, hits: [{ at: '2026-10-01T00:00' }] }); OUT.cxDone = !!cxRes({ l: { id: 'L2' }, hits: [{ at: '2026-10-01T00:00' }] });
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rb190.png' }); await br.close(); })();`);
