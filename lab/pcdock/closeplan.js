/* closeplan.js — 「⛔ 전체 닫기」·③ '화면에 열린 프로그램 모두 닫고 설정대로 열기'에서 무엇을 닫을지 정하는 순수 셈(정범님 11/12 · 11/17 16:16)
 *  · (0.1.9 · 정범님 11/17 16:16 「수집기든 뭐든 상관없이 전부 닫게」) 작업 표시줄에 뜬 창은 모두 닫을 수 있음 — 크롬(수집기 탭)·Claude·원격 데스크톱도
 *    절대 안 닫는 것은 PowerShell NeverWhy가 정함(PC 배치 자신 · 윈도우 셸(바탕 화면·작업 표시줄) · 윈도우 시스템) — 그 창은 목록에 '안 닫음'과 까닭으로
 *    예전의 보호 목록(PROC·TITLE)은 이제 '닫으면 이런 일이 생김' 경고(warn)로만 보여 줌 · 고르기는 정범님이 화면에서(기본 = 모두 고름)
 *  · 닫는 차례 = PowerShell CloseSet: WM_CLOSE(닫아 달라는 부탁 — 저장 안 한 문서는 그 프로그램이 물음) → 몇 초 기다림 → 남으면 강제 종료
 *  · 미리 보여 준 목록(token)에 있던 창만 · PowerShell이 닫기 직전 창 번호·프로세스가 그대로인지 한 번 더 봄
 *  (0.1.8까지: 이 보호 목록이 크롬·Claude·원격·제목에 리드나우/알라딘/Claude가 있는 창을 아예 빼고 PowerShell이 한 번 더 거절 · WM_CLOSE만 보내 6초 기다림 → 크롬 위주인 화면에선 거의 안 닫혔음) */
'use strict';
const PROC = {
  chrome: '크롬 창 — 보이지 않는 탭에 리드나우 웹앱·수집기·번외·ALPS가 있을 수 있음(닫으면 그 일도 멈춤)', msedgewebview2: '다른 프로그램 안의 화면',
  claude: 'Claude 앱', mstsc: '원격 데스크톱', msrdc: '원격 데스크톱', remoting_desktop: '원격 데스크톱', remoting_host: '원격 데스크톱', remote_assistance_host: '원격 데스크톱', rdpclip: '원격 데스크톱',
  node: '리드나우 도우미', powershell: '명령 창(도우미가 돌 수 있음)', pwsh: '명령 창(도우미가 돌 수 있음)', cmd: '명령 창(도우미가 돌 수 있음)', conhost: '명령 창', windowsterminal: '명령 창(도우미가 돌 수 있음)', openconsole: '명령 창', wscript: '도우미', cscript: '도우미',
  spoolsv: '인쇄(출고 라벨)', splwow64: '인쇄(출고 라벨)', printisolationhost: '인쇄(출고 라벨)',
  shellexperiencehost: '윈도우 화면', startmenuexperiencehost: '윈도우 화면', searchhost: '윈도우 화면', searchapp: '윈도우 화면', textinputhost: '윈도우 화면', lockapp: '윈도우 화면', dwm: '윈도우 화면', sihost: '윈도우 화면', taskmgr: '작업 관리자' };
/* 탐색기는 폴더 창(CabinetWClass)만 닫음 — 그 밖(바탕 화면·작업 표시줄 등)은 셸 자체 */
const SHELL_CLS = /^(Progman|WorkerW|Shell_TrayWnd|Shell_SecondaryTrayWnd|NotifyIconOverflowWindow|Windows\.UI\.Core\.CoreWindow|ConsoleWindowClass|CASCADIA_HOSTING_WINDOW_CLASS)$/;
const TITLE = /리드나우|readnow|번외|col2|ALPS|알라딘|aladin|예스24|yes24|북스킹|출고|송장|택배|라벨|label|인쇄|print|원격 데스크톱|Remote Desktop|Claude|PC 배치/i;
const low = (s) => String(s || '').toLowerCase().replace(/\.exe$/, '');
/* 창 하나를 닫으면 걱정되는 까닭(경고) — 있으면 글, 아니면 '' · (0.1.9) 이제 막지 않고 경고로만 */
function keepWhy(w, keep) { const p = low(w.proc); const cls = String(w.cls || '');
  if (!p) return '프로그램을 모름';
  if (PROC[p]) return PROC[p];
  if (SHELL_CLS.test(cls)) return '탐색기 셸·명령 창';
  if (p === 'explorer' && cls !== 'CabinetWClass') return '탐색기 셸 자체';
  if ((keep || []).some((k) => low(k) === p)) return '정리에서 지키기로 한 이름';
  if (TITLE.test(String(w.title || ''))) return '제목에 리드나우·출고·인쇄·원격 등이 있음';
  return ''; }
/* wins: PowerShell 'windows' 결과 → { close:[{h,pid,proc,title}], keep:[{proc,title,why}] } */
function plan(wins, keep) { const close = [], kept = [];
  for (const w of wins || []) { if (!w || !w.h) continue; const why = keepWhy(w, keep); const it = { h: w.h, pid: w.pid, proc: w.proc, title: String(w.title || '').slice(0, 120) };
    if (why) kept.push({ proc: w.proc, title: it.title, why }); else close.push(it); }
  return { close, keep: kept }; }
/* (0.1.9) wins: PowerShell 'closeall' plan 결과(창마다 never = 절대 안 닫는 까닭 · '' = 닫을 수 있음)
 *  → { close:[{h,pid,proc,title,warn}](모두 고를 수 있음 · 기본 고름) , never:[{proc,title,why}] } */
function planAll(wins, keep) { const close = [], never = [];
  for (const w of wins || []) { if (!w || !w.h) continue; const title = String(w.title || '').slice(0, 120);
    if (w.never) { never.push({ proc: w.proc, title, why: String(w.never) }); continue; }
    close.push({ h: w.h, pid: w.pid, proc: w.proc, title, warn: keepWhy(w, keep) }); }
  return { close, never }; }
module.exports = { PROC, SHELL_CLS, TITLE, keepWhy, plan, planAll };
