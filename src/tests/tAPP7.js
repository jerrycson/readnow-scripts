// tAPP7 — 정범님 11/05
//  ① 예스24 자체코드(통합 SKU) → 우리 상품 Map(y24SkuIdx) — 예전 훑기(상품 2.6만 건 filter)와 결과·차례가 같음 · 2만 6천 건에서 시간 셈 · 상품이 바뀌면 다시 묶음(바뀐 상품만 SKU 다시 셈)
//  ② 휴대폰 알림 설정 — 🛎 주문 발생(예스24 새 주문)은 기본 끔(예전 kinds.y24 true여도) · 켜면 kOn 시각 · 끄면 지움
//  ③ 🔕 PC 부재 알림 — 모든 PC 기본 끔 · 예전 값(v 없음)은 끔 · 켠 값(v 2)만
// 시험 자료에 손님 정보 없음 (공개 저장소)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((x) => setTimeout(x, ms)); const out = {}; const FS = window.__FS; S.user = S.user || { email: 'tester@x' };
    // ① 2만 6천 건 상품 · SKU 지도 · 매입처 표
    S.app = S.app || {}; S.app.reg = { ...(S.app.reg || {}), srcX: [{ id: 'xck', suffix: '_ck', name: '매입처갑' }] }; S._supC = null; S.sku.seqUn = () => {};
    const SH = ['PNKLUX', 'BLKCMN_ck', 'GRNNEW_ms', 'YLWSTD', 'BLUTOP_hd']; const core = (i) => 'abcdefghijklmnopqrstuvwxyz'[i % 26] + String(1000 + (i % 9000)).slice(-4);
    S.plist.clear(); const N = 26000;
    for (let i = 0; i < N; i++) { const id = 'aladin_U9' + String(i).padStart(8, '0'); S.plist.set(id, { id, usedCode: 'U9' + i, title: '책 ' + i, status: '판매중', active: true, qty: 1, sku: SH[i % SH.length] + (i % 97 === 0 ? ' ' : '') });
      if (i % 13 !== 0) S.sku.map.set(id, { c: i % 501 === 0 ? [core(i), core(i + 7)] : i % 1000 === 5 ? [core(i - 5)] : [core(i)] }); } /* 13번째마다 SKU 없음 · 501번째마다 SKU 둘 · 1000번째마다(끝 5) 다섯 앞 상품과 같은 서가·고유 5칸(같은 코드 여러 상품) */
    S.ver++; S.sku.at = Date.now();
    const L = [...S.plist.values()]; const selves = []; for (let i = 5; i < N; i += 1000) { const f = y24SkuSelf(L[i]); if (f[0]) selves.push(f[0]); } for (let i = 0; i < N; i += 37) { const f = y24SkuSelf(L[i]); if (f[0]) selves.push(f[0]); } selves.push('PNKz9999EX', 'NOPE12345', 'pnk' + core(5)); /* 없는 코드 · 소문자 */
    const oldF = (self) => L.filter((l) => y24SkuSelf(l).includes(self));
    let t0 = performance.now(); const OLD = selves.slice(0, 40).map(oldF); const tOld = (performance.now() - t0) / 40;
    Y24_SKU.k = null; t0 = performance.now(); y24SkuIdx(); const tBuild = performance.now() - t0;
    t0 = performance.now(); const NEW = selves.slice(0, 40).map((s) => (y24SkuIdx().get(s) || []).slice()); const tNew = (performance.now() - t0) / 40;
    let same = 0, diff = []; selves.forEach((s, k) => { const a = k < 40 ? OLD[k] : oldF(s); const b = y24SkuIdx().get(s) || []; if (a.length === b.length && a.every((x, j) => x === b[j])) same++; else diff.push(s + ':' + a.length + '/' + b.length); });
    out.sku = { n: selves.length, same, diff: diff.slice(0, 5), multi: selves.filter((s) => (y24SkuIdx().get(s) || []).length > 1).length, tOld: +tOld.toFixed(2), tBuild: +tBuild.toFixed(1), tNew: +tNew.toFixed(4) };
    // 상품 하나를 고치면(관리코드 바뀜) 다시 묶고 새 코드로 찾음
    const L5 = L[5]; const before = y24SkuSelf(L5)[0]; L5.sku = 'GRNNEW_ms'; S.ver++; const after = y24SkuSelf(L5)[0]; t0 = performance.now(); const hitNew = (y24SkuIdx().get(after) || []).includes(L5); const tRe = performance.now() - t0; const hitOld = (y24SkuIdx().get(before) || []).includes(L5);
    out.re = { hitNew, hitOld, tRe: +tRe.toFixed(1), diffCode: before !== after };
    // y24oMatch0 길 — SKU로 찾은 결과가 예전과 같음
    const it = { self: selves[3], title: '아무 제목' }; const m = y24oMatch0(it); out.match = m.how === 'sku' && m.L.length === oldF(selves[3]).length && m.L.every((x, j) => x === oldF(selves[3])[j]);
    const m2 = y24oMatch0({ self: 'PNKLUX', title: '' }); out.pnklux = m2.how !== 'sku';
    // ② 알림 설정 — 기기 셋 등록(옛 값 kinds.y24 true 포함)
    await db.collection('app_settings').doc('push_subs').set({ subs: { 폰A: { sub: { ep: 'A' } }, 폰B: { sub: { ep: 'B' }, kinds: { y24: true } } } }, { merge: true });
    await db.collection('app_settings').doc('push_pub').set({ publicKey: 'x' }, { merge: true });
    S.detail = null; S.tab = 'settings'; renderTabs(); renderMain(); await W(600); const sec = document.querySelector('details[data-sec="set_shipnotify"]'); if (sec) sec.open = true; await W(400);
    for (let i = 0; i < 20 && !document.querySelector('[data-snk="폰B|y24"]'); i++) { const b = document.getElementById('sn_box'); if (b) { b.innerHTML = shipNotifyHtml(); shipNotifyBind(b); } await W(200); }
    const cA = document.querySelector('[data-snk="폰A|y24"]'), cB = document.querySelector('[data-snk="폰B|y24"]'); out.ui = { has: !!cA && !!cB, A: cA && cA.checked, B: cB && cB.checked, autodone: (document.querySelector('[data-snk="폰A|autodone"]') || {}).checked, autorev: (document.querySelector('[data-snk="폰A|autorev"]') || {}).checked, label: /주문 발생/.test((document.getElementById('sn_box') || {}).innerHTML || '') };
    if (cB) { cB.checked = true; cB.onchange(); await W(600); } const sB = (((FS.app_settings || {}).push_subs || {}).subs || {}).폰B || {}; out.on = { kOn: !!(sB.kOn && sB.kOn.y24), kinds: (sB.kinds || {}).y24 };
    { const b = document.getElementById('sn_box'); b.innerHTML = shipNotifyHtml(); shipNotifyBind(b); } const cB2 = document.querySelector('[data-snk="폰B|y24"]'); out.on.redraw = cB2 && cB2.checked;
    if (cB2) { cB2.checked = false; cB2.onchange(); await W(600); } const sB2 = (((FS.app_settings || {}).push_subs || {}).subs || {}).폰B || {}; out.off = { kOn: !!(sB2.kOn && sB2.kOn.y24), kinds: (sB2.kinds || {}).y24 };
    // ③ PC 부재 알림 기본 끔
    out.abs = [pcAbsOn('MJ-MAIN', {}), pcAbsOn('HOME', {}), pcAbsOn('HOME', { absAlert: { HOME: { on: true, at: '2026-11-04T00:00:00Z' } } }), pcAbsOn('HOME', { absAlert: { HOME: { on: true, v: 2 } } }), pcAbsOn('HOME', { absAlert: { HOME: { on: false, v: 2 } } })];
    out.feat = ['🔕 PC 부재 알림', '🛎 주문 발생 휴대폰 알림'].map((t) => FEAT.some((f) => String(f.t).startsWith(t)));
    S.tab = 'home'; return out; });
  console.log(JSON.stringify(r));
  console.log('① 예스24 자체코드 색인');
  ok(r.sku.same === r.sku.n && r.sku.n > 600 && r.sku.multi > 0, `코드 ${r.sku.n}개(같은 코드 여러 상품 ${r.sku.multi}개 포함) — 예전 훑기와 결과·차례 모두 같음 ${r.sku.same}/${r.sku.n} ${r.sku.diff.join(' ')}`);
  console.log(`  ⏱ 상품 2만 6천 건: 예전 훑기 코드 하나당 ${r.sku.tOld}ms · 색인 처음 만들기 ${r.sku.tBuild}ms(한 번) · 색인 찾기 하나당 ${r.sku.tNew}ms · 상품 바뀐 뒤 다시 묶기 ${r.re.tRe}ms`);
  ok(r.sku.tNew < r.sku.tOld / 50, `찾기가 예전보다 50배 넘게 빠름(${r.sku.tOld}ms → ${r.sku.tNew}ms)`);
  ok(r.re.diffCode && r.re.hitNew && !r.re.hitOld, '상품 관리코드가 바뀌면 다시 묶어 새 코드로 찾고 옛 코드로는 안 찾음');
  ok(r.match && r.pnklux, '주문 줄 짝(y24oMatch0) SKU 길 결과가 예전과 같음 · PNKLUX는 SKU 길을 안 탐');
  console.log('② 🛎 주문 발생 알림');
  ok(r.ui.has && r.ui.A === false && r.ui.B === false && r.ui.label, '설정 🔔 출고 알림 › 기기마다 🛎 주문 발생 — 기본 끔(예전 kinds.y24 켬이던 기기도 꺼짐)');
  ok(r.ui.autodone === true && r.ui.autorev === true, '🤖 자동 주문처리 완료 · 🔎 관리자 검토 필요는 그대로 켬');
  ok(r.on.kOn && r.on.kinds === true && r.on.redraw === true, '켜면 kOn.y24(켠 시각) 저장 · 다시 그려도 켜져 있음');
  ok(!r.off.kOn && r.off.kinds === false, '다시 끄면 kOn 지움(클라우드가 안 보냄)');
  console.log('③ 🔕 PC 부재 알림');
  ok(r.abs.join() === 'false,false,false,true,false', '모든 PC 기본 끔 · 예전 켬(v 없음) = 끔 · 이번에 켠 것(v 2)만 켬: ' + r.abs.join());
  ok(r.feat.every(Boolean), '🔍 기능 찾기에 둘 다 있음');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
