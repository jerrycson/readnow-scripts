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
  await p.evaluate(() => { const c = document.querySelector('[data-ux2cfg="setgrp"]'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600); await p.evaluate(() => renderMainNow()); await p.waitForTimeout(300);
  const so = await p.evaluate(() => { const m = document.querySelector('#main'); const t = [...m.children].map((c) => ux2SgTitle(c)); return { h: m.querySelectorAll('.ux2-sgh').length, i18: t.findIndex((x) => /^⑱/.test(x)), i17: t.findIndex((x) => /^⑰/.test(x)) }; });
  ok(so.h === 0 && so.i18 >= 0 && so.i18 < so.i17, '⑧ 끄면 예전 차례 그대로(되돌리기)', so); await p.evaluate(() => localStorage.removeItem('rn-ux2'));
}), { vp: { width: 1400, height: 900 } }).then(() => require('./harness.js')(G(async (p) => {
  // 휴대폰: ④ 머리 칸 높이 · ② 빠른 작업은 검색창 아래 한 줄 · ① 알림 자리는 아래 탭 줄 위
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); ux2Apply(); }); await p.waitForTimeout(300);
  const a = await p.evaluate(() => { const h = document.querySelector('header.top'); const q = document.getElementById('q').getBoundingClientRect(); const w = document.getElementById('ux2qa').getBoundingClientRect(); return { h: h.offsetHeight, below: w.top >= q.bottom - 2, fit: w.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1 }; });
  await p.evaluate(() => { ux2Put('hfold', '0'); ux2Put('quick', 0); ux2Apply(); }); await p.waitForTimeout(200); const h0 = await p.evaluate(() => document.querySelector('header.top').offsetHeight); await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); });
  ok(a.below && a.fit && a.h < h0, '📱 머리 칸이 예전보다 낮음 · 빠른 작업은 검색창 아래 한 줄 · 화면 밖으로 안 넘침', { ...a, h0 });
  await p.evaluate(() => { const x = document.createElement('div'); x.id = 'dlp'; x.innerHTML = '<div style="background:#fff;padding:8px">⬇ 시험</div>'; document.body.appendChild(x); }); await p.waitForTimeout(300);
  const d = await p.evaluate(() => ({ b: document.getElementById('dlp').getBoundingClientRect().bottom, t: document.getElementById('tabs').getBoundingClientRect().top }));
  ok(d.b <= d.t, '📱 내려받기 띠가 아래 탭 줄(홈·고객 단추)을 덮지 않음', d);
}), { vp: { width: 390, height: 844 }, touch: true })).then(() => { console.log(bad ? `❌ tUX1 실패 ${bad}` : '✓ tUX1 통과'); process.exit(bad ? 1 : 0); });
