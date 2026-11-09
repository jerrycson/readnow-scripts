/* readnow-col2-helper.js — 🧪 번외 수집 일꾼 도우미 (col2 · 정범님 11/05 '수집기를 밖으로 — 지금 업무는 한 순간도 끊지 않고 번외로')
 * 운영과 따로 도는 시험 환경. 운영 인쇄 도우미(127.0.0.1:8898)·로거 도우미(8899)·수집기·웹앱 파일을 고치지 않고, 그 포트도 쓰지 않음(기본 8797)
 * 하는 일:
 *  ① 숨은 작업 창 — 번외 크롬(따로 된 프로필 col2-work-chrome · 알라딘·어디에도 로그인하지 않음 · 확장 없음)을 화면 밖에 띄우고 작업 표시줄·Alt+Tab에서 숨김
 *     1분마다 지킴: 꺼졌으면 다시 띄움(한 시간 4번까지) · 화면 안으로 나오면 다시 숨김(보이기 중이 아니면)
 *  ② 보이기/숨기기/다시 열기 — 보이기는 저장한 자리·크기로 · 숨길 때 그 자리·크기를 저장(col2.json) · 상태 창도 옮기면 자리·크기를 저절로 저장
 *  ③ 📊 번외 수집 상태 창 — http://127.0.0.1:8797/ (단추: 켜기·끄기·작업 창 보이기·숨기기·다시 열기·비교 화면)
 *  ④ 🔎 그림자 읽기 — 로그인 없는 공개 상품 화면(wproduct.aspx?ItemId=) 하나를 운영 수집기와 똑같은 길·똑같은 해석 코드로 읽어 돌려줌
 *     (운영 공용 파일 readnow-aladin-core.js·readnow-products-core.js를 GitHub에서 그대로 받아 씀 · 속도는 운영보다 훨씬 느리게: col2-pace.js)
 *     Firestore 쓰기는 이 도우미가 하지 않음 — 비교 화면(shadow/compare.html)이 col2_* 칸에만 씀
 * 듣는 길(모두 127.0.0.1만 · Host 확인 · 알라딘 화면 출처는 거절):
 *   GET  /            → 상태 창 화면(주소창·앱 창에서만)       GET /compare → 그림자 비교 화면     GET /s/<파일> → 비교 화면 스크립트
 *   GET  /status      → { ok, ver, on, alive, open, shown, … }  (X-RN-Col2: 1)
 *   POST /cfg         → { on, place, headless, win, hwin, pace } → 상태
 *   POST /win/show|hide|reopen|status-open · /win/rect { win|hwin } · /win/hrect {x,y,w,h,p}
 *   POST /win/app?p=compare|status → 작은 앱 창(크롬 --app · 380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위 · 이미 떠 있으면 앞으로) — 웹앱 「🔎 비교 화면 보기」도 이 길
 *   웹앱 대신 기록(0.1.1 · 비교 화면은 구글 로그인을 하지 않음 — 그 PC에 열린 운영 웹앱이 대신 읽고 씀):
 *     비교 화면 → POST /relay/get {c,id} · /relay/sample {n,ask} · /relay/put {c,id,v,merge}(col2_* 만)
 *     웹앱 → GET /relay/pending(부탁·쓸 것) · POST /relay/answer {docs,sample}(prd_ids·prd_books 만) · /relay/ack {keys,errs}
 *   POST /read/product { itemId } → { ok, page, coreVer, ms, waited } (한 번에 하나 · 속도 규칙)
 *   (0.1.5 정범님 11/09 밤) 🟦 예스24 판매관리 읽기(col2-y24.js — 화면을 열지 않음 · 따로 된 프로필 col2-y24-chrome에 로그인 세션만):
 *     POST /y24/feed {cfg,hold,jobs,ack,jack} ← 이 PC 수집기(알라딘 일하는 탭)가 10초마다 → { y24, recs(받은 응답), took, jres, jstep, tour } · POST /y24/login(로그인 한 번) · POST /y24/run {what: ord|prd|tour}
 *   📊 옆 창(작은 앱 창 · 자리·크기 기억)은 켜질 때 저절로 뜸(col2.json side:false 로 끔)
 * 켜는 법: 운영 웹앱에 단추를 넣기 전까지는 README '켜는 법' — 이 파일은 운영 도우미가 불러 쓰지 않음(완전히 따로) */
'use strict';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os');
const COL2 = require('../col2-config.js');
const { makePace } = require('./col2-pace.js'); const { makeWin } = require('./col2-win.js'); const { Browser } = require('./col2-cdp.js'); const CMP = require('../shadow/col2-compare-core.js'); const { makeY24 } = require('./col2-y24.js'); const JR = require('./col2-journal.js');
const VERSION = COL2.COL2_VER;
const TEST = process.env.RN_COL2_TEST === '1';
const PORT = +process.env.RN_COL2_PORT || COL2.PORT;
if (COL2.PROD_PORTS.includes(PORT)) { console.error(`✗ 포트 ${PORT}는 운영 도우미 포트 — 번외 도우미는 켜지 않음`); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const HOME = process.env.RN_COL2_HOME || path.join(os.homedir(), 'ReadNow', 'col2'); fs.mkdirSync(HOME, { recursive: true });
const CFG_F = path.join(HOME, 'col2.json'), LOG_F = path.join(HOME, 'col2.log'), CORE_D = path.join(HOME, 'core');
const WORK_MARK = 'col2-work-chrome', STAT_MARK = 'col2-stat-chrome', WIN_MARK = 'col2-win-chrome', LOG_MARK = 'col2-log-chrome';
/* (0.1.1) 작은 앱 창 — 화면마다 따로 된 프로필(창 찾기·자리 기억이 서로 안 섞이게) · 자리·크기는 col2.json 의 key 칸 */
const APPS = { status: { mark: STAT_MARK, key: 'hwin', path: '/', name: '📊 상태 창' }, compare: { mark: WIN_MARK, key: 'cwin', path: '/compare', name: '🔎 비교 화면' }, log: { mark: LOG_MARK, key: 'lwin', path: '/log', name: '📜 기록창' } }; /* (0.1.6) 기록창 ↗ 따로 창 */
const ALADIN = TEST && process.env.RN_COL2_ALADIN ? process.env.RN_COL2_ALADIN.replace(/\/$/, '') : COL2.ALADIN;
const D = COL2.WATCH;
const now = () => Date.now(); const BOOT = Date.now().toString(36) + process.pid;
const kst = (ms) => new Date((ms || now()) + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ');
/* (0.1.6) 📜 기록창 — 줄마다 종류·수준·일 이름(col2-journal.js) · 남기기 전에 비밀값 꼴 가림 · 로거 PC는 우리 숍·계정 흔적을 남기지 않음 */
const isLoggerPc = () => /^LOGGER/i.test(String((typeof CFG !== 'undefined' && CFG && CFG.pc) || os.hostname() || ''));
const clean = (m) => { const t = JR.scrub(m); return isLoggerPc() ? JR.loggerScrub(t) : t; };
const log = (m) => { const line = `${kst()} 🧪 ${clean(m)}\n`; try { fs.appendFileSync(LOG_F, line); } catch (e) {} try { process.stdout.write(line); } catch (e) {} };
const JRN = JR.makeJournal({ home: HOME, isLogger: () => isLoggerPc() }); const note = (m, o) => { const e = JRN.add(m, o); if (e) log(e.x); return e; };

/* ── 설정(col2.json) ── */
function loadCfg() { try { const v = JSON.parse(fs.readFileSync(CFG_F, 'utf8')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
let CFG = loadCfg(); const saveCfg = () => { try { fs.writeFileSync(CFG_F, JSON.stringify(CFG, null, 1)); } catch (e) { log('설정 저장 실패: ' + e.message); } };
const num = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const W = (k) => num((CFG.watch || {})[k], 1, 100000, D[k]);
function paceCfg() { const p = { ...COL2.PACE, ...(CFG.pace || {}) }; const floor = TEST ? 100 : COL2.PACE.floorMs; p.minGapMs = Math.max(floor, num(p.minGapMs, 1, 3600e3, COL2.PACE.minGapMs)); p.jitter = Math.min(0.5, Math.max(0, +p.jitter || 0)); p.hourCap = num(p.hourCap, 1, 2000, COL2.PACE.hourCap); p.dayCap = num(p.dayCap, 1, 20000, COL2.PACE.dayCap); p.cool429Min = num(p.cool429Min, 1, 600, COL2.PACE.cool429Min); return p; }
function rectOk(r, minW, minH) { if (!r || typeof r !== 'object') return null; const o = { x: num(r.x, -20000, 20000, NaN), y: num(r.y, -20000, 20000, NaN), w: num(r.w, minW || 200, 8000, NaN), h: num(r.h, minH || 150, 8000, NaN) }; if (![o.x, o.y, o.w, o.h].every(Number.isFinite)) return null; return { ...o, at: +r.at || now() }; }

const PACE = makePace(path.join(HOME, 'pace.json'), paceCfg);
const WIN = makeWin({ psFile: path.join(HOME, 'col2-win.ps1'), D });
function chromeExe() { if (process.env.RN_COL2_CHROME) return process.env.RN_COL2_CHROME; return [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean).map((b) => path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')).find((f) => fs.existsSync(f)) || null; }
/* (0.1.5) 🟦 예스24 판매관리 읽기 — col2-y24.js (이 도우미는 Firestore에 쓰지 않음 · 받은 것은 이 PC 수집기가 예전 길로 올림) */
const Y24 = makeY24({ HOME, Browser, WIN, TEST, note: (m) => note(m, { k: 'y24', m: '예스24' }), log: (m) => log(m), cfg: () => CFG, chromeExe, handoffMs: () => (TEST && CFG.watch && CFG.watch.handoffMs != null ? +CFG.watch.handoffMs : W('handoffSec') * 1000), getText: (u) => getText(u), coreBase: COL2.CORE_BASE, saveRect: (k, r) => { CFG[k] = { ...r, at: now(), src: 'pc' }; saveCfg(); } });

/* ── 운영 공용 파일(그대로 받아 씀 · 6시간마다 새로) ── */
const CORE = { src: [], ver: {}, at: 0, err: null };
function getText(url) { return new Promise((res, rej) => { https.get(url, { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return rej(new Error('받기 ' + r.statusCode)); } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }).on('error', rej).on('timeout', function () { this.destroy(new Error('시간 넘음')); }); }); }
async function loadCore(force) { if (!force && CORE.src.length && now() - CORE.at < 6 * 3600e3) return CORE; const out = [], ver = {}; fs.mkdirSync(CORE_D, { recursive: true });
  for (const f of COL2.CORE_FILES) { let s = null;
    if (process.env.RN_COL2_CORE_DIR) { s = fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, f), 'utf8'); }
    else { const cf = path.join(CORE_D, f); try { s = await getText(COL2.CORE_BASE + f + '?t=' + now()); if (!/VERSION\s*=\s*'[\d.]+'/.test(s)) throw new Error('판 번호가 없음'); fs.writeFileSync(cf, s); } catch (e) { CORE.err = `${f} 받기 실패(${e.message}) — 받아 둔 것을 씀`; try { s = fs.readFileSync(cf, 'utf8'); } catch (x) { s = null; } } }
    if (!s) throw new Error(`운영 공용 파일 ${f}을 못 받음`); out.push(s); ver[f] = (s.match(/VERSION\s*=\s*'([\d.]+)'/) || [])[1] || '?'; }
  CORE.src = out; CORE.ver = ver; CORE.at = now(); if (B) B.ctxId = null; return CORE; }

/* ── 숨은 작업 창(번외 크롬) ── */
const ST = { opens: [], shown: false, open: false, rect: null, busy: false, msg: '', reads: [], reading: null, lastWin: null, timers: [], hwinOpen: false };
const opensHour = () => { ST.opens = ST.opens.filter((t) => now() - t < 3600e3); return ST.opens.length; };
let B = null;
function newBrowser() { return new Browser({ exe: chromeExe(), profile: path.join(HOME, WORK_MARK), headless: !!CFG.headless, rect: { x: -32000, y: 40, w: W('hideW'), h: W('hideH') }, stale: () => WIN.run('kill', WORK_MARK), handoffMs: TEST && CFG.watch && +CFG.watch.handoffMs >= 0 && CFG.watch.handoffMs != null ? +CFG.watch.handoffMs : W('handoffSec') * 1000 }); }
/* (0.1.2) 크롬 띄우기 기록 — 바로 꺼진 까닭(종료 코드·마지막 줄)을 상태(웹앱 col2_ctl·상태 창)에 남김 */
const CH = { fails: 0, last: null, okAt: 0, coolUntil: 0, cools: 0, adopts: 0, retries: 0 }; /* (0.1.3) adopts = 넘겨받아 쓴 횟수 · retries = 한 번 더 띄워 된 횟수 */
const coolMs = () => (TEST && CFG.watch && +CFG.watch.coolMs > 0 ? +CFG.watch.coolMs : W('coolMin') * 60e3);
const hm = (ms) => kst(ms).slice(11, 16);
let LAUNCHING = null; /* 띄우는 중에는 같은 약속을 나눠 받음 — 지킴이와 단추가 동시에 두 벌 띄우지 않게 */
/* (0.1.2 정범님 11/06) 한 시간 상한(4번)에 걸리면 그냥 '쉼'이 아니라 원인(마지막 종료 코드·마지막 줄)을 남기고 30분(coolMin) 뒤 다시 해 봄 — 그때 횟수를 새로 셈 */
function ensureBrowser(why) { if (B && B.alive()) return Promise.resolve(B); if (LAUNCHING) return LAUNCHING;
  let gone = Promise.resolve(); if (B && B.orphan()) { note('조종 연결만 끊긴 번외 크롬을 닫고 새로 띄움(같은 프로필을 쥔 채 남지 않게)'); const op = B.proc; B.kill(); gone = new Promise((r) => { if (op.exitCode != null || op.signalCode != null) return r(); const t = setTimeout(r, 6000); op.once('exit', () => { clearTimeout(t); setTimeout(r, 300); }); }); }
  if (CH.coolUntil && now() >= CH.coolUntil) { CH.coolUntil = 0; ST.opens = []; note(`${W('coolMin')}분 쉼이 끝나 번외 크롬을 다시 띄워 봄`); }
  if (opensHour() >= W('opensPerHour') || CH.coolUntil) { if (!CH.coolUntil) { CH.coolUntil = now() + coolMs(); CH.cools++; note(`한 시간에 ${W('opensPerHour')}번 넘게 다시 띄워 ${W('coolMin')}분 쉼 — 원인: ${CH.last ? CH.last.why : '모름'}`); }
    return Promise.reject(new Error(`한 시간에 ${W('opensPerHour')}번 넘게 다시 띄워 ${W('coolMin')}분 쉼(${hm(CH.coolUntil)}에 다시) — 원인: ${CH.last ? CH.last.why : '모름'}`)); }
  const b = newBrowser(); B = b; ST.opens.push(now()); ST.shown = false; note(`번외 작업 창을 띄움 — ${why || ''} (최근 한 시간 ${opensHour()}번째 · ${CFG.headless ? '화면 없음' : '화면 밖 창'})`);
  LAUNCHING = gone.then(() => b.launch()).then(() => { CH.okAt = now(); if (b.freed && (b.freed.closed || b.freed.killed)) note(`같은 프로필을 쥔 옛 번외 크롬 ${b.freed.closed + b.freed.killed}개를 먼저 닫고 띄움`); if (b.adopted) { CH.adopts++; note('띄운 크롬이 같은 프로필의 다른 크롬에 일을 넘기고 끝나 — 그 크롬(조종 길 살아 있음)을 넘겨받아 그대로 씀'); } if (b.retried) { CH.retries++; note(`첫 띄우기가 바로 꺼져(종료 코드 ${b.firstExit ? b.firstExit.code : '?'}) 이 프로필을 쥔 크롬만 닫고 한 번 더 띄워 됨`); } if (!CFG.headless) placeSoon(); return b; },
    (e) => { CH.fails++; CH.last = { at: kst(), why: e.message, code: b.exit ? b.exit.code : null, signal: b.exit ? b.exit.signal : null, tail: b.exit ? b.exit.tail : null, ms: b.exit ? b.exit.ms : null }; note(e.message); throw e; }).finally(() => { LAUNCHING = null; }); return LAUNCHING; }
function placeSoon() { let k = 0; const t = setInterval(async () => { k++; if (k > 20 || !CFG.on || ST.shown) return clearInterval(t); const r = await WIN.run('hide', WORK_MARK, { w: W('hideW'), h: W('hideH'), place: CFG.place }); if (r.ok && r.n > 0) { ST.open = true; clearInterval(t); note('작업 창을 화면 밖으로 옮기고 작업 표시줄에서 숨김'); } }, TEST ? 400 : 3000); ST.timers.push(t); }
async function closeBrowser(why) { ST.closing = true; try { if (LAUNCHING) await LAUNCHING.catch(() => {}); } finally {} if (B) { await B.close(); note(`번외 작업 창을 닫음 — ${why || ''}`); } B = null; ST.open = false; ST.shown = false; ST.closing = false; }

async function tick(why, force) { if (!force && TEST && CFG.watch && CFG.watch.pause) return; if (ST.busy) return; ST.busy = true;
  try { if (!CFG.on) { if (B && B.alive()) await closeBrowser('꺼짐'); ST.msg = '번외 수집 꺼짐'; return; }
    if (!B || !B.alive()) { if (ST.reading || ST.closing || LAUNCHING) return; try { await ensureBrowser(why || (B ? '작업 창이 꺼져 있음' : '켜짐')); } catch (e) { ST.msg = e.message; return; } }
    if (CFG.headless) { ST.open = true; ST.msg = '화면 없는 번외 크롬 · 일할 준비'; return; }
    const f = await WIN.run('find', WORK_MARK); ST.lastWin = { at: now(), ok: f.ok, n: f.n }; if (!f.ok) { ST.msg = f.err; return; } ST.open = f.n > 0; const it = f.list[0] || null; ST.rect = it ? it.r : null;
    if (!it) { ST.msg = '번외 크롬은 떠 있는데 창을 못 찾음(잠깐 뒤 다시)'; return; }
    if (ST.shown) { ST.msg = '작업 창 보이는 중(🙈 숨기기를 누르면 다시 화면 밖으로)'; return; }
    const vsx = f.vs ? f.vs.x : 0; const offOk = CFG.place === 'edge' ? it.tool : it.tool && it.r && it.r.x + it.r.w <= vsx;
    if (!offOk || it.ic) { const r = await WIN.run('hide', WORK_MARK, { w: W('hideW'), h: W('hideH'), place: CFG.place }); if (r.ok) { ST.msg = '작업 창을 다시 화면 밖으로'; note(ST.msg); } } else ST.msg = '작업 창 숨김 · 일할 준비';
  } catch (e) { ST.msg = '지킴이 오류: ' + e.message; } finally { ST.busy = false; } }

async function show(why) { if (!CFG.on) return { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' }; if (CFG.headless) return { ok: false, err: '화면 없는 크롬으로 도는 중 — 보일 창이 없음' };
  try { await ensureBrowser('보이기'); } catch (e) { return { ok: false, err: e.message }; }
  let f = await WIN.run('find', WORK_MARK); for (let k = 0; k < 10 && f.ok && !f.n; k++) { await new Promise((r) => setTimeout(r, 500)); f = await WIN.run('find', WORK_MARK); } if (!f.ok) return f; if (!f.n) return { ok: false, err: '작업 창을 여는 중 — 잠시 뒤 다시' };
  const w = rectOk(CFG.win, 400, 300) || {}; const r = await WIN.run('show', WORK_MARK, w); if (!r.ok) return r; ST.shown = true; note(`작업 창을 화면 앞으로 (${why || ''})`);
  return { ok: true, msg: '작업 창을 화면 앞으로 꺼냄' + (w.w ? ` (저장한 자리 ${w.x},${w.y} · ${w.w}×${w.h})` : ' (가운데 기본 크기)') }; }
async function hide(why) { const f = await WIN.run('find', WORK_MARK); if (!f.ok) return f; if (!f.n) { ST.shown = false; return { ok: true, msg: '작업 창이 없음' }; } const it = f.list[0];
  if (ST.shown && it && it.r && !it.ic && !it.zm && !it.tool && it.r.w >= 400 && it.r.h >= 300 && f.vs && it.r.x + it.r.w > f.vs.x) { CFG.win = { ...it.r, at: now(), src: 'pc' }; saveCfg(); note(`작업 창 자리·크기 저장 — ${it.r.x},${it.r.y} · ${it.r.w}×${it.r.h}`); }
  const r = await WIN.run('hide', WORK_MARK, { w: W('hideW'), h: W('hideH'), place: CFG.place }); ST.shown = false; note(`작업 창을 다시 화면 밖으로 (${why || ''})`); return r.ok ? { ok: true, msg: '작업 창을 다시 숨김' + (CFG.win ? ' · 보일 때 자리 저장됨' : '') } : r; }
async function reopen(why) { if (!CFG.on) return { ok: false, err: '번외 수집이 꺼져 있음' }; if (ST.reading) return { ok: false, err: '책을 읽는 중 — 끝나면 다시' }; await closeBrowser('다시 열기'); try { await ensureBrowser(why || '다시 열기'); } catch (e) { return { ok: false, err: e.message }; } return { ok: true, msg: '작업 창을 닫고 다시 띄움' }; }
/* 작은 앱 창 자리 — 기억한 자리가 어느 화면 안이면 그대로 · 아니면(처음·화면 밖) 첫 화면 오른쪽 위 (ALPS 도우미 창 open-alps-window.ps1과 같은 셈) */
function appRect(saved, f) { const w = saved ? saved.w : D.appW, h = saved ? saved.h : D.appH; const scr = (f && f.ok && (Array.isArray(f.scr) && f.scr.length ? f.scr : f.wa ? [f.wa] : f.vs ? [f.vs] : [])) || [];
  if (saved && (!scr.length || scr.some((b) => saved.x >= b.x - 40 && saved.x <= b.x + b.w - 80 && saved.y >= b.y - 10 && saved.y <= b.y + b.h - 80))) return { x: saved.x, y: saved.y, w, h, from: 'saved' };
  const wa = (f && f.ok && (f.wa || f.vs)) || null; if (wa) return { x: wa.x + wa.w - w, y: wa.y, w, h, from: 'corner' }; return { w, h, from: 'size' }; }
async function appWin(pg, why) { const A = APPS[pg]; if (!A) return { ok: false, err: '모르는 화면: ' + pg }; const saved = rectOk(CFG[A.key], 260, 200);
  const f = await WIN.run('find', A.mark); const rc = appRect(saved, f);
  if (f.ok && f.n) { const r = await WIN.run('show', A.mark, rc.x != null ? rc : {}); if (pg === 'status') ST.hwinOpen = true; return r.ok ? { ok: true, front: true, msg: `${A.name}을 앞으로` } : r; }
  const ch = chromeExe(); if (!ch) return { ok: false, err: '크롬을 못 찾음' };
  const a = [`--user-data-dir=${path.join(HOME, A.mark)}`, `--app=http://127.0.0.1:${PORT}${A.path}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-crash-restore-bubble', `--window-size=${rc.w},${rc.h}`, ...(rc.x != null ? [`--window-position=${rc.x},${rc.y}`] : [])];
  try { const p = require('child_process').spawn(ch, a, { detached: true, stdio: 'ignore' }); p.on('error', () => {}); p.unref(); } catch (e) { return { ok: false, err: e.message }; }
  if (pg === 'status') ST.hwinOpen = true; note(`${A.name}을 작은 창으로 엶 (${why || ''} · ${rc.w}×${rc.h}${rc.x != null ? ` · ${rc.x},${rc.y}` : ''}${rc.from === 'corner' ? ' · 오른쪽 위' : ''})`);
  return { ok: true, msg: `${A.name}을 작은 창으로 엶` + (rc.from === 'saved' ? ` (기억한 자리 ${rc.x},${rc.y} · ${rc.w}×${rc.h})` : rc.from === 'corner' ? ' (오른쪽 위)' : ''), rect: rc }; }
const statusWin = (why) => appWin('status', why);

/* ── 웹앱 대신 기록 (0.1.1 정범님 11/05 밤 '비교 화면 구글로 로그인이 실패') ──
 * 비교 화면(이 도우미가 내주는 127.0.0.1 화면)은 Firebase에 로그인하지 않음. 그 PC에 열려 있는 운영 웹앱(이미 구글 로그인)이
 *  · 비교 화면이 부탁한 운영 문서(prd_ids·prd_books — 읽기만 · 그 밖 칸은 거절)를 읽어 넘기고
 *  · 비교 화면이 맡긴 결과(col2_* 칸만)를 대신 씀 → 다 쓰면 지움(ack) · 못 쓴 것은 남겨 두고 다음에 다시(까닭 코드를 화면에 보임)
 * 맡긴 결과는 파일(relay-out.json)에 남겨 도우미가 다시 켜져도 잃지 않음 */
const RC = { ...{ READ_OK: ['prd_ids', 'prd_books'], idleSec: 30, hotSec: 2, gotMin: 10, outMax: 5000, poolN: 1000, poolLow: 50 }, ...(COL2.RELAY || {}) };
const RELAY_F = path.join(HOME, 'relay-out.json');
const RL = { want: new Map(), got: new Map(), sampleN: 0, sample: null, out: (() => { try { const v = JSON.parse(fs.readFileSync(RELAY_F, 'utf8')); return Array.isArray(v) ? v : []; } catch (e) { return []; } })(), pullAt: 0, pullBy: '', ackAt: 0, ackN: 0, err: null, errAt: 0, pageAt: 0 };
const saveOut = () => { try { fs.writeFileSync(RELAY_F, JSON.stringify(RL.out)); } catch (e) { log('맡긴 결과 저장 실패: ' + e.message); } };
const RID = /^[\w.-]{1,150}$/;
const PROD_FIELDS = ['aladinItemId', 'title', 'seenInfo', 'infoFrom', 'bookId', ...COL2.BOOK_FIXED]; /* 웹앱이 넘길 운영 문서 칸(견줄 것만 · 작게) */
function relaySum() { return { outN: RL.out.length, wantN: RL.want.size + (RL.sampleN ? 1 : 0), pullAt: RL.pullAt || null, pullBy: RL.pullBy || null, ackAt: RL.ackAt || null, ackN: RL.ackN, err: RL.err, errAt: RL.errAt || null, hot: now() - RL.pageAt < 120e3 }; }
function relayGet(o) { const c = String(o.c || ''), id = String(o.id || ''); if (!RC.READ_OK.includes(c) || !RID.test(id)) return { code: 400, body: { ok: false, err: `웹앱이 대신 읽을 수 있는 칸은 ${RC.READ_OK.join('·')} 뿐` } };
  RL.pageAt = now(); const k = c + '/' + id; const g = RL.got.get(k); if (g && now() - g.at < RC.gotMin * 60e3) return { code: 200, body: { ok: true, have: true, v: g.v } };
  if (!RL.want.has(k)) RL.want.set(k, { c, id, at: now() }); return { code: 200, body: { ok: true, have: false, relay: relaySum() } }; }
function relaySample(o) { const n = num(o.n, 1, 60, 15); RL.pageAt = now(); if (o.ask) { RL.sample = null; RL.sampleN = n; return { ok: true, have: false, relay: relaySum() }; }
  if (RL.sample) return { ok: true, have: true, list: RL.sample.list }; if (!RL.sampleN) RL.sampleN = n; return { ok: true, have: false, relay: relaySum() }; }
function relayPut(o) { const c = String(o.c || ''); if (!c.startsWith(COL2.PREFIX) || c.includes('/')) return { code: 400, body: { ok: false, err: `대신 쓰기는 ${COL2.PREFIX}* 칸만` } };
  const id = o.id == null ? null : String(o.id); if (id != null && !RID.test(id)) return { code: 400, body: { ok: false, err: '문서 이름이 이상함' } };
  if (RL.out.length >= RC.outMax) return { code: 507, body: { ok: false, err: `맡긴 결과가 ${RC.outMax}건 넘게 쌓임 — 웹앱이 열려 있는지 확인하세요` } };
  RL.pageAt = now(); const k = 'o' + now().toString(36) + Math.random().toString(36).slice(2, 8); RL.out.push({ k, c, id, v: o.v == null ? {} : o.v, merge: !!o.merge, at: now() }); saveOut(); return { code: 200, body: { ok: true, k, relay: relaySum() } }; }
function relayPending(by) { RL.pullAt = now(); RL.pullBy = String(by || '').slice(0, 80);
  const poolAsk = AU.poolAskAt && now() - AU.poolAskAt < 10 * 60e3 ? 0 : poolNeed(); if (poolAsk) AU.poolAskAt = now();
  return { ok: true, pool: poolAsk, poolAfter: AU.lap.after || null, poolLap: AU.lap.n, want: [...RL.want.values()].slice(0, 40).map(({ c, id }) => ({ c, id })), sample: RL.sample ? 0 : RL.sampleN, fields: PROD_FIELDS, out: RL.out.slice(0, 25), hot: now() - RL.pageAt < 120e3, idleSec: RC.idleSec, hotSec: RC.hotSec, pc: CFG.pc || null, pcSrc: CFG.pcSrc || null, ver: VERSION, y24: y24Line() }; } /* (0.1.5) y24 = 웹앱 🧭 관리도구 PC별 상태 한 줄(예스24 판매관리 읽기) */
function relayAnswer(o) { let n = 0; for (const d of Array.isArray(o.docs) ? o.docs.slice(0, 200) : []) { const c = String(d && d.c || ''), id = String(d && d.id || ''); if (!RC.READ_OK.includes(c) || !RID.test(id)) continue; const k = c + '/' + id; RL.got.set(k, { v: d.v == null ? null : d.v, at: now() }); RL.want.delete(k); n++; }
  while (RL.got.size > 600) RL.got.delete(RL.got.keys().next().value);
  if (Array.isArray(o.sample)) { RL.sample = { list: o.sample.slice(0, 60).filter((b) => b && RID.test(String(b.id || ''))), at: now() }; RL.sampleN = 0; n++; }
  if (Array.isArray(o.pool)) { if (poolTake(o)) n++; }
  if (o.err) { RL.err = String(o.err).slice(0, 200); RL.errAt = now(); } return { ok: true, n }; }
function relayAck(o) { const ks = new Set(Array.isArray(o.keys) ? o.keys.map(String) : []); const b = RL.out.length; RL.out = RL.out.filter((x) => !ks.has(x.k)); const done = b - RL.out.length;
  const errs = o.errs && typeof o.errs === 'object' ? Object.values(o.errs).map(String) : []; if (errs.length) { RL.err = errs[0].slice(0, 200); RL.errAt = now(); } else if (done) RL.err = null;
  if (done) { RL.ackAt = now(); RL.ackN += done; saveOut(); note(`웹앱이 결과 ${done}건을 대신 기록함${RL.pullBy ? ' — ' + RL.pullBy : ''}`); } if (errs.length) note('웹앱 대신 기록 실패: ' + RL.err); return { ok: true, done, left: RL.out.length }; }

function setCfg(o) { const was = !!CFG.on, wasH = !!CFG.headless; const out = { ...CFG };
  if (o.on != null) out.on = o.on === true; if (o.place != null) out.place = o.place === 'edge' ? 'edge' : 'off'; if (o.headless != null) out.headless = o.headless === true; if (o.auto != null) out.auto = o.auto !== false; if (o.nightOn != null) out.nightOn = o.nightOn !== false; if (o.y24 != null) out.y24 = o.y24 !== false; if (o.y24Jobs != null) out.y24Jobs = o.y24Jobs !== false; if (o.side != null) out.side = o.side !== false; /* (0.1.5) 예스24 판매관리 읽기 · 맡긴 일 · 옆 창 저절로 띄우기 */ if (o.pc != null && String(o.pc).trim()) { const nv = String(o.pc).trim().slice(0, 40); const src = o.pcSrc === 'pc' ? 'pc' : 'web'; if (src === 'pc' || out.pcSrc !== 'pc' || o.pcForce) { out.pc = nv; out.pcSrc = src; } } /* (0.1.1) 이 PC 이름 — 웹앱 기기 이름에서 저절로 · 도우미 화면에서 바꾸면(pcSrc pc) 웹앱이 덮지 않음 */
  for (const k of ['cwin']) { const r = rectOk(o[k], 260, 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: o.src || 'web' }; }
  for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: o.src || 'web' }; }
  if (o.pace && typeof o.pace === 'object') { const p = { ...(out.pace || {}) }; for (const k of Object.keys(COL2.PACE)) if (k !== 'floorMs' && o.pace[k] != null && Number.isFinite(+o.pace[k])) p[k] = +o.pace[k]; out.pace = p; }
  if (TEST && o.watch && typeof o.watch === 'object') out.watch = { ...(out.watch || {}), ...o.watch };
  const ch = JSON.stringify(out) !== JSON.stringify(CFG); CFG = out; if (ch) saveCfg();
  if (was !== !!CFG.on) { note(CFG.on ? '번외 수집 켬' : '번외 수집 끔 — 작업 창을 닫음'); setTimeout(() => tick('설정 바뀜'), 50); if (CFG.on) { autoKick(); sideOpen('켬'); } }
  if (o.y24 != null || was !== !!CFG.on) Y24.kick(200);
  if (o.side === true) sideOpen('옆 창 켬');
  else if (wasH !== !!CFG.headless && B) { closeBrowser('화면 방식 바뀜').then(() => tick('화면 방식 바뀜')); }
  return ch; }

function status() { return { ok: true, ver: VERSION, port: PORT, pid: process.pid, /* (운영 도우미 다리 /col2/stop이 이 프로세스만 멈추게) */ pc: CFG.pc || os.hostname(), pcSrc: CFG.pcSrc || (CFG.pc ? 'web' : 'os'), cwin: CFG.cwin || null, relay: relaySum(), auto: autoSum(), y24: Y24.sum(), side: sideOn(), y24Want: CFG.y24 == null ? !TEST : CFG.y24 !== false, y24Jobs: CFG.y24Jobs !== false, upd: { at: UPD.at ? kst(UPD.at) : null, msg: UPD.msg }, on: !!CFG.on, headless: !!CFG.headless, place: CFG.place || 'off', alive: !!(B && B.alive()), open: ST.open, shown: ST.shown, rect: ST.rect, win: CFG.win || null, hwin: CFG.hwin || null, hwinOpen: ST.hwinOpen,
  opens: opensHour(), chrome: { fails: CH.fails, last: CH.last, okAt: CH.okAt ? kst(CH.okAt) : null, coolUntil: CH.coolUntil ? kst(CH.coolUntil) : null, cools: CH.cools, adopts: CH.adopts, retries: CH.retries }, msg: [ST.msg, CFG.on && AU.msg && AU.msg !== ST.msg ? '자동 읽기: ' + AU.msg : ''].filter(Boolean).join(' · '), /* (0.1.4) 자동 읽기가 왜 쉬는지(하루 몫·표본 기다림·작업 창 준비 실패)도 웹앱 col2_ctl·진단에 보이게 — 예전엔 작업 창 지킴이 글만 보여 멈춘 까닭을 몰랐음 */ reading: ST.reading, reads: ST.reads.slice(-10), pace: PACE.state(), core: { ver: CORE.ver, at: CORE.at ? kst(CORE.at) : null, err: CORE.err }, logs: JRN.tail(15).map((e) => ({ t: e.t, m: e.x, l: e.l, k: e.k })), pcKind: JRN.kind(), aladin: ALADIN === COL2.ALADIN ? 'real' : 'test', at: kst() }; }

/* ── 그림자 읽기 ── */
async function readProduct(o) { const id = String(o.itemId || '').trim(); if (!/^\d{1,13}$/.test(id)) return { code: 400, body: { ok: false, err: '상품 번호(ItemId)가 이상함' } };
  if (!CFG.on) return { code: 409, body: { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' } }; if (ST.reading) return { code: 429, body: { ok: false, err: '다른 책을 읽는 중 — 한 번에 한 권' } };
  ST.reading = { itemId: id, at: now() }; const t0 = now();
  /* (0.1.4 정범님 11/09 '번외 수집기 왜 진행 안 해' — HOME 오늘 1600/1600인데 읽은 책 0 · col2_runs 0) 예전엔 차례(PACE.take — 시간·하루 셈)를 먼저 받고 작업 창을 준비해,
   *  숨은 크롬이 안 뜨거나 30분 쉬는 동안 10초마다 다시 해 볼 때마다 알라딘에 한 번도 안 갔는데 하루 몫이 한 장씩 줄었음(시간 240 × 약 7시간 = 1,600 → 다음 날까지 멈춤)
   *  → 이제는 지금 읽어도 되나(check — 셈하지 않음)만 보고 · 공용 파일·작업 창 준비가 끝난 뒤에야 차례를 받음(셈은 알라딘에 실제로 요청할 때만) */
  const fail0 = (code, err) => { ST.reads.push({ at: kst(), itemId: id, ok: false, why: err, ms: now() - t0, pre: true }); if (ST.reads.length > 50) ST.reads.shift(); if (!o.quiet) note(`그림자 읽기 ${id} — ✗ ${err}`, { k: 'read', l: 'warn', m: '알라딘' }); return { code, body: { ok: false, err } }; };
  try { const c0 = PACE.check(); if (!c0.ok) return { code: 429, body: { ok: false, err: c0.why, retryMs: c0.retryMs, paced: true } };
    let core; try { core = await loadCore(); } catch (e) { return fail0(503, e.message); }
    let br; try { br = await ensureBrowser('읽기'); await br.land(ALADIN + '/', W('pageTimeoutSec')); } catch (e) { PACE.fail('error'); return fail0(503, '작업 창 준비 실패: ' + e.message); }
    const pc = await PACE.take(); if (!pc.ok) return { code: 429, body: { ok: false, err: pc.why, retryMs: pc.retryMs, paced: true } };
    const url = ALADIN + COL2.READ_PATH + id; const r = await br.read(url, core.src, 30) || { ok: false, why: '빈 응답' };
    if (r.ok) PACE.ok(); else if (!r.needLogin) PACE.fail(r.kind || 'error');
    const rec = { at: kst(), itemId: id, ok: !!r.ok, why: r.why || null, ms: now() - t0, title: r.page ? r.page.title : null }; ST.reads.push(rec); if (ST.reads.length > 50) ST.reads.shift();
    if (!o.quiet) note(`그림자 읽기 ${id} — ${r.ok ? '✓ ' + (r.page && r.page.title || '') : '✗ ' + r.why}`, { k: 'read', l: r.ok ? 'ok' : r.needLogin ? 'warn' : 'err', m: '알라딘', d: { id, ok: !!r.ok, ms: rec.ms, why: r.ok ? null : r.why } });
    return { code: 200, body: { ...r, ok: !!r.ok, itemId: id, url, waited: pc.waited, tookMs: rec.ms, helperVer: VERSION, core: core.ver, pc: CFG.pc || os.hostname() } };
  } catch (e) { PACE.fail('error'); return { code: 500, body: { ok: false, err: e.message } }; } finally { ST.reading = null; } }

/* ── 화면 ── */
/* ── 저절로 돌기 (0.1.1 정범님 11/05 밤 '번외 수집기가 돌아가게만 · 새벽 1~5시에도') ──
 * 켜져 있으면 사람이 누르지 않아도: 표본 목록(웹앱이 운영 prd_books에서 골라 넘김 · pool.json에 남김)에서 차례로 한 권씩
 *  그림자 읽기(readProduct — 속도 규칙 PACE 그대로: 한 장 뒤 4초 안팎 · 시간 240 · 하루 1,600 — 정범님 11/05 밤 '메인으로 돌릴 때까지 사람 속도 두 배') → 운영 문서와 칸마다 견줌 → col2_books 결과를 맡김(웹앱이 대신 씀)
 *  · 하루 상한(1,600장)을 다 쓰면 멈추고 다음 날(한국 날짜) 이어감 · 표본을 다 돌면 처음부터 다시(웹앱이 열려 있으면 새 표본을 받음)
 *  · 웹앱이 닫혀 있어도 계속 읽고 결과는 relay-out.json에 쌓음 → 웹앱이 다시 열리면 올림 · 하루 요약은 col2_runs/auto_<날짜> */
const AC = { on: true, nightOn: true, nightFrom: 1, nightTo: 5, ...(COL2.AUTO || {}) };
const POOL_F = path.join(HOME, 'pool.json');
/* (0.1.2 정범님 11/06 '당연히 표본을 늘려야 — 같은 책을 다시 읽어서 얻는 게 뭐가 있어?') 표본 = 운영 prd_books 전체(2.6만 권 안팎)를 한 바퀴씩
 *  · 웹앱이 문서 이름 차례(documentId)로 1,000권씩 이어 넘김 — 도우미가 '어디까지 받았나'(lap.after = 마지막 문서 이름)를 pool.json 차례표에 적고 다음 묶음은 그 뒤부터 부탁
 *  · 한 번 읽은 책은 한 바퀴를 다 돌 때까지 다시 읽지 않음(남은 책이 50권 아래면 다음 1,000권을 미리 부탁해 뒤에 붙임 · 같은 상품 번호는 빼고 붙임)
 *  · 웹앱이 '끝(poolEnd)'이라 하면 그 묶음까지 읽고 다음 바퀴(lap.n+1)를 처음부터 · 예전 웹앱(이어 넘김을 모름)이 넘긴 무작위 표본은 남은 책이 없을 때만 받음
 *  · 표본 목록(pool.json · 1,000권 · 크다)은 바뀔 때만 쓰고, 읽은 자리·오늘 셈(pool-at.json · 작다)은 한 권마다 씀 */
const POOL_AT_F = path.join(HOME, 'pool-at.json');
const AU = (() => { let v = {}, a = null; try { v = JSON.parse(fs.readFileSync(POOL_F, 'utf8')) || {}; } catch (e) {} try { a = JSON.parse(fs.readFileSync(POOL_AT_F, 'utf8')) || null; } catch (e) {} const x = a || v; const lap = x.lap && typeof x.lap === 'object' ? x.lap : {};
  return { pool: Array.isArray(v.pool) ? v.pool : [], cur: +x.cur || 0, poolAt: +v.poolAt || 0, day: x.day && x.day.d ? x.day : { d: '', n: 0, same: 0, diff: 0, no: 0, fail: 0 }, lap: { n: +lap.n || 1, after: lap.after || null, end: !!lap.end, read: +lap.read || 0, got: +lap.got || 0, at: lap.at || null, done: Array.isArray(lap.done) ? lap.done.slice(-5) : [] }, poolAskAt: 0, nextAt: 0, msg: '', last: x.last || null, t: null, running: false }; })();
/* (0.1.4) 켜질 때 한 번 — 옛 판이 알라딘에 안 가고 센 오늘 몫을 실제로 읽은 수(pool-at.json 오늘 셈)로 바로잡음 → 그날 바로 다시 돎 */
{ const real = AU.day && AU.day.d === new Date(now() + 9 * 3600e3).toISOString().slice(0, 10) ? +AU.day.n || 0 : 0; const fx = PACE.trueUp(real, '옛 판이 작업 창 준비 실패 때도 하루 몫을 셈'); if (fx) note(`오늘 몫 바로잡음 — ${fx.was}장으로 세어 있었으나 실제로 읽은 것은 ${fx.now}장(옛 판이 숨은 크롬 준비 실패 때도 셈) · 오늘 남은 몫으로 다시 돎`); }
function savePos() { try { fs.writeFileSync(POOL_AT_F, JSON.stringify({ cur: AU.cur, day: AU.day, last: AU.last, lap: AU.lap })); } catch (e) { log('읽은 자리 저장 실패: ' + e.message); } }
function savePool() { try { fs.writeFileSync(POOL_F, JSON.stringify({ pool: AU.pool, poolAt: AU.poolAt, n: AU.pool.length })); } catch (e) { log('표본 목록 저장 실패: ' + e.message); } savePos(); }
/* 웹앱이 넘긴 표본 묶음 받기 — 이어 넘김(poolFor = 우리가 부탁한 자리)이 맞을 때만 뒤에 붙임 · 아니면(늦게 온 옛 답) 버림 */
function poolTake(o) { const L0 = o.pool.filter((b) => b && RID.test(String(b.id || '')) && /^\d{1,13}$/.test(String(b.aladinItemId || ''))).map((b) => ({ itemId: String(b.aladinItemId), bookId: String(b.id), prod: b }));
  const paged = Object.prototype.hasOwnProperty.call(o, 'poolFor');
  if (paged) { if ((o.poolFor || null) !== (AU.lap.after || null) || (o.poolLap != null && +o.poolLap !== AU.lap.n)) { note('늦게 온 표본 묶음은 버림(이미 다음 자리를 받음)'); return false; }
    const rest = AU.pool.slice(AU.cur); const have = new Set(rest.map((b) => b.itemId)); const add = L0.filter((b) => !have.has(b.itemId) && have.add(b.itemId));
    AU.pool = rest.concat(add); AU.cur = 0; AU.poolAt = now(); AU.poolAskAt = 0; AU.lap.got += add.length; if (!AU.lap.at) AU.lap.at = kst();
    const nx = String(o.poolNext || (o.pool.length ? o.pool[o.pool.length - 1].id : '') || ''); if (nx && RID.test(nx)) AU.lap.after = nx; AU.lap.end = !!o.poolEnd || (!nx && !o.pool.length);
    savePool(); note(`웹앱이 표본 ${add.length}권을 이어 넘김(${AU.lap.n}바퀴 · 이번 바퀴 받은 것 ${AU.lap.got}권${AU.lap.end ? ' · 이 묶음이 끝' : ''}) — 차례로 그림자 읽기`); return true; }
  if (!L0.length || poolLeft() > 0) return false; /* 예전 웹앱의 무작위 표본 — 남은 책이 있으면 받지 않음(다시 읽기 막음) */
  AU.pool = L0; AU.cur = 0; AU.poolAt = now(); AU.poolAskAt = 0; savePool(); note(`웹앱이 표본 목록 ${L0.length}권을 넘김(예전 웹앱 · 무작위) — 차례로 그림자 읽기`); return true; }
/* 한 바퀴 끝 → 다음 바퀴(처음부터) */
function lapNext() { const L = AU.lap; L.done = (L.done || []).concat([{ n: L.n, read: L.read, from: L.at, to: kst() }]).slice(-5); note(`표본 ${L.n}바퀴를 다 돎(${L.read}권 읽음) — 처음부터 다음 바퀴`); AU.lap = { n: L.n + 1, after: null, end: false, read: 0, got: 0, at: null, done: L.done }; AU.pool = []; AU.cur = 0; AU.poolAskAt = 0; savePool(); }
const kday = (t) => new Date((t || now()) + 9 * 3600e3).toISOString().slice(0, 10);
const kHour = () => new Date(now() + 9 * 3600e3).getUTCHours();
const autoOn = () => CFG.auto == null ? AC.on !== false : CFG.auto !== false;
const nightOn = () => CFG.nightOn == null ? AC.nightOn !== false : CFG.nightOn !== false;
const poolLeft = () => Math.max(0, AU.pool.length - AU.cur);
function poolNeed() { if (!autoOn()) return 0; if (AU.lap.end) { if (poolLeft() > 0) return 0; lapNext(); } return poolLeft() < RC.poolLow ? RC.poolN : 0; } /* (0.1.2) 하루 지나면 새 표본으로 갈아끼우던 것을 없앰 — 갈아끼우면 남은 책을 버리고 같은 책을 다시 읽게 됨 */
const untilKstMidnight = () => { const t = now() + 9 * 3600e3; return 86400e3 - (t % 86400e3); };
/* 같은 문서를 아직 안 올렸으면 새 값으로 바꿔 끼움(하루 요약이 쌓이지 않게) */
function outReplace(c, id, v, merge) { const i = RL.out.findIndex((x) => x.c === c && x.id === id); const it = { k: 'o' + now().toString(36) + Math.random().toString(36).slice(2, 8), c, id, v, merge: !!merge, at: now() }; if (i >= 0) RL.out[i] = it; else RL.out.push(it); saveOut(); }
async function autoStep() {
  if (!CFG.on) { AU.msg = '번외 수집 꺼짐'; return 30e3; }
  if (!autoOn()) { AU.msg = '자동 읽기 꺼 둠(설정 auto)'; return 30e3; }
  const h = kHour(); if (!nightOn() && h >= AC.nightFrom && h < AC.nightTo) { AU.msg = `새벽 ${AC.nightFrom}~${AC.nightTo}시 쉼(설정 nightOn 꺼짐)`; return 10 * 60e3; }
  if (ST.reading) return 3000;
  if (AU.cur >= AU.pool.length && AU.lap.end && AU.pool.length) lapNext();
  if (AU.cur >= AU.pool.length) { AU.msg = AU.pool.length ? `다음 ${num(RC.poolN, 1, 5000, 1000).toLocaleString()}권을 기다림(${AU.lap.n}바퀴 · 지금까지 ${AU.lap.read}권) — 이 PC에서 리드나우 웹앱(로그인된 것)이 이어 넘김` : '표본 목록을 기다림 — 이 PC에서 리드나우 웹앱(로그인된 것)을 열어 두면 넘겨받음'; return 15e3; }
  if (RL.out.length >= RC.outMax) { AU.msg = `올리지 못한 결과가 ${RL.out.length}건 — 웹앱이 열릴 때까지 쉼`; return 60e3; }
  const c = PACE.check(); if (!c.ok) { AU.msg = c.why + (c.retryMs == null ? ' — 다음 날 이어감' : ''); return c.retryMs == null ? untilKstMidnight() + 30e3 : Math.min(c.retryMs + 500, 30 * 60e3); }
  if (c.waitMs > 0) { AU.msg = '자동으로 도는 중'; return c.waitMs + 50; }
  const it = AU.pool[AU.cur]; AU.cur++; const d = kday(); if (AU.day.d !== d) AU.day = { d, n: 0, same: 0, diff: 0, no: 0, fail: 0 };
  const r = await readProduct({ itemId: it.itemId, quiet: true }); const b = r.body || {};
  if (r.code !== 200 || !b.ok) { if (b.paced || r.code === 503 || r.code === 409 || r.code === 429) { AU.cur--; savePos(); AU.msg = '잠깐 쉼 — ' + (b.err || b.why || r.code); return r.code === 503 ? 10e3 : 5000; } /* 작업 창 준비 중·읽는 중이면 그 책을 다시(셈하지 않음) */ AU.day.n++; AU.day.fail++; AU.lap.read++; AU.last = { at: kst(), itemId: it.itemId, ok: false, why: b.why || b.err || null }; note(`그림자 읽기 ${it.itemId} — ✗ ${b.why || b.err || r.code}`, { k: 'read', l: b.needLogin ? 'warn' : 'err', m: '알라딘', d: { id: it.itemId, ok: false, ms: b.tookMs || b.ms || null, why: b.why || b.err || null } }); }
  else { const sh = CMP.pickPage(b.page, COL2.BOOK_FIXED); const cmp = CMP.compareBook(it.prod || null, sh, COL2.BOOK_FIXED); AU.day.n++; AU.lap.read++; AU.day[cmp.verdict === 'same' ? 'same' : cmp.verdict === 'noprod' ? 'no' : 'diff']++;
    outReplace('col2_books', it.bookId || 'itemId_' + it.itemId, { itemId: it.itemId, bookId: it.bookId || null, at: new Date().toISOString(), runId: 'auto_' + d, auto: true, page: sh, coreVer: b.coreVer || null, alVer: b.alVer || null, helperVer: VERSION, pc: CFG.pc || os.hostname(), ms: b.ms || null, cmp: { verdict: cmp.verdict, n: cmp.n, diffFields: cmp.diffFields } });
    AU.last = { at: kst(), itemId: it.itemId, ok: true, verdict: cmp.verdict, title: sh.title || null };
    note(`그림자 읽기 ${it.itemId} — ✓ ${sh.title || ''} · ${{ same: '같음', noprod: '운영 칸 없음' }[cmp.verdict] || '다름' + (cmp.diffFields && cmp.diffFields.length ? '(' + cmp.diffFields.slice(0, 4).join('·') + ')' : '')}`, { k: 'read', l: cmp.verdict === 'same' || cmp.verdict === 'noprod' ? 'ok' : 'warn', m: '알라딘', d: { id: it.itemId, ok: true, ms: b.tookMs || b.ms || null, v: cmp.verdict } }); }
  const D2 = AU.day; outReplace('col2_runs', 'auto_' + d, { at: new Date().toISOString(), auto: true, d, n: D2.n, sameN: D2.same, diffN: D2.diff, noN: D2.no, failN: D2.fail, lap: AU.lap.n, lapRead: AU.lap.read, ver: VERSION, pc: CFG.pc || os.hostname() });
  savePos(); AU.msg = '자동으로 도는 중'; return 1000; }
async function autoLoop() { if (AU.running) return; AU.running = true; let next = 15e3; try { next = await autoStep(); } catch (e) { AU.msg = '자동 읽기 오류: ' + e.message; next = 60e3; } finally { AU.running = false; }
  AU.nextAt = now() + next; clearTimeout(AU.t); AU.t = setTimeout(autoLoop, next); restNote(); }
/* (0.1.6) 쉼 까닭이 바뀔 때만 기록창에 한 줄(10초마다 같은 줄이 쌓이지 않게) · 다시 돌면 '다시 읽기 시작' */
let restWas = null; function restNote() { const m = String(AU.msg || ''); const run = /도는 중/.test(m); const key = run ? '' : m.replace(/\d[\d,.]*/g, '#');
  if (key === restWas) return; const was = restWas; restWas = key; if (run) { if (was) note('▶ 자동 읽기 다시 시작', { k: 'rest', l: 'ok', m: '쉼' }); return; } if (m) note('⏸ 자동 읽기 쉼 — ' + m, { k: 'rest', l: /429|오류|실패/.test(m) ? 'warn' : 'info', m: '쉼' }); }
const autoKick = () => { clearTimeout(AU.t); AU.t = setTimeout(autoLoop, 500); };
function autoSum() { const p = PACE.state(); return { on: autoOn() && !!CFG.on, auto: autoOn(), nightOn: nightOn(), msg: AU.msg, poolN: AU.pool.length, left: poolLeft(), poolAt: AU.poolAt ? kst(AU.poolAt) : null, nextMs: AU.nextAt ? Math.max(0, AU.nextAt - now()) : null, day: AU.day, dayN: p.dayN, dayCap: p.dayCap, last: AU.last, lap: { n: AU.lap.n, read: AU.lap.read, got: AU.lap.got, end: AU.lap.end, after: AU.lap.after, at: AU.lap.at, done: AU.lap.done } }; }

/* ── 스스로 새 판 받기 (0.1.1 · 정범님이 주무시는 동안 사람 손 없이) ──
 * 30분마다 GitHub lab/col2/col2-config.js 판을 보고 더 높으면: bundle.json 목록대로 받아(파일 이름 꼴 검사) .js마다 node --check
 *  → 모두 통과하면 번외 크롬을 닫고 묶음 폴더를 바꿔 끼운 뒤(예전 것은 app.old) 이 프로세스를 끝냄 → 운영 인쇄 도우미 지킴이(1분마다)가 새 판으로 다시 켬
 *  · 검사 실패·받기 실패면 옛 판 그대로 돎 · 운영 인쇄 도우미가 켠 묶음(…\col2\app)에서만 함(개발용 직접 실행은 건너뜀) */
const UPD = { raw: String(process.env.RN_COL2_RAW || COL2.CORE_BASE + 'lab/col2/').replace(/\/?$/, '/'), ms: +process.env.RN_COL2_SELFUPD_MS || 30 * 60e3, at: 0, msg: '', busy: false };
const UPD_FILE = /^(col2-config\.js|bundle\.json|helper\/[\w.-]+\.js|shadow\/[\w.-]+\.(js|html))$/;
const vnum = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0);
function getBuf(url) { return new Promise((res, rej) => { (url.startsWith('https:') ? https : http).get(url, { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return rej(new Error('받기 ' + r.statusCode)); } const b = []; r.on('data', (c) => b.push(c)); r.on('end', () => res(Buffer.concat(b))); }).on('error', rej).on('timeout', function () { this.destroy(new Error('시간 넘음')); }); }); }
async function selfUpdate() { if (UPD.busy) return; UPD.busy = true; UPD.at = now();
  try { if (path.basename(ROOT) !== 'app' || !process.env.RN_COL2_HOME || path.resolve(path.dirname(ROOT)) !== path.resolve(HOME)) { UPD.msg = '직접 켠 묶음 — 스스로 새 판 받기는 건너뜀'; return; }
    if (ST.reading) { UPD.msg = '읽는 중 — 다음에'; return; }
    const q = '?t=' + now(); const cfg = String(await getBuf(UPD.raw + 'col2-config.js' + q)); const v = (cfg.match(/COL2_VER:\s*'([\d.]+)'/) || [])[1]; if (!v) throw new Error('새 설정 파일에 판 번호가 없음');
    if (vnum(v) <= vnum(VERSION)) { UPD.msg = `새 판 없음(GitHub ${v})`; return; }
    const man = JSON.parse(String(await getBuf(UPD.raw + 'bundle.json' + q))); const L = (man.files || []).filter((f) => UPD_FILE.test(f)); if (!L.includes('helper/readnow-col2-helper.js')) throw new Error('묶음 목록이 이상함');
    const nd = path.join(HOME, 'app.self'); fs.rmSync(nd, { recursive: true, force: true });
    for (const f of [...new Set([...L, 'bundle.json'])]) { const b = f === 'col2-config.js' ? Buffer.from(cfg) : await getBuf(UPD.raw + f + q); const t = path.join(nd, ...f.split('/')); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, b);
      if (/\.js$/.test(f)) { const ck = require('child_process').spawnSync(process.execPath, ['--check', t], { windowsHide: true }); if (ck.status !== 0) { UPD.msg = `새 판 ${v}의 ${f} 검사 실패 — 옛 판 ${VERSION} 그대로`; note(UPD.msg); return; } } }
    note(`새 판 ${v}을 받아 검사 통과 — 번외 크롬을 닫고 바꿔 끼운 뒤 다시 켜짐(운영 인쇄 도우미 지킴이)`); await closeBrowser('새 판으로 바꿈').catch(() => {}); await Y24.close('새 판으로 바꿈').catch(() => {});
    const old = path.join(HOME, 'app.old'); fs.rmSync(old, { recursive: true, force: true }); fs.renameSync(ROOT, old); try { fs.renameSync(nd, ROOT); } catch (e) { fs.renameSync(old, ROOT); throw e; }
    log(`스스로 새 판으로 바꿈 ${VERSION} → ${v} — 끝내고 다시 켜지기를 기다림`); setTimeout(() => process.exit(0), 300);
  } catch (e) { UPD.msg = '새 판 확인 실패(옛 판 그대로): ' + e.message; } finally { UPD.busy = false; } }

/* (0.1.5 정범님 11/09 밤 '번외 수집기를 로거나 ALPS 도우미처럼 작게 PC마다 사이드에 뜨게 — 위치·크기 저장') 📊 옆 창 — 켜질 때 저절로 작은 앱 창(380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위)
 *  이미 떠 있으면 그대로 · 정범님이 닫으면 다시 켜질 때까지 안 띄움 · 끄기: 옆 창 '저절로 띄우기' 또는 col2.json side:false · 시험에선 켤 때만 */
const sideOn = () => (CFG.side == null ? !TEST : CFG.side !== false);
async function sideOpen(why) { if (!sideOn() || !CFG.on) return null; try { const f = await WIN.run('find', STAT_MARK); if (f.ok && f.n) return null; return await appWin('status', why); } catch (e) { return null; } }
/* 웹앱 관리도구 PC별 한 줄 — 예스24 판매관리 읽기(손님 정보 없음) */
function y24Line() { const y = Y24.sum(); return { on: y.on, logger: y.logger, login: y.login, active: y.active, msg: String(y.msg || '').slice(0, 160), ordAt: y.ord.at, ordErr: y.ord.err, prdAt: y.prd.at, prdN: y.prd.n, day: y.day, q: y.q, sent: y.sent, jobsOk: y.jobsOk }; }
/* 📊 상태 창 — 작은 앱 창(380×560)에 맞게: 글자 작게 · 접는 칸 · 가로 넘침 없음 (ALPS 도우미 화면 모양) */
const SMALL_CSS = `:root{--ink:#26222E;--sub:#6A6478;--line:#DDD8E8;--bg:#F5F4F8;--card:#fff;--pri:#5A4A86;--ok:#1F6F4A;--no:#B0322A;--warn:#8A4A00}
@media (prefers-color-scheme: dark){:root{--ink:#ECE9F2;--sub:#A9A3B8;--line:#3A3546;--bg:#17151C;--card:#221F29;--pri:#A996E0;--ok:#6FCF9C;--no:#F08C82;--warn:#E8B46A}}
*{box-sizing:border-box}html,body{overflow-x:hidden}body{font:12.5px/1.45 system-ui,'Malgun Gothic',sans-serif;margin:0;background:var(--bg);color:var(--ink);min-width:0}
h1{font-size:14px;margin:0;padding:7px 10px;background:#5A4A86;color:#fff;display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}h1 small{font-weight:400;opacity:.85;font-size:11px}
.b{padding:6px 8px}.c{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 8px;margin:0 0 6px;min-width:0;overflow-wrap:anywhere}
details.c>summary{cursor:pointer;list-style:none;font-weight:700}details.c>summary::-webkit-details-marker{display:none}details.c>summary::before{content:'▸ ';color:var(--sub)}details.c[open]>summary::before{content:'▾ '}
.k{color:var(--sub);font-size:11.5px}.ok{color:var(--ok);font-weight:700}.no{color:var(--no);font-weight:700}.wa{color:var(--warn);font-weight:700}
button{font:12px system-ui,'Malgun Gothic';border:1px solid var(--pri);background:var(--card);color:var(--pri);border-radius:6px;padding:3px 7px;margin:2px 3px 2px 0;cursor:pointer;max-width:100%}button.p{background:var(--pri);color:#fff}button.warn{border-color:var(--no);color:var(--no)}button:disabled{opacity:.5;cursor:default}
input{font:12px system-ui;padding:2px 4px;max-width:100%;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:4px}input.n{width:52px}
.ln{font:11px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:160px;overflow:auto;background:var(--bg);border-radius:6px;padding:5px}
.pcn{font-size:12px}.pcn input{width:120px}
h1 .jwb{margin:0 0 0 auto;background:#fff;color:#5A4A86;border:0;font-weight:700;padding:2px 8px}h1 .jwb.on{background:#2F5D50;color:#fff}`;
const pcBarHtml = () => `<div class="c pcn" id="pcbar">🖥 이 PC: <b id="pcn">…</b> <span class="k" id="pcs"></span> <button id="pcb">바꾸기</button><span id="pce" style="display:none"><input id="pci" maxlength="40"> <button class="p" id="pcv">저장</button></span>
<div class="k">🔐 알라딘 로그인: 이 단계에선 안 함(운영 수집기와 동시 로그인·판매자 4대 한도를 막으려고) · 예스24: 판매관리 읽기용 세션만 이 PC 따로 된 크롬에(아이디·비번 저장 안 함)</div></div>`;
/* 이 PC 이름 칸 스크립트(상태 창·비교 화면 같이) — H(머리)·post 함수가 있는 곳에 끼움 */
const PC_JS = `function autoLine(s){const a=s.auto||{},rl=s.relay||{};if(!a.on)return '<span class="wa">자동 읽기 멈춤</span> <span class="k">'+String(a.msg||(s.on?'':'번외 수집 꺼짐')).replace(/[&<>]/g,'')+'</span>';const nx=a.nextMs!=null?Math.ceil(a.nextMs/1000):null;return '<span class="ok">'+(/도는 중/.test(a.msg||'')?'자동으로 도는 중':'자동')+'</span> · 오늘 '+(a.dayN||0)+'/'+(a.dayCap||0)+'장'+(nx!=null?' · 다음 읽기 '+(nx>=120?Math.round(nx/60)+'분':nx+'초')+' 뒤':'')+' · 마지막 기록 '+(rl.ackAt?Math.max(0,Math.round((Date.now()-rl.ackAt)/60000))+'분 전':'아직')+' · 표본 '+(a.left||0)+'/'+(a.poolN||0)+'권 남음'+(a.lap?' · '+a.lap.n+'바퀴 '+(a.lap.read||0)+'권 읽음':'')+(a.msg&&!/도는 중/.test(a.msg)?'<br><span class="k">'+String(a.msg).replace(/[&<>]/g,'')+'</span>':'')}
function pcShow(s){const n=document.getElementById('pcn');if(!n)return;n.textContent=s.pc||'—';document.getElementById('pcs').textContent=s.pcSrc==='pc'?'(여기서 바꾼 이름)':s.pcSrc==='web'?'(웹앱 기기 이름에서)':'(윈도우 이름 · 웹앱을 열면 기기 이름으로 바뀜)'}
document.getElementById('pcb').onclick=()=>{const e=document.getElementById('pce');e.style.display=e.style.display==='none'?'':'none';document.getElementById('pci').value=document.getElementById('pcn').textContent.replace(/^—$/,'')};
document.getElementById('pcv').onclick=async()=>{const v=document.getElementById('pci').value.trim();if(!v)return;const r=await fetch('/cfg',{method:'POST',headers:{'X-RN-Col2':'1','Content-Type':'application/json'},body:JSON.stringify({pc:v,pcSrc:'pc'})});const s=await r.json();pcShow(s);document.getElementById('pce').style.display='none'};`;
/* (0.1.6) 📜 기록창 붙이기 — 옆 창(🗒 단추 · Alt+L)과 따로 창(/log) 같이 · 기기 저장은 Col2Store.ls(rn3-) */
const LOG_BOOT = (full) => `<script src="/s/col2-store.js"></script><script src="/s/col2-logwin.js"></script><script>(function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};
async function api(m,p,b,text){const r=await fetch(p,{method:m,headers:H,cache:'no-store',body:b?JSON.stringify(b):undefined});return text?r.text():r.json()}
window.__jw=Col2Log.mount({api,ls:Col2Store.ls,full:${full ? 'true' : 'false'},btn:document.getElementById('jwBtn')});
${full ? `let last='';setInterval(()=>{const v={p:'log',x:screenX,y:screenY,w:outerWidth,h:outerHeight};const k=JSON.stringify(v);if(k!==last&&v.w>200&&v.h>150){last=k;fetch('/win/hrect',{method:'POST',headers:H,body:k}).catch(()=>{})}},15000);` : ''}})();</script>`;
function logPageHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>📜 번외 수집 기록</title>
<style>${SMALL_CSS}</style><body>${LOG_BOOT(true)}</body></html>`; }
function statusHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>📊 번외 수집 상태</title>
<style>${SMALL_CSS}</style>
<h1>📊 번외 수집 상태 <small>col2 ${VERSION} · 시험 환경(운영과 따로)</small><button id="jwBtn" class="jwb" title="🗒 기록창 열기 (Alt+L)">🗒 기록</button></h1><div class="b">
${pcBarHtml()}
<div class="c" id="st">읽는 중…</div>
<div class="c" id="y24c"><b>🟦 예스24 판매관리 읽기</b> <span class="k">(화면을 열지 않음 · 숨은 크롬)</span><div id="y24">—</div><div id="y24b"></div></div>
<div class="c"><button class="p" id="onb">켜기</button><button data-a="show">🪟 보이기</button><button data-a="hide">🙈 숨기기</button><button data-a="reopen">↻ 다시 열기</button><button data-a="app?p=compare">🔎 비교 화면</button><div id="m" class="k" style="min-height:1.4em"></div></div>
<div class="c"><b>속도</b> <span id="pc" class="k">—</span></div>
<details class="c" open><summary>최근 그림자 읽기</summary><div id="rd" class="ln">—</div></details>
<details class="c"><summary>기록 끝</summary><div id="ln" class="ln">—</div></details>
<details class="c"><summary>자리·크기 <span class="k">(x · y · 폭 · 높이)</span></summary>
<div style="margin-top:4px">🪟 작업 창(보일 때)<br><input class="n" id="wx"> <input class="n" id="wy"> <input class="n" id="ww"> <input class="n" id="wh"> <button data-s="win">저장</button></div>
<div>📊 이 창<br><input class="n" id="hx"> <input class="n" id="hy"> <input class="n" id="hw"> <input class="n" id="hh"> <button data-s="hwin">저장</button></div>
<div class="k">작업 창을 보이게 한 뒤 옮기거나 크기를 바꾸고 🙈 숨기기를 누르면 그 자리·크기가 저장됩니다 · 이 창은 옮기면 저절로 저장</div></details>
<details class="c"><summary>켜기·끄기 <span class="k">(이 PC만)</span></summary><label><input type="checkbox" id="tg_y24"> 🟦 예스24 판매관리 읽기</label><br><label><input type="checkbox" id="tg_y24j"> 🤖 예스24 맡긴 일(주문접수확인·발송처리)도 여기서</label><br><label><input type="checkbox" id="tg_side"> 📊 켜질 때 이 옆 창 저절로 띄우기</label></details>
<div class="k">이 번외 일꾼은 알라딘에 로그인하지 않고(따로 된 크롬 프로필), 운영 수집기·운영 도우미(8898·8899)와 상관없이 돕니다. 예스24는 따로 된 크롬(col2-y24-chrome)에 판매관리 세션만 지니고, 받은 응답은 이 PC 리드나우 수집기가 예전 길로 올립니다. 끄면 번외 크롬만 닫힙니다.</div></div>
<script>(function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};const $=(i)=>document.getElementById(i);const E=(t)=>String(t==null?'':t).replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);let edit=0,S=null,arm=0;
${PC_JS}
const T=(ms)=>new Date(+ms+9*3600e3).toISOString().slice(11,19);
const hm=(ms)=>ms?new Date(+ms+9*3600e3).toISOString().slice(11,16):'—';
function y24Show(s){const y=s.y24||{};let h;if(y.logger)h='<span class="k">로거 PC — 예스24 판매관리 읽기 안 함(약속 0)</span>';else if(!y.on)h='<span class="wa">꺼 둠</span> <span class="k">'+E(s.on?'(아래 켜기·끄기에서 켬)':'(번외 수집이 꺼져 있음)')+'</span>';
else if(y.login==='need')h='<span class="no">🔐 예스24 로그인 필요</span><br><span class="k">아래 단추를 한 번 누르면 예스24 창이 앞으로 나옵니다 — 그 창에서 로그인하면 저절로 숨고 읽기를 이어 갑니다(아이디·비밀번호는 저장하지 않음)'+(y.loginMsg?' · 까닭: '+E(y.loginMsg):'')+'</span>';
else if(y.login==='wait')h='<span class="wa">🔐 예스24 로그인 창이 열려 있음</span> <span class="k">— 그 창에서 로그인하면 저절로 숨김</span>';
else h=(y.active?'<span class="ok">읽는 중</span>':'<span class="wa">쉬는 중</span>')+' · 로그인 '+(y.login==='ok'?'<span class="ok">살아 있음</span>':'확인 중')+'<br><span class="k">주문 두 목록 마지막 '+hm(y.ord&&y.ord.at)+(y.ord&&y.ord.nextMs!=null?' · 다음 '+Math.ceil(y.ord.nextMs/60000)+'분 뒤':'')+' · 등록상품 '+(y.prd&&y.prd.at?hm(y.prd.at)+' 매물 '+y.prd.n:'아직')+' · 오늘 물음 '+((y.day&&y.day.calls)||0)+'번 · 받은 응답 '+((y.day&&y.day.recs)||0)+'개 · 올림 '+(y.sent||0)+(y.q?' · 남음 '+y.q:'')+'</span>'+(y.ord&&y.ord.err?'<br><span class="no">'+E(y.ord.err)+'</span>':'');
if(y.on&&y.msg&&y.login!=='need')h+='<br><span class="k">'+E(y.msg)+'</span>';$('y24').innerHTML=h;
$('y24b').innerHTML=y.logger||!y.on?'':(y.login!=='ok'?'<button class="p" id="y24lg">🔐 예스24 로그인 (처음 한 번)</button>':'<button data-y="ord">🔁 주문 지금</button><button data-y="prd">📋 등록상품 전부</button><button data-y="tour">🛰 둘러보기</button>');
const lg=$('y24lg');if(lg)lg.onclick=async()=>{$('m').textContent='…';const j=await post('/y24/login',{why:'옆 창 단추'});$('m').textContent=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'');load()};
document.querySelectorAll('[data-y]').forEach((b)=>b.onclick=async()=>{const j=await post('/y24/run',{what:b.dataset.y});$('m').textContent=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'');load()});
const cb=(id,v,k)=>{const e=$(id);if(!e)return;e.checked=!!v;e.onchange=async()=>{await post('/cfg',{[k]:e.checked,src:'pc'});load()}};cb('tg_y24',s.y24Want,'y24');cb('tg_y24j',s.y24Jobs,'y24Jobs');cb('tg_side',s.side,'side');}
async function post(p,b){const r=await fetch(p,{method:'POST',headers:H,body:JSON.stringify(b||{})});return r.json()}
async function load(){try{const r=await fetch('/status',{headers:H,cache:'no-store'});const s=await r.json();if(s.ver&&s.ver!=='${VERSION}'&&new URLSearchParams(location.search).get('v')!==s.ver){location.replace(location.pathname+'?v='+encodeURIComponent(s.ver));return}S=s;pcShow(s);const rl=s.relay||{};
$('st').innerHTML='번외 수집 '+(s.on?'<span class="ok">켜짐</span>':'<span class="no">꺼짐</span>')+' · 번외 크롬 '+(s.alive?'<span class="ok">떠 있음</span>':'<span class="no">없음</span>')+(s.alive&&!s.headless?(s.shown?' · <b>보이는 중</b>':' · 숨김'):'')+(s.headless?' · 화면 없음':'')+'<br><span class="k">'+E(s.msg||'')+' · 최근 한 시간 다시 띄움 '+s.opens+'번 · 운영 공용 파일 '+E(Object.entries(s.core.ver||{}).map(([k,v])=>k.replace(/^readnow-|-core\\.js$/g,'')+' '+v).join(' · ')||'아직 안 받음')+'</span><br>'+autoLine(s)+'<br><span class="k">기록: 웹앱이 대신 기록함 · '+(rl.ackAt?'마지막 기록 '+Math.max(0,Math.round((Date.now()-rl.ackAt)/60000))+'분 전':'아직 기록 없음')+(rl.outN?' · 남은 '+rl.outN+'건':'')+(rl.err?' · <span class="no">실패: '+E(rl.err)+'</span>':'')+'</span>';
y24Show(s);
$('onb').textContent=arm?(s.on?'한 번 더 누르면 끔':'한 번 더 누르면 켬'):(s.on?'⏹ 끄기':'▶ 켜기');$('onb').className=s.on?'warn':'p';
const p=s.pace;$('pc').textContent='한 장 뒤 '+Math.round(p.minGapMs/100)/10+'초 안팎 · 이번 시간 '+p.hourN+'/'+p.hourCap+'장 · 오늘 '+p.dayN+'/'+p.dayCap+'장'+(p.coolMs?' · 쉬는 중 '+Math.ceil(p.coolMs/60000)+'분':'');
$('rd').innerHTML=s.reads.length?s.reads.slice().reverse().map((x)=>E(x.at.slice(11))+' '+E(x.itemId)+' '+(x.ok?'✓ '+E(x.title||''):'✗ '+E(x.why||''))).join('\\n'):'—';
$('ln').innerHTML=s.logs.length?s.logs.map((e)=>T(e.t)+' '+E(e.m)).join('\\n'):'—';
if(!edit){const f=(q,v)=>{['x','y','w','h'].forEach((k)=>{$(q+k).value=v&&v[k]!=null?v[k]:''})};f('w',s.win);f('h',s.hwin);}}catch(e){$('st').textContent='도우미에 닿지 못함: '+e.message}}
$('onb').onclick=async()=>{if(!arm){arm=Date.now();load();setTimeout(()=>{if(arm&&Date.now()-arm>=4000){arm=0;load()}},4100);return}arm=0;const j=await post('/cfg',{on:!(S&&S.on),src:'pc'});$('m').textContent=j.on?'✓ 켰습니다':'✓ 껐습니다';load()};
document.querySelectorAll('input.n').forEach((i)=>i.oninput=()=>{edit=Date.now()});
document.querySelectorAll('[data-a]').forEach((b)=>b.onclick=async()=>{$('m').textContent='…';try{const j=await post('/win/'+b.dataset.a,{why:'상태 창'});$('m').textContent=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'')}catch(e){$('m').textContent='✗ '+e.message}load()});
document.querySelectorAll('[data-s]').forEach((b)=>b.onclick=async()=>{const q=b.dataset.s==='win'?'w':'h';const v={};['x','y','w','h'].forEach((k)=>v[k]=+$(q+k).value);try{const j=await post('/win/rect',{[b.dataset.s]:v});$('m').textContent=(j.ok?'✓ 저장 — ':'✗ ')+(j.msg||j.err||'');edit=0}catch(e){$('m').textContent='✗ '+e.message}load()});
let last='';setInterval(()=>{const v={x:screenX,y:screenY,w:outerWidth,h:outerHeight};const k=JSON.stringify(v);if(k!==last&&v.w>200&&v.h>150){last=k;fetch('/win/hrect',{method:'POST',headers:H,body:k}).catch(()=>{})}},15000);
load();setInterval(()=>{if(!edit||Date.now()-edit>60000){edit=0;load()}},4000)})();</script>${LOG_BOOT(false)}</html>`; }

/* ── 듣는 길 ── */
function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); }
const OK_ORG = (o) => o === `http://127.0.0.1:${PORT}` || o === `http://localhost:${PORT}` || o === COL2.WEB_ORIGIN || /^chrome-extension:\/\//i.test(o);
const STATIC = { 'col2-config.js': path.join(ROOT, 'col2-config.js') }; for (const f of ['col2-store.js', 'col2-compare-core.js', 'col2-compare.js']) STATIC[f] = path.join(ROOT, 'shadow', f); STATIC['col2-logwin.js'] = path.join(__dirname, 'col2-logwin.js');
const srv = http.createServer((req, res) => {
  const host = String(req.headers.host || ''); if (!new RegExp(`^(127\\.0\\.0\\.1|localhost):${PORT}$`).test(host)) { res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end('{"ok":false,"err":"이 PC 안에서만"}'); }
  const org = req.headers.origin || ''; const u = new URL(req.url, 'http://127.0.0.1');
  const H = { 'Cache-Control': 'no-store', ...(org && OK_ORG(org) ? { 'Access-Control-Allow-Origin': org, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, X-RN-Col2', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Private-Network': 'true' } : {}) };
  const J = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', ...H }); res.end(JSON.stringify(o)); };
  if (org && !OK_ORG(org)) return J(403, { ok: false, err: '이 PC의 번외 화면·웹앱만' }); /* 알라딘 화면·다른 웹 페이지는 못 부름 */
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/compare' || u.pathname === '/log')) { if (org) return J(403, { ok: false, err: '이 PC 주소창·앱 창에서만' });
    const html = u.pathname === '/' ? statusHtml() : u.pathname === '/log' ? logPageHtml() : fs.readFileSync(path.join(ROOT, 'shadow', 'compare.html'), 'utf8').replace('<!--PCBAR-->', pcBarHtml() + `<script>(function(){${PC_JS}window.__pcShow=pcShow;window.autoLine=autoLine})();</script>`).replace('/*SMALL_CSS*/', SMALL_CSS); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(html); }
  if (req.method === 'GET' && u.pathname.startsWith('/s/')) { const f = STATIC[u.pathname.slice(3)]; if (!f) return J(404, { ok: false }); res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(f)); }
  if (req.headers['x-rn-col2'] !== '1') return J(403, { ok: false, err: 'X-RN-Col2 머리가 없음' });
  if (u.pathname === '/status' && req.method === 'GET') return J(200, status());
  /* (0.1.6) 📜 기록창 — 새 줄(차례 after 뒤) · 날짜 목록 · 그날 줄 · 모두 글로(내려받기) */
  if (u.pathname === '/log/lines' && req.method === 'GET') return J(200, { ok: true, boot: BOOT, lines: JRN.since(u.searchParams.get('after'), u.searchParams.get('n')), kind: JRN.kind(), pc: CFG.pc || os.hostname(), today: new Date(now() + 9 * 3600e3).toISOString().slice(0, 10), rounds: JRN.rounds(6), state: status() });
  if (u.pathname === '/log/days' && req.method === 'GET') return J(200, { ok: true, days: JRN.days() });
  if (u.pathname === '/log/day' && req.method === 'GET') return J(200, { ok: true, lines: JRN.day(u.searchParams.get('d')) });
  if (u.pathname === '/log/all' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', ...H }); return res.end(JRN.allText()); }
  if (u.pathname === '/relay/pending' && req.method === 'GET') return J(200, relayPending(u.searchParams.get('by')));
  if (req.method !== 'POST') return J(405, { ok: false });
  const body = (cb, max) => readBody(req, max || 256 * 1024, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}') || {}; } catch (x) { return J(400, { ok: false, err: 'bad json' }); } Promise.resolve().then(() => cb(o)).catch((er) => J(500, { ok: false, err: er.message })); });
  const act = (fn) => body((o) => fn(o.why || '').then((r) => J(200, { ...r, state: status() })));
  const p = u.pathname;
  if (p === '/cfg') return body((o) => { setCfg(o); J(200, status()); });
  if (p === '/log/clear') return body((o) => { const r = JRN.clear(); note(`📜 기록을 내려받고 화면에서 비움(${r.moved}일치 · 파일은 지우지 않고 journal\\old 로 옮김) — ${String(o.why || '').slice(0, 40)}`, { k: 'sys', l: 'ok', m: '기록' }); J(200, r); });
  if (p === '/win/app') return body((o) => appWin(String(u.searchParams.get('p') || o.p || 'compare'), o.why || '').then((r) => J(200, { ...r, state: status() })));
  if (p === '/relay/get') return body((o) => { const r = relayGet(o); J(r.code, r.body); });
  if (p === '/relay/sample') return body((o) => J(200, relaySample(o)));
  if (p === '/relay/put') return body((o) => { const r = relayPut(o); J(r.code, r.body); });
  if (p === '/relay/answer') return body((o) => { const r = relayAnswer(o); if (AU.pool.length) autoKick(); J(200, r); }, 24 * 1048576); /* 표본 목록(1,000권)이 커서 넉넉히 */
  if (p === '/relay/ack') return body((o) => J(200, relayAck(o)));
  if (p === '/win/show') return act(show); if (p === '/win/hide') return act(hide); if (p === '/win/reopen') return act(reopen); if (p === '/win/status-open') return act(statusWin);
  if (p === '/win/rect') return body((o) => { const out = []; for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (o[k] && !r) return J(400, { ok: false, err: '자리·크기가 이상함(작업 창은 폭 400·높이 300 이상)' }); if (r) { CFG[k] = { ...r, at: now(), src: 'pc' }; out.push(`${k === 'win' ? '작업 창' : '상태 창'} ${r.x},${r.y} · ${r.w}×${r.h}`); } } saveCfg(); note('자리·크기 저장 — ' + out.join(' / ')); J(200, { ok: true, msg: out.join(' / '), state: status() }); });
  if (p === '/win/hrect') return body((o) => { const key = o.p === 'compare' ? 'cwin' : o.p === 'log' ? 'lwin' : 'hwin'; const r = rectOk(o, 260, 200); if (r) { const c = CFG[key] || {}; if (c.x !== r.x || c.y !== r.y || c.w !== r.w || c.h !== r.h) { CFG[key] = { ...r, at: now(), src: 'pc' }; saveCfg(); } } J(200, { ok: true }); }); /* 작은 창이 알린 자기 자리·크기(옮기면 다음에 그 자리) */
  if (p === '/read/product') return body(async (o) => { const r = await readProduct(o); J(r.code, r.body); });
  /* (0.1.5) 🟦 예스24 — 수집기 다리(받기·보냄 확인·맡긴 일·출고 보호·웹앱 설정) · 로그인 한 번 · 지금 읽기 */
  if (p === '/y24/feed') return body((o) => J(200, Y24.feed(o, o.by)), 1048576);
  if (p === '/y24/login') return body(async (o) => { const r = await Y24.login(o.why || '옆 창 단추'); J(200, { ...r, state: status() }); });
  if (p === '/y24/run') return body(async (o) => { const r = await Y24.runNow(String(o.what || 'ord')); J(200, { ...r, state: status() }); });
  /* (0.1.2) 운영 인쇄 도우미가 새 판으로 바꾸거나 끌 때 — 번외 크롬을 먼저 닫고(옛 크롬이 프로필을 쥔 채 남지 않게) 이 프로세스를 끝냄 */
  if (p === '/quit') return body(async (o) => { note('끝내기 부탁 — ' + String(o.by || o.why || '').slice(0, 60)); await closeBrowser('도우미 끝냄').catch(() => {}); await Y24.close('도우미 끝냄').catch(() => {}); J(200, { ok: true, pid: process.pid }); setTimeout(() => process.exit(0), 200); });
  if (TEST && p === '/test/main-eval') return body(async (o) => J(200, { ok: true, v: B && B.alive() ? await B.mainEval(String(o.expr || '')) : null }));
  if (TEST && p === '/test/note') return body(async (o) => { const L = Array.isArray(o.lines) ? o.lines : [o]; const out = L.map((x) => note(String(x.x || ''), { l: x.l, k: x.k, m: x.m, d: x.d })); J(200, { ok: true, n: out.filter(Boolean).length }); }); /* 시험용: 기록 줄 넣기 */
  if (TEST && p === '/test/drop') return body(async () => { if (B && B.cdp) B.cdp.close(); J(200, { ok: true }); }); /* 시험용: 조종 연결만 끊음(크롬은 살아 있음) */
  if (TEST && p === '/test/kill') return body(async () => { if (B && B.proc) B.proc.kill('SIGKILL'); J(200, { ok: true }); });
  if (TEST && p === '/test/tick') return body(async () => { for (let k = 0; k < 100 && ST.busy; k++) await new Promise((r) => setTimeout(r, 50)); await tick('시험', true); J(200, status()); });
  return J(404, { ok: false });
});
srv.on('error', (e) => { log(`✗ 127.0.0.1:${PORT}를 못 엶: ${e.message}`); process.exit(3); });
srv.listen(PORT, '127.0.0.1', () => { log(`번외 수집 도우미 ${VERSION} 시작 — 127.0.0.1:${PORT} · 번외 수집 ${CFG.on ? '켜짐' : '꺼짐'} · 자료 ${HOME}`);
  loadCore().catch((e) => { CORE.err = e.message; log('운영 공용 파일 받기 실패: ' + e.message); });
  ST.timers.push(setInterval(() => tick().catch(() => {}), W('tickSec') * 1000)); setTimeout(() => tick('도우미 시작').catch(() => {}), TEST ? 300 : 5000); AU.t = setTimeout(autoLoop, TEST ? 800 : 15e3); Y24.start(); setTimeout(() => { if (CFG.on) sideOpen('도우미 시작'); }, TEST ? 600 : 4000); ST.timers.push(setInterval(() => selfUpdate().catch(() => {}), UPD.ms)); setTimeout(() => selfUpdate().catch(() => {}), Math.min(UPD.ms, 2 * 60e3)); /* (0.1.2) 켜진 뒤 2분 안에 한 번(30분 기다리지 않음) */ });
const bye = () => { try { if (B) B.kill(); } catch (e) {} try { if (Y24.Y.br) Y24.Y.br.kill(); } catch (e) {} process.exit(0); }; process.on('SIGTERM', bye); process.on('SIGINT', bye);
