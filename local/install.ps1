# 리드나우 로컬 도우미 설치 — 자동 수집 담당 PC(공개 전용 PC)에서 한 번
# PowerShell에 아래 한 줄을 붙여 넣고 Enter:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install.ps1 | iex
# 하는 일: ① Node.js 확인(없으면 설치) ② D:\ReadNow\local 에 도우미 받기 ③ 로그온하면 저절로 켜짐(꺼지면 5초 뒤 다시)
#          ④ '리드나우 공개 수집' 전용 크롬 — 이 크롬만 도우미를 거침(알라딘은 테더링으로만, 우리 서비스는 와이파이로 · 도우미가 꺼지면 이 크롬은 아무 데도 못 나감)
#             따로 된 프로필(알라딘 로그인 기록 없음)·사진 끔·WebRTC 새는 길 막음 · 바탕화면·시작 프로그램에
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
if (-not $running) { Start-Process wscript.exe -ArgumentList "`"$vbs`"" }
Start-Sleep -Seconds 3
try { $s = Invoke-RestMethod -Uri 'http://127.0.0.1:8899/status' -TimeoutSec 5; Ok "도우미 켜짐 (판 $($s.ver)) — 테더링: $(if ($s.tether.ok) { '확인됨 ' + $s.tether.ip } else { '막아 둠 — ' + $s.tether.why })" } catch { Warn '도우미 응답을 아직 못 받음 — 몇 초 뒤 http://127.0.0.1:8899 를 열어 보세요' }

# 4-2) 전용 크롬 '리드나우 공개 수집'
Say "전용 크롬 바로가기"
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { Warn '크롬을 못 찾음 — 크롬을 설치한 뒤 이 줄을 다시 실행해 주세요' } else {
  $cargs = "--user-data-dir=`"$Root\chrome-pub`" --proxy-server=`"http://127.0.0.1:8899`" --force-webrtc-ip-handling-policy=disable_non_proxied_udp --blink-settings=imagesEnabled=false --no-first-run --no-default-browser-check http://127.0.0.1:8899/start"
  $pcmd = Join-Path $Root 'local\start-pub.cmd'
  [IO.File]::WriteAllText($pcmd, "@echo off`r`n:w`r`ncurl -s -o nul http://127.0.0.1:8899/status || (timeout /t 3 /nobreak >nul & goto w)`r`nstart `"`" `"$chrome`" $cargs`r`n")
  foreach ($where in @([Environment]::GetFolderPath('Desktop'), $startup)) {
    $l = $sh.CreateShortcut((Join-Path $where '리드나우 공개 수집.lnk')); $l.TargetPath = $pcmd; $l.WorkingDirectory = (Join-Path $Root 'local'); $l.IconLocation = "$chrome,0"; $l.WindowStyle = 7; $l.Save() }
  Ok "바탕화면·시작 프로그램에 '리드나우 공개 수집' — 따로 된 크롬(프로필 $Root\chrome-pub · 사진 끔 · WebRTC UDP 막음)"
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
