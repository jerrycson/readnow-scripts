param([string]$Act = 'screens', [string]$DockHome = '', [int]$On = -1, [string]$CsFile = '')
# pcdock.ps1 — 🖥 PC 배치 도우미의 윈도우 일(readnow-pcdock.js가 부름 · 넘길 값은 표준 입력 JSON · 결과는 맨 끝 한 줄 JSON)
#  (0.1.7) find = 실행 파일 '증거'(떠 있는 프로세스·바로 가기·레지스트리·흔한 자리·시작 메뉴 앱)만 모음 — 고르기는 apps.js pickExe · fit rect = 그 자리로
#  Act: screens(모니터) · stopold(새 판이 옛 판 서버를 넘겨받음 · 0.1.3) · front(이 도우미 창을 앞으로 · 0.1.4) · windows(떠 있는 창) · find(실행 파일 찾기) · lnk(바로가기 풀기) · startup(윈도우 시작 자동 켜기/끄기/보기) · run(실행·배치) · cleanscan(정리 미리보기) · cleanrun(정리)
#  ⚠ PowerShell 변수 이름은 대소문자를 가리지 않음 — $S와 $s는 같은 변수(0.1.0 '③ Claude만 되고 나머지 안 됨'의 까닭: foreach ($s …)가 결과 목록 $S를 덮어 $S += 가 PSObject 더하기로 터짐)
#     → 대소문자만 다른 변수 이름을 쓰지 않음 · 목록은 ArrayList.Add로 쌓음(tests/t_static이 검사)
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
    $csPath = $(if ($CsFile) { $CsFile } else { Join-Path $PSScriptRoot 'pcdock-win.cs' }); $cs = [IO.File]::ReadAllText($csPath)
    $sha = [Security.Cryptography.SHA1]::Create(); $hash = (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($cs)) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 12)
    $dll = Join-Path $DockHome "pcdock-win-$hash.dll"
    if (Test-Path -LiteralPath $dll) { try { Add-Type -LiteralPath $dll -ErrorAction Stop } catch {} }
    if (-not ('RnDock' -as [type])) { $tmp = Join-Path $DockHome "pcdock-win-$hash.$PID.dll"
      try { Add-Type -TypeDefinition $cs -OutputAssembly $tmp -OutputType Library -ErrorAction Stop; if (-not (Test-Path -LiteralPath $dll)) { Move-Item -LiteralPath $tmp -Destination $dll -ErrorAction Stop } } catch {}
      if (-not ('RnDock' -as [type])) { try { Add-Type -LiteralPath $(if (Test-Path -LiteralPath $dll) { $dll } else { $tmp }) -ErrorAction Stop } catch {} }
      try { if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue } } catch {} }
    if (-not ('RnDock' -as [type])) { $Error.Clear(); try { Add-Type -TypeDefinition $cs -ErrorAction Stop } catch { $ce = @(@($Error) | Select-Object -First 4 | ForEach-Object { "$($_.Exception.Message)".Trim() } | Where-Object { $_ } | Select-Object -Unique) -join ' / '; if (-not $ce) { $ce = "$($_.Exception.Message)" }; throw "C# 글(pcdock-win.cs)을 엮지 못함 — $ce" } } }
  # (0.1.3) 엮지 못하면 까닭(컴파일 오류 글)을 그대로 돌려줌 — 0.1.1~0.1.2는 이 실패를 화면이 '모니터 0대'로만 보여 까닭이 숨었음
  $out.aware = [RnDock]::Aware()
} catch { Fail "준비 실패: $($_.Exception.Message)" }

function Rc($r) { @{ x = $r.L; y = $r.T; w = ($r.R - $r.L); h = ($r.B - $r.T) } }
function Mons { @([RnDock]::Monitors() | ForEach-Object { @{ id = $_.Id; primary = $_.Primary; b = (Rc $_.B); wa = (Rc $_.Wa); dpi = [int]$_.Dpi } }) }
function WinInfo($w) { @{ h = $w.H; pid = [int]$w.Pid; proc = $w.Proc; cls = $w.Cls; title = $w.Title; r = (Rc $w.R); ic = $w.Ic; zm = $w.Zm } }
function Exp($p) { [Environment]::ExpandEnvironmentVariables("$p") }
function Q($a) { $s = "$a"; if ($s -match '[\s"]') { '"' + (($s -replace '"', '\"') -replace '(\\+)$', '$1$1') + '"' } else { $s } } # (0.1.5) \로 끝나는 경로는 끝 \를 두 번 — 아니면 \"가 닫는 따옴표를 먹어 경로가 깨져 탐색기가 '홈'을 엶
# (0.1.5) 목록 칸 — 비었거나 없는 칸은 빈 목록(PowerShell은 @($null).Count가 1이라, 0.1.3은 탭이 없는 모든 단계에서도 '탭 더하기'를 돌려 빈 경로로 Ctrl+T·탐색기 '홈' 창을 거듭 열었음)
function Arr($v) { ,@(@($v) | Where-Object { $null -ne $_ -and "$_" -ne '' }) }
# (0.1.5) 폴더 경로 — 환경 변수(%USERPROFILE%·%OneDrive% 등) 펼치고 끝 \ 정리(드라이브 뿌리 D:\는 그대로)
function FolderPath($p) { $e = (Exp "$p").Trim().Trim('"'); if ($e -match '^[A-Za-z]:\\?$') { return $e.Substring(0, 2) + '\' }; return $e.TrimEnd('\') }
# (0.1.5) 탐색기 창 → 지금 보는 폴더(Shell.Application) — 폴더 단계는 경로가 같은 창만 집음(제목 '홈'·'바탕 화면'처럼 이름이 달라도)
function ShellMap { $mp = @{}; try { foreach ($sw in @((New-Object -ComObject Shell.Application).Windows())) { try { $sp0 = "$($sw.Document.Folder.Self.Path)"; $sh0 = [int64]$sw.HWND; if ($sp0) { if (-not $mp.ContainsKey($sh0)) { $mp[$sh0] = New-Object System.Collections.ArrayList }; [void]$mp[$sh0].Add($sp0.TrimEnd('\').ToLower()) } } catch {} } } catch {}; return $mp }
function IconOf($p) { try { Add-Type -AssemblyName System.Drawing; $ic = [System.Drawing.Icon]::ExtractAssociatedIcon($p); if (-not $ic) { return $null }; $bm = $ic.ToBitmap(); $ms = New-Object IO.MemoryStream; $bm.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $b = [Convert]::ToBase64String($ms.ToArray()); $bm.Dispose(); $ic.Dispose(); return $b } catch { return $null } }
$script:sh = $null; function Shell { if (-not $script:sh) { $script:sh = New-Object -ComObject WScript.Shell }; $script:sh }
function LnkTarget($p) { try { $l = (Shell).CreateShortcut($p); return @{ target = $l.TargetPath; args = $l.Arguments; dir = $l.WorkingDirectory } } catch { return $null } }
function WinBuild { try { return [int](Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -ErrorAction Stop).CurrentBuild } catch { return 0 } }
$script:menu = $null
function MenuLinks { if ($null -eq $script:menu) { $script:menu = @(); foreach ($d in @((Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'), [Environment]::GetFolderPath('Desktop'), (Join-Path $env:PUBLIC 'Desktop'))) { if ($d -and (Test-Path -LiteralPath $d)) { $script:menu += @(Get-ChildItem -LiteralPath $d -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue) } } }; $script:menu }
function FindExe($h) {
  if ($h.exe) { foreach ($root in @('HKCU:', 'HKLM:', 'HKLM:\SOFTWARE\WOW6432Node')) { $k = "$root\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$($h.exe)"; if ($root -like '*WOW6432Node') { $k = "$root\Microsoft\Windows\CurrentVersion\App Paths\$($h.exe)" }
      try { $v = (Get-ItemProperty -LiteralPath $k -ErrorAction Stop).'(default)'; if ($v) { $v = (Exp $v).Trim('"'); if (Test-Path -LiteralPath $v) { return $v } } } catch {} } }
  foreach ($p in @($h.paths)) { if ($p) { $e = Exp $p; if (Test-Path -LiteralPath $e) { return $e } } }
  foreach ($g in @($h.glob)) { if ($g) { $hit = @(Get-ChildItem -Path (Exp $g) -ErrorAction SilentlyContinue | Sort-Object FullName -Descending); if ($hit.Count) { return $hit[0].FullName } } }
  if ($h.exe) { foreach ($u in @($h.uninst)) { if ($u) { foreach ($ukey in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
      try { foreach ($sub in @(Get-ChildItem -LiteralPath $ukey -ErrorAction Stop)) { $pp = Get-ItemProperty -LiteralPath $sub.PSPath -ErrorAction SilentlyContinue
          if ($pp -and "$($pp.DisplayName)" -like "$u*") { $cands = @((("$($pp.DisplayIcon)" -replace ',\s*-?\d+$', '').Trim('"')), $(if ($pp.InstallLocation) { Join-Path ("$($pp.InstallLocation)".Trim('"')) $h.exe } else { '' }))
            foreach ($cand in $cands) { if ($cand -and ((Split-Path $cand -Leaf) -ieq $h.exe) -and (Test-Path -LiteralPath $cand)) { return $cand } } } } } catch {} } } } }
  foreach ($n in @($h.lnk)) { if ($n) { foreach ($f in (MenuLinks)) { if ($f.BaseName -like "$n*") { $t = LnkTarget $f.FullName; if ($t -and $t.target -and $t.target -like '*.exe' -and (Test-Path -LiteralPath $t.target)) { if (-not $h.exe -or ((Split-Path $t.target -Leaf) -ieq $h.exe)) { return $t.target } } } } } }
  return $null }

# (0.1.7 · 정범님 11/14 16:29 「카카오톡은 열리지도 않아」 — 진단 skip '실행 파일을 못 찾음') 실행 파일 '증거' 모으기 — 고르기는 apps.js pickExe(차례: 떠 있는 프로세스 → 바로 가기 → 레지스트리 → 흔한 자리 → 시작 메뉴 앱)
#  돌려줌 @{ c = [ @{ s 출처; p 경로; ok 파일 있음; n 이름 } ]; look = @{ proc 프로세스 이름; lnk 본 바로 가기 수; reg 본 레지스트리 칸 수; common 본 자리 수; start 본 앱 수 } }
$script:lnkAll = $null
function LnkAll { if ($null -eq $script:lnkAll) { $script:lnkAll = New-Object System.Collections.ArrayList
    $dirs = @((Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'), [Environment]::GetFolderPath('Desktop'), (Join-Path $env:PUBLIC 'Desktop'), (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'))
    foreach ($ld in $dirs) { if ($ld -and (Test-Path -LiteralPath $ld)) { foreach ($lf in @(Get-ChildItem -LiteralPath $ld -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 800)) { $lt = LnkTarget $lf.FullName; if ($lt -and $lt.target) { [void]$script:lnkAll.Add(@{ n = $lf.BaseName; t = "$($lt.target)" }) } } } } }
  return $script:lnkAll }
$script:unAll = $null
function UnAll { if ($null -eq $script:unAll) { $script:unAll = New-Object System.Collections.ArrayList
    foreach ($ukey in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
      try { foreach ($sub in @(Get-ChildItem -LiteralPath $ukey -ErrorAction Stop)) { $pp = Get-ItemProperty -LiteralPath $sub.PSPath -ErrorAction SilentlyContinue
          if ($pp -and $pp.DisplayName) { [void]$script:unAll.Add(@{ n = "$($pp.DisplayName)"; icon = "$($pp.DisplayIcon)"; loc = "$($pp.InstallLocation)"; un = "$($pp.UninstallString)" }) } } } catch {} } }
  return $script:unAll }
$script:startAll = $null
function StartAll { if ($null -eq $script:startAll) { $script:startAll = @(); try { $script:startAll = @(Get-StartApps -ErrorAction Stop | ForEach-Object { @{ n = "$($_.Name)"; id = "$($_.AppID)" } }) } catch {} }; return $script:startAll }
# 시작 메뉴 앱 AppID의 알려진 폴더 번호 → 실제 폴더(데스크톱 앱은 AppID가 '{번호}\Kakao\KakaoTalk\KakaoTalk.exe' 꼴)
$script:kf = @{ '{6D809377-6AF0-444B-8957-A3773F02200E}' = $env:ProgramW6432; '{7C5A40EF-A0FB-4BFC-874A-C0F2E0B9FA8E}' = ${env:ProgramFiles(x86)}; '{F38BF404-1D43-42F2-9305-67DE0B28FC23}' = $env:windir; '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}' = (Join-Path $env:windir 'System32') }
function FindEv($h) { $cl = New-Object System.Collections.ArrayList; $seenP = @{}; $look = @{ proc = ''; lnk = 0; reg = 0; common = 0; start = 0 }
  $exeN = "$($h.exe)" -replace "['""]", ''; $baseN = $(if ($exeN) { [IO.Path]::GetFileNameWithoutExtension($exeN) } else { '' })
  function Add1($src, $pth, $nm) { $pth = "$pth".Trim().Trim('"'); if (-not $pth) { return }; $kk = "$src|$($pth.ToLower())"; if ($seenP.ContainsKey($kk)) { return }; $seenP[$kk] = 1
    $okF = $false; if ($pth -like 'shell:*') { $okF = $true } else { try { $okF = [bool](Test-Path -LiteralPath $pth -PathType Leaf) } catch {} }
    [void]$cl.Add(@{ s = $src; p = $pth; ok = $okF; n = "$nm" }) }
  # ① 지금 떠 있는 프로세스(같은 사용자 · 관리자 권한 프로세스는 경로가 안 보일 수 있어 CIM도)
  if ($baseN) { $look.proc = $baseN
    try { foreach ($pr in @(Get-Process -Name $baseN -ErrorAction SilentlyContinue)) { $pp0 = $null; try { $pp0 = $pr.Path } catch {}; if ($pp0) { Add1 'proc' $pp0 '' } } } catch {}
    try { foreach ($wp in @(Get-CimInstance Win32_Process -Filter "Name='$exeN'" -ErrorAction Stop)) { if ($wp.ExecutablePath) { Add1 'proc' "$($wp.ExecutablePath)" '' } } } catch {} }
  # ② 시작 메뉴·바탕 화면·작업 표시줄 바로 가기 — 이름이 맞거나 대상 파일 이름이 맞는 것
  $lks = @(LnkAll); $look.lnk = $lks.Count
  foreach ($lk in $lks) { $nmHit = $false; foreach ($ln in @($h.lnk)) { if ($ln -and $lk.n -like "$ln*") { $nmHit = $true } }
    $leafHit = $exeN -and ((Split-Path $lk.t -Leaf) -ieq $exeN); if (($nmHit -and $lk.t -like '*.exe') -or $leafHit) { Add1 'lnk' (Exp $lk.t) $lk.n } }
  # ③ 레지스트리 — App Paths(등록된 실행 파일) · 설치 정보(Uninstall: DisplayIcon · InstallLocation · UninstallString 폴더)
  if ($exeN) { foreach ($root in @('HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths')) { $look.reg = $look.reg + 1
      try { $ap = Get-ItemProperty -LiteralPath "$root\$exeN" -ErrorAction Stop; $v0 = $ap.'(default)'; if ($v0) { Add1 'reg' (Exp $v0) 'App Paths' }; if ($ap.Path) { Add1 'reg' (Join-Path (Exp "$($ap.Path)".Trim('"')) $exeN) 'App Paths' } } catch {} } }
  $uns = @(UnAll); $look.reg = $look.reg + $uns.Count
  foreach ($un in $uns) { $icn = ("$($un.icon)" -replace ',\s*-?\d+$', '').Trim().Trim('"'); $nmHit = $false; foreach ($u in @($h.uninst)) { if ($u -and $un.n -like "$u*") { $nmHit = $true } }
    if (-not $nmHit -and -not ($exeN -and $icn -and ((Split-Path $icn -Leaf) -ieq $exeN))) { continue }
    $unp = ''; if ("$($un.un)" -match '^\s*"([^"]+)"') { $unp = $Matches[1] } elseif ("$($un.un)" -match '^\s*(\S+\.exe)') { $unp = $Matches[1] }
    if ($icn) { Add1 'reg' (Exp $icn) $un.n; if ($exeN) { Add1 'reg' (Join-Path (Split-Path (Exp $icn)) $exeN) $un.n } }
    if ($exeN -and $un.loc) { Add1 'reg' (Join-Path (Exp "$($un.loc)".Trim().Trim('"')) $exeN) $un.n }
    if ($exeN -and $unp) { Add1 'reg' (Join-Path (Split-Path (Exp $unp)) $exeN) $un.n } }
  # ④ 흔한 자리 — 정해 둔 경로 · 글롭 · 드라이브마다 Program Files·Program Files (x86)·뿌리 아래
  foreach ($p0 in @($h.paths)) { if ($p0) { $look.common = $look.common + 1; Add1 'common' (Exp $p0) '' } }
  foreach ($g0 in @($h.glob)) { if ($g0) { $look.common = $look.common + 1; foreach ($gh in @(Get-ChildItem -Path (Exp $g0) -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 3)) { Add1 'common' $gh.FullName '' } } }
  if (@($h.drv).Count) { $roots = @(); try { $roots = @(Get-PSDrive -PSProvider FileSystem -ErrorAction Stop | Where-Object { $_.Root -match '^[A-Za-z]:\\$' } | ForEach-Object { $_.Root }) } catch {}
    foreach ($d0 in @($h.drv)) { if (-not $d0) { continue }; foreach ($rt in $roots) { foreach ($mid in @('Program Files', 'Program Files (x86)', '')) { $look.common = $look.common + 1; $cand = $(if ($mid) { Join-Path (Join-Path $rt $mid) $d0 } else { Join-Path $rt $d0 }); if (Test-Path -LiteralPath $cand -PathType Leaf) { Add1 'common' $cand '' } } } } }
  # ⑤ 시작 메뉴 앱(Get-StartApps) — 데스크톱 앱이면 실제 경로로 · 스토어 앱이면 shell:AppsFolder\<AppID>
  if (@($h.start).Count) { $sas = @(StartAll); $look.start = $sas.Count
    foreach ($sa in $sas) { $nmHit = $false; foreach ($sn in @($h.start)) { if ($sn -and $sa.n -like "$sn*") { $nmHit = $true } }; if (-not $nmHit) { continue }
      $aid = "$($sa.id)"; $real = $aid; foreach ($kfk in $script:kf.Keys) { if ($aid.StartsWith($kfk, [StringComparison]::OrdinalIgnoreCase) -and $script:kf[$kfk]) { $real = $script:kf[$kfk] + $aid.Substring($kfk.Length) } }
      if ($real -match '^[A-Za-z]:\\.*\.exe$') { Add1 'start' $real $sa.n } elseif ($aid -match '!') { Add1 'start' "shell:AppsFolder\$aid" $sa.n } } }
  return @{ c = @($cl); look = $look } }

try {
switch ($Act) {
  'screens' { $out.mons = @(Mons); $out.build = (WinBuild); Done $out }
  'windows' { $out.wins = @([RnDock]::Windows() | Select-Object -First 300 | ForEach-Object { WinInfo $_ }); $out.mons = @(Mons); Done $out }
  'find' { $ev = @{}; $ic = @{} # (0.1.7) 단서마다 증거(ev) · 아이콘은 파일이 있는 후보 경로마다(앞 3개)
    foreach ($h in @($In.hints)) { try { $e1 = FindEv $h; $ev["$($h.key)"] = $e1; $nI = 0; foreach ($cc in @($e1.c)) { if ($nI -ge 3) { break }; if ($cc.ok -and $cc.p -notlike 'shell:*' -and -not $ic.ContainsKey($cc.p)) { $i = IconOf $cc.p; if ($i) { $ic[$cc.p] = $i; $nI = $nI + 1 } } } } catch { $ev["$($h.key)"] = @{ c = @(); look = @{}; err = "$($_.Exception.Message)" } } }
    foreach ($p in @($In.icons)) { if ($p -and (Test-Path -LiteralPath $p)) { $i = IconOf $p; if ($i) { $ic[$p] = $i } } }
    $out.ev = $ev; $out.icons = $ic; Done $out }
  'lnk' { $p = "$($In.path)"; if (-not (Test-Path -LiteralPath $p)) { Fail '바로가기 파일이 없음' }
    $t = LnkTarget $p; if (-not $t -or -not $t.target) { Fail '바로가기 대상을 못 읽음' }
    $out.target = $t.target; $out.args = $t.args; $out.icon = (IconOf $t.target); Done $out }
  'exe' { $n = "$($In.name)"; $out.list = @(); if ($n) { $h = @{ exe = $n; paths = @(); glob = @("%ProgramFiles%\*\$n", "%ProgramFiles(x86)%\*\$n", "%ProgramFiles%\*\*\$n", "%ProgramFiles(x86)%\*\*\$n", "%LOCALAPPDATA%\Programs\*\$n", "%LOCALAPPDATA%\*\$n"); lnk = @() }
      $p = FindExe $h; if ($p) { $out.list = @($p); $out.icon = (IconOf $p) } }; Done $out }
  'startup' { $dir = [Environment]::GetFolderPath('Startup'); $lnk = Join-Path $dir "$($In.name).lnk"; $off = "$lnk.off"
    if ($On -eq 1) { if (Test-Path -LiteralPath $off) { Remove-Item -LiteralPath $off -Force }; $lk = (Shell).CreateShortcut($lnk); $lk.TargetPath = 'wscript.exe'; $lk.Arguments = (Q $In.vbs) + ' ' + "$($In.args)"; $lk.WorkingDirectory = (Split-Path $In.vbs); $lk.Description = '리드나우 PC 배치 — 로그온 뒤 설정대로 실행·배치'; $lk.Save() }
    elseif ($On -eq 0) { if (Test-Path -LiteralPath $lnk) { if (Test-Path -LiteralPath $off) { Remove-Item -LiteralPath $off -Force }; Rename-Item -LiteralPath $lnk -NewName (Split-Path $off -Leaf) } }
    $out.on = (Test-Path -LiteralPath $lnk); $out.path = $lnk; Done $out }
  'run' {
    $steps = @($In.steps); $wait = [Math]::Max(5, [int]$In.waitSec)
    # (0.1.5) 새 창 상한 = 단계 수 + 탭 수 + 1 · 전체 시간 상한(기다림 + 탭마다 8초 + 20초) — 넘으면 더 안 띄우고 까닭을 남김(창이 쌓이지 않게)
    $tabTotal = 0; $seqN = 0; foreach ($sp in $steps) { $tabTotal = $tabTotal + (Arr $sp.tabs).Count; if ($sp.match.seq) { $seqN = $seqN + 1 } }
    # (0.1.7) 늦게 뜨는 창(카카오톡 로그인 창·업데이트 — match.slow 초)이 있으면 그만큼 더 기다림
    foreach ($sp in $steps) { if ([int]$sp.match.slow -gt $wait) { $wait = [int]$sp.match.slow } }
    # (0.1.6) 크롬 단계는 하나씩 띄우고 새 창을 기다림(단계마다 최대 15초) — 시간 상한에 그만큼 더함
    $script:launchN = 0; $script:launchMax = $steps.Count + $tabTotal + 1; $hardSec = $wait + 8 * $tabTotal + 15 * $seqN + 20; $script:hardEnd = [DateTime]::Now.AddSeconds($hardSec); $out.limit = @{ launches = $script:launchMax; sec = $hardSec }
    # ③ '모두 닫고 설정대로' — 화면에서 미리 보여 준 창만 · WM_CLOSE(닫아 달라고 부탁만 · 저장 안 한 문서는 그 프로그램이 물음) · 강제 종료 없음
    $closed = New-Object System.Collections.ArrayList
    if (@($In.close).Count) {
      $nowWins = @{}; foreach ($cw in [RnDock]::Windows()) { $nowWins[[int64]$cw.H] = $cw }
      foreach ($ci in @($In.close)) { $item = @{ h = [int64]$ci.h; proc = "$($ci.proc)"; title = "$($ci.title)"; ok = $false; gone = $false; why = '' }
        try { $cur = $nowWins[[int64]$ci.h]
          if (-not $cur) { $item.why = '이미 닫힘' }
          elseif ([int64]$cur.Pid -ne [int64]$ci.pid -or $cur.Proc -ine "$($ci.proc)") { $item.why = '창이 바뀌어 안 닫음' }
          elseif ($cur.Proc -match '^(chrome|claude|msedgewebview2|mstsc|msrdc|node|powershell|pwsh|cmd|conhost|WindowsTerminal|spoolsv|splwow64)$' -or ($cur.Proc -ieq 'explorer' -and $cur.Cls -ne 'CabinetWClass')) { $item.why = '보호 목록이라 안 닫음' }
          else { [void][RnDock]::Close([int64]$ci.h); $item.ok = $true } } catch { $item.why = "닫기 부탁 실패: $($_.Exception.Message)" }
        [void]$closed.Add($item) }
      $endC = [DateTime]::Now.AddSeconds(6)
      while ([DateTime]::Now -lt $endC -and @($closed | Where-Object { $_.ok -and [RnDock]::Exists([int64]$_.h) }).Count) { Start-Sleep -Milliseconds 400 }
      foreach ($item in $closed) { if ($item.ok) { $item.gone = -not [RnDock]::Exists([int64]$item.h) } } }
    $out.closed = @($closed)
    $before = @{}; foreach ($bw in [RnDock]::Windows()) { $before[[int64]$bw.H] = 1 }
    $claimed = @{}; $Res = New-Object System.Collections.ArrayList
    $build = (WinBuild); $tabsOk = ($build -ge 22621); $out.build = $build  # 윈도우 11 22H2부터 탐색기 탭
    function Fits($w, $sp, $freshOnly) { $m = $sp.match
      if ($claimed.ContainsKey([int64]$w.H)) { return $false }
      if ($freshOnly -and $before.ContainsKey([int64]$w.H)) { return $false }
      if (@($m.procs).Count -and -not (@($m.procs) | Where-Object { $_ -and ($w.Proc -ieq $_) })) { return $false }
      if ($m.cls -and $w.Cls -ne $m.cls) { return $false }
      if ($m.seq -and $null -ne $m.udd -and $null -ne $w.Udd) { if ($w.Udd -ne "$($m.udd)") { return $false }; if ("$($m.udd)") { return $true } } # (0.1.6) 크롬 프로필이 다르면 그 단계 창이 아님 · 도우미 프로필이 같으면 제목이 아직 안 바뀌었어도(불러오는 중) 그 창
      if ($m.folder) { $hp = $shellNow[[int64]$w.H]; if ($hp) { return [bool](@($hp) -contains "$($m.folder)".ToLower()) }; return ($w.Title -ieq "$($m.leaf)") } # (0.1.5) 폴더 단계는 경로가 같은 창만(못 읽으면 제목이 폴더 이름과 꼭 같을 때만)
      if ($m.title -and -not ($w.Title -match $m.title)) { return $false }
      return $true }
    $shellNow = @{}
    function NewSt($sp) { @{ s = $sp; done = $false; how = ''; t0 = [DateTime]::Now; err = ''; h = [int64]0; title = ''; got = $null; tabN = 0; overN = 0; overWhy = ''; tabbed = $false; pre = @(); hintMiss = $false; hidWhy = ''; sec = 0 } }
    # (0.1.6) 크롬 프로필(--user-data-dir) — 창 주인(크롬 본 프로세스)의 명령 줄에서 · 평소 크롬은 '' · 못 읽으면 $null(그 창은 프로필로 거르지 않음)
    $script:uddMap = @{}
    function UddOf($cmdl) { if ($null -eq $cmdl) { return $null }; if ("$cmdl" -match '--user-data-dir=(?:"([^"]+)"|(\S+))') { $ud = $(if ($Matches[1]) { $Matches[1] } else { $Matches[2] }); return (Exp $ud).Trim('"').TrimEnd('\').ToLower() }; return '' }
    function UddFill($wl) { $miss = @($wl | Where-Object { $_.Proc -ieq 'chrome' -and -not $script:uddMap.ContainsKey([int64]$_.Pid) })
      if ($miss.Count) { try { foreach ($pr in @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction Stop)) { $script:uddMap[[int64]$pr.ProcessId] = (UddOf $pr.CommandLine) } } catch {}
        foreach ($w in $miss) { if (-not $script:uddMap.ContainsKey([int64]$w.Pid)) { $script:uddMap[[int64]$w.Pid] = $null } } }
      foreach ($w in $wl) { if ($w.Proc -ieq 'chrome' -and $script:uddMap.ContainsKey([int64]$w.Pid)) { $w.Udd = $script:uddMap[[int64]$w.Pid] } } }
    # (0.1.6) 크롬 단계의 창 고르기(C# PickNew) — 띄우기 바로 전 창(preK)·다른 단계가 잡은 창은 빼고 · 프로필·제목 단서 · loose = 평소 크롬 프로필 조건을 늦춤(우리 도우미 크롬은 여전히 뺌)
    function PickFor($sp, $wl, $preK, $loose) { $m = $sp.match; $ud = "$($m.udd)"; if ($null -eq $m.udd -or ($loose -and -not $ud)) { $ud = '*' }
      return [int64][RnDock]::PickNew(@($wl), [int64[]]@($preK), [int64[]]@($claimed.Keys), 'chrome', "$($m.cls)", $ud, "$($m.uddNot)", "$($m.hint)") }
    function Launch($st) { $sp = $st.s
      if ($script:launchN -ge $script:launchMax) { $st.err = "새 창 상한($($script:launchMax)개)에 닿아 더 안 띄움"; return }
      if ([DateTime]::Now -gt $script:hardEnd) { $st.err = '실행 시간 상한을 넘어 더 안 띄움'; return }
      if ($sp.match.folder) { $fp = "$($sp.match.folder)"; if (-not (Test-Path -LiteralPath $fp -PathType Container)) { $st.err = "폴더가 없음: $fp (건너뜀 — '홈'을 열지 않음)"; return } }
      $script:launchN = $script:launchN + 1
      try { if ($sp.launch.uri) { Start-Process -FilePath "$($sp.launch.uri)" }
        else { $argList = @(@($sp.launch.args) | Where-Object { $null -ne $_ } | ForEach-Object { if ($sp.launch.expand) { Q (Exp $_) } else { Q $_ } }) -join ' '
          if ($argList) { Start-Process -FilePath "$($sp.launch.file)" -ArgumentList $argList } else { Start-Process -FilePath "$($sp.launch.file)" } }
        $st.how = '켬' } catch { $st.err = "켜기 실패: $($_.Exception.Message)" } }
    # 폴더 탭 — 첫 폴더 창에 Ctrl+T → 주소창(Ctrl+L) → 경로 → Enter(창이 앞에 있을 때만 · 아니면 글자를 치지 않고 멈춤) · 안 되면 같은 칸에 창을 겹쳐 놓음
    function Tabs($st, $hv) { $st.tabbed = $true
      foreach ($tb in (Arr $st.s.tabs)) { if (-not "$($tb.path)") { continue }; if ([DateTime]::Now -gt $script:hardEnd) { $st.overWhy = '실행 시간 상한을 넘어 남은 탭은 건너뜀'; break }
        $tp = FolderPath $tb.path; if (-not (Test-Path -LiteralPath $tp -PathType Container)) { $st.overN = $st.overN + 1; $st.overWhy = "폴더가 없음: $tp (건너뜀)"; continue }
        $tl = Split-Path $tp -Leaf; if (-not $tl) { $tl = $tp }
        $why = '이 PC 윈도우에는 탐색기 탭이 없음(윈도우 11 22H2부터)'
        if ($tabsOk) { try { $why = [RnDock]::ExplorerTab([int64]$hv, $tp, $tl, 5000) } catch { $why = "탭 열기 실패: $($_.Exception.Message)" } }
        if ($why) { # 겹치기 창 — 그 경로 창만 집음 · 탭 없음(다시 탭 더하기를 돌지 않음)
          $ns = NewSt @{ app = $st.s.app; inst = $st.s.inst; name = "$($st.s.name) · $tl"; rect = $st.s.rect; reuse = $false; over = $true; launch = @{ file = 'explorer.exe'; args = @($tp) }; match = @{ procs = @('explorer'); cls = 'CabinetWClass'; title = ''; fresh = $true; folder = $tp; leaf = $tl } }
          Launch $ns; [void]$Res.Add($ns); $st.overN = $st.overN + 1; $st.overWhy = $why }
        else { $st.tabN = $st.tabN + 1 } } }
    function Put($st, $w, $how) { $r = $st.s.rect; $claimed[[int64]$w.H] = 1; $st.h = [int64]$w.H; $st.title = $w.Title
      try { $f = [RnDock]::Place([int64]$w.H, [int]$r.x, [int]$r.y, [int]$r.w, [int]$r.h); $st.got = (Rc $f); $st.done = $true; $st.how = $how } catch { $st.err = "자리 옮기기 실패: $($_.Exception.Message)"; return }
      if ((Arr $st.s.tabs).Count -and -not $st.s.over -and -not $st.tabbed) { try { Tabs $st ([int64]$w.H) } catch { $st.overWhy = "탭 일 실패: $($_.Exception.Message)" } } }
    # (0.1.6) 트레이에 숨어 떠 있는 창(카카오톡 등 · 0.1.5는 '보이는 창'만 찾아 못 찾음) — 그 프로세스의 숨은 창 중 제목이 꼭 맞는 것(창 종류 hcls 먼저 · 없으면 가장 큰 것)을 보이게 한 뒤 놓음
    function Unhid($st) { $m = $st.s.match; if (-not "$($m.hidden)") { return $false }
      $hs = @([RnDock]::Hidden("$(@($m.procs)[0])", "$($m.hidden)") | Where-Object { -not $claimed.ContainsKey([int64]$_.H) }); if (-not $hs.Count) { return $false }
      $hw = @($hs | Where-Object { "$($m.hcls)" -and $_.Cls -eq "$($m.hcls)" }) | Select-Object -First 1
      if (-not $hw) { $hw = @($hs | Sort-Object { ($_.R.R - $_.R.L) * ($_.R.B - $_.R.T) } -Descending) | Select-Object -First 1 }
      if (-not [RnDock]::Unhide([int64]$hw.H)) { $st.hidWhy = '숨은 창을 보이게 하지 못함'; return $false }
      Put $st $hw '트레이에 숨어 있던 창을 보이게 해 자리만'; return [bool]$st.done }
    # (0.1.6) 크롬 단계 — 띄운 바로 뒤 새로 생긴 창을 이 단계가 집음(다음 크롬을 띄우기 전에 · 0.1.5는 다 띄운 뒤 아무 새 크롬 창을 차례로 집어 자리가 뒤바뀜)
    #  제목 단서가 맞는 창을 먼저(4초까지 기다림 — 지나면 제목이 달라도 새 창) · 6초 지나면 평소 크롬 프로필 조건을 늦춤 · 단계마다 최대 15초
    function SeqWait($st, $preK) { $t1 = [DateTime]::Now; $lim = [Math]::Min(15, $wait); $st.pre = $preK
      while (([DateTime]::Now - $t1).TotalSeconds -lt $lim -and [DateTime]::Now -lt $script:hardEnd) { Start-Sleep -Milliseconds 300
        $wl = @([RnDock]::Windows()); UddFill $wl; $el = ([DateTime]::Now - $t1).TotalSeconds
        $hv = PickFor $st.s $wl $preK ($el -gt 6)
        if ($hv -lt 0) { if ($el -gt 4) { $hv = -$hv; $st.hintMiss = $true } else { $hv = 0 } }
        if ($hv -gt 0) { $hw = @($wl | Where-Object { [int64]$_.H -eq $hv }) | Select-Object -First 1; if ($hw) { $st.sec = [Math]::Round($el, 1); Put $st $hw "켬 → 새로 뜬 창을 자리로($($st.sec)초)"; return } } } }
    # (0.1.5) 폴더 단계 — 경로를 펼쳐 실행 인자·알아보기(경로) 둘 다에
    # (0.1.6) 도우미 크롬 프로필 경로 펼침(%USERPROFILE% → 실제 · 소문자 · 끝 \ 뺌) — 창 주인 명령 줄의 --user-data-dir과 견줌
    foreach ($sp in $steps) { if ($sp.match.seq -and "$($sp.match.udd)") { $sp.match.udd = (Exp "$($sp.match.udd)").Trim('"').TrimEnd('\').ToLower() } }
    foreach ($sp in $steps) { if ($sp.folder) { $fp = FolderPath $sp.folder; $fl = Split-Path $fp -Leaf; if (-not $fl) { $fl = $fp }; $sp.launch.args = @($fp); $sp.match | Add-Member -Force -NotePropertyName folder -NotePropertyValue $fp; $sp.match | Add-Member -Force -NotePropertyName leaf -NotePropertyValue $fl } }
    # (0.1.6 · 정범님 11/14 15:46) 먼저 닫기 — 이번에 놓을 프로그램(크롬·Claude·카카오톡·폴더 창 등)의 창을 WM_CLOSE로 닫고(부탁만 · 강제 종료 없음) 새로 띄워 칸에 놓음
    #  지킴(C# CloseWhy): 수집기·도우미 크롬(…\ReadNow\… 프로필 · 프로필을 못 읽은 창) · 제목이 수집기 창(알라딘 수집 탭·🪟 리드나우 작업 창·🖐 손발·번외·ALPS·PC 배치) · 탐색기 셸 · 목록 밖 프로그램은 손대지 않음
    $pre1Closed = New-Object System.Collections.ArrayList; $pre1Kept = New-Object System.Collections.ArrayList
    if ($In.closeFirst) { $cfProcs = [string[]]@(Arr $In.closeFirst.procs); $cfKeep = "$($In.closeFirst.keepTitle)"
      try { $cw0 = @([RnDock]::Windows()); UddFill $cw0
        foreach ($cw in $cw0) { $why0 = [RnDock]::CloseWhy($cw, $cfProcs, $cfKeep); if ($null -eq $why0) { continue }
          $tt = "$($cw.Title)"; $row = @{ proc = "$($cw.Proc)"; title = $tt.Substring(0, [Math]::Min(60, $tt.Length)) }
          if ($why0) { $row.why = $why0; [void]$pre1Kept.Add($row) } elseif ([RnDock]::Close([int64]$cw.H)) { $row.h = [int64]$cw.H; [void]$pre1Closed.Add($row) } }
        $endF = [DateTime]::Now.AddSeconds(8); while ([DateTime]::Now -lt $endF -and @($pre1Closed | Where-Object { [RnDock]::Exists([int64]$_.h) -and [RnDock]::Visible([int64]$_.h) }).Count) { Start-Sleep -Milliseconds 400 }
        foreach ($row in $pre1Closed) { $row.gone = -not ([RnDock]::Exists([int64]$row.h) -and [RnDock]::Visible([int64]$row.h)) }
      } catch { $out.closeErr = "먼저 닫기 실패: $($_.Exception.Message)" }
      if ($pre1Closed.Count) { Start-Sleep -Milliseconds 600 }
      $before = @{}; foreach ($bw in [RnDock]::Windows()) { $before[[int64]$bw.H] = 1 } }
    $out.pre = @{ closed = @($pre1Closed); kept = @($pre1Kept) }
    $shellNow = ShellMap
    # 프로그램마다 따로(try) — 하나가 실패해도 나머지는 계속
    foreach ($sp in $steps) { $st = NewSt $sp
      try { if ($sp.reuse) { $wl = @([RnDock]::Windows()); if ($sp.match.seq) { UddFill $wl }; $hit = @($wl | Where-Object { Fits $_ $sp $false }) | Select-Object -First 1; if ($hit) { Put $st $hit '이미 떠 있어 자리만 옮김' } elseif (Unhid $st) { $st.how = '트레이에 숨어 있던 창을 보이게 해 자리만' } }
        if (-not $st.done -and -not $st.err -and $sp.launch) {
          if ($sp.match.seq) { $preK = @([RnDock]::Windows() | ForEach-Object { [int64]$_.H }); Launch $st; if (-not $st.err) { SeqWait $st $preK } } # (0.1.6) 크롬은 하나씩
          else { Launch $st } }
        if (-not $st.done -and -not $st.err -and $sp.self) { $st.done = $true; $st.how = '작은 창이 지금 안 떠 있음 — 다음에 열 때 이 칸에 엶' } } catch { $st.err = "이 프로그램 일이 멈춤: $($_.Exception.Message)" } # (0.1.7) PC 배치 자기 창 — 새로 안 띄움
      [void]$Res.Add($st); Start-Sleep -Milliseconds 400 }
    $end = [DateTime]::Now.AddSeconds($wait)
    while ((@($Res | Where-Object { -not $_.done -and -not $_.err }).Count) -and [DateTime]::Now -lt $end -and [DateTime]::Now -lt $script:hardEnd) {
      Start-Sleep -Milliseconds 700; $wins = @([RnDock]::Windows()); $shellNow = ShellMap; UddFill $wins
      foreach ($st in @($Res | Where-Object { -not $_.done -and -not $_.err })) {
        try { if ($st.s.match.seq) { $hv = PickFor $st.s $wins $(if ((Arr $st.pre).Count) { $st.pre } else { @($before.Keys) }) $true; if ($hv -lt 0) { $hv = -$hv; $st.hintMiss = $true }
            if ($hv -gt 0) { $hw = @($wins | Where-Object { [int64]$_.H -eq $hv }) | Select-Object -First 1; if ($hw) { Put $st $hw '켬 → 늦게 뜬 창을 자리로' } }; continue } # (0.1.6) 크롬은 그 단계를 띄운 뒤 생긴 창만
          if ($st.s.match.hidden -and ([DateTime]::Now - $st.t0).TotalSeconds -gt 3) { $vis = @($wins | Where-Object { Fits $_ $st.s $false }) | Select-Object -First 1; if (-not $vis -and (Unhid $st)) { continue } } # (0.1.6) 켰는데도 창이 숨은 채면 보이게
          $hit = @($wins | Where-Object { Fits $_ $st.s $true }) | Select-Object -First 1
          if (-not $hit -and -not $st.s.match.fresh -and ([DateTime]::Now - $st.t0).TotalSeconds -gt 3) { $hit = @($wins | Where-Object { Fits $_ $st.s $false }) | Select-Object -First 1 }
          if ($hit) { Put $st $hit ($(if ($st.how) { "$($st.how) → 자리 옮김" } else { '자리 옮김' })) } } catch { $st.err = "이 프로그램 일이 멈춤: $($_.Exception.Message)" } } }
    # 뜬 뒤 스스로 크기를 바꾸는 프로그램(크롬·오피스)이 있어 한 번 더
    if (@($Res | Where-Object { $_.done }).Count) { Start-Sleep -Milliseconds 1500; foreach ($st in @($Res | Where-Object { $_.done -and $_.h })) { try { $r = $st.s.rect; $st.got = (Rc ([RnDock]::Place([int64]$st.h, [int]$r.x, [int]$r.y, [int]$r.w, [int]$r.h))) } catch {} } }
    $out.res = @($Res | ForEach-Object { $howTxt = $(if ($_.done) { $_.how } elseif ($_.err) { $_.err } else { "창을 못 찾음($($wait)초)" })
      if ($_.done -and $_.tabN) { $howTxt = "$howTxt · 탭 $($_.tabN)개 더함" }
      if ($_.overN) { $howTxt = "$howTxt · 탭 $($_.overN)개는 탭 대신 같은 칸에 창을 겹쳐 놓음($($_.overWhy))" }
      if ($_.s.over -and $_.done) { $howTxt = "$howTxt (탭 대신 겹쳐 놓음)" }
      if (-not $_.done -and $_.hidWhy) { $howTxt = "$howTxt · $($_.hidWhy)" }
      if ($_.done -and $_.hintMiss) { $howTxt = "$howTxt (제목이 주소와 달라 새로 뜬 창으로 놓음)" }
      @{ app = $_.s.app; inst = $_.s.inst; name = $_.s.name; ok = [bool]$_.done; how = $howTxt; title = $_.title; want = $_.s.rect; got = $_.got; helper = $_.s.helper; tabs = $_.tabN; over = $_.overN; sec = $_.sec; miss = [bool]$_.hintMiss } })
    Done $out }
  { $_ -eq 'cleanscan' -or $_ -eq 'cleanrun' } {
    $prot = @(@($In.protect) | ForEach-Object { (Exp $_).TrimEnd('\') } | Where-Object { $_ }); $mark = "$($In.mark)"
    function Prot($p) { foreach ($x in $prot) { if ($p.Equals($x, [StringComparison]::OrdinalIgnoreCase) -or $p.StartsWith($x + '\', [StringComparison]::OrdinalIgnoreCase)) { return $true } }; if ($mark -and $p -match $mark) { return $true }; return $false }
    function Files($t) { $acc = New-Object System.Collections.Generic.List[IO.FileInfo]; $cut = [DateTime]::Now.AddDays(-[double]$t.ageDays); $pat = $(if ($t.pat) { "$($t.pat)" } else { '*' })
      $q = New-Object System.Collections.Queue; foreach ($r in @($t.roots)) { $e = (Exp $r).TrimEnd('\'); if ($e -and (Test-Path -LiteralPath $e) -and -not (Prot $e)) { $q.Enqueue(@($e, 0)) } }
      while ($q.Count -and $acc.Count -lt 200000) { $it = $q.Dequeue(); $d = New-Object IO.DirectoryInfo $it[0]
        try { foreach ($f in $d.EnumerateFiles($pat)) { if (($f.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0 -and $f.LastWriteTime -lt $cut -and -not (Prot $f.FullName)) { $acc.Add($f) } } } catch {}
        if ($it[1] -lt [int]$t.depth) { try { foreach ($s in $d.EnumerateDirectories()) { if (($s.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0 -and -not (Prot $s.FullName)) { $q.Enqueue(@($s.FullName, $it[1] + 1)) } } } catch {} } }
      return ,$acc }
    $tg = @($In.targets | Where-Object { -not $_.kind })
    if ($Act -eq 'cleanscan') {
      $out.targets = @($tg | ForEach-Object { $fl = Files $_; $b = 0; foreach ($f in $fl) { $b += $f.Length }; @{ id = $_.id; files = $fl.Count; bytes = $b; sample = @($fl | Select-Object -First 4 | ForEach-Object { $_.FullName }) } })
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
  'stopold' { # (0.1.3) 새 판이 켜질 때 옛 판 서버(같은 readnow-pcdock.js를 돌리는 다른 node)만 끔 — 자기 자신은 빼고 · 다른 Node 도우미(인쇄·번외)는 명령 줄이 달라 안 건드림
    $me = [int]$In.self; $n = 0; foreach ($w in @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object { "$($_.CommandLine)" -like '*readnow-pcdock.js*' -and [int]$_.ProcessId -ne $me })) { try { Stop-Process -Id ([int]$w.ProcessId) -Force -ErrorAction Stop; $n++ } catch {} }
    $out.stopped = $n; Done $out }
  'front' { # (0.1.4) 이 도우미 창(제목이 꼭 같은 크롬 창)이 떠 있으면 앞으로 — 어느 모니터에도 안 걸쳐 있으면(화면 밖) 주 모니터 오른쪽 위로 옮긴 뒤 · 없으면 found=false(새로 띄움)
    $hit = @([RnDock]::Windows() | Where-Object { $_.Proc -ieq 'chrome' -and $_.Title -eq "$($In.title)" }) | Select-Object -First 1
    if (-not $hit) { $out.found = $false; Done $out }
    $out.found = $true; $out.moved = $false; $monList = @(Mons)
    if (-not $hit.Ic) { $cx = ($hit.R.L + $hit.R.R) / 2; $cy = ($hit.R.T + $hit.R.B) / 2; $m = @($monList | Where-Object { $cx -ge $_.b.x -and $cx -lt ($_.b.x + $_.b.w) -and $cy -ge $_.b.y -and $cy -lt ($_.b.y + $_.b.h) }) | Select-Object -First 1
      if (-not $m) { $m = @($monList | Where-Object { $_.primary }) | Select-Object -First 1; if (-not $m) { $m = $monList[0] }
        if ($m) { $k = $m.dpi / 96.0; $w = [Math]::Min([int]($In.w * $k), $m.wa.w); $h = [Math]::Min([int]($In.h * $k), $m.wa.h); [void][RnDock]::Place([int64]$hit.H, ($m.wa.x + $m.wa.w - $w), $m.wa.y, $w, $h); $out.moved = $true } } }
    $out.front = [RnDock]::Front([int64]$hit.H); Done $out }
  'fit' { # 이 도우미 창(제목으로 찾음)을 그 창이 있는 모니터 가운데에 w×h(배율 적용 전 크기)로 · (0.1.7) rect가 오면 그 자리(①에서 「리드나우 PC 배치」를 놓은 칸 · 실제 화소)로
    $hit = @([RnDock]::Windows() | Where-Object { $_.Title -like "*$($In.title)*" -and $_.Proc -ieq 'chrome' }) | Select-Object -First 1; if (-not $hit) { Fail '창을 못 찾음' }
    if ($In.rect) { $out.got = (Rc ([RnDock]::Place([int64]$hit.H, [int]$In.rect.x, [int]$In.rect.y, [int]$In.rect.w, [int]$In.rect.h))); $out.self = $true; Done $out }
    $cx = ($hit.R.L + $hit.R.R) / 2; $cy = ($hit.R.T + $hit.R.B) / 2; $monList = @(Mons); $m = @($monList | Where-Object { $cx -ge $_.b.x -and $cx -lt ($_.b.x + $_.b.w) -and $cy -ge $_.b.y -and $cy -lt ($_.b.y + $_.b.h) }) | Select-Object -First 1; if (-not $m) { $m = @($monList | Where-Object { $_.primary }) | Select-Object -First 1 }; if (-not $m) { $m = $monList[0] }
    $k = $m.dpi / 96.0; $w = [Math]::Min([int]($In.w * $k), $m.wa.w); $h = [Math]::Min([int]($In.h * $k), $m.wa.h)
    $x = $(if ($In.corner -eq 'tr') { $m.wa.x + $m.wa.w - $w } else { $m.wa.x + [int](($m.wa.w - $w) / 2) }); $y = $(if ($In.corner -eq 'tr') { $m.wa.y } else { $m.wa.y + [int](($m.wa.h - $h) / 2) })
    $out.got = (Rc ([RnDock]::Place([int64]$hit.H, $x, $y, $w, $h))); Done $out }
  default { Fail "모르는 일: $Act" }
}
} catch { Fail $_.Exception.Message }
