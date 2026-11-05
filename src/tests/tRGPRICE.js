// tRGPRICE — 정범님 11/05 (시급) '📋 한눈에 카드에서 판매가를 손으로 바꾸면 잠시 뒤 원래 값으로 되돌아감 — 화면의 3권 모두 · 책 문제 아님'
//  원인(재현됨): 판매가 칸에 들어가면 칸 바로 아래에 고르기 칩(추천·최상단·최저 유효)이 뜨는데 —
//   ① 치고 0.6초 뒤 저장 → 다시 그리기가 커서를 새 칸에 되돌려 넣으며(focusin) 칩을 다시 띄움 → 칩이 바로 아래 줄(다음 책) 판매가 칸을 덮음
//   ② 그 자리(다음 책 판매가 칸)를 누르면 누름이 칩에 걸려 앞 책 판매가가 '추천가'(대개 처음 값)로 바뀜 → '되돌아감'
//   ③ Tab을 누르면 다음 칸으로 가지 않고 칩을 고르는 데 쓰임 → 이어서 Enter면 칩 값으로 바뀜
//   ④ 자동 길: ⚙ 가격 조건을 바꿀 때 🔗 실시간 적용이 직접 정한 판매가도 덮음 · 시세 줄에서 고른 판매가(__regPick)에 '직접 정함' 표시가 없어 옮길 때 조건대로 다시 정해짐
//  + 한눈에 설명: 빈 '직접 입력'·한 줄 직접 입력도 누르면 제자리 입력(자세히로 펼치지 않음) · 접힌 설명은 한 줄(넘치면 …) · '설명 접기 ○줄' 칸 없앰
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const PG = [{ p: 8000, g: '상', c: 'green', n: '판매자A' }, { p: 9000, g: '최상', c: 'dkgreen', n: '판매자B' }, { p: 7000, g: '중', c: 'green', n: '판매자C' }];
const seed = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async (PG) => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const mk = (id, o) => ({ stage: 'sel', isbn: '97911000003' + id.slice(-2), grade: 2, qty: 1, ws: regWsCur(), createdAt: t, code: 'BLKCMN', codeManual: true, info: { title: '판매가 책 ' + id, isbn13: '97911000003' + id.slice(-2), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, at: t }, ...o });
    const L = { p01: mk('p01', { price: 8000 }), p02: mk('p02', { price: 8000 }), p03: mk('p03', { price: 8000 }), h04: mk('h04', { stage: 'hold', price: 8000 }),
      d05: mk('d05', { price: 8000, descMode: 'manual', descEdit: '' }), d06: mk('d06', { price: 8000, descMode: 'manual', descParts: {} }), d07: mk('d07', { price: 8000, descMode: 'quick', descQuick: '' }),
      d08: mk('d08', { price: 8000, descMode: 'quick', descQuick: Array.from({ length: 40 }, (_, i) => `${i + 1}번째 문장 띠지 없음`).join(' ') }), d09: mk('d09', { price: 8000, descMode: 'manual', descEdit: '여러 줄 직접 입력 첫 줄\n둘째 줄\n셋째 줄' }), d10: mk('d10', { price: 8000, descMode: 'manual', descEdit: '한 줄 직접 입력' }) };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-reg-view', 'compact'); localStorage.setItem('rn-reg-qfl', '5'); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); }, PG);
  await p.waitForTimeout(1600); await p.addStyleTag({ content: '.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' }); };
const pin = (id) => `.rgrow [data-rgpin="${id}"]`;
const st = (p, id) => p.evaluate((id) => { const i = document.querySelector(`.rgrow [data-rgpin="${id}"]`); const d = window.__FS.reg_items[id] || {}; return { dom: i ? i.value : null, fs: d.price, man: d.priceManual, log: (d.priceLog || []).map((x) => `${x.how}:${x.to}`) }; }, id);
const center = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 24), y: Math.round(r.top + r.height / 2) }; }, sel);
const wait = (p, ms) => p.waitForTimeout(ms);
H(async (p) => { await seed(p);
  // ① 치고 저장된 뒤 아래 줄(다음 책) 판매가 칸을 마우스로 누름 — 앞 책 값이 그대로여야 함(예전: 칩 '추천'에 걸려 8,000원으로 되돌아감)
  let c = await center(p, pin('p01')); await p.mouse.click(c.x, c.y); await wait(p, 200);
  const chip0 = await p.evaluate(() => !!document.querySelector('.rgpchips'));
  await p.keyboard.press('Control+A'); await p.keyboard.type('12300'); await wait(p, 1300);
  const chipAfter = await p.evaluate(() => !!document.querySelector('.rgpchips'));
  c = await p.evaluate(() => { const r = document.querySelector('.rgrow [data-rgpin="p02"]').getBoundingClientRect(); return { x: Math.round(r.left + 24), y: Math.round(r.top + r.height / 2) }; }); await p.mouse.click(c.x, c.y); await wait(p, 1500);
  let a = await st(p, 'p01'); const f2 = await p.evaluate(() => document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgpin);
  ok(chip0, '판매가 칸을 누르면 고르기 칩이 뜸(쓰던 기능 그대로)', chip0);
  ok(!chipAfter, '치기 시작하면 칩이 닫히고, 저장 뒤 다시 그려도 다시 뜨지 않음(아래 줄을 덮지 않음)', chipAfter);
  ok(a.dom === '12300' && a.fs === 12300 && a.man === true && a.log.join() === 'input:12300' && f2 === 'p02', '치고 → 아래 줄 판매가 칸 누름: 앞 책 12,300원 그대로 · 누른 칸에 커서', { a, f2 });
  // ② 치고 Tab → Enter — Tab은 다음 칸으로(칩 고르기에 쓰지 않음) · Enter로 칩 값이 들어가지 않음
  await p.keyboard.press('Control+A'); await p.keyboard.type('15500'); await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await wait(p, 1500);
  a = await st(p, 'p02'); ok(a.dom === '15500' && a.fs === 15500 && a.man === true && !a.log.some((x) => /:8000$/.test(x)), '치고 Tab → Enter: 15,500원 그대로(예전: Tab이 칩을 고르고 Enter가 추천가 8,000원을 넣음)', a);
  // ③ 치는 중(저장 전)에 다른 기기의 바뀜(같은 줄 수량)이 실시간으로 들어옴 → 친 값이 지워지지 않고 그대로 저장됨 · 수량도 반영
  c = await center(p, pin('p03')); await p.mouse.click(c.x, c.y); await wait(p, 150); await p.keyboard.press('Control+A'); await p.keyboard.type('99');
  await p.evaluate(() => { window.__FS.reg_items.p03 = { ...window.__FS.reg_items.p03, qty: 2 }; db.collection('reg_items').doc('zz-other').set({ stage: 'trash', createdAt: new Date().toISOString() }); }); /* 다른 기기 쓰기 → 실시간 구독(onSnapshot)이 돎 */
  await wait(p, 250); await p.keyboard.type('00'); await wait(p, 1600);
  a = await st(p, 'p03'); const q3 = await p.evaluate(() => (S.regItems.get('p03') || {}).qty);
  ok(a.dom === '9900' && a.fs === 9900 && a.man === true && q3 === 2, '치는 중 실시간 스냅샷이 끼어도 친 값(9,900원) 그대로 저장 · 다른 기기 수량도 반영', { a, q3 });
  // ④ 자동 길 — ⚙ 가격 조건 바꿈 + 🔗 실시간 적용(고른 상품): 직접 정한 판매가는 덮지 않음 · 직접 정하지 않은 것만 조건대로
  await p.evaluate(async () => { localStorage.setItem('rn-reg-live', '1'); await regUpd('h04', { price: 6500, priceManual: false }); S._regChkIds = ['p01', 'p02', 'h04']; regLiveApply({ crit: regCfg().crit }); }); await wait(p, 1500);
  const l1 = await st(p, 'p01'), l2 = await st(p, 'p02'), l4 = await p.evaluate(() => (window.__FS.reg_items.h04 || {}).price);
  ok(l1.fs === 12300 && l1.man && l2.fs === 15500 && l2.man, '🔗 실시간 적용(가격 조건 바꿈)이 직접 정한 판매가를 덮지 않음', { l1, l2 });
  ok(l4 === 8000, '직접 정하지 않은 판매가는 예전처럼 조건대로(6,500 → 추천 8,000)', l4);
  await p.evaluate(() => { localStorage.removeItem('rn-reg-live'); S._regChkIds = []; });
  // ⑤ 시세 줄에서 고른 판매가(__regPick)도 '직접 정함' — 보류 → 선택 대기로 옮겨도(옮길 때 조건대로 다시) 그대로
  await p.evaluate(async () => { window.__regPick('h04', 11100); await new Promise((r) => setTimeout(r, 300)); await regMoveIds(['h04'], 'sel', S._regFcur); }); await wait(p, 900);
  const h4 = await p.evaluate(() => { const d = window.__FS.reg_items.h04 || {}; return { price: d.price, man: d.priceManual, stage: d.stage, log: (d.priceLog || []).map((x) => x.how + ':' + x.to) }; });
  ok(h4.price === 11100 && h4.man === true && h4.stage === 'sel' && h4.log.some((x) => /:11100$/.test(x)), '시세 줄에서 고른 11,100원 = 직접 정함(기록 남음) → 옮길 때 조건대로 다시 정하지 않음', h4);
  // ⑥ 다시 그려도(실시간 구독 여러 번) 직접 정한 값 그대로 · 판매가 칸을 다시 누르면 칩이 다시 뜨고, 칩을 고르면 그 값(쓰던 기능)
  await p.evaluate(() => { openRegister(); openRegister(); }); await wait(p, 800);
  a = await st(p, 'p01'); ok(a.dom === '12300' && a.fs === 12300, '여러 번 다시 그려도 12,300원 그대로', a);
  c = await center(p, pin('p01')); await p.mouse.click(c.x, c.y); await wait(p, 200); const chip2 = await p.evaluate(() => !!document.querySelector('.rgpchips'));
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(p, 1200); a = await st(p, 'p01');
  ok(chip2 && a.fs === 8000 && a.man === true, '칸을 다시 누르면 칩 · ↓ + Enter로 고르면 그 값(추천 8,000원 · 직접 정함)', { chip2, a });
  await p.mouse.click(700, 5); await wait(p, 500);

  // ⑦ 빈 '직접 입력' 설명 · 빈 ⚡ 설명 · 한 줄 직접 입력 — 누르면 제자리 입력(자세히로 펼치지 않음) → 쓰고 바깥 누르면 저장·한 줄로 접힘
  for (const [id, mode] of [['d05', 'manual'], ['d06', 'manual'], ['d07', 'quick'], ['d10', 'manual']]) {
    c = await center(p, `.rgrow[data-rgexp="${id}"] .rgqf`); await p.mouse.click(c.x, c.y); await wait(p, 300);
    const o = await p.evaluate((id) => ({ exp: [...(S._regOpen || [])], inp: !!document.querySelector(`.rgrow[data-rgexp="${id}"] .rgq-in`), foc: !!(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === id) }), id);
    await p.keyboard.press('End'); await p.keyboard.type(' 제자리'); await p.mouse.click(700, 5); await wait(p, 1000);
    const s = await p.evaluate((id) => { const d = window.__FS.reg_items[id] || {}; const r = document.querySelector(`.rgrow[data-rgexp="${id}"]`); return { mode: d.descMode, v: d.descMode === 'quick' ? d.descQuick : d.descEdit, desc: d.desc, fold: !!r.querySelector('.rgqf'), inp: !!r.querySelector('.rgq-in'), exp: [...(S._regOpen || [])] }; }, id);
    ok(!o.exp.length && o.inp && o.foc && s.mode === mode && /제자리$/.test(s.v) && (mode === 'quick' || s.desc === s.v) && s.fold && !s.inp && !s.exp.length, `${id}(${mode === 'quick' ? '빈 ⚡ 설명' : id === 'd10' ? '한 줄 직접 입력' : '빈 직접 입력'}): 누르면 제자리 입력 · 자세히 안 열림 · 바깥 누름 → 저장(같은 방식 그대로) · 접힘`, { o, s });
  }
  // 여러 줄 직접 입력은 한 줄 입력 칸에 담을 수 없어 예전처럼 자세히로
  c = await center(p, '.rgrow[data-rgexp="d09"] .rgqf'); await p.mouse.click(c.x, c.y); await wait(p, 600);
  ok(await p.evaluate(() => (S._regOpen || new Set()).has('d09')), '여러 줄 직접 입력 설명은 누르면 자세히(줄 바꿈을 지키려고 · 예전 그대로)');
  await p.evaluate(() => { S._regOpen = new Set(); openRegister(); }); await wait(p, 900);
  // ⑧ 접힌 설명 = 그 칸 너비 한 줄 · 넘치면 … · 줄 수 고르기 칸 없음(기기 저장 값 rn-reg-qfl=5는 지우지 않고 무시)
  const one = await p.evaluate(() => [...document.querySelectorAll('.rgrow .rgqf-t')].map((t) => { const cs = getComputedStyle(t); const lh = parseFloat(cs.lineHeight); const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); return { id: t.closest('.rgrow').dataset.rgexp, lines: Math.round((t.clientHeight - pad) / lh), ell: cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap', over: t.scrollWidth > t.clientWidth + 1, inW: t.getBoundingClientRect().right <= t.closest('.rgrow').getBoundingClientRect().right + 1 }; }));
  ok(one.length >= 5 && one.every((x) => x.lines === 1 && x.ell && x.inW), '접힌 설명은 모두 한 줄(줄바꿈 없음 · 넘치면 …) · 칸 너비 안', one);
  ok(one.find((x) => x.id === 'd08').over && one.find((x) => x.id === 'd09').lines === 1, '긴 설명(40문장)·여러 줄 직접 입력도 한 줄로 접힘(넘침은 … )', one.filter((x) => /d08|d09/.test(x.id)));
  ok(await p.evaluate(() => !document.querySelector('select[data-rgqfl], .rgqfl-s') && localStorage.getItem('rn-reg-qfl') === '5'), "'설명 접기 ○줄' 칸이 화면에 없음 · 이 기기 저장 값은 지우지 않음(무시)");
  ok(await p.evaluate(() => { const L = (typeof PAGE_GUIDES !== 'undefined' ? JSON.stringify(PAGE_GUIDES) : '') + JSON.stringify(typeof FEAT !== 'undefined' ? FEAT : '') + document.documentElement.innerHTML; return !/설명 접기 ○줄|설명 접기 \[2\]줄|기본 2줄로 접힘/.test(L); }), "설명서·기능 찾기에 '설명 접기 ○줄' 안내가 남아 있지 않음");
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '가로 넘침 없음(1400)');
  console.log(bad ? `  (PC 쪽 실패 ${bad})` : '  (PC 쪽 통과)');
}).then(() => H(async (p) => { await seed(p);
  const one = await p.evaluate(() => [...document.querySelectorAll('.rgrow .rgqf-t')].map((t) => { const cs = getComputedStyle(t); const lh = parseFloat(cs.lineHeight); const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); return { lines: Math.round((t.clientHeight - pad) / lh), inW: t.getBoundingClientRect().right <= innerWidth + 1 }; }));
  ok(one.length >= 5 && one.every((x) => x.lines === 1 && x.inW), '휴대폰(390): 접힌 설명 한 줄 · 화면 안', one);
  await p.tap('.rgrow[data-rgexp="d05"] .rgqf'); await wait(p, 400);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="d05"] .rgq-in') && !(S._regOpen || new Set()).size), '휴대폰: 빈 직접 입력을 톡 → 제자리 입력(자세히 안 열림)');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰: 가로 넘침 없음');
  console.log(bad ? `❌ tRGPRICE 실패 ${bad}` : '✓ tRGPRICE 통과');
}, { vp: { width: 390, height: 900 }, touch: true }));
