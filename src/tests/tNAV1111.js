// tNAV1111 — (11/11 nav1 · 정범님 11/11 「어떤 것이든 미로 속에 가둬 놓지 마 · 연관된 것끼리 모아 · 원하면 바로 접근」)
//  ① 탭 차례 = 일의 흐름(홈·매입·상품·판매처·주문·매출·고객·경영·연구·시장조사·판매자·프로젝트) ② 탭마다 맨 위 🧭 묶음 카드 줄(카드 수 = NAV_HUB) ③ 🔬 연구 · 🛒 판매처 탭
//  ④ 모든 🚪 상세 페이지 바로 가기(GO_PAGES)가 어느 탭 묶음에 있음 ⑤ 모든 🔍 기능 찾기 항목이 2번 누름 안(탭 → 카드 / 탭 → 칸) ⑥ 카드를 눌러 실제로 열림 ⑦ 접기 기억 ⑧ 홈 🧭 모든 화면 지도
//  ⑨ 휴대폰 390px — 아래 탭 5칸(⋯ 안에 판매처·연구) · 묶음 줄은 한 줄 옆으로 밀기 · 화면 밖으로 안 넘침
//  화면 사진: NAV_SHOT=<폴더> 이면 탭마다 PC·휴대폰 사진
const G = (f) => async (p) => { try { await f(p); } catch (e) { bad++; console.log('  ❌ 시험 멈춤:', String(e.message).slice(0, 300)); } };
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const SHOT = process.env.NAV_SHOT || ''; const shot = async (p, n) => { if (SHOT) await p.screenshot({ path: `${SHOT}/${n}.png` }); };
const draw = (p, t) => p.evaluate((t) => { S.q = ''; S.tab = t; renderTabs(); renderMainNow(); afterRender(); }, t);
const shut = (p) => p.evaluate(async () => { try { document.querySelectorAll('.bigask-ov').forEach((x) => x.remove()); LBL_OV = null; } catch (e) {} for (let i = 0; i < 4 && S.detail; i++) { try { closeDetail(); } catch (e) { break; } await new Promise((r) => setTimeout(r, 60)); } try { S.navStack.length = 0; } catch (e) {} try { closeModal(); } catch (e) {} });
require('./harness.js')(G(async (p) => {
  await p.evaluate(require('./seed.js')); await p.evaluate(() => { try { localStorage.setItem('rn-pfold-open', '1'); } catch (e) {} }); /* (rel10) 11/12 ledger2가 상품 화면 칸·🧭 상품 묶음을 처음엔 접게 바꿈 — 이 시험은 묶음 줄 자체를 보므로 ⚙ 📚 '처음에 펼치기'(예전 그대로)로 봄 */ await p.waitForTimeout(500);
  // ① 탭 차례
  const tabs = await p.evaluate(() => { localStorage.removeItem('rn-navhub-fold'); S.tab = 'home'; renderTabs(); return [...document.querySelectorAll('#tabs > button[data-tab]')].map((b) => b.dataset.tab); });
  ok(tabs.join() === 'home,purchase,products,ledger,channels,orders,search,biz,research,market,sellers,projects', '① 탭 차례 = 일의 흐름 · 새 탭 🧾 통합 장부 · 🛒 판매처 · 🔬 연구', tabs);
  // ①-2 🧾 통합 장부 = 탭 줄 한 번에 열림 (정범님 11/11 15시)
  await p.evaluate(() => document.querySelector('#tabs [data-tab="ledger"]').click()); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector('#sheet.on') && S.detail && S.detail.bigTable === 'ledger' && S.tab === 'home'), '①-2 🧾 통합 장부 탭 한 번 = 통합 장부 화면(본문 탭은 그대로)'); await shut(p);
  await draw(p, 'home'); await p.waitForTimeout(500); ok(await p.evaluate(() => !!document.querySelector('#main [data-w="ledger"], #main [data-navgo="ledger"]') && homeLayout('admin').indexOf('ledger') === homeLayout('admin').indexOf('alerts') + 1), '①-3 홈 첫 화면에 🧾 통합 장부 칸(알림 바로 아래)');
  await draw(p, 'channels'); await p.waitForTimeout(300); ok(await p.evaluate(() => { const h = document.querySelector('#main .np-hero[data-navgo="ledger"]'); const c = document.querySelector('#main .np-c'); return !!h && !!c && h.getBoundingClientRect().top < c.getBoundingClientRect().top; }), '①-4 🛒 판매처 탭 맨 위 큰 카드 = 🧾 통합 장부');
  ok(await p.evaluate(() => [...document.querySelectorAll('#tabs > button')].filter((b) => getComputedStyle(b).display !== 'none' && !b.dataset.tab).length === 0), '① PC 탭 줄 끝에 ⋯ 더 보기가 보이지 않음');
  // ② 탭마다 묶음 카드 줄
  const want = await p.evaluate(() => Object.fromEntries(Object.keys(NAV_HUB).map((k) => [k, navGroups(k).reduce((a, x) => a + x[1].length, 0)])));
  const cnt = {};
  for (const t of ['purchase', 'products', 'orders', 'search', 'biz', 'market', 'sellers', 'projects', 'settings']) {
    await draw(p, t); await p.waitForTimeout(t === 'biz' || t === 'products' || t === 'market' ? 1600 : 500); await p.evaluate(() => afterRender());
    const r = await p.evaluate(() => { const m = document.getElementById('main'); const h = m.querySelector(':scope > .navhub'); let f = m.firstElementChild; while (f && f !== h && f.matches(NAV_LEAD)) f = f.nextElementSibling; return { first: !!h && f === h, n: h ? h.querySelectorAll('[data-navgo]').length : 0, g: h ? h.querySelectorAll('.nh-g').length : 0 }; });
    cnt[t] = r.n; ok(r.first && r.n === want[t] && r.n >= 1, `② ${t} 탭 맨 위 묶음 줄 — 카드 ${r.n}개 · 묶음 ${r.g}개`, { r, want: want[t] }); await shot(p, 'pc_' + t);
  }
  ok(cnt.products >= 25 && cnt.purchase >= 12 && cnt.orders >= 10 && cnt.biz >= 12, '② 큰 탭(상품·매입·주문·경영)은 화면 대부분을 묶음 줄에', cnt);
  // ③ 연구 · 판매처 탭
  for (const [t, min, must] of [['research', 12, ['voice', 'benchCase', 'mkEvid', 'wx', 'mkSp', 'extHub']], ['channels', 9, ['ledger', 'y24Reg', 'y24All', 'y24Link', 'naver', 'alTerms', 'facts']]]) {
    await draw(p, t); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const m = document.getElementById('main'); return { page: !!m.querySelector(':scope > .navpage'), keys: [...m.querySelectorAll('.np-c[data-navgo]')].map((b) => b.dataset.navgo), hub: !!m.querySelector(':scope > .navhub:not(.navpage)') }; });
    ok(r.page && !r.hub && r.keys.length >= min && must.every((k) => r.keys.includes(k)), `③ ${t} 탭 = 묶음 카드 화면 (${r.keys.length}개)`, r); await shot(p, 'pc_' + t);
  }
  // ④ 모든 🚪 바로 가기가 어느 탭 묶음에
  const miss = await p.evaluate(() => { const H = new Set(Object.values(NAV_HUB).flatMap((g) => g.flatMap((x) => x[1]))); return GO_PAGES.map((g) => g[0]).filter((k) => !H.has(k)); });
  ok(miss.length === 0, '④ 🚪 상세 페이지 바로 가기 모두가 어느 탭 묶음 카드에 있음', miss);
  // ⑤ 🔍 기능 찾기 — 2번 누름 안
  const reach = await p.evaluate(() => { const L = typeof featIndex === 'function' ? featIndex() : FEAT; const opens = (f) => [...new Set((String(f).match(/\bopen[A-Z]\w*/g) || []))];
    const hubFns = new Set(Object.keys(NAV_HUB).flatMap((t) => navGroups(t).flatMap((x) => x[1].flatMap((it) => opens(it.run)))));
    const HEAD = ['openManual', 'openMgr', 'openAuto']; /* 머리줄 단추 = 1번 */ const CTX = ['openProduct', 'openAlert', 'openBenchVs', 'openBench', 'openCustomer', 'openSeller', 'openBook', 'openTabOrder']; /* 그 기록(상품·알림·판매자)을 누르면 열리는 화면 */
    const tabOk = new Set([...document.querySelectorAll('#tabs [data-tab]')].map((b) => b.dataset.tab).concat(['settings', 'pending', 'mgr', 'flags']));
    const bad = []; const n = { tab: 0, hub: 0, head: 0, ctx: 0, inplace: 0 };
    for (const f of L) { const g = f.go || {}; if (g.tab) { if (tabOk.has(g.tab)) n.tab++; else bad.push(f.t + ' → 탭 ' + g.tab); continue; } if (!g.fn) continue; const o = opens(g.fn);
      if (!o.length) { n.inplace++; continue; } if (o.some((x) => hubFns.has(x))) n.hub++; else if (o.some((x) => HEAD.includes(x))) n.head++; else if (o.some((x) => CTX.includes(x))) n.ctx++; else bad.push(f.t.slice(0, 40) + ' → ' + o.join(',')); }
    return { all: L.length, n, bad }; });
  ok(reach.bad.length === 0, `⑤ 🔍 기능 찾기 ${reach.all}개 모두 2번 누름 안 — 탭 → 칸 ${reach.n.tab} · 탭 → 묶음 카드 ${reach.n.hub} · 머리줄 ${reach.n.head} · 그 기록 안 ${reach.n.ctx} · 그 자리 기능 ${reach.n.inplace}`, reach.bad);
  // ⑥ 카드를 눌러 실제로 열림 (탭 → 카드 = 2번)
  const errs0 = await p.evaluate(() => (window.__navErr = [], window.addEventListener('error', (e) => window.__navErr.push(String(e.message))), 0));
  const fails = []; let opened = 0;
  for (const t of ['purchase', 'products', 'channels', 'orders', 'biz', 'research', 'market', 'settings']) {
    await draw(p, t); await p.waitForTimeout(300);
    const keys = await p.evaluate(() => [...document.querySelectorAll('#main [data-navgo]')].map((b) => b.dataset.navgo));
    for (const k of keys) { if (['friendResearch', 'naver'].includes(k)) continue; if (t !== 'products' && t !== 'channels' && t !== 'research' && ['register', 'ledger', 'y24Reg', 'y24All', 'y24Link', 'prodAll', 'stockView', 'voice', 'benchCase', 'facts'].includes(k)) continue; /* 같은 화면은 한 탭에서 한 번만 */
      await p.evaluate(() => { window.__tc = document.querySelectorAll('.toast').length; window.__te = [...document.querySelectorAll('.toast')].filter((x) => /열지 못함/.test(x.textContent)).length; });
      const has = await p.evaluate((k) => { const b = document.querySelector(`#main [data-navgo="${k}"]`); if (!b) return false; b.click(); return true; }, k); if (!has) { fails.push(t + ':' + k + ' 단추 없음'); continue; }
      await p.waitForTimeout(350);
      const r = await p.evaluate(() => ({ sheet: !!document.querySelector('#sheet.on'), modal: !!document.querySelector('#modal.on'), lbl: !!document.querySelector('.bigask-ov'), tab: S.tab, sec: Object.keys(S.sec || {}).length, toast: document.querySelectorAll('.toast').length > window.__tc, err: [...document.querySelectorAll('.toast')].filter((x) => /열지 못함/.test(x.textContent)).length > window.__te }));
      if (r.err) { r.errTxt = await p.evaluate(() => [...document.querySelectorAll('.toast')].map((x) => x.textContent).filter((s) => /열지 못함/.test(s)).join(' | ')); await shut(p); await p.waitForTimeout(2600); await p.evaluate(() => { window.__te = [...document.querySelectorAll('.toast')].filter((x) => /열지 못함/.test(x.textContent)).length; document.querySelector(`#main [data-navgo]`) || renderMainNow(); }); /* 늦게 온 앞 화면 알림일 수 있어 한 번 더 */ if (await p.evaluate((t) => S.tab !== t, t)) await draw(p, t); await p.evaluate((k) => { const b = document.querySelector(`#main [data-navgo="${k}"]`); if (b) b.click(); }, k); await p.waitForTimeout(400); const e2 = await p.evaluate(() => [...document.querySelectorAll('.toast')].filter((x) => /열지 못함/.test(x.textContent)).length > window.__te); if (!e2) { console.log('  · (늦게 온 알림으로 보임 — 다시 눌러 열림)', t + ':' + k, r.errTxt); r.err = false; } }
      if (r.err || !(r.sheet || r.modal || r.lbl || r.toast || r.tab !== t)) fails.push(t + ':' + k + ' ' + JSON.stringify(r)); else opened++;
      await shut(p); await p.waitForTimeout(80); if (await p.evaluate((t) => S.tab !== t, t)) { await draw(p, t); await p.waitForTimeout(200); }
    }
  }
  const jsErr = await p.evaluate(() => window.__navErr.filter((m) => !/js-profiling|ResizeObserver/.test(m)));
  ok(fails.length === 0 && opened >= 80, `⑥ 탭 → 카드 눌러 화면 ${opened}개가 실제로 열림`, fails.slice(0, 12));
  ok(jsErr.length === 0, '⑥ 여는 동안 화면 오류 없음', jsErr.slice(0, 5));
  // ⑦ 접기 기억
  await draw(p, 'biz'); await p.waitForTimeout(1500); await p.evaluate(() => afterRender());
  await shut(p); await p.evaluate(() => document.querySelector('#main > .navhub [data-nhfold]').click()); await p.waitForTimeout(200);
  const f1 = await p.evaluate(() => ({ body: !!document.querySelector('#main > .navhub .nh-body'), saved: JSON.parse(localStorage.getItem('rn-navhub-fold') || '{}').biz }));
  await draw(p, 'products'); await p.waitForTimeout(800); const pOpen = await p.evaluate(() => !!document.querySelector('#main > .navhub .nh-body'));
  await draw(p, 'biz'); await p.waitForTimeout(1500); await p.evaluate(() => afterRender()); const f2 = await p.evaluate(() => !!document.querySelector('#main > .navhub .nh-body'));
  ok(!f1.body && f1.saved === true && pOpen && !f2, '⑦ 접기 = 그 탭만 · 이 기기에 기억', { f1, pOpen, f2 });
  await shut(p); await p.evaluate(() => document.querySelector('#main > .navhub [data-nhfold]').click()); await p.waitForTimeout(200); ok(await p.evaluate(() => !!document.querySelector('#main > .navhub .nh-body')), '⑦ 다시 펼치기');
  // ⑧ 홈 🧭 모든 화면 지도
  await draw(p, 'home'); await p.waitForTimeout(500);
  const hm = await p.evaluate(() => { const h = document.querySelector('#main > .navmap'); return { has: !!h, folded: h && !h.querySelector('.nm-body') }; });
  ok(hm.has && hm.folded, '⑧ 홈 맨 위 🧭 모든 화면 지도 — 처음엔 접힌 한 줄(홈 배치 그대로)', hm);
  await p.evaluate(() => document.querySelector('#main > .navmap [data-nhfold]').click()); await p.waitForTimeout(200);
  const hm2 = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('#main > .navmap [data-navtab]')].map((b) => b.dataset.navtab), n: new Set([...document.querySelectorAll('#main > .navmap [data-navgo]')].map((b) => b.dataset.navgo)).size, go: GO_PAGES.length }));
  ok(hm2.tabs.includes('research') && hm2.tabs.includes('channels') && hm2.tabs.includes('settings') && hm2.n >= hm2.go, '⑧ 펼치면 탭마다 묶음 — 모든 화면', hm2); await shot(p, 'pc_home_map');
  await p.evaluate(() => document.querySelector('#main > .navmap [data-navtab="research"]').click()); await p.waitForTimeout(400); ok(await p.evaluate(() => S.tab === 'research'), '⑧ 지도의 탭 이름 → 그 탭');
  await p.evaluate(() => localStorage.removeItem('rn-navhub-fold'));
  // 🔍 기능 찾기에 새 탭
  ok(await p.evaluate(() => featFind('소비심리').length > 0 && featFind('판매처 탭').some((f) => f.go && f.go.tab === 'channels') && featFind('화면 지도').length > 0), '🔍 기능 찾기: 판매처 탭·연구 탭·화면 지도');
}), { vp: { width: 1400, height: 900 } }).then(() => require('./harness.js')(G(async (p) => {
  // ⑨ 휴대폰 390px
  await p.evaluate(require('./seed.js')); await p.evaluate(() => { try { localStorage.setItem('rn-pfold-open', '1'); } catch (e) {} }); /* (rel10) 11/12 ledger2가 상품 화면 칸·🧭 상품 묶음을 처음엔 접게 바꿈 — 이 시험은 묶음 줄 자체를 보므로 ⚙ 📚 '처음에 펼치기'(예전 그대로)로 봄 */ await p.waitForTimeout(600); await p.evaluate(() => { localStorage.removeItem('rn-navhub-fold'); localStorage.removeItem('rn-ux2'); S.tab = 'home'; renderTabs(); renderMainNow(); afterRender(); });
  const tb = await p.evaluate(() => [...document.querySelectorAll('#tabs > button')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.dataset.tab || 'more'));
  ok(tb.join() === 'home,purchase,products,ledger,orders,more', '⑨ 휴대폰 아래 탭 = 홈·매입·상품·🧾 통합 장부·주문·⋯', tb);
  await p.click('[data-ux2tmore]'); await p.waitForTimeout(200);
  const mm = await p.evaluate(() => [...document.querySelectorAll('#ux2tmenu [data-ux2tgo]')].map((b) => b.dataset.ux2tgo));
  ok(mm.includes('channels') && mm.includes('research'), '⑨ ⋯ 안에 🛒 판매처 · 🔬 연구', mm); await p.click('#ux2tmenu [data-ux2tgo="research"]'); await p.waitForTimeout(500);
  const rs = await p.evaluate(() => { const c = [...document.querySelectorAll('#main .np-c')]; const xs = new Set(c.slice(0, 4).map((x) => Math.round(x.getBoundingClientRect().left))); return { n: c.length, cols: xs.size, fit: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(rs.n >= 12 && rs.cols === 2 && rs.fit, '⑨ 🔬 연구 탭 — 카드 두 줄씩 · 화면 밖으로 안 넘침', rs); await shot(p, 'ph_research');
  for (const t of ['purchase', 'products', 'orders', 'biz', 'channels', 'settings']) {
    await p.evaluate((t) => { S.tab = t; renderTabs(); renderMainNow(); afterRender(); }, t); await p.waitForTimeout(t === 'products' || t === 'biz' ? 1200 : 400); await p.evaluate(() => afterRender());
    const r = await p.evaluate(() => { const h = document.querySelector('#main > .navhub'); if (!h) return null; const b = h.querySelector('.nh-body'); const B = h.querySelector('[data-navgo]').getBoundingClientRect(); return { page: h.classList.contains('navpage'), hh: Math.round(h.getBoundingClientRect().height), scroll: b ? b.scrollWidth > b.clientWidth : null, fit: document.documentElement.scrollWidth <= innerWidth + 1, tap: B.width >= 44 && B.height >= 44 }; });
    ok(r && r.fit && r.tap && (r.page || (r.hh <= 130 && r.scroll)), `⑨ 휴대폰 ${t} — ${r && r.page ? '카드 화면' : '묶음 줄 한 줄(옆으로 밀기) · 높이 ' + (r && r.hh) + 'px'} · 누르기 쉬운 크기`, r); await shot(p, 'ph_' + t);
  }
  await p.evaluate(() => { S.tab = 'products'; renderTabs(); renderMainNow(); afterRender(); }); await p.waitForTimeout(800);
  await p.click('#main > .navhub [data-navgo="stopList"]'); await p.waitForTimeout(500); ok(await p.evaluate(() => !!document.querySelector('#sheet.on')), '⑨ 휴대폰도 탭 → 카드 2번에 화면이 열림');
}), { vp: { width: 390, height: 844 }, touch: true })).then(() => { console.log(bad ? `❌ tNAV1111 실패 ${bad}` : '✓ tNAV1111 통과'); process.exit(bad ? 1 : 0); });
