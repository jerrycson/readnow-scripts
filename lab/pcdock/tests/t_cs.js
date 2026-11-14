/* t_cs — pcdock-win.cs가 윈도우 PowerShell 5.1 Add-Type(= .NET Framework C# 5 컴파일러)에서 엮이는지 리눅스에서 미리 봄
 *  (0.1.3 · 11/14 JS-MAIN 「모니터를 못 읽었습니다」의 까닭: 0.1.1에서 더한 ExplorerTab이 Front(long)에 IntPtr를 넘겨 C# 글 전체가 안 엮였고
 *   → 모든 윈도우 일(모니터·실행·배치·정리)이 '준비 실패'였음. 그때 시험은 괄호 짝만 봐서 못 잡았음)
 *  mono의 mcs로 -langversion:5 엮기 · mcs가 없으면 실패로 침(설치: apt-get install -y mono-mcs) — 건너뛰려면 PCDOCK_NO_CS=1(그럴 땐 크게 알림)
 * 실행: node lab/pcdock/tests/t_cs.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + String(x).slice(0, 1200) : '')); } };
const CS = path.join(__dirname, '..', 'pcdock-win.cs');
const has = cp.spawnSync('sh', ['-c', 'command -v mcs']).status === 0;
if (!has) { if (process.env.PCDOCK_NO_CS) { console.log('  ⚠ mcs 없음 — C# 엮기 시험을 건너뜀(PCDOCK_NO_CS) · 윈도우에서 안 엮이면 모든 윈도우 일이 멈춤'); process.exit(0); }
  console.log('  ✗ mcs(C# 컴파일러)가 없음 — apt-get install -y mono-mcs 뒤 다시(건너뛰려면 PCDOCK_NO_CS=1)'); process.exit(1); }
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockcs-'));
console.log('① C# 5로 엮기(윈도우 PowerShell 5.1 Add-Type과 같은 급)');
{ const r = cp.spawnSync('mcs', ['-langversion:5', '-target:library', '-nologo', '-out:' + path.join(D, 'p.dll'), CS], { encoding: 'utf8' });
  ok(r.status === 0 && fs.existsSync(path.join(D, 'p.dll')), 'pcdock-win.cs가 오류 없이 엮임', (r.stdout || '') + (r.stderr || '')); }
console.log('② 0.1.2의 그 한 줄을 되돌리면 잡히는지(시험이 실제로 잡는지 확인)');
{ const bad1 = fs.readFileSync(CS, 'utf8').replace('if (!Front(hv))', 'if (!Front(h))'); const f = path.join(D, 'bad.cs'); fs.writeFileSync(f, bad1);
  const r = cp.spawnSync('mcs', ['-langversion:5', '-target:library', '-nologo', '-out:' + path.join(D, 'b.dll'), f], { encoding: 'utf8' });
  ok(bad1.includes('Front(h))') && r.status !== 0 && /CS1503|CS1502/.test(r.stdout + r.stderr), '0.1.2처럼 Front(h)면 엮기 실패로 잡힘', (r.stdout || '') + (r.stderr || '')); }
console.log('③ PowerShell이 부르는 C# 이름이 모두 있음');
{ const cs = fs.readFileSync(CS, 'utf8'), ps = fs.readFileSync(path.join(__dirname, '..', 'pcdock.ps1'), 'utf8');
  const used = [...new Set([...ps.matchAll(/\[RnDock\]::(\w+)/g)].map((m) => m[1]))]; const miss = used.filter((u) => !new RegExp('public static [\\w<>\\[\\]]+ ' + u + '\\(').test(cs));
  ok(used.length >= 8 && !miss.length, `PowerShell이 쓰는 [RnDock]::… ${used.length}가지가 모두 public static`, miss.join(',')); }
try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {}
console.log(bad ? `✗ t_cs ${bad}/${n} 실패` : `✓ t_cs ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
