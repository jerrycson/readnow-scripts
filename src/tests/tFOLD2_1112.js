// tFOLD2_1112 — (11/12 저녁 정범님 「웹앱의 탭마다 상단에 있는 화면 모두 칸을 기본값으로 접기」 · 일꾼 fold2)
//   ① 기본(⚙ 🧭 '탭 위 「화면 모두」 칸 처음에 펼치기' 꺼짐) = 모든 탭 맨 위 🧭 ○○ 화면 모두(홈은 🧭 모든 화면 지도)가 접힌 채로 시작
//      · 예전에 펼쳐 둔 기억(rn-navhub-fold)이 있어도 처음엔 접힘
//   ② 사람이 펼친 탭은 다른 탭에 갔다 와도·다시 그려도 그대로(이번 세션) · 다른 탭은 접힌 채
//   ③ 설정을 켜면(rn-pfold-open=1 · 상품 설정과 같은 열쇠 이어받음) 예전 그대로 — 홈만 접힌 한 줄 · 다른 탭은 펼침 · 지난 기억 따름
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tFOLD2_1112.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const draw = (p, t) => p.evaluate((t) => { S.q = ''; S.tab = t; renderTabs(); renderMainNow(); afterRender(); }, t);
const state = (p) => p.evaluate(() => { const h = document.querySelector('#main > .navhub:not(.navpage)'); return h ? { has: true, open: !!h.querySelector('.nh-body, .nm-body'), name: (h.querySelector('.nh-h b') || {}).textContent || '' } : { has: false }; });
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const tabs = await p.evaluate(() => { localStorage.removeItem('rn-pfold-open'); const f = {}; Object.keys(NAV_HUB).forEach((k) => (f[k] = false)); f.home = false; localStorage.setItem('rn-navhub-fold', JSON.stringify(f)); /* 예전에 모두 펼쳐 둔 기억 */ S._navSess = {};
    return ['home', ...Object.keys(NAV_HUB)].filter((k) => !['research', 'channels'].includes(k)); });
  console.log('① 기본 = 모든 탭 🧭 화면 모두 접힘');
  const R1 = {}; for (const t of tabs) { await draw(p, t); await p.waitForTimeout(250); R1[t] = await state(p); }
  const miss = tabs.filter((t) => !R1[t].has); const open1 = tabs.filter((t) => R1[t].has && R1[t].open);
  console.log('  탭:', tabs.map((t) => `${t}=${R1[t].name}`).join(' · '));
  ok(miss.length === 0 && tabs.length >= 10, `탭 ${tabs.length}개 모두 맨 위 🧭 화면 모두 칸이 있음`, miss);
  ok(open1.length === 0, '모두 처음엔 접힘(예전에 펼쳐 둔 기억이 있어도)', open1);
  console.log('② 펼친 탭은 이번 세션 동안 그대로');
  await draw(p, 'biz'); await p.waitForTimeout(250); await p.click('#main > .navhub [data-nhfold="biz"]'); await p.waitForTimeout(250);
  const b1 = await state(p); await draw(p, 'orders'); await p.waitForTimeout(250); const o1 = await state(p);
  await draw(p, 'biz'); await p.waitForTimeout(250); await p.evaluate(() => renderMain()); await p.waitForTimeout(400); const b2 = await state(p);
  ok(b1.open && !o1.open && b2.open, '경영 탭 펼침 → 주문 탭은 접힌 채 · 경영 탭에 돌아와도·다시 그려도 펼친 채', { b1, o1, b2 });
  await draw(p, 'home'); await p.waitForTimeout(250); await p.click('#main > .navmap [data-nhfold="home"]'); await p.waitForTimeout(250); const h1 = await state(p);
  await draw(p, 'products'); await p.waitForTimeout(250); await draw(p, 'home'); await p.waitForTimeout(250); const h2 = await state(p);
  ok(h1.open && h2.open, '🏠 🧭 모든 화면 지도도 펼치면 그대로', { h1, h2 });
  await draw(p, 'biz'); await p.waitForTimeout(250); await p.click('#main > .navhub [data-nhfold="biz"]'); await p.waitForTimeout(250); await draw(p, 'orders'); await draw(p, 'biz'); await p.waitForTimeout(250);
  ok(!(await state(p)).open, '다시 접으면 접힌 채', null);
  console.log('③ ⚙ 설정을 켜면 예전 그대로');
  await p.evaluate(() => { S.sec.set_pfold = true; S.tab = 'settings'; renderTabs(); renderMain(); }); await p.waitForTimeout(800);
  const cb = p.locator('#pfold_set [data-pfold]'); const n = await cb.count(); const lbl = n ? await p.evaluate(() => document.querySelector('#pfold_set').textContent.replace(/\s+/g, ' ')) : '';
  if (n) { await cb.scrollIntoViewIfNeeded(); await cb.check(); } await p.waitForTimeout(200);
  ok(n === 1 && /탭 위 「화면 모두」 칸 처음에 펼치기/.test(lbl) && (await p.evaluate(() => localStorage.getItem('rn-pfold-open'))) === '1', "설정 이름 '탭 위 「화면 모두」 칸 처음에 펼치기' · 켜면 rn-pfold-open=1(상품 설정과 같은 열쇠)", lbl.slice(0, 200));
  await p.evaluate(() => { localStorage.removeItem('rn-navhub-fold'); S._navSess = {}; });
  const R3 = {}; for (const t of tabs) { await draw(p, t); await p.waitForTimeout(200); R3[t] = await state(p); }
  const wrong = tabs.filter((t) => R3[t].open !== (t !== 'home'));
  ok(wrong.length === 0, '켜면 예전처럼 — 홈만 접힌 한 줄 · 다른 탭은 펼침', wrong.map((t) => [t, R3[t]]));
  await p.evaluate(() => { localStorage.removeItem('rn-pfold-open'); localStorage.removeItem('rn-navhub-fold'); });
  ok(dlg.length === 0, '브라우저 창(alert·confirm) 없음', dlg);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
});
