# 리드나우 로컬 도우미 설치 — 자동 수집 담당 PC(공개 전용 PC)에서 한 번
# PowerShell에 아래 한 줄을 붙여 넣고 Enter:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install.ps1 | iex
# 하는 일: ① Node.js 확인(없으면 설치) ② D:\ReadNow\local 에 도우미 받기 ③ 로그온하면 저절로 켜짐(꺼지면 5초 뒤 다시)
#          ④ '리드나우 공개 수집' 전용 크롬 — 이 크롬만 도우미를 거침(알라딘은 테더링으로만, 우리 서비스는 와이파이로 · 도우미가 꺼지면 이 크롬은 아무 데도 못 나감)
#             따로 된 프로필(알라딘 로그인 기록 없음)·WebRTC 새는 길 막음 · 바탕화면·시작 프로그램에
#          ⑤ 절전 끔(24시간)
#          이 PC의 기본 크롬·엣지는 건드리지 않음(기본 크롬에 알라딘 로그인이 남아 있어도 테더링과 이어지지 않게) · 다시 실행해도 됨(덮어씀) · 되돌리기: uninstall.ps1
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local'
function Say($m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠ $m" -ForegroundColor Yellow }

# 1) 자리
$Root = if (Test-Path 'D:\') { 'D:\ReadNow' } else { Join-Path $env:USERPROFILE 'ReadNow' }
foreach ($d in @('local', 'net', 'logs', 'backup', 'chrome-pub')) { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }
Say "설치 자리: $Root"; Ok '폴더 local · net(사용량) · logs · backup(웹앱 백업 받을 곳) · chrome-pub(전용 크롬 프로필)'

# 2) Node.js
Say 'Node.js 확인'
$node = $null
foreach ($p in @("$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe")) { if (Test-Path $p) { $node = $p; break } }
if (-not $node) { $c = Get-Command node -ErrorAction SilentlyContinue; if ($c) { $node = $c.Source } }
if (-not $node) {
  Warn 'Node.js가 없어 설치합니다 (winget · 창이 뜨면 허용)'
  winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Host
  foreach ($p in @("$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe")) { if (Test-Path $p) { $node = $p; break } }
  if (-not $node) { throw 'Node.js 설치를 확인하지 못했습니다. https://nodejs.org 에서 LTS를 설치한 뒤 이 줄을 다시 실행해 주세요.' }
}
$ver = & $node -v; Ok "Node.js $ver ($node)"

# 3) 도우미 받기 (+ 문법 검사)
Say '도우미 받기'
$js = Join-Path $Root 'local\readnow-local.js'; $tmp = (Join-Path $Root 'local\readnow-local.dl.js')
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-local.js" -OutFile $tmp
& $node --check $tmp; if ($LASTEXITCODE -ne 0) { throw '받은 도우미 파일 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmp $js
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/uninstall.ps1" -OutFile (Join-Path $Root 'local\uninstall.ps1')
$cfg = Join-Path $Root 'local\readnow-local.json'
if (-not (Test-Path $cfg)) { [IO.File]::WriteAllText($cfg, '{ "capGB": 48, "tetherIface": "", "wifiIface": "", "extraWifiHosts": [] }') }
Ok "readnow-local.js · 설정 readnow-local.json (테더링 한 달 상한 48GB)"

# 4) 실행기(꺼지면 5초 뒤 다시) + 로그온 때 저절로
$cmd = Join-Path $Root 'local\run-local.cmd'
[IO.File]::WriteAllText($cmd, "@echo off`r`ncd /d `"%~dp0`"`r`n:loop`r`n`"$node`" readnow-local.js >> `"..\logs\console.log`" 2>&1`r`ntimeout /t 5 /nobreak >nul`r`ngoto loop`r`n")
$vbs = Join-Path $Root 'local\run-local.vbs'
[IO.File]::WriteAllText($vbs, "CreateObject(`"WScript.Shell`").Run `"`"`"$cmd`"`"`", 0, False`r`n")
$startup = [Environment]::GetFolderPath('Startup'); $sh = New-Object -ComObject WScript.Shell
$lk = $sh.CreateShortcut((Join-Path $startup 'ReadNow-Local.lnk')); $lk.TargetPath = 'wscript.exe'; $lk.Arguments = "`"$vbs`""; $lk.WorkingDirectory = (Join-Path $Root 'local'); $lk.Save()
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-local.js*' }
if ($running) { $running | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Ok '켜져 있던 도우미를 끔 — 5초 뒤 새 판으로 다시 켜짐'; Start-Sleep -Seconds 7 } else { Start-Process wscript.exe -ArgumentList "`"$vbs`"" } <# (1.3.1) 예전엔 켜져 있으면 그대로 둬 새로 받은 판이 바로 안 쓰였음 #>
Start-Sleep -Seconds 3
try { $s = Invoke-RestMethod -Uri 'http://127.0.0.1:8899/status' -TimeoutSec 5; Ok "도우미 켜짐 (판 $($s.ver)) — 테더링: $(if ($s.tether.ok) { '확인됨 ' + $s.tether.ip } else { '막아 둠 — ' + $s.tether.why })" } catch { Warn '도우미 응답을 아직 못 받음 — 몇 초 뒤 http://127.0.0.1:8899 를 열어 보세요' }

# 4-2) 전용 크롬 '리드나우 공개 수집'
Say "전용 크롬 바로가기"
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { Warn '크롬을 못 찾음 — 크롬을 설치한 뒤 이 줄을 다시 실행해 주세요' } else {
  $cargs = "--user-data-dir=`"$Root\chrome-pub`" --proxy-server=`"http://127.0.0.1:8899`" --force-webrtc-ip-handling-policy=disable_non_proxied_udp --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --no-first-run --no-default-browser-check http://127.0.0.1:8899/start"
  $pcmd = Join-Path $Root 'local\start-pub.cmd'
  [IO.File]::WriteAllText($pcmd, "@echo off`r`n:w`r`ncurl -s -o nul http://127.0.0.1:8899/status || (timeout /t 3 /nobreak >nul & goto w)`r`nstart `"`" `"$chrome`" $cargs`r`n")
  foreach ($where in @([Environment]::GetFolderPath('Desktop'), $startup)) {
    $l = $sh.CreateShortcut((Join-Path $where '리드나우 공개 수집.lnk')); $l.TargetPath = $pcmd; $l.WorkingDirectory = (Join-Path $Root 'local'); $l.IconLocation = "$chrome,0"; $l.WindowStyle = 3; $l.Save() }
  Ok "바탕화면·시작 프로그램에 '리드나우 공개 수집' — 따로 된 크롬(프로필 $Root\chrome-pub · WebRTC UDP 막음 · 가려져도 늦추지 않음)"
}

# 4-3) (도우미 1.3.0) 🛡 이 PC 잠금 — 관리자 권한일 때만
#  ① 윈도우 기본 길을 와이파이로: 테더링 연결의 우선순위를 뒤로(InterfaceMetric 9000) — 도우미를 거치지 않는 프로그램(윈도우 업데이트·드롭박스 등)이 테더링 데이터를 쓰지 않게
#     휴대폰을 다시 꽂거나 다른 USB 구멍에 꽂아 연결 이름이 바뀌어도 1분마다 다시 맞추는 예약 작업 'ReadNow-TetherMetric'(SYSTEM)
#  ② 이 PC의 다른 브라우저·프로그램이 알라딘에 아예 닿지 못하게 hosts에 알라딘 주소를 0.0.0.0으로 — 공개 수집 크롬은 도우미가 따로 주소를 찾아(hosts를 보지 않음) 테더링으로만 나감
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Say '이 PC 잠금(테더링을 기본 길에서 빼기 · 다른 프로그램은 알라딘 못 감)'
if (-not $isAdmin) { Warn '관리자 권한이 아니라 건너뜀 — 시작 단추 오른쪽 클릭 → "터미널(관리자)"에서 맨 위 한 줄을 한 번 더 실행해 주세요' } else {
  $ms = Join-Path $Root 'local\tether-metric.ps1'
  [IO.File]::WriteAllText($ms, @"
`$f = '$Root\local\tether-iface.txt'
`$names = @(); if (Test-Path `$f) { `$n = (Get-Content `$f -Raw).Trim(); if (`$n) { `$names += `$n } }
Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { `$_.InterfaceDescription -match 'Remote NDIS|RNDIS|Apple Mobile Device|SAMSUNG Mobile|Android' } | ForEach-Object { `$names += `$_.Name }
foreach (`$n in (`$names | Select-Object -Unique)) { Get-NetIPInterface -InterfaceAlias `$n -ErrorAction SilentlyContinue | Where-Object { `$_.InterfaceMetric -lt 9000 } | ForEach-Object { Set-NetIPInterface -InterfaceIndex `$_.ifIndex -AddressFamily `$_.AddressFamily -InterfaceMetric 9000 -ErrorAction SilentlyContinue } }
"@, (New-Object Text.UTF8Encoding $true))
  $act = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ms`""
  $t1 = New-ScheduledTaskTrigger -AtStartup; $t2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1)
  Register-ScheduledTask -TaskName 'ReadNow-TetherMetric' -Action $act -Trigger @($t1, $t2) -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ms
  Ok "예약 작업 ReadNow-TetherMetric — 테더링은 1분마다 기본 길에서 뒤로(9000)"
  $hosts = "$env:SystemRoot\System32\drivers\etc\hosts"; $mark = '# ReadNow-Lock'
  $names = @('aladin.co.kr','www.aladin.co.kr','m.aladin.co.kr','image.aladin.co.kr','ttb.aladin.co.kr','blog.aladin.co.kr','ebook.aladin.co.kr','used.aladin.co.kr','search.aladin.co.kr','api.aladin.co.kr','mapi.aladin.co.kr','event.aladin.co.kr','tv.aladin.co.kr','aladin.kr','www.aladin.kr')
  $old = Get-Content $hosts -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch [regex]::Escape($mark) }
  $new = @($old) + ($names | ForEach-Object { "0.0.0.0 $_ $mark" })
  [IO.File]::WriteAllLines($hosts, $new); ipconfig /flushdns | Out-Null
  Ok "hosts: 알라딘 주소 $($names.Count)개를 이 PC의 다른 프로그램에서 막음 (공개 수집 크롬은 도우미로 테더링만)"
  # ③ (1.4.0) 크롬 정책: 이 PC의 크롬은 알라딘 로그인·판매관리(샵매니저)·내 계정·주문·장바구니 화면을 아예 열지 못함(사람이 실수로 눌러도) — 공개 화면은 그대로
  $pk = 'HKLM:\SOFTWARE\Policies\Google\Chrome\URLBlocklist'; New-Item -Path $pk -Force | Out-Null
  $old = (Get-Item $pk).Property | Where-Object { $_ -match '^\d+$' }; $have = @(); foreach ($n in $old) { $have += (Get-ItemProperty -Path $pk -Name $n).$n }
  $blk = @('aladin.co.kr/login', 'aladin.co.kr/scm', 'aladin.co.kr/account', 'aladin.co.kr/order', 'aladin.co.kr/shop/basket', 'aladin.co.kr/shop/wbasket.aspx', 'aladin.co.kr/m/mlogin', 'aladin.co.kr/m/maccount', 'aladin.co.kr/m/mscm')
  $i = 1; foreach ($n in $old) { if ([int]$n -ge $i) { $i = [int]$n + 1 } }
  foreach ($b in $blk) { if ($have -notcontains $b) { New-ItemProperty -Path $pk -Name "$i" -Value $b -PropertyType String -Force | Out-Null; $i++ } }
  Ok "크롬 정책: 알라딘 로그인·샵매니저·내 계정·주문·장바구니 화면 막음(이 PC의 크롬 전체 · 크롬을 다시 켜면 적용 · chrome://policy 에서 확인)" 
}

# 5) 24시간 — 절전 끔
Say '절전 끔(전원 연결 시)'
powercfg /change standby-timeout-ac 0 2>$null; $e1 = $LASTEXITCODE; powercfg /change hibernate-timeout-ac 0 2>$null; $e2 = $LASTEXITCODE; powercfg /change monitor-timeout-ac 30 2>$null
if ($e1 -eq 0 -and $e2 -eq 0) { Ok '잠자기·최대 절전 끔 · 화면만 30분 뒤 끔' } else { Warn '절전 설정을 못 바꿈 — 설정 → 시스템 → 전원에서 "절전 모드: 안 함"으로 직접 바꿔 주세요' }

Write-Host ''
Write-Host '설치 끝. 다음:' -ForegroundColor Green
Write-Host "  1) 바탕화면 '리드나우 공개 수집'을 열고 → 그 크롬에 Tampermonkey 설치 · 수집기 설치 · 수집기에서 Google 로그인(알라딘 로그인은 절대 하지 않음)"
Write-Host '  2) 휴대폰을 USB로 꽂고 USB 테더링 켜기 → http://127.0.0.1:8899 에서 테더링 확인됨이 뜨는지'
Write-Host "  3) 웹앱 → 설정 → 📶 데이터 사용량에서 테더링·와이파이 사용량 확인"
Write-Host "  되돌리기: PowerShell에서  & '$Root\local\uninstall.ps1'"
