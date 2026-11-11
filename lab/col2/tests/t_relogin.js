/* t_relogin — (11/10 아침 정범님 '번외에서 예스24가 자주 로그아웃돼 — 수집기에 아이디랑 비밀번호를 입력해서 필요할 때 스스로 다시 로그인 · 다른 플랫폼도')
 *  가짜 예스24 판매관리(쿠키 세션 · 비밀번호가 맞아야 로그인) + 가짜 Windows 잠그개(DPAPI 흉내 — 실제 PC는 powershell.exe ProtectedData)
 *  ① 계정이 없으면 예전처럼 '로그인 필요'에서 멈춤(로그인 시도 0) · 로거 PC는 저장 거절 · 다른 출처(웹 화면)는 거절
 *  ② ⚙에서 잠가 저장 → 세션이 풀리면 스스로 한 번 로그인 → 이어 감 · 기록에 '스스로 다시 로그인'(비밀번호·아이디 없음)
 *  ③ 비밀번호·아이디가 잠근 파일 밖 어디에도 없음(도우미 폴더 전부 · 크롬 프로필 · 상태 · 기록창 · 답)
 *  ④ 🚚 출고 중엔 다시 로그인도 미룸 → 끝나면 함 · ⑤ 비밀번호가 틀리면 연속 2번에서 멈추고 알림 → [다시 해 보기] · ⑥ 보안 문자 화면이면 곧바로 멈춤
 *  ⑦ 속도 제한(한 시간·하루·앞 시도 뒤 간격) — 순수 함수 · ⑧ 로거 PC 화면엔 계정 칸 자체가 없음
 * 실행: node tests/t_relogin.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const ID = 'sellerid' + Math.random().toString(36).slice(2, 8), PW = 'Pw!' + Math.random().toString(36).slice(2, 12);

function fakeY24() { const S = { pw: PW, sess: new Set(), log: [], captcha: false, spa: '', dup: false };
  /* (11/11) 실제 예스24 판매관리처럼 양식(form)이 없는 한 장 화면 — 머리·바닥에 검색 칸 · [로그인]은 type=button(누르면 fetch) 또는 단추 없이 비밀번호 칸의 진짜 Enter만 · 다른 곳 접속이면 '기존 접속을 끊을까요' 물음 */
  const spa = () => `<!doctype html><html><head><meta charset="utf-8"><title>로그인</title></head><body><div id="app"><header><input type="text" placeholder="통합검색"></header><main><input type="text" id="uid" placeholder="아이디"><input type="password" id="upw" placeholder="비밀번호">${S.spa === 'btn' ? '<button type="button" id="gob" class="btn">로그인</button>' : ''}<p id="msg"></p></main><footer><input type="text" placeholder="빠른 검색"></footer></div>
<script>const go=async()=>{const id=uid.value,pw=upw.value;const P=(x)=>fetch('/api/Login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)}).then((r)=>r.json());let r=await P({id,pw});
if(r.dup){if(!confirm('다른 곳에서 로그인 중입니다. 기존 접속을 끊고 로그인하시겠습니까?'))return;r=await P({id,pw,force:true})}if(r.ok)location.href='/';else msg.textContent='아이디 또는 비밀번호가 일치하지 않습니다.'};
${S.spa === 'btn' ? "gob.addEventListener('click',go)" : "upw.addEventListener('keyup',(e)=>{if(e.key==='Enter'&&e.isTrusted)go()})"}</script></body></html>`;
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title></head><body><h1>${h}</h1>${b}</body></html>`;
  const form = (x) => page('로그인', `<form method="post" action="/Account/Login"><input name="id"><input type="password" name="pw">${S.captcha ? '<div>보안문자를 입력해 주세요 <input name="captcha"></div>' : ''}<button>로그인</button></form>${x || ''}`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, type, body, x) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/Account/Login' && q.method === 'POST') { const f = new URLSearchParams(b); S.log.push({ login: true, okId: f.get('id') === ID, okPw: f.get('pw') === S.pw, t: Date.now() }); if (f.get('id') !== ID || f.get('pw') !== S.pw || S.captcha) return H(200, 'text/html', form('틀림')); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, 'text/html', '', { 'Set-Cookie': `sid=${id}; Path=/; HttpOnly`, Location: '/' }); }
      if (u.pathname === '/api/Login' && q.method === 'POST') { let j = {}; try { j = JSON.parse(b); } catch (e) {} if (S.dup && !j.force) { S.log.push({ dupAsk: true }); return H(200, 'application/json', '{"dup":true}'); } S.log.push({ login: true, spa: true, okId: j.id === ID, okPw: j.pw === S.pw, force: !!j.force, t: Date.now() });
        if (j.id !== ID || j.pw !== S.pw) return H(200, 'application/json', '{"ok":false}'); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(200, 'application/json', '{"ok":true}', { 'Set-Cookie': `sid=${id}; Path=/; HttpOnly` }); }
      S.log.push({ m: q.method, p: u.pathname, auth });
      if (u.pathname === '/Account/Login') return H(200, 'text/html', S.spa ? spa() : form());
      if (u.pathname.startsWith('/api/')) return auth ? H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], MENU_LIST: [] })) : H(401, 'application/json', '{}');
      if (!auth) return H(302, 'text/html', '', { Location: '/Account/Login' });
      return H(200, 'text/html', page('판매관리', '첫 화면')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }

(async () => {
  console.log('⑦ 속도 제한 — 순수 함수');
  { const { makeRelogin } = require(path.join(L.ROOT, 'helper', 'col2-relogin.js')); const os = require('os'); const D0 = fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')); const notes = [];
    const R = makeRelogin({ HOME: D0, cred: { has: () => true, PF: { y24: { name: '예스24' } }, sum: () => ({ y24: { has: true } }) }, cfg: () => ({ relogin: { perHour: 3, perDay: 5, gapMin: 0 } }), isLogger: () => false, note: (m) => notes.push(m) });
    const ctxFail = { name: '예스24', loginUrl: 'x', nav: async () => {}, ev: async () => '', sleep: async () => {}, type: async () => {}, check: async () => false };
    ok(R.why('y24', {}) === null, '조건이 맞으면 해도 됨'); ok(/출고 중/.test(R.why('y24', { hold: true })), '출고 중이면 미룸'); ok(/자리/.test(R.why('y24', { seat: false })), '자리를 못 받았으면 안 함');
    await R.run('y24', ctxFail); ok(!/멈춤/.test(R.why('y24', {}) || ''), '한 번 실패는 멈추지 않음'); await R.run('y24', ctxFail); ok(/멈춤 — 연속 2번 실패/.test(R.why('y24', {}) || ''), '연속 2번 실패면 멈춤', R.why('y24', {}));
    R.reset('y24'); ok(/한 시간 3번/.test(R.why('y24', {}) || '') === false, '멈춤 풀기'); await R.run('y24', ctxFail); R.reset('y24'); ok(/한 시간 3번까지/.test(R.why('y24', {}) || ''), '한 시간 3번까지', R.why('y24', {}));
    const R2 = makeRelogin({ HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')), cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({}), isLogger: () => false, note: () => {} }); await R2.run('y24', ctxFail); ok(/5분 기다림/.test(R2.why('y24', {}) || ''), '기본은 앞 시도 뒤 5분 기다림');
    const R3 = makeRelogin({ HOME: D0, cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({}), isLogger: () => true, note: () => {} }); ok(/로거/.test(R3.why('y24', {})), '로거 PC는 안 함');
    /* (11/10) 저장 전 확인 로그인 속도 — 앞 확인 뒤 40초 · 한 시간 4번 · 로거 거절 · 맞으면 멈춤 풂 */
    const R4 = makeRelogin({ HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')), cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({}), isLogger: () => false, note: () => {} });
    const v1 = await R4.tryWith('y24', ctxFail, 'a', 'b'); const v2 = await R4.tryWith('y24', ctxFail, 'a', 'b'); ok(!v1.ok && !v1.wait && v2.wait && /40초|초 뒤/.test(v2.why), '확인 로그인: 틀리면 까닭 · 바로 다시는 기다리라고(앞 확인 뒤 40초)', [v1, v2]);
    const R5 = makeRelogin({ HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')), cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({ relogin: { vGapSec: 0 } }), isLogger: () => false, note: () => {} });
    for (let i = 0; i < 4; i++) await R5.tryWith('y24', ctxFail, 'a', 'b'); const v5 = await R5.tryWith('y24', ctxFail, 'a', 'b'); ok(v5.wait && /한 시간 4번/.test(v5.why), '확인 로그인은 한 시간 4번까지(계정 잠김 막기)', v5);
    const R6 = makeRelogin({ HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')), cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({}), isLogger: () => true, note: () => {} }); ok(/로거/.test((await R6.tryWith('y24', ctxFail, 'a', 'b')).why), '로거 PC는 확인 로그인도 안 함');
    /* (11/10 밤 정범님 '확인 중만 오래 있다 그냥 풀려') 틀림(사이트가 틀렸다고 함)과 확인 못 함(화면이 안 열림·시간 넘음)을 가름 · 진행 단계 · 시간 넘음이면 다음 단계에서 멈춤 */
    { const R7 = makeRelogin({ HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')), cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({ relogin: { vGapSec: 0, vPerHour: 50 } }), isLogger: () => false, note: () => {} });
      const form = { pw: true, id: true }; const ctxBad = { name: '예스24', loginUrl: 'x', nav: async () => {}, ev: async (js) => (/captcha/.test(js) ? '' : /getClientRects/.test(js) ? form : /value\.length/.test(js) ? 1 : /focus\(\)/.test(js) ? true : 'click'), sleep: async () => {}, type: async () => {}, check: async () => false };
      const b1 = await R7.tryWith('y24', ctxBad, 'a', 'b'); ok(!b1.ok && b1.bad && !b1.unsure, "넣고 눌렀는데도 로그인 화면 = '틀림'(bad)", b1);
      const u1 = await R7.tryWith('y24', { ...ctxFail, nav: async () => { throw new Error('크롬 응답 없음: Page.navigate'); } }, 'a', 'b'); ok(!u1.ok && u1.unsure && !u1.bad && /크롬 응답 없음/.test(u1.why), "화면이 안 열리면 '확인 못 함'(unsure) — 틀림이 아님", u1);
      const jb = R7.jobStart('y24', 9); const seen = []; const ctxPh = { ...ctxFail, phase: (t) => { seen.push(t); return jb.ph(t); } }; await R7.tryWith('y24', ctxPh, 'a', 'b'); ok(seen.length >= 3 && /로그인 화면 여는 중/.test(seen[0]), '진행 단계를 차례로 알림', seen.join(' → '));
      jb.abort = true; const u2 = await R7.tryWith('y24', ctxPh, 'a', 'b'); ok(u2.unsure && /9초 안에 끝나지 않아 확인을 멈춤/.test(u2.why), '시간 넘음 표시가 서면 다음 단계에서 멈춤(더 진행하지 않음)', u2.why);
      R7.jobEnd('y24', { ok: false, kind: 'unsure', msg: '✗ 확인 못 함', canForce: true }); ok(!R7.jobOn('y24') && !R7.anyJob(), '확인 끝 = 도는 확인 없음'); }
    /* (11/11) 예전 판의 '[로그인]을 누르지 못한' 멈춤은 고친 판이 처음 켜질 때 한 번만 풂 · 보안 문자·틀린 값 멈춤은 그대로 */
    { const D9 = fs.mkdtempSync(path.join(os.tmpdir(), 'c2rl_')); const old = { y24: { tries: [Date.now()], fails: 2, stop: { at: Date.now(), why: '연속 2번 실패 — 로그인 뒤에도 로그인 화면(아이디·비밀번호가 틀렸거나 막힘)' }, auto: true, n: 2 }, al: { tries: [], fails: 1, stop: { at: Date.now(), why: '로그인 화면에 보안 문자 — 사람 손이 필요', human: true }, auto: true, n: 1 } };
      fs.writeFileSync(path.join(D9, 'relogin.json'), JSON.stringify(old)); const nt = []; const mk = () => makeRelogin({ HOME: D9, cred: { has: () => true, PF: { y24: {}, al: {} }, sum: () => ({ y24: {}, al: {} }) }, cfg: () => ({ relogin: { gapMin: 0 } }), isLogger: () => false, note: (m) => nt.push(m) });
      const R9 = mk(); ok(R9.why('y24', {}) === null && /멈춤/.test(R9.why('al', {}) || '') && nt.some((m) => /고친 판에서 한 번 풂/.test(m)), "고친 판이 켜지면 예전 '로그인 뒤에도 로그인 화면' 멈춤만 한 번 풂(보안 문자 멈춤은 그대로)", [R9.why('y24', {}), R9.why('al', {})]);
      fs.writeFileSync(path.join(D9, 'relogin.json'), JSON.stringify(old)); const R10 = mk(); ok(/멈춤/.test(R10.why('y24', {}) || ''), '두 번째 켜질 때부턴 풀지 않음(다시 2번 실패한 멈춤은 그대로)'); }
    { const { dlgOk } = require(path.join(L.ROOT, 'helper', 'col2-relogin.js')); ok(dlgOk('alert', 'x') && dlgOk('confirm', '다른 곳에서 로그인 중입니다. 기존 접속을 끊고 로그인하시겠습니까?') && !dlgOk('confirm', '상품을 삭제하시겠습니까?') && !dlgOk('confirm', '비밀번호를 변경하시겠습니까?') && !dlgOk('confirm', '발송처리 하시겠습니까?'), "로그인 중 물음: '기존 접속을 끊고 로그인'만 예 · 삭제·변경·발송은 아니오"); }
    const { ppStop } = require(path.join(L.ROOT, 'helper', 'col2-y24.js')); const T0 = Date.now(); ok(!ppStop([T0 - 1e3, T0 - 2e3], T0) && ppStop([T0 - 1e3, T0 - 2e3, T0 - 3e3], T0) && !ppStop([T0 - 4 * 3600e3, T0 - 1e3, T0 - 2e3], T0) && !ppStop([T0, T0, T0], T0, 0), '(11/10 예스24 계속 풀림) 로그인 뒤 금방 다시 풀림이 3시간에 3번이면 스스로 다시 로그인 멈춤(다른 곳 로그인과 서로 끊기 의심) · 0이면 끔'); }

  const Y = await fakeY24();
  const env = { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO };
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); const HOME = D + '/home'; fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: true, auto: false, headless: true, pc: 'MJ-TEST', pcSrc: 'pc', relogin: { gapMin: 0, perHour: 20, perDay: 50, vGapSec: 0, vPerHour: 50 }, y24cfg: { keepMin: 0.02, prdH: 0, tourH: 0, ppN: 0 }, watch: { tickSec: 60, handoffMs: 200 } }, env: { ...env, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  const st = async () => (await H.api('GET', '/status')).j; const y = async () => (await st()).y24;
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 0 }, hold: { on: false }, ...(b || {}) });
  const logins = () => Y.S.log.filter((x) => x.login);
  try {
    console.log('① 계정이 없으면 예전처럼 멈춤 · 로거·다른 출처 거절');
    await feed(); let s = await until(async () => { const v = await y(); return v.login === 'need' ? v : null; }, 80); await feed(); await wait(1500);
    ok(s && logins().length === 0 && /저장된 계정 없음/.test((await y()).msg), "계정이 없으면 '로그인 필요'에서 멈춤 · 로그인 시도 0 · 까닭 한 줄", (await y()).msg);
    let r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: 'https://www.aladin.co.kr' }); ok(r.st === 403 && !fs.existsSync(path.join(HOME, 'cred', 'y24.dat')), '다른 출처(알라딘·웹 화면)에서 온 저장은 거절');
    await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }); ok(r.st === 403 && /로거/.test(r.j.err) && !fs.existsSync(path.join(HOME, 'cred', 'y24.dat')), '로거 PC는 저장 거절(약속 0)', r.j && r.j.err);
    ok(JSON.stringify((await st()).relogin) === '{}' || !Object.values((await st()).relogin).some((v) => v.has), '로거 PC 상태엔 저장됨 표시도 없음');
    await H.api('POST', '/cfg', { pc: 'MJ-TEST', pcSrc: 'pc' });
    console.log('② 잠가 저장 → 세션이 풀리면 스스로 다시 로그인');
    /* (정범님 11/10 '저장을 누르면 먼저 맞는지 확인') 틀린 비밀번호 → 실제로 로그인해 보고 저장 안 함 · 까닭 */
    r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: 'wrong-' + PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(!r.j.ok && /다시 넣어 주세요/.test(r.j.err) && /틀렸거나/.test(r.j.err) && !fs.existsSync(path.join(HOME, 'cred', 'y24.dat')) && logins().length === 1 && !logins()[0].okPw && !JSON.stringify(r.j).includes(PW), '틀린 비밀번호 = 저장 전에 실제로 로그인해 봄 → 저장 안 함 · 「다시 넣어 주세요 · 까닭」', r.j.err);
    Y.S.log.length = 0;
    r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(r.j.ok && r.j.relogin.y24.has && !JSON.stringify(r.j).includes(PW) && !JSON.stringify(r.j).includes(ID), '잠가 저장 · 답에는 저장됨 표시만(값 없음)', r.j && r.j.err);
    const cf = fs.readFileSync(path.join(HOME, 'cred', 'y24.dat'), 'utf8'); ok(!cf.includes(PW) && !cf.includes(ID) && JSON.parse(cf).v === 1, '잠근 파일에도 원문은 없음(잠근 값만)');
    await feed(); s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' ? v : null; }, 120);
    ok(s && s.login === 'ok' && logins().length === 1 && logins()[0].okId && logins()[0].okPw, '세션이 풀려 있었으니 확인 로그인이 곧 다시 로그인 → 살아남(로그인 한 번)', JSON.stringify(logins()));
    let jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/계정 확인 — 로그인 됨/.test(jl) && /맞지 않아 저장하지 않음/.test(jl), '기록에 확인 로그인 결과(맞음·틀림 — 값 없음)');
    /* 세션이 살아 있을 때 저장 = 따로 된 임시 창에서 확인 · 본 세션은 그대로 */ { const sess0 = [...Y.S.sess]; const n0 = logins().length; r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` });
      ok(r.j.ok && logins().length === n0 + 1 && sess0.every((x) => Y.S.sess.has(x)) && (await y()).login === 'ok', '세션이 살아 있을 때 = 쿠키가 따로인 임시 창에서 로그인해 확인 · 살아 있던 세션 그대로', { ok: r.j, n: logins().length - n0 }); }
    const n1 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); await feed();
    s = await until(async () => { await feed(); return logins().length > n1 && (await y()).login === 'ok'; }, 160); ok(s, '다시 세션이 풀리면(로그아웃) 스스로 또 로그인', logins().length - n1);
    jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/스스로 다시 로그인함/.test(jl) && /스스로 다시 로그인 됨/.test(jl), '기록에 다시 로그인한 일·결과');
    console.log('③ 비밀번호·아이디가 잠근 파일 밖 어디에도 없음');
    { const leak = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let s0; try { s0 = fs.lstatSync(p); } catch (e) { continue; } if (s0.isSymbolicLink()) continue; if (s0.isDirectory()) walk(p); else if (s0.size < 64e6) { const b = fs.readFileSync(p); if (b.includes(PW) || b.includes(Buffer.from(PW, 'utf16le'))) leak.push(path.relative(HOME, p) + '(비번)'); if (b.includes(ID) || b.includes(Buffer.from(ID, 'utf16le'))) leak.push(path.relative(HOME, p) + '(아이디)'); } } }; walk(HOME);
      { let P0 = {}; try { P0 = JSON.parse(fs.readFileSync(path.join(HOME, 'col2-y24-chrome', 'Default', 'Preferences'), 'utf8')); } catch (e) {} ok(P0.session && P0.session.restore_on_startup === 1 && P0.profile && P0.profile.password_manager_leak_detection === false && P0.profile.password_manager_enabled === false, "(11/10 예스24 계속 풀림) 번외 예스24 크롬 프로필 = '중단한 위치에서 계속'(세션 쿠키 지킴) · 비밀번호 저장·유출 확인 끔", { s: P0.session, p: P0.profile && { e: P0.profile.password_manager_enabled, l: P0.profile.password_manager_leak_detection } }); }
      ok(!leak.length, '도우미 폴더 전부(설정·기록·journal·relogin.json·크롬 프로필 포함)에 비밀번호·아이디 원문 없음', leak); }
    { const all = JSON.stringify(await st()) + (await H.req('GET', '/log/all', null, { 'X-RN-Col2': '1' })).b + H.out(); ok(!all.includes(PW) && !all.includes(ID), '상태(/status — 웹앱이 col2_ctl로 올리는 것)·기록창·도우미 출력에도 없음'); }
    console.log('④ 출고 중엔 다시 로그인도 미룸');
    const n2 = logins().length; Y.S.sess.clear(); await feed({ hold: { on: true, why: '시험 출고' } }); await H.api('POST', '/y24/run', { what: 'ord' }); await wait(4000); await feed({ hold: { on: true, why: '시험 출고' } }); await wait(3000);
    ok(logins().length === n2, '🚚 출고 중엔 세션이 풀려도 로그인하지 않음', logins().length - n2);
    s = await until(async () => { await feed(); return logins().length > n2 && (await y()).login === 'ok'; }, 160); ok(s, '출고가 끝나면 그때 다시 로그인');
    console.log('⑤ 비밀번호가 틀리면 연속 2번에서 멈춤');
    Y.S.pw = 'changed-' + PW; const n3 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' });
    s = await until(async () => { await feed(); const v = await st(); return v.relogin.y24.stop ? v : null; }, 200);
    ok(s && logins().length === n3 + 2 && /연속 2번 실패/.test(s.relogin.y24.stop.why), '연속 2번 틀리면 멈추고 알림(계정 잠김 막기)', s && s.relogin.y24.stop); await feed(); await wait(3000); ok(logins().length === n3 + 2, '멈춘 뒤엔 더 두드리지 않음');
    jl = (await H.api('GET', '/log/lines?after=0')).j.lines.filter((e) => e.l === 'err').map((e) => e.x).join('\n'); ok(/연속 2번 실패/.test(jl), '기록창에 오류 줄(⛔)');
    Y.S.pw = PW; r = await H.api('POST', '/cred/reset', { pf: 'y24' }); ok(r.j.ok && !r.j.relogin.y24.stop, '[다시 해 보기] — 멈춤 풀기');
    s = await until(async () => { await feed(); return (await y()).login === 'ok'; }, 160); ok(s, '풀면 다시 로그인');
    console.log('⑥ 보안 문자 화면이면 곧바로 멈춤');
    Y.S.captcha = true; const n4 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' });
    s = await until(async () => { await feed(); const v = await st(); return v.relogin.y24.stop ? v : null; }, 160);
    ok(s && s.relogin.y24.stop.human && /보안/.test(s.relogin.y24.stop.why) && logins().length === n4, '보안 문자가 보이면 한 번도 누르지 않고 멈춤 · 정범님께 알림', s && s.relogin.y24.stop);
    { const n5 = logins().length; const r6 = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(!r6.j.ok && r6.j.human && /보안/.test(r6.j.err) && /직접 한 번/.test(r6.j.err) && logins().length === n5, '저장 전 확인에서 보안 문자가 보이면 = 저장 안 함 · 그 사실과 직접 로그인 안내(누르지 않음)', r6.j.err);
      await feed({ hold: { on: true, why: '시험 출고' } }); const r7 = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(!r7.j.ok && r7.j.wait && /출고 중/.test(r7.j.err) && logins().length === n5, '🚚 출고 중엔 확인 로그인도 안 함 → 「지금은 확인할 수 없어 저장하지 않았습니다」', r7.j.err); await feed(); }
    Y.S.captcha = false;
    console.log('⑨ (11/11 정범님 \'예스24 아이디·비번이 안 먹힘\') 양식 없는 한 장 화면 · 진짜 Enter · 다른 곳 접속 물음 · 「직접 로그인하는 중」 오판');
    { await H.api('POST', '/cred/reset', { pf: 'y24' }); Y.S.spa = 'btn'; Y.S.dup = true; const n6 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' });
      s = await until(async () => { await feed(); return logins().length > n6 && (await y()).login === 'ok' ? await st() : null; }, 200); const L6 = logins().slice(n6);
      ok(s && L6.length === 1 && L6[0].spa && L6[0].okId && L6[0].okPw && L6[0].force && !s.relogin.y24.stop, "양식 없는 화면(type=button [로그인]) — 머리·바닥 검색 칸이 아니라 비밀번호 앞 칸에 아이디 · 단추를 눌러 로그인 · '기존 접속을 끊고 로그인' 물음엔 예", { L6, stop: s && s.relogin.y24.stop });
      ok(s && s.y24.pg && !s.y24.pg.login, '로그인 뒤 창 주소 = 로그인 화면 아님(화면 표시도 그대로)', s && s.y24.pg);
      Y.S.dup = false; Y.S.spa = 'enter'; const n7 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' });
      s = await until(async () => { await feed(); return logins().length > n7 && (await y()).login === 'ok'; }, 200); ok(s && logins().slice(n7).every((x) => x.spa && x.okPw), '단추가 없고 진짜 Enter(isTrusted)에만 반응하는 화면도 로그인됨(예전 가짜 keydown은 못 함)', logins().slice(n7));
      /* 「직접 로그인하는 중」 — [🔐 예스24 로그인]으로 창만 띄우고 아무도 안 치면 */
      Y.S.spa = 'btn'; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); await until(async () => { await feed(); return (await y()).login === 'need'; }, 120);
      { const sw = await H.api('GET', '/status'); const p0 = sw.j.y24.pg; ok(p0 && p0.login, "세션이 풀리면 창 주소(로그인 화면)로도 '로그인 안 됨' 표시", p0); }
      await H.api('POST', '/cred/auto', { pf: 'y24', on: false }); r = await H.api('POST', '/y24/login', { why: '시험' }); ok(r.j.ok && (await y()).login === 'wait', '[🔐 예스24 로그인] = 창을 앞으로 · 기다림', r.j);
      r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(!r.j.ok && r.j.wait && /칠 수 있게/.test(r.j.err), '창을 막 띄운 때만 「사람이 칠 수 있게 기다림」(그 뒤엔 입력이 없으면 기다리지 않음)', r.j.err);
      await wait(5200); const n8 = logins().length; r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` });
      ok(r.j.ok && logins().length === n8 + 1 && (await y()).login === 'ok', "창에 입력이 없으면 「직접 로그인하는 중」으로 막지 않고 넣은 값으로 확인 → 저장 · 로그인", r.j.err || r.j.msg);
      await H.api('POST', '/cred/auto', { pf: 'y24', on: true }); Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); await until(async () => { await feed(); return (await y()).login === 'need'; }, 120);
      await H.api('POST', '/y24/login', { why: '시험' }); const n9 = logins().length;
      s = await until(async () => { await feed(); return logins().length > n9 && (await y()).login === 'ok'; }, 200); jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n');
      ok(s && /입력이 없어 기다림을 끝냄/.test(jl), '창만 떠 있고 입력이 없으면 저장된 계정으로 번외가 스스로 로그인(기다림을 끝냄)', logins().length - n9);
      Y.S.spa = ''; }
    console.log('⑧ 화면 — 계정 칸 · 로거는 칸이 없음');
    { const pg = await (await (await L.chromium().launch()).newContext()).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1500); await pg.click('#setBtn').catch(() => {}); await pg.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ await wait(500);
      const v1 = await pg.evaluate(() => { const b = document.getElementById('crbox'); return { has: !!b, shown: !!b && getComputedStyle(b).display !== 'none', st: ((document.getElementById('crbadge_y24') || {}).textContent || '') + ((document.getElementById('crs_y24') || {}).textContent || ''), pwType: (document.getElementById('crp_y24') || {}).type }; });
      ok(v1.has && v1.shown && /저장됨/.test(v1.st) && v1.pwType === 'password' && !v1.st.includes(ID), '⚙에 🔐 계정 칸(비밀번호는 가린 칸 · 상태엔 저장됨만)', v1);
      const v9 = await pg.evaluate(() => { const g = document.getElementById('tgy'); const own = document.getElementById('ownbox'); const first = g && g.querySelector('input[type=checkbox]'); const em = own && [...own.querySelectorAll('span')].find((x) => x.textContent.includes('🏠')); return { first: first && first.id, txt: own ? own.textContent : '', ib: !!(own && own.querySelector('.ib')), emSize: em ? parseFloat(getComputedStyle(em).fontSize) : 0, btn: (document.getElementById('crb_y24') || {}).textContent, btnA: (document.getElementById('crb_al') || {}).textContent }; });
      ok(v9.first === 'tg_alown' && /🏠/.test(v9.txt) && /켜기/.test(v9.txt) && /켜면:/.test(v9.txt) && v9.ib && v9.emSize >= 16, "(정범님 11/10) '일 켜기·끄기' 맨 위 = 🏠 큰 글씨 '켜기 — 이 PC 알라딘 로그인 자리를 번외가 이어받음' + 켜면 무엇이 바뀌는지 한 줄", v9);
      ok(v9.btn === '확인하고 저장' && v9.btnA === '확인하고 저장', "계정 단추 = '확인하고 저장'(저장 전에 실제로 로그인해 봄)", v9);
      await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); await pg.reload(); await wait(1800); await pg.click('#setBtn').catch(() => {}); await pg.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ await wait(500);
      const v2 = await pg.evaluate(() => { const b = document.getElementById('crbox'); return !b || getComputedStyle(b).display === 'none'; }); ok(v2, '로거 PC 화면엔 계정 칸 자체가 안 보임(약속 0)');
      await pg.context().browser().close(); await H.api('POST', '/cfg', { pc: 'MJ-TEST', pcSrc: 'pc' }); }
    const src = ['col2-cred.js', 'col2-relogin.js'].map((f) => fs.readFileSync(path.join(L.ROOT, 'helper', f), 'utf8')).join('\n'); ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), '팝업 함수 없음');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); L.done('t_relogin');
})();
