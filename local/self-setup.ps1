# 리드나우 로컬 도우미 — 스스로 갖추기 (도우미 1.5.1부터 도우미가 직접 받아 한 번 실행 · 사람이 할 일 없음 · 관리자 권한 필요 없음)
# 설치(install.ps1)를 다시 실행하지 않아도, 새 판에 필요한 것을 이 PC에 맞춥니다. 다시 실행해도 같은 결과(덮어씀).
#  ① 공개 수집 크롬 시작 파일을 화면 나누기 판으로(왼쪽 = 화면 폭 − 380 · '복구' 말풍선 없이) + 지금 떠 있는 공개 수집 크롬 창도 그 자리로 옮김(다시 켜지 않음 → 하던 수집 안 끊김)
#  ② 도우미 창(오른쪽 380 폭) 시작 파일·시작 프로그램·바탕화면 바로가기
#  ③ 다시 켜지기 예약 작업 ReadNow-Ensure — 로그온·잠금 해제·절전 깨어남·5분마다 (안 되는 조건은 빼고 되는 만큼)
#  ④ USB 선택적 절전 끔 · 잠자기 끔
#  ⑤ 관리자 부분(테더링 뒤로·hosts·크롬 정책)이 이미 돼 있는지 확인만 → 결과를 setup.json에 (도우미 화면에 표시)
param([string]$Root = $(if (Test-Path 'D:\ReadNow') { 'D:\ReadNow' } else { Join-Path $env:USERPROFILE 'ReadNow' }), [string]$Ver = '')
$ErrorActionPreference = 'Continue'
$L = Join-Path $Root 'local'
$R = [ordered]@{ v = $Ver; at = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); pub = $null; moved = $null; helperWin = $null; ensure = $null; ensureWhy = $null; usb = $null; sleep = $null; tabs = $null; admin = $null; adminMiss = @() }
$utf8b = New-Object Text.UTF8Encoding $true
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$sh = New-Object -ComObject WScript.Shell
# (도우미 1.6.1) 고침: 예전 판은 바로가기 변수($l)가 PowerShell에서 대소문자 구분 없이 $L(폴더)을 덮어써 예약 작업이 'C:\WINDOWS\system32\System.__ComObject\ensure.vbs'를 가리켰음
#  → 5분마다 'Windows Script Host — 스크립트 파일을 찾을 수 없습니다' 창이 뜨고 다시 켜지기(ReadNow-Ensure)가 실제로는 한 번도 안 돎. 그 창(멈춰 있는 wscript)을 닫고 예약 작업을 바른 경로로 다시 만듦
Get-CimInstance Win32_Process -Filter "Name='wscript.exe' OR Name='cscript.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*__ComObject*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
$startup = [Environment]::GetFolderPath('Startup'); $desk = [Environment]::GetFolderPath('Desktop')

if ($chrome) {
  # ① 공개 수집 크롬 시작 파일 (install.ps1 1.5.0과 같은 내용)
  $cargs = "--user-data-dir=`"$Root\chrome-pub`" --proxy-server=`"http://127.0.0.1:8899`" --force-webrtc-ip-handling-policy=disable_non_proxied_udp --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --hide-crash-restore-bubble --no-first-run --no-default-browser-check"
  $pps = Join-Path $L 'start-pub.ps1'
  [IO.File]::WriteAllText($pps, @"
Add-Type -AssemblyName System.Windows.Forms
`$a = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
`$w = [Math]::Max(800, `$a.Width - 380)
`$pf = '$Root\chrome-pub\Default\Preferences'
if (Test-Path `$pf) { try { `$t = [IO.File]::ReadAllText(`$pf); `$n = `$t -replace '"exit_type":"Crashed"', '"exit_type":"Normal"' -replace '"exited_cleanly":false', '"exited_cleanly":true'; if (`$n -ne `$t) { [IO.File]::WriteAllText(`$pf, `$n, (New-Object Text.UTF8Encoding `$false)) } } catch {} }
Start-Process -FilePath '$chrome' -ArgumentList ('$($cargs.Replace("'", "''"))' + " --window-position=`$(`$a.X),`$(`$a.Y) --window-size=`$w,`$(`$a.Height) http://127.0.0.1:8899/start")
"@, $utf8b)
  $pcmd = Join-Path $L 'start-pub.cmd'
  [IO.File]::WriteAllText($pcmd, "@echo off`r`n:w`r`ncurl -s -o nul http://127.0.0.1:8899/status || (timeout /t 3 /nobreak >nul & goto w)`r`npowershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$pps`"`r`n")
  foreach ($where in @($desk, $startup)) { $lnk = $sh.CreateShortcut((Join-Path $where '리드나우 공개 수집.lnk')); $lnk.TargetPath = $pcmd; $lnk.WorkingDirectory = $L; $lnk.IconLocation = "$chrome,0"; $lnk.WindowStyle = 7; $lnk.Save() }
  $R.pub = 'ok'
  # ② 도우미 창
  New-Item -ItemType Directory -Force -Path (Join-Path $Root 'chrome-helper') | Out-Null
  $hps = Join-Path $L 'start-helperwin.ps1'
  [IO.File]::WriteAllText($hps, @"
Add-Type -AssemblyName System.Windows.Forms
`$a = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
`$x = `$a.X + `$a.Width - 380
Start-Process -FilePath '$chrome' -ArgumentList ("--user-data-dir=```"$Root\chrome-helper```" --app=http://127.0.0.1:8899/mini --no-first-run --no-default-browser-check --hide-crash-restore-bubble --window-position=`$x,`$(`$a.Y) --window-size=380,560")
"@, $utf8b)
  $hcmd = Join-Path $L 'start-helperwin.cmd'
  [IO.File]::WriteAllText($hcmd, "@echo off`r`n:w`r`ncurl -s -o nul http://127.0.0.1:8899/status || (timeout /t 3 /nobreak >nul & goto w)`r`npowershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$hps`"`r`n")
  foreach ($where in @($desk, $startup)) { $lnk = $sh.CreateShortcut((Join-Path $where '리드나우 도우미 창.lnk')); $lnk.TargetPath = $hcmd; $lnk.WorkingDirectory = $L; $lnk.IconLocation = "$chrome,0"; $lnk.WindowStyle = 7; $lnk.Save() }
  $R.helperWin = 'ok'
  # ① 지금 떠 있는 공개 수집 크롬 창을 왼쪽 자리로(최대화면 풀고) — 크롬을 다시 켜지 않음
  try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -Namespace RnW -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c); [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int hh, bool r);' -ErrorAction SilentlyContinue
    $a = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; $w = [Math]::Max(800, $a.Width - 380)
    $ids = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*chrome-pub*' } | ForEach-Object { $_.ProcessId })
    $n = 0; if ($ids.Count -gt 0) { foreach ($p in (Get-Process -Id $ids -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 })) { [RnW.U]::ShowWindow($p.MainWindowHandle, 9) | Out-Null; [RnW.U]::MoveWindow($p.MainWindowHandle, $a.X, $a.Y, $w, $a.Height, $true) | Out-Null; $n++ } }
    $R.moved = $n
  } catch { $R.moved = 'fail: ' + $_.Exception.Message }
} else { $R.pub = 'no-chrome' }

# ③ 다시 켜지기 예약 작업 — 되는 만큼(로그온 조건은 관리자가 아니면 거절될 수 있음 → 그때는 시작 프로그램 바로가기가 로그온을 맡음)
$ens = Join-Path $L 'ensure.ps1'; $ensv = Join-Path $L 'ensure.vbs'
[IO.File]::WriteAllText($ens, @"
`$L = '$L'
`$n = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object { `$_.CommandLine -like '*readnow-local.js*' }).Count
if (`$n -eq 0) { Start-Process wscript.exe -ArgumentList ('"' + (Join-Path `$L 'run-local.vbs') + '"'); Start-Sleep -Seconds 8 }
`$a = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue)
`$paused = `$false; try { `$s = Invoke-RestMethod -Uri 'http://127.0.0.1:8899/status' -TimeoutSec 5; if (`$s.pubWatch -and `$s.pubWatch.pauseUntil -and (`$s.pubWatch.pauseUntil -gt [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())) { `$paused = `$true } } catch {}
if (-not `$paused) {
  if (@(`$a | Where-Object { `$_.CommandLine -like '*chrome-pub*' }).Count -eq 0 -and (Test-Path (Join-Path `$L 'start-pub.cmd'))) { Start-Process cmd.exe -ArgumentList '/c', (Join-Path `$L 'start-pub.cmd') -WindowStyle Hidden }
  if (@(`$a | Where-Object { `$_.CommandLine -like '*chrome-helper*' }).Count -eq 0 -and (Test-Path (Join-Path `$L 'start-helperwin.cmd'))) { Start-Process cmd.exe -ArgumentList '/c', (Join-Path `$L 'start-helperwin.cmd') -WindowStyle Hidden }
}
"@, $utf8b)
[IO.File]::WriteAllText($ensv, "CreateObject(`"WScript.Shell`").Run `"powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"`"$ens`"`"`", 0, False`r`n")
$act = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$ensv`""
$me = "$env:USERDOMAIN\$env:USERNAME"
$tr = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$tw = $null; $tu = $null; $tl = $null
try { $cls = Get-CimClass -ClassName MSFT_TaskEventTrigger -Namespace Root/Microsoft/Windows/TaskScheduler; $tw = New-CimInstance -CimClass $cls -ClientOnly; $tw.Enabled = $true; $tw.Subscription = '<QueryList><Query Id="0" Path="System"><Select Path="System">*[System[Provider[@Name=''Microsoft-Windows-Power-Troubleshooter''] and EventID=1]]</Select></Query></QueryList>'; $tw.Delay = 'PT20S' } catch {}
try { $cls2 = Get-CimClass -ClassName MSFT_TaskSessionStateChangeTrigger -Namespace Root/Microsoft/Windows/TaskScheduler; $tu = New-CimInstance -CimClass $cls2 -ClientOnly; $tu.Enabled = $true; $tu.StateChange = 8; $tu.Delay = 'PT10S'; $tu.UserId = $me } catch {}
try { $tl = New-ScheduledTaskTrigger -AtLogOn -User $me } catch {}
$set = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
$pr = New-ScheduledTaskPrincipal -UserId $me -LogonType Interactive -RunLevel Limited
$tries = @(
  @{ name = 'full'; t = @($tl, $tr, $tw, $tu) },
  @{ name = 'wake+unlock+5min'; t = @($tr, $tw, $tu) },
  @{ name = 'wake+5min'; t = @($tr, $tw) },
  @{ name = '5min'; t = @($tr) })
foreach ($x in $tries) {
  $t = @($x.t | Where-Object { $_ }); if ($x.name -ne '5min' -and $t.Count -ne $x.t.Count) { continue }
  try { Register-ScheduledTask -TaskName 'ReadNow-Ensure' -Action $act -Trigger $t -Settings $set -Principal $pr -Force -ErrorAction Stop | Out-Null; $R.ensure = $x.name; break } catch { $R.ensureWhy = $_.Exception.Message }
}
if (-not $R.ensure) { & schtasks /Query /TN ReadNow-Ensure 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $R.ensure = '5min(schtasks)' } }

# ④ 전원: USB 선택적 절전 끔 · 잠자기·최대 절전 끔(전원 연결 시)
& powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0 2>$null; $u = $LASTEXITCODE; & powercfg /setactive SCHEME_CURRENT 2>$null
$R.usb = ($u -eq 0)
& powercfg /change standby-timeout-ac 0 2>$null; $e1 = $LASTEXITCODE; & powercfg /change hibernate-timeout-ac 0 2>$null; $e2 = $LASTEXITCODE
$R.sleep = ($e1 -eq 0 -and $e2 -eq 0)

# ④-2 (도우미 1.6.6) 크롬 '메모리 절약'이 수집기 탭을 잠재우지 않게 — 크롬 정책 TabDiscardingExceptions(사용자 정책 · 관리자 필요 없음) = '항상 활성 상태로 유지할 사이트'
#   공개 수집 크롬에만 해당되는 것이 아니라 이 Windows 사용자의 모든 크롬 프로필에 적용(쓰지 않는 크롬에도 들어가지만 해는 없음) · 크롬을 다시 켜면 적용
try {
  $tk = 'HKCU:\SOFTWARE\Policies\Google\Chrome\TabDiscardingExceptions'; New-Item -Path $tk -Force | Out-Null
  $tw = @('[*.]aladin.co.kr', 'jerrycson.github.io', '127.0.0.1', 'localhost', 'rn.local'); $th = @(); $tm = 0
  foreach ($n in (Get-Item $tk).Property) { $th += (Get-ItemProperty -Path $tk -Name $n).$n; if ($n -match '^\d+$' -and [int]$n -gt $tm) { $tm = [int]$n } }
  foreach ($w in $tw) { if ($th -notcontains $w) { $tm++; New-ItemProperty -Path $tk -Name "$tm" -Value $w -PropertyType String -Force | Out-Null } }
  $R.tabs = $true
} catch { $R.tabs = $false }

# ⑤ 관리자 부분 확인만(바꾸지 않음)
$miss = @()
$hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
if (-not (Select-String -Path $hosts -Pattern 'ReadNow-Lock' -SimpleMatch -Quiet -ErrorAction SilentlyContinue)) { $miss += 'hosts(다른 프로그램 알라딘 막기)' }
$pk = 'HKLM:\SOFTWARE\Policies\Google\Chrome\URLBlocklist'
$hv = @(); if (Test-Path $pk) { foreach ($n in (Get-Item $pk).Property) { $hv += (Get-ItemProperty -Path $pk -Name $n).$n } }
if ($hv -notcontains 'aladin.co.kr/login') { $miss += '크롬 정책(로그인·샵매니저 화면 막기)' }
& schtasks /Query /TN ReadNow-TetherMetric 2>$null | Out-Null; if ($LASTEXITCODE -ne 0) { $miss += '테더링 뒤로 예약 작업' }
$R.adminMiss = $miss; $R.admin = ($miss.Count -eq 0)
# 관리자 부분이 빠져 있으면 바탕화면에 '리드나우 관리자 설치'(두 번 클릭 → 윈도우가 '변경을 허용할까요?' → 예 → 설치 한 줄이 관리자로 돎) · 다 돼 있으면 지움
$adm = Join-Path $L 'admin-install.cmd'; $alk = Join-Path $desk '리드나우 관리자 설치.lnk'
if ($miss.Count -gt 0) {
  [IO.File]::WriteAllText($adm, "@echo off`r`npowershell -NoProfile -Command `"Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -NoExit -Command irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install.ps1 | iex'`"`r`n")
  $lnk = $sh.CreateShortcut($alk); $lnk.TargetPath = $adm; $lnk.WorkingDirectory = $L; $lnk.IconLocation = "$env:SystemRoot\System32\imageres.dll,73"; $lnk.Save()
} elseif (Test-Path $alk) { Remove-Item $alk -Force -ErrorAction SilentlyContinue }

# 예약 작업이 실제로 있는 파일을 가리키는지 확인(가리키는 파일이 없으면 ensure = $null → 도우미가 다시 실행)
try { $ta = (Get-ScheduledTask -TaskName 'ReadNow-Ensure' -ErrorAction Stop).Actions[0].Arguments.Trim('"'); $R.ensurePath = $ta; if (-not (Test-Path $ta)) { $R.ensureWhy = '예약 작업 경로에 파일 없음: ' + $ta; $R.ensure = $null } } catch {}
[IO.File]::WriteAllText((Join-Path $L 'setup.json'), ($R | ConvertTo-Json -Compress), (New-Object Text.UTF8Encoding $false))
$R | ConvertTo-Json -Compress
