// tMJREG3_1112 — (11/12 MJ 등록 담당) 📥 등록 › 선택 대기
//  ① 📋 한눈에 줄 빠른 설명 단추 앞 「설명 없음」 — 누르면 자세히 카드의 '설명 없음'과 같음(descMode none · 쓴 글은 남김)
//  ② 🔎 자세히 카드 상품 설명 두 줄 — 1줄: 설명 없음 · 직접 입력 · 도서관책 · 북카페 ✎ / 2줄: ⚡ 간단 직접 입력 + 넓은 칸(줄 끝까지) · 가로 스크롤 없음
//  ③ 🟥 기본값 판매가 빨간 판 — 기본 접힌 한 줄(빨간 바탕 · 금액 · 정가×2 · 확인 필요) · 누르면 펼침 · 이 기기 기억(rn-reg-fbopen) · ⏳ 시장 지표 막힘 그대로
// 실행: cd pw && RN_PORT=<포트> node tMJREG3_1112.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/<span class="rgr-qx">\$\{regRowDescHtml\(it\)\}\$\{rgdbHtml\(it, 1\)\}<\/span>/.test(T), '📋 한눈에 줄 = rgdbHtml(it, 1) — 설명 없음 단추 포함');
ok(/async function rgdbNone\(id\)/.test(T) && /await regUpd\(id, \{ descMode: 'none' \}\)/.test(T), '설명 없음 = descMode none(자세히 카드와 같은 저장)');
ok(/\$\{rgdbHtml\(it\)\}<span class="rgsh-br"/.test(T), '🔎 자세히 카드 줄 나눔(rgsh-br)');
ok(/data-rgfbtg="rn-reg-fbopen"/.test(T) && /const regFbOpen = \(k\) => \{ try \{ return localStorage\.getItem\(k\) === '1'; \} catch/.test(T), '빨간 판 펼침 기억(rn-reg-fbopen · try/catch · 기본 접힘)');
ok(/function regMktCardHtml\(it, fbk\)/.test(T) && /\$\{regMktCardHtml\(it, fbk\)\}/.test(T), '⏳ 시장 지표 칸(mkt1) 그대로');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJREG3_1112 ${bad}개 실패` : '✓ tMJREG3_1112 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '778', sellerName: '판매자B', ship: 2500 }, { price: 6100, grade: '상', sellerCode: '779', sellerName: '판매자C', ship: 0 }];
  const seed = async (p, view, keepLs) => { p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async ({ PG, view, keepLs }) => { const T0 = Date.parse('2026-11-12T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
      const mk = (id, k, o) => ({ stage: 'sel', method: 'one', isbn: '97911000077' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), code: 'MJ3CMN', codeManual: true, info: { title: '세 가지 시험 책 ' + id, isbn13: '97911000077' + String(k).padStart(2, '0'), itemId: '77' + k, author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: PG, priceList: 15000, priceSales: 13500, salesPoint: 1200, usedTotal: 3, at: at(k) }, ...o });
      const fbI = (id, k, o) => mk(id, k, { method: 'bulk', alReg: 1, itemId: '78' + k, price: 24000, priceFb: { kind: 'c', price: 24000, why: '시장표·검색 모두 없음 — 정가 12,000원 × 2', at: at(k) }, info: { title: '기본값 시험 책 ' + id, isbn13: '97911000078' + String(k).padStart(2, '0'), itemId: '78' + k, author: '지은이을', publisher: '시험출판', pubDate: '2002-06-03', categories: [{ path: ['국내도서', '과학'] }], page1: [], priceList: 12000, priceSales: 10800, usedTotal: 0, at: at(k), ...(o || {}) } });
      const L = { d1: mk('d1', 1, {}), d2: mk('d2', 2, { descMode: 'quick', descQuick: '사용감 조금 있음' }), d3: mk('d3', 3, { descMode: 'manual', descEdit: '예전 직접 입력 글', desc: '예전 직접 입력 글' }), f1: fbI('f1', 4, { mktChk: { tries: 2, at: at(4) } }), f2: fbI('f2', 5, null) };
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      for (const k of [...S.regItems.keys()]) if (!L[k]) S.regItems.delete(k);
      try { REG_MKT_RE.at = new Map(); REG_MKT_RE.tries = new Map(); REG_MKT_RE.busy = false; REG_MKT_RE.at.set('f1', Date.now()); REG_MKT_RE.at.set('f2', Date.now()); } catch (e) {}
      window.pcFirst = async () => new Promise(() => {}); /* 저절로 다시 읽기가 시험을 흔들지 않게 */
      if (S.app && S.app.reg) delete S.app.reg.descBtns; S.regChk = new Set(); if (!keepLs) { localStorage.removeItem('rn-reg-fbopen'); localStorage.removeItem('rn-reg-fbtop'); }
      localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-sort'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { PG, view, keepLs });
    await p.waitForTimeout(1800); };
  const shotEl = async (p, sel, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await el.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } } catch (e) {} };
  const lay = (p, id) => p.evaluate((id) => { const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); if (!c) return null; const sh = c.querySelector(`[data-rgdm="${id}"]`).closest('.rgsh'); const R = (el) => (el ? el.getBoundingClientRect() : null); const mid = (r) => Math.round(r.top + r.height / 2);
      const line1 = [sh.querySelector('[data-v="none"]'), sh.querySelector('[data-v="manual"]'), ...sh.querySelectorAll('[data-rgdb]'), sh.querySelector('[data-rgdbedit]')].map(R); const qb = R(sh.querySelector('[data-v="quick"]')); const inp = R(sh.querySelector('.rgq-in')); const s = R(sh);
      const sheet = document.getElementById('sheet');
      return { names: [...sh.querySelectorAll('button')].map((b) => b.textContent.trim()).slice(0, 7), l1: line1.map(mid), qb: qb && mid(qb), inp: inp && { mid: mid(inp), w: Math.round(inp.width), right: Math.round(inp.right) }, sw: Math.round(s.width), sright: Math.round(s.right), over: sheet.scrollWidth - sheet.clientWidth, cover: c.scrollWidth - c.clientWidth }; }, id);
  await H(async (p) => {
    for (const vw of [1400, 390]) { await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 }); await seed(p, 'full');
      console.log(`② 🔎 자세히 카드 상품 설명 두 줄 (폭 ${vw})`);
      for (const id of ['d1', 'd2']) { const L = await lay(p, id);
        ok(L && (vw > 500 ? L.l1.every((m) => Math.abs(m - L.l1[0]) <= 4) : L.l1.every((m) => m <= L.l1[0] + 40)), `${id} 1줄(휴대폰 폭은 넘치면 접혀 내려감): 설명 없음 · 직접 입력 · 도서관책 · 북카페 · ✎ 한 줄`, L);
        ok(L && L.qb - Math.max(...L.l1) >= 18 && L.inp && Math.abs(L.inp.mid - L.qb) <= 6, `${id} 2줄: ⚡ 간단 직접 입력 + 칸이 아래 줄에 함께`, L);
        ok(L && L.inp && L.inp.w >= L.sw * (vw > 500 ? 0.6 : 0.45) && L.sright - L.inp.right <= 16, `${id} 간단 직접 입력 칸이 넓게(줄 끝까지)`, L);
        ok(L && L.over <= 0 && L.cover <= 0, `${id} 가로 스크롤 없음`, L); }
      await shotEl(p, '#sheet [data-rgcid="d1"] .rgsh:has([data-rgdb])', `mjreg3_card_desc_${vw}`);
      await shotEl(p, '#sheet [data-rgcid="d2"] .rgsh:has([data-rgdb])', `mjreg3_card_desc_quick_${vw}`); }
    await p.setViewportSize({ width: 1400, height: 900 }); await seed(p, 'full');
    const L3 = await lay(p, 'd3'); ok(L3 && L3.l1.every((m) => Math.abs(m - L3.l1[0]) <= 4) && L3.qb > L3.l1[0], 'd3(직접 입력) 1줄 단추 그대로 · ⚡ 단추는 2줄', L3);

    console.log('③ 🟥 기본값 판매가 빨간 판 — 접힌 한 줄');
    const fb = (id) => p.evaluate((id) => { const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); const b = c && c.querySelector('.rgfbk'); if (!b) return null; const one = b.querySelector('.rgfbk-1'); const d = b.querySelector('.rgfbk-d'); const cs = getComputedStyle(b); const it = S.regItems.get(id); const F = regFinals([it], regCfg()).get(id) || {};
      return { open: b.classList.contains('open'), bg: cs.backgroundColor, oneVis: !!one && one.offsetParent !== null, oneT: one ? one.textContent : '', oneH: one ? Math.round(one.getBoundingClientRect().height) : 0, dVis: !!d && d.offsetParent !== null, dT: d ? d.textContent : '', fb: !!F.fb, ls: localStorage.getItem('rn-reg-fbopen'), mk: !!c.querySelector('.rgmktw'), mkT: c.querySelector('.rgmktw') ? c.querySelector('.rgmktw').textContent.slice(0, 60) : '' }; }, id);
    let f = await fb('f1');
    ok(f && f.fb && !f.open && f.oneVis && !f.dVis, '처음엔 접힌 한 줄(기본 접힘)', f);
    ok(f && /^rgb\(176, 50, 42\)/.test(f.bg), '접혀도 빨간 바탕', f);
    ok(f && /기본값 판매가/.test(f.oneT) && /24,000원/.test(f.oneT) && /정가×2/.test(f.oneT) && /확인 필요/.test(f.oneT), '한 줄에 🟥 기본값 판매가 24,000원 · 정가×2 · 확인 필요', f);
    ok(f && f.oneH > 0 && f.oneH <= 24, '정말 한 줄 높이', f);
    await shotEl(p, '#sheet [data-rgcid="f1"] .rgour', 'mjreg3_fb_fold');
    await p.click('#sheet [data-rgcid="f1"] .rgfbk'); await p.waitForTimeout(400);
    f = await fb('f1');
    ok(f && f.open && !f.oneVis && f.dVis && /꼭 확인해서 고치세요/.test(f.dT) && /정가 12,000원 × 2/.test(f.dT) && f.ls === '1', '누르면 펼침 — 이유·안내 그대로 · 이 기기에 기억', f);
    await shotEl(p, '#sheet [data-rgcid="f1"] .rgour', 'mjreg3_fb_open');
    await seed(p, 'full', true); f = await fb('f1'); ok(f && f.open && f.dVis, '등록 화면을 다시 열어도 펼친 채(기억)', f);
    await p.click('#sheet [data-rgcid="f1"] .rgfbk'); await p.waitForTimeout(400); f = await fb('f1');
    ok(f && !f.open && f.oneVis && f.ls === '0', '다시 누르면 접힘 · 기억', f);
    ok(await p.evaluate(() => +S.regItems.get('f1').price === 24000 && S.regItems.get('f1').stage === 'sel'), '접기·펼치기가 판매가·단계를 바꾸지 않음');
    console.log('④ ⏳ 시장 지표 막힘(mkt1) 그대로');
    const f2 = await fb('f2'); ok(f2 && f2.mk && /시장 지표 읽는 중/.test(f2.mkT) && f2.oneVis, 'f2: 빨간 한 줄 + ⏳ 시장 지표 읽는 중 칸', f2);
    const mv = await p.evaluate(async () => { const r = await regMoveStage('f2', 'pick', regFinals([S.regItems.get('f2')], regCfg()).get('f2')); return { r, st: S.regItems.get('f2').stage }; });
    ok(mv.r === false && mv.st === 'sel', 'f2 → 결정 대기 막힘 그대로', mv);
    const rr = await p.evaluate(() => { const it = S.regItems.get('f2'); const s0 = it.stage; it.stage = 'pick'; try { const x = regRows(['f2'], regCfg()); return { bad: x.bad, n: x.rows.length }; } finally { it.stage = s0; } });
    ok(rr.n === 0 && rr.bad.some((t) => /시장 지표 읽는 중/.test(t)), 'f2 확정(regRows)도 막힘 그대로', rr);
    await shotEl(p, '#sheet [data-rgcid="f2"] .rgour', 'mjreg3_fb_mktwait');
    console.log('⑤ 목록 위 빨간 판도 한 줄');
    const top = () => p.evaluate(() => { const b = document.querySelector('#sheet .rgfbtop'); if (!b) return null; const r = b.getBoundingClientRect(); const g = [...b.querySelectorAll('[data-rgfbgo]')]; return { open: b.classList.contains('open'), h: Math.round(r.height), t: b.textContent.slice(0, 120), go: g.length, goVis: g.length && g[0].getBoundingClientRect().width > 0, bg: getComputedStyle(b).backgroundColor, ls: localStorage.getItem('rn-reg-fbtop') }; });
    let tp = await top();
    ok(tp && !tp.open && tp.h <= 48 && /기본값 판매가 2개/.test(tp.t) && tp.goVis, '목록 위 판: 접힌 한 줄 · 상품 이름(누르면 그 카드로) 보임', tp);
    await shotEl(p, '#sheet .rgfbtop', 'mjreg3_fbtop_fold');
    await p.click('#sheet .rgfbtop .rgfbtop-h'); await p.waitForTimeout(400); tp = await top();
    ok(tp && tp.open && tp.h > 48 && tp.ls === '1', '머리를 누르면 펼침 · 기억', tp);
    await shotEl(p, '#sheet .rgfbtop', 'mjreg3_fbtop_open');
    await p.click('#sheet .rgfbtop .rgfbtop-h'); await p.waitForTimeout(300);

    console.log('⑥ 📋 한눈에 줄 — 「설명 없음」 단추');
    await seed(p, 'compact');
    const row = (id) => p.evaluate((id) => { const r = document.querySelector(`.rgrow[data-rgexp="${id}"]`); if (!r) return null; const it = S.regItems.get(id); const n = r.querySelector('.rgr-qx [data-rgdbn]'); return { btns: [...r.querySelectorAll('.rgr-qx .rgdb button')].map((b) => b.textContent.trim()), on: n ? n.classList.contains('on') : null, mode: it.descMode, q: it.descQuick || '', own: regOwnDesc(it) || '', fin: regDescFinal(it) || '', exp: !!(S._regOpen && S._regOpen.has(id)) }; }, id);
    let r2 = await row('d2');
    ok(r2 && r2.btns.join(',') === '설명 없음,도서관책,북카페,✎' && r2.on === false, '빠른 설명 단추 앞에 「설명 없음」(⚡ 간단 입력 상품은 꺼짐)', r2);
    const r1 = await row('d1'); ok(r1 && r1.on === true, '설명 없음 상품은 켜짐', r1);
    await shotEl(p, '.rgrow[data-rgexp="d2"]', 'mjreg3_glance_before');
    await p.click('.rgrow[data-rgexp="d2"] [data-rgdbn]'); await p.waitForTimeout(900);
    r2 = await row('d2');
    ok(r2 && r2.mode === 'none' && r2.on === true && !r2.exp, '누르면 descMode none · 켜짐 · 줄은 펼쳐지지 않음', r2);
    ok(r2 && r2.q === '사용감 조금 있음', '쓴 글은 남겨 둠(자세히 카드 「설명 없음」과 같음)', r2);
    const cmp = await p.evaluate(() => { const a = S.regItems.get('d2'); const b = { ...S.regItems.get('d2'), descMode: 'none' }; return regDescFinal(a) === regDescFinal(b) && !regOwnDesc(a); });
    ok(cmp, '알라딘에 들어갈 설명 = 설명 없음 상태', r2);
    const dbv = await p.evaluate(async () => ((await db.collection('reg_items').doc('d2').get()).data() || {}).descMode); ok(dbv === 'none', '저장(reg_items)도 none', dbv);
    await shotEl(p, '.rgrow[data-rgexp="d2"]', 'mjreg3_glance_after');
    await p.click('.rgrow[data-rgexp="d3"] [data-rgdbn]'); await p.waitForTimeout(900);
    const r3 = await row('d3'); ok(r3 && r3.mode === 'none' && !r3.exp, '직접 입력 상품도 「설명 없음」', r3);
    const back = await p.evaluate(async () => { await regUpd('d3', { descMode: 'manual' }); return regOwnDesc(S.regItems.get('d3')); }); ok(back === '예전 직접 입력 글', '다시 직접 입력을 고르면 예전 글이 돌아옴', back);
    await p.click('.rgrow[data-rgexp="d2"] [data-rgdm="d2"][data-v="quick"]'); await p.waitForTimeout(700); await p.click('.rgrow[data-rgexp="d2"] .rgq-in'); await p.waitForTimeout(200); await p.keyboard.type('새 글', { delay: 20 });
    await p.click('.rgrow[data-rgexp="d2"] [data-rgdbn]').catch(() => {}); await p.waitForTimeout(1300);
    const r4 = await row('d2'); ok(r4 && r4.mode === 'none', '칸에 쓰다가 「설명 없음」을 눌러도 설명 없음이 이김', r4);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800);
    const ph = await p.evaluate(() => { const sh = document.getElementById('sheet'); return { over: sh.scrollWidth - sh.clientWidth }; }); ok(ph.over <= 0, '휴대폰 폭 한눈에 줄 가로 스크롤 없음', ph);
    await shotEl(p, '.rgrow[data-rgexp="d1"]', 'mjreg3_glance_phone');
    await p.setViewportSize({ width: 1400, height: 900 });
  });
  console.log(bad ? `❌ tMJREG3_1112 ${bad}개 실패` : '✓ tMJREG3_1112 모두 통과'); process.exit(bad ? 1 : 0);
})();
