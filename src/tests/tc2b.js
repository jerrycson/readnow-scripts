const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const UP = '/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/'; const f = (p) => fs.readdirSync(UP).find((x) => x.startsWith(p));
const SEARCH = fs.readFileSync(UP + f('90f45110'), 'utf8').replace(/<script[^>]*src=[^>]*><\/script>/g, '');
const CART0 = fs.readFileSync(UP + f('965818ac'), 'utf8').replace(/<script[^>]*src=[^>]*><\/script>/g, '');
const j = CART0.indexOf('<tr id="tr_item_166458792"'); const k = CART0.indexOf('<tr id="tr_item_', j + 10); const ROW = CART0.slice(j, k > 0 ? k : CART0.indexOf('</tbody>', j));
let added = new Set();
const cart = () => added.has('8992693796') ? CART0 : CART0.replace(ROW, '');
const INJ = `<script>document.addEventListener('click',function(e){var b=e.target.closest('.c2b_add'); if(!b)return; fetch('/fakeadd?isbn='+b.getAttribute('isbn')).then(function(){ alert('팔기 장바구니에 담았습니다.'); var q=document.querySelector('.ItemQtySum'); if(q) q.textContent='18';});});</script>`;
const coll = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8'); const a = coll.indexOf('  const C2B_SEARCH'); const b = coll.indexOf("  auth.onAuthStateChanged((u) => { if (!u) return; C('shp_invoices')");
const CODE = coll.slice(a, b);
(async () => { const br = await chromium.launch(); const p = await br.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.includes('/fakeadd')) { added.add(new URL(u).searchParams.get('isbn')); return rt.fulfill({ body: 'ok' }); }
    if (u.includes('wc2b_search.aspx')) { const kw = new URL(u).searchParams.get('KeyWord'); let h = SEARCH; if (kw === '9780000000002') h = h.replace(/<table id="searchResult"[\s\S]*?<\/table>\s*<\/td>/, '<table id="searchResult"></table></td>'); if (kw === '9788992693791') h = h.replace(/9788992693790/g, '9788992693791').replace(/<div class="button_search_used_sales c2b_add"[^>]*>[\s\S]*?<\/div>/, '매입불가 상품입니다.'); return rt.fulfill({ body: h.replace('</body>', INJ + '</body>'), contentType: 'text/html; charset=utf-8' }); }
    if (u.includes('wc2b_sales.aspx')) return rt.fulfill({ body: cart(), contentType: 'text/html; charset=utf-8' });
    if (u.includes('readnow-products-core')) return rt.fulfill({ body: fs.readFileSync(__dirname + '/repo/readnow-products-core.js'), contentType: 'text/javascript; charset=utf-8' });
    if (u === 'https://www.aladin.co.kr/blank') return rt.fulfill({ body: '<html><body>x<script src="/readnow-products-core.js"></script></body></html>', contentType: 'text/html; charset=utf-8' });
    return rt.abort(); });
  await p.goto('https://www.aladin.co.kr/blank'); await p.waitForTimeout(500);
  const out = await p.evaluate(async (CODE) => { const W = []; const P = window.ReadnowProducts; const PACE = { wait: async () => {} }; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const log = (m) => W.push(['log', m]); const nowIso = () => new Date().toISOString(); const TS = () => 'TS'; const PC_NAME = 'PC1';
    const looksLoggedOut = () => false; const lookDoc = async (url) => { const r = await fetch(url); return { doc: new DOMParser().parseFromString(await r.text(), 'text/html'), finalUrl: r.url }; };
    const C = (n) => ({ doc: (id) => ({ set: async (v) => { W.push([n, id, JSON.stringify(v).slice(0, 220)]); } }) });
    eval(CODE + '; window.__c2b = c2bAddCmd;');
    const ref = { id: 'cmd1', set: async (v) => W.push(['cmd', v.status || 'prog', Object.entries(v.results || {}).map(([k, r]) => k + ":" + r.state + ":" + (r.msg || "")).join(" | "), v.cartN]) };
    await window.__c2b(ref, { items: [{ usedCode: 'U1', isbn13: '9788992693790' }, { usedCode: 'U2', isbn13: '9788992693790' }, { usedCode: 'U3', isbn13: '9780000000002' }, { usedCode: 'U4', isbn13: '9788992693791' }, { usedCode: 'U5', isbn13: '' }] });
    return W.filter((x) => x[0] === 'cmd' && x[1] === 'done' || x[0] === 'log'); }, CODE);
  console.log(JSON.stringify(out, null, 1)); console.log('errs', errs.slice(0, 5)); await br.close(); })();
