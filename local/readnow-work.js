/* readnow-work.js — 🪟 리드나우 수집 작업 창 (정범님 11/05 · 보고서 2026-11-05 ④안 'Q1 가')
 * 인쇄 도우미(readnow-print.js · 127.0.0.1:8898)가 ALPS 모듈처럼 불러 씀 — 이 파일만 따로 켜지 않음 · 6시간마다 도우미가 GitHub에서 새 판을 받아 바꿈
 * 하는 일:
 *  ① 작업 창 — 이 PC가 웹앱 🧭 관리도구 › 🪟 수집 작업 창에서 켜져 있으면(수집기가 /work/cfg로 알려 줌 · work.json에 기억 → PC를 다시 켜도 그대로)
 *     사람이 쓰는 크롬(같은 프로필·같은 알라딘 로그인 → 로그인 대수 그대로)에 새 창으로 알라딘 주문조회#rnWork 를 엶 → 수집기가 그 탭을 '작업 창 탭'으로 알고 수집을 맡음
 *     그 창(제목에 '리드나우 작업 창')을 화면 밖(또는 귀퉁이)으로 옮기고 작업 표시줄·Alt+Tab에서 숨김 · 1분마다 지킴: 창이 없으면 다시 엶(한 시간 4번까지) · 10분 넘게 신호가 없으면 닫고 다시 엶
 *     꺼지면 그 창을 닫음 → 수집기는 예전처럼 사람이 연 알라딘 탭이 맡음(되돌리기)
 *  ② 보이기/숨기기 — /work/show(저장한 자리·크기로 화면 앞에) · /work/hide(다시 화면 밖 · 그때 자리·크기를 저장) · /work/reopen
 *  ③ 📊 수집 상태 창 — 이 PC 주소창이나 /work/status 명령으로 여는 작은 창(http://127.0.0.1:8898/work · 창 전용 크롬 프로필 chrome-workwin — 로그인 없음)
 *     작업 창 상태·지금 하는 일·기록 끝 15줄 · 단추(보이기·숨기기·다시 열기) · 두 창의 자리·크기 고치기 · 이 창을 옮기면 자리·크기를 저절로 저장
 *  ④ 🖼 로그인 없는 바깥 사이트 그려 읽기 /render — 수집기가 중고닷·번개장터·예스24 중고 같은 화면을 사람 크롬 탭으로 열던 것 대신
 *     따로 된 크롬 프로필(chrome-render — 알라딘·어디에도 로그인하지 않음 → 로그인 대수에 안 셈)을 화면 없이 띄워 HTML만 돌려줌(로거 도우미 /render와 같은 꼴) · 알라딘 주소는 거절
 * 듣는 길(모두 127.0.0.1만 · 웹 페이지는 못 부름 — X-RN-Work/X-RN-Render 머리 + 다른 출처 거절 · 수집기는 Tampermonkey GM_xmlhttpRequest로):
 *   GET  /work               → 수집 상태 창 화면(주소창·앱 창에서만)
 *   GET  /work/status        → { ok, ver, on, open, shown, rect, win, hwin, beat, … }
 *   POST /work/cfg           → 수집기가 웹앱 설정을 알려 줌 { pc, on, ext, place, win, hwin, url, profile } → 지금 상태
 *   POST /work/beat          → 작업 창 탭의 신호 { tab, role, now, lines, … }
 *   POST /work/show|hide|reopen|status → 창 다루기 · /work/win { win|hwin: {x,y,w,h} } → 자리·크기 저장 · /work/hrect → 상태 창이 자기 자리를 알림
 *   POST /render?url=&wait=  → { ok, html, ms } (X-RN-Render)
 * 창 다루기는 PowerShell + user32(EnumWindows·SetWindowPos·창 모양 WS_EX_TOOLWINDOW) — 사람 크롬의 다른 창은 건드리지 않음(제목 표시가 있는 창만)
 * 크롬 플래그·정책·바로가기는 바꾸지 않음 */
'use strict';
const VERSION = '0.1.1'; // (0.1.1) 정범님 11/09 죽은 수집기 탭 되살리기(/work/lead 신호 · 13분 끊기면 사람 크롬에 새 탭 · 1시간 2번 · work.json revive:false로 끔)
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), dns = require('dns');
const HOME = process.env.RN_WORK_HOME || path.join(__dirname, 'work'); try { fs.mkdirSync(HOME, { recursive: true }); } catch (e) {}
const CFG_F = path.join(HOME, 'work.json'); const PS_F = path.join(HOME, 'work-win.ps1');
const MARK = '리드나우 작업 창'; const HMARK = '리드나우 수집 상태';
const DEF_URL = 'https://www.aladin.co.kr/scm/worders.aspx';
/* 기준값 — 근거: 없음, 설정으로 바꿈(work.json) */
const D = { tickSec: 60, reopenMin: 3, deadMin: 10, opensPerHour: 4, hideW: 1280, hideH: 900, showW: 1200, showH: 820, hwinW: 440, hwinH: 660 };
let LOG = (m) => { try { process.stdout.write(m + '\n'); } catch (e) {} };
const log = (m) => LOG('🪟 ' + m);
const now = () => Date.now();
const kst = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ');
function loadCfg() { try { const v = JSON.parse(fs.readFileSync(CFG_F, 'utf8')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
let CFG = loadCfg();
const saveCfg = () => { try { fs.writeFileSync(CFG_F, JSON.stringify(CFG, null, 1)); } catch (e) { log('설정 저장 실패: ' + e.message); } };
const num = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const C = (k) => num(CFG[k], 1, 100000, D[k]);
/* 자리·크기 {x,y,w,h,at} — 화면 좌표(여러 모니터면 음수도) · 너무 작으면 버림 */
function rectOk(r, minW, minH) { if (!r || typeof r !== 'object') return null; const o = { x: num(r.x, -20000, 20000, NaN), y: num(r.y, -20000, 20000, NaN), w: num(r.w, minW || 200, 8000, NaN), h: num(r.h, minH || 150, 8000, NaN) }; if (![o.x, o.y, o.w, o.h].every(Number.isFinite)) return null; return { ...o, at: +r.at || now() }; }
const ST = { beat: null, beatAt: 0, open: false, n: 0, shown: false, rect: null, hwinOpen: false, opens: [], openedAt: 0, msg: '', busy: false, lastFind: null, render: { n: 0, fail: 0, last: null }, timers: [] };
const opensHour = () => { ST.opens = ST.opens.filter((t) => now() - t < 3600e3); return ST.opens.length; };

/* ── 창 다루기(PowerShell) ── 한 파일(work-win.ps1)에 C#을 넣고 -Act로 고름 · 결과는 맨 끝 한 줄 JSON */
const PS_SRC = () => `param([string]$Act = 'find', [int]$X = 0, [int]$Y = 0, [int]$W = 0, [int]$H = 0, [string]$Place = 'off')
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
if (-not ('RnWork' -as [type])) { Add-Type -TypeDefinition @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class RnWork {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP f, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int w, int hh, uint f);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] public static extern IntPtr GetWL(IntPtr h, int i);
  [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")] public static extern IntPtr SetWL(IntPtr h, int i, IntPtr v);
  public struct RECT { public int L; public int T; public int R; public int B; }
  public static List<IntPtr> Find(string mark) { var L = new List<IntPtr>(); EnumWindows((h, l) => { var c = new StringBuilder(256); GetClassName(h, c, 256); if (c.ToString() != "Chrome_WidgetWin_1") return true; var t = new StringBuilder(1024); GetWindowText(h, t, 1024); if (t.ToString().Contains(mark)) L.Add(h); return true; }, IntPtr.Zero); return L; }
  public static bool Tool(IntPtr h) { long ex = GetWL(h, -20).ToInt64(); return (ex & 0x80L) != 0; }
  /* 작업 표시줄·Alt+Tab에서 숨김(WS_EX_TOOLWINDOW) 또는 되돌림(WS_EX_APPWINDOW) — 모양을 바꾸려면 잠깐 숨겼다 다시 보임(활성으로 만들지 않음) */
  public static void Taskbar(IntPtr h, bool hide) { long ex = GetWL(h, -20).ToInt64(); long nx = hide ? ((ex | 0x80L) & ~0x40000L) : ((ex & ~0x80L) | 0x40000L); if (nx == ex) return; ShowWindow(h, 0); SetWL(h, -20, new IntPtr(nx)); ShowWindow(h, 4); }
}
'@ }
function R($h) { $r = New-Object RnWork+RECT; [void][RnWork]::GetWindowRect($h, [ref]$r); @{ x = $r.L; y = $r.T; w = ($r.R - $r.L); h = ($r.B - $r.T) } }
function Info($h) { @{ h = [int64]$h; r = (R $h); vis = [RnWork]::IsWindowVisible($h); ic = [RnWork]::IsIconic($h); zm = [RnWork]::IsZoomed($h); tool = [RnWork]::Tool($h) } }
$vs = [System.Windows.Forms.SystemInformation]::VirtualScreen; $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$out = @{ ok = $true; act = $Act; vs = @{ x = $vs.X; y = $vs.Y; w = $vs.Width; h = $vs.Height }; wa = @{ x = $wa.X; y = $wa.Y; w = $wa.Width; h = $wa.Height } }
if ($Act -like 'hf*') { <# hfind·hfront = 수집 상태 창(창 전용 프로필 chrome-workwin) · hide는 작업 창 #>
  $p = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*chrome-workwin*' } | ForEach-Object { $_.ProcessId })
  $L = @(); if ($p.Count) { $L = @(Get-Process -Id $p -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { $_.MainWindowHandle }) }
} else { $L = @([RnWork]::Find('${MARK}')) }
$out.n = $L.Count; $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ })
if ($L.Count -gt 0) { $hnd = $L[0]
  if ($Act -eq 'hide') { if ([RnWork]::IsIconic($hnd) -or [RnWork]::IsZoomed($hnd)) { [void][RnWork]::ShowWindow($hnd, 4) }
    $w = [Math]::Max(400, $W); $hh = [Math]::Max(300, $H)
    if ($Place -eq 'edge') { $x = $wa.X + $wa.Width - 6; $y = $wa.Y + $wa.Height - 6 } else { $x = $vs.X - $w - 400; $y = $vs.Y + 40 }
    [RnWork]::Taskbar($hnd, $true); [void][RnWork]::SetWindowPos($hnd, [IntPtr]1, $x, $y, $w, $hh, 0x0010) }
  elseif ($Act -eq 'show' -or $Act -eq 'hfront') { [RnWork]::Taskbar($hnd, $false); if ([RnWork]::IsIconic($hnd)) { [void][RnWork]::ShowWindow($hnd, 9) }
    $w = $W; $hh = $H; $x = $X; $y = $Y; if ($w -lt 200 -or $hh -lt 150) { $w = [Math]::Min(${D.showW}, $wa.Width); $hh = [Math]::Min(${D.showH}, $wa.Height); $x = $wa.X + [int](($wa.Width - $w) / 2); $y = $wa.Y + [int](($wa.Height - $hh) / 2) }
    $okp = $false; foreach ($sc in [System.Windows.Forms.Screen]::AllScreens) { $b = $sc.WorkingArea; if ($x -ge $b.X - 60 -and $x -le $b.X + $b.Width - 120 -and $y -ge $b.Y - 20 -and $y -le $b.Y + $b.Height - 80) { $okp = $true } }
    if (-not $okp) { $x = $wa.X + [int](($wa.Width - [Math]::Min($w, $wa.Width)) / 2); $y = $wa.Y + 20 }
    [void][RnWork]::SetWindowPos($hnd, [IntPtr](-1), $x, $y, $w, $hh, 0x0040); [void][RnWork]::SetWindowPos($hnd, [IntPtr](-2), 0, 0, 0, 0, 0x0043); [void][RnWork]::SetForegroundWindow($hnd) }
  elseif ($Act -eq 'close') { foreach ($q in $L) { [void][RnWork]::PostMessage($q, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) } }
  $out.list = @($L | Select-Object -First 4 | ForEach-Object { Info $_ }) }
$out | ConvertTo-Json -Compress -Depth 5
`;
function psExe() { return process.env.RN_WORK_PS || 'powershell.exe'; }
function win(act, o) { o = o || {}; return new Promise((res) => { try { const want = '﻿' + PS_SRC().replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(PS_F, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(PS_F, want, 'utf8'); } catch (e) { return res({ ok: false, err: '창 다루기 파일을 못 씀: ' + e.message }); }
  const a = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', PS_F, '-Act', act]; for (const k of ['X', 'Y', 'W', 'H']) if (o[k.toLowerCase()] != null && Number.isFinite(+o[k.toLowerCase()])) a.push('-' + k, String(Math.round(+o[k.toLowerCase()]))); if (o.place) a.push('-Place', o.place === 'edge' ? 'edge' : 'off');
  cp.execFile(psExe(), a, { windowsHide: true, timeout: 45000, maxBuffer: 4 * 1048576 }, (e, out, err) => { const line = String(out || '').trim().split(/\r?\n/).reverse().find((l) => /^\{/.test(l.trim())); let j = null; try { j = JSON.parse(line); } catch (x) {} if (!j) return res({ ok: false, err: '창 다루기 실패: ' + String(err || (e && e.message) || '응답 없음').slice(0, 200) });
    j.list = Array.isArray(j.list) ? j.list : j.list ? [j.list] : []; ST.lastFind = { at: now(), act, n: j.n }; res(j); }); }); }

/* ── 크롬 ── 사람이 쓰는 크롬(기본은 마지막으로 쓴 프로필 · 설정 profile로 고정 가능)에 새 창 · 보이지 않는 자리로 열어 깜빡임을 줄임(이미 켜진 크롬은 자리 플래그를 무시할 수 있어 지킴이가 곧 옮김) */
function chromeExe() { if (process.env.RN_WORK_CHROME) return process.env.RN_WORK_CHROME; return [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean).map((b) => path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')).find((f) => fs.existsSync(f)) || null; }
const workUrl = () => { const u = String(CFG.url || ''); return /^https:\/\/www\.aladin\.co\.kr\/scm\/[a-z_]+\.aspx(\?[^#\s]*)?$/i.test(u) ? u : DEF_URL; };
function openWork(why) { const ch = chromeExe(); if (!ch) { ST.msg = '크롬을 못 찾음'; log('작업 창을 못 엶 — 크롬을 못 찾음'); return false; }
  const prof = /^[A-Za-z0-9 _-]{1,40}$/.test(String(CFG.profile || '')) ? ['--profile-directory=' + CFG.profile] : [];
  const args = [...prof, '--new-window', `--window-position=-32000,40`, `--window-size=${C('hideW')},${C('hideH')}`, workUrl() + '#rnWork'];
  try { const p = cp.spawn(ch, args, { detached: true, stdio: 'ignore', windowsHide: false }); p.on('error', (e) => log('크롬 띄우기 실패: ' + e.message)); p.unref(); } catch (e) { log('크롬 띄우기 실패: ' + e.message); return false; }
  ST.opens.push(now()); ST.openedAt = now(); ST.shown = false; ST.msg = `작업 창을 엶 (${why || ''})`; log(`작업 창을 엶 — ${why || ''} (최근 한 시간 ${opensHour()}번째)`); placeSoon(); return true; }
/* 연 뒤 1분 동안 3초마다 찾아 화면 밖으로(수집기가 탭 제목에 표시를 붙여야 찾을 수 있음) */
function placeSoon() { let k = 0; const t = setInterval(async () => { k++; if (k > 20 || !CFG.on || ST.shown) return clearInterval(t); const r = await win('hide', { w: C('hideW'), h: C('hideH'), place: CFG.place }); if (r.ok && r.n > 0) { ST.open = true; ST.n = r.n; clearInterval(t); log('작업 창을 화면 밖으로 옮기고 작업 표시줄에서 숨김'); } }, 3000); ST.timers.push(t); }

/* ── (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기 — 작업 창 모드가 꺼진 PC(HOME·MJ-MAIN처럼 사람이 연 알라딘 탭이 수집기)
 *  수집기 탭(일하는 탭)이 1분마다 /work/lead로 '살아 있음'을 알림 → 그 신호가 reviveMin(기본 13분 — 근거: 없음, work.json reviveMin으로 바꿈 · 웹앱 탭 쪽 되살리기 10분보다 늦게 = 웹앱 탭이 없을 때의 뒷받침) 넘게 끊겼고
 *  · 사람 크롬이 떠 있고(작업 창·상태 창·그리기·공개 수집 프로필은 뺌 — 크롬이 꺼져 있으면 띄우지 않음) · 인터넷이 되면(www.aladin.co.kr 이름 찾기만 — 알라딘에 요청하지 않음 · 안 되면 다음 1분에 다시)
 *  → 사람 크롬에 새 탭으로 알라딘 주문조회를 엶(크롬·다른 탭은 죽이지 않음) · 1시간 2번까지(work.json revivePerHour) · 도우미가 켜진 뒤 신호를 한 번이라도 받았을 때만 · 마지막 신호가 일시정지면 안 함 · work.json revive:false로 끔 */
const RV = { last: 0, opens: [], msg: '' };
function reviveDecide(o) { const M = 60e3; if (o.off) return { act: 'none', why: '꺼 둠' }; if (o.workOn) return { act: 'none', why: '작업 창 모드가 따로 지킴' }; const L = o.lead; if (!L || !L.at) return { act: 'none', why: '수집기 신호를 아직 못 받음' };
  if (o.now - L.at < o.staleMin * M) return { act: 'none', why: '살아 있음' }; if (o.now - L.at > o.aliveH * 3600e3) return { act: 'none', why: '신호가 끊긴 지 너무 오래(사람이 닫은 듯)' }; if (L.paused) return { act: 'none', why: '일시정지 중이었음' };
  if (o.last && o.now - o.last < o.staleMin * M) return { act: 'none', why: '방금 새 탭을 엶 — 뜨길 기다림' }; const n = (o.opens || []).filter((t) => o.now - t < 3600e3).length; if (n >= o.perHour) return { act: 'limit', why: `1시간에 ${o.perHour}번 넘게 열어 쉼` };
  if (o.chrome === false) return { act: 'none', why: '사람 크롬이 꺼져 있음(띄우지 않음)' }; if (o.net === false) return { act: 'wait-net', why: '인터넷이 안 됨 — 기다렸다 다시' }; if (o.chrome == null || o.net == null) return { act: 'check' }; return { act: 'open' }; } /* ⟦reviveDecide 끝⟧ */
const RV_DEPS = {
  chrome: () => new Promise((res) => { cp.execFile(psExe(), ['-NoProfile', '-NonInteractive', '-Command', "@(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -notlike '*--type=*' -and $_.CommandLine -notlike '*chrome-workwin*' -and $_.CommandLine -notlike '*chrome-render*' -and $_.CommandLine -notlike '*chrome-pub*' -and $_.CommandLine -notlike '*chrome-helper*' }).Count"], { windowsHide: true, timeout: 30000 }, (e, out) => res(e ? null : (parseInt(String(out).trim(), 10) || 0) > 0)); }),
  net: () => new Promise((res) => { dns.lookup('www.aladin.co.kr', { family: 4 }, (e) => res(!e)); }),
  open: (url) => { const ch = chromeExe(); if (!ch) return false; const prof = /^[A-Za-z0-9 _-]{1,40}$/.test(String(CFG.profile || '')) ? ['--profile-directory=' + CFG.profile] : []; try { const p = cp.spawn(ch, [...prof, url], { detached: true, stdio: 'ignore', windowsHide: false }); p.on('error', (e) => log('되살리기 탭 열기 실패: ' + e.message)); p.unref(); return true; } catch (e) { log('되살리기 탭 열기 실패: ' + e.message); return false; } } };
async function reviveTick() { const base = { now: now(), lead: ST.lead, off: CFG.revive === false, workOn: !!CFG.on, staleMin: num(CFG.reviveMin, 5, 120, 13), aliveH: num(CFG.reviveAliveH, 1, 48, 6), perHour: num(CFG.revivePerHour, 1, 4, 2), last: RV.last, opens: RV.opens };
  let d = reviveDecide(base); if (d.act === 'check') { const [chrome, net] = await Promise.all([RV_DEPS.chrome(), RV_DEPS.net()]); d = reviveDecide({ ...base, chrome: chrome === true, net }); } /* 크롬 확인이 실패(PowerShell 오류)하면 꺼진 것으로 봄 — 크롬이 꺼져 있을 때 열기 명령을 내면 크롬을 새로 띄우게 되므로 */
  if (d.act === 'none' && /살아 있음|못 받음/.test(d.why)) { RV.msg = ''; return d; } if (d.act !== 'open') { if (RV.msg !== d.why) { RV.msg = d.why; if (d.act !== 'none' || ST.lead) log(`🩺 수집기 탭 신호 ${ST.lead ? Math.round((now() - ST.lead.at) / 60e3) + '분' : '?'} 없음 — ${d.why}`); } return d; }
  RV.opens = [...RV.opens.filter((t) => now() - t < 3600e3), now()]; RV.last = now(); RV.msg = '새 탭으로 알라딘 주문조회를 엶'; const ok = RV_DEPS.open(DEF_URL);
  log(`🩺 수집기 탭이 ${Math.round((now() - ST.lead.at) / 60e3)}분 동안 신호 없음(크롬 'Out of Memory'·인터넷 끊김 화면 추정) — ${ok ? '사람 크롬에 새 탭으로 알라딘 주문조회를 엶' : '새 탭을 못 엶'} (1시간 ${RV.opens.length}/${base.perHour}번째)`); return { act: ok ? 'opened' : 'fail' }; }

/* ── 지킴이(1분) ── */
async function tick(why) { if (ST.busy) return; ST.busy = true;
  try { if (!CFG.on) { try { await reviveTick(); } catch (e) {} } /* (11/09 oom1) 창 찾기가 실패해도 되살리기는 봄 */
    const f = await win('find'); if (!f.ok) { ST.msg = f.err; return; } ST.open = f.n > 0; ST.n = f.n; ST.rect = f.list[0] ? f.list[0].r : null;
    if (!CFG.on) { if (f.n) { await win('close'); ST.open = false; ST.shown = false; ST.msg = '작업 창 모드 꺼짐 — 작업 창을 닫음(사람 탭이 수집을 이어받음)'; log(ST.msg); } return; }
    const beatAge = now() - (ST.beatAt || 0); const sinceOpen = now() - (ST.openedAt || 0);
    if (!f.n) { if (beatAge < C('reopenMin') * 60e3) { ST.msg = '작업 창 탭은 신호를 보내는데 창 제목을 못 찾음(그 창에서 다른 탭을 앞에 둠?)'; return; }
      if (sinceOpen < C('reopenMin') * 60e3) { ST.msg = '작업 창을 여는 중'; return; } if (opensHour() >= C('opensPerHour')) { ST.msg = `한 시간에 ${C('opensPerHour')}번 넘게 다시 열어 쉼 — 크롬·알라딘 로그인을 확인하세요`; return; }
      openWork(why || '창이 없음'); return; }
    if (f.n && beatAge > C('deadMin') * 60e3 && sinceOpen > C('deadMin') * 60e3 && ST.beatAt) { if (opensHour() >= C('opensPerHour')) { ST.msg = '작업 창이 응답이 없는데 다시 열기 횟수를 넘음'; return; } log(`작업 창이 ${Math.round(beatAge / 60e3)}분 동안 신호 없음 — 닫고 다시 엶`); await win('close'); ST.beat = null; ST.beatAt = 0; setTimeout(() => openWork('신호 없음'), 4000); return; }
    if (!ST.shown) { const it = f.list[0] || {}; const vsx = f.vs ? f.vs.x : 0; const offOk = CFG.place === 'edge' ? it.tool : it.tool && it.r && it.r.x + it.r.w <= vsx; if (!offOk || it.ic) { const r = await win('hide', { w: C('hideW'), h: C('hideH'), place: CFG.place }); if (r.ok) ST.msg = '작업 창을 다시 화면 밖으로'; } else ST.msg = '작업 창 숨김 · 일하는 중'; } else ST.msg = '작업 창 보이는 중(🙈 숨기기를 누르면 다시 화면 밖으로)';
  } catch (e) { ST.msg = '지킴이 오류: ' + e.message; } finally { ST.busy = false; } }

async function show(why) { if (!CFG.on) return { ok: false, err: '이 PC는 작업 창 모드가 꺼져 있음(웹앱 관리도구에서 켬)' }; let f = await win('find'); if (!f.ok) return f; if (!f.n) { openWork('보이기 — 창이 없어 새로 엶'); await new Promise((r) => setTimeout(r, 6000)); f = await win('find'); if (!f.n) return { ok: false, err: '작업 창을 여는 중 — 잠시 뒤 다시' }; }
  const w = rectOk(CFG.win, 400, 300) || {}; const r = await win('show', w); if (!r.ok) return r; ST.shown = true; ST.msg = '작업 창 보이는 중'; log(`작업 창을 화면 앞으로 (${why || ''})`); return { ok: true, msg: '작업 창을 화면 앞으로 꺼냄' + (w.w ? ` (저장한 자리 ${w.x},${w.y} · ${w.w}×${w.h})` : ' (가운데 기본 크기)') }; }
async function hide(why) { const f = await win('find'); if (!f.ok) return f; if (!f.n) { ST.shown = false; return { ok: true, msg: '작업 창이 없음' }; } const it = f.list[0];
  if (ST.shown && it && it.r && !it.ic && !it.zm && !it.tool && it.r.w >= 400 && it.r.h >= 300 && f.vs && it.r.x + it.r.w > f.vs.x) { CFG.win = { ...it.r, at: now(), src: 'pc' }; saveCfg(); log(`작업 창 자리·크기 저장 — ${it.r.x},${it.r.y} · ${it.r.w}×${it.r.h}`); }
  const r = await win('hide', { w: C('hideW'), h: C('hideH'), place: CFG.place }); ST.shown = false; ST.msg = '작업 창 숨김'; log(`작업 창을 다시 화면 밖으로 (${why || ''})`); return r.ok ? { ok: true, msg: '작업 창을 다시 숨김' + (CFG.win ? ' · 보일 때 자리 저장됨' : '') } : r; }
async function reopen(why) { if (!CFG.on) return { ok: false, err: '작업 창 모드가 꺼져 있음' }; await win('close'); ST.beat = null; ST.beatAt = 0; await new Promise((r) => setTimeout(r, 3000)); return openWork(why || '다시 열기') ? { ok: true, msg: '작업 창을 닫고 다시 엶 — 1분 안에 수집기가 이어받음' } : { ok: false, err: ST.msg }; }
async function statusWin(why) { const hw = rectOk(CFG.hwin, 260, 200); const f = await win('hfind'); if (f.ok && f.n) { const r = await win('hfront', hw || {}); ST.hwinOpen = true; return r.ok ? { ok: true, msg: '수집 상태 창을 앞으로' } : r; }
  const ch = chromeExe(); if (!ch) return { ok: false, err: '크롬을 못 찾음' };
  const a = [`--user-data-dir=${path.join(HOME, 'chrome-workwin')}`, '--app=http://127.0.0.1:8898/work', '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble', `--window-size=${hw ? hw.w : D.hwinW},${hw ? hw.h : D.hwinH}`, ...(hw ? [`--window-position=${hw.x},${hw.y}`] : [])];
  try { const p = cp.spawn(ch, a, { detached: true, stdio: 'ignore' }); p.on('error', () => {}); p.unref(); } catch (e) { return { ok: false, err: e.message }; } ST.hwinOpen = true; log(`수집 상태 창을 엶 (${why || ''})`); return { ok: true, msg: '수집 상태 창을 엶' + (hw ? ` (저장한 자리 ${hw.x},${hw.y} · ${hw.w}×${hw.h})` : '') }; }

/* 수집기가 웹앱 설정을 알려 줌 — 자리·크기는 더 늦게 고친 쪽(at)을 씀(이 PC에서 옮긴 것 vs 웹앱에서 고친 것) */
function setCfg(o) { const was = !!CFG.on; const out = { ...CFG };
  if (o.on != null) out.on = o.on === true; if (o.ext != null) out.ext = o.ext !== false; if (o.place != null) out.place = o.place === 'edge' ? 'edge' : 'off';
  if (o.url !== undefined) out.url = o.url || null; if (o.profile !== undefined) out.profile = o.profile || null; if (o.pc) out.pc = String(o.pc).slice(0, 40);
  for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: 'web' }; }
  const ch = JSON.stringify(out) !== JSON.stringify(CFG); CFG = out; if (ch) saveCfg();
  if (was !== !!CFG.on) { log(CFG.on ? '작업 창 모드 켬(웹앱 설정)' : '작업 창 모드 끔(웹앱 설정) — 작업 창을 닫음'); setTimeout(() => tick('설정 바뀜'), 500); } return ch; }
function status() { const b = ST.beat; return { ok: true, ver: VERSION, pc: CFG.pc || os.hostname(), on: !!CFG.on, ext: CFG.ext !== false, place: CFG.place || 'off', open: ST.open, n: ST.n, shown: ST.shown, rect: ST.rect, win: CFG.win || null, hwin: CFG.hwin || null, hwinOpen: ST.hwinOpen,
  beatAt: ST.beatAt ? new Date(ST.beatAt).toISOString() : null, beatAge: ST.beatAt ? Math.round((now() - ST.beatAt) / 1000) : null, beat: b ? { role: b.role, page: b.page, ver: b.ver, paused: !!b.paused, now: b.now || null, lines: (b.lines || []).slice(-15) } : null, opens: opensHour(), msg: ST.msg, render: ST.render, revive: { on: CFG.revive !== false, leadAge: ST.lead ? Math.round((now() - ST.lead.at) / 1000) : null, opens: RV.opens.filter((t) => now() - t < 3600e3).length, msg: RV.msg }, at: kst() }; }

/* ── 🖼 로그인 없는 바깥 사이트 그려 읽기(로거 도우미 /render와 같은 꼴 · 따로 된 프로필 chrome-render · 화면 없음) ── */
const ALADIN = /(^|\.)aladin\.co\.kr$/i;
function render(u, J) { const url = u.searchParams.get('url') || ''; let t; try { t = new URL(url); } catch (e) { return J(400, { ok: false, why: '주소가 이상함' }); } if (!/^https?:$/.test(t.protocol) || ALADIN.test(t.hostname) || /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(t.host)) return J(400, { ok: false, why: '외부 사이트만(알라딘·이 PC 주소는 안 됨)' });
  if (CFG.ext === false) return J(403, { ok: false, why: '이 PC는 바깥 사이트 읽기 따로를 꺼 둠(웹앱 관리도구)' });
  const ch = chromeExe(); if (!ch) return J(500, { ok: false, why: '크롬을 못 찾음' }); const R = ST.render; if (R.busy) return J(429, { ok: false, why: '다른 화면을 그리는 중' }); R.busy = true;
  const wait = Math.max(3000, Math.min(30000, +u.searchParams.get('wait') || 12000)); const t0 = now();
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--disable-background-networking', '--mute-audio', '--blink-settings=imagesEnabled=false', '--window-size=1280,6000', '--force-webrtc-ip-handling-policy=disable_non_proxied_udp', `--user-data-dir=${path.join(HOME, 'chrome-render')}`, `--virtual-time-budget=${wait}`, '--dump-dom', t.href];
  cp.execFile(ch, args, { windowsHide: true, timeout: wait + 30000, maxBuffer: 30 * 1048576 }, (e, out) => { R.busy = false; const html = String(out || ''); R.last = { url: t.href.slice(0, 200), at: kst(), ms: now() - t0, len: html.length, err: e && !html ? String(e.message).slice(0, 160) : null };
    if (!html) { R.fail++; return J(502, { ok: false, why: '그리기 실패: ' + ((e && e.message) || '빈 화면').slice(0, 200) }); } R.n++; J(200, { ok: true, html: html.slice(0, 3000000), ms: now() - t0 }); }); }

/* ── 수집 상태 창 화면 ── */
function pageHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>📊 ${HMARK}</title>
<style>body{font:13px/1.5 system-ui,'Malgun Gothic',sans-serif;margin:0;background:#F6F7F6;color:#1E2B28}h1{font-size:15px;margin:0;padding:10px 12px;background:#2F5D50;color:#fff}.b{padding:8px 12px}.c{background:#fff;border:1px solid #D6DDDA;border-radius:8px;padding:8px 10px;margin:0 0 8px}.k{color:#5B6B66;font-size:12px}.ok{color:#1F6F4A;font-weight:700}.no{color:#B0322A;font-weight:700}button{font:13px system-ui,'Malgun Gothic';border:1px solid #2F5D50;background:#fff;color:#2F5D50;border-radius:6px;padding:4px 9px;margin:2px 3px 2px 0;cursor:pointer}button.p{background:#2F5D50;color:#fff}input{width:56px;font:12px system-ui;padding:2px 4px}.ln{font:11.5px/1.45 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:260px;overflow:auto;background:#F4F6F5;border-radius:6px;padding:6px}.w{color:#8A4A00}.e{color:#B0322A}#m{color:#1F6F4A;min-height:1.4em}</style>
<h1>📊 ${HMARK} <small style="font-weight:400;opacity:.8">도우미 ${VERSION}</small></h1><div class="b">
<div class="c" id="st">읽는 중…</div>
<div class="c"><b>지금 하는 일</b><div id="now" class="k">—</div></div>
<div class="c"><b>기록 끝</b><div id="ln" class="ln">—</div></div>
<div class="c"><button class="p" data-a="show">🪟 작업 창 보이기</button><button data-a="hide">🙈 숨기기</button><button data-a="reopen">↻ 다시 열기</button><div id="m"></div></div>
<div class="c"><b>자리·크기</b> <span class="k">(가로 위치 x · 세로 위치 y · 폭 w · 높이 h — 화면 점 단위)</span>
<div style="margin-top:4px">🪟 작업 창(보일 때) <input id="wx"> <input id="wy"> <input id="ww"> <input id="wh"> <button data-s="win">저장</button></div>
<div>📊 이 창 <input id="hx"> <input id="hy"> <input id="hw"> <input id="hh"> <button data-s="hwin">저장</button></div>
<div class="k">작업 창을 보이게 한 뒤 옮기거나 크기를 바꾸고 🙈 숨기기를 누르면 그 자리·크기가 저장됩니다 · 이 창은 옮기면 저절로 저장 · 웹앱 🧭 관리도구 › 🪟 수집 작업 창에서도 고칠 수 있음</div></div>
<div class="k">켜고 끄기는 웹앱 🧭 관리도구 › 🪟 수집 작업 창(PC별). 끄면 작업 창이 닫히고 예전처럼 사람이 연 알라딘 탭이 수집을 맡습니다.</div></div>
<script>(function(){const H={'X-RN-Work':'1','Content-Type':'application/json'};const $=(i)=>document.getElementById(i);const E=(t)=>String(t==null?'':t).replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);let edit=0;
const T=(ms)=>{const d=new Date(+ms+9*3600e3);return d.toISOString().slice(11,19)};
async function load(){try{const r=await fetch('/work/status',{headers:H,cache:'no-store'});const s=await r.json();const b=s.beat;
$('st').innerHTML='작업 창 모드 '+(s.on?'<span class="ok">켜짐</span>':'<span class="no">꺼짐</span>')+' · 창 '+(s.open?'<span class="ok">있음</span>':'<span class="no">없음</span>')+(s.open?(s.shown?' · <b>보이는 중</b>':' · 숨김'):'')+'<br><span class="k">신호 '+(s.beatAge==null?'없음':s.beatAge+'초 전')+(b?' · 역할 '+E(b.role==='lead'?'수집기(일하는 탭)':b.role)+' · 수집기 '+E(b.ver)+(b.paused?' · <b class="no">일시정지</b>':''):'')+' · 최근 한 시간 다시 열기 '+s.opens+'번<br>'+E(s.msg||'')+'</span>';
const n=b&&b.now;$('now').innerHTML=n?(n.job?'▶ '+E(n.job)+(n.prog&&n.prog.n?' — '+n.prog.i+'/'+n.prog.n:''):'쉬는 중(⏰ 다음 칸 기다림)')+(n.crm?' · 고객 일 하는 중':''):'—';
$('ln').innerHTML=b&&b.lines&&b.lines.length?b.lines.map((e)=>'<div class="'+(e.l==='err'?'e':e.l==='warn'?'w':'')+'">'+T(e.t)+' ['+E(e.m)+'] '+E(e.x)+'</div>').join(''):'—';
if(!edit){const f=(p,v)=>{['x','y','w','h'].forEach((k)=>{$(p+k).value=v&&v[k]!=null?v[k]:''})};f('w',s.win);f('h',s.hwin);}}catch(e){$('st').textContent='도우미에 닿지 못함: '+e.message}}
document.querySelectorAll('input').forEach((i)=>i.oninput=()=>{edit=Date.now()});
document.querySelectorAll('[data-a]').forEach((b)=>b.onclick=async()=>{$('m').textContent='…';try{const r=await fetch('/work/'+b.dataset.a,{method:'POST',headers:H,body:'{"why":"수집 상태 창"}'});const j=await r.json();$('m').textContent=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'');}catch(e){$('m').textContent='✗ '+e.message}load()});
document.querySelectorAll('[data-s]').forEach((b)=>b.onclick=async()=>{const p=b.dataset.s==='win'?'w':'h';const v={};['x','y','w','h'].forEach((k)=>v[k]=+$(p+k).value);try{const r=await fetch('/work/win',{method:'POST',headers:H,body:JSON.stringify({[b.dataset.s]:v})});const j=await r.json();$('m').textContent=(j.ok?'✓ 저장 — ':'✗ ')+(j.msg||j.err||'');edit=0}catch(e){$('m').textContent='✗ '+e.message}load()});
let last='';setInterval(()=>{const v={x:screenX,y:screenY,w:outerWidth,h:outerHeight};const k=JSON.stringify(v);if(k!==last&&v.w>200&&v.h>150){last=k;fetch('/work/hrect',{method:'POST',headers:H,body:k}).catch(()=>{})}},15000);
load();setInterval(()=>{if(!edit||Date.now()-edit>60000){edit=0;load()}},4000)})();</script></html>`; }

/* ── 듣는 길 ── readnow-print.js가 /work·/render 주소를 여기로 넘김(호스트 127.0.0.1 확인은 그쪽에서) */
function api(req, res, u, h) { const readBody = h.readBody; const org = req.headers.origin || ''; const self = /^http:\/\/(127\.0\.0\.1|localhost):8898$/.test(org);
  const J = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (org && !self && !/^(chrome|moz)-extension:\/\//i.test(org)) return J(403, { ok: false, err: '이 PC의 수집기·수집 상태 창만' }); /* 알라딘 화면·다른 웹 페이지는 못 부름 */
  if (u.pathname === '/render') { if (req.method !== 'POST' || req.headers['x-rn-render'] !== '1') return J(403, { ok: false, why: '수집기만' }); return render(u, J); }
  if (u.pathname === '/work' && req.method === 'GET') { if (org) return J(403, { ok: false, err: '이 PC 주소창·앱 창에서만' }); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(pageHtml()); }
  if (req.headers['x-rn-work'] !== '1') return J(403, { ok: false, err: 'X-RN-Work 머리가 없음' });
  const p = u.pathname.slice(6); if (p === 'status' && req.method === 'GET') return J(200, status());
  if (req.method !== 'POST') return J(405, { ok: false });
  const body = (cb) => readBody(req, 256 * 1024, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}') || {}; } catch (x) { return J(400, { ok: false, err: 'bad json' }); } Promise.resolve().then(() => cb(o)).catch((er) => J(500, { ok: false, err: er.message })); });
  const act = (fn) => body((o) => fn(o.why || o.by || '').then((r) => J(200, { ...r, state: status() })));
  if (p === 'cfg') return body((o) => { setCfg(o); J(200, status()); });
  if (p === 'beat') return body((o) => { ST.beat = { role: o.role || null, page: String(o.page || '').slice(0, 60), ver: String(o.ver || '').slice(0, 20), paused: !!o.paused, now: o.now && typeof o.now === 'object' ? o.now : null, lines: Array.isArray(o.lines) ? o.lines.slice(-15) : [], tab: o.tab || null }; ST.beatAt = now(); if (o.pc && !CFG.pc) { CFG.pc = String(o.pc).slice(0, 40); saveCfg(); } J(200, { ok: true, on: !!CFG.on, shown: ST.shown }); });
  if (p === 'lead') return body((o) => { ST.lead = { at: now(), page: String(o.page || '').slice(0, 60), paused: !!o.paused, ver: String(o.ver || '').slice(0, 20) }; if (o.pc && !CFG.pc) { CFG.pc = String(o.pc).slice(0, 40); saveCfg(); } J(200, { ok: true }); }); /* (11/09 oom1) 🩺 수집기 탭 살아 있음 */
  if (p === 'show') return act(show); if (p === 'hide') return act(hide); if (p === 'reopen') return act(reopen); if (p === 'status-win' || p === 'status') return act(statusWin);
  if (p === 'win') return body((o) => { const out = []; for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (o[k] && !r) return J(400, { ok: false, err: '자리·크기가 이상함(폭 400·높이 300 이상 · 작업 창 기준)' }); if (r) { CFG[k] = { ...r, at: now(), src: 'pc' }; out.push(`${k === 'win' ? '작업 창' : '상태 창'} ${r.x},${r.y} · ${r.w}×${r.h}`); } } saveCfg(); log('자리·크기 저장 — ' + out.join(' / ')); J(200, { ok: true, msg: out.join(' / '), state: status() }); });
  if (p === 'hrect') return body((o) => { const r = rectOk(o, 260, 200); if (r) { const c = CFG.hwin || {}; if (c.x !== r.x || c.y !== r.y || c.w !== r.w || c.h !== r.h) { CFG.hwin = { ...r, at: now(), src: 'pc' }; saveCfg(); } } J(200, { ok: true }); });
  return J(404, { ok: false }); }

function start(h) { if (h && h.log) LOG = h.log; stop(); const t = setInterval(() => tick().catch(() => {}), C('tickSec') * 1000); ST.timers.push(t); setTimeout(() => tick('도우미 시작').catch(() => {}), 8000); log(`수집 작업 창 모듈 ${VERSION} 시작 — 작업 창 모드 ${CFG.on ? '켜짐' : '꺼짐'}`); }
function stop() { ST.timers.forEach((t) => clearInterval(t)); ST.timers = []; }
module.exports = { VERSION, api, start, stop, status, setCfg, tick, reviveDecide, reviveTick, _ST: ST, _RV: RV, _RV_DEPS: RV_DEPS, _cfg: () => CFG };
