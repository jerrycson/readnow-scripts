/* apps.js — 📋 배치할 프로그램 '틀'(왼쪽 목록) · 실행 파일 찾는 단서 · 창 알아보는 법 · 실행 계획 만들기
 *  (브라우저 화면과 Node가 함께 씀)
 *  · 0.1.1(정범님 11/12): 목록의 프로그램은 '틀' — 칸에 놓을 때마다 새 '배치'(인스턴스)가 생기고, 배치마다 자기 설정을 가짐
 *    (스크린샷 폴더 / 다운로드 폴더, A 주소 크롬 / B 주소 크롬). 배치의 빈 칸은 틀의 값을 씀(예: 틀에 넣은 실행 파일 경로)
 *  · 크롬·폴더는 한 창에 여러 탭(순서 있음) — 크롬은 --new-window 주소1 주소2 …, 폴더는 윈도우 11 탐색기 탭(PowerShell이 Ctrl+T + 주소창)
 *  · 찾기 단서: App Paths(레지스트리에 등록된 실행 파일 이름) → 흔한 설치 자리 → 설치 목록(Uninstall) → 시작 메뉴 바로가기 이름 — PowerShell 'find'가 차례로 봄
 *  · 창 알아보기: 실행하기 전 떠 있던 창을 적어 두고, 실행 뒤 '새로 뜬' 창 중 프로세스 이름·창 종류·제목이 맞는 것
 *    크롬은 언제나 새 창만(이미 떠 있는 크롬 = 리드나우 웹앱·수집기 창일 수 있어 절대 옮기지 않음) — 단 번외 수집기·ALPS 도우미 창은 제목으로 알아보고 떠 있으면 자리만
 *  · Claude 앱: claude:// 주소(Claude 도움말 '링크로 Claude 데스크톱 열기')로 대화 방을 엶 — claude://claude.ai/chat/<대화 번호> · 코드 새 세션 claude://code/new?folder=…
 *    이미 있는 코드 세션·아티팩트를 여는 claude:// 주소는 없음 → 크롬 앱 창(claude.ai 주소)으로 엶 */
(function (root, factory) { const M = factory(); if (typeof module === 'object' && module.exports) module.exports = M; else root.PDApps = M; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CHROME_FIND = { exe: 'chrome.exe', paths: ['%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe', '%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe', '%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe'], lnk: ['Google Chrome', 'Chrome'] };
  /* 이미 떠 있는 도우미 창(크롬 앱 창) — 그 도우미가 띄우는 것과 같은 프로필·주소로 엶(새로 띄우는 것은 떠 있지 않을 때만)
   *  번외: lab/col2 helper appWin('status') — %USERPROFILE%\ReadNow\col2\col2-stat-chrome · http://127.0.0.1:8797/ · 제목 '📊 번외 수집기'
   *  ALPS: local/install-print.ps1 open-alps-window.ps1 — %USERPROFILE%\ReadNow\print\chrome-alpswin · http://127.0.0.1:8898/alps · 제목 'ALPS 도우미 설정'
   *  (이 도우미는 그 주소를 부르지 않음 — 크롬 창에 주소만 넘김) · 제목은 앞부터 맞춤(크롬 앱 창 제목 = 화면 제목 그대로 · 평소 크롬 창은 ' - Chrome'이 붙어 안 맞음) */
  const HELPER_WIN = {
    col2: { url: 'http://127.0.0.1:8797/', prof: '%USERPROFILE%\\ReadNow\\col2\\col2-stat-chrome', title: '^(📊 )?번외 수집기$', extra: ['--disable-extensions'] },
    alps: { url: 'http://127.0.0.1:8898/alps', prof: '%USERPROFILE%\\ReadNow\\print\\chrome-alpswin', title: '^ALPS 도우미', extra: [] } };
  /* (0.1.6) ③ '목록의 프로그램은 먼저 닫고 새로' 때 닫지 않는 창 제목 — 리드나우 수집기(알라딘 수집 탭 · 🪟 리드나우 작업 창 · 🖐 리드나우 손발) · 번외 · ALPS · PC 배치 자신
   *  (크롬 창은 맨 앞 탭 제목만 보임 — 뒤 탭에 수집기가 있는 창은 알아보지 못함) · 도우미 크롬(…\ReadNow\… 프로필)·프로필을 못 읽은 크롬은 제목과 상관없이 지킴(C# CloseWhy) */
  const KEEP_TITLE = '^🪟 리드나우 작업 창|리드나우 손발|알라딘|aladin|번외 수집|📊 번외|ALPS|리드나우 PC 배치';
  /* kind별 뼈대 — 목록에 처음 놓이는 열두 가지 */
  const CATALOG = [
    { kind: 'chrome', name: '크롬', icon: '🌐', find: CHROME_FIND, def: { urls: ['https://readnow.kr/app/'], windows: 1, profile: '' } },
    { kind: 'folder', name: '윈도우 폴더', icon: '📁', def: { paths: ['D:\\ReadNow'] } },
    { kind: 'phone', name: '휴대폰과 연결', icon: '📱', find: { shell: 'shell:AppsFolder\\Microsoft.YourPhone_8wekyb3d8bbwe!App' } },
    { kind: 'crd', name: 'Chrome 원격 데스크톱', icon: '🖥', find: CHROME_FIND, def: { url: 'https://remotedesktop.google.com/access' } },
    { kind: 'claude', name: 'Claude 앱', icon: '✳', find: { exe: 'claude.exe', paths: ['%LOCALAPPDATA%\\AnthropicClaude\\claude.exe', '%LOCALAPPDATA%\\Programs\\Claude\\Claude.exe'], lnk: ['Claude'] }, def: { mode: 'chat', room: '', artifact: '', how: 'app' } },
    { kind: 'exe', id: 'kakao', name: '카카오톡', icon: '💬', find: { exe: 'KakaoTalk.exe', paths: ['%LOCALAPPDATA%\\Kakao\\KakaoTalk\\KakaoTalk.exe', '%ProgramFiles(x86)%\\Kakao\\KakaoTalk\\KakaoTalk.exe', '%ProgramFiles%\\Kakao\\KakaoTalk\\KakaoTalk.exe', '%LOCALAPPDATA%\\Programs\\Kakao\\KakaoTalk\\KakaoTalk.exe'], uninst: ['KakaoTalk', '카카오톡'], lnk: ['카카오톡', 'KakaoTalk'] }, match: { title: '카카오톡|KakaoTalk', hidden: '^(카카오톡|KakaoTalk)$', hcls: 'EVA_Window_Dblclk' } }, /* (0.1.6) 트레이에 숨어 떠 있으면(창이 숨김 — 0.1.5는 '보이는 창'만 찾아 못 찾음) 그 창을 보이게 한 뒤 놓음 · hidden = 숨은 창 제목(꼭 같게) · hcls = 카카오톡 본 창 종류(먼저 고름) */
    { kind: 'exe', id: 'photoshop', name: '포토샵', icon: '🎨', find: { exe: 'Photoshop.exe', paths: [], glob: ['%ProgramFiles%\\Adobe\\Adobe Photoshop*\\Photoshop.exe'], lnk: ['Adobe Photoshop', 'Photoshop'] } },
    { kind: 'exe', id: 'illustrator', name: '일러스트레이터', icon: '✒', find: { exe: 'Illustrator.exe', paths: [], glob: ['%ProgramFiles%\\Adobe\\Adobe Illustrator*\\Support Files\\Contents\\Windows\\Illustrator.exe'], lnk: ['Adobe Illustrator', 'Illustrator'] } },
    { kind: 'exe', id: 'word', name: '워드', icon: '📝', find: { exe: 'WINWORD.EXE', paths: ['%ProgramFiles%\\Microsoft Office\\root\\Office16\\WINWORD.EXE', '%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16\\WINWORD.EXE'], lnk: ['Word'] } },
    { kind: 'exe', id: 'excel', name: '엑셀', icon: '📊', find: { exe: 'EXCEL.EXE', paths: ['%ProgramFiles%\\Microsoft Office\\root\\Office16\\EXCEL.EXE', '%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16\\EXCEL.EXE'], lnk: ['Excel'] } },
    { kind: 'col2', name: '번외 수집기', icon: '🧪', find: CHROME_FIND },
    { kind: 'alps', name: 'ALPS 도우미', icon: '🅰', find: CHROME_FIND },
  ];
  const KINDS = { chrome: '크롬', folder: '폴더', phone: '휴대폰과 연결', crd: '원격 데스크톱', claude: 'Claude', exe: '프로그램', web: '웹 주소 창', col2: '번외 수집기 창', alps: 'ALPS 도우미 창' };
  /* 배치(인스턴스)마다 따로 가지는 칸 — settings.js가 같은 목록으로 검사 */
  const KIND_FIELDS = { chrome: ['urls', 'windows', 'profile'], folder: ['paths'], phone: [], crd: ['url', 'profile'], web: ['url', 'profile'], claude: ['mode', 'room', 'artifact', 'how', 'folder', 'profile'], exe: ['exe', 'file'], col2: [], alps: [] };
  /* 처음 설정의 프로그램 목록(틀) */
  function defaultApps() { return CATALOG.map((c) => ({ id: c.id || c.kind, kind: c.kind, name: c.name, icon: c.icon, ...(c.def ? JSON.parse(JSON.stringify(c.def)) : {}), ...(c.kind === 'exe' ? { exe: '', file: '' } : {}) })); }
  const catOf = (a) => CATALOG.find((c) => (c.id || c.kind) === a.id) || CATALOG.find((c) => c.kind === a.kind && !c.id) || null;
  /* 찾을 단서(PowerShell 'find'에 넘김) — 사람이 고른 실행 파일(exe)이 있으면 그것이 먼저 */
  function findHints(apps) { const out = []; const seen = new Set(); for (const a of apps) { const c = catOf(a); const f = c && c.find; if (a.kind === 'exe' && a.exe) continue; if (!f || !(f.exe || f.paths || f.lnk)) continue; const key = f.exe || a.id; if (seen.has(key)) continue; seen.add(key); out.push({ key, exe: f.exe || '', paths: f.paths || [], glob: f.glob || [], uninst: f.uninst || [], lnk: f.lnk || [] }); } return out; }
  const keyOf = (a) => { const c = catOf(a); return (c && c.find && c.find.exe) || a.id; };
  /* 배치 하나의 실제 설정 = 틀 + 배치 자기 값(빈 값은 틀을 따름) · 이름은 배치 이름 */
  function instApp(tpl, p) { const o = (p && p.o) || {}; const a = { ...tpl };
    for (const f of KIND_FIELDS[tpl.kind] || []) { const v = o[f]; if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue; a[f] = Array.isArray(v) ? v.slice() : v; }
    if (p && p.name) a.name = p.name; return a; }
  /* 틀에서 새 배치의 처음 설정(놓을 때 한 번 복사 — 그 뒤로는 따로) */
  function newInstO(tpl) { const o = {}; for (const f of KIND_FIELDS[tpl.kind] || []) { const v = tpl[f]; if (v == null || v === '') continue; o[f] = Array.isArray(v) ? v.slice() : v; } return o; }
  /* claude.ai 대화 주소·번호 → 번호 */
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  function claudeUrls(a) { const room = String(a.room || '').trim(); const art = String(a.artifact || '').trim(); const out = { uri: '', web: [] };
    if (a.mode === 'code') { if (/^https:\/\/claude\.ai\/code\//.test(room)) out.web.push(room); else out.uri = 'claude://code/new' + (a.folder ? '?folder=' + encodeURIComponent(a.folder) : ''); }
    else { const m = UUID.exec(room); if (m) out.uri = 'claude://claude.ai/chat/' + m[0].toLowerCase(); else if (room) out.uri = ''; else out.uri = 'claude://claude.ai/new'; }
    if (a.how === 'web') { if (out.uri) { out.web.unshift(out.uri.replace(/^claude:\/\/claude\.ai\//, 'https://claude.ai/').replace(/^claude:\/\/code\/new.*/, 'https://claude.ai/code')); out.uri = ''; } }
    if (/^https:\/\//.test(art)) out.web.push(art); return out; }
  const procOf = (p) => String(p || '').split(/[\\/]/).pop().replace(/\.exe$/i, '');
  const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const leafOf = (p) => String(p || '').replace(/[\\/]+$/, '').split(/[\\/]/).pop() || String(p || '');
  /* (0.1.6) 크롬 창 제목 단서 — 주소의 사이트 이름(알려진 곳) + 주소 이름(불러오는 동안 크롬 제목은 주소) · 정규식 · 대소문자 무시 */
  const HOST_HINT = [[/(^|\.)readnow\.kr$|^jerrycson\.github\.io$/, '리드나우|ReadNow'], [/(^|\.)claude\.ai$/, 'Claude'], [/^remotedesktop\.google\.com$/, '원격 데스크톱|Remote Desktop'], [/(^|\.)aladin\.co\.kr$/, '알라딘|Aladin'], [/(^|\.)yes24\.com$/, '예스24|YES24'], [/(^|\.)naver\.com$/, '네이버|NAVER']];
  function titleHint(u) { let h = ''; try { h = new URL(String(u || '')).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } if (!h) return ''; const k = HOST_HINT.find(([re]) => re.test(h)); return (k ? k[1] + '|' : '') + reEsc(h); }
  /* 사람이 알아듣는 말 — 건너뛴 까닭(why) → 할 일(todo) */
  const TODO = [
    [/실행 파일을 못 찾음/, '①에서 그 배치를 눌러 실행 파일 경로 넣기(탐색기에서 Shift+오른쪽 단추 › 경로로 복사)'],
    [/크롬 실행 파일/, '크롬이 설치돼 있는지 확인 — 없으면 크롬을 깔고 다시'],
    [/모니터가 지금 연결돼 있지 않음/, '그 모니터를 연결하면 다음부터 놓음(설정은 그대로)'],
    [/칸이 모니터 밖/, '①에서 그 배치를 다시 놓기'],
    [/주소가 없음/, '①에서 그 배치에 주소 넣기'],
    [/폴더 경로가 없음/, '①에서 그 배치에 폴더 넣기'],
    [/목록에 없는/, '①에서 다시 놓기']];
  const todoOf = (why) => { const t = TODO.find(([re]) => re.test(why || '')); return t ? t[1] : ''; };
  /* 실행 계획 — PowerShell 'run'에 그대로 넘기는 차례표
   *  cfg: 설정 · mons: 지금 모니터 · found: { 찾기 열쇠: 실행 파일 경로 } · G: grid.js
   *  돌려줌 { steps:[{ key, app, inst, name, rect, launch:{ file, args[], expand } | { uri } | null, match:{ procs[], cls, title, fresh }, reuse, tabs? }], skipped:[{ app, why, todo }] } */
  function buildPlan(cfg, mons, found, G) { const steps = [], skipped = []; found = found || {}; const base = G.baseOf(cfg.base);
    const monById = {}; mons.forEach((m, i) => { monById[m.id] = m; monById['#' + i] = m; });
    const chrome = found['chrome.exe'] || '';
    const skip = (name, why) => skipped.push({ app: name, why, todo: todoOf(why) });
    for (const p of cfg.place || []) { const tpl = (cfg.apps || []).find((x) => x.id === p.app); if (!tpl) { skip(p.name || p.app, '목록에 없는 프로그램'); continue; }
      const a = instApp(tpl, p);
      const m = monById[p.mon]; if (!m) { skip(a.name, '그 모니터가 지금 연결돼 있지 않음'); continue; }
      const mo = (cfg.mons && cfg.mons[p.mon]) || {}; const g = G.gridOf(m, mo.grid, base); if (!G.inGrid(p, g)) { skip(a.name, '칸이 모니터 밖(칸 수가 바뀜) — 설정에서 다시 놓아 주세요'); continue; }
      const rc = G.cellRect(m, g, p.c, p.r, p.w, p.h); const reuse = cfg.run ? cfg.run.reuse !== false : true; const base1 = { app: tpl.id, inst: p.id || '', name: a.name };
      /* (0.1.6 · 정범님 11/14 15:36 「웹앱 창이 정범 노트 모니터로 · 번외가 엉뚱한 자리로」) 크롬 단계는 하나씩 띄우고(seq) 띄운 바로 뒤 새로 생긴 창만 그 단계가 집음
       *  udd '' = 평소 크롬 프로필(--user-data-dir 없음)만 · uddNot = 우리 도우미 크롬(…\ReadNow\… 프로필 — PC 배치·번외·ALPS)은 빼고 · hint = 첫 주소의 사이트 이름·주소(제목이 맞는 창을 먼저) */
      const chromeStep = (rect, args, url) => chrome ? { ...base1, rect, reuse: false, launch: { file: chrome, args }, match: { procs: ['chrome'], cls: 'Chrome_WidgetWin_1', title: '', fresh: true, seq: true, udd: '', uddNot: '\\\\readnow\\\\', hint: titleHint(url) } } : null;
      const prof = (x) => (x.profile ? ['--profile-directory=' + x.profile] : []);
      if (a.kind === 'chrome') { const urls = (a.urls || []).filter((u) => /^https?:\/\//.test(u)); const R = G.splitRect(rc, a.windows || 1);
        if (!chrome) { skip(a.name, '크롬 실행 파일을 못 찾음'); continue; }
        R.forEach((r) => steps.push(chromeStep(r, [...prof(a), '--new-window', ...(urls.length ? urls : ['about:blank'])], urls[0]))); continue; }
      if (a.kind === 'crd' || a.kind === 'web') { const u = a.url || ''; if (!/^https:\/\//.test(u)) { skip(a.name, '주소가 없음'); continue; } const s = chromeStep(rc, [...prof(a), '--app=' + u], u); if (!s) { skip(a.name, '크롬 실행 파일을 못 찾음'); continue; } steps.push(s); continue; }
      if (a.kind === 'col2' || a.kind === 'alps') { const H = HELPER_WIN[a.kind]; if (!chrome) { skip(a.name, '크롬 실행 파일을 못 찾음'); continue; }
        /* 떠 있으면(제목으로 알아봄) 새로 안 띄우고 자리만 — 그 도우미가 띄우는 것과 같은 프로필·주소 */
        steps.push({ ...base1, rect: rc, reuse: true, launch: { file: chrome, args: ['--user-data-dir=' + H.prof, '--app=' + H.url, '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble', ...H.extra], expand: true }, match: { procs: ['chrome'], cls: 'Chrome_WidgetWin_1', title: H.title, fresh: false, seq: true, udd: H.prof, hint: H.title }, helper: a.kind }); continue; } /* (0.1.6) udd = 그 도우미 크롬 프로필 — 제목이 아직 안 바뀌었어도(불러오는 중) 프로필로 알아봄 · 평소 크롬 단계가 이 창을 집지 않음 */
      if (a.kind === 'folder') { const P = (a.paths && a.paths.length ? a.paths : a.path ? [a.path] : []).filter(Boolean); if (!P.length) { skip(a.name, '폴더 경로가 없음'); continue; }
        const tabs = P.slice(1).map((x) => ({ path: x, leaf: leafOf(x) }));
        /* 탭이 여럿이면 언제나 새 창(이미 떠 있는 창에 탭을 거듭 더하지 않게) */
        /* (0.1.5) folder = 펼치기 전 경로 — PowerShell이 %변수%를 펼치고 끝 \를 정리해 실행 인자로 · 없는 폴더는 '홈'을 여는 대신 건너뜀 · 창은 그 경로를 보는 탐색기 창만 집음(제목 조건 없이) */
        steps.push({ ...base1, rect: rc, reuse: tabs.length ? false : reuse, folder: P[0], launch: { file: 'explorer.exe', args: [P[0]] }, match: { procs: ['explorer'], cls: 'CabinetWClass', title: '', fresh: !!tabs.length }, ...(tabs.length ? { tabs } : {}) }); continue; }
      if (a.kind === 'phone') { steps.push({ ...base1, rect: rc, reuse, launch: { file: 'explorer.exe', args: [catOf(a).find.shell] }, match: { procs: [], cls: '', title: '휴대폰과 연결|Phone Link', fresh: false } }); continue; }
      if (a.kind === 'claude') { const U = claudeUrls(a); const exe = found['claude.exe'] || '';
        if (U.uri) steps.push({ ...base1, rect: U.web.length ? G.splitRect(rc, 1 + U.web.length)[0] : rc, reuse, launch: { uri: U.uri }, match: { procs: ['claude'], cls: '', title: 'Claude', fresh: false } });
        else if (!U.web.length && exe) steps.push({ ...base1, rect: rc, reuse, launch: { file: exe, args: [] }, match: { procs: ['claude'], cls: '', title: 'Claude', fresh: false } });
        if (U.web.length) { const R = G.splitRect(rc, (U.uri ? 1 : 0) + U.web.length).slice(U.uri ? 1 : 0); U.web.forEach((u, i) => { const s = chromeStep(R[i], [...prof(a), '--app=' + u], u); if (s) steps.push({ ...s, name: a.name + (i ? ' 아티팩트' : '') }); else skip(a.name, '크롬 실행 파일을 못 찾음(웹으로 열기)'); }); }
        continue; }
      if (a.kind === 'exe') { const exe = a.exe || found[keyOf(a)] || ''; if (!exe) { skip(a.name, '실행 파일을 못 찾음'); continue; } const c = catOf(a);
        steps.push({ ...base1, rect: rc, reuse, launch: { file: exe, args: a.file ? [a.file] : [] }, match: { procs: [procOf(exe)], cls: '', title: (c && c.match && c.match.title) || '', fresh: false, ...(c && c.match && c.match.hidden ? { hidden: c.match.hidden, hcls: c.match.hcls || '' } : {}) } }); continue; }
      skip(a.name, '모르는 종류'); }
    return { steps: steps.filter(Boolean), skipped }; }
  /* (0.1.6) 먼저 닫을 프로그램 = 이번 단계들의 프로세스 이름(크롬·Claude·카카오톡·탐색기 폴더 창 등) · 번외·ALPS 도우미 창은 빼고(자리만) · 휴대폰과 연결은 이름 조건만이라 뺌 */
  function closeProcs(steps) { const S = new Set(); for (const s of steps || []) { if (s.helper) continue; for (const p of (s.match && s.match.procs) || []) if (p) S.add(p); } return [...S]; }
  /* PowerShell이 돌려준 결과 한 줄 → 사람이 알아듣는 말 + 원문(접어 둠) */
  function friendly(r) { const how = String((r && r.how) || ''); const nm = (r && r.name) || '';
    if (r && r.ok) return { msg: how, raw: '' };
    if (/^켜기 실패/.test(how)) return { msg: `${nm}: 켜지 못함 → 실행 파일 경로가 맞는지 ①에서 확인`, raw: how };
    if (/창을 못 찾음/.test(how)) return { msg: `${nm}: 켰지만 창이 제때 안 보임 → ①에서 기다리는 시간을 늘리거나, 켜진 창을 직접 옮겨 주세요` + (r.helper ? ' (그 도우미가 꺼져 있을 수 있음)' : ''), raw: how };
    if (/자리 옮기기 실패|놓기 실패/.test(how)) return { msg: `${nm}: 창은 찾았지만 자리를 못 옮김 → 관리자 권한으로 도는 프로그램이면 이 도우미가 옮길 수 없음`, raw: how };
    if (/일이 멈춤|실패/.test(how)) return { msg: `${nm}: 이 프로그램만 멈춤(나머지는 계속) → 다시 ③`, raw: how };
    return { msg: `${nm}: ${how || '안 됨'}`, raw: '' }; }
  /* 실행·배치 전체가 멈춘 글 → 사람 말 */
  function friendlyErr(e) { const s = String(e || ''); if (!s) return { msg: '', raw: '' };
    if (/모니터|screens/i.test(s) && /실패/.test(s)) return { msg: '모니터를 못 읽음 → 잠시 뒤 다시 ③', raw: s };
    if (/^지금 .* 중$/.test(s)) return { msg: s + ' → 끝난 뒤 다시', raw: '' };
    if (/아직 아무것도 놓지 않았습니다|놓을 수 있는 것이 없음|닫을 목록/.test(s)) return { msg: s, raw: '' };
    return { msg: '윈도우 일(PowerShell)이 중간에 멈춤 → 다시 ③ · 또 그러면 이 기록을 보내 주세요', raw: s }; }
  return { CATALOG, KINDS, KIND_FIELDS, HELPER_WIN, KEEP_TITLE, closeProcs, titleHint, defaultApps, catOf, findHints, keyOf, instApp, newInstO, claudeUrls, procOf, leafOf, buildPlan, friendly, friendlyErr, todoOf, UUID };
});
