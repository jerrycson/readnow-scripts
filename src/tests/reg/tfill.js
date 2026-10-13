const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const U = '/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/'; const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
const MODE = process.argv[2] || 'new';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 1000 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  let html = fs.readFileSync(U + (MODE === 'new' ? '95bf5caa-____-_____________.html' : '59821284-____-_________________________.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/g, '');
  await p.route('**/*', (rt) => { const u = rt.request().url(); if (u.startsWith('https://www.aladin.co.kr/scm/wrecord.aspx')) return rt.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    if (/c2c_sales_ajax/.test(u)) return rt.fulfill({ body: JSON.stringify({ PriceSales: 11250, QualityTypeDesc: '상(정가대비 45%)', PriceSalesHtml: '' }), contentType: 'text/plain' });
    if (/wrecord_edit/.test(u)) return rt.fulfill({ body: fs.readFileSync(SP + 'us/scm.html', 'utf8'), contentType: 'text/html; charset=utf-8' }); return rt.fulfill({ body: '', status: 404 }); });
  await p.goto('https://www.aladin.co.kr/scm/wrecord.aspx' + (MODE === 'one' ? '?ISBN=897739600X' : '') + '#rnreg=I1');
  for (const f of ['/home/claude/w/out/readnow-products-core.js', '/home/claude/w/readnow-register-core.js', '/home/claude/w/readnow-exec-core.js']) await p.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const res = await p.evaluate(async ({ code, MODE }) => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const CALLS = []; const store = { reg_items: {}, shp_cmds: {}, exec_log: {}, prd_system: { cursor: { maxListingId: 400000000 } }, reg_probe: {} }; const col = (n) => (store[n] = store[n] || {});
    const ref = (n, id) => ({ id, get: async () => ({ exists: !!col(n)[id], data: () => col(n)[id] }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...v } : { ...v }; }, update: async (v) => { col(n)[id] = { ...(col(n)[id] || {}), ...v }; } });
    const fdb = { collection: (n) => ({ doc: (id) => ref(n, id) }), batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; }, runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
    window.firebase = { apps: [1], app: () => ({ firestore: () => fdb, auth: () => ({ currentUser: { email: 'x' }, onAuthStateChanged: (cb) => { cb({}); return () => {}; } }) }), firestore: { FieldValue: { serverTimestamp: () => 'TS', arrayUnion: (...a) => a } } };
    const GMS = {}; window.GM_getValue = (k, d) => (k in GMS ? GMS[k] : d); window.GM_setValue = (k, v) => (GMS[k] = JSON.parse(JSON.stringify(v))); window.GM_deleteValue = (k) => delete GMS[k];
    // 알라딘 화면 함수 대역 (실제는 scm.js·편집기)
    window.fn_formSet = (b) => CALLS.push('fn_formSet ' + b); window.setCategory = (i, c, p, m) => CALLS.push(`setCategory ${i} ${c} ${p} ${m}`); window.setBookInfo = (i, c, n) => { CALLS.push(`setBookInfo ${i} ${c} ${n}`); document.getElementById('authorNm0').value = n; };
    window.PercentPriceSales = () => {}; window.calcSummaryC2C = () => {}; window.stockStatusChg = () => {}; window.selItemSize_Change = (o) => { document.getElementById('size').value = o.options[o.selectedIndex].text; };
    window.EditorManager = { loadContent: (h) => CALLS.push('editor ' + h) }; window.Editor = {}; window.frmRecord_submit_C2C = (a, b, c) => CALLS.push(`SUBMIT ${a} ${b} ${c}`); window.alert = (m) => CALLS.push('alert ' + m); window.confirm = () => true;
    const ai = document.getElementById('autoIsbn'); if (ai) ai.onclick = null;
    const plan = MODE === 'new' ? { method: 'new', branch: 1, isbn: '', title: '관광서비스의 이해', code: 'BLUPRO', price: 9000, priceStd: 25000, grade: 2, comment: '모서리 눌림', saleState: 1, qty: 1, descHtml: '띠지 있습니다.<br>그 외 양호', images: { main: '관광서비스의 이해.jpg', subs: [], desc: [] },
      new: { title: '관광서비스의 이해', subtitle: '부제', titleOrigin: '', cats: [{ cid: '8258', path: '국내도서 > 대학교재/전문서적 > 경상계열', mag: false }], author: { id: '131374', name: '도미경' }, translator: null, publisher: { id: '2007', name: '백산출판사' }, adult: false, pages: 446, sizeSel: '5', sizeText: '', pubDate: '2019-03-01' } }
      : { method: 'one', branch: 1, isbn: '9788977396005', title: '관광서비스의 이해', code: 'BLKCMN_261009', price: 7000, priceStd: 25000, grade: 3, comment: '', saleState: 2, qty: 2, descHtml: '', images: {} };
    store.reg_items.I1 = { stage: 'pick', plan };
    new Function(code)(); await wait(2500);
    const box = document.getElementById('rnRegFill'); const panel = box ? box.innerText : null; const v = (id) => (document.getElementById(id) || {}).value;
    const fields = { title: v('title'), sub: v('itemSubTitle'), sup: v('supItemCode'), mc: v('makingCompany') + '/' + v('makingCompanyId'), pages: v('ItemPage'), sizeSel: v('selItemSize'), size: v('size'), pub: [v('pubY'), v('pubM'), v('pubD')].join('-'), noPub1: (document.getElementById('noPubDate1') || {}).checked, priceStd: v('priceStd'), qt: v('QualityType'), qtk: v('QualityTypeKOR'), comment: v('CommentDirty'), guar: (document.getElementById('Guaranted') || {}).checked, priceSales: v('priceSales'), stock: v('stockState'), cnt: v('stockCount'), autoIsbn: (document.getElementById('autoIsbn') || {}).checked };
    if (box) box.querySelector('#rnRfGo').click(); await wait(1500);
    return { panel, fields, CALLS, cmd: store.shp_cmds, item: store.reg_items.I1.stage, exec: Object.keys(store.exec_log || {}), pend: GMS['rn-reg-pending'] }; }, { code: fs.readFileSync(SP + 'reg/colfill.js', 'utf8'), MODE });
  console.log(JSON.stringify(res, null, 1).slice(0, 5000)); console.log('ERRS', errs.slice(0, 5)); await br.close(); })();
