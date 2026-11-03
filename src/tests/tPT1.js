// tPT1 — 11/02 정범님: 📱 휴대폰 섹션 고르기 — 상품 탭을 카드별로(맨 위 단추 · 오늘 출고 · 수동 일괄 · 가격 감시 · 재고 현황 · 그래프 …)
//  카드 하나씩 · 몇 개 · 전부(☑ 모두 체크) · 예전 '상품 목록 전체' 저장값 · 상품 자료 없이 가벼운 카드만 · 카드마다 받는 자료(thinOk) · PC는 그대로
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const MK = { pt_prob: '.probtop', pt_all: '#pallbtn', pt_stock: '#pstockbtn', pt_book: '#pbookbtn', pt_pause: '#ppausebtn', pt_kw: '#pkwbtn', pt_mkcnt: '#mktcntbtn', pt_bbuy: '#bbuybtn', pt_stop: '#stopbtn', pt_ship: '#shipbtn', pt_regnote: '#regnotebtn', pt_relink: '#relinkbtn', pt_rank: '#rankbtn2', pt_reg: '#reg_open', pt_batch: '.bslots', pt_price: '#pr_autochase, .card h3', pt_inv: null, pt_flow: null, pt_age: '[data-sec="p_age"]', pt_req: '.reqbar', pt_nbm: '[data-sec="p_nbm"]', pt_cat: '[data-sec="p_cat"]', pt_buyage: '[data-sec="p_buyage"]', pt_mtype: '[data-sec="p_mtype"]', pt_grade: '[data-sec="p_grade"]', pt_trend: '[data-sec="p_trend"]', pt_recent: '[data-sec="p_recent"]', pt_y24: '[data-sec="p_y24"]' };
const TXT = { pt_inv: '재고 현황 (지금)', pt_flow: '입고·판매 흐름', pt_price: '가격 감시' };
const probe = (MK, TXT) => { const m = document.querySelector('#main'); const t = m.innerText; const tc = m.textContent; const has = {}; for (const [id, q] of Object.entries(MK)) has[id] = TXT[id] ? tc.includes(TXT[id]) && (id !== 'pt_price' || !!m.querySelector('.card')) : !!(q && m.querySelector(q)); return { has, err: /화면을 그리다 오류/.test(t), junk: /(^|[^a-zA-Z_])(false|undefined|NaN)([^a-zA-Z_]|$)/.test(tc), bar: (m.querySelector('.thinbar') || {}).textContent || '', okP: thinOk('prod'), okM: thinOk('pm'), okS: thinOk('sel'), wait: !!m.querySelector('.thinwait'), q: !!m.querySelector('#thin_q') }; };
(async () => { await require('./harnessM.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const set = (ids) => p.evaluate(([ids, MK, TXT, probeS]) => { localStorage.setItem('rn-thin-sec', JSON.stringify({ products: ids })); S.tab = 'products'; S.thinPick = null; S.q = ''; renderTabs(); renderMainNow(); return eval('(' + probeS + ')')(MK, TXT); }, [ids, MK, TXT, probe.toString()]);
  // ① 고르기 화면
  const r0 = await p.evaluate(() => { localStorage.removeItem('rn-thin-sec'); S.tab = 'products'; S.thinPick = null; renderTabs(); renderMainNow(); const m = document.querySelector('#main'); const mem = (id) => ((m.querySelector(`[data-thsec="${id}"]`) || { closest: () => null }).closest('label') || { querySelector: () => ({}) }).querySelector('.thmem').textContent || ''; return { n: m.querySelectorAll('[data-thsec]').length, ship: mem('pt_ship'), inv: mem('pt_inv'), all: mem('pt_all'), batch: mem('pt_batch'), allBtn: !!m.querySelector('#thsec_all'), okP: thinOk('prod') }; });
  const N = r0.n; ok(N >= 31, '상품 탭 고르기 항목이 카드별 ' + N + '개(11/02 31개 · 새 칸이 생기면 늘어남 · 예전 1개)'); ok(/받을 큰 자료 없음/.test(r0.ship), '🚚 오늘 출고: ' + r0.ship); ok(/상품 2\.6만/.test(r0.inv) && !/시장 지표/.test(r0.inv), '재고 현황: 상품만 — ' + r0.inv); ok(/시장 지표/.test(r0.all), '📚 상품 전체 보기: 시장 지표까지 — ' + r0.all); ok(/판매자/.test(r0.batch), '수동 일괄 그룹: 판매자까지 — ' + r0.batch); ok(r0.allBtn && !r0.okP, '☑ 모두 체크 단추 · 고르기 전엔 상품 전체를 받지 않음');
  // ② 카드 하나씩
  const ids = await p.evaluate(() => PT_SECS.map((x) => x[0])); const always = Object.keys(MK).filter((k) => !['pt_prob', 'pt_px', 'pt_cancel', 'pt_weight'].includes(k)); let oneBad = [];
  for (const id of ids) { const r = await set([id]); const others = always.filter((k) => k !== id && r.has[k]); const need = await p.evaluate((id) => thinNeedOf('products', [id]), id);
    if (r.err || r.junk || others.length || (always.includes(id) && !r.has[id]) || r.okP !== need.includes('prod') || r.okM !== need.includes('pm') || r.okS !== need.includes('sel') || !/고른 섹션 1개/.test(r.bar)) oneBad.push(`${id}: err ${r.err} junk ${r.junk} 다른 카드 ${others} 보임 ${r.has[id]} 받음 ${+r.okP}${+r.okM}${+r.okS} 필요 ${need}`); }
  ok(!oneBad.length, `카드 하나씩 ${ids.length}번: 그 카드만 보이고 오류·빈 글자 없음 · 받는 자료 = 그 카드가 쓰는 것만` + (oneBad.length ? '\n     ' + oneBad.join('\n     ') : ''));
  // ③ 몇 개
  const r3 = await set(['pt_ship', 'pt_inv', 'pt_trend', 'pt_price']); const on3 = always.filter((k) => r3.has[k]);
  ok(on3.sort().join() === 'pt_inv,pt_price,pt_ship,pt_trend' && !r3.err, '몇 개 고름 → 그것만: ' + on3); ok(r3.okP && !r3.okM && !r3.okS, '재고 현황·그래프·가격 감시 → 상품만(시장 지표·판매자 안 받음)'); ok(/≈64MB/.test(r3.bar), '띠: ' + r3.bar.trim());
  // ④ 전부 — ☑ 모두 체크 → 고른 대로 보기
  const r4 = await p.evaluate(async ([MK, TXT, probeS]) => { localStorage.removeItem('rn-thin-sec'); S.thinPick = null; renderMainNow(); const m = document.querySelector('#main'); m.querySelector('#thsec_all').click(); const head = m.querySelector('.thinpick p b').textContent; m.querySelector('#thsec_save').click(); renderMainNow(); await new Promise((r) => setTimeout(r, 300)); return { head, n: thinSel('products').length, ...eval('(' + probeS + ')')(MK, TXT) }; }, [MK, TXT, probe.toString()]);
  const on4 = always.filter((k) => r4.has[k]); ok(new RegExp(N + '개').test(r4.head) && r4.n === N, '☑ 모두 체크: ' + r4.head); ok(on4.length === always.length && !r4.err && !r4.junk, `전부 고름 → 카드 ${on4.length}/${always.length} 모두 · 오류 없음`); ok(r4.okP && r4.okM && r4.okS, '전부 → 상품·시장 지표·판매자');
  // ⑤ 예전 '상품 목록 전체(all)' 저장값
  const r5 = await set(['all']); ok(always.every((k) => r5.has[k]) && new RegExp('고른 섹션 ' + N + '개').test(r5.bar), '예전 저장값(all) → 모든 카드로 이어짐: ' + r5.bar.trim());
  // ⑥ 상품 자료가 아직 없을 때(가벼운 카드는 바로 · 나머지는 받는 중 안내 · 검색은 서버에서)
  const r6 = await p.evaluate(([MK, TXT, probeS]) => { S.prodLoaded = false; localStorage.setItem('rn-thin-sec', JSON.stringify({ products: ['pt_ship', 'pt_relink', 'pt_req', 'pt_inv'] })); renderMainNow(); const a = eval('(' + probeS + ')')(MK, TXT); S.q = '테스트'; renderMainNow(); const b = eval('(' + probeS + ')')(MK, TXT); S.q = ''; S.prodLoaded = true; renderMainNow(); return { a, b }; }, [MK, TXT, probe.toString()]);
  ok(r6.a.has.pt_ship && r6.a.has.pt_relink && r6.a.has.pt_req && !r6.a.has.pt_inv && r6.a.wait && !r6.a.err, '상품 자료 전: 🚚·🔗·수집 요청은 바로 · 재고 현황은 \'받은 뒤 나옴\' 안내'); ok(r6.b.q && !r6.b.err, '상품 자료 전 검색 → 서버에서 찾기 칸');
  const r7 = await set(['pt_ship']); ok(!r7.okP && !r7.okM && !r7.okS && r7.has.pt_ship, '🚚 오늘 출고만 → 큰 자료 하나도 안 받음');
  // ⑦ 상품만 받는 카드(재고 현황 → 목록)·상품 상세 — 시장 지표 전체 없이 그 책들만 서버에서
  await set(['pt_inv']); const r8 = await p.evaluate(async () => { __FS.prd_book_metrics = __FS.prd_book_metrics || {}; for (let i = 0; i < 12; i++) __FS.prd_book_metrics['bk' + i] = { usedFirstPage: [{ price: 4000 + i * 100, grade: '상', sc: '1234', seller: '가나다' }, { price: 6000, grade: '최상', sc: '2345', seller: '라마바' }], usedTotal: 2, lastCheckedAt: '2026-11-01T10:00:00' };
    S.pmetrics.clear(); S.pmLoaded = false; document.querySelector('#main [data-drill="pd:act:new"]').click(); await new Promise((r) => setTimeout(r, 1500)); const n = document.querySelectorAll('#sheet .lvblk').length; const pm1 = S.pmetrics.size; history.back(); await new Promise((r) => setTimeout(r, 400));
    const pid = [...S.plist.keys()].find((k) => (S.plist.get(k).bookId === 'bk0')); await openProduct(pid); await new Promise((r) => setTimeout(r, 400)); const got = !!S.pmetrics.get('bk0'); history.back(); return { n, pm1, got, pmL: S.pmLoaded, okM: thinOk('pm') }; });
  ok(r8.n >= 1 && r8.pm1 >= 1 && r8.pm1 <= 12 && !r8.pmL && !r8.okM, `재고 현황 → 재고 목록: 시장 지표 전체 없이 화면의 책만 서버에서(${r8.pm1}권) → 첫 쪽 블록 ${r8.n}개`); ok(r8.got, '상품 상세: 그 책 한 권 시장 지표만 서버에서');
  ok(!errs.length, '페이지 오류 없음 ' + JSON.stringify(errs.slice(0, 3)));
  console.log(bad ? `❌ tPT1 실패 ${bad}` : '✓ tPT1 휴대폰 부분 통과'); });
// PC는 그대로 — 모든 카드
await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const r = await p.evaluate(([MK, TXT, probeS]) => { localStorage.setItem('rn-thin-sec', JSON.stringify({ products: ['pt_ship'] })); S.tab = 'products'; S.q = ''; renderTabs(); renderMainNow(); return { thin: PHONE_THIN, ...eval('(' + probeS + ')')(MK, TXT) }; }, [MK, TXT, probe.toString()]);
  const always = Object.keys(MK).filter((k) => !['pt_prob', 'pt_px', 'pt_cancel', 'pt_weight'].includes(k)); const miss = always.filter((k) => !r.has[k]);
  ok(!r.thin && !miss.length && !r.err && !r.junk && !r.bar, 'PC: 휴대폰 고르기와 상관없이 모든 카드 그대로' + (miss.length ? ' 빠짐 ' + miss : ''));
  console.log(bad ? `❌ tPT1 실패 ${bad}` : '✓ tPT1 통과'); });
})();
