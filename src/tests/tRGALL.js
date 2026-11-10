// tRGALL — 정범님 11/06 오후(시급) '📥 등록 하위 탭을 🔎 도서 정보 검색의 분류 줄과 같은 개념으로'
//  「전체」(기본 · 실물 모두 · 스캔 순서) + 겹치는 보기(대량·개별·미등록·♻ 기등록·🛒 알라딘 매입) · 카드마다 그 자리 결정 · 처리한 자리 한 줄 + ↩ 되돌리기 · J/K 지금 할 카드 · 칩·띠
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '0', sellerName: '알라딘', ship: 0 }];
const seed = async (p, view) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
  await p.evaluate(async ({ PG, view }) => { const T0 = Date.parse('2026-11-06T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); window.ask = async () => true;
    const mk = (id, k, o) => ({ stage: 'sel', isbn: '97911000077' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), movedAt: at(100 - k), code: 'BLKCMN', codeManual: true, info: { title: '실물 ' + id, isbn13: '97911000077' + String(k).padStart(2, '0'), itemId: '77' + k, categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, at: at(k), buyback: { 상: 1000 } }, ...o });
    const L = { s1: mk('s1', 1, {}), s2: mk('s2', 2, {}), s3: mk('s3', 3, { method: 'one' }), s4: mk('s4', 4, {}),
      p1: mk('p1', 11, { stage: 'pick' }), p2: mk('p2', 12, { stage: 'pick', method: 'one' }), p3: mk('p3', 13, { stage: 'pick' }), p4: mk('p4', 14, { stage: 'pick' }), p5: mk('p5', 15, { stage: 'pick' }) };
    L.s2.info = { ...L.s2.info, buyback: { 상: 3800 } }; /* 🛒 알라딘 매입 추천(시장 5,200원 · 매입가 3,800원) */
    const Ls = [{ id: 'LD2', listingId: '8002', title: '실물 p2', isbn13: L.p2.isbn, aladinItemId: '7712', grade: '상', qty: 1, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'UD2' }, { id: 'LD5', listingId: '8005', title: '실물 p5', isbn13: L.p5.isbn, aladinItemId: '7715', grade: '상', qty: 1, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'UD5' }];
    Ls.forEach((l) => { S.plist.set(l.id, l); S.uinfo.set(l.listingId, { none: true }); }); S.ver = (S.ver || 0) + 1;
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d, dupMv: d.stage === 'pick' ? at(0) : undefined }); }
    localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-sort'); localStorage.removeItem('rn-reg-subcfg'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'one', pick: 'one' }; S.detail = null; openRegister(); }, { PG, view });
  await p.waitForTimeout(1800); };
const bar = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.rgsub [data-rgmf]')].map((b) => [b.dataset.rgmf, { n: +(b.querySelector('b') || {}).textContent.replace(/,/g, ''), on: b.classList.contains('on'), t: b.textContent.trim() }])));
const rows = (p) => p.evaluate(() => [...document.querySelectorAll('#sheet .rgrow[data-rgexp], #sheet .rgc2[data-rgcid][data-rgn], #sheet .rggone')].filter((el) => !el.parentElement.closest('.rgc2, .rgdup')).map((el) => el.classList.contains('rggone') ? 'gone:' + el.dataset.rggone + ':' + el.querySelector('b').textContent : (el.dataset.rgexp || el.dataset.rgcid) + (el.querySelector('.rgr-n') ? ':' + el.querySelector('.rgr-n').textContent : ':#' + el.dataset.rgn)));
const sub = async (p, k) => { await p.click(`.rgsub [data-rgmf="${k}"]`); await p.waitForTimeout(700); };
const tab = async (p, k) => { await p.click(`.btabs [data-rgt="${k}"]`); await p.waitForTimeout(800); };
const wait = (p, ms) => p.waitForTimeout(ms);

H(async (p) => { await seed(p, 'compact');
  // 휴대폰 390은 아래 두 번째 H — 하위 탭 줄·칩·결정 줄이 옆으로 넘치지 않음
  // ① 처음 열면 늘 「전체」(기기에 남은 하위 탭이 있어도) · 전체 = 실물 수 · 보기 숫자는 각자 · 스캔(넣은) 순서
  let B = await bar(p); let R = await rows(p);
  const top = await p.evaluate(() => +(document.querySelector('.btabs [data-rgt="sel"] b') || {}).textContent);
  ok(B.all && B.all.on && Object.keys(B)[0] === 'all', '하위 탭 줄 맨 앞 「전체」 · 기본으로 켜짐(S.regSub에 개별이 남아 있어도)', B);
  ok(B.all.n === 4 && B.bulk.n === 3 && B.one.n === 1 && B.new.n === 0 && B.bbr.n === 1 && top === 4, '선택 대기 전체 4 = 실물 수(🛒 알라딘 매입 추천 책 포함) · 대량 3(🛒 책도 대량 — 겹침) · 개별 1 · 미등록 0 · 🛒 1 · 상위 탭 숫자 4', { B, top });
  ok(R.join() === 's1:#1,s2:#2,s3:#3,s4:#4', '전체는 스캔(넣은) 순서 — 옮긴 때가 거꾸로여도', R);
  const note = await p.evaluate(() => (document.querySelector('.rgsubh') || {}).textContent || '');
  ok(/같은 상품이 여러 칸에 보일 수 있어요 — 실물 수는 전체/.test(note), "한 줄 설명 '같은 상품이 여러 칸에 보일 수 있어요 — 실물 수는 전체'", note);
  // ② 칩·띠 — 방식 칩(글자+모양) · 🛒 점 테두리 칩 · 왼쪽 띠 색
  const ch = await p.evaluate(() => { const g = (id) => { const r = document.querySelector(`.rgrow[data-rgexp="${id}"]`); return { chips: [...r.querySelectorAll('.rgkc')].map((c) => c.className.replace('rgkc ', '') + ':' + c.textContent), band: getComputedStyle(r).borderLeftColor, bbrSt: (() => { const c = r.querySelector('.rgkc.k-bbr'); return c ? getComputedStyle(c).borderTopStyle : null; })() }; }; return { s1: g('s1'), s2: g('s2'), s3: g('s3') }; });
  ok(ch.s1.chips.join() === 'k-bulk:■대량' && ch.s3.chips.join() === 'k-one:●개별' && ch.s2.chips.includes('k-bbr:🛒 알라딘 매입') && ch.s2.bbrSt === 'dotted', '카드 칩: ■ 대량 · ● 개별(글자+모양) · 🛒 알라딘 매입은 점 테두리', ch);
  { const h = await p.evaluate(() => ['s1', 's3', 's4'].map((id) => document.querySelector(`.rgrow[data-rgexp="${id}"]`).offsetHeight)); ok(h.every((x) => x <= 76), '칩·번호·🪟 아이콘을 넣어도 📋 한눈에 보통 줄 높이 72+4px 이하(tRGDESC2와 같은 기준)', h); }
  ok(ch.s1.band !== ch.s3.band, '왼쪽 띠 색이 방식마다 다름(대량 초록 · 개별 파랑)', [ch.s1.band, ch.s3.band]);
  // ③ 보기 — 🛒 알라딘 매입 보기는 그 카드만 · 번호는 전체의 실물 순번 그대로(#2)
  await sub(p, 'bbr'); R = await rows(p); ok(R.join() === 's2:#2', '🛒 알라딘 매입 보기 = 전체의 일부(s2) · 번호 #2 그대로', R);
  await sub(p, 'bulk'); R = await rows(p); ok(R.join() === 's1:#1,s2:#2,s4:#4', '대량 보기에 🛒 책도 함께(겹침 — 같은 실물) · 번호 그대로', R);
  await sub(p, 'all');
  // ④ 결정 대기 — 개별이면서 ♻ 기등록인 카드는 두 보기에 다 · 전체에는 한 번 · 상위 숫자 = 실물 수
  await tab(p, 'pick'); B = await bar(p);
  const topP = await p.evaluate(() => +(document.querySelector('.btabs [data-rgt="pick"] > b') || {}).textContent);
  ok(B.all.on && B.all.n === 5 && B.bulk.n === 4 && B.one.n === 1 && B.dup.n === 2 && topP === 5, '결정 대기: 탭을 바꿔도 전체 · 전체 5 = 실물 수(♻ 2를 빼지 않음) · 대량 4 · 개별 1 · ♻ 2(겹침) · 상위 숫자 5', { B, topP });
  await sub(p, 'one'); const r1 = await rows(p); await sub(p, 'dup'); const r2 = await p.evaluate(() => [...document.querySelectorAll('.rgdup[data-rgcid]')].map((x) => x.dataset.rgcid)); await sub(p, 'all'); R = await rows(p);
  ok(r1.join() === 'p2:#2' && r2.join() === 'p2,p5' && R.filter((x) => /^p2:/.test(x)).length === 1, '같은 카드 p2가 개별 보기와 ♻ 기등록 보기 둘 다에 · 전체에는 한 번', { r1, r2, R });
  const tools = await p.evaluate(() => ({ conf: (document.getElementById('rg_confirm') || {}).textContent || '', auto: (document.getElementById('rg_autoall') || {}).textContent || '' }));
  ok(/대량 3개 일괄 확정/.test(tools.conf) && /개별·미등록 1개 일괄 등록/.test(tools.auto) === false, '전체에서도 「📦 대량 n개 일괄 확정」 — 대량 수를 밝혀(♻ 기등록 대량 p5는 빼고 3) · 개별 p2는 ♻라 🤖 일괄 등록에 안 셈', tools);
  // ⑤ 전체에서 그 자리 ♻ 수량 더하기 → 그 보기들에서 바로 빠짐 · 그 자리 얇은 한 줄 · 토스트 · 다음 카드가 지금 할 카드
  const dec = await p.evaluate(() => { const r = document.querySelector('.rgrow[data-rgexp="p2"]'); const b = r && r.querySelector('[data-rgxdup]'); return { has: !!b, t: b && b.textContent, chip: !!r.querySelector('.rgkc.k-dup'), dash: r.querySelector('.rgkc.k-dup') && getComputedStyle(r.querySelector('.rgkc.k-dup')).borderTopStyle }; });
  ok(dec.has && /기존 상품에 수량 \+1/.test(dec.t) && dec.chip && dec.dash === 'dashed', '전체의 ♻ 카드 안에 「▶ 기존 상품에 수량 +1」 · ♻ 칩은 점선', dec);
  await p.evaluate(() => { S._regCur = 'p2'; regCurApply(false); });
  const c0 = await p.evaluate(() => Object.keys(window.__FS.shp_cmds || {}).length);
  await p.click('.rgrow[data-rgexp="p2"] [data-rgxdup]'); await wait(p, 150);
  const fast = await p.evaluate(() => { const g = document.querySelector('#sheet [data-rggone="p2"]'); return { g: g && g.textContent, row: !!document.querySelector('.rgrow[data-rgexp="p2"]') }; });
  await wait(p, 1500); B = await bar(p); R = await rows(p);
  const st = await p.evaluate(() => { const it = S.regItems.get('p2'); const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit' && c.regItem === 'p2'); return { stage: it.stage, post: it.post && it.post.n, cmds: C.map((c) => c.status + ':' + c.qtyAdd), cur: S._regCur, curEl: (document.querySelector('.rgcur') || {}).dataset ? (document.querySelector('.rgcur').dataset.rgexp || '') : '', toast: (document.querySelector('#toast') || {}).textContent || '' }; });
  ok(fast.g && /#2/.test(fast.g) && /기존 상품에 \+1 됨/.test(fast.g) && /되돌리기/.test(fast.g) && !fast.row, '누르자마자(다시 그리기 전) 그 자리에 「#2 ✓ 기존 상품에 +1 됨 · ↩ 되돌리기」', fast);
  ok(st.stage === 'post' && st.post === 1 && st.cmds.join() === 'queued:1', '실제로 처리됨 — ♻ 기등록 처리 함수 그대로(수량 +1 맡김 · 🏷 확정 후 처리 대기)', st);
  ok(B.all.n === 4 && B.dup.n === 1 && B.one.n === 0 && R.join() === 'p1:#1,gone:p2:#2,p3:#3,p4:#4,p5:#5', '♻ 1 · 개별 0으로 바로 · 전체에서 빠지고 자리 줄은 #2 그대로(번호 밀리지 않음)', { B, R });
  ok(st.cur === 'p3' && st.curEl === 'p3', '처리하면 다음 카드(p3)가 지금 할 카드', st);
  // ⑥ ↩ 되돌리기 — 실제로 되돌림(맡김 취소 · 기록 남음) · 다시 ♻ 2 · 개별 1
  await p.click('#sheet [data-rgundo="p2"]'); await wait(p, 1500); B = await bar(p); R = await rows(p);
  const un = await p.evaluate(() => { const it = S.regItems.get('p2'); const C = Object.values(window.__FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit' && c.regItem === 'p2'); return { stage: it.stage, post: it.post, cmds: C.map((c) => c.status), hist: ((window.__FS.reg_items.p2 || {}).history || []).map((h) => h.what).filter((w) => /되돌림/.test(w)).length, gone: !!document.querySelector('[data-rggone]') }; });
  ok(un.stage === 'pick' && !un.post && un.cmds.join() === 'cancelled' && un.hist >= 1 && !un.gone, '↩ 되돌리기: 수량 늘리기 맡김 취소 · 결정 대기로 · 이력에 남음 · 자리 줄 사라짐', un);
  ok(B.dup.n === 2 && B.one.n === 1 && R.join() === 'p1:#1,p2:#2,p3:#3,p4:#4,p5:#5', '되돌린 뒤 ♻ 2 · 개별 1 · 같은 자리', { B, R });
  // ⑦ 선택 대기 전체에서 🛒 알라딘 매입으로 보내기(두 번) → 🛒 보기·전체에서 바로 빠짐 · 되돌리기
  await tab(p, 'sel'); const bb0 = await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="s2"] .rgxdec.bbr [data-rgbbr][data-v="send"]'));
  ok(bb0, '전체의 🛒 카드 안에 「🏷 알라딘 매입으로 보내기」 · 「등록으로 진행」', bb0);
  await p.click('.rgrow[data-rgexp="s2"] [data-rgbbr][data-v="send"]'); await wait(p, 450); /* (11/10 ux2 ⑪) */ await p.click('.rgrow[data-rgexp="s2"] [data-rgbbr][data-v="send"]'); await wait(p, 1800);
  B = await bar(p); R = await rows(p); const sb = await p.evaluate(() => ({ stage: S.regItems.get('s2').stage, moved: !!((((window.__FS.prd_system || {}).buyback || {}).moved || {}).REG_s2), bbT: (document.querySelector('.btabs [data-rgt="bb"]') || {}).textContent || '' }));
  ok(sb.stage === 'bb' && sb.moved && B.all.n === 3 && B.bbr.n === 0 && R.join() === 's1:#1,gone:s2:#2,s3:#3,s4:#4' && /알라딘 매입으로 보냄 1/.test(sb.bbT.replace(/\s+/g, ' ')), '🛒 보내기 → 단계 bb · 🏷 알라딘 매입 페이지로 · 전체 3 · 🛒 0 · 자리 줄 #2 · 「🏷 알라딘 매입으로 보냄 1」 탭으로 옮겨짐', { sb, B, R });
  await p.click('#sheet [data-rgundo="s2"]'); await wait(p, 1800); B = await bar(p);
  const ub = await p.evaluate(() => ({ stage: S.regItems.get('s2').stage, back: !!(((((window.__FS.prd_system || {}).buyback || {}).moved || {}).REG_s2 || {}).back) }));
  ok(ub.stage === 'sel' && ub.back && B.all.n === 4 && B.bbr.n === 1, '↩ 되돌리기: 선택 대기로 · 보낸 기록에 back(지우지 않음) · 🛒 1로 돌아옴', { ub, B });
  // ⑧ 보기에서 고친 값이 전체 카드에 그대로(같은 등록 줄)
  await sub(p, 'one'); await p.evaluate(() => regUpd('s3', { qty: 3 })); await sub(p, 'all');
  const q3 = await p.evaluate(() => { const r = document.querySelector('.rgrow[data-rgexp="s3"]'); return r && r.textContent.includes('×3'); }); ok(q3, '개별 보기에서 수량 3으로 → 전체의 같은 카드도 ×3', q3);
  // ⑨ J/K — 입력 칸 밖에서 다음·이전 · Alt+J는 입력 칸 안에서도
  await p.evaluate(() => { document.activeElement && document.activeElement.blur(); S._regCur = 's1'; regCurApply(false); });
  await p.keyboard.press('j'); const j1 = await p.evaluate(() => S._regCur); await p.keyboard.press('j'); const j2 = await p.evaluate(() => S._regCur); await p.keyboard.press('k'); const k1 = await p.evaluate(() => S._regCur);
  await p.focus('#rg_in'); await p.keyboard.press('Alt+j'); const aj = await p.evaluate(() => ({ cur: S._regCur, v: document.getElementById('rg_in').value, el: (document.querySelector('.rgcur') || {}).dataset ? document.querySelector('.rgcur').dataset.rgexp : null }));
  ok(j1 === 's2' && j2 === 's3' && k1 === 's2' && aj.cur === 's3' && aj.v === '' && aj.el === 's3', 'J 다음 · K 이전 · 검색창 안 Alt+J 다음(글자 안 들어감) · 노란 테두리 한 장', { j1, j2, k1, aj });
  // ⑩ 결정 대기로 옮김(카드 단추) → 자리 줄 + 되돌리기 · 옮긴 곳도 전체
  await p.evaluate(async () => { await regMoveStage('s1', 'pick', S._regFcur.get('s1')); }); await wait(p, 900); R = await rows(p);
  ok(R[0] === 'gone:s1:#1' && (await p.evaluate(() => (S.regSub || {}).pick || 'all')) === 'all', '「결정 대기로 →」도 그 자리 줄 · 옮긴 곳(결정 대기) 하위 탭은 전체 그대로', R);
  await p.click('#sheet [data-rgundo="s1"]'); await wait(p, 1200); ok((await p.evaluate(() => S.regItems.get('s1').stage)) === 'sel', '↩ 되돌리기 → 선택 대기로 다시', null);
  // ⑪ 처리한 자리 줄 — 다음 카드를 처리하면 앞 줄은 사라짐 · 설정 초가 지나면 사라짐
  await p.evaluate(() => regSubCfgSet({ sec: 1 })); await p.evaluate(async () => { await regMoveStage('s4', 'hold', {}); }); await wait(p, 400); const g1 = await p.evaluate(() => !!document.querySelector('[data-rggone="s4"]')); await wait(p, 1400); const g2 = await p.evaluate(() => !!document.querySelector('[data-rggone="s4"]'));
  ok(g1 && !g2, '처리한 자리 줄은 설정한 초(1초) 뒤 사라짐', { g1, g2 }); await p.evaluate(() => regSubCfgSet({ sec: 30 }));
  // ⑫ 다시 처음 열기 — 늘 전체 · '마지막 하위 탭 기억' 켜면 그대로
  await p.evaluate(() => { S.regSub = { sel: 'one' }; S.detail = null; openRegister(); }); await wait(p, 900); B = await bar(p); ok(B.all.on, '다시 처음 열면 늘 전체', B);
  await p.evaluate(() => { regSubCfgSet({ mem: true }); S.regSub = { sel: 'one' }; S.detail = null; openRegister(); }); await wait(p, 900); B = await bar(p); ok(B.one.on, "설정 '마지막 하위 탭 기억' 켜면 본 하위 탭 그대로", B); await p.evaluate(() => regSubCfgSet({ mem: false }));
  // ⑬ 자세히 보기도 칩·번호·그 자리 결정 줄
  await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S.regT = 'pick'; S.regSub = {}; openRegister(); }); await wait(p, 1500);
  const fu = await p.evaluate(() => { const c = document.querySelector('.rgc2[data-rgcid="p2"][data-rgn]'); return c && { n: c.dataset.rgn, chips: [...c.querySelectorAll('.rgttl .rgkc')].map((x) => x.textContent), dec: !!c.querySelector('.rgxdec.dup [data-rgxdup]'), oldTag: [...c.querySelectorAll('.rgttl > .tag')].map((x) => x.outerHTML).filter((h) => /개별|미등록/.test(h)).length > 0, tags: [...c.querySelectorAll('.rgttl > .tag')].map((x) => x.outerHTML.slice(0, 120)) }; });
  ok(fu && fu.n === '2' && fu.chips.join() === '●개별,♻ 기등록' && fu.dec && !fu.oldTag, '🔎 자세히 카드: #2 · 칩(● 개별 · ♻ 기등록) · ♻ 그 자리 결정 줄 · 옛 방식 글자표 없음', fu);
  const ov = await p.evaluate(() => { const sh = document.getElementById('sheet'); return { sh: sh.scrollWidth - sh.clientWidth, doc: document.documentElement.scrollWidth - innerWidth }; }); ok(ov.sh <= 1 && ov.doc <= 1, 'PC 1400: 옆으로 넘침 없음', ov);
  // 설명서 — 등록 백과 tab-sub · 단축키 표
  const gd = await p.evaluate(() => { const s = JSON.stringify(rgenData()); return { sub: /하위 탭 — 전체 · 대량 · 개별 · 미등록 · ♻ 기등록 · 🛒 알라딘 매입/.test(s), kb: KB_REG.some((r) => r[0] === 'J / K') }; }); ok(gd.sub && gd.kb, '설명서(등록 백과 tab-sub)·⌨ 단축키 표가 새 개념', gd);
  console.log(bad ? `❌ tRGALL(PC) 실패 ${bad}` : '✓ tRGALL(PC) 통과');
}).then(() => H(async (p) => { await seed(p, 'compact'); let b2 = 0;
  for (const T of ['sel', 'pick']) { await p.evaluate((T) => { S.regT = T; openRegister(); }, T); await p.waitForTimeout(1200);
    const o = await p.evaluate(() => { const W = innerWidth + 1; const sb = document.querySelector('.rgsub'); const last = sb && [...sb.querySelectorAll('button')].pop(); const mine = [...document.querySelectorAll('.rgsub, .rgsub button, .rgsubh, .rgsubh *, .rgxdec, .rgxdec *, .rgkcs, .rggone, .rgrow')].filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > W).map((e) => e.className + ' ' + Math.round(e.getBoundingClientRect().right)); return { doc: document.documentElement.scrollWidth - innerWidth, mine, lastVis: last ? last.getBoundingClientRect().right <= W : false, rows: document.querySelectorAll('.rgrow').length }; });
    ok(o.doc <= 1 && !o.mine.length && o.lastVis && o.rows > 0, `휴대폰 390 ${T}: 옆으로 넘침 없음(화면 · 하위 탭 줄·설명 줄·칩·결정 줄·카드 줄) · 하위 탭 마지막 단추까지 보임`, o); }
  console.log(bad ? `❌ tRGALL 실패 ${bad}` : '✓ tRGALL 통과');
}, { vp: { width: 390, height: 844 } }));
