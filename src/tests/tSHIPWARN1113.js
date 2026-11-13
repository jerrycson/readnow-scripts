// tSHIPWARN1113 — 정범님 11/13 23:49 '지금 간소화(검토·상품명·가격)는 좋은데 왜 바꾸려는 거야 — 여기에 두세 마디 이유만 붙여' (shipwarn1)
//  ① 이유 두세 마디(sauWhy2): 사유마다 정해 둔 짧은 말 · 여럿이면 중요한 것부터 둘까지 · 단독이면 '유효 매물 없음'은 뺌
//  ② 접힌 줄은 그대로(칩 글자·총액 같음) + 끝에 ' · 견줄 매물 없음'만 · 새 줄·긴 문장 없음 · 「자세히」 닫힌 채 · 안 내용 그대로
//  ③ 휴대폰 390: 단독 매물 한 권 주문의 접힌 줄이 한 줄 안에서 끝남(「자세히」까지)
//  ④ 설정(이 기기 · rn-wsh-why · 기본 켬): 끄면 11/12 모양과 글자 하나 다르지 않음
//  ⑤ 보이는 글만 — 출고 카드 누를 곳(단추·입력·data-*)은 켬·끔에서 하나도 다르지 않음
//  화면 사진: RN_SHOT 폴더(없으면 임시 폴더) shipwarn_{390,1280}_{before,after}.png
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIPWARN1113.js
const path = require('path'); const os = require('os');
const SHOT = process.env.RN_SHOT || os.tmpdir(); const PORT = process.env.RN_PORT || 8765;
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const seedFn = (off) => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const FS = (window.__FS = window.__FS || {});
  const it = (lid, t, pr) => ({ listingId: lid, title: t, price: pr, qty: 1, grade: '상', sku: 'BLKAAA_ms' });
  FS.shp_state = { confirm: { orders: [{ orderNo: 'C-1', buyer: '손님A', orderedAt: '2026-11-13 09:10', items: [it('L1', 'Duden Das Kindergarten-Wörterbuch', 19000)] }, { orderNo: 'C-2', buyer: '손님B', orderedAt: '2026-11-13 09:11', items: [it('L2', '초보 골프 교실', 1600), it('L3', '십자군 이야기 세트 - 전3권', 11000), it('L4', '소리 잃은 강', 3000)] }], at: iso(now), sig: 's1' }, current: { orders: [], at: iso(now), tabCounts: {}, sig: 'c1' } };
  FS.shp_auto = { 'C-1': { orderNo: 'C-1', state: 'review', at: iso(now), decidedAt: iso(now), by: 'cloud', total: 19000, qty: 1, kinds: ['alone', 'novalid'], top: { title: 'Duden Das Kindergarten-Wörterbuch', price: 19000, qty: 1 },
      reasons: ['「Duden Das Kindergarte…」 19,000원 — 첫 페이지에 우리 매물뿐(단독 매물) · 견줄 다른 판매자 매물이 없음', '「Duden Das Kindergarte…」 유효 매물이 없어 판매가를 견줄 수 없음'],
      items: [{ title: 'Duden Das Kindergarten-Wörterbuch', price: 19000, grade: '상', mkt: 'ok', rule: 'pct', flag: 'alone', alone: true, why: '첫 페이지에 유효 매물이 없어 유효 최저가가 없음' }] },
    'C-2': { orderNo: 'C-2', state: 'review', at: iso(now), decidedAt: iso(now), by: 'cloud', total: 15600, qty: 3, kinds: ['nomkt', 'cheap', 'bbLow'], top: { title: '십자군 이야기 세트 - 전3권', price: 11000, qty: 1 },
      reasons: ['「초보 골프 교실」 1,600원 — 알라딘 매입 후보', '「십자군 이야기 세트 - 전3권」 11,000원 — 유효 최저가 15,000원보다 27% 쌈 (기준 25% 넘게)', '「소리 잃은 강」 시장 자료 없음 — 아직 못 읽음'],
      items: [{ title: '초보 골프 교실', price: 1600, grade: '상', mkt: 'ok', rule: 'bb', flag: 'bbLow', bbGain: -254, bbK: 500 }, { title: '십자군 이야기 세트 - 전3권', price: 11000, grade: '상', mkt: 'ok', rule: 'pct', flag: 'cheap', ratio: -0.27, tier: 'valid', ref: 15000 }, { title: '소리 잃은 강', price: 3000, grade: '상', mkt: 'none' }] } };
  try { localStorage.setItem('rn-ship-view', 'order'); if (off) localStorage.setItem('rn-wsh-why', '0'); else localStorage.removeItem('rn-wsh-why'); } catch (e) {} };
// 출고 카드 읽기 — 접힌 줄 글자·줄 수·누를 곳 지문
const look = () => { const sh = document.getElementById('sheet'); return [...sh.querySelectorAll('.wsh')].map((b) => { const d = b.querySelector('details.wsh-more'); const f = b.cloneNode(true); const fd = f.querySelector('details'); if (fd) fd.remove();
  const T0 = [...b.querySelectorAll(':scope > b, :scope > span, :scope > small, :scope > details > summary')].map((e) => [...e.getClientRects()].map((r) => r.top + r.height / 2)).flat().sort((a, c) => a - c); const tops = T0.filter((t, i) => !i || t - T0[i - 1] > 9); /* 한 줄 = 가운데 높이가 9px 안 */ const card = b.closest('section') || b.parentElement;
  const acts = [...card.querySelectorAll('button, a, input, select, [data-act]')].filter((e) => !e.closest('.wsh')).map((e) => e.tagName + '|' + [...e.attributes].filter((a) => /^data-|^id$|^type$/.test(a.name)).map((a) => a.name + '=' + a.value).join(',') + '|' + (e.textContent || '').trim().slice(0, 30));
  return { front: f.textContent, why: (b.querySelector('.wsh-why') || {}).textContent || null, rows: tops.length, open: d ? d.open : null, full: d ? d.querySelector('.wsh-full').textContent : '', sum: d ? d.querySelector('summary').textContent : '', acts: acts.join('\n'), h: Math.round(b.getBoundingClientRect().height) }; }); };
const run = (off, vp, fn) => require('./harness.js')(async (p) => { await p.addInitScript(seedFn, off); await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
  await p.goto('http://localhost:' + PORT + '/app/index.html?go=confirm'); await p.waitForTimeout(5000);
  await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); for (let i = 0; i < 40 && !(S.detail && S.detail.ship); i++) await W(250); S.shipTab = 'confirm'; S.shipAutoCfg = { ...(S.shipAutoCfg || {}), on: true }; try { shipRerender(); } catch (e) {} await W(1500); });
  await fn(p); }, { vp, ...(vp.width < 500 ? { touch: true } : {}) });
const shot = async (p, n) => { await p.evaluate(() => { const b = [...document.querySelectorAll('#sheet .wsh')].find((x) => /단독 매물/.test(x.textContent)) || document.querySelector('#sheet .wsh'); if (b) b.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOT, n + '.png') }); };
(async () => {
  const R = {};
  for (const [w, off] of [['390', false], ['390', true], ['1280', false], ['1280', true]]) {
    const vp = w === '390' ? { width: 390, height: 844 } : { width: 1280, height: 900 }; const nm = (off ? 'off' : 'on') + w;
    await run(off, vp, async (p) => { R[nm] = await p.evaluate(look);
      if (nm === 'on390') { R.unit = await p.evaluate(() => { const r = (k) => sauWhy2({ state: 'review', kinds: k }); return { photo: r(['alone', 'novalid']), mix: r(['nomkt', 'cheap', 'bbLow']), cust: r(['qty', 'cust', 'alone']), one: r(['cheap']), nov: r(['novalid']), none: sauWhy2({ state: 'sent', kinds: ['alone'] }) }; });
        await shot(p, 'shipwarn_390_after');
        R.set = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const c = document.querySelector('#wsh_why input[data-wshwhy]'); const o = { has: !!c, def: c && c.checked }; if (c) { c.checked = false; c.dispatchEvent(new Event('change')); } await W(2600); o.ls = localStorage.getItem('rn-wsh-why'); o.n = document.querySelectorAll('#sheet .wsh-why').length; const c2 = document.querySelector('#wsh_why input[data-wshwhy]'); if (c2) { c2.checked = true; c2.dispatchEvent(new Event('change')); } await W(2600); o.n2 = document.querySelectorAll('#sheet .wsh-why').length; return o; }); }
      else await shot(p, 'shipwarn_' + w + '_' + (off ? 'before' : 'after')); }); }
  const U = R.unit || {};
  ok(U.photo === '견줄 매물 없음' && U.mix === '알라딘 매입이 나음 · 최저가보다 너무 쌈' && U.cust === '블랙리스트 고객 · 권수 기준 넘음' && U.one === '최저가보다 너무 쌈' && U.nov === '유효 매물 없음' && U.none === '', `① 이유 두세 마디 — 단독 '${U.photo}' · 여럿 '${U.mix}' · 고객 '${U.cust}' (중요한 것 둘까지 · 단독이면 유효 매물 없음 뺌)`, U);
  for (const w of ['390', '1280']) { const A = R['on' + w] || [], B = R['off' + w] || [];
    ok(A.length === 2 && B.length === 2, `② ${w}: 검토 카드 2장`, [A.length, B.length]);
    ok(A.length === 2 && A.every((x, i) => x.why && B[i] && !B[i].why && x.front === B[i].front + ' · ' + x.why), `② ${w}: 접힌 줄은 11/12 글자 그대로 + 끝에 ' · ${A.map((x) => x.why).join("' / '")}'만`, A.map((x, i) => [x.front, B[i] && B[i].front]));
    ok(A.length === 2 && A.every((x, i) => x.open === false && B[i].open === false && x.full === B[i].full && x.sum === '자세히' && !/관리자 검토 필요 —/.test(x.front)), `② ${w}: 「자세히」 닫힌 채 · 안 내용 그대로 · 접힌 칸에 긴 펼친 글 없음`);
    ok(A.length === 2 && A.every((x, i) => x.acts === B[i].acts) && A[0].acts.length > 0, `⑤ ${w}: 출고 카드 누를 곳 켬·끔에서 글자 하나 다르지 않음 (${A.map((x) => x.acts.split('\n').length).join('·')}개)`); }
  const P = (R.on390 || []).find((x) => x.why === '견줄 매물 없음'); const P0 = (R.off390 || []).find((x) => /단독 매물/.test(x.front));
  ok(P && P0 && P.rows <= P0.rows && P.h <= P0.h, `③ 휴대폰 390: 단독 매물 주문 — 이유를 붙여도 줄이 늘지 않음(붙이기 전 ${P0 && P0.rows}줄 ${P0 && P0.h}px → 뒤 ${P && P.rows}줄 ${P && P.h}px) — '${P && P.front}'`, [P, P0]);
  const S1 = R.set || {}; ok(S1.has && S1.def === true && S1.ls === '0' && S1.n === 0 && S1.n2 === 2, '④ ⚙ 🤖 자동 발송요청 › 접힌 검토 줄 끝에 이유 두세 마디 — 기본 켬 · 끄면 이 기기에 저장·곧바로 사라짐 · 다시 켜면 돌아옴', S1);
  console.log('사진:', path.join(SHOT, 'shipwarn_{390,1280}_{before,after}.png'));
  console.log(bad ? `❌ tSHIPWARN1113 실패 ${bad}` : '✓ tSHIPWARN1113 모두 통과');
})();
