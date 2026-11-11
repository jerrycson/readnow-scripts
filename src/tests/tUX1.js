// tUX1 — (11/10 ux1 · ux2) 화면 고침: ux2 = ① 알림 자리 ② 빠른 작업 ④ 머리 칸 점 ⑤ 검색 범위 칩 ⑥ 처리할 주문 줄 ⑧ 설정 묶음·찾기 ⑬ errKo · 끄면 예전 그대로 / ux1: ① 아래 탭 그림이 탭마다 다름(판매자=사람 · 매입=상자 · 경영=가방) ② 상품 탭 오른쪽 순위 칸 위쪽이 머리 칸 밑에 깔리지 않음 ③ 빈 응답(JSON) 읽기 실패를 한국어로
const G = (f) => async (p) => { try { await f(p); } catch (e) { bad++; console.log('  ❌ 시험 멈춤:', String(e.message).slice(0, 300)); } }; /* (ux2) 시험 중 멈춤도 실패로 셈 */
const shut = async (p) => { await p.evaluate(() => { try { S.navStack.length = 0; } catch (e) {} if (S.detail) closeDetail(); }); await p.waitForTimeout(400); };
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
require('./harness.js')(G(async (p) => {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  // ① 탭 그림
  const ic = await p.evaluate(() => { S.tab = 'home'; renderTabs(); const g = (k) => { const b = document.querySelector(`#tabs [data-tab="${k}"] svg`); return b ? b.outerHTML : ''; }; return { sellers: g('sellers'), orders: g('orders'), purchase: g('purchase'), biz: g('biz') }; });
  ok(ic.sellers && ic.orders && ic.purchase && ic.biz, '네 탭 모두 그림 있음');
  ok(new Set(Object.values(ic)).size === 4, '판매자·주문·매출·매입·경영 그림이 서로 다름', Object.keys(ic));
  ok(!/M12 3 2 21h20L12 3z/.test(ic.sellers), '판매자 탭이 ⚠ 세모 그림이 아님');
  // ② 순위 칸 위치 (넓은 화면)
  await p.evaluate(() => { S.tab = 'products'; renderTabs(); renderMainNow(); }); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => { const h = document.querySelector('header.top'); const rk = document.querySelector('#rank'); if (!h || !rk || getComputedStyle(rk).display === 'none') return null; return { hb: Math.round(h.getBoundingClientRect().bottom), rt: Math.round(rk.getBoundingClientRect().top), cond: h.classList.contains('cond') }; });
  ok(r && !r.cond && r.rt >= r.hb, '순위 칸 위쪽이 머리 칸 아래에서 시작', r);
  // ③ 읽기 실패 문구
  const t = await p.evaluate(() => [prErrText("Failed to execute 'json' on 'Response': Unexpected end of JSON input", '가격 판정'), prErrText('permission-denied', '가격 판정'), prErrText('xyz', '가격 판정')]);
  ok(/응답이 비었거나 잘려/.test(t[0]) && /원래 오류/.test(t[0]), '빈 응답 오류는 한국어 설명 + 원래 오류', t[0]);
  ok(/권한이 없습니다/.test(t[1]) && /읽기 실패: xyz/.test(t[2]), '다른 오류 문구는 그대로', t.slice(1));
  ok(/권한이 없습니다/.test(t[1]), '권한 오류 문구는 그대로'); /* (ux2) prErrText 끝 갈래는 그대로 둠 */
  // ── (11/10 ux2) ⑬ 공용 errKo
  const ek = await p.evaluate(() => [errKo({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }), errKo(new TypeError('Failed to fetch')), errKo('이미 한국어로 된 실패'), errKo({ code: 'zzz-odd' }), errKo({ code: 'deadline-exceeded' }), errKo(null), errKo({ name: 'QuotaExceededError', message: "Failed to execute 'setItem' on 'Storage': exceeded the quota" })]);
  ok(/^권한 없음/.test(ek[0]) && /\(permission-denied\)/.test(ek[0]), 'errKo: 권한 → 한국어 + (원래 오류)', ek[0]);
  ok(/^연결이 끊김/.test(ek[1]) && /Failed to fetch/.test(ek[1]), 'errKo: Failed to fetch → 연결이 끊김 + 원문', ek[1]);
  ok(ek[2] === '이미 한국어로 된 실패' && /^확인 못 한 오류 \(zzz-odd\)$/.test(ek[3]) && /^시간 초과/.test(ek[4]) && ek[5] === '알 수 없는 오류' && /^기기 저장 공간/.test(ek[6]), 'errKo: 한국어는 그대로 · 모르는 것도 원문을 괄호로 · 시간 초과 · 저장 공간', ek.slice(2));
  ok(await p.evaluate(() => { const s = document.documentElement.innerHTML; return !/' \+ \((e|er|err)\.code \|\| (e|er|err)\.message\)/.test(String(renderMainNow0) + String(openRegister)) && typeof errKo === 'function'; }), '화면 글에 붙이던 (e.code || e.message)를 errKo로 바꿈');
  // ── ② 빠른 작업 · ④ 머리 칸 점 (넓은 화면 · 관리자 아닌 기기)
  await p.evaluate(() => { S.tab = 'home'; S.q = ''; renderTabs(); renderMainNow(); ux2Apply(); }); await p.waitForTimeout(400);
  const hd = await p.evaluate(() => { const h = document.querySelector('header.top'); const vis = (s) => { const e = h.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }; const q = document.getElementById('q').getBoundingClientRect(); const w = document.getElementById('ux2qa'); const wr = w && w.getBoundingClientRect(); return { h: h.offsetHeight, hf: document.documentElement.classList.contains('ux2-hf'), sync: vis('.sync'), colbar: vis('.colbar'), jobs: vis('.jobs'), dot: !!document.getElementById('ux2hdot'), qa: w ? [...w.querySelectorAll('button')].map((b) => b.textContent) : null, sameRow: wr && Math.abs(wr.top - q.top) < 12 }; });
  ok(hd.hf && !hd.sync && !hd.colbar && !hd.jobs && hd.dot, '④ 상태 세 줄이 접히고 이름 옆 점 하나', hd);
  ok(hd.qa && hd.qa.length === 3 && /📥 등록/.test(hd.qa[0]) && /🚚 오늘 출고/.test(hd.qa[1]) && /＋ 매입/.test(hd.qa[2]) && hd.sameRow, '② 검색창 옆에 빠른 작업 3개(넓은 화면은 같은 줄)', hd);
  await p.click('#ux2hdot'); await p.waitForTimeout(200);
  const hd2 = await p.evaluate(() => ({ h: document.querySelector('header.top').offsetHeight, hf: document.documentElement.classList.contains('ux2-hf') }));
  ok(!hd2.hf && hd2.h > hd.h, '④ 점을 누르면 세 줄이 펼쳐짐', [hd.h, hd2.h]); await p.click('#ux2hdot'); await p.waitForTimeout(200);
  const ab = await p.evaluate(() => { const cb = document.getElementById('colbar'); const old = cb.innerHTML; cb.innerHTML = '<span class="ctxt">수집이 멈춰 있음 (시험)</span>'; ux2HdrPaint(); const r = { hf: document.documentElement.classList.contains('ux2-hf'), dot: document.getElementById('ux2hdot').className }; cb.innerHTML = old; S._cbSig = null; ux2HdrPaint(); return { ...r, back: document.documentElement.classList.contains('ux2-hf') }; });
  ok(!ab.hf && /amber/.test(ab.dot) && ab.back, '④ 수집이 멈추면 저절로 펼침 · 다시 정상이면 접힘', ab);
  const adm = await p.evaluate(() => { const o = S.devOk; const d = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; ux2HdrPaint(); const r = document.documentElement.classList.contains('ux2-hf'); S.devOk = o; if (d == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', d); ux2HdrPaint(); return r; });
  ok(!adm, '④ 자동: 관리자 기기(JS-MAIN)는 펼친 채가 기본');
  await p.evaluate(() => { ux2Put('hfold', '0'); ux2Put('quick', 0); ux2Apply(); }); await p.waitForTimeout(200);
  const off = await p.evaluate(() => ({ hf: document.documentElement.classList.contains('ux2-hf'), dot: !!document.getElementById('ux2hdot'), qa: !!document.getElementById('ux2qa'), sync: getComputedStyle(document.querySelector('header.top .sync')).display !== 'none' }));
  ok(!off.hf && !off.dot && !off.qa && off.sync, '②④ 끄면 예전 머리 칸 그대로', off); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); });
  // ② 빠른 작업 누르기
  await p.click('[data-ux2qa="reg"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !!(S.detail && S.detail.reg)), '② 📥 등록 → 등록 화면');
  await shut(p);
  await p.click('[data-ux2qa="ship"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !!(S.detail && S.detail.ship)), '② 🚚 오늘 출고 → 오늘 출고 화면(열기만)');
  await shut(p);
  await p.click('[data-ux2qa="pur"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !!document.querySelector('#sheet.on, #modal.on') && /매입/.test((document.querySelector('#sheet.on') || document.querySelector('#modal.on')).innerText)), '② ＋ 매입 → 새 매입 기록');
  await shut(p);
  // ① 알림 자리
  await p.evaluate(() => { const a = document.createElement('div'); a.id = 'dlp'; a.innerHTML = '<div style="background:#fff;padding:8px">⬇ 시험 받는 중</div>'; document.body.appendChild(a); const b = document.createElement('div'); b.id = 'updpill'; b.textContent = '새 기록 받는 중(시험)'; document.body.appendChild(b); }); await p.waitForTimeout(400);
  const dk = await p.evaluate(() => { const d = document.getElementById('ux2dock'); const t = document.getElementById('tabs').getBoundingClientRect(); const r = (id) => document.getElementById(id).getBoundingClientRect(); const vis = (id) => getComputedStyle(document.getElementById(id)).display !== 'none'; const f = document.getElementById('buyp_fab'); const fr = f && f.getBoundingClientRect(); return { inDock: document.getElementById('dlp').parentElement === d && document.getElementById('updpill').parentElement === d, dockBottom: d.getBoundingClientRect().bottom, tabsTop: t.top, fabTop: fr && fr.width ? fr.top : null, sum: d.querySelector('.ux2dk-sum').hidden ? null : d.querySelector('.ux2dk-sum').textContent, dlpVis: vis('dlp'), updVis: vis('updpill') }; });
  ok(dk.inDock && dk.dockBottom <= dk.tabsTop && (dk.fabTop == null || dk.dockBottom <= dk.fabTop), '① 내려받기 띠·새 기록 받는 중이 한 자리에 — 아래 탭 줄·💰 매입가 단추를 덮지 않음', dk);
  ok(/알림 2가지/.test(dk.sum || '') && !dk.dlpVis && dk.updVis, '① 2가지면 한 줄 요약 + 맨 아래 하나만', dk);
  await p.click('#ux2dock .ux2dk-sum'); await p.waitForTimeout(200); ok(await p.evaluate(() => ['dlp', 'updpill'].every((id) => getComputedStyle(document.getElementById(id)).display !== 'none')), '① 요약을 누르면 모두 보임');
  await p.evaluate(() => { ux2Put('dock', 0); ux2Apply(); }); await p.waitForTimeout(200); ok(await p.evaluate(() => document.getElementById('dlp').parentElement === document.body && !document.getElementById('ux2dock')), '① 끄면 예전 자리(본문 바로 아래)로');
  await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); ['dlp', 'updpill'].forEach((id) => { const x = document.getElementById(id); if (x) x.remove(); }); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const d = document.getElementById('ux2dock'); return !d || d.classList.contains('empty'); }), '① 알림이 없으면 자리도 안 보임');
  // ⑥ 주문 탭 처리할 주문 줄
  await p.evaluate(() => { const it = [{ title: '시험 책', qty: 1, isbn13: '9780000000001' }]; S.shipC = { orders: [{ orderNo: '001-A000000001', items: it }, { orderNo: '001-A000000002', items: it }] }; S.ship = { orders: [{ orderNo: '001-A000000003', items: it }], at: new Date().toISOString() }; S._shipRowsC = null; S.tab = 'orders'; S.q = ''; renderTabs(); renderMainNow(); }); await p.waitForTimeout(500);
  const ob = await p.evaluate(() => { const b = document.querySelector('#main .ux2-ob'); const c = shipCnt().all; const g = (k) => { const x = b && b.querySelector(`[data-ux2ob="${k}"] b`); return x ? +x.textContent.replace(/,/g, '') : null; }; return { first: b && b === document.querySelector('#main').firstElementChild, confirm: g('confirm'), deliv: g('deliv'), exc: g('exc'), c, read: b && /읽음/.test(b.textContent) }; });
  ok(ob.first && ob.confirm === (ob.c.confirm || 0) && ob.deliv === (ob.c.deliv || 0) && ob.confirm === 2 && ob.deliv === 1 && ob.read, '⑥ 주문 탭 맨 위 처리할 주문 줄 = 오늘 출고 단계 칸 수 · 읽은 시각', ob);
  await p.click('[data-ux2ob="confirm"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !!(S.detail && S.detail.ship) && S.shipTab === 'confirm'), '⑥ 누르면 오늘 출고 › 확인할 주문 칸'); await shut(p);
  await p.evaluate(() => { ux2Put('ordbar', 0); renderMainNow(); }); ok(await p.evaluate(() => !document.querySelector('#main .ux2-ob')), '⑥ 끄면 줄이 없음(예전)'); await p.evaluate(() => localStorage.removeItem('rn-ux2'));
  // ⑤ 검색 범위 칩
  await p.evaluate(() => { S.tab = 'products'; renderTabs(); }); await p.fill('#q', 'ㅋㅋ없는책제목ㅋㅋ'); await p.waitForTimeout(1500); await p.evaluate(() => renderMainNow()); await p.waitForTimeout(300);
  const sc = await p.evaluate(() => { const b = document.querySelector('#main .ux2-scope'); return b ? { on: (b.querySelector('button.on') || {}).dataset?.ux2sc, n: b.querySelectorAll('[data-ux2sc]').length, zero: !!b.querySelector('.ux2-sc0') } : null; });
  ok(sc && sc.on === 'products' && sc.n >= 6, '⑤ 검색어가 있으면 결과 위 범위 칩 · 기본은 이 탭', sc);
  await p.click('#main .ux2-scope [data-ux2sc="home"]'); await p.waitForTimeout(900); ok(await p.evaluate(() => S.tab === 'home' && S.unifiedFrom && !!document.querySelector('#main .ux2-scope button.on[data-ux2sc="home"]')), '⑤ 🌐 전체 → 모든 곳 통합 결과');
  await p.click('#main .ux2-scope [data-ux2sc="search"]'); await p.waitForTimeout(900); ok(await p.evaluate(() => S.tab === 'search' && !S.unifiedFrom && S.q === 'ㅋㅋ없는책제목ㅋㅋ'), '⑤ 👥 고객 → 고객 탭(검색어 그대로)');
  await p.fill('#q', ''); await p.waitForTimeout(400); await p.evaluate(() => { S.q = ''; S.tab = 'home'; renderTabs(); renderMainNow(); document.getElementById('q').blur(); });
  await p.keyboard.press('Control+k'); await p.waitForTimeout(150); ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'), '⑤ Ctrl+K = 검색창'); await p.evaluate(() => document.getElementById('q').blur());
  // ⑧ 설정 묶음·찾기
  await p.evaluate(() => { S.tab = 'settings'; renderTabs(); renderMainNow(); }); await p.waitForTimeout(800);
  const sg = await p.evaluate(() => { const m = document.querySelector('#main'); const hs = [...m.querySelectorAll(':scope > .ux2-sgh')].map((h) => h.dataset.ux2sg); const nums = (g) => [...m.children].filter((c) => c.dataset.ux2sg === g && !c.classList.contains('ux2-sgh')).map((c) => ux2Circ(ux2SgTitle(c))).filter((x) => x != null); const kids = [...m.children]; return { hs, ship: nums('ship'), col: nums('col'), price: nums('price'), toc: !!m.querySelector('.ux2-sgtoc #ux2_setq'), bar: kids[0] && kids[0].classList.contains('setbar'), ux2: !!m.querySelector('[data-sec="set_ux2"]') }; });
  const asc = (L) => L.every((x, i) => !i || L[i - 1] <= x);
  ok(sg.hs.slice(0, 7).join() === 'dev,reg,ship,price,col,view,sec' && sg.toc && sg.bar && sg.ux2, '⑧ 설정 7묶음 + 맨 위 설정 찾기 · 🧩 화면 고침 칸', sg);
  ok(asc(sg.ship) && asc(sg.col) && asc(sg.price) && sg.col.indexOf(17) < sg.col.indexOf(18), '⑧ 묶음 안 번호 차례(⑱⑰ 거꾸로이던 것 바로잡음)', sg);
  await p.fill('#ux2_setq', 'KPIPA'); await p.waitForTimeout(250);
  const sf = await p.evaluate(() => { const m = document.querySelector('#main'); const vis = [...m.children].filter((c) => c.dataset.ux2sg && !c.classList.contains('ux2-sgh') && getComputedStyle(c).display !== 'none'); return { n: vis.length, t: vis.map((c) => ux2SgTitle(c).slice(0, 20)), hd: [...m.querySelectorAll(':scope > .ux2-sgh')].filter((h) => getComputedStyle(h).display !== 'none').length }; });
  ok(sf.n >= 1 && sf.n <= 3 && sf.t.some((x) => /KPIPA/.test(x)) && sf.hd <= 2, '⑧ 설정 찾기 → 맞는 칸만', sf);
  await p.fill('#ux2_setq', ''); await p.waitForTimeout(150);
  // ⑧-2 (11/10 밤 정범님 '설정 찾기 바·칩 줄이 화면 중간에 떠서 가림') 굴리면 맨 위(머리 칸·얇은 띠 바로 아래)에 한 줄로 붙고 칩은 접힘 · 「묶음 ▾」로 펼침 · 맨 위로 오면 다시 칩 줄
  const stk = async () => p.evaluate(() => { const t = document.querySelector('.ux2-sgtoc'); const h = document.querySelector('header.top'); const sl = document.getElementById('slimbar'); const hb = Math.max(h.getBoundingClientRect().bottom, sl && sl.classList.contains('on') ? sl.getBoundingClientRect().bottom : 0); const r = t.getBoundingClientRect(); return { gap: Math.round(r.top - hb), h: Math.round(r.height), stuck: t.classList.contains('stuck'), chips: getComputedStyle(t.querySelector('.ux2-sgc')).display, tg: getComputedStyle(t.querySelector('.ux2-sgtg')).display }; });
  for (const y of [1500, 4000]) { await p.evaluate((y) => { window.scrollTo(0, y); document.body.scrollTop = y; }, y); await p.waitForTimeout(500); const a = await stk(); ok(a.stuck && a.gap >= 0 && a.gap <= 8 && a.h <= 50 && a.chips === 'none' && a.tg !== 'none', `⑧-2 ${y}px 굴림: 설정 찾기 바가 머리 칸 바로 아래 한 줄(칩 접힘) — 중간에 뜨지 않음`, a); }
  await p.click('.ux2-sgtoc .ux2-sgtg'); await p.waitForTimeout(150); { const a = await stk(); ok(a.chips !== 'none', '⑧-2 「묶음 ▾」 = 칩 펼침', a); }
  await p.evaluate(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; }); await p.waitForTimeout(500); { const a = await stk(); ok(!a.stuck && a.chips !== 'none' && a.tg === 'none', '⑧-2 맨 위로 오면 다시 칩 줄(제자리)', a); }
  await p.evaluate(() => { const c = document.querySelector('[data-ux2cfg="setgrp"]'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600); await p.evaluate(() => renderMainNow()); await p.waitForTimeout(300);
  const so = await p.evaluate(() => { const m = document.querySelector('#main'); const t = [...m.children].map((c) => ux2SgTitle(c)); return { h: m.querySelectorAll('.ux2-sgh').length, i18: t.findIndex((x) => /^⑱/.test(x)), i17: t.findIndex((x) => /^⑰/.test(x)) }; });
  ok(so.h === 0 && so.i18 >= 0 && so.i18 < so.i17, '⑧ 끄면 예전 차례 그대로(되돌리기)', so); await p.evaluate(() => localStorage.removeItem('rn-ux2'));
  // ── (오후) ⑨ 등록 화면 배치
  await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); openRegister(); }); await p.waitForTimeout(1500);
  const rg = await p.evaluate(() => { const y = (s) => { const e = document.querySelector('#sheet > ' + s); return e ? Math.round(e.getBoundingClientRect().top) : null; }; const h = (s) => { const e = document.querySelector('#sheet > ' + s); return e ? Math.round(e.getBoundingClientRect().height) : null; }; return { sh: y('.sh'), q: y('.rgsearch'), set: y('.rgsetrow'), ws: y('.rgws'), live: y('.rglive'), setH: h('.rgsetrow'), inp: !!document.getElementById('rg_in') }; });
  ok(rg.inp && rg.q < rg.set && rg.ws < rg.q && rg.q < rg.live && rg.q - rg.sh < 150, '⑨ 등록: 넣고 조회 칸이 맨 위 쪽(머리줄 › (11/11 ⑮) 🗂 작업대 줄 바로 아래)', rg);
  ok(rg.setH <= 60 && rg.q < rg.set && rg.set < rg.live, '⑨ 등록: 조건 세 칸은 닫혀 있으면 한 줄 요약(넣고 조회 바로 아래)', rg);
  await p.evaluate(() => { const d = document.querySelector('#sheet .rgsetrow > details.regcfg'); d.open = true; }); await p.waitForTimeout(150); ok(await p.evaluate(() => document.querySelector('#sheet > .rgsetrow').getBoundingClientRect().height > 200), '⑨ 요약을 누르면 그 칸이 펼쳐짐'); await p.evaluate(() => { document.querySelector('#sheet .rgsetrow > details.regcfg').open = false; });
  await p.evaluate(() => { ux2Put('regtop', 0); ux2Apply(); }); await p.waitForTimeout(150);
  const rg0 = await p.evaluate(() => { const y = (s) => Math.round(document.querySelector('#sheet > ' + s).getBoundingClientRect().top); return { q: y('.rgsearch'), ws: y('.rgws'), set: y('.rgsetrow') }; });
  ok(rg0.ws < rg0.set && rg0.set < rg0.q, '⑨ 끄면 예전 배치(작업대 → 조건 → 넣고 조회)', rg0); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); }); await shut(p);
  // ── (정범님 지적) 🟦 예스24도 — 한눈에·자세히 모두 칩 · 고르기 줄 단추 · 처음 안내
  const y4 = await p.evaluate(async () => { localStorage.removeItem('rn-y24w-hint'); localStorage.setItem('rn-regplat-y24', '1'); /* (11/11 reg6) 🟦 기본은 끔 — 이 시험은 켠 기기 기준 */ openRegister(); await new Promise((r) => setTimeout(r, 1200)); const t0 = new Date().toISOString();
    for (const id of ['y1', 'y2']) { const d = { stage: 'sel', grade: 2, qty: 1, price: 5000, ws: regWsCur(), createdAt: t0, info: { title: '예스24 시험 책 ' + id, isbn13: id === 'y1' ? '9791100000911' : '9791100000912', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t0 } }; await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    const cnt = async (v) => { localStorage.setItem('rn-reg-view', v); S.regT = 'sel'; S.regChk = new Set(); regRerender(); await new Promise((r) => setTimeout(r, 700)); const sh = document.getElementById('sheet'); return ['y1', 'y2'].filter((id) => { const b = sh.querySelector(`.rgy24w[data-y24w="${id}"]`); return b && getComputedStyle(b).display !== 'none' && getComputedStyle(b).opacity === '1'; }).length; };
    const full = await cnt('full'), comp = await cnt('compact'); S.regChk = new Set(['y1', 'y2']); regRerender(); await new Promise((r) => setTimeout(r, 700)); const sb = document.querySelector('#sheet .rgselrow [data-y24wbulk="0"]'); return { full, comp, sel: sb ? sb.textContent : null, chipOn: document.querySelectorAll('#sheet .rgy24w.on').length }; });
  ok(y4.full === 2 && y4.comp === 2, '🟦 예스24도 칩이 🔎 자세히·📋 한눈에 모두 카드에 늘 보임', y4);
  ok(/고른 2개 예스24 끄기/.test(y4.sel || '') && y4.chipOn === 2, '(y24auto) 새로 등록한 줄은 기본 켬(칩 파랑) · 고르기 줄 단추는 「🟦 고른 2개 예스24 끄기」', y4);
  await p.click('#sheet .rgselrow [data-y24wbulk="0"]'); await p.waitForTimeout(700);
  const y5a = await p.evaluate(() => ({ off: ['y1', 'y2'].every((id) => (y24W()[id] || {}).on === 0), on: (document.querySelector('#sheet .rgselrow [data-y24wbulk="1"]') || {}).textContent || '', chipOn: document.querySelectorAll('#sheet .rgy24w.on').length }));
  ok(y5a.off && /예스24도 함께/.test(y5a.on) && y5a.chipOn === 0, '🟦 끄기 → 두 개 꺼짐(기록 on 0) · 단추는 「도 함께」로 · 칩 흰 바탕', y5a);
  await p.click('#sheet .rgselrow [data-y24wbulk="1"]'); await p.waitForTimeout(700);
  const y5 = await p.evaluate(() => ({ on: ['y1', 'y2'].every((id) => (y24W()[id] || {}).on), toast: [...document.querySelectorAll('.toast')].map((x) => x.textContent).join(' '), off: (document.querySelector('#sheet .rgselrow [data-y24wbulk="0"]') || {}).textContent || '', chipOn: document.querySelectorAll('#sheet .rgy24w.on').length }));
  ok(y5.on && /저절로/.test(y5.toast) && /끄기/.test(y5.off) && y5.chipOn === 2, '🟦 다시 켜면 두 개 켜짐 · 처음 한 번 안내(예스24에도 저절로) · 단추는 「끄기」로 · 카드 칩 파랑', y5);
  await p.evaluate(async () => { localStorage.removeItem('rn-reg-view'); localStorage.removeItem('rn-regplat-y24'); for (const id of ['y1', 'y2']) { S.regItems.delete(id); delete window.__FS.reg_items[id]; } }); await shut(p);
  // ── ⑭ 판매자 → 시장조사 안
  await p.evaluate(() => { S.tab = 'market'; renderTabs(); renderMainNow(); }); await p.waitForTimeout(700);
  const mk = await p.evaluate(() => ({ sel: getComputedStyle(document.querySelector('#tabs [data-tab="sellers"]')).display, sub: !!document.querySelector('#main > .ux2-mksub [data-ux2mk="sellers"]') }));
  ok(mk.sel === 'none' && mk.sub, '⑭ 탭 줄에 판매자 없음 · 시장조사 맨 위 🏪 경쟁 판매자 칩', mk);
  await p.click('#main .ux2-mksub [data-ux2mk="sellers"]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => S.tab === 'sellers' && document.querySelector('#tabs [data-tab="market"]').classList.contains('on') && !!document.querySelector('#main > .ux2-mksub [data-ux2mk="sellers"].on')), '⑭ 칩 → 판매자 화면 · 탭 줄은 시장조사가 켜짐');
  ok(await p.evaluate(() => /시장조사/.test(FEAT_TABS.sellers) && featIndex().filter((f) => /(^|· )판매자 탭/.test(f.w || '')).length === 0), '⑭ 기능 찾기 길 안내가 시장조사 › 경쟁 판매자로');
  await p.evaluate(() => { ux2Put('selmk', 0); renderTabs(); }); ok(await p.evaluate(() => getComputedStyle(document.querySelector('#tabs [data-tab="sellers"]')).display !== 'none'), '⑭ 끄면 판매자 탭 다시'); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); S.tab = 'home'; renderTabs(); renderMainNow(); });
  // ── ⑪ 두 번 누르기
  await p.evaluate(() => { window.__tw = { n: 0, no: 0 }; const mk = (id, msg, opt) => { const b = document.createElement('button'); b.id = id; b.className = 'btn'; b.textContent = '시험 단추 ' + id; b.style.cssText = 'position:fixed;top:200px;left:' + (id === 'twA' ? 40 : 300) + 'px;z-index:99999'; b.onclick = async () => { if (await ask(msg, opt)) window.__tw.n++; else window.__tw.no++; }; document.body.appendChild(b); }; mk('twA', '이 3권을 알라딘에서 판매중지할까요?\n- 책 하나\n- 책 둘\n- 책 셋', { ok: '⛔ 3권 판매중지' }); mk('twB', '송장 2건을 다시 넣을까요?', {}); });
  await p.click('#twA'); await p.waitForTimeout(150);
  const a1 = await p.evaluate(() => ({ lab: document.getElementById('twA').textContent, box: !!document.querySelector('.askbox'), tip: (document.querySelector('.ux2-armtip') || {}).textContent || '', n: window.__tw.n }));
  ok(/⚠ ⛔ 3권 판매중지 — 한 번 더/.test(a1.lab) && !a1.box && /책 셋/.test(a1.tip) && a1.n === 0, '⑪ 첫 누름 = 단추가 「⚠ 무엇 — 한 번 더」 · 창 없음 · 대상 미리 보기', a1);
  await p.click('#twA'); await p.waitForTimeout(150); ok(await p.evaluate(() => window.__tw.n === 0 && document.getElementById('twA').classList.contains('ux2-armed')), '⑪ 0.4초 안 겹누름은 무시(무장 그대로)');
  await p.waitForTimeout(400); await p.click('#twA'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__tw.n === 1 && /시험 단추/.test(document.getElementById('twA').textContent) && !document.querySelector('.ux2-armtip')), '⑪ 4초 안에 한 번 더 = 실행 · 단추 글 돌아옴');
  await p.click('#twA'); await p.waitForTimeout(4400); ok(await p.evaluate(() => window.__tw.n === 1 && window.__tw.no >= 1 && /시험 단추/.test(document.getElementById('twA').textContent)), '⑪ 4초 지나면 풀림(실행 안 함)');
  await p.click('#twB'); await p.waitForTimeout(200); ok(await p.evaluate(() => !!document.querySelector('.askbox')), '⑪ 송장·출고 확인은 예전처럼 창'); await p.click('.askbox .ask-no'); await p.waitForTimeout(250);
  await p.evaluate(() => ux2Put('twice', 0)); await p.click('#twA'); await p.waitForTimeout(200); ok(await p.evaluate(() => !!document.querySelector('.askbox')), '⑪ 끄면 예전 확인 창'); await p.click('.askbox .ask-no'); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ['twA', 'twB'].forEach((id) => document.getElementById(id).remove()); });
}), { vp: { width: 1400, height: 900 } }).then(() => require('./harness.js')(G(async (p) => {
  // 휴대폰: ④ 머리 칸 높이 · ② 빠른 작업은 검색창 아래 한 줄 · ① 알림 자리는 아래 탭 줄 위
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); ux2Apply(); }); await p.waitForTimeout(300);
  const a = await p.evaluate(() => { const h = document.querySelector('header.top'); const q = document.getElementById('q').getBoundingClientRect(); const w = document.getElementById('ux2qa').getBoundingClientRect(); return { h: h.offsetHeight, below: w.top >= q.bottom - 2, fit: w.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1 }; });
  await p.evaluate(() => { ux2Put('hfold', '0'); ux2Put('quick', 0); ux2Apply(); }); await p.waitForTimeout(200); const h0 = await p.evaluate(() => document.querySelector('header.top').offsetHeight); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); });
  ok(a.below && a.fit && a.h < h0, '📱 머리 칸이 예전보다 낮음 · 빠른 작업은 검색창 아래 한 줄 · 화면 밖으로 안 넘침', { ...a, h0 });
  await p.evaluate(() => { const x = document.createElement('div'); x.id = 'dlp'; x.innerHTML = '<div style="background:#fff;padding:8px">⬇ 시험</div>'; document.body.appendChild(x); }); await p.waitForTimeout(300);
  const d = await p.evaluate(() => ({ b: document.getElementById('dlp').getBoundingClientRect().bottom, t: document.getElementById('tabs').getBoundingClientRect().top }));
  ok(d.b <= d.t, '📱 내려받기 띠가 아래 탭 줄(홈·고객 단추)을 덮지 않음', d);
  const tb = await p.evaluate(() => [...document.querySelectorAll('#tabs > button')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.dataset.tab || 'more'));
  ok(tb.join() === 'home,products,orders,purchase,more', '⑫ 휴대폰 아래 탭 = 홈·상품·주문·매입·⋯', tb);
  await p.click('[data-ux2tmore]'); await p.waitForTimeout(200); const mm = await p.evaluate(() => [...document.querySelectorAll('#ux2tmenu [data-ux2tgo]')].map((b) => b.dataset.ux2tgo));
  ok(mm.join() === 'search,biz,market,projects', '⑫ ⋯ 안 = 고객·경영·시장조사·프로젝트(판매자는 시장조사 안)', mm);
  await p.click('#ux2tmenu [data-ux2tgo="search"]'); await p.waitForTimeout(600); ok(await p.evaluate(() => S.tab === 'search' && !document.getElementById('ux2tmenu') && document.querySelector('[data-ux2tmore]').classList.contains('on') && /고객/.test(document.querySelector('[data-ux2tmore]').textContent)), '⑫ ⋯에서 고르면 그 탭 · ⋯ 자리에 지금 탭 이름');
  await p.evaluate(() => { ux2Put('tabs5', 0); renderTabs(); }); ok(await p.evaluate(() => [...document.querySelectorAll('#tabs > button')].filter((b) => getComputedStyle(b).display !== 'none').length === 8), '⑫ 끄면 탭 모두(판매자는 ⑭로 시장조사 안)'); await p.evaluate(() => localStorage.removeItem('rn-ux2'));
}), { vp: { width: 390, height: 844 }, touch: true })).then(() => { console.log(bad ? `❌ tUX1 실패 ${bad}` : '✓ tUX1 통과'); process.exit(bad ? 1 : 0); });
