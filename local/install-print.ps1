# 리드나우 라벨 인쇄 도우미 설치 — 라벨을 뽑을 PC에서 한 번 (정범님 10/25)
# PowerShell에 아래 한 줄을 붙여 넣고 Enter:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/install-print.ps1 | iex
# 하는 일: ① Node.js 확인(없으면 설치) ② %USERPROFILE%\ReadNow\print 에 인쇄 도우미(+ 📦 ALPS 자동 처리 모듈 + 🪟 수집 작업 창 모듈) 받기 ③ 로그온하면 저절로 켜짐(꺼지면 5초 뒤 다시 · 창 없음) ④ 이 PC의 프린터 목록 보여 줌
# 윈도우 기본 프린터·크롬·로거 도우미는 건드리지 않음 · 다시 실행해도 됨(덮어씀)
# (정범님 11/05 HOME 'HOME에는 ALPS가 아니라 외부 수집기가 필요') 선택: -With col2 를 넘기면 🧪 외부 수집기(시험 · 저장소 lab/col2)도 %USERPROFILE%\ReadNow\col2\app 에 받아(node --check) 두고 켬
#   웹앱 🧭 관리도구 › 🪟 수집 작업 창 「⬇ 이 PC에 외부 수집기 깔고 켜기」가 받게 하는 .cmd가 넘김:  & ([scriptblock]::Create((irm …/install-print.ps1))) -With col2
#   켜기·로그온 때 다시 켜기는 인쇄 도우미(1.1.9 · /col2/ensure)가 따로 된 프로세스(127.0.0.1:8797)로 함 · 인자가 없으면 지금과 똑같음(외부 수집기를 받지도 켜지도 않음)
$With = ''
for ($i = 0; $i -lt $args.Count; $i++) { if ("$($args[$i])" -ieq '-With' -and $i + 1 -lt $args.Count) { $With = "$($args[$i + 1])".ToLower() } }
if (-not $With -and $env:RN_WITH) { $With = "$env:RN_WITH".ToLower() }
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local'
function Say($m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠ $m" -ForegroundColor Yellow }

$Dir = Join-Path $env:USERPROFILE 'ReadNow\print'
# (정범님 11/05 HOME) ALPS 로그인 정보(cred.dat)가 있는 PC(MJ-MAIN)만 'ALPS 쪽' — 다른 PC는 ALPS 글·창 없음
$alpsPc = Test-Path (Join-Path $env:USERPROFILE 'ReadNow\alps\cred.dat')
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Say "설치 자리: $Dir"

Say 'Node.js 확인'
# 11/05 정범님 JS-MAIN: winget이 '관리자 권한 허락' 창을 띄우고 그 창이 뒤에 숨어 설치가 멈춤 →
# 관리자 허락이 필요 없는 '휴대용 Node'(zip)를 %USERPROFILE%\ReadNow\node 에 풀어 씀(윈도우에 설치하지 않음 · 허락 창 없음)
$NodeDir = Join-Path $env:USERPROFILE 'ReadNow\node'
function NodeVer($p) { try { $v = (& $p -v) -replace '^v',''; return [int]($v.Split('.')[0]) } catch { return 0 } }
function FindNode {
  $c = @((Join-Path $NodeDir 'node.exe'), "$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe")
  $g = Get-Command node -ErrorAction SilentlyContinue; if ($g) { $c += $g.Source }
  foreach ($p in $c) { if ($p -and (Test-Path $p) -and ((NodeVer $p) -ge 22)) { return $p } }
  return $null
}
function GetPortableNode {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
  Warn "Node.js 22 이상이 없어 휴대용 Node를 받습니다(약 30MB · 관리자 허락 창 없음 · $arch)"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $idx = Invoke-RestMethod -UseBasicParsing -Uri 'https://nodejs.org/dist/index.json'
  $rel = $idx | Where-Object { $_.lts -and ([int]($_.version.TrimStart('v').Split('.')[0]) -ge 22) -and ($_.files -contains "win-$arch-zip") } | Select-Object -First 1
  if (-not $rel) { throw 'Node.js 받을 판을 찾지 못했습니다 — 잠시 뒤 다시 실행해 주세요' }
  $name = "node-$($rel.version)-win-$arch"
  $zip = Join-Path $env:TEMP "$name.zip"
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$($rel.version)/$name.zip" -OutFile $zip
  $ex = Join-Path $env:TEMP "rn-node-$([guid]::NewGuid().ToString('N'))"
  New-Item -ItemType Directory -Force -Path $ex | Out-Null
  # 윈도우 10·11에 들어 있는 tar가 zip을 빨리 풂(Expand-Archive는 파일이 많아 몇 분 걸림) · 없으면 Expand-Archive
  $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
  if (Test-Path $tar) { & $tar -xf $zip -C $ex; if ($LASTEXITCODE -ne 0) { Expand-Archive -Force -Path $zip -DestinationPath $ex } } else { Expand-Archive -Force -Path $zip -DestinationPath $ex }
  $src = Join-Path $ex $name
  if (-not (Test-Path (Join-Path $src 'node.exe'))) { throw '받은 Node.js 파일이 이상합니다 — 잠시 뒤 다시 실행해 주세요' }
  if (Test-Path $NodeDir) { try { Rename-Item -ErrorAction Stop $NodeDir ("node.old-" + (Get-Date -Format yyyyMMddHHmmss)) } catch { throw '예전 휴대용 Node 폴더를 옮기지 못했습니다(쓰는 중) — PC를 다시 켠 뒤 다시 실행해 주세요' } }
  Move-Item $src $NodeDir
  Remove-Item $zip -ErrorAction SilentlyContinue
  return (Join-Path $NodeDir 'node.exe')
}
$node = FindNode
if (-not $node) { $node = GetPortableNode }
if ((NodeVer $node) -lt 22) { throw 'Node.js 22 이상을 준비하지 못했습니다 — 잠시 뒤 다시 실행해 주세요' }
Ok "Node.js $(& $node -v)"

Say $(if ($With -eq 'col2') { '리드나우 도우미(외부 수집기 포함) 받기' } else { '인쇄 도우미 받기' })
$js = Join-Path $Dir 'readnow-print.js'; $tmp = Join-Path $Dir 'readnow-print.dl.js'
$Q = "?t=" + [DateTimeOffset]::Now.ToUnixTimeMilliseconds()  # (11/04) GitHub 캐시가 옛 판을 주지 않게
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-print.js$Q" -OutFile $tmp
& $node --check $tmp; if ($LASTEXITCODE -ne 0) { throw '받은 파일 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmp $js
Ok 'readnow-print.js'
$ja = Join-Path $Dir 'readnow-alps.js'; $tmpa = Join-Path $Dir 'readnow-alps.dl.js'
Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-alps.js$Q" -OutFile $tmpa
& $node --check $tmpa; if ($LASTEXITCODE -ne 0) { throw '받은 ALPS 모듈 검사 실패 — 잠시 뒤 다시 실행해 주세요' }
Move-Item -Force $tmpa $ja
if ($alpsPc) { Ok 'readnow-alps.js (📦 ALPS 자동 처리 · MJ-MAIN)' } else { Ok 'readnow-alps.js (도우미 모듈 — 이 PC에서는 쓰지 않음 · 창도 안 엶)' }
$jw = Join-Path $Dir 'readnow-work.js'; $tmpw = Join-Path $Dir 'readnow-work.dl.js'
try { Invoke-WebRequest -UseBasicParsing -Uri "$RAW/readnow-work.js$Q" -OutFile $tmpw; & $node --check $tmpw; if ($LASTEXITCODE -eq 0) { Move-Item -Force $tmpw $jw; Ok 'readnow-work.js (🪟 수집 작업 창 — 웹앱 관리도구에서 PC별로 켤 때만 움직임)' } else { Warn '작업 창 모듈 검사 실패 — 도우미가 나중에 스스로 받음' } } catch { Warn '작업 창 모듈을 못 받음 — 도우미가 나중에 스스로 받음' }

if ($With -eq 'col2') { try {
  Say '🧪 외부 수집기(시험) 받기 — 운영 수집기와 따로 · 로그인하지 않음 · 기본 꺼짐이던 것을 이 PC만 켬'
  $C2 = Join-Path $env:USERPROFILE 'ReadNow\col2'; $C2App = Join-Path $C2 'app'; $C2New = Join-Path $C2 'app.new'
  $C2RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/lab/col2'
  New-Item -ItemType Directory -Force -Path $C2 | Out-Null
  if (Test-Path $C2New) { Remove-Item -Recurse -Force $C2New }
  $man = Invoke-RestMethod -UseBasicParsing -Uri "$C2RAW/bundle.json$Q"
  $files = @($man.files | Where-Object { $_ -match '^(col2-config\.js|helper/[\w.-]+\.js|shadow/[\w.-]+\.(js|html))$' })
  if (-not ($files -contains 'helper/readnow-col2-helper.js')) { throw '외부 수집기 묶음 목록이 이상합니다 — 잠시 뒤 다시 실행해 주세요' }
  foreach ($f in $files) {
    $t = Join-Path $C2New ($f -replace '/', '\'); New-Item -ItemType Directory -Force -Path (Split-Path $t) | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri "$C2RAW/$f$Q" -OutFile $t
    if ($f -like '*.js') { & $node --check $t; if ($LASTEXITCODE -ne 0) { throw "받은 외부 수집기 파일 $f 검사 실패 — 잠시 뒤 다시 실행해 주세요" } }
  }
  $c2run = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-col2-helper.js*' }
  if ($c2run) { $c2run | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Start-Sleep -Seconds 1 }
  if (Test-Path $C2App) { $old = Join-Path $C2 'app.old'; if (Test-Path $old) { Remove-Item -Recurse -Force $old }; Rename-Item $C2App 'app.old' }
  Rename-Item $C2New 'app'
  [IO.File]::WriteAllText((Join-Path $C2 'want.json'), ('{"on":true,"by":"설치 파일","at":"' + (Get-Date).ToUniversalTime().ToString('o') + '","pc":"' + $env:COMPUTERNAME + '"}'))
  Ok "외부 수집기 묶음 $($files.Count)개 파일 (검사 통과 · $C2App)"
} catch { Warn "외부 수집기 묶음을 여기서 못 받음($($_.Exception.Message)) — 인쇄 도우미가 켤 때 스스로 받음"; try { $c2d = Join-Path $env:USERPROFILE 'ReadNow\col2'; New-Item -ItemType Directory -Force -Path $c2d | Out-Null; [IO.File]::WriteAllText((Join-Path $c2d 'want.json'), '{"on":true,"by":"설치 파일"}') } catch {} } }

Say '로그온하면 저절로 켜지게'
$cmd = Join-Path $Dir 'run-print.cmd'
[IO.File]::WriteAllText($cmd, "@echo off`r`ncd /d `"%~dp0`"`r`n:loop`r`n`"$node`" readnow-print.js >> `"%~dp0console.log`" 2>&1`r`ntimeout /t 5 /nobreak >nul`r`ngoto loop`r`n")
$vbs = Join-Path $Dir 'run-print.vbs'
[IO.File]::WriteAllText($vbs, "CreateObject(`"WScript.Shell`").Run `"`"`"$cmd`"`"`", 0, False`r`n")
$startup = [Environment]::GetFolderPath('Startup'); $sh = New-Object -ComObject WScript.Shell
$lk = $sh.CreateShortcut((Join-Path $startup 'ReadNow-Print.lnk')); $lk.TargetPath = 'wscript.exe'; $lk.Arguments = "`"$vbs`""; $lk.WorkingDirectory = $Dir; $lk.Save()
# (정범님 11/02) 윈도우 시작 때 'ALPS 도우미' 창을 따로 열기 — 도우미가 켜질 때까지(최대 2분) 기다린 뒤 크롬 앱 창으로 http://127.0.0.1:8898/alps
$chrome = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) | Where-Object { $_ } | ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' } | Where-Object { Test-Path $_ } | Select-Object -First 1
# (정범님 11/05 HOME) ALPS 로그인 정보(cred.dat)가 있는 PC(MJ-MAIN)에서만 — 다른 PC는 ALPS 창을 열지 않음(도우미가 시작 프로그램 바로가기도 .off로 꺼 둠) · $alpsPc는 위에서 정함
if ($chrome -and -not $alpsPc) { Ok '이 PC에는 ALPS 로그인 정보가 없어 ALPS 창은 열지 않음(ALPS는 MJ-MAIN에서만 씀)' }
if ($chrome -and $alpsPc) {
  # (정범님 11/03) 창 크기 = 로거 도우미와 같게(380×560) · 위치 = 마지막으로 있던 자리(도우미가 %USERPROFILE%\ReadNow\alps\win.txt에 저장 · 화면 밖이면 오른쪽 위) · 창 전용 크롬 프로필(크기·위치 지정이 늘 먹게 — 로거 도우미와 같은 방식)
  $wps = Join-Path $Dir 'open-alps-window.ps1'
  [IO.File]::WriteAllText($wps, @"
Add-Type -AssemblyName System.Windows.Forms
`$a = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
`$w = 380; `$h = 560; `$x = `$a.X + `$a.Width - `$w; `$y = `$a.Y
`$f = Join-Path `$env:USERPROFILE 'ReadNow\alps\win.txt'
if (Test-Path `$f) { `$p = (Get-Content `$f -Raw).Trim() -split ','; if (`$p.Count -eq 2) { `$px = [int]`$p[0]; `$py = [int]`$p[1]; foreach (`$sc in [System.Windows.Forms.Screen]::AllScreens) { `$b = `$sc.WorkingArea; if (`$px -ge `$b.X - 40 -and `$px -le `$b.X + `$b.Width - 80 -and `$py -ge `$b.Y - 10 -and `$py -le `$b.Y + `$b.Height - 80) { `$x = `$px; `$y = `$py; break } } } }
Start-Process -FilePath '$chrome' -ArgumentList ("--user-data-dir=```"$Dir\chrome-alpswin```" --app=http://127.0.0.1:8898/alps --no-first-run --no-default-browser-check --hide-crash-restore-bubble --window-position=`$x,`$y --window-size=`$w,`$h")
"@, (New-Object Text.UTF8Encoding $true))
  $wvbs = Join-Path $Dir 'open-alps-window.vbs'
  [IO.File]::WriteAllText($wvbs, "Set h = CreateObject(`"MSXML2.ServerXMLHTTP`")`r`nFor i = 1 To 60`r`n  On Error Resume Next`r`n  h.open `"GET`", `"http://127.0.0.1:8898/status`", False`r`n  h.send`r`n  If Err.Number = 0 And h.status = 200 Then Exit For`r`n  Err.Clear`r`n  On Error GoTo 0`r`n  WScript.Sleep 2000`r`nNext`r`nCreateObject(`"WScript.Shell`").Run `"powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"`"$wps`"`"`", 0, False`r`n")
  $wl = $sh.CreateShortcut((Join-Path $startup 'ReadNow-ALPS-창.lnk')); $wl.TargetPath = 'wscript.exe'; $wl.Arguments = "`"$wvbs`""; $wl.WorkingDirectory = $Dir; $wl.Save()
  Ok '윈도우 시작 때 ALPS 도우미 창이 따로 열리게 함(시작 프로그램 ReadNow-ALPS-창 — 지우면 안 열림)'
  $openNow = $true
} elseif (-not $chrome) { Warn '크롬을 못 찾아 ALPS 도우미 창 자동 열기는 건너뜀' }
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-print.js*' }
if ($running) { $running | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Ok '켜져 있던 인쇄 도우미를 끔 — 새 판으로 다시 켬' }
else { Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$vbs`"" -WindowStyle Hidden }
Start-Sleep -Seconds 6
if ($openNow) { Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$wvbs`""; Ok 'ALPS 도우미 창을 새 크기(380×560)로 엶 — 예전 창이 떠 있으면 닫아 주세요' }
try { $s = Invoke-RestMethod -Uri 'http://127.0.0.1:8898/status' -TimeoutSec 5; Ok "인쇄 도우미 켜짐 (판 $($s.ver))" } catch { Warn '인쇄 도우미가 아직 안 켜짐 — 10초 뒤 웹앱에서 다시 확인하세요' }
if ($With -eq 'col2') {
  # 외부 수집기 켜기는 인쇄 도우미가 함(따로 된 프로세스 · 로그온 때도 도우미가 want.json을 보고 다시 켬) — 도우미가 막 켜지는 중이면 몇 번 다시
  $c2ok = $false
  for ($k = 0; $k -lt 6 -and -not $c2ok; $k++) { try { $r = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8898/col2/ensure' -Headers @{ 'X-RN-Print' = '1' } -ContentType 'application/json' -Body ('{"by":"설치 파일","pc":"' + $env:COMPUTERNAME + '"}') -TimeoutSec 90; if ($r.ok) { $c2ok = $true; Ok "🧪 외부 수집기 켜짐 (판 $($r.ver) · 127.0.0.1:8797 · 로그인하지 않음)" } } catch { Start-Sleep -Seconds 5 } }
  if (-not $c2ok) { Warn '외부 수집기가 아직 안 켜짐 — 도우미가 1분 안에 켭니다(웹앱 🧭 관리도구 › 🪟 수집 작업 창의 🧪 줄에서 확인)' }
}

Say '이 PC의 프린터'
Get-CimInstance Win32_Printer | ForEach-Object { Write-Host ("   · " + $_.Name + $(if ($_.Default) { '   ← 윈도우 기본 프린터(그대로 둠)' } else { '' })) }
Write-Host ''
if ($alpsPc) { Write-Host 'ALPS 자동 처리(MJ-MAIN): 이 PC 크롬 주소창에 http://127.0.0.1:8898/alps → 아이디·비밀번호·롯데택배 프린터를 넣으세요.' -ForegroundColor Green }
if ($With -eq 'col2') { Write-Host '다 됐습니다(리드나우 도우미 · 외부 수집기 포함). 웹앱 🧭 관리도구 › 🪟 수집 작업 창의 「🧪 외부 수집기(시험)」 줄에서 상태를 보고 끌 수 있습니다.' -ForegroundColor Green }
else { Write-Host '다 됐습니다. 웹앱 › 상품 등록 › 🏷 확정 후 처리 대기의 「🖨 라벨 프린터」에서 라벨 프린터를 고르세요.' -ForegroundColor Green }
