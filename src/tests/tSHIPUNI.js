// tSHIPUNI — 정범님 11/04 '예스24가 거의 유사한 방식으로 진행되는데 출고 탭 등을 따로 사용한다는 것 자체가 엉성해 — 전문가처럼' · '출고 처리 진행바가 올드해 — 세련되게 · 직관적으로 · 세부사항까지 실시간'
//  오늘 출고 한 흐름: 세 판매처(알라딘·예스24·현금) 주문이 한 목록·단계 칸에 판매처 배지로 · 칩으로 거르기 · 🟦 예스24 탭 없음 · 옛 바로가기(S.shipTab='y24'·알림)는 새 보기로
//  ⚠ 사람이 볼 것 수 = 홈 '오늘 확인할 것' 수 · [▶ 오늘 출고 끝까지]가 shipOneShot을 부름 · 🛰 새 진행 표시(단계 줄·막대·세부 줄) · 360px 폭에서 가로 넘침 없음
// 시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const seedAll = async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; try { localStorage.setItem('rn-ship-holdx', '1'); } catch (e) {} /* (11/04) ⏸ 보류 세기는 기본 끔 — 이 시험은 보류도 세는 경우(켬) · 기본 끔은 tSHIPDAY */
  S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), off: false } };
  await db.collection('app_settings').doc('ship_auto').set({ on: false, holds: { 'A-1': { at: now(), by: 'tester@x', why: '시험 보류' } } }); S.shipAutoCfg = { on: false, holds: { 'A-1': { at: now(), by: 'tester@x', why: '시험 보류' } } };
  const it = (t, p, lid) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNK_ms', grade: '상' });
  S.shipC = { orders: [{ orderNo: 'A-1', buyer: '손님A', orderedAt: '2026-11-04 09:00', items: [it('알라딘 확인 책 하나', 5000, '404935000')] }, { orderNo: 'A-2', buyer: '손님B', orderedAt: '2026-11-04 09:10', items: [it('알라딘 확인 책 둘', 6000, '404935001')] }], at: now(), enrich: {} }; S.shipCFromCache = false;
  S.ship = { orders: [{ orderNo: 'D-1', buyer: '손님C', orderedAt: '2026-11-03 10:00', recipient: { name: '손님C' }, items: [it('알라딘 준비 책', 7000, '404935002')] }, { orderNo: 'D-2', buyer: '손님D', orderedAt: '2026-11-03 11:00', recipient: { name: '손님D' }, items: [it('알라딘 송장 책', 8000, '404935005')] }], tabCounts: {}, at: now() }; S._shipLive = 1;
  await db.collection('shp_invoices').doc('invU').set({ createdAt: now(), status: 'done', limit: 0, items: [{ orderNo: 'D-2', invoice: '240000000099', state: 'fail', err: '송장번호 칸을 못 찾음' }], log: [{ at: now(), lv: 'err', m: '송장번호 칸을 못 찾음', o: 'D-2' }], stepNow: { at: now(), lv: 'err', m: '송장번호 칸을 못 찾음' } });
  const ago = (m) => new Date(Date.now() - m * 60e3).toISOString();
  await db.collection('shp_cmds').doc('sdU').set({ type: 'startDelivery', orderNos: ['A-2', 'A-9'], status: 'running', createdAt: ago(1.5), claim: { pc: 'cloud' }, results: { 'A-9': { state: 'done' } }, log: [{ at: ago(1.5), lv: 'info', m: '맡김 받음', by: 'cloud' }, { at: ago(1), lv: 'ok', m: 'A-9 발송준비시작 넘어감', o: 'A-9', by: 'cloud' }, { at: ago(0.6), lv: 'warn', m: '알라딘 안내 글 — 잠시 뒤 다시', by: 'cloud' }], stepNow: { at: ago(0.5), lv: 'info', m: 'A-2 발송준비시작 누르는 중', by: 'cloud' } });
  const y = (id, o) => db.collection('crm_y24_orders').doc(id).set({ orderNo: id, lastSeenAt: now(), firstSeenAt: now(), orderedAt: now(), buyer: '손님E', recipient: { name: '손님E', phone: '010-0000-0000', address: '어느 시 어느 길 1' }, items: [{ k: '1', title: '예스24 책', price: 9000, qty: 1, grade: '상' }], ...o });
  await y('Y-NEW1', { ystage: 'new' }); await y('Y-INV2', { ystage: 'deliv', yInv: { no: '240000000077', courier: '롯데택배', at: now() } });
  putOrder('cash_u1', { id: 'cash_u1', platform: 'cash', kind: 'sale', cash: true, orderNo: '현금-20261104-uni1', orderedAt: '2026-11-04 08:00', customerId: 'cash_01000000000', buyer: { name: '손님A', phone1: '010-0000-0000' }, recipient: { name: '손님A', phone1: '010-0000-0000', address: '어느 시 어느 길 1' }, shippedAt: null, items: [{ title: '현금 책', qty: 1, price: 5000, lineStatus: 'normal' }] }); S._saleIdx = null; bump('o');
  await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); /* 가짜 Firestore는 쓸 때마다 모든 듣기를 부름 — 출고 목록도 같은 값으로 */
  y24oWatch(); await W(900); S._shipRowsC = null; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1500); await eval('(' + seedSrc + ')')(); const sh = () => document.getElementById('sheet');
    // ① 처음 보기 = 할 일이 있는 가장 앞 단계 · 🟦 예스24 탭 없음 · 세 판매처 한 목록
    try { localStorage.removeItem('rn-ship-first'); localStorage.removeItem('rn-ship-src'); } catch (e) {}
    await openShipHome(); await W(700); o.first = S.shipTab; o.noY24Tab = !sh().querySelector('[data-stab="y24"]') && !sh().querySelector('.y24otab'); o.stgBtns = [...sh().querySelectorAll('.shp-stg [data-stab]')].map((b) => b.dataset.stab).join(',');
    o.cnt = JSON.stringify(shipCnt().all); o.rows = shipRows().map((r) => r.src + ':' + r.id + ':' + r.stage + (r.exc ? '!' + r.exc.k : '')).join(' ');
    o.c1 = { al: sh().querySelectorAll('section.shp-o[data-anc^="o:A-"]').length, y: sh().querySelectorAll('section.y24o[data-anc="y24:Y-NEW1"]').length, yBadge: !!sh().querySelector('section.y24o .chn-y24'), alBadge: !!sh().querySelector('.shp-srcs .chn-al') };
    S.shipTab = 'all'; openShip(); await W(400); o.all = { al: sh().querySelectorAll('.shu-row .chn-al').length, y: sh().querySelectorAll('.shu-row .chn-y24').length, cash: sh().querySelectorAll('.shu-row .chn-cash').length, stg: [...sh().querySelectorAll('.shu-row .shu-stg')].map((x) => x.textContent).join('|') };
    // ② 판매처 칩으로 거르기
    sh().querySelector('[data-ssrc="y24"]').click(); await W(400); o.fy = { src: S.shipSrc, al: sh().querySelectorAll('.shu-row .chn-al').length, y: sh().querySelectorAll('.shu-row .chn-y24').length, on: !!sh().querySelector('[data-ssrc="y24"].on') };
    S.shipTab = 'confirm'; openShip(); await W(400); o.fy2 = { al: sh().querySelectorAll('section.shp-o[data-anc^="o:A-"]').length, y: sh().querySelectorAll('section.y24o').length };
    sh().querySelector('[data-ssrc="cash"]').click(); await W(300); S.shipTab = 'deliv'; openShip(); await W(400); o.fc = { cash: sh().querySelectorAll('section.shp-o.cash').length, al: sh().querySelectorAll('section.shp-o:not(.cash):not(.y24o)').length, y: sh().querySelectorAll('section.y24o').length };
    sh().querySelector('[data-ssrc="all"]').click(); await W(300); S.shipTab = 'printed'; openShip(); await W(400); o.pr = { d2: !!sh().querySelector('[data-anc="o:D-2"]'), d1: !!sh().querySelector('[data-anc="o:D-1"]'), y2: !!sh().querySelector('[data-anc="y24:Y-INV2"]') };
    // ③ 옛 바로가기
    S.shipTab = 'y24'; openShip(); await W(400); o.old1 = S.shipSrc + '/' + S.shipTab + '/' + !!sh().querySelector('[data-ssrc="y24"].on');
    S.shipSrc = 'all'; S.shipTab = 'deliv'; openAlert('y24ord'); await W(400); o.old2 = S.shipSrc + '/' + S.shipTab;
    S.shipSrc = 'all'; S.shipTab = 'deliv'; window.dispatchEvent(new Event('rn-y24ord')); await W(400); o.old3 = S.shipSrc + '/' + S.shipTab;
    S.shipSrc = 'all'; S.shipTab = 'confirm'; openShip(); await W(300); o.old4 = S.shipTab + '/' + !!sh().querySelector('[data-stab="confirm"].on'); /* ① 주문확인 바로가기는 그대로 🆕 칸 */
    // ④ ⚠ 칸 수 = 홈 '오늘 확인할 것' 수
    S.shipSrc = 'all'; S.shipTab = 'exc'; openShip(); await W(400); o.xChip = +((sh().querySelector('[data-stab="exc"] b') || {}).textContent || -1); o.xRows = sh().querySelectorAll('.shu-xrow').length; o.xN = shipExcN(); o.xWhy = shipExcRows().map((x) => x.why.slice(0, 30)).join(' / ');
    let A = []; try { A = bizAlerts(bizCalc()); } catch (e) { o.alErr = e.message; } const al = A.find((a) => a.key === 'shipexc'); o.home = al ? +((al.t.match(/사람이 볼 것 (\d+)건/) || [])[1] || -1) : -1; o.homeTxt = al ? al.t : '';
    const hb = sh().querySelector('[data-shxhide^="exc:al:A-1"]'); o.hideBtn = !!hb; if (hb) hb.click(); await W(400); o.afterHide = shipExcN(); { const H = shlHide(); H.delete('exc:al:A-1|hold'); shlHideSave(); }
    // ⑤ 큰 단추 → shipOneShot
    window.__one = 0; window.shipOneShot = () => { window.__one++; }; S.shipTab = 'confirm'; openShip(); await W(300); const ob = sh().querySelector('#shp_oneshot'); o.oneTop = !!ob && !!ob.closest('.shp-head2') && ob.getBoundingClientRect().top < sh().querySelector('#shl_box').getBoundingClientRect().top; o.oneSum = (sh().querySelector('.shp-ones') || {}).innerText || ''; ob.click(); await W(100); o.oneAfter1 = window.__one; sh().querySelector('#shp_oneshot').click(); await W(100); o.one = window.__one; delete window.shipOneShot;
    // ⑥ 새 진행 표시
    const row = sh().querySelector('[data-shl="cmd:sdU"]'); o.live = row ? { stp: row.querySelectorAll('.shl-stp li').length, run: row.querySelectorAll('.shl-stp li.run').length, bar: (row.querySelector('.shl-bar i') || { style: {} }).style.width, big: (row.querySelector('.shl-now.big') || {}).textContent || '', meta: (row.querySelector('.shl-meta') || {}).innerText || '', prog: row.querySelectorAll('progress').length } : null;
    if (row) { row.open = true; await W(100); o.lines = [...row.querySelectorAll('.shl-ln')].map((x) => x.className.replace('shl-ln', '').trim()).join(','); o.newTop = /누르는 중|안내 글/.test((row.querySelector('.shl-ln') || {}).textContent || ''); }
    await db.collection('shp_cmds').doc('sdU').set({ results: { 'A-9': { state: 'done' }, 'A-2': { state: 'done' } }, log: [...(await db.collection('shp_cmds').doc('sdU').get()).data().log, { at: new Date().toISOString(), lv: 'ok', m: 'A-2 발송준비시작 넘어감', o: 'A-2', by: 'cloud' }], stepNow: { at: new Date().toISOString(), lv: 'ok', m: 'A-2 발송준비시작 넘어감', by: 'cloud' } }, { merge: true }); await W(900); shipLivePaint(); await W(100);
    const row2 = sh().querySelector('[data-shl="cmd:sdU"]'); o.live2 = row2 ? { bar: (row2.querySelector('.shl-bar i') || { style: {} }).style.width, open: row2.open, top: (row2.querySelector('.shl-ln') || {}).textContent || '' } : null;
    o.flow = { stp: sh().querySelectorAll('.shp-flow .shl-stp li').length, txt: (sh().querySelector('.shp-flowt') || {}).innerText || '' };
    o.guide = JSON.stringify((typeof pgdDefs === 'function' ? pgdDefs().ship : null) || ''); o.guide = { ssrc: o.guide.includes('data-ssrc'), one: o.guide.includes('shp_oneshot'), exc: o.guide.includes('data-stab=\\"exc\\"') || o.guide.includes("data-stab=\\\"exc\\\""), noTab: !o.guide.includes('🟦 예스24 탭\'') };
    o.feat = (typeof featIndex === 'function' ? featIndex() : FEAT).filter((f) => /오늘 출고 끝까지|사람이 볼 것|단계 칸/.test(f.t)).length;
    return o; }, seedAll.toString());
  console.log(JSON.stringify(R).slice(0, 2500));
  ok(R.first === 'confirm' && R.noY24Tab && R.stgBtns === 'confirm,deliv,printed,sending,done,exc,all', '처음 보기 = 할 일이 있는 가장 앞 단계(🆕) · 🟦 예스24 탭 없음 · 단계 칸 5 + ⚠ + 전체: ' + R.first + ' ' + R.stgBtns);
  ok(/al:A-1:confirm!hold/.test(R.rows) && /al:D-1:deliv/.test(R.rows) && /al:D-2:printed!inv/.test(R.rows) && /y24:Y-NEW1:confirm/.test(R.rows) && /y24:Y-INV2:printed/.test(R.rows) && /cash:cash_u1:deliv/.test(R.rows), '판매처 어댑터 → 공통 단계: ' + R.rows);
  ok(R.c1.al === 2 && R.c1.y === 1 && R.c1.yBadge && R.c1.alBadge, '🆕 칸에 알라딘 2 + 예스24 1 카드(파란 배지): ' + JSON.stringify(R.c1));
  ok(R.all.al >= 4 && R.all.y === 2 && R.all.cash === 1 && /확인할 주문/.test(R.all.stg) && /송장 인쇄됨/.test(R.all.stg), '전체 보기: 세 판매처가 한 목록에 배지·단계로: ' + JSON.stringify(R.all));
  ok(R.fy.src === 'y24' && R.fy.on && R.fy.al === 0 && R.fy.y === 2 && R.fy2.al === 0 && R.fy2.y === 1, '판매처 칩 예스24 → 예스24만: ' + JSON.stringify([R.fy, R.fy2]));
  ok(R.fc.cash === 1 && R.fc.al === 0 && R.fc.y === 0, '판매처 칩 현금 → 📦 출고 준비에 현금만: ' + JSON.stringify(R.fc));
  ok(R.pr.d2 && !R.pr.d1 && R.pr.y2, '🖨 송장 인쇄됨 칸: 송장이 있는 알라딘·예스24 주문만: ' + JSON.stringify(R.pr));
  ok(R.old1 === 'y24/confirm/true' && R.old2 === 'y24/confirm' && R.old3 === 'y24/confirm' && R.old4 === 'confirm/true', "옛 바로가기 S.shipTab='y24'·알림·휴대폰 알림 → 판매처 예스24 + 할 일이 있는 가장 앞 단계: " + [R.old1, R.old2, R.old3, R.old4].join(' · '));
  ok(R.xN === 2 && R.xChip === 2 && R.xRows === 2 && R.home === 2, `⚠ 사람이 볼 것 수 = 칸 줄 수 = 홈 '오늘 확인할 것' 수 (${R.xN}·${R.xChip}·${R.xRows}·${R.home}) — ${R.xWhy} · ${R.homeTxt} ${R.alErr || ''}`);
  ok(R.hideBtn && R.afterHide === 1, '⚠ 줄 ✕ 숨기기 → 수에서 빠짐: ' + R.afterHide);
  ok(R.one === 1 && R.oneAfter1 === 0 && R.oneTop && /오늘 할 일/.test(R.oneSum) && /알라딘|예스24|현금/.test(R.oneSum), '[▶ 오늘 출고 끝까지] 맨 위 · 판매처별 오늘 할 일 · 누르면 shipOneShot: ' + R.oneSum.replace(/\s+/g, ' '));
  ok(R.live && R.live.stp === 4 && R.live.run === 1 && R.live.bar === '50%' && /지금: A-2 발송준비시작 누르는 중/.test(R.live.big) && /1 \/ 2/.test(R.live.meta) && /남은 1건/.test(R.live.meta) && /걸린 시간/.test(R.live.meta) && /예상 남은/.test(R.live.meta) && R.live.prog === 0, '🛰 새 진행: 단계 줄 4 · 지금 단계 · 얇은 막대 50% · 1/2 · 남은 수 · 걸린 시간 · 예상 남은 · 옛 <progress> 없음: ' + JSON.stringify(R.live));
  ok(/warn/.test(R.lines || '') && /ok/.test(R.lines || '') && R.newTop, '세부 줄: 색 점(성공·주의) · 새 줄이 위: ' + R.lines);
  ok(R.live2 && R.live2.bar === '100%' && R.live2.open && /A-2 발송준비시작 넘어감/.test(R.live2.top), '실시간: 막대·세부 줄이 바뀜 · 펼친 채로: ' + JSON.stringify(R.live2));
  ok(R.flow.stp === 4 && /지금:|다음 할 일:/.test(R.flow.txt), '오늘 흐름 단계 줄(확인 → 송장 인쇄 → 송장 보내기 → 끝): ' + R.flow.txt);
  ok(R.guide.ssrc && R.guide.one && R.guide.exc && R.feat >= 3, '화면 설명서·기능 찾기에 단계 칸·판매처 칩·한 단추·⚠: ' + JSON.stringify(R.guide) + ' feat ' + R.feat);
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await W(1500); await eval('(' + seedSrc + ')')(); const out = {}; const sh = document.getElementById('sheet');
    for (const t of ['confirm', 'deliv', 'printed', 'all', 'exc']) { S.shipSrc = 'all'; S.shipTab = t; await openShip(); await W(500); const over = [...sh.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.shp-stg,.shp-srcs,.shl-log,.shp-mkl,.shp-blk,[style*="overflow"]'); }).slice(0, 4).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right)); out[t] = { doc: document.documentElement.scrollWidth - innerWidth, sheet: sh.scrollWidth - sh.clientWidth, over }; }
    const r = sh.querySelector('[data-shl="cmd:sdU"]'); out.liveW = r ? Math.round(r.getBoundingClientRect().right) : null; out.vw = innerWidth; out.btn = Math.round((sh.querySelector('#shp_oneshot') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width); return out; }, seedAll.toString());
  console.log(JSON.stringify(R));
  const bad360 = ['confirm', 'deliv', 'printed', 'all', 'exc'].filter((t) => !R[t] || R[t].doc > 0 || R[t].sheet > 0);
  ok(!bad360.length, '360px: 화면·출고 칸 가로 넘침 없음 ' + JSON.stringify(bad360.map((t) => [t, R[t]])));
  ok(R.liveW != null && R.liveW <= R.vw && R.btn > 200, '360px: 🛰 진행 카드가 폭 안 · 큰 단추는 한 줄 가득: ' + R.liveW + ' / ' + R.vw + ' 단추 ' + R.btn);
  console.log(bad ? `❌ tSHIPUNI 실패 ${bad}` : '✓ tSHIPUNI 통과');
}, { vp: { width: 360, height: 760 }, touch: true })); // 휴대폰 360px — 가로 넘침 없음
