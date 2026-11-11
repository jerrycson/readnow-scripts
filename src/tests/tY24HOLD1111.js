// tY24HOLD1111 — (11/11 y24ops2 · 진단 11/11 14:10 '예스24 판매관리 로그인이 모든 PC에서 풀림 — HOME·JS-MAIN 번외가 같은 판매자 세션을 서로 끊는 핑퐁') 🔒 예스24 세션을 쥘 PC 하나
//   ① 번외 순수 셈: 맡은 PC 고르기(수집기가 넘긴 값 → 마지막 받은 값 → col2.json → 기본 HOME) · 이름 비교(대소문자·빈칸) · 「이미 로그인된 예스24」 길 알아봄
//   ② 수집기 본문: 웹앱 app_settings/platforms.y24Holder를 rn-y24cfg.holder로 옮기고 번외 feed cfg.holder로 넘김(머리는 그대로 — 본문만)
//   ③ 웹앱 ◆y24hold 덩어리: 쥔 PC 상태 · 30분 넘게 소식 없으면 경보(저절로 넘기지 않음) · 옛 판 번외가 맡지 않은 PC에서 켜져 있으면 경보 · 「이미 로그인된」 멈춤 · 로그인 필요
//   ④ 웹앱 글 검사: ⚙ 설정 › 🟦 예스24(set_y24) · [🔒 이 PC가 예스24 맡기] 두 번 누름(y24Arm) · 홈 알림 y24hold → 그 설정 칸 · 🪟 수집 작업 창 줄 · 브라우저 창(alert/confirm/prompt) 없음
//   ⑤ 실제 흐름(번외 도우미 + 가짜 예스24 판매관리): 맡지 않은 PC는 예스24 크롬을 안 띄우고 로그인 단추도 거절 → 수집기가 holder를 넘기면 맡음(파일에 기억) → 「이미 로그인된 예스24」 화면이면
//      스스로 다시 로그인하지 않고 멈추고 까닭 · 로그인 화면을 되풀이해 열지 않음 · 사람이 [🔐 예스24 로그인]을 누르면 풀림 · 다시 다른 PC가 맡으면 크롬을 닫고 멈춤 — RN_SKIP_COL2=1이면 건너뜀
// 실행: node src/tests/tY24HOLD1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), process.env.RN_REPO].filter(Boolean).find((x) => fs.existsSync(path.join(x, 'lab', 'col2', 'helper', 'col2-y24.js')));
const APP = process.env.RN_APP || path.join(ROOT, 'src', 'app.html');
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const YF = path.join(ROOT, 'lab', 'col2', 'helper', 'col2-y24.js'); const Y = require(YF); const YS = fs.readFileSync(YF, 'utf8');

console.log('① 번외 순수 셈');
ok(Y.HOLD_DEF === 'HOME' && Y.holderOf(null, null, null, Y.HOLD_DEF) === 'HOME', '맡은 PC 기본 = HOME(정범님이 예스24 번외를 HOME에서 쓰심)');
ok(Y.holderOf(' js-main ', 'HOME', 'X', 'HOME') === 'JS-MAIN' && Y.holderOf(null, 'mj-main', 'X', 'HOME') === 'MJ-MAIN' && Y.holderOf('', '', 'office1', 'HOME') === 'OFFICE1', '고르는 차례: 수집기가 넘긴 값 → 마지막 받은 값(파일) → col2.json → 기본');
ok(Y.isHolder('home', 'HOME') && !Y.isHolder('JS-MAIN', 'HOME') && Y.isHolder('아무 PC', ''), '이름 비교는 대소문자·빈칸 무시 · 맡은 PC를 정하지 않은 때(시험)만 누구나');
ok(Y.ALREADY_RE.test('/api/Login/AlreadyLoginedYes24Init') && Y.ALREADY_RE.test('/Login/AlreadyLoginedYes24') && !Y.ALREADY_RE.test('/api/Order/NewOrderConfirmList'), '「이미 로그인된 예스24」 길 알아봄(진단: POST /api/Login/AlreadyLoginedYes24Init 36번)');
{ const fn = (n) => { const i = YS.indexOf(n); return i < 0 ? '' : YS.slice(i, YS.indexOf('\n', i)); };
  ok(/&& mine\(\)/.test(fn('const enabled = ')), '번외 예스24 켜짐 = 맡은 PC일 때만(읽기·쓰기·맡긴 일·자동 올림 모두 enabled를 봄)');
  ok(/if \(!mine\(\)\) return \{ ok: false, err: notMineMsg\(\) \}/.test(fn('async function login(')) && /if \(!mine\(\)\) return \{ ok: false, wait: true/.test(fn('async function verify(')) && /if \(!mine\(\)\) return notMineMsg\(\); if \(Y\.already\)/.test(fn('async function autoRe(')), '맡지 않은 PC는 로그인 단추·⚙ 확인 로그인·스스로 다시 로그인 모두 거절 · 「이미 로그인된」 멈춤 중엔 스스로 다시 로그인 안 함');
  ok(/Y\.already = null/.test(fn('async function login(')) && /Y\.already = null/.test(fn('function setLogin(')), '사람이 로그인을 누르거나 세션이 살아나면 멈춤이 풀림');
  ok(/holder: holdNm\(b\.cfg\.holder\)/.test(YS) && /wr\(HOLD_F, Y\.holdF\)/.test(YS), '수집기가 넘긴 holder를 받고 파일(y24-holder.json)에 기억 — 도우미가 다시 켜져도 그대로');
  ok(!/Logout/i.test(YS.slice(YS.indexOf('async function step('), YS.indexOf('async function loop('))), '맡지 않게 되면 크롬만 닫음(로그아웃 요청을 보내지 않음 — 맡은 PC 세션을 건드리지 않게)'); }
{ const RL = fs.readFileSync(path.join(ROOT, 'lab', 'col2', 'helper', 'col2-relogin.js'), 'utf8'); const vf = YS.slice(YS.indexOf('async function verify('), YS.indexOf('/* ── 한 바퀴 ── */'));
  ok(/if \(live\) return \{ ok: false, live: true/.test(vf) && !/openTab\(/.test(vf), "(정범님 HOME 15:00 '저장됨·확인됨인데 로그인 화면에 멈춤') ⚙ [확인하고 저장]이 세션이 살아 있을 때 임시 창에서 또 로그인하지 않음 — 예스24는 한 계정 세션 하나라 그 로그인이 본 창 세션을 끊었음");
  ok(/const JS_SHAPE = /.test(RL) && /ctx\.shape\) \{ const sh = await ctx\.ev\(JS_SHAPE/.test(RL) && (YS.match(/name: '예스24 판매관리', shape: true/g) || []).length === 2 && !/\be\.value/.test(RL.slice(RL.indexOf('const JS_SHAPE'), RL.indexOf('const JS_ENTER'))), '다시 로그인·확인이 실패하면 까닭에 로그인 화면 모양(입력 칸·숨은 칸·단추 글·틀·보안 문자 칸 · 값은 안 읽음) — 예스24만');
  ok(/reWhy: Y\.login === 'need' && Y\.reWhy/.test(YS) && /Y\.drops = \[\]; Y\.reWhy = null; \/\* 사람이 누름/.test(YS), '저장된 계정이 있어도 스스로 다시 로그인하지 않는 까닭을 상태(옆 창·웹앱 작업 창)에 그대로 · 사람이 로그인을 누르면 핑퐁 의심 멈춤도 풂');
  ok(/스스로 다시 로그인을 안 하는 까닭/.test(T) && /reWhy: y\.reWhy && y\.reWhy\.why/.test(T), '웹앱 🪟 수집 작업 창 예스24 줄에도 그 까닭'); }
{ const cfg = fs.readFileSync(path.join(ROOT, 'lab', 'col2', 'col2-config.js'), 'utf8'); ok(/COL2_VER: '0\.1\.(2[3-9]|[3-9]\d)'/.test(cfg), '번외 판 번호를 올림(0.1.23 이상)', (cfg.match(/COL2_VER: '[^']+'/) || [])[0]); }

console.log('② 수집기 본문(머리 그대로)');
{ const C = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
  ok(/holder: dv\.y24Holder \? String\(dv\.y24Holder\)\.slice\(0, 40\) : null/.test(C), '웹앱 app_settings/platforms.y24Holder → 이 PC 저장소 rn-y24cfg.holder(10분마다)');
  ok(/'\/y24\/feed', \{ by: pc, cfg: cfg \? \{ ordMin: cfg\.ordMin, off: !!cfg\.off, holder: cfg\.holder \|\| null \}/.test(C), '번외 feed에 cfg.holder를 넘김');
  const head = C.slice(0, C.indexOf('==/UserScript==')); ok(!/y24Holder|holder/.test(head), '수집기 머리(@match·@grant·@connect·@require)는 건드리지 않음'); }

console.log('③ 웹앱 ◆y24hold 덩어리');
const F = new Function('num', cut('/* ◆y24hold 시작', '/* ◆y24hold 끝 */') + '\nreturn { Y24H_DEF, Y24H_STALE, y24HolderOf, y24HoldState, y24HoldAlertOf };')((n) => String(n));
{ const now = Date.parse('2026-11-11T05:40:00Z'); const ago = (m) => new Date(now - m * 60e3).toISOString();
  ok(F.Y24H_DEF === 'HOME' && F.Y24H_STALE === 30 * 60e3 && F.y24HolderOf({}) === 'HOME' && F.y24HolderOf({ y24Holder: 'js-main' }) === 'JS-MAIN', '맡은 PC = app_settings/platforms.y24Holder · 없으면 HOME · 기준 30분');
  const live = F.y24HoldState('HOME', [{ id: 'HOME', at: ago(3), run: true, y: { on: true, login: 'ok', active: true, mine: true } }, { id: 'JS-MAIN', at: ago(1), run: true, y: { on: false, mine: false, holder: 'HOME' } }, { id: 'LOGGER', at: ago(1), y: { on: false, logger: true } }], now);
  ok(!live.stale && live.active && live.login === 'ok' && live.others.length === 0 && F.y24HoldAlertOf(live, now) === null, '쥔 PC가 3분 전 소식 · 로그인 살아 있음 · 다른 PC는 맡지 않음 → 경보 없음', live);
  const st = F.y24HoldState('HOME', [{ id: 'HOME', at: ago(45), run: true, y: { on: true, login: 'ok' } }, { id: 'JS-MAIN', at: ago(1), y: { on: false, mine: false } }], now); const a = F.y24HoldAlertOf(st, now);
  ok(st.stale && a && a.lv === 'red' && /HOME/.test(a.t) && /45분째/.test(a.t) && /저절로 다른 PC로 넘기지 않음/.test(a.t), "쥔 PC가 45분째 소식 없음 → 빨강 경보 '저절로 넘기지 않음'(핑퐁 막기)", a);
  const none = F.y24HoldState('HOME', [{ id: 'JS-MAIN', at: ago(1), y: { on: false, mine: false } }], now); ok(none.stale && /소식이 없음/.test(F.y24HoldAlertOf(none, now).t), '쥔 PC 기록이 아예 없으면 소식 없음 경보');
  ok(F.y24HoldAlertOf(F.y24HoldState('HOME', [], now), now) === null, '번외를 아무 PC도 안 쓰면 경보 없음');
  const pp = F.y24HoldState('HOME', [{ id: 'HOME', at: ago(2), y: { on: true, login: 'ok' } }, { id: 'JS-MAIN', at: ago(1), y: { on: true, login: 'need' } }], now); const b = F.y24HoldAlertOf(pp, now);
  ok(pp.others.join() === 'JS-MAIN' && b && b.lv === 'red' && /JS-MAIN/.test(b.t) && /서로 끊을 수/.test(b.t), '맡지 않은 PC에서 옛 판 번외 예스24가 켜져 있으면(규칙을 모름) 핑퐁 위험 경보', b);
  const al = F.y24HoldAlertOf(F.y24HoldState('HOME', [{ id: 'HOME', at: ago(2), y: { on: true, login: 'need', already: { n: 3, at: now } } }], now), now);
  ok(al && al.k === 'y24holdal' && /이미 로그인된 예스24/.test(al.t) && /3번/.test(al.t), "「이미 로그인된 예스24」 화면에서 멈춤 → 'HOME 옆 창에서 [🔐 예스24 로그인] 한 번'", al);
  const lg = F.y24HoldAlertOf(F.y24HoldState('home', [{ id: 'HOME', at: ago(2), y: { on: true, login: 'need' } }], now), now); ok(lg && lg.k === 'y24holdlg' && /로그인 필요/.test(lg.t), '쥔 PC 로그인 필요 → 그 PC에서 한 번(다른 PC가 대신 안 함)', lg); }

console.log('④ 웹앱 글 검사');
{ ok(/sec\('set_y24', '🟦 예스24/.test(T) && /function y24HoldSetHtml\(\)/.test(T), '⚙ 설정 › 🟦 예스24 칸(set_y24)');
  const h = cut('document.addEventListener(\'click\', async (e) => { const b = e.target.closest && e.target.closest(\'[data-y24hold]\')', 'function renderSettings');
  ok(/y24Arm\(b, /.test(h) && /y24Holder: me/.test(h) && /arrayUnion\(\{ at, by: S\.user\.email, dev: me, from \}\)/.test(h) && /LOGGER/.test(h), '[🔒 이 PC가 예스24 맡기] = 두 번 누름 · app_settings/platforms.y24Holder · 바꾼 기록 남김 · 로거 PC는 못 맡음');
  const blk = cut('/* ◆y24hold 시작', 'function renderSettings'); ok(!/\b(alert|confirm|prompt)\(/.test(blk), '브라우저 창(alert/confirm/prompt) 없음');
  ok(/try \{ y24HoldAlerts\(add\); \} catch/.test(T) && /if \(key === 'y24hold'\) return go\('settings'/.test(T), "홈 '오늘 확인할 것' 경보 → 누르면 ⚙ 설정 › 🟦 예스24");
  ok(/\$\{!lg \? y24HoldRowHtml\(pc\) : ''\}/.test(T) && /y\.mine === false \?/.test(T.slice(T.indexOf('function c2yHtml'), T.indexOf('function c2yHtml') + 2000)), "🧭 관리도구 › 🪟 수집 작업 창 PC 줄: '예스24는 ○○이 맡음' · 쥔 PC 소식 끊김 경보");
  ok(/holder: y\.holder \?/.test(T) && /mine: y\.mine !== false/.test(T) && /already: y\.already &&/.test(T), 'PC 상태 요약(col2_ctl)에 맡은 PC·맡음 여부·멈춤 숫자만(손님 정보 없음)');
  ok(/w: '⚙ 설정 › 🟦 예스24'/.test(T), '기능 찾기 목록에 있음'); }

(async () => {
  if (process.env.RN_SKIP_COL2 === '1') { console.log('⑤ 건너뜀(RN_SKIP_COL2=1)'); return fin(); }
  console.log('⑤ 실제 흐름(번외 도우미 + 가짜 예스24)');
  const L = require(path.join(ROOT, 'lab', 'col2', 'tests', 'lib.js')); const wait = L.wait;
  const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
  /* 가짜 예스24 판매관리 — 세션이 없으면 로그인 화면(/Login/Login)으로 · 그 화면은 열리자마자 POST /api/Login/AlreadyLoginedYes24Init('이미 로그인된 예스24' 화면) */
  const S = { log: [], sess: new Set() };
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); q.resume(); q.on('end', () => { S.log.push({ m: q.method, p: u.pathname, auth, t: Date.now() });
      const H = (c, t, b, x) => { s.writeHead(c, { 'Content-Type': t + '; charset=utf-8', ...(x || {}) }); s.end(b); };
      if (u.pathname === '/Login/Login') return H(200, 'text/html', '<!doctype html><meta charset="utf-8"><title>로그인</title><p>이미 로그인된 예스24 계정이 있습니다</p><input type="text"><input type="password"><script>fetch("/api/Login/AlreadyLoginedYes24Init",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"})</script>');
      if (u.pathname.startsWith('/api/')) return auth ? H(200, 'application/json', '{"RESULT_LIST":[]}') : H(401, 'application/json', '{}');
      if (!auth) return H(302, 'text/html', '', { Location: '/Login/Login' }); return H(200, 'text/html', '<!doctype html><title>판매관리</title><p>첫 화면</p>'); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const env = { RN_COL2_Y24: base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: ROOT, RN_COL2_Y24_HOLDER_DEF: 'HOME' };
  let H = null; try { const fp = await new Promise((r) => { const t = require('net').createServer(); t.listen(0, '127.0.0.1', () => { const pt = t.address().port; t.close(() => r(pt)); }); }); H = await L.startHelper({ port: fp, cfg: { on: true, y24: true, pc: 'JS-MAIN', pcSrc: 'pc', auto: false, headless: true }, env }); } catch (e) { ok(false, '번외 도우미를 못 띄움', String(e)); return fin(); }
  const D = H.D, HOME = D + '/home'; const y = async () => ((await H.api('GET', '/status')).j || {}).y24 || {};
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 1 }, hold: { on: false }, ...(b || {}) });
  const chromeUp = () => fs.existsSync(path.join(HOME, 'col2-y24-chrome', 'DevToolsActivePort')) && H.T.clog().some((l) => /col2-y24-chrome/.test(l));
  try {
    await feed(); await wait(2500); let s = await y();
    ok(s.mine === false && s.holder === 'HOME' && !s.on && /예스24는 HOME이\(가\) 맡음/.test(s.msg || '') && !chromeUp() && !S.log.length, "맡지 않은 PC(JS-MAIN): 예스24 크롬을 띄우지 않고 판매관리에 한 번도 안 감 · '예스24는 HOME이 맡음'", { mine: s.mine, holder: s.holder, msg: s.msg, hits: S.log.length });
    const r = await H.api('POST', '/y24/login', {}); ok(r.j && !r.j.ok && /HOME이\(가\) 맡음/.test(r.j.err || ''), '맡지 않은 PC에선 [🔐 예스24 로그인]도 거절(서로 끊지 않게)', r.j && r.j.err);
    await feed({ cfg: { ordMin: 1, holder: 'js-main' } }); s = await until(async () => { const v = await y(); return v.mine && v.login === 'need' ? v : null; }, 120);
    const saved = (() => { try { return JSON.parse(fs.readFileSync(path.join(HOME, 'y24-holder.json'), 'utf8')); } catch (e) { return null; } })();
    ok(s && s.holder === 'JS-MAIN' && saved && saved.h === 'JS-MAIN', '수집기가 holder=JS-MAIN을 넘기면 이 PC가 맡음 · 파일에 기억', { s: s && { holder: s.holder, login: s.login }, saved });
    s = await until(async () => { const v = await y(); return v.already ? v : null; }, 80);
    ok(s && s.already && s.already.n >= 1 && s.login === 'need', "「이미 로그인된 예스24」 화면(AlreadyLoginedYes24Init)을 알아봄 → '로그인 필요'로 멈춤", s && { already: s.already, login: s.login });
    const n0 = S.log.filter((x) => x.p === '/Login/Login').length; for (let k = 0; k < 8; k++) { await feed({ cfg: { ordMin: 1, holder: 'JS-MAIN' } }); await wait(500); } s = await y(); const n1 = S.log.filter((x) => x.p === '/Login/Login').length;
    ok(n1 === n0 && /이미 로그인된 예스24/.test(s.msg || '') && /되풀이 로그인하지 않고 멈춤/.test(s.msg || ''), '그 뒤 4초 넘게 로그인 화면을 다시 열지 않음(되풀이 로그인 없음) · 까닭이 상태에 남음', { n0, n1, msg: s.msg });
    const jr = fs.existsSync(path.join(HOME, 'journal')) ? fs.readdirSync(path.join(HOME, 'journal')).map((f) => fs.readFileSync(path.join(HOME, 'journal', f), 'utf8')).join('\n') : ''; const outAll = H.out() + jr;
    ok(/이미 로그인된 예스24」 화면이 뜸/.test(outAll), '기록에 까닭(다른 곳 로그인으로 세션이 끊김 · 맡은 PC에서 로그인 한 번)', outAll.slice(-400));
    await H.api('POST', '/y24/login', {}); s = await until(async () => { const v = await y(); return !v.already ? v : null; }, 40); ok(s && !s.already, '사람이 [🔐 예스24 로그인]을 누르면 멈춤이 풀림(그 창에서 로그인)', s && s.already);
    await feed({ cfg: { ordMin: 1, holder: 'HOME' } }); s = await until(async () => { const v = await y(); return v.mine === false && !v.alive && /맡음/.test(v.msg || '') ? v : null; }, 120);
    ok(s && s.mine === false && /HOME이\(가\) 맡음/.test(s.msg || ''), '다시 HOME이 맡으면 이 PC 번외는 예스24 크롬을 닫고 멈춤(로그아웃은 안 보냄)', s && { mine: s.mine, alive: s.alive, msg: s.msg });
    ok(!S.log.some((x) => /logout/i.test(x.p)), '가짜 예스24에 로그아웃 요청이 한 번도 안 감');
  } finally { try { await H.stop(); } catch (e) {} for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} srv.close(); }
  fin();
})();
function fin() { console.log(bad ? `✗ tY24HOLD1111 실패 ${bad}` : '✓ tY24HOLD1111 모두 통과'); process.exit(bad ? 1 : 0); }
