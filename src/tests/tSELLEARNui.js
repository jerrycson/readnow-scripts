// tSELLEARNui — 🔭 시장조사 › 🏪 경쟁 판매자: 판정 조건 여러 개·충돌 순서·🧑‍🏫 카드 화면 시험(sell1 · 꾸민 자료만) · 실행: cd pw && RN_PORT=<포트> node tSELLEARNui.js (harness.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((x) => setTimeout(x, ms)); try { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); } catch (e) {} S.devOk = true; S.sellersLoaded = true; S.sellers = new Map();
    const mk = (id, o) => S.sellers.set(id, { id, name: '판매자' + id.slice(-1), sc: 1, totalItems: 1000, ...o });
    mk('sc_101', { grade: 'fake', cancel3m: 0.002 }); mk('sc_102', { cancel3m: 0.08 }); mk('sc_103', { cancel3m: 0.004 }); mk('sc_104', {});
    S.prCfg = { ...(S.prCfg || {}), chaseEng: { sellers: { 104: { stance: 'ignore' } } } };
    const prof = (n) => ({ runs: 5, days: 20, soldPerDay: n, revPerDay: n * 9000, stock: 20000, turn: 0.001, addPerDay: 40, regDaysShare: 0.8, addCv: 0.5, cats: [{ k: '국내도서>소설/시/희곡', s: 0.4, n: 40 }], catKnownS: 0.9, bands: [{ k: '6천~1만', s: 0.5 }], grades: [{ k: '최상', s: 0.6 }], years: { new12: 5, y3: 10, old: 20, new12S: 0.14 }, words: [], pubs: [], authors: [], lifeMed: 9, lifeN: 30, priceMed: 8000 });
    S.slL = { open: true, at: Date.now(), doc: { day: '2026-11-11', sellers: 3, cfg: { role: { by: 'rev', minRating: 0.97, maxCancel: 0.05 }, front: { per: 24, pages: 10 } }, role: [{ sc: '101' }, { sc: '103' }],
      profiles: [{ sc: '101', name: '판매자1', p: prof(50), f: { fake: true, topSales: true } }, { sc: '103', name: '판매자3', p: prof(30), f: { rating: 0.995, cancel: 0.004, topSales: true } }, { sc: '102', name: '판매자2', p: prof(10), f: { cancel: 0.08 } }],
      ours: { stock: 15000, cats: { '국내도서>소설/시/희곡': 0.1 }, bands: { '6천~1만': 0.2 }, new12S: 0.05, addPerDay: 12, priceMed: 6000 }, plans: [],
      front: { pool: { n: 12, pooledLift: 2.1, ci: [1.6, 2.7], conf: '보통', soldAll: 900, soldFP: 300, spAddSell: 0.4, nA: 12, spDwellEarly: 0.3, nB: 12 }, rows: [{ name: '판매자3', stock: 20000, addPerDay: 40, dwell: 6, expFPs: 0.012, soldFPs: 0.2, lift: 2, early7S: 0.1 }], ours: { rows: 5000, fpRate: 0.03, allRate: 0.01, ageLift: 1.4, days: ['2026-11-01'], bins: [{ age: '0~3일', fpN: 200, fpRate: 0.03, offN: 50, offRate: 0.02, lift: 1.5 }] } } } };
    localStorage.removeItem('rn-sltrack'); S.slC = null; S.tab = 'sellers'; S.q = ''; renderTabs(); renderMainNow(); await W(500); const m = document.querySelector('#main'); const out = {};
    out.card = !!m.querySelector('#sl_learn[open]') && /판매자3/.test(m.querySelector('#sl_learn').textContent) && !/🧑‍🏫 판매자1/.test(m.querySelector('#sl_learn').textContent);
    out.front = /2\.1배/.test(m.textContent) && /신뢰도 보통/.test(m.textContent) && /나이 맞춘 배 1\.4/.test(m.textContent); out.tips = /더 매입/.test(m.querySelector('#sl_learn').textContent);
    out.vis0 = [...document.querySelectorAll('#main .list [data-sid]')].map((b) => b.dataset.sid).join(','); out.sg = S.sellerGrade; out.bar = !!m.querySelector('#sl_cond') && m.querySelectorAll('[data-slc]').length >= 10;
    out.dbg = [S.tab, !!window.ReadnowSellerLearn, m.textContent.slice(0, 300)]; if (!m.querySelector('[data-slc="fake"]')) return out; m.querySelector('[data-slc="fake"]').click(); await W(1200); m.querySelector('[data-slc="role"]').click(); await W(1200); renderMainNow(); await W(300);
    out.on = S.slC.on.slice(); out.mode = S.slC.mode; out.sg2 = S.sellerGrade; out.q2 = S.q; out.lim = S.limit; out.man = [...S.sellers.values()].filter((x) => ReadnowSellerLearn.pass(slFacts(x), S.slC.on, S.slC.mode)).map((x) => x.id).join(','); out.p103 = ReadnowSellerLearn.pass(slFacts(S.sellers.get('sc_103')), S.slC.on, S.slC.mode); out.memoK = typeof memo; out.f103 = slFacts(S.sellers.get('sc_103')); out.vis = [...document.querySelectorAll('#main .list [data-sid]')].length;
    out.or = [...document.querySelectorAll('#main .list [data-sid]')].map((b) => b.dataset.sid).sort().join(',');
    out.dbg2 = [S.tab, document.querySelector('#main').textContent.slice(0, 400)]; if (!document.querySelector('#main [data-slm="and"]')) return out;
    document.querySelector('#main [data-slm="and"]').click(); await W(1200); out.and = [...document.querySelectorAll('#main .list [data-sid]')].map((b) => b.dataset.sid).join(',');
    const t1 = document.querySelector('#main .list [data-sid="sc_101"] .tag'); out.tag1 = t1 ? t1.textContent : null;
    out.dbg3 = [document.querySelectorAll('#main [data-slo]').length, (S.slC.order||[]).length, document.querySelector('#main #sl_cond') ? document.querySelector('#main #sl_cond').innerHTML.slice(-600) : 'nobar']; if (!document.querySelector('#main [data-slu="role"]')) return out;
    document.querySelector('#main [data-slu="role"]').click(); await W(1200); for (let i = 0; i < 6; i++) { const b = document.querySelector('#main [data-slu="role"]'); if (!b || b.disabled) break; b.click(); await W(1000); }
    out.draftTop = (document.querySelector('#main [data-slo]') || {}).dataset.slo; out.dbg4 = [!!S.slC.draft, (S.slC.draft||[])[0], document.querySelectorAll('#main #sl_osave').length]; if (!document.querySelector('#main #sl_osave')) return out; const sv = () => document.querySelector('#main #sl_osave'); out.btn1 = sv() && sv().textContent; sv().click(); await W(1200); out.btn2 = sv() && sv().textContent; sv().click(); await W(400);
    out.saved = (S.slC.order || [])[0]; const t2 = document.querySelector('#main .list [data-sid="sc_101"] .tag'); out.tag2 = t2 ? t2.textContent : null; out.local = JSON.parse(localStorage.getItem('rn-sltrack') || '{}').order[0];
    return out; });
  ok(r.card && r.tips, '🧑‍🏫 카드: 허위 표시 판매자는 롤모델에서 빠지고 판매자3이 보임 · 따라 하기 제안', r);
  ok(r.front, '🗂 앞 페이지 결과: 배·신뢰도·우리 나이 맞춤', r); ok(r.bar, '🧭 판정 조건 줄');
  ok(r.or === 'sc_101,sc_103' && r.and === 'sc_101', '하나라도(허위·롤모델) → 2곳 · 모두 → 1곳', r);
  ok(/배척/.test(r.tag1 || '') && /⚔/.test(r.tag1 || ''), '처음 순서: 허위(배척)가 이기고 충돌 ⚔ 표시', r.tag1);
  ok(r.draftTop === 'role' && /확정/.test(r.btn1 || '') && /한 번 더/.test(r.btn2 || '') && r.saved === 'role' && r.local === 'role', '↑로 롤모델을 맨 위로 → 두 번 눌러 확정 · 이 기기에 저장', r);
  ok(/배움/.test(r.tag2 || ''), '순서를 바꾸니 같은 판매자 판정이 배움으로', r.tag2);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); });
