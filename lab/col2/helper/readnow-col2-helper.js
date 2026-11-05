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
 *   POST /win/show|hide|reopen|status-open · /win/rect { win|hwin } · /win/hrect {x,y,w,h}
 *   POST /read/product { itemId } → { ok, page, coreVer, ms, waited } (한 번에 하나 · 속도 규칙)
 * 켜는 법: 운영 웹앱에 단추를 넣기 전까지는 README '켜는 법' — 이 파일은 운영 도우미가 불러 쓰지 않음(완전히 따로) */
'use strict';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os');
const COL2 = require('../col2-config.js');
const { makePace } = require('./col2-pace.js'); const { makeWin } = require('./col2-win.js'); const { Browser } = require('./col2-cdp.js');
const VERSION = COL2.COL2_VER;
const TEST = process.env.RN_COL2_TEST === '1';
const PORT = +process.env.RN_COL2_PORT || COL2.PORT;
if (COL2.PROD_PORTS.includes(PORT)) { console.error(`✗ 포트 ${PORT}는 운영 도우미 포트 — 번외 도우미는 켜지 않음`); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const HOME = process.env.RN_COL2_HOME || path.join(os.homedir(), 'ReadNow', 'col2'); fs.mkdirSync(HOME, { recursive: true });
const CFG_F = path.join(HOME, 'col2.json'), LOG_F = path.join(HOME, 'col2.log'), CORE_D = path.join(HOME, 'core');
const WORK_MARK = 'col2-work-chrome', STAT_MARK = 'col2-stat-chrome';
const ALADIN = TEST && process.env.RN_COL2_ALADIN ? process.env.RN_COL2_ALADIN.replace(/\/$/, '') : COL2.ALADIN;
const D = COL2.WATCH;
const now = () => Date.now();
const kst = (ms) => new Date((ms || now()) + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ');
const log = (m) => { const line = `${kst()} 🧪 ${m}\n`; try { fs.appendFileSync(LOG_F, line); } catch (e) {} try { process.stdout.write(line); } catch (e) {} };
const LOGS = []; const note = (m) => { LOGS.push({ t: now(), m }); if (LOGS.length > 30) LOGS.shift(); log(m); };

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
function newBrowser() { return new Browser({ exe: chromeExe(), profile: path.join(HOME, WORK_MARK), headless: !!CFG.headless, rect: { x: -32000, y: 40, w: W('hideW'), h: W('hideH') } }); }
let LAUNCHING = null; /* 띄우는 중에는 같은 약속을 나눠 받음 — 지킴이와 단추가 동시에 두 벌 띄우지 않게 */
function ensureBrowser(why) { if (B && B.alive()) return Promise.resolve(B); if (LAUNCHING) return LAUNCHING; if (opensHour() >= W('opensPerHour')) return Promise.reject(new Error(`한 시간에 ${W('opensPerHour')}번 넘게 다시 띄워 쉼 — 크롬을 확인하세요`));
  const b = newBrowser(); B = b; ST.opens.push(now()); ST.shown = false; note(`번외 작업 창을 띄움 — ${why || ''} (최근 한 시간 ${opensHour()}번째 · ${CFG.headless ? '화면 없음' : '화면 밖 창'})`);
  LAUNCHING = b.launch().then(() => { if (!CFG.headless) placeSoon(); return b; }).finally(() => { LAUNCHING = null; }); return LAUNCHING; }
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
async function statusWin(why) { const hw = rectOk(CFG.hwin, 260, 200); const f = await WIN.run('find', STAT_MARK); if (f.ok && f.n) { const r = await WIN.run('show', STAT_MARK, hw || {}); ST.hwinOpen = true; return r.ok ? { ok: true, msg: '상태 창을 앞으로' } : r; }
  const ch = chromeExe(); if (!ch) return { ok: false, err: '크롬을 못 찾음' };
  const a = [`--user-data-dir=${path.join(HOME, STAT_MARK)}`, `--app=http://127.0.0.1:${PORT}/`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-crash-restore-bubble', `--window-size=${hw ? hw.w : D.hwinW},${hw ? hw.h : D.hwinH}`, ...(hw ? [`--window-position=${hw.x},${hw.y}`] : [])];
  try { const p = require('child_process').spawn(ch, a, { detached: true, stdio: 'ignore' }); p.on('error', () => {}); p.unref(); } catch (e) { return { ok: false, err: e.message }; } ST.hwinOpen = true; note(`상태 창을 엶 (${why || ''})`); return { ok: true, msg: '상태 창을 엶' + (hw ? ` (저장한 자리 ${hw.x},${hw.y} · ${hw.w}×${hw.h})` : '') }; }

function setCfg(o) { const was = !!CFG.on, wasH = !!CFG.headless; const out = { ...CFG };
  if (o.on != null) out.on = o.on === true; if (o.place != null) out.place = o.place === 'edge' ? 'edge' : 'off'; if (o.headless != null) out.headless = o.headless === true; if (o.pc) out.pc = String(o.pc).slice(0, 40);
  for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: o.src || 'web' }; }
  if (o.pace && typeof o.pace === 'object') { const p = { ...(out.pace || {}) }; for (const k of Object.keys(COL2.PACE)) if (k !== 'floorMs' && o.pace[k] != null && Number.isFinite(+o.pace[k])) p[k] = +o.pace[k]; out.pace = p; }
  if (TEST && o.watch && typeof o.watch === 'object') out.watch = { ...(out.watch || {}), ...o.watch };
  const ch = JSON.stringify(out) !== JSON.stringify(CFG); CFG = out; if (ch) saveCfg();
  if (was !== !!CFG.on) { note(CFG.on ? '번외 수집 켬' : '번외 수집 끔 — 작업 창을 닫음'); setTimeout(() => tick('설정 바뀜'), 50); }
  else if (wasH !== !!CFG.headless && B) { closeBrowser('화면 방식 바뀜').then(() => tick('화면 방식 바뀜')); }
  return ch; }

function status() { return { ok: true, ver: VERSION, port: PORT, pid: process.pid, /* (운영 도우미 다리 /col2/stop이 이 프로세스만 멈추게) */ pc: CFG.pc || os.hostname(), on: !!CFG.on, headless: !!CFG.headless, place: CFG.place || 'off', alive: !!(B && B.alive()), open: ST.open, shown: ST.shown, rect: ST.rect, win: CFG.win || null, hwin: CFG.hwin || null, hwinOpen: ST.hwinOpen,
  opens: opensHour(), msg: ST.msg, reading: ST.reading, reads: ST.reads.slice(-10), pace: PACE.state(), core: { ver: CORE.ver, at: CORE.at ? kst(CORE.at) : null, err: CORE.err }, logs: LOGS.slice(-15), aladin: ALADIN === COL2.ALADIN ? 'real' : 'test', at: kst() }; }

/* ── 그림자 읽기 ── */
async function readProduct(o) { const id = String(o.itemId || '').trim(); if (!/^\d{1,13}$/.test(id)) return { code: 400, body: { ok: false, err: '상품 번호(ItemId)가 이상함' } };
  if (!CFG.on) return { code: 409, body: { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' } }; if (ST.reading) return { code: 429, body: { ok: false, err: '다른 책을 읽는 중 — 한 번에 한 권' } };
  ST.reading = { itemId: id, at: now() }; const t0 = now();
  try { const pc = await PACE.take(); if (!pc.ok) return { code: 429, body: { ok: false, err: pc.why, retryMs: pc.retryMs, paced: true } };
    let core; try { core = await loadCore(); } catch (e) { return { code: 503, body: { ok: false, err: e.message } }; }
    let br; try { br = await ensureBrowser('읽기'); await br.land(ALADIN + '/', W('pageTimeoutSec')); } catch (e) { PACE.fail('error'); return { code: 503, body: { ok: false, err: '작업 창 준비 실패: ' + e.message } }; }
    const url = ALADIN + COL2.READ_PATH + id; const r = await br.read(url, core.src, 30) || { ok: false, why: '빈 응답' };
    if (r.ok) PACE.ok(); else if (!r.needLogin) PACE.fail(r.kind || 'error');
    const rec = { at: kst(), itemId: id, ok: !!r.ok, why: r.why || null, ms: now() - t0, title: r.page ? r.page.title : null }; ST.reads.push(rec); if (ST.reads.length > 50) ST.reads.shift();
    note(`그림자 읽기 ${id} — ${r.ok ? '✓ ' + (r.page && r.page.title || '') : '✗ ' + r.why}`);
    return { code: 200, body: { ...r, ok: !!r.ok, itemId: id, url, waited: pc.waited, helperVer: VERSION, core: core.ver, pc: CFG.pc || os.hostname() } };
  } catch (e) { PACE.fail('error'); return { code: 500, body: { ok: false, err: e.message } }; } finally { ST.reading = null; } }

/* ── 화면 ── */
function statusHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>📊 번외 수집 상태</title>
<style>body{font:13px/1.5 system-ui,'Malgun Gothic',sans-serif;margin:0;background:#F5F4F8;color:#26222E}h1{font-size:15px;margin:0;padding:10px 12px;background:#5A4A86;color:#fff}.b{padding:8px 12px}.c{background:#fff;border:1px solid #DDD8E8;border-radius:8px;padding:8px 10px;margin:0 0 8px}.k{color:#6A6478;font-size:12px}.ok{color:#1F6F4A;font-weight:700}.no{color:#B0322A;font-weight:700}button{font:13px system-ui,'Malgun Gothic';border:1px solid #5A4A86;background:#fff;color:#5A4A86;border-radius:6px;padding:4px 9px;margin:2px 3px 2px 0;cursor:pointer}button.p{background:#5A4A86;color:#fff}button.warn{border-color:#B0322A;color:#B0322A}input{width:56px;font:12px system-ui;padding:2px 4px}.ln{font:11.5px/1.45 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:220px;overflow:auto;background:#F4F3F7;border-radius:6px;padding:6px}#m{color:#1F6F4A;min-height:1.4em}a{color:#5A4A86}</style>
<h1>📊 번외 수집 상태 <small style="font-weight:400;opacity:.8">col2 ${VERSION} · 시험 환경(운영과 따로)</small></h1><div class="b">
<div class="c" id="st">읽는 중…</div>
<div class="c"><button class="p" id="onb">켜기</button><button data-a="show">🪟 작업 창 보이기</button><button data-a="hide">🙈 숨기기</button><button data-a="reopen">↻ 다시 열기</button> <a href="/compare" target="_blank">🔎 그림자 비교 화면</a><div id="m"></div></div>
<div class="c"><b>속도</b> <span id="pc" class="k">—</span></div>
<div class="c"><b>최근 그림자 읽기</b><div id="rd" class="ln">—</div></div>
<div class="c"><b>기록 끝</b><div id="ln" class="ln">—</div></div>
<div class="c"><b>자리·크기</b> <span class="k">(가로 x · 세로 y · 폭 w · 높이 h)</span>
<div style="margin-top:4px">🪟 작업 창(보일 때) <input id="wx"> <input id="wy"> <input id="ww"> <input id="wh"> <button data-s="win">저장</button></div>
<div>📊 이 창 <input id="hx"> <input id="hy"> <input id="hw"> <input id="hh"> <button data-s="hwin">저장</button></div>
<div class="k">작업 창을 보이게 한 뒤 옮기거나 크기를 바꾸고 🙈 숨기기를 누르면 그 자리·크기가 저장됩니다 · 이 창은 옮기면 저절로 저장</div></div>
<div class="k">이 번외 일꾼은 알라딘에 로그인하지 않고(따로 된 크롬 프로필), 운영 수집기·운영 도우미(8898·8899)와 상관없이 돕니다. 끄면 번외 크롬만 닫힙니다.</div></div>
<script>(function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};const $=(i)=>document.getElementById(i);const E=(t)=>String(t==null?'':t).replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);let edit=0,S=null,arm=0;
const T=(ms)=>new Date(+ms+9*3600e3).toISOString().slice(11,19);
async function post(p,b){const r=await fetch(p,{method:'POST',headers:H,body:JSON.stringify(b||{})});return r.json()}
async function load(){try{const r=await fetch('/status',{headers:H,cache:'no-store'});const s=await r.json();S=s;
$('st').innerHTML='번외 수집 '+(s.on?'<span class="ok">켜짐</span>':'<span class="no">꺼짐</span>')+' · 번외 크롬 '+(s.alive?'<span class="ok">떠 있음</span>':'<span class="no">없음</span>')+(s.alive&&!s.headless?(s.shown?' · <b>보이는 중</b>':' · 숨김'):'')+(s.headless?' · 화면 없음':'')+'<br><span class="k">'+E(s.msg||'')+' · 최근 한 시간 다시 띄움 '+s.opens+'번 · 운영 공용 파일 '+E(Object.entries(s.core.ver||{}).map(([k,v])=>k.replace(/^readnow-|-core\\.js$/g,'')+' '+v).join(' · ')||'아직 안 받음')+'</span>';
$('onb').textContent=arm?(s.on?'한 번 더 누르면 끔':'한 번 더 누르면 켬'):(s.on?'⏹ 끄기':'▶ 켜기');$('onb').className=s.on?'warn':'p';
const p=s.pace;$('pc').textContent='한 장 뒤 '+Math.round(p.minGapMs/100)/10+'초 안팎 · 이번 시간 '+p.hourN+'/'+p.hourCap+'장 · 오늘 '+p.dayN+'/'+p.dayCap+'장'+(p.coolMs?' · 쉬는 중 '+Math.ceil(p.coolMs/60000)+'분':'');
$('rd').innerHTML=s.reads.length?s.reads.slice().reverse().map((x)=>E(x.at.slice(11))+' '+E(x.itemId)+' '+(x.ok?'✓ '+E(x.title||''):'✗ '+E(x.why||''))).join('\\n'):'—';
$('ln').innerHTML=s.logs.length?s.logs.map((e)=>T(e.t)+' '+E(e.m)).join('\\n'):'—';
if(!edit){const f=(q,v)=>{['x','y','w','h'].forEach((k)=>{$(q+k).value=v&&v[k]!=null?v[k]:''})};f('w',s.win);f('h',s.hwin);}}catch(e){$('st').textContent='도우미에 닿지 못함: '+e.message}}
$('onb').onclick=async()=>{if(!arm){arm=Date.now();load();setTimeout(()=>{if(arm&&Date.now()-arm>=4000){arm=0;load()}},4100);return}arm=0;const j=await post('/cfg',{on:!(S&&S.on),src:'pc'});$('m').textContent=j.on?'✓ 켰습니다':'✓ 껐습니다';load()};
document.querySelectorAll('input').forEach((i)=>i.oninput=()=>{edit=Date.now()});
document.querySelectorAll('[data-a]').forEach((b)=>b.onclick=async()=>{$('m').textContent='…';try{const j=await post('/win/'+b.dataset.a,{why:'상태 창'});$('m').textContent=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'')}catch(e){$('m').textContent='✗ '+e.message}load()});
document.querySelectorAll('[data-s]').forEach((b)=>b.onclick=async()=>{const q=b.dataset.s==='win'?'w':'h';const v={};['x','y','w','h'].forEach((k)=>v[k]=+$(q+k).value);try{const j=await post('/win/rect',{[b.dataset.s]:v});$('m').textContent=(j.ok?'✓ 저장 — ':'✗ ')+(j.msg||j.err||'');edit=0}catch(e){$('m').textContent='✗ '+e.message}load()});
let last='';setInterval(()=>{const v={x:screenX,y:screenY,w:outerWidth,h:outerHeight};const k=JSON.stringify(v);if(k!==last&&v.w>200&&v.h>150){last=k;fetch('/win/hrect',{method:'POST',headers:H,body:k}).catch(()=>{})}},15000);
load();setInterval(()=>{if(!edit||Date.now()-edit>60000){edit=0;load()}},4000)})();</script></html>`; }

/* ── 듣는 길 ── */
function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); }
const OK_ORG = (o) => o === `http://127.0.0.1:${PORT}` || o === `http://localhost:${PORT}` || o === COL2.WEB_ORIGIN || /^chrome-extension:\/\//i.test(o);
const STATIC = { 'col2-config.js': path.join(ROOT, 'col2-config.js') }; for (const f of ['col2-store.js', 'col2-compare-core.js', 'col2-compare.js']) STATIC[f] = path.join(ROOT, 'shadow', f);
const srv = http.createServer((req, res) => {
  const host = String(req.headers.host || ''); if (!new RegExp(`^(127\\.0\\.0\\.1|localhost):${PORT}$`).test(host)) { res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end('{"ok":false,"err":"이 PC 안에서만"}'); }
  const org = req.headers.origin || ''; const u = new URL(req.url, 'http://127.0.0.1');
  const H = { 'Cache-Control': 'no-store', ...(org && OK_ORG(org) ? { 'Access-Control-Allow-Origin': org, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, X-RN-Col2', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Private-Network': 'true' } : {}) };
  const J = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', ...H }); res.end(JSON.stringify(o)); };
  if (org && !OK_ORG(org)) return J(403, { ok: false, err: '이 PC의 번외 화면·웹앱만' }); /* 알라딘 화면·다른 웹 페이지는 못 부름 */
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/compare')) { if (org) return J(403, { ok: false, err: '이 PC 주소창·앱 창에서만' });
    const html = u.pathname === '/' ? statusHtml() : fs.readFileSync(path.join(ROOT, 'shadow', 'compare.html'), 'utf8'); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(html); }
  if (req.method === 'GET' && u.pathname.startsWith('/s/')) { const f = STATIC[u.pathname.slice(3)]; if (!f) return J(404, { ok: false }); res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(f)); }
  if (req.headers['x-rn-col2'] !== '1') return J(403, { ok: false, err: 'X-RN-Col2 머리가 없음' });
  if (u.pathname === '/status' && req.method === 'GET') return J(200, status());
  if (req.method !== 'POST') return J(405, { ok: false });
  const body = (cb) => readBody(req, 256 * 1024, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}') || {}; } catch (x) { return J(400, { ok: false, err: 'bad json' }); } Promise.resolve().then(() => cb(o)).catch((er) => J(500, { ok: false, err: er.message })); });
  const act = (fn) => body((o) => fn(o.why || '').then((r) => J(200, { ...r, state: status() })));
  const p = u.pathname;
  if (p === '/cfg') return body((o) => { setCfg(o); J(200, status()); });
  if (p === '/win/show') return act(show); if (p === '/win/hide') return act(hide); if (p === '/win/reopen') return act(reopen); if (p === '/win/status-open') return act(statusWin);
  if (p === '/win/rect') return body((o) => { const out = []; for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (o[k] && !r) return J(400, { ok: false, err: '자리·크기가 이상함(작업 창은 폭 400·높이 300 이상)' }); if (r) { CFG[k] = { ...r, at: now(), src: 'pc' }; out.push(`${k === 'win' ? '작업 창' : '상태 창'} ${r.x},${r.y} · ${r.w}×${r.h}`); } } saveCfg(); note('자리·크기 저장 — ' + out.join(' / ')); J(200, { ok: true, msg: out.join(' / '), state: status() }); });
  if (p === '/win/hrect') return body((o) => { const r = rectOk(o, 260, 200); if (r) { const c = CFG.hwin || {}; if (c.x !== r.x || c.y !== r.y || c.w !== r.w || c.h !== r.h) { CFG.hwin = { ...r, at: now(), src: 'pc' }; saveCfg(); } } J(200, { ok: true }); });
  if (p === '/read/product') return body(async (o) => { const r = await readProduct(o); J(r.code, r.body); });
  if (TEST && p === '/test/main-eval') return body(async (o) => J(200, { ok: true, v: B && B.alive() ? await B.mainEval(String(o.expr || '')) : null }));
  if (TEST && p === '/test/kill') return body(async () => { if (B && B.proc) B.proc.kill('SIGKILL'); J(200, { ok: true }); });
  if (TEST && p === '/test/tick') return body(async () => { for (let k = 0; k < 100 && ST.busy; k++) await new Promise((r) => setTimeout(r, 50)); await tick('시험', true); J(200, status()); });
  return J(404, { ok: false });
});
srv.on('error', (e) => { log(`✗ 127.0.0.1:${PORT}를 못 엶: ${e.message}`); process.exit(3); });
srv.listen(PORT, '127.0.0.1', () => { log(`번외 수집 도우미 ${VERSION} 시작 — 127.0.0.1:${PORT} · 번외 수집 ${CFG.on ? '켜짐' : '꺼짐'} · 자료 ${HOME}`);
  loadCore().catch((e) => { CORE.err = e.message; log('운영 공용 파일 받기 실패: ' + e.message); });
  ST.timers.push(setInterval(() => tick().catch(() => {}), W('tickSec') * 1000)); setTimeout(() => tick('도우미 시작').catch(() => {}), TEST ? 300 : 5000); });
const bye = () => { try { if (B) B.kill(); } catch (e) {} process.exit(0); }; process.on('SIGTERM', bye); process.on('SIGINT', bye);
