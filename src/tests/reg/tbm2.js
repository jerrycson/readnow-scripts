const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    const dc = db.collection; db.collection = (n) => { const c = dc(n); const d0 = c.doc; c.doc = (id) => { const r = d0(id); r.collection = (m) => db.collection(n + '/' + id + '/' + m); return r; }; return c; };
    const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kd = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
    col('app_settings').bench = { seed190: 'x', targets: [{ sc: '111', name: '판매자일', on: true }, { sc: '222', name: '판매자이', on: true }, { sc: '333', name: '판매자삼', on: true }], groups: [{ id: 'gA', name: '자주', unit: 'h', n: 3, scs: ['222'] }], fields: { isbn: true, cat: true } };
    col('bench_state')['111'] = { sc: '111', day: kd(now - 864e5), runAt: iso(now - 26 * 3600e3), chunks: 1, total: 5, pages: 3, lastPage: 3, secPerPage: 2.5, detailNow: 3, lowNow: 2 };
    col('bench_state')['222'] = { sc: '222', day: kd(now), runAt: iso(now - 3600e3), chunks: 0, total: 100, pages: 40, lastPage: 40, secPerPage: 2 };
    col('bench_state/111/c')['0'] = { m: { a1: [5000, '20261001', '상', 1, '책하나', 1, 0, '9788977396005', '국내도서>인문학>철학', '2019-03', 1], a2: [12000, '20261001', '최상', 1, '책둘', 0, 0, '9791167030580', '국내도서>소설/시/희곡>한국소설', '2020-01', 1], a3: [2500, '20261005', '중', 0, '책셋', 0, 0, null, null, null, 0], a4: [45000, '20261006', '상', 0, '책넷', 1, 0, '9780000000099', '국내도서>인문학>심리학', null, 1], a5: [8000, '20261007', '상', 0, '책다섯', 0, '20261008'] } };
    const D1 = kd(now - 2 * 864e5), D2 = kd(now - 864e5);
    col('bench_days')['111_' + D1] = { sc: '111', day: D1, base: true, total: 3 };
    col('bench_days')['111_' + D2] = { sc: '111', day: D2, add: 2, gone: 2, total: 5, sumNow: 64500, priceN: 4, sumLow: 50000, sumGone: 10500, sumAdd: 45000, runAt: iso(now - 26 * 3600e3), addList: [JSON.stringify(['a4', '책넷', 45000, '상', null, '9780000000099', 50000, 1, '국내도서>인문학>심리학'])], goneList: [JSON.stringify(['g1', '팔린책', 7000, '상', 2, '20261005', 1, '9788977396005', '국내도서>인문학>철학', null]), JSON.stringify(['g2', '빨리팔린책', 3500, '중', 1, '20261006', 0, '9781111111111', '국내도서>소설/시/희곡>한국소설', null])], movedList: [JSON.stringify(['a1', 6000, 5000])], lowOnList: [JSON.stringify(['a1', '책하나', 5000, '상', 1])], addBand: {}, goneBand: {}, lowNow: 2, goneLow: 1 };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: '관광' }); S.prodLoaded = true; bump('p');
    S._benchUn = undefined; S.bench = null; benchCfg(); await wait(300); S.benchD = {};
    S.tab = 'biz'; renderMain(); await wait(1500); const bz = document.querySelector('#bz_bench') || [...document.querySelectorAll('h2,h3,summary,button')].find((x) => /집중 벤치마킹 — 종합/.test(x.textContent)); OUT.bizOrder = [...document.querySelectorAll('#main [data-sec], #main .sec h2, #main details > summary')].slice(0, 6).map((x) => x.textContent.slice(0, 20));
    OUT.bizHtml = (document.querySelector('#main') || {}).innerText.slice(0, 600);
    openBenchHub('board'); await wait(1500); const sh = document.querySelector('#sheet'); OUT.board = sh.innerText.slice(0, 1500); OUT.blocks = sh.querySelectorAll('.bg-blk').length;
    sh.querySelector('#bh_gadd').click(); await wait(800); OUT.groupsAfterAdd = (col('app_settings').bench.groups || []).map((g) => g.name + ':' + g.scs.join(','));
    const sel = document.querySelector('#sheet [data-bhmvg="111"]'); sel.value = 'gA'; sel.onchange(); await wait(800); OUT.groupsAfterMove = (col('app_settings').bench.groups || []).map((g) => g.name + ':' + g.scs.join(',')); OUT.targetsOrder = col('app_settings').bench.targets.map((t) => t.sc).join(',');
    const u = document.querySelector('#sheet [data-bgu="gA|d"]'); u.click(); await wait(800); OUT.unitA = col('app_settings').bench.groups.find((g) => g.id === 'gA').unit;
    openBenchHub('fields', true); await wait(500); OUT.fields = document.querySelector('#sheet').innerText.slice(0, 900); const cb = document.querySelector('#sheet [data-bhfld="detail"]'); cb.checked = true; cb.onchange(); await wait(600); OUT.fieldsSaved = col('app_settings').bench.fields;
    openBenchHub('cmp', true); await wait(400);
    history.back(); await wait(300); openBench('111'); await wait(3000); OUT.detail = document.querySelector('#sheet').innerText.slice(0, 4000);
    const bv = document.querySelector('#sheet [data-bvk="bands"]'); bv.value = '5000, 10000'; document.querySelector('#sheet #bv_save').click(); await wait(1200); OUT.view = col('app_settings').bench.view; OUT.detail2 = (document.querySelector('#sheet').innerText.match(/가격대 — 재고[\\s\\S]{0,400}/) || [''])[0];OUT.money = (document.querySelector('#sheet').innerText.match(/💰 판매가[\\s\\S]{0,1400}/) || [''])[0]; S.tab = 'biz'; document.querySelector('#sheet').classList.remove('on'); S.detail = null; renderMain(); await wait(1500); OUT.bizKpi = (() => { const d = document.createElement('div'); d.innerHTML = benchHtml(); document.body.appendChild(d); const t = d.innerText; d.remove(); return t.slice(0, 600); })(); openBenchHub('cmp'); await wait(1200); OUT.cmp = (document.querySelector('#sheet table.bh-tb') || {}).innerText; OUT.tip0 = (document.querySelector('.bh-tips li') || {}).innerText; document.querySelector('#sheet').scrollTop = 0;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 4).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/b113.png', fullPage: false }); await br.close(); })();`);
