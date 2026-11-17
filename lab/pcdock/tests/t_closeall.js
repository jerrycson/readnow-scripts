/* t_closeall — (0.1.9 · 정범님 11/17 16:16 「창에 전체 닫기 버튼 · 작업 표시줄에 열린 프로그램 모두 닫게 · 수집기든 뭐든 상관없이 전부」) ⛔ 전체 닫기
 *  ① 판정(윈도우 없이): planAll — 크롬·Claude·원격도 닫을 수 있음(걱정은 경고 글로만) · 절대 안 닫는 것(PC 배치 자신·셸·시스템)은 따로 · closeSum 셈
 *  ② 도우미 서버(가짜 PowerShell): 첫 누름 = 목록(창 번호 없이 차례 번호) · 두 번째 누름 = 고른 것만 닫음(부탁 → 6초 기다림 → 강제 종료) · 다시 쓴 열쇠·오래된 열쇠·빈 고르기는 거절
 *     결과: 닫힘·강제 종료·남음을 대답·기록(pcdock.log)·진단(lastClose)에
 *  ③ 글자 검사: PowerShell 'closeall'이 CloseSet을 씀 · C# Kill·Alive · 화면 ⛔ 단추·두 번 누름·배치도 raise
 * 실행: node lab/pcdock/tests/t_closeall.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 600) : '')); } };
const R = path.join(__dirname, '..'); const CP = require(path.join(R, 'closeplan.js'));

console.log('① 판정 — 무엇이든 닫을 수 있음 · 절대 안 닫는 것만 따로');
{ const W = [{ h: 1, pid: 10, proc: 'chrome', cls: 'Chrome_WidgetWin_1', title: '🪟 리드나우 작업 창 · 주문조회 : 알라딘', never: '' }, { h: 2, pid: 11, proc: 'claude', title: 'Claude', never: '' },
    { h: 3, pid: 12, proc: 'mstsc', title: '원격 데스크톱 연결', never: '' }, { h: 4, pid: 13, proc: 'notepad', cls: 'Notepad', title: '메모', never: '' },
    { h: 5, pid: 14, proc: 'explorer', cls: 'Progman', title: 'Program Manager', never: '윈도우 셸(바탕 화면·작업 표시줄)' }, { h: 6, pid: 15, proc: 'chrome', title: '리드나우 PC 배치', never: 'PC 배치 창' }, { h: 0, proc: 'x' }, null];
  const P = CP.planAll(W, []);
  ok(P.close.map((w) => w.h).join() === '1,2,3,4', '크롬(수집기 제목)·Claude·원격·메모장 모두 닫을 수 있는 목록에(0.1.8까지는 크롬·Claude·원격·리드나우 제목을 아예 뺐음)', P.close);
  ok(P.close[0].warn && P.close[1].warn && P.close[2].warn && P.close[3].warn === '', '걱정되는 창은 경고 글만(막지 않음) · 보통 창은 경고 없음', P.close.map((w) => w.warn));
  ok(P.never.length === 2 && P.never.some((x) => /셸/.test(x.why)) && P.never.some((x) => /PC 배치/.test(x.why)), '절대 안 닫음(셸·PC 배치 창)은 따로 까닭과 함께', P.never);
  ok(CP.planAll(null, []).close.length === 0 && CP.planAll([], []).never.length === 0, '빈 목록도 그대로 셈'); }

function start() { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockt-')); const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk') };
  const p = cp.spawn(process.execPath, [path.join(R, 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 10000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1] }); } }); }); }
function req(port, method, p, body, hdr) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', ...(hdr === undefined ? { 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port } : hdr), ...(data ? { 'content-length': data.length } : {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j, b }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); if (data) r.write(data); r.end(); }); }
const fakeLog = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); } catch (e) { return []; } };

(async () => { const S = await start(); const P = (m, p, b, h) => req(S.port, m, p, b, h);
  try {
    console.log('② 도우미 서버 — 두 번 누름');
    let r = await P('POST', '/api/closeall', {}, {}); ok(r.code === 403, '머리(x-rn-dock) 없는 부탁은 거절(다른 웹 페이지가 못 닫게)');
    r = await P('POST', '/api/closeall', {}); const pl = r.j;
    ok(pl && pl.ok && pl.token && pl.close.length === 5 && pl.close.map((w) => w.proc).join() === 'chrome,claude,explorer,notepad,mstsc', '첫 누름 = 목록만(크롬·Claude·탐색기 폴더·메모장·원격 5개)', pl);
    ok(pl.close.every((w, i) => w.i === i && !('h' in w) && !('pid' in w)), '화면에는 차례 번호만(창 번호·프로세스 번호 없음)', pl.close);
    ok(pl.never.length === 2 && pl.never.some((x) => /셸/.test(x.why)) && pl.never.some((x) => /PC 배치/.test(x.why)), '안 닫는 창 2개(윈도우 셸 · PC 배치 창)', pl.never);
    ok(!fakeLog(S.D).some((x) => x.act === 'closeall' && !x.input.plan), '첫 누름에는 아무것도 안 닫음');
    ok(fakeLog(S.D).some((x) => x.act === 'closeall' && x.input.plan && x.input.selfPids.length === 1), '목록을 볼 때도 PC 배치 서버 자신의 번호를 넘김(절대 안 닫음 표시)');
    r = await P('POST', '/api/closeall', { token: pl.token, pick: [1, 3, 4] }); const c1 = fakeLog(S.D).filter((x) => x.act === 'closeall' && !x.input.plan).pop();
    ok(r.j && r.j.ok && c1 && c1.input.wins.map((w) => w.h).join() === '102,105,106' && c1.input.waitSec === 6 && c1.input.selfPids.length === 1, '두 번째 누름 = 고른 창(Claude·메모장·원격)만 PowerShell에 · 6초 기다림 · 자기 번호', c1 && c1.input);
    ok(r.j.rows.length === 3 && r.j.rows.find((c) => c.proc === 'notepad').res === 'closed' && r.j.rows.find((c) => c.proc === 'claude').res === 'killed' && r.j.rows.find((c) => c.proc === 'mstsc').res === 'left' && r.j.rows.every((c) => !('h' in c) && !('pid' in c)), '결과 — 닫힘(메모장)·강제 종료(Claude · 부탁 뒤에도 남음)·남음(원격) · 창 번호는 안 돌려줌', r.j.rows);
    const lg = fs.readFileSync(path.join(S.D, 'pcdock.log'), 'utf8');
    ok(/⛔ 전체 닫기 — 닫힘 1 · 강제 종료 1 · 남음 1 · 고른 창 3/.test(lg) && /⛔ {3}✗ 남음 — mstsc/.test(lg) && /⛔ {3}⚠ 강제 종료 — claude/.test(lg), '기록(pcdock.log)에 셈과 창마다 줄', lg.split('\n').filter((l) => /⛔/.test(l)));
    r = await P('GET', '/api/diag', undefined, {}); ok(r.j && r.j.lastClose && r.j.lastClose.n === 3 && r.j.lastClose.sum === '닫힘 1 · 강제 종료 1 · 남음 1' && r.j.lastClose.left.length === 1 && r.j.lastClose.left[0].p === 'mstsc', '진단(lastClose) — 셈·남은 것(까닭)', r.j && r.j.lastClose);
    r = await P('POST', '/api/closeall', { token: pl.token, pick: [0] }); ok(r.j && !r.j.ok && /오래됐거나 없음/.test(r.j.err), '같은 열쇠를 다시 쓰면 거절(목록을 새로 봐야 함)', r.j);
    r = await P('POST', '/api/closeall', { token: 'nope', pick: [0] }); ok(r.j && !r.j.ok, '모르는 열쇠는 거절', r.j);
    r = await P('POST', '/api/closeall', {}); r = await P('POST', '/api/closeall', { token: r.j.token, pick: [] }); ok(r.j && !r.j.ok && /고른 창이 없음/.test(r.j.err), '하나도 안 고르면 거절', r.j);
    r = await P('POST', '/api/closeall', {}); const n0 = fakeLog(S.D).filter((x) => x.act === 'closeall' && !x.input.plan).length;
    r = await P('POST', '/api/closeall', { token: r.j.token, pick: [99, -1, 'x'] }); ok(r.j && !r.j.ok && fakeLog(S.D).filter((x) => x.act === 'closeall' && !x.input.plan).length === n0, '목록에 없는 번호만 고르면 아무것도 안 닫음', r.j);
    r = await P('POST', '/api/closeall', {}); r = await P('POST', '/api/closeall', { token: r.j.token }); const c2 = fakeLog(S.D).filter((x) => x.act === 'closeall' && !x.input.plan).pop();
    ok(r.j.ok && c2.input.wins.length === 5 && !c2.input.wins.some((w) => w.h === 103 || w.h === 107), '고르기 없이 보내면 목록 전부(그래도 셸·PC 배치 창은 목록에 없어 안 닫음)', c2.input.wins.map((w) => w.h));

    console.log('③ 글자 검사 — PowerShell·C#·화면');
    const ps = fs.readFileSync(path.join(R, 'pcdock.ps1'), 'utf8'), cs = fs.readFileSync(path.join(R, 'pcdock-win.cs'), 'utf8'), ui = fs.readFileSync(path.join(R, 'ui.html'), 'utf8');
    const ca = ps.slice(ps.indexOf("'closeall'"), ps.indexOf("'closeall'") + 3000);
    ok(ps.indexOf("'closeall'") > 0 && /NeverWhy/.test(ca) && /CloseSet /.test(ca), "PowerShell 'closeall' — 목록은 NeverWhy로 안 닫을 것 표시 · 닫기는 CloseSet(부탁 → 기다림 → 강제 종료)");
    ok(/public static bool Kill\(/.test(cs) && /public static bool Alive\(/.test(cs), 'C# — 강제 종료(Kill)·살아 있나(Alive)');
    ok(/id="b5"/.test(ui) && /⛔ 전체 닫기/.test(ui) && /api\('\/api\/closeall', \{ token: r\.token, pick: hs \}\)/.test(ui) && !/\b(alert|confirm|prompt)\(/.test(ui.replace(/\/\*[\s\S]*?\*\//g, '')), '화면 — ⛔ 단추 · 두 번째 누름에 열쇠+고른 차례 번호 · 브라우저 팝업 없음');
    ok(/function raise\(i\)[^\n]*C\.place\.splice\(i, 1\)[^\n]*C\.place\.push/.test(ui) && /raise\(D\.i\)/.test(ui), '배치도 — 누르거나 옮긴 덩이를 차례 맨 뒤로(맨 위에 그림 · 저장하면 ③도 이 차례로 놓음)');
  } finally { S.p.kill(); fs.rmSync(S.D, { recursive: true, force: true }); }
  console.log(bad ? `✗ t_closeall ${bad}/${n} 실패` : `✓ t_closeall ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
