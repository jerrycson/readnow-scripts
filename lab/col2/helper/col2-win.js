/* col2-win.js — 번외 작업 창·상태 창 다루기(PowerShell + user32)
 * 운영 readnow-work.js는 '제목에 리드나우 작업 창이 든 창'을 찾지만, 여기서는 **번외 크롬 프로필 폴더 이름이 명령 줄에 든 크롬 프로세스의 창만** 찾음
 *  → 정범님 크롬·운영 작업 창·로거 크롬은 절대 건드리지 않음(프로필 폴더 이름이 다름)
 * 결과는 맨 끝 한 줄 JSON { ok, act, vs, wa, scr(모든 화면 일하는 칸), n, list:[{ h, r:{x,y,w,h}, vis, ic, zm, tool }] } */
'use strict';
const fs = require('fs'), cp = require('child_process'), crypto = require('crypto');

/* (0.1.4 정범님 11/09 '번외 수집기 왜 진행 안 해') 창 자리 함수 이름을 R → Get-RnRect — PowerShell은 별칭이 함수보다 먼저라 'R'은 Invoke-History(r)로 불려
 *  'ID 21433606에 대한 기록을 찾을 수 없습니다'로 find·hide가 창이 있을 때마다 실패했음(HOME col2_ctl 11/09 17:40) */
const PS_SRC = (D) => PS_RAW(D).replace(/\$\{WIN_HASH\}/g, WIN_HASH);
const PS_RAW = (D) => `param([string]$Act = 'find', [int]$X = 0, [int]$Y = 0, [int]$W = 0, [int]$H = 0, [string]$Place = 'off', [string]$Mark = 'col2-work-chrome', [int]$Top = 0)
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$rnSrc = @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class RnCol2Win {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP f, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static string Title(IntPtr h) { var s = new StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int w, int hh, uint f);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] public static extern IntPtr GetWL(IntPtr h, int i);
  [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")] public static extern IntPtr SetWL(IntPtr h, int i, IntPtr v);
  public struct RECT { public int L; public int T; public int R; public int B; }
  public static List<IntPtr> Find(HashSet<uint> pids) { var L = new List<IntPtr>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (!pids.Contains(p)) return true; var c = new StringBuilder(256); GetClassName(h, c, 256); if (c.ToString() != "Chrome_WidgetWin_1") return true; if (GetWindowTextLength(h) == 0) return true; L.Add(h); return true; }, IntPtr.Zero); return L; }
  public static bool Tool(IntPtr h) { long ex = GetWL(h, -20).ToInt64(); return (ex & 0x80L) != 0; }
  public static void Taskbar(IntPtr h, bool hide) { long ex = GetWL(h, -20).ToInt64(); long nx = hide ? ((ex | 0x80L) & ~0x40000L) : ((ex & ~0x80L) | 0x40000L); if (nx == ex) return; ShowWindow(h, 0); SetWL(h, -20, new IntPtr(nx)); ShowWindow(h, 4); }
}
'@
<# (11/12 hot1 정범님 'JS-MAIN 거의 멈춤 · Defender 26%') 예전엔 부를 때마다 C#을 새로 엮음(csc.exe 켜기 + 임시 폴더에 새 dll → Defender가 새 실행 파일마다 검사) — 1분 지킴이·숨기기 되풀이마다
 *  → 한 번 엮은 dll을 이 폴더에 두고(C# 글이 바뀌면 이름의 해시가 바뀜) 그다음부턴 불러오기만 · 무엇이든 실패하면 예전처럼 메모리에서 엮음(일은 그대로) #>
if (-not ('RnCol2Win' -as [type])) { $rnDll = Join-Path $PSScriptRoot 'col2-win-\${WIN_HASH}.dll'
  if (Test-Path -LiteralPath $rnDll) { try { Add-Type -LiteralPath $rnDll -ErrorAction Stop } catch {} }
  if (-not ('RnCol2Win' -as [type])) { $rnTmp = Join-Path $PSScriptRoot ('col2-win-\${WIN_HASH}.' + $PID + '.dll')
    try { Add-Type -TypeDefinition $rnSrc -OutputAssembly $rnTmp -OutputType Library -ErrorAction Stop; if (-not (Test-Path -LiteralPath $rnDll)) { Move-Item -LiteralPath $rnTmp -Destination $rnDll -ErrorAction Stop } } catch {}
    if (-not ('RnCol2Win' -as [type])) { try { Add-Type -LiteralPath $(if (Test-Path -LiteralPath $rnDll) { $rnDll } else { $rnTmp }) -ErrorAction Stop } catch {} }
    try { if (Test-Path -LiteralPath $rnTmp) { Remove-Item -LiteralPath $rnTmp -Force -ErrorAction SilentlyContinue } } catch {} }
  if (-not ('RnCol2Win' -as [type])) { Add-Type -TypeDefinition $rnSrc } }
function Get-RnRect($h) { $r = New-Object RnCol2Win+RECT; [void][RnCol2Win]::GetWindowRect($h, [ref]$r); @{ x = $r.L; y = $r.T; w = ($r.R - $r.L); h = ($r.B - $r.T) } }
function Info($h) { @{ h = [int64]$h; r = (Get-RnRect $h); vis = [RnCol2Win]::IsWindowVisible($h); ic = [RnCol2Win]::IsIconic($h); zm = [RnCol2Win]::IsZoomed($h); tool = [RnCol2Win]::Tool($h) } }
$vs = [System.Windows.Forms.SystemInformation]::VirtualScreen; $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$out = @{ ok = $true; act = $Act; vs = @{ x = $vs.X; y = $vs.Y; w = $vs.Width; h = $vs.Height }; wa = @{ x = $wa.X; y = $wa.Y; w = $wa.Width; h = $wa.Height } }
$out.scr = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object { $b = $_.WorkingArea; @{ x = $b.X; y = $b.Y; w = $b.Width; h = $b.Height } })
$pids = New-Object 'System.Collections.Generic.HashSet[uint32]'
<# (11/12 hands1 정범님 'HOME 알라딘은 평소 크롬을 손발로') @hands = 평소 크롬(따로 된 프로필 --user-data-dir 없이 뜬 크롬 = 정범님 크롬)의 창 가운데 제목에 '리드나우 손발'(운영 수집기 탭이 붙임)이 든 창만 · 운영 작업 창은 운영 도우미 몫이라 안 건드림
   · 찾기·숨기기·띄우기·앞으로만 — 끄기(kill)·닫기(close)는 평소 크롬에 절대 안 함 #>
$hands = ($Mark -eq '@hands'); if ($hands -and ($Act -eq 'kill' -or $Act -eq 'close')) { $out.ok = $false; $out.err = '평소 크롬은 끄거나 닫지 않음'; $out.n = 0; $out.list = @(); $out | ConvertTo-Json -Compress -Depth 5; exit 0 }
if ($hands) { Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $c = [string]$_.CommandLine; -not ($c -like '*--user-data-dir*' -or $c -like '*--headless*' -or $c -like '*--remote-debugging*') } | ForEach-Object { [void]$pids.Add([uint32]$_.ProcessId) } }
else { Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ('*' + $Mark + '*') } | ForEach-Object { [void]$pids.Add([uint32]$_.ProcessId) } }
if ($Act -eq 'kill') { $k = 0; foreach ($q in $pids) { try { Stop-Process -Id $q -Force -ErrorAction Stop; $k++ } catch {} }; foreach ($q in $pids) { try { Wait-Process -Id $q -Timeout 5 -ErrorAction SilentlyContinue } catch {} }
  $left = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ('*' + $Mark + '*') }).Count; $out.killed = $k; $out.left = $left; $out.n = 0; $out.list = @(); $out | ConvertTo-Json -Compress -Depth 5; exit 0 }
$L = @(); if ($pids.Count) { $L = @([RnCol2Win]::Find($pids)) }
if ($hands) { $L = @($L | Where-Object { [RnCol2Win]::Title($_) -like '*리드나우 손발*' }) }
<# (11/10) 보이는 창을 먼저 — 크롬의 보이지 않는 창(제목만 있는 숨은 창)을 먼저 집어 닫기·앞으로를 엉뚱한 창에 하지 않게 #>
if ($L.Count -gt 1) { $L = @(@($L | Where-Object { [RnCol2Win]::IsWindowVisible($_) }) + @($L | Where-Object { -not [RnCol2Win]::IsWindowVisible($_) })) }
$out.n = $L.Count; $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ })
if ($L.Count -gt 0) { $hnd = $L[0]
  if ($Act -eq 'hide') { if ([RnCol2Win]::IsIconic($hnd) -or [RnCol2Win]::IsZoomed($hnd)) { [void][RnCol2Win]::ShowWindow($hnd, 4) }
    $w = [Math]::Max(400, $W); $hh = [Math]::Max(300, $H)
    if ($Place -eq 'edge') { $x = $wa.X + $wa.Width - 6; $y = $wa.Y + $wa.Height - 6 } else { $x = $vs.X - $w - 400; $y = $vs.Y + 40 }
    [RnCol2Win]::Taskbar($hnd, $true); [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr]1, $x, $y, $w, $hh, 0x0010) }
  elseif ($Act -eq 'show') { [RnCol2Win]::Taskbar($hnd, $false); if ([RnCol2Win]::IsIconic($hnd)) { [void][RnCol2Win]::ShowWindow($hnd, 9) }
    $w = $W; $hh = $H; $x = $X; $y = $Y; <# (0.1.7) 60×40 이상이면 준 크기 그대로(▁ 작은 단추 132×104) — 그보다 작거나 없으면 가운데 기본 크기 #> if ($w -lt 60 -or $hh -lt 40) { $w = [Math]::Min(${D.showW}, $wa.Width); $hh = [Math]::Min(${D.showH}, $wa.Height); $x = $wa.X + [int](($wa.Width - $w) / 2); $y = $wa.Y + [int](($wa.Height - $hh) / 2) }
    $okp = $false; foreach ($sc in [System.Windows.Forms.Screen]::AllScreens) { $b = $sc.WorkingArea; if ($x -ge $b.X - 60 -and $x -le $b.X + $b.Width - 120 -and $y -ge $b.Y - 20 -and $y -le $b.Y + $b.Height - 80) { $okp = $true } }
    if (-not $okp) { $x = $wa.X + [int](($wa.Width - [Math]::Min($w, $wa.Width)) / 2); $y = $wa.Y + 20 }
    [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr](-1), $x, $y, $w, $hh, 0x0040); if ($Top -ne 1) { [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr](-2), 0, 0, 0, 0, 0x0043) }; [void][RnCol2Win]::SetForegroundWindow($hnd) }
  elseif ($Act -eq 'front') { <# (11/12 login2) 사람 로그인 창 — 모양·자리·작업 표시줄 표시는 그대로 두고 앞으로만 #> if ([RnCol2Win]::IsIconic($hnd)) { [void][RnCol2Win]::ShowWindow($hnd, 9) }; [void][RnCol2Win]::SetForegroundWindow($hnd) }
  elseif ($Act -eq 'close') { foreach ($q in $L) { [void][RnCol2Win]::PostMessage($q, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) } }
  $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ }) }
$out | ConvertTo-Json -Compress -Depth 5
`;

/* C# 글(@' … '@ 사이)의 해시 — 글이 바뀌면 새 dll 이름(옛 dll을 잘못 불러오지 않음) */
const WIN_HASH = (() => { const m = /\$rnSrc = @'([\s\S]*?)\n'@/.exec(PS_RAW({ showW: 0, showH: 0 })); return crypto.createHash('sha1').update(m ? m[1] : 'x').digest('hex').slice(0, 12); })();

function makeWin(o) { const psFile = o.psFile; const D = o.D; const psExe = () => process.env.RN_COL2_PS || 'powershell.exe';
  /* (11/12 hands1) mark '@hands' = 평소 크롬의 손발 창(제목 표시로 찾음) — find|hide|show|front만(kill·close는 여기서도 거절) */
  /* act: find|hide|show|front(11/12 login2 · 앞으로만)|close|kill(0.1.2 · 이 프로필 이름이 명령 줄에 든 크롬 프로세스만 끝냄 — 바로 꺼짐의 원인인 옛 번외 크롬 치우기 · 0.1.3 끝날 때까지 5초 기다리고 남은 수 left) · mark: 프로필 폴더 이름(col2-work-chrome · col2-stat-chrome · col2-win-chrome) */
  /* (11/10 정범님 '더뎌진 느낌') PowerShell은 한 번에 2개까지만(지킴이·예스24·기록창이 겹쳐 CPU가 튀지 않게) — 나머지는 차례를 기다림 */
  let busy = 0; const q = []; const MAX = 2; const T = []; /* (11/12 rel9) 최근 한 시간 PowerShell 켠 때 — 상태 st.load.ps(시간당 횟수)로 col2_ctl에 */
  const pump = () => { while (busy < MAX && q.length) { const [f, res] = q.shift(); busy++; f().then((r) => { busy--; res(r); pump(); }); } };
  function run(act, mark, a) { if (mark === '@hands' && !/^(find|hide|show|front)$/.test(String(act))) return Promise.resolve({ ok: false, err: '평소 크롬은 끄거나 닫지 않음' }); return new Promise((res) => { q.push([() => run1(act, mark, a), res]); pump(); }); }
  function run1(act, mark, a) { a = a || {}; return new Promise((res) => {
    try { const want = '﻿' + PS_SRC(D).replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(psFile, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(psFile, want, 'utf8'); } catch (e) { return res({ ok: false, err: '창 다루기 파일을 못 씀: ' + e.message }); }
    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile, '-Act', act, '-Mark', mark];
    for (const k of ['X', 'Y', 'W', 'H']) { const v = a[k.toLowerCase()]; if (v != null && Number.isFinite(+v)) args.push('-' + k, String(Math.round(+v))); }
    if (a.place) args.push('-Place', a.place === 'edge' ? 'edge' : 'off');
    if (a.top) args.push('-Top', '1'); /* (0.1.7) ▁ 작은 단추 — 늘 다른 창 위에(그 밖 show는 앞으로 꺼낸 뒤 보통 창으로) */
    { const t = Date.now(); T.push(t); while (T.length && t - T[0] > 3600e3) T.shift(); if (T.length > 5000) T.splice(0, T.length - 5000); }
    cp.execFile(psExe(), args, { windowsHide: true, timeout: 45000, maxBuffer: 4 * 1048576 }, (e, out, err) => { const line = String(out || '').trim().split(/\r?\n/).reverse().find((l) => /^\{/.test(l.trim())); let j = null; try { j = JSON.parse(line); } catch (x) {}
      if (!j) return res({ ok: false, err: '창 다루기 실패: ' + String(err || (e && e.message) || '응답 없음').slice(0, 200) }); j.list = Array.isArray(j.list) ? j.list : j.list ? [j.list] : []; res(j); }); }); }
  /* (11/12 rel9) 최근 한 시간 창 다루기 PowerShell 횟수 · 기다리는 수 */
  function sum() { const t = Date.now(); while (T.length && t - T[0] > 3600e3) T.shift(); return { h: T.length, q: q.length, busy }; }
  return { run, sum };
}
module.exports = { makeWin, PS_SRC, WIN_HASH };
