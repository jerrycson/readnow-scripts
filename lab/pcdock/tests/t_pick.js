/* t_pick — (0.1.6 · 정범님 11/14 15:36 「웹앱 창이 정범 노트 모니터로 · 번외가 엉뚱한 자리로 · 카카오톡은 안 뜸」)
 *  크롬 단계마다 '자기 창'을 집는지: pcdock-win.cs의 PickNew(창 고르기)를 mono로 실제로 돌려 봄(윈도우 창 목록은 가짜로 만듦)
 *  · 0.1.5 길(다 띄운 뒤 '새로 뜬 아무 크롬 창'을 단계 차례대로 · 창 목록은 맨 위 = 마지막에 뜬 창)이 자리를 뒤집는 것을 이 시험이 재현함
 *  · 0.1.6 길(하나씩 띄우고 띄우기 바로 전 창을 빼고 고름) — 크롬 창 3~4개 서로 다른 주소 · 이미 떠 있는 크롬 섞임 · 번외(도우미 프로필) 창 · 세션 되살림 창 · 이미 잡은 창
 *  · PowerShell(pcdock.ps1)이 크롬 단계를 그 길로 부르는지는 글자로 봄(이 상자엔 PowerShell이 없음)
 * 실행: node lab/pcdock/tests/t_pick.js (mcs·mono 필요 — apt-get install -y mono-mcs mono-runtime) */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 1200) : '')); } };
const R = path.join(__dirname, '..'); const A = require('../apps.js'); const G = require('../grid.js'); const SET = require('../settings.js');
const has = (c) => cp.spawnSync('sh', ['-c', 'command -v ' + c]).status === 0;
if (!has('mcs') || !has('mono')) { if (process.env.PCDOCK_NO_CS) { console.log('  ⚠ mcs·mono 없음 — 건너뜀(PCDOCK_NO_CS)'); process.exit(0); } console.log('  ✗ mcs·mono가 없음 — apt-get install -y mono-mcs mono-runtime'); process.exit(1); }
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockpick-'));
/* 가짜 창 목록으로 PickNew를 부르는 작은 C# 프로그램 — 표준 입력 JSON 한 줄마다 결과 한 줄 */
const HARNESS = `using System; using System.Collections.Generic; using System.Text;
public static class T { static string B(string x) { return x == "~" ? null : Encoding.UTF8.GetString(Convert.FromBase64String(x)); }
  static long[] L(string x) { var o = new List<long>(); foreach (var v in x.Split(',')) if (v.Length > 0) o.Add(long.Parse(v)); return o.ToArray(); }
  public static void Main() { string line; while ((line = Console.ReadLine()) != null) { if (line.Trim().Length == 0) continue;
      var p = line.Split('|');
      if (p[0] == "C") { var cw = new RnDock.Win { H = long.Parse(p[3]), Proc = B(p[4]), Cls = B(p[5]), Title = B(p[6]) ?? "", Udd = B(p[7]) }; var why = RnDock.CloseWhy(cw, B(p[1]).Split(','), B(p[2])); Console.WriteLine(why == null ? "~" : Convert.ToBase64String(Encoding.UTF8.GetBytes(why))); continue; }
      var W = new List<RnDock.Win>();
      for (int i = 7; i + 3 < p.Length; i += 5) W.Add(new RnDock.Win { H = long.Parse(p[i]), Proc = B(p[i + 1]), Cls = B(p[i + 2]), Title = B(p[i + 3]) ?? "", Udd = B(p[i + 4]) });
      Console.WriteLine(RnDock.PickNew(W.ToArray(), L(p[0]), L(p[1]), B(p[2]), B(p[3]), B(p[4]), B(p[5]), B(p[6]))); } } }`;
fs.writeFileSync(path.join(D, 'h.cs'), HARNESS);
const cc = cp.spawnSync('mcs', ['-langversion:5', '-nologo', '-out:' + path.join(D, 'h.exe'), path.join(R, 'pcdock-win.cs'), path.join(D, 'h.cs')], { encoding: 'utf8' });
ok(cc.status === 0, 'C# 창 고르기(PickNew) + 시험 틀이 C# 5로 엮임', (cc.stdout || '') + (cc.stderr || ''));
if (cc.status !== 0) process.exit(1);
/* 물음 여럿을 한 번에(mono 한 번) */
const b64 = (v) => v == null ? '~' : Buffer.from(String(v), 'utf8').toString('base64');
function pickAll(Q) { const lines = Q.map(([q, wins]) => [q.pre.join(','), (q.claimed || []).join(','), b64(q.proc), b64(q.cls), b64(q.udd), b64(q.uddNot), b64(q.hint), ...wins.flatMap((w) => [w.h, b64(w.proc), b64(w.cls), b64(w.title), b64(w.udd)])].join('|')).join('\n') + '\n';
  const r = cp.spawnSync('mono', [path.join(D, 'h.exe')], { input: lines, encoding: 'utf8' }); if (r.status !== 0) return { err: r.stderr }; return r.stdout.trim().split('\n').map(Number); }
const CH = 'Chrome_WidgetWin_1';
const win = (h, title, udd) => ({ h, proc: 'chrome', cls: CH, title, udd: udd === undefined ? '' : udd });
/* 모니터 3대(정범님 배치도 꼴): 주 3440×1440 · 오른쪽 1920×1080 · 아래 1920×1080 */
const MONS = [{ id: '\\\\.\\DISPLAY3', primary: true, b: { x: 0, y: 0, w: 3440, h: 1440 }, wa: { x: 0, y: 0, w: 3440, h: 1392 }, dpi: 96 },
  { id: '\\\\.\\DISPLAY2', primary: false, b: { x: 3440, y: 0, w: 1920, h: 1080 }, wa: { x: 3440, y: 0, w: 1920, h: 1040 }, dpi: 96 },
  { id: '\\\\.\\DISPLAY1', primary: false, b: { x: 760, y: 1440, w: 1920, h: 1080 }, wa: { x: 760, y: 1440, w: 1920, h: 1040 }, dpi: 96 }];
const cfg = SET.defaults(); cfg.mons = { '\\\\.\\DISPLAY3': { grid: { cols: 10, rows: 6 } }, '\\\\.\\DISPLAY2': { grid: { cols: 8, rows: 6 } }, '\\\\.\\DISPLAY1': { grid: { cols: 8, rows: 6 } } };
cfg.place = [
  { id: 'pw', app: 'chrome', mon: '\\\\.\\DISPLAY2', c: 0, r: 0, w: 8, h: 6, name: '리드나우 웹앱', o: { urls: ['https://readnow.kr/app/'] } },
  { id: 'pn', app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 8, h: 6, name: '정범 노트', o: { urls: ['https://claude.ai/artifact/0000'] } },
  { id: 'pt', app: 'chrome', mon: '\\\\.\\DISPLAY3', c: 6, r: 0, w: 2, h: 6, name: '다른 탭들', o: { urls: ['https://www.aladin.co.kr/', 'https://www.yes24.com/'] } },
  { id: 'pc', app: 'col2', mon: '\\\\.\\DISPLAY3', c: 8, r: 0, w: 2, h: 6, name: '번외 수집기' },
  { id: 'pk', app: 'kakao', mon: '\\\\.\\DISPLAY3', c: 4, r: 3, w: 2, h: 3, name: '카카오톡' }];
const plan = A.buildPlan(cfg, MONS, { 'chrome.exe': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'KakaoTalk.exe': 'C:\\Program Files (x86)\\Kakao\\KakaoTalk\\KakaoTalk.exe' }, G);
const S = (inst) => plan.steps.find((s) => s.inst === inst);
const qOf = (st, pre, claimed, loose) => ({ pre, claimed: claimed || [], proc: 'chrome', cls: st.match.cls, udd: loose && !st.match.udd ? '*' : st.match.udd == null ? '*' : String(st.match.udd).replace(/%USERPROFILE%/i, 'c:\\users\\u').toLowerCase(), uddNot: st.match.uddNot || '', hint: st.match.hint || '' });

console.log('① 계획 — 크롬 단계는 하나씩(seq) · 평소 크롬 프로필만 · 주소마다 제목 단서');
ok(plan.steps.length === 5 && !plan.skipped.length, '놓은 5개가 모두 단계로', plan.skipped);
ok(['pw', 'pn', 'pt'].every((i) => S(i).match.seq && S(i).match.udd === '' && /readnow/.test(S(i).match.uddNot)), '크롬 단계: seq · udd "" (평소 크롬) · 도우미 크롬(…\\ReadNow\\…)은 뺌');
ok(/리드나우/.test(S('pw').match.hint) && /Claude/.test(S('pn').match.hint) && /알라딘/.test(S('pt').match.hint), '제목 단서: 웹앱=리드나우 · 노트=Claude · 탭 창=첫 주소(알라딘)', [S('pw').match.hint, S('pn').match.hint, S('pt').match.hint]);
ok(S('pc').match.seq && /col2-stat-chrome/.test(S('pc').match.udd) && S('pc').reuse, '번외: 그 도우미 크롬 프로필(col2-stat-chrome)로 알아봄 · 떠 있으면 자리만');
ok(S('pk').match.hidden === '^(카카오톡|KakaoTalk)$' && S('pk').match.procs[0] === 'KakaoTalk', '카카오톡: 숨은 창(트레이) 제목 조건이 실림');

console.log('② 0.1.5 길 재현 — 다 띄운 뒤 아무 새 크롬 창을 단계 차례대로 집으면 자리가 뒤바뀜');
{ /* 크롬 창 목록 차례 = 윈도우가 주는 차례(맨 위 = 마지막에 뜬 창) */
  const pre = [11]; const W = [win(204, 'aladin.co.kr'), win(203, 'claude.ai'), win(202, 'readnow.kr/app'), win(11, '이미 떠 있던 크롬 - Chrome')];
  const old = []; const claimed = []; for (const st of [S('pw'), S('pn'), S('pt')]) { const r = pickAll([[{ pre, claimed, proc: 'chrome', cls: CH, udd: '*', uddNot: '', hint: '' }, W]])[0]; old.push(r); claimed.push(r); }
  ok(old[0] === 204 && old[2] === 202, '(시험이 잡는지) 0.1.5 길: 웹앱 칸에 마지막에 뜬 창(알라딘 탭 창)이 놓임 — 정범님이 보신 뒤바뀜', old); }

console.log('③ 0.1.6 길 — 하나씩 띄우고 띄우기 바로 전 창은 뺌 · 크롬 4개 서로 다른 주소');
{ const got = {}; let pre = [11, 12]; let W = [win(11, '리드나우(북스킹) - Chrome'), win(12, '네이버 - Chrome')]; const claimed = [];
  const seq = [['pw', 201, 'readnow.kr/app'], ['pn', 202, 'claude.ai/artifact/0000'], ['pt', 203, '알라딘: 인터넷서점 - Chrome']];
  for (const [inst, h, title] of seq) { W = [win(h, title), ...W]; const r = pickAll([[qOf(S(inst), pre, claimed), W]])[0]; got[inst] = r; claimed.push(r); pre = W.map((w) => w.h); }
  ok(got.pw === 201 && got.pn === 202 && got.pt === 203, '웹앱·노트·탭 창이 저마다 자기 창을 집음', got);
  ok(![11, 12].includes(got.pw), '이미 떠 있던 크롬(웹앱 등)은 다른 단계가 집지 않음');
  /* 번외 — 도우미 크롬(프로필 col2-stat-chrome)이 새로 뜸 · 평소 크롬 단계 고르기에는 안 걸림 */
  const col2 = win(301, '127.0.0.1:8797', 'c:\\users\\u\\readnow\\col2\\col2-stat-chrome'); const W2 = [col2, ...W];
  const r = pickAll([[qOf(S('pw'), pre, claimed), W2], [qOf(S('pw'), pre, claimed, true), W2], [qOf(S('pc'), pre, claimed), W2]]);
  ok(r[0] === 0 && r[1] === 0, '번외 창(도우미 프로필)은 평소 크롬 단계가 집지 않음(프로필 조건을 늦춰도 …\\ReadNow\\… 는 뺌)', r);
  ok(Math.abs(r[2]) === 301, '번외 단계는 제목이 아직 주소여도(불러오는 중) 프로필로 그 창을 집음(제목 안 맞음 = 음수 → 4초 뒤 씀)', r[2]); }

console.log('④ 세션 되살림 창 섞임 · 제목 단서 · 이미 잡은 창');
{ const pre = [11]; const W = [win(402, 'readnow.kr/app'), win(401, '지난번 탭 - Chrome'), win(11, '정범님 크롬 - Chrome')];
  const r = pickAll([[qOf(S('pw'), pre, []), W], [qOf(S('pn'), pre, [402]), W], [qOf(S('pw'), pre, [402, 401]), W]]);
  ok(r[0] === 402, '크롬이 처음 켜지며 지난 창을 되살려도 주소가 맞는 창(웹앱)을 고름', r[0]);
  ok(r[1] === -401, '제목이 안 맞으면 음수(PowerShell이 4초 기다린 뒤에야 그 창을 씀)', r[1]);
  ok(r[2] === 0, '이미 다른 단계가 잡은 창은 다시 안 집음 → 고를 창 없음(0)', r[2]); }
{ const W = [win(501, '리드나우(북스킹) - Chrome', null)]; const r = pickAll([[qOf(S('pw'), [], []), W]]); ok(r[0] === 501, '프로필을 못 읽은 창(null)은 프로필로 거르지 않음(0.1.5처럼)', r); }
{ const W = [{ h: 601, proc: 'msedge', cls: CH, title: 'readnow.kr', udd: '' }, { h: 602, proc: 'chrome', cls: 'Other', title: 'readnow.kr', udd: '' }]; const r = pickAll([[qOf(S('pw'), [], []), W]]); ok(r[0] === 0, '다른 프로그램(엣지)·다른 창 종류는 안 집음', r); }

console.log('⑥ (정범님 11/14 15:46) ③ 때 목록의 프로그램은 먼저 닫고 새로 — 수집기·도우미 창은 지킴');
{ const procs = A.closeProcs(plan.steps); const KT = A.KEEP_TITLE;
  ok(procs.includes('chrome') && procs.includes('KakaoTalk') && !procs.includes('node'), '닫을 프로그램 = 이번 배치의 프로세스(크롬·카카오톡 …) · 도우미(node 등)는 없음', procs);
  const C = (w) => { const r = cp.spawnSync('mono', [path.join(D, 'h.exe')], { input: ['C', b64(procs.join(',')), b64(KT), w.h, b64(w.proc), b64(w.cls), b64(w.title), b64(w.udd)].join('|') + '\n', encoding: 'utf8' }); const o = (r.stdout || '').trim(); return o === '~' ? null : Buffer.from(o, 'base64').toString('utf8'); };
  const only = [win(1, '🪟 리드나우 작업 창 · 주문조회 : 알라딘'), win(2, '알라딘 중고 매장 관리 - Chrome'), win(3, '🖐 리드나우 손발 · 알라딘 - Chrome'), win(4, '📊 번외 수집기', 'c:\\users\\u\\readnow\\col2\\col2-stat-chrome'), win(5, '리드나우 PC 배치', 'c:\\users\\u\\appdata\\local\\readnow\\pcdock\\chrome'), win(6, 'ALPS 도우미 설정', 'c:\\users\\u\\readnow\\print\\chrome-alpswin'), win(7, '어떤 창 - Chrome', null)];
  const why = only.map(C); ok(why.every((x) => x), '수집기 창만 있을 때 하나도 안 닫힘(작업 창·알라딘 수집 탭·손발·번외·PC 배치·ALPS·프로필 모름)', why);
  const doClose = [win(11, '리드나우(북스킹) - Chrome'), win(12, 'Claude - Chrome'), { h: 13, proc: 'claude', cls: 'Chrome_WidgetWin_1', title: 'Claude', udd: null }, { h: 14, proc: 'KakaoTalk', cls: 'EVA_Window_Dblclk', title: '카카오톡', udd: null }, { h: 15, proc: 'explorer', cls: 'CabinetWClass', title: '다운로드', udd: null }];
  const procs2 = [...procs, 'claude', 'explorer']; const C2 = (w) => { const r = cp.spawnSync('mono', [path.join(D, 'h.exe')], { input: ['C', b64(procs2.join(',')), b64(KT), w.h, b64(w.proc), b64(w.cls), b64(w.title), b64(w.udd)].join('|') + '\n', encoding: 'utf8' }); const o = (r.stdout || '').trim(); return o === '~' ? null : Buffer.from(o, 'base64').toString('utf8'); };
  const w2 = doClose.map(C2); ok(w2.every((x) => x === ''), '목록의 크롬(웹앱·노트)·Claude 앱·카카오톡·폴더 창은 닫음', w2);
  const out = [{ h: 21, proc: 'notepad', cls: 'Notepad', title: '제목 없음 - 메모장', udd: null }, { h: 22, proc: 'explorer', cls: 'Shell_TrayWnd', title: '작업 표시줄', udd: null }, { h: 23, proc: 'node', cls: 'ConsoleWindowClass', title: 'node', udd: null }].map(C2);
  ok(out[0] === null && out[2] === null && /셸/.test(out[1]), '목록 밖(메모장 — 저장 안 한 글)·도우미(node)는 손대지 않음 · 탐색기 셸은 지킴', out); }
{ const js = fs.readFileSync(path.join(R, 'readnow-pcdock.js'), 'utf8'); const ps = fs.readFileSync(path.join(R, 'pcdock.ps1'), 'utf8');
  ok(/closeFirst = cfg\.run\.closeFirst !== false \? \{ procs: A\.closeProcs\(plan\.steps\), keepTitle: A\.KEEP_TITLE \}/.test(js) && SET.defaults().run.closeFirst === true && SET.validate({ ...SET.defaults(), run: { waitSec: 40, closeFirst: false } }, MONS).cfg.run.closeFirst === false, '설정 run.closeFirst(기본 켬 · 끌 수 있음) → PowerShell에 닫을 프로그램·지킬 제목을 넘김');
  ok(/\[RnDock\]::CloseWhy\(\$cw, \$cfProcs, \$cfKeep\)/.test(ps) && /\[RnDock\]::Close\(\[int64\]\$cw\.H\)/.test(ps) && /\$out\.pre = @\{ closed = @\(\$pre1Closed\); kept = @\(\$pre1Kept\) \}/.test(ps) && /\$before = @\{\}; foreach \(\$bw in \[RnDock\]::Windows\(\)\)/.test(ps.slice(ps.indexOf('pre1Closed'))), 'PowerShell: CloseWhy로 고른 창만 WM_CLOSE · 닫은 것·지킨 것을 결과(pre)에 · 닫은 뒤 창 목록을 다시 적음');
  ok(/pre: L\.pre \? \{ closed:/.test(js) && /kept:/.test(js), '진단 dock.last에 먼저 닫은 창·지킨 창(까닭)'); }

console.log('⑤ PowerShell(pcdock.ps1)이 크롬 단계를 그 길로 부름(글자 검사)');
{ const ps = fs.readFileSync(path.join(R, 'pcdock.ps1'), 'utf8').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  const run = ps.slice(ps.indexOf("'run' {"), ps.indexOf("{ $_ -eq 'cleanscan'"));
  ok(/if \(\$sp\.match\.seq\) \{ \$preK = @\(\[RnDock\]::Windows\(\) \| ForEach-Object \{ \[int64\]\$_\.H \}\); Launch \$st; if \(-not \$st\.err\) \{ SeqWait \$st \$preK \} \}/.test(run), '크롬 단계: 띄우기 바로 전 창 목록(preK) → 띄움 → 그 단계 창을 기다려 집은 뒤 다음 단계');
  ok(/function SeqWait/.test(run) && /PickFor \$st\.s \$wl \$preK/.test(run) && /\[RnDock\]::PickNew\(/.test(run) && /\$claimed\.Keys/.test(run), 'SeqWait → PickNew(띄우기 전 창·이미 잡은 창 뺌)');
  ok(/if \(\$st\.s\.match\.seq\) \{ \$hv = PickFor/.test(run), '늦게 뜬 크롬 창도 그 단계를 띄운 뒤 생긴 창 중에서만');
  ok(/Get-CimInstance Win32_Process -Filter "Name='chrome\.exe'"/.test(run) && /--user-data-dir=/.test(run) && /\$w\.Udd = /.test(run), '창 주인 크롬의 프로필(--user-data-dir)을 명령 줄에서 읽어 창에 붙임');
  ok(/function Unhid/.test(run) && /\[RnDock\]::Hidden\(/.test(run) && /\[RnDock\]::Unhide\(/.test(run) && /elseif \(Unhid \$st\)/.test(run) && /match\.hidden -and/.test(run), '카카오톡: 떠 있지만 숨은 창이면 보이게 한 뒤 놓음(이미 떠 있을 때 · 켠 뒤에도 숨은 채일 때)');
  const cs = fs.readFileSync(path.join(R, 'pcdock-win.cs'), 'utf8'); ok(/public static List<Win> Hidden\(/.test(cs) && /if \(IsWindowVisible\(h\)\) return true;/.test(cs) && /ShowWindow\(h, 5\)/.test(cs), 'C# Hidden(숨은 창만) · Unhide(SW_SHOW)'); }
try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {}
console.log(bad ? `✗ t_pick ${bad}/${n} 실패` : `✓ t_pick ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
