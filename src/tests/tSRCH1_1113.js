// tSRCH1_1113 — (11/13 srch1 · 정범님 11/13 16:00) 맨 위 검색 칸: ① 못 찾은 뒤 검색어가 사라져도 '못 찾음' 화면이 고정되던 고장 ② 비면 바로 원래 화면 ③ 탭을 옮기면 그 탭에 맞게 ④ 못 찾음 = 원래 화면 위 작은 띠(비슷한 것·다른 곳·✕) ⑤ ISBN 꼴 알아봄 ⑥ 단축키 ⑦ 등록 스캐너 칸과 겹치지 않음 ⑧ 휴대폰 폭
// 돌리기: harness.js 옆에서 node tSRCH1_1113.js (휴대폰 폭만: --360) · 손님 이름은 가짜(홍가짜) · 전화는 010-0000-0000만
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const W360 = process.argv.includes('--360');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(() => { S.user = S.user || { email: 'tester@x' }; S.ordersLoaded = true; S.sellersLoaded = true; S.pur.loaded = true; S.qnaAll = [];
    const d9 = '893643359'; let s = 0; for (let i = 0; i < 9; i++) s += +d9[i] * (10 - i); const c = (11 - (s % 11)) % 11; window.__i10 = d9 + (c === 10 ? 'X' : c); const i13 = srchTo13(window.__i10); window.__i13 = i13;
    S.plist.set('aladin_U9990001', { id: 'aladin_U9990001', usedCode: 'U9990001', listingId: '404999001', title: '열 자리 번호 시험 책', isbn13: i13, price: 7000, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_ms', registeredAt: '2026-10-30T10:00:00' });
    putCustomer('c_fake1', { displayName: '홍가짜', names: ['홍가짜'], phones: ['010-0000-0000'], saleOrderCount: 1, lastOrderAt: '2026-11-01' }); S.ver++; });
  const st = () => p.evaluate(() => { const m = document.getElementById('main'); const b = m.querySelector(':scope > .srchband'); return { tab: S.tab, Sq: S.q, inp: document.getElementById('q').value, eff: srchEff(document.getElementById('q').value), band: b ? b.dataset.srchband : null, bandT: b ? b.textContent.replace(/\s+/g, ' ').slice(0, 300) : '', uni: /통합 검색/.test(m.textContent.slice(0, 600)), none: [...m.querySelectorAll('.empty')].some((x) => /(찾은|찾는).*없습니다/.test(x.textContent) && !x.closest('.srchband')), sheet: document.getElementById('sheet').classList.contains('on'), map: !!m.querySelector('.navmap'), onTab: (document.querySelector('#tabs button.on') || {}).dataset ? document.querySelector('#tabs button.on').dataset.tab : null }; });
  const same = (s) => s.eff === s.Sq; /* 화면 기준(S.q) = 검색 칸 */
  const type = async (v) => { await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.keyboard.type(v, { delay: 5 }); await p.waitForTimeout(450); };
  const tab = async (t) => { const el = p.locator(`#tabs [data-tab="${t}"]`); if (await el.isVisible()) await el.click(); else await p.evaluate((x) => uxTabGo(x), t); /* 휴대폰 폭: 다섯 칸 밖 탭은 ☰ 안 — 탭 단추와 같은 함수 */ await p.waitForTimeout(450); };
  if (W360) await p.setViewportSize({ width: 360, height: 760 });

  console.log('① 고장 재현 — 못 찾은 뒤 무엇을 열다 만 경우(pushState)');
  await tab('home'); await type('9791199999999');
  let s = await st(); ok(s.band === '0' && /어디에서도 못 찾음/.test(s.bandT) && same(s), '못 찾음 = 작은 띠', s);
  ok(s.map && !s.none, '띠 아래는 원래 홈 화면(🧭 모든 화면 지도) — 화면 전체를 \'찾은 것이 없습니다\'로 덮지 않음', s);
  await p.evaluate(() => history.pushState({ x: 1 }, '')); await p.waitForTimeout(250); /* 예전: 검색 칸·S.q만 비우고 화면은 그대로 */
  s = await st(); ok(s.inp === '' && s.Sq === '' && !s.band && !s.uni && !s.none && s.map, '검색 칸이 비면 화면도 바로 원래 홈(띠·못 찾음 없음)', s);
  await tab('home'); s = await st(); ok(!s.band && !s.none && s.map, '홈 탭을 눌러도 그대로 원래 화면', s);
  // 같은 탭 단추 — 다른 코드가 칸만 비운 경우에도
  await type('없는검색어쿄쿄'); await p.evaluate(() => { document.getElementById('q').value = ''; }); await tab('home');
  s = await st(); ok(same(s) && !s.band && !s.none, '칸만 비워진 뒤 같은 탭 단추 → 화면이 칸을 따름', s);

  console.log('② 비면 바로 원래 탭 — 경영 탭에서 쳤다 지움');
  await tab('biz'); await type('없는말쿄쿄');
  s = await st(); ok(s.tab === 'home' && s.band === '0' && s.onTab === 'biz', '경영에서 친 것 = 통합 검색 · 못 찾음 띠 아래는 경영 화면(경영 탭 불)', s);
  ok(/검색 전에 보던 화면/.test(s.bandT), '띠에 \'아래는 검색 전에 보던 화면\'', s.bandT);
  await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.waitForTimeout(60);
  s = await st(); ok(s.tab === 'biz' && !s.band && s.inp === '' && same(s), '지우자마자(0.06초) 경영 탭으로 돌아옴', s);
  await type('없는말쿄쿄'); await p.click('#main .srchband [data-srchx]'); await p.waitForTimeout(120);
  s = await st(); ok(s.tab === 'biz' && !s.band && s.inp === '', '띠의 ✕ 지우기 → 경영 그대로', s);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('rn-q-hist') || '[]').includes('없는말쿄쿄')), '지운 검색어는 최근 검색에 남음');
  await type('없는말쿄쿄'); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  s = await st(); ok(s.tab === 'biz' && s.inp === '' && !s.band, 'Esc → 지우고 경영 그대로', s);

  console.log('③ 탭을 옮길 때 — 검색 탭은 그 탭에 맞게 · 검색이 없는 탭은 검색어를 비움');
  await tab('products'); await type('테스트 책 1');
  s = await st(); ok(s.tab === 'products' && s.band === '1' && !s.none, '상품 탭에서 찾음 → 얇은 띠(무엇으로 봤는지 · ✕)', s);
  await tab('orders'); s = await st(); ok(s.tab === 'orders' && s.inp === '테스트 책 1' && same(s), '주문 탭으로 → 같은 검색어로 주문에서', s);
  await tab('market'); s = await st(); ok(s.tab === 'market' && s.inp === '' && s.Sq === '' && !s.band && !s.uni, '시장조사(검색 없는 탭)로 → 검색어 비움 · 결과 화면이 따라오지 않음', s);

  console.log('④ 상품 탭에서 못 찾음 — 원래 상품 화면 위 띠 · 비슷한 것');
  await tab('products'); await type('테스트책 아주 긴 제목이 붙은 상폼');
  s = await st(); ok(s.band === '0' && /상품에서 못 찾음/.test(s.bandT) && /비슷한 것/.test(s.bandT) && /테스트 책/.test(s.bandT), '못 찾음 + 비슷한 것(제목)', s);
  ok(await p.evaluate(() => !!document.querySelector('#main #pallbtn')), '띠 아래 원래 상품 탭 첫 화면(📚 상품 전체 보기)');
  await p.click('#main .srchband [data-srchsim="0"]'); await p.waitForTimeout(700);
  s = await st(); ok(s.sheet && s.inp === '', '비슷한 것을 누르면 그 상품이 열림(검색어는 최근 검색으로)', s);
  await p.evaluate(() => history.back()); await p.waitForTimeout(600); s = await st(); ok(!s.sheet && !s.band && !s.none && same(s), '닫으면 원래 상품 화면(띠·못 찾음 없음)', s);
  await type('9788910000091'); s = await st(); ok(s.band === '0' && /ISBN/.test(s.bandT) && /9788910000001|9788910000011/.test(s.bandT), '한 자리 틀린 ISBN → 비슷한 ISBN 제안', s.bandT);
  await type('010-0000-0000'); s = await st(); ok(s.band === '0' && /전화번호 같아요/.test(s.bandT), '상품 탭에서 전화번호 → \'👥 고객에서\' 권함', s.bandT);
  await p.click('#main .srchband [data-ux2sc="search"]'); await p.waitForTimeout(500);
  s = await st(); ok(s.tab === 'search' && s.band === '1' && await p.evaluate(() => /홍가짜/.test(document.getElementById('main').textContent)), '눌러서 고객 탭 → 가짜 손님(홍가짜) 찾음', s);

  console.log('⑤ ISBN 꼴 알아봄 — 하이픈·띄어쓰기·ISBN 글자·ISBN-10·부가기호');
  await tab('products');
  for (const [v, w] of [['978-89-1000000-1', '하이픈'], ['978 89 1000 0001', '띄어쓰기'], ['ISBN 9788910000001', 'ISBN 글자'], ['978891000000103810', '부가기호 5자리']]) { await type(v); s = await st(); ok(s.band === '1' && !s.none && s.Sq === '9788910000001', `${w}: ${v} → 9788910000001로 찾음`, s); }
  const i10 = await p.evaluate(() => window.__i10); await type(i10); s = await st(); ok(s.band === '1' && /ISBN-10 →/.test(s.bandT) && await p.evaluate(() => /열 자리 번호 시험 책/.test(document.getElementById('main').textContent)), `ISBN-10 ${i10} → 978로 바꿔 찾음`, s);
  await type('01012345678'); s = await st(); ok(s.Sq === '01012345678', '전화번호 꼴(0으로 시작 10~11자리)은 ISBN으로 바꾸지 않음', s);
  ok(await p.evaluate(() => [srchKind('001-A123456789').k, srchKind('U215983410').k, srchKind('PNKLUX').k, srchKind('404935001').k, srchKind('홍가짜').k].join()) === 'order,ucode,sku,item,text', '주문번호·U코드·관리 코드·상품 번호·글 판별');

  console.log('⑥ 단축키');
  await p.evaluate(() => { srchClear(false); srchInput(''); document.activeElement && document.activeElement.blur(); }); await p.waitForTimeout(200);
  await p.keyboard.press('/'); ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'), '/ → 검색 칸');
  await p.evaluate(() => document.activeElement.blur()); await p.keyboard.press('Control+k'); ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'), 'Ctrl+K → 검색 칸');

  console.log('⑦ 스캐너 — 검색 칸에 찍기 / 등록 화면 입력 칸과 겹치지 않음');
  await p.evaluate(() => document.activeElement.blur()); await tab('products'); await p.click('#q'); await p.keyboard.type('9788910000002', { delay: 2 }); await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  s = await st(); ok(s.inp === '9788910000002' && s.Sq === '9788910000002' && !s.none && !s.sheet, '검색 칸에 스캐너(빠른 입력 + Enter) → 바로 찾음', s);
  await p.evaluate(() => { srchClear(false); srchInput(''); }); await p.waitForTimeout(150);
  await p.evaluate(() => openRegister()); await p.waitForTimeout(1200);
  const hasIn = await p.evaluate(() => !!document.getElementById('rg_in'));
  if (hasIn) { await p.click('#rg_in'); await p.keyboard.type('9788910000003', { delay: 2 }); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ q: document.getElementById('q').value, Sq: S.q, sheet: document.getElementById('sheet').classList.contains('on'), act: (document.activeElement || {}).id, n: [...(S.regItems || new Map()).values()].filter((x) => String(x.isbn || '').includes('9788910000003') || String(x.raw || x.in || '').includes('9788910000003')).length, txt: /9788910000003/.test(document.getElementById('sheet').textContent) }));
    ok(r.q === '' && r.Sq === '' && r.sheet, '등록 화면 스캐너 입력은 맨 위 검색 칸에 들어가지 않음 · 등록 화면 그대로', r);
    ok(r.txt || r.n > 0, '등록 화면이 찍은 ISBN을 받음(조회 대기)', r);
    await p.keyboard.press('/'); await p.waitForTimeout(100); ok(await p.evaluate(() => (document.activeElement || {}).id !== 'q'), '등록 화면에서 / 는 맨 위 검색 칸을 뺏지 않음');
    await p.evaluate(() => { try { S.navStack.length = 0; } catch (e) {} if (S.detail) closeDetail(); }); await p.waitForTimeout(400); }
  else ok(false, '등록 화면 입력 칸(#rg_in)을 못 찾음');
  s = await st(); ok(same(s) && !s.band && !s.none, '등록 화면을 닫은 뒤 화면 = 검색 칸', s);

  console.log('⑧ 휴대폰 폭');
  await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(200); await tab('products'); await type('없는 책 이름 쿄쿄쿄');
  const w = await p.evaluate(() => { const b = document.querySelector('#main .srchband'); const r = b && b.getBoundingClientRect(); return { b: !!b, l: r && r.left, r: r && r.right, sw: document.documentElement.scrollWidth, h: r && r.height }; });
  ok(w.b && w.l >= 0 && w.r <= 361 && w.sw <= 362 && w.h < 200, '360 폭: 띠가 화면 안 · 가로 스크롤 없음 · 낮음', w);
  if (!W360) await p.setViewportSize({ width: 1400, height: 900 });
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과');
});
