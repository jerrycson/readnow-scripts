// ==UserScript==
// @name         리드나우 수집기
// @namespace    readnow
// @version      1.43.1
// @description  고객·주문·상품·판매자·매입(알라딘 구매·팔기)·구매자 분포를 Firebase(readnow-3a385)로 수집하는 통합 수집기 — 고객 수집기·상품 수집기를 합친 것
// @match        https://www.aladin.co.kr/scm/worders.aspx*
// @match        https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx*
// @match        https://www.aladin.co.kr/scm/wpopup_order.aspx*
// @match        https://www.aladin.co.kr/scm/wrecord_edit.aspx*
// @match        https://www.aladin.co.kr/scm/worder_delivery.aspx*
// @match        https://www.aladin.co.kr/scm/worder_process.aspx*
// @match        https://www.aladin.co.kr/scm/wUsedShopC2C*
// @match        https://www.aladin.co.kr/scm/wusedshopc2c*
// @match        https://www.aladin.co.kr/scm/wShopSurvey*
// @match        https://www.aladin.co.kr/scm/wshopsurvey*
// @match        https://www.aladin.co.kr/*login*
// @match        https://www.aladin.co.kr/*Login*
// @match        https://*.aladin.co.kr/*login*
// @match        https://*.aladin.co.kr/*Login*
// @noframes
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-orders-core.js?v=0.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-sellers-core.js?v=1.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-products-core.js?v=0.14.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-core.js?v=1.4.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pricing-core.js?v=0.15.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-shipping-core.js?v=0.5.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-registry.js?v=0.5.0
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-aladin-core.js?v=0.1.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-exec-core.js?v=0.1.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-runtime.js?v=1.43.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-crm.js?v=1.43.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-products.js?v=1.43.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-ship.js?v=1.43.1
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pc-helper.js?v=1.43.1
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_openInTab
// @grant        window.close
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      readnow-3a385-default-rtdb.asia-southeast1.firebasedatabase.app
// @connect      readnow-seller-db-default-rtdb.asia-southeast1.firebasedatabase.app
// @connect      image.aladin.co.kr
// @connect      www.yes24.com
// @connect      firebasestorage.googleapis.com
// @connect      search.shopping.naver.com
// @connect      www.google.com
// @connect      googleapis.com
// @connect      firebaseapp.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       document-idle
// ==/UserScript==
/* 리드나우 수집기 1.43.1 본체 — 개편 3단계: 코드는 GitHub의 모듈 파일 5개(위 @require), 여기는 모두 왔는지만 확인.
 * 올리는 순서: ① GitHub에 readnow-aladin-core.js · readnow-pc-*.js 5개 → ② 이 본체를 Tampermonkey에 붙여넣기 (먼저 붙이면 Tampermonkey가 파일을 못 받아 알림)
 * 모듈 판이 본체와 다르면(Tampermonkey가 옛 파일을 기억 · GitHub에 안 올림) 오른쪽 위에 빨간 띠 + 작업 기록에 남김 */
(function rnModCheck() {
  if (window.top !== window) return;
  const want = [["runtime","readnow-pc-runtime.js"],["crm","readnow-pc-crm.js"],["products","readnow-pc-products.js"],["ship","readnow-pc-ship.js"],["helper","readnow-pc-helper.js"]]; const V = '1.43.1'; const got = (typeof globalThis !== 'undefined' && globalThis.ReadnowPcMods) || window.ReadnowPcMods || {};
  const bad = want.filter(([k]) => got[k] !== V).map(([k, f]) => `${f} ${got[k] ? got[k] + ' (본체 ' + V + ')' : '못 받음'}`);
  window.__rnModsOk = !bad.length; window.__rnMods = { ...got, aladin: (globalThis.ReadnowAladin || {}).VERSION || null, exec: (globalThis.ReadnowExec || {}).VERSION || null };
  if (!bad.length) return;
  try { window.__rnLog && window.__rnLog('수집기', 'err', '모듈 판이 맞지 않음: ' + bad.join(', ') + ' — GitHub에 올렸는지 확인하고 본체를 다시 붙여넣기'); } catch (e) {}
  const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:8px;z-index:2147483647;max-width:560px;background:#B0322A;color:#fff;padding:9px 12px;border-radius:9px;font:600 13px/1.5 system-ui,Malgun Gothic,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    d.textContent = '리드나우 수집기 ' + V + ': 모듈 판이 맞지 않음 — ' + bad.join(' · ') + '. GitHub에 모듈 파일을 올렸는지 확인한 뒤 본체를 다시 붙여넣어 주세요.'; document.body.appendChild(d); };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
