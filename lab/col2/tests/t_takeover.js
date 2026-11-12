/* t_takeover — (11/12 login1 · 정범님 '번외가 3일째 예스24·알라딘 로그인조차 제대로 못 함 — 당장 해결')
 *  진단(11/12 09:06 HOME): 예스24 'need' · 「이미 로그인된 예스24」 화면에서 멈춤(다른 곳 — 휴대폰·다른 크롬 — 의 판매관리 로그인이 HOME 세션을 끊음 · 저장 계정 있음)
 *  가짜 예스24: 다른 곳 세션이 있으면 [로그인] 뒤 /Login/AlreadyLoginedYes24 화면(「이미 다른 곳에서 로그인되어 있습니다」 · [취소] [기존 로그인 해제 후 로그인])
 *  ① 이어받기(기본 켬): 저장 계정으로 [로그인] → 그 화면 → [기존 로그인 해제 후 로그인](취소는 안 누름) → 로그인 됨 · 끊긴 횟수·이어받은 횟수·한 줄 안내 · 값 틀림으로 보지 않음
 *  ② 첫 화면부터 「이미 로그인된」 화면이어도 이어받음 · ③ 한 시간 3번 상한 · ④ 🚚 출고 중엔 안 함 · ⑤ 설정으로 끄면 예전처럼 멈춤(까닭에 '꺼 둠')
 *  ⑥ 단추를 못 찾으면 화면 단추 글을 남기고 멈춤(아이디·비밀번호 틀림으로 보지 않음)
 * 실행: node tests/t_takeover.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const ID = 'sellerid' + Math.random().toString(36).slice(2, 8), PW = 'Pw!' + Math.random().toString(36).slice(2, 12);
function fakeY24() { const S = { sess: new Set(), other: false, log: [], btn: '기존 로그인 해제 후 로그인', pend: new Set() };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title></head><body><h1>${h}</h1>${b}</body></html>`;
  const form = () => page('로그인', '<form method="post" action="/Account/Login"><input name="id"><input type="password" name="pw"><button>로그인</button></form>');
  const already = () => page('이미 로그인', `<p>이미 다른 곳에서 로그인되어 있습니다. 기존 로그인을 해제하고 로그인하시겠습니까?</p><button type="button" id="no" onclick="location.href='/Account/Login'">취소</button><button type="button" id="yes">${S.btn}</button>
<script>yes.onclick=async()=>{const r=await fetch('/api/Login/AlreadyLoginedYes24Init',{method:'POST'}).then((x)=>x.json());if(r.ok)location.href='/';};</script>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const pk = (q.headers.cookie || '').match(/pend=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, type, body, x) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8', ...(x || {}) }); s.end(body); };
      const give = () => { const id = Math.random().toString(36).slice(2); S.sess.add(id); return `sid=${id}; Path=/; HttpOnly`; };
      if (u.pathname === '/Account/Login' && q.method === 'POST') { const f = new URLSearchParams(b); const good = f.get('id') === ID && f.get('pw') === PW; S.log.push({ login: true, good, t: Date.now() }); if (!good) return H(200, 'text/html', form());
        if (S.other) { const p = Math.random().toString(36).slice(2); S.pend.add(p); return H(302, 'text/html', '', { Location: '/Login/AlreadyLoginedYes24', 'Set-Cookie': `pend=${p}; Path=/` }); } return H(302, 'text/html', '', { Location: '/', 'Set-Cookie': give() }); }
      if (u.pathname === '/api/Login/AlreadyLoginedYes24Init' && q.method === 'POST') { const okp = !!(pk && S.pend.has(pk[1])); S.log.push({ take: true, okp }); if (!okp) return H(200, 'application/json', '{"ok":false}'); S.pend.delete(pk[1]); S.other = false; return H(200, 'application/json', '{"ok":true}', { 'Set-Cookie': give() }); }
      S.log.push({ m: q.method, p: u.pathname, auth });
      if (u.pathname === '/Login/AlreadyLoginedYes24') return H(200, 'text/html', already());
      if (u.pathname === '/Account/Login') return H(200, 'text/html', form());
      if (u.pathname.startsWith('/api/')) return auth ? H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], MENU_LIST: [] })) : H(401, 'application/json', '{}');
      if (!auth) { const f1 = S.first; S.first = false; return H(302, 'text/html', '', { Location: f1 ? '/Login/AlreadyLoginedYes24' : '/Account/Login' }); }
      return H(200, 'text/html', page('판매관리', '첫 화면')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
(async () => {
  { const src = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-y24.js'), 'utf8'); const a = src.indexOf('const TAKE_PAGE'), b = src.indexOf('const isLoginUrl'); const JT = new Function(src.slice(a, b) + ';return JS_TAKE;')();
    let bad = 0; for (const c of [true, false]) { try { new Function(JT(c)); } catch (e) { bad++; } } ok(!bad && /취소\|아니오/.test(JT(true)), '이어받기 화면 코드 = 올바른 JS · 취소·아니오는 누르지 않는 목록에 있음'); }
  const Y = await fakeY24();
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: true, auto: false, headless: true, pc: 'MJ-TEST', pcSrc: 'pc', relogin: { gapMin: 0, perHour: 50, perDay: 99, vGapSec: 0, vPerHour: 50 }, y24cfg: { keepMin: 0.02, prdH: 0, tourH: 0, ppN: 0, tkHour: 10 }, watch: { tickSec: 60, handoffMs: 200 } }, env: { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  const st = async () => (await H.api('GET', '/status')).j; const y = async () => (await st()).y24;
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 0 }, hold: { on: false }, ...(b || {}) });
  const takes = () => Y.S.log.filter((x) => x.take).length; const cut = () => { Y.S.sess.clear(); Y.S.other = true; };
  const lines = async () => (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n');
  try {
    let r = await H.api('POST', '/cred/save', { pf: 'y24', id: ID, pw: PW }, { Origin: `http://127.0.0.1:${H.port}` }); ok(r.j.ok, '계정 잠가 저장(확인 로그인)', r.j && r.j.err);
    let s = await until(async () => { await feed(); return (await y()).login === 'ok'; }, 160); ok(s, '처음 로그인 됨');
    console.log('① 다른 곳 로그인이 이 PC 세션을 끊음 → 「이미 로그인된」 화면에서 이어받기');
    cut(); await H.api('POST', '/y24/run', { what: 'ord' });
    s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' && takes() >= 1 ? v : null; }, 240);
    ok(s && takes() === 1 && !Y.S.other, '저장 계정으로 [로그인] → 「이미 로그인된」 화면 → [기존 로그인 해제 후 로그인] → 로그인 됨', { takes: takes(), y: s && s.tk });
    ok(!Y.S.log.some((x) => x.p === '/Account/Login' && x.m === 'GET' && false), '취소(로그인 화면으로)를 누르지 않음');
    ok(s && s.tk && s.tk.kicks >= 1 && s.tk.today === 1 && s.tk.last && s.tk.last.ok === true && /기존 로그인 해제/.test(s.tk.last.btn), '끊긴 횟수·이어받은 횟수·마지막 결과(누른 단추 글)를 상태에 남김', s && s.tk);
    ok(s && /다른 곳 로그인에 \d+번 끊김/.test(s.msg) && /다시 가져감/.test(s.msg) && s.msg.indexOf('🔁') === 0, "번외 상태 글 맨 앞에 '🔁 오늘 다른 곳 로그인에 n번 끊김 → 다시 가져옴 · 다른 곳에서 판매관리를 열면 다시 가져감'(웹앱 col2_ctl로 감)", s && s.msg);
    let st0 = await st(); ok(!st0.relogin.y24.stop && st0.relogin.y24.chk !== 'bad' && !st0.y24.already, '값 틀림으로 보지 않음 · 멈춤 없음 · 웹앱에 「이미 로그인된」 멈춤 경보 안 감', { stop: st0.relogin.y24.stop, chk: st0.relogin.y24.chk });
    let jl = await lines(); ok(/다른 곳.*세션을 끊고 MJ-TEST가 이어받음/.test(jl) && !jl.includes(PW) && !jl.includes(ID), '기록에 이어받음(값 없음)');
    console.log('② 첫 화면부터 「이미 로그인된」 화면');
    Y.S.sess.clear(); Y.S.other = true; Y.S.first = true; const p0 = Y.S.pend.size; await H.api('POST', '/y24/run', { what: 'ord' });
    s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' && takes() >= 2 ? v : null; }, 240); Y.S.first = false;
    ok(s && takes() >= 2, '첫 화면이 「이미 로그인된」이어도 로그인 칸으로 다시 가서 이어받기까지 됨', { takes: takes(), msg: s && s.msg });
    console.log('③ 한 시간 상한(설정 tkHour · 기본 3)');
    { const hn = (await y()).tk.hour; const r3 = await H.api('POST', '/set', { k: 'y24cfg.tkHour', v: hn + 1 }); ok(r3.j && r3.j.ok !== false, '설정 y24cfg.tkHour(이 PC만)', r3.j); }
    { const t2 = takes(); cut(); await H.api('POST', '/y24/run', { what: 'ord' }); s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' && takes() > t2 ? v : null; }, 240); ok(s, '상한 안이면 또 이어받음'); }
    cut(); const t3 = takes(); await H.api('POST', '/y24/run', { what: 'ord' }); s = await until(async () => { await feed(); const v = await y(); return v.login === 'need' && v.tk && v.tk.why && v.already && v.reWhy ? v : null; }, 200); await feed(); await wait(2500);
    ok(s && takes() === t3 && /한 시간 \d+번까지/.test(s.tk.why) && s.already && /이어받기 안 하는 까닭|이어받지 않음/.test(((s.reWhy && s.reWhy.why) || '') + s.msg), '상한이 차면 하지 않고 멈춤 · 까닭(한 시간 n번 · 몇 시 뒤 다시) · 웹앱에 멈춤 표시', s && JSON.stringify({ n: takes() - t3, why: s.tk.why, al: s.already, re: s.reWhy, msg: s.msg }));
    const st1 = await st(); ok(st1.relogin.y24.chk !== 'bad' && !(st1.relogin.y24.stop && st1.relogin.y24.stop.bad), '상한에 막혀도 값 틀림으로 보지 않음', st1.relogin.y24);
    ok(fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-y24.js'), 'utf8').includes('takeover: true, tkHour: 3'), '실제 기본값 = 켬 · 한 시간 3번');
    console.log('④ 출고 중엔 안 함 · ⑤ 설정으로 끄면 예전처럼 멈춤');
    await H.api('POST', '/set', { list: [{ k: 'y24cfg.tkHour', v: 10 }, { k: 'y24cfg.takeover', v: false }] }); await H.api('POST', '/cred/reset', { pf: 'y24' }); await feed(); await wait(2500);
    s = await y();
    ok(s.login === 'need' && takes() === t3 && /꺼 둠/.test(s.tk.why || ''), "설정 y24cfg.takeover 끔 → 이어받지 않음(까닭 '꺼 둠')", s.tk);
    await H.api('POST', '/set', { k: 'y24cfg.takeover', v: true }); await H.api('POST', '/cred/reset', { pf: 'y24' }); await feed({ hold: { on: true, why: '시험 출고' } }); await wait(3000); await feed({ hold: { on: true, why: '시험 출고' } }); await wait(2000);
    ok(takes() === t3 && (await y()).login === 'need', '🚚 출고 중엔 이어받지 않음');
    s = await until(async () => { await feed(); const v = await y(); return v.login === 'ok' && takes() > t3 ? v : null; }, 240); ok(s && takes() === t3 + 1, '출고가 끝나면 이어받음', takes() - t3);
    console.log('⑥ 단추를 못 찾음');
    Y.S.btn = '다음에'; cut(); const t5 = takes(); await H.api('POST', '/y24/run', { what: 'ord' });
    s = await until(async () => { await feed(); const v = await st(); return v.y24.tk && v.y24.tk.btns && v.y24.tk.btns.includes('다음에') && v.relogin.y24.last && !v.relogin.y24.last.ok ? v : null; }, 200);
    ok(s && takes() === t5 && s.y24.tk.btns.includes('취소') && /단추를 못 찾음/.test(s.relogin.y24.last.why) && s.relogin.y24.chk !== 'bad', '모르는 단추면 누르지 않음 · 화면 단추 글을 진단에 남김 · 값 틀림으로 보지 않음', s && { btns: s.y24.tk.btns, last: s.relogin.y24.last });
    const all = JSON.stringify(await st()) + H.out(); ok(!all.includes(PW) && !all.includes(ID), '상태·도우미 출력에 아이디·비밀번호 없음');
  } finally { await H.stop(); Y.srv.close(); }
  L.done('t_takeover');
})().catch((e) => { console.error(e); process.exit(1); });
