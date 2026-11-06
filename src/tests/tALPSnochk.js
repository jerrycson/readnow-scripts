// tALPSnochk — 정범님 11/06 오후 '송장 출력에서 송장 입력까지 진정한 원스톱': 일마다 종이 확인(job.paperCheck)을 웹앱이 정함 — 원스톱 기본은 묻지 않고 끝까지
//  · 칸이 없으면 이 PC 설정 그대로 · 이어서 진행·원격 일에도 넘김 · 종이 확인 없이 적은 인쇄 끝은 ok 'nocheck'로 남아 다음 확인 켠 일이 '확인 없이 적힌 인쇄 끝'으로 되돌려 다시 인쇄하지 않음
// 실행: node tALPSnochk.js (도우미 원본을 읽어 봄 · 크롬 없이)
const fs = require('fs'); const path = require('path');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const F = pick(path.join(__dirname, '..', '..', 'local', 'readnow-alps.js'), path.join(__dirname, '..', 'local', 'readnow-alps.js')); const s = fs.readFileSync(F, 'utf8');
const C = pick(path.join(__dirname, '..', '..', 'cloud', 'index.js'), path.join(__dirname, '..', 'cloud', 'index.js')); const cs = fs.readFileSync(C, 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const ver = (s.match(/const VERSION = '([\d.]+)'/) || [])[1]; ok(ver === '0.5.6', '도우미 판 0.5.6 ' + ver);
ok(/async function runJob\(job\) \{[^\n]*const c = \{ \.\.\.cfg\(\), \.\.\.\(job\.paperCheck != null \? \{ paperCheck: !!job\.paperCheck \} : \{\}\) \};/.test(s), '일의 paperCheck가 이 PC 설정을 덮음(칸이 없으면 PC 설정 그대로)');
ok(/ok: c\.paperCheck \? true : \(job\.paperCheck === false \? 'nocheck' : false\)/.test(s), "종이 확인 없이 적은 인쇄 끝 = ok 'nocheck'(참 값)");
{ const m = s.match(/if \(c\.paperCheck\) \{ const uc = Object\.entries\(J\.printed \|\| \{\}\)\.filter\(\(\[k, v\]\) => !v \|\| !v\.ok\)/); ok(!!m, "다음 일(종이 확인 켬)의 되돌림 거름이 '!v.ok'라 'nocheck' 줄은 되돌리지 않음(같은 송장 두 장 막기)");
  const uc = Object.entries({ a: { ok: 'nocheck' }, b: { ok: false }, c: { ok: true } }).filter(([k, v]) => !v || !v.ok).map(([k]) => k); ok(uc.join() === 'b', "거름 흉내: 'nocheck'·true는 그대로 · 옛 false만 되돌림 " + uc.join()); }
ok(/wrJ\(F\.lastJob, \{ fileName: fn, rows: job\.rows \|\| \[\], firstOne: job\.firstOne, \.\.\.\(job\.paperCheck != null/.test(s) && /o && o\.paperCheck != null \? \{ paperCheck: !!o\.paperCheck \}/.test(s), '이어서 진행: 마지막 일에 적고 · 웹앱이 다시 정하면 그것');
ok(/start\(\{ fileName: J\.fileName, b64: J\.b64, rows: J\.rows, firstOne: J\.firstOne, \.\.\.\(J\.paperCheck != null \? \{ paperCheck: !!J\.paperCheck \} : \{\}\), remote: J\.id \}\)/.test(s) && /firstOne: x\.firstOne !== false, \.\.\.\(x\.paperCheck != null \? \{ paperCheck: !!x\.paperCheck \} : \{\}\) \}/.test(cs), '원격 일(휴대폰 → 클라우드 → 도우미)에도 넘김');
ok(/testFirst = !todoNew\.length && c\.paperCheck/.test(s) && /if \(c\.paperCheck && RUN\.askPaper\)/.test(s) && /log\('종이 확인: 이 일은 묻지 않고 끝까지\(웹앱 원스톱 설정\)'\)/.test(s), '첫 상자 시험·상자마다 종이 확인은 c.paperCheck를 따름(끄면 묻지 않음) · 기록 한 줄');
ok(/paperCheck: true,/.test(s), '이 PC 설정 기본(paperCheck true)은 그대로 — 손으로 시작한 일은 예전처럼');
try { require('child_process').execFileSync(process.execPath, ['--check', F]); ok(true, '도우미 문법 검사'); } catch (e) { ok(false, '도우미 문법 검사 ' + e.message); }
console.log(bad ? `❌ tALPSnochk 실패 ${bad}` : '✓ tALPSnochk 통과'); process.exit(bad ? 1 : 0);
