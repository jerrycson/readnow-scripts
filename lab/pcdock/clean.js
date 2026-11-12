/* clean.js — 🧹 PC 정리(이지클린 비슷 · 리드나우 일이 잘 돌게) — 무엇을 지울지·무엇을 절대 안 건드릴지 정하는 순수 셈
 *  실제로 훑고 지우는 일은 pcdock.ps1 'cleanscan'·'cleanrun'이 하고, 그 PowerShell도 지우기 직전 파일마다 같은 보호 목록을 다시 봄(두 겹)
 *  · 지우는 것: 임시·캐시·오래된 로그·오류 보고만(데이터 파일 지우기 없음) · 윈도우 업데이트 캐시 X · 휴지통 X · 크롬 캐시 X(어느 프로필이 리드나우인지 확실히 가를 수 없어 이번 판은 손대지 않음)
 *  · 절대 안 건드림: 크롬 전부(리드나우 웹앱 탭·Tampermonkey 수집기·번외 col2 크롬 프로필) · Node(번외·인쇄·로거 도우미·이 도우미) · Claude 앱 · 원격 데스크톱 · 인쇄(출고 라벨) ·
 *    D:\ReadNow·C:\ReadNow·%USERPROFILE%\ReadNow·%LOCALAPPDATA%\ReadNow 아래 모두 · 문서·바탕 화면·다운로드·사진 · 보안(Defender — 끄지 않음, 검사 제외는 '제안'만)
 *  · 프로그램 끄기: 미리 아는 '없어도 되는' 목록에 든 것만, 사람이 고른 것만 · 시작 프로그램은 목록만 보여 줌(끄기는 사람이 작업 관리자에서) */
'use strict';
/* 끄면 안 되는 프로세스(이름 · .exe 없이 · 대소문자 무시) */
const KEEP_PROC = ['chrome', 'node', 'claude', 'remoting_host', 'remoting_desktop', 'remoting_native_messaging_host', 'remote_assistance_host', 'powershell', 'pwsh', 'wscript', 'cscript', 'cmd', 'conhost', 'explorer',
  'msmpeng', 'mpdefendercoreservice', 'nissrv', 'securityhealthservice', 'securityhealthsystray', 'smartscreen',
  'system', 'idle', 'registry', 'smss', 'csrss', 'wininit', 'winlogon', 'services', 'lsass', 'svchost', 'dwm', 'fontdrvhost', 'sihost', 'ctfmon', 'taskhostw', 'runtimebroker', 'searchhost', 'searchapp', 'searchindexer', 'startmenuexperiencehost', 'shellexperiencehost', 'textinputhost', 'applicationframehost', 'audiodg', 'spoolsv', 'printisolationhost', 'splwow64', 'dllhost', 'wmiprvse', 'lockapp', 'userinit', 'memory compression', 'taskmgr',
  'phoneexperiencehost', 'yourphone', 'kakaotalk', 'msedgewebview2'];
/* 경로·명령 줄에 이것이 들면 리드나우 쪽(절대 안 건드림) */
const KEEP_MARK = /readnow|col2|pcdock|tampermonkey|\\rn-|ReadNow/i;
/* 백그라운드에서 CPU·메모리를 자주 먹는, 없어도 리드나우 일에 지장 없는 프로그램 — '보통'부터 보여 주고 사람이 고르면 끔 */
const OPTIONAL = [
  { n: 'OneDrive', t: 'OneDrive 동기화', why: '파일을 클라우드에 올리는 중이면 CPU·디스크를 씀 — OneDrive를 안 쓰면 끄기' },
  { n: 'Teams', t: 'Teams(옛판)', why: '안 쓰면 메모리 300MB 안팎' }, { n: 'ms-teams', t: 'Teams', why: '안 쓰면 메모리 300MB 안팎' },
  { n: 'Skype', t: 'Skype', why: '' }, { n: 'Spotify', t: 'Spotify', why: '' }, { n: 'Discord', t: 'Discord', why: '' },
  { n: 'steam', t: 'Steam', why: '' }, { n: 'steamwebhelper', t: 'Steam 화면', why: '' }, { n: 'EpicGamesLauncher', t: 'Epic 게임', why: '' },
  { n: 'AdobeARM', t: 'Adobe 업데이트 확인', why: '' }, { n: 'AdobeCollabSync', t: 'Adobe 공동 작업 동기화', why: '' }, { n: 'acrotray', t: 'Acrobat 트레이', why: '' },
  { n: 'Creative Cloud', t: 'Adobe Creative Cloud 창', why: '포토샵·일러스트레이터를 켜 둔 동안은 끄지 않음', adobe: true }, { n: 'CCXProcess', t: 'Adobe CC 보조', why: '', adobe: true }, { n: 'CoreSync', t: 'Adobe 파일 동기화', why: '', adobe: true }, { n: 'AdobeIPCBroker', t: 'Adobe 연결 보조', why: '', adobe: true },
  { n: 'msedge', t: '엣지(백그라운드)', why: '엣지를 안 쓰는데 떠 있으면 메모리를 먹음' }, { n: 'iCloudServices', t: 'iCloud', why: '' }, { n: 'iCloudDrive', t: 'iCloud 드라이브', why: '' }, { n: 'Dropbox', t: 'Dropbox', why: '' },
  { n: 'GameBar', t: 'Xbox Game Bar', why: '' }, { n: 'XboxPcApp', t: 'Xbox 앱', why: '' }, { n: 'Widgets', t: '윈도우 위젯', why: '' }, { n: 'WidgetService', t: '윈도우 위젯 서비스', why: '' },
  { n: 'NVIDIA Share', t: 'NVIDIA 화면 녹화', why: '' }, { n: 'Cortana', t: 'Cortana', why: '' }, { n: 'HxOutlook', t: '메일(윈도우)', why: '' }, { n: 'YourPhoneServer', t: '휴대폰과 연결 서버(옛판)', why: '휴대폰과 연결을 쓰면 끄지 않음', phone: true }];
const ADOBE_APPS = /^(photoshop|illustrator|indesign|afterfx|premiere|acrobat)$/i;
const low = (s) => String(s || '').toLowerCase().replace(/\.exe$/, '');
/* 보호 경로(지우기 금지) — 환경 변수는 PowerShell이 풂 */
const PROTECT_PATHS = ['D:\\ReadNow', 'C:\\ReadNow', '%USERPROFILE%\\ReadNow', '%LOCALAPPDATA%\\ReadNow', '%USERPROFILE%\\Documents', '%USERPROFILE%\\Desktop', '%USERPROFILE%\\Downloads', '%USERPROFILE%\\Pictures', '%USERPROFILE%\\OneDrive',
  '%LOCALAPPDATA%\\Google', '%LOCALAPPDATA%\\AnthropicClaude', '%APPDATA%\\Claude', '%LOCALAPPDATA%\\Kakao', '%APPDATA%\\Kakao', '%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer\\iconcache'];
/* 지울 곳(단계별) — roots 아래에서 ageDays일 넘은 파일만 · pat(파일 이름 꼴) · depth(얼마나 깊이) */
const TARGETS = [
  { id: 'temp', lv: 1, t: '임시 폴더(%TEMP%)의 오래된 파일', roots: ['%TEMP%'], ageDays: 7, deep: { ageDays: 2 }, depth: 6 },
  { id: 'mem', lv: 1, t: '메모리 비우기(작업 집합 줄이기 · 프로그램은 그대로)', kind: 'mem' },
  { id: 'wintemp', lv: 2, t: '윈도우 임시 폴더(관리자 권한이면)', roots: ['%SystemRoot%\\Temp'], ageDays: 7, depth: 4 },
  { id: 'thumb', lv: 2, t: '썸네일 캐시(사진 미리보기 — 다시 만들어짐)', roots: ['%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer'], pat: 'thumbcache_*.db', ageDays: 0, depth: 1 },
  { id: 'crash', lv: 2, t: '프로그램 오류 덤프', roots: ['%LOCALAPPDATA%\\CrashDumps'], ageDays: 0, depth: 2 },
  { id: 'wer', lv: 2, t: '윈도우 오류 보고 모음', roots: ['%LOCALAPPDATA%\\Microsoft\\Windows\\WER\\ReportArchive', '%LOCALAPPDATA%\\Microsoft\\Windows\\WER\\ReportQueue', '%ProgramData%\\Microsoft\\Windows\\WER\\ReportArchive'], ageDays: 0, depth: 3 },
  { id: 'd3d', lv: 2, t: '그래픽 셰이더 캐시(다시 만들어짐)', roots: ['%LOCALAPPDATA%\\D3DSCache', '%LOCALAPPDATA%\\NVIDIA\\DXCache', '%LOCALAPPDATA%\\AMD\\DxCache'], ageDays: 3, depth: 3 },
  { id: 'inet', lv: 2, t: '옛 인터넷 캐시(엣지 옛판·Office 창)', roots: ['%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache'], ageDays: 3, depth: 6 },
  { id: 'logs', lv: 2, t: '오래된 로그 파일(.log · 30일 넘은 것)', roots: ['%LOCALAPPDATA%', '%APPDATA%'], pat: '*.log', ageDays: 30, deep: { ageDays: 14 }, depth: 4 },
  { id: 'procs', lv: 2, t: '없어도 되는 백그라운드 프로그램 끄기(고른 것만)', kind: 'procs' },
  { id: 'startup', lv: 3, t: '시작 프로그램 정리 제안(목록만 — 끄기는 작업 관리자에서 사람이)', kind: 'startup' },
  { id: 'defender', lv: 3, t: '보안 검사 제외 제안(Defender를 끄지 않음 · 정범님이 고름)', kind: 'defender' }];
const LEVELS = [{ lv: 1, t: '가볍게' }, { lv: 2, t: '보통' }, { lv: 3, t: '깊게' }];
/* 그 단계의 지울 곳(PowerShell에 넘길 꼴) */
function targetsFor(lv) { lv = Math.max(1, Math.min(3, lv | 0 || 1)); return TARGETS.filter((t) => t.lv <= lv).map((t) => { const o = { ...t, ...(lv >= 3 && t.deep ? t.deep : {}) }; delete o.deep; return o; }); }
/* 프로세스 하나가 보호 대상인가 — { name, path, cmd } · keep: 설정 clean.keep(사람이 더한 이름) · layoutProcs: 배치에 든 프로그램 프로세스 이름 */
function isKept(p, keep, layoutProcs) { const n = low(p.name); if (!n) return true;
  if (KEEP_PROC.includes(n)) return true; if ((keep || []).some((k) => low(k) === n)) return true; if ((layoutProcs || []).some((k) => low(k) === n)) return true;
  if (KEEP_MARK.test(p.path || '') || KEEP_MARK.test(p.cmd || '')) return true; if (/^[a-z]:\\windows\\/i.test(p.path || '') && !/\\(systemapps|windowsapps)\\/i.test(p.path || '')) return true; /* 윈도우 자체 프로그램 */
  return false; }
/* 스캔 결과의 프로세스 목록 → 끌 수 있는 후보(OPTIONAL에 든 것만) · 정보용(CPU 많이 쓰는 다른 것) */
function procPlan(procs, keep, layoutProcs) { const running = new Set((procs || []).map((p) => low(p.name))); const adobeOn = [...running].some((n) => ADOBE_APPS.test(n)); const phoneOn = (layoutProcs || []).some((k) => /phone/i.test(k));
  const stop = [], info = [];
  for (const p of procs || []) { const n = low(p.name); const o = OPTIONAL.find((x) => low(x.n) === n); const kept = isKept(p, keep, layoutProcs);
    if (o && !kept) { const block = (o.adobe && adobeOn) ? '포토샵·일러스트레이터가 켜져 있어 끄지 않음' : (o.phone && phoneOn) ? '배치에 휴대폰과 연결이 있어 끄지 않음' : ''; stop.push({ pid: p.pid, name: p.name, t: o.t, why: o.why, cpu: p.cpu || 0, mb: Math.round((p.ws || 0) / 1048576), block }); }
    else if (!o && !kept && ((p.cpu || 0) >= 5 || (p.ws || 0) >= 400 * 1048576)) info.push({ pid: p.pid, name: p.name, cpu: p.cpu || 0, mb: Math.round((p.ws || 0) / 1048576) }); }
  const by = (a, b) => (b.cpu - a.cpu) || (b.mb - a.mb); stop.sort(by); info.sort(by);
  return { stop, info: info.slice(0, 12) }; }
/* 메모리 비우기에서 뺄 이름 — 크롬(리드나우 탭이 다시 읽어 들이며 느려짐)·보호 목록 */
function trimSkip(keep) { return [...new Set([...KEEP_PROC, ...(keep || []).map(low)])]; }
/* 시작 프로그램 — 끄면 좋을 것 표시만(리드나우·보안·드라이버는 '그대로') */
function startupPlan(items) { return (items || []).map((s) => { const t = `${s.name || ''} ${s.cmd || ''}`; const keep = KEEP_MARK.test(t) || /security|defender|realtek|nvidia|intel|amd|synaptics|logi|audio|printer|프린터|remoting|chrome remote/i.test(t);
  const o = OPTIONAL.find((x) => new RegExp('\\b' + x.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(t)); return { ...s, sug: keep ? 'keep' : o ? 'off' : 'look', why: keep ? '리드나우·보안·장치 — 그대로' : o ? `${o.t} — 리드나우 일엔 없어도 됨` : '무엇인지 보고 고르기' }; }); }
/* 보안 검사 제외 제안 — 실행하지 않고 글만(관리자 PowerShell에 붙여 넣는 명령) */
const DEFENDER = { paths: ['D:\\ReadNow', '%USERPROFILE%\\ReadNow', '%LOCALAPPDATA%\\ReadNow'],
  why: '번외 수집기·도우미가 임시 파일·작은 프로그램(dll)을 자주 만들 때마다 Defender가 하나하나 검사해 CPU를 먹음(11/12 JS-MAIN Defender 26%). 리드나우 폴더만 검사에서 빼면 그 몫이 줄어듦 — 대신 그 폴더에 나쁜 파일이 들어와도 실시간으로 못 잡으니, 정범님이 고르세요.',
  cmd: (home) => ['D:\\ReadNow', home + '\\ReadNow'].map((p) => `Add-MpPreference -ExclusionPath '${p}'`).join('; ') };
/* 정범님께 드리는 '어디까지 비우면 좋은지' 조언(화면 ④ 아래에도 보임) */
const ADVICE = '권하는 정도: 평소엔 매주 한 번 「가볍게」(7일 넘은 임시 파일 + 메모리 비우기)로 충분합니다. 느려졌다 싶을 때만 「보통」으로 썸네일·오류 보고·오래된 로그를 지우고, 백그라운드 프로그램은 OneDrive·Teams·Adobe 보조처럼 리드나우와 상관없는 것만 끄세요. ' +
  '11/12 JS-MAIN이 멈춘 까닭은 디스크가 아니라 CPU였습니다 — 번외 수집기가 부를 때마다 PowerShell을 새로 켜고 그때마다 작은 프로그램을 새로 만들어 Defender가 매번 검사(CPU 91% · Defender 26%)했고, 크롬은 탭 하나에 100~400MB씩 먹습니다. 그래서 효과가 큰 순서는 ① 안 쓰는 크롬 탭 닫기(특히 같은 화면을 여러 탭) ② 「깊게」의 Defender 검사 제외(정범님이 고름) ③ 백그라운드 프로그램 끄기 ④ 임시 파일 지우기입니다. ' +
  '「깊게」는 한 달에 한 번이면 되고, 시작 프로그램은 목록을 보고 모르는 것만 끄세요. 윈도우 업데이트 캐시·휴지통·크롬 캐시·D:\\ReadNow는 이 도우미가 건드리지 않습니다.';
module.exports = { KEEP_PROC, KEEP_MARK, OPTIONAL, PROTECT_PATHS, TARGETS, LEVELS, targetsFor, isKept, procPlan, trimSkip, startupPlan, DEFENDER, ADVICE };
