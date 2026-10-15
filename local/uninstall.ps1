# 리드나우 로컬 도우미 되돌리기 — 시작 프로그램·바탕화면 바로가기를 지우고 도우미를 끔
# 자료(D:\ReadNow\net 사용량 · logs · backup · chrome-pub 프로필)는 지우지 않음
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$startup = [Environment]::GetFolderPath('Startup'); $desk = [Environment]::GetFolderPath('Desktop')
try { Unregister-ScheduledTask -TaskName 'ReadNow-Ensure' -Confirm:$false -ErrorAction SilentlyContinue } catch {} <# (1.5.0) 다시 켜지기 작업을 먼저 끔(지운 것을 다시 켜지 않게) #>
foreach ($f in @((Join-Path $startup 'ReadNow-Local.lnk'), (Join-Path $startup '리드나우 공개 수집.lnk'), (Join-Path $desk '리드나우 공개 수집.lnk'), (Join-Path $startup '리드나우 도우미 창.lnk'), (Join-Path $desk '리드나우 도우미 창.lnk'))) { if (Test-Path $f) { Remove-Item -Force $f; Write-Host "  ✓ 지움 $f" } }
Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like '*run-local.cmd*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*readnow-local.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host '  ✓ 도우미 끔' }
Write-Host '되돌리기 끝 — 자료 폴더는 그대로 두었습니다. 다시 설치하려면 설치 줄을 다시 실행하세요.' -ForegroundColor Green

# (1.3.0) 이 PC 잠금 되돌리기
try { Unregister-ScheduledTask -TaskName 'ReadNow-TetherMetric' -Confirm:$false -ErrorAction SilentlyContinue } catch {}
try { $h = "$env:SystemRoot\System32\drivers\etc\hosts"; $l = Get-Content $h | Where-Object { $_ -notmatch '# ReadNow-Lock' }; [IO.File]::WriteAllLines($h, $l); ipconfig /flushdns | Out-Null } catch {}
try { $pk = 'HKLM:\SOFTWARE\Policies\Google\Chrome\URLBlocklist'; if (Test-Path $pk) { foreach ($n in (Get-Item $pk).Property) { $v = (Get-ItemProperty -Path $pk -Name $n).$n; if ($v -like 'aladin.co.kr/*') { Remove-ItemProperty -Path $pk -Name $n } } } } catch {}
