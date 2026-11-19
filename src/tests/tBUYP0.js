// tBUYP0 — 정범님 11/19 19:16: Ⓕ 매입가 「0」 = 진짜 0원(저장·표시·셈) · 빈칸·지운 칸 = 「모름」 · 예전에 0으로 저장된 기록은 모름 그대로(이익이 갑자기 바뀌지 않게 · 리드 결정)
//   표시: pur_matches cost:0 + costZero:true · 매입 기록 품목·reg_items.buy price:0 + zero:true · 등록 카드 supCostZero:true
//   Ⓖ 머리 「＋ 매입」 → 「📋 매입목록」(매입 전체 목록) · 그 목록 맨 위 「＋ 새매입」 = 새 매입 기록
//  쓰는 법: test-gate가 돌림 (시험 자료는 지어낸 값 — 손님 정보 없음)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.dismiss().catch(() => {}); });
  const ev = (f, a) => p.evaluate(f, a); const wait = (ms) => p.waitForTimeout(ms);
  await ev(() => { const FS = window.__FS; const now = new Date().toISOString();
    S.app = { ...(S.app || {}), feeRate: 0.1 }; S._supC = null;
    const E0 = { source: 'app', sheet: '웹앱 기록', status: 'checked', plat: '당근', dateTime: '2026-11-01T10:00', date: '2026-11-01', cat: 'book', who: '판매자A', items: [{ k: 0, title: '예전 0 책', qty: 1, price: 0, regId: 'z3' }], amt: 0, qty: 1, updatedAt: null };
    FS.pur_entries = { E0: JSON.parse(JSON.stringify(E0)) }; S.pur.entries = [{ ...E0, id: 'E0' }]; S.pur.loaded = true;
    const mk = (id, extra) => ({ id, stage: 'sel', qty: 1, grade: 2, price: 9000, code: 'ZCODE' + id, info: { title: '책 ' + id, isbn13: '97889000000' + id.slice(1).padStart(2, '0'), priceList: 10000 }, createdAt: now, ...(extra || {}) });
    const R = [mk('z1'), mk('z2'), mk('z3', { buy: { entryId: 'E0', k: '0', price: 0, v: 1, at: now }, buyOn: true, info: { title: '예전 0 책', isbn13: '9788900000099', priceList: 10000 } })];
    S.regItems = new Map(R.map((x) => [x.id, x])); FS.reg_items = Object.fromEntries(R.map((x) => [x.id, JSON.parse(JSON.stringify(x))]));
    S.plist = S.plist || new Map(); S.pmatch = S.pmatch || new Map(); S.pmatchLoaded = true; S.regChk = new Set();
    for (const [id, m] of [['LZ', { kind: 'manual', cost: 0, costZero: true, how: '사람 연결' }], ['LO', { kind: 'manual', cost: 0, how: '사람 연결' }], ['LN', { kind: 'manual', cost: null, how: '사람 연결' }], ['LP', { kind: 'manual', cost: 1200, how: '사람 연결' }]]) { S.plist.set(id, { id, usedCode: 'U' + id, title: '상품 ' + id, qty: 1, price: 5000, priceList: 10000, active: true, registeredAt: '2026-11-09T10:00' }); S.pmatch.set(id, { id, ...m }); }
    bump(); });

  console.log('— ① 💰 매입가 기입: 0 = 0원 · 빈칸 = 모름');
  await ev(() => buypOpen(['z1', 'z2'])); await wait(400);
  { const r = await ev(() => [...document.querySelectorAll('.buyp [data-bi]')].map((x) => x.value)); ok(r.length === 2 && r.every((v) => v === ''), '처음엔 두 칸 모두 빈칸(모름)', r); }
  await p.fill('.buyp [data-bi="0"]', '0'); await wait(100);
  await p.click('.buyp [data-bok]'); await wait(200); if (await ev(() => !!document.querySelector('.buyp-ov'))) { await p.click('.buyp [data-bok]'); } await wait(1500);
  const docs = () => ev(() => JSON.parse(JSON.stringify({ E: __FS.pur_entries, R: __FS.reg_items, M: __FS.pur_matches || {} })));
  let D = await docs();
  { const b = D.R.z1.buy; ok(b && b.price === 0 && b.zero === true, '「0」 → reg_items.buy price:0 + zero:true', b);
    const e = b && D.E[b.entryId]; const x = e && (e.items || []).find((q) => String(q.k) === String(b.k)); ok(x && x.price === 0 && x.zero === true, '「0」 → 매입 기록 품목 price:0 + zero:true', x);
    ok(!D.R.z2.buy || D.R.z2.buy.price == null, '빈칸 → 매입가를 저장하지 않음(모름)', D.R.z2.buy);
    ok(D.R.z3.buy.price === 0 && !D.R.z3.buy.zero && D.E.E0.items[0].price === 0 && !D.E.E0.items[0].zero, '예전 0 기록은 건드리지 않음(다시 쓰지 않음)', { b: D.R.z3.buy, it: D.E.E0.items[0] }); }
  await ev(() => { const L = Object.values(__FS.reg_items); for (const v of L) { const it = S.regItems.get(v.id); if (it) Object.assign(it, JSON.parse(JSON.stringify(v))); } });
  { const r = await ev(() => ({ z1: buypChip(S.regItems.get('z1')), z2: buypChip(S.regItems.get('z2')), z3: buypChip(S.regItems.get('z3')) }));
    ok(/💰 0원/.test(r.z1), '칩 — 0 = 「💰 0원」', r.z1); ok(/매입가 —/.test(r.z2) && !/0원/.test(r.z2), '칩 — 빈칸 = 「매입가 —」(모름)', r.z2); ok(/매입가 모름/.test(r.z3) && /예전에 0으로 저장됨/.test(r.z3), '칩 — 예전 0 = 「매입가 모름」 + 까닭', r.z3); }
  { await ev(() => buypOpen(['z3'], { single: true })); await wait(400); const r = await ev(() => ({ v: (document.querySelector('.buyp [data-bi]') || {}).value, t: (document.querySelector('.buyp') || {}).innerText || '' })); ok(r.v === '' && /예전 0/.test(r.t), '창 — 예전 0 상품은 빈칸으로 열림 · 「지금 매입가 모름(예전 0)」', r); await p.keyboard.press('Escape'); await wait(150); }

  console.log('— ② 상품 매입 연결 표시 · 셈');
  { const r = await ev(() => ({ z: pmCost0(S.pmatch.get('LZ')), o: pmCost0(S.pmatch.get('LO')), n: pmCost0(S.pmatch.get('LN')), p: pmCost0(S.pmatch.get('LP')), tz: pmCostTxt(S.pmatch.get('LZ')), to: pmCostTxt(S.pmatch.get('LO')), tn: pmCostTxt(S.pmatch.get('LN')) }));
    ok(r.z === 0 && r.o === null && r.n === null && r.p === 1200, '원가 — 표시 붙은 0 = 0 · 예전 0·빈칸 = 모름(null)', r); ok(/^0원?$/.test(r.tz), '글 — 진짜 0 = 0원', r.tz); ok(r.to === '모름' && r.tn === '모름', '글 — 예전 0·빈칸 = 모름', r); }
  { const r = await ev(() => ({ z: plkCtx(S.plist.get('LZ')).cost, o: plkCtx(S.plist.get('LO')).cost, n: plkCtx(S.plist.get('LN')).cost })); ok(r.z === 0 && r.o == null && r.n == null, '판매가 하한 셈(plkCtx) — 0원은 넣고 모름은 뺌', r); }
  { const r = await ev(() => { const c = (lid) => lostLoss({ key: 'x~1', lid }); let o = {}; try { o = { z: c('LZ'), o: c('LO') }; } catch (e) { o = { err: String(e) }; } return o; });
    if (r.err || !r.z) console.log('  · lostLoss 상품 찾기 꼴이 달라 건너뜀', JSON.stringify(r).slice(0, 200)); else { ok(r.z.v === 0, '분실 손해 — 진짜 0원 = 0', r.z); ok(!/매입 연결의 매입 원가/.test(r.o.how || ''), '분실 손해 — 예전 0은 매입 원가로 안 씀(모름)', r.o); } }
  { const r = await ev(() => { const sp = saleProfit({ orderedAt: '2026-11-10', orderNo: 'T1', items: [{ price: 5000, qty: 1 }] }, { price: 5000, qty: 1 }, pmCost0(S.pmatch.get('LZ'))); const sn = saleProfit({ orderedAt: '2026-11-10', orderNo: 'T2', items: [{ price: 5000, qty: 1 }] }, { price: 5000, qty: 1 }, pmCost0(S.pmatch.get('LO'))); return { z: sp.p, n: sn.p, A: sp.A, F: sp.F, Sh: sp.Sh }; });
    ok(r.z != null && Math.round(r.z) === Math.round(r.A - r.F - r.Sh), '이익 — 0원 매입은 0으로 셈에 들어감', r); ok(r.n === null, '이익 — 모름은 셈에서 뺌', r); }
  { const r = await ev(() => { const a = purCardHtml(S.plist.get('LZ')); const b = purCardHtml(S.plist.get('LO')); const t = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); return { a: t(a), b: t(b) }; }); ok(/0원/.test(r.a) && !/예전 0원/.test(r.a), '상품 💰 매입·이익 카드 — 진짜 0원', r.a.slice(0, 300)); ok(/예전 0원 · 모름/.test(r.b), '상품 💰 매입·이익 카드 — 예전 0 = 모름 표시', r.b.slice(0, 300)); }
  { const r = await ev(() => ({ z: buypChipL(S.plist.get('LZ')), o: buypChipL(S.plist.get('LO')) })); ok(/0원/.test(r.z) && !/모름/.test(r.z), '상품 카드 💰 칸 — 진짜 0 = 0원', r.z); ok(/모름/.test(r.o), '상품 카드 💰 칸 — 예전 0 = 모름', r.o); }

  await ev(() => { window.__saved = null; window.__savePur0 = savePur; savePur = async (x) => { window.__saved = JSON.parse(JSON.stringify(x)); return 'idT'; }; window.__asks = []; window.__ask0 = ask; ask = async (m) => { window.__asks.push(String(m)); return true; }; /* 총액 0원 물음(앱 안 창)은 「그대로 저장」으로 */ });

  console.log('— ③ 머리 📋 매입목록 · ＋ 새매입 → 새 매입 기록 창: 0 = 0원 · 빈칸 = 모름');
  { const r = await ev(() => { try { ux2Apply(); } catch (e) {} const b = document.querySelector('[data-ux2qa="pur"]'); return b ? b.textContent : null; }); ok(r && /📋 매입목록/.test(r) && !/＋ 매입/.test(r), '머리 단추 글 = 📋 매입목록', r); }
  const hb = await ev(() => !!document.querySelector('[data-ux2qa="pur"]') && getComputedStyle(document.querySelector('[data-ux2qa="pur"]')).display !== 'none');
  if (hb) await p.click('[data-ux2qa="pur"]'); else await ev(() => document.querySelector('[data-ux2qa="pur"]').click());
  await wait(800);
  { const r = await ev(() => ({ pa: !!(S.detail && S.detail.purAll), nb: (document.getElementById('pa_new') || {}).textContent || null })); ok(r.pa, '머리 단추 → 매입 전체 목록이 열림', r); ok(r.nb && /＋ 새매입/.test(r.nb), '매입 전체 목록 맨 위에 「＋ 새매입」', r); }
  await ev(() => { try { localStorage.removeItem(PF_DRAFT); } catch (e) {} }); await p.click('#pa_new'); await wait(600);
  { const r = await ev(() => ({ d: S.detail && S.detail.pur, t: !!document.getElementById('pf_save') })); ok(r.d === 'new' && r.t, '「＋ 새매입」 → 새 매입 기록 창(openPurForm)', r); }
  await p.$eval('#pf_manual', (b) => b.click()); await wait(300);
  await p.locator('.pit_t').first().fill('영 책'); await p.locator('.pit_p').first().fill('0'); await p.locator('.pit_p').first().press('Tab'); await wait(150);
  await p.$eval('#pf_manual', (b) => b.click()); await wait(300);
  await p.locator('.pit_t').nth(1).fill('모름 책'); await p.locator('.pit_p').nth(1).fill(''); await p.locator('.pit_p').nth(1).press('Tab'); await wait(150);
  await p.$eval('#pf_save', (b) => b.click()); await wait(700);
  { const s = await ev(() => window.__saved); const it = (s && s.items) || []; const a = it.find((x) => x.title === '영 책'), b = it.find((x) => x.title === '모름 책');
    ok(a && +a.price === 0 && a.price !== '' && a.price != null && a.zero === true, '새 매입 기록 — 「0」 저장 = price 0 + zero', a); ok(b && (b.price == null || b.price === '') && !b.zero, '새 매입 기록 — 빈칸 = 모름(값 없음 · zero 없음)', b); }
  { const r = await ev(() => window.__asks); ok(r.length === 1 && /매입총액이 0원/.test(r[0]), '총액 0원이면 저장 전에 한 번 물음(앱 안 창)', r); }
  await ev(() => { savePur = window.__savePur0; ask = window.__ask0; });
  { const r = await ev(() => { const e = { id: 'TT', source: 'app', amt: 0, items: [{ k: 0, title: '영 책', qty: 1, price: 0, zero: true }, { k: 1, title: '모름 책', qty: 1, price: null }, { k: 2, title: '예전', qty: 1, price: 0 }] }; const t = (h) => String(h || '').replace(/<[^>]+>/g, ' '); let pz = null, po = null; try { const L = splitPurRaw(e).items || splitPurRaw(e); pz = L; } catch (x) { pz = String(x); } return { pz }; });
    const L = Array.isArray(r.pz) ? r.pz : null; if (L) { const a = L.find((x) => x.title === '영 책'); ok(a && a.est === 0 && a.zero, '나눔(splitPurRaw) — 0원 품목은 0으로 · 표시 이어짐', a); } else console.log('  · splitPurRaw 꼴 다름 — 건너뜀', JSON.stringify(r).slice(0, 200)); }

  ok(dialogs === 0, '브라우저 팝업(alert·confirm·prompt) 없음', dialogs);
  console.log(bad ? `✗ tBUYP0 실패 ${bad}` : '✓ tBUYP0 모두 통과');
});
