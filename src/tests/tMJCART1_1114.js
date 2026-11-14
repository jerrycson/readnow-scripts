// tMJCART1_1114 — (MJ님 11/14 17:41) 📥 등록 › 선택 대기 한눈에 「🛒 알라딘 매입 추천」 줄에 「🛒 알라딘 바로 장바구니」 단추
//  누르면(두 번) 🏷 알라딘 매입으로 보내고(★ 보내기와 같은 길 — 결정 기록) 곧바로 알라딘 팔기 장바구니 담기를 PC 수집기에 맡김(c2bAdd) · 한 번만 담김 · 결과 줄 '담김 ✓'
// 실행: cd pw && RN_PORT=<포트> node tMJCART1_1114.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
if (!process.env.RN_PORT) { console.log('✓ tMJCART1_1114 (화면 시험은 RN_PORT를 주면)'); process.exit(0); }
require(path.join(process.cwd(), 'harness.js'))(async (p) => { await p.evaluate(require(path.join(process.cwd(), 'seed.js'))); await p.waitForTimeout(600);
  p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const cmds = (t) => Object.entries(FS.shp_cmds || {}).filter(([, v]) => v.type === t).map(([id, v]) => ({ id, ...v }));
    let asked = 0; window.ask = async () => { asked++; return true; }; S.user = S.user || { email: 'tester@x' };
    S.regItems = S.regItems || new Map(); const it = { id: 'mC1', stage: 'sel', grade: 2, price: 895, q: '매입 추천 시험', info: { title: '매입 추천 시험 책', isbn13: '9791100000777', buyback: { 상: 1400 } } }; S.regItems.set(it.id, it); FS.reg_items = FS.reg_items || {}; FS.reg_items[it.id] = JSON.parse(JSON.stringify(it));
    S._regBbrSet = new Set(['mC1']); S.regMF = 'all';
    const box = document.createElement('div'); box.id = 'tcart'; document.body.appendChild(box); box.innerHTML = regDecHtml(it);
    const row = box.querySelector('.rgxdec.bbr'); const b = row && row.querySelector('[data-rgbbrcart]'); out.row = !!row; out.has = !!b; out.label = b && b.textContent; out.others = !!(row && row.querySelector('[data-rgbbr][data-v="send"]') && row.querySelector('[data-rgbbr][data-v="reg"]'));
    const before = cmds('c2bAdd').length; b.click(); await W(450); out.arm = b.textContent; out.after1 = cmds('c2bAdd').length - before; out.moved1 = !!(BB().moved || {}).REG_mC1;
    b.click(); await W(60); b.click(); await W(1500); /* 두 번째 누름 + 곧바로 한 번 더(되풀이) */
    const C = cmds('c2bAdd'); out.after2 = C.length - before; out.item = C.length ? (C[C.length - 1].items || [])[0] : null; out.moved2 = !!(BB().moved || {}).REG_mC1; out.cart = ((BB().cart || {}).REG_mC1 || {}).state || null; out.asked = asked; out.stage = (S.regItems.get('mC1') || {}).stage; out.rec = ((S.regItems.get('mC1') || {}).bbRec || {}).act || null;
    /* 새로 그린 줄에서 다시 두 번 눌러도 또 맡기지 않음 */
    box.innerHTML = regDecHtml({ ...S.regItems.get('mC1'), stage: 'sel' }); const b3 = box.querySelector('[data-rgbbrcart]'); if (b3) { b3.click(); await W(450); b3.click(); await W(1200); } out.after3 = cmds('c2bAdd').length - before;
    /* 결과 줄: 수집기가 담으면 '담김 ✓' */
    out.txtQ = regCartStTxt('REG_mC1'); bhSt().cart.REG_mC1 = { ...(bhSt().cart.REG_mC1 || {}), state: 'added' }; out.txtA = regCartStTxt('REG_mC1'); out.gone = regGoneHtml({ id: 'mC1', n: 2, txt: '🏷 알라딘 매입으로 보냄 (매입가 1,400원)', cartK: 'REG_mC1' });
    box.remove(); return out; });
  ok(r.row && r.has && /알라딘 바로 장바구니/.test(r.label) && r.others, '알라딘 매입 추천 줄에 「🛒 알라딘 바로 장바구니」(보내기·등록으로 진행 옆)', r);
  ok(/한 번 더/.test(r.arm) && r.after1 === 0 && !r.moved1, '한 번 누르면 「한 번 더 누르면」으로만 바뀜(아무 일 없음)', r);
  ok(r.after2 === 1 && r.item && r.item.isbn13 === '9791100000777' && r.moved2 && r.cart === 'queued' && r.stage === 'bb' && r.rec === 'send', '두 번 → 🏷 알라딘 매입으로 보냄(결정 기록 send) + 팔기 장바구니 담기 한 번만 맡김(c2bAdd 1개)', r);
  ok(r.after3 === 1, '다시 눌러도 또 맡기지 않음(되풀이 0)', r.after3);
  ok(r.asked === 0, '확인 창 없이(두 번 누르기가 확인)');
  ok(/맡김/.test(r.txtQ) && r.txtA === '🛒 담김 ✓' && /담김 ✓/.test(r.gone), "결과 줄: 맡김 → PC 수집기가 담으면 '🛒 담김 ✓'", { q: r.txtQ, a: r.txtA });
  console.log(bad ? `❌ tMJCART1_1114 ${bad}개 실패` : '✓ tMJCART1_1114 모두 통과'); });
