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
 *     POST /y24/feed {cfg,hold,jobs,ack,jack} ← 이 PC 수집기(알라딘 일하는 탭)가 10초마다 → { y24, recs(받은 응답), took, jres, jstep, tour } · POST /y24/login(로그인 한 번) · POST /y24/run {what: ord|prd|tour|ops}
 *   (그림자 쓰기) 🟧✍ POST /al/wfeed {by, w:[{id,k,at,in,rq,ok,http}]} ← 이 PC 수집기가 알라딘에 쓰기를 보낸 직후(번호·값만 · 출고 중·로거는 안 알림) → {ack} · 견줌만, 번외는 알라딘에 쓰기를 보내지 않음(col2-alw.js)
 *   📊 옆 창(작은 앱 창 · 자리·크기 기억)은 켜질 때 저절로 뜸(col2.json side:false 로 끔)
 * 켜는 법: 운영 웹앱에 단추를 넣기 전까지는 README '켜는 법' — 이 파일은 운영 도우미가 불러 쓰지 않음(완전히 따로) */
'use strict';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os');
const COL2 = require('../col2-config.js');
const SETM = require('./col2-settings.js'); /* (11/11 col2ui1) 굳은 값 설정 표 — 이 PC만 / 모든 PC 공통(app_settings/col2_cfg) */
const { makePace, makeSitePace } = require('./col2-pace.js'); const { makeCred } = require('./col2-cred.js'); const { makeRelogin } = require('./col2-relogin.js'); const { makeWin } = require('./col2-win.js'); const { Browser } = require('./col2-cdp.js'); const CMP = require('../shadow/col2-compare-core.js'); const { makeY24 } = require('./col2-y24.js'); const { makeAl } = require('./col2-al.js'); const { makeAlw } = require('./col2-alw.js'); /* (그림자 쓰기) 🟧✍ 운영이 보낸 쓰기와 견줌만 — 보내지 않음 */ const ALC = require('../shadow/col2-al-compare.js'); /* (알라딘 읽기) 🟧 알라딘 샵매니저 읽기 그림자 */ const JR = require('./col2-journal.js'); const UIC = require('./col2-ui.js'); const GO = require('./col2-go.js'); /* (0.1.7) 옆 창 골격·바로 가기 */ const { makeJobs } = require('./col2-jobs.js'); const { lift } = require('./col2-lift.js'); const TK = require('../shadow/col2-tasks.js'); const vm = require('vm'); const { SHIM } = require('./col2-shim.js'); const { makeVoice } = require('./col2-voice.js'); /* (11/10) 🗣 판매자 구매평·문의 글 */ /* (0.1.10) 떼어 온 함수의 받침 */ /* (0.1.9) 로그인 없는 일 그림자 */
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
/* (0.1.10) 🔑 운영 키 — 웹앱이 메모리로만 넘김(POST /relay/keys) · 파일(col2.json·jobs.json·relay-out.json·col2.log)·기록창·상태·col2_*에 값을 남기지 않음 · 로거 PC는 받지 않음 */
const KEYS = { v: null, at: 0, n: 0, by: '' };
const keyVals = () => (KEYS.v ? Object.values(KEYS.v).filter((x) => typeof x === 'string' && x.length >= 4).sort((a, b) => b.length - a.length) : []);
const redact = (t) => { let s0 = String(t == null ? '' : t); for (const k of keyVals()) s0 = s0.split(k).join('«키»'); for (const k of keyVals()) { const e = encodeURIComponent(k); if (e !== k) s0 = s0.split(e).join('«키»'); } return s0; };
const redactV = (v) => (KEYS.v ? JSON.parse(redact(JSON.stringify(v === undefined ? null : v))) : v);
const clean = (m) => { const t = JR.scrub(redact(m)); return isLoggerPc() ? JR.loggerScrub(t) : t; };
const log = (m) => { const line = `${kst()} 🧪 ${clean(m)}\n`; try { fs.appendFileSync(LOG_F, line); } catch (e) {} try { process.stdout.write(line); } catch (e) {} };
const JRN = JR.makeJournal({ home: HOME, isLogger: () => isLoggerPc() }); const note = (m, o) => { const e = JRN.add(redact(m), o); if (e) log(e.x); return e; };

/* ── 설정(col2.json) ── */
function loadCfg() { try { const v = JSON.parse(fs.readFileSync(CFG_F, 'utf8')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
let CFG = loadCfg(); const saveCfg = () => { try { fs.writeFileSync(CFG_F, JSON.stringify(CFG, null, 1)); } catch (e) { log('설정 저장 실패: ' + e.message); } };
const num = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const W = (k) => num((CFG.watch || {})[k], 1, 100000, D[k]);
function paceCfg() { const p = { ...COL2.PACE, ...(CFG.pace || {}) }; const floor = TEST ? 100 : COL2.PACE.floorMs; p.minGapMs = Math.max(floor, num(p.minGapMs, 1, 3600e3, COL2.PACE.minGapMs)); p.jitter = Math.min(0.5, Math.max(0, +p.jitter || 0)); p.hourCap = num(p.hourCap, 1, 2000, COL2.PACE.hourCap); { const lg = isLoggerPc(); p.dayCap = lg ? num((CFG.logger || {}).dayCap, 1, 20000, COL2.LOGGER.dayCap) : num(p.dayCap, 1, 20000, COL2.PACE.dayCap); } /* (11/11 col2rep2) 로거는 테더링 — 따로 작은 몫 · (판 내기 합침) 모든 PC 공통 설정(app_settings/col2_cfg pace.dayCap)이 로거 몫을 덮지 않음 — 로거는 col2.json logger.dayCap(이 PC만)이 있을 때만 그 값 */ p.cool429Min = num(p.cool429Min, 1, 600, COL2.PACE.cool429Min); return p; }
function rectOk(r, minW, minH) { if (!r || typeof r !== 'object') return null; const o = { x: num(r.x, -20000, 20000, NaN), y: num(r.y, -20000, 20000, NaN), w: num(r.w, minW || 200, 8000, NaN), h: num(r.h, minH || 150, 8000, NaN) }; if (![o.x, o.y, o.w, o.h].every(Number.isFinite)) return null; return { ...o, at: +r.at || now() }; }

const PACE = makePace(path.join(HOME, 'pace.json'), paceCfg);
/* (11/11 정범님 '바깥 사이트 읽기 몫') 알라딘 몫(PACE — 사람 속도 두 배는 알라딘 화면 규칙)과 따로 — 바깥 사이트는 사이트마다 운영 외부 정보 출처의 간격(paceMs)·하루 상한(cap)
 *  · 운영 공용 파일 readnow-ext-core.js SOURCES를 그대로 읽음(못 받았으면 아래 기본) · col2.json siteCfg[출처] {gapMs, dayCap}로 바꿈(간격은 0.7초 아래로 못 내림) · 근거: 운영 출처 설정 */
const SITE_DEF = { kpipa: { host: 'bnk.kpipa.or.kr', label: 'KPIPA', paceMs: 3000, cap: 120 }, fx: { host: 'fx', label: '환율', paceMs: 2000, cap: 30 } };
function siteCfg(src) { const X = CORE.ext && CORE.ext.SOURCES ? CORE.ext.SOURCES : {}; const d = X[src] || SITE_DEF[src] || { host: String(src || '?'), label: String(src || '?'), paceMs: 3000, cap: 300 };
  const host = String(d.host || src); let gap = +d.paceMs || 3000; for (const v of Object.values(X)) if (v && v.host === host && +v.paceMs > gap) gap = +v.paceMs; /* 같은 사이트(host)를 쓰는 출처는 가장 긴 간격 */
  const u = ((CFG.siteCfg || {})[src]) || {}; let gapMs = num(u.gapMs, 1, 3600e3, gap); if (!TEST) gapMs = Math.max(COL2.PACE.floorMs, gapMs); else gapMs = Math.min(gapMs, paceCfg().minGapMs);
  return { host, label: String(d.label || src), gapMs, dayCap: num(u.dayCap, 0, 100000, Math.max(1, +d.cap || 300)), jitter: 0.15, cool429Min: paceCfg().cool429Min }; }
const SITE = makeSitePace(path.join(HOME, 'site-pace.json'), siteCfg);
const WIN0 = makeWin({ psFile: path.join(HOME, 'col2-win.ps1'), D }); /* (11/10) 창 다루기 답의 화면 칸을 기억(기록창 띄울 자리 셈 — PowerShell을 다시 부르지 않게) */
const WIN = { run: (a, m, x) => WIN0.run(a, m, x).then((r) => { if (r && r.ok && (r.scr || r.wa)) LW_SCR = r; return r; }) };
function chromeExe() { if (process.env.RN_COL2_CHROME) return process.env.RN_COL2_CHROME; return [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean).map((b) => path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')).find((f) => fs.existsSync(f)) || null; }
/* (0.1.5) 🟦 예스24 판매관리 읽기 — col2-y24.js (이 도우미는 Firestore에 쓰지 않음 · 받은 것은 이 PC 수집기가 예전 길로 올림) */
/* (11/10 정범님 '수집기에 아이디랑 비밀번호를 입력해서 필요할 때 스스로 다시 로그인') 🔐 계정은 이 PC 안 DPAPI 잠근 파일에만(col2-cred.js) · 언제·얼마나는 col2-relogin.js · 로거는 저장·풀기 모두 거절 */
const CRED = makeCred({ HOME, isLogger: () => isLoggerPc() }); setTimeout(() => CRED.hintFill().catch(() => {}), TEST ? 300 : 20e3); /* (11/11) 예전 저장분에 아이디 앞 3자 표시 */
/* (0.1.22 정범님 11/11) 🟩 네이버 커머스API — 로거 PC만(약속 0의 정범님 예외: 네이버 일만) · 시크릿은 이 PC DPAPI 파일에만(col2-nv.js) */
const NV = require('./col2-nv.js').makeNv({ HOME, TEST, base: COL2.NAVER, cfg: () => CFG, note: (m, x) => note(m, x || { k: 'sys', m: '네이버' }), log });
const RLG = makeRelogin({ HOME, cred: CRED, cfg: () => CFG, isLogger: () => isLoggerPc(), note: (m, x) => note(m, { k: 'sys', m: '로그인', ...(x || {}) }) });
const Y24 = makeY24({ relogin: RLG, HOME, Browser, WIN, TEST, note: (m) => note(m, { k: 'y24', m: '예스24' }), log: (m) => log(m), cfg: () => CFG, chromeExe, handoffMs: () => (TEST && CFG.watch && CFG.watch.handoffMs != null ? +CFG.watch.handoffMs : W('handoffSec') * 1000), getText: (u) => getText(u), coreBase: COL2.CORE_BASE, saveRect: (k, r) => { CFG[k] = { ...r, at: now(), src: 'pc' }; saveCfg(); } });
/* (알라딘 읽기 · 정범님 11/09 밤 '로그인 일도 번외로') 🟧 알라딘 샵매니저 '읽기' 그림자 — col2-al.js(기본 꺼짐 · 읽기만 · 운영 칸과 견준 결과는 col2_al에만 · 웹앱이 대신 씀) */
const AL = makeAl({ relogin: RLG, HOME, Browser, WIN, TEST, note: (m, x) => note(m, x || { k: 'al', m: '알라딘' }), log: (m) => log(m), cfg: () => CFG, chromeExe, handoffMs: () => (TEST && CFG.watch && CFG.watch.handoffMs != null ? +CFG.watch.handoffMs : W('handoffSec') * 1000), getText: (u) => getText(u), coreBase: COL2.CORE_BASE, ver: VERSION, webSeen: () => now() - (RL.pullAt || 0) < 3 * 60e3 * (TEST && process.env.RN_COL2_WS_SCALE ? +process.env.RN_COL2_WS_SCALE : 1), webBy: () => RL.pullBy || '', /* (11/11 col2rep1) 자리 안내에 어느 웹앱인지 */ webInfo: () => webInfo(), /* (11/11 seatfix1) 웹앱 주소·판·마지막 소식·막은 주소 */ cqWait: () => !!CQ.al, /* (11/11) 이 PC 웹앱이 대신 읽기를 3분 안에 물었나 — 다리가 없을 때 자리 문서를 웹앱이 확인 */
  saveRect: (k, r) => { CFG[k] = { ...r, at: now(), src: 'pc' }; saveCfg(); }, y24Hold: () => { const f = Y24.Y.feed; return !!(f && f.at && now() - f.at < 5 * 60e3 && f.hold && f.hold.on); },
  prodAsk: (c, id) => alAsk(c, id), prodGot: (c, id) => alGot(c, id), prodDrop: (c, id) => RL.want.delete(c + '/' + id), out: (c, id, v, merge) => outReplace(c, id, v, merge) });

/* (그림자 쓰기 · 정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 비교 뒤') 🟧✍ 운영 수집기가 보낸 쓰기 요청과 같은 입력으로 번외가 만든 요청을 견줌 — 알라딘에 보내는 길 없음 · 결과는 col2_alw에만(웹앱이 대신 씀) */
const ALW = makeAlw({ HOME, note: (m, x) => note(m, x || { k: 'al', m: '알라딘 쓰기' }), cfg: () => CFG, ver: VERSION, out: (c, id, v, merge) => outReplace(c, id, v, merge) });

/* ── 운영 공용 파일(그대로 받아 씀 · 6시간마다 새로) ── */
const CORE = { src: [], ver: {}, at: 0, err: null };
function getText(url) { return new Promise((res, rej) => { https.get(url, { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return rej(new Error('받기 ' + r.statusCode)); } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }).on('error', rej).on('timeout', function () { this.destroy(new Error('시간 넘음')); }); }); }
async function loadCore(force) { if (!force && CORE.src.length && now() - CORE.at < 6 * 3600e3) return CORE; const out = [], ver = {}; fs.mkdirSync(CORE_D, { recursive: true });
  for (const f of COL2.CORE_FILES) { let s = null;
    if (process.env.RN_COL2_CORE_DIR) { s = fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, f), 'utf8'); }
    else { const cf = path.join(CORE_D, f); try { s = await getText(COL2.CORE_BASE + f + '?t=' + now()); if (!/VERSION\s*=\s*'[\d.]+'/.test(s)) throw new Error('판 번호가 없음'); fs.writeFileSync(cf, s); } catch (e) { CORE.err = `${f} 받기 실패(${e.message}) — 받아 둔 것을 씀`; try { s = fs.readFileSync(cf, 'utf8'); } catch (x) { s = null; } } }
    if (!s) throw new Error(`운영 공용 파일 ${f}을 못 받음`); out.push(s); ver[f] = (s.match(/VERSION\s*=\s*'([\d.]+)'/) || [])[1] || '?'; }
  /* (0.1.9) 그림자 일 — 판매자 공용 파일(떨어진 칸) · 운영 본체에서 떼어 온 벤치마킹 해석 함수(떨어진 칸) · 외부 정보 공용 파일(Node) — 못 받아도 상품 그림자는 그대로 */
  const getF = async (f, keep) => { if (process.env.RN_COL2_CORE_DIR) return fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, f), 'utf8'); const cf = path.join(CORE_D, f.replace(/[\\/]/g, '_'));
    try { const t = await getText(COL2.CORE_BASE + f + '?t=' + now()); if (keep && !keep.test(t)) throw new Error('모양이 이상함'); fs.writeFileSync(cf, t); return t; } catch (e) { CORE.moreErr = `${f} 받기 실패(${e.message}) — 받아 둔 것을 씀`; return fs.readFileSync(cf, 'utf8'); } };
  CORE.moreErr = null;
  for (const f of COL2.CORE_MORE || []) { try { const t = await getF(f, /VERSION\s*=\s*'[\d.]+'/); out.push(t); ver[f] = (t.match(/VERSION\s*=\s*'([\d.]+)'/) || [])[1] || '?'; } catch (e) { CORE.moreErr = `${f}을 못 받음`; } }
  try { const L = COL2.LIFT; const lt = lift(await getF(L.file, /@version/), L.fns); if (lt.code) { out.push(lt.code); ver['lift:' + L.file] = lt.ver + '·' + lt.sig; } CORE.lift = { got: lt.got, miss: lt.miss, err: lt.err, ver: lt.ver, sig: lt.sig }; } catch (e) { CORE.lift = { err: e.message }; }
  try { out.push(fs.readFileSync(path.join(__dirname, '..', 'shadow', 'col2-voice-core.js'), 'utf8')); ver['col2-voice-core.js'] = require('../shadow/col2-voice-core.js').VERSION; } catch (e) { CORE.moreErr = '🗣 번외 해석(col2-voice-core.js)을 못 넣음'; } /* (11/10) 번외 해석 — 이 폴더 파일(운영 파일 아님) */
  out.push(SHIM); /* (0.1.10) 떼어 온 함수가 부르는 바깥 이름의 받침(메모리 칸 · 쿠키 없는 읽기 · 그린 화면 답) — 떨어진 칸에만 */
  for (const f of COL2.CORE_NODE || []) { try { const t = await getF(f, /VERSION\s*=\s*'[\d.]+'/); const sb = { module: { exports: {} }, console, URL, URLSearchParams, TextDecoder, TextEncoder, setTimeout, clearTimeout, btoa, atob }; /* (0.1.10) btoa — 운영(브라우저)처럼 eBay 키 묶음 만들 때 */ sb.globalThis = sb; vm.createContext(sb); vm.runInContext(t, sb, { filename: f }); CORE.ext = sb.module.exports && sb.module.exports.run ? sb.module.exports : sb.ReadnowExt || null; ver[f] = CORE.ext ? CORE.ext.VERSION : '?'; } catch (e) { CORE.moreErr = `${f}을 못 넣음(${e.message})`; } }
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
/* (0.1.8 정범님 11/10 새벽 '번외 수집기의 기록창이 해당 수집기 창 안에서만 허용돼 — 창 밖으로 뜨게 해서 조작할 수 있게') 📜 기록창 = 따로 작은 앱 창(기본)
 *  logWin(act) — act: toggle(🗒·Alt+L) · open · close · beat(따로 창이 살아 있다는 소식) · bye(따로 창이 닫힘)
 *   toggle: 없으면 엶 · 작게 내렸거나 화면 밖이면 앞으로 · 화면에 보이면 닫음(닫기 전 자리·크기 기억 — 화면 안일 때만) · open: 없으면 엶·있으면 앞으로
 *   창은 /log 화면 하나(프로필 col2-log-chrome · 380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위 — appWin과 같은 셈 · 약속 15) */
/* (11/10 아침 정범님 '번외 수집기의 기록 단추가 작동하지 않아 — 기록창은 안 뜨고 뭔가 더뎌진 느낌만') 고친 까닭(README '기록 단추 고장'):
 *  ① 누를 때마다 PowerShell 창 찾기(powershell.exe 켜기 · C# 엮기 · 크롬 프로세스 훑기 — 사무실 PC에서 한 번에 몇 초~수십 초)를 두 번 차례로 기다린 뒤에야 크롬을 띄움
 *     → 그동안 단추가 잠기고(누르면 무시) 화면에 아무 말이 없음 · 1분 지킴이·예스24 PowerShell과 겹쳐 CPU가 튐(더뎌짐)
 *  ② 창 찾기가 보이지 않는 크롬 창(제목만 있는 숨은 창)을 먼저 집으면 '보이는 창'으로 보고 그 창을 닫거나 앞으로 → 아무것도 안 뜸
 *  ③ 같은 프로필을 쥔 채 굳은 크롬이 남아 있으면 새로 띄운 크롬이 그쪽에 넘기고 곧바로 끝남 → 창이 안 뜸(다시 해 볼 길이 없었음)
 * 이제: 창의 살아 있음·보임·자리는 /log 화면이 3초마다 직접 알림(beat: id · vis · 자리) — 누르면 PowerShell을 기다리지 않고 곧바로 정함
 *  창이 없으면 → 크롬을 바로 띄움 · 작게 내렸거나(화면 숨김)·화면 밖이면 → 앞으로 · 보이면 → 닫음 (PowerShell은 뒤에서 · 답은 늘 곧바로)
 *  띄운 뒤 lwRetryMs(6초) 안에 소식이 없으면 같은 프로필의 굳은 크롬을 끝내고 한 번 더 띄움 · 옆 창은 2초 안에 소식이 없으면 안쪽 칸으로 바꿔 보임 */
const LW = { pages: {}, dead: {}, at: 0, spawnAt: 0, spawnN: 0, retried: false, step: '', err: '', exit: null, seenAt: 0 };
const LW_STALE = 75e3; /* 작게 내린 창은 크롬이 타이머를 1분에 한 번까지 늦춤 — 그보다 조금 길게 */
const lwRetryMs = () => (TEST && CFG.watch && +CFG.watch.lwRetryMs > 0 ? +CFG.watch.lwRetryMs : 6000);
var LW_SCR = null; /* 마지막으로 안 화면 칸(창 다루기 답에서) — 띄울 자리 셈에만 */
const lwLive = () => { const t = now(); return Object.entries(LW.pages).filter(([id, p]) => !LW.dead[id] && t - p.beat < LW_STALE).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.beat - a.beat); };
const lwinOpen = () => lwLive().length > 0 || !!(LW.spawnAt && now() - LW.spawnAt < 8000 && !LW.err);
const onScr = (r, f) => { const scr = (f && f.ok && (Array.isArray(f.scr) && f.scr.length ? f.scr : f.wa ? [f.wa] : [])) || []; if (!r || !scr.length) return !(r && r.x <= -10000); return scr.some((b) => r.x + r.w > b.x + 40 && r.x < b.x + b.w - 40 && r.y > b.y - 20 && r.y < b.y + b.h - 40); };
const lwGone = () => { const t = now(); for (const id of Object.keys(LW.pages)) LW.dead[id] = t; LW.spawnAt = 0; LW.at = t; };
const lwBg = (name, fn) => { LW.step = name; return Promise.resolve().then(fn).then(() => { if (LW.step === name) LW.step = ''; }, (e) => { LW.err = `${name} 실패: ${e.message}`; LW.step = ''; note(`📜 따로 기록창 ${name} 실패 — ${e.message}`, { k: 'win', m: '창', l: 'warn' }); }); };
const appArgs = (A, rc) => [`--user-data-dir=${path.join(HOME, A.mark)}`, `--app=http://127.0.0.1:${PORT}${A.path}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-crash-restore-bubble', `--window-size=${rc.w},${rc.h}`, ...(rc.x != null ? [`--window-position=${rc.x},${rc.y}`] : [])];
function lwSpawn(why) { const rc = appRect(rectOk(CFG.lwin, 260, 200), LW_SCR); const ch = chromeExe();
  if (!ch) { LW.err = '크롬을 못 찾음(Chrome이 설치된 곳을 모름)'; note('📜 ' + LW.err, { k: 'win', m: '창', l: 'warn' }); return { ok: false, err: LW.err }; }
  LW.err = ''; LW.exit = null; const at = LW.spawnAt = now(); LW.spawnN++;
  try { const p = require('child_process').spawn(ch, appArgs(APPS.log, rc), { detached: true, stdio: 'ignore' });
    p.on('error', (e) => { if (LW.spawnAt === at) LW.err = '크롬을 못 띄움: ' + e.message; });
    p.on('exit', (code, sig) => { LW.exit = { code, sig, ms: now() - at }; if (code && LW.spawnAt === at && LW.seenAt < at) LW.err = `크롬이 ${Math.round((now() - at) / 100) / 10}초 만에 끝남(끝 코드 ${code})`; }); p.unref(); }
  catch (e) { LW.err = '크롬을 못 띄움: ' + e.message; return { ok: false, err: LW.err }; }
  note(`📜 기록창을 따로 작은 창으로 띄움 (${why || ''} · ${rc.w}×${rc.h}${rc.x != null ? ` · ${rc.x},${rc.y}` : ''})`, { k: 'win', m: '창' });
  setTimeout(() => { if (LW.spawnAt !== at || LW.seenAt >= at) return;
    if (!LW.retried) { LW.retried = true; note(`📜 따로 기록창이 ${lwRetryMs() / 1000}초 안에 안 떠서 같은 프로필의 굳은 크롬을 끝내고 한 번 더 띄움${LW.err ? ' — ' + LW.err : ''}`, { k: 'win', m: '창', l: 'warn' });
      lwBg('다시 띄우기', async () => { await WIN.run('kill', LOG_MARK); if (LW.spawnAt === at && LW.seenAt < at) lwSpawn('굳은 크롬을 끝내고 다시'); }); return; }
    LW.err = LW.err || `두 번 띄워도 ${lwRetryMs() / 1000}초 안에 소식이 없음`; note('📜 따로 기록창이 안 뜸 — ' + LW.err + ' · 옆 창 안 기록 칸을 쓰세요(⚙ › 창에서 고를 수 있음)', { k: 'win', m: '창', l: 'warn' }); }, lwRetryMs());
  return { ok: true, rect: rc }; }
const lwState = () => { const L = lwLive(); const p = L[0] || null; return { ok: true, open: lwinOpen(), live: L.length, first: p ? p.first : 0, vis: p ? p.vis : null, seenAt: LW.seenAt, spawnAt: LW.spawnAt, spawnN: LW.spawnN, retried: LW.retried, step: LW.step, err: LW.err, exit: LW.exit, rect: CFG.lwin || null }; };
/* logWin(act) — act: toggle(🗒·Alt+L) · open · close · beat(/log 화면이 3초마다 · id·vis·자리) · bye(그 화면이 닫힘) · state(옆 창이 뜸을 확인) */
async function logWin(act, why, o) { act = String(act || 'toggle'); o = o || {}; const t = now();
  if (act === 'beat') { const id = String(o.id || 'x').replace(/[^\w-]/g, '').slice(0, 40) || 'x'; if (LW.dead[id]) return { ok: true, open: false, gone: true };
    const pg = LW.pages[id] || (LW.pages[id] = { first: t }); pg.beat = t; pg.vis = o.vis === 'hidden' ? 'hidden' : o.vis === 'visible' ? 'visible' : null;
    const nb = ['x', 'y', 'w', 'h'].map((k) => +o[k]); pg.r = nb.every(Number.isFinite) && nb[2] > 0 ? { x: nb[0], y: nb[1], w: nb[2], h: nb[3] } : null;
    if (LW.seenAt < (LW.spawnAt || 0) && t >= LW.spawnAt) note(`📜 따로 기록창이 떴음 (띄운 뒤 ${Math.round((t - LW.spawnAt) / 100) / 10}초)`, { k: 'win', m: '창' });
    LW.seenAt = t; LW.retried = false; LW.err = ''; for (const [k, v] of Object.entries(LW.pages)) if (t - v.beat > 600e3) delete LW.pages[k]; for (const [k, v] of Object.entries(LW.dead)) if (t - v > 3600e3) delete LW.dead[k];
    return { ok: true, open: true }; }
  if (act === 'bye') { const id = String(o.id || '').replace(/[^\w-]/g, '').slice(0, 40); if (id) LW.dead[id] = t; else lwGone(); LW.at = t; return { ok: true, open: lwinOpen() }; }
  if (act === 'state') return lwState();
  const pg = lwLive()[0];
  if (pg) { const seen = pg.vis !== 'hidden' && t - pg.beat < 10e3 && onScr(pg.r, LW_SCR);
    if (act === 'close' || (act === 'toggle' && seen)) { if (seen) { const r = rectOk(pg.r, 260, 200); if (r) { CFG.lwin = { ...r, at: now(), src: 'pc' }; saveCfg(); } }
      lwGone(); lwBg('닫기', async () => { const r = await WIN.run('close', LOG_MARK); if (!r.ok) throw new Error(r.err); }); note(`📜 기록창(따로 창)을 닫음 (${why || act})`, { k: 'win', m: '창' });
      return { ok: true, open: false, closed: true, msg: '📜 따로 기록창을 닫음' }; }
    lwBg('앞으로', async () => { const rc = appRect(rectOk(CFG.lwin, 260, 200), LW_SCR); const f = await WIN.run('show', LOG_MARK, rc.x != null ? rc : {}); if (!f.ok) throw new Error(f.err); if (!f.n) { lwGone(); lwSpawn('앞으로 꺼낼 창이 없어 새로'); } });
    note(`📜 기록창(따로 창)을 앞으로 (${pg.vis === 'hidden' ? '작게 내려 있었음' : '화면 밖이었음'})`, { k: 'win', m: '창' }); return { ok: true, open: true, front: true, msg: '📜 따로 기록창을 앞으로 꺼냄' }; }
  if (act === 'close') { lwGone(); return { ok: true, open: false, msg: '기록창이 이미 닫혀 있음' }; }
  if (LW.spawnAt && t - LW.spawnAt < lwRetryMs() + 2000 && !LW.err) return { ok: true, open: true, pending: true, at: LW.spawnAt, msg: '📜 따로 기록창을 띄우는 중 — 조금만 기다려 주세요' };
  LW.retried = false; const r = lwSpawn(why || '🗒 기록'); return r.ok ? { ok: true, open: true, spawned: true, pending: true, at: LW.spawnAt, msg: '📜 따로 기록창을 띄우는 중' } : { ...r, open: false }; }

/* ── 웹앱 대신 기록 (0.1.1 정범님 11/05 밤 '비교 화면 구글로 로그인이 실패') ──
 * 비교 화면(이 도우미가 내주는 127.0.0.1 화면)은 Firebase에 로그인하지 않음. 그 PC에 열려 있는 운영 웹앱(이미 구글 로그인)이
 *  · 비교 화면이 부탁한 운영 문서(prd_ids·prd_books — 읽기만 · 그 밖 칸은 거절)를 읽어 넘기고
 *  · 비교 화면이 맡긴 결과(col2_* 칸만)를 대신 씀 → 다 쓰면 지움(ack) · 못 쓴 것은 남겨 두고 다음에 다시(까닭 코드를 화면에 보임)
 * 맡긴 결과는 파일(relay-out.json)에 남겨 도우미가 다시 켜져도 잃지 않음 */
const RC = { ...{ READ_OK: ['prd_ids', 'prd_books'], idleSec: 30, hotSec: 2, gotMin: 10, outMax: 5000, poolN: 1000, poolLow: 50 }, ...(COL2.RELAY || {}) };
const RELAY_F = path.join(HOME, 'relay-out.json');
const RL = { want: new Map(), got: new Map(), sampleN: 0, sample: null, out: (() => { try { const v = JSON.parse(fs.readFileSync(RELAY_F, 'utf8')); return Array.isArray(v) ? v : []; } catch (e) { return []; } })(), pullAt: 0, pullBy: '', pullOrg: '', pullVer: '', ackAt: 0, ackN: 0, err: null, errAt: 0, pageAt: 0 };
const saveOut = () => { try { fs.writeFileSync(RELAY_F, JSON.stringify(RL.out)); } catch (e) { log('맡긴 결과 저장 실패: ' + e.message); } };
const RID = /^[\w.-]{1,150}$/;
/* (11/11 col2rep2 · 약속 38·48) 🔀 넘김 — 웹앱 ⚙ › 🔀 번외로 넘기기에서 이 PC로 넘긴 일만 운영 칸에 씀(shadow/col2-handoff.js 표 안만 · 웹앱이 다시 검사) · 상태는 메모리에만(웹앱이 1분마다 다시 넘김 · 10분 소식 없으면 넘김 없음으로) */
const HOF = require('../shadow/col2-handoff.js'); const HO = { doc: null, at: 0, beat: {} };
function hoTake(d) { HO.doc = { jobs: d.jobs && typeof d.jobs === 'object' ? d.jobs : {} }; HO.at = now(); }
const hoMine = (k) => !!HO.doc && now() - HO.at < 10 * 60e3 && HOF.mine(HO.doc, k, CFG.pc || os.hostname());
/* 넘긴 일의 운영 칸 쓰기 — RL.out에 op 표시로(웹앱이 col2_* 칸과 달리 넘김 표·이 PC·칸·문서 이름을 다시 확인한 뒤 씀) */
function opOut(job, c, id, v, x) { if (!hoMine(job)) return false; x = x || {}; const it = { k: 'p' + now().toString(36) + Math.random().toString(36).slice(2, 8), c, id, v: redactV(v), merge: true, op: true, job, hist: x.hist || null, at: now() }; const i = RL.out.findIndex((y) => y.op && y.c === c && y.id === id); if (i >= 0) RL.out[i] = it; else RL.out.push(it); HO.beat[job] = now(); saveOut(); return true; }
/* (11/11 col2rep2) 🛰 로거 책 차례 — 로거 운영 수집기가 방금 시장 지표를 읽은 책(도서 번호·알라딘 상품 번호만)을 다리로 넘김 → 시장 지표·중고 첫 쪽·구매자 분포 그림자 차례
 *  로거는 웹앱이 우리 도서 목록(표본)을 넘기지 않음(약속 0) — 그 대신 운영 로거가 이미 그 시각에 읽은 책만 같은 PC 안에서 받음(새로 로거에 가는 정보 없음 · 제목·ISBN·매물 없음) */
function lgBooks(o) { if (!isLoggerPc()) return { code: 403, body: { ok: false, err: '로거 PC만' } }; const L = (Array.isArray(o && o.books) ? o.books : []).slice(0, 300).filter((b) => b && RID.test(String(b.bookId || '')) && /^\d{1,13}$/.test(String(b.itemId || ''))).map((b) => ({ itemId: String(b.itemId), bookId: String(b.bookId), prod: {} }));
  const n = L.length ? JOBS.feedBooks(L) : 0; RL.lgAt = now(); RL.lgN = (RL.lgN || 0) + n; if (n) note(`🛰 로거 운영 수집기가 방금 읽은 책 ${L.length}권 → 그림자 차례 ${n}건(시장 지표·중고 첫 쪽·구매자 분포)`, { k: 'read', m: '그림자 일' }); return { code: 200, body: { ok: true, n } }; }
const PROD_FIELDS = ['aladinItemId', 'title', 'seenInfo', 'infoFrom', 'bookId', 'lastFetchedAt', ...COL2.BOOK_FIXED]; /* (11/11 col2rep1) lastFetchedAt = 운영이 마지막으로 읽은 때 — 오래된 문서의 고정형 칸 다름을 '오래됨'으로 나눔 */ /* 웹앱이 넘길 운영 문서 칸(견줄 것만 · 작게) */
/* (11/11 seatfix1 · 정범님 16:48 HOME — 웹앱이 jerrycson.github.io로 열려 있는데 옆 창은 「웹앱도 안 보임」) 🌐 이 PC 웹앱 소식 — 어느 주소(출처)·판·로그인 여부·마지막 시각 · 막은 주소
 *  at = 우리 두 주소(COL2.WEB_ORIGINS) 중 하나에서 온 마지막 부름(무엇이든) · pull = 대신 읽기 묻기(/relay/pending) · hello = 구글 로그인 전 웹앱의 알림 · rej = 우리 주소가 아니라 거절한 부름(주소·시각·횟수)
 *  값(계정·문서)은 없음 — 주소·판·시각뿐 */
const WEB = { at: 0, org: '', path: '', helloAt: 0, helloOrg: '', helloVer: '', rej: null, rejNoteAt: 0, boot: now() };
const webHost = (o) => String(o || '').replace(/^https?:\/\//, '').slice(0, 60);
function webInfo() { return { boot: WEB.boot, at: WEB.at || 0, org: webHost(WEB.org), path: WEB.path, pullAt: RL.pullAt || 0, pullOrg: webHost(RL.pullOrg), pullVer: RL.pullVer || '', helloAt: WEB.helloAt || 0, helloOrg: webHost(WEB.helloOrg), helloVer: WEB.helloVer || '', rej: WEB.rej ? { org: String(WEB.rej.org).slice(0, 80) /* 막은 주소는 http/https까지 그대로(헷갈리지 않게) */, at: WEB.rej.at, n: WEB.rej.n, path: WEB.rej.path } : null }; }
function relaySum() { return { colAt: RL.colAt || null, colBy: RL.colBy || null, lgAt: RL.lgAt || null, lgN: RL.lgN || 0, /* (11/11 col2rep2) 로거 운영 수집기 다리 */ web: webInfo(), outN: RL.out.length, wantN: RL.want.size + (RL.sampleN ? 1 : 0), pullAt: RL.pullAt || null, pullBy: RL.pullBy || null, ackAt: RL.ackAt || null, ackN: RL.ackN, err: RL.err, errAt: RL.errAt || null, hot: now() - RL.pageAt < 120e3 }; }
/* (알라딘 읽기) 🟧 알라딘 그림자가 견줄 운영 칸(읽기만 · 손님 정보는 받는 순간 버림 — ALC.trimProd) — 웹앱 C2R.ok에 이 칸이 들어가기 전까지는 '운영 문서 기다림'으로 남고 결과는 wait */
function alAsk(c, id) { if (!ALC.PROD_ID[c] || !ALC.PROD_ID[c].test(id)) return; const k = c + '/' + id; const g = RL.got.get(k); if (g && now() - g.at < RC.gotMin * 60e3) return; if (!RL.want.has(k)) RL.want.set(k, { c, id, at: now(), al: true }); }
function alGot(c, id) { const g = RL.got.get(c + '/' + id); return g && now() - g.at < RC.gotMin * 60e3 * 3 ? g.v : undefined; }
function relayGet(o) { const c = String(o.c || ''), id = String(o.id || ''); if (!RC.READ_OK.includes(c) || !RID.test(id)) return { code: 400, body: { ok: false, err: `웹앱이 대신 읽을 수 있는 칸은 ${RC.READ_OK.join('·')} 뿐` } };
  if (RC.READ_ID && RC.READ_ID[c] && !RC.READ_ID[c].includes(id)) return { code: 400, body: { ok: false, err: `${c} 칸은 ${RC.READ_ID[c].join('·')} 문서만 대신 읽음` } }; /* (0.1.9) app_settings는 bench만 */
  if (RC.READ_RE && RC.READ_RE[c] && !new RegExp(RC.READ_RE[c]).test(id)) return { code: 400, body: { ok: false, err: `${c} 칸 문서 이름 꼴이 아님` } }; /* (0.1.10) mkt_kpipa는 날짜(8자리) 문서만 */
  RL.pageAt = now(); const k = c + '/' + id; const g = RL.got.get(k); if (g && now() - g.at < RC.gotMin * 60e3) return { code: 200, body: { ok: true, have: true, v: g.v } };
  if (!RL.want.has(k)) RL.want.set(k, { c, id, at: now() }); return { code: 200, body: { ok: true, have: false, relay: relaySum() } }; }
function relaySample(o) { const n = num(o.n, 1, 60, 15); RL.pageAt = now(); if (o.ask) { RL.sample = null; RL.sampleN = n; return { ok: true, have: false, relay: relaySum() }; }
  if (RL.sample) return { ok: true, have: true, list: RL.sample.list }; if (!RL.sampleN) RL.sampleN = n; return { ok: true, have: false, relay: relaySum() }; }
function relayPut(o) { const c = String(o.c || ''); if (!c.startsWith(COL2.PREFIX) || c.includes('/')) return { code: 400, body: { ok: false, err: `대신 쓰기는 ${COL2.PREFIX}* 칸만` } };
  const id = o.id == null ? null : String(o.id); if (id != null && !RID.test(id)) return { code: 400, body: { ok: false, err: '문서 이름이 이상함' } };
  if (RL.out.length >= RC.outMax) return { code: 507, body: { ok: false, err: `맡긴 결과가 ${RC.outMax}건 넘게 쌓임 — 웹앱이 열려 있는지 확인하세요` } };
  RL.pageAt = now(); const k = 'o' + now().toString(36) + Math.random().toString(36).slice(2, 8); RL.out.push({ k, c, id, v: o.v == null ? {} : o.v, merge: !!o.merge, at: now() }); saveOut(); return { code: 200, body: { ok: true, k, relay: relaySum() } }; }
/* (11/11) 🪑 운영 알라딘 로그인 규칙(__rnLoginRule) — 운영 본체 src/readnow-collector.src.js 글자를 그대로 떼어 Node 칸에서 돌림(복사본 없음 · 6시간마다 새로) */
const LR = { R: null, at: 0, ver: null, err: null };
async function loginRule() { if (LR.R && now() - LR.at < 6 * 3600e3) return LR.R; const f = COL2.LIFT.file; let t = null;
  if (process.env.RN_COL2_CORE_DIR) t = fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, f), 'utf8');
  else { const cf = path.join(CORE_D, f.replace(/[\\/]/g, '_')); try { t = await getText(COL2.CORE_BASE + f + '?t=' + now()); if (!/@version/.test(t)) throw new Error('모양이 이상함'); fs.mkdirSync(CORE_D, { recursive: true }); fs.writeFileSync(cf, t); } catch (e) { LR.err = '운영 본체 받기 실패(' + e.message + ') — 받아 둔 것을 씀'; t = fs.readFileSync(cf, 'utf8'); } }
  const a = t.indexOf('globalThis.__rnLoginRule = (function'); const b = a < 0 ? -1 : t.indexOf('\n})();', a); if (a < 0 || b < 0) throw new Error('운영 본체에서 로그인 규칙을 못 찾음');
  const sb = { Math, Date, JSON, Number, String, Object, Array, Set, Map, RegExp, isFinite, parseInt, parseFloat }; sb.globalThis = sb; vm.createContext(sb); vm.runInContext(t.slice(a, b + 6), sb, { filename: 'rnLoginRule', timeout: 2000 });
  const R0 = sb.__rnLoginRule; if (!R0 || !R0.seatAsk || !R0.seatKeep || !R0.seatView) throw new Error('로그인 규칙 모양이 다름'); LR.R = R0; LR.at = now(); LR.ver = (t.match(/@version\s+([\d.]+)/) || [])[1] || '?'; return R0; }
/* 운영 수집기 다리 seatTx와 같은 판단(받기·지키기·양보·놓기 · 우선순위: 🏠 이어받기면 보통 PC 1 · 아니면 그림자 -1) — 돌려줌 { patch(없으면 null), out } */
function seatDecide(R0, d, who, want, own, t) { const PRI = own ? R0.PRI.pc : -1; const me = (d.dev || {})[who], w0 = (d.wait || {})[who]; const V = R0.seatView(d, t);
  const hm = (ms) => { const k = new Date(+ms + 9 * 3600e3); return String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0'); }; /* (11/11 col2rep1) 마지막 신호 시각 — 그 기기가 30분 신호가 끊기면 자리가 풀림 */
  const held = V.live.map((x) => x.who + '(' + (x.al ? '🔒 상시 · ' : '') + hm(x.at) + ' 신호)').concat(V.phones ? [`휴대폰 ${V.phones}대`] : []);
  const drop = (how, why, until) => ({ patch: (me && me.in) || w0 ? { dev: { [who]: { in: false, at: t, how, pri: PRI, yield: false } }, wait: { [who]: null } } : null, out: { ok: false, why, until: until || 0, off: !!d.col2Off, n: V.used, max: V.max, held, had: false } });
  if (!want) return drop('번외 쉼', '번외가 알라딘 읽기를 하지 않음');
  if (d.col2Off) return drop('번외 끔', '계정 문서에서 번외 자리를 꺼 둠(col2Off)', t + 10 * 60e3);
  if (+d.holdUntil > t) return drop('계정 쉼', `정범님이 켠 계정 새 로그인 쉼(${d.holdWhy || ''}) — 번외에 자리를 주지 않음`, Math.min(+d.holdUntil, t + 10 * 60e3)); /* (🔬 정밀 점검 11/11 🔗 수 묶음 가-8) 사람이 켠 계정 쉼(aladin_login.holdUntil)을 번외 자리 셈도 따름 — 웹앱·수집기 다리가 먼저 막고, 문서가 그대로 와도 여기서 한 번 더 */
  const mine = V.live.some((x) => x.who === who); const others = V.wait.filter((x) => x.who !== who);
  if (mine && others.length && !own) return { patch: { dev: { [who]: { in: false, at: t, how: '번외 양보', pri: PRI, yield: true } } }, out: { ok: false, why: `${others[0].who}가 자리를 기다려 번외가 넘김(그림자는 자리 차례 맨 뒤)`, until: t + R0.between(V.cfg.retrySec, Math.random()), n: V.used - 1, max: V.max, held, had: true } };
  const r = mine ? R0.seatKeep(d, who, t, { pri: PRI, use: t }, Math.random()) : R0.seatAsk(d, who, t, { pri: PRI }, Math.random());
  return { patch: (r && r.patch) || null, out: { ok: !!(r && r.ok), why: r && r.ok ? `자리 받음(${r.n}/${r.max}대 · 웹앱이 자리 문서로 확인)` : String((r && r.why) || '자리 기다림').slice(0, 300), until: (r && r.until) || 0, gap: R0.between(V.cfg.beatSec, Math.random()), n: r && r.n != null ? r.n : V.used, max: V.max, held, had: true } }; }
function relayPending(by, org, ver) { const colB = /^수집기/.test(String(by || '')); /* (11/11 col2rep2) 로거 운영 수집기 다리(rnC2lg)가 대신 당김 — 웹앱 당김 시각(webSeen·자리)과 섞지 않음 */ if (colB) { RL.colAt = now(); RL.colBy = String(by || '').slice(0, 80); } else { RL.pullAt = now(); RL.pullBy = String(by || '').slice(0, 80); RL.pullOrg = String(org || '').slice(0, 80); RL.pullVer = /^[\d.]{1,20}$/.test(String(ver || '')) ? String(ver) : ''; } /* (판 내기 합침) 웹앱 주소·판은 웹앱이 당길 때만 */
  const poolAsk = AU.poolAskAt && now() - AU.poolAskAt < 10 * 60e3 ? 0 : poolNeed(); if (poolAsk) AU.poolAskAt = now();
  return { ok: true, pool: poolAsk, poolAfter: AU.lap.after || null, poolLap: AU.lap.n, want: [...RL.want.values()].sort((a, b) => (a.al ? 1 : 0) - (b.al ? 1 : 0)).slice(0, 40).map(({ c, id }) => ({ c, id })) /* (알라딘 읽기) 예전 칸(prd_ids·prd_books) 부탁이 먼저 — 알라딘 그림자 부탁이 자동 그림자 읽기를 굶기지 않게 */, sample: RL.sample ? 0 : RL.sampleN, fields: PROD_FIELDS, out: RL.out.slice(0, 25), hot: now() - RL.pageAt < 120e3 || AL.seatHot() || !!CQ.al, idleSec: RC.idleSec, hotSec: RC.hotSec, pc: CFG.pc || null, pcSrc: CFG.pcSrc || null, ver: VERSION, setPend: SET.pend(), sharedAt: SET.sharedAt(), setSum: SET.sum(), /* (11/11) 옆 창에서 바꾼 공통 설정 — 웹앱이 app_settings/col2_cfg에 올림 */ y24: y24Line(), al: alLine(), alSeat: AL.seatAsk(), keys: keysWant(), lists: listWant(), kind: isLoggerPc() ? 'logger' : 'office', webAt: RL.pullAt || 0, handBeat: HO.beat, handAt: HO.at || 0 }; } /* (11/11) alSeat = 다리(운영 수집기)가 없을 때 웹앱이 알라딘 자리 문서를 대신 확인 */ /* (0.1.10) keys = 운영 키를 메모리로 넘겨 달라(사무실 PC만 · 이름만) · lists = 운영 문서 목록(prd_market_nobook)을 넘겨 달라 */ /* (0.1.5) y24 = 웹앱 🧭 관리도구 PC별 상태 한 줄(예스24 판매관리 읽기) */
function relayAnswer(o) { let n = 0; for (const d of Array.isArray(o.docs) ? o.docs.slice(0, 200) : []) { const c = String(d && d.c || ''), id = String(d && d.id || ''); if (ALC.PROD_ID[c]) { const v = ALC.trimProd(c, id, d.v); if (v === undefined) continue; const k = c + '/' + id; RL.got.set(k, { v, at: now() }); RL.want.delete(k); n++; continue; } /* (알라딘 읽기) 알라딘 그림자 운영 칸 — 견줄 칸만 남김 */ if (!RC.READ_OK.includes(c) || !RID.test(id) || (RC.READ_ID && RC.READ_ID[c] && !RC.READ_ID[c].includes(id)) || (RC.READ_RE && RC.READ_RE[c] && !new RegExp(RC.READ_RE[c]).test(id))) continue; const k = c + '/' + id; RL.got.set(k, { v: d.v == null ? null : d.v, at: now() }); RL.want.delete(k); n++; }
  while (RL.got.size > 1500) RL.got.delete(RL.got.keys().next().value);
  if (Array.isArray(o.sample)) { RL.sample = { list: o.sample.slice(0, 60).filter((b) => b && RID.test(String(b.id || ''))), at: now() }; RL.sampleN = 0; n++; }
  if (Array.isArray(o.pool)) { if (poolTake(o)) n++; }
  if (o.lists && typeof o.lists === 'object' && Array.isArray(o.lists.sellers)) { const L = o.lists.sellers.slice(0, 500).filter((d) => d && /^sc_\d{1,10}$/.test(String(d.id || '')) && d.v && typeof d.v === 'object').map((d) => ({ id: String(d.id), v: { sc: String(d.v.sc || String(d.id).slice(3)).replace(/\D/g, '').slice(0, 10), name: typeof d.v.name === 'string' ? d.v.name.slice(0, 40) : null, n: Number.isFinite(+d.v.n) ? +d.v.n : null } })); const raw = o.lists.sellers.slice(0, 500); const lastId = raw.length && raw[raw.length - 1] && /^[\w.-]{1,150}$/.test(String(raw[raw.length - 1].id || '')) ? String(raw[raw.length - 1].id) : null; n += VOICE.listTake(L, raw.length < VOICE_LISTN(), lastId); } /* (11/10) 🗣 */
  if (o.lists && typeof o.lists === 'object') for (const c of RC.LIST_OK || []) { const L = Array.isArray(o.lists[c]) ? o.lists[c].slice(0, 200) : null; if (!L) continue; LW2.at[c] = now(); LW2.ask.delete(c);
    if (isLoggerPc()) { note('로거 PC는 우리 상품 목록을 받지 않음(약속 0) — 받은 목록을 버림', { k: 'sys', l: 'warn', m: '그림자 일' }); continue; }
    const docs = L.filter((d) => d && RID.test(String(d.id || '')) && d.v && typeof d.v === 'object').map((d) => ({ id: String(d.id), v: nbTrim(d.v) })); for (const d of docs) RL.got.set(c + '/' + d.id, { v: d.v, at: now() }); n += JOBS.feedNb(docs); }
  if (o.handoff && typeof o.handoff === 'object') hoTake(o.handoff); /* (11/11 col2rep2) 🔀 넘김 상태(app_settings/col2_handoff — 웹앱이 읽어 넘김) */
  if (o.err) { RL.err = String(o.err).slice(0, 200); RL.errAt = now(); } return { ok: true, n }; }
function relayAck(o) { const ks = new Set(Array.isArray(o.keys) ? o.keys.map(String) : []); const b = RL.out.length; RL.out = RL.out.filter((x) => !ks.has(x.k)); const done = b - RL.out.length;
  const errs = o.errs && typeof o.errs === 'object' ? Object.values(o.errs).map(String) : []; if (errs.length) { RL.err = errs[0].slice(0, 200); RL.errAt = now(); } else if (done) RL.err = null;
  if (done) { RL.ackAt = now(); RL.ackN += done; saveOut(); note(`웹앱이 결과 ${done}건을 대신 기록함${RL.pullBy ? ' — ' + RL.pullBy : ''}`); } if (errs.length) note('웹앱 대신 기록 실패: ' + RL.err); return { ok: true, done, left: RL.out.length }; }

/* ── (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 그림자 일 — 차림표 shadow/col2-tasks.js · 돌리기 col2-jobs.js ──
 * 로거 설정 묶음: PC 이름이 LOGGER…면 로거 고유 일(시장 지표·중고 첫 쪽·숍 요약·숍 평가·🎯 벤치마킹)만 · 사무실 PC는 로거와 겹치지 않는 일(공개 상품 화면 도서 정보 · 외부 정보)만
 *  외부 정보는 col2.json jobs.extShare:true 면 ISBN 끝자리로 나눔(로거 홀수 · 사무실 짝수) · 차례표는 PC마다 따로(jobs.json — 서로 이어받지 않음)
 * 바쁨: 🚚 출고 보호(이 PC 수집기가 예스24 다리로 알림) · POST /busy {sec, why} — 쉬는 동안 그림자 일은 요청하지 않음 */
const BUSY = { until: 0, why: '' };
function busyNow() { const y = Y24.sum(); if (y && y.hold && y.hold.on) return { on: true, why: '🚚 출고 보호 — ' + (y.hold.why || '') }; if (BUSY.until > now()) return { on: true, why: BUSY.why || '운영이 바쁘다고 알림' }; return null; }
function extUrl(u) { const b = TEST ? process.env.RN_COL2_EXT_BASE : ''; if (TEST && !b) throw new Error('시험 중엔 바깥 주소에 가지 않음'); if (!b) return u; const x = new URL(u); return b.replace(/\/$/, '') + '/__ext/' + x.host + x.pathname + x.search; }
/* 바깥 받기 — 운영 extHttp와 같은 꼴(쿠키 없이 · 손님으로) · 글자는 받은 문자 집합대로 */
async function extHttp(o) { const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 30000);
  try { const r = await fetch(extUrl(o.url), { method: o.method || 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 'Accept-Language': 'ko-KR,ko;q=0.9', ...(o.headers || {}) }, body: o.data, redirect: 'follow', signal: ac.signal, credentials: 'omit' });
    const buf = Buffer.from(await r.arrayBuffer()); const cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1] || 'utf-8'; let text; try { text = new TextDecoder(cs.toLowerCase()).decode(buf); } catch (e) { text = buf.toString('utf8'); } return { status: r.status, text }; }
  catch (e) { throw new Error(e.name === 'AbortError' ? '30초 안에 답하지 않음' : '연결 실패: ' + e.message); } finally { clearTimeout(tm); } }
/* (0.1.10) 🔑 키 받기 — 웹앱(이 PC 운영 웹앱 · 이미 로그인)이 app_secrets/ext.keys 중 번외가 쓸 이름만 POST /relay/keys {keys} · 로거 PC는 거절 */
const KTTL = () => num((CFG.keys || {}).ttlH, 1, 72, COL2.KEYS.ttlH) * 3600e3;
const keysLive = () => !!(KEYS.v && now() - KEYS.at < KTTL());
function keysPut(o, org) { if (isLoggerPc()) { note('🔑 로거 PC는 운영 키를 받지 않음(우리 계정 키 — 약속 0) · 거절함', { k: 'sys', l: 'warn', m: '키' }); return { code: 403, body: { ok: false, err: '로거 PC는 운영 키를 받지 않음(약속 0)' } }; }
  if (/^chrome-extension:/i.test(org || '')) return { code: 403, body: { ok: false, err: '웹앱만' } };
  const K = o && o.keys && typeof o.keys === 'object' ? o.keys : null; if (!K) return { code: 400, body: { ok: false, err: 'keys가 없음' } }; const v = {};
  for (const k of TK.KEY_OK) if (typeof K[k] === 'string' && K[k].trim() && K[k].length <= 400 && !TK.keyLogger(k)) v[k] = K[k].trim();
  const was = keyVals(); KEYS.v = Object.keys(v).length ? v : null; KEYS.at = now(); KEYS.n = Object.keys(v).length; KEYS.by = String((o && o.by) || '').slice(0, 60);
  if (!was.length || was.join('|') !== keyVals().join('|')) note(`🔑 운영 키 ${KEYS.n}개를 메모리에만 받음(${Object.keys(v).join('·') || '없음'} — 값은 어디에도 남기지 않음 · ${Math.round(KTTL() / 3600e3)}시간 뒤 버리고 다시 부탁)`, { k: 'sys', m: '키' });
  return { code: 200, body: { ok: true, n: KEYS.n, names: Object.keys(v) } }; }
const keysWant = () => { if (isLoggerPc() || keysLive() && now() - KEYS.at < KTTL() * 0.8) return null; let pl = []; try { pl = JOBS.plan(); } catch (e) {} const ks = pl.filter((k) => TK.byK[k] && TK.byK[k].keys); if (!ks.length) return null; return TK.KEY_OK.filter((k) => !TK.keyLogger(k)); };
function keysFor(src) { if (isLoggerPc() || !keysLive()) return {}; const X = CORE.ext; const names = new Set(); try { for (const k of (X && X.SOURCES[src] && X.SOURCES[src].keys) || []) names.add(k); for (const e of (X && X.KEYS) || []) if ((e.for || []).includes(src)) names.add(e.k); } catch (e) {} const o = {}; for (const k of names) if (KEYS.v[k] && !TK.keyLogger(k)) o[k] = KEYS.v[k]; return o; }
const keysSum = () => (isLoggerPc() ? { logger: true, n: 0, names: [] } : { n: keysLive() ? KEYS.n : 0, names: keysLive() ? Object.keys(KEYS.v) : [], at: KEYS.at ? kst(KEYS.at) : null, want: !!keysWant() });
/* (0.1.10) 운영 문서 목록 부탁 — 🔍 새상품 없는 시세(사무실 PC만): 운영이 이미 본 prd_market_nobook 문서 listN개 · everyH시간에 한 번 */
const LW2 = { at: {}, ask: new Set() };
const listWant = () => { const vw = VOICE.listWant(); return [...(vw ? [vw] : []), ...listWant0()]; }; /* (11/10) 🗣 판매자 목록(숍 번호·이름·평가 수만 — 로거도 받음 · 우리 상품·손님 정보 아님) */
const listWant0 = () => { if (isLoggerPc()) return []; let pl = []; try { pl = JOBS.plan(); } catch (e) {} if (!pl.includes('nbMarket')) return []; const c = 'prd_market_nobook'; const nb = COL2.NB;
  if (JOBS.qLen('nbMarket') > 0 || (LW2.at[c] && now() - LW2.at[c] < num((CFG.jobs || {}).nbEveryH, 1, 168, nb.everyH) * 3600e3)) return []; return [{ c, n: nb.listN, after: (JOBS._S().nbAfter || null) }]; };
/* 받은 운영 문서는 견줄 칸만(이력·옛 판은 버림) */
const nbTrim = (v) => { const m = v.market || {}; return { usedCode: v.usedCode || null, listingId: v.listingId || null, title: v.title || null, query: v.query || null, at: v.at || null, src: v.src || null, candSig: v.candSig || null, median: m.median ?? null, low: m.low ?? null, n: m.n ?? null, our: Array.isArray(v.history) && v.history.length ? v.history[v.history.length - 1].our ?? null : v.our ?? null }; };
/* (11/10 정범님) 🗣 판매자 구매평·문의 글 전부 — 로거 PC만(운영 판매자 평가와 같은 원칙) · 쓰기는 col2_voice·col2_voice_s·col2_voice_run만(웹앱이 대신 씀) */
const VOICE_LISTN = () => +(((CFG.jobs || {}).voiceCfg || {}).listN) || require('../shadow/col2-voice-core.js').CFG.listN;
const VOICE = makeVoice({ home: HOME, OWN_SC: COL2.OWN_SC, aladin: ALADIN, test: TEST, cfg: () => ({ on: !TEST, ...(CFG.jobs || {}) }), kind: () => (isLoggerPc() ? 'logger' : 'office'), pc: () => CFG.pc || os.hostname(), pace: PACE,
  core: () => loadCore(), browser: async () => { const br = await ensureBrowser('🗣 판매자 목소리'); await br.land(ALADIN + '/', W('pageTimeoutSec')); return br; }, out: (c, id, v) => outReplace(c, id, v), note: (m, o) => note(m, o) });
const JOBS = makeJobs({ home: HOME, VERSION, PASS: COL2.PASS, BUSY: COL2.BUSY, OWN_SC: COL2.OWN_SC, aladin: ALADIN, cfg: () => ({ on: !TEST, ...(CFG.jobs || {}) }), kind: () => (isLoggerPc() ? 'logger' : 'office'), pc: () => CFG.pc || os.hostname(), pace: PACE, site: SITE, /* (11/11) 바깥 사이트는 사이트마다 따로 */
  core: () => loadCore(), ext: () => CORE.ext || null, keysFor: (src) => keysFor(src), redact: (v) => redactV(v), KPIPA: COL2.KPIPA, test: TEST, kpBase: TEST ? process.env.RN_COL2_KPIPA_BASE || '' : '', extUrl: (u) => extUrl(u), /* (0.1.10) */ browser: async () => { const br = await ensureBrowser('그림자 일'); await br.land(ALADIN + '/', W('pageTimeoutSec')); return br; }, http: extHttp, busy: busyNow,
  want: (c, id) => { const r = relayGet({ c, id }); return r.code === 200 ? r.body : { err: r.body.err }; }, out: (c, id, v) => outReplace(c, id, v), note: (m, o) => note(m, o), voice: VOICE, handed: (k) => hoMine(k), opOut: (job, c, id, v, x) => opOut(job, c, id, v, x), beat: (job) => { if (!hoMine(job)) return false; HO.beat[job] = now(); return true; } /* (🔬 정밀 점검 11/11) 넘긴 일을 돌렸으면 값이 같아도 소식(beat)을 남김 — 없으면 켠 시각에서 8시간 뒤 운영이 넘김을 풀고 다시 떠맡았음 */ });
const prodPlan = () => TK.plan(isLoggerPc() ? 'logger' : 'office', CFG.jobs || {}).includes('product'); /* 공개 상품 화면 그림자(0.1.2~)는 그림자 일 켜기와 상관없이 — 로거는 하지 않음 */
/* 상태에 싣는 그림자 일 요약(작게) — 일마다 오늘 견줌·같음 비율·넘길 수 있음 */
function jobsSum() { try { const v = JOBS.view(); return { voice: VOICE.view(), kind: v.kind, d: v.d, wait: v.wait, mine: v.tasks.filter((t) => t.mine).map((t) => ({ k: t.k, q: t.q, n: t.today ? t.today.n : 0, rate: t.today ? t.today.pass.rate : null, can: !!(t.today && t.today.pass.can) })) }; } catch (e) { return { err: e.message }; } }

function setCfg(o) { const was = !!CFG.on, wasH = !!CFG.headless; const CFG0 = CFG; const out = { ...CFG };
  if (o.on === true && out.pauseUntil && o.src === 'pc') out.pauseUntil = 0; /* (11/11) 손으로 켜면 잠깐 멈춤 풀림 */
  if (o.on != null) out.on = o.on === true; if (o.place != null) out.place = o.place === 'edge' ? 'edge' : 'off'; if (o.headless != null) out.headless = o.headless === true; if (o.auto != null) out.auto = o.auto !== false; if (o.nightOn != null) out.nightOn = o.nightOn !== false; if (o.y24 != null) out.y24 = o.y24 !== false; if (o.y24Jobs != null) out.y24Jobs = o.y24Jobs !== false; if (o.side != null) out.side = o.side !== false; if (o.al != null) out.al = o.al === true; if (o.alOwn != null) { out.alOwn = o.alOwn === true && !isLoggerPc(); if (out.alOwn) out.al = true; } /* (11/10 정범님 'HOME을 번외 전용으로 — 그 PC 자리를 번외가 이어받음') 🏠 켜면 알라딘 읽기도 켬 · 로거는 늘 끔(약속 0) */ /* (알라딘 읽기) 🟧 알라딘 샵매니저 읽기 그림자 — 기본 꺼짐 */ /* (0.1.5) 예스24 판매관리 읽기 · 맡긴 일 · 옆 창 저절로 띄우기 */ if (o.pc != null && String(o.pc).trim()) { const nv = String(o.pc).trim().slice(0, 40); const src = o.pcSrc === 'pc' ? 'pc' : 'web'; if (src === 'pc' || out.pcSrc !== 'pc' || o.pcForce) { out.pc = nv; out.pcSrc = src; } } /* (0.1.1) 이 PC 이름 — 웹앱 기기 이름에서 저절로 · 도우미 화면에서 바꾸면(pcSrc pc) 웹앱이 덮지 않음 */
  for (const k of ['cwin']) { const r = rectOk(o[k], 260, 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: o.src || 'web' }; }
  for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (r && (!out[k] || r.at > (+out[k].at || 0))) out[k] = { ...r, src: o.src || 'web' }; }
  if (o.pace && typeof o.pace === 'object') { const p = { ...(out.pace || {}) }; for (const k of Object.keys(COL2.PACE)) if (k !== 'floorMs' && o.pace[k] != null && Number.isFinite(+o.pace[k])) p[k] = +o.pace[k]; out.pace = p; }
  if (o.siteCfg && typeof o.siteCfg === 'object') { const sc = { ...(out.siteCfg || {}) }; for (const [k, v] of Object.entries(o.siteCfg).slice(0, 40)) { if (!/^[\w.-]{1,30}$/.test(k) || !v || typeof v !== 'object') continue; const x = {}; for (const f of ['gapMs', 'dayCap']) if (v[f] != null && Number.isFinite(+v[f])) x[f] = +v[f]; sc[k] = x; } out.siteCfg = sc; } /* (11/11) 바깥 사이트 몫 바꾸기 */
  if (TEST && o.watch && typeof o.watch === 'object') out.watch = { ...(out.watch || {}), ...o.watch };
  if (o.jobs && typeof o.jobs === 'object') { const j = { ...(out.jobs || {}) }; if (o.jobs.on != null) j.on = o.jobs.on !== false; if (o.jobs.extShare != null) j.extShare = o.jobs.extShare === true; if (o.jobs.voice != null) j.voice = o.jobs.voice !== false; /* (11/10) 🗣 판매자 목소리 끄고 켜기 */ if (o.jobs.voiceCfg && typeof o.jobs.voiceCfg === 'object') { const v = { ...(j.voiceCfg || {}) }; for (const k of ['start', 'rampDays', 'burst', 'flushN', 'incEveryH', 'findEveryD', 'listN', 'listEveryH']) if (o.jobs.voiceCfg[k] != null && Number.isFinite(+o.jobs.voiceCfg[k])) v[k] = Math.max(0, Math.min(100000, +o.jobs.voiceCfg[k])); if (v.start > 0.95) v.start = 0.95; j.voiceCfg = v; } if (Array.isArray(o.jobs.off)) j.off = o.jobs.off.map(String).filter((k) => TK.byK[k]).slice(0, 60); if (Array.isArray(o.jobs.benchSc)) j.benchSc = o.jobs.benchSc.map(String).filter((x) => /^\d{1,10}$/.test(x)).slice(0, 200);
    if (o.jobs.pass && typeof o.jobs.pass === 'object') { const p = { ...(j.pass || {}) }; for (const k of ['minN', 'maxFailPct', 'waitMin']) if (o.jobs.pass[k] != null && Number.isFinite(+o.jobs.pass[k])) p[k] = Math.max(TEST ? 0 : 1, Math.min(100000, +o.jobs.pass[k])); j.pass = p; } out.jobs = j; } /* (0.1.9) 그림자 일 설정 */
  const ch = JSON.stringify(out) !== JSON.stringify(CFG); CFG = out; if (ch) saveCfg();
  if (o.shared || o.sharedAck) SET.take(o.shared, o.sharedAck); /* (11/11) 웹앱이 넘긴 모든 PC 공통 설정(app_settings/col2_cfg) · 올린 것 확인 */
  if (was !== !!CFG.on) { note(CFG.on ? '번외 수집 켬' : '번외 수집 끔 — 작업 창을 닫음'); setTimeout(() => tick('설정 바뀜'), 50); if (CFG.on) { autoKick(); sideOpen('켬'); } }
  if (o.y24 != null || was !== !!CFG.on) Y24.kick(200);
  if (o.alOwn != null && !!CFG.alOwn !== !!(CFG0.alOwn)) note(CFG.alOwn ? '🏠 이 PC 알라딘 로그인 자리를 번외가 이어받음 — 운영 수집기는 다음 알림(10초 안)에 이 PC 자리를 놓고, 번외가 그 자리를 받음' : '🏠 이어받기 끔 — 번외는 자리를 놓고, 운영 수집기가 예전처럼 이 PC 자리를 받음', { k: 'al', m: '알라딘' });
  if (o.al != null || o.alOwn != null || was !== !!CFG.on) AL.kick(200);
  if (o.side === true) sideOpen('옆 창 켬');
  else if (wasH !== !!CFG.headless && B) { closeBrowser('화면 방식 바뀜').then(() => tick('화면 방식 바뀜')); }
  return ch; }

/* (11/10~11) 🔐 [확인하고 저장] — 화면 단추와 (11/11) 자리를 기다린 확인(CQ)이 같이 씀 · J는 답 함수(화면이면 HTTP 답 · 기다린 확인이면 결과만 받음) */
/* (11/11 정범님 'HOME 🏠를 켜고 자리를 받으면 바로 확인 로그인') 알라딘은 번외 자리(판매자 동시 로그인 ≤4대)를 받아야 로그인해 볼 수 있음 → 자리를 기다리는 동안 넣은 값을 도우미 메모리에만 잠시(기본 10분 · 파일·기록·상태에 없음) 두고, 자리를 받으면 곧바로 같은 확인을 함 */
const CQ = {}; const CQ_MS = () => Math.max(60e3, (+((CFG.relogin || {}).queueMin) || 10) * 60e3) * (TEST && process.env.RN_COL2_CQ_SCALE ? +process.env.RN_COL2_CQ_SCALE : 1);
async function credSave(o, J) { const pf = String(o.pf || ''); if (pf === 'al' && !o.queued && CQ.al) { CQ.al.id = CQ.al.pw = null; delete CQ.al; } /* 새로 누르면 기다리던 확인은 버림 */ const eng = pf === 'y24' ? Y24 : pf === 'al' ? AL : null; if (!eng) return J(400, { ok: false, err: '모르는 플랫폼' }); if (!String(o.id == null ? '' : o.id).trim() || !String(o.pw == null ? '' : o.pw)) { o.id = o.pw = null; return J(200, { ok: false, err: '아이디와 비밀번호를 모두 넣어 주세요', relogin: RLG.sum() }); }
      const nm = (CRED.PF[pf] || {}).name || pf; if (RLG.jobOn(pf)) { o.id = o.pw = null; return J(200, { ok: false, busy: true, err: `${nm} — 앞서 누른 확인이 아직 도는 중 · 끝날 때까지 기다려 주세요`, relogin: RLG.sum() }); }
      const keep = async (chk, msg, kind) => { const r = await CRED.save(pf, o.id, o.pw, chk); o.id = o.pw = null; if (r.ok) { note(`🔐 ${nm} 계정을 이 PC에 잠가 저장함(Windows DPAPI · 이 PC 이 사용자만 풂 · 값은 기록하지 않음)${chk === 'pending' ? ' — ⚠ 확인하지 못한 채(다음 다시 로그인 때 확인)' : ''}`, { k: 'sys', m: '로그인' }); RLG.reset(pf); }
        const out = { ok: r.ok, pending: chk === 'pending', kind, msg: r.ok ? msg : null, err: r.ok ? null : r.err }; RLG.jobEnd(pf, { ok: r.ok, kind: r.ok ? kind : 'err', msg: r.ok ? msg : '✗ ' + r.err }); return J(200, { ...out, relogin: RLG.sum() }); };
      const PEND = '다음에 로그인이 풀려 스스로 다시 로그인할 때 이 값으로 확인하고, 틀리면 기록창에 ⛔로 알리고 스스로 다시 로그인을 멈춤';
      /* (11/10 밤 정범님 '확인 중만 오래 있다 그냥 풀려') 확인을 끝내지 못했을 때(시간 넘음·화면 안 열림·자리 없음·출고 중 등)만 — 정범님이 [그래도 잠가 저장]을 두 번 눌러 확인 없이 저장(사이트가 '틀림'이라 한 값은 안 됨) */
      if (o.force === true) { const jb = (RLG.sum()[pf] || {}).job; if (!(jb && !jb.on && jb.res && jb.res.canForce && now() - (jb.end || 0) < 15 * 60e3)) { o.id = o.pw = null; return J(200, { ok: false, err: '먼저 [확인하고 저장]을 눌러 주세요 — 확인을 끝내지 못했을 때만 「그래도 잠가 저장」을 쓸 수 있음', relogin: RLG.sum() }); }
        RLG.jobStart(pf, 0); return keep('pending', `⚠ 확인하지 못한 채 잠가 저장함(두 번 누름) — ${PEND}`, 'forced'); }
      /* (정범님 11/10 '저장을 누르면 먼저 맞는지 확인 → 맞으면 저장, 틀리면 다시 넣어 주세요와 까닭') 그 PC에서 실제로 로그인해 본 뒤에만 잠가 저장 · 캡차·2단계 인증이면 그 사실 · 값은 기록·응답에 싣지 않음
       *  · 진행은 relogin.<pf>.job(무엇을 하는 중·몇 초째 — 값 없음)으로 화면이 따로 읽음(답이 끊겨도 결과가 남음) · 시간 넘음(relogin.vMaxSec 기본 150초)이면 그 자리에서 멈추고 '확인 못 함' */
      const maxSec = Math.max(5, +((CFG.relogin || {}).vMaxSec) || 150); const jb = RLG.jobStart(pf, maxSec); let tm = null;
      const dl = new Promise((r) => { tm = setTimeout(() => { jb.abort = true; r({ ok: false, unsure: true, timeout: true, why: `${maxSec}초 안에 확인이 끝나지 않음(마지막 단계: ${jb.phase})` }); }, maxSec * 1000); });
      let v; try { v = await Promise.race([Promise.resolve().then(() => eng.verify(o.id, o.pw, { phase: jb.ph })).catch((e) => ({ ok: false, unsure: true, why: String(e && e.message || e).slice(0, 140) })), dl]); } finally { clearTimeout(tm); } v = v || { ok: false, unsure: true, why: '모름' };
      if (v.ok) return keep('ok', `✓ 로그인 확인됨 — 이 PC에 잠가 저장함${v.where === 'tab' ? '(지금 세션은 그대로 두고 쿠키가 따로인 임시 창에서 확인)' : ''}`, 'ok');
      if (v.live) return keep('pending', `✓ 잠가 저장함 — 단 ${nm}이(가) 지금 로그인돼 있어서 바로 확인하지 않음(확인하려면 로그인을 하나 더 해야 해 동시 로그인 자리를 하나 더 써 다른 PC가 끊길 수 있음) · ${PEND}`, 'live');
      if (v.wait && v.seat && pf === 'al' && !o.queued) { CQ.al = { id: o.id, pw: o.pw, until: now() + CQ_MS() }; o.id = o.pw = null; const tl = v.tell || AL.seatTell(); const msg = `🪑 번외 알라딘 자리를 받는 대로 저절로 확인하고, 맞으면 잠가 저장합니다(${Math.round(CQ_MS() / 60e3)}분 안 · 넣은 값은 이 PC 도우미 메모리에만 잠시 — 파일·기록에 안 남김) · 지금: ${v.why} · 할 일: ${tl.todo}`;
        note('🔐 알라딘 샵매니저 — 자리를 받으면 곧바로 확인 로그인하려고 기다림(값은 메모리에만 · 기록하지 않음)', { k: 'sys', m: '로그인' }); RLG.jobEnd(pf, { ok: false, kind: 'queued', msg: '⏳ ' + msg, canForce: true }); return J(200, { ok: false, queued: true, kind: 'queued', err: msg, canForce: true, wait: true, relogin: RLG.sum() }); }
      o.id = o.pw = null; let err, kind;
      if (v.bad) { kind = 'bad'; err = `저장하지 않았습니다 — 다시 넣어 주세요 · 까닭: ${v.why}`; }
      else if (v.human) { kind = 'human'; err = `저장하지 않았습니다 — ${v.why} · 보안 문자·2단계 인증은 사람이 옆 창 [🔐 로그인]으로 직접 한 번 해 주세요`; }
      else if (v.wait) { kind = v.own ? 'own' : 'wait'; err = `지금은 확인할 수 없어 저장하지 않았습니다 — ${v.why}`; }
      else { kind = 'unsure'; err = `확인 못 함 — ${v.why} · 저장하지 않았습니다`; }
      const canForce = kind !== 'bad' && !/로거/.test(v.why || ''); if (canForce) err += ' · 값이 맞다고 확신하면 [그래도 잠가 저장]을 두 번 누르면 확인 없이 잠가 저장(다음 다시 로그인 때 확인)';
      RLG.jobEnd(pf, { ok: false, kind, msg: '✗ ' + err, canForce }); return J(200, { ok: false, err, kind, canForce, human: kind === 'human', wait: kind === 'wait' || kind === 'own', unsure: kind === 'unsure', relogin: RLG.sum() }); }
async function credQueueTick() { const q = CQ.al; if (!q) return; if (now() > q.until) { delete CQ.al; const tl = AL.seatTell(); RLG.jobEnd('al', { ok: false, kind: 'wait', msg: `✗ ${Math.round(CQ_MS() / 60e3)}분 기다려도 번외 알라딘 자리를 받지 못해 확인하지 않았고 저장하지 않았습니다 — 지금: ${tl.now} → 지금 할 일: ${tl.todo}`, tell: tl, canForce: true }); /* (11/11 col2rep1 — 정범님 15:00 '🏠가 켜져 있는지' 같은 막연한 안내 대신 무엇이 자리를 쥐고 있는지·할 일) */ note('🔐 알라딘 샵매니저 — 자리를 기다린 확인을 그만둠(시간 넘음 · 값은 메모리에서 지움)', { k: 'sys', m: '로그인' }); return; }
  const a = AL.sum(); if (!a.seat || RLG.jobOn('al')) return; delete CQ.al; note('🪑 번외 알라딘 자리를 받음 — 기다리던 계정 확인 로그인을 곧바로 함', { k: 'sys', m: '로그인' });
  await credSave({ pf: 'al', id: q.id, pw: q.pw, queued: true }, () => {}).catch(() => {}); q.id = q.pw = null; }
function status() { return { ok: true, ver: VERSION, port: PORT, pid: process.pid, jobs: jobsSum(), keys: keysSum(), /* (0.1.10) 키 이름·수만(값 없음) */ busy: busyNow(), /* (운영 도우미 다리 /col2/stop이 이 프로세스만 멈추게) */ pc: CFG.pc || os.hostname(), kind: isLoggerPc() ? 'logger' : 'office', pcSrc: CFG.pcSrc || (CFG.pc ? 'web' : 'os'), cwin: CFG.cwin || null, relay: relaySum(), auto: autoSum(), y24: Y24.sum(), al: AL.sum(), alw: ALW.sum(), alWant: CFG.al === true, set: SET.sum(), /* (11/11) 기본값과 다른 설정만 */ pause: CFG.pauseUntil && CFG.pauseUntil > now() ? CFG.pauseUntil : null, relogin: RLG.sum(), /* (11/10) 🔐 저장됨·켬·멈춤·마지막 결과만(아이디·비밀번호 값 없음) */ alOwn: CFG.alOwn === true && !isLoggerPc(), /* (11/10) 🏠 이 PC 알라딘 자리를 번외가 이어받음 */ side: sideOn(), y24Want: CFG.y24 == null ? !TEST : CFG.y24 !== false, y24Jobs: CFG.y24Jobs !== false, upd: { at: UPD.at ? kst(UPD.at) : null, msg: UPD.msg }, on: !!CFG.on, headless: !!CFG.headless, place: CFG.place || 'off', alive: !!(B && B.alive()), open: ST.open, shown: ST.shown, rect: ST.rect, win: CFG.win || null, hwin: CFG.hwin || null, hwinOpen: ST.hwinOpen, lwin: { open: lwinOpen(), rect: CFG.lwin || null, err: LW.err || '', step: LW.step || '' }, /* (0.1.8) 📜 기록창 따로 창이 떠 있는지(🗒 단추 색) */
  opens: opensHour(), chrome: { fails: CH.fails, last: CH.last, okAt: CH.okAt ? kst(CH.okAt) : null, coolUntil: CH.coolUntil ? kst(CH.coolUntil) : null, cools: CH.cools, adopts: CH.adopts, retries: CH.retries }, msg: [ST.msg, CFG.on && AU.msg && AU.msg !== ST.msg ? '자동 읽기: ' + AU.msg : ''].filter(Boolean).join(' · '), /* (0.1.4) 자동 읽기가 왜 쉬는지(하루 몫·표본 기다림·작업 창 준비 실패)도 웹앱 col2_ctl·진단에 보이게 — 예전엔 작업 창 지킴이 글만 보여 멈춘 까닭을 몰랐음 */ reading: ST.reading, reads: ST.reads.slice(-10), pace: PACE.state(), nv: NV.sum(), /* (0.1.22) 🟩 네이버 — 값 없음 */ site: SITE.state(), /* (11/11) 바깥 사이트 몫(오늘 · 사이트마다) — 알라딘 몫(pace)과 따로 */ core: { ver: CORE.ver, at: CORE.at ? kst(CORE.at) : null, err: CORE.err }, logs: JRN.tail(15).map((e) => ({ t: e.t, m: e.x, l: e.l, k: e.k })), pcKind: JRN.kind(), aladin: ALADIN === COL2.ALADIN ? 'real' : 'test', at: kst() }; }

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
/* (11/11 정범님 '번외 수집기 대부분을 설정으로') ⚙ 설정 표 — 값은 일 파일들이 이미 읽는 col2.json 덮어쓰기 칸에 넣음(바꾸면 바로 반영) · 공통 값은 이 PC 웹앱이 app_settings/col2_cfg에 올리고 나눔 · col2-settings.js */
function siteDef(src, f) { const X = CORE.ext && CORE.ext.SOURCES ? CORE.ext.SOURCES : {}; const d = X[src] || SITE_DEF[src] || { paceMs: 3000, cap: 300 }; return f === 'gapMs' ? Math.max(COL2.PACE.floorMs, +d.paceMs || 3000) : Math.max(1, +d.cap || 300); }
const SET = SETM.makeSettings({ get: () => CFG, save: () => saveCfg(), COL2, AC, test: TEST, isLogger: () => isLoggerPc(), siteDef, note: (m) => note(m, { k: 'sys', m: '설정' }) });
/* ⏸ 잠깐 멈춤 — 정한 분 동안 번외 수집을 끄고(숨은 크롬 닫음) 그 시각이 되면 저절로 다시 켬 · 손으로 켜면 멈춤 풀림 */
function pauseSet(min, by) { min = Math.max(0, Math.min(24 * 60, Math.round(+min || 0))); if (!min) { const was = CFG.pauseUntil; CFG.pauseUntil = 0; saveCfg(); if (was) { note('▶ 잠깐 멈춤을 풀고 다시 켬' + (by ? ' — ' + by : '')); setCfg({ on: true }); } return { ok: true, pause: null }; }
  setCfg({ on: false }); CFG.pauseUntil = now() + min * 60e3; saveCfg(); note(`⏸ ${min}분 잠깐 멈춤 — ${kst(CFG.pauseUntil).slice(11, 16)}에 저절로 다시 켬${by ? ' · ' + by : ''}`); return { ok: true, pause: CFG.pauseUntil }; }
setInterval(() => { if (CFG.pauseUntil && now() >= CFG.pauseUntil) pauseSet(0, '정한 시각이 됨'); }, TEST ? 500 : 20e3);
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
const prodShare = () => { const v = CFG.prodShare != null ? +CFG.prodShare : +AC.prodShare; return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1; };
const prodFull = () => { const d = AU.day && AU.day.d === new Date(now() + 9 * 3600e3).toISOString().slice(0, 10) ? +AU.day.n || 0 : 0; return d > 0 && d >= Math.floor(paceCfg().dayCap * prodShare()); }; /* (11/10 밤 col2n) 상품 화면 하루 몫 다 씀 → 그림자 일 표본 먼저 */
const poolLeft = () => Math.max(0, AU.pool.length - AU.cur);
function poolNeed() { if (!autoOn()) return 0; if (AU.lap.end) { if (poolLeft() > 0) return 0; lapNext(); } return poolLeft() < RC.poolLow ? RC.poolN : 0; } /* (0.1.2) 하루 지나면 새 표본으로 갈아끼우던 것을 없앰 — 갈아끼우면 남은 책을 버리고 같은 책을 다시 읽게 됨 */
const untilKstMidnight = () => { const t = now() + 9 * 3600e3; return 86400e3 - (t % 86400e3); };
/* 같은 문서를 아직 안 올렸으면 새 값으로 바꿔 끼움(하루 요약이 쌓이지 않게) */
function outReplace(c, id, v, merge) { v = redactV(v); /* (0.1.10) 키 값이 섞여도 남기지 않음 */ const i = RL.out.findIndex((x) => x.c === c && x.id === id); const it = { k: 'o' + now().toString(36) + Math.random().toString(36).slice(2, 8), c, id, v, merge: !!merge, at: now() }; if (i >= 0) RL.out[i] = it; else RL.out.push(it); saveOut(); }
async function autoStep() {
  if (!CFG.on) { AU.msg = '번외 수집 꺼짐'; return 30e3; }
  if (!autoOn()) { AU.msg = '자동 읽기 꺼 둠(설정 auto)'; return 30e3; }
  const h = kHour(); if (!nightOn() && h >= AC.nightFrom && h < AC.nightTo) { AU.msg = `새벽 ${AC.nightFrom}~${AC.nightTo}시 쉼(설정 nightOn 꺼짐)`; return 10 * 60e3; }
  if (ST.reading) return 3000;
  /* (0.1.9) 그림자 일 — 공개 상품 화면 읽기와 번갈아 하나씩(같은 속도 규칙 PACE를 함께 씀) · 상품 그림자를 하지 않는 PC(로거)는 표본 책을 일 차례로만 넘기고 그림자 일만 */
  { const bz = busyNow(); if (bz) { AU.msg = '운영이 바빠 쉼 — ' + bz.why; JOBS.step().catch(() => {}); return COL2.BUSY.restMs; } }
  if (!prodPlan() && AU.cur < AU.pool.length && JOBS.bookQ() < 50) { const L = AU.pool.slice(AU.cur, AU.cur + 100); AU.cur += L.length; AU.lap.read += L.length; JOBS.feedBooks(L); savePos(); }
  if (!prodPlan() || AU.cur >= AU.pool.length || prodFull() || (AU.turn = (AU.turn || 0) + 1) % 2 === 0) { /* (11/10 밤) prodFull = 오늘 상품 화면이 하루 몫의 prodShare를 넘음 → 그림자 일 먼저 */ /* (0.1.10) 읽을 표본 책이 없을 때는 그림자 일을 차례마다(예전엔 한 번 걸러 15초씩 쉬어 사무실 PC 그림자 일이 16초에 하나) */ if (RL.out.length < RC.outMax) { ST.reading = { job: true, at: now() }; let j; try { j = await JOBS.step(); } catch (e) { j = { did: false, rest: 10e3, why: e.message }; } finally { ST.reading = null; }
      if (j.did) { AU.msg = '그림자 일 도는 중'; return 1000; } if (!prodPlan() || (AU.cur >= AU.pool.length && /차례 기다림|운영 값 기다림/.test(j.why || ''))) { if (AU.cur >= AU.pool.length && AU.lap.end && AU.pool.length) lapNext(); AU.msg = '그림자 일: ' + (j.why || '쉼') + (AU.cur >= AU.pool.length ? ' · 표본 책을 기다림(이 PC 웹앱이 넘김)' : ''); return Math.max(1000, Math.min(j.rest || 15e3, 30 * 60e3)); } } }
  if (AU.cur >= AU.pool.length && AU.lap.end && AU.pool.length) lapNext();
  if (AU.cur >= AU.pool.length) { AU.msg = AU.pool.length ? `다음 ${num(RC.poolN, 1, 5000, 1000).toLocaleString()}권을 기다림(${AU.lap.n}바퀴 · 지금까지 ${AU.lap.read}권) — 이 PC에서 리드나우 웹앱(로그인된 것)이 이어 넘김` : '표본 목록을 기다림 — 이 PC에서 리드나우 웹앱(로그인된 것)을 열어 두면 넘겨받음'; return 15e3; }
  if (RL.out.length >= RC.outMax) { AU.msg = `올리지 못한 결과가 ${RL.out.length}건 — 웹앱이 열릴 때까지 쉼`; return 60e3; }
  const c = PACE.check(); if (!c.ok) { AU.msg = c.why + (c.retryMs == null ? ' — 다음 날 이어감' : ''); return c.retryMs == null ? untilKstMidnight() + 30e3 : Math.min(c.retryMs + 500, 30 * 60e3); }
  if (c.waitMs > 0) { AU.msg = '자동으로 도는 중'; return c.waitMs + 50; }
  const it = AU.pool[AU.cur]; AU.cur++; const d = kday(); if (AU.day.d !== d) AU.day = { d, n: 0, same: 0, diff: 0, no: 0, fail: 0 };
  const r = await readProduct({ itemId: it.itemId, quiet: true }); const b = r.body || {};
  if (r.code !== 200 || !b.ok) { if (b.paced || r.code === 503 || r.code === 409 || r.code === 429) { AU.cur--; savePos(); AU.msg = '잠깐 쉼 — ' + (b.err || b.why || r.code); return r.code === 503 ? 10e3 : 5000; } /* 작업 창 준비 중·읽는 중이면 그 책을 다시(셈하지 않음) */ AU.day.n++; AU.day.fail++; AU.lap.read++; AU.last = { at: kst(), itemId: it.itemId, ok: false, why: b.why || b.err || null }; JOBS.addProduct(it.itemId, b.needLogin ? 'skip' : 'fail', [], b.why || b.err || null); note(`그림자 읽기 ${it.itemId} — ✗ ${b.why || b.err || r.code}`, { k: 'read', l: b.needLogin ? 'warn' : 'err', m: '알라딘', d: { id: it.itemId, ok: false, ms: b.tookMs || b.ms || null, why: b.why || b.err || null } }); }
  else { const sh = CMP.pickPage(b.page, COL2.BOOK_FIXED); const cmp = CMP.compareBook(it.prod || null, sh, COL2.BOOK_FIXED, { oldDays: (CFG.pass || {}).oldDays }); AU.day.n++; AU.lap.read++; AU.day[cmp.verdict === 'same' ? 'same' : cmp.verdict === 'noprod' ? 'no' : 'diff']++;
    outReplace('col2_books', it.bookId || 'itemId_' + it.itemId, { itemId: it.itemId, bookId: it.bookId || null, at: new Date().toISOString(), runId: 'auto_' + d, auto: true, page: sh, coreVer: b.coreVer || null, alVer: b.alVer || null, helperVer: VERSION, pc: CFG.pc || os.hostname(), ms: b.ms || null, cmp: { verdict: cmp.verdict, n: cmp.n, diffFields: cmp.diffFields } });
    AU.last = { at: kst(), itemId: it.itemId, ok: true, verdict: cmp.verdict, title: sh.title || null };
    JOBS.addProduct(it.itemId, cmp.verdict, [...new Set(cmp.rows.filter((x) => x.k !== 'same').map((x) => x.k))]); JOBS.feedBooks([it]); /* (0.1.9) 하루 셈 · 같은 책의 외부 정보 그림자 차례 */
    note(`그림자 읽기 ${it.itemId} — ✓ ${sh.title || ''} · ${{ same: '같음', noprod: '운영 칸 없음' }[cmp.verdict] || '다름' + (cmp.diffFields && cmp.diffFields.length ? '(' + cmp.diffFields.slice(0, 4).join('·') + ')' : '')}`, { k: 'read', l: cmp.verdict === 'same' || cmp.verdict === 'noprod' ? 'ok' : 'warn', m: '알라딘', d: { id: it.itemId, ok: true, ms: b.tookMs || b.ms || null, v: cmp.verdict } }); }
  const D2 = AU.day; outReplace('col2_runs', 'auto_' + d, { at: new Date().toISOString(), auto: true, d, n: D2.n, sameN: D2.same, diffN: D2.diff, noN: D2.no, failN: D2.fail, lap: AU.lap.n, lapRead: AU.lap.read, ver: VERSION, pc: CFG.pc || os.hostname() });
  savePos(); AU.msg = '자동으로 도는 중'; return 1000; }
async function autoLoop() { if (AU.running) return; AU.running = true; let next = 15e3; try { next = await autoStep(); } catch (e) { AU.msg = '자동 읽기 오류: ' + e.message; next = 60e3; } finally { AU.running = false; }
  AU.nextAt = now() + next; clearTimeout(AU.t); AU.t = setTimeout(autoLoop, next); restNote(); }
/* (0.1.6) 쉼 까닭이 바뀔 때만 기록창에 한 줄(10초마다 같은 줄이 쌓이지 않게) · 다시 돌면 '다시 읽기 시작' */
let restWas = null; function restNote() { const m = String(AU.msg || ''); const run = /도는 중/.test(m); const key = run ? '' : m.replace(/\d[\d,.]*/g, '#');
  if (key === restWas) return; const was = restWas; restWas = key; if (run) { if (was) note('▶ 자동 읽기 다시 시작', { k: 'rest', l: 'ok', m: '쉼' }); return; } if (m) note('⏸ 자동 읽기 쉼 — ' + m, { k: 'rest', l: /429|오류|실패/.test(m) ? 'warn' : 'info', m: '쉼' }); }
const autoKick = () => { clearTimeout(AU.t); AU.t = setTimeout(autoLoop, 500); };
function autoSum() { const p = PACE.state(); return { on: autoOn() && !!CFG.on, auto: autoOn(), nightOn: nightOn(), msg: AU.msg, poolN: AU.pool.length, left: poolLeft(), poolAt: AU.poolAt ? kst(AU.poolAt) : null, nextMs: AU.nextAt ? Math.max(0, AU.nextAt - now()) : null, day: AU.day, dayN: p.dayN, dayCap: p.dayCap, prodShare: prodShare(), prodFull: prodFull(), /* (11/10 밤) 상품 화면 하루 몫을 다 써 그림자 일 먼저 */ last: AU.last, lap: { n: AU.lap.n, read: AU.lap.read, got: AU.lap.got, end: AU.lap.end, after: AU.lap.after, at: AU.lap.at, done: AU.lap.done } }; }

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
    if (ST.reading) { UPD.msg = '읽는 중 — 다음에'; return; } if (RLG.anyJob()) { UPD.msg = '🔐 계정 확인 중 — 다음에(확인 도중 크롬을 닫지 않게)'; return; }
    const q = '?t=' + now(); const cfg = String(await getBuf(UPD.raw + 'col2-config.js' + q)); const v = (cfg.match(/COL2_VER:\s*'([\d.]+)'/) || [])[1]; if (!v) throw new Error('새 설정 파일에 판 번호가 없음');
    if (vnum(v) <= vnum(VERSION)) { UPD.msg = `새 판 없음(GitHub ${v})`; return; }
    const man = JSON.parse(String(await getBuf(UPD.raw + 'bundle.json' + q))); const L = (man.files || []).filter((f) => UPD_FILE.test(f)); if (!L.includes('helper/readnow-col2-helper.js')) throw new Error('묶음 목록이 이상함');
    const nd = path.join(HOME, 'app.self'); fs.rmSync(nd, { recursive: true, force: true });
    for (const f of [...new Set([...L, 'bundle.json'])]) { const b = f === 'col2-config.js' ? Buffer.from(cfg) : await getBuf(UPD.raw + f + q); const t = path.join(nd, ...f.split('/')); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, b);
      if (/\.js$/.test(f)) { const ck = require('child_process').spawnSync(process.execPath, ['--check', t], { windowsHide: true }); if (ck.status !== 0) { UPD.msg = `새 판 ${v}의 ${f} 검사 실패 — 옛 판 ${VERSION} 그대로`; note(UPD.msg); return; } } }
    note(`새 판 ${v}을 받아 검사 통과 — 번외 크롬을 닫고 바꿔 끼운 뒤 다시 켜짐(운영 인쇄 도우미 지킴이)`); await closeBrowser('새 판으로 바꿈').catch(() => {}); await Y24.close('새 판으로 바꿈').catch(() => {}); await AL.close('새 판으로 바꿈').catch(() => {});
    const old = path.join(HOME, 'app.old'); fs.rmSync(old, { recursive: true, force: true }); fs.renameSync(ROOT, old); try { fs.renameSync(nd, ROOT); } catch (e) { fs.renameSync(old, ROOT); throw e; }
    log(`스스로 새 판으로 바꿈 ${VERSION} → ${v} — 끝내고 다시 켜지기를 기다림`); setTimeout(() => process.exit(0), 300);
  } catch (e) { UPD.msg = '새 판 확인 실패(옛 판 그대로): ' + e.message; } finally { UPD.busy = false; } }

/* (0.1.5 정범님 11/09 밤 '번외 수집기를 로거나 ALPS 도우미처럼 작게 PC마다 사이드에 뜨게 — 위치·크기 저장') 📊 옆 창 — 켜질 때 저절로 작은 앱 창(380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위)
 *  이미 떠 있으면 그대로 · 정범님이 닫으면 다시 켜질 때까지 안 띄움 · 끄기: 옆 창 '저절로 띄우기' 또는 col2.json side:false · 시험에선 켤 때만 */
const sideOn = () => (CFG.side == null ? !TEST : CFG.side !== false);
async function sideOpen(why) { if (!sideOn() || !CFG.on) return null; try { const f = await WIN.run('find', STAT_MARK); if (f.ok && f.n) return null; return await appWin('status', why); } catch (e) { return null; } }
/* 웹앱 관리도구 PC별 한 줄 — 예스24 판매관리 읽기(손님 정보 없음) */
function alLine() { const a = AL.sum(); return { on: a.on, logger: a.logger, login: a.login, active: a.active, seat: a.seat, pp: a.pp, msg: String(a.msg || '').slice(0, 160), day: { n: a.day.n, same: a.day.same, diff: a.day.diff, wait: a.day.wait }, w: ALW.line() }; } /* (알라딘 읽기) 웹앱 PC 줄 🟧 한 줄(제안) */
function y24Line() { const y = Y24.sum(); return { on: y.on, logger: y.logger, login: y.login, active: y.active, msg: String(y.msg || '').slice(0, 160), ordAt: y.ord.at, ordErr: y.ord.err, prdAt: y.prd.at, prdN: y.prd.n, day: y.day, q: y.q, sent: y.sent, jobsOk: y.jobsOk }; }
/* 📊 상태 창 — 작은 앱 창(380×560)에 맞게: 글자 작게 · 접는 칸 · 가로 넘침 없음 (ALPS 도우미 화면 모양) */
const SMALL_CSS = `:root{--ink:#1E2B28;--sub:#5B6B66;--line:#DCE3E0;--bg:#F3F5F4;--card:#fff;--pri:#2F5D50;--soft:#E6EFEB;--ok:#2F7D4F;--okSoft:#E3F1E8;--no:#B0322A;--noSoft:#FDECEA;--warn:#A8661B;--warnSoft:#FFF4E5;--r:10px} /* (11/11 col2ui1) 웹앱 디자인 토큰과 같은 색(천 초록 · 호박 · 빨강) */
@media (prefers-color-scheme: dark){:root{--ink:#E6ECEA;--sub:#9DB0AA;--line:#33403C;--bg:#141A18;--card:#1D2523;--pri:#7FC3AE;--soft:#22302B;--ok:#6FCF9C;--okSoft:#1E3328;--no:#F08C82;--noSoft:#3A2220;--warn:#E8B46A;--warnSoft:#3A2E1A}}
*{box-sizing:border-box}html,body{overflow-x:hidden}body{font:13px/1.5 Pretendard,'Malgun Gothic',system-ui,sans-serif;margin:0;background:var(--bg);color:var(--ink);min-width:0}
h1{font-size:14px;margin:0;padding:7px 10px;background:var(--pri);color:#fff;display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}h1 small{font-weight:400;opacity:.85;font-size:11px}
.b{padding:6px 8px}.c{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 8px;margin:0 0 6px;min-width:0;overflow-wrap:anywhere}
details.c>summary{cursor:pointer;list-style:none;font-weight:700}details.c>summary::-webkit-details-marker{display:none}details.c>summary::before{content:'▸ ';color:var(--sub)}details.c[open]>summary::before{content:'▾ '}
.k{color:var(--sub);font-size:11.5px}.ok{color:var(--ok);font-weight:700}.no{color:var(--no);font-weight:700}.wa{color:var(--warn);font-weight:700}
button{font:12px system-ui,'Malgun Gothic';border:1px solid var(--pri);background:var(--card);color:var(--pri);border-radius:6px;padding:3px 7px;margin:2px 3px 2px 0;cursor:pointer;max-width:100%}button.p{background:var(--pri);color:#fff}button.warn{border-color:var(--no);color:var(--no)}button:disabled{opacity:.5;cursor:default}
input{font:12px system-ui;padding:2px 4px;max-width:100%;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:4px}input.n{width:52px}
.crbadge{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0;padding:7px 10px;border-radius:10px;font-weight:700;font-size:14px}.crbadge.ok{background:#E3F4EA;color:#1B5E3A;border:2px solid #2E9D5B}.crbadge.pend{background:#FFF4D6;color:#6B4A00;border:2px solid #E8A33A}.crbadge.bad{background:#FDE7E7;color:#8E1F1F;border:2px solid #C62828}.crbadge button{font-size:12px;font-weight:600}.crold{opacity:.55;font-size:11px}
.ln{font:11px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:160px;overflow:auto;background:var(--bg);border-radius:6px;padding:5px}
.pcn{font-size:12px}.pcn input{width:120px}
h1 .jwb{margin:0 0 0 auto;background:#fff;color:#2F5D50;border:0;font-weight:700;padding:2px 8px}h1 .jwb.on{background:#2F5D50;color:#fff}`;
const pcBarHtml = () => `<div class="c pcn" id="pcbar">🖥 이 PC: <b id="pcn">…</b> <span class="k" id="pcs"></span> <button id="pcb">바꾸기</button><span id="pce" style="display:none"><input id="pci" maxlength="40"> <button class="p" id="pcv">저장</button></span>
<button class="ib" type="button" title="설명">ⓘ</button><div class="ibt k" hidden>이 이름으로 웹앱 기기 표·기록에 보임 · 웹앱 기기 이름에서 저절로 받고, 여기서 바꾸면 웹앱이 덮지 않음</div></div>`;
/* 이 PC 이름 칸 스크립트(상태 창·비교 화면 같이) — H(머리)·post 함수가 있는 곳에 끼움 */
const PC_JS = `function autoLine(s){const a=s.auto||{},rl=s.relay||{};if(!a.on)return '<span class="wa">자동 읽기 멈춤</span> <span class="k">'+String(a.msg||(s.on?'':'번외 수집 꺼짐')).replace(/[&<>]/g,'')+'</span>';const nx=a.nextMs!=null?Math.ceil(a.nextMs/1000):null;return '<span class="ok">'+(/도는 중/.test(a.msg||'')?'자동으로 도는 중':'자동')+'</span> · 오늘 '+(a.dayN||0)+'/'+(a.dayCap||0)+'장'+(nx!=null?' · 다음 읽기 '+(nx>=120?Math.round(nx/60)+'분':nx+'초')+' 뒤':'')+' · 마지막 기록 '+(rl.ackAt?Math.max(0,Math.round((Date.now()-rl.ackAt)/60000))+'분 전':'아직')+' · 표본 '+(a.left||0)+'/'+(a.poolN||0)+'권 남음'+(a.lap?' · '+a.lap.n+'바퀴 '+(a.lap.read||0)+'권 읽음':'')+(a.msg&&!/도는 중/.test(a.msg)?'<br><span class="k">'+String(a.msg).replace(/[&<>]/g,'')+'</span>':'')}
function pcShow(s){const n=document.getElementById('pcn');if(!n)return;n.textContent=s.pc||'—';document.getElementById('pcs').textContent=s.pcSrc==='pc'?'(여기서 바꾼 이름)':s.pcSrc==='web'?'(웹앱 기기 이름에서)':'(윈도우 이름 · 웹앱을 열면 기기 이름으로 바뀜)'}
document.getElementById('pcb').onclick=()=>{const e=document.getElementById('pce');e.style.display=e.style.display==='none'?'':'none';document.getElementById('pci').value=document.getElementById('pcn').textContent.replace(/^—$/,'')};
document.getElementById('pcv').onclick=async()=>{const v=document.getElementById('pci').value.trim();if(!v)return;const r=await fetch('/cfg',{method:'POST',headers:{'X-RN-Col2':'1','Content-Type':'application/json'},body:JSON.stringify({pc:v,pcSrc:'pc'})});const s=await r.json();pcShow(s);document.getElementById('pce').style.display='none'};`;
/* (0.1.6) 📜 기록창 붙이기 — 옆 창(🗒 단추 · Alt+L)과 따로 창(/log) 같이 · 기기 저장은 Col2Store.ls(rn3-) */
const LOG_BOOT = (full) => `<script src="/s/col2-store.js"></script><script src="/s/col2-logwin.js"></script>${full ? '<script src="/s/col2-ui.js"></script>' : ''}<script>(function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};
async function api(m,p,b,text){const r=await fetch(p,{method:m,headers:H,cache:'no-store',body:b?JSON.stringify(b):undefined});return text?r.text():r.json()}
${full ? 'Col2UI.loadKeys(api);' : ''}window.__jw=Col2Log.mount({api,ls:Col2Store.ls,full:${full ? 'true' : 'false'},btn:document.getElementById('jwBtn'),match:window.Col2UI&&Col2UI.logMatch,label:window.Col2UI&&Col2UI.keyLabel,mode:window.Col2UI&&Col2UI.logMode});
${full ? `let last='';setInterval(()=>{const v={p:'log',x:screenX,y:screenY,w:outerWidth,h:outerHeight};const k=JSON.stringify(v);if(k!==last&&v.w>200&&v.h>150){last=k;fetch('/win/hrect',{method:'POST',headers:H,body:k}).catch(()=>{})}},15000);const id=Math.random().toString(36).slice(2,10)+Date.now().toString(36);const beat=()=>fetch('/win/log',{method:'POST',headers:H,body:JSON.stringify({act:'beat',id,vis:document.visibilityState,x:screenX,y:screenY,w:outerWidth,h:outerHeight})}).catch(()=>{});beat();setInterval(beat,3000);document.addEventListener('visibilitychange',beat);addEventListener('pagehide',()=>{try{fetch('/win/log',{method:'POST',headers:H,keepalive:true,body:JSON.stringify({act:'bye',id})})}catch(e){}});` : ''}})();</script>`;
function logPageHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>📜 번외 수집 기록</title>
<style>${SMALL_CSS}</style><body>${LOG_BOOT(true)}</body></html>`; }
/* (0.1.7 정범님 11/09 밤 '모든 것을 내가 설정·조정하는 골격 · 접고 열고 · 아이콘으로 최소화 · 불편·중복 추리기') 📊 옆 창 = 머리띠 + 칸(카드)
 *  칸 내용 HTML은 여기 · 다룸(순서·숨김·접기·작게·단축키·설정·설명서·바로 가기)은 col2-ui.js · 새 기능은 <details class="c card" data-card="이름"> 하나 + col2-ui.js CARDS 한 줄
 *  0.1.6까지 있던 것은 지우지 않음 — 쓸모 적은 칸은 처음엔 숨김(⚙ 설정 › 칸에서 다시 켬) · 무엇을 왜는 README '0.1.7' 표 */
function statusHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>📊 번외 수집기</title>
<style>${SMALL_CSS}</style>
<h1 id="hd"><span id="hdT">📊 <small id="hdP">🖥 이 PC: …</small></span><button id="jwBtn" class="jwb" title="🗒 기록창 열기 (Alt+L)">🗒 기록</button><button id="helpBtn" class="jwb" title="❓ 설명서">❓</button><button id="setBtn" class="jwb" title="⚙ 설정">⚙</button><button id="miniBtn" class="jwb" title="▁ 작은 단추로 줄이기">▁</button></h1>
<div class="b" id="top"><section class="gl" id="glance" aria-label="한눈에">
<div class="gl1"><span class="gdot" id="glDot"></span><b id="glPc">이 PC</b><span class="k" id="glKind"></span><span class="glsp"></span><span class="k" id="glVer">col2 ${VERSION}</span></div>
<div class="glch" id="glCh"><span class="ch" data-s="al" title="알라딘">알라딘 <i>—</i></span><span class="ch" data-s="y24" title="예스24 판매관리">예스24 <i>—</i></span><span class="ch" data-s="nv" title="네이버" hidden>네이버 <i>—</i></span></div>
<div class="glbar" id="glBarBox" title="알라딘 공개 화면 오늘 읽은 장 수 / 하루 한도(⚙ 자세히 › 📏 한도·속도에서 바꿈)"><div class="glt"><span>오늘 읽음</span><b id="glN">— / —</b></div><div class="bar"><i id="glBar"></i></div></div>
<div class="glnow" id="glNow">읽는 중…</div>
<div class="glerr" id="glErr" hidden><div class="glet"><b id="glErrW"></b><span id="glErrT"></span></div><button class="p" id="glFix">고치기</button></div>
<div class="front" id="front"><button id="fLogin" type="button">🔐 로그인</button><button id="fRead" type="button" class="p">▶ 지금 읽기</button><button id="fPause" type="button">⏸ 잠깐 멈춤</button><button id="fMore" type="button">⚙ 자세히</button></div>
</section></div>
<div class="b" id="cards">
<details class="c card" data-card="now"><summary>▶ 자세한 상태 <span class="cs"></span></summary><div id="stop"></div><div id="st">읽는 중…</div><button class="p" id="onb">켜기</button> <span class="k">col2 ${VERSION} · 시험 환경(운영과 따로)</span></details>
<details class="c card" data-card="y24" open><summary>🟦 예스24 판매관리 읽기 <span class="cs"></span></summary><div class="k">화면을 열지 않음 · 숨은 크롬</div><div id="y24">—</div><div id="y24b"></div></details>
<details class="c card" data-card="go" open><summary>🔗 바로 가기 <span class="cs"></span></summary><div id="gobox"></div></details>
<details class="c card" data-card="al" open><summary>🟧 알라딘 샵매니저 읽기(그림자) <span class="cs"></span></summary><div class="k">읽기만 · 화면을 열지 않음 · 숨은 크롬 · 기본 꺼짐</div><div id="al">—</div><div id="alb"></div></details>
<details class="c card" data-card="reads"><summary>📥 최근 그림자 읽기 <span class="cs"></span></summary><div id="rd" class="ln">—</div></details>
<details class="c card" data-card="work"><summary>🪟 숨은 작업 창·점검 <span class="cs"></span></summary><div id="wk" class="k">—</div><button data-a="show">🪟 보이기</button><button data-a="hide">🙈 숨기기</button><button data-a="reopen">↻ 다시 열기</button><button data-a="app?p=compare">🔎 비교 화면</button><div class="k">점검할 때만 — 일은 저절로 돕니다(비교 화면은 손으로 몇 권 시험할 때)</div></details>
<details class="c card" data-card="tail"><summary>🧾 도우미 글 끝 <span class="cs"></span></summary><div id="ln" class="ln">—</div></details>
<details class="c card" data-card="rect"><summary>📐 창 자리·크기 숫자 <span class="k">(x · y · 폭 · 높이)</span></summary>
<div style="margin-top:4px">🪟 작업 창(보일 때)<br><input class="n" id="wx"> <input class="n" id="wy"> <input class="n" id="ww"> <input class="n" id="wh"> <button data-s="win">저장</button></div>
<div>📊 이 창<br><input class="n" id="hx"> <input class="n" id="hy"> <input class="n" id="hw"> <input class="n" id="hh"> <button data-s="hwin">저장</button></div>
<div class="k">작업 창을 보이게 한 뒤 옮기거나 크기를 바꾸고 🙈 숨기기를 누르면 그 자리·크기가 저장됩니다 · 이 창은 옮기면 저절로 저장</div></details>
</div><div id="m" class="k b" style="min-height:1.4em;padding-top:0"></div>
<button id="miniIc" title="눌러서 펼치기"><span class="dot"></span>📊<small></small></button>
<div id="ovSet" class="ov2"><div class="oh"><b>⚙ 자세히 — 설정</b><button data-ovx="set">닫기</button></div><div class="obody"><div id="setm" class="k" style="min-height:1.3em"></div>
<div class="gh">⭐ 자주 바꾸는 것</div><div id="setOften" class="sgrid"></div>
<details class="grp" data-grp="cred"><summary>🔐 계정·다시 로그인 <span class="k">이 PC만</span></summary><div id="crbox"><div class="k" style="margin-bottom:4px">아이디·비밀번호는 이 PC 안에만 잠가 둠 · [확인하고 저장]은 먼저 실제로 로그인해 보고 맞을 때만 저장 <button class="ib" type="button" title="자세한 설명">ⓘ</button></div><div class="k ibt" hidden>아이디·비밀번호는 이 PC 안 Windows 잠금(DPAPI · 이 PC 이 사용자만 풂) 파일에만 — GitHub·Firebase·기록·화면 어디에도 나가지 않음 · 출고 중엔 미룸 · 한 시간 3번까지 · 연속 2번 실패하거나 보안 문자·2단계 인증이 나오면 멈추고 알림 · 알라딘은 번외 자리를 받은 때만 · <b>[확인하고 저장]을 누르면 먼저 이 PC에서 실제로 로그인해 보고 맞을 때만 저장</b>(틀리면 저장하지 않고 다시 넣어 달라는 까닭 · 보안 문자·2단계 인증이면 그 사실 · 예스24는 세션이 살아 있으면 따로 된 임시 창에서 해 봐서 지금 세션을 건드리지 않음 · 알라딘은 세션이 풀렸을 때만 실제로 확인 — <b>알라딘이 지금 로그인돼 있으면 확인하지 않고 잠가 저장</b>(로그인을 하나 더 하면 다른 PC가 끊길 수 있어서 · 다음에 로그인이 풀려 다시 로그인할 때 이 값으로 확인하고 틀리면 ⛔ 알림) · 🏠가 꺼져 있으면 🏠를 켜야 확인됨 · 확인을 끝내지 못하면(시간 넘음 등) 까닭과 [그래도 잠가 저장](두 번 누르기))</div><div class="row cr" data-pf="y24"><b>🟦 예스24 판매관리</b> <span class="k" id="crs_y24">—</span><br><div id="crbadge_y24" class="crbadge" style="display:none"></div><span id="crin_y24"><input id="cri_y24" placeholder="아이디" autocomplete="off" spellcheck="false" style="width:9em"> <input id="crp_y24" type="password" placeholder="비밀번호" autocomplete="new-password" style="width:9em"> <button id="crb_y24">확인하고 저장</button> <button id="crx_y24" class="g" style="display:none" title="바꾸지 않고 닫기 — 저장된 값은 그대로">취소</button></span> <button id="crf_y24" class="warn" style="display:none" title="확인을 끝내지 못했을 때만(사이트가 틀렸다고 한 값은 안 됨) — 확인 없이 잠가 저장 · 다음 다시 로그인 때 확인하고 틀리면 ⛔ 알림">그래도 잠가 저장</button><div id="crm_y24" class="k" style="min-height:1.2em;white-space:normal"></div><label><input type="checkbox" id="cra_y24"> 세션이 풀리면 스스로 다시 로그인</label> <button id="crr_y24" style="display:none">다시 해 보기</button></div><div class="row cr" data-pf="al"><b>🟧 알라딘 샵매니저</b> <span class="k" id="crs_al">—</span><br><div id="crbadge_al" class="crbadge" style="display:none"></div><span id="crin_al"><input id="cri_al" placeholder="아이디" autocomplete="off" spellcheck="false" style="width:9em"> <input id="crp_al" type="password" placeholder="비밀번호" autocomplete="new-password" style="width:9em"> <button id="crb_al">확인하고 저장</button> <button id="crx_al" class="g" style="display:none" title="바꾸지 않고 닫기 — 저장된 값은 그대로">취소</button></span> <button id="crf_al" class="warn" style="display:none" title="확인을 끝내지 못했을 때만(사이트가 틀렸다고 한 값은 안 됨) — 확인 없이 잠가 저장 · 다음 다시 로그인 때 확인하고 틀리면 ⛔ 알림">그래도 잠가 저장</button><div id="crm_al" class="k" style="min-height:1.2em;white-space:normal"></div><label><input type="checkbox" id="cra_al"> 세션이 풀리면 스스로 다시 로그인</label> <button id="crr_al" style="display:none">다시 해 보기</button></div></div>
</details>
<details class="grp" data-grp="jobs"><summary>🧩 일 켜기·끄기 <span class="k">이 PC만</span></summary><div id="tgbox"><div id="tgy"><div id="ownbox" style="border:1px solid var(--warn);background:var(--warnSoft);border-radius:var(--r);padding:6px 8px;margin:2px 0 8px"><label title="켜면 이 PC의 운영 수집기(Tampermonkey)는 알라딘 로그인 자리를 놓고 로그인 일·샵매니저 작업 창 다시 열기를 하지 않음 · 그 자리를 번외가 받음(번외가 30분 넘게 안 보이면 운영이 저절로 되찾음)" style="font-weight:700;font-size:13.5px"><input type="checkbox" id="tg_alown" style="transform:scale(1.15);margin-right:6px"><span style="font-size:16px;vertical-align:-2px">🏠</span> 켜기 — 이 PC 알라딘 로그인 자리를 번외가 이어받음</label><button class="ib" type="button" title="설명">ⓘ</button><div class="k ibt" id="ownk" hidden style="margin-top:3px">켜면: 이 PC의 운영 수집기는 알라딘 로그인 일·샵매니저 작업 창 다시 열기를 멈추고, 번외가 그 자리로 알라딘 샵매니저 읽기를 맡음(알라딘 읽기도 함께 켜짐 · 번외가 30분 넘게 안 보이면 운영이 저절로 되찾음)</div></div><label><input type="checkbox" id="tg_y24"> 🟦 예스24 판매관리 읽기</label><br><label><input type="checkbox" id="tg_al"> 🟧 알라딘 샵매니저 읽기(그림자 · 읽기만)</label><br><label><input type="checkbox" id="tg_y24j"> 🤖 예스24 맡긴 일(주문접수확인·발송처리)도 여기서</label></div><label><input type="checkbox" id="tg_side"> 📊 켜질 때 이 옆 창 저절로 띄우기</label></div></details>
<details class="grp" data-grp="limit"><summary>📏 한도·속도 <span class="k">모든 PC 같음</span></summary><div id="setG_limit" class="sgrid">…</div></details>
<details class="grp" data-grp="time"><summary>⏰ 주기·시간대 <span class="k">모든 PC 같음</span></summary><div id="setG_time" class="sgrid">…</div></details>
<details class="grp" data-grp="pc"><summary>🖥 이 PC 이름·화면 <span class="k">칸·단축키·창</span></summary><h3>이 PC 이름</h3>${pcBarHtml()}
<h3>칸 — 보이기 · 처음 펼침 · 순서</h3><div id="setAll"><button data-all="open">모두 펼치기</button><button data-all="close">모두 접기</button></div><div id="setCards"></div>
<h3>단축키 — 키 단추를 누르고 원하는 키를 누름</h3><div id="setKeys"></div>
<h3>창 · 바로 가기</h3><div id="setWin"></div></details>
<details class="grp" data-grp="io"><summary>📦 내보내기·가져오기·기본값</summary><button id="setExp">⤓ 설정 내보내기</button> <label class="k">⤒ 가져올 파일 <input type="file" id="setImpF" accept=".json,application/json" style="max-width:150px"></label> <button id="setImp" class="p" style="display:none">가져오기</button>
<div style="margin-top:6px"><button id="setReset" class="warn">↺ 화면 기본값</button> <span class="k">칸·단축키·창만 — 일 켜기·이 PC 이름·한도는 그대로(한도는 줄마다 ↺)</span></div></details>
<details class="grp" data-grp="log"><summary>🕘 바꾼 기록 <span class="k">누가 · 언제</span></summary><div id="setLog" class="k">…</div></details>
</div></div>
<div id="ovHelp" class="ov2"><div class="oh"><b>❓ 번외 수집기 설명서</b><button data-ovx="help">닫기</button></div><div class="obody" id="helpBody"></div></div>
<script src="/s/col2-store.js"></script><script src="/s/col2-settings.js"></script><script src="/s/col2-logwin.js"></script><script src="/s/col2-go.js"></script><script src="/s/col2-help.js"></script><script src="/s/col2-ui.js"></script>
<script>(function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};
${PC_JS}
window.pcShow=pcShow;window.autoLine=autoLine;
async function api(m,p,b){const r=await fetch(p,{method:m,headers:H,cache:'no-store',body:b?JSON.stringify(b):undefined});return r.json()}
window.__side=Col2UI.side({api,ls:Col2Store.ls,ver:'${VERSION}'});})();</script>${LOG_BOOT(false)}</html>`; }
/* (0.1.7) ❓ 설명서 따로 주소 /help — 옆 창 겹창과 같은 글 */
function helpPageHtml() { return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>❓ 번외 수집기 설명서</title>
<style>${SMALL_CSS}</style><h1>❓ 번외 수집기 설명서 <small>col2 ${VERSION}</small></h1><div class="b" id="helpBody">읽는 중…</div>
<script src="/s/col2-help.js"></script><script src="/s/col2-ui.js"></script><script>(async function(){const H={'X-RN-Col2':'1','Content-Type':'application/json'};const g=async(p)=>(await fetch(p,{headers:H,cache:'no-store'})).json();
let ui={},kind='office';try{ui=(await g('/ui')).ui;kind=(await g('/status')).kind||'office'}catch(e){}const n=Col2UI.normalize(ui);const B=document.getElementById('helpBody');B.innerHTML=Col2Help.html({kind,keys:n.keys,actions:Col2UI.ACTIONS,cards:Col2UI.CARDS,ver:'${VERSION}'});
B.querySelectorAll('[data-go]').forEach((b)=>b.onclick=async()=>{const r=await fetch('/go',{method:'POST',headers:H,body:JSON.stringify({id:b.dataset.go})});const j=await r.json();b.title=(j.ok?'✓ ':'✗ ')+(j.msg||j.err||'')});
B.querySelectorAll('[data-hj]').forEach((a)=>a.onclick=(e)=>{e.preventDefault();const t=document.getElementById(a.dataset.hj);if(t){t.open=true;t.scrollIntoView()}})})();</script></html>`; }

/* (0.1.7) ⚙ 설정(PC마다 col2.json ui) · 🔗 바로 가기(평소 크롬) · ▁ 작은 단추 */
const uiNow = () => UIC.normalize(CFG.ui);
function uiSet(o) { if (o.reset) { const m = uiNow().mini; CFG.ui = { ...UIC.normalize({}), mini: m, at: now() }; saveCfg(); note('⚙ 옆 창 설정을 기본값으로(칸·단축키·창)', { k: 'sys', m: '설정' }); return { code: 200, body: { ok: true, ui: uiNow() } }; }
  const n = UIC.normalize(o.ui); const ck = UIC.check(n.keys); if (!ck.ok) return { code: 400, body: { ok: false, err: '단축키가 겹치거나 못 쓰는 키', errs: ck.errs } };
  const was = JSON.stringify({ ...uiNow(), at: 0 }); n.at = num(n.at, 1, 9e15, now()); CFG.ui = n; saveCfg(); if (JSON.stringify({ ...n, at: 0 }) !== was && !o.quiet) log('⚙ 옆 창 설정 저장'); return { code: 200, body: { ok: true, ui: n } }; }
function goOpen(o) { const kind = isLoggerPc() ? 'logger' : 'office'; const r = GO.urlOf(String(o.id || ''), o.q, kind); if (r.err) { if (r.logger) note('🔗 바로 가기 거절 — 로거 PC는 우리 숍·계정 화면을 열지 않음(약속 0)', { k: 'sys', l: 'warn', m: '바로 가기' }); return { code: r.logger ? 403 : 404, body: { ok: false, err: r.err } }; }
  const prof = uiNow().goProf; const args = GO.chromeArgs(r.url, prof); /* 평소 크롬 — 데이터 폴더(--user-data-dir)·조종 길을 붙이지 않음 = 정범님이 로그인해 둔 그 크롬에 새 탭 */
  if (TEST) { try { fs.appendFileSync(path.join(HOME, 'go.log'), JSON.stringify({ at: now(), args }) + '\n'); } catch (e) {} }
  else { const ch = chromeExe(); if (!ch) return { code: 500, body: { ok: false, err: '크롬을 못 찾음' } }; try { const pr = require('child_process').spawn(ch, args, { detached: true, stdio: 'ignore' }); pr.on('error', () => {}); pr.unref(); } catch (e) { return { code: 500, body: { ok: false, err: e.message } }; } }
  note(`🔗 바로 가기 — ${r.link.t}${r.q ? ' · 찾기' : ''} → 평소 크롬`, { k: 'sys', m: '바로 가기' }); return { code: 200, body: { ok: true, msg: `평소 크롬${prof ? '(' + prof + ')' : ''}에 새 탭으로 엶 — ${r.link.t}` } }; }
async function miniWin(o) { const on = o.on === true; const u = uiNow(); u.mini = on; u.at = now(); CFG.ui = u; saveCfg();
  const f = await WIN.run('find', STAT_MARK); if (!f.ok) return { ok: false, err: f.err }; if (!f.n) return { ok: false, err: '옆 창이 작은 앱 창이 아님(주소창 탭) — 화면만 작게 바꿈' }; const it = f.list[0] || {};
  if (on) { if (it.r && it.r.w >= 260 && it.r.h >= 200) { CFG.hwin = { ...it.r, at: now(), src: 'pc' }; saveCfg(); } const w = num(o.w, 60, 400, UIC.MINI.w), h = num(o.h, 40, 400, UIC.MINI.h); const b = it.r || { x: 0, y: 0, w: D.appW };
    const r = await WIN.run('show', STAT_MARK, { x: b.x + b.w - w, y: b.y, w, h, top: o.top !== false }); note(`▁ 옆 창을 작은 단추로(${w}×${h}${o.top !== false ? ' · 늘 위' : ''}) — ${String(o.why || '').slice(0, 30)}`, { k: 'win', l: 'detail', m: '옆 창' }); return r.ok ? { ok: true, msg: '작은 단추로 줄임' } : r; }
  const rc = appRect(rectOk(CFG.hwin, 260, 200), f); const r = await WIN.run('show', STAT_MARK, rc.x != null ? rc : {}); note('▁ 옆 창을 원래 자리·크기로 — ' + String(o.why || '').slice(0, 30), { k: 'win', l: 'detail', m: '옆 창' }); return r.ok ? { ok: true, msg: '원래 자리·크기로' + (rc.x != null ? ` (${rc.x},${rc.y} · ${rc.w}×${rc.h})` : '') } : r; }

/* ── 듣는 길 ── */
function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); }
const OK_ORG = (o) => o === `http://127.0.0.1:${PORT}` || o === `http://localhost:${PORT}` || o === COL2.WEB_ORIGIN || (Array.isArray(COL2.WEB_ORIGINS) && COL2.WEB_ORIGINS.includes(o)) || /^chrome-extension:\/\//i.test(o); /* (0.1.19) readnow.kr도 */
const STATIC = { 'col2-config.js': path.join(ROOT, 'col2-config.js') }; for (const f of ['col2-store.js', 'col2-compare-core.js', 'col2-compare.js', 'col2-tasks.js', 'col2-jobview.js']) STATIC[f] = path.join(ROOT, 'shadow', f); for (const f of ['col2-logwin.js', 'col2-ui.js', 'col2-go.js', 'col2-help.js', 'col2-settings.js']) STATIC[f] = path.join(__dirname, f);
const srv = http.createServer((req, res) => {
  const host = String(req.headers.host || ''); if (!new RegExp(`^(127\\.0\\.0\\.1|localhost):${PORT}$`).test(host)) { res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end('{"ok":false,"err":"이 PC 안에서만"}'); }
  const org = req.headers.origin || ''; const u = new URL(req.url, 'http://127.0.0.1');
  const H = { 'Cache-Control': 'no-store', ...(org && OK_ORG(org) ? { 'Access-Control-Allow-Origin': org, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, X-RN-Col2', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Private-Network': 'true' } : {}) };
  const J = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', ...H }); res.end(JSON.stringify(o)); };
  if (org && !OK_ORG(org)) { const r0 = WEB.rej; WEB.rej = { org: String(org).slice(0, 80), at: now(), n: (r0 && r0.org === String(org).slice(0, 80) ? r0.n : 0) + 1, path: u.pathname.slice(0, 40) }; if (now() - WEB.rejNoteAt > 10 * 60e3) { WEB.rejNoteAt = now(); note(`⛔ 우리 웹앱 주소가 아닌 곳의 부름을 막음 — ${webHost(org)} (${u.pathname.slice(0, 40)}) · 받는 주소: ${(COL2.WEB_ORIGINS || [COL2.WEB_ORIGIN]).map(webHost).join(' · ')}`, { k: 'sys', l: 'warn', m: '웹앱' }); } return J(403, { ok: false, err: '이 PC의 번외 화면·웹앱만' }); } /* 알라딘 화면·다른 웹 페이지는 못 부름 */
  if (org && (COL2.WEB_ORIGINS || [COL2.WEB_ORIGIN]).includes(org) && req.method !== 'OPTIONS') { WEB.at = now(); WEB.org = org; WEB.path = u.pathname.slice(0, 40); } /* (11/11 seatfix1) 🌐 이 PC 웹앱 소식(주소·마지막 시각) */
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/compare' || u.pathname === '/log' || u.pathname === '/help')) { if (org) return J(403, { ok: false, err: '이 PC 주소창·앱 창에서만' });
    const html = u.pathname === '/' ? statusHtml() : u.pathname === '/log' ? logPageHtml() : u.pathname === '/help' ? helpPageHtml() : fs.readFileSync(path.join(ROOT, 'shadow', 'compare.html'), 'utf8').replace('<!--PCBAR-->', pcBarHtml() + `<script>(function(){${PC_JS}window.__pcShow=pcShow;window.autoLine=autoLine})();</script>`).replace('/*SMALL_CSS*/', SMALL_CSS); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(html); }
  if (req.method === 'GET' && u.pathname.startsWith('/s/')) { const f = STATIC[u.pathname.slice(3)]; if (!f) return J(404, { ok: false }); res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(f)); }
  if (req.headers['x-rn-col2'] !== '1') return J(403, { ok: false, err: 'X-RN-Col2 머리가 없음' });
  if (u.pathname === '/status' && req.method === 'GET') return J(200, status());
  if (u.pathname === '/jobs' && req.method === 'GET') return J(200, { ok: true, ...JOBS.view(), core: { lift: CORE.lift || null, ext: CORE.ext ? CORE.ext.VERSION : null, moreErr: CORE.moreErr || null } }); /* (0.1.9) 그림자 일 목록·오늘 셈 */
  if (u.pathname === '/ui' && req.method === 'GET') { const n = uiNow(); return J(200, { ok: true, ui: n, errs: UIC.check(n.keys).errs, kind: isLoggerPc() ? 'logger' : 'office' }); }
  /* (0.1.6) 📜 기록창 — 새 줄(차례 after 뒤) · 날짜 목록 · 그날 줄 · 모두 글로(내려받기) */
  if (u.pathname === '/log/lines' && req.method === 'GET') return J(200, { ok: true, boot: BOOT, lines: JRN.since(u.searchParams.get('after'), u.searchParams.get('n')), kind: JRN.kind(), pc: CFG.pc || os.hostname(), today: new Date(now() + 9 * 3600e3).toISOString().slice(0, 10), rounds: JRN.rounds(6), state: status() });
  if (u.pathname === '/log/days' && req.method === 'GET') return J(200, { ok: true, days: JRN.days() });
  if (u.pathname === '/log/day' && req.method === 'GET') return J(200, { ok: true, lines: JRN.day(u.searchParams.get('d')) });
  if (u.pathname === '/log/all' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', ...H }); return res.end(JRN.allText()); }
  if (u.pathname === '/y24/reg/state' && req.method === 'GET') return J(200, Y24.reg.state()); /* (11/10 y24auto) 🟦 예스24 자동 올림 — 맡김·결과(웹앱이 받아 장부에 적음) */
  if (u.pathname === '/y24/w/state' && req.method === 'GET') return J(200, Y24.w.state()); /* (11/11 y24w) 🟦 예스24 쓰기(수량·판매중지) — 맡김·결과(웹앱 🛠 처리할 일이 받아 줄에 보임) */
  if (u.pathname === '/nv/st' && req.method === 'GET') return J(200, { ok: true, ver: VERSION, pc: CFG.pc || os.hostname(), nv: NV.sum() }); /* (0.1.22) 🟩 네이버 — 상태만(시크릿·토큰 없음 · 공개 열쇠는 있음) */
  if (u.pathname === '/settings' && req.method === 'GET') { const ex = Object.keys((CFG.shared || {}).v || {}).concat(SITE.state().sites.map((x) => 'siteCfg.' + x.src + '.dayCap'), SITE.state().sites.map((x) => 'siteCfg.' + x.src + '.gapMs')).filter((k, i, a) => SETM.SITE_RE.test(k) && a.indexOf(k) === i); return J(200, { ok: true, groups: SETM.GROUPS, rows: SET.rows(ex), shared: { at: SET.sharedAt(), by: (CFG.shared || {}).by || '' }, pend: Object.keys(SET.pend() || {}).length, log: SET.log(), kind: isLoggerPc() ? 'logger' : 'office' }); }
  if (u.pathname === '/relay/pending' && req.method === 'GET') return J(200, relayPending(u.searchParams.get('by'), org, u.searchParams.get('v')));
  if (u.pathname === '/web/hello' && req.method === 'GET') { WEB.helloAt = now(); WEB.helloOrg = org; const v = String(u.searchParams.get('v') || ''); WEB.helloVer = /^[\d.]{1,20}$/.test(v) ? v : ''; return J(200, { ok: true, ver: VERSION }); } /* (11/11 seatfix1) 구글 로그인 전 웹앱 — 판·주소만 */
  if (req.method !== 'POST') return J(405, { ok: false });
  const body = (cb, max) => readBody(req, max || 256 * 1024, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}') || {}; } catch (x) { return J(400, { ok: false, err: 'bad json' }); } Promise.resolve().then(() => cb(o)).catch((er) => J(500, { ok: false, err: er.message })); });
  const act = (fn) => body((o) => fn(o.why || '').then((r) => J(200, { ...r, state: status() })));
  const p = u.pathname;
  if (p === '/cfg') return body((o) => { setCfg(o); J(200, status()); });
  if (p === '/set') return body((o) => { const by = `${CFG.pc || os.hostname()} 옆 창`; const L = Array.isArray(o.list) ? o.list.slice(0, 40) : [{ k: o.k, v: o.v }]; const out = []; for (const x of L) { const k = String(x && x.k || ''); const row = SETM.rowOf(k); let r; if (row && row.sc === 'pc') { const ck = SETM.check(k, x.v); if (!ck.ok || ck.reset) r = { ok: false, err: `${row.t} — ${ck.ok ? '켬·끔만' : ck.err}` }; else { const from = SET.effOf(k); setCfg({ [k]: ck.v, src: 'pc' }); SET.logPc(k, from, by); r = { ok: true, k, v: SET.effOf(k), from, sc: 'pc' }; } } else r = SET.set(k, x ? x.v : undefined, by); out.push(r); if (!r.ok) break; }
    autoKick(); const bad = out.find((r) => !r.ok); J(bad ? 400 : 200, { ok: !bad, err: bad ? bad.err : null, res: out }); }); /* (11/11) ⚙ 설정 하나(또는 여럿) 바꾸기 — 범위 검사 · 바로 반영 · 기록 */
  if (p === '/pause') return body((o) => J(200, { ...pauseSet(o.min, '옆 창'), state: status() })); /* (11/11) ⏸ 잠깐 멈춤 */
  if (p === '/read/now') return body(() => { if (!CFG.on) return J(200, { ok: false, err: '번외 수집이 꺼져 있음 — 먼저 켜 주세요' }); AU.nextAt = 0; autoKick(); try { Y24.kick(200); } catch (e) {} note('▶ 지금 읽기 — 옆 창 단추'); J(200, { ok: true, msg: '지금 읽기를 시작함(속도 규칙은 그대로)' }); });
  if (p === '/ui') return body((o) => { const r = uiSet(o); J(r.code, r.body); });
  if (p === '/go') return body((o) => { const r = goOpen(o); J(r.code, r.body); });
  if (p === '/win/mini') return body((o) => miniWin(o).then((r) => J(200, r)));
  if (p === '/log/clear') return body((o) => { const r = JRN.clear(); note(`📜 기록을 내려받고 화면에서 비움(${r.moved}일치 · 파일은 지우지 않고 journal\\old 로 옮김) — ${String(o.why || '').slice(0, 40)}`, { k: 'sys', l: 'ok', m: '기록' }); J(200, r); });
  if (p === '/win/log') return body((o) => logWin(o.act, o.why || '', o).then((r) => J(200, r))); /* (0.1.8) 📜 기록창 따로 창 열기·앞으로·닫기 */
  if (p === '/win/app') return body((o) => appWin(String(u.searchParams.get('p') || o.p || 'compare'), o.why || '').then((r) => J(200, { ...r, state: status() })));
  if (p === '/relay/get') return body((o) => { const r = relayGet(o); J(r.code, r.body); });
  if (p === '/relay/sample') return body((o) => J(200, relaySample(o)));
  if (p === '/relay/put') return body((o) => { const r = relayPut(o); J(r.code, r.body); });
  if (p === '/relay/answer') return body((o) => { const r = relayAnswer(o); if (AU.pool.length && (r.n || !o.handoff)) autoKick(); J(200, r); }, 24 * 1048576); /* (11/11 col2rep2) 넘김 상태만 온 답은 자동 읽기를 다시 깨우지 않음(자주 오면 차례가 밀려 멈춤) */ /* 표본 목록(1,000권)이 커서 넉넉히 */
  if (p === '/relay/ack') return body((o) => J(200, relayAck(o)));
  if (p === '/lg/books') return body((o) => { const r = lgBooks(o); if (r.code === 200 && r.body.n) autoKick(); J(r.code, r.body); }); /* (11/11 col2rep2) 🛰 로거 운영 수집기 다리만 */
  if (p === '/relay/keys') return body((o) => { const r = keysPut(o, org); J(r.code, r.body); }); /* (0.1.10) 🔑 운영 키(메모리로만) */
  if (p === '/win/show') return act(show); if (p === '/win/hide') return act(hide); if (p === '/win/reopen') return act(reopen); if (p === '/win/status-open') return act(statusWin);
  if (p === '/win/rect') return body((o) => { const out = []; for (const k of ['win', 'hwin']) { const r = rectOk(o[k], k === 'win' ? 400 : 260, k === 'win' ? 300 : 200); if (o[k] && !r) return J(400, { ok: false, err: '자리·크기가 이상함(작업 창은 폭 400·높이 300 이상)' }); if (r) { CFG[k] = { ...r, at: now(), src: 'pc' }; out.push(`${k === 'win' ? '작업 창' : '상태 창'} ${r.x},${r.y} · ${r.w}×${r.h}`); } } saveCfg(); note('자리·크기 저장 — ' + out.join(' / ')); J(200, { ok: true, msg: out.join(' / '), state: status() }); });
  if (p === '/win/hrect') return body((o) => { const key = o.p === 'compare' ? 'cwin' : o.p === 'log' ? 'lwin' : 'hwin'; if (key === 'hwin' && CFG.ui && CFG.ui.mini) return J(200, { ok: true, mini: true }); /* (0.1.7) 작은 단추일 땐 원래 크기를 덮지 않음 */ const r = rectOk(o, 260, 200); if (r) { const c = CFG[key] || {}; if (c.x !== r.x || c.y !== r.y || c.w !== r.w || c.h !== r.h) { CFG[key] = { ...r, at: now(), src: 'pc' }; saveCfg(); } } J(200, { ok: true }); }); /* 작은 창이 알린 자기 자리·크기(옮기면 다음에 그 자리) */
  /* (11/11 col2rep2 · 로거 번외 읽은 것 0의 큰 까닭) 로거 운영 수집기는 24시간 쉬지 않고 일함(시장 지표·벤치마킹) → 다리(c2busyTick)가 1분마다 '바쁨 180초'를 알려 로거 그림자 일이 한 번도 차례를 못 받음
   *  로거는 '운영 일을 하는 중'으로는 쉬지 않음(그림자는 한 장 4초 · 하루 몫 LOGGER.dayCap 따로) · 테더링 문이 닫혔다는 알림(테더링)만 쉼 · 사무실 PC는 그대로 */
  if (p === '/busy' && isLoggerPc()) return body((o) => { const sec = Math.max(0, Math.min(COL2.BUSY.maxSec, +o.sec || 0)); const why = String(o.why || '').slice(0, 80); if (sec && !/테더링/.test(why)) { if (!RL.lgBusyLog || now() - RL.lgBusyLog > 3600e3) { RL.lgBusyLog = now(); note(`🛰 로거 — 운영 일(${why}) 중이라는 알림은 쉼으로 보지 않음(로거 운영은 늘 일함 · 그림자는 따로 느리게)`, { k: 'rest', m: '그림자 일' }); } return J(200, { ok: true, busy: busyNow(), lgIgnore: true }); } BUSY.until = sec ? now() + sec * 1000 : 0; BUSY.why = why; if (sec) note(`로거 테더링 — ${sec}초 그림자 일 쉼(${why})`, { k: 'rest', m: '그림자 일' }); J(200, { ok: true, busy: busyNow() }); });
  if (p === '/busy') return body((o) => { const sec = Math.max(0, Math.min(COL2.BUSY.maxSec, +o.sec || 0)); BUSY.until = sec ? now() + sec * 1000 : 0; BUSY.why = String(o.why || '').slice(0, 80); if (sec) note(`운영이 바쁘다고 알림 — ${sec}초 그림자 일 쉼(${BUSY.why})`, { k: 'rest', m: '그림자 일' }); J(200, { ok: true, busy: busyNow() }); }); /* (0.1.9) 운영이 바쁠 때 쉼 */
  if (p === '/read/product') return body(async (o) => { const r = await readProduct(o); J(r.code, r.body); });
  /* (0.1.5) 🟦 예스24 — 수집기 다리(받기·보냄 확인·맡긴 일·출고 보호·웹앱 설정) · 로그인 한 번 · 지금 읽기 */
  /* (11/11 정범님 HOME '로그인 정보 기입 즉시 판단') 🪑 다리(운영 수집기)가 없을 때 — 웹앱이 계정 자리 문서를 트랜잭션 안에서 읽어 보내면, 운영 규칙(본체 글자 그대로)으로 이 PC 번외 자리('<PC>~col2')만 고칠 내용을 셈
   *  · 고칠 칸은 dev['<PC>~col2']·wait['<PC>~col2'] 둘뿐(다른 기기 칸은 건드리지 않음 · 웹앱도 한 번 더 확인) · 받기/놓기는 도우미 상태로 정함(웹앱이 보낸 값은 믿지 않음) */
  if (p === '/al/seatcalc') return body(async (o) => { const q = AL.seatAsk(); if (!q || String(o.who || '') !== q.who) return J(409, { ok: false, err: '이 PC 번외 자리 일이 아님' }); let R0; try { R0 = await loginRule(); } catch (e) { return J(503, { ok: false, err: '운영 로그인 규칙을 못 읽음: ' + e.message }); }
    const d = o.d && typeof o.d === 'object' ? o.d : {}; const r = seatDecide(R0, { dev: d.dev || {}, wait: d.wait || {}, cfg: d.cfg || {}, col2Off: !!d.col2Off }, q.who, !!q.want && !q.handover, !!q.own, Date.now()); J(200, { ok: true, ...r }); }, 262144);
  if (p === '/al/wseat') return body((o) => J(200, AL.wseat(o)), 16384);
  if (p === '/al/feed') return body((o) => J(200, { ...AL.feed(o, o.by), alw: { on: ALW.on() } }), 65536);
  if (p === '/al/wfeed') return body((o) => J(200, ALW.take(o)), 512 * 1024); /* (그림자 쓰기) 🟧✍ 운영 수집기가 보낸 쓰기 요청 꼴(번호·값만) — 견줌만 · 보내지 않음 */ /* (알라딘 읽기) 🟧 이 PC 수집기 다리 — 🪑 자리 · 🚚 출고 보호 · 운영 세션 풀림 */
  /* (11/10) 🔐 계정 저장·켜고 끄기·멈춤 풀기 — 이 도우미 화면(옆 창 ⚙)에서만(다른 출처 거절) · 값은 답·기록·상태 어디에도 싣지 않음 · 로거는 거절 */
  if (/^\/cred\//.test(p)) { const og = String(req.headers.origin || ''); if (og && og !== `http://127.0.0.1:${PORT}`) return J(403, { ok: false, err: '이 도우미 화면에서만' }); if (isLoggerPc()) return J(403, { ok: false, err: '로거 PC에는 계정을 저장하지 않습니다(약속 0)' });
    if (p === '/cred/save') return body((o) => credSave(o, J), 4096);
    if (p === '/cred/auto') return body((o) => { if (!CRED.PF[o.pf]) return J(400, { ok: false, err: '모르는 플랫폼' }); RLG.setAuto(String(o.pf), o.on !== false); J(200, { ok: true, relogin: RLG.sum() }); });
    if (p === '/cred/reset') return body((o) => { if (!CRED.PF[o.pf]) return J(400, { ok: false, err: '모르는 플랫폼' }); RLG.reset(String(o.pf)); (o.pf === 'y24' ? Y24 : AL).kick(300); J(200, { ok: true, relogin: RLG.sum() }); });
    return J(404, { ok: false }); }
  if (p === '/al/login') return body(async (o) => { const r = await AL.login(o.why || '옆 창 단추'); J(200, { ...r, state: status() }); });
  if (p === '/al/run') return body(async (o) => { const r = await AL.runNow(String(o.what || 'confirm')); J(200, { ...r, state: status() }); });
  if (p === '/y24/reg/put') return body((o) => { const r = Y24.reg.put(o); J(r.code, r.body); }, 4 * 1048576);
  if (p === '/y24/reg/ack') return body((o) => J(200, Y24.reg.ack(o.ids)));
  if (p === '/nv/cmd') return body((o) => NV.cmd(o).then((r) => J(200, { ...r, nv: NV.sum() })), 16384); /* (0.1.22) 🟩 네이버 명령(cred 봉투·test·sync·write·job·cats) — 로거 웹앱 대신 쓰기가 넘김 */
  if (p === '/nv/feed') return body((o) => J(200, NV.feed(o)), 262144);
  if (p === '/y24/w/put') return body((o) => { const r = Y24.w.put(o); J(r.code, r.body); }, 256 * 1024);
  if (p === '/y24/w/ack') return body((o) => J(200, Y24.w.ack(o.ids)));
  if (p === '/y24/w/resume') return body((o) => J(200, Y24.w.resume(o.by || o.why || '')));
  if (p === '/y24/feed') return body((o) => J(200, Y24.feed(o, o.by)), 1048576);
  if (p === '/y24/login') return body(async (o) => { const r = await Y24.login(o.why || '옆 창 단추'); J(200, { ...r, state: status() }); });
  if (p === '/y24/run') return body(async (o) => { const r = await Y24.runNow(String(o.what || 'ord')); J(200, { ...r, state: status() }); });
  /* (0.1.2) 운영 인쇄 도우미가 새 판으로 바꾸거나 끌 때 — 번외 크롬을 먼저 닫고(옛 크롬이 프로필을 쥔 채 남지 않게) 이 프로세스를 끝냄 */
  if (p === '/quit') return body(async (o) => { note('끝내기 부탁 — ' + String(o.by || o.why || '').slice(0, 60)); await closeBrowser('도우미 끝냄').catch(() => {}); await Y24.close('도우미 끝냄').catch(() => {}); await AL.close('도우미 끝냄').catch(() => {}); J(200, { ok: true, pid: process.pid }); setTimeout(() => process.exit(0), 200); });
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
  ST.timers.push(setInterval(() => tick().catch(() => {}), W('tickSec') * 1000)); setTimeout(() => tick('도우미 시작').catch(() => {}), TEST ? 300 : 5000); AU.t = setTimeout(autoLoop, TEST ? 800 : 15e3); Y24.start(); AL.start(); NV.start(); ST.timers.push(setInterval(() => credQueueTick().catch(() => {}), TEST ? 500 : 5000)); setTimeout(() => { if (CFG.on) sideOpen('도우미 시작'); }, TEST ? 600 : 4000); ST.timers.push(setInterval(() => selfUpdate().catch(() => {}), UPD.ms)); setTimeout(() => selfUpdate().catch(() => {}), Math.min(UPD.ms, 2 * 60e3)); /* (0.1.2) 켜진 뒤 2분 안에 한 번(30분 기다리지 않음) */ });
const bye = () => { try { if (B) B.kill(); } catch (e) {} try { if (Y24.Y.br) Y24.Y.br.kill(); } catch (e) {} try { if (AL.A.br) AL.A.br.kill(); } catch (e) {} process.exit(0); }; process.on('SIGTERM', bye); process.on('SIGINT', bye);
