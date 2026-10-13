// 1.10.0: 하위 탭 · 시험 · 블록 지우기 · 벤치 상세 · 전체 보기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = (m) => { OUT.conf = (OUT.conf || []).concat([String(m).slice(0, 160)]); return true; }; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    firebase.firestore.FieldPath = firebase.firestore.FieldPath || { documentId: () => '__id' };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: 'x', registeredAt: '2026-09-01' }); S.prodLoaded = true; bump('p');
    const inf = { ...INFO['9788977396005'], at: new Date().toISOString() }; const inf2 = { ...INFO['9780000000002'], at: new Date().toISOString() };
    const base = { isbn: '9788977396005', branch: 1, grade: 2, qty: 1, saleState: 1, price: 6000, descMode: 'none', desc: '', info: inf };
    col('reg_items').b1 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:01:00Z' }; col('reg_items').b2 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:02:00Z' };
    col('reg_items').o1 = { ...base, stage: 'pick', method: 'one', createdAt: '2026-10-09T00:03:00Z', photos: { main: { name: 'a.jpg', path: 'reg_photos/o1/main.jpg', url: 'x' }, z: [], desc: [] } };
    col('reg_items').o2 = { ...base, isbn: '9780000000002', info: inf2, stage: 'pick', createdAt: '2026-10-09T00:04:00Z' };
    col('reg_items').n1 = { stage: 'pick', method: 'new', branch: 1, grade: 2, qty: 1, saleState: 1, price: 5000, descMode: 'none', new: { title: '세트' }, createdAt: '2026-10-09T00:05:00Z' };
    col('reg_items').d1 = { stage: 'done', day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 6500, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'x' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('reg_items').d2 = { stage: 'done', test: true, day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 9000, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'y' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('shp_cmds').c9 = { type: 'regBulk', status: 'done', step: 6, createdAt: new Date().toISOString(), results: { d1: { state: 'live', usedCode: 'U9' } } };
    liveReset('cmdhub'); S.cmdAll = null; cmdHub();
    openRegister(); await wait(600); S.regT = 'pick'; regRerender(); await wait(900); const sh = document.querySelector('#sheet'); const txt = (sel) => [...sh.querySelectorAll(sel)].map((x) => x.textContent.trim().split(String.fromCharCode(10)).join(' ')).join(' | ');
    OUT.sub = txt('.rgsub button'); OUT.cardsBulk = sh.querySelectorAll('.rgc2').length; OUT.btnBulk = txt('#rg_confirm'); OUT.allgo = txt('#rg_allgo');
    /* 벤치 상세 */
    col('app_settings').bench = { seed190: 'x', targets: [{ sc: '11', name: '가', on: true }, { sc: '22', name: '나', on: true }, { sc: '33', name: '다', on: false }] }; S._benchUn = undefined; S.bench = null; benchCfg(); await wait(400);
    col('bench_days')['11_2026-10-09'] = { sc: '11', day: '2026-10-09', base: false, total: 1000, add: 10, gone: 30, lowNow: 50, addBand: {}, goneBand: {}, totalBand: {}, addList: [], goneList: [] }; col('bench_state')['11'] = { day: '2026-10-09', pages: 21, lastPage: 21, secPerPage: 2, total: 1000 };
    S.sellers = new Map([['sc_11', { id: 'sc_11', sc: '11', name: '가' }], ['sc_44', { id: 'sc_44', sc: '44', name: '라책방' }]]); S.benchD = {};
    closeDetail && closeDetail(); S.tab = 'biz'; renderMain(); await wait(1200); OUT.benchMain = (benchHtml().replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ')).slice(0, 400);
    openBenchHub('cards'); await wait(800); const s2 = document.querySelector('#sheet'); OUT.hubCards = [...s2.querySelectorAll('.bh-card b')].map((x) => x.textContent).join(','); OUT.hubOff = s2.innerText.includes('제외한 판매자');
    document.querySelector('.verbar') && document.querySelector('.verbar').remove();
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/r110b.png' }); await br.close(); })();`);
