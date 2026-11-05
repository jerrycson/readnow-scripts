// tFXP — 정범님 11/05 밤 ① 휴대폰 ☰ 펼침: 예전 단추 아이콘이 반투명 동그라미로 ☰ 위로 쭉 · 하나씩 튀어 오름 · 접힐 때 빨려 들어감 · ☰가 돌며 ✕
//                    ② 누르는 맛(타격감): 누르는 동안 꾹(.fx-dn) · 누른 뒤 활성 연출(.fx-lit · 입자·도장 층 #rnfxl) — 원래 동작·두 번 누르기 그대로
//  단추: 오늘 매출(#sd_today) · ▶ 오늘 출고 끝까지(#shp_oneshot) · 모두 발송준비시작(#sds_all) · ✓ 발송준비시작([data-sds]) · 출고 단계 탭(.shp-stg [data-stab]) · 판매처 칩(.shp-src[data-ssrc]) · 📥 등록(#reg_open · [data-rgt] · .regbtn …)
// 시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소) · 실행: cd pw && RN_PORT=8782 node tFXP.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js'); let errN = 0; const _log = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('ERRORS:')) { try { const E = JSON.parse(a[1]).filter((x) => !/js-profiling/.test(x)); errN += E.length; } catch (e) {} } _log(...a); };
const seedShip = async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
  try { localStorage.removeItem('rn-ship-src'); } catch (e) {}
  const it = (t, p, lid) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNK_ms', grade: '상' }); const RA = { name: '손님A', phone: '010-0000-0000', address: '시험시 시험로 1' };
  S.ship = { orders: [{ orderNo: 'A1', buyer: '손님A', orderedAt: '2026-11-05 08:00', recipient: { ...RA }, items: [it('시험 책 하나', 5000, '404937001')] }, { orderNo: 'A2', buyer: '손님A', orderedAt: '2026-11-05 09:00', recipient: { ...RA }, items: [it('시험 책 둘', 6000, '404937002')] }], tabCounts: {}, at: now() }; S._shipLive = 1;
  S.shipC = { orders: [{ orderNo: 'C1', buyer: '손님A', orderedAt: '2026-11-05 11:00', recipient: { ...RA }, items: [it('확인할 책 하나', 5500, '404937009')] }, { orderNo: 'C2', buyer: '손님A', orderedAt: '2026-11-05 11:10', recipient: { ...RA }, items: [it('확인할 책 둘', 6500, '404937010')] }], at: now(), enrich: {} }; S.shipCFromCache = false;
  await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(300); S._shipRowsC = null; };
/* 한 단추를 사람처럼 누름: pointerdown → (그 순간 모양) → pointerup → click → (뒤 모양) */
const pressSrc = `async (el, o) => { o = o || {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const pt = o.touch ? 'touch' : 'mouse';
  const pe = (t) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 3, pointerType: pt, isPrimary: true, button: 0, clientX: x, clientY: y }));
  pe('pointerdown'); const dn = el.classList.contains('fx-dn'); const sc = getComputedStyle(el).scale; await W(30); pe('pointerup'); const sp = el.classList.contains('fx-sp'); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); await W(o.wait || 120);
  const L = document.getElementById('rnfxl'); const ch = L ? [...L.children] : []; return { dn, sc, sp, n: ch.length, cls: ch.map((c) => c.className).join(' '), txt: ch.map((c) => c.textContent).join(''), maxT: Math.max(0, ...ch.map((c) => parseFloat(getComputedStyle(c).animationDuration) * 1000 || 0)) }; }`;
const clearL = `() => { const L = document.getElementById('rnfxl'); if (L) L.innerHTML = ''; }`;
(async () => {
  // ── 넓은 화면(PC 1400): 출고 단추·탭·칩 · 등록 · 오늘 매출
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); await eval('(' + src.seed + ')')(); const press = eval('(' + src.press + ')'); const clr = eval('(' + src.clr + ')'); const sh = () => document.getElementById('sheet');
      let asked = ''; window.ask = async (m) => { asked = String(m || ''); return false; }; window.__os = 0; window.shipOneShot = () => { window.__os++; return null; };
      S.shipTab = 'deliv'; S.shipSrc = 'all'; await openShip(); await W(1200);
      // 출고 단계 탭 — 같은 형식(납작 눌림 → 새로 켜진 탭 폴짝 + 별)
      o.tabs = []; for (const k of ['confirm', 'printed', 'exc', 'all', 'deliv']) { clr(); const b = sh().querySelector(`.shp-stg [data-stab="${k}"]`); if (!b) { o.tabs.push({ k, miss: 1 }); continue; } const r = await press(b, { wait: 260 }); const nb = sh().querySelector(`.shp-stg [data-stab="${k}"]`); o.tabs.push({ k, dn: r.dn, sc: r.sc, tab: S.shipTab, lit: !!(nb && nb.classList.contains('fx-lit') && nb.classList.contains('on')), star: /✦|✧|★/.test(r.txt + ((document.getElementById('rnfxl') || {}).textContent || '')) }); await W(200); }
      // 판매처 칩 — 같은 형식(누른 자리 물결 → 새로 켜진 칩 뒤집힘 + ✓)
      o.chips = []; for (const k of ['al', 'cash', 'all']) { clr(); const b = sh().querySelector(`.shp-src[data-ssrc="${k}"]`); if (!b) { o.chips.push({ k, miss: 1 }); continue; } const r = await press(b, { wait: 240 }); const nb = sh().querySelector(`.shp-src[data-ssrc="${k}"]`); o.chips.push({ k, dn: r.dn, src: S.shipSrc, rip: /fxclip/.test(r.cls), lit: !!(nb && nb.classList.contains('fx-lit')), say: /✓/.test(((document.getElementById('rnfxl') || {}).textContent || '')) }); await W(150); }
      // ▶ 오늘 출고 끝까지 — 첫 누름 부릉(떨림·연기·'부릉!') · 두 번째 누름 🚚 출발 · 원래 두 번 누르기 그대로
      S.shipTab = 'deliv'; openShip(); await W(500); clr(); { const b = sh().querySelector('#shp_oneshot'); o.osHas = !!b; if (b) { const r1 = await press(b); o.os1 = { dn: r1.dn, arm: !!(S._osArm && sh().querySelector('#shp_oneshot.arm')), rev: b.classList.contains('fx-rev'), smoke: /💨/.test(r1.txt), say: /부릉/.test(r1.txt), called: window.__os }; await W(500); clr(); const b2 = sh().querySelector('#shp_oneshot'); const r2 = await press(b2); o.os2 = { truck: /fxtruck/.test(r2.cls) && /🚚/.test(r2.txt), say: /출발/.test(r2.txt), called: window.__os, armOff: !S._osArm }; } }
      // 확인할 주문: ✓ 발송준비시작(두 번 누르기) · 모두 발송준비시작(ask)
      S.shipTab = 'confirm'; openShip(); await W(600); clr(); { const b = sh().querySelector('[data-sds="C1"]'); o.sdsHas = !!b; if (b) { const r1 = await press(b); o.sds1 = { dn: r1.dn, sp: r1.sp, arm: !!(S._sdsArm && S._sdsArm.ono === 'C1'), wig: b.classList.contains('fx-wig'), ring: /fxring/.test(r1.cls), stamp: /fxstamp/.test(r1.cls) }; await W(500); clr(); const n0 = Object.keys((window.__FS || {}).shp_cmds || {}).length; const b2 = sh().querySelector('[data-sds="C1"]'); const r2 = await press(b2, { wait: 300 }); await W(300); o.sds2 = { stamp: /fxstamp/.test(r2.cls) && /준비/.test(r2.txt), ink: (r2.cls.match(/fxdot/g) || []).length + ((document.getElementById('rnfxl') || { innerHTML: '' }).innerHTML.match(/fxdot/g) || []).length, armOff: !S._sdsArm || S._sdsArm.ono !== 'C1', cmd: Object.keys((window.__FS || {}).shp_cmds || {}).length - n0 }; } }
      S.shipTab = 'confirm'; openShip(); await W(500); clr(); { const b = sh().querySelector('#sds_all'); o.allHas = !!b; if (b) { const r = await press(b, { wait: 100 }); o.all = { asked: /모두 발송준비시작/.test(asked), stamps: (r.cls.match(/fxstamp/g) || []).length, thump: b.classList.contains('fx-thump') }; await W(400); await W(800); o.all.conf = ((document.getElementById('rnfxl') || { innerHTML: '' }).innerHTML.match(/fxbit/g) || []).length; } }
      await W(1500); o.cleaned = (document.getElementById('rnfxl') || { childElementCount: 0 }).childElementCount;
      history.back(); await W(700);
      // 📥 등록 — 누르는 맛만(0.3초 안 · 입자·도장 없음)
      { S.tab = 'products'; renderMain(); await W(800); document.getElementById('reg_open') && document.getElementById('reg_open').scrollIntoView({ block: 'center' }); await W(150); const ro = document.getElementById('reg_open'); o.roHas = !!ro; if (ro) { clr(); const r = await press(ro, { wait: 600 }); o.ro = { dn: r.dn, sp: r.sp, open: !!(S.detail && S.detail.reg), noPart: !/fxp|fxstamp|fxsay|fxtruck/.test(r.cls), maxT: r.maxT }; } else { S.regT = 'sel'; openRegister(); await W(600); } }
      { clr(); const b = sh().querySelector('[data-rgt="q"]'); o.rgtHas = !!b; if (b) { const r = await press(b, { wait: 450 }); const nb = sh().querySelector('[data-rgt="q"]'); o.rgt = { dn: r.dn, regT: S.regT, lit: !!(nb && nb.classList.contains('fx-lit')), litT: nb ? parseFloat(getComputedStyle(nb).animationDuration) * 1000 : 0, noPart: !/fxp|fxstamp|fxsay/.test(r.cls) }; } }
      { await W(300); clr(); const b = sh().querySelector('#rg_add') || sh().querySelector('#rg_look'); o.rgoHas = !!b; if (b) { const r = await press(b); o.rgo = { id: b.id, dn: r.dn, ring: /fxring/.test(r.cls), maxT: r.maxT, noPart: !/fxp|fxstamp|fxsay/.test(r.cls) }; } }
      { clr(); const b = sh().querySelector('.regbtn:not([disabled])'); o.rgsHas = !!b; if (b) { const r = await press(b); o.rgs = { dn: r.dn, maxT: r.maxT, noPart: !/fxp|fxstamp|fxsay/.test(r.cls) }; } }
      o.spT = (() => { const e = document.createElement('button'); e.dataset.fxk = 'rgo'; e.className = 'fx-sp'; document.body.appendChild(e); const t = parseFloat(getComputedStyle(e).animationDuration) * 1000; e.remove(); return t; })();
      history.back(); await W(600);
      return o; }, { seed: seedShip.toString(), press: pressSrc, clr: clearL });
    console.log(JSON.stringify(R));
    console.log('■ 출고 단계 탭(같은 형식)');
    ok(R.tabs.every((t) => !t.miss && t.dn && t.tab === t.k), '탭마다 누르는 순간 꾹(.fx-dn) · 원래대로 그 탭으로 ' + R.tabs.map((t) => t.k + ':' + t.tab).join(' '));
    ok(R.tabs.every((t) => t.lit && t.star), '새로 켜진 탭이 폴짝(.fx-lit) + 별 반짝 — 다섯 탭 모두 같은 연출');
    ok(R.tabs.every((t) => /1\.05 0\.84|1\.05/.test(t.sc || '')), '탭 누름은 납작(scale 1.05 0.84) ' + R.tabs.map((t) => t.sc).join(','));
    console.log('■ 판매처 칩(탭과 다른 같은 형식)');
    ok(R.chips.every((c) => !c.miss && c.dn && c.src === c.k && c.rip), '칩마다 꾹 + 누른 자리 물결 · 원래대로 거름 ' + R.chips.map((c) => c.k + ':' + c.src).join(' '));
    ok(R.chips.every((c) => c.lit && c.say), '새로 켜진 칩이 뒤집힘(.fx-lit) + ✓ 방울');
    console.log('■ ▶ 오늘 출고 끝까지');
    ok(R.osHas && R.os1 && R.os1.dn && R.os1.arm && R.os1.rev && R.os1.smoke && R.os1.say && R.os1.called === 0, '첫 누름: 원래대로 「한 번 더」(시작 안 함) · 부릉 떨림 + 💨 + 부릉! ' + JSON.stringify(R.os1));
    ok(R.os2 && R.os2.truck && R.os2.say && R.os2.called === 1 && R.os2.armOff, '두 번째 누름: 원래대로 시작(한 번) · 🚚 달려 나감 + 출발! ' + JSON.stringify(R.os2));
    console.log('■ ✓ 발송준비시작 · 모두 발송준비시작');
    ok(R.sdsHas && R.sds1 && R.sds1.dn && R.sds1.sp && R.sds1.arm && R.sds1.wig && R.sds1.ring && !R.sds1.stamp, '첫 누름: 원래대로 「한 번 더」 · 갸웃 + 빨간 고리(도장은 아직) ' + JSON.stringify(R.sds1));
    ok(R.sds2 && R.sds2.stamp && R.sds2.ink >= 4 && R.sds2.armOff, '두 번째 누름: 빨간 「준비 ✓」 도장 쾅 + 잉크 튐 · 원래 처리로 넘어감 ' + JSON.stringify(R.sds2));
    ok(R.allHas && R.all && R.all.asked && R.all.stamps >= 3 && R.all.thump && R.all.conf >= 10, '모두 발송준비시작: 원래 확인 창(ask) 그대로 · 도장 여러 개 차례로 + 색종이 ' + JSON.stringify(R.all));
    ok(R.cleaned === 0, '연출 조각은 끝나면 저절로 지워짐(층 비움) ' + R.cleaned);
    console.log('■ 📥 등록(누르는 맛만 · 짧게)');
    ok(R.roHas && (R.ro.dn && R.ro.sp && R.ro.open && R.ro.noPart && R.ro.maxT <= 320), '📥 등록 단추: 꾹 + 튀어 오름 · 원래대로 등록 화면 · 입자·도장 없음 · 0.32초 안 ' + JSON.stringify(R.ro || 'reg_open 없음'));
    ok(R.rgtHas && R.rgt.dn && R.rgt.regT === 'q' && R.rgt.lit && R.rgt.litT <= 300 && R.rgt.noPart, '등록 단계 탭: 꾹 + 켜진 탭 밑줄 한 번(0.3초 안) · 원래대로 탭 바뀜 ' + JSON.stringify(R.rgt));
    ok(R.rgoHas && R.rgo.dn && R.rgo.ring && R.rgo.maxT <= 300 && R.rgo.noPart, '넣기·조회: 꾹 + 옅은 고리(0.3초 안) ' + JSON.stringify(R.rgo));
    ok(!R.rgsHas || (R.rgs.dn && R.rgs.maxT <= 300 && R.rgs.noPart), '고르기 단추(.regbtn): 꾹 + 옅은 고리 ' + JSON.stringify(R.rgs || '없음'));
    ok(R.spT > 0 && R.spT <= 250, '등록 놓을 때 튀어 오름 0.25초 안 ' + R.spT);
    // 오늘 매출(출고별 매출 머리)
    const R2 = await p.evaluate(async (press0) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const press = eval('(' + press0 + ')'); const o = {}; const td = dstr(new Date());
      S._sdL = true; S.shpDays = new Map(); S.orders = S.orders || new Map(); S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.ordersLoaded = true; S.shipDayN = 40;
      S.shpDays.set(td, { day: td, source: 'tab', readAt: new Date().toISOString(), entries: [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 시험 책', price: 30000, qty: 1 }] }] }); S.shpDaysV = (S.shpDaysV || 0) + 1; S._sdm = null; S.ver = (S.ver || 0) + 1; window.rkfxHeadSoon = () => {}; S.app = { ...(S.app || {}), rankFx: { k: {}, on: false } };
      S.sec.o_shipday = true; if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_today'); i++) await W(150); await W(400);
      const t = document.getElementById('sd_today'); o.has = !!t; if (t) { t.scrollIntoView({ block: 'center' }); await W(200); const r = await press(t, { wait: 200 }); o.r = { dn: r.dn, coins: (r.txt.match(/🪙|₩|💰/g) || []).length, shine: /fxshine/.test(r.cls), say: /오늘/.test(r.txt) }; for (let i = 0; i < 20 && !(S.detail && S.detail.ship); i++) await W(150); o.went = !!(S.detail && S.detail.ship) && S.shipTab === 'sales'; }
      return o; }, pressSrc);
    console.log('■ 오늘 매출', JSON.stringify(R2));
    ok(R2.has && R2.r.dn && R2.r.coins >= 8 && R2.r.shine && R2.r.say, '오늘 매출: 꾹 + 동전·₩이 튀어 오르고 금빛이 쓸고 지나감 + 「💰 오늘!」 ' + JSON.stringify(R2.r));
    ok(R2.went, '원래대로 오늘 출고 › 💰 출고별 매출로 감');
  });
  // ── 휴대폰 390 · 터치: ☰ 펼침·접힘 · 칩 터치
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); await eval('(' + src.seed + ')')(); const press = eval('(' + src.press + ')'); const sh = () => document.getElementById('sheet');
      S.shipTab = 'deliv'; S.shipSrc = 'all'; await openShip(); await W(1200); sh().scrollTop = 4000; await W(400);
      const f = document.getElementById('rnfab'); const m = document.getElementById('rnfab_m'); const bg = document.getElementById('rnfab_bg'); const fr = f.getBoundingClientRect();
      o.icon0 = { h: getComputedStyle(f.querySelector('.rnfab-h')).opacity, x: getComputedStyle(f.querySelector('.rnfab-x')).opacity };
      f.click(); await W(20); o.pop = f.classList.contains('pop'); const bs = [...m.querySelectorAll('.rnfab-b')]; o.n = bs.length;
      o.anim = bs.map((b) => { const i = b.querySelector('.rnfab-in'); const c = getComputedStyle(i); return { a: c.animationName, d: parseFloat(c.animationDelay) * 1000, v: b.style.getPropertyValue('--d') }; });
      o.early = (() => { const i = bs[bs.length - 1].querySelector('.rnfab-in').getBoundingClientRect(); return Math.round(i.top); })();
      await W(900); o.icon1 = { h: getComputedStyle(f.querySelector('.rnfab-h')).opacity, x: getComputedStyle(f.querySelector('.rnfab-x')).opacity, xr: getComputedStyle(f.querySelector('.rnfab-x')).rotate };
      o.items = bs.map((b) => { const c = b.querySelector('.rnfab-bi'); const r = c.getBoundingClientRect(); const t = b.querySelector('.rnfab-t'); const cs = getComputedStyle(c); return { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left + r.width / 2), top: Math.round(r.top), bot: Math.round(r.bottom), bg: cs.backgroundColor, rad: cs.borderRadius, fs: t ? parseFloat(getComputedStyle(t).fontSize) : 0, tw: t ? Math.round(t.getBoundingClientRect().width) : 0, txt: b.textContent.trim() }; });
      o.fabCx = Math.round(fr.left + fr.width / 2); o.fabTop = Math.round(fr.top);
      o.cover = Math.round(bs.reduce((s, b) => { const r = b.querySelector('.rnfab-in').getBoundingClientRect(); return s + r.width * r.height; }, 0) / (innerWidth * innerHeight) * 1000) / 10;
      o.bg = { col: getComputedStyle(bg).backgroundColor, img: getComputedStyle(bg).backgroundImage.slice(0, 20) };
      o.center = (() => { const e = document.elementFromPoint(120, 300); return e ? e.id || e.className : ''; })();
      // 바깥 누르면 접힘 — 접히는 연출(closing) 동안 보이고 그 뒤 감춤 · 접히는 동안 누름 안 받음
      bg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' })); await W(30); o.close = { on: m.classList.contains('on'), closing: m.classList.contains('closing'), disp: getComputedStyle(m).display, pe: getComputedStyle(m).pointerEvents, a: getComputedStyle(m.querySelector('.rnfab-in')).animationName, fabOpen: f.classList.contains('open') };
      await W(700); o.close.after = getComputedStyle(m).display; o.close.cls = m.className;
      // 다시 펼쳐 단추를 누르면 그 단추가 커졌다 빨려 들어감(hit) · 원래 단추 동작
      f.click(); await W(500); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /보기/.test(x.textContent)); const v0 = S.shipView; b.click(); await W(40); o.hit = { hit: b.classList.contains('hit'), a: getComputedStyle(b.querySelector('.rnfab-in')).animationName, view: S.shipView !== v0 }; await W(600); if (S.shipView === 'shelf') { const sv = sh().querySelector('#shp_view'); if (sv) sv.click(); await W(500); } }
      // 다음 주문(펼친 채) — 통통 튐(hop)
      sh().scrollTop = 0; await W(200); f.click(); await W(500); { const b = [...m.querySelectorAll('.rnfab-b')].find((x) => /다음 주문/.test(x.textContent)); if (b) { b.click(); await W(30); const nb = [...m.querySelectorAll('.rnfab-b')].find((x) => /다음 주문/.test(x.textContent)); o.hop = !!b.classList.contains('hop') || !!(nb && nb.classList.contains('hop')); o.stay = m.classList.contains('on'); } }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await W(60); o.esc = !m.classList.contains('on') && m.classList.contains('closing'); await W(700);
      // 터치로 칩 누르기
      sh().scrollTop = 0; await W(200); { const b = sh().querySelector('.shp-src[data-ssrc="al"]'); const r = await press(b, { touch: true, wait: 240 }); const nb = sh().querySelector('.shp-src[data-ssrc="al"]'); o.touch = { dn: r.dn, rip: /fxclip/.test(r.cls), src: S.shipSrc, lit: !!(nb && nb.classList.contains('fx-lit')) }; }
      o.sw = document.documentElement.scrollWidth; return o; }, { seed: seedShip.toString(), press: pressSrc });
    console.log('390', JSON.stringify(R));
    console.log('■ ☰ 펼침');
    ok(R.icon0.h === '1' && R.icon0.x === '0' && R.icon1.h === '0' && R.icon1.x === '1', '☰가 돌며 ✕로(겹친 두 글자 · 회전) ' + JSON.stringify([R.icon0, R.icon1]));
    ok(R.pop, '누르는 순간 ☰ 단추가 말랑하게 눌렸다 튐(pop)');
    ok(R.n >= 3 && R.anim.every((a, i) => a.a === 'fabIn' && Math.round(a.d) === i * 42 && a.v === 60 + i * 58 + 'px'), '아이콘이 하나씩 차례로(42ms 간격) ☰ 자리에서 스프링으로 튀어 오름 ' + JSON.stringify(R.anim));
    ok(R.early >= R.items[R.items.length - 1].top + 20, '막 펼친 순간엔 아직 아래(☰ 쪽)에서 올라오는 중 ' + R.early + ' > ' + R.items[R.items.length - 1].top);
    ok(R.items.every((x) => x.w >= 48 && x.h >= 48 && x.rad === '50%'), '모두 48px 원형 아이콘');
    ok(R.items.every((x) => /rgba\(.*0\.\d+\)/.test(x.bg)), '아이콘 배경 반투명 ' + R.items.map((x) => x.bg).join(' | '));
    ok(R.items.every((x) => Math.abs(x.cx - R.fabCx) <= 2) && R.items.every((x) => x.bot <= R.fabTop) && R.items.every((x, i) => !i || x.bot <= R.items[i - 1].top), '☰ 바로 위로 세로로 쭉 쌓임(가운데 줄 맞춤 · 겹침 없음) ' + R.items.map((x) => x.cx + '/' + x.top).join(' '));
    ok(R.items.every((x) => x.fs <= 12 && x.tw <= 150), '글자 꼬리표는 작게(12px 이하) ' + R.items.map((x) => x.fs + '/' + x.tw).join(' '));
    ok(R.cover < 12, '펼친 단추가 화면을 조금만 가림 ' + R.cover + '%');
    ok(/rgba\(0, 0, 0, 0\)|transparent/.test(R.bg.col) && /radial-gradient/.test(R.bg.img), '바탕은 오른쪽 아래만 아주 옅게(꽉 찬 어둠 없음) ' + JSON.stringify(R.bg));
    console.log('■ ☰ 접힘');
    ok(!R.close.on && R.close.closing && R.close.disp === 'flex' && R.close.pe === 'none' && R.close.a === 'fabOut' && !R.close.fabOpen, '바깥 누르면 접힘 — 먼 단추부터 ☰ 안으로 빨려 들어감(그동안 누름 안 받음) ' + JSON.stringify(R.close));
    ok(R.close.after === 'none' && !/closing/.test(R.close.cls), '연출 끝나면 감춤');
    ok(R.hit.hit && R.hit.a === 'fabHit' && R.hit.view, '단추를 누르면 그 단추가 커졌다 빨려 들어감 · 원래 단추 동작 ' + JSON.stringify(R.hit));
    ok(R.hop && R.stay, '▼ 다음 주문은 펼친 채 통통 튐');
    ok(R.esc, 'Esc로 접힘(같은 연출)');
    console.log('■ 휴대폰 터치');
    ok(R.touch.dn && R.touch.rip && R.touch.src === 'al' && R.touch.lit, '터치로도 꾹 + 물결 + 켜진 칩 연출 ' + JSON.stringify(R.touch));
    ok(R.sw <= 391, '390px 가로 넘침 없음 ' + R.sw);
  }, { vp: { width: 390, height: 800 }, touch: true });
  // ── 움직임 줄이기(prefers-reduced-motion) — 입자 없음 · 아주 약하게
  await H(async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); await eval('(' + src.seed + ')')(); const press = eval('(' + src.press + ')'); const sh = () => document.getElementById('sheet'); window.ask = async () => false;
      S.shipTab = 'confirm'; S.shipSrc = 'all'; await openShip(); await W(1000);
      { const b = sh().querySelector('.shp-stg [data-stab="deliv"]'); const r = await press(b, { wait: 200 }); const nb = sh().querySelector('.shp-stg [data-stab="deliv"]'); o.tab = { dn: r.dn, sc: r.sc, n: r.n, tab: S.shipTab, a: nb ? getComputedStyle(nb).animationName : '' }; }
      { const b = sh().querySelector('#sds_all') || sh().querySelector('#shp_oneshot'); if (b) { const r = await press(b); o.big = { n: r.n }; } }
      sh().scrollTop = 4000; await W(300); const f = document.getElementById('rnfab'); o.fabVis = !!(f && f.offsetParent);
      o.mq = matchMedia('(prefers-reduced-motion: reduce)').matches; return o; }, { seed: seedShip.toString(), press: pressSrc });
    console.log('rm', JSON.stringify(R));
    console.log('■ 움직임 줄이기');
    ok(R.mq && R.tab.dn && R.tab.sc === '0.97' && R.tab.tab === 'deliv', '움직임 줄이기: 누름은 아주 살짝(0.97) · 원래 동작 그대로 ' + JSON.stringify(R.tab));
    ok(R.tab.n === 0 && (!R.big || R.big.n === 0), '입자·도장 하나도 안 그림');
    ok(R.tab.a === 'fxSoft' || R.tab.a === 'none', '켜진 탭은 옅게 나타나기만 ' + R.tab.a);
    ok(!R.fabVis, '넓은 화면엔 ☰ 없음(예전 그대로)');
  });
  ok(!errN, '화면 오류 없음 ' + errN); console.log(bad ? `❌ tFXP 실패 ${bad}` : '✓ tFXP 통과');
})();
