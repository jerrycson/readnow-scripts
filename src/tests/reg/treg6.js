// 1.7.0 등록 카드: 보유재고·판매이력 · 필수 표시 · 문구 세 모음 · 등록 설정 저장/적용 · 날짜 접미사 · 시장 블록 가격 → 결정 대기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); }; let promptV = []; window.prompt = () => promptV.shift() || '';
    try {
    ${SETUP}
    S.plist.set('aladin_U1', { id: 'aladin_U1', usedCode: 'U1', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', registeredAt: '2026-09-01T10:00:00', status: '판매중', title: '관광서비스의 이해' }); S.prodLoaded = true; bump('p');
    S.orders.set('o1', { id: 'o1', kind: 'sale', orderedAt: '2026-08-01T10:00', items: [{ isbn13: '9788977396005', lineStatus: 'normal', price: 8000, qty: 1, rawTitle: '[중고-최상] 관광서비스의 이해' }] }); S.ordersLoaded = true; bump('o');
    for (let k = 0; k < 3; k++) { const isbn = k === 2 ? '9791167030580' : '9788977396005'; col('reg_items')['it' + k] = { stage: 'sel', isbn, branch: 1, grade: k === 1 ? 3 : 2, qty: 1, saleState: 1, descMode: 'none', desc: '', info: { ...INFO[isbn], at: new Date().toISOString() }, createdAt: '2026-10-09T00:0' + k + ':00Z' }; }
    openRegister(); await wait(600); S.regT = 'sel'; regRerender(); await wait(700); const sh = document.querySelector('#sheet'); const card = (id) => sh.querySelector('[data-rgg="' + id + '"]').closest('.card');
    OUT.icons = [...card('it0').querySelectorAll('.rgttl .rgic')].map((x) => x.textContent).join(' | ');
    OUT.same = (card('it0').querySelector('.rgsame') || {}).innerText;
    OUT.priceBox = (card('it0').querySelector('.rgprice') || {}).innerText;
    OUT.req = [...card('it0').querySelectorAll('.rqL')].map((x) => x.textContent).join(',');
    OUT.links = [...card('it0').querySelectorAll('a.reflk')].map((a) => a.textContent + '=' + a.href).join(' | ');
    // 날짜: it0(상·설명 없음, 재고 있음) → 날짜 없음 · it1(중, 재고 있음) → _날짜a
    const code = (id) => (card(id).querySelector('.rgcodeA b') || {}).textContent;
    OUT.code0 = code('it0'); OUT.code1 = code('it1'); OUT.code2 = code('it2');
    // 설명: it0 직접 입력 → ③ 문구 → ① 문구 → ③ 문구 → 순서
    card('it0').querySelector('[data-rgdm="it0"][data-v="manual"]').click(); await wait(700);
    const ph = (k, n) => sh.querySelectorAll('[data-rgphi="it0"][data-k="' + k + '"]')[n];
    ph('c', 0).click(); await wait(500); ph('a', 0).click(); await wait(500); ph('c', 1).click(); await wait(500); ph('b', 0).click(); await wait(500);
    OUT.parts = JSON.stringify(window.__store.reg_items.it0.descParts); OUT.desc = window.__store.reg_items.it0.desc; OUT.code0b = code('it0');
    // 새 문구 넣기 + ★ 고정
    const add = sh.querySelector('[data-rgphadd="b"]'); add.value = '책 옆면 얼룩 있습니다.'; add.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await wait(700);
    const L = (window.__store.app_settings || {}).reg_phrases; OUT.phB = L ? L.b.map((x) => x.t).slice(-2).join(' / ') : 'none';
    const lastB = [...sh.querySelectorAll('[data-rgphpin="b"]')].pop(); lastB.click(); await wait(700); OUT.firstB = (sh.querySelector('[data-rgphl="b"] .rgpb .pt') || {}).textContent;
    // 모두 지우기
    // 설정 저장 (it0) → it2에 적용
    promptV = ['교재 상 설명']; sh.querySelector('[data-rgpssave="it0"]').click(); await wait(800); OUT.ps = JSON.stringify(((window.__store.app_settings || {}).reg_presets || {}).list || []).slice(0, 400);
    const sel = sh.querySelector('[data-rgpsone="it2"]'); OUT.psOpts = sel ? sel.options.length : 0; if (sel) { sel.value = sel.options[1].value; sel.dispatchEvent(new Event('change')); await wait(900); }
    OUT.it2 = JSON.stringify({ d: window.__store.reg_items.it2.desc, m: window.__store.reg_items.it2.descMode, g: window.__store.reg_items.it2.grade, p: window.__store.reg_items.it2.presetId });
    OUT.chips = (sh.querySelector('.rgpsl') || {}).innerText;
    sh.querySelector('[data-rgdclr="it0"]').click(); await wait(300); OUT.armTxt = (sh.querySelector('[data-rgdclr="it0"]') || {}).textContent; OUT.notYet = JSON.stringify(window.__store.reg_items.it0.descParts); sh.querySelector('[data-rgdclr="it0"]').click(); await wait(700); OUT.cleared = JSON.stringify(window.__store.reg_items.it0.descParts);
    // 시장 블록 가격 → 단추 → 결정 대기
    const blk = card('it2').querySelector('[data-rgpickc] .pblk[data-p]:not(.mark)'); blk.querySelector('.pp').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(200); const go = sh.querySelector('.pblk-go'); OUT.goTxt = go && go.textContent; go.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(800);
    OUT.it2after = JSON.stringify({ s: window.__store.reg_items.it2.stage, p: window.__store.reg_items.it2.price });
    // 코드 영역 누르기 → 열림 → 고르면 닫힘
    sh.querySelector('[data-rgcodeopen="it1"]').click(); await wait(500); OUT.codeOpen = !!sh.querySelector('[data-rgcode="it1"]'); sh.querySelector('[data-rgcode="it1"][data-v="PNKLUX"]').click(); await wait(700); OUT.codeClosed = !sh.querySelector('[data-rgcode="it1"]'); OUT.code1b = code('it1');
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.evaluate(() => { [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '확인').forEach((b) => b.click()); }); await p.waitForTimeout(300);
  await p.evaluate(async () => { const sh = document.querySelector('#sheet'); sh.querySelector('[data-rgphi="it0"][data-k="a"]').click(); await new Promise((r) => setTimeout(r, 600)); sh.querySelector('[data-rgphi="it0"][data-k="c"]').click(); await new Promise((r) => setTimeout(r, 900)); });
  const c0 = await p.$('[data-rgg="it0"]'); const cardH = await c0.evaluateHandle((e) => e.closest('.card')); await cardH.asElement().screenshot({ path: SP + '/reg/r6card.png' });
  const ps = await p.$('details.rgps'); await ps.screenshot({ path: SP + '/reg/r6ps.png' });
  await p.setViewportSize({ width: 390, height: 900 }); await p.waitForTimeout(600); const c1 = await (await p.$('[data-rgg="it0"]')).evaluateHandle((e) => e.closest('.card')); await c1.asElement().screenshot({ path: SP + '/reg/r6mob.png' }); await br.close(); })();`);
