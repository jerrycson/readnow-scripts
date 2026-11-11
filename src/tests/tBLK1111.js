// tBLK1111 — 정범님 11/11: '허위매물 판매자와 블랙리스트 고객은 우리 운영 전체에서 서로 다른 존재'
//  ① 자동 판단(공용 출고 autoShipDecide — 클라우드·PC 수집기·PC 도우미가 같이 씀): 허위매물 판매자만 → 검토 아님(풀이 notes) · 블랙 고객 → 검토 · 둘 다 → 검토(까닭은 블랙만)
//     · ⚙ '허위매물 판매자도 검토'(sellerReview · 기본 끔) 켜면 판매자도 검토(kind seller — 블랙 cust와 따로) · 블랙 조건 끄고 판매자만 켜도 판매자는 검토
//  ② 웹앱 배지: ⛔블랙(빨강 tag bl) vs 🕵허위매물(보라 tag fsl) · 출고 고객 아이콘 ⛔ vs 🕵 · 위험 점수 블랙 > 판매자
//  ③ ⚙ 🤖 자동 발송요청 칸: '⛔ 블랙리스트 고객이면 검토' · '🕵 허위매물 판매자도 검토'(기본 끔 · 누르면 저장) · 통과한 주문 줄에 '🕵 허위매물 판매자 — 검토 조건 아님'
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 }); const E = (rows) => ({ mkt: { at: '2026-11-11T01:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours' });
const base = { evalSale: ML.evalSale, now: 1000, firstAt: 1000, order: { orderNo: 'O1', buyer: '손님A', items: [{ listingId: '1', title: '책1', price: 9000, qty: 1, grade: '상' }] }, enrich: { 1: E([row('green', '상', 9500)]) } };
const SEL = { who: '주문인', name: '손님A', seller: true, sellers: ['X서점'] }, BLK = { who: '수령인', name: '손님B', bl: true, blWhy: '반품 악용' };
ok(SH.autoCfg({}).sellerReview === false && SH.AUTO_DEFAULTS.sellerReview === false, '설정 기본: 허위매물 판매자도 검토 = 끔');
let D = SH.autoShipDecide({ ...base, cust: { hits: [SEL] } });
ok(D.state === 'pass' && !D.reasons.length && !D.kinds.length && /🕵 허위매물 판매자/.test(D.notes[0] || '') && /검토 조건 아님/.test(D.notes[0]), '허위매물 판매자만 → 검토 아님(자동 진행) · 풀이: ' + D.notes[0]);
D = SH.autoShipDecide({ ...base, cust: { hits: [BLK] } });
ok(D.state === 'review' && D.kinds.join() === 'cust' && /⛔ 블랙리스트 고객 — 반품 악용/.test(D.reasons[0]), '블랙 고객 → 검토: ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cust: { hits: [{ ...SEL, bl: true }] } });
ok(D.state === 'review' && D.reasons.length === 1 && /⛔/.test(D.reasons[0]) && !D.reasons.some((t) => /🕵|판매자 연관/.test(t)) && D.notes.length === 1, '둘 다(같은 고객) → 검토 · 까닭은 블랙만 · 판매자는 풀이');
D = SH.autoShipDecide({ ...base, cfg: { sellerReview: true }, cust: { hits: [SEL] } });
ok(D.state === 'review' && D.kinds.join() === 'seller' && /🕵 허위매물 판매자/.test(D.reasons[0]), '설정 켜면 판매자도 검토(kind seller): ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cfg: { custBlock: false, sellerReview: true }, cust: { hits: [SEL, BLK] } });
ok(D.state === 'review' && D.kinds.join() === 'seller' && D.reasons.length === 1, '블랙 조건 끄고 판매자만 켬 → 판매자만 검토');
D = SH.autoShipDecide({ ...base, cfg: { custBlock: false }, cust: { hits: [SEL, BLK] } });
ok(D.state === 'pass', '둘 다 끄면 통과');
D = SH.autoShipDecide({ ...base, cust: { hits: [], err: '읽기 실패' } }); ok(D.state === 'review' && D.kinds.join() === 'cust', '고객 기록 못 읽음 → 검토 그대로');
ok(SH.custRisk({ sellerLinks: [{ name: 'X서점' }] }).bl === false && SH.custRisk({ flags: { blacklist: { on: true } } }).seller === false, 'custRisk: 판매자 연결은 bl을 켜지 않음 · 블랙은 seller를 켜지 않음');
if (bad) { console.log('❌ tBLK1111 실패(단위) ' + bad); process.exit(1); }

const path = require('path'); const SHOT = process.env.SHOT_DIR || path.join(__dirname, '..', 'shot');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const pe = []; p.on('pageerror', (e) => pe.push(e.message));
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); S.user = S.user || { email: 'tester@x' };
    const it = (lid, t, pr) => ({ listingId: lid, title: t, grade: '상', qty: 1, price: pr, sku: 'BLKCMN_ms', registeredAt: '2026-10-01 10:00' });
    const o = (n, who, lid) => ({ orderNo: n, buyer: who, orderedAt: '2026-11-11 09:10', recipient: { name: who, sameAsBuyer: true }, items: [it(lid, '책 ' + n, 9000)] });
    S.customers.set('cb1', { id: 'cb1', displayName: '손님A', names: ['손님A'], flags: { blacklist: { on: true, reason: '시험 블랙' } } });
    S.customers.set('cs1', { id: 'cs1', displayName: '손님B', names: ['손님B'], sellerLinks: [{ name: 'X서점', sc: '111', level: 'match', reasons: ['phone'] }] });
    S.customers.set('cx1', { id: 'cx1', displayName: '손님C', names: ['손님C'], flags: { blacklist: { on: true, reason: '시험 블랙' } }, sellerLinks: [{ name: 'Y서점', sc: '222', level: 'match' }] }); try { S.ver++; } catch (e) {}
    const O = [o('A-1', '손님A', '404935101'), o('A-2', '손님B', '404935102'), o('A-3', '손님C', '404935103')];
    await db.collection('shp_state').doc('confirm').set({ at: now, orders: O, tabCounts: { 주문확인요청: 3 }, sig: 'b1' });
    await db.collection('shp_auto').doc('A-2').set({ orderNo: 'A-2', state: 'done', at: now, decidedAt: now, doneAt: now, buyer: '손님B', reasons: [], qty: 1, total: 9000, top: { title: '책 A-2', price: 9000, qty: 1 }, cust: [{ who: '주문인', name: '손님B', seller: true, sellers: ['X서점'] }], cfg: { custBlock: true, cheapPct: 25 } });
    await db.collection('shp_auto').doc('A-1').set({ orderNo: 'A-1', state: 'review', at: now, decidedAt: now, buyer: '손님A', reasons: ['주문인 손님A: ⛔ 블랙리스트 고객 — 시험 블랙'], kinds: ['cust'], qty: 1, total: 9000, top: { title: '책 A-1', price: 9000, qty: 1 }, cust: [{ who: '주문인', name: '손님A', bl: true }], cfg: { custBlock: true } });
    S.shipTab = 'confirm'; S.shipView = 'order'; openShip(); await W(900); openShip(); await W(300);
    const sh = document.querySelector('#sheet'); const out = {};
    const ics = (n) => ((shipCustInfo(n) || {}).items || []).map((x) => x.ic); out.ic1 = ics('A-1'); out.ic2 = ics('A-2'); out.ic3 = ics('A-3');
    out.rk = ['A-1', 'A-2', 'A-3'].map((n) => shipRiskOf(O.find((x) => x.orderNo === n)));
    out.f1 = cuF('cb1'); out.f2 = cuF('cs1'); out.f3 = cuF('cx1');
    out.fsCss = (() => { const s = document.createElement('span'); s.className = 'tag fsl'; document.body.appendChild(s); const b = document.createElement('span'); b.className = 'tag bl'; document.body.appendChild(b); const c = [getComputedStyle(s).color, getComputedStyle(b).color]; s.remove(); b.remove(); return c; })();
    const sec = (n) => [...sh.querySelectorAll('section.shp-o')].find((x) => x.dataset.anc === 'o:' + n);
    out.l2 = ((sec('A-2') || document).querySelector('.sau') || {}).textContent || ''; out.l1 = ((sec('A-1') || document).querySelector('.sau') || {}).textContent || '';
    const box = sh.querySelector('#sau_set'); box.open = true; const cb = box.querySelector('[data-sau="custBlock"]'), sr = box.querySelector('[data-sau="sellerReview"]');
    out.cbT = cb && cb.parentElement.textContent.trim(); out.srT = sr && sr.parentElement.textContent.trim(); out.srOff = !!sr && !sr.checked;
    window.__FSW = []; if (sr) { sr.checked = true; sr.dispatchEvent(new Event('change')); } await W(400);
    out.saved = (window.__FSW || []).filter((w) => w.n === 'app_settings' && w.id === 'ship_auto').some((w) => w.v && w.v.sellerReview === true); out.toast = (document.querySelector('#toast') || {}).textContent || '';
    box.scrollIntoView(); return out; });
  console.log(JSON.stringify(r, null, 1));
  try { require('fs').mkdirSync(SHOT, { recursive: true }); await p.screenshot({ path: path.join(SHOT, 'tBLK1111.png'), fullPage: false }); } catch (e) { console.log('사진 실패', e.message); }
  const has = (a, x) => (a || []).includes(x);
  ok(has(r.ic1, '⛔') && !has(r.ic1, '🕵'), '블랙 고객 주문 = ⛔ 아이콘만'); ok(has(r.ic2, '🕵') && !has(r.ic2, '⛔') && !has(r.ic2, '🔗'), '허위매물 판매자 주문 = 🕵 아이콘만(⛔ 아님)'); ok(has(r.ic3, '⛔') && has(r.ic3, '🕵'), '둘 다 = ⛔ · 🕵 따로');
  ok(r.rk[0] > r.rk[1] && r.rk[1] > 0 && r.rk[2] > r.rk[0], '위험 점수: 블랙 > 판매자 > 0 · 둘 다 가장 큼 ' + r.rk.join('/'));
  ok(/tag bl[^"]*"[^>]*>⛔블랙/.test(r.f1) && !/fsl/.test(r.f1), '고객 배지: 블랙 = ⛔블랙(빨강)'); ok(/tag fsl[^"]*"[^>]*>🕵허위매물/.test(r.f2) && !/tag bl/.test(r.f2), '고객 배지: 허위매물 판매자 = 🕵허위매물(보라 · 블랙 색 아님)'); ok(/⛔블랙/.test(r.f3) && /🕵허위매물/.test(r.f3), '고객 배지: 둘 다 따로');
  ok(r.fsCss[0] !== r.fsCss[1], '색 구분: 허위매물 ' + r.fsCss[0] + ' ≠ 블랙 ' + r.fsCss[1]);
  ok(/🕵 허위매물 판매자 — 검토 조건 아님/.test(r.l2) && !/⛔🔗/.test(r.l2), '통과한 주문 줄: 허위매물 판매자는 검토 조건 아님 · ' + r.l2.slice(0, 160));
  ok(/블랙리스트 고객/.test(r.l1), '블랙 주문 줄: 검토 까닭 = 블랙리스트 고객');
  ok(/⛔ 블랙리스트 고객이면 검토/.test(r.cbT || '') && !/판매자/.test(r.cbT || ''), '설정: 블랙 칸에 판매자 안 섞임'); ok(/🕵 허위매물 판매자도 검토/.test(r.srT || '') && r.srOff, '설정: 허위매물 판매자도 검토 칸 · 기본 끔');
  ok(r.saved && /허위매물 판매자도 검토/.test(r.toast), '설정 켜기 → app_settings/ship_auto.sellerReview 저장 · 알림: ' + r.toast);
  ok(!pe.length, '쪽 오류 없음 ' + pe.join('|'));
  console.log(bad ? '❌ tBLK1111 실패 ' + bad : '✓ tBLK1111 통과');
});
