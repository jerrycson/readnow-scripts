/* t_close — (11/16 점검 ④-2 🔴) '먼저 닫기'가 샵매니저 수집기·알라딘 로그인 탭이 사는 크롬 창을 닫지 않는지
 *  ① 판정 함수(윈도우 없이): 크롬은 닫을 목록에 절대 안 들어감 · 기본 끔 · 윈도우 시작 자동 실행이면 켜 두었어도 안 함 · 사람이 켠 ③ 단추 때만
 *  ② 옛 설정 파일(0.1.6~0.1.7 · 기본 켬이라 closeFirst:true만 있고 표 closeFirstV가 없음)은 끔으로 읽음 · 파일은 지우거나 고치지 않음
 *  ③ 실제 도우미(가짜 PowerShell): --autorun은 켜 둔 설정이어도 PowerShell에 closeFirst를 넘기지 않음 · 같은 설정으로 ③ 단추는 넘김(크롬 없이)
 * 실행: node lab/pcdock/tests/t_close.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 600) : '')); } };
const R = path.join(__dirname, '..'); const A = require(path.join(R, 'apps.js')); const SET = require(path.join(R, 'settings.js'));
const MON = '\\\\.\\DISPLAY1';
const MONS = [{ id: MON, primary: true, b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1040 }, dpi: 96 }];

console.log('① 판정 함수 — 크롬은 닫을 목록에 없음 · 자동 실행이면 안 함 · 기본 끔');
{ const steps = [{ name: '웹앱', match: { procs: ['chrome'] } }, { name: 'Claude 웹', match: { procs: ['Chrome'] } }, { name: '카카오톡', match: { procs: ['KakaoTalk'] } }, { name: '폴더', match: { procs: ['explorer'] } }, { name: '번외', helper: 'col2', match: { procs: ['chrome'] } }, { name: 'PC 배치', self: true, match: { procs: ['chrome'] } }];
  const procs = A.closeProcs(steps); ok(procs.length === 2 && procs.includes('KakaoTalk') && procs.includes('explorer') && !procs.some((p) => /chrome/i.test(p)), '닫을 프로그램 = 카카오톡·탐색기 · 크롬은 대소문자 상관없이 빠짐', procs);
  ok(A.NO_CLOSE_PROCS.includes('chrome'), '크롬은 「먼저 닫지 않는 프로그램」 목록에');
  const on = { run: { closeFirst: true } };
  ok(A.closeFirstFor(on, steps, { auto: true }) === null, '윈도우 시작 자동 실행(auto)이면 켜 두었어도 하지 않음');
  const m = A.closeFirstFor(on, steps, { auto: false }); ok(m && m.procs.join() === procs.join() && m.keepTitle === A.KEEP_TITLE, '③ 단추(사람이 누름)이고 켜 두었으면 닫을 프로그램·지킬 제목을 넘김', m);
  ok(A.closeFirstFor(on, steps) !== null && A.closeFirstFor({ run: { closeFirst: false } }, steps, {}) === null && A.closeFirstFor({ run: {} }, steps, {}) === null && A.closeFirstFor(null, steps, {}) === null && A.closeFirstFor({ run: { closeFirst: 'true' } }, steps, {}) === null, '끔·값 없음·설정 없음·글자 "true"는 하지 않음(켬은 꼭 true일 때만)');
  ok(A.closeFirstFor(on, [{ match: { procs: ['chrome'] } }, { helper: 'alps', match: { procs: ['chrome'] } }], {}) === null, '크롬만 놓은 배치면 닫을 것이 없어 아예 넘기지 않음'); }

console.log('② 설정 — 기본 끔 · 옛 파일의 closeFirst:true(표 없음)는 끔으로 읽음');
{ const d = SET.defaults(); ok(d.run.closeFirst === false && d.run.closeFirstV === 2, '기본값 끔(표 closeFirstV:2와 함께)', d.run);
  const V = (run) => SET.validate({ ...SET.defaults(), run }, MONS).cfg.run;
  ok(V({ waitSec: 40, reuse: true, closeFirst: true }).closeFirst === false, '옛 파일(0.1.6~0.1.7 기본 켬 — 표 없음) → 끔');
  ok(V({ waitSec: 40 }).closeFirst === false, '칸이 없던 옛 파일(0.1.5 이하) → 끔');
  ok(V({ waitSec: 40, closeFirst: true, closeFirstV: 2 }).closeFirst === true, '새 화면에서 사람이 켠 것(표 있음) → 켬');
  ok(V({ waitSec: 40, closeFirst: false, closeFirstV: 2 }).closeFirst === false && V({ waitSec: 40, closeFirst: true, closeFirstV: 1 }).closeFirst === false, '끈 것·다른 표 → 끔');
  ok(V({ waitSec: 40, closeFirst: true }).closeFirstV === 2, '읽은 뒤에는 언제나 표를 붙임(다음 저장 때 끔+표로 쓰임)'); }

console.log('③ 실제 도우미 — 윈도우 시작 자동 실행은 먼저 닫기를 넘기지 않음');
const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
const envOf = (D) => ({ ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), RN_PCDOCK_LATE_MS: '300', RN_PCDOCK_SETTLE_MS: '300' });
const fakeLog = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); } catch (e) { return []; } };
const cfgWith = (run) => { const c = SET.defaults(); c.selfAdded = true; c.selfV = 2; c.auto = { on: true, delaySec: 0 }; c.run = { ...c.run, ...run };
  c.place = [{ id: 'w1', app: 'chrome', name: '웹앱', o: { urls: ['https://readnow.kr/app/'] }, mon: MON, c: 0, r: 0, w: 2, h: 2 }, { id: 'k1', app: 'kakao', mon: MON, c: 3, r: 2, w: 1, h: 1 }]; return c; };
function autorun(D) { return cp.spawnSync(process.execPath, [path.join(R, 'readnow-pcdock.js'), '--autorun'], { env: envOf(D), encoding: 'utf8', timeout: 60000 }); }
function serve(D) { const env = envOf(D); const p = cp.spawn(process.execPath, [path.join(R, 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 10000); p.stdout.on('data', (x) => { b += x; const mm = /PCDOCK_PORT=(\d+)/.exec(b); if (mm) { clearTimeout(t); res({ p, port: +mm[1] }); } }); }); }
function post(port, p, body) { return new Promise((res) => { const data = Buffer.from(JSON.stringify(body || {}));
  const r = http.request({ host: '127.0.0.1', port, path: p, method: 'POST', headers: { 'content-type': 'application/json', 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port, 'content-length': data.length } }, (s) => { let b = ''; s.on('data', (x) => (b += x)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); r.end(data); }); }
const get = (port, p) => new Promise((res) => { http.get({ host: '127.0.0.1', port, path: p, headers: { 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port } }, (s) => { let b = ''; s.on('data', (x) => (b += x)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j }); }); }).on('error', () => res({ code: 0, j: null })); });

(async () => { const dirs = []; const mk = () => { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockcl-')); dirs.push(D); return D; }; let S = null;
  try {
    { const D = mk(); fs.writeFileSync(path.join(D, 'settings.json'), JSON.stringify(cfgWith({ closeFirst: true, closeFirstV: 2 })));
      const r = autorun(D); const run = fakeLog(D).filter((x) => x.act === 'run')[0];
      ok(r.status === 0 && run && run.input.steps.length >= 2, '--autorun이 설정대로 실행·배치를 부름', { st: r.status, err: (r.stderr || '').slice(0, 300) });
      ok(run && !run.input.closeFirst, '켜 둔 설정(사람이 켬)이어도 윈도우 시작 때는 PowerShell에 먼저 닫기를 넘기지 않음', run && run.input.closeFirst);
      const lg = fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8'); ok(/윈도우 시작 자동 실행 — 먼저 닫기는 켜져 있어도 하지 않음/.test(lg), '기록에 「자동 실행이라 먼저 닫기 안 함」이 남음');
      /* 같은 설정 · 사람이 ③ 단추 */
      S = await serve(D); const a = await post(S.port, '/api/run', {}); const run2 = fakeLog(D).filter((x) => x.act === 'run').pop();
      ok(a.j && run2 && run2 !== run && run2.input.closeFirst && run2.input.closeFirst.procs.includes('KakaoTalk') && !run2.input.closeFirst.procs.some((p) => /chrome/i.test(p)), '같은 설정으로 ③ 단추를 누르면 넘김 — 카카오톡만 · 크롬은 없음', run2 && run2.input.closeFirst);
      S.p.kill(); S = null; }
    { const D = mk(); const old = cfgWith({ closeFirst: true }); delete old.run.closeFirstV; const oldTxt = JSON.stringify(old); fs.writeFileSync(path.join(D, 'settings.json'), oldTxt);
      S = await serve(D); const st = await get(S.port, '/api/state'); ok(st.j && st.j.cfg && st.j.cfg.run.closeFirst === false, '옛 파일(기본 켬으로 저장된 closeFirst:true)은 끔으로 읽음', st.j && st.j.cfg && st.j.cfg.run);
      const a = await post(S.port, '/api/run', {}); const run = fakeLog(D).filter((x) => x.act === 'run').pop(); ok(a.j && run && !run.input.closeFirst, '그래서 ③ 단추에도 먼저 닫기를 하지 않음(사람이 다시 켜기 전까지)', run && run.input.closeFirst);
      ok(fs.readFileSync(path.join(D, 'settings.json'), 'utf8') === oldTxt, '설정 파일은 그대로(지우거나 고쳐 쓰지 않음)');
      S.p.kill(); S = null; }
    /* (0.1.8 · 정범님 11/16 15:28) 윈도우 시작 때 카카오톡이 늦게 뜸 — 정한 시간 동안 다시 찾아 놓고, 놓은 뒤 한 번 더(로그인 창 → 본 창) · 모든 기다림·다시 찾기가 기록에 */
    { const D = mk(); const c = cfgWith({}); c.auto = { on: true, delaySec: 0, lateSec: 3, showSelf: true }; c.selfAdded = false; delete c.selfV; /* PC 배치 창 칸은 읽을 때 빈 칸에 저절로 */ fs.writeFileSync(path.join(D, 'settings.json'), JSON.stringify(c));
      const r = cp.spawnSync(process.execPath, [path.join(R, 'readnow-pcdock.js'), '--autorun'], { env: { ...envOf(D), FAKE_LATE: '2' }, encoding: 'utf8', timeout: 60000 });
      const lg = fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8'); const runs = fakeLog(D).filter((x) => x.act === 'run');
      ok(r.status === 0, '늦게 뜸 자동 실행이 끝까지 감', { st: r.status, err: (r.stderr || '').slice(0, 300) });
      ok(/늦게 뜨는 프로그램 — 카카오톡 다시 찾기\(3초까지/.test(lg), '기록: 처음 배치에서 못 놓은 카카오톡을 정한 시간까지 다시 찾는다고 남김');
      ok(/카카오톡 늦게 뜸 기다림 — 1번째\(경과 \d+초\): ✗ .*프로세스는 있는데 창이 아직 없음/.test(lg), '기록: 기다림 1번째 ✗ + 상태(프로세스는 있는데 창이 아직 없음 — 로그인·업데이트 중)');
      ok(/카카오톡 늦게 뜸 기다림 — 2번째\(경과 \d+초\): ✓ .*창 '카카오톡'\(EVA_Window_Dblclk\)을 놓음/.test(lg), '기록: 2번째 ✓ + 놓은 창 제목·종류');
      ok(/카카오톡 0초 뒤 한 번 더 — 창이 바뀌어\(로그인 창 → 본 창일 수 있음\) 새 창을 다시 놓음/.test(lg), '기록: 놓은 뒤 한 번 더 — 창이 바뀌었으면 새 창을 다시 놓음', lg.split('\n').filter((l) => /한 번 더/.test(l)));
      const lateRuns = runs.slice(1); ok(lateRuns.length >= 3 && lateRuns.every((x) => x.input.steps.length === 1 && x.input.steps[0].app === 'kakao' && !x.input.closeFirst), '다시 찾기는 카카오톡만(크롬·다른 창은 다시 건드리지 않음 · 먼저 닫기 없음)', lateRuns.map((x) => x.input.steps.map((q) => q.app)));
      ok(lateRuns[0] && lateRuns[0].input.steps[0].match.waitProc === true, '다시 찾기 중에는 프로세스가 있으면 다시 켜지 않고 창만 기다림(waitProc)', lateRuns[0] && lateRuns[0].input.steps[0].match);
      const se = lateRuns[lateRuns.length - 1]; ok(se && se.input.steps[0].launch === null && se.input.steps[0].reuse === true, '한 번 더는 켜지 않고 떠 있는 창만 다시 놓음', se && se.input.steps[0]);
      let last = null; try { last = JSON.parse(fs.readFileSync(path.join(D, 'last.json'), 'utf8')); } catch (e) {}
      const kr = last && (last.res || []).find((x) => x.inst === 'k1'); ok(kr && kr.ok && /초 뒤 다시 (찾아|놓아)/.test(kr.how) && Array.isArray(last.late) && last.late.length, '마지막 실행 기록(②)의 카카오톡 줄이 ✓ + 「n초 뒤 다시 찾아/놓아」', kr);
      ok(/PC 배치 창 — 열기 부탁\(시험이라/.test(lg), '배치가 끝나면 PC 배치 작은 창도 열어 칸에 놓기를 부탁(시험이라 실제로는 안 엶)'); }
    { const D = mk(); const c = cfgWith({}); c.auto = { on: true, delaySec: 0, lateSec: 0, showSelf: false }; c.selfAdded = false; delete c.selfV; fs.writeFileSync(path.join(D, 'settings.json'), JSON.stringify(c));
      const r = cp.spawnSync(process.execPath, [path.join(R, 'readnow-pcdock.js'), '--autorun'], { env: { ...envOf(D), FAKE_LATE: '5' }, encoding: 'utf8', timeout: 60000 });
      const lg = fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8'); const runs = fakeLog(D).filter((x) => x.act === 'run');
      ok(r.status === 0 && runs.length === 1 && !/늦게 뜨는 프로그램/.test(lg), '기다림 0초로 두면 다시 찾지 않음(처음 배치 한 번만)', runs.length);
      ok(/「윈도우 시작 때 이 창도 열기」가 꺼져 있어 안 엶/.test(lg), '「윈도우 시작 때 이 창도 열기」를 끄면 안 엶 — 기록에 남음'); }
  } catch (e) { bad++; console.log('  ✗ 시험 중 오류 — ' + e.message); }
  finally { if (S) S.p.kill(); for (const D of dirs) try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `✗ t_close ${bad}/${n} 실패` : `✓ t_close ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
