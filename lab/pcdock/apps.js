/* apps.js — 📋 배치할 프로그램 목록(왼쪽 목록의 기본 열 가지) · 실행 파일 찾는 단서 · 창 알아보는 법 · 실행 계획 만들기
 *  (브라우저 화면과 Node가 함께 씀)
 *  · 찾기 단서: App Paths(레지스트리에 등록된 실행 파일 이름) → 흔한 설치 자리 → 시작 메뉴 바로가기 이름 — PowerShell 'find'가 차례로 봄
 *  · 창 알아보기: 실행하기 전 떠 있던 창을 적어 두고, 실행 뒤 '새로 뜬' 창 중 프로세스 이름·창 종류·제목이 맞는 것
 *    크롬은 언제나 새 창만(이미 떠 있는 크롬 = 리드나우 웹앱·수집기 창일 수 있어 절대 옮기지 않음)
 *  · Claude 앱: claude:// 주소(Claude 도움말 '링크로 Claude 데스크톱 열기')로 대화 방을 엶 — claude://claude.ai/chat/<대화 번호> · 코드 새 세션 claude://code/new?folder=…
 *    이미 있는 코드 세션·아티팩트를 여는 claude:// 주소는 없음 → 크롬 앱 창(claude.ai 주소)으로 엶 */
(function (root, factory) { const M = factory(); if (typeof module === 'object' && module.exports) module.exports = M; else root.PDApps = M; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CHROME_FIND = { exe: 'chrome.exe', paths: ['%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe', '%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe', '%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe'], lnk: ['Google Chrome', 'Chrome'] };
  /* kind별 뼈대 — 목록에 처음 놓이는 열 가지 */
  const CATALOG = [
    { kind: 'chrome', name: '크롬', icon: '🌐', find: CHROME_FIND, def: { urls: ['https://readnow.kr/app/'], windows: 1, profile: '' } },
    { kind: 'folder', name: '윈도우 폴더', icon: '📁', def: { path: 'D:\\ReadNow' } },
    { kind: 'phone', name: '휴대폰과 연결', icon: '📱', find: { shell: 'shell:AppsFolder\\Microsoft.YourPhone_8wekyb3d8bbwe!App' } },
    { kind: 'crd', name: 'Chrome 원격 데스크톱', icon: '🖥', find: CHROME_FIND, def: { url: 'https://remotedesktop.google.com/access' } },
    { kind: 'claude', name: 'Claude 앱', icon: '✳', find: { exe: 'claude.exe', paths: ['%LOCALAPPDATA%\\AnthropicClaude\\claude.exe', '%LOCALAPPDATA%\\Programs\\Claude\\Claude.exe'], lnk: ['Claude'] }, def: { mode: 'chat', room: '', artifact: '', how: 'app' } },
    { kind: 'exe', id: 'kakao', name: '카카오톡', icon: '💬', find: { exe: 'KakaoTalk.exe', paths: ['%ProgramFiles(x86)%\\Kakao\\KakaoTalk\\KakaoTalk.exe', '%ProgramFiles%\\Kakao\\KakaoTalk\\KakaoTalk.exe'], lnk: ['카카오톡', 'KakaoTalk'] }, match: { title: '카카오톡|KakaoTalk' } },
    { kind: 'exe', id: 'photoshop', name: '포토샵', icon: '🎨', find: { exe: 'Photoshop.exe', paths: [], glob: ['%ProgramFiles%\\Adobe\\Adobe Photoshop*\\Photoshop.exe'], lnk: ['Adobe Photoshop', 'Photoshop'] } },
    { kind: 'exe', id: 'illustrator', name: '일러스트레이터', icon: '✒', find: { exe: 'Illustrator.exe', paths: [], glob: ['%ProgramFiles%\\Adobe\\Adobe Illustrator*\\Support Files\\Contents\\Windows\\Illustrator.exe'], lnk: ['Adobe Illustrator', 'Illustrator'] } },
    { kind: 'exe', id: 'word', name: '워드', icon: '📝', find: { exe: 'WINWORD.EXE', paths: ['%ProgramFiles%\\Microsoft Office\\root\\Office16\\WINWORD.EXE', '%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16\\WINWORD.EXE'], lnk: ['Word'] } },
    { kind: 'exe', id: 'excel', name: '엑셀', icon: '📊', find: { exe: 'EXCEL.EXE', paths: ['%ProgramFiles%\\Microsoft Office\\root\\Office16\\EXCEL.EXE', '%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16\\EXCEL.EXE'], lnk: ['Excel'] } },
  ];
  const KINDS = { chrome: '크롬', folder: '폴더', phone: '휴대폰과 연결', crd: '원격 데스크톱', claude: 'Claude', exe: '프로그램', web: '웹 주소 창' };
  /* 처음 설정의 프로그램 목록 */
  function defaultApps() { return CATALOG.map((c) => ({ id: c.id || c.kind, kind: c.kind, name: c.name, icon: c.icon, ...(c.def ? JSON.parse(JSON.stringify(c.def)) : {}), ...(c.kind === 'exe' ? { exe: '', file: '' } : {}) })); }
  const catOf = (a) => CATALOG.find((c) => (c.id || c.kind) === a.id) || CATALOG.find((c) => c.kind === a.kind && !c.id) || null;
  /* 찾을 단서(PowerShell 'find'에 넘김) — 사람이 고른 실행 파일(exe)이 있으면 그것이 먼저 */
  function findHints(apps) { const out = []; const seen = new Set(); for (const a of apps) { const c = catOf(a); const f = c && c.find; if (a.kind === 'exe' && a.exe) continue; if (!f || !(f.exe || f.paths || f.lnk)) continue; const key = f.exe || a.id; if (seen.has(key)) continue; seen.add(key); out.push({ key, exe: f.exe || '', paths: f.paths || [], glob: f.glob || [], lnk: f.lnk || [] }); } return out; }
  const keyOf = (a) => { const c = catOf(a); return (c && c.find && c.find.exe) || a.id; };
  /* claude.ai 대화 주소·번호 → 번호 */
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  function claudeUrls(a) { const room = String(a.room || '').trim(); const art = String(a.artifact || '').trim(); const out = { uri: '', web: [] };
    if (a.mode === 'code') { if (/^https:\/\/claude\.ai\/code\//.test(room)) out.web.push(room); else out.uri = 'claude://code/new' + (a.folder ? '?folder=' + encodeURIComponent(a.folder) : ''); }
    else { const m = UUID.exec(room); if (m) out.uri = 'claude://claude.ai/chat/' + m[0].toLowerCase(); else if (room) out.uri = ''; else out.uri = 'claude://claude.ai/new'; }
    if (a.how === 'web') { if (out.uri) { out.web.unshift(out.uri.replace(/^claude:\/\/claude\.ai\//, 'https://claude.ai/').replace(/^claude:\/\/code\/new.*/, 'https://claude.ai/code')); out.uri = ''; } }
    if (/^https:\/\//.test(art)) out.web.push(art); return out; }
  const procOf = (p) => String(p || '').split(/[\\/]/).pop().replace(/\.exe$/i, '');
  /* 실행 계획 — PowerShell 'run'에 그대로 넘기는 차례표
   *  cfg: 설정 · mons: 지금 모니터 · found: { 찾기 열쇠: 실행 파일 경로 } · G: grid.js
   *  돌려줌 { steps:[{ key, app, name, rect, launch:{ file, args[] } | { uri } | null, match:{ procs[], cls, title, fresh } , reuse }], skipped:[{ app, why }] } */
  function buildPlan(cfg, mons, found, G) { const steps = [], skipped = []; found = found || {}; const base = G.baseOf(cfg.base);
    const monById = {}; mons.forEach((m, i) => { monById[m.id] = m; monById['#' + i] = m; });
    const chrome = found['chrome.exe'] || '';
    for (const p of cfg.place || []) { const a = (cfg.apps || []).find((x) => x.id === p.app); if (!a) { skipped.push({ app: p.app, why: '목록에 없는 프로그램' }); continue; }
      const m = monById[p.mon]; if (!m) { skipped.push({ app: a.name, why: '그 모니터가 지금 연결돼 있지 않음' }); continue; }
      const mo = (cfg.mons && cfg.mons[p.mon]) || {}; const g = G.gridOf(m, mo.grid, base); if (!G.inGrid(p, g)) { skipped.push({ app: a.name, why: '칸이 모니터 밖(칸 수가 바뀜) — 설정에서 다시 놓아 주세요' }); continue; }
      const rc = G.cellRect(m, g, p.c, p.r, p.w, p.h); const reuse = cfg.run ? cfg.run.reuse !== false : true; const base1 = { app: a.id, name: a.name };
      const chromeStep = (rect, args, title) => chrome ? { ...base1, rect, reuse: false, launch: { file: chrome, args }, match: { procs: ['chrome'], cls: 'Chrome_WidgetWin_1', title: title || '', fresh: true } } : null;
      const prof = (x) => (x.profile ? ['--profile-directory=' + x.profile] : []);
      if (a.kind === 'chrome') { const urls = (a.urls || []).filter((u) => /^https?:\/\//.test(u)); const R = G.splitRect(rc, a.windows || 1);
        if (!chrome) { skipped.push({ app: a.name, why: '크롬 실행 파일을 못 찾음' }); continue; }
        R.forEach((r) => steps.push(chromeStep(r, [...prof(a), '--new-window', ...(urls.length ? urls : ['about:blank'])]))); continue; }
      if (a.kind === 'crd' || a.kind === 'web') { const u = a.url || ''; if (!/^https:\/\//.test(u)) { skipped.push({ app: a.name, why: '주소가 없음' }); continue; } const s = chromeStep(rc, [...prof(a), '--app=' + u]); if (!s) { skipped.push({ app: a.name, why: '크롬 실행 파일을 못 찾음' }); continue; } steps.push(s); continue; }
      if (a.kind === 'folder') { if (!a.path) { skipped.push({ app: a.name, why: '폴더 경로가 없음' }); continue; } const leaf = String(a.path).replace(/[\\/]+$/, '').split(/[\\/]/).pop();
        steps.push({ ...base1, rect: rc, reuse, launch: { file: 'explorer.exe', args: [a.path] }, match: { procs: ['explorer'], cls: 'CabinetWClass', title: '(^|\\\\)' + leaf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', fresh: false } }); continue; }
      if (a.kind === 'phone') { steps.push({ ...base1, rect: rc, reuse, launch: { file: 'explorer.exe', args: [catOf(a).find.shell] }, match: { procs: [], cls: '', title: '휴대폰과 연결|Phone Link', fresh: false } }); continue; }
      if (a.kind === 'claude') { const U = claudeUrls(a); const exe = found['claude.exe'] || '';
        if (U.uri) steps.push({ ...base1, rect: U.web.length ? G.splitRect(rc, 1 + U.web.length)[0] : rc, reuse, launch: { uri: U.uri }, match: { procs: ['claude'], cls: '', title: 'Claude', fresh: false } });
        else if (!U.web.length && exe) steps.push({ ...base1, rect: rc, reuse, launch: { file: exe, args: [] }, match: { procs: ['claude'], cls: '', title: 'Claude', fresh: false } });
        if (U.web.length) { const R = G.splitRect(rc, (U.uri ? 1 : 0) + U.web.length).slice(U.uri ? 1 : 0); U.web.forEach((u, i) => { const s = chromeStep(R[i], [...prof(a), '--app=' + u]); if (s) steps.push({ ...s, name: a.name + (i ? ' 아티팩트' : '') }); else skipped.push({ app: a.name, why: '크롬 실행 파일을 못 찾음(웹으로 열기)' }); }); }
        continue; }
      if (a.kind === 'exe') { const exe = a.exe || found[keyOf(a)] || ''; if (!exe) { skipped.push({ app: a.name, why: '실행 파일을 못 찾음 — 설정에서 경로를 넣어 주세요' }); continue; } const c = catOf(a);
        steps.push({ ...base1, rect: rc, reuse, launch: { file: exe, args: a.file ? [a.file] : [] }, match: { procs: [procOf(exe)], cls: '', title: (c && c.match && c.match.title) || '', fresh: false } }); continue; }
      skipped.push({ app: a.name, why: '모르는 종류' }); }
    return { steps: steps.filter(Boolean), skipped }; }
  return { CATALOG, KINDS, defaultApps, catOf, findHints, keyOf, claudeUrls, procOf, buildPlan, UUID };
});
