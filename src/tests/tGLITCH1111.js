// tGLITCH1111 — 정범님 11/11 '매입 탭에 이런 글리치가 많은데 고쳐 주고, 다른 곳들도 찾아서 고쳐 줘'
//  ① 시각 고르기(시계 창)를 한 번 연 뒤에도 '누를 수 있는 줄'(.item.clk — 미등록 보유 상품 ① 알라딘구매풀·헌옷도라이 · 매입 전체 목록)과
//     🏪 매입처 카드(.sup-card.clk)가 부모 폭을 다 쓰고 떠 있는 그림자·22px 둥근 모서리가 없음 (예전: 시계 CSS '.clk{width:min(330px…)}'가 덮음) · 시계 창 자체는 그대로 330px 카드
//  ② 늦게 넣는 CSS(시계·설명서·출고 검색·소재불명·업데이트·매입가 기입 등)를 모두 넣은 채로 모든 탭·주요 상세 화면(넓은 화면 1400 · 휴대폰 390)을 훑어
//     블록 칸이 부모 폭보다 눈에 띄게 좁아짐 · 목록 줄에 떠 있는 그림자 · 글이 120px 아래 기둥으로 한 낱말씩 꺾임 · 화면 가로 넘침 = 0
//  ③ 📖 설명서 단추는 설명서를 열기 전에도 같은 모양(둥근 모서리 8px)
//  ④ 휴대폰: 주문 탭 🧾 주문 상품 전체 보기 설명 · 매입 탭 🔭 매입 상품 조회 설명이 넓게 · 등록 화면이 옆으로 밀리지 않음
const fs = require('fs'); let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const AUD = function (rootSel) { const R = document.querySelector(rootSel); if (!R) return null; const out = [];
  const nm = (el) => (el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '')).slice(0, 50);
  const tx = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); const SKIP = '.clk-bg,.seenp,.rn-done,#ux2dock,.vzpop,svg,canvas,.ux2-armtip,.pvv,table';
  for (const el of R.querySelectorAll('*')) { if (el.closest(SKIP)) continue; const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue; const pa = el.parentElement; if (!pa) continue;
    if (cs.display === 'block' && cs.position !== 'absolute' && cs.position !== 'fixed' && cs.float === 'none' && !/^(BUTTON|INPUT|SELECT|TEXTAREA|IMG|SUMMARY|LABEL|PROGRESS|METER|IFRAME|VIDEO)$/.test(el.tagName)) { const ps = getComputedStyle(pa);
      if (ps.display === 'block' || ps.display === 'list-item') { const pb = pa.getBoundingClientRect(); const cw = pb.width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight) - parseFloat(ps.borderLeftWidth) - parseFloat(ps.borderRightWidth); const ow = b.width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
        if (cw > 200 && ow < cw * 0.85 && !el.style.width && !el.style.maxWidth) out.push('좁음 ' + nm(el) + ' «' + tx(el) + '» ' + Math.round(b.width) + '/' + Math.round(cw)); } }
    if ((el.matches('.item') || pa.matches('.list')) && cs.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(cs.boxShadow)) out.push('목록 줄 그림자 ' + nm(el) + ' «' + tx(el) + '»');
    if (/^(DIV|SPAN|B|SMALL|P)$/.test(el.tagName) && cs.display !== 'inline') { const t = (el.textContent || '').replace(/\s+/g, ''); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4; if (t.length >= 24 && b.width < 120 && b.height > lh * 5 && !el.querySelector('div,p,br,button,img')) out.push('기둥처럼 좁음 ' + nm(el) + ' «' + tx(el) + '» ' + Math.round(b.width) + 'x' + Math.round(b.height)); } }
  if (R.scrollWidth > R.clientWidth + 2) out.push('가로 넘침 ' + rootSel + ' ' + R.scrollWidth + '>' + R.clientWidth);
  if (document.documentElement.scrollWidth > innerWidth + 2) out.push('페이지 가로 넘침 ' + document.documentElement.scrollWidth + '>' + innerWidth);
  return out; };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: 'window.__aud = ' + AUD.toString() });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const W = (ms) => p.waitForTimeout(ms);
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.app.tabOrder = {}; S.app.tabHide = {}; });
  const shut = async () => { await p.evaluate(() => { try { S.navStack.length = 0; } catch (e) {} try { if (S.detail) closeDetail(); } catch (e) {} const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('on'); }); await W(250); };
  const go = async (t) => { await shut(); await p.evaluate((t) => { S.q = ''; S.tab = t; renderTabs(); S._userAt = Date.now(); renderMain(); window.scrollTo(0, 0); }, t); await W(900); };
  // ③ 설명서를 열기 전 📖 단추 모양
  await go('purchase'); await p.evaluate(() => openSuppliers()); await W(900);
  R3 = await p.evaluate(() => { const b = document.querySelector('#sheet .pgdbtn'); return b ? { r: getComputedStyle(b).borderTopLeftRadius, css: !!document.getElementById('pgd_css') } : null; });
  ok(R3 && R3.r === '8px' && R3.css, '③ 설명서를 열기 전에도 📖 설명서 단추 모양(둥근 8px)', R3);
  // ① 시계 창을 실제로 열고 닫음 → 그 뒤 매입 탭 풀 목록·매입처 카드
  const clk = await p.evaluate(async () => { const i = document.createElement('input'); i.type = 'time'; i.value = '09:30'; document.body.appendChild(i); clkOpen(i); await new Promise((r) => setTimeout(r, 200)); const c = document.querySelector('.clk-bg > .clk'); const cs = c && getComputedStyle(c); const r = c ? { w: Math.round(c.getBoundingClientRect().width), br: cs.borderTopLeftRadius, sh: cs.boxShadow !== 'none' } : null; clkClose(); i.remove(); return { r, css: !!document.getElementById('clk_css') }; });
  ok(clk.css && clk.r && clk.r.w >= 300 && clk.r.w <= 330 && clk.r.br === '22px' && clk.r.sh, '① 시계 창은 그대로 330px 둥근 카드', clk);
  for (const w of [1400, 390]) { await p.setViewportSize({ width: w, height: w > 500 ? 900 : 844 });
    await go('purchase'); await p.evaluate(() => { const d = document.querySelector('[data-sec="pu_pools"]'); if (d && !d.open) d.querySelector('summary').click(); }); await W(700);
    const pl = await p.evaluate(() => [...document.querySelectorAll('[data-sec="pu_pools"] .list > .item')].map((x) => { const cs = getComputedStyle(x); return { c: x.className, w: Math.round(x.getBoundingClientRect().width), pw: Math.round(x.parentElement.getBoundingClientRect().width), br: cs.borderTopLeftRadius, sh: cs.boxShadow }; }));
    ok(pl.length >= 5 && pl.some((x) => /clk/.test(x.c)) && pl.every((x) => x.w >= x.pw - 4 && x.br === '0px' && (x.sh === 'none' || /^rgba\(0, 0, 0, 0\)/.test(x.sh))), `① ${w} 미등록 보유 상품 줄(알라딘구매풀·헌옷도라이 포함)이 모두 같은 폭·평평`, pl);
    await p.evaluate(() => openSuppliers()); await W(900);
    const sc = await p.evaluate(() => [...document.querySelectorAll('#sheet .sup-card')].map((x) => { const cs = getComputedStyle(x); return { w: Math.round(x.getBoundingClientRect().width), sw: document.getElementById('sheet').clientWidth, br: cs.borderTopLeftRadius, sh: cs.boxShadow }; }));
    ok(sc.length >= 2 && sc.every((x) => x.w > x.sw * 0.85 && x.br !== '22px' && !/0px 12px 40px/.test(x.sh)), `① ${w} 🏪 매입처 카드가 화면 폭을 다 씀(좁은 기둥·떠 있는 그림자 없음)`, sc);
    await shut(); await go('purchase'); await p.evaluate(() => openPurAll()); await W(900);
    const pa = await p.evaluate(() => [...document.querySelectorAll('#sheet .item.clk')].map((x) => Math.round(x.getBoundingClientRect().width / x.parentElement.getBoundingClientRect().width * 100)));
    ok(pa.length >= 1 && pa.every((x) => x >= 95), `① ${w} 매입 전체 목록 줄(.item.clk) 폭`, pa); }
  // ② 늦은 CSS 모두 넣고 모든 탭·상세 훑기
  await p.evaluate(() => { for (const f of ['clkCss', 'pgdCss', 'fxCss', 'bcCss', 'shipQCss', 'smCss', 'lostCss', 'updCss', 'buypCss']) { try { eval(f + '()'); } catch (e) {} } });
  const SC = []; for (const t of ['search', 'products', 'sellers', 'orders', 'purchase', 'biz', 'market', 'projects', 'settings']) SC.push([t, () => go(t), '#main']);
  const det = (n, tab, fn) => SC.push([n, async () => { await go(tab); await p.evaluate(fn); await W(900); }, '#sheet']);
  det('매입처', 'purchase', () => openSuppliers()); det('매입처 상세', 'purchase', () => openSupplier('ms')); det('알라딘 구매 풀', 'purchase', () => document.querySelector('[data-drill="aopool"]').click()); det('헌옷도라이 계산', 'purchase', () => openHdCalc());
  det('통합 장부', 'products', () => openLedger()); det('등록', 'products', () => openRegister()); det('출고', 'orders', () => openShip()); det('수동 일괄', 'products', () => openBatch()); det('재고 품목', 'products', () => openStockView());
  det('품목별 매입가', 'purchase', () => openPurItems()); det('매입 전체 목록', 'purchase', () => openPurAll()); det('김미소 문서', 'purchase', () => openKimiso()); det('상품 전체', 'products', () => openProdAll()); det('주문 상품 전체', 'orders', () => openOrdAll()); det('문제 상품', 'products', () => openProblems());
  const found = [];
  for (const w of [1400, 390]) { await p.setViewportSize({ width: w, height: w > 500 ? 900 : 844 });
    for (const [n, f, root] of SC) { try { await f(); } catch (e) { found.push(`${w} ${n}: 열기 실패 ${String(e.message).slice(0, 60)}`); continue; }
      if (n === 'purchase') { await p.evaluate(() => { const d = document.querySelector('[data-sec="pu_pools"]'); if (d && !d.open) d.querySelector('summary').click(); }); await W(600); }
      const r = await p.evaluate((root) => window.__aud(root), root); if (r === null) found.push(`${w} ${n}: 화면 없음`); else r.forEach((x) => found.push(`${w} ${n}: ${x}`)); } }
  ok(found.length === 0, `② 모든 탭·상세(${SC.length}곳 × 넓은 화면·휴대폰) 깨짐 0`, found);
  ok(!errs.length, '페이지 오류 없음', errs.slice(0, 5));
  console.log(bad ? `❌ ${bad}개 실패` : '✅ tGLITCH1111 모두 통과'); if (bad) process.exitCode = 1; });
let R3;
