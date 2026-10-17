# 리드나우 — 크롬 '메모리 절약'이 수집기·웹앱 탭을 잠재우지 않게 (관리자 권한 필요 없음 · 이 PC의 이 Windows 사용자에게만 · 다시 실행해도 같은 결과)
# 사무실 PC·HOME에서 한 번: 시작 단추 오른쪽 클릭 → '터미널'(관리자 아님)에서
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/keep-tabs.ps1 | iex
# 로거는 도우미 1.6.6부터 스스로 갖추기(self-setup.ps1)가 같은 일을 자동으로 함
# 하는 일: 크롬 정책 TabDiscardingExceptions(크롬 108부터 · 사용자 정책 HKCU)에 알라딘·우리 웹앱·도우미 주소를 넣음
#   = 크롬 설정 '성능 → 항상 활성 상태로 유지할 사이트'에 넣는 것과 같음(사람이 손으로 넣을 필요 없음) · 크롬을 다시 켜면 적용(chrome://policy 에서 확인)
# 되돌리기: $env:RN_UNDO = '1'; irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/keep-tabs.ps1 | iex
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$pk = 'HKCU:\SOFTWARE\Policies\Google\Chrome\TabDiscardingExceptions'
$want = @('[*.]aladin.co.kr', 'jerrycson.github.io', '127.0.0.1', 'localhost', 'rn.local')
if ($env:RN_UNDO -eq '1') { if (Test-Path $pk) { foreach ($n in (Get-Item $pk).Property) { $v = (Get-ItemProperty -Path $pk -Name $n).$n; if ($want -contains $v) { Remove-ItemProperty -Path $pk -Name $n } } }; Remove-Item Env:\RN_UNDO -ErrorAction SilentlyContinue; Write-Host '되돌림 — 크롬을 다시 켜면 빠짐' -ForegroundColor Green; return }
New-Item -Path $pk -Force | Out-Null
$have = @(); $max = 0; foreach ($n in (Get-Item $pk).Property) { $have += (Get-ItemProperty -Path $pk -Name $n).$n; if ($n -match '^\d+$' -and [int]$n -gt $max) { $max = [int]$n } }
$add = 0; foreach ($w in $want) { if ($have -notcontains $w) { $max++; New-ItemProperty -Path $pk -Name "$max" -Value $w -PropertyType String -Force | Out-Null; $add++ } }
Write-Host ("  ✓ 항상 활성 사이트(크롬 정책): " + ($want -join ', ') + $(if ($add) { " — $add개 넣음 · 크롬을 모두 닫았다 다시 켜면 적용" } else { ' — 이미 다 있음' })) -ForegroundColor Green
