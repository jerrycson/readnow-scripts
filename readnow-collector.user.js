// ==UserScript==
// @name         리드나우 수집기
// @namespace    readnow
// @version      1.89.93
// @description  고객·주문·상품·판매자·매입(알라딘 구매·팔기)·구매자 분포를 Firebase(readnow-3a385)로 수집하는 통합 수집기 — 고객 수집기·상품 수집기를 합친 것
// @match        https://www.aladin.co.kr/scm/*
// @match        https://www.aladin.co.kr/usedstore/*
// @match        https://www.aladin.co.kr/shop/usedshop/*
// @match        https://www.aladin.co.kr/*login*
// @match        https://www.aladin.co.kr/*Login*
// @match        https://*.aladin.co.kr/*login*
// @match        https://*.aladin.co.kr/*Login*
// @match        http://127.0.0.1:8899/*
// @match        http://localhost:8899/*
// @match        http://rn.local/*
// @match        https://jerrycson.github.io/*
// @include      /^https?:\/\/[^\/]+\/.*[?&]rnx=[a-z0-9]{6,}/
// @noframes
// @updateURL    https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-collector.user.js
// @downloadURL  https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-collector.user.js
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-orders-core.js?v=0.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-sellers-core.js?v=1.3.2
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-products-core.js?v=0.19.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-core.js?v=1.4.2
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pricing-core.js?v=0.16.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-shipping-core.js?v=0.7.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-registry.js?v=0.14.103
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-ext-core.js?v=0.6.3
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-register-core.js?v=0.7.4
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-ml-core.js?v=0.9.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-autosched-core.js?v=0.18.6
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-aladin-core.js?v=0.2.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-exec-core.js?v=0.1.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-boot.js?v=1.89.93
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-runtime.js?v=1.89.93
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-crm.js?v=1.89.93
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-products.js?v=1.89.93
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-ship.js?v=1.89.93
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-helper.js?v=1.89.93
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getTabs
// @grant        GM_info
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// @connect      raw.githubusercontent.com
// @connect      aladin.co.kr
// @connect      127.0.0.1
// @connect      localhost
// @connect      rn.local
// @connect      githubusercontent.com
// @connect      github.io
// @connect      github.com
// @connect      googleapis.com
// @connect      firebaseio.com
// @connect      firebasedatabase.app
// @connect      firebaseapp.com
// @connect      firebasestorage.app
// @connect      gstatic.com
// @connect      google.com
// @connect      googleusercontent.com
// @connect      run.app
// @connect      cloudfunctions.net
// @connect      yes24.com
// @connect      kyobobook.co.kr
// @connect      ypbooks.co.kr
// @connect      interpark.com
// @connect      kpipa.or.kr
// @connect      kakao.com
// @connect      naver.com
// @connect      nl.go.kr
// @connect      data4library.kr
// @connect      bunjang.co.kr
// @connect      joongna.com
// @connect      daangn.com
// @connect      joongmo.com
// @connect      ebay.com
// @connect      abebooks.com
// @connect      amazon.com
// @connect      ridibooks.com
// @connect      koreaexim.go.kr
// @connect      frankfurter.app
// @connect      frankfurter.dev
// @connect      dvdprime.com
// @connect      coupang.com
// @connect      11st.co.kr
// @connect      gmarket.co.kr
// @connect      auction.co.kr
// @connect      *
// @run-at       document-idle
// ==/UserScript==
/* 리드나우 수집기 1.89.93 본체 — 개편 3단계: 코드는 GitHub의 모듈 파일 5개(위 @require), 여기는 모두 왔는지만 확인.
 * 올리는 순서: ① GitHub에 readnow-aladin-core.js · readnow-pc-*.js 5개 → ② 이 본체를 Tampermonkey에 붙여넣기 (먼저 붙이면 Tampermonkey가 파일을 못 받아 알림)
 * 모듈 판이 본체와 다르면(Tampermonkey가 옛 파일을 기억 · GitHub에 안 올림) 오른쪽 위에 빨간 띠 + 작업 기록에 남김 */
(function rnLive() { /* (1.72.0) 이 본체(로더)는 '고르기·시작·새 판 확인'만 — 화면마다 할 일(로거 잠금·저장소 비우기·그림자 칸·바깥 사이트 리더·첫 화면 표시)은 readnow-pc-boot.js(시작 코드)로 옮겨 빠른 업데이트로 바뀜 · 이 로더 글이 바뀌면 머리 서명도 바뀜(Tampermonkey 업데이트 필요를 정직하게 알림)
   * (1.63.8) ⚡ 빠른 업데이트 — Tampermonkey의 자동 업데이트(최소 몇 시간마다)를 기다리지 않고, 이 본체가 5분마다 GitHub의 pc-live.json(판 번호·파일 목록·지문)을 보고
   *  새 판이면 파일들을 받아 지문(sha256)이 모두 맞을 때만 이 PC(Tampermonkey 저장소)에 받아 둠 → 수집기가 쉬는 사이(또는 긴 작업이면 저장 지점에서) 새로고침 → 받아 둔 새 판으로 뜸
   *  받아 둔 판이 이 본체의 판보다 새것이면 그것을, 아니면(또는 시작에 실패하면) 위 @require의 이 판을 씀 — 실패한 판은 다시 쓰지 않음 · 머리(화면·권한)가 바뀐 판은 Tampermonkey 업데이트를 기다림 */
  const G = globalThis; const CLASSIC = '1.89.93'; const HSIG = '8559039d5a96110b'; const RAWL = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/'; const Q0 = (G.__rnModQ || []).slice();
  const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (+x || 0), 0); const gv = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } }; const sv = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const L = gv('rn-live', null); const bad = gv('rn-live-bad', null); const prevFV = G.__RN_FILE_VER; let used = 'classic'; const B0 = G.__rnBoot; const PM0 = Object.assign({}, G.ReadnowPcMods || {}); /* (1.72.0) 받아 둔 판을 버리면 모듈 판 표시도 이 판으로 되돌림 */
  { const PG = gv('rn-pages', null); const onAl0 = /(^|\.)aladin\.co\.kr$/i.test(location.hostname); if (PG && Array.isArray(PG.re) && onAl0 && !gv('rn-pubChrome', false)) { let ok = false; try { ok = PG.re.some((x) => new RegExp(x, 'i').test(location.href)); } catch (e) { ok = true; } if (!ok) return; } } /* (1.72.0) 지난번 시작 코드가 알려 준 '깨어날 화면'이 아니면 무거운 코드를 읽지도 않고 끝(알라딘 다른 화면이 느려지지 않게) · 로거 크롬은 잠금 때문에 늘 시작 코드까지 */ /* (1.72.0) 이 판(@require)의 시작 코드 */
  if (L && L.code && L.hsig === HSIG && vn(L.ver) > vn(CLASSIC) && !(bad && bad.ver === L.ver) && !gv('rn-live-off', false)) {
    try { G.__rnModQ = []; G.__rnBoot = null; G.__RN_FILE_VER = L.ver; eval(L.code); if (G.__rnModQ.length !== Q0.length || G.__rnModQ.some((x) => x[1] !== L.ver)) throw new Error('받아 둔 판의 모듈이 다 오지 않음'); if (typeof G.__rnBoot !== 'function') throw new Error('받아 둔 판에 시작 코드(readnow-pc-boot.js)가 없음'); used = 'live'; }
    catch (e) { G.__rnModQ = Q0; G.__rnBoot = B0; G.ReadnowPcMods = Object.assign({}, PM0); G.__RN_FILE_VER = prevFV; G.__rnLiveErr = String(e && e.message || e); sv('rn-live-bad', { ver: L.ver, at: Date.now(), err: G.__rnLiveErr }); if (/unsafe-eval|EvalError|Content Security|not allowed/i.test(G.__rnLiveErr + ' ' + (e && e.name))) sv('rn-live-noeval', { at: Date.now(), err: G.__rnLiveErr }); try { console.error('[리드나우] 빠른 업데이트 판 시작 실패 — 이 판(' + CLASSIC + ')으로', e); } catch (x) {} } }
  G.__rnLiveUsed = used; G.__rnLiveVer = used === 'live' ? L.ver : CLASSIC; { const HW = gv('rn-live-hwait', null); if (HW && HW.mine === HSIG && vn(HW.ver) > vn(G.__rnLiveVer)) G.__rnLiveHsigWait = HW.ver; } /* (1.72.0) 지난번에 본 '머리가 다른 새 판' — 새로고침을 되풀이하지 않게 */
  /* (1.72.0) 시작 코드(boot) — 받아 둔 판이면 그 판의 것, 아니면 이 판(@require)의 것 · false면 이 화면에서는 모듈·새 판 확인을 하지 않음 · 받아 둔 판의 시작 코드가 오류면 그 판을 버리고 이 판으로 */
  let go = true; const BI = { classic: CLASSIC, hsig: HSIG, used };
  try { go = typeof G.__rnBoot === 'function' ? G.__rnBoot(BI) !== false : true; }
  catch (e) { if (used === 'live') { G.__rnLiveErr = '시작 코드 오류: ' + String(e && e.message || e); sv('rn-live-bad', { ver: L.ver, at: Date.now(), err: G.__rnLiveErr }); G.__rnModQ = Q0; G.__rnBoot = B0; G.ReadnowPcMods = Object.assign({}, PM0); G.__RN_FILE_VER = prevFV; used = 'classic'; G.__rnLiveUsed = used; G.__rnLiveVer = CLASSIC; BI.used = used; try { go = typeof B0 === 'function' ? B0(BI) !== false : true; } catch (e2) { go = true; try { console.error('[리드나우] 시작 코드 오류', e2); } catch (x) {} } } else { go = true; try { console.error('[리드나우] 시작 코드 오류', e); } catch (x) {} } }
  if (!go) return;
  const run = G.__rnModQ; G.__rnModQ = []; for (const [k, , fn] of run) { try { fn(); } catch (e) { try { console.error('[리드나우] 모듈 ' + k + ' 시작 오류', e); window.__rnLog && window.__rnLog('수집기', 'err', '모듈 ' + k + ' 시작 오류: ' + (e && e.message)); } catch (x) {} } }
  if (G.__rnLiveErr) setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'err', '⚡ 빠른 업데이트로 받아 둔 판 ' + (L && L.ver) + '을 시작하지 못해 이 판(' + CLASSIC + ')으로 돎: ' + G.__rnLiveErr); } catch (x) {} }, 3000);
  else if (used === 'live') setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 빠른 업데이트로 받아 둔 판 ' + L.ver + '으로 돎 (Tampermonkey의 본체는 ' + CLASSIC + ')'); } catch (x) {} }, 3000);
  if (window.top !== window) return;
  const sha = async (t) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  let busy = false; const chk = async (force) => { if (busy || gv('rn-live-noeval', null) || gv('rn-live-off', false)) return; /* 이 브라우저가 받아 둔 코드를 돌리지 못하게 막음 — Tampermonkey 자동 업데이트만 씀 · (1.63.11 자동 점검) 빠른 업데이트를 꺼 둔 PC도 받지 않음(받아 두면 새로고침해도 이 판으로 떠 끝없이 새로고침) */ if (!force && Date.now() - (+gv('rn-live-at', 0) || 0) < 4 * 60e3) { const H = gv('rn-live', null); const bd0 = gv('rn-live-bad', null); if (H && H.ver && vn(H.ver) > vn(G.__rnLiveVer) && H.hsig === HSIG && !(bd0 && bd0.ver === H.ver)) { /* (1.63.11 자동 점검) 시작에 실패한 판은 지름길로도 다시 부르지 않음 */ try { window.__rnLiveReady && window.__rnLiveReady(H.ver); } catch (e) {} } return; } busy = true; sv('rn-live-at', Date.now());
    try { const r = await fetch(RAWL + 'pc-live.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('pc-live.json HTTP ' + r.status); const M = await r.json(); sv('rn-live-seen', { ver: M.ver, at: Date.now() });
      if (!M || !M.ver || !Array.isArray(M.files) || vn(M.ver) <= vn(G.__rnLiveVer)) return; const bd = gv('rn-live-bad', null); if (bd && bd.ver === M.ver) return;
      if (M.hsig !== HSIG) { G.__rnLiveHsigWait = M.ver; sv('rn-live-hwait', { ver: M.ver, hsig: M.hsig, mine: HSIG, at: Date.now() }); if (G.__rnPubChrome && gv('rn-live-hopen', '') !== M.ver) { sv('rn-live-hopen', M.ver); try { GM_openInTab(RAWL + 'readnow-collector.user.js?v=' + M.ver, { active: true, insert: true }); } catch (e) {} } /* (1.70.5) 로거 크롬: 머리가 바뀐 새 판이면 Tampermonkey 설치 화면을 바로 열어 줌('업데이트'만 누르면 됨) */ if (gv('rn-live-hnote', '') !== M.ver) { sv('rn-live-hnote', M.ver); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 새 판 ' + M.ver + '은 머리(화면·권한)가 바뀐 판이라 빠른 업데이트로 못 바꿈 — Tampermonkey 업데이트(대시보드 → 업데이트 확인)를 기다림'); } catch (e) {} } return; }
      const H = gv('rn-live', null); if (!(H && H.ver === M.ver && H.hsig === HSIG)) { let code = ''; for (const f of M.files) { const t = await (await fetch(RAWL + f.f + '?v=' + f.v + '&h=' + String(f.sha).slice(0, 10), { cache: 'no-store' })).text(); const h = await sha(t); if (h !== f.sha) throw new Error(f.f + ' 지문이 다름(GitHub 캐시가 아직 옛 파일 — 다음 확인 때 다시)'); code += '\n;' + t + '\n'; }
        sv('rn-live', { ver: M.ver, hsig: HSIG, code, at: Date.now(), n: M.files.length }); try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 새 판 ' + M.ver + '을 GitHub에서 받아 둠(파일 ' + M.files.length + '개 · 지문 확인) — 쉬는 사이 새로고침해 바꿈'); } catch (e) {} }
      try { window.__rnLiveReady && window.__rnLiveReady(M.ver); } catch (e) {} }
    catch (e) { const m = String(e && e.message || e); if (gv('rn-live-err', '') !== m) { sv('rn-live-err', m); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 빠른 업데이트 확인 실패: ' + m); } catch (x) {} } } finally { busy = false; } };
  window.__rnLiveCheck = () => chk(true); window.__rnLiveInfo = () => ({ used: G.__rnLiveUsed, ver: G.__rnLiveVer, classic: CLASSIC, hsig: HSIG, hwait: G.__rnLiveHsigWait || null, have: (gv('rn-live', null) || {}).ver || null, seen: gv('rn-live-seen', null), bad: gv('rn-live-bad', null), err: gv('rn-live-err', '') || null, noeval: gv('rn-live-noeval', null) });
  setTimeout(() => chk(false), 20000); setInterval(() => chk(false), (G.__rnPubChrome ? 2 : 5) * 60e3); /* (1.70.5) 로거는 2분마다 */ })();
(function rnModCheck() {
  if (window.top !== window) return;
  const want = [["boot","readnow-pc-boot.js"],["runtime","readnow-pc-runtime.js"],["crm","readnow-pc-crm.js"],["products","readnow-pc-products.js"],["ship","readnow-pc-ship.js"],["helper","readnow-pc-helper.js"]]; const V = globalThis.__rnLiveVer || '1.89.93'; const got = (typeof globalThis !== 'undefined' && globalThis.ReadnowPcMods) || window.ReadnowPcMods || {};
  const bad = want.filter(([k]) => got[k] !== V).map(([k, f]) => `${f} ${got[k] ? got[k] + ' (본체 ' + V + ')' : '못 받음'}`);
  window.__rnModsOk = !bad.length; window.__rnMods = { ...got, aladin: (globalThis.ReadnowAladin || {}).VERSION || null, exec: (globalThis.ReadnowExec || {}).VERSION || null };
  if (!bad.length) return;
  try { window.__rnLog && window.__rnLog('수집기', 'err', '모듈 판이 맞지 않음: ' + bad.join(', ') + ' — GitHub에 올렸는지 확인하고 본체를 다시 붙여넣기'); } catch (e) {}
  const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;right:10px;bottom:52px;z-index:2147483646;max-width:min(380px,90vw);background:#B0322A;color:#fff;padding:6px 10px;border-radius:8px;font:600 12px/1.45 system-ui,Malgun Gothic,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.2);cursor:pointer'; /* (1.66.0) 왼쪽 위(샵매니저 단추를 가리고 닫을 수 없었음) → 오른쪽 아래 · 누르면 작은 단추로 접힘 */ d.title = '누르면 접힘/펼침';
    d.textContent = '리드나우 수집기 ' + V + ': 모듈 판이 맞지 않음 — ' + bad.join(' · ') + '. GitHub에 모듈 파일을 올렸는지 확인한 뒤 본체를 다시 붙여넣어 주세요.'; const full = d.textContent; let small = false; d.onclick = () => { small = !small; d.textContent = small ? '⚠ 수집기 판 다름 — 누르면 자세히' : full; d.style.padding = small ? '3px 9px' : '6px 10px'; }; if (globalThis.__rnPubChrome && !globalThis.__rnSR) return; /* (1.71.1 자동 점검) 로거 크롬의 쉬는 알라딘 화면에는 띄우지 않음(기록에만) */ (globalThis.__rnMount ? globalThis.__rnMount(d) : document.body.appendChild(d)); };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
