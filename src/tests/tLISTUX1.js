// tLISTUX1 — 정범님 11/19 19:16 Ⓐ 목록 번호 · Ⓑ 가로 휠 · Ⓒ Alt+↑/↓ 카드 넘기기·⌨ 입력 준비 · I-1119-1925-25 Alt+L 어디서나 🔒 잠금(등록 조회 = Alt+I)
//  · I-1119-1929-26 수동 일괄 고른 카드 ⏸ 보류 Alt+Shift+P · ✖ 빼기 Alt+Shift+X(두 번) · 📈 시장 지표 갱신 Alt+Shift+U (Alt+H·X·R은 이미 쓰여 바꿈)
//  운영 prd_locks는 쓰지 않음 — plkSet은 시험 안에서 바꿔 끼움(부른 것만 셈)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const W = (p, ms) => p.waitForTimeout(ms);
const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '0', sellerName: '알라딘', ship: 0 }];
const hint = (p) => p.evaluate(() => (document.getElementById('kbhint') || {}).textContent || '');
const blur = (p) => p.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
const stubLock = (p) => p.evaluate(() => { window.__plk = []; window.plkSet = async (l, on, o) => { window.__plk.push({ k: l && l.id, on, mode: o && o.mode }); const v = { id: l.id, on: !!on, mode: (o && o.mode) || 'new' }; plkMap().set(String(l.id), v); try { await db.collection('prd_locks').doc(String(l.id)).set({ on: v.on, mode: v.mode }); } catch (e) {} /* 시험 가짜 저장소에도 적음 — 그 구독이 지도를 새로 바꿔도 같게 */ }; });
const sel = (p) => p.evaluate(() => KBC.k);
/* 떠 있는 안쪽 창(가짜 목록) — 줄 5개 · 줄마다 🔓 잠금 단추 · 셋째 줄엔 글 칸 */
const overlay = (p, o) => p.evaluate((o) => { document.querySelectorAll('.lxw').forEach((x) => x.remove()); const w = document.createElement('div'); w.className = 'lxw'; w.id = o.id; w.style.cssText = `position:fixed;top:${o.top || 70}px;left:120px;width:520px;height:${o.h || 420}px;overflow:auto;z-index:99990;background:#fff;border:1px solid #888`;
  const rows = (a, b) => Array.from({ length: b - a + 1 }, (_, j) => { const i = a + j; return `<div class="item" data-pid="${o.p}${i}" style="height:56px;border-bottom:1px solid #ddd;padding:4px"><b>줄 ${i}</b> <button type="button" class="plk-c" data-plk="aladin_${o.p}${i}">🔓</button>${i === 3 ? ' <input id="' + o.p + 'in" style="width:90px">' : ''}</div>`; }).join('');
  w.innerHTML = `<div class="lxL">${rows(1, o.n)}</div>${o.more ? `<button type="button" id="${o.p}_more">더 보기 (남은 ${o.more})</button>` : ''}`; document.body.appendChild(w);
  const mb = w.querySelector('button[id$="_more"]'); if (mb) mb.onclick = () => { w.querySelector('.lxL').insertAdjacentHTML('beforeend', rows(o.n + 1, o.n + o.more)); mb.remove(); };
  plkMap().set('aladin_' + o.p + '2', { id: 'aladin_' + o.p + '2', on: true, mode: 'full' }); }, o);
const lno = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => { const b = el.querySelector(':scope > .lno') || (el.lastElementChild && el.lastElementChild.querySelector(':scope > .lno')); return b ? b.dataset.n : null; }), sel);

H(async (p) => {
  await p.evaluate(require('./seed.js')); await W(p, 600); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
  await stubLock(p);
  console.log('Ⓐ 목록 번호 — 한 장치(lnoPaint) · 거른 목록 = 보이는 것만 · 나눠 그린 목록 = 남은 것까지');
  await overlay(p, { id: 'lxA', p: 'a', n: 5, more: 7 }); await W(p, 500);
  let N = await lno(p, '#lxA .item'); ok(N.length === 5 && N[0] === '1/12' && N[4] === '5/12', '나눠 그린 목록: 「n/N」의 N = 그린 5 + 「더 보기 (남은 7)」 = 12', N);
  const badge = await p.evaluate(() => { const b = document.querySelector('#lxA .item .lno'); const cs = getComputedStyle(b, '::after'); const r = b.getBoundingClientRect(), c = b.parentElement.getBoundingClientRect(); return { txt: cs.content, pos: getComputedStyle(b).position, right: c.right - r.right < 12, bottom: c.bottom - r.bottom < 12, keep: b.dataset.mkeep, pe: getComputedStyle(b).pointerEvents }; });
  ok(/1\/12/.test(badge.txt) && badge.pos === 'absolute' && badge.right && badge.bottom && badge.keep === '1' && badge.pe === 'none', '번호는 카드 오른쪽 아래 옅은 작은 칸(눌리지 않음 · 다시 그려도 남음 data-mkeep)', badge);
  await p.evaluate(() => { document.querySelector('#lxA .item[data-pid="a2"]').style.display = 'none'; document.querySelector('#lxA button[id$="_more"]').remove(); }); await W(p, 500);
  N = await lno(p, '#lxA .item'); ok(N[0] === '1/4' && N[1] === null && N[2] === '2/4' && N[4] === '4/4', '거른 목록(하나 숨김 · 더 보기 없음): 보이는 4개만 「n/4」 · 숨긴 줄엔 번호 없음', N);
  const home = await p.evaluate(() => { const L = [...document.querySelectorAll('#main .item[data-pid]')].filter((x) => x.getClientRects().length); const b = L.map((x) => (x.querySelector(':scope > .lno') || {}).dataset).filter(Boolean).map((d) => d.n); return { n: L.length, b: b.slice(0, 3) }; });
  ok(home.n < 2 || (home.b.length && /^1\/\d+$/.test(home.b[0])), '홈 상품 목록에도 같은 번호(시험 씨앗 상품)', home);

  console.log('Ⓒ Alt+↑/↓ — 지금 창(마우스가 있는 안쪽 창)의 카드 차례로 · 맨 끝이면 그 자리 · 가운데로');
  await overlay(p, { id: 'lxB', p: 'b', n: 5 }); await W(p, 400); await p.mouse.move(300, 120); await blur(p);
  const go = async (k, n) => { let h = ''; for (let i = 0; i < n; i++) { await p.keyboard.press(k); await W(p, 120); } h = await hint(p); return { k: await sel(p), h }; };
  let g = await go('Alt+ArrowDown', 1); ok(/^b\d$/.test(g.k) && /\/ 5/.test(g.h), 'Alt+↓ 첫 번째: 안쪽 창의 카드 하나를 고름 · 알림 「n / 5」', g);
  g = await go('Alt+ArrowDown', 6); ok(g.k === 'b5' && /맨 아래 카드/.test(g.h) && /5 \/ 5/.test(g.h), 'Alt+↓를 끝까지: 맨 아래 카드(b5)에서 그 자리 · 「⤓ 맨 아래 카드 · 5 / 5」', g);
  g = await go('Alt+ArrowUp', 7); ok(g.k === 'b1' && /맨 위 카드/.test(g.h) && /1 \/ 5/.test(g.h), 'Alt+↑를 끝까지: 맨 위 카드(b1)에서 그 자리 · 「⤒ 맨 위 카드 · 1 / 5」', g);
  await p.click('#bin'); g = await go('Alt+ArrowDown', 1); const inTxt = await p.evaluate(() => document.getElementById('bin').value);
  ok(g.k === 'b4' && inTxt === '', '글 칸(셋째 줄)에 커서가 있어도 Alt+↓ = 다음 카드(b4) · 칸에 글자 안 들어감', { g, inTxt });
  const cen = await p.evaluate(async () => { const w = document.getElementById('lxB'); w.style.height = '150px'; w.scrollTop = 0; await new Promise((r) => setTimeout(r, 50)); KBC.el = null; KBC.k = ''; kbPick(w.querySelector('[data-pid="b1"]'), w); kbCardGo(1); kbCardGo(1); kbCardGo(1); const r = w.querySelector('[data-pid="b4"]').getBoundingClientRect(), s = w.getBoundingClientRect(); return { k: KBC.k, top: w.scrollTop, mid: Math.abs((r.top + r.bottom) / 2 - (s.top + s.bottom) / 2) }; });
  ok(cen.k === 'b4' && cen.top > 0 && cen.mid < 20, '고른 카드는 그 창 가운데로(안쪽 창을 넘김)', cen);
  await overlay(p, { id: 'lxC', p: 'c', n: 3, more: 2 }); await W(p, 400); await p.mouse.move(300, 120); await blur(p); await p.evaluate(() => { KBC.el = null; KBC.k = ''; });
  g = await go('Alt+ArrowDown', 3); await W(p, 400); const cN = await p.evaluate(() => document.querySelectorAll('#lxC .item').length);
  ok(cN === 5 && (await sel(p)) === 'c4', '마우스가 든 카드(c1)에서 Alt+↓ 셋: c2 → c3 → 나눠 그린 목록 끝이라 Alt+↓ = 「더 보기」를 눌러 다음 묶음을 그린 뒤 다음 카드(c4)로', { cN, g, now: await sel(p) });
  N = await lno(p, '#lxC .item'); ok(N[0] === '1/5' && N[4] === '5/5', '더 그린 뒤 번호도 1/5 … 5/5', N);

  console.log('🔒 Alt+L — 어디서나 고른 카드 잠금(🆕 새로 잠금) · 이미 잠긴 카드는 「이미 잠김」 · 카드가 없으면 「잠글 카드 없음」');
  await overlay(p, { id: 'lxD', p: 'd', n: 5 }); await W(p, 400); await p.mouse.move(300, 90); await blur(p); await p.evaluate(() => { KBC.el = null; KBC.k = ''; window.__plk = []; });
  await p.evaluate(() => { const w = document.getElementById('lxD'); kbPick(w.querySelector('[data-pid="d1"]'), w); }); await p.keyboard.press('Alt+l'); await W(p, 300);
  let L1 = await p.evaluate(() => window.__plk.slice()); ok(L1.length === 1 && L1[0].k === 'aladin_d1' && L1[0].on === true && L1[0].mode === 'new', 'Alt+L: 고른 카드(d1)의 🔓 단추와 같은 일 = plkToggle → 🆕 새로 잠금(mode new)', L1);
  await p.keyboard.press('Alt+l'); await W(p, 300); let h = await hint(p); L1 = await p.evaluate(() => window.__plk.slice());
  ok(L1.length === 1 && /이미 잠김/.test(h), '같은 카드에 Alt+L 또 = 풀지 않고 「이미 잠김」 띠만', { L1, h });
  await p.keyboard.press('Alt+ArrowDown'); await W(p, 150); await p.evaluate(() => plkMap().set('aladin_d2', { id: 'aladin_d2', on: true, mode: 'full' })); /* 시험 가짜 저장소의 prd_locks 구독이 지도를 새로 바꿀 수 있어 바로 앞에 둠 */ await p.keyboard.press('Alt+l'); await W(p, 300); h = await hint(p); L1 = await p.evaluate(() => window.__plk.slice());
  ok((await sel(p)) === 'd2' && L1.length === 1 && /이미 잠김/.test(h) && /완전 잠금/.test(h), '처음부터 잠긴 카드(d2 · 완전 잠금)에 Alt+L = 「이미 잠김 · 🔒 완전 잠금」 · 안 풂', { h, L1 });
  await p.click('#din'); await p.keyboard.press('Alt+l'); await W(p, 300); L1 = await p.evaluate(() => window.__plk.slice()); const dv = await p.evaluate(() => document.getElementById('din').value);
  ok(L1.length === 2 && L1[1].k === 'aladin_d3' && dv === '', '글 칸에 커서가 있어도 Alt+L = 그 칸이 든 카드(d3) 잠금 · 글자 안 들어감', { L1, dv });
  await p.evaluate(() => { document.querySelectorAll('.lxw').forEach((x) => x.remove()); const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div style="height:400px">빈 화면</div>'; S.detail = { lxEmpty: 1 }; KBC.el = null; KBC.k = ''; KBC.pt = null; }); await p.mouse.move(700, 400); await blur(p);
  await p.keyboard.press('Alt+l'); await W(p, 200); h = await hint(p); L1 = await p.evaluate(() => window.__plk.length);
  ok(/잠글 카드 없음/.test(h) && L1 === 2, '카드가 없는 화면에서 Alt+L = 「🔒 잠글 카드 없음」 띠 · 아무것도 안 잠금', { h, L1 });
  await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.classList.remove('on'); sh.innerHTML = ''; S.detail = null; });

  console.log('Ⓑ 가로 휠 — 가로로만 넘기는 칸 위 휠 = 옆으로 · 끝이면 안 막음 · Shift+휠·세로 칸은 그대로');
  await p.evaluate(() => { const mk = (id, top, both) => { const d = document.createElement('div'); d.id = id; d.className = 'lxw'; d.style.cssText = `position:fixed;top:${top}px;left:100px;width:300px;${both ? 'height:80px;overflow:auto' : 'overflow-x:auto;overflow-y:hidden'};white-space:nowrap;z-index:99990;background:#fff`; d.innerHTML = `<div style="display:inline-block;width:1500px;height:${both ? 400 : 30}px;background:linear-gradient(90deg,#eee,#999)">가로 띠</div>`; document.body.appendChild(d); }; mk('lxH', 100, 0); mk('lxV', 300, 1);
    window.__wp = []; window.addEventListener('wheel', (e) => { window.__wp.push(e.defaultPrevented); }, { passive: true }); });
  await p.mouse.move(250, 115); await p.mouse.wheel(0, 200); await W(p, 200); let sl = await p.evaluate(() => [document.getElementById('lxH').scrollLeft, window.__wp.slice(-1)[0]]);
  ok(sl[0] >= 190 && sl[1] === true, '가로 띠 위 휠 아래로 = 오른쪽으로 넘김(scrollLeft ↑)', sl);
  await p.mouse.wheel(0, -100); await W(p, 200); const sl2 = await p.evaluate(() => document.getElementById('lxH').scrollLeft); ok(sl2 < sl[0] && sl2 >= 90, '휠 위로 = 왼쪽으로', sl2);
  await p.evaluate(() => { const d = document.getElementById('lxH'); d.scrollLeft = d.scrollWidth; }); await p.mouse.wheel(0, 120); await W(p, 200); sl = await p.evaluate(() => window.__wp.slice(-1)[0]);
  ok(sl === false, '오른쪽 끝에서 휠 아래로 = 막지 않음(화면이 그대로 내려감)', sl);
  await p.evaluate(() => { document.getElementById('lxH').scrollLeft = 0; }); await p.keyboard.down('Shift'); await p.mouse.wheel(0, 150); await p.keyboard.up('Shift'); await W(p, 200); sl = await p.evaluate(() => window.__wp.slice(-1)[0]);
  ok(sl === false, 'Shift+휠은 웹앱이 손대지 않음(브라우저 그대로)', sl);
  await p.mouse.move(250, 330); await p.mouse.wheel(0, 100); await W(p, 200); sl = await p.evaluate(() => { const d = document.getElementById('lxV'); return [d.scrollLeft, d.scrollTop, window.__wp.slice(-1)[0]]; });
  ok(sl[0] === 0 && sl[1] > 0 && sl[2] === false, '세로로도 넘기는 칸 = 보통 휠(아래로 · 가로로 안 돌림)', sl);
  await p.mouse.move(250, 115); await p.mouse.wheel(150, 20); await W(p, 200); sl = await p.evaluate(() => window.__wp.slice(-1)[0]); ok(sl === false, '터치패드 가로 밀기(가로 값이 더 큼)는 그대로', sl);
  await p.evaluate(() => document.querySelectorAll('.lxw').forEach((x) => x.remove()));
  console.log(bad ? `❌ tLISTUX1(목록·키·휠) 실패 ${bad}` : '✓ tLISTUX1(목록·키·휠) 통과');
}).then(() => H(async (p) => { const b0 = bad;
  console.log('📥 등록 — 번호 「n/N · 탭」 · Alt+↓ 고른 카드 = 입력 준비 · Alt+I 조회 · Alt+L은 조회가 아님');
  await p.evaluate(require('./seed.js')); await W(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' }); await stubLock(p);
  await p.evaluate(async ({ PG }) => { const T0 = Date.parse('2026-11-19T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); window.ask = async () => true; localStorage.removeItem('rn-kba'); window.__look = null; window.regLookup = (ids) => { window.__look = ids; };
    const mk = (id, k, o) => ({ stage: 'sel', isbn: '97911000099' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), movedAt: at(100 - k), code: 'BLKCMN', codeManual: true, info: { title: '시험 책 ' + id, isbn13: '97911000099' + String(k).padStart(2, '0'), itemId: '99' + k, categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, at: at(k), buyback: { 상: 1000 } }, ...o });
    const L = { s1: mk('s1', 1, {}), s2: mk('s2', 2, {}), s3: mk('s3', 3, {}), q1: { stage: 'q', isbn: '9791100009921', q: '9791100009921', ws: regWsCur(), createdAt: at(21), grade: 2, qty: 1 } };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-reg-view', 'full'); localStorage.removeItem('rn-reg-subcfg'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = {}; S.detail = null; openRegister(); }, { PG });
  await W(p, 2000);
  const rb = await p.evaluate(() => regCardEls().filter(kbVisEl).map((el) => { const b = el.querySelector(':scope > .lno'); return b ? b.dataset.n : null; }));
  ok(rb.length === 3 && /^1\/3 · .*선택 대기/.test(rb[0]) && /^3\/3 · /.test(rb[2]), '등록 카드 오른쪽 아래 「n/N · 탭 이름」(1/3 · 선택 대기 …)', rb);
  await blur(p); await p.evaluate(() => { KBC.el = null; KBC.k = ''; S._regCur = null; }); await p.mouse.move(700, 450);
  await p.keyboard.press('Alt+ArrowDown'); await W(p, 300); let r = await p.evaluate(() => { const i = window.rnKbReady(); return { k: KBC.k, cur: S._regCur, rdy: i ? i.dataset.rgpin : null, mark: i ? i.getAttribute('data-kbrdy') : null, act: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }; });
  ok(r.rdy && r.rdy === r.cur && r.mark === '1' && !/INPUT/.test(r.act === 'rg_in' ? '' : r.act), 'Alt+↓ = 등록 카드 고름(지금 할 카드도 그 카드) · 그 카드 「우리 판매가」 칸이 ⌨ 입력 준비(커서는 안 옮김) · window.rnKbReady()가 그 칸', r);
  const id0 = r.cur; await p.keyboard.type('7700', { delay: 90 }); await W(p, 300); let v = await p.evaluate((id) => document.querySelector(`[data-rgpin="${id}"]`).value, id0);
  ok(v === '7700', '입력 준비 칸에 숫자를 치면 그 칸으로(7,700) — 커서 없이', v); await p.keyboard.press('Backspace'); await W(p, 200); v = await p.evaluate((id) => document.querySelector(`[data-rgpin="${id}"]`).value, id0); ok(v === '770', '⌫ = 한 글자 지움', v);
  await p.keyboard.press('Enter'); await W(p, 300); r = await p.evaluate(() => !!window.rnKbReady()); ok(!r, 'Enter = 넣고 입력 준비 끝(rnKbReady() = null)', r);
  await p.keyboard.press('Alt+l'); await W(p, 300); let hl = await hint(p); let lk = await p.evaluate(() => window.__look);
  ok(lk === null && /잠금|잠글|잠김/.test(hl), '등록에서 Alt+L = 조회가 아님(🔒 잠금 쪽 띠)', { hl, lk });
  await p.keyboard.press('Alt+i'); await W(p, 300); lk = await p.evaluate(() => window.__look); hl = await hint(p);
  ok(Array.isArray(lk) && lk.includes('q1') && /조회/.test(hl), 'Alt+I = 「조회 (1)」 단추를 누른 것과 같음(조회 대기 q1)', { lk, hl });
  const tx = await p.evaluate(() => ({ t: (document.getElementById('rg_look') || {}).title || '', g: KB_REG.map((x) => x.join(' ')).join(' | ').replace(/ \+ /g, '+'), all: FEAT.filter((f) => /Alt\+L/.test(f.key || '') || /Alt\+L/.test(f.t || '')).map((f) => f.t).join(' | ') }));
  ok(/Alt\+I/.test(tx.t) && /Alt\+I/.test(tx.g) && !/Alt\+L[^\w]*조회/.test(tx.g), '조회 단추 설명·⌨ 등록 표 = Alt+I 조회', tx);
  console.log(bad > b0 ? `❌ tLISTUX1(등록) 실패 ${bad - b0}` : '✓ tLISTUX1(등록) 통과');
})).then(() => H(async (p) => { const b0 = bad;
  console.log('🧮 수동 일괄 — 번호 · 입력 준비 · Alt+Shift+P 보류 · Alt+Shift+X 빼기(두 번) · Alt+Shift+U 시장 지표 갱신 · Alt+L 잠금');
  await p.evaluate(require('./seed.js')); await W(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}' }); await stubLock(p);
  await p.evaluate(async () => { localStorage.removeItem('rn-kba'); const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 }; window.__pmk = []; window.pmkRequest = async (l) => { window.__pmk.push(l && l.id); };
    const P1 = [{ r: 1, n: '판매자A', sc: '1', g: '상', p: 4000, s: 2500, lid: 'Q1', c: 'green' }, { r: 2, n: '판매자B', sc: '2', g: '상', p: 5200, s: 2500, lid: 'Q2', c: 'green' }, { r: 3, n: '판매자C', sc: '3', g: '상', p: 7000, s: 2500, lid: 'Q3', c: 'green' }, { r: 4, n: '판매자D', sc: '4', g: '상', p: 4000, s: 2500, lid: 'Q4', c: 'green' }, { r: 5, n: '판매자E', sc: '5', g: '상', p: 5200, s: 2500, lid: 'Q5', c: 'green' }, { r: 6, n: '판매자F', sc: '6', g: '상', p: 7000, s: 2500, lid: 'Q6', c: 'green' }];
    S.batchRes = [...S.plist.values()].filter((l) => l.active).map((l) => ({ l, target: 9000, reasons: ['시험'], page1: P1, at: '2026-11-19' })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {};
    const c = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }; window.__c = c; drawBatchRes(sh, c, 'g1'); sh.scrollTop = 0; await new Promise((r) => setTimeout(r, 700)); });
  await blur(p); await W(p, 300);
  const cards = () => p.evaluate(() => [...document.querySelectorAll('#b_res .card.pq.bq[data-mk]')].filter(kbVisEl).map((x) => x.dataset.mk));
  const K = await cards(); const bn = await p.evaluate(() => { const L = [...document.querySelectorAll('#b_res .card.pq.bq[data-mk]')].filter(kbVisEl); return { a: (L[0].querySelector(':scope > .lno') || {}).dataset, n: L.length, rest: kbRestIn(document.querySelector('#b_res')) }; });
  ok(K.length >= 3 && bn.a && bn.a.n === `1/${bn.n + bn.rest}`, `수동 일괄 카드 번호 「1/${bn.n + bn.rest}」(그린 ${bn.n} + 남은 ${bn.rest})`, bn);
  const pick = (k) => p.evaluate((k) => { const el = document.querySelector(`#b_res .card.pq.bq[data-mk="${k}"]`); kbPick(el, document.getElementById('sheet')); return !!window.rnKbReady(); }, k);
  ok(await pick(K[1]), '고른 카드의 가격 칸 = ⌨ 입력 준비(rnKbReady)', K[1]); await blur(p);
  await p.keyboard.type('8800', { delay: 90 }); await W(p, 300); let v = await p.evaluate((k) => document.querySelector(`#b_res [data-mk="${k}"] [data-bpin]`).value, K[1]);
  ok(v === '8800', '숫자 = 그 카드 가격 칸으로(8,800)', v); await p.keyboard.press('Escape'); await W(p, 300); v = await p.evaluate((k) => document.querySelector(`#b_res [data-mk="${k}"] [data-bpin]`).value, K[1]); ok(v === '9000', 'Esc = 처음 값으로 되돌림(9,000)', v);
  await pick(K[1]); await blur(p); await p.keyboard.type('97911', { delay: 4 }); await W(p, 300); v = await p.evaluate((k) => document.querySelector(`#b_res [data-mk="${k}"] [data-bpin]`).value, K[1]); const hb = await hint(p);
  ok(v === '9000' && /바코드/.test(hb), '바코드처럼 빠른 입력은 가격으로 넣지 않음(9,000 그대로)', { v, hb });
  // ⏸ 보류 — Alt+Shift+P
  await pick(K[0]); await p.keyboard.press('Alt+Shift+KeyP'); await W(p, 900); let st = await p.evaluate((k) => ({ held: !!(S.batchSt.held && S.batchSt.held[k]), h: (document.getElementById('kbhint') || {}).textContent }), K[0]);
  ok(st.held && /보류/.test(st.h), 'Alt+Shift+P = 고른 카드 ⏸ 보류(그 카드의 보류 단추와 같은 일 · 기록 남김)', st);
  const K2 = await cards();
  // ✖ 빼기 — 두 번
  await pick(K2[0]); await p.focus(`#b_res [data-mk="${K2[0]}"] [data-bpin]`); await p.keyboard.press('Alt+Shift+KeyX'); await W(p, 700); st = await p.evaluate((k) => ({ tr: !!(S.batchSt.trashed && S.batchSt.trashed[k]), h: (document.getElementById('kbhint') || {}).textContent, arm: !!document.querySelector(`#b_res [data-mk="${k}"] [data-bqht="trash"].ux2-armed`) }), K2[0]);
  ok(!st.tr && st.arm && /한 번 더/.test(st.h), 'Alt+Shift+X 첫 번째(가격 칸에 커서가 있어도) = 「한 번 더 … 이 그룹에서 빼기」 · 아직 안 뺌', st);
  await p.keyboard.press('Alt+Shift+KeyX'); await W(p, 900); st = await p.evaluate((k) => ({ tr: !!(S.batchSt.trashed && S.batchSt.trashed[k]), h: (document.getElementById('kbhint') || {}).textContent }), K2[0]);
  ok(st.tr && /뺌/.test(st.h), 'Alt+Shift+X 두 번째 = ✖ 뺌(🗑 휴지통 탭에서 되돌리기)', st);
  // 📈 시장 지표 갱신 — Alt+Shift+U (mkref가 main에 없어 있던 「📈 시장 지표 갱신」 단추 = pmkRequest)
  const K3 = await cards(); await pick(K3[0]); const hasMet = await p.evaluate((k) => !!document.querySelector(`#b_res [data-mk="${k}"] [data-bqmet]`), K3[0]);
  await p.keyboard.press('Alt+Shift+KeyU'); await W(p, 600); st = await p.evaluate(() => ({ c: window.__pmk.slice(), h: (document.getElementById('kbhint') || {}).textContent }));
  ok(hasMet && st.c.length === 1 && st.c[0] === K3[0] && /시장 지표/.test(st.h), 'Alt+Shift+U = 고른 카드의 📈 시장 지표 갱신(수집기에 맡김)', { hasMet, st, k: K3[0] });
  // 고른 카드가 없을 때 = 「카드 없음」
  await p.evaluate(() => { document.querySelector('#b_res').innerHTML = ''; KBC.el = null; KBC.k = ''; KBC.pt = null; }); await p.keyboard.press('Alt+Shift+KeyP'); await W(p, 200); st = await hint(p);
  ok(/카드 없음/.test(st), '카드가 없으면 「카드 없음」 띠', st);
  // 키 표·설명
  const tbl = await p.evaluate(() => { const A = KBA_SCR.batch.acts; const g = (id) => (A.find((a) => a[0] === id) || [])[2]; return { hold: g('hold'), del: g('del'), ref: g('ref'), feat: FEAT.some((f) => /보류/.test(f.k || '') && /Alt\+Shift\+P/.test(f.key || f.d || '')), man: /Alt\+Shift\+P/.test(document.documentElement.innerHTML) || true }; });
  ok(tbl.hold === 'Alt+Shift+KeyP' && tbl.del === 'Alt+Shift+KeyX' && tbl.ref === 'Alt+Shift+KeyU', '⌨ 키 표(키 바꾸기) = 보류 Alt+Shift+P · 빼기 Alt+Shift+X · 시장 지표 갱신 Alt+Shift+U', tbl);
  console.log(bad > b0 ? `❌ tLISTUX1(수동 일괄) 실패 ${bad - b0}` : '✓ tLISTUX1(수동 일괄) 통과');
  console.log(bad ? `❌ tLISTUX1 실패 ${bad}` : '✓ tLISTUX1 통과');
}));
