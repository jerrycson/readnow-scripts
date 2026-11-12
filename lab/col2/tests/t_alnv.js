/* t_alnv — (11/12 login1) 🔐 알라딘 스스로 다시 로그인 「네이버로 로그인」 = 평범한 크롬 창 (진단 11/12 09:06 HOME '연속 2번 실패 — 네이버로 로그인 뒤에도 샵매니저가 로그인 화면')
 *  가짜 알라딘: /login/wlogin_naver.aspx — 브라우저에 네이버 '로그인 상태 유지'(쿠키 nidkeep)가 있으면 알라딘 세션을 줌 · 없으면 네이버 로그인 화면(/nidlogin.login)으로
 *   · 조종 크롬(--remote-debugging)에서 온 새 로그인은 막음(42FB 흉내 — 요청 머리에 조종 표시가 없으니 시험은 '평범한 창 표시' 쿠키로 가름: 평범한 창만 nidkeep를 갖게 둠)
 *  ① 네이버 로그인 상태가 없으면: 평범한 창을 띄웠다 닫고 → '사람 손 필요'로 곧바로 멈춤(아이디 길로 두드리지 않음) · 크게 한 줄 할 일 · 단추 하나
 *  ② 사람이 한 번(평범한 창에서 네이버 로그인 상태 유지) → 세션 살아남 → 멈춤이 저절로 풀림
 *  ③ 세션이 다시 풀리면 평범한 창으로 값 없이 다시 로그인 → 이어 감 · 평범한 창 플래그에 조종 길 없음
 * 실행: node tests/t_alnv.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
function fakeScm() { const S = { sess: new Set(), log: [], keep: false }; const OUT = '<a href="/scm/wC2Cuser_logout.aspx">로그아웃</a>';
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const c = q.headers.cookie || ''; const ck = c.match(/asid=(\w+)/); const auth = S.all || !!(ck && S.sess.has(ck[1])); /* S.all = 이 기기 로그인됨(쿠키를 디스크에 쓰는 때와 상관없이 흐름만 봄 — 쿠키 이어짐은 t_human ③) */ q.on('data', () => {}); q.on('end', () => {
      const H = (code, body, x) => { s.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/login/wlogin_naver.aspx') { S.log.push({ nv: true, keep: /nidkeep=1/.test(c) || S.keep }); if (!(/nidkeep=1/.test(c) || S.keep)) return H(302, '', { Location: '/nidlogin.login' });
        const id = Math.random().toString(36).slice(2); S.sess.add(id); S.all = true; return H(200, `<!doctype html><meta charset="utf-8"><title>알라딘</title><script>setTimeout(()=>location.href='/scm/wmain.aspx',200)</script>`, { 'Set-Cookie': `asid=${id}; Path=/; HttpOnly` }); }
      if (u.pathname === '/nidlogin.login') { S.log.push({ nidLogin: true }); return H(200, '<!doctype html><meta charset="utf-8"><title>네이버 : 로그인</title><input name="id"><input type="password" name="pw">'); }
      if (u.pathname === '/login/wlogin.aspx' && q.method === 'POST') { S.log.push({ idLogin: true }); return H(200, '<title>로그인</title>로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-7046)'); }
      if (u.pathname === '/login/wlogin.aspx') return H(200, `<!doctype html><meta charset="utf-8"><title>로그인</title><form method="post" action="/login/wlogin.aspx"><input name="id"><input type="password" name="pw"><button>로그인</button></form>`);
      if (u.pathname.startsWith('/scm/')) { if (!auth) return H(302, '', { Location: '/login/wlogin.aspx?returnurl=' + encodeURIComponent(u.pathname) }); return H(200, `<!doctype html><meta charset="utf-8"><title>샵매니저</title>${OUT}<h1>샵매니저</h1>`); }
      return H(200, '<title>알라딘</title>'); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
(async () => {
  const A = await fakeScm(); const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_'));
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200, plainSec: 3 };
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: false, al: true, alOwn: true, auto: false, headless: true, pc: 'HOME', hands: false, pcSrc: 'pc', alcfg, relogin: { gapMin: 0, perHour: 20, perDay: 50 }, watch: { tickSec: 60, handoffMs: 200 } },
    env: { RN_COL2_ALSCM: A.base, RN_COL2_AL_SCALE: '1', RN_COL2_CORE_DIR: L.PROD_REPO } });
  const st = async () => (await H.api('GET', '/status')).j; const al = async () => (await st()).al;
  const feed = () => H.api('POST', '/al/feed', { by: '시험 수집기', seat: { ok: true }, hold: { on: false } });
  const nv = () => A.S.log.filter((x) => x.nv).length;
  try {
    console.log('① 네이버 로그인 상태가 없음 → 평범한 창으로 한 번 → 사람 손 필요로 멈춤');
    let a = await until(async () => { await feed(); const v = await st(); return v.relogin.al && v.relogin.al.stop ? v : null; }, 240);
    ok(a && nv() === 1 && A.S.log.some((x) => x.nidLogin) && !A.S.log.some((x) => x.idLogin), '네이버 길 한 번(평범한 창) → 네이버 로그인 화면 → 아이디 길로 두드리지 않음(42FB 점수 쌓지 않음)', { nv: nv(), log: A.S.log.filter((x) => !x.m).slice(-6) });
    ok(a && a.relogin.al.stop.human && /로그인 상태 유지/.test(a.relogin.al.stop.why), "멈춤 = 사람 손 필요(까닭: 이 번외 크롬에 네이버 '로그인 상태 유지'가 없음)", a && a.relogin.al.stop);
    a = await until(async () => { await feed(); const v = await al(); return v.todo ? v : null; }, 40);
    ok(a && /^👉 지금 할 일 하나: 옆 창 \[🔐 알라딘 로그인\]/.test(a.todo) && /^👉/.test(a.msg), '크게 한 줄 할 일(옆 창 · 번외 상태 글 맨 앞 → 웹앱)', a && a.todo);
    { const m = (await st()).msg; ok(/^👉 지금 할 일 하나/.test(m), '도우미 지금 글(웹앱이 닫혀도 수집기 다리가 col2_ctl에 올리는 글) 맨 앞에도 그 한 줄', m); }
    const cl = fs.readFileSync(D + '/chrome.log', 'utf8').split('\n').filter((x) => /wlogin_naver/.test(x)); ok(cl.length === 1 && !/remote-debugging|enable-automation|disable-background/.test(cl[0].replace(/--remote-debugging-port=0 /, '')), '네이버 길 창 = 평범한 크롬(조종 길·일꾼 플래그 없음)', cl[0]);
    await feed(); await wait(2500); ok(nv() === 1, '멈춘 뒤엔 더 두드리지 않음');
    console.log('② 사람이 한 번 → 살아남 → 멈춤 저절로 풂');
    A.S.keep = true; A.S.all = true; /* 사람이 [🔐 알라딘 로그인] 평범한 창에서 네이버로(로그인 상태 유지) 한 것과 같은 결과 */ const r = await H.api('POST', '/al/login', { why: '시험 — 사람' }); await wait(2000); await H.api('POST', '/al/login', { why: '로그인 다 함' }); /* 평범한 창을 띄웠다 [✅ 로그인 다 함] */
    a = await until(async () => { await feed(); const v = await st(); return v.al.login === 'ok' ? v : null; }, 200);
    ok(a && !a.relogin.al.stop && !a.al.todo, '샵매니저 확인 = 살아 있음 · 사람 손 멈춤이 저절로 풀림 · 할 일 줄 사라짐', a && { stop: a.relogin.al.stop, todo: a.al.todo, r: r.j && (r.j.msg || r.j.err) });
    console.log('③ 다시 풀리면 평범한 창으로 값 없이 다시 로그인');
    A.S.sess.clear(); A.S.all = false; const n0 = nv(); await H.api('POST', '/al/run', { what: 'chk' });
    a = await until(async () => { await feed(); const v = await st(); return v.al.login === 'ok' && nv() > n0 ? v : null; }, 300);
    ok(a && nv() === n0 + 1 && !A.S.log.some((x) => x.idLogin), '세션이 풀리자 평범한 창 「네이버로 로그인」으로 저절로 다시 로그인 → 이어 감(아이디·비밀번호 안 씀)', { nv: nv() - n0, login: a && a.al.login });
    const jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/평범한 크롬 창으로 「네이버로 로그인」/.test(jl) && /스스로 다시 로그인 됨\(네이버로 로그인/.test(jl), '기록에 평범한 창 네이버 길 · 다시 로그인 됨');
  } finally { try { await H.stop(); } catch (e) {} A.srv.close(); }
  L.done('t_alnv');
})().catch((e) => { console.error(e); process.exit(1); });
