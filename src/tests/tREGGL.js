// tREGGL — 정범님 11/05 '등록 한눈에 카드에서 바로 최상/상/중 상태·상품코드·수량 바꾸기' + '→ 결정 대기 두 번 누르기' + '사진 마우스 올리면 앞·옆·뒷면 크게' + '고르기 줄은 카드 바로 위 · 그 줄의 창은 줄 위'
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const W360 = process.argv.includes('--360');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' }); /* 떠 있는 살핀 상품 패널이 단추를 가리지 않게(시험만) */
  // 상품 넣기 — 선택 대기 3 · 결정 대기(맡김) 1 · 보류 1 · 확정 1
  await p.evaluate(async () => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const mk = (id, o) => ({ stage: 'sel', isbn: '97911000001' + id.slice(-2).padStart(2, '0'), grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, info: { title: '바로 고치기 책 ' + id, isbn13: '97911000001' + id.slice(-2).padStart(2, '0'), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t, cover: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' }, ...o });
    const L = { g01: mk('g01', {}), g02: mk('g02', { code: 'BLKCMN', codeManual: true }), g03: mk('g03', { code: 'PNKLUX', codeManual: true, qty: 2 }), g04: mk('g04', { stage: 'pick', cmdId: 'cmdX' }), g05: mk('g05', { stage: 'hold' }), g06: mk('g06', { stage: 'done', final: { price: 9000, qty: 1, code: 'BLKCMN' } }), g07: mk('g07', { price: 30000 }) }; L.g07.info.buyback = { 최상: 4200, 상: 3800, 중: 2000 };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    try { localStorage.setItem('rn-reg-view', 'compact'); localStorage.setItem('rn-reg-codeslots', JSON.stringify({ [regWsCur()]: ['YLWNOT', null, null, null, null] })); } catch (e) {}
    S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1600);
  const FS = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__FS.reg_items || {})));
  const row = (id) => `.rgrow[data-rgexp="${id}"]`;
  // 1) 한눈에 줄에 단추
  const r0 = await p.evaluate((sel) => { const r = document.querySelector(sel); return r ? { g: !!r.querySelector('[data-rggl="grade"]'), q: !!r.querySelector('[data-rggl="qty"]'), c: !!r.querySelector('[data-rggl="code"]'), pk: !!r.querySelector('[data-rgpk2]'), pz: !!r.querySelector('.rgr-cov[data-pz]') } : null; }, row('g01'));
  ok(r0 && r0.g && r0.q && r0.c && r0.pk && r0.pz, '한눈에 줄에 상태·수량·코드 바로 고치기 단추 · → 결정 대기 · 표지 큰 보기', r0);
  // 2) 상태 — 누르면 세 칸 · 숫자 키 3 → 중 · 자세히와 같은 뒤따름(판매가 다시 셈 기록)
  await p.click(row('g01') + ' [data-rggl="grade"]'); await p.waitForTimeout(150);
  const g1 = await p.evaluate(() => { const z = document.getElementById('rgglpop'); return { open: z && z.style.display === 'block', n: z ? z.querySelectorAll('[data-rgglg]').length : 0, exp: !!document.querySelector('[data-rgfold="g01"]') }; });
  ok(g1.open && g1.n === 3 && !g1.exp, '상태를 누르면 작은 창(세 단추) · 줄은 펼쳐지지 않음', g1);
  await p.keyboard.press('3'); await p.waitForTimeout(900);
  const g2 = await FS(); const cl1 = await p.evaluate(() => ({ open: (document.getElementById('rgglpop') || {}).style ? document.getElementById('rgglpop').style.display : 'none', fx: !!document.querySelector('.rgrow[data-rgexp="g01"] [data-rggl="grade"].glok'), txt: (document.querySelector('.rgrow[data-rgexp="g01"] [data-rggl="grade"]') || {}).textContent }));
  ok(g2.g01.grade === 3 && cl1.open !== 'block' && /중/.test(cl1.txt), '숫자 3 → 「중」 저장 · 창 닫힘', { g: g2.g01.grade, cl1 });
  ok(cl1.fx, '고친 칸은 잠깐 초록(glok)', cl1);
  // 자세히 카드와 같은 저장인지 — 같은 상품을 자세히 함수로 바꾼 값과 견줌
  const same = await p.evaluate(async () => { const a = S.regItems.get('g01'); const b = { ...a, id: 'g01b' }; delete b.priceLog; b.grade = 2; S.regItems.set('g01b', b); await db.collection('reg_items').doc('g01b').set({ ...b }); await regGradeSet('g01b', 3); const x = S.regItems.get('g01'), y = S.regItems.get('g01b'); S.regItems.delete('g01b'); delete window.__FS.reg_items.g01b; return { gx: x.grade, gy: y.grade, px: x.price, py: y.price, mx: x.priceManual, my: y.priceManual, lx: (x.priceLog || []).slice(-1)[0] && (x.priceLog || []).slice(-1)[0].how, ly: (y.priceLog || []).slice(-1)[0] && (y.priceLog || []).slice(-1)[0].how }; });
  ok(same.gx === same.gy && same.px === same.py && same.mx === same.my && same.lx === same.ly, '한눈에 저장 값 = 자세히 카드 저장 값(상태·판매가·고친 기록)', same);
  // 3) 수량 — 숫자 4 · 직접 7 · 11은 빨강
  await p.click(row('g02') + ' [data-rggl="qty"]'); await p.waitForTimeout(150); await p.keyboard.press('4'); await p.waitForTimeout(700);
  let q = await FS(); ok(q.g02.qty === 4, '수량 숫자 4 → 4부', q.g02.qty);
  await p.click(row('g02') + ' [data-rggl="qty"]'); await p.waitForTimeout(150); await p.fill('#rgglpop [data-rgglqin]', '11'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const qb = await p.evaluate(() => { const m = document.querySelector('#rgglpop .rggl-msg'); return { open: document.getElementById('rgglpop').style.display, cls: m && m.className, t: m && m.textContent }; });
  q = await FS(); ok(qb.open === 'block' && /bad/.test(qb.cls) && /1~10/.test(qb.t) && q.g02.qty === 4, '수량 11 → 저장 안 함 · 빨간 까닭(1~10부)', qb);
  await p.fill('#rgglpop [data-rgglqin]', '7'); await p.keyboard.press('Enter'); await p.waitForTimeout(700); q = await FS(); ok(q.g02.qty === 7, '직접 7 + Enter → 7부', q.g02.qty);
  // Esc 닫기
  await p.click(row('g02') + ' [data-rggl="qty"]'); await p.waitForTimeout(150); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.getElementById('rgglpop').style.display !== 'block'), 'Esc → 창 닫힘(저장 없음)');
  // 4) 관리 코드 — 자동 완성 · 서가 칩 · 부가코드(매입처) 칩 · 미리보기 · Enter 저장
  await p.waitForTimeout(500); /* 바로 앞 수량 단추의 누름 움직임(tapfx)이 끝난 뒤 — 움직이는 동안 옆 코드 단추 자리를 덮어 누름이 수량으로 갈 때가 있음 */
  await p.click(row('g02') + ' [data-rggl="code"]'); await p.waitForTimeout(200);
  const c0 = await p.evaluate(() => { const z = document.getElementById('rgglpop'); return { foc: document.activeElement && document.activeElement.dataset.rgglcin === '1', v: z.querySelector('[data-rgglcin]').value, shelf: z.querySelectorAll('[data-rgglb]').length, star: (z.querySelector('[data-rgglb]') || {}).textContent, src: [...z.querySelectorAll('[data-rggls]')].map((b) => b.textContent), pv: z.querySelector('[data-rgglpv]').textContent }; });
  ok(c0.foc && c0.v === 'BLKCMN' && c0.shelf >= 15 && /★/.test(c0.star) && /YLWNOT/.test(c0.star), '코드 창: 직접 입력 칸에 커서·지금 코드 · 서가 칩(★ 슬롯 먼저)', c0);
  ok(c0.src.some((t) => /없음/.test(t) && /EX/.test(t)) && c0.src.some((t) => /김미소/.test(t) && /_ms/.test(t) && /MS/.test(t)) && c0.src.some((t) => /헌옷/.test(t) && /HD/.test(t)), '부가코드 칩 = 매입처(없음 EX · 김미소책방 _ms MS · 헌옷도라이 _hd HD)', c0.src);
  await p.fill('#rgglpop [data-rgglcin]', 'pnk'); await p.waitForTimeout(150);
  const s1 = await p.evaluate(() => [...document.querySelectorAll('#rgglpop [data-rgglso]')].map((x) => x.dataset.rgglso));
  ok(s1.includes('PNKLUX'), '자동 완성: pnk → PNKLUX(최근·목록)', s1);
  await p.fill('#rgglpop [data-rgglcin]', 'YLW'); await p.waitForTimeout(120); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  const s2 = await p.evaluate(() => ({ L: [...document.querySelectorAll('#rgglpop [data-rgglso]')].map((x) => x.dataset.rgglso + (x.classList.contains('on') ? '*' : '') + '|' + ((x.querySelector('small') || {}).textContent || '')) }));
  ok(s2.L[0] && /^YLWNOT\*\|슬롯/.test(s2.L[0]), '자동 완성: 슬롯 코드가 맨 앞 · ↓로 고름', s2);
  await p.keyboard.press('Enter'); await p.waitForTimeout(100); // 후보를 칸에 넣음
  await p.click('#rgglpop [data-rggls="ms"]'); await p.waitForTimeout(100);
  const pv = await p.evaluate(() => document.querySelector('#rgglpop [data-rgglpv]').textContent + ' ' + document.querySelector('#rgglpop [data-rgglsku]').textContent);
  ok(/^YLWNOT_ms/.test(pv) && /MS/.test(pv), '미리보기 = 서가 + 부가코드 합침(YLWNOT_ms · SKU 끝 MS)', pv);
  await p.focus('#rgglpop [data-rgglcin]'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  q = await FS(); const cv = await p.evaluate(() => (document.querySelector('.rgrow[data-rgexp="g02"] [data-rggl="code"]') || {}).textContent);
  ok(q.g02.code === 'YLWNOT' && q.g02.codeManual === true && q.g02.source === 'ms' && /YLWNOT_ms/.test(cv), 'Enter 저장 → 코드 YLWNOT·직접 고름 · 매입처 ms(자세히 카드 단추와 같은 칸) · 줄에 YLWNOT_ms', { c: q.g02.code, m: q.g02.codeManual, s: q.g02.source, cv });
  // 빈 코드 → 빨강
  await p.click(row('g02') + ' [data-rggl="code"]'); await p.waitForTimeout(150); await p.fill('#rgglpop [data-rgglcin]', ''); await p.click('#rgglpop [data-rgglsave]'); await p.waitForTimeout(150);
  const eb = await p.evaluate(() => { const m = document.querySelector('#rgglpop .rggl-msg'); return m && m.className + '|' + m.textContent; }); ok(/bad/.test(eb) && /비어/.test(eb), '빈 코드 저장 → 빨간 까닭', eb);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  // 서가 칩 누르기 → 저장
  await p.click(row('g03') + ' [data-rggl="code"]'); await p.waitForTimeout(150); await p.click('#rgglpop [data-rgglb="BLUPRO"]'); await p.click('#rgglpop [data-rgglsave]'); await p.waitForTimeout(700); q = await FS();
  ok(q.g03.code === 'BLUPRO' && (q.g03.source || '') === '', '서가 칩 BLUPRO → 저장(매입처 그대로)', { c: q.g03.code, s: q.g03.source });
  // 5) 잠금 — 확정 탭 상품·맡긴 상품
  const lk = await p.evaluate(() => ({ a: regGlLock(S.regItems.get('g04')), b: regGlLock(S.regItems.get('g06')), c: regGlLock(S.regItems.get('g05')) }));
  ok(/맡긴/.test(lk.a) && /확정/.test(lk.b) && lk.c === '', '잠금: 맡긴 상품·확정 상품 잠김 · 보류는 고침', lk);
  await p.evaluate(() => { S.regT = 'pick'; regRerender(); }); await p.waitForTimeout(700);
  const l1 = await p.evaluate(() => { const b = document.querySelector('.rgrow[data-rgexp="g04"] [data-rggl="grade"]'); return b ? { lk: b.classList.contains('lk'), i: !!b.querySelector('.rggl-lki') } : null; });
  await p.click('.rgrow[data-rgexp="g04"] [data-rggl="grade"]'); await p.waitForTimeout(150);
  const l2 = await p.evaluate(() => ({ open: (document.getElementById('rgglpop') || { style: {} }).style.display === 'block', pk: !!document.querySelector('.rgrow[data-rgexp="g04"] [data-rgpk2]') }));
  ok(l1 && l1.lk && l1.i && !l2.open && !l2.pk, '맡긴 상품 줄: 🔒 표시 · 눌러도 창 안 열림 · 결정 대기 단추 없음', { l1, l2 });
  // 6) → 결정 대기 두 번 누르기 (선택 대기 g03)
  await p.evaluate(() => { S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(700);
  await p.click(row('g03') + ' [data-rgpk2]'); await p.waitForTimeout(200); q = await FS();
  const pk1 = await p.evaluate(() => (document.querySelector('.rgrow[data-rgexp="g03"] [data-rgpk2]') || {}).textContent);
  ok(q.g03.stage === 'sel' && /한 번 더/.test(pk1), '→ 결정 대기 첫 누름: 옮기지 않고 「한 번 더 누르면 결정 대기로」', { st: q.g03.stage, pk1 });
  await p.click(row('g03') + ' [data-rgpk2]'); await p.waitForTimeout(800); q = await FS();
  ok(q.g03.stage === 'pick' && q.g03.movedAt, '둘째 누름 → 결정 대기로(자세히 「결정 대기로 →」와 같은 regMoveStage)', q.g03.stage);
  // 4초 지나면 풀림
  await p.click(row('g02') + ' [data-rgpk2]'); await p.waitForTimeout(4300); const pk3 = await p.evaluate(() => (document.querySelector('.rgrow[data-rgexp="g02"] [data-rgpk2]') || {}).textContent); await p.click(row('g02') + ' [data-rgpk2]'); await p.waitForTimeout(400); q = await FS();
  ok(/^→ 결정 대기$/.test(pk3) && q.g02.stage === 'sel', '4초가 지나면 첫 누름이 풀림(다시 두 번)', { pk3, st: q.g02.stage });
  // 자세히 카드에도 단추
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(); regRerender(); }); await p.waitForTimeout(900);
  const fu = await p.evaluate(() => { const c = document.querySelector('[data-rgchk="g02"]'); const card = c && c.closest('.card'); return card ? { pk: !!card.querySelector('.rgacts [data-rgpk2]'), pz: !!card.querySelector('.rgcov[data-pz]') } : null; });
  ok(fu && fu.pk && fu.pz, '자세히 카드에도 → 결정 대기 단추 · 표지 큰 보기', fu);
  // 7) 표지 마우스 올리기 → 앞면·뒷면·옆면 크게(없는 면은 없음)
  await p.evaluate(() => { try { localStorage.setItem('rn-imgzoom', 'three'); } catch (e) {} }); /* (11/06) 큰 보기는 웹앱 전체 하나의 고름(rn-imgzoom · 기본 앞면만)을 따름 — 세 장으로 골라 놓고 봄 */
  await p.locator('.card:has([data-rgchk="g02"]) img.rgcov').first().hover(); await p.waitForTimeout(400);
  const pz = await p.evaluate(() => { const z = document.getElementById('pzbox'); return z ? { d: z.style.display, f: [...z.querySelectorAll('.pz-f figcaption')].map((x) => x.textContent), no: z.querySelectorAll('.pz-no').length, img: z.querySelectorAll('.pz-f img').length } : null; });
  ok(pz && pz.d === 'block' && pz.f.map((x) => x.split(' ')[0]).join() === '앞면,뒷면,옆면' /* (11/06) 앞면 글 뒤에 크기(예 '1×1')가 붙음 */ && pz.img === 1 && pz.no === 2, '표지에 마우스 → 앞면(표지)·뒷면·옆면 큰 보기 · 없는 면 「없음」', pz);
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  // 8) 고르기 줄 = 카드 목록 바로 위 · 고른 상품 창 = 줄 위 · 창이 열려도 줄·카드가 안 밀림
  const tabs = ['q', 'sel', 'pick', 'hold', 'done', 'trash', 'bb', 'bbr'];
  const pos = []; for (const T of tabs) { await p.evaluate((T) => { S.regT = T; regRerender(); }, T); await p.waitForTimeout(500); pos.push(await p.evaluate((T) => { const bar = document.querySelector('#sheet [data-rgselbar]'); if (!bar) return { T, bar: false }; const nx = bar.nextElementSibling; const pv = bar.previousElementSibling; const inHead = !!bar.closest('.card'); return { T, bar: true, inHead, next: nx ? (nx.className || nx.tagName).slice(0, 40) : null, prevPan: pv && pv.dataset ? !!pv.dataset.rgselpan : false }; }, T)); }
  ok(pos.every((x) => x.bar && !x.inHead), '모든 탭: 고르기 줄이 탭 머리 칸 밖(카드 목록 바로 앞) — ' + tabs.join('·'), pos);
  ok(pos.filter((x) => ['sel', 'pick', 'hold'].includes(x.T)).every((x) => /card|rgrow/.test(x.next || '')), '선택·결정·보류 탭: 줄 바로 다음이 상품 카드', pos);
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S.regT = 'sel'; S.regSub = {}; /* (11/06) 'bbr'은 이제 선택 대기의 🛒 보기 — 위 탭 돌기에서 남은 하위 보기를 전체로 */ regRerender(); }); await p.waitForTimeout(700);
  const fid = await p.evaluate(() => { const bar = document.querySelector('#sheet [data-rgselbar]'); const c = bar.nextElementSibling; return c.querySelector('[data-rgchk]').dataset.rgchk; });
  const before = await p.evaluate(() => { const bar = document.querySelector('#sheet [data-rgselbar]'); bar.scrollIntoView({ block: 'center' }); const c = bar.nextElementSibling; return { bar: Math.round(bar.getBoundingClientRect().top), card: Math.round(c.getBoundingClientRect().top) }; });
  await p.evaluate((id) => document.querySelector(`#sheet [data-rgchk="${id}"]`).click(), fid); await p.waitForTimeout(900);
  const after = await p.evaluate((id) => { const bar = document.querySelector('#sheet [data-rgselbar]'); const pan = document.querySelector('#sheet [data-rgselpan]'); const c = document.querySelector(`#sheet [data-rgchk="${id}"]`).closest('.card'); return { pan: !!pan, panAbove: pan ? pan.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1 : false, bk: pan ? !!pan.querySelector('.rgbk') : false, bar: Math.round(bar.getBoundingClientRect().top), card: Math.round(c.getBoundingClientRect().top), txt: bar.textContent.slice(0, 80) }; }, fid);
  ok(after.pan && after.panAbove && after.bk, '고르면 「✔ 고른 n개 한꺼번에 바꾸기」 창이 고르기 줄 위에', after);
  ok(Math.abs(after.card - before.card) <= 3 && Math.abs(after.bar - before.bar) <= 3, '창이 열려도 고르기 줄·카드가 밀려 내려가지 않음', { before, after });

  // 9) 🏷 알라딘 매입 — (정범님 11/05) 근삿값 판정(우리 판매가 ≤ 매입가 × 1.15) · 📋 한눈에 = 줄 아래 아주 얇은 한 줄(줄의 약 ⅓) · 단추 셋 · 🔎 자세히 = 카드 안 '🏷 알라딘 매입' 칸 하나에 모두
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'compact'); S._regOpen = new Set(); S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(900);
  const lim = await p.evaluate(() => { let o = null; for (let P = 3000; P < 30000; P += 10) if (!bbNearJ(P, 3800, '상').in) { o = P; break; } let o3 = null; for (let P = 1500; P < 30000; P += 10) if (!bbNearJ(P, 2000, '중').in) { o3 = P; break; } window.__out = o + 200; window.__out3 = o3 + 200; return { o, o3, j30: bbNearJ(30000, 3800, '상').in }; });
  ok(lim.o && lim.j30 === false && await p.evaluate(() => !document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn')), `판매가 30,000(직접 팔면 매입가 3,800보다 500원 넘게 남음 · 경계 ${lim.o}원)은 띠 없음`, lim);
  await p.evaluate(async () => { const t = new Date().toISOString(); const d = { stage: 'sel', grade: 2, qty: 1, price: 1000, ws: regWsCur(), createdAt: t, info: { title: '처음부터 칸 책', isbn13: '9791100000199', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t, buyback: { 상: 3800 } } }; await db.collection('reg_items').doc('g09').set(d); S.regItems.set('g09', { id: 'g09', ...d }); regRerender(); }); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="g09"] .rgbbn')), '조회 직후 판정에 든 줄은 처음부터 띠 있음(매입가 이하)');
  await p.evaluate(() => { window.__mark = document.querySelector('.rgrow[data-rgexp="g01"]'); });
  await p.fill('.rgrow[data-rgexp="g07"] input.rgr-pin', '4300'); await p.waitForTimeout(80);
  const b1 = await p.evaluate(() => { const r = document.querySelector('.rgrow[data-rgexp="g07"]'); const n = r && r.querySelector(':scope > .rgbbn'); if (!n) return null; const rr = r.getBoundingClientRect(), nr = n.getBoundingClientRect(); const bs = [...n.querySelectorAll('button')]; return { inRow: nr.left >= rr.left - 1 && nr.right <= rr.right + 1 && nr.bottom <= rr.bottom + 1, txt: n.textContent, h: n.offsetHeight, rowH: r.offsetHeight - n.offsetHeight, lines: Math.round(n.offsetHeight / parseFloat(getComputedStyle(n).lineHeight || '18')), btn: bs.map((b) => b.textContent.trim()), cart: !!n.querySelector('[data-rgcartnow]'), out: n.querySelector('[data-rgbbout]') ? n.querySelector('[data-rgbbout]').disabled : null, peek: !!n.querySelector('[data-rgbbpeek]'), long: /까닭|등급별|최상 /.test(n.textContent), same: window.__mark === document.querySelector('.rgrow[data-rgexp="g01"]') }; });
  ok(b1 && /🏷 매입 상 3,800원 · 우리 4,300원\(\+13%\)/.test(b1.txt) && !b1.long, '기준 안(4,300 — 직접 팔아도 500원 넘게 안 남음) → 바로 얇은 띠: 「🏷 매입 상 3,800원 · 우리 4,300원(+13%)」 요약만(등급별·까닭 긴 글 없음)', b1);
  ok(b1 && b1.btn.length === 3 && b1.cart && b1.out === true && b1.peek && /장바구니/.test(b1.btn[0]) && /빼기/.test(b1.btn[1]) && /매입 페이지/.test(b1.btn[2]), '단추는 딱 셋: 🛒 장바구니 · ↩ 빼기(장바구니에 없으면 흐림) · 🏷 매입 페이지', b1 && b1.btn);
  ok(b1 && b1.h <= 24 && b1.h <= b1.rowH * 0.5 && b1.inRow && b1.same, `띠 높이 ${b1 && b1.h}px = 줄(${b1 && b1.rowH}px)의 약 ⅓ · 한 줄 · 줄 테두리 안 · 다른 줄은 다시 그리지 않음`, b1);
  await p.fill('.rgrow[data-rgexp="g07"] input.rgr-pin', String(lim.o + 200)); await p.waitForTimeout(80);
  ok(await p.evaluate(() => !document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn')), '기준 넘는 값(직접 팔면 500원 넘게 더 남음)으로 치면 그 자리에서 사라짐');
  await p.fill('.rgrow[data-rgexp="g07"] input.rgr-pin', '4300'); await p.press('.rgrow[data-rgexp="g07"] input.rgr-pin', 'Tab'); await p.waitForTimeout(1300);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn') && !(S._regOpen && S._regOpen.has('g07'))), '다시 4,300으로 저장하면 띠가 남음 · 자세히는 열리지 않음');
  // 중 — 판정에 넣고 ⚠ (중 매입가 2,000 · 근삿값 2,300)
  await p.evaluate(async () => { await regUpd('g07', { grade: 3, price: window.__out3 }); }); await p.waitForTimeout(80); const gOff = await p.evaluate(() => !document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn'));
  await p.evaluate(async () => { await regUpd('g07', { price: 2200 }); }); await p.waitForTimeout(120); const g3 = await p.evaluate(() => { const n = document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn'); return n ? n.textContent : null; });
  await p.evaluate(async () => { await regUpd('g07', { grade: 2, price: 4300 }); }); await p.waitForTimeout(120); const gOn = await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn'));
  ok(gOff && g3 && /매입 중 2,000원/.test(g3) && /⚠ 중: 알라딘이 안 살 수 있음/.test(g3) && gOn, '중도 판정에 듦(2,200 — 중 매입가 2,000과 견줌) · ⚠ 중 경고 · 상태·값을 바꾸면 그 줄 띠만 바로', { gOff, g3, gOn });
  // 매입가가 새로 들어오면 나타남
  await p.evaluate(async () => { const t = new Date().toISOString(); const d = { stage: 'sel', grade: 2, qty: 1, price: 1000, ws: regWsCur(), createdAt: t, info: { title: '매입가 나중 책', isbn13: '9791100000198', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t } }; await db.collection('reg_items').doc('g10').set(d); S.regItems.set('g10', { id: 'g10', ...d }); regRerender(); }); await p.waitForTimeout(900);
  const bA = await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="g10"] .rgbbn')); await p.evaluate(async () => { const it = S.regItems.get('g10'); await regUpd('g10', { info: { ...it.info, buyback: { 상: 3800 } } }); }); await p.waitForTimeout(80);
  ok(!bA && await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="g10"] .rgbbn')), '매입가가 새로 들어오면 그 줄 띠가 나타남', bA);
  // 정할 것이 있으면 단추 대신 「⚠ 정할 것 있음」 → 누르면 자세히로
  const dec = await p.evaluate(async () => { const o = window.regBbnDec; window.regBbnDec = () => ({ id: 'x' }); regBbnSync('g10'); const n = document.querySelector('.rgrow[data-rgexp="g10"] .rgbbn'); const r = { btn: n ? [...n.querySelectorAll('button')].map((b) => b.textContent.trim()) : null }; n.querySelector('[data-rgbbdec]').click(); await new Promise((z) => setTimeout(z, 700)); r.open = !!(S._regOpen && S._regOpen.has('g10')) && !!document.querySelector('#sheet [data-rgbbsec="g10"]'); window.regBbnDec = o; S._regOpen.delete('g10'); regRerender(); return r; });
  ok(dec.btn && dec.btn.length === 1 && /정할 것 있음/.test(dec.btn[0]) && dec.open, "정할 것(같은 책이 이미 알라딘 매입에 있음)이면 「⚠ 정할 것 있음」 하나 → 누르면 자세히 '🏷 알라딘 매입' 칸으로", dec);
  // 🏷 매입 페이지 = 잠깐 보기
  await p.waitForTimeout(700); await p.click('.rgrow[data-rgexp="g09"] .rgbbn [data-rgbbpeek]'); await p.waitForTimeout(700);
  const pk = await p.evaluate(() => ({ peek: !!S._bbPeek && !!(S.detail && S.detail.bbuy) })); await p.evaluate(() => history.back()); await p.waitForTimeout(900);
  ok(pk.peek, '「🏷 매입 페이지」 = 등록 화면 위에 알라딘 매입 페이지 잠깐 보기', pk);
  // 띠 안 🛒 장바구니 — 두 번 눌러 담기
  const cmds = () => p.evaluate(() => Object.values(window.__FS.shp_cmds || {}).filter((v) => v.type === 'c2bAdd').length);
  await p.evaluate(() => { S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(1500); const n0 = await cmds(); await p.click('.rgrow[data-rgexp="g07"] .rgbbn [data-rgcartnow]'); await p.waitForTimeout(450); /* (11/10 ux2 ⑪) 0.4초 안 두 번째 누름은 무시 */ const n1 = await cmds(); const arm = await p.evaluate(() => (document.querySelector('.rgrow[data-rgexp="g07"] .rgbbn [data-rgcartnow]') || {}).textContent);
  await p.click('.rgrow[data-rgexp="g07"] .rgbbn [data-rgcartnow]'); await p.waitForTimeout(1500); const n2 = await cmds(); const st7 = await p.evaluate(() => (S.regItems.get('g07') || {}).stage);
  ok(n1 === n0 && /한 번 더/.test(arm || '') && n2 === n0 + 1 && st7 === 'bb', '띠 🛒 장바구니: 한 번은 아무 일 없음 · 두 번이면 알라딘 매입으로 보내고 담기 맡김', { n0, n1, n2, arm, st7 });
  // 🔎 자세히 — 카드 안 '🏷 알라딘 매입' 칸 하나에 모두 · 다른 곳에 남은 알라딘 매입 단추·매입가 줄 없음
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); regRerender(); }); await p.waitForTimeout(1000);
  const dz = await p.evaluate(() => { const c = document.querySelector('#sheet [data-rgchk="g09"]'); const card = c && c.closest('.card'); const s = card && card.querySelector('[data-rgbbsec="g09"]'); if (!s) return null; const outside = [...card.querySelectorAll('[data-rgbbsend],[data-rgcartnow],.rgbb,[data-rgbb],.rgbbn,.rgbbr,[data-rgbbr]')].filter((el) => !el.closest('.rgbbsec')).length; return { sec: true, last: s.parentElement.lastElementChild === s || card.lastElementChild.contains(s), buy: !!s.querySelector('[data-rgbb] .rgbb'), near: /남는 돈/.test(s.textContent) && /최상/.test(s.textContent) && /기준/.test(s.textContent), send: !!s.querySelector('[data-rgbbsend]'), cart: !!s.querySelector('[data-rgcartnow]'), outside, h: s.offsetHeight }; });
  ok(dz && dz.buy && dz.near && dz.send && dz.cart && dz.outside === 0, "자세히 카드: '🏷 알라딘 매입' 칸 하나에 매입가·판정 셈 식·등급별 매입가·보내기·바로 장바구니 — 칸 밖에는 알라딘 매입 단추·줄 없음", dz);
  await p.fill('#sheet .card:has([data-rgchk="g09"]) input[data-rgpin]', '9000'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => !/알라딘 매입이 나을 수 있음/.test((document.querySelector('[data-rgbbsec="g09"]') || {}).textContent || '') && !!document.querySelector('[data-rgbbsec="g09"] [data-rgbbsend]')), '자세히: 판매가를 근삿값 밖으로 치면 판정 줄만 바로 사라짐(칸·단추는 그대로)');
  await p.fill('#sheet .card:has([data-rgchk="g09"]) input[data-rgpin]', '1000'); await p.press('#sheet .card:has([data-rgchk="g09"]) input[data-rgpin]', 'Tab'); await p.waitForTimeout(900);
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'compact'); regRerender(); }); await p.waitForTimeout(800);
  // 10) 360px — 창·칸이 화면 안
  await p.setViewportSize({ width: 360, height: 760 }); await p.evaluate(() => { regRerender(); }); await p.waitForTimeout(900);
  await p.locator('.rgrow[data-rgexp="g09"] [data-rggl="code"]').scrollIntoViewIfNeeded(); await p.click('.rgrow[data-rgexp="g09"] [data-rggl="code"]'); await p.waitForTimeout(250);
  const m = await p.evaluate(() => { const z = document.getElementById('rgglpop'); const r = z.getBoundingClientRect(); const c = [...z.querySelectorAll('.rggl-c')].map((b) => b.getBoundingClientRect().height); const bn = document.querySelector('.rgrow[data-rgexp="g09"] .rgbbn'); const br = bn && bn.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, H: innerHeight, minC: Math.min(...c), sw: document.documentElement.scrollWidth, bn: br ? [br.left, br.right] : null }; });
  ok(m.l >= 0 && m.r <= 360 && m.b <= m.H && m.minC >= 43.5, '360px: 코드 창이 화면 아래 판으로 화면 안 · 칩 44px', m);
  ok(m.bn && m.bn[0] >= -1 && m.bn[1] <= 361, '360px: 매입 칸도 화면 안', m.bn);
  await p.keyboard.press('Escape');
  console.log(bad ? `❌ tREGGL 실패 ${bad}` : '✓ tREGGL 통과'); });
