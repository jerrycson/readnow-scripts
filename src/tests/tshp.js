const { JSDOM } = require('jsdom'); const fs = require('fs'); const vm = require('vm');
const html = fs.readFileSync('/home/claude/w/app.html', 'utf8');
const pick = (a, b) => html.slice(html.indexOf(a), html.indexOf(b, html.indexOf(a)));
const code = pick('function loadShip()', 'function openHoldPool()') + pick('function sellerNameOf(sc)', 'function openPriceQueue()').replace(/if \(!window\.__rnBlkBound\)[\s\S]*?\n\}\n/, '') + pick('function pqStep()', 'function prVerdict');
const SH = require('./rsc.js'); const page = new JSDOM(fs.readFileSync('/mnt/user-data/uploads/알라딘_-_샵매니저__판매관리_-_발송_요청_.html', 'utf8')).window.document; const r = SH.parseDeliveryPage(page);
const dom = new JSDOM('<div id="sheet"></div>'); const W = dom.window;
const plist = new Map(); const pm = new Map();
r.orders.forEach((o) => o.items.forEach((it, k) => { plist.set('aladin_' + it.listingId, { listingId: it.listingId, bookId: 'b' + it.listingId, usedCode: 'U' + it.listingId }); pm.set('b' + it.listingId, { lastCheckedAt: '2026-10-05', usedFirstPage: [{ sellerCode: '0', sellerName: '알라딘 직접 배송', grade: '중', price: 2000, ship: 0, listingId: '9' }, { sellerCode: '996008', usedCode: 'U' + it.listingId, grade: it.grade, price: it.price, ship: 2800, listingId: it.listingId }] }); }));
const ctx = { window: { ReadnowShipping: SH, ReadnowPricing: { isAladinSide: (x) => String(x.sellerCode) === '0' } }, document: W.document, history: { pushState() {} }, $: (q) => W.document.querySelector(q), esc: (x) => String(x ?? '').replace(/</g, '&lt;'), won: (n) => (n == null ? '-' : n.toLocaleString() + '원'), toast() {}, imgUrl: () => null, prErrText: (c) => c, localStorage: { getItem: () => null, setItem() {} }, RNC: null, RS: null,
  PR_COL: { aladin: '#3f7fd1', ours: '#0d1b4c', unknown: '#ffd6d6' },
  S: { shipView: 'shelf', ship: { at: new Date().toISOString(), tabCounts: r.tabCounts, orders: r.orders }, app: { ship: { holidays: [] } }, plist, pbooks: new Map(), pmetrics: pm, pmLoaded: true, sellersLoaded: true, sellers: new Map(), prodLoaded: true, detail: null, user: { email: 'x' }, uinfo: new Map() },
  loadMetrics: async () => {}, syncSellers: async () => {}, loadProducts: null, db: { collection: () => ({ where: () => ({ get: async () => ({ forEach() {} }) }), doc: () => ({ set: async () => {} }) }) }, firebase: { firestore: { FieldPath: { documentId: () => 'id' } } }, renderMain() {} };
vm.createContext(ctx); vm.runInContext(code + '; this.openShip = openShip;', ctx); ctx.openShip();
const sh = W.document.querySelector('#sheet');
[...sh.querySelectorAll('.shp-o')].slice(0, 3).forEach((o) => console.log(o.className, '|', o.querySelector('.shp-oh').textContent.replace(/\s+/g, ' '), '| 블록', o.querySelectorAll('.pblk').length, '| 북스킹', o.querySelectorAll('.pblk.ours').length, '| 상태', [...o.querySelectorAll('.shp-grade')].map((x) => x.textContent).join(',')));
console.log('서가 머리:', [...sh.querySelectorAll('.shp-shelf .shp-oh')].map((h) => h.textContent).join(' | '));
console.log('첫 4개:', [...sh.querySelectorAll('.shp-shelf .shp-it')].slice(0, 4).map((x) => x.querySelector('.shp-who').textContent.replace(/\s+/g,' ') + ' / ' + x.querySelector('.shp-t').textContent).join('\n  '));
console.log('단추:', sh.querySelector('#shp_view').textContent);
