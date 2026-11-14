/* t_server — 도우미 서버를 가짜 PowerShell로 켜서 단추 길(API)을 봄: 상태 · 저장 검사 · 실행·배치 계획 · 시작 자동 · 정리(미리보기 표 → 두 번째) · 다른 웹 페이지 막기
 * 실행: node lab/pcdock/tests/t_server.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 400) : '')); } };
function start(extraEnv) { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockt-')); const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), ...(extraEnv || {}) };
  const p = cp.spawn(process.execPath, [path.join(__dirname, '..', 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 10000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1], env }); } }); }); }
function req(port, method, p, body, hdr) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', ...(hdr === undefined ? { 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port } : hdr), ...(data ? { 'content-length': data.length } : {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j, b }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); if (data) r.write(data); r.end(); }); }
const fakeLog = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); } catch (e) { return []; } };

(async () => { const S = await start(); const P = (m, p, b, h) => req(S.port, m, p, b, h);
  try {
    console.log('① 켜기 · 상태');
    let r = await P('GET', '/api/ping'); ok(r.j && r.j.app === 'readnow-pcdock', '127.0.0.1에서 대답(/api/ping)');
    r = await P('GET', '/'); ok(r.code === 200 && /리드나우 PC 배치/.test(r.b) && /①/.test(r.b) && /④/.test(r.b), '화면(ui.html)을 줌');
    r = await P('GET', '/api/state'); const st = r.j; ok(st && st.ok && st.mons.length === 3 && st.cfg.apps.length === 13 && st.startup === false && st.catalog.length === 13 && st.build === 22631, '상태 — 모니터 3대 · 기본 프로그램 13(번외·ALPS · 0.1.7 PC 배치 더함) · 시작 자동 꺼짐 · 윈도우 빌드', st && { m: st.mons.length, err: st.err });
    ok(fs.readFileSync(path.join(S.D, 'pcdock-run.ps1'), 'utf8').startsWith('\ufeff') && /\r\n/.test(fs.readFileSync(path.join(S.D, 'pcdock-run.ps1'), 'utf8')), '윈도우 PowerShell 5.1이 한국어를 읽게 BOM·CRLF를 붙인 사본을 씀');

    console.log('② 다른 웹 페이지 막기');
    r = await P('POST', '/api/run', {}, {}); ok(r.code === 403, '머리(x-rn-dock) 없는 부탁은 거절');
    r = await P('POST', '/api/run', {}, { 'x-rn-dock': '1', origin: 'https://evil.example' }); ok(r.code === 403, '다른 출처(웹 사이트)의 부탁은 거절');

    console.log('③ 설정 저장');
    const cfg = JSON.parse(JSON.stringify(st.cfg)); cfg.place = [{ app: 'kakao', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 1, h: 1 }, { app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 2, h: 1 }];
    r = await P('POST', '/api/save', { cfg }); ok(r.code === 400 && r.j.errs.some((e) => /한 칸에 둘/.test(e)) && !(() => { try { return JSON.parse(fs.readFileSync(path.join(S.D, 'settings.json'), 'utf8')).place.some((p) => p.app === 'kakao'); } catch (e) { return false; } })(), '겹치면 저장 안 함(파일에 겹친 배치가 안 들어감 · 0.1.7부터 처음 설정은 켤 때 저장)', r.j);
    cfg.place = [{ app: 'kakao', mon: '\\\\.\\DISPLAY2', c: 4, r: 2, w: 1, h: 1 }, { app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 2, h: 3 }, { app: 'claude', mon: '\\\\.\\DISPLAY3', c: 0, r: 0, w: 2, h: 2 }];
    cfg.apps.find((a) => a.id === 'chrome').urls = ['https://readnow.kr/app/', 'https://readnow.kr/manual/']; cfg.apps.find((a) => a.id === 'claude').room = '0b9f3a10-1111-2222-3333-444455556666';
    r = await P('POST', '/api/save', { cfg }); ok(r.j && r.j.ok, '저장됨', r.j); const saved = JSON.parse(fs.readFileSync(path.join(S.D, 'settings.json'), 'utf8')); ok(saved.place.length === 3 && saved.mons['\\\\.\\DISPLAY2'].cols === 5 && !/password|token/i.test(JSON.stringify(saved)), 'settings.json — 놓은 자리 3 · 울트라와이드 5칸 · 비밀값 없음');
    r = await P('POST', '/api/save', { cfg }); ok(fs.readdirSync(path.join(S.D, 'old')).length === 2, '(0.1.7 처음 설정 파일 + 첫 저장) 다시 저장하면 예전 설정을 old\\에 남김(지우지 않음)');

    console.log('④ 설정대로 실행·배치');
    r = await P('POST', '/api/run', {}); const run = fakeLog(S.D).filter((x) => x.act === 'run').pop(); ok(run && Array.isArray(run.input.close) && !run.input.close.length && r.j.mode === 'keep', '고르지 않으면 남겨 둔 채(닫을 창 없음)');
    ok(r.j && r.j.ok && r.j.res.length === 3, '세 곳 모두 놓음(가짜 PowerShell)', r.j);
    const kk = run && run.input.steps.find((s) => s.app === 'kakao'); ok(kk && kk.rect.x === 1920 + 2048 && kk.rect.y === 720 && kk.rect.w === 512 && kk.rect.h === 360, '카카오톡 자리 = 울트라와이드 5×3의 맨 오른쪽 아래 칸(실제 화소)', kk && kk.rect);
    const cs = run && run.input.steps.find((s) => s.app === 'chrome'); ok(cs && cs.launch.args.join(' ') === '--new-window https://readnow.kr/app/ https://readnow.kr/manual/' && cs.match.fresh, '크롬 — 새 창(주소 두 개는 탭) · 새로 뜬 창만 옮김', cs && cs.launch);
    const cl = run && run.input.steps.find((s) => s.app === 'claude'); ok(cl && cl.launch.uri === 'claude://claude.ai/chat/0b9f3a10-1111-2222-3333-444455556666' && cl.rect.x === -3840 && cl.rect.w === 1920 && cl.rect.h === 1400, 'Claude — 150% 4K 모니터 왼쪽 위 2×2(실제 화소 1920×1400)', cl && cl.rect);
    r = await P('GET', '/api/state'); ok(r.j.last && r.j.last.res.length === 3, '처음 화면에 마지막 결과가 남음');

    console.log('④-2 ③ 묻기 — 남겨 둔 채 / 모두 닫고 / 취소');
    r = await P('POST', '/api/run', { mode: 'close', token: 'nope' }); ok(r.j && !r.j.ok && /닫을 목록/.test(r.j.err) && fakeLog(S.D).filter((x) => x.act === 'run').length === 1, '목록을 보지 않고 모두 닫기는 거절(아무것도 안 함)', r.j);
    r = await P('POST', '/api/closeplan', {}); const cpl = r.j; ok(cpl && cpl.ok && cpl.close.map((w) => w.proc).sort().join() === 'explorer,notepad' && cpl.keep.length === 4 && cpl.keep.some((k) => k.proc === 'chrome') && cpl.keep.some((k) => k.proc === 'explorer' && /셸/.test(k.why)), '닫을 목록 — 폴더 창·메모장만 · 크롬·Claude·원격·바탕 화면은 지킴', cpl);
    ok(!JSON.stringify(cpl.close).includes('"h"'), '화면에는 창 번호를 주지 않음(도우미가 들고 있다가 그 목록만 닫음)');
    r = await P('POST', '/api/run', { mode: 'close', token: cpl.token }); const runC = fakeLog(S.D).filter((x) => x.act === 'run').pop();
    ok(r.j && r.j.ok && r.j.mode === 'close' && runC.input.close.map((c) => c.h).sort().join() === '104,105' && r.j.closed.length === 2, '모두 닫고 — 미리 보여 준 두 창만 PowerShell에 넘김', runC && runC.input.close);
    r = await P('POST', '/api/run', { mode: 'close', token: cpl.token }); ok(r.j && !r.j.ok, '같은 목록으로 두 번은 안 됨');
    ok(/모두 닫고/.test(fs.readFileSync(path.join(S.D, 'pcdock.log'), 'utf8')), '기록에 모두 닫고 · 닫기 부탁 수');

    console.log('⑤ 윈도우 시작 자동');
    r = await P('POST', '/api/startup', { on: true }); ok(r.j && r.j.on === true && fs.existsSync(path.join(S.D, 'startup.lnk')), '켜기 → 시작 프로그램 바로가기');
    const su = fakeLog(S.D).filter((x) => x.act === 'startup' && x.on === 1).pop(); ok(su && su.input.args === '--autorun' && /run\.vbs$/.test(su.input.vbs), '바로가기는 run.vbs --autorun(창 없이 · 기다렸다 실행·배치)', su && su.input);
    r = await P('POST', '/api/startup', { on: false }); ok(r.j && r.j.on === false && fs.existsSync(path.join(S.D, 'startup.lnk.off')), '끄기 → 지우지 않고 .off로 이름만 바꿈');
    ok(JSON.parse(fs.readFileSync(path.join(S.D, 'settings.json'), 'utf8')).auto.on === false, '설정에도 꺼짐');

    console.log('⑥ PC 정리');
    r = await P('POST', '/api/clean/run', { token: 'zzz', ids: ['temp'] }); ok(r.j && !r.j.ok && /미리보기/.test(r.j.err), '미리보기 없이 바로 지우기는 거절');
    r = await P('POST', '/api/clean/scan', { lv: 2 }); const sc = r.j; const scanIn = fakeLog(S.D).filter((x) => x.act === 'cleanscan').pop().input;
    ok(sc && sc.ok && sc.items.some((i) => i.id === 'temp' && i.files === 1234) && sc.items.some((i) => i.id === 'mem'), '보통 — 지울 것 목록·크기', sc && sc.items);
    ok(scanIn.protect.includes('D:\\ReadNow') && /readnow/i.test(scanIn.mark) && scanIn.targets.every((t) => !/Google|ReadNow/.test((t.roots || []).join())), 'PowerShell에도 보호 경로·표시를 넘김(파일마다 다시 봄)');
    ok(sc.stop.map((p) => p.name).sort().join() === 'CCXProcess,OneDrive,ms-teams' && sc.stop.find((p) => p.name === 'CCXProcess').block && !sc.stop.some((p) => /chrome|node|MsMpEng/i.test(p.name)), '끌 후보 — OneDrive·Teams(포토샵이 켜져 있어 Adobe 보조는 막음) · 크롬·Node·Defender는 없음', sc.stop);
    ok(sc.info.some((p) => p.name === 'SomeGame') && !sc.startup, '모르는 무거운 프로그램은 보기만 · 보통엔 시작 프로그램 목록 없음');
    r = await P('POST', '/api/clean/run', { token: sc.token, ids: ['temp', 'thumb', 'NOPE'], pids: [13, 11, 15], trim: true }); const runIn = fakeLog(S.D).filter((x) => x.act === 'cleanrun').pop().input;
    ok(r.j && r.j.ok && runIn.targets.map((t) => t.id).join() === 'temp,thumb' && runIn.pids.map((p) => p.name).join() === 'OneDrive', '미리보기에 있던 것만 — 모르는 이름·크롬(11)·막힌 Adobe(15)는 빼고 OneDrive만 끔', runIn);
    ok(runIn.trim && runIn.skip.includes('chrome') && runIn.skip.includes('node'), '메모리 비우기는 크롬·Node 빼고');
    r = await P('POST', '/api/clean/run', { token: sc.token, ids: ['temp'] }); ok(r.j && !r.j.ok, '같은 미리보기 표로 두 번은 안 됨');
    r = await P('POST', '/api/clean/scan', { lv: 3 }); ok(r.j.startup && r.j.startup.length === 3 && r.j.defender && /Add-MpPreference/.test(r.j.defender.cmd) && r.j.startup.find((s) => /ReadNow/.test(s.name)).sug === 'keep', '깊게 — 시작 프로그램 제안 · Defender 제외 명령(글만)');
    ok(fs.readFileSync(path.join(S.D, 'pcdock.log'), 'utf8').includes('④ 정리(보통)'), '기록(pcdock.log)에 남김');

    console.log('⑦ 탐색기에서 끌어 놓기');
    r = await P('POST', '/api/lnk', { name: '메모장.lnk', b64: Buffer.from('L\0\0\0fake').toString('base64') }); ok(r.j && r.j.ok && /notepad\+\+\.exe$/.test(r.j.target) && !fs.readdirSync(path.join(S.D, 'tmp')).length, '.lnk → 대상 경로를 풀고 임시 파일은 치움', r.j);
    r = await P('POST', '/api/lnk', { name: 'x.txt', b64: 'AA==' }); ok(r.code === 400, '.lnk 아닌 파일은 거절');
    r = await P('POST', '/api/exe', { name: 'Tool.exe' }); ok(r.j && r.j.list[0] === 'C:\\Program Files\\Some\\Tool.exe', '.exe → 이름으로 찾음');
    r = await P('POST', '/api/exe', { name: '..\\evil.exe' }); ok(r.code === 400, '이상한 이름 거절');

    console.log('⑦-2 예전 설정(0.1.0) 옮기기');
    { const v1 = { v: 1, base: { aw: 16, ah: 9, cols: 4, rows: 3 }, mons: { '\\\\.\\DISPLAY1': { grid: 'auto', w: 1920, h: 1080 } }, apps: [{ id: 'chrome', kind: 'chrome', name: '크롬', icon: '🌐', urls: ['https://readnow.kr/app/'], windows: 1 }, { id: 'folder', kind: 'folder', name: '윈도우 폴더', icon: '📁', path: 'D:\\ReadNow' }],
        place: [{ app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 1, h: 1 }, { app: 'folder', mon: '\\\\.\\DISPLAY1', c: 1, r: 0, w: 1, h: 1 }], auto: { on: false, delaySec: 20 }, run: { waitSec: 40, reuse: true }, clean: { keep: [] } };
      fs.writeFileSync(path.join(S.D, 'settings.json'), JSON.stringify(v1)); const before = fs.readdirSync(path.join(S.D, 'old')).length;
      r = await P('GET', '/api/state'); const nf = JSON.parse(fs.readFileSync(path.join(S.D, 'settings.json'), 'utf8')); const olds = fs.readdirSync(path.join(S.D, 'old'));
      ok(nf.v === 2 && nf.place.every((p) => p.id && p.o) && nf.place[1].o.paths[0] === 'D:\\ReadNow' && r.j.cfg.apps.some((a) => a.kind === 'col2'), '읽을 때 배치마다 자기 설정으로 옮겨 저장', nf.place);
      ok(olds.length === before + 1 && olds.some((f) => /^settings-v1-/.test(f)) && JSON.parse(fs.readFileSync(path.join(S.D, 'old', olds.find((f) => /^settings-v1-/.test(f))), 'utf8')).v === 1, '예전 파일은 old\\settings-v1-…json에 그대로 남김(지우지 않음)'); }
    r = await P('POST', '/api/run', {}); ok(r.j && r.j.ok && r.j.res.filter((x) => x.app !== 'self').length === 2 && r.j.res.every((x) => x.inst), '옮긴 설정으로 실행·배치(배치 이름표가 결과에)', r.j);

    console.log('⑧ 두 번째로 켜면 창만');
    const t0 = Date.now(); const p2 = cp.spawnSync(process.execPath, [path.join(__dirname, '..', 'readnow-pcdock.js')], { env: S.env, timeout: 10000 }); ok(p2.status === 0 && Date.now() - t0 < 8000 && /이미 켜져 있어/.test(fs.readFileSync(path.join(S.D, 'pcdock.log'), 'utf8')), '이미 켜져 있으면 새 서버를 안 띄우고 끝남');
  } finally { S.p.kill(); try { fs.rmSync(S.D, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `✗ t_server ${bad}/${n} 실패` : `✓ t_server ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
