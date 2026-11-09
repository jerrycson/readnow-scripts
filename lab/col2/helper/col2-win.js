/* col2-win.js — 번외 작업 창·상태 창 다루기(PowerShell + user32)
 * 운영 readnow-work.js는 '제목에 리드나우 작업 창이 든 창'을 찾지만, 여기서는 **번외 크롬 프로필 폴더 이름이 명령 줄에 든 크롬 프로세스의 창만** 찾음
 *  → 정범님 크롬·운영 작업 창·로거 크롬은 절대 건드리지 않음(프로필 폴더 이름이 다름)
 * 결과는 맨 끝 한 줄 JSON { ok, act, vs, wa, scr(모든 화면 일하는 칸), n, list:[{ h, r:{x,y,w,h}, vis, ic, zm, tool }] } */
'use strict';
const fs = require('fs'), cp = require('child_process');

const PS_SRC = (D) => `param([string]$Act = 'find', [int]$X = 0, [int]$Y = 0, [int]$W = 0, [int]$H = 0, [string]$Place = 'off', [string]$Mark = 'col2-work-chrome')
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
if (-not ('RnCol2Win' -as [type])) { Add-Type -TypeDefinition @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class RnCol2Win {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP f, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
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
'@ }
function R($h) { $r = New-Object RnCol2Win+RECT; [void][RnCol2Win]::GetWindowRect($h, [ref]$r); @{ x = $r.L; y = $r.T; w = ($r.R - $r.L); h = ($r.B - $r.T) } }
function Info($h) { @{ h = [int64]$h; r = (R $h); vis = [RnCol2Win]::IsWindowVisible($h); ic = [RnCol2Win]::IsIconic($h); zm = [RnCol2Win]::IsZoomed($h); tool = [RnCol2Win]::Tool($h) } }
$vs = [System.Windows.Forms.SystemInformation]::VirtualScreen; $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$out = @{ ok = $true; act = $Act; vs = @{ x = $vs.X; y = $vs.Y; w = $vs.Width; h = $vs.Height }; wa = @{ x = $wa.X; y = $wa.Y; w = $wa.Width; h = $wa.Height } }
$out.scr = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object { $b = $_.WorkingArea; @{ x = $b.X; y = $b.Y; w = $b.Width; h = $b.Height } })
$pids = New-Object 'System.Collections.Generic.HashSet[uint32]'
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ('*' + $Mark + '*') } | ForEach-Object { [void]$pids.Add([uint32]$_.ProcessId) }
if ($Act -eq 'kill') { $k = 0; foreach ($q in $pids) { try { Stop-Process -Id $q -Force -ErrorAction Stop; $k++ } catch {} }; foreach ($q in $pids) { try { Wait-Process -Id $q -Timeout 5 -ErrorAction SilentlyContinue } catch {} }
  $left = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ('*' + $Mark + '*') }).Count; $out.killed = $k; $out.left = $left; $out.n = 0; $out.list = @(); $out | ConvertTo-Json -Compress -Depth 5; exit 0 }
$L = @(); if ($pids.Count) { $L = @([RnCol2Win]::Find($pids)) }
$out.n = $L.Count; $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ })
if ($L.Count -gt 0) { $hnd = $L[0]
  if ($Act -eq 'hide') { if ([RnCol2Win]::IsIconic($hnd) -or [RnCol2Win]::IsZoomed($hnd)) { [void][RnCol2Win]::ShowWindow($hnd, 4) }
    $w = [Math]::Max(400, $W); $hh = [Math]::Max(300, $H)
    if ($Place -eq 'edge') { $x = $wa.X + $wa.Width - 6; $y = $wa.Y + $wa.Height - 6 } else { $x = $vs.X - $w - 400; $y = $vs.Y + 40 }
    [RnCol2Win]::Taskbar($hnd, $true); [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr]1, $x, $y, $w, $hh, 0x0010) }
  elseif ($Act -eq 'show') { [RnCol2Win]::Taskbar($hnd, $false); if ([RnCol2Win]::IsIconic($hnd)) { [void][RnCol2Win]::ShowWindow($hnd, 9) }
    $w = $W; $hh = $H; $x = $X; $y = $Y; if ($w -lt 200 -or $hh -lt 150) { $w = [Math]::Min(${D.showW}, $wa.Width); $hh = [Math]::Min(${D.showH}, $wa.Height); $x = $wa.X + [int](($wa.Width - $w) / 2); $y = $wa.Y + [int](($wa.Height - $hh) / 2) }
    $okp = $false; foreach ($sc in [System.Windows.Forms.Screen]::AllScreens) { $b = $sc.WorkingArea; if ($x -ge $b.X - 60 -and $x -le $b.X + $b.Width - 120 -and $y -ge $b.Y - 20 -and $y -le $b.Y + $b.Height - 80) { $okp = $true } }
    if (-not $okp) { $x = $wa.X + [int](($wa.Width - [Math]::Min($w, $wa.Width)) / 2); $y = $wa.Y + 20 }
    [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr](-1), $x, $y, $w, $hh, 0x0040); [void][RnCol2Win]::SetWindowPos($hnd, [IntPtr](-2), 0, 0, 0, 0, 0x0043); [void][RnCol2Win]::SetForegroundWindow($hnd) }
  elseif ($Act -eq 'close') { foreach ($q in $L) { [void][RnCol2Win]::PostMessage($q, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) } }
  $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ }) }
$out | ConvertTo-Json -Compress -Depth 5
`;

function makeWin(o) { const psFile = o.psFile; const D = o.D; const psExe = () => process.env.RN_COL2_PS || 'powershell.exe';
  /* act: find|hide|show|close|kill(0.1.2 · 이 프로필 이름이 명령 줄에 든 크롬 프로세스만 끝냄 — 바로 꺼짐의 원인인 옛 번외 크롬 치우기 · 0.1.3 끝날 때까지 5초 기다리고 남은 수 left) · mark: 프로필 폴더 이름(col2-work-chrome · col2-stat-chrome · col2-win-chrome) */
  function run(act, mark, a) { a = a || {}; return new Promise((res) => {
    try { const want = '﻿' + PS_SRC(D).replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(psFile, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(psFile, want, 'utf8'); } catch (e) { return res({ ok: false, err: '창 다루기 파일을 못 씀: ' + e.message }); }
    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile, '-Act', act, '-Mark', mark];
    for (const k of ['X', 'Y', 'W', 'H']) { const v = a[k.toLowerCase()]; if (v != null && Number.isFinite(+v)) args.push('-' + k, String(Math.round(+v))); }
    if (a.place) args.push('-Place', a.place === 'edge' ? 'edge' : 'off');
    cp.execFile(psExe(), args, { windowsHide: true, timeout: 45000, maxBuffer: 4 * 1048576 }, (e, out, err) => { const line = String(out || '').trim().split(/\r?\n/).reverse().find((l) => /^\{/.test(l.trim())); let j = null; try { j = JSON.parse(line); } catch (x) {}
      if (!j) return res({ ok: false, err: '창 다루기 실패: ' + String(err || (e && e.message) || '응답 없음').slice(0, 200) }); j.list = Array.isArray(j.list) ? j.list : j.list ? [j.list] : []; res(j); }); }); }
  return { run };
}
module.exports = { makeWin, PS_SRC };
