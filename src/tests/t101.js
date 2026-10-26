// 📖 등록 백과 — 열기·단추·Alt+G·찾기(동의어)·항목 이동·바로 가기·Esc·기억·휴대폰 폭
const phone = process.argv[2] === 'phone';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const r = {};
  await p.evaluate(async () => { localStorage.removeItem('rn-rgen'); S.regItems = S.regItems || new Map(); const t = new Date().toISOString();
    const mk = (id, stage, method, extra) => ({ id, stage, method, isbn: '979000000' + id.length + '777', info: { title: '백과시험 ' + id, isbn13: '9790000000777', itemId: '7' + id.length, categories: [{ path: ['국내도서', '소설'] }], page1: [{ price: 7000, grade: '상', sellerCode: '1' }], priceList: 10000, at: t }, grade: 2, qty: 1, price: 8000, by: S.user.email, ws: regWsCur(), createdAt: t, ...(extra || {}) });
    for (const d of [mk('s1', 'sel', 'bulk'), mk('p1', 'pick', 'bulk'), mk('p2', 'pick', 'one'), { id: 'q1', stage: 'q', q: '9788937460449', isbn: '9788937460449', by: S.user.email, ws: regWsCur(), createdAt: t }]) { await db.collection('reg_items').doc(d.id).set(d); S.regItems.set(d.id, d); }
    S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1800);
  // ① 단추가 ⌨ 바로 옆
  r.btn = await p.evaluate(() => { const b = document.querySelector('#sheet > .sh .rgenbtn'); const kb = document.querySelector('#sheet > .sh .kbbtn'); return !!b && !!kb && kb.nextElementSibling === b; });
  // ② 누르면 열림 · 같은 단추로 닫힘
  await p.evaluate(() => document.querySelector('#sheet > .sh .rgenbtn').click()); await p.waitForTimeout(300);
  r.open1 = await p.evaluate(() => ({ on: !!document.querySelector('.rgen'), mode: (document.querySelector('.rgen') || {}).className, dock: document.documentElement.classList.contains('rgen-dock'), home: !!document.querySelector('.rgen-home'), btnOn: document.querySelector('.rgenbtn').classList.contains('on'), toc: document.querySelectorAll('.rgen-toc button[data-rgenid]').length }));
  await p.evaluate(() => document.querySelector('#sheet > .sh .rgenbtn').click()); await p.waitForTimeout(200);
  r.close1 = await p.evaluate(() => !document.querySelector('.rgen') && !document.documentElement.classList.contains('rgen-dock'));
  // ③ Alt+G 켜고 끄기 (입력 칸 안에서도)
  await p.evaluate(() => document.getElementById('rg_in').focus()); await p.keyboard.press('Alt+KeyG'); await p.waitForTimeout(250);
  r.altOpen = await p.evaluate(() => !!document.querySelector('.rgen') && document.getElementById('rg_in').value === '');
  await p.keyboard.press('Alt+KeyG'); await p.waitForTimeout(200); r.altClose = await p.evaluate(() => !document.querySelector('.rgen'));
  await p.keyboard.press('Alt+KeyG'); await p.waitForTimeout(250);
  // ④ 자료 검사: 관련 항목·그림·필드
  r.data = await p.evaluate(() => { const D = rgenData(); const ids = new Set(); const bad = []; let n = 0; D.forEach((c) => { ids.add(c.id); c.items.forEach((it) => { if (ids.has(it.id)) bad.push('dup ' + it.id); ids.add(it.id); n++; }); }); D.forEach((c) => c.items.forEach((it) => { (it.r || []).forEach((x) => { if (!ids.has(x)) bad.push(it.id + '→' + x); }); if (!it.d) bad.push('no d ' + it.id); if (it.f && !rgenFig(it.f).startsWith('<svg')) bad.push('fig ' + it.f); })); return { n, ch: D.length, bad }; });
  // ⑤ 찾기 — 동의어·단축키
  const srch = async (q) => { await p.fill('.rgen-q', q); await p.waitForTimeout(350); return p.evaluate(() => [...document.querySelectorAll('.rgen-sr [data-rgenid]')].map((b) => b.dataset.rgenid)); };
  r.sSet = (await srch('세트')).includes('new-make');
  r.sImg = (await srch('이미지')).includes('ph-slot');
  r.sAltP = (await srch('Alt+P'))[0] === 'card-price';
  r.sBr = (await srch('[세트]')).includes('new-make');
  await srch('ㅋㅋㅋ없는말'); r.sNone = await p.evaluate(() => document.querySelectorAll('.rgen-sr .rgen-li').length === 0 && /찾은 항목이 없음/.test(document.querySelector('.rgen-a').textContent));
  await srch('관리 코드'); r.mark = await p.evaluate(() => { document.querySelector('.rgen-sr [data-rgenid]').click(); return null; }); await p.waitForTimeout(150);
  r.art = await p.evaluate(() => ({ h3: (document.querySelector('.rgen-a h3') || {}).textContent, marks: document.querySelectorAll('.rgen-a mark').length, q: document.querySelector('.rgen-q').value }));
  // ⑥ 항목 이동 — 목차 · 관련 · 다음 · ◀
  await p.evaluate(() => rgenShow('look-in')); await p.waitForTimeout(100);
  r.item = await p.evaluate(() => ({ h3: document.querySelector('.rgen-a h3').textContent, rows: document.querySelectorAll('.rgen-a .rgen-row').length, go: !!document.querySelector('[data-rgengo="look-in"]'), kbd: document.querySelectorAll('.rgen-a kbd').length }));
  await p.evaluate(() => document.querySelector('.rgen-a .rgen-rel').click()); await p.waitForTimeout(100);
  r.rel = await p.evaluate(() => RGEN.cur); await p.evaluate(() => document.querySelector('[data-rgen="back"]').click()); r.back = await p.evaluate(() => RGEN.cur);
  // ⑦ 바로 가기 — 검색창으로 · 탭 바꾸기
  await p.evaluate(() => { window._tl = []; const o = window.toast; window.toast = (m, x) => { window._tl.push(String(m)); return o(m, x); }; document.querySelector('[data-rgengo="look-in"]').click(); }); await p.waitForTimeout(900); r.goToasts = await p.evaluate(() => window._tl);
  r.goIn = await p.evaluate(() => { const o = document.querySelector('.rgen-hl'); const e = document.getElementById('rg_in'); if (!o || !e) return false; const a = o.getBoundingClientRect(), b = e.getBoundingClientRect(); return o.style.display === 'block' && Math.abs(a.left + 4 - b.left) < 3 && Math.abs(a.top + 4 - b.top) < 3; });
  await p.evaluate(() => rgenShow('send-bulk')); await p.evaluate(() => document.querySelector('[data-rgengo="send-bulk"]').click()); await p.waitForTimeout(1500);
  r.goTab = await p.evaluate(() => { const o = document.querySelector('.rgen-hl'); const e = document.getElementById('rg_confirm'); const a = o && o.getBoundingClientRect(), b = e && e.getBoundingClientRect(); return { T: S.regT, flash: !!(o && e && o.style.display === 'block' && Math.abs(a.top + 4 - b.top) < 3) }; });
  // 모든 바로 가기 훑기 (없으면 miss 글이 있는지)
  r.goAll = await p.evaluate(async () => { const out = { found: 0, miss: [] }; const L = []; rgenData().forEach((c) => c.items.forEach((it) => it.go && L.push(it))); for (const it of L) { const g = it.go; if (g.tab) { const b = document.querySelector(`#sheet [data-rgt="${g.tab}"]`); if (b && !b.classList.contains('on')) { b.click(); await new Promise((r2) => setTimeout(r2, 350)); } } if (g.sub) { const b = document.querySelector(`#sheet [data-rgmf="${g.sub}"]`); if (b && !b.classList.contains('on')) { b.click(); await new Promise((r2) => setTimeout(r2, 350)); } } const el = g.sel ? [...document.querySelectorAll('#sheet ' + g.sel.split(',').join(', #sheet '))].find((x) => x.getClientRects().length) : document.querySelector('#sheet .btabs'); if (el) out.found++; else out.miss.push(it.id + (g.miss ? '' : '(miss글 없음)')); } return out; });
  // ⑧ Esc 닫힘 · 다시 열면 기억
  await p.evaluate(() => { document.activeElement && document.activeElement.blur(); rgenShow('code-sku'); }); await p.waitForTimeout(400);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); r.esc = await p.evaluate(() => !document.querySelector('.rgen') && !!(S.detail && S.detail.reg));
  await p.keyboard.press('Alt+KeyG'); await p.waitForTimeout(300); r.mem = await p.evaluate(() => RGEN.cur);
  // ⑨ 등록 화면 다시 그려도 창·단추 그대로 · 바깥 눌러도 안 닫힘
  await p.evaluate(() => { regRerender(); }); await p.waitForTimeout(600); const hp = await p.evaluate(() => { const b = document.querySelector('.rgsearch-h small').getBoundingClientRect(); return { x: b.left + 5, y: b.top + b.height / 2 }; }); await p.mouse.click(hp.x, hp.y); await p.waitForTimeout(200);
  r.stay = await p.evaluate(() => !!document.querySelector('.rgen') && document.querySelector('#sheet > .sh .rgenbtn.on') != null);
  // ⑩ 띄우기 모드 · 끌어 옮기기
  await p.evaluate(() => document.querySelector('[data-rgen="mode"]').click()); await p.waitForTimeout(200);
  const hb = await p.evaluate(() => { const r0 = document.querySelector('.rgen-h > span').getBoundingClientRect(); return { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2, m: RGEN.mode, dock: document.documentElement.classList.contains('rgen-dock') }; });
  await p.mouse.move(hb.x, hb.y); await p.mouse.down(); await p.mouse.move(hb.x - 300, hb.y + 80, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(100);
  r.float = { m: hb.m, dock: hb.dock, saved: await p.evaluate(() => rgenLs().fx) };
  await p.evaluate(() => { document.querySelector('[data-rgen="mode"]').click(); }); await p.waitForTimeout(100);
  // ⑪ 화면 닫으면 함께 닫힘
  await p.evaluate(() => history.back()); await p.waitForTimeout(700); r.closeWithSheet = await p.evaluate(() => !document.querySelector('.rgen') && !document.documentElement.classList.contains('rgen-dock'));
  // ⑫ 휴대폰 폭
  await p.setViewportSize({ width: 390, height: 800 }); await p.evaluate(() => { openRegister(); }); await p.waitForTimeout(900); await p.evaluate(() => rgenOpen('start-1')); await p.waitForTimeout(300);
  r.phone = await p.evaluate(() => { const e = document.querySelector('.rgen'); const b = e.getBoundingClientRect(); const a = document.querySelector('.rgen-a'); return { m: RGEN.mode, w: Math.round(b.width), bottom: Math.round(window.innerHeight - b.bottom), hscroll: a.scrollWidth - a.clientWidth, sz: getComputedStyle(document.querySelector('.rgen-sz')).display !== 'none', btn: !!document.querySelector('#sheet > .sh .rgenbtn'), fig: !!document.querySelector('.rgen-fig svg') }; });
  await p.evaluate(() => document.querySelector('[data-rgen="toc"]').click()); r.phToc = await p.evaluate(() => getComputedStyle(document.querySelector('.rgen-toc')).display === 'block');
  await p.evaluate(() => document.querySelector('.rgen-toc button[data-rgenid="kbd-all"]').click()); r.phTocSel = await p.evaluate(() => RGEN.cur === 'kbd-all' && !document.querySelector('.rgen').classList.contains('tocon'));
  await p.evaluate(() => rgenClose());
  console.log(JSON.stringify(r, null, 1), 'errs', errs.join(' | '));
  const ok = r.btn && r.open1.on && r.open1.dock && r.open1.home && r.open1.btnOn && r.open1.toc > 100 && r.close1 && r.altOpen && r.altClose && !r.data.bad.length && r.data.n > 100 && r.sSet && r.sImg && r.sAltP && r.sBr && r.sNone && r.art.marks > 0 && !r.art.q && r.item.rows >= 4 && r.item.go && r.rel && r.back === 'look-in' && r.goIn && r.goTab.T === 'pick' && r.goTab.flash && !r.goAll.miss.some((x) => /miss글 없음/.test(x)) && r.esc && r.mem === 'code-sku' && r.stay && r.float.m === 'float' && !r.float.dock && r.float.saved != null && r.closeWithSheet && r.phone.m === 'sheet' && r.phone.w === 390 && r.phone.bottom === 0 && r.phone.hscroll <= 1 && r.phone.sz && r.phone.btn && r.phone.fig && r.phToc && r.phTocSel && !errs.length;
  console.log(ok ? '✓ t101 통과' : '❌ t101 실패');
});
