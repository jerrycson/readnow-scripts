// tSHP5 — 정범님 11/05 출고 화면 세 가지
//  ① 오늘 이미 나간(출고 완료) 상자와 같은 주소의 새 주문 → 새 주문 옆 '오늘 이미 나간 상자 #번호와 같은 주소 — 합포장 권함' · 누르면 그 완료 출고(팝업 → 오늘 끝 카드)
//     (11/05 밤) 같은 주소 = 받는 분 주소만(시·구·동·건물·동·호수까지 · 이름·전화 안 봄 · 호수 다르거나 없으면 아님) · 송장·출고·맡긴 일은 바꾸지 않음 · 기기 기억엔 해시만 (가짜 주소)
//  ② 출고 사진: 휴대폰은 누르면 화면 가득 · 옆으로 밀어 다음/이전 · 닫기 ✕·바깥·Esc·아래로 밀기 · PC는 두 번 누르면 같은 화면 · ← →
//  ③ 휴대폰 떠 있는 단추를 ☰ 하나로(56px) · 한 번 누르면 펼침 · 바깥을 누르면 접힘 · 펼친 단추 48px 이상 · 원래 단추를 그대로 누름
// 시험 자료 손님은 '손님A'·'손님B' · 010-0000-0000 (공개 저장소)
// 실행: cd pw && RN_PORT=8774 node tSHP5.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H0 = require('./harness.js'); let errN = 0; const _log = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('ERRORS:')) { try { const E = JSON.parse(a[1]).filter((x) => !/js-profiling/.test(x)); errN += E.length; } catch (e) {} } _log(...a); }; const H = H0;
const seedAll = async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
  try { localStorage.removeItem('rn-ship-pk'); localStorage.removeItem('rn-ship-src'); localStorage.removeItem('rn-ship-secord'); } catch (e) {}
  S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), off: false } };
  const svg = (c) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect width='300' height='400' fill='%23${c}'/%3E%3C/svg%3E`;
  const it = (t, p, lid, c) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNK_ms', grade: '상', img: svg(c) });
  const RA = { name: '손님A', phone: '010-0000-0000', address: '시험시 시험구 시험로 1, 101동 202호' };
  S.ship = { orders: [
    { orderNo: 'A1', buyer: '손님A', orderedAt: '2026-11-05 08:00', recipient: { ...RA }, items: [it('먼저 나간 책', 5000, '404937001', 'c33')] },
    { orderNo: 'A2', buyer: '손님A', orderedAt: '2026-11-05 10:00', recipient: { ...RA, phone: '01000000000', address: '시험시  시험구 시험로 1 101동 202호 (시험동)' }, items: [it('새로 온 책 하나', 6000, '404937002', '3c3')] }, /* 띄어쓰기·쉼표·괄호 참고 글만 다름 = 같은 주소 */
    { orderNo: 'A3', buyer: '손님A', orderedAt: '2026-11-05 10:10', recipient: { ...RA, phone: '02-000-0009', address: '시험시 시험구 시험로 1, 101동 203호' }, items: [it('호수가 다른 책', 7000, '404937003', '33c')] },
    { orderNo: 'A4', buyer: '손님A', orderedAt: '2026-11-05 10:20', recipient: { name: '손님A', phone: '010-0000-0000', address: '시험시 시험구 시험로 1' }, items: [it('호수가 없는 책', 8000, '404937004', 'cc3')] },
    { orderNo: 'A6', buyer: '손님B', orderedAt: '2026-11-05 10:30', recipient: { name: '손님B', phone: '02-000-0002', address: '시험시 시험구 시험로 2, 3층 301호' }, items: [it('빠진 상자와 같은 손님 책', 9000, '404937006', 'c3c')] }], tabCounts: {}, at: now() }; S._shipLive = 1;
  S.shipC = { orders: [{ orderNo: 'C1', buyer: '손님A', orderedAt: '2026-11-05 11:00', recipient: { ...RA }, items: [it('확인할 주문 책', 5500, '404937009', '3cc')] }], at: now(), enrich: {} }; S.shipCFromCache = false;
  await db.collection('shp_invoices').doc('invS5').set({ createdAt: now(), status: 'done', limit: 0, items: [{ orderNo: 'A1', invoice: '240000001234', recipient: '손님A', state: 'done' }, { orderNo: 'L1', invoice: '240000005678', recipient: '손님B', state: 'done' }], log: [], stepNow: { at: now(), lv: 'ok', m: '송장 입력 끝' } });
  await db.collection('shp_orders').doc('L1').set({ orderNo: 'L1', buyer: '손님B', recipient: { name: '손님B', phone: '02-000-0002', address: '시험시 시험구 시험로 2, 3층 301호' } }); /* 발송 요청 목록에서 빠진(송장 입력된) 오늘 출고 */
  await db.collection('crm_y24_orders').doc('Y1').set({ orderNo: 'Y1', lastSeenAt: now(), firstSeenAt: now(), orderedAt: now(), buyer: '손님A', recipient: { ...RA }, items: [{ k: '1', title: '예스24 새 책', price: 9000, qty: 1, grade: '상' }], ystage: 'new' });
  await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship)));
  try { y24oWatch(); } catch (e) {} await W(900); S._shipRowsC = null; S._shipSameC = null; };
const pe = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
(async () => {
  // ── 넓은 화면(PC)
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); await eval('(' + seedSrc + ')')(); const sh = () => document.getElementById('sheet');
      o.inv0 = JSON.stringify((await db.collection('shp_invoices').doc('invS5').get()).data().items); o.cmd0 = (await db.collection('shp_cmds').get()).docs.length;
      S.shipTab = 'deliv'; S.shipSrc = 'all'; await openShip(); await W(1500); S._shipRowsC = null; S._shipSameC = null; shipSameIdx(); await W(1200); S._shipRowsC = null; S._shipSameC = null; openShip(); await W(600);
      const L = (s, id) => shipSameOf(s, id).map((b) => b.id + '#' + (b.inv || '')).join(',');
      o.same = { A2: L('al', 'A2'), A3: L('al', 'A3'), A4: L('al', 'A4'), A1: L('al', 'A1'), A6: L('al', 'A6'), C1: L('al', 'C1'), Y1: L('y24', 'Y1') };
      o.rows = shipRows().map((r) => r.src + ':' + r.id + ':' + r.stage).join(' ');
      const chip = (ono) => { const s = sh().querySelector(`section[data-anc="o:${ono}"] .shp-same`); return s ? s.textContent : ''; };
      o.chips = { A2: chip('A2'), A3: chip('A3'), A4: chip('A4'), A6: chip('A6') };
      o.pk = (() => { try { return localStorage.getItem('rn-ship-pk') || ''; } catch (e) { return 'ERR'; } })();
      // 누르면 그 완료 출고
      const b = sh().querySelector('section[data-anc="o:A2"] .shp-same'); if (b) { b.click(); await W(300); }
      const pop = document.querySelector('.rn-ipop'); o.pop = pop ? pop.innerText : ''; o.popGo = !!(pop && pop.querySelector('[data-shsamego="done|o:A1"]'));
      if (pop) { pop.querySelector('[data-shsamego]').click(); await W(60); }
      o.after = { tab: S.shipTab, card: !!sh().querySelector('section[data-anc="o:A1"]'), flash: !!sh().querySelector('section[data-anc="o:A1"].shp-flash'), popGone: !document.querySelector('.rn-ipop') };
      // 빠진 상자(L1) 팝업
      S.shipTab = 'deliv'; openShip(); await W(400); const b6 = sh().querySelector('section[data-anc="o:A6"] .shp-same'); if (b6) { b6.click(); await W(300); } const pop6 = document.querySelector('.rn-ipop'); o.pop6 = pop6 ? pop6.innerText : ''; document.body.click(); await W(200);
      // 확인할 주문 · 전체 목록 줄
      S.shipTab = 'confirm'; openShip(); await W(500); o.confChip = (sh().querySelector('section[data-anc="o:C1"] .shp-same') || {}).textContent || '';
      S.shipTab = 'all'; openShip(); await W(400); o.allChip = [...sh().querySelectorAll('.shu-row')].filter((r) => r.querySelector('.shp-same')).map((r) => (r.querySelector('.shu-no') || {}).textContent).join(',');
      o.inv1 = JSON.stringify((await db.collection('shp_invoices').doc('invS5').get()).data().items); o.cmd1 = (await db.collection('shp_cmds').get()).docs.length;
      // ② PC: 두 번 누르면 화면 가득 · ← →
      S.shipTab = 'deliv'; openShip(); await W(500); const ims = [...sh().querySelectorAll('.shp-img img.ph')]; o.nIm = ims.length; const im = ims[1];
      im.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await W(200); const v = document.getElementById('phv'); o.pcOpen = !!v; o.n0 = v ? v.querySelector('.phv-n').textContent : '';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await W(100); o.n1 = v ? v.querySelector('.phv-n').textContent : '';
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await W(100); o.n2 = v ? v.querySelector('.phv-n').textContent : ''; o.p0dis = v ? v.querySelector('.phv-p').disabled : null;
      o.big = v ? (() => { const r = v.querySelector('.phv-img').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() : null;
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(100); o.pcEsc = !document.getElementById('phv') && S.detail && S.detail.ship && sh().classList.contains('on');
      // PC 한 번 누르기는 예전처럼(이 자리에서 크게 바꾸기) · 단추 모음 없음
      ims[0].click(); await W(400); o.pcClick = !document.getElementById('phv');
      o.fabPc = (() => { const f = document.getElementById('rnfab'); return !f || getComputedStyle(f).display === 'none'; })(); o.shvPc = !!sh().querySelector('#shp_view') && getComputedStyle(sh().querySelector('#shp_view')).display !== 'none';
      o.feat = FEAT.filter((f) => /합포장 권함|출고 사진 크게|떠 있는 단추 모음/.test(f.t)).length;
      return o; }, seedAll.toString());
    console.log(JSON.stringify(R));
    console.log('■ ① 오늘 이미 나간 상자와 같은 주소 — 합포장 권함');
    ok(R.same.A2 === 'A1#240000001234', '받는 분 주소가 같은 새 주문(띄어쓰기·쉼표·괄호 참고 글만 다름) → 오늘 끝 상자 A1(송장 …1234) ' + R.same.A2);
    ok(!R.same.A3 && !R.same.A4, '호수가 다르거나 호수가 없으면(이름·전화·건물은 같아도) 권하지 않음 — 실수 0');
    ok(!R.same.A1, '이미 끝난 주문 자신에게는 안 뜸');
    ok(R.same.A6 === 'L1#240000005678', '발송 요청 목록에서 이미 빠진(송장 입력된) 오늘 출고도 출고 목록 기록(shp_orders)으로 찾음 ' + R.same.A6);
    ok(R.same.C1 === 'A1#240000001234' && R.same.Y1 === 'A1#240000001234', '🆕 확인할 주문·🟦 예스24 새 주문도 같은 판정 ' + R.same.C1 + ' / ' + R.same.Y1);
    ok(/오늘 이미 나간 상자 #1234와 같은 주소 — 합포장 권함/.test(R.chips.A2) && !R.chips.A3 && !R.chips.A4 && /#5678/.test(R.chips.A6), "새 주문 카드 머리에 '오늘 이미 나간 상자 #1234와 같은 주소 — 합포장 권함' " + JSON.stringify(R.chips));
    ok(/상자 #1234/.test(R.pop) && /240000001234/.test(R.pop) && /A1/.test(R.pop) && /함께/.test(R.pop) && /바꾸지 않음/.test(R.pop) && R.popGo, '누르면 그 완료 출고(상자·송장·주문번호)와 같이 포장 권함 · 저절로 안 바꿈 안내 · 오늘 끝 카드로 가는 단추');
    ok(R.after.tab === 'done' && R.after.card && R.after.flash && R.after.popGone, '「오늘 끝 칸에서 이 출고 보기」 → ✅ 오늘 끝 칸의 그 카드로 가서 깜빡임 ' + JSON.stringify(R.after));
    ok(/240000005678/.test(R.pop6) && /이미 빠진/.test(R.pop6), '빠진 상자는 팝업에 송장·주문으로 보여 줌(카드가 없다는 안내)');
    ok(/#1234/.test(R.confChip) && R.allChip.split(',').includes('A2') && !R.allChip.split(',').includes('A3'), '🆕 확인할 주문 카드 · 전체 목록 줄에도 ' + R.allChip);
    ok(R.inv0 === R.inv1 && R.cmd0 === R.cmd1, '송장 입력 문서·맡긴 일은 하나도 안 바뀜(같은 송장 두 번 없음 · 알림만)');
    ok(R.pk && !/손님|010|시험시/.test(R.pk) && /"A1"/.test(R.pk), '이 기기 기억(rn-ship-pk)엔 이름·전화·주소 대신 해시만 · 오늘 것');
    console.log('■ ② PC 사진 크게');
    ok(R.nIm >= 4 && R.pcOpen && R.n0 === '2 / ' + R.nIm, 'PC: 사진을 두 번 누르면 화면 가득(그 사진부터 · 화면의 모든 출고 사진 차례) ' + R.n0);
    ok(R.n1 === '3 / ' + R.nIm && R.n2 === '1 / ' + R.nIm && R.p0dis === true, '→ 다음 · ← 이전(첫 사진에서 더 가지 않음) ' + [R.n1, R.n2]);
    ok(R.big && R.big[1] >= 700, '사진이 화면 높이 가득 ' + JSON.stringify(R.big));
    ok(R.pcEsc, 'Esc로 닫힘 — 출고 화면은 그대로'); ok(R.pcClick, 'PC 한 번 누르기는 예전처럼(이 자리에서 크게 바꾸기)');
    ok(R.fabPc && R.shvPc, 'PC(넓은 화면)는 단추 모음 없음 · 떠 있는 단추 예전 그대로'); ok(R.feat === 3, '🔍 기능 찾기 세 줄');
  });
  // ── 휴대폰 390px
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); await eval('(' + seedSrc + ')')(); const sh = () => document.getElementById('sheet');
      const pe = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
      const swipe = async (el, x0, y0, x1, y1) => { pe('pointerdown', el, x0, y0); for (let k = 1; k <= 4; k++) pe('pointermove', el, x0 + ((x1 - x0) * k) / 4, y0 + ((y1 - y0) * k) / 4); pe('pointerup', el, x1, y1); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x1, clientY: y1 })); await W(120); };
      S.shipTab = 'deliv'; S.shipSrc = 'all'; await openShip(); await W(1500); S._shipRowsC = null; S._shipSameC = null; shipSameIdx(); await W(1200); S._shipRowsC = null; S._shipSameC = null; openShip(); await W(800);
      const c = sh().querySelector('section[data-anc="o:A2"] .shp-same'); o.chip = c ? (() => { const r = c.getBoundingClientRect(); return { t: c.textContent, r: Math.round(r.right), h: Math.round(r.height) }; })() : null; o.sw = document.documentElement.scrollWidth; o.shw = sh().scrollWidth - sh().clientWidth;
      // ② 사진 누르기 → 화면 가득 · 밀기
      const ims = [...sh().querySelectorAll('.shp-img img.ph')]; o.nIm = ims.length; ims[0].scrollIntoView({ block: 'center' }); await W(200); ims[0].click(); await W(200); let v = document.getElementById('phv'); o.open = !!v; o.n0 = v ? v.querySelector('.phv-n').textContent : '';
      o.full = v ? (() => { const r = v.getBoundingClientRect(); const ir = v.querySelector('.phv-img').getBoundingClientRect(); const x = v.querySelector('.phv-x').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), iw: Math.round(ir.width), xw: Math.round(x.width), xh: Math.round(x.height) }; })() : null;
      const img = () => document.querySelector('#phv .phv-img'); const nn = () => (document.querySelector('#phv .phv-n') || {}).textContent || '';
      await swipe(img(), 300, 400, 120, 410); o.s1 = nn(); await swipe(img(), 300, 400, 120, 410); o.s2 = nn(); await swipe(img(), 100, 400, 300, 395); o.s3 = nn(); o.stillOpen = !!document.getElementById('phv');
      await swipe(img(), 100, 400, 110, 405); o.tiny = nn(); o.tinyOpen = !!document.getElementById('phv'); /* 조금만 움직임 = 그대로 */
      await swipe(img(), 200, 300, 205, 480); o.downClosed = !document.getElementById('phv');
      ims[1].click(); await W(150); document.querySelector('#phv .phv-x').click(); await W(100); o.xClosed = !document.getElementById('phv');
      ims[1].click(); await W(150); { const st = document.querySelector('#phv .phv-stage'); pe('pointerdown', st, 20, 760); pe('pointerup', st, 20, 760); st.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 760 })); } await W(100); o.outClosed = !document.getElementById('phv');
      ims[1].click(); await W(150); img().dispatchEvent(new MouseEvent('click', { bubbles: true })); await W(100); o.imgTapStays = !!document.getElementById('phv');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await W(100); o.escClosed = !document.getElementById('phv') && sh().classList.contains('on');
      // ③ 떠 있는 단추 하나로
      sh().scrollTop = 4000; await W(400);
      const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      o.orig = { top: vis(document.querySelector('.rn-top')), vz: vis(document.getElementById('vzToggle')), view: vis(sh().querySelector('#shp_view')), nav: vis(sh().querySelector(':scope > .shp-nav')) };
      const f = document.getElementById('rnfab'); o.fab = f && vis(f) ? (() => { const r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom), n: f.querySelector('small').textContent }; })() : null;
      f.click(); await W(150); const m = document.getElementById('rnfab_m'); o.opened = m && m.classList.contains('on'); const bs = [...m.querySelectorAll('.rnfab-b')]; o.items = bs.map((b) => b.textContent.trim()); o.minH = Math.min(...bs.map((b) => b.getBoundingClientRect().height)); o.inScreen = bs.every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0; });
      // 바깥 누르면 접힘(밑 화면은 안 눌림)
      const bg = document.getElementById('rnfab_bg'); const st0 = S.shipView; pe('pointerdown', bg, 40, 300); bg.dispatchEvent(new MouseEvent('click', { bubbles: true })); await W(100); o.outFold = !m.classList.contains('on') && S.shipView === st0;
      // 보기 바꾸기 → 원래 단추가 눌림 · 접힘
      f.click(); await W(120); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /서가별|주문별/.test(x.textContent)); o.viewBefore = S.shipView; if (b) b.click(); await W(500); o.viewAfter = S.shipView; o.viewFold = !m.classList.contains('on'); }
      if (S.shipView === 'shelf') { const sv = sh().querySelector('#shp_view'); if (sv) sv.click(); await W(500); }
      // ▼ 다음 주문은 펼친 채로(거듭 누름)
      sh().scrollTop = 0; await W(200); f.click(); await W(120); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /다음 주문/.test(x.textContent)); const y0 = sh().scrollTop; if (b) b.click(); await W(250); o.navMoved = sh().scrollTop > y0; o.navStay = m.classList.contains('on'); }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await W(100); o.escFold = !m.classList.contains('on') && sh().classList.contains('on');
      // 맨 위로
      sh().scrollTop = 4000; await W(300); f.click(); await W(120); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /맨 위로/.test(x.textContent)); if (b) b.click(); await W(900); o.topWent = sh().scrollTop < 50; }
      // 홈(출고 닫음): 그래프↔글만
      history.back(); await W(900); f.click(); await W(120); o.homeItems = [...m.querySelectorAll('.rnfab-b')].map((b) => b.textContent.trim()); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /그래프로 보기|글로 보기/.test(x.textContent)); const v0 = S.vz; if (b) b.click(); await W(300); o.vzFlip = S.vz !== v0; if (S.vz !== v0) { document.getElementById('vzToggle').click(); await W(200); } }
      o.sw2 = document.documentElement.scrollWidth; return o; }, seedAll.toString());
    console.log('390', JSON.stringify(R));
    console.log('■ ① 휴대폰 390px');
    ok(R.chip && /합포장 권함/.test(R.chip.t) && R.chip.r <= 390 && R.chip.h >= 30, "합포장 권함 단추가 390px 폭 안에 · 누르기 쉬운 높이 " + JSON.stringify(R.chip)); ok(R.sw <= 391 && R.shw <= 2, '390px 가로로 넘치지 않음 ' + [R.sw, R.shw]);
    console.log('■ ② 휴대폰 사진: 누르면 화면 가득 · 밀어 넘김 · 닫기 네 가지');
    ok(R.open && R.n0 === '1 / ' + R.nIm && R.full && R.full.w === 390 && R.full.h >= 790 && R.full.iw >= 370, '한 번 누르면 화면 가득(390×800) ' + JSON.stringify(R.full));
    ok(R.full && R.full.xw >= 48 && R.full.xh >= 48, '✕ 닫기 단추 48px 이상');
    ok(R.s1 === '2 / ' + R.nIm && R.s2 === '3 / ' + R.nIm && R.s3 === '2 / ' + R.nIm && R.stillOpen, '왼쪽으로 밀면 다음 · 오른쪽으로 밀면 이전 ' + [R.s1, R.s2, R.s3]);
    ok(R.tiny === '2 / ' + R.nIm && R.tinyOpen, '조금만 움직이면 그대로');
    ok(R.downClosed, '아래로 밀면 닫힘'); ok(R.xClosed, '✕로 닫힘'); ok(R.outClosed, '사진 밖(바깥)을 누르면 닫힘'); ok(R.imgTapStays, '사진 자체를 누르면 그대로'); ok(R.escClosed, 'Esc로 닫힘 · 출고 화면은 그대로');
    console.log('■ ③ 휴대폰 떠 있는 단추 ☰ 하나로');
    ok(!R.orig.top && !R.orig.vz && !R.orig.view && !R.orig.nav, '원래 떠 있던 단추(↑ 맨 위로 · 그래프/글 · ⇄ 보기 · ▲▼▤)는 숨김 ' + JSON.stringify(R.orig));
    ok(R.fab && R.fab.w >= 56 && R.fab.h >= 56 && R.fab.r <= 390 && R.fab.b <= 800, '☰ 단추 하나 56px(엄지 닿는 오른쪽 아래) ' + JSON.stringify(R.fab));
    ok(R.opened && R.minH >= 48 && R.inScreen, '한 번 누르면 바로 펼침 · 펼친 단추 모두 48px 이상 · 화면 안 ' + R.minH);
    const need = ['맨 위로', '보기', '이전 주문', '다음 주문', '시장 줄|그래프로|글로']; ok(need.every((k) => R.items.some((t) => new RegExp(k).test(t))), '묶인 단추: ' + R.items.join(' · '));
    ok(R.outFold, '바깥을 누르면 접힘(밑 화면은 안 눌림)');
    ok(R.viewAfter && R.viewAfter !== R.viewBefore && R.viewFold, '⇄ 보기 바꾸기 → 원래 단추와 같은 일 · 누르면 접힘 ' + [R.viewBefore, R.viewAfter]);
    ok(R.navMoved && R.navStay, '▼ 다음 주문 → 다음 주문으로 · 펼친 채로(거듭 누름)'); ok(R.escFold, 'Esc로 접힘 · 출고 화면은 그대로'); ok(R.topWent, '↑ 맨 위로');
    ok(R.homeItems.some((t) => /그래프로 보기|글로 보기/.test(t)) && !R.homeItems.some((t) => /다음 주문/.test(t)) && R.vzFlip, '홈 화면: 그 화면의 단추만(그래프↔글) · 누르면 바뀜 ' + R.homeItems.join(' · '));
    ok(R.sw2 <= 391, '홈 390px 가로 넘침 없음');
  }, { vp: { width: 390, height: 800 }, touch: true });
  ok(!errN, '화면 오류 없음 ' + errN); console.log(bad ? `❌ tSHP5 실패 ${bad}` : '✓ tSHP5 통과');
})();
