// 💬 묻고 답하기 답변 창 (10/26) — 카드 누르기 → 창 · 문구 모음 한 칸 · 두 번 눌러 맡김 · 진행 표시 · 등록 문구 모음 그대로
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const out = []; const ok = (c, m) => out.push((c ? '✓ ' : '❌ ') + m);
  await p.evaluate(() => { S.qph = { greet: ['안녕하세요, 북스킹입니다.'], body: ['재고 있습니다.'], close: ['감사합니다.'] };
    S.qnaAll = [{ type: 'qna', questionId: '9001', answerStatus: 'No', body: '이 책 밑줄 있나요?', title: '테스트 책 1', itemId: '404935001', createdAt: '2026-10-25', authorMasked: 'ab***' },
      { type: 'qna', questionId: '9002', answerStatus: 'Yes', body: '언제 보내나요?', answer: '오늘 보냅니다.', createdAt: '2026-10-24', authorMasked: 'cd***' }];
    S.tab = 'search'; S.custView = 'qna'; S.qnaF = 'all'; S.q = ''; renderTabs && renderTabs(); renderMain(); });
  await p.waitForTimeout(400);
  const nCards = await p.$$eval('[data-qr]', (L) => L.length); ok(nCards === 2, '문의 카드 2개에 data-qr ' + nCards);
  await p.click('[data-qr="9001"] .l2 span'); await p.waitForTimeout(400);
  ok(await p.$('#qr_ov') != null, '카드 누르면 답변 창');
  const info = await p.evaluate(() => ({ t: document.querySelector('.qr-t').innerText, q: document.querySelector('.qr-q').innerText, folders: [...document.querySelectorAll('#qr_ph .rgpf')].map((x) => x.innerText) }));
  ok(/상품/.test(info.t) && /문의한 고객/.test(info.t) && /ab\*\*\*/.test(info.t) && /문의 날짜/.test(info.t), '알라딘 답변 화면 칸(상품·고객·날짜)');
  ok(info.q === '이 책 밑줄 있나요?', '질문 글');
  ok(info.folders.length === 3, '처음 문구 = 고객 응대 문구 폴더 셋 ' + JSON.stringify(info.folders));
  // 폴더 펼치고 문구 누르기 → 답변 칸
  await p.click('#qr_ph [data-rgpfo]'); await p.waitForTimeout(200);
  await p.click('#qr_ph .rgpfin .pt'); await p.waitForTimeout(150);
  ok((await p.inputValue('#qr_ta')) === '안녕하세요, 북스킹입니다.', '문구 누르면 답변 칸에: ' + JSON.stringify(await p.inputValue('#qr_ta')));
  // 새 문구 넣기 (Enter) → app_settings/qna_ans_phrases
  await p.fill('#qr_ph [data-rgphadd]', '확인해 보니 밑줄 없습니다.'); await p.press('#qr_ph [data-rgphadd]', 'Enter'); await p.waitForTimeout(400);
  const saved = await p.evaluate(() => (window.__FS.app_settings || {}).qna_ans_phrases);
  ok(saved && saved.q && saved.q.some((x) => x.t === '확인해 보니 밑줄 없습니다.') && saved.q.filter((x) => x.f != null).length === 3, '새 문구 저장(한 모음 q · 폴더 유지)');
  ok(await p.evaluate(() => !(window.__FS.app_settings || {}).reg_phrases), '등록 문구 모음 문서는 건드리지 않음');
  // 새 문구 누르기 → 커서 자리(끝)에 줄 바꿔
  await p.evaluate(() => { const ta = document.getElementById('qr_ta'); ta._p = ta._e = ta.value.length; });
  await p.click('#qr_ph .pt[data-t="확인해 보니 밑줄 없습니다."]'); await p.waitForTimeout(150);
  ok((await p.inputValue('#qr_ta')) === '안녕하세요, 북스킹입니다.\n확인해 보니 밑줄 없습니다.', '두 번째 문구는 다음 줄');
  ok(await p.evaluate(() => localStorage.getItem('rn-qr-d-9001')) === '안녕하세요, 북스킹입니다.\n확인해 보니 밑줄 없습니다.', '쓰던 글 이 기기에 저장');
  // ★ 고정 / 끌기 저장
  await p.click('#qr_ph .rgphl > .rgpb:not(.rgpf) [data-rgphpin]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__FS.app_settings.qna_ans_phrases.q.find((x) => x.t === '확인해 보니 밑줄 없습니다.').pin === true), '★ 고정 저장');
  // 등록: 한 번 → 무장, 두 번 → 맡김
  await p.click('#qr_go'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => !(window.__FS.shp_cmds || {}).qr_9001 && document.getElementById('qr_go').classList.contains('armed')), '첫 번째 누름은 확인만');
  await p.click('#qr_go'); await p.waitForTimeout(500);
  const cmd = await p.evaluate(() => (window.__FS.shp_cmds || {}).qr_9001);
  ok(cmd && cmd.type === 'qnaReply' && cmd.status === 'queued' && cmd.questionId === '9001' && cmd.text.includes('밑줄 없습니다') && cmd.prevAnswer == null && cmd.tries === 1, '두 번째 누름 → 맡긴 일 qr_9001 ' + JSON.stringify(cmd && { s: cmd.status, t: cmd.type }));
  await p.waitForTimeout(600);
  ok(/맡김/.test(await p.evaluate(() => (document.getElementById('qr_st') || {}).innerText || '')), '창에 📨 맡김 표시');
  ok(await p.evaluate(() => document.getElementById('qr_go').disabled), '처리 중엔 또 못 보냄');
  // 수집기가 처리 중 → 끝남 흉내
  await p.evaluate(() => db.collection('shp_cmds').doc('qr_9001').set({ status: 'running', step: 'send', claim: { pc: 'OFFICE1', at: new Date().toISOString() } }, { merge: true })); await p.waitForTimeout(1300);
  ok(/OFFICE1.*처리 중/.test(await p.evaluate(() => document.getElementById('qr_st').innerText)), '⏳ PC 처리 중 단계 표시');
  await p.evaluate(() => db.collection('shp_cmds').doc('qr_9001').set({ status: 'done', step: 'ok', doneAt: new Date().toISOString(), result: { state: 'ok', how: 'new', answer: '안녕하세요, 북스킹입니다.\n확인해 보니 밑줄 없습니다.' } }, { merge: true })); await p.waitForTimeout(1300);
  const after = await p.evaluate(() => ({ st: document.getElementById('qr_st').innerText, cur: (document.getElementById('qr_cur') || {}).innerText || '', q: S.qnaAll[0], d: localStorage.getItem('rn-qr-d-9001'), chip: (document.querySelector('[data-qr="9001"]') || {}).innerText || '' }));
  ok(/확인함/.test(after.st), '✅ 확인됨 표시'); ok(after.q.answerStatus === 'Yes' && /밑줄 없습니다/.test(after.q.answer), '이 기기 문의 기록에 답 반영'); ok(/지금 답변/.test(after.cur), '창에 지금 답변'); ok(after.d == null, '확인된 글은 저장본 지움'); ok(/웹앱 답변 확인/.test(after.chip), '카드에 ✅ 표시');
  // Esc로 닫기
  await p.keyboard.press('Escape'); await p.waitForTimeout(150); ok(await p.$('#qr_ov') == null, 'Esc로 닫힘');
  // 답이 있는 문의 → 고치기 창 · 같은 카드 두 번 → 닫힘
  await p.click('[data-qrb="9002"]'); await p.waitForTimeout(300);
  ok((await p.inputValue('#qr_ta')) === '오늘 보냅니다.' && /고치기/.test(await p.innerText('#qr_go')), '답한 문의는 지금 답이 들어간 고치기 창');
  await p.click('[data-qrb="9002"]', { force: true }).catch(() => {}); await p.evaluate(() => { if (document.getElementById('qr_ov')) qrOpen('9002'); }); await p.waitForTimeout(150); ok(await p.$('#qr_ov') == null, '같은 단추로 다시 → 닫힘');
  // 실패 → 다시 하기 (hist에 쌓임)
  await p.evaluate(() => db.collection('shp_cmds').doc('qr_9002').set({ type: 'qnaReply', questionId: '9002', status: 'fail', msg: '그사이 샵매니저의 답변이 바뀜', text: 'x', createdAt: new Date().toISOString(), result: { state: 'changed', answer: '내일 보냅니다.' } })); await p.waitForTimeout(800);
  await p.evaluate(() => qrOpen('9002')); await p.waitForTimeout(300);
  ok(/실패/.test(await p.innerText('#qr_st')) && await p.$('#qr_base') && await p.$('#qr_re'), '실패 까닭·기준 맞추기·다시 하기');
  await p.click('#qr_base'); await p.waitForTimeout(300); await p.fill('#qr_ta', '모레 보냅니다.'); await p.click('#qr_re'); await p.click('#qr_re'); await p.waitForTimeout(500);
  const c2 = await p.evaluate(() => window.__FS.shp_cmds.qr_9002); ok(c2.status === 'queued' && c2.prevAnswer === '내일 보냅니다.' && c2.text === '모레 보냅니다.' && c2.hist.length === 1 && c2.hist[0].status === 'fail' && c2.tries === 1, '다시 하기: 바뀐 답 기준 · 옛 시도는 hist ' + JSON.stringify({ s: c2.status, p: c2.prevAnswer, h: (c2.hist || []).length }));
  // 휴대폰 너비
  await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(200);
  const mob = await p.evaluate(() => { const b = document.querySelector('.qr-box').getBoundingClientRect(); return { w: b.width, sw: document.documentElement.scrollWidth }; }); ok(mob.w <= 391 && mob.sw <= 400, '휴대폰 너비에 맞음 ' + JSON.stringify(mob));
  console.log(out.join('\n')); console.log(out.every((x) => x.startsWith('✓')) ? '✓ tQR 통과' : '❌ tQR 실패');
});
