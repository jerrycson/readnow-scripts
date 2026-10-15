# 리드나우 사무실 PC 광고·통계 스크립트 막기 (적용 보류 — 사장님이 정하면 사무실 PC마다 한 번)
# 관리자 PowerShell(시작 단추 오른쪽 클릭 → '터미널(관리자)')에서:
#   irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/office-harden.ps1 | iex
# 되돌리기: 같은 창에서  $env:RN_UNDO = '1'; irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/office-harden.ps1 | iex
#
# 하는 일: 이 PC의 크롬에 광고·추적 차단 확장 'uBlock Origin Lite'를 크롬 정책으로 깔아 둠(사람이 지울 수 없음 · 크롬을 다시 켜면 적용)
#   왜: 알라딘 화면에는 광고·통계 스크립트(구글·네이버·카카오·크리테오 등)가 함께 돌고, 이 스크립트들은 같은 화면에서 브라우저 특징을 모아 기기를 알아봅니다.
#       로거 PC는 도우미가 이런 주소를 아예 막지만(테더링·와이파이 모두), 사무실 PC는 막지 않아 '같은 사람의 두 기기'로 이어 볼 실마리가 남습니다.
#       uBlock Origin Lite(크롬 웹스토어 공식 · 수백만 명 사용)는 이런 주소를 막아, 사무실 PC의 알라딘 화면에서도 추적 스크립트가 돌지 않게 합니다.
#   알라딘 화면 자체·판매관리(샵매니저)·수집기는 그대로 됩니다(광고 칸만 비어 보일 수 있음).
#   다른 사이트에도 같이 적용됩니다(일반적인 광고 차단과 같음).
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Host '⚠ 관리자 권한으로 실행해 주세요(시작 단추 오른쪽 클릭 → 터미널(관리자))' -ForegroundColor Yellow; return }
$id = 'ddkjiahejlhfcafbddmgiahcphecmpfh'  # uBlock Origin Lite (크롬 웹스토어)
$entry = "$id;https://clients2.google.com/service/update2/crx"
$pk = 'HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist'
if ($env:RN_UNDO -eq '1') {
  if (Test-Path $pk) { foreach ($n in (Get-Item $pk).Property) { $v = (Get-ItemProperty -Path $pk -Name $n).$n; if ($v -like "$id*") { Remove-ItemProperty -Path $pk -Name $n; Write-Host "  ✓ 지움 $v" } } }
  Write-Host '되돌림 — 크롬을 다시 켜면 확장이 빠집니다(지우지 않은 다른 정책은 그대로)' -ForegroundColor Green; Remove-Item Env:\RN_UNDO -ErrorAction SilentlyContinue; return
}
New-Item -Path $pk -Force | Out-Null
$have = @(); $max = 0; foreach ($n in (Get-Item $pk).Property) { $have += (Get-ItemProperty -Path $pk -Name $n).$n; if ($n -match '^\d+$' -and [int]$n -gt $max) { $max = [int]$n } }
if ($have -contains $entry) { Write-Host '  ✓ 이미 깔려 있음 — 바꿀 것 없음' -ForegroundColor Green } else { New-ItemProperty -Path $pk -Name ("$($max + 1)") -Value $entry -PropertyType String -Force | Out-Null; Write-Host '  ✓ 크롬 정책에 uBlock Origin Lite를 넣음 — 크롬을 모두 닫았다가 다시 켜면 깔림(chrome://policy 에서 확인)' -ForegroundColor Green }
Write-Host '끝. 확인: 크롬 주소창 chrome://extensions 에 uBlock Origin Lite(관리자가 설치함)가 보이면 됨' -ForegroundColor Green
