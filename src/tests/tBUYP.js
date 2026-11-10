// tBUYP — 정범님 11/10: 💰 매입가 기입(어느 탭이든 떠 있는 단추 · 등록 탭에서 고른 상품 → 창 · 총매입가 나눔 · 확정 = 새 매입 기록과 같은 길 · 카드 💰 칸 두 번 누르기)
//   + 안전장치 여덟: ① 두 번 세기 막기(묶인 기록은 그 몫만) ② 나눔 방식(똑같이·정가 비율) ③ 판매가 하한 미리 보기 ④ 구글 시트 맞추기와 안 부딪힘 ⑤ 두 기기(덮을 땐 물음)
//                   ⑥ 다시 바꿈(합계·묶인 기록·매입처 함께 · 예전 값 내역 · ↩) ⑦ 등록 전 매입가 → 등록된 상품으로 옮김 ⑧ 같은 ISBN 여러 권(SKU 다름)은 따로
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

  console.log('— 단추: 모든 탭'); for (const t of ['home', 'orders', 'products', 'purchase', 'customers', 'settings']) { const r = await ev((t) => { S.tab = t; try { renderTabs(); renderMain(); } catch (e) {} const b = document.getElementById('buyp_fab'); if (!b) return null; const c = b.getBoundingClientRect(); const top = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); return { vis: c.width > 0 && getComputedStyle(b).display !== 'none', top: !!(top && top.closest('#buyp_fab')) }; }, t); await wait(150); ok(r && r.vis && r.top, `탭 ${t}에서 💰 단추가 보이고 눌림`, r); }
  { const r = await ev(() => { S.detail = { reg: 1 }; const sh = document.getElementById('sheet'); sh.classList.add('on'); const b = document.getElementById('buyp_fab'); const c = b.getBoundingClientRect(); const top = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); const o = !!(top && top.closest('#buyp_fab')); sh.classList.remove('on'); S.detail = null; return o; }); ok(r, '등록 창(시트)이 열려 있어도 단추가 위에 있음'); }
  { await p.click('#buyp_fab'); await wait(200); const r = await ev(() => ({ ov: !!document.querySelector('.buyp-ov'), t: __toasts.slice(-1)[0] || '' })); ok(!r.ov && /먼저/.test(r.t), '고른 것이 없으면 창 대신 토스트 안내', r); }

  console.log('— 창: 나눔·고침·다시 나눔');
  await ev(() => { ['r1', 'r2', 'r3', 'r4', 'r5'].forEach((id) => S.regChk.add(id)); buypFabTick(); });
  { const n = await p.textContent('#buyp_fab .n'); ok(n === '5', '단추에 고른 수 5', n); }
  await p.click('#buyp_fab'); await wait(300);
  { const r = await ev(() => ({ rows: document.querySelectorAll('.buyp .brow').length, inp: document.querySelectorAll('.buyp [data-bi]').length, skip: document.querySelector('.buyp .brow.skip') ? document.querySelector('.buyp .brow.skip').innerText : '', bound: [...document.querySelectorAll('.buyp .brow')].map((x) => x.innerText).join(' | '), set: !!document.querySelector('.buyp details[data-bset]:not([open])') })); ok(r.rows === 5 && r.inp === 4, '상품 5줄 · 헌옷도라이 대량 매입 몫은 칸 없음(바꾸지 않음)', r); ok(/헌옷도라이/.test(r.skip), '건너뛰는 까닭 보임', r.skip); ok(/기존 기록 2026-11-01 당근에 묶임/.test(r.bound) && /지금 매입가 3,000/.test(r.bound), '묶인 기록·지금 매입가 표시', r.bound); ok(r.set, '설정은 접힌 채 시작'); }
  await p.fill('.buyp [data-btotal]', '10001'); await wait(100);
  const vals = () => ev(() => [...document.querySelectorAll('.buyp [data-bi]')].map((x) => +x.value));
  { const v = await vals(); const c = await p.textContent('.buyp [data-bcalc]'); ok(JSON.stringify(v) === '[2501,2500,2500,2500]' && v.reduce((a, x) => a + x, 0) === 10001, '10,001원 ÷ 4 → 앞 상품부터 1원 · 합계 = 총액', v); ok(/나머지 1원/.test(c), '셈 식 한 줄', c); }
  await p.fill('.buyp [data-bi="1"]', '3000'); await wait(100);
  { const v = await vals(); const d = await ev(() => document.querySelector('.buyp [data-bdiff]').dataset.bdiff); ok(v[1] === 3000 && v[0] === 2501, '한 칸을 고치면 그 값 유지', v); ok(d === '500', '총매입가와 차이 +500 보임', d); }
  await p.fill('.buyp [data-btotal]', '8000'); await wait(100);
  { const v = await vals(); ok(JSON.stringify(v) === '[2000,2000,2000,2000]', '총액을 다시 바꾸면 모두 다시 나눔', v); }
  await p.check('.buyp input[name="buyp_how"][value="list"]'); await wait(100);
  { const v = await vals(); ok(v.reduce((a, x) => a + x, 0) === 8000 && v[0] > v[1], '정가 비율 — 합계 8,000 그대로 · 정가 큰 책이 더 큼', v); }
  await p.check('.buyp input[name="buyp_how"][value="eq"]'); await wait(100); await p.fill('.buyp [data-btotal]', '8000'); await wait(100);

  console.log('— 확정 전 경고(두 번 누르기)');
  await p.click('.buyp [data-bok]'); await wait(150);
  { const w = await ev(() => (document.querySelector('.buyp [data-bwarn]') || {}).innerText || ''); const n = await ev(() => Object.keys(__FS.pur_entries).length); ok(/이미 매입가가 정해진 상품 1개/.test(w) && /3,000원? → 2,000/.test(w), '이미 매입가 있는 상품 경고(대상과 바뀌는 값)', w); ok(/합계 5,000원? → 4,000/.test(w), '묶인 기록 합계가 어떻게 바뀌는지', w); ok(/판매가 하한/.test(w) && /바뀌는 상품 0개/.test(w), '판매가 하한 미리 보기', w); ok(/손익분기/.test(w) && /낮은 상품 1개/.test(w), '손익분기보다 지금 판매가가 낮은 상품 수', w); ok(/매입처마다 한 건/.test(w), '매입처가 다르면 매입처마다 한 기록', w); ok(n === 1, '첫 번째 누름은 저장하지 않음', n); }
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
  await ev(() => { S.regChk = new Set(['r1', 'r2']); }); await p.click('#buyp_fab'); await wait(300);
  { const t = await ev(() => [...document.querySelectorAll('.buyp .brow')].map((x) => x.innerText).join(' | ')); ok((t.match(/기존 기록/g) || []).length === 2, '확정된 상품은 그 기록에 묶임으로 보임', t); }
  await p.fill('.buyp [data-btotal]', '5001'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(1200); D = await docs();
  { const g = Object.entries(D.E).find(([k, v]) => k !== 'E1' && (v.items || []).length === 2); ok(Object.keys(D.E).length === 3 && g && g[1].amt === 5001 && g[1].items[0].price === 2501 && g[1].items[1].price === 2500, '일괄로 다시 바꿈 — 같은 기록 합계 5,001', g && g[1]); ok(D.R.r1.buy.v === 2 && D.R.r1.buyHist.length === 1, '일괄도 내역 남김', D.R.r1); }

  console.log('— ⑤ 두 기기');
  await ev(() => { __FS.reg_items.r2.buy = { ...__FS.reg_items.r2.buy, v: 9, price: 7777, by: '다른기기' }; });
  await p.dblclick('#tcards [data-buypc="r1"]'); await wait(200); await ev(() => document.querySelector('.buyp-ov').remove());
  await ev(() => { const d = document.getElementById('tcards'); d.innerHTML += buypChip(S.regItems.get('r2')); }); await p.dblclick('#tcards [data-buypc="r2"]'); await wait(300);
  await p.fill('.buyp [data-bi="0"]', '1234'); await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(600);
  { const r = await ev(() => ({ ask: (document.querySelector('.askbox') || {}).innerText || '' })); ok(/다른 기기/.test(r.ask) && /7,777/.test(r.ask), '다른 기기가 먼저 바꿨으면 몰래 덮지 않고 물음', r); }
  await p.click('.askbox .ask-no'); await wait(500); D = await docs(); ok(D.R.r2.buy.price === 7777, '그만두기 → 다른 기기 값 그대로', D.R.r2.buy);
  await p.click('.buyp [data-bok]'); await wait(100); await p.click('.buyp [data-bok]'); await wait(600); await p.click('.askbox .ask-ok'); await wait(1200); D = await docs(); ok(D.R.r2.buy.price === 1234 && D.R.r2.buy.v === 10 && D.R.r2.buyHist.some((h) => h.price === 7777), '덮기를 고르면 저장 · 다른 기기 값은 내역에', D.R.r2);

  console.log('— ⑦ 등록 전 매입가 → 등록된 상품으로');
  { const r = await ev(async () => { const it = S.regItems.get('r1'); it.result = { usedCode: 'U1' }; S.plist.set('L1', { id: 'L1', usedCode: 'U1', title: '책 r1', qty: 1, price: 9000, active: true }); S._buypSyncing = false; const n = await buypSyncListings(); const m = S.pmatch.get('L1'); return { n, m, w: (__FS.pur_matches || {}).L1 }; }); ok(r.n >= 1 && r.m && r.m.kind === 'manual' && r.m.itemKey === `${r.m.entryId}#0` && r.m.cost === 2501 && r.w, '등록되면 그 상품 매입 연결로 저절로', r); }
  { const r = await ev(async () => { S._buypSyncing = false; return await buypSyncListings(); }); ok(r === 0, '이미 옮긴 것은 다시 쓰지 않음', r); }

  console.log('— 닫기·휴대폰');
  for (const how of ['esc', 'out', 'x']) { await ev(() => { S.regChk = new Set(['r1']); }); await p.click('#buyp_fab'); await wait(200); if (how === 'esc') await p.keyboard.press('Escape'); else if (how === 'out') await p.mouse.click(3, 3); else await p.click('.buyp .x'); await wait(150); ok(!(await ev(() => !!document.querySelector('.buyp-ov'))), `닫기 — ${how}`); }
  await p.setViewportSize({ width: 390, height: 800 }); await ev(() => { S.regChk = new Set(['r1', 'r2', 'r4']); }); await p.click('#buyp_fab'); await wait(300);
  { const r = await ev(() => { const b = document.querySelector('.buyp'); const R = b.getBoundingClientRect(); const i = document.querySelector('.buyp [data-bi]').getBoundingClientRect(); return { w: R.width, over: document.documentElement.scrollWidth > innerWidth + 1, inW: i.width }; }); ok(r.w <= 390 && !r.over && r.inW >= 80, '휴대폰 폭 — 창이 화면 안 · 칸 넉넉', r); }
  await p.keyboard.press('Escape');
  ok(dialogs === 0, '브라우저 팝업(alert·confirm·prompt) 없음', dialogs);
  console.log(bad ? `✗ tBUYP 실패 ${bad}` : '✓ tBUYP 모두 통과');
});
