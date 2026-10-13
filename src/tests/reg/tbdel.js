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
    const _fv = firebase.firestore.FieldValue = firebase.firestore.FieldValue || {}; _fv.delete = _fv.delete || (() => undefined); _fv.arrayUnion = _fv.arrayUnion || ((...a) => a); OUT.fvBefore = typeof _fv.delete; batchDelete = async (gs) => { OUT.delCall = gs.map((g) => g.id).join(','); for (const g of gs) delete col('prd_price_batches')[g.id]; S.prBatches = S.prBatches.filter((x) => !gs.includes(x)); }; const now = new Date().toISOString(); col('prd_price_batches').gA = { name: '그룹A', crit: {}, createdAt: now, updatedAt: now }; col('prd_price_batches').gB = { name: '그룹B', crit: {}, createdAt: now, updatedAt: now };
    S.tab = 'products'; S.q = ''; S.detail = null; document.querySelector('#sheet').classList.remove('on'); renderMain(); await wait(2500);
    OUT.prB = (S.prBatches || []).map((g) => g.id).join(','); OUT.xN = document.querySelectorAll('[data-bslotdel]').length;
    let x = document.querySelector('[data-bslotdel="gA"]'); if (x) { x.click(); await wait(200); OUT.arm = x.textContent; x.click(); await wait(2500); }
    OUT.after = Object.keys(col('prd_price_batches')).join(','); OUT.chips = [...document.querySelectorAll('[data-bslot]')].map((b) => b.textContent.trim().slice(0, 20)).join(' | ');
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rdel.png' }); await br.close(); })();`);
