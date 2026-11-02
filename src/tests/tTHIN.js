// tTHIN — 정범님 11/02 (늘 지킬 규칙): "새 탭·기능이 생기거나 기존 것이 개선되면 반드시 휴대폰에도 반영하고 고르기에도 선택지로 포함"
//  ① 탭마다 PC 화면에 보이는 카드·섹션(표시 단위)을 모으고, 휴대폰(얇게 모드)에서 📋 고르기 '☑ 모두 체크 → 고른 대로 보기'로 같은 탭을 그려 견줌
//     → PC에 있는데 휴대폰에서 켤 수 없는 것이 하나라도 있으면 ❌ '휴대폰 고르기에 없음: <탭> · <카드>'
//  ② 휴대폰 고르기 항목마다 그것 하나만 켜서 그림 → 오류 없이 무엇이든 보이는지(있을 때만 보이는 항목은 비어도 됨)
//  ③ 고르기 화면 자체가 없는 탭(홈·고객·주문·매출)은 PC와 휴대폰이 같은 카드를 그리는지
//  쓰는 법: RN_PORT=<포트> node tTHIN.js   (빠른 정적 검사는 release.js가 부르는 tools/thin-check.js)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const PORT = process.env.RN_PORT || 8765; let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8'); const seed = require('./seed.js');
const MOB = { viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' };
const PLAIN = ['home', 'search', 'orders']; const HEAD = ['settings', 'pending']; /* 머리줄 단추로 가는 화면(⚙ 설정·연결 확정)도 PC와 같게 */ /* 고르기 없이 휴대폰도 PC와 같은 화면(큰 자료 없음) — 정적 검사 tools/thin-check.js 의 PLAIN과 같게 */
const open = async (b, mob) => { const ctx = await b.newContext(mob ? MOB : { viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource|js-profiling/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
  await p.addInitScript(() => { try { localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} });
  await p.goto('http://localhost:' + PORT + '/app/index.html'); await p.waitForTimeout(2500); await p.evaluate(seed); await p.waitForTimeout(300);
  await p.evaluate(() => { /* 표시 단위 모으기: #main 바로 아래 카드 + 단추·카드를 여럿 담은 줄(정렬 줄·바로가기 줄·카드 격자)은 그 안의 하나하나 */
    window.__thinUnits = (tab) => { const m = document.querySelector('#main'); const out = new Map(); const X = (typeof THIN_X !== 'undefined' && THIN_X[tab]) || [];
      const skip = (el) => !el || /^(SCRIPT|STYLE|INPUT|SELECT|TEXTAREA|BR|HR)$/.test(el.tagName) || el.matches('.thinbar, .thinpick, p.hint, .hint') || X.some(([id, q]) => id == null && (el.matches(q) || el.querySelector(q)));
      const txt = (el) => { const h = el.querySelector(':scope > summary, :scope > h3, :scope > h2, :scope > b, h3, summary') || el; return (h.textContent || '').replace(/[\d,.%◐▸▾›·()\-—:/~+]|원|건|권|곳|명|개|\s/g, '').slice(0, 22); };
      const sig = (el) => (el.dataset.sec ? 'sec:' + el.dataset.sec : el.dataset.mkpg ? 'mkpg:' + el.dataset.mkpg : el.id && !/^(main|more)$/.test(el.id) ? '#' + el.id : txt(el));
      const add = (el) => { if (skip(el)) return; const k = sig(el); if (!k) return; if (!out.has(k)) out.set(k, (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)); };
      for (const c of m.children) { if (skip(c)) continue; const kids = [...c.children].filter((k) => !skip(k) && (k.matches('button, a, .card, details.sec, .mk-card, .pj-card, .allcard') )); if (kids.length >= 2 && !c.matches('details.sec')) kids.forEach(add); else add(c); }
      return out; };
    window.__thinGo = async (tab) => { S.tab = tab; S.detail = null; S.q = ''; S.limit = 30; renderTabs(); renderMainNow(); const W = (ms) => new Promise((r) => setTimeout(r, ms)); for (let i = 0; i < 20; i++) { await W(250); if (!(S.prodBusy || S.pmBusy || S.sellersBusy)) break; } renderMainNow(); await W(500); return /화면을 그리다 오류/.test(document.querySelector('#main').innerText); };
  });
  return { p, errs, ctx }; };
(async () => { const b = await chromium.launch(); const pc = await open(b, 0), ph = await open(b, 1);
  const info = await ph.p.evaluate(() => ({ thin: PHONE_THIN, tabs: [...document.querySelectorAll('#tabs [data-tab]')].map((x) => x.dataset.tab), sec: Object.fromEntries(Object.entries(THIN_SEC).map(([k, v]) => [k, v.secs.map((x) => [x[0], x[1], x[2] || ''])])) }));
  ok(info.thin, '휴대폰 흉내 = 얇게 모드(PHONE_THIN)');
  const pcTabs = await pc.p.evaluate(() => [...document.querySelectorAll('#tabs [data-tab]')].map((x) => x.dataset.tab)); ok(JSON.stringify(pcTabs) === JSON.stringify(info.tabs), '탭 줄이 PC·휴대폰 같음: ' + info.tabs.join(' · '));
  for (const t of info.tabs) ok(info.sec[t] || PLAIN.includes(t), `탭 '${t}' — 휴대폰 고르기(THIN_SEC)에 있거나 고르기 없이 그대로 보이는 탭(${PLAIN.join('·')})`);
  const miss = [];
  for (const tab of [...info.tabs, ...HEAD]) { const e1 = await pc.p.evaluate(async (t) => { const e = await __thinGo(t); return { e, u: [...__thinUnits(t)] }; }, tab);
    let e2; if (info.sec[tab]) { e2 = await ph.p.evaluate(async (t) => { localStorage.removeItem('rn-thin-sec'); S.thinPick = t; await __thinGo(t); const m = document.querySelector('#main'); const all = m.querySelector('#thsec_all'), sv = m.querySelector('#thsec_save'); if (!all || !sv) return { noPick: true };
        all.click(); sv.click(); S.thinPick = null; const e = await __thinGo(t); return { e, u: [...__thinUnits(t)], saved: (thinSelAll()[t] || []).length }; }, tab);
      if (e2.noPick) { ok(false, `${tab}: 휴대폰 고르기 화면(☑ 모두 체크·고른 대로 보기)이 없음`); continue; } ok(e2.saved === info.sec[tab].length, `${tab}: ☑ 모두 체크 → ${e2.saved}/${info.sec[tab].length}개 저장`); }
    else e2 = await ph.p.evaluate(async (t) => { const e = await __thinGo(t); return { e, u: [...__thinUnits(t)] }; }, tab);
    ok(!e1.e && !e2.e, `${tab}: 그리기 오류 없음(PC·휴대폰)`); const P2 = new Set(e2.u.map((x) => x[0])); const lost = e1.u.filter(([k]) => !P2.has(k)); lost.forEach(([k, t]) => miss.push(`${tab} · ${t || k}`));
    ok(!lost.length, `${tab}: PC 표시 단위 ${e1.u.length}개 → 휴대폰(모두 켬) ${e2.u.length}개${lost.length ? ' — 휴대폰 고르기에 없음: ' + lost.map(([k, t]) => t || k).join(' / ') : ' · 빠진 것 없음'}`); }
  /* ② 고르기 항목 하나씩 */ const dead = [];
  for (const [tab, L] of Object.entries(info.sec)) { for (const [id, nm, ds] of L) { const r = await ph.p.evaluate(async ([t, id]) => { localStorage.setItem('rn-thin-sec', JSON.stringify({ [t]: [id] })); S.thinPick = null; const e = await __thinGo(t); return { e, n: __thinUnits(t).size }; }, [tab, id]);
      if (r.e) { ok(false, `${tab} · ${nm}: 켜면 그리기 오류`); continue; } if (!r.n && !/있을 때만|있으면/.test(nm + ds)) dead.push(`${tab} · ${nm}`); } }
  ok(!dead.length, `고르기 항목마다 켜면 보임 (${Object.values(info.sec).reduce((a, l) => a + l.length, 0)}개)${dead.length ? ' — 켜도 아무것도 안 보임: ' + dead.join(' / ') : ''}`);
  await ph.p.evaluate(() => localStorage.removeItem('rn-thin-sec'));
  /* ④ 🔍 기능 찾기로 휴대폰에서 고르지 않은 칸에 가면 → 그 탭 📋 고르기에서 그 칸이 빛남(조용히 켜지 않음) */
  const fg = await ph.p.evaluate(async () => { localStorage.setItem('rn-thin-sec', JSON.stringify({ biz: ['bz_pace'] })); S.tab = 'home'; renderTabs(); renderMainNow(); featGo({ go: { tab: 'biz', sec: 'bz_exp' } }); await new Promise((r) => setTimeout(r, 1500)); const lb = document.querySelector('#main [data-thsec="bz_exp"]'); return { tab: S.tab, pick: !!document.querySelector('#main .thinpick'), flash: !!(lb && lb.closest('label').classList.contains('featflash')), kept: JSON.stringify(thinSelAll().biz) }; });
  ok(fg.tab === 'biz' && fg.pick && fg.flash && fg.kept === '["bz_pace"]', `🔍 기능 찾기 → 고르지 않은 칸(경영 ⑨ 기타 지출): 고르기 화면에서 빛남 · 고른 것은 그대로 ${JSON.stringify(fg)}`);
  const fg2 = await ph.p.evaluate(async () => { localStorage.setItem('rn-thin-sec', JSON.stringify({ biz: ['bz_exp'] })); S.thinPick = null; featGo({ go: { tab: 'biz', sec: 'bz_exp' } }); await new Promise((r) => setTimeout(r, 1500)); return { pick: !!document.querySelector('#main .thinpick'), sec: !!document.querySelector('#main details[data-sec="bz_exp"]') }; });
  ok(!fg2.pick && fg2.sec, '🔍 기능 찾기 → 고른 칸이면 예전처럼 그 칸으로 ' + JSON.stringify(fg2));
  await ph.p.evaluate(() => localStorage.removeItem('rn-thin-sec'));
  ok(!pc.errs.length && !ph.errs.length, '페이지 오류 없음' + (pc.errs.length || ph.errs.length ? ': ' + [...pc.errs, ...ph.errs].slice(0, 4).join(' | ') : ''));
  if (miss.length) console.log('❌ 휴대폰 고르기에 없음:\n  ' + miss.join('\n  '));
  await b.close(); console.log(bad ? `❌ tTHIN 실패 ${bad}` : '✓ tTHIN 통과'); process.exit(bad ? 1 : 0); })();
