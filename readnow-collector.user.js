// ==UserScript==
// @name         리드나우 수집기
// @namespace    readnow
// @version      1.68.0
// @description  고객·주문·상품·판매자·매입(알라딘 구매·팔기)·구매자 분포를 Firebase(readnow-3a385)로 수집하는 통합 수집기 — 고객 수집기·상품 수집기를 합친 것
// @match        https://www.aladin.co.kr/scm/worders.aspx*
// @match        https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx*
// @match        https://www.aladin.co.kr/scm/wpopup_order.aspx*
// @match        https://www.aladin.co.kr/scm/wrecord_edit.aspx*
// @match        https://www.aladin.co.kr/scm/wrecord.aspx*
// @match        https://www.aladin.co.kr/scm/worder_delivery.aspx*
// @match        https://www.aladin.co.kr/scm/worder_process.aspx*
// @match        https://www.aladin.co.kr/scm/wUsedShopC2C*
// @match        https://www.aladin.co.kr/scm/wusedshopc2c*
// @match        https://www.aladin.co.kr/scm/wShopSurvey*
// @match        https://www.aladin.co.kr/scm/wshopsurvey*
// @match        https://www.aladin.co.kr/*login*
// @include      /^https:\/\/www\.aladin\.co\.kr\/shop\/usedshop\/wshopitem\.aspx\?.*rnPub=1/
// @match        https://www.aladin.co.kr/*Login*
// @match        https://*.aladin.co.kr/*login*
// @match        https://*.aladin.co.kr/*Login*
// @include      /^https:\/\/(www\.joongmo\.com|m\.bunjang\.co\.kr|web\.joongna\.com|www\.daangn\.com|www\.yes24\.com)\/.*[?&]rnx=[a-z0-9]{6,}/
// @noframes
// @updateURL    https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-collector.user.js
// @downloadURL  https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-collector.user.js
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-orders-core.js?v=0.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-sellers-core.js?v=1.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-products-core.js?v=0.14.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-core.js?v=1.4.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pricing-core.js?v=0.15.3
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-shipping-core.js?v=0.6.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-registry.js?v=0.14.25
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-ext-core.js?v=0.4.7
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-register-core.js?v=0.7.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-autosched-core.js?v=0.7.0
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-aladin-core.js?v=0.2.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-exec-core.js?v=0.1.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-runtime.js?v=1.68.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-crm.js?v=1.68.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-products.js?v=1.68.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-ship.js?v=1.68.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-helper.js?v=1.68.0
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        window.close
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      readnow-3a385-default-rtdb.asia-southeast1.firebasedatabase.app
// @connect      readnow-seller-db-default-rtdb.asia-southeast1.firebasedatabase.app
// @connect      image.aladin.co.kr
// @connect      rn.local
// @connect      127.0.0.1
// @connect      www.yes24.com
// @connect      bnk.kpipa.or.kr
// @connect      www.aladin.co.kr
// @connect      search.kyobobook.co.kr
// @connect      product.kyobobook.co.kr
// @connect      dapi.kakao.com
// @connect      openapi.naver.com
// @connect      www.nl.go.kr
// @connect      data4library.kr
// @connect      api.bunjang.co.kr
// @connect      web.joongna.com
// @connect      www.daangn.com
// @connect      api.ebay.com
// @connect      www.abebooks.com
// @connect      ridibooks.com
// @connect      oapi.koreaexim.go.kr
// @connect      www.koreaexim.go.kr
// @connect      api.frankfurter.app
// @connect      api.frankfurter.dev
// @connect      www.joongmo.com
// @connect      m.bunjang.co.kr
// @connect      dvdprime.com
// @connect      firebasestorage.googleapis.com
// @connect      search.shopping.naver.com
// @connect      www.google.com
// @connect      googleapis.com
// @connect      firebaseapp.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       document-idle
// ==/UserScript==
/* 리드나우 수집기 1.68.0 본체 — 개편 3단계: 코드는 GitHub의 모듈 파일 5개(위 @require), 여기는 모두 왔는지만 확인.
 * 올리는 순서: ① GitHub에 readnow-aladin-core.js · readnow-pc-*.js 5개 → ② 이 본체를 Tampermonkey에 붙여넣기 (먼저 붙이면 Tampermonkey가 파일을 못 받아 알림)
 * 모듈 판이 본체와 다르면(Tampermonkey가 옛 파일을 기억 · GitHub에 안 올림) 오른쪽 위에 빨간 띠 + 작업 기록에 남김 */
/* (1.66.0) 🧭 바깥 사이트 화면 그려 읽기(리더) — 중고닷·번개장터·중고나라·당근·예스24 중고 검색이 화면을 연 뒤 글을 따로 불러오는 방식이라 받은 화면엔 글이 없음
 *  수집기(알라딘 탭)가 그 검색 주소에 ?rnx=표를 붙여 보이지 않는 탭으로 열면, 이 스크립트가 그 탭에서만 '리더'로 깨어나(다른 일은 하나도 안 함)
 *  글 링크가 다 뜰 때까지(같은 수로 2초) 기다렸다가 링크 주소·링크 글·그 글을 담은 칸 글(값·상태)을 GM 저장소로 돌려주고 탭을 닫음 · 사람이 그냥 연 그 사이트에선 깨어나지 않음(?rnx= 없으면) */
globalThis.__rnX = (() => { try { return window.top === window && !/(^|\.)aladin\.co\.kr$/i.test(location.hostname) && /[?&]rnx=[a-z0-9]{6,}/i.test(location.search); } catch (e) { return false; } })();
if (globalThis.__rnX) (function rnxReader() { const tok = (location.search.match(/[?&]rnx=([a-z0-9]+)/i) || [])[1]; let q = null; try { q = GM_getValue('rnx_q_' + tok, null); } catch (e) {}
  const put = (v) => { try { GM_setValue('rnx_r_' + tok, { ...v, at: Date.now(), url: location.href }); } catch (e) {} setTimeout(() => { try { window.close(); } catch (e) {} }, 400); };
  if (!q) return put({ ok: false, why: '맡긴 표가 없음(시간이 지났거나 다른 PC)' });
  let re; try { re = new RegExp(q.re, q.reFlags || ''); } catch (e) { return put({ ok: false, why: '링크 모양이 잘못됨' }); } const none = q.none ? new RegExp(q.none) : null; const t0 = Date.now(), max = Math.min(60000, q.max || 20000); let last = -1, same = 0;
  const box = (a) => { let el = a, best = a; for (let k = 0; k < 6 && el && el.parentElement; k++) { el = el.parentElement; const n = el.querySelectorAll('a[href]').length; const tx = (el.innerText || ''); if (tx.length > 1500 || [...el.querySelectorAll('a[href]')].filter((x) => re.test(x.href)).length > 2) break; best = el; if (/\d[\d,]*\s*원/.test(tx) && n <= 6) break; } return best; };
  const txt = (el) => { const out = []; try { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const v = n.nodeValue.replace(/\s+/g, ' ').trim(); if (v && !(n.parentElement && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement.tagName))) out.push(v); } } catch (e) {} return out.join('\n'); }; /* 글 조각마다 줄을 나눔(값 '1000원'이 제목 '로마 1'에 붙어 '11000원'이 되지 않게) */
  const grab = () => [...document.querySelectorAll('a[href]')].filter((a) => re.test(a.href)).slice(0, 300).map((a) => ({ h: a.href, t: (txt(a) || a.getAttribute('title') || a.getAttribute('aria-label') || '').slice(0, 400), c: txt(box(a)).slice(0, 700) }));
  const tick = () => { let L = []; try { L = grab(); } catch (e) {} const body = (document.body && document.body.innerText) || ''; const el = Date.now() - t0;
    if (L.length && L.length === last) same++; else same = 0; last = L.length;
    if ((L.length && same >= 3) || (!L.length && none && el > 4000 && none.test(body)) || el > max) return put({ ok: true, links: L, none: !L.length && !!(none && none.test(body)), timeout: el > max, html: q.html ? document.documentElement.outerHTML.slice(0, 1500000) : null });
    if (L.length && same === 1) { try { window.scrollBy(0, 1200); } catch (e) {} } setTimeout(tick, 700); };
  setTimeout(tick, 1200); })();
(function rnLive() { /* (1.63.8) ⚡ 빠른 업데이트 — Tampermonkey의 자동 업데이트(최소 몇 시간마다)를 기다리지 않고, 이 본체가 5분마다 GitHub의 pc-live.json(판 번호·파일 목록·지문)을 보고
   *  새 판이면 파일들을 받아 지문(sha256)이 모두 맞을 때만 이 PC(Tampermonkey 저장소)에 받아 둠 → 수집기가 쉬는 사이(또는 긴 작업이면 저장 지점에서) 새로고침 → 받아 둔 새 판으로 뜸
   *  받아 둔 판이 이 본체의 판보다 새것이면 그것을, 아니면(또는 시작에 실패하면) 위 @require의 이 판을 씀 — 실패한 판은 다시 쓰지 않음 · 머리(화면·권한)가 바뀐 판은 Tampermonkey 업데이트를 기다림 */
  const G = globalThis; const CLASSIC = '1.68.0'; const HSIG = '61b9e2379be81d42'; const RAWL = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/'; const Q0 = (G.__rnModQ || []).slice();
  const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (+x || 0), 0); const gv = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } }; const sv = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const L = gv('rn-live', null); const bad = gv('rn-live-bad', null); const prevFV = G.__RN_FILE_VER; let used = 'classic';
  if (L && L.code && L.hsig === HSIG && vn(L.ver) > vn(CLASSIC) && !(bad && bad.ver === L.ver) && !gv('rn-live-off', false)) {
    try { G.__rnModQ = []; G.__RN_FILE_VER = L.ver; eval(L.code); if (G.__rnModQ.length !== Q0.length || G.__rnModQ.some((x) => x[1] !== L.ver)) throw new Error('받아 둔 판의 모듈이 다 오지 않음'); used = 'live'; }
    catch (e) { G.__rnModQ = Q0; G.__RN_FILE_VER = prevFV; G.__rnLiveErr = String(e && e.message || e); sv('rn-live-bad', { ver: L.ver, at: Date.now(), err: G.__rnLiveErr }); if (/unsafe-eval|EvalError|Content Security|not allowed/i.test(G.__rnLiveErr + ' ' + (e && e.name))) sv('rn-live-noeval', { at: Date.now(), err: G.__rnLiveErr }); try { console.error('[리드나우] 빠른 업데이트 판 시작 실패 — 이 판(' + CLASSIC + ')으로', e); } catch (x) {} } }
  G.__rnLiveUsed = used; G.__rnLiveVer = used === 'live' ? L.ver : CLASSIC;
  const run = G.__rnModQ; G.__rnModQ = []; if (G.__rnX) return; /* (1.66.0) 바깥 사이트 리더 탭 — 수집기 모듈은 하나도 돌리지 않음 */ for (const [k, , fn] of run) { try { fn(); } catch (e) { try { console.error('[리드나우] 모듈 ' + k + ' 시작 오류', e); window.__rnLog && window.__rnLog('수집기', 'err', '모듈 ' + k + ' 시작 오류: ' + (e && e.message)); } catch (x) {} } }
  if (G.__rnLiveErr) setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'err', '⚡ 빠른 업데이트로 받아 둔 판 ' + (L && L.ver) + '을 시작하지 못해 이 판(' + CLASSIC + ')으로 돎: ' + G.__rnLiveErr); } catch (x) {} }, 3000);
  else if (used === 'live') setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 빠른 업데이트로 받아 둔 판 ' + L.ver + '으로 돎 (Tampermonkey의 본체는 ' + CLASSIC + ')'); } catch (x) {} }, 3000);
  if (window.top !== window) return;
  const sha = async (t) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  let busy = false; const chk = async (force) => { if (busy || gv('rn-live-noeval', null) || gv('rn-live-off', false)) return; /* 이 브라우저가 받아 둔 코드를 돌리지 못하게 막음 — Tampermonkey 자동 업데이트만 씀 · (1.63.11 자동 점검) 빠른 업데이트를 꺼 둔 PC도 받지 않음(받아 두면 새로고침해도 이 판으로 떠 끝없이 새로고침) */ if (!force && Date.now() - (+gv('rn-live-at', 0) || 0) < 4 * 60e3) { const H = gv('rn-live', null); const bd0 = gv('rn-live-bad', null); if (H && H.ver && vn(H.ver) > vn(G.__rnLiveVer) && H.hsig === HSIG && !(bd0 && bd0.ver === H.ver)) { /* (1.63.11 자동 점검) 시작에 실패한 판은 지름길로도 다시 부르지 않음 */ try { window.__rnLiveReady && window.__rnLiveReady(H.ver); } catch (e) {} } return; } busy = true; sv('rn-live-at', Date.now());
    try { const r = await fetch(RAWL + 'pc-live.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('pc-live.json HTTP ' + r.status); const M = await r.json(); sv('rn-live-seen', { ver: M.ver, at: Date.now() });
      if (!M || !M.ver || !Array.isArray(M.files) || vn(M.ver) <= vn(G.__rnLiveVer)) return; const bd = gv('rn-live-bad', null); if (bd && bd.ver === M.ver) return;
      if (M.hsig !== HSIG) { if (gv('rn-live-hnote', '') !== M.ver) { sv('rn-live-hnote', M.ver); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 새 판 ' + M.ver + '은 머리(화면·권한)가 바뀐 판이라 빠른 업데이트로 못 바꿈 — Tampermonkey 업데이트(대시보드 → 업데이트 확인)를 기다림'); } catch (e) {} } return; }
      const H = gv('rn-live', null); if (!(H && H.ver === M.ver && H.hsig === HSIG)) { let code = ''; for (const f of M.files) { const t = await (await fetch(RAWL + f.f + '?v=' + f.v + '&h=' + String(f.sha).slice(0, 10), { cache: 'no-store' })).text(); const h = await sha(t); if (h !== f.sha) throw new Error(f.f + ' 지문이 다름(GitHub 캐시가 아직 옛 파일 — 다음 확인 때 다시)'); code += '\n;' + t + '\n'; }
        sv('rn-live', { ver: M.ver, hsig: HSIG, code, at: Date.now(), n: M.files.length }); try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 새 판 ' + M.ver + '을 GitHub에서 받아 둠(파일 ' + M.files.length + '개 · 지문 확인) — 쉬는 사이 새로고침해 바꿈'); } catch (e) {} }
      try { window.__rnLiveReady && window.__rnLiveReady(M.ver); } catch (e) {} }
    catch (e) { const m = String(e && e.message || e); if (gv('rn-live-err', '') !== m) { sv('rn-live-err', m); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 빠른 업데이트 확인 실패: ' + m); } catch (x) {} } } finally { busy = false; } };
  window.__rnLiveCheck = () => chk(true); window.__rnLiveInfo = () => ({ used: G.__rnLiveUsed, ver: G.__rnLiveVer, classic: CLASSIC, have: (gv('rn-live', null) || {}).ver || null, seen: gv('rn-live-seen', null), bad: gv('rn-live-bad', null), err: gv('rn-live-err', '') || null, noeval: gv('rn-live-noeval', null) });
  setTimeout(() => chk(false), 20000); setInterval(() => chk(false), 5 * 60e3); })();
(function rnModCheck() {
  if (window.top !== window) return;
  const want = [["runtime","readnow-pc-runtime.js"],["crm","readnow-pc-crm.js"],["products","readnow-pc-products.js"],["ship","readnow-pc-ship.js"],["helper","readnow-pc-helper.js"]]; const V = globalThis.__rnLiveVer || '1.68.0'; const got = (typeof globalThis !== 'undefined' && globalThis.ReadnowPcMods) || window.ReadnowPcMods || {};
  const bad = want.filter(([k]) => got[k] !== V).map(([k, f]) => `${f} ${got[k] ? got[k] + ' (본체 ' + V + ')' : '못 받음'}`);
  window.__rnModsOk = !bad.length; window.__rnMods = { ...got, aladin: (globalThis.ReadnowAladin || {}).VERSION || null, exec: (globalThis.ReadnowExec || {}).VERSION || null };
  if (!bad.length) return;
  try { window.__rnLog && window.__rnLog('수집기', 'err', '모듈 판이 맞지 않음: ' + bad.join(', ') + ' — GitHub에 올렸는지 확인하고 본체를 다시 붙여넣기'); } catch (e) {}
  const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;right:10px;bottom:52px;z-index:2147483646;max-width:min(380px,90vw);background:#B0322A;color:#fff;padding:6px 10px;border-radius:8px;font:600 12px/1.45 system-ui,Malgun Gothic,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.2);cursor:pointer'; /* (1.66.0) 왼쪽 위(샵매니저 단추를 가리고 닫을 수 없었음) → 오른쪽 아래 · 누르면 작은 단추로 접힘 */ d.title = '누르면 접힘/펼침';
    d.textContent = '리드나우 수집기 ' + V + ': 모듈 판이 맞지 않음 — ' + bad.join(' · ') + '. GitHub에 모듈 파일을 올렸는지 확인한 뒤 본체를 다시 붙여넣어 주세요.'; const full = d.textContent; let small = false; d.onclick = () => { small = !small; d.textContent = small ? '⚠ 수집기 판 다름 — 누르면 자세히' : full; d.style.padding = small ? '3px 9px' : '6px 10px'; }; document.body.appendChild(d); };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
