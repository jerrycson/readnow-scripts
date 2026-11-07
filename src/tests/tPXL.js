// tPXL — 정범님 11/08: 👀 상품 조회수 분석 — 제목 · 실험 상품 칸 정렬·찾기(저자·출판사)·위 탭(종류·주제 분류·등급·가격대) · 📥 등록 '👀 등록 때 그림' 켜기/끄기(모든 기기) · 🌅 아침 인사말 설정 모든 기기 공용 · 공용 pxGate 하루 3,000 속도
//  사용: w/pw 안에서 RN_PORT=8765 node tPXL.js
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
  await p.evaluate(async () => { S.app.cloudUrl = 'https://cloud.test'; const base = S.plist.get('aladin_U215983410'); const now = new Date().toISOString();
    const mk = (i, t, top, cat, grade, price, author, pub) => { const uc = 'U7' + (1000 + i); const lid = String(520000000 + i); const bid = 'B' + i; S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, bookId: bid, title: t, status: '판매중', active: true, grade, price }); S.pbooks.set(bid, { categories: [{ path: [top, cat, '세부'] }], author, publisher: pub }); return lid; };
    const L = [mk(1, '어린 왕자', '국내도서', '소설/시/희곡', '상', 8000, '생텍쥐페리', '문학동네'), mk(2, 'Harry Potter', '외국도서', 'Fiction', '중', 15000, 'J.K. Rowling', 'Bloomsbury'), mk(3, '[블루레이] 인터스텔라', 'DVD', '영화', '최상', 25000, '', '워너'), mk(4, '아이유 앨범', '음반', '가요', '상', 12000, '', '로엔'), mk(5, '코스모스', '국내도서', '과학', '상', 30000, '칼 세이건', '사이언스북스')];
    for (const lid of L) await db.collection('px_exp').doc(lid).set({ lid, on: true, state: 'done', addedAt: now, src: 'g:g_all1107' }); pxInit(); });
  await p.waitForTimeout(1200); await p.evaluate(() => openPxExp()); await p.waitForTimeout(1500);
  R.title = await p.evaluate(() => document.querySelector('#sheet .sh .t').textContent); chk('title', /👀 상품 조회수 분석/.test(R.title) && !/실험 <small/.test(R.title), R.title);
  const cards = () => p.evaluate(() => [...document.querySelectorAll('#px_list .pxcard')].map((c) => c.dataset.pxid));
  R.n0 = (await cards()).length; chk('all5', R.n0 >= 5, R.n0);
  R.kinds = await p.evaluate(() => [...document.querySelectorAll('[data-pxkind]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim())); chk('kindTabs', ['국내도서', '외국도서', '음반', '블루레이'].every((k) => R.kinds.some((t) => t.startsWith(k))) && !R.kinds.some((t) => t.startsWith('DVD')), R.kinds); /* 개수 0인 종류(DVD — 이 자료엔 블루레이만)는 탭을 숨김 */
  await p.click('[data-pxkind="br"]'); await p.waitForTimeout(500); R.br = await cards(); chk('blu', R.br.length === 1 && R.br[0] === '520000003', R.br);
  await p.click('[data-pxkind="kr"]'); await p.waitForTimeout(500); R.kr = await cards(); R.cats = await p.evaluate(() => [...document.querySelectorAll('[data-pxcat] option')].map((o) => o.textContent)); chk('kr', R.kr.includes('520000001') && R.kr.includes('520000005') && !R.kr.includes('520000002'), R.kr); chk('catOpts', R.cats.some((t) => /과학/.test(t)) && R.cats.some((t) => /소설/.test(t)), R.cats);
  await p.selectOption('[data-pxcat]', '과학'); await p.waitForTimeout(500); R.sci = await cards(); chk('cat', R.sci.length === 1 && R.sci[0] === '520000005', R.sci);
  await p.click('[data-pxclr]'); await p.waitForTimeout(500);
  await p.fill('#px_lq', '세이건'); await p.waitForTimeout(900); R.q1 = await cards(); R.focus = await p.evaluate(() => document.activeElement && document.activeElement.id); chk('searchAuthor', R.q1.length === 1 && R.q1[0] === '520000005', R.q1); chk('searchFocus', R.focus === 'px_lq', R.focus);
  await p.fill('#px_lq', 'Bloomsbury'); await p.waitForTimeout(900); R.q2 = await cards(); chk('searchPub', R.q2.length === 1 && R.q2[0] === '520000002', R.q2);
  await p.fill('#px_lq', ''); await p.waitForTimeout(900);
  await p.click('[data-pxgr="최상"]'); await p.waitForTimeout(500); R.gr = await cards(); chk('grade', R.gr.length === 1 && R.gr[0] === '520000003', R.gr); await p.click('[data-pxgr="all"]'); await p.waitForTimeout(400);
  await p.selectOption('[data-pxband]', '20000-50000'); await p.waitForTimeout(500); R.band = await cards(); chk('band', R.band.length >= 2 && R.band.every((x) => ['520000003', '520000005'].includes(x)), R.band); await p.selectOption('[data-pxband]', ''); await p.waitForTimeout(400);
  R.sorts = await p.evaluate(() => document.querySelectorAll('[data-pxsort]').length); chk('sorts', R.sorts >= 15, R.sorts);
  await p.click('[data-pxsort="price"]'); await p.waitForTimeout(500); R.byPrice = (await cards()).slice(0, 2); chk('sortPrice', R.byPrice[0] === '520000005', R.byPrice);
  // 📥 등록 '👀 등록 때 그림' — 모든 기기 설정(app_settings/main.pxRegAuto)
  R.reg = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const h = pxRegAutoBtn(); const box = document.createElement('div'); box.innerHTML = h; document.body.appendChild(box); const b = box.querySelector('[data-rgpxauto]'); const t0 = b.textContent; b.click(); await W(600); const d = (await db.collection('app_settings').doc('main').get()).data() || {}; const b2 = box.querySelector('[data-rgpxauto]'); return { t0, off: d.pxRegAuto, t1: b2 && b2.textContent }; });
  chk('regToggle', /켜짐/.test(R.reg.t0) && R.reg.off === false && /꺼짐/.test(R.reg.t1 || ''), R.reg);
  // 🌅 아침 인사말 — 공용 설정
  R.amg = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const a0 = S.app.adminDevices, d0 = S.devOk, n0 = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'TEST-PC'); S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; const P = amgPrefs(); P.sec = 33; const ok = amgPrefsSet(P); await W(500); const d = (await db.collection('app_settings').doc('main').get()).data() || {}; localStorage.removeItem('rn-amg'); const back = amgPrefs().sec; S.app.adminDevices = a0; S.devOk = d0; if (n0 == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', n0); return { ok, sec: d.amg && d.amg.sec, back }; });
  chk('amgShared', R.amg.ok === true && R.amg.sec === 33 && R.amg.back === 33, R.amg);
  // 공용 pxGate — 하루 3,000 · 시간당 200 · 수정 사이 3~6초
  R.gate = await p.evaluate(() => { const AS = window.ReadnowAuto && window.ReadnowAuto.AS; if (!AS || !AS.pxGate) return null; const g = AS.pxGate({ now: Date.parse('2026-11-08T12:00:00+09:00'), cfg: {}, daily: true, rnd: () => 0.5 }); return { ok: g.ok, edMax: g.edMax, edGap: g.edGap, cap: AS.PX_DAILY_DEF && AS.PX_DAILY_DEF.cap }; });
  chk('gate', R.gate && R.gate.ok && R.gate.edMax >= 15 && R.gate.edGap && R.gate.edGap[0] === 3 && R.gate.edGap[1] === 6, R.gate);
  chk('noErr', errs.length === 0, errs);
  console.log(JSON.stringify(R, null, 1).slice(0, 3000)); console.log(bad.length ? '❌ tPXL 실패 — ' + bad.join(', ') : '✓ tPXL 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
});
