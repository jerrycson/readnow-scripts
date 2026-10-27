// 📜 알라딘 규약 페이지 — 열림·탭·목차·찾기·조항 이동·제휴 전략 더하기·상태·메모·Esc
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const ok = [];
  const chk = (name, v) => { R[name] = v; if (!v) ok.push('✗ ' + name); };
  await p.evaluate(() => openAlTerms()); await p.waitForTimeout(900);
  chk('제목', await p.evaluate(() => /알라딘 규약/.test(document.querySelector('#sheet .sh .t').textContent)));
  chk('탭 5개', await p.evaluate(() => document.querySelectorAll('#sheet [data-alttab]').length === 5));
  chk('닿는 조항 15개 이상', await p.evaluate(() => document.querySelectorAll('#sheet .alt-row.hit').length >= 15));
  chk('못 받은 규약 목록(판매자 이용약관)', await p.evaluate(() => /판매자 이용약관/.test(document.querySelector('#sheet .alt-miss') ? document.querySelector('#sheet .alt-miss').textContent : '')));
  chk('보관 문서 3개', await p.evaluate(() => document.querySelectorAll('#sheet .alt-docs li').length === 3));
  // 갈래 거르기
  await p.click('#sheet [data-altcat="acct"]'); await p.waitForTimeout(200);
  chk('갈래 거르기(계정)', await p.evaluate(() => { const L = [...document.querySelectorAll('#sheet .alt-row.hit')]; return L.length > 0 && L.every((r) => /계정/.test(r.textContent)); }));
  await p.click('#sheet [data-altcat=""]'); await p.waitForTimeout(150);
  // 원문 탭 · 목차
  await p.click('#sheet [data-alttab="doc"]'); await p.waitForTimeout(1200);
  chk('원문 조항 28칸', await p.evaluate(() => document.querySelectorAll('#sheet .alt-docbox section.alt-sec').length === 28));
  chk('목차 28', await p.evaluate(() => document.querySelectorAll('#sheet .alt-toc [data-altgo]').length === 28));
  await p.click('#sheet [data-altgo="terms#a19"]'); await p.waitForTimeout(300);
  chk('목차 → 제19조 강조', await p.evaluate(() => { const el = document.getElementById('alt_terms_a19'); return !!el && el.classList.contains('alt-flash') && /5대 이상/.test(el.textContent); }));
  // 개인정보 처리방침 문서
  await p.click('#sheet [data-altdoc="privacy"]'); await p.waitForTimeout(1000);
  chk('처리방침 13칸', await p.evaluate(() => document.querySelectorAll('#sheet .alt-docbox section.alt-sec').length === 13));
  // 찾기 — 세 문서
  await p.fill('#alt_q', '직거래'); await p.waitForTimeout(1500);
  chk('찾기 결과 칠함', await p.evaluate(() => document.querySelectorAll('#sheet #alt_body mark').length >= 2 && /이용약관/.test(document.querySelector('#sheet #alt_body').textContent)));
  chk('찾는 중 입력칸 유지', await p.evaluate(() => document.activeElement && document.activeElement.id === 'alt_q'));
  await p.fill('#alt_q', ''); await p.waitForTimeout(500);
  // 점검표 → 조항 링크로 원문
  await p.click('#sheet [data-alttab="ops"]'); await p.waitForTimeout(300);
  chk('점검표 🔴 먼저', await p.evaluate(() => { const L = [...document.querySelectorAll('#sheet .alt-op')]; return L.length >= 12 && L[0].classList.contains('lv-r'); }));
  chk('점검표 확실/추정/길', await p.evaluate(() => !!document.querySelector('#sheet .alt-op .alt-sure') && !!document.querySelector('#sheet .alt-op .alt-est') && !!document.querySelector('#sheet .alt-op .alt-way')));
  await p.click('#sheet #altop_cash [data-altref="terms#a10"]'); await p.waitForTimeout(1200);
  chk('조항 링크 → 원문 제10조', await p.evaluate(() => S.alt.tab === 'doc' && S.alt.doc === 'terms' && !!document.getElementById('alt_terms_a10')));
  // 조회수 실험 칸
  await p.click('#sheet [data-alttab="px"]'); await p.waitForTimeout(300);
  chk('조회수 실험 판단', await p.evaluate(() => /진행하되/.test(document.querySelector('#sheet #alt_body').textContent) && document.querySelectorAll('#sheet .alt-way li').length >= 4));
  // 제휴 전략 — 씨앗 · 더하기 · 상태 · 메모
  await p.click('#sheet [data-alttab="strat"]'); await p.waitForTimeout(1200);
  chk('씨앗 5개 저장', await p.evaluate(() => Object.keys((S.alt.stD && S.alt.stD.items) || {}).length === 5 && document.querySelectorAll('#sheet .alt-st').length === 5));
  chk('대량 공급 실측 줄', await p.evaluate(() => !!document.querySelector('#sheet [data-altid="s_b2b"] .alt-live')));
  await p.click('#sheet [data-altadd]'); await p.waitForTimeout(200);
  await p.fill('#alt_add [data-altf="t"]', '시험 제휴'); await p.fill('#alt_add [data-altf="pitch"]', '시험 제안 내용');
  await p.evaluate(() => { S.alt.stD = { ...S.alt.stD }; altDraw(true); }); await p.waitForTimeout(100); /* 다른 기기 변경으로 다시 그려져도 쓰던 글이 남는지 */
  chk('다시 그려도 쓰던 글 유지', await p.evaluate(() => document.querySelector('#alt_add [data-altf="t"]').value === '시험 제휴'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  chk('Esc = 더하기만 닫힘', await p.evaluate(() => !S.alt.add && S.detail && S.detail.alterms && !document.querySelector('#alt_add')));
  await p.click('#sheet [data-altadd]'); await p.waitForTimeout(200);
  chk('다시 열면 쓰던 글 그대로', await p.evaluate(() => document.querySelector('#alt_add [data-altf="pitch"]').value === '시험 제안 내용'));
  await p.click('#sheet [data-altsave]'); await p.waitForTimeout(700);
  chk('항목 더함', await p.evaluate(() => Object.values(S.alt.stD.items).some((x) => x.t === '시험 제휴' && x.st === 'idea') && document.querySelectorAll('#sheet .alt-st').length === 6));
  await p.click('#sheet [data-altid="s_api"] [data-altst="prep"]'); await p.waitForTimeout(600);
  chk('상태 바꿈 + 기록', await p.evaluate(() => { const x = S.alt.stD.items.s_api; return x.st === 'prep' && (x.hist || []).some((h) => h.st === 'prep' && h.from === 'idea'); }));
  await p.evaluate(() => { document.querySelector('#sheet [data-altid="s_api"] details.alt-notes').open = true; });
  await p.fill('#sheet [data-altnote="s_api"]', '시험 메모'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  chk('메모 덧붙임', await p.evaluate(() => (S.alt.stD.items.s_api.notes || []).some((n) => n.t === '시험 메모')));
  chk('씨앗 다시 안 넣음(상태 그대로)', await p.evaluate(async () => { await altSeed(); return S.alt.stD.items.s_api.st === 'prep'; }));
  await p.click('#sheet [data-altsort="at"]'); await p.waitForTimeout(150); const o1 = await p.evaluate(() => document.querySelector('#sheet .alt-st b').textContent);
  await p.click('#sheet [data-altsort="at"]'); await p.waitForTimeout(150); const o2 = await p.evaluate(() => document.querySelector('#sheet .alt-st b').textContent);
  chk('정렬 한 번·또 = 반대', o1 !== o2);
  // 찾기 목록·상세 페이지·근거 자료
  chk('기능 찾기 FEAT', await p.evaluate(() => FEAT.filter((f) => /알라딘 규약/.test(f.w)).length >= 4));
  chk('GO_PAGES·홈 카드', await p.evaluate(() => GO_PAGES.some((g) => g[0] === 'alTerms') && !!WIDGETS.go_alTerms));
  chk('근거 자료 6건 더함', await p.evaluate(async () => { const j = await (await fetch('../research/evidence.json', { cache: 'no-store' })).json(); return ['aladin-terms-20260915', 'aladin-privacy-20260915', 'aladin-partnership-guide', 'kr-scourt-2021do1533', 'kr-ufca-data-ka', 'kr-pipa-19-71'].every((id) => j.items.some((x) => x.id === id)); }));
  chk('보관본에 우리 도구 글 없음', await p.evaluate(async () => { const t = await (await fetch('../aladin-terms/terms.html')).text(); return !/판매자 전체 갱신|문제 판매자/.test(t) && /제27조/.test(t); }));
  await p.evaluate(() => history.back()); await p.waitForTimeout(400);
  chk('닫힘', await p.evaluate(() => !document.querySelector('#sheet').classList.contains('on')));
  console.log(JSON.stringify(R)); console.log(ok.join(' | ') || '(모두 맞음)', errs.join(' | '));
  console.log(!ok.length && !errs.length ? '✓ tA 통과' : '❌ tA 실패');
});
