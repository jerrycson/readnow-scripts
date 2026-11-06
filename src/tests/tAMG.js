// tAMG — 정범님 11/06: 🌅 아침 인사말(웹앱을 그날 처음 열 때 · 기기마다 하루 한 번 · 한국 날짜 · 10가지 무작위) + 📅 출고별 매출 머리 띠 열림 상태(늘 닫힌 채로 시작 · 상태 기억)
//  ① 하루 한 번(한국 날짜 — 기기 시간대와 상관없이) · 다음 날 다시 · 끄기 · 몇 시까지 · 축하·응원이 떠 있으면 기다림
//  ② 닫기: ✕ · 바깥 누르기 · Esc · 몇 초 뒤 저절로 · 안쪽 누르기는 안 닫힘
//  ③ 10가지 모두 그려짐(문구·그림 다름 · 사람 이름 없음) · 설정 화면(켜기·띄우는 때·닫힘·그림·다시 보기·장면 단추) · 이 기기 저장
//  ④ 휴대폰 360px · PC 넘침 없음 · 움직임 줄이기면 정지 화면(글이 바로 다 보임)
//  ⑤ 출고별 매출 띠: 기본 닫힌 채로 시작(지난번 펼쳐 둔 기기도) · ② 기억이면 펼친 채로 · 설정 단추로 바꿈
// 쓰는 법: RN_PORT=<포트> node tAMG.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, doneC = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
const reopen = async (p) => p.evaluate(() => { S.sec = JSON.parse(localStorage.getItem('rn-sec') || '{}'); sdOpenInit(); }); /* 웹앱을 다시 연 것처럼 — 시작 때와 같은 줄(rn-sec 읽기 → sdOpenInit) */
(async () => {
  // ━━ A. PC — 하루 한 번 · 닫기 · 설정 · 10가지
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-06T07:40:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; S.user = S.user || { email: 'tester@x' };
      ['rn-amg', 'rn-amg-seen', 'rn-amg-last'].forEach((k) => localStorage.removeItem(k)); const shown = () => document.getElementById('amg');
      o.autoOff = amgBoot('open') === false && !shown(); /* 자동 시험 브라우저는 저절로 안 뜸 */ window.__amgAuto = 1;
      o.first = amgBoot('open') && !!shown(); o.seen = localStorage.getItem('rn-amg-seen'); o.kick = shown() && shown().querySelector('.amg-k').textContent; amgClose(); await W(600);
      o.second = amgBoot('open') === false && !shown();
      /* 한국 날짜: 기기 시간대가 UTC여도 07:40 KST는 11/06 · 다음 날 */ localStorage.setItem('rn-amg-seen', '2026-11-05'); o.nextDay = amgBoot('vis') && !!shown(); amgClose(); await W(600);
      /* 끄기 */ localStorage.removeItem('rn-amg-seen'); amgPrefsSet({ ...amgPrefs(), off: true }); o.off = amgBoot() === false && !shown() && !localStorage.getItem('rn-amg-seen');
      /* 몇 시까지 — 7시 전만이면 07:40엔 안 뜨고 기록도 안 씀 · 8시 전이면 뜸 */ amgPrefsSet({ ...amgPrefs(), off: false, until: 7 }); o.until7 = amgBoot() === false && !localStorage.getItem('rn-amg-seen'); amgPrefsSet({ ...amgPrefs(), until: 8 }); o.until8 = amgBoot() && !!shown(); amgClose(); await W(600);
      /* 축하·응원이 떠 있으면 기다렸다가 */ localStorage.removeItem('rn-amg-seen'); S._rkfx = { el: null }; o.wait1 = amgBoot() === false && !shown(); S._rkfx = null; await W(3300); o.wait2 = !!shown(); amgClose(); await W(600);
      /* 닫기 — ✕ · 바깥 · Esc · 안쪽 누르기 · 저절로 */ amgPrefsSet({ ...amgPrefs(), sec: 0 });
      amgShow(0); await W(100); document.getElementById('amg_x').click(); await W(600); o.cX = !shown();
      amgShow(1); await W(100); const el = shown(); el.querySelector('.amg-h').click(); await W(300); o.inner = !!shown(); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); await W(600); o.cOut = !shown();
      amgShow(2); await W(100); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(600); o.cEsc = !shown();
      amgShow(3, { sec: 1 }); await W(400); o.bar = !!document.querySelector('#amg .amg-bar i'); await W(1300); o.cAuto = !shown();
      /* 10가지 */ o.n = AMG.length; o.ids = new Set(AMG.map((a) => a.id)).size; o.hs = new Set(AMG.map((a) => a.h)).size; o.ps = new Set(AMG.map((a) => a.p.join())).size; o.svgs = new Set(AMG.map((a) => a.svg)).size; o.scenes = [];
      for (let i = 0; i < AMG.length; i++) { amgShow(i, { sec: 0 }); await W(60); const e = shown(); const sv = e.querySelector('svg'); const b = sv.getBoundingClientRect(); o.scenes.push({ i, lines: e.querySelectorAll('.amg-ln').length, shapes: sv.querySelectorAll('*').length, w: Math.round(b.width), h: Math.round(b.height), anim: e.querySelectorAll('svg [class^="a-"]').length }); }
      { const e = shown(); o.cls = getComputedStyle(e).position + '/' + getComputedStyle(e.querySelector('.amg-ln')).animationName; o.notRkfx = !e.querySelector('.rkfx-c') && !e.classList.contains('rkfx'); } amgClose(); await W(600);
      /* 어제와 같은 장면 피함(무작위) */ { let same = 0; for (let k = 0; k < 60; k++) { localStorage.setItem('rn-amg-last', '4'); if (amgPickI() === 4) same++; } o.avoid = same; amgPrefsSet({ ...amgPrefs(), pick: 7 }); o.fixed = amgPickI(); amgPrefsSet({ ...amgPrefs(), pick: 'rand' }); }
      /* 설정 화면 */ uxTabGo('settings'); await W(400); const d = document.querySelector('details[data-sec="set_amg"]'); o.secAmg = !!d; d.open = true; d.dispatchEvent(new Event('toggle')); await W(400);
      o.setEls = ['#amg_on', '#amg_until', '#amg_sec', '#amg_pick', '#amg_again', '#amg_info'].map((s) => !!document.querySelector(s)); o.chips = document.querySelectorAll('[data-amgshow]').length;
      { const c = document.getElementById('amg_on'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); o.saveOff = amgPrefs().off === true; c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); const s = document.getElementById('amg_until'); s.value = '10'; s.dispatchEvent(new Event('change', { bubbles: true })); o.saveUntil = amgPrefs().until; const q = document.getElementById('amg_sec'); q.value = '30'; q.dispatchEvent(new Event('change', { bubbles: true })); o.saveSec = amgPrefs().sec; o.ls = localStorage.getItem('rn-amg'); }
      document.getElementById('amg_again').click(); await W(200); o.again = !!shown(); amgClose(); await W(600); document.querySelector('[data-amgshow="5"]').click(); await W(200); o.chip5 = shown() && shown().dataset.id; amgClose(); await W(600);
      o.secSd = !!document.querySelector('details[data-sec="set_sdopen"]'); o.feat = featIndex().filter((f) => /아침 인사말|출고별 매출 머리 띠 열림/.test(f.t)).length; o.guide = !!(PAGE_GUIDES.set_amg && PAGE_GUIDES.set_sdopen);
      o.allTxt = AMG.map((a) => a.h + a.p.join('')).join('|'); return o; });
    ok(r.autoOff, '자동 시험 브라우저에서는 저절로 안 뜸(다른 시험을 가리지 않게)');
    ok(r.first && r.seen === '2026-11-06', '그날 처음 열 때 뜸 · 한국 날짜 기록 ' + r.seen); ok(/11월 6일 금요일 · 아침 인사/.test(r.kick || ''), '머리 글 ' + r.kick);
    ok(r.second, '같은 날 두 번째 열기는 안 뜸'); ok(r.nextDay, '다음 날(켜 둔 PC가 화면으로 돌아올 때 포함) 다시 뜸');
    ok(r.off, '끄면 안 뜸(기록도 안 씀)'); ok(r.until7 && r.until8, '몇 시까지 — 정한 시각 뒤엔 안 뜨고 기록 안 씀 · 전이면 뜸');
    ok(r.wait1 && r.wait2, '축하·응원이 떠 있으면 닫힌 뒤에 뜸');
    ok(r.cX && r.inner && r.cOut && r.cEsc && r.cAuto && r.bar, `닫기 ✕ ${r.cX} · 안쪽 누르기는 그대로 ${r.inner} · 바깥 ${r.cOut} · Esc ${r.cEsc} · 저절로 ${r.cAuto}(남은 시간 막대 ${r.bar})`);
    ok(r.n === 10 && r.ids === 10 && r.hs === 10 && r.ps === 10 && r.svgs === 10, `10가지 — 이름 ${r.ids} · 큰 글 ${r.hs} · 말 ${r.ps} · 그림 ${r.svgs}`);
    ok(r.scenes.every((s) => s.lines >= 4 && s.shapes >= 8 && s.w > 300 && s.h > 150 && s.anim >= 1), '10가지 모두 그려짐(글 한 줄씩 · 그림 · 움직임) ' + JSON.stringify(r.scenes.map((s) => [s.i, s.lines, s.shapes, s.w, s.anim])));
    ok(/fixed\/amgLine/.test(r.cls) && r.notRkfx, '축하·응원 카드와 다른 꼴(흰 카드 없음 · 글이 한 줄씩) ' + r.cls);
    ok(r.avoid === 0 && r.fixed === 7, `무작위는 어제 장면을 피함(같음 ${r.avoid}/60) · 고정 그림 ${r.fixed}`);
    ok(!/손님A|010-|님께서|\b[가-힣]{2,3}님\b/.test(r.allTxt.replace(/손님/g, '')), '문구에 사람 이름·전화 없음');
    ok(r.secAmg && r.setEls.every(Boolean) && r.chips === 11, '⚙ 설정 › 🌅 아침 인사말 — 켜기·띄우는 때·닫힘·그림·다시 보기·장면 단추 10 ' + JSON.stringify(r.setEls) + ' ' + r.chips);
    ok(r.saveOff && r.saveUntil === 10 && r.saveSec === 30 && /"until":10/.test(r.ls || ''), '설정은 이 기기에 저장(rn-amg) ' + r.ls);
    ok(r.again && r.chip5 === 'shelf', '다시 보기 · 장면 단추 ' + r.chip5); ok(r.secSd && r.feat >= 2 && r.guide, `📅 열림 설정 칸 · 🔍 기능 찾기 ${r.feat} · 화면 설명서`);
  });
  // ━━ B. 휴대폰 360px · 움직임 줄이기
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-06T09:10:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    const m = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { L: [] }; for (let i = 0; i < AMG.length; i++) { amgShow(i, { sec: 0 }); await W(80); const st = document.getElementById('amg_st').getBoundingClientRect(); const x = document.getElementById('amg_x').getBoundingClientRect(); const h = document.querySelector('#amg .amg-h'); o.L.push({ i, l: Math.round(st.left), r: Math.round(st.right), xr: Math.round(x.right), xt: Math.round(x.top), xw: Math.round(x.width), fs: parseFloat(getComputedStyle(h).fontSize), sw: document.documentElement.scrollWidth }); } amgClose(); await W(600); return o; });
    ok(m.L.every((x) => x.l >= 8 && x.r <= 352 && x.xr <= 360 && x.xt >= 0 && x.xw >= 36 && x.sw <= 360 && x.fs >= 20), '휴대폰 360px — 넘침 없음 · 닫기 단추 손가락 크기 · 큰 글 읽힘 ' + JSON.stringify(m.L.slice(0, 3)));
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const s = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); amgShow(0, { sec: 0 }); await W(60); const e = document.getElementById('amg'); const ln = [...e.querySelectorAll('.amg-ln')]; const o = { still: e.classList.contains('still'), op: ln.map((x) => getComputedStyle(x).opacity), an: getComputedStyle(e.querySelector('.a-rise')).animationName, dawn: getComputedStyle(e.querySelector('.amg-dawn')).display }; amgClose(); return o; });
    ok(s.still && s.op.every((x) => x === '1') && s.an === 'none' && s.dawn === 'none', '움직임 줄이기면 정지 화면(글 바로 다 보임 · 움직임 없음) ' + JSON.stringify(s));
  }, { vp: { width: 360, height: 740 }, touch: true });
  // ━━ C. 출고별 매출 머리 띠 열림 상태
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    await p.evaluate(() => { localStorage.removeItem('rn-sd-open'); S.sec.o_shipday = true; localStorage.setItem('rn-sec', JSON.stringify(S.sec)); }); await reopen(p);
    const a = await p.evaluate(async () => ({ mode: sdOpenMode(), open: !!S.sec.o_shipday }));
    ok(a.mode === 'closed' && a.open === false, '기본 ① 늘 닫힌 채로 시작 — 지난번 펼쳐 둔 기기도 닫힌 채 ' + JSON.stringify(a));
    const b = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); uxTabGo('settings'); let d = null; for (let i = 0; i < 40 && !(d = document.querySelector('details[data-sec="set_sdopen"]')); i++) await W(150); if (!d) return { err: 'no set_sdopen · tab ' + S.tab }; d.open = true; d.dispatchEvent(new Event('toggle')); await W(400); const k = document.querySelector('[data-sdopen="keep"]'); const c = document.querySelector('[data-sdopen="closed"]'); const o = { def: c && c.checked }; k.checked = true; k.dispatchEvent(new Event('change', { bubbles: true })); o.ls = localStorage.getItem('rn-sd-open'); S.sec.o_shipday = true; localStorage.setItem('rn-sec', JSON.stringify(S.sec)); return o; });
    ok(b.def && b.ls === 'keep', '설정 ② 열고 닫은 상태 기억 고르면 이 기기에 저장 ' + JSON.stringify(b)); await reopen(p);
    const c = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { open: !!S.sec.o_shipday }; S.ordersLoaded = true; uxTabGo('orders'); for (let i = 0; i < 30 && !document.getElementById('sdbar'); i++) await W(150); const bb = document.getElementById('sdbar'); o.aria = bb && bb.getAttribute('aria-expanded'); if (bb) { bb.click(); await W(300); } o.after = !!S.sec.o_shipday; o.saved = JSON.parse(localStorage.getItem('rn-sec') || '{}').o_shipday; return o; });
    ok(c.open === true && c.aria === 'true', '② 기억 — 펼쳐 둔 채로 다시 열면 펼친 채 ' + JSON.stringify(c)); await reopen(p);
    const d = await p.evaluate(async () => { const o = { open: !!S.sec.o_shipday }; localStorage.removeItem('rn-sd-open'); return o; }); ok(c.after === false && d.open === false, '② 기억 — 접어 두면 다음에도 접힌 채 ' + JSON.stringify(d)); doneC = 1;
  });
  ok(doneC, 'C(출고별 매출 띠) 끝까지 돎'); console.log(bad ? `❌ ${bad}개 실패` : '✓ tAMG 모두 통과'); process.exit(bad ? 1 : 0);
})();
