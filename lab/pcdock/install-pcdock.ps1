# 리드나우 PC 배치 도우미 설치 — 그 PC에서 한 번(정범님 11/12 'JS-MAIN 실행·배치 작은 창')
# 가장 쉬운 길: install-pcdock.cmd 를 받아 더블클릭(이 파일을 받아 실행함)
# 또는 PowerShell에 한 줄:  irm https://readnow.kr/lab/pcdock/install-pcdock.ps1 | iex
# 하는 일: ① Node.js 22 찾기(인쇄 도우미가 깐 %USERPROFILE%\ReadNow\node 를 그대로 씀 · 없으면 휴대용 Node를 같은 자리에 — 관리자 허락 창 없음)
#          ② 묶음(bundle.json 목록)을 %LOCALAPPDATA%\ReadNow\pcdock\app 에 받아 node --check 검사 뒤 바꿔 끼움
#          ③ 바탕 화면·시작 메뉴에 「리드나우 PC 배치」 아이콘 ④ 지금 한 번 켬
# 건드리지 않는 것: 인쇄 도우미·번외 수집기·로거·크롬 설정·윈도우 시작 프로그램(② 단추를 눌러야 등록) · 다시 실행해도 됨(덮어씀 · 설정은 그대로)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
function Say($m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠ $m" -ForegroundColor Yellow }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/lab/pcdock'
try { $null = Invoke-WebRequest -UseBasicParsing -TimeoutSec 8 -Uri ('https://readnow.kr/lab/pcdock/bundle.json?t=' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()); $RAW = 'https://readnow.kr/lab/pcdock' } catch {}
$Q = '?t=' + [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$Home2 = Join-Path $env:LOCALAPPDATA 'ReadNow\pcdock'; $App = Join-Path $Home2 'app'; $New = Join-Path $Home2 'app.new'
New-Item -ItemType Directory -Force -Path $Home2 | Out-Null
Say "설치 자리: $Home2"

Say 'Node.js 확인'
$NodeDir = Join-Path $env:USERPROFILE 'ReadNow\node'
function NodeVer($p) { try { $v = (& $p -v) -replace '^v', ''; return [int]($v.Split('.')[0]) } catch { return 0 } }
function FindNode {
  $c = @((Join-Path $NodeDir 'node.exe'), "$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe")
  $g = Get-Command node -ErrorAction SilentlyContinue; if ($g) { $c += $g.Source }
  foreach ($p in $c) { if ($p -and (Test-Path $p) -and ((NodeVer $p) -ge 22)) { return $p } }
  return $null }
function GetPortableNode {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
  Warn "Node.js 22 이상이 없어 휴대용 Node를 받습니다(약 30MB · 관리자 허락 창 없음 · $arch)"
  $idx = Invoke-RestMethod -UseBasicParsing -Uri 'https://nodejs.org/dist/index.json'
  $rel = $idx | Where-Object { $_.lts -and ([int]($_.version.TrimStart('v').Split('.')[0]) -ge 22) -and ($_.files -contains "win-$arch-zip") } | Select-Object -First 1
  if (-not $rel) { throw 'Node.js 받을 판을 찾지 못했습니다 — 잠시 뒤 다시 실행해 주세요' }
  $name = "node-$($rel.version)-win-$arch"; $zip = Join-Path $env:TEMP "$name.zip"
  Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$($rel.version)/$name.zip" -OutFile $zip
  $ex = Join-Path $env:TEMP "rn-node-$([guid]::NewGuid().ToString('N'))"; New-Item -ItemType Directory -Force -Path $ex | Out-Null
  $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
  if (Test-Path $tar) { & $tar -xf $zip -C $ex; if ($LASTEXITCODE -ne 0) { Expand-Archive -Force -Path $zip -DestinationPath $ex } } else { Expand-Archive -Force -Path $zip -DestinationPath $ex }
  $src = Join-Path $ex $name; if (-not (Test-Path (Join-Path $src 'node.exe'))) { throw '받은 Node.js 파일이 이상합니다 — 잠시 뒤 다시 실행해 주세요' }
  if (Test-Path $NodeDir) { try { Rename-Item -ErrorAction Stop $NodeDir ('node.old-' + (Get-Date -Format yyyyMMddHHmmss)) } catch { throw '예전 휴대용 Node 폴더를 옮기지 못했습니다(쓰는 중) — PC를 다시 켠 뒤 다시 실행해 주세요' } }
  Move-Item $src $NodeDir; Remove-Item $zip -ErrorAction SilentlyContinue
  return (Join-Path $NodeDir 'node.exe') }
$node = FindNode; if (-not $node) { $node = GetPortableNode }
if ((NodeVer $node) -lt 22) { throw 'Node.js 22 이상을 준비하지 못했습니다 — 잠시 뒤 다시 실행해 주세요' }
Ok "Node.js $(& $node -v) ($node)"

Say 'PC 배치 도우미 받기'
if (Test-Path $New) { Remove-Item -Recurse -Force $New }
New-Item -ItemType Directory -Force -Path $New | Out-Null
$man = Invoke-RestMethod -UseBasicParsing -Uri "$RAW/bundle.json$Q"
$files = @($man.files | Where-Object { $_ -match '^[\w.-]+\.(js|html|ps1|cs|json)$' })
if (-not ($files -contains 'readnow-pcdock.js')) { throw '묶음 목록이 이상합니다 — 잠시 뒤 다시 실행해 주세요' }
foreach ($f in $files) { $t = Join-Path $New $f; Invoke-WebRequest -UseBasicParsing -Uri "$RAW/$f$Q" -OutFile $t
  if ($f -like '*.js') { & $node --check $t; if ($LASTEXITCODE -ne 0) { throw "받은 파일 $f 검사 실패 — 잠시 뒤 다시 실행해 주세요" } } }
$run = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*readnow-pcdock.js*' }
if ($run) { $run | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }; Start-Sleep -Seconds 1 }
if (Test-Path $App) { $old = Join-Path $Home2 'app.old'; if (Test-Path $old) { Remove-Item -Recurse -Force $old }; Rename-Item $App 'app.old' }
Rename-Item $New 'app'
Ok "파일 $($files.Count)개 (검사 통과)"

Say '켜는 아이콘 만들기'
# (run.cmd는 chcp 65001로 UTF-8 · run.vbs는 UTF-16 — 사용자 폴더 이름이 한글이어도)
# run.cmd — 받아 둔 새 판(app.new\.ready)이 있으면 바꿔 끼운 뒤 켬 · run.vbs — 검은 창 없이 run.cmd
$cmd = Join-Path $Home2 'run.cmd'
[IO.File]::WriteAllText($cmd, "@echo off`r`nchcp 65001 >nul`r`ncd /d `"%~dp0`"`r`nif exist `"app.new\.ready`" (`r`n  if exist app.old rmdir /s /q app.old`r`n  move app app.old >nul && move app.new app >nul`r`n  del app\.ready >nul 2>&1`r`n)`r`n`"$node`" app\readnow-pcdock.js %* >> `"%~dp0console.log`" 2>&1`r`n")
$vbs = Join-Path $Home2 'run.vbs'
[IO.File]::WriteAllText($vbs, "Set sh = CreateObject(`"WScript.Shell`")`r`na = `"`"`r`nFor Each x In WScript.Arguments`r`n  a = a & `" `" & x`r`nNext`r`nsh.Run `"`"`"`" & `"$cmd`" & `"`"`"`" & a, 0, False`r`n", [Text.Encoding]::Unicode)  <# 사용자 이름이 한글이어도 경로가 깨지지 않게 UTF-16 #>
$sh = New-Object -ComObject WScript.Shell
foreach ($d in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) { if ($d) { $l = $sh.CreateShortcut((Join-Path $d '리드나우 PC 배치.lnk')); $l.TargetPath = 'wscript.exe'; $l.Arguments = "`"$vbs`""; $l.WorkingDirectory = $Home2; $l.IconLocation = "$env:SystemRoot\System32\imageres.dll,174"; $l.Description = '리드나우 PC 배치 — 프로그램 실행·창 배치·PC 정리'; $l.Save() } }
Ok '바탕 화면·시작 메뉴에 「리드나우 PC 배치」'

Say '켜기'
Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$vbs`""
Write-Host '다 됐습니다. 오른쪽 위에 작은 창이 뜹니다(다음부터는 바탕 화면 「리드나우 PC 배치」 아이콘).' -ForegroundColor Green
