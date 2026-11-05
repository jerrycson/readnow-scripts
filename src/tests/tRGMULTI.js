// tRGMULTI — 정범님 11/05 밤: 📋 한눈에 카드 설명(⚡ 간단·✍ 여러 줄 직접 입력)을 누르면 고치는 동안만 제자리 여러 줄 칸(textarea)
//  줄바꿈 그대로(저장도) · 고치는 동안만 줄이 높아짐(줄 수만큼 · 최대 높이 넘으면 칸 안에서 굴림) · Enter = 줄바꿈 · Ctrl+Enter·Esc·바깥 누름 = 저장하고 한 줄로 접힘 · 자세히로 열지 않음
//  돌리기: RN_PORT=<포트> node tRGMULTI.js   (PC 1400 · 휴대폰 390)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const H = require('./harness.js'); const wait = (p, ms) => p.waitForTimeout(ms);
const seedRows = async (p) => { await p.evaluate(require('./seed.js')); await wait(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); const mk = (id, o) => ({ stage: 'sel', isbn: '979110000' + id.slice(-4), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: t, info: { title: '여러 줄 책 ' + id, isbn13: '979110000' + id.slice(-4), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t }, ...o });
    const L = { m001: mk('m001', { descMode: 'manual', descEdit: '직접 쓴 첫 줄\n둘째 줄\n셋째 줄', desc: '직접 쓴 첫 줄\n둘째 줄\n셋째 줄' }), q002: mk('q002', { descMode: 'quick', descQuick: '한 줄 설명' }), q003: mk('q003', { descMode: 'quick', descQuick: Array.from({ length: 40 }, (_, i) => `${i + 1}번째 줄`).join('\n') }), m004: mk('m004', { descMode: 'manual', descEdit: '' }) };
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-rgq-mode', 'pc'); localStorage.setItem('rn-rgq-pc', JSON.stringify({ ph: [], min: 3 })); localStorage.setItem('rn-reg-view', 'compact'); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); });
  await wait(p, 1500); await p.addStyleTag({ content: '.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' }); };
const st = (p, id) => p.evaluate((id) => { const r = document.querySelector(`.rgrow[data-rgexp="${id}"]`); const ta = r.querySelector('textarea.rgq-in'); const d = window.__FS.reg_items[id] || {}; const t = r.querySelector('.rgqf-t');
  return { ta: !!ta, inp: !!r.querySelector('.rgq-in'), fold: !!r.querySelector('.rgqf'), foc: !!(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.rgq === id), taV: ta ? ta.value : null, taH: ta ? Math.round(ta.getBoundingClientRect().height) : 0, taSc: ta ? ta.scrollHeight > ta.clientHeight + 2 && getComputedStyle(ta).overflowY === 'auto' : false, rowH: Math.round(r.getBoundingClientRect().height), v: d.descMode === 'quick' ? d.descQuick : d.descEdit, desc: d.desc, exp: [...(S._regOpen || [])], det: !!document.querySelector('.card[data-rglkid], .rgcard-open'), one: t ? (() => { const cs = getComputedStyle(t); return Math.round((t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight)) === 1 && cs.whiteSpace === 'nowrap'; })() : null, vw: innerWidth, sw: document.documentElement.scrollWidth }; }, id);
const run = (mob) => async (p) => { console.log(mob ? '── 휴대폰 390' : '── PC 1400'); await seedRows(p);
  const tap = (sel) => (mob ? p.tap(sel) : p.click(sel)); const out = () => (mob ? p.tap('.rgtools') : p.mouse.click(700, 5));
  const h0 = (await st(p, 'm001')).rowH;
  // ① 여러 줄 직접 입력 → 제자리 여러 줄 칸 · 줄바꿈 그대로 보임 · 자세히 안 열림 · 줄이 높아짐
  await tap('.rgrow[data-rgexp="m001"] .rgqf'); await wait(p, 400); let s = await st(p, 'm001');
  ok(s.ta && s.foc && s.taV === '직접 쓴 첫 줄\n둘째 줄\n셋째 줄' && !s.exp.length, '여러 줄 직접 입력을 누르면 제자리 여러 줄 칸(커서) · 줄바꿈 그대로 · 자세히 안 열림', s);
  ok(s.taH >= 40 && s.rowH > h0, `고치는 동안만 줄이 높아짐 (칸 ${s.taH}px · 줄 ${h0} → ${s.rowH}px)`, s);
  // ② Enter = 줄바꿈(접히지 않음) · 칸이 더 높아짐
  const hA = s.taH; await p.keyboard.press('Control+End'); await p.keyboard.press('Enter'); await p.keyboard.type('넷째 줄 더함'); await wait(p, 300); s = await st(p, 'm001');
  ok(s.ta && s.foc && /셋째 줄\n넷째 줄 더함$/.test(s.taV) && s.taH > hA, `Enter = 줄바꿈 · 칸 그대로 · 줄 수만큼 높아짐 (${hA} → ${s.taH}px)`, s);
  // ③ Ctrl+Enter(휴대폰은 바깥 톡) → 줄바꿈 그대로 저장 · descEdit·desc 같이 · 한 줄로 접힘 · 줄 높이 돌아옴
  if (mob) await out(); else await p.keyboard.press('Control+Enter'); await wait(p, 1000); s = await st(p, 'm001');
  ok(s.fold && !s.inp && s.v === '직접 쓴 첫 줄\n둘째 줄\n셋째 줄\n넷째 줄 더함' && s.desc === s.v, `${mob ? '바깥 톡' : 'Ctrl+Enter'} → 줄바꿈 그대로 저장(descEdit·desc 같은 방식) · 접힘`, s);
  ok(s.one && Math.abs(s.rowH - h0) <= 2 && !s.exp.length, `접힌 뒤 다시 한 줄(…) · 줄 높이 처음대로 (${h0} → ${s.rowH}px)`, s);
  // ④ ⚡ 간단 설명도 여러 줄로 · Esc(PC)/바깥 톡 → 저장
  await tap('.rgrow[data-rgexp="q002"] .rgqf'); await wait(p, 400); await p.keyboard.press('Control+End'); await p.keyboard.press('Enter'); await p.keyboard.type('둘째 줄'); if (mob) await out(); else await p.keyboard.press('Escape'); await wait(p, 1000); s = await st(p, 'q002');
  ok(s.fold && !s.inp && s.v === '한 줄 설명\n둘째 줄' && (await p.evaluate(() => !!(S.detail && S.detail.reg))), `⚡ 설명도 줄바꿈 그대로 저장 · ${mob ? '바깥 톡' : 'Esc'} → 접힘(등록 화면 그대로)`, s);
  // ⑤ 아주 긴 글(40줄) — 최대 높이에서 멈추고 칸 안에서 굴림 · 열었다 닫기만 하면 글 그대로
  await tap('.rgrow[data-rgexp="q003"] .rgqf'); await wait(p, 400); s = await st(p, 'q003'); const vh = await p.evaluate(() => innerHeight);
  ok(s.ta && s.taH <= Math.min(262, vh * 0.45 + 2) && s.taSc && s.taV.split('\n').length === 40, `40줄 글: 칸 높이 ${s.taH}px에서 멈춤(최대 260px·화면 45%) · 칸 안에서 굴림 · 40줄 그대로`, s);
  await out(); await wait(p, 900); s = await st(p, 'q003'); ok(s.fold && s.v.split('\n').length === 40, '고치지 않고 나가면 40줄 글 그대로(줄바꿈 안 지워짐)', s);
  // ⑥ 빈 직접 입력 → 두 줄 입력 → 바깥 → 저장
  await tap('.rgrow[data-rgexp="m004"] .rgqf'); await wait(p, 400); await p.keyboard.type('가'); await p.keyboard.press('Enter'); await p.keyboard.type('나'); await out(); await wait(p, 1000); s = await st(p, 'm004');
  ok(s.fold && s.v === '가\n나' && s.desc === '가\n나' && !s.exp.length, '빈 직접 입력: 두 줄 입력 → 바깥 누름 → 줄바꿈 그대로 저장 · 접힘', s);
  ok(!(await p.evaluate(() => document.querySelectorAll('.rgrow .rgq-in').length)) && s.sw <= s.vw + 1, '끝: 열린 칸 없음 · 가로 넘침 없음', s);
};
H(run(false)).then(() => H(run(true), { vp: { width: 390, height: 900 }, touch: true })).then(() => console.log(bad ? `❌ tRGMULTI 실패 ${bad}` : '✓ tRGMULTI 통과'));
