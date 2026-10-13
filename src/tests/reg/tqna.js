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
    S.plist.set('aladin_U7', { id: 'aladin_U7', usedCode: 'U7', listingId: 'L777', isbn13: '9788995095331', active: false, grade: '상', price: 2100, status: '판매완료', title: '새로나온 인명사전 한국편,세계편', registeredAt: '2026-09-01' }); bump('p');
    S.orders.set('aladin_001-A989450268', { id: 'aladin_001-A989450268', orderNo: '001-A989450268', customerId: 'aladin_14077730', kind: 'sale', orderedAt: '2026-10-09', items: [{ title: '[중고-상] 새로나온 인명사전 한국편,세계편', listingId: 'L777', price: 2100, qty: 1, lineStatus: 'normal' }] }); S.ordersLoaded = true; bump('o');
    S.customers.set('aladin_14077730', { customerId: 'aladin_14077730', displayName: '김동원' });
    S.qnaAll = [{ questionId: '2160808', orderId: 'aladin_001-A989450268', customerId: 'aladin_14077730', body: '빠른배송 부탁합니다', createdAt: '2026-10-09', answerStatus: '미답변' }, { questionId: '9', orderId: 'aladin_001-X000000001', body: '언제 와요', createdAt: '2026-10-10' }];
    S.tab = 'search'; S.custView = 'qna'; S.qnaF = 'all'; S.q = ''; renderMain(); await wait(1200); OUT.list = [...document.querySelectorAll('#main .item')].slice(0, 2).map((x) => x.innerText.replace(/\s+/g, ' ')).join(' || ');
    openProduct('aladin_U7'); await wait(1200); OUT.prod = (() => { const t = document.querySelector('#sheet').innerText; const k = t.indexOf('💬 이 상품 문의'); return k < 0 ? '없음' : t.slice(k, k + 160); })();
    const b = [...document.querySelectorAll('#main [data-qord]')][0]; OUT.qordBtn = b ? b.dataset.qord : 'none';
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rprod.png' }); await br.close(); })();`);
