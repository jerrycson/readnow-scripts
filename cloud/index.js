/* 리드나우 클라우드 수집 (readnow-cloud) 0.1.0 — Google Cloud Run
 *
 * 하는 일 (PC 수집기와 같은 기준 파일·같은 저장 형식, PC 수집기와 함께 돌아도 됨)
 *  - /tick  (Cloud Scheduler가 매일 24시간 1분마다 부름 — 0.4.0부터: ① 주문확인요청은 매번, ② 발송 요청은 5분마다·필요할 때)
 *      ① 알라딘 판매관리 ① 주문확인요청 · ② 발송 요청 읽기 → shp_state/confirm · shp_state/current · shp_orders · shp_snapshots (= 실시간 주문 수집)
 *      ② 발송 요청 엑셀(ALPS 업로드 재료) · 우리 매물 유의 사항·사진(prd_used_info, 24시간에 한 번)
 *      ③ 웹앱이 맡긴 일(shp_cmds) 중 read · startDelivery 를 맡아 처리 (PC가 먼저 맡으면 PC가 함 — 트랜잭션으로 한 곳만)
 *      ⑤ (0.5.0) 알라딘에서 산 주문(매입): 5분마다 첫 쪽 → 새 주문은 상세까지 pur_aladin_orders 에 (웹앱이 바로 '주문함' 매입 기록으로)
 *      ④ 신호: app_settings/cloud { at, ok, err, ... } — PC 수집기는 이 신호가 10분 안이면 자동 '발송 요청 읽기'를 쉼 (손으로 누르는 것·다른 수집은 그대로)
 *  - /kick  (웹앱이 일을 맡긴 직후 부름: 5분 기다리지 않고 바로 ③)
 *  - /lookup (웹앱 '사진 가격': ISBN·알라딘 상품번호 → 새상품 정보 + 온라인 중고 첫 페이지 / 제목 → 알라딘 검색 후보)
 *      (0.9.3) 현금 판매 판매중지: 웹앱이 다시 맡길 때마다 실행 문 열쇠가 새것(맡긴 일#회차) — '확인 못함' 뒤 다시 하지 못하던 것 고침
 *      (0.9.2) 웹앱 '📥 상품 등록'도 씀: 모든 분류·Sales Point·순위·리뷰·규격·쪽수 등을 함께 · 제목 검색은 상품 구분(branch 1 국내·2 음반·3 DVD·7 외국)대로
 *  - /spines (웹앱 '사진 가격' 책등 사진 → Google Vision 글자 읽기 → 책등마다 글자 묶음)
 *  - (0.6.1) 현금 판매 → 알라딘 판매중지 자동(shp_cmds cashStop): 판매상태 일괄 변경과 같은 요청으로 판매중지 → '판매중지' 목록에서 그 상품을 찾아야 완료, 못 찾으면 '확인 필요'(완료로 적지 않음) → 현금 판매 기록의 그 줄에 결과
 *  - (0.6.0) 관리도구 1판: 맡긴 일은 노선표(readnow-registry.js + Firebase app_settings/sys_registry)에 '클라우드가 맡을 수 있음'인 종류만 맡음 ·
 *      1분마다 맡긴 일 살피기(sweep) — 맡고 멈춘 일은 다시 해도 되는 일만 대기로 되돌리고, 아니면 '사람 확인'으로 · 아무도 안 맡는 일·모르는 종류는 알림 → app_settings/sys_health
 *  - (0.5.8) 매일 결과 기록(개편 1단계): 판매중 상품 전체의 그날 모습(ml_days) + 가격 변경마다 그 뒤 판매(ml_outcomes) + 이어짐 점검(app_settings/ml_state)
 *  - (0.5.7) 매일 데이터 관리 비용(Firestore·Cloud Run·Vision·Storage·이미지 보관) 사용량 × 공식 단가 → app_settings/costs_auto_YYYY-MM (웹앱 매입 탭 '기타 지출')
 *  - /inventory · /storage-files (0.5.6, 웹앱 백업: 모든 칸의 문서 수·어림 크기 + 사진 파일 목록·크기 — 읽기만)
 *  - /status (상태 확인, 인증 없음 — 비밀 정보 없음)
 *
 * 비밀: 알라딘 아이디·비밀번호(ALADIN_ID · ALADIN_PW)와 TICK_KEY는 Secret Manager에만 둠 (Firebase·웹앱·GitHub에는 절대 두지 않음)
 * 웹앱 호출 인증: Firebase 로그인 토큰(ID token) 확인 + 허용 이메일(ALLOW_EMAILS)
 */
'use strict';
const http = require('http');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, FieldPath } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const puppeteer = require('puppeteer-core');

const VER = '0.9.3';
initializeApp({ projectId: process.env.FB_PROJECT || 'readnow-3a385' });
const db = getFirestore();
const FV = FieldValue;
const RAW = process.env.CORE_BASE || 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/';
const CORES = ['readnow-shipping-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-sellers-core.js', 'readnow-core.js']; // 출고·상품 파서 + 판매자 분류(웹앱 블록 색과 같은 기준)
const ALADIN_ID = process.env.ALADIN_ID || '', ALADIN_PW = process.env.ALADIN_PW || '', TICK_KEY = process.env.TICK_KEY || '';
const ALLOW = (process.env.ALLOW_EMAILS || 'jerrycson@gmail.com').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const ORIGINS = (process.env.ALLOW_ORIGINS || 'https://jerrycson.github.io').split(',').map((s) => s.trim());
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const AL = 'https://www.aladin.co.kr';
const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = () => ({ uploadedAt: FV.serverTimestamp(), writer: 'cloud', writerSchema: 6 });
const C = (n) => db.collection(n);
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ── 공용 기준 파일 (GitHub의 것 그대로 — PC 수집기·웹앱과 같은 판) ── */
let coreSrc = null, coreAt = 0, coreVer = {};
async function cores() {
  if (coreSrc && Date.now() - coreAt < 30 * 60e3) return coreSrc;
  const out = await Promise.all(CORES.map(async (f) => { const r = await fetch(RAW + f + '?t=' + Date.now()); if (!r.ok) throw new Error(`${f} 받기 실패 (${r.status})`); const t = await r.text(); coreVer[f] = (t.match(/VERSION\s*[:=]\s*['"]([\d.]+)/) || [])[1] || '?'; return t; })); // 다섯 파일을 한꺼번에 받음 (차례로 받던 것보다 빠름)
  coreSrc = out.join('\n;\n'); coreAt = Date.now(); return coreSrc;
}

/* ── (0.6.0) 관리도구 노선표: GitHub의 readnow-registry.js(더 새것이면) → 없으면 함께 올린 같은 파일 · 살아 있는 값 = Firebase app_settings/sys_registry ── */
// 함께 올린 파일이 없어도(예: Dockerfile이 옛 판이라 이미지에 안 들어감) 죽지 않음 — GitHub에서 받고, 그것도 안 되면 예전 목록(클라우드가 맡던 종류)으로 계속
const REG_MIN = { VERSION: '0.0.0', merge: () => ({ KINDS: {} }), canHandle: (R, t, who) => who === 'cloud' && ['read', 'startDelivery', 'market', 'aladinBuy', 'usedInfo', 'cashStop'].includes(t), sweep: () => [] };
let REG_LOCAL = null; try { REG_LOCAL = require('./readnow-registry.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 노선표 파일 없음 — GitHub에서 받음', e.message); }
let REGM = REG_LOCAL || REG_MIN, regAt = 0;
const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
async function regMod() { if (Date.now() - regAt < 30 * 60e3) return REGM; regAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-registry.js?t=' + Date.now()); if (r.ok) { const t = await r.text(); const m = { exports: {} }; new Function('module', 'exports', t)(m, m.exports); if (m.exports && m.exports.VERSION && vn(m.exports.VERSION) >= vn((REG_LOCAL || REG_MIN).VERSION)) REGM = m.exports; } } catch (e) { log('노선표 파일 받기 실패 — 함께 올린 판 씀', e.message); }
  coreVer['readnow-registry.js'] = REGM.VERSION; return REGM; }
/* (0.7.0) 실행도구의 한 문 (readnow-exec-core.js) — 알라딘을 바꾸는 일(발송준비시작·판매중지)은 exec_log에 시작을 먼저 적고, 같은 일이 이미 끝났거나 하는 중이면 하지 않음.
 *  함께 올린 파일 → 없으면 GitHub에서 받음 → 그것도 안 되면 기록 없이 하지 않고 대기로 남김(PC 수집기가 맡을 수 있음) */
let EXEC_LOCAL = null; try { EXEC_LOCAL = require('./readnow-exec-core.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 실행 문 파일 없음 — GitHub에서 받음', e.message); }
let EXECM = EXEC_LOCAL, execAt = 0;
async function execMod() { if (EXECM) coreVer['readnow-exec-core.js'] = EXECM.VERSION; /* (0.9.3) 함께 올린 파일이 있을 때도 판을 신호에 (예전엔 여기서 먼저 돌아가 관리도구에 '?'로 빨갛게) */ if (EXECM && (EXEC_LOCAL || Date.now() - execAt < 30 * 60e3)) return EXECM; execAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-exec-core.js?t=' + Date.now()); if (r.ok) { const m = { exports: {} }; new Function('module', 'exports', await r.text())(m, m.exports); if (m.exports && m.exports.begin) EXECM = m.exports; } } catch (e) { log('실행 문 파일 받기 실패', e.message); }
  if (EXECM) coreVer['readnow-exec-core.js'] = EXECM.VERSION; return EXECM; }
async function regNow() { const M = await regMod(); let doc = null; try { const d = await C('app_settings').doc('sys_registry').get(); doc = d.exists ? d.data() : null; } catch (e) {} return { M, R: M.merge(doc) }; }
/* 맡긴 일 살피기 (1분마다, 회차 끝에): 멈춘 일·늦은 일·모르는 종류 → 되돌리기·사람 확인·알림. 상태 문서는 바뀐 때(또는 10분마다)만 씀 */
let sweepSig = '', sweepAt = 0; const seenFlag = new Set();
async function sysSweep() { const { M, R } = await regNow(); const now = Date.now();
  const [q1, q2] = await Promise.all([C('shp_cmds').where('status', '==', 'queued').get(), C('shp_cmds').where('status', '==', 'running').get()]);
  const cmds = [...q1.docs, ...q2.docs].map((d) => ({ id: d.id, ...d.data() }));
  let plan = M.sweep(R, cmds, now, { cloud: true, pc: true, webapp: true }); let pcAlive = null;
  if (plan.some((a) => a.act === 'late')) { try { const rs = await C('rn_status').get(); pcAlive = rs.docs.some((d) => { const v = d.data(); return v.atMs && now - v.atMs < 10 * 60e3; }); } catch (e) {} plan = M.sweep(R, cmds, now, { cloud: true, pc: !!pcAlive, webapp: true }); }
  const ev = [];
  for (const a of plan) { if (a.act !== 'requeue' && a.act !== 'stuck') { if (a.act === 'unknown' && !seenFlag.has(a.id)) { seenFlag.add(a.id); ev.push({ at: nowIso(), id: a.id, type: a.type, act: a.act, why: a.why }); } continue; }
    const ref = C('shp_cmds').doc(a.id); let done = false;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.exists ? { id: sn.id, ...sn.data() } : null; if (!x || x.status !== 'running') return; const again = M.sweep(R, [x], Date.now(), {}).find((y) => y.id === a.id); if (!again || again.act !== a.act) return;
      const h = { at: nowIso(), act: a.act, why: a.why, claim: x.claim || null };
      if (a.act === 'requeue') tx.update(ref, { status: 'queued', claim: null, attempts: a.attempts, sweepLog: FV.arrayUnion(h), uploadedAt: FV.serverTimestamp() });
      else tx.update(ref, { status: 'stuck', stuckAt: nowIso(), stuckWhy: a.why, sweepLog: FV.arrayUnion(h), uploadedAt: FV.serverTimestamp() }); done = true; });
    if (done) { ev.push({ at: nowIso(), id: a.id, type: a.type, act: a.act, why: a.why }); log('맡긴 일 살피기', a.act, a.type, a.id, a.why); } }
  const alerts = plan.filter((a) => a.act === 'late' || a.act === 'unknown').slice(0, 50); const counts = { queued: q1.size, running: q2.size };
  const sig = JSON.stringify([alerts.map((a) => a.id + a.act), counts]);
  if (ev.length || sig !== sweepSig || now - sweepAt > 10 * 60e3) { sweepSig = sig; sweepAt = now; const ref = C('app_settings').doc('sys_health');
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const old = (sn.exists && sn.data().events) || []; const events = [...old, ...ev].filter((e) => Date.parse(e.at) > now - 30 * 864e5).slice(-300);
      tx.set(ref, { at: nowIso(), ver: VER, reg: M.VERSION, regDoc: R.docVer || null, alerts, counts, pcAlive, events, lastEventAt: ev.length ? nowIso() : (sn.exists && sn.data().lastEventAt) || null, ...W() }, { merge: true }); }); }
  return { plan: plan.length, ev: ev.length }; }

/* ── 브라우저 (하나를 계속 씀, 일은 한 번에 하나씩) ── */
let browser = null, page = null, pageAt = 0; let chain = Promise.resolve(); let tickBusy = false; // 1분 예약이 겹치면(앞 회차가 길면) 건너뜀 — 쌓이지 않게
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
/* (0.9.1) 알라딘 화면 안의 읽기에 시간 제한 — 예전엔 화면 안 fetch에 제한이 없어, 알라딘(또는 브라우저)이 응답 하나를 붙잡으면 3분 동안 멈췄다가
 *  'Runtime.callFunctionOn timed out' 오류로 회차가 통째로 실패 → 맡긴 일(발송준비시작 등)·주문 읽기가 계속 밀렸음.
 *  ① 화면 안 fetch는 25초면 끊음(머리·본문 모두) ② 화면 일 하나(evaluate)는 60초(판매중지처럼 여러 번 묻는 일은 200초)면 끊고 그 화면을 버림
 *  ③ 버린 화면은 다음에 새로 만들고, 브라우저가 답이 없으면 브라우저를 다시 띄움(로그인은 저절로 다시) */
const FETCH_MS = 25000, EVAL_MS = 60000, EVAL_SLOW_MS = 230000;
const FETCH_GUARD = `(() => { if (window.__rnFetchGuard) return; window.__rnFetchGuard = 1; const f0 = window.fetch.bind(window);
  window.fetch = (u, o) => { o = o || {}; const ac = new AbortController(); if (o.signal) { try { if (o.signal.aborted) ac.abort(); else o.signal.addEventListener('abort', () => ac.abort()); } catch (e) {} } setTimeout(() => ac.abort(), ${FETCH_MS}); return f0(u, { ...o, signal: ac.signal }); }; })();`;
let pageBroken = false;
const withTO = (pr, ms, what) => { let t; return Promise.race([pr, new Promise((_, rej) => { t = setTimeout(() => { pageBroken = true; rej(Object.assign(new Error(`알라딘 화면이 ${Math.round(ms / 1000)}초 넘게 답이 없음 (${what}) — 화면을 새로 만들어 이어 감`), { pageTimeout: true })); }, ms); })]).finally(() => clearTimeout(t)); };
const isAbort = (e) => /abort|AbortError|signal is aborted|timed out|답이 없음/i.test(String((e && e.message) || e));
const isClosed = (e) => !isAbort(e) && /Target closed|Session closed|has been closed|detached|Connection closed|Protocol error/i.test(String((e && e.message) || e)); // 화면이 이미 닫혀 요청을 보내지 못함 (보냈는지 모를 일이 아님)
const curPage = (p) => (page && page !== p && !page.isClosed() ? page : p); // (0.9.1) 다른 단계가 화면을 새로 만들었으면 그 화면으로
function guardPage(pg) { const ev = pg.evaluate.bind(pg), ast = pg.addScriptTag.bind(pg);
  pg.evaluate = (...a) => withTO(ev(...a), EVAL_MS, 'evaluate'); pg.evaluateSlow = (...a) => withTO(ev(...a), EVAL_SLOW_MS, 'evaluate'); pg.addScriptTag = (...a) => withTO(ast(...a), EVAL_MS, 'addScriptTag'); return pg; }
async function dropPage(why) { const old = page; page = null; injectedSrc = null; pageBroken = false; log('화면 버림', why || '');
  if (old) { const closed = await Promise.race([old.close().then(() => true, () => false), sleep(5000).then(() => false)]); if (!closed && browser) { log('브라우저가 답이 없음 — 다시 띄움 (로그인은 저절로 다시)'); try { const pr = browser.process(); if (pr) pr.kill('SIGKILL'); } catch (e) {} try { await Promise.race([browser.close(), sleep(3000)]); } catch (e) {} browser = null; } } }
async function getPage() {
  if (pageBroken) await dropPage('응답 없음 뒤');
  if (!browser || !browser.connected) { browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, protocolTimeout: 240000, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--lang=ko-KR'] }); page = null; }
  if (page && !page.isClosed() && Date.now() - pageAt > 6 * 3600e3) { try { await page.close(); } catch (e) {} page = null; log('화면 새로 만듦 (6시간마다 — 메모리 정리, 로그인은 유지)'); } // 오래 켜 둔 화면은 메모리가 쌓임
  if (!page || page.isClosed()) { pageAt = Date.now(); page = guardPage(await browser.newPage()); await page.evaluateOnNewDocument(FETCH_GUARD); await page.setBypassCSP(true); /* 기준 파일을 넣으려고 (수집기도 Tampermonkey로 같은 일) */ await page.setUserAgent(UA); await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' }); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(45000); }
  if (!/aladin\.co\.kr/.test(page.url())) { await page.goto(AL + '/', { waitUntil: 'domcontentloaded' }); injectedSrc = null; }
  await page.evaluate(FETCH_GUARD).catch(() => {}); // 지금 문서에도 (이미 열린 화면) // 새 화면 = 기준 파일 다시 넣기
  await ensureCores(page); return page;
}
// 기준 파일이 GitHub에서 바뀌면(30분마다 확인) 열린 화면에도 새 판을 다시 넣음 — 예전엔 처음 넣은 판을 계속 써서 파서 고침이 반영되지 않았음
let injectedSrc = null;
async function ensureCores(p) { const src = await cores(); const has = await p.evaluate(() => !!(window.ReadnowShipping && window.ReadnowProducts && window.ReadnowPricing && window.ReadNowCore)).catch(() => false); if (!has || injectedSrc !== src) { await p.addScriptTag({ content: src }); injectedSrc = src; } }

/* ── 로그인 (PC 수집기의 자동 로그인과 같은 방식: 보이는 아이디 칸 + 비밀번호 칸 + 로그인 단추) ── */
let loginFailAt = 0, loginFailMsg = null, loginFailN = 0; // (0.9.0) 실패 쉬는 시간: 1번째 3분 → 2번째 10분 → 그 뒤 30분 (예전: 한 번만 실패해도 30분 동안 주문을 못 읽었음)
const loginRest = () => (loginFailN <= 1 ? 3 : loginFailN === 2 ? 10 : 30) * 60e3;
async function loggedIn(p) { return p.evaluate(async () => { try { const r = await fetch('/scm/worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return false; const d = new DOMParser().parseFromString(h, 'text/html'); return !(d.querySelector('input[type="password"]') && !/샵매니저/.test(d.title || '')); } catch (e) { return false; } }); }
async function login(p) {
  if (await loggedIn(p)) return true;
  if (!ALADIN_ID || !ALADIN_PW) throw new Error('알라딘 아이디·비밀번호 비밀(ALADIN_ID·ALADIN_PW)이 없음');
  if (loginFailAt && Date.now() - loginFailAt < loginRest()) throw new Error(`로그인 실패 뒤 ${Math.round(loginRest() / 60e3)}분 쉬는 중 (계정 잠김 방지, ${loginFailN}번째): ` + (loginFailMsg || ''));
  log('알라딘 로그인');
  await p.goto(AL + '/login/wlogin.aspx?returnurl=' + encodeURIComponent(AL + '/scm/worders.aspx'), { waitUntil: 'domcontentloaded' });
  const ok = await p.evaluate((id, pw) => {
    const pwI = [...document.querySelectorAll('input[type="password"]')].find((i) => i.getClientRects().length); if (!pwI) return 'no-pw';
    const form = pwI.form || document; const idI = [...form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])')].find((i) => i.getClientRects().length && i !== pwI); if (!idI) return 'no-id';
    const setVal = (inp, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    setVal(idI, id); setVal(pwI, pw);
    [...document.querySelectorAll('input[type="checkbox"]')].forEach((c) => { const lab = (c.id && document.querySelector(`label[for="${c.id}"]`)) || c.closest('label') || c.parentElement; if (lab && /상태\s*유지|자동\s*로그인/.test(lab.textContent) && !c.checked) c.click(); });
    const btn = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],a')].find((b) => /^\s*로그인\s*$/.test(b.textContent || b.value || b.alt || '') || b.type === 'submit' || b.type === 'image');
    if (btn) btn.click(); else if (pwI.form) pwI.form.submit(); else return 'no-btn'; return 'sent';
  }, ALADIN_ID, ALADIN_PW);
  if (ok !== 'sent') { loginFailAt = Date.now(); loginFailN++; loginFailMsg = '로그인 화면 모양이 다름 (' + ok + ')'; throw new Error(loginFailMsg); }
  await p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await sleep(1500);
  if (!/aladin\.co\.kr/.test(p.url())) await p.goto(AL + '/', { waitUntil: 'domcontentloaded' });
  await ensureCores(p);
  if (!(await loggedIn(p))) { const msg = await p.evaluate(() => (document.body.innerText.match(/(아이디|비밀번호|보안|인증|자동입력)[^\n]{0,80}/) || [''])[0]).catch(() => ''); loginFailAt = Date.now(); loginFailN++; loginFailMsg = msg || '로그인 뒤에도 샵매니저가 열리지 않음'; throw new Error('알라딘 로그인 실패: ' + loginFailMsg); }
  loginFailAt = 0; loginFailN = 0; loginFailMsg = null; log('로그인 됨'); return true;
}

/* ── ① 주문확인요청: 1분마다 이것부터 (알라딘 요청 1번) ──
   읽자마자 바뀌었으면 바로 shp_state/confirm 에 씀 → 웹앱은 Firestore 실시간 수신이라 몇 초 안에 화면에 뜸.
   그 뒤 같은 회차에서 상품마다 '보강'(사진·등급·등록일·유의사항·지금 시장 첫 페이지 + 판매자 분류)을 하나씩 채워 넣음 — 채워질 때마다 화면도 그 상품만 채워짐 */
const CONFIRM_URL = '/scm/worder_preparatory_complete.aspx';
let lastConfirm = [], lastDelivAt = 0, lastConfirmAt = null; const skipUntil = new Map(), failN = new Map();
async function confirmRead(p) {
  const R = await p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return { login: false };
    const d = new DOMParser().parseFromString(t, 'text/html'); if (d.querySelector('input[type="password"]') && !/샵매니저/.test(d.title || '')) return { login: false };
    return { login: true, rc: window.ReadnowShipping.parseDeliveryPage(d) }; }, CONFIRM_URL);
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const rc = R.rc; const at = nowIso(); lastConfirmAt = at; lastConfirm = rc.orders;
  const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)])); const ref = C('shp_state').doc('confirm');
  // (0.9.0) 같은 목록이면 Firestore를 다시 읽지 않음 (15초마다 읽으므로) — 목록 문서는 바뀐 때만 읽고 씀
  let cc = confirmDoc; if (!cc || cc.sig !== csig || Date.now() - confirmDocAt > 5 * 60e3) { cc = (await ref.get()).data() || null; confirmDocAt = Date.now(); } /* 5분마다는 서버와 맞춤 (PC 수집기가 쓴 경우) */
  try { await enrichMigrate(cc); } catch (e) { log('보강 칸 옮기기 실패 — 다음에 다시 (예전 칸은 그대로 둠)', e.message); }
  const changed = !cc || cc.sig !== csig; const enrich = await enrichOf(rc.orders);
  if (changed) { const bc = db.batch(); bc.set(ref, { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: 'cloud', ...(cc && cc.enrich ? { enrich: cc.enrich } : {}), ...W() }); /* 옮기기 전이면 예전 칸을 지우지 않음 */ // (0.9.0) 보강(enrich)은 문서마다 따로(shp_enrich) — 주문이 많아도 목록 문서가 1MB를 넘지 않게
    for (const o of rc.orders) bc.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }, { merge: true });
    await bc.commit(); confirmDoc = { sig: csig, tabCounts: rc.tabCounts, orders: rc.orders }; } else confirmDoc = cc;
  return { n: rc.orders.length, changed, enrich, tabCounts: rc.tabCounts, prevTab: cc && cc.tabCounts }; }
/* (0.9.0) 상품 보강은 상품마다 문서 하나(shp_enrich/{매물번호}) — 예전엔 목록 문서 안 enrich 칸에 3일치를 모아 둬, 주문이 많아지면 문서가 1MB를 넘어 목록 저장이 통째로 실패할 수 있었음
 *  처음 한 번 예전 enrich 칸을 옮기고 그 칸을 지움(내용은 shp_enrich에 그대로). 기억(enrichMem)으로 같은 것을 다시 읽지 않음 */
let confirmDoc = null, confirmDocAt = 0, enrichMemAt = 0; const enrichMem = new Map();
async function enrichMigrate(cc) { const E = cc && cc.enrich; if (!E || !Object.keys(E).length) return; const ks = Object.keys(E);
  for (let i = 0; i < ks.length; i += 400) { const b = db.batch(); ks.slice(i, i + 400).forEach((k) => { b.set(C('shp_enrich').doc(String(k)), { ...E[k], listingId: String(k), at: E[k].at || nowIso(), migratedAt: nowIso(), ...W() }, { merge: true }); enrichMem.set(String(k), E[k]); }); await b.commit(); }
  await C('shp_state').doc('confirm').update({ enrich: FV.delete() }); delete cc.enrich; log('보강 칸 옮김', ks.length, '개 → shp_enrich'); }
async function enrichOf(orders) { if (!enrichMemAt || Date.now() - enrichMemAt > 30 * 60e3) { enrichMemAt = Date.now(); try { (await C('shp_enrich').where('at', '>=', new Date(Date.now() - 3 * 864e5).toISOString()).get()).forEach((d) => enrichMem.set(d.id, d.data())); } catch (e) { log('보강 읽기 실패', e.message); } }
  const out = {}; for (const o of orders) for (const it of o.items || []) { const k = String(it.listingId || ''); if (k && enrichMem.has(k)) out[k] = enrichMem.get(k); } return out; }
const enrichPut = async (lid, E, merge) => { await C('shp_enrich').doc(String(lid)).set({ ...E, listingId: String(lid), ...W() }, { merge: !!merge }); enrichMem.set(String(lid), { ...(merge ? enrichMem.get(String(lid)) || {} : {}), ...E }); };

/* 상품 보강: 우리 상품 기록(prd_listings·prd_books·prd_used_info) + 지금 시장(온라인 중고 첫 페이지 1번 + 판매자 분류)
   · 기존 시장 지표(prd_book_metrics)는 건드리지 않음 — 시장은 shp_market 에 새 문서로 쌓고(덮어쓰지 않음), 화면용 사본만 confirm.enrich 에
   · 시간 상자: 한 회차에 최대 40초 — 넘으면 다음 회차(1분 뒤)에 이어 함. 한 권 실패는 그 책만 건너뜀 */
async function ourOf(listingId) {
  const L = await C('prd_listings').where('listingId', 'in', [String(listingId), Number(listingId)].filter((x) => x === x)).limit(1).get(); const l = L.empty ? null : L.docs[0].data();
  const b = l && l.bookId ? (await C('prd_books').doc(l.bookId).get()).data() : null; const ui = (await C('prd_used_info').doc(String(listingId)).get()).data();
  const img = b && b.images && b.images.front ? (b.images.front.stored || b.images.front.src || null) : null;
  return { key: L.empty ? null : L.docs[0].id, usedCode: l ? l.usedCode || null : null, bookId: l ? l.bookId || null : null, grade: l ? l.grade || null : null, sku: l ? l.sku || null : null, regAt: l ? l.registeredAt || l.regDate || null : null,
    itemId: b && b.aladinItemId ? String(b.aladinItemId) : null, cover: img, note: (ui && ui.note) || null, /* (0.5.3) 등급 글자(l.condition '중' 등)를 유의 사항으로 쓰지 않음 — 빠진 것을 가렸음 */ photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : [], ui: ui || null }; }
async function marketOf(p, itemId, ourUsed) {
  const u = await p.evaluate(async (id) => { const r = await fetch(`/shop/UsedShop/wuseditemall.aspx?ItemId=${id}&TabType=0`, { credentials: 'include' }); if (!r.ok) throw new Error('HTTP ' + r.status); return window.ReadnowProducts.parseUsedPage(new DOMParser().parseFromString(await r.text(), 'text/html')); }, itemId);
  const codes = [...new Set((u.listings || []).map((r) => r.sellerCode).filter((c) => c && String(c) !== '0' && String(c) !== '996008'))];
  const sd = {}; if (codes.length) (await db.getAll(...codes.map((c) => C('sellers').doc('sc_' + c)))).forEach((d) => { if (d.exists) sd[d.id] = d.data(); });
  const rows = await p.evaluate((L, sd, ourUsed) => { const PRC = window.ReadnowPricing, RNC = window.ReadNowCore, RS = window.ReadnowSellers;
    return L.map((r, i) => { const ours = String(r.sellerCode) === '996008' || (ourUsed && r.usedCode === ourUsed); const d = r.sellerCode ? sd['sc_' + r.sellerCode] : null; let c = 'unknown';
      try { c = ours ? 'ours' : PRC && PRC.isAladinSide(r) ? 'aladin' : d && RNC ? RNC.classifySellerDoc(d, RS).cls : 'unknown'; } catch (e) {}
      return { r: i + 1, n: r.sellerName || null, sc: r.sellerCode || null, g: r.grade || null, p: r.price ?? null, s: r.ship ?? null, lid: r.listingId || null, so: r.soldOut ? 1 : 0, c }; }); }, u.listings || [], sd, ourUsed || null);
  return { u, rows }; }
const realNote = (n, g) => { const t = String(n || '').trim(); return t && t !== g && !/^(최상|상|중|하|새것같음|새상품)$/.test(t) ? t : null; };
const uiNext = new Map(), uiTry = new Map();
function midAfter(lid, grade, note) { lid = String(lid); if (grade !== '중' || realNote(note, grade)) { uiTry.delete(lid); uiNext.delete(lid); if (grade === '중') C('shp_cmds').doc('ui_' + lid).update({ status: 'done', doneAt: nowIso(), by: 'cloud', results: { [lid]: { ok: true, at: nowIso(), by: 'cloud' } }, uploadedAt: FV.serverTimestamp() }).catch(() => {}); return; }
  const k = (uiTry.get(lid) || 0) + 1; uiTry.set(lid, k); uiNext.set(lid, Date.now() + Math.min(30, 2 ** k) * 60e3);
  if (k >= 2) { const ref = C('shp_cmds').doc('ui_' + lid); db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.exists ? sn.data() : null; if (x && (x.status === 'queued' || x.status === 'running')) { if (!x.cloudTried) tx.update(ref, { cloudTried: true, uploadedAt: FV.serverTimestamp() }); return; } if (x && x.status === 'done' && (x.tries || 0) >= 3) return;
      tx.set(ref, { type: 'usedInfo', listingIds: [lid], grade, status: 'queued', cloudTried: true, createdAt: nowIso(), by: 'cloud', tries: ((x && x.tries) || 0) + 1, uploadedAt: FV.serverTimestamp() }); }).catch(() => {}); } } // 클라우드가 두 번 못 읽으면 PC 수집기에 맡김
async function enrichConfirm(p, cr, force, until) {
  const t0 = Date.now(); const stopAt = Math.min(t0 + 40000, until || Infinity); const ref = C('shp_state').doc('confirm'); let n = 0, fail = 0; const todo = [];
  // (0.5.3) '중' 상품인데 유의 사항이 없으면(등급 글자만 있는 것도) 다시 읽음 — 2·4·8…분(최대 30분) 간격, 세 번째부터는 PC 수집기에도 맡김
  const midNo = (e, it) => (e && (e.grade || it.grade)) === '중' && !realNote(e && e.note, '중') && (uiNext.get(String(it.listingId)) || 0) <= Date.now();
  for (const o of lastConfirm) for (const it of o.items || []) { const lid = String(it.listingId || ''); if (!lid) continue; const e = cr.enrich[lid]; const mn = midNo(e, it); if (e && e.mkt && e.uiAt && !mn && !(force && force.has(lid))) continue; const uiOnly = e && (e.mkt || e.mktErr) && (!e.uiAt || mn); if (!uiOnly && (skipUntil.get(lid) || 0) > Date.now() && !(force && force.has(lid))) continue; todo.push({ o, it, lid, mn }); }
  for (const t of todo) { if (Date.now() > stopAt) break;
    try { const prevE = cr.enrich[t.lid];
      if (prevE && (prevE.mkt || prevE.mktErr) && (!prevE.uiAt || t.mn) && !(force && force.has(t.lid))) { // (0.5.0) 시장은 이미 읽음 — 우리 매물 유의 사항·사진만 채움 (시장을 다시 읽지 않음)
        const gr = prevE.grade || t.it.grade || null; let ui0 = (await C('prd_used_info').doc(String(t.lid)).get()).data(); if (looksBlanked(ui0)) ui0 = await repairUsedInfo(t.lid, ui0); let ui = ui0;
        if (!ui0 || !ui0.checkedAt || Date.now() - Date.parse(ui0.checkedAt) > 864e5 || (gr === '중' && !(ui0 && ui0.note))) ui = (await refreshUsedInfo(p, t.lid, ui0, null, gr)) || ui0;
        midAfter(t.lid, gr, ui && ui.note);
        const E2 = { ...prevE, note: (ui && ui.note) || realNote(prevE.note, gr) || null, photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : prevE.photos || [], uiAt: nowIso() };
        await enrichPut(t.lid, E2, true); cr.enrich[t.lid] = E2; n++; await sleep(300); continue; }
      const our = await ourOf(t.lid); let itemId = our.itemId, via = 'ours';
      if (looksBlanked(our.ui)) { const r = await repairUsedInfo(t.lid, our.ui); if (r && r.note) our.note = r.note; if (r && r.photos) our.photos = r.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); our.ui = r; }
      const gr0 = our.grade || t.it.grade || null; if (!our.ui || !our.ui.checkedAt || Date.now() - Date.parse(our.ui.checkedAt) > 864e5 || (gr0 === '중' && !our.note)) { try { const ui = await refreshUsedInfo(p, t.lid, our.ui, null, gr0); if (ui) { our.note = ui.note || our.note; if ((ui.photos || []).length) our.photos = ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); } } catch (e) { log('유의 사항 읽기 실패', t.lid, e.message); } } // 주문확인요청 상품도 우리 매물 유의 사항·사진을 바로 읽음 (예전엔 발송 요청 때만)
      if (!itemId && t.it.title) { const q = String(t.it.title).replace(/^\[[^\]]*\]\s*/, '');
        const c = await p.evaluate(async (q) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(q), { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
          return P.parseSearchResults(d).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: P.nameCoverage(q, x.title), img: x.img || null })).filter((x) => x.cov >= 0.9).sort((a, b) => b.cov - a.cov)[0] || null; }, q);
        if (c) { itemId = String(c.itemId); via = 'search'; if (!our.cover) our.cover = c.img; } }
      midAfter(t.lid, gr0, our.note);
      const E = { at: nowIso(), cover: our.cover, grade: our.grade || t.it.grade || null, sku: our.sku, regAt: our.regAt, note: our.note, photos: our.photos, itemId, via, key: our.key, uiAt: nowIso() };
      if (itemId) { const m = await marketOf(p, itemId, our.usedCode); const at = nowIso();
        E.mkt = { at, usedTotal: m.u.usedTotal ?? null, buyback: m.u.buyback || null, rows: m.rows };
        await C('shp_market').doc(`${t.o.orderNo}__${t.lid}__${at.replace(/[:.]/g, '-')}`).create({ orderNo: t.o.orderNo, listingId: t.lid, listingKey: our.key, bookId: our.bookId, aladinItemId: itemId, via, title: t.it.title || null, orderedAt: t.o.orderedAt || null, at,
          page1: m.u.listings || [], usedTotal: m.u.usedTotal ?? null, mins: m.u.mins || null, buyback: m.u.buyback || null, lastPage: m.u.lastPage || 1, by: 'cloud', ...W() }).catch(() => {}); }
      else { E.mktErr = '알라딘 상품번호를 못 찾음 (우리 기록·제목 검색 모두)'; skipUntil.set(t.lid, Date.now() + 3600e3); }
      await enrichPut(t.lid, { ...E, orderNo: t.o.orderNo }, false); cr.enrich[t.lid] = E; n++; await sleep(300);
    } catch (e) { fail++; const k = (failN.get(t.lid) || 0) + 1; failN.set(t.lid, k); skipUntil.set(t.lid, Date.now() + Math.min(60, 2 ** k) * 60e3); log('보강 실패', t.lid, `${k}번째 · ${Math.min(60, 2 ** k)}분 뒤 다시`, e.message); } } // 실패하면 2·4·8…분(최대 60분) 뒤 다시 — 매분 같은 실패를 되풀이하지 않음
  return { n, fail, left: todo.length - n - fail }; }

/* 우리 매물의 구매 유의 사항·사진 (알라딘 상품 화면) — 24시간에 한 번, 바뀐 판만 쌓음 (prd_used_info + v/ 판). 주문확인요청·발송 요청 둘 다 씀 */
async function refreshUsedInfo(p, lid, prev, at, grade) {
  const rd = (t) => p.evaluate(async ([lid, t]) => { const r0 = await fetch('/shop/wproduct.aspx?ItemId=' + lid + (t ? '&_=' + Date.now() : ''), { credentials: 'include', cache: 'no-store' }); const html = await r0.text(); const d = new DOMParser().parseFromString(html, 'text/html'); const x = window.ReadnowProducts.parseUsedItemInfo(d, null); x._box = !!d.getElementById('usedDecription'); x._title = (d.title || '').slice(0, 80); x._len = html.length; x._url = r0.url; return x; }, [String(lid), t]);
  let info = await rd(0); if (!info._box || (!info.hasNote && grade === '중')) { await sleep(1500); const i2 = await rd(1); if (i2._box && (i2.hasNote || !info._box)) info = i2; } // 한 번 더 (캐시 피해서)
  const ref = C('prd_used_info').doc(String(lid)); at = at || nowIso();
  // (0.5.3) 유의 사항 칸(#usedDecription)이 없으면 위쪽 표지 사진이 있어도 '못 읽음' — 예전엔 표지 사진만으로 '읽음'이 되어 빈 판을 쌓기도 했음
  //   '중' 상품인데 글이 비면 잘못 읽은 것으로 보고 쓰지 않음 → 다음 회차에 다시 · 그래도 못 읽으면 PC 수집기에 맡김(shp_cmds/ui_상품번호)
  if (info.found && !info._box) { info.found = false; }
  if (info.found && !info.hasNote && grade === '중' && !(prev && prev.note)) { log("'중' 상품인데 유의 사항이 비어 있음 — 쓰지 않음", lid, info._title, info._len, info._url); await ref.set({ lastMissAt: at, lastMissWhy: "'중' 상품인데 유의 사항 글이 비어 있음 (클라우드)", lastMissTitle: info._title || null }, { merge: true }).catch(() => {}); return prev || null; }
  // (0.5.1) 화면에서 유의 사항 칸·사진을 하나도 못 찾으면(다른 화면이 왔거나 읽기 실패) 아무것도 바꾸지 않음 — 예전엔 '빈 판'을 새로 쌓아 있던 유의 사항이 화면에서 사라졌음
  if (!info.found) { log('유의 사항 칸을 못 찾음 — 기록 그대로 둠', lid, info._title, info._len, info._url); await ref.set({ lastMissAt: at, lastMissTitle: info._title || null }, { merge: true }).catch(() => {}); return prev || null; }
  delete info._title; delete info._len; delete info._url;
  if (prev && (prev.note || (prev.photos || []).length) && !info.note && !(info.photos || []).length) { await ref.set({ lastMissAt: at, lastMissWhy: '빈 내용 — 그대로 둠' }, { merge: true }).catch(() => {}); return prev; } // 있던 내용을 빈 것으로 바꾸지 않음
  const sig2 = JSON.stringify([info.note, info.photos.map((x) => x.file)]);
  if (prev && prev.sig === sig2) { await ref.set({ checkedAt: at }, { merge: true }); return { ...prev, checkedAt: at }; }
  const nv = ((prev && prev.versions) || 0) + 1; const b2 = db.batch(); const ver = { note: info.note || null, hasNote: info.hasNote, photos: info.photos.map((x) => ({ src: x.src, where: x.where, file: x.file })), sellerPhotoCount: info.sellerPhotoCount, photoDiff: info.photoDiff, found: info.found, sig: sig2, at };
  b2.set(ref.collection('v').doc(String(nv).padStart(4, '0')), { ...ver, listingId: String(lid), ...W() }); b2.set(ref, { listingId: String(lid), sellerCode: '996008', ours: true, ...ver, versions: nv, firstAt: (prev && prev.firstAt) || at, checkedAt: at, ...W() }, { merge: true }); await b2.commit();
  return { ...(prev || {}), ...ver, versions: nv, checkedAt: at }; }

// 빈 판으로 덮인 유의 사항 되살리기: 마지막 '제대로 읽은 판'(v/ 기록, 지우지 않고 쌓여 있음)의 내용을 다시 지금 값으로 — 판 기록은 그대로 두고 덧붙임
const looksBlanked = (x) => !!x && (x.found === false || (!x.note && !(x.photos || []).length && x.writer === 'cloud')) && x.versions > 1;
async function repairUsedInfo(lid, cur) { if (!looksBlanked(cur)) return cur;
  const vs = await C('prd_used_info').doc(String(lid)).collection('v').get(); const L = vs.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.found !== false && (x.note || (x.photos || []).length)).sort((a, b) => (a.id < b.id ? 1 : -1));
  const g = L[0]; if (!g) return cur; const fix = { note: g.note || null, hasNote: !!(g.hasNote || g.note), photos: g.photos || [], sellerPhotoCount: g.sellerPhotoCount || 0, photoDiff: !!g.photoDiff, found: true, sig: g.sig || null, repairedAt: nowIso(), repairedFrom: g.id };
  await C('prd_used_info').doc(String(lid)).set(fix, { merge: true }); log('유의 사항 되살림', lid, '판', g.id); return { ...cur, ...fix }; }
let lastRepairAt = 0;
async function repairSweep() { if (Date.now() - lastRepairAt < 6 * 3600e3) return 0; lastRepairAt = Date.now(); let n = 0;
  try { for (const q of [C('prd_used_info').where('found', '==', false).limit(300), C('prd_used_info').where('writer', '==', 'cloud').limit(500)]) { const qs = await q.get(); for (const d of qs.docs) { const x = d.data(); if (looksBlanked(x)) { const y = await repairUsedInfo(d.id, x); if (y !== x) n++; } } } } catch (e) { log('유의 사항 되살리기 실패', e.message); }
  return n; }

/* ── ② 발송 요청 읽기 (5분마다 · 주문확인요청에서 주문이 빠졌을 때 · 맡긴 일이 있을 때) — PC 수집기 shipReadJob과 같은 저장 형식 ── */
const sameMap = (a, b) => { a = a || {}; b = b || {}; const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((k) => a[k] === b[k]); }; // 키 순서가 달라도 같으면 같음 (예전 비교는 순서가 다르면 늘 '바뀜' → 매번 다시 씀)
async function shipRead(p, until) {
  const R = await p.evaluate(async () => {
    const SH = window.ReadnowShipping; const get = async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); return { url: r.url, doc: new DOMParser().parseFromString(t, 'text/html') }; };
    const d = await get('/scm/worder_delivery.aspx?orderstep=4'); if (/\/login\/|wlogin/i.test(d.url)) return { login: false };
    const r = SH.parseDeliveryPage(d.doc); let excel = null, exErr = null;
    try { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' }); const rr = await fetch('/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); if (!rr.ok) throw new Error('HTTP ' + rr.status); excel = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html')); if (!excel) exErr = '엑셀 표를 못 찾음'; } catch (e) { exErr = e.message; }
    return { login: true, r, excel, exErr };
  });
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const at = nowIso(); const { r, excel } = R;
  const sig = JSON.stringify(r.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId), o.deliveryNo])); const cur = (await C('shp_state').doc('current').get()).data();
  const changed = !cur || cur.sig !== sig; const b = db.batch(); let w = false;
  if (changed) { w = true; b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, orders: r.orders, sig, pc: 'cloud', excel: null, ...W() }); // 엑셀은 따로(shp_state/excel) — 목록 문서를 가볍게
    b.set(C('shp_snapshots').doc(at.replace(/[:.]/g, '-')), { at, tabCounts: r.tabCounts, orders: r.orders, by: 'cloud', ...W() });
    for (const o of r.orders) b.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, stage: '발송 요청', lastSeenAt: at, ...(cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { firstSeenAt: at }), buyer: o.buyer, recipient: o.recipient, orderedAt: o.orderedAt, items: o.items, carrier: o.carrier, ...W() }, { merge: true }); }
  else if (cur && !sameMap(cur.tabCounts, r.tabCounts)) { w = true; b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, pc: 'cloud', ...W() }, { merge: true }); }
  if (excel) { const xr = C('shp_state').doc('excel'); const xo = (await xr.get()).data(); const rows = excel.rows.map((v) => ({ v })); if (!xo || JSON.stringify(xo.rows) !== JSON.stringify(rows)) { w = true; b.set(xr, { at, header: excel.header, rows, pc: 'cloud', ...W() }); } }
  if (w) await b.commit();
  // 우리 매물 유의 사항·사진 (24시간에 한 번 — PC 수집기와 같은 기록, 바뀐 판만 쌓음)
  let nInfo = 0; const items = r.orders.flatMap((o) => o.items).filter((i) => i.listingId);
  const prevs = items.length ? await db.getAll(...items.map((it) => C('prd_used_info').doc(String(it.listingId)))) : []; // 한 번에 읽음 (예전: 한 권씩)
  for (let ii = 0; ii < items.length; ii++) { const it = items[ii]; if (until && Date.now() > until) break; // 시간 상자: 한 회차가 1분을 넘지 않게 — 남은 것은 다음 회차
    const ref = C('prd_used_info').doc(String(it.listingId)); let prev = prevs[ii] && prevs[ii].exists ? prevs[ii].data() : undefined; if (looksBlanked(prev)) prev = await repairUsedInfo(it.listingId, prev); const mid = it.grade === '중' && !(prev && prev.note) && (uiNext.get(String(it.listingId)) || 0) <= Date.now(); if (!mid && prev && prev.checkedAt && Date.now() - Date.parse(prev.checkedAt) < 864e5) continue;
    try { const nx = await refreshUsedInfo(p, it.listingId, prev, at, it.grade || null); if (it.grade === '중') midAfter(it.listingId, it.grade, nx && nx.note); if (nx && (!prev || nx.versions !== prev.versions)) nInfo++; void ref;
      await sleep(600); } catch (e) { log('유의 사항 읽기 실패', it.listingId, e.message); } }
  lastDelivAt = Date.now();
  return { deliv: r.orders.length, items: items.length, changed, nInfo, exErr: R.exErr || null }; }

/* ── ③ 웹앱이 맡긴 일 (read · startDelivery · market = 그 주문 책의 시장 다시 읽기) ── */
async function runCmds(p, deadline) { deadline = deadline || Date.now() + 150000; // (0.9.1) 이 시각이 지나면 새 일을 맡지 않음(남은 일은 대기 그대로 → 다음 회차) — 회차가 Cloud Run 5분 한도를 넘지 않게
  const qs = await C('shp_cmds').where('status', '==', 'queued').get(); let n = 0, needRead = false; const force = new Set();
  let buy = false; const { M, R } = qs.size ? await regNow() : { M: null, R: null };
  for (const d of qs.docs) { if (Date.now() > deadline) { log('맡긴 일: 이번 회차 시간을 다 씀 — 남은 일은 다음 회차에'); break; } p = curPage(p); const x0 = d.data(); if (!M.canHandle(R, x0.type, 'cloud') || String(x0.cloudSkip || '').includes(` ${VER}가`)) continue; /* (0.6.0) 노선표에서 클라우드가 맡는 종류만 (예전: 이 자리의 목록) */ if (x0.type === 'usedInfo' && x0.cloudTried) continue; /* 클라우드가 이미 못 읽은 것 = PC 몫 */ let v = null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(d.ref); const x = sn.data(); if (!x || x.status !== 'queued') return; tx.update(d.ref, { status: 'running', claim: { pc: 'cloud', at: nowIso() }, uploadedAt: FV.serverTimestamp() }); v = x; });
    if (!v) continue; n++;
    try { /* (0.9.1) 한 일이 실패해도 나머지 맡긴 일은 계속 — 예전엔 하나가 오류를 던지면 그 회차의 남은 일이 모두 밀리고 그 일은 '하는 중'으로 남았음 */
    if (v.type === 'startDelivery') { const results = {};
      const X = await execMod(); if (!X) { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 실행 문 파일을 못 읽음 — 기록 없이 알라딘을 바꾸지 않음`, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('발송준비시작: 실행 문 파일 없음 — 대기로'); continue; }
      let leftOver = false; for (const ono of v.orderNos || []) { if (Date.now() > deadline + 30000 && !results[ono]) { leftOver = true; continue; } /* (0.9.1) 회차 시간 넘음 — 시작 안 한 주문은 다음 회차로 */ const xk = `${d.id}:${ono}`; let g; try { g = await X.begin(db, { kind: 'startDelivery', key: xk, by: 'cloud', detail: { ono } }); } catch (e) { g = { ok: false, state: 'noledger', why: '실행 기록을 못 적음: ' + e.message }; }
        if (!g.ok) { results[ono] = { state: g.state === 'done' ? 'done' : 'unknown', at: nowIso(), msg: '실행 문: ' + g.why, by: 'cloud', gate: g.state }; continue; }
        /* (0.9.1) 보내기: ① 화면이 이미 닫혀 못 보냄 → 새 화면으로 한 번 더 ② 로그인 화면으로 돌아옴(처리 안 됨) → 그 자리에서 다시 로그인 뒤 한 번 더 ③ 보낸 뒤 답이 끊김 → 아래 목록 확인이 정함 */
        let rr = null, sendErr = null; for (let at = 0; at < 2 && !rr; at++) { p = curPage(p); if (p.isClosed && p.isClosed()) { try { p = await getPage(); } catch (e) { sendErr = { notSent: true, msg: '화면을 새로 못 만들어 보내지 못함: ' + e.message }; break; } } /* 보내기 전에 닫혀 있으면 = 확실히 안 보냄 → 새 화면 */
          try { const r1 = await p.evaluate(async (o) => { const r = await fetch('/scm/worder_process.aspx?cmd=StartDelivery&ono=' + encodeURIComponent(o), { credentials: 'include' }); const t = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return { login: false }; return { ok: r.ok, status: r.status, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null }; }, ono);
            if (r1.login === false) { if (at === 0) { try { await login(p); continue; } catch (e) { sendErr = { notSent: true, msg: '로그인 풀림 — 다시 로그인 실패: ' + e.message }; break; } } sendErr = { notSent: true, msg: '로그인 풀림 — 알라딘이 받지 않음(보내지지 않음)' }; break; }
            rr = r1; }
          catch (e) { /* 보내는 도중 오류(끊김·브라우저 멈춤·닫힘) = 알라딘이 받았는지 모름 → 목록 확인이 정함 */ sendErr = { noReply: true, msg: '답을 못 받음 — 목록으로 확인: ' + String(e.message).slice(0, 120) }; if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); } catch (e2) {} } break; } }
        if (rr) results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(rr.al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: rr.al, by: 'cloud' };
        else if (sendErr && sendErr.noReply) results[ono] = { state: 'sent', at: nowIso(), msg: sendErr.msg, by: 'cloud', noReply: true };
        else results[ono] = { state: 'fail', at: nowIso(), msg: (sendErr && sendErr.msg) || '보내지 못함', by: 'cloud', notSent: true }; // 보내지 않은 것이 확실 → 실패(다시 할 수 있음)
        await d.ref.set({ results, beatAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }).catch(() => {}); await sleep(800); } // (0.5.4) 한 건마다 결과·살아 있음 신호
      // 확인: 주문확인요청 화면을 다시 읽어 빠졌는지 — 화면을 제대로 읽었을 때만 '끝남'(로그인 화면·읽기 실패로 빈 목록이면 '확인 못함')
      // (0.9.1) 답이 끊긴 주문이 있으면 알라딘이 마저 처리할 틈(5초)을 준 뒤 확인 · 지금 화면으로 · 로그인 화면이면 다시 로그인 뒤 한 번 더
      if (Object.values(results).some((r) => r.noReply)) await sleep(5000);
      if (pageBroken) { try { p = await getPage(); } catch (e) {} } p = curPage(p);
      const readLeft = () => p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); if (/\/login\/|wlogin/i.test(r.url)) return { ok: false, login: false }; const d = new DOMParser().parseFromString(await r.text(), 'text/html'); const x = window.ReadnowShipping.parseDeliveryPage(d); return { ok: !!(x && x.tabCounts && Object.keys(x.tabCounts).length), left: (x.orders || []).map((o) => o.orderNo) }; }, CONFIRM_URL);
      try { let chk = null; for (let at = 0; at < 2; at++) { try { chk = await readLeft(); } catch (e) { if (at === 0 && (isClosed(e) || e.pageTimeout || pageBroken)) { p = await getPage(); continue; } throw e; } if (chk.login === false && at === 0) { await login(p); continue; } break; }
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = !chk || !chk.ok ? 'unknown' : chk.left.includes(ono) ? 'fail' : 'done'; } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
      for (const [ono, r] of Object.entries(results)) if (!r.gate) await X.finish(db, { kind: 'startDelivery', key: `${d.id}:${ono}` }, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', { msg: r.msg || null, result: { http: r.http || null } }).catch(() => {});
      { const notSent = Object.values(results).filter((r) => r.notSent); // (0.9.1) 보내지 못한 주문(로그인 실패 등)·시간이 모자라 시작 못 한 주문이 있으면 '끝남'으로 닫지 않고 대기로 → 다음 회차(또는 PC)가 이어 함 (끝난 주문은 실행 문이 다시 보내지 않음)
        if (notSent.length || leftOver) { const nErr = (v.cloudErrN || 0) + (notSent.length ? 1 : 0); await d.ref.set({ status: 'queued', claim: null, results, cloudErr: notSent.length ? notSent[0].msg : '시간이 모자라 남은 주문은 다음 회차에', cloudErrN: nErr, cloudErrAt: nowIso(), ...(nErr >= 3 ? { cloudSkip: `클라우드 ${VER}가 3번 보내지 못함 — PC 수집기 몫` } : {}), uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; }
        else { await d.ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; } } }
    else if (v.type === 'usedInfo') { const results = {}; let allOk = true; // (0.5.3) '중' 상품 유의 사항 다시 읽기 (웹앱이 맡김) — 못 읽으면 PC 수집기 몫으로 남김
      for (const lid of v.listingIds || []) { try { const prev = (await C('prd_used_info').doc(String(lid)).get()).data(); const ui = await refreshUsedInfo(p, lid, prev, null, v.grade || null); const ok = !!(ui && realNote(ui.note, v.grade));
          results[lid] = ok ? { ok: true, at: nowIso(), by: 'cloud' } : { ok: false, why: '클라우드: 상품 화면에서 유의 사항을 못 읽음', at: nowIso() }; if (!ok) allOk = false;
          if (ok) { const cr0 = (await C('shp_state').doc('confirm').get()).data(); if (cr0 && cr0.enrich && cr0.enrich[lid]) await C('shp_state').doc('confirm').update(new FieldPath('enrich', String(lid)), { ...cr0.enrich[lid], note: ui.note, photos: (ui.photos || []).filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src), uiAt: nowIso() }); } }
        catch (e) { results[lid] = { ok: false, why: e.message, at: nowIso() }; allOk = false; } }
      await d.ref.set(allOk ? { status: 'done', results, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() } : { status: 'queued', cloudTried: true, cloudResults: results, claim: null, uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'market') { (v.listingIds || []).forEach((x) => force.add(String(x))); await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'aladinBuy') { buy = true; await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'cashStop' && Date.now() > deadline - 60000) { await d.ref.set({ status: 'queued', claim: null, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('판매중지: 이번 회차 남은 시간이 모자라 다음 회차에'); } // (0.9.1) 판매중지는 최대 230초 — 회차 한도를 넘지 않게
    else if (v.type === 'cashStop') { const X = await execMod(); if (!X) { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 실행 문 파일을 못 읽음 — 기록 없이 알라딘을 바꾸지 않음`, uploadedAt: FV.serverTimestamp() }, { merge: true }); continue; }
      let g; try { g = await X.begin(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1), by: 'cloud', detail: { orderId: v.orderId, lineNo: v.lineNo, listingId: v.listingId || null, title: v.title || null } }); } catch (e) { g = { ok: false, state: 'noledger', why: e.message }; }
      if (!g.ok) { await d.ref.set({ status: 'done', result: { state: g.state === 'done' ? 'skip' : 'check', msg: '실행 문: ' + g.why }, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); continue; }
      let r; try { r = await cashStopRun(p, v); } catch (e) { await X.finish(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1) }, 'failed', { msg: e.message }).catch(() => {}); throw e; }
      await X.finish(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1) }, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', { msg: r.msg || null }).catch(() => {}); await d.ref.set({ status: 'done', result: r, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); log('현금 판매 판매중지', v.title || v.listingId, r.state); }
    else if (v.type === 'read') { await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; }
    else { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 처리하는 길이 없는 종류 — 노선표 확인`, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('맡긴 일: 처리 길 없음', v.type); }
    } catch (e) { const nErr = (v.cloudErrN || 0) + 1; const msg = String(e.message || e).slice(0, 300);
      await d.ref.set({ status: 'queued', claim: null, cloudErr: msg, cloudErrN: nErr, cloudErrAt: nowIso(), ...(nErr >= 3 && !e.relogin ? { cloudSkip: `클라우드 ${VER}가 3번 실패 — PC 수집기 몫 (마지막: ${msg.slice(0, 80)})` } : {}), uploadedAt: FV.serverTimestamp() }, { merge: true }).catch(() => {});
      log('맡긴 일 실패 — 대기로 되돌림', v.type, d.id, nErr + '번째', msg); if (e.relogin) throw e; if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); } catch (e2) {} } } } // 노선표엔 클라우드 몫인데 이 판에 처리 길이 없으면 '끝남'으로 지우지 않고 대기로 되돌림
  return { n, needRead, force, buy, p };
}

/* ── (0.6.1) 현금 판매한 상품 → 알라딘 판매중지 (수집기 1.37.0의 같은 일과 같은 방법 — 상품 조회/수정 화면의 '판매상태 일괄 변경' 요청)
 *  ① 알라딘 상품번호: 맡긴 일 → 우리 상품 기록  ② 지금 상태 코드: 우리 상품 기록(판매중 1·일시판매중지 3·판매대기 41)  ③ 판매중지(15)로 바꿈
 *  ④ '판매중지' 목록에서 제목으로 찾아 그 상품번호가 있어야 'done' — 없으면 원래 상태를 다른 값으로 한 번씩 더, 그래도 없으면 'check'(완료로 적지 않음 — 사람 확인)
 *  ⑤ 현금 판매 기록(crm_orders)의 그 줄만 트랜잭션으로 고침(다른 줄·금액은 그대로) + 고친 기록 history */
const ST_CODE = { 판매중: 1, 판매대기: 41, 일시판매중지: 3, 판매중지: 15, 판매완료: 18, 판매금지: 16 };
async function cashStopRun(p, v) { const by = 'cloud';
  let lid = v.listingId ? String(v.listingId) : null; let ld = null; try { ld = (await C('prd_listings').doc(v.listingKey || ('aladin_' + v.usedCode)).get()).data() || null; } catch (e) {} if (!lid && ld && ld.listingId) lid = String(ld.listingId);
  if (!lid) return { state: 'fail', msg: '알라딘 상품번호를 못 찾음' };
  const before = (ld && ST_CODE[ld.status]) || 1; const kw = String(v.title || '').replace(/^\[[^\]]*\]\s*/, '').slice(0, 30);
  const R = await (p.evaluateSlow || p.evaluate)(async (a) => { const set = async (from) => { try { const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(from), stockStatusToDo: '15', items: a.lid }); const rr = await fetch('/scm/wrecord_edit_usedbatch.aspx', { method: 'POST', body: fd, credentials: 'include' }); const t = await rr.text(); if (/\/login\/|wlogin/i.test(rr.url)) return { login: false }; return { ok: rr.ok, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || '' }; } catch (e) { return { ok: false, al: '답을 못 받음 (판매중지 목록으로 확인)' }; } }; /* (0.9.1) 보낸 뒤 답이 끊겨도 아래 판매중지 목록 확인이 정함 */
    const inStop = async () => { if (!a.kw) return null; try { const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=15&chkItemInDate=0&searchCat1=0&searchType=1&keyword=${encodeURIComponent(a.kw)}&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=15&categoryId=0`, { credentials: 'include', cache: 'no-store' }); if (!r.ok) return null; const doc = new DOMParser().parseFromString(await r.text(), 'text/html'); return window.ReadnowProducts.parseScmList(doc).rows.some((x) => String(x.listingId) === String(a.lid)); } catch (e) { return null; } };
    let s1 = await set(a.before); if (s1.login === false) return { login: false }; let ok = await inStop(); let used = a.before; let al = s1.al;
    for (const alt of [1, 3, 41]) { if (ok !== false || alt === a.before) continue; const s2 = await set(alt); al = s2.al || al; used = alt; ok = await inStop(); }
    return { login: true, ok, used, al }; }, { lid, before, kw });
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const st = R.ok ? 'done' : 'check'; const at = nowIso();
  await db.runTransaction(async (tx) => { const ref = C('crm_orders').doc(v.orderId); const sn = await tx.get(ref); if (!sn.exists) return; const o = sn.data(); const items = JSON.parse(JSON.stringify(o.items || [])); const it = items.find((x) => x.lineNo === v.lineNo); if (!it || (it.aladinStop && it.aladinStop.status === 'done') || it.released) return;
    it.listingId = it.listingId || lid; it.aladinStop = { status: st, at, by, from: 'cloud-stop', before: R.used, verified: R.ok === true, msg: R.al || null, cmd: v.id || null };
    tx.update(ref, { items, uploadedAt: FV.serverTimestamp(), history: FV.arrayUnion({ at, by, what: `알라딘 판매중지로 바꿈(클라우드 자동): ${v.title || lid}${R.ok ? ' · 판매중지 목록에서 확인함' : ' · 판매중지 목록에서 확인 못함(확인 필요)'}${R.al ? ' · 알라딘: ' + R.al : ''}` }) }); });
  return { state: st, listingId: lid, before: R.used, msg: R.al || null }; }

/* ── ④ 알라딘에서 산 주문 (매입) — 5분마다 첫 쪽(최신 주문)만 읽음 · 새 주문은 바로 상세(품목·가격·판매자)까지
   → pur_aladin_orders (PC 수집기 '알라딘 구매 내역'과 같은 저장 형식) → 웹앱이 실시간으로 받아 '주문함' 매입 기록을 만듦
   · 이미 받은 주문은 다시 쓰지 않음. 비고(배송 상태 등)가 바뀌면 원래 값은 두고 noteNow · noteLog 에 덧붙임 */
const BUY_URL = '/account/wmaininfo.aspx?pType=MyAccount&start=we'; let lastBuyAt = 0, lastBuyRes = null;
async function buyRead(p, until) {
  const R = await p.evaluate(async (u) => {
    const body = new URLSearchParams({ page: '1', searchYear: '0', searchMonth: '0', searchType: '0', searchShopType: '0', searchOrderStatus: '0' });
    const r = await fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); const html = await r.text();
    if (/\/login\/|wlogin/i.test(r.url)) return { login: false }; const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = []; doc.querySelectorAll('td.td_date').forEach((td) => { const tr = td.closest('tr'); const d = (td.textContent || '').trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !tr) return;
      const a = tr.querySelector('td.td_link a'); const ono = a ? (a.textContent || '').trim() : null; if (!ono) return;
      const item = tr.querySelector('.td_left_item'); const txt = item ? item.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '';
      const m = txt.match(/총\s*(\d+)\s*종\s*(\d+)\s*권[^,]*,\s*([\d,]+)\s*원/); const note = tr.querySelector('td.td_note'); const recvT = [...tr.querySelectorAll('td.td_date')].map((t) => t.textContent.trim()).find((t) => t && !/^\d{4}-/.test(t));
      out.push({ ono, date: d, summary: txt.replace(/\s*총\s*\d+\s*종.*$/, ''), kinds: m ? +m[1] : null, qty: m ? +m[2] : null, amount: m ? +m[3].replace(/,/g, '') : null, note: note ? note.textContent.replace(/\s+/g, ' ').trim() : null, recipient: recvT || null }); });
    if (!out.length && doc.querySelector('input[type="password"]')) return { login: false };
    return { login: true, rows: out }; }, BUY_URL);
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  lastBuyAt = Date.now(); const rows = R.rows || []; if (!rows.length) return (lastBuyRes = { rows: 0, nNew: 0, nDet: 0 });
  const refs = rows.map((x) => C('pur_aladin_orders').doc(x.ono)); const snaps = await db.getAll(...refs); const at = nowIso();
  const b = db.batch(); let w = 0, nNew = 0; const need = [];
  rows.forEach((x, i) => { const sn = snaps[i];
    if (!sn.exists) { b.set(refs[i], { ...x, collectedAt: at, by: 'cloud', ...W() }); w++; nNew++; need.push(x.ono); return; }
    const o = sn.data(); const cur = o.noteNow !== undefined ? o.noteNow : o.note ?? null;
    if ((x.note || null) !== (cur || null)) { b.set(refs[i], { noteNow: x.note || null, noteAt: at, noteLog: FV.arrayUnion({ at, note: x.note || null }), ...W() }, { merge: true }); w++; }
    if (!o.lines) need.push(x.ono); });
  if (w) await b.commit();
  let nDet = 0;
  for (const ono of need) { if (until && Date.now() > until) break;
    try { const d = await p.evaluate(async (ono) => { const r = await fetch('/account/wordersinfo.aspx?pType=OrdersInfo&ONO=' + encodeURIComponent(ono), { credentials: 'include' }); const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
        const tables = [...doc.querySelectorAll('table')].map((t) => t.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()).filter((t) => /\[중고|상품명|판매자|정가|수량/.test(t));
        const items = [...doc.querySelectorAll('a[href*="wproduct.aspx"]')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 1);
        const lines = []; doc.querySelectorAll('tr[id^="ordersItem_"]').forEach((tr) => { const sp = tr.querySelector('.td_item span') || tr.querySelector('.td_item a.linkblue'); const raw = sp ? sp.textContent.replace(/\s+/g, ' ').trim() : ''; if (!raw) return;
          const g = raw.match(/^\[(?:온라인)?중고-([^\]]+)\]\s*/); const title = raw.replace(/^\[[^\]]*\]\s*/, ''); const am = (tr.querySelector('.td_amount') || {}).textContent || ''; const q = (am.match(/(\d+)\s*\/\s*\d+/) || am.match(/(\d+)/) || [])[1];
          const pm = ((tr.querySelector('.td_mileage') || {}).textContent || '').match(/가격\s*:\s*([\d,]+)\s*원/); lines.push({ title, raw, grade: g ? g[1] : null, qty: q ? +q : 1, price: pm ? +pm[1].replace(/,/g, '') : null, itemId: (tr.id.match(/ordersItem_(\d+)/) || [])[1] || null }); });
        const sellers = [...doc.querySelectorAll('a[href*="wshopitem.aspx"]')].map((a) => ({ name: a.textContent.trim(), sc: (a.href.match(/SC=(\d+)/i) || [])[1] || null }));
        return { detailText: tables.join(' | ').slice(0, 6000) || doc.body.textContent.replace(/\s+/g, ' ').slice(0, 3000), items: [...new Set(items)].slice(0, 60), lines: lines.slice(0, 80), sellers }; }, ono);
      if (!d.lines.length && !d.items.length) { log('알라딘 주문 상세: 품목을 못 읽음', ono); continue; } // 화면이 다르면 쓰지 않음 (다음 회차·PC 수집기가 다시)
      await C('pur_aladin_orders').doc(ono).set({ ...d, detailAt: nowIso(), detailBy: 'cloud', ...W() }, { merge: true }); nDet++; await sleep(500); } catch (e) { log('알라딘 주문 상세 실패', ono, e.message); } }
  return (lastBuyRes = { rows: rows.length, nNew, nDet, left: need.length - nDet }); }

/* ── 신호 ── */
let lastErrLog = { err: null, at: 0 };
async function beat(x) { const at = nowIso(); await C('app_settings').doc('cloud').set({ at, ver: VER, cores: coreVer, ...x, ...W() }, { merge: true }).catch((e) => log('신호 저장 실패', e.message));
  if (x.ok === false && (x.err !== lastErrLog.err || Date.now() - lastErrLog.at > 30 * 60e3)) { lastErrLog = { err: x.err, at: Date.now() }; await C('cloud_log').add({ at, ...x, ver: VER, ...W() }).catch(() => {}); } // 같은 오류는 30분에 한 번만 기록
  if (x.ok) lastErrLog = { err: null, at: 0 }; }

// 한 회차(1분마다): ① 주문확인요청 → 맡긴 일 → (필요할 때만) ② 발송 요청 → 상품 보강
/* (0.9.0) 맡긴 일 듣기: 대기 중인 일이 생기면 바로 깨움 (웹앱이 단추를 누르면 15초를 기다리지 않음) */
let kickFlag = false, cmdUnsub = null; const KICK = () => { kickFlag = true; };
function watchCmds() { if (cmdUnsub) return; try { cmdUnsub = C('shp_cmds').where('status', '==', 'queued').onSnapshot((qs) => { if (!qs.empty) kickFlag = true; }, (e) => { cmdUnsub = null; log('맡긴 일 듣기 끊김 — 다음 회차에 다시', e.message); }); } catch (e) { cmdUnsub = null; } }
/* 빠른 고리를 언제 돌릴지 (app_settings/main.shipFast · 웹앱 설정 ⑯): 'biz'(기본) = 평일 8~19시 · 'always' = 늘 · 'off' = 안 함(1분마다만)
 *  빠른 고리는 회차(요청)를 1분 가까이 열어 두므로 클라우드 사용 시간이 늘어남 → 비용과 맞바꿈. 그 밖의 시간에도 단추(맡긴 일)는 다음 회차(1분 안)에 처리 */
let fastCfg = null, fastCfgAt = 0;
async function fastMode() { if (!fastCfg || Date.now() - fastCfgAt > 5 * 60e3) { fastCfgAt = Date.now(); try { fastCfg = ((await C('app_settings').doc('main').get()).data() || {}).shipFast || {}; } catch (e) { fastCfg = fastCfg || {}; } }
  const mode = fastCfg.mode || 'biz'; if (mode === 'off') return { on: false, why: '설정에서 끔' };
  // PC 수집기가 15초마다 읽는 중이면(shp_state/fast.at 45초 안) 클라우드 빠른 고리는 쉼 — 같은 일을 두 번 하지 않고 비용을 아낌. PC가 꺼지면 다음 회차부터 다시 돎
  try { const f = (await C('shp_state').doc('fast').get()).data() || {}; const age = Date.now() - Date.parse(f.at || 0); if (age >= 0 && age < 45e3) return { on: false, why: `PC(${f.pc || '?'})가 15초마다 읽는 중` }; } catch (e) {}
  if (mode === 'always') return { on: true, why: '늘' };
  const k = new Date(Date.now() + 9 * 3600e3); const wd = k.getUTCDay(), h = k.getUTCHours(); const from = fastCfg.from ?? 8, to = fastCfg.to ?? 19; const on = wd >= 1 && wd <= 5 && h >= from && h < to; return { on, why: `평일 ${from}~${to}시` }; }
async function fastLoop(p, until, cr, cm) { const FAST = 15000; let loops = 0, changed = 0, n = 0, rd = null; let last = Date.now();
  while (Date.now() < until) { while (Date.now() < Math.min(until, last + FAST) && !kickFlag) await sleep(300); if (Date.now() >= until && !kickFlag) break;
    kickFlag = false; last = Date.now(); loops++; p = curPage(p); if (pageBroken) { try { p = await getPage(); } catch (e) { break; } }
    try { const cm2 = await runCmds(p, until + 20000); if (cm2.p) p = curPage(cm2.p); n += cm2.n; let c2; try { c2 = await confirmRead(p); } catch (e) { if (!e.relogin) throw e; await login(p); c2 = await confirmRead(p); }
      if (c2.changed) { changed++; cr = c2; } if (cm2.needRead || (c2.prevTab && c2.tabCounts && c2.prevTab['발송 요청'] !== c2.tabCounts['발송 요청'])) { try { rd = await shipRead(p, Math.min(until + 5000, Date.now() + 20000)); lastDelivAt = Date.now(); } catch (e) { log('빠른 발송 요청 읽기 실패', e.message); } }
      if (c2.changed || (cm2.force && cm2.force.size)) { try { await enrichConfirm(p, c2, cm2.force, Math.min(until, Date.now() + 15000)); } catch (e) {} }
      await C('app_settings').doc('cloud').set({ lastConfirmAt, lastLoopAt: nowIso(), ok: true, err: null }, { merge: true }).catch(() => {}); // 신선함 신호 — 웹앱 '읽은 시각'이 15초마다
    } catch (e) { log('빠른 읽기 실패', e.message); if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); continue; } catch (e2) {} } break; } }
  return { cr, rd, n, loops, changed }; }
async function tick(why) {
  const t0 = Date.now(); const out0 = {}; watchCmds();
  try { let p = await getPage(); let cr = null; const errs = []; execMod().catch(() => {}); mlMod().catch(() => {}); /* (0.9.3) 늘 불러 판을 신호에 (함께 올린 파일이면 바로 돌아옴) */ // (0.9.1) 관리도구에 판이 '?'로 뜨지 않게 미리 읽음
    // (0.9.1) 맡긴 일(발송준비시작·판매중지 등 돈이 걸린 일) 먼저, 그리고 각 단계가 실패해도 다음 단계는 함 — 예전엔 주문 읽기가 실패하면 맡긴 일까지 그 회차를 통째로 건너뜀
    const step = async (name, fn) => { for (let a = 0; a < 2; a++) { try { const r = await fn(p); p = curPage(p); return r; } catch (e) { if (e.relogin && a === 0) { try { await login(p); continue; } catch (e2) { errs.push(`${name}: ${e2.message}`); return null; } } if ((e.pageTimeout || pageBroken || isClosed(e)) && a === 0) { try { p = await getPage(); continue; } catch (e2) { errs.push(`${name}: ${e2.message}`); return null; } } errs.push(`${name}: ${String(e.message || e).slice(0, 160)}`); return null; } } return null; };
    cr = await step('주문확인요청', confirmRead); // 로그인 확인을 겸함 (풀렸으면 여기서 다시 로그인)
    const cm = (await step('맡긴 일', (pp) => runCmds(pp, t0 + 120000))) || { n: 0, needRead: false, force: new Set(), buy: false }; p = curPage(p); if (cm.needRead) cr = (await step('주문확인요청', confirmRead)) || cr;
    if (!cr) throw new Error(errs.join(' · ') || '주문확인요청을 못 읽음');
    const delivDue = why !== 'schedule' || cm.needRead || cr.changed || !lastDelivAt || Date.now() - lastDelivAt > 4.5 * 60e3 || (cr.prevTab && cr.prevTab['발송 요청'] !== cr.tabCounts['발송 요청']);
    const until = t0 + 30000; // (0.9.0) 무거운 일은 30초 안에서 — 나머지 시간은 빠른 고리(15초마다 주문확인요청) · 한 회차는 1분 안에 끝냄 (다음 예약을 건너뛰지 않게) — 못 한 것은 다음 회차에 이어 함
    let rd = null; if (delivDue) rd = await step('발송 요청', (pp) => shipRead(pp, until));
    let en = null; try { en = await enrichConfirm(p, cr, cm.force, until - 8000); } catch (e) { en = { err: e.message }; }
    try { const nr = await repairSweep(); if (nr) log('유의 사항 되살림', nr, '건'); } catch (e) {} // 6시간에 한 번: 빈 판으로 덮였던 유의 사항을 지난 판에서 되살림
    // (0.9.0) 빠른 고리: 남은 시간 동안 15초마다 ① 주문확인요청을 다시 읽고, 맡긴 일(발송준비시작 등)이 들어오면 기다리지 않고 바로 처리 — 새 주문이 웹앱에 15초 안에, 단추를 누르면 몇 초 안에
    { const fm = await fastMode(); out0.fastMode = fm.on ? fm.why : '꺼짐 · ' + fm.why; p = curPage(p); if (pageBroken) p = await getPage(); const r2 = await fastLoop(p, fm.on ? t0 + 50000 : Date.now(), cr, cm); if (r2.cr) cr = r2.cr; if (r2.rd) rd = r2.rd; cm.n += r2.n; out0.fast = r2.loops; out0.fastChanged = r2.changed; }
    p = curPage(p); let by = null; if (cm.buy || !lastBuyAt || Date.now() - lastBuyAt > 5 * 60e3 || (lastBuyRes && lastBuyRes.left)) { try { by = await buyRead(p, until); } catch (e) { if (e.relogin) { try { await login(p); by = await buyRead(p, until); } catch (e2) { by = { err: e2.message }; } } else by = { err: e.message }; } }
    const out = { ok: !errs.length, err: errs.length ? errs.join(' · ').slice(0, 300) : null, why, ...out0, tickMs: Date.now() - t0, lastShipAt: nowIso(), lastConfirmAt, lastDelivAt: lastDelivAt ? new Date(lastDelivAt).toISOString() : null, lastBuyAt: lastBuyAt ? new Date(lastBuyAt).toISOString() : null, last: { confirm: cr.n, deliv: rd ? rd.deliv : null, delivRead: !!rd, enrich: en, buy: by }, cmds: cm.n, login: 'ok' };
    await beat(out); log('tick', JSON.stringify(out)); return out;
  } catch (e) { const out = { ok: false, err: String(e.message || e).slice(0, 300), why, tickMs: Date.now() - t0, login: /로그인/.test(e.message) ? 'fail' : 'ok' }; await beat(out); log('tick 실패', e.message); return out; }
}

/* ── 사진 가격: 알라딘 조회 (로그인 필요 없음) ── */
async function lookup(req) {
  const p = await getPage(); const items = {}, cands = {}, errs = {};
  const book = (u) => p.evaluate(async (u) => { const P = window.ReadnowProducts; const get = async (x) => { const r = await fetch(x, { credentials: 'include' }); return { url: r.url, doc: new DOMParser().parseFromString(await r.text(), 'text/html') }; };
    const g = await get(u); const b = P.parseProductPage(g.doc, g.url); if (!b.aladinItemId) return { err: '알라딘에서 이 책을 못 찾음' };
    const us = P.parseUsedPage((await get(`/shop/UsedShop/wuseditemall.aspx?ItemId=${b.aladinItemId}&TabType=0`)).doc);
    return { itemId: b.aladinItemId, isbn13: b.isbn13 || null, title: b.title || null, subtitle: b.subtitle || null, author: (b.contributors || []).slice(0, 2).map((c) => c.name).join(', ') || null, publisher: b.publisher || null, pubDate: b.pubDate || null,
      cover: (b.images && b.images.front) || null, priceList: b.priceList ?? null, priceSales: b.priceSales ?? null, availability: b.availability || null, usedTotal: us.usedTotal ?? null, buyback: us.buyback || null, mins: us.mins || null, page1: us.listings || [], lastPage: us.lastPage || 1,
      /* (0.9.2) 등록 엔진: 상품 관리 코드 판정·카드에 쓰는 정보 */ categories: (b.categories || []).map((c) => ({ path: c.path || [], cids: c.cids || [] })), salesPoint: b.salesPoint ?? null, ranks: b.ranks || [], reviewCount: b.reviewCount ?? null, commentCount: b.commentCount ?? null, rating: b.rating ?? null, size: b.size || null, pages: b.pages || null, originalTitle: b.originalTitle || null, series: b.series || null }; }, u);
  const keep = async (key, r) => { r.at = nowIso(); items[key] = r; await C('prd_lookups').add({ key, ...r, by: 'cloud', ...W() }).catch(() => {}); };
  for (const isbn of (req.isbns || []).slice(0, 40)) { try { const r = await book(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`); if (r.err) errs[isbn] = r.err; else await keep(isbn, r); } catch (e) { errs[isbn] = e.message; } await sleep(400); }
  for (const id of (req.itemIds || []).slice(0, 40)) { try { const r = await book(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`); if (r.err) errs['id_' + id] = r.err; else await keep('id_' + id, r); } catch (e) { errs['id_' + id] = e.message; } await sleep(400); }
  const TGT = { 1: 'Book', 2: 'Music', 3: 'DVD', 7: 'Foreign' }[+req.branch || 1] || 'Book'; // (0.9.2) 등록 엔진: 상품 구분(국내도서·음반·DVD·외국도서)에 맞춰 찾음
  for (const q of (req.queries || []).slice(0, 40)) { try { cands[q] = await p.evaluate(async (q, tgt) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=' + tgt + '&SearchWord=' + encodeURIComponent(q), { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
      return P.parseSearchResults(d).filter((x) => !x.used).slice(0, 8).map((x) => ({ itemId: x.itemId, title: x.title, img: x.img || null, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, channels: x.channels || null })); }, q, TGT); } catch (e) { errs['q_' + q] = e.message; } await sleep(400); }
  return { items, cands, errs, by: 'cloud' };
}

/* ── 사진 가격: 책등 글자 (Google Vision) → 책등마다 묶음 ── */
let visionClient = null;
async function spines(b64) {
  if (!visionClient) { const vision = require('@google-cloud/vision'); visionClient = new vision.ImageAnnotatorClient(); }
  const [res] = await visionClient.documentTextDetection({ image: { content: Buffer.from(b64, 'base64') }, imageContext: { languageHints: ['ko', 'en'] } });
  const fa = res.fullTextAnnotation; if (!fa || !fa.pages || !fa.pages.length) return { spines: [], w: 0, h: 0 };
  const pg = fa.pages[0]; const Wd = pg.width || 1, Ht = pg.height || 1; const paras = [];
  for (const bl of pg.blocks || []) for (const pa of bl.paragraphs || []) { const v = (pa.boundingBox && pa.boundingBox.vertices) || []; if (!v.length) continue; const xs = v.map((q) => q.x || 0), ys = v.map((q) => q.y || 0);
    const text = (pa.words || []).map((w) => (w.symbols || []).map((s) => s.text).join('')).join(' ').trim(); if (!text) continue;
    paras.push({ text, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); }
  // 세운 책(책등이 세로)이면 가로 위치로, 눕힌 책(책등이 가로)이면 세로 위치로 묶음
  const tall = paras.filter((q) => q.y1 - q.y0 > q.x1 - q.x0).length >= paras.length / 2;
  const a0 = tall ? 'x0' : 'y0', a1 = tall ? 'x1' : 'y1', o0 = tall ? 'y0' : 'x0';
  paras.sort((m, n) => (m[a0] + m[a1]) - (n[a0] + n[a1])); const groups = [];
  for (const q of paras) { const g = groups[groups.length - 1]; const ov = g ? Math.min(g[a1], q[a1]) - Math.max(g[a0], q[a0]) : -1; const nar = g ? Math.min(g[a1] - g[a0], q[a1] - q[a0]) : 1;
    if (g && ov > nar * 0.45) { g.ps.push(q); g[a0] = Math.min(g[a0], q[a0]); g[a1] = Math.max(g[a1], q[a1]); g.y0 = Math.min(g.y0, q.y0); g.y1 = Math.max(g.y1, q.y1); g.x0 = Math.min(g.x0, q.x0); g.x1 = Math.max(g.x1, q.x1); }
    else groups.push({ ps: [q], x0: q.x0, x1: q.x1, y0: q.y0, y1: q.y1 }); }
  const out = groups.map((g) => ({ text: g.ps.sort((m, n) => m[o0] - n[o0]).map((q) => q.text).join(' ').replace(/\s+/g, ' ').trim(), box: { x: g.x0 / Wd, y: g.y0 / Ht, w: (g.x1 - g.x0) / Wd, h: (g.y1 - g.y0) / Ht } })).filter((s) => s.text.replace(/[^가-힣A-Za-z0-9]/g, '').length >= 2);
  return { spines: out, w: Wd, h: Ht, standing: tall };
}

/* ── (0.5.5) 사진 가격 조회 기록 저장·읽기 — 웹앱이 Firebase 규칙에 막힐 때 저절로 여기로 (관리자 권한이라 규칙과 관계없음, 허용한 계정만)
   ppt_sessions/{조회} = 웹앱과 같은 문서 · 사진은 ppt_photo_data/{조회} {data: JPEG base64} (Storage 대신 — Storage 권한을 따로 주지 않아도 되게) */
async function pptStore(b, u) { const fs = getFirestore(); const sid = String(b.sid || ''); const okId = /^[A-Za-z0-9_-]{8,40}$/.test(sid); const now = new Date().toISOString();
  if (b.op === 'save') { if (!okId) throw Object.assign(new Error('조회 번호가 이상함'), { code: 400 }); const doc = b.doc && typeof b.doc === 'object' ? b.doc : null; if (!doc) throw Object.assign(new Error('기록 없음'), { code: 400 });
    if (JSON.stringify(doc).length > 900e3) throw Object.assign(new Error('기록이 너무 큼 (1MB 한도)'), { code: 413 });
    const out = { ...doc, by: u.email, via: 'cloud', savedAt: now };
    if (b.photo) { const data = String(b.photo).replace(/^data:[^,]+,/, ''); if (data.length > 950e3) throw Object.assign(new Error('사진이 너무 큼'), { code: 413 }); await fs.collection('ppt_photo_data').doc(sid).set({ data, type: 'image/jpeg', at: now, by: u.email }); out.photoFs = true; }
    await fs.collection('ppt_sessions').doc(sid).set(out, { merge: true }); return { ok: true }; }
  if (b.op === 'list') { const qs = await fs.collection('ppt_sessions').orderBy('at', 'desc').limit(60).get(); return { ok: true, list: qs.docs.filter((d) => d.id !== '_perm_check').map((d) => { const v = d.data(); return { id: d.id, at: v.at || null, by: v.by || null, mode: v.mode || null, n: v.n || 0, found: v.found || 0, titles: v.titles || [], photoUrl: v.photoUrl || null, photoFs: !!v.photoFs }; }) }; }
  if (b.op === 'get') { if (!okId) throw Object.assign(new Error('조회 번호가 이상함'), { code: 400 }); const d = await fs.collection('ppt_sessions').doc(sid).get(); if (!d.exists) return { ok: true, doc: null };
    const v = d.data(); let photo = null; if (v.photoFs) { const p = await fs.collection('ppt_photo_data').doc(sid).get(); if (p.exists) photo = 'data:image/jpeg;base64,' + p.data().data; } return { ok: true, doc: v, photo }; }
  throw Object.assign(new Error('모르는 일: ' + b.op), { code: 400 }); }

/* ── HTTP ── */
async function authUser(req) {
  const h = req.headers.authorization || ''; const tok = h.startsWith('Bearer ') ? h.slice(7) : null; if (!tok) throw Object.assign(new Error('로그인 토큰 없음'), { code: 401 });
  const u = await getAuth().verifyIdToken(tok).catch(() => null); if (!u) throw Object.assign(new Error('로그인 토큰이 맞지 않음'), { code: 401 });
  if (!ALLOW.includes(String(u.email || '').toLowerCase())) throw Object.assign(new Error('허용되지 않은 계정: ' + u.email), { code: 403 }); return u;
}
const bodyOf = (req) => new Promise((res, rej) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > 15e6) { rej(Object.assign(new Error('너무 큼'), { code: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { rej(Object.assign(new Error('JSON 아님'), { code: 400 })); } }); });

/* ── (0.5.6) 백업용 자료 목록 (/inventory · /storage-files) — 웹앱 '⑪ Firebase 자료 전체 내려받기'가 미리 크기를 보여 주고, 새로 생긴 칸도 빠짐없이 담게
 *   /inventory: Firestore의 모든 최상위 칸(listCollections — 코드에 이름을 적어 두지 않아도 새 칸이 저절로 잡힘) + 아래 칸(log·v·big)
 *               칸마다 문서 수(count — 문서를 다 읽지 않음) · 앞쪽 25건 평균 크기로 어림한 총 크기 / Storage(사진 파일) 폴더마다 파일 수·실제 크기
 *   /storage-files: 고른 폴더의 파일 이름·크기 목록 (웹앱이 그 목록대로 내려받아 나눠 ZIP으로) — 읽기만 함 */
const BUCKET = process.env.FB_BUCKET || 'readnow-3a385.firebasestorage.app';
const SUB_GROUPS = ['log', 'v', 'big'];
async function colStat(q) { let n = null, avg = null; try { n = (await q.count().get()).data().count; } catch (e) {}
  try { const qs = await q.limit(25).get(); if (qs.size) avg = Math.round(qs.docs.reduce((a, d) => a + Buffer.byteLength(JSON.stringify(d.data())) + d.ref.path.length, 0) / qs.size); } catch (e) {}
  return { n, avgBytes: avg, estBytes: n != null && avg != null ? n * avg : null }; }
const stGroupOf = (name) => { const top = name.split('/')[0]; if (top === 'img') return /_t\.webp$/.test(name) ? 'img(작은 그림)' : 'img'; return top; };
async function storageFiles(prefix) { const { getStorage } = require('firebase-admin/storage'); const [files] = await getStorage().bucket(BUCKET).getFiles({ prefix: prefix || '', autoPaginate: true });
  return files.filter((f) => !/\/$/.test(f.name) && !/_perm_check\.txt$/.test(f.name)).map((f) => ({ name: f.name, size: +((f.metadata && f.metadata.size) || 0), type: (f.metadata && f.metadata.contentType) || null })); }
async function inventory() { const t0 = Date.now(); const cols = [];
  for (const c of await db.listCollections()) cols.push({ id: c.id, ...(await colStat(c)) });
  const subs = []; for (const g of SUB_GROUPS) subs.push({ id: g, ...(await colStat(db.collectionGroup(g))) });
  let storage = null; try { const F = await storageFiles(''); const G = {}; for (const f of F) { const g = stGroupOf(f.name); const x = G[g] || (G[g] = { n: 0, bytes: 0 }); x.n++; x.bytes += f.size; } storage = { bucket: BUCKET, groups: G }; }
  catch (e) { storage = { bucket: BUCKET, err: e.message }; }
  return { ok: true, at: nowIso(), ms: Date.now() - t0, cols: cols.sort((a, b) => a.id.localeCompare(b.id)), subs, storage }; }

/* ── (0.5.7) 데이터 관리 비용 자동 기록 → app_settings/costs_auto_YYYY-MM (달마다 한 문서, 날마다 한 칸 · 웹앱 매입 탭 '기타 지출') ──
 * 하루에 한 번(한국 시각 0시 20분 뒤), 아직 안 적은 날(어제까지)을 하루씩: Google Cloud 사용량(Cloud Monitoring — 이 프로젝트의 실제 측정값)
 *   × 공식 단가(아래 RATES, 출처·확인 날짜 함께) − 무료 한도 = 그날 추정 비용(달러) → 그날 환율(frankfurter, 유럽중앙은행 기준)로 원.
 * 실제 청구 금액은 Google 결제 화면에만 있음 → 웹앱에서 '청구서 금액(달)'을 넣으면 그 달은 청구서 금액이 확정값, 이 추정은 비교로 남음.
 * 이미 적은 날은 다시 쓰지 않음(그 날 칸이 있으면 그대로). Monitoring은 약 6주만 보관 → 처음 돌 때 6주 전부터 채움(한 번에 4일씩).
 * 읽기만 하는 권한(roles/monitoring.viewer · roles/artifactregistry.reader)은 deploy.sh가 줌 */
const COST_RATES = { asOf: '2026-10-08', usdKrwFallback: 1400,
  fsRead: 0.03 / 1e5, fsWrite: 0.09 / 1e5, fsDelete: 0.01 / 1e5, fsFreeRead: 50000, fsFreeWrite: 20000, fsFreeDelete: 20000, // cloud.google.com/firestore/pricing (Standard, 하루 무료)
  fsStoreGiBMonth: 0.000205479 * 730, fsFreeGiB: 1, // 같은 페이지: GiB·시간 단가 × 730시간
  runCpuSec: 0.0000336, runGiBSec: 0.0000035, runReq: 0.4 / 1e6, runFreeUsdMonth: 180000 * 0.000024 + 360000 * 0.0000025 + 2e6 * 0.4 / 1e6, runCpu: 1, runGiB: 2, // cloud.google.com/run/pricing — 서울=Tier 2(요청 처리 중에만 CPU), 무료 = Tier 1 단가로 한 달 $6.02 할인
  visionUnit: 1.5 / 1000, visionFreeMonth: 1000, // cloud.google.com/vision/pricing (글자 읽기)
  gcsGiBMonth: 0.02, gcsFreeGiB: 5, gcsFreeRegions: ['US-CENTRAL1', 'US-EAST1', 'US-WEST1'], // cloud.google.com/storage/pricing (Standard 한 지역; 무료 5GB는 미국 세 지역만)
  arGiBMonth: 0.10, arFreeGiB: 0.5 }; // Artifact Registry(클라우드 이미지 보관)
const PROJECT = process.env.FB_PROJECT || 'readnow-3a385';
async function gToken() { const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-account/token', { headers: { 'Metadata-Flavor': 'Google' } }); if (!r.ok) throw new Error('토큰 못 받음 ' + r.status); return (await r.json()).access_token; }
async function gGet(tok, url) { const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status); return j; }
async function mSum(tok, filter, s, e, aligner) { const q = new URLSearchParams({ filter, 'interval.startTime': s, 'interval.endTime': e, 'aggregation.alignmentPeriod': '86400s', 'aggregation.perSeriesAligner': aligner || 'ALIGN_SUM', 'aggregation.crossSeriesReducer': 'REDUCE_SUM' });
  const j = await gGet(tok, `https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries?${q}`); let v = 0; for (const ts of j.timeSeries || []) for (const p of ts.points || []) v += +(p.value.int64Value ?? p.value.doubleValue ?? 0); return v; }
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const dayRange = (day) => { const s = Date.parse(day + 'T00:00:00+09:00'); return [new Date(s).toISOString(), new Date(s + 864e5).toISOString()]; };
async function fxRate(day) { try { const r = await fetch(`https://api.frankfurter.app/${day}?from=USD&to=KRW`); const j = await r.json(); if (j && j.rates && j.rates.KRW) return { rate: +j.rates.KRW, src: 'frankfurter(ECB) ' + (j.date || day) }; } catch (e) {} return { rate: COST_RATES.usdKrwFallback, src: '기본값(환율 못 받음)' }; }
async function costUsage(tok, day) { const [s, e] = dayRange(day); const U = {}; const tryM = async (k, f, al) => { try { U[k] = await mSum(tok, f, s, e, al); } catch (er) { U[k] = null; U.err = (U.err || []).concat(`${k}: ${er.message}`.slice(0, 160)); } };
  await tryM('fsRead', 'metric.type="firestore.googleapis.com/document/read_count"'); await tryM('fsWrite', 'metric.type="firestore.googleapis.com/document/write_count"'); await tryM('fsDelete', 'metric.type="firestore.googleapis.com/document/delete_count"');
  await tryM('runSec', 'metric.type="run.googleapis.com/container/billable_instance_time" AND resource.labels.service_name="readnow-cloud"'); await tryM('runReq', 'metric.type="run.googleapis.com/request_count" AND resource.labels.service_name="readnow-cloud"');
  await tryM('vision', 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api" AND resource.labels.service="vision.googleapis.com"');
  await tryM('gcsBytes', 'metric.type="storage.googleapis.com/storage/total_bytes"', 'ALIGN_MEAN'); return U; }
async function costDaily(maxDays) { const ST = C('app_settings').doc('costs_auto'); const st = (await ST.get()).data() || {}; const today = kstDay(Date.now()); const kNow = new Date(Date.now() + 9 * 3600e3);
  if (kNow.getUTCHours() === 0 && kNow.getUTCMinutes() < 20) return { skip: '0시 20분 뒤에' }; // 어제 측정값이 다 모인 뒤
  let day = st.lastDay ? kstDay(Date.parse(st.lastDay + 'T12:00:00+09:00') + 864e5) : kstDay(Date.now() - 42 * 864e5); if (day >= today) return { skip: '다 적음' };
  const tok = await gToken(); let bucketLoc = st.bucketLoc || null; if (!bucketLoc) { try { const { getStorage } = require('firebase-admin/storage'); const [m] = await getStorage().bucket(BUCKET).getMetadata(); bucketLoc = String(m.location || '').toUpperCase(); } catch (e) { bucketLoc = '?'; } }
  let arBytes = null; try { const j = await gGet(tok, `https://artifactregistry.googleapis.com/v1/projects/${PROJECT}/locations/asia-northeast3/repositories`); arBytes = (j.repositories || []).reduce((a, r) => a + (+r.sizeBytes || 0), 0); } catch (e) { arBytes = null; }
  let fsBytes = null; try { const inv = st.fsBytesAt && Date.now() - Date.parse(st.fsBytesAt) < 7 * 864e5 ? null : await inventory(); if (inv) fsBytes = (inv.cols || []).reduce((a, c) => a + (c.estBytes || 0), 0) + (inv.subs || []).reduce((a, c) => a + (c.estBytes || 0), 0); } catch (e) {}
  if (fsBytes == null) fsBytes = st.fsBytes ?? null; const R = COST_RATES; const done = [];
  for (let n = 0; n < (maxDays || 4) && day < today; n++, day = kstDay(Date.parse(day + 'T12:00:00+09:00') + 864e5)) {
    const U = await costUsage(tok, day); const fx = await fxRate(day); const ym = day.slice(0, 7); const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
    const mo = (st.month && st.month.ym === ym) ? st.month : { ym, runUsd: 0, runDisc: 0, vision: 0 }; // 달 무료 한도는 그 달 누적으로
    const lines = []; const L = (key, service, item, qty, unit, free, billable, unitUsd, usd, note) => lines.push({ key, service, item, qty, unit, free, billable, unitUsd, usd: Math.round(usd * 1e6) / 1e6, note: note || null });
    const fz = (q, f) => Math.max(0, (q || 0) - f);
    if (U.fsRead != null) L('fs_read', 'Firestore', '문서 읽기', U.fsRead, '건', R.fsFreeRead, fz(U.fsRead, R.fsFreeRead), R.fsRead, fz(U.fsRead, R.fsFreeRead) * R.fsRead, '하루 무료 5만 건(미국 태평양 자정 기준)');
    if (U.fsWrite != null) L('fs_write', 'Firestore', '문서 쓰기', U.fsWrite, '건', R.fsFreeWrite, fz(U.fsWrite, R.fsFreeWrite), R.fsWrite, fz(U.fsWrite, R.fsFreeWrite) * R.fsWrite, '하루 무료 2만 건');
    if (U.fsDelete != null) L('fs_delete', 'Firestore', '문서 지우기', U.fsDelete, '건', R.fsFreeDelete, fz(U.fsDelete, R.fsFreeDelete), R.fsDelete, fz(U.fsDelete, R.fsFreeDelete) * R.fsDelete, '하루 무료 2만 건');
    if (fsBytes != null) { const g = fsBytes / 2 ** 30; L('fs_store', 'Firestore', '저장 용량', Math.round(g * 1000) / 1000, 'GiB', R.fsFreeGiB, Math.max(0, g - R.fsFreeGiB), R.fsStoreGiBMonth / dim, Math.max(0, g - R.fsFreeGiB) * R.fsStoreGiBMonth / dim, '칸마다 앞쪽 25건 평균으로 어림한 크기(백업 목록과 같은 값) · 무료 1GiB'); }
    if (U.runSec != null) { const cpu = U.runSec * R.runCpu, mem = U.runSec * R.runGiB; const g = cpu * R.runCpuSec + mem * R.runGiBSec + (U.runReq || 0) * R.runReq; const before = mo.runUsd; mo.runUsd += g; const disc = Math.min(g, Math.max(0, R.runFreeUsdMonth - before));
      L('run_cpu', 'Cloud Run', 'CPU 시간', Math.round(cpu), 'vCPU·초', null, Math.round(cpu), R.runCpuSec, cpu * R.runCpuSec, `요청 처리 중 시간 ${Math.round(U.runSec)}초 × ${R.runCpu} vCPU`); L('run_mem', 'Cloud Run', '메모리 시간', Math.round(mem), 'GiB·초', null, Math.round(mem), R.runGiBSec, mem * R.runGiBSec, `× ${R.runGiB} GiB`);
      L('run_req', 'Cloud Run', '요청', U.runReq || 0, '건', null, U.runReq || 0, R.runReq, (U.runReq || 0) * R.runReq, '1분마다 수집 + 웹앱 호출'); if (disc > 0) L('run_free', 'Cloud Run', '무료 한도 할인', null, null, null, null, null, -disc, `한 달 $${R.runFreeUsdMonth.toFixed(2)}까지 (이 달 누적 $${mo.runUsd.toFixed(3)})`); mo.runDisc += disc; }
    if (U.vision != null && U.vision > 0) { const before = mo.vision; mo.vision += U.vision; const bill = Math.max(0, mo.vision - R.visionFreeMonth) - Math.max(0, before - R.visionFreeMonth); L('vision', 'Vision API', '책등 글자 읽기', U.vision, '건', R.visionFreeMonth, bill, R.visionUnit, bill * R.visionUnit, '한 달 무료 1,000건 (이 달 누적 ' + mo.vision + '건)'); }
    if (U.gcsBytes != null) { const g = U.gcsBytes / 2 ** 30; const free = R.gcsFreeRegions.includes(bucketLoc) ? R.gcsFreeGiB : 0; L('gcs', 'Cloud Storage', '사진 저장', Math.round(g * 1000) / 1000, 'GiB', free, Math.max(0, g - free), R.gcsGiBMonth / dim, Math.max(0, g - free) * R.gcsGiBMonth / dim, `버킷 위치 ${bucketLoc}${free ? ' (무료 5GB 지역)' : ''}`); }
    if (arBytes != null) { const g = arBytes / 2 ** 30; L('ar', 'Artifact Registry', '클라우드 이미지 보관', Math.round(g * 1000) / 1000, 'GiB', R.arFreeGiB, Math.max(0, g - R.arFreeGiB), R.arGiBMonth / dim, Math.max(0, g - R.arFreeGiB) * R.arGiBMonth / dim, '배포할 때마다 쌓임 — deploy.sh가 최근 3개만 남기게 정리'); }
    const ref = C('app_settings').doc('costs_auto_' + ym); const rec = { rate: fx.rate, rateSrc: fx.src, lines: lines.map((x) => ({ ...x, krw: Math.round(x.usd * fx.rate) })), basis: '공식 단가 × 측정 사용량 − 무료 한도 (추정 — 실제는 청구서)', ratesAsOf: R.asOf, src: 'Cloud Monitoring', at: nowIso(), errs: U.err || null };
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); if (sn.exists && (sn.data().days || {})[day]) return; tx.set(ref, { ym, cat: '데이터 관리', vendor: 'Google Cloud (Firebase)', days: { [day]: rec }, ...W() }, { merge: true }); }); // 이미 적은 날은 그대로
    st.month = mo; st.lastDay = day; await ST.set({ lastDay: day, month: mo, bucketLoc, fsBytes, fsBytesAt: fsBytes != null ? (st.fsBytesAt && Date.now() - Date.parse(st.fsBytesAt) < 7 * 864e5 ? st.fsBytesAt : nowIso()) : null, arBytes, at: nowIso(), errs: U.err || null, ratesAsOf: R.asOf }, { merge: true });
    done.push({ day, krw: lines.reduce((a, x) => a + Math.round(x.usd * fx.rate), 0), err: U.err || null }); }
  return { done }; }
let costNextAt = 0;

/* ── (0.5.8) 개편 1단계 '결과 기록' — 판정 → 실행 → 판매를 한 줄로 잇는 매일 기록 (기계 학습의 재료) ──
 *  ① ml_days/{날짜}_{n}: 하루 한 번(한국 1시 뒤) 판매중 상품 전체의 그날 모습 — 가격·등급·재고 기간·시장(첫 페이지 우리 자리·같은 등급 최저·전체 중고 수·매입가·판매 지수)·
 *     마지막 가격 변경·속한 감시 그룹. 칸마다 배열(열 단위)로 2000개씩 나눠 저장 → 하루 몇 문서. 판매 여부는 나중에 주문과 이어 붙임(다음 날들의 기록·주문으로)
 *  ② ml_outcomes/{반영 기록 id}: 가격을 바꾼 기록마다 그 뒤 팔렸는지·언제·얼마에·몇 시간 만에 (60일이 지나거나 팔리면 '닫힘' — 닫힌 것은 다시 쓰지 않음)
 *  ③ app_settings/ml_state: 마지막으로 만든 날·상품 수·어제 판매가 기록에 이어진 비율(로드맵 1단계 관문: 하루치 판매가 모두 이어짐)
 *  모든 값은 다시 계산할 수 있는 파생 자료 — 수집한 원래 기록(상품·시장·주문)은 건드리지 않음 */
const ML_VER = 1;
const shard = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
async function mlSales(fromIso) { const out = new Map(); const t0 = Date.parse(fromIso); const day0 = new Date(t0 + 9 * 3600e3).toISOString().slice(0, 10); const kms = (s) => Date.parse(/[T]/.test(String(s)) ? s : String(s).replace(' ', 'T') + '+09:00');
  const add = (u, s) => { const L = out.get(u) || out.set(u, []).get(u); if (!L.some((x) => x.ono === s.ono)) L.push(s); };
  const bad = new Set(); const co = await C('crm_orders').where('orderedAt', '>=', day0).get(); co.forEach((d) => { const o = d.data(); const t = kms(o.orderedAt); if (!(t >= t0) || (o.kind && o.kind !== 'sale')) return; (o.items || []).forEach((it) => { if (!it.aladinUsedCode) return; if (it.lineStatus && it.lineStatus !== 'normal') { bad.add(o.orderNo + '|' + it.aladinUsedCode); return; } add(it.aladinUsedCode, { ono: o.orderNo, at: t, price: it.price || 0, src: 'crm' }); }); });
  const lid2u = new Map(); (await C('prd_listings').select('usedCode', 'listingId').get()).forEach((d) => { const v = d.data(); if (v.listingId) lid2u.set(String(v.listingId), v.usedCode); });
  const so = await C('shp_orders').where('orderedAt', '>=', day0).get(); so.forEach((d) => { const o = d.data(); const t = kms(o.orderedAt); if (!(t >= t0)) return; (o.items || []).forEach((it) => { const u = lid2u.get(String(it.listingId)); if (!u || bad.has(o.orderNo + '|' + u)) return; add(u, { ono: o.orderNo, at: t, price: it.price || 0, src: 'shp' }); }); });
  return out; }
async function mlSnapshot(day) { const t0 = Date.now(); const L = []; (await C('prd_listings').where('active', '==', true).get()).forEach((d) => L.push({ id: d.id, ...d.data() }));
  const bids = [...new Set(L.map((l) => l.bookId).filter(Boolean))]; const M = new Map(); for (const part of shard(bids, 300)) { (await db.getAll(...part.map((b) => C('prd_book_metrics').doc(String(b))))).forEach((d) => { if (d.exists) M.set(d.id, d.data()); }); }
  const since = new Date(Date.now() - 90 * 864e5).toISOString(); const lastAct = new Map(); (await C('prd_price_actions').where('at', '>=', since).get()).forEach((d) => { const a = d.data(); if (!a.key || a.to == null) return; const p = lastAct.get(a.key); if (!p || String(a.at) > String(p.at)) lastAct.set(a.key, { ...a, id: d.id }); });
  const watch = new Map(); try { (await C('prd_price_decisions').where('watch.gid', '>', '').get()).forEach((d) => { const w = d.data().watch; if (w && w.gid) watch.set(d.id, w.gid); }); } catch (e) {}
  const now = Date.parse(day + 'T23:59:59+09:00'); const ML = await mlMod(); if (!ML) throw new Error('학습 파일(readnow-ml-core.js)이 없어 하루 모습을 못 만듦');
  const rows = L.map((l) => ML.rawRow(l, M.get(String(l.bookId)), lastAct.get(l.id), watch.get(l.id), now)); // (0.8.0) 한 줄 만드는 곳은 readnow-ml-core.js 한 곳 — 웹앱도 같은 것으로 지금 상품을 셈
  const cols = Object.keys(rows[0] || { key: 0 }); const parts = shard(rows, 2000); const b = db.batch(); parts.forEach((p, i) => { const o = {}; cols.forEach((c) => (o[c] = p.map((r) => r[c]))); b.set(C('ml_days').doc(`${day}_${String(i).padStart(2, '0')}`), { day, i, n: p.length, ver: ML_VER, cols: o, ...W() }); });
  b.set(C('ml_days').doc(day), { day, shards: parts.length, n: rows.length, ver: ML_VER, colNames: cols, at: nowIso(), ms: Date.now() - t0, ...W() }); await b.commit(); return { n: rows.length, shards: parts.length }; }
async function mlOutcomes() { const since = new Date(Date.now() - 90 * 864e5).toISOString(); const acts = []; (await C('prd_price_actions').where('at', '>=', since).get()).forEach((d) => { const a = d.data(); if (a.key && a.to != null && a.kind !== 'hold' && a.kind !== 'unhold') acts.push({ id: d.id, ...a }); });
  if (!acts.length) return { n: 0 }; const closed = new Set(); (await C('ml_outcomes').where('at', '>=', since).select('closed').get()).forEach((d) => { if (d.get('closed')) closed.add(d.id); }); /* (0.9.3) 90일 안 것만 읽음 — 예전엔 닫힌 결과 전체를 날마다 읽어 쌓일수록 비용이 늘었음 */ const open = acts.filter((a) => !closed.has(a.id)); if (!open.length) return { n: 0 };
  const todo = open.sort((x, y) => String(x.at).localeCompare(String(y.at))).slice(0, 450); // 하루 450개까지(오래된 것부터) — 남으면 다음 날 이어서
  const first = String(todo[0].at); const sales = await mlSales(first); let n = 0, nSold = 0; const b = db.batch();
  for (const a of todo) { const t = Date.parse(a.at); const s = (sales.get(a.usedCode) || []).filter((x) => x.at >= t).sort((x, y) => x.at - y.at)[0] || null; const age = (Date.now() - t) / 864e5;
    b.set(C('ml_outcomes').doc(a.id), { key: a.key, usedCode: a.usedCode || null, at: a.at, from: a.from ?? null, to: a.to, kind: a.kind || null, batchId: a.batchId || null, batchName: a.batchName || null, sold: !!s, soldAt: s ? new Date(s.at).toISOString() : null, soldPrice: s ? s.price : null, hours: s ? Math.round((s.at - t) / 36e5 * 10) / 10 : null, src: s ? s.src : null, closed: !!s || age > 60, checkedAt: nowIso(), ver: ML_VER, ...W() }); n++; if (s) nSold++; }
  await b.commit(); return { n, nSold, open: open.length }; }

async function mlCheck(day) { // 관문: 어제 판매가 기록(그 전날 판매중 모습 또는 반영 기록)에 이어졌는지
  const t0 = Date.parse(day + 'T00:00:00+09:00'); const sales = await mlSales(new Date(t0).toISOString()); const prev = new Date(t0 - 864e5 + 9 * 3600e3).toISOString().slice(0, 10); let keys = new Set();
  const meta = await C('ml_days').doc(prev).get(); if (meta.exists) for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_days').doc(`${prev}_${String(i).padStart(2, '0')}`).get(); if (d.exists) (d.data().cols.key || []).forEach((k) => keys.add(k)); }
  let n = 0, hit = 0; for (const [u, L] of sales) { const inDay = L.filter((s) => s.at < t0 + 864e5); if (!inDay.length) continue; n += inDay.length; if (keys.has('aladin_' + u)) hit += inDay.length; }
  return { day, sales: n, linked: hit, prevSnapshot: meta.exists }; }
async function mlDaily() { const ST = C('app_settings').doc('ml_state'); const st = (await ST.get()).data() || {}; const k = new Date(Date.now() + 9 * 3600e3); if (k.getUTCHours() < 1) return { skip: '1시 뒤에' };
  const today = k.toISOString().slice(0, 10); if (st.lastDay === today) return { skip: '오늘 함' };
  const snap = await mlSnapshot(today); let out = null; try { out = await mlOutcomes(); } catch (e) { out = { err: e.message }; } let chk = null; try { chk = await mlCheck(new Date(Date.parse(today + 'T00:00:00+09:00') - 864e5 + 9 * 3600e3).toISOString().slice(0, 10)); } catch (e) { chk = { err: e.message }; }
  await ST.set({ lastDay: today, snap, outcomes: out, check: chk, ver: ML_VER, at: nowIso(), days: FV.arrayUnion(today) }, { merge: true }); return { snap, out, chk }; }

/* ── (0.8.0) 개편 6단계 '스스로 배우기' — 팔릴 확률 모델 (계산은 readnow-ml-core.js 한 곳, 웹앱과 같음)
 *  매일(한국 2시 뒤, 결과 기록 뒤) ① 배우기: 7일이 지나 결과를 아는 날들(최근 60일)의 하루 모습 + 그 뒤 7일 판매 → 새 모델(도전자)
 *  ② 그림자: 오늘 판매중 상품마다 지금 모델·도전자의 확률을 적어 두기만(ml_shadow) — 실제 판단에는 쓰지 않음
 *  ③ 채점: 7일이 지난 그림자를 실제 판매와 맞춰 로그 손실·AUC(ml_eval) ④ 승격: (0.9.3) 고정한 후보 하나가 지금 모델과 겨룬 채점 3번이 모두 1% 넘게 나으면 그 후보를 지금 모델로(ml_state.model, 기록 남김) — 아니면 탈락, 새 후보
 *  처음 지금 모델 = 기준선(1위 여부 × 등급별 평균 판매율). 모델은 조언 금액에만 쓰임 — 알라딘을 바꾸지 않음 */
let ML_LOCAL = null; try { ML_LOCAL = require('./readnow-ml-core.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 학습 파일 없음 — GitHub에서 받음', e.message); }
let MLM = ML_LOCAL, mlmAt = 0;
async function mlMod() { if (MLM) coreVer['readnow-ml-core.js'] = MLM.VERSION; if (MLM && (ML_LOCAL || Date.now() - mlmAt < 30 * 60e3)) return MLM; mlmAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-ml-core.js?t=' + Date.now()); if (r.ok) { const m = { exports: {} }; new Function('module', 'exports', await r.text())(m, m.exports); if (m.exports && m.exports.train) MLM = m.exports; } } catch (e) { log('학습 파일 받기 실패', e.message); }
  if (MLM) coreVer['readnow-ml-core.js'] = MLM.VERSION; return MLM; }
function trainOff(ML, X, Y) { if (!ML_LOCAL) return Promise.resolve(ML.train(X, Y)); // 함께 올린 파일이 있을 때만 일꾼을 씀 (없으면 이 자리에서)
  return new Promise((res) => { try { const { Worker } = require('worker_threads'); const w = new Worker(`const { parentPort, workerData } = require('worker_threads'); const ML = require(workerData.path); parentPort.postMessage(ML.train(workerData.X, workerData.Y));`, { eval: true, workerData: { path: require.resolve('./readnow-ml-core.js'), X, Y } });
    w.once('message', (m) => { res(m); w.terminate(); }); w.once('error', (e) => { log('일꾼 배우기 실패 — 이 자리에서', e.message); res(ML.train(X, Y)); }); } catch (e) { res(ML.train(X, Y)); } }); }
async function mlLoadDay(day) { const meta = await C('ml_days').doc(day).get(); if (!meta.exists) return null; const rows = [];
  for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_days').doc(`${day}_${String(i).padStart(2, '0')}`).get(); if (!d.exists) continue; const cols = d.data().cols || {}; const names = Object.keys(cols); const n = (cols.key || []).length; for (let k = 0; k < n; k++) { const r = {}; names.forEach((c) => (r[c] = cols[c][k])); rows.push(r); } }
  return rows; }
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const dayEnd = (d) => Date.parse(d + 'T23:59:59+09:00');
function mlLabel(ML, rows, day, sales) { const t0 = Date.parse(day + 'T01:00:00+09:00'), t1 = t0 + ML.HORIZON_D * 864e5; /* (0.9.3) 하루 모습은 한국 1시 뒤에 찍음 → 그때부터 7일 (예전엔 그날 밤 23:59부터라 그날 팔린 책을 '안 팔림'으로 셈 — 잘 팔리는 책일수록 빠져 확률이 낮게 나왔음) */ return rows.map((r) => { const u = String(r.key || '').replace(/^aladin_/, ''); return (sales.get(u) || []).some((s) => s.at > t0 && s.at <= t1) ? 1 : 0; }); }
async function mlShadowWrite(day, champId, challId, rows, pc, ph) { const parts = shard(rows.map((r, i) => [r.key, pc[i], ph[i]]), 2000); const b = db.batch();
  parts.forEach((p, i) => b.set(C('ml_shadow').doc(`${day}_${String(i).padStart(2, '0')}`), { day, i, keys: p.map((x) => x[0]), pc: p.map((x) => x[1] == null ? null : Math.round(x[1] * 1000) / 1000), ph: p.map((x) => x[2] == null ? null : Math.round(x[2] * 1000) / 1000), ...W() }));
  b.set(C('ml_shadow').doc(day), { day, shards: parts.length, n: rows.length, champId, challId, at: nowIso(), ...W() }); await b.commit(); }
async function mlShadowLoad(day) { const meta = await C('ml_shadow').doc(day).get(); if (!meta.exists) return null; const out = { ...meta.data(), keys: [], pc: [], ph: [] };
  for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_shadow').doc(`${day}_${String(i).padStart(2, '0')}`).get(); if (!d.exists) continue; const v = d.data(); out.keys.push(...v.keys); out.pc.push(...v.pc); out.ph.push(...v.ph); } return out; }
async function mlLearn() { const ML = await mlMod(); if (!ML) return { skip: '학습 파일 없음' }; const ST = C('app_settings').doc('ml_state'); const st = (await ST.get()).data() || {}; const k = new Date(Date.now() + 9 * 3600e3);
  const today = k.toISOString().slice(0, 10); if (k.getUTCHours() < 2) return { skip: '2시 뒤에' }; if (st.lastDay !== today) return { skip: '오늘 결과 기록 먼저' }; if ((st.learn || {}).day === today) return { skip: '오늘 함' };
  const t0 = Date.now(); const days = [...new Set(st.days || [])].sort(); const lastLab = kday(Date.now() - (ML.HORIZON_D + 1) * 864e5); const lab = days.filter((d) => d <= lastLab).slice(-60);
  const champ0 = st.model && st.model.champion ? ((await C('ml_models').doc(st.model.champion).get()).data() || null) : null;
  const res = { day: today, labDays: lab.length, days: days.length, ver: ML.VERSION };
  // ③ 채점 먼저: 7일 지난 그림자
  const evals = []; try { const sales0 = lab.length ? await mlSales(new Date(dayEnd(lab[0]) - 864e5).toISOString()) : new Map();
    for (const d of days.filter((x) => x <= lastLab).slice(-14)) { const ev = await C('ml_eval').doc(d).get(); if (ev.exists) { evals.push(ev.data()); continue; } const sh = await mlShadowLoad(d); if (!sh) continue;
      const y = mlLabel(ML, sh.keys.map((key) => ({ key })), d, sales0); const ic = sh.pc.map((v, i) => [v, y[i]]).filter((x) => x[0] != null); const ih = sh.ph.map((v, i) => [v, y[i]]).filter((x) => x[0] != null);
      const e = { day: d, champId: sh.champId, challId: sh.challId, champ: ML.evaluate(ic.map((x) => x[0]), ic.map((x) => x[1])), chall: sh.challId ? ML.evaluate(ih.map((x) => x[0]), ih.map((x) => x[1])) : null, at: nowIso() }; await C('ml_eval').doc(d).set({ ...e, ...W() }); evals.push(e); } } catch (e) { res.evalErr = e.message; }
  res.evals = evals.length;
  if (lab.length < 3) { await ST.set({ learn: { day: today, state: 'wait', why: `결과를 아는 날 ${lab.length}일 — 3일부터 배움 (하루 모습을 쌓은 지 ${days.length}일)`, at: nowIso() } }, { merge: true }); return { ...res, wait: true }; }
  // ① 배우기
  const sales = await mlSales(new Date(dayEnd(lab[0]) - 864e5).toISOString()); const X = [], Y = [], R0 = [], D = [];
  let tot = 0; for (const d of lab) { const m0 = await C('ml_days').doc(d).get(); tot += m0.exists ? m0.data().n || 0 : 0; } const stride = Math.max(1, Math.ceil(tot / 200000)); res.stride = stride; // 메모리·시간: 많으면 고르게 줄여서 (최대 약 20만 줄)
  for (const d of lab) { const rows = await mlLoadDay(d); if (!rows) continue; const y = mlLabel(ML, rows, d, sales); rows.forEach((r, i) => { if (i % stride) return; const x = ML.feats(r); if (!x) return; X.push(x); Y.push(y[i]); R0.push(r); D.push(d); }); }
  if (X.length < 200) { await ST.set({ learn: { day: today, state: 'wait', why: `배울 줄 ${X.length}개 — 200개부터`, at: nowIso() } }, { merge: true }); return { ...res, wait: true, rows: X.length }; }
  const valFrom = lab.length >= 10 ? lab[lab.length - 7] : lab[Math.floor(lab.length * 0.7)]; const tr = [], va = []; D.forEach((d, i) => (d < valFrom ? tr : va).push(i)); if (!tr.length || !va.length) { tr.length = 0; va.length = 0; D.forEach((d, i) => (i % 5 ? tr : va).push(i)); }
  const cap = 150000; const trS = tr.length > cap ? tr.filter((_, i) => i % Math.ceil(tr.length / cap) === 0) : tr; // 많으면 고르게 줄여서 (시간·비용)
  const mdl = await trainOff(ML, trS.map((i) => X[i]), trS.map((i) => Y[i])); /* (0.9.0) 따로 도는 일꾼(worker)에서 — 배우는 동안에도 주문 읽기가 멈추지 않게 */ const base = ML.trainBase(tr.map((i) => R0[i]), tr.map((i) => Y[i]));
  const champ = champ0 || base; const pv = (M) => va.map((i) => ML.predict(M, R0[i])); const vy = va.map((i) => Y[i]);
  const val = { chall: ML.evaluate(pv(mdl), vy), champ: ML.evaluate(pv(champ), vy), base: ML.evaluate(pv(base), vy) };
  const challId = 'm_' + today; await C('ml_models').doc(challId).set({ ...mdl, id: challId, trainedAt: nowIso(), nTrain: trS.length, nVal: va.length, labDays: lab.length, valFrom, val, ...W() });
  if (!champ0) await C('ml_models').doc('base_' + today).set({ ...base, id: 'base_' + today, trainedAt: nowIso(), ...W() });
  const champId = champ0 ? st.model.champion : 'base_' + today;
  /* (0.9.3) 도전자를 며칠 고정: 그림자 채점을 받은 바로 그 모델만 승격 (예전엔 날마다 새 도전자로 그림자를 적고, 승격은 채점받지 않은 오늘 모델을 올렸음)
   *  후보(candidate) = 지금 모델과 겨루는 한 모델 · 그 후보의 채점이 3번 모이면 승격 또는 탈락 → 다음 날 새 후보 · 후보가 14일 넘게 채점 3번을 못 모으면 새 후보 */
  const cand0 = st.model && st.model.candidate; let candId = cand0 && cand0.id, candM = null;
  if (candId && (cand0.champ !== champId || Date.parse(today) - Date.parse(cand0.since || today) > 14 * 864e5)) candId = null;
  if (candId) { candM = (await C('ml_models').doc(candId).get()).data() || null; if (!candM) candId = null; }
  const candEv = candId ? evals.filter((e) => e.challId === candId && e.champId === champId).sort((a, b) => String(a.day).localeCompare(String(b.day))) : [];
  let pr = { ok: false, why: candId ? `후보 ${candId} 채점 ${candEv.length}/3번` : '새 후보' }; let nextCand = candId ? cand0 : null;
  if (candId && candEv.length >= 3) { pr = ML.shouldPromote(candEv); if (!pr.ok) { pr = { ...pr, rejected: candId }; nextCand = null; candId = null; candM = null; } }
  if (!candId) { candId = challId; candM = mdl; nextCand = { id: challId, since: today, champ: champId }; }
  // ② 그림자: 오늘 상품 — 지금 모델 · 후보
  let shadowN = 0; try { const rows = await mlLoadDay(today); if (rows && rows.length) { await mlShadowWrite(today, champId, candId, rows, rows.map((r) => ML.predict(champ, r)), rows.map((r) => ML.predict(candM, r))); shadowN = rows.length; } } catch (e) { res.shadowErr = e.message; }
  // ④ 승격 (채점받은 후보만)
  const model = { champion: champ0 ? st.model.champion : champId, kind: champ.kind, since: (st.model && st.model.since) || today, latestChallenger: challId, candidate: nextCand };
  if (pr.ok && nextCand && nextCand.id !== challId) { const to = nextCand.id; model.champion = to; model.kind = 'logit'; model.since = today; model.candidate = { id: challId, since: today, champ: to }; model.lastPromotion = { at: nowIso(), from: champId, to, why: pr.why, evals: candEv.map((e) => e.day) }; log('모델 승격', champId, '→', to, pr.why); }
  await ST.set({ learn: { day: today, state: 'ok', rows: X.length, train: trS.length, val: va.length, valFrom, metrics: val, shadow: shadowN, promote: pr, ms: Date.now() - t0, at: nowIso() }, model, ...(pr.ok ? { promotions: FV.arrayUnion(model.lastPromotion) } : {}) }, { merge: true });
  return { ...res, rows: X.length, val, shadowN, promote: pr }; }
let mlNextAt = 0, learnNextAt = 0, lastDailyAt = Date.now(), dailyBusy = false;
/* (0.9.0) 무거운 하루 일(비용·결과 기록·배우기)은 주문 읽기(/tick)와 따로 /daily(10분마다 예약)에서 — 예전엔 1분 회차 끝에 붙어 있어, 길어지면 다음 회차(주문 읽기)를 건너뛰었음 */
async function dailyJobs() { if (dailyBusy) return { skipped: true }; dailyBusy = true; lastDailyAt = Date.now(); const out = {};
  try { if (Date.now() > costNextAt) { try { const r = await costDaily(4); out.costs = r; costNextAt = r.skip ? Date.now() + 15 * 60e3 : 0; if (r.done && r.done.length) log('비용 기록', JSON.stringify(r.done)); } catch (e) { costNextAt = Date.now() + 30 * 60e3; out.costsErr = e.message; log('비용 기록 실패', e.message); } }
    if (Date.now() > mlNextAt) { try { const r = await mlDaily(); out.ml = r.skip ? undefined : r; mlNextAt = Date.now() + (r.skip ? 15 : 60) * 60e3; if (!r.skip) log('결과 기록', JSON.stringify(r).slice(0, 400)); } catch (e) { mlNextAt = Date.now() + 30 * 60e3; out.mlErr = e.message; log('결과 기록 실패', e.message); } }
    if (Date.now() > learnNextAt) { try { const r = await mlLearn(); learnNextAt = Date.now() + (r.skip ? 20 : 120) * 60e3; if (!r.skip) { out.learn = r; log('스스로 배우기', JSON.stringify(r).slice(0, 400)); } } catch (e) { learnNextAt = Date.now() + 60 * 60e3; out.learnErr = e.message; log('스스로 배우기 실패', e.message); } }
  } finally { dailyBusy = false; } return out; }
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ''; if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  const path = (req.url || '/').split('?')[0];
  try {
    if (path === '/status' || path === '/') return send(200, { ok: true, ver: VER, cores: coreVer, login: loginFailAt ? 'fail' : 'unknown', hasCred: !!(ALADIN_ID && ALADIN_PW) });
    if (path === '/tick') { if (!TICK_KEY || req.headers['x-tick-key'] !== TICK_KEY) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); if (tickBusy) return send(200, { ok: true, skipped: '앞 회차가 아직 도는 중' }); tickBusy = true; try { const out = await serial(() => tick('schedule')); try { const sw = await sysSweep(); if (sw.ev) out.sweep = sw; } catch (e) { out.sweepErr = e.message; log('맡긴 일 살피기 실패', e.message); }
      if (Date.now() - lastDailyAt > 3 * 3600e3) { out.daily = await dailyJobs().catch((e) => ({ err: e.message })); } // 예비: /daily 예약이 3시간 넘게 없으면(예전 deploy) 여기서 — deploy.sh를 다시 돌리면 /daily가 따로 맡음
      return send(200, out); } finally { tickBusy = false; } }
    if (path === '/daily') { if (!TICK_KEY || req.headers['x-tick-key'] !== TICK_KEY) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); if (dailyBusy) return send(200, { ok: true, skipped: '앞 회차가 아직 도는 중' }); const out = await dailyJobs(); return send(200, out); }
    if (path === '/kick') { await authUser(req); KICK(); if (tickBusy) return send(200, { ok: true, queued: '도는 회차가 바로 처리 (빠른 고리)' }); tickBusy = true; try { const out = await serial(() => tick('kick')); return send(200, out); } finally { tickBusy = false; } } // (0.9.0) 회차가 돌고 있으면 기다리지 않고 그 회차의 빠른 고리가 바로 처리
    if (path === '/lookup') { await authUser(req); const b = await bodyOf(req); const out = await serial(() => lookup(b)); return send(200, out); }
    if (path === '/inventory') { await authUser(req); return send(200, await inventory()); }
    if (path === '/storage-files') { await authUser(req); const b = await bodyOf(req); const pre = String(b.prefix || ''); if (!/^[A-Za-z0-9_\-\/]*$/.test(pre)) return send(400, { ok: false, err: '폴더 이름이 이상함' }); return send(200, { ok: true, files: await storageFiles(pre) }); }
    if (path === '/ppt') { const u = await authUser(req); const b = await bodyOf(req); return send(200, await pptStore(b, u)); }
    if (path === '/spines') { await authUser(req); const b = await bodyOf(req); if (!b.image) return send(400, { ok: false, err: '사진 없음' }); const out = await spines(String(b.image).replace(/^data:[^,]+,/, '')); return send(200, out); }
    if (path === '/test') { await authUser(req); const out = await serial(async () => { const p = await getPage(); try { await login(p); return { ok: true, login: 'ok', cores: coreVer }; } catch (e) { return { ok: false, login: 'fail', err: e.message }; } }); return send(200, out); }
    return send(404, { ok: false, err: '없는 주소' });
  } catch (e) { log('요청 실패', path, e.message); return send(e.code && e.code < 600 ? e.code : 500, { ok: false, err: e.message }); }
});
server.listen(process.env.PORT || 8080, () => log(`readnow-cloud ${VER} 시작`));
