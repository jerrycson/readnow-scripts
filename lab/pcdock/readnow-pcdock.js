/* readnow-pcdock.js — 🖥 리드나우 PC 배치 도우미 (정범님 11/12 'JS-MAIN 실행·배치 작은 창' · 첫 판 0.1.0)
 *  모양: 이 PC 안에서만 듣는 작은 Node 서버(127.0.0.1:8796 · 쓰고 있으면 빈 포트) + 크롬 앱 창(따로 된 프로필 — 정범님 크롬·리드나우 웹앱·수집기·번외 크롬과 안 섞임)
 *   창 배치·모니터 읽기·정리는 PowerShell(pcdock.ps1 + C# pcdock-win.cs · DPI 인식)이 하고, 무엇을 할지(칸 셈·계획·보호 목록)는 여기와 grid/apps/settings/clean.js가 정함
 *  단추 4개(화면 ui.html): ① 실행·배치 설정 ② 윈도우 시작 때 자동 실행·배치(켜기/끄기) ③ 설정대로 지금 실행·배치 ④ PC 정리
 *  켜는 법: node readnow-pcdock.js           → 이미 켜져 있으면 창만 다시 엶 · 아니면 서버 + 창
 *           node readnow-pcdock.js --autorun → (윈도우 시작 때) delaySec초 기다린 뒤 설정대로 실행·배치하고 끝남(창 없음)
 *  자료: %LOCALAPPDATA%\ReadNow\pcdock (settings.json · 예전 설정 old\ · 기록 pcdock.log · 받은 새 판 app.new) — 비밀값 없음
 *  새 판: 켤 때 GitHub(또는 readnow.kr)의 pcdock-config.js 판 번호를 보고 높으면 app.new에 받아 검사(node --check) → 다음에 켤 때 run.cmd가 바꿔 끼움
 *  시험(리눅스): RN_PCDOCK_PS=가짜 PowerShell · RN_PCDOCK_HOME=임시 폴더 · RN_PCDOCK_NOWIN=1(크롬 안 띄움) · RN_PCDOCK_NOUPDATE=1 · RN_PCDOCK_PORT */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), crypto = require('crypto');
const CFG = require('./pcdock-config.js'); const G = require('./grid.js'); const A = require('./apps.js'); const SET = require('./settings.js'); const CL = require('./clean.js'); const CP = require('./closeplan.js');
const APP = __dirname;
const HOME = process.env.RN_PCDOCK_HOME || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'ReadNow', 'pcdock') : path.join(os.homedir(), '.readnow-pcdock'));
const WANT_PORT = +process.env.RN_PCDOCK_PORT || CFG.PORT;
const TITLE = '리드나우 PC 배치';
fs.mkdirSync(HOME, { recursive: true });
const LOG = path.join(HOME, 'pcdock.log');
function log(m) { const t = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' '); try { const st = fs.statSync(LOG); if (st.size > 2 * 1048576) fs.renameSync(LOG, LOG + '.1'); } catch (e) {} try { fs.appendFileSync(LOG, `[${t}] ${m}\n`); } catch (e) {} }
const vnum = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (+x || 0), 0);

/* ── PowerShell ─────────────────────────────────────────────── */
const PS1 = path.join(HOME, 'pcdock-run.ps1');
function psFile() { const want = '﻿' + fs.readFileSync(path.join(APP, 'pcdock.ps1'), 'utf8').replace(/^﻿/, '').replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(PS1, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(PS1, want, 'utf8'); return PS1; }
let psBusy = 0; const psQ = []; const PS_N = { n: 0, at: [] };
function ps(act, input, extra, timeoutMs) { return new Promise((res) => { psQ.push(() => ps1(act, input, extra, timeoutMs).then((r) => { psBusy--; res(r); pump(); })); pump(); }); }
function pump() { while (psBusy < 1 && psQ.length) { psBusy++; psQ.shift()(); } } /* 한 번에 하나만(CPU가 튀지 않게) */
function ps1(act, input, extra, timeoutMs) { return new Promise((res) => { let f; try { f = psFile(); } catch (e) { return res({ ok: false, err: '윈도우 일 파일을 못 씀: ' + e.message }); }
  const exe = process.env.RN_PCDOCK_PS || 'powershell.exe'; const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f, '-Act', act, '-DockHome', HOME, '-CsFile', path.join(APP, 'pcdock-win.cs'), ...(extra || [])];
  PS_N.n++; let p; try { p = cp.execFile(exe, args, { windowsHide: true, timeout: timeoutMs || 60000, maxBuffer: 16 * 1048576 }, (e, out, err) => { const line = String(out || '').trim().split(/\r?\n/).reverse().find((l) => /^\{/.test(l.trim())); let j = null; try { j = JSON.parse(line); } catch (x) {}
    if (!j) { const m = '윈도우 일 실패(' + act + '): ' + String(err || (e && e.message) || '응답 없음').slice(0, 300); log('✗ ' + m); return res({ ok: false, err: m }); } res(j); }); } catch (e) { return res({ ok: false, err: 'PowerShell을 못 켬' }); }
  try { p.stdin.end(JSON.stringify(input || {}), 'utf8'); } catch (e) {} }); }

/* ── 설정 ───────────────────────────────────────────────────── */
const SF = path.join(HOME, 'settings.json');
/* 0.1.0 설정(v:1)은 읽을 때 배치마다 자기 설정을 가진 꼴(v:2)로 옮기고, 예전 파일은 old\settings-v1-<시각>.json에 그대로 남김(지우지 않음) */
function loadCfg() { let j; try { j = JSON.parse(fs.readFileSync(SF, 'utf8')); } catch (e) { return SET.defaults(); } const v = SET.validate(j, ST.mons);
  if (v.migrated) { try { const old = path.join(HOME, 'old'); fs.mkdirSync(old, { recursive: true }); fs.copyFileSync(SF, path.join(old, 'settings-v1-' + Date.now() + '.json')); const tmp = SF + '.t'; fs.writeFileSync(tmp, JSON.stringify(v.cfg, null, 1)); fs.renameSync(tmp, SF); log(`① 예전 설정(0.1.0)을 배치마다 따로인 꼴로 옮김 — 배치 ${v.cfg.place.length} · 예전 파일은 old\\에`); } catch (e) { log('✗ 예전 설정 옮기기: ' + e.message); } }
  return v.cfg; }
function saveCfg(cfg) { const old = path.join(HOME, 'old'); fs.mkdirSync(old, { recursive: true }); if (fs.existsSync(SF)) fs.copyFileSync(SF, path.join(old, 'settings-' + Date.now() + '.json')); /* 예전 설정은 지우지 않고 old\에 */
  const tmp = SF + '.t'; fs.writeFileSync(tmp, JSON.stringify(cfg, null, 1)); fs.renameSync(tmp, SF); }
const ST = { mons: [], monsAt: 0, build: 0, closeTok: null, found: {}, icons: {}, foundAt: 0, startup: null, busy: '', last: null, update: null, lastHit: Date.now(), scan: null, port: 0 };
try { const j = JSON.parse(fs.readFileSync(path.join(HOME, 'found.json'), 'utf8')); ST.found = j.found || {}; ST.icons = j.icons || {}; ST.foundAt = j.at || 0; } catch (e) {}
async function readMons() { const r = await ps('screens'); if (r.ok && Array.isArray(r.mons) && r.mons.length) { ST.mons = r.mons; ST.monsAt = Date.now(); ST.aware = r.aware; if (+r.build) ST.build = +r.build; } return r; }
async function findAll(apps) { const r = await ps('find', { hints: A.findHints(apps || SET.defaults().apps), icons: (apps || []).filter((a) => a.exe).map((a) => a.exe) }, null, 90000);
  if (r.ok) { ST.found = { ...ST.found, ...(r.found || {}) }; ST.icons = { ...ST.icons, ...(r.icons || {}) }; ST.foundAt = Date.now(); try { fs.writeFileSync(path.join(HOME, 'found.json'), JSON.stringify({ at: ST.foundAt, found: ST.found, icons: ST.icons })); } catch (e) {} } return r; }
const STARTUP = () => ({ name: 'ReadNow-PC배치', vbs: path.join(path.dirname(APP), 'run.vbs'), args: '--autorun' });
async function startupState() { const r = await ps('startup', STARTUP(), ['-On', '-1']); if (r.ok) ST.startup = !!r.on; return r; }
/* 크롬 프로필 이름(크롬 'Local State') — 크롬 항목의 '프로필' 고르기 */
function chromeProfiles() { try { const f = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Local State'); const j = JSON.parse(fs.readFileSync(f, 'utf8')); const c = (j.profile && j.profile.info_cache) || {}; return Object.keys(c).map((k) => ({ dir: k, name: c[k].name || k })); } catch (e) { return []; } }

/* ── ③ 실행·배치 ────────────────────────────────────────────── */
/* opts: { mode:'keep'|'close', token } — 'close'는 /api/closeplan에서 미리 보여 준 목록(token)의 창만 닫음 · 윈도우 시작 자동 실행은 언제나 'keep'(묻지 않음) */
async function runLayout(by, opts) { opts = opts || {}; if (ST.busy) return { ok: false, err: '지금 ' + ST.busy + ' 중' };
  let close = []; if (opts.mode === 'close') { const t = ST.closeTok; if (!t || t.token !== opts.token || Date.now() - t.at > 5 * 60e3) return { ok: false, err: '닫을 목록이 오래됐거나 없음 — ③을 다시 눌러 목록을 새로 보고 골라 주세요' }; close = t.list; ST.closeTok = null; }
  ST.busy = '실행·배치'; const t0 = Date.now();
  try { const m = await readMons(); if (!m.ok) return { ok: false, err: m.err }; const cfg = loadCfg();
    const need = A.findHints(cfg.apps).filter((h) => !ST.found[h.key]); if (need.length && Date.now() - ST.foundAt > 60e3) await findAll(cfg.apps);
    const plan = A.buildPlan(cfg, ST.mons, ST.found, G); if (!plan.steps.length) { const r = { ok: false, err: cfg.place.length ? '놓을 수 있는 것이 없음' : '아직 아무것도 놓지 않았습니다 — ① 설정에서 프로그램을 칸에 끌어 놓아 주세요', skipped: plan.skipped }; ST.last = { at: Date.now(), by, ...r }; return r; }
    const r = await ps('run', { steps: plan.steps, waitSec: cfg.run.waitSec, close }, null, (cfg.run.waitSec + 40 + plan.steps.length * 3 + close.length) * 1000);
    if (+r.build) ST.build = +r.build;
    const res = (r.res || []).map((x) => { const f = A.friendly(x); return { ...x, msg: f.msg, raw: f.raw }; }); const fe = A.friendlyErr(r.err);
    const out = { ok: !!r.ok, err: fe.msg || undefined, raw: fe.raw || undefined, res, skipped: plan.skipped, closed: r.closed || [], mode: close.length ? 'close' : 'keep', sec: Math.round((Date.now() - t0) / 1000) };
    log(`③ 실행·배치(${by}${close.length ? ' · 모두 닫고' : ''}) — ${res.filter((x) => x.ok).length}/${res.length} 놓음 · 건너뜀 ${plan.skipped.length}` + (close.length ? ` · 닫기 부탁 ${(r.closed || []).filter((c) => c.ok).length}/${close.length}` : '') + ` · ${out.sec}초` + (r.err ? ' · ' + r.err : '') + res.filter((x) => !x.ok).map((x) => ' · ✗ ' + x.name + ': ' + x.how).join(''));
    ST.last = { at: Date.now(), by, ...out }; return out; } finally { ST.busy = ''; } }
/* ③ '모두 닫고' 미리보기 — 지금 떠 있는 창 중 닫을 것 · 지킬 것(까닭과 함께) */
async function closePlan() { if (ST.busy) return { ok: false, err: '지금 ' + ST.busy + ' 중' }; const r = await ps('windows'); if (!r.ok) return { ok: false, err: r.err };
  const cfg = loadCfg(); const P = CP.plan(r.wins || [], cfg.clean.keep); const token = crypto.randomBytes(12).toString('hex');
  ST.closeTok = { token, at: Date.now(), list: P.close.map((w) => ({ h: w.h, pid: w.pid, proc: w.proc, title: w.title })) };
  return { ok: true, token, close: P.close.map((w) => ({ proc: w.proc, title: w.title })), keep: P.keep }; }

/* ── ④ PC 정리 ──────────────────────────────────────────────── */
function layoutProcs(cfg) { const L = []; for (const p of cfg.place) { const t = cfg.apps.find((x) => x.id === p.app); if (!t) continue; const a = A.instApp(t, p); if (a.kind === 'exe') L.push(A.procOf(a.exe || ST.found[A.keyOf(a)] || '')); if (a.kind === 'phone') L.push('PhoneExperienceHost', 'YourPhone', 'YourPhoneServer'); if (a.kind === 'claude') L.push('claude'); } return L.filter(Boolean); }
async function cleanScan(lv) { if (ST.busy) return { ok: false, err: '지금 ' + ST.busy + ' 중' }; ST.busy = '정리 미리보기';
  try { const cfg = loadCfg(); const T = CL.targetsFor(lv); const r = await ps('cleanscan', { targets: T, protect: CL.PROTECT_PATHS, mark: CL.KEEP_MARK.source }, null, 180000); if (!r.ok) return r;
    const sz = {}; for (const t of r.targets || []) sz[t.id] = t; const lp = layoutProcs(cfg); const pp = CL.procPlan(r.procs || [], cfg.clean.keep, lp);
    const items = T.map((t) => t.kind === 'mem' ? { id: t.id, t: t.t, kind: 'mem', mb: Math.round((r.procs || []).filter((p) => !CL.isKept(p, cfg.clean.keep, lp)).reduce((a, p) => a + (p.ws || 0), 0) / 1048576) }
      : t.kind ? { id: t.id, t: t.t, kind: t.kind } : { id: t.id, t: t.t, files: (sz[t.id] || {}).files || 0, bytes: (sz[t.id] || {}).bytes || 0, sample: (sz[t.id] || {}).sample || [], ageDays: t.ageDays });
    const token = crypto.randomBytes(12).toString('hex');
    ST.scan = { token, at: Date.now(), lv, ids: items.filter((i) => !i.kind && i.files > 0).map((i) => i.id), pids: pp.stop.filter((p) => !p.block).map((p) => ({ pid: p.pid, name: p.name })) };
    const out = { ok: true, token, lv, items, stop: pp.stop, info: pp.info, advice: CL.ADVICE };
    if (lv >= 3) { out.startup = CL.startupPlan(r.startup || []); out.defender = { why: CL.DEFENDER.why, cmd: CL.DEFENDER.cmd(process.env.USERPROFILE || '%USERPROFILE%'), have: r.defEx || null }; }
    return out; } finally { ST.busy = ''; } }
async function cleanRun(o) { const s = ST.scan; if (!s || s.token !== o.token || Date.now() - s.at > 10 * 60e3) return { ok: false, err: '미리보기가 오래됐거나 없음 — 미리보기를 다시 눌러 주세요' };
  if (ST.busy) return { ok: false, err: '지금 ' + ST.busy + ' 중' }; ST.busy = 'PC 정리';
  try { const cfg = loadCfg(); const ids = (o.ids || []).filter((i) => s.ids.includes(i)); const pids = (o.pids || []).map(Number).map((p) => s.pids.find((x) => x.pid === p)).filter(Boolean);
    const T = CL.targetsFor(s.lv).filter((t) => !t.kind && ids.includes(t.id)); const trim = !!o.trim;
    const r = await ps('cleanrun', { targets: T, protect: CL.PROTECT_PATHS, mark: CL.KEEP_MARK.source, pids, trim, skip: CL.trimSkip(cfg.clean.keep) }, null, 600000); ST.scan = null;
    if (r.ok) log(`④ 정리(${['', '가볍게', '보통', '깊게'][s.lv]}) — 파일 ${r.deleted || 0}개 ${Math.round((r.freed || 0) / 1048576)}MB · 못 지움 ${r.failed || 0} · 끈 프로그램 ${(r.stopped || []).join(',') || '없음'}` + (r.mem ? ` · 메모리 ${Math.round((r.mem.before - r.mem.after) / 1048576)}MB 비움` : ''));
    return r; } finally { ST.busy = ''; } }

/* ── 새 판 받기(다음에 켤 때 바꿔 끼움) ─────────────────────── */
async function checkUpdate() { if (process.env.RN_PCDOCK_NOUPDATE) return; try { let best = null;
    for (const b of CFG.RAW) { try { const t = await (await fetch(b + 'pcdock-config.js?t=' + Date.now(), { signal: AbortSignal.timeout(15000) })).text(); const v = (t.match(/PCDOCK_VER:\s*'([\d.]+)'/) || [])[1]; if (v && (!best || vnum(v) > vnum(best.v))) best = { v, b }; } catch (e) {} }
    if (!best || vnum(best.v) <= vnum(CFG.PCDOCK_VER)) return; const nd = path.join(path.dirname(APP), 'app.new'); fs.rmSync(nd, { recursive: true, force: true }); fs.mkdirSync(nd, { recursive: true });
    const man = await (await fetch(best.b + 'bundle.json?t=' + Date.now())).json(); const L = (man.files || []).filter((f) => /^[\w.-]+\.(js|html|ps1|cs|json)$/.test(f)); if (!L.includes('readnow-pcdock.js')) throw new Error('묶음 목록이 이상함');
    for (const f of L) { const b = Buffer.from(await (await fetch(best.b + f + '?t=' + Date.now())).arrayBuffer()); fs.writeFileSync(path.join(nd, f), b); if (/\.js$/.test(f) && cp.spawnSync(process.execPath, ['--check', path.join(nd, f)]).status !== 0) throw new Error(f + ' 검사 실패'); }
    fs.writeFileSync(path.join(nd, '.ready'), best.v); ST.update = { v: best.v }; log(`🔄 새 판 ${best.v} 받아 둠 — 다음에 켤 때 바뀜`); } catch (e) { log('🔄 새 판 확인 실패: ' + e.message); } }

/* ── 크롬 앱 창 ─────────────────────────────────────────────── */
async function openWindow() { if (process.env.RN_PCDOCK_NOWIN) return { ok: true, skip: true };
  let ch = ST.found['chrome.exe']; if (!ch) { await findAll(SET.defaults().apps); ch = ST.found['chrome.exe']; } if (!ch) { log('✗ 크롬을 못 찾아 창을 못 엶'); return { ok: false, err: '크롬을 못 찾음' }; }
  if (!ST.mons.length) await readMons(); const pm = ST.mons.find((m) => m.primary) || ST.mons[0]; const k = pm ? (pm.dpi || 96) / 96 : 1;
  const x = pm ? Math.round((pm.wa.x + pm.wa.w) / k - CFG.WIN.w - 12) : 40, y = pm ? Math.round(pm.wa.y / k + 12) : 40; /* 주 모니터 오른쪽 위 · 늘 같은 자리 */
  const prof = path.join(HOME, 'chrome');
  const c = cp.spawn(ch, ['--user-data-dir=' + prof, '--app=http://127.0.0.1:' + ST.port + '/', '--window-size=' + CFG.WIN.w + ',' + CFG.WIN.h, '--window-position=' + x + ',' + y, '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--disable-features=Translate,MediaRouter'], { detached: true, stdio: 'ignore', windowsHide: false });
  c.on('error', (e) => log('✗ 크롬 창: ' + e.message)); c.unref(); return { ok: true }; }

/* ── HTTP ───────────────────────────────────────────────────── */
const FILES = { '/': ['ui.html', 'text/html; charset=utf-8'], '/grid.js': ['grid.js', 'text/javascript; charset=utf-8'], '/apps.js': ['apps.js', 'text/javascript; charset=utf-8'], '/settings.js': ['settings.js', 'text/javascript; charset=utf-8'] };
function body(req, max) { return new Promise((res, rej) => { const L = []; let n = 0; req.on('data', (b) => { n += b.length; if (n > max) { rej(new Error('너무 큼')); req.destroy(); } else L.push(b); }); req.on('end', () => { try { res(JSON.parse(Buffer.concat(L).toString('utf8') || '{}')); } catch (e) { rej(new Error('JSON이 아님')); } }); req.on('error', rej); }); }
const server = http.createServer(async (req, res) => { const u = new URL(req.url, 'http://127.0.0.1'); ST.lastHit = Date.now();
  const J = (code, o) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (req.method === 'GET' && FILES[u.pathname]) { const [f, t] = FILES[u.pathname]; res.writeHead(200, { 'content-type': t, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); return res.end(fs.readFileSync(path.join(APP, f))); }
  if (u.pathname === '/api/ping') return J(200, { ok: true, app: 'readnow-pcdock', ver: CFG.PCDOCK_VER });
  if (!u.pathname.startsWith('/api/')) return J(404, { ok: false });
  /* 이 창(같은 출처)에서만 — 다른 웹 페이지가 이 PC 프로그램을 켜거나 지우게 하지 않음 */
  const org = req.headers.origin; if (req.method !== 'GET' && (req.headers['x-rn-dock'] !== '1' || (org && org !== 'http://127.0.0.1:' + ST.port))) return J(403, { ok: false, err: '이 창에서만' });
  { const hh = String(req.headers.host || ''); if (hh && !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(hh)) return J(403, { ok: false, err: '이 PC 주소로만' }); } /* (0.1.2 🔬 정밀 점검 11/12) GET /api/state도 Host 검사 — 다른 이름(DNS 되돌리기)으로 열면 PC 이름·경로가 새지 않게 */
  try {
    if (u.pathname === '/api/state') { if (!ST.mons.length || u.searchParams.get('fresh')) await readMons(); if (ST.startup == null) await startupState(); const cfg = loadCfg();
      return J(200, { ok: true, ver: CFG.PCDOCK_VER, title: TITLE, cfg, mons: ST.mons, aware: ST.aware, found: ST.found, icons: ST.icons, startup: ST.startup, busy: ST.busy, last: ST.last, update: ST.update, catalog: A.CATALOG.map((c) => ({ kind: c.kind, id: c.id || c.kind, name: c.name, icon: c.icon })), profiles: chromeProfiles(), build: ST.build, advice: CL.ADVICE, levels: CL.LEVELS, pc: os.hostname() }); }
    if (req.method !== 'POST') return J(405, { ok: false });
    const o = await body(req, u.pathname === '/api/lnk' ? 256 * 1024 : 400 * 1024);
    if (u.pathname === '/api/screens') { const r = await readMons(); return J(200, { ok: r.ok, err: r.err, mons: ST.mons }); }
    if (u.pathname === '/api/check') { const v = SET.validate(o.cfg, ST.mons); return J(200, { ok: v.ok, errs: v.errs, warns: v.warns }); }
    if (u.pathname === '/api/save') { const v = SET.validate(o.cfg, ST.mons); if (!v.ok) return J(400, { ok: false, errs: v.errs, warns: v.warns }); const keepAuto = loadCfg().auto; v.cfg.auto = { ...v.cfg.auto, on: keepAuto.on }; saveCfg(v.cfg); log(`① 설정 저장 — 프로그램 ${v.cfg.apps.length} · 놓은 자리 ${v.cfg.place.length}`); return J(200, { ok: true, warns: v.warns, cfg: v.cfg }); }
    if (u.pathname === '/api/find') { const r = await findAll(loadCfg().apps); return J(200, { ok: r.ok, err: r.err, found: ST.found, icons: ST.icons }); }
    if (u.pathname === '/api/lnk') { const name = String(o.name || '').replace(/[^\w가-힣 .()-]/g, '_').slice(0, 80); if (!/\.lnk$/i.test(name) || !o.b64) return J(400, { ok: false, err: '.lnk 파일만' });
      const td = path.join(HOME, 'tmp'); fs.mkdirSync(td, { recursive: true }); const f = path.join(td, 'drop-' + crypto.randomBytes(6).toString('hex') + '.lnk'); fs.writeFileSync(f, Buffer.from(String(o.b64), 'base64'));
      try { const r = await ps('lnk', { path: f }); return J(200, { ok: r.ok, err: r.err, name: name.replace(/\.lnk$/i, ''), target: r.target, args: r.args, icon: r.icon }); } finally { try { fs.unlinkSync(f); } catch (e) {} } }
    if (u.pathname === '/api/exe') { const n = String(o.name || ''); if (!/^[\w가-힣 .()-]{1,80}\.exe$/i.test(n)) return J(400, { ok: false, err: '.exe 이름만' }); const r = await ps('exe', { name: n }, null, 90000); return J(200, { ok: r.ok, err: r.err, list: r.list || [], icon: r.icon }); }
    if (u.pathname === '/api/startup') { const on = !!o.on; const r = await ps('startup', STARTUP(), ['-On', on ? '1' : '0']); if (r.ok) { ST.startup = !!r.on; const c = loadCfg(); c.auto.on = ST.startup; if (Number.isFinite(+o.delaySec)) c.auto.delaySec = Math.max(0, Math.min(600, Math.round(+o.delaySec))); saveCfg(c); log(`② 윈도우 시작 자동 실행·배치 ${ST.startup ? '켬' : '끔'}`); } return J(200, { ok: r.ok, err: r.err, on: ST.startup }); }
    if (u.pathname === '/api/closeplan') return J(200, await closePlan());
    if (u.pathname === '/api/run') return J(200, await runLayout('단추', { mode: o.mode === 'close' ? 'close' : 'keep', token: String(o.token || '') }));
    if (u.pathname === '/api/clean/scan') return J(200, await cleanScan(+o.lv || 1));
    if (u.pathname === '/api/clean/run') return J(200, await cleanRun(o));
    if (u.pathname === '/api/fit') { const view = o.view === 'set' ? CFG.SET_WIN : o.view === 'clean' ? CFG.CLEAN_WIN : CFG.WIN; const r = await ps('fit', { title: TITLE, w: view.w, h: view.h, corner: o.view === 'home' || !o.view ? 'tr' : 'c' }); return J(200, r); }
    return J(404, { ok: false });
  } catch (e) { log('✗ ' + u.pathname + ' ' + e.message); return J(500, { ok: false, err: e.message }); } });

function ping(port) { return new Promise((res) => { const r = http.get({ host: '127.0.0.1', port, path: '/api/ping', timeout: 1500 }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { try { res(JSON.parse(b).app === 'readnow-pcdock'); } catch (e) { res(false); } }); }); r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false); }); }); }
function listen(port) { return new Promise((res, rej) => { server.once('error', rej); server.listen(port, '127.0.0.1', () => { server.removeListener('error', rej); res(server.address().port); }); }); }

async function main() { const argv = process.argv.slice(2); const auto = argv.includes('--autorun');
  if (auto) { const cfg = loadCfg(); const d = cfg.auto.delaySec; log(`② 윈도우 시작 — ${d}초 기다린 뒤 실행·배치`); await new Promise((r) => setTimeout(r, d * 1000)); const r = await runLayout('윈도우 시작', { mode: 'keep' }); /* 윈도우 시작 때는 묻지 않고 '남겨 둔 채' */ if (!r.ok) log('② ' + (r.err || '실패')); process.exit(0); }
  /* 이미 켜져 있으면 창만 다시 */
  const pf = path.join(HOME, 'port.txt'); let old = 0; try { old = +fs.readFileSync(pf, 'utf8'); } catch (e) {}
  for (const p of [...new Set([old, WANT_PORT].filter(Boolean))]) if (await ping(p)) { ST.port = p; await openWindow(); log('이미 켜져 있어 창만 엶(' + p + ')'); return process.exit(0); }
  try { ST.port = CFG.AVOID_PORTS.includes(WANT_PORT) ? await listen(0) : await listen(WANT_PORT); } catch (e) { ST.port = await listen(0); }
  fs.writeFileSync(pf, String(ST.port)); log(`켜짐 판 ${CFG.PCDOCK_VER} · 127.0.0.1:${ST.port}`); console.log(`PCDOCK_PORT=${ST.port}`);
  await openWindow();
  setTimeout(checkUpdate, +process.env.RN_PCDOCK_UPD_MS || 20000).unref();
  /* 창이 닫히고 한참 아무도 안 부르면 끔(메모리를 붙잡고 있지 않게) */
  setInterval(() => { if (!ST.busy && Date.now() - ST.lastHit > CFG.IDLE_EXIT_MIN * 60e3) { log('창이 닫혀 꺼짐'); process.exit(0); } }, 60e3).unref(); }
if (require.main === module) main().catch((e) => { log('✗ 시작 실패: ' + e.message); console.error(e); process.exit(1); });
module.exports = { HOME, ST, runLayout, closePlan, cleanScan, cleanRun, layoutProcs };
