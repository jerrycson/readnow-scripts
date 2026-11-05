// tRGCART — 정범님 11/05 '등록에서 상품 카드마다 바로 알라딘 매입 장바구니에 담는 단추 · 같은 위치의 버튼을 두 번 눌러서 활성'
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const cmds = (t) => Object.entries(FS.shp_cmds || {}).filter(([, v]) => v.type === t).map(([id, v]) => ({ id, ...v }));
    let asked = 0; window.ask = async () => { asked++; return true; }; S.user = S.user || { email: 'tester@x' };
    S.regItems = S.regItems || new Map(); const it = { id: 'rC1', stage: 'sel', grade: 2, price: 6000, q: '장바구니 시험', info: { title: '장바구니 시험 책', isbn13: '9791100000555', buyback: { 상: 2500 } } }; S.regItems.set(it.id, it); FS.reg_items = FS.reg_items || {}; FS.reg_items[it.id] = JSON.parse(JSON.stringify(it));
    const box = document.createElement('div'); box.id = 'tcart'; document.body.appendChild(box); box.innerHTML = regBbSecHtml(it, 6000, null, 'sel') /* (11/05) 자세히 '🏷 알라딘 매입' 칸 */ + regBbAct(it);
    const b = box.querySelector('[data-rgcartnow]'); out.has = !!b; out.label = b && b.textContent; out.sendToo = !!box.querySelector('[data-rgbbsend]');
    const before = cmds('c2bAdd').length; b.click(); await W(150); out.arm = b.textContent; out.after1 = cmds('c2bAdd').length - before; out.moved1 = !!(BB().moved || {}).REG_rC1;
    b.click(); await W(1200); const C = cmds('c2bAdd'); out.after2 = C.length - before; out.item = C.length ? (C[C.length - 1].items || [])[0] : null; out.moved2 = !!(BB().moved || {}).REG_rC1; out.cart = ((BB().cart || {}).REG_rC1 || {}).state || null; out.asked = asked; out.stage = (S.regItems.get('rC1') || {}).stage;
    // 4초가 지나면 첫 누름이 풀림
    const it2 = { ...it, id: 'rC2', info: { ...it.info, isbn13: '9791100000556' } }; S.regItems.set('rC2', it2); FS.reg_items.rC2 = JSON.parse(JSON.stringify(it2)); box.innerHTML = regBbAct(it2); const b2 = box.querySelector('[data-rgcartnow]'); b2.click(); await W(4300); out.reset = b2.textContent; b2.click(); await W(300); out.after3 = cmds('c2bAdd').length - before; box.remove();
    return out; });
  console.log(JSON.stringify(r));
  ok(r.has && /바로 장바구니/.test(r.label) && r.sendToo, '등록 카드에 🛒 바로 장바구니 단추(🏷 보내기 옆)');
  ok(/한 번 더/.test(r.arm) && r.after1 === 0 && !r.moved1, '한 번 누르면 아무 일 없이 「한 번 더 누르면」으로만 바뀜');
  ok(r.after2 === 1 && r.item && r.item.isbn13 === '9791100000555' && r.moved2 && r.cart === 'queued' && r.stage === 'bb', '같은 단추를 두 번 → 🏷 알라딘 매입으로 보내고 팔기 장바구니 담기 맡김(c2bAdd) · 대기');
  ok(r.asked === 0, '확인 창 없이(두 번 누르기가 확인)');
  ok(/바로 장바구니/.test(r.reset) && r.after3 === 1, '4초 지나면 첫 누름이 풀려 다시 두 번 눌러야 함');
  console.log(bad ? `❌ tRGCART 실패 ${bad}` : '✓ tRGCART 통과'); });
