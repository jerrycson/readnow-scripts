# 리드나우 라벨 인쇄 도우미 설치 — 라벨을 뽑을 PC에서 한 번 (정범님 10/25)
# PowerShell에 아래 한 줄을 붙여 넣고 Enter:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install-print.ps1 | iex
# 하는 일: ① Node.js 확인(없으면 설치) ② %USERPROFILE%\ReadNow\print 에 인쇄 도우미(+ 📦 ALPS 자동 처리 모듈) 받기 ③ 로그온하면 저절로 켜짐(꺼지면 5초 뒤 다시 · 창 없음) ④ 이 PC의 프린터 목록 보여 줌
# 윈도우 기본 프린터·크롬·로거 도우미는 건드리지 않음 · 다시 실행해도 됨(덮어씀)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local'
function Say($m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠ $m" -ForegroundColor Yellow }

$Dir = Join-Path $env:USERPROFILE 'ReadNow\print'
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Say "설치 자리: $Dir"

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
$nv = (& $node -v) -replace '^v',''; if ([int]($nv.Split('.')[0]) -lt 22) { Warn "Node.js $nv — ALPS 자동 처리는 22 이상이 필요해 올립니다(winget)"; winget upgrade -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Host; winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Host }
Ok "Node.js $(& $node -v)"

Say '인쇄 도우미 받기'
$js = Join-Path $Dir 'readnow-print.js'; $tmp = Join-Path $Dir 'readnow-print.dl.js'
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-print.js" -OutFile $tmp
& $node --check $tmp; if ($LASTEXITCODE -ne 0) { throw '받은 파일 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmp $js
Ok 'readnow-print.js'
$ja = Join-Path $Dir 'readnow-alps.js'; $tmpa = Join-Path $Dir 'readnow-alps.dl.js'
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-alps.js" -OutFile $tmpa
& $node --check $tmpa; if ($LASTEXITCODE -ne 0) { throw '받은 ALPS 모듈 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmpa $ja
Ok 'readnow-alps.js (📦 ALPS 자동 처리 · MJ-MAIN)'

Say '로그온하면 저절로 켜지게'
$cmd = Join-Path $Dir 'run-print.cmd'
[IO.File]::WriteAllText($cmd, "@echo off`r`ncd /d `"%~dp0`"`r`n:loop`r`n`"$node`" readnow-print.js >> `"%~dp0console.log`" 2>&1`r`ntimeout /t 5 /nobreak >nul`r`ngoto loop`r`n")
$vbs = Join-Path $Dir 'run-print.vbs'
[IO.File]::WriteAllText($vbs, "CreateObject(`"WScript.Shell`").Run `"`"`"$cmd`"`"`", 0, False`r`n")
$startup = [Environment]::GetFolderPath('Startup'); $sh = New-Object -ComObject WScript.Shell
$lk = $sh.CreateShortcut((Join-Path $startup 'ReadNow-Print.lnk')); $lk.TargetPath = 'wscript.exe'; $lk.Arguments = "`"$vbs`""; $lk.WorkingDirectory = $Dir; $lk.Save()
# (정범님 11/02) 윈도우 시작 때 'ALPS 도우미' 창을 따로 열기 — 도우미가 켜질 때까지(최대 2분) 기다린 뒤 크롬 앱 창으로 http://127.0.0.1:8898/alps
$chrome = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) | Where-Object { $_ } | ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' } | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chrome) {
  $wvbs = Join-Path $Dir 'open-alps-window.vbs'
  [IO.File]::WriteAllText($wvbs, "Set h = CreateObject(`"MSXML2.ServerXMLHTTP`")`r`nFor i = 1 To 60`r`n  On Error Resume Next`r`n  h.open `"GET`", `"http://127.0.0.1:8898/status`", False`r`n  h.send`r`n  If Err.Number = 0 And h.status = 200 Then Exit For`r`n  Err.Clear`r`n  On Error GoTo 0`r`n  WScript.Sleep 2000`r`nNext`r`nCreateObject(`"WScript.Shell`").Run `"`"`"$chrome`"`" --new-window --app=http://127.0.0.1:8898/alps`", 1, False`r`n")
  $wl = $sh.CreateShortcut((Join-Path $startup 'ReadNow-ALPS-창.lnk')); $wl.TargetPath = 'wscript.exe'; $wl.Arguments = "`"$wvbs`""; $wl.WorkingDirectory = $Dir; $wl.Save()
  Ok '윈도우 시작 때 ALPS 도우미 창이 따로 열리게 함(시작 프로그램 ReadNow-ALPS-창 — 지우면 안 열림)'
} else { Warn '크롬을 못 찾아 ALPS 도우미 창 자동 열기는 건너뜀' }
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-print.js*' }
if ($running) { $running | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Ok '켜져 있던 인쇄 도우미를 끔 — 새 판으로 다시 켬' }
else { Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$vbs`"" -WindowStyle Hidden }
Start-Sleep -Seconds 6
try { $s = Invoke-RestMethod -Uri 'http://127.0.0.1:8898/status' -TimeoutSec 5; Ok "인쇄 도우미 켜짐 (판 $($s.ver))" } catch { Warn '인쇄 도우미가 아직 안 켜짐 — 10초 뒤 웹앱에서 다시 확인하세요' }

Say '이 PC의 프린터'
Get-CimInstance Win32_Printer | ForEach-Object { Write-Host ("   · " + $_.Name + $(if ($_.Default) { '   ← 윈도우 기본 프린터(그대로 둠)' } else { '' })) }
Write-Host ''
Write-Host 'ALPS 자동 처리(MJ-MAIN): 이 PC 크롬 주소창에 http://127.0.0.1:8898/alps → 아이디·비밀번호·롯데택배 프린터를 넣으세요.' -ForegroundColor Green
Write-Host '다 됐습니다. 웹앱 › 상품 등록 › 🏷 확정 후 처리 대기의 「🖨 라벨 프린터」에서 라벨 프린터를 고르세요.' -ForegroundColor Green
