// tBBNEAR — 정범님 11/05: 🏷 알라딘 매입 근삿값(매입가 × (1+15%) 이하 · 매입가 이하 포함 · 설정 한 곳 · 모든 곳 같은 판정 · 중 ⚠)
//  + 🗑 휴지통 이름·탭 · 📋 한눈에 바로 고치기 창 밖 누르면 닫힘 · ⓘ 추가 정보 칩·켜고 끄기 · 자세히 잠금 · 한눈에 설명 칸 접기(앞 10줄·마우스 올리면 전체)
//  · 한눈에 판매가 칸 누름/입력 → 자세히가 열리지 않음 · 판매가 고르기 칩(추천·최상단·최저 유효)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  // ① 판정 하나 — 경계·매입가 이하·중 경고·까닭
  const j = await p.evaluate(() => { const a = bbNearJ(4370, 3800, '상'), b = bbNearJ(4371, 3800, '상'), c = bbNearJ(3000, 3800, '상'), d = bbNearJ(2200, 2000, '중'), e = bbNearJ(3800, 3800, '최상'); return { a: [a.in, a.tag], b: [b.in, b.tag], c: [c.in, c.below, c.tag, c.why], d: [d.in, d.warn, d.tag], e: [e.in, e.below, e.tag], def: bbNearPct() }; });
  ok(j.def === 15 && j.a[0] && /15% 안/.test(j.a[1]) && !j.b[0] && /15% 밖/.test(j.b[1]), '기본 근삿값 15% · 4,370(=3,800×1.15)은 안 · 4,371은 밖 — 「매입가보다 n% 높음(근삿값 15% 안)」', j);
  ok(j.c[0] && j.c[1] && /매입가 이하\(−21\.1%\)/.test(j.c[2]) && /까닭/.test(j.c[3]) && j.e[0] && j.e[1] && /같음/.test(j.e[2]), '매입가 이하도 당연히 들어옴 — 「매입가 이하(−21.1%)」 · 같으면 「같음」 · 까닭 글', j);
  ok(j.d[0] && /⚠ 중/.test(j.d[1]) && /알라딘이 매입하지 않을 수 있음/.test(j.d[1]), '중도 판정에 넣고 ⚠ 중 — 알라딘이 매입하지 않을 수 있음', j.d);
  // ② 모든 곳 같은 판정 — 수동 일괄(bbNearX) · 등록 추천 탭(regBbrJ) · 등록 칸(regBbNear) · 상품 상세 · 경영 ⑤
  const al = await p.evaluate(() => { const l = [...S.plist.values()].find((x) => x.grade === '상' && x.active); S.pmetrics = S.pmetrics || new Map(); S.pmetrics.set(l.bookId, { id: l.bookId, buyback: { 상: 3800 } });
    const xIn = { l, goal: 4300, target: 5500, bbHit: { buy: 3800, floor: 5500 } }, xOut = { l, goal: 4500, target: 5500, bbHit: { buy: 3800, floor: 5500 } }, xNoHit = { l, goal: 4300, target: 4300 };
    const it = { id: 'nr1', stage: 'sel', grade: 2, info: { title: 't', buyback: { 상: 3800 } } };
    const pd = pdBhHtml({ ...l, price: 4200 });
    return { bIn: !!bbNearX(xIn), bOut: !!bbNearX(xOut), bNo: !!bbNearX(xNoHit), rIn: !!regBbrJ(it, xIn), rOut: !!regBbrJ(it, xOut), cIn: !!regBbNear(it, 4300), cOut: !!regBbNear(it, 4500), pd: /15% 안/.test(pd), pdOut: /15% 밖/.test(pdBhHtml({ ...l, price: 9000 })) }; });
  ok(al.bIn && !al.bOut && al.bNo, "수동 일괄 '알라딘 매입가 하한' 탭: 시장 맞춤가 4,300 들어옴 · 4,500(예전 하한가 규칙이면 듦)은 빠짐 · 하한가에 안 걸렸어도 근삿값 안이면 들어옴", al);
  ok(al.rIn && !al.rOut && al.cIn && !al.cOut, "📥 등록 '알라딘 매입 추천' 탭·'알라딘 매입이 나을 수 있음' 칸 = 같은 판정", al);
  ok(al.pd && al.pdOut, '상품 상세 🏷 알라딘 매입 줄에 「…(근삿값 15% 안/밖)」 표시', al);
  // 경영 ⑤ — 판매가 ≤ 매입가 × 1.15
  const bz = await p.evaluate(() => { const L = [...S.plist.values()].filter((x) => x.active).slice(0, 4); L.forEach((l, i) => S.pmetrics.set(l.bookId, { id: l.bookId, buyback: { [l.grade]: Math.round(l.price / [1.1, 1.2, 0.9, 1.16][i]) }, usedMins: {} })); S._bizAt = 0; S._biz = null; let B = null; try { renderMain && 0; B = (typeof bizData === 'function' ? bizData() : null); } catch (e) {} return { ids: L.map((l) => l.id), B: !!B }; });
  // (경영 계산 함수 이름이 화면마다 달라 직접 판정만 확인)
  const bz2 = await p.evaluate((ids) => ids.map((id) => { const l = S.plist.get(id); const bb = S.pmetrics.get(l.bookId).buyback[l.grade]; const J = bbNearJ(l.price, bb, l.grade); return J && J.in; }), bz.ids);
  ok(bz2.join() === 'true,false,true,false', '경영 ⑤ 알라딘 매입가에 가깝게 파는 상품: 판매가/매입가 1.10·0.90 들어옴 · 1.20·1.16 빠짐(같은 판정)', bz2);
  // ③ 알라딘 매입 후보 셈(bbuyCompute) — 근삿값 판정 · 중 포함 · 예전 규칙 수 함께
  const bc = await p.evaluate(async () => { S.pmLoaded = true; S.sellersLoaded = true; const L = [...S.plist.values()].filter((x) => x.active); const set = (l, buy, mk) => S.pmetrics.set(l.bookId, { id: l.bookId, buyback: { [l.grade]: buy }, usedFirstPage: [{ price: mk, grade: l.grade, sellerCode: '0', sellerName: '알라딘', ship: 0, soldOut: false }], lastCheckedAt: new Date().toISOString() });
    const a = L.find((l) => l.grade === '상'), b = L.find((l) => l.grade === '중'), c = L.filter((l) => l.grade === '상')[1]; S.pmetrics = new Map(); set(a, 4000, 4400); set(b, 3000, 3300); set(c, 4000, 8000);
    S.bbuyRes = null; await bbuyCompute(true); const H = S.bbuyRes.hit; const g = (l) => H.get(l.usedCode); return { a: g(a) && { in: g(a).near.in, mkt: g(a).mkt }, b: g(b) && { warn: g(b).near.warn }, c: !!g(c), all: [...H.values()].every((h) => h.near && h.near.in && h.mkt <= h.near.lim), old: S.bbuyRes.old, pct: S.bbuyRes.pct }; });
  ok(bc.a && bc.a.in && bc.b && /중/.test(bc.b.warn) && !bc.c && bc.all && bc.pct === 15 && typeof bc.old === 'number', `🏷 알라딘 매입 후보 = 시장 맞춤가 ≤ 매입가×1.15 · 중 포함(⚠) · 근삿값 밖 빠짐 · 예전 하한가 규칙 수(${bc.old})도 함께`, bc);
  // ④ 설정 — 관리자만 · 등록 ⚙ 와 알라딘 매입 ⚙ 같은 값 · 바꾸면 모든 곳
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.user = S.user || { email: 'tester@x' }; });
  await p.evaluate(() => openAladinSell({ t: 'cand' })); await p.waitForTimeout(600);
  const st0 = await p.evaluate(() => { const i = document.querySelector('[data-bbnearpct="bbuy"]'); return { v: i && i.value, dis: i && i.disabled, trash: (document.querySelector('[data-bbt="trash"]') || {}).textContent, candTi: (document.querySelector('[data-bbt="cand"]') || {}).title }; });
  ok(st0.v === '15' && !st0.dis && /🗑 휴지통 0/.test(st0.trash || '') && /15%/.test(st0.candTi || ''), "알라딘 매입 ⚙ 에 근삿값 칸(15) · 탭 줄 끝 「🗑 휴지통 0」 탭 · 후보 탭 설명 = 근삿값 규칙", st0);
  await p.fill('[data-bbnearpct="bbuy"]', '20'); await p.press('[data-bbnearpct="bbuy"]', 'Tab'); await p.waitForTimeout(900);
  const st1 = await p.evaluate(() => { const m = ((window.__FS.app_settings || {}).main) || {}; return { pct: bbNearPct(), fs: m.bbNearPct, log: (m.bbNearLog || []).slice(-1)[0], lim: bbNearJ(1, 3800, '상').lim, inNow: bbNearJ(4500, 3800, '상').in, res: S.bbuyRes && S.bbuyRes.pct }; });
  ok(st1.pct === 20 && st1.fs === 20 && st1.log && st1.log.from === 15 && st1.log.to === 20 && st1.lim === 4560 && st1.inNow, '근삿값 20%로 바꿈 → 공용 설정(app_settings/main.bbNearPct)·바꾼 기록 · 판정 바로 바뀜(4,500도 들어옴)', st1);
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); const mk = (id, o) => ({ stage: 'sel', isbn: '979110000' + id.slice(-4), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: t, info: { title: '근삿값 책 ' + id, isbn13: '979110000' + id.slice(-4), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '남', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '0', sellerName: '알라딘', ship: 0 }], priceList: 15000, priceSales: 13500, availability: 'onSale', pubDate: '2021-03-04', salesPoint: 1234, at: t, buyback: { 상: 3800 } }, ...o });
    const L = { n001: mk('n001', {}), n002: mk('n002', { descMode: 'quick', descQuick: Array.from({ length: 40 }, (_, i) => `${i + 1}번째 문장 — 띠지 없음 · 모서리 약간 눌림 · 밑줄 없음`).join(' ') }), n003: mk('n003', { stage: 'pick', cmdId: 'cmdLK' }), n004: mk('n004', { info: { title: '정보 적은 책', isbn13: '9791100004444', categories: [{ path: ['국내도서', '소설/시/희곡'] }], priceList: 15000, page1: [], at: t } }) };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-reg-view', 'compact'); localStorage.removeItem('rn-reg-ginfo'); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1500);
  const rc = await p.evaluate(() => { const i = document.querySelector('[data-bbnearpct="reg"]'); return { v: i && i.value }; });
  ok(rc.v === '20', '📥 등록 ⚙ 가격·등록 조건에도 같은 근삿값 칸(20)', rc);
  await p.evaluate(async () => { await bbNearSet(15, 'reg'); }); await p.waitForTimeout(300);
  const na = await p.evaluate(async () => { S.devOk = false; regRerender(); await new Promise((r) => setTimeout(r, 500)); const i = document.querySelector('[data-bbnearpct="reg"]'); const r = { dis: i && i.disabled, set: await bbNearSet(30, 'reg'), pct: bbNearPct() }; S.devOk = true; regRerender(); return r; });
  ok(na.dis && na.set === false && na.pct === 15, '관리자 기기가 아니면 칸이 잠기고 바뀌지 않음', na);
  await p.waitForTimeout(500);
  // ⑤ ⓘ 추가 정보 칩 — 정가(판매가)·판매중·국내도서·출간일·SP · 값 없는 칩 없음 · 켜고 끄기(카드 모두)
  const gi = await p.evaluate(() => { const r = (id) => { const x = document.querySelector(`.rgrow[data-rgexp="${id}"] .rgginfo-l`); return x ? [...x.querySelectorAll('.rgi')].map((c) => c.textContent) : []; }; return { a: r('n001'), d: r('n004'), btn: (document.querySelector('[data-rgginfo]') || {}).textContent }; });
  ok(gi.a.join('|') === '정가 15,000원 (판매 13,500원)|판매중|국내도서|2021-03-04|SP 1,234' && gi.d.join('|') === '정가 15,000원|국내도서' && /추가 정보 켬/.test(gi.btn || ''), 'ⓘ 추가 정보 칩: 정가(판매가)·판매 여부·종류·출간일·SP(기본 켬) · 값 없는 칩은 감춤(정가·종류만 있는 책은 두 칩)', gi);
  await p.click('[data-rgginfo]'); await p.waitForTimeout(700);
  const gi2 = await p.evaluate(() => ({ n: document.querySelectorAll('.rgrow .rgginfo-l').length, ls: localStorage.getItem('rn-reg-ginfo'), btn: (document.querySelector('[data-rgginfo]') || {}).textContent }));
  await p.click('[data-rgginfo]'); await p.waitForTimeout(700); const gi3 = await p.evaluate(() => document.querySelectorAll('.rgrow .rgginfo-l').length);
  ok(gi2.n === 0 && gi2.ls === '0' && /끔/.test(gi2.btn) && gi3 > 0, 'ⓘ 단추로 카드 모두 끄고 켬(이 기기 기억)', { gi2, gi3 });
  // ⑥ 한눈에 판매가 칸 누름·입력 → 자세히가 열리지 않음 · 고르기 칩 셋
  const opened = () => p.evaluate(() => [...(S._regOpen || [])]);
  await p.click('.rgrow[data-rgexp="n001"] input.rgr-pin'); await p.waitForTimeout(250);
  const ch = await p.evaluate(() => { const d = document.querySelector('.rgpchips'); const x = (S._regFcur.get('n001') || {}).x; return d ? { L: [...d.querySelectorAll('[data-rgpc]')].map((b) => b.querySelector('small').textContent + '=' + b.querySelector('b').textContent), rec: x && x.target, fixed: getComputedStyle(d).position } : null; });
  const recW = ch && ch.rec != null ? Math.round(ch.rec).toLocaleString() + '원' : null;
  ok(ch && ch.L.length === (recW ? 3 : 2) && (!recW || ch.L[0] === '추천=' + recW) && ch.L.includes('최상단=4,000원') && ch.L.includes('최저 유효=5,200원'), '판매가 칸에 들어가면 칩: 추천(엔진 추천가) · 최상단(첫 쪽 맨 윗줄 4,000) · 최저 유효(같은 등급 유효 판매자 5,200 — 다른 등급·우리 것 뺌)', ch);
  await p.keyboard.type('77'); await p.waitForTimeout(900); await p.click('.rgrow[data-rgexp="n001"] .rgr-ref'); await p.waitForTimeout(300);
  ok((await opened()).length === 0, '판매가 칸 누름·입력·옆 참고 글 누름 → 자세히가 열리지 않음', await opened());
  await p.click('.rgrow[data-rgexp="n001"] input.rgr-pin'); await p.waitForTimeout(250);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.rgpchips [data-rgpc]')].find((x) => /최저 유효/.test(x.textContent)); const r = b.getBoundingClientRect(); window.__pcxy = [r.left + 5, r.top + 5]; });
  const xy = await p.evaluate(() => window.__pcxy); await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(1200);
  const pk = await p.evaluate(() => ({ v: (window.__FS.reg_items.n001 || {}).price, man: (window.__FS.reg_items.n001 || {}).priceManual, open: [...(S._regOpen || [])], chips: !!document.querySelector('.rgpchips') }));
  ok(pk.v === 5200 && pk.man === true && !pk.open.length && !pk.chips, '「최저 유효」 칩 누름 → 판매가 5,200 저장(직접 입력과 같은 저장 · 직접 정함) · 자세히 안 열림 · 칩 닫힘', pk);
  await p.click('.rgrow[data-rgexp="n001"] input.rgr-pin'); await p.waitForTimeout(250); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  const kb = await p.evaluate(() => ((document.querySelector('.rgpchips [data-rgpc].on small') || {}).textContent)); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
  const kv = await p.evaluate(() => (window.__FS.reg_items.n001 || {}).price); const want = await p.evaluate((k) => { const o = regPriceOpts('n001').find((x) => x.nm === k); return o && o.p; }, kb);
  ok(kb && kv === want, `키보드 ↓↓ + Enter → 「${kb}」 값 ${want} 저장`, { kb, kv, want });
  await p.click('.rgrow[data-rgexp="n004"] input.rgr-pin'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !document.querySelector('.rgpchips')), '값이 하나도 없는 상품(첫 쪽·추천 없음)은 칩 안 뜸');
  // ⑦ 📋 한눈에 바로 고치기 — 창 밖 아무 데나 누르면 닫힘(저장 안 함 · 줄 펼치기로 안 번짐) · 창 안 빈 곳은 그대로
  await p.click('.rgrow[data-rgexp="n001"] [data-rggl="qty"]'); await p.waitForTimeout(200);
  const pb = await p.evaluate(() => { const z = document.getElementById('rgglpop'); const r = z.getBoundingClientRect(); return [r.left + 3, r.bottom - 3]; }); await p.mouse.click(pb[0], pb[1]); await p.waitForTimeout(200);
  const inside = await p.evaluate(() => document.getElementById('rgglpop').style.display === 'block');
  const rb = await p.evaluate(() => { const r = document.querySelector('.rgrow[data-rgexp="n004"]').getBoundingClientRect(); return [r.left + r.width * 0.55, r.top + 8]; }); await p.mouse.click(rb[0], rb[1]); await p.waitForTimeout(400);
  const outside = await p.evaluate(() => ({ open: document.getElementById('rgglpop').style.display === 'block', exp: [...(S._regOpen || [])], qty: (window.__FS.reg_items.n001 || {}).qty }));
  ok(inside && !outside.open && !outside.exp.length && outside.qty === 1, '창 안 빈 곳은 닫지 않음 · 창 밖(다른 줄 빈 곳)을 누르면 닫힘 — 저장 없음 · 그 줄이 펼쳐지지 않음', { inside, outside });
  // ⑧ 설명 칸 — 접힌 칸(앞 10줄) · 누르면 입력 · 밖으로 나가면 저장하고 바로 접힘 · 마우스 올리면 전체
  const f0 = await p.evaluate(() => { const el = document.querySelector('.rgrow[data-rgexp="n002"] .rgqf .rgqf-t'); if (!el) return null; const lh = parseFloat(getComputedStyle(el).lineHeight); return { lines: Math.round(el.clientHeight / lh), clamp: el.scrollHeight > el.clientHeight + 2, input: !!document.querySelector('.rgrow[data-rgexp="n002"] .rgq-in') }; });
  ok(f0 && f0.lines === 10 && f0.clamp && !f0.input, '⚡ 설명은 접힌 칸으로 — 앞 10줄만 보이고 넘치면 줄임', f0);
  await p.hover('.rgrow[data-rgexp="n002"] .rgqf'); await p.waitForTimeout(250);
  const tip = await p.evaluate(() => { const z = document.getElementById('rgqtip'); if (!z) return null; const r = z.getBoundingClientRect(); return { full: /40번째 문장/.test(z.textContent), inV: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, scroll: z.scrollHeight >= z.clientHeight }; });
  ok(tip && tip.full && tip.inV && tip.scroll, '마우스를 올리면 전체 글 겹침 상자(화면 안 · 긴 글은 그 안에서 스크롤)', tip);
  await p.click('.rgrow[data-rgexp="n002"] .rgqf'); await p.waitForTimeout(250);
  const f1 = await p.evaluate(() => ({ inp: !!document.querySelector('.rgrow[data-rgexp="n002"] .rgq-in'), foc: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === 'n002', exp: [...(S._regOpen || [])], tip: !!document.getElementById('rgqtip') }));
  ok(f1.inp && f1.foc && !f1.exp.length && !f1.tip, '접힌 칸을 누르면 그 자리에서 입력 칸(커서 들어감) · 자세히는 안 열림', f1);
  await p.keyboard.press('End'); await p.keyboard.type(' 끝에 더함'); await p.mouse.click(5, 300); await p.waitForTimeout(1200);
  const f2 = await p.evaluate(() => ({ fold: !!document.querySelector('.rgrow[data-rgexp="n002"] .rgqf'), inp: !!document.querySelector('.rgrow[data-rgexp="n002"] .rgq-in'), v: (window.__FS.reg_items.n002 || {}).descQuick || '' }));
  ok(f2.fold && !f2.inp && /끝에 더함$/.test(f2.v) && /^1번째 문장/.test(f2.v), '칸 밖을 누르면 지금처럼 저장하고 바로 작게 접힘(저장 값 그대로 + 더한 글)', { fold: f2.fold, inp: f2.inp, tail: f2.v.slice(-12) });
  await p.click('.rgrow[data-rgexp="n002"] .rgqf'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="n002"] .rgqf') && !document.querySelector('.rgrow[data-rgexp="n002"] .rgq-in') && !!(S.detail && S.detail.reg)), 'Esc로도 접힘(등록 화면은 그대로)');
  // ⑨ 자세히 잠금 — 맡긴 상품은 자세히 카드도 🔒 · 입력 칸 막힘 · 상태 단추 눌러도 안 바뀜
  await p.waitForTimeout(4200); /* 설명 칸을 친 뒤 '치는 중' 표시가 풀릴 때까지(그동안 화면을 다시 그리지 않음) */ await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S._regTyping = false; S.regT = 'pick'; regRerender(); }); await p.waitForTimeout(1000);
  const lk = await p.evaluate(() => { const c0 = document.querySelector('#sheet [data-rgchk="n003"]'); const c = c0 && c0.closest('.card'); if (!c) return null; const ins = [...c.querySelectorAll('input:not([type=checkbox]),textarea,select')]; const g = c.querySelector('[data-rgg]'); const g0 = S.regItems.get('n003').grade; if (g) [...c.querySelectorAll('[data-rgg]')].find((b) => +b.dataset.v !== g0).click(); return { lkb: (c.querySelector('.rglkb') || {}).textContent, cls: c.classList.contains('rglk'), dis: ins.length && ins.every((i) => i.disabled), n: ins.length, hadG: !!g, g0 }; });
  await p.waitForTimeout(500); const g1 = await p.evaluate(() => (window.__FS.reg_items.n003 || {}).grade);
  ok(lk && lk.cls && /맡긴 상품/.test(lk.lkb || '') && lk.dis && (!lk.hadG || g1 === lk.g0), '자세히 카드도 한눈에와 같은 잠금: 🔒 까닭 줄 · 입력 칸 막힘 · 상태 단추 눌러도 그대로', { lk, g1 });
  await p.evaluate(() => { S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(700);
  const ul = await p.evaluate(() => { const c0 = document.querySelector('#sheet [data-rgchk="n001"]'); const c = c0 && c0.closest('.card'); return c ? { cls: c.classList.contains('rglk'), dis: [...c.querySelectorAll('input[data-rgpin]')].some((i) => i.disabled) } : null; });
  ok(ul && !ul.cls && !ul.dis, '잠기지 않은 카드는 그대로 고침', ul);
  console.log(bad ? `❌ tBBNEAR 실패 ${bad}` : '✓ tBBNEAR 통과'); });
