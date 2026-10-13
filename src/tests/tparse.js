const { JSDOM } = require('jsdom'); const fs = require('fs'); const P = require('./repo/readnow-products-core.js'); const U = '/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/';
const doc = (f) => new JSDOM(fs.readFileSync(U + fs.readdirSync(U).find((x) => x.startsWith(f)), 'utf8')).window.document;
console.log('product', JSON.stringify(P.parseUsedItemPrice(doc('29c27f2d'))));
console.log('search', JSON.stringify(P.parseC2BSearch(doc('90f45110'))));
const cart = P.parseC2BCart(doc('965818ac')); console.log('cart', cart.length, JSON.stringify(cart.slice(0, 2)), JSON.stringify(cart.find((x) => x.isbn13 === '9788992693790')), JSON.stringify(cart.find((x) => /수학과/.test(x.title || ''))));
