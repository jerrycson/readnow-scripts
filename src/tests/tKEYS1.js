// tKEYS1 — 정범님 11/09 '⌨ 카드 단축키 한 장치(🧮 수동 일괄 처리 · 📥 등록)'
//  활성 카드 하나(테두리 · ⌨ 띠 · 활성 시장 지표) · 단축키는 활성 카드에만 · 두 번 누르는 단추는 단축키도 두 번 · 키 바꾸기(겹침 안내 · 기본값으로 · 이 기기 rn-kba)
//  · 글 쓰는 중 글자 키는 글자로 · 등록 「빼기」 모든 하위 탭 · 두 번 · ↩ 되돌리기 · 예전 등록 Alt+A·B → Alt+Shift+F·D
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '0', sellerName: '알라딘', ship: 0 }];
const W = (p, ms) => p.waitForTimeout(ms);
const seedReg = async (p, view) => { await p.evaluate(require('./seed.js')); await W(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
  await p.evaluate(async ({ PG, view }) => { const T0 = Date.parse('2026-11-09T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); window.ask = async () => true; localStorage.removeItem('rn-kba');
    const mk = (id, k, o) => ({ stage: 'sel', isbn: '97911000088' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), movedAt: at(100 - k), code: 'BLKCMN', codeManual: true, info: { title: '시험 책 ' + id, isbn13: '97911000088' + String(k).padStart(2, '0'), itemId: '88' + k, categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, at: at(k), buyback: { 상: 1000 } }, ...o });
    const L = { s1: mk('s1', 1, {}), s2: mk('s2', 2, {}), s3: mk('s3', 3, { method: 'one' }), s4: mk('s4', 4, {}), p1: mk('p1', 11, { stage: 'pick' }), p2: mk('p2', 12, { stage: 'pick', method: 'one' }), p5: mk('p5', 15, { stage: 'pick' }) };
    const Ls = [{ id: 'LD2', listingId: '8102', title: '시험 책 p2', isbn13: L.p2.isbn, aladinItemId: '8812', grade: '상', qty: 1, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'UE2' }, { id: 'LD5', listingId: '8105', title: '시험 책 p5', isbn13: L.p5.isbn, aladinItemId: '8815', grade: '상', qty: 1, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'UE5' }];
    Ls.forEach((l) => { S.plist.set(l.id, l); S.uinfo.set(l.listingId, { none: true }); }); S.ver = (S.ver || 0) + 1;
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d, dupMv: d.stage === 'pick' ? at(0) : undefined }); }
    localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-subcfg'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = {}; S.detail = null; openRegister(); }, { PG, view });
  await W(p, 1800); };
const act = (p) => p.evaluate(() => { const c = [...document.querySelectorAll('.kbcur')]; const b = [...document.querySelectorAll('.kba-bdg')]; const m = [...document.querySelectorAll('.kba-mk')]; const el = c[0]; return { n: c.length, nb: b.length, nm: m.length, id: el ? (el.dataset.rgcid || el.dataset.rgexp || el.dataset.mk) : null, rgcur: el ? el.classList.contains('rgcur') : null, bdg: b[0] ? b[0].textContent : '', bdgIn: !!(el && b[0] && b[0].parentElement === el), mkIn: !!(el && m[0] && el.contains(m[0])), mkT: m[0] ? m[0].dataset.kbamk : '', bord: el ? getComputedStyle(el).boxShadow + '|' + getComputedStyle(el).outlineStyle : '' }; });
const hint = (p) => p.evaluate(() => (document.getElementById('kbhint') || {}).textContent || '');
const stage = (p, id) => p.evaluate((id) => (S.regItems.get(id) || {}).stage, id);
const blur = (p) => p.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });

H(async (p) => { await seedReg(p, 'full');
  // ① 등록 — 활성 카드 하나 = J/K 지금 할 카드 · ⌨ 띠 · 활성 시장 지표
  await blur(p); await p.evaluate(() => { S._regCur = 's1'; regCurApply(false); }); await W(p, 200);
  let A = await act(p);
  ok(A.n === 1 && A.nb === 1 && A.id === 's1' && A.rgcur && A.bdgIn && /활성 카드/.test(A.bdg) && /Alt \+ B/.test(A.bdg) && /Alt \+ N/.test(A.bdg) && /키 바꾸기/.test(A.bdg), '등록: 활성 카드 한 장 = 지금 할 카드(rgcur) · 오른쪽 위 ⌨ 띠에 그 카드 단축키(Alt + B · Alt + N …) · 「키 바꾸기」', A);
  ok(A.nm === 1 && A.mkIn && /활성 시장 지표/.test(A.mkT) && /Alt \+ Z/.test(A.mkT), '그 카드의 시장 지표 칸 = 「📊 활성 시장 지표 — Alt + Z 한 매물 위 · Alt + C 한 매물 아래」(다른 카드는 없음)', A);
  await p.keyboard.press('j'); await W(p, 250); A = await act(p); ok(A.id === 's2' && A.n === 1 && A.nb === 1 && A.nm === 1, 'J로 다음 카드 → 활성·띠·시장 지표 표시도 그 카드로(한 장만)', A);
  // ② Alt+B 두 번 → 결정 대기 (첫 번째 = 그 카드 단추 '한 번 더' · 대상 표시)
  await p.keyboard.press('Alt+b'); await W(p, 200); const b1 = await p.evaluate(() => { const b = document.querySelector('.rgc2[data-rgcid="s2"] [data-rgpk2]'); return { armed: b && b.classList.contains('armed'), t: b && b.textContent, st: S.regItems.get('s2').stage, other: (document.querySelector('.rgc2[data-rgcid="s1"] [data-rgpk2]') || {}).className }; }); const h1 = await hint(p);
  ok(b1.armed && /한 번 더/.test(b1.t) && b1.st === 'sel' && !/armed/.test(b1.other || '') && /#2/.test(h1) && /시험 책 s2/.test(h1) && /한 번 더/.test(h1), 'Alt+B 첫 번째: 활성 카드(s2)의 「→ 결정 대기」만 「한 번 더」 · 아래 알림에 대상(#2 「시험 책 s2」) · 아직 안 옮김', { b1, h1 });
  await p.keyboard.press('Alt+b'); await W(p, 1200); ok((await stage(p, 's2')) === 'pick', 'Alt+B 두 번째: s2 → 결정 대기', await stage(p, 's2'));
  A = await act(p); ok(A.n === 1 && A.id !== 's2', '처리하면 다음 카드가 활성(J/K 규칙 그대로)', A);
  await p.click('#sheet [data-rgundo="s2"]'); await W(p, 1200); ok((await stage(p, 's2')) === 'sel', '↩ 되돌리기로 s2 선택 대기로', null);
  // ③ 시장 지표 한 매물 위·아래 (Alt+Z / Alt+C) — 9,000 → 4,000(5,200 매물을 넘어 4,000 바로 아래 = 동가) → 5,200 → 4,000 → 맨 위(한 단위 싸게)
  await blur(p); await p.evaluate(() => { S._regCur = 's1'; regCurApply(false); }); await W(p, 200);
  const pr = async (k) => { await p.keyboard.press(k); await W(p, 900); return p.evaluate(() => S.regItems.get('s1').price); };
  const z1 = await pr('Alt+z'); const c1 = await pr('Alt+c'); const z2 = await pr('Alt+z'); const z3 = await pr('Alt+z'); const hz = await hint(p);
  ok(z1 === 4000 && c1 === 5200 && z2 === 4000 && z3 > 0 && z3 < 4000, 'Alt+Z 한 매물 위 · Alt+C 한 매물 아래 — 노란 ▶ 줄 끌기와 같은 규칙(그 매물 바로 아래 = 같은 가격 · 맨 위 = 한 단위 싸게)', { z1, c1, z2, z3 });
  const z4 = await pr('Alt+z'); const hz4 = await hint(p); ok(z4 === z3 && /맨 위/.test(hz4), '이미 맨 위에서 Alt+Z = 그대로 + 「이미 맨 위」 알림', { z4, hz4 });
  // ④ 「빼기」 — 단축키 두 번 · ↩ 되돌리기(데이터 그대로)
  await p.keyboard.press('Alt+n'); await W(p, 250); const d1 = await p.evaluate(() => ({ st: S.regItems.get('s1').stage, t: (document.querySelector('.rgc2[data-rgcid="s1"] [data-rgdel]') || {}).textContent, hist: !!document.querySelector('#msc_hist, .msc-hist, [data-mschist]') })); const hd1 = await hint(p);
  ok(d1.st === 'sel' && /한 번 더 누르면 빼기/.test(d1.t || '') && /한 번 더/.test(hd1) && /#1/.test(hd1), 'Alt+N 첫 번째: 그 카드 「빼기」가 「한 번 더 누르면 빼기」 · 대상 알림 · 아직 안 뺌 (💬 대화 기록이 아니라 빼기)', { d1, hd1 });
  await p.keyboard.press('Alt+n'); await W(p, 1300); const d2 = await p.evaluate(() => ({ st: S.regItems.get('s1').stage, fs: (window.__FS.reg_items.s1 || {}).stage, from: (window.__FS.reg_items.s1 || {}).trashFrom, gone: (document.querySelector('#sheet [data-rggone="s1"]') || {}).textContent || '', info: !!(window.__FS.reg_items.s1 || {}).info }));
  ok(d2.st === 'trash' && d2.fs === 'trash' && d2.from === 'sel' && d2.info && /뺌/.test(d2.gone) && /되돌리기/.test(d2.gone), 'Alt+N 두 번째: 휴지통으로(문서·상품 정보 그대로 · 원래 탭 기록) · 그 자리 「✓ 뺌 · ↩ 되돌리기」', d2);
  await p.click('#sheet [data-rgundo="s1"]'); await W(p, 1300); const d3 = await p.evaluate(() => ({ st: S.regItems.get('s1').stage, h: ((window.__FS.reg_items.s1 || {}).history || []).map((x) => x.what).join(' / ') }));
  ok(d3.st === 'sel' && /휴지통으로/.test(d3.h) && /되돌림/.test(d3.h), '↩ 되돌리기 → 선택 대기로 · 이력에 둘 다 남음', d3);
  // ⑤ 「빼기」 버튼 — 모든 하위 탭 카드(자세히·한눈에·♻ 기등록) · 마우스도 두 번
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'compact'); S.regT = 'sel'; S.regSub = {}; openRegister(); }); await W(p, 1300);
  const cnt = async () => p.evaluate(() => { const R = [...document.querySelectorAll('#sheet .rgrow[data-rgexp], #sheet .rgc2[data-rgcid][data-rgn], #sheet .rgdup[data-rgcid]')].filter((el) => !el.parentElement.closest('.rgc2, .rgdup')); return { n: R.length, d: R.filter((el) => el.querySelector('[data-rgdel]')).length }; });
  const subs = {}; for (const [T, L] of [['sel', ['all', 'bulk', 'one']], ['pick', ['all', 'bulk', 'one', 'dup']]]) { await p.evaluate((T) => { S.regT = T; S.regSub = {}; openRegister(); }, T); await W(p, 900); for (const k of L) { const b = await p.$(`.rgsub [data-rgmf="${k}"]`); if (!b) { subs[T + ':' + k] = 'no-tab'; continue; } await b.click(); await W(p, 600); subs[T + ':' + k] = await cnt(p); } }
  ok(Object.values(subs).every((x) => x && x.n > 0 && x.d === x.n), '모든 하위 탭의 카드에 「빼기」(📋 한눈에 줄 · ♻ 기등록 카드 포함)', subs);
  await p.evaluate(() => { S.regT = 'sel'; S.regSub = {}; openRegister(); }); await W(p, 900);
  await p.click('.rgrow[data-rgexp="s3"] [data-rgdel]'); await W(p, 300); const m1 = await p.evaluate(() => ({ st: S.regItems.get('s3').stage, exp: !!(S._regOpen && S._regOpen.has('s3')), t: (document.querySelector('.rgrow[data-rgexp="s3"] [data-rgdel]') || {}).textContent }));
  await p.click('.rgrow[data-rgexp="s3"] [data-rgdel]'); await W(p, 1300); const m2 = await p.evaluate(() => ({ st: S.regItems.get('s3').stage, gone: !!document.querySelector('#sheet [data-rggone="s3"] [data-rgundo]') }));
  ok(m1.st === 'sel' && !m1.exp && /한 번 더/.test(m1.t || '') && m2.st === 'trash' && m2.gone, '📋 한눈에 줄 「빼기」: 한 번 = 「한 번 더 누르면 빼기」(줄은 안 펼침) · 두 번 = 휴지통 + 그 자리 ↩ 되돌리기', { m1, m2 });
  await p.click('#sheet [data-rgundo="s3"]'); await W(p, 1200); ok((await stage(p, 's3')) === 'sel', '되돌림', null);
  // 4초 지나면 「한 번 더」가 풀림
  await p.click('.rgrow[data-rgexp="s4"] [data-rgdel]'); await W(p, 4400); await p.click('.rgrow[data-rgexp="s4"] [data-rgdel]'); await W(p, 600); const m3 = await p.evaluate(() => ({ st: S.regItems.get('s4').stage, t: (document.querySelector('.rgrow[data-rgexp="s4"] [data-rgdel]') || {}).textContent })); ok(m3.st === 'sel' && /한 번 더/.test(m3.t || ''), '4초가 지나면 첫 누름이 풀려 다시 한 번 더 눌러야 함(실수로 빼지 않음)', m3);
  // ⑥ 키 바꾸기 — 겹침 안내(이 화면 · 웹앱) · 글자 키 · 글 쓰는 중 무시 · 기본값으로
  await p.evaluate(() => { S._rgDel = null; kbaOpen('reg'); }); await W(p, 200); await p.click('.kba-pan [data-kbarec="reg:alw"]'); await W(p, 150);
  await p.keyboard.press('Alt+n'); await W(p, 150); const w1 = await p.evaluate(() => ({ w: (document.querySelector('.kba-pan .kba-warn') || {}).textContent || '', rec: !!KBA.rec, st: S.regItems.get(S._regCur).stage, armed: !!S._rgDel }));
  await p.keyboard.press('Alt+h'); await W(p, 150); const w2 = await p.evaluate(() => ({ w: (document.querySelector('.kba-pan .kba-warn') || {}).textContent || '', help: !!document.querySelector('.rn-help') }));
  await p.keyboard.press('Alt+s'); await W(p, 150); const w3 = await p.evaluate(() => (document.querySelector('.kba-pan .kba-warn') || {}).textContent || '');
  ok(/빼기/.test(w1.w) && /이 화면/.test(w1.w) && /다른 키/.test(w1.w) && w1.rec && !w1.armed, '키 바꾸기 중 Alt+N → 「⚠ Alt + N는 이 화면의 「빼기…」와(과) 겹침 — 다른 키 조합을 누르세요」 · 계속 기다림 · 빼기가 실행되지 않음', w1);
  ok(/단축키 설명서/.test(w2.w) && !w2.help && /검색창/.test(w3), 'Alt+H → 웹앱 「⌨ 단축키 설명서」와 겹침(설명서가 열리지 않음) · Alt+S → 등록 「🔎 검색창」과 겹침', { w2, w3 });
  await p.keyboard.press('y'); await W(p, 200); const r1 = await p.evaluate(() => ({ m: kbaMap('reg').alw, ls: JSON.parse(localStorage.getItem('rn-kba') || '{}'), rec: !!KBA.rec, row: (document.querySelector('.kba-pan [data-kbarow="reg:alw"]') || {}).textContent || '', t: (document.querySelector('#toast') || {}).textContent || '' }));
  ok(r1.m === 'KeyY' && r1.ls.reg && r1.ls.reg.alw === 'KeyY' && !r1.rec && /Y/.test(r1.row) && /기본 Alt \+ A/.test(r1.row), '겹치지 않는 Y → 바로 저장(이 기기 rn-kba) · 표에 「Y · 기본 Alt + A」', r1);
  await p.keyboard.press('Escape'); await W(p, 200); ok(!(await p.evaluate(() => !!document.querySelector('.kba-pan'))), 'Esc로 작은 창 닫힘', null);
  await p.evaluate(() => { document.getElementById('rg_in').value = ''; }); await p.focus('#rg_in'); await p.keyboard.type('yy'); await W(p, 300);
  const ty = await p.evaluate(() => ({ v: document.getElementById('rg_in').value, alpv: !!document.querySelector('.alpv') }));
  ok(ty.v === 'yy' && !ty.alpv, '글 쓰는 중(검색창): 글자 키 Y는 글자로 들어감 · 알라딘 창 안 열림', ty);
  await p.evaluate(() => { document.getElementById('rg_in').value = ''; }); await blur(p); await p.keyboard.press('y'); await W(p, 500); const ty2 = await p.evaluate(() => !!document.querySelector('.alpv'));
  ok(ty2, '입력 칸 밖: Y = 활성 카드의 🪟 알라딘 창', ty2); await p.evaluate(() => { try { alPvClose(); } catch (e) {} });
  await p.evaluate(() => kbaOpen('reg')); await W(p, 150); await p.click('.kba-pan [data-kbaall="reg"]'); await W(p, 200); const rs = await p.evaluate(() => ({ m: kbaMap('reg').alw, ls: localStorage.getItem('rn-kba') })); ok(rs.m === 'Alt+KeyA' && !/reg/.test(rs.ls || ''), '「모두 기본값으로」 → Alt+A로 돌아옴', rs); await p.evaluate(() => kbaClose());
  // ⑦ 예전 등록 Alt+A·B(⚡·📚) → Alt+Shift+F·D · Alt+A는 🪟 알라딘 창 · Alt+H 설명서에 카드 단축키 표
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S.regT = 'sel'; S.regSub = {}; openRegister(); }); await W(p, 1300); await blur(p);
  await p.keyboard.press('Alt+a'); await W(p, 500); const aa = await p.evaluate(() => ({ alpv: !!document.querySelector('.alpv'), phA: !!S._phuiA })); await p.evaluate(() => { try { alPvClose(); } catch (e) {} });
  const ta = await p.$('#sheet textarea[data-rgslot], #sheet textarea[data-rgjt]'); if (ta) await ta.focus(); await p.evaluate(() => { window.__phA0 = phuiAOpen; window.__phAn = 0; window.phuiAOpen = (o) => { window.__phAn++; return window.__phA0(o); }; }); await p.keyboard.press('Alt+Shift+f'); await W(p, 500); const pa = await p.evaluate(() => window.__phAn === 1); await p.evaluate(() => { window.phuiAOpen = window.__phA0; try { phuiAClose(true); } catch (e) {} });
  ok(aa.alpv && !aa.phA && pa, 'Alt+A = 활성 카드의 🪟 알라딘 창(예전 ⚡ 빠른 찾기가 아님) · Alt+Shift+F = ⚡ 상태 모음 빠른 찾기 창', { aa, pa, ta: !!ta });
  await blur(p); await p.keyboard.press('Alt+h'); await W(p, 300); const hp = await p.evaluate(() => (document.querySelector('.rn-help') || {}).textContent || ''); await p.evaluate(() => document.querySelectorAll('.rn-help').forEach((x) => x.remove()));
  ok(/카드 단축키 — 📥 등록/.test(hp) && /Alt \+ Shift \+ F/.test(hp) && /빼기/.test(hp) && !/Alt \+ A⚡/.test(hp), '⌨ 설명서(Alt+H)에 지금 카드 단축키 표(바꾼 키 그대로)', hp.slice(0, 300));
  const ph = await p.evaluate(() => { const b = document.querySelector('[data-phuia]'); return b ? b.title : 'none'; }); ok(ph === 'none' || /Alt \+ Shift \+ F/.test(ph), '🔍 문구 찾기 단추 설명에도 새 키', ph);
  // ⑧ ⚙ 설정 › ⌨ 카드 단축키 칸 (두 화면 표)
  await p.evaluate(() => { history.back(); }); await W(p, 800); await p.evaluate(() => featGo({ go: { tab: 'settings', sec: 'set_kbact' } })); await W(p, 1500);
  const st = await p.evaluate(() => { const d = document.querySelector('details[data-sec="set_kbact"]'); if (d && !d.open) d.open = true; return { has: !!d, b: !!document.querySelector('[data-kbaed="batch"] [data-kbarec="batch:dn"]'), r: !!document.querySelector('[data-kbaed="reg"] [data-kbarec="reg:del"]') }; });
  if (st.has && !st.b) { await W(p, 800); Object.assign(st, await p.evaluate(() => ({ b: !!document.querySelector('[data-kbaed="batch"] [data-kbarec="batch:dn"]'), r: !!document.querySelector('[data-kbaed="reg"] [data-kbarec="reg:del"]') }))); }
  ok(st.has && st.b && st.r, '⚙ 설정 › ⌨ 카드 단축키 칸 — 수동 일괄·등록 두 표(키 바꾸기)', st);
  const fe = await p.evaluate(() => FEAT.some((f) => /카드 단축키/.test(f.t) && f.go && f.go.sec === 'set_kbact')); ok(fe, '🔍 기능 찾기에 ⌨ 카드 단축키', fe);
  console.log(bad ? `❌ tKEYS1(등록) 실패 ${bad}` : '✓ tKEYS1(등록) 통과');
}).then(() => H(async (p) => { const b0 = bad;
  // ⑨ 🧮 수동 일괄 처리 — 같은 장치
  await p.evaluate(require('./seed.js')); await W(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async () => { localStorage.removeItem('rn-kba'); const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 };
    const P1 = [{ r: 1, n: '판매자A', sc: '1', g: '상', p: 4000, s: 2500, lid: 'Q1', c: 'green' }, { r: 2, n: '판매자B', sc: '2', g: '상', p: 5200, s: 2500, lid: 'Q2', c: 'green' }, { r: 3, n: '판매자C', sc: '3', g: '상', p: 7000, s: 2500, lid: 'Q3', c: 'green' }];
    S.batchRes = [...S.plist.values()].filter((l) => l.active).map((l) => ({ l, target: 9000, reasons: ['시험'], page1: P1, at: '2026-11-09' })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {};
    const c = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }; window.__c = c; drawBatchRes(sh, c, 'g1'); sh.scrollTop = 0; await new Promise((r) => setTimeout(r, 600)); });
  await blur(p); await W(p, 300); let A = await act(p); const first = await p.evaluate(() => { const L = [...document.querySelectorAll('#b_res .card.pq.bq[data-mk]')]; return L.map((x) => x.dataset.mk); });
  ok(A.n === 1 && A.nb === 1 && A.id === first[0] && /활성 카드/.test(A.bdg) && /Alt \+ S/.test(A.bdg) && /Alt \+ X/.test(A.bdg) && A.nm === 1 && A.mkIn && /활성 시장 지표/.test(A.mkT) && /box-shadow|rgb/.test(A.bord), '수동 일괄: 화면 맨 위 카드가 활성(노란 테두리 · ⌨ 띠 · 활성 시장 지표)', { A, first: first.slice(0, 3) });
  await p.click(`#b_res .card.pq.bq[data-mk="${first[1]}"] .pq-l ul`); await W(p, 200); A = await act(p); ok(A.id === first[1] && A.n === 1 && A.nb === 1, '다른 카드를 누르면 그 카드가 활성(한 장만)', A);
  const val = () => p.evaluate((k) => +document.querySelector(`#b_res .card.pq.bq[data-mk="${k}"] [data-bpin]`).value, first[1]);
  const v0 = await val(); await blur(p); await p.keyboard.press('Alt+s'); await W(p, 300); const v1 = await val(); const h1 = await hint(p); await p.keyboard.press('Alt+x'); await W(p, 300); const v2 = await val();
  const other = await p.evaluate((k) => +document.querySelector(`#b_res .card.pq.bq[data-mk="${k}"] [data-bpin]`).value, first[0]);
  ok(v0 === 9000 && v1 < v0 && v1 >= 8500 && v2 > v1 && other === 9000 && /−5%/.test(h1), 'Alt+S −5% · Alt+X +5% — 활성 카드에만(다른 카드 그대로) · 알림에 대상·값', { v0, v1, v2, other, h1 });
  await p.focus(`#b_res .card.pq.bq[data-mk="${first[1]}"] [data-bpin]`); await p.keyboard.press('Alt+s'); await W(p, 300); const v3 = await val(); ok(v3 < v2, '가격 칸에 커서가 있어도 Alt 조합은 먹음(글자는 안 들어감)', { v2, v3 });
  // 시장 지표 한 매물 위·아래: 9,000 → 5,200(7,000을 넘음) → 7,000 → 5,200
  await p.evaluate((k) => { const i = document.querySelector(`#b_res .card.pq.bq[data-mk="${k}"] [data-bpin]`); i.value = 9000; i.dispatchEvent(new Event('input', { bubbles: true })); }, first[1]); await blur(p); await W(p, 200);
  await p.keyboard.press('Alt+z'); await W(p, 300); const m1 = await val(); await p.keyboard.press('Alt+c'); await W(p, 300); const m2 = await val(); await p.keyboard.press('Alt+z'); await W(p, 300); const m3 = await val();
  const mkp = await p.evaluate((k) => { const m = document.querySelector(`#b_res .card.pq.bq[data-mk="${k}"] .pq-r .pblk.mark:not(.head) .pp`); return m ? m.textContent : ''; }, first[1]);
  ok(m1 === 5200 && m2 === 7000 && m3 === 5200 && /5,200/.test(mkp), 'Alt+Z 한 매물 위(7,000을 넘어 5,200) · Alt+C 한 매물 아래(7,000) · 노란 ▶ 줄도 그 자리로', { m1, m2, m3, mkp });
  await p.keyboard.press('Alt+a'); await W(p, 500); const al = await p.evaluate(() => !!document.querySelector('.alpv')); await p.evaluate(() => { try { alPvClose(); } catch (e) {} }); ok(al, 'Alt+A = 활성 카드의 🪟 알라딘 창(지금 있는 함수 그대로)', al);
  await p.keyboard.press('Alt+b'); await W(p, 700); const pk = await p.evaluate((k) => ({ pick: (S.batchSt.picks[k] || {}).price, cur: (document.querySelector('.kbcur') || {}).dataset ? document.querySelector('.kbcur').dataset.mk : null }), first[1]);
  ok(pk.pick === 5200 && pk.cur && pk.cur !== first[1], 'Alt+B = 활성 카드를 그 가격으로 결정 대기로 · 그 자리에 온 다음 카드가 활성', pk);
  // 키 바꾸기 — 겹침(이 화면 · 브라우저) · Esc 그만
  await p.evaluate(() => kbaOpen('batch')); await W(p, 150); await p.click('.kba-pan [data-kbarec="batch:dn"]'); await p.keyboard.press('Alt+x'); await W(p, 120); const k1 = await p.evaluate(() => (document.querySelector('.kba-pan .kba-warn') || {}).textContent || '');
  await p.keyboard.press('Alt+d'); await W(p, 120); const k2 = await p.evaluate(() => (document.querySelector('.kba-pan .kba-warn') || {}).textContent || '');
  await p.keyboard.press('Escape'); await W(p, 150); const k3 = await p.evaluate(() => ({ rec: !!KBA.rec, m: kbaMap('batch').dn, pan: !!document.querySelector('.kba-pan') }));
  ok(/\+5%/.test(k1) && /주소창/.test(k2) && !k3.rec && k3.m === 'Alt+KeyS' && k3.pan, '수동 일괄 키 바꾸기: Alt+X → 「이 화면의 +5%」와 겹침 · Alt+D → 브라우저 「주소창」과 겹침 · Esc = 그만(키 그대로 · 창은 그대로)', { k1, k2, k3 });
  await p.click('.kba-pan [data-kbarec="batch:dn"]'); await p.keyboard.press('Alt+Shift+y'); await W(p, 150); const k4 = await p.evaluate(() => kbaMap('batch').dn); await p.evaluate(() => kbaClose());
  await blur(p); const vb = await p.evaluate(() => +document.querySelector('.kbcur [data-bpin]').value); await p.keyboard.press('Alt+Shift+y'); await W(p, 300); const va = await p.evaluate(() => +document.querySelector('.kbcur [data-bpin]').value); await p.keyboard.press('Alt+s'); await W(p, 300); const vc = await p.evaluate(() => +document.querySelector('.kbcur [data-bpin]').value);
  ok(k4 === 'Alt+Shift+KeyY' && va < vb && vc === va, '바꾼 키(Alt+Shift+Y)로 −5% · 예전 키(Alt+S)는 더 안 먹음', { k4, vb, va, vc });
  // 크롬 Alt 조합 — 페이지가 받고 기본 동작을 막음(시험 브라우저: 메뉴 없음 확인은 못 함)
  const dp = await p.evaluate(() => new Promise((res) => { const h = (e) => { window.removeEventListener('keydown', h, false); res('bubble'); }; window.addEventListener('keydown', h, false); const ev = new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z', altKey: true, bubbles: true, cancelable: true }); const r = document.body.dispatchEvent(ev); setTimeout(() => res(r === false ? 'prevented' : 'not'), 50); }));
  ok(dp === 'prevented', 'Alt+Z 등은 웹앱이 받아 기본 동작을 막음(preventDefault · 다른 처리로 안 넘김)', dp);
  console.log(bad > b0 ? `❌ tKEYS1(수동 일괄) 실패 ${bad - b0}` : '✓ tKEYS1(수동 일괄) 통과');
  console.log(bad ? `❌ tKEYS1 실패 ${bad}` : '✓ tKEYS1 통과');
}));
