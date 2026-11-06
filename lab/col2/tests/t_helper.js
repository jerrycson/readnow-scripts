/* t_helper — 번외 도우미: 출처 막기 · 운영 포트 거절 · 숨은 작업 창(따로 된 프로필·화면 밖·작업 표시줄 숨김) · 지킴이(꺼지면 다시 띄움 · 나오면 다시 숨김)
 *            · 보이기/숨기기 = 자리·크기 기억 · 웹앱 자리는 더 늦은 쪽 · 상태 창(따로 된 프로필 · 자리 기억 · 이미 있으면 앞으로) · 끄면 번외 크롬만 닫음
 * 실행: node tests/t_helper.js  (시험 포트 COL2_TEST_PORT · 기본 8775) */
const L = require('./lib.js'); const { ok, wait } = L; const cp = require('child_process'), path = require('path'), fs = require('fs');
const F = require('./fixtures.js');

(async () => {
  console.log('① 운영 포트로는 켜지지 않음');
  for (const p of ['8898', '8899']) { const r = cp.spawnSync(process.execPath, [path.join(L.ROOT, 'helper', 'readnow-col2-helper.js')], { env: { ...process.env, RN_COL2_PORT: p, RN_COL2_HOME: '/tmp/col2_never' }, encoding: 'utf8', timeout: 10000 }); ok(r.status === 2 && /운영 도우미 포트/.test(r.stderr), `포트 ${p}(운영) 거절`); }

  const A = await L.fakeAladin(F.productHtml);
  const H = await L.startHelper({ aladin: A.base, cfg: { pace: { minGapMs: 300 }, watch: { tickSec: 1 } } }); const T = H.T;
  const procs = (mark) => fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p)).filter((p) => { try { const c = fs.readFileSync('/proc/' + p + '/cmdline', 'utf8'); return c.includes(mark) && c.includes(H.D) && !c.includes('powershell.exe'); } catch (e) { return false; } });
  try {
    console.log('② 듣는 길 막기');
    ok((await H.req('GET', '/status')).st === 403, '머리(X-RN-Col2) 없으면 거절');
    ok((await H.api('GET', '/status', null, { Origin: 'https://www.aladin.co.kr' })).st === 403, '알라딘 화면 출처는 거절');
    ok((await H.api('GET', '/status', null, { Origin: 'https://evil.test' })).st === 403, '다른 웹 페이지 출처 거절');
    const wo = await H.api('GET', '/status', null, { Origin: 'https://jerrycson.github.io' }); ok(wo.st === 200 && wo.h['access-control-allow-origin'] === 'https://jerrycson.github.io' && wo.h['access-control-allow-private-network'] === 'true', '웹앱 출처(Pages)는 받음 + 이 PC 주소 허락 머리');
    ok((await H.req('GET', '/status', null, { 'X-RN-Col2': '1', Host: 'evil.test:' + H.port })).st === 403, 'Host가 127.0.0.1이 아니면 거절(주소 바꿔치기 막음)');
    const pg = await H.req('GET', '/'); ok(pg.st === 200 && /번외 수집 상태/.test(pg.b) && /🪟 보이기/.test(pg.b) && !/alert\(|confirm\(|prompt\(/.test(pg.b), '주소창 / = 상태 창 화면(팝업 없음)');
    ok((await H.req('GET', '/', null, { Origin: 'https://jerrycson.github.io' })).st === 403, '상태 창 화면은 다른 출처에서 못 엶');
    const s0 = (await H.api('GET', '/status')).j; ok(s0.on === false && s0.port === H.port && s0.ver === '0.1.2', '처음엔 꺼짐 · 시험 포트 · 판 0.1.2');

    console.log('③ 숨은 작업 창');
    await wait(1500); ok(T.clog().length === 0 && procs('col2-work-chrome').length === 0, '꺼 두면 번외 크롬을 띄우지 않음');
    await H.api('POST', '/cfg', { on: true }); for (let k = 0; k < 40 && !(T.win()['col2-work-chrome'] || {}).tool; k++) await wait(250);
    const a1 = T.clog().find((l) => /col2-work-chrome/.test(l)) || ''; ok(/--user-data-dir=\S*col2-work-chrome/.test(a1) && !/--profile-directory/.test(a1) && /--disable-extensions/.test(a1) && /--window-position=-32000/.test(a1), '켜면 번외 크롬 = 따로 된 프로필(정범님 크롬·로그인과 무관) · 확장 없음(Tampermonkey 없음) · 화면 밖 자리', a1.slice(0, 120));
    ok(/--disable-background-timer-throttling/.test(a1) && /--disable-backgrounding-occluded-windows/.test(a1) && /--disable-renderer-backgrounding/.test(a1), '가려져도 늦추지 않는 플래그(이 크롬에만)');
    ok(/--remote-debugging-address=127\.0\.0\.1/.test(a1) && /--remote-debugging-port=0/.test(a1), '조종 길은 이 PC 안(127.0.0.1)·빈 포트');
    let w = T.win()['col2-work-chrome']; ok(w && w.tool && w.r.x + w.r.w <= 0, '창을 화면 밖·작업 표시줄 밖으로', JSON.stringify(w && w.r));
    ok((T.win().acts || []).every((x) => /:col2-(work|stat|win)-chrome$/.test(x)), '창 다루기는 번외 프로필 창만(운영 작업 창·정범님 창 안 건드림)');
    await H.api('POST', '/cfg', { watch: { tickSec: 1, pause: true } }); await wait(1200); /* 시험 동안 1초 지킴이를 멈추고 손으로 돌림(가짜 창 파일을 둘이 동시에 쓰지 않게) */
    T.setWin((S) => { S['col2-work-chrome'].r = { x: 100, y: 100, w: 1280, h: 900 }; S['col2-work-chrome'].tool = false; }); await H.api('POST', '/test/tick', {}); w = T.win()['col2-work-chrome'];
    ok(w.tool && w.r.x < 0, '지킴이: 창이 화면 안으로 나오면 다시 숨김');

    console.log('④ 보이기·숨기기·자리 기억');
    let r = await H.api('POST', '/win/show', { why: '시험' }); w = T.win()['col2-work-chrome']; ok(r.j.ok && !w.tool && w.r.x === 360 && r.j.state.shown, '보이기 — 저장 자리 없으면 가운데 기본 크기', JSON.stringify(w.r));
    await H.api('POST', '/test/tick', {}); ok(!T.win()['col2-work-chrome'].tool, '보이는 동안은 지킴이가 숨기지 않음');
    T.setWin((S) => { S['col2-work-chrome'].r = { x: 120, y: 60, w: 1000, h: 700 }; });
    r = await H.api('POST', '/win/hide', {}); w = T.win()['col2-work-chrome']; ok(r.j.ok && r.j.state.win && r.j.state.win.x === 120 && r.j.state.win.w === 1000 && w.tool && w.r.x < 0, '옮긴 뒤 숨기기 = 그 자리·크기 저장 + 다시 화면 밖');
    await H.api('POST', '/win/show', {}); ok(JSON.stringify(T.win()['col2-work-chrome'].r) === JSON.stringify({ x: 120, y: 60, w: 1000, h: 700 }), '다시 보이기 = 저장한 자리·크기'); await H.api('POST', '/win/hide', {});
    const cfgF = path.join(H.D, 'home', 'col2.json'); ok(JSON.parse(fs.readFileSync(cfgF, 'utf8')).win.x === 120, '자리·크기는 파일(col2.json)에 — PC를 다시 켜도 그대로');
    await H.api('POST', '/cfg', { win: { x: 5, y: 5, w: 900, h: 600, at: 1 } }); ok((await H.api('GET', '/status')).j.win.x === 120, '웹앱 자리가 PC에서 옮긴 것보다 옛것이면 쓰지 않음');
    await H.api('POST', '/cfg', { win: { x: 300, y: 70, w: 1100, h: 750, at: Date.now() + 5000 } }); ok((await H.api('GET', '/status')).j.win.x === 300, '더 늦게 고친 자리는 씀');
    ok((await H.api('POST', '/win/rect', { win: { x: 1, y: 1, w: 50, h: 50 } })).st === 400, '너무 작은 자리·크기는 거절');
    await H.api('POST', '/win/hrect', { x: 1500, y: 10, w: 460, h: 680 }); ok((await H.api('GET', '/status')).j.hwin.x === 1500, '상태 창이 알린 자기 자리·크기를 저장');
    r = await H.api('POST', '/win/status-open', {}); await wait(800); const la = T.clog().find((l) => /--app=/.test(l)) || '';
    ok(r.j.ok && new RegExp(`--app=http://127\\.0\\.0\\.1:${H.port}/`).test(la) && /col2-stat-chrome/.test(la) && /--window-position=1500,10/.test(la) && /--window-size=460,680/.test(la), '📊 상태 창 = 따로 된 프로필 · 저장한 자리·크기', la.slice(0, 140));
    r = await H.api('POST', '/win/status-open', {}); ok(r.j.ok && /앞으로/.test(r.j.msg) && T.clog().filter((l) => /--app=/.test(l)).length === 1, '이미 열려 있으면 새로 띄우지 않고 앞으로');

    console.log('④-2 작은 앱 창(🔎 비교 화면 · 380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위)');
    const appL = () => T.clog().filter((l) => /--app=\S*\/compare/.test(l));
    r = await H.api('POST', '/win/app?p=compare', { why: '시험' }); await wait(800); let ca = appL().slice(-1)[0] || '';
    ok(r.j.ok && /col2-win-chrome/.test(ca) && /--window-size=380,560/.test(ca) && /--window-position=1540,0/.test(ca) && /--no-first-run/.test(ca) && /--disable-extensions/.test(ca), '처음 = 크롬 --app 작은 창 380×560 · 첫 화면 오른쪽 위 · 전용 프로필(col2-win-chrome)', ca.slice(0, 200));
    r = await H.api('POST', '/win/app?p=compare', {}); ok(r.j.ok && r.j.front && appL().length === 1, '이미 떠 있으면 새로 띄우지 않고 앞으로', r.j.msg);
    ok((T.win().acts || []).includes('show:col2-win-chrome') && JSON.stringify(T.win()['col2-win-chrome'].r) === JSON.stringify({ x: 1540, y: 0, w: 380, h: 560 }), '앞으로 가져올 때도 작은 크기 그대로(큰 창으로 안 바뀜)', JSON.stringify(T.win()['col2-win-chrome'] && T.win()['col2-win-chrome'].r));
    await H.api('POST', '/win/hrect', { p: 'compare', x: 100, y: 50, w: 400, h: 600 }); ok((await H.api('GET', '/status')).j.cwin.x === 100 && (await H.api('GET', '/status')).j.hwin.x === 1500, '창이 알린 자리·크기는 그 창 칸(cwin)에만 저장');
    const killMark = (m) => { for (const pid of procs(m)) try { process.kill(+pid); } catch (e) {} }; killMark('col2-win-chrome'); await wait(500);
    await H.api('POST', '/win/app?p=compare', {}); await wait(800); ca = appL().slice(-1)[0] || ''; ok(appL().length === 2 && /--window-position=100,50/.test(ca) && /--window-size=400,600/.test(ca), '닫았다 다시 열면 기억한 자리·크기', ca.slice(0, 200));
    killMark('col2-win-chrome'); await wait(500); await H.api('POST', '/win/hrect', { p: 'compare', x: 6000, y: 3000, w: 380, h: 560 });
    await H.api('POST', '/win/app?p=compare', {}); await wait(800); ca = appL().slice(-1)[0] || ''; ok(/--window-position=1540,0/.test(ca), '기억한 자리가 화면 밖이면 오른쪽 위', ca.slice(0, 200)); killMark('col2-win-chrome');
    const pg2 = await H.req('GET', '/'); ok(/data-a="app\?p=compare"/.test(pg2.b) && !/target="_blank"/.test(pg2.b) && /max-width:100%|overflow-x:hidden/.test(pg2.b) && /<details/.test(pg2.b) && /이 PC:/.test(pg2.b) && /알라딘 로그인: 이 단계에선 안 함/.test(pg2.b), '📊 상태 창 = 작은 창 꾸밈(접는 칸) · 비교 화면은 새 탭 대신 작은 창 단추 · 이 PC 이름 · 알라딘 로그인 안 하는 까닭');

    console.log('⑤ 지킴이 — 꺼지면 다시 띄움 · 다시 열기 · 끄기');
    await H.api('POST', '/cfg', { watch: { tickSec: 1, pause: false } });
    const n0 = T.clog().filter((l) => /col2-work-chrome/.test(l) && !/--app=/.test(l)).length; await H.api('POST', '/test/kill', {}); await wait(600);
    for (let k = 0; k < 30 && !(await H.api('GET', '/status')).j.alive; k++) await wait(300);
    const s2 = (await H.api('GET', '/status')).j; ok(s2.alive && T.clog().filter((l) => /col2-work-chrome/.test(l) && !/--app=/.test(l)).length === n0 + 1 && s2.opens === 2, '번외 크롬이 죽으면 지킴이가 다시 띄움(한 시간 횟수 셈)', 'opens ' + s2.opens);
    r = await H.api('POST', '/win/reopen', {}); ok(r.j.ok && r.j.state.opens === 3, '↻ 다시 열기 = 닫고 새로 띄움');
    r = await H.api('POST', '/win/reopen', {}); const r2 = await H.api('POST', '/win/reopen', {}); ok(r.j.ok && !r2.j.ok && /한 시간에 4번/.test(r2.j.err || ''), '한 시간 4번 넘게는 다시 띄우지 않음(끝없이 띄우기 막음)', r2.j.err);
    await H.api('POST', '/cfg', { on: false }); for (let k = 0; k < 30 && procs('col2-work-chrome').length; k++) await wait(300);
    ok(procs('col2-work-chrome').length === 0, '끄면 번외 크롬을 닫음');
    ok((await H.api('POST', '/win/show', {})).j.ok === false, '꺼진 동안 보이기는 하지 않음');
    ok(/번외 수집 켬/.test(H.out()) && /번외 작업 창을 띄움/.test(H.out()) && /번외 수집 끔/.test(H.out()), '도우미 기록 줄');
  } finally { await H.stop(); for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(H.D)) process.kill(+p); } catch (e) {} } A.srv.close(); }
  L.done('t_helper');
})();
