/* t_human — 🔐 사람이 로그인하는 알라딘 창 = '평범한 크롬'인가 (11/11 col2fix6 · 정범님 HOME '번외 로그인 창에서 아이디·네이버 모두 42FB · 평소 크롬은 됨')
 *  진짜 크롬(Playwright 크로미움)을 humanArgs 그대로 띄우고, 이 시험 안 작은 서버의 화면이 브라우저 안에서 본 흔적을 서버로 보냄(조종 연결을 붙이지 않고 잼)
 *  ① 플래그 검사(순수) — 조종 길·자동화·화면 없음·일꾼 플래그 없음 · 화면 밖 자리 안 받음
 *  ② 흔적 — navigator.webdriver false · 이름표에 HeadlessChrome 없음(화면 있을 때) · 창이 화면 안 · 조종 도구 흔적(cdc_·__playwright) 없음
 *     견줌: --enable-automation 을 붙이면 같은 화면이 webdriver true를 봄(검사가 진짜로 잡는지)
 *  ③ 세션 쿠키(만료 없는 로그인 쿠키)가 창을 닫았다 다시 띄워도 이어짐 — prefsFix(이어서 열기) 덕
 * 화면이 없는 곳이면 Xvfb를 잠깐 띄움(없으면 화면 없이 · 그때는 HeadlessChrome 검사만 건너뜀) · 실행: node tests/t_human.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const AL = require('../helper/col2-al.js');

(async () => {
  console.log('① 평범한 창 플래그(순수)');
  const P = '/tmp/x/col2-al-chrome'; const a = AL.humanArgs(P, 'https://www.aladin.co.kr/scm/wmain.aspx', { x: 120, y: 60, w: 1200, h: 860 });
  ok(AL.humanArgsOk(a) && a[a.length - 1] === 'https://www.aladin.co.kr/scm/wmain.aspx' && a[0] === '--user-data-dir=' + P, '같은 프로필 · 주소 하나 · 허락된 플래그만', a.join(' '));
  const off = AL.humanArgs(P, 'u', { x: -32000, y: 40, w: 1280, h: 900 }); ok(!off.some((x) => /window-position/.test(x)), '화면 밖 자리(-32000)는 안 받음(크롬이 정한 화면 안 자리로)', off.join(' '));
  ok(['--remote-debugging-port=0', '--enable-automation', '--headless=new', '--disable-blink-features=AutomationControlled', '--disable-extensions', '--disable-background-timer-throttling', '--user-agent=x', '--proxy-server=x', '--no-sandbox'].every((f) => !AL.humanArgsOk([f])), '조종 길·자동화·화면 없음·일꾼·이름표·프록시 플래그는 모두 거절');

  console.log('② 브라우저 안에서 본 흔적');
  const got = []; let ckSeen = []; const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    if (u.pathname === '/r') { try { got.push(JSON.parse(b)); } catch (e) {} s.writeHead(204); return s.end(); }
    if (u.pathname === '/login') { s.writeHead(302, { 'Set-Cookie': 'asid=t123; Path=/; HttpOnly', Location: '/probe?k=login' }); return s.end(); } /* 만료 없는 세션 쿠키 · 창은 35초 뒤 닫음(크롬은 쿠키를 30초마다 씀 — 실제 창은 정범님이 X로 닫아 점잖게 끝남) */
    if (u.pathname === '/probe') { ckSeen.push({ k: u.searchParams.get('k'), ck: q.headers.cookie || '' }); s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return s.end(`<!doctype html><title>흔적</title><script>setTimeout(()=>{const k=Object.keys(window).filter((x)=>/cdc_|__playwright|__pw|domAutomation/.test(x));fetch('/r',{method:'POST',body:JSON.stringify({k:${JSON.stringify(u.searchParams.get('k') || '')},wd:navigator.webdriver,ua:navigator.userAgent,sx:screenX,sy:screenY,ow:outerWidth,ch:!!window.chrome,auto:k,lang:navigator.languages})})},300)</script>`); }
    s.writeHead(404); s.end(); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const exe = L.chromium().executablePath(); let xv = null; const env = { ...process.env };
  if (!env.DISPLAY && fs.existsSync('/usr/bin/Xvfb')) { const dn = ':' + (90 + Math.floor(Math.random() * 400)); xv = cp.spawn('/usr/bin/Xvfb', [dn, '-screen', '0', '1920x1080x24', '-nolisten', 'tcp'], { stdio: 'ignore' }); env.DISPLAY = dn; await wait(1200); }
  const head = !!env.DISPLAY; const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2h_')); const prof = path.join(D, 'col2-al-chrome'); AL.prefsFix(prof);
  const extra = [...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : []), ...(head ? [] : ['--headless=new']), '--disable-gpu', '--disable-dev-shm-usage']; /* 시험 상자 사정(뿌리 사용자·화면 없음)만 — 실제 창 플래그(humanArgs)에는 없음 */
  const run = async (args, k, hold) => { const p = cp.spawn(exe, [...extra, ...args], { env, stdio: 'ignore' }); for (let i = 0; i < 60 && !got.some((g) => g.k === k); i++) await wait(250); const g = got.find((x) => x.k === k); if (hold) await wait(hold);
    try { process.kill(p.pid, 'SIGTERM'); } catch (e) {} for (let i = 0; i < 40 && p.exitCode == null && p.signalCode == null; i++) await wait(250); if (p.exitCode == null && p.signalCode == null) try { p.kill('SIGKILL'); } catch (e) {} await wait(500); return g; };
  try {
    const h = await run(AL.humanArgs(prof, base + '/probe?k=plain', { x: 100, y: 50, w: 1100, h: 800 }), 'plain');
    ok(h && h.wd === false, 'navigator.webdriver = false (자동화로 안 보임)', h && JSON.stringify({ wd: h.wd, auto: h.auto }));
    ok(h && !h.auto.length && h.ch, '조종 도구 흔적(cdc_·__playwright 등) 없음 · window.chrome 있음', h && h.auto.join(','));
    ok(h && (!head || (!/HeadlessChrome/.test(h.ua) && h.sx >= 0 && h.ow >= 400)), head ? '이름표에 HeadlessChrome 없음 · 창이 화면 안(-32000 아님)' : '(화면 없는 곳 — 이름표·자리 검사는 건너뜀)', h && `${h.ua.slice(0, 60)} · x ${h.sx} · 폭 ${h.ow}`);
    const c = await run(['--enable-automation', ...AL.humanArgs(path.join(D, 'ctl'), base + '/probe?k=ctl', {})], 'ctl');
    ok(c && c.wd === true, '견줌: --enable-automation을 붙이면 같은 화면이 webdriver true를 봄(검사가 진짜로 잡음)', c && String(c.wd));

    console.log('③ 세션 쿠키가 창을 닫았다 다시 띄워도 이어짐');
    await run(AL.humanArgs(prof, base + '/login', {}), 'login', 35000); const pr = JSON.parse(fs.readFileSync(path.join(prof, 'Default', 'Preferences'), 'utf8'));
    await run(AL.humanArgs(prof, base + '/probe?k=again', {}), 'again'); const again = ckSeen.filter((x) => x.k === 'again').pop();
    ok(pr.session && pr.session.restore_on_startup === 1 && pr.credentials_enable_service === false && pr.profile.cookie_controls_mode === 0, "프로필 설정: 이어서 열기 · 비밀번호 저장 끔 · 제3자 쿠키 평소처럼", JSON.stringify({ s: pr.session, c: pr.profile && pr.profile.cookie_controls_mode }));
    ok(head ? again && /asid=t123/.test(again.ck) : true, head ? '만료 없는 로그인 쿠키가 다시 띄운 창에도 실림' : '(화면 없는 곳 — 이어서 열기는 화면 있는 크롬만 · 건너뜀)', again && again.ck);
  } finally { srv.close(); if (xv) try { xv.kill(); } catch (e) {} try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} }
  L.done('t_human');
})();
