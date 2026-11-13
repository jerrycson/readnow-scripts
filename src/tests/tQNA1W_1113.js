// (qna1 11/13) ❓ 문의 모음 — 🔄 문의 다시 읽기 단추·상태 글·새 문의 올라오면 저절로 다시 받기 · ⚙ ⑯-2 ❓ 문의 실시간 칸
// 실행: 세션 작업 폴더 pw/ 안에 복사해 RN_PORT=<포트> node tQNA1W_1113.js (harness.js · 가짜 Firebase)
require('./harness.js')(async (p) => {
  let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
  await p.evaluate(() => { const FS = window.__FS; FS.crm_interactions = FS.crm_interactions || {}; FS.crm_interactions.aladin_qna_901 = { type: 'qna', questionId: '901', answerStatus: 'No', body: '가짜 문의 하나', createdAt: '2026-11-13T10:00', title: '테스트 책' }; S.qnaAll = null; S.tab = 'search'; S.custView = 'qna'; S.q = ''; renderTabs && renderTabs(); renderMain(); });
  await p.waitForTimeout(2500); await p.evaluate(() => renderMain()); await p.waitForSelector('#qna_reread', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(500);
  const t0 = await p.evaluate(() => ({ btn: !!document.querySelector('#qna_reread'), line: (document.querySelector('#qna_live') || {}).textContent || '', n: (S.qnaAll || []).length }));
  ok(t0.btn && /낮 2분·밤 10분/.test(t0.line) && t0.n === 1, '❓ 문의 모음 맨 위 — 🔄 문의 다시 읽기 단추 · 확인 주기 줄', t0);
  await p.click('#qna_reread'); await p.waitForTimeout(600);
  const t1 = await p.evaluate(() => { const v = ((window.__FS.prd_jobs || {}).qna_live) || {}; return { req: v.req, run: v.reqRun, line: document.querySelector('#qna_live').textContent, dis: document.querySelector('#qna_reread').disabled }; });
  ok(t1.req && t1.req.id && t1.run && t1.run.id === t1.req.id && t1.run.state === 'queued' && /받기를 기다림/.test(t1.line) && t1.dis, '누르면 맡김(req·reqRun queued) · 기다림 글 · 단추 잠김', t1);
  await p.evaluate(async () => { window.__FS.crm_interactions.aladin_qna_902 = { type: 'qna', questionId: '902', answerStatus: 'No', body: '가짜 새 문의', createdAt: '2026-11-13T10:05', title: '테스트 책 2' }; const id = window.__FS.prd_jobs.qna_live.req.id; await db.collection('prd_jobs').doc('qna_live').set({ reqRun: { id, state: 'done', pc: 'JS-MAIN', endAt: new Date().toISOString(), upN: 1, msg: '새로·바뀐 문의 1건을 웹앱에 올림' }, doneAt: new Date().toISOString(), upN: 1 }, { merge: true }); });
  await p.waitForTimeout(2500);
  const t2 = await p.evaluate(() => ({ n: (S.qnaAll || []).length, line: (document.querySelector('#qna_live') || {}).textContent || '', has: /가짜 새 문의/.test(document.querySelector('#main').textContent), dis: (document.querySelector('#qna_reread') || {}).disabled }));
  ok(t2.n === 2 && t2.has && /✓ .*JS-MAIN.*1건/.test(t2.line) && t2.dis === false, '끝 소식 → 문의 목록 저절로 다시 받음(새 문의 보임) · ✓ 시각·PC·결과 · 단추 다시 누를 수 있음', t2);
  await p.evaluate(() => { S.tab = 'settings'; renderTabs && renderTabs(); renderMain(); const d = document.querySelector('details[data-sec="set_qnalive"]'); if (d) d.open = true; });
  await p.waitForTimeout(800);
  const t3 = await p.evaluate(() => ({ sec: !!document.querySelector('details[data-sec="set_qnalive"]'), day: (document.querySelector('#ql_day') || {}).value, night: (document.querySelector('#ql_night') || {}).value, save: !!document.querySelector('#ql_save') }));
  ok(t3.sec && t3.day === '2' && t3.night === '10' && t3.save, '⚙ 설정 › ⑯-2 ❓ 문의 실시간 칸(낮 2·밤 10 · 저장)', t3);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
});
