/* closeplan.js — ③ '화면에 열린 프로그램 모두 닫고 설정대로 열기'에서 무엇을 닫을지 정하는 순수 셈(정범님 11/12)
 *  · 닫기는 WM_CLOSE(그 프로그램에게 '닫아 주세요'라고만 부탁 — 저장 안 한 문서는 그 프로그램이 물음) · 강제 종료 없음
 *  · 보호 목록은 절대 닫지 않음 — 크롬 창 전부(보이지 않는 탭에 리드나우 웹앱·수집기·번외·ALPS가 있을 수 있어 창 하나만 보고 가를 수 없음) ·
 *    Claude 앱 · 원격 데스크톱 · 출고·인쇄 관련 · 명령 창(도우미가 돌 수 있음) · 탐색기 셸 자체(바탕 화면·작업 표시줄) · 윈도우 자체 화면 · 정리의 '지킬 이름'(clean.keep)
 *  · 미리 보여 준 목록(token)에 있던 창만 · PowerShell이 닫기 직전 창 번호·프로세스가 그대로인지 한 번 더 보고 셸·크롬은 거기서도 거절(두 겹) */
'use strict';
const PROC = {
  chrome: '크롬 창 — 보이지 않는 탭에 리드나우 웹앱·수집기·번외·ALPS가 있을 수 있어 그대로', msedgewebview2: '다른 프로그램 안의 화면',
  claude: 'Claude 앱', mstsc: '원격 데스크톱', msrdc: '원격 데스크톱', remoting_desktop: '원격 데스크톱', remoting_host: '원격 데스크톱', remote_assistance_host: '원격 데스크톱', rdpclip: '원격 데스크톱',
  node: '리드나우 도우미', powershell: '명령 창(도우미가 돌 수 있음)', pwsh: '명령 창(도우미가 돌 수 있음)', cmd: '명령 창(도우미가 돌 수 있음)', conhost: '명령 창', windowsterminal: '명령 창(도우미가 돌 수 있음)', openconsole: '명령 창', wscript: '도우미', cscript: '도우미',
  spoolsv: '인쇄(출고 라벨)', splwow64: '인쇄(출고 라벨)', printisolationhost: '인쇄(출고 라벨)',
  shellexperiencehost: '윈도우 화면', startmenuexperiencehost: '윈도우 화면', searchhost: '윈도우 화면', searchapp: '윈도우 화면', textinputhost: '윈도우 화면', lockapp: '윈도우 화면', dwm: '윈도우 화면', sihost: '윈도우 화면', taskmgr: '작업 관리자' };
/* 탐색기는 폴더 창(CabinetWClass)만 닫음 — 그 밖(바탕 화면·작업 표시줄 등)은 셸 자체 */
const SHELL_CLS = /^(Progman|WorkerW|Shell_TrayWnd|Shell_SecondaryTrayWnd|NotifyIconOverflowWindow|Windows\.UI\.Core\.CoreWindow|ConsoleWindowClass|CASCADIA_HOSTING_WINDOW_CLASS)$/;
const TITLE = /리드나우|readnow|번외|col2|ALPS|알라딘|aladin|예스24|yes24|북스킹|출고|송장|택배|라벨|label|인쇄|print|원격 데스크톱|Remote Desktop|Claude|PC 배치/i;
const low = (s) => String(s || '').toLowerCase().replace(/\.exe$/, '');
/* 창 하나를 지키는가 — 지키면 까닭 글, 아니면 '' */
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
module.exports = { PROC, SHELL_CLS, TITLE, keepWhy, plan };
