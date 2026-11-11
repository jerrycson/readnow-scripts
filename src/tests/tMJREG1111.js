// tMJREG1111 — (11/11 정범님 · 직원 MJ가 등록하며 느낀 불편) 📥 상품 등록
//  ① 상품 설명: 기본은 「설명 없음」 그대로 · ⚡ 간단 직접 입력 칸을 처음부터 옆에 띄움 → 쓰면 저절로 '간단 직접 입력'(비우면 다시 설명 없음) · 등록에 들어가는 값(regOwnDesc·regDescFinal)이 고름과 같음
//  ② 미등록 상품/세트 만들기 — 출판사·지은이 찾기 목록 맨 위에도 [닫기](맨 아래와 같은 동작) · 목록이 길면 위 닫기는 붙박이(sticky)
//  ③ 선택 대기 카드(자세히) — 아래 「결정 대기로 →」 옆에도 [빼기](위와 같은 두 번 누르기)
//  ④ ♻ 기등록 — 재고 상품의 알라딘 유의 사항(글·사진 · 상품 카드 '?'와 같은 자료) · 다른 화면이 '받는 중(null)'으로 둔 것도 다시 받음 · 재고가 여럿이면 어느 상품에 수량을 더할지 고르기 → 고른 상품 번호로 맡김
// 실행: cd pw && RN_PORT=<포트> node tMJREG1111.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/data-rgqauto="1"/.test(T) && /descMode: 'quick', descQuick: v/.test(T) && /descMode: 'none', descQuick: ''/.test(T), '설명 없음 카드에 ⚡ 칸 · 쓰면 quick · 비우면 none');
ok(/class="rgap-hd/.test(T) && /data-rgauthx="\$\{id\}" data-pos="top"/.test(T) && /\.rgap-hd\.long\{position:sticky/.test(T), '찾기 목록 맨 위 닫기 · 길면 sticky');
ok(/regDelBtn\(it\)\.replace\('rgdelb', 'rgdelb rgdelb-ft'\)\}<button class="btn sm" data-rgto="\$\{id\}" data-v="pick">결정 대기로 →/.test(T), '아래 결정 대기로 옆 빼기');
ok(/function regXDupPick\(/.test(T) && /S\.uinfo\.get\(x\) == null\); S\._dupNoteQ\.clear\(\)/.test(T), '기등록 고르기 · null 다시 받기');
{ const i = T.indexOf('function regXDupPick('); const blk = T.slice(i, i + 4000); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(blk) && !/01[016789]-?\d{3,4}-?\d{4}/.test(blk), '새 덩어리에 브라우저 창·전화 번호 꼴 없음'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJREG1111 ${bad}개 실패` : '✓ tMJREG1111 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }];
  const seed = async (p, view) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); p._dlg = dlg;
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async ({ PG, view }) => { const T0 = Date.parse('2026-11-11T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); window.ask = async () => true;
      const mk = (id, k, o) => ({ stage: 'sel', isbn: '97911000088' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), code: 'BLKCMN', codeManual: true, info: { title: '불편 시험 책 ' + id, isbn13: '97911000088' + String(k).padStart(2, '0'), itemId: '88' + k, categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, at: at(k) }, ...o });
      const L = { d1: mk('d1', 1, { method: 'one' }), d2: mk('d2', 2, { method: 'one' }), n1: { stage: 'sel', method: 'new', grade: 2, qty: 1, price: 7000, ws: regWsCur(), createdAt: at(3), q: '미등록 시험 책', newInfo: { title: '미등록 시험 책' } },
        u1: mk('u1', 9, { stage: 'pick', method: 'one' }) };
      /* ④ 같은 책 재고 2개 — L1 유의 사항 글 있음(다른 화면이 '받는 중 null'로 둔 상태) · L2 글 없음 + 판매자 사진 */
      const isb = L.u1.isbn; const Ls = [{ id: 'LU1', listingId: '9001', title: '불편 시험 책 u1', isbn13: isb, aladinItemId: '889', grade: '상', qty: 1, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'UA1' }, { id: 'LU2', listingId: '9002', title: '불편 시험 책 u1', isbn13: isb, aladinItemId: '889', grade: '상', qty: 1, status: '판매중', active: true, sku: 'YLWNOT', price: 9000, usedCode: 'UA2' }];
      Ls.forEach((l) => S.plist.set(l.id, l)); S.uinfo.set('9001', null); S.uinfo.delete('9002'); S.ver = (S.ver || 0) + 1;
      /* __id = 가짜 Firebase가 documentId() 'in' 질의를 이 칸으로 봄(시험 틀 한계) */ await db.collection('prd_used_info').doc('9001').set({ __id: '9001', listingId: '9001', note: '모서리 눌림 · 밑줄 약간', hasNote: true, photos: [] });
      await db.collection('prd_used_info').doc('9002').set({ __id: '9002', listingId: '9002', note: null, hasNote: false, photos: [{ src: 'https://image.aladin.co.kr/usedshop/2026/1111/scm123456_1.jpg', where: 'desc' }] });
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-sort'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { PG, view });
    await p.waitForTimeout(1800); };
  const shot = async (p, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } catch (e) {} };
  const shotEl = async (p, sel, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await el.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } } catch (e) {} };
  const run = (vp, tag) => H(async (p) => { await seed(p, 'full'); const ph = vp.width < 500;
    console.log(`② 화면 ${tag}`);
    // ① 설명 없음 + ⚡ 칸 늘 떠 있음
    const card = (id) => `#sheet [data-rgcid="${id}"]`;
    const q0 = await p.evaluate(() => { const c = document.querySelector('#sheet [data-rgcid="d1"]'); const sh = c && c.querySelector('[data-rgdm="d1"]').closest('.rgsh'); const inp = sh && sh.querySelector('.rgq-in[data-rgq="d1"]'); return { card: !!c, inp: !!inp, auto: inp && inp.dataset.rgqauto, none: !!(sh && sh.querySelector('[data-rgdm][data-v="none"].on')), quick: !!(sh && sh.querySelector('[data-rgdm][data-v="quick"].on')), mode: S.regItems.get('d1').descMode || '', own: regOwnDesc(S.regItems.get('d1')) }; });
    ok(q0.card && q0.inp && q0.auto === '1' && q0.none && !q0.quick && !q0.mode && q0.own === '', '① 기본 = 「설명 없음」 켜짐 · ⚡ 간단 직접 입력 칸이 처음부터 옆에 떠 있음 · 등록 설명 비어 있음', q0);
    await shotEl(p, card('d1') + ' .rgsh:has([data-rgdm])', `mj1_desc_idle_${tag}`);
    await p.click(`${card('d1')} .rgq-in[data-rgq="d1"]`); await p.keyboard.type('띠지 없음', { delay: 20 }); await p.waitForTimeout(150);
    const q1 = await p.evaluate(() => { const sh = document.querySelector('#sheet [data-rgcid="d1"] [data-rgdm="d1"]').closest('.rgsh'); return { none: !!sh.querySelector('[data-v="none"].on'), quick: !!sh.querySelector('[data-v="quick"].on'), mode: S.regItems.get('d1').descMode || '' }; });
    ok(!q1.none && q1.quick && !q1.mode, '① 쓰는 동안 고름 단추가 바로 「⚡ 간단 직접 입력」으로 따라감(저장은 칸을 떠날 때)', q1);
    await shotEl(p, card('d1') + ' .rgsh:has([data-rgdm])', `mj1_desc_typed_${tag}`);
    await p.keyboard.press('Escape').catch(() => {}); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(1200);
    const q2 = await p.evaluate(async () => { const it = S.regItems.get('d1'); const sv = (await db.collection('reg_items').doc('d1').get()).data(); const sh = document.querySelector('#sheet [data-rgcid="d1"] [data-rgdm="d1"]').closest('.rgsh'); return { mode: it.descMode, dq: it.descQuick, svMode: sv.descMode, svQ: sv.descQuick, own: regOwnDesc(it), fin: regDescFinal(it), on: !!sh.querySelector('[data-v="quick"].on'), inp: (sh.querySelector('.rgq-in') || {}).value, auto: !!sh.querySelector('.rgq-in[data-rgqauto]') }; });
    ok(q2.mode === 'quick' && q2.svMode === 'quick' && q2.dq === '띠지 없음' && q2.svQ === '띠지 없음', '① 칸을 떠나면 저장 — 방식 quick · 글 그대로(화면·서버)', q2);
    ok(q2.own === '띠지 없음' && q2.fin.includes('띠지 없음') && q2.on && q2.inp === '띠지 없음' && !q2.auto, '① 등록에 실제로 들어가는 설명(regOwnDesc·regDescFinal) = 쓴 글 · 다시 그려도 ⚡ 켜짐', q2);
    // 비우면 다시 설명 없음
    await p.fill(`${card('d1')} .rgq-in[data-rgq="d1"]`, ''); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(1200);
    const q3 = await p.evaluate(async () => { const it = S.regItems.get('d1'); const sv = (await db.collection('reg_items').doc('d1').get()).data(); const sh = document.querySelector('#sheet [data-rgcid="d1"] [data-rgdm="d1"]').closest('.rgsh'); return { mode: it.descMode, svMode: sv.descMode, own: regOwnDesc(it), fin: regDescFinal(it), none: !!sh.querySelector('[data-v="none"].on'), auto: !!sh.querySelector('.rgq-in[data-rgqauto]') }; });
    ok(q3.mode === 'none' && q3.svMode === 'none' && q3.own === '' && !String(q3.fin || '').includes('띠지') && q3.none && q3.auto, '① 비우면 다시 「설명 없음」 — 등록 설명도 비어 있음 · ⚡ 칸은 그대로 떠 있음', q3);
    // 쓰다가 「직접 입력」을 누르면 그 고름이 이김(⚡로 뒤집지 않음)
    await p.click(`${card('d2')} .rgq-in[data-rgq="d2"]`); await p.keyboard.type('쓰다 말고', { delay: 15 }); await p.click(`${card('d2')} [data-rgdm="d2"][data-v="manual"]`); await p.waitForTimeout(1300);
    const q4 = await p.evaluate(() => { const it = S.regItems.get('d2'); return { mode: it.descMode, dq: it.descQuick || '' }; });
    ok(q4.mode === 'manual' && !q4.dq, '① ⚡ 칸에 쓰다가 「직접 입력」을 누르면 직접 입력(⚡로 뒤집지 않음)', q4);
    // 「설명 없음」을 누르면 그대로 설명 없음
    await p.evaluate(() => regUpd('d2', { descMode: 'none' }).then(regRerender)); await p.waitForTimeout(700);
    await p.click(`${card('d2')} .rgq-in[data-rgq="d2"]`); await p.keyboard.type('또 쓰다', { delay: 15 }); await p.click(`${card('d2')} [data-rgdm="d2"][data-v="none"]`); await p.waitForTimeout(1300);
    const q5 = await p.evaluate(() => { const it = S.regItems.get('d2'); return { mode: it.descMode, own: regOwnDesc(it) }; });
    ok(q5.mode === 'none' && q5.own === '', '① 쓰다가 「설명 없음」을 누르면 설명 없음 그대로(등록 설명 비어 있음)', q5);
    // ② 미등록 찾기 목록 위·아래 닫기
    await p.evaluate(() => { S._rgAuth = { id: 'n1', k: 'author', q: '홍길', busy: false, list: Array.from({ length: 14 }, (_, i) => ({ id: String(5000 + i), name: '시험 지은이 ' + (i + 1), info: '시험 지은이 ' + (i + 1) + ' 소개 글' })) }; regRerender(); }); await p.waitForTimeout(700);
    const a0 = await p.evaluate(() => { const box = document.querySelector('#sheet [data-rgcid="n1"] .regcat.rgap'); if (!box) return null; const hd = box.querySelector(':scope > .rgap-hd'); const bs = [...box.querySelectorAll('[data-rgauthx="n1"]')]; return { hd: !!hd, long: hd && hd.classList.contains('long'), pos: hd && getComputedStyle(hd).position, n: bs.length, top: bs[0] && bs[0].closest('.rgap-hd') === hd, last: bs[bs.length - 1] === box.lastElementChild, picks: box.querySelectorAll('[data-rgpick]').length }; });
    ok(a0 && a0.hd && a0.n === 2 && a0.top && a0.last && a0.picks === 14, '② 찾기 목록 맨 위에도 [닫기] · 맨 아래 [닫기]도 그대로', a0);
    ok(a0 && a0.long && a0.pos === 'sticky', '② 목록이 길면 위 [닫기] 줄은 붙박이(sticky)', a0);
    await p.evaluate(() => { const b = document.querySelector('#sheet [data-rgcid="n1"] .rgap [data-rgpick]:last-of-type'); const bs = document.querySelectorAll('#sheet [data-rgcid="n1"] .rgap [data-rgpick]'); bs[bs.length - 1].scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300);
    const a1 = await p.evaluate(() => { const hd = document.querySelector('#sheet [data-rgcid="n1"] .rgap-hd'); const r = hd.getBoundingClientRect(); const cb = hd.querySelector("[data-rgauthx]").getBoundingClientRect(); const x = document.elementFromPoint(cb.left + cb.width / 2, cb.top + cb.height / 2); return { vis: r.top >= 0 && r.bottom <= innerHeight, hit: !!(x && x.closest('.rgap-hd')), r: [r.top, r.bottom, r.left, r.right], x: x && (x.className || x.tagName), xp: x && x.parentElement && x.parentElement.className, ws: (() => { const w = document.querySelector('#sheet > .rgws'); const q = w && w.getBoundingClientRect(); return q && [q.top, q.bottom, getComputedStyle(w).position]; })(), hd: (() => { const w = document.querySelector('#sheet > .sh'); const q = w && w.getBoundingClientRect(); return q && [q.top, q.bottom, getComputedStyle(w).position]; })(), v: [getComputedStyle(document.getElementById('sheet')).getPropertyValue('--rgshh'), getComputedStyle(document.getElementById('sheet')).getPropertyValue('--rgwsh')] }; });
    ok(a1.vis && a1.hit, '② 긴 목록 아래쪽으로 굴려도 위 [닫기] 줄이 화면에 붙어 보이고 가려지지 않음', a1);
    await shot(p, `mj2_find_${tag}`);
    await p.click('#sheet [data-rgcid="n1"] .rgap-hd [data-rgauthx="n1"]'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => !S._rgAuth && !document.querySelector('#sheet .regcat.rgap')), '② 위 [닫기] = 맨 아래 [닫기]와 같은 동작(목록 닫힘)');
    await p.evaluate(() => { S._rgAuth = { id: 'n1', k: 'publisher', q: '출판', busy: false, list: [{ id: '77', name: '시험 출판사' }] }; regRerender(); }); await p.waitForTimeout(500);
    const a2 = await p.evaluate(() => { const hd = document.querySelector('#sheet .rgap-hd'); return { hd: !!hd, long: hd && hd.classList.contains('long'), n: document.querySelectorAll('#sheet [data-rgauthx="n1"]').length }; });
    ok(a2.hd && !a2.long && a2.n === 2, '② 짧은 목록(출판사 1건)도 위·아래 [닫기] · 붙박이는 아님', a2);
    await p.click('#sheet .rgap > [data-rgauthx="n1"]'); await p.waitForTimeout(500); ok(await p.evaluate(() => !S._rgAuth), '② 맨 아래 [닫기]도 그대로 동작');
    // ③ 아래 「결정 대기로 →」 옆 [빼기]
    const d0 = await p.evaluate(() => { const c = document.querySelector('#sheet [data-rgcid="d2"]'); const all = [...c.querySelectorAll('[data-rgdel="d2"]')]; const ft = c.querySelector('.rgfootr [data-rgdel="d2"]'); return { n: all.length, ft: !!ft, next: ft && ft.nextElementSibling && ft.nextElementSibling.matches('[data-rgto="d2"][data-v="pick"]') }; });
    ok(d0.n === 2 && d0.ft && d0.next, '③ 위 [빼기]는 그대로 · 아래 「결정 대기로 →」 바로 옆에도 [빼기]', d0);
    await shotEl(p, `${card('d2')} .rgfoot`, `mj3_foot_${tag}`);
    await p.click(`${card('d2')} .rgfootr [data-rgdel="d2"]`); await p.waitForTimeout(250);
    const d1 = await p.evaluate(() => ({ arm: [...document.querySelectorAll('#sheet [data-rgdel="d2"]')].every((b) => b.classList.contains('armed')), st: S.regItems.get('d2').stage }));
    ok(d1.arm && d1.st === 'sel', '③ 아래 [빼기] 한 번 = 위·아래 두 단추 모두 「한 번 더 누르면 빼기」(아직 안 뺌)', d1);
    await p.click(`${card('d2')} .rgfootr [data-rgdel="d2"]`); await p.waitForTimeout(1300);
    const d2 = await p.evaluate(async () => ({ st: S.regItems.get('d2').stage, sv: ((await db.collection('reg_items').doc('d2').get()).data() || {}).stage, gone: !!document.querySelector('#sheet [data-rggone="d2"]') }));
    ok(d2.st === 'trash' && d2.sv === 'trash' && d2.gone, '③ 두 번 누르면 위 [빼기]와 같은 길 — 🗑 휴지통 · 그 자리 ↩ 되돌리기 줄', d2);
    // ④ ♻ 기등록 — 결정 대기 「전체」 보기의 띠
    await p.evaluate(() => { S.regT = 'pick'; S.regSub = { sel: 'all', pick: 'all' }; regRerender(); }); await p.waitForTimeout(1500);
    const u0 = await p.evaluate(() => { const c = document.querySelector('#sheet [data-rgcid="u1"]'); const dec = c && c.querySelector('.rgxdec.dup'); const o = dec ? [...dec.querySelectorAll('.rgxdp-o')] : []; return { dec: !!dec, n: o.length, radios: dec ? dec.querySelectorAll('input[type=radio][data-rgduppick="u1"]').length : 0, t1: o[0] && o[0].textContent, t2: o[1] && o[1].textContent, img2: !!(o[1] && o[1].querySelector('img[src*="usedshop"]')), q1: !!(o[0] && o[0].querySelector('.pc2-q.on[data-pcq="9001"]')), q2: !!(o[1] && o[1].querySelector('.pc2-q.on[data-pcq="9002"]')), u1: S.uinfo.get('9001'), on: o.map((x) => x.classList.contains('on')), chk: o.map((x) => !!(x.querySelector('input') || {}).checked), btn: (dec && dec.querySelector('[data-rgxdup]') || {}).textContent }; });
    ok(u0.dec && u0.n === 2 && u0.radios === 2, '④ ♻ 기등록 띠에 같은 책 재고 2개 — 고르기(라디오) 2개', u0);
    ok(u0.u1 && u0.u1.hasNote && /모서리 눌림/.test(u0.t1 || '') && u0.q1, "④ 다른 화면이 '받는 중(null)'으로 둔 재고 상품의 유의 사항도 다시 받아 글을 보임 · '?' 켜짐(원인 고침)", u0);
    ok(/유의 사항 글 없음/.test(u0.t2 || '') && /📷 1/.test(u0.t2 || '') && u0.img2 && u0.q2, "④ 글 없이 판매자 사진만 있는 재고 — '유의 사항 없음' 대신 📷 사진 · '?' 켜짐(상품 카드 '?'와 같은 자료)", u0);
    ok(u0.on[1] && u0.chk[1] && !u0.on[0] && /UA2/.test(u0.t2) && /자동 판정/.test(u0.t2) && /수량 \+1/.test(u0.btn || ''), '④ 기본 = 지금 규칙(등급·유의 사항이 같은 UA2 — 설명 없음끼리) 골라짐 · ▶ 기존 상품에 수량 +1', u0);
    await shotEl(p, `${card('u1')} .rgxdec.dup`, `mj4_dup_${tag}`);
    // 다른 상품 고르기 → 그 상품 번호로 맡김
    await p.click(`${card('u1')} .rgxdp-o[data-rgxdpo="LU1"]`); await p.waitForTimeout(1200);
    const u1 = await p.evaluate(async () => { const it = S.regItems.get('u1'); const sv = (await db.collection('reg_items').doc('u1').get()).data(); const K = regDupKind(it); const dec = document.querySelector('#sheet [data-rgcid="u1"] .rgxdec.dup'); const o = [...dec.querySelectorAll('.rgxdp-o')]; return { pick: it.dupPick, sv: sv.dupPick, ex: K.d.exact && K.d.exact.id, man: K.d.manual, k: K.k, on: o.map((x) => x.classList.contains('on')), back: !!dec.querySelector('a[data-rgduppick="u1"][data-l=""]') }; });
    ok(u1.pick === 'LU1' && u1.sv === 'LU1' && u1.ex === 'LU1' && u1.man && u1.k === 'C' && u1.on[0] && !u1.on[1] && u1.back, '④ UA1을 고르면 dupPick = LU1(서버에도) · 판정이 그 상품으로 · 「↩ 자동 판정으로」 보임', u1);
    await shotEl(p, `${card('u1')} .rgxdec.dup`, `mj4_dup_pick_${tag}`);
    if (!ph) { const c0 = await p.evaluate(() => Object.keys(window.__FS.shp_cmds || {}).length);
      await p.click(`${card('u1')} [data-rgxdup="u1"]`); await p.waitForTimeout(1800);
      const u2 = await p.evaluate(() => { const it = S.regItems.get('u1'); const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.regItem === 'u1'); return { st: it.stage, lid: it.post && it.post.lid, uc: it.post && it.post.usedCode, n: it.post && it.post.n, cmds: C.map((c) => JSON.stringify(c).includes('9001') || JSON.stringify(c).includes('UA1') || JSON.stringify(c).includes('LU1')), other: C.some((c) => /9002|UA2|LU2/.test(JSON.stringify(c))) }; });
      ok(u2.st === 'post' && u2.lid === 'LU1' && u2.uc === 'UA1' && u2.n === 1 && u2.cmds.length === 1 && u2.cmds[0] && !u2.other, '④ ▶ 처리 = 고른 상품(UA1) 번호로 수량 +1 맡김(UA2에는 안 맡김)', u2); }
    else { await p.click(`${card('u1')} a[data-rgduppick="u1"][data-l=""]`); await p.waitForTimeout(1000); ok(await p.evaluate(() => !S.regItems.get('u1').dupPick && regDupKind(S.regItems.get('u1')).d.exact.id === 'LU2'), '④ 「↩ 자동 판정으로」 = 지금 규칙(UA2)으로 돌아감'); }
    if (ph) { const o = await p.evaluate(() => { const W = innerWidth + 1; const mine = [...document.querySelectorAll('#sheet .rgxdec, #sheet .rgxdec *, #sheet .rgfootr, #sheet .rgfootr *, #sheet .rgsh, #sheet .rgsh *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > W; }).map((e) => e.className || e.tagName).slice(0, 6); return { doc: document.documentElement.scrollWidth - innerWidth, mine }; }); ok(o.doc <= 1 && !o.mine.length, '휴대폰 390: 옆으로 넘침 없음(설명 줄·아래 단추 줄·기등록 띠)', o); }
    ok(!p._dlg.length, '브라우저 팝업(alert·confirm·prompt) 없음', p._dlg);
  }, { vp });
  await run({ width: 1400, height: 900 }, 'pc');
  await run({ width: 390, height: 844 }, 'phone');
  console.log(bad ? `❌ tMJREG1111 ${bad}개 실패` : '✓ tMJREG1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
