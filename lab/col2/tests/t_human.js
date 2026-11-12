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

    console.log('④ (11/12 login2) 조종 크롬으로 쓴 프로필 = 사이트가 볼 흔적이 깨끗한 프로필과 같음 · 설정 정리 · 거친 길 기록');
    { const { Browser } = require('../helper/col2-cdp.js'); const pc = path.join(D, 'used', 'col2-al-chrome'); const ba = new Browser({ exe, profile: pc, headless: false, rect: { x: -32000, y: 40, w: 1280, h: 900 } }).args().filter((x) => x !== 'about:blank');
      ok(ba.includes('--remote-debugging-port=0') && ba.includes('--disable-extensions'), '견줌 준비: 번외 조종 크롬과 같은 인자(조종 길·일꾼 플래그)로 그 프로필을 먼저 씀', ba.join(' '));
      await run([...ba, base + '/probe?k=ctlrun'], 'ctlrun', 3000);
      const u = await run(AL.humanArgs(pc, base + '/probe?k=used', {}), 'used'); const n = await run(AL.humanArgs(path.join(D, 'fresh', 'col2-al-chrome'), base + '/probe?k=fresh', {}), 'fresh');
      const pick = (g) => g && JSON.stringify({ wd: g.wd, auto: g.auto, ua: g.ua, ch: g.ch, lang: g.lang });
      ok(u && n && pick(u) === pick(n) && u.wd === false, '조종에 쓴 프로필을 평범한 창으로 열면 화면이 보는 것(webdriver·조종 흔적·이름표·언어)이 처음 쓰는 프로필과 똑같음 — 로그인 막힘은 플래그·프로필 설정 탓이 아님', pick(u) + ' / ' + pick(n));
      const flat = (o, p = '', out = []) => { if (o && typeof o === 'object' && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) flat(v, p + '.' + k, out); else out.push(p); return out; };
      const keys = flat(JSON.parse(fs.readFileSync(path.join(pc, 'Default', 'Preferences'), 'utf8'))).concat(flat(JSON.parse(fs.readFileSync(path.join(pc, 'Local State'), 'utf8'))));
      ok(!keys.some((k) => /automation|webdriver|remote_debug|devtools_active/i.test(k)), '조종에 쓴 프로필 설정 파일(Preferences·Local State)에 자동화 표시 칸 없음', keys.filter((k) => /automation|webdriver|remote_debug/i.test(k)).join(','));
      const pf = path.join(D, 'pf', 'col2-al-chrome'); fs.mkdirSync(path.join(pf, 'Default'), { recursive: true });
      fs.writeFileSync(path.join(pf, 'Default', 'Preferences'), JSON.stringify({ profile: { exit_type: 'Crashed', content_settings: { exceptions: { cookies: { 'https://www.aladin.co.kr:443,*': { setting: 2 }, 'https://keep.example:443,*': { setting: 2 } }, popups: { 'https://nid.naver.com:443,*': { setting: 2 } } } } } }));
      AL.prefsFix(pf); const pp = JSON.parse(fs.readFileSync(path.join(pf, 'Default', 'Preferences'), 'utf8')); const ex = pp.profile.content_settings.exceptions;
      ok(pp.profile.exit_type === 'Normal' && !ex.cookies['https://www.aladin.co.kr:443,*'] && !ex.popups['https://nid.naver.com:443,*'] && ex.cookies['https://keep.example:443,*'] && AL.profLook(pf).blk === 0, "설정 정리: '제대로 안 꺼짐' 표시 지움 · 알라딘·네이버를 막는 쿠키·팝업 예외만 지움(다른 사이트 예외는 그대로)", JSON.stringify(pp.profile));
      let SQ = null; try { SQ = require('node:sqlite'); } catch (e) {}
      if (SQ) { const hp = path.join(D, 'hist', 'col2-al-chrome'); fs.mkdirSync(path.join(hp, 'Default'), { recursive: true }); const db = new SQ.DatabaseSync(path.join(hp, 'Default', 'History'));
        db.exec('CREATE TABLE urls(id INTEGER PRIMARY KEY, url TEXT); CREATE TABLE visits(id INTEGER PRIMARY KEY, url INTEGER, visit_time INTEGER);'); const t0 = Date.now(); let i = 0;
        const add = (u, dt) => { i++; db.prepare('INSERT INTO urls VALUES(?,?)').run(i, u); db.prepare('INSERT INTO visits VALUES(?,?,?)').run(i, i, BigInt(AL.chromeUs(t0 + dt))); };
        add('https://www.aladin.co.kr/scm/wmain.aspx', -600e3); add('https://www.aladin.co.kr/login/wlogin.aspx?returnUrl=x&token=SECRET1', 1000); add('https://www.aladin.co.kr/login/wlogin_naver.aspx', 2000); add('https://nid.naver.com/oauth2.0/authorize?client_id=abc&state=SECRET2', 3000);
        add('https://nid.naver.com/nidlogin.login?mode=form', 4000); add('https://mail.example.com/inbox', 4500); add('https://www.aladin.co.kr/login/wnaver_callback.aspx?code=SECRET3', 5000); add('https://www.aladin.co.kr/login/wlogin.aspx', 6000); db.close();
        const tr = AL.trailOf(hp, t0); const js = JSON.stringify(tr);
        ok(tr.path && tr.path[0] === 'aladin.co.kr/login/wlogin.aspx' && tr.path.length === 6 && tr.other === 1 && !/SECRET|client_id|mail\.example/.test(js) && /알라딘 단계에서 막힘/.test(AL.trailWhy(tr.path)), '거친 길: 창을 띄운 뒤 것만 · 호스트·경로만(물음표 뒤 값 버림) · 알라딘·네이버 밖은 셈만 · 멈춘 곳 = 네이버 뒤 알라딘 단계', js + ' · ' + AL.trailWhy(tr.path)); }
      else ok(true, '(이 노드에 sqlite 없음 — 거친 길 검사 건너뜀)'); }
  } finally { srv.close(); if (xv) try { xv.kill(); } catch (e) {} try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} }
  L.done('t_human');
})();
