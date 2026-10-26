// 🤖 자동 발송요청 화면 · 주문인/수령인 이름 표시 · 오늘 할 일 — Playwright
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const pe = []; p.on('pageerror', (e) => pe.push(e.message));
  const r = await p.evaluate(async () => { const now = new Date().toISOString(); const it = (lid, t, pr, q) => ({ listingId: lid, title: t, grade: '상', qty: q || 1, price: pr, sku: 'BLKCMN_ms', registeredAt: '2026-10-01 10:00' });
    const o1 = { orderNo: 'A-001', buyer: '홍주문', buyerEmail: 'hong@x.com', orderedAt: '2026-10-26 09:10', recipient: { name: '김수령', sameAsBuyer: false }, items: [it('404935001', '비싼 책', 12000), it('404935002', '싼 책', 3000, 4)] };
    const o2 = { orderNo: 'A-002', buyer: '이같음', orderedAt: '2026-10-26 09:20', recipient: { name: '이같음', sameAsBuyer: true }, items: [it('404935005', '보통 책', 8000)] };
    S.customers.set('c9', { id: 'c9', displayName: '김수령', names: ['김수령'], flags: { blacklist: { on: true, reason: '테스트 블랙' } } }); try { S.ver++; } catch (e) {}
    await db.collection('shp_state').doc('confirm').set({ at: now, orders: [o1, o2], tabCounts: { 주문확인요청: 2 }, sig: 'x1' });
    await db.collection('shp_state').doc('current').set({ at: now, orders: [{ ...o1, orderNo: 'D-001' }], sig: 'd1' });
    await db.collection('shp_auto').doc('A-001').set({ orderNo: 'A-001', state: 'review', at: now, decidedAt: now, buyer: '홍주문', reasons: ['한 주문 상품 5권 (기준 5권 이상)', '수령인 김수령: ⛔ 블랙리스트 고객'], kinds: ['qty', 'cust'], qty: 5, total: 24000, top: { title: '비싼 책', price: 12000, qty: 1 }, items: [{ title: '비싼 책', price: 12000, qty: 1, mkt: 'ok', ratio: -0.1, ref: 13333, refHow: '동급 유효 최저가', tier: 'valid', verdict: '조금 싸게 팔림' }] });
    await db.collection('shp_auto').doc('A-002').set({ orderNo: 'A-002', state: 'done', at: now, decidedAt: now, doneAt: now, buyer: '이같음', reasons: [], qty: 1, total: 8000, top: { title: '보통 책', price: 8000, qty: 1 }, items: [], cfg: { minQty: 5, cheapPct: 25, custBlock: true } });
    S.shipTab = 'confirm'; S.shipView = 'order'; openShip(); await new Promise((r) => setTimeout(r, 900)); openShip(); await new Promise((r) => setTimeout(r, 300));
    const sh = document.querySelector('#sheet'); const secs = [...sh.querySelectorAll('section.shp-o')]; const s1 = secs.find((x) => x.dataset.anc === 'o:A-001'), s2 = secs.find((x) => x.dataset.anc === 'o:A-002');
    const out = { n: secs.length, h1: s1 && s1.querySelector('.shp-rcv').textContent, r1: s1 && (s1.querySelector('.shp-oh .shp-rcv2') || {}).textContent, r2: s2 && !!s2.querySelector('.shp-oh .shp-rcv2'), sci1: s1 && (s1.querySelector('.sci') || {}).outerHTML, sau1: s1 && (s1.querySelector('.sau') || {}).textContent, sau2: s2 && (s2.querySelector('.sau') || {}).textContent, set: !!sh.querySelector('#sau_set'), meta1: s1 && s1.querySelector('.shp-meta').textContent };
    // 설정 바꾸기 → 저장 + 토스트
    window.__FSW = []; const box = sh.querySelector('#sau_set'); box.open = true; const mq = box.querySelector('[data-sau="minQty"]'); mq.value = '0'; mq.dispatchEvent(new Event('change')); const on = box.querySelector('[data-sau="on"]'); on.checked = false; on.dispatchEvent(new Event('change')); await new Promise((r) => setTimeout(r, 300));
    out.saved = (window.__FSW || []).filter((w) => w.n === 'app_settings' && w.id === 'ship_auto').map((w) => JSON.stringify(Object.keys(w.v).filter((k) => !/edited/.test(k)).reduce((a, k) => ({ ...a, [k]: w.v[k] }), {})));
    out.toast = (document.querySelector('#toast') || {}).textContent || '';
    // 서가별 보기
    S.shipView = 'shelf'; openShip(); await new Promise((r) => setTimeout(r, 200)); const who = [...sh.querySelectorAll('.shp-who')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()); out.who = who.slice(0, 3);
    // ② 발송 요청 탭
    S.shipView = 'order'; S.shipTab = 'deliv'; openShip(); await new Promise((r) => setTimeout(r, 200)); const d1 = sh.querySelector('section.shp-o'); out.deliv = d1 ? d1.querySelector('.shp-oh').textContent.replace(/\s+/g, ' ') : null;
    // 오늘 할 일
    const A = []; shipAutoAlerts((lv, t, key) => A.push({ lv, t, key })); out.alerts = A; const BA = (() => { try { return bizAlerts(bizCalc()).filter((a) => /^auto/.test(a.key)).length; } catch (e) { return 'ERR ' + e.message; } })(); out.biz = BA;
    out.pop = (() => { S.shipTab = 'confirm'; openShip(); const b = sh.querySelector('[data-sci="A-001"]'); if (!b) return null; shipCustPop(b); const pp = document.querySelector('.sci-pop'); const t = pp ? pp.textContent : null; document.querySelectorAll('.sci-pop').forEach((x) => x.remove()); return t; })();
    return out; });
  console.log(JSON.stringify(r, null, 1));
  const ok = r.n === 2 && r.h1 === '홍주문' && /받는 분 김수령/.test(r.r1 || '') && r.r2 === false && /sci-rc/.test(r.sci1 || '') && / bad/.test(r.sci1 || '') && /관리자 검토 필요/.test(r.sau1 || '') && /블랙리스트/.test(r.sau1 || '') && /24,000/.test(r.sau1 || '') && /자동 발송요청 완료/.test(r.sau2 || '') && r.set && !/주문인/.test(r.meta1 || '')
    && r.saved.some((x) => /"minQty":1/.test(x)) && r.saved.some((x) => /"on":false/.test(x)) && /자동 발송요청 끔/.test(r.toast) && r.who.some((x) => /홍주문/.test(x) && /받는 분 김수령/.test(x)) && /홍주문/.test(r.deliv || '') && /받는 분 김수령/.test(r.deliv || '')
    && r.alerts.some((a) => a.key === 'autorev' && a.lv === 'top' && /24,000/.test(a.t) && /비싼 책/.test(a.t)) && r.alerts.some((a) => a.key === 'autodone' && /8,000/.test(a.t) && /보통 책/.test(a.t)) && r.biz >= 2 && /수령인/.test(r.pop || '') && !pe.length;
  console.log(pe.join('|')); console.log(ok ? '✓ tA2 통과' : '❌ tA2 실패');
});
