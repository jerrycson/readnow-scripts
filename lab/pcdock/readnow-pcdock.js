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
const VER = process.env.RN_PCDOCK_VER_TEST || CFG.PCDOCK_VER; /* 시험에서만 옛 판 흉내(RN_PCDOCK_VER_TEST) */
fs.mkdirSync(HOME, { recursive: true });
const LOG = path.join(HOME, 'pcdock.log');
function log(m) { const t = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' '); try { const st = fs.statSync(LOG); if (st.size > 2 * 1048576) fs.renameSync(LOG, LOG + '.1'); } catch (e) {} try { fs.appendFileSync(LOG, `[${t}] ${m}\n`); } catch (e) {} }
/* (0.1.3) 🩺 진단 — 최근 실패 10개를 diag.json에 남기고 GET /api/diag로 줌(이 PC 수집기가 5분마다 읽어 PC 신호 pcBeat.pcs[PC].dock에 실음 → 진단 doc=prd_jobs/pcBeat) · 경로·PC 이름 말고 까닭 글만 */
const DIAGF = path.join(HOME, 'diag.json'); let DIAG = { errs: [] }; try { DIAG = JSON.parse(fs.readFileSync(DIAGF, 'utf8')); if (!Array.isArray(DIAG.errs)) DIAG.errs = []; } catch (e) {}
const scrubP = (t) => String(t || '').replace(/[A-Za-z]:\\Users\\[^\\\s'"]+/gi, '%USERPROFILE%').slice(0, 400);
/* (0.1.4) 짧게 떴다 끝나는 프로세스(아이콘을 다시 눌렀을 때)도 같은 파일에 남기므로 쓰기 전에 다시 읽어 합침(0.1.3은 서버가 들고 있던 것으로 덮어 짧은 프로세스의 실패가 사라졌음) */
function readDiag() { try { const j = JSON.parse(fs.readFileSync(DIAGF, 'utf8')); if (j && Array.isArray(j.errs)) return j; } catch (e) {} return { errs: [] }; }
function noteErr(act, m) { const D = readDiag(); D.errs.unshift({ at: Date.now(), act: String(act || ''), err: scrubP(m) }); D.errs = D.errs.slice(0, 10); DIAG = D; try { const t = DIAGF + '.' + process.pid; fs.writeFileSync(t, JSON.stringify(D)); fs.renameSync(t, DIAGF); } catch (e) {} }
const vnum = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (+x || 0), 0);

/* ── PowerShell ─────────────────────────────────────────────── */
const PS1 = path.join(HOME, 'pcdock-run.ps1');
function psFile() { const want = '﻿' + fs.readFileSync(path.join(APP, 'pcdock.ps1'), 'utf8').replace(/^﻿/, '').replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(PS1, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(PS1, want, 'utf8'); return PS1; }
let psBusy = 0; const psQ = []; const PS_N = { n: 0, at: [] };
function ps(act, input, extra, timeoutMs) { return new Promise((res) => { psQ.push(() => ps1(act, input, extra, timeoutMs).then((r) => { psBusy--; res(r); pump(); })); pump(); }); }
function pump() { while (psBusy < 1 && psQ.length) { psBusy++; psQ.shift()(); } } /* 한 번에 하나만(CPU가 튀지 않게) */
function ps1(act, input, extra, timeoutMs) { return new Promise((res) => { let f; try { f = psFile(); } catch (e) { return res({ ok: false, err: '윈도우 일 파일을 못 씀: ' + e.message }); }
  const exe = process.env.RN_PCDOCK_PS || 'powershell.exe'; const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f, '-Act', act, '-DockHome', HOME, '-CsFile', path.join(APP, 'pcdock-win.cs'), ...(extra || [])];
  PS_N.n++; let p; try { p = cp.execFile(exe, args, { windowsHide: true, timeout: timeoutMs || 60000, maxBuffer: 16 * 1048576 }, (e, out, err) => { const line = String(out || '').replace(/\uFEFF/g, '').trim().split(/\r?\n/).reverse().find((l) => /^\{/.test(l.trim())); let j = null; try { j = JSON.parse(line.trim()); } catch (x) {} /* (0.1.3) 앞에 BOM이 붙어 와도 읽음 */
    if (!j) { const m = '윈도우 일 실패(' + act + '): ' + String(err || (e && e.message) || '응답 없음').slice(0, 300); log('✗ ' + m); noteErr(act, m); return res({ ok: false, err: m }); }
    if (j.ok === false) { const m = '윈도우 일 실패(' + act + '): ' + String(j.err || '까닭 없음').slice(0, 400); log('✗ ' + m); noteErr(act, m); } /* (0.1.3) PowerShell이 '실패'라고 답한 것도 기록(0.1.2까지는 기록에도 안 남아 까닭이 숨었음) */
    res(j); }); } catch (e) { noteErr(act, 'PowerShell을 못 켬: ' + e.message); return res({ ok: false, err: 'PowerShell을 못 켬' }); }
  try { p.stdin.end(JSON.stringify(input || {}), 'utf8'); } catch (e) {} }); }

/* ── 설정 ───────────────────────────────────────────────────── */
const SF = path.join(HOME, 'settings.json');
/* 0.1.0 설정(v:1)은 읽을 때 배치마다 자기 설정을 가진 꼴(v:2)로 옮기고, 예전 파일은 old\settings-v1-<시각>.json에 그대로 남김(지우지 않음) */
function loadCfg() { let j; try { j = JSON.parse(fs.readFileSync(SF, 'utf8')); } catch (e) { const d = SET.validate(SET.defaults(), ST.mons).cfg; if (d.selfAdded && !fs.existsSync(SF)) { try { saveCfg(d); log('① 처음 설정 — 목록에 「리드나우 PC 배치」(이 작은 창)를 넣고 빈 칸에 놓음'); } catch (x) {} } return d; } const v = SET.validate(j, ST.mons);
  /* (0.1.7) PC 배치 작은 창을 목록·빈 칸에 처음 한 번 넣었으면 저장(예전 파일은 old\에) */
  if (!v.migrated && !j.selfAdded && v.cfg.selfAdded) { try { saveCfg(v.cfg); log('① 목록에 「리드나우 PC 배치」(이 작은 창)를 더함' + (v.selfNew ? ' — 빈 칸에 놓음' : '')); } catch (e) { log('✗ PC 배치 창 더하기: ' + e.message); } }
  if (v.migrated) { try { const old = path.join(HOME, 'old'); fs.mkdirSync(old, { recursive: true }); fs.copyFileSync(SF, path.join(old, 'settings-v1-' + Date.now() + '.json')); const tmp = SF + '.t'; fs.writeFileSync(tmp, JSON.stringify(v.cfg, null, 1)); fs.renameSync(tmp, SF); log(`① 예전 설정(0.1.0)을 배치마다 따로인 꼴로 옮김 — 배치 ${v.cfg.place.length} · 예전 파일은 old\\에`); } catch (e) { log('✗ 예전 설정 옮기기: ' + e.message); } }
  return v.cfg; }
function saveCfg(cfg) { const old = path.join(HOME, 'old'); fs.mkdirSync(old, { recursive: true }); if (fs.existsSync(SF)) fs.copyFileSync(SF, path.join(old, 'settings-' + Date.now() + '.json')); /* 예전 설정은 지우지 않고 old\에 */
  const tmp = SF + '.t'; fs.writeFileSync(tmp, JSON.stringify(cfg, null, 1)); fs.renameSync(tmp, SF); }
const ST = { mons: [], monsAt: 0, monErr: '', monErrAt: 0, build: 0, closeTok: null, found: {}, icons: {}, foundAt: 0, from: {}, tried: {}, findErr: '', startup: null, busy: '', last: null, update: null, lastHit: Date.now(), scan: null, port: 0 };
try { const j = JSON.parse(fs.readFileSync(path.join(HOME, 'found.json'), 'utf8')); ST.found = j.found || {}; ST.icons = j.icons || {}; ST.foundAt = j.at || 0; ST.from = j.from || {}; ST.tried = j.tried || {}; } catch (e) {}
/* (0.1.7) 그 경로에 실행 파일이 있나 — 윈도우에서만 실제로 봄(시험 상자는 RN_PCDOCK_MISSING에 적은 경로만 '없음') · shell:AppsFolder\…(시작 메뉴 앱)은 있음으로 */
function exeOk(p) { p = String(p || ''); if (!p) return false; if (/^shell:/i.test(p)) return true; if (process.platform === 'win32') { try { return fs.statSync(p).isFile(); } catch (e) { return false; } }
  return !(process.env.RN_PCDOCK_MISSING || '').split('|').filter(Boolean).includes(p); }
/* (0.1.6) 마지막 실행·배치 결과를 last.json에 — 도우미가 꺼졌다 켜져도 진단(dock.last)에 남음(0.1.5는 메모리에만 있어 다시 켜면 비었음) */
const LASTF = path.join(HOME, 'last.json'); try { const j = JSON.parse(fs.readFileSync(LASTF, 'utf8')); if (j && j.at) ST.last = j; } catch (e) {}
function setLast(L) { ST.last = L; try { const t = LASTF + '.' + process.pid; fs.writeFileSync(t, JSON.stringify(L)); fs.renameSync(t, LASTF); } catch (e) {} }
/* (0.1.6 · 정범님 11/14 15:36 「창 맨 위 이름이 DESKTOP-…」) 🏷 리드나우 기기 이름표 — PC 신호(pcBeat)의 이름과 같게
 *  ① 이 PC 수집기가 진단을 읽을 때 알려 준 이름(pcname.json · 수집기 PC_NAME = pcBeat 칸 이름) ② 번외 도우미 설정(col2.json pc — 웹앱 기기 이름에서 옴)
 *  ③ 인쇄 도우미가 번외를 켤 때 적은 이름(col2\want.json pc) ④ 없으면 윈도우 컴퓨터 이름 */
const NAME_OK = /^[0-9A-Za-z가-힣_\- ]{1,40}$/; const PCNF = path.join(HOME, 'pcname.json');
function pcLabel() { const rj = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) { return {}; } }; const ok = (v) => typeof v === 'string' && NAME_OK.test(v.trim());
  const c2 = process.env.RN_PCDOCK_COL2 || path.join(process.env.USERPROFILE || os.homedir(), 'ReadNow', 'col2');
  const a = rj(PCNF).pc; if (ok(a)) return { pc: a.trim(), src: 'collector' };
  const b = rj(path.join(c2, 'col2.json')).pc; if (ok(b)) return { pc: b.trim(), src: 'col2' };
  const c = rj(path.join(c2, 'want.json')).pc; if (ok(c)) return { pc: c.trim(), src: 'print' };
  return { pc: process.env.COMPUTERNAME || os.hostname(), src: 'os' }; }
function notePcName(v, req) { v = String(v || '').trim(); if (!NAME_OK.test(v)) return; const sf = String(req.headers['sec-fetch-site'] || ''); if (req.headers.origin || sf === 'cross-site' || sf === 'same-site') return; /* 다른 웹 페이지가 이름을 바꾸지 못하게(수집기 GM 요청은 출처 머리가 없음) */
  try { const cur = JSON.parse(fs.readFileSync(PCNF, 'utf8')); if (cur && cur.pc === v) return; } catch (e) {} try { fs.writeFileSync(PCNF, JSON.stringify({ pc: v, at: Date.now() })); log('🏷 기기 이름표 ' + v + ' (이 PC 수집기가 알려 줌)'); } catch (e) {} }
/* (0.1.6) 단계마다 결과 한 줄(진단 dock.last.steps) — 이름 · 됨 · 어떻게/실패 까닭 · 놓을 칸(모니터 #·칸) · 잡은 창 제목 앞부분 · 걸린 초 */
/* (0.1.7) 실행 파일 단계의 출처(진단 rows.src · 건너뜀 skip.tried) — given 설정 경로 · auto 스스로 찾음(어디서) · auto-given-missing 설정 경로에 파일이 없어 스스로 찾은 것으로 */
function stepSrc(plan) { for (const st of plan.steps) if (st.exeKey) { const f = ST.from[st.exeKey] || '찾음'; st.srcTxt = st.src === 'given' ? '설정 경로' : st.src === 'auto-given-missing' ? '설정 경로에 파일이 없어 → ' + f : f; }
  for (const k of plan.skipped) if (k.key && ST.tried[k.key]) k.tried = ST.tried[k.key]; }
function stepRows(cfg, mons, res, plan) { const P = cfg.place || []; const PS = (plan && plan.steps) || []; const mi = (id) => { const i = mons.findIndex((m) => m.id === id); return i < 0 ? '?' : '#' + (i + 1); };
  return (res || []).slice(0, 20).map((x) => { const p = P.find((q) => q.id && q.id === x.inst) || {}; return { n: String(x.name || '').slice(0, 30), ok: !!x.ok, how: scrubP(x.how || '').slice(0, 140), at: p.mon ? `${mi(p.mon)} ${p.c},${p.r} ${p.w}×${p.h}` : '', t: scrubP(x.title || '').slice(0, 40), s: +x.sec || 0, ...(x.miss ? { miss: 1 } : {}), ...((() => { const st = PS.find((q) => q.inst === x.inst && q.srcTxt); return st ? { src: scrubP(st.srcTxt).slice(0, 80) } : {}; })()) }; }); }
/* (0.1.3) 못 읽으면 까닭을 ST.monErr에 — 화면 배치도·처음 화면·진단에 그대로(0.1.2까지는 /api/state가 '모니터 0대'만 줘서 까닭이 숨었음) · 읽었던 모니터가 있으면 그대로 둠 */
/* (0.1.4) 마지막으로 읽은 모니터를 mons.json에 기억 — 다음에 켤 때 모니터를 다시 읽기 전에 그 자리로 창부터 띄움(0.1.3은 모니터 읽기(최대 2분)가 끝나야 창을 띄웠음) */
const MCF = path.join(HOME, 'mons.json'); let MCACHE = []; try { const j = JSON.parse(fs.readFileSync(MCF, 'utf8')); if (Array.isArray(j.mons)) MCACHE = j.mons; } catch (e) {}
async function readMons() { const r = await ps('screens', null, null, 120000);
  if (r.ok && Array.isArray(r.mons) && r.mons.length) { ST.mons = r.mons; ST.monsAt = Date.now(); ST.aware = r.aware; ST.monErr = ''; if (+r.build) ST.build = +r.build; MCACHE = r.mons; try { fs.writeFileSync(MCF, JSON.stringify({ at: Date.now(), mons: r.mons })); } catch (e) {} }
  else { ST.monErr = r.ok ? '윈도우가 모니터를 0대로 알려 줌(원격 화면만 켜진 채 모니터가 꺼졌을 수 있음)' : String(r.err || '까닭 모름'); ST.monErrAt = Date.now(); if (r.ok) { log('✗ 모니터 0대'); noteErr('screens', ST.monErr); } }
  return r; }
/* (0.1.7 · 정범님 11/14 16:29 「카카오톡은 열리지도 않아」 — 진단 skip '실행 파일을 못 찾음') PowerShell 'find'는 증거만 모음(ev: 떠 있는 프로세스·바로 가기·레지스트리·흔한 자리·시작 메뉴 앱)
 *  → apps.js pickExe가 그 차례로 고름 → found(경로)·from(어디서 찾았나)·tried(못 찾았을 때 찾아본 자리)를 found.json에 저장 · 예전 꼴(found만 오는 답)도 받음 */
async function findAll(apps) { const hints = A.findHints(apps || SET.defaults().apps); const r = await ps('find', { hints, icons: (apps || []).filter((a) => a.exe).map((a) => a.exe) }, null, 120000);
  if (r.ok) { if (r.found) { ST.found = { ...ST.found, ...r.found }; for (const k of Object.keys(r.found)) { ST.from[k] = ST.from[k] || '찾음'; delete ST.tried[k]; } }
    for (const h of hints) { const ev = r.ev && r.ev[h.key]; if (!ev) continue; const k = A.pickExe(h, ev);
      if (k.p) { ST.found[h.key] = k.p; ST.from[h.key] = k.from; delete ST.tried[h.key]; const ic = r.icons && r.icons[k.p]; if (ic) ST.icons[h.key] = ic; }
      else { if (ST.found[h.key] && !exeOk(ST.found[h.key])) delete ST.found[h.key]; if (!ST.found[h.key]) { ST.tried[h.key] = k.tried; delete ST.from[h.key]; } } }
    for (const [k2, v] of Object.entries(r.icons || {})) if (!/^[a-z]:\\|^shell:/i.test(k2) || (apps || []).some((a) => a.exe === k2)) ST.icons[k2] = v;
    ST.foundAt = Date.now(); ST.findErr = ''; try { fs.writeFileSync(path.join(HOME, 'found.json'), JSON.stringify({ at: ST.foundAt, found: ST.found, icons: ST.icons, from: ST.from, tried: ST.tried })); } catch (e) {} }
  else { ST.findErr = String(r.err || '까닭 모름'); noteErr('find', ST.findErr); }
  return r; }
/* (0.1.7) 다시 찾아야 할 단서 — 설정 경로도, 찾아 둔 경로도 지금 파일이 없음 */
const needFind = (apps) => A.findHints(apps).filter((h) => !(h.given && exeOk(h.given)) && !exeOk(ST.found[h.key]));
const STARTUP = () => ({ name: 'ReadNow-PC배치', vbs: path.join(path.dirname(APP), 'run.vbs'), args: '--autorun' });
async function startupState() { const r = await ps('startup', STARTUP(), ['-On', '-1']); if (r.ok) ST.startup = !!r.on; return r; }
/* 크롬 프로필 이름(크롬 'Local State') — 크롬 항목의 '프로필' 고르기 */
function chromeProfiles() { try { const f = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Local State'); const j = JSON.parse(fs.readFileSync(f, 'utf8')); const c = (j.profile && j.profile.info_cache) || {}; return Object.keys(c).map((k) => ({ dir: k, name: c[k].name || k })); } catch (e) { return []; } }

/* ── ③ 실행·배치 ────────────────────────────────────────────── */
/* opts: { mode:'keep'|'close', token } — 'close'는 /api/closeplan에서 미리 보여 준 목록(token)의 창만 닫음 · 윈도우 시작 자동 실행은 언제나 'keep'(묻지 않음) */
async function runLayout(by, opts) { opts = opts || {}; if (ST.busy) return { ok: false, err: '지금 ' + ST.busy + ' 중' };
  let close = []; if (opts.mode === 'close') { const t = ST.closeTok; if (!t || t.token !== opts.token || Date.now() - t.at > 5 * 60e3) return { ok: false, err: '닫을 목록이 오래됐거나 없음 — ③을 다시 눌러 목록을 새로 보고 골라 주세요' }; close = t.list; ST.closeTok = null; }
  /* (0.1.5) 실행이 겹치지 않게 — 이 서버 안(ST.busy)뿐 아니라 윈도우 시작 자동 실행(--autorun 프로세스)과도: run.lock(pid·시각) · 15분 넘었거나 그 프로세스가 없으면 낡은 것으로 봄 */
  const lk = runLock(); if (!lk.ok) return { ok: false, err: lk.err };
  ST.busy = '실행·배치'; const t0 = Date.now();
  try { const m = await readMons(); if (!m.ok) return { ok: false, err: m.err }; const cfg = loadCfg();
    const need = needFind(cfg.apps); if (need.length && Date.now() - ST.foundAt > 60e3) await findAll(cfg.apps);
    const plan = A.buildPlan(cfg, ST.mons, ST.found, G, exeOk); stepSrc(plan); if (!plan.steps.length) { const r = { ok: false, err: cfg.place.length ? '놓을 수 있는 것이 없음' : '아직 아무것도 놓지 않았습니다 — ① 설정에서 프로그램을 칸에 끌어 놓아 주세요', skipped: plan.skipped }; setLast({ at: Date.now(), by, ...r, rows: [] }); return r; }
    const nTabs = plan.steps.reduce((x, st) => x + ((st.tabs || []).length), 0); const nSeq = plan.steps.filter((st) => st.match && st.match.seq).length; const slowMax = Math.max(0, ...plan.steps.map((st) => +(st.match && st.match.slow) || 0)); /* (0.1.7) 카카오톡처럼 늦게 뜨는 창은 더 기다림 */ /* (0.1.6) 크롬은 하나씩 · 단계마다 최대 15초 */ /* (0.1.5) 탭마다 최대 8초 — PowerShell 시간 상한과 맞춤(0.1.3은 탭 시간을 안 쳐서 중간에 끊겨 결과를 잃을 수 있었음) */
    const closeFirst = cfg.run.closeFirst !== false ? { procs: A.closeProcs(plan.steps), keepTitle: A.KEEP_TITLE } : null; /* (0.1.6 · 정범님 11/14 15:46) 목록의 프로그램은 먼저 닫고 새로 · 수집기·도우미 창은 지킴 */
    const r = await ps('run', { steps: plan.steps, waitSec: cfg.run.waitSec, close, closeFirst }, null, (Math.max(cfg.run.waitSec, slowMax) + 60 + plan.steps.length * 3 + nTabs * 8 + nSeq * 15 + close.length) * 1000);
    if (+r.build) ST.build = +r.build;
    const res = (r.res || []).map((x) => { const f = A.friendly(x); return { ...x, msg: f.msg, raw: f.raw }; }); const fe = A.friendlyErr(r.err);
    const out = { ok: !!r.ok, err: fe.msg || undefined, raw: fe.raw || undefined, res, skipped: plan.skipped, closed: r.closed || [], pre: r.pre || null, closeErr: r.closeErr || undefined, mode: close.length ? 'close' : 'keep', sec: Math.round((Date.now() - t0) / 1000) };
    log(`③ 실행·배치(${by}${close.length ? ' · 모두 닫고' : ''}) — ${res.filter((x) => x.ok).length}/${res.length} 놓음 · 건너뜀 ${plan.skipped.length}` + (close.length ? ` · 닫기 부탁 ${(r.closed || []).filter((c) => c.ok).length}/${close.length}` : '') + (r.pre ? ` · 먼저 닫음 ${((r.pre.closed) || []).length} · 지킴 ${((r.pre.kept) || []).length}` : '') + ` · ${out.sec}초` + (r.err ? ' · ' + r.err : '') + res.filter((x) => !x.ok).map((x) => ' · ✗ ' + x.name + ': ' + x.how).join(''));
    setLast({ at: Date.now(), by, ...out, rows: stepRows(cfg, ST.mons, res, plan) }); return out; } finally { ST.busy = ''; runUnlock(); } }
const RLK = path.join(HOME, 'run.lock');
function runLock() { for (let k = 0; k < 2; k++) { try { fs.writeFileSync(RLK, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: 'wx' }); return { ok: true }; } catch (e) { if (e.code !== 'EEXIST') return { ok: true };
      let j = null; try { j = JSON.parse(fs.readFileSync(RLK, 'utf8')); } catch (x) {} let alive = false; try { if (j && j.pid && j.pid !== process.pid) { process.kill(j.pid, 0); alive = true; } } catch (x) { alive = x.code === 'EPERM'; }
      if (j && alive && Date.now() - (+j.at || 0) < 15 * 60e3) { const m = '다른 실행·배치가 아직 도는 중(윈도우 시작 자동 실행일 수 있음) — 끝난 뒤 다시'; noteErr('run', m); return { ok: false, err: m }; }
      try { fs.unlinkSync(RLK); } catch (x) {} } } return { ok: true }; }
function runUnlock() { try { const j = JSON.parse(fs.readFileSync(RLK, 'utf8')); if (j.pid === process.pid) fs.unlinkSync(RLK); } catch (e) {} }
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
    if (!best || vnum(best.v) <= vnum(VER)) return; const nd = path.join(path.dirname(APP), 'app.new'); fs.rmSync(nd, { recursive: true, force: true }); fs.mkdirSync(nd, { recursive: true });
    const man = await (await fetch(best.b + 'bundle.json?t=' + Date.now())).json(); const L = (man.files || []).filter((f) => /^[\w.-]+\.(js|html|ps1|cs|json)$/.test(f)); if (!L.includes('readnow-pcdock.js')) throw new Error('묶음 목록이 이상함');
    for (const f of L) { const b = Buffer.from(await (await fetch(best.b + f + '?t=' + Date.now())).arrayBuffer()); fs.writeFileSync(path.join(nd, f), b); if (/\.js$/.test(f) && cp.spawnSync(process.execPath, ['--check', path.join(nd, f)]).status !== 0) throw new Error(f + ' 검사 실패'); }
    fs.writeFileSync(path.join(nd, '.ready'), best.v); ST.update = { v: best.v }; log(`🔄 새 판 ${best.v} 받아 둠 — 다음에 켤 때 바뀜`); } catch (e) { log('🔄 새 판 확인 실패: ' + e.message); } }

/* ── 크롬 앱 창 ─────────────────────────────────────────────── */
/* (0.1.4 · 정범님 11/14 14:30 「✕로 닫고 다시 더블클릭하면 창이 안 뜸」)
 *  · 창 열기는 언제나 '살아 있는 서버'가 맡음 — 아이콘을 다시 누르면 짧게 뜬 프로세스는 POST /api/show만 보내고 바로 끝남(0.1.3은 짧은 프로세스가 스스로 크롬을 띄웠고 실패해도 아무 데도 안 남았음)
 *  · 창이 떠 있으면(화면이 최근에 서버를 불렀고 닫힘 알림이 없으면) 새로 띄우지 않고 그 창을 앞으로(화면 밖이면 주 모니터 오른쪽 위로) — PowerShell 'front'
 *  · 띄운 뒤 20초 안에 그 창이 서버를 부르지 않으면(크롬 프로필이 막 닫히는 중이면 새 창 부탁이 사라짐) 한 번 더 띄움 · 그래도 안 되면 진단(diag.json · PC 신호 dock.errs)에 'window'로 남김
 *  · 모니터를 아직 못 읽었으면 기억해 둔 자리(mons.json) · 없으면 왼쪽 위에 창부터 띄우고, 모니터를 읽은 뒤 오른쪽 위로 옮김 */
const WINST = { at: 0, ok: null, how: '', by: '', n: 0, uiAt: 0, byeAt: 0 };
const uiOpen = () => WINST.uiAt > WINST.byeAt && Date.now() - WINST.uiAt < 150e3; /* 화면은 60초마다 /api/ping을 부름 · 닫을 때 /api/bye */
function setWin(by, ok, how) { WINST.at = Date.now(); WINST.by = String(by || ''); WINST.ok = ok; WINST.how = how; log((ok ? '🪟 ' : '✗ 창: ') + how + ' (' + by + ')'); if (!ok) noteErr('window', how); }
function chromeExe() { if (process.env.RN_PCDOCK_CHROME) return process.env.RN_PCDOCK_CHROME;
  const E = process.env; const L = [ST.found['chrome.exe'], E.ProgramFiles && path.join(E.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'), E['ProgramFiles(x86)'] && path.join(E['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'), E.LOCALAPPDATA && path.join(E.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')];
  return L.find((p) => { try { return p && fs.statSync(p).isFile(); } catch (e) { return false; } }) || ''; }
function winPos() { const M = ST.mons.length ? ST.mons : MCACHE; const pm = M.find((m) => m.primary) || M[0]; if (!pm || !pm.wa) return { x: 40, y: 40, guess: true }; const k = (pm.dpi || 96) / 96;
  return { x: Math.round((pm.wa.x + pm.wa.w) / k - CFG.WIN.w - 12), y: Math.round(pm.wa.y / k + 12), guess: false }; } /* 주 모니터 오른쪽 위 · 늘 같은 자리 */
async function spawnWin(port) { let ch = chromeExe(); if (!ch) { await findAll(SET.defaults().apps); ch = chromeExe(); } if (!ch) return { ok: false, err: '크롬(chrome.exe)을 못 찾아 창을 못 엶 — 크롬이 깔려 있는지 봐 주세요' };
  const pos = winPos(); const prof = path.join(HOME, 'chrome');
  const args = ['--user-data-dir=' + prof, '--app=http://127.0.0.1:' + (port || ST.port) + '/', '--window-size=' + CFG.WIN.w + ',' + CFG.WIN.h, '--window-position=' + pos.x + ',' + pos.y, '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--disable-features=Translate,MediaRouter'];
  return new Promise((res) => { let c; try { c = cp.spawn(ch, args, { detached: true, stdio: 'ignore', windowsHide: false }); } catch (e) { return res({ ok: false, err: '크롬을 못 켬: ' + e.message }); }
    const t = setTimeout(() => res({ ok: true, guess: pos.guess }), 3000); c.once('spawn', () => { clearTimeout(t); c.unref(); res({ ok: true, guess: pos.guess }); }); c.once('error', (e) => { clearTimeout(t); res({ ok: false, err: '크롬을 못 켬: ' + e.message }); }); }); }
const waitUi = async (t0, ms) => { for (let k = 0; k < ms / 250; k++) { if (WINST.uiAt > t0) return true; await new Promise((z) => setTimeout(z, 250)); } return WINST.uiAt > t0; };
async function frontWin() { const r = await ps('front', { title: TITLE, w: CFG.WIN.w, h: CFG.WIN.h }, null, 25000); return r && r.ok ? r : { ok: false, found: false, err: r && r.err }; }
let showing = null;
function showWindow(by, opts) { if (!showing) showing = showWindow1(by, opts || {}).finally(() => { showing = null; }); return showing; }
async function showWindow1(by, opts) { WINST.n++; if (process.env.RN_PCDOCK_NOWIN && !process.env.RN_PCDOCK_CHROME) return { ok: true, skip: true };
  if (opts.probe || uiOpen()) { const f = await frontWin(); if (f.found) { setWin(by, true, f.moved ? '떠 있던 창을 화면 안으로 옮겨 앞으로' : '떠 있던 창을 앞으로'); return { ok: true, how: 'front', moved: !!f.moved }; } }
  const t0 = Date.now(); const s = await spawnWin(); if (!s.ok) { setWin(by, false, s.err); return s; }
  const v = verifyWin(by, t0, s.guess); if (opts.wait) return await v; v.catch(() => {}); return { ok: true, how: 'open' }; }
/* (0.1.7) ①에서 「리드나우 PC 배치」를 놓은 칸(실제 화소) — 그 모니터가 지금 있을 때만 */
function selfRect() { if (!ST.mons.length) return null; const cfg = loadCfg(); const t = cfg.apps.find((a) => a.kind === 'self'); const p = t && cfg.place.find((q) => q.app === t.id); if (!p) return null;
  const m = ST.mons.find((x) => x.id === p.mon); if (!m) return null; const g = G.gridOf(m, ((cfg.mons || {})[p.mon] || {}).grid, G.baseOf(cfg.base)); if (!G.inGrid(p, g)) return null; return G.cellRect(m, g, p.c, p.r, p.w, p.h); }
async function verifyWin(by, t0, guess) {
  if (await waitUi(t0, 20000)) { setWin(by, true, '새 창을 띄움'); const sr = selfRect(); if (sr) setTimeout(() => ps('fit', { title: TITLE, rect: sr }).catch(() => {}), 800); else if (guess) setTimeout(async () => { if (!ST.mons.length) await readMons(); if (ST.mons.length) await ps('fit', { title: TITLE, w: CFG.WIN.w, h: CFG.WIN.h, corner: 'tr' }); }, 1500); return { ok: true, how: 'open' }; }
  const f = await frontWin(); if (f.found) { setWin(by, true, '창은 떴는데 화면이 늦게 불림 — 앞으로 가져옴'); return { ok: true, how: 'front' }; }
  const t1 = Date.now(); const s = await spawnWin(); if (s.ok && await waitUi(t1, 20000)) { setWin(by, true, '처음 부탁이 사라져 한 번 더 띄움'); return { ok: true, how: 'open2' }; }
  const why = s.ok ? '크롬 창이 두 번 다 20초 안에 안 뜸(크롬: ' + scrubP(chromeExe()) + ')' + (f.err ? ' · 창 찾기: ' + f.err : '') : s.err; setWin(by, false, why); return { ok: false, err: why }; }

/* (0.1.4) 🔧 켜는 길 고침 — 설치(0.1.0~0.1.3)가 만든 run.cmd는 node의 출력을 console.log에 이어 붙이게(>>) 했는데,
 *  윈도우 cmd는 그렇게 연 파일을 다른 cmd가 쓰지 못하게 잡아 둠 → 서버가 살아 있는 동안 아이콘을 다시 누르면 두 번째 run.cmd가
 *  console.log를 못 열어 node를 아예 켜지 못함(창 없음 · 기록 없음 · 정범님 11/14 14:30의 유력한 까닭).
 *  → 이어 붙이기를 뺀 start.cmd를 새로 만들고 run.vbs(바탕 화면·시작 메뉴·윈도우 시작 아이콘이 부르는 것)가 그것을 부르게 바꿈
 *  · 돌고 있는 run.cmd는 고치지 않음(cmd는 배치 파일을 읽어 가며 돌아서 도는 중에 바꾸면 엉뚱한 줄을 돎) · 지우지 않음 */
const LAUNCH = { at: 0, how: '' };
function healLauncher() { const dir = process.env.RN_PCDOCK_LAUNCH_DIR || (process.platform === 'win32' ? path.dirname(APP) : ''); if (!dir) return null;
  const vbs = path.join(dir, 'run.vbs'), rc = path.join(dir, 'run.cmd'), sc = path.join(dir, 'start.cmd'); const RED = /[ \t]*>>?[ \t]*"[^"\r\n]*console\.log"[ \t]*2>&1/gi;
  try { if (!fs.existsSync(vbs)) return (LAUNCH.how = 'run.vbs 없음');
    const vb = fs.readFileSync(vbs); const u16 = vb[0] === 0xff && vb[1] === 0xfe; const vt = u16 ? vb.subarray(2).toString('utf16le') : vb.toString('utf8');
    if (/\\start\.cmd"/i.test(vt)) return (LAUNCH.how = '이미 고침(start.cmd)');
    if (!/\\run\.cmd"/i.test(vt) || !fs.existsSync(rc)) return (LAUNCH.how = 'run.vbs 꼴이 낯섦 — 안 건드림');
    const ct = fs.readFileSync(rc, 'utf8'); if (!RED.test(ct)) return (LAUNCH.how = '고칠 것 없음');
    const st = ct.replace(RED, ''); if (!/readnow-pcdock\.js/.test(st)) return (LAUNCH.how = 'run.cmd 꼴이 낯섦 — 안 건드림');
    const t1 = sc + '.t'; fs.writeFileSync(t1, st, 'utf8'); fs.renameSync(t1, sc);
    const nv = vt.replace(/\\run\.cmd"/gi, '\\start.cmd"'); const t2 = vbs + '.t'; fs.writeFileSync(t2, u16 ? Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(nv, 'utf16le')]) : Buffer.from(nv, 'utf8')); fs.renameSync(t2, vbs);
    LAUNCH.at = Date.now(); log('🔧 켜는 길 고침 — run.vbs → start.cmd(console.log 이어 붙이기 뺌 · 서버가 살아 있어도 아이콘이 다시 켜짐) · run.cmd는 그대로 둠'); return (LAUNCH.how = '고침');
  } catch (e) { noteErr('launch', '켜는 길 고치기 실패: ' + e.message); return (LAUNCH.how = '실패: ' + e.message); } }

/* ── HTTP ───────────────────────────────────────────────────── */
const FILES = { '/': ['ui.html', 'text/html; charset=utf-8'], '/grid.js': ['grid.js', 'text/javascript; charset=utf-8'], '/apps.js': ['apps.js', 'text/javascript; charset=utf-8'], '/settings.js': ['settings.js', 'text/javascript; charset=utf-8'] };
function body(req, max) { return new Promise((res, rej) => { const L = []; let n = 0; req.on('data', (b) => { n += b.length; if (n > max) { rej(new Error('너무 큼')); req.destroy(); } else L.push(b); }); req.on('end', () => { try { res(JSON.parse(Buffer.concat(L).toString('utf8') || '{}')); } catch (e) { rej(new Error('JSON이 아님')); } }); req.on('error', rej); }); }
const server = http.createServer(async (req, res) => { const u = new URL(req.url, 'http://127.0.0.1'); const cli = u.searchParams.get('cli') === '1' || req.headers['x-rn-dock-cli'] === '1';
  if (u.pathname !== '/api/diag') ST.lastHit = Date.now(); /* (0.1.3) 수집기의 진단 읽기는 '창이 떠 있음'으로 안 셈(도우미가 스스로 꺼지게) */
  if (u.pathname !== '/api/diag' && u.pathname !== '/api/bye' && !cli) WINST.uiAt = Date.now(); /* (0.1.4) 화면(창)이 부른 것만 '창이 떠 있음' — 아이콘이 띄운 짧은 프로세스(cli=1)·수집기는 빼고 */
  const J = (code, o) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (req.method === 'GET' && FILES[u.pathname]) { const [f, t] = FILES[u.pathname]; res.writeHead(200, { 'content-type': t, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); return res.end(fs.readFileSync(path.join(APP, f))); }
  if (u.pathname === '/api/ping') return J(200, { ok: true, app: 'readnow-pcdock', ver: VER, busy: ST.busy || '', upd: ST.update ? ST.update.v : '' });
  if (!u.pathname.startsWith('/api/')) return J(404, { ok: false });
  /* (0.1.4) 창을 닫을 때 화면이 보내는 알림(sendBeacon은 머리글을 못 붙임) — '창이 닫힘'만 적고 아무것도 켜거나 지우지 않음 */
  if (u.pathname === '/api/bye' && req.method === 'POST') { const o0 = req.headers.origin; if (o0 && o0 !== 'http://127.0.0.1:' + ST.port) return J(403, { ok: false }); WINST.byeAt = Date.now(); req.resume(); return J(200, { ok: true }); }
  /* 이 창(같은 출처)에서만 — 다른 웹 페이지가 이 PC 프로그램을 켜거나 지우게 하지 않음 */
  const org = req.headers.origin; if (req.method !== 'GET' && (req.headers['x-rn-dock'] !== '1' || (org && org !== 'http://127.0.0.1:' + ST.port))) return J(403, { ok: false, err: '이 창에서만' });
  { const hh = String(req.headers.host || ''); if (hh && !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(hh)) return J(403, { ok: false, err: '이 PC 주소로만' }); } /* (0.1.2 🔬 정밀 점검 11/12) GET /api/state도 Host 검사 — 다른 이름(DNS 되돌리기)으로 열면 PC 이름·경로가 새지 않게 */
  try {
    if (u.pathname === '/api/diag') { if (u.searchParams.get('pc')) notePcName(u.searchParams.get('pc'), req); return J(200, diagOut()); } /* (0.1.6) 수집기가 ?pc=<PC 신호 이름>을 붙여 읽음 → 이름표 */
    if (u.pathname === '/api/state') { if (!ST.mons.length || u.searchParams.get('fresh')) await readMons(); if (ST.startup == null) await startupState(); const cfg = loadCfg();
      return J(200, { ok: true, ver: VER, title: TITLE, cfg, mons: ST.mons, monErr: ST.monErr, monErrAt: ST.monErrAt, aware: ST.aware, found: ST.found, from: ST.from, tried: ST.tried, icons: ST.icons, startup: ST.startup, busy: ST.busy, last: ST.last, update: ST.update, catalog: A.CATALOG.map((c) => ({ kind: c.kind, id: c.id || c.kind, name: c.name, icon: c.icon })), profiles: chromeProfiles(), build: ST.build, advice: CL.ADVICE, levels: CL.LEVELS, pc: pcLabel().pc, pcSrc: pcLabel().src, host: os.hostname() }); }
    if (req.method !== 'POST') return J(405, { ok: false });
    const o = await body(req, u.pathname === '/api/lnk' ? 256 * 1024 : 400 * 1024);
    /* (0.1.4) 아이콘을 다시 눌렀을 때 짧은 프로세스가 부름 — 이 서버가 자기 크롬 경로·모니터로 창을 열거나(떠 있으면 앞으로) · /api/quit = 새 판이 넘겨받을 때 이 서버를 끔(일하는 중이면 안 끔) */
    if (u.pathname === '/api/show') { if (ST.update && !ST.busy && !process.env.RN_PCDOCK_NOAUTOSWAP) { const rr = restartNew(); if (rr.ok) { log('🔄 아이콘을 다시 눌러 받아 둔 새 판 ' + ST.update.v + '으로 바로 바꿈'); return J(200, { ok: true, how: 'restart', v: rr.v, ver: VER }); } } /* (0.1.6) 받아 둔 새 판이 있으면 아이콘을 다시 누를 때 바로 바꿈(새 판이 이 서버를 넘겨받음 — 0.1.5까지는 서버가 꺼질 때까지 옛 판) */
      const r = await showWindow(String(o.by || '아이콘').slice(0, 20)); return J(200, { ...r, ver: VER }); }
    if (u.pathname === '/api/quit') { if (ST.busy) return J(200, { ok: false, err: '지금 ' + ST.busy + ' 중' }); log('🔄 새 판(' + String(o.ver || '?').slice(0, 12) + ')이 넘겨받아 꺼짐'); J(200, { ok: true }); setTimeout(() => process.exit(0), 150); return; }
    if (u.pathname === '/api/screens') { const r = await readMons(); const got = !!(r.ok && Array.isArray(r.mons) && r.mons.length); return J(200, { ok: got, err: got ? undefined : ST.monErr, mons: ST.mons, aware: ST.aware }); }
    if (u.pathname === '/api/restart') { if (!ST.update) return J(200, { ok: false, err: '받아 둔 새 판이 없음' }); if (ST.busy) return J(200, { ok: false, err: '지금 ' + ST.busy + ' 중 — 끝난 뒤에' }); const r = restartNew(); return J(200, r); }
    if (u.pathname === '/api/check') { const v = SET.validate(o.cfg, ST.mons); return J(200, { ok: v.ok, errs: v.errs, warns: v.warns }); }
    if (u.pathname === '/api/save') { const v = SET.validate(o.cfg, ST.mons); if (!v.ok) return J(400, { ok: false, errs: v.errs, warns: v.warns }); const keepAuto = loadCfg().auto; v.cfg.auto = { ...v.cfg.auto, on: keepAuto.on }; saveCfg(v.cfg); log(`① 설정 저장 — 프로그램 ${v.cfg.apps.length} · 놓은 자리 ${v.cfg.place.length}`); return J(200, { ok: true, warns: v.warns, cfg: v.cfg }); }
    if (u.pathname === '/api/find') { const r = await findAll(loadCfg().apps); return J(200, { ok: r.ok, err: r.err, found: ST.found, from: ST.from, tried: ST.tried, icons: ST.icons }); }
    if (u.pathname === '/api/lnk') { const name = String(o.name || '').replace(/[^\w가-힣 .()-]/g, '_').slice(0, 80); if (!/\.lnk$/i.test(name) || !o.b64) return J(400, { ok: false, err: '.lnk 파일만' });
      const td = path.join(HOME, 'tmp'); fs.mkdirSync(td, { recursive: true }); const f = path.join(td, 'drop-' + crypto.randomBytes(6).toString('hex') + '.lnk'); fs.writeFileSync(f, Buffer.from(String(o.b64), 'base64'));
      try { const r = await ps('lnk', { path: f }); return J(200, { ok: r.ok, err: r.err, name: name.replace(/\.lnk$/i, ''), target: r.target, args: r.args, icon: r.icon }); } finally { try { fs.unlinkSync(f); } catch (e) {} } }
    if (u.pathname === '/api/exe') { const n = String(o.name || ''); if (!/^[\w가-힣 .()-]{1,80}\.exe$/i.test(n)) return J(400, { ok: false, err: '.exe 이름만' }); const r = await ps('exe', { name: n }, null, 90000); return J(200, { ok: r.ok, err: r.err, list: r.list || [], icon: r.icon }); }
    if (u.pathname === '/api/startup') { const on = !!o.on; const r = await ps('startup', STARTUP(), ['-On', on ? '1' : '0']); if (r.ok) { ST.startup = !!r.on; const c = loadCfg(); c.auto.on = ST.startup; if (Number.isFinite(+o.delaySec)) c.auto.delaySec = Math.max(0, Math.min(600, Math.round(+o.delaySec))); saveCfg(c); log(`② 윈도우 시작 자동 실행·배치 ${ST.startup ? '켬' : '끔'}`); } return J(200, { ok: r.ok, err: r.err, on: ST.startup }); }
    if (u.pathname === '/api/closeplan') return J(200, await closePlan());
    if (u.pathname === '/api/run') return J(200, await runLayout('단추', { mode: o.mode === 'close' ? 'close' : 'keep', token: String(o.token || '') }));
    if (u.pathname === '/api/clean/scan') return J(200, await cleanScan(+o.lv || 1));
    if (u.pathname === '/api/clean/run') return J(200, await cleanRun(o));
    if (u.pathname === '/api/fit') { const view = o.view === 'set' ? CFG.SET_WIN : o.view === 'clean' ? CFG.CLEAN_WIN : CFG.WIN; const home = o.view === 'home' || !o.view; const sr = home ? selfRect() : null; /* (0.1.7) 처음 화면은 ①에서 놓은 칸으로 */
      const r = await ps('fit', { title: TITLE, w: view.w, h: view.h, corner: home ? 'tr' : 'c', ...(sr ? { rect: sr } : {}) }); return J(200, r); }
    return J(404, { ok: false });
  } catch (e) { log('✗ ' + u.pathname + ' ' + e.message); return J(500, { ok: false, err: e.message }); } });

function diagOut() { const L = ST.last; return { ok: true, app: 'readnow-pcdock', ver: VER, at: Date.now(), mons: ST.mons.length, monErr: ST.monErr ? scrubP(ST.monErr).slice(0, 300) : '', monErrAt: ST.monErrAt || 0, aware: ST.aware || '', build: ST.build || 0, busy: ST.busy || '', upd: ST.update ? ST.update.v : '',
  last: L ? { at: L.at, by: L.by, ok: !!L.ok, n: (L.res || []).length, good: (L.res || []).filter((x) => x.ok).length, err: L.err ? scrubP(L.err).slice(0, 200) : '', sec: +L.sec || 0, pre: L.pre ? { closed: (L.pre.closed || []).slice(0, 15).map((c) => ({ p: String(c.proc || '').slice(0, 20), t: scrubP(c.title || '').slice(0, 40), gone: !!c.gone })), kept: (L.pre.kept || []).slice(0, 15).map((c) => ({ p: String(c.proc || '').slice(0, 20), t: scrubP(c.title || '').slice(0, 40), why: String(c.why || '').slice(0, 60) })) } : null, rows: Array.isArray(L.rows) ? L.rows : [], skip: (L.skipped || []).slice(0, 10).map((k) => ({ n: String(k.app || '').slice(0, 30), why: scrubP(k.why || '').slice(0, 160), ...(k.tried ? { tried: scrubP(k.tried).slice(0, 300) } : {}) })) } : null,
  find: { at: ST.foundAt || 0, err: ST.findErr ? scrubP(ST.findErr).slice(0, 200) : '', from: Object.fromEntries(Object.entries(ST.from).slice(0, 12).map(([k, v]) => [k, scrubP(v).slice(0, 60)])), miss: Object.fromEntries(Object.entries(ST.tried).slice(0, 6).map(([k, v]) => [k, scrubP(v).slice(0, 300)])) }, /* (0.1.7) 어디서 찾았나·못 찾으면 찾아본 자리 */ pc: pcLabel().pc, pcSrc: pcLabel().src, errs: readDiag().errs.slice(0, 5),
  win: { at: WINST.at, ok: WINST.ok, how: scrubP(WINST.how).slice(0, 160), by: WINST.by, n: WINST.n, open: uiOpen() }, launch: LAUNCH.how }; } /* (0.1.4) win = 마지막 창 열기 결과 · launch = 켜는 길(run.vbs) 고침 상태 */
/* (0.1.3) 🔄 「새 판으로 바꾸기」 — run.vbs(→ run.cmd가 받아 둔 새 판으로 바꿔 끼움)를 새로 켜고, 새 판이 이 옛 서버를 넘겨받음(아래 main의 '옛 판이면 넘겨받기') */
function restartNew() { const vbs = path.join(path.dirname(APP), 'run.vbs');
  try { const c = process.env.RN_PCDOCK_RESTART ? cp.spawn(process.execPath, [__filename], { detached: true, stdio: 'ignore', env: { ...process.env, RN_PCDOCK_VER_TEST: process.env.RN_PCDOCK_RESTART } }) : cp.spawn('wscript.exe', [vbs], { detached: true, stdio: 'ignore', windowsHide: true }); c.on('error', (e) => log('✗ 새 판으로 바꾸기: ' + e.message)); c.unref(); log(`🔄 새 판 ${ST.update.v}으로 바꾸기 — 새로 켬`); return { ok: true, v: ST.update.v }; } catch (e) { return { ok: false, err: '새로 켜지 못함: ' + e.message }; } }
function pingJ(port) { return new Promise((res) => { const r = http.get({ host: '127.0.0.1', port, path: '/api/ping?cli=1', timeout: 1500 }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { try { const j = JSON.parse(b); res(j.app === 'readnow-pcdock' ? j : null); } catch (e) { res(null); } }); }); r.on('error', () => res(null)); r.on('timeout', () => { r.destroy(); res(null); }); }); }
function ping(port) { return new Promise((res) => { const r = http.get({ host: '127.0.0.1', port, path: '/api/ping?cli=1', timeout: 1500 }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { try { res(JSON.parse(b).app === 'readnow-pcdock'); } catch (e) { res(false); } }); }); r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false); }); }); }
/* (0.1.4) 짧은 프로세스 → 살아 있는 서버에 POST(머리글 x-rn-dock · Origin 없음 · Host 127.0.0.1 — 서버 검사 그대로 통과) */
function post(port, p, body, ms) { return new Promise((res) => { const data = Buffer.from(JSON.stringify(body || {}));
  const r = http.request({ host: '127.0.0.1', port, path: p, method: 'POST', timeout: ms || 5000, headers: { 'content-type': 'application/json', 'x-rn-dock': '1', 'x-rn-dock-cli': '1', 'content-length': data.length } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); r.on('timeout', () => { r.destroy(); res({ code: 0, j: null, err: '시간 넘김' }); }); r.end(data); }); }
function listen(port) { return new Promise((res, rej) => { server.once('error', rej); server.listen(port, '127.0.0.1', () => { server.removeListener('error', rej); res(server.address().port); }); }); }

async function main() { const argv = process.argv.slice(2); const auto = argv.includes('--autorun');
  if (auto) { const cfg = loadCfg(); const d = cfg.auto.delaySec; log(`② 윈도우 시작 — ${d}초 기다린 뒤 실행·배치`); await new Promise((r) => setTimeout(r, d * 1000)); const r = await runLayout('윈도우 시작', { mode: 'keep' }); /* 윈도우 시작 때는 묻지 않고 '남겨 둔 채' */ if (!r.ok) log('② ' + (r.err || '실패')); process.exit(0); }
  healLauncher();
  /* 이미 켜져 있으면 — (0.1.4) 그 서버에 창을 맡기고 바로 끝남 · 옛 판이면 끄고 넘겨받음 */
  const pf = path.join(HOME, 'port.txt'); let old = 0; try { old = +fs.readFileSync(pf, 'utf8'); } catch (e) {} let took = 0;
  for (const p of [...new Set([old, WANT_PORT].filter(Boolean))]) { const pj = await pingJ(p); if (!pj) continue;
    const older = vnum(pj.ver) < vnum(VER);
    if (!older) { const r = await post(p, '/api/show', { by: '아이콘' }, 60000); if (r.j && r.j.ok) { log(`이미 켜져 있어(${pj.ver} · ${p}) 그 서버가 창을 맡음 — ${r.j.how || ''}`); return process.exit(0); }
      log(`✗ 켜져 있는 서버(${pj.ver} · ${p})가 창을 못 엶 — ${(r.j && r.j.err) || r.err || r.code} → 여기서 띄움`); }
    else if (!pj.busy) { /* (0.1.4) 0.1.4부터는 /api/quit로 바로 끔 · 그보다 옛 판(0.1.3 이하)은 PowerShell stopold(readnow-pcdock.js를 돌리는 다른 node만) */
      const q = await post(p, '/api/quit', { ver: VER }, 5000); let gone = false; let how = 'quit';
      if (q.j && q.j.ok) for (let k = 0; k < 15 && !gone; k++) { await new Promise((z) => setTimeout(z, 200)); gone = !(await ping(p)); }
      let r = { ok: true }; if (!gone) { how = 'stopold'; r = await ps('stopold', { self: process.pid }, null, 90000); for (let k = 0; k < 20 && !gone; k++) { await new Promise((z) => setTimeout(z, 300)); gone = !(await ping(p)); } }
      log(`🔄 옛 판 ${pj.ver} 서버(${p})를 넘겨받음(${how}) — ${gone ? '끔' : '안 꺼짐'}${r.ok ? '' : ' · ' + r.err}`); if (gone) { took = p; continue; } if (!r.ok) noteErr('stopold', r.err); }
    /* 옛 판이 일하는 중이거나 못 끔 · 창 열기를 못 맡음 → 그 서버 주소로 여기서 바로 띄움(기억해 둔 크롬 경로·모니터 자리 — PowerShell을 기다리지 않음) */
    ST.port = p; const s0 = await spawnWin(p); if (!s0.ok) setWin('아이콘', false, s0.err); else log(`🪟 켜져 있는 서버(${pj.ver} · ${p}) 주소로 창을 띄움`); return process.exit(0); }
  try { ST.port = CFG.AVOID_PORTS.includes(WANT_PORT) ? await listen(0) : await listen(WANT_PORT); } catch (e) { ST.port = await listen(0); }
  fs.writeFileSync(pf, String(ST.port)); log(`켜짐 판 ${VER} · 127.0.0.1:${ST.port}${took ? ' · 옛 판을 넘겨받음' : ''}`); console.log(`PCDOCK_PORT=${ST.port}`);
  /* 넘겨받았으면 옛 창이 떠 있을 수 있음 — 2.5초 안에 그 창이 이 서버를 부르면 새로 띄우지 않고 앞으로(옛 창은 같은 주소라 그대로 이어짐) */
  if (took === ST.port) await waitUi(0, 2500);
  showWindow('켬').catch((e) => setWin('켬', false, e.message));
  setTimeout(checkUpdate, +process.env.RN_PCDOCK_UPD_MS || 20000).unref(); setInterval(() => { if (!ST.update) checkUpdate(); }, 30 * 60e3).unref(); /* (0.1.6) 오래 켜져 있어도 30분마다 새 판 확인(0.1.5까지는 켤 때 한 번만 — 서버가 살아 있는 동안 새 판을 몰랐음) */
  /* 창이 닫히고 한참 아무도 안 부르면 끔(메모리를 붙잡고 있지 않게) */
  setInterval(() => { if (!ST.busy && Date.now() - ST.lastHit > CFG.IDLE_EXIT_MIN * 60e3) { log('창이 닫혀 꺼짐'); process.exit(0); } }, 60e3).unref(); }
process.on('uncaughtException', (e) => { log('✗ 멈춤: ' + (e && e.stack || e)); noteErr('crash', String(e && e.message || e)); process.exit(1); }); /* (0.1.4) start.cmd는 출력을 파일에 안 남기므로 여기서 */
if (require.main === module) main().catch((e) => { log('✗ 시작 실패: ' + e.message); console.error(e); process.exit(1); });
module.exports = { HOME, ST, runLayout, closePlan, cleanScan, cleanRun, layoutProcs, healLauncher, noteErr };
