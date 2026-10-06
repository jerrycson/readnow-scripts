/* 리드나우 클라우드 수집 (readnow-cloud) 0.1.0 — Google Cloud Run
 *
 * 하는 일 (PC 수집기와 같은 기준 파일·같은 저장 형식, PC 수집기와 함께 돌아도 됨)
 *  - /tick  (Cloud Scheduler가 매일 24시간 5분마다 부름)
 *      ① 알라딘 판매관리 ① 주문확인요청 · ② 발송 요청 읽기 → shp_state/confirm · shp_state/current · shp_orders · shp_snapshots (= 실시간 주문 수집)
 *      ② 발송 요청 엑셀(ALPS 업로드 재료) · 우리 매물 유의 사항·사진(prd_used_info, 24시간에 한 번)
 *      ③ 웹앱이 맡긴 일(shp_cmds) 중 read · startDelivery 를 맡아 처리 (PC가 먼저 맡으면 PC가 함 — 트랜잭션으로 한 곳만)
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
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const puppeteer = require('puppeteer-core');

const VER = '0.3.0';
initializeApp({ projectId: process.env.FB_PROJECT || 'readnow-3a385' });
const db = getFirestore();
const FV = FieldValue;
const RAW = process.env.CORE_BASE || 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/';
const CORES = ['readnow-shipping-core.js', 'readnow-products-core.js'];
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
  const out = []; for (const f of CORES) { const r = await fetch(RAW + f + '?t=' + Date.now()); if (!r.ok) throw new Error(`${f} 받기 실패 (${r.status})`); const t = await r.text(); out.push(t); coreVer[f] = (t.match(/VERSION\s*[:=]\s*['"]([\d.]+)/) || [])[1] || '?'; }
  coreSrc = out.join('\n;\n'); coreAt = Date.now(); return coreSrc;
}

/* ── 브라우저 (하나를 계속 씀, 일은 한 번에 하나씩) ── */
let browser = null, page = null; let chain = Promise.resolve();
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
async function getPage() {
  if (!browser || !browser.connected) { browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--lang=ko-KR'] }); page = null; }
  if (!page || page.isClosed()) { page = await browser.newPage(); await page.setBypassCSP(true); /* 기준 파일을 넣으려고 (수집기도 Tampermonkey로 같은 일) */ await page.setUserAgent(UA); await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' }); page.setDefaultTimeout(60000); }
  if (!/aladin\.co\.kr/.test(page.url())) await page.goto(AL + '/', { waitUntil: 'domcontentloaded' });
  await ensureCores(page); return page;
}
async function ensureCores(p) { const has = await p.evaluate(() => !!(window.ReadnowShipping && window.ReadnowProducts)).catch(() => false); if (!has) await p.addScriptTag({ content: await cores() }); }

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

/* ── ① 주문확인요청 · ② 발송 요청 읽기 (PC 수집기 shipReadJob과 같은 저장 형식) ── */
async function shipRead(p) {
  const R = await p.evaluate(async () => {
    const SH = window.ReadnowShipping; const get = async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); return { url: r.url, doc: new DOMParser().parseFromString(t, 'text/html') }; };
    const d = await get('/scm/worder_delivery.aspx?orderstep=4'); if (/\/login\/|wlogin/i.test(d.url)) return { login: false };
    const r = SH.parseDeliveryPage(d.doc); const c = await get('/scm/worder_preparatory_complete.aspx'); const rc = SH.parseDeliveryPage(c.doc);
    let excel = null, exErr = null;
    try { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' }); const rr = await fetch('/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); if (!rr.ok) throw new Error('HTTP ' + rr.status); excel = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html')); if (!excel) exErr = '엑셀 표를 못 찾음'; } catch (e) { exErr = e.message; }
    return { login: true, r, rc, excel, exErr };
  });
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const at = nowIso(); const { r, rc, excel } = R;
  // ① 주문확인요청
  const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)])); const cc = (await C('shp_state').doc('confirm').get()).data();
  if (!cc || cc.sig !== csig) { const bc = db.batch(); bc.set(C('shp_state').doc('confirm'), { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: 'cloud', ...W() });
    for (const o of rc.orders) bc.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }, { merge: true });
    await bc.commit(); } // 그대로면 쓰지 않음 (읽은 시각은 app_settings/cloud.lastShipAt — 웹앱이 거기서 봄)
  // ② 발송 요청
  const sig = JSON.stringify(r.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId), o.deliveryNo])); const cur = (await C('shp_state').doc('current').get()).data();
  // 바뀐 것이 없으면 시각만 (쓰기·읽기 비용 줄임). 바뀌면 PC 수집기와 같은 형식으로 전부
  const changed = !cur || cur.sig !== sig; const b = db.batch();
  const xchanged = excel && (!cur || !cur.excel || JSON.stringify(cur.excel.rows.map((x) => x.v)) !== JSON.stringify(excel.rows));
  if (!changed) { if (xchanged || (cur && JSON.stringify(cur.tabCounts) !== JSON.stringify(r.tabCounts))) b.set(C('shp_state').doc('current'), { at, pc: 'cloud', tabCounts: r.tabCounts, ...(excel ? { excel: { at, header: excel.header, rows: excel.rows.map((v) => ({ v })) } } : {}), ...W() }, { merge: true }); } // 그대로면 쓰지 않음 (웹앱 휴대폰이 5분마다 큰 문서를 다시 받지 않게)
  else { b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, orders: r.orders, sig, pc: 'cloud', excel: excel ? { at, header: excel.header, rows: excel.rows.map((v) => ({ v })) } : (cur && cur.excel) || null, ...W() });
    b.set(C('shp_snapshots').doc(at.replace(/[:.]/g, '-')), { at, tabCounts: r.tabCounts, orders: r.orders, by: 'cloud', ...W() });
    for (const o of r.orders) b.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, stage: '발송 요청', lastSeenAt: at, ...(cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { firstSeenAt: at }), buyer: o.buyer, recipient: o.recipient, orderedAt: o.orderedAt, items: o.items, carrier: o.carrier, ...W() }, { merge: true }); }
  await b.commit();
  // 우리 매물 유의 사항·사진 (24시간에 한 번 — PC 수집기와 같은 기록, 바뀐 판만 쌓음)
  let nInfo = 0; const items = r.orders.flatMap((o) => o.items).filter((i) => i.listingId);
  for (const it of items) { const ref = C('prd_used_info').doc(String(it.listingId)); const prev = (await ref.get()).data(); if (prev && prev.checkedAt && Date.now() - Date.parse(prev.checkedAt) < 864e5) continue;
    try { const info = await p.evaluate(async (lid) => { const r0 = await fetch('/shop/wproduct.aspx?ItemId=' + lid, { credentials: 'include' }); const d = new DOMParser().parseFromString(await r0.text(), 'text/html'); return window.ReadnowProducts.parseUsedItemInfo(d, null); }, String(it.listingId));
      const sig2 = JSON.stringify([info.note, info.photos.map((x) => x.file)]);
      if (prev && prev.sig === sig2) await ref.set({ checkedAt: at }, { merge: true });
      else { const nv = ((prev && prev.versions) || 0) + 1; const b2 = db.batch(); const ver = { note: info.note || null, hasNote: info.hasNote, photos: info.photos.map((x) => ({ src: x.src, where: x.where, file: x.file })), sellerPhotoCount: info.sellerPhotoCount, photoDiff: info.photoDiff, found: info.found, sig: sig2, at };
        b2.set(ref.collection('v').doc(String(nv).padStart(4, '0')), { ...ver, listingId: String(it.listingId), ...W() }); b2.set(ref, { listingId: String(it.listingId), sellerCode: '996008', ours: true, ...ver, versions: nv, firstAt: (prev && prev.firstAt) || at, checkedAt: at, ...W() }, { merge: true }); await b2.commit(); nInfo++; }
      await sleep(600); } catch (e) { log('유의 사항 읽기 실패', it.listingId, e.message); } }
  lastConfirm = rc.orders;
  return { confirm: rc.orders.length, deliv: r.orders.length, items: items.length, changed: !cur || cur.sig !== sig, nInfo, exErr: R.exErr || null };
}

/* ── 주문 들어온 책의 지금 시장 (shp_market) ──
   주문확인요청에 새로 들어온 주문의 상품마다 온라인 중고 첫 페이지 1번만 읽어 '주문 시점 시장'으로 따로 남김 (주문번호__매물번호 문서 하나, 이미 있으면 다시 읽지 않음)
   · 기존 시장 지표(prd_book_metrics)는 건드리지 않음 — 덮어쓰지 않고 새 문서만 만듦 (create: 이미 있으면 실패 → 그대로 둠)
   · 한 번에 최대 MARKET_MAX권, 나머지는 다음 회차 · 실패한 책은 이번 회차만 건너뜀(다음 회차에 다시) */
let lastConfirm = []; const MARKET_MAX = 15; const skipUntil = new Map();
async function aladinItemIdOf(listingId) {
  const L = await C('prd_listings').where('listingId', 'in', [String(listingId), Number(listingId)].filter((x) => x === x)).limit(1).get(); const l = L.empty ? null : L.docs[0].data();
  if (!l || !l.bookId) return { why: '우리 상품 기록에 없음' }; const b = (await C('prd_books').doc(l.bookId).get()).data();
  return b && b.aladinItemId ? { itemId: String(b.aladinItemId), bookId: l.bookId, key: L.docs[0].id } : { why: '도서 정보(알라딘 상품번호) 없음', bookId: l.bookId }; }
async function marketSnap(p) {
  const todo = []; for (const o of lastConfirm || []) for (const it of o.items || []) if (it.listingId) todo.push({ o, it, id: `${o.orderNo}__${it.listingId}` });
  let n = 0, fail = 0;
  for (const t of todo) { if (n >= MARKET_MAX) break; if ((skipUntil.get(t.id) || 0) > Date.now()) continue; const ref = C('shp_market').doc(t.id); if ((await ref.get()).exists) continue;
    try { const ai = await aladinItemIdOf(t.it.listingId); n++;
      if (!ai.itemId && t.it.title) { // 우리 기록에 없으면 제목으로 알라딘 검색 → 새상품(중고 아님) 중 이름이 90% 이상 같은 것 (PC 수집기 풀 수집과 같은 기준)
        const c = await p.evaluate(async (q) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(q), { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
          return P.parseSearchResults(d).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: P.nameCoverage(q, x.title) })).filter((x) => x.cov >= 0.9).sort((a, b) => b.cov - a.cov)[0] || null; }, String(t.it.title).replace(/^\[[^\]]*\]\s*/, ''));
        if (c) { ai.itemId = String(c.itemId); ai.via = 'search'; } }
      if (!ai.itemId) { skipUntil.set(t.id, Date.now() + 3600e3); log('주문 시장: 알라딘 상품번호를 못 찾음', t.id, ai.why); continue; }
      const u = await p.evaluate(async (id) => { const r = await fetch(`/shop/UsedShop/wuseditemall.aspx?ItemId=${id}&TabType=0`, { credentials: 'include' }); if (!r.ok) throw new Error('HTTP ' + r.status); return window.ReadnowProducts.parseUsedPage(new DOMParser().parseFromString(await r.text(), 'text/html')); }, ai.itemId);
      await ref.create({ orderNo: t.o.orderNo, listingId: String(t.it.listingId), listingKey: ai.key || null, bookId: ai.bookId, aladinItemId: ai.itemId, via: ai.via || 'ours', title: t.it.title || null, orderedAt: t.o.orderedAt || null, at: nowIso(),
        page1: u.listings || [], usedTotal: u.usedTotal ?? null, mins: u.mins || null, buyback: u.buyback || null, lastPage: u.lastPage || 1, by: 'cloud', ...W() }).catch(() => {});
      await sleep(700); } catch (e) { fail++; log('주문 시장 읽기 실패', t.id, e.message); } }
  return { n, fail, left: Math.max(0, todo.length - n) }; }

/* ── ③ 웹앱이 맡긴 일 (read · startDelivery) ── */
async function runCmds(p) {
  const qs = await C('shp_cmds').where('status', '==', 'queued').get(); let n = 0, needRead = false;
  for (const d of qs.docs) { const x0 = d.data(); if (!['read', 'startDelivery'].includes(x0.type)) continue; let v = null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(d.ref); const x = sn.data(); if (!x || x.status !== 'queued') return; tx.update(d.ref, { status: 'running', claim: { pc: 'cloud', at: nowIso() }, uploadedAt: FV.serverTimestamp() }); v = x; });
    if (!v) continue; n++;
    if (v.type === 'startDelivery') { const results = {};
      for (const ono of v.orderNos || []) { try { const rr = await p.evaluate(async (o) => { const r = await fetch('/scm/worder_process.aspx?cmd=StartDelivery&ono=' + encodeURIComponent(o), { credentials: 'include' }); const t = await r.text(); return { ok: r.ok, status: r.status, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null }; }, ono);
          results[ono] = { state: rr.ok ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: rr.al, by: 'cloud' }; } catch (e) { results[ono] = { state: 'fail', at: nowIso(), msg: e.message, by: 'cloud' }; } await sleep(800); }
      try { const left = new Set(await p.evaluate(async () => { const r = await fetch('/scm/worder_preparatory_complete.aspx', { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); return window.ReadnowShipping.parseDeliveryPage(d).orders.map((o) => o.orderNo); }));
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = left.has(ono) ? 'fail' : 'done'; } catch (e) {}
      await d.ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true });
    needRead = true; }
  return { n, needRead };
}

/* ── 신호 ── */
async function beat(x) { const at = nowIso(); await C('app_settings').doc('cloud').set({ at, ver: VER, cores: coreVer, ...x, ...W() }, { merge: true }).catch((e) => log('신호 저장 실패', e.message));
  if (x.ok === false) await C('cloud_log').add({ at, ...x, ver: VER, ...W() }).catch(() => {}); }

async function tick(why) {
  const t0 = Date.now();
  try { const p = await getPage(); await login(p);
    const cm = await runCmds(p);
    let rd; try { rd = await shipRead(p); } catch (e) { if (e.relogin) { await login(p); rd = await shipRead(p); } else throw e; }
    try { rd.market = await marketSnap(p); } catch (e) { rd.market = { err: e.message }; }
    const out = { ok: true, err: null, why, tickMs: Date.now() - t0, lastShipAt: nowIso(), last: rd, cmds: cm.n, login: 'ok' }; await beat(out); log('tick', JSON.stringify(out)); return out;
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
    if (path === '/tick') { if (!TICK_KEY || req.headers['x-tick-key'] !== TICK_KEY) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); const out = await serial(() => tick('schedule')); return send(200, out); }
    if (path === '/kick') { await authUser(req); const out = await serial(() => tick('kick')); return send(200, out); }
    if (path === '/lookup') { await authUser(req); const b = await bodyOf(req); const out = await serial(() => lookup(b)); return send(200, out); }
    if (path === '/spines') { await authUser(req); const b = await bodyOf(req); if (!b.image) return send(400, { ok: false, err: '사진 없음' }); const out = await spines(String(b.image).replace(/^data:[^,]+,/, '')); return send(200, out); }
    if (path === '/test') { await authUser(req); const out = await serial(async () => { const p = await getPage(); try { await login(p); return { ok: true, login: 'ok', cores: coreVer }; } catch (e) { return { ok: false, login: 'fail', err: e.message }; } }); return send(200, out); }
    return send(404, { ok: false, err: '없는 주소' });
  } catch (e) { log('요청 실패', path, e.message); return send(e.code && e.code < 600 ? e.code : 500, { ok: false, err: e.message }); }
});
server.listen(process.env.PORT || 8080, () => log(`readnow-cloud ${VER} 시작`));
