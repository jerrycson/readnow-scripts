const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob';
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 400, height: 860 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true;
    try {
    ${SETUP}
    localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; OUT.adm = isAdminDevice(); OUT.extVer = window.ReadnowExt && window.ReadnowExt.VERSION;
    const st = window.__store; const isbn = '9780141439518'; const now = new Date().toISOString();
    st.app_settings = st.app_settings || {}; st.app_settings.ext_run = { lease: { pc: 'JS-MAIN', atMs: Date.now(), at: now }, fx: { date: '2026-10-09', src: 'koreaexim', usd: 1380 }, cnt: { [new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)]: { kakao: 12 } }, last: { kakao: { at: now, ok: true }, kyobo: { at: now, ok: false, why: '검색 화면에서 상품 번호를 못 찾음' } } };
    st.ext_fx = { '2026-10-09': { rates: { USD: 1380, GBP: 1800 }, date: '2026-10-09', src: 'koreaexim' } };
    st.app_secrets = { ext: { keys: { kakaoRest: 'abcd1234', ebayAppId: 'APP-xyz9' }, meta: { kakaoRest: { at: now, by: 'a@b' } } } };
    st.ext_basic = { [isbn]: { isbn, src: { kyobo: { at: now, d: { title: 'Pride and Prejudice', pages: 480, publisher: 'Penguin', url: 'javascript:alert(1)' } }, google: { at: now, d: { title: 'Pride and Prejudice', pages: 432, pubDate: '2003-01-30', desc: '<img src=x onerror=alert(1)> Classic', url: 'https://books.google.com/x' } }, ttb: { at: now, d: { used: { aladin: { n: 2, min: 5000 }, user: { n: 3, min: 4200 } }, ebook: [{ id: 1, p: 3000 }] } }, naver: { err: { at: now, why: '키가 맞지 않음' } } } } };
    st.ext_used = { [isbn]: { isbn, src: { bunjang: { at: now, d: { q: 'pride and prejudice', url: 'https://m.bunjang.co.kr/search', items: [{ t: 'Pride and Prejudice 원서', p: 6000, sim: 0.9, st: 'sell', url: 'https://m.bunjang.co.kr/products/1' }, { t: '오만과 편견', p: 3000, sim: 0.2 }, { t: 'Pride and Prejudice', p: 9000, sim: 1, st: 'sold' }] } }, joongna: { at: now, err: { at: now, why: '화면 안에서 글 목록을 못 찾음' } } } } };
    st.ext_foreign = { [isbn]: { isbn, src: { ebay: { at: now, d: { how: 'gtin', n: 5, items: [{ t: 'P&P', p: 5, cur: 'USD', ship: 10, g: '최상', cond: 'Like New', url: 'https://ebay.com/1' }, { t: 'P&P', p: 6, cur: 'USD', ship: 10, g: '상' }, { t: 'P&P', p: 4, cur: 'USD', ship: 12, g: '중' }, { t: 'P&P', p: 8, cur: 'USD', ship: null, g: '상' }, { t: 'P&P new', p: 12, cur: 'USD', ship: 10, g: 'new' }] } } } } };
    st.ext_lib = { [isbn]: { isbn, src: { lib: { at: now, d: { loanCnt: 321, cls: '영미소설', hist: [{ m: '2026-01', n: 10 }, { m: '2026-02', n: 20 }], co: [{ t: '제인 에어' }], kw: [{ w: '사랑' }] } } } } };
    st.ext_ebook = { [isbn]: { isbn, src: { ridi: { at: now, d: { t: 'Pride and Prejudice', p: 2500, sim: 1, url: 'https://ridibooks.com/books/1' } } } } };
    S.plist.set('aladin_X1', { id: 'aladin_X1', usedCode: 'X1', isbn13: isbn, active: true, grade: '상', price: 25000, title: 'Pride and Prejudice', status: '판매중' }); S.prodLoaded = true;
    document.querySelectorAll('button').forEach((b) => { if (b.textContent.trim() === '확인') b.click(); }); openProduct('aladin_X1'); await wait(1500); const card = document.querySelector('.ext-card'); OUT.card = card ? card.innerText.replace(/\\s+/g, ' ').slice(0, 2600) : 'NOCARD ' + document.querySelector('#sheet').innerText.slice(0, 300);
    window.__cardY = card.getBoundingClientRect().top; card.scrollIntoView(); OUT.xss = !!document.querySelector('#sheet img[src="x"]') || !!document.querySelector('#sheet a[href^="javascript"]');
    return JSON.stringify(OUT).slice(0,100); card.querySelector('[data-extreq]').click(); await wait(600); const cm = Object.values(st.shp_cmds || {}).find((x) => x.type === 'extLookup'); OUT.cmd = cm ? JSON.stringify(cm.books) + ' fkr=' + cm.foreignKr : 'none'; OUT.pend = document.querySelector('.ext-card').innerText.match(/대기[^\\n]*/)?.[0];
    history.back(); await wait(300); S.sec = S.sec || {}; S.sec.set_ext = true; S.tab = 'settings'; renderMain(); await wait(1200); const es = document.querySelector('#ext_set'); OUT.set = es ? es.innerText.replace(/\\s+/g, ' ').slice(0, 1800) : 'NOSET';
    const ki = document.querySelector('[data-extkey="naverId"]'); ki.value = 'NID123'; document.querySelector('#ext_keysave').click(); await wait(600); OUT.keys = JSON.stringify(st.app_secrets.ext.keys);
    document.querySelector('[data-extsrc="kyobo"][data-f="cap"]').value = '50'; document.querySelector('#ext_sim').value = '0.7'; document.querySelector('#ext_save').click(); await wait(500); OUT.cfg = JSON.stringify({ k: st.app_settings.ext.src.kyobo, sim: st.app_settings.ext.sim, order: st.app_settings.ext.basicOrder });
    document.querySelector('#ext_test').click(); await wait(500); OUT.test = Object.values(st.shp_cmds).filter((x) => x.type === 'extTest').length;
    OUT.wide = [...document.querySelectorAll('#ext_set *, .ext-card *')].filter((x) => x.getBoundingClientRect().right > innerWidth + 2).length;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 4).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  const el = await p.$('.ext-card'); await el.screenshot({ path: SP + '/reg/extcard_${MOB ? 'm' : 'pc'}.png' }); await br.close(); })();`);
