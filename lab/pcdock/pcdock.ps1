param([string]$Act = 'screens', [string]$DockHome = '', [int]$On = -1, [string]$CsFile = '')
# pcdock.ps1 — 🖥 PC 배치 도우미의 윈도우 일(readnow-pcdock.js가 부름 · 넘길 값은 표준 입력 JSON · 결과는 맨 끝 한 줄 JSON)
#  Act: screens(모니터) · windows(떠 있는 창) · find(실행 파일 찾기) · lnk(바로가기 풀기) · startup(윈도우 시작 자동 켜기/끄기/보기) · run(실행·배치) · cleanscan(정리 미리보기) · cleanrun(정리)
#  (윈도우 PowerShell 5.1은 BOM 없는 파일을 한국어로 못 읽어서 readnow-pcdock.js가 BOM·CRLF를 붙인 사본을 <DockHome>에 두고 그것을 부름)
#  C# 글(pcdock-win.cs)은 한 번 엮어 <DockHome>\pcdock-win-<해시>.dll 로 두고 다시 씀(부를 때마다 새 dll을 만들면 Defender가 매번 검사 — 11/12 JS-MAIN 교훈)
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$out = @{ ok = $true; act = $Act }
function Done($o) { $o | ConvertTo-Json -Compress -Depth 8; exit 0 }
function Fail($m) { Done @{ ok = $false; act = $Act; err = "$m" } }
try {
  $In = $null; if ($Act -ne 'screens' -and $Act -ne 'windows') { $raw = [Console]::In.ReadToEnd(); if ($raw.Trim()) { $In = $raw | ConvertFrom-Json } }
  if (-not $DockHome) { $DockHome = Join-Path $env:LOCALAPPDATA 'ReadNow\pcdock' }
  New-Item -ItemType Directory -Force -Path $DockHome | Out-Null
  if (-not ('RnDock' -as [type])) {
    $csFile = $(if ($CsFile) { $CsFile } else { Join-Path $PSScriptRoot 'pcdock-win.cs' }); $cs = [IO.File]::ReadAllText($csFile)
    $sha = [Security.Cryptography.SHA1]::Create(); $hash = (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($cs)) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 12)
    $dll = Join-Path $DockHome "pcdock-win-$hash.dll"
    if (Test-Path -LiteralPath $dll) { try { Add-Type -LiteralPath $dll -ErrorAction Stop } catch {} }
    if (-not ('RnDock' -as [type])) { $tmp = Join-Path $DockHome "pcdock-win-$hash.$PID.dll"
      try { Add-Type -TypeDefinition $cs -OutputAssembly $tmp -OutputType Library -ErrorAction Stop; if (-not (Test-Path -LiteralPath $dll)) { Move-Item -LiteralPath $tmp -Destination $dll -ErrorAction Stop } } catch {}
      if (-not ('RnDock' -as [type])) { try { Add-Type -LiteralPath $(if (Test-Path -LiteralPath $dll) { $dll } else { $tmp }) -ErrorAction Stop } catch {} }
      try { if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue } } catch {} }
    if (-not ('RnDock' -as [type])) { Add-Type -TypeDefinition $cs } }
  $out.aware = [RnDock]::Aware()
} catch { Fail "준비 실패: $($_.Exception.Message)" }

function Rc($r) { @{ x = $r.L; y = $r.T; w = ($r.R - $r.L); h = ($r.B - $r.T) } }
function Mons { @([RnDock]::Monitors() | ForEach-Object { @{ id = $_.Id; primary = $_.Primary; b = (Rc $_.B); wa = (Rc $_.Wa); dpi = [int]$_.Dpi } }) }
function WinInfo($w) { @{ h = $w.H; pid = [int]$w.Pid; proc = $w.Proc; cls = $w.Cls; title = $w.Title; r = (Rc $w.R); ic = $w.Ic; zm = $w.Zm } }
function Exp($p) { [Environment]::ExpandEnvironmentVariables("$p") }
function Q($a) { $s = "$a"; if ($s -match '[\s"]') { '"' + ($s -replace '"', '\"') + '"' } else { $s } }
function IconOf($p) { try { Add-Type -AssemblyName System.Drawing; $ic = [System.Drawing.Icon]::ExtractAssociatedIcon($p); if (-not $ic) { return $null }; $bm = $ic.ToBitmap(); $ms = New-Object IO.MemoryStream; $bm.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $b = [Convert]::ToBase64String($ms.ToArray()); $bm.Dispose(); $ic.Dispose(); return $b } catch { return $null } }
$script:sh = $null; function Shell { if (-not $script:sh) { $script:sh = New-Object -ComObject WScript.Shell }; $script:sh }
function LnkTarget($p) { try { $l = (Shell).CreateShortcut($p); return @{ target = $l.TargetPath; args = $l.Arguments; dir = $l.WorkingDirectory } } catch { return $null } }
$script:menu = $null
function MenuLinks { if ($null -eq $script:menu) { $script:menu = @(); foreach ($d in @((Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'), [Environment]::GetFolderPath('Desktop'), (Join-Path $env:PUBLIC 'Desktop'))) { if ($d -and (Test-Path -LiteralPath $d)) { $script:menu += @(Get-ChildItem -LiteralPath $d -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue) } } }; $script:menu }
function FindExe($h) {
  if ($h.exe) { foreach ($root in @('HKCU:', 'HKLM:', 'HKLM:\SOFTWARE\WOW6432Node')) { $k = "$root\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$($h.exe)"; if ($root -like '*WOW6432Node') { $k = "$root\Microsoft\Windows\CurrentVersion\App Paths\$($h.exe)" }
      try { $v = (Get-ItemProperty -LiteralPath $k -ErrorAction Stop).'(default)'; if ($v) { $v = (Exp $v).Trim('"'); if (Test-Path -LiteralPath $v) { return $v } } } catch {} } }
  foreach ($p in @($h.paths)) { if ($p) { $e = Exp $p; if (Test-Path -LiteralPath $e) { return $e } } }
  foreach ($g in @($h.glob)) { if ($g) { $hit = @(Get-ChildItem -Path (Exp $g) -ErrorAction SilentlyContinue | Sort-Object FullName -Descending); if ($hit.Count) { return $hit[0].FullName } } }
  foreach ($n in @($h.lnk)) { if ($n) { foreach ($f in (MenuLinks)) { if ($f.BaseName -like "$n*") { $t = LnkTarget $f.FullName; if ($t -and $t.target -and $t.target -like '*.exe' -and (Test-Path -LiteralPath $t.target)) { if (-not $h.exe -or ((Split-Path $t.target -Leaf) -ieq $h.exe)) { return $t.target } } } } } }
  return $null }

try {
switch ($Act) {
  'screens' { $out.mons = @(Mons); Done $out }
  'windows' { $out.wins = @([RnDock]::Windows() | Select-Object -First 300 | ForEach-Object { WinInfo $_ }); $out.mons = @(Mons); Done $out }
  'find' { $f = @{}; $ic = @{}
    foreach ($h in @($In.hints)) { $p = FindExe $h; if ($p) { $f[$h.key] = $p; $i = IconOf $p; if ($i) { $ic[$h.key] = $i } } }
    foreach ($p in @($In.icons)) { if ($p -and (Test-Path -LiteralPath $p)) { $i = IconOf $p; if ($i) { $ic[$p] = $i } } }
    $out.found = $f; $out.icons = $ic; Done $out }
  'lnk' { $p = "$($In.path)"; if (-not (Test-Path -LiteralPath $p)) { Fail '바로가기 파일이 없음' }
    $t = LnkTarget $p; if (-not $t -or -not $t.target) { Fail '바로가기 대상을 못 읽음' }
    $out.target = $t.target; $out.args = $t.args; $out.icon = (IconOf $t.target); Done $out }
  'exe' { $n = "$($In.name)"; $out.list = @(); if ($n) { $h = @{ exe = $n; paths = @(); glob = @("%ProgramFiles%\*\$n", "%ProgramFiles(x86)%\*\$n", "%ProgramFiles%\*\*\$n", "%ProgramFiles(x86)%\*\*\$n", "%LOCALAPPDATA%\Programs\*\$n", "%LOCALAPPDATA%\*\$n"); lnk = @() }
      $p = FindExe $h; if ($p) { $out.list = @($p); $out.icon = (IconOf $p) } }; Done $out }
  'startup' { $dir = [Environment]::GetFolderPath('Startup'); $lnk = Join-Path $dir "$($In.name).lnk"; $off = "$lnk.off"
    if ($On -eq 1) { if (Test-Path -LiteralPath $off) { Remove-Item -LiteralPath $off -Force }; $l = (Shell).CreateShortcut($lnk); $l.TargetPath = 'wscript.exe'; $l.Arguments = (Q $In.vbs) + ' ' + "$($In.args)"; $l.WorkingDirectory = (Split-Path $In.vbs); $l.Description = '리드나우 PC 배치 — 로그온 뒤 설정대로 실행·배치'; $l.Save() }
    elseif ($On -eq 0) { if (Test-Path -LiteralPath $lnk) { if (Test-Path -LiteralPath $off) { Remove-Item -LiteralPath $off -Force }; Rename-Item -LiteralPath $lnk -NewName (Split-Path $off -Leaf) } }
    $out.on = (Test-Path -LiteralPath $lnk); $out.path = $lnk; Done $out }
  'run' {
    $steps = @($In.steps); $wait = [Math]::Max(5, [int]$In.waitSec)
    $before = @{}; foreach ($w in [RnDock]::Windows()) { $before[[int64]$w.H] = 1 }
    $claimed = @{}; $S = @()
    function Fits($w, $s, $freshOnly) { $m = $s.match
      if ($claimed.ContainsKey([int64]$w.H)) { return $false }
      if ($freshOnly -and $before.ContainsKey([int64]$w.H)) { return $false }
      if (@($m.procs).Count -and -not (@($m.procs) | Where-Object { $_ -and ($w.Proc -ieq $_) })) { return $false }
      if ($m.cls -and $w.Cls -ne $m.cls) { return $false }
      if ($m.title -and -not ($w.Title -match $m.title)) { return $false }
      return $true }
    function Put($st, $w, $how) { $r = $st.s.rect; $f = [RnDock]::Place([int64]$w.H, [int]$r.x, [int]$r.y, [int]$r.w, [int]$r.h); $claimed[[int64]$w.H] = 1; $st.h = [int64]$w.H; $st.done = $true; $st.how = $how; $st.title = $w.Title; $st.got = (Rc $f) }
    foreach ($s in $steps) { $st = @{ s = $s; done = $false; how = ''; t0 = [DateTime]::Now; err = '' }
      if ($s.reuse) { $hit = @([RnDock]::Windows() | Where-Object { Fits $_ $s $false }) | Select-Object -First 1; if ($hit) { Put $st $hit '이미 떠 있어 자리만 옮김' } }
      if (-not $st.done -and $s.launch) { try { if ($s.launch.uri) { Start-Process -FilePath "$($s.launch.uri)" } else { $al = @($s.launch.args | ForEach-Object { Q $_ }) -join ' '; if ($al) { Start-Process -FilePath "$($s.launch.file)" -ArgumentList $al } else { Start-Process -FilePath "$($s.launch.file)" } }; $st.how = '켬' } catch { $st.err = "켜기 실패: $($_.Exception.Message)" } }
      $S += $st; Start-Sleep -Milliseconds 400 }
    $end = [DateTime]::Now.AddSeconds($wait)
    while ((@($S | Where-Object { -not $_.done -and -not $_.err }).Count) -and [DateTime]::Now -lt $end) {
      Start-Sleep -Milliseconds 700; $W = @([RnDock]::Windows())
      foreach ($st in @($S | Where-Object { -not $_.done -and -not $_.err })) {
        $hit = @($W | Where-Object { Fits $_ $st.s $true }) | Select-Object -First 1
        if (-not $hit -and -not $st.s.match.fresh -and ([DateTime]::Now - $st.t0).TotalSeconds -gt 3) { $hit = @($W | Where-Object { Fits $_ $st.s $false }) | Select-Object -First 1 }
        if ($hit) { Put $st $hit ($(if ($st.how) { $st.how + ' → 자리 옮김' } else { '자리 옮김' })) } } }
    # 뜬 뒤 스스로 크기를 바꾸는 프로그램(크롬·오피스)이 있어 한 번 더
    if (@($S | Where-Object { $_.done }).Count) { Start-Sleep -Milliseconds 1500; foreach ($st in @($S | Where-Object { $_.done })) { try { $r = $st.s.rect; $st.got = (Rc ([RnDock]::Place([int64]$st.h, [int]$r.x, [int]$r.y, [int]$r.w, [int]$r.h))) } catch {} } }
    $out.res = @($S | ForEach-Object { @{ app = $_.s.app; name = $_.s.name; ok = [bool]$_.done; how = $(if ($_.done) { $_.how } elseif ($_.err) { $_.err } else { "창을 못 찾음($wait초)" }); title = $_.title; want = $_.s.rect; got = $_.got } })
    Done $out }
  { $_ -eq 'cleanscan' -or $_ -eq 'cleanrun' } {
    $prot = @(@($In.protect) | ForEach-Object { (Exp $_).TrimEnd('\') } | Where-Object { $_ }); $mark = "$($In.mark)"
    function Prot($p) { foreach ($x in $prot) { if ($p.Equals($x, [StringComparison]::OrdinalIgnoreCase) -or $p.StartsWith($x + '\', [StringComparison]::OrdinalIgnoreCase)) { return $true } }; if ($mark -and $p -match $mark) { return $true }; return $false }
    function Files($t) { $L = New-Object System.Collections.Generic.List[IO.FileInfo]; $cut = [DateTime]::Now.AddDays(-[double]$t.ageDays); $pat = $(if ($t.pat) { "$($t.pat)" } else { '*' })
      $q = New-Object System.Collections.Queue; foreach ($r in @($t.roots)) { $e = (Exp $r).TrimEnd('\'); if ($e -and (Test-Path -LiteralPath $e) -and -not (Prot $e)) { $q.Enqueue(@($e, 0)) } }
      while ($q.Count -and $L.Count -lt 200000) { $it = $q.Dequeue(); $d = New-Object IO.DirectoryInfo $it[0]
        try { foreach ($f in $d.EnumerateFiles($pat)) { if (($f.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0 -and $f.LastWriteTime -lt $cut -and -not (Prot $f.FullName)) { $L.Add($f) } } } catch {}
        if ($it[1] -lt [int]$t.depth) { try { foreach ($s in $d.EnumerateDirectories()) { if (($s.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0 -and -not (Prot $s.FullName)) { $q.Enqueue(@($s.FullName, $it[1] + 1)) } } } catch {} } }
      return ,$L }
    $tg = @($In.targets | Where-Object { -not $_.kind })
    if ($Act -eq 'cleanscan') {
      $out.targets = @($tg | ForEach-Object { $L = Files $_; $b = 0; foreach ($f in $L) { $b += $f.Length }; @{ id = $_.id; files = $L.Count; bytes = $b; sample = @($L | Select-Object -First 4 | ForEach-Object { $_.FullName }) } })
      $c0 = @{}; foreach ($p in Get-Process) { try { $c0[$p.Id] = $p.TotalProcessorTime.TotalMilliseconds } catch {} }; $t0 = [DateTime]::Now; Start-Sleep -Milliseconds 1500
      $cim = @{}; foreach ($w in @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)) { $cim[[int]$w.ProcessId] = $w }
      $dt = ([DateTime]::Now - $t0).TotalMilliseconds * [Environment]::ProcessorCount
      $out.procs = @(Get-Process | ForEach-Object { $c = 0; try { if ($c0.ContainsKey($_.Id)) { $c = [Math]::Round(($_.TotalProcessorTime.TotalMilliseconds - $c0[$_.Id]) / $dt * 100, 1) } } catch {}; $w = $cim[[int]$_.Id]; @{ pid = $_.Id; name = $_.ProcessName; ws = $_.WorkingSet64; cpu = $c; path = $(if ($w) { "$($w.ExecutablePath)" } else { '' }); cmd = $(if ($w) { "$($w.CommandLine)".Substring(0, [Math]::Min(300, "$($w.CommandLine)".Length)) } else { '' }) } })
      $su = @(); foreach ($k in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run')) { try { $p = Get-ItemProperty -LiteralPath $k -ErrorAction Stop; foreach ($n in $p.PSObject.Properties) { if ($n.Name -notlike 'PS*') { $su += @{ name = $n.Name; cmd = "$($n.Value)"; where = $k } } } } catch {} }
      foreach ($d in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) { if ($d -and (Test-Path -LiteralPath $d)) { foreach ($f in Get-ChildItem -LiteralPath $d -File -ErrorAction SilentlyContinue) { $su += @{ name = $f.Name; cmd = $f.FullName; where = '시작 프로그램 폴더' } } } }
      $out.startup = $su
      try { $out.defEx = @((Get-MpPreference -ErrorAction Stop).ExclusionPath) } catch { $out.defEx = $null }
      Done $out }
    # cleanrun — 파일마다 보호 목록을 한 번 더 보고 지움 · 열려 있어 못 지우면 건너뜀
    $n = 0; $b = 0; $bad = 0
    foreach ($t in $tg) { foreach ($f in (Files $t)) { try { $len = $f.Length; [IO.File]::Delete($f.FullName); $n++; $b += $len } catch { $bad++ } } }
    $out.deleted = $n; $out.freed = $b; $out.failed = $bad
    $stopped = @(); foreach ($p in @($In.pids)) { try { $pr = Get-Process -Id ([int]$p.pid) -ErrorAction Stop; if ($pr.ProcessName -ieq "$($p.name)") { Stop-Process -Id $pr.Id -ErrorAction Stop; $stopped += "$($p.name)" } } catch {} }
    $out.stopped = $stopped
    if ($In.trim) { $skip = @{}; foreach ($s in @($In.skip)) { $skip["$s".ToLower()] = 1 }; $m0 = 0; $m1 = 0; $tn = 0
      foreach ($p in Get-Process) { $m0 += $p.WorkingSet64; if (-not $skip.ContainsKey($p.ProcessName.ToLower())) { try { if ([RnDock]::Trim([uint32]$p.Id)) { $tn++ } } catch {} } }
      Start-Sleep -Milliseconds 800; foreach ($p in Get-Process) { $m1 += $p.WorkingSet64 }; $out.mem = @{ before = $m0; after = $m1; n = $tn } }
    Done $out }
  'fit' { # 이 도우미 창(제목으로 찾음)을 그 창이 있는 모니터 가운데에 w×h(배율 적용 전 크기)로
    $hit = @([RnDock]::Windows() | Where-Object { $_.Title -like "*$($In.title)*" -and $_.Proc -ieq 'chrome' }) | Select-Object -First 1; if (-not $hit) { Fail '창을 못 찾음' }
    $cx = ($hit.R.L + $hit.R.R) / 2; $cy = ($hit.R.T + $hit.R.B) / 2; $M = @(Mons); $m = @($M | Where-Object { $cx -ge $_.b.x -and $cx -lt ($_.b.x + $_.b.w) -and $cy -ge $_.b.y -and $cy -lt ($_.b.y + $_.b.h) }) | Select-Object -First 1; if (-not $m) { $m = @($M | Where-Object { $_.primary }) | Select-Object -First 1 }; if (-not $m) { $m = $M[0] }
    $k = $m.dpi / 96.0; $w = [Math]::Min([int]($In.w * $k), $m.wa.w); $h = [Math]::Min([int]($In.h * $k), $m.wa.h)
    $x = $(if ($In.corner -eq 'tr') { $m.wa.x + $m.wa.w - $w } else { $m.wa.x + [int](($m.wa.w - $w) / 2) }); $y = $(if ($In.corner -eq 'tr') { $m.wa.y } else { $m.wa.y + [int](($m.wa.h - $h) / 2) })
    $out.got = (Rc ([RnDock]::Place([int64]$hit.H, $x, $y, $w, $h))); Done $out }
  default { Fail "모르는 일: $Act" }
}
} catch { Fail $_.Exception.Message }
