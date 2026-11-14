/* t_show — (0.1.4 · 정범님 11/14 14:30 「✕로 닫고 같은 아이콘을 다시 더블클릭하면 창이 안 뜸」)
 *  ① 이미 켜진 서버 → 아이콘 다시 = 짧은 프로세스가 /api/show만 보내고 바로 끝남 · 창은 살아 있는 서버가 띄움
 *  ② 창이 떠 있으면 새로 안 띄우고 앞으로 · 닫힘 알림(/api/bye) 뒤엔 바로 새 창
 *  ③ 크롬 부탁이 사라지면 한 번 더 · 두 번 다 안 되면 진단(diag.json · /api/diag errs 'window')에 남음
 *  ④ 찾아 둔 크롬 경로(found.json)도 모니터 기억도 없고 모니터 읽기가 실패·느려도 창부터 뜸
 *  ⑤ 짧은 프로세스가 남긴 실패도 서버 진단에 보임(덮어쓰지 않음)
 *  ⑥ 실제 0.1.3 서버(커밋 2807f9f4의 파일 그대로)가 살아 있을 때 0.1.4를 켬 → 0.1.3을 끄고 넘겨받아 창을 띄움
 *  ⑦ 켜는 길 고침 — 0.1.3 설치가 만든 run.cmd(console.log에 >> 이어 붙이기)·run.vbs → start.cmd(이어 붙이기 없음)·run.vbs가 그것을 부름 · run.cmd는 그대로
 *  가짜 PowerShell(fakeps.js) + 가짜 크롬(fakechrome.js) · 실행: node lab/pcdock/tests/t_show.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 600) : '')); } };
const FAKE = path.join(__dirname, 'fakeps.js'), FCH = path.join(__dirname, 'fakechrome.js'); fs.chmodSync(FAKE, 0o755); fs.chmodSync(FCH, 0o755);
const APPJS = path.join(__dirname, '..', 'readnow-pcdock.js'); const VER = require('../pcdock-config.js').PCDOCK_VER;
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));
const rport = () => 20000 + Math.floor(Math.random() * 20000);
function envFor(D, port, extra) { return { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_CHROME: FCH, RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(port),
  FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), FAKE_CHROME_LOG: path.join(D, 'chrome.log'), FAKE_WIN: path.join(D, 'win.flag'), ...(extra || {}) }; }
function start(D, port, extra, js) { const env = envFor(D, port, extra); const p = cp.spawn(process.execPath, [js || APPJS], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 20000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1], env }); } }); }); }
function again(S, extra) { const t0 = Date.now(); const r = cp.spawnSync(process.execPath, [APPJS], { env: { ...S.env, ...(extra || {}) }, timeout: 30000 }); return { status: r.status, ms: Date.now() - t0 }; }
function req(port, method, p, body, hdr) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port, ...(data ? { 'content-length': data.length } : {}), ...(hdr || {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); if (data) r.write(data); r.end(); }); }
const chromeCalls = (D) => { try { return fs.readFileSync(path.join(D, 'chrome.log'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch (e) { return []; } };
const fakeActs = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).act); } catch (e) { return []; } };
const logOf = (D) => { try { return fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8'); } catch (e) { return ''; } };
const until = async (f, ms) => { for (let k = 0; k < ms / 100; k++) { if (await f()) return true; await sleep(100); } return !!(await f()); };
const mk = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pcdocks-'));
const stop = (S) => { try { S.p.kill(); } catch (e) {} };

(async () => { const kill = [];
  try {
    console.log('① 이미 켜진 서버 → 아이콘 다시 누름 → 살아 있는 서버가 창을 띄움');
    { const D = mk(); const S = await start(D, rport()); kill.push(S);
      ok(await until(() => chromeCalls(D).length === 1, 5000), '처음 켤 때 창 1번(가짜 크롬)', chromeCalls(D).length);
      ok(await until(async () => { const d = await req(S.port, 'GET', '/api/diag'); return d.j && d.j.win && d.j.win.ok === true; }, 5000), '처음 창: 화면이 서버를 불러 「새 창을 띄움」으로 확인');
      await req(S.port, 'POST', '/api/bye', undefined, { 'x-rn-dock': '' }); /* ✕로 닫음(화면이 보내는 알림 — 머리글 없음) */
      const a = again(S); ok(a.status === 0 && a.ms < 8000, `두 번째 켬(짧은 프로세스)이 바로 끝남(${a.ms}ms)`, a);
      ok(await until(() => chromeCalls(D).length === 2, 5000), '창이 다시 뜸(크롬을 한 번 더 부름)', chromeCalls(D).length);
      ok(chromeCalls(D).every((c) => c.includes('--app=http://127.0.0.1:' + S.port + '/')), '두 번째 창도 살아 있는 서버 주소');
      ok(/이미 켜져 있어\(.*\) 그 서버가 창을 맡음 — open/.test(logOf(D)), '기록: 「이미 켜져 있어 그 서버가 창을 맡음 — open」');
      ok(!fakeActs(D).includes('front'), '닫힘 알림 뒤에는 「떠 있는 창 찾기」(PowerShell)를 건너뜀', fakeActs(D));
      const pg = await req(S.port, 'GET', '/api/ping'); ok(pg.j && pg.j.ver === VER, '서버는 그대로 하나(판 ' + VER + ')');

      console.log('② 창이 떠 있으면 새로 안 띄우고 앞으로');
      await req(S.port, 'GET', '/api/state'); /* 화면이 서버를 부름 = 창이 떠 있음 */ const before = chromeCalls(D).length;
      const b = again(S); ok(b.status === 0, '세 번째 켬 끝남');
      ok(chromeCalls(D).length === before && fakeActs(D).includes('front') && /떠 있던 창을 앞으로/.test(logOf(D)), '크롬을 새로 안 부르고 PowerShell front로 앞으로', { before, now: chromeCalls(D).length });
      const d2 = await req(S.port, 'GET', '/api/diag'); ok(d2.j && d2.j.win && /앞으로/.test(d2.j.win.how) && d2.j.win.open === true, '진단 win 칸: 마지막 창 열기 결과', d2.j && d2.j.win);
      fs.writeFileSync(path.join(D, 'win.flag.off'), '1'); const off = again(S); fs.rmSync(path.join(D, 'win.flag.off'), { force: true }); ok(off.status === 0 && /화면 안으로 옮겨 앞으로/.test(logOf(D)), '화면 밖에 있던 창 → 화면 안으로 옮겨 앞으로');
      fs.rmSync(path.join(D, 'win.flag'), { force: true }); const c0 = chromeCalls(D).length; again(S);
      ok(await until(() => chromeCalls(D).length === c0 + 1, 5000), '떠 있다고 여겼지만 창이 없으면(찾기 실패) 새로 띄움'); stop(S); }

    console.log('③ 크롬 부탁이 사라질 때 · 끝내 안 뜰 때');
    { const D = mk(); const S = await start(D, rport(), { FAKE_CHROME_MODE: 'oncedead' }); kill.push(S);
      ok(await until(() => chromeCalls(D).length === 2, 30000) && await until(() => /한 번 더 띄움/.test(logOf(D)), 5000), '처음 부탁이 사라짐 → 20초 뒤 한 번 더 띄워 뜸', chromeCalls(D).length); stop(S); }
    { const D = mk(); const S = await start(D, rport(), { FAKE_CHROME_MODE: 'dead' }); kill.push(S);
      ok(await until(async () => { const d = await req(S.port, 'GET', '/api/diag'); return d.j && d.j.win && d.j.win.ok === false; }, 50000), '두 번 다 안 뜨면 진단 win.ok=false');
      const d = await req(S.port, 'GET', '/api/diag'); const e = (d.j.errs || [])[0] || {};
      ok(e.act === 'window' && /두 번 다 20초 안에 안 뜸/.test(e.err), '진단 errs 맨 앞 act=window · 까닭(PC 신호 dock.errs로 올라감)', e);
      ok(JSON.parse(fs.readFileSync(path.join(D, 'diag.json'), 'utf8')).errs[0].act === 'window', 'diag.json에도'); stop(S); }

    console.log('④ 크롬 경로·모니터 기억이 없고 모니터 읽기가 실패·느려도 창부터');
    { const D = mk(); const PF = mk(); const cd = path.join(PF, 'Google', 'Chrome', 'Application'); fs.mkdirSync(cd, { recursive: true }); fs.copyFileSync(FCH, path.join(cd, 'chrome.exe')); fs.chmodSync(path.join(cd, 'chrome.exe'), 0o755);
      const t0 = Date.now(); const S = await start(D, rport(), { RN_PCDOCK_CHROME: '', RN_PCDOCK_NOWIN: '', ProgramFiles: PF, FAKE_SCREENS: 'fail', FAKE_SLOW: '8000' }); kill.push(S);
      ok(!fs.existsSync(path.join(D, 'found.json')) && await until(() => chromeCalls(D).length === 1, 4000), `found.json 없이도 흔한 크롬 자리에서 찾아 ${Date.now() - t0}ms 만에 창(모니터 읽기 8초를 안 기다림)`, chromeCalls(D).length);
      const c = chromeCalls(D)[0] || []; ok(c.includes('--window-position=40,40'), '모니터를 모르면 왼쪽 위(40,40)에 먼저', c);
      ok(!fakeActs(D).includes('find'), '크롬 찾기(PowerShell find · 최대 90초)를 안 기다림', fakeActs(D)); stop(S); }
    { const D = mk(); fs.writeFileSync(path.join(D, 'mons.json'), JSON.stringify({ at: 1, mons: [{ id: 'D1', primary: true, b: { x: 0, y: 0, w: 2560, h: 1440 }, wa: { x: 0, y: 0, w: 2560, h: 1380 }, dpi: 120 }] }));
      const S = await start(D, rport(), { FAKE_SLOW: '6000' }); kill.push(S); await until(() => chromeCalls(D).length === 1, 4000);
      const c = chromeCalls(D)[0] || []; ok(c.includes('--window-position=' + Math.round(2560 / 1.25 - 340 - 12) + ',12'), '기억해 둔 모니터(125%)로 오른쪽 위 자리 — 모니터를 다시 읽기 전에', c.filter((x) => /position/.test(x))); stop(S); }
    { const D = mk(); const S = await start(D, rport(), { FAKE_MONS: 'one' }); kill.push(S); await req(S.port, 'GET', '/api/state');
      ok(await until(() => fs.existsSync(path.join(D, 'mons.json')), 3000) && JSON.parse(fs.readFileSync(path.join(D, 'mons.json'), 'utf8')).mons.length === 1, '모니터를 읽으면 mons.json에 기억'); stop(S); }

    console.log('⑤ 짧은 프로세스가 남긴 실패도 서버 진단에 보임');
    { const D = mk(); const S = await start(D, rport()); kill.push(S);
      const r = cp.spawnSync(process.execPath, ['-e', "require(process.argv[1]).noteErr('window', '짧은 프로세스 시험 실패')", APPJS], { env: S.env, encoding: 'utf8' });
      await req(S.port, 'POST', '/api/screens', {}); /* 서버도 무엇인가 남기거나 읽음 */
      const d = await req(S.port, 'GET', '/api/diag'); ok(r.status === 0 && (d.j.errs || []).some((e) => /짧은 프로세스 시험 실패/.test(e.err)), '다른 프로세스가 diag.json에 남긴 것을 서버가 덮지 않고 보여 줌', d.j && d.j.errs); stop(S); }

    console.log('⑥ 실제 0.1.3 서버가 살아 있을 때 0.1.4를 켬(바로 앞 판에서 넘어가기)');
    { const OLD = mk(); for (const f of JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bundle.json'), 'utf8')).files) { const r = cp.spawnSync('git', ['show', '2807f9f4:lab/pcdock/' + f], { cwd: __dirname, maxBuffer: 8 * 1048576 }); if (r.status !== 0) throw new Error('옛 판 파일을 못 꺼냄(git show 2807f9f4) ' + f); fs.writeFileSync(path.join(OLD, f), r.stdout); }
      ok(/PCDOCK_VER: '0\.1\.3'/.test(fs.readFileSync(path.join(OLD, 'pcdock-config.js'), 'utf8')), '옛 판 파일 = 0.1.3(커밋 2807f9f4)');
      const D = mk(); const port = rport(); const A = await start(D, port, {}, path.join(OLD, 'readnow-pcdock.js')); kill.push(A);
      const pa = await req(port, 'GET', '/api/ping'); ok(pa.j && pa.j.ver === '0.1.3', '0.1.3 서버가 켜짐(창 없이)');
      const sh = await req(port, 'POST', '/api/show', {}); ok(sh.code === 404, '0.1.3에는 /api/show가 없음(그래서 넘겨받아야 함)', sh.code);
      const B = await start(D, port, { FAKE_OLD_PID: String(A.p.pid) }); kill.push(B);
      const pb = await req(port, 'GET', '/api/ping'); ok(B.port === port && pb.j && pb.j.ver === VER, `0.1.4가 같은 포트(${port})에서 켜짐`, pb.j);
      ok(/옛 판 0\.1\.3 서버.*넘겨받음\(stopold\) — 끔/.test(logOf(D)) && fakeActs(D).includes('stopold'), '0.1.3은 /api/quit가 없어 PowerShell stopold로 끄고 넘겨받음', logOf(D).split('\n').filter((l) => /넘겨/.test(l)));
      ok(await until(() => chromeCalls(D).length === 1, 5000) && chromeCalls(D)[0].includes('--app=http://127.0.0.1:' + port + '/'), '넘겨받은 0.1.4가 창을 띄움(정범님 손 없음)', chromeCalls(D));
      const C = again(B); ok(C.status === 0 && await until(() => chromeCalls(D).length === 2 || /앞으로/.test(logOf(D)), 5000), '그 뒤 아이콘을 다시 눌러도 창(0.1.4끼리 /api/show)');
      const D2 = mk(); const port2 = rport(); const A2 = await start(D2, port2, {}, path.join(OLD, 'readnow-pcdock.js')); kill.push(A2);
      const B2 = start(D2, port2, { FAKE_OLD_PID: String(A2.p.pid), RN_PCDOCK_PS: path.join(D2, 'no-ps') }); B2.catch(() => {}); let B2r = null; try { B2r = await Promise.race([B2, sleep(6000).then(() => null)]); } catch (e) {}
      ok(B2r === null && await until(() => chromeCalls(D2).length === 1, 3000) && /0\.1\.3 · \d+\) 주소로 창을 띄움/.test(logOf(D2)), '0.1.3을 못 끄면(PowerShell 실패) 0.1.3 서버 주소로 여기서 창을 띄우고 끝남', logOf(D2).slice(-400));
      ok((await req(port2, 'GET', '/api/ping')).j.ver === '0.1.3', '그때 0.1.3 서버는 그대로'); }

    console.log('⑥-2 실제 0.1.4 서버(커밋 d8760f1)가 살아 있을 때 지금 판을 켬');
    { const OLD = mk(); for (const f of JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bundle.json'), 'utf8')).files) { const r = cp.spawnSync('git', ['show', 'd8760f1:lab/pcdock/' + f], { cwd: __dirname, maxBuffer: 8 * 1048576 }); if (r.status !== 0) throw new Error('0.1.4 파일을 못 꺼냄 ' + f); fs.writeFileSync(path.join(OLD, f), r.stdout); }
      const D = mk(); const port = rport(); const A = await start(D, port, {}, path.join(OLD, 'readnow-pcdock.js')); kill.push(A);
      ok((await req(port, 'GET', '/api/ping')).j.ver === '0.1.4', '0.1.4 서버가 켜짐');
      const B = await start(D, port); kill.push(B); const pb = await req(port, 'GET', '/api/ping');
      ok(pb.j && pb.j.ver === VER && VER !== '0.1.4' && /옛 판 0\.1\.4 서버.*넘겨받음\(quit\) — 끔/.test(logOf(D)) && !fakeActs(D).includes('stopold'), `0.1.4 → ${VER}: /api/quit로 PowerShell 없이 넘겨받음(정범님 손 없음)`, logOf(D).split('\n').filter((l) => /넘겨/.test(l)));
      ok(await until(() => chromeCalls(D).length >= 2 || /🪟 떠 있던 창을 앞으로 \(켬\)/.test(logOf(D)), 5000), '넘겨받은 새 판이 창을 띄움(옛 창이 떠 있으면 그 창을 앞으로)', logOf(D).split('\n').filter((l) => /🪟/.test(l))); stop(B); }

    console.log('⑥-3 (0.1.6) 실제 0.1.5 서버(커밋 a78210e3 · 정범님 JS-MAIN에 지금 도는 판)가 살아 있을 때 지금 판을 켬');
    { const OLD = mk(); for (const f of JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bundle.json'), 'utf8')).files) { const r = cp.spawnSync('git', ['show', 'a78210e3:lab/pcdock/' + f], { cwd: __dirname, maxBuffer: 8 * 1048576 }); if (r.status !== 0) throw new Error('0.1.5 파일을 못 꺼냄 ' + f); fs.writeFileSync(path.join(OLD, f), r.stdout); }
      const D = mk(); const port = rport(); const A = await start(D, port, {}, path.join(OLD, 'readnow-pcdock.js')); kill.push(A);
      ok((await req(port, 'GET', '/api/ping')).j.ver === '0.1.5', '0.1.5 서버가 켜짐');
      const B = await start(D, port); kill.push(B); const pb = await req(port, 'GET', '/api/ping');
      ok(pb.j && pb.j.ver === VER && VER !== '0.1.5' && /옛 판 0\.1\.5 서버.*넘겨받음\(quit\) — 끔/.test(logOf(D)) && !fakeActs(D).includes('stopold'), `0.1.5 → ${VER}: /api/quit로 PowerShell 없이 넘겨받음(정범님 손 없음)`, logOf(D));
      ok(await until(() => chromeCalls(D).length >= 2 || /🪟 떠 있던 창을 앞으로 \(켬\)/.test(logOf(D)), 5000), '넘겨받은 새 판이 창을 띄움', logOf(D).split('\n').filter((l) => /🪟/.test(l))); }

    console.log('⑦ 켜는 길 고침(run.vbs → start.cmd)');
    { const L = mk(); const node = 'C:\\Users\\someone\\ReadNow\\node\\node.exe';
      const runCmd = `@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\nif exist "app.new\\.ready" (\r\n  if exist app.old rmdir /s /q app.old\r\n  move app app.old >nul && move app.new app >nul\r\n  del app\\.ready >nul 2>&1\r\n)\r\n"${node}" app\\readnow-pcdock.js %* >> "%~dp0console.log" 2>&1\r\n`;
      const cmdP = 'C:\\Users\\someone\\AppData\\Local\\ReadNow\\pcdock\\run.cmd';
      const vbs = `Set sh = CreateObject("WScript.Shell")\r\na = ""\r\nFor Each x In WScript.Arguments\r\n  a = a & " " & x\r\nNext\r\nsh.Run """" & "${cmdP}" & """" & a, 0, False\r\n`;
      fs.writeFileSync(path.join(L, 'run.cmd'), runCmd, 'utf8'); fs.writeFileSync(path.join(L, 'run.vbs'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(vbs, 'utf16le')]));
      /* 0.1.3 설치 글이 정말 이 꼴로 썼는지(설치 글 0.1.3 원문과 견줌) */
      const old = cp.spawnSync('git', ['show', '2807f9f4:lab/pcdock/install-pcdock.ps1'], { cwd: __dirname, encoding: 'utf8' }).stdout || '';
      ok(/app\\readnow-pcdock\.js %\* >> `"%~dp0console\.log`" 2>&1/.test(old), '0.1.3 설치 글이 run.cmd에 「>> console.log 2>&1」을 썼음(원문)');
      ok(!/console\.log`?"? 2>&1/.test(fs.readFileSync(path.join(__dirname, '..', 'install-pcdock.ps1'), 'utf8')), '0.1.4 설치 글은 이어 붙이기를 안 씀');
      const D = mk(); const S = await start(D, rport(), { RN_PCDOCK_LAUNCH_DIR: L }); kill.push(S);
      const st = fs.existsSync(path.join(L, 'start.cmd')) ? fs.readFileSync(path.join(L, 'start.cmd'), 'utf8') : '';
      ok(st && !/>>|console\.log/.test(st) && st.includes(`"${node}" app\\readnow-pcdock.js %*\r\n`) && st.includes('move app app.old >nul && move app.new app >nul'), 'start.cmd = run.cmd에서 이어 붙이기만 뺀 것(node 경로·새 판 바꿔 끼우기 그대로)', st);
      const vb = fs.readFileSync(path.join(L, 'run.vbs')); const vt = vb.subarray(2).toString('utf16le');
      ok(vb[0] === 0xff && vb[1] === 0xfe && vt.includes('\\pcdock\\start.cmd"') && !vt.includes('run.cmd') && vt.replace('start.cmd', 'run.cmd') === vbs, 'run.vbs는 UTF-16 그대로 start.cmd만 부르게(나머지 글자 같음)');
      ok(fs.readFileSync(path.join(L, 'run.cmd'), 'utf8') === runCmd, 'run.cmd는 그대로(돌고 있는 배치 파일을 안 바꿈 · 안 지움)');
      ok(/켜는 길 고침/.test(logOf(D)), '기록에 남음'); const dg = await req(S.port, 'GET', '/api/diag'); ok(dg.j && dg.j.launch === '고침', '진단 launch=고침', dg.j && dg.j.launch); stop(S);
      const S2 = await start(D, rport(), { RN_PCDOCK_LAUNCH_DIR: L }); kill.push(S2); const dg2 = await req(S2.port, 'GET', '/api/diag'); ok(dg2.j.launch === '이미 고침(start.cmd)' && fs.readFileSync(path.join(L, 'start.cmd'), 'utf8') === st, '다시 켜도 start.cmd를 다시 쓰지 않음', dg2.j.launch); stop(S2);
      const L2 = mk(); fs.writeFileSync(path.join(L2, 'run.cmd'), runCmd.replace(' >> "%~dp0console.log" 2>&1', ''), 'utf8'); fs.writeFileSync(path.join(L2, 'run.vbs'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(vbs, 'utf16le')]));
      const S3 = await start(mk(), rport(), { RN_PCDOCK_LAUNCH_DIR: L2 }); kill.push(S3); const dg3 = await req(S3.port, 'GET', '/api/diag'); ok(dg3.j.launch === '고칠 것 없음' && !fs.existsSync(path.join(L2, 'start.cmd')), '0.1.4 설치 꼴이면 아무것도 안 바꿈', dg3.j.launch); stop(S3); }

    console.log('⑨ (0.1.5) 실행·배치가 겹치지 않음');
    { const D = mk(); const S = await start(D, rport(), { FAKE_SLOW_RUN: '2500' }); kill.push(S); const st = await req(S.port, 'GET', '/api/state');
      const cfg = JSON.parse(JSON.stringify(st.j.cfg)); cfg.place = [{ app: 'kakao', mon: st.j.mons[0].id, c: 0, r: 0, w: 1, h: 1 }]; const sv = await req(S.port, 'POST', '/api/save', { cfg }); ok(sv.j && sv.j.ok, '설정 저장(카카오 하나)', sv.j);
      const [a1, a2] = await Promise.all([req(S.port, 'POST', '/api/run', {}), (async () => { await sleep(300); return req(S.port, 'POST', '/api/run', {}); })()]);
      ok(a1.j && a1.j.ok && a2.j && a2.j.ok === false && /실행·배치 중/.test(a2.j.err || ''), '③을 두 번 누르면 두 번째는 막힘(창이 두 벌 안 생김)', [a1.j && a1.j.ok, a2.j]);
      ok(fakeActs(D).filter((x) => x === 'run').length === 1, 'PowerShell 실행·배치는 한 번만');
      const sl = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},20000)']); kill.push({ p: sl });
      fs.writeFileSync(path.join(D, 'run.lock'), JSON.stringify({ pid: sl.pid, at: Date.now() }));
      const a3 = await req(S.port, 'POST', '/api/run', {}); ok(a3.j && a3.j.ok === false && /다른 실행·배치가 아직 도는 중/.test(a3.j.err || ''), '윈도우 시작 자동 실행(다른 프로세스)이 도는 중이면 막힘(run.lock)', a3.j);
      const d = await req(S.port, 'GET', '/api/diag'); ok((d.j.errs || [])[0] && d.j.errs[0].act === 'run', '막힌 것도 진단에 남음');
      fs.writeFileSync(path.join(D, 'run.lock'), JSON.stringify({ pid: 999999, at: Date.now() }));
      const a4 = await req(S.port, 'POST', '/api/run', {}); ok(a4.j && a4.j.ok && !fs.existsSync(path.join(D, 'run.lock')), '그 프로세스가 없으면 낡은 잠금으로 보고 돎 · 끝나면 잠금을 치움', a4.j);
      try { sl.kill(); } catch (e) {} stop(S); }

    console.log('⑧ 지키기');
    { const D = mk(); const S = await start(D, rport()); kill.push(S);
      const x = await req(S.port, 'POST', '/api/show', {}, { origin: 'http://evil.example' }); ok(x.code === 403, '다른 웹 페이지는 /api/show 못 부름');
      const y = await req(S.port, 'POST', '/api/quit', {}, { 'x-rn-dock': '' }); ok(y.code === 403, '머리글 없으면 /api/quit 못 부름');
      const z = await req(S.port, 'POST', '/api/bye', undefined, { origin: 'http://evil.example' }); ok(z.code === 403, '다른 웹 페이지의 닫힘 알림은 거절');
      const h = await new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: S.port, path: '/api/show', method: 'POST', headers: { host: 'evil.example', 'x-rn-dock': '1', 'content-type': 'application/json' } }, (s) => { s.resume(); res(s.statusCode); }); r.on('error', () => res(0)); r.end('{}'); });
      ok(h === 403, 'Host가 127.0.0.1이 아니면 거절(검사 그대로)'); stop(S); }
  } catch (e) { bad++; console.log('  ✗ 시험이 멈춤: ' + (e.stack || e.message)); } finally { for (const k of kill) stop(k); }
  console.log(bad ? `✗ t_show ${bad}/${n} 실패` : `✓ t_show ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
