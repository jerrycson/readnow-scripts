// tC2W — 정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 쓰기 비교 뒤 하나씩 넘김' · lab/col2/LOGIN_PLAN.md ④-4
//  수집기(머리 그대로) 🟧✍ 그림자 쓰기 알림(rnC2w) + 알라딘 다리(rnC2al)가 넘김:
//   ① 쓰기를 보낸 직후 __rnC2w(종류, 입력, 요청, 성공) → 이 PC 저장소 rn-c2wq에 요청 꼴(번호·값만)만 적음 → 다리가 POST /al/wfeed로 넘기고 받았다는 것(ack)만 지움
//   ② 번외가 '받음'(alw.on)이라고 한 때만 적음 · 번외가 없거나 끄면 적지 않음
//   ③ 🚚 출고 중(이 PC 출고·MJ-MAIN 보호)엔 적지도 넘기지도 않음(약속 0-1) · 로거 크롬은 안 함(약속 0)
//   ④ 손님 정보 0 — 글 칸은 해시·길이 · 그 밖 칸은 이름만 · 전화 꼴 가림 · 가림 규칙이 번외(lab/col2/shadow/col2-alw-core.js scrub)와 글자 하나까지 같은 결과
//   ⑤ 쓰기 자리 다섯(상품 값 바꾸기·판매상태·삭제·발송준비시작·판매 불가 통보)이 보낸 뒤에 알림 · 보낸 요청과 같은 꼴 · ⑥ 머리 서명 그대로
//  시험 자료의 손님은 '손님A'·010-1234-5678 꼴만(공개 저장소) · 사용: node tC2W.js (src/tests)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = path.join(__dirname, '../readnow-collector.src.js'); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2W — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const CW = cut('(function rnC2w()', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
const CORE = require(path.join(__dirname, '../../lab/col2/shadow/col2-alw-core.js'));
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };
const PII = ['손님A', '010-1234-5678', '시험시 시험구 1길'];
const FB = () => { window.__D = {}; const ref = (c, id) => ({ get: async () => ({ exists: false, data: () => undefined }), set: async () => {} }); const fsx = { collection: (c) => ({ doc: (id) => ref(c, id) }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: () => {} }) }; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore: () => fsx }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (seed, helper, pc, pub) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      if (u.host === 'www.aladin.co.kr' && u.pathname !== '/scm/worders.aspx') { HL.push({ aladin: u.pathname + u.search }); }
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
      window.__rnLog = () => {}; window.__rnPcName = { get: () => a.pc }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false }); if (a.pub) window.__rnPubChrome = true;
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      (new Function(a.fb))(); }, { seed, fb: `(${FB.toString()})()`, pc: pc || 'OFFICE1', pub: !!pub });
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: CW }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };
  const tick = async (p) => { await p.evaluate(() => window.__rnC2alTick && window.__rnC2alTick(true)); await p.waitForTimeout(450); };
  const note = (p, k, i, r) => p.evaluate(([k, i, r]) => window.__rnC2w(k, i, r, true, 200), [k, i, r]);
  const q = (p) => p.evaluate(() => window.__GM['rn-c2wq'] || []);
  const S = { alw: true }; const helperOf = (S) => (pth, b) => (pth === '/al/feed' ? { ok: true, al: { on: false, logger: false }, alw: { on: S.alw } } : pth === '/al/wfeed' ? { ok: true, on: true, ack: (b.w || []).map((x) => x.id) } : pth === '/busy' ? { ok: true } : null);
  const EDIT = ['edit', { lid: '5001', ch: { price: 12000 }, cur: { state: 1 } }, [{ m: 'GET', u: '/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=5001&priceSales=12000' }]];

  // ② 번외 소식 없으면 적지 않음
  { const { p, HL } = await mk({}, helperOf(S)); ok((await note(p, ...EDIT)) === false && !(await q(p)).length, '다리가 아직 번외 소식을 못 받으면 적지 않음');
    await tick(p); const ok1 = await p.evaluate(() => window.__GM['rn-c2w-ok']); ok(ok1 && ok1.on === true && ok1.hold === false, '/al/feed 답 alw.on → rn-c2w-ok 켬', ok1);
    // ① 적고 넘기고 ack만 지움
    ok((await note(p, ...EDIT)) === true && (await q(p)).length === 1, '쓰기를 보낸 직후 한 줄 적음');
    await note(p, 'start', { ono: '111-A1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=111-A1' }]);
    await tick(p); const wf = HL.filter((x) => x.p === '/al/wfeed'); ok(wf.length === 1 && wf[0].b.w.length === 2 && wf[0].b.by === 'OFFICE1' && (await q(p)).length === 0, `POST /al/wfeed로 넘김 · 받았다는 것만 지움: ${wf.length}`, wf.map((x) => x.b));
    const e0 = wf[0].b.w[0]; ok(e0.k === 'edit' && e0.rq[0].p === '/scm/ajaxCmd.aspx' && e0.rq[0].q.priceSales === '12000' && e0.in.lid === '5001', '요청 꼴(주소·값)과 입력', e0);
    ok(CORE.compare(e0.rq, CORE.build('edit', CORE.pickIn('edit', e0.in))).verdict === 'same', '번외가 같은 입력으로 만든 요청과 같음');
    ok(!HL.some((x) => x.aladin), '알림이 알라딘에 아무 요청도 더하지 않음');
    // ④ 손님 정보 0 · 가림 규칙이 번외와 같음
    const FIX = [{ m: 'POST', u: '/scm/x.aspx?ono=1&rcvName=손님A&_=1', b: 'txtAnswer=손님A님 010-1234-5678&rcvTel=010-1234-5678&addr=시험시 시험구 1길&ordersItem=2&ordersItem=1' }, { m: 'GET', u: 'https://www.aladin.co.kr/scm/ReportNotSalesLayer.aspx?ono=111-A2&hid=x&cancelReason=2&ordersItem=9' }, { m: 'POST', u: '/scm/ajaxCmd.aspx', b: 'cmd=chg.supplieritemcode&ItemId=1&supCode=' + escape('BLK가-1') }, { m: 'POST', u: '/scm/upload.aspx', b: { keys: ['file1', 'mode'] } }];
    const inPage = await p.evaluate((F) => F.map((r) => window.__rnC2wScrub(r)), FIX); const inNode = FIX.map(CORE.scrub);
    ok(JSON.stringify(inPage) === JSON.stringify(inNode), '가림 규칙 — 수집기와 번외 결과가 글자 하나까지 같음', { inPage, inNode });
    ok(!PII.some((w) => JSON.stringify(inPage).includes(w)), '손님 이름·전화·주소가 남지 않음', inPage);
    const inIn = await p.evaluate(() => window.__rnC2wScrubIn({ note: '010-1234-5678', ono: '1' })); ok(!JSON.stringify(inIn).includes('010-1234-5678') && JSON.stringify(inIn) === JSON.stringify(CORE.scrubIn({ note: '010-1234-5678', ono: '1' })), '입력의 전화 꼴도 같은 규칙으로 가림');
    // ⑦ (11/10) 화면 단추·양식 쓰기 — 양식 값이 정해진 때 그 꼴을 알림 · 번외가 같은 입력으로 만든 양식과 같음 · 손님 정보·비밀번호 0
    { const SECRET = '비밀값-시험'; await tick(p); ok((await q(p)).length === 0, '(앞 줄 넘김)');
      await p.evaluate((SEC) => { const box = document.createElement('div'); box.id = 'c2wfx'; box.innerHTML = `
        <form id="fAns" method="post" action="./wUsedShopC2CAnswer.aspx?questionid=77&amp;method=edit"><input type="hidden" name="__VIEWSTATE" value="vs1"><input type="hidden" name="hidAnswerId" value="5"><input type="hidden" name="IsAnswerEmail" value="Y"><textarea name="txtAnswer"></textarea><input type="image" name="btnAnswerAddEdit"></form>
        <form id="frmEdit" method="post" action="NoticeEdit.aspx"><textarea id="noticeMsg" name="noticeMsg"></textarea><select id="startDateY" name="startDateY"><option>2026</option><option>2027</option></select><select id="startDateM" name="startDateM"><option>1</option><option>11</option></select><select id="startDateD" name="startDateD"><option>1</option><option>10</option></select><select id="endDateY" name="endDateY"><option>2026</option></select><select id="endDateM" name="endDateM"><option>11</option><option>12</option></select><select id="endDateD" name="endDateD"><option>20</option></select><input type="checkbox" id="isPause" name="isPause" value="Y"><input type="hidden" id="pkid" name="pkid" value="0"><input type="hidden" id="edit" name="edit" value=""></form>
        <form id="fShop" method="post" action="wC2Cuser_account_make.aspx?action=2"><input type="radio" name="directDelivery" value="1" checked><input type="radio" name="directDelivery" value="2"><input id="deliveryPrice2" name="deliveryPrice2" value="2500"><input type="hidden" name="sellerName" value="손님A"><input type="hidden" name="sellerTel" value="010-1234-5678"><input type="password" id="passwordInput" name="passwordInput"><input type="hidden" id="password" name="password"></form>
        <form id="frmRecord" method="post" action="wrecord.aspx?action=2&amp;bookid=0&amp;UpdateItemId=5001"><input type="hidden" name="__VIEWSTATE" value="vs2"><input type="hidden" name="UpdateItemId" value="5001"><input name="priceSales" id="priceSales"><input name="stockCount" id="stockCount"><input name="supItemCode" id="supItemCode"><select name="stockState" id="stockState"><option value="1">판매중</option><option value="3">일시</option><option value="15">중지</option></select><input type="hidden" name="QualityType" id="QualityType"><input type="hidden" name="QualityTypeKOR" value="상"><input name="itemSubTitle" id="itemSubTitle"><input type="hidden" name="mainCover" value="https://image.aladin.co.kr/x.jpg"><input type="file" name="up1"></form>
        <form id="frmReg" method="post" action="wrecord.aspx?ISBN=9788900000001"><input type="hidden" name="__VIEWSTATE" value="vs3"><input name="priceSales"><input name="stockCount"><input name="supItemCode"><select name="stockState"><option value="1">판매중</option><option value="3">일시</option></select><input type="hidden" name="QualityType"><input name="title" value="시험 책"></form>
        <form name="orderItemForm" id="orderItemForm" method="get" action="/scm/worder_delivery.aspx"><input type="hidden" name="cmd" value=""><input type="checkbox" name="chkOrder.111-A1" value="111-A1"><input id="deliveryNo.111-A1" name="deliveryNo.111-A1"><input type="checkbox" name="chkOrder.111-A2" value="111-A2"><input id="deliveryNo.111-A2" name="deliveryNo.111-A2"><input type="checkbox" name="chkOrder.111-A3" value="111-A3"><input id="deliveryNo.111-A3" name="deliveryNo.111-A3" value="999999999999"><input type="hidden" name="rcvName.111-A1" value="손님A"><input type="hidden" name="orderstep" value="4"></form>`; document.body.appendChild(box);
        const $ = (x) => document.getElementById(x); document.querySelector('#fAns textarea').value = '손님A님 010-1234-5678 로 연락드릴게요';
        $('noticeMsg').value = '11월 휴무 안내'; $('startDateY').value = '2026'; $('startDateM').value = '11'; $('startDateD').value = '10'; $('endDateY').value = '2026'; $('endDateM').value = '11'; $('endDateD').value = '20'; $('edit').value = 'save';
        document.querySelector('#fShop input[value="2"]').checked = true; $('deliveryPrice2').value = '3000'; $('passwordInput').value = SEC; $('password').value = SEC;
        $('priceSales').value = '12000'; $('stockCount').value = '1'; $('supItemCode').value = 'BLK-1'; $('stockState').value = '1'; $('QualityType').value = '2'; $('itemSubTitle').value = '시험 부제';
        const R = document.getElementById('frmReg'); R.priceSales.value = '9000'; R.stockCount.value = '2'; R.supItemCode.value = 'BLK-2'; R.stockState.value = '1'; R.QualityType.value = '1'; }, SECRET);
      const F = (sel, keep) => p.evaluate(([sel, keep]) => window.__rnC2wForm(document.querySelector(sel), keep ? (n) => keep.includes(n) : null), [sel, keep]);
      const ansB = new URLSearchParams({ __VIEWSTATE: 'vs1', hidAnswerId: '5', IsAnswerEmail: 'Y', txtAnswer: '손님A님 010-1234-5678 로 연락드릴게요', 'btnAnswerAddEdit.x': '10', 'btnAnswerAddEdit.y': '10' }).toString(); /* 운영 qrBuildPost 꼴 그대로 */
      const ansIn = { questionid: '77', txtAnswer: '손님A님 010-1234-5678 로 연락드릴게요', edit: true };
      const shopF = await F('#fShop'); ok(shopF && !JSON.stringify(shopF).includes(SECRET), '양식 읽기 — 비밀번호 칸 값은 아예 읽지 않음(넘기기 전에도 없음)', shopF);
      const invF = await F('#orderItemForm', ['deliveryNo.111-A1', 'chkOrder.111-A1']); const invsF0 = await p.evaluate(() => { const f = document.getElementById('orderItemForm'); f.elements['chkOrder.111-A1'].checked = true; f.elements['chkOrder.111-A2'].checked = true; f.elements['deliveryNo.111-A1'].value = '123456789012'; f.elements['deliveryNo.111-A2'].value = '223456789012'; return 1; });
      const invF1 = await F('#orderItemForm', ['deliveryNo.111-A1']); const invsF = await F('#orderItemForm', ['deliveryNo.111-A1', 'chkOrder.111-A1', 'deliveryNo.111-A2', 'chkOrder.111-A2']);
      ok(invF && invF.m === 'GET' && /^\/scm\/worder_delivery\.aspx\?/.test(invF.u) && !/111-A3|rcvName/.test(invF.u), 'GET 양식은 칸이 주소에 · 고른 주문 칸만(다른 주문·손님 칸 없음)', invF);
      const W2 = [
        ['answer', ansIn, [{ m: 'POST', u: 'https://www.aladin.co.kr/scm/wUsedShopC2CAnswer.aspx?questionid=77&method=edit', b: ansB }], [{ ...ansIn, questionid: '78' }, '주소.questionid'], '문의 답(W13)'],
        ['notice', { pkid: 0, noticeMsg: '11월 휴무 안내', start: '2026-11-10', end: '2026-11-20' }, [await F('#frmEdit')], [{ pkid: 0, noticeMsg: '11월 휴무 안내', start: '2026-11-10', end: '2026-12-20' }, '값.endDateM'], '공지 저장(W14)'],
        ['ndel', { pkid: '31' }, [{ m: 'GET', u: '/scm/NoticeEdit.aspx?edit=del&pkid=31' }], [{ pkid: '32' }, '주소.pkid'], '공지 삭제(W14)'],
        ['shop', { want: { directDelivery: '2', deliveryPrice2: 3000 } }, [shopF], [{ want: { directDelivery: '2', deliveryPrice2: 3500 } }, '값.deliveryPrice2'], '가게 배송 설정(W14)'],
        ['info', { lid: '5001', ch: { grade: '상' }, base: { price: 12000, qty: 1, code: 'BLK-1', state: 1 }, itemSubTitle: '시험 부제', ups: [{ t: 'cov', f: 'mainCover' }, { t: 'desc' }] },
          [{ m: 'POST', u: '/scm/upload/imgUpPopup.aspx', b: new URLSearchParams({ Action: '1', targetO: 'mainCover', branchType: '6', SCMImg: '' }).toString() }, { m: 'POST', u: '/scm/upload/wimage_upload_scm.aspx', b: new URLSearchParams({ action: '1', imgalign: '1', uploadFile: '' }).toString() }, await F('#frmRecord')],
          [{ lid: '5001', ch: { grade: '최상' }, base: { price: 12000, qty: 1, code: 'BLK-1', state: 1 }, itemSubTitle: '시험 부제', ups: [{ t: 'cov', f: 'mainCover' }, { t: 'desc' }] }, '값.QualityType'], '상품 정보 수정(W6 · 사진 둘 + 양식)'],
        ['reg', { item: 'r1', plan: { price: 9000, qty: 2, grade: 1, code: 'BLK-2', saleState: 1 } }, [await F('#frmReg')], [{ item: 'r1', plan: { price: 9900, qty: 2, grade: 1, code: 'BLK-2', saleState: 1 } }, '값.priceSales'], '상품 등록(W7)'],
        ['bulk', { pairs: ['71', '72'], n: 2, tokenId: 'tok-1', excelKey: 'ek-1' }, [{ m: 'POST', u: 'https://www.aladin.co.kr/scm/UsedItemBulkReg.aspx', b: 'excelFileInputText=readnow_x.xls&excelFileInput=&x=31&y=11&excelAction=1&excelKey=ek-1' }, { m: 'GET', u: 'https://www.aladin.co.kr/scm/UsedItemBulkReg.aspx?chk_71=71&chk_72=72&x=52&y=14&regItemAction=1&tokenId=tok-1' }], [{ pairs: ['71', '73'], n: 2, tokenId: 'tok-1', excelKey: 'ek-1' }, '이름만 칸'], '대량 등록(W8)'],
        ['inv', { ono: '111-A1', invH: '123456789012' }, [invF1], [{ ono: '111-A1', invH: '123456789013' }, '주소.deliveryNo.111-A1'], '송장 한 건(W10)'],
        ['invs', { L: [{ ono: '111-A1', invH: '123456789012' }, { ono: '111-A2', invH: '223456789012' }] }, [invsF], [{ L: [{ ono: '111-A1', invH: '123456789012' }, { ono: '111-A2', invH: '223456789099' }] }, '주소.deliveryNo.111-A2'], '송장 여러 건(W10)'],
        ['invcsv', { L: [{ ono: '111-A1', invH: '123456789012' }] }, [{ m: 'POST', u: 'https://www.aladin.co.kr/scm/worder_deliveryNoBulk.aspx', b: { keys: ['csvFile'] } }], null, '송장 CSV(W11)'],
        ['sell', { isbn13: '9788900000001', isbn10: null, cq0: null, multi: false }, [{ m: 'CLICK', u: '/shop/usedshop/wc2b_search.aspx?isbn=' + CORE.i10Of('9788900000001') + '&c2b_add=' }], [{ isbn13: '9788900000018', isbn10: null }, '주소.isbn'], '팔기 담기(W15)']];
      for (const [k, input, reqs, bad, t] of W2) { ok((await note(p, k, input, reqs)) === true, `${t} — 적음`); const evs = await q(p); const e = evs[evs.length - 1]; const inp = CORE.pickIn(k, CORE.scrubIn(e.in));
        const r = CORE.compare(e.rq, CORE.build(k, inp, e.rq)); ok(e.k === k && r.verdict === 'same', `${t} — 번외가 같은 입력으로 만든 양식과 같음`, { rq: e.rq, c2: CORE.build(k, inp, e.rq), d: r.diffs });
        if (bad) { const r2 = CORE.compare(e.rq, CORE.build(k, CORE.pickIn(k, CORE.scrubIn(bad[0])), e.rq)); ok(r2.verdict === 'diff' && r2.diffs.some((d) => d.f === bad[1]), `${t} — 정한 값이 다르면 그 칸(${bad[1]})을 짚음`, r2.diffs); } }
      const all = JSON.stringify(await q(p)); ok(!PII.some((w) => all.includes(w)) && !all.includes(SECRET) && !all.includes('11월 휴무') && !all.includes('시험 부제'), '양식 쓰기 알림에 손님 이름·전화·주소·문의 글·비밀번호·공지 글 원문 없음(글은 해시·길이만)', PII.concat(SECRET).filter((w) => all.includes(w)));
      ok(!HL.some((x) => x.aladin), '양식 알림이 알라딘에 아무 요청도 더하지 않음');
      await tick(p); ok((await q(p)).length === 0, '양식 쓰기 알림도 /al/wfeed로 넘기고 지움'); }
    // ③ 출고 중 — 적지도 넘기지도 않음
    await note(p, ...EDIT); ok((await q(p)).length === 1, '(출고 전 한 줄)');
    await p.evaluate(() => { window.__HOLD = 1; }); const n0 = HL.filter((x) => x.p === '/al/wfeed').length; await tick(p);
    ok(HL.filter((x) => x.p === '/al/wfeed').length === n0, '🚚 출고 중엔 /al/wfeed를 보내지 않음(약속 0-1)');
    ok((await note(p, ...EDIT)) === false && (await q(p)).length === 1, '🚚 출고 중엔 새로 적지도 않음');
    { let n = 0; for (const [k, i, r] of [['inv', { ono: '111-A1', invH: '1' }, [{ m: 'GET', u: '/scm/worder_delivery.aspx?deliveryNo.111-A1=1' }]], ['invs', { L: [] }, [{ m: 'GET', u: '/scm/worder_delivery.aspx' }]], ['invcsv', { L: [] }, [{ m: 'POST', u: '/scm/worder_deliveryNoBulk.aspx', b: { keys: ['csvFile'] } }]], ['answer', { questionid: 1 }, [{ m: 'POST', u: '/scm/wUsedShopC2CAnswer.aspx?questionid=1', b: 'txtAnswer=x' }]], ['reg', { item: 'r' }, [{ m: 'POST', u: '/scm/wrecord.aspx', b: 'priceSales=1' }]]]) if ((await note(p, k, i, r)) !== false) n++;
      ok(n === 0 && (await q(p)).length === 1, '🚚 출고 중엔 송장(한 건·여러 건·CSV)·문의 답·등록도 적지 않음(약속 0-1)'); }
    const okH = await p.evaluate(() => window.__GM['rn-c2w-ok']); ok(okH.on === false && okH.hold === true, '다리가 출고 중(hold)을 적어 둠 — 틀(iframe) 안 쓰기도 이것을 봄', okH);
    await p.evaluate(() => { window.__HOLD = 0; }); await tick(p); ok((await q(p)).length === 0, '출고가 끝나면 출고 전 줄만 넘김');
    // 번외가 끔
    S.alw = false; await tick(p); ok((await note(p, ...EDIT)) === false, '번외가 쓰기 그림자를 끄면 적지 않음');
    // 번외가 사라짐(오래됨)
    S.alw = true; await tick(p); await p.evaluate(() => { window.__GM['rn-c2w-ok'].at = Date.now() - 120e3; }); ok((await note(p, ...EDIT)) === false, '번외 소식이 90초 넘게 끊기면 적지 않음');
    await p.close(); }
  // ③ 로거 크롬
  { const { p, HL } = await mk({ 'rn-c2w-ok': { on: true, hold: false, at: Date.now() } }, helperOf({ alw: true }), 'LOGGER', true);
    ok((await note(p, ...EDIT)) === false && !(await q(p)).length, '로거 크롬은 적지 않음(약속 0)');
    ok((await note(p, 'answer', { questionid: 1 }, [{ m: 'POST', u: '/scm/wUsedShopC2CAnswer.aspx?questionid=1', b: 'txtAnswer=x' }])) === false && (await note(p, 'sell', { isbn13: '9788900000001' }, [{ m: 'CLICK', u: '/shop/usedshop/wc2b_search.aspx?isbn=1' }])) === false && !(await q(p)).length, '로거 크롬은 양식 쓰기(문의 답·팔기)도 적지 않음(약속 0)'); await tick(p); ok(!HL.some((x) => x.p === '/al/wfeed' || x.p === '/al/feed'), '로거 크롬은 다리도 안 돎'); await p.close(); }

  // ⑤ 쓰기 자리 다섯 — 보낸 뒤 알림 · 보낸 것과 같은 꼴
  { const has = (re, m) => ok(re.test(src), m);
    has(/body: fd, credentials: 'include' \}\); const txt = await rr\.text\(\);[^\n]*\n\s+try \{ window\.__rnC2w && window\.__rnC2w\('state', \{ lid: String\(listingId\), before, to \}, \[\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: fd\.toString\(\) \}\]/, '판매상태 바꾸기(현금 판매) — 보낸 fd 그대로 알림');
    has(/fetch\(`https:\/\/www\.aladin\.co\.kr\/scm\/worder_process\.aspx\?cmd=StartDelivery&ono=\$\{encodeURIComponent\(ono\)\}`, \{ credentials: 'include' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('start', \{ ono \}/, '발송준비시작 — 보낸 뒤 알림');
    has(/window\.__rnC2w\('del', \{ lids: L\.map\(\(x\) => String\(x\.listingId\)\), before: code \}, \[\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: fd\.toString\(\) \}\]/, '상품 삭제 — 보낸 fd 그대로');
    has(/const r1 = await fetch\(act\.href, \{ credentials: 'include', cache: 'no-store' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('cancel', \{ ono, items: want, reason, keys: [^\n]*\[\{ m: 'GET', u: act\.pathname \+ act\.search \}\]/, '판매 불가 통보 — 보낸 주소 그대로');
    const pe = cut('async function prdEditPc(', '/* 🟧✍ 그림자 쓰기 알림(보낸 것만 · 번호·값만) */');
    for (const [k, re] of [['price', /c2wR\.push\(\{ m: 'GET', u: `\/scm\/ajaxCmd\.aspx\?cmd=chg\.pricesales&ItemId=\$\{encodeURIComponent\(lid\)\}&priceSales=\$\{Math\.round\(ch\.price\)\}` \}\); r = await J\(await fetch\(`\/scm\/ajaxCmd\.aspx\?cmd=chg\.pricesales&ItemId=\$\{encodeURIComponent\(lid\)\}&priceSales=\$\{Math\.round\(ch\.price\)\}&_=/],
      ['qty', /c2wR\.push\(\{ m: 'GET', u: `\/scm\/ajaxCmd\.aspx\?cmd=chg\.stock&ItemId=\$\{encodeURIComponent\(lid\)\}&realStock=\$\{Math\.round\(ch\.qty\)\}` \}\); r = await J\(await fetch\(`\/scm\/ajaxCmd\.aspx\?cmd=chg\.stock&ItemId=\$\{encodeURIComponent\(lid\)\}&realStock=\$\{Math\.round\(ch\.qty\)\}&_=/],
      ['code', /c2wR\.push\(\{ m: 'POST', u: '\/scm\/ajaxCmd\.aspx', b: `cmd=chg\.supplieritemcode&ItemId=\$\{encodeURIComponent\(lid\)\}&supCode=\$\{escape\(ch\.code\)\}` \}\); r = await J\(await fetch\('\/scm\/ajaxCmd\.aspx', \{ method: 'POST', credentials: 'include', headers: HP, body: `cmd=chg\.supplieritemcode&ItemId=\$\{encodeURIComponent\(lid\)\}&supCode=\$\{escape\(ch\.code\)\}` \}\)\)/],
      ['state', /c2wR\.push\(\{ m: 'POST', u: '\/scm\/wrecord_edit_usedbatch\.aspx', b: `fn=stockstatusbulkchg&stockStatusBefore=\$\{cur\.state\}&stockStatusToDo=\$\{to\}&items=\$\{lid\}` \}\); const rr = await fetch\('\/scm\/wrecord_edit_usedbatch\.aspx', \{ method: 'POST', credentials: 'include', headers: HP, body: `fn=stockstatusbulkchg&stockStatusBefore=\$\{cur\.state\}&stockStatusToDo=\$\{to\}&items=\$\{lid\}` \}\)/]]) ok(re.test(pe), `상품 값 바꾸기(${k}) — 적는 요청 = 보내는 요청(캐시 칸 _ 만 뺌)`);
    ok(/window\.__rnC2w\('edit', \{ lid, ch: c2wCh, cur: \{ state: c2wSt \} \}, c2wR, c2wOk\)/.test(pe), '상품 값 바꾸기 — 보낸 칸만(c2wCh)·차례대로 한 번에 알림');
    /* (11/10) 화면 단추·양식 쓰기 — 알림 자리가 보내기·누르기 앞뒤 맞는 곳에 있음 */
    has(/const r1 = await fetch\(P0\.action, [^\n]*\n\s+try \{ window\.__rnC2w && window\.__rnC2w\('answer', \{ questionid: id, txtAnswer: text, edit: !!cur\.ans \}, \[\{ m: 'POST', u: P0\.action, b: P0\.body \}\]/, '문의 답(W13) — 보낸 양식 그대로 알림');
    has(/NoticeEdit\.aspx\?edit=del&pkid=' \+ encodeURIComponent\(nt\.pkid\), \{ credentials: 'include', cache: 'no-store' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('ndel'/, '공지 삭제(W14) — 보낸 뒤 알림');
    has(/const c2wF = window\.__rnC2wForm \? window\.__rnC2wForm\(\$\('frmEdit'\)\) : null;[^\n]*\$\('frmEdit'\)\.submit\(\); const c2wGo = await nav; try \{ if \(c2wF\) window\.__rnC2w\('notice'/, '공지 저장(W14) — 보내기 직전 양식을 읽고 보낸 뒤 알림');
    has(/const c2wF = window\.__rnC2wForm \? window\.__rnC2wForm\(pw\.form \|\| d\.forms\[0\]\) : null;[^\n]*regForm_submit2[^\n]*\n[^\n]*\n\s+const went = await nav; try \{ if \(c2wF\) window\.__rnC2w\('shop', \{ want \}/, '가게 배송 설정(W14) — 비밀번호를 넣은 양식도 읽기 도우미로만(값 안 읽음)');
    has(/fetch\(BULK_URL \+ '\?' \+ q\.toString\(\), \{ credentials: 'include' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('bulk'/, '대량 등록(W8) — 등록 완료를 보낸 뒤 알림');
    has(/fetch\(INV_CSV_UP, \{ method: 'POST', body: fd, credentials: 'include' \}\); try \{ window\.__rnC2w && window\.__rnC2w\('invcsv'/, '송장 CSV(W11) — 올린 뒤 알림');
    has(/window\.__rnC2w\('invs', [^\n]*\n\s+const sc = document\.createElement\('script'\); sc\.textContent = `\(function\(\)\{ var SS = [^\n]*deliveryNoSComplete\(\)/, "송장 여러 건(W10) — '선택 입력완료' 누르기 바로 앞");
    has(/inp\.value = next\.invoice; try \{ const c2wF = [^\n]*window\.__rnC2w\('inv', \{ ono: next\.orderNo, invH: next\.invoice \}[^\n]*\n[^\n]*deliveryNoComplete\(/, "송장 한 건(W10) — '입력완료' 누르기 바로 앞");
    has(/window\.__rnC2w\('sell', \{ isbn13: isbn, [^\n]*\(btn\.querySelector\('a'\) \|\| btn\)\.click\(\);/, '팔기 담기(W15) — 단추 누르기 바로 앞');
    ok((src.match(/window\.__rnC2w\('reg', \{ item: itemId, plan: /g) || []).length === 2 && /const c2wF = window\.__rnC2wForm \? window\.__rnC2wForm\(d\.getElementById\('frmRecord'\)\) : null;[^\n]*\n\s+try \{ W\.frmRecord_submit_C2C\(false, '6', plan\.method === 'one'\)/.test(src), '상품 등록(W7) — 숨은 창·사람이 연 화면 둘 다 보내기 직전 양식');
    ok(/c2wUR\.push\(\{ m: 'POST', u: url, b: new URLSearchParams\(\{ \.\.\.fields, \[key\]: '' \}\)\.toString\(\) \}\); const fd = new FormData\(\);/.test(src) && /const c2wF = window\.__rnC2wForm \? window\.__rnC2wForm\(d\.getElementById\('frmRecord'\)\) : null; try \{ W\.frmRecord_submit_C2C\(false, '6', true\)[^\n]*\n\s+try \{ if \(c2wF\) window\.__rnC2w\('info', /.test(src), '상품 정보 수정(W6) — 사진 올림 요청 + 보내기 직전 수정 양식');
    ok(Object.keys(CORE.KINDS).every((k) => src.includes(`window.__rnC2w('${k}'`) || src.includes(`window.__rnC2w && window.__rnC2w('${k}'`)), '번외가 아는 쓰기 종류마다 운영 수집기에 알림 자리가 있음', Object.keys(CORE.KINDS).filter((k) => !src.includes(`__rnC2w('${k}'`)));
    /* 실제로 같은지: 수집기 꼴 그대로 만든 요청을 가려 번외 build와 견줌 */
    const lid = '5001', ch = { price: 12000.4, qty: 2, code: 'BLK가-1', state: '판매중지' }, cur = { state: 1 }; const to = 15;
    const R = [{ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=${encodeURIComponent(lid)}&priceSales=${Math.round(ch.price)}` }, { m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.stock&ItemId=${encodeURIComponent(lid)}&realStock=${Math.round(ch.qty)}` }, { m: 'POST', u: '/scm/ajaxCmd.aspx', b: `cmd=chg.supplieritemcode&ItemId=${encodeURIComponent(lid)}&supCode=${escape(ch.code)}` }, { m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: `fn=stockstatusbulkchg&stockStatusBefore=${cur.state}&stockStatusToDo=${to}&items=${lid}` }];
    const cmp = CORE.compare(R.map(CORE.scrub), CORE.build('edit', { lid, ch, cur })); ok(cmp.verdict === 'same', '네 칸 모두 바꾸는 일 — 수집기 꼴과 번외 build가 같음', cmp.diffs);
    const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: '15', stockStatusToDo: '17', items: ['1', '2'].join(',') });
    ok(CORE.compare([CORE.scrub({ m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: fd.toString() })], CORE.build('del', { lids: ['1', '2'], before: 15 })).verdict === 'same', '삭제 — 수집기 fd와 번외 build가 같음'); }

  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(CW), '알림 덩어리에 브라우저 팝업 없음');
  // 웹앱 관리도구 🟧 줄 — 쓰기 그림자 같음 비율
  { const H = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8'); const g = (m, e) => { const i = H.indexOf(m); return H.slice(i, H.indexOf(e, i) + e.length); };
    const code = g('const c2alSum = ', '} : null;') + '\n' + g('function c2alHtml(a)', '</div>`; }');
    const f = new Function('esc', 'num', code + '\nreturn { c2alSum, c2alHtml };')((x) => String(x).replace(/[&<>"]/g, ''), (n) => String(n));
    const A = { on: true, login: 'ok', active: true, seat: true, day: { n: 3, same: 1, diff: 0, wait: 0 }, w: { on: true, n: 7, same: 6, diff: 1, bad: 0, refuse: 1, pct: 85.7, hand: ['상품 값 바꾸기(판매가·수량·관리코드·판매상태)'], junk: '손님A' } };
    const sm = f.c2alSum(A); const h = f.c2alHtml(sm);
    ok(/✍ 쓰기 그림자\(보내지 않음 · 견줌만\): 오늘 7건 · 같음 <b>85\.7%<\/b> \(6\/7\)/.test(h) && /다름 <b[^>]*>1<\/b>/.test(h) && /번외라면 안 보냄 1/.test(h) && /넘길 수 있음\(허락 뒤\): 상품 값 바꾸기/.test(h), '🧭 PC 줄 🟧에 쓰기 그림자 같음 비율 · 다름 · 넘길 수 있음', h);
    ok(!JSON.stringify(sm).includes('손님A'), '웹앱이 남기는 요약(col2_ctl)엔 정해진 칸만'); ok(!/쓰기 그림자/.test(f.c2alHtml(f.c2alSum({ ...A, w: null }))), '번외가 쓰기 그림자를 안 알리면 줄 없음'); }
  { const split = path.join(__dirname, '../split.js'); const out = fs.mkdtempSync(path.join(os.tmpdir(), 'c2w-')); cp.execFileSync('node', [split, SRCF, out], { stdio: 'pipe' });
    const h = (fs.readFileSync(path.join(out, 'readnow-collector.user.js'), 'utf8').match(/const HSIG = '([0-9a-f]+)'/) || [])[1]; ok(h === '8559039d5a96110b', `머리 서명 그대로: ${h}`); fs.rmSync(out, { recursive: true, force: true }); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2W ${bad}개 실패` : '✅ tC2W 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2W 오류', e); process.exit(1); });
