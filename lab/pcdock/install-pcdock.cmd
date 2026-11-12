@echo off
chcp 65001 >nul
title 리드나우 PC 배치 설치
echo 리드나우 PC 배치 도우미를 설치합니다(1분 안팎)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; & ([scriptblock]::Create((Invoke-RestMethod -UseBasicParsing -Uri ('https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/lab/pcdock/install-pcdock.ps1?t=' + [DateTimeOffset]::Now.ToUnixTimeSeconds()))))"
echo.
pause
