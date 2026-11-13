// tSHIPSAFE — 정범님 11/09 저녁 '언제든 불시에 출고 버튼을 눌러도 아무 문제가 없어야 돼 … 업데이트를 하던 도중이든 하기 바로 직전이든' (shipsafe2)
//  ① 웹앱 판단 한 곳(sgPreDecide): 바꾸는 중이면 기다림 · 받아만 둔 판은 미룸 · 출고 관련(웹앱 APP_SHIP_REL · 수집기 RN_SHIP_REL · ALPS 도우미)이면 묻기
//  ② 수집기(가짜 화면): 출고 칸 맥박 → 1시간 넘는 출고도 보호 · 맥박이 끊기면 1시간 뒤 풀림 · 업데이트 상태(upd)를 웹앱에 알림 · '업데이트 먼저' 신호 · 받아 둔 판의 출고 관련 판정
//  ③ 수집기 원본 글: 안전한 새로고침이 새 탭을 열기 전에 출고가 시작되면 멈춤(옛 판 그대로) · 새 탭이 이어받으면 '바꾸기 끝' · 새 판 지킴이가 '업데이트 먼저'면 기다리지 않음
//  ④ 인쇄 도우미: 바꾸기 전 옛 판 보관·표 → 새 판 60초 버팀(끝) / 3번 넘게 죽음(옛 판으로 되돌림 · 그 판 다시 안 받음) · 바꾸는 중엔 새 ALPS 일 안 받음 · 모듈 바꾸기 실패면 옛 판
//  ⑤ 웹앱(Playwright): 두 번 누름 · 업데이트 정리 중 기다림 → 끝나면 출고 · 출고 관련 새 판 묻기(먼저 출고 / 업데이트 먼저 / 출고하지 않음) · 저절로 시작은 묻지 않음
//     · 도우미가 바꾸는 중이라 ALPS 일을 거절하면 저절로 다시 · 출고 끝 기록 줄 · 출고 보호 최대 시간 기본 1시간·설정 칸
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const pick = (...L) => L.find((f) => fs.existsSync(f));
const s = fs.readFileSync(pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', 'readnow-collector.user.js')), 'utf8');
const APPF = pick(path.join(__dirname, '..', 'app.html')); const A = fs.readFileSync(APPF, 'utf8');
const PR = pick(path.join(__dirname, '..', '..', 'local', 'readnow-print.js'), path.join(__dirname, '..', 'local', 'readnow-print.js')); const P = fs.readFileSync(PR, 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const cutIn = (t, a, endMark) => { const i = t.indexOf(a); const j = t.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return t.slice(i, j); };
const MIN = 60e3, H = 3600e3;
const vNum = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0);

function mkRt(o) { o = o || {}; const GM = { 'rnu-pcname': o.pc || 'JS-MAIN', ...(o.gm || {}) }; const logs = []; const attrs = {}; const clock = { now: o.now || 1.8e12 }; const beats = [];
  const FakeDate = class extends Date { static now() { return clock.now; } };
  const W = { __rnLog: (m, lv, x) => logs.push(lv + ' ' + x), __rnSgBeat: (ids) => beats.push(ids.join()), __rnSgUpd: o.upd ? () => o.upd : undefined }; W.top = W;
  const doc = { documentElement: { getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = String(v); } } };
  const src = cutIn(s, '(function rnShipGuard()', '/* (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기');
  new Function('window', 'GM_getValue', 'GM_setValue', 'location', 'document', 'setInterval', 'setTimeout', 'Date', src)(W, (k, d) => (k in GM ? GM[k] : d), (k, v) => { GM[k] = v; }, { hostname: o.host || 'www.aladin.co.kr' }, doc, () => 0, (f) => { Promise.resolve().then(f); return 0; }, FakeDate);
  return { W, GM, logs, attrs, clock, beats, tick: () => W.__rnShipTick() }; }

(async () => {
  // ── ① 웹앱 판단 한 곳 ──
  const sgPreDecide = new Function(cutIn(A, 'function sgPreDecide(x)', '/* ⟦sgPreDecide 끝⟧ */') + '; return sgPreDecide;')();
  { const d = sgPreDecide({}); ok(!d.wait.length && !d.pend.length, '① 업데이트가 없으면 기다리지도 묻지도 않음'); }
  { const d = sgPreDecide({ col: { cur: '1.89.240', reloading: { v: '1.89.241', at: 1 } } }); ok(d.wait.length === 1 && /새 판 1\.89\.241으로 바꾸는 중/.test(d.wait[0].m) && !d.pend.length, '① 수집기가 새 탭으로 바꾸는 중 → 끝날 때까지 기다림(되돌리지 않음 — 새 탭 넘기기는 2분 안에 끝남)'); }
  { const d = sgPreDecide({ alps: { reach: 'ok', ver: '0.5.6', want: '0.5.6', upd: { st: 'swap', to: '1.2.2' } } }); ok(d.wait.length === 1 && /바꾸는 중/.test(d.wait[0].m), '① 인쇄·ALPS 도우미가 파일을 바꾸는 중 → 기다림'); }
  { const d = sgPreDecide({ alps: { reach: 'down', seen: true, want: '0.5.6' } }); ok(d.wait.length === 1 && /다시 켜지는 중/.test(d.wait[0].m), '① 조금 전까지 답하던 도우미가 안 답함(다시 켜지는 5~10초) → 기다림'); ok(!sgPreDecide({ alps: { reach: 'down', seen: false } }).wait.length, '① 이 PC에 도우미가 원래 없으면 기다리지 않음(시작 전 점검이 원격 도우미로)'); }
  { const d = sgPreDecide({ alps: { reach: 'ok', ver: '0.5.6', want: '0.5.6', upd: { st: 'boot', to: '1.2.2' } } }); ok(!d.wait.length, '① 도우미가 새 판으로 켜진 뒤(지켜보는 60초)는 기다리지 않음 — 새 판 완전히'); }
  { const d = sgPreDecide({ web: { nv: '1.78.436', rel: false }, col: { cur: '1.89.240', staged: '1.89.241', rel: false } }); ok(!d.wait.length && d.pend.length === 2 && !d.rel.length, '① 받아만 둔 새 판(출고와 상관없음) → 묻지 않고 출고 동안 미룸'); }
  { const d = sgPreDecide({ web: { nv: '1.78.436', rel: true } }); ok(d.rel.length === 1 && /출고 쪽이 바뀜/.test(d.rel[0].m), '① 웹앱 새 판이 출고 관련(APP_SHIP_REL) → 물어볼 것'); }
  { const d = sgPreDecide({ col: { cur: '1.89.240', staged: '1.89.241', rel: true } }); ok(d.rel.length === 1 && d.rel[0].k === 'col', '① 수집기 받아 둔 판이 출고 관련(RN_SHIP_REL) → 물어볼 것'); ok(!sgPreDecide({ col: { cur: '1.89.240', staged: '1.89.241', rel: true, hw: true } }).rel.length, '① Tampermonkey가 받아야 하는 판(머리 바뀜)은 바로 못 바꾸니 묻지 않고 미룸'); }
  { const d = sgPreDecide({ alps: { reach: 'ok', ver: '0.5.5', want: '0.5.6' } }); ok(d.rel.length === 1 && d.rel[0].k === 'alps' && d.rel[0].nv === '0.5.6', '① ALPS 도우미 새 판(출고 그 자체) → 물어볼 것'); }
  ok(/^const APP_SHIP_REL = '[\d.]+';[^\n]*\nconst APP_VER = /m.test(A), '① 웹앱 출고 관련 표시 칸(APP_SHIP_REL)은 APP_VER 바로 앞 줄(새 판 확인이 앞부분만 받아도 읽힘)');
  ok(/const sr = \(t\.match\(\/const APP_SHIP_REL = /.test(A) && /S\._updRel = !!\(sr && cmpVer\(sr, APP_VER\) > 0\)/.test(A), '① 새 판 확인이 출고 관련 표시를 읽음');

  // ── ② 수집기(가짜 화면) ──
  { const { shipGuardDecide } = new Function(cutIn(s, 'function shipGuardDecide(o)', '/* ⟦shipGuardDecide 끝⟧ */') + '; return { shipGuardDecide };')(); const now = 1.8e12;
    const h = { a: { pc: 'JS-MAIN', why: '▶ 오늘 출고 끝까지', t0: now - 2 * H, beat: now - 3 * MIN } };
    ok(shipGuardDecide({ now, pc: 'JS-MAIN', holds: h }).on && shipGuardDecide({ now, pc: 'MJ-MAIN', holds: h }).on, '② 1시간 넘게 도는 출고도 맥박(beat)이 오는 동안은 보호(출고 PC·MJ-MAIN)');
    const d = shipGuardDecide({ now, pc: 'JS-MAIN', holds: { a: { ...h.a, beat: now - H - 1000 } } }); ok(!d.on && d.expired.length === 1, '② 맥박이 끊긴 뒤 1시간 → 풀림');
    ok(shipGuardDecide({ now, pc: 'JS-MAIN', holds: h }).until === h.a.beat + H, '② 풀릴 때 = 마지막 맥박 + 1시간'); }
  { const R = mkRt({ pc: 'JS-MAIN' }); R.W.__rnShipLocal('inv_1', '송장 입력'); ok(R.GM['rn-sg-local'].inv_1.tab, '② 이 탭이 맡은 출고 칸에 탭 표시'); await R.tick(); ok(!R.beats.length, '② 막 시작한 칸은 맥박 안 씀');
    R.clock.now += 6 * MIN; await R.tick(); ok(R.beats.join() === 'inv_1' && R.GM['rn-sg-local'].inv_1.beat === R.clock.now, '② 5분 넘으면 맥박(서버 출고 표·이 PC 공용 칸)');
    R.clock.now += 55 * MIN; await R.tick(); R.clock.now += 55 * MIN; ok(R.W.__rnSgOn() && R.beats.length === 2, '② 이 탭이 살아 맥박을 쓰는 동안은 시작에서 1시간 넘어도(116분) 보호'); R.clock.now += 61 * MIN; ok(!R.W.__rnSgOn(), '② 맥박이 61분 끊기면 풀림'); }
  { const R = mkRt({ pc: 'JS-MAIN' }); R.W.__rnShipLocal('inv_2', '송장 입력'); R.GM['rn-sg-local'].inv_2.tab = 'other'; R.clock.now += 6 * MIN; await R.tick(); ok(!R.beats.length, '② 다른(죽었을 수 있는) 탭이 맡은 칸에는 맥박을 대신 쓰지 않음 → 그 탭이 죽으면 1시간 뒤 풀림'); }
  { const upd = { cur: '1.89.240', staged: '1.89.241', rel: true, reloading: null }; const R = mkRt({ pc: 'JS-MAIN', host: 'jerrycson.github.io', upd }); await R.tick(); const a = JSON.parse(R.attrs['data-rn-shiphold'] || '{}'); ok(a.upd && a.upd.staged === '1.89.241' && a.upd.rel === true, '② 웹앱 화면에 이 PC 수집기 업데이트 상태(upd)를 알림');
    R.attrs['data-rn-sgupdnow'] = JSON.stringify({ at: R.clock.now, by: 'JS-MAIN' }); await R.tick(); ok(R.GM['rn-sg-updnow'] && R.GM['rn-sg-updnow'].at === R.clock.now && R.logs.some((x) => /업데이트 먼저\(웹앱에서 고름\)/.test(x)), "② 웹앱 '업데이트 먼저' → 이 PC 수집기 탭들에 신호(rn-sg-updnow) · 기록 한 줄");
    R.logs.length = 0; await R.tick(); ok(!R.logs.length, '② 같은 신호는 한 번만'); R.attrs['data-rn-sgupdnow'] = JSON.stringify({ at: R.clock.now - 5 * MIN }); await R.tick(); ok(!R.logs.length, '② 오래된 신호(2분 넘음)는 무시'); }
  { const src = cutIn(s, 'window.__rnSgUpd = () =>', '    const sgUrgent'); const mk = (GM, outd, VER) => { const W = { __rnOutdated: outd }; new Function('window', 'GM_getValue', 'verNum', 'VER', src)(W, (k, d) => (k in GM ? GM[k] : d), vNum, VER); return W.__rnSgUpd(); };
    const code = (rel) => `;(function(){ const RN_SHIP_REL = '${rel}'; window.__rnShipRel = RN_SHIP_REL; })();`;
    let u = mk({ 'rn-live': { ver: '1.89.241', code: code('1.89.241') } }, null, '1.89.240'); ok(u.staged === '1.89.241' && u.rel === true, '② 받아 둔 판 글의 RN_SHIP_REL이 지금 판보다 새것 → 출고 관련');
    u = mk({ 'rn-live': { ver: '1.89.241', code: code('1.89.240') } }, null, '1.89.240'); ok(u.staged === '1.89.241' && u.rel === false, '② RN_SHIP_REL이 그대로면 출고와 상관없는 판');
    u = mk({ 'rn-sg-upd': { st: 'reloading', at: Date.now() - 30e3, v: '1.89.241', from: '1.89.240' } }, '1.89.241', '1.89.240'); ok(u.reloading && u.reloading.v === '1.89.241', '② 새 탭으로 바꾸는 중(5분 안)');
    u = mk({ 'rn-sg-upd': { st: 'reloading', at: Date.now() - 6 * MIN } }, null, '1.89.240'); ok(!u.reloading, '② 5분 넘은 바꾸는 중 표시는 무시(멈춘 표시로 출고를 막지 않음)');
    u = mk({ 'rn-sg-upd': { st: 'done', at: Date.now() } }, null, '1.89.241'); ok(!u.reloading && !u.staged, '② 바꾸기 끝 → 기다릴 것 없음'); }
  ok(/const RN_SHIP_REL = '[\d.]+'; window\.__rnShipRel = RN_SHIP_REL;/.test(s), '② 수집기 출고 관련 표시 칸(RN_SHIP_REL)');

  // ── ③ 수집기 원본 글 ──
  const has = (re, m) => ok(re.test(s), m);
  has(/for \(let tryN = 1; ; tryN\+\+\) \{\n(?:(?![^\n]*(?:GM_openInTab|window\.open\())[^\n]*\n){0,2}      if \(window\.__rnSgOn && window\.__rnSgOn\(\)\) \{ window\.__rnReloading = 0;[^\n]*__rnShipDefer\('reload'[^\n]*return; \}/, '③ 안전한 새로고침: 새 탭을 열기 전(알라딘 확인·기다림)에 출고가 시작되면 멈추고 미룸 — 이 탭은 옛 판 그대로'); /* (11/13 rv2) 11/13 tabfix가 반복 맨 앞에 '사람이 쓰는 중이면 손 놓을 때까지 기다림' 줄을 넣어 출고 확인이 둘째 줄로 내려감 — 새 탭을 여는 줄이 아닌 줄 2개까지는 앞에 있어도 됨(출고 확인은 여전히 새 탭을 열기 전) */
  has(/window\.__rnReloading = Date\.now\(\);[^\n]*GM_setValue\('rn-sg-upd', \{ st: 'reloading'/, "③ 바꾸기 시작에 '바꾸는 중' 표시(웹앱이 봄)");
  has(/__rnClaimHeir\(\); try \{ const ux = GM_getValue\('rn-sg-upd', null\); if \(ux && ux\.st === 'reloading'\) GM_setValue\('rn-sg-upd', \{ \.\.\.ux, st: 'done'/, "③ 새 탭이 이어받는 순간 '바꾸기 끝'");
  has(/const urg = sgUrgent\(\);/, "③ 새 판 지킴이가 '업데이트 먼저' 신호를 봄"); has(/if \(!urg && Date\.now\(\) - idleSince </, '③ 업데이트 먼저면 쉬는 사이 45초를 기다리지 않음'); has(/Date\.now\(\) - seenAt > \(urg \? 0 :/, '③ 긴 작업 중이면 지금 항목까지 저장하고 바로 바꿈');
  has(/const t = verTimer = setInterval\(\(\) => \{ if \(window\.__rnShipWait && window\.__rnShipWait\('verReload'/, '③ 그래도 출고 보호가 먼저(출고 중엔 업데이트 먼저 신호여도 안 바꿈)');
  ok(!/RN_SHIP_REL|rn-sg-upd/.test(s.split('// ==/UserScript==')[0]), '③ 수집기 머리(==UserScript==)는 그대로');

  // ── ④ 인쇄 도우미 ──
  { const updBootPlan = new Function(cutIn(P, 'function updBootPlan(p, ver)', '/* ⟦updBootPlan 끝⟧ */') + '; return updBootPlan;')();
    ok(updBootPlan(null, '1.2.2').act === 'none', '④ 표가 없으면 아무것도 안 함'); ok(updBootPlan({ to: '1.2.2', boots: 0, bak: 'b' }, '1.2.2').act === 'count', '④ 새 판이 켜짐 → 횟수 세고 60초 지켜봄'); ok(updBootPlan({ to: '1.2.2', boots: 3, bak: 'b' }, '1.2.2').act === 'rollback', '④ 3번 넘게 켜지다 죽음 → 옛 판으로'); ok(updBootPlan({ to: '1.2.2', boots: 0 }, '1.2.1').act === 'clear', '④ 판이 다르면(사람이 직접 바꿈 등) 표만 정리'); }
  { const ver = (P.match(/const VERSION = '([\d.]+)'/) || [])[1]; const run = (pend, ms) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rnps-')); fs.copyFileSync(PR, path.join(d, 'readnow-print.js')); fs.writeFileSync(path.join(d, 'readnow-print.0.0.1.bak.js'), "'use strict'; const VERSION = '0.0.1'; console.log('old');\n"); fs.writeFileSync(path.join(d, 'upd-pending.json'), JSON.stringify(pend));
      cp.spawnSync(process.execPath, [path.join(d, 'readnow-print.js')], { env: { ...process.env, RN_PRINT_NOUPDATE: '1', RN_UPD_OKMS: '400' }, timeout: ms, cwd: d }); const rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch (e) { return null; } }; return { d, last: rd('upd-last.json'), pend: rd('upd-pending.json'), skip: rd('upd-skip.json'), main: fs.readFileSync(path.join(d, 'readnow-print.js'), 'utf8') }; };
    const r1 = run({ from: '0.0.1', to: ver, bak: 'readnow-print.0.0.1.bak.js', boots: 3 }, 8000); ok(/const VERSION = '0\.0\.1'/.test(r1.main) && r1.skip && r1.skip.v === ver && r1.last && r1.last.ok === false && !r1.pend && fs.existsSync(path.join(r1.d, 'readnow-print.0.0.1.bak.js')), '④ 실제 도우미: 4번째 켜짐 → 보관한 옛 판으로 되돌리고 그 판은 다시 안 받음(보관 파일은 그대로)');
    const r2 = run({ from: '0.0.1', to: ver, bak: 'readnow-print.0.0.1.bak.js', boots: 0 }, 3000); ok(r2.last && r2.last.ok === true && !r2.pend && new RegExp(`const VERSION = '${ver.replace(/\./g, '\\.')}'`).test(r2.main), '④ 실제 도우미: 새 판이 버팀 → 바꾸기 끝 기록(upd-last ok) · 새 판 그대로'); }
  const hp = (re, m) => ok(re.test(P), m);
  hp(/fs\.copyFileSync\(__filename, path\.join\(HOME, bak\)\); fs\.writeFileSync\(UPD_PEND,[^\n]*fs\.renameSync\(tmp, path\.join\(HOME, 'readnow-print\.js'\)\)/, '④ 스스로 새 판: 옛 판 보관 → 표 → 한 번에 이름 바꾸기');
  hp(/if \(\(p === 'run' \|\| p === 'resume'\) && UPD_NOW && UPD_NOW\.st !== 'boot'\) return J\(503, \{ ok: false, upd: UPD_NOW/, '④ 바꾸는 몇 초 사이 새 ALPS 일(run·resume)은 받지 않음(웹앱이 저절로 다시)');
  hp(/if \(!ALPS \|\| ALPS\.VERSION !== v\) \{ if \(fs\.existsSync\(bk\)\) \{ try \{ fs\.copyFileSync\(bk, ALPS_F\); \} catch \(e\) \{\} loadAlps\(\); \}/, '④ ALPS 모듈 새 판을 못 읽으면 옛 판으로');
  hp(/if \(!WORK \|\| WORK\.VERSION !== v\) \{ if \(fs\.existsSync\(bkW\)\)/, '④ 작업 창 모듈도 같음');
  hp(/if \(p === 'shippre'\) return body\(/, '④ 출고 단추를 누른 순간 도우미에 알림(/alps/shippre) → 그동안 스스로 새 판 받기를 미룸'); hp(/const shipHold = \(\) => \{ if \(PRE_UNTIL > Date\.now\(\)\) return true;/, '④ 도우미 출고 보호가 그 알림을 봄');
  hp(/upd: UPD_NOW, pre: PRE_UNTIL > Date\.now\(\) \? PRE_UNTIL : 0,/, '④ /alps/status가 바꾸는 중(upd)을 알림');

  // ── ⑤ 웹앱(Playwright) ──
  const HP = path.join(__dirname, 'harness.js');
  if (!fs.existsSync(HP) || !process.env.RN_PORT) { console.log('… ⑤ 웹앱 시험은 빌드 폴더 pw에서 RN_PORT로(건너뜀)'); }
  else { const harness = require(HP); await harness(async (p) => {
    await p.waitForFunction(() => typeof sgPreShip === 'function', null, { timeout: 15000 }).catch(() => {});
    const base = await p.evaluate(() => ({ maxH: SG_MAXH(), html: /id="os_gmh"/.test(shipOneShotHtml()), feat: typeof FEAT !== 'undefined' }));
    ok(base.maxH === 1 && base.html, '⑤ 출고 보호 최대 시간 기본 1시간 · ⚙ 원스톱 설정에 입력 칸: ' + JSON.stringify(base));
    // 두 번 누름
    const r1 = await p.evaluate(async () => { S.sg.pre = { at: Date.now(), why: 'x' }; const a = await sgPreShip({}); const t = document.body.innerText.includes('한 번만 눌러도'); S.sg.pre = null; return { a, t }; });
    ok(r1.a === null && r1.t, '⑤ 두 번 누름 — 두 번째는 아무것도 안 하고 알림만');
    // 수집기가 바꾸는 중 → 기다림 → 끝나면 출고
    await p.evaluate(() => { window.__u = { cur: '1.89.240', staged: null, reloading: { v: '1.89.241', at: Date.now() } }; window.__kp = setInterval(() => document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now(), upd: window.__u })), 500); document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now(), upd: window.__u })); window.__g = null; sgPreShip({}).then((g) => { window.__g = g || 'null'; }); });
    await p.waitForTimeout(3500); const r2 = await p.evaluate(() => ({ g: window.__g, msg: S.sg.preMsg, flow: sgFlows().map((f) => f.id), on: sgHere().on, line: sgLineHtml() }));
    ok(!r2.g && /업데이트 정리 중 — 곧 출고 시작/.test(r2.msg) && /업데이트 정리 중/.test(r2.line), '⑤ 수집기가 새 탭으로 바꾸는 중 → 출고를 아직 시작하지 않고 \'⏳ 업데이트 정리 중 — 곧 출고 시작\'');
    ok(r2.flow.some((x) => /^pre_/.test(x)) && r2.on, '⑤ 누른 순간 출고 표에 \'출고 시작 준비\' 칸 → 이 PC·MJ-MAIN이 새 업데이트를 시작하지 않음');
    await p.evaluate(() => { window.__u = { cur: '1.89.241', staged: null, reloading: null }; }); await p.waitForTimeout(3500);
    const r3 = await p.evaluate(() => ({ g: window.__g, msg: S.sg.preMsg, fs: JSON.parse(JSON.stringify(((window.__FS || {}).shp_runs || {})._guard || null)) }));
    ok(r3.g && r3.g !== 'null' && Array.isArray(r3.g.pend) && r3.g.waited > 0 && !r3.msg, '⑤ 바꾸기 끝(새 판 완전히) → 출고 시작으로 넘어감 ' + JSON.stringify(r3.g));
    const preK = r3.fs && Object.keys(r3.fs.holds || {}).find((k) => /^pre_/.test(k)); ok(preK && r3.fs.holds[preK].t0 > 0, '⑤ 출고 표(shp_runs/_guard)에 출고 시작 준비 칸이 적힘');
    await p.evaluate(() => sgPreEnd()); await p.waitForTimeout(300);
    // 출고 관련 새 판 묻기
    const askRun = (ans, o, upd) => p.evaluate(async ([ans, o, upd]) => { window.__u = upd; document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now(), upd })); let asked = null; window.prompt = (m) => { asked = m; return ans; }; const g = await sgPreShip(o); return { g: g ? { pend: g.pend.map((x) => x.k) } : null, asked, pre: !!S.sg.pre, now: document.documentElement.getAttribute('data-rn-sgupdnow') }; }, [ans, o, upd]);
    const rel = { cur: '1.89.240', staged: '1.89.241', rel: true, reloading: null };
    let r = await askRun('1', {}, rel); ok(r.asked && /출고와 관련된 업데이트/.test(r.asked) && /수집기 새 판 1\.89\.241/.test(r.asked) && r.g && r.g.pend.includes('col'), '⑤ 출고 관련 새 판 → 묻기 · [먼저 출고] → 바로 출고(새 판은 출고 끝나고)'); await p.evaluate(() => sgPreEnd());
    r = await askRun(null, {}, rel); ok(r.g === null && !r.pre && r.asked, '⑤ [출고하지 않음] → 아무것도 시작 안 함 · 출고 표 칸도 내림');
    r = await askRun('1', { auto: true }, rel); ok(!r.asked && r.g, '⑤ ⏰ 저절로 시작(정한 시각·마감)은 묻지 않고 먼저 출고'); await p.evaluate(() => sgPreEnd());
    r = await askRun('1', {}, { cur: '1.89.240', staged: '1.89.241', rel: false, reloading: null }); ok(!r.asked && r.g && r.g.pend.includes('col'), '⑤ 출고와 상관없는 새 판 → 묻지 않고 미룸'); await p.evaluate(() => sgPreEnd());
    // 업데이트 먼저
    await p.evaluate(() => { window.__ship = []; window.__osOrig = window.shipOneShot; window.shipOneShot = async (o) => { window.__ship.push(o); return 'id'; }; });
    r = await askRun('2', {}, rel); ok(r.g === null && !r.pre && r.now && JSON.parse(r.now).at > 0, "⑤ [업데이트 먼저 하고 출고] → 출고 칸을 내리고 이 PC 수집기에 '바로 바꿈' 신호");
    await p.waitForTimeout(3500); let r4 = await p.evaluate(() => ({ ship: window.__ship.length, msg: S.sg.preMsg, ls: localStorage.getItem('rn-ship-after-upd') }));
    ok(r4.ship === 0 && /출고 전 업데이트 중 — 수집기 1\.89\.241/.test(r4.msg) && r4.ls, '⑤ 업데이트가 끝나기 전엔 출고를 시작하지 않음(진행 한 줄)');
    await p.evaluate(() => { window.__u = { cur: '1.89.241', staged: null, rel: false, reloading: null }; }); await p.waitForTimeout(4500); r4 = await p.evaluate(() => ({ ship: JSON.parse(JSON.stringify(window.__ship)), msg: S.sg.preMsg, ls: localStorage.getItem('rn-ship-after-upd') }));
    ok(r4.ship.length === 1 && r4.ship[0].noAsk && !r4.msg && !r4.ls, '⑤ 새 판이 된 것을 확인 → 출고가 저절로 시작(다시 묻지 않음) ' + JSON.stringify(r4.ship));
    // 웹앱 새 판으로 다시 연 뒤 이어서 출고
    r4 = await p.evaluate(async () => { localStorage.setItem('rn-ship-after-upd', JSON.stringify({ at: Date.now(), want: { web: '9' } })); window.__ship = []; S.sg.afterDone = 0; sgAfterUpd(); await new Promise((r) => setTimeout(r, 2000)); return { ship: window.__ship.length, ls: localStorage.getItem('rn-ship-after-upd') }; });
    ok(r4.ship === 1 && !r4.ls, "⑤ '업데이트 먼저'로 웹앱을 다시 열면 로그인 뒤 출고가 저절로 시작(한 번만)");
    r4 = await p.evaluate(async () => { localStorage.setItem('rn-ship-after-upd', JSON.stringify({ at: Date.now() - 11 * 60e3 })); window.__ship = []; S.sg.afterDone = 0; sgAfterUpd(); await new Promise((r) => setTimeout(r, 2000)); return window.__ship.length; });
    ok(r4 === 0, '⑤ 10분 넘은 이어서-출고 표시는 버림(엉뚱한 때 출고하지 않음)');
    await p.evaluate(() => { window.shipOneShot = window.__osOrig; clearInterval(window.__kp); document.documentElement.removeAttribute('data-rn-shiphold'); });
    // 도우미가 바꾸는 중이라 ALPS 일을 거절 → 저절로 다시
    let n = 0; await p.route(/127\.0\.0\.1:8898\/alps\/run/, (rt) => { n++; rt.fulfill({ status: n <= 2 ? 503 : 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(n <= 2 ? { ok: false, upd: { st: 'swap', to: '1.2.2' }, err: '바꾸는 중' } : { ok: true, run: { id: 'r1', status: 'run' } }) }); });
    const r5 = await p.evaluate(async () => { const t = Date.now(); const j = await alpsFetch('/alps/run', { fileName: 'x' }); return { j, ms: Date.now() - t }; });
    ok(r5.j && r5.j.ok && n === 3 && r5.ms >= 5000, `⑤ 도우미가 새 판으로 바꾸는 중(503 upd) → 3초마다 저절로 다시 · 바뀐 뒤 ALPS 일 시작(${n}번 · ${r5.ms}ms)`);
    // 출고 끝 기록
    const r6 = await p.evaluate(async () => { S.sg.def = []; document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: true, why: 'JS-MAIN ▶ 오늘 출고 끝까지', n: 2, at: Date.now() })); await sgTick(); await sgTick(); document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now() })); await sgTick(); return { line: sgLineHtml(), e: S.sg.lastEnd }; });
    ok(/✓ 출고 끝/.test(r6.line) && /미룬 2가지 이어 감/.test(r6.line) && /따로 확인하지 않아도 됨/.test(r6.line), '⑤ 출고가 끝나면 출고 화면에 \'✓ 출고 끝 — 출고 보호 풀림 · 미룬 n가지 이어 감\'');
    const r7 = await p.evaluate(async () => { S.sg.lastEnd = null; document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: true, why: 'JS-MAIN 🚚 출고 시작 준비(업데이트 정리)', n: 0, at: Date.now() })); await sgTick(); document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now() })); await sgTick(); return S.sg.lastEnd; });
    ok(!r7, "⑤ 누르고 취소했거나 '출고 시작 준비'만 있던 때는 '출고 끝'으로 적지 않음");
  }, { noFriend: true }); }

  console.log(bad ? `❌ tSHIPSAFE 실패 ${bad}개` : '✓ tSHIPSAFE 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tSHIPSAFE 오류: ' + (e && e.stack || e)); process.exit(1); });
