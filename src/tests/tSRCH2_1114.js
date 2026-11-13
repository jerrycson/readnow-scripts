// tSRCH2_1114 — (11/14 rel14 · srch1 이어 하기 ②③④ · 정범님 11/13 16:00 「검색창 대폭 개선」)
//  ② 판매자·매입 탭에서 못 찾으면 다른 탭처럼 작은 띠(못 찾음 글 꼴을 맞춤)
//  ③ 검색 칸에서 ↑↓ = 떠 있는 최근 검색 고르기 · Enter = 고른 것 실행 · 고른 것이 없으면 Enter = 예전처럼 검색 확정
//  ④ 목록이 없을 때 ↓ = 검색 결과 첫 줄 · 결과 줄 ↑↓ · 첫 줄에서 ↑ = 검색 칸 · Enter = 열기
// 돌리기: harness.js 옆에서 node tSRCH2_1114.js · 손님 이름은 가짜(홍가짜)만
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(() => { S.user = S.user || { email: 'tester@x' }; S.ordersLoaded = true; S.sellersLoaded = true; S.pur.loaded = true; S.qnaAll = [];
    for (let i = 1; i <= 3; i++) S.plist.set('aladin_U99800' + i, { id: 'aladin_U99800' + i, usedCode: 'U99800' + i, listingId: '40498000' + i, title: '키보드 시험 책 ' + i, isbn13: '979119800000' + i, price: 7000, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_kb' + i });
    try { localStorage.setItem('rn-q-hist', JSON.stringify(['키보드 시험', '없는말쿄쿄', '셋째검색'])); } catch (e) {} S.ver++; });
  const type = async (v) => { await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.keyboard.type(v, { delay: 5 }); await p.waitForTimeout(450); };
  const tab = async (t) => { await p.evaluate((x) => uxTabGo(x), t); await p.waitForTimeout(300); };
  const band = () => p.evaluate(() => { const b = document.querySelector('#main > .srchband'); return b ? { z: b.dataset.srchband, t: b.textContent.slice(0, 120) } : null; });

  console.log('② 판매자·매입 탭 못 찾음 띠');
  await tab('sellers'); await type('없는판매자쿄쿄쿄'); let b = await band();
  ok(b && b.z === '0' && /판매자에서 못 찾음/.test(b.t), '판매자 탭: 못 찾음 작은 띠', b);
  ok(await p.evaluate(() => !!document.querySelector('#main .empty') && /찾은 판매자가 없습니다|알라딘 중고 판매자/.test(document.getElementById('main').textContent)), '띠 아래는 판매자 화면 그대로');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.tab === 'sellers' && !document.querySelector('#main > .srchband') && /없음|판매자/.test(document.getElementById('main').textContent)), 'Esc = 지우고 판매자 화면(검색어 없을 땐 예전 글 「없음」)');
  await tab('purchase'); await type('없는매입품목쿄쿄쿄'); b = await band();
  ok(b && b.z === '0' && /매입에서 못 찾음/.test(b.t), '매입 탭: 못 찾음 작은 띠', b);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  console.log('③ 최근 검색 ↑↓ · Enter');
  await tab('home'); await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.waitForTimeout(150);
  await p.evaluate(() => { try { localStorage.setItem('rn-q-hist', JSON.stringify(['키보드 시험', '없는말쿄쿄', '셋째검색'])); } catch (e) {} }); /* 앞 단계 Esc가 친 글을 최근 검색 맨 앞에 남김 */
  await p.evaluate(() => { document.getElementById('q').blur(); }); await p.focus('#q'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.getElementById('qrecent').classList.contains('on')), '빈 검색 칸을 누르면 최근 검색이 뜸');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  let mk = await p.evaluate(() => [...document.querySelectorAll('#qrecent [data-qh]')].map((x) => x.classList.contains('srkbon') ? x.dataset.qh : '').filter(Boolean));
  ok(mk.length === 1 && mk[0] === '없는말쿄쿄', '↓↓ = 둘째 최근 검색이 고른 표시', mk);
  await p.keyboard.press('ArrowUp'); mk = await p.evaluate(() => [...document.querySelectorAll('#qrecent .srkbon')].map((x) => x.dataset.qh));
  ok(mk[0] === '키보드 시험', '↑ = 첫째로', mk);
  await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  let s = await p.evaluate(() => ({ v: document.getElementById('q').value, q: S.q, rec: document.getElementById('qrecent').classList.contains('on') }));
  ok(s.v === '키보드 시험' && s.q === '키보드 시험' && !s.rec, 'Enter = 고른 최근 검색으로 찾음(목록 닫힘)', s);

  console.log('④ 결과 줄 ↑↓');
  await type('키보드 시험 책'); await p.evaluate(() => { const f = document.getElementById('qfeat'); if (f) f.classList.remove('on'); qRecentHide(); });
  const nRows = await p.evaluate(() => srkbRows().length); ok(nRows >= 3, '결과 줄이 셋 이상', nRows);
  await p.focus('#q'); await p.evaluate(() => { const f = document.getElementById('qfeat'); if (f) f.classList.remove('on'); });
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  await p.evaluate(() => renderMainNow()); await p.waitForTimeout(80); /* 줄에 있는 동안 화면이 다시 그려져도(자료 들어옴) 초점이 이어짐 */
  const f0 = await p.evaluate(() => { const a = document.activeElement; const R = srkbRows(); return { i: R.indexOf(a), cls: a && a.className }; });
  ok(f0.i === 0 && /srkbrow/.test(f0.cls), '검색 칸에서 ↓ = 첫 결과 줄로(다시 그린 뒤에도 그 줄)', f0);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp');
  const f1 = await p.evaluate(() => srkbRows().indexOf(document.activeElement)); ok(f1 === 1, '↓↓↑ = 둘째 줄', f1);
  ok(await p.evaluate(() => document.querySelectorAll('#main .srkbrow').length === 1), '고른 표시는 한 줄에만');
  await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'), '첫 줄에서 ↑ = 검색 칸으로');
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  s = await p.evaluate(() => ({ det: !!S.detail, on: document.getElementById('sheet').classList.contains('on') }));
  ok(s.det && s.on, 'Enter = 그 줄 열기(상세)', s);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  console.log('⑤ 예전 동작 그대로');
  await tab('home'); await type('키보드'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  s = await p.evaluate(() => ({ act: document.activeElement && document.activeElement.id, hist: JSON.parse(localStorage.getItem('rn-q-hist') || '[]')[0] }));
  ok(s.act !== 'q' && s.hist === '키보드', '고른 것이 없을 때 Enter = 예전처럼 검색 확정(최근 검색에 저장 · 칸에서 나감)', s);
  await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.waitForTimeout(200);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !document.querySelector('#main .srkbrow')), '검색어가 없을 때 ↓는 홈 화면 줄로 가지 않음');
  ok(await p.evaluate(() => FEAT.some((f) => /검색 칸 키보드/.test(f.t))), '🔍 기능 찾기에 ⌨ 검색 칸 키보드');
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
});
