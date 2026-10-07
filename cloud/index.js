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
 *  - /spines (웹앱 '사진 가격' 책등 사진 → Google Vision 글자 읽기 → 책등마다 글자 묶음)
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

const VER = '0.5.2';
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

/* ── 브라우저 (하나를 계속 씀, 일은 한 번에 하나씩) ── */
let browser = null, page = null, pageAt = 0; let chain = Promise.resolve(); let tickBusy = false; // 1분 예약이 겹치면(앞 회차가 길면) 건너뜀 — 쌓이지 않게
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
async function getPage() {
  if (!browser || !browser.connected) { browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--lang=ko-KR'] }); page = null; }
  if (page && !page.isClosed() && Date.now() - pageAt > 6 * 3600e3) { try { await page.close(); } catch (e) {} page = null; log('화면 새로 만듦 (6시간마다 — 메모리 정리, 로그인은 유지)'); } // 오래 켜 둔 화면은 메모리가 쌓임
  if (!page || page.isClosed()) { pageAt = Date.now(); page = await browser.newPage(); await page.setBypassCSP(true); /* 기준 파일을 넣으려고 (수집기도 Tampermonkey로 같은 일) */ await page.setUserAgent(UA); await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' }); page.setDefaultTimeout(60000); }
  if (!/aladin\.co\.kr/.test(page.url())) { await page.goto(AL + '/', { waitUntil: 'domcontentloaded' }); injectedSrc = null; } // 새 화면 = 기준 파일 다시 넣기
  await ensureCores(page); return page;
}
// 기준 파일이 GitHub에서 바뀌면(30분마다 확인) 열린 화면에도 새 판을 다시 넣음 — 예전엔 처음 넣은 판을 계속 써서 파서 고침이 반영되지 않았음
let injectedSrc = null;
async function ensureCores(p) { const src = await cores(); const has = await p.evaluate(() => !!(window.ReadnowShipping && window.ReadnowProducts && window.ReadnowPricing && window.ReadNowCore)).catch(() => false); if (!has || injectedSrc !== src) { await p.addScriptTag({ content: src }); injectedSrc = src; } }

/* ── 로그인 (PC 수집기의 자동 로그인과 같은 방식: 보이는 아이디 칸 + 비밀번호 칸 + 로그인 단추) ── */
let loginFailAt = 0, loginFailMsg = null;
async function loggedIn(p) { return p.evaluate(async () => { try { const r = await fetch('/scm/worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return false; const d = new DOMParser().parseFromString(h, 'text/html'); return !(d.querySelector('input[type="password"]') && !/샵매니저/.test(d.title || '')); } catch (e) { return false; } }); }
async function login(p) {
  if (await loggedIn(p)) return true;
  if (!ALADIN_ID || !ALADIN_PW) throw new Error('알라딘 아이디·비밀번호 비밀(ALADIN_ID·ALADIN_PW)이 없음');
  if (loginFailAt && Date.now() - loginFailAt < 30 * 60e3) throw new Error('로그인 실패 뒤 30분 쉬는 중 (계정 잠김 방지): ' + (loginFailMsg || ''));
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
  if (ok !== 'sent') { loginFailAt = Date.now(); loginFailMsg = '로그인 화면 모양이 다름 (' + ok + ')'; throw new Error(loginFailMsg); }
  await p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await sleep(1500);
  if (!/aladin\.co\.kr/.test(p.url())) await p.goto(AL + '/', { waitUntil: 'domcontentloaded' });
  await ensureCores(p);
  if (!(await loggedIn(p))) { const msg = await p.evaluate(() => (document.body.innerText.match(/(아이디|비밀번호|보안|인증|자동입력)[^\n]{0,80}/) || [''])[0]).catch(() => ''); loginFailAt = Date.now(); loginFailMsg = msg || '로그인 뒤에도 샵매니저가 열리지 않음'; throw new Error('알라딘 로그인 실패: ' + loginFailMsg); }
  loginFailAt = 0; loginFailMsg = null; log('로그인 됨'); return true;
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
  const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)])); const ref = C('shp_state').doc('confirm'); const cc = (await ref.get()).data();
  const changed = !cc || cc.sig !== csig; const keepL = new Set(rc.orders.flatMap((o) => o.items.map((i) => String(i.listingId))));
  const enrich = {}; for (const [k, v] of Object.entries((cc && cc.enrich) || {})) if (keepL.has(k) || (v && v.at && Date.now() - Date.parse(v.at) < 3 * 864e5)) enrich[k] = v; // 남은 주문의 보강은 그대로 이어 씀(다시 읽지 않음) · 발송 요청으로 넘어간 주문도 3일은 남겨 ② 탭에서 씀
  if (changed) { const bc = db.batch(); bc.set(ref, { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: 'cloud', enrich, ...W() });
    for (const o of rc.orders) bc.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }, { merge: true });
    await bc.commit(); }
  return { n: rc.orders.length, changed, enrich, tabCounts: rc.tabCounts, prevTab: cc && cc.tabCounts }; }

/* 상품 보강: 우리 상품 기록(prd_listings·prd_books·prd_used_info) + 지금 시장(온라인 중고 첫 페이지 1번 + 판매자 분류)
   · 기존 시장 지표(prd_book_metrics)는 건드리지 않음 — 시장은 shp_market 에 새 문서로 쌓고(덮어쓰지 않음), 화면용 사본만 confirm.enrich 에
   · 시간 상자: 한 회차에 최대 40초 — 넘으면 다음 회차(1분 뒤)에 이어 함. 한 권 실패는 그 책만 건너뜀 */
async function ourOf(listingId) {
  const L = await C('prd_listings').where('listingId', 'in', [String(listingId), Number(listingId)].filter((x) => x === x)).limit(1).get(); const l = L.empty ? null : L.docs[0].data();
  const b = l && l.bookId ? (await C('prd_books').doc(l.bookId).get()).data() : null; const ui = (await C('prd_used_info').doc(String(listingId)).get()).data();
  const img = b && b.images && b.images.front ? (b.images.front.stored || b.images.front.src || null) : null;
  return { key: L.empty ? null : L.docs[0].id, usedCode: l ? l.usedCode || null : null, bookId: l ? l.bookId || null : null, grade: l ? l.grade || null : null, sku: l ? l.sku || null : null, regAt: l ? l.registeredAt || l.regDate || null : null,
    itemId: b && b.aladinItemId ? String(b.aladinItemId) : null, cover: img, note: ui ? ui.note || null : (l && l.condition) || null, photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : [], ui: ui || null }; }
async function marketOf(p, itemId, ourUsed) {
  const u = await p.evaluate(async (id) => { const r = await fetch(`/shop/UsedShop/wuseditemall.aspx?ItemId=${id}&TabType=0`, { credentials: 'include' }); if (!r.ok) throw new Error('HTTP ' + r.status); return window.ReadnowProducts.parseUsedPage(new DOMParser().parseFromString(await r.text(), 'text/html')); }, itemId);
  const codes = [...new Set((u.listings || []).map((r) => r.sellerCode).filter((c) => c && String(c) !== '0' && String(c) !== '996008'))];
  const sd = {}; if (codes.length) (await db.getAll(...codes.map((c) => C('sellers').doc('sc_' + c)))).forEach((d) => { if (d.exists) sd[d.id] = d.data(); });
  const rows = await p.evaluate((L, sd, ourUsed) => { const PRC = window.ReadnowPricing, RNC = window.ReadNowCore, RS = window.ReadnowSellers;
    return L.map((r, i) => { const ours = String(r.sellerCode) === '996008' || (ourUsed && r.usedCode === ourUsed); const d = r.sellerCode ? sd['sc_' + r.sellerCode] : null; let c = 'unknown';
      try { c = ours ? 'ours' : PRC && PRC.isAladinSide(r) ? 'aladin' : d && RNC ? RNC.classifySellerDoc(d, RS).cls : 'unknown'; } catch (e) {}
      return { r: i + 1, n: r.sellerName || null, sc: r.sellerCode || null, g: r.grade || null, p: r.price ?? null, s: r.ship ?? null, lid: r.listingId || null, so: r.soldOut ? 1 : 0, c }; }); }, u.listings || [], sd, ourUsed || null);
  return { u, rows }; }
async function enrichConfirm(p, cr, force, until) {
  const t0 = Date.now(); const stopAt = Math.min(t0 + 40000, until || Infinity); const ref = C('shp_state').doc('confirm'); let n = 0, fail = 0; const todo = [];
  for (const o of lastConfirm) for (const it of o.items || []) { const lid = String(it.listingId || ''); if (!lid) continue; const e = cr.enrich[lid]; if (e && e.mkt && e.uiAt && !(force && force.has(lid))) continue; const uiOnly = e && (e.mkt || e.mktErr) && !e.uiAt; if (!uiOnly && (skipUntil.get(lid) || 0) > Date.now() && !(force && force.has(lid))) continue; todo.push({ o, it, lid }); }
  for (const t of todo) { if (Date.now() > stopAt) break;
    try { const prevE = cr.enrich[t.lid];
      if (prevE && (prevE.mkt || prevE.mktErr) && !prevE.uiAt && !(force && force.has(t.lid))) { // (0.5.0) 시장은 이미 읽음 — 우리 매물 유의 사항·사진만 채움 (시장을 다시 읽지 않음)
        let ui0 = (await C('prd_used_info').doc(String(t.lid)).get()).data(); if (looksBlanked(ui0)) ui0 = await repairUsedInfo(t.lid, ui0); let ui = ui0;
        if (!ui0 || !ui0.checkedAt || Date.now() - Date.parse(ui0.checkedAt) > 864e5) ui = (await refreshUsedInfo(p, t.lid, ui0)) || ui0;
        const E2 = { ...prevE, note: (ui && ui.note) || prevE.note || null, photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : prevE.photos || [], uiAt: nowIso() };
        await ref.update(new FieldPath('enrich', t.lid), E2); cr.enrich[t.lid] = E2; n++; await sleep(300); continue; }
      const our = await ourOf(t.lid); let itemId = our.itemId, via = 'ours';
      if (looksBlanked(our.ui)) { const r = await repairUsedInfo(t.lid, our.ui); if (r && r.note) our.note = r.note; if (r && r.photos) our.photos = r.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); our.ui = r; }
      if (!our.ui || !our.ui.checkedAt || Date.now() - Date.parse(our.ui.checkedAt) > 864e5) { try { const ui = await refreshUsedInfo(p, t.lid, our.ui); if (ui) { our.note = ui.note || our.note; if ((ui.photos || []).length) our.photos = ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); } } catch (e) { log('유의 사항 읽기 실패', t.lid, e.message); } } // 주문확인요청 상품도 우리 매물 유의 사항·사진을 바로 읽음 (예전엔 발송 요청 때만)
      if (!itemId && t.it.title) { const q = String(t.it.title).replace(/^\[[^\]]*\]\s*/, '');
        const c = await p.evaluate(async (q) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(q), { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
          return P.parseSearchResults(d).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: P.nameCoverage(q, x.title), img: x.img || null })).filter((x) => x.cov >= 0.9).sort((a, b) => b.cov - a.cov)[0] || null; }, q);
        if (c) { itemId = String(c.itemId); via = 'search'; if (!our.cover) our.cover = c.img; } }
      const E = { at: nowIso(), cover: our.cover, grade: our.grade, sku: our.sku, regAt: our.regAt, note: our.note, photos: our.photos, itemId, via, key: our.key, uiAt: nowIso() };
      if (itemId) { const m = await marketOf(p, itemId, our.usedCode); const at = nowIso();
        E.mkt = { at, usedTotal: m.u.usedTotal ?? null, buyback: m.u.buyback || null, rows: m.rows };
        await C('shp_market').doc(`${t.o.orderNo}__${t.lid}__${at.replace(/[:.]/g, '-')}`).create({ orderNo: t.o.orderNo, listingId: t.lid, listingKey: our.key, bookId: our.bookId, aladinItemId: itemId, via, title: t.it.title || null, orderedAt: t.o.orderedAt || null, at,
          page1: m.u.listings || [], usedTotal: m.u.usedTotal ?? null, mins: m.u.mins || null, buyback: m.u.buyback || null, lastPage: m.u.lastPage || 1, by: 'cloud', ...W() }).catch(() => {}); }
      else { E.mktErr = '알라딘 상품번호를 못 찾음 (우리 기록·제목 검색 모두)'; skipUntil.set(t.lid, Date.now() + 3600e3); }
      await ref.update(new FieldPath('enrich', t.lid), E); cr.enrich[t.lid] = E; n++; await sleep(300);
    } catch (e) { fail++; const k = (failN.get(t.lid) || 0) + 1; failN.set(t.lid, k); skipUntil.set(t.lid, Date.now() + Math.min(60, 2 ** k) * 60e3); log('보강 실패', t.lid, `${k}번째 · ${Math.min(60, 2 ** k)}분 뒤 다시`, e.message); } } // 실패하면 2·4·8…분(최대 60분) 뒤 다시 — 매분 같은 실패를 되풀이하지 않음
  return { n, fail, left: todo.length - n - fail }; }

/* 우리 매물의 구매 유의 사항·사진 (알라딘 상품 화면) — 24시간에 한 번, 바뀐 판만 쌓음 (prd_used_info + v/ 판). 주문확인요청·발송 요청 둘 다 씀 */
async function refreshUsedInfo(p, lid, prev, at) {
  const info = await p.evaluate(async (lid) => { const r0 = await fetch('/shop/wproduct.aspx?ItemId=' + lid, { credentials: 'include' }); const html = await r0.text(); const d = new DOMParser().parseFromString(html, 'text/html'); const x = window.ReadnowProducts.parseUsedItemInfo(d, null); x._title = (d.title || '').slice(0, 80); x._len = html.length; x._url = r0.url; return x; }, String(lid));
  const ref = C('prd_used_info').doc(String(lid)); at = at || nowIso();
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
    const ref = C('prd_used_info').doc(String(it.listingId)); let prev = prevs[ii] && prevs[ii].exists ? prevs[ii].data() : undefined; if (looksBlanked(prev)) prev = await repairUsedInfo(it.listingId, prev); if (prev && prev.checkedAt && Date.now() - Date.parse(prev.checkedAt) < 864e5) continue;
    try { const nx = await refreshUsedInfo(p, it.listingId, prev, at); if (nx && (!prev || nx.versions !== prev.versions)) nInfo++; void ref;
      await sleep(600); } catch (e) { log('유의 사항 읽기 실패', it.listingId, e.message); } }
  lastDelivAt = Date.now();
  return { deliv: r.orders.length, items: items.length, changed, nInfo, exErr: R.exErr || null }; }

/* ── ③ 웹앱이 맡긴 일 (read · startDelivery · market = 그 주문 책의 시장 다시 읽기) ── */
async function runCmds(p) {
  const qs = await C('shp_cmds').where('status', '==', 'queued').get(); let n = 0, needRead = false; const force = new Set();
  let buy = false;
  for (const d of qs.docs) { const x0 = d.data(); if (!['read', 'startDelivery', 'market', 'aladinBuy'].includes(x0.type)) continue; let v = null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(d.ref); const x = sn.data(); if (!x || x.status !== 'queued') return; tx.update(d.ref, { status: 'running', claim: { pc: 'cloud', at: nowIso() }, uploadedAt: FV.serverTimestamp() }); v = x; });
    if (!v) continue; n++;
    if (v.type === 'startDelivery') { const results = {};
      for (const ono of v.orderNos || []) { try { const rr = await p.evaluate(async (o) => { const r = await fetch('/scm/worder_process.aspx?cmd=StartDelivery&ono=' + encodeURIComponent(o), { credentials: 'include' }); const t = await r.text(); return { ok: r.ok, status: r.status, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null }; }, ono);
          results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(rr.al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: rr.al, by: 'cloud' }; } catch (e) { results[ono] = { state: 'fail', at: nowIso(), msg: e.message, by: 'cloud' }; } await sleep(800); }
      // 확인: 주문확인요청 화면을 다시 읽어 빠졌는지 — 화면을 제대로 읽었을 때만 '끝남'(로그인 화면·읽기 실패로 빈 목록이면 '확인 못함')
      try { const chk = await p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); if (/\/login\/|wlogin/i.test(r.url)) return { ok: false }; const d = new DOMParser().parseFromString(await r.text(), 'text/html'); const x = window.ReadnowShipping.parseDeliveryPage(d); return { ok: !!(x && x.tabCounts && Object.keys(x.tabCounts).length), left: (x.orders || []).map((o) => o.orderNo) }; }, CONFIRM_URL);
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = !chk.ok ? 'unknown' : chk.left.includes(ono) ? 'fail' : 'done'; } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
      await d.ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; }
    else if (v.type === 'market') { (v.listingIds || []).forEach((x) => force.add(String(x))); await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'aladinBuy') { buy = true; await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else { await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; } }
  return { n, needRead, force, buy };
}

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
async function tick(why) {
  const t0 = Date.now();
  try { const p = await getPage(); let cr;
    try { cr = await confirmRead(p); } catch (e) { if (!e.relogin) throw e; await login(p); cr = await confirmRead(p); }
    const cm = await runCmds(p); if (cm.needRead) cr = await confirmRead(p);
    const delivDue = why !== 'schedule' || cm.needRead || cr.changed || !lastDelivAt || Date.now() - lastDelivAt > 4.5 * 60e3 || (cr.prevTab && cr.prevTab['발송 요청'] !== cr.tabCounts['발송 요청']);
    const until = t0 + 52000; // 한 회차는 1분 안에 끝냄 (다음 예약을 건너뛰지 않게) — 못 한 것은 다음 회차에 이어 함
    let rd = null; if (delivDue) rd = await shipRead(p, until);
    let en = null; try { en = await enrichConfirm(p, cr, cm.force, until - 8000); } catch (e) { en = { err: e.message }; }
    try { const nr = await repairSweep(); if (nr) log('유의 사항 되살림', nr, '건'); } catch (e) {} // 6시간에 한 번: 빈 판으로 덮였던 유의 사항을 지난 판에서 되살림
    let by = null; if (cm.buy || !lastBuyAt || Date.now() - lastBuyAt > 5 * 60e3 || (lastBuyRes && lastBuyRes.left)) { try { by = await buyRead(p, until); } catch (e) { if (e.relogin) { try { await login(p); by = await buyRead(p, until); } catch (e2) { by = { err: e2.message }; } } else by = { err: e.message }; } }
    const out = { ok: true, err: null, why, tickMs: Date.now() - t0, lastShipAt: nowIso(), lastConfirmAt, lastDelivAt: lastDelivAt ? new Date(lastDelivAt).toISOString() : null, lastBuyAt: lastBuyAt ? new Date(lastBuyAt).toISOString() : null, last: { confirm: cr.n, deliv: rd ? rd.deliv : null, delivRead: !!rd, enrich: en, buy: by }, cmds: cm.n, login: 'ok' };
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
      cover: (b.images && b.images.front) || null, priceList: b.priceList ?? null, priceSales: b.priceSales ?? null, availability: b.availability || null, usedTotal: us.usedTotal ?? null, buyback: us.buyback || null, mins: us.mins || null, page1: us.listings || [], lastPage: us.lastPage || 1 }; }, u);
  const keep = async (key, r) => { r.at = nowIso(); items[key] = r; await C('prd_lookups').add({ key, ...r, by: 'cloud', ...W() }).catch(() => {}); };
  for (const isbn of (req.isbns || []).slice(0, 40)) { try { const r = await book(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`); if (r.err) errs[isbn] = r.err; else await keep(isbn, r); } catch (e) { errs[isbn] = e.message; } await sleep(400); }
  for (const id of (req.itemIds || []).slice(0, 40)) { try { const r = await book(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`); if (r.err) errs['id_' + id] = r.err; else await keep('id_' + id, r); } catch (e) { errs['id_' + id] = e.message; } await sleep(400); }
  for (const q of (req.queries || []).slice(0, 40)) { try { cands[q] = await p.evaluate(async (q) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=' + encodeURIComponent(q), { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
      return P.parseSearchResults(d).filter((x) => !x.used).slice(0, 8).map((x) => ({ itemId: x.itemId, title: x.title, img: x.img || null, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, channels: x.channels || null })); }, q); } catch (e) { errs['q_' + q] = e.message; } await sleep(400); }
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

/* ── HTTP ── */
async function authUser(req) {
  const h = req.headers.authorization || ''; const tok = h.startsWith('Bearer ') ? h.slice(7) : null; if (!tok) throw Object.assign(new Error('로그인 토큰 없음'), { code: 401 });
  const u = await getAuth().verifyIdToken(tok).catch(() => null); if (!u) throw Object.assign(new Error('로그인 토큰이 맞지 않음'), { code: 401 });
  if (!ALLOW.includes(String(u.email || '').toLowerCase())) throw Object.assign(new Error('허용되지 않은 계정: ' + u.email), { code: 403 }); return u;
}
const bodyOf = (req) => new Promise((res, rej) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > 15e6) { rej(Object.assign(new Error('너무 큼'), { code: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { rej(Object.assign(new Error('JSON 아님'), { code: 400 })); } }); });
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ''; if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  const path = (req.url || '/').split('?')[0];
  try {
    if (path === '/status' || path === '/') return send(200, { ok: true, ver: VER, cores: coreVer, login: loginFailAt ? 'fail' : 'unknown', hasCred: !!(ALADIN_ID && ALADIN_PW) });
    if (path === '/tick') { if (!TICK_KEY || req.headers['x-tick-key'] !== TICK_KEY) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); if (tickBusy) return send(200, { ok: true, skipped: '앞 회차가 아직 도는 중' }); tickBusy = true; try { const out = await serial(() => tick('schedule')); return send(200, out); } finally { tickBusy = false; } }
    if (path === '/kick') { await authUser(req); const out = await serial(() => tick('kick')); return send(200, out); }
    if (path === '/lookup') { await authUser(req); const b = await bodyOf(req); const out = await serial(() => lookup(b)); return send(200, out); }
    if (path === '/spines') { await authUser(req); const b = await bodyOf(req); if (!b.image) return send(400, { ok: false, err: '사진 없음' }); const out = await spines(String(b.image).replace(/^data:[^,]+,/, '')); return send(200, out); }
    if (path === '/test') { await authUser(req); const out = await serial(async () => { const p = await getPage(); try { await login(p); return { ok: true, login: 'ok', cores: coreVer }; } catch (e) { return { ok: false, login: 'fail', err: e.message }; } }); return send(200, out); }
    return send(404, { ok: false, err: '없는 주소' });
  } catch (e) { log('요청 실패', path, e.message); return send(e.code && e.code < 600 ? e.code : 500, { ok: false, err: e.message }); }
});
server.listen(process.env.PORT || 8080, () => log(`readnow-cloud ${VER} 시작`));
