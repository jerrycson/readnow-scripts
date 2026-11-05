// (11/05 15시 정범님 '설명은 오른쪽 둘째 줄 · 높이는 예전 그대로'로 자리 기준을 바꿈 — PC: 설명 칸 = 오른쪽 기능 칸(등록 부류~단계) 아래 · 그 폭만 / 휴대폰: 예전처럼 아래 줄 폭 전체 · 자세한 흐름은 tRGDESC2)
// tRGDESC — 정범님 11/05: 📋 한눈에 줄 설명 칸이 '자동으로 접히지 않음' → 평소 2줄(설정)로 접고 · 설명 칸을 등록 부류·상태·가격·수량·코드 줄 아래 줄에 따로(줄 폭 전체 · 휴대폰도)
//  · 누르면 입력 · Tab/Esc/바깥 누름이면 저장하고 접힘 · 남은 '열림 표시'로 다시 그려도 열린 채 남지 않음 · ⚡ 설명 단추 → 바로 입력 칸 · 스크린샷 크기·줄 수 확인
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const fs = require('fs'); const SP = process.env.RN_SHOT || require('os').tmpdir() + '/';
const H = require('./harness.js');
const seedRows = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); const mk = (id, o) => ({ stage: 'sel', isbn: '979110000' + id.slice(-4), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: t, info: { title: '설명 책 ' + id, isbn13: '979110000' + id.slice(-4), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t }, ...o });
    const long = Array.from({ length: 14 }, (_, i) => `${i + 1}번째 줄 — 띠지 없음 · 모서리 약간 눌림`).join('\n');
    const L = { q001: mk('q001', { descMode: 'quick', descQuick: '깨끗함 · 밑줄 없음' }), q002: mk('q002', { descMode: 'quick', descQuick: long }), q003: mk('q003', { descMode: 'quick', descQuick: '' }), m004: mk('m004', { descMode: 'manual', descEdit: '직접 쓴 설명 첫 줄\n둘째 줄\n셋째 줄\n넷째 줄' }), n005: mk('n005', {}), q006: mk('q006', { descMode: 'quick', descQuick: Array.from({ length: 30 }, (_, i) => `${i + 1}번째 문장 띠지 없음`).join(' ') }),
      b007: mk('b007', { descMode: 'quick', descQuick: '매입 띠가 있는 줄의 설명', price: 4300, info: { title: '매입 띠 책', isbn13: '9791100000007', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t, buyback: { 상: 3800 } } }) };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-reg-view', 'compact'); localStorage.removeItem('rn-reg-qfl'); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1500); await p.addStyleTag({ content: '.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' }); };
// 줄마다: 설명 칸이 위 줄(제목·등록 부류 등)보다 아래인지 · 폭 · 보이는 줄 수 · 넘침
const geo = (p) => p.evaluate(() => [...document.querySelectorAll('.rgrow')].map((r) => { const R = r.getBoundingClientRect(); const q = r.querySelector(':scope > .rgr-q, :scope > .rgr-qw'); const m = r.querySelector('.rgr-m'), tt = r.querySelector('.rgr-t'), s = r.querySelector('.rgr-s'), bb = r.querySelector('.rgbbn'); const Q = q && q.getBoundingClientRect(); const mob = innerWidth <= 700; const M = m.getBoundingClientRect(), T = tt.getBoundingClientRect(), Sx = s.getBoundingClientRect(); const t = r.querySelector('.rgqf-t'); const lh = t ? parseFloat(getComputedStyle(t).lineHeight) : 0; const pad = t ? parseFloat(getComputedStyle(t).paddingTop) + parseFloat(getComputedStyle(t).paddingBottom) + 2 : 0;
  return { id: r.dataset.rgexp, below: !!Q && Q.top >= Math.max(M.bottom, Sx.bottom, mob ? T.bottom : -1e9) - 1, wide: !!Q && (mob ? Q.width >= R.width - 40 : Q.left >= T.right - 1 && Q.right >= Sx.right - 2 && Q.left <= M.left + 2), line1: Math.abs(m.getBoundingClientRect().top - tt.getBoundingClientRect().top) < 60, lines: t ? Math.round((t.clientHeight - pad + 2) / lh) : null, over: t ? t.scrollHeight > t.clientHeight + 2 : null, bbBelow: bb ? bb.getBoundingClientRect().top >= Q.bottom - 1 : null, h: Math.round(R.height), inp: !!r.querySelector('.rgq-in') }; }));
const shot = async (p, name) => { const box = await p.evaluate(() => { const a = document.querySelectorAll('.rgrow'); a[0].scrollIntoView(); const r1 = a[0].getBoundingClientRect(), r2 = a[a.length - 1].getBoundingClientRect(); const y = Math.max(0, r1.top - 6); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight - y, r2.bottom - r1.top + 12) }; }); await p.screenshot({ path: SP + name, clip: box }); const b = fs.readFileSync(SP + name); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), box }; };
const G = (L, id) => L.find((x) => x.id === id) || {};
H(async (p) => { await seedRows(p);
  // ① 접힘 — 기본 2줄 · 짧은 글은 1줄 · 긴 글(줄 바꿈 14줄·한 문단 30문장)·직접 입력 4줄 모두 2줄로 줄임(…)
  let L = await geo(p);
  ok(G(L, 'q001').lines === 1 && !G(L, 'q001').over, '짧은 ⚡ 설명은 한 줄 그대로', G(L, 'q001'));
  ok(['q002', 'q006', 'm004'].every((id) => G(L, id).lines === 2 && G(L, id).over), '긴 ⚡ 설명(줄 바꿈 14줄 · 긴 문단)·✍ 직접 입력(4줄)은 기본 2줄로 접힘(넘치면 …)', L.filter((x) => /q002|q006|m004/.test(x.id)));
  ok(G(L, 'q003').lines === 1 && G(L, 'q003').below, '빈 ⚡ 설명도 오른쪽 둘째 줄에 접힌 칸(⚡ 설명 — 눌러서 입력)', G(L, 'q003'));
  // ② 자리 — 설명 칸 = 등록 부류·상태·가격·수량·코드 줄 아래 · 줄 폭 전체 · 위 줄 배치 그대로 · 🏷 매입 띠는 설명 아래
  ok(L.every((x) => x.below && x.line1), '모든 줄: 설명 칸(또는 ⚡ 설명 단추)이 오른쪽 기능 첫 줄(등록 부류·상태·가격·수량·코드·단계) 아래 · 기능 첫 줄은 한 줄 그대로', L.map((x) => [x.id, x.below, x.line1]));
  ok(L.filter((x) => x.id !== 'n005').every((x) => x.wide), '설명 칸은 오른쪽 기능 칸 폭(제목 쪽으로 넘어가지 않음)', L.map((x) => [x.id, x.wide]));
  const b7 = G(L, 'b007'); ok(b7.bbBelow === null || b7.bbBelow === true, '🏷 알라딘 매입 띠가 있으면 설명 칸 아래(맨 밑)', b7);
  const s1 = await shot(p, 'gl3_rgdesc_1400.png'); ok(s1.w === 1400 && s1.h >= 500 && s1.h <= 900, `스크린샷 크기 ${s1.w}×${s1.h}`, s1);
  // ③ 마우스 올리면 전체 글
  await p.hover('.rgrow[data-rgexp="q002"] .rgqf'); await p.waitForTimeout(250);
  const tip = await p.evaluate(() => { const z = document.getElementById('rgqtip'); if (!z) return null; const r = z.getBoundingClientRect(); return { full: /14번째 줄/.test(z.textContent), inV: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; });
  ok(tip && tip.full && tip.inV, '마우스를 올리면 전체 글(14번째 줄까지) 겹침 상자 · 화면 안', tip);
  // ④ 누르면 입력 칸 · 자세히 안 열림 · Tab이면 저장하고 접힘
  await p.click('.rgrow[data-rgexp="q001"] .rgqf'); await p.waitForTimeout(250);
  const o1 = await p.evaluate(() => ({ foc: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === 'q001', exp: [...(S._regOpen || [])], tip: !!document.getElementById('rgqtip'), wide: (() => { const r = document.querySelector('.rgrow[data-rgexp="q001"]'); const w = r.querySelector('.rgq-in').closest('.rgr-q').getBoundingClientRect(); return w.left >= r.querySelector('.rgr-t').getBoundingClientRect().right - 1 && w.width >= 300; })() }));
  ok(o1.foc && !o1.exp.length && !o1.tip && o1.wide, '누르면 그 자리(오른쪽 둘째 줄)에서 입력 칸 · 커서 들어감 · 자세히 안 열림', o1);
  await p.keyboard.press('End'); await p.keyboard.type(' · 탭으로 나감'); await p.keyboard.press('Tab'); await p.waitForTimeout(1200);
  const o2 = await p.evaluate(() => ({ fold: !!document.querySelector('.rgrow[data-rgexp="q001"] .rgqf'), inp: !!document.querySelector('.rgrow[data-rgexp="q001"] .rgq-in'), v: (window.__FS.reg_items.q001 || {}).descQuick, open: S._rgqOpen }));
  ok(o2.fold && !o2.inp && o2.v === '깨끗함 · 밑줄 없음 · 탭으로 나감' && !o2.open, 'Tab으로 나가면 저장하고 바로 접힘', o2);
  // ⑤ 키보드 Enter로 열기 · Esc로 접기
  await p.focus('.rgrow[data-rgexp="q002"] .rgqf'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const k1 = await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="q002"] .rgq-in') && document.activeElement.dataset.rgq === 'q002');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const k2 = await p.evaluate(() => ({ fold: !!document.querySelector('.rgrow[data-rgexp="q002"] .rgqf'), reg: !!(S.detail && S.detail.reg), v: ((window.__FS.reg_items.q002 || {}).descQuick || '').split('\n').length }));
  ok(k1 && k2.fold && k2.reg && k2.v === 14, '접힌 칸에서 Enter = 입력 칸 · Esc = 접힘(등록 화면 그대로 · 글 그대로)', { k1, k2 });
  // ⑥ 바깥 누르기
  await p.click('.rgrow[data-rgexp="q006"] .rgqf'); await p.waitForTimeout(200); await p.mouse.click(700, 5); await p.waitForTimeout(600);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="q006"] .rgqf') && !document.querySelector('.rgq-in')), '바깥을 누르면 접힘');
  // ⑦ 열림 표시가 남은 채 다시 그려도 열린 채 남지 않음 · 입력 중 다시 그리기는 그대로 열림
  await p.waitForTimeout(4200); await p.evaluate(() => { S._regTyping = false; S._rgqOpen = 'q003'; S._rgqOpenAt = Date.now() - 60000; regRerender(); }); await p.waitForTimeout(700);
  const st = await p.evaluate(() => ({ inp: !!document.querySelector('.rgrow[data-rgexp="q003"] .rgq-in'), fold: !!document.querySelector('.rgrow[data-rgexp="q003"] .rgqf'), open: S._rgqOpen }));
  ok(!st.inp && st.fold && !st.open, "남은 열림 표시(S._rgqOpen)로 다시 그려도 접힌 칸 — 표시도 지움", st);
  await p.click('.rgrow[data-rgexp="q003"] .rgqf'); await p.waitForTimeout(250); await p.evaluate(() => { S._rgqOpenAt = 0; S._regTyping = false; regRerender(); }); await p.waitForTimeout(700);
  const st2 = await p.evaluate(() => ({ inp: !!document.querySelector('.rgrow[data-rgexp="q003"] .rgq-in') }));
  ok(st2.inp, '입력 칸에 커서가 있는 동안 다시 그려도 입력 칸 그대로', st2);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  // ⑧ 설정 — 설명 접기 ○줄 (이 기기 기억) · 4줄로 바꾸면 4줄
  const sel0 = await p.evaluate(() => { const s = document.querySelector('select[data-rgqfl]'); return s && s.value; });
  await p.selectOption('select[data-rgqfl]', '4'); await p.waitForTimeout(800); L = await geo(p);
  ok(sel0 === '2' && G(L, 'q002').lines === 4 && G(L, 'm004').lines === 4 && !G(L, 'm004').over && (await p.evaluate(() => localStorage.getItem('rn-reg-qfl'))) === '4', "도구 줄 '📝 설명 접기 [2]줄' → 4로 바꾸면 접힌 칸 4줄(4줄 직접 입력은 다 보임) · 이 기기에 기억", { sel0, q2: G(L, 'q002'), m4: G(L, 'm004') });
  await p.selectOption('select[data-rgqfl]', '2'); await p.waitForTimeout(800);
  // ⑨ 설명 없음 → ⚡ 설명 단추(아래 줄) → 누르면 바로 입력 칸
  await p.click('.rgrow[data-rgexp="n005"] [data-rgdm]'); await p.waitForTimeout(900);
  const nb = await p.evaluate(() => ({ foc: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === 'n005', mode: (window.__FS.reg_items.n005 || {}).descMode, exp: [...(S._regOpen || [])] }));
  ok(nb.foc && nb.mode === 'quick' && !nb.exp.length, '⚡ 설명 단추 → 바로 입력 칸(커서) · 자세히 안 열림', nb);
  await p.keyboard.type('새로 쓴 설명'); await p.mouse.click(700, 5); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => (window.__FS.reg_items.n005 || {}).descQuick === '새로 쓴 설명' && !!document.querySelector('.rgrow[data-rgexp="n005"] .rgqf')), '쓰고 바깥 누르면 저장 · 접힘');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '가로 넘침 없음(1400)');
  console.log(bad ? `  (PC 쪽 실패 ${bad})` : '  (PC 쪽 통과)');
}).then(() => H(async (p) => { await seedRows(p);
  const L = await geo(p);
  ok(L.every((x) => x.below), '휴대폰 폭(390): 설명 칸이 등록 부류·상태·가격 줄 아래', L.map((x) => [x.id, x.below]));
  ok(L.filter((x) => x.id !== 'n005').every((x) => x.wide), '휴대폰 폭: 설명 칸 줄 폭 전체', L.map((x) => [x.id, x.wide]));
  ok(['q002', 'q006', 'm004'].every((id) => G(L, id).lines === 2 && G(L, id).over), '휴대폰 폭: 긴 설명도 2줄로 접힘', L.map((x) => [x.id, x.lines]));
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 폭: 가로 넘침 없음');
  const s2 = await shot(p, 'gl3_rgdesc_390.png'); ok(s2.w === 390 && s2.h > 300, `휴대폰 스크린샷 크기 ${s2.w}×${s2.h}`, s2);
  await p.tap('.rgrow[data-rgexp="q002"] .rgqf'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.rgrow[data-rgexp="q002"] .rgq-in') && !document.getElementById('rgqtip')), '휴대폰: 톡 누르면 바로 입력 칸(겹침 상자 없음)');
  console.log(bad ? `❌ tRGDESC 실패 ${bad}` : '✓ tRGDESC 통과');
}, { vp: { width: 390, height: 900 }, touch: true }));
