/* t_chrome — (0.1.2 정범님 11/06 HOME '숨은 크롬이 켜자마자 꺼져 지킴이가 시간당 4번 상한에 걸려 쉼')
 *  ① 크롬이 곧바로 끝나는 경우 흉내(가짜 크롬이 바로 끝남) → 상태에 종료 코드·마지막 줄 · 4번 넘으면 '쉼'이 아니라 원인과 함께 30분(시험은 짧게) 쉼 → 쉼이 끝나면 다시 띄워 봄
 *  ② 옛 번외 크롬이 같은 프로필을 쥔 채 남은 경우(도우미가 죽어도 Windows에서는 자식 크롬이 살아남음) — 진짜 크로미움은 이때 종료 코드 21로 곧바로 끝남
 *     → 0.1.2는 띄우기 전에 그 크롬을 닫고(DevToolsActivePort가 살아 있으면 Browser.close · 아니면 이 프로필 크롬만 끝냄) 띄움
 *  ③ 조종 연결만 끊기고 크롬은 살아 있으면 그 크롬을 닫고 새로(남겨 두면 프로필을 쥔 채 남음)
 *  ④ 운영 인쇄 도우미가 끝낼 때 쓰는 /quit = 번외 크롬을 먼저 닫고 끝냄(옛 크롬이 남지 않음)
 * 실행: node tests/t_chrome.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), cp = require('child_process');
const F = require('./fixtures.js');
const procsOf = (D, mark) => fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p)).filter((p) => { try { const c = fs.readFileSync('/proc/' + p + '/cmdline', 'utf8'); const st = fs.readFileSync('/proc/' + p + '/stat', 'utf8').split(') ')[1][0]; return st !== 'Z' && c.includes(mark) && c.includes(D) && !c.includes('powershell.exe') && /--user-data-dir/.test(c) && !/--type=/.test(c); } catch (e) { return false; } });
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 40); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };

(async () => {
  const A = await L.fakeAladin(F.productHtml);
  console.log('① 크롬이 곧바로 끝남 → 원인을 남김 · 4번 넘으면 30분(시험 2.5초) 쉼 · 쉼이 끝나면 다시');
  let H = await L.startHelper({ aladin: A.base, cfg: { headless: true, watch: { tickSec: 1, coolMs: 2500, handoffMs: 300 }, auto: false } }); const D = H.D;
  try {
    fs.writeFileSync(D + '/chrome-die', '0'); /* 가짜 크롬 = '기존 브라우저 세션에서 여는 중' 한 줄을 남기고 종료 코드 0으로 곧바로 끝남(Windows 크롬이 같은 프로필을 다른 크롬에 넘길 때와 같은 꼴) */
    await H.api('POST', '/cfg', { on: true });
    let s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.chrome && j.chrome.fails >= 1 ? j : null; });
    ok(s && s.chrome.last && s.chrome.last.code === 0 && /기존 브라우저 세션/.test(s.chrome.last.tail || '') && /바로 꺼짐/.test(s.chrome.last.why) && /종료 코드 0/.test(s.chrome.last.why), '바로 꺼지면 종료 코드·마지막 줄을 상태(chrome.last)에 남김', s && s.chrome);
    s = await until(async () => { const j = (await H.api('GET', '/status')).j; return /쉼/.test(j.msg || '') && j.chrome.coolUntil ? j : null; }, 60);
    ok(s && /한 시간에 4번 넘게 다시 띄워 30분 쉼/.test(s.msg) && /원인: 번외 크롬이 바로 꺼짐/.test(s.msg) && /종료 코드 0/.test(s.msg) && s.chrome.fails === 4 && s.chrome.cools === 1, "4번 넘게 꺼지면 그냥 '쉼'이 아니라 원인(종료 코드·마지막 줄)과 다시 해 볼 시각", s && s.msg);
    const n1 = H.T.clog().length; await wait(1500); ok(H.T.clog().length === n1, '쉬는 동안은 다시 띄우지 않음(끝없이 띄우기 막음)');
    fs.unlinkSync(D + '/chrome-die'); /* 크롬이 고쳐짐 */
    s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.alive ? j : null; }, 40);
    ok(s && s.alive && !s.chrome.coolUntil && s.opens === 1 && /쉼이 끝나 번외 크롬을 다시 띄워 봄/.test(H.out()), '쉼이 끝나면 횟수를 새로 세고 다시 띄워 봄 → 떠 있음', s && { alive: s.alive, opens: s.opens, cool: s.chrome.coolUntil });
  } finally { await H.stop(); killDir(D); }

  console.log('② 옛 번외 크롬이 같은 프로필을 쥔 채 남음(도우미가 죽어도 자식 크롬은 살아남는 Windows 꼴)');
  H = await L.startHelper({ aladin: A.base, cfg: { headless: true, watch: { tickSec: 60 }, auto: false } }); const D2 = H.D; const prof = path.join(D2, 'home', 'col2-work-chrome');
  const real = L.chromium().executablePath(); const orphan = (dbg) => { fs.mkdirSync(prof, { recursive: true }); const p = cp.spawn(real, ['--headless=new', '--no-sandbox', `--user-data-dir=${prof}`, ...(dbg ? ['--remote-debugging-port=0'] : []), 'about:blank'], { stdio: 'ignore', detached: true }); p.unref(); return p; };
  try {
    /* 0.1.1까지의 꼴 — 진짜 크로미움은 같은 프로필 크롬이 있으면 곧바로 끝남(종료 코드 21) */
    const o0 = orphan(true); await until(() => fs.existsSync(path.join(prof, 'DevToolsActivePort')), 40);
    const r0 = cp.spawnSync(real, ['--headless=new', '--no-sandbox', `--user-data-dir=${prof}`, 'about:blank'], { encoding: 'utf8', timeout: 20000 });
    ok(r0.status === 21 && /ProcessSingleton/.test(r0.stderr), '흉내 확인: 같은 프로필을 쥔 크롬이 있으면 새 크롬은 곧바로 끝남(종료 코드 21) — 숨은 크롬이 켜자마자 꺼지던 까닭', r0.status);
    await H.api('POST', '/cfg', { on: true }); let s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.alive ? j : null; }, 60); await wait(600);
    ok(s && s.alive && s.chrome.fails === 0 && s.opens === 1 && /옛 번외 크롬 1개를 먼저 닫고 띄움/.test(H.out()), '0.1.2: 남은 옛 크롬(조종 길 살아 있음)을 먼저 점잖게 닫고 한 번에 띄움', JSON.stringify(s && { alive: s.alive, fails: s.chrome.fails, opens: s.opens, last: s.chrome.last }));
    ok(o0.exitCode != null || o0.signalCode != null || procsOf(D2, 'col2-work-chrome').length === 1, '옛 크롬은 닫히고 번외 크롬은 하나만', procsOf(D2, 'col2-work-chrome').length);
    /* 조종 길이 없는 옛 크롬(DevToolsActivePort가 지워짐) → 이 프로필 크롬만 끝냄 */
    await H.api('POST', '/cfg', { on: false }); await until(async () => !procsOf(D2, 'col2-work-chrome').length, 40);
    let o1 = null; for (let t = 0; t < 4; t++) { await wait(1000); o1 = orphan(false); await wait(2000); if (o1.exitCode == null && o1.signalCode == null) break; } /* 앞 크롬이 다 닫히기 전이면 옛 크롬 흉내가 스스로 끝나므로 다시 */
    ok(o1.exitCode == null && o1.signalCode == null, '흉내: 조종 길 없는 옛 크롬(DevToolsActivePort 없음 또는 낡음)이 프로필을 쥐고 있음', o1.exitCode);
    await H.api('POST', '/cfg', { on: true }); s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.alive ? j : null; }, 60); await wait(600);
    ok(s && s.alive && s.chrome.fails === 0 && (o1.exitCode != null || o1.signalCode != null) && (H.T.win().kills || 0) >= 1 && procsOf(D2, 'col2-work-chrome').length === 1, '조종 길 없는 옛 크롬은 이 프로필 이름이 든 크롬만 끝내고(창 다루기 kill) 띄움', JSON.stringify({ kills: H.T.win().kills, n: procsOf(D2, "col2-work-chrome").length, s: s && s.chrome, acts: H.T.win().acts }));
    ok((H.T.win().acts || []).filter((a) => /^kill:/.test(a)).every((a) => a === 'kill:col2-work-chrome'), '끝내기는 번외 작업 프로필 크롬만(정범님 크롬·운영 작업 창·상태 창 안 건드림)');

    console.log('③ 조종 연결만 끊긴 크롬');
    const pid0 = procsOf(D2, 'col2-work-chrome')[0]; await H.api('POST', '/test/drop', {}); s = await until(async () => { const j = (await H.api('GET', '/status')).j; return !j.alive ? j : null; }, 20);
    await H.api('POST', '/test/tick', {}); s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.alive ? j : null; }, 60); const left = procsOf(D2, 'col2-work-chrome');
    ok(s && s.alive && s.chrome.fails === 0 && left.length === 1 && left[0] !== pid0 && /조종 연결만 끊긴 번외 크롬을 닫고/.test(H.out()), '연결만 끊긴 크롬은 닫고 새로 띄움(같은 프로필을 쥔 채 남지 않음)', JSON.stringify({ left, pid0, s: s && s.chrome, alive: s && s.alive }));

    console.log('④ /quit — 번외 크롬을 먼저 닫고 끝냄');
    const q = await H.api('POST', '/quit', { by: '시험' }); await until(() => H.pr.exitCode != null, 40); await wait(500);
    ok(q.j && q.j.ok && H.pr.exitCode === 0 && procsOf(D2, 'col2-work-chrome').length === 0, '/quit 뒤 도우미 끝남 · 번외 크롬도 남지 않음', procsOf(D2, 'col2-work-chrome'));
  } finally { try { await H.stop(); } catch (e) {} killDir(D2); }
  A.srv.close(); L.done('t_chrome');
})();
