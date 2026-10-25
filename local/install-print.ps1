# 리드나우 라벨 인쇄 도우미 설치 — 라벨을 뽑을 PC에서 한 번 (정범님 10/25)
# PowerShell에 아래 한 줄을 붙여 넣고 Enter:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install-print.ps1 | iex
# 하는 일: ① Node.js 확인(없으면 설치) ② %USERPROFILE%\ReadNow\print 에 인쇄 도우미 받기 ③ 로그온하면 저절로 켜짐(꺼지면 5초 뒤 다시 · 창 없음) ④ 이 PC의 프린터 목록 보여 줌
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
Ok "Node.js $(& $node -v)"

Say '인쇄 도우미 받기'
$js = Join-Path $Dir 'readnow-print.js'; $tmp = Join-Path $Dir 'readnow-print.dl.js'
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-print.js" -OutFile $tmp
& $node --check $tmp; if ($LASTEXITCODE -ne 0) { throw '받은 파일 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmp $js
Ok 'readnow-print.js'

Say '로그온하면 저절로 켜지게'
$cmd = Join-Path $Dir 'run-print.cmd'
[IO.File]::WriteAllText($cmd, "@echo off`r`ncd /d `"%~dp0`"`r`n:loop`r`n`"$node`" readnow-print.js >> `"%~dp0console.log`" 2>&1`r`ntimeout /t 5 /nobreak >nul`r`ngoto loop`r`n")
$vbs = Join-Path $Dir 'run-print.vbs'
[IO.File]::WriteAllText($vbs, "CreateObject(`"WScript.Shell`").Run `"`"`"$cmd`"`"`", 0, False`r`n")
$startup = [Environment]::GetFolderPath('Startup'); $sh = New-Object -ComObject WScript.Shell
$lk = $sh.CreateShortcut((Join-Path $startup 'ReadNow-Print.lnk')); $lk.TargetPath = 'wscript.exe'; $lk.Arguments = "`"$vbs`""; $lk.WorkingDirectory = $Dir; $lk.Save()
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-print.js*' }
if ($running) { $running | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Ok '켜져 있던 인쇄 도우미를 끔 — 새 판으로 다시 켬' }
else { Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$vbs`"" -WindowStyle Hidden }
Start-Sleep -Seconds 6
try { $s = Invoke-RestMethod -Uri 'http://127.0.0.1:8898/status' -TimeoutSec 5; Ok "인쇄 도우미 켜짐 (판 $($s.ver))" } catch { Warn '인쇄 도우미가 아직 안 켜짐 — 10초 뒤 웹앱에서 다시 확인하세요' }

Say '이 PC의 프린터'
Get-CimInstance Win32_Printer | ForEach-Object { Write-Host ("   · " + $_.Name + $(if ($_.Default) { '   ← 윈도우 기본 프린터(그대로 둠)' } else { '' })) }
Write-Host ''
Write-Host '다 됐습니다. 웹앱 › 상품 등록 › 🏷 확정 후 처리 대기의 「🖨 라벨 프린터」에서 라벨 프린터를 고르세요.' -ForegroundColor Green
