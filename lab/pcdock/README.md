# 🖥 리드나우 PC 배치 도우미 (pcdock · 첫 판 0.1.0)

정범님 11/12: JS-MAIN(사무실 윈도우 PC)에서 **프로그램 실행·창 배치·PC 정리**를 하는 작은 창. 앞으로 기능을 계속 더할 틀.

## 구조
| 파일 | 하는 일 |
|---|---|
| `readnow-pcdock.js` | 이 PC 안에서만 듣는 Node 서버(127.0.0.1:8796 · 겹치면 빈 포트) + 크롬 앱 창(따로 된 프로필 `%LOCALAPPDATA%\ReadNow\pcdock\chrome`) · 새 판 받기 · `--autorun`(윈도우 시작 때) |
| `ui.html` | 화면 — 처음 화면 단추 4개 · ① 배치도(끌어 놓기·모서리 늘리기) · ④ 정리 미리보기 |
| `grid.js` | 칸 셈(브라우저·Node 함께) — 일반 모니터(기본 16:9)를 4×3, 넓으면 가로 칸을 늘림(21:9 → 5×3 · 32:9 → 8×3 · 세운 16:9 → 3×4) |
| `apps.js` | 기본 프로그램 10가지 · 실행 파일 찾는 단서 · 실행 계획(크롬은 언제나 새 창만 옮김) |
| `settings.js` | 설정 꼴·검사(겹침·칸 밖·주소·경로·비밀값 칸 거절) |
| `clean.js` | 정리 단계·보호 목록·조언 |
| `pcdock.ps1` + `pcdock-win.cs` | 윈도우 일(모니터·DPI·창 찾기·놓기·바로가기·시작 등록·정리) — C#은 한 번 엮은 dll을 다시 씀 |
| `install-pcdock.cmd` / `install-pcdock.ps1` | 처음 설치(더블클릭) |

자료: `%LOCALAPPDATA%\ReadNow\pcdock` — `settings.json`(비밀값 없음) · 예전 설정 `old\` · 기록 `pcdock.log`.

## 설치(정범님 손 2번)
1. `install-pcdock.cmd`를 받아 더블클릭(또는 PowerShell에 `irm https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/lab/pcdock/install-pcdock.ps1 | iex`).
   Node는 인쇄 도우미가 깐 `%USERPROFILE%\ReadNow\node`를 그대로 씀(없으면 같은 자리에 휴대용 Node).
2. 바탕 화면 「리드나우 PC 배치」 아이콘(설치 끝에 한 번 저절로 켜짐).
새 판은 켤 때 받아 두고 다음에 켤 때 바뀜(사람 손 없음).

## 시험
`bash lab/pcdock/tests/run-all.sh` — t_static(글자 검사) · t_unit(칸 셈·설정·계획·보호 목록) · t_server(가짜 PowerShell로 API) · t_ui(Playwright · 스크린샷 `PCDOCK_SHOTS`).
리눅스 상자엔 PowerShell이 없어 `pcdock.ps1`·`pcdock-win.cs`는 괄호 짝만 봄 — 실제 동작은 윈도우에서 확인.
