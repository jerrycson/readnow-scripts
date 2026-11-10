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

function fakeY24() { const S = { pw: PW, sess: new Set(), log: [], captcha: false };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title></head><body><h1>${h}</h1>${b}</body></html>`;
  const form = (x) => page('로그인', `<form method="post" action="/Account/Login"><input name="id"><input type="password" name="pw">${S.captcha ? '<div>보안문자를 입력해 주세요 <input name="captcha"></div>' : ''}<button>로그인</button></form>${x || ''}`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, type, body, x) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/Account/Login' && q.method === 'POST') { const f = new URLSearchParams(b); S.log.push({ login: true, okId: f.get('id') === ID, okPw: f.get('pw') === S.pw, t: Date.now() }); if (f.get('id') !== ID || f.get('pw') !== S.pw || S.captcha) return H(200, 'text/html', form('틀림')); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, 'text/html', '', { 'Set-Cookie': `sid=${id}; Path=/; HttpOnly`, Location: '/' }); }
      S.log.push({ m: q.method, p: u.pathname, auth });
      if (u.pathname === '/Account/Login') return H(200, 'text/html', form());
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
    const R3 = makeRelogin({ HOME: D0, cred: { has: () => true, PF: {}, sum: () => ({}) }, cfg: () => ({}), isLogger: () => true, note: () => {} }); ok(/로거/.test(R3.why('y24', {})), '로거 PC는 안 함'); }

  const Y = await fakeY24();
  const env = { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO };
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); const HOME = D + '/home'; fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: true, auto: false, headless: true, pc: 'MJ-TEST', pcSrc: 'pc', relogin: { gapMin: 0, perHour: 20, perDay: 50 }, y24cfg: { keepMin: 0.02, prdH: 0, tourH: 0 }, watch: { tickSec: 60, handoffMs: 200 } }, env: { ...env, RN_COL2_DPAPI: D + '/bin/dpapi' } });
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
    r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(r.j.ok && r.j.relogin.y24.has && !JSON.stringify(r.j).includes(PW) && !JSON.stringify(r.j).includes(ID), '잠가 저장 · 답에는 저장됨 표시만(값 없음)');
    const cf = fs.readFileSync(path.join(HOME, 'cred', 'y24.dat'), 'utf8'); ok(!cf.includes(PW) && !cf.includes(ID) && JSON.parse(cf).v === 1, '잠근 파일에도 원문은 없음(잠근 값만)');
    await feed(); s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' ? v : null; }, 120);
    ok(s && s.login === 'ok' && logins().length === 1 && logins()[0].okId && logins()[0].okPw, '세션이 풀려 있으니 저장된 계정으로 한 번 로그인 → 살아남', JSON.stringify(logins()));
    let jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/스스로 다시 로그인함/.test(jl) && /스스로 다시 로그인 됨/.test(jl), '기록에 다시 로그인한 일·결과');
    const n1 = logins().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); await feed();
    s = await until(async () => { await feed(); return logins().length > n1 && (await y()).login === 'ok'; }, 160); ok(s, '다시 세션이 풀리면(로그아웃) 스스로 또 로그인', logins().length - n1);
    console.log('③ 비밀번호·아이디가 잠근 파일 밖 어디에도 없음');
    { const leak = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let s0; try { s0 = fs.lstatSync(p); } catch (e) { continue; } if (s0.isSymbolicLink()) continue; if (s0.isDirectory()) walk(p); else if (s0.size < 64e6) { const b = fs.readFileSync(p); if (b.includes(PW) || b.includes(Buffer.from(PW, 'utf16le'))) leak.push(path.relative(HOME, p) + '(비번)'); if (b.includes(ID) || b.includes(Buffer.from(ID, 'utf16le'))) leak.push(path.relative(HOME, p) + '(아이디)'); } } }; walk(HOME);
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
    Y.S.captcha = false;
    console.log('⑧ 화면 — 계정 칸 · 로거는 칸이 없음');
    { const pg = await (await (await L.chromium().launch()).newContext()).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1500); await pg.click('#setBtn').catch(() => {}); await wait(500);
      const v1 = await pg.evaluate(() => { const b = document.getElementById('crbox'); return { has: !!b, shown: !!b && getComputedStyle(b).display !== 'none', st: (document.getElementById('crs_y24') || {}).textContent || '', pwType: (document.getElementById('crp_y24') || {}).type }; });
      ok(v1.has && v1.shown && /저장됨/.test(v1.st) && v1.pwType === 'password' && !v1.st.includes(ID), '⚙에 🔐 계정 칸(비밀번호는 가린 칸 · 상태엔 저장됨만)', v1);
      await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); await pg.reload(); await wait(1800); await pg.click('#setBtn').catch(() => {}); await wait(500);
      const v2 = await pg.evaluate(() => { const b = document.getElementById('crbox'); return !b || getComputedStyle(b).display === 'none'; }); ok(v2, '로거 PC 화면엔 계정 칸 자체가 안 보임(약속 0)');
      await pg.context().browser().close(); await H.api('POST', '/cfg', { pc: 'MJ-TEST', pcSrc: 'pc' }); }
    const src = ['col2-cred.js', 'col2-relogin.js'].map((f) => fs.readFileSync(path.join(L.ROOT, 'helper', f), 'utf8')).join('\n'); ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), '팝업 함수 없음');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); L.done('t_relogin');
})();
