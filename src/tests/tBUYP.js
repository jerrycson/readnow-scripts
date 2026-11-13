// tBUYP — 정범님 11/10: 💰 매입가 기입(어느 탭이든 떠 있는 단추 · 등록 탭에서 고른 상품 → 창 · 총매입가 나눔 · 확정 = 새 매입 기록과 같은 길 · 카드 💰 칸 두 번 누르기)
//   + 안전장치 여덟: ① 두 번 세기 막기(묶인 기록은 그 몫만) ② 나눔 방식(똑같이·정가 비율) ③ 판매가 하한 미리 보기 ④ 구글 시트 맞추기와 안 부딪힘 ⑤ 두 기기(덮을 땐 물음)
//                   ⑥ 다시 바꿈(합계·묶인 기록·매입처 함께 · 예전 값 내역 · ↩) ⑦ 등록 전 매입가 → 등록된 상품으로 옮김 ⑧ 같은 ISBN 여러 권(SKU 다름)은 따로
// (11/10 정범님 손질 buyp2) ⑨ 나눔 기본 = 정가 비율로(정범님 11/13 11:54 바로잡음 — 11/10 똑같이에 동의한 뒤 정가 비율로 바꿨음 · 똑같이는 고를 때만) ⑩ 떠 있는 💰 단추 없음 → 👁 살핀 상품 패널 안 💰 구획·등록 고르기 줄 · 패널·머리 불투명
//   ⑪ 카드 💰 한 번 누름이 카드(펼침·다시 그림·현재 카드·상품 열기)에 닿지 않음 · 두 번 누름에 창 한 번 ⑫ 모든 상품 카드(상품 카드·출고 카드)에 💰 칸 · 팔린 상품 경고
//   ⑬ 진행 중 기록 → 확인 완료(빈 매입가 품목이 있으면 그대로 · 미리 보기 · 끄기) ⑭ 알라딘 주문 자동 기록·묶음 가격 기록은 건너뜀
//  쓰는 법: cd pw && RN_PORT=<포트> node tBUYP.js   (시험 자료는 지어낸 값 — 손님 정보 없음)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.dismiss().catch(() => {}); });
  const ev = (f, a) => p.evaluate(f, a); const wait = (ms) => p.waitForTimeout(ms);
  await ev(() => { const T = []; window.__toasts = T; const t0 = toast; toast = (m, e, ms) => { T.push(String(m)); return t0(m, e, ms); };
    const FS = window.__FS; const now = new Date().toISOString();
    S.app = { ...(S.app || {}), feeRate: 0.1, reg: { ...((S.app || {}).reg || {}), srcX: [{ id: 'xs1', suffix: '_sb', name: '상점B' }] } }; S._supC = null; FS.app_settings = FS.app_settings || {}; FS.app_settings.main = { ...(FS.app_settings.main || {}), reg: { ...((FS.app_settings.main || {}).reg || {}), srcX: [{ id: 'xs1', suffix: '_sb', name: '상점B' }] } };
    const E1 = { source: 'app', sheet: '웹앱 기록', status: 'ordered', plat: '당근', dateTime: '2026-11-01T10:00', date: '2026-11-01', cat: 'book', who: '판매자A', items: [{ k: 0, title: '셋째 책', qty: 1, price: 3000, regId: 'r3' }, { k: 1, title: '다른 책', qty: 2, price: 1000 }], amt: 5000, qty: 3, updatedAt: null };
    FS.pur_entries = { E1: JSON.parse(JSON.stringify(E1)) }; S.pur.entries = [{ ...E1, id: 'E1' }]; S.pur.loaded = true;
    const mk = (id, stage, extra) => ({ id, stage, qty: 1, grade: 2, price: 9000, code: 'ABCDEF' + id, info: { title: '책 ' + id, isbn13: '9788900000001', priceList: 10000 }, createdAt: now, ...(extra || {}) });
    const R = [mk('r1', 'sel', { info: { title: '책 r1', isbn13: '9788900000001', priceList: 20000 } }), mk('r2', 'pick', { code: 'ABCDEFr2', info: { title: '책 r2', isbn13: '9788900000001', priceList: 10000 } }), mk('r3', 'hold', { buy: { entryId: 'E1', k: '0', price: 3000, v: 1, at: now }, buyOn: true, info: { title: '셋째 책' } }), mk('r4', 'done', { source: 'xs1', result: { usedCode: 'U4' }, final: { price: 1500, qty: 1, grade: 2, code: 'XYZ_sb' }, info: { title: '넷째 책' } }), mk('r5', 'sel', { source: 'hd', info: { title: '헌옷 책' } })];
    S.regItems = new Map(R.map((x) => [x.id, x])); FS.reg_items = Object.fromEntries(R.map((x) => [x.id, JSON.parse(JSON.stringify(x))]));
    S.plist = S.plist || new Map(); S.plist.set('L4', { id: 'L4', usedCode: 'U4', title: '넷째 책', qty: 1, price: 1500, active: true, registeredAt: '2026-11-09T10:00' }); S.pmatch = S.pmatch || new Map(); S.pmatchLoaded = true; S.regChk = new Set(); bump(); });

  console.log('— ⑩ 떠 있는 단추 없음');
  for (const t of ['home', 'orders', 'products', 'purchase']) { const r = await ev((t) => { S.tab = t; try { renderTabs(); renderMain(); } catch (e) {} return !!document.getElementById('buyp_fab'); }, t); await wait(120); ok(!r, `탭 ${t}에 왼쪽 아래 💰 단추 없음(등록 카드를 가리지 않음)`); }
  { const r = await ev(() => { buypFromSel(); return { ov: !!document.querySelector('.buyp-ov'), t: __toasts.slice(-1)[0] || '' }; }); ok(!r.ov && /먼저/.test(r.t), '고른 것이 없으면 창 대신 토스트 안내', r); }
  const openSel = async () => { await ev(() => buypFromSel()); await wait(300); };

  console.log('— 창: 나눔·고침·다시 나눔');
  await ev(() => { ['r1', 'r2', 'r3', 'r4', 'r5'].forEach((id) => S.regChk.add(id)); });
  { const r = await ev(() => buypSelSplit()); ok(r.n === 5, '고른 수 5', r); }
  await openSel();
  { const r = await ev(() => ({ rows: document.querySelectorAll('.buyp .brow').length, inp: document.querySelectorAll('.buyp [data-bi]').length, skip: document.querySelector('.buyp .brow.skip') ? document.querySelector('.buyp .brow.skip').innerText : '', bound: [...document.querySelectorAll('.buyp .brow')].map((x) => x.innerText).join(' | '), set: !!document.querySelector('.buyp details[data-bset]:not([open])') })); ok(r.rows === 5 && r.inp === 4, '상품 5줄 · 헌옷도라이 대량 매입 몫은 칸 없음(바꾸지 않음)', r); ok(/헌옷도라이/.test(r.skip), '건너뛰는 까닭 보임', r.skip); ok(/기존 기록 2026-11-01 당근에 묶임/.test(r.bound) && /지금 매입가 3,000/.test(r.bound), '묶인 기록·지금 매입가 표시', r.bound); ok(r.set, '설정은 접힌 채 시작'); }
  { const r = await ev(() => (document.querySelector('.buyp input[name="buyp_how"]:checked') || {}).value); ok(r === 'list', '⑨ 나눔 기본 = 정가 비율로(정범님 11/13 11:54 바로잡음)', r); }
  { const r = await ev(() => { const L = [...document.querySelectorAll('.buyp .btot label')].map((x) => { const i = x.querySelector('input').getBoundingClientRect(), b = x.getBoundingClientRect(); return b.right - i.right; }); return L; }); ok(r.length === 2 && r.every((d) => d < 120), '라디오와 글자가 붙어 있음(떨어져 보이지 않음)', r); }
  await p.check('.buyp input[name="buyp_how"][value="list"]'); await wait(100);
  await p.fill('.buyp [data-btotal]', '10001'); await wait(100);
  const vals = () => ev(() => [...document.querySelectorAll('.buyp [data-bi]')].map((x) => +x.value));
  { const v = await vals(); const c = await p.textContent('.buyp [data-bcalc]'); ok(JSON.stringify(v) === '[3334,1667,2500,2500]' && v.reduce((a, x) => a + x, 0) === 10001, '⑨ 정가 비율 — 2만·1만 정가는 비율대로 · 정가 없는 2개는 똑같이 나눈 몫(⌊10,001÷4⌋ = 2,500) · 합계 = 총액', v); ok(/정가 없는 2개는 똑같이 나눈 몫/.test(c), '셈 식에 정가 없는 상품 보정이 보임', c); }
  await p.check('.buyp input[name="buyp_how"][value="eq"]'); await wait(100);
  { const v = await vals(); const c = await p.textContent('.buyp [data-bcalc]'); ok(JSON.stringify(v) === '[2501,2500,2500,2500]' && v.reduce((a, x) => a + x, 0) === 10001, '똑같이 — 10,001원 ÷ 4 → 앞 상품부터 1원 · 합계 = 총액', v); ok(/나머지 1원/.test(c), '셈 식 한 줄', c); }
  await p.fill('.buyp [data-bi="1"]', '3000'); await wait(100);
  { const v = await vals(); const d = await ev(() => document.querySelector('.buyp [data-bdiff]').dataset.bdiff); ok(v[1] === 3000 && v[0] === 2501, '한 칸을 고치면 그 값 유지', v); ok(d === '500', '총매입가와 차이 +500 보임', d); }
  await p.fill('.buyp [data-btotal]', '8000'); await wait(100);
  { const v = await vals(); ok(JSON.stringify(v) === '[2000,2000,2000,2000]', '총액을 다시 바꾸면 모두 다시 나눔', v); }
  await p.check('.buyp input[name="buyp_how"][value="list"]'); await wait(100);
  { const v = await vals(); ok(v.reduce((a, x) => a + x, 0) === 8000 && v[0] > v[1], '정가 비율 — 합계 8,000 그대로 · 정가 큰 책이 더 큼', v); }
  await p.check('.buyp input[name="buyp_how"][value="eq"]'); await wait(100); await p.fill('.buyp [data-btotal]', '8000'); await wait(100);

  console.log('— 확정 전 경고(두 번 누르기)');
  await p.click('.buyp [data-bok]'); await wait(150);
  { const w = await ev(() => (document.querySelector('.buyp [data-bwarn]') || {}).innerText || ''); const n = await ev(() => Object.keys(__FS.pur_entries).length); ok(/이미 매입가가 정해진 상품 1개/.test(w) && /3,000원? → 2,000/.test(w), '이미 매입가 있는 상품 경고(대상과 바뀌는 값)', w); ok(/합계 5,000원? → 4,000/.test(w), '묶인 기록 합계가 어떻게 바뀌는지', w); ok(/판매가 하한/.test(w) && /바뀌는 상품 0개/.test(w), '판매가 하한 미리 보기', w); ok(/손익분기/.test(w) && /낮은 상품 1개/.test(w), '손익분기보다 지금 판매가가 낮은 상품 수', w); ok(/매입처마다 한 건/.test(w), '매입처가 다르면 매입처마다 한 기록', w); ok(n === 1, '첫 번째 누름은 저장하지 않음', n); ok(/진행 중이던 기록 1건이 확인 완료로 바뀜/.test(w) && !!(await ev(() => (document.querySelector('.buyp [data-btochk]') || {}).checked)), '⑬ 미리 보기 — 진행 중 기록 1건이 확인 완료로(기본 켬)', w); }
  await p.click('.buyp [data-bok]'); await wait(1500);
  const docs = () => ev(() => JSON.parse(JSON.stringify({ E: __FS.pur_entries, R: __FS.reg_items, M: __FS.pur_matches || {}, A: (__FS.app_settings || {}).main || {} })));
  let D = await docs(); const newE = Object.entries(D.E).filter(([k]) => k !== 'E1');
  { ok(!(await ev(() => !!document.querySelector('.buyp-ov'))), '확정 뒤 창 닫힘'); ok(newE.length === 2, '새 매입 기록 2건(일반 1 · 매입처 상점B 1) — 묶인 상품은 새 기록 없음', newE.map(([k, v]) => v.txt));
    const g = newE.find(([, v]) => (v.items || []).length === 2); const s = newE.find(([, v]) => (v.items || []).length === 1);
    const v = g && g[1]; ok(v && v.status === 'checked' && v.source === 'app' && v.sheet === '웹앱 기록' && v.amt === 4000 && v.qty === 2 && v.date && v.txt && v.createdBy && v.history && v.history[0].note === '새 기록', '새 매입 기록과 같은 문서 꼴 · 상태 확인 완료', v);
    ok(v && v.items.every((x) => x.regId && x.sku) && v.items[0].sku !== v.items[1].sku && v.items[0].isbn === v.items[1].isbn, '⑧ 같은 ISBN · SKU 다름 → 품목 따로', v && v.items);
    ok(v && v.pays && v.pays[0] && v.pays[0].m && v.payMethod, '결제 줄 정리도 같은 함수(purPaysApply)', v && v.pays);
    ok(s && ((D.A.reg || {}).srcLine || {})[s[0]] === 'xs1', '매입처 상품 → 그 기록을 매입처 상점B로 확정(후보 → 확정)', (D.A.reg || {}).srcLine);
    ok(D.E.E1.items[0].price === 2000 && D.E.E1.amt === 4000 && /매입가 기입 고침/.test(JSON.stringify(D.E.E1.history)), '① 묶인 기록은 그 몫만 고침(합계 5,000 → 4,000)', D.E.E1);
    ok(D.E.E1.status === 'checked' && D.E.E1.receivedAt && D.E.E1.checkedAt && /주문함 → 확인 완료/.test(JSON.stringify(D.E.E1.history)), '⑬ 진행 중(주문함) 기록 → 확인 완료 · 내역에 남음', { st: D.E.E1.status, h: D.E.E1.history });
    ok(!(await ev(() => pendingList().some((x) => (x.e || {}).id === 'E1'))), '⑬ 진행중 매입 목록에서 빠짐');
    ok(D.R.r1.buy && D.R.r1.buy.entryId === g[0] && D.R.r1.buy.v === 1 && D.R.r1.buyOn, '등록 상품에 묶음(기록·품목·판)', D.R.r1.buy);
    ok(D.R.r3.buy.v === 2 && (D.R.r3.buyHist || []).length === 1 && D.R.r3.buyHist[0].price === 3000, '⑥ 예전 값은 내역으로(지우지 않음)', D.R.r3);
    ok(!D.R.r5.buy, '대량 매입(헌옷도라이) 몫은 그대로', D.R.r5);
    ok(D.M.L4 && D.M.L4.kind === 'manual' && D.M.L4.itemKey === `${s[0]}#0` && D.M.L4.cost === 2000, '등록된 상품(확정 탭)은 상품 매입 연결(사람 연결)로 바로', D.M.L4);
    const bt = await ev(() => { const X = purStats(); return { ok: !!X }; }); ok(bt.ok, '매입 합계 다시 셈'); }
  { const r = await ev((id) => { matchAladinOrders(); const e = S.pur.entries.find((x) => x.id === id); return { st: e && e.status, pend: pendingList().some((x) => (x.e || {}).id === id), af: e && e.source }; }, newE[0][0]); ok(r.st === 'checked' && !r.pend, '④ 구글 시트·알라딘 맞추기 뒤에도 확인 완료 그대로 · 진행중 매입에 없음', r); }

  console.log('— 카드 💰 칸 · 두 번 누르기');
  { const r = await ev(() => { const it = S.regItems.get('r3'); const a = regCardX('<div class="card x"><div class="rgttl">t</div><div class="rgpbar"></div></div>', it); const b = regRowX('<div class="rgrow"><span class="rgr-mt">x</span><span class="rgr-s">s</span></div>', it, 1); const c = regCardX('<div class="card x"><div class="rgttl">t</div></div>', S.regItems.get('r4')); return { a: /data-buypc="r3"/.test(a) && /2,000/.test(a), b: /data-buypc="r3"/.test(b), c: /data-buypc="r4"/.test(c), none: /매입가 —/.test(regCardX('<div class="card"><div class="rgttl">t</div></div>', { id: 'z', stage: 'sel', info: {} })) }; }); ok(r.a && r.b && r.c && r.none, '자세히·한눈에·확정 카드 모두 매입가만 표시(없으면 —)', r); }
  await ev(() => { const d = document.createElement('div'); d.id = 'tcards'; d.style.cssText = 'position:fixed;top:60px;left:200px;z-index:2147482000;background:#fff'; d.innerHTML = buypChip(S.regItems.get('r3')) + ' ' + buypChip(S.regItems.get('r1')); document.body.appendChild(d); });
  await p.dblclick('#tcards [data-buypc="r3"]'); await wait(300);
  { const r = await ev(() => ({ ov: !!document.querySelector('.buyp-ov'), open: !!document.querySelector('.buyp details[data-bset][open]'), plat: (document.querySelector('.buyp [data-bs="plat"]') || {}).value, who: (document.querySelector('.buyp [data-bs="who"]') || {}).value, v: (document.querySelector('.buyp [data-bi]') || {}).value, hist: !!document.querySelector('.buyp [data-bh]') })); ok(r.ov && r.open && r.plat === '당근' && r.who === '판매자A' && r.v === '2000', '두 번 누르면 그 상품 창 — 설정 펼침 · 묶인 기록의 설정 그대로', r); ok(r.hist, '예전 값 ↩ 단추'); }
  await p.selectOption('.buyp [data-bs="plat"]', '번개장터'); await p.click('.buyp [data-bh="0"]'); await wait(100);
  { const v = await ev(() => document.querySelector('.buyp [data-bi]').value); ok(v === '3000', '↩ 누르면 예전 값 3,000이 칸에', v); }
  await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(1200); D = await docs();
  ok(D.E.E1.items[0].price === 3000 && D.E.E1.plat === '번개장터' && D.R.r3.buy.v === 3 && D.R.r3.buyHist.length === 2, '⑥ 개별로 다시 바꿈(되돌리기) · 묶인 기록 설정도 고침', { e: D.E.E1, r: D.R.r3.buy });
  ok(Object.keys(D.E).length === 3, '다시 바꿔도 새 기록 없음', Object.keys(D.E));

  console.log('— 일괄로 다시 바꿈');
  await ev(() => { S.regChk = new Set(['r1', 'r2']); }); await openSel(); await p.check('.buyp input[name="buyp_how"][value="eq"]');
  { const t = await ev(() => [...document.querySelectorAll('.buyp .brow')].map((x) => x.innerText).join(' | ')); ok((t.match(/기존 기록/g) || []).length === 2, '확정된 상품은 그 기록에 묶임으로 보임', t); }
  await p.fill('.buyp [data-btotal]', '5001'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(1200); D = await docs();
  { const g = Object.entries(D.E).find(([k, v]) => k !== 'E1' && (v.items || []).length === 2); ok(Object.keys(D.E).length === 3 && g && g[1].amt === 5001 && g[1].items[0].price === 2501 && g[1].items[1].price === 2500, '일괄로 다시 바꿈 — 같은 기록 합계 5,001', g && g[1]); ok(D.R.r1.buy.v === 2 && D.R.r1.buyHist.length === 1, '일괄도 내역 남김', D.R.r1); }

  console.log('— ⑤ 두 기기');
  await ev(() => { __FS.reg_items.r2.buy = { ...__FS.reg_items.r2.buy, v: 9, price: 7777, by: '다른기기' }; });
  await p.dblclick('#tcards [data-buypc="r1"]'); await wait(200); await ev(() => document.querySelector('.buyp-ov').remove());
  await ev(() => { const d = document.getElementById('tcards'); d.innerHTML += buypChip(S.regItems.get('r2')); }); await p.dblclick('#tcards [data-buypc="r2"]'); await wait(300);
  await p.fill('.buyp [data-bi="0"]', '1234'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(600);
  /* (1.78.471 🔬 정밀 점검 11/10) 예전엔 '덮기' 물음 → 덮기를 고르면 묶임을 다시 셈하지 않아 같은 상품 매입 기록이 하나 더 생겼음 → 이제 충돌이면 저장하지 않고 토스트로 알리고, 창을 다시 열면 최신 값으로 보임 */
  { const r = await ev(() => ({ toast: (document.querySelector('#toast') || {}).textContent || '', ask: !!document.querySelector('.askbox'), E: Object.keys(__FS.pur_entries || {}).length })); ok(/다른 기기/.test(r.toast) && /7,777/.test(r.toast) && !r.ask, '다른 기기가 먼저 바꿨으면 저장하지 않고 알림(물음·덮기 없음)', r); }
  await wait(300); D = await docs(); ok(D.R.r2.buy.price === 7777 && Object.keys(D.E).length === 3, '충돌이면 다른 기기 값 그대로 · 새 매입 기록도 생기지 않음(매입 원가 두 번 셈 0)', { buy: D.R.r2.buy, E: Object.keys(D.E).length });
  await ev(() => { const o = document.querySelector('.buyp-ov'); if (o) o.remove(); const it = S.regItems.get('r2'); it.buy = { ...__FS.reg_items.r2.buy }; /* 실제론 reg_items 실시간 구독(regWatch)이 다른 기기 값을 가져옴 — 가짜 Firestore엔 구독이 없어 흉내 */ }); await p.dblclick('#tcards [data-buypc="r2"]'); await wait(300); await p.fill('.buyp [data-bi="0"]', '1234'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(1200); D = await docs(); ok(D.R.r2.buy.price === 1234 && D.R.r2.buy.v === 10 && D.R.r2.buyHist.some((h) => h.price === 7777), '창을 다시 열어 확정하면 저장 · 다른 기기 값은 내역에', D.R.r2);

  console.log('— ⑦ 등록 전 매입가 → 등록된 상품으로');
  { const r = await ev(async () => { const it = S.regItems.get('r1'); it.result = { usedCode: 'U1' }; S.plist.set('L1', { id: 'L1', usedCode: 'U1', title: '책 r1', qty: 1, price: 9000, active: true }); S._buypSyncing = false; const n = await buypSyncListings(); const m = S.pmatch.get('L1'); return { n, m, w: (__FS.pur_matches || {}).L1 }; }); ok(r.n >= 1 && r.m && r.m.kind === 'manual' && r.m.itemKey === `${r.m.entryId}#0` && r.m.cost === 2501 && r.w, '등록되면 그 상품 매입 연결로 저절로', r); }
  { const r = await ev(async () => { S._buypSyncing = false; return await buypSyncListings(); }); ok(r === 0, '이미 옮긴 것은 다시 쓰지 않음', r); }


  console.log('— ⑬ 진행 중 기록 → 확인 완료 규칙 · ⑭ 건너뛰는 기록');
  await ev(() => { const FS = window.__FS; const now = new Date().toISOString(); const base = { source: 'app', sheet: '웹앱 기록', plat: '당근', dateTime: '2026-11-02T10:00', date: '2026-11-02', cat: 'book', who: '판매자B', updatedAt: null };
    const E = { E2: { ...base, status: 'shipping', items: [{ k: 0, title: '여섯째 책', qty: 1, price: 1000, regId: 'r6' }, { k: 1, title: '값 없는 책', qty: 1, price: null }], amt: 1000, qty: 2 },
      E3: { ...base, status: 'ordered', items: [{ k: 0, title: '일곱째 책', qty: 1, price: 500, regId: 'r7' }], amt: 500, qty: 1 },
      E4: { ...base, plat: '알라딘', status: 'ordered', autoFrom: 'aladin_order', aladinOrderNo: '1', items: [{ k: 0, title: '여덟째 책', qty: 1, price: 800 }], amt: 800, qty: 1 },
      E5: { ...base, status: 'checked', lump: true, lumpTotal: 3000, items: [{ k: 0, title: '아홉째 책', qty: 1, price: '' }], amt: 3000, qty: 1 } };
    for (const [k, v] of Object.entries(E)) { FS.pur_entries[k] = JSON.parse(JSON.stringify(v)); S.pur.entries.push({ ...v, id: k }); }
    const mk = (id, eid, price) => ({ id, stage: 'pick', qty: 1, grade: 2, price: 9000, code: 'GHIJK' + id, info: { title: '책 ' + id, isbn13: '9788900000002', priceList: 10000 }, createdAt: now, buy: { entryId: eid, k: '0', price, v: 1, at: now }, buyOn: true });
    [mk('r6', 'E2', 1000), mk('r7', 'E3', 500), mk('r8', 'E4', 800), mk('r9', 'E5', null)].forEach((x) => { S.regItems.set(x.id, x); FS.reg_items[x.id] = JSON.parse(JSON.stringify(x)); });
    document.getElementById('tcards').innerHTML = ['r6', 'r7'].map((id) => buypChip(S.regItems.get(id))).join(' '); });
  { const r = await ev(() => ['r8', 'r9'].map((id) => { const B = buypBound(S.regItems.get(id)); return { k: B && B.kind, why: B && B.why }; })); ok(r[0].k === 'other' && /알라딘 주문/.test(r[0].why), '⑭ 알라딘 주문 자동 기록 몫은 바꾸지 않음(까닭)', r[0]); ok(r[1].k === 'other' && /묶음 가격/.test(r[1].why), '⑭ 묶음 가격 기록 몫도 바꾸지 않음(합계에 안 들어가 두 번 셈·안 바뀜 막기)', r[1]); }
  await p.dblclick('#tcards [data-buypc="r6"]'); await wait(300); await p.fill('.buyp [data-bi="0"]', '1200'); await p.click('.buyp [data-bok]'); await wait(150);
  { const w = await ev(() => (document.querySelector('.buyp [data-bwarn]') || {}).innerText || ''); ok(/상태 그대로 1건/.test(w) && /매입가가 빈 품목 1개\(값 없는 책\)/.test(w) && !/확인 완료로 바뀜/.test(w), '⑬ 빈 매입가 품목이 남은 기록은 상태 그대로 — 까닭 미리 보기', w); }
  await p.click('.buyp [data-bok]'); await wait(1200); D = await docs(); ok(D.E.E2.status === 'shipping' && D.E.E2.items[0].price === 1200 && D.E.E2.amt === 1200, '⑬ 값은 고치고 상태는 배송 중 그대로', { st: D.E.E2.status, it: D.E.E2.items });
  await p.dblclick('#tcards [data-buypc="r7"]'); await wait(300); await p.fill('.buyp [data-bi="0"]', '600'); await p.click('.buyp [data-bok]'); await wait(150);
  { const w = await ev(() => (document.querySelector('.buyp [data-bwarn]') || {}).innerText || ''); ok(/진행 중이던 기록 1건이 확인 완료로 바뀜/.test(w), '⑬ 빈 품목 없는 진행 중 기록 — 확인 완료 미리 보기', w); }
  await p.uncheck('.buyp [data-btochk]'); await p.click('.buyp [data-bok]'); await wait(1200); D = await docs(); ok(D.E.E3.status === 'ordered' && D.E.E3.items[0].price === 600, '⑬ 미리 보기에서 끄면 상태 그대로(주문함)', { st: D.E.E3.status });
  { const t = await ev(() => __toasts.slice(-1)[0] || ''); ok(/상태 그대로 1건\(창에서 끔\)/.test(t), '끝 알림에 상태 그대로인 까닭', t); }

  console.log('— ⑫ 모든 상품 카드의 💰 칸');
  await ev(() => { S.plist.set('L9', { id: 'L9', usedCode: 'U9', listingId: '9009', title: '아홉째 상품', qty: 1, price: 7000, active: true, isbn13: '9788900000009', priceList: 12000, sku: 'SKU9', grade: '상', registeredAt: '2026-11-01T10:00' }); S.pmatch.delete('L9'); S._buypRmap = null;
    window.__pick = []; window.__opened = 0; window.__purAny = []; pickItemFor = (id) => window.__pick.push(id); openPurAny = (id) => window.__purAny.push(id);
    let h = ''; try { h = prodCard2(S.plist.get('L9')); } catch (e) { h = '<div class="item prow2" data-pid="L9">' + buypChipL(S.plist.get('L9')) + '</div>'; } const d = document.createElement('div'); d.id = 'tprod'; d.style.cssText = 'position:fixed;top:220px;left:200px;width:700px;z-index:2147482000;background:#fff'; d.innerHTML = h; document.body.appendChild(d);
    d.querySelectorAll('[data-pid]').forEach((b) => (b.onclick = () => window.__opened++)); });
  { const r = await ev(() => { const c = document.querySelector('#tprod [data-buypl="L9"]'); return { has: !!c, t: c && c.innerText, card: !!document.querySelector('#tprod .prow2'), old: !!document.querySelector('#tprod [data-plink],#tprod [data-pmrec]') }; }); ok(r.has && /💰 매입가 —/.test(r.t) && r.card && !r.old, '상품 카드(prodCard2)에 💰 칸 — 예전 매입 칩 자리 하나(칩이 늘지 않음)', r); }
  await p.click('#tprod [data-buypl="L9"]'); await wait(500);
  { const r = await ev(() => ({ pick: __pick.slice(), opened: __opened, ov: !!document.querySelector('.buyp-ov') })); ok(r.pick.join() === 'L9' && r.opened === 0 && !r.ov, '한 번 누름 = 예전처럼 매입 품목 연결(0.33초 뒤) · 카드(상품 열기)에는 닿지 않음', r); }
  await p.dblclick('#tprod [data-buypl="L9"]'); await wait(400);
  { const r = await ev(() => ({ ov: document.querySelectorAll('.buyp-ov').length, rows: [...document.querySelectorAll('.buyp .brow')].map((x) => x.innerText).join('|'), pick: __pick.length, opened: __opened })); ok(r.ov === 1 && /아홉째 상품/.test(r.rows) && /상품\(등록 기록 없음\)/.test(r.rows) && r.pick === 1 && r.opened === 0, '두 번 누름 = 그 상품 하나로 창(한 번만) · 한 번 누름 동작은 일어나지 않음', r); }
  await p.fill('.buyp [data-bi="0"]', '1500'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(1300); D = await docs();
  { const e = Object.entries(D.E).find(([, v]) => (v.items || []).some((x) => x.title === '아홉째 상품')); ok(e && e[1].status === 'checked' && e[1].amt === 1500 && !e[1].items[0].regId, '등록 기록 없는 상품 → 새 매입 기록(확인 완료 · 등록 상품 묶음 없음)', e && e[1]); ok(D.M.L9 && D.M.L9.kind === 'manual' && D.M.L9.cost === 1500 && e && D.M.L9.entryId === e[0], '그 상품 매입 연결(pur_matches)에 바로', D.M.L9); ok(!Object.keys(D.R).some((k) => k.startsWith('L:')), '가짜 등록 상품(L:…)은 저장하지 않음', Object.keys(D.R)); }
  await ev(() => { document.getElementById('tprod').innerHTML = buypChipL(S.plist.get('L9')); });
  { const t = await p.textContent('#tprod [data-buypl]'); ok(/매입 1,500원/.test(t), '카드 💰 칸에 새 매입가', t); }
  await p.click('#tprod [data-buypl="L9"]'); await wait(500); { const r = await ev(() => __purAny.slice()); ok(r.length === 1, '연결된 뒤 한 번 누름 = 그 매입 거래(예전과 같음)', r); }
  await ev(() => { S.plist.get('L9').soldBy = '손님A'; }); await p.dblclick('#tprod [data-buypl="L9"]'); await wait(300);
  { const r = await ev(() => ({ rows: document.querySelector('.buyp .brow').innerText, v: document.querySelector('.buyp [data-bi]').value })); ok(/이미 팔림/.test(r.rows) && r.v === '1500', '팔린 상품 — 줄에 표시 · 지금 값으로 시작', r); }
  await p.fill('.buyp [data-bi="0"]', '1700'); await p.click('.buyp [data-bok]'); await wait(150);
  { const w = await ev(() => (document.querySelector('.buyp [data-bwarn]') || {}).innerText || ''); ok(/이미 팔린·출고된 상품 1개/.test(w) && /이익/.test(w) && /1,500원? → 1,700/.test(w), '⑫ 팔린·출고된 상품은 이익이 바뀐다는 경고', w); }
  await p.click('.buyp [data-bok]'); await wait(1200); D = await docs(); { const n = Object.values(D.E).filter((v) => (v.items || []).some((x) => x.title === '아홉째 상품')).length; ok(D.M.L9.cost === 1700 && n === 1, '다시 바꿈 — 같은 기록 고침(새 기록 없음)', { c: D.M.L9.cost, n }); }
  { const r = await ev(() => { const it = buypItOf('L:L4'); return it && it.id; }); ok(r === 'r4', '등록 기록이 있는 상품(같은 상품 코드)은 그 등록 상품으로 엶 — 묶음·내역 한 곳', r); }
  await ev(() => { document.getElementById('tprod').innerHTML = buypChipL(S.plist.get('L9'), { hint: 1 }); window.__purAny = []; window.__toasts.length = 0; S._buypHintAt = 0; });
  { const h = await ev(() => document.getElementById('tprod').innerHTML); ok(!/data-buyp1/.test(h), '출고 카드용 💰 칸 — 한 번 누름 동작 없음(출고 화면을 떠나지 않음)', h); }
  await p.click('#tprod [data-buypl]'); await wait(500); { const r = await ev(() => ({ a: __purAny.length, t: __toasts.join('|') })); ok(r.a === 0 && /두 번 누르면/.test(r.t), '출고 카드 한 번 누름 = 안내만', r); }
  await ev(() => { document.getElementById('tprod').remove(); });

  console.log('— ⑪ 등록 카드 💰 한 번 누름 글리치 · ⑩ 살핀 상품 패널 💰 구획');
  await ev(() => { const t = document.getElementById('tcards'); if (t) t.style.display = 'none'; });
  await ev(async () => { const FS = window.__FS; const now = new Date().toISOString(); for (let i = 0; i < 5; i++) { const x = { stage: 'sel', isbn: '978891000010' + i, q: '978891000010' + i, method: 'bulk', grade: 2, qty: 1, price: 5000 + i * 100, createdAt: now, info: { title: '글리치 시험 책 ' + i, isbn13: '978891000010' + i, priceList: 15000, priceSales: 13500, page1: [], categories: ['국내도서'], at: now } }; FS.reg_items['g' + i] = JSON.parse(JSON.stringify(x)); S.regItems.set('g' + i, { ...x, id: 'g' + i }); }
    S.regChk = new Set(); window.__rr = 0; const o = regRerender; regRerender = function () { window.__rr++; return o.apply(this, arguments); }; window.__bo = 0; const ob = buypOpen; buypOpen = function () { window.__bo++; return ob.apply(this, arguments); };
    localStorage.setItem('rn-reg-view', 'compact'); S.regT = 'sel'; openRegister(); await new Promise((r) => setTimeout(r, 1800)); });
  const snap = () => ev(() => ({ rr: __rr, open: [...(S._regOpen || [])].join(), cur: S._regCur || '', y: Math.round(document.getElementById('sheet').scrollTop), ov: document.querySelectorAll('.buyp-ov').length, bo: __bo }));
  for (const view of ['compact', 'full']) {
    await ev((v) => { localStorage.setItem('rn-reg-view', v); S._regOpen = new Set(); regRerender(); }, view); await wait(700);
    await ev(() => { const L = [...document.querySelectorAll('#sheet [data-buypc]')].filter((c) => c.offsetParent && !(S._regCur && c.dataset.buypc === S._regCur)); const c = L[1] || L[0]; if (c) c.scrollIntoView({ block: 'center' }); }); await wait(500);
    const pt = await ev(() => { for (const c of document.querySelectorAll('#sheet [data-buypc]')) { const r = c.getBoundingClientRect(); if (!r.width) continue; const x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); if (t && t.closest('[data-buypc]') === c && !(S._regCur && c.dataset.buypc === S._regCur)) return { x, y, id: c.dataset.buypc }; } return null; }); /* 위에 덮인 것이 없는 칸을 그 자리에서 바로 누름(도구가 다시 스크롤하지 않게) */
    ok(!!pt, `${view === 'compact' ? '📋 한눈에' : '🔎 자세히'} — 카드에 💰 칸`, pt); if (!pt) continue;
    const a0 = await snap(); await p.mouse.click(pt.x, pt.y); await wait(700); const a1 = await snap();
    ok(a1.rr === a0.rr && a1.open === a0.open && a1.cur === a0.cur && Math.abs(a1.y - a0.y) < 2 && !a1.ov, `${view} — 한 번 누름: 다시 그림·펼침·현재 카드 옮김·스크롤 없음`, { a0, a1 });
    await p.mouse.dblclick(pt.x, pt.y); await wait(600); const a2 = await snap();
    ok(a2.ov === 1 && a2.bo - a1.bo === 1 && a2.open === a0.open && Math.abs(a2.y - a0.y) < 2, `${view} — 두 번 누름: 창 한 번만 · 카드는 그대로`, { a0, a2 });
    await p.keyboard.press('Escape'); await wait(200); }
  { const r = await ev(() => { const el = document.getElementById('seenp'); const b = el && el.querySelector('[data-spbuyp]'); const h = el && el.querySelector('.seenp-h'); const bt = b && b.querySelector('[data-sp="buyp"]'); const dis = [...el.querySelectorAll('button:disabled')]; return { has: !!b, txt: b ? b.innerText : '', bt: bt && bt.disabled, op: el && getComputedStyle(el).opacity, bg: el && getComputedStyle(el).backgroundColor, hbg: h && getComputedStyle(h).backgroundColor, dop: dis.map((x) => getComputedStyle(x).opacity), sep: b && getComputedStyle(b).borderTopStyle }; });
    ok(r.has && /💰 매입가 기입/.test(r.txt) && /고른 상품 0개/.test(r.txt) && /살핀 상품과 따로/.test(r.txt) && r.sep === 'solid', '⑩ 살핀 상품 패널 안에 💰 매입가 기입 구획(구분선·작은 제목·고른 수)', r); ok(r.bt === true, '고른 것이 없으면 단추 꺼짐', r.bt);
    ok(r.op === '1' && r.bg === 'rgb(255, 255, 255)' && r.hbg === 'rgb(47, 93, 80)' && r.dop.every((x) => x === '1'), '⑩ 패널·머리 불투명 · 꺼진 단추도 비치지 않음', r); }
  await ev(() => { S.regChk = new Set(['g0', 'g1']); regRerender(); }); await wait(600); await ev(() => document.body.click()); await wait(100);
  { const r = await ev(() => { const b = document.querySelector('#seenp [data-spbuyp]'); const bar = document.querySelector('#sheet [data-buypsel]'); return { txt: b && b.innerText, dis: b && b.querySelector('[data-sp="buyp"]').disabled, bar: bar && bar.innerText }; }); ok(/고른 상품 2개/.test(r.txt) && r.dis === false && /고른2개매입가기입/.test(String(r.bar || '').replace(/\s+/g, '')), '고르면 패널 구획·등록 고르기 줄에 💰 고른 2개', r); }
  await p.click('#seenp [data-sp="buyp"]'); await wait(400);
  { const r = await ev(() => document.querySelectorAll('.buyp .brow').length); ok(r === 2, '패널의 💰 단추 → 고른 2개 창', r); } await p.keyboard.press('Escape'); await wait(200);
  await p.click('#sheet [data-buypsel]'); await wait(400); { const r = await ev(() => document.querySelectorAll('.buyp .brow').length); ok(r === 2, '고르기 줄의 💰 단추 → 같은 창', r); } await p.keyboard.press('Escape'); await wait(200);
  await ev(() => { S.regT = 'done'; regRerender(); }); await wait(700);
  { const r = await ev(() => { const el = document.getElementById('seenp'); return { disp: el && getComputedStyle(el).display, only: el && el.classList.contains('only-buyp'), txt: el && el.innerText }; }); ok(r.disp !== 'none' && r.only && /💰 매입가 기입/.test(r.txt) && !/살핀 것/.test(r.txt), '살핀 상품 일괄이 없는 탭(확정)에서도 💰 구획만으로 패널', r); }
  await ev(() => { S.regChk = new Set(); history.back(); }); await wait(900);
  console.log('— 닫기·휴대폰');
  for (const how of ['esc', 'out', 'x']) { await ev(() => { S.regChk = new Set(['r1']); }); await openSel(); if (how === 'esc') await p.keyboard.press('Escape'); else if (how === 'out') await p.mouse.click(3, 3); else await p.click('.buyp .x'); await wait(150); ok(!(await ev(() => !!document.querySelector('.buyp-ov'))), `닫기 — ${how}`); }
  await p.setViewportSize({ width: 390, height: 800 }); await ev(() => { S.regChk = new Set(['r1', 'r2', 'r4']); }); await openSel();
  { const r = await ev(() => { const b = document.querySelector('.buyp'); const R = b.getBoundingClientRect(); const i = document.querySelector('.buyp [data-bi]').getBoundingClientRect(); return { w: R.width, over: document.documentElement.scrollWidth > innerWidth + 1, inW: i.width }; }); ok(r.w <= 390 && !r.over && r.inW >= 80, '휴대폰 폭 — 창이 화면 안 · 칸 넉넉', r); }
  await p.keyboard.press('Escape');
  ok(dialogs === 0, '브라우저 팝업(alert·confirm·prompt) 없음', dialogs);
  console.log(bad ? `✗ tBUYP 실패 ${bad}` : '✓ tBUYP 모두 통과');
});
