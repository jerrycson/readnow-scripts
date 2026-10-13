// 1.7.0: 취소 목록 대조 · 집중 벤치마킹 화면 · 참고 가격 · 예스24 · 묻고답하기 문구 넣기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    S.plist.set('aladin_U1', { id: 'aladin_U1', usedCode: 'U1', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN_260901a', registeredAt: '2026-09-01T10:00:00', status: '판매중', title: '관광서비스의 이해', priceList: 25000 });
    S.plist.set('aladin_U2', { id: 'aladin_U2', usedCode: 'U2', isbn13: '9791167030580', active: true, grade: '중', price: 3000, sku: 'GRYPNY', registeredAt: '2026-09-02T10:00:00', status: '판매중', title: '너만 모르는 진실' });
    S.plist.set('aladin_U3', { id: 'aladin_U3', usedCode: 'U3', isbn13: '9791167030580', active: true, grade: '중', price: 3100, sku: 'GRYPNY', registeredAt: '2026-09-02T10:00:00', status: '판매중', title: '너만 모르는 진실' });
    S.prodLoaded = true; bump('p');
    S.orders.set('c1', { id: 'c1', orderNo: '001-A1', kind: 'sale', orderedAt: '2026-09-10T10:00', items: [{ isbn13: '9788977396005', sku: 'BLKCMN_260901a', lineStatus: 'cancelledInOrder', price: 7000, qty: 1, rawTitle: '[중고-상] 관광서비스의 이해', lineNo: 1 }] });
    S.orders.set('c2', { id: 'c2', orderNo: '001-A2', kind: 'cancelledBeforeSale', orderedAt: '2026-09-12T10:00', items: [{ isbn13: '9791167030580', sku: 'GRYPNY', lineStatus: 'normal', price: 3000, qty: 1, rawTitle: '[중고-중] 너만 모르는 진실' }] }); /* 같은 키 상품이 둘 → 넣지 않아야 */
    S.orders.set('c3', { id: 'c3', orderNo: '001-A3', kind: 'cancelledBeforeSale', orderedAt: '2026-08-01T10:00', items: [{ aladinUsedCode: 'U1', isbn13: '9788977396005', price: 7000, qty: 1 }] }); /* 등록 전 주문 → 넣지 않아야 */
    S.ordersLoaded = true; bump('o');
    const H = cancelHits(); OUT.hits = JSON.stringify([...H.values()].map((x) => [x.l.id, x.hits.map((h) => h.kind + '/' + h.how)]));
    await cancelSync(); await wait(300); OUT.cxDoc = JSON.stringify(Object.keys((window.__store.prd_cancel_hits || {})));
    OUT.slot = (document.createRange().createContextualFragment(cancelSlotHtml(true)).textContent || '').slice(0, 200);
    openCancelHits(); await wait(500); OUT.cxList = document.querySelector('#sheet').innerText.replace(/\\s+/g, ' ').slice(0, 300); history.back(); await wait(300);
    // 참고 가격 · 예스24
    OUT.ref = refPx(S.plist.get('aladin_U1')); OUT.used = usedBtn(S.plist.get('aladin_U1'));
    // 묻고답하기 문구
    col('app_settings').qna_phrases = { greet: ['안녕'], body: ['내용'], close: ['끝'] }; await qnaSeed(); OUT.qna = JSON.stringify(window.__store.app_settings.qna_phrases.body) + ' seeded=' + JSON.stringify(window.__store.app_settings.qna_phrases.seeded);
    window.__store.app_settings.qna_phrases.body = ['내용']; await qnaSeed(); OUT.qna2 = JSON.stringify(window.__store.app_settings.qna_phrases.body);
    // 벤치마킹
    col('app_settings').bench = { targets: [{ sc: '123', name: '큰서점', on: true }] }; S._benchUn = undefined; S.bench = null;
    col('bench_days')['123_2026-10-07'] = { sc: '123', day: '2026-10-07', base: true, total: 1000, add: 0, gone: 0, totalBand: { '~3천': 400, '3~6천': 600 } };
    col('bench_days')['123_2026-10-08'] = { sc: '123', day: '2026-10-08', base: false, total: 1010, add: 30, gone: 20, addBand: { '~3천': 10, '3~6천': 20 }, goneBand: { '~3천': 12, '3~6천': 8 }, addGrade: { '상': 30 }, goneGrade: { '중': 20 }, addYear: { '2019': 30 }, goneLife: {}, addList: [['901', '새 책', 3500, '상', '2019-03']], goneList: [['801', '팔린 책', 2500, '중', null, '20261007']], totalBand: { '~3천': 410, '3~6천': 600 } };
    col('bench_days')['123_2026-10-09'] = { sc: '123', day: '2026-10-09', base: false, total: 1015, add: 25, gone: 20, addBand: { '~3천': 5, '3~6천': 20 }, goneBand: { '~3천': 15, '3~6천': 5 }, addGrade: { '상': 25 }, goneGrade: { '중': 20 }, addYear: { '2020': 25 }, goneLife: { '0~3일': 1 }, addList: [['902', '또 새 책', 4000, '상', '2020-01']], goneList: [['901', '새 책', 3500, '상', 1, '20261008']], totalBand: { '~3천': 415, '3~6천': 600 } };
    col('bench_probe')['123'] = { n: 25, withPrice: 25, withGrade: 3 }; col('bench_state')['123'] = { day: '2026-10-09', pages: 41 };
    S.tab = 'biz'; renderMain(); await wait(1500); const m = document.querySelector('#main') || document.body; OUT.bizRow = benchHtml().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400) + ' | has=' + document.body.innerText.includes('집중 벤치마킹') + ' tab=' + S.tab;
    await openBench('123'); await wait(800); OUT.bench = document.querySelector('#sheet').innerText.replace(/\\s+/g, ' ').slice(0, 900);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/r7.png' }); await br.close(); })();`);
