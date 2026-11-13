// tCOL2MIG1113 — (11/13 col2mig · 정범님 09:5x '크롬 수집기가 랜덤하게 새 탭을 열어 작업하던 화면의 포커스를 빼앗음 → JS·MJ 번외 수집기를 완성해 이전')
//   ① 수집기 c2MigDecide(글자 그대로 떼어 봄): auto = 번외가 5분 넘게 잇달아 답하면 이전 · on = 바로 · off = 안 함 · 로거 늘 뺌 · 출고 중엔 바꾸지 않음 · 한 번 이전하면 번외가 죽어도 그대로 · 작업 창 설정을 사람이 끈 PC는 auto가 켜지 않음
//   ② 수집기 본문: wwMine이 이전을 작업 창 모드로 넘김(시범 PC 목록 밖 MJ-MAIN도) · rnC2al이 번외 답함(rn-c2feedAt)을 적음 · 출고 알림은 작업 창 탭이면 도우미 /work/open
//   ③ 작업 창 도우미 0.1.4 /work/open: 웹앱 주소만 사람 크롬에 엶 · 알라딘·다른 주소 거절 · X-RN-Work 머리 없으면 거절
//   ④ 웹앱: ⚙ 🔀 번외로 넘기기 › 🖥 PC별 번외 이전 줄 · 기본(JS-MAIN·MJ-MAIN 자동) · 두 번 누름 · [켬] PC 저절로 번외 깔기(출고 보호 중 안 함)
//   ⑤ 머리 서명 8ab2f661d1d8afa8 그대로(split.js)
// 실행: node src/tests/tCOL2MIG1113.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const SRC = fs.readFileSync(find(['src/readnow-collector.src.js', 'readnow-collector.src.js']), 'utf8'); const APP = fs.readFileSync(find(['src/app.html', 'app.html']), 'utf8');
const WORKF = find(['local/readnow-work.js']); const SPLIT = find(['src/split.js', 'split.js']);

console.log('① c2MigDecide — 언제 이전하나');
const a = SRC.indexOf('function c2MigDecide(o)'); const b = SRC.indexOf('/* ⟦c2MigDecide 끝⟧ */', a); ok(a > 0 && b > a, '수집기에 c2MigDecide가 있음');
const D = new Function(SRC.slice(a, b) + '; return c2MigDecide;')(); const T0 = 1794500000000; const M = 60e3;
let r = D({ mode: undefined, def: 'auto', prev: null, feedAt: 0, now: T0 }); ok(!r.on && r.mode === 'auto' && /아직 답하지/.test(r.why), 'JS-MAIN 기본 자동 · 번외가 답하지 않으면 그대로', r);
r = D({ def: 'auto', prev: null, feedAt: T0 - 10e3, now: T0 }); ok(!r.on && r.live && r.liveSince === T0, '번외가 막 답함 — 5분 기다림', r);
let p = { on: false, live: true, liveSince: T0 }; r = D({ def: 'auto', prev: p, feedAt: T0 + 4 * M, now: T0 + 4 * M }); ok(!r.on, '4분 — 아직', r);
r = D({ def: 'auto', prev: p, feedAt: T0 + 5 * M, now: T0 + 5 * M + 1 }); ok(r.on && /저절로 이전/.test(r.why), '5분 넘게 잇달아 답함 → 이전', r);
r = D({ def: 'auto', prev: { on: false, live: false, liveSince: 0 }, feedAt: T0 + 6 * M, now: T0 + 6 * M }); ok(!r.on && r.liveSince === T0 + 6 * M, '중간에 끊겼다 다시 답하면 처음부터 셈', r);
r = D({ def: 'auto', prev: { on: true, live: true, liveSince: T0 }, feedAt: T0, now: T0 + 3 * 3600e3 }); ok(r.on && !r.live, '한 번 이전하면 번외가 3시간 죽어도 그대로(창 안 수집기가 일함)', r);
r = D({ mode: 'off', def: 'auto', prev: { on: true }, feedAt: T0, now: T0 + 1 }); ok(!r.on && /이전 끔/.test(r.why), '끔 → 되돌림', r);
r = D({ mode: 'on', def: 'off', prev: null, feedAt: 0, now: T0 }); ok(r.on && /바로/.test(r.why), '켬 → 번외 없어도 바로', r);
r = D({ mode: 'on', def: 'off', prev: { on: false }, feedAt: 0, now: T0, ship: true }); ok(!r.on && /출고 중/.test(r.why), '🚚 출고 중엔 이전 시작 안 함(약속 0-1)', r);
r = D({ mode: 'off', def: 'auto', prev: { on: true }, feedAt: T0, now: T0, ship: true }); ok(r.on && /출고 중/.test(r.why), '🚚 출고 중엔 되돌림도 안 함(끝난 뒤)', r);
r = D({ mode: 'on', def: 'auto', prev: null, feedAt: T0, now: T0, logger: true }); ok(!r.on && /로거/.test(r.why), '로거는 늘 뺌(약속 0)', r);
r = D({ def: 'auto', prev: { on: false, live: true, liveSince: T0 }, feedAt: T0 + 9 * M, now: T0 + 9 * M, wwOff: true }); ok(!r.on && /작업 창 설정/.test(r.why), '작업 창 설정에서 사람이 끈 PC는 auto가 안 켬', r);
r = D({ mode: 'weird', def: undefined, prev: null, feedAt: T0, now: T0 }); ok(r.mode === 'off' && !r.on, '모르는 값·기본 없는 PC(HOME 등) = 끔', r);

console.log('② 수집기 본문');
ok(/const C2MIG_DEF = \{\};/.test(SRC), '기본: 모든 PC 끔(11/13 긴급)');
ok(/okPc = [^;]*\(mig\.on \|\| pilot\.some/.test(SRC), '이전 PC는 시범 목록(HOME·JS-MAIN) 밖이어도(MJ-MAIN) 작업 창 모드');
ok(/on: okPc && \(m\.on === true \|\| mig\.on\) && !own/.test(SRC), '작업 창 켬 = 웹앱 작업 창 설정 또는 이전 · 🏠 이어받기 중엔 아님');
ok(/await c2MigLoad\(\); const M = wwMine\(\)/.test(SRC), '1분마다 app_settings/col2_handoff(5분 기억)');
ok(/miss = 0; try \{ GM_setValue\('rn-c2feedAt', Date\.now\(\)\); \}/.test(SRC), '번외 다리 답함을 rn-c2feedAt에 적음');
ok(/W0\.call\('\/work\/open', \{ url: SURL/.test(SRC) && /if \(!ok\) GM_openInTab\(SURL/.test(SRC), '출고 알림: 작업 창 탭이면 도우미가 사람 크롬에 엶 · 안 되면 예전처럼');
ok(/mig: M\.mig \? \{ mode: M\.mig\.mode, on: M\.mig\.on/.test(SRC), '작업 창 상태(crm_system/work_win.state)에 이전 상태');

console.log('③ 작업 창 도우미 /work/open');
const W = require(WORKF); ok(W.VERSION === '0.1.4', '작업 창 모듈 0.1.4', W.VERSION);
const opened = []; const dep = W._RV_DEPS; const was = dep.open; dep.open = (u) => { opened.push(u); return true; };
const call = (p0, body, hdr) => new Promise((res) => { const req = { method: 'POST', headers: { 'x-rn-work': '1', ...(hdr || {}) }, url: p0 }; const out = { writeHead(c) { this.c = c; }, end(t) { res({ c: this.c, j: JSON.parse(t) }); } };
  W.api(req, out, new URL(p0, 'http://127.0.0.1:8898'), { readBody: (q, n, cb) => cb(null, Buffer.from(JSON.stringify(body || {}))), log: () => {} }); });
(async () => {
  let x = await call('/work/open', { url: 'https://jerrycson.github.io/readnow-scripts/app/?go=deliv', why: '출고 알림' }); ok(x.c === 200 && x.j.ok && opened[0] === 'https://jerrycson.github.io/readnow-scripts/app/?go=deliv', '웹앱 주소 → 사람 크롬에 엶', x);
  x = await call('/work/open', { url: 'https://readnow.kr/app/?go=deliv' }); ok(x.c === 200 && opened.length === 2, 'readnow.kr/app 도 됨', x);
  x = await call('/work/open', { url: 'https://www.aladin.co.kr/scm/worders.aspx' }); ok(x.c === 400 && opened.length === 2, '알라딘 주소 거절', x);
  x = await call('/work/open', { url: 'https://evil.example/app/' }); ok(x.c === 400, '다른 주소 거절', x);
  x = await call('/work/open', { url: 'https://readnow.kr/app/"><script>' }); ok(x.c === 400, '이상한 글자 거절', x);
  x = await call('/work/open', { url: 'https://readnow.kr/app/' }, { 'x-rn-work': '0' }); ok(x.c === 403, 'X-RN-Work 머리 없으면 거절', x);
  x = await call('/work/open', { url: 'https://readnow.kr/app/' }, { origin: 'https://www.aladin.co.kr' }); ok(x.c === 403, '알라딘 화면(다른 출처)은 못 부름', x);
  dep.open = was; W.stop && W.stop();

  console.log('④ 웹앱');
  ok(/const C2MIG_DEF = \{\};/.test(APP), '웹앱 기본도 끔');
  ok(/const bunH = c2MigHtml\(H, adm\) \+ c2HoBunHtml\(H, C, adm\)/.test(APP), '⚙ 🔀 번외로 넘기기 맨 위에 🖥 PC별 번외 이전');
  ok(/twiceArm\(b, `\$\{pc\} 번외 이전/.test(APP) && /if \(!isAdminDevice\(\)\) return toast\('관리자 기기에서만 바꿀 수 있습니다', 1\);\s*const \[pc, mode\]/.test(APP), '두 번 누름 · 관리자 기기만');
  ok(/tx\.set\(ref, \{ pcs: \{ \[pc\]: \{ mode, at, by \} \}, log \}, \{ merge: true \}\)/.test(APP), 'col2_handoff.pcs.<PC> 한 칸만 + 기록 40줄');
  ok(/c2MigMode\(H, deviceName\(\)\) !== 'on'\) return;\s*if \(sgHere\(\)\.on\) return;/.test(APP), '[켬] PC만 저절로 번외 깔기 · 🚚 출고 보호 중 안 함');
  ok(/LOGGER\/i\.test\(deviceName\(\)\)\) return; c2HoWatch\(\)/.test(APP), '로거·휴대폰은 깔지 않음');
  ok(!/\b(alert|confirm|prompt)\(/.test(APP.slice(APP.indexOf('const C2MIG_DEF'), APP.indexOf("/* (11/12 handoff2 · 리드 '묶음째 넘기기') 📦 묶음 보기"))), '브라우저 팝업 없음');
  { const m = APP.match(/function c2MigHtml[\s\S]*?\n(?=async function c2MigSet)/); let h = ''; try { const esc = (t) => String(t == null ? '' : t); const S = { ww: { state: { 'JS-MAIN': { atMs: Date.now(), on: true, open: true, lead: 'work', mig: { why: '번외 정상 — 저절로 이전' } } } }, c2ctl: { 'JS-MAIN': { st: { ver: '0.1.48', running: true } }, 'MJ-MAIN': { y24hb: { hlp: false } }, LOGGER: { st: { ver: '0.1.48' } } } };
      h = new Function('S', 'esc', 'wwLoad', 'c2CtlLoad', 'mgrAgo', 'C2MIG_DEF', 'C2MIG_NM', 'c2MigMode', m[0] + '; return c2MigHtml;')(S, esc, () => {}, () => {}, () => '1분 전', { 'JS-MAIN': 'auto', 'MJ-MAIN': 'auto' }, { auto: '🤖 자동', on: '🔀 켬', off: '↩ 끔' }, (H, pc) => (((H.pcs || {})[pc] || {}).mode || ({ 'JS-MAIN': 'auto', 'MJ-MAIN': 'auto' })[pc] || 'off'))({ pcs: {} }, true); } catch (e) { h = 'ERR ' + e.message; }
    ok(/JS-MAIN/.test(h) && /보이지 않는 작업 창에서 일함/.test(h) && /MJ-MAIN/.test(h) && /번외 안 깔림/.test(h) && !/LOGGER/.test(h), 'PC 줄 그림: JS-MAIN 작업 창에서 일함 · MJ-MAIN 번외 안 깔림 · 로거 없음', h.slice(0, 500)); }

  console.log('⑤ 머리 그대로');
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'c2mig-')); fs.writeFileSync(path.join(T, 'c.user.js'), SRC); for (const f of ['readnow-adapt-core.js']) { const q = find([f]); if (q) fs.copyFileSync(q, path.join(T, f)); }
  const sp = cp.spawnSync('node', [SPLIT, path.join(T, 'c.user.js'), path.join(T, 'out')], { encoding: 'utf8' }); ok(sp.status === 0 && /이으면 원본과 같음/.test(sp.stdout), 'split.js 나눔 · 관문 통과', (sp.stderr || sp.stdout).slice(0, 400));
  let hs = ''; try { hs = fs.readFileSync(path.join(T, 'out/pc-live-head.txt'), 'utf8').split('\n')[0].trim(); } catch (e) {} ok(hs === '8ab2f661d1d8afa8', '머리 서명 8ab2f661d1d8afa8 그대로', hs);
  try { fs.rmSync(T, { recursive: true, force: true }); } catch (e) {}
  console.log(bad ? `❌ tCOL2MIG1113 — ${bad}개 실패` : '✓ tCOL2MIG1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
