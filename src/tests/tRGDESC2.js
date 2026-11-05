// tRGDESC2 — 정범님 11/05 15시: '📋 한눈에 카드 설명 부분을 오른쪽으로 · 높이가 이전 높이인 것이 중요 · 설명줄이 활성 후 다시 간소화되지 않아'
//  ① 자리·높이 — 왼쪽 = 정보(표지·제목·책 정보 세 줄) · 오른쪽 = 기능 두 줄(첫 줄 등록 부류·상태·가격·수량·코드·단계 · 둘째 줄 설명 칸)
//     줄 높이 ≤ 예전 높이 + 4px (예전 = 설명이 첫 줄 오른쪽 끝에 있던 판(gl3 앞) · 같은 시험 자료로 잰 값: 1400px 한 줄 설명 72px · 매입 띠 줄 92px)
//  ② 모든 흐름에서 접힘 — 누름 → 입력 → 바깥 누름 / Tab / Enter / Esc / 다른 줄 누름 / 자동 완성 목록 고름(마우스·↓+Enter) / 저장 지연 중 다시 그리기 / 떠난 뒤 3초 안 다시 그리기 / 휴대폰 탭
//  스크린샷: gl4_*.png (RN_SHOT 폴더)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const SP = process.env.RN_SHOT || require('os').tmpdir() + '/';
const H = require('./harness.js');
const OLD = 72, OLD_BB = 92; // 예전(gl3 앞 판) 1400px 줄 높이 — 같은 자료로 잼
const seedRows = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); const mk = (id, o) => ({ stage: 'sel', isbn: '979110000' + id.slice(-4), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: t, info: { title: '설명 책 ' + id, isbn13: '979110000' + id.slice(-4), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t }, ...o });
    const long = Array.from({ length: 14 }, (_, i) => `${i + 1}번째 줄 — 띠지 없음 · 모서리 약간 눌림`).join('\n');
    const L = { q001: mk('q001', { descMode: 'quick', descQuick: '깨끗함 · 밑줄 없음' }), q002: mk('q002', { descMode: 'quick', descQuick: long }), q003: mk('q003', { descMode: 'quick', descQuick: '' }), m004: mk('m004', { descMode: 'manual', descEdit: '직접 쓴 설명 첫 줄\n둘째 줄\n셋째 줄\n넷째 줄' }), n005: mk('n005', {}), q006: mk('q006', { descMode: 'quick', descQuick: Array.from({ length: 30 }, (_, i) => `${i + 1}번째 문장 띠지 없음`).join(' ') }),
      b007: mk('b007', { descMode: 'quick', descQuick: '매입 띠가 있는 줄의 설명', price: 4300, info: { title: '매입 띠 책', isbn13: '9791100000007', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t, buyback: { 상: 3800 } } }) };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-rgq-mode', 'pc'); localStorage.setItem('rn-rgq-pc', JSON.stringify({ ph: [{ t: '깨끗한 책 · 밑줄 없음 · 띠지 있음', n: 5 }, { t: '깨끗한 편 · 모서리 눌림', n: 2 }], min: 3 }));
    localStorage.setItem('rn-reg-view', 'compact'); localStorage.removeItem('rn-reg-qfl'); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1500); await p.addStyleTag({ content: '.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' }); };
const geo = (p) => p.evaluate(() => [...document.querySelectorAll('.rgrow')].map((r) => { const R = r.getBoundingClientRect(); const q = r.querySelector(':scope > .rgr-q, :scope > .rgr-qw'); const M = r.querySelector('.rgr-m').getBoundingClientRect(), T = r.querySelector('.rgr-t').getBoundingClientRect(), Sx = r.querySelector('.rgr-s').getBoundingClientRect(); const Q = q.getBoundingClientRect();
  return { id: r.dataset.rgexp, h: Math.round(R.height), right: Q.left >= T.right - 1 && Q.left >= M.left - 2 && Q.right <= R.right + 1, under: Q.top >= Math.max(M.bottom, Sx.bottom) - 1, inRow: Q.bottom <= (r.querySelector('.rgbbn') ? r.querySelector('.rgbbn').getBoundingClientRect().top + 1 : R.bottom), line2: Math.abs(M.top - T.top) < 30, bb: !!r.querySelector('.rgbbn') }; }));
const st = (p, id) => p.evaluate((id) => { const r = document.querySelector(`.rgrow[data-rgexp="${id}"]`); return { inp: !!r.querySelector('.rgq-in'), fold: !!r.querySelector('.rgqf'), foc: !!(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === id), open: S._rgqOpen || null, v: (window.__FS.reg_items[id] || {}).descQuick, h: Math.round(r.getBoundingClientRect().height), exp: [...(S._regOpen || [])] }; }, id);
const rowShot = async (p, name, ids) => { const box = await p.evaluate((ids) => { const a = ids.map((i) => document.querySelector(`.rgrow[data-rgexp="${i}"]`)); a[0].scrollIntoView({ block: 'center' }); const t = Math.min(...a.map((x) => x.getBoundingClientRect().top)), b = Math.max(...a.map((x) => x.getBoundingClientRect().bottom)); const y = Math.max(0, t - 4); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight - y, b - t + 8) }; }, ids); await p.screenshot({ path: SP + name, clip: box }); };
const wait = (p, ms) => p.waitForTimeout(ms);
H(async (p) => { await seedRows(p);
  // ① 자리·높이
  let L = await geo(p);
  ok(L.every((x) => x.right && x.under && x.inRow), 'PC: 설명 칸(또는 ⚡ 설명 단추) = 오른쪽 기능 첫 줄 아래 둘째 줄 · 제목 쪽으로 넘어가지 않음', L);
  ok(L.every((x) => x.h <= (x.bb ? OLD_BB : OLD) + 4), `PC: 줄 높이 ≤ 예전 높이 + 4px (예전 ${OLD}px · 매입 띠 줄 ${OLD_BB}px)`, L.map((x) => [x.id, x.h]));
  ok(L.filter((x) => ['q001', 'q003', 'n005'].includes(x.id)).every((x) => x.h <= OLD), '한 줄 설명·빈 설명·⚡ 설명 단추 줄은 예전과 같은 높이(72px 이하)', L.map((x) => [x.id, x.h]));
  ok(L.every((x) => x.line2), '기능 첫 줄 위치는 제목 줄 높이 언저리(왼쪽 세 줄과 오른쪽 두 줄이 나란히)', L.map((x) => [x.id, x.line2]));
  await p.evaluate(() => document.querySelector('.rgrow').scrollIntoView()); await wait(p, 200);
  await p.screenshot({ path: SP + 'gl4_after_1400.png', clip: await p.evaluate(() => { const a = document.querySelectorAll('.rgrow'); const r1 = a[0].getBoundingClientRect(), r2 = a[a.length - 1].getBoundingClientRect(); const y = Math.max(0, r1.top - 6); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight - y, r2.bottom - r1.top + 12) }; }) });
  // ② 누름 → 입력 → 바깥 누름
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 200); await p.keyboard.press('End'); await p.keyboard.type(' · 바깥');
  let s = await st(p, 'q001'); const hOpen = s.h; await rowShot(p, 'gl4_flow_open_1400.png', ['q001', 'q002']);
  ok(s.inp && s.foc && hOpen <= OLD + 4, '누르면 오른쪽 둘째 줄에서 입력 칸(줄 높이 그대로)', s);
  await p.mouse.click(700, 5); await wait(p, 900); s = await st(p, 'q001'); await rowShot(p, 'gl4_flow_fold_1400.png', ['q001', 'q002']);
  ok(s.fold && !s.inp && !s.open && s.v === '깨끗함 · 밑줄 없음 · 바깥', '바깥 누름 → 저장하고 접힘', s);
  // Tab
  await p.click('.rgrow[data-rgexp="q006"] .rgqf'); await wait(p, 200); await p.keyboard.press('End'); await p.keyboard.type(' · 탭'); await p.keyboard.press('Tab'); await wait(p, 900); s = await st(p, 'q006');
  ok(s.fold && !s.inp && !s.open && /· 탭$/.test(s.v), 'Tab → 저장하고 접힘', s);
  // Tab — 자동 완성 목록이 떠 있으면 Tab = 첫 문구 넣기(예전 규칙) → 넣고 저장 · 접힘
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 200); await p.keyboard.press('End'); await p.keyboard.type('X'); await wait(p, 250); const ddT = await p.evaluate(() => !!document.querySelector('.rgq-dd')); await p.keyboard.press('Tab'); await wait(p, 900); s = await st(p, 'q001');
  ok(ddT && s.fold && !s.inp && !s.open && !/X$/.test(s.v), '목록이 떠 있을 때 Tab → 첫 문구 넣고 저장 · 접힘', { ddT, s });
  // Enter
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 200); await p.keyboard.press('End'); await p.keyboard.type(' · 엔터'); await p.keyboard.press('Enter'); await wait(p, 900); s = await st(p, 'q001');
  ok(s.fold && !s.inp && !s.open && !s.foc && /· 엔터$/.test(s.v) && !s.exp.length, 'Enter → 저장하고 접힘(예전엔 저장만 하고 입력 칸이 남았음)', s);
  // Esc
  await p.click('.rgrow[data-rgexp="q003"] .rgqf'); await wait(p, 200); await p.keyboard.type('에스케이프'); await p.keyboard.press('Escape'); await wait(p, 900); s = await st(p, 'q003');
  ok(s.fold && !s.inp && s.v === '에스케이프' && (await p.evaluate(() => !!(S.detail && S.detail.reg))), 'Esc → 저장하고 접힘(등록 화면 그대로)', s);
  // 다른 줄 누름
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 200); await p.keyboard.type('!'); await p.click('.rgrow[data-rgexp="q006"] .rgqf'); await wait(p, 900);
  const a1 = await st(p, 'q001'), a6 = await st(p, 'q006');
  ok(a1.fold && !a1.inp && /!$/.test(a1.v) && a6.inp && a6.foc, '다른 줄 설명을 누르면 앞 줄은 저장하고 접힘 · 누른 줄만 입력 칸', { a1, a6 });
  await p.keyboard.press('Escape'); await wait(p, 700);
  // 자동 완성 — 마우스로 고름
  await p.click('.rgrow[data-rgexp="q003"] .rgqf'); await wait(p, 200); await p.keyboard.press('Control+A'); await p.keyboard.type('깨끗한'); await wait(p, 300);
  const dd = await p.evaluate(() => !!document.querySelector('.rgq-dd .o[data-i]')); await rowShot(p, 'gl4_flow_dd_1400.png', ['q003']);
  await p.click('.rgq-dd .o[data-i="0"]'); await wait(p, 900); s = await st(p, 'q003');
  ok(dd && s.fold && !s.inp && s.v === '깨끗한 책 · 밑줄 없음 · 띠지 있음' && !(await p.evaluate(() => !!document.querySelector('.rgq-dd'))), '자동 완성 목록을 마우스로 고르면 넣고 저장 · 접힘', { dd, s });
  // 자동 완성 — ↓ + Enter
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 200); await p.keyboard.press('Control+A'); await p.keyboard.type('깨끗한'); await wait(p, 300); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(p, 900); s = await st(p, 'q001');
  ok(s.fold && !s.inp && s.v === '깨끗한 편 · 모서리 눌림', '자동 완성 ↓ 고르고 Enter → 넣고 저장 · 접힘', s);
  // 저장 지연 중 다시 그리기 — 입력 중(4초 안)에 다시 그리기가 기다리다가, 떠나는 순간 돌아도 접힘
  await wait(p, 3200);
  await p.click('.rgrow[data-rgexp="q002"] .rgqf'); await wait(p, 200); await p.keyboard.type('x'); await p.evaluate(() => regRerender()); await wait(p, 400);
  const midT = await st(p, 'q002');
  await p.evaluate(() => { const i = document.querySelector('.rgrow .rgq-in[data-rgq="q002"]'); i.blur(); setTimeout(() => openRegister(), 140); setTimeout(() => openRegister(), 60); }); await wait(p, 1200); s = await st(p, 'q002');
  ok(midT.inp && midT.foc && s.fold && !s.inp && !s.open, '입력 중 다시 그리기는 입력 칸 그대로 · 떠난 뒤(저장 지연 사이) 다시 그려도 접힘', { midT, s });
  // 떠난 뒤 3초 안 다시 그리기(다른 기기 바뀜 등) — 예전엔 커서 없는 입력 칸으로 다시 그려져 남았음
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 150); await p.mouse.click(700, 5); await wait(p, 30); await p.evaluate(() => openRegister()); await wait(p, 300); await p.evaluate(() => openRegister()); await wait(p, 800); s = await st(p, 'q001');
  ok(s.fold && !s.inp && !s.open, '떠난 뒤 3초 안에 다시 그려도 접힌 칸', s);
  // ⚡ 설명 단추(설명 없음) → 바로 입력 칸 → Enter → 접힘
  await p.click('.rgrow[data-rgexp="n005"] [data-rgdm]'); await wait(p, 900); s = await st(p, 'n005'); const nb = s;
  await p.keyboard.type('단추로 연 설명'); await p.keyboard.press('Enter'); await wait(p, 900); s = await st(p, 'n005');
  ok(nb.inp && nb.foc && s.fold && !s.inp && s.v === '단추로 연 설명', '⚡ 설명 단추 → 입력 칸(커서) → Enter → 저장하고 접힘', { nb, s });
  // 끝 — 열린 칸 없음 · 높이 그대로
  L = await geo(p); ok(!(await p.evaluate(() => document.querySelectorAll('.rgrow .rgq-in').length)) && L.every((x) => x.h <= (x.bb ? OLD_BB : OLD) + 4), '흐름을 다 돈 뒤: 열린 입력 칸 없음 · 줄 높이 그대로', L.map((x) => [x.id, x.h]));
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '가로 넘침 없음(1400)');
  console.log(bad ? `  (PC 쪽 실패 ${bad})` : '  (PC 쪽 통과)');
}).then(() => H(async (p) => { await seedRows(p);
  const L = await p.evaluate(() => [...document.querySelectorAll('.rgrow')].map((r) => { const q = r.querySelector(':scope > .rgr-q, :scope > .rgr-qw').getBoundingClientRect(), m = r.querySelector('.rgr-m').getBoundingClientRect(); return { id: r.dataset.rgexp, h: Math.round(r.getBoundingClientRect().height), under: q.top >= m.bottom - 1, al: Math.abs(q.left + parseFloat(getComputedStyle(r.querySelector(':scope > .rgr-q, :scope > .rgr-qw')).paddingLeft) - (m.left + parseFloat(getComputedStyle(r.querySelector('.rgr-m')).paddingLeft))) < 4 }; }));
  ok(L.every((x) => x.under && x.al), '휴대폰(390): 설명 칸 = 기능 칸 아래 · 기능 칸과 같은 들여쓰기', L);
  ok(L.every((x) => x.h <= ({ q001: 204, q003: 204, n005: 203, b007: 232 }[x.id] || 221) + 4), '휴대폰: 줄 높이 ≤ 예전 + 4px', L.map((x) => [x.id, x.h]));
  await p.evaluate(() => document.querySelector('.rgrow').scrollIntoView()); await wait(p, 200);
  await p.screenshot({ path: SP + 'gl4_after_390.png', clip: await p.evaluate(() => { const a = document.querySelectorAll('.rgrow'); const r1 = a[0].getBoundingClientRect(); const y = Math.max(0, r1.top - 6); return { x: 0, y, width: innerWidth, height: innerHeight - y }; }) });
  // 휴대폰 탭 → 입력 → 바깥 탭 → 접힘
  await p.tap('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 300); await p.keyboard.press('End'); await p.keyboard.type(' · 폰'); let s = await st(p, 'q001'); const op = s; await rowShot(p, 'gl4_flow_open_390.png', ['q001']);
  await p.tap('.rgtools'); await wait(p, 900); s = await st(p, 'q001'); await rowShot(p, 'gl4_flow_fold_390.png', ['q001']);
  ok(op.inp && op.foc && s.fold && !s.inp && /· 폰$/.test(s.v), '휴대폰: 톡 → 입력 칸 → 다른 곳 톡 → 저장하고 접힘', { op, s });
  // 휴대폰 — 다른 줄 설명 톡
  await p.tap('.rgrow[data-rgexp="q001"] .rgqf'); await wait(p, 300); await p.keyboard.type('!'); await p.tap('.rgrow[data-rgexp="q002"] .rgqf'); await wait(p, 900);
  const a1 = await st(p, 'q001'), a2 = await st(p, 'q002');
  ok(a1.fold && !a1.inp && /!$/.test(a1.v) && a2.inp, '휴대폰: 다른 줄 설명을 톡 → 앞 줄 접힘 · 누른 줄 입력 칸', { a1, a2 });
  // 휴대폰 — 자판의 완료(Enter)
  await p.keyboard.type('?'); await p.keyboard.press('Enter'); await wait(p, 900); const a3 = await st(p, 'q002');
  ok(a3.fold && !a3.inp && /\?$/.test(a3.v.split('\n').pop()), '휴대폰: 자판 완료(Enter) → 저장하고 접힘', a3);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰: 가로 넘침 없음');
  console.log(bad ? `❌ tRGDESC2 실패 ${bad}` : '✓ tRGDESC2 통과');
}, { vp: { width: 390, height: 900 }, touch: true }));
