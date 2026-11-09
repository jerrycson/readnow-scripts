/* tCOL7 — 정범님 11/09 '번외 수집기 재개' · HOME 진단: 켜짐·돎인데 오늘 읽은 책 0 · '한 시간에 4번 넘게 다시 띄워 30분 쉼 — 원인: 번외 크롬이 바로 꺼짐(0.1초 · 종료 코드 0 · … · 옛 번외 크롬 1개를 먼저 닫았음)' · 실패 400번
 *  원인: 우리가 띄운 크롬이 같은 프로필(col2-work-chrome)의 다른 크롬에 일을 넘기고 0으로 끝남 — 그 크롬은 살아서 조종 주소(DevToolsActivePort)까지 씀
 *        0.1.2는 이걸 실패로 보고 다음 바퀴에 그 크롬(= '옛 번외 크롬 1개')을 닫고 또 띄워 끝없이 되풀이
 *  ① 넘겨받기: 가짜 크롬이 같은 인자로 진짜 크로미움을 따로 띄우고 곧바로 0으로 끝남 → 도우미가 그 크롬을 넘겨받아 그대로 씀(실패 0 · 다시 띄우기 없음) · 끄면 그 크롬도 닫힘
 *     정범님 크롬(다른 프로필)·📊 상태 창 크롬은 안 건드림 · 끝내기는 번외 작업 프로필만
 *  ② 조종 길 없는 크롬 때문에 첫 띄우기만 바로 꺼짐 → 이 프로필 크롬만 닫고 한 번 더 띄워 됨(실패 0)
 *  ③ 400번 되풀이로 쉬던 도우미 → 새 판으로 바뀌어 다시 켜지면(인쇄 도우미가 /quit 뒤 새로 켬) 사람 손 없이 다시 돎
 * 실행: node src/tests/tCOL7.js (또는 cd pw && node tCOL7.js) — lab/col2 시험 도구(tests/lib.js · Playwright 크로미움)를 씀 */
const fs = require('fs'), path = require('path'), cp = require('child_process'), http = require('http');
const COL2 = [path.join(__dirname, '../../lab/col2'), path.join(__dirname, '../lab/col2'), '/home/user/wk-col7/lab/col2', '/home/user/readnow-scripts/lab/col2'].find((p) => fs.existsSync(path.join(p, 'tests', 'lib.js')));
const L = require(path.join(COL2, 'tests', 'lib.js')); const { ok, wait } = L; const F = require(path.join(COL2, 'tests', 'fixtures.js'));
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const alive = (p) => { try { const st = fs.readFileSync('/proc/' + p + '/stat', 'utf8').split(') ')[1][0]; return st !== 'Z'; } catch (e) { return false; } };
const procsOf = (D, mark) => fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p)).filter((p) => { try { const c = fs.readFileSync('/proc/' + p + '/cmdline', 'utf8'); return alive(p) && c.includes(mark) && c.includes(D) && !c.includes('powershell.exe') && /--user-data-dir/.test(c) && !/--type=/.test(c); } catch (e) { return false; } });
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 40); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const st = async (H) => (await H.api('GET', '/status')).j || {};
/* 가짜 크롬 바꿔 끼우기 — handoff 파일이 있으면 같은 인자로 진짜 크로미움을 따로(부모와 떨어지게) 띄우고 곧바로 0으로 끝남 · die-once 파일이 있으면 그 파일을 지우고 한 번만 0으로 끝남 */
function chromeWrap(D) { const real = L.chromium().executablePath(); const f = D + '/bin/chrome';
  fs.writeFileSync(f, `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(D + '/chrome.log')}
for a in "$@"; do case "$a" in --app=*) exec node -e "setInterval(()=>{},1e9)" -- "$@";; esac; done
if [ -f ${JSON.stringify(D + '/die-once')} ]; then rm -f ${JSON.stringify(D + '/die-once')}; echo "기존 브라우저 세션에서 여는 중입니다." >&2; exit 0; fi
if [ -f ${JSON.stringify(D + '/chrome-die')} ]; then echo "기존 브라우저 세션에서 여는 중입니다." >&2; exit $(cat ${JSON.stringify(D + '/chrome-die')}); fi
if [ -f ${JSON.stringify(D + '/handoff')} ]; then setsid ${JSON.stringify(real)} --headless=new --no-sandbox --disable-background-networking --disable-component-update "$@" >/dev/null 2>&1 < /dev/null & echo "기존 브라우저 세션에서 여는 중입니다." >&2; exit 0; fi
exec ${JSON.stringify(real)} --headless=new --no-sandbox --disable-background-networking --disable-component-update "$@"
`); fs.chmodSync(f, 0o755); }
/* 정범님 크롬 흉내(다른 프로필 · 프로필 이름 없음)·📊 상태 창 크롬 흉내 — 끝까지 살아 있어야 함 */
const sleeper = (D, dir) => { const p = cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1e9)', '--', 'chrome.exe', `--user-data-dir=${path.join(D, dir)}`], { stdio: 'ignore', detached: true }); p.unref(); return p; };

(async () => {
  const A = await L.fakeAladin(F.productHtml);
  console.log('① 띄운 크롬이 같은 프로필의 다른 크롬에 넘기고 0으로 끝남 → 넘겨받아 그대로 씀');
  let H = await L.startHelper({ port: await freePort(), aladin: A.base, cfg: { headless: true, watch: { tickSec: 1, coolMs: 2500, handoffMs: 8000 }, auto: false } }); const D = H.D;
  const mine = sleeper(D, 'Chrome/User Data'), stat = sleeper(D, 'home/col2-stat-chrome');
  try {
    chromeWrap(D); fs.writeFileSync(D + '/handoff', '1');
    await H.api('POST', '/cfg', { on: true });
    let s = await until(async () => { const j = await st(H); return j.alive || (j.chrome && j.chrome.fails) ? j : null; }, 80);
    ok(s && s.alive && s.chrome.fails === 0 && s.chrome.adopts === 1 && s.opens === 1, '바로 끝난 크롬이 넘긴 크롬을 넘겨받아 떠 있음(실패 0 · 띄우기 1번)', JSON.stringify(s && { alive: s.alive, ch: s.chrome, opens: s.opens, msg: s.msg }));
    ok(/넘겨받아 그대로 씀/.test(H.out()), '기록에 넘겨받음이 남음');
    const pids = procsOf(D, 'col2-work-chrome'); await wait(4000); s = await st(H);
    ok(s.alive && s.opens === 1 && s.chrome.fails === 0 && !/한 시간에 4번/.test(s.msg || '') && procsOf(D, 'col2-work-chrome').join() === pids.join() && pids.length === 1, '지킴이가 여러 번 돌아도 넘겨받은 크롬을 닫고 또 띄우지 않음(0.1.2의 되풀이가 없어짐)', JSON.stringify({ pids, now: procsOf(D, 'col2-work-chrome'), opens: s.opens, msg: s.msg }));
    ok(alive(mine.pid) && alive(stat.pid), '정범님 크롬(다른 프로필)·📊 상태 창 크롬은 그대로 살아 있음');
    ok((H.T.win().acts || []).filter((a) => /^kill:/.test(a)).every((a) => a === 'kill:col2-work-chrome'), '끝내기는 번외 작업 프로필 크롬만', JSON.stringify(H.T.win().acts));
    await H.api('POST', '/cfg', { on: false }); const gone = await until(async () => !procsOf(D, 'col2-work-chrome').length, 40);
    ok(gone && alive(mine.pid), '끄면 넘겨받은 크롬도 닫힘(정범님 크롬은 그대로)', procsOf(D, 'col2-work-chrome'));

    console.log('② 조종 길 없는 크롬 때문에 첫 띄우기만 바로 꺼짐 → 이 프로필 크롬만 닫고 한 번 더');
    fs.unlinkSync(D + '/handoff'); fs.writeFileSync(D + '/die-once', '1'); await H.api('POST', '/cfg', { watch: { tickSec: 1, coolMs: 2500, handoffMs: 500 } });
    await H.api('POST', '/cfg', { on: true }); s = await until(async () => { const j = await st(H); return j.alive || (j.chrome && j.chrome.fails) ? j : null; }, 80);
    ok(s && s.alive && s.chrome.fails === 0 && s.chrome.retries >= 1 && /한 번 더 띄워 됨/.test(H.out()), '첫 띄우기가 0으로 꺼져도 실패로 세지 않고 한 번 더 띄워 떠 있음', JSON.stringify(s && { alive: s.alive, ch: s.chrome, msg: s.msg }));
    ok(alive(mine.pid) && alive(stat.pid), '여기서도 정범님 크롬·상태 창 크롬은 그대로');
    await H.api('POST', '/cfg', { on: false }); await until(async () => !procsOf(D, 'col2-work-chrome').length, 40);
  } finally { await H.stop(); killDir(D); try { process.kill(mine.pid); } catch (e) {} try { process.kill(stat.pid); } catch (e) {} }

  console.log('③ 400번 되풀이로 쉬던 도우미 → 새 판으로 다시 켜지면 저절로 다시 돎');
  const port = await freePort(); H = await L.startHelper({ port, aladin: A.base, cfg: { headless: true, watch: { tickSec: 1, coolMs: 600000, handoffMs: 200 }, auto: false } }); const D3 = H.D;
  try {
    chromeWrap(D3); fs.writeFileSync(D3 + '/chrome-die', '0'); await H.api('POST', '/cfg', { on: true });
    let s = await until(async () => { const j = await st(H); return /쉼/.test(j.msg || '') && j.chrome.coolUntil ? j : null; }, 120);
    ok(s && s.chrome.fails >= 4 && /종료 코드 0/.test(s.msg), '옛 꼴 흉내: 바로 꺼짐이 거듭되어 30분 쉼에 걸림', s && s.msg);
    fs.unlinkSync(D3 + '/chrome-die'); /* 새 판이 원인을 고친 셈 */
    const q = await H.api('POST', '/quit', { by: '인쇄 도우미 · 새 판으로 바꿈' }); await until(() => H.pr.exitCode != null, 40);
    ok(q.j && q.j.ok && H.pr.exitCode === 0, '인쇄 도우미가 새 판으로 바꿀 때 쓰는 /quit로 끝남');
    const H2 = await L.startHelper({ port, dir: D3, aladin: A.base }); chromeWrap(D3); /* 같은 자료 폴더(col2.json on:true 그대로) · 사람 손 없음 */
    s = await until(async () => { const j = await st(H2); return j.alive ? j : null; }, 80);
    ok(s && s.on && s.alive && s.chrome.fails === 0 && !s.chrome.coolUntil, '새로 켜진 도우미는 쉼·실패 횟수 없이 저절로 번외 크롬을 띄워 돎', JSON.stringify(s && { on: s.on, alive: s.alive, ch: s.chrome, msg: s.msg }));
    await H2.stop();
  } finally { try { await H.stop(); } catch (e) {} killDir(D3); }
  A.srv.close(); L.done('tCOL7');
})();
