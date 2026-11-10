// tUX1 — (11/10 ux1) 작은 화면 고침: ① 아래 탭 그림이 탭마다 다름(판매자=사람 · 매입=상자 · 경영=가방) ② 상품 탭 오른쪽 순위 칸 위쪽이 머리 칸 밑에 깔리지 않음 ③ 빈 응답(JSON) 읽기 실패를 한국어로
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  // ① 탭 그림
  const ic = await p.evaluate(() => { S.tab = 'home'; renderTabs(); const g = (k) => { const b = document.querySelector(`#tabs [data-tab="${k}"] svg`); return b ? b.outerHTML : ''; }; return { sellers: g('sellers'), orders: g('orders'), purchase: g('purchase'), biz: g('biz') }; });
  ok(ic.sellers && ic.orders && ic.purchase && ic.biz, '네 탭 모두 그림 있음');
  ok(new Set(Object.values(ic)).size === 4, '판매자·주문·매출·매입·경영 그림이 서로 다름', Object.keys(ic));
  ok(!/M12 3 2 21h20L12 3z/.test(ic.sellers), '판매자 탭이 ⚠ 세모 그림이 아님');
  // ② 순위 칸 위치 (넓은 화면)
  await p.evaluate(() => { S.tab = 'products'; renderTabs(); renderMainNow(); }); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => { const h = document.querySelector('header.top'); const rk = document.querySelector('#rank'); if (!h || !rk || getComputedStyle(rk).display === 'none') return null; return { hb: Math.round(h.getBoundingClientRect().bottom), rt: Math.round(rk.getBoundingClientRect().top), cond: h.classList.contains('cond') }; });
  ok(r && !r.cond && r.rt >= r.hb, '순위 칸 위쪽이 머리 칸 아래에서 시작', r);
  // ③ 읽기 실패 문구
  const t = await p.evaluate(() => [prErrText("Failed to execute 'json' on 'Response': Unexpected end of JSON input", '가격 판정'), prErrText('permission-denied', '가격 판정'), prErrText('xyz', '가격 판정')]);
  ok(/응답이 비었거나 잘려/.test(t[0]) && /원래 오류/.test(t[0]), '빈 응답 오류는 한국어 설명 + 원래 오류', t[0]);
  ok(/권한이 없습니다/.test(t[1]) && /읽기 실패: xyz/.test(t[2]), '다른 오류 문구는 그대로', t.slice(1));
}, { vp: { width: 1400, height: 900 } }).then(() => { console.log(bad ? `❌ tUX1 실패 ${bad}` : '✓ tUX1 통과'); process.exit(bad ? 1 : 0); });
