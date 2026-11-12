/* t_unit — 칸 셈(여러 모니터 비율 → 칸 수) · 설정 검사 · 실행 계획 · 정리 보호 목록 (실행 없이 셈만)
 * 실행: node lab/pcdock/tests/t_unit.js */
'use strict';
const G = require('../grid.js'), SET = require('../settings.js'), A = require('../apps.js'), CL = require('../clean.js');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x) : '')); } };
const M = (w, h, x, y, dpi, id) => ({ id: id || 'M' + w, b: { x: x || 0, y: y || 0, w, h }, wa: { x: x || 0, y: y || 0, w, h: h - 40 }, dpi: dpi || 96 });
const g = (m, o, b) => { const r = G.gridOf(m, o, b); return r.cols + 'x' + r.rows; };

console.log('① 칸 수 — 일반(16:9)=4×3 · 더 넓으면 가로 칸이 늘어남');
ok(g(M(1920, 1080)) === '4x3' && g(M(3840, 2160)) === '4x3' && g(M(1366, 768)) === '4x3', '16:9(FHD·4K·1366)는 4×3 — 해상도·배율과 상관없이 비율만');
ok(g(M(2560, 1080)) === '5x3', '21:9(2560×1080) — 일반보다 가로 1칸만큼 넓음 → 5×3', g(M(2560, 1080)));
ok(g(M(3440, 1440)) === '5x3', '21:9(3440×1440) → 5×3');
ok(g(M(3840, 1600)) === '5x3', '24:10(3840×1600 · 5.4칸) → 5×3', g(M(3840, 1600)));
ok(g(M(3840, 1080)) === '8x3' && g(M(5120, 1440)) === '8x3', '32:9 → 8×3(일반 두 대 너비)');
ok(g(M(1920, 1200)) === '4x3' && g(M(1280, 1024)) === '3x3', '16:10 → 4×3 · 5:4(1280×1024) → 3×3', [g(M(1920, 1200)), g(M(1280, 1024))]);
ok(g(M(1080, 1920)) === '3x4' && g(M(1440, 2560)) === '3x4', '세로로 세운 16:9 → 3×4(세로 칸이 늘어남)');
ok(g(M(1920, 1080), 'auto', { aw: 4, ah: 3 }) === '5x3' && g(M(1600, 1200), 'auto', { aw: 4, ah: 3 }) === '4x3', '기준을 4:3으로 바꾸면 4:3 모니터가 4×3 · 16:9는 5×3');
ok(g(M(1920, 1080), 'fine') === '8x6' && g(M(2560, 1080), 'fine') === '10x6', '더 잘게(두 배) — 8×6 · 10×6');
ok(g(M(1920, 1080), '2x2') === '2x2' && g(M(1920, 1080), '3x2') === '3x2' && g(M(1920, 1080), '2x1') === '2x1' && g(M(1920, 1080), '8x6') === '8x6', '미리 정한 값 8×6·3×2·2×2·2×1');
ok(g(M(1920, 1080), { cols: 7, rows: 5 }) === '7x5' && g(M(1920, 1080), { cols: 99, rows: 0 }) === '24x1' && g(M(1920, 1080), 'zz') === '4x3', '직접 입력(1~24로 자름) · 모르는 값은 기본');

console.log('② 칸 → 화면 자리(실제 화소 · 틈·겹침 없음 · 작업 표시줄 뺀 곳)');
{ const m = M(1920, 1080, 1920, 0); const gr = G.gridOf(m, '3x2'); const R = []; for (let r = 0; r < gr.rows; r++) for (let c = 0; c < gr.cols; c++) R.push(G.cellRect(m, gr, c, r));
  const area = R.reduce((s, x) => s + x.w * x.h, 0); ok(area === 1920 * 1040, '칸을 다 더하면 일하는 칸 넓이와 같음(1920×1040)', area);
  ok(R[0].x === 1920 && R[0].y === 0 && R[1].x === R[0].x + R[0].w && R[2].x + R[2].w === 3840 && R[3].y === R[0].h, '이웃 칸이 같은 선을 나눠 씀(틈 없음)', R.slice(0, 4));
  const big = G.cellRect(m, gr, 1, 0, 2, 2); ok(big.x === 2560 && big.w === 1280 && big.h === 1040, '여러 칸에 걸친 덩이(2×2) 자리', big);
  const m3 = M(1920, 1080, 0, 0); const r7 = G.cellRect(m3, { cols: 7, rows: 3 }, 0, 0, 7, 3); ok(r7.w === 1920 && r7.h === 1040, '나누어떨어지지 않아도(7칸) 끝이 맞음'); }
{ const s = G.splitRect({ x: 0, y: 0, w: 1000, h: 500 }, 3); ok(s.length === 3 && s[0].w + s[1].w + s[2].w === 1000 && s[2].x + s[2].w === 1000, '크롬 창 3개 — 넓은 덩이는 가로로 나눔'); const v = G.splitRect({ x: 0, y: 0, w: 400, h: 900 }, 2); ok(v[1].y === 450 && v[0].w === 400, '높은 덩이는 세로로 나눔'); }
ok(G.overlaps([{ mon: 'a', c: 0, r: 0, w: 2, h: 2 }, { mon: 'a', c: 1, r: 1, w: 1, h: 1 }, { mon: 'b', c: 0, r: 0, w: 1, h: 1 }, { mon: 'a', c: 2, r: 0, w: 1, h: 1 }]).length === 1, '겹침 찾기 — 같은 모니터에서 덮이는 것만');
ok(G.inGrid({ c: 3, r: 2, w: 1, h: 1 }, { cols: 4, rows: 3 }) && !G.inGrid({ c: 3, r: 2, w: 2, h: 1 }, { cols: 4, rows: 3 }) && !G.inGrid({ c: -1, r: 0, w: 1, h: 1 }, { cols: 4, rows: 3 }), '칸 안/밖');
{ const mons = [M(1920, 1080, 0, 0), M(2560, 1080, 1920, 0), M(3840, 2160, -3840, -500)]; const v = G.view(mons, 900, 400, 10); const b = v.mons.map((x) => x.b);
  ok(b.every((x) => x.x >= 10 && x.y >= 10 && x.x + x.w <= 890 && x.y + x.h <= 390), '배치도 — 모든 모니터가 그림 안에', b);
  ok(Math.abs(b[2].w / b[0].w - 2) < 0.02 && b[2].x + b[2].w <= b[0].x + 1 && b[1].x >= b[0].x + b[0].w - 1, '실제 상대 크기·위치대로(4K는 FHD 두 배 너비 · 왼쪽 · 울트라와이드는 오른쪽)'); }
ok(G.scaleOf({ dpi: 144 }) === 150 && G.scaleOf({ dpi: 96 }) === 100, '배율 % (DPI 144 = 150%)');

console.log('③ 설정 검사(저장 전)');
const mons = [M(1920, 1080, 0, 0, 96, 'D1'), M(2560, 1080, 1920, 0, 96, 'D2')];
{ const v = SET.validate(SET.defaults(), mons); ok(v.ok && v.cfg.apps.length === 10 && v.cfg.mons.D1.cols === 4 && v.cfg.mons.D2.cols === 5, '기본 설정 — 프로그램 열 가지 · 모니터 칸 수 채움', v.errs); }
{ const c = SET.defaults(); c.apps[0].password = 'x'; const v = SET.validate(c, mons); ok(!v.ok && v.errs.some((e) => /비밀값/.test(e)), '비밀번호 같은 칸은 저장 거절'); }
{ const c = SET.defaults(); c.apps[0].urls = ['javascript:alert(1)']; ok(!SET.validate(c, mons).ok, 'http(s) 아닌 주소 거절'); }
{ const c = SET.defaults(); c.place = [{ app: 'chrome', mon: 'D1', c: 0, r: 0, w: 2, h: 2 }, { app: 'kakao', mon: 'D1', c: 1, r: 1, w: 1, h: 1 }]; const v = SET.validate(c, mons); ok(!v.ok && v.errs.some((e) => /한 칸에 둘/.test(e)), '겹쳐 놓기 거절(한 칸에 하나)'); }
{ const c = SET.defaults(); c.place = [{ app: 'kakao', mon: 'D1', c: 4, r: 0, w: 1, h: 1 }]; ok(!SET.validate(c, mons).ok, '칸 밖(4×3의 5번째 칸) 거절'); c.place = [{ app: 'kakao', mon: 'D2', c: 4, r: 0, w: 1, h: 1 }]; ok(SET.validate(c, mons).ok, '울트라와이드는 5번째 칸이 있음'); }
{ const c = SET.defaults(); c.place = [{ app: 'nope', mon: 'D1', c: 0, r: 0, w: 1, h: 1 }]; ok(!SET.validate(c, mons).ok, '목록에 없는 프로그램을 놓으면 거절'); }
{ const c = SET.defaults(); c.apps.push({ id: 'x1', kind: 'exe', name: '나쁜 경로', exe: '..\\..\\a.exe' }); ok(!SET.validate(c, mons).ok, '경로 꼴 검사(드라이브로 시작 · .. 금지)'); }
{ const c = SET.defaults(); c.mons = { OLD: { grid: '2x2', w: 1920, h: 1080 } }; c.place = [{ app: 'kakao', mon: 'OLD', c: 1, r: 1, w: 1, h: 1 }]; const v = SET.validate(c, mons); ok(v.ok && v.cfg.mons.OLD.cols === 2 && v.cfg.place.length === 1, '지금 연결 안 된 모니터의 자리도 그대로 둠(저장해 둔 크기로 칸 검사)', v.errs); }
{ const c = SET.defaults(); c.auto = { on: true, delaySec: 0 }; ok(SET.validate(c, mons).cfg.auto.delaySec === 0, '기다림 0초도 됨'); c.auto = { delaySec: 'x' }; ok(SET.validate(c, mons).cfg.auto.delaySec === 20, '이상한 값이면 20초'); }
{ ok(!SET.validate(null).ok && !SET.validate([]).ok, '빈 값·배열 거절'); const big = SET.defaults(); big.apps[0].urls = Array.from({ length: 30 }, () => 'https://x.kr/' + 'a'.repeat(590)); big.apps = Array.from({ length: 20 }, (_, i) => ({ ...big.apps[0], id: 'c' + i })); ok(!SET.validate(big, mons).ok, '200KB 넘으면 거절'); }

console.log('④ 실행 계획');
{ const c = SET.validate(SET.defaults(), mons).cfg; c.apps.find((a) => a.id === 'chrome').windows = 2; c.apps.find((a) => a.id === 'claude').room = 'https://claude.ai/chat/0b9f3a10-1111-2222-3333-444455556666';
  c.place = [{ app: 'chrome', mon: 'D1', c: 0, r: 0, w: 4, h: 2 }, { app: 'kakao', mon: 'D2', c: 4, r: 0, w: 1, h: 1 }, { app: 'claude', mon: 'D2', c: 0, r: 0, w: 2, h: 2 }, { app: 'folder', mon: 'D1', c: 0, r: 2, w: 1, h: 1 }, { app: 'word', mon: 'D1', c: 1, r: 2, w: 1, h: 1 }, { app: 'excel', mon: 'GONE', c: 0, r: 0, w: 1, h: 1 }];
  const found = { 'chrome.exe': 'C:\\chrome.exe', 'KakaoTalk.exe': 'C:\\Kakao\\KakaoTalk.exe' }; const P = A.buildPlan(c, mons, found, G);
  const ch = P.steps.filter((s) => s.app === 'chrome'); ok(ch.length === 2 && ch.every((s) => s.match.fresh && s.reuse === false && s.launch.args.includes('--new-window')) && ch[0].rect.w === 960 && ch[1].rect.x === 960 && ch[0].rect.h === 693, '크롬 창 2개 — 언제나 새 창만(이미 떠 있는 리드나우 크롬은 안 옮김) · 덩이를 나눠 씀', ch.map((s) => s.rect));
  const k = P.steps.find((s) => s.app === 'kakao'); ok(k && k.rect.x === 1920 + 2048 && k.rect.w === 512 && k.match.procs[0] === 'KakaoTalk' && k.reuse, '카카오톡 — 울트라와이드 5번째 칸 · 떠 있으면 자리만', k && k.rect);
  const cl = P.steps.find((s) => s.app === 'claude'); ok(cl && cl.launch.uri === 'claude://claude.ai/chat/0b9f3a10-1111-2222-3333-444455556666', 'Claude 채팅 방 — claude:// 링크로', cl && cl.launch);
  const f = P.steps.find((s) => s.app === 'folder'); ok(f && f.launch.file === 'explorer.exe' && f.launch.args[0] === 'D:\\ReadNow' && new RegExp(f.match.title).test('ReadNow') && new RegExp(f.match.title).test('D:\\ReadNow') && !new RegExp(f.match.title).test('ReadNowX'), '폴더 — 탐색기 · 제목(폴더 이름·전체 경로)으로 찾음');
  ok(P.skipped.some((s) => s.app === '워드' && /실행 파일/.test(s.why)) && P.skipped.some((s) => s.app === '엑셀' && /연결/.test(s.why)), '못 찾은 실행 파일·빠진 모니터는 건너뛰고 까닭을 적음', P.skipped); }
{ const U = A.claudeUrls({ mode: 'code', room: 'https://claude.ai/code/session_01ABC', artifact: 'https://claude.ai/artifact/x1' }); ok(!U.uri && U.web.length === 2, '이미 있는 코드 세션·아티팩트는 크롬 앱 창으로(claude:// 링크가 없음)', U);
  const U2 = A.claudeUrls({ mode: 'code', folder: 'D:\\ReadNow' }); ok(U2.uri === 'claude://code/new?folder=D%3A%5CReadNow', '새 코드 세션 — claude://code/new?folder=', U2);
  const U3 = A.claudeUrls({ mode: 'chat', how: 'web', room: '0b9f3a10-1111-2222-3333-444455556666' }); ok(!U3.uri && U3.web[0] === 'https://claude.ai/chat/0b9f3a10-1111-2222-3333-444455556666', '웹으로 열기를 고르면 claude.ai 주소', U3); }

console.log('⑤ PC 정리 — 보호 목록');
ok(['chrome', 'node', 'claude', 'remoting_host', 'MsMpEng', 'spoolsv', 'explorer'].every((x) => CL.isKept({ name: x + '.exe' })), '크롬·Node(번외·인쇄·로거 도우미)·Claude·원격 데스크톱·Defender·인쇄·탐색기는 언제나 보호');
ok(CL.isKept({ name: 'whatever', cmd: 'x --user-data-dir=C:\\x\\col2-al-chrome' }) && CL.isKept({ name: 'tool', path: 'D:\\ReadNow\\bin\\tool.exe' }) && !CL.isKept({ name: 'OneDrive', path: 'C:\\Users\\u\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe' }), '명령 줄·경로에 리드나우·번외(col2) 표시가 들면 보호');
ok(CL.isKept({ name: 'Photoshop' }, [], ['Photoshop']) && CL.isKept({ name: 'foo' }, ['foo']), '배치에 든 프로그램·사람이 더한 이름도 보호');
{ const procs = [{ pid: 1, name: 'OneDrive', cpu: 6, ws: 1e8, path: 'C:\\Users\\u\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe' }, { pid: 2, name: 'chrome', cpu: 40, ws: 2e9 }, { pid: 3, name: 'CCXProcess', cpu: 1, ws: 1e7, path: 'C:\\Program Files\\Adobe\\x.exe' }, { pid: 4, name: 'Photoshop', cpu: 1, ws: 1e9, path: 'C:\\Program Files\\Adobe\\Photoshop.exe' }, { pid: 5, name: 'Game', cpu: 30, ws: 1e8, path: 'D:\\G\\Game.exe' }];
  const pp = CL.procPlan(procs, [], []); ok(pp.stop.map((x) => x.name).join() === 'OneDrive,CCXProcess' && pp.stop.find((x) => x.name === 'CCXProcess').block && !pp.stop.find((x) => x.name === 'OneDrive').block, '끌 후보는 미리 아는 목록만 · 포토샵이 켜져 있으면 Adobe 보조는 막음', pp.stop);
  ok(pp.info.some((x) => x.name === 'Game') && !pp.info.some((x) => x.name === 'chrome'), '모르는 무거운 프로그램은 보기만(끄기 없음) · 크롬은 목록에도 안 나옴'); }
ok(CL.targetsFor(1).map((t) => t.id).join() === 'temp,mem' && CL.targetsFor(2).length > CL.targetsFor(1).length && CL.targetsFor(3).find((t) => t.id === 'temp').ageDays === 2 && CL.targetsFor(2).find((t) => t.id === 'temp').ageDays === 7, '단계 — 가볍게(임시 7일·메모리) · 보통(+캐시·로그·프로그램) · 깊게(임시 2일·시작·Defender 제안)');
ok(CL.PROTECT_PATHS.includes('D:\\ReadNow') && CL.PROTECT_PATHS.some((p) => /Documents/.test(p)) && CL.PROTECT_PATHS.some((p) => /Google$/.test(p)), '보호 경로 — D:\\ReadNow · 문서 · 크롬(프로필·캐시 모두)');
ok(!CL.TARGETS.some((t) => (t.roots || []).some((r) => /SoftwareDistribution|Recycle|\\Google|ReadNow|Documents/i.test(r))), '지울 곳에 윈도우 업데이트 캐시·휴지통·크롬·리드나우·문서가 없음');
ok(CL.trimSkip([]).includes('chrome') && CL.trimSkip(['abc']).includes('abc'), '메모리 비우기에서 크롬(리드나우 탭)은 뺌');
{ const s = CL.startupPlan([{ name: 'OneDrive', cmd: 'OneDrive.exe /background' }, { name: 'ReadNow-Print.lnk', cmd: 'x' }, { name: 'SecurityHealth', cmd: 'SecurityHealthSystray.exe' }, { name: 'Zed', cmd: 'zed.exe' }]); ok(s[0].sug === 'off' && s[1].sug === 'keep' && s[2].sug === 'keep' && s[3].sug === 'look', '시작 프로그램 제안 — 끄면 좋음/그대로/보고 고르기', s.map((x) => x.sug)); }
ok(/Add-MpPreference -ExclusionPath 'D:\\ReadNow'/.test(CL.DEFENDER.cmd('C:\\Users\\u')) && !/Set-MpPreference|DisableRealtime/i.test(JSON.stringify(CL) + CL.DEFENDER.cmd('x')), 'Defender — 검사 제외 명령 글만(끄는 명령 없음)');
console.log(bad ? `✗ t_unit ${bad}/${n} 실패` : `✓ t_unit ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
