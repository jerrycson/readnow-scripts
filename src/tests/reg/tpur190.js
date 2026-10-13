// 1.7.0: 취소 목록 대조 · 집중 벤치마킹 화면 · 참고 가격 · 예스24 · 묻고답하기 문구 넣기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}

    window.toast = (m) => { OUT.toasts = (OUT.toasts || []).concat([m]); };
    const NL = String.fromCharCode(10); const txt = ['왕좌의 게임 원서 5권 세트 20000', '해리포터 1~3권', '어린왕자'].join(NL);
    const E0 = { id: 'e1', sheet: '매입2603', row: 39, amt: 32000, date: '2026-03-10', plat: '당근', who: '효린', txt, qty: [] };
    col('pur_entries').e1 = { ...E0 }; S.pur.entries = [{ ...E0 }]; S.pur.loaded = true; S.pur.fresh = true; S.entStateLoaded = true; bump();
    const sp0 = splitPur(S.pur.entries[0]); OUT.split0 = sp0.items.map((it) => [it.k, it.title, it.qty, it.price, it.est]); OUT.how0 = sp0.how;
    S.plist.set('L1', { id: 'L1', title: 'Game of Thrones: A Song of Ice and Fire 1-5 Boxed Set', usedCode: 'U77', active: true, price: 39000, grade: '상', qty: 1, registeredAt: '2026-03-20T10:00' });
    S.plist.set('L2', { id: 'L2', title: '어린왕자', usedCode: 'U78', active: false, price: 9000, grade: '상', qty: 1, registeredAt: '2026-03-21T10:00' });
    S.prodLoaded = true; bump('p');
    S.orders.set('o1', { id: 'o1', kind: 'sale', orderNo: 'N1', orderedAt: '2026-04-01T10:00', shippingFee: 0, items: [{ aladinUsedCode: 'U78', lineStatus: 'normal', price: 9000, qty: 1, title: '어린왕자', fee: 1000 }] }); S.ordersLoaded = true; bump('o');
    S.pmatch = new Map([['L1', { id: 'L1', kind: 'manual', itemKey: 'e1#0', entryId: 'e1', cost: 4000, qty: 1, how: '사람이 연결 · 매입2603 2026-03-10 당근' }], ['L2', { id: 'L2', kind: 'new', itemKey: 'e1#2', entryId: 'e1', cost: 0, qty: 1, how: '제목 일치' }]]); S.pmatchLoaded = true; bump();
    await openProduct('L1'); await wait(700); const sh = document.querySelector('#sheet'); const card = () => (sh.querySelector('.pmcard') || {}).innerText || ''; OUT.card1 = card().split(String.fromCharCode(10)).join(' ').slice(0, 900);
    const all = sh.querySelector('[data-pvol="L1|5"]'); OUT.hasAll = !!all; all.click(); await wait(800); OUT.cost2 = S.pmatch.get('L1').cost; OUT.vols2 = S.pmatch.get('L1').vols; OUT.store2 = JSON.stringify(col('pur_matches').L1); OUT.card2 = card().split(String.fromCharCode(10)).join(' ').slice(0, 500);
    /* 매입 고치기 */
    openPurEdit('e1'); await wait(500); const s2 = document.querySelector('#sheet'); OUT.edRows = s2.querySelectorAll('.pe-row').length;
    const setv = async (el, v) => { el.value = v; el.dispatchEvent(new Event('input')); await wait(80); };
    await setv(s2.querySelector('[data-pi="1"][data-f="price"]'), 3000); OUT.est1 = s2.querySelector('[data-est="1"]').innerText;
    s2.querySelector('#pe_add').click(); await wait(300); const s3 = document.querySelector('#sheet'); const ts = s3.querySelectorAll('.pe-t'); await setv(ts[ts.length - 1], '나니아 연대기'); await setv(s3.querySelector('#pe_amt'), 35000);
    const del = s3.querySelector('[data-pdel="2"]'); del.click(); await wait(100); OUT.armTxt = del.textContent; del.click(); await wait(300);
    document.querySelector('#pe_save').click(); await wait(1200);
    const doc = col('pur_entries').e1; OUT.saved = JSON.stringify({ amt: doc.edit && doc.edit.amt, n: doc.edit && doc.edit.items.length, del: doc.edit && doc.edit.items.filter((x) => x.del).map((x) => x.k), keys: doc.edit && doc.edit.items.map((x) => x.k), hasEdit: doc.hasEdit, log: (doc.editLog || []).length, txtSame: doc.txt === txt, amtOrig: doc.amt });
    const e = S.pur.entries[0]; const sp1 = splitPur(e); OUT.split1 = sp1.items.map((it) => [it.k, it.title, it.qty, it.price, it.est]); OUT.how1 = sp1.how; OUT.eAmt = e.amt; OUT.orig = JSON.stringify(e._orig);
    OUT.L1cost = S.pmatch.get('L1').cost; await loadMatches(); const L = runMatching(); OUT.recost = JSON.stringify(L.filter((m) => m.id === 'L1').map((m) => [m.cost, m.costWas]));
    /* 상품 탭 줄 칩 */
    OUT.chip = prodRow(S.plist.get('L1')).match(/pmchip[^>]*>[^<]*/)[0]; OUT.chip2 = (prodRow(S.plist.get('L2')).match(/pmchip[^>]*>[^<]*/) || [''])[0];
    /* 팔린 상품 이익 */
    S.pmatch.set('L2', { id: 'L2', kind: 'manual', itemKey: 'e1#n', entryId: 'e1', cost: 2000, qty: 1 }); await openProduct('L2'); await wait(600); OUT.card3 = ((document.querySelector('#sheet .pmcard') || {}).innerText || '').split(String.fromCharCode(10)).join(' ').slice(0, 700);
    /* 세트 고르기 창 */
    const r = purItemRows().find((y) => y.e.id === 'e1' && y.idx === 0); const pr = askVols(r, S.plist.get('L1')); await wait(100); OUT.ask = document.querySelector('.avol').innerText.split(String.fromCharCode(10)).join(' ').slice(0, 300); document.querySelector('.avol [data-v="5"]').click(); OUT.askV = await pr;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rpur.png' }); await br.close(); })();`);
