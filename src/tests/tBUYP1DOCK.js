// tBUYP1DOCK — (buyp1 11/20 · buyp0 남은 것) 좁은 화면(약 420px)에서 👁 살핀 상품 패널이 상품 카드의 💰 매입가 칸을 덮던 것
//   → 폭 600px 이하·끌어 옮긴 자리가 없으면 패널을 바닥에 붙이고(가로 꽉 · 높이 42% 안) 화면(#sheet)을 그 위까지만 · ☰ 단추도 패널 위로
//   ① 📋 한눈에·🔎 자세히 모두 — 맨 아래 카드까지 내려도 💰 칸이 패널과 겹치지 않고 그 자리를 누르면 💰 칸이 잡힘
//   ② 접으면(머리줄만) 줄인 높이도 따라 줄어듦 · 아이콘이면 바닥 붙임 없음 ③ 머리줄을 끌면 예전처럼 떠서 그 자리 기억 ④ 넓은 화면은 예전 그대로(오른쪽 아래 떠 있음)
//  쓰는 법: cd pw && RN_PORT=<포트> [RN_SHOT=<그림 앞이름>] node tBUYP1DOCK.js   (시험 자료는 지어낸 값 — 손님 정보 없음)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const SHOT = process.env.RN_SHOT || '';
require('./harness.js')(async (p) => { let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.dismiss().catch(() => {}); });
  const ev = (f, a) => p.evaluate(f, a); const wait = (ms) => p.waitForTimeout(ms);
  await ev(async () => { const FS = window.__FS; const now = new Date().toISOString(); S.regItems = S.regItems || new Map(); S.plist = S.plist || new Map(); S.pmatch = S.pmatch || new Map(); S.pmatchLoaded = true; FS.reg_items = FS.reg_items || {};
    for (let i = 0; i < 6; i++) { const x = { stage: 'sel', isbn: '978891000020' + i, q: '978891000020' + i, method: 'bulk', grade: 2, qty: 1, price: 5000 + i * 100, createdAt: now, info: { title: '바닥 시험 책 ' + i, isbn13: '978891000020' + i, priceList: 15000, priceSales: 13500, page1: [], categories: ['국내도서'], at: now } }; FS.reg_items['d' + i] = JSON.parse(JSON.stringify(x)); S.regItems.set('d' + i, { ...x, id: 'd' + i }); }
    S.regChk = new Set(); ['rn-seenp-pos:reg', 'rn-seenp-fold:reg', 'rn-seenp-ipos:reg'].forEach((k) => localStorage.removeItem(k)); localStorage.setItem('rn-reg-view', 'compact'); S.regT = 'sel'; openRegister(); await new Promise((r) => setTimeout(r, 1800)); });
  const st = () => ev(() => { const sp = document.getElementById('seenp'); const sh = document.getElementById('sheet'); const f = document.getElementById('rnfab'); const R = sp.getBoundingClientRect(), H = sh.getBoundingClientRect(), F = f && f.getBoundingClientRect();
    return { dock: sp.classList.contains('dock'), cls: sp.className, sp: [R.left, R.top, R.right, R.bottom].map(Math.round), shB: Math.round(H.bottom), fabB: F && F.width ? Math.round(F.bottom) : null, html: document.documentElement.classList.contains('seenp-dock'), w: innerWidth, h: innerHeight }; });
  const chips = (where) => ev((where) => { const sh = document.getElementById('sheet'); const sp = document.getElementById('seenp').getBoundingClientRect(); const L = [...document.querySelectorAll('#sheet [data-buypc]')].filter((c) => c.offsetParent); if (!L.length) return { n: 0 };
    const out = []; for (const c of where === 'end' ? [L[L.length - 1]] : L) { const r = c.getBoundingClientRect(); const vis = r.bottom > 0 && r.top < sh.getBoundingClientRect().bottom; if (!vis) continue; const ov = !(r.right <= sp.left + 1 || r.left >= sp.right - 1 || r.bottom <= sp.top + 1 || r.top >= sp.bottom - 1); /* 소수점 1px 안은 겹침 아님 */ const x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); out.push({ id: c.dataset.buypc, ov, hit: !!(t && t.closest('[data-buypc]') === c), b: Math.round(r.bottom) }); }
    return { n: L.length, out, spTop: Math.round(sp.top) }; }, where);
  for (const view of ['compact', 'full']) { const nm = view === 'compact' ? '📋 한눈에' : '🔎 자세히';
    await ev((v) => { localStorage.setItem('rn-reg-view', v); S._regOpen = new Set(); regRerender(); }, view); await wait(800);
    const s = await st(); ok(s.dock && s.html && s.sp[0] === 0 && s.sp[2] === s.w && s.sp[3] === s.h, `${nm} — 420px: 패널이 바닥에 붙음(가로 꽉)`, s);
    ok(Math.abs(s.shB - s.sp[1]) <= 1, `${nm} — 화면(#sheet)은 패널 위까지만`, s); ok(s.sp[3] - s.sp[1] <= Math.ceil(s.h * 0.42) + 1, `${nm} — 패널 높이 42% 안`, s); ok(s.fabB == null || s.fabB <= s.sp[1], `${nm} — ☰ 단추가 패널 위`, s);
    await ev(() => { const L = [...document.querySelectorAll('#sheet [data-buypc]')].filter((c) => c.offsetParent); L[L.length - 1].scrollIntoView({ block: 'end' }); }); await wait(500); await ev(() => { const L = [...document.querySelectorAll('#sheet [data-buypc]')].filter((c) => c.offsetParent); L[L.length - 1].scrollIntoView({ block: 'end' }); }); /* 맨 아래 카드의 💰 칸을 보이는 곳 맨 아래로(자세히 보기는 그리고 난 뒤 높이가 바뀌어 한 번 더) */ const e = await chips('end'); ok(e.n >= 1 && e.out.length === 1 && !e.out[0].ov && e.out[0].hit && e.out[0].b <= e.spTop, `${nm} — 맨 아래 카드 💰 칸을 화면 맨 아래로 내려도 패널 밖 · 눌림`, e);
    await ev(() => { const sh = document.getElementById('sheet'); const L = [...document.querySelectorAll('#sheet [data-buypc]')].filter((c) => c.offsetParent); if (L[1]) { const r = L[1].getBoundingClientRect(); sh.scrollTop += r.top - (sh.getBoundingClientRect().bottom - 30); } }); await wait(300); /* 카드 💰 칸을 화면 맨 아래 가장자리로 */
    const a = await chips('all'); ok(a.out.length >= 1 && a.out.every((x) => !x.ov && x.hit), `${nm} — 보이는 💰 칸 모두 패널과 겹치지 않고 눌림`, a);
    if (SHOT) await p.screenshot({ path: `${SHOT}_${view}.png` }); }
  console.log('— 접기·아이콘·끌기');
  await ev(() => { seenSetMode('fold'); seenDraw(); }); await wait(400); { const s = await st(); ok(s.dock && s.sp[3] - s.sp[1] < 60 && Math.abs(s.shB - s.sp[1]) <= 1, '접으면 머리줄만 · 화면도 그만큼만 줄임', s); if (SHOT) await p.screenshot({ path: `${SHOT}_fold.png` }); }
  await ev(() => { seenSetMode('ico'); seenDraw(); }); await wait(400); { const s = await st(); ok(!s.dock && !s.html && s.shB === s.h, '아이콘이면 바닥 붙임 없음(화면 그대로)', s); }
  await ev(() => { seenSetMode('open'); seenDraw(); }); await wait(400); { const s = await st(); ok(s.dock && s.html, '다시 펼치면 바닥 붙임', s); }
  { const h = await ev(() => { const r = document.querySelector('#seenp .seenp-ttl, #seenp .seenp-h b').getBoundingClientRect(); return { x: r.left + 4, y: r.top + r.height / 2 }; });
    await p.mouse.move(h.x, h.y); await p.mouse.down(); await p.mouse.move(h.x + 10, h.y - 120, { steps: 6 }); await p.mouse.move(h.x + 20, h.y - 260, { steps: 6 }); await p.mouse.up(); await wait(400);
    const s = await st(); const pos = await ev(() => localStorage.getItem('rn-seenp-pos:reg')); ok(!s.dock && !s.html && s.shB === s.h && s.sp[2] - s.sp[0] <= 302 && !!pos, '머리줄을 끌면 떠서 옮김 · 자리 기억 · 화면 줄임 풀림', { s, pos });
    await ev(() => { seenDraw(); }); await wait(300); const s2 = await st(); ok(!s2.dock, '기억한 자리가 있으면 다시 그려도 떠 있음', s2); }
  await ev(() => { localStorage.removeItem('rn-seenp-pos:reg'); seenDraw(); }); await wait(300); { const s = await st(); ok(s.dock, '기억한 자리를 지우면 다시 바닥', s); }
  console.log('— 넓은 화면은 예전 그대로');
  await p.setViewportSize({ width: 1400, height: 900 }); await wait(500); { const s = await st(); ok(!s.dock && !s.html && s.sp[2] === 1388 && s.shB === s.h, '1400px — 오른쪽 아래에 떠 있음 · 화면 줄임 없음', s); }
  await p.setViewportSize({ width: 420, height: 860 }); await wait(500); { const s = await st(); ok(s.dock && s.html, '창을 다시 좁히면 바닥', s); }
  ok(dialogs === 0, '브라우저 팝업 없음', dialogs);
  console.log(bad ? `✗ tBUYP1DOCK 실패 ${bad}` : '✓ tBUYP1DOCK 모두 통과');
}, { vp: { width: 420, height: 860 } });
