/* t_static — 글자로 하는 검사(실행 없이): 묶음 목록 = 폴더 · PowerShell·C# 괄호 짝(리눅스 상자에 pwsh가 없어 대신) · Node가 부르는 일 = PowerShell에 있는 일 ·
 *  운영 도우미 포트(8898·8899)·번외 포트(8797)를 부르지 않음 · Defender 끄기 없음 · 브라우저 팝업 없음 · 휴대전화 번호 없음 · 비밀값 저장 없음
 * 실행: node lab/pcdock/tests/t_static.js */
'use strict';
const fs = require('fs'), path = require('path');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 300) : '')); } };
const R = path.join(__dirname, '..'); const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
/* PowerShell — 주석·글을 걷어 낸 뒤 괄호 짝 */
function psStrip(s) { let o = '', i = 0; while (i < s.length) { const c = s[i];
  if (s.startsWith('<#', i)) { const j = s.indexOf('#>', i + 2); i = j < 0 ? s.length : j + 2; continue; }
  if (c === '#') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
  if (s.startsWith("@'", i) || s.startsWith('@"', i)) { const q = s[i + 1]; const j = s.indexOf('\n' + q + '@', i + 2); if (j < 0) return null; o += '""'; i = j + 3; continue; }
  if (c === "'") { let j = i + 1; while (j < s.length) { if (s[j] === "'" && s[j + 1] === "'") { j += 2; continue; } if (s[j] === "'") break; j++; } o += "''"; i = j + 1; continue; }
  if (c === '"') { let j = i + 1; let depth = 0; while (j < s.length) { if (s[j] === '`') { j += 2; continue; } if (s[j] === '$' && s[j + 1] === '(') { depth++; j += 2; continue; } if (depth && s[j] === ')') { depth--; j++; continue; } if (s[j] === '"' && !depth) break; j++; } o += '""'; i = j + 1; continue; }
  if (c === '`') { i += 2; continue; }
  o += c; i++; } return o; }
function balanced(s) { const st = []; const P = { ')': '(', ']': '[', '}': '{' }; let line = 1; for (const c of s) { if (c === '\n') line++; if ('([{'.includes(c)) st.push([c, line]); else if (P[c]) { const t = st.pop(); if (!t || t[0] !== P[c]) return { ok: false, line, c }; } } return st.length ? { ok: false, open: st.slice(-3) } : { ok: true }; }
function csStrip(s) { return s.replace(/\/\/.*$/gm, '').replace(/"(?:\\.|[^"\\])*"/g, '""'); }

console.log('① 묶음');
const man = JSON.parse(rd('bundle.json')).files; const disk = fs.readdirSync(R).filter((f) => /\.(js|html|ps1|cs)$/.test(f) && !/^install-/.test(f)).sort();
ok(JSON.stringify([...man].sort()) === JSON.stringify(disk), 'bundle.json 목록 = 폴더의 실제 파일(설치 파일 빼고)', { man, disk });
ok(man.every((f) => /^[\w.-]+\.(js|html|ps1|cs|json)$/.test(f)), '받는 파일 이름 꼴이 설치·새 판 받기의 거름과 맞음');
ok(/PCDOCK_VER:\s*'\d+\.\d+\.\d+'/.test(rd('pcdock-config.js')), '판 번호 꼴');
for (const f of man.filter((x) => /\.js$/.test(x))) { try { new Function(rd(f).replace(/^#!.*\n/, '')); ok(true, f + ' 문법'); } catch (e) { ok(false, f + ' 문법', e.message); } }

console.log('② PowerShell·C# (pwsh가 없어 괄호 짝·꼴만 — 실제 파싱은 윈도우에서)');
for (const f of ['pcdock.ps1', 'install-pcdock.ps1']) { const s = psStrip(rd(f)); ok(s != null && balanced(s).ok, f + ' 괄호·글 따옴표 짝', s == null ? 'here-string' : balanced(s)); }
{ const b = balanced(csStrip(rd('pcdock-win.cs'))); ok(b.ok, 'pcdock-win.cs 괄호 짝', b); const cs = rd('pcdock-win.cs'); ok(!/\$"|\?\.|=>\s*\{[^}]*\bout var\b|\bnameof\(|\bvar\s*\(/.test(cs), 'C# 5(윈도우 PowerShell 5.1 Add-Type)에서 안 되는 꼴($"" · ?. · out var · nameof) 없음'); }
{ const ps = rd('pcdock.ps1'); const acts = [...ps.matchAll(/^\s*'(\w+)'\s*\{/gm)].map((m) => m[1]).concat(/cleanscan/.test(ps) ? ['cleanscan', 'cleanrun'] : []);
  const js = rd('readnow-pcdock.js'); const used = [...new Set([...js.matchAll(/\bps\('(\w+)'/g)].map((m) => m[1]))];
  ok(used.length >= 9 && used.every((a) => acts.includes(a)), 'Node가 부르는 일이 모두 PowerShell에 있음', { used, acts });
  ok(/\$ErrorActionPreference = 'Stop'/.test(ps) && /ConvertTo-Json -Compress/.test(ps) && /Aware\(\)/.test(ps), '결과는 맨 끝 한 줄 JSON · DPI 인식 먼저');
  ok(/pcdock-win-\$hash\.dll/.test(ps) && /Add-Type -LiteralPath \$dll/.test(ps), 'C#은 한 번 엮은 dll을 다시 씀(부를 때마다 새로 엮지 않음 — Defender 검사 줄이기)');
  ok(/Prot \$f\.FullName/.test(ps) && /ReparsePoint/.test(ps), '지우기 전 파일마다 보호 경로 다시 봄 · 연결 폴더(정션)를 따라가지 않음');
  ok(!/Recycle|Clear-RecycleBin|SoftwareDistribution|Set-MpPreference|DisableRealtimeMonitoring|Remove-Item[^\n]*-Recurse[^\n]*\$t\b/i.test(ps), '휴지통·윈도우 업데이트 캐시·Defender 끄기 없음'); }

console.log('②-2 PowerShell 5.1 함정(0.1.0 ③ \'op_Addition\' 오류의 까닭)');
{ const ps = rd('pcdock.ps1').replace(/^\s*#.*$/gm, '').replace(/<#[\s\S]*?#>/g, '');
  const vars = [...ps.matchAll(/\$(?:script:)?([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]); const by = {}; for (const v of vars) (by[v.toLowerCase()] = by[v.toLowerCase()] || new Set()).add(v);
  const clash = Object.values(by).filter((x) => x.size > 1).map((x) => [...x].join('/')); ok(!clash.length, '대소문자만 다른 변수 이름 없음($S와 $s는 같은 변수 — foreach가 목록을 덮음)', clash);
  const loopVars = new Set([...ps.matchAll(/foreach\s*\(\s*\$(\w+)\s+in\b/gi)].map((m) => m[1].toLowerCase())); const plusOn = [...ps.matchAll(/\$(?:script:)?(\w+)\s*\+=/g)].map((m) => m[1].toLowerCase());
  ok(!plusOn.some((v) => loopVars.has(v)), 'foreach 도는 변수에 += 하지 않음(PSObject 더하기)', plusOn.filter((v) => loopVars.has(v)));
  const run = ps.slice(ps.indexOf("'run' {"), ps.indexOf("{ $_ -eq 'cleanscan'")); ok(run.length > 500 && !/\+=/.test(run) && /ArrayList/.test(run) && /\.Add\(/.test(run), "'run'(실행·배치)은 += 없이 ArrayList.Add로 쌓음");
  ok((run.match(/\btry\s*\{/g) || []).length >= 6 && /이 프로그램 일이 멈춤/.test(run), '프로그램마다 try/catch — 하나가 실패해도 나머지는 계속');
  ok(!/\$\w+\s*=\s*\$\w+\s*\+\s*@\{/.test(ps) && !/\+\s*\(?\s*\$In\b/.test(ps), 'ConvertFrom-Json 결과(PSCustomObject)·해시표를 + 로 더하지 않음');
  { const glued = ['pcdock.ps1', 'install-pcdock.ps1'].flatMap((f) => rd(f).split('\n').filter((l) => !/^\s*#/.test(l)).flatMap((l) => l.match(/\$[A-Za-z_][A-Za-z0-9_]*[\uAC00-\uD7A3]/g) || []));
    ok(!glued.length, '글 안에서 변수 바로 뒤에 한글을 붙이지 않음($wait초는 $wait초라는 빈 변수 — $($wait)초로)', glued); }
  ok(!/\?\?|\?\.|\bForEach-Object -Parallel|\bclean\s*\{|\$\w+\s*\?\s/.test(ps), 'PowerShell 7 문법(?? · ?. · -Parallel · 삼항) 없음 — 5.1만');
  ok(/WM_CLOSE|\[RnDock\]::Close/.test(ps) && !/Stop-Process[^\n]*\$ci|Kill\(/.test(run), '모두 닫기는 WM_CLOSE(부탁)만 · 강제 종료 없음');
  ok(/chrome\|claude/.test(run) && /CabinetWClass/.test(run), 'PowerShell에서도 닫기 직전 크롬·Claude·탐색기 셸을 한 번 더 거절(두 겹)');
  ok(/KakaoTalk\.exe'/.test(rd('apps.js')) && /%LOCALAPPDATA%\\\\Kakao\\\\KakaoTalk\\\\KakaoTalk\.exe/.test(rd('apps.js')) && /Uninstall/.test(ps), '카카오톡 찾기 — %LOCALAPPDATA%\\Kakao · Program Files (x86) · 설치 목록 · 시작 메뉴');
  const cs = rd('pcdock-win.cs'); ok(/public static bool Close\(/.test(cs) && /public static string ExplorerTab\(/.test(cs) && /GetForegroundWindow\(\) != h/.test(cs), 'C# — 닫기(WM_CLOSE) · 탐색기 탭(창이 맨 앞일 때만 글자를 침)'); }

console.log('②-3 (0.1.5 · 정범님 11/14 14:48 「탐색기 창이 끝없이 열림 · 제목 모두 홈」) PowerShell 빈 칸·따옴표 함정');
{ const strip = (t) => t.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n').replace(/#[^'"\n]*$/gm, '');
  const old = require('child_process').spawnSync('git', ['show', '2807f9f4:lab/pcdock/pcdock.ps1'], { cwd: __dirname, encoding: 'utf8' }).stdout || '';
  const BAD = /@\(\$st\.s\.tabs\)\.Count|foreach \(\$tb in @\(\$st\.s\.tabs\)\)/;
  ok(BAD.test(old), '(시험이 잡는지) 0.1.3 원문에 @($st.s.tabs).Count — 탭 없는 단계도 @($null).Count = 1로 탭 더하기를 돌았음');
  const ps = strip(rd('pcdock.ps1')); ok(!BAD.test(ps) && /function Arr\(\$v\)/.test(ps) && /\(Arr \$st\.s\.tabs\)\.Count -and -not \$st\.s\.over/.test(ps) && /foreach \(\$tb in \(Arr \$st\.s\.tabs\)\)/.test(ps), '0.1.5: 탭은 실제로 있는 것만(Arr) · 겹치기 창은 탭 더하기를 다시 안 돎');
  const run = ps.slice(ps.indexOf("'run' {"), ps.indexOf("{ $_ -eq 'cleanscan'"));
  ok(!/@\(\$\w+(\.\w+)+\)\.Count/.test(run.replace(/@\(\$In\.close\)\.Count|@\(\$m\.procs\)\.Count|@\(\$Res \| [^)]*\)\.Count|@\(\$closed \| [^)]*\)\.Count/g, '')), "'run' 안에 그 밖의 @($x.y).Count 없음(빈 칸이면 1)");
  ok(/launchMax = \$steps\.Count \+ \$tabTotal \+ 1/.test(run) && /새 창 상한/.test(run) && /hardEnd/.test(run) && /실행 시간 상한/.test(run), '새 창 상한(단계 + 탭 + 1) · 실행 시간 상한 — 넘으면 안 띄우고 까닭');
  ok(/Test-Path -LiteralPath \$fp -PathType Container/.test(run) && /폴더가 없음/.test(run) && /FolderPath \$sp\.folder/.test(run), "폴더: %변수% 펼침 · 없으면 '홈'을 여는 대신 건너뜀");
  ok(/Shell\.Application/.test(ps) && /if \(\$m\.folder\)/.test(run), '폴더 단계는 그 경로를 보는 창만 집음(Shell.Application) — 남의 자리에 아무 탐색기나 안 집음');
  ok(/-replace '\(\\\\\+\)\$', '\$1\$1'/.test(ps), "Q(): \\로 끝나는 경로는 끝 \\를 두 번(\\\"가 따옴표를 먹지 않게)");
  /* Q()를 JS로 옮겨 윈도우 명령 줄 규칙(CommandLineToArgvW)으로 되읽기 — 경로가 그대로 돌아오는지 */
  const Q = (a) => /[\s"]/.test(a) ? '"' + a.replace(/"/g, '\\"').replace(/(\\+)$/, '$1$1') + '"' : a;
  const argv1 = (c) => { let o = '', i = 0, q = false; while (i < c.length) { let b = 0; while (c[i] === '\\') { b++; i++; } if (c[i] === '"') { o += '\\'.repeat(b >> 1); if (b & 1) { o += '"'; i++; } else { q = !q; i++; } } else { o += '\\'.repeat(b); if (i < c.length) o += c[i++]; } } return o; };
  const cases = ['D:\\ReadNow', 'D:\\Read Now\\', 'C:\\Users\\u\\OneDrive\\바탕 화면\\', 'D:\\'];
  ok(cases.every((c) => argv1(Q(c)) === c), 'Q() 결과를 윈도우가 되읽으면 경로 그대로(빈칸·끝 \\ 포함)', cases.map((c) => [Q(c), argv1(Q(c))]));
  const Q0 = (a) => /[\s"]/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a; ok(argv1(Q0('D:\\Read Now\\')) !== 'D:\\Read Now\\', '(시험이 잡는지) 0.1.3 Q()는 「D:\\Read Now\\」를 깨뜨림'); }

console.log('③ 운영과 안 겹침 · 안전');
const code = man.filter((f) => /\.(js|html|ps1|cs)$/.test(f)).map((f) => [f, rd(f)]).concat([['install-pcdock.ps1', rd('install-pcdock.ps1')]]);
const noC = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*#.*$/gm, '');
/* (0.1.1) 번외 수집기·ALPS 도우미 창은 크롬에 주소만 넘김 — 그 주소는 apps.js HELPER_WIN 두 줄에만 · 도우미(Node)·PowerShell·화면은 그 포트를 부르지 않음 */
const noHelperLines = (f, s) => f === 'apps.js' ? s.split('\n').filter((l) => !/^\s*(col2|alps): \{ url: 'http:\/\/127\.0\.0\.1:(8797\/|8898\/alps)'/.test(l)).join('\n') : s;
ok(code.every(([f, s]) => !/(127\.0\.0\.1|localhost):(8898|8899|8797)\b/.test(noC(noHelperLines(f, s)))), '운영 인쇄·로거 도우미(8898·8899)·번외(8797) 주소를 부르지 않음(번외·ALPS 창 주소는 apps.js HELPER_WIN에만 — 크롬에 넘길 뿐)');
ok(!/fetch\(|http\.get|http\.request/.test(rd('apps.js')) && (noC(rd('apps.js')).match(/127\.0\.0\.1:(8797|8898)/g) || []).length === 2, 'apps.js는 그 주소를 부르지 않고 창 주소 두 개만 둠');
ok(require('../pcdock-config.js').AVOID_PORTS.join() === '8898,8899,8797' && require('../pcdock-config.js').PORT === 8796, '포트 8796(겹치면 빈 포트)');
ok(code.every(([, s]) => !/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(noC(s))), '브라우저 팝업(alert·confirm·prompt) 없음');
ok(code.every(([, s]) => !/01[016789]-?\d{3,4}-?\d{4}/.test(s)), '휴대전화 번호 없음');
ok(code.every(([, s]) => !/rn-cred|ProtectedData|aladin.*(pw|password)/i.test(s)), '계정·비밀값을 다루지 않음(DPAPI도 필요 없음 — 설정에 비밀값이 없어서)');
ok(!/localStorage|sessionStorage/.test(rd('ui.html')), '화면은 기기 저장을 쓰지 않음(설정은 도우미 파일 하나)');
ok(/x-rn-dock/.test(rd('readnow-pcdock.js')) && /listen\(port, '127\.0\.0\.1'/.test(rd('readnow-pcdock.js')), '127.0.0.1에서만 듣고 · 이 창의 부탁만 받음');
ok(/col2-\w+-chrome|col2/.test(rd('clean.js')) && /D:\\\\ReadNow/.test(rd('clean.js')), '정리 보호 목록에 번외 크롬 프로필·D:\\ReadNow');
ok(/^\uFEFF?@echo off\r\n/.test(rd('install-pcdock.cmd')) && /\r\n/.test(rd('install-pcdock.cmd')) && !/[^\r]\n/.test(rd('install-pcdock.cmd')), 'install-pcdock.cmd — 줄 끝 CRLF');
console.log(bad ? `✗ t_static ${bad}/${n} 실패` : `✓ t_static ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
