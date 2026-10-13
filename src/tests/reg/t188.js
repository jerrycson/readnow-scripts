const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  p.on('console', (m) => { if (/^R /.test(m.text())) console.log(m.text().slice(0, 200)); }); await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      /* 1. REST 이중 길 */
      S.shipC = { sig: 'old', at: '2026-10-11T08:00:00Z', orders: [] }; S.ship = { sig: 's1', at: 'x', orders: [] }; S._shipLive = true; S.tab = 'home';
      const REST = { confirm: { fields: { sig: { stringValue: 'new' }, at: { stringValue: '2026-10-11T09:00:00Z' }, orders: { arrayValue: { values: [{ mapValue: { fields: { orderNo: { stringValue: 'O9' }, items: { arrayValue: { values: [{ mapValue: { fields: { listingId: { stringValue: 'L1' }, price: { integerValue: '12000' }, qty: { integerValue: '1' } } } }] } } } } }] } }, n: { integerValue: '1' }, ok: { booleanValue: true }, z: { nullValue: null } } }, current: { fields: { sig: { stringValue: 's1' }, at: { stringValue: 'x' } } } };
      let rcalls = []; window.fetch = async (u) => { rcalls.push(u.replace(/.*documents\\//, '')); const k = /confirm/.test(u) ? 'confirm' : 'current'; return { ok: true, status: 200, json: async () => REST[k] }; };
      await shipRestTick(true); OUT.rest = JSON.stringify({ sig: S.shipC.sig, n: S.shipC.n, o: S.shipC.orders, ok: S.shipC.ok, z: S.shipC.z, fc: S.shipCFromCache, fix: S.shipRest.fix, calls: rcalls });
      rcalls = []; await shipRestTick(true); OUT.rest2 = JSON.stringify({ fix: S.shipRest.fix, calls: rcalls });
      /* 2. 다시 그리기 폭주 막기 */
      let n = 0; const o = window.renderMainNow; window.renderMainNow = function () { n++; if (n < 8) console.log('R', Date.now() % 100000, new Error().stack.split(String.fromCharCode(10))[2]); return o.apply(this, arguments); };
      S._userAt = 0; const t0 = Date.now(); while (Date.now() - t0 < 6000) { renderMain(); await wait(50); } OUT.renders6s = n; OUT.dbg = JSON.stringify({ ua: S._userAt, pd: S._ptrDown, bg: _rmBg.length, last: Date.now() - _rmLast });
      /* 3. 우리 카드 */
      window.renderMainNow = o; S.plist = new Map([['L1', { id: 'L1', active: true, bookId: 'b1', price: 9000, registeredAt: new Date().toISOString(), usedCode: 'U1' }], ['L2', { id: 'L2', active: true, bookId: 'b2', price: 5000 }], ['L3', { id: 'L3', active: true, bookId: 'b3' }]]);
      S.pmetrics = new Map([['b1', { usedFirstPage: [{ sellerCode: '996008', price: 9000 }, { sellerCode: '1', price: 9500 }] }], ['b2', { usedFirstPage: [{ sellerCode: '777', price: 4000 }] }]]); S.pmLoaded = true;
      OUT.self = benchSelfCard({ rows: [] }).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ');
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);
