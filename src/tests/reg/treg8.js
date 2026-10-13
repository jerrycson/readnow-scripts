// 1.8.0: 대학교장터 칸 · 자동 등록 맡기기 · 등록 그룹 → 가격 감시
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = (m) => { OUT.conf = (OUT.conf || []).concat([String(m).slice(0, 160)]); return true; }; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    firebase.firestore.FieldPath = firebase.firestore.FieldPath || { documentId: () => '__id' };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: 'x' }); for (let i = 0; i < 30; i++) S.plist.set('aladin_X' + i, { id: 'aladin_X' + i, usedCode: 'X' + i, active: true, price: 1000 }); S.prodLoaded = true; bump('p');
    col('reg_items').o1 = { stage: 'pick', method: 'one', isbn: '9788977396005', branch: 1, grade: 2, qty: 1, saleState: 1, price: 6000, descMode: 'manual', desc: '띠지 있습니다.', descParts: { a: '띠지 있습니다.', b: '', c: '' }, info: { ...INFO['9788977396005'], at: new Date().toISOString() }, createdAt: '2026-10-09T00:01:00Z' };
    col('reg_items').d1 = { stage: 'done', day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 6500, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'x' }, info: { ...INFO['9788977396005'] }, createdAt: '2026-10-09T00:00:00Z' };
    col('shp_cmds').c9 = { type: 'regBulk', status: 'done', step: 6, createdAt: new Date().toISOString(), results: { d1: { state: 'live', usedCode: 'U9' } } };
    liveReset('cmdhub'); S.cmdAll = null; cmdHub();
    openRegister(); await wait(600); S.regT = 'pick'; regRerender(); await wait(900); const sh = document.querySelector('#sheet'); const card = () => sh.querySelector('[data-rgg="o1"]').closest('.card');
    OUT.hasUniv = !!sh.querySelector('[data-rguon="o1"]'); OUT.autoBtn = !!sh.querySelector('[data-rgauto1="o1"]'); OUT.autoAll = (sh.querySelector('#rg_autoall') || {}).textContent;
    sh.querySelector('[data-rguon="o1"]').click(); await wait(800); OUT.univOpen = !!sh.querySelector('[data-rgun="o1"][data-k="dept"]'); OUT.autoBtn2 = !!sh.querySelector('[data-rgauto1="o1"]'); OUT.badTxt = (card().innerText.match(/먼저: [^\\n]*/) || [''])[0];
    window.cloudCall = async (path, req) => { if (path === '/regaux') return { ok: true, v: { list: [{ id: '55', nav: '경상계열 > 경영학과' }] } }; return {}; };
    sh.querySelector('[data-rgucopen="o1"]').click(); await wait(900); const pk = sh.querySelector('[data-rgucpick="o1"]'); OUT.ucList = !!pk; if (pk) { pk.click(); await wait(800); }
    const dept = sh.querySelector('[data-rgun="o1"][data-k="dept"]'); dept.value = '경영학과'; dept.dispatchEvent(new Event('change')); await wait(900);
    OUT.univ = JSON.stringify(window.__store.reg_items.o1.univ); OUT.autoBtn3 = !!sh.querySelector('[data-rgauto1="o1"]');
    sh.querySelector('[data-rgauto1="o1"]').click(); await wait(1500);
    const cmd = Object.entries(window.__store.shp_cmds).find(([k]) => k.startsWith('ra_o1')); OUT.cmd = cmd ? JSON.stringify(cmd[1]).slice(0, 300) : null; OUT.plan = JSON.stringify((window.__store.reg_items.o1.plan || {}).univ); OUT.autoCmd = window.__store.reg_items.o1.autoCmd;
    await wait(500); OUT.line = ((card().innerText.match(/🤖[^\\n]*/) || [''])[0]);
    S.regT = 'done'; regRerender(); await wait(900); const wb = sh.querySelector('[data-rgwatch]'); OUT.watchBtn = wb && wb.textContent;
    if (wb) { wb.click(); await wait(1500); } const g = Object.entries(window.__store.prd_price_batches || {}).find(([k, v]) => v.fromReg); OUT.group = g ? JSON.stringify({ name: g[1].name, only: g[1].cond.only, watch: g[1].watch.apply, cnt: g[1].lastCount }) : null; OUT.dec = JSON.stringify((window.__store.prd_price_decisions || {}).aladin_U9);
    OUT.shard = JSON.stringify(Object.entries(window.__store.prd_price_batches || {}).filter(([k, v]) => v.shardOf).map(([k, v]) => v.start));
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
