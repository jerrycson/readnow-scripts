// 수집기 💬 qnaReply (10/26) — 가짜 샵매니저 답변 화면(칸 구조만 본뜸)으로 qnaReplyCmd 단위 시험: 새 답 · 같은 답 · 바뀐 답 · 고치기 · 답 번호 없는 고치기
const { chromium } = require('playwright'); const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../readnow-collector.user.js', 'utf8'); const a = src.indexOf('  const QR_URL = '); const b = src.indexOf('  { let invUn = null', a); if (a < 0 || b < 0) throw new Error('코드 못 찾음');
const code = src.slice(a, b); const core = fs.readFileSync(__dirname + '/../readnow-orders-core.js', 'utf8');
const REAL = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/qa/answer.html'; const real = fs.existsSync(REAL) ? fs.readFileSync(REAL, 'utf8') : null;
(async () => { const br = await chromium.launch(); const p = await br.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.setContent('<html><body></body></html>'); await p.addScriptTag({ content: core });
  const res = await p.evaluate(async ({ code, real }) => {
    const SV = { ans: null, aid: '', posts: [], noAid: false };
    const page = (edit) => `<html><head><title>알라딘 - 샵매니저 묻고답하기 답변</title><script>function btnAnswerAddEdit_Validate(){ if(!document.getElementById('txtAnswer').value){ alert('답변 내용을 입력하세요.'); return false;} return true; }</script></head><body><a href="/logout">로그아웃</a>
      <form name="form1" method="post" action="https://www.aladin.co.kr/scm/wUsedShopC2CAnswer.aspx?questionid=77" id="form1"><input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="VS123"><input type="hidden" name="__VIEWSTATEGENERATOR" value="A31DD678"><input type="hidden" name="IsAnswerEmail" id="IsAnswerEmail" value="1"><input type="hidden" name="hidAnswerId" id="hidAnswerId"${edit && SV.aid && !SV.noAid ? ` value="${SV.aid}"` : ''}>
      <table><tr><td class="t1">상품</td><td><a id="lnkQuestionItem2" href="/shop/wproduct.aspx?ItemId=555">[중고-상] 시험 책</a></td></tr><tr><td class="t1">관련 주문번호</td><td></td></tr></table><span id="labQuestionCustomerName">ab***</span><span id="labQuestionAddDate">2026.10.25</span>
      <div id="divQuestion">밑줄 있나요?</div>${SV.ans && !edit ? `<div id="divAnswer">${SV.ans.replace(/\n/g, '<br>')}</div>` : `<textarea name="txtAnswer" rows="10" id="txtAnswer">${edit && SV.ans ? SV.ans : ''}</textarea><input type="image" name="btnAnswerAddEdit" id="btnAnswerAddEdit" src="b.gif" onclick="return btnAnswerAddEdit_Validate();"><a href="https://www.aladin.co.kr/scm/wUsedShopC2CQnASellerList.aspx"><img src="b2.gif"></a>`}</form></body></html>`;
    window.fetch = async (url, opt) => { opt = opt || {}; const u = String(url); let html;
      if (opt.method === 'POST') { const q = new URLSearchParams(opt.body); SV.posts.push(Object.fromEntries(q)); if (q.get('__VIEWSTATE') === 'VS123' && q.get('btnAnswerAddEdit.x') && q.get('txtAnswer')) { if (SV.ans && !q.get('hidAnswerId')) SV.dup = true; SV.ans = q.get('txtAnswer'); SV.aid = SV.aid || '991'; } html = "<script>alert('답변이 등록되었습니다.');</script>"; }
      else html = page(/method=edit/.test(u));
      return { ok: true, status: 200, url: u, text: async () => html }; };
    const FS = {}; const mk = (n, id) => ({ id, get: async () => ({ exists: !!(FS[n + '/' + id]), data: () => FS[n + '/' + id] }), set: async (v, o) => { FS[n + '/' + id] = o && o.merge ? { ...(FS[n + '/' + id] || {}), ...v } : { ...v }; } });
    const C = (n) => ({ doc: (id) => mk(n, id) }); const AL = { looksLoggedOut: (u, d) => !d.querySelector('a[href="/logout"]') }; const PACE = { wait: async () => {} }; const sleep = (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 20)));
    const getDoc = async (url) => { const r = await fetch(url); const html = await r.text(); return { doc: new DOMParser().parseFromString(html, 'text/html'), html, url, finalUrl: url }; };
    const PC_NAME = 'TESTPC', nowIso = () => new Date().toISOString(), TS = () => 'ts', W = () => ({ w: 1 }); const LOG = []; const log = (m) => LOG.push(m); const EX = []; const exBegin = async (k, key) => { EX.push(key); return { ok: true }; }; const exEnd = async () => {};
    const run = new Function('C', 'AL', 'PACE', 'sleep', 'getDoc', 'PC_NAME', 'nowIso', 'TS', 'W', 'log', 'exBegin', 'exEnd', code + '\n return { qnaReplyCmd, qrBuildPost, qrFindForm };')(C, AL, PACE, sleep, getDoc, PC_NAME, nowIso, TS, W, log, exBegin, exEnd);
    const go = async (v, id) => { const ref = mk('shp_cmds', id); await run.qnaReplyCmd(ref, { tries: 1, by: 'me@x', ...v }); return FS['shp_cmds/' + id]; };
    const R = {};
    R.new = await go({ questionId: '77', text: '안녕하세요.\n밑줄 없습니다.' }, 'c1'); R.postsAfterNew = SV.posts.length; R.post0 = SV.posts[0]; R.qdoc = FS['crm_interactions/aladin_qna_77'];
    R.same = await go({ questionId: '77', text: '안녕하세요. 밑줄 없습니다.', prevAnswer: null }, 'c2'); R.postsAfterSame = SV.posts.length;
    R.changed = await go({ questionId: '77', text: '다른 답', prevAnswer: null }, 'c3'); R.postsAfterChanged = SV.posts.length;
    R.edit = await go({ questionId: '77', text: '고친 답입니다.', prevAnswer: '안녕하세요.\n밑줄 없습니다.' }, 'c4'); R.post1 = SV.posts[1]; R.dup = !!SV.dup; R.hist = Object.keys(FS).filter((k) => k.startsWith('crm_hist/')).map((k) => FS[k]);
    SV.noAid = true; R.noaid = await go({ questionId: '77', text: '또 고침', prevAnswer: '고친 답입니다.' }, 'c5'); R.postsEnd = SV.posts.length;
    if (real) { const d = new DOMParser().parseFromString(real, 'text/html'); const P = run.qrBuildPost(d, 'https://www.aladin.co.kr/scm/wUsedShopC2CAnswer.aspx?questionid=2168856', '시험 답'); const q = new URLSearchParams(P.body || ''); R.real = { why: P.why || null, action: P.action, btn: P.btn, keys: [...q.keys()], txt: q.get('txtAnswer'), x: q.get('btnAnswerAddEdit.x'), aid: P.answerId }; }
    return R; }, { code, real });
  const out = []; const ok = (c, m) => out.push((c ? '✓ ' : '❌ ') + m);
  ok(res.new.status === 'done' && res.new.result.how === 'new' && res.postsAfterNew === 1, '새 답 등록 → 확인됨 ' + JSON.stringify({ s: res.new.status, m: res.new.msg }));
  ok(res.post0 && res.post0.__VIEWSTATE === 'VS123' && res.post0.IsAnswerEmail === '1' && res.post0['btnAnswerAddEdit.x'] === '10' && res.post0.txtAnswer === '안녕하세요.\n밑줄 없습니다.' && 'hidAnswerId' in res.post0, '양식 칸 그대로 + 답변 칸만 바꿈 + 이미지 단추 값');
  ok(res.qdoc && res.qdoc.answer && res.qdoc.answerStatus === 'Yes' && res.qdoc.answeredBy === 'me@x' && res.qdoc.answeredVia === 'webapp', '문의 기록에 answer·answeredBy');
  ok(res.same.status === 'done' && res.same.result.how === 'same' && res.postsAfterSame === 1, '같은 답(띄어쓰기만 다름)은 다시 안 보냄');
  ok(res.changed.status === 'fail' && res.changed.result.state === 'changed' && res.postsAfterChanged === 1, '웹앱이 본 답과 다르면 덮어쓰지 않음');
  ok(res.edit.status === 'done' && res.edit.result.how === 'edit' && res.post1 && res.post1.hidAnswerId === '991' && !res.dup, '고치기는 답 번호(hidAnswerId)와 함께 · 두 번째 답 안 생김');
  ok(res.hist.length === 1 && /밑줄 없습니다/.test(res.hist[0].prev.answer), '옛 답은 crm_hist에');
  ok(res.noaid.status === 'fail' && res.postsEnd === 2 && /hidAnswerId/.test(res.noaid.msg), '답 번호 없는 고치기는 안 보냄');
  if (res.real) ok(!res.real.why && res.real.btn === 'btnAnswerAddEdit' && res.real.txt === '시험 답' && res.real.x === '10' && /questionid=2168856/.test(res.real.action) && res.real.keys.includes('__VIEWSTATE') && res.real.keys.includes('hidAnswerId') && !res.real.keys.some((k) => /^rn/.test(k)), '실제 화면(정범님 파일)에서 양식 만들기 ' + JSON.stringify({ why: res.real.why, keys: res.real.keys }));
  ok(!errs.length, '페이지 오류 없음 ' + errs.join('|'));
  console.log(out.join('\n')); console.log(out.every((x) => x.startsWith('✓')) ? '✓ tQRc 통과' : '❌ tQRc 실패'); await br.close(); })();
