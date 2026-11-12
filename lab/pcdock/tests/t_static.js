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

console.log('③ 운영과 안 겹침 · 안전');
const code = man.filter((f) => /\.(js|html|ps1|cs)$/.test(f)).map((f) => [f, rd(f)]).concat([['install-pcdock.ps1', rd('install-pcdock.ps1')]]);
const noC = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*#.*$/gm, '');
ok(code.every(([, s]) => !/(127\.0\.0\.1|localhost):(8898|8899|8797)\b/.test(noC(s))), '운영 인쇄·로거 도우미(8898·8899)·번외(8797) 주소를 부르지 않음');
ok(require('../pcdock-config.js').AVOID_PORTS.join() === '8898,8899,8797' && require('../pcdock-config.js').PORT === 8796, '포트 8796(겹치면 빈 포트)');
ok(code.every(([, s]) => !/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(noC(s))), '브라우저 팝업(alert·confirm·prompt) 없음');
ok(code.every(([, s]) => !/01[016789]-?\d{3,4}-?\d{4}/.test(s)), '휴대전화 번호 없음');
ok(code.every(([, s]) => !/rn-cred|ProtectedData|aladin.*(pw|password)/i.test(s)), '계정·비밀값을 다루지 않음(DPAPI도 필요 없음 — 설정에 비밀값이 없어서)');
ok(!/localStorage|sessionStorage/.test(rd('ui.html')), '화면은 기기 저장을 쓰지 않음(설정은 도우미 파일 하나)');
ok(/x-rn-dock/.test(rd('readnow-pcdock.js')) && /listen\(port, '127\.0\.0\.1'/.test(rd('readnow-pcdock.js')), '127.0.0.1에서만 듣고 · 이 창의 부탁만 받음');
ok(/col2-\w+-chrome|col2/.test(rd('clean.js')) && /D:\\\\ReadNow/.test(rd('clean.js')), '정리 보호 목록에 번외 크롬 프로필·D:\\ReadNow');
ok(/^\uFEFF?@echo off\r\n/.test(rd('install-pcdock.cmd')) && /\r\n/.test(rd('install-pcdock.cmd')) && !/[^\r]\n/.test(rd('install-pcdock.cmd')), 'install-pcdock.cmd — 줄 끝 CRLF');
console.log(bad ? `✗ t_static ${bad}/${n} 실패` : `✓ t_static ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
