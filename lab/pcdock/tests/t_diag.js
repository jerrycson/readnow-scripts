/* t_diag — (0.1.6 · 정범님 11/14 15:36) 🏷 창 맨 위 이름 = 리드나우 기기 이름표(JS-MAIN — PC 신호 칸 이름) · 🩺 실행 결과가 단계마다 진단(dock.last)에 · 다시 켜도 남음 · 먼저 닫기 설정이 PowerShell에 넘어감
 * 실행: node lab/pcdock/tests/t_diag.js */
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

(async () => { const C2 = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockc2-')); let S = await start({ RN_PCDOCK_COL2: C2, COMPUTERNAME: 'DESKTOP-STFQ5B9' }); const P = (m, p, b, h) => req(S.port, m, p, b, h);
  try {
    console.log('① 이름표 — 없으면 윈도우 컴퓨터 이름 · 번외 설정(col2.json) · 수집기가 알려 준 이름이 먼저');
    let r = await P('GET', '/api/state'); ok(r.j && r.j.pc === 'DESKTOP-STFQ5B9' && r.j.pcSrc === 'os', '아무 데도 없으면 윈도우 컴퓨터 이름', r.j && [r.j.pc, r.j.pcSrc]);
    fs.writeFileSync(path.join(C2, 'want.json'), JSON.stringify({ on: true, pc: 'JS-MAIN' })); r = await P('GET', '/api/state'); ok(r.j.pc === 'JS-MAIN' && r.j.pcSrc === 'print', '인쇄 도우미가 적은 이름(col2\\want.json)', [r.j.pc, r.j.pcSrc]);
    fs.writeFileSync(path.join(C2, 'col2.json'), JSON.stringify({ on: true, pc: 'JS-MAIN', pcSrc: 'web' })); r = await P('GET', '/api/state'); ok(r.j.pc === 'JS-MAIN' && r.j.pcSrc === 'col2', '번외 도우미 설정(col2.json pc — 웹앱 기기 이름)', [r.j.pc, r.j.pcSrc]);
    r = await P('GET', '/api/diag?pc=JS-MAIN2', undefined, { 'sec-fetch-site': 'cross-site' }); r = await P('GET', '/api/diag?pc=EVIL', undefined, { origin: 'https://evil.example' }); r = await P('GET', '/api/state');
    ok(r.j.pc === 'JS-MAIN' && !fs.existsSync(path.join(S.D, 'pcname.json')), '다른 웹 페이지(출처 머리·cross-site)가 보낸 이름은 안 받음');
    r = await P('GET', '/api/diag?pc=' + encodeURIComponent('<b>x</b>'), undefined, {}); ok(!fs.existsSync(path.join(S.D, 'pcname.json')), '이름 꼴이 아니면 안 받음');
    r = await P('GET', '/api/diag?pc=JS-MAIN', undefined, {}); ok(r.j && r.j.pc === 'JS-MAIN' && r.j.pcSrc === 'collector', '수집기가 진단을 읽으며 ?pc=JS-MAIN → 이름표(수집기 칸 이름 = PC 신호 키)', r.j && [r.j.pc, r.j.pcSrc]);
    r = await P('GET', '/'); ok(/\$\{S\.pc\} · 판/.test(r.b), '창 맨 위 회색 글 = 이름표 · 판');

    console.log('② 실행 결과가 단계마다 진단에 · 먼저 닫기');
    const st = (await P('GET', '/api/state')).j; const cfg = JSON.parse(JSON.stringify(st.cfg));
    cfg.place = [{ id: 'a1', app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 2, h: 3, name: '웹앱', o: { urls: ['https://readnow.kr/app/'] } }, { id: 'a2', app: 'kakao', mon: '\\\\.\\DISPLAY2', c: 4, r: 2, w: 1, h: 1 }, { id: 'a3', app: 'col2', mon: '\\\\.\\DISPLAY2', c: 0, r: 0, w: 1, h: 1 }];
    r = await P('POST', '/api/save', { cfg }); ok(r.j && r.j.ok && r.j.cfg.run.closeFirst === true, '저장 — 먼저 닫기 기본 켬', r.j);
    r = await P('POST', '/api/run', {}); const run = fakeLog(S.D).filter((x) => x.act === 'run').pop();
    ok(run && run.input.closeFirst && run.input.closeFirst.procs.includes('chrome') && run.input.closeFirst.procs.includes('KakaoTalk') && /알라딘/.test(run.input.closeFirst.keepTitle) && /작업 창/.test(run.input.closeFirst.keepTitle), 'PowerShell에 닫을 프로그램(크롬·카카오톡)·지킬 제목(알라딘 수집 탭·작업 창)', run && run.input.closeFirst);
    ok(run && !run.input.closeFirst.procs.some((p) => /node|powershell/i.test(p)), '도우미 프로세스는 닫을 목록에 없음');
    r = await P('GET', '/api/diag', undefined, {}); const L = r.j.last;
    ok(L && L.rows.length === 3 && L.rows.every((x) => x.n && typeof x.ok === 'boolean' && x.how && /^#\d /.test(x.at)), '진단 last.rows — 단계마다 이름·됨·어떻게·놓을 칸(모니터 #·칸)', L && L.rows);
    ok(L && L.rows[0].at === '#1 0,0 2×3' && L.rows[1].at === '#2 4,2 1×1', '칸 표시가 설정과 같음', L && L.rows.map((x) => x.at));
    cfg.run.closeFirst = false; r = await P('POST', '/api/save', { cfg }); r = await P('POST', '/api/run', {}); const run2 = fakeLog(S.D).filter((x) => x.act === 'run').pop(); ok(r.j.ok !== undefined && run2 && !run2.input.closeFirst, '설정에서 끄면 먼저 닫지 않음');

    { const js = fs.readFileSync(path.join(__dirname, '..', 'readnow-pcdock.js'), 'utf8'); ok(/if \(u\.pathname === '\/api\/show'\) \{ if \(ST\.update && !ST\.busy/.test(js) && /setInterval\(\(\) => \{ if \(!ST\.update\) checkUpdate\(\); \}, 30 \* 60e3\)/.test(js), '(0.1.6) 30분마다 새 판 확인 · 받아 둔 새 판이 있으면 아이콘을 다시 누를 때 바로 바꿈'); }
    console.log('③ 다시 켜도 마지막 결과가 남음(0.1.5는 메모리에만 있어 비었음)');
    S.p.kill(); await new Promise((z) => setTimeout(z, 400)); const D0 = S.D; S = await start({ RN_PCDOCK_HOME: D0, RN_PCDOCK_COL2: C2 }); S.D = D0;
    r = await P('GET', '/api/diag', undefined, {}); ok(r.j && r.j.last && r.j.last.rows.length === 3 && r.j.pc === 'JS-MAIN', '다시 켠 뒤에도 dock.last(단계마다) · 이름표 그대로', r.j && r.j.last);
  } finally { S.p.kill(); try { fs.rmSync(S.D, { recursive: true, force: true }); fs.rmSync(C2, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `✗ t_diag ${bad}/${n} 실패` : `✓ t_diag ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
