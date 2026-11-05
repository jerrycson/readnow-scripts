/* tCOL2BTN — 정범님 11/05 HOME '도우미 설치를 눌렀더니 ALPS 도우미가 떠 — HOME에는 ALPS가 아니라 외부 수집기가 필요한 거야' · '관리자는 명령·주소를 치지 않고 단추 하나로'
 *  ① 인쇄 도우미 다리(local/readnow-print.js /col2/*): 머리·출처 막기 · 처음엔 꺼짐 · ensure = 묶음 받기(검사)·따로 된 프로세스로 켬·번외 수집 켬 · 죽으면 지킴이가 다시 · 운영 도우미는 그대로
 *     · 검사 실패 새 판은 안 바꿈 · stop = 그 프로세스만 멈춤 · 켜 둔 PC는 도우미가 다시 켜질 때(로그온) 다시 켬 · 운영 도우미가 꺼져도 외부 수집기는 따로 돎
 *  ② 설치 파일(local/install-print.ps1 · 이 작업 환경에 PowerShell이 없어 글 검사 + 가짜 powershell로 .cmd 인자): 인자 없으면 예전 그대로 · -With col2면 묶음·검사·켜기 · ALPS 글은 ALPS PC만
 *  ③ 웹앱 🧭 관리도구 › 🪟 수집 작업 창 › 🧪 외부 수집기(시험) 줄: 도우미 없음 → 설치 파일(-With col2) → 설치되면 저절로 켬 · 상태(판·켜짐·오늘 읽은 수·마지막 비교) · 🔎 비교 화면 · 끄기 두 번 · 다른 PC에서 누름 · 옛 판 도우미
 * 실행: cd pw && RN_PORT=<포트> node tCOL2BTN.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 400) : ''); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const find = (rel) => [path.join(__dirname, '..', rel), path.join(__dirname, '../..', rel), path.join('/home/user/wk-col3', rel), path.join('/home/user/readnow-scripts', rel)].find((p) => fs.existsSync(p));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let C2PORT = +process.env.RN_COL2_TEST_PORT || 0; /* 비어 있는 포트를 고름(다른 일꾼 시험 서버와 안 겹치게) — 실제는 8797 */
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const req = (port, m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port, path: p, method: m, headers: { 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });
const P = (m, p, b, hd) => req(8898, m, p, b, { 'X-RN-Print': '1', ...(hd || {}) });
const cmdline = (pid) => { try { return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' '); } catch (e) { return ''; } };
const notZ = (pid) => { try { return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1][0] !== 'Z'; } catch (e) { return false; } };

async function partHelper() { console.log('① 인쇄 도우미 다리 — /col2/ensure·/col2/stop·/col2/status');
  const HELP = find('local/readnow-print.js'), LAB = find('lab/col2/bundle.json'); if (!HELP || !LAB) return ok(false, '파일을 못 찾음');
  const LABD = path.dirname(LAB); const PROD = path.join(LABD, '..', '..');
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'tcol2btn_')); fs.mkdirSync(D + '/bin'); fs.copyFileSync(HELP, D + '/readnow-print.js');
  fs.writeFileSync(D + '/bin/powershell.exe', '#!/bin/sh\nprintf "[]"\n'); fs.chmodSync(D + '/bin/powershell.exe', 0o755);
  fs.writeFileSync(D + '/bin/chrome', '#!/bin/sh\nexit 1\n'); fs.chmodSync(D + '/bin/chrome', 0o755); /* 번외 크롬은 이 시험에서 띄우지 않음(t_helper가 함) */
  /* 가짜 GitHub(raw) — lab/col2 복사본을 내줌(받은 요청을 적음) · 판·파일을 바꿔 새 판·검사 실패를 흉내 */
  const RAWD = D + '/raw'; fs.cpSync(LABD, RAWD, { recursive: true }); const got = [];
  const raw = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); got.push(u.pathname); const f = path.join(RAWD, decodeURIComponent(u.pathname)); if (!f.startsWith(RAWD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200); s.end(fs.readFileSync(f)); });
  await new Promise((r) => raw.listen(0, '127.0.0.1', r)); const RAW = `http://127.0.0.1:${raw.address().port}/`;
  const BASE = D + '/col2'; if (!C2PORT) C2PORT = await freePort();
  const env = { ...process.env, PATH: D + '/bin:' + process.env.PATH, RN_PRINT_NOUPDATE: '1', RN_COL2_BASE: BASE, RN_COL2_RAW: RAW, RN_COL2_PORT: String(C2PORT), RN_COL2_TICK_MS: '1500', RN_COL2_TEST: '1', RN_COL2_CHROME: D + '/bin/chrome', RN_COL2_CORE_DIR: PROD };
  let ph = null; const startPH = async () => { ph = cp.spawn('node', ['readnow-print.js'], { cwd: D, env, stdio: ['ignore', 'pipe', 'pipe'] }); ph.stdout.on('data', () => {}); ph.stderr.on('data', () => {}); for (let k = 0; k < 40; k++) { await wait(150); if ((await P('GET', '/status')).st === 200) return; } };
  const stopPH = async () => { if (ph) { ph.kill(); await new Promise((r) => (ph.exitCode != null ? r() : ph.on('exit', r))); ph = null; } };
  let c2pid = null;
  try {
    await startPH(); const s0 = await P('GET', '/status'); ok(s0.j && s0.j.ver === '1.1.9', '인쇄 도우미 1.1.9 켜짐', s0.j);
    ok((await req(8898, 'GET', '/col2/status')).st === 403, '머리(X-RN-Print) 없으면 거절');
    ok((await P('GET', '/col2/status', null, { Origin: 'https://evil.test' })).st === 403, '다른 웹 페이지 출처는 거절');
    const a0 = await P('GET', '/col2/status', null, { Origin: 'https://jerrycson.github.io' }); ok(a0.st === 200 && a0.j.ok && !a0.j.installed && !a0.j.running && !a0.j.want, '처음 = 묶음 없음 · 꺼짐(기본 꺼짐) · 웹앱 출처는 받음', a0.j);
    await wait(2500); ok((await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' })).st === 0, '켜 두지 않으면 지킴이가 외부 수집기를 켜지 않음');

    const e1 = await P('POST', '/col2/ensure', { pc: 'HOME', by: '시험' }); const ver = (fs.readFileSync(path.join(LABD, 'col2-config.js'), 'utf8').match(/COL2_VER:\s*'([\d.]+)'/) || [])[1];
    ok(e1.j && e1.j.ok && e1.j.installed && e1.j.running && e1.j.on && e1.j.ver === ver && e1.j.dayN === 0, `켜기 → 묶음 받음 · 켜짐 · 번외 수집 켬 · 판 ${ver} · 오늘 읽은 수 0`, e1.j);
    const man = JSON.parse(fs.readFileSync(LAB, 'utf8')).files; ok(man.every((f) => fs.existsSync(path.join(BASE, 'app', ...f.split('/')))) && !fs.existsSync(BASE + '/app.new'), `묶음 ${man.length}개 파일을 %USERPROFILE%\\ReadNow\\col2\\app 에(검사 뒤 바꿔 끼움)`);
    ok(man.every((f) => got.includes('/' + f)) && got.includes('/bundle.json'), 'GitHub(lab/col2)에서 목록·파일을 받음');
    const w1 = JSON.parse(fs.readFileSync(BASE + '/want.json', 'utf8')); ok(w1.on === true && w1.pc === 'HOME', '켠 것을 want.json에 적음(로그온 때 다시 켜려고)');
    const d1 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' }); c2pid = d1.j && d1.j.pid;
    ok(d1.j && d1.j.on && d1.j.pc === 'HOME' && c2pid && c2pid !== ph.pid && /readnow-col2-helper\.js/.test(cmdline(c2pid)), '외부 수집기 = 따로 된 프로세스(포트 따로 · 운영 도우미와 다른 pid)', { pid: c2pid, ph: ph.pid });
    ok(fs.existsSync(BASE + '/col2.log') && fs.existsSync(BASE + '/col2.json'), '외부 수집기 자료는 ReadNow\\col2 (운영 print 폴더 밖)');

    if (c2pid) process.kill(c2pid, 'SIGKILL'); await wait(300); ok((await P('GET', '/status')).st === 200, '외부 수집기가 죽어도 운영 도우미는 그대로 대답');
    let s2 = null; for (let k = 0; k < 40; k++) { await wait(300); s2 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' }); if (s2.j && s2.j.pid && s2.j.pid !== c2pid) break; }
    ok(s2.j && s2.j.pid !== c2pid && s2.j.on, '죽으면 지킴이가 다시 켬(켜 둔 PC만)'); c2pid = s2.j && s2.j.pid; await wait(2500); /* 지킴이의 켜기가 끝나기를 기다림 */

    /* 새 판인데 검사 실패 → 그대로 둠 */
    fs.writeFileSync(RAWD + '/col2-config.js', fs.readFileSync(RAWD + '/col2-config.js', 'utf8').replace(/COL2_VER:\s*'[\d.]+'/, "COL2_VER: '9.9.9'")); fs.writeFileSync(RAWD + '/helper/col2-pace.js', 'module.exports = { (');
    const e2 = await P('POST', '/col2/ensure', { pc: 'HOME' }); const s3 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' });
    ok(e2.j && e2.j.ok && e2.j.ver === ver && /검사 실패/.test(e2.j.msg || '') && s3.j && s3.j.pid === c2pid, '검사 실패한 새 판은 안 바꿈 — 돌던 것 그대로', e2.j);
    fs.copyFileSync(path.join(LABD, 'helper/col2-pace.js'), RAWD + '/helper/col2-pace.js');
    const e3 = await P('POST', '/col2/ensure', { pc: 'HOME' }); const s4 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' });
    ok(e3.j && e3.j.ok && e3.j.ver === '9.9.9' && s4.j && s4.j.pid !== c2pid && fs.existsSync(BASE + '/app.old'), '검사 통과한 새 판 → 멈추고 바꿔 끼운 뒤 다시 켬(예전 묶음은 app.old)', e3.j); c2pid = s4.j && s4.j.pid;

    const st1 = await P('POST', '/col2/stop', { by: '시험' }); await wait(300);
    ok(st1.j && st1.j.ok && !st1.j.running && !st1.j.want && !notZ(c2pid), '끄기 → 그 프로세스만 멈춤 · want 끔', st1.j);
    await wait(3500); ok((await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' })).st === 0 && (await P('GET', '/status')).st === 200, '끈 뒤엔 지킴이가 다시 켜지 않음 · 운영 도우미 그대로');

    /* 로그온(도우미가 다시 켜짐) → 켜 둔 PC면 다시 켬 */
    await P('POST', '/col2/ensure', { pc: 'HOME' }); await stopPH(); const s5 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' });
    ok(s5.j && s5.j.on, '운영 도우미가 꺼져도(새 판으로 다시 켜짐 등) 외부 수집기는 따로 돎'); c2pid = s5.j && s5.j.pid; if (c2pid) process.kill(c2pid, 'SIGKILL'); await wait(400);
    await startPH(); let s6 = null; for (let k = 0; k < 50; k++) { await wait(300); s6 = await req(C2PORT, 'GET', '/status', null, { 'X-RN-Col2': '1' }); if (s6.j) break; }
    ok(s6.j && s6.j.on, '로그온 때(도우미가 켜질 때) 켜 둔 PC는 외부 수집기를 다시 켬'); c2pid = s6.j && s6.j.pid;
    await P('POST', '/col2/stop', {});
  } finally { await stopPH(); if (c2pid) try { process.kill(c2pid, 'SIGKILL'); } catch (e) {} raw.close(); } }

function partInstall() { console.log('② 설치 파일 — 인자 있음/없음 (PowerShell이 이 작업 환경에 없어 글 검사 + 가짜 powershell)');
  const PS = fs.readFileSync(find('local/install-print.ps1'), 'utf8'); const LAB = find('lab/col2/bundle.json'); const man = JSON.parse(fs.readFileSync(LAB, 'utf8')).files; const LABD = path.dirname(LAB);
  ok(!/^\s*param\s*\(/m.test(PS) && /for \(\$i = 0; \$i -lt \$args\.Count/.test(PS), '설치 파일은 param 없이 $args로 인자를 읽음(irm | iex 한 줄도 그대로 됨)');
  /* -With col2 칸을 모두 빼면(인자 없음) 외부 수집기 글이 하나도 없어야 함 */
  const blocks = []; let s = PS, i; while ((i = s.indexOf("if ($With -eq 'col2') {")) >= 0) { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) break; } } blocks.push(s.slice(i, j + 1)); s = s.slice(0, i) + s.slice(j + 1); }
  ok(blocks.length >= 3 && !/col2|8797|lab\//.test(s.replace(/^#.*$/gm, '').replace(/\$\(if \(\$With -eq 'col2'\)[^\n]*/g, '')), `인자 없으면 외부 수집기를 받지도 켜지도 않음(외부 수집기 칸 ${blocks.length}개 모두 -With col2 안)`);
  const all = blocks.join('\n'); ok(/bundle\.json/.test(all) && /--check/.test(all) && /ReadNow\\col2/.test(all) && /want\.json/.test(all) && /\/col2\/ensure/.test(all) && /X-RN-Print/.test(all), '-With col2: 목록 받기 · node --check · ReadNow\\col2 · 켜기 표시 · 도우미에 켜기 부탁');
  const reP = (PS.match(/-match '(\^\(col2-config[^']+)'/) || [])[1]; const reH = (fs.readFileSync(find('local/readnow-print.js'), 'utf8').match(/const C2_FILE = \/(.+?)\/;/) || [])[1];
  ok(reP && reH && reP.replace(/\\\//g, '/') === reH.replace(/\\\//g, '/'), '설치 파일과 도우미가 받는 파일 이름 꼴이 같음', { reP, reH });
  const disk = ['col2-config.js', ...['helper', 'shadow'].flatMap((d) => fs.readdirSync(path.join(LABD, d)).filter((f) => /\.(js|html)$/.test(f)).map((f) => d + '/' + f))].sort();
  ok(JSON.stringify([...man].sort()) === JSON.stringify(disk) && man.every((f) => new RegExp(reH).test(f)), 'lab/col2/bundle.json 목록 = 폴더의 실제 파일(빠짐 없음)', { man, disk });
  ok(/if \(\$alpsPc\) \{ Write-Host 'ALPS 자동 처리/.test(PS) && /if \(\$alpsPc\) \{ Ok 'readnow-alps\.js \(📦 ALPS/.test(PS) && PS.indexOf('$alpsPc = Test-Path') < PS.indexOf("Ok 'readnow-alps.js"), 'ALPS 글은 ALPS PC(로그인 정보 있는 PC)에서만');
  ok(/리드나우 도우미\(외부 수집기 포함\)/.test(PS), "-With col2 안내는 'ALPS'가 아니라 '리드나우 도우미(외부 수집기 포함)'"); }

async function partWeb() { console.log('③ 웹앱 🧭 관리도구 › 🪟 수집 작업 창 › 🧪 외부 수집기(시험)');
  /* 가짜 powershell: .cmd의 powershell 줄 인자를 받아 -Command 글을 그대로 적음 */
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'tcol2web_')); const FPS = D + '/powershell'; fs.writeFileSync(FPS, `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(D + '/ps.json')}, JSON.stringify(process.argv.slice(2)));\n`); fs.chmodSync(FPS, 0o755);
  const runCmd = (txt) => { const ln = txt.split(/\r\n/).find((l) => /^powershell /.test(l)); const a = []; ln.replace(/"((?:[^"\\]|\\.)*)"|(\S+)/g, (m, q, w) => { a.push(q != null ? q.replace(/\\"/g, '"') : w); return ''; }); try { fs.unlinkSync(D + '/ps.json'); } catch (e) {} cp.spawnSync(FPS, a.slice(1)); return JSON.parse(fs.readFileSync(D + '/ps.json', 'utf8')); };
  await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
    let up = false, hv = '1.1.9', c2 = { installed: false, running: false, on: false, want: false }; const calls = [];
    await p.route(/127\.0\.0\.1:8898/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); calls.push(u.pathname + (b ? ' ' + b : '')); if (!up) return rt.abort();
      const J = (x, st) => rt.fulfill({ status: st || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(x) });
      if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
      if (u.pathname === '/status') return J({ ok: true, ver: hv }); if (u.pathname === '/printers') return J({ ok: true, printers: [] });
      if (u.pathname.startsWith('/col2/') && hv === '1.1.8') return J({ ok: false }, 404);
      const S2 = () => ({ ok: true, helper: hv, ver: c2.installed ? '0.1.0' : null, ...c2, dayN: c2.running ? 12 : null, dayCap: 800, hourN: 3, last: c2.running ? { at: '2026-11-05 22:10:00', itemId: '1', ok: true } : null, msg: c2.running ? '작업 창 숨김 · 일할 준비' : '' });
      if (u.pathname === '/col2/status') return J(S2()); if (u.pathname === '/col2/ensure') { c2 = { installed: true, running: true, on: true, want: true }; return J(S2()); } if (u.pathname === '/col2/stop') { c2 = { ...c2, running: false, on: false, want: false }; return J(S2()); }
      return J({ ok: false }, 404); });
    const r = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); localStorage.setItem('rn-device', 'HOME'); S.devOk = true; const T = []; const t0 = window.toast; window.toast = (m, ...a) => { T.push(String(m)); return t0(m, ...a); }; window.__T = T;
      await db.collection('col2_runs').doc('r1').set({ at: '2026-11-05T13:00:00.000Z', n: 20, sameN: 19, diffN: 1, noN: 0, failN: 0 });
      S.lph.at = 0; await lphCheck(true); S.sec.mg_work = true; openMgr(); await sl(900); mgrRedraw(); await sl(600); const sec = () => document.querySelector('[data-sec="mg_work"]'); const row = (pc) => sec().querySelector(`[data-c2row="${pc}"]`);
      return { has: !!row('HOME') && !!row('JS-MAIN'), t: row('HOME') ? row('HOME').innerText : '', btn: !!(row('HOME') && row('HOME').querySelector('[data-c2on="HOME"]')), off: !!(row('HOME') && row('HOME').querySelector('[data-c2off]')), alps: /ALPS/.test(row('HOME') ? row('HOME').innerText : '') }; });
    ok(r.has && r.btn && !r.off && /외부 수집기\(시험\)/.test(r.t) && /기본 꺼짐/.test(r.t) && /도우미가 없음/.test(r.t) && !r.alps, 'PC마다 🧪 외부 수집기(시험) 줄 · 기본 꺼짐 · 도우미 없음 안내 · 「⬇ 이 PC에 외부 수집기 깔고 켜기」(ALPS 글 없음)', r);
    /* 인자 없는 예전 설치 단추는 그대로 */
    const d0 = await p.evaluate(() => { const o = HTMLAnchorElement.prototype.click; let got = null; HTMLAnchorElement.prototype.click = function () { got = this.download; }; hlpInstDownload(); HTMLAnchorElement.prototype.click = o; clearInterval(S._hlpT); return got; });
    const a0 = runCmd(['@echo off', 'powershell -NoProfile -ExecutionPolicy Bypass -Command "' + await p.evaluate(() => ALPS_INSTALL.replace(/"/g, '\\"')) + '"'].join('\r\n'));
    ok(d0 === 'readnow-helper-setup.cmd' && a0[a0.indexOf('-Command') + 1] === 'irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install-print.ps1 | iex', '인자 없는 설치 파일(「⬇ 이 PC에 도우미 설치」)은 예전과 같음 — 운영 PC 영향 없음', a0);
    /* 도우미 없음 → 설치 파일(-With col2) */
    const dl = p.waitForEvent('download'); await p.click('[data-c2on="HOME"]'); const d = await dl; const txt = fs.readFileSync(await d.path(), 'utf8'); const a1 = runCmd(txt);
    ok(d.suggestedFilename() === 'readnow-helper-col2-setup.cmd' && /리드나우 도우미\(외부 수집기 포함\)/.test(txt) && !/ALPS/.test(txt), "도우미 없음 → 설치 파일(readnow-helper-col2-setup.cmd · '리드나우 도우미(외부 수집기 포함)')", txt.slice(0, 300));
    ok(a1[0] === '-NoProfile' && a1[a1.indexOf('-Command') + 1] === '& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install-print.ps1))) -With col2', '가짜 powershell이 받은 명령 = 설치 파일 + 인자 -With col2', a1);
    
    up = true; await p.waitForTimeout(7000);
    const r2 = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); mgrRedraw(); await sl(500); const row = document.querySelector('[data-c2row="HOME"]'); const g = (await db.collection('col2_ctl').doc('HOME').get()).data() || null; return { t: row.innerText, cmp: (row.querySelector('[data-c2cmp]') || {}).href || '', off: !!row.querySelector('[data-c2off]'), on: !!row.querySelector('[data-c2on]'), g, T: window.__T.slice(-4) }; });
    ok(calls.some((c) => c.startsWith('/col2/ensure')) && /"pc":"HOME"/.test(calls.find((c) => c.startsWith('/col2/ensure')) || ''), '설치되어 도우미가 켜지면 저절로 /col2/ensure(그 PC 이름)', calls.slice(-6));
    ok(/판 0\.1\.0/.test(r2.t) && /켜짐/.test(r2.t) && /오늘 읽은 수 12\/800장/.test(r2.t) && /마지막 비교 11-05 22:00 \(20권 · 같음 19 · 다름 1\)/.test(r2.t), '켜진 뒤 상태 줄: 판 · 켜짐 · 오늘 읽은 수 · 마지막 비교', r2.t);
    ok(r2.cmp === 'http://127.0.0.1:8797/compare' && r2.off && !r2.on, '「🔎 비교 화면 보기」(이 PC 8797/compare) · 「⏹ 끄기」 · 켜기 단추는 숨음');
    ok(r2.g && r2.g.on === true && r2.g.st && r2.g.st.running === true && r2.g.st.ver === '0.1.0' && /HOME/.test(r2.g.by || ''), 'Firestore col2_ctl/HOME = { on: true · 상태 · 누가 }', r2.g);
    /* 끄기 두 번 */
    let n0 = calls.length; await p.click('[data-c2off="HOME"]'); await p.waitForTimeout(400); ok(!calls.slice(n0).some((c) => c.startsWith('/col2/stop')) && await p.evaluate(() => /한 번 더 누르면/.test(document.querySelector('[data-c2off="HOME"]').textContent)), '끄기 한 번 = 안 끔(한 번 더 누르라고 보임)');
    await p.evaluate(() => mgrRedraw()); await p.waitForTimeout(300); ok(await p.evaluate(() => /한 번 더 누르면/.test(document.querySelector('[data-c2off="HOME"]').textContent)), '그 사이 화면이 다시 그려져도 한 번 누른 상태 유지');
    await p.click('[data-c2off="HOME"]'); await p.waitForTimeout(700); const g2 = await p.evaluate(async () => (await db.collection('col2_ctl').doc('HOME').get()).data());
    ok(calls.slice(n0).some((c) => c.startsWith('/col2/stop')) && g2.on === false, '4초 안 두 번째 → /col2/stop · col2_ctl/HOME on: false', g2);
    await p.waitForTimeout(400); ok(await p.evaluate(() => { const r = document.querySelector('[data-c2row="HOME"]'); return /꺼짐/.test(r.innerText) && !!r.querySelector('[data-c2on]') && !r.querySelector('[data-c2off]'); }), '끈 뒤 = 꺼짐 · 켜기 단추 다시');
    /* 다른 PC에서 누름 */
    n0 = calls.length; const t3 = await p.evaluate(async () => { document.querySelector('[data-c2on="JS-MAIN"]').click(); await new Promise((x) => setTimeout(x, 300)); return window.__T.slice(-1)[0]; });
    ok(/그 PC\(JS-MAIN\)의 웹앱에서 누르세요/.test(t3) && !calls.slice(n0).some((c) => c.startsWith('/col2/ensure')), "다른 PC 줄에서 누르면 '그 PC에서 누르세요' · 이 PC 도우미를 부르지 않음", t3);
    /* 옛 판 도우미(/col2 없음) → 설치 파일 다시 */
    hv = '1.1.8'; await p.evaluate(async () => { S.c2.at = 0; await c2Check(true); mgrRedraw(); }); await p.waitForTimeout(400);
    ok(await p.evaluate(() => /옛 판/.test(document.querySelector('[data-c2row="HOME"]').innerText)), '옛 판 도우미면 그렇다고 보임');
    const dl2 = p.waitForEvent('download', { timeout: 5000 }).catch(() => null); await p.click('[data-c2on="HOME"]'); const d2 = await dl2; ok(d2 && d2.suggestedFilename() === 'readnow-helper-col2-setup.cmd', '옛 판 도우미 → 설치 파일(외부 수집기 포함)을 다시 받게 함');
    const misc = await p.evaluate(() => ({ feat: (window.FEATS || window.FEAT || []).length, pg: JSON.stringify(pgdDefs().mgr || PAGE_GUIDES.mgr || {}).includes('외부 수집기'), help: document.documentElement.innerHTML.includes('🧪 외부 수집기(시험) — 수집기를 밖으로') }));
    ok(misc.pg, '📖 관리도구 설명서에 🧪 외부 수집기(시험) 항목');
    ok(!/alert\(|confirm\(|prompt\(/.test(await p.evaluate(() => [c2RowHtml, c2Start, c2Ensure, c2Stop, c2InstDl, hlpInstDownload].map(String).join('\n'))), '브라우저 팝업 없음');
  }); }

(async () => { await partHelper(); partInstall(); await partWeb();
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tCOL2BTN 모두 통과'); process.exit(bad ? 1 : 0); })();
