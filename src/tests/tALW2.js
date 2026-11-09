// tALW2 — 정범님 11/10 '알라딘창이 너무 느림 · 휴대폰은 아예 안 열림 · 크롬에서 알라딘 여는 것과 같은 속도로'
//  ① 모든 기기 기본 = 🌐 바로(휴대폰도 — 예전 휴대폰 기본 📄 화면은 PC 맡김·20초 기다림이라 안 열림) · 예전 열쇠 rn-alpv-mode3의 📄은 따름 안 함 · 고른 방식은 rn-alpv-mode4
//  ② 누르는 순간(pointerdown) 숨은 창으로 받기 시작 → 손을 떼면 그 창(같은 iframe)을 그대로 꺼냄 · 끌어 굴리면(pointercancel) 지움
//  ③ 휴대폰은 닫은 창을 보관하지 않음(메모리) · PC는 그대로 보관 · 알라딘 그림 서버 미리 연결
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const H = require('./harness.js'), HM = require('./harnessM.js');
const seed = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(300); await p.addStyleTag({ content: '#seenp,#dlp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const d = { stage: 'sel', isbn: '9791100000021', grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, info: { title: '알라딘 창 속도 책', isbn13: '9791100000021', itemId: '30001', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t } };
    await db.collection('reg_items').doc('w01').set(d); S.regItems.set('w01', { id: 'w01', ...d });
    try { localStorage.setItem('rn-reg-view', 'compact'); localStorage.setItem('rn-alpv-mode3', 'page'); localStorage.removeItem('rn-alpv-mode4'); } catch (e) {} ALPV.mode = null; S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1500); };
const SEL = '.rgrow[data-rgexp="w01"] [data-rgalw]';
const run = (phone) => async (p) => { console.log(`— ${phone ? '휴대폰(안드로이드 UA · 390px)' : 'PC(1400px)'}`); await seed(p);
  // ① 기본 방식 = 바로 (예전 열쇠의 📄은 따르지 않음)
  const m0 = await p.evaluate(() => ({ md: alPvMode(), mob: alPvMob() }));
  ok(m0.md === 'live' && m0.mob === phone, '기본 = 🌐 바로(예전 rn-alpv-mode3 📄 무시)', m0);
  // ② 누르는 순간 받기 시작 → 떼면 같은 창을 꺼냄
  const bx = await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, SEL);
  await p.mouse.move(bx.x, bx.y); await p.mouse.down(); await p.waitForTimeout(60);
  const w1 = await p.evaluate(() => { const z = document.querySelector('.alpvz'); const f = z && z.querySelector('iframe.alpv-live'); if (f) f.__tag = 'warm'; return { z: !!z, src: f && f.getAttribute('src'), open: !!document.querySelector('.alpv'), pre: [...document.querySelectorAll('link[rel="preconnect"][data-alpre]')].map((l) => l.href) }; });
  ok(w1.z && /wproduct\.aspx\?ItemId=30001$/.test(w1.src || '') && !w1.open, '누르는 순간(손을 떼기 전) 숨은 창이 알라딘 화면을 받기 시작', w1);
  ok(w1.pre.some((h) => /image\.aladin\.co\.kr/.test(h)) && w1.pre.some((h) => /www\.aladin\.co\.kr/.test(h)) && (!phone || w1.pre.some((h) => /m\.aladin\.co\.kr/.test(h))), '알라딘·그림 서버 미리 연결' + (phone ? '(휴대폰은 m. 도)' : ''), w1.pre);
  await p.mouse.up(); await p.waitForTimeout(300);
  const w2 = await p.evaluate(() => { const d = document.querySelector('.alpv'); const f = d && d.querySelector('iframe.alpv-live'); return { open: !!d, same: !!(f && f.__tag === 'warm'), z: !!document.querySelector('.alpvz'), ld: !!(d && d.querySelector('.alpv-ld')), hd: !!(d && d.querySelector('.alpv-h')) }; });
  ok(w2.open && w2.same && !w2.z && !w2.ld && w2.hd, '손을 떼면 누를 때 받기 시작한 그 창을 그대로 꺼냄(다시 받지 않음 · 머리줄 있음)', w2);
  // ③ 닫기 — 휴대폰은 보관하지 않음 · PC는 보관
  await p.evaluate(() => alPvClose()); await p.waitForTimeout(100);
  const c1 = await p.evaluate(() => ({ z: !!document.querySelector('.alpvz'), open: !!document.querySelector('.alpv') }));
  ok(!c1.open && c1.z === !phone, phone ? '휴대폰: 닫으면 숨은 창을 들고 있지 않음(메모리)' : 'PC: 닫으면 잠깐 보관(예전 그대로)', c1);
  await p.evaluate(() => alPvParkDrop());
  // ④ 누른 뒤 끌어 굴림(pointercancel) → 데운 창을 지움
  await p.evaluate((s) => { const t = document.querySelector(s); const o = { bubbles: true, cancelable: true, button: 0, isPrimary: true, pointerId: 7, pointerType: 'touch' }; t.dispatchEvent(new PointerEvent('pointerdown', o)); }, SEL);
  const k1 = await p.evaluate(() => !!document.querySelector('.alpvz'));
  await p.evaluate((s) => { const t = document.querySelector(s); t.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true })); }, SEL);
  const k2 = await p.evaluate(() => !!document.querySelector('.alpvz'));
  ok(k1 && !k2, '누른 뒤 굴리기(취소)면 데운 창을 지움', { k1, k2 });
  // ⑤ 📄 화면을 고르면 이 기기에 rn-alpv-mode4로 기억 · 그때는 데우지 않음
  await p.evaluate((s) => document.querySelector(s).click(), SEL); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.alpv [data-alpv="m:page"]').click()); await p.waitForTimeout(200);
  const s1 = await p.evaluate(() => ({ v4: localStorage.getItem('rn-alpv-mode4'), md: alPvMode(), t: (document.querySelector('.alpv [data-alpv="m:page"]') || {}).title }));
  ok(s1.v4 === 'page' && s1.md === 'page' && /느림|20초/.test(s1.t || ''), '📄 화면을 고르면 rn-alpv-mode4에 기억 · 단추에 \'느림\' 안내', s1);
  await p.evaluate(() => { alPvClose(); alPvParkDrop(); }); await p.evaluate((s) => { const t = document.querySelector(s); t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true, pointerId: 8, pointerType: 'mouse' })); }, SEL);
  ok(await p.evaluate(() => !document.querySelector('.alpvz')), '📄 화면 방식이면 누를 때 데우지 않음(PC·클라우드에 맡긴 일이 늘지 않게)');
  await p.evaluate(() => { try { localStorage.setItem('rn-alpv-mode4', 'live'); } catch (e) {} ALPV.mode = null; });
};
(async () => { await H(run(false), { vp: { width: 1400, height: 900 } }); await HM(run(true), { vp: { width: 390, height: 844 }, touch: true }); console.log(bad ? `❌ tALW2 실패 ${bad}` : '✓ tALW2 통과'); })();
