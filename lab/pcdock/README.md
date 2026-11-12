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

## 0.1.1 (정범님 11/12 JS-MAIN 써 본 결과)
- **③ 'Claude만 되고 나머지 안 됨' 고침** — 까닭: PowerShell 변수는 대소문자를 가리지 않아 `$S`(결과 목록)와 `foreach ($s in $steps)`가 같은 변수였음 → 첫 프로그램(Claude)을 켠 뒤 `$S += …`가 'PSObject 더하기(op_Addition)'로 터져 나머지가 멈춤. 결과는 `ArrayList.Add`로 쌓고, 프로그램마다 try/catch(하나가 실패해도 나머지 계속). `fit`의 `$M`/`$m`도 같은 문제라 고침. `tests/t_static`이 대소문자만 다른 변수·foreach 변수에 `+=`·`'run'`의 `+=`를 막음(옛 판에 돌리면 잡힘).
- 카카오톡 찾기 — `%LOCALAPPDATA%\Kakao\KakaoTalk` · `Program Files (x86)` · 설치 목록(Uninstall) · 시작 메뉴 바로가기.
- **배치마다 자기 설정** — 목록은 '틀', 칸에 놓을 때마다 새 배치(`place[].o`). 칸의 덩이를 누르면 그 배치 설정. 예전 설정(v:1)은 읽을 때 배치마다 복사해 옮기고 예전 파일은 `old\settings-v1-*.json`.
- **크롬·폴더 탭** — 탭 목록(＋ · ↑↓ · ✕). 크롬 `--new-window 주소1 주소2 …`. 폴더는 윈도우 11 22H2(빌드 22621)부터 첫 창에 Ctrl+T → Ctrl+L → 경로 → Enter(창이 맨 앞일 때만 글자를 침) · 안 되거나 윈도우 10이면 같은 칸에 창을 겹쳐 놓고 기록에 알림.
- **번외 수집기 · ALPS 도우미** 틀 — 떠 있으면(제목) 자리만, 없으면 그 도우미와 같은 크롬 프로필·주소로 엶(`apps.js HELPER_WIN` · 이 도우미는 그 포트를 부르지 않음).
- **③ 먼저 묻기** — 남겨 둔 채 / 모두 닫고(닫을 목록·지키는 목록을 먼저 보여 주고 두 번 누르기 · WM_CLOSE만 · 강제 종료 없음 · `closeplan.js` 보호 목록 + PowerShell에서 한 번 더) / 취소. 윈도우 시작 자동 실행은 묻지 않고 '남겨 둔 채'.
- 기록 창 — 사람 말(「카카오톡: 실행 파일을 못 찾음 → ①에서 …」) + 원문은 접어 둠.

### 윈도우에서만 확인할 것(리눅스 상자엔 PowerShell·C# 컴파일러가 없어 글자 검사만)
1. ③ → 남겨 둔 채: 놓은 프로그램이 모두 켜지고 칸에 놓이는지(Claude 뒤의 것들도).
2. 카카오톡이 저절로 찾아지는지(① 카카오톡 배치 설정에 '자동으로 찾음' 경로).
3. 폴더 배치에 탭 2~3개 → 한 창에 탭으로 열리는지(그동안 키보드·마우스 멈춤) · 안 되면 겹쳐 놓고 기록에 까닭.
4. ③ → 모두 닫고: 목록이 맞는지(크롬·Claude·원격·출고는 '지키는 창') · 메모장 등에 저장 안 한 글이 있으면 그 프로그램이 묻는지.
5. 번외 수집기·ALPS 도우미 창이 떠 있을 때 새로 안 뜨고 자리만 옮겨지는지.
6. C# 새 부분(pcdock-win.cs — Close·ExplorerTab·SendInput)이 윈도우 PowerShell 5.1 Add-Type에서 엮이는지(처음 켤 때 dll 새로 만듦).
