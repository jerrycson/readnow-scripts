const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true;
    try { ${SETUP}
    const X = '9791125411111';
    S.plist.set('aladin_U1', { id: 'aladin_U1', usedCode: 'U1', isbn13: X, title: 'K-IFRS 법인세 회계', price: 15000, grade: '상', active: false, status: '판매완료', registeredAt: '2026-05-01' });
    S.plist.set('aladin_U2', { id: 'aladin_U2', usedCode: 'U2', isbn13: X, title: 'K-IFRS 법인세 회계', price: 14000, grade: '상', active: true, status: '판매중', registeredAt: '2026-08-10' });
    S.plist.set('aladin_U3', { id: 'aladin_U3', usedCode: 'U3', isbn13: X, title: 'K-IFRS 법인세 회계', price: 9000, grade: '중', active: true, status: '판매중', registeredAt: '2026-03-01' });
    S.plist.set('aladin_U5', { id: 'aladin_U5', usedCode: 'U5', isbn13: '9780000000001', title: '취소됐다 살아난 책', price: 5000, active: true, status: '판매중', registeredAt: '2026-01-01' });
    S.plist.set('aladin_U6', { id: 'aladin_U6', usedCode: 'U6', isbn13: '9780000000001', title: '취소됐다 살아난 책', price: 5000, active: true, status: '판매중', registeredAt: '2026-09-01' });
    S.orders.set('o1', { id: 'o1', orderNo: '001-K1', kind: 'sale', orderedAt: '2026-08-01T10:00:00', customerId: 'c1', items: [{ title: '[중고-상] K-IFRS 법인세 회계', aladinUsedCode: 'U1', price: 15000, qty: 1, lineStatus: 'returned' }] });
    S.orders.set('o0', { id: 'o0', orderNo: '001-K0', kind: 'sale', orderedAt: '2026-06-01T10:00:00', customerId: 'c2', items: [{ title: 'K-IFRS 법인세 회계', aladinUsedCode: 'U3', price: 9000, qty: 1, lineStatus: 'normal' }] });
    S.orders.set('o2', { id: 'o2', orderNo: '001-K2', kind: 'sale', orderedAt: '2026-08-20T10:00:00', customerId: 'c3', items: [{ title: '취소됐다 살아난 책', aladinUsedCode: 'U5', price: 5000, qty: 1, lineStatus: 'cancelled' }] });
    S.prodLoaded = true; S.ordersLoaded = true; S.ret.loaded = true; S.leader = true; bump('o'); bump('p');
    OUT.find = JSON.stringify(relinkFind());
    await loadRelinks(true); await relinkSave(); OUT.store = JSON.stringify(Object.keys(window.__store.prd_relinks || {})); OUT.chain2 = relinkChain('U2').join('>'); OUT.chain1 = relinkChain('U1').join('>');
    openProduct('aladin_U2'); await wait(1200); const t = document.querySelector('#sheet').innerText; const k = t.indexOf('🔗 같은 실물'); OUT.card = k < 0 ? '없음' : t.slice(k, k + 420).replace(/\\s+/g, ' ');
    await relinkSave(); OUT.again = Object.keys(window.__store.prd_relinks || {}).length;
    // 끊기
    await db.collection('prd_relinks').doc('U2').set({ rejected: true }, { merge: true }); await loadRelinks(true); await relinkSave(); OUT.afterCut = JSON.stringify({ chain: relinkChain('U2'), doc: window.__store.prd_relinks.U2.rejected });
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
