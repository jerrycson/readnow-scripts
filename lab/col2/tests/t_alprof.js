/* t_alprof — 🧭 알라딘 로그인 길 나(11/17 bunoe1 · 리드 결정) — 평소 크롬 프로필을 잠깐 빌려 읽기
 *  ⓪ 기본 꺼짐(alPath 없음 = 예비 🖐 손발 길 · 되돌림 = 설정 한 줄) ① HOME부터 · 로거·MJ-MAIN 금지 · 출고 중·핑퐁 멈춤
 *  ② 한 번에 한 브라우저 — 평소 크롬이 잠금을 쥐면 기다림(예비 길) ③ 크롬 136 기본 사용자 폴더는 띄우지 않고 까닭을 알림
 *  ④ 로그인 풀림이면 로그인하지 않고 예비 길 ⑤ 본문 검사 — 길 나 한 바퀴는 쿠키·설정 파일을 안 건드리고 · 남은 크롬 끝내기 없음 · 끝나면 반드시 닫음
 * 실행: node tests/t_alprof.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const AP = require('../helper/col2-alprof.js');

(async () => {
  console.log('⓪ 기본 꺼짐 · 되돌림 한 줄');
  { const p = AP.plan({ pc: 'HOME', dir: 'D:/RN/chrome' }); ok(!p.on && !p.go && p.fb, 'alPath가 없으면 길 나를 안 씀(예비 손발 길)', p);
    ok(!AP.plan({ path: 'tm', pc: 'HOME', dir: 'D:/RN/chrome' }).go, "alPath:'tm' = 예비 길(되돌림)");
    const lk = AP.look({ pc: 'HOME' }); ok(lk.path === 'tm' && lk.dir === '', '설정이 없으면 look도 tm', lk); }

  console.log('① PC 가림');
  const base = { path: 'prof', dir: 'D:/RN/chrome', exists: true };
  ok(AP.plan({ ...base, pc: 'HOME' }).go, 'HOME은 띄움');
  for (const pc of ['LOGGER', 'LOGGER2', 'MJ-MAIN']) { const p = AP.plan({ ...base, pc }); ok(p.on && !p.go && !p.fb, `${pc}은 길 나도 예비도 이 판단으로는 안 함`, p); }
  { const p = AP.plan({ ...base, pc: 'JS-MAIN' }); ok(!p.go && p.fb, '목록 밖 PC(JS-MAIN)는 예비 길 그대로', p); ok(AP.plan({ ...base, pc: 'js-main', pcs: ['HOME', 'JS-MAIN'] }).go, 'alProf.pcs로 넓힘(대소문자 무관)'); }
  ok(!AP.plan({ ...base, pc: '' }).go, 'PC 이름 모르면 안 띄움');
  { const h = AP.plan({ ...base, pc: 'HOME', hold: true }); ok(!h.go && !h.fb && /출고/.test(h.why), '출고 중엔 안 띄움·예비 길도 쉼', h);
    const q = AP.plan({ ...base, pc: 'HOME', pp: '핑퐁' }); ok(!q.go && !q.fb, '핑퐁 의심이면 멈춤'); }
  { const n = AP.plan({ path: 'prof', pc: 'HOME' }); ok(!n.go && n.fb, '폴더를 안 정하면 안 띄움'); ok(!AP.plan({ ...base, pc: 'HOME', exists: false }).go, '폴더가 없으면 안 띄움'); }

  console.log('② 한 번에 한 브라우저 — 잠금 파일');
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'alprof-'));
    try { ok(!AP.profLocked(D).locked, '잠금 없음 = 비어 있음');
      fs.symlinkSync(`${os.hostname()}-${process.pid}`, path.join(D, 'SingletonLock')); const a = AP.profLocked(D); ok(a.locked && a.by === 'SingletonLock', '살아 있는 크롬 pid의 SingletonLock = 쥠', a);
      fs.unlinkSync(path.join(D, 'SingletonLock')); fs.symlinkSync(`${os.hostname()}-999999`, path.join(D, 'SingletonLock')); ok(!AP.profLocked(D, { kill: () => { throw new Error('ESRCH'); } }).locked, '죽은 pid의 잠금은 안 쥠');
      fs.unlinkSync(path.join(D, 'SingletonLock'));
      fs.writeFileSync(path.join(D, 'lockfile'), ''); ok(!AP.profLocked(D).locked, '열리는 lockfile = 안 쥠');
      const fake = { ...fs, readlinkSync: () => { throw new Error('x'); }, openSync: () => { const e = new Error('busy'); e.code = 'EBUSY'; throw e; } };
      ok(AP.profLocked(D, { fs: fake }).locked, 'Windows에서 크롬이 연 lockfile(EBUSY) = 쥠');
      const lk = AP.look({ pc: 'HOME', alPath: 'prof', alProf: { dir: D } }, { fs: fake, env: {} }); ok(lk.locked && lk.exists && !lk.isDefault, 'look이 잠금·폴더를 봄', lk);
      const p = AP.plan({ ...lk }); ok(!p.go && p.wait && p.fb, '평소 크롬이 켜 있으면 기다리고 예비 길', p);
      ok(AP.plan({ ...AP.look({ pc: 'HOME', alPath: 'prof', alProf: { dir: D } }, { env: {} }) }).go, '평소 크롬이 꺼져 있으면 띄움');
    } finally { fs.rmSync(D, { recursive: true, force: true }); } }

  console.log('③ 크롬 136 기본 사용자 폴더');
  { const env = { LOCALAPPDATA: '/u/AppData/Local', HOME: '/u' };
    ok(AP.isDefaultDir('/u/AppData/Local/Google/Chrome/User Data', env) && AP.isDefaultDir('/u/AppData/Local/google/chrome/user data/', env), 'Windows 기본 폴더(대소문자·끝 빗금 무관)');
    ok(AP.isDefaultDir('/u/.config/google-chrome', env) && !AP.isDefaultDir('/u/RN/chrome-main', env), '리눅스 기본 폴더 · 다른 폴더는 아님');
    const p = AP.plan({ ...base, pc: 'HOME', isDefault: true }); ok(!p.go && p.fb && /136/.test(p.why), '기본 폴더면 안 띄우고 까닭(크롬 136)을 알림', p); }

  console.log('④ 로그인 풀림');
  { const p = AP.plan({ ...base, pc: 'HOME', loginNeed: true }); ok(!p.go && p.fb && /로그인하지 않음/.test(p.why), '로그인 풀림이면 번외는 로그인하지 않고 예비 길', p); }

  console.log('⑤ 본문 검사');
  { const src = fs.readFileSync(path.join(__dirname, '..', 'helper', 'col2-al.js'), 'utf8'); const blk = (src.match(/async function profStep[\s\S]*?\n  async function step\(\)/) || [''])[0];
    ok(!!blk, 'profStep이 있음');
    ok(!/prefsNoPw|prefsFix|stale|login\(|autoRe|verify\(|cred/i.test(blk), '길 나 한 바퀴는 설정 파일 고침·남은 크롬 끝내기·로그인·계정이 없음');
    ok(/finally \{ await close\(/.test(blk), '한 바퀴 끝엔 늘 닫아 프로필을 돌려줌');
    ok(/cfg\(\)\.alPath === 'prof' \? profPlan\(\) : null/.test(src), "길 나는 alPath:'prof'일 때만(기본 꺼짐)");
    const ap = fs.readFileSync(path.join(__dirname, '..', 'helper', 'col2-alprof.js'), 'utf8');
    ok(!/Cookies|Login Data|Local State|Preferences|readFileSync/.test(ap.replace(/\/\*[\s\S]*?\*\//g, '')), '길 나 판단은 쿠키·계정·설정 파일을 읽지 않음(잠금 파일만)'); }
  console.log('⑥ (0.1.78 bunoe3) 안전 스위치 — 「쉬는 시각에만」·「잠깐 빌림 알림」 기본 꺼짐');
  { const lk0 = AP.look({ pc: 'HOME', alPath: 'prof', alProf: { dir: '/없는/폴더' } }, { env: {} }); ok(lk0.idleOnly === false && lk0.borrowNote === false, '두 스위치 모두 기본 꺼짐(설정 없으면 false)', lk0);
    ok(AP.plan({ ...base, pc: 'HOME', idleMs: 0 }).go, '쉬는 시각 스위치가 꺼져 있으면 사람 입력과 상관없이 예전 그대로');
    const lk1 = AP.look({ pc: 'HOME', alPath: 'prof', alProf: { dir: '/x', idleOnly: true, idleMin: 7, borrowNote: true } }, { env: {} }); ok(lk1.idleOnly && lk1.idleMin === 7 && lk1.borrowNote, 'alProf.idleOnly·idleMin·borrowNote로 켬', lk1);
    const on = { ...base, pc: 'HOME', idleOnly: true };
    const a = AP.plan({ ...on, idleMs: 4 * 60e3 + 59e3 }); ok(!a.go && a.wait && a.fb && a.idle && /4분 전/.test(a.why) && /5분/.test(a.why), '켜 두면 사람 입력 5분 안이면 빌리지 않고 예비 길', a);
    ok(AP.plan({ ...on, idleMs: 5 * 60e3 }).go, '5분 넘게 입력이 없으면 빌림');
    const u = AP.plan({ ...on, idleMs: null }); ok(!u.go && u.fb && /못 재/.test(u.why), '못 재면(창 다루기 실패·Windows 아님) 빌리지 않음', u);
    ok(!AP.plan({ ...on, idleMs: -1 }).go, 'GetLastInputInfo 실패(-1)도 빌리지 않음');
    ok(!AP.plan({ ...on, idleMin: 10, idleMs: 9 * 60e3 }).go && AP.plan({ ...on, idleMin: 10, idleMs: 10 * 60e3 }).go, 'idleMin으로 바꿈(10분)');
    ok(!AP.plan({ ...on, idleMs: 99 * 60e3, hold: true }).go && !AP.plan({ ...on, idleMs: 99 * 60e3, locked: true }).go, '쉬는 시각이어도 출고 중·평소 크롬이 쥔 때는 안 빌림(앞 조건이 먼저)');
    ok(AP.borrowMsg(42) === '🧭 평소 크롬 잠깐 빌림 — 42초 뒤 돌려줌', '알림 글', AP.borrowMsg(42));
    const src = fs.readFileSync(path.join(__dirname, '..', 'helper', 'col2-al.js'), 'utf8'); const blk = (src.match(/async function profStep[\s\S]*?\n  async function step\(\)/) || [''])[0];
    ok(/if \(idleWant\(\)\) \{ await idleRead\(true\); const p2 = profPlan\(\);[^\n]*if \(!p2\.go\)/.test(blk) && blk.indexOf('idleRead(true)') < blk.indexOf('new Browser('), '켜 두면 띄우기 바로 전에 사람 입력을 다시 재고 아니면 띄우지 않음');
    ok(/cfg\(\)\.alProf && cfg\(\)\.alProf\.borrowNote === true\) \{[^\n]*AP\.borrowMsg[^\n]*WIN\.run\('toast'/.test(blk) && blk.indexOf('borrowMsg') < blk.indexOf('await b.launch()'), '알림은 켜 둔 때만 · 크롬을 띄우기 전에');
    ok(/const idleWant = \(\) => cfg\(\)\.alPath === 'prof' && !!\(cfg\(\)\.alProf && cfg\(\)\.alProf\.idleOnly === true\)/.test(src), '사람 입력은 길 나 + 스위치를 켠 때만 잼(그 밖엔 PowerShell을 더 부르지 않음)');
    const W = require('../helper/col2-win.js'); const ps = W.PS_SRC({ showW: 1, showH: 1 });
    ok(/GetLastInputInfo/.test(ps) && ps.indexOf("$Act -eq 'idle'") > 0 && ps.indexOf("$Act -eq 'idle'") < ps.indexOf('Get-CimInstance') && ps.indexOf("$Act -eq 'toast'") < ps.indexOf('Get-CimInstance'), "창 다루기 'idle'·'toast'는 크롬 프로세스·창을 찾기 전에 끝남(크롬을 안 건드림)"); }
  L.done('t_alprof');
})();
