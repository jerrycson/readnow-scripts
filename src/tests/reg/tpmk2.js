const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob';
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true;
    try {
    ${SETUP}
    localStorage.removeItem('rn-pmk-open'); S.pmk.pref = false;
    const st = window.__store; const bid = 'B77'; const old = new Date(Date.now() - 2 * 3600e3).toISOString();
    st.prd_book_metrics = { [bid]: { lastCheckedAt: old, usedTotal: 4, usedFirstPage: [{ sellerCode: 1, sellerName: '판매자A', grade: '상', price: 6000, ship: 0, listingId: 'q1' }, { sellerCode: 996008, sellerName: '북스킹', grade: '상', price: 7000, ship: 0, listingId: 'L77' }, { sellerCode: 2, sellerName: '판매자C', grade: '중', price: 3000, ship: 0, listingId: 'q3' }] } };
    S.plist.set('aladin_U77', { id: 'aladin_U77', usedCode: 'U77', bookId: bid, listingId: 'L77', isbn13: '9788937460449', active: true, grade: '상', price: 7000, title: '데미안', status: '판매중' }); S.prodLoaded = true;
    openProduct('aladin_U77'); await wait(800); const d = document.querySelector('details.pmk'); OUT.closed = d ? d.open + ' ' + d.innerText.replace(/\\s+/g, ' ').slice(0, 80) : 'NO';
    d.open = true; await wait(1500); const d2 = document.querySelector('details.pmk'); OUT.opened = d2.open + ' ' + d2.innerText.replace(/\\s+/g, ' ').slice(0, 300); OUT.blocks = d2.querySelectorAll('.pblk').length;
    const cm = Object.values(st.shp_cmds || {}).filter((x) => x.type === 'metrics'); OUT.autoReq = cm.length + ' ' + JSON.stringify(cm.map((x) => x.keys));
    await db.collection('prd_book_metrics').doc(bid).set({ lastCheckedAt: new Date().toISOString(), usedTotal: 5, usedFirstPage: [{ sellerCode: 1, sellerName: '판매자A', grade: '상', price: 5500, ship: 0, listingId: 'q1' }, { sellerCode: 996008, sellerName: '북스킹', grade: '상', price: 7000, ship: 0, listingId: 'L77' }] });
    await wait(800); const d3 = document.querySelector('details.pmk'); OUT.live = d3.innerText.replace(/\\s+/g, ' ').slice(0, 200);
    d3.open = false; await wait(400); d3.open = true; await wait(1200); OUT.reopenReq = Object.values(st.shp_cmds).filter((x) => x.type === 'metrics').length;
    history.back(); await wait(300); openProduct('aladin_U77'); await wait(1200); const d4 = document.querySelector('details.pmk'); OUT.prefOpen = d4.open;
    OUT.wide = [...document.querySelectorAll('details.pmk *')].filter((x) => x.getBoundingClientRect().right > innerWidth + 2).length;
    history.back(); await wait(300);
    // 홈 공유 요약 + 실시간 주문확인요청
    S._allLoaded = false; st.app_summary = st.app_summary || {}; st.app_summary.home = S.homeSum = { dev: 'JS-MAIN', w: { alerts: { h: '<div class="alerts"><button class="al atop" data-alert="shipconfirm">❗ 주문확인요청 5건 — 상품 확인하고 발송준비시작</button><button class="al red" data-alert="x">● 다른 경고</button><button class="al info" data-alert="ship">ⓘ 오늘 출고(발송 요청) 9건 · 상품 9권</button></div>', at: new Date(Date.now() - 600e3).toISOString() } } };
    S.shipC = { orders: [{ orderNo: 'A1' }, { orderNo: 'A2' }], at: new Date().toISOString() }; S.shipCFromCache = false; S.ship = { orders: [{ orderNo: 'D1', items: [{ title: 'x' }] }], tabCounts: { '주문확인요청': 9 }, at: new Date().toISOString() };
    window.__rm = 0; const _rm = renderMain; renderMain = function () { window.__rm++; return _rm.apply(this, arguments); }; S.tab = 'home'; S.detail = null; document.querySelector('#sheet').classList.remove('on'); document.body.style.overflow = ''; window.scrollTo(0, 0); renderMain(); await wait(500); document.getElementById('wc_alerts').scrollIntoView(); await wait(1500); try { OUT.fix = alertsLiveFix(S.homeSum.w.alerts.h).slice(0,300); } catch (e) { OUT.fix = 'THROW ' + e.message; } OUT.rm = window.__rm + ' ' + (document.getElementById('wc_alerts') || {}).getBoundingClientRect?.().top; OUT.done = String(document.getElementById('wc_alerts')._done) + ' gen ' + S._homeGen + ' io ' + ('IntersectionObserver' in window); OUT.lay = document.querySelectorAll('.wcard').length + ' ' + [...document.querySelectorAll('.wcard')].map(x=>x.id).slice(0,3).join(','); OUT.wc = JSON.stringify((S._wcache||{}).alerts||'').slice(0,120); const al = document.getElementById('wc_alerts'); OUT.hs = JSON.stringify(S.homeSum).slice(0,80) + ' all=' + S._allLoaded; OUT.home = al ? al.innerText.replace(/\\s+/g, ' ').slice(0, 300) : 'NOALERTW';
    S.tab = 'orders'; renderMain(); await wait(800); const sc = document.querySelector('#shipentry'); OUT.entry = sc ? sc.innerText.replace(/\\s+/g, ' ').slice(0, 160) : 'NOENTRY';
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 4).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  const el = await p.$('#wc_alerts'); if (el) await el.screenshot({ path: SP + '/reg/pmk_home_${MOB ? 'm' : 'pc'}.png' }); await br.close(); })();`);
