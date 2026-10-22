/* readnow-pc-products.js — 리드나우 수집기 1.89.31의 모듈 ②③⑤⑦ 상품·시장·판매자·매입·일괄/매일 자동 — 상품 조회, 도서 정보·시장 지표, 사진, 매물 유의 사항, 판매자 평가, 구매자 분포, 알라딘 구매·팔기, 맡긴 일, 일정
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { products: '1.89.31' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
;(globalThis.__rnModQ = globalThis.__rnModQ || []).push(['products', '1.89.31', function () {
/* ═════════════ 상품·판매자·매입 (예전 상품 수집기) ═════════════ */

/* 원칙
 *  - 알라딘 페이지를 여는 작업은 고객 수집기와 같은 잠금(crm_system/work_lock)을 쓴다.
 *    → 두 수집기를 통틀어 한 번에 한 PC, 한 작업만 알라딘을 훑는다.
 *  - 이미지는 "이미지 줄". 여러 PC가 20권씩 나눠 맡아(임대) 동시에 해도 겹치지 않는다. 알라딘 줄과 별개라 다른 PC는 다른 일을 할 수 있다.
 *  - 모든 긴 작업은 진행 위치를 수시로 저장하고, 끊기면 그 자리부터 이어 한다.
 *  - 올릴 때는 합치기만 한다. 빈 값으로 덮지 않고 웹앱 담당 칸은 건드리지 않는다. 바뀐 것만 기록한다.
 */
(async function () {
  'use strict';
  const VER = ((typeof globalThis !== 'undefined' && globalThis.__RN_FILE_VER) || (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version)) || '1.58.0'; // (1.36.0) 예전엔 '1.27.0'에 멈춰 있었음 — 표시만이 아니라 'PC끼리 새 판 맞추기'(crm_system/collector_version)도 1.27.0으로 비교해 멈춰 있었음. 이제 맨 위 @version 한 곳
  let REQ_PEND = 0, MET_PEND = 0, SHIP_PEND = 0, PREEMPT = null, PROG_NOW = null; /* (1.73.0) 💤 쉬는 칸 양보·미뤄 둔 요청 — 맨 앞에 두어 먼저 오는 알림도 씀 */
  const APP_VER = VER; // (1.42.0) 상품 쪽에 APP_VER가 없어(고객 쪽 안에만 있었음) 상태 신호·맡긴 일 받기가 'APP_VER is not defined'로 멈추던 것 — 같은 값을 여기에도
  const LOGIN_FLAG = 'rnp-autologin-pending';
  /* ── 로그인 페이지: 이 수집기가 로그인 풀림을 감지해 연 탭에서만 자동 입력 (고객 수집기와 같은 방식) ── */
  {
    const pw = [...document.querySelectorAll('input[type="password"]')].find((i) => i.offsetParent !== null || i.getClientRects().length);
    const fl = GM_getValue(LOGIN_FLAG, null);
    if (fl && Date.now() - fl.at < 3 * 60 * 1000 && !(window.__rnLoginMethod && window.__rnLoginMethod() === 'naver')) {
      if (pw) {
        const cred = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
        if (cred && cred.id && cred.pw) {
          if (fl.submittedAt && Date.now() - fl.submittedAt < 60000) { GM_setValue(LOGIN_FLAG, { ...fl, result: 'failed' }); return; }
          const form = pw.form || document;
          const idInput = [...form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])')].find((i) => i.getClientRects().length && i !== pw);
          if (!idInput) { GM_setValue(LOGIN_FLAG, { ...fl, result: 'no-id-field' }); return; }
          const setVal = (inp, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
          setVal(idInput, cred.id); setVal(pw, cred.pw);
          [...document.querySelectorAll('input[type="checkbox"]')].forEach((c) => { const lab = (c.id && document.querySelector(`label[for="${c.id}"]`)) || c.closest('label') || c.parentElement; if (lab && /상태\s*유지|자동\s*로그인/.test(lab.textContent) && !c.checked) c.click(); });
          GM_setValue(LOGIN_FLAG, { ...fl, submittedAt: Date.now() });
          await new Promise((r) => setTimeout(r, 400));
          const btn = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],a')].find((b) => /^\s*로그인\s*$/.test(b.textContent || b.value || b.alt || '') || b.type === 'submit' || b.type === 'image');
          if (btn) btn.click(); else if (pw.form) pw.form.submit();
        }
        return;
      }
      if (fl.submittedAt) GM_setValue(LOGIN_FLAG, { ...fl, result: 'maybe-ok' });
    }
  }
  if (!globalThis.__rnPubHome && (!/\/scm\/(wrecord_edit|worders|worder_preparatory_complete)\.aspx/i.test(location.pathname) || window.top !== window)) return; // 통합 수집기: 상품 조회·주문조회 화면 어디서나
  const WRITER_SCHEMA = 6;
  const PUBONLY = !!globalThis.__rnPubHome; /* (1.64.0) 🌐 공개 전용 PC — 로그인 줄 일·로그인·주문 읽기를 하지 않음 */
  const P = window.ReadnowProducts || globalThis.ReadnowProducts;
  const PACE = P.makePacer('aladin'); // 알라딘 요청 속도: 이 PC의 모든 탭·스크립트가 같이 씀 (readnow-products-core.js makePacer)
  if (!P) { window.__rnNote('[리드나우 상품 수집기] 파서 파일(readnow-products-core.js)을 불러오지 못했습니다. GitHub에 올렸는지 확인해 주세요.'); return; }
  // 공용 파일이 요구 버전보다 '옛것'일 때만 알림 (같거나 더 새것이면 조용히 씀). 요구 버전은 이 한 곳에서만 정함
  const NEED_FILES = { '상품 파서 readnow-products-core.js': [() => P.VERSION, '0.14.0'], '판매자 파서 readnow-sellers-core.js': [() => (window.ReadnowSellers || globalThis.ReadnowSellers || {}).VERSION, '1.3.0'], '판매자 분류 기준 readnow-core.js': [() => (((typeof unsafeWindow !== 'undefined' && unsafeWindow.ReadNowCore) || window.ReadNowCore || globalThis.ReadNowCore || {}).CORE_VERSION), '1.3.0'], '판정 엔진 readnow-pricing-core.js': [() => (window.ReadnowPricing || globalThis.ReadnowPricing || {}).VERSION, '0.9.1'], '출고 기준 readnow-shipping-core.js': [() => (window.ReadnowShipping || globalThis.ReadnowShipping || {}).VERSION, '0.5.1'], '관리도구 노선표 readnow-registry.js': [() => (window.ReadnowRegistry || globalThis.ReadnowRegistry || {}).VERSION, '0.2.0'] };
  const verN = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
  const OLD_FILES = Object.entries(NEED_FILES).map(([k, [g, w]]) => [k, g(), w]).filter(([, v, w]) => verN(v) < verN(w));
  if (OLD_FILES.length) window.__rnNote(`[리드나우 수집기] GitHub의 공용 파일이 이 수집기보다 옛 버전입니다:\n${OLD_FILES.map(([k, v, w]) => `· ${k}: ${v || '못 읽음'} (필요 ${w} 이상)`).join('\n')}\n새 파일을 올린 뒤 몇 분 뒤 새로고침해 주세요.`);
  const LS = { get: (k, d) => GM_getValue(k, d), set: (k, v) => GM_setValue(k, v) };
  const TAB_ID = 't' + Math.random().toString(36).slice(2, 8); // 같은 PC의 탭 구분
  const PC_ID = LS.get('pcId') || (() => { const id = 'pc_' + Math.random().toString(36).slice(2, 8); LS.set('pcId', id); return id; })();
  if (!LS.get('pcName') && (GM_getValue('rn-pc', null) || {}).name) LS.set('pcName', GM_getValue('rn-pc').name); // 고객 쪽 PC 이름과 같이 씀
  const PC_NAME = (window.__rnPcName && window.__rnPcName.get()) || LS.get('pcName', PC_ID);

  // 기본 앱을 써서 같은 브라우저의 고객 수집기와 Firebase 로그인을 공유
  if (!firebase.apps.length) firebase.initializeApp({
    apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385',
    storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15',
  });
  const app = firebase.app();
  /* (1.71.0) 🛡 로거 크롬: 로그인을 알라딘 쪽 저장소에 두지 않음 — 로그인되면 Tampermonkey 저장소(rn-fbuser)에 사본을 두고 Firebase는 메모리 보관(NONE)으로 옮김(IndexedDB 기록이 지워짐) · 다음에 열 때 실행기가 사본을 잠깐 넣어 다시 로그인됨 */
  if (globalThis.__rnPubChrome) { try { const A0 = app.auth(); A0.onIdTokenChanged((u) => { if (!u) return; try { GM_setValue('rn-fbuser', { key: 'firebase:authUser:' + app.options.apiKey + ':' + app.name, value: u.toJSON(), at: Date.now() }); } catch (e) {} if (!window.__rnPersNone) { window.__rnPersNone = 1; setTimeout(() => A0.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(() => { window.__rnPersNone = 0; }), 1500); } }); } catch (e) {} }
  /* (1.71.1 자동 점검) 🛡 로거 로그인 되살리기를 모듈에서도 — ⚡ 빠른 업데이트는 모듈만 바꾸고 Tampermonkey 본체(실행기)는 Tampermonkey 업데이트 때까지 옛 판이라,
   *  옛 실행기(1.70.x)에서는 위의 '메모리로 옮김' 뒤 새로고침하면 아무도 되살리지 않아 로거가 로그아웃된 채 멈췄음
   *  → 첫 로그인 상태가 '없음'이면 rn-fbuser를 알라딘 쪽 저장소에 잠깐 넣음(Firebase가 1초 안에 알아채 로그인 → 위에서 다시 메모리로) · 5초 안에 안 되면 새로고침
   *  → 되살리기는 3분에 한 번 · 3번 연속 안 되면 멈추고 알림 · 이 화면에서 로그인됐다가 로그아웃되면(직접 로그아웃·열쇠 막힘) rn-fbuser도 지움(로그아웃이 다음 화면에서 되살아나지 않게) */
  if (globalThis.__rnPubHome) (function rnAuthKeep() { try { const A = app.auth(); let had = false, init = false, busy = false;
    A.onIdTokenChanged((u) => { try { if (u) { had = true; GM_deleteValue('rn-fbuser-try'); } else if (had) { had = false; GM_deleteValue('rn-fbuser'); } } catch (e) {} });
    const restore = () => { try { if (busy || !init || A.currentUser) return; const U = GM_getValue('rn-fbuser', null); if (!U || !U.key || !U.value) return; const T = GM_getValue('rn-fbuser-try', null) || { at: 0, n: 0 }; if (Date.now() - (T.at || 0) < 3 * 60e3) return;
        if ((T.n || 0) >= 3) { if (!T.told) { GM_setValue('rn-fbuser-try', { ...T, told: 1 }); window.__rnNote && window.__rnNote('🔑 저장해 둔 구글 로그인으로 3번 다시 로그인하지 못했습니다 — 수집기의 구글 로그인을 다시 해 주세요(또는 이 크롬의 웹앱에서 로그인)', 'warn'); } return; }
        GM_setValue('rn-fbuser-try', { at: Date.now(), n: (T.n || 0) + 1 }); busy = true; const rq = indexedDB.open('firebaseLocalStorageDb', 1); rq.onupgradeneeded = () => { try { rq.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); } catch (e) {} }; rq.onerror = () => { busy = false; };
        rq.onsuccess = () => { const db = rq.result; try { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: U.key, value: U.value }); tx.oncomplete = () => { db.close(); try { window.__rnLog && window.__rnLog('수집기', 'info', '🔑 저장해 둔 구글 로그인으로 다시 로그인'); } catch (e) {} setTimeout(() => { busy = false; if (!A.currentUser) location.reload(); }, 5000); }; tx.onerror = () => { db.close(); busy = false; }; } catch (e) { try { db.close(); } catch (x) {} busy = false; } }; } catch (e) { busy = false; } };
    A.onAuthStateChanged(() => { if (!init) { init = true; setTimeout(restore, 300); } }); setInterval(restore, 30e3); } catch (e) {} })();
  /* (1.70.4) 🔑 로그인 넘겨받기 — 로거 크롬의 웹앱에서 로그인한 기록(rn-authxfer, 10분 안)을 이 탭(알라딘)의 Firebase 저장소에 넣고 새로고침 */
  if (globalThis.__rnPubHome) setTimeout(() => { try { if (app.auth().currentUser) { GM_deleteValue('rn-authxfer'); return; } const X = GM_getValue('rn-authxfer', null); if (!X || !X.value || Date.now() - (X.at || 0) > 10 * 60e3) return; GM_deleteValue('rn-authxfer');
      const rq = indexedDB.open('firebaseLocalStorageDb', 1); rq.onupgradeneeded = () => { try { rq.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); } catch (e) {} };
      rq.onsuccess = () => { try { const db = rq.result; const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: X.key, value: X.value }); tx.oncomplete = () => { db.close(); try { window.__rnLog && window.__rnLog('수집기', 'info', '🔑 웹앱의 로그인(' + (X.value.email || '') + ')을 넘겨받음 — 새로고침'); } catch (e) {} setTimeout(() => location.reload(), 800); }; } catch (e) {} }; } catch (e) {} }, 4000);
  setInterval(() => { try { if (globalThis.__rnPubHome && !app.auth().currentUser) { const X = GM_getValue('rn-authxfer', null); if (X && Date.now() - (X.at || 0) < 10 * 60e3 && !window.__rnXferReload) { window.__rnXferReload = 1; location.reload(); } } } catch (e) {} }, 5000);
  try { if (globalThis.__rnPubHome) app.auth().getRedirectResult().then((r) => { if (r && r.user) setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'info', '🔑 구글 로그인 됨(이 탭에서)'); } catch (e) {} }, 2000); }).catch((e) => setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'warn', '이 탭 로그인 실패: ' + (e.code || e.message)); } catch (x) {} }, 2000)); } catch (e) {} /* (1.70.3) '이 탭에서 로그인'으로 돌아왔을 때 */
  const db = app.firestore();
  const auth = app.auth();
  const TS = () => firebase.firestore.FieldValue.serverTimestamp();
  const W = () => ({ uploadedAt: TS(), writerSchema: WRITER_SCHEMA, writer: PC_NAME });
  const C = (n) => db.collection(n);
  /* ── 가격 감시 표시 (1.22.0): 상품 조회/수정 목록의 각 줄에 판정 엔진 묶음을 색으로 표시 ── */
  // 묶음 배정은 판정 엔진(readnow-pricing-core.js)의 groupOf 하나로만 계산 → 웹앱과 같은 결과. 비율 설정은 Firestore prd_system/pricing (없으면 엔진 기본값)
  const PR = window.ReadnowPricing || globalThis.ReadnowPricing || null;
  // 색: 초록은 검토에 쓰는 색이라 피함 → 적용 = 파랑, 비교 = 보라. 보관함(일시판매중지)은 관리코드 뒤 3자리로 구분 (기준: 판정 엔진 skuTag)
  const MON = { treat: ['감시·적용', '#1F5FAF', '#E2ECFA', '판정 엔진이 매일 보고 가격을 맞추는 상품'], control: ['감시·비교', '#6B3FA0', '#EEE6F7', '판정만 기록하고 가격은 절대 안 바꾸는 비교 묶음 (효과 측정용)'], hold: ['가격상승대기 PND', '#8A4B0F', '#FBEBD9', '판매보류풀: 일시판매중지 + 관리코드 뒤 PND. 정한 가격 이상으로 최저가에 설 수 있을 때만 판매중'], retire: ['불용 BAD', '#555555', '#ECECEC', '불용 재고: 일시판매중지 + 관리코드 뒤 BAD (4년 초과, 관리자 승인)'], excluded: ['자동 제외', '#B0322A', '#FDE2E0', '자동 감시 제외 관리코드(KHKDVD 등) — 관리자 확인 필수'] }; // 자동 제외는 빨강 (노랑·초록은 다른 뜻으로 쓰는 색)
  // 전체 모아보기: 우리 상품 기록(prd_listings) 전체에서 한 묶음만 골라 나란히 정렬 (알라딘 목록은 서버가 쪽으로 나눠 보내 화면에서 전체를 고를 수 없음)
  let MONALL = null;
  async function openMonView(k, S0) {
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.35);display:flex;justify-content:center;align-items:flex-start;padding:30px 10px;overflow:auto';
    const [lbl, fg, bg, why] = MON[k]; ov.innerHTML = `<div style="background:#fff;border-radius:10px;width:min(1100px,100%);padding:12px;font:13px/1.5 sans-serif;color:#1E2B28"><div style="display:flex;justify-content:space-between;align-items:center"><b style="color:${fg};font-size:16px">${lbl} — 전체 모아보기</b><a href="#" id="mv_x">닫기 ✕</a></div><div style="color:#5B6B66">${why}</div><div id="mv_body">우리 상품 기록 읽는 중…</div></div>`;
    globalThis.__rnMount(ov); ov.querySelector('#mv_x').onclick = (e) => { e.preventDefault(); ov.remove(); }; ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    if (!MONALL) { const m = []; const ss = await C('prd_listings').get(); ss.forEach((d) => m.push({ id: d.id, ...d.data() })); MONALL = m; }
    const rows = MONALL.filter((l) => PR.groupOfListing(l, S0) === k);
    let sort = 'reg', q = '';
    const draw = () => {
      const f = rows.filter((l) => !q || [l.title, l.usedCode, l.sku, l.isbn13].join(' ').toLowerCase().includes(q.toLowerCase()));
      const by = { reg: (a, b) => String(b.registeredAt || '').localeCompare(String(a.registeredAt || '')), title: (a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ko'), priceD: (a, b) => (b.price || 0) - (a.price || 0), priceA: (a, b) => (a.price || 0) - (b.price || 0), sku: (a, b) => String(a.sku || '').localeCompare(String(b.sku || '')) }[sort];
      f.sort(by);
      ov.querySelector('#mv_body').innerHTML = `<div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><input id="mv_q" placeholder="제목·U코드·관리코드·ISBN" value="${q.replace(/"/g, '&quot;')}" style="flex:1;min-width:200px;padding:6px"><select id="mv_s">${[['reg', '최근 등록 순'], ['title', '제목 순'], ['priceD', '비싼 순'], ['priceA', '싼 순'], ['sku', '관리코드 순']].map(([v, t]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${t}</option>`).join('')}</select><b style="align-self:center">${f.length.toLocaleString()}개</b></div>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:${bg}"><th style="text-align:left;padding:4px">상품명</th><th>관리코드</th><th>등급</th><th style="text-align:right">판매가</th><th>판매상태</th><th>등록일</th><th>바로가기</th></tr>
        ${f.slice(0, 500).map((l) => `<tr style="border-top:1px solid #E1E1E1"><td style="padding:4px">${String(l.title || l.usedCode).replace(/</g, '&lt;')}<br><small style="color:#5B6B66">${l.usedCode || ''}</small></td><td style="text-align:center">${l.sku || ''}</td><td style="text-align:center">${l.grade || ''}</td><td style="text-align:right">${(l.price || 0).toLocaleString()}</td><td style="text-align:center">${l.status || ''}</td><td style="text-align:center">${String(l.registeredAt || '').slice(0, 10)}</td><td style="text-align:center">${l.listingId ? `<a href="/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=${l.listingId}" target="_blank">정보수정</a> · <a href="/shop/wproduct.aspx?ItemId=${l.listingId}" target="_blank">웹 확인</a>` : ''}</td></tr>`).join('')}</table>${f.length > 500 ? `<div style="color:#5B6B66;margin-top:6px">앞의 500개만 표시 — 검색으로 좁히세요</div>` : ''}<div style="color:#5B6B66;margin-top:6px">우리 상품 기록 기준(마지막 상품 수집 때 상태). 판매가·상태는 샵매니저 화면이 가장 최신입니다.</div>`;
      const qi = ov.querySelector('#mv_q'); qi.oninput = () => { clearTimeout(qi._t); qi._t = setTimeout(() => { q = qi.value; draw(); const n = ov.querySelector('#mv_q'); n.focus(); n.setSelectionRange(q.length, q.length); }, 200); };
      ov.querySelector('#mv_s').onchange = (e) => { sort = e.target.value; draw(); };
    };
    draw();
  }
  async function paintMonitorBadges() {
    if (!/\/scm\/wrecord_edit\.aspx/i.test(location.pathname) || !PR) return;
    let cfg = {}; try { await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); }); const d = await C('prd_system').doc('pricing').get(); cfg = d.exists ? d.data() : {}; } catch (e) {}
    const S0 = { rollout: cfg.rollout || PR.DEFAULTS.rollout, excludeSku: cfg.excludeSku || PR.DEFAULTS.excludeSku, excludeUsed: cfg.excludeUsed || [] };
    const parsed = P.parseScmList(document); const byId = new Map(parsed.rows.map((r) => [String(r.listingId), r]));
    let n = { treat: 0, control: 0, hold: 0, retire: 0, excluded: 0 };
    document.querySelectorAll('input.batchChkBox').forEach((cb) => {
      const r = byId.get(String(cb.value)); if (!r || !r.usedCode) return; const tr = cb.closest('tr'); if (!tr || tr.querySelector('.rn-mon')) return;
      const g = PR.groupOfListing(r, S0); if (!MON[g]) return; n[g]++; // 묶음·보관함·제외 판단은 판정 엔진 한 곳
      const [lbl, fg, bg, why] = MON[g]; tr.style.background = bg;
      const cell = tr.querySelector(`#priceSalesChg_val_${cb.value}`); const b = document.createElement('div'); b.className = 'rn-mon'; b.dataset.g = g; b.title = why;
      b.style.cssText = `display:inline-block;margin-top:2px;padding:0 5px;border-radius:8px;font-size:11px;font-weight:700;color:#fff;background:${fg}`; b.textContent = lbl;
      (cell ? cell.parentNode : tr.lastElementChild).appendChild(b);
    });
    const tbl = document.querySelector('input.batchChkBox'); if (!tbl || globalThis.__rnById('rn-mon-legend')) return;
    const lg = document.createElement('div'); lg.id = 'rn-mon-legend'; lg.style.cssText = 'margin:6px 0;padding:6px 10px;border:1px solid #D6DDDA;border-radius:8px;background:#fff;font-size:12px;color:#1E2B28';
    const rp = S0.rollout || {}; lg.innerHTML = `<b>가격 감시 범례</b> (판정 엔진 · 적용 ${rp.treatPct || 0}% / 비교 ${rp.controlPct || 0}%) ` + Object.entries(MON).map(([k, [l, fg, bg, why]]) => `<span title="${why}" style="display:inline-block;margin:0 4px;padding:1px 6px;border-radius:8px;background:${bg};border:1px solid ${fg};color:${fg};font-weight:700">${l} <small>이 쪽 ${n[k]}</small> <a href="#" data-monall="${k}" style="color:${fg}">전체 모아보기</a> <a href="#" data-monhere="${k}" style="color:${fg}">이 쪽만</a></span>`).join('') + ' <a href="#" data-monhere="" style="color:#5B6B66">이 쪽 전부 보기</a><br><span style="color:#5B6B66">줄 배경색 = 묶음 · 표시 없는 줄 = 감시 대상 아님 · 알라딘 목록은 알라딘 서버가 25~100개씩 나눠 보내므로, 전체에서 고르기는 \'전체 모아보기\'(우리 상품 기록 기준)로 봅니다</span>';
    const table = tbl.closest('table'); if (table && table.parentNode) table.parentNode.insertBefore(lg, table);
    lg.querySelectorAll('[data-monhere]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const k = a.dataset.monhere; document.querySelectorAll('input.batchChkBox').forEach((cb) => { const tr = cb.closest('tr'); if (!tr) return; const b = tr.querySelector('.rn-mon'); const show = !k || (b && b.dataset.g === k); tr.style.display = show ? '' : 'none'; const sep = tr.nextElementSibling; if (sep && !sep.querySelector('input.batchChkBox')) sep.style.display = show ? '' : 'none'; }); }));
    lg.querySelectorAll('[data-monall]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); openMonView(a.dataset.monall, S0).catch((er) => alert('모아보기 실패: ' + er.message)); }));
  }
  setTimeout(() => { if (window.__rnFeat && !window.__rnFeat('monitor')) return; /* (1.63.7) 🧩 */ paintMonitorBadges().catch(() => {}); }, 800);
  /* ── 현금 판매 (1.27.2~1.30.0) ──
   * ① 판매중지 전(빨강): '지금 판매중지로 바꾸기'(상품 조회/수정의 판매상태 바꾸기와 같은 요청) · '이미 했음'
   * ② 현금 판매 완료(초록, 접힘): '다시 판매중으로 — 반품·교환' (이유·메모 → 알라딘 판매중으로 바꾸고 웹앱 기록에도 남김: 반품 = 그 줄 매출에서 빠짐, 교환·기타 = 매출은 그대로 두고 상품만 다시 판매)
   * 🧪 테스트(이터널 선샤인만): 판매중으로 → 띠가 다시 빨강으로 나타남 → '지금 판매중지로 바꾸기' → 판매중지 목록으로 가서 그 줄을 표시. 웹앱에는 테스트 신호만 보내고 기록은 바꾸지 않음 — 몇 번이든 반복 */
  const STOP_TXT = { cash: ['💵 현금 판매 완료', '#2e7d32'], elsewhere: ['다른 판매처에서 판매', '#2e7d32'], lost: ['분실·파손', '#8d6e63'], keep: ['보관·개인 소장', '#546e7a'], check: ['검수·확인 대기', '#b58100'], other: ['기타', '#757575'] };
  const ST_CODE = { 판매중: 1, 판매대기: 41, 일시판매중지: 3, 판매중지: 15, 판매완료: 18, 판매금지: 16 };
  const isTestItem = (it) => /이터널\s*선샤인/.test(String(it.title || '').replace(/\s+/g, ' '));
  const stopListUrl = (kw) => `/scm/wrecord_edit.aspx?chkItemStockStatus=15&chkItemInDate=0&searchCat1=0&searchType=1&keyword=${encodeURIComponent(kw || '')}&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=15&categoryId=0`;
  async function setAladinStatus(listingId, before, to) { // 상품 조회/수정 화면의 판매상태 일괄 변경과 같은 요청
    const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(before), stockStatusToDo: String(to), items: String(listingId) });
    const rr = await fetch('/scm/wrecord_edit_usedbatch.aspx', { method: 'POST', body: fd, credentials: 'include' }); const txt = await rr.text(); const al = (txt.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || '';
    if (!rr.ok || /실패|오류|error/i.test(al)) throw new Error(al || ('HTTP ' + rr.status)); return al; }
  async function statusCodeOf(it) { try { const ld = (await C('prd_listings').doc(it.listingKey || ('aladin_' + it.aladinUsedCode)).get()).data(); if (ld && ST_CODE[ld.status]) return ST_CODE[ld.status]; } catch (er) {} return null; }
  const sendSignal = (phase, t, extra) => C('shp_cmds').add({ type: 'cashTest', status: 'signal', phase, orderId: t.id, lineNo: t.it.lineNo, title: t.it.title, listingId: t.it.listingId || null, at: nowIso(), createdAt: nowIso(), by: PC_NAME, ...(extra || {}), uploadedAt: TS() }).catch(() => {});
  // (1.37.0) 현금 판매 판매중지 도우미 — 띠의 단추와 웹앱이 맡긴 일(cashStop)이 같이 씀
  const cashLidOf = async (t) => { if (t.it.listingId) return String(t.it.listingId); if (t.rowLid) return String(t.rowLid);
    try { const ld = (await C('prd_listings').doc(t.it.listingKey || ('aladin_' + t.it.aladinUsedCode)).get()).data(); if (ld && ld.listingId) return String(ld.listingId); } catch (er) {} throw new Error('알라딘 상품번호를 못 찾음 — 상품 조회/수정 목록에서 그 줄의 단추로 해 주세요'); };
  const cashInStopList = async (lid, title) => { const kw = String(title || '').replace(/^\[[^\]]*\]\s*/, '').slice(0, 30); if (!kw) return null; try { const r = await fetch(stopListUrl(kw), { credentials: 'include', cache: 'no-store' }); if (!r.ok) return null; const doc = new DOMParser().parseFromString(await r.text(), 'text/html'); return P.parseScmList(doc).rows.some((x) => String(x.listingId) === String(lid)); } catch (e) { return null; } };
  const cashUpdLine = (id, lineNo, fn, what) => db.runTransaction(async (tx) => { const ref = C('crm_orders').doc(id); const sn = await tx.get(ref); if (!sn.exists) throw new Error('현금 판매 기록이 없음'); const o = sn.data();
    const items = JSON.parse(JSON.stringify(o.items || [])); const it = items.find((x) => x.lineNo === lineNo); if (!it) throw new Error('그 줄을 못 찾음'); fn(it);
    const tot = items.filter((x) => x.lineStatus === 'normal').reduce((s, x) => s + (+x.price || 0) * (+x.qty || 1), 0);
    tx.update(ref, { items, totalAmount: tot, uploadedAt: TS(), history: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), by: PC_NAME, what }) }); });
  /* (1.37.0) 웹앱이 맡긴 '현금 판매 → 알라딘 판매중지'(shp_cmds cashStop {orderId, lineNo, listingId, listingKey, usedCode, title}) — 띠의 '지금 판매중지로 바꾸기'와 같은 길, 확인 창 없이
     판매중지 목록에서 그 상품번호를 찾아야 완료('done'), 못 찾으면 원래 상태를 다른 값으로 한 번씩 더 → 그래도 없으면 '확인 필요'(check — 완료로 적지 않음) */
  async function cashStopCmd(ref, v) { const key = `${ref.id}#${v.tries || 1}`; /* (1.44.0) 웹앱이 다시 맡길 때(tries+1)마다 새 열쇠 — 예전엔 같은 열쇠라 '확인 못함' 뒤 다시 하지 못해 현금으로 판 책이 알라딘에 판매중으로 남을 수 있었음. 같은 회차를 다시 하는 것은 그대로 막음 */ const gate = await exBegin('cashStop', key, { orderId: v.orderId, lineNo: v.lineNo, listingId: v.listingId || null, title: v.title || null });
    if (!gate.ok) { await ref.set({ status: 'done', doneAt: nowIso(), by: PC_NAME, result: { state: gate.state === 'done' ? 'skip' : 'check', msg: '실행 문: ' + gate.why }, uploadedAt: TS() }, { merge: true }); return; } // 같은 맡긴 일을 이미 시작했던 것 — 다시 보내지 않고 사람 확인
    try { await cashStopCmd0(ref, v); } finally { let st = 'unknown', msg = null; try { const r = ((await ref.get()).data() || {}).result || {}; st = r.state === 'done' || r.state === 'skip' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown'; msg = r.msg || null; } catch (e) {} await exEnd('cashStop', key, st, msg); } }
  async function cashStopCmd0(ref, v) { const t = { id: v.orderId, it: { lineNo: v.lineNo, listingId: v.listingId || null, listingKey: v.listingKey || null, aladinUsedCode: v.usedCode || null, title: v.title || '' } };
    try { const sn = (await C('crm_orders').doc(v.orderId).get()).data(); const it0 = sn && (sn.items || []).find((x) => x.lineNo === v.lineNo);
      if (!it0 || it0.released || it0.lineStatus !== 'normal' || (it0.aladinStop && it0.aladinStop.status === 'done')) { await ref.set({ status: 'done', result: { state: 'skip', msg: '이미 처리됐거나 판매 줄이 아님' }, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); return; }
      const lid = await cashLidOf(t); if (v.usedCode) { /* (1.59.0) 그 상품번호가 정말 이 상품(상품코드)인지 우리 상품 기록으로 맞춰 봄 — 다르면 엉뚱한 책을 판매중지하지 않고 사람 확인 */ let ld = null; try { const d = await C('prd_listings').doc('aladin_' + String(v.usedCode)).get(); ld = d.exists ? d.data() : null; } catch (er) {} if (ld && ld.listingId && String(ld.listingId) !== String(lid)) { await ref.set({ status: 'done', result: { state: 'check', msg: `상품번호가 맞지 않음(맡긴 ${lid} · 상품 기록 ${ld.listingId}) — 판매중지하지 않음, 알라딘에서 확인` }, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); return; } }
      const before = (await statusCodeOf(t.it)) || 1; let al = await setAladinStatus(lid, before, 15); let ok = await cashInStopList(lid, t.it.title); let usedBefore = before;
      for (const alt of [1, 3, 41]) { if (ok !== false || alt === before) continue; al = await setAladinStatus(lid, alt, 15).catch((e) => e.message); usedBefore = alt; ok = await cashInStopList(lid, t.it.title); }
      const st = ok ? 'done' : 'check'; const by = (auth.currentUser && auth.currentUser.email) || PC_NAME;
      await cashUpdLine(t.id, t.it.lineNo, (it) => { if (it.aladinStop && it.aladinStop.status === 'done') return; it.listingId = it.listingId || lid; it.aladinStop = { status: st, at: nowIso(), by, from: 'collector-auto', before: usedBefore, verified: ok === true, msg: al || null, cmd: ref.id }; }, `알라딘 판매중지로 바꿈(수집기 자동 · 웹앱 저장): ${t.it.title}${ok ? ' · 판매중지 목록에서 확인함' : ' · 판매중지 목록에서 확인 못함(확인 필요)'}${al ? ' · 알라딘: ' + al : ''}`);
      await ref.set({ status: 'done', result: { state: st, listingId: lid, before: usedBefore, msg: al || null }, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`현금 판매 판매중지(자동): ${t.it.title} — ${ok ? '완료' : '확인 필요'}`, ok ? 0 : 1);
    } catch (e) { await ref.set({ status: 'done', result: { state: 'fail', msg: e.message }, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }).catch(() => {}); log('현금 판매 판매중지 실패: ' + e.message, 1); } }
  async function paintCashSold() {
    try { await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); }); if (!auth.currentUser) return;
      const onEdit = /\/scm\/wrecord_edit\.aspx/i.test(location.pathname);
      const [ss, sr] = await Promise.all([C('crm_orders').where('platform', '==', 'cash').get(), onEdit ? C('prd_stop_reasons').get().catch(() => null) : null]);
      const test = GM_getValue('rn-cash-test', null); // 🧪 테스트 중(판매중으로 돌려 놓음) — 그 상품을 다시 빨강으로
      const todo = []; const done = []; const sold = new Map(); const soldT = new Map(); // 관리번호 → 판매중지 했는지
      ss.forEach((d) => { const o = d.data(); (o.items || []).forEach((it) => { if (it.lineStatus !== 'normal' || it.released) return; let ok = !!(it.aladinStop && it.aladinStop.status === 'done');
        const isT = test && test.id === d.id && test.lineNo === it.lineNo; if (isT) ok = false;
        const t0 = { id: d.id, o, it, test: isT }; if (it.aladinUsedCode) { sold.set(String(it.aladinUsedCode), ok); soldT.set(String(it.aladinUsedCode), t0); } if (it.listingId) { sold.set('L' + it.listingId, ok); soldT.set('L' + it.listingId, t0); } (ok ? done : todo).push(t0); }); });
      const reasons = new Map(); if (sr) sr.forEach((d) => { const v = d.data(); if (v.usedCode) reasons.set(String(v.usedCode), v); });
      // 알라딘 상품번호(listingId): 현금 판매 기록에 없으면 우리 상품 기록 → 이 화면의 그 줄 순서로 찾음
      const lidOf = cashLidOf;
      const WHY = { return: '반품', exchange: '교환', other: '기타' };
      // (1.34.0) 판매중지 확인: 바꾼 뒤 '판매중지' 목록에서 그 상품을 실제로 찾아야 완료 — 못 찾으면 원래 상태를 다른 값으로 한 번씩 더 시도, 그래도 없으면 '확인 필요'(완료로 적지 않음)
      const inStopList = cashInStopList;
      // 현금 판매 기록의 한 줄만 바꿈 (트랜잭션: 그 사이 웹앱에서 고친 다른 줄·금액을 덮어쓰지 않음) + 합계 다시 셈
      const updLine = cashUpdLine;
      async function doStop(t, b) { if (!t.test && !confirm(`'${t.it.title}'을(를) 알라딘에서 판매중지로 바꿀까요?`)) return; b.disabled = true; b.textContent = '바꾸는 중…';
        try { const lid = await lidOf(t); const before = t.test ? 1 : (await statusCodeOf(t.it)) || 1; let al = await setAladinStatus(lid, before, 15);
          if (t.test) { await sendSignal('stop', t, { msg: al || null }); GM_deleteValue('rn-cash-test'); GM_setValue('rn-cash-hl', { listingId: lid, at: Date.now() }); location.href = stopListUrl('이터널 선샤인'); return; }
          let ok = await inStopList(lid, t.it.title); let usedBefore = before;
          for (const alt of [1, 3, 41]) { if (ok !== false || alt === before) continue; al = await setAladinStatus(lid, alt, 15).catch((e) => e.message); usedBefore = alt; ok = await inStopList(lid, t.it.title); } // 기록의 원래 상태가 낡았을 때
          const st = ok ? 'done' : 'check'; const by = (auth.currentUser && auth.currentUser.email) || PC_NAME;
          await updLine(t.id, t.it.lineNo, (it) => { it.listingId = it.listingId || lid; it.aladinStop = { status: st, at: nowIso(), by, from: 'collector-stop', before: usedBefore, verified: ok === true, msg: al || null }; }, `알라딘 판매중지로 바꿈(수집기): ${t.it.title}${ok ? ' · 판매중지 목록에서 확인함' : ' · 판매중지 목록에서 확인 못함(확인 필요)'}${al ? ' · 알라딘: ' + al : ''}`);
          if (!ok) { b.disabled = false; b.textContent = '확인 필요 — 다시 시도'; alert(`'${t.it.title}' 판매중지를 보냈지만 판매중지 목록에서 확인하지 못했습니다.\n상품 조회/수정 화면에서 그 상품의 판매 상태를 직접 확인해 주세요. (완료로 적지 않았습니다)`); return; }
          b.textContent = '판매중지 완료 (목록에서 확인)'; setTimeout(paintCashSold, 1200); } catch (er) { b.disabled = false; b.textContent = '다시 시도'; alert('판매중지 바꾸기 실패: ' + er.message + '\n상품 조회/수정 화면에서 직접 바꿔 주세요.'); } }
      async function doReopen(t, why, memo, b) { if (!confirm(`'${t.it.title}'을(를) 알라딘에서 다시 판매중으로 바꾸고 웹앱에 '${WHY[why]}'로 기록할까요?${why === 'return' ? '\n(반품: 이 줄은 현금 판매 매출에서 빠짐)' : ''}`)) return;
        b.disabled = true; b.textContent = '바꾸는 중…';
        try { const lid = await lidOf(t); const al = await setAladinStatus(lid, 15, 1); const by = (auth.currentUser && auth.currentUser.email) || PC_NAME;
          await updLine(t.id, t.it.lineNo, (it) => { it.listingId = it.listingId || lid; it.released = true; it.aladinStop = { ...(it.aladinStop || {}), status: 'reopened', reopenedAt: nowIso(), reason: why, memo: memo || null, by, msg: al || null };
            if (why === 'return') { it.lineStatus = 'returned'; it.returnReason = memo || '현금 판매 반품'; } else it.exchangeNote = memo || WHY[why]; }, `다시 판매중으로(${WHY[why]}): ${t.it.title}${memo ? ' · ' + memo : ''}${al ? ' · 알라딘: ' + al : ''}`);
          b.textContent = '판매중으로 바꿈 · 기록함'; setTimeout(paintCashSold, 1200); } catch (er) { b.disabled = false; b.textContent = '다시 시도'; alert('실패: ' + er.message); } }
      async function doTest(t, b) { b.disabled = true; b.textContent = '판매중으로 바꾸는 중…';
        try { const lid = await lidOf(t); const al = await setAladinStatus(lid, 15, 1); GM_setValue('rn-cash-test', { id: t.id, lineNo: t.it.lineNo, listingId: lid, at: Date.now() }); await sendSignal('reopen', t, { msg: al || null });
          b.textContent = '판매중으로 바뀜 — 맨 위 빨간 줄에서 다시 판매중지'; window.scrollTo(0, 0); setTimeout(paintCashSold, 600); } catch (er) { b.disabled = false; b.textContent = '다시 시도'; alert('테스트 실패: ' + er.message); } }
      globalThis.__rnById('rn-cash-bar')?.remove(); globalThis.__rnById('rn-cash-chip')?.remove();
      const e = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const btn = (attr, i, label, bg, fg) => `<button ${attr}="${i}" style="margin-left:6px;border:1px solid ${bg};background:${fg ? bg : '#fff'};color:${fg ? '#fff' : bg};border-radius:6px;padding:2px 9px;cursor:pointer;font-weight:700">${label}</button>`;
      if (todo.length || done.length) {
        const bar = document.createElement('div'); bar.id = 'rn-cash-bar';
        bar.style.cssText = `position:relative;z-index:99990;margin:6px;padding:8px 12px;border:2px solid ${todo.length ? '#B0322A' : '#2e7d32'};border-radius:8px;background:${todo.length ? '#FDE2E0' : '#EEF7EE'};color:#1e2b28;font:13px/1.5 system-ui,sans-serif`;
        bar.innerHTML = `${todo.length ? `<b style="color:#8a1c14">💵 현금 판매한 상품 ${todo.length}개 — 알라딘에서 판매중지로 바꾸세요</b> <small>(웹앱에서 현금 판매로 기록됨)</small>
          ${todo.map((t, i) => `<div style="margin-top:4px">${t.test ? '<b style="color:#6B3FA0">🧪 테스트</b> ' : ''}<b>${e(t.it.sku || t.it.aladinUsedCode || '')}</b> ${e(t.it.title)} <small>· ${e(String(t.o.orderedAt || '').slice(0, 10))} ${e((t.o.buyer || {}).name || t.o.payerName || '')}</small>${btn('data-rnstop', i, '지금 판매중지로 바꾸기', '#B0322A', 1)}${t.test ? '' : btn('data-rncs', i, '이미 했음', '#B0322A')}</div>`).join('')}` : ''}
          ${done.length ? `<details style="margin-top:${todo.length ? 8 : 0}px"${todo.length ? '' : ' open'}><summary style="cursor:pointer"><b style="color:#1d5e22">💵 현금 판매 완료 ${done.length}개</b> <small>— 반품·교환으로 다시 판매할 때 여기서</small></summary>
          ${done.map((t, i) => `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #b7d6b7"><b>${e(t.it.sku || t.it.aladinUsedCode || '')}</b> ${e(t.it.title)} <small>· ${e(String(t.o.orderedAt || '').slice(0, 10))} ${e((t.o.buyer || {}).name || t.o.payerName || '')}</small>
            ${btn('data-rnre', i, '다시 판매중으로 — 반품·교환', '#1F5FAF')}${isTestItem(t.it) ? btn('data-rntest', i, '🧪 테스트: 판매중으로 → 다시 판매중지', '#6B3FA0', 1) : ''}
            <div data-reform="${i}" style="display:none;margin-top:4px">이유 <select data-rer="${i}"><option value="return">반품 (매출에서 뺌)</option><option value="exchange">교환 (매출 그대로, 돌아온 상품 다시 판매)</option><option value="other">기타 (매출 그대로)</option></select> <input data-rem="${i}" placeholder="메모 (예: 파손 반품, 다른 권으로 교환)" style="width:220px"> ${btn('data-reok', i, '알라딘 판매중으로 바꾸고 기록', '#1F5FAF', 1)}</div></div>`).join('')}</details>` : ''}`;
        // 평소(판매중지할 것이 없을 때)는 접어 둠: 오른쪽 아래 작은 '💵 n' 단추만 → 누르면 펼침, 띠의 '접기'로 다시 접음. 판매중지할 것이 생기면(빨강) 늘 펼침
        const quiet = !todo.length && !sessionStorage.getItem('rn-cash-open');
        if (quiet) { const chip = document.createElement('button'); chip.id = 'rn-cash-chip'; chip.textContent = `💵 현금 판매 ${done.length}`; chip.title = '현금 판매 완료 목록 펼치기 (다시 판매중으로·🧪 테스트)';
          chip.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99990;border:1px solid #2e7d32;background:#EEF7EE;color:#1d5e22;border-radius:14px;padding:3px 10px;font:700 12px system-ui;cursor:pointer;opacity:.85';
          chip.onclick = () => { sessionStorage.setItem('rn-cash-open', '1'); paintCashSold(); }; document.body.appendChild(chip); }
        else { if (!todo.length) { const x = document.createElement('button'); x.textContent = '접기'; x.style.cssText = 'float:left;margin-right:10px;font-weight:700;border:1px solid #2e7d32;background:#fff;color:#2e7d32;border-radius:6px;padding:1px 8px;cursor:pointer'; x.onclick = () => { sessionStorage.removeItem('rn-cash-open'); paintCashSold(); }; bar.prepend(x); }
          document.body.prepend(bar); }
        bar.querySelectorAll('[data-rnstop]').forEach((b) => (b.onclick = () => doStop(todo[+b.dataset.rnstop], b)));
        bar.querySelectorAll('[data-rncs]').forEach((b) => (b.onclick = async () => { const t = todo[+b.dataset.rncs]; const items = JSON.parse(JSON.stringify(t.o.items)); const it = items.find((x) => x.lineNo === t.it.lineNo); if (!it) return;
          it.aladinStop = { status: 'done', at: nowIso(), by: (auth.currentUser && auth.currentUser.email) || PC_NAME, from: 'collector' };
          b.disabled = true; try { await C('crm_orders').doc(t.id).set({ items, uploadedAt: TS(), history: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), by: PC_NAME, what: '알라딘 판매중지 완료(수집기): ' + it.title }) }, { merge: true }); b.textContent = '완료'; setTimeout(paintCashSold, 800); } catch (er) { b.disabled = false; alert('저장 실패: ' + (er.code || er.message)); } }));
        bar.querySelectorAll('[data-rnre]').forEach((b) => (b.onclick = () => { const f = bar.querySelector(`[data-reform="${b.dataset.rnre}"]`); f.style.display = f.style.display === 'none' ? '' : 'none'; }));
        bar.querySelectorAll('[data-reok]').forEach((b) => (b.onclick = () => { const i = b.dataset.reok; doReopen(done[+i], bar.querySelector(`[data-rer="${i}"]`).value, bar.querySelector(`[data-rem="${i}"]`).value.trim(), b); }));
        bar.querySelectorAll('[data-rntest]').forEach((b) => (b.onclick = () => doTest(done[+b.dataset.rntest], b)));
      }
      // 상품 조회/수정 목록: 현금 판매한 상품은 '현금 판매 완료' 표시(판매중지 전이면 빨강), 그 밖의 판매중지 상품은 웹앱에서 정한 이유를 표시 · 🧪 테스트 뒤 판매중지 목록에서 그 줄을 강조
      if (onEdit) { const parsed = P.parseScmList(document); const byId = new Map(parsed.rows.map((r) => [String(r.listingId), r])); const hl = GM_getValue('rn-cash-hl', null); let hlFound = false;
        const badge = (tr, txt, bg, cls) => { if (tr.querySelector('.' + cls)) return; const x = document.createElement('div'); x.className = cls; x.textContent = txt; x.style.cssText = `display:inline-block;margin-top:2px;padding:1px 6px;border-radius:8px;font-size:11px;font-weight:700;color:#fff;background:${bg}`; tr.lastElementChild.appendChild(x); };
        document.querySelectorAll('input.batchChkBox').forEach((cb) => { const r = byId.get(String(cb.value)); if (!r) return; const tr = cb.closest('tr'); if (!tr) return;
          if (hl && String(cb.value) === hl.listingId) { hlFound = true; tr.style.outline = '3px solid #6B3FA0'; tr.scrollIntoView({ block: 'center' }); badge(tr, '🧪 테스트 확인: 판매중지 목록에 있음 ✓', '#6B3FA0', 'rn-hl'); }
          const k = sold.has(String(r.usedCode)) ? String(r.usedCode) : sold.has('L' + r.listingId) ? 'L' + r.listingId : null;
          if (k != null) { const t = soldT.get(k); if (t) t.rowLid = String(cb.value);
            if (!sold.get(k)) { tr.style.background = '#FDE2E0'; tr.style.outline = tr.style.outline || '2px solid #B0322A'; badge(tr, (t && t.test ? '🧪 테스트 · ' : '') + '💵 현금 판매됨 — 판매중지 하세요', '#B0322A', 'rn-cash'); }
            else { tr.style.background = '#E8F5E9'; badge(tr, '💵 현금 판매 완료', '#2e7d32', 'rn-cash'); }
            // 그 줄에서 바로: 판매중지 전 → '지금 판매중지로' · 판매 완료 → '다시 판매중으로 — 반품·교환'(이유) · 이터널 선샤인 → 🧪 테스트
            if (t && !tr.querySelector('.rn-reb')) { const w = document.createElement('div'); w.className = 'rn-reb'; w.style.cssText = 'margin-top:3px;font:12px system-ui';
              w.innerHTML = !sold.get(k) ? btn('data-x', 'stop', '지금 판매중지로 바꾸기', '#B0322A', 1)
                : `${btn('data-x', 're', '다시 판매중으로 — 반품·교환', '#1F5FAF')}${isTestItem(t.it) ? btn('data-x', 'test', '🧪 테스트', '#6B3FA0', 1) : ''}<div data-x="form" style="display:none;margin-top:3px">이유 <select data-x="why"><option value="return">반품 (매출에서 뺌)</option><option value="exchange">교환 (매출 그대로)</option><option value="other">기타 (매출 그대로)</option></select> <input data-x="memo" placeholder="메모" style="width:140px"> ${btn('data-x', 'ok', '알라딘 판매중으로 바꾸고 기록', '#1F5FAF', 1)}</div>`;
              tr.lastElementChild.appendChild(w); const q = (x) => w.querySelector(`[data-x="${x}"]`);
              if (q('stop')) q('stop').onclick = (ev) => { ev.preventDefault(); doStop(t, q('stop')); };
              if (q('re')) q('re').onclick = (ev) => { ev.preventDefault(); const f = q('form'); f.style.display = f.style.display === 'none' ? '' : 'none'; };
              if (q('ok')) q('ok').onclick = (ev) => { ev.preventDefault(); doReopen(t, q('why').value, q('memo').value.trim(), q('ok')); };
              if (q('test')) q('test').onclick = (ev) => { ev.preventDefault(); doTest(t, q('test')); }; }
            return; }
          const rs = reasons.get(String(r.usedCode)); if (rs && STOP_TXT[rs.reason]) { const [t2, c2] = STOP_TXT[rs.reason]; badge(tr, t2, c2, 'rn-stopr'); } });
        if (hl) { GM_deleteValue('rn-cash-hl'); if (!hlFound) { const n = document.createElement('div'); n.style.cssText = 'margin:6px;padding:6px 10px;border:2px solid #6B3FA0;border-radius:8px;background:#F6F1FC;font:13px system-ui'; n.textContent = '🧪 테스트: 판매중지로 바꿨지만 이 쪽에서는 그 상품 줄을 못 찾았습니다 (다른 쪽이거나 검색 조건이 다름) — 판매중지 목록에서 직접 확인해 주세요'; document.body.prepend(n); } }
      }
    } catch (e) { console.warn('[리드나우] 현금 판매 표시 실패', e); }
  }
  setTimeout(() => { if (window.__rnFeat && !window.__rnFeat('cash')) return; /* (1.63.7) 🧩 */ paintCashSold(); }, 1200);
  /* (1.89.21) 🛒 정범님 10/21: 알라딘 판매자 숍 화면(wshopitem.aspx?SC=)에 '우리가 이 판매자에게 산 주문' — 웹앱 판매자 상세와 같은 자료(pur_aladin_orders.seller · 이름이 같은 판매자) · 로거(공개 전용)는 하지 않음 */
  async function paintSellerBuys() { try { if (PUBONLY || window.top !== window || !/\/shop\/usedshop\/wshopitem\.aspx/i.test(location.pathname)) return; const sc = (location.search.match(/[?&]SC=(\d+)/i) || [])[1]; if (!sc || sc === '996008') return; await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); }); if (!auth.currentUser) return;
      const sd = (await C('sellers').doc('sc_' + sc).get()).data() || null; const nm = String((sd && sd.name) || '').trim(); if (!nm) return; const qs = await C('pur_aladin_orders').where('seller.name', '==', nm).get(); if (qs.empty) return;
      const L = qs.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))); const sum = L.reduce((x, o) => x + (+o.amount || 0), 0); const nb = L.reduce((x, o) => x + (+o.qty || (o.lines || []).length || 0), 0); let same = 0; try { same = (await C('sellers').where('name', '==', nm).limit(3).get()).size; } catch (e) {}
      const esc2 = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
      const box = document.createElement('div'); box.id = 'rn-selbuys'; box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483645;max-width:min(460px,92vw);max-height:46vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);font:12.5px/1.45 system-ui,Malgun Gothic,sans-serif;color:#1E2B27';
      box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#2F5D50;color:#fff;cursor:pointer" data-x="1"><b>🛒 우리가 이 판매자에게 산 주문</b><span style="flex:1"></span><span>${L.length}건 · ${nb}권 · ${sum.toLocaleString()}원</span><span>▾</span></div><div data-b="1" style="padding:6px 10px;display:none">${same > 1 ? '<div style="color:#B0322A;margin-bottom:4px">⚠ 같은 이름의 판매자가 여럿 — 이름으로만 이어 붙여 다른 판매자 주문이 섞였을 수 있음</div>' : ''}${L.slice(0, 40).map((o) => `<div style="padding:3px 0;border-bottom:1px solid #EEF2F0"><b>${esc2(o.date || '')}</b> <a href="/account/wordersinfo.aspx?pType=OrdersInfo&ONO=${encodeURIComponent(o.id)}" target="_blank">${esc2(o.id)}</a> · ${(+o.amount || 0).toLocaleString()}원<br><small>${(o.lines || []).slice(0, 4).map((x) => esc2((x.grade ? '[' + x.grade + '] ' : '') + String(x.title || '').slice(0, 36) + (x.price != null ? ' ' + (+x.price).toLocaleString() + '원' : ''))).join(' · ') || esc2(o.summary || '')}</small></div>`).join('')}${L.length > 40 ? `<div style="color:#5B6B66">최근 40건만 · 전체 ${L.length}건(웹앱 판매자 상세)</div>` : ''}</div>`;
      box.querySelector('[data-x]').onclick = () => { const b = box.querySelector('[data-b]'); b.style.display = b.style.display === 'none' ? '' : 'none'; }; document.body.appendChild(box); } catch (e) {} }
  setTimeout(() => { if (window.__rnFeat && !window.__rnFeat('prd')) return; paintSellerBuys(); }, 1800);
  // 크롬은 뒤에 숨은 탭의 타이머를 크게 늦춘다 → 워커 타이머로 대기(고객 수집기와 같은 방식). 막히면 일반 타이머
  let worker = null; let wseq = 0; const waiters = new Map();
  try {
    const src = 'onmessage=(e)=>{setTimeout(()=>postMessage(e.data.id),e.data.ms)}';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const f = waiters.get(e.data); if (f) { waiters.delete(e.data); f(); } };
  } catch (e) { worker = null; }
  if (worker) {
    const ok = await new Promise((r) => { const id = ++wseq; waiters.set(id, () => r(true)); worker.onerror = () => r(false); worker.postMessage({ id, ms: 1 }); setTimeout(() => r(false), 1000); });
    if (!ok) { try { worker.terminate(); } catch (e) {} worker = null; waiters.clear(); }
  }
  const sleep = (ms) => new Promise((r) => { if (worker) { const id = ++wseq; waiters.set(id, r); worker.postMessage({ id, ms }); } else setTimeout(r, ms); });
  const nowIso = () => new Date().toISOString();

  const DEFAULTS = { keyScheme: 'aladinItemId', reloadEveryFrames: 400, reqMinMs: 700, reqStartMs: 1200, reqMaxMs: 20000, delayMs: 700, fallbackNaver: false, fallbackGoogle: false, pubAnon: true, previewImages: false, pageTimeoutSec: 25, dynamicParts: false, recheckDays: 7, topN: 50, rev6mDays: 7, nbDays: 7, photoMatch: 0.9, maxLanes: 1, ipGroups: { HOME: 'home' }, scanFullDays: 7, revAllDays: 7, crmAnyPc: false, autoDaily: true, autoHour: 17, autoPc: 'JS-MAIN', autoGraceMin: 30, reqPc: 'JS-MAIN', dynDaily: 0, dynDays: 30, dynScope: 'all', maxLoginTries: 6, prio: {}, usedInfoDays: 30, shipAutoMin: 15, steps: { usedInfo: true, nbMarket: true, soldInfo: true, poolInfo: true, images: true, photos: true, scanFull: true, revAll: true, crm: true, scanNew: true, aladinBuy: true, buyback: true, market: true, rev6m: true, revTop: true, dynamic: true }, autoLogin: true, loginRetrySec: 60 };
  let SET = { ...DEFAULTS };
  /* 중요도: 숫자가 클수록 먼저. 알라딘 작업 잠금을 낮은 작업이 쥐고 있으면 높은 작업이 양보를 요청 → 낮은 작업은 진행 위치를 저장하고 멈췄다가, 높은 작업이 끝나면 자동으로 이어감.
   * 기본값 근거: 돈·고객에 바로 닿는 것(주문·고객 > 새 등록 > 알라딘 팔기·구매 정산) → 가격 판단 재료(시장 지표) → 경쟁 분석(판매자) → 장기 분석(구매자 분포) 순 */
  const PRIO_DEFAULT = { crm: 100, scanNew: 90, buyback: 80, aladinBuy: 75, scanFull: 70, market: 60, rev6m: 50, revTop: 45, rev6mAll: 40, dynamic: 30, revAll: 20 };
  const PRIO_KEY = { bench: 'market', usedInfo: 'market', soldInfo: 'market', poolInfo: 'market', photos: 'market', nbMarket: 'market', scanNew: 'scanNew', scanFull: 'scanFull', aladinBuy: 'aladinBuy', buyback: 'buyback', market: 'market', rev6mStale: 'rev6m', rev6m: 'rev6m', rev6mAll: 'rev6mAll', revTop: 'revTop', revAll: 'revAll', dynamic: 'dynamic', dynamic0: 'dynamic', dynAll: 'dynamic', crm: 'crm' };
  let curStage = null; let myLockPrio = 0;
  const prioOf = (k) => { if (k === 'explore') return 1; /* 탐색 수집은 가장 낮음 (무엇이든 양보) */ const pk = PRIO_KEY[k] || k; return +((SET.prio || {})[pk] ?? PRIO_DEFAULT[pk] ?? 50); };
  const curPrio = () => prioOf(curStage || curKey || '');

  /* ───────── 화면 (고객 수집기와 같은 배치·색) ─────────
   * 위에서부터: 처음 설정 → 큰 버튼(일괄) → 일시정지/이어하기 → 개별 버튼 → 진행 상태 → Firebase·다른 PC 상태 → 기록 → 아래줄(가져오기·설정·안내) */
  const K = { paper: '#FFFFFF', ink: '#1E2B28', sub: '#5B6B66', line: '#D6DDDA', cloth: '#2F5D50', clothSoft: '#E6EFEB', amber: '#A8661B', red: '#B0322A' };
  const css = `
  #rnp{position:fixed;top:12px;right:12px;z-index:2147483646;width:310px;max-height:calc(100vh - 24px);overflow:auto;background:${K.paper};color:${K.ink};border:1px solid ${K.line};border-top:4px solid ${K.cloth};border-radius:8px;box-shadow:0 8px 28px rgba(30,43,40,.16);font:13px/1.45 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}
  #rnp *{box-sizing:border-box;font-family:inherit}
  #rnp .hd{display:flex;align-items:baseline;justify-content:space-between;padding:10px 12px 6px;cursor:pointer;user-select:none}
  #rnp .hd b{font-size:14px} #rnp .hd span{color:${K.sub};font-size:11px}
  #rnp .bd{padding:0 12px 10px} #rnp.min .bd{display:none}
  #rnp .sec{margin-top:10px} #rnp .cap{font-size:11px;color:${K.sub};margin:0 0 4px}
  #rnp .rnp-sched{border:1.5px solid #2F5D50;border-radius:9px;padding:7px 8px;background:#F4F8F6} #rnp .sh2{display:flex;align-items:center;gap:7px;font-size:13px} #rnp .hint2{font-size:10.5px;color:#5B6B66}
  #rnp .role{margin:5px 0;padding:7px 9px;border-radius:9px;font-size:12.5px;line-height:1.45} #rnp .role.lg{background:#1F4F96;color:#fff;border:2px solid #3F7FD1;box-shadow:0 2px 8px rgba(31,79,150,.25)} #rnp .role.lg small{opacity:.9} #rnp .role.of{background:#EEF4F1;color:#1E2B28;border:1px solid #CFDAD5} #rnp .role .ok{color:#9BF0B8;font-weight:700} #rnp .role .no{color:#FFC9C2;font-weight:700} #rnp .rg{display:flex;flex-direction:column;gap:4px;padding:6px;border-radius:9px;border:1px solid #DCE5E1} #rnp .rg.pub{background:#EEF4FF;border-color:#B9CDEB} #rnp .rg.login{background:#FBF8F1;border-color:#E6D9B8} #rnp .rg.ext{background:#F5F1FB;border-color:#D6CBEA} #rnp .rg.dim{opacity:.55} #rnp .rgh{font-weight:700;font-size:12px;color:#1E2B28} #rnp .rgh small{font-weight:400;color:#6B7A75} #rnp .rgs{font-size:11px;color:#5B6B66;margin-top:-2px}
  #rnp .sl{margin-top:5px;display:flex;flex-direction:column;gap:4px} #rnp .sl.dim{opacity:.55} #rnp .sr{display:flex;gap:7px;align-items:flex-start;background:#fff;border:1px solid #DCE5E1;border-radius:7px;padding:5px 6px} #rnp .sr.on{border-color:#9CCBAE}
  #rnp .sb{flex:1;min-width:0} #rnp .sb b{font-size:12px;display:block} #rnp .sb small{font-size:10.5px;color:#5B6B66;display:block} #rnp .tl{margin-top:2px;font-size:11px;display:flex;flex-wrap:wrap;gap:3px;align-items:center} #rnp .tl a{color:#2F5D50;margin-left:2px}
  #rnp .ts{border:1px solid #DCE5E1;border-radius:9px;padding:0 6px;background:#fff;white-space:nowrap} #rnp .ts.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rnp .ts.running{background:#FFF4E5;border-color:#E8C88F} #rnp .ts.error,#rnp .ts.stop,#rnp .ts.timeout,#rnp .ts.lost{background:#FDECEA;border-color:#E3A29B;color:#B0322A} #rnp .ts.missed,#rnp .ts.skipped,#rnp .ts.merged{color:#8A9690} #rnp .ts.late{border-color:#E8C88F;color:#A8661B} #rnp .tw{margin-left:4px;font-size:10px;color:#8A9690;font-weight:400}
  #rnp .sw2{position:relative;display:inline-block;width:30px;height:17px;flex:0 0 auto;margin-top:1px} #rnp .sw2.big{width:38px;height:21px} #rnp .sw2 input{opacity:0;width:0;height:0} #rnp .sw2 span{position:absolute;inset:0;background:#C9D2CE;border-radius:20px;transition:.15s;cursor:pointer}
  #rnp .sw2 span:before{content:'';position:absolute;width:13px;height:13px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.15s} #rnp .sw2.big span:before{width:17px;height:17px} #rnp .sw2 input:checked+span{background:#2F5D50} #rnp .sw2 input:checked+span:before{transform:translateX(13px)} #rnp .sw2.big input:checked+span:before{transform:translateX(17px)}
  #rnp .rn-bench{border:1px dashed #8E6BBF;border-radius:8px;padding:6px;background:#F6F1FC} #rnp .rn-bench .cap{color:#6B3FA0;font-weight:bold} #rnp .rn-bench .b2{background:#EFE6FA;border-color:#D5C2EE;color:#5A3D7A}
  #rnp button{font-size:12px;cursor:pointer;border-radius:5px}
  #rnp button:disabled{opacity:.4;cursor:not-allowed}
  #rnp .b1{width:100%;padding:10px;border:0;background:${K.cloth};color:#fff;font-size:14px;font-weight:bold}
  #rnp .b1:hover:not(:disabled){background:#264D42}
  #rnp .b1 small{display:block;font-size:11px;font-weight:normal;opacity:.85}
  #rnp .rnch-w{display:flex!important;flex-wrap:wrap;justify-content:center;align-items:center;gap:3px 2px;margin-top:5px;opacity:1!important;line-height:1.2}#rnp .rnch{display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);border-radius:10px;padding:1px 7px;font-size:10.5px;white-space:nowrap}#rnp .rnch-a{opacity:.55;font-size:10px;margin:0 1px}#rnp .rnch-n{font-size:10.5px;opacity:.8;margin-left:4px;white-space:nowrap}#rnp .rnch-0{font-size:11px;background:#FFF3E0;color:#8A4A10;border-radius:8px;padding:2px 8px}#rnp .b1.rnch-off{filter:saturate(.4);opacity:.75}
  #rnp .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-top:5px}
  #rnp .b2{padding:7px 2px;border:1px solid #C9DDD5;background:${K.clothSoft};color:${K.cloth};font-weight:bold}
  #rnp .b2:hover:not(:disabled){border-color:${K.cloth}}
  #rnp .b2.multi{background:#fff;border-style:dashed}
  #rnp .b2[data-job="benchForce"]{border:2px solid #D9822B;background:#FFF4E6;color:#8A4A10}
  #rnp .rn-bfs{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:-2px 0 4px;padding:6px 8px;border:2px dashed #D9822B;border-radius:8px;background:#FFF9F0;color:#8A4A10;font-weight:700;font-size:12px}
  #rnp .rn-bfs.on{border-style:solid;background:#FFE7C2}
  #rnp .rn-bfs input[type=number]{width:52px;padding:2px 4px;font-weight:700}
  #rnp .rn-bfs input[type=checkbox]{width:16px;height:16px;vertical-align:-3px}
  #rnp .why{margin-top:4px;font-size:11px;color:${K.amber}}
  #rnp .ctl{display:none;margin-top:6px} #rnp .ctl.on{display:block}
  #rnp .ctl button{width:100%;padding:7px;border:1px solid ${K.amber};background:#FFF8EE;color:${K.amber};font-weight:bold}
  #rnp .st{margin-top:10px;padding:8px 9px;background:#F6F8F7;border:1px solid ${K.line};border-radius:6px}
  #rnp .stt{font-weight:bold;font-size:12.5px}
  #rnp .bar{height:5px;background:#E3E9E6;border-radius:3px;overflow:hidden;margin:6px 0 3px}
  #rnp .bar i{display:block;height:100%;width:0;background:${K.cloth};transition:width .3s}
  #rnp .stn{font-size:11.5px;color:${K.sub}} #rnp .eta{font-size:12px;font-weight:bold;color:${K.cloth}} #rnp .now{margin-top:3px;font-size:11.5px;word-break:break-all}
  #rnp .next{margin-top:6px;padding:5px 7px;border-radius:4px;background:#FFF4E5;color:${K.amber};font-size:11.5px}
  #rnp .next:empty{display:none}
  #rnp .img{margin-top:4px;font-size:11.5px;color:${K.sub}} #rnp .img:empty{display:none}
  #rnp .fb{margin-top:10px;padding:8px 9px;border:1px solid ${K.line};border-radius:6px}
  #rnp .fbs{font-size:12px} #rnp .pcs{margin-top:5px} #rnp .pc{padding:5px 7px;border-radius:4px;background:#F6F8F7;font-size:11.5px;margin-top:4px;line-height:1.5}
  #rnp .pc.busy{background:#FDECEA;color:${K.red}} #rnp .pc.me{background:${K.clothSoft};color:${K.cloth}} #rnp .pc b{font-weight:bold}
  #rnp .setup{margin-top:4px;border-radius:6px}
  #rnp .setup.todo{padding:8px 9px;border:2px solid ${K.amber};background:#FFF8EE}
  #rnp .setup.todo h5{margin:0 0 4px;font-size:12.5px;color:${K.amber}}
  #rnp .setup ul{margin:0;padding:0;list-style:none}
  #rnp .setup li{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12px;border-top:1px dashed #EBD9BE} #rnp .setup li:first-child{border-top:0}
  #rnp .setup li.ok{color:${K.cloth}} #rnp .setup li.no{font-weight:bold}
  #rnp .setup li button{padding:2px 8px;border:1px solid ${K.amber};background:#fff;color:${K.amber};font-size:11px}
  #rnp .setup.done{padding:4px 2px;font-size:11px;color:${K.cloth}}
  #rnp .log{margin-top:8px;max-height:220px;overflow:auto;font-size:11.5px;color:${K.ink};background:#F7F9F8;border:1px solid ${K.line};border-radius:6px;padding:4px 6px}
  #rnp .log p{margin:0 0 2px} #rnp .log .warn{color:${K.amber}} #rnp .log .ok{color:${K.cloth}}
  #rnp .foot{display:flex;justify-content:space-between;margin-top:10px;padding-top:7px;border-top:1px solid ${K.line}} #rnp .foot span{display:flex;gap:10px}
  #rnp .b3{padding:2px 0;border:0;background:none;color:${K.sub};font-size:11.5px;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#C3CCC8}
  #rnp .b3:hover:not(:disabled){color:${K.ink}}
  #rnp .pane{display:none;margin-top:8px;font-size:12px;border-top:1px solid ${K.line};padding-top:6px}
  #rnp.showset .set,#rnp.showimp .imp,#rnp.showguide .guide{display:block}
  #rnp .set label{display:block;margin-top:5px;color:${K.sub}}
  #rnp .set input[type=text],#rnp .set input[type=password],#rnp .set input[type=number],#rnp .set select{width:100%;padding:4px;border:1px solid ${K.line};border-radius:3px;font-size:12px;color:${K.ink}}
  #rnp .set .chk{display:flex;gap:6px;align-items:center;color:${K.ink}}
  #rnp .cst{margin-top:6px;padding:6px 8px;border-radius:5px;font-size:12px;line-height:1.5}
  #rnp .cst.ok{background:${K.clothSoft};color:${K.cloth}} #rnp .cst.no{background:#FFF4E5;color:${K.amber}} #rnp .cst.bad{background:#FDECEA;color:${K.red}}
  #rnp .cst b{font-size:12.5px} #rnp .cst small{display:block;color:${K.sub}}
  #rnp .set .row{display:flex;gap:4px;margin-top:6px} #rnp .set .row button{flex:1;padding:6px;border:1px solid ${K.line};background:#fff}
  #rnp .drop{margin-top:2px;padding:16px 10px;border:2px dashed #B9CFC6;border-radius:8px;background:#F6FAF8;text-align:center;cursor:pointer}
  #rnp .drop b{display:block;color:${K.cloth};font-size:13px} #rnp .drop span{display:block;margin-top:3px;font-size:11px;color:${K.sub}}
  #rnp .drop.over{background:${K.clothSoft};border-color:${K.cloth}}
  #rnp .guide h4{margin:8px 0 2px;font-size:12.5px} #rnp .guide p{margin:0 0 5px;font-size:11.5px}`;
  const st = document.createElement('style'); st.textContent = css; globalThis.__rnHead(st);
  const box = document.createElement('div'); box.id = 'rnp';
  box.innerHTML = `
  <div class="hd"><b>리드나우 상품 수집</b><span>v${VER} (눌러서 접기)</span></div>
  <div class="bd">
    <div class="setup"></div>
    <div class="sec rnp-sched" id="rnpSched"><div class="hint2">⏰ 매일 자동 수집 — 설정을 불러오는 중 (구글 로그인 필요)</div></div>
    <div class="sec">
      <button class="b1" data-job="prdChain">상품 일괄 수집<small class="rnch-w" id="rnpChainTxt">고른 단계를 불러오는 중…</small></button><div id="rnpSteps" style="display:flex;flex-wrap:wrap;gap:2px 8px;font-size:11.5px;margin:4px 0 0"></div><button style="display:none"></button>
      <div class="ctl" id="rnpCtlStop"><button id="rnpStop">일시정지 (진행 위치 저장)</button></div>
      <div class="ctl" id="rnpCtlResume"><button id="rnpResume">이어하기</button><button id="rnpReset" style="margin-top:3px;background:#fff;color:#B0322A;border:1px solid #B0322A" title="멈춘 자리를 버리고 다음에 처음부터">이어하기 없애기 (처음부터)</button></div>
      <div id="rnpTemp" style="margin-top:6px"></div><button class="b3" id="rnpCheck" style="margin-top:4px">시작 전 점검 (대량 수집 전에 한 번)</button>
    </div>
    <div class="sec">
      <p class="cap">개별 수집</p>
      <div class="g2">
        <button class="b2" data-job="scanNew">신규 등록분</button><button class="b2" data-job="scanFull">전체 재검토</button>
        <button class="b2" data-job="market">도서·시장 지표</button><button class="b2 multi" data-job="images" title="여러 PC가 동시에 해도 겹치지 않습니다">이미지 (여러 PC 가능)</button>
      </div>
      <div class="why" id="rnpWhy"></div>
    </div>
    <div class="sec">
      <p class="cap">판매자 평가 (알라딘 줄 · 한 번에 한 PC)</p>
      <div class="g2"><button class="b2" data-job="rev6mAll" title="모든 판매자 숍 첫 화면에서 최근 6개월 평가 수만 빠르게">6개월 평가 수 (전체)</button><button class="b2" data-job="rev6mStale" title="설정한 주기보다 오래된 판매자만">6개월 평가 수 (오래된 것만)</button></div>
      <div class="g2" style="margin-top:4px"><button class="b2" data-job="revTop" title="최근 6개월 평가·모범·불량·이득·불익 각 상위 판매자(설정의 수)의 새 평가만">상위 판매자 평가 갱신</button><button class="b2" data-job="revAll" title="모든 판매자의 처음 평가까지. 매우 오래 걸립니다">평가 전체 수집</button></div>
      <button class="b3" id="rnpRevTest" style="margin-top:3px">평가 읽기 시험 (우리 가게 1쪽, 저장 안 함)</button>
    </div>

    <div class="sec">
      <p class="cap">매입 대조 (알라딘 줄)</p>
      <div class="g2"><button class="b2" data-job="buyback" title="알라딘에 팔기: 정산 내역 목록과 접수마다 상세(매입·매입불가·정산액)">알라딘 팔기 정산 내역</button><button class="b2" data-job="aladinBuy" title="알라딘에서 산 모든 주문과 주문마다 책(등급·가격·수량·주문일)을 모음. 이미 받은 주문은 건너뜀">알라딘 구매 내역 (전체)</button><button class="b2" data-job="poolInfo" title="알라딘에서 산 책 중 아직 상품과 연결 안 된 책의 도서 정보·시세·사진">알라딘 풀 도서 정보</button></div>
    </div>
    <div class="sec">
      <p class="cap">우리 상품 보강 (알라딘 줄)</p>
      <div class="g2"><button class="b2" data-job="nbMarket" title="알라딘 미등록·세트·새상품 페이지 없는 상품: 바깥 검색(중고) 화면의 따로 등록된 같은 책들로 경쟁·시세">검색 시세 (미등록·세트)</button><button class="b2" data-job="bench" title="웹앱 경영 탭 → 🎯 집중 벤치마킹에서 고른 판매자의 중고샵 목록 전체를 끝까지 읽어, 어제와 견줘 새로 올린 것·사라진 것(팔렸거나 내림)·값 바뀐 것을 기록 (하루 한 번 · 일괄 수집에도 들어 있음)">🎯 집중 벤치마킹</button><button class="b2" data-job="benchForce" title="주기(n시간·n일에 한 번)와 '끝난 지 20시간 안이면 건너뜀' 규칙을 무시하고, 웹앱에서 고른 판매자 목록의 맨 처음 판매자부터 차례로 모두 지금 읽음 · 멈췄다 이어 하면 이번에 이미 읽은 판매자는 건너뜀(3일 안)">🎯 강제: 처음 판매자부터</button><button class="b2" data-job="benchDetail" title="집중 벤치마킹으로 모은 상품(따라가는 판매자의 지금 숍 상품) 중 아직 상품 페이지 정보(ISBN·분류·출간 연월)가 없는 것만 상품 페이지를 열어 읽음 — 웹앱 ⚙ 모을 정보의 '상품 페이지 정보' 켜짐·꺼짐과 상관없이 · 판매자마다 끝까지 · 한 번 읽은 상품·다른 판매자와 같은 책·우리 도서 기록에 있는 책은 열지 않음 · 멈추면 100개마다 저장한 데까지 남음">📖 벤치마킹 상품 페이지 정보</button><span class="rn-bfs" title="켜면 '🎯 강제: 처음 판매자부터'가 이 시간 안에 끝까지 읽은 판매자는 건너뛰고 나머지를 모두 읽음 (웹앱 🎯 자세히의 같은 토글과 하나 — Firebase에 저장)"><label><input type="checkbox" id="rnBfOn"> ⏭ 강제 실행 때 최근</label> <input type="number" id="rnBfH" min="1" max="168" value="20"> <label for="rnBfOn" title="숍 끝까지 다 읽은 회차가 그 시간 안에 끝난 판매자만 건너뜀 — 50% 넘어 쓴 회차라도 뒤쪽을 못 읽었으면 다시 읽음 · 멈춘 판매자는 📍 멈춘 자리부터 이어 읽음">시간 안에 숍 끝까지 다 읽은 판매자 건너뛰기</label></span><span id="rnBrTxt" style="display:block;font-size:10.5px;color:#5B6B66;margin:2px 0" title="웹앱 🎯 판에서 바꿈 (모든 PC 같음)"></span><label style="display:block;font-size:11px;margin:3px 0" title="이 PC가 놀고 있을 때: 다른 PC가 도는 🎯 한 바퀴에 같이 들어가 판매자를 나눠 읽고, ⏰ 매일 자동의 공개 읽기 일(벤치마킹·시장 지표·탐색 등)을 담당 PC 대신 맡음 — 로그인이 필요한 일(주문·출고·상품 조회·고객)은 담당 PC만 (이 PC에만 적용)"><input type="checkbox" id="rnPubHelp"> 🌐 남는 PC 돕기 (공개 읽기 나눠 하기 · 이 PC)</label><button class="b2" data-job="photos" title="새상품 표지가 없는 상품: 우리 상품 페이지의 사진을 전부">우리 상품 사진</button><button class="b2" data-job="usedInfo" title="우리 책 온라인 중고 첫 페이지에서 우리보다 앞에 있는 매물과 바로 뒤 몇 개(설정): 중고상품 구매 유의 사항 글과 사진 — 가격 결정 화면 블록의 ? 표시">경쟁 매물 유의사항·사진</button></div>
    </div>
    <details class="sec" style="margin-top:10px"><summary class="cap" style="cursor:pointer">예비 · 가끔 쓰는 것 (펼치기)</summary>
      <p class="cap" style="margin-top:6px">출고 — 클라우드가 1분마다 하므로 클라우드가 멈췄을 때만</p>
      <div class="g2"><button class="b2" data-job="shipRead" title="판매관리 주문확인요청·발송 요청 탭의 주문을 읽어 웹앱 \'오늘 출고\'로 보냄 (클라우드가 10분 넘게 멈춰 있으면 영업일 9~16시에 15분마다 저절로)">주문확인요청·발송 요청 읽기</button></div>
    <div class="rn-bench" style="margin-top:8px">
      <p class="cap">🔭 벤치마킹 · 시장 조사 <span style="font-weight:normal">— 우리 운영과 따로 (남의 책·시장 전체)</span></p>
      <div class="g2"><button class="b2" data-job="explore" title="우리 책들의 함께 산 책에서 시작해 새 책마다 도서 정보·사진·시장 지표·구매자 분포를 모으고 그 책의 함께 산 책으로 끝없이 넓혀 감 (일괄 수집에는 안 들어감, 다른 작업이 시작되면 잠시 멈췄다 이어감)">끝없는 탐색 수집 ∞</button><button class="b2" data-job="dynAll" title="새상품 페이지의 구매자 연령대·함께 산 책·클릭한 상품 — 안 모은 책 전부">구매자 분포 전체 수집</button></div><div class="g2"><button class="b2" data-job="handoff" title="(1.72.3) 로거가 알라딘에 로그인하지 않아 못 읽은 19금 책의 시장 지표를 이 PC(로그인)가 받아 읽음 — 대기열 prd_handoff · 보통은 사무실 담당 PC가 저절로 다른 칸보다 먼저 함(⏰ 늘 도는 일에서 끌 수 있음)">🔁 로거가 못 한 일 넘겨받기 (19금)</button></div>
    </div>
    </details>
    <div class="st"><div class="stt" id="rnpState">대기 중</div><div class="bar"><i id="rnpBar"></i></div>
      <div class="stn" id="rnpCount"></div><div class="eta" id="rnpEta"></div><div class="now" id="rnpSub"></div>
      <div class="img" id="rnpImg"></div><div class="next" id="rnpNext"></div></div>
    <div class="fb"><div class="fbs" id="rnpWho">Firebase: 확인 중</div><div class="pcs" id="rnpPcs"></div></div>
    <div class="rnp-oldlog" style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px"><b>최근 기록</b><a href="#" id="rnpLogBig" style="color:#2F5D50">항목마다 자세히 · 크게 보기 ›</a></div><div class="log" id="rnpLog" style="margin-top:2px"></div>
    <div class="foot">
      <span><button class="b3" data-pane="imp">등록 파일 가져오기</button></span>
      <span><button class="b3" data-pane="set">설정</button><button class="b3" data-pane="guide">사용 안내</button></span>
    </div>
    <div class="pane imp">
      <div class="drop" id="rnpDrop"><b>알라딘 등록 상품 파일(.xls)</b><span>여기에 끌어다 놓거나 눌러서 고르기<br>판매완료 엑셀은 고객 수집기에 넣어 주세요</span></div>
      <input type="file" id="rnpFile" accept=".xls,.xlsx,.html" style="display:none">
    </div>
    <div class="pane set">
      <label>알라딘 요청 간격 — 자동 조절(1초로 시작 → 잘 되면 이 최소값까지 빨라지고, 실패·로그인 풀림이면 바로 느려짐). 최소(ms)<input type="number" id="rnpDelay" min="300" step="50"></label>
      <label>요청 간격 최대(ms) — 막힐 때 늦출 수 있는 한계<input type="number" id="rnpDelayMax" min="2000" step="1000"></label>
      <label>경쟁 매물 유의사항·사진: 다시 확인하는 주기(일) — 0이면 매번 전부<input type="number" id="rnpUsedDays" min="0" step="1"></label>
      <label>경쟁 매물: 우리 매물 바로 뒤 몇 개까지 볼지 (우리보다 앞 매물은 모두)<input type="number" id="rnpUsedAfter" min="0" step="1"></label>
      <label>경쟁 매물: 일괄 수집 안에서 쓸 최대 시간(분) — 넘으면 다음 단계로, 나머지는 다음 일괄 때 · 0이면 끝까지<input type="number" id="rnpUsedChain" min="0" step="10"></label>
      <label>도서·시장 지표를 다시 확인하는 주기(일) — 0이면 매번 전체<input type="number" id="rnpRecheck" min="0" step="1"></label>
      <label class="chk" title="상품·중고 목록·숍 목록·판매자 평가·검색 화면은 알라딘 로그인 쿠키 없이 읽음(모든 PC 같은 설정) — 판매자 계정과 대량 읽기를 떼어 놓음. 19금 등 로그인이 있어야 보이는 장은 건너뜀"><input type="checkbox" id="rnpPubAnon"> 🔓 공개 화면은 로그인 없이만 읽기 (계정과 떼어 놓기 · 기본 켬)</label>
      <label class="chk"><input type="checkbox" id="rnpNaver"> 알라딘에 없을 때 네이버에서 보충(시험)</label>
      <label class="chk"><input type="checkbox" id="rnpGoogle"> 알라딘에 없을 때 구글에서 보충(시험)</label>
      <label>도서 기준 키 (바꾸면 이후 "같은 책" 판단 기준이 바뀜)<select id="rnpKey">${P.KEY_SCHEMES.map((k) => `<option>${k}</option>`).join('')}</select></label>
      <label>이 PC 이름 (고객 수집기와 같은 이름 권장)<input type="text" id="rnpName" autocomplete="off"></label>
      <div class="cst" id="rnpCredSt"></div>
      <label>알라딘 아이디<input type="text" id="rnpId" autocomplete="off"></label>
      <label>알라딘 비밀번호<input type="password" id="rnpPw" autocomplete="new-password"></label>
      <div class="row"><button id="rnpCredSave">아이디·비밀번호 저장</button></div>
    </div>
    <div class="pane guide">
      <h4>평소 사용</h4><p>상품을 등록한 날은 <b>상품 일괄 수집</b> 한 번이면 됩니다. 새로 등록한 상품을 기록하고, 도서 정보·시장 지표를 확인 주기가 지난 책만 골라 갱신합니다.</p>
      <h4>멈췄다 이어하기</h4><p>일시정지를 누르면 진행 위치가 Firebase에 저장됩니다. 수집기를 새 버전으로 바꾸고 새로고침해도, 다른 PC에서 눌러도 <b>이어하기</b>로 이어집니다. 일시정지 없이 창을 닫아도 마지막 저장(책 10권·목록 5쪽마다) 이후 몇 건만 다시 합니다.</p>
      <h4>여러 PC</h4><p>알라딘을 훑는 작업은 고객 수집기와 합쳐 한 번에 한 PC만 합니다. 다른 PC가 작업 중이면 가운데 칸에 빨간색으로 어느 PC가 무엇을 얼마나 했는지, 남은 시간이 보입니다. 이미지는 여러 PC가 동시에 해도 됩니다.</p>
      <h4>밤새 돌릴 때</h4><p>Windows 절전 모드를 꺼 두세요. 탭은 뒤에 있어도 됩니다.</p>
    </div>
  </div>`;
  globalThis.__rnMount(box);
  const $ = (s) => box.querySelector(s);
  $('.hd').onclick = () => box.classList.toggle('min');
  box.querySelectorAll('[data-pane]').forEach((b) => (b.onclick = () => { const c = 'show' + b.dataset.pane; const on = !box.classList.contains(c); box.classList.remove('showset', 'showimp', 'showguide'); if (on) box.classList.add(c); }));
  const logLines = [];
  function log(m, warn) {
    window.__rnLog && window.__rnLog('상품', warn ? 'warn' : 'info', m);
    logLines.unshift({ t: `${new Date().toTimeString().slice(0, 8)} ${m}`, w: warn ? 'warn' : '' }); if (logLines.length > 200) logLines.length = 200;
    $('#rnpLog').innerHTML = logLines.map((l) => `<p class="${l.w}">${l.t.replace(/</g, '&lt;')}</p>`).join('');
  }
  // 진행 표시 + 남은 시간(최근 처리 속도 기준) + 다른 PC에서 볼 수 있게 상태 공유
  const fmtDur = (min) => { if (!isFinite(min) || min < 0) return ''; if (min < 1) return '1분 미만'; const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h}시간 ${m}분` : `${m}분`; };
  let rate = { state: null, pts: [] }; let lastPub = 0; let lastUi = {};
  function ui(state, done, total, sub, next) { window.__rnUiAt = Date.now(); /* (1.78.4) 작업 멈춤 지킴이가 봄 */ if (total > 0) PROG_NOW = { i: Math.max(0, +done || 0), n: +total, l: String(state || '').slice(0, 60), at: Date.now() }; /* (1.74.0) 회차 진행 수치(지난 시간표) */
    window.__rnLog && window.__rnLog('상품', 'detail', `${state}${total ? ` ${(+done || 0).toLocaleString()}/${(+total).toLocaleString()}` : ''}${sub ? ` · ${sub}` : ''}`);
    $('#rnpState').textContent = state;
    $('#rnpBar').style.width = total ? Math.min(100, (done / total) * 100).toFixed(1) + '%' : '0';
    $('#rnpCount').textContent = total ? `${done.toLocaleString()} / ${total.toLocaleString()} (${((done / total) * 100).toFixed(1)}%)` : '';
    let eta = null;
    if (total) {
      if (rate.state !== state) rate = { state, pts: [] };
      rate.pts.push([Date.now(), done]); if (rate.pts.length > 80) rate.pts.shift();
      const [t0, d0] = rate.pts[0]; const [t1, d1] = rate.pts[rate.pts.length - 1];
      if (d1 > d0 && t1 - t0 > 20000) eta = ((total - done) / ((d1 - d0) / (t1 - t0))) / 60000;
    } else rate = { state: null, pts: [] };
    $('#rnpEta').textContent = eta != null ? `남은 시간 약 ${fmtDur(eta)} · 끝나는 시각 약 ${new Date(Date.now() + eta * 60000).toTimeString().slice(0, 5)}` : (total ? '남은 시간 계산 중…' : '');
    $('#rnpSub').textContent = sub || ''; if (next != null) $('#rnpNext').textContent = next;
    lastUi = { state, done, total, sub: sub || '', etaMin: eta != null ? Math.round(eta) : null };
    try { if (running && window.__rnPhase) window.__rnPhase('prd', state); } catch (e) {} // (1.43.0) 단계 표시 (작업 중일 때만)
    if (window.__rnStatus) window.__rnStatus.cur = { ...lastUi };
    if (auth.currentUser && Date.now() - lastPub > 30000) { lastPub = Date.now(); publishStatus(); }
  }
  let curKey = null; let pubKey = null;
  function publishStatus(extra) {
    const key = curKey || pubKey; if (!key) return Promise.resolve(); pubKey = key;
    const G = window.ReadnowRegistry || globalThis.ReadnowRegistry; const gv = (n) => (typeof unsafeWindow !== 'undefined' && unsafeWindow[n]) || window[n] || globalThis[n]; // (1.36.0) 읽은 공용 파일 판을 신호에 실음 → 웹앱 관리도구가 노선표의 판과 비교
    const cores = G ? G.loadedVers({ ReadNowCore: gv('ReadNowCore'), ReadnowSellers: gv('ReadnowSellers'), ReadnowProducts: gv('ReadnowProducts'), ReadnowPricing: gv('ReadnowPricing'), ReadnowShipping: gv('ReadnowShipping'), ReadnowOrders: gv('ReadnowOrders'), ReadnowAladin: gv('ReadnowAladin'), ReadnowExec: gv('ReadnowExec'), ReadnowRegistry: G, ReadnowRegister: gv('ReadnowRegister'), ReadnowExt: gv('ReadnowExt') }) : null; // (1.43.1) 알라딘 창구·실행 문 판도 · (1.44.0) 등록 엔진 판도 (예전엔 빠져 관리도구에 '?'로 빨갛게)
    return C('rn_status').doc(`prd_${PC_ID}_${key}`).set({ tool: '상품 수집기', pcName: LS.get('pcName', PC_ID), running: running || null, key, ...lastUi, ...(extra || {}), ver: APP_VER, cores, mods: window.__rnMods || null, tm: (() => { try { const I = window.__rnLiveInfo ? window.__rnLiveInfo() : null; return I ? { classic: I.classic || null, used: I.used || null, hwait: I.hwait || null, hsig: I.hsig || null } : null; } catch (e) { return null; } })(), /* (1.72.0) 이 PC Tampermonkey 본체 판·머리 — 웹앱에 'Tampermonkey 업데이트 필요' */ ledgerDown: window.__rnLedgerDown || null, /* (1.44.0) 실행 기록을 못 적는 중이면 관리도구에 빨갛게 */ atMs: Date.now(), ...W() }, { merge: true }).catch(() => {});
  }
  let running = null; let stopFlag = false;
  /* (1.66.0) 🔆 작업이 도는 동안 화면 꺼짐·화면 보호기 막기(Wake Lock) — 화면 보호기가 켜지면 크롬이 창을 '안 보임'으로 보고 타이머를 늦춰 수집이 멈춘 것처럼 됐음 · 공개 전용 PC(로거)는 늘 */
  const CWL = { lock: null, want: false }; const cwlSync = async () => { const want = CWL.want || PUBONLY; try { if (want && !CWL.lock && navigator.wakeLock && document.visibilityState === 'visible') { CWL.lock = await navigator.wakeLock.request('screen'); CWL.lock.addEventListener('release', () => { CWL.lock = null; setTimeout(cwlSync, 1500); }); } else if (!want && CWL.lock) { const l = CWL.lock; CWL.lock = null; await l.release(); } } catch (e) {} };
  document.addEventListener('visibilitychange', cwlSync); setTimeout(cwlSync, 3000);
  function setRunning(name) {
    CWL.want = !!name; cwlSync();
    running = name; stopFlag = false; if (name && window.__rnPhaseReset && !['chain', 'prdChain'].includes(curKey)) window.__rnPhaseReset('prd', name); // (1.43.0) 새 작업 = 단계 표시 처음부터 (일괄은 단계마다 아래에서)
    box.querySelectorAll('[data-job]').forEach((b) => (b.disabled = !!name && b.dataset.job !== 'images'));
    $('#rnpCtlStop').classList.toggle('on', !!name);
    $('#rnpWhy').textContent = name ? `'${name}' 진행 중 — 다른 알라딘 작업은 새 탭에서 동시에 할 수 있습니다 (요청 간격은 탭끼리 나눠 씀)` : '';
    if (!name) refreshResume();
    publishStatus({ running: name || null });
  }
  $('#rnpStop').onclick = () => { stopFlag = true; window.__rnPauseAll && window.__rnPauseAll('상품 패널에서'); log('일시정지 요청: 지금 항목을 마치고 진행 위치를 저장합니다 (이 PC의 모든 탭 함께)'); }; // (1.38.0) 버튼은 개요의 일시정지 하나로 합침 (이 버튼은 숨김)

  /* ───────── 로그인 ───────── */
  async function ensureLogin() {
    if (auth.currentUser) return auth.currentUser;
    await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); });
    if (auth.currentUser) return auth.currentUser;
    renderSetup();
    await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { if (x) { u(); r(x); } }); });
    return auth.currentUser;
  }
  // 처음 한 번 해야 할 설정 (고객 수집기와 같은 모양): 모두 끝나면 초록 한 줄
  function renderSetup() {
    const cred = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
    if (PUBONLY && !auth.currentUser && !window.__rnPubTabSet) { window.__rnPubTabSet = 1; setTimeout(() => { try { const b = globalThis.__rnQ('#rn-uni button[data-t="prd"]'); if (b) b.click(); const c = globalThis.__rnById('rn-ctl'); if (c && c.classList.contains('min')) { const t = c.querySelector('.ch .tg'); if (t) t.click(); } } catch (e) {} }, 1500); } /* (1.70.1) 로거: 구글 로그인 전이면 상품 탭(맨 위 '처음 한 번 해야 할 설정')을 열어 둠 */
    const items = [
      ['구글 로그인 (우리 Firebase — 알라딘과 무관)', !!auth.currentUser, 'login'],
      ['이 PC 이름', !!LS.get('pcName'), 'pcname'],
      ...(PUBONLY ? [] : [['알라딘 아이디·비밀번호 (자동 재로그인용)', !!(cred && cred.id && cred.pw), 'cred']]), /* (1.70.1) 로거는 알라딘 계정을 묻지도 받지도 않음 */
    ];
    const el = $('.setup');
    if (items.every((x) => x[1])) { el.className = 'setup done'; el.textContent = `✓ 설정 완료 · ${auth.currentUser.email.split('@')[0]} · PC: ${LS.get('pcName')}`; return; }
    el.className = 'setup todo';
    el.innerHTML = `<h5>처음 한 번 해야 할 설정</h5><ul>${items.map(([t, ok, k]) => `<li class="${ok ? 'ok' : 'no'}"><span>${ok ? '✓ ' : ''}${t}</span>${ok ? '' : `<button data-fix="${k}">하기</button>`}</li>`).join('')}</ul>`;
    el.querySelectorAll('[data-fix]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.fix;
      if (k === 'login') { /* (1.70.3) 로그인 창: 누른 동안 단추를 잠가 여러 번 열지 않음(여러 번 누르면 서로 취소돼 창이 안 뜨던 것) · 15초 안에 안 끝나면 '이 탭에서 로그인'(창 없이 이 탭이 구글로 갔다가 돌아옴)을 보여 줌 */
        if (window.__rnLoginBusy) { log('🔑 로그인 창이 이미 열려 있음 — 작업 표시줄에서 \'Google 계정으로 로그인\' 크롬 창을 찾거나, 아래 \'이 탭에서 로그인\'을 누르세요', 1); return; }
        window.__rnLoginBusy = 1; b.disabled = true; b.textContent = '로그인 창 여는 중…'; const li = b.closest('li'); const addRedirect = (why) => { if (!li || li.querySelector('[data-redir]')) return; li.insertAdjacentHTML('beforeend', `<div style="flex-basis:100%;font-size:11.5px;margin-top:4px;color:#7A4A10">${why} <button data-redir="1">이 탭에서 로그인</button></div>`); li.querySelector('[data-redir]').onclick = () => { log('🔑 이 탭이 구글 로그인 화면으로 갔다가 돌아옵니다'); auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch((e) => log('로그인 실패: ' + e.message, 1)); }; };
        const tw = setTimeout(() => addRedirect('로그인 창이 안 보이면(작업 표시줄에 숨었거나 막힘) →'), 15000);
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => { log('🔑 구글 로그인 됨'); renderSetup(); }).catch((e) => { const c = String(e.code || ''); log('로그인 실패: ' + e.message, 1); addRedirect(/popup-blocked/.test(c) ? '크롬이 로그인 창을 막음 →' : /popup-closed|cancelled/.test(c) ? '로그인 창이 닫혔거나 취소됨 →' : '창으로 로그인이 안 되면 →'); }).finally(() => { window.__rnLoginBusy = 0; clearTimeout(tw); b.disabled = false; b.textContent = '하기'; }); }
      if (k === 'pcname') { const n = prompt('이 PC의 이름 (예: JS-MAIN, HOME)', (window.__rnPcName && window.__rnPcName.get()) || ''); if (n && n.trim()) { window.__rnPcName && window.__rnPcName.set(n.trim()); $('#rnpName').value = n.trim(); renderSetup(); } }
      if (k === 'cred') { box.classList.remove('showimp', 'showguide'); box.classList.add('showset'); $('#rnpId').focus(); }
    }));
  }

  /* ───────── 설정 (모든 PC 공유) ───────── */
  /* (1.72.0 · 기본 끔) 🧪 로거 엔진 옮기기 — 웹앱 설정 '🧪 로거 엔진'(prd_system/settings.loggerEngine)을 켜면 로거가 쉬는 사이 도우미 엔진 화면(127.0.0.1:8899/engine)으로, 끄면 알라딘 첫 화면으로 돌아감
   *  도우미 1.5.0 이상일 때만 · 하던 일이 있으면 끝날 때까지 기다림(1분마다 봄) · 도우미 첫 화면(/start)도 이 뜻(rn-engine-want)을 보고 바로 엔진으로 */
  function engineSwitch() { try { if (!PUBONLY) return; const want = SET.loggerEngine === true; GM_setValue('rn-engine-want', want); const on = !!globalThis.__rnEngine; if (want === on) return; if (window.__rnEngTimer) return;
      window.__rnEngTimer = setInterval(() => { if (running || schedBusy || window.__rnReloading) return; const hv = HELPER && HELPER.ver; if (want && !(hv && verNum(hv) >= verNum('1.5.0'))) { if (!window.__rnEngNote) { window.__rnEngNote = 1; log(`🧪 로거 엔진을 켰지만 로컬 도우미가 ${hv || '?'} — 1.5.0 이상이 되면 옮김(도우미는 6시간 안에 스스로 업데이트)`, 1); } return; }
        clearInterval(window.__rnEngTimer); window.__rnEngTimer = null; log(want ? '🧪 로거 엔진 켬 — 도우미 엔진 화면으로 옮김(알라딘 화면을 닫음)' : '🧪 로거 엔진 끔 — 알라딘 첫 화면으로 돌아감', 1); setTimeout(() => { location.replace(want ? 'http://127.0.0.1:8899/engine' : 'http://127.0.0.1:8899/start'); }, 1500); }, 60e3); } catch (e) {} }
  async function loadSettings() {
    const d = await C('prd_system').doc('settings').get();
    SET = { ...DEFAULTS, ...(d.exists ? d.data() : {}) };
    PACE.setCfg({ minMs: SET.reqMinMs, startMs: SET.reqStartMs, maxMs: SET.reqMaxMs }); // 모든 수집·감시가 이 값을 같이 씀
    $('#rnpDelay').value = SET.reqMinMs; $('#rnpDelayMax').value = SET.reqMaxMs; $('#rnpUsedDays').value = SET.usedInfoDays ?? 30; $('#rnpUsedAfter').value = SET.usedInfoAfter ?? 3; $('#rnpUsedChain').value = SET.usedInfoChainMin ?? 60; $('#rnpRecheck').value = SET.recheckDays; $('#rnpNaver').checked = !!SET.fallbackNaver; { const pa = $('#rnpPubAnon'); if (pa) pa.checked = SET.pubAnon !== false; } $('#rnpGoogle').checked = !!SET.fallbackGoogle; $('#rnpKey').value = SET.keyScheme; $('#rnpName').value = LS.get('pcName', '');
  }
  const saveSet = (patch) => { Object.assign(SET, patch); return C('prd_system').doc('settings').set({ ...patch, updatedBy: auth.currentUser.email, ...W() }, { merge: true }); };
  $('#rnpDelay').onchange = (e) => { const v = Math.max(300, +e.target.value || 600); saveSet({ reqMinMs: v }); PACE.setCfg({ minMs: v }); };
  $('#rnpDelayMax').onchange = (e) => { const v = Math.max(2000, +e.target.value || 15000); saveSet({ reqMaxMs: v }); PACE.setCfg({ maxMs: v }); };
  $('#rnpUsedDays').onchange = (e) => saveSet({ usedInfoDays: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpUsedAfter').onchange = (e) => saveSet({ usedInfoAfter: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpUsedChain').onchange = (e) => saveSet({ usedInfoChainMin: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpRecheck').onchange = (e) => saveSet({ recheckDays: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpNaver').onchange = (e) => saveSet({ fallbackNaver: e.target.checked });
  $('#rnpPubAnon').onchange = (e) => { saveSet({ pubAnon: e.target.checked }); try { window.__rnToast && window.__rnToast(e.target.checked ? '🔓 공개 화면은 로그인 없이만 읽음 (모든 PC)' : '🔒 공개 화면도 예전처럼(확인된 것만 로그인 없이)'); } catch (er) {} log(e.target.checked ? '🔓 공개 화면은 로그인 없이만 읽기 켬' : '🔒 공개 화면 로그인 없이만 읽기 끔'); };
  $('#rnpGoogle').onchange = (e) => saveSet({ fallbackGoogle: e.target.checked });
  $('#rnpName').onchange = (e) => { (window.__rnPcName && window.__rnPcName.set($('#rnpName').value)), LS.set('pcName', e.target.value.trim() || PC_ID); renderSetup(); };
  // 저장 상태를 눈으로 확인: 초록 = 저장 완료(더 넣을 필요 없음), 주황 = 비어 있음, 빨강 = 최근 자동 로그인 실패
  function renderCred() {
    { const box = $('#rnpCredSt'); if (box && !globalThis.__rnById('rnpLoginM')) box.insertAdjacentHTML('beforebegin', `<div id="rnpLoginM" style="margin:4px 0;font-size:12px"><b>다시 로그인 방식</b> <label><input type="radio" name="rnpLm" value="naver"> 네이버로 로그인 (권장)</label> <label><input type="radio" name="rnpLm" value="id"> 알라딘 아이디·비밀번호</label><div id="rnpNaverSt" style="color:#5B6B66"></div></div>`);
      const m = window.__rnLoginMethod ? window.__rnLoginMethod() : 'naver'; document.querySelectorAll('input[name="rnpLm"]').forEach((r) => { r.checked = r.value === m; r.onchange = () => { GM_setValue('rnu-login-method', r.value); renderCred(); }; });
      const ok = GM_getValue('rnu-naver-okAt', 0), fail = GM_getValue('rnu-naver-failAt', 0), need = GM_getValue('rnu-need-naver', 0); const t = (ms) => new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const st = globalThis.__rnById('rnpNaverSt'); if (st) st.textContent = m !== 'naver' ? '아이디 로그인은 자동입력방지가 생겨 자동으로 안 될 수 있습니다' : need && need > ok ? `⚠ 네이버 로그인 필요 (${t(need)}) — 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)` : ok ? `✓ 마지막 네이버 자동 로그인 ${t(ok)}` : '이 PC 브라우저에서 네이버에 한 번 로그인(로그인 상태 유지)해 두면 자동으로 다시 로그인합니다';
      if (m === 'naver') return; }
    const c = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null)); const okAt = GM_getValue('rnp-cred-okAt', 0); const failAt = GM_getValue('rnp-cred-failAt', 0);
    const el = $('#rnpCredSt'); const t = (ms) => new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (c && c.id && c.pw) {
      const bad = failAt && failAt > okAt;
      el.className = 'cst ' + (bad ? 'bad' : 'ok');
      el.innerHTML = bad
        ? `<b>✕ 저장은 되어 있으나 ${t(failAt)} 자동 로그인 실패</b><small>비밀번호가 바뀌었는지 확인하고, 새 비밀번호를 넣어 저장하세요.</small>`
        : `<b>✓ 아이디 ${c.id} · 비밀번호 저장됨 — 더 넣지 않아도 됩니다</b><small>${okAt ? `마지막 자동 로그인 성공: ${t(okAt)}` : '아직 자동 로그인할 일이 없었습니다'} · 바꿀 때만 새로 입력하세요</small>`;
      $('#rnpPw').placeholder = '●●●●●● 저장됨 (바꿀 때만 입력)';
    } else if (c && c.id) {
      el.className = 'cst no'; el.innerHTML = `<b>! 아이디만 저장됨 — 비밀번호가 비어 있습니다</b><small>비밀번호를 넣고 저장해야 자동 재로그인이 됩니다.</small>`; $('#rnpPw').placeholder = '';
    } else {
      el.className = 'cst no'; el.innerHTML = `<b>! 저장된 아이디·비밀번호 없음</b><small>넣지 않으면 로그인이 풀릴 때 수집이 멈춥니다.</small>`; $('#rnpPw').placeholder = '';
    }
  }
  { const c = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null)); $('#rnpId').value = c ? c.id : ''; renderCred(); }
  if (PUBONLY) { ['#rnpCredSt', '#rnpId', '#rnpPw', '#rnpCredSave', '#rnpLoginM', '#rnpNaverSt'].forEach((q) => { const e = $(q); if (!e) return; const w = e.closest('label') || e.closest('.row') || e; w.style.display = 'none'; }); const pa = $('#rnpPubAnon'); if (pa) { pa.checked = true; pa.disabled = true; pa.title = '로거는 설정과 상관없이 늘 로그인 없이 읽음'; } } /* (1.70.1) 로거: 알라딘 계정 칸 숨김 · 🔓 늘 켬 */
  $('#rnpCredSave').onclick = () => { if (PUBONLY) return log('🛡 로거에는 알라딘 계정을 넣지 않습니다', 1);
    const id = $('#rnpId').value.trim(); const pw = $('#rnpPw').value; const old = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
    if (id) { GM_setValue('rnp-cred', { id, pw: pw || (old && old.pw) || '' }); if (pw) GM_deleteValue('rnp-cred-failAt'); } else { GM_deleteValue('rnp-cred'); }
    $('#rnpPw').value = ''; renderCred(); renderSetup();
    const c = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
    log(!id ? '아이디·비밀번호 삭제됨' : c && c.pw ? `알라딘 아이디·비밀번호 저장됨 (${id})` : '아이디만 저장됨 — 비밀번호를 넣어 주세요', !(c && c.pw));
  };
  $('#rnpKey').onchange = (e) => { if (confirm('도서 기준 키를 바꾸면 이후 "같은 책" 판단 기준이 바뀝니다. 기존 책의 내부 번호와 이미지는 그대로입니다. 바꿀까요?')) saveSet({ keyScheme: e.target.value }); else e.target.value = SET.keyScheme; };

  /* ───────── 잠금: 고객 수집기와 같은 문서(crm_system/work_lock)·같은 규칙 ───────── */
  // 알라딘을 훑는 작업은 두 수집기를 통틀어 한 번에 하나. 신호가 5분 끊기면 자동으로 풀린다.
  /* ───────── 알라딘 작업 잠금 (인터넷 주소 묶음별) ─────────
   * 묶음: 같은 인터넷 주소를 쓰는 PC끼리 (기본: 사무실 = office, HOME = home). 묶음마다 잠금이 따로라 HOME은 사무실과 동시에 돎.
   * 한 묶음 안에서는 상품 쪽 작업을 '동시에 알라딘 작업할 PC 수'(설정)만큼 함께 돌릴 수 있고, 그때 PC마다 요청 간격을 그 수만큼 늘려 묶음 전체 속도는 그대로(차단 위험 그대로).
   * 고객 수집은 묶음 안에서 혼자 (가장 중요해 다른 작업이 양보). 같은 작업(예: 시장 지표)은 어느 묶음이든 한 PC만. */
  const lockGroup = () => { const g = (SET.ipGroups || { HOME: 'home' })[String(PC_NAME || '').toUpperCase()] || (SET.ipGroups || {})[PC_NAME] || (PUBONLY ? 'pub_' + String(PC_NAME || PC_ID).replace(/[^\w가-힣-]/g, '').slice(0, 20) : 'office'); return g; }; /* (1.64.0) 공개 전용 PC는 따로 정하지 않으면 제 묶음(다른 인터넷 줄 · 429 쉬기도 따로) */
  const lockDocId = () => (lockGroup() === 'office' ? 'work_lock' : 'work_lock_' + lockGroup());
  const LOCK = () => C('crm_system').doc(lockDocId());
  /* (1.63.12) 🌐 공개 읽기 줄 — 로그인이 필요 없는 알라딘 공개 화면만 읽는 일(벤치마킹 숍 목록·상품·온라인 중고·판매자 평가·탐색 등)은 로그인 줄(work_lock)과 따로 돎.
   *  · 같은 인터넷 주소 묶음에서 동시에 SET.pubLanes대(기본 3)까지 · 로그인 줄 일(주문·출고·상품 조회·고객)과 서로 기다리지 않음
   *  · PC마다 자기 속도 조절(요청 간격 자동)을 그대로 씀 — 한 PC가 '요청이 너무 많음(429)'을 받으면 묶음 전체 공개 줄이 함께 쉼(pub_lock.coolUntil)
   *  · 🎯 집중 벤치마킹은 판매자 단위로 나눠 읽음(prd_jobs/bclaim_판매자 — 먼저 잡은 PC만) → 여러 PC가 한 바퀴를 같이 돎 */
  const PUB_JOBS = new Set((() => { try { const A0 = globalThis.ReadnowAuto; if (A0 && A0.AS && A0.AS.PUB_KEYS) return A0.AS.PUB_KEYS; } catch (e) {} return ['bench', 'benchForce', 'benchHelp', 'benchDetail']; })()); /* (1.67.0) 기준은 ⏰ 공용 파일(AS.PUB_KEYS) 한 곳 — 공용 파일이 없을 때만 이 목록 */
  const isPubKey = (k) => PUB_JOBS.has(String(k || '').replace(/^job:/, '').split('#')[0]);
  /* (1.66.0) 🌐 공개 전용 PC가 생기면(테더링이 한 번이라도 확인되면 prd_system/settings.pubPcSince) 대량 공개 일(PUB_JOBS 전부)은 그 PC만 —
   *  사무실 PC가 사무실 IP(북스킹 계정이 로그인하는 IP)로 벤치마킹·시장 지표를 읽으면 쿠키가 없어도 IP로 이어질 수 있어서. 그 PC가 쉬는 동안에도 사무실 PC가 대신하지 않음(기다림)
   *  · 끄기: 웹앱 설정 → '대량 공개 일은 공개 전용 PC만' (pubPcMode='off') · 출고 시장 받쳐 주기·주문 상품 유의 사항(맡긴 일 usedInfo) 같은 가벼운 일은 그대로 */
  let PUBPC = { since: null, name: null, mode: 'auto' }, pubpcUn = null;
  auth.onAuthStateChanged((u) => { if (!u || pubpcUn) return; pubpcUn = C('prd_system').doc('settings').onSnapshot((d) => { const v = (d.exists && d.data()) || {}; PUBPC = { since: v.pubPcSince || null, name: v.pubPcName || null, mode: v.pubPcMode || 'auto' }; }, () => {}); });
  const pubPcMode = () => !PUBONLY && PUBPC.mode !== 'off' && !!PUBPC.since;
  const PUBPC_MSG = () => `🌐 대량 공개 일은 공개 전용 PC(${PUBPC.name || '테더링'})가 함 — 이 PC는 사무실 인터넷이라 하지 않음 (끄기: 웹앱 설정)`;
  const LOCKP = () => C('crm_system').doc(lockDocId().replace('work_lock', 'pub_lock'));
  const pubMax = () => Math.max(1, Math.min(10, +SET.pubLanes || 3));
  let LREF = LOCK; let PUB_COOL = 0;
  const JOBREG = () => C('crm_system').doc('running_jobs');
  let lockBeat = null; let lockHeld = false; let yieldUnsub = null; let yieldFor = null; let laneCount = 1; let myJobLabel = null; let myRegKey = null; let lastSame = false;
  const TAB_FRESH = 5 * 60000;
  const freshPcs = (d, now) => { const o = Object.fromEntries(Object.entries((d && d.pcs) || {}).filter(([, v]) => v && now - (v.at || 0) < TAB_FRESH));
    if (d && d.holder && String(d.task || '').startsWith('product_') && !o[d.holder] && d.heartbeatMs && now - d.heartbeatMs < TAB_FRESH) o[d.holder] = { name: d.pcName, at: d.heartbeatMs, prio: d.prio ?? 50, job: String(d.task).slice(8), tabs: d.tabs || {}, legacy: true }; // 1.7.0 전 버전이 잡은 자리
    return o; };
  const legacyOther = (d, now) => d && d.holder && d.heartbeatMs && now - d.heartbeatMs < TAB_FRESH && !String(d.task || '').startsWith('product_') && d.holder !== PC_ID; // 고객 수집이 잡고 있음
  function lockFields(pcs, d) { const arr = Object.entries(pcs); if (!arr.length) return null; const [hid, h] = arr.sort((a, b) => (b[1].prio ?? 0) - (a[1].prio ?? 0))[0];
    return { writerSchema: WRITER_SCHEMA, holder: hid, pcName: h.name, task: 'product_' + (h.job || ''), taskLabel: '상품 수집기: ' + arr.map(([, v]) => `${v.name}(${Object.values(v.tabs || {}).map((t) => t.job).join('+')})`).join(' · '), prio: Math.max(...arr.map(([, v]) => v.prio ?? 0)), minPrio: Math.min(...arr.map(([, v]) => v.prio ?? 0)), startedAt: (d && d.startedAt) || nowIso(), heartbeatMs: Date.now(), pcs, by: auth.currentUser.email }; }
  async function acquireLane(lane, label) {
    if (lane !== 'aladin') return { ok: true };
    if (PUBONLY && !TGATE.ok) return { ok: false, pubOnly: true, msg: '🛡 ' + TGATE.why };
    if (pubPcMode() && (window.__rnAuto || window.__rnHelper) && (isPubKey(curKey) || isPubKey(curStage ? (STAGE_JOB[curStage] || curStage) : ''))) return { ok: false, pubOnly: true, msg: PUBPC_MSG() }; /* (1.67.0) 자동(⏰·돕기)만 막음 — 관리자가 손으로 누르거나 웹앱에서 이 PC에 시킨 비로그인 일은 함 */
    if (PUBONLY && !(isPubKey(curKey) || isPubKey(curStage ? (STAGE_JOB[curStage] || curStage) : ''))) return { ok: false, pubOnly: true, msg: '🌐 공개 전용 PC — 로그인이 필요한 일은 하지 않음(로그인된 다른 PC가 함)' };
    if (!(window.__rnPcName && window.__rnPcName.get())) { const n = window.__rnRemote ? null : window.__rnPcName && window.__rnPcName.ask(''); if (n) $('#rnpName').value = n; }
    const name = (window.__rnPcName && window.__rnPcName.get()) || LS.get('pcName', PC_ID); const job = (curStage && STEP_LABEL[curStage]) || label || running || ''; /* (1.63.6 전체 점검) '같은 작업은 한 곳만' 열쇠는 이름이 아니라 작업 열쇠로 — 예전엔 일괄 수집 안의 벤치마킹('집중 벤치마킹 판매자')과 ⏰·직접 벤치마킹('🎯 … 정한 순서대로 모두')이 이름이 달라 두 PC가 같은 판매자를 함께 읽어 서로 덮을 수 있었음 */ const regKey = (() => { const k0 = curStage ? (STAGE_JOB[curStage] || curStage) : (curKey || ''); const k = { benchForce: 'bench' }[k0] || k0; return k ? 'job:' + k : job; })(); const myPrio = curPrio(); const pubL = lockHeld ? LREF === LOCKP : isPubKey(regKey) || isPubKey(curKey); const LK = lockHeld ? LREF : pubL ? LOCKP : LOCK; const maxN = pubL ? pubMax() : Math.max(1, +SET.maxLanes || 1); const regK = pubL && window.__rnHelper ? regKey + '#' + PC_ID : regKey; /* 돕는 PC(남는 PC)는 같은 일을 판매자 단위로 나눠 읽음 — 작업 열쇠를 PC마다 따로 */
    const t0 = Date.now(); let asked = false;
    for (;;) {
      try {
        await db.runTransaction(async (tx) => {
          const s = await tx.get(LK()); const d = s.exists ? s.data() : null; const now = Date.now();
          const rg = await tx.get(JOBREG()); const reg = rg.exists ? rg.data() : {}; const other = reg[regK] || (regK !== job && !pubL ? reg[job] : null); // 같은 작업은 어느 PC든 한 곳만 (예전 판 수집기가 이름으로 적은 것도 봄)
          if (other && other.pc !== PC_ID && now - (other.at || 0) < TAB_FRESH) { const e = new Error('SAMEJOB'); e.info = { job, holder: other.name }; throw e; }
          if (!pubL && legacyOther(d, now)) { const e = new Error('LOCKED'); e.info = d; throw e; } /* 고객 수집(옛 잠금)은 로그인 줄만 막음 */
          const pcs = freshPcs(d, now); const mine = pcs[PC_ID] || { name, tabs: {} };
          const tabs = {}; Object.entries(mine.tabs || {}).forEach(([k, v]) => { if (k !== TAB_ID && v && now - (v.at || 0) < TAB_FRESH) tabs[k] = v; });
          if (Object.values(tabs).some((v) => v.job === job)) { const e = new Error('SAMEJOB'); e.info = { job, holder: '이 PC의 다른 탭' }; throw e; }
          if (!pcs[PC_ID] && Object.keys(pcs).length >= maxN) { const e = new Error('LOCKED'); e.info = { ...(d || {}), prio: Math.min(...Object.values(pcs).map((v) => v.prio ?? 0)), lowPc: Object.entries(pcs).sort((a, b) => (a[1].prio ?? 0) - (b[1].prio ?? 0))[0][0] }; throw e; }
          tabs[TAB_ID] = { at: now, job, prio: myPrio };
          pcs[PC_ID] = { name, at: now, job, prio: Math.max(...Object.values(tabs).map((v) => v.prio ?? 0)), tabs };
          const low = Object.entries(tabs).some(([k, v]) => k !== TAB_ID && (v.prio ?? 0) < myPrio); // 같은 PC의 다른 탭에 낮은 작업 → 양보 요청
          tx.set(LK(), { ...lockFields(pcs, d), ...(d && d.coolUntil && d.coolUntil > now ? { coolUntil: d.coolUntil, coolBy: d.coolBy || null } : {}), /* (1.63.15 자동 점검) 함께 쉬는 중(429)이면 그대로 — 예전엔 새 PC가 줄에 들어오며 문서를 통째로 써서 쉬는 시각이 지워졌고, 모든 PC가 곧바로 다시 읽었음 */ ...(low ? { yieldReq: { prio: myPrio, pc: PC_ID, tab: TAB_ID, target: PC_ID, pcName: name, tool: job, at: now } } : {}) });
          tx.set(JOBREG(), { [regK]: { pc: PC_ID, name, at: now, label: job, ...(pubL ? { pub: true } : {}) } }, { merge: true });
        });
        break;
      } catch (e) {
        if (e.message === 'LOCKED') { const hp = e.info.prio ?? 100;
          if (hp < myPrio && Date.now() - t0 < 6 * 60000) { // 낮은 작업이 자리를 차지 → 가장 낮은 PC에 양보 요청하고 기다림
            if (!asked) { asked = true; log(`${e.info.pcName || '다른 PC'}의 '${e.info.taskLabel || ''}'(중요도 ${hp})보다 '${job}'(중요도 ${myPrio})이 먼저입니다. 양보를 요청하고 기다립니다`); }
            await LK().set({ yieldReq: { prio: myPrio, pc: PC_ID, tab: TAB_ID, target: e.info.lowPc || null, pcName: name, tool: job, at: Date.now() } }, { merge: true }).catch(() => {});
            ui(`양보 기다리는 중 — ${e.info.pcName || ''}: ${e.info.taskLabel || ''}`, 0, 0, `${Math.round((Date.now() - t0) / 1000)}초`); await sleep(10000); continue; }
          return { ok: false, holder: e.info.pcName, job: e.info.taskLabel, minutes: Math.round((Date.now() - (e.info.heartbeatMs || Date.now())) / 60000), prio: hp }; }
        if (e.message === 'SAMEJOB') { lastSame = true; return { ok: false, holder: e.info.holder === '이 PC의 다른 탭' ? '이 PC의 다른 탭' : e.info.holder, job: e.info.job, minutes: 0, same: true }; }
        throw e;
      }
    }
    myLockPrio = myPrio; myJobLabel = job; myRegKey = regK; LREF = LK; if (pubL) log(`🌐 공개 읽기 줄로 시작 — 로그인 줄 일과 함께 돎(같은 인터넷 주소 최대 ${maxN}대)`);
    lockHeld = true; clearInterval(lockBeat);
    lockBeat = setInterval(() => { if (!lockHeld) return; const now = Date.now(); try { if (running && now - lastPub > 50000) { lastPub = now; publishStatus(); } } catch (e) {} /* (1.63.8 점검) 작업 중이면 1분마다 상태 신호 — 화면을 그리지 않는 단계에서도 다른 PC가 '하는 중'을 앎 */ LREF().set({ heartbeatMs: now, writerSchema: WRITER_SCHEMA, pcs: { [PC_ID]: { at: now, tabs: { [TAB_ID]: { at: now, job, prio: myLockPrio } } } } }, { merge: true }).catch(() => {}); JOBREG().set({ [regK]: { pc: PC_ID, name, at: now, label: job, ...(pubL ? { pub: true } : {}) } }, { merge: true }).catch(() => {}); }, 60000);
    // 양보 요청(나보다 중요한 작업, 나를 지목했거나 지목 없음) → 진행 위치 저장 후 멈춤 → 끝나면 자동으로 이어감. 묶음 안 PC 수만큼 요청 간격을 늘림
    if (yieldUnsub && yieldUnsub.path !== LK().path) { try { yieldUnsub(); } catch (e) {} yieldUnsub = null; } /* 줄이 바뀌면 그 줄의 잠금을 들음 */
    if (!yieldUnsub) { const un = LK().onSnapshot((d) => { const x = d.exists ? d.data() : null; laneCount = Math.max(1, Object.keys(freshPcs(x, Date.now())).length); PUB_COOL = LREF === LOCKP && x && x.coolUntil ? +x.coolUntil : 0; const y = x && x.yieldReq;
      if (lockHeld && running && y && Date.now() - (y.at || 0) < 3 * 60000 && !yieldFor && (y.prio ?? 100) > myLockPrio && !(y.pc === PC_ID && y.tab === TAB_ID) && (!y.target || y.target === PC_ID)) { yieldFor = { ...y, key: curKey, myPrio: myLockPrio }; stopFlag = true; log(`${y.pcName || '다른 PC'}의 '${y.tool || '고객 수집'}'(중요도 ${y.prio ?? 100})이 더 중요해 양보합니다 (지금 작업 중요도 ${myLockPrio}). 진행 위치를 저장하고 멈췄다가, 끝나면 자동으로 이어갑니다`, 1); } }, () => {}); un.path = LK().path; yieldUnsub = un; }
    return { ok: true };
  }
  async function releaseLane(lane) {
    if (lane !== 'aladin') return;
    clearInterval(lockBeat); if (!lockHeld) return; lockHeld = false; const job = myRegKey || myJobLabel;
    try {
      await db.runTransaction(async (tx) => {
        const s = await tx.get(LREF()); const rg = await tx.get(JOBREG()); const now = Date.now();
        if (rg.exists && rg.data()[job] && rg.data()[job].pc === PC_ID) tx.set(JOBREG(), { [job]: firebase.firestore.FieldValue.delete() }, { merge: true });
        if (!s.exists) return; const d = s.data(); const pcs = freshPcs(d, now); const mine = pcs[PC_ID]; if (!mine) return;
        const tabs = {}; Object.entries(mine.tabs || {}).forEach(([k, v]) => { if (k !== TAB_ID && v && now - (v.at || 0) < TAB_FRESH) tabs[k] = v; });
        if (Object.keys(tabs).length) pcs[PC_ID] = { ...mine, tabs, at: now, prio: Math.max(...Object.values(tabs).map((v) => v.prio ?? 0)), job: Object.values(tabs)[0].job }; else delete pcs[PC_ID];
        if (LREF !== LOCKP && legacyOther(d, now)) tx.set(LREF(), { pcs: Object.keys(pcs).length ? pcs : firebase.firestore.FieldValue.delete() }, { merge: true }); // 고객 수집이 잡은 잠금은 건드리지 않음
        else if (Object.keys(pcs).length) tx.set(LREF(), { ...lockFields(pcs, d), ...(d.coolUntil ? { coolUntil: d.coolUntil, coolBy: d.coolBy || null } : {}) }); else if (d.coolUntil && d.coolUntil > now) tx.set(LREF(), { coolUntil: d.coolUntil, coolBy: d.coolBy || null }); else tx.delete(LREF());
      });
    } catch (e) {}
    LREF = LOCK; PUB_COOL = 0;
  }
  const laneBusy = (d, pub) => { const now = Date.now(); if (!d) return false; if (!pub && legacyOther(d, now)) return true; const pcs = freshPcs(d, now); delete pcs[PC_ID]; return Object.keys(pcs).length >= (pub ? pubMax() : Math.max(1, +SET.maxLanes || 1)); };
  const lockMsg = (l) => { try { window.__rnLaneFail = { holder: l && l.holder, at: Date.now() }; } catch (e) {} return lockMsg0(l); }; /* (1.84.3) 마지막으로 못 잡은 까닭 — ⏰가 다시 시도할 간격을 정함 */
  const lockMsg0 = (l) => l.pubOnly ? l.msg : (l.holder === '이 PC의 다른 탭' ? `이 PC의 다른 탭에서 '${l.job}'을(를) 이미 하고 있습니다. 같은 작업은 한 탭에서만 합니다` : `다른 PC(${l.holder})에서 '${l.job}' 작업 중입니다 (마지막 신호 ${l.minutes}분 전). 끝난 뒤 다시 누르세요. 이미지 작업은 지금도 가능합니다`);

  /* ───────── 진행 저장 (Firebase + 이 PC) ───────── */
  const jobRef = (name) => C('prd_jobs').doc(name);
  // (1.34.1) 큰 목록(수만 개)은 바뀌었을 때만 올림 — 예전엔 5개마다 1MB 가까운 목록 전체를 다시 올림(느림·문서 한도 1MB를 넘으면 저장 실패). 700KB가 넘으면 조각 문서로 나눠 둠
  const BIG_SENT = new Map(); const bigSig = (v) => `${v.length}|${v[0]}|${v[v.length >> 1]}|${v[v.length - 1]}`;
  async function saveProgress(name, prog) { if (FORCE_ALL) prog.force = true; LS.set('job_' + name, prog); const out = { ...prog };
    for (const [k, v] of Object.entries(prog)) if (Array.isArray(v) && v.length > 1000) { delete out[k]; const sig = bigSig(v); if (BIG_SENT.get(name + '|' + k) === sig) continue; // 같은 목록이면 다시 올리지 않음
      const s = JSON.stringify(v); out[k] = firebase.firestore.FieldValue.delete();
      if (s.length <= 700000) { out[k + '__J'] = s; out[k + '__C'] = firebase.firestore.FieldValue.delete(); }
      else { const n = Math.ceil(s.length / 500000); for (let i = 0; i < n; i++) await jobRef(name).collection('big').doc(`${k}_${i}`).set({ s: s.slice(i * 500000, (i + 1) * 500000), at: Date.now() }); out[k + '__C'] = n; out[k + '__J'] = firebase.firestore.FieldValue.delete(); }
      BIG_SENT.set(name + '|' + k, sig); }
    await jobRef(name).set({ ...out, done: false, discarded: firebase.firestore.FieldValue.delete(), by: PC_NAME, pc: PC_ID, savedAt: Date.now(), _i: typeof prog.i === 'number' ? prog.i : null, _n: Array.isArray(prog.list) ? prog.list.length : null, ...W() }, { merge: true }); }
  async function loadProgress(name) { const p0 = await loadProgress0(name); if (p0 && FORCE_ALL && !p0.force && p0.list) { log(`수동 실행: 기간 제한으로 만든 이전 목록 대신 전부로 새 목록을 만듭니다 ('${name}')`); return null; } return p0; }
  async function loadProgress0(name) { const d = await jobRef(name).get(); if (!d.exists || d.data().done) return null; const x = d.data();
    for (const k of Object.keys(x)) if (k.endsWith('__J')) { try { x[k.slice(0, -3)] = JSON.parse(x[k]); BIG_SENT.set(name + '|' + k.slice(0, -3), bigSig(x[k.slice(0, -3)])); } catch (e) {} delete x[k]; }
    for (const k of Object.keys(x)) if (k.endsWith('__C')) { const base = k.slice(0, -3); try { let s = ''; for (let i = 0; i < x[k]; i++) s += ((await jobRef(name).collection('big').doc(`${base}_${i}`).get()).data() || {}).s || ''; x[base] = JSON.parse(s); BIG_SENT.set(name + '|' + base, bigSig(x[base])); } catch (e) {} delete x[k]; }
    return x; }
  async function finishJob(name, summary) { const d = await jobRef(name).get().catch(() => null); const del = {}; if (d && d.exists) Object.keys(d.data()).forEach((k) => { if (k.endsWith('__J') || k.endsWith('__C') || k === 'list') del[k] = firebase.firestore.FieldValue.delete(); }); [...BIG_SENT.keys()].filter((x) => x.startsWith(name + '|')).forEach((x) => BIG_SENT.delete(x)); await jobRef(name).set({ ...del, done: true, finishedAt: Date.now(), summary, ...W() }, { merge: true }); LS.set('job_' + name, null); }

  /* ───────── 알라딘 페이지 가져오기: 사람 속도 간격, 서버 불안정 시 길게 재시도, 로그인 풀림 시 자동 재로그인 ───────── */
  let lastReq = 0;
  const AL = window.ReadnowAladin || globalThis.ReadnowAladin; // (1.39.0) 알라딘 창구 하나 (readnow-aladin-core.js)
  const RETRY_WAITS = AL.RETRY_WAITS; const MAX_OUTAGE_MIN = 360; // 새벽 점검(수 시간)도 기다렸다 이어감
  async function politeWait() { if (lockHeld && LREF === LOCKP) { while (PUB_COOL > Date.now()) { if (stopFlag) throw new Error('멈춤'); ui('🌐 공개 읽기 줄 함께 쉬는 중', 0, 0, `같은 인터넷 주소의 PC가 '요청이 너무 많음'을 받아 ${Math.ceil((PUB_COOL - Date.now()) / 1000)}초 쉼`); await sleep(Math.min(5000, PUB_COOL - Date.now())); } await PACE.wait(sleep, SET.pubSplitRate ? laneCount : 1); return; } await PACE.wait(sleep, lockHeld ? laneCount : 1); } /* (1.63.12) 공개 줄은 PC마다 제 속도(설정 '공개 줄도 나눠 쓰기'를 켜면 예전처럼 나눔) */ // 같은 묶음(인터넷 주소)에서 여러 PC가 동시에 돌면 그만큼 간격을 늘림

  const looksLoggedOut = (finalUrl, doc) => AL.looksLoggedOut(finalUrl, doc);
  /* (1.64.0) 🔓 공개 화면 = 로그인 쿠키 없이만 (SET.pubAnon, 기본 켬 · 모든 PC 같은 설정) — 판매자 계정과 대량 읽기를 완전히 떼어 놓음
   *  대상(아래 PUB_URL): 상품 페이지 · 온라인 중고 목록 · 판매자 숍 목록 · 판매자 평가 · 검색 결과 — 어느 작업이 부르든 여기 한 곳에서 쿠키를 빼고 읽음
   *  · 로그인 없이는 못 보는 장(19금 등) = 로그인으로 다시 읽지 않고 그 장만 건너뜀(오류 → 작업마다 그 책만 실패로 셈)
   *  · 숍 목록(간단히 보기)에 장바구니 칸이 없으면 = 로그인 없이 보이는 모양이 다른 것 → 그 장을 쓰지 않음(사라진 상품으로 잘못 셈하지 않게)
   *  · 끄면(설정) 예전처럼: 확인된 종류만 로그인 없이, 나머지는 로그인 상태 */
  const PUB_URL = /^(?:https?:\/\/www\.aladin\.co\.kr)?\/(?:shop\/wproduct\.aspx|shop\/usedshop\/(?:wuseditemall|wshopitem|wshopsurvey)\.aspx|search\/wsearchresult\.aspx)/i;
  const pubAnonOn = () => SET.pubAnon !== false; const isPubUrl = (u) => PUB_URL.test(String(u || ''));
  const ANON = { n: 0, gate: 0, view: 0, at: Date.now() }; const anonNote = () => { if (++ANON.n % 500 === 0) log(`🔓 로그인 없이 읽은 공개 화면 ${ANON.n}장 (19금 등 건너뜀 ${ANON.gate} · 숍 목록 모양 다름 ${ANON.view})`); };
  let LO_URL = null; const getDocRaw = AL.makeReader({ pace: PACE, sleep, wait: politeWait, beforeEach: () => { if (stopFlag) throw new Error('멈춤'); },
    loggedOut: (fu, doc, url) => { const lo = AL.looksLoggedOut(fu, doc, { url, scmNeedsLogout: true }); LO_URL = lo ? url : null; return lo; },
    onLoggedOut: async (fu, loginTries) => {
      /* (1.89.26) 정범님 10/21 HOME 14:03~14:19 '로그인 풀림 → 네이버로 다시 로그인'이 1분마다 되풀이되다 3시간 기록이 끊김 — 주문이 들어와 비공개가 된 우리 매물 화면(공개 상품 화면)이 로그인 화면처럼 보인 것을 '로그인 풀림'으로 봄
       *  → 공개 상품 화면에서 이렇게 보이는데 샵매니저는 로그인 그대로면, 다시 로그인하지 않고 그 화면만 '비공개'로 3일 건너뜀 */
      if (LO_URL && isPubUrl(LO_URL) && (await isLoggedIn())) { hidSet(LO_URL); throw hidErr(); }
      if (!SET.autoLogin) throw new Error('알라딘 로그인이 풀렸습니다. 직접 로그인한 뒤 같은 버튼을 다시 누르세요');
      if ((SET.maxLoginTries ?? 6) > 0 && loginTries > (SET.maxLoginTries ?? 6)) { try { GM_notification({ title: '리드나우 수집기', text: '알라딘 다시 로그인 실패 — 수집을 멈췄습니다. 로그인 후 이어하기' }); } catch (e) {} throw new Error(`알라딘 다시 로그인을 ${SET.maxLoginTries ?? 6}번 시도했지만 실패해 멈췄습니다 (진행 위치 저장) — 로그인이 풀렸습니다. 알라딘에 로그인한 뒤 이어하기`); }
      if (loginTries > 1) { ui('자동 로그인 재시도 대기', 0, 0, `${SET.loginRetrySec}초 뒤 다시 시도`); await sleep(SET.loginRetrySec * 1000); }
      PACE.fail('login'); await autoRelogin(fu, loginTries); },
    fatal: (e) => e.message === '멈춤' || /로그인이 풀렸/.test(e.message) || !!e.hidden,
    maxOutageMin: () => MAX_OUTAGE_MIN, outageError: (m) => new Error(`알라딘 서버가 ${m}분 넘게 응답하지 않아 멈췄습니다. 나중에 같은 버튼으로 이어하세요`),
    on429: (st) => { log(`알라딘이 요청이 너무 많다고 함(${st}) — 이 PC의 모든 수집이 ${Math.round(PACE.cooling() / 60000)}분 쉬고, 간격을 ${PACE.state().gap}ms로 늘림`, 1); ui('알라딘 요청 제한(429) — 쉬는 중', 0, 0, `${Math.round(PACE.cooling() / 1000)}초 뒤 느린 속도로 이어감`); if (lockHeld && LREF === LOCKP) { const cu = Date.now() + Math.max(60e3, PACE.cooling()); PUB_COOL = cu; LOCKP().set({ coolUntil: cu, coolBy: PC_NAME, coolAt: nowIso() }, { merge: true }).catch(() => {}); log(`🌐 같은 인터넷 주소의 공개 읽기 줄 PC 모두 ${Math.round((cu - Date.now()) / 60000)}분 함께 쉼 — 로그인 줄(주문·출고)은 그대로`, 1); } },
    onRecover: () => log('서버 연결 회복, 계속합니다'),
    onRetry: (e, w) => (window.__rnUiAt = Date.now(), log(`요청 실패(${e.name === 'AbortError' ? '응답 시간 초과' : e.message}). ${w}초 뒤 재시도`, 1)) });
  /* (1.69.0) 🔀 섞어 읽기(로거) — 맡긴 시장 지표·사진 가격 읽기 사이사이에 '다른 책' 화면을 끼워 읽음: 이 익명 방문자가 보는 책이 우리 책·우리 주문 책만으로 모이지 않게
   *  다른 책 = 지금까지 읽은 공개 화면에 걸린 책 링크(함께 산 책·같은 분야·중고매장 첫 화면 등)에서 무작위 · 읽은 결과는 쓰지 않음(데이터만 조금) · 테더링 확인·몫·속도 조절은 그대로 따름 */
  const MIXP = []; const MIXS = new Set(); const MIX = { n: 0, at: null, saved: 0, fail: 0 };
  /* (1.72.1) 로그인 없이 못 보는(19금) 책 기억 — 이 PC(GM) · 14일 */ let AGM = null; const agm = () => { if (!AGM) { try { AGM = GM_getValue('rn-anon-gate', {}) || {}; } catch (e) { AGM = {}; } } return AGM; };
  const anonGateGet = (k) => { const m = agm(); return !!m[k] && Date.now() - m[k] < 14 * 864e5; };
  /* (1.72.3) 🔁 로거가 못 한 일 대기열(prd_handoff/{표}) — 로거가 제약(로그인 금지) 때문에 못 한 일을 남기면 로그인한 사무실 PC가 받아 함(기본 켬 · 다른 칸보다 먼저) */
  const handoffPut = (x) => { try { C('prd_handoff').doc(String(x.tag).replace(/[\/#$\[\]]/g, '_')).set({ ...x, status: 'todo', by: PC_NAME, at: nowIso(), n: firebase.firestore.FieldValue.increment(1), ...W() }, { merge: true }).catch(() => {}); } catch (e) {} };
  const anonGateSet = (k) => { try { const m = agm(); m[k] = Date.now(); const ks = Object.keys(m); if (ks.length > 3000) ks.sort((a, b) => m[a] - m[b]).slice(0, ks.length - 3000).forEach((x) => delete m[x]); GM_setValue('rn-anon-gate', m); } catch (e) {} };
  function mixHarvest(doc) { try { const L = [...doc.querySelectorAll('a[href*="wproduct.aspx?ItemId="]')].map((a) => (String(a.getAttribute('href') || '').match(/ItemId=(\d{5,})/i) || [])[1]).filter(Boolean); for (const id of L.sort(() => Math.random() - 0.5).slice(0, 12)) { if (MIXS.has(id)) continue; MIXS.add(id); MIXP.push(id); if (MIXP.length > 400) MIXS.delete(MIXP.shift()); } } catch (e) {} }
  /* (1.72.1) 🔀 섞어 읽은 다른 책도 버리지 않고 모음 — 끝없는 탐색 수집과 같은 정보(새상품 화면의 도서 정보·사진·분야·평점 + 온라인 중고 시장 지표)를 저장(prd_books에 탐색 표시 · 나중에 그 책이 우리 재고로 들어오면 같은 도서 기록을 그대로 씀)
   *  다른 책 = 먼저 탐색 대기열(prd_explore — 우리 책들의 함께 산 책·함께 클릭한 책에서 넓혀 간 책) 중 아직 안 본 것, 없으면 지금까지 읽은 화면에 걸린 책 링크 · 우리 재고 책이면 건너뜀(섞는 뜻이 없음)
   *  섞어 읽은 책은 대기열에 mixAt만 적음 — 탐색 수집이 나중에 구매자 분포·함께 산 책을 채우고 더 넓혀 감(그때는 이미 있는 책이라 도서 화면을 다시 읽지 않음) */
  let MIXQ = [], MIXQ_AT = 0, OURB = null, OURB_N = -1;
  const mixRate = () => { const v = +(SET.mixMarket ?? 0.3); return Number.isFinite(v) ? Math.max(0, Math.min(0.5, v)) : 0.3; };
  const ourBook = (bid) => { if (!bid || !LISTINGS) return false; if (!OURB || OURB_N !== LISTINGS.size) { OURB = new Set(); for (const l of LISTINGS.values()) if (l && l.bookId) OURB.add(l.bookId); OURB_N = LISTINGS.size; } return OURB.has(bid); };
  async function mixPick() { if (!MIXQ.length && Date.now() - MIXQ_AT > 10 * 60e3) { MIXQ_AT = Date.now(); try { const qs = await C('prd_explore').where('status', '==', 'todo').limit(80).get(); MIXQ = qs.docs.filter((d) => d.id !== '_check' && !(d.data() || {}).mixAt).map((d) => ({ id: String(d.data().itemId || d.id), ref: d.ref, title: d.data().title || null, from: d.data().from || null })).sort(() => Math.random() - 0.5); } catch (e) {} }
    if (MIXQ.length) return MIXQ.shift(); if (!MIXP.length) { try { mixHarvest(document); } catch (e) {} } if (!MIXP.length) return null; const id = MIXP.splice(Math.floor(Math.random() * MIXP.length), 1)[0]; MIXS.delete(id); return { id, ref: null, title: null, from: null }; }
  async function mixOne(x) { let bookId = null; try { const idDoc = await C('prd_ids').doc('itemId_' + x.id).get(); if (idDoc.exists) bookId = idDoc.data().bookId || null; } catch (e) {}
    if (bookId && ourBook(bookId)) { if (x.ref) x.ref.set({ mixAt: nowIso(), mixSkip: 'ours' }, { merge: true }).catch(() => {}); return false; }
    try { await refreshOne({ explore: true, listingId: x.id, title: x.title, exploreFrom: x.from || 'mix' }, bookId); MIX.saved++; if (x.ref) x.ref.set({ mixAt: nowIso() }, { merge: true }).catch(() => {}); }
    catch (e) { if (e.message === '멈춤' || e.tgate) throw e; MIX.fail++; if (x.ref) x.ref.set({ mixAt: nowIso(), mixErr: String(e.message || e).slice(0, 120) }, { merge: true }).catch(() => {}); }
    MIX.n++; MIX.at = nowIso(); return true; }
  async function mixRead(n) { if (!PUBONLY) return; for (let k = 0, g = 0; k < (n || 1) && g < 4; g++) { const x = await mixPick(); if (!x) return; if (await mixOne(x)) k++; } }
  const mixMaybe = (p) => (PUBONLY && Math.random() < (p == null ? mixRate() : Math.min(p, mixRate())) ? mixRead(1) : Promise.resolve());
  /* (1.89.17) 3시간 점검 10/21: 알라딘이 '비공개 상태입니다'(상품을 숨김 — 리커버·절판 등)를 주는 책을 '알라딘 화면 같지 않음' 실패로 세고 몇 시간마다 다시 읽었음(HOME 하루 59번) → 비공개로 기록하고 3일 동안 다시 묻지 않음(이 PC 저장) */
  const HID_K = 'rn-alHidden'; const hidKey = (u) => { const m = String(u || '').match(/[?&](?:ISBN|ItemId)=([0-9Xx]+)/i); return m ? m[1].toUpperCase() : null; };
  const hidGet = (u) => { try { const k = hidKey(u); if (!k) return false; const M = GM_getValue(HID_K, {}) || {}; return !!(M[k] && Date.now() - M[k] < 3 * 864e5); } catch (e) { return false; } };
  const hidSet = (u) => { try { const k = hidKey(u); if (!k) return; const M = GM_getValue(HID_K, {}) || {}; M[k] = Date.now(); for (const [x, t] of Object.entries(M)) if (Date.now() - t > 3 * 864e5) delete M[x]; GM_setValue(HID_K, M); } catch (e) {} };
  const hidErr = () => Object.assign(new Error('알라딘에서 비공개된 상품(판매 화면 없음) — 3일 뒤 다시 봄'), { hidden: true });
  async function getDoc(url, opt) { tgateCheck(); if (hidGet(url)) throw hidErr(); if (PUBONLY && !isPubUrl(url)) throw new Error('🛡 로거: 공개 화면이 아닌 알라딘 주소는 읽지 않음 — ' + String(url).slice(0, 80)); /* (1.69.0) 로그인 영역·우리 숍 관리 화면은 로거가 절대 부르지 않음 */ if ((window.__rnForceLogin && !PUBONLY) || !((PUBONLY || pubAnonOn()) && isPubUrl(url))) { const L = await getDocRaw(url, opt); /* (1.72.3) 🔁 로거가 못 한 일(19금) 넘겨받기 중에는 사무실 PC가 로그인 상태로 읽음 */ netAdd((L && L.html || '').length); return L; }
    const A = await getDocRaw(url, { ...(opt || {}), cred: 'omit' }); anonNote(); netAdd((A && A.html || '').length); if (PUBONLY && A && A.doc) mixHarvest(A.doc);
    const viaLogin = async () => { ANON.login = (ANON.login || 0) + 1; const L = await getDocRaw(url, opt); netAdd((L && L.html || '').length); return L; }; /* (1.89.1) 정범님 10/20 '이 PC는 로그인 해도 되잖아' — 로그인할 수 있는 사무실 PC는 19금 등 로그인이 필요한 화면을 그 자리에서 로그인 상태로 다시 읽음(예전: 건너뛰고 며칠 동안 같은 책을 되풀이 실패) · 로거(PUBONLY)만 건너뛰고 사무실 PC로 넘김 */
    if (A.needLogin) { if (!PUBONLY) return viaLogin(); ANON.gate++; throw Object.assign(new Error('로그인 없이는 못 보는 화면(19금 등) — 계정과 떼어 두는 중이라 이 장은 건너뜀'), { needLogin: true }); }
    if (!/알라딘/.test(A.doc.title || '') && !A.doc.querySelector('link[rel="canonical"]')) { const h = String(A.html || '');
      /* (1.72.1) 19금(성인 인증) 상품: 로그인 없이 열면 알라딘이 짧은 '성인 인증·로그인으로 보내는' 화면을 줌(제목에 '알라딘'이 없어 예전엔 '알라딘 화면 같지 않음' 실패로 셈 — 로거에서 매일 수십 권) → 19금 건너뜀으로 셈 */
      if (/wlogin\.aspx|login\.aspx|성인\s*인증|19세\s*(미만|이상)|청소년\s*(유해|이용불가)|adult/i.test(h)) { if (!PUBONLY) return viaLogin(); ANON.gate++; throw Object.assign(new Error('로그인 없이는 못 보는 화면(19금 등) — 계정과 떼어 두는 중이라 이 장은 건너뜀'), { needLogin: true }); }
      if (/비공개\s*상태입니다/.test(h)) { hidSet(url); throw hidErr(); }
      if (!ANON.oddShown || ANON.oddShown < 3) { ANON.oddShown = (ANON.oddShown || 0) + 1; log(`🔎 알라딘 화면 같지 않은 응답(${ANON.oddShown}/3 · 까닭 찾기용) ${String(url).slice(0, 80)} — 앞부분: ${h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}`, 1); }
      throw new Error('로그인 없이 읽은 화면이 알라딘 화면 같지 않음(막힘·오류 화면일 수 있음) — 빈 결과로 쓰지 않음'); }
    if (/wshopitem\.aspx/i.test(url) && /ViewType=Simple/i.test(url) && !A.doc.querySelector('input[name^="chkCart.U"]') && [...A.doc.querySelectorAll('a[href*="ItemId="]')].some((a) => /wproduct\.aspx/i.test(a.getAttribute('href') || ''))) { ANON.view++; throw Object.assign(new Error('로그인 없이 읽은 숍 목록에 장바구니 칸이 없음(보이는 모양이 다름) — 사라진 상품으로 잘못 세지 않게 이 장은 쓰지 않음 · 설정 🔓에서 끄면 예전처럼 로그인으로 읽음'), { anonView: true }); }
    return A; }
  /* ══════════ (1.65.0) 📶 로컬 도우미(테더링 길) 확인 · 데이터 사용량 기록 ══════════
   * 🌐 공개 전용 PC는 '리드나우 공개 수집' 크롬(로컬 도우미를 거침)에서만 알라딘을 읽음 — 도우미가 테더링을 확인했을 때만(막힘 기본)
   *  · 도우미 상태: 30초마다 http://rn.local/status (그 크롬의 요청은 모두 도우미로 가므로 도우미가 답함 · 다른 크롬에서는 답이 없음 → 알라딘 읽기 안 함)
   *  · 한 달 테더링 상한(도우미 설정, 기본 48GB)의 97%를 남은 날로 나눈 것이 '오늘 몫' — 넘으면 내일 0시까지 쉼
   *  · 모든 PC: 알라딘 화면을 읽을 때마다 작업별로 장 수·글자 수를 세어 5분마다 prd_jobs/net_날짜에 더함(웹앱 📶 데이터 사용량) · 공개 전용 PC는 도우미가 잰 실제 바이트(테더링·와이파이·묶음별)도 함께 */
  let HELPER = null, HELPER_AT = 0, TGATE = { ok: !PUBONLY, why: PUBONLY ? '로컬 도우미 확인 전' : '' };
  const helperGet1 = (url, hdr) => new Promise((res) => { try { GM_xmlhttpRequest({ method: 'GET', url, timeout: 8000, anonymous: true, headers: hdr || {}, onload: (r) => { try { res(r.status === 200 ? JSON.parse(r.responseText) : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); } catch (e) { res(null); } });
  const helperGet = async () => (await helperGet1('http://rn.local/status')) || (await helperGet1('http://127.0.0.1:8899/status')); /* (1.66.0) 프록시를 통한 이름이 막히면 도우미에 바로 */
  /* ══════════ (1.70.0) 📷 사진 보관 — 로거 PC(D:\ReadNow\images)에 Firebase 사진을 새것만 받아 둠 ══════════
   *  · 로거의 수집기만 · 알라딘과 무관(Firebase 저장소·사진 칸 → 와이파이) · 6시간마다(켜진 뒤 3분부터) · 이미 있는 파일은 건너뜀(도우미가 이름으로 확인) — 끊겨도 다음에 이어서
   *  · 저장소(img/·pur_photos/·ppt_photos/·disposals/ 등 맨 위 폴더 모두)는 저장소와 같은 길로 · 사진 가격 조회 칸(ppt_photo_data)은 ppt_photo_data/문서.jpg(마지막으로 받은 시각부터)
   *  · 진행은 prd_system/imgMirror(웹앱 ⑪에 보임) */
  const IMGM = { state: 'idle', at: null, endAt: null, list: 0, miss: 0, got: 0, fail: 0, bytes: 0, err: null, cur: null };
  const gmReq = (o) => new Promise((res) => { try { GM_xmlhttpRequest({ ...o, timeout: o.timeout || 90000, onload: (r) => res(r), onerror: () => res(null), ontimeout: () => res(null) }); } catch (e) { res(null); } });
  const IMG_B = 'readnow-3a385.firebasestorage.app'; const HLP = 'http://127.0.0.1:8899';
  const imgRep = (fin) => C('prd_system').doc('imgMirror').set({ ...IMGM, pc: PC_NAME, fin: !!fin, uploadedAt: TS() }, { merge: true }).catch(() => {});
  async function imgMirror(force) {
    if (!PUBONLY || IMGM.state === 'run' || !auth.currentUser) return; const last = GM_getValue('rn-imgm-last', 0); if (!force && Date.now() - last < 6 * 3600e3) return;
    const st0 = await gmReq({ method: 'GET', url: HLP + '/img-stat', anonymous: true, timeout: 20000 }); if (!st0 || st0.status !== 200) { IMGM.err = '도우미(1.4.0 이상)에 사진 보관 길이 없음 — 도우미가 새 판으로 바뀌면 저절로'; return; }
    Object.assign(IMGM, { state: 'run', at: nowIso(), endAt: null, list: 0, miss: 0, got: 0, fail: 0, bytes: 0, err: null, cur: null }); imgRep();
    const tok = async () => 'Firebase ' + (await auth.currentUser.getIdToken()); const J = (r) => { try { return r.response && typeof r.response === 'object' ? r.response : JSON.parse(r.responseText); } catch (e) { return null; } };
    try { let tops = []; { const r = await gmReq({ method: 'GET', url: `https://firebasestorage.googleapis.com/v0/b/${IMG_B}/o?delimiter=${encodeURIComponent('/')}&maxResults=1000`, headers: { Authorization: await tok() } }); const j = r && r.status === 200 ? J(r) : null; tops = (j && j.prefixes) || []; if (!tops.length) tops = ['img/', 'pur_photos/', 'ppt_photos/', 'disposals/']; if (!r || r.status !== 200) IMGM.err = `저장소 맨 위 목록을 못 읽음(${r ? r.status : '연결'}) — 아는 폴더만`; }
      const names = []; for (const p of tops) { let pt = ''; for (let g = 0; g < 1000; g++) { const r = await gmReq({ method: 'GET', url: `https://firebasestorage.googleapis.com/v0/b/${IMG_B}/o?prefix=${encodeURIComponent(p)}&maxResults=1000${pt ? '&pageToken=' + encodeURIComponent(pt) : ''}`, headers: { Authorization: await tok() } }); if (!r || r.status !== 200) { IMGM.err = `${p} 목록을 못 읽음(${r ? r.status : '연결'}) — 저장소 규칙에 목록 읽기 허용이 필요할 수 있음`; break; } const j = J(r) || {}; (j.items || []).forEach((x) => x && x.name && names.push(x.name)); if (!j.nextPageToken) break; pt = j.nextPageToken; } }
      IMGM.list = names.length; const miss = []; for (let k = 0; k < names.length; k += 5000) { const r = await gmReq({ method: 'POST', url: HLP + '/img-have', anonymous: true, headers: { 'X-RN-Img': '1', 'Content-Type': 'application/json' }, data: JSON.stringify({ names: names.slice(k, k + 5000) }) }); const j = r && r.status === 200 ? J(r) : null; if (!j) throw new Error('도우미에 있는 사진을 못 물어봄'); miss.push(...(j.missing || [])); }
      IMGM.miss = miss.length; imgRep();
      const put = async (name, blob) => { const r = await gmReq({ method: 'POST', url: HLP + '/img-put?name=' + encodeURIComponent(name), anonymous: true, headers: { 'X-RN-Img': '1', 'Content-Type': 'application/octet-stream' }, data: blob, timeout: 120000 }); const j = r && r.status === 200 ? J(r) : null; if (!j || !j.ok) throw new Error((j && j.err) || '도우미에 못 씀'); IMGM.got++; IMGM.bytes += blob.size || 0; };
      let ix = 0; const worker = async () => { while (ix < miss.length) { const name = miss[ix++]; IMGM.cur = name; try { const r = await gmReq({ method: 'GET', url: `https://firebasestorage.googleapis.com/v0/b/${IMG_B}/o/${encodeURIComponent(name)}?alt=media`, headers: { Authorization: await tok() }, responseType: 'blob', timeout: 120000 }); if (!r || r.status !== 200 || !r.response) throw new Error('받기 실패 ' + (r ? r.status : '연결')); await put(name, r.response); } catch (e) { IMGM.fail++; if (IMGM.fail <= 5) log(`📷 사진 보관 실패 ${name}: ${e.message}`, 1); } if ((IMGM.got + IMGM.fail) % 200 === 0) imgRep(); } };
      await Promise.all([worker(), worker(), worker(), worker()]);
      /* 사진 가격 조회 칸(Firestore) — 마지막으로 받은 시각(at) 뒤 것만 */ let lastAt = GM_getValue('rn-imgm-ppt', ''); for (let g = 0; g < 500; g++) { let q = C('ppt_photo_data').orderBy('at').limit(100); if (lastAt) q = q.where('at', '>', lastAt); const qs = await q.get(); if (qs.empty) break;
        for (const d of qs.docs) { const v = d.data() || {}; if (v.data) { try { const b64 = String(v.data).replace(/^data:[^,]+,/, ''); const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let t = 0; t < bin.length; t++) u8[t] = bin.charCodeAt(t); await put(`ppt_photo_data/${d.id}.jpg`, new Blob([u8], { type: 'image/jpeg' })); } catch (e) { IMGM.fail++; } } if (v.at) { lastAt = v.at; GM_setValue('rn-imgm-ppt', lastAt); } } if (qs.size < 100) break; }
      GM_setValue('rn-imgm-last', Date.now()); log(`📷 사진 보관: 저장소 ${IMGM.list}개 중 새로 ${IMGM.got}개 받음${IMGM.fail ? ` · 실패 ${IMGM.fail}` : ''} (D:\\ReadNow\\images)`);
    } catch (e) { IMGM.err = e.message; log('📷 사진 보관 멈춤: ' + e.message, 1); } finally { IMGM.state = 'idle'; IMGM.endAt = nowIso(); IMGM.cur = null; imgRep(true); } }
  if (PUBONLY) { setTimeout(() => imgMirror().catch(() => {}), 3 * 60e3); setInterval(() => imgMirror().catch(() => {}), 30 * 60e3); window.__rnImgMirror = (f) => imgMirror(f !== false); }
  function tgateCalc(H) { if (!PUBONLY) return { ok: true, why: '' }; if (aladinLoggedHere()) { if (!window.__rnLoginWarned) { window.__rnLoginWarned = 1; try { window.__rnNote('🛡 이 크롬(리드나우 공개 수집)에 알라딘 로그인이 되어 있습니다 — 로거는 알라딘에 로그인하면 안 됩니다. 알라딘에서 로그아웃하고 이 탭을 새로 고칠 때까지 알라딘 일을 모두 멈춥니다', 'err'); } catch (e) {} } return { ok: false, why: '이 크롬에 알라딘 로그인 흔적(로그아웃 링크) — 로그아웃한 뒤 새로 고침' }; } if (!H || !H.ok) return { ok: false, why: '로컬 도우미가 답하지 않음 — 바탕화면 \'리드나우 공개 수집\' 크롬으로 열었는지, 도우미가 켜져 있는지(http://127.0.0.1:8899)' };
    if (!H.tether || !H.tether.ok) return { ok: false, why: '테더링 확인 안 됨 — ' + ((H.tether && H.tether.why) || '') }; if (H.capped) return { ok: false, why: `이번 달 테더링 상한(${H.capGB}GB) 도달 — 다음 달까지 알라딘 일을 쉼` };
    return { ok: true, why: '' }; } /* (1.67.0) 하루 몫은 이제 부류(주요/일반)마다 — 아래 BUD(⏰ 공용 파일 AS.budget) · 여기는 테더링 확인·한 달 상한만 */
  /* ══ (1.67.0) 📶 로거 테더링 몫 — 주요/일반 (이월 포함) ══
   *  BUD = AS.budget(⏰ 설정, 도우미 상태) — 한 달 상한에서 일반 몫(기본 18GB)을 뺀 나머지가 주요 · 날마다 쌓이고 안 쓴 몫은 이월
   *  재기: 알라딘 화면을 읽을 때마다 그 일의 부류(⏰ 칸의 주요/일반 · 칸이 없으면 주요)로 글자 수를 모아 30초마다 도우미에 알림(/meter) → 도우미가 실제 테더링 바이트를 그 몫대로 나눠 셈
   *  지키기: ⏰ 칸은 몫이 없으면 그 회차 건너뜀(공용 파일) · 하는 중인 일은 몫이 떨어지면 저장하고 멈춤(다음에 그 자리부터) · 하루 몫의 10%를 넘겨 계속 읽으려 하면 읽기 자체를 막음 */
  let BUD = null, BUD_STOP = null; const METC = { main: 0, gen: 0 }; const METJ = {}; /* (1.75.0) 일별 글자 — 도우미가 실제 테더링 바이트를 일별로 나눔(🎯 벤치마킹 사용량) */
  const tierOfKey = (k) => { const j = 'prd:' + String(k || '').replace(/^job:/, '').split('#')[0]; const jj = { 'prd:benchForce': 'prd:bench', 'prd:benchHelp': 'prd:bench', 'prd:benchDetail': 'prd:bench' }[j] || j; try { const L = AS && SCHED ? AS.slotsOf(SCHED) : []; const s0 = L.find((x) => x.job === j) || L.find((x) => x.job === jj); return s0 && s0.tier === 'gen' ? 'gen' : 'main'; } catch (e) { return 'main'; } };
  const budLeft = (k) => (BUD ? BUD.left[tierOfKey(k)] : Infinity);
  const helperVerOk = (v) => { const n = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); return HELPER && n(HELPER.ver) >= n(v); };
  const extLoggerOk = () => PUBONLY && helperVerOk('1.6.0') && (!AS || !SCHED || AS.budgetOf(SCHED).extIdle); /* (1.73.1) 도우미 1.6.0 전에는 예스24·중고닷 등이 테더링으로 나가므로 로거는 외부 정보를 하지 않음(도우미가 1시간 안에 스스로 업데이트) */ /* (1.68.0) 로거도 외부 정보를 늘 함께(와이파이 · 알라딘과 무관 — 테더링 일과 동시에 돌아도 서로 막지 않음) */
  /* (1.68.0) 🛡 로거 크롬에 알라딘 로그인 흔적(이 탭 화면의 로그아웃 링크)이 보이면 모든 알라딘 일을 멈춤 — 로거와 북스킹 계정이 이어지는 가장 큰 위험 */
  const aladinLoggedHere = () => { if (!PUBONLY) return false; try { return [...document.querySelectorAll('a[href]')].some((a) => /logout/i.test(a.getAttribute('href') || '') && !(a.closest && a.closest('[id^="rn"], .rncard'))); } catch (e) { return false; } };
  const jobKeyOf = (k) => { const j = String(k || '').replace(/^job:/, '').split('#')[0]; return ({ benchForce: 'bench', benchHelp: 'bench', benchDetail: 'bench' }[j] || j).replace(/[^A-Za-z0-9_]/g, '').slice(0, 30) || 'etc'; };
  const meterSend = () => { const m = Math.round(METC.main), g0 = Math.round(METC.gen); if (!(m + g0)) return; METC.main = 0; METC.gen = 0; const J = { ...METJ }; for (const k of Object.keys(METJ)) delete METJ[k]; const js = Object.entries(J).map(([k, v]) => `${k}:${Math.round(v)}`).join(','); helperGet1(`http://127.0.0.1:8899/meter?main=${m}&gen=${g0}&jobs=${encodeURIComponent(js)}`, { 'X-RN-Meter': '1' }) /* (1.78.3 자동 점검) 도우미 1.6.7은 이 머리가 있어야 받음 — 웹 페이지(알라딘 화면 등)가 몫 나눔을 흐트러뜨리지 못하게 */.then((r) => { if (!r) { METC.main += m; METC.gen += g0; for (const [k, v] of Object.entries(J)) METJ[k] = (METJ[k] || 0) + v; } }); };
  /* (1.75.0) 📱 도우미 화면에 통신사 기준 남은 양·오늘 몫을 보여 주게 계산 결과를 알림(표시만) */
  const budSend = (b) => { try { if (!b || !b.base) return; const st = b.strict || {}; const d = { E: Math.round(b.base.E * 0.97), usedS: Math.round(b.base.usedS), remainGB: b.base.remainGB, baseAt: b.base.at ? new Date(Date.parse(b.base.at) + 9 * 3600e3).toISOString().slice(5, 16).replace('-', '/').replace('T', ' ') : b.base.day, share: Math.round(st.share || b.dayB || 0), nLeft: st.nLeft || 0, ml: Math.round(Math.max(0, b.left.main)), gl: Math.round(Math.max(0, b.left.gen)), pct: st.pct || 50, over: !!st.over }; helperGet1('http://127.0.0.1:8899/bud?d=' + encodeURIComponent(JSON.stringify(d)), { 'X-RN-Meter': '1' }); } catch (e) {} };
  function budTick(H) { if (!PUBONLY || !AS || !AS.budget || !H || !H.ok) { BUD = null; return; } const b = AS.budget(SCHED || {}, H, Date.now()); const was = BUD; BUD = b; if (!b) return; budSend(b);
    if (b.strict && was && was.strict && was.strict.room > 0 && !(b.strict.room > 0)) log(`📏 오늘 테더링이 하루 몫 ${(b.strict.share / 1073741824).toFixed(2)}GB에 닿음(기타 포함 ${(b.strict.used / 1073741824).toFixed(2)}GB) — 테더링 쓰는 일을 모두 저장하고 멈춤 · 내일 0시에 새 몫(남은 양 ÷ 남은 날) · 그동안은 ✨ 쉴 때 하는 일(테더링 없음 — 외부 조회)`, 1); /* (1.74.0) */
    for (const k of ['main', 'gen']) if (was && was.left[k] > 0 && !(b.left[k] > 0)) log(`📶 오늘 ${AS.TIER[k].l} 업무 몫(이월 포함)을 다 씀 — ${AS.TIER[k].l} 칸은 내일(새 몫이 쌓이면)까지 건너뜀${k === 'main' ? ' · 일반 업무가 제 몫으로 이어 함' : ''}`, 1);
    if (running && isPubKey(running) && !(budLeft(running) > 0) && BUD_STOP !== running) { BUD_STOP = running; log(`📶 '${(JOBS[running] || [running])[0]}': 오늘 ${AS.TIER[tierOfKey(running)].l} 몫을 다 써 지금 항목까지 저장하고 멈춤 — 다음에 그 자리부터`, 1); try { window.__rnPrd.pause(); } catch (e) {} }
    if (!running) BUD_STOP = null; }
  async function helperTick() { meterSend(); const H = await helperGet(); HELPER = H; HELPER_AT = Date.now(); budTick(H); const g = tgateCalc(H); if (g.ok !== TGATE.ok || (!g.ok && g.why !== TGATE.why)) if (g.ok && !PUBPC.since) { try { saveSet({ pubPcSince: nowIso(), pubPcName: PC_NAME }); log('🌐 공개 전용 PC 등록 — 이제 사무실 PC는 대량 공개 일(벤치마킹·시장 지표 등)을 하지 않음'); } catch (e) {} } const ipNow = H && H.tether ? H.tether.ip : '?'; /* (1.72.1) 30초마다 같은 줄을 적던 것(하루 수천 줄) → 상태·공인 IP가 바뀔 때와 1시간에 한 번만 */
    if (g.ok !== TGATE.ok || g.why !== TGATE.why || ipNow !== helperTick.ip || Date.now() - (helperTick.at || 0) > 3600e3) { helperTick.ip = ipNow; helperTick.at = Date.now(); log(g.ok ? `📶 테더링 확인됨 — 알라딘 일을 함 (공인 IP ${ipNow}${BUD ? ` · 오늘 남은 몫 주요 ${(Math.max(0, BUD.left.main) / 1073741824).toFixed(2)}GB · 일반 ${(Math.max(0, BUD.left.gen) / 1073741824).toFixed(2)}GB${BUD.base ? ` · 통신사 기준 이번 달 남은 ${(Math.max(0, BUD.monthLeft) / 1073741824).toFixed(1)}GB` : ''}` : ''})` : `🛡 알라딘 일을 멈춤 — ${g.why}`, !g.ok); } TGATE = g; }
  if (PUBONLY) { setTimeout(helperTick, 1500); setInterval(helperTick, 30000); }
  const tgateCheck = () => { if (PUBONLY && !TGATE.ok) throw Object.assign(new Error('🛡 ' + TGATE.why), { tgate: true }); if (PUBONLY && BUD) { const k = netJob(); if (isPubKey(k)) { const t = tierOfKey(k); if (BUD.left[t] < -0.1 * BUD.perDay[t]) throw Object.assign(new Error(`📶 오늘 ${AS.TIER[t].l} 몫을 다 씀 — 읽지 않음`), { tgate: true, bud: true }); } } };
  window.__rnTgate = () => ({ ...TGATE, helper: HELPER, at: HELPER_AT });
  const NETM = { jobs: {}, n: 0 }; const netJob = () => String(curKey || (curStage ? (STAGE_JOB[curStage] || curStage) : '') || 'etc').replace(/[.\/#$\[\]]/g, '_').slice(0, 40);
  const netAdd = (chars) => { const k = netJob(); const J = (NETM.jobs[k] = NETM.jobs[k] || { pages: 0, chars: 0 }); J.pages++; J.chars += chars || 0; NETM.n++; if (PUBONLY && isPubKey(k)) { const w = Math.max(2000, chars || 0); METC[tierOfKey(k)] += w; const jk = jobKeyOf(k); METJ[jk] = (METJ[jk] || 0) + w; } /* (1.67.0) 부류별 글자 — 도우미가 실제 바이트를 이 몫대로 나눔(숨은 창은 글자 수를 몰라 한 장 2천 자로 셈) */ };
  async function netFlush() { if (!auth.currentUser || !PC_NAME) return; const J = NETM.jobs; const keys = Object.keys(J); const H = PUBONLY ? HELPER : null; if (!keys.length && !H) return; NETM.jobs = {};
    const inc = firebase.firestore.FieldValue.increment; const jobs = {}; keys.forEach((k) => (jobs[k] = { pages: inc(J[k].pages), chars: inc(J[k].chars) }));
    const dayK = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const pc = { jobs, route: PUBONLY ? 'tether' : 'office', at: nowIso(), ver: VER };
    if (H && H.today && H.today.key === dayK) pc.helper = { tether: H.today.tether, wifi: H.today.wifi, groups: H.today.groups, blocked: H.today.blocked, month: H.month, todayTiers: H.today.tiers || null, todayJobs: H.today.jobs || null, /* (1.75.0) 일별 실제 테더링(벤치마킹 등) */ capGB: H.capGB, capBytes: H.capBytes || null, ok: true, tetherOk: !!(H.tether && H.tether.ok), tetherIp: H.tether ? H.tether.ip : null, tetherIface: H.tether ? H.tether.iface || null : null, tetherDesc: H.tether ? H.tether.desc || null : null, wifiIface: H.wifi ? H.wifi.iface || null : null, wifiSsid: H.wifi ? H.wifi.ssid || null : null, /* (1.68.1 · 도우미 1.2.0) 어느 연결로 나가는지 이름까지 */ why: H.tether ? H.tether.why : null, ver: H.ver, at: H.at, defaultWarn: H.defaultWarn || null, phone: H.tether ? H.tether.phoneName || null : null, phones: Array.isArray(H.phones) ? H.phones.map((p) => ({ id: p.id != null ? String(p.id) : null, name: p.name, capGB: p.capGB, used: p.used, active: !!p.active, off: !!p.off, connected: !!p.connected })) : null, days: H.days && H.month ? Object.fromEntries(Object.entries(H.days).filter(([k]) => String(k).slice(0, 7) === H.month.key).map(([k, v]) => [k, { tether: +(v && v.tether) || 0 }])) : null }; /* (1.72.0) 📱📱 휴대폰별 · (1.72.1) 휴대폰 id·이달 날마다 테더링(통신사 기준 남은 양 셈에 씀) */
    try { await C('prd_jobs').doc('net_' + dayK).set({ day: dayK, pcs: { [PC_NAME]: pc }, ...W() }, { merge: true }); } catch (e) { keys.forEach((k) => { const o = (NETM.jobs[k] = NETM.jobs[k] || { pages: 0, chars: 0 }); o.pages += J[k].pages; o.chars += J[k].chars; }); } }
  setInterval(netFlush, 5 * 60e3); addEventListener('beforeunload', () => { try { netFlush(); } catch (e) {} });
  /* ══ (1.79.0) 📊 수집 분석 기록 — 정범님 10/18 '하루에 PC마다·분류마다 몇 가지를 성공·실패·부분으로 모았나, 부분은 어떻게 마저 모으나'
   *  window.__rnCS.add(분류, 결과, 수, 까닭) → 2분마다 prd_jobs/cs_{한국 날짜}.pcs.{PC}.c.{분류}.{결과} += 수 · 실패·부분·건너뜀의 까닭은 .w.{분류}.{까닭} += 1(숫자는 #로 묶어 같은 까닭끼리)
   *  결과: ok(성공) · fail(실패) · part(부분 — 다음에 이어서) · none(어디에도 없음) · skip(건너뜀 — 멈춤·19금·이미 있음) · n(모은 항목 수) · p(읽은 쪽) · b(바이트) · ms(걸린 시간)
   *  웹앱 관리 도구 → 📊 수집 분석이 이 기록과 예전 기록(작업 회차 jobStats·autoSched · 쪽 수 net_ · 외부 출처 ext_run · 벤치마킹 bench_days)을 함께 보여 줌 */
  const CSB = { c: {}, w: {}, n: 0 }; const csKey = (x) => String(x || '?').replace(/[.\/#$\[\]~*`]/g, '_').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 60) || '?';
  window.__rnCS = { add(cat, kind, n, why) { try { if (!cat || !kind) return; const c = csKey(cat).replace(/#/g, '0'); const o = (CSB.c[c] = CSB.c[c] || {}); o[kind] = (o[kind] || 0) + (n == null ? 1 : +n || 0); CSB.n++; if (why && ['fail', 'part', 'none', 'skip'].includes(kind)) { const w = (CSB.w[c] = CSB.w[c] || {}); const k = kind + ': ' + csKey(why); w[k] = (w[k] || 0) + 1; } } catch (e) {} }, peek: () => JSON.parse(JSON.stringify(CSB)) };
  async function csFlush() { if (!auth.currentUser || !PC_NAME || !CSB.n) return; const C0 = CSB.c, W0 = CSB.w; CSB.c = {}; CSB.w = {}; CSB.n = 0; const inc = firebase.firestore.FieldValue.increment; const c = {}, w = {};
    for (const [k, o] of Object.entries(C0)) { c[k] = {}; for (const [kk, v] of Object.entries(o)) c[k][kk] = inc(v); } for (const [k, o] of Object.entries(W0)) { w[k] = {}; for (const [kk, v] of Object.entries(o)) w[k][kk] = inc(v); }
    const dayK = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); try { await C('prd_jobs').doc('cs_' + dayK).set({ day: dayK, pcs: { [PC_NAME]: { c, w, at: nowIso(), ver: VER, pub: !!PUBONLY } }, ...W() }, { merge: true }); } catch (e) { for (const [k, o] of Object.entries(C0)) for (const [kk, v] of Object.entries(o)) { const t = (CSB.c[k] = CSB.c[k] || {}); t[kk] = (t[kk] || 0) + v; CSB.n++; } } }
  setInterval(csFlush, 120e3); addEventListener('beforeunload', () => { try { csFlush(); } catch (e) {} });
  window.__rnPub = { diag: () => ({ pubOnly: PUBONLY, anonOn: pubAnonOn(), ...ANON, tgate: TGATE, bud: BUD ? { left: BUD.left, used: BUD.used, free: BUD.free, alert: BUD.alert, B: BUD.B, mk: BUD.mk } : null, metc: { ...METC }, extOk: extLoggerOk(), img: { ...IMGM }, mix: { ...MIX, pool: MIXP.length }, net: JSON.parse(JSON.stringify(NETM.jobs)) }), read: (u) => getDoc(u), flush: () => netFlush() }; /* (1.64.0) 🔓 상태 보기(관제판·시험용) */
  /* ══════════ (1.54.0) 🔓 공개 페이지는 로그인 쿠키 없이 — 판매자 계정(북스킹)과 대량 읽기를 떼어 놓음 ══════════
   * 대상(양이 많은 공개 페이지 4종): used 온라인 중고 목록(시장 지표) · prod 상품 페이지(우리 책·벤치마킹 상품 정보) · shop 판매자 숍 목록(벤치마킹) · item 경쟁 매물 페이지(유의사항·사진)
   * 샵매니저·주문·출고·검색 등 나머지는 예전처럼 로그인 상태.
   * 빠뜨리지 않는 법 (있는 것만 보지 않음 — 로그인 읽기와 '똑같은지' 직접 대조):
   *  ① 종류마다 처음 읽을 때, 그리고 300번마다·6시간마다 같은 주소를 로그인 상태와 로그인 없이 둘 다 읽어 '읽어 낸 결과 전체'(파서 결과 JSON)를 견줌
   *     → 똑같을 때만 그 종류를 로그인 없이 읽음. 하나라도 다르면 그 종류는 로그인 상태로 계속 읽고 다른 칸 이름을 기록에 남김(다음 확인 때 다시 봄)
   *     → 두 번 읽는 사이 판매자가 값을 바꿔 달라진 경우를 가리려고: 다르면 로그인으로 한 번 더 읽어, 로그인끼리도 다르면 '판단 보류'(로그인 유지)
   *     예) 숍 목록이 로그인 없이는 '간단히 보기'가 아니거나 장바구니 칸(상품 코드)이 없으면 결과가 달라져 → 로그인 유지
   *  ② 로그인 없이 읽는 중에도 한 장마다: 로그인·성인 인증 화면으로 가면(19금 책) 그 장만 로그인 상태로 다시 · 내용이 비어 보이면(상품 이름·매물·숍 상품이 없음) 그 장만 로그인 상태로 다시
   *  ③ 500장마다 기록: 로그인 없이 몇 장 · 19금 등으로 로그인 다시 몇 장 · 비어 보여 다시 몇 장 · 종류별 지금 방식 */
  const PUB = (() => { const KN = { used: '온라인 중고 목록', prod: '상품 페이지', shop: '판매자 숍 목록', item: '경쟁 매물 페이지' }; const RE_N = 300, RE_MS = 6 * 3600e3;
    const st = {}; Object.keys(KN).forEach((k) => (st[k] = { mode: 'check', n: 0, at: 0, anon: 0, logged: 0, gate: 0, miss: 0, last: '' })); let tot = 0;
    const J = (f, g) => { try { return JSON.stringify(f(g)); } catch (e) { return 'ERR ' + e.message; } };
    const diffKeys = (a, b) => { try { const A = JSON.parse(a), B = JSON.parse(b); const ks = new Set(); const walk = (x, y, pth) => { if (JSON.stringify(x) === JSON.stringify(y)) return; if (x && y && typeof x === 'object' && typeof y === 'object' && ks.size < 8) { const kk = new Set([...Object.keys(x), ...Object.keys(y)]); kk.forEach((k) => walk(x[k], y[k], pth ? pth + '.' + k : k)); } else ks.add(pth || '(전체)'); }; walk(A, B, ''); return [...ks].slice(0, 8).join(', '); } catch (e) { return '?'; } };
    const report = () => { if (++tot % 500) return; log('🔓 공개 페이지 로그인 없이 읽기 — ' + Object.entries(st).map(([k, s]) => `${KN[k]}: ${s.mode === 'anon' ? '로그인 없이' : s.mode === 'logged' ? '로그인 유지' : '확인 전'} (없이 ${s.anon} · 로그인 ${s.logged}${s.gate ? ` · 19금 등 로그인 다시 ${s.gate}` : ''}${s.miss ? ` · 비어 보여 로그인 다시 ${s.miss}` : ''})`).join(' / ')); };
    async function read(kind, url, norm, valid) { const s = st[kind]; s.n++; if (pubAnonOn()) { s.mode = 'anon'; s.anon++; return getDoc(url); } /* (1.64.0) 늘 로그인 없이 — 대조용 로그인 읽기도 하지 않음 */ report();
      const due = s.mode === 'check' || s.n >= RE_N || Date.now() - s.at > RE_MS;
      if (due) { const L = await getDoc(url); if (!valid(L)) { s.logged++; return L; } // 비교할 거리가 없는 장(빈 쪽·19금 등) — 판단은 다음 장에서
        let A = null; try { A = await getDoc(url, { cred: 'omit' }); } catch (e) { if (e.message === '멈춤') throw e; }
        const jl = J(norm, L), ja = A && !A.needLogin ? J(norm, A) : null; s.n = 0; s.at = Date.now();
        if (ja !== null && ja === jl) { if (s.mode !== 'anon') log(`🔓 ${KN[kind]}: 로그인 없이 읽어도 읽어 낸 내용이 로그인 때와 똑같음을 확인 → 로그인 없이 읽음 (300장·6시간마다 다시 대조)`); s.mode = 'anon'; s.logged++; return L; }
        let why = ja === null ? (A && A.needLogin ? '로그인 화면으로 감' : '로그인 없이 읽기 실패') : diffKeys(jl, ja);
        if (ja !== null) { const L2 = await getDoc(url); if (J(norm, L2) !== jl) { if (s.last !== '대조 중 바뀜') log(`🔓 ${KN[kind]}: 대조하는 사이 내용이 바뀜(판매자가 고침 등) — 판단 보류, 다음 대조(300장·6시간 뒤)까지 로그인 상태 유지`); s.mode = 'logged'; s.last = '대조 중 바뀜'; s.logged++; return L2; } }
        if (s.mode !== 'logged' || s.last !== why) log(`🔒 ${KN[kind]}: 로그인 없이 읽으면 결과가 다름(${why}) → 이 종류는 로그인 상태로 읽음 (빠뜨리지 않게 · ${RE_MS / 3600e3}시간 또는 ${RE_N}장 뒤 다시 대조)`, 1);
        s.mode = 'logged'; s.last = why; s.logged++; return L; }
      if (s.mode !== 'anon') { s.logged++; return getDoc(url); }
      const A = await getDoc(url, { cred: 'omit' });
      if (A.needLogin) { s.gate++; s.logged++; return getDoc(url); } // 19금 등 — 그 장만 로그인 상태로
      if (!valid(A)) { s.miss++; s.logged++; return getDoc(url); } // 비어 보임 — 그 장만 로그인 상태로 (진짜 비었으면 로그인도 같음)
      s.anon++; return A; }
    return { read, st }; })();
  /* 종류별 '읽어 낸 내용'(대조용)과 '비어 보이지 않음' 기준 — 실제 저장에 쓰는 같은 파서 */
  const pubUsed = (url) => PUB.read('used', url, (g) => P.parseUsedPage(g.doc), (g) => { const u = P.parseUsedPage(g.doc); return !!(u && u.listings && u.listings.length); });
  const pubProd = (url) => PUB.read('prod', url, (g) => P.parseProductPage(g.doc, g.finalUrl), (g) => { const pg = P.parseProductPage(g.doc, g.finalUrl); return !!(pg && pg.title); });
  const pubItem = (url) => PUB.read('item', url, (g) => P.parseUsedItemInfo(g.doc, null), (g) => { const i = P.parseUsedItemInfo(g.doc, null); return !!(i && i.found); });

  async function isLoggedIn() { try { const r = await fetch('/scm/wmain.aspx', { credentials: 'include' }); const h = await r.text(); return r.ok && /wC2Cuser_logout/.test(h); } catch (e) { return false; } }
  async function autoRelogin(loginUrl, tryNo) { if (PUBONLY) throw new Error('🛡 로거는 알라딘에 로그인하지 않음 — 로그인이 필요한 화면은 건너뜀'); /* (1.69.0) */
    if (PUBONLY) throw new Error('🌐 공개 전용 PC — 알라딘에 로그인하지 않음');
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') { ui(`네이버로 다시 로그인 중 (${tryNo}번째)`, 0, 0); const ok = await window.__rnNaverLogin({ isLoggedIn, log: (m, lv) => log(m, !!lv), stopped: () => stopFlag, ret: 'https://www.aladin.co.kr/scm/wmain.aspx' }); try { renderCred(); } catch (e) {} if (!ok && tryNo >= 2) throw new Error('네이버로 다시 로그인하지 못했습니다. 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)한 뒤 같은 버튼을 다시 누르세요'); return ok; }
    const cred = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
    if (!cred || !cred.id || !cred.pw) throw new Error('알라딘 로그인이 풀렸습니다. 설정에 아이디·비밀번호를 넣으면 다음부터 자동으로 다시 로그인합니다. 지금은 직접 로그인한 뒤 같은 버튼을 누르세요');
    log(tryNo > 1 ? `자동 로그인 ${tryNo}번째 시도` : '로그인이 풀려 자동으로 다시 로그인합니다', 1); ui(`자동 로그인 중 (${tryNo}번째)`, 0, 0);
    const url = /login/i.test(loginUrl) ? loginUrl : 'https://www.aladin.co.kr/login/wlogin.aspx?returnurl=' + encodeURIComponent('https://www.aladin.co.kr/scm/wmain.aspx');
    GM_setValue(LOGIN_FLAG, { at: Date.now() });
    const tab = GM_openInTab(url, { active: false, insert: true });
    let ok = false;
    for (let i = 0; i < 18; i++) { await sleep(5000); if (stopFlag) break; const f = GM_getValue(LOGIN_FLAG, {}); if (f.result === 'failed' || f.result === 'no-id-field') break; if (await isLoggedIn()) { ok = true; break; } }
    await window.__rnCloseTab(tab);
    GM_deleteValue(LOGIN_FLAG);
    GM_setValue(ok ? 'rnp-cred-okAt' : 'rnp-cred-failAt', Date.now()); try { renderCred(); } catch (e) {}
    log(ok ? '다시 로그인했습니다. 계속합니다' : '자동 로그인이 이번에는 되지 않았습니다', !ok);
    if (!ok) try { GM_notification({ title: '리드나우 상품 수집기', text: '알라딘 자동 로그인 실패. 재시도합니다' }); } catch (e) {}
    return ok;
  }

  /* ───────── 새상품 페이지를 숨은 창(iframe)으로 열기 ─────────
   * 구매자 분포·함께 구매는 페이지가 열린 뒤 알라딘 스크립트가 따로 불러온다. 주소를 몰라도,
   * 같은 사이트 창을 실제로 열어 그 부분이 채워질 때까지 기다렸다가 읽으면 된다. */
  let frame = null;
  function loadInFrame(url, readyCheck) { if (globalThis.__rnEngine) { if (!window.__rnEngFrameNote) { window.__rnEngFrameNote = 1; log('🧪 로거 엔진: 숨은 창(알라딘 화면이 스스로 불러오는 부분 — 구매자 분포·함께 산 책)은 엔진에서 못 읽어 건너뜀', 1); } return Promise.resolve({ ok: false, doc: null, href: null, ms: 0 }); }
    if (PUBONLY && !TGATE.ok) return Promise.resolve({ ok: false, doc: null, href: null, ms: 0 }); /* (1.65.0) 테더링 확인 전에는 숨은 창도 열지 않음 */ netAdd(0);
    // (1.25.1) 숨은 창 하나에 알라딘 상품 페이지를 수천 번 연달아 열면 그 페이지들의 스크립트·광고가 남아 메모리가 계속 늘어 탭이 'Out of Memory'로 죽음
    //  → 20번마다 숨은 창을 비우고 없앤 뒤 새로 만듦 (다음 페이지를 열기 직전에 — 앞 페이지는 이미 다 읽은 뒤)
    frameLoads++;
    if (frame && frameLoads % 20 === 0) { try { frame.src = 'about:blank'; } catch (e) {} try { frame.remove(); } catch (e) {} frame = null; }
    return new Promise((resolve) => {
      if (frame && (frame.dataset.cl === '1') !== pubAnonOn()) { try { frame.remove(); } catch (e) {} frame = null; } /* (1.64.0) 설정이 바뀌면 숨은 창을 새로 */
      if (frame && frame.dataset.u === String(url).split('#')[0]) { try { frame.remove(); } catch (e) {} frame = null; } /* (1.70.0) 같은 주소를 다시 열 때는 새 창으로(# 뒤만 같으면 다시 읽지 않으므로) */
      if (!frame) { frame = document.createElement('iframe'); if (pubAnonOn()) { frame.setAttribute('credentialless', ''); frame.dataset.cl = '1'; } /* (1.64.0) 🔓 숨은 창도 쿠키 없이(크롬 credentialless) */ frame.style.cssText = 'position:fixed;left:-3000px;top:0;width:1300px;height:2000px;visibility:hidden'; globalThis.__rnMount(frame); } /* (1.70.0) 로거 첫 화면이면 숨은 창도 그림자 칸 안 */
      let done = false; const t0 = Date.now(); let poll = null;
      const finish = (ok) => { if (done) return; done = true; clearInterval(poll); let doc = null, href = null; try { doc = frame.contentDocument; href = frame.contentWindow.location.href; } catch (e) {} resolve({ ok, doc, href, ms: Date.now() - t0 }); };
      frame.dataset.u = String(url).split('#')[0]; frame.src = String(url).split('#')[0] + '#rnCollect'; /* (1.70.0) 표시는 # 뒤로 — 예전 ?rnCollect=1은 알라딘 서버 기록에 남는 낯선 표시였음 */
      poll = setInterval(() => {
        let d = null; try { d = frame.contentDocument; } catch (e) {}
        try { if (d && d.body) frame.contentWindow.scrollTo(0, (d.body.scrollHeight || 0) * ((Date.now() - t0) % 3000 < 1500 ? 0.6 : 1)); } catch (e) {}
        if (d && d.URL !== 'about:blank' && d.readyState !== 'loading' && readyCheck(d)) finish(true);
        else if (Date.now() - t0 > SET.pageTimeoutSec * 1000) finish(false);
      }, 400);
    });
  }
  async function getProductFull(url) {
    await PACE.wait(sleep, 3 * (lockHeld ? laneCount : 1)); // 숨은 창에 상품 페이지 하나를 열면 그림·스크립트까지 수십 번 요청 → 간격 3배
    const r = await loadInFrame(url, (d) => {
      if (!d.querySelector('link[rel="canonical"]')) return false;
      const k = (d.querySelector('input.hd_ISBN') || {}).value; if (!k) return true; // 상품 아닌 화면
      const os = d.getElementById(k + '_OrderStatistics'); const rb = d.getElementById(k + '_RelationBuyItem_V2');
      const filled = (el) => !el || el.children.length > 0 || el.textContent.trim().length > 0;
      return (filled(os) && filled(rb)) || (Object.keys(P.parseBuyerDist(d) || {}).length > 0 && d.querySelector('a[href*="utm_campaign=relbuy"]'));
    });
    if (!r.doc || !r.doc.querySelector('link[rel="canonical"]')) { PACE.fail(r.ok ? 'error' : 'timeout'); return null; } PACE.ok();
    if (r.href && /wuseditemall/i.test(r.href)) log('새상품 페이지가 중고 페이지로 넘어갔습니다. "온라인중고 바로가기" 스크립트가 숨은 창에서도 작동하는지 확인 필요', 1);
    if (looksLoggedOut(r.href || '', r.doc)) return null;
    const p = P.parseProductPage(r.doc, r.href);
    const k = (r.doc.querySelector('input.hd_ISBN') || {}).value;
    const os = k && r.doc.getElementById(k + '_OrderStatistics'); const rb = k && r.doc.getElementById(k + '_RelationBuyItem_V2');
    const bd = os ? P.parseBuyerDist(os) : null; p.buyerDist = bd && Object.keys(bd).length ? bd : (() => { const x = P.parseBuyerDist(r.doc); return x && Object.keys(x).length ? x : null; })();
    p.relationBuy = rb ? P.parseRelationBuy(rb) : []; if (!p.relationBuy.length) p.relationBuy = P.parseRelationBuy(r.doc);
    p.clickRelation = P.parseClickRelation(r.doc); if (!p.clickRelation.length) { const bx = r.doc.getElementById('w_jiny_recentContent'); if (bx && bx.querySelector('a') && bx.textContent.trim().length > 30) p.clickRaw = bx.innerHTML.slice(0, 3000); }
    p.dynamicLoaded = r.ok;
    return { page: p, finalUrl: r.href };
  }

  /* ───────── 공통 쓰기 ───────── */
  async function commitBatches(ops, label) {
    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch(); ops.slice(i, i + 400).forEach((f) => f(b)); await b.commit();
      if (label) ui(label, Math.min(i + 400, ops.length), ops.length, '올리는 중');
    }
  }
  const LISTING_FIELDS = ['title', 'titleRaw', 'condition', 'grade', 'sku', 'publisher', 'status', 'price', 'priceList', 'qty', 'registeredAt', 'listingId', 'isbn13', 'isbn10', 'aladinCode', 'barcode'];
  const ACTIVE = ['판매중', '판매대기', '일시판매중지', '판매중지', '판매금지'];
  let LISTINGS = null; // usedCode → 문서 (한 번 읽고 기기에 보관)
  /* (1.59.0) 상품 기록을 이 PC(IndexedDB)에 두고 다음부턴 바뀐 것(uploadedAt)만 받음 — 기억 정리로 탭을 새로 열 때마다 상품 수만 건을 통째로 다시 읽던 것(하루 수십만 번 읽기). 하루에 한 번은 통째로 다시 읽어 맞춤 · 모든 쓰는 쪽이 uploadedAt을 남김(웹앱도 같은 방식) */
  const LCACHE = globalThis.__rnPubChrome ? { get: async () => { try { return GM_getValue('rn-lcache', null); } catch (e) { return null; } }, put: async (v) => { try { GM_setValue('rn-lcache', JSON.parse(JSON.stringify(v))); } catch (e) {} } } /* (1.71.0) 로거 크롬: 우리 상품 목록 캐시를 알라딘 쪽 IndexedDB가 아니라 Tampermonkey 저장소에 */ : { name: 'rn-listings-cache', open() { return new Promise((res, rej) => { const r = indexedDB.open(this.name, 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async get() { const d = await this.open(); try { return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get('v'); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); } finally { d.close(); } },
    async put(v) { const d = await this.open(); try { await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, 'v'); t.oncomplete = res; t.onerror = () => rej(t.error); }); } finally { d.close(); } } };
  const lcMs = (v) => (v && v.uploadedAt && typeof v.uploadedAt.toMillis === 'function' ? v.uploadedAt.toMillis() : 0);
  const lcRevive = (o) => { for (const k of Object.keys(o)) { const v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.seconds === 'number' && typeof v.nanoseconds === 'number' && Object.keys(v).length === 2) o[k] = new firebase.firestore.Timestamp(v.seconds, v.nanoseconds); } return o; };
  /* ══ (1.76.0) 🧾 주문으로 판매 끝 반영 (정범님 10/16) ══
   *  알라딘 판매관리의 ③ 배송&구매확정전 · ④ 구매확정&정산대기 · ⑤ 정산완료에 있는 주문(= 주문 상태 출고완료/집하 · 집하/수령확인 · 배송완료/정산완료)의 상품은
   *  관리자가 처리하지 않아도 판매 끝(active:false · status 판매완료)으로 — 상품 목록을 다시 훑기 전이라도
   *  ① 주문 줄에 알라딘 중고 상품 코드가 있으면 그 상품(확실) ② 없으면(판매완료 엑셀을 올리기 전 주문) 같은 ISBN의 판매중 상품 중 '주문 전에 마지막으로 본' 것에서 고름:
   *     판매가 같은 것 → 등급 같은 것 → 먼저 등록한 것 순으로 주문 수량만큼 · 이렇게 고른 것은 확실하지 않으므로 상품마다 근거(soldInfer)를 남기고 '불분명 처리건'(prd_unclear)에 쌓음
   *     주문 뒤에도 판매중으로 보인 상품(다른 권·다시 올림)은 건드리지 않음 · 뒤에 상품 전체 확인에서 다시 판매중으로 보이면 그 상품은 저절로 판매중으로 돌아오고 불분명 처리건에 '다시 보임'으로 남음
   *  처음 한 번(u1016)은 8월부터의 주문 전부(코드 없는 줄 589개 포함) · 그 뒤 1시간마다 최근 30일 · 여러 PC가 겹치지 않게 app_settings/sold_infer 표 */
  const SHIPPED_ST = /출고완료|집하|수령확인|배송완료|정산완료|구매확정/; const lineGradeC = (it) => it.condition || ((/\[중고-([^\]]+)\]/.exec(it.rawTitle || it.title || '') || [])[1]) || '';
  const kMsC = (v) => { if (!v) return 0; if (v.toMillis) return v.toMillis(); const s0 = String(v); if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?$/.test(s0)) return Date.parse(s0 + (s0.length === 16 ? ':00' : '') + '+09:00') || 0; if (/^\d{4}-\d\d-\d\d$/.test(s0)) return Date.parse(s0 + 'T00:00:00+09:00') || 0; return Date.parse(s0) || 0; };
  async function soldInfer(force) { if (PUBONLY || !auth.currentUser || (!force && window.__rnRest && window.__rnRest())) return; /* (1.88.6) 쉬는 탭은 하지 않음(상품 2만 5천 건을 탭마다 메모리에 올리던 것) */ const LR = C('app_settings').doc('sold_infer'); let first = false;
    try { let go = false; await db.runTransaction(async (tx) => { go = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const d = (await tx.get(LR)).data() || {}; first = !d.u1016; if (!force && !first && d.at && Date.now() - Date.parse(d.at) < 55 * 60e3) return; if (d.lease && d.lease.pc !== PC_NAME && Date.now() - (+d.lease.ms || 0) < 15 * 60e3) return; tx.set(LR, { lease: { pc: PC_NAME, ms: Date.now() } }, { merge: true }); go = true; }); if (!go) return; } catch (e) { return; }
    const grp = first ? 'u1016' : 'auto_' + nowIso().slice(0, 10); const since = first ? '2026-08-01' : new Date(Date.now() + 9 * 3600e3 - 30 * 864e5).toISOString().slice(0, 10);
    try { await loadListings('inc'); const L = LISTINGS; const byIsbn = new Map(); const took = new Map(); /* (자동 점검 2026-10-16) 이미 어느 상품을 판매 끝으로 고른 주문 줄은 다시 고르지 않음 — 1시간마다 30일 주문을 다시 훑으며 앞에서 고른 상품이 판매완료가 되면 같은 ISBN의 다음 판매중 상품을 또 고르던 것 */ for (const [k, l] of L) { const so = l && l.soldInfer; if (so && so.how === 'isbn' && so.order && so.order.orderId && so.order.isbn) { const tk = so.order.orderId + '|' + so.order.isbn; took.set(tk, (took.get(tk) || 0) + Math.max(1, +l.qty || 1)); } } for (const [k, l] of L) { if (!l || l.active === false || !l.isbn13) continue; (byIsbn.get(l.isbn13) || byIsbn.set(l.isbn13, []).get(l.isbn13)).push(k); }
      const qs = await C('crm_orders').where('orderedAt', '>=', since).get(); const ords = []; qs.forEach((d) => { const o = d.data(); if (o && o.kind === 'sale' && o.platform !== 'cash' && SHIPPED_ST.test(String(o.status || o.stage || ''))) ords.push({ id: d.id, ...o }); }); ords.sort((a, b) => kMsC(a.orderedAt) - kMsC(b.orderedAt));
      const used = new Set(); const certain = [], inferred = [], skipped = []; const FV = firebase.firestore.FieldValue; const at = nowIso();
      for (const o of ords) { const om = kMsC(o.orderedAt); for (const it of o.items || []) { if (it.lineStatus !== 'normal') continue; const q = Math.max(1, +it.qty || 1); const ord = { orderId: o.id, orderNo: o.orderNo || null, orderedAt: o.orderedAt || null, st: o.status || o.stage || null, title: it.title || null, isbn: it.isbn13 || null, price: it.price ?? null, grade: lineGradeC(it) || null, qty: q };
          if (it.aladinUsedCode) { const k = 'aladin_' + it.aladinUsedCode; const l = L.get(k); if (l && l.active !== false && !used.has(k)) { const seen = kMsC(l.lastSeenAt) || kMsC(l.registeredAt); if (seen < om && (+l.qty || 1) <= q) { used.add(k); certain.push({ k, l, ord }); } } continue; }
          if (!it.isbn13) { skipped.push({ ord, why: 'ISBN 없음' }); continue; }
          let cand = (byIsbn.get(it.isbn13) || []).filter((k) => !used.has(k)).map((k) => [k, L.get(k)]).filter(([, l]) => l && l.active !== false);
          const after = cand.filter(([, l]) => (kMsC(l.lastSeenAt) || kMsC(l.registeredAt)) >= om); cand = cand.filter(([, l]) => (kMsC(l.lastSeenAt) || kMsC(l.registeredAt)) < om);
          if (!cand.length) { if (after.length) skipped.push({ ord, why: `같은 ISBN 판매중 ${after.length}개는 주문 뒤에도 판매중으로 보임 — 다른 권으로 보고 그대로 둠`, keep: after.map(([k]) => k) }); continue; }
          const rank = ([, l]) => (ord.price != null && +l.price === +ord.price ? 0 : 2) + (ord.grade && String(l.grade || '') === ord.grade ? 0 : 1);
          const tk0 = o.id + '|' + it.isbn13; const cr = took.get(tk0) || 0; const tookN = Math.min(cr, q); took.set(tk0, cr - tookN); if (tookN >= q) continue; /* 앞 회차에 이 주문 줄로 이미 고른 수만큼 빼고 모자란 만큼만 고름(같은 주문의 같은 ISBN 줄이 둘이면 앞 줄부터 씀) */
          cand.sort((a, b) => rank(a) - rank(b) || kMsC(a[1].registeredAt) - kMsC(b[1].registeredAt)); let need = q - tookN;
          for (const [k, l] of cand) { if (need <= 0) break; used.add(k); need -= Math.max(1, +l.qty || 1); inferred.push({ k, l, ord, n: cand.length, rank: rank([k, l]), why: `주문 줄에 상품 코드가 없어 같은 ISBN 판매중 ${cand.length}개(주문 전에 마지막으로 본 것) 중 ${rank([k, l]) === 0 ? '판매가·등급이 같은' : rank([k, l]) === 1 ? '판매가가 같은' : rank([k, l]) === 2 ? '등급이 같은' : '먼저 등록한'} 것을 고름` }); } } }
      const ops = []; const rec = (x, how) => { const v = { active: false, status: '판매완료', soldInferPrev: { active: x.l.active ?? null, status: x.l.status ?? null, at }, /* (자동 점검 2026-10-16) 알라딘에서 읽은 상태를 덮기 전 값 보관(모은 자료를 덮지 않음) */ soldInfer: { at, by: PC_NAME, how, group: grp, order: x.ord, ...(x.why ? { why: x.why, cand: x.n } : {}) }, soldInferLog: FV.arrayUnion({ at, how, group: grp, orderId: x.ord.orderId }), ...W() }; ops.push((b) => b.set(C('prd_listings').doc(x.k), v, { merge: true }));
        if (how === 'isbn') ops.push((b) => b.set(C('prd_unclear').doc(x.k), { listingId: x.k, group: grp, at, by: PC_NAME, title: x.l.title || null, isbn: x.l.isbn13 || null, grade: x.l.grade || null, price: x.l.price ?? null, registeredAt: x.l.registeredAt || null, lastSeenAt: x.l.lastSeenAt || null, sku: x.l.sku || null, order: x.ord, why: x.why, cand: x.n, rank: x.rank, ...W() }, { merge: true })); };
      certain.forEach((x) => rec(x, 'code')); inferred.forEach((x) => rec(x, 'isbn'));
      if (ops.length) await commitBatches(ops, '주문으로 판매 끝 반영'); certain.concat(inferred).forEach((x) => L.set(x.k, { ...x.l, active: false, status: '판매완료' }));
      const sum = { at, by: PC_NAME, group: grp, since, orders: ords.length, certain: certain.length, inferred: inferred.length, skipped: skipped.length, skippedEx: skipped.slice(0, 40) };
      await LR.set({ at, lease: null, last: sum, ...(first ? { u1016: sum } : {}), hist: FV.arrayUnion({ at, group: grp, certain: certain.length, inferred: inferred.length, skipped: skipped.length }) }, { merge: true });
      log(`🧾 주문으로 판매 끝 반영${first ? ' (처음 한 번 — 8월부터)' : ''}: 배송&구매확정전 이후 주문 ${ords.length}건 · 상품 코드로 확실 ${certain.length}개 · ISBN으로 고름 ${inferred.length}개('불분명 처리건') · 건너뜀 ${skipped.length}줄`);
    } catch (e) { log('🧾 주문으로 판매 끝 반영 실패(다음에 다시): ' + (e.code || e.message), 1); try { await LR.set({ lease: null, err: { at: nowIso(), why: e.message } }, { merge: true }); } catch (x) {} } }
  if (!PUBONLY) { setTimeout(() => soldInfer().catch(() => {}), 4 * 60e3); setInterval(() => soldInfer().catch(() => {}), 10 * 60e3); }
  /* ══ (1.76.0) 💰 알라딘 환급액 — 알라딘 예치금 화면(wSubPayInfo.aspx?pType=SubPayDepositMoney · 로그인 화면이라 사무실 PC만)
   *  총잔액 · 예치금 내역(날짜·구분·상세내역(주문번호)·발급금액·사용금액·잔액) · 환급신청 내역(신청일시·환급예정일·금액·방법·상태)을 그대로 모음
   *  내역 한 줄 = acc_deposit/{날짜_상세_발급_사용_잔액}(같으면 다시 쓰지 않음 · 지우지 않음) · 환급신청 = acc_refund · 요약 = app_settings/deposit
   *  쪽 넘기기는 알라딘 화면과 같은 방식(폼 POST · page·StartDate·EndDate) · 처음엔 1년치, 그 뒤엔 새 줄만(아는 줄만 나오는 쪽에서 멈춤) · 10쪽마다 진행 저장(멈추면 이어서) */
  const DEP_URL = 'https://www.aladin.co.kr/account/wSubPayInfo.aspx?pType=SubPayDepositMoney';
  const depNum = (t) => { const m = String(t || '').replace(/[,\s원]/g, '').match(/-?\d+/); return m ? +m[0] : null; };
  function depParse(doc) { const out = { balance: null, rows: [], lastPage: 1, refunds: [] }; const b = doc.querySelector('.deposit_info01_box .font_f5680b_bold'); out.balance = b ? depNum(b.textContent) : null;
    const T = doc.querySelector('table[summary="상품권"]'); if (T) T.querySelectorAll('tr').forEach((tr) => { const td = [...tr.querySelectorAll('td')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()); if (td.length < 6 || !/^\d{4}-\d\d-\d\d$/.test(td[0])) return; out.rows.push({ date: td[0], kind: td[1], detail: td[2], add: depNum(td[3]), use: depNum(td[4]), bal: depNum(td[5]) }); });
    doc.querySelectorAll('a[href^="Javascript:Page_Set"],a[href^="javascript:Page_Set"]').forEach((a) => { const m = (a.getAttribute('href') || '').match(/Page_Set\('(\d+)'\)/); if (m) out.lastPage = Math.max(out.lastPage, +m[1]); });
    const RT = [...doc.querySelectorAll('table')].find((t) => /환급예정일/.test(t.textContent || '') && /환급상태/.test(t.textContent || '')); if (RT) RT.querySelectorAll('tr').forEach((tr) => { const td = [...tr.querySelectorAll('td')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()); if (td.length < 5 || !/^\d{4}-\d\d-\d\d/.test(td[0])) return; out.refunds.push({ reqAt: td[0], due: td[1], amount: depNum(td[2]), how: td[3], st: td[4] }); });
    return out; }
  async function depPage(prevDoc, page, start, end) { const F = prevDoc && prevDoc.querySelector('form#frm'); if (!F) throw new Error('예치금 화면의 조회 폼을 못 찾음(로그인 풀림·화면 바뀜)'); const body = new URLSearchParams(); F.querySelectorAll('input[name]').forEach((i) => { if (i.type === 'checkbox' && !i.checked) return; body.set(i.name, i.value || ''); }); body.set('page', String(page)); body.set('StartDate', start.replace(/-/g, '')); body.set('EndDate', end.replace(/-/g, '')); body.set('StartDate1', start); body.set('EndDate1', end);
    await politeWait(); const r = await fetch(DEP_URL, { method: 'POST', body, credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); if (!r.ok) throw new Error('예치금 화면 응답 ' + r.status); const html = AL.decode(await r.arrayBuffer(), r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html'); netAdd(html.length); PACE.ok(); if (!doc.querySelector('.deposit_info01_box')) throw new Error('예치금 화면이 아님(로그인 풀림일 수 있음)'); return doc; }
  async function depositJob() { if (PUBONLY) return 'skip'; const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); return false; }
    try { const SR = C('app_settings').doc('deposit'); const S0 = (await SR.get()).data() || {}; const first = !S0.fullAt; const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const start = first ? new Date(Date.now() + 9 * 3600e3 - 365 * 864e5).toISOString().slice(0, 10) : new Date(Date.now() + 9 * 3600e3 - 92 * 864e5).toISOString().slice(0, 10);
      const g0 = await getDoc(DEP_URL); let P1 = depParse(g0.doc); if (P1.balance == null) throw new Error('예치금 총잔액을 못 읽음(화면 바뀜?)'); let doc = await depPage(g0.doc, 1, start, today); P1 = depParse(doc);
      const prog = (await loadProgress('deposit')) || {}; let page = first && prog.page && prog.start === start ? prog.page : 1; if (page > 1) doc = await depPage(doc, page, start, today);
      let saved = 0, seenKnown = 0; const FV = firebase.firestore.FieldValue; const at = nowIso(); let last = P1.lastPage;
      for (;;) { if (stopFlag) { await saveProgress('deposit', { page, start }); throw new Error('멈춤'); } const P = depParse(doc); last = Math.max(last, P.lastPage); const ids = P.rows.map((x) => `${x.date}_${x.detail}_${x.add ?? ''}_${x.use ?? ''}_${x.bal ?? ''}`.replace(/[\/\s]/g, ''));
        const ex = await Promise.all(ids.map((id) => C('acc_deposit').doc(id).get().then((d) => d.exists).catch(() => false))); const b = db.batch(); let n = 0;
        P.rows.forEach((x, i) => { if (ex[i]) { seenKnown++; return; } const ono = /^\d{3}-[A-Z]\d{6,}$/.test(x.detail) ? x.detail : null; b.set(C('acc_deposit').doc(ids[i]), { ...x, orderNo: ono, firstSeenAt: at, by: PC_NAME, ...W() }); n++; });
        if (n) await b.commit(); saved += n; ui('💰 알라딘 예치금 내역', page, last, `${page}/${last}쪽 · 새 줄 ${saved}개`);
        if (!first && P.rows.length && n === 0) break; /* 새 줄 없는 쪽 = 그 뒤는 이미 모은 것 */ if (page >= last || !P.rows.length) break;
        page++; if (page % 10 === 0) await saveProgress('deposit', { page, start }); doc = await depPage(doc, page, start, today); }
      const rf = P1.refunds || []; if (rf.length) { const b2 = db.batch(); rf.forEach((x) => b2.set(C('acc_refund').doc(`${x.reqAt}_${x.amount}`.replace(/[\/\s:]/g, '')), { ...x, seenAt: at, ...W() }, { merge: true })); await b2.commit(); }
      await SR.set({ balance: P1.balance, at, by: PC_NAME, start, pages: last, refunds: rf, ...(first ? { fullAt: at } : {}), balHist: FV.arrayUnion({ at, balance: P1.balance }), ...W() }, { merge: true }); await finishJob('deposit', { saved, pages: page }).catch(() => {});
      log(`💰 알라딘 예치금: 총잔액 ${P1.balance.toLocaleString()}원 · 새 내역 ${saved}줄${first ? ' (처음 — 1년치)' : ''} · 환급신청 ${rf.length}건`); return 'done';
    } finally { await releaseLane('aladin'); } }
  let LIST_LAST = 0, LIST_FULL = 0, LC_PUT_AT = 0; /* (1.88.6) 정범님 10/20 크롬 느림 실측: 일마다 이 PC 보관본(상품 2만 5천 건)을 IndexedDB에서 통째로 읽고(수 초 화면 멈춤) 바뀐 게 있으면 통째로 다시 씀(또 수 초) → 이미 메모리에 있으면 서버에서 바뀐 것만 받아 합치고, 보관본은 30분에 한 번만 다시 씀 */
  const lcPut = (m, last, fullAt, now) => { if (!now && Date.now() - LC_PUT_AT < 30 * 60e3) return; LC_PUT_AT = Date.now(); LCACHE.put({ rows: [...m], last, fullAt }).catch(() => {}); };
  async function loadListings(force) {
    if (LISTINGS && !force) return LISTINGS;
    if (LISTINGS && force === 'inc' && LIST_LAST && Date.now() - LIST_FULL < 24 * 3600e3) { try { let max = LIST_LAST; const ss = await C('prd_listings').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(LIST_LAST - 120000)).get(); ss.forEach((d) => { if (!/^_perm/.test(d.id)) { const v = d.data(); LISTINGS.set(d.id, v); max = Math.max(max, lcMs(v)); } }); LIST_LAST = max; if (ss.size) lcPut(LISTINGS, max, LIST_FULL); return LISTINGS; } catch (e) {} }
    ui('기존 상품 기록 읽는 중', 0, 0);
    let c = null; if (!force || force === 'inc') { try { c = await LCACHE.get(); } catch (e) { c = null; } }
    if (c && Array.isArray(c.rows) && c.last && Date.now() - (c.fullAt || 0) < 24 * 3600e3) { try { const m = new Map(c.rows.map(([id, v]) => [id, lcRevive(v)])); let max = c.last; const ss = await C('prd_listings').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(c.last - 120000)).get(); /* 2분 겹쳐 읽음(시계 차이) */ ss.forEach((d) => { if (!/^_perm/.test(d.id)) { const v = d.data(); m.set(d.id, v); max = Math.max(max, lcMs(v)); } });
        LISTINGS = m; LIST_LAST = max; LIST_FULL = c.fullAt || Date.now(); log(`기존 상품 ${m.size.toLocaleString()}건 (이 PC 보관본 + 바뀐 ${ss.size.toLocaleString()}건만 받음)`); if (ss.size > 300) lcPut(m, max, c.fullAt); return m; } catch (e) { log('보관본으로 읽기 실패 — 통째로 다시 읽음: ' + (e.code || e.message), 1); } }
    const m = new Map(); let max = 0; const ss = await C('prd_listings').get(); ss.forEach((d) => { if (!/^_perm/.test(d.id)) { const v = d.data(); m.set(d.id, v); max = Math.max(max, lcMs(v)); } }); /* (1.57.7) 권한 시험 문서는 상품이 아님 */
    LISTINGS = m; LIST_LAST = max || Date.now(); LIST_FULL = Date.now(); log(`기존 상품 ${m.size.toLocaleString()}건 읽음`); lcPut(m, max || Date.now(), Date.now(), true); return m;
  }
  const stabJ = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().filter((kk) => x[kk] !== undefined).map((kk) => [kk, x[kk]])) : x)); let LOPS_WHY = {}; /* (1.89.27) 칸 순서·undefined 칸과 상관없는 비교 */
  // 한 상품 줄을 합치기 규칙으로 올릴 작업 목록 만들기 (빈 값으로 덮지 않음, 바뀐 칸만 이력)
  function listingOps(row, source, seenAt) {
    const key = 'aladin_' + row.usedCode; const prev = LISTINGS.get(key);
    const next = {}; for (const f of LISTING_FIELDS) if (row[f] != null) next[f] = row[f];
    if (prev && prev.registeredAt && row.registeredYearGuessed) delete next.registeredAt; // 연도 추정값으로 확정값을 덮지 않음
    const ch = P.diff(prev, next, LISTING_FIELDS);
    const mt = P.mediaType(row); const doc = { channel: 'aladin', usedCode: row.usedCode, ...next, mediaType: mt.type, mediaWhy: mt.why, ids: row.ids, idWarn: row.idWarn || [], active: ACTIVE.includes(row.status || (prev && prev.status)), lastSeenAt: seenAt, ['seenBy_' + source]: seenAt, ...W() };
    if (!prev) doc.firstSeenAt = seenAt;
    /* (1.84.1) 바뀐 칸이 없으면 '봤음' 표시만 — 전체 재검토가 2만여 상품을 통째로 다시 적어(10/18 1시간 9,633건 · 문서 전체) 웹앱들이 그만큼 받아 풀던 것. 상태·가격 등 값이 하나라도 다르면 예전처럼 전체 */
    const why = !prev ? 'new' : Object.keys(ch).length ? 'f:' + Object.keys(ch).sort().join(',') : prev.mediaType !== mt.type ? 'mediaType' : prev.active !== doc.active ? 'active' : !prev.usedCode ? 'usedCode' : stabJ(prev.ids || null) !== stabJ(doc.ids || null) ? 'ids' : stabJ(prev.idWarn || []) !== stabJ(doc.idWarn || []) ? 'idWarn' : row.registeredYearGuessed && !prev.registeredAt ? 'regYear' : null; /* (1.89.27) 왜 통째로 다시 적는지 셈 — 회차 끝 기록에 남김 */ LOPS_WHY[why || 'slim'] = (LOPS_WHY[why || 'slim'] || 0) + 1;
    if (!why) { /* (1.89.27) 비교를 칸 순서와 상관없이(stabJ) — Firestore가 돌려주는 묶음(ids 안의 {raw,value,kind…})은 칸 이름 순으로 정렬돼 와서, 화면에서 읽은 순서와 JSON 글자가 늘 달랐음 → '바뀐 것 없음'이 한 번도 성립하지 않아 매일 06:30 전체 재검토가 1만 5천여 상품을 통째로 다시 적었음(10/22 06:30~06:40 15,657건) */
      const slim = { lastSeenAt: seenAt, ['seenBy_' + source]: seenAt, ...W() }; LISTINGS.set(key, { ...prev, ...slim }); return { ops: [(b) => b.set(C('prd_listings').doc(key), slim, { merge: true })], isNew: false, changed: false, slim: true };
    }
    if (row.registeredYearGuessed && !(prev && prev.registeredAt)) doc.registeredYearGuessed = true;
    const ops = [(b) => b.set(C('prd_listings').doc(key), doc, { merge: true })];
    const real = Object.keys(ch).filter((k) => prev && prev[k] != null);
    if (real.length) ops.push((b) => b.set(C('prd_listing_changes').doc(), { listingKey: key, at: seenAt, source, changes: Object.fromEntries(real.map((k) => [k, ch[k]])), ...W() }));
    LISTINGS.set(key, { ...(prev || {}), ...doc });
    return { ops, isNew: !prev, changed: real.length > 0 };
  }

  /* ───────── 파일 가져오기 ───────── */
  const drop = $('#rnpDrop');
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = async (e) => { e.preventDefault(); drop.classList.remove('over'); for (const f of e.dataTransfer.files) await runFile(f); };
  async function importFile(file) {
    const buf = await file.arrayBuffer();
    const head = new TextDecoder('utf-8').decode(buf.slice(0, 2000));
    const seenAt = nowIso();
    if (/<html|<table/i.test(head)) { // 알라딘 등록 상품 파일(.xls 이름이지만 HTML 표)
      const doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(buf), 'text/html');
      const r = P.parseRegExportRows(P.tableToRows(doc));
      if (r.missingColumns.length) log('없는 칸: ' + r.missingColumns.join(', '), 1);
      await loadListings();
      let ops = [], nNew = 0, nCh = 0;
      for (const row of r.rows) { const x = listingOps(row, 'regExport', seenAt); ops = ops.concat(x.ops); nNew += x.isNew; nCh += x.changed; }
      await commitBatches(ops, '등록 상품 파일 올리는 중');
      await C('prd_imports').add({ kind: 'regExport', fileName: file.name, rows: r.rows.length, newRows: nNew, changedRows: nCh, ...W() });
      log(`등록 상품 파일: ${r.rows.length.toLocaleString()}줄 (신규 ${nNew}, 변경 ${nCh})`);
      return;
    }
    // 판매완료 엑셀은 고객 수집기가 crm_orders에 올린다(상품 줄마다 U코드 aladinUsedCode 포함).
    // 상품 쪽은 그 기록을 읽어 쓰므로 여기서는 받지 않는다 → 같은 자료를 두 곳에 두지 않음.
    log(`'${file.name}'은 등록 상품 파일이 아닙니다. 판매완료 엑셀이라면 고객 수집기에 넣어 주세요`, 1);
  }

  /* ───────── 1. 샵매니저 목록 훑기 ───────── */
  const STATUS = { 판매중: 1, 판매대기: 41, 일시판매중지: 3, 판매중지: 15, 판매완료: 18, 판매금지: 16 };
  const listUrl = (code, page) => `/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=${page}&SortOrder=6&itemStockStatus=${code}&categoryId=0`;
  async function scan(mode) {
    const lane = await acquireLane('aladin');
    if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }

    try {
      await loadListings(); LOPS_WHY = {};
      const name = mode === 'new' ? 'scanNew' : mode === 'daily' ? 'scanDaily' : 'scanFull';
      const statuses = mode === 'new' ? Object.keys(STATUS) : mode === 'daily' ? ['판매중', '일시판매중지', '판매중지', '판매완료'] : ACTIVE; /* (1.74.5) 판매완료도 — 팔린 상품이 판매중 목록에서 사라질 뿐이라 매일 확인에서 못 잡고 전체 재검토 때까지 판매중으로 남았음(예: 9788976774057 · 마지막 확인 10/05) · 판매완료 목록 첫 쪽에서 상태가 바뀐 것만 기록하고 아는 것만 나오면 멈춤 */ // daily(1.34.0 매일 자동): 세 상태만 · 새등록 상품과, 본 쪽에서 상태가 바뀐 상품을 기록 · 이미 아는 상품만 있는 쪽이 나오면 그 상태는 끝
      const prog = (await loadProgress(name)) || { si: 0, page: 1, stats: {}, startedAt: nowIso() };
      if (prog.page > 1 || prog.si > 0) log(`이어서 시작: ${statuses[prog.si]} ${prog.page}쪽부터`);
      const cursor = (await C('prd_system').doc('cursor').get()).data() || {};
      const maxKnown = +(cursor.maxListingId || 0);
      let maxSeen = maxKnown;
      for (; prog.si < statuses.length; prog.si++, prog.page = 1) {
        const stName = statuses[prog.si];
        for (;;) {
          if (stopFlag) { await saveProgress(name, prog); throw new Error('멈춤'); }
          const { doc } = await getDoc(listUrl(STATUS[stName], prog.page));
          const r = P.parseScmList(doc, new Date().getFullYear());
          const seenAt = nowIso(); let ops = []; let unknown = 0;
          for (const row of r.rows) {
            if (!row.usedCode) { log('U코드 없는 줄: ' + row.listingId, 1); continue; }
            maxSeen = Math.max(maxSeen, +row.listingId);
            const known = LISTINGS.has('aladin_' + row.usedCode) && LISTINGS.get('aladin_' + row.usedCode).listingId;
            if (mode === 'new' && known) continue;
            if (mode === 'daily' && known) { const kl = LISTINGS.get('aladin_' + row.usedCode); if (kl.status === stName && (kl.active !== false) === ACTIVE.includes(stName)) continue; /* (1.87.0) 판매완료는 active:false가 맞는 상태 — 예전 조건(active !== false)이 판매완료 상품을 늘 '바뀜'으로 봐서 매일 회차마다 판매완료 9,700여 개를 끝 쪽까지 다시 적었음(10/16~19 하루 21만~23만 번 쓰기 · 모든 PC·웹앱이 그만큼 다시 받아 느려짐) */ prog.stats.changed = (prog.stats.changed || 0) + 1; } // 아는 상품은 상태가 바뀌었을 때만 다시 기록
            unknown++;
            const x = listingOps(row, 'scm', seenAt); if (mode === 'full' && x.slim && !(LISTINGS.get('aladin_' + row.usedCode) || {}).soldBy) { /* 웹앱이 판매 처리한 상품(soldBy)은 '다시 판매중으로 보임' 확인에 lastSeenAt이 필요해 예전처럼 적음 */ (prog.seenU = prog.seenU || []).push(row.usedCode); } else ops = ops.concat(x.ops); /* (1.87.2) 전체 재검토: 바뀐 칸이 없는 상품은 '봤음'도 적지 않음 — 이번 회차에 본 상품 번호는 진행 기록(seenU)에만 두고 사라짐 판단에 씀(예전엔 1만 5천여 개를 매일 06:30마다 다시 적어 모든 PC·웹앱이 그만큼 다시 받았음) */
            prog.stats[stName] = (prog.stats[stName] || 0) + 1;
          }
          if (ops.length) await commitBatches(ops);
          ui(mode === 'new' ? '신규 등록분 수집' : '전체 재검토', prog.page, r.lastPage, `${stName} · 이번 쪽 새로 기록 ${unknown}건`, '끝나면 "도서 정보·시장 지표 갱신"을 누르세요');
          // 신규 모드: 등록일 역순이므로, 한 쪽 전체가 이미 아는 상품이고 기준점보다 오래됐으면 이 상태는 끝
          const pageMax = Math.max(0, ...r.rows.map((x) => +x.listingId));
          if ((mode === 'new' || mode === 'daily') && unknown === 0 && pageMax && pageMax <= maxKnown) break;
          if (!r.rows.length && prog.page < r.lastPage) throw new Error(`${stName} ${prog.page}쪽이 비어 있습니다(서버 오류 화면일 수 있음). 같은 버튼으로 이어하세요`);
          if (prog.page >= r.lastPage || !r.rows.length) break;
          prog.page++; if (prog.page % 5 === 0) await saveProgress(name, prog);
        }
        await saveProgress(name, { ...prog, si: prog.si + 1, page: 1 });
      }
      if (mode === 'full') { // 판매중 계열에서 사라진 상품 = 팔렸거나 삭제됨 → 비활성으로 표시(판매완료 대조는 신규 수집·판매완료 엑셀에서)
        const seenU = new Set(prog.seenU || []); const gone = [...LISTINGS.entries()].filter(([, l]) => l.active && !seenU.has(l.usedCode) && (!l.seenBy_scm || l.seenBy_scm < prog.startedAt));
        const activeN = [...LISTINGS.values()].filter((l) => l.active).length;
        // 안전장치: 판매 중 상품의 30% 넘게 한꺼번에 '사라짐'이면 알라딘 화면 오류(로그인 풀림·빈 화면)일 가능성이 커서 표시하지 않음
        if (activeN >= 50 && gone.length > activeN * 0.3) { log(`전체 재검토: 판매 중 ${activeN.toLocaleString()}개 중 ${gone.length.toLocaleString()}개가 목록에 안 보였습니다. 화면 오류일 수 있어 '사라짐' 표시를 하지 않았습니다 (실제라면 판매관리 화면 확인 후 다시)`, 1); gone.length = 0; }
        await commitBatches(gone.map(([k]) => (b) => b.set(C('prd_listings').doc(k), { active: false, goneFromActiveAt: nowIso(), goneEvents: firebase.firestore.FieldValue.arrayUnion(nowIso()), ...W() }, { merge: true }) /* (1.57.2) 사라진 때를 덮어쓰지 않고 쌓음 */), '사라진 상품 표시');
        gone.forEach(([k, l]) => LISTINGS.set(k, { ...l, active: false }));
        prog.stats.goneFromActive = gone.length;
      }
      await C('prd_system').doc('cursor').set({ maxListingId: String(maxSeen), ['last_' + name]: nowIso(), ...W() }, { merge: true });
      { const wy = Object.entries(LOPS_WHY).sort((x, y) => y[1] - x[1]); if (wy.length) { prog.stats.writeWhy = Object.fromEntries(wy.slice(0, 12)); log(`${name} 기록 사유: ${wy.slice(0, 8).map(([k, n]) => `${k === 'slim' ? '바뀐 것 없음(안 적음)' : k} ${n.toLocaleString()}`).join(' · ')}`); } } /* (1.89.27) 다음 회차부터 왜 적었는지 숫자로 남김 — 점검이 바로 봄 */
      await finishJob(name, prog.stats);
      log(`${name} 완료 ${JSON.stringify(prog.stats)}`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 2. 도서 정보·시장 지표 ───────── */
  const BOOK_FIXED = ['title', 'subtitle', 'series', 'contributors', 'publisher', 'aladinPublisherId', 'pubDate', 'originalTitle', 'isbn13', 'pages', 'size', 'weightG', 'categories', 'basicExtra'];
  const METRICS = ['priceList', 'priceSales', 'salesPoint', 'rating', 'commentCount', 'reviewCount', 'availability', 'usedTotal', 'usedTabs', 'usedMins', 'buyback', 'buyerDist', 'relationBuy'];
  async function resolveBookId(listing) {
    for (const k of ['usedCode', 'isbn13', 'aladinCode', 'isbn10']) {
      const v = listing[k]; if (!v) continue;
      const kind = k === 'usedCode' ? 'usedCode' : k;
      const d = await C('prd_ids').doc(`${kind}_${v}`).get(); if (d.exists) return d.data().bookId;
    }
    return null;
  }
  function productUrls(l) {
    const u = [];
    if (l.isbn13) u.push(['isbn13', `/shop/wproduct.aspx?ISBN=${l.isbn13}`]);
    if (l.isbn10) u.push(['isbn10', `/shop/wproduct.aspx?ISBN=${l.isbn10}`]);
    if (l.aladinCode) u.push(['aladinCode', `/shop/wproduct.aspx?ISBN=${l.aladinCode}`]);
    if (l.listingId) u.push(['listingPage', `/shop/wproduct.aspx?ItemId=${l.listingId}`]);
    return u;
  }
  // 시장 지표 '마지막 확인 시각' 표: 이 PC에 보관(GM)하고, 그 뒤 바뀐 것(lastCheckedAt 이 더 늦은 것)만 Firebase에서 받음 · 7일마다 한 번 전체로 다시 맞춤
  async function metricsCheckedMap() { let c = null; try { c = GM_getValue('rnp-mchk', null); } catch (e) {}
    const build = !c || !c.m || !c.builtAt || Date.now() - c.builtAt > 7 * 864e5;
    if (build) { const s = await C('prd_book_metrics').get(); c = { m: {}, max: '', builtAt: Date.now() }; s.forEach((d) => { const t = d.data().lastCheckedAt || ''; c.m[d.id] = t; if (t > c.max) c.max = t; }); log(`시장 지표 확인 시각 표를 새로 만듦 (${Object.keys(c.m).length.toLocaleString()}권)`); }
    else { const s = await C('prd_book_metrics').where('lastCheckedAt', '>', c.max || '').get(); s.forEach((d) => { const t = d.data().lastCheckedAt || ''; c.m[d.id] = t; if (t > c.max) c.max = t; }); if (s.size) log(`시장 지표 확인 시각: 그 뒤 바뀐 ${s.size.toLocaleString()}권만 받음`); }
    try { GM_setValue('rnp-mchk', c); } catch (e) {} return new Map(Object.entries(c.m)); }
  async function market() {
    const lane = await acquireLane('aladin');
    if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }

    try {
      await loadListings();
      // 대상: 판매 중인 상품의 책. 도서 번호가 없는 상품 먼저, 그다음 오래전에 확인한 책부터
      const active = [...LISTINGS.values()].filter((l) => l.active && l.usedCode);
      const soldNoBook = [...LISTINGS.values()].filter((l) => !l.active && l.usedCode && !l.bookId); // 판매완료·내린 상품: 도서 정보·이미지가 아직 없는 것만 (한 번이면 충분)
      const checked = await metricsCheckedMap(); // (1.34.1) 책마다 '마지막 확인 시각'만 필요 — 예전엔 시장 지표 전체(수만 건·수백 MB)를 매번 읽어 메모리 부족 새로고침이 잦았음
      const byBook = new Map(); const unresolved = [];
      const cutoff = !FORCE_ALL && SET.recheckDays > 0 ? new Date(Date.now() - SET.recheckDays * 86400000).toISOString() : null;
      for (const l of active) { if (l.bookId) { if (!byBook.has(l.bookId)) byBook.set(l.bookId, l); } else unresolved.push(l); }
      if (cutoff) for (const [bid] of [...byBook]) { const c = checked.get(bid); if (c && c > cutoff) byBook.delete(bid); } // 주기 안에 확인한 책은 건너뜀 → 어느 PC에서 이어도 같은 결과
      const queue = [...unresolved.map((l) => ({ l, bookId: null })), ...[...byBook.entries()].sort((a, b) => String(checked.get(a[0]) || '').localeCompare(String(checked.get(b[0]) || ''))).map(([bookId, l]) => ({ l, bookId })), ...soldNoBook.map((l) => ({ l, bookId: null }))]; // 순서: 판매 중(번호 없음) → 판매 중 다시 확인 → 판매완료(도서 정보 없음)
      const prog = (await loadProgress('market')) || { i: 0, total: queue.length, done: 0, fail: 0, startedAt: nowIso() };
      const doneSet = new Set(LS.get('market_done', []));
      for (let i = 0; i < queue.length; i++) {
        if (stopFlag) { await saveProgress('market', prog); LS.set('market_done', [...doneSet]); throw new Error('멈춤'); }
        const { l } = queue[i]; let { bookId } = queue[i];
        const tag = bookId || 'aladin_' + l.usedCode; if (doneSet.has(tag)) continue;
        if (PUBONLY && anonGateGet(tag)) { prog.gate = (prog.gate || 0) + 1; doneSet.add(tag); continue; } /* (1.72.1) 로거: 19금이라 로그인 없이 못 보는 책은 14일 동안 다시 읽지 않음(테더링 아낌) */
        try { await refreshOne(l, bookId); prog.done++; } catch (e) { if (e.needLogin && PUBONLY) { anonGateSet(tag); prog.gate = (prog.gate || 0) + 1; handoffPut({ kind: 'market', tag, bookId: bookId || null, usedCode: l.usedCode || null, title: l.title || null, why: '19금 — 로그인 없이는 못 보는 화면' }); } else if (e && e.hidden) { prog.hid = (prog.hid || 0) + 1; /* (1.89.23 · 3시간 점검 10/21) 알라딘 비공개 상품: 이 PC가 3일 동안 다시 묻지 않으므로(알라딘에 안 감) 실패로 세거나 회차마다 '실패' 줄을 남기지 않음 — JS-MAIN 6시간에 같은 책 3~6번씩 경고 */ } else { prog.fail++; log(`실패 ${l.title || l.usedCode}: ${e.message}`, 1); } } await mixMaybe(); /* (1.69.0) 🔀 로거: 우리 책 시장 지표 사이사이 다른 책(설정 ⑨ 섞어 읽기 비율 · 기본 30%) — 이 방문자가 보는 책이 우리 재고와 겹치는 비율을 낮춤 · (1.72.1) 읽은 다른 책도 탐색 수집처럼 저장 */
        doneSet.add(tag);
        ui('도서 정보·시장 지표 갱신', doneSet.size, queue.length, l.title || l.usedCode, `실패 ${prog.fail}건 · 멈춰도 이어서 계속됩니다`);
        if (doneSet.size % 10 === 0) { await saveProgress('market', prog); LS.set('market_done', [...doneSet]); }
      }
      await finishJob('market', { done: prog.done, fail: prog.fail }); LS.set('market_done', []);
      log(`시장 지표 갱신 완료 (성공 ${prog.done}, 실패 ${prog.fail}${prog.hid ? `, 알라딘 비공개라 건너뜀 ${prog.hid}` : ''}${prog.gate ? `, 19금이라 로그인 없이 못 봐 건너뜀 ${prog.gate}` : ''}${PUBONLY && MIX.n ? ` · 🔀 섞어 읽은 다른 책 ${MIX.n}권(저장 ${MIX.saved})` : ''})`);
    } finally { await releaseLane('aladin'); }
  }
  /* (1.75.0) 📚 도서 정보는 알라딘 밖에서 먼저(정범님 10/16 지시): 교보문고 → 예스24 → 둘 다 없을 때만 알라딘
   *  ext_basic/{ISBN}(외부 정보가 모아 둔 것)을 먼저 보고, 없으면(live) 그 자리에서 교보·예스24를 읽어 저장(와이파이 — 로거도 도우미가 와이파이로) */
  async function extBasicFor(isbn, live, st) { const X = EXT(); if (!X || !/^97[89]\d{10}$/.test(String(isbn || ''))) return null; const ref = C('ext_basic').doc(String(isbn)); let doc = null; try { const d = await ref.get(); doc = d.exists ? d.data() : null; } catch (e) {}
    const BO = ['kyobo', 'yes24', 'naverbook']; /* (1.76.0) 교보 > 예스24 > 네이버 */ const okOf = (D) => BO.filter((k) => D && D.src && D.src[k] && D.src[k].d && D.src[k].d.title);
    if (live && !okOf(doc).length) { const cfgB = await extCfg().catch(() => null); let nNone = 0; for (const src of BO) { try { /* (자동 점검 2026-10-16) 출처별 하루 상한(cap)·쉼(pauseUntil·키 문제)을 지킴 — 로거 와이파이 도서 정보(biTick)가 거의 쉬지 않고 돌아 하루 상한(500)을 몇십 배 넘겨 사무실 와이파이 IP가 막힐 수 있었음 */ const cap = cfgB && cfgB.src && cfgB.src[src] && cfgB.src[src].cap; if ((EXT_S.pauseUntil[src] || 0) > Date.now() || (cap != null && (EXT_S.used[src] || 0) >= cap) || (EXT_S.authPause && EXT_S.authPause[src] != null)) continue; const h0 = X.SOURCES[src].host; const at0 = Math.max(Date.now(), EXT_S.next[h0] || 0); EXT_S.next[h0] = at0 + X.SOURCES[src].paceMs * (0.8 + Math.random() * 0.4); if (at0 > Date.now()) await sleep(at0 - Date.now()); extUsedAdd(src, 2); const keys = await extKeys(); const res = await X.run(src, { isbn: String(isbn), title: '', author: '', keys, http: extHttp, render: extRender, cache: EXT_S.cache, cfg: await extCfg() }); if (res && res.ok && !res.none) { await extSave(src, { isbn: String(isbn) }, res); extIdxSet(src, String(isbn)); EXT_S.errs[src] = 0; const d2 = await ref.get(); doc = d2.exists ? d2.data() : doc; if (okOf(doc).length) break; } else if (res && res.ok && res.none) nNone++; else if (res && !res.skip && !res.auth && !res.mismatch) { /* (1.89.12) '다른 책'(검색 첫 상품이 이 ISBN이 아님)은 못 읽은 것이 아님 — 예전엔 5번 잇달아면 출처를 1시간 쉬게 해 로거 와이파이 도서 정보가 거의 놀았음(정범님 10/21) */ EXT_S.errs[src] = (EXT_S.errs[src] || 0) + 1; if (res.limit) EXT_S.pauseUntil[src] = Date.now() + 6 * 3600e3; else if (EXT_S.errs[src] >= 5) { EXT_S.pauseUntil[src] = Date.now() + 3600e3; EXT_S.errs[src] = 0; log(`📚 ${X.SOURCES[src].label || src}: 도서 정보 5번 잇달아 못 읽어 1시간 쉼 — ${String(res.why || '').slice(0, 80)}`, 1); } } } catch (e) {} } if (st) st.allNone = nNone === BO.length; }
    else if (st) st.allNone = !live;
    const have = okOf(doc); if (!have.length) return null; const M = X.mergeBasic(doc, BO); const o = (M && M.v) || {}; const cov = have.map((k) => doc.src[k].d.cover).find(Boolean) || null; const reviews = {}; for (const k of have) { const d = doc.src[k].d; if (d.rating != null || d.reviewN != null || d.ratingN != null) reviews[k] = { rating: d.rating ?? null, ratingMax: d.ratingMax ?? null, ratingN: d.ratingN ?? null, reviewN: d.reviewN ?? null }; } return { ...o, cover: cov, from: (M && M.from) || null, srcs: have, reviews }; }
  const extToPage = (E, l) => { const C0 = []; String(E.authors || '').split(/\s*[,·]\s*/).filter(Boolean).forEach((n) => C0.push({ name: n, role: '지은이' })); String(E.translators || '').split(/\s*[,·]\s*/).filter(Boolean).forEach((n) => C0.push({ name: n, role: '옮긴이' })); return { title: E.title || null, subtitle: E.sub || null, series: E.series || null, contributors: C0.length ? C0 : null, publisher: E.publisher || null, pubDate: E.pubDate || null, isbn13: l.isbn13 || null, pages: E.pages ?? null, size: E.size || null, weightG: E.weightG ?? null, images: E.cover ? { front: E.cover } : null, fetchedFrom: E.srcs[0], infoFrom: E.from || null }; };
  /* (1.79.0) 📊 상품·책 한 권 읽기 결과를 분류별로 셈 — 시장 지표(우리 상품) · 판매완료 상품 정보 · 알라딘 구매 풀 · 탐색 · 섞어 읽기 · (외부 도서 정보는 biTick이 따로 셈) */
  async function refreshOne(l, bookId, opt) { const cat = l && l.explore ? (l.exploreFrom === 'mix' ? 'mix' : 'explore') : l && l.pool ? 'pool' : opt && opt.extOnly ? null : opt && opt.infoOnly ? 'info' : 'metrics'; const CS = window.__rnCS;
    try { const r = await refreshOne0(l, bookId, opt); if (cat && CS) CS.add(cat, 'ok'); return r; } catch (e) { if (cat && CS) { const m = String((e && e.message) || e); const kind = m === '멈춤' || (e && e.tgate) ? 'skip' : e && e.needLogin ? 'skip' : e && (e.noext || e.hidden) ? 'none' : e && e.extTmp ? 'part' : 'fail'; CS.add(cat, kind, 1, kind === 'skip' && e && e.needLogin ? '19금 — 로그인 없이는 못 봄(사무실 PC로 넘김)' : m); } throw e; } }
  async function refreshOne0(l, bookId, opt) {
    const at = nowIso();
    let page = null, resolvedBy = null, finalUrl = null;
    /* (1.75.0) 도서 정보만 필요한 일(알라딘 구매 풀·판매완료 상품 정보)은 교보·예스24에서 찾으면 알라딘을 열지 않음 · 시장 지표가 필요한 일은 알라딘을 읽되 도서 칸은 외부 값을 먼저 씀 */
    const EBS = {}; const EB = l.isbn13 ? await extBasicFor(l.isbn13, !!(l.pool || (opt && opt.infoOnly)), EBS).catch(() => null) : null;
    if (EB && (l.pool || (opt && opt.infoOnly))) { page = extToPage(EB, l); resolvedBy = 'ext:' + EB.srcs[0]; }
    if (!page && opt && opt.extOnly) { if (!EBS.allNone) throw Object.assign(new Error('교보·예스24·네이버가 지금 답하지 않음(상한·쉼·오류) — 나중에 다시'), { extTmp: true }); throw Object.assign(new Error('교보·예스24·네이버에 없음 — 알라딘 도서 정보는 사무실 PC가'), { noext: true }); } /* (자동 점검 2026-10-16) 세 곳이 모두 '없음'이라고 답했을 때만 '없음'(120일 건너뜀) — 잠깐 막히거나 오류면 표시하지 않고 다음에 다시 */ /* (1.76.0) 로거(와이파이)는 알라딘을 절대 열지 않음 */
    if (!page) for (const [how, url] of productUrls(l)) {
      // 구매자 분포·함께 구매는 나중에 따로 수집(설정 dynamicParts가 켜졌을 때만 숨은 창 사용)
      let r = SET.dynamicParts ? await getProductFull(url) : null;
      if (!r) { const g = await pubProd(url); r = { page: P.parseProductPage(g.doc, g.finalUrl), finalUrl: g.finalUrl }; r.page.dynamicLoaded = false; }
      if (r.page.aladinItemId && r.page.title) { page = r.page; resolvedBy = how; finalUrl = r.finalUrl; break; }
    }
    if (!page) page = await fallbackProviders(l);
    if (!page) throw new Error('도서 정보를 찾지 못함');
    if (EB && page.fetchedFrom === 'aladin') { const EP = extToPage(EB, l); const used0 = {}; for (const f of ['title', 'subtitle', 'series', 'contributors', 'publisher', 'pubDate', 'pages', 'size', 'weightG']) if (EP[f] != null && EP[f] !== '') { if (page[f] != null) used0[f] = page[f]; page[f] = EP[f]; } if (EP.images && EP.images.front) page.images = { ...(page.images || {}), front: EP.images.front }; page.infoFrom = { ...(EB.from || {}), _aladinSeen: used0 }; } /* 도서 칸 = 교보·예스24 먼저(알라딘 값은 비교용으로 남김) · 표지도 외부 먼저 */
    const idsAll = P.collectIds([page.isbn13, page.isbnKey, l.isbn13, l.isbn10, l.aladinCode, l.barcode]);
    const book = { aladinItemId: page.aladinItemId || null, ...idsAll, ids: idsAll.ids };
    if (!bookId) bookId = (await resolveBookId({ ...l, isbn13: idsAll.isbn13 })) || null;
    if (!bookId && book.aladinItemId) { const d = await C('prd_ids').doc('itemId_' + book.aladinItemId).get(); if (d.exists) bookId = d.data().bookId; }
    const isNewBook = !bookId; if (!bookId) bookId = P.newBookId({ ...book, ...idsAll }, SET.keyScheme);
    const bRef = C('prd_books').doc(bookId); const prevB = (await bRef.get()).data();
    // 고정형: 처음 한 번 저장, 이후에는 비어 있던 칸만 채움
    const fixed = {}; for (const f of BOOK_FIXED) if (page[f] != null && (!prevB || prevB[f] == null || (Array.isArray(prevB[f]) && !prevB[f].length))) fixed[f] = page[f];
    const imgs = {}; for (const k of ['front', 'back', 'spine']) { const src = page.images && page.images[k]; if (src && !(prevB && prevB.images && prevB.images[k] && prevB.images[k].src)) imgs[k] = { src, stored: null }; }
    const batch = db.batch();
    if (prevB) { // (1.26.0) 도서 정보가 전과 다르면 그 차이를 시각과 함께 기록 (고정형은 덮어쓰지 않으므로 다르게 보인 값을 따로 남김)
      const chg = {}; const cmp = (a, b) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
      for (const f of BOOK_FIXED) if (page[f] != null && prevB[f] != null && cmp(prevB[f], page[f]) && !(page.infoFrom && page.infoFrom[f] && !(prevB.infoFrom && prevB.infoFrom[f]))) chg[f] = { kept: prevB[f], seen: page[f] }; /* (1.75.0) 예전에 알라딘 값으로 적힌 칸을 외부 값과 견준 차이는 '바뀜'이 아님(출처가 다를 뿐) — 매번 기록하지 않음 */
      const cur = { aladinItemId: book.aladinItemId, isbn13: idsAll.isbn13, isbn10: idsAll.isbn10, aladinCode: idsAll.aladinCode, barcode: idsAll.barcode, productUrl: finalUrl, previewUrls: (page.images && page.images.preview) || null };
      for (const [f, v] of Object.entries(cur)) if (v != null && prevB[f] != null && cmp(prevB[f], v)) chg[f] = { from: prevB[f], to: v };
      if (Object.keys(chg).length) batch.set(C('prd_metric_changes').doc(), { bookId, at: nowIso(), kind: 'bookInfo', chg, ...W() });
    }
    batch.set(bRef, { bookId, keyScheme: SET.keyScheme, aladinItemId: book.aladinItemId, isbn13: idsAll.isbn13, isbn10: idsAll.isbn10, aladinCode: idsAll.aladinCode, barcode: idsAll.barcode,
      ids: idsAll.ids, idWarn: idsAll.warn, ...fixed, ...(Object.keys(imgs).length ? { images: imgs, imgStatus: 'pending' } : {}),
      ...(page.images && page.images.preview && page.images.preview.length ? { previewUrls: page.images.preview } : {}),
      source: page.fetchedFrom, resolvedBy, productUrl: finalUrl, ...(page.infoFrom ? { infoFrom: JSON.parse(JSON.stringify(page.infoFrom)) } : {}), ...(EB && EB.reviews && Object.keys(EB.reviews).length ? { extReviews: EB.reviews, extReviewsAt: at } : {}), /* (1.76.0) 상품평·리뷰 수 — 교보·예스24·네이버(점수 만점이 달라 출처마다) */ ...(isNewBook ? { firstSeenAt: at } : {}), lastFetchedAt: at, ...W() }, { merge: true });
    /* (1.57.2) 이어진 책이 바뀌어도 예전 연결을 bookIds에 쌓아 둠(지금 연결 bookId만 바뀜) */ const AUb = firebase.firestore.FieldValue.arrayUnion(bookId);
    for (const key of P.lookupKeys(book)) batch.set(C('prd_ids').doc(key), { bookId, bookIds: AUb, ...W() }, { merge: true });
    if (!l.pool && !l.explore) batch.set(C('prd_ids').doc('usedCode_' + l.usedCode), { bookId, bookIds: AUb, ...W() }, { merge: true });
    const mtB = P.mediaType({ title: page.title, categories: page.categories, ids: idsAll.ids, isbn13: idsAll.isbn13 });
    batch.set(bRef, { mediaType: mtB.type, mediaWhy: mtB.why }, { merge: true });
    if (!l.pool && !l.explore) batch.set(C('prd_listings').doc('aladin_' + l.usedCode), { bookId, mediaType: mtB.type, mediaWhy: mtB.why, ...W() }, { merge: true }); else if (l.pool) batch.set(bRef, { aladinPool: true }, { merge: true }); else batch.set(bRef, { explored: true, exploredAt: at, exploreFrom: l.exploreFrom || null }, { merge: true }); // 탐색 수집 책: 우리 상품·알라딘 구매 풀과 구분
    await batch.commit();
    if (!l.pool && !l.explore) LISTINGS.set('aladin_' + l.usedCode, { ...l, bookId });
    if (page.fetchedFrom !== 'aladin') return; // 대체 출처는 시장 지표 없음
    // 변동성: 중고 페이지 + 지연 로딩 부분
    const used = page.aladinItemId ? P.parseUsedPage((await pubUsed(`/shop/UsedShop/wuseditemall.aspx?ItemId=${page.aladinItemId}&TabType=0`)).doc) : null;
    const buyerDist = page.buyerDist || null;
    const relationBuy = page.relationBuy && page.relationBuy.length ? page.relationBuy : null;
    if (SET.dynamicParts && page.dynamicLoaded === false) log(`구매자 분포·함께 구매를 못 읽음: ${page.title}`, 1);
    const cur = { priceList: page.priceList, priceSales: page.priceSales, salesPoint: page.salesPoint, rating: page.rating, commentCount: page.commentCount, reviewCount: page.reviewCount,
      availability: page.availability, usedTotal: used ? used.usedTotal : null, usedTabs: used ? used.tabs : null, usedMins: used ? used.mins : null, buyback: used ? used.buyback : null,
      buyerDist, relationBuy: relationBuy ? relationBuy.map((x) => x.title) : null };
    Object.keys(cur).forEach((k) => cur[k] == null && delete cur[k]);
    const mRef = C('prd_book_metrics').doc(bookId); const prevM = (await mRef.get()).data();
    const ch = P.diff(prevM, cur, METRICS);
    const rk = P.rankTransitions(prevM && prevM.activeRanks, page.ranks);
    const b2 = db.batch();
    b2.set(mRef, { bookId, ...cur, activeRanks: page.ranks, lastCheckedAt: at, dynamicPending: !(buyerDist || relationBuy), checkedBy: PC_NAME, ...(used ? { usedFirstPage: used.listings } : {}), ...W() }, { merge: true });
    if (Object.keys(ch).length) b2.set(C('prd_metric_changes').doc(), { bookId, at, changes: ch, firstRecord: !prevM, ...W() });
    // 온라인 중고 첫 페이지 매물의 변화 이력 (1.21.0): 이전 관측과 다른 것만 쌓음 — 덮어쓰는 usedFirstPage와 달리 지워지지 않는 기록
    /* (1.57.2) 첫 페이지가 조금이라도 달라지면(순서만 바뀐 것 · 비교 칸 밖의 칸까지) 그때의 첫 페이지 전체(page)를 함께 남김 — 바뀐 칸만 적던 예전엔 순서 변화·다른 칸 변화가 남지 않았음. 같으면 아무것도 쓰지 않음 */
    if (used) { const ld = P.listingsDiff ? P.listingsDiff(prevM && prevM.usedFirstPage, used.listings) : null; const same = JSON.stringify((prevM && prevM.usedFirstPage) || null) === JSON.stringify(used.listings || null);
      if (ld || !same) b2.set(C('prd_metric_changes').doc(), { bookId, at, kind: 'usedListings', add: ld ? ld.add : [], del: ld ? ld.del : [], chg: ld ? ld.chg : [], orderOnly: !ld, page: JSON.parse(JSON.stringify(used.listings || [])), firstRecord: ld ? ld.first : !(prevM && prevM.usedFirstPage), lastPage: used.lastPage || null, usedTotal: used.usedTotal ?? null, ...W() }); }
    for (const t of rk.started) b2.set(C('prd_rank_periods').doc(), { bookId, title: t, firstSeenAt: at, lastSeenAt: at, endedSeenAt: null, ...W() });
    await b2.commit();
    if (rk.continuing.length || rk.ended.length) { // 이어지는/끝난 순위 기간 갱신
      const qs = await C('prd_rank_periods').where('bookId', '==', bookId).where('endedSeenAt', '==', null).get();
      const b3 = db.batch();
      qs.forEach((d) => { const t = d.data().title; if (rk.continuing.includes(t)) b3.update(d.ref, { lastSeenAt: at }); if (rk.ended.includes(t)) b3.update(d.ref, { endedSeenAt: at }); });
      await b3.commit();
    }
  }

  /* ───────── 대체 출처 (구조만 준비, 설정에서 켜야 동작) ───────── */
  // 각 출처는 parseProductPage와 같은 모양의 객체(없는 칸은 null)를 돌려주고 fetchedFrom에 출처를 적는다.
  const PROVIDERS = {
    naver: { enabled: () => SET.fallbackNaver, async fetch(l) {
      const q = l.isbn13 || l.isbn10 || l.title; if (!q) return null;
      const html = await gmText(`https://search.shopping.naver.com/book/search?query=${encodeURIComponent(q)}`);
      const m = html && html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/); if (!m) return null;
      try { // 구조가 바뀔 수 있어 찾을 수 있는 칸만 조심스럽게 읽는다(시험 단계)
        const j = JSON.parse(m[1]); const s = JSON.stringify(j);
        const img = (s.match(/"(https:\/\/shopping-phinf\.pstatic\.net\/[^"]+)"/) || [])[1];
        const title = (s.match(/"bookTitle":"([^"]+)"/) || s.match(/"productTitle":"([^"]+)"/) || [])[1];
        if (!img && !title) return null;
        return { aladinItemId: null, title: title || null, contributors: [], images: { front: img || null, back: null, spine: null, preview: [] }, isbn13: l.isbn13 || null, fetchedFrom: 'naver', categories: [] };
      } catch (e) { return null; }
    } },
    google: { enabled: () => SET.fallbackGoogle, async fetch(l) {
      const q = l.isbn13 || l.isbn10; if (!q) return null;
      const html = await gmText(`https://www.google.com/search?tbm=bks&q=isbn:${q}`);
      const title = html && (html.match(/<h3[^>]*>([^<]+)<\/h3>/) || [])[1];
      return title ? { aladinItemId: null, title, contributors: [], images: { front: null, back: null, spine: null, preview: [] }, isbn13: l.isbn13 || null, fetchedFrom: 'google', categories: [] } : null;
    } },
  };
  function gmText(url) { return new Promise((res) => GM_xmlhttpRequest({ method: 'GET', url, timeout: 20000, onload: (r) => res(r.status < 400 ? r.responseText : null), onerror: () => res(null), ontimeout: () => res(null) })); }
  async function fallbackProviders(l) {
    for (const [name, p] of Object.entries(PROVIDERS)) {
      if (!p.enabled()) continue;
      try { const v = await p.fetch(l); if (v) { log(`${name}에서 보충: ${v.title || l.usedCode}`); return v; } } catch (e) {}
    }
    return null;
  }

  /* ───────── 3. 이미지 (여러 PC 동시, 20권씩 임대) ───────── */
  const storage = app.storage();
  let imgRunning = false;
  function gmBlob(url) { return new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'blob', timeout: 30000, onload: (r) => (r.status < 400 && r.response ? res(r.response) : rej(new Error('HTTP ' + r.status))), onerror: () => rej(new Error('네트워크')), ontimeout: () => rej(new Error('시간 초과')) })); }
  async function thumb(blob, w) {
    const bmp = await createImageBitmap(blob); const h = Math.round(bmp.height * (w / bmp.width));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return new Promise((r) => cv.toBlob(r, 'image/webp', 0.8));
  }
  async function claimBatch(n) { // 아직 안 된 책 n권을 이 PC가 맡는다(다른 PC와 겹치지 않게 트랜잭션)
    const cand = await C('prd_books').where('imgStatus', '==', 'pending').limit(n * 3).get();
    const now = Date.now(); const refs = cand.docs.filter((d) => !(d.data().imgLease && d.data().imgLease.until > now && d.data().imgLease.by !== PC_ID)).slice(0, n).map((d) => d.ref);
    if (!refs.length) return [];
    return db.runTransaction(async (tx) => {
      const docs = await Promise.all(refs.map((r) => tx.get(r))); const mine = [];
      for (const d of docs) { const x = d.data(); if (x.imgStatus !== 'pending' || (x.imgLease && x.imgLease.until > Date.now() && x.imgLease.by !== PC_ID)) continue; tx.update(d.ref, { imgLease: { by: PC_ID, name: PC_NAME, until: Date.now() + 10 * 60000 } }); mine.push({ id: d.id, ...x }); }
      return mine;
    });
  }
  function imgPub(done, total, eta, end) {
    C('rn_status').doc('img_' + PC_ID).set({ tool: '상품 수집기', pcName: LS.get('pcName', PC_ID), running: end ? null : '이미지 가져오기', state: '이미지 가져오기 (이 PC 몫)', done, total, etaMin: eta, atMs: Date.now(), ...W() }, { merge: true }).catch(() => {});
  }
  async function images() {
    if (imgRunning) return; imgRunning = true; $('[data-job="images"]').disabled = true;
    let done = 0, fail = 0; const imgT0 = Date.now(); let imgPubAt = 0;
    try {
      const total = (await C('prd_books').where('imgStatus', '==', 'pending').get()).size;
      for (;;) {
        if (stopFlag) break;
        const batch = await claimBatch(20); if (!batch.length) break;
        for (const b of batch) {
          if (Date.now() - imgPubAt > 30000) { imgPubAt = Date.now(); imgPub(done + fail, total, done ? Math.round(((Date.now() - imgT0) / done) * Math.max(0, total - done - fail) / 60000) : null); }
          const upd = { images: {} }; let ok = true;
          for (const slot of ['front', 'back', 'spine']) {
            const im = b.images && b.images[slot]; if (!im || !im.src || im.stored) continue;
            try {
              const blob = await gmBlob(im.src); const ext = (im.src.match(/\.(jpe?g|png|gif|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase();
              const base = `img/${b.id}/${slot}`; const meta = { cacheControl: 'public,max-age=31536000,immutable' };
              await storage.ref(`${base}.${ext}`).put(blob, { ...meta, contentType: blob.type || 'image/' + ext });
              let t = null; try { t = await thumb(blob, slot === 'spine' ? 60 : 200); if (t) await storage.ref(`${base}_t.webp`).put(t, { ...meta, contentType: 'image/webp' }); } catch (e) { t = null; } // 작은 사진 실패는 원본에 영향 없음
              upd.images[slot] = { src: im.src, stored: `${base}.${ext}`, thumb: t ? `${base}_t.webp` : null, bytes: blob.size ?? null, storedAt: nowIso() };
            } catch (e) { ok = false; upd.images[slot] = { src: im.src, stored: null, error: e.message }; }
          }
          await C('prd_books').doc(b.id).set({ ...upd, imgStatus: ok ? 'done' : 'error', imgLease: firebase.firestore.FieldValue.delete(), ...W() }, { merge: true });
          ok ? done++ : fail++;
          { const left = Math.max(0, total - done - fail); const el = Date.now() - imgT0; const eta = done ? (el / done) * left / 60000 : null; $('#rnpImg').textContent = `이미지(이 PC): 완료 ${done.toLocaleString()} · 실패 ${fail} · 남은 약 ${left.toLocaleString()}권${eta != null ? ` · 약 ${fmtDur(eta)} (이 PC 혼자 기준)` : ''}`; }
        }
      }
      log(`이미지 작업 종료 (이 PC 완료 ${done}, 실패 ${fail}). 다른 PC가 맡은 몫은 그 PC에서 진행됩니다`);
    } catch (e) { log('이미지 오류: ' + e.message, 1); if (/storage|bucket|403|404/i.test(e.message)) log('Firebase Storage가 아직 만들어지지 않았을 수 있습니다', 1); }
    finally { imgRunning = false; $('[data-job="images"]').disabled = false; imgPub(0, 0, null, true); }
  }

  /* ───────── 4. 판매자 평가 (만족도·코멘트·작성자·작성일) ─────────
   * 저장: seller_reviews/{sc_번호}_{연월}  평가 원본(월별 묶음, 같은 평가를 다시 받아도 중복 안 됨)
   *       seller_review_daily/{sc_번호}   날짜별 [만족, 보통, 불만족] + 기간 합계(웹앱 추이 그래프)
   *       sellers/{sc_번호}.reviewStats    최근 7일·1·3·12개월 평가 수 (웹앱 순위)
   * 상위 판매자(최근 6개월 평가·모범·불량·이득·불익 각 상위 N곳, 설정)는 매일 새 평가만 이어 받음. 처음 받는 판매자는 처음 평가까지 전부.
   * 전체 수집은 모든 판매자의 처음 평가까지. 판매자마다·쪽마다 진행 위치를 저장해 멈춰도 이어서. */
  const RSV = window.ReadnowSellers || globalThis.ReadnowSellers || null;
  const surveyUrl = (sc, page) => `/shop/UsedShop/wshopsurvey.aspx?SC=${sc}&page=${page}`;
  const rIdx = { good: 0, mid: 1, bad: 2 };
  async function sellerTargets(mode) {
    const ss = await C('sellers').get(); const arr = []; ss.forEach((d) => { const v = d.data(); if (v.sc) arr.push({ ...v, id: d.id }); });
    const recent = (s) => (RSV ? RSV.rev6m(s).n || 0 : 0); const N = Math.max(5, SET.topN || 50);
    let top = [];
    if (RSV) {
      const thr = ((await C('app_settings').doc('main').get()).data() || {}).seller || {};
      // 우리 책을 사 간 금액(이득 점수용): 판매자와 일치하는 고객들의 순매출
      const ids = [...new Set(arr.flatMap((s) => (s.linkedCustomers || []).filter((l) => RSV.linkLevel(l) === 'match').map((l) => l.customerId)))];
      const amt = new Map(); const FP = firebase.firestore.FieldPath.documentId();
      for (let i = 0; i < ids.length; i += 30) { const q = await C('crm_customers').where(FP, 'in', ids.slice(i, i + 30)).get(); q.forEach((d) => amt.set(d.id, d.data().salesAmount || 0)); }
      const sc = arr.map((s) => ({ s, x: RSV.score(s, { thresholds: thr, bought: (s.linkedCustomers || []).filter((l) => RSV.linkLevel(l) === 'match').reduce((a, l) => a + (amt.get(l.customerId) || 0), 0) }) }));
      const pick = (f, cmp) => sc.filter(f).sort(cmp).slice(0, N).map((o) => o.s.id);
      top = [...new Set([
        ...arr.filter((s) => recent(s) > 0).sort((a, b) => recent(b) - recent(a)).slice(0, N).map((s) => s.id),
        ...pick((o) => o.x.mcls === 'good', (a, b) => b.x.model - a.x.model), ...pick((o) => o.x.mcls === 'bad', (a, b) => (a.x.model ?? 0) - (b.x.model ?? 0)),
        ...pick((o) => o.x.gcls === 'good', (a, b) => b.x.gain - a.x.gain), ...pick((o) => o.x.gcls === 'bad', (a, b) => a.x.gain - b.x.gain)])];
    }
    const byId = new Map(arr.map((s) => [s.id, s]));
    if (mode === 'top') return top.map((id) => byId.get(id)).filter(Boolean);
    const rest = arr.filter((s) => !top.includes(s.id)).sort((a, b) => (Number(String(b.totalReviewCount || 0).replace(/[^\d]/g, '')) || 0) - (Number(String(a.totalReviewCount || 0).replace(/[^\d]/g, '')) || 0));
    return [...top.map((id) => byId.get(id)).filter(Boolean), ...rest];
  }
  // 한 판매자: 새 평가부터 읽어 내려가다 이미 받은 날짜(또는 기준일) 이전에 닿으면 멈춤
  async function collectSellerReviews(s, full, pos, onPage) {
    const dref = C('seller_review_daily').doc(s.id); const cur = (await dref.get()).data() || {};
    const oldDays = cur.days || {}; const lastKnown = cur.stats && cur.stats.last;
    let stopBefore;
    if (full) stopBefore = cur.complete ? lastKnown : null;                                // 전체: 처음 평가까지 (이미 전체면 새것만)
    else stopBefore = lastKnown || null; // 상위 추적: 새것만. 처음 받는 판매자는 처음 평가까지 전부
    const days = pos && pos.days ? pos.days : {}; const months = {}; let page = pos && pos.page ? pos.page : 1; let lastPage = null; let reachedEnd = false; let n = 0;
    const flush = async (final) => {
      const b = db.batch(); let w = 0;
      for (const [ym, items] of Object.entries(months)) { for (let i = 0; i < items.length; i += 400) { b.set(C('seller_reviews').doc(`${s.id}_${ym}`), { sc: s.sc, sellerId: s.id, month: ym, items: firebase.firestore.FieldValue.arrayUnion(...items.slice(i, i + 400)), ...W() }, { merge: true }); w++; } delete months[ym]; }
      // 맨 마지막 날짜는 다음 쪽에 이어질 수 있어 끝날 때만 확정
      const ks = Object.keys(days).sort(); const keep = final ? null : ks[0];
      const done = {}; ks.forEach((k) => { if (k !== keep) { done[k] = days[k]; } });
      if (Object.keys(done).length) { b.set(dref, { sc: s.sc, days: done, ...W() }, { merge: true }); w++; Object.keys(done).forEach((k) => { oldDays[k] = done[k]; delete days[k]; }); }
      if (w) await b.commit();
    };
    for (;;) {
      if (stopFlag) { await flush(false); return { paused: true, page, days }; }
      const { doc } = await getDoc(surveyUrl(s.sc, page));
      const r = RSV.parseSurveyPage(doc); lastPage = r.lastPage;
      if (!r.rows.length) { reachedEnd = true; break; }
      let stop = false;
      for (const x of r.rows) {
        if (stopBefore && x.d < stopBefore) { stop = true; break; }
        const v = days[x.d] || [0, 0, 0]; if (x.r) v[rIdx[x.r]] += 1; days[x.d] = v; n++;
        (months[x.d.slice(0, 7)] = months[x.d.slice(0, 7)] || []).push({ d: x.d, r: x.r, c: x.c, a: x.a });
      }
      onPage && onPage(page, lastPage, n);
      if (stop) break;
      if (page >= lastPage) { reachedEnd = true; break; }
      page++;
      if (page % 10 === 0) { await flush(false); await onPage(page, lastPage, n, { page, days }); }
    }
    await flush(true);
    const complete = !!cur.complete || reachedEnd; // 끝 쪽까지 읽었으면 처음 평가까지 다 받은 것
    const stats = RSV.reviewStats(oldDays);
    await dref.set({ sc: s.sc, stats, complete, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), ...W() }, { merge: true });
    await C('sellers').doc(s.id).set({ reviewStats: { ...stats, complete, at: nowIso() }, ...W() }, { merge: true });
    return { paused: false, n, stats };
  }
  async function reviewJob(mode) {
    if (!RSV) { log('판매자 점수 파일(readnow-sellers-core.js)을 불러오지 못했습니다', 1); return false; }
    const lane = await acquireLane('aladin');
    if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    const name = mode === 'top' ? 'revTop' : 'revAll';
    try {
      let prog = await loadProgress(name);
      if (!prog || !prog.list) { ui('대상 판매자 고르는 중', 0, 0); const list = (await sellerTargets(mode)).map((s) => s.id); prog = { list, i: 0, pos: null, got: 0, startedAt: nowIso() }; await saveProgress(name, prog); log(`${mode === 'top' ? '상위 판매자' : '전체 판매자'} ${list.length}곳 평가 수집 시작`); }
      const all = new Map(); (await C('sellers').get()).forEach((d) => all.set(d.id, { ...d.data(), id: d.id }));
      for (; prog.i < prog.list.length; prog.i++) {
        const s = all.get(prog.list[prog.i]); if (!s || !s.sc) continue;
        const res = await collectSellerReviews(s, mode === 'all', prog.pos, async (page, lastPage, n, pos) => {
          ui(mode === 'top' ? '상위 판매자 평가 갱신' : '판매자 평가 전체 수집', prog.i, prog.list.length, `${s.name || s.sc} · ${page}/${lastPage || '?'}쪽 · 새 평가 ${n}건`, '멈춰도 판매자·쪽 단위로 이어서 합니다');
          if (pos) { prog.pos = pos; await saveProgress(name, prog); }
        });
        if (res.paused) { prog.pos = { page: res.page, days: res.days }; await saveProgress(name, prog); throw new Error('멈춤'); }
        prog.got += res.n || 0; prog.pos = null;
        if (prog.i % 5 === 0) await saveProgress(name, prog);
      }
      await finishJob(name, { sellers: prog.list.length, reviews: prog.got });
      log(`판매자 평가 ${mode === 'top' ? '상위 갱신' : '전체 수집'} 완료: ${prog.list.length}곳, 새 평가 ${prog.got.toLocaleString()}건`);
    } finally { await releaseLane('aladin'); }
  }
  // 시험: 우리 가게 평가 1쪽을 읽어 제대로 나뉘는지 기록 칸에 보여줌 (저장 안 함)
  async function reviewTest() {
    if (!RSV) return log('판매자 점수 파일을 불러오지 못했습니다', 1);
    const { doc } = await getDoc(surveyUrl('996008', 1)); const r = RSV.parseSurveyPage(doc);
    log(`평가 시험: ${r.rows.length}건 읽음, 끝 쪽 ${r.lastPage}`);
    r.rows.slice(0, 5).reverse().forEach((x) => log(`  ${x.d} · ${({ good: '만족', mid: '보통', bad: '불만족' })[x.r] || '만족도 못 읽음'} · ${x.a || '작성자 못 읽음'} · ${String(x.c || '').slice(0, 40)}`, !x.r || !x.a));
    if (!r.rows.length) log('평가를 한 건도 못 읽었습니다. 판매자 평가 페이지 원본을 보내 주세요', 1);
  }

  /* ───────── 4-1. 판매자 최근 6개월 평가 수 (숍 첫 화면의 구매 만족도 표) ─────────
   * 평가를 하나하나 훑지 않아도 판매량을 가늠할 수 있는 값. 판매자 문서에 넣고 날짜별로 쌓음(seller_rev6m). */
  async function rev6mJob(mode) {
    if (!RSV) { log('판매자 점수 파일(readnow-sellers-core.js)을 불러오지 못했습니다', 1); return false; }
    const lane = await acquireLane('aladin');
    if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    const name = mode === 'all' ? 'rev6mAll' : 'rev6mStale';
    try {
      let prog = await loadProgress(name);
      if (!prog || !prog.list) {
        const cut = FORCE_ALL ? '9999' : new Date(Date.now() - Math.max(1, SET.rev6mDays || 7) * 864e5).toISOString();
        const arr = []; (await C('sellers').get()).forEach((d) => { const v = d.data(); if (v.sc && String(v.sc) !== '0' && (mode === 'all' || ((!v.rev6mAt || v.rev6mAt < cut) && !(v.rev6mTriedAt && v.rev6mTriedAt >= cut && v.rev6mTriedVer === RSV.VERSION && (!v.rev6mAt || v.rev6mTriedAt > v.rev6mAt))))) arr.push({ id: d.id, sc: v.sc, at: v.rev6mAt || '' }); });
        arr.sort((a, b) => String(a.at).localeCompare(String(b.at))); // 오래전에 확인한 판매자부터
        /* (1.84.8 · 정범님 10/19) 모으기 줄(app_settings/seller_queue — 클라우드·웹앱이 시장 줄에서 '판매자 기록 없음·6개월 평가 안 모음'을 만나면 넣음)을 맨 앞에 — 기록이 없던 판매자도 숍 화면을 읽어 판매자 기록을 만듦 */
        try { const qd = (await C('app_settings').doc('seller_queue').get()).data() || {}; const have = new Set(arr.map((x) => String(x.sc))); const qL = [...new Set((qd.sc || []).map(String))].filter((sc) => sc && sc !== '0' && sc !== '996008'); const front = qL.map((sc) => ({ id: 'sc_' + sc, sc, at: '0', q: 1 })); const keep = arr.filter((x) => !qL.includes(String(x.sc))); arr.length = 0; arr.push(...front, ...keep); if (qL.length) log(`6개월 평가 수: 모으기 줄 ${qL.length}곳을 먼저 (기록 없던 판매자 ${qL.filter((sc) => !have.has(sc)).length}곳 포함)`); } catch (e) { log('모으기 줄 읽기 실패: ' + e.message, 1); }
        prog = { list: arr.map((x) => `${x.id}|${x.sc}`), i: 0, got: 0, startedAt: nowIso() }; await saveProgress(name, prog); // Firebase는 배열 안의 배열을 저장 못 함 → '아이디|번호' 글자로
        log(`6개월 평가 수: 판매자 ${arr.length}곳 ${mode === 'all' ? '(전체)' : `(${SET.rev6mDays || 7}일 넘게 확인 안 한 곳)`}`);
      }
      let b = db.batch(); let w = 0; const day = nowIso().slice(0, 10);
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { if (w) await b.commit(); await saveProgress(name, prog); throw new Error('멈춤'); }
        const [id, sc] = String(prog.list[prog.i]).split('|');
        const { doc } = await getDoc(`/shop/usedshop/wshopitem.aspx?SC=${sc}`);
        const r = RSV.parseShopSummary(doc);
        if (r.status === 'ok' || r.status === 'lt3') { // lt3 = 최근 6개월 평가 3건 미만(알라딘이 '-'로 표시) — 실패가 아니라 '최근 활동 거의 없음'이라는 정보
          { const sNew = { rev6m: r.rev6m ?? null, rev6mLt3: r.rev6mLt3 ?? null, shopPeriods: r.periods ?? null, shopTotal: r.total ?? null, aladinGrade: r.grade ?? null, isPro: r.isPro ?? null, cancel3m: r.cancel3m ?? null, bizInfo: r.info || null, contactNote: r.infoNote || null };
            const sSig = JSON.stringify(sNew); const sd = (await C('sellers').doc(id).get().catch(() => null)); const sPrev = sd && sd.exists ? sd.data() : {};
            if (sPrev.shopSig !== sSig) { b.set(C('seller_history').doc(`${id}_${nowIso().replace(/[:.]/g, '-')}`), { sellerId: id, sc, kind: 'shopSummary', at: nowIso(), ...sNew, ...W() }); w++; } // 숍 화면 내용이 바뀌면 그 판을 시각과 함께 보관 (sellers 문서는 지금 값만)
            b.set(C('sellers').doc(id), { shopSig: sSig }, { merge: true }); }
          b.set(C('app_settings').doc('seller_queue'), { sc: firebase.firestore.FieldValue.arrayRemove(String(sc)) }, { merge: true }); /* (1.84.8) 모으기 줄에서 뺌 */
          b.set(C('sellers').doc(id), { sc: String(sc), rev6m: r.rev6m, rev6mLt3: r.rev6mLt3, rev6mAt: nowIso(), shopPeriods: r.periods, shopTotal: r.total, shopTotalLt3: r.totalLt3, aladinGrade: r.grade, isPro: r.isPro, cancel3m: r.cancel3m, ...(r.info ? { bizInfo: r.info } : {}), ...(r.infoNote ? { contactNote: r.infoNote } : {}), shopAt: nowIso(), ...W() }, { merge: true });
          if (r.rev6m != null) { b.set(C('seller_rev6m').doc(id), { sc, days: { [day]: r.rev6m }, ...W() }, { merge: true }); w++; }
          w++; prog.got++; if (r.status === 'lt3') prog.lt3 = (prog.lt3 || 0) + 1;
          prog.miss = 0;
        } else { prog.miss = (prog.miss || 0) + 1; log(`SC ${sc}: 숍 화면에서 구매만족도 표를 찾지 못함 (7일 뒤 다시)`, 1); b.set(C('sellers').doc(id), { rev6mTriedAt: nowIso(), rev6mTriedVer: RSV.VERSION, ...W() }, { merge: true }); w++;
          if (prog.miss >= 15 && prog.got === 0) { if (w) await b.commit(); await saveProgress(name, prog); log(`6개월 평가 수: 처음부터 ${prog.miss}곳 연속으로 못 읽었습니다. 판매자 숍 화면 구조가 바뀐 것 같아 이 단계를 멈춥니다 (판매자 숍 첫 화면 HTML 확인 필요). 나머지 판매자는 건드리지 않았고, 일괄 수집은 다음 단계로 갑니다`, 1); return 'skip'; } }
        ui(mode === 'all' ? '6개월 평가 수 (전체 판매자)' : '6개월 평가 수 (오래된 것)', prog.i + 1, prog.list.length, `SC ${sc} · ${r.grade || ''} · ${r.rev6m != null ? num6(r.rev6m) + '건' : r.status === 'lt3' ? '최근 6개월 3건 미만' : '못 읽음'}`);
        if (w >= 40) { await b.commit(); b = db.batch(); w = 0; await saveProgress(name, prog); }
      }
      if (w) await b.commit();
      await finishJob(name, { sellers: prog.list.length, got: prog.got });
      log(`6개월 평가 수 완료: ${prog.got}/${prog.list.length}곳 (그중 최근 6개월 평가 3건 미만 ${prog.lt3 || 0}곳 — 개인셀러에 많음)`);
    } finally { await releaseLane('aladin'); }
  }
  const num6 = (n) => Number(n).toLocaleString();

  /* ───────── 5. 알라딘 구매 내역 (매입 대조용) ─────────
   * 2026-03-13까지는 알라딘에서 받은 구매목록 파일로 끝. 그 뒤 주문만 주문/배송 조회에서 모아
   * 웹앱 매입 탭에서 구글 시트의 알라딘 거래와 맞춰 봄 (시트에 빠진 주문 찾기). */
  const BUY_FROM = '1990-01-01'; // 알라딘에서 산 모든 주문 (기간 제한 없음) — 알라딘 구매 풀의 근거
  const BUY_URL = 'https://www.aladin.co.kr/account/wmaininfo.aspx?pType=MyAccount&start=we';
  function parseBuyList(doc) {
    const out = [];
    doc.querySelectorAll('td.td_date').forEach((td) => {
      const tr = td.closest('tr'); const d = (td.textContent || '').trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !tr) return;
      const a = tr.querySelector('td.td_link a'); const ono = a ? (a.textContent || '').trim() : null; if (!ono) return;
      const item = tr.querySelector('.td_left_item'); const txt = item ? item.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '';
      const m = txt.match(/총\s*(\d+)\s*종\s*(\d+)\s*권[^,]*,\s*([\d,]+)\s*원/);
      const note = tr.querySelector('td.td_note'); const recvT = [...tr.querySelectorAll('td.td_date')].map((t) => t.textContent.trim()).find((t) => t && !/^\d{4}-/.test(t));
      out.push({ ono, date: d, summary: txt.replace(/\s*총\s*\d+\s*종.*$/, ''), kinds: m ? +m[1] : null, qty: m ? +m[2] : null, amount: m ? +m[3].replace(/,/g, '') : null, note: note ? note.textContent.replace(/\s+/g, ' ').trim() : null, recipient: recvT || null });
    });
    return out;
  }
  async function buyPage(page) {
    await politeWait();
    const body = new URLSearchParams({ page: String(page), searchYear: '0', searchMonth: '0', searchType: '0', searchShopType: '0', searchOrderStatus: '0' });
    const r = await fetch(BUY_URL, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const html = await r.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
    if (looksLoggedOut(r.url, doc)) { await autoRelogin(r.url, 1); return buyPage(page); }
    return doc;
  }
  // (1.34.4) 알라딘 구매 주문 표: 주문번호 → 품목 줄 있음(1)/없음(0). 7일마다 한 번 전체, 그 사이엔 uploadedAt이 바뀐 주문만 (클라우드·이 PC 모두 uploadedAt을 남김)
  async function aoIndex() { let c = null; try { c = GM_getValue('rnp-aoidx', null); } catch (e) {}
    const ms = (v) => (v.uploadedAt && v.uploadedAt.toMillis ? v.uploadedAt.toMillis() : 0);
    const full = !c || !c.m || !c.builtAt || Date.now() - c.builtAt > 7 * 864e5;
    if (full) { const s = await C('pur_aladin_orders').get(); c = { m: {}, last: 0, builtAt: Date.now() }; s.forEach((d) => { const v = d.data(); c.m[d.id] = v.lines ? 1 : 0; c.last = Math.max(c.last, ms(v)); }); log(`알라딘 구매 주문 표를 새로 만듦 (${s.size.toLocaleString()}건)`); }
    else { const s = await C('pur_aladin_orders').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis((c.last || 0) - 120000)).get(); s.forEach((d) => { const v = d.data(); c.m[d.id] = v.lines ? 1 : 0; c.last = Math.max(c.last, ms(v)); }); }
    try { GM_setValue('rnp-aoidx', c); } catch (e) {} return c; }
  async function aladinBuyJob() {
    const lane = await acquireLane('aladin');
    if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      const AX = await aoIndex(); const known = new Set(Object.keys(AX.m)); // (1.34.4) 이 PC에 둔 표 + 그 뒤 바뀐 주문만 받음 (예전: 매번 상세 글 포함 전체 수천 건)
      const metaRef = C('prd_jobs').doc('aladinBuyMeta'); const meta = (await metaRef.get()).data() || {};
      const prog = (await loadProgress('aladinBuy')) || { page: 1, got: 0, phase: 'list', startedAt: nowIso() };
      const visit = async (page) => { const doc = await buyPage(page); const rows = parseBuyList(doc); const keep = rows.filter((x) => x.date >= BUY_FROM); const fresh = keep.filter((x) => !known.has(x.ono));
        if (fresh.length) { const b = db.batch(); fresh.forEach((x) => { b.set(C('pur_aladin_orders').doc(x.ono), { ...x, collectedAt: nowIso(), ...W() }, { merge: true }); /* (1.57.2) 클라우드가 먼저 적은 상세·메모 기록(lines·noteLog)을 지우지 않게 */ known.add(x.ono); }); await b.commit(); prog.got += fresh.length; }
        return { rows, keep, fresh, first: rows[0] && rows[0].ono, last: rows.length ? rows[rows.length - 1].date : '' }; };
      if (prog.phase === 'list') {
        // ① 앞쪽: 최신 주문부터, 이미 받은 주문만 나오는 쪽에서 멈춤 (멈췄다 이어도 늘 1쪽부터 다시 봄 → 오늘 주문 놓치지 않음)
        let page = 1, prev = null;
        for (;;) { if (stopFlag) { await saveProgress('aladinBuy', prog); throw new Error('멈춤'); }
          const v = await visit(page); ui('알라딘 구매 내역: 새 주문', page, 0, `${page}쪽 · ${v.last}까지 · 새로 받은 주문 ${prog.got}건`);
          if (!v.rows.length || v.first === prev) break; prev = v.first;
          if (v.keep.length < v.rows.length) { await metaRef.set({ backfillDone: true, backfillFrom: BUY_FROM }, { merge: true }); meta.backfillDone = true; meta.backfillFrom = BUY_FROM; break; }
          if (!v.fresh.length) break; page++; }
        // ② 뒤쪽: 가장 오래된 주문까지 한 번도 끝까지 받은 적 없으면 이어서 채움 (처음 한 번만)
        // 기준일이 바뀌면(3/14 → 2025-01-01) 그 차이만큼 한 번 더 채움
        if (!(meta.backfillDone && meta.backfillFrom === BUY_FROM)) { let bp = Math.max(prog.page || 1, page + 1); log(`알라딘 구매 내역: 예전 주문 채우기 (${bp}쪽부터 가장 오래된 주문까지, 처음 한 번만)`);
          for (;;) { if (stopFlag) { prog.page = bp; await saveProgress('aladinBuy', prog); throw new Error('멈춤'); }
            const v = await visit(bp); ui('알라딘 구매 내역: 예전 주문 채우기 (처음 한 번)', bp, 0, `${bp}쪽 · ${v.last}까지 · 새로 받은 주문 ${prog.got}건`);
            if (!v.rows.length || v.first === prev || v.keep.length < v.rows.length) { await metaRef.set({ backfillDone: true, backfillFrom: BUY_FROM, backfillAt: nowIso() }, { merge: true }); break; }
            prev = v.first; bp++; if (bp % 3 === 0) { prog.page = bp; await saveProgress('aladinBuy', prog); } } }
        prog.phase = 'detail'; await saveProgress('aladinBuy', prog);
      }
      // 주문 상세: 품목·판매자 등 주요 정보를 그대로 보관 (시트에 빠진 주문을 확인할 때 씀)
      const AX2 = await aoIndex(); const need = Object.keys(AX2.m).filter((k) => !AX2.m[k]); // 품목 줄(제목·가격·수량)이 없는 주문만 — 예전에 요약만 받은 주문은 한 번 더 (클라우드가 그새 받은 것은 빠짐)
      for (let i = 0; i < need.length; i++) {
        if (stopFlag) { await saveProgress('aladinBuy', prog); throw new Error('멈춤'); }
        const { doc } = await getDoc(`https://www.aladin.co.kr/account/wordersinfo.aspx?pType=OrdersInfo&ONO=${encodeURIComponent(need[i])}`);
        const tables = [...doc.querySelectorAll('table')].map((t) => t.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()).filter((t) => /\[중고|상품명|판매자|정가|수량/.test(t));
        const items = [...doc.querySelectorAll('a[href*="wproduct.aspx"]')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 1);
        const lines = []; doc.querySelectorAll('tr[id^="ordersItem_"]').forEach((tr) => { // 실제 주문 상세 화면: 책 한 줄 = tr#ordersItem_상품번호
          const sp = tr.querySelector('.td_item span') || tr.querySelector('.td_item a.linkblue'); const raw = sp ? sp.textContent.replace(/\s+/g, ' ').trim() : ''; if (!raw) return;
          const g = raw.match(/^\[(?:온라인)?중고-([^\]]+)\]\s*/); const title = raw.replace(/^\[[^\]]*\]\s*/, '');
          const am = (tr.querySelector('.td_amount') || {}).textContent || ''; const q = (am.match(/(\d+)\s*\/\s*\d+/) || am.match(/(\d+)/) || [])[1];
          const pm = ((tr.querySelector('.td_mileage') || {}).textContent || '').match(/가격\s*:\s*([\d,]+)\s*원/);
          lines.push({ title, raw, grade: g ? g[1] : null, qty: q ? +q : 1, price: pm ? +pm[1].replace(/,/g, '') : null, itemId: (tr.id.match(/ordersItem_(\d+)/) || [])[1] || null }); });
        const sellers = [...doc.querySelectorAll('a[href*="wshopitem.aspx"]')].map((a) => ({ name: a.textContent.trim(), sc: (a.href.match(/SC=(\d+)/i) || [])[1] || null }));
        const group = [...doc.querySelectorAll('#divGroupOrderList tr')].map((tr) => { const td = tr.querySelectorAll('td'); if (td.length < 4) return null; const o = (td[0].textContent || '').trim(); if (!/^\d{3}-[A-Z]\d+/.test(o)) return null; const t2 = td[2].innerText || td[2].textContent || ''; const m = t2.match(/총\s*(\d+)\s*종\s*(\d+)\s*권[^,]*,\s*([\d,]+)\s*원/); return { ono: o, seller: (td[1].textContent || '').replace(/\s+/g, ' ').trim(), items: t2.split(/\n|총\s*\d+\s*종/)[0].replace(/\s+/g, ' ').trim().slice(0, 120), kinds: m ? +m[1] : null, qty: m ? +m[2] : null, amount: m ? +m[3].replace(/,/g, '') : null, status: (td[3].textContent || '').replace(/\s+/g, ' ').trim() }; }).filter(Boolean); /* (1.89.20) 🛒 판매자별 나뉜 주문 표 — 이 주문의 판매자(클라우드 0.30.0과 같은 방법) */ const gMe = group.find((x) => x.ono === need[i]);
        await C('pur_aladin_orders').doc(need[i]).set({ group: group.slice(0, 30), ...(gMe ? { seller: { name: gMe.seller, direct: /^알라딘$/.test(gMe.seller), store: /^중고매장\s/.test(gMe.seller) }, sellerAt: nowIso() } : {}), detailText: tables.join(' | ').slice(0, 6000) || doc.body.textContent.replace(/\s+/g, ' ').slice(0, 3000), items: [...new Set(items)].slice(0, 60), lines: lines.slice(0, 80), sellers, detailAt: nowIso(), ...W() }, { merge: true });
        ui('알라딘 주문 상세', i + 1, need.length, need[i]);
      }
      await finishJob('aladinBuy', { orders: prog.got, details: need.length });
      log(`알라딘 구매 내역: 주문 ${prog.got}건, 상세 ${need.length}건`);
    } finally { await releaseLane('aladin'); }
  }

  const CHAIN_ORDER = ['crm', 'scanNew', 'aladinBuy', 'buyback', 'market', 'nbMarket', 'bench', 'soldInfo', 'poolInfo', 'images', 'photos', 'usedInfo', 'rev6m', 'revTop', 'dynamic', 'scanFull', 'revAll'];
  const STEP_LABEL = { bench: '집중 벤치마킹 판매자', usedInfo: '경쟁 매물 유의사항·사진', crm: '고객·주문 전체', scanNew: '신규 등록분', aladinBuy: '알라딘 구매 내역', buyback: '알라딘 팔기 정산 내역', market: '도서·시장 지표', rev6m: '6개월 평가 수', revTop: '상위 판매자 평가', dynamic: '구매자 분포·함께 산 책', soldInfo: '판매완료 상품 정보', poolInfo: '알라딘 풀 도서 정보', images: '이미지', photos: '우리 상품 사진', scanFull: '등록 상품 전체 재검토', revAll: '판매자 평가 전체' , nbMarket: '새상품 없는 상품 시세' };
  /* ───────── 시작 전 점검: 대량 수집을 시작하기 전에 문제를 미리 찾음 ───────── */
  async function preflight(quiet) {
    const R = []; const add = (ok, msg, fatal) => { R.push({ ok, msg, fatal }); window.__rnLog && window.__rnLog('점검', ok ? 'ok' : fatal ? 'err' : 'warn', `${ok ? '✓' : fatal ? '✗' : '!'} ${msg}`); };
    add(!!(window.__rnPcName && window.__rnPcName.get()), `PC 이름: ${(window.__rnPcName && window.__rnPcName.get()) || '없음 — 패널의 PC 이름을 정해 주세요'}`, true);
    const u = auth.currentUser; const prov = u ? (u.providerData || []).map((x) => (x.providerId === 'password' ? '이메일·비밀번호' : x.providerId === 'google.com' ? '구글' : x.providerId)).join('+') : '';
    add(!!u, `Firebase 로그인: ${u ? `${u.email} · 방식 ${prov || '?'} · 이메일 인증 ${u.emailVerified ? '됨' : '안 됨'}` : '안 됨'}`, true);
    { const tests = [['기존 컬렉션 읽기 (prd_jobs)', () => C('prd_jobs').limit(1).get()], ['기록 쓰기 (rn_logs)', () => C('rn_logs').doc('_check').set({ at: Date.now(), by: PC_NAME }, { merge: true })], ['알라딘 팔기 읽기 (pur_buyback)', () => C('pur_buyback').limit(1).get()], ['분류 읽기 (prd_cat_manual)', () => C('prd_cat_manual').limit(1).get()]];
      const bad = []; for (const [n, f] of tests) { try { await f(); } catch (e) { bad.push(`${n}: ${e.code || e.message}`); } }
      add(!bad.length, bad.length ? `Firebase 규칙에서 막힘 — ${bad.join(' / ')}` : 'Firebase 규칙: 기존·새 컬렉션 모두 읽기·쓰기 됨', false); }
    try { const g = await getDoc('https://www.aladin.co.kr/account/wmaininfo.aspx?pType=MyAccount&start=we'); add(!looksLoggedOut(g.finalUrl, g.doc), `알라딘 로그인: ${looksLoggedOut(g.finalUrl, g.doc) ? '풀림 — 자동 재로그인 정보(아이디·비밀번호) 확인' : '됨'}`, false); } catch (e) { add(false, `알라딘 접속: ${e.message}`, false); }
    try { const v0 = (await C('crm_system').doc('collector_version').get()).data() || {}; const v = { ver: Object.entries(v0).reduce((m, [k, x]) => (/^h_/.test(k) && x && x.ver && verNum(x.ver) > verNum(m) ? x.ver : m), v0.ver || null) }; add(!v.ver || verNum(v.ver) <= verNum(VER), `수집기 버전: 이 PC ${VER}${v.ver && verNum(v.ver) > verNum(VER) ? ` · 더 새 버전 ${v.ver} 있음 (쉬는 사이에 바뀜)` : ' (최신)'}`); } catch (e) {}
    try { const li = await window.__rnCrm.localInfo(); add(true, `고객·주문 기록(이 PC): 상세 ${li.pops.toLocaleString()}건 · 목록 줄 ${li.lines.toLocaleString()} · 고객 일괄 끝까지 ${li.complete ? '한 적 있음' : '없음'} → 고객 단계는 서버 기준으로 이미 받은 주문을 건너뜀`); } catch (e) {}
    { const m = window.__rnLoginMethod ? window.__rnLoginMethod() : 'naver'; const need = GM_getValue('rnu-need-naver', 0), okAt = GM_getValue('rnu-naver-okAt', 0); add(!(m === 'naver' && need && need > okAt), `다시 로그인 방식: ${m === 'naver' ? '네이버로 로그인' : '알라딘 아이디(자동입력방지 때문에 자동이 안 될 수 있음)'}${m === 'naver' && need && need > okAt ? ' — ⚠ 네이버 로그인 필요' : ''}`, false); }
    add(!OLD_FILES.length, OLD_FILES.length ? `GitHub 공용 파일이 옛 버전: ${OLD_FILES.map(([k, v, w]) => `${k} ${v || '못 읽음'} (필요 ${w} 이상)`).join(', ')} — 새 파일을 올려야 정확히 읽음` : `공용 파일 버전 맞음 (${Object.entries(NEED_FILES).map(([k, [g]]) => `${k.split(' ')[1]} ${g()}`).join(' · ')})`, true);
    { const du = GM_getValue('rnu-drive-url', ''); if (!du) add(false, '작업 기록 구글 드라이브 저장: 주소 없음 (웹앱 설정 ⑨ — 없으면 PC로 내려받음)', false);
      else { const ok = await new Promise((res) => GM_xmlhttpRequest({ method: 'GET', url: du, timeout: 20000, onload: (r) => res(/리드나우 기록 저장 준비됨/.test(r.responseText || '')), onerror: () => res(false), ontimeout: () => res(false) })); add(ok, ok ? '작업 기록 구글 드라이브 저장: 연결됨' : '작업 기록 구글 드라이브 저장: 주소는 있으나 응답 확인 안 됨 (Apps Script에 doGet 추가 후 새 버전으로 다시 배포)', false); } }
    add(true, `잠금 묶음: ${lockGroup()} · 같은 묶음 동시 PC ${SET.maxLanes || 1}대(로그인 줄) · 🌐 공개 읽기 줄 ${pubMax()}대 · 남는 PC 돕기 ${(() => { try { return pubHelpOn() ? '켬' : '끔'; } catch (e) { return '?'; } })()} · 알라딘 요청 간격 자동 조절 지금 ${PACE.state().gap}ms (최소 ${SET.reqMinMs} · 최대 ${SET.reqMaxMs})`);
    try { const lk = (await LOCK().get()).data(); const pcs = freshPcs(lk, Date.now()); delete pcs[PC_ID]; const others = Object.values(pcs).map((x) => `${x.name}(${x.job || ''})`); if (legacyOther(lk, Date.now())) others.push(`${lk.pcName}(${lk.taskLabel})`); add(true, `같은 묶음에서 지금 도는 다른 PC: ${others.join(', ') || '없음'}`); } catch (e) {}
    try { const st = (SET.steps || {}); add(true, `일괄 단계 켬: ${Object.keys(STEP_LABEL).filter((k) => st[k] !== false).map((k) => STEP_LABEL[k]).join(' · ')}`); } catch (e) {}
    const fatal = R.filter((r) => !r.ok && r.fatal); const warn = R.filter((r) => !r.ok && !r.fatal);
    log(`시작 전 점검: ${fatal.length ? `✗ 꼭 고칠 것 ${fatal.length}` : '✓ 시작 가능'}${warn.length ? ` · 확인할 것 ${warn.length}` : ''} (자세한 내용은 기록 창)`, fatal.length || warn.length);
    if (!quiet && (fatal.length || warn.length)) (window.__rnHuman(8000) ? alert : (m) => window.__rnNote(m, fatal.length ? 'err' : 'warn'))(`시작 전 점검\n\n${R.map((r) => `${r.ok ? '✓' : r.fatal ? '✗' : '!'} ${r.msg}`).join('\n')}`);
    return !fatal.length;
  }
  /* ───────── 알라딘 구매 풀: 아직 연결되지 않은(미규명) 책의 도서 정보·시장 지표·이미지 ─────────
   * 대상: 수집한 알라딘 주문의 책 줄(상품번호 있음) 중 ① 등록·판매 상품과 연결 안 됨 ② 그 책의 도서 정보를 아직 안 받음 (취소·반품 주문 제외)
   * 방법: 등록 상품과 똑같이 새상품 페이지 → 도서 정보(분류·정가·사진 등) + 온라인 중고 시세. 상품(listing) 기록은 만들지 않음. */
  async function poolInfoJob() {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      let prog = await loadProgress('poolInfo');
      if (!prog || !prog.list) {
        const linked = new Set(); (await C('pur_matches').get()).forEach((d) => { const m = d.data(); if (m.itemKey && m.kind !== 'none' && String(m.itemKey).startsWith('ao_')) linked.add(m.itemKey); });
        const have = new Set(); const missCut = FORCE_ALL ? '9999' : new Date(Date.now() - 30 * 864e5).toISOString(); (await C('prd_ids').where(firebase.firestore.FieldPath.documentId(), '>=', 'itemId_').where(firebase.firestore.FieldPath.documentId(), '<', 'itemId`').get()).forEach((d) => { const v = d.data(); if (v.bookId || v.poolLine || (v.poolMissAt && v.poolMissAt > missCut)) have.add(d.id.slice(7)); });
        const list = []; const seen = new Set();
        (await C('pur_aladin_orders').get()).forEach((d) => { const o = d.data(); if (/취소|반품|환불/.test(`${o.note || ''} ${o.status || ''}`)) return;
          (o.lines || []).forEach((x, i) => { if (!x.itemId || linked.has(`ao_${d.id}#${i}`) || have.has(String(x.itemId)) || seen.has(String(x.itemId))) return; seen.add(String(x.itemId)); list.push(`${x.itemId}|${String(x.title || '').slice(0, 60)}`); }); });
        prog = { list, i: 0, ok: 0, fail: 0, startedAt: nowIso() }; await saveProgress('poolInfo', prog);
        log(`알라딘 구매 풀(미연결) 도서 정보: ${list.length.toLocaleString()}권 (연결된 책·이미 정보가 있는 책은 뺌)`);
      }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('poolInfo', prog); throw new Error('멈춤'); }
        const [itemId, title] = String(prog.list[prog.i]).split('|');
        try { await refreshOne({ pool: true, listingId: itemId, title }, null); prog.ok++; await C('prd_ids').doc('itemId_' + itemId).set({ poolLine: true, poolInfoAt: nowIso(), ...W() }, { merge: true }); }
        catch (e) {
          let alt = null;
          if (/찾지 못함/.test(e.message) && title) { try { const sr = await getDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${encodeURIComponent(title)}`);
            const c = P.parseSearchResults(sr.doc).map((r) => ({ ...r, cov: P.nameCoverage(title, r.title) })).filter((r) => r.cov >= (SET.photoMatch ?? 0.9) && String(r.itemId) !== String(itemId)).sort((a, b) => (a.used ? 1 : 0) - (b.used ? 1 : 0) || b.cov - a.cov)[0];
            if (c) { await refreshOne({ pool: true, listingId: c.itemId, title }, null); alt = c; } } catch (e2) {} }
          if (alt) { prog.ok++; prog.viaSearch = (prog.viaSearch || 0) + 1; await C('prd_ids').doc('itemId_' + itemId).set({ poolLine: true, poolInfoAt: nowIso(), poolVia: { itemId: alt.itemId, title: alt.title, cov: Math.round(alt.cov * 1000) / 1000 }, ...W() }, { merge: true }); }
          else { prog.fail++; if (prog.fail <= 30) log(`풀 도서 ${title || itemId}: ${e.message} (상품명 검색 90%↑도 없음 · 30일 뒤 다시)`, 1); await C('prd_ids').doc('itemId_' + itemId).set({ poolMissAt: nowIso(), ...W() }, { merge: true }).catch(() => {}); } }
        ui('알라딘 구매 풀 도서 정보', prog.i + 1, prog.list.length, `${title || itemId} · 성공 ${prog.ok} · 실패 ${prog.fail}`);
        if (prog.i % 10 === 0) await saveProgress('poolInfo', prog);
      }
      await finishJob('poolInfo', { ok: prog.ok, fail: prog.fail, viaSearch: prog.viaSearch || 0 }); log(`알라딘 구매 풀 도서 정보 완료: 성공 ${prog.ok} (그중 상품명 검색으로 찾음 ${prog.viaSearch || 0}), 실패 ${prog.fail} (이미지는 '이미지' 단계에서)`);
    } finally { await releaseLane('aladin'); }
  }
  /* ───────── 🎯 집중 벤치마킹 (1.46.0): 관리자가 고른 판매자(웹앱 경영 → 집중 벤치마킹 · app_settings/bench.targets)의 알라딘 중고샵 목록 전체를 하루 한 번 끝까지 읽음 ─────────
   * 화면 (1.48.0): /shop/usedshop/wshopitem.aspx?SC=판매자&ViewType=Simple&ViewRowsCount=48&SortOrder=6&page=N (간단히 보기 · 한 쪽 48개 · 등록순) — 10쪽마다 진행 저장(멈춰도 그 쪽부터 이어감) · 끝 쪽까지(상한 없음)
   * 한 바퀴가 끝나면 어제 목록과 견줌: 새로 보인 것 = 새로 올린 상품(첫 바퀴는 '처음부터 있던 것'으로만 표시) · 안 보이게 된 것 = 사라짐(팔렸거나 내림) · 값이 바뀐 것
   * 저장: bench_items/{판매자_상품번호}(처음 본 날·사라진 날·값 바뀜 — 덮어쓰지 않고 덧붙임) · bench_days/{판매자_날짜}(하루 요약 + 새로 올린 것·사라진 것 목록) · bench_state/{판매자}/c/*(지금 목록 — 다음 비교용)
   *       bench_probe/{판매자}(첫 쪽 화면 일부와 읽은 결과 — 화면 모양이 다르면 웹앱에 '읽기 확인 필요'로 뜸) */
  const kDayB = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  /* (1.48.0) 정범이 저장해 준 15개 숍 화면(2026-10-09)으로 맞춤: 숍 기본 화면은 '간단히 보기'(ViewType=Simple) · 한 쪽 24개 또는 48개(화면의 개수 고르기와 같은 값) · 등록순(SortOrder=6)
   * 48개로 읽으면 쪽 수가 반으로 줄어듦 (예: 우리집은도서관 4,076쪽 → 약 2,038쪽) */
  const benchUrl = (sc, page, rows) => `/shop/usedshop/wshopitem.aspx?SC=${encodeURIComponent(sc)}&ViewType=Simple&ViewRowsCount=${rows || 48}&SortOrder=6&page=${page}`;
  /* (1.55.0) ⏱ 한 쪽에 더 많이 — 숍 화면의 개수 고르기는 24·48뿐이지만 주소의 ViewRowsCount를 서버가 더 크게 받아 주면 쪽 수(=요청 수·시간·트래픽)가 그만큼 줄어듦.
   *  판매자마다 200 → 100 순으로 1쪽을 열어 보고, 48개 쪽들(필요한 만큼)과 상품·값·상태·배지 등 '읽어 낸 내용 전부'가 순서까지 똑같을 때만 그 크기를 씀 — 하나라도 다르면 48개 그대로(빠뜨리지 않게)
   *  결과는 bench_state.rows에 남기고 7일마다 다시 확인 · 작은 숍(2쪽 이하)은 확인하지 않음 */
  async function benchRowsPick(sc, name, st) { const R0 = st.rows; if (R0 && R0.size && R0.at && Date.now() - Date.parse(R0.at) < 7 * 864e5) return R0.size; if ((st.lastPage || 0) && st.lastPage <= 2) return 48;
    const key = (x) => [x.id, x.p, x.g, x.t, x.pl, x.low ? 1 : 0, x.uc || null, x.au || null, x.cov || null]; let pick = 48, why = ''; const t0 = Date.now();
    for (const S of [200, 100]) { let A; try { A = benchParse((await getDoc(benchUrl(sc, 1, S))).doc); } catch (e) { if (e.message === '멈춤') throw e; why = `${S}개: 읽기 실패 ${e.message}`; continue; }
      if (A.length <= 48) { why = `${S}개로 열어도 한 쪽 ${A.length}개 (서버가 안 받아 줌)`; continue; }
      const B = []; try { for (let k = 1; B.length < A.length && k <= Math.ceil(A.length / 48) + 1; k++) B.push(...benchParse((await getDoc(benchUrl(sc, k, 48))).doc)); } catch (e) { if (e.message === '멈춤') throw e; why = `48개 쪽 대조 실패 ${e.message}`; continue; }
      const same = JSON.stringify(A.map(key)) === JSON.stringify(B.slice(0, A.length).map(key));
      if (same) { pick = A.length >= S ? S : A.length; why = `${S}개로 열면 한 쪽 ${A.length}개 — 48개 쪽 ${Math.ceil(A.length / 48)}개와 내용이 똑같음`; break; } why = `${S}개 쪽과 48개 쪽 내용이 다름(대조하는 사이 숍이 바뀌었을 수 있음) — 48개 그대로`; }
    try { await C('bench_state').doc(sc).set({ rows: { size: pick, at: nowIso(), why, sec: Math.round((Date.now() - t0) / 1000) } }, { merge: true }); } catch (e) {}
    log(`🎯 '${name}': 한 쪽 개수 ${pick}개로 읽음 — ${why}`); return pick; }
  /* 표지 그림 파일 이름(예: 8963718182_1.jpg → '8963718182') — ISBN처럼 보이지만 늘 ISBN이라는 확인이 없어 ISBN 칸에 넣지 않고 그대로 보관만 함(나중에 우리 상품과 견줘 확인되면 씀) */
  const coverKey = (src) => (String(src || '').match(/(?:^|\/)([0-9A-Za-z]{8,13})_\d+\.(?:jpe?g|gif|png)/i) || [])[1] || null;
  /* 숍 화면의 끝 쪽 번호 ('끝' 단추 · 없으면 보이는 쪽 번호 중 가장 큰 것) */
  const benchLastPage = (doc, html) => { const h = String(html || (doc && doc.documentElement ? doc.documentElement.innerHTML : '')); const m = h.match(/Page_Set\('(\d+)'\)"?[^>]*>\s*끝/); if (m) return +m[1]; let mx = 0; h.replace(/Page_Set\('(\d+)'\)/g, (a, n) => { mx = Math.max(mx, +n); return a; }); return mx || null; };
  /* 간단히 보기 한 칸: [중고-상] 제목(a.bo) · 지은이 | 출판사 · 정가<span class="">N</span>원→<span class="p1_bold">판매가</span> · 장바구니 네모 chkCart.U… · '최저가' used_label_04 */
  function benchParseSimple(doc) { const out = []; const seen = new Set();
    for (const cb of doc.querySelectorAll('input[name^="chkCart.U"]')) { const cell = cb.closest('td[width="25%"]') || cb.closest('td[valign="top"]'); if (!cell) continue; const a = cell.querySelector('a.bo[href*="ItemId="]') || cell.querySelector('a[href*="ItemId="]'); if (!a) continue;
      const id = (String(a.getAttribute('href') || '').match(/[?&]ItemId=(\d+)/i) || [])[1]; if (!id || seen.has(id)) continue; seen.add(id); const T = (cell.textContent || '').replace(/[\u00a0\s]+/g, ' ');
      const g = (T.match(/\[\s*중고\s*-\s*(최상|상|중|하)\s*\]/) || [])[1] || null; const pb = cell.querySelector('.p1_bold'); const p = pb ? +String(pb.textContent).replace(/[^\d]/g, '') || null : null;
      let pl = null; const arrow = [...cell.querySelectorAll('span')].find((x) => !x.className && /^[\d,]+$/.test((x.textContent || '').trim()) && /^\s*원\s*→/.test((x.nextSibling && x.nextSibling.nodeValue) || '')); if (arrow) pl = +arrow.textContent.replace(/[^\d]/g, '');
      const gw = cell.querySelector('.gw'); const au = gw ? gw.textContent.replace(/[\u00a0\s]+/g, ' ').trim().slice(0, 80) : '';
      const img = cell.querySelector('img[src*="_"]'); const cov = img ? coverKey(img.getAttribute('src')) : null; const isbn = null; const low = !!cell.querySelector('.used_label_04');
      out.push({ id, ids: [id], t: (a.textContent || '').replace(/[\u00a0\s]+/g, ' ').trim().slice(0, 120), p, pl, g, isbn, ym: null, low, uc: cb.name.slice(8), au, cov, g0: /\[\s*중고\s*\]/.test(T) && !g }); }
    return out; }
  function benchParse(doc) { const S0 = benchParseSimple(doc); if (S0.length) return S0; /* 간단히 보기가 아니면(자세히 보기 등) 예전처럼 상자 단위로 */ const idOf = (a) => (String(a.getAttribute('href') || '').match(/[?&]ItemId=(\d+)/i) || [])[1] || null; const A = [...doc.querySelectorAll('a[href*="ItemId="]')].filter((a) => /wproduct\.aspx/i.test(a.getAttribute('href') || ''));
    const out = []; const done = new Set(); const txt = (el) => { if (!el) return ''; const w = doc.createTreeWalker(el, 4); const P = []; for (let n = w.nextNode(); n; n = w.nextNode()) P.push(n.nodeValue); return P.join(' ').replace(/[\u00a0\s]+/g, ' ').trim(); }; /* 글 조각 사이에 빈칸 (줄바꿈 태그로 붙은 글자가 섞이지 않게) */
    for (const a of A) { const id = idOf(a); if (!id || done.has(id)) continue;
      let box = a.closest('.ss_book_box') || null; if (!box) { for (let el = a.parentElement, k = 0; el && el !== doc.body && k < 14; el = el.parentElement, k++) { const ids = new Set([...el.querySelectorAll('a[href*="ItemId="]')].map(idOf).filter(Boolean)); if (ids.size > 3) break; box = el; if (/[\d,]{3,}\s*원/.test(txt(el)) && el.querySelectorAll('a[href*="ItemId="]').length) break; } }
      if (!box) continue; const T = txt(box); if (!/[\d,]{3,}\s*원/.test(T)) continue; const bIds = [...new Set([...box.querySelectorAll('a[href*="ItemId="]')].map(idOf).filter(Boolean))]; bIds.forEach((x) => done.add(x));
      const cnt = new Map(); [...box.querySelectorAll('a[href*="ItemId="]')].forEach((x) => { const i = idOf(x); if (i) cnt.set(i, (cnt.get(i) || 0) + 1 + txt(x).length / 1000); }); const main = [...cnt.entries()].sort((p, q) => q[1] - p[1])[0][0];
      const title = [...box.querySelectorAll(`a[href*="ItemId=${main}"]`)].map(txt).sort((p, q) => q.length - p.length)[0] || '';
      const prices = []; T.replace(/(.{0,8}?)([\d,]{3,})\s*원/g, (m0, pre, n) => { prices.push({ v: +n.replace(/,/g, ''), list: /정가/.test(pre) }); return m0; });
      const used = prices.filter((x) => !x.list && x.v >= 100); const list = prices.find((x) => x.list);
      const gm = T.match(/\[\s*중고\s*-?\s*(최상|상|중|하)\s*\]/) || T.match(/(?:품질|상태|등급)\s*[:：]?\s*(최상|상|중|하)(?![가-힣])/) || T.match(/(?:^|\s)(최상|상|중|하)\s*(?:등급|급)(?:\s|$)/);
      const isbn = (box.innerHTML.match(/\b(97[89]\d{10})\b/) || [])[1] || null; const ym = T.match(/(19|20)(\d{2})\s*년\s*(\d{1,2})\s*월/);
      const low = !!box.querySelector('.used_label_04') || [...box.querySelectorAll('span,em,b,i')].some((e) => /^\s*최저가\s*$/.test(e.textContent || '')); /* (1.48.0) '최저가' 표시 = 온라인 중고 목록 맨 위(그때 같은 상품 경쟁 매물 중 가장 쌈) */
      out.push({ id: main, ids: bIds, t: title.replace(/^\[중고[^\]]*\]\s*/, '').slice(0, 120), p: used.length ? used[0].v : null, pl: list ? list.v : null, g: gm ? gm[1] : null, isbn, ym: ym ? `${ym[1]}${ym[2]}-${String(ym[3]).padStart(2, '0')}` : null, low }); }
    return out; }
  /* (1.53.0) 🎯 집중 벤치마킹 — 그룹·주기(app_settings/bench.groups · 기준은 노선표 readnow-registry.js BENCH 한 곳)
   *  할 차례(due)인 판매자만 위 그룹부터·그룹 안 위에서부터 하나씩 → 한 판매자를 끝낼 때마다 차례를 다시 계산(그사이 짧은 주기 그룹이 차례가 되면 그쪽 먼저)
   *  수동(수집기 단추·'다시 받기'로 FORCE_ALL)은 차례와 상관없이 모두 */
  const BREG = () => window.ReadnowRegistry || globalThis.ReadnowRegistry || null; let BENCH_CFG = {};
  /* (1.63.9) 📍 이어 읽기·통계 기준(웹앱 🎯 → ⚙ 이어 읽기 기준 · app_settings/bench.resume) — 기본: 마지막 상품 10개 · 순서대로 7개 이상 · 앞뒤 3쪽 · 숍의 50% 넘게 읽어야 통계 */
  const benchResumeCfg = () => { const r = (BENCH_CFG && BENCH_CFG.resume) || {}; const n = Math.max(3, Math.min(30, Math.round(+r.n || 10))); return { n, match: Math.max(2, Math.min(n, Math.round(+r.match || Math.ceil(n * 0.7)))), pages: Math.max(1, Math.min(10, Math.round(+r.pages || 3))), cover: Math.max(0.1, Math.min(0.95, (+r.cover || 50) / 100)) }; };
  const benchStates = async (T) => { const out = {}; const sts = await Promise.all(T.map((t) => C('bench_state').doc(String(t.sc)).get().then((d) => d.data() || {}).catch(() => ({})))); T.forEach((t, i) => (out[String(t.sc)] = sts[i])); return out; };
  /* (1.56.1) 🎯 강제 실행(benchForce): 주기·'끝난 지 20시간' 규칙과 상관없이 고른 판매자 목록의 맨 처음 판매자부터 차례로 모두 읽음
   *  진행은 서버 prd_jobs/benchForce에 {startedAt, list}로 — 멈췄다 이어하면(멈춘 작업 목록 · 다시 누름 · 3일 안) 이번 강제 실행이 시작된 뒤에 끝난 판매자는 건너뛰고 다음 판매자부터
   *  한 판매자 안에서는 평소처럼: 그 판매자의 회차가 시작한 지 20시간 안이고 아직 안 끝났으면 그 쪽부터 이어 읽고, 끝났으면 새 회차 */
  /* (1.60.0) 읽을 판매자 = 따라가는(on) 판매자 − 우리 숍 − 꺼진 그룹의 판매자 (웹앱 🎯 그룹 머리의 켜기·끄기 · '그룹 없음'은 bench.noneOff)
   *  주기 수집·강제 실행·상품 페이지 정보 모두 이 목록만 — 꺼진 그룹의 판매자는 모두 건너뜀(모은 기록은 그대로) */
  function benchOffSet(cfg) { const inG = new Set(), off = new Set(); for (const g of (cfg && cfg.groups) || []) { if (!g || !g.id) continue; for (const sc of (g.scs || []).map(String)) { if (inG.has(sc)) continue; inG.add(sc); if (g.off) off.add(sc); } }
    if (cfg && cfg.noneOff) for (const t of cfg.targets || []) if (t && t.sc && !inG.has(String(t.sc))) off.add(String(t.sc)); return off; }
  function benchTargets(cfg) { const off = benchOffSet(cfg); return ((cfg && cfg.targets) || []).filter((t) => t && t.sc && t.on !== false && !t.self && String(t.sc) !== '996008' && !off.has(String(t.sc))); }
  /* (1.60.1) 판매자마다 걸린 시간 기록(⏰ 시간표의 판매자별 칸막이·한 바퀴 예상) — 하던 회차를 이어 읽은 것은 '일부'라 평균에서 뺌 */
  /* (1.63.12) 🎯 판매자 단위로 나눠 읽기 — 읽기 전에 prd_jobs/bclaim_판매자를 잡음(먼저 잡은 PC만 · 1분마다 신호 · 4분 끊기면 다른 PC가 이어받음).
   *  이미 다른 PC가 잡았거나, 이번 실행 중에 다른 PC가 그 판매자를 끝냈으면 건너뜀(같은 숍을 두 PC가 함께 읽어 서로 덮지 않게) */
  const BCL = (sc) => C('prd_jobs').doc('bclaim_' + String(sc)); let BENCH_T0 = 0;
  async function benchClaim(sc) { let ok = false, who = null; try { await db.runTransaction(async (tx) => { ok = false; who = null; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const d = (await tx.get(BCL(sc))).data(); if (d && d.pc && d.pc !== PC_ID && Date.now() - (d.at || 0) < 4 * 60e3) { who = d.name || '다른 PC'; return; } tx.set(BCL(sc), { pc: PC_ID, name: PC_NAME, tab: TAB_ID, at: Date.now(), since: nowIso(), ...W() }); ok = true; }); } catch (e) { ok = true; /* 확인을 못 하면 예전처럼 읽음 */ } return { ok, who }; }
  const benchUnclaim = (sc) => db.runTransaction(async (tx) => { const d = (await tx.get(BCL(sc))).data(); if (d && d.pc === PC_ID) tx.set(BCL(sc), { pc: null, at: 0, doneAt: nowIso(), by: PC_NAME }, { merge: true }); }).catch(() => {});
  async function benchOneT(t, resumed) { const cl = await benchClaim(t.sc); if (!cl.ok) { log(`🎯 '${t.name || t.sc}' — ${cl.who}가 읽는 중이라 건너뜀(나눠 읽기)`); return 'claimed'; }
    try { const st0 = (await C('bench_state').doc(String(t.sc)).get()).data() || {}; if (BENCH_T0 && !st0.prog && st0.endAt && Date.parse(st0.endAt) > BENCH_T0 && st0.writer && st0.writer !== PC_NAME) { await benchUnclaim(t.sc); log(`🎯 '${t.name || t.sc}' — 이번 실행 중에 ${st0.writer}가 이미 끝냄 → 건너뜀`); return 'claimed'; } } catch (e) {}
    const hbC = setInterval(() => BCL(t.sc).set({ at: Date.now() }, { merge: true }).catch(() => {}), 60e3); try { return await benchOneT0(t, resumed); } finally { clearInterval(hbC); await benchUnclaim(t.sc); } }
  async function benchOneT0(t, resumed) { const tB = Date.now(); window.__rnBenchCur = String(t.sc); /* (1.63.2) 지금 이 탭이 읽는 판매자 — 버리기 막기는 이 판매자만 */ try { const r = await benchOne(t); if (r === 'partial') window.__rnCS && window.__rnCS.add('bench', 'part', 1, '쪽을 못 읽어 회차를 못 끝냄 — 다음에 그 쪽부터 이어 읽음'); try { window.__rnJobDone && window.__rnJobDone('bench:' + String(t.sc), Date.now() - tB, r === 'partial' ? 'error' : resumed ? 'part' : 'done'); } catch (x) {} return r; } /* (1.63.6) 쪽을 못 읽어 회차를 못 끝냈으면 'partial' — 끝낸 것으로 치지 않음 */
    catch (e) { try { window.__rnJobDone && window.__rnJobDone('bench:' + String(t.sc), Date.now() - tB, e && e.message === '멈춤' ? 'stop' : 'error'); } catch (x) {} throw e; } finally { if (window.__rnBenchCur === String(t.sc)) window.__rnBenchCur = null; } }
  const benchLightTxt = (L) => (!L ? '' : L.by === 'w' && (L.wd || []).length ? '매주 ' + L.wd.map((d) => '일월화수목금토'[d]).join('·') + '요일' : `${L.fullDays || 7}일에 한 번`); /* (1.76.0) */
  async function benchJob(opt) { const FORCE = !!(opt && opt.force); const HELP = !!(opt && opt.helper); BENCH_T0 = Date.now(); const claimedSkip = new Set(); const cfg = (await C('app_settings').doc('bench').get()).data() || {}; BENCH_CFG = cfg; const T = benchTargets(cfg); /* (1.57.6) 우리 숍(북스킹)은 읽지 않음 — 웹앱 우리 카드는 우리 기록으로 셈 */ const RB = (BREG() || {}).BENCH;
    { const offN = benchOffSet(cfg).size; if (offN) log(`🎯 꺼진 그룹의 판매자 ${offN}명은 건너뜀 (웹앱 🎯 그룹 머리의 토글)`); }
    if (!T.length) { log('집중 벤치마킹: 읽을 판매자 없음 — 고른 판매자가 없거나 모든 그룹이 꺼짐 (웹앱 경영 탭 → 🎯 집중 벤치마킹)'); return; }
    if (!RB) { log('집중 벤치마킹: 공용 노선표(readnow-registry.js 0.13.0 이상)가 없어 수집 차례를 못 정함 — 수집기를 새로 고치세요', 1); return; }
    /* (1.63.0) 📅 그룹 읽는 날(매주 요일 · 매월 날·기간 — 웹앱 🎯 그룹 머리) — 오늘이 아닌 그룹은 차례에서 빠짐(노선표 0.14.12 BENCH.plan) · 강제 실행 목록에서도 뺌 · 하던 회차는 이어서 */
    const restS = new Set(); if (RB.schedOk) { const rg = []; for (const g of RB.groups({ ...cfg, targets: T })) if (g.sched && !RB.schedOk(g.sched, Date.now())) { g.scs.forEach((sc) => restS.add(sc)); rg.push(`${g.name}(${RB.schedTxt(g.sched)})`); } if (restS.size) log(`🎯 📅 오늘 읽는 날이 아닌 그룹 ${rg.length}개 · 판매자 ${restS.size}명은 오늘 건너뜀: ${rg.join(', ')}`); }
    const TF = T.filter((t) => !restS.has(String(t.sc)));
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    const byS = new Map(T.map((t) => [String(t.sc), t])); const done = new Set(); const bad = []; const wantDetail = RB.needsDetail(cfg); BENCH_DEFER_DETAIL = wantDetail; let listDone = false;
    let FJ = null, keep0 = false; try { /* (1.63.6 전체 점검) 알라딘 차례를 잡은 뒤의 서버 읽기·쓰기가 실패해도 차례를 반드시 놓음 — 예전엔 놓지 않아 다른 PC가 모두 멈췄음 */ if (FORCE) { const fref = C('prd_jobs').doc('benchForce'); const old = (await fref.get()).data(); const keep = !(opt && opt.fresh) && old && old.done === false && old.startedAt && Date.now() - Date.parse(old.startedAt) < 3 * 864e5; /* (1.60.1) fresh = 처음 판매자부터 다시 */
      const only = opt && opt.only ? String(opt.only) : null; /* (1.63.6) 판매자 한 줄의 이어하기 — 멈춘 강제 실행이 없으면 그 판매자만(다른 판매자를 다시 읽지 않음) */
      if (HELP && !keep) { log('🌐 돕기: 다른 PC가 하던 🎯 한 바퀴가 이미 끝남 — 돕지 않음'); await releaseLane('aladin'); return 'skip'; } keep0 = !!keep; FJ = keep ? old : { startedAt: nowIso(), list: only && byS.has(only) ? [only] : TF.map((t) => String(t.sc)), done: false, by: PC_NAME, ...(only ? { only } : {}) }; if (!keep) await fref.set({ ...FJ, savedAt: Date.now(), ...W() }); else { FJ.list = [...new Set([...(FJ.list || []), ...TF.map((t) => String(t.sc))])].filter((sc) => byS.has(sc)); if (only && FJ.list.includes(only)) FJ.list = [only, ...FJ.list.filter((x) => x !== only)]; }
      FJ.fin = FJ.fin || {}; /* (1.63.5) 이번 강제 실행에서 끝낸(또는 버리기로 건너뛴) 판매자 — 서버에 하나씩 적어 이어하기 때 확실히 건너뜀 */
      const nm0 = (sc) => (byS.get(sc) || {}).name || sc; const finL = FJ.list.filter((sc) => FJ.fin[sc]);
      log(keep ? `🎯 강제 실행 이어서 (${new Date(Date.parse(FJ.startedAt) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')} 시작한 것) — 판매자 ${FJ.list.length}명 중 끝낸 것·남은 차례는 아래 줄` : `🎯 강제 실행 시작 — 주기와 상관없이 맨 처음 판매자부터: ${FJ.list.map(nm0).join(' → ')}`); }
    } catch (e0) { try { await releaseLane('aladin'); } catch (x) {} throw e0; }
    let STS = null, lastSc = null; const bad0 = new Set(); let retryPass = false; const nm0 = (sc) => (byS.get(sc) || {}).name || sc; try { for (let loop = 0; loop < 300; loop++) { if (stopFlag) throw new Error('멈춤'); /* (1.63.8 점검) 판매자 상태는 처음에 한 번 다 읽고, 그 뒤엔 방금 읽은 판매자만 다시 — 예전엔 판매자 하나 끝날 때마다 모두를 다시 읽어 읽기가 판매자 수의 제곱으로 늘었음 */ if (!STS) STS = await benchStates(T); else if (lastSc) { try { STS[lastSc] = (await C('bench_state').doc(lastSc).get()).data() || {}; } catch (e) {} } const sts = STS; /* (1.54.3) '하는 중' 표시가 있어도 진행 문서가 없거나 버렸으면(끝남·버림) 표시를 지우고 평소 차례로 */ for (const [sc0, s0] of Object.entries(sts)) { if (loop > 0 && sc0 !== lastSc) continue; if (!s0 || !s0.prog) continue; try { const jd = (await C('prd_jobs').doc('bench_' + sc0).get()).data(); if (!jd || jd.done) { s0.prog = null; await C('bench_state').doc(sc0).set({ prog: null }, { merge: true }); } } catch (e) {} } const P0 = RB.plan({ ...cfg, targets: T }, sts, Date.now()); /* (1.57.6) 읽을 판매자(T)만으로 차례 */ const P = RB.order ? RB.order(P0) : P0; /* (1.54.0) 하던 판매자 → 밀린 판매자 → 블록 순서 */
        if (FORCE) { const t0f = Date.parse(FJ.startedAt); const byP = new Map(P.map((x) => [String(x.sc), x])); const FS = cfg.forceSkip || {}; const skipMs = FS.on && +FS.h > 0 ? +FS.h * 3600e3 : 0;
          /* (1.56.3) ⏭ 강제 실행의 '최근 n시간 안에 끝까지 읽은 판매자는 건너뛰기'(웹앱·수집기의 토글 — app_settings/bench.forceSkip) · 기준 = 마지막으로 끝까지 읽은 회차가 끝난 때(okEndAt) */
          const finOk0 = (k) => { const f = (FJ.fin || {})[k]; if (!f) return false; if ((sts[k] || {}).prog) return false; const ra = Date.parse((sts[k] || {}).runAt || '') || 0; return !(ra && ra < t0f); };
          const okEnd = (k) => { const v = okEnd0(k); const s0 = sts[k] || {}; const ra = Date.parse(s0.runAt || '') || 0; return v && ra && !s0.readEndAt ? Math.min(v, ra + 4 * 3600e3) : v && s0.readEndAt ? Math.min(v, Date.parse(s0.readEndAt) || v) : v; }; /* (1.84.2) '끝까지 읽은 때' = 숍을 다 읽은 때(readEndAt) — 마무리(저장)만 나중에 한 회차는 마무리 시각이 아니라 읽은 때로 봄. 10/18 왕공주: 00:04~00:35에 읽고 19:06에 마무리만 → 19:06에 읽은 것으로 쳐 오늘 강제 실행에서 건너뛰던 것 (readEndAt이 없는 옛 기록은 시작 + 4시간까지만) */
          const okEnd0 = (k) => { const s0 = sts[k] || {}; if (s0.completeEndAt) return Date.parse(s0.completeEndAt); /* (1.63.8) ⏭ 기준 = 숍 끝까지 다 읽은 회차만(50% 넘어 쓴 회차라도 뒤쪽을 못 읽었으면 '완료' 아님) */ if (s0.okEndAt) return s0.notRead ? 0 : Date.parse(s0.okEndAt); return s0.day && s0.complete !== false && !(s0.lastPartial && s0.endAt && s0.lastPartial.at >= s0.endAt) && s0.endAt ? Date.parse(s0.endAt) : 0; };
          if (loop === 0 && keep0) { const fo = FJ.list.filter((k) => finOk0(k)); log(`🎯 이번 강제 실행에서 이미 끝낸 ${fo.length}명${fo.length ? `(${fo.map(nm0).join(', ')})` : ''} · 남은 차례: ${FJ.list.filter((k) => !finOk0(k)).map(nm0).join(' → ') || '없음'} (읽는 중이던 판매자는 그 자리부터 · 옛 회차를 마무리만 한 판매자는 새로)`); } /* (1.84.4) 끝낸 판매자 목록을 판매자 상태를 읽은 뒤 정확하게 */
          if (loop === 0) { const old = FJ.list.filter((k) => !restS.has(k) && Date.now() - (okEnd(k) || 0) > 30 * 3600e3); if (old.length) log(`🎯 🩺 하루 넘게(30시간) 숍을 끝까지 못 읽은 판매자 ${old.length}명: ${old.map((k) => `${(byS.get(k) || {}).name || k}(마지막 ${okEnd(k) ? new Date(okEnd(k) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') : '없음'})`).join(', ')} — 이번 차례에 읽음`, 1); } /* (1.84.3) 웹앱 🎯 카드의 🩺 줄과 같은 기준 */
          if (skipMs && loop === 0) { const sk = FJ.list.filter((k) => okEnd(k) && Date.now() - okEnd(k) < skipMs); if (sk.length) log(`🎯 강제 실행 ⏭ 최근 ${FS.h}시간 안에 끝까지 읽은 판매자 ${sk.length}명 건너뜀: ${sk.map((k) => `${(byS.get(k) || {}).name || k}(${new Date(okEnd(k) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')})`).join(', ')}`); }
          if (loop > 0) { try { const f2 = ((await C('prd_jobs').doc('benchForce').get()).data() || {}).fin; if (f2) Object.assign(FJ.fin, f2); } catch (e) {} } /* (1.63.6) 다른 PC에서 그사이 버린 판매자도 건너뜀 */
          const finOk = (k) => { const f = (FJ.fin || {})[k]; if (!f) return false; if ((sts[k] || {}).prog) return false; /* (1.84.4) 읽는 중인 회차가 있으면 끝난 것이 아님 — 10/18 19:57 왕공주: 새 바퀴를 읽던 중 새 판 새로고침 → 옛 '끝' 표시(fin) 때문에 건너뛰던 것 */ const ra = Date.parse((sts[k] || {}).runAt || '') || 0; return !(ra && ra < t0f && !(sts[k] || {}).prog); }; /* (1.84.2) 이번 강제 실행 전에 시작한 회차를 마무리만 한 것은 '이번에 읽음'이 아님 → 새로 한 바퀴 */
          const sc = FJ.list.find((k) => !done.has(k) && !finOk(k) && !(restS.has(k) && !(sts[k] || {}).prog) /* 📅 오늘 쉬는 그룹(하던 회차는 이어서) */ && !(skipMs && okEnd(k) && Date.now() - okEnd(k) < skipMs) && !(okEnd(k) >= t0f && !(byP.get(k) || {}).inProg)); /* 이번 강제 실행이 시작된 뒤 끝까지 읽은 판매자는 끝난 것 (끝까지 못 읽은 회차는 끝난 것으로 치지 않음) */ if (!sc) { if (claimedSkip.size) { const f3 = ((await C('prd_jobs').doc('benchForce').get()).data() || {}).fin || {}; const left = [...claimedSkip].filter((k) => !f3[k]); if (left.length) { log(`🎯 이 PC 몫은 끝 — 남은 ${left.length}명(${left.map((k) => (byS.get(k) || {}).name || k).join(', ')})은 다른 PC가 읽는 중이라 그 PC가 끝맺음`); break; } } const failL = FJ.list.filter((k) => bad0.has(k) && !finOk(k)); if (failL.length && !retryPass && !stopFlag) { retryPass = true; failL.forEach((k) => done.delete(k)); log(`🎯 한 바퀴 끝 — 못 끝낸 판매자 ${failL.length}명(${failL.map(nm0).join(', ')})을 1분 쉬고 한 번 더 읽음`); await new Promise((r) => setTimeout(r, 60e3)); continue; } /* (1.84.3) 예전엔 오류 난 판매자가 있어도 '모두 이번에 읽음'으로 강제 실행을 닫아 다음 ⏰ 회차까지 그대로 두었음 */
            const okN = FJ.list.filter((k) => finOk(k)).length; await C('prd_jobs').doc('benchForce').set({ done: true, doneAt: nowIso(), savedAt: Date.now(), failed: failL }, { merge: true }); log(failL.length ? `🎯 강제 실행 끝 — 이번에 끝까지 읽은 판매자 ${okN}명 · 못 끝낸 판매자 ${failL.length}명(${failL.map(nm0).join(', ')}) — 읽은 자리를 저장해 두었고 다음 ⏰ 회차에서 그 자리부터 이어 읽음` : `🎯 강제 실행 끝 — 판매자 ${FJ.list.length}명 모두 끝(이번에 읽음 ${okN}명 · 나머지는 ⏭ 최근에 읽었거나 오늘 쉬는 그룹)`, failL.length ? 1 : 0); break; }
          const t = byS.get(sc); done.add(sc); lastSc = sc; bad0.delete(sc); if ((FJ.fin || {})[sc]) { delete FJ.fin[sc]; await C('prd_jobs').doc('benchForce').set({ fin: { [sc]: firebase.firestore.FieldValue.delete() }, savedAt: Date.now() }, { merge: true }).catch(() => {}); } /* (1.84.4) 다시 읽기 시작하면 옛 '끝' 표시를 지움 — 중간에 새로고침돼도 이어서 읽게 */ log(`🎯 [강제 ${FJ.list.indexOf(sc) + 1}/${FJ.list.length}] ${t.name || sc} — 주기와 상관없이 읽음`); try { const r1 = await benchOneT(t, !!((sts[String(t.sc)] || {}).prog)); if (r1 === 'claimed') { claimedSkip.add(sc); continue; } if (r1 === 'partial') { bad.push(t.name || sc); bad0.add(sc); continue; } try { STS[sc] = (await C('bench_state').doc(sc).get()).data() || {}; } catch (e) {} { const ra = Date.parse((STS[sc] || {}).runAt || '') || 0; if (ra && ra < t0f) { log(`🎯 '${t.name || sc}': 방금 끝낸 것은 이번 강제 실행 전(${new Date(ra + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')})에 시작한 회차의 마무리 — 지금 새로 한 바퀴 읽음`); const r2 = await benchOneT(t, false); if (r2 === 'claimed') { claimedSkip.add(sc); continue; } if (r2 === 'partial') { bad.push(t.name || sc); bad0.add(sc); continue; } } } FJ.fin[sc] = nowIso(); for (let i = bad.length - 1; i >= 0; i--) if (bad[i] === (t.name || sc)) bad.splice(i, 1); /* (1.84.3) 다시 읽어 끝낸 판매자는 '오류 난 판매자'에서 뺌 */ await C('prd_jobs').doc('benchForce').set({ fin: { [sc]: FJ.fin[sc] }, savedAt: Date.now() }, { merge: true }).catch(() => {}); } catch (e) { if (e && e.message === '멈춤') throw e; bad.push(t.name || sc); bad0.add(sc); log(`🎯 '${t.name || sc}' 처리 중 오류: ${e && e.message} — 다음 판매자로 넘어감`, 1); } continue; }
        const next = P.find((x) => !done.has(x.sc) && (x.due || (FORCE_ALL && !x.fresh))) || (P.find((x) => x.due && done.has(x.sc) && x.g.unit === 'h' && Date.now() - (sts[x.sc].runAt ? Date.parse(sts[x.sc].runAt) : 0) > 3600e3) || null);
        if (loop === 0 && !FORCE) { const due = P.filter((x) => x.due || (FORCE_ALL && !x.fresh)); const fr = P.filter((x) => !x.due && x.fresh); const hm = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' '); if (fr.length) log(`🎯 끝난 지 얼마 안 돼 이번엔 건너뜀(다시 읽지 않음): ${fr.map((x) => `${(byS.get(x.sc) || {}).name || x.sc} ${hm(x.end || x.last)} 끝 → ${hm(x.next)}부터`).join(', ')}`); const pages = due.reduce((a, x) => a + (sts[x.sc].lastPage || sts[x.sc].pages || 0), 0);
          log(`🎯 집중 벤치마킹: 판매자 ${T.length}명 중 지금 할 차례 ${due.length}명${FORCE_ALL ? '(수동 — 모두)' : ''}${pages ? ` · 약 ${pages.toLocaleString()}쪽` : ''} — 순서: ${due.map((x) => `${(byS.get(x.sc) || {}).name || x.sc}(${x.g.name})`).join(' → ') || '없음'}${!due.length ? ` · 다음 차례: ${P.slice().sort((a, b) => a.next - b.next).slice(0, 3).map((x) => `${(byS.get(x.sc) || {}).name || x.sc} ${new Date(x.next + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')}`).join(', ')}` : ''}`); }
        if (!next) break; const t = byS.get(next.sc); done.add(next.sc); lastSc = String(next.sc); { const hm2 = (ms) => (ms ? new Date(ms + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') : '-'); const why = next.inProg ? `하던 회차 이어서(${(sts[next.sc].prog || {}).page || '?'}쪽부터)` : next.behind ? `지난 차례를 못 끝냄(밀림 ${next.behind}번)` : !next.due && FORCE_ALL ? '수동 실행' : '차례'; log(`🎯 [${done.size}] ${t.name || t.sc} · ${next.g.name}(${next.g.sched && RB.schedTxt ? RB.schedTxt(next.g.sched) : `${next.g.n}${next.g.unit === 'h' ? '시간' : '일'}에 한 번`}) · 왜: ${why} · 지난번 ${hm2(next.last)} 시작 ~ ${hm2(next.end)} 끝`); }
        /* (1.52.0) 한 판매자에서 오류가 나도 다음 판매자로 넘어감. 실패한 판매자는 읽은 조각이 남아 있어 다음 실행 때 읽기 없이 저장만 다시 함 */
        try { await benchOneT(next.mode === 'light' ? { ...t, _mode: 'light', _fullTxt: benchLightTxt(next.g.light) } : t, !!((sts[String(t.sc)] || {}).prog)); } catch (e) { if (e && e.message === '멈춤') throw e; bad.push(t.name || t.sc); log(`🎯 '${t.name || t.sc}' 처리 중 오류: ${e && e.message} — 다음 판매자로 넘어감 (다음 실행 때 이 판매자는 읽은 것을 그대로 두고 저장만 다시 함)`, 1); } }
      { const bu = [...new Set(bad)]; if (bu.length) log(`🎯 집중 벤치마킹: 오류 난 판매자 ${bu.length}명 — ${bu.join(', ')}`, 1); } listDone = true;
      /* (1.57.7) 숍 목록 한 바퀴가 끝난 뒤에 상품 페이지 정보 — 이번 바퀴에 읽은 판매자 차례대로(판매자마다 설정의 최대 개수·분) */
      if (wantDetail && done.size && !stopFlag && !HELP) { log(`🎯 숍 목록 한 바퀴 끝 — 이제 상품 페이지 정보(ISBN·분류 등)를 첫 판매자부터: ${[...done].map((sc) => (byS.get(sc) || {}).name || sc).join(' → ')}`); await benchDetailPass([...done].map((sc) => byS.get(sc)).filter(Boolean), { capped: true }); }
    } finally { BENCH_DEFER_DETAIL = false; await releaseLane('aladin'); } }
  async function benchOne(t) { const sc = String(t.sc); const name = t.name || sc; const day = kDayB(); const stRef = C('bench_state').doc(sc); const st = (await stRef.get()).data() || {};
    /* (1.53.0) 하루에 여러 번(n시간에 한 번)도 되게: 끝나지 않은 회차는 시작한 지 20시간 안이면 이어서, 아니면 새 회차 (차례는 benchJob이 정함) */
    const JN = 'bench_' + sc; let prog = await loadProgress(JN); const halfDone = (q) => !!(q && q.lastPage && (q.page - 1) / q.lastPage > 0.5); /* (1.56.4) 절반 넘게 읽고 멈춘 회차는 20시간이 지나도 그 쪽부터 이어 읽음(그사이 뒤쪽이 팔린 손실은 감안) */
    if (prog && prog.startedAt && Date.now() - Date.parse(prog.startedAt) >= 20 * 3600e3 && !prog.readDone && (prog.page || 1) > 1) log(`🎯 '${name}': ${new Date(Date.parse(prog.startedAt) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')}에 시작해 ${prog.page - 1}${prog.lastPage ? '/' + prog.lastPage : ''}쪽까지 읽고 멈춘 회차 — 시간이 지났어도 📍 이어 읽을 자리를 찾아 이어 읽음`);
    /* (1.63.8) 정범 결정: 멈춘 까닭·지난 시간과 상관없이 끝나지 않은 회차는 늘 이어 읽음 — 이어 읽을 자리는 아래 '이어 읽기 자리 찾기'(마지막에 읽은 상품 10개의 순서)로 확정 · 못 찾으면 그 회차를 거기서 끝내고 50% 기준 */
    if (!prog || (!Array.isArray(prog.items) && !(prog.blocks > 0)) || (Array.isArray(prog.items) && !prog.items.length && !(prog.blocks > 0))) { prog = { day, page: 1, items: [], blocks: 0, startedAt: nowIso(), sc, name, readDone: false, pagingBroken: false, lastPage: null, rows: await benchRowsPick(sc, name, st), ...(t._mode === 'light' ? { light: true, fullTxt: t._fullTxt || '7일에 한 번' } : {}) }; /* (1.75.0) 🆕 새로 올라온 것만 읽는 차례 */
      /* (1.54.2) 새 회차는 진행 문서를 통째로 바꿔 씀 — 진행 저장은 합치기(merge)라, 예전엔 지난 회차의 '숍 읽기 끝남(readDone)'이 남아 있다가 멈췄다 이어 할 때 몇 쪽만 읽고 회차를 끝냈음(나머지 수만 개가 '이번에 안 보임') */
      try { await C('prd_jobs').doc(JN).set({ day, page: 1, blocks: 0, startedAt: prog.startedAt, sc, name, readDone: false, pagingBroken: false, lastPage: null, rows: prog.rows, light: !!prog.light, fullTxt: prog.fullTxt || null, done: false, by: PC_NAME, pc: PC_ID, savedAt: Date.now(), ...W() }); } catch (e) {} }
    /* (1.54.2) 이어 할 때 '읽기 끝남'인데 숍 끝 쪽까지 못 읽었으면 믿지 않고 그 쪽부터 이어 읽음 (2쪽이 1쪽과 같은 숍은 1쪽만 쓰는 게 맞아 제외) */
    if (prog.readDone && !prog.pagingBroken && prog.lastPage && prog.page < prog.lastPage - 3) { log(`🎯 '${name}': '숍 읽기 끝남'으로 적혀 있지만 ${prog.page.toLocaleString()} / ${prog.lastPage.toLocaleString()}쪽까지만 읽었음(예전 판 오류) — 끝으로 보지 않고 ${prog.page.toLocaleString()}쪽부터 이어 읽음`, 1); prog.readDone = false; }
    /* (1.48.0) 큰 숍(수만 개)도 되게: 읽은 상품을 10쪽마다 조각(prd_jobs/bench_{번호}/bk/{n})으로 덧붙여 저장 — 예전처럼 4쪽마다 전체 목록(수 MB)을 다시 올리지 않음 · 쪽 수 상한(600) 없앰 → 숍 화면의 '끝' 쪽까지 */
    const bkRef = (k) => C('prd_jobs').doc(JN).collection('bk').doc(String(k)); if (!Array.isArray(prog.items)) prog.items = [];
    if ((prog.blocks || 0) > 0 && !prog.items.length) { for (let k = 0; k < prog.blocks; k++) { const d = (await bkRef(k).get()).data(); if (d && d.s) { try { prog.items.push(...JSON.parse(d.s)); } catch (e) {} } } log(`🎯 '${name}': 저장해 둔 ${prog.blocks}조각 · ${prog.items.length.toLocaleString()}개를 불러옴`); }
    let pend = !(prog.blocks > 0) && prog.items.length ? prog.items.slice() : []; const meta = () => { const m = { ...prog }; delete m.items; return m; };
    const saveBk = async () => { if (pend.length) { await bkRef(prog.blocks || 0).set({ s: JSON.stringify(pend), n: pend.length, at: Date.now() }); prog.blocks = (prog.blocks || 0) + 1; pend = []; } await saveProgress(JN, meta()); try { await stRef.set({ prog: { startedAt: prog.startedAt, page: prog.page, at: nowIso() } }, { merge: true }); } catch (e) {} }; /* (1.54.0) 하는 중 표시(서버) — 멈췄다 다시 시작하면 이 판매자부터 이어서 · 웹앱 순서표도 같은 것을 봄 */
    const have = new Set(prog.items.map((x) => x[0])); let firstIds = null; let lastP = prog.lastPage || st.lastPage || null;
    /* (1.75.0) 🆕 새로 올라온 것만: 지난 온전한 회차까지 아는 숍 상품(bench_state 조각) — 숍은 등록순(새 상품이 앞)이라, 아는 상품만 나오는 쪽이 오면 그 뒤는 지난번에 본 것 → 거기서 멈춤 */
    let OLDIDS = null; if (prog.light) { OLDIDS = new Set(); for (let k = 0; k < (st.chunks || 0); k++) { const c = (await C('bench_state').doc(sc).collection('c').doc(String(k)).get()).data(); let M = c && c.m; if (c && c.s) { try { M = JSON.parse(c.s); } catch (e) { M = null; } } if (M) Object.keys(M).forEach((id) => OLDIDS.add(String(id))); } if (!OLDIDS.size) { prog.light = false; log(`🎯 '${name}': 아는 숍 상품 기록이 없어 새 상품만 읽기 대신 숍 전체를 읽음`); } else log(`🎯 '${name}': 🆕 새로 올라온 것만 읽는 차례 — 아는 상품 ${OLDIDS.size.toLocaleString()}개만 나오는 쪽에서 멈춤 (숍 전체는 ${prog.fullTxt || '7일에 한 번'})`); }
    /* 진행 기록: 시작 · 10쪽마다 · 25/50/75/90% · 끝 — 끝 쪽(숍 화면의 '끝' 단추)을 알면 처음부터 정확한 남은 쪽 수 · 쪽당 걸린 시간으로 남은 시간·끝날 시각 */
    const t0 = Date.now(); const p0 = prog.page; const hm = (ms) => { const d = new Date(Date.now() + ms + 9 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
    const expOf = () => lastP || st.pages || 0; const spp0 = st.secPerPage ? st.secPerPage * 1000 : null;
    const eta = () => { const done = prog.page - p0; const per = done >= 3 ? (Date.now() - t0) / done : spp0; if (!per) return null; const exp = expOf(); const left = exp ? Math.max(0, exp - prog.page) : null; return { per, left, ms: left != null ? left * per : null, measured: done >= 3 }; };
    const marks = new Set(); const say = (force) => { const e = eta(); const exp = expOf(); const pct = exp ? Math.min(99, Math.floor(prog.page / exp * 100)) : null; const ms = [25, 50, 75, 90].find((m) => pct != null && pct >= m && !marks.has(m)); if (!force && !ms && prog.page % 10) return; if (ms) marks.add(ms);
      log(`🎯 '${name}' ${prog.page}${exp ? ` / ${exp}` : ''}쪽${pct != null ? ` (${pct}%)` : ''} · ${prog.items.length.toLocaleString()}개${e ? ` · 쪽당 ${(e.per / 1000).toFixed(1)}초${e.measured ? '' : '(지난번)'}` : ''}${e && e.ms != null ? ` · 남은 약 ${Math.max(1, Math.round(e.ms / 60000))}분 → ${hm(e.ms)} 끝 예상` : ''}${ms ? ` · ◆ ${ms}% 지남` : ''}`); };
    log(`🎯 집중 벤치마킹 '${name}' (SC ${sc}) ${prog.page > 1 ? `${prog.page}쪽부터 이어서` : '시작'} — ${expOf() ? `${lastP ? '끝' : '지난번'} ${expOf().toLocaleString()}쪽(한 쪽 ${prog.rows || 48}개)` : '처음 읽음 — 1쪽을 읽으면 끝 쪽을 앎'}${expOf() && st.secPerPage ? ` · 예상 약 ${Math.round(Math.max(0, expOf() - prog.page) * st.secPerPage / 60)}분 → ${hm(Math.max(0, expOf() - prog.page) * st.secPerPage * 1000)} 끝 예상` : ''}`);
    let dupRun = 0;
    if (prog.readDone) log(`🎯 '${name}': 오늘 숍 읽기는 이미 끝남(${prog.items.length.toLocaleString()}개) — 저장만 다시 함`);
    /* (1.55.0) ⏱ 기다리는 동안 다음 쪽도 — 쪽마다 시간의 대부분은 알라딘 응답을 기다리는 시간이라, 끝 쪽을 알면 2쪽(30쪽 넘게 탈 없으면 3쪽)을 같이 요청하고 '쪽 순서대로' 처리
     *  요청 간격 조절기(PACE)는 그대로 거침(요청을 시작하는 간격은 같음) · 알라딘이 '요청이 너무 많다'(쉬는 중)고 하거나 한 쪽이라도 실패하면 이 회차는 한 쪽씩
     *  진행 저장·이어 하기·빈 쪽·끝 쪽 판단은 예전과 똑같이 쪽마다(처리 순서가 쪽 순서) — 같이 받은 뒤쪽은 앞쪽이 실패하면 버리고 다음에 그 쪽부터 */
    const ROWS = prog.rows || 48; let K = 2, okRun = 0;
    const page48 = (pg, i) => Math.floor(((pg - 1) * ROWS + i) / 48) + 1; /* 배지 상품이 '48개 쪽'으로 몇 쪽인지 — 예전 기록과 같은 뜻으로 */
    /* (1.63.8) 📍 이어 읽기 자리 찾기 — 멈췄던 회차를 이어 읽을 때, 그사이 앞쪽이 팔리면(상품이 앞으로 당겨짐) 몇 개를 못 보고 지나치고, 새로 올리면(뒤로 밀림) 이미 읽은 쪽을 다시 읽게 됨
     *  숍은 등록순이라 그사이 생기는 변화는 '맨 앞에 새로 올림'과 '어디선가 팔려 빠짐'뿐 → 마지막에 읽은 상품 10개는 순서가 그대로 남음(빠진 것만 있을 수 있음)
     *  멈춘 쪽(마지막으로 읽은 쪽)부터 그 앞뒤로 3쪽씩 열어 그 10개가 순서대로 7개 이상 나오는 곳을 찾음 → 마지막으로 읽은 상품이 있는 쪽부터 이어 읽음(이미 읽은 상품은 상품 번호로 걸러 겹치지 않음)
     *  7개 이상이 순서대로 안 나오면(앞뒤 3쪽을 넘게 밀렸거나 많이 팔림) 이어 읽을 기준이 없으므로 이 회차를 여기서 끝냄 → 읽은 양이 숍의 50%를 넘으면 쓰는 회차(못 읽은 뒤쪽은 '잠정 있음'으로 두고 다음 회차에서 확정), 50% 이하면 통계에서 뺌 — 어느 쪽이든 판매자 상세 회차별 기록에 남김 */
    let anchorStop = false; const RCFG = benchResumeCfg(); /* (1.63.9) 웹앱 🎯 설정에서 바꿈 — 마지막 상품 몇 개·순서대로 몇 개 이상·앞뒤 몇 쪽 */
    if (!prog.readDone && lastP && prog.page > lastP && prog.items.length) { prog.readDone = true; await saveProgress(JN, meta()); log(`🎯 '${name}': 멈춘 자리(${prog.page - 1}쪽)가 이미 끝 쪽(${lastP}쪽)이라 읽기는 다 끝남 — 마무리(사라진 상품 셈)만 함`); } /* (1.72.3) 끝 쪽까지 다 읽은 뒤 끊긴 회차를 이어 읽을 때 '자리 못 찾음'으로 실패 처리하던 것(10/15 별 헤는 밤 790쪽·왕공주 890쪽) */
    if (!prog.readDone && prog.page > 1 && prog.items.length) { const A = prog.items.slice(-RCFG.n).map((x) => String(x[0])); const base = Math.max(1, prog.page - 1); const tried = []; const fails = []; const seen = new Map(); let hit = null; const t0a = Date.now();
      const order = [0].concat(...Array.from({ length: RCFG.pages }, (_, k) => [k + 1, -(k + 1)])).map((d) => base + d).filter((pg) => pg >= 1 && (!lastP || pg <= lastP + 3));
      const match = () => { const pgs = [...seen.keys()].sort((a, b) => a - b); let best = null;
        for (let i = 0; i < pgs.length; i++) { const L = []; for (let j = i; j < pgs.length && pgs[j] === pgs[i] + (j - i); j++) seen.get(pgs[j]).forEach((id, ix) => L.push([id, pgs[j], ix]));
          const pos = new Map(L.map((x, k) => [x[0], k])); let k0 = -1, m = 0, last = null; for (const id of A) { const k = pos.get(id); if (k == null || k <= k0) continue; k0 = k; m++; last = L[k]; } if (m >= Math.min(RCFG.match, A.length) && (!best || m > best.m)) best = { m, page: last[1], ix: last[2] }; }
        return best; };
      for (const pg of order) { if (stopFlag) { await saveBk(); throw new Error('멈춤'); } let g; try { g = await PUB.read('shop', benchUrl(sc, pg, ROWS), (x) => ({ items: benchParse(x.doc) }), (x) => benchParse(x.doc).length > 0); } catch (e) { if (e.message === '멈춤') { await saveBk(); throw e; } if (!lastP || (pg <= lastP && !((e.anonView || /장바구니 칸이 없음/.test(e.message || '')) && pg >= lastP - 2))) fails.push(pg); continue; } /* (1.84.2) 끝 쪽 근처의 '다른 모양'은 일시 오류가 아니라 끝을 넘은 것 */ /* (1.63.11 자동 점검) 끝 쪽 안에서 못 읽은 쪽은 따로 셈 */
        const L = benchParse(g.doc).map((x) => String(x.id)); seen.set(pg, L); tried.push(pg); if (pg === 1 || !lastP) { const lp = benchLastPage(g.doc, g.html); if (lp) { lastP = Math.max(lp, 1); prog.lastPage = lastP; } }
        hit = match(); if (hit) break; }
      const R = { at: nowIso(), from: prog.page, base, tried, m: hit ? hit.m : 0, n: A.length, need: RCFG.match, pages: RCFG.pages, ms: Date.now() - t0a };
      if (hit) { R.to = hit.page; R.shift = hit.page - base; prog.page = hit.page; log(`🎯 '${name}': 📍 이어 읽기 자리 확인 — 마지막에 읽은 상품 ${A.length}개 중 ${hit.m}개가 순서대로 ${hit.page}쪽에 있음${R.shift ? ` (멈춘 뒤 ${R.shift > 0 ? `새로 올려 ${R.shift}쪽 뒤로` : `팔려서 ${-R.shift}쪽 앞으로`} 밀림)` : ''} → ${hit.page}쪽부터 이어 읽음 (이미 읽은 상품은 건너뜀)`); }
      else if (fails.length) { /* (1.63.11 자동 점검) 알라딘 일시 오류(429·화면 오류)로 앞뒤 쪽을 못 읽은 것은 '자리 못 찾음'이 아님 — 회차를 끝내지 않고 저장, 다음에 이 자리부터 다시 찾음 (본 읽기의 '읽기 실패 → 다음에 이 쪽부터'와 같게) */
        R.fail = fails; prog.resumes = (prog.resumes || []).concat([R]).slice(-20); await saveProgress(JN, meta()); log(`🎯 '${name}': 📍 이어 읽을 자리를 찾는 중 ${fails.join('·')}쪽을 읽지 못함(알라딘 일시 오류) — 회차를 끝내지 않고 저장, 다음에 이 자리부터 다시 찾음`, 1); await saveBk(); return 'partial'; }
      else if (lastP && base >= lastP - 1) { R.endNear = true; prog.readDone = true; log(`🎯 '${name}': 📍 멈춘 자리(${base}쪽)가 끝 쪽(${lastP}쪽) 바로 앞이라 읽기는 다 끝난 것으로 봄 — 그사이 새로 올라온 상품에 밀려 마지막 상품을 못 찾았을 뿐(못 본 상품은 '이번에 안 보임'으로 두고 다음 회차에서 확정) · 실패로 적지 않음`); } /* (1.72.3) 10/15 왕공주 890/891쪽 */
      else { R.lost = true; anchorStop = true; prog.anchorLost = R; prog.page = base + 1; log(`🎯 '${name}': 📍 이어 읽을 자리를 못 찾음 — 마지막에 읽은 상품 ${A.length}개가 멈춘 쪽(${base}쪽) 앞뒤 ${RCFG.pages}쪽(${tried.join('·')}쪽)에 순서대로 ${RCFG.match}개 이상 없음(그사이 많이 올리거나 팔림) → 이 회차는 ${base}쪽까지 읽은 것으로 끝내고 ${Math.round(RCFG.cover * 100)}% 기준을 적용`, 1); }
      prog.resumes = (prog.resumes || []).concat([R]).slice(-20); await saveProgress(JN, meta()); }
    if (!prog.readDone && !anchorStop) for (;;) { if (stopFlag) { await saveBk(); throw new Error('멈춤'); }
      if (lastP && prog.page > lastP + 3) break; /* 읽는 동안 새로 올라온 만큼 뒤로 밀릴 수 있어 끝 쪽 + 3쪽까지 */
      if (PACE.cooling && PACE.cooling() > 0) K = 1;
      const pgs = []; for (let q = 0; q < (lastP ? K : 1); q++) { const pg = prog.page + q; if (lastP && pg > lastP + 3) break; pgs.push(pg); }
      const T120 = (p) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('2분 안에 답이 없음(연결 멈춤)')), 120e3))]); /* (1.78.4) 한 쪽이 멈추면 회차 전체가 영원히 기다리던 것(10/17 왕공주 621쪽) — 2분 넘으면 그 쪽부터 다음에 */
      const got = await Promise.allSettled(pgs.map((pg) => T120(PUB.read('shop', benchUrl(sc, pg, ROWS), (g) => ({ items: benchParse(g.doc), last: benchLastPage(g.doc, g.html) }), (g) => benchParse(g.doc).length > 0))));
      let out = null;
      for (let q = 0; q < got.length && !out; q++) { /* prog.page === pgs[q] */
        if (got[q].status === 'rejected') { const e = got[q].reason || {}; if (e.message === '멈춤') { await saveBk(); throw e; } if (lastP && (prog.page > lastP || ((e.anonView || /장바구니 칸이 없음/.test(e.message || '')) && prog.page >= lastP - 2 && (prog.lastLen == null || prog.lastLen < ROWS)))) { if (prog.page <= lastP) log(`🎯 '${name}': ${prog.page}쪽(끝 쪽 ${lastP}쪽 근처)이 상품 칸이 없는 다른 모양 — 그사이 팔려 쪽 수가 줄어 끝을 넘은 것으로 봄 → 숍 끝까지 읽은 것으로 마무리 (못 본 상품은 '이번에 안 보임'으로 두고 다음 회차에서 확정)`); out = 'break'; break; } /* (1.84.2) 끝 쪽 자신(또는 1~2쪽 앞)이 다른 모양이면 끝 — 쪽당 48개(웹앱 추정)·50개(실제) 차이와 그사이 팔린 만큼 끝 쪽이 앞당겨져, 끝 쪽을 '읽기 실패'로 세어 회차를 못 끝내던 것(10/18 딱따구리 1204/1204쪽·왕공주 892쪽 · 곰돌이책방 10/16부터 1423/1424쪽에 멈춤) */ /* (1.78.5) 끝 쪽 다음 쪽(빈 쪽)은 알라딘이 다른 모양으로 줘 '읽기 실패'로 셌음(10/17 한성서적 132/131쪽·봄바람77 117/116쪽) → 끝까지 읽은 것 */ log(`벤치마킹 '${name}' ${prog.page}쪽 읽기 실패: ${e.message} — 다음에 이 쪽부터`, 1); await saveBk(); return 'partial'; }
        let r = got[q].value; let L = benchParse(r.doc);
        /* (1.54.2) 끝 쪽보다 한참 앞에서 빈 쪽이 오면 '끝'으로 보지 않음 — 로그인 상태로 한 번 더 읽고, 그래도 비면 저장하고 다음에 이 쪽부터(회차를 끝내지 않음 · 나머지를 '안 보임'으로 적지 않게) */
        if (!L.length && lastP && prog.page < lastP - 3) { try { const r2 = await getDoc(benchUrl(sc, prog.page, ROWS)); const L2 = benchParse(r2.doc); if (L2.length) { r = r2; L = L2; } } catch (e) { if (e.message === '멈춤') { await saveBk(); throw e; } }
          if (!L.length) { log(`벤치마킹 '${name}' ${prog.page}쪽이 비어 있음(끝 쪽 ${lastP}쪽보다 앞) — 회차를 끝내지 않고 저장, 다음에 이 쪽부터`, 1); await saveBk(); return 'partial'; } }
        if (prog.page === 1 || !lastP) { const lp = benchLastPage(r.doc, r.html); if (lp) { if (lp !== lastP && prog.page === 1) log(`🎯 '${name}': 숍 끝 쪽 ${lp.toLocaleString()}쪽 (한 쪽 ${ROWS}개 · 약 ${(lp * ROWS).toLocaleString()}개)`); lastP = Math.max(lp, prog.page); prog.lastPage = lastP; } }
        if (prog.page === 1 && L.length) prog.readFrom1 = true; /* (1.56.3) 이 회차가 1쪽부터 읽었음 */
        if (prog.page === 1) { firstIds = L.map((x) => x.id).join(','); await C('bench_probe').doc(sc).set({ sc, name, at: nowIso(), day, url: benchUrl(sc, 1, ROWS), rows: ROWS, view: L.length && L[0].uc ? 'simple' : 'other', pubMode: PUB.st.shop.mode, pubWhy: PUB.st.shop.last || null, lastPage: lastP || null, n: L.length, withPrice: L.filter((x) => x.p).length, withGrade: L.filter((x) => x.g).length, noGrade: L.filter((x) => x.g0).length, withIsbn: L.filter((x) => x.isbn).length, withCover: L.filter((x) => x.cov).length, withLow: L.filter((x) => x.low).length, sample: L.slice(0, 5), html: String(r.html || '').slice(0, 250000), pc: PC_NAME, ...W() }); }
        if (prog.page === 2 && L.map((x) => x.id).join(',') === firstIds && firstIds) { log(`벤치마킹 '${name}': 2쪽이 1쪽과 같음 — 쪽 넘김 방식이 다름(웹앱에 '읽기 확인 필요') · 1쪽만 씀`, 1); await C('bench_probe').doc(sc).set({ pagingBroken: true }, { merge: true }); prog.pagingBroken = true; out = 'break'; break; }
        prog.lastLen = L.length; /* (1.84.3) 바로 앞 쪽의 상품 수 — 끝 쪽 판단(꽉 차지 않은 쪽 다음이 다른 모양이면 끝) */ let fresh = 0; L.forEach((x, ix) => { if (have.has(x.id)) return; have.add(x.id); fresh++; if (prog.light && OLDIDS && !OLDIDS.has(String(x.id))) prog.newN = (prog.newN || 0) + 1; const row = [x.id, x.p, x.g, x.t, x.isbn, x.ym, x.pl, x.low ? 1 : 0, page48(prog.page, ix), x.uc || null, x.au || null, x.cov || null]; prog.items.push(row); pend.push(row); });
        { const e = eta(); const exp = expOf(); ui(`집중 벤치마킹 · ${name}`, prog.page, Math.max(prog.page, exp || prog.page), `${prog.page.toLocaleString()}${exp ? ' / ' + exp.toLocaleString() : ''}쪽(한 쪽 ${ROWS}개${K > 1 ? ` · ${K}쪽씩 같이` : ''}) · 지금까지 ${prog.items.length.toLocaleString()}개${e && e.ms != null ? ` · 남은 약 ${Math.max(1, Math.round(e.ms / 60000))}분 (${hm(e.ms)} 끝 예상)` : ''}`); } say(false);
        if (!L.length && lastP && prog.page <= lastP) { /* (1.56.3) 끝 쪽 전에서 빈 쪽 — 읽는 동안 팔려 숍이 줄었는지 1쪽을 다시 열어 지금 끝 쪽을 확인 · 줄었으면 끝까지 읽은 것, 아니면 끝까지 못 읽은 회차 */
          try { const r1 = await getDoc(benchUrl(sc, 1, ROWS)); const lp1 = benchLastPage(r1.doc, r1.html); prog.shrink = { from: lastP, now: lp1 || null, at: prog.page }; if (lp1 && lp1 < prog.page) { log(`🎯 '${name}': 읽는 동안 숍이 줄어 끝 쪽이 ${lastP}쪽 → ${lp1}쪽 — ${prog.page - 1}쪽까지 읽어 끝까지 읽은 것`); lastP = lp1; prog.lastPage = lp1; } else log(`🎯 '${name}': ${prog.page}쪽이 비었는데 지금 끝 쪽은 ${lp1 || '?'}쪽 — 끝까지 못 읽은 회차로 봄`, 1); } catch (e) { if (e.message === '멈춤') { await saveBk(); throw e; } } }
        if (!L.length) { out = 'break'; break; } /* 빈 쪽 = 끝 */
        if (prog.light && OLDIDS && L.every((x) => OLDIDS.has(String(x.id)))) { prog.lightStop = prog.page; prog.page++; out = 'break'; break; } /* (1.75.0) 이 쪽은 모두 아는 상품 → 새 상품 끝 */
        dupRun = fresh ? 0 : dupRun + 1; if (!lastP && dupRun >= 2) { out = 'break'; break; } /* 끝 쪽을 모를 때만: 두 쪽 연속 새 상품이 없으면 끝 (끝 쪽을 알면 앞쪽 상품이 밀려 겹친 쪽이어도 끝까지 감) */
        if (prog.page % 10 === 0) await saveBk();
        prog.page++; }
      if (out === 'break') break;
      okRun += got.length; if (okRun >= 30 && K < 3 && !(PACE.cooling && PACE.cooling() > 0)) { K++; okRun = 0; } }
    if (pend.length) { await bkRef(prog.blocks || 0).set({ s: JSON.stringify(pend), n: pend.length, at: Date.now() }); prog.blocks = (prog.blocks || 0) + 1; pend = []; }
    /* (1.56.3) '끝까지 확실히 읽었나'를 한 곳에서 엄격하게: ① 이 회차가 1쪽부터 읽었고 ② 숍 끝 쪽을 알면 그 쪽까지 읽었고(빈 쪽이면 지금 끝 쪽을 다시 확인) ③ 2쪽이 1쪽과 같은 숍은 끝 쪽이 1쪽일 때만 ④ 끝 쪽을 모르면 빈 쪽·새 상품 없는 쪽까지 — 하나라도 아니면 끝까지 못 읽은 회차(통계·비교 기준 모두 제외, 읽은 상품은 bench_partial에 상품 정보로만) */
    { const lastRead = prog.page - 1; const r1 = prog.readFrom1 === true || (prog.readFrom1 === undefined && prog.items.length > 0 && !prog.resumedOld); let ok = false, why = '';
      /* (1.56.4) 정범 결정: 숍의 절반(50%) 넘게 읽었으면 쓰는 회차, 절반 이하에서 그만둔 회차만 버림(통계·비교 기준·'오늘 읽음' 모두에서 빼고 다음엔 1쪽부터 새로) */
      const cov = prog.pagingBroken ? (!lastP || lastP <= 1 ? 1 : 1 / lastP) : lastP ? Math.min(1, lastRead / lastP) : 1; prog.cover = Math.round(cov * 1000) / 1000;
      if (!prog.items.length) why = '읽은 상품 없음'; else if (!r1) why = '이 회차가 1쪽부터 읽지 않음'; else { const CV = benchResumeCfg().cover; ok = cov > CV; prog.coverMin = CV; why = ok ? '' : `숍의 ${Math.round(cov * 100)}%만 읽고 그만둠(끝 쪽 ${lastP || '?'}쪽 중 ${prog.pagingBroken ? 1 : lastRead}쪽)${prog.anchorLost ? ' · 이어 읽을 자리를 못 찾아 끝냄' : ''} — ${Math.round(CV * 100)}% 이하라 통계에서 뺌`; }
      if (prog.light) { ok = false; why = `🆕 새로 올라온 것만 읽는 차례 — ${prog.lightStop ? `${prog.lightStop}쪽에서 아는 상품만 나와 멈춤` : `${lastRead}쪽까지`} (숍 전체는 ${prog.fullTxt || '7일에 한 번'} · 팔림·사라짐은 숍 전체를 읽는 날 셈)`; }
      prog.fullRead = ok; prog.fullWhy = why; }
    if (!prog.readDone && !prog.readEndAt) prog.readEndAt = nowIso(); /* (1.84.2) 숍을 방금 다 읽은 때(마무리와 따로) — 이어 읽기에서 이미 다 읽었던 회차는 비워 둠 */
    if (!prog.readDone) { prog.readDone = true; await saveProgress(JN, meta()); } /* (1.52.0) 읽기 끝을 먼저 적어 둠 — 저장 단계에서 멈춰도 다시 읽지 않음 */
    const secPerPage = prog.page > p0 ? Math.round((Date.now() - t0) / (prog.page - p0) / 100) / 10 : st.secPerPage || null; await benchFinish(t, prog, { ...st, secPerPage, lastPage: lastP || null });
    for (let k = 0; k < (prog.blocks || 0); k++) await bkRef(k).delete().catch(() => {}); /* 읽는 동안 임시로 둔 조각 — 결과는 bench_state·bench_days·bench_items에 저장됨 */
    await finishJob(JN, { n: prog.items.length, pages: prog.page });
    try { const CS = window.__rnCS; if (CS) { CS.add('bench', prog.fullRead ? 'ok' : 'part', 1, prog.fullRead ? null : prog.fullWhy || '끝까지 못 읽음'); CS.add('bench', 'n', prog.items.length); CS.add('bench', 'p', Math.max(0, prog.page - p0)); CS.add('bench', 'ms', Date.now() - t0); } } catch (e) {} /* (1.79.0) 📊 */
    log(`🎯 '${name}' 끝 — ${prog.page.toLocaleString()}쪽 · ${prog.items.length.toLocaleString()}개 · ${Math.round((Date.now() - t0) / 60000)}분 걸림`); }
  /* (1.53.0) 상품 페이지에서 ISBN·주제 분류·출간 연월 (웹앱 ⚙ 수집 항목에서 켠 것만) — 한 번 읽은 상품은 다시 안 읽음(v[10])
   *  ① bench_books/{알라딘 상품 번호}(판매자끼리 같이 씀) → ② 우리 도서 기록(prd_ids/itemId_ → prd_books) → ③ 그래도 없으면 상품 페이지를 염(한 개당 약 1~2초)
   *  한 번 수집에 판매자마다 최대 N개·M분(⚙에서 바꿈) — 새로 올린 것 먼저, 남으면 예전 상품을 조금씩 채움(몇 번에 걸쳐 숍 전체가 채워짐) */
  const benchBookMem = new Map();
  async function benchBook(id) { if (benchBookMem.has(id)) return benchBookMem.get(id); const ref = C('bench_books').doc(String(id)); let b = (await ref.get().catch(() => null)); b = b && b.exists ? b.data() : null;
    if (!b) { try { const m = (await C('prd_ids').doc('itemId_' + id).get()).data(); if (m && m.bookId) { const k = (await C('prd_books').doc(String(m.bookId)).get()).data(); if (k) { const c0 = (k.categories || [])[0]; b = { full: true, bookId: String(m.bookId), id: String(id), isbn: k.isbn13 || null, cat: c0 && c0.path ? c0.path.slice(0, 4).join('>') : null, catCid: c0 && c0.cids ? c0.cids[c0.cids.length - 1] || null : null, pubYm: k.pubDate ? String(k.pubDate).slice(0, 7) : null, src: 'ours', at: nowIso() }; } } } catch (e) {} }
    if (b && !b.full && b.src === 'page') b = null; /* (1.53.1) 예전(1.53.0)엔 세 가지만 저장 → 상품 페이지 정보 전부로 다시 읽음 */
    if (!b) { const g = await pubProd(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`); const pg = P.parseProductPage(g.doc, g.finalUrl); const c0 = (pg.categories || [])[0]; const pd = pg.pubDate || null;
      /* (1.53.1) 상품 페이지에서 읽은 것 전부(우리 책 도서 정보와 같은 파서 · 같은 칸 이름) — 한 번 저장하면 덮어쓰지 않고 영원히 보관 · 판매자끼리 같이 씀 */
      const page = JSON.parse(JSON.stringify(pg, (k, v) => (v === undefined ? null : v))); b = { id: String(id), isbn: pg.isbn13 || null, cat: c0 && c0.path ? c0.path.slice(0, 4).join('>') : null, catCid: c0 && c0.cids ? c0.cids[c0.cids.length - 1] || null : null, pubYm: pd ? String(pd).replace(/[./]/g, '-').slice(0, 7) : null, title: pg.title || null, page, full: true, src: 'page', at: nowIso() }; }
    if (b && !b.isbn && !b.cat && !b.pubYm) { benchBookMem.set(id, null); return null; } /* 아무것도 못 읽었으면 저장하지 않음(다음에 다시 시도) */
    if (b && b.src && !b.saved) { try { await ref.set({ ...b, saved: true, ...W() }, { merge: true }); } catch (e) { try { const { page, ...rest } = b; await ref.set({ ...rest, pageJ: JSON.stringify(page || null).slice(0, 200000), saved: true, ...W() }, { merge: true }); } catch (e2) {} } b.saved = true; } /* 중첩 목록 등으로 거절되면 글자(JSON)로 */
    benchBookMem.set(id, b); if (benchBookMem.size > 20000) benchBookMem.clear(); return b; }
  /* (1.57.7) 📖 상품 페이지 정보만 따로 — 판매자의 지금 숍 상품(bench_state 조각) 중 아직 상품 페이지 정보가 없는 것만 엶(한 번 읽은 상품·다른 판매자와 같은 책·우리 도서 기록에 있는 책은 열지 않음 = benchBook)
   *  capped: 판매자마다 설정의 최대 개수·분(한 바퀴 뒤 자동) · 아니면(수집기 단추) 판매자마다 끝까지 — 멈추면 100개마다 저장한 데까지 남음 · 판매자가 숍 목록을 읽는 중(prog)이면 건너뜀(겹쳐 쓰지 않게) */
  async function benchDetailPass(T, opt) { opt = opt || {}; const RB = (BREG() || {}).BENCH; if (!RB) return; const D = { ...RB.DETAIL_DEF, ...((BENCH_CFG && BENCH_CFG.detail) || {}) }; const tAll = Date.now(); let sumT = 0, sumF = 0;
    for (const t of T) { if (stopFlag) throw new Error('멈춤'); const sc = String(t.sc); const name = t.name || sc; const st = (await C('bench_state').doc(sc).get()).data() || {}; if (st.prog) { log(`📖 '${name}': 숍 목록을 읽는 중인 회차가 있어 건너뜀`); continue; } const nC = st.chunks || 0; if (!nC) continue;
      const parts = []; for (let k = 0; k < nC; k++) { const c = (await C('bench_state').doc(sc).collection('c').doc(String(k)).get()).data(); let M = c && c.m; if (c && c.s) { try { M = JSON.parse(c.s); } catch (e) { M = null; } } parts.push({ k, M: M || {}, dirty: false, day: c && c.day }); }
      const where = new Map(); parts.forEach((P) => Object.keys(P.M).forEach((id) => where.set(id, P)));
      const all = [...where.entries()].map(([id, P]) => [id, P.M[id], P]).filter(([, v]) => Array.isArray(v) && !v[6] && v[10] !== 1);
      const cand = all.filter(([, v]) => v[10] !== 2).sort((a, b) => String(b[1][1]).localeCompare(String(a[1][1]))).concat(all.filter(([, v]) => v[10] === 2)); const lim = opt.capped ? Math.max(0, +D.max || 0) : cand.length; const until = opt.capped ? Date.now() + Math.max(1, +D.maxMin || 30) * 60000 : Infinity;
      if (!cand.length) { log(`📖 '${name}': 상품 페이지 정보가 없는 상품 없음`); continue; } log(`📖 '${name}' 상품 페이지 정보: 아직 없는 ${cand.length.toLocaleString()}개 중 ${Math.min(lim, cand.length).toLocaleString()}개${opt.capped ? ` (최대 ${D.maxMin}분)` : ''}`);
      let B = db.batch(), n = 0, tried = 0, filled = 0; const t0 = Date.now(); let lastLog = t0;
      const save = async () => { if (n) { await B.commit(); B = db.batch(); n = 0; } for (const P of parts) if (P.dirty) { await C('bench_state').doc(sc).collection('c').doc(String(P.k)).set({ s: JSON.stringify(P.M), n: Object.keys(P.M).length, fmt: 'json', day: P.day || kDayB(), at: nowIso() }); P.dirty = false; } };
      try { for (const [id, v, P] of cand.slice(0, lim)) { if (stopFlag) throw new Error('멈춤'); if (Date.now() > until) { log(`📖 '${name}': ${D.maxMin}분이 되어 여기까지 — 나머지는 다음 바퀴에`); break; } tried++; let b = null; try { b = await benchBook(id); } catch (e) { if (e.message === '멈춤') throw e; }
          if (b) { v[7] = b.isbn || null; v[8] = b.cat || null; v[9] = b.pubYm || null; v[10] = 1; filled++; B.set(C('bench_items').doc(`${sc}_${id}`), { sc, id, isbn: v[7], cat: v[8], pubYm: v[9], detailAt: nowIso(), ...W() }, { merge: true }); n++; } else v[10] = 2; P.dirty = true;
          if (tried % 100 === 0) await save(); if (Date.now() - lastLog > 30000) { lastLog = Date.now(); log(`📖 '${name}' ${tried}/${Math.min(lim, cand.length)}`); ui(`상품 페이지 정보 · ${name}`, tried, Math.min(lim, cand.length), `ISBN·분류 ${tried}/${Math.min(lim, cand.length)}`); } }
      } finally { await save().catch((e) => log(`📖 '${name}' 저장 실패: ${e.message}`, 1)); }
      sumT += tried; sumF += filled; log(`📖 '${name}' 끝: ${filled}/${tried}개 (${Math.round((Date.now() - t0) / 1000)}초)`); }
    log(`📖 상품 페이지 정보 끝 — 판매자 ${T.length}명 · ${sumF.toLocaleString()}/${sumT.toLocaleString()}개 · ${Math.round((Date.now() - tAll) / 60000)}분`); }
  async function benchDetailJob() { const cfg = (await C('app_settings').doc('bench').get()).data() || {}; BENCH_CFG = cfg; const T = benchTargets(cfg); if (!T.length) { log('집중 벤치마킹: 고른 판매자 없음'); return; }
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); return false; } try { log(`📖 집중 벤치마킹으로 모은 상품만 상품 페이지 정보 읽기(설정과 상관없이) — ${T.map((t) => t.name || t.sc).join(' → ')}`); await benchDetailPass(T, { capped: false }); } finally { await releaseLane('aladin'); } }
  let BENCH_DEFER_DETAIL = false; /* (1.57.7) 정범 지정: 한 바퀴(차례가 된 판매자 모두) 숍 목록을 먼저 다 읽고, 상품 페이지 정보는 그 뒤에 첫 판매자부터 따로(benchDetailPass) */
  async function benchDetail(t, now, newIds, F) { const RB = (BREG() || {}).BENCH; const out = { tried: 0, filled: [], newIds }; if (!RB || !RB.needsDetail(BENCH_CFG) || BENCH_DEFER_DETAIL) return out;
    const D = { ...RB.DETAIL_DEF, ...((BENCH_CFG && BENCH_CFG.detail) || {}) }; const name = t.name || t.sc; const t0 = Date.now(); const until = t0 + Math.max(1, +D.maxMin || 30) * 60000; let lastLog = t0;
    const C0 = [...now.entries()].filter(([, v]) => !v[6] && v[10] !== 1); /* 못 읽은 것(2)은 맨 뒤에서 다시 시도 */ const cand = C0.filter(([id]) => newIds.has(id)).concat(C0.filter(([id, v]) => !newIds.has(id) && v[10] !== 2).sort((a, b) => String(b[1][1]).localeCompare(String(a[1][1]))), C0.filter(([id, v]) => !newIds.has(id) && v[10] === 2)).slice(0, Math.max(0, +D.max || 0));
    if (!cand.length) return out; log(`🎯 '${name}' 상품 페이지 정보 읽기(도서 정보 전부): ${cand.length.toLocaleString()}개 (새로 올린 것 ${cand.filter(([id]) => newIds.has(id)).length} · 아직 안 읽은 상품 ${C0.length.toLocaleString()}개 중) · 최대 ${D.maxMin}분`);
    for (const [id, v] of cand) { if (stopFlag) throw new Error('멈춤'); if (Date.now() > until) { log(`🎯 '${name}' 상품 정보 더 읽기: ${D.maxMin}분이 되어 여기까지(${out.tried}개) — 나머지는 다음 수집 때`); break; }
      out.tried++; let b = null; try { b = await benchBook(id); } catch (e) { if (e.message === '멈춤') throw e; }
      if (b) { v[7] = b.isbn || null; v[8] = b.cat || null; v[9] = b.pubYm || null; v[10] = 1; out.filled.push(id); } else v[10] = 2;
      if (Date.now() - lastLog > 30000) { lastLog = Date.now(); log(`🎯 '${name}' 상품 정보 더 읽기 ${out.tried}/${cand.length}`); ui(`집중 벤치마킹 · ${name} · 상품 정보`, out.tried, cand.length, `ISBN·분류 ${out.tried}/${cand.length}`); } }
    log(`🎯 '${name}' 상품 정보 더 읽기 끝: ${out.filled.length}/${out.tried}개 (${Math.round((Date.now() - t0) / 1000)}초)`); return out; }
  async function benchFinish(t, prog, st) { const RUN_OK = prog.fullRead === true; /* (1.56.3) 엄격한 기준 한 곳(benchOne의 fullRead) — 예전 느슨한 기준(끝 쪽 3쪽 전·끝 쪽 모름이면 끝으로 봄)은 버림 */ const sc = String(t.sc); const day = prog.day; const dayN = day.replace(/-/g, '');
    /* (1.56.2) 끝까지 못 읽은 회차(예: 1%만 읽음)는 '비교 기준'을 바꾸지 않음 — 예전엔 못 본 99%를 '안 보임'으로 적고, 앞 회차에 한 번 안 보였던 것은 '사라짐'으로 확정해 버려
     *  다음 온전한 회차에서 그 상품들이 '새로 올림'으로 다시 잡히고(부풀림), 사라짐·사라진 날도 틀어졌음. 이제는 회차 기록만 '끝까지 못 읽음'으로 남기고(통계에서 빠짐),
     *  숍 상품 상태(조각)·상품 기록(bench_items)·마지막 온전한 회차는 그대로 → 다음 온전한 회차가 마지막 온전한 회차와 바로 견줌 (그 사이 기간은 spanDays로 나눠 하루 값을 냄) */
    if (!RUN_OK) { const seenN = new Set(prog.items.map((x) => x[0])).size; let dayId = `${sc}_${day}`; { const ex = (await C('bench_days').doc(dayId).get()).data(); if (ex) dayId = `${sc}_${day}_${new Date(Date.parse(prog.startedAt || nowIso()) + 9 * 3600e3).toISOString().slice(11, 16).replace(':', '')}`; }
      const PCH = 2500; const pn = Math.ceil(prog.items.length / PCH); for (let k = 0; k < pn; k++) await C('bench_partial').doc(`${dayId}_${k}`).set({ sc, dayId, k, n: Math.min(PCH, prog.items.length - k * PCH), s: JSON.stringify(prog.items.slice(k * PCH, (k + 1) * PCH)), fmt: 'json', at: nowIso(), ...W() }).catch(() => {}); /* 읽은 상품은 버리지 않고 상품 정보로만 보관 — 벤치마킹 통계·비교에는 쓰지 않음 */
      const newN = prog.light ? prog.newN || 0 : null; await C('bench_days').doc(dayId).set({ sc, name: t.name || sc, day, dayId, base: false, partial: true, complete: false, ...(prog.light ? { light: true, newN, lightStop: prog.lightStop || null } : {}), total: seenN, pages: prog.page, runLastPage: prog.lastPage || null, runAt: prog.startedAt || null, at: nowIso(), pc: PC_NAME, strict: 1, cover: prog.cover ?? null, readTo: prog.page - 1, partialChunks: pn, resumes: prog.resumes || null, anchorLost: prog.anchorLost || null, why: `끝까지 확실히 읽지 못한 회차 — ${prog.fullWhy || `끝 쪽 ${prog.lastPage || '?'}쪽`} · 통계·비교 기준에서 뺌(읽은 상품은 bench_partial에 상품 정보로만)`, ...W() });
      await C('bench_state').doc(sc).set({ ...(!st.okRunAt && st.day && st.complete !== false && st.runAt ? { okRunAt: st.runAt } : {}), prog: null, ...(prog.light ? { lightAt: nowIso(), lastLight: { day, dayId, pages: prog.page - 1, newN: prog.newN || 0, at: nowIso() } } : { partialRuns: firebase.firestore.FieldValue.increment(1), lastPartial: { day, pages: prog.page, lastPage: prog.lastPage || null, seen: seenN, at: nowIso() } }), at: nowIso(), ...W() }, { merge: true });
      if (prog.light) { log(`🎯 '${t.name || sc}': 🆕 새로 올라온 것만 읽음 — ${(prog.page - 1).toLocaleString()}쪽 · 새 상품 ${(prog.newN || 0).toLocaleString()}개 (팔림·사라짐은 숍 전체를 읽는 날 셈 · 숍 전체는 ${prog.fullTxt || '7일에 한 번'})`); return; }
      log(`🎯 '${t.name || sc}': 숍 끝 쪽(${(prog.lastPage || 0).toLocaleString()}쪽)까지 못 읽고 ${prog.page.toLocaleString()}쪽에서 끝난 회차 — 본 ${seenN.toLocaleString()}개만으로는 새로 올림·사라짐을 판단하지 않음(비교 기준·상품 기록 그대로, 통계에서 뺌). 다음 온전한 회차가 마지막 온전한 회차(${st.day || '-'})와 바로 견줌`, 1); return; }
    const okPrev = st.okRunAt || (st.day && st.complete !== false ? st.runAt : null); const spanDays = !st.day ? null : okPrev && prog.startedAt ? Math.max(0, Math.round(((Date.parse(prog.startedAt) - Date.parse(okPrev)) / 864e5) * 100) / 100) : null; /* (1.56.2) 마지막 온전한 회차부터 이 회차까지 며칠어치 변화인지 — 하루 값을 낼 때 나눔 */ const old = new Map(); const nC = st.chunks || 0;
    for (let k = 0; k < nC; k++) { const c = (await C('bench_state').doc(sc).collection('c').doc(String(k)).get()).data(); let M = c && c.m; if (c && c.s) { try { M = JSON.parse(c.s); } catch (e) { M = null; } } if (M) for (const [id, v] of Object.entries(M)) old.set(id, v); } /* (1.53.3) 새 모양 s(글자) · 예전 모양 m 둘 다 읽음 */ /* v = [값, 처음 본 날(YYYYMMDD), 상태, 처음부터 있던 것(1), 제목 앞 40자] */
    const RB = (BREG() || {}).BENCH; const F = RB ? RB.fields(BENCH_CFG) : { price: true, grade: true, title: true, low: true, priceList: true, byline: true, usedCode: true, cover: true, page: true }; /* (1.53.0) 웹앱 ⚙ 수집 항목에서 끈 정보는 모으지 않음 */
    const base = !st.day; const now = new Map(); const add = [], gone = [], moved = []; const dd = (a) => Math.max(0, Math.round((Date.parse(day) - Date.parse(`${String(a).slice(0, 4)}-${String(a).slice(4, 6)}-${String(a).slice(6, 8)}`)) / 864e5));
    const lowOn = [], lowOff = []; /* (1.48.0) '최저가' 표시가 켜지고 꺼진 때 — 덮어쓰지 않고 쌓음 */ const gradeChg = []; /* (1.57.2) 등급·제목이 바뀐 매물 — 지금 목록은 새 값으로 바뀌므로 옛 값을 bench_items에 쌓음 */
    /* (1.48.0) 숍 전체를 읽는 데 몇 시간 걸려, 그동안 앞쪽 상품이 팔리면 뒤 상품이 한 칸씩 당겨져 몇 개는 못 보고 지나감 → 한 번 안 보인 것은 '안 보임 1번'(v[6] = 처음 안 보인 날)으로 두고,
     *   다음 바퀴에도 안 보이면 그때 '사라짐'(사라진 날 = 처음 안 보인 날)으로 셈 · 다시 보이면 놓친 것(돌아옴)으로만 셈 — 사라짐이 하루 늦게 확정되는 대신 잘못 센 사라짐이 없음 */
    const back = [];
    /* v = [0 값, 1 처음 본 날, 2 상태, 3 처음부터 있던 것, 4 제목 앞 40자, 5 배지, 6 처음 안 보인 날, 7 ISBN, 8 주제 분류, 9 출간 연월, 10 상품 페이지 읽음(1)·못 읽음(2)] — (1.53.0) 7~10 추가 · 예전 것을 그대로 이어 받음 */
    const carry = (o) => [o ? o[7] ?? null : null, o ? o[8] ?? null : null, o ? o[9] ?? null : null, o ? o[10] || 0 : 0];
    for (const [id, p0, g0, ti0, isbn, ym, pl, low0, pg0] of prog.items) { const p = F.price ? p0 : null, g = F.grade ? g0 : null, ti = F.title ? ti0 : '', low = F.low ? low0 : 0, pg = F.page ? pg0 : null; const o = old.get(id); const L1 = low ? 1 : 0; if (o) { if (o[6]) back.push(id); now.set(id, [p, o[1], g, o[3] || 0, String(ti || o[4] || '').slice(0, 40), L1, 0, ...carry(o)]); if (p && o[0] && p !== o[0]) moved.push({ id, from: o[0], to: p }); if ((g && o[2] && g !== o[2]) || (ti && o[4] && String(ti).slice(0, 40) !== o[4])) gradeChg.push({ id, g0: o[2] || null, g, t0: o[4] || null, t: String(ti || '').slice(0, 40) || null }); if (L1 && !o[5]) lowOn.push({ id, p, g, pg, t: ti }); if (!L1 && o[5]) lowOff.push({ id, p, g, pg, t: ti }); } else { now.set(id, [p, dayN, g, base ? 1 : 0, String(ti || '').slice(0, 40), L1, 0, null, null, null, 0]); if (!base) add.push({ id, t: ti, p, g, isbn, ym, pl: F.priceList ? pl : null, low: L1 }); if (L1) lowOn.push({ id, p, g, pg, t: ti, first: true }); } }
    /* (1.56.5) 숍을 다 못 읽은 회차(절반 넘게 읽어 쓰는 회차): 못 읽은 쪽의 상품은 '못 본 것'일 뿐 — 안 보임·사라짐으로 적지 않고 지난 상태 그대로 둠(팔리지 않은 것으로 셈).
     *  사라짐은 숍을 끝까지 다 읽은 회차에서 실제로 안 보일 때만 셈(그때부터 평소처럼: 한 번 안 보임 → 다음 온전한 회차에도 없으면 사라짐) */
    const FULL = prog.cover == null || prog.cover >= 1; let notRead = 0;
    if (!FULL) for (const [id, o] of old) { if (now.has(id)) continue; now.set(id, o.slice()); notRead++; }
    const miss = []; for (const [id, o] of old) { if (now.has(id)) continue; if (o[6]) gone.push({ id, p: o[0], g: o[2], first: o[1], life: dd(o[1]) - dd(o[6]), base: !!o[3], t: o[4] || null, low: !!o[5], missDay: o[6], isbn: o[7] || null, cat: o[8] || null, ym: o[9] || null }); else { miss.push(id); now.set(id, [o[0], o[1], o[2], o[3] || 0, o[4] || '', o[5] || 0, dayN, ...carry(o)]); } }
    const dt = await benchDetail(t, now, new Set(add.map((x) => x.id)), F); add.forEach((x) => { const v = now.get(x.id); if (v) { x.isbn = v[7] || x.isbn || null; x.cat = v[8] || null; x.ym = v[9] || x.ym || null; } });
    const seenN = now.size - miss.length - notRead; /* (1.56.5) 이번에 실제로 본 상품 수 (못 읽은 쪽 상품은 빼고) */ const ymd = (a) => `${String(a).slice(0, 4)}-${String(a).slice(4, 6)}-${String(a).slice(6, 8)}`;
    const AU = firebase.firestore.FieldValue.arrayUnion; let B = db.batch(), n = 0, wN = 0, wT = Date.now(), wL = Date.now(); const flush = async () => { if (n) { await B.commit(); wN += n; B = db.batch(); n = 0; if (Date.now() - wL > 30000) { wL = Date.now(); log(`🎯 '${t.name || sc}' 저장 중 — 상품 기록 ${wN.toLocaleString()}건 (${Math.round((Date.now() - wT) / 1000)}초)`); ui(`집중 벤치마킹 · ${t.name || sc} · 저장 중`, wN, wN, `상품 기록 ${wN.toLocaleString()}건 저장함`); } } };
    const byId = new Map(prog.items.map((x) => [x[0], x]));
    for (const id of base ? [...now.keys()] : add.map((x) => x.id)) { const x = byId.get(id); const v = now.get(id) || []; B.set(C('bench_items').doc(`${sc}_${id}`), { sc, id, title: F.title ? x[3] || '' : '', price: F.price ? x[1] ?? null : null, grade: F.grade ? x[2] || null : null, isbn: v[7] || x[4] || null, cat: v[8] || null, coverKey: F.cover ? x[11] || null : null, pubYm: v[9] || x[5] || null, priceList: F.priceList ? x[6] ?? null : null, usedCode: F.usedCode ? x[9] || null : null, byline: F.byline ? x[10] || null : null, firstDay: day, firstPage: F.page ? x[8] || null : null, base, ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const id of dt.filled) { if (base || dt.newIds.has(id)) continue; const v = now.get(id); B.set(C('bench_items').doc(`${sc}_${id}`), { sc, id, isbn: v[7] || null, cat: v[8] || null, pubYm: v[9] || null, detailAt: nowIso(), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const x of gone) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { sc, id: x.id, goneDay: ymd(x.missDay), goneConfirmDay: day, lifeDays: x.base ? null : x.life, ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    const nowI = prog.startedAt || nowIso(); /* (1.52.0) 같은 날 저장을 다시 해도 같은 기록이 두 번 쌓이지 않게 '읽기 시작 시각'으로 고정 */ for (const x of lowOn) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { sc, id: x.id, lowNow: true, lowEvents: AU({ d: day, at: nowI, on: true, p: x.p ?? null, g: x.g || null, page: x.pg || null }), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const x of lowOff) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { sc, id: x.id, lowNow: false, lowEvents: AU({ d: day, at: nowI, on: false, p: x.p ?? null, g: x.g || null, page: x.pg || null }), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const x of gone.filter((y) => y.low)) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { lowEvents: AU({ d: day, at: nowI, gone: true, p: x.p ?? null }), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const x of moved) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { sc, id: x.id, prices: AU({ d: day, p: x.to, from: x.from }), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    for (const x of gradeChg) { B.set(C('bench_items').doc(`${sc}_${x.id}`), { sc, id: x.id, infoEvents: AU({ d: day, ...(x.g !== x.g0 ? { g0: x.g0, g: x.g } : {}), ...(x.t !== x.t0 ? { t0: x.t0, t: x.t } : {}) }), ...W() }, { merge: true }); if (++n >= 400) await flush(); }
    await flush(); if (wN) log(`🎯 '${t.name || sc}' 상품 기록 ${wN.toLocaleString()}건 저장 끝 (${Math.round((Date.now() - wT) / 1000)}초)`);
    const band = (p) => (!p ? '?' : p < 3000 ? '~3천' : p < 6000 ? '3~6천' : p < 10000 ? '6천~1만' : p < 20000 ? '1~2만' : p < 40000 ? '2~4만' : '4만~'); const cntBy = (L, f) => L.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
    /* (1.52.0) Firebase는 '목록 안의 목록'을 저장하지 못함(Nested arrays are not supported) → 한 줄을 글자(JSON)로 바꿔 담음 · 웹앱은 글자·목록 둘 다 읽음 */
    const JR = (a) => JSON.stringify(a.map((v) => (v === undefined ? null : v))); const T60 = (t) => (t ? String(t).slice(0, 60) : null); const cat2 = (c) => String(c || '').split('>').slice(0, 3).join('>');
    const all = [...now.values()].filter((v) => !v[6]); const sumD = { sc, name: t.name || sc, day, base, notRead, full: FULL, total: seenN + notRead, seen: seenN, missOnce: miss.length, missBack: back.length, add: add.length, gone: gone.length, goneNew: gone.filter((x) => !x.base).length, moved: moved.length, pages: prog.page,
      totalBand: cntBy(all, (v) => band(v[0])), totalGrade: cntBy(all, (v) => v[2] || '?'), addBand: cntBy(add, (x) => band(x.p)), addGrade: cntBy(add, (x) => x.g || '?'), addYear: cntBy(add, (x) => (x.ym ? x.ym.slice(0, 4) : '?')),
      goneBand: cntBy(gone, (x) => band(x.p)), goneGrade: cntBy(gone, (x) => x.g || '?'), goneLife: cntBy(gone.filter((x) => !x.base), (x) => (x.life <= 3 ? '0~3일' : x.life <= 7 ? '4~7일' : x.life <= 14 ? '8~14일' : x.life <= 30 ? '15~30일' : x.life <= 60 ? '31~60일' : '61일~')),
/* (1.54.0) 💰 판매가 합 — 지금 숍 전체(재고 가치)·배지 보유분·이번 회차 사라진 것·새로 올린 것 (목록은 3,000개까지만 담지만 합은 전부로) */
      complete: RUN_OK, strict: 1, cover: prog.cover ?? null, readTo: prog.page - 1, spanDays, resumes: prog.resumes || null, anchorLost: prog.anchorLost || null, runLastPage: prog.lastPage || null, /* (1.54.2) 숍 끝 쪽까지 읽은 회차인지 — 웹앱·순서표는 끝까지 못 읽은 회차를 셈에서 빼고 곧바로 다시 읽을 차례로 */
      sumNow: all.reduce((a2, v) => a2 + (+v[0] || 0), 0), priceN: all.filter((v) => +v[0] > 0).length, sumLow: all.filter((v) => v[5]).reduce((a2, v) => a2 + (+v[0] || 0), 0), sumGone: gone.reduce((a2, x) => a2 + (+x.p || 0), 0), sumGoneNew: gone.filter((x) => !x.base).reduce((a2, x) => a2 + (+x.p || 0), 0), sumAdd: add.reduce((a2, x) => a2 + (+x.p || 0), 0),
      lowNow: all.filter((v) => v[5]).length, lowOn: lowOn.length, lowOff: lowOff.length, goneLow: gone.filter((x) => x.low).length, goneLowNew: gone.filter((x) => x.low && !x.base).length, addLow: add.filter((x) => x.low).length, lowBand: cntBy(all.filter((v) => v[5]), (v) => band(v[0])), lowOnList: lowOn.slice(0, 1000).map((x) => JR([x.id, T60(x.t), x.p, x.g, x.pg || null])), lowOffList: lowOff.slice(0, 1000).map((x) => JR([x.id, T60(x.t), x.p, x.g])),
      addList: add.slice(0, 3000).map((x) => JR([x.id, T60(x.t), x.p, x.g, x.ym, x.isbn, x.pl, x.low, x.cat || null])), goneList: gone.slice(0, 3000).map((x) => JR([x.id, T60(x.t), x.p, x.g, x.base ? null : x.life, x.first, x.low ? 1 : 0, x.isbn || null, x.cat || null, x.ym || null])), movedList: moved.slice(0, 1000).map((x) => JR([x.id, x.from, x.to])), rowFmt: 'json',
      addCat: cntBy(add.filter((x) => x.cat), (x) => cat2(x.cat)), goneCat: cntBy(gone.filter((x) => x.cat), (x) => cat2(x.cat)), detailNow: [...now.values()].filter((v) => v[10] === 1).length, detailRun: dt.tried, detailOk: dt.filled.length, runAt: prog.startedAt || null, fieldsOff: Object.keys(F).filter((k) => !F[k]), at: nowIso(), pc: PC_NAME, ...W() };
    /* (1.53.0) Firebase 문서 한 개는 1MB까지 — 목록이 길면 긴 목록부터 줄이고 '일부만' 표시(숫자 합계는 그대로 정확) */
    { const sz = () => new TextEncoder().encode(JSON.stringify(sumD)).length; const Ls = ['addList', 'goneList', 'lowOnList', 'lowOffList', 'movedList']; let g = 0; while (sz() > 900000 && g++ < 40) { const k = Ls.slice().sort((a, b) => sumD[b].length - sumD[a].length)[0]; sumD[k] = sumD[k].slice(0, Math.floor(sumD[k].length * 0.8)); sumD.trunc = { ...(sumD.trunc || {}), [k]: sumD[k].length }; } }
    /* (1.53.0) 하루에 여러 번 읽으면 하루 요약도 회차마다 따로(덮어쓰지 않음): 그날 첫 회차 = {판매자_날짜} · 다음 회차 = {판매자_날짜_시분} */
    let dayId = `${sc}_${day}`; { const ex = (await C('bench_days').doc(dayId).get()).data(); if (ex && ex.runAt && prog.startedAt && ex.runAt !== prog.startedAt) dayId = `${sc}_${day}_${new Date(Date.parse(prog.startedAt) + 9 * 3600e3).toISOString().slice(11, 16).replace(':', '')}`; else if (ex && !ex.runAt && prog.startedAt && ex.at && Date.parse(ex.at) < Date.parse(prog.startedAt)) dayId = `${sc}_${day}_${new Date(Date.parse(prog.startedAt) + 9 * 3600e3).toISOString().slice(11, 16).replace(':', '')}`; }
    sumD.dayId = dayId; await C('bench_days').doc(dayId).set(sumD);
    const ent = [...now.entries()]; const CH = 2500; /* (1.53.0) 상품마다 ISBN·분류가 붙어 한 조각 2,500개로 (Firebase 문서 1MB 한도) */ const chunks = Math.ceil(ent.length / CH); for (let k = 0; k < chunks; k++) await C('bench_state').doc(sc).collection('c').doc(String(k)).set({ s: JSON.stringify(Object.fromEntries(ent.slice(k * CH, (k + 1) * CH))), n: Math.min(CH, ent.length - k * CH), fmt: 'json', day, at: nowIso() }); /* (1.53.3) 조각을 글자(JSON) 한 칸으로 — 상품마다 목록(값 11개)을 칸으로 두면 Firebase가 칸마다 색인을 만들어 '색인 항목이 너무 많음(too many index entries)'으로 거절했음 */
    await C('bench_state').doc(sc).set({ sc, name: t.name || sc, day, runAt: prog.startedAt || nowIso(), endAt: nowIso(), runs: firebase.firestore.FieldValue.increment(1), detailNow: sumD.detailNow, total: seenN + notRead, missOnce: miss.length, notRead, pages: prog.page, lastPage: prog.lastPage || st.lastPage || null, chunks, startDay: st.startDay || day, secPerPage: st.secPerPage || null, lowNow: all.filter((v) => v[5]).length, prog: null, complete: RUN_OK, okRunAt: prog.startedAt || nowIso(), okEndAt: nowIso(), ...(FULL ? { completeEndAt: nowIso() } : {}), readEndAt: prog.readEndAt || null, at: nowIso(), ...W() }, { merge: true }); /* (1.63.8) completeEndAt = 숍 끝까지 다 읽은 회차가 끝난 때(⏭ 건너뛰기 기준) */ /* (1.54.0) 회차 끝 — 하는 중 표시 지움 · (1.54.2) 끝까지 읽었는지 */
    log(`집중 벤치마킹 '${t.name || sc}': ${seenN.toLocaleString()}개${miss.length ? ` · 이번에 안 보임 ${miss.length}(내일도 없으면 사라짐)` : ''}${back.length ? ` · 어제 놓쳤다 다시 보임 ${back.length}` : ''} · ${base ? '첫 바퀴(오늘부터 새로 올린 것을 셈)' : `새로 올림 ${add.length} · 사라짐 ${gone.length}(최저가였던 것 ${gone.filter((x) => x.low).length}) · 값 바뀜 ${moved.length} · 최저가배지 지금 ${all.filter((v) => v[5]).length}개(새로 ${lowOn.length} · 잃음 ${lowOff.length})`}`); }


  async function runChain(onlyPrd) { const DOC = onlyPrd ? 'prdChain' : 'chain'; const NAME = onlyPrd ? '상품 일괄 수집' : '모두 일괄 수집';
      if (!(await preflight(!!window.__rnRemote || !!window.__rnAuto))) { log('시작 전 점검에서 꼭 고칠 것이 있어 시작하지 않았습니다', 1); return 'cancel'; }
      const prev = (await C('prd_jobs').doc(DOC).get()).data();
      const ORDER0 = CHAIN_ORDER; // 수집기가 하는 모든 것 (단계마다 켜고 끔) — (1.63.0) 단추 글·체크 목록과 같은 차례 한 곳
      const ORDER = onlyPrd ? ORDER0.filter((k) => k !== 'crm') : ORDER0;
      const on = (k) => (SET.steps || {})[k] !== false;
      let st = prev && !prev.done && ORDER.includes(prev.stage) ? prev.stage : ORDER[0];
      const CS = window.__rnStatus.chain = { order: ORDER, labels: STEP_LABEL, on: Object.fromEntries(ORDER.map((k) => [k, on(k)])), res: Object.fromEntries(ORDER.slice(0, ORDER.indexOf(st)).map((k) => [k, 'done'])), cur: null };
      await C('prd_jobs').doc(DOC).set({ done: false, stage: st, by: LS.get('pcName', PC_ID), savedAt: Date.now(), ...W() }, { merge: true });
      const RUN = { crm: async () => { if (!window.__rnCrm) { log('고객 수집 모듈이 없어 건너뜀', 1); return; }
        const li = await window.__rnCrm.localInfo(); if (false && !li.complete && li.pops < 1000 && !(SET.crmAnyPc)) { log(`고객·주문: 이 PC(${PC_NAME})는 고객 일괄 수집을 끝까지 한 적이 없고 상세까지 받은 주문이 ${li.pops}건뿐이라(목록 줄 ${li.lines}), 하면 이미 받은 주문을 못 알아보고 전부 다시 엽니다 → 건너뜀. 고객·주문은 기록이 있는 PC(${SET.autoPc || 'JS-MAIN'})가 맡습니다`, 1); return 'skip'; } ui('고객·주문 전체 일괄 수집', 0, 0, '고객 탭에서 진행 상황을 볼 수 있습니다'); await window.__rnCrm.start('bulk', { fresh: true }); },
        scanNew: () => scan('new'), aladinBuy: () => aladinBuyJob(), buyback: () => buybackJob(), market: () => market(), rev6m: () => rev6mJob('stale'), revTop: () => reviewJob('top'), dynamic: () => dynJob(SET.dynDaily || 0),
        soldInfo: async () => { const r = await soldInfoJob(); return r; }, poolInfo: () => poolInfoJob(), photos: () => photosJob(), usedInfo: () => usedInfoJob(), nbMarket: () => nbMarketJob(), bench: () => benchJob({ force: true }), images: async () => { await images(); }, scanFull: () => scan('full'), revAll: () => reviewJob('all') };
      for (let i = ORDER.indexOf(st); i < ORDER.length; i++) {
        const k = ORDER[i]; if (!on(k)) { log(`일괄 수집: '${STEP_LABEL[k]}' 끔 → 건너뜀`); continue; }
        if (k === 'scanFull' || k === 'revAll') { const days = k === 'scanFull' ? (SET.scanFullDays ?? 7) : (SET.revAllDays ?? 7); const jd = (await jobRef(k).get()).data() || {}; if (jd.done && jd.finishedAt && Date.now() - jd.finishedAt < days * 864e5) { log(`일괄 수집: '${STEP_LABEL[k]}'은(는) ${Math.round((Date.now() - jd.finishedAt) / 864e5 * 10) / 10}일 전에 했음 (${days}일마다) → 건너뜀`); CS.res[k] = 'done'; continue; } }
        const tS = Date.now(); CS.cur = k; window.__rnStatus.cur = {}; window.__rnPhaseReset && window.__rnPhaseReset(k === 'crm' ? 'crm' : 'prd', STEP_LABEL[k]); log(`[일괄 ${i + 1}/${ORDER.length}] ▶ '${STEP_LABEL[k]}' 시작`);
        curStage = k; lastSame = false; let rr; try { rr = await RUN[k](); } catch (e) { if (e && e.message === '멈춤') throw e; log(`[일괄] '${STEP_LABEL[k]}' 오류: ${e && e.message} — 이 단계는 실패로 두고 다음 단계로 갑니다 (진행 위치는 저장돼 다음에 이어감)`, 1); rr = 'error'; } finally { curStage = null; }
        log(`[일괄 ${i + 1}/${ORDER.length}] ${rr === false ? '■ 시작 못 함' : stopFlag ? '■ 멈춤' : rr === 'partial' ? '◐ 정한 시간만큼 함 (나머지는 다음 일괄 때 이어서)' : '✓ 끝'} '${STEP_LABEL[k]}' (${Math.round((Date.now() - tS) / 60000)}분)`);
        if (window.__rnPaused || stopFlag) { CS.res[k] = 'wait'; CS.cur = null; log(`[일괄] '${STEP_LABEL[k]}' 중 일시정지 — 다음 단계로 넘어가지 않고 여기서 멈춤 (이어하기로 이 단계부터)`); throw new Error('멈춤'); }
        CS.res[k] = rr === 'error' ? 'fail' : rr === 'partial' ? 'partial' : rr === 'skip' ? 'skip-busy' : rr === false ? (lastSame ? 'skip-busy' : 'fail') : stopFlag ? 'wait' : 'done'; CS.cur = null;
        if (rr === false && lastSame) { log(`일괄 수집: '${STEP_LABEL[k]}'은(는) 다른 PC가 하고 있어 건너뛰고 다음 단계로`); lastSame = false; continue; } // 같은 작업을 다른 PC(예: HOME)가 하는 중
        if (rr === 'error') continue;
        if (rr === false) return false;
        if (stopFlag) throw new Error('멈춤');
        if (ORDER[i + 1]) await C('prd_jobs').doc(DOC).set({ stage: ORDER[i + 1], savedAt: Date.now() }, { merge: true });
        if (ORDER[i + 1] && window.__rnOutdated && GM_getValue('rnu-reload-for', null) !== window.__rnOutdated && !(window.__rnCrm && window.__rnCrm.busy())) { log(`단계 사이: 새 수집기 ${window.__rnOutdated}로 바꿔 '${STEP_LABEL[ORDER[i + 1]]}'부터 이어갑니다`); GM_setValue('rnu-reload-for', window.__rnOutdated); safeReload('새 버전으로 바꿈', onlyPrd ? 'prdChain' : 'chain'); return 'reload'; }
      }
      await finishJob(DOC, { finishedBy: PC_NAME });
  }

  /* ───────── 우리 상품 사진: 새상품 페이지가 없거나 표지 사진이 없을 때 ─────────
   * 우리 중고 상품 페이지(wproduct.aspx?ItemId=우리 상품번호)의 사진을 전부: 위쪽 표지 영역 + '중고상품 구매 유의 사항' 안 사진
   * 저장: Storage img/listing/{U코드}/{순서}.jpg (+작은 사진), prd_listings.photos — 이미 받은 상품은 다시 안 받음
   * 우리 상품 페이지가 없거나 사진이 없으면: 상품명 검색에서 이름이 90% 이상 같은 상품의 사진 → 그래도 없으면 건너뜀 (검색 결과 화면 확인 후 연결 예정) */
  /* ───────── 경쟁 매물 유의사항·사진 (1.25.0) ─────────
   * 대상: 판매 중인 우리 책마다 온라인 중고 첫 페이지(prd_book_metrics.usedFirstPage)의 다른 판매자 매물 '전부'(우리 매물 빼고, 알라딘측 포함). 가격 감시 중인 책 먼저
   * 내용: 매물 페이지의 '중고상품 구매 유의 사항' 글 전체와 사진 — 새상품 표지와 다른 사진(판매자 실사진)이 있는지
   * 저장: prd_used_info/{매물번호} = 지금 내용 요약 + 확인 시각, prd_used_info/{매물번호}/v/{순번} = 내용이 바뀔 때마다 그 판 그대로 쌓음
   *       (데이터 철칙: 한 번 들어온 내용은 덮어쓰지 않고 보관 — 같으면 판을 늘리지 않고 확인 시각만)
   * 다시 확인 주기: 설정 '경쟁 매물 유의사항·사진: 다시 확인하는 주기(일)'(기본 30일, 0 = 매번)
   * 진행 위치 저장(중단·재개), 알라딘 작업 잠금·요청 속도 자동 조절 공유, 저장 권한이 없으면 시작하지 않음 */
  async function usedInfoJob() {
    try { await C('prd_used_info').doc('_check').set({ check: true, at: nowIso(), ...W() }, { merge: true }); } catch (e) { log(`경쟁 매물 유의사항: 저장 권한 없음(prd_used_info) — Firestore 규칙에 허용 필요 (${e.code || e.message})`, 1); return false; }
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      let prog = await loadProgress('usedInfo');
      if (prog && prog.list && prog.v !== 2) { log(`경쟁 매물 유의사항·사진: 예전 방식 목록(첫 페이지 매물 전부 ${prog.list.length.toLocaleString()}개, ${prog.i.toLocaleString()}번째까지 함)을 새 기준(우리보다 앞·바로 뒤 매물만)으로 다시 만듭니다 — 이미 본 매물은 ${SET.usedInfoDays ?? 30}일 동안 건너뜀`); prog = null; }
      if (!prog || !prog.list) {
        await loadListings();
        const PRx = window.ReadnowPricing || globalThis.ReadnowPricing || null; let pcfg = {}; try { const d = await C('prd_system').doc('pricing').get(); pcfg = d.exists ? d.data() : {}; } catch (e) {}
        const S0 = { rollout: pcfg.rollout || (PRx && PRx.DEFAULTS.rollout), excludeSku: pcfg.excludeSku || (PRx && PRx.DEFAULTS.excludeSku), excludeUsed: pcfg.excludeUsed || [] };
        const books = new Map();
        for (const [, l] of LISTINGS) { if (!l.active || !l.bookId) continue; const b = books.get(l.bookId) || { ours: new Set(), mon: false }; b.ours.add(l.usedCode); if (PRx) { const g = PRx.groupOfListing(l, S0); if (g === 'treat' || g === 'control') b.mon = true; } books.set(l.bookId, b); }
        const seen = new Map(); (await C('prd_used_info').get()).forEach((d) => { if (d.id !== '_check') seen.set(d.id, d.data().checkedAt || d.data().at || ''); });
        const days = FORCE_ALL ? 0 : SET.usedInfoDays ?? 30; const cut = days > 0 ? new Date(Date.now() - days * 864e5).toISOString() : '9999';
        const items = []; const ids = [...books.keys()];
        for (let k = 0; k < ids.length; k += 10) { const part = ids.slice(k, k + 10); const snaps = await Promise.all(part.map((id) => C('prd_book_metrics').doc(id).get()));
          snaps.forEach((d, n) => { const m = d.data(); if (!m || !m.usedFirstPage) return; const b = books.get(part[n]);
            // (1.38.0) 가격에 영향을 주는 매물만: 첫 페이지에서 우리 첫 매물보다 앞에 있는 매물 + 바로 뒤 몇 개(설정, 기본 3). 우리 매물이 첫 페이지에 없으면 맨 앞 몇 개(기본 5)
            //   예전: 첫 페이지 다른 판매자 매물 전부(10/8 기준 17만 개, 1초에 1개 → 47시간) — 일괄 수집이 이 단계에서 이틀 가까이 멈춰 있었음
            const rows = m.usedFirstPage.filter((r) => r && r.listingId && !r.soldOut); const ourIx = rows.findIndex((r) => String(r.sellerCode) === '996008' || b.ours.has(r.usedCode));
            const lim = ourIx >= 0 ? ourIx + 1 + (SET.usedInfoAfter ?? 3) : (SET.usedInfoTopN ?? 5);
            rows.slice(0, lim).filter((r) => String(r.sellerCode) !== '996008' && !b.ours.has(r.usedCode)).forEach((r) => { if (seen.has(String(r.listingId)) && seen.get(String(r.listingId)) > cut) return; items.push({ lid: String(r.listingId), bookId: part[n], sc: r.sellerCode || null, name: r.sellerName || null, mon: b.mon ? 1 : 0 }); }); }); }
        const uniq = [...new Map(items.map((x) => [x.lid, x])).values()].sort((a, b) => b.mon - a.mon);
        prog = { v: 2, list: uniq, i: 0, ok: 0, same: 0, changed: 0, none: 0, fail: 0, startedAt: nowIso() }; await saveProgress('usedInfo', prog);
        log(`경쟁 매물 유의사항·사진: 우리보다 앞·바로 뒤 ${SET.usedInfoAfter ?? 3}개 매물(우리가 없으면 맨 앞 ${SET.usedInfoTopN ?? 5}개) ${uniq.length.toLocaleString()}개 (가격 감시 중인 책 ${uniq.filter((x) => x.mon).length.toLocaleString()}개 먼저, ${days > 0 ? days + '일 안에 본 것은 건너뜀' : '매번 전부'})`);
      }
      const covers = new Map(); const tBud = Date.now(); const budMin = curStage === 'usedInfo' ? (SET.usedInfoChainMin ?? 60) : 0; // (1.38.0) 일괄 수집 안에서는 정한 분(기본 60분)만 하고 다음 단계로 — 나머지는 저장해 두었다가 다음 일괄 때 이어서
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('usedInfo', prog); throw new Error('멈춤'); }
        if (budMin > 0 && Date.now() - tBud > budMin * 60000) { await saveProgress('usedInfo', prog); log(`경쟁 매물 유의사항·사진: 일괄 수집 안에서 정한 ${budMin}분을 다 써서 다음 단계로 갑니다 (${prog.i.toLocaleString()} / ${prog.list.length.toLocaleString()} — 나머지는 다음 일괄 때 이 자리부터)`); return 'partial'; }
        const x = prog.list[prog.i]; const at = nowIso();
        if (!covers.has(x.bookId)) { try { const b = (await C('prd_books').doc(x.bookId).get()).data() || {}; covers.set(x.bookId, (b.images && b.images.front && (b.images.front.src || b.images.front.stored)) || null); } catch (e) { covers.set(x.bookId, null); } }
        try {
          const g = await pubItem(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${x.lid}`);
          const info = P.parseUsedItemInfo(g.doc, covers.get(x.bookId));
          const ref = C('prd_used_info').doc(x.lid); const prev = (await ref.get()).data();
          const sig = JSON.stringify([info.note, info.photos.map((p) => p.file)]);
          const ver = { note: info.note || null, hasNote: info.hasNote, photos: info.photos.map((p) => ({ src: p.src, where: p.where, file: p.file })), sellerPhotoCount: info.sellerPhotoCount, photoDiff: info.photoDiff, coverKnown: info.coverKnown, found: info.found, sig, at };
          if (prev && prev.sig === sig) { await ref.set({ checkedAt: at }, { merge: true }); prog.same++; } // 같은 내용: 판을 늘리지 않고 확인 시각만
          else if (prev && (prev.note || (prev.photos || []).length) && (!info.found || (!info.note && !info.photos.length))) { await ref.set({ lastMissAt: at }, { merge: true }); prog.same++; } // (1.34.0) 화면을 못 읽어 빈 내용이면 있던 유의 사항을 덮지 않음
          else {
            const n = (prev && prev.versions) || 0; const b = db.batch();
            b.set(ref.collection('v').doc(String(n + 1).padStart(4, '0')), { ...ver, listingId: x.lid, ...W() }); // 바뀐 판은 따로 쌓음 (이전 판은 그대로 남음)
            b.set(ref, { listingId: x.lid, bookId: x.bookId, sellerCode: x.sc, sellerName: x.name, ...ver, versions: n + 1, firstAt: (prev && prev.firstAt) || at, checkedAt: at, ...W() }, { merge: true });
            await b.commit(); if (prev) prog.changed++; else if (info.found) prog.ok++; else prog.none++;
          }
        } catch (e) { if (e && e.message === '멈춤') throw e; prog.fail++; }
        ui('경쟁 매물 유의사항·사진', prog.i + 1, prog.list.length, `새로 ${prog.ok} · 바뀜 ${prog.changed} · 같음 ${prog.same} · 페이지 없음 ${prog.none} · 실패 ${prog.fail}`);
        if (prog.i % 5 === 0) await saveProgress('usedInfo', prog);
      }
      await finishJob('usedInfo', { ok: prog.ok, changed: prog.changed, same: prog.same, none: prog.none, fail: prog.fail });
      log(`경쟁 매물 유의사항·사진 완료: 새로 ${prog.ok} · 바뀜 ${prog.changed} · 같음 ${prog.same} · 페이지 없음 ${prog.none} · 실패 ${prog.fail}`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 발송 요청 읽기 = 오늘 출고 (1.27.0) ─────────
   * 판매관리 ② 발송 요청 탭(worder_delivery.aspx?orderstep=4)의 주문을 모두 읽어 웹앱 '오늘 출고' 화면에 보냄 (서가 순서 정렬은 웹앱·공용 파일 readnow-shipping-core.js)
   * 저장: shp_state/current(지금 목록) · shp_snapshots(목록이 바뀔 때마다 그 판을 시각과 함께) · shp_orders/{주문번호}(처음 본 시각·마지막 본 시각·수령인·상품)
   * 상품마다 우리 매물 페이지의 '중고상품 구매 유의 사항' 글·사진도 함께 읽어 prd_used_info에 판으로 쌓음(하루 지난 것만 다시)
   * 영업일 9~16시에는 쉬는 동안 설정한 분(shipAutoMin, 기본 15분)마다 저절로 다시 읽음 (주문이 모이는 대로 웹앱 목록이 늘어남) */
  /* (1.34.5) 우리 매물 구매 유의 사항·사진 한 건 읽기 → prd_used_info (바뀐 판만 v/ 에 쌓음, 덮어써 지우지 않음)
   *  · 화면에 '유의 사항' 칸(#usedDecription)이 없으면 쓰지 않음 (다른 화면·읽기 실패) — 예전엔 위쪽 표지 사진만 보고 '읽음'으로 쳐 빈 판을 쌓기도 했음
   *  · 있던 유의 사항을 빈 것으로 바꾸지 않음 · '중' 상품인데 글이 비면 잘못 읽은 것으로 보고 쓰지 않음(한 번 더 읽어 봄) */
  async function readOurUsed(lid, grade, prev, at) { at = at || nowIso(); const ref = C('prd_used_info').doc(String(lid));
    let info = null, box = false;
    for (let t = 0; t < 2; t++) { const pg = await getDoc(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${lid}${t ? '&_=' + Date.now() : ''}`); info = P.parseUsedItemInfo(pg.doc, null); box = !!pg.doc.getElementById('usedDecription');
      if (box && (info.hasNote || grade !== '중')) break; await sleep(1500); }
    if ((!box || !info.hasNote) && !PUBONLY && P.parseScmEditNote) { try { const sg = await getDoc(`https://www.aladin.co.kr/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=${lid}`); const sc = P.parseScmEditNote(sg.doc); if (sc && sc.found) { const top = (info && info.photos ? info.photos : []).filter((x) => x.where === 'top'); info = { ...(info || {}), note: sc.note, hasNote: sc.hasNote, photos: [...top, ...sc.photos], sellerPhotoCount: sc.photos.length, photoDiff: sc.photos.length > 0 || !!(info && info.photoDiff) }; box = true; } } catch (e) {} } /* (1.77.6) 공개 화면에 안 보이면(주문 중 비공개 등) 샵매니저 상품 수정 화면(bookDesc)에서 — 클라우드 0.16.7과 같은 길 · 로거는 로그인 화면을 열지 않음 */
    const miss = (why) => ref.set({ lastMissAt: at, lastMissWhy: why, lastMissBy: PC_NAME }, { merge: true }).catch(() => {}).then(() => ({ wrote: false, miss: why, prev }));
    if (!box) return miss('상품 화면에 유의 사항 칸이 없음');
    if (!info.hasNote && prev && prev.note) return miss('빈 내용 — 있던 유의 사항 그대로 둠');
    if (!info.hasNote && grade === '중') return miss("'중' 상품인데 유의 사항 글이 비어 있음");
    const sig = JSON.stringify([info.note, info.photos.map((x) => x.file)]);
    if (prev && prev.sig === sig) { await ref.set({ checkedAt: at }, { merge: true }); return { wrote: false, same: true, note: prev.note }; }
    const nv = ((prev && prev.versions) || 0) + 1; const b = db.batch(); const ver = { note: info.note || null, hasNote: info.hasNote, photos: info.photos.map((x) => ({ src: x.src, where: x.where, file: x.file })), sellerPhotoCount: info.sellerPhotoCount, photoDiff: info.photoDiff, found: true, sig, at };
    b.set(ref.collection('v').doc(String(nv).padStart(4, '0')), { ...ver, listingId: String(lid), ...W() }); b.set(ref, { listingId: String(lid), sellerCode: '996008', ours: true, ...ver, versions: nv, firstAt: (prev && prev.firstAt) || at, checkedAt: at, ...W() }, { merge: true }); await b.commit();
    return { wrote: true, note: info.note || null }; }
  /* (1.34.6) 출고 목록 빠른 반영: 주문확인요청(①)·발송 요청(②) 화면을 읽은 그대로 Firebase에 — 발송준비시작 직후·웹앱이 '다시 읽기'를 맡겼을 때 바로 씀
   *  (예전: 발송준비시작을 눌러도 목록은 다음 '발송 요청 읽기'(다른 작업 중이면 끝난 뒤)나 클라우드 다음 회차까지 그대로 → 웹앱에 계속 주문확인요청으로 남음)
   *  상품 보강(enrich)·엑셀·유의 사항은 건드리지 않음 (전체 '발송 요청 읽기'가 따로 함) */
  async function saveConfirmState(rc, at) { const cc = (await C('shp_state').doc('confirm').get()).data(); const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)]));
    if (!cc || cc.sig !== csig) { const bc = db.batch(); bc.set(C('shp_state').doc('confirm'), { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: PC_NAME, enrich: (cc && cc.enrich) || {}, ...W() });
      for (const o of rc.orders) bc.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }, { merge: true });
      await bc.commit(); return true; } await C('shp_state').doc('confirm').set({ at, tabCounts: rc.tabCounts, ...W() }, { merge: true }); return false; }
  async function saveDelivLite(r, at) { const cur = (await C('shp_state').doc('current').get()).data(); const sig = JSON.stringify(r.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId), o.deliveryNo]));
    if (cur && cur.sig === sig) { await C('shp_state').doc('current').set({ at, tabCounts: r.tabCounts, pc: PC_NAME, ...W() }, { merge: true }); return false; }
    const b = db.batch(); b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, orders: r.orders, sig, pc: PC_NAME, ...W() }, { merge: true }); // 엑셀은 그대로 둠
    b.set(C('shp_snapshots').doc(at.replace(/[:.]/g, '-')), { at, tabCounts: r.tabCounts, orders: r.orders, ...W() });
    for (const o of r.orders) b.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, stage: '발송 요청', lastSeenAt: at, ...(cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { firstSeenAt: at }), buyer: o.buyer, recipient: o.recipient, orderedAt: o.orderedAt, items: o.items, carrier: o.carrier, ...W() }, { merge: true });
    await b.commit(); return true; }
  async function shipLiteRead(SH, gcDoc) { const at = nowIso(); const out = {};
    try { const rc = SH.parseDeliveryPage(gcDoc || (await getDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx')).doc); if (rc && rc.tabCounts && Object.keys(rc.tabCounts).length) { out.confirm = rc.orders.length; await saveConfirmState(rc, at); } } catch (e) { log('주문확인요청 빠른 읽기 실패: ' + e.message, 1); }
    try { const r = SH.parseDeliveryPage((await getDoc('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4')).doc); if (r && r.tabCounts && Object.keys(r.tabCounts).length) { out.deliv = r.orders.length; await saveDelivLite(r, at); } } catch (e) { log('발송 요청 빠른 읽기 실패: ' + e.message, 1); }
    if (out.confirm != null || out.deliv != null) log(`출고 목록 바로 반영: 주문확인요청 ${out.confirm ?? '?'}건 · 발송 요청 ${out.deliv ?? '?'}건`); return out; }
  async function shipReadJob() {
    const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (!SH) { log('출고 기준 파일(readnow-shipping-core.js)을 못 불러옴', 1); return false; }
    try { await C('shp_state').doc('_check').set({ check: true, at: nowIso(), ...W() }, { merge: true }); } catch (e) { log(`발송 요청 읽기: 저장 권한 없음(shp_state) — Firestore 규칙에 허용 필요 (${e.code || e.message})`, 1); return false; }
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); return false; }
    try {
      ui('발송 요청 읽기', 0, 1, '판매관리 → 발송 요청');
      const g = await getDoc('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4'); const r = SH.parseDeliveryPage(g.doc); const at = nowIso();
      const want = r.tabCounts['발송 요청']; if (want != null && want > r.orders.length) log(`발송 요청 ${want}건인데 이 쪽에서 ${r.orders.length}건만 읽힘 — 여러 쪽으로 나뉜 경우 (그때 화면을 저장해 보내 주시면 다음 쪽 읽기를 넣겠습니다)`, 1);
      const items = r.orders.flatMap((o) => o.items).filter((i) => i.listingId); let nInfo = 0;
      for (let k = 0; k < items.length; k++) { const it = items[k]; if (stopFlag) throw new Error('멈춤');
        const ref = C('prd_used_info').doc(String(it.listingId)); const prev = (await ref.get()).data();
        const midNo = it.grade === '중' && !(prev && prev.note); // (1.34.5) '중' 상품인데 유의 사항이 없으면 잘못 읽은 것 → 하루 기다리지 않고 다시 읽음
        if (!midNo && prev && prev.checkedAt && Date.now() - Date.parse(prev.checkedAt) < 864e5) continue;
        try { const r1 = await readOurUsed(it.listingId, it.grade, prev, at); if (r1.wrote) nInfo++; } catch (e) { if (e.message === '멈춤') throw e; }
        ui('발송 요청 읽기', k + 1, items.length, `우리 매물 유의 사항·사진: ${it.title}`); }
      const sig = JSON.stringify(r.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId), o.deliveryNo])); const cur = (await C('shp_state').doc('current').get()).data();
      const excel = await fetchShipExcel(SH).catch((e) => { log('발송 요청 엑셀 받기 실패: ' + e.message, 1); return null; }); // ALPS 업로드 파일 재료 (알라딘 엑셀 29칸 그대로)
      // ① 주문확인요청(worder_preparatory_complete.aspx) — 웹앱에서 상품마다 시장 지표를 보고 '발송준비시작'을 누르도록 (같은 줄 구조라 같은 읽기 함수)
      try { const gc = await getDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); const rc = SH.parseDeliveryPage(gc.doc); const cc = (await C('shp_state').doc('confirm').get()).data();
        const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)]));
        if (!cc || cc.sig !== csig) { const bc = db.batch(); bc.set(C('shp_state').doc('confirm'), { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: PC_NAME, enrich: (cc && cc.enrich) || {}, ...W() }); // 클라우드가 채운 상품 보강(enrich)은 그대로 둠
          for (const o of rc.orders) bc.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }, { merge: true });
          await bc.commit(); } else await C('shp_state').doc('confirm').set({ at, ...W() }, { merge: true });
        log(`주문확인요청 읽기: ${rc.orders.length}건`);
        try { const ms = await marketSnapPC(rc.orders); if (ms.n) log(`주문 들어온 책의 지금 시장: ${ms.n}권 읽음${ms.fail ? ` · 실패 ${ms.fail}` : ''}${ms.left ? ` · 남은 ${ms.left}권은 다음에` : ''}`); } catch (e) { log('주문 시장 읽기 실패: ' + e.message, 1); }
      } catch (e) { log('주문확인요청 읽기 실패: ' + e.message, 1); }
      const b = db.batch(); b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, orders: r.orders, sig, pc: PC_NAME, excel: excel ? { at, header: excel.header, rows: excel.rows.map((v) => ({ v })) } : (cur && cur.excel) || null, ...W() });
      if (!cur || cur.sig !== sig) b.set(C('shp_snapshots').doc(at.replace(/[:.]/g, '-')), { at, tabCounts: r.tabCounts, orders: r.orders, ...W() }); // 목록이 바뀔 때마다 그 판을 보관
      if (excel) { const xrows = excel.rows.map((v) => ({ v })); const prevX = cur && cur.excel; if (!prevX || JSON.stringify(prevX.rows || null) !== JSON.stringify(xrows)) b.set(C('shp_excel').doc(at.replace(/[:.]/g, '-')), { at, header: excel.header, rows: xrows, by: PC_NAME, ...W() }); } // (1.57.2) 발송 요청 엑셀도 바뀐 판마다 따로 보관
      for (const o of r.orders) b.set(C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, stage: '발송 요청', lastSeenAt: at, ...(cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo) ? {} : { firstSeenAt: at }), buyer: o.buyer, recipient: o.recipient, orderedAt: o.orderedAt, items: o.items, carrier: o.carrier, ...W() }, { merge: true });
      await b.commit(); window.__rnShipAt = Date.now();
      log(`발송 요청 읽기: 주문 ${r.orders.length}건 · 상품 ${items.length}권 · 주문확인요청 ${r.tabCounts['주문확인요청'] ?? '?'}건${nInfo ? ` · 우리 매물 유의 사항 새로/바뀜 ${nInfo}` : ''}${!cur || cur.sig !== sig ? ' (목록 바뀜 — 판 보관)' : ' (바뀐 것 없음)'}`);
    } finally { await releaseLane('aladin'); }
  }
  /* 주문 들어온 책의 지금 시장 (1.33.0, 클라우드 readnow-cloud 0.3.0과 같은 기록 shp_market/{주문번호}__{매물번호})
     주문확인요청에 새로 들어온 주문의 상품마다 온라인 중고 첫 페이지 1번만 읽어 '주문 시점 시장'으로 따로 남김 — 이미 있으면 다시 읽지 않음(서버 기준)
     기존 시장 지표(prd_book_metrics)는 건드리지 않고, 문서는 없을 때만 만듦(트랜잭션) · 한 번에 최대 15권 · 우리 기록에 책 번호가 없으면 제목 검색(이름 90% 이상, 새상품) */
  const mktSkip = new Map();
  async function marketSnapPC(orders) { const byLid = new Map(); // (1.34.0) 주문 책 몇 권 때문에 상품 기록 전체(수만 건)를 읽던 것 → 그 책들만 찾아 읽음
    const todo = []; for (const o of orders || []) for (const it of o.items || []) if (it.listingId) todo.push({ o, it, id: `${o.orderNo}__${it.listingId}` }); let n = 0, fail = 0;
    if (LISTINGS && LISTINGS.size) { for (const [k, l] of LISTINGS) if (l.listingId) byLid.set(String(l.listingId), [k, l]); }
    else { const ids = [...new Set(todo.map((t) => String(t.it.listingId)))]; for (let i = 0; i < ids.length; i += 15) { const part = ids.slice(i, i + 15); const vals = [...part, ...part.map(Number).filter((x) => x === x)];
      try { (await C('prd_listings').where('listingId', 'in', vals).get()).forEach((d) => { const l = d.data(); byLid.set(String(l.listingId), [d.id, l]); }); } catch (e) {} } }
    for (const t of todo) { if (n >= 15) break; if ((mktSkip.get(t.id) || 0) > Date.now()) continue; const ref = C('shp_market').doc(t.id); if ((await ref.get()).exists) continue;
      try { n++; const hit = byLid.get(String(t.it.listingId)); let itemId = null, via = 'ours'; const bookId = hit ? hit[1].bookId || null : null;
        if (bookId) { const b = (await C('prd_books').doc(bookId).get()).data(); itemId = b && b.aladinItemId ? String(b.aladinItemId) : null; }
        if (!itemId && P.resolveItemId) { /* (1.89.9) 정범님 10/20 빌리 배스게이트 — 이름 검색 첫 후보가 다른 판이었음 → ISBN으로 확인(products-core 0.18.0 · 클라우드와 같은 계산) */ const R = await P.resolveItemId({ isbn: hit ? hit[1].isbn13 : null, title: t.it.title, get: async (u) => { const g = await getDoc('https://www.aladin.co.kr' + u); return { doc: g.doc, url: g.finalUrl || null }; } }); if (R && R.itemId) { itemId = String(R.itemId); via = R.how === 'isbn' ? 'isbn' : 'title1'; } }
        if (!itemId) { mktSkip.set(t.id, Date.now() + 3600e3); continue; }
        const u = P.parseUsedPage((await pubUsed(`/shop/UsedShop/wuseditemall.aspx?ItemId=${itemId}&TabType=0`)).doc);
        const doc = { orderNo: t.o.orderNo, listingId: String(t.it.listingId), listingKey: hit ? hit[0] : null, bookId, aladinItemId: itemId, via, title: t.it.title || null, orderedAt: t.o.orderedAt || null, at: nowIso(), page1: u.listings || [], usedTotal: u.usedTotal ?? null, mins: u.mins || null, buyback: u.buyback || null, lastPage: u.lastPage || 1, by: PC_NAME, ...W() };
        await db.runTransaction(async (tx) => { const sn = await tx.get(ref); if (!sn.exists) tx.set(ref, doc); }); } catch (e) { if (e.message === '멈춤') throw e; fail++; } }
    return { n, fail, left: Math.max(0, todo.length - n) }; }
  // 알라딘 발송 요청 엑셀(판매관리의 '엑셀 다운로드'와 같은 요청) — 알라딘이 주는 .xls는 HTML 표라 그대로 읽음
  async function fetchShipExcel(SH) { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' });
    const rr = await fetch('https://www.aladin.co.kr/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); if (!rr.ok) throw new Error('HTTP ' + rr.status);
    const ex = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html')); if (!ex) throw new Error('엑셀 표를 못 찾음'); return ex; }
  // 송장 입력 맡기기 (1.28.0): 웹앱(또는 발송 요청 화면)에서 맡긴 송장 입력(shp_invoices · status 'queued')을 이 PC가 맡아 발송 요청 화면을 새 탭으로 열어 처리 — 여러 PC·탭이 있어도 한 곳만 맡음(트랜잭션)
  // 웹앱이 맡긴 일 (1.29.0, shp_cmds · status 'queued'): read = 발송 요청·주문확인요청 지금 다시 읽기 / startDelivery = 주문마다 알라딘 '발송준비시작'(worder_process.aspx?cmd=StartDelivery — 주문확인요청 화면의 그 단추와 같은 요청) → 주문확인요청에서 빠졌는지 확인 → 다시 읽기
  // 그룹 시장 지표 갱신 (1.30.0): 웹앱 수동 일괄 처리 그룹·감시 묶음의 '이 그룹 시장 지표 갱신'(shp_cmds type 'metrics', keys = 상품 키) — 이 PC가 맡은 것을 차례로, 진행은 그 일 문서에 저장해 끊겨도 이어 함
  async function metricsReqJob() { await loadListings(); const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); return false; }
    try { const qs = await C('shp_cmds').where('status', '==', 'running').get(); const mine = qs.docs.filter((d) => { const v = d.data(); return v.type === 'metrics' && v.claim && v.claim.pc === PC_NAME; });
      for (const d of mine) { const v = d.data(); const keys = v.keys || []; let i = v.i || 0, ok = v.ok || 0, fail = v.fail || 0; const seenBook = new Set();
        for (; i < keys.length; i++) { if (stopFlag) { await d.ref.set({ i, ok, fail, uploadedAt: TS() }, { merge: true }); throw new Error('멈춤'); }
          const l = LISTINGS.get(keys[i]); if (!l) { fail++; continue; } if (l.bookId && seenBook.has(l.bookId)) continue; if (l.bookId) seenBook.add(l.bookId);
          try { await refreshOne(l, l.bookId || null); ok++; } catch (e) { fail++; log(`시장 지표 실패 ${l.title || l.usedCode}: ${e.message}`, 1); } await mixMaybe(); /* (1.69.0) 🔀 로거: 사이사이 다른 책 (설정 비율) */
          ui(`그룹 시장 지표: ${v.label || ''}`, i + 1, keys.length, l.title || l.usedCode, `실패 ${fail}`); if (i % 5 === 4) await d.ref.set({ i: i + 1, ok, fail, uploadedAt: TS() }, { merge: true }); }
        await d.ref.set({ status: 'done', i, ok, fail, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
        if (v.batchId) await C('prd_price_batches').doc(v.batchId).set({ lastMetricsAt: nowIso(), lastMetricsN: ok, ...W() }, { merge: true }).catch(() => {});
        log(`그룹 시장 지표 갱신 끝: ${v.label || ''} 성공 ${ok} · 실패 ${fail}`); }
    } finally { await releaseLane('aladin'); } }
  // 5분마다: 맡아 둔 그룹 시장 지표가 남았으면 이어서 · 한 시간마다: '매일 자동'을 켠 그룹(수동 일괄 처리 그룹·감시 묶음)이 24시간 지났으면 스스로 맡김
  setInterval(async () => { try { if (running || window.__rnPaused || !auth.currentUser || (window.__rnRest && window.__rnRest())) return; const qs = await C('shp_cmds').where('status', '==', 'running').get();
    if (qs.docs.some((d) => { const v = d.data(); return v.type === 'metrics' && v.claim && v.claim.pc === PC_NAME; })) { if (SCHED && SCHED.on) MET_PEND = MET_PEND || Date.now(); else runJob('metricsReq'); } } catch (e) {} }, 5 * 60000); /* (1.74.0) ⏰를 켰으면 차례 6으로 */
  /* (1.60.1) 그룹 시장 지표 맡기기 — 예전엔 한 시간마다 스스로 돌던 것 → ⏰ 매일 자동 수집의 칸(기본: 1시간마다)에서만 · 일(JOBS.metricsAuto) */
  async function metricsAutoJob() { let nQ = 0; const day = 864e5; const PRC = window.ReadnowPricing || globalThis.ReadnowPricing;
    const pc0 = (await C('prd_system').doc('pricing').get()).data() || {}; const off = pc0.batchOff || {}; // (1.34.9) 웹앱에서 끈 그룹(감시·적용 꺼짐)·보관한 그룹은 매일 자동 시장 지표를 맡기지 않음
    const bs = await C('prd_price_batches').get(); for (const d of bs.docs) { const b = d.data(); if (!b.autoMetrics || b.archived || off[d.id] || !b.lastKeys || !b.lastKeys.length) continue; if (b.lastMetricsReqAt && Date.now() - Date.parse(b.lastMetricsReqAt) < day) continue;
      await d.ref.set({ lastMetricsReqAt: nowIso() }, { merge: true }); await C('shp_cmds').add({ type: 'metrics', keys: b.lastKeys, label: '그룹: ' + (b.name || d.id), batchId: d.id, status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (매일 자동)', uploadedAt: TS() }); nQ++; }
    const pc = (await C('prd_system').doc('pricing').get()).data() || {}; const gm = pc.groupMetrics || {}; if (Object.values(gm).some((x) => x && x.auto)) await loadListings();
    for (const g of ['treat', 'control']) { const x = gm[g] || {}; if (!x.auto || (x.reqAt && Date.now() - Date.parse(x.reqAt) < day) || !PRC) continue; const keys = [...LISTINGS.entries()].filter(([, l]) => l.active && PRC.groupOfListing(l, pc) === g).map(([k]) => k);
      await C('prd_system').doc('pricing').set({ groupMetrics: { [g]: { reqAt: nowIso() } } }, { merge: true }); /* (1.59.0) 바꾸는 칸만 · 일은 2,000개씩 나눠 맡김(한 문서가 1MB 가까이 커져 듣는 모든 곳이 매번 받던 것) */ const per = 2000, parts = Math.max(1, Math.ceil(keys.length / per)); for (let i = 0; i < parts; i++) await C('shp_cmds').add({ type: 'metrics', keys: keys.slice(i * per, (i + 1) * per), label: (g === 'treat' ? '감시·적용 묶음' : '감시·비교 묶음') + (parts > 1 ? ` (${i + 1}/${parts})` : ''), status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (매일 자동)', uploadedAt: TS() }); nQ++; }
    log(nQ ? `그룹 시장 지표: 24시간 지난 '매일 자동' 그룹 ${nQ}건을 시장 지표 일로 맡김` : '그룹 시장 지표: 맡길 그룹 없음 (매일 자동을 켠 그룹이 모두 24시간 안에 받음)'); return true; }
  let cmdUnsub = null; auth.onAuthStateChanged((u) => { if (cmdUnsub) { cmdUnsub(); cmdUnsub = null; } if (!u) return; // (1.34.0) 새로 들어온 일만 · PC 몫이 아닌 일은 트랜잭션 없이 바로 넘김 · 다시 로그인해도 듣기는 하나만
    if (!regUnsub) regUnsub = C('app_settings').doc('sys_registry').onSnapshot((d) => { REGDOC = d.exists ? d.data() : {}; }, () => {}); // (1.36.0) 노선표 (Firebase 기준 — 웹앱에서 멈춘 종류·맡는 곳이 바로 반영)
    let back = 5000; const sub = () => { if (!auth.currentUser) return; cmdUnsub = C('shp_cmds').where('status', '==', 'queued').onSnapshot((ss) => { back = 5000; ss.docChanges().forEach((c) => { if (c.type === 'removed') return; const x = c.doc.data() || {}; if (!pcCan(x.type)) return; const id = c.doc.id; if (PUBONLY && (x.type === 'metrics' || x.type === 'lookup')) { const h = [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); const at0 = Date.parse(x.createdAt || '') || Date.now(); const wait = Math.max(0, at0 + 60e3 + (h % 540e3) - Date.now()); if (wait > 0) { setTimeout(() => runCmd(id).catch(() => {}), wait); return; } } /* (1.69.0) ⏳ 로거는 맡긴 시장·사진 가격 읽기를 1~10분 사이 무작위로 늦춰 받음 — 사무실(로그인)에서 본 책을 몇 초 만에 익명 IP가 여는 시간 맞춤을 끊음 */ if (pubPcMode() && (x.type === 'extLookup' || x.type === 'extTest')) { setTimeout(() => runCmd(id).catch(() => {}), 15000); return; } /* (1.67.0) 외부 정보 요청은 로거가 먼저(15초) — 로거가 안 받으면 이 PC가 */ { const dl = PUBONLY ? 0 : claimDelay(x); if (dl > 0) { setTimeout(() => runCmd(id).catch(() => {}), dl); return; } } runCmd(id).catch((e) => { log('맡긴 일 실패: ' + (e.code || e.message) + ' — 8초 뒤 한 번 더', 1); setTimeout(() => runCmd(id).catch(() => {}), 8000); }); }); },
      (e) => { log(`맡긴 일 듣기가 끊김(${e.code || e.message}) — ${Math.round(back / 1000)}초 뒤 다시 들음`, 1); cmdUnsub = null; setTimeout(() => { if (!cmdUnsub) sub(); }, back); back = Math.min(back * 2, 5 * 60000); }); }; sub(); }); /* (1.59.0) 듣기 오류는 끝이라(Firestore) 다시 붙음 — 예전엔 한 번 끊기면 다시 로그인할 때까지 웹앱이 맡긴 일을 받지 않았음 */
  /* (1.36.0) 관리도구 노선표: PC가 맡는 일 = 노선표(readnow-registry.js 기본값 + Firebase app_settings/sys_registry)에서 'PC가 맡을 수 있음'이고 멈춤이 아닌 종류만.
     예전 목록(CMD_NOT_PC)과 달리 모르는 종류는 맡지 않음 — 예전엔 모르는 종류를 '끝남'으로 적어 일이 사라질 수 있었음. 노선표 파일을 못 읽었을 때만 예전 목록으로 */
  let REGDOC = null, regUnsub = null; const REGF = () => window.ReadnowRegistry || globalThis.ReadnowRegistry || null;
  const PC_KNOWN_OLD = new Set(['read', 'startDelivery', 'usedInfo', 'c2bAdd', 'lookup', 'metrics', 'cashStop', 'extLookup', 'extTest']);
  const PUB_CMDS = new Set(['lookup', 'metrics', 'extLookup', 'extTest']); /* (1.69.0) usedInfo(우리 매물 페이지 다시 읽기)는 뺌 — 새로 올린 우리 매물을 익명 IP가 곧바로 여는 것은 로거를 드러냄 → 로그인한 사무실 PC·클라우드가 함 */ /* (1.64.0) 공개 전용 PC가 맡는 맡긴 일(로그인 없이 되는 것만) */
  const pcCan = (type) => { const extT = type === 'extLookup' || type === 'extTest'; if (PUBONLY && (!PUB_CMDS.has(type) || (!TGATE.ok && !extT))) return false; /* (1.67.0) 외부 정보는 와이파이 — 테더링과 상관없이 로거가 받음 */ if (PUBONLY && !extT && BUD && !(BUD.left.main > 0) && !(BUD.free)) return false; /* 맡긴 비로그인 일 = 주요 몫 — 몫이 없으면 받지 않음 */ /* (1.66.0) 테더링 확인 전에는 맡지 않음(다른 PC가 받게) */ if (pubPcMode() && type === 'metrics') return false; /* 묶음 시장 지표(대량)는 공개 전용 PC */ const G = REGF(); if (!G) return PC_KNOWN_OLD.has(type); return G.canHandle(G.merge(REGDOC || {}), type, 'pc'); };
  /* (1.63.7) 🧩 맡긴 일 거르기 — 수집 일은 📥 수집이 켜졌을 때만, 출고 시작·현금 판매·등록은 그 기능을 켰을 때만(끄면 대기로 남겨 다른 PC가) */
  /* (1.77.5) PC끼리 누가 받나(정범님 10/17): ① 요청한 기기가 이 PC(웹앱이 dev에 기기 이름) → 바로 ② 쉬는 PC 0.7초 ③ 자동 수집이 아닌 일(사람이 누른 일) 하는 PC 1.6초 ④ 자동 수집 중인 PC 2.6초 + 남은 시간이 길수록 더 늦게(최대 +6초) — 먼저 받는 PC가 맡고(대기 → 처리 중은 한 번만) 나머지는 그냥 지나감 */
  const claimDelay = (x) => { try { if (x && x.dev && String(x.dev).trim().toUpperCase() === String(PC_NAME || '').trim().toUpperCase()) return 0; if (x && x.dev) { /* (1.89.29) 정범님 10/22 '자기 기기가 자기 업무를 최우선' — 등록만이 아니라 웹앱이 맡긴 모든 일: 누른 기기 이름과 같은 PC가 살아 있으면 그 PC가 먼저(다른 PC는 15초 기다림) */ const B = ((BEATS || {}).pcs || {})[String(x.dev).trim().toUpperCase()] || ((BEATS || {}).pcs || {})[String(x.dev).trim()]; if (B && Date.now() - (+B.atMs || 0) < 3 * 60e3 && !B.paused) return 15000; } /* (1.89.15) 정범님 10/21: 등록은 웹앱을 누른 PC의 수집기가 먼저(살아 있으면 다른 PC는 15초 기다림 — 그 PC가 안 받으면 그때 다른 PC) */ const busy = !!running || !!(window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()); if (!busy) return 700; if (!window.__rnAuto) return 1600; const m = lastUi && lastUi.etaMin != null ? +lastUi.etaMin : 60; return 2600 + Math.min(6000, Math.max(0, m) * 100); } catch (e) { return 1000; } };
  /* (1.83.0) ☁ 클라우드 이상 띠가 매일 뜨던 까닭(진단 10/18): ① '유의 사항 다시 읽기'(usedInfo)는 클라우드가 느린 일로 회차 끝에만 처리하는데 PC는 20초만 기다려 거의 늘 '클라우드 이상'으로 적음(오늘 6번 모두 이것) ② 클라우드가 살아 있어도 다른 단계(조회·보강)를 하는 중이면 20초를 넘김
   *  → usedInfo는 클라우드 먼저에서 뺌(PC가 바로) · 발송준비시작·현금 판매 중지는 클라우드 신호(app_settings/cloud.at)가 2분 안에 있으면 45초까지 기다리고, 그래도 늦으면 PC가 처리하되 '느림'으로만 적음(띠 없음) · 신호가 끊긴 때만 '클라우드 이상' 띠 */
  const CLOUD_FIRST = new Set(['startDelivery', 'cashStop', 'prdEdit']); /* (1.89.26) 상품 정보 수정도 클라우드 먼저 */ let CLOUD_GRACE = 45000; let cloudSt = null, cloudStAt = 0;
  const cloudAlive = async () => { if (!cloudSt || Date.now() - cloudStAt > 20000) { cloudStAt = Date.now(); try { cloudSt = (await C('app_settings').doc('cloud').get()).data() || {}; } catch (e) { cloudSt = cloudSt || {}; } } const at = Date.parse(cloudSt.at || 0) || 0; return { alive: Date.now() - at < 150e3 && cloudSt.ok !== false, ageS: Math.round((Date.now() - at) / 1000), err: cloudSt.err || null }; }; /* (1.77.5) 출고 과정(발송준비시작·현금 판매 중지·유의 사항 다시 읽기)은 클라우드 먼저 */
  const cmdMine = (t) => { const f = (k) => !window.__rnFeat || window.__rnFeat(k); if (t === 'startDelivery') return f('ship'); if (t === 'cashStop') return f('cash'); if (/^reg/.test(String(t))) return f('reg'); return !window.__rnPaused; };
  /* (1.88.4) 정범님 10/20 'JS-MAIN: 웹앱이 맡긴 일을 받았다는 표시가 기록에 전혀 없음' — 맡은 순간과 끝난 순간을 기록 창에 한 줄씩(종류·이름·걸린 시간) */
  const CMD_KO = { startDelivery: '발송준비시작', usedInfo: '유의 사항 다시 읽기', c2bAdd: '알라딘 팔기 장바구니 담기', cashStop: '현금 판매 → 판매중지', prdEdit: '✏ 상품 정보 수정', lookup: '사진 가격 조회', regDel: '등록 상품 삭제', regLookup: '📥 등록 조회', extLookup: '🌐 외부 정보', extTest: '🌐 외부 정보 시험', metrics: '시장 지표 다시 읽기', regBulk: '📦 대량 등록', regBulkMock: '🧷 모의 대량 등록', regOne: '🤖 개별·미등록 등록', regOneMock: '🧷 모의 개별 등록' };
  async function runCmd(id) { await runCmd0(id); const c = window.__rnCmdCur; if (c && c.id === id) { window.__rnCmdCur = null; log(`✅ 웹앱이 맡긴 일 끝: ${CMD_KO[c.type] || c.type}${c.label ? ' · ' + c.label : ''} (${Math.round((Date.now() - c.t0) / 1000)}초)`); } }
  async function runCmd0(id) { const ref = C('shp_cmds').doc(id); let v = null; if ((window.__rnRest && window.__rnRest())) return; // (1.56.0) 맡긴 일은 이 PC의 수집기 탭만
    { const x0 = (await ref.get()).data(); if (x0 && x0.status === 'queued' && CLOUD_FIRST.has(x0.type) && !x0.cloudTried) { const age = Date.now() - (Date.parse(x0.createdAt || 0) || Date.now()); const ca = await cloudAlive(); CLOUD_GRACE = ca.alive ? 45000 : 3000; if (age < CLOUD_GRACE) { setTimeout(() => runCmd(id).catch(() => {}), CLOUD_GRACE - age + 300 + claimDelay(x0)); return; } } } /* (1.77.5) 출고·돈 일은 클라우드 먼저 — 20초 안에 클라우드가 안 받으면 이 PC가 받음(아래 pcFallback 표시 → 웹앱 '클라우드 이상' 알림) */
    await db.runTransaction(async (tx) => { v = null; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const sn = await tx.get(ref); const x = sn.data(); if (!x || x.status !== 'queued' || !pcCan(x.type) || !cmdMine(x.type) || String(x.pcSkip || '').includes(` ${APP_VER}에`)) return; /* 노선표에서 PC 몫인 종류만 (1.36.0) */ tx.update(ref, { status: 'running', claim: { pc: PC_NAME, tab: TAB_ID, at: nowIso() }, ...(CLOUD_FIRST.has(x.type) && !x.cloudTried ? { pcFallback: { at: nowIso(), pc: PC_NAME, why: `클라우드가 ${Math.round(CLOUD_GRACE / 1000)}초 안에 받지 않음` } } : {}), uploadedAt: TS() }); v = x; });
    if (!v) return;
    window.__rnCmdCur = { id, type: v.type, label: String(v.label || '').slice(0, 60), t0: Date.now() }; log(`📨 웹앱이 맡긴 일 받음: ${CMD_KO[v.type] || v.type}${v.label ? ' · ' + String(v.label).slice(0, 60) : ''}${v.by ? ' · ' + String(v.by).split('@')[0] : ''} — 이 PC(${PC_NAME})가 처리 시작`);
    if (CLOUD_FIRST.has(v.type) && !v.cloudTried) { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const ca = await cloudAlive(); const docN = ca.alive ? 'cloud_slow' : 'cloud_fb'; /* (1.83.0) 신호가 살아 있는데 늦은 것은 '느림' 기록만(띠 없음) · 신호가 끊긴 때만 클라우드 이상 */
      const why = ca.alive ? `클라우드가 살아 있지만 ${Math.round(CLOUD_GRACE / 1000)}초 안에 받지 않음(다른 단계를 하는 중) — PC가 처리` : `클라우드 신호가 ${ca.ageS}초째 없음${ca.err ? ' · ' + String(ca.err).slice(0, 80) : ''}`;
      C('app_settings').doc(docN).get().then((d) => { const o = d.exists ? d.data() : {}; return C('app_settings').doc(docN).set({ at: nowIso(), type: v.type, pc: PC_NAME, why, cmd: id, day, n: o.day === day ? (o.n || 0) + 1 : 1 }, { merge: true }); }).catch(() => {}); C('prd_jobs').doc('cloudfb_' + day).set({ day, ev: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), type: v.type, pc: PC_NAME, why, cmd: id, alive: ca.alive, ageS: ca.ageS }), ...W() }, { merge: true }).catch(() => {}); /* 날짜별로 빠짐없이 쌓음(지우지 않음) */ log(`☁ ${why} → 이 PC가 '${v.type}' 처리${ca.alive ? '' : ' — 웹앱에 클라우드 이상 띠'}`, 1); }
    if (v.type === 'startDelivery') { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; const results = {};
      for (const ono of v.orderNos || []) { const gate = await exBegin('startDelivery', `${id}:${ono}`, { ono }); if (!gate.ok) { results[ono] = { state: gate.state === 'done' ? 'done' : 'unknown', at: nowIso(), msg: '실행 문: ' + gate.why, gate: gate.state }; continue; } results[ono] = { state: 'sent', at: nowIso() };
        try { const rr = await fetch(`https://www.aladin.co.kr/scm/worder_process.aspx?cmd=StartDelivery&ono=${encodeURIComponent(ono)}`, { credentials: 'include' }); const tx2 = await rr.text(); const al = (tx2.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null;
          results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: al }; } catch (e) { results[ono] = { state: 'fail', at: nowIso(), msg: e.message }; }
        await ref.set({ results, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); await sleep(800); } // (1.34.7) 한 건마다 결과·살아 있음 신호
      // (1.34.0) 주문확인요청 화면을 제대로 읽었을 때만 '끝남' — 로그인 화면·읽기 실패로 빈 목록이면 '확인 못함'(웹앱에서 다시 확인)
      let gcDoc = null; try { const gc = await getDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); gcDoc = gc.doc; const x = SH.parseDeliveryPage(gc.doc); const okP = !!(x && x.tabCounts && Object.keys(x.tabCounts).length); const left = new Set((x.orders || []).map((o) => o.orderNo));
        const full = okP && x.tabCounts['주문확인요청'] != null && left.size >= x.tabCounts['주문확인요청']; let deliv = null; if (okP && !full) { try { const g2 = await getDoc('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4'); deliv = new Set((SH.parseDeliveryPage(g2.doc).orders || []).map((o) => o.orderNo)); } catch (e) {} } /* (1.63.8 점검) '끝남'은 확실할 때만 — 주문확인요청 목록을 다 봤거나 발송 요청 목록에 실제로 보일 때(클라우드와 같은 기준) */
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = !okP ? 'unknown' : left.has(ono) ? 'fail' : full || (deliv && deliv.has(ono)) ? 'done' : 'unknown'; if (!okP) gcDoc = null; } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
      for (const [ono, r] of Object.entries(results)) if (!r.gate) await exEnd('startDelivery', `${id}:${ono}`, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', r.msg || null, { http: r.http || null });
      const nd = Object.values(results).filter((r) => r.state === 'done').length; await ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
      try { await shipLiteRead(SH, gcDoc); } catch (e) {} // (1.34.6) 넘긴 결과를 바로 목록에 — 웹앱에서 주문확인요청에서 빠지고 발송 요청에 들어감
      { const all = Object.values(results); const nO = all.filter((r) => r.gate && r.state !== 'done').length; const bad = all.length - nd - nO; /* (1.72.2) 같은 주문을 클라우드·다른 PC가 이미 맡아 하는 중(실행 문이 막음)이면 실패가 아님 — 예전엔 '! 0 / 1건'으로 적혀 실패처럼 보였음(10/15 JS-MAIN·MJ-MAIN) */
        log(`발송준비시작: ${nd} / ${all.length}건${nO ? ` · 다른 곳(클라우드·다른 PC)이 이미 맡아 함 ${nO}건` : ''}${bad ? ` · 확인 못 함·실패 ${bad}건(웹앱 출고 화면에서 상태 확인)` : ''} (웹앱에서 맡김)`, bad ? 1 : 0); } }
    else if (v.type === 'usedInfo') { const results = {}; // (1.34.5) 웹앱·클라우드가 맡긴 '중' 상품 유의 사항 다시 읽기 — 바로 처리(한두 건이라 짧음)
      for (const lid of v.listingIds || []) { try { const prev = (await C('prd_used_info').doc(String(lid)).get()).data(); const r = await readOurUsed(lid, v.grade || null, prev);
          results[lid] = r.miss ? { ok: false, why: r.miss, at: nowIso() } : { ok: true, note: !!r.note, at: nowIso() }; } catch (e) { results[lid] = { ok: false, why: e.message, at: nowIso() }; } }
      await ref.set({ status: 'done', results, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`유의 사항 다시 읽기: ${Object.values(results).filter((r) => r.ok).length} / ${Object.keys(results).length}건`); return; }
    else if (v.type === 'c2bAdd') { await c2bAddCmd(ref, v); return; }
    else if (v.type === 'prdEdit') { if (typeof window.__rnPrdEdit !== 'function') { await ref.set({ status: 'queued', claim: null, pcSkip: `PC 수집기 ${APP_VER}에 상품 수정 길이 아직 안 열림(상품 조회·등록 화면이 열린 탭만)`, uploadedAt: TS() }, { merge: true }); return; } await window.__rnPrdEdit(ref, v, id); return; } /* (1.89.26) ✏ 상품 정보 수정 — 클라우드가 못 받을 때 */
    else if (v.type === 'cashStop') { await cashStopCmd(ref, v); return; } // (1.37.0) 현금 판매 → 알라딘 판매중지 자동 // (1.35.0) 알라딘 매입: 팔기 장바구니에 담기
    else if (v.type === 'lookup') { LOOK_PRIO++; try { await lookupCmd(ref, v); } finally { LOOK_PRIO--; } return; } /* (1.78.2) 사진 가격 조회도 사람이 기다림 — 알라딘 차례 먼저 */
    else if (v.type === 'regDel') { await regDelCmd(ref, v); return; } /* (1.81.0) 🗑 웹앱에서 지운 등록 상품 → 알라딘 삭제 */
    else if (v.type === 'regLookup') { await regLookupCmd(ref, v); return; } /* (1.77.0) 📥 등록 조회 = 샵매니저 등록 검색(로그인 PC만 — 로거는 pcCan에서 거름) */
    else if (v.type === 'extLookup' || v.type === 'extTest') { await extCmd(ref, v); return; } // (1.57.0) 🌐 외부 정보 — 알라딘과 상관없음
    else if (v.type === 'regBulk' || v.type === 'regBulkMock') { await regBulkCmd(ref, v.type === 'regBulkMock' ? { ...v, mock: true } : v); return; } /* (1.50.0) 🧷 모의 등록은 종류를 따로(regBulkMock·regOneMock) — 예전 판 수집기는 모르는 종류라 받지 않음(실수로 올리지 않게) */
    else if ((v.type === 'regOne' || v.type === 'regOneMock') && v.auto) { if (v.type === 'regOneMock') v = { ...v, mock: true }; if (!window.__rnRegAuto) { await ref.set({ status: 'queued', claim: null, pcSkip: `수집기 ${APP_VER}에 자동 등록 모듈이 없음`, uploadedAt: TS() }, { merge: true }); return; } log(`🤖 자동 등록 맡음: ${v.title || v.itemId}`); try { await window.__rnRegAuto(regTrailRef(ref, v, true), v, id); } catch (e) { log('자동 등록 오류: ' + e.message, 1); } return; } // (1.47.0) 창 없이 개별·미등록 등록 // (1.44.0) 📥 알라딘 대량 등록
    else if (v.type === 'regAux') { const RG = RGF(); let out; try { if (!RG || !RG.auxRun) throw new Error('등록 엔진 공용 파일 0.3.0이 아님 — 수집기 새로고침'); const val = await RG.auxRun(v.op, v.a || {}); out = { v: val }; await C('reg_aux').doc(RG.auxKey(v.op, v.a || {})).set({ op: v.op, a: v.a || {}, v: val, at: nowIso(), by: PC_NAME, ...W() }).catch(() => {}); } catch (e) { out = { err: e.message }; } await ref.set({ status: 'done', ...out, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); return; } // (1.45.0) 📥 분류·저자·출판사 찾기 (클라우드가 안 될 때)
    else if (v.type === 'metrics' && (v.keys || []).length && v.keys.length <= 3) { /* (1.57.1) 웹앱 상품 상세의 '시장 지표 다시 읽기'(책 1~3권) — 긴 작업 중이어도 기다리지 않고 바로(사진 가격 조회처럼 짧음 · 알라딘 읽기 속도 조절은 같이 씀) */
      let ok = 0, fail = 0; const why = []; try { await loadListings(); } catch (e) {} if (PUBONLY) await mixRead(1 + Math.floor(Math.random() * 2)); /* (1.69.0) 🔀 */
      for (const k of v.keys) { await mixMaybe(); let l = LISTINGS && LISTINGS.get(k); if (!l) { try { const d = await C('prd_listings').doc(k).get(); if (d.exists) l = d.data(); } catch (e) {} } if (!l) { fail++; why.push(`${k}: 상품 기록 없음`); continue; }
        try { await refreshOne(l, l.bookId || null); ok++; } catch (e) { fail++; why.push(`${l.title || k}: ${e.message}`); } await ref.set({ ok, fail, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); }
      await ref.set({ status: 'done', ok, fail, why: why.slice(0, 5), doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`시장 지표 바로 읽기(${v.label || ''}): 성공 ${ok} · 실패 ${fail}`, fail ? 1 : 0); return; }
    else if (v.type === 'metrics') { log(`그룹 시장 지표 갱신 맡음: ${v.label || ''} ${(v.keys || []).length}개`); if (SCHED && SCHED.on) { MET_PEND = MET_PEND || Date.now(); log('그룹 시장 지표 — ⏰ 차례 6(정한 시각·조건 칸 뒤)으로 곧 이어서'); } else if (!running) runJob('metricsReq'); else { MET_PEND = Date.now(); log('다른 작업 중 — 끝나면 바로 이어서'); } return; }
    else if (v.type === 'read') { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (SH) try { await shipLiteRead(SH, null); } catch (e) {} await ref.set({ status: 'done', doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); }
    else { await ref.set({ status: 'queued', claim: null, pcSkip: `수집기 ${APP_VER}에 처리 길이 없는 종류 — 노선표 확인`, uploadedAt: TS() }, { merge: true }); log(`맡긴 일 '${v.type}': 이 수집기 판에 처리하는 길이 없어 대기로 되돌림 (노선표 확인)`, 1); return; } // (1.36.0) 예전: 모르는 종류도 '끝남' // (1.34.6) '다시 읽기'는 목록부터 바로(몇 초), 전체 읽기(유의 사항·엑셀)는 이어서
    window.__rnShipAt = 0; if (!running && !schedBusy) runCtx('urgent', 'shipRead'); else { SHIP_PEND = Date.now(); log('발송 요청 다시 읽기 — 하던 자동 일을 지금 항목까지 저장하고 비키게 한 뒤 바로'); } }
  /* 사진으로 가격 매기기 (1.31.0, 웹앱 '사진 가격' 화면 · shp_cmds type 'lookup'):
     isbns = 바코드로 읽은 ISBN → 새상품 페이지(wproduct.aspx?ISBN=) → 알라딘 상품번호 → 온라인 중고 첫 페이지 / itemIds = 고른 후보 상품번호 / queries = 책등 제목 → 알라딘 검색 후보
     결과는 그 일 문서(items · cands)에 바로 쓰고, 책마다 prd_lookups에도 한 줄씩 쌓음(덮어쓰지 않음 — 같은 책을 다시 찍으면 웹앱이 24시간 안 기록을 먼저 씀). 다른 작업 중이어도 바로 처리(책 몇 권이라 짧음) */
  /* (1.40.0) 실행도구의 한 문 (readnow-exec-core.js): 알라딘을 바꾸는 일은 모두 exGate를 지나감 — 시작을 먼저 적고(같은 일이 이미 끝났거나 하는 중이면 안 함), 끝나면 결과를 적음 */
  const EXC = () => window.ReadnowExec || globalThis.ReadnowExec;
  const exBegin = async (kind, key, detail) => { const X = EXC(); if (!X) return { ok: true, none: true }; try { const r = await X.begin(db, { kind, key, by: PC_NAME, detail: detail || null }); window.__rnLedgerDown = null; return r; } catch (e) { window.__rnLedgerDown = { at: nowIso(), msg: e.code || e.message }; const perm = /permission/i.test(e.code || e.message); log(`⚠ 실행 기록을 못 적음(${kind}) — ${e.code || e.message}${perm ? ' (Firestore 규칙에 exec_log 허용 필요) · 일은 예전처럼 하고 기록만 빠짐' : ' · 잠깐 문제일 수 있어 이번엔 하지 않음(두 번 실행 막기) — 다시 맡기면 다시'}`, 1); return perm ? { ok: true, none: true } : { ok: false, state: 'ledger', why: '실행 기록을 못 적어 이번엔 하지 않음(두 번 실행 막기): ' + (e.code || e.message) }; } }; // 규칙이 없을 때(권한)만 기록 없이 함 · (1.59.0) 잠깐 문제(연결·충돌)면 하지 않음 — 기록 없이 하면 다시 맡겼을 때 두 번 실행될 수 있음
  const exEnd = (kind, key, status, msg, result) => { const X = EXC(); if (!X) return Promise.resolve(); return X.finish(db, { kind, key }, status, { msg, result }).catch((e) => log(`실행 결과를 못 적음(${kind}): ${e.code || e.message}`, 1)); };
  let LOOK_PRIO = 0; /* (1.78.2) 사람이 기다리는 조회(등록 조회·사진 가격)가 도는 동안 알라딘 요청 차례를 먼저 받음(속도 간격은 그대로) */ const PACE_P = { ...PACE, wait: (s0, m) => PACE.wait(s0, m || 1, true) };
  const lookDoc = async (url) => { try { return await lookDoc0(url); } catch (e) { if (PUBONLY || !e.needLogin) throw e; /* (1.81.0) 🔞 19금: 로그인 PC는 쿠키를 붙여 다시 읽음 — 예전엔 공개 화면을 쿠키 없이 읽다 성인 인증 화면에서 그대로 실패해 등록 조회가 안 됐음(10/18 9788926326701) */ const q = await AL.quick(url, { pace: LOOK_PRIO > 0 ? PACE_P : PACE, sleep }); netAdd((q && q.html || '').length); return q; } };
  const lookDoc0 = async (url) => { tgateCheck(); const PC0 = LOOK_PRIO > 0 ? PACE_P : PACE; if (PUBONLY && !isPubUrl(url)) throw new Error('🛡 로거: 공개 화면이 아닌 알라딘 주소는 읽지 않음 — ' + String(url).slice(0, 80)); if (!((PUBONLY || pubAnonOn()) && isPubUrl(url))) { const q = await AL.quick(url, { pace: PC0, sleep }); netAdd((q && q.html || '').length); return q; } /* (1.64.0) 공개 화면은 쿠키 없이 */ await PC0.wait(sleep); const u = new URL(url, 'https://www.aladin.co.kr').href; const r = await fetch(u, { credentials: 'omit' }); if (!r.ok) { PACE.fail(PACE.kindOf ? PACE.kindOf(r.status) : 'error'); throw Object.assign(new Error('서버 응답 ' + r.status), { status: r.status }); }
    const html = AL.decode(await r.arrayBuffer(), r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html'); if (AL.isMaintenance(doc)) throw new Error('알라딘 점검 중'); if (AL.looksLoggedOut(r.url, doc)) throw Object.assign(new Error('로그인 없이는 못 보는 화면(19금 등)'), { needLogin: true }); if (!/알라딘/.test(doc.title || '') && !doc.querySelector('link[rel="canonical"]')) { if (/wlogin\.aspx|login\.aspx|성인\s*인증|19세\s*(미만|이상)|청소년\s*(유해|이용불가)|adult/i.test(r.url + ' ' + html.slice(0, 20000))) throw Object.assign(new Error('로그인 없이는 못 보는 화면(19금 등)'), { needLogin: true }); throw new Error('로그인 없이 읽은 화면이 알라딘 화면 같지 않음 — 빈 결과로 쓰지 않음'); } PACE.ok(); netAdd(html.length); if (PUBONLY) mixHarvest(doc); return { doc, html, finalUrl: r.url }; }; // 일시정지·작업 줄과 상관없이 짧게 (책 몇 권) — (1.39.0) 알라딘 창구: 속도 조절을 같이 쓰고 점검 화면은 오류로
  /* (1.42.0) 출고 실시간 (PC): 알라딘 화면이 열린 PC가 15초마다 ① 주문확인요청을 한 번 읽어 바뀐 때만 씀 — 클라우드 사용료 없이 실시간
   *  · 한 PC 안에서는 한 탭만(GM 'rnu-shipfast', 40초 신호) · 다른 작업·일시정지와 상관없이 (읽기 한 번, 속도 조절은 같이 씀)
   *  · 바뀌지 않으면 목록 문서는 건드리지 않고 작은 신호(shp_state/fast)만 — 웹앱 '읽은 시각'과 클라우드가 봄(PC가 읽는 동안 클라우드는 빠른 고리를 쉼 = 비용 절약)
   *  · ② 발송 요청 수가 바뀌면 발송 요청도 바로 읽음 · 뒤에 숨은 탭에서도 느려지지 않게 일꾼 타이머(sleep) */
  (function shipFastPc() { const ME = Math.random().toString(36).slice(2, 8); const KEY = 'rnu-shipfast'; let lastSig = null, lastDeliv = null, busy = false, fails = 0;
    /* (1.63.12) 출고 시장 받쳐 주기 — 새 주문 상품이 2분 넘게 '지금 시장 읽는 중'이면(클라우드가 못 읽었거나 늦음) 이 PC가 그 상품의 온라인 중고 첫 페이지를 읽어 같은 기록(shp_market)에 씀
     *  · 15초마다 최대 2권 · 서버 기준으로 이미 읽었으면(shp_enrich에 시장 또는 shp_market에 그 주문·상품) 안 읽음 · 로그인 필요 없는 공개 화면 */
    const mktSeen = new Map(); async function mktBackup(orders) { const now = Date.now(); let k = 0; for (const [id, v] of mktSeen) if (v !== true && now - v > 864e5) mktSeen.delete(id);
      for (const o of orders || []) for (const it of o.items || []) { const lid = String(it.listingId || ''); if (!lid || !o.orderNo) continue; const id = `${o.orderNo}__${lid}`; const v = mktSeen.get(id); if (v === true) continue; if (!v) { mktSeen.set(id, now); continue; } if (now - v < 120e3 || k >= 2) continue; k++;
        try { const e = (await C('shp_enrich').doc(lid).get()).data(); if (e && (e.mkt || e.mktErr)) { mktSeen.set(id, true); continue; }
          const q = await C('shp_market').where('orderNo', '==', o.orderNo).where('listingId', '==', lid).limit(1).get(); if (!q.empty) { mktSeen.set(id, true); continue; }
          const r = await marketSnapPC([{ ...o, items: [it] }]); mktSeen.set(id, true); if (r.n && !r.fail) log(`출고 시장 받쳐 주기: '${String(it.title || lid).slice(0, 30)}' — 클라우드가 2분 넘게 못 읽어 이 PC가 읽음`); } catch (e) { mktSeen.set(id, now + 5 * 60e3); } } }
    let cfAt = 0, cfV = false; const cloudFresh = async () => { if (Date.now() - cfAt < 20000) return cfV; cfAt = Date.now(); try { const d = (await C('app_settings').doc('cloud').get()).data() || {}; const t = Date.parse(d.lastLoopAt || d.lastConfirmAt || 0); cfV = d.ok !== false && Date.now() - t < 45e3; } catch (e) { cfV = false; } return cfV; };
    const leader = () => { const v = GM_getValue(KEY, null); if (!v || v.tab === ME || Date.now() - v.at > 40000) { GM_setValue(KEY, { tab: ME, at: Date.now() }); return true; } return false; };
    addEventListener('beforeunload', () => { const v = GM_getValue(KEY, null); if (v && v.tab === ME) GM_deleteValue(KEY); });
    window.__rnShipFast = () => ({ leader: (GM_getValue(KEY, null) || {}).tab === ME, lastSig: !!lastSig, fails });
    (async () => { if (PUBONLY) return; /* (1.64.0) 주문 읽기 = 로그인 일 */ await sleep(10000); for (;;) { await sleep(15000); if (busy || !auth.currentUser || !leader()) continue; if (await cloudFresh()) continue; /* (1.77.5) 출고 과정은 클라우드 먼저(정범님 10/17) — 클라우드 빠른 고리가 45초 안에 읽었으면 PC는 쉬고, 클라우드가 멈추면 바로 이 PC가 15초마다 */ busy = true;
        try { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (!SH) continue; const g = await lookDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); const rc = SH.parseDeliveryPage(g.doc);
          if (!rc || !rc.tabCounts || !Object.keys(rc.tabCounts).length) { fails++; continue; } if (rc.tabCounts['주문확인요청'] > 0 && (!rc.orders.length || rc.orders.every((o) => !(o.items || []).length))) { fails++; if (fails === 1 || fails % 40 === 0) log(`⚠ 출고 실시간(PC): 주문확인요청 탭은 ${rc.tabCounts['주문확인요청']}건인데 주문·상품을 못 읽음 — 알라딘 화면 모양이 바뀐 듯 · 빈 목록을 쓰지 않음`, 1); continue; } /* (1.63.14) */ fails = 0; const at = nowIso(); const sig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)]));
          let ch = false; if (sig !== lastSig) { ch = await saveConfirmState(rc, at); lastSig = sig; if (ch) log(`출고 실시간(PC): 주문확인요청 ${rc.orders.length}건으로 바뀜 — 웹앱에 바로`); }
          const dv = rc.tabCounts['발송 요청']; if (lastDeliv != null && dv !== lastDeliv) { try { await shipLiteRead(SH, g.doc); } catch (e) {} } lastDeliv = dv;
          await C('shp_state').doc('fast').set({ pc: PC_NAME, at, n: rc.orders.length, changed: ch, ver: APP_VER }, { merge: true }); try { await mktBackup(rc.orders); } catch (e) {} }
        catch (e) { fails++; } finally { busy = false; } } })(); })();
  async function lookupBook(url, code) { let g = await lookDoc(url); let p = P.parseProductPage(g.doc, g.finalUrl); if (!p.aladinItemId && !PUBONLY && /성인\s*인증|19세|청소년\s*(유해|이용불가)|wlogin\.aspx|adult/i.test(String(g.finalUrl || '') + ' ' + String(g.html || (g.doc && g.doc.documentElement ? g.doc.documentElement.outerHTML : '')).slice(0, 30000))) { /* (1.81.0) 🔞 알라딘 제목이 붙은 성인 인증 화면 — 로그인한 채로 다시 */ g = await AL.quick(url, { pace: PACE_P, sleep }); p = P.parseProductPage(g.doc, g.finalUrl); } if (!p.aladinItemId) throw new Error('알라딘에서 이 책을 못 찾음');
    const RG = RGF(); const barcode = RG ? RG.pageBarcode(g.doc) : null; if (code && !(RG ? RG.matchCode({ isbn13: p.isbn13, barcode }, code) : String(p.isbn13 || '') === String(code))) throw Object.assign(new Error(`알라딘이 다른 상품(${p.title || p.aladinItemId})으로 연결함`), { wrong: true }); /* (1.44.1) 찾던 번호와 다른 상품이면 쓰지 않음 (음반·DVD 바코드는 엉뚱한 책으로 갈 때가 있음) */
    const u = P.parseUsedPage((await lookDoc(`/shop/UsedShop/wuseditemall.aspx?ItemId=${p.aladinItemId}&TabType=0`)).doc);
    return { itemId: p.aladinItemId, isbn13: p.isbn13 || null, barcode, title: p.title || null, subtitle: p.subtitle || null, author: (p.contributors || []).slice(0, 2).map((c) => c.name).join(', ') || null, publisher: p.publisher || null, pubDate: p.pubDate || null,
      cover: (p.images && p.images.front) || null, priceList: p.priceList ?? null, priceSales: p.priceSales ?? null, availability: p.availability || null, usedTotal: u.usedTotal ?? null, buyback: u.buyback || null, mins: u.mins || null, page1: u.listings || [], lastPage: u.lastPage || 1, at: nowIso(),
      /* (1.44.0) 등록 엔진: 클라우드 /lookup(0.9.2)과 같은 칸 — 상품 관리 코드 판정·카드 */ categories: (p.categories || []).map((c) => ({ path: c.path || [], cids: c.cids || [] })), salesPoint: p.salesPoint ?? null, ranks: p.ranks || [], reviewCount: p.reviewCount ?? null, commentCount: p.commentCount ?? null, rating: p.rating ?? null, size: p.size || null, pages: p.pages || null, originalTitle: p.originalTitle || null, series: p.series || null }; }
  /* (1.77.0) 📥 등록 조회 — 정범님 10/16: '알라딘 검색이 아니라 샵매니저 상품등록의 알라딘 등록 검색으로' · 클라우드 0.16.0과 같은 순서
   *  상품명 → 등록 검색(NAME) 후보(등록 코드 포함) · 번호 → 등록 검색(ISBN): 1개면 그 상품 상세, 여러 개(판·에디션)면 후보 · 등록 검색에 없으면 예전처럼 상품 페이지(ISBN=)·공개 검색 */
  async function regLookupCmd(ref, v) { const isb = v.isbns || [], ids = v.itemIds || [], qs = v.queries || []; const tot = isb.length + ids.length + qs.length; let n = 0; const items = {}, cands = {}, errs = {}, srch = {}; const br = +v.branch || 1;
    /* (1.88.0) 📥 기본값 판매가 ②: 첫 페이지(시장표)가 비었거나 상품명 조회면 바깥 중고 검색(SearchTarget=Used)의 같은 상품 후보를 같이 (products-core 0.16.0 usedSearchRows · 클라우드 0.23.0과 같음) */
    const usedS = async (title, self) => { const qy = P.usedSearchRows ? P.searchQueryOf(title) : null; if (!qy) return null; try { const g = await lookDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodeURIComponent(qy)}`); return { q: qy, at: nowIso(), rows: P.usedSearchRows(g.doc, qy, 0.9, self || null) }; } catch (e) { return null; } };
    LOOK_PRIO++; try { log(`📥 등록 조회: ${tot}건 (샵매니저 등록 검색)`); const prog = () => ref.set({ n, tot, items, cands, srch, errs, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const keep = async (key, r) => { if (!(r.page1 || []).length && r.title) { const x = await usedS(r.title, r.itemId); if (x) r.srch = x; } items[key] = r; try { await C('prd_lookups').add({ key, isbn13: r.isbn13, itemId: r.itemId, ...r, by: PC_NAME, cmdId: ref.id, ...W() }); } catch (e) {} };
    const get = async (url, init) => { const r = await fetch('https://www.aladin.co.kr' + url, { credentials: 'include', cache: 'no-store', ...(init || {}) }); return { url: r.url, text: await r.text() }; };
    const scm = async (q, kind) => { const R = await P.scmSearch(q, kind, br, get, 10); if (!R.login) throw new Error('샵매니저 로그인이 풀림 — 이 PC에서 알라딘 샵매니저에 로그인해 주세요'); return R.rows.slice(0, 200).map((x) => ({ ...x, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, scm: true })); };
    /* (1.78.2) 가볍고 빠른 것부터: 고른 상품(번호 확정 — 화면 2장) → 번호(ISBN) → 상품명(등록 검색 여러 쪽 · 사람이 골라야 함) */
    for (const id of ids) { try { await keep('id_' + id, await lookupBook(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`)); } catch (e) { errs['id_' + id] = e.message; } n++; await prog(); }
    for (const isbn of isb) { try { const L = await scm(isbn, 'ISBN'); if (L.length === 1) { const r = await lookupBook(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(L[0].itemId)}`); r.scmCode = L[0].code; await keep(isbn, r); }
        else if (L.length > 1) { cands[isbn] = L; errs[isbn] = `샵매니저 등록 검색에 이 번호의 상품이 ${L.length}개(판·에디션) — 맞는 상품을 누르세요`; }
        else { let r = null, why = null; try { r = await lookupBook(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`, isbn); } catch (e) { why = e.message; } if (r) await keep(isbn, r); else errs[isbn] = '샵매니저 등록 검색·상품 페이지 모두 이 번호(ISBN·바코드)의 상품을 못 찾음 — 상품명으로 찾아 보세요' + (why ? ` (${why})` : ''); } }
      catch (e) { errs[isbn] = e.message; } n++; await prog(); await sleep(500); }
    for (const q of qs) { try { cands[q] = P.scmSmart ? await (async () => { const R = await P.scmSmart(q, br, get, 10); if (!R.login) throw new Error('샵매니저 로그인이 풀림 — 이 PC에서 알라딘 샵매니저에 로그인해 주세요'); return R.rows.slice(0, 200).map((x) => ({ ...x, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, scm: true })); })() : await scm(q, 'NAME'); /* (1.89.5) 상품명·지은이 낱말 일부 섞어도(products-core 0.17.0 scmSmart) */ } catch (e) { errs['q_' + q] = e.message; } { const x = await usedS(q, null); if (x) srch[q] = x; } n++; await prog(); await sleep(500); }
    await ref.set({ status: 'done', n, tot, items, cands, srch, errs, via: 'scm', doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
    log(`📥 등록 조회: ${Object.keys(items).length}권 · 후보 ${Object.keys(cands).length}건 끝${Object.keys(errs).length ? ` · 확인 ${Object.keys(errs).length}` : ''}`, 0); try { const CS = window.__rnCS; if (CS) { CS.add('lookup_reg', 'ok', Object.keys(items).length); CS.add('lookup_reg', 'part', Object.keys(cands).length); Object.entries(errs).forEach(([k, m]) => { if (!cands[k]) CS.add('lookup_reg', 'fail', 1, m); }); } } catch (e) {} } finally { LOOK_PRIO--; } }
  async function lookupCmd(ref, v) { const isb = v.isbns || [], ids = v.itemIds || [], qs = v.queries || []; const tot = isb.length + ids.length + qs.length; let n = 0; const items = {}, cands = {}, errs = {};
    log(`사진 가격: 알라딘에서 ${tot}건 읽기 (웹앱에서 맡김)`); if (PUBONLY) await mixRead(1 + Math.floor(Math.random() * 2)); /* (1.69.0) 🔀 */
    const prog = () => ref.set({ n, tot, items, cands, errs, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const keep = async (key, r) => { items[key] = r; try { await C('prd_lookups').add({ key, isbn13: r.isbn13, itemId: r.itemId, ...r, by: PC_NAME, cmdId: ref.id, ...W() }); } catch (e) {} };
    const TGT = { 1: 'Book', 2: 'Music', 3: 'DVD', 7: 'Foreign' }[+v.branch || 1] || 'Book';
    for (const isbn of isb) { await mixMaybe(); try { let r = null, why = null; try { r = await lookupBook(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`, isbn); } catch (e) { why = e.message; }
        if (!r) for (const tgt of [...new Set([TGT, 'All'])]) { /* 번호로 검색해 앞 3개 중 번호가 맞는 상품 (클라우드 0.9.3과 같은 순서) */ const sr = await lookDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=${tgt}&SearchWord=${encodeURIComponent(isbn)}`); for (const c of P.parseSearchResults(sr.doc).filter((x) => !x.used).slice(0, 3)) { try { r = await lookupBook(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(c.itemId)}`, isbn); break; } catch (e) {} } if (r) break; }
        if (r) await keep(isbn, r); else errs[isbn] = (why && /다른 상품/.test(why) ? why + ' — 이 번호의 상품을 찾지 못함 (상품명으로 찾아 고르세요)' : '알라딘에서 이 번호(ISBN·바코드)의 상품을 못 찾음'); } catch (e) { errs[isbn] = e.message; } n++; await prog(); }
    for (const id of ids) { try { await keep('id_' + id, await lookupBook(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`)); } catch (e) { errs['id_' + id] = e.message; } n++; await prog(); }
    for (const q of qs) { try { const sr = await lookDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=${TGT}&SearchWord=${encodeURIComponent(q)}`); /* (1.44.0) 등록 엔진: 상품 구분에 맞춰 찾음 */
        cands[q] = P.parseSearchResults(sr.doc).filter((r) => !r.used).slice(0, 8).map((r) => ({ itemId: r.itemId, title: r.title, img: r.img || null, cov: Math.round(P.nameCoverage(q, r.title) * 1000) / 1000, channels: r.channels || null })); } catch (e) { errs['q_' + q] = e.message; } n++; await prog(); }
    try { const CS = window.__rnCS; if (CS) { CS.add('lookup_ppt', 'ok', Object.keys(items).length); CS.add('lookup_ppt', 'part', Object.keys(cands).length); Object.entries(errs).forEach(([k, m]) => { if (!cands[k]) CS.add('lookup_ppt', 'fail', 1, m); }); } } catch (e) {} /* (1.79.0) 📊 사진 가격 조회 */
    await ref.set({ status: 'done', n, tot, items, cands, errs, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
    log(`사진 가격: ${Object.keys(items).length}권 · 검색 ${Object.keys(cands).length}건 끝${Object.keys(errs).length ? ` · 실패 ${Object.keys(errs).length}` : ''}`, Object.keys(errs).length ? 1 : 0); }
  /* (1.44.0) 📥 알라딘 대량 등록 (웹앱 '상품 등록'의 일괄 확정 → shp_cmds type 'regBulk' · rows [{isbn, state, qty, grade, price, title, code, desc, regItem}] · 200줄까지)
   *  돈이 걸린 일 — 한 단계라도 어긋나면 알라딘에 등록하지 않고 멈춤:
   *   ⓪ 한 번에 하나(모든 PC): 등록 자리(prd_system/reg_lane)를 잡은 일만 · 다른 등록이 하는 중이면 '차례 기다림'(held)으로 두고 그 일이 끝나면 이어서
   *   ① 실행도구의 한 문(exec_log)에 '시작'을 적을 수 있을 때만 (기록 칸을 못 쓰면 하지 않음 — 같은 일을 두 번 등록하지 않게)
   *   ② 엑셀 = 알라딘 원본 양식(공용 파일 readnow-register-core.js 안)에 줄만 넣어 만듦 → 다시 읽어 넣은 값과 같은지 확인
   *   ③ 등록 전 우리 상품 조회의 가장 최근 상품 번호(기준)를 적어 둠 — 등록 뒤 '새로 생긴 상품'만 찾으려고 (못 읽으면 멈춤)
   *   ④ 대량 등록 화면에 올림 → 미리보기를 읽어 넣은 줄과 ISBN·판매가·코드·품질·수량·판매상태가 하나도 다르지 않고 다른 줄도 없을 때만
   *   ⑤ '보냄'을 먼저 Firebase에 적고(못 적으면 보내지 않음) 우리 줄만 골라 '등록완료'와 같은 요청 → 한 번 보낸 일은 자동으로 다시 하지 않음
   *   ⑥ 공개 확인(한 PC·한 탭만, 3분마다): 상품 조회(최신순)에서 기준보다 새로 올라온(새등록) 상품 중 ISBN·코드·판매가·품질·수량이 맞는 것 → '알라딘에 보임'(U코드)
   *      상품 번호는 한 번만 짝지음(reg_claims) — 손으로 같이 등록한 다른 상품을 우리 것으로 잘못 잡지 않게 · 90분 안에 못 찾으면 '결과 모름'
   *   ⑦ 보이면 '신규 등록분 수집'으로 상품 목록에 넣고 그 상품들의 시장 지표를 맡김(등록 뒤 나머지 수집)
   *   지킴이: 탭이 중간에 닫혀 '하는 중'으로 15분 넘게 조용하면 — 보내기 전이면 '멈춤(등록 안 함)'으로(다시 맡길 수 있음), 보낸 뒤면 공개 확인으로 */
  const RGF = () => window.ReadnowRegister || globalThis.ReadnowRegister || null;
  const BULK_URL = 'https://www.aladin.co.kr/scm/UsedItemBulkReg.aspx';
  const REG_LIST_CODE = { 1: 1, 2: 3, 3: 15 }; // 대량 등록 판매상태(1 판매중·2 일시판매중지·3 판매중지) → 상품 조회 상태 번호
  const REG_ME = () => PC_NAME + ':' + TAB_ID; const REG_LANE = () => C('prd_system').doc('reg_lane'); const REG_LANE_STALE = 20 * 60000;
  const regNotSent = (m) => Object.assign(new Error(m), { notSent: true });
  const regIsbnEq = (a, b) => { a = String(a || '').replace(/[^0-9Xx]/g, '').toUpperCase(); b = String(b || '').replace(/[^0-9Xx]/g, '').toUpperCase(); if (!a || !b) return false; if (a === b) return true; const t = (x) => (x.length === 10 ? '978' + x.slice(0, 9) : x.length === 13 && x.startsWith('978') ? x : null); const k = (x) => (x ? x.slice(0, 12) : null); return !!t(a) && !!t(b) && k(t(a)) === k(t(b)); };
  async function regNewest(codes, beat) { let base = 0; for (const code of [...new Set([1, ...codes])]) { if (beat) await beat(); const g = await lookDoc(listUrl(code, 1)); if (looksLoggedOut(g.finalUrl, g.doc)) throw regNotSent('알라딘 로그인이 풀림 — 샵매니저에 로그인한 뒤 웹앱에서 다시 맡기기'); const r = P.parseScmList(g.doc, new Date().getFullYear()); base = Math.max(base, ...r.rows.map((x) => +x.listingId || 0)); }
    const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); if (!base && !cur) throw regNotSent('상품 조회 목록을 읽지 못해 등록 전 기준을 못 정함 — 등록하지 않음'); return Math.max(base, cur); }
  async function regItemsSet(rows, results, extra) { try { const b = db.batch(); let n = 0; for (const r of rows) { if (!r.regItem) continue; const x = results[r.regItem]; if (!x) continue; b.set(C('reg_items').doc(r.regItem), { result: x, ...(extra || {}), ...W() }, { merge: true }); n++; } if (n) await b.commit(); } catch (e) { log('등록 결과를 상품 줄에 못 적음: ' + (e.code || e.message), 1); } }
  async function regLane(cmdId, op) { const ref = REG_LANE(); let res = { ok: false, holder: null }; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.exists ? sn.data() : {}; const fresh = v.cmd && Date.now() - Date.parse(v.at || 0) < REG_LANE_STALE;
      if (op === 'take') { if (fresh && v.cmd !== cmdId) { res = { ok: false, holder: v.cmd }; return; } tx.set(ref, { cmd: cmdId, by: REG_ME(), at: nowIso() }); res = { ok: true }; }
      else if (op === 'beat') { if (v.cmd === cmdId) tx.set(ref, { at: nowIso() }, { merge: true }); res = { ok: true }; }
      else if (op === 'free') { if (v.cmd === cmdId) tx.set(ref, { cmd: null, by: null, at: nowIso(), last: cmdId }); res = { ok: true }; } }); return res; }
  async function regHeldToQueued(ref, prev) { await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data() || {}; if (v.status !== 'held' || (prev !== undefined && v.prev !== prev)) return; tx.update(ref, { status: 'queued', claim: null, heldMsg: null, releasedAt: nowIso(), uploadedAt: TS() }); }); } /* 트랜잭션: 그사이 웹앱에서 '맡김 취소'했으면 되살리지 않음 */
  async function regReleaseNext(cmdId) { try { const qs = await C('shp_cmds').where('status', '==', 'held').get(); for (const d of qs.docs) { const v = d.data(); if ((v.type === 'regBulk' || v.type === 'regBulkMock') && v.prev === cmdId) await regHeldToQueued(d.ref, cmdId).catch(() => {}); } } catch (e) {} }
  /* (1.80.0) 등록 진행 기록(trail): 단계·상태가 바뀔 때마다 {때·PC·단계·상태·한 줄}을 맡긴 일 문서에 덧붙임 → 웹앱 '📡 등록 진행'이 전 과정을 시간순으로 보여 줌 (같은 단계·상태가 이어지면 한 번만) */
  const REG_TR_STEP = ['맡김', 'PC가 받음', '엑셀 만들기', '알라딘에 올림', '미리보기 대조', '등록 완료', '공개 확인'];
  function regTrailRef(r0, v0, one) { let last = v0 && Array.isArray(v0.trail) && v0.trail.length ? (() => { const t = v0.trail[v0.trail.length - 1]; return `${t.s}|${t.st}|${t.m}`; })() : ''; const r = Object.create(r0);
    r.set = (d, o) => { let t = null; try { if (d && (d.step != null || d.status)) { const res = d.results || null; const nLive = res ? Object.values(res).filter((x) => x && x.state === 'live').length : null; const nRes = res ? Object.keys(res).length : null;
        let m = String(d.msg || d.heldMsg || '').slice(0, 160); if (!m && d.verify) m = `공개 확인 ${d.verify.tries || 1}번째 · 새로 보인 상품 ${d.verify.foundNew || 0}개${nLive != null ? ` · 알라딘에 보임 ${nLive}/${nRes}` : ''}`; if (!m && d.upload) m = `올림 HTTP ${d.upload.http} · 미리보기 ${d.upload.n}줄${(d.upload.alerts || []).length ? ' · 알림: ' + d.upload.alerts.join(' / ').slice(0, 100) : ''}`; if (!m && d.reg) m = `등록 완료 누름 HTTP ${d.reg.http}${(d.reg.alerts || []).length ? ' · 알림: ' + d.reg.alerts.join(' / ').slice(0, 100) : ''}`; if (!m && d.base != null) m = `등록 전 기준 상품 번호 ${d.base}`; if (!m && d.step != null && !one) m = REG_TR_STEP[d.step] || ''; if (!m && d.fill) m = '채운 칸: ' + String(d.fill).slice(0, 140);
        const k = `${d.step ?? ''}|${d.status || ''}|${m}`; if (k !== last) { last = k; t = { at: nowIso(), pc: PC_NAME, s: d.step ?? null, st: d.status || null, m, ms: null }; } } } catch (e) {}
      return r0.set(t ? { ...d, trail: firebase.firestore.FieldValue.arrayUnion(t) } : d, o); };
    return r; }
  async function regBulkCmd(ref, v) { const RG = RGF(); const X = EXC(); const rows = Array.isArray(v.rows) ? v.rows : []; const results = {}; const t0 = Date.now(); let laneOk = false; ref = regTrailRef(ref, v); try { await ref.set({ step: v.step || 0, msg: `${PC_NAME} 수집기가 받음 · ${rows.length}줄 · ${v.qty || rows.length}부` }, { merge: true }); } catch (e) {}
    const st = (step, extra) => Promise.all([ref.set({ step, beatAt: nowIso(), ...(extra || {}), uploadedAt: TS() }, { merge: true }).catch(() => {}), laneOk ? regLane(ref.id, 'beat').catch(() => {}) : null]);
    const stop = async (msg, extra, state) => { rows.forEach((r) => (results[r.regItem] = { state: state || 'fail', at: nowIso(), msg })); try { await ref.set({ status: 'fail', msg, results, sent: false, doneAt: nowIso(), by: PC_NAME, ...(extra || {}), uploadedAt: TS() }, { merge: true }); } catch (e) { log('멈춤을 적지 못함: ' + (e.code || e.message), 1); } await regItemsSet(rows, results); log(`📥 대량 등록 멈춤 (알라딘에 등록하지 않음): ${msg}`, 1); };
    log(`📥 대량 등록 맡음: ${rows.length}줄 · ${v.qty || rows.length}부 · 판매가 합계 ${(+v.sum || 0).toLocaleString()}원`);
    if (!RG || typeof XLSX === 'undefined' || !XLSX.CFB) return stop('공용 파일 readnow-register-core.js 또는 엑셀 도구(SheetJS)를 못 읽음 — 수집기 탭을 새로고침');
    if (!rows.length || rows.length > 200) return stop(`줄 수가 이상함 (${rows.length}) — 한 번에 1~200줄`);
    if (!X) return stop('실행도구 공용 파일(readnow-exec-core.js)이 없음 — 돈이 걸린 일이라 기록 없이 하지 않음');
    try { const ln = await regLane(ref.id, 'take'); if (!ln.ok) { await ref.set({ status: 'held', prev: ln.holder, claim: null, heldMsg: '다른 등록이 하는 중 — 끝나면 이어서 (한 번에 하나)', uploadedAt: TS() }, { merge: true }); log('📥 다른 대량 등록이 하는 중 — 끝나면 이어서'); return; } laneOk = true; }
    catch (e) { return stop('등록 자리(prd_system/reg_lane)를 못 잡음 — ' + (e.code || e.message)); }
    let sent = false, base = 0; const xend = (s, m, r) => exEnd('regBulk', ref.id, s, m, r);
    try {
      let gate; try { gate = await X.begin(db, { kind: 'regBulk', key: ref.id, by: PC_NAME, detail: { n: rows.length, qty: v.qty || null, sum: v.sum || null }, staleMin: 120 }); } catch (e) { return await stop(`실행 기록(exec_log)을 못 적어 하지 않음 — ${e.code || e.message}${/permission/i.test(e.code || e.message) ? ' (Firestore 규칙에 exec_log 허용 필요)' : ''}`); }
      if (!gate.ok) { if (gate.state === 'done' && v.verify && v.verify.base) { await ref.set({ status: 'verify', msg: '이미 등록한 일 — 공개 확인만 이어감', uploadedAt: TS() }, { merge: true }); return; }
        return await stop('실행 문이 막음: ' + gate.why + ' — 이미 등록됐을 수 있음, 알라딘 상품 조회에서 확인한 뒤 관리도구에서 닫기', { gate: gate.state }, 'unknown'); }
      const codes = [...new Set(rows.map((r) => REG_LIST_CODE[+r.state || 1] || 1))];
      await st(2); const bytes = RG.buildBulkXls(RG.templateBytes(), rows, XLSX.CFB); const vr = RG.verifyBulkXls(bytes, rows, XLSX); if (!vr.ok) throw regNotSent('만든 엑셀을 다시 읽으니 넣은 값과 다름: ' + vr.bad.slice(0, 3).join(' / '));
      base = await regNewest(codes, () => st(2));
      await st(3, { base, codes }); const g0 = await lookDoc(BULK_URL); const p0 = RG.parseBulkPage(g0.doc); if (looksLoggedOut(g0.finalUrl, g0.doc) || !p0.loggedIn) throw regNotSent('알라딘 로그인이 풀림 — 샵매니저에 로그인한 뒤 웹앱에서 다시 맡기기'); if (!p0.hasUpload || !p0.excelKey) throw regNotSent('대량 등록 화면에서 올리기 칸(excelKey)을 못 찾음 — 알라딘 화면이 바뀌었을 수 있음');
      const fd = new FormData(); fd.append('excelFileInputText', `readnow_${ref.id}.xls`); fd.append('excelFileInput', new Blob([bytes], { type: 'application/vnd.ms-excel' }), `readnow_${ref.id}.xls`); fd.append('x', '31'); fd.append('y', '11'); fd.append('excelAction', '1'); fd.append('excelKey', p0.excelKey);
      await PACE.wait(sleep); await st(3); const ac = new AbortController(); const tmo = setTimeout(() => ac.abort(), 120000); let r1; try { r1 = await fetch(BULK_URL, { method: 'POST', body: fd, credentials: 'include', signal: ac.signal }); } catch (e) { throw regNotSent('올리기 응답 없음(2분) — 등록하지 않음: ' + e.message); } finally { clearTimeout(tmo); } const h1 = await r1.text(); const d1 = new DOMParser().parseFromString(h1, 'text/html'); const p1 = RG.parseBulkPage(d1);
      await st(4, { upload: { http: r1.status, n: p1.count, alerts: p1.alerts.slice(0, 5), token: p1.tokenId || null } });
      if (!r1.ok) throw regNotSent(`올리기 실패 (HTTP ${r1.status})`); if (!p1.hasPreview || !p1.tokenId) throw regNotSent('올린 뒤 미리보기가 없음' + (p1.alerts.length ? ' — 알라딘: ' + p1.alerts.slice(0, 3).join(' / ') : ' (파일을 받지 않았을 수 있음)'));
      const m = RG.matchPreview(p1, rows); if (!m.ok) throw regNotSent(`미리보기가 넣은 것과 다름 — 등록하지 않음${m.miss.length ? ` · 빠진 ISBN ${m.miss.slice(0, 5).join(', ')}` : ''}${m.diff.length ? ' · 다름: ' + m.diff.slice(0, 3).join(' / ') : ''}${m.extra.length ? ` · 넣지 않은 줄 ${m.extra.length}개가 미리보기에 있음` : ''}${p1.alerts.length ? ' · 알라딘: ' + p1.alerts.slice(0, 2).join(' / ') : ''}`);
      if (v.mock) { /* (1.50.0) 🧷 모의 등록: 엑셀 만들기·올리기·미리보기 대조까지 했으니 여기서 멈춤 — '등록 완료'는 누르지 않음(알라딘에 안 올라감) · 상품은 결정 대기로 */
        const msg = `알라딘에 보내지 않음 · 엑셀 ${rows.length}줄 만들기·올리기·미리보기 대조 모두 맞음 (미리보기 ${p1.count}줄)`; rows.forEach((r) => (results[r.regItem] = { state: 'mock', at: nowIso(), msg }));
        await ref.set({ status: 'done', mock: true, step: 4, msg: '🧷 모의 등록 — ' + msg, results, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }).catch(() => {});
        try { const b = db.batch(); rows.forEach((r) => r.regItem && b.set(C('reg_items').doc(r.regItem), { stage: 'pick', cmdId: null, final: null, confirmedAt: null, result: null, mockResult: { at: nowIso(), ok: true, msg, kind: 'bulk' }, ...W() }, { merge: true })); await b.commit(); } catch (e) { log('모의 결과를 상품 줄에 못 적음: ' + (e.code || e.message), 1); }
        await xend('failed', '🧷 모의 등록 — 보내지 않음', { n: rows.length, mock: true }); log(`🧷 대량 모의 등록 끝: ${rows.length}줄 — 미리보기 대조까지 맞음, 알라딘에 보내지 않음`); return; }
      const q = new URLSearchParams(); m.pairs.forEach((pk) => q.append('chk_' + pk, pk)); q.append('x', '52'); q.append('y', '14'); q.append('regItemAction', '1'); q.append('tokenId', p1.tokenId);
      /* 보냄 표시는 트랜잭션: 이 일이 아직 '하는 중'이고 이 탭이 맡았고 등록 자리도 이 일일 때만 — 지킴이가 그사이 '멈춤'으로 바꿨거나 다른 곳이 맡았으면 보내지 않음 */
      let mine = false; try { await db.runTransaction(async (tx) => { mine = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const sn = await tx.get(ref); const lane = await tx.get(REG_LANE()); const cv = sn.data() || {}; const lv = lane.exists ? lane.data() : {}; if (cv.status !== 'running' || (cv.claim || {}).tab !== TAB_ID || lv.cmd !== ref.id) return;
          tx.update(ref, { step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), preview: { n: p1.count }, verify: { base, codes, until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 }, uploadedAt: TS() }); tx.set(REG_LANE(), { at: nowIso() }, { merge: true }); mine = true; }); }
      catch (e) { throw regNotSent('보내기 전 기록(보냄 표시)을 못 적음 — 두 번 등록을 막으려고 보내지 않음: ' + (e.code || e.message)); }
      if (!mine) { laneOk = false; log('📥 이 일이 그사이 멈춤 처리됐거나 다른 곳이 맡음 — 등록을 보내지 않음', 1); return; }
      await PACE.wait(sleep); sent = true; const regAt = nowIso(); let h2 = '', http2 = null, al2 = [];
      try { const r2 = await fetch(BULK_URL + '?' + q.toString(), { credentials: 'include' }); http2 = r2.status; h2 = await r2.text(); al2 = RG.pageAlerts(h2); } catch (e) { al2 = ['응답을 못 받음: ' + e.message]; } /* 화면 자체 안내 알림(등록할 상품이 없습니다 등 늘 있는 글)은 빼고 서버가 넣은 알림만 */
      const bad = http2 !== 200 || al2.some((a) => /실패|오류|불가|잘못|없습니다|초과|error/i.test(a)) || (/로그인|wlogin/i.test(h2.slice(0, 3000)) && !/wC2Cuser_logout/.test(h2)); const stt = bad ? 'unknown' : 'registered';
      rows.forEach((r, i) => (results[r.regItem] = { state: stt, at: nowIso(), pkid: m.pairs[i], msg: bad ? `알라딘 답: ${al2.slice(0, 2).join(' / ') || 'HTTP ' + http2} — 공개 확인으로 판단` : null }));
      await ref.set({ status: 'verify', step: 6, regAt, reg: { http: http2, alerts: al2.slice(0, 5) }, results, by: PC_NAME, ms: Date.now() - t0, uploadedAt: TS() }, { merge: true }).catch((e) => log('등록 결과를 못 적음(공개 확인이 이어서 적음): ' + (e.code || e.message), 1));
      await regItemsSet(rows, results); await xend(bad ? 'unknown' : 'done', al2.slice(0, 2).join(' / ') || null, { n: rows.length, http: http2, base });
      log(`📥 대량 등록 ${bad ? '보냄(알라딘 답 확인 필요)' : '완료'}: ${rows.length}줄 — 이제 상품 조회에서 공개 확인 (3분마다, 90분까지)`, bad ? 1 : 0); setTimeout(() => regVerifyAll().catch(() => {}), 60000);
    } catch (e) { if (!sent) { await xend('failed', e.message, null); return await stop(e.message); }
      rows.forEach((r) => (results[r.regItem] = results[r.regItem] || { state: 'unknown', at: nowIso(), msg: '등록 요청 뒤 오류: ' + e.message }));
      await ref.set({ status: 'verify', step: 6, results, msg: '등록 요청 뒤 오류 — 공개 확인으로 판단: ' + e.message, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await xend('unknown', e.message, { base }); log('📥 대량 등록: 등록 요청 뒤 오류 — ' + e.message, 1); }
    finally { if (laneOk) { await regLane(ref.id, 'free').catch(() => {}); await regReleaseNext(ref.id); } } }
  /* 공개 확인·지킴이 — 3분마다 · 읽기만(알라딘을 바꾸지 않음) · 한 일은 한 곳만(lease) */
  /* (1.89.29) 정범님 10/22 '자기 기기가 자기 업무를' — 등록을 누른 PC(맡긴 일 dev)가 살아 있으면 공개 확인도 그 PC가(다른 PC는 그 PC가 8분 넘게 확인을 안 했을 때만 대신) */
  const regOwnerElse = (v) => { try { const dv = String(v.dev || (v.claim || {}).pc || '').trim().toUpperCase(); if (!dv || dv === String(PC_NAME || '').trim().toUpperCase()) return false; const B = ((BEATS || {}).pcs || {})[dv]; const alive = B && Date.now() - (+B.atMs || 0) < 3 * 60e3 && !B.paused; const last = Date.parse(((v.verify || {}).lastAt) || v.regAt || v.sentAt || 0) || 0; return !!alive && Date.now() - last < 8 * 60e3; } catch (e) { return false; } };
  /* (1.89.29) 보낸 직후 빠른 공개 확인 — 6초·15초·30초·1분·1분 30초·2분·3분·4분·5분·7분·10분 (그 뒤는 3분마다 · 90분까지) */
  window.__rnRegVerifyNow = (id) => { const seq = [6, 15, 30, 60, 90, 120, 180, 240, 300, 420, 600].map((x) => x * 1000); let i = 0; const go = async () => { let st = null; try { const d = await C('shp_cmds').doc(id).get(); const v = d.data() || {}; st = v.status; if (st === 'verify' && (await regLease(d.ref))) await regVerifyOne(d.ref, v); st = ((await C('shp_cmds').doc(id).get()).data() || {}).status; } catch (e) {} if (st === 'verify' && ++i < seq.length) setTimeout(go, seq[i] - seq[i - 1]); }; setTimeout(go, seq[0]); };
  let regVerBusy = false;
  async function regLease(ref) { let ok = false; await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const sn = await tx.get(ref); const v = sn.data() || {}; const L = v.lease || {}; if (L.by && L.by !== REG_ME() && Date.parse(L.until || 0) > Date.now()) return; tx.set(ref, { lease: { by: REG_ME(), until: new Date(Date.now() + 6 * 60000).toISOString() } }, { merge: true }); ok = true; }); return ok; }
  async function regVerifyAll() { if (regVerBusy || !auth.currentUser || !RGF() || (window.__rnRest && window.__rnRest())) return; regVerBusy = true; const X = EXC();
    try { // ① 지킴이: '하는 중'·'멈춘 일(sweep)'인데 15분 넘게 조용함
      for (const stName of ['running', 'stuck']) { const qs = await C('shp_cmds').where('status', '==', stName).get(); for (const d of qs.docs) { const v = d.data(); if (v.type === 'regDel') { /* (1.89.30) 멈춘 삭제도 매듭 — 보낸 것이 있으면 다시 찾기(delcheck)로, 없으면 '못 함'(다시 삭제를 누르면 됨) */ const quietD = Date.now() - Math.max(Date.parse(v.beatAt || 0) || 0, Date.parse((v.claim || {}).at || 0) || 0, Date.parse(v.createdAt || 0) || 0) > 15 * 60000; if (stName !== 'stuck' && !quietD) continue; if (!(await regLease(d.ref))) continue; const res = { ...(v.results || {}) }; const sent = Object.values(res).some((x) => x.state === 'sent'); if (sent) await d.ref.set({ status: 'delcheck', msg: '삭제를 맡은 수집기 탭이 멈춤 — 보낸 것은 다시 찾아 지워졌는지 확인', uploadedAt: TS() }, { merge: true }); else { (v.items || []).forEach((it) => { const k = it.regItem || it.listingKey || it.listingId; if (!res[k]) res[k] = { state: 'fail', at: nowIso(), msg: '수집기 탭이 삭제 전에 멈춤 — 알라딘은 그대로 · 다시 삭제를 누르면 됨', listingId: String(it.listingId || '') }; }); await d.ref.set({ status: 'fail', results: res, msg: '수집기 탭이 삭제 전에 멈춤 — 알라딘은 그대로', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); await delItemsSync(d.id, v, res); } continue; } if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type)) continue; const quiet = Date.now() - Math.max(Date.parse(v.beatAt || 0) || 0, Date.parse((v.claim || {}).at || 0) || 0, Date.parse(v.createdAt || 0) || 0) > (/^regOne/.test(v.type) ? 4 : 15) * 60000; /* (1.89.29) 정범님 10/22 '실시간과 거리가 멂': 개별·미등록은 30초마다 살아 있음을 남기므로 4분 조용하면 멈춘 것 (대량은 엑셀 올림이 길어 15분) */ if (!quiet || !(await regLease(d.ref))) continue;
          if (v.sent) { await d.ref.set({ status: 'verify', msg: '수집기 탭이 등록 요청 뒤 멈춤 — 공개 확인으로 판단', verify: { ...(v.verify || {}), base: (v.verify || {}).base || v.base || 0, codes: (v.verify || {}).codes || v.codes || [1], until: new Date(Date.now() + 90 * 60000).toISOString() }, uploadedAt: TS() }, { merge: true }); log('📥 지킴이: 등록 요청 뒤 멈춘 일 → 공개 확인으로', 1); }
          else { const res = {}; (v.rows || []).forEach((r) => (res[r.regItem] = { state: 'fail', at: nowIso(), msg: '수집기 탭이 중간에 멈춤 — 알라딘에 등록하지 않음' })); await d.ref.set({ status: 'fail', sent: false, msg: '수집기 탭이 등록 요청 전에 멈춤(탭 닫힘·새로고침) — 알라딘에 등록하지 않음 · 다시 맡길 수 있음', results: res, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
            if (X && v.type === 'regBulk') await X.finish(db, { kind: 'regBulk', key: d.id }, 'failed', { msg: '보내기 전에 멈춤 (지킴이)' }).catch(() => {}); await regItemsSet(v.rows || [], res); log('📥 지킴이: 보내기 전에 멈춘 등록 → 멈춤(등록 안 함)', 1); }
          await regLane(d.id, 'free').catch(() => {}); await regReleaseNext(d.id); } }
      // ② 차례 기다림: 앞 일이 끝났으면(또는 사라졌으면) 대기로
      { const qs = await C('shp_cmds').where('status', '==', 'held').get(); for (const d of qs.docs) { const v = d.data(); if (v.type !== 'regBulk') continue; const pv = v.prev ? (await C('shp_cmds').doc(v.prev).get()).data() : null; if (!pv || ['verify', 'done', 'fail', 'cancelled'].includes(pv.status)) await regHeldToQueued(d.ref, v.prev).catch(() => {}); } }
      // ③ 공개 확인
      const qs = await C('shp_cmds').where('status', '==', 'verify').get(); for (const d of qs.docs) { const v = d.data(); if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type)) continue; if (regOwnerElse(v)) continue; if (!(await regLease(d.ref))) continue; await regVerifyOne(d.ref, v); }
      const q2 = await C('shp_cmds').where('post', '==', 'need').get(); for (const d of q2.docs) { const v = d.data(); if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type) || v.status !== 'done') continue; if (!(await regLease(d.ref))) continue; await regPostCollect(d.ref, v.rows || [], v.results || {}); } }
    catch (e) { log('공개 확인 실패: ' + (e.code || e.message), 1); } finally { regVerBusy = false; } }
  async function regClaim(lid, cmdId, regItem) { let ok = false; const ref = C('reg_claims').doc(String(lid)); await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const sn = await tx.get(ref); const v = sn.exists ? sn.data() : null; if (v && !(v.cmd === cmdId && v.regItem === regItem)) return; tx.set(ref, { cmd: cmdId, regItem, at: nowIso(), by: PC_NAME }); ok = true; }); return ok; }
  async function regVerifyOne(ref, v) { ref = regTrailRef(ref, v); const rows = v.rows || []; const results = { ...(v.results || {}) }; const vf = v.verify || {}; const base = +vf.base || 0;
    const pend = rows.filter((r) => !results[r.regItem] || results[r.regItem].state !== 'live'); if (!pend.length) { await ref.set({ status: 'done', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); return; }
    if (!base) { rows.forEach((r) => { if (!results[r.regItem] || results[r.regItem].state !== 'live') results[r.regItem] = { ...(results[r.regItem] || {}), state: 'unknown', at: nowIso(), msg: '등록 전 기준이 없어 공개 확인을 못 함 — 알라딘 상품 조회에서 확인' }; }); await ref.set({ results, status: 'done', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); await regItemsSet(rows, results); return; }
    const found = []; const codes = vf.codes && vf.codes.length ? vf.codes : [...new Set(rows.map((r) => REG_LIST_CODE[+r.state || 1] || 1))];
    for (const code of codes) for (let pg = 1; pg <= 6; pg++) { const g = await lookDoc(listUrl(code, pg)); if (looksLoggedOut(g.finalUrl, g.doc)) throw new Error('알라딘 로그인이 풀림'); const L = P.parseScmList(g.doc, new Date().getFullYear()).rows; const nw = L.filter((x) => +x.listingId > base); found.push(...nw.map((x) => ({ ...x, code }))); if (nw.length < L.length || !L.length) break; }
    const used = new Set(Object.values(results).map((x) => x && x.listingId).filter(Boolean).map(String)); let hit = 0; const G = RGF().GRADE;
    for (const r of pend) { const want = { sku: r.code, price: Math.round(+r.price), grade: G[+r.grade || 2], qty: Math.max(1, +r.qty || 1), code: REG_LIST_CODE[+r.state || 1] || 1 };
      const cands = found.filter((x) => !used.has(String(x.listingId)) && String(x.sku || '') === want.sku && +x.price === want.price && x.grade === want.grade && +x.qty === want.qty && x.code === want.code)
        .map((x) => ({ x, isb: r.isbn && (x.isbn13 || x.isbn10) ? regIsbnEq(x.isbn13 || x.isbn10, r.isbn) || regIsbnEq(x.isbn10, r.isbn) : null, /* 미등록 상품(ISBN 없음)은 상품명으로만 */ s: P.nameCoverage ? P.nameCoverage(r.title || '', x.title || '') : 0 }))
        .filter((c) => c.isb === true || (c.isb === null && c.s >= 0.6)).sort((a, b) => (b.isb === true) - (a.isb === true) || b.s - a.s); /* ISBN이 보이면 ISBN이 같아야 · 안 보이면 상품명이 60% 넘게 같아야 */
      for (const c of cands) { if (!(await regClaim(c.x.listingId, ref.id, r.regItem).catch(() => false))) continue; used.add(String(c.x.listingId)); hit++; results[r.regItem] = { ...(results[r.regItem] || {}), state: 'live', at: nowIso(), usedCode: c.x.usedCode || null, listingId: String(c.x.listingId), by: c.isb ? 'isbn' : 'title', msg: null }; break; } }
    const left = rows.filter((r) => !results[r.regItem] || results[r.regItem].state !== 'live').length; const over = vf.until && Date.now() > Date.parse(vf.until);
    const everNew = Math.max(+vf.everNew || 0, found.length); const sentMs = Date.parse(v.regAt || v.sentAt || 0) || 0;
    /* (1.89.29) 정범님 10/22 '애매한 채로 남는 경우 일절 없게': 보낸 뒤 12분 동안 상품 조회(그 판매상태 목록 맨 앞)에 기준 번호보다 새 상품이 '하나도' 안 생겼으면 = 알라딘이 받지 않음(확실) → 실패로 닫고 등록 줄은 결정 대기로 원위치 + 문제 흔적(regProblem) — 다시 맡기기·휴지통·보류는 사람이 고름
     *  새 상품이 생겼는데 우리 것과 칸(코드·판매가·등급·수량·이름)이 안 맞으면 확실하지 않음 → 90분까지 찾고 '결과 모름'(웹앱이 빨강으로 남기고 사람이 샵매니저에서 확인) */
    if (left && !hit && everNew === 0 && sentMs && Date.now() - sentMs > 12 * 60e3 && !String(v.type).includes('Mock')) { const why = `보낸 뒤 ${Math.round((Date.now() - sentMs) / 60000)}분 동안 알라딘 상품 조회에 새 상품이 하나도 안 생김 (확인 ${(vf.tries || 0) + 1}번 · 기준 상품 번호 ${base}) — 알라딘이 등록을 받지 않음`;
      rows.forEach((r) => { const x = results[r.regItem]; if (!x || x.state !== 'live') results[r.regItem] = { ...(x || {}), state: 'notreg', at: nowIso(), msg: '알라딘에 안 올라감 — 결정 대기로 되돌림' }; });
      await ref.set({ results, status: 'fail', sent: true, notReg: true, msg: why, doneAt: nowIso(), verify: { ...vf, tries: (vf.tries || 0) + 1, lastAt: nowIso(), by: PC_NAME, foundNew: 0, everNew: 0 }, uploadedAt: TS() }, { merge: true });
      try { const b = db.batch(); rows.forEach((r) => { if (!r.regItem || (results[r.regItem] || {}).state !== 'notreg') return; b.set(C('reg_items').doc(r.regItem), { stage: 'pick', cmdId: null, final: null, result: null, autoCmd: null, day: null, movedAt: nowIso(), regProblem: { at: nowIso(), kind: 'notRegistered', cmd: ref.id, msg: why, by: PC_NAME, fill: v.fill || null, reg: v.reg || null }, lookErr: '⚠ 등록 실패 — ' + why, history: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), by: PC_NAME, what: '확정 → 결정 대기 (자동 원위치: 알라딘에 안 올라감)' }), uploadedAt: TS() }, { merge: true }); }); await b.commit(); } catch (e) { log('등록 줄 원위치 실패: ' + (e.code || e.message), 1); }
      try { const X0 = EXC(); if (X0 && v.type === 'regOne') { for (const r of rows) { const it0 = ((await C('reg_items').doc(r.regItem).get()).data() || {}); const k = `${r.regItem}#${it0.tries || 1}`; await X0.finish(db, { kind: 'regOne', key: k }, 'failed', { msg: why }).catch(() => {}); } } } catch (e) {}
      log(`📥 공개 확인: ${why} → 결정 대기로 원위치`, 1); return; }
    if (over && left) rows.forEach((r) => { const x = results[r.regItem]; if (!x || x.state !== 'live') results[r.regItem] = { ...(x || {}), state: 'unknown', at: nowIso(), msg: `90분 동안 우리 것과 맞는 상품을 못 찾음(새 상품 ${everNew}개는 보였으나 코드·판매가·등급·수량·이름이 안 맞음) — 샵매니저 상품 조회에서 직접 확인` }; });
    const done = !left || over; await ref.set({ results, status: done ? 'done' : 'verify', ...(done ? { doneAt: nowIso() } : {}), verify: { ...vf, tries: (vf.tries || 0) + 1, lastAt: nowIso(), by: PC_NAME, foundNew: found.length, everNew }, post: hit ? 'need' : v.post || null, uploadedAt: TS() }, { merge: true });
    await regItemsSet(rows, results); if (hit) log(`📥 공개 확인: ${hit}개가 알라딘에 보임 (남은 ${left}개)`);
    if (hit || v.post === 'need') await regPostCollect(ref, rows, results); }
  /* 등록 뒤 나머지 수집: 신규 등록분 수집(상품 목록에 넣음) → 그 상품들 시장 지표를 맡김. 다른 작업 중이면 다음 확인 때 */
  async function regPostCollect(ref, rows, results) { if (running) { await ref.set({ post: 'need' }, { merge: true }).catch(() => {}); return; }
    const had = new Set(((await ref.get()).data() || {}).postKeys || []); const keys = rows.map((r) => results[r.regItem]).filter((x) => x && x.state === 'live' && x.usedCode).map((x) => 'aladin_' + x.usedCode).filter((k) => !had.has(k)); if (!keys.length) { await ref.set({ post: 'done' }, { merge: true }).catch(() => {}); return; }
    await ref.set({ post: 'done', postAt: nowIso(), postKeys: firebase.firestore.FieldValue.arrayUnion(...keys) }, { merge: true }); /* 먼저 적어 두 번 맡기지 않음 */
    await runJob('scanNew'); await C('shp_cmds').add({ type: 'metrics', keys, label: '📥 등록 뒤 시장 지표 (' + keys.length + '개)', status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (등록 뒤 자동)', uploadedAt: TS() }).catch(() => {});
    log(`📥 등록 뒤 나머지 수집: 신규 등록분 수집 끝 → 시장 지표 ${keys.length}개 맡김`); }
  setInterval(() => { regVerifyAll().catch(() => {}); }, 3 * 60000);
  /* ══════════ (1.81.0) 🗑 웹앱에서 지운 등록 상품 → 알라딘에서도 삭제 (shp_cmds regDel) · 🔎 샵매니저에서 지운 최근 상품 → 웹앱에 바로 '삭제' ══════════
   *  정범님 10/18: '시험한 것·관리자가 지운 것이 샵매니저는 물론 웹앱에도 바로' — 매우 심각한 사안
   *  ① regDel {items:[{regItem, listingId, usedCode, title, listingKey}]}: 지금 상태를 샵매니저 목록(최신순)에서 상품 번호로 찾음 → 상품 조회/수정 화면의 판매상태 일괄 변경과 같은 요청으로 '삭제'(17, 공용 상품 파일의 SCM_STATUS)
   *     → 다시 목록을 훑어 어느 상태에도 없을 때만 '지움'으로 · prd_listings(active false · status '삭제') · reg_items(aladinDel) — 실행 문(exec_log)으로 같은 일을 두 번 보내지 않음
   *  ② 10분마다(한 PC·한 탭 — 임대): 최근 14일 등록 상품의 상품 번호가 샵매니저 어느 상태 목록에도 없으면 '삭제'로 (30% 넘게 한꺼번에 사라지면 화면 오류로 보고 안 씀) */
  const REG_ST = { 1: '판매중', 3: '일시판매중지', 15: '판매중지', 41: '판매대기', 18: '판매완료', 16: '판매금지' };
  async function regScanLids(minLid, maxPages) { const seen = new Map(); const ok = {}; const yr = new Date().getFullYear();
    for (const code of Object.keys(REG_ST).map(Number)) { ok[code] = false; for (let pg = 1; pg <= (maxPages || 30); pg++) { const g = await lookDoc(listUrl(code, pg)); if (looksLoggedOut(g.finalUrl, g.doc)) throw new Error('알라딘 로그인이 풀림 — 샵매니저에 로그인해 주세요'); const R = P.parseScmList(g.doc, yr); const L = R.rows || [];
        if (!L.length && pg < (R.lastPage || 1)) throw new Error(`${REG_ST[code]} ${pg}쪽이 비어 있음(오류 화면일 수 있음) — 판단하지 않음`); L.forEach((x) => { if (x.listingId) seen.set(String(x.listingId), { code, usedCode: x.usedCode || null, row: x }); });
        const mn = L.length ? Math.min(...L.map((x) => +x.listingId || Infinity)) : 0; if (!L.length || mn <= minLid || pg >= (R.lastPage || 1)) { ok[code] = true; break; } } }
    return { seen, ok, all: Object.values(ok).every(Boolean) }; }
  async function regMarkDeleted(l, how, extra) { const at = nowIso(); const key = l.listingKey || (l.usedCode ? 'aladin_' + l.usedCode : null) || l.id; const B = [];
    if (key) B.push(C('prd_listings').doc(key).set({ active: false, status: '삭제', deletedAt: at, deletedHow: how, goneFromActiveAt: at, goneEvents: firebase.firestore.FieldValue.arrayUnion(at), ...(extra || {}), ...W() }, { merge: true }).catch((e) => log('상품 목록에 삭제를 못 적음: ' + (e.code || e.message), 1)));
    try { const qs = await C('reg_items').where('result.listingId', '==', String(l.listingId)).get(); qs.docs.forEach((d) => B.push(d.ref.set({ aladinGone: { at, how, listingId: String(l.listingId) }, ...W() }, { merge: true }).catch(() => {}))); } catch (e) {}
    if (l.regItem) B.push(C('reg_items').doc(l.regItem).set({ aladinGone: { at, how, listingId: String(l.listingId) }, ...W() }, { merge: true }).catch(() => {}));
    await Promise.all(B);
    /* (1.89.29) 정범님 10/22 '되돌림: 샵매니저에 있으면 지운 뒤 결정 대기로' — 웹앱이 backPending을 단 등록 줄은 알라딘에서 지운 것이 확인된 지금 결정 대기로 */ if (l.regItem) { try { const rf = C('reg_items').doc(l.regItem); const it0 = (await rf.get()).data() || {}; if (it0.backPending && it0.stage === 'done') await rf.set({ stage: 'pick', cmdId: null, final: null, result: null, autoCmd: null, day: null, movedAt: at, backPending: null, backDone: { at, how, listingId: String(l.listingId), by: PC_NAME }, lookErr: null, history: firebase.firestore.FieldValue.arrayUnion({ at, by: PC_NAME, what: `확정 → 결정 대기 (샵매니저에서 지움 확인 · 상품 번호 ${l.listingId})` }), ...W() }, { merge: true }); } catch (e) { log('되돌림(결정 대기로) 못 함: ' + (e.code || e.message), 1); } } }
  /* (1.84.0) 🗑 상품 찾기 — 샵매니저 상품 조회/수정의 실제 검색(정범님이 쓰던 주소: searchType=2 = ISBN · 3 = 관리 코드 · 1 = 상품명)으로 상태 목록마다 찾아 상품 번호가 같은 줄을 고름
   *  ISBN으로 찾았는데 어느 상태에도 없으면 '없음'(확실) · 상품명으로만 찾은 것은 없어도 '모름'(지웠다고 쓰지 않음) */
  const delSearchUrl = (code, t, kw, pg) => `/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=${t}&keyword=${encodeURIComponent(kw)}&ViewRowsCount=100&page=${pg}&SortOrder=6&itemStockStatus=${code}&categoryId=0`;
  async function delFind(it) { const lid = String(it.listingId); const isbn = String(it.isbn || '').replace(/[^0-9Xx]/g, ''); const t = isbn && /^(\d{9}[\dXx]|\d{13})$/.test(isbn) ? 2 : 1; const kw = t === 2 ? isbn : String(it.title || '').replace(/^\[[^\]]*\]\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').slice(0, 20).trim(); if (!kw) return { found: null, sure: false, why: '찾을 말(ISBN·상품명)이 없음' };
    const yr = new Date().getFullYear(); let complete = true;
    for (const code of Object.keys(REG_ST).map(Number)) { for (let pg = 1; pg <= 5; pg++) { const g = await lookDoc(delSearchUrl(code, t, kw, pg)); if (looksLoggedOut(g.finalUrl, g.doc)) throw new Error('알라딘 로그인이 풀림 — 샵매니저에 로그인해 주세요'); const R = P.parseScmList(g.doc, yr); const L = R.rows || [];
        const hit = L.find((x) => String(x.listingId) === lid); if (hit) return { found: { code, row: hit }, sure: true }; if (!L.length || pg >= (R.lastPage || 1)) break; if (pg === 5) complete = false; } }
    return { found: null, sure: t === 2 && complete, why: t === 2 ? (complete ? 'ISBN으로 모든 상태 목록을 찾아도 없음' : '검색 결과가 너무 많아 끝까지 못 봄') : '상품명으로만 찾음 — 없다고 단정하지 않음' }; }
  async function regDelCmd(ref, v) { ref = regTrailRef(ref, v, true); const mode = v.mode === 'listing' ? 'listing' : 'reg'; const items = (Array.isArray(v.items) ? v.items : []).filter((x) => x && x.listingId).slice(0, 200); const res = { ...(v.results || {}) }; const key = `${ref.id}#${v.tries || 1}`; const kOf = (it) => it.regItem || it.listingKey || it.listingId;
    const gate = await exBegin('regDel', key, { n: items.length, mode }); if (!gate.ok) { await ref.set({ status: 'fail', msg: '같은 삭제를 이미 시작했던 일 — 알라딘 상품 조회에서 확인 (' + (gate.why || '') + ')', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); return; }
    let st = 'failed', why = null; LOOK_PRIO++; const sentL = [];
    try { if (!items.length) throw new Error('지울 상품 번호가 없음'); if (mode === 'reg' && items.some((x) => !x.regItem)) throw new Error('등록 줄 번호 없이 맡긴 삭제 — 하지 않음'); if (mode === 'listing' && items.some((x) => !x.usedCode)) throw new Error('U코드 없이 맡긴 상품 삭제 — 하지 않음');
      /* 🛡 상품이 곧 생명 — 지우기 직전 대조(하나라도 어긋나면 지우지 않고 '거절'):
       *  등록 삭제(reg): ① 등록 때 공개 확인이 이 상품 번호를 이 등록 줄에 짝지은 기록(reg_claims) ② 상품 번호 > 그 등록을 시작하기 전 번호 ③ 샵매니저 줄의 U코드·관리 코드·등록일(확정한 날 이후)
       *  상품 삭제(listing — 수동 일괄 처리에서 고른 상품): 샵매니저 줄의 상품 번호·U코드가 고른 상품과 같고, 관리 코드 앞부분·판매가(고를 때 값과 다르면 거절 — 그사이 바뀐 상품)가 같음 */
      const refuse = (it, w) => { res[kOf(it)] = { state: 'refused', at: nowIso(), msg: '지우지 않음 — ' + w, listingId: String(it.listingId) }; };
      const cmdBase = {}; const okItems = [];
      if (mode === 'reg') for (const it of items) { const lid = String(it.listingId); let cl = null; try { const d = await C('reg_claims').doc(lid).get(); cl = d.exists ? d.data() : null; } catch (e) {}
          if (!cl || cl.regItem !== it.regItem || (it.cmdId && cl.cmd && cl.cmd !== it.cmdId)) { refuse(it, `등록 때 이 상품 번호(${lid})를 이 등록 줄에 짝지은 기록이 없음 — 예전에 등록한 다른 상품일 수 있음`); continue; }
          if (it.cmdId) { if (!(it.cmdId in cmdBase)) { try { const cd = (await C('shp_cmds').doc(it.cmdId).get()).data() || {}; cmdBase[it.cmdId] = +((cd.verify || {}).base || cd.base || 0); } catch (e) { cmdBase[it.cmdId] = 0; } } const b = cmdBase[it.cmdId]; if (b && !(+lid > b)) { refuse(it, `상품 번호 ${lid}가 이 등록을 시작하기 전 번호(${b})보다 작음 — 이전 상품`); continue; } }
          okItems.push(it); }
      else okItems.push(...items);
      const by = new Map(); let k0 = 0;
      for (const it of okItems) { k0++; { /* (1.89.5) ⏸·⏹ 웹앱 요청(정범님 10/20) — 찾는 단계는 아직 알라딘에 아무것도 안 보냈으므로 다음 상품 전에 멈춤 · 다시 시작하면 처음부터 다시 찾음(읽기만) */ const cur = ((await ref.get().catch(() => null)) || { data: () => ({}) }).data() || {}; if (cur.pauseReq || cur.stopReq) { const stop = !!cur.stopReq; await ref.set({ status: stop ? 'cancelled' : 'paused', step: 1, msg: `${stop ? '⏹ 중단' : '⏸ 일시정지'} — ${k0 - 1}/${okItems.length} 찾은 뒤 멈춤 · 알라딘에는 아무것도 보내지 않음`, results: res, pauseReq: null, stopReq: null, claim: null, ...(stop ? { doneAt: nowIso() } : { pausedAt: nowIso() }), uploadedAt: TS() }, { merge: true }); st = 'cancelled'; why = stop ? '중단' : '일시정지'; log(`🗑 알라딘 삭제 ${why} (웹앱 요청 · ${k0 - 1}/${okItems.length} 찾음 · 보낸 것 없음)`); return; } }
        await ref.set({ step: 1, msg: `${k0}/${okItems.length} '${String(it.title || it.usedCode || '').slice(0, 24)}' 샵매니저에서 찾는 중`, results: res }, { merge: true });
        const F = await delFind(it); const s = F.found;
        if (!s) { if (F.sure) { res[kOf(it)] = { state: 'gone', at: nowIso(), msg: '이미 샵매니저 어느 목록에도 없음 — ' + F.why, listingId: String(it.listingId) }; await regMarkDeleted(it, '이미 샵매니저에 없음(웹앱 삭제 때 확인)'); } else res[kOf(it)] = { state: 'unknown', at: nowIso(), msg: '샵매니저에서 찾지 못함 — ' + F.why + ' · 지우지 않음', listingId: String(it.listingId) }; continue; }
        const r = s.row; const base = String(it.code || it.sku || '').split('_')[0]; const w = [];
        if (it.usedCode && r.usedCode && String(r.usedCode) !== String(it.usedCode)) w.push(`U코드 ${r.usedCode} ≠ ${it.usedCode}`); if (mode === 'listing' && !r.usedCode) w.push('샵매니저 줄에 U코드가 없음');
        if (base && r.sku && String(r.sku).split('_')[0] !== base) w.push(`관리 코드 ${r.sku} ≠ ${it.code || it.sku}`);
        if (mode === 'reg' && it.confDay && r.registeredAt && !r.registeredYearGuessed && String(r.registeredAt).slice(0, 10) < String(it.confDay)) w.push(`샵매니저 등록일 ${String(r.registeredAt).slice(0, 10)}이 확정한 날 ${it.confDay}보다 앞`);
        if (mode === 'listing' && it.price != null && r.price != null && +r.price !== +it.price) w.push(`판매가가 고를 때(${it.price})와 다름(${r.price}) — 그사이 바뀐 상품`);
        if (s.code === 18) w.push('판매완료 상품 — 주문 기록 때문에 지우지 않음');
        if (w.length) { refuse(it, '샵매니저 줄이 고른 상품과 다름: ' + w.join(' · ')); continue; }
        it._before = REG_ST[s.code]; (by.get(s.code) || by.set(s.code, []).get(s.code)).push(it); }
      for (const [code, L] of by) { await ref.set({ step: 2, msg: `${REG_ST[code]} ${L.length}개 → 삭제 요청`, results: res }, { merge: true }); await PACE_P.wait(sleep);
        const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(code), stockStatusToDo: '17', items: L.map((x) => String(x.listingId)).join(',') });
        const rr = await fetch('https://www.aladin.co.kr/scm/wrecord_edit_usedbatch.aspx', { method: 'POST', body: fd, credentials: 'include' }); const txt = await rr.text(); const al = (txt.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || '';
        L.forEach((x) => { res[kOf(x)] = { state: 'sent', at: nowIso(), msg: `삭제 요청 HTTP ${rr.status}${al ? ' · ' + al : ''}`, listingId: String(x.listingId), before: x._before }; sentL.push(x); }); if (!rr.ok || /실패|오류|error/i.test(al)) throw new Error('알라딘이 삭제를 거절: ' + (al || 'HTTP ' + rr.status)); await sleep(1500); }
      let nOk = 0, nBad = 0, k1 = 0; for (const [, L] of by) for (const it of L) { k1++; await ref.set({ step: 3, msg: `${k1}/${sentL.length} 다시 찾아 정말 지워졌는지 확인`, results: res }, { merge: true }); const F2 = await delFind(it);
        if (!F2.found && F2.sure) { res[kOf(it)] = { state: 'deleted', at: nowIso(), msg: '알라딘에서 지움 (ISBN으로 모든 상태 목록에 없음 확인)', listingId: String(it.listingId), before: it._before }; await regMarkDeleted(it, `웹앱에서 지움 → 알라딘 삭제 (${PC_NAME})`, { deletedBy: v.by || null, deletedCmd: ref.id, deletedFrom: it._before || null }); await delChangeLog(it, ref.id, v, 'deleted'); nOk++; }
        else if (!F2.found) { res[kOf(it)] = { state: 'sent', at: nowIso(), msg: '삭제 요청은 됨 — 상품명으로만 찾을 수 있어 사라졌는지 확인 못 함(샵매니저에서 확인)', listingId: String(it.listingId), before: it._before }; nBad++; }
        else { res[kOf(it)] = { state: 'fail', at: nowIso(), msg: `아직 ${REG_ST[F2.found.code]} 목록에 있음 — 알라딘이 지우지 않음`, listingId: String(it.listingId) }; nBad++; } }
      const nRef = Object.values(res).filter((x) => x.state === 'refused').length; const nUnk = Object.values(res).filter((x) => x.state === 'unknown').length; st = nBad || nRef || nUnk ? 'failed' : 'done'; why = `지움 ${nOk} · 못 지움·확인 못 함 ${nBad} · 거절 ${nRef} · 못 찾음 ${nUnk}`;
      await ref.set({ status: nBad || nRef || nUnk ? 'fail' : 'done', step: 4, msg: `알라딘에서 지움 ${nOk}개${nBad ? ` · 못 지움·확인 못 함 ${nBad}개` : ''}${nRef ? ` · 🛡 고른 상품과 달라 지우지 않음 ${nRef}개` : ''}${nUnk ? ` · 샵매니저에서 못 찾음 ${nUnk}개` : ''}${Object.values(res).filter((x) => x.state === 'gone').length ? ` · 이미 없던 것 ${Object.values(res).filter((x) => x.state === 'gone').length}개` : ''}`, results: res, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true });
      await delItemsSync(ref.id, v, res); log(`🗑 웹앱 삭제 → 알라딘: ${why}`, nBad || nRef ? 1 : 0); }
    catch (e) { why = e.message; const sent = Object.values(res).some((x) => x.state === 'sent'); await ref.set({ status: sent ? 'delcheck' : 'fail', msg: (sent ? '삭제 요청 뒤 오류 — 10분마다 다시 찾아 지워졌는지 확인함: ' : '') + e.message, results: res, doneAt: sent ? null : nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }).catch(() => {}); await delItemsSync(ref.id, v, res); log('🗑 알라딘 삭제 멈춤: ' + e.message, 1); }
    finally { LOOK_PRIO--; await exEnd('regDel', key, st, why); } }
  /* (1.89.30) 정범님 10/22 '애매함 없게': 삭제 결과를 등록 줄(reg_items.aladinDel)에도 상품마다 — 맡긴 일이 7일 보는 기간을 지나도 웹앱이 끝·못 함·까닭을 그대로 보임 */
  async function delItemsSync(cmdId, v, res) { try { const b = db.batch(); let n = 0; for (const it of v.items || []) { if (!it.regItem) continue; const r = res[it.regItem] || res[it.listingKey] || res[it.listingId]; if (!r) continue; b.set(C('reg_items').doc(it.regItem), { aladinDel: { cmd: cmdId, state: r.state, msg: r.msg || null, listingId: String(it.listingId || ''), at: nowIso() }, ...W() }, { merge: true }); n++; } if (n) await b.commit(); } catch (e) { log('삭제 결과를 등록 줄에 못 적음: ' + (e.code || e.message), 1); } }
  /* 삭제가 남긴 상품 변경 이력(prd_listing_changes) — 지우지 않음 · 언제·누가·어느 맡긴 일·어느 PC·지우기 전 상태 */
  async function delChangeLog(it, cmd, v, what) { const key = it.listingKey || (it.usedCode ? 'aladin_' + it.usedCode : null); if (!key) return; try { await C('prd_listing_changes').add({ listingKey: key, at: nowIso(), source: 'delete', field: 'status', from: it._before || null, to: '삭제', what, by: v.by || null, pc: PC_NAME, cmd, why: v.why || null, mode: v.mode || 'reg', ...W() }); } catch (e) { log('삭제 이력을 못 적음: ' + (e.code || e.message), 1); } }
  /* 삭제 요청 뒤 확인을 못 끝낸 일(delcheck) — 10분마다 다시 찾아 결과를 매듭 */
  async function delCheckSweep() { let qs; try { qs = await C('shp_cmds').where('status', '==', 'delcheck').get(); } catch (e) { return; } for (const d of qs.docs) { const v = d.data() || {}; if (v.type !== 'regDel' || !(await regLease(d.ref).catch(() => false))) continue; const res = { ...(v.results || {}) }; let left = 0;
      for (const it of v.items || []) { const k = it.regItem || it.listingKey || it.listingId; const r0 = res[k] || {}; if (r0.state !== 'sent') continue; try { const F = await delFind(it); if (!F.found && F.sure) { res[k] = { ...r0, state: 'deleted', at: nowIso(), msg: '알라딘에서 지움 (다시 찾아 확인)' }; await regMarkDeleted(it, `웹앱에서 지움 → 알라딘 삭제 (${PC_NAME} 확인)`, { deletedBy: v.by || null, deletedCmd: d.id, deletedFrom: r0.before || null }); await delChangeLog({ ...it, _before: r0.before }, d.id, v, 'deleted'); } else if (F.found) { res[k] = { ...r0, state: 'fail', at: nowIso(), msg: `아직 ${REG_ST[F.found.code]} 목록에 있음 — 알라딘이 지우지 않음` }; } else left++; } catch (e) { left++; } }
      const checks = (+v.checks || 0) + 1; if (left && checks >= 12) { for (const k of Object.keys(res)) if (res[k].state === 'sent') res[k] = { ...res[k], state: 'unknownDel', at: nowIso(), msg: '삭제 요청 뒤 2시간 동안 사라졌는지 확인 못 함(상품명으로만 찾을 수 있음) — 샵매니저 상품 조회에서 직접 확인' }; left = 0; } /* (1.89.30) 끝없이 10분마다 다시 보던 것 — 12번(2시간)에서 매듭 */
      const bad = Object.values(res).some((x) => ['fail', 'refused', 'unknown', 'unknownDel'].includes(x.state)); await d.ref.set({ results: res, checks, status: left ? 'delcheck' : bad ? 'fail' : 'done', ...(left ? {} : { doneAt: nowIso() }), msg: left ? `아직 확인 못 한 것 ${left}개 — 10분 뒤 다시 (${checks}/12번째)` : bad ? '다시 찾아 확인 끝 — 못 지움·확인 못 함이 있음(상품 줄에 까닭)' : '다시 찾아 확인 끝', uploadedAt: TS() }, { merge: true }).catch(() => {}); await delItemsSync(d.id, v, res); } }
  let regGoneAt = 0;
  async function regGoneSweep(force) { if (PUBONLY || !auth.currentUser || (!force && Date.now() - regGoneAt < 10 * 60000)) return; regGoneAt = Date.now(); const ref = C('prd_system').doc('reg_gone'); if (!(await regLease(ref).catch(() => false))) return; if (!force) { const d0 = (await ref.get().catch(() => null)); const la = d0 && d0.exists ? Date.parse((d0.data() || {}).lastAt || 0) : 0; if (Date.now() - la < 9 * 60000) return; } /* PC 여러 대가 겹쳐 훑지 않게 */
    const since = new Date(Date.now() + 9 * 3600e3 - 14 * 864e5).toISOString().slice(0, 10); const qs = await C('prd_listings').where('registeredAt', '>=', since).get(); const rec = qs.docs.map((d) => ({ id: d.id, listingKey: d.id, ...d.data() })).filter((l) => l.listingId && l.active !== false && l.status !== '삭제');
    if (!rec.length) return; const minLid = Math.min(...rec.map((l) => +l.listingId)) - 1; const A = await regScanLids(minLid, 30); if (!A.all) { log('🔎 최근 등록 상품 확인: 샵매니저 목록을 끝까지 못 훑음 — 이번엔 판단하지 않음', 1); return; }
    if (!A.seen.size) return; const gone = rec.filter((l) => !A.seen.has(String(l.listingId)));
    await ref.set({ lastAt: nowIso(), by: PC_NAME, n: rec.length, gone: gone.length, ...W() }, { merge: true }).catch(() => {});
    if (!gone.length) return; if (gone.length > Math.max(10, rec.length * 0.3)) { log(`🔎 최근 등록 ${rec.length}개 중 ${gone.length}개가 샵매니저 목록에 없음 — 너무 많아 화면 오류일 수 있어 '삭제'로 쓰지 않음`, 1); return; }
    for (const l of gone) { await regMarkDeleted(l, '샵매니저 목록에 없음 — 샵매니저에서 지운 상품 (10분마다 확인)', { deletedFrom: l.status || null }); await delChangeLog({ ...l, listingKey: l.id, _before: l.status || null }, null, { by: null, why: '샵매니저 모든 상태 목록에 없음(최근 14일 등록 확인)', mode: 'sweep' }, 'gone'); }
    log(`🔎 샵매니저에서 지운 최근 등록 상품 ${gone.length}개를 웹앱 상품 목록에 '삭제'로: ${gone.slice(0, 5).map((l) => l.title || l.usedCode).join(', ')}${gone.length > 5 ? ' …' : ''}`, 1); }
  setInterval(() => { if (!regVerBusy && !(window.__rnRest && window.__rnRest())) regGoneSweep().catch((e) => log('최근 등록 상품 확인 실패: ' + (e.code || e.message), 1)); }, 2 * 60000);
  setInterval(() => { if (!PUBONLY && auth.currentUser && !(window.__rnRest && window.__rnRest())) delCheckSweep().catch(() => {}); }, 10 * 60000);
  setTimeout(() => regGoneSweep(true).catch(() => {}), 90000);
  /* (1.35.0) 알라딘 매입 — 웹앱 '알라딘 매입' 화면이 맡긴 '팔기 장바구니에 담기' (shp_cmds type 'c2bAdd' · items [{usedCode, isbn13, title, grade, ...}])
     책마다: ① 팔기 장바구니(wc2b_sales.aspx)에 이미 있으면 'already'
             ② 매입가 조회 화면(wc2b_search.aspx?KeyWord=ISBN)을 이 일 전용 숨은 창에 열어 그 책 줄을 찾음(ISBN13으로) — 없으면 'notFound', '팔기 장바구니에 추가' 단추가 없으면 'notBuyable'
             ③ 그 줄의 '팔기 장바구니에 추가'를 누름 = 알라딘 화면의 단추 그대로(주소를 짐작해 따로 보내지 않음). 뜨는 알림·확인 창은 글만 받아 적고 닫음(확인 창은 '아니오' — 장바구니 화면으로 넘어가지 않음)
             ④ 장바구니를 다시 읽어 들어갔는지 확인 → 'added', 아니면 'failed'(알림 글을 함께)
     결과는 그 일 문서(results · n)와 prd_system/buyback(cart.관리번호)에 — 웹앱 화면이 바로 보여 줌. 장바구니까지만: 매입 신청(판매 확정)은 하지 않음.
     요청 간격은 이 PC의 알라딘 요청 속도 조절(PACE)을 같이 씀 */
  const C2B_SEARCH = (isbn) => `https://www.aladin.co.kr/shop/usedshop/wc2b_search.aspx?ActionType=1&SearchTarget=All&KeyWord=${encodeURIComponent(isbn)}`;
  const C2B_CART = 'https://www.aladin.co.kr/shop/usedshop/wc2b_sales.aspx?search=1';
  async function c2bCartRead() { await PACE.wait(); const g = await lookDoc(C2B_CART); if (looksLoggedOut(g.finalUrl, g.doc)) throw new Error('알라딘 로그인이 풀림 — 로그인한 뒤 웹앱에서 다시 담기');
    const list = P.parseC2BCart(g.doc); const set = new Set(); list.forEach((x) => { if (x.isbn13) set.add(x.isbn13); }); return { list, set }; }
  function c2bFrame(url) { return new Promise((resolve) => { let f = globalThis.__rnById('rn-c2b-frame'); if (f) { try { f.src = 'about:blank'; } catch (e) {} f.remove(); }
    f = document.createElement('iframe'); f.id = 'rn-c2b-frame'; f.style.cssText = 'position:fixed;left:-3000px;top:0;width:1300px;height:2000px;visibility:hidden'; document.body.appendChild(f);
    const t0 = Date.now(); let done = false; let iv = null; const fin = (ok) => { if (done) return; done = true; clearInterval(iv); let d = null; try { d = f.contentDocument; } catch (e) {} resolve({ ok, f, doc: d }); };
    f.src = url; iv = setInterval(() => { let d = null; try { d = f.contentDocument; } catch (e) {} if (d && d.URL !== 'about:blank' && d.readyState === 'complete' && (d.querySelector('#searchResult') || Date.now() - t0 > 8000)) fin(true); else if (Date.now() - t0 > 45000) fin(false); }, 400); }); }
  async function c2bAddOne(it, cartSet) { const isbn = String(it.isbn13 || ''); if (!/^97[89]\d{10}$/.test(isbn)) return { state: 'failed', msg: 'ISBN13이 없음' };
    if (cartSet.has(isbn)) return { state: 'already', msg: '이미 팔기 장바구니에 있음' };
    await PACE.wait(); const fr = await c2bFrame(C2B_SEARCH(isbn)); const d = fr.doc; if (!fr.ok || !d) return { state: 'failed', msg: '매입가 조회 화면을 못 엶(시간 초과)' };
    if (looksLoggedOut(d.URL, d)) return { state: 'failed', msg: '알라딘 로그인이 풀림' };
    const rows = P.parseC2BSearch(d); const i10 = (() => { if (!/^978/.test(isbn)) return null; const b = isbn.slice(3, 12); let t = 0; for (let k = 0; k < 9; k++) t += (+b[k]) * (10 - k); const c = (11 - (t % 11)) % 11; return b + (c === 10 ? 'X' : String(c)); })(); const row = rows.find((r) => r.isbn13 === isbn) || rows.find((r) => !r.isbn13 && i10 && String(r.isbn10 || '').toUpperCase() === i10) || null; /* (1.59.0) ISBN13이 없는 줄은 ISBN10이 맞을 때만 — 결과가 한 줄이라고 맞춰 보지 않고 담지 않음 */
    if (!row) return { state: 'notFound', msg: rows.length ? `검색 결과 ${rows.length}줄 중 이 ISBN이 없음` : '매입가 조회 결과 없음' };
    const c2b = { price: row.price || null, title: row.title || null, isbn10: row.isbn10 || null };
    if (!row.canSell) return { state: 'notBuyable', msg: row.note || '알라딘이 사지 않는 책', c2b };
    const chk = [...d.querySelectorAll('#searchResult input.chk[isbn]')].find((x) => x.getAttribute('isbn') === row.isbn10) || null; const tr = chk ? chk.closest('tr') : null;
    const btn = (tr && tr.querySelector('.c2b_add')) || d.querySelector(`.c2b_add[isbn="${row.isbn10}"]`); if (!btn) return { state: 'notBuyable', msg: '추가 단추를 못 찾음', c2b };
    const msgs = []; const w = fr.f.contentWindow; try { w.alert = (m) => { msgs.push(String(m || '')); }; w.confirm = (m) => { msgs.push(String(m || '')); return false; }; w.open = () => null; } catch (e) {}
    const q0 = (d.querySelector('.ItemQtySum') || {}).textContent || ''; (btn.querySelector('a') || btn).click();
    const t0 = Date.now(); while (Date.now() - t0 < 8000) { await sleep(400); let q1 = ''; try { q1 = (fr.f.contentDocument.querySelector('.ItemQtySum') || {}).textContent || ''; } catch (e) {} if (msgs.length || (q1 && q1 !== q0)) break; }
    await sleep(1200); let after = null; try { after = await c2bCartRead(); } catch (e) { return { state: 'failed', msg: '담은 뒤 장바구니를 못 읽음: ' + e.message + (msgs.length ? ' · 알림: ' + msgs.join(' / ').slice(0, 200) : ''), c2b }; }
    after.set.forEach((x) => cartSet.add(x)); const msg = msgs.join(' / ').slice(0, 300) || null;
    return after.set.has(isbn) ? { state: 'added', msg, c2b, cartN: after.list.length } : { state: 'failed', msg: msg || '단추를 눌렀지만 장바구니에 없음', c2b, cartN: after.list.length }; }
  async function c2bAddCmd(ref, v) { const items = v.items || []; const results = {}; let n = 0; log(`알라딘 매입: 팔기 장바구니에 ${items.length}권 담기 (웹앱에서 맡김)`);
    const bbSet = (code, r) => C('prd_system').doc('buyback').set({ cart: { [code]: r } }, { merge: true }).catch(() => {});
    let cart = null; try { cart = await c2bCartRead(); } catch (e) { for (const it of items) { results[it.usedCode] = { state: 'failed', at: nowIso(), msg: e.message, by: PC_NAME }; await bbSet(it.usedCode, results[it.usedCode]); } await ref.set({ status: 'done', results, n: items.length, doneAt: nowIso(), err: e.message, uploadedAt: TS() }, { merge: true }); log('알라딘 매입: ' + e.message, 1); return; }
    let cartN = cart.list.length;
    for (const it of items) { let r; const xk = `${ref.id}:${it.usedCode}`; const gate = await exBegin('c2bAdd', xk, { usedCode: it.usedCode, isbn13: it.isbn13 || null });
      if (!gate.ok) r = { state: gate.state === 'done' ? 'already' : 'failed', msg: '실행 문: ' + gate.why };
      else { try { r = await c2bAddOne(it, cart.set); } catch (e) { r = { state: 'failed', msg: e.message }; } await exEnd('c2bAdd', xk, ['added', 'already'].includes(r.state) ? 'done' : 'failed', `${r.state}${r.msg ? ' · ' + r.msg : ''}`); }
      if (r.cartN != null) cartN = r.cartN; delete r.cartN; r = { ...r, at: nowIso(), by: PC_NAME, isbn13: it.isbn13 || null }; results[it.usedCode] = r; n++;
      await bbSet(it.usedCode, r); await ref.set({ results, n, cartN, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); }
    try { const f = globalThis.__rnById('rn-c2b-frame'); if (f) { f.src = 'about:blank'; f.remove(); } } catch (e) {}
    const ok = Object.values(results).filter((r) => ['added', 'already'].includes(r.state)).length; await ref.set({ status: 'done', results, n, cartN, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
    log(`알라딘 매입: 장바구니 ${ok} / ${items.length}권 (지금 장바구니 ${cartN}권)`, ok === items.length ? 0 : 1); }
  { let invUn = null, back = 5000; const sub = () => { if (PUBONLY || !auth.currentUser || invUn) return; /* (1.64.0) 송장 = 로그인 일 */ invUn = C('shp_invoices').where('status', '==', 'queued').onSnapshot((ss) => { back = 5000; ss.forEach((d) => claimInvoice(d.id).catch((e) => log('송장 입력 맡기 실패: ' + (e.code || e.message), 1))); }, (e) => { log(`송장 듣기가 끊김(${e.code || e.message}) — 다시 들음`, 1); invUn = null; setTimeout(sub, back); back = Math.min(back * 2, 5 * 60000); }); }; auth.onAuthStateChanged((u) => { if (!u) { if (invUn) { invUn(); invUn = null; } return; } sub(); }); } /* (1.59.0) 끊기면 다시 붙음 · 다시 로그인해도 하나만 */
  async function claimInvoice(id) { const ref = C('shp_invoices').doc(id); let ok = false; if ((window.__rnRest && window.__rnRest())) return;
    await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const sn = await tx.get(ref); const v = sn.data(); if (!v || v.status !== 'queued') return; tx.update(ref, { status: 'running', claim: { pc: PC_NAME, tab: TAB_ID, at: nowIso() }, uploadedAt: TS() }); ok = true; });
    if (!ok) return; GM_setValue('rn-inv-active', { id, at: Date.now() }); log(`송장 입력 맡음 (${id}) — 발송 요청 화면을 새 탭으로 엽니다`);
    GM_openInTab('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4#rninv=' + id, { active: false, insert: true }); } // #rninv= : 이 탭이 송장 입력을 맡은 탭 (다른 발송 요청 탭은 끼어들지 않음)
  // 영업일(월~금) 9~16시: 쉬는 동안 shipAutoMin분마다 발송 요청 다시 읽기
  /* (1.68.0) 🔔 출고 알림 — 클라우드가 출고 시각에 출고별 매출을 확정하고 app_settings/ship_notify.last를 쓰면, 웹앱 설정 ⑫ 'PC 화면 앞으로'에 고른 PC가
   * 웹앱 '오늘 출고 ② 발송 요청'을 새 탭 맨 앞으로 열고 데스크톱 알림. 한 번만(GM rn-shipopen = last.at — 이 PC의 여러 알라딘 탭이 겹쳐도 하나만) · 1시간 넘게 지난 알림은 열지 않음 */
  auth.onAuthStateChanged((u) => { if (!u || window.__rnShipOpenUn) return; window.__rnShipOpenUn = C('app_settings').doc('ship_notify').onSnapshot((d) => { try {
    const L = d.exists && d.data().last; if (!L || !L.at || !(L.pcOpen || []).includes(PC_NAME)) return; if (Date.now() - Date.parse(L.at) > 3600e3) return; if (GM_getValue('rn-shipopen', '') === L.at) return; GM_setValue('rn-shipopen', L.at);
    GM_openInTab('https://jerrycson.github.io/readnow-scripts/app/?go=deliv', { active: true, insert: true, setParent: true }); try { GM_notification({ title: L.title || '📦 오늘 출고', text: L.body || '', timeout: 0 }); } catch (e) {} log(`🔔 출고 알림 — 웹앱 발송 요청 탭을 앞으로 엶 (${L.n || 0}건)`); } catch (e) {} }, () => {}); });
  let cloudBeat = null; auth.onAuthStateChanged((u) => { if (u) C('app_settings').doc('cloud').onSnapshot((d) => { cloudBeat = d.exists ? d.data() : null; }, () => {}); });
  const cloudOn = () => !!(cloudBeat && cloudBeat.at && Date.now() - Date.parse(cloudBeat.at) < 10 * 60000 && cloudBeat.ok !== false && !(cloudBeat.jobs && cloudBeat.jobs.ship === false)); // 클라우드 수집이 살아 있고 발송 요청 읽기를 켜 둠 (10분 안 신호 · 1.61.0: ☁ 설정에서 '발송 요청 읽기'를 끄면 PC 칸이 다시 맡음)
  /* (1.60.1) 발송 요청 읽기를 평일 9~16시 15분마다 스스로 하던 것(클라우드가 꺼졌을 때) → ⏰ 매일 자동 수집의 칸에서만 (클라우드가 살아 있으면 그 칸은 저절로 건너뜀) */

  async function photosJob() {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      await loadListings();
      let prog = await loadProgress('photos');
      if (!prog || !prog.list) {
        const B = new Map(); (await C('prd_books').get()).forEach((d) => { const v = d.data(); B.set(d.id, !!(v.images && v.images.front && (v.images.front.src || v.images.front.stored))); });
        const retry = new Date(Date.now() - 14 * 864e5).toISOString();
        const list = [...LISTINGS.entries()].filter(([, l]) => l.listingId && l.usedCode && (!l.bookId || !B.get(l.bookId)) && (FORCE_ALL || !(l.photosAt && (l.photosStatus === 'done' || l.photosAt > retry))))
          .sort((a, b) => (b[1].active ? 1 : 0) - (a[1].active ? 1 : 0)).map(([k]) => k);
        prog = { list, i: 0, ok: 0, none: 0, nopage: 0, imgs: 0, startedAt: nowIso() }; await saveProgress('photos', prog);
        log(`우리 상품 사진: 표지 사진이 없는 상품 ${list.length.toLocaleString()}개 (판매 중 먼저)`);
      }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('photos', prog); throw new Error('멈춤'); }
        const l = LISTINGS.get(prog.list[prog.i]); if (!l) continue; const at = nowIso();
        let ph = [], status = 'none';
        try { const g = await getDoc(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${l.listingId}`); const can = (g.doc.querySelector('link[rel="canonical"]') || {}).href || '';
          if (!new RegExp(`ItemId=${l.listingId}\\b`).test(can) && !/\[중고\]/.test(g.doc.title || '')) status = 'nopage'; else ph = P.parseUsedItemPhotos(g.doc); }
        catch (e) { status = 'nopage'; }
        let match = null;
        if (!ph.length && l.title) { // ③ 상품명 검색: 검색어(상품명)가 이름에 90% 이상 들어 있는 상품 — 같은 비율이면 우리 가게(996008) 상품, 그다음 검색 순서
          try { const q = String(l.title).replace(/^\[중고\]\s*/, '').replace(/\((최상|상|중|하)[^)]*\)\s*$/, '').trim(); const sr = await getDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${encodeURIComponent(q)}`);
            const th = SET.photoMatch ?? 0.9; const cands = P.parseSearchResults(sr.doc).filter((r) => r.itemId !== String(l.listingId)).map((r, i) => ({ ...r, cov: P.nameCoverage(q, r.title), ours: /scm996008/.test(r.img), i })).filter((r) => r.cov >= th).sort((a, b) => b.cov - a.cov || (b.ours ? 1 : 0) - (a.ours ? 1 : 0) || a.i - b.i);
            for (const c of cands) { try { const g2 = await getDoc(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${c.itemId}`); ph = P.parseUsedItemPhotos(g2.doc); } catch (e) { ph = []; }
              if (!ph.length && c.img) ph = [{ src: c.img, big: c.img.replace(/\/(coversum|cover150|cover200|cover|cover300)\//, '/cover500/'), where: 'search', file: c.img.split('/').pop() }];
              if (ph.length) { match = { itemId: c.itemId, title: c.title, coverage: Math.round(c.cov * 1000) / 1000, ours: c.ours, query: q, candidates: cands.length }; break; } }
            if (!match) log(`${l.title}: 상품명 검색에서 이름이 ${Math.round(th * 100)}% 이상 같은 상품의 사진이 없어 건너뜀 (후보 ${cands.length}개)`); } catch (e) { log(`${l.title}: 상품명 검색 실패 (${e.message})`, 1); } }
        const saved = [];
        for (let k = 0; k < ph.length; k++) { const x = ph[k]; let blob = null, used = null;
          for (const u of [x.big, x.src].filter(Boolean)) { try { blob = await gmBlob(u); used = u; break; } catch (e) {} }
          if (!blob) { saved.push({ src: x.src, where: x.where, stored: null, error: '받기 실패' }); continue; }
          const ext = (used.match(/\.(jpe?g|png|gif|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase(); const base = `img/listing/${l.usedCode}/${k + 1}`; const meta = { cacheControl: 'public,max-age=31536000,immutable' };
          try { await storage.ref(`${base}.${ext}`).put(blob, { ...meta, contentType: blob.type || 'image/' + ext }); let t = null; try { t = await thumb(blob, 200); if (t) await storage.ref(`${base}_t.webp`).put(t, { ...meta, contentType: 'image/webp' }); } catch (e) { t = null; } // 작은 사진 실패는 원본 저장에 영향 없음
            saved.push({ src: used, where: x.where, file: x.file, stored: `${base}.${ext}`, thumb: t ? `${base}_t.webp` : null, bytes: blob.size ?? null }); prog.imgs++; } catch (e) { saved.push({ src: used, where: x.where, stored: null, error: e.message }); } }
        if (saved.some((x) => x.stored)) { status = 'done'; prog.ok++; } else if (status === 'nopage') prog.nopage++; else prog.none++;
        await C('prd_listings').doc(prog.list[prog.i]).set({ photos: saved, photosAt: at, photosStatus: status, photosFrom: match ? 'search' : saved.length ? 'mine' : null, ...(match ? { photosMatch: match } : {}), ...W() }, { merge: true });
        l.photosAt = at; l.photosStatus = status;
        ui('우리 상품 사진', prog.i + 1, prog.list.length, `${l.title || l.usedCode} · 사진 ${saved.filter((x) => x.stored).length}장 · 받은 상품 ${prog.ok} · 사진 없음 ${prog.none} · 페이지 없음 ${prog.nopage}`);
        if (prog.i % 5 === 0) await saveProgress('photos', prog);
      }
      await finishJob('photos', { ok: prog.ok, none: prog.none, nopage: prog.nopage, imgs: prog.imgs });
      log(`상품 사진 완료: ${prog.ok}개 상품 사진 ${prog.imgs}장 (우리 페이지 또는 상품명 검색 90%↑) · 끝내 사진 없음 ${prog.none + prog.nopage} (건너뜀 — 외부 정보로 개선 예정)`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 검색 시세: 알라딘 미등록·세트·새상품 페이지 없는 상품 (1.37.0 — 예전 '새상품 없는 상품 시세') ─────────
   * 왜: 미등록 상품(정보를 직접 써서 등록 — 번호 칸이 ISBN이 아닌 상품코드)·세트 상품은 '전체 중고' 상세에 다른 판매자가 붙지 않아 단독처럼 보이지만,
   *     같은 책을 다른 판매자들이 각자 따로 등록해 둠 → 바깥 검색 화면(SearchTarget=Used)에 따로따로 나오고, 그 화면에서 바로 가격(판매자 중고 최저가)이 보임
   * 대상: 판매 중 + (미등록 · 세트(파서 setInfo) · 도서 정보 없음). 검색어 = 파서 searchQueryOf(앞 [..]·'/' 뒤·끝 (..) 뗌)
   * 같은 상품 = 이름 일치(설정 photoMatch, 기본 90%) + 권 번호 같음(sameVolume — '한국사론 1' ≠ '한국사론 10'). 우리 가게 상품(사진 주소 scm996008)은 경쟁에서 뺌(우리끼리 경쟁 안 함)
   * 저장: prd_market_nobook/{상품} — src 'usedSearch' · rows(상품마다 번호·이름·일치·우리 여부·판매자/알라딘/매장 최저가·개수) · 시세(marketNoBook) · 후보가 바뀔 때만 판(v)을 통째로 보관 · 시세가 바뀔 때만 history
   *       기본 7일에 한 번 다시 봄 (설정 nbDays) — 웹앱 시장 블록·관찰 도구·수동 일괄 처리가 이 rows로 '첫 페이지' 대신 비교 */
  async function nbMarketJob() {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      await loadListings();
      let prog = await loadProgress('nbMarket');
      if (!prog || !prog.list) {
        const have = new Map(); (await C('prd_market_nobook').get()).forEach((d) => have.set(d.id, d.data().at || ''));
        const cut = FORCE_ALL ? '9999' : new Date(Date.now() - Math.max(1, SET.nbDays || 7) * 864e5).toISOString();
        const want = (l) => l.usedCode && l.title && !['video', 'music'].includes(l.mediaType) && (!l.bookId || P.isUnregistered(l) || P.setInfo(l.title).set); /* 영상·음반은 빼고 (1.38.0) */ const haveV = new Map(); (await C('prd_market_nobook').get()).forEach((d) => haveV.set(d.id, d.data().src || ''));
        const list = [...LISTINGS.entries()].filter(([k, l]) => want(l) && (l.active || !l.bookId) && (!have.get(k) || have.get(k) < cut || haveV.get(k) !== 'usedSearch')).sort((a, b) => (b[1].active ? 1 : 0) - (a[1].active ? 1 : 0)).map(([k]) => k); // 예전 방식(전체 검색)으로 본 것은 새 방식으로 다시
        prog = { list, i: 0, ok: 0, none: 0, startedAt: nowIso() }; await saveProgress('nbMarket', prog);
        log(`검색 시세(미등록·세트·새상품 없음): ${list.length.toLocaleString()}개 (판매 중 먼저, ${SET.nbDays || 7}일 안에 본 것은 건너뜀)`);
      }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('nbMarket', prog); throw new Error('멈춤'); }
        const key = prog.list[prog.i]; const l = LISTINGS.get(key); if (!l) continue;
        const qy = P.searchQueryOf(l.title);
        try {
          if (!qy) throw new Error('검색어를 만들 수 없음');
          const sr = await getDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodeURIComponent(qy)}`);
          const th = SET.photoMatch ?? 0.9; const all = P.parseSearchResults(sr.doc).map((r) => ({ ...r, cov: Math.round(P.nameCoverage(qy, r.title) * 1000) / 1000, vol: P.sameVolume(qy, r.title) }));
          const cands = all.filter((r) => r.cov >= 0.5).slice(0, 30).map((r) => ({ ...r, match: r.cov >= th && r.vol && !(l.bookId && String(r.itemId) === String(l.bookId)) })); // 같은 상품 = 이름 일치 + 권 번호 같음 (세트의 새책 상세 = 첫 페이지에 이미 있으니 뺌)
          const M = P.marketNoBook(cands.map((r) => ({ ...r, cov: r.match ? r.cov : 0 })), { match: th, selfItemId: null, ourPrice: l.price });
          const ref = C('prd_market_nobook').doc(key); const old = (await ref.get()).data(); const sig = `${M.median}|${M.low}|${M.n}`;
          const cSig = JSON.stringify(cands.map((x) => [x.itemId, x.price, x.title])); if (!old || old.candSig !== cSig) await ref.collection('v').doc(nowIso().replace(/[:.]/g, '-')).set({ at: nowIso(), query: qy, cands, market: { median: M.median, low: M.low, n: M.n }, ...W() }); // 후보 목록이 바뀌면 그 판을 통째로 보관
          await ref.set({ usedCode: l.usedCode, listingId: l.listingId || null, title: l.title, query: qy, at: nowIso(), src: 'usedSearch', unreg: P.isUnregistered(l), set: P.setInfo(l.title), cands, candSig: cSig, market: { ...M, points: M.points.map((x) => ({ v: x.v, ch: x.ch, itemId: x.itemId, ours: !!x.ours })) },
            ...(old && old.sig === sig ? {} : { sig, history: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), median: M.median, low: M.low, n: M.n, our: l.price ?? null }) }), ...W() }, { merge: true });
          M.n ? prog.ok++ : prog.none++;
          ui('검색 시세 (미등록·세트)', prog.i + 1, prog.list.length, `${l.title} · ${M.n ? `시세 ${M.median.toLocaleString()}원 (${M.n}개, 신뢰도 ${M.conf})` : '비교할 상품 없음'}`);
        } catch (e) { prog.none++; if (prog.none < 20) log(`시세 ${l.title}: ${e.message}`, 1); }
        if (prog.i % 5 === 0) await saveProgress('nbMarket', prog);
      }
      await finishJob('nbMarket', { ok: prog.ok, none: prog.none }); log(`검색 시세 완료: 경쟁 상품 잡힘 ${prog.ok} · 경쟁 상품 없음 ${prog.none}`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 임시: 판매완료 상품의 도서 정보·이미지 한꺼번에 ─────────
   * 판매완료·내린 상품 중 도서 정보가 없는 것을 전부 → 끝나면 이미지까지. 끝나면 버튼은 '특별 작업' 안으로 숨음. */
  async function soldInfoJob() {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      await loadListings();
      let prog = await loadProgress('soldInfo');
      if (!prog || !prog.list) { const list = [...LISTINGS.entries()].filter(([, l]) => !l.active && l.usedCode && !l.bookId).map(([k]) => k); prog = { list, i: 0, ok: 0, fail: 0, startedAt: nowIso() }; await saveProgress('soldInfo', prog); log(`판매완료 상품 정보: 도서 정보가 없는 ${list.length.toLocaleString()}개를 모읍니다 (끝나면 이미지까지)`); }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('soldInfo', prog); throw new Error('멈춤'); }
        const l = LISTINGS.get(prog.list[prog.i]); if (!l || l.bookId) continue;
        try { await refreshOne(l, null, { infoOnly: true }); prog.ok++; } catch (e) { prog.fail++; if (prog.fail < 20) log(`${l.title || l.usedCode}: ${e.message}`, 1); }
        ui('판매완료 상품 정보 (임시 작업)', prog.i + 1, prog.list.length, `성공 ${prog.ok} · 실패 ${prog.fail}`, '멈춰도 이어서 합니다');
        if (prog.i % 10 === 0) await saveProgress('soldInfo', prog);
      }
      await finishJob('soldInfo', { ok: prog.ok, fail: prog.fail }); log(`판매완료 상품 정보 완료: 성공 ${prog.ok}, 실패 ${prog.fail}. 이어서 이미지를 받습니다`);
    } finally { await releaseLane('aladin'); }
    if (!stopFlag && !curStage) await images();
    drawTemp();
  }
  async function drawTemp() { const el = $('#rnpTemp'); if (!el) return; const d = (await jobRef('soldInfo').get()).data(); const done = d && d.done && d.summary;
    el.innerHTML = done ? `<details><summary style="cursor:pointer;color:#5B6B66">특별 작업 (판매완료 상품 정보는 끝남 · ${new Date(d.finishedAt).toLocaleDateString('ko-KR')})</summary><button class="b3" data-job="soldInfo" style="margin-top:4px">판매완료 상품 정보·이미지 다시 (새로 생긴 것만)</button></details>`
      : `<button class="b2" data-job="soldInfo" style="width:100%;border-style:dashed" title="임시 작업: 끝나면 이 버튼은 아래 '특별 작업' 안으로 숨습니다">⭐ 임시: 판매완료 상품 정보·이미지 한꺼번에</button>`;
    el.querySelectorAll('[data-job]').forEach((b) => (b.onclick = () => { window.__rnResumeOk && window.__rnResumeOk(); runJob(b.dataset.job, { manual: true }); })); }

  /* ───────── 6. 알라딘에 중고팔기 내역 (매입·매입불가) ─────────
   * (1.88.0) 상세의 '매입 상품 내역'(5칸)과 '매입불가 상품 내역'(4칸 — 불가 사유) 둘 다 읽음 (products-core 0.16.0)
   * 목록(쪽마다) → 접수번호 → 상세. 매입이 끝난 접수는 다시 안 열고, 진행 중인 접수만 다시 봄.
   * 저장: pur_buyback/{접수번호} — 처음 받은 내용은 그대로 두고, 진행 상태가 바뀌면 그 상태를 기록에 덧붙임(snapshots). */
  const C2B_LIST = (page) => `https://www.aladin.co.kr/account/wc2binfo.aspx?pType=C2BOrderList&page=${page}&c2bsalesType=-1&SearchYear=0&SearchMonth=0&C2BSearchActive=0&C2BSearchWord=`;
  const C2B_DETAIL = (no) => `https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=${no}`;
  const isFinal = (o) => !!(o && (o.doneDate || /매입완료|정산완료|완료|취소/.test(o.status || '')) && (o.items || []).every((x) => x.result) && (o.rejV === 1 || (o.reqN || 0) <= (o.items || []).length)); /* (1.88.0) 정범님 10/20: '매입불가 상품 내역'을 안 읽었던 끝난 접수는 한 번 다시 열어 불가 책·사유를 덧붙임(예전 내용은 snapshots에 그대로) */
  async function buybackJob() {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      const have = new Map(); (await C('pur_buyback').get()).forEach((d) => have.set(d.id, d.data()));
      const prog = (await loadProgress('buyback')) || { page: 1, list: [], phase: 'list', i: 0, got: 0, upd: 0 };
      if (prog.phase === 'list') {
        for (;;) {
          if (stopFlag) { await saveProgress('buyback', prog); throw new Error('멈춤'); }
          const { doc } = await getDoc(C2B_LIST(prog.page)); const r = P.parseC2BList(doc);
          if (!r.orders.length) break;
          const fresh = r.orders.filter((no) => !have.has(no) || !isFinal(have.get(no)) || have.get(no).settledAmount === undefined); // 정산액을 아직 안 계산한 예전 기록은 한 번만 다시
          prog.list.push(...fresh.filter((no) => !prog.list.includes(no)));
          ui('알라딘 팔기 내역: 목록', prog.page, r.lastPage, `${prog.page}/${r.lastPage}쪽 · 볼 접수 ${prog.list.length}건`);
          // 이미 끝난 접수만 나오는 쪽이 이어지면 그 뒤는 예전 기록 → 멈춤
          if (!fresh.length && prog.page > 1 && r.orders.every((no) => have.has(no))) break;
          if (prog.page >= r.lastPage) break; prog.page++; await saveProgress('buyback', prog);
        }
        prog.phase = 'detail'; prog.i = 0; await saveProgress('buyback', prog);
      }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('buyback', prog); throw new Error('멈춤'); }
        const no = prog.list[prog.i]; const { doc } = await getDoc(C2B_DETAIL(no)); const x = P.parseC2BDetail(doc);
        const paid = x.items.filter((it) => it.result === 'bought').reduce((a, it) => a + (it.buyPrice || 0), 0);
        const ship = String((x.head || {})['발송방법'] || ''); const boxes = Math.max(1, Math.ceil((x.reqN || 1) / 20)); const conv = /편의점/.test(ship);
        const shipFee = !x.doneDate ? 0 : conv ? boxes * (paid >= 10000 ? 1700 : 3000) : /택배/.test(ship) ? (paid >= 10000 ? 0 : boxes * 1500) : 0;
        const m = String((x.head || {})['판매금액'] || '').match(/([\d,]+)\s*원\s*매입/); const buyStated = m ? +m[1].replace(/,/g, '') : null;
        const cur = { orderNo: no, date: x.date, type: x.type, shipDate: x.shipDate, doneDate: x.doneDate, status: x.status, settle: x.settle, discardPolicy: x.discardPolicy, buyer: x.buyer, reqN: x.reqN, reqAmount: x.reqAmount, items: x.items, nRejected: x.nRejected || 0, rejV: x.rejV || null, head: x.head, paidAmount: x.doneDate ? paid : 0,
          buyStated, shipMethod: ship || null, shipFee, shipFeeBoxes: boxes, settledAmount: x.doneDate && /정산\s*완료/.test(x.status || '') ? (buyStated ?? paid) - shipFee : 0 }; // 실제 정산액 = 매입 금액 − 배송비 차감
        const old = have.get(no); const sig = JSON.stringify([cur.status, cur.doneDate, cur.items.map((it) => it.result + ':' + (it.buyPrice || '') + (it.reason ? ':' + it.reason : '')), cur.settledAmount]);
        if (old && old.sig === sig) continue; // 같은 내용이면 기록하지 않음
        /* (1.57.2) 상태가 바뀔 때마다 그때의 전체 내용(책마다 결과·매입가, 정산·금액)을 snapshots에 — 예전 기록에 전체 내용이 없으면 바꾸기 전 내용을 먼저 한 번 남김 */
        const full = (v, at0, tag) => JSON.parse(JSON.stringify({ at: at0, status: v.status || null, doneDate: v.doneDate || null, paid: v.paidAmount ?? null, results: (v.items || []).map((it) => it.result || '-').join(''), items: v.items || [], /* 책마다 받은 칸 그대로 */ settle: v.settle ?? null, reqAmount: v.reqAmount ?? null, buyStated: v.buyStated ?? null, settledAmount: v.settledAmount ?? null, shipFee: v.shipFee ?? null, ...(tag ? { tag } : {}) }));
        const snapAdd = []; if (old && !(old.snapshots || []).some((x) => x && x.items)) snapAdd.push(full(old, old.lastSeenAt || old.firstSeenAt || null, 'before-1.57.2')); snapAdd.push(full(cur, nowIso()));
        await C('pur_buyback').doc(no).set({ ...(old ? {} : { firstSeenAt: nowIso() }), ...cur, sig, source: 'collector', lastSeenAt: nowIso(), snapshots: firebase.firestore.FieldValue.arrayUnion(...snapAdd), ...W() }, { merge: true });
        old ? prog.upd++ : prog.got++;
        ui('알라딘 팔기 내역: 상세', prog.i + 1, prog.list.length, `${no} · ${x.status || ''} · ${x.reqN}권`);
        if (prog.i % 5 === 0) await saveProgress('buyback', prog);
      }
      await finishJob('buyback', { newOrders: prog.got, updated: prog.upd });
      log(`알라딘 팔기 내역: 새 접수 ${prog.got}건, 상태 바뀐 접수 ${prog.upd}건`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 7. 구매자 분포 · 함께 산 책 · 클릭한 상품 (따로 모으기) ─────────
   * 새상품 페이지를 화면 밖 창에서 열고 아래까지 내려 지연 로딩되는 칸을 읽음. 하루에 정해진 권수만(설정), 판매 중인 책부터. */
  // 책 한 권의 구매자 분포·함께 산 책·함께 클릭한 책 (숨은 창) — 구매자 분포 수집과 탐색 수집이 같이 씀. 바뀐 것만 시각과 함께 덧붙임
  async function dynOne(bookId, item) {
    const r = await getProductFull(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${item}`);
    const p = r && r.page; const upd = { dynTriedAt: nowIso(), dynLoaded: !!(p && p.dynamicLoaded) };
    if (p) { if (p.buyerDist) upd.buyerDist = p.buyerDist; if (p.relationBuy && p.relationBuy.length) { upd.relationBuy = p.relationBuy.map((x) => x.title); upd.relationBuyIds = p.relationBuy; } if (p.clickRelation && p.clickRelation.length) upd.clickRelation = p.clickRelation; if (p.clickRaw) upd.clickRaw = p.clickRaw; }
    if (upd.buyerDist || upd.relationBuyIds || upd.clickRelation) upd.dynAt = nowIso();
    if (upd.buyerDist || upd.relationBuy || upd.clickRelation) { const hsig = JSON.stringify([upd.buyerDist || null, upd.relationBuy || null, upd.clickRelation || null]); /* (1.57.2) 함께 클릭한 책만 바뀌어도 기록에 남김 */ const hRef = C('prd_dyn_history').doc(bookId); const hPrev = (await hRef.get().catch(() => null)); const hp = hPrev && hPrev.exists ? hPrev.data() : null;
      if (!hp || hp.lastSig !== hsig) await hRef.set({ bookId, lastSig: hsig, snaps: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), buyerDist: upd.buyerDist || null, relationBuy: upd.relationBuy || null, relationBuyIds: upd.relationBuyIds || null, clickRelation: upd.clickRelation || null, clickRaw: upd.clickRaw || null }), lastCheckedAt: nowIso(), ...W() }, { merge: true }).catch(() => {});
      else await hRef.set({ lastCheckedAt: nowIso() }, { merge: true }).catch(() => {}); }
    await C('prd_book_metrics').doc(bookId).set({ ...upd, dynamicPending: !(upd.buyerDist || upd.relationBuyIds), ...W() }, { merge: true });
    return { p, upd };
  }
  /* ───────── 끝없는 탐색 수집 (1.27.0) — 버튼으로만, 일괄 수집에는 들어가지 않음 ─────────
   * 우리 책들의 '함께 산 책·함께 클릭한 책'에서 시작해, 새로 만난 책마다 지금까지 모으는 모든 정보를 모으고(새상품 페이지의 도서 정보·사진·분야·평점, 온라인 중고 시장 지표, 구매자 분포),
   * 그 책의 '함께 산 책'을 다시 대기열에 넣어 멈출 때까지 끝없이 넓혀 감. 처음 보는 판매자는 판매자 목록에 넣어 판매자 수집(6개월 평가 수·평가)이 이어서 모음
   * 대기열: prd_explore/{알라딘 상품번호} (todo → done/fail, 어디서 왔는지·몇 단계째인지) — Firebase에 있으므로 멈춰도·새로고침해도·다른 PC에서도 그대로 이어감
   * 탐색으로 모은 책은 prd_books에 explored 표시 (우리 상품·알라딘 구매 풀과 구분). 나중에 그 책을 매입하면 같은 도서 기록을 그대로 씀
   * 다른 작업(일괄·개별 버튼·자동)이 시작되면 스스로 멈추고, 그 작업이 끝나면 자동으로 다시 이어감 */
  /* (1.72.3) 🔁 로거가 못 한 일 넘겨받기 — 사무실 PC(로그인)만 · 대기열의 19금 책 시장 지표를 로그인 상태로 읽음 · 한 번에 최대 300건 · 멈추면 남은 것은 대기열에 그대로 */
  async function handoffJob() { if (PUBONLY) { log('🔁 로거가 못 한 일은 사무실 PC(로그인)가 함 — 로거는 하지 않음', 1); return false; }
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    let ok = 0, fail = 0; try { await loadListings(); const qs = await C('prd_handoff').where('status', '==', 'todo').limit(300).get(); const L = qs.docs; if (!L.length) { log('🔁 넘겨받을 일 없음'); return; }
      window.__rnForceLogin = true; for (let i = 0; i < L.length; i++) { if (stopFlag) throw new Error('멈춤'); const d = L[i]; const x = d.data() || {}; ui('🔁 로거가 못 한 일 넘겨받기', i, L.length, x.title || x.tag, `19금 등 — 로그인 상태로 읽음 · 성공 ${ok} · 실패 ${fail}`);
        try { if (x.kind !== 'market') throw new Error('모르는 일 ' + x.kind); const l = (x.usedCode && LISTINGS.get('aladin_' + x.usedCode)) || { usedCode: x.usedCode, title: x.title, bookId: x.bookId }; await refreshOne(l, x.bookId || l.bookId || null); ok++; await d.ref.set({ status: 'done', doneAt: nowIso(), doneBy: PC_NAME, err: null }, { merge: true }); }
        catch (e) { if (e.message === '멈춤') throw e; fail++; const tries = (+x.tries || 0) + 1; await d.ref.set({ status: tries >= 3 ? 'fail' : 'todo', tries, err: String(e.message || e).slice(0, 160), doneAt: nowIso(), doneBy: PC_NAME }, { merge: true }).catch(() => {}); } }
      log(`🔁 로거가 못 한 일 넘겨받기: ${L.length}건 중 성공 ${ok} · 실패 ${fail} (19금 시장 지표 — 로그인 상태로 읽음)`);
    } finally { window.__rnForceLogin = false; await releaseLane('aladin'); } }
  async function exploreJob() {
    try { await C('prd_explore').doc('_check').set({ check: true, at: nowIso(), ...W() }, { merge: true }); } catch (e) { log(`탐색 수집: 저장 권한 없음(prd_explore) — Firestore 규칙에 허용 필요 (${e.code || e.message})`, 1); return false; }
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    const ST = window.__rnExplore = window.__rnExplore || { n: 0, newB: 0, known: 0, fail: 0, added: 0, sellers: 0 };
    const sellerSeen = new Set(); try { (await C('sellers').get()).forEach((d) => sellerSeen.add(d.id)); } catch (e) {}
    const enqueue = async (ids, from, depth) => { let a = 0; for (const x of ids) { const id = String(x.aladinItemId || x.itemId || x); if (!/^\d+$/.test(id)) continue; const ref = C('prd_explore').doc(id); const ex = await ref.get().catch(() => null); if (ex && ex.exists) continue;
      await ref.set({ itemId: id, title: x.title || null, from: from || null, depth: depth || 0, status: 'todo', addedAt: nowIso(), ...W() }); a++; } ST.added += a; return a; };
    try {
      if ((await C('prd_explore').where('status', '==', 'todo').limit(1).get()).empty) { // 대기열이 비면: 우리 책들의 함께 산 책·함께 클릭한 책으로 다시 채움
        ui('탐색 수집: 시작 목록 만드는 중', 0, 0, '우리 책들의 함께 산 책·함께 클릭한 책');
        const seeds = new Map(); (await C('prd_book_metrics').get()).forEach((d) => { const m = d.data(); [...(m.relationBuyIds || []), ...(m.clickRelation || [])].forEach((x) => { if (x && x.aladinItemId && !seeds.has(x.aladinItemId)) seeds.set(x.aladinItemId, { aladinItemId: x.aladinItemId, title: x.title || null, from: d.id }); }); });
        const done = new Set(); (await C('prd_explore').get()).forEach((d) => done.add(d.id));
        let todo = [...seeds.values()].filter((x) => !done.has(String(x.aladinItemId)));
        /* (1.72.3) 우리 책들의 함께 산 책·함께 클릭한 책을 다 봤으면(또는 아직 없으면) — ② 벤치마킹 판매자들이 파는 책(bench_books: 경쟁 판매자 숍에서 본 책 번호) ③ 지금까지 읽은 알라딘 화면에 걸린 책 링크 순으로 시작 목록을 채움(같은 중고 시장에서 실제로 팔리는 책) */
        if (!todo.length) { try { const qb = await C('bench_books').limit(3000).get(); qb.forEach((d) => { if (/^\d{5,}$/.test(d.id) && !done.has(d.id) && !seeds.has(d.id)) todo.push({ aladinItemId: d.id, title: (d.data() || {}).title || null, from: 'bench' }); }); } catch (e) {} if (todo.length) log(`탐색 수집: 우리 책의 함께 산 책은 다 봐서 벤치마킹 판매자들이 파는 책 ${todo.length.toLocaleString()}권으로 시작 목록을 채움`); }
        if (!todo.length) { try { mixHarvest(document); } catch (e) {} for (const id of MIXP.splice(0)) { MIXS.delete(id); if (!done.has(id)) todo.push({ aladinItemId: id, title: null, from: 'page' }); } if (todo.length) log(`탐색 수집: 읽은 화면에 걸린 책 링크 ${todo.length}권으로 시작 목록을 채움`); }
        for (let k = 0; k < todo.length; k += 400) { const b = db.batch(); todo.slice(k, k + 400).forEach((x) => b.set(C('prd_explore').doc(String(x.aladinItemId)), { itemId: String(x.aladinItemId), title: x.title, from: x.from, depth: 1, status: 'todo', addedAt: nowIso(), ...W() })); await b.commit(); }
        log(`탐색 수집: 시작 목록 ${todo.length.toLocaleString()}권 (우리 책들의 함께 산 책·함께 클릭한 책 중 아직 안 본 것)`);
        if (!todo.length) { log('탐색 수집: 더 넓힐 책이 없습니다 (모두 봤음)'); return; }
      }
      const dynCut = new Date(Date.now() - Math.max(1, SET.dynDays || 30) * 864e5).toISOString();
      for (;;) {
        const qs = await C('prd_explore').where('status', '==', 'todo').limit(30).get(); if (qs.empty) { log('탐색 수집: 대기열을 다 봤습니다 — 다음 실행 때 다시 채움'); break; }
        for (const d of qs.docs) {
          if (stopFlag) throw new Error('멈춤');
          const x = d.data(); const itemId = x.itemId; let bookId = null, kind = 'new', title = x.title || itemId, isbn = '';
          try {
            const idDoc = await C('prd_ids').doc('itemId_' + itemId).get();
            if (idDoc.exists) { bookId = idDoc.data().bookId; kind = 'known'; ST.known++; }
            else { await refreshOne({ explore: true, listingId: itemId, title: x.title || null, exploreFrom: x.from || null }, null); const id2 = await C('prd_ids').doc('itemId_' + itemId).get(); bookId = id2.exists ? id2.data().bookId : null; ST.newB++; }
            let rel = [];
            if (bookId) {
              const bk = (await C('prd_books').doc(bookId).get()).data() || {}; title = bk.title || title; isbn = bk.isbn13 || bk.isbn10 || '';
              let m = (await C('prd_book_metrics').doc(bookId).get()).data() || {};
              if (!(m.dynAt && m.dynAt > dynCut)) { await dynOne(bookId, itemId); m = (await C('prd_book_metrics').doc(bookId).get()).data() || {}; }
              rel = [...(m.relationBuyIds || []), ...(m.clickRelation || [])];
              const newSellers = (m.usedFirstPage || []).filter((r) => r && r.sellerCode && String(r.sellerCode) !== '0' && !sellerSeen.has('sc_' + r.sellerCode));
              for (const r of newSellers) { sellerSeen.add('sc_' + r.sellerCode); await C('sellers').doc('sc_' + r.sellerCode).set({ sc: String(r.sellerCode), name: r.sellerName || null, discoveredAt: nowIso(), discoveredBy: 'explore', ...W() }, { merge: true }); ST.sellers++; }
            }
            const a = await enqueue(rel, bookId || itemId, (x.depth || 0) + 1);
            await d.ref.set({ status: 'done', kind, bookId, doneAt: nowIso(), relCount: rel.length, addedNext: a }, { merge: true }); ST.n++;
          } catch (e) { if (e && e.message === '멈춤') throw e; ST.fail++; await d.ref.set({ status: 'fail', error: String(e.message || e).slice(0, 200), doneAt: nowIso() }, { merge: true }).catch(() => {}); }
          ui('끝없는 탐색 수집', 0, 0, `${title} (ISBN ${isbn || '없음'}) · ${kind === 'known' ? '이미 있는 책' : '새 책'} · ${x.depth || 0}단계`, `이번에 본 책 ${ST.n.toLocaleString()} · 새 책 ${ST.newB.toLocaleString()} · 대기열에 더함 ${ST.added.toLocaleString()} · 새 판매자 ${ST.sellers} · 실패 ${ST.fail} — 멈춤을 누를 때까지 계속`);
        }
      }
    } finally { await releaseLane('aladin'); }
  }

  async function dynJob(limit) {
    const lane = await acquireLane('aladin'); if (!lane.ok) { log(lockMsg(lane), 1); ui('다른 PC 작업 중', 0, 0, '', lockMsg(lane)); return false; }
    try {
      let prog = await loadProgress('dynamic');
      if (!prog || !prog.list) { await loadListings();
        const cut = FORCE_ALL ? '9999' : new Date(Date.now() - Math.max(1, SET.dynDays || 30) * 864e5).toISOString(); // 한 번 모은 책은 이 기간(기본 30일) 동안 건너뜀 (수동 실행은 전부)
        const M = new Map(); (await C('prd_book_metrics').get()).forEach((d) => M.set(d.id, d.data()));
        const B = new Map(), pool = new Set(); (await C('prd_books').get()).forEach((d) => { const v = d.data(); if (v.aladinItemId) { B.set(d.id, v.aladinItemId); if (v.aladinPool) pool.add(d.id); } });
        const act = new Set(); LISTINGS.forEach((l) => { if (l.bookId && ACTIVE.includes(l.status)) act.add(l.bookId); });
        const scope = SET.dynScope || 'all'; const rank = (id) => (act.has(id) ? 0 : pool.has(id) ? 1 : 2); // 범위(설정): 판매 중만 / 판매 중 + 알라딘 구매 풀(기본) / 판매완료까지 전부
        [...B.keys()].forEach((id) => { const r = rank(id); if ((scope === 'active' && r > 0) || (scope === 'active_pool' && r > 1)) B.delete(id); });
        const retry = cut; // 정보가 없던 책도 같은 기간(기본 30일) 뒤에만 다시
        const ids = [...B.keys()].filter((id) => { const m = M.get(id); if (!m) return true; if (m.dynAt) return m.dynAt < cut; return !m.dynTriedAt || m.dynTriedAt < retry; }).sort((a, b) => rank(a) - rank(b));
        prog = { list: (limit ? ids.slice(0, limit) : ids).map((id) => `${id}|${B.get(id)}`), i: 0, got: 0, miss: 0 }; await saveProgress('dynamic', prog);
        log(`구매자 분포·함께 산 책 [범위: ${scope === 'active' ? '판매 중' : scope === 'all' ? '판매완료까지 전부' : '판매 중 + 알라딘 구매 풀'}]: 대상 책 ${B.size.toLocaleString()}권 중 모을 책 ${prog.list.length.toLocaleString()}권 ${limit ? `(이번엔 ${limit}권까지)` : '(전부)'} · 이미 모은 ${(B.size - prog.list.length).toLocaleString()}권은 ${SET.dynDays || 30}일 동안 건너뜀`);
        if (!prog.list.length) log(B.size ? '모을 책이 없습니다 (모두 최근에 모음)' : '도서 정보가 있는 책이 없습니다 — 먼저 도서·시장 지표(또는 판매완료 상품 정보)를 돌려 주세요', 1);
      }
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('dynamic', prog); throw new Error('멈춤'); }
        const [bookId, item] = String(prog.list[prog.i]).split('|');
        const { p, upd } = await dynOne(bookId, item);
        if (upd.buyerDist || upd.relationBuyIds || upd.clickRelation) prog.got++; else prog.miss++;
        ui('구매자 분포·함께 산 책', prog.i + 1, prog.list.length, `${p && p.title ? p.title : bookId} (ISBN ${(p && (p.isbn13 || p.isbn10)) || '없음'})${p && p.buyerDist ? '' : ' — 분포 없음'} · 읽음 ${prog.got} · 비어 있음 ${prog.miss}`);
        if (prog.i % 5 === 0) await saveProgress('dynamic', prog);
      }
      await finishJob('dynamic', { got: prog.got, miss: prog.miss });
      log(`구매자 분포·함께 산 책: ${prog.got}권 읽음, ${prog.miss}권은 정보 없음`);
    } finally { await releaseLane('aladin'); }
  }

  /* ───────── 8. 매일 자동 일괄 수집 · 웹앱 수집 요청 ─────────
   * 매일: 설정 시각이 지나면 알라딘 화면이 열린 PC 중 한 대만(먼저 잡은 PC) 일괄 수집을 시작. prd_jobs/auto 에 날짜를 잡아 겹치지 않게.
   * 웹앱: prd_jobs/request 에 요청이 들어오면 비어 있는 PC 한 대가 받아서 실행. */
  const today = () => { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10); };
  async function claimDoc(id, field, value) { let ok = false; await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const ref = C('prd_jobs').doc(id); const s = await tx.get(ref); const d = s.exists ? s.data() : {}; if (d[field] === value) return; tx.set(ref, { [field]: value, by: PC_NAME, pc: PC_ID, at: nowIso() }, { merge: true }); ok = true; }); return ok; }
  setInterval(() => { try { const v = lockDocId(); if (GM_getValue('rnu-lockdoc', null) !== v) GM_setValue('rnu-lockdoc', v); } catch (e) {} }, 5000); /* 바뀔 때만 씀 (같은 값을 5초마다 써서 모든 탭에 알림이 가던 것) */ setTimeout(() => { try { GM_setValue('rnu-lockdoc', lockDocId()); } catch (e) {} }, 1500);
  setTimeout(() => { try { GM_setValue('rnu-autopc', SET.autoPc || 'JS-MAIN'); } catch (e) {} }, 2000);
  setTimeout(() => { try { GM_setValue('rnu-maxlogin', SET.maxLoginTries ?? 6); GM_setValue('rnu-drive-url', SET.driveLogUrl || ''); GM_setValue('rnu-drive-key', SET.driveLogKey || ''); } catch (e) {} }, 2500);
  window.__rnUniAuto = true;
  setInterval(async () => {
    try { window.__rnUniAuto = !!SET.autoDaily || !!window.__rnSchedOn; if (window.__rnSchedOn || (SCHED && SCHED.items)) return; /* (1.34.0) 새 '⏰ 매일 자동 수집'이 있으면 그쪽만 */ if ((window.__rnRest && window.__rnRest()) || running || !auth.currentUser || !SET.autoDaily || window.__rnPaused) return;
      const kst = new Date(Date.now() + 9 * 3600e3); const mins = kst.getUTCHours() * 60 + kst.getUTCMinutes(); const start = (SET.autoHour ?? 17) * 60;
      const mine = String(PC_NAME || '').toUpperCase() === String(SET.autoPc || 'JS-MAIN').toUpperCase();
      if (mins < start + (mine ? 0 : (SET.autoGraceMin ?? 30))) return; // 지정 PC가 먼저, 다른 PC는 기다렸다가
      const lk = (await LOCK().get()).data(); if (laneBusy(lk)) return; // 이 묶음에 자리가 없으면 나중에
      const ch = (await C('prd_jobs').doc('chain').get()).data() || {};
      if (ch.done && ch.finishedAt && Date.now() - ch.finishedAt < 24 * 3600e3) { if (await claimDoc('auto', 'date', today())) { await C('prd_jobs').doc('auto').set({ skipped: true, reason: '24시간 안에 모두 일괄 수집 완료' }, { merge: true }); log(`오늘 자동 수집 건너뜀 — ${Math.round((Date.now() - ch.finishedAt) / 3600e3)}시간 전에 모두 일괄 수집을 끝냄 (${ch.summary && ch.summary.finishedBy || ''})`); } return; }
      if (!(await claimDoc('auto', 'date', today()))) return;
      log(`매일 자동 '모두 일괄 수집' 시작 (${today()} · ${mine ? '지정 PC' : `지정 PC ${SET.autoPc}가 안 해서 이 PC가 맡음`})`);
      window.__rnAuto = true; const r = await runJob('chain'); window.__rnAuto = false; if (r === false) { await C('prd_jobs').doc('auto').set({ date: null }, { merge: true }); log('자동 수집을 시작하지 못해 다음 확인 때 다시 시도합니다', 1); }
    } catch (e) {}
  }, 10 * 60000); // 10분마다 확인 (시작 시각 전후·다른 PC 작업 중이면 다음 확인 때)
  /* (1.60.1) 🎯 집중 벤치마킹의 시각 정해 저절로 돌던 '주기 수집'(3분마다 확인)은 없앰 — 이제 ⏰ 매일 자동 수집의 칸(웹앱 설정에서도 같은 편집기)에서 정한 때만, 웹앱 🎯에서 정한 순서대로 켜진 그룹의 판매자를 모두 읽음
   *  판매자 순서·켜고 끄기를 보기 위해 설정만 듣고 있음(⏰ 시간표의 판매자별 칸막이) */
  let BENCH_LIVE = null; C('app_settings').doc('bench').onSnapshot((d) => { BENCH_LIVE = d.exists ? d.data() : null; try { asEdRefresh(true); } catch (e) {} }, () => {});
  C('prd_jobs').doc('request').onSnapshot((d) => reqHandle(d), () => {});
  async function reqHandle(d) { try {
    const r = d.exists ? d.data() : null; if (r && PUBONLY && !isPubKey(r.job)) return; if (r && pubPcMode() && isPubKey(r.job)) return; /* (1.66.0) 공개 일 요청은 공개 전용 PC가 받게 그대로 둠 */ /* (1.64.0) 공개 전용 PC는 로그인 일 요청을 받지 않음(다른 PC가 받게 그대로 둠) */ if (r && r.job && !r.handled && (running || schedBusy) && typeof JOBS !== 'undefined' && JOBS[r.job] && Date.now() - (r.atMs || 0) < 30 * 60000) REQ_PEND = Date.now(); /* (1.73.0) 하는 일이 끝나면 다시 봄(💤 쉬는 칸이면 바로 양보) */ if (!r || !r.job || r.handled || running || window.__rnPaused || (window.__rnRest && window.__rnRest()) || typeof JOBS === 'undefined' || !JOBS[r.job] || Date.now() - (r.atMs || 0) > 30 * 60000) return;
    const own0 = asOwn(); const mine = own0 ? String(own0.pc || '') !== String(PC_NAME) /* (1.63.7) 담당 PC를 정했으면 요청·맡긴 일은 담당이 아닌 PC가 먼저(담당은 자동 수집에 집중 · 2분 안에 아무도 안 받으면 담당이) */ : String(PC_NAME || '').toUpperCase() === String(SET.reqPc || 'JS-MAIN').toUpperCase(); if (!mine && Date.now() - (r.atMs || 0) < 2 * 60000) { setTimeout(() => d.ref.get().then((x) => x.exists && !x.data().handled && d.ref.set({ ping: Date.now() }, { merge: true })), 2 * 60000 + 2000); return; } // 지정 PC가 2분 안에 안 받으면 다른 PC가
    try { let ok = false; await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s = await tx.get(d.ref); const v = s.data() || {}; if (v.handled) return; tx.set(d.ref, { handled: true, handledBy: PC_NAME, handledAt: nowIso() }, { merge: true }); ok = true; });
      if (ok) { REQ_PEND = 0; log(`웹앱 요청으로 '${JOBS[r.job][0]}' 시작 (${r.byName || r.by || ''})`); window.__rnRemote = true; const pr = runJob(r.job); setTimeout(() => { window.__rnRemote = false; }, 3000); await pr; } } catch (e) {}
  } catch (e) {} }

  /* ══════════ ⏰ 매일 자동 수집 (1.34.0 → 1.60.0 편집기) ══════════
   * 켜 두면(맨 위 스위치) 칸마다 정한 조건(시각·간격·다른 칸 뒤·오래되면·PC가 쉬면·켠 날 처음)에 그 일을 저절로 함 — 끌 때까지 매일.
   * 설정은 Firebase(prd_system/autoSched.slots — 칸 목록, 순서 = 우선순위) 한 곳 → 모든 PC가 같은 설정을 보고, 회차마다 한 PC만 맡음(prd_jobs/autoSched.runs 에 회차를 먼저 잡은 PC).
   * 같은 때 여러 칸이 할 때가 되면 위 칸부터 하나씩. 앞 칸이 막혀 있으면(다른 PC가 알라딘 작업 중·고객 탭 바쁨) 건너뛰고 다음 칸.
   * 주문(주문확인요청·발송 요청)과 알라딘 구매 첫 쪽은 클라우드가 늘 하므로 여기 없음. 고객 쪽 일(묻고 답하기·반품·고객 일괄)은 주문조회·판매관리 화면 탭에서만 돎.
   * (1.60.0) 편집기: 칸을 끌어 순서 바꾸기(움직임 보임) · 시간표에서 시각 블록을 끌어 시각 바꾸기 · 칸 더하기(모든 수집 일 — 앞으로 생기는 일도 저절로 목록에 나옴)·고치기·복제·지우기 · 일마다 평균 걸린 시간
   *  옛 수집기(1.59 이하)는 items(예전 일곱 칸)만 읽음 → 예전 칸을 예전과 같은 모양(정한 시각·다른 조건 없음)으로 둘 때만 items도 켜 둠(그 밖엔 꺼서 옛 수집기가 다르게 하지 않게) */
  /* (1.60.1) 계산(엔진)·칸 편집기 화면은 공용 파일 readnow-autosched-core.js 한 곳(웹앱 설정의 편집기와 같은 것) — 여기는 Firebase 읽기·쓰기와 실행만 */
  const RA = (typeof ReadnowAuto !== 'undefined' && ReadnowAuto) || globalThis.ReadnowAuto || window.ReadnowAuto || null; const AS = RA ? RA.AS : null;
  const SCHED_REF = () => C('prd_system').doc('autoSched'); const SCHED_RUN = () => C('prd_jobs').doc('autoSched'); const JSTAT_REF = () => C('prd_system').doc('jobStats');
  const SCHED_BACK = {}; let SCHED = null, SCHED_RUNS = {}, JSTATS = {}; window.__rnSchedOn = false; const BOOT_AT = Date.now(); let lastBusyAt = Date.now();
  /* (1.63.7) 🖥 자동 수집 담당 PC — 수집기(이 PC의 수집기 탭)가 2분마다 prd_jobs/pcBeat에 신호(살아 있음·쉬는 중 이유)를 적고 같이 읽음
   *  담당·순서 = prd_system/autoSched.owner(⏰ 편집기 맨 위 · 웹앱 ⏰ 페이지에서도) · 판단은 공용 파일 AS.ownerOf 한 곳 */
  let BEATS = {}; const BEAT_REF = () => C('prd_jobs').doc('pcBeat');
  const spreadOn = () => { try { return !PUBONLY && !!(SCHED && SCHED.owner && SCHED.owner.primary && SCHED.owner.spread === true); } catch (e) { return false; } }; /* (1.89.11) 🔀 owner.spread — 정하지 않으면 켬 */
  function asOwn() { try { return SCHED && SCHED.owner && SCHED.owner.primary && AS && AS.ownerOf ? AS.ownerOf(SCHED, BEATS, Date.now()) : null; } catch (e) { return null; } }
  function asOwnMine() { const o = asOwn(); return !o || String(o.pc || '') === String(PC_NAME); }
  async function pcBeat() { if (!auth.currentUser || !PC_NAME || (window.__rnRest && window.__rnRest()) || window.__rnReloading) return; const why = PUBONLY ? '🌐 공개 전용 PC(로그인 안 함 — 담당이 될 수 없음)' : window.__rnPaused ? '📥 수집 끔(일시정지)' : '';
    const since = (() => { try { const lb = +GM_getValue('rnu-beat-last', 0), sv = +GM_getValue('rnu-beat-since', 0); const n = Date.now(); const v = sv && lb && n - lb < 8 * 60e3 ? sv : n; GM_setValue('rnu-beat-last', n); if (v !== sv) GM_setValue('rnu-beat-since', v); return v; } catch (e) { return null; } })(); /* (1.87.0) 🔁 신호를 끊김 없이 보내 온 첫 시각(8분 넘게 끊기면 새로) — 번갈아 켜는 PC는 먼저 켜진 PC가 담당 */
    try { await BEAT_REF().set({ pcs: { [PC_NAME]: { atMs: Date.now(), at: nowIso(), ver: VER, since, ok: !window.__rnPaused && !PUBONLY, paused: !!window.__rnPaused, ...(PUBONLY ? { pubOnly: true, gate: { ok: !!TGATE.ok, why: TGATE.ok ? null : String(TGATE.why || '').slice(0, 160) }, helperAt: HELPER_AT ? new Date(HELPER_AT).toISOString() : null, sec: HELPER && HELPER.sec ? { n: HELPER.sec.n || 0, since: HELPER.sec.since || null, last: (HELPER.sec.last || []).slice(-3) } : null, /* (1.77.5) 🔒 도우미가 기록한 다른 출처 요청(도우미 1.6.5) */ jrn: window.__rnJrn ? { okAt: window.__rnJrn.okAt ? new Date(window.__rnJrn.okAt).toISOString() : null, failAt: window.__rnJrn.failAt ? new Date(window.__rnJrn.failAt).toISOString() : null, pend: window.__rnJrn.pend || 0 } : null, bi: window.__rnBookInfo ? (() => { const v = window.__rnBookInfo(); return { focus: !!v.focus, n: v.n, ok: v.ok, none: v.none, q: v.q, why: v.why ? String(v.why).slice(0, 120) : null, x: v.x }; })() : null /* (1.77.7) 📚 와이파이 도서 정보·무한 차례 상태 — 웹앱 관리 도구에 보임 */ } : {}), /* (1.71.0) 로거 알라딘 길(테더링) 상태 — 클라우드 로거 지킴이가 봄 */ off: (window.__rnFeatOff && window.__rnFeatOff()) || [], ...(why ? { why } : {}) } } }, { merge: true }); const d = await BEAT_REF().get(); const prevOwn = (asOwn() || {}).pc; BEATS = d.exists ? d.data() : {}; const o = asOwn(); if (o && prevOwn !== undefined && prevOwn !== o.pc && o.pc === PC_NAME) log(`🖥 자동 수집을 이 PC가 맡음 — ${o.why}`); try { asEdRefresh(true); } catch (e) {} } catch (e) {} }
  setTimeout(pcBeat, 12000); setInterval(pcBeat, 2 * 60000);
  const kstNow = () => (RA ? RA.kstNow() : { day: '', min: 0 }); const esc3 = (t) => (RA ? RA.esc(t) : String(t == null ? '' : t));
  const AS_META = RA ? RA.META : {}; const CRM_LBL = RA ? RA.CRM_LBL : {};
  const PAR_JOBS = { kpipa: kpipaPar, extBurst: () => extBurstPar() }; /* (1.60.1) 동시 진행 일 — 알라딘을 쓰지 않아 다른 수집과 함께 돎(따로 돌리는 함수) */
  function asCatalog() { const L = []; const crm = { ...CRM_LBL, ...((window.__rnCrm && window.__rnCrm.tasks && window.__rnCrm.tasks()) || {}) };
    for (const [k, l] of Object.entries(crm)) L.push({ job: 'crm:' + k, label: l });
    for (const k of Object.keys(JOBS)) L.push({ job: 'prd:' + k, label: JOBS[k][0], ...(PAR_JOBS[k] ? { par: true } : {}) });
    return L.map((x) => { const m = AS_META[x.job] || ['기타', '']; return { ...x, g: m[0], d: m[1] }; }); }
  const asLabel = (job) => { const c = asCatalog().find((x) => x.job === job); return c ? c.label : job; };
  let E = null; /* 칸 편집기(공용 파일) — 수집기 화면 위에 창으로 */
  const asName = (s) => (E ? E.name(s) : (s && (s.name || asLabel(s.job))) || '');
  const asMissing = (s) => !!s && !asCatalog().some((c) => c.job === s.job);
  const asAvgMs = (job) => (E ? E.avg(job) : null);
  /* ── 일마다 걸린 시간 기록 (prd_system/jobStats) — 어디서 돌렸든(매일 자동·직접 누름·웹앱 요청) 끝날 때마다 덧붙임 · 일마다 최근 40번 ── */
  async function jobStatAdd(job, list) { if (!auth.currentUser || !list.length) return; try { await db.runTransaction(async (tx) => { const s = await tx.get(JSTAT_REF()); const J = ((s.exists && s.data().jobs) || {})[job] || {}; const old = J.runs || [];
      const add = list.filter((e) => !old.some((o) => Math.abs(AS.toMs(o.at) - AS.toMs(e.at)) < 3 * 60e3)); if (!add.length) return; const runs = [...old, ...add].sort((a, b) => AS.toMs(a.at) - AS.toMs(b.at)).slice(-40);
      tx.set(JSTAT_REF(), { jobs: { [job]: { runs, label: asLabel(job), n: (J.n || 0) + add.length, at: nowIso() } } }, { merge: true }); }); } catch (e) {} }
  window.__rnJobDone = (job, ms, st, how) => { if (!job || !(ms >= 0) || !['done', 'stop', 'error', 'timeout', 'part'].includes(st)) return; try { const k = 'job:' + String(job).replace(/^bench:\d+$/, 'bench_seller'); window.__rnCS && (window.__rnCS.add(k, { done: 'ok', stop: 'part', part: 'part', error: 'fail', timeout: 'fail' }[st], 1, st === 'stop' ? '멈춤(사람·새 판·자리 내줌) — 다음에 같은 자리부터' : st === 'part' ? '이어 하기로 끝냄' : st === 'error' ? '오류로 끝남' : st === 'timeout' ? '시간 넘김' : null), window.__rnCS.add(k, 'ms', Math.round(ms))); } catch (e) {} /* (1.79.0) 📊 */ jobStatAdd(job, [{ at: nowIso(), ms: Math.round(ms), st, pc: PC_NAME, how: how || (window.__rnAutoSlot ? 'sched' : window.__rnAuto ? 'auto' : window.__rnRemote ? 'web' : 'manual'), src: 'job' }]); };
  /* 예전 걸린 시간 채우기 — 이 PC 작업 기록(최근 7일)의 '■ … 끝남 — N분'·'⏰ … 끝 (N분)' 줄에서 (PC마다 한 번 · 분 단위라 '기록으로 어림') */
  /* (1.60.1) 🎯 판매자마다 걸린 시간 — 마지막 회차(bench_state의 시작·끝, 끝까지 읽은 것만)로 처음 한 번 채움 */
  async function benchStatSeed() { if (GM_getValue('rn-jobstats-seed-bench', '') === '1.60.1') return; let n = 0; try { const qs = await C('bench_state').get(); for (const d of qs.docs) { const v = d.data() || {}; const a = Date.parse(v.runAt || ''), b = Date.parse(v.endAt || ''); if (!(a > 0 && b > a) || v.complete === false || b - a > 12 * 3600e3 || b - a < 30e3) continue; await jobStatAdd('bench:' + d.id, [{ at: v.endAt, ms: b - a, st: 'done', pc: v.by || '', how: 'state', src: 'state' }]); n++; } GM_setValue('rn-jobstats-seed-bench', '1.60.1'); if (n) log(`🎯 판매자마다 걸린 시간: 마지막 회차 기록으로 ${n}명을 채움(⏰ 시간표 칸막이·한 바퀴 예상)`); } catch (e) {} }
  async function jobStatSeed() { benchStatSeed().catch(() => {}); if (GM_getValue('rn-jobstats-seed', '') === '1.60.0' || !window.__rnLogDay) return; const byName = {}; for (const c of asCatalog()) byName[c.label] = c.job; ['qna:묻고 답하기', 'returns:반품 관리', 'scanDaily:상품 조회/수정 (판매중·일시판매중지·판매중지)', 'buyback:알라딘 팔기 정산 내역', 'aladinBuy:알라딘 구매 내역 (내가 산 것)', 'crmBulk:고객·주문 전체 일괄', 'chain:모두 일괄 수집 (고객 + 상품 전체)'].forEach((x) => { const [id, l] = x.split(':'); byName[l] = (AS.LEG[id] || {}).job; });
    const got = {}; for (let i = 0; i < 8; i++) { const d = AS.kst(Date.now() - i * 864e5).day; let rec = null; try { rec = await window.__rnLogDay(d); } catch (e) {} for (const e of (rec && rec.lines) || []) { const p = AS.parseLogLine(e.x); if (!p) continue; const job = byName[p.name]; if (!job) continue; (got[job] = got[job] || []).push({ at: new Date(e.t).toISOString(), ms: p.ms, st: p.st, pc: PC_NAME, how: p.how, src: 'log' }); } }
    for (const [job, L] of Object.entries(got)) await jobStatAdd(job, L.slice(-40)); GM_setValue('rn-jobstats-seed', '1.60.0'); const n = Object.values(got).reduce((a, L) => a + L.length, 0); if (n) log(`⏰ 일마다 걸린 시간: 이 PC 작업 기록(최근 7일)에서 ${n}번을 찾아 채움 (${Object.keys(got).length}가지 일)`); }
  /* (1.60.1) 칸 편집기에 넘기는 것(ctx) — 읽기는 이 PC가 듣고 있는 것 그대로, 쓰기는 asSave 한 곳 */
  const BIs = { ext: null, cj: null, cloud: null, ack: null, ackLog: [] }; C('app_settings').doc('ext').onSnapshot((d) => { BIs.ext = d.exists ? d.data() : {}; try { asEdRefresh(true); } catch (e) {} asAck('ext', BIs.ext, () => `외부 정보 ${BIs.ext.on === false ? '끔' : '켬'} · 클라우드 이어 받기 ${BIs.ext.cloud === true ? '켬' : '끔'} 받음`); }, () => {});
  /* (1.62.0) ✅ 적용 확인 — 이 PC가 설정을 실제로 받으면(듣기에 새 값이 들어오면) 받은 설정의 표지를 prd_system/autoAck.pcs.{PC}에, 바뀐 때만 적용 기록(prd_jobs/autoAck_YYYY-MM)에 한 줄 · 웹앱 ⏰ 자동 수집 페이지·칸 편집기 맨 위에 PC마다 ✓/⏳ */
  function asAck(kind, data, what) { try { if (!RA || !RA.ackSig || !data) return; const sig = RA.ackSig(kind, data); const gk = 'rn-ack-' + kind; const prev = GM_getValue(gk, ''); const mine = ((((BIs.ack || {}).pcs || {})[PC_NAME] || {})[kind] || {}).sig;
      if (prev === sig && mine === sig) return; GM_setValue(gk, sig); const at = nowIso(); C('prd_system').doc('autoAck').set({ pcs: { [PC_NAME]: { [kind]: { sig, at, ver: APP_VER_AS } } } }, { merge: true }).catch(() => {});
      if (prev !== sig) C('prd_jobs').doc('autoAck_' + at.slice(0, 7)).set({ log: firebase.firestore.FieldValue.arrayUnion({ at, pc: PC_NAME, kind, sig, what: String(typeof what === 'function' ? what() : what || '').slice(0, 160) }) }, { merge: true }).catch(() => {}); } catch (e) {} }
  const APP_VER_AS = ((typeof globalThis !== 'undefined' && globalThis.__RN_FILE_VER) || (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version)) || '?';
  C('prd_system').doc('autoAck').onSnapshot((d) => { BIs.ack = d.exists ? d.data() : {}; try { asEdRefresh(true); } catch (e) {} }, () => {});
  C('prd_jobs').doc('autoAck_' + nowIso().slice(0, 7)).onSnapshot((d) => { BIs.ackLog = (d.exists && d.data().log) || []; try { asEdRefresh(true); } catch (e) {} }, () => {});
  /* (1.61.0) ☁ 클라우드가 하는 일 켜기·끄기(app_settings/cloud_jobs) + 클라우드 신호(app_settings/cloud) — 칸 편집기에 보이고 여기서도 바꿈 */
  C('app_settings').doc('cloud_jobs').onSnapshot((d) => { BIs.cj = d.exists ? d.data() : {}; try { asEdRefresh(true); } catch (e) {} asAck('cj', BIs.cj, () => { const c = BIs.cj || {}; const off = (RA.CLOUD_JOBS || []).filter((x) => x.k !== 'ext' && c[x.k] === false).map((x) => x.label); return c.all === false ? '☁ 전체 끔 받음' : `☁ ${off.length ? '끈 일: ' + off.join(', ') : '모두 켬'} 받음`; }); }, () => {});
  C('app_settings').doc('cloud').onSnapshot((d) => { BIs.cloud = d.exists ? d.data() : null; }, () => {});
  const asCloudCtx = () => ({ cfg: BIs.cj || {}, beat: BIs.cloud, ext: BIs.ext || {}, extLease: ((EXT_S.lease || {}).pc) || null, set: (k, v) => (k === 'ext' ? C('app_settings').doc('ext').set({ cloud: !!v, at: nowIso(), by: PC_NAME }, { merge: true }) : C('app_settings').doc('cloud_jobs').set({ [k]: !!v, at: nowIso(), by: PC_NAME }, { merge: true })).then(() => log(`☁ 클라우드 '${((RA.CLOUD_JOBS || []).find((x) => x.k === k) || { label: k }).label}' ${v ? '켬' : '끔'}`)) });
  function asSegs(job) { if (!['prd:bench', 'prd:benchForce'].includes(job) || !BENCH_LIVE) return null; const T = benchTargets(BENCH_LIVE);
    return T.map((t) => { const d = AS.durations('bench:' + String(t.sc), JSTATS, {}, []); return { label: t.name || String(t.sc), ms: d.n ? d.avg : 15 * 60e3, est: !d.n }; }); }
  function asBuiltins() { const X = EXT(); const on = !!(X && BIs.ext && X.cfgOf(BIs.ext).on);
    return [{ k: 'ext', cls: 'ext', label: '🔎 외부 정보 (알라딘 밖 기본 정보·국내 중고 시세·외국 시세·도서관·전자책)', desc: `5분마다 최대 4분씩 조금씩 — 출처마다 하루 최대·요청 간격을 지킴 · PC가 꺼지면 ${BIs.ext && BIs.ext.cloud === true ? '클라우드가 이어 받음' : '수집 안 함(☁ 클라우드 이어 받기 꺼짐)'} · 출처별 설정은 웹앱 설정 ⑱`, on, par: true, run: EXT_S.busy ? '이 PC에서 받는 중' : null, toggle: (v) => C('app_settings').doc('ext').set({ on: !!v, at: nowIso(), by: PC_NAME }, { merge: true }) },
      { k: 'handoff', cls: 'login', label: '🔁 로거가 못 한 일 넘겨받기 (19금 등 로그인해야 보이는 책의 시장 지표)', desc: `로거가 로그인 없이 못 읽은 책을 대기열(prd_handoff)에 남기면 로그인한 사무실 담당 PC가 정한 시각·조건 칸 다음 차례(6)로 받아 읽음 · 기본 켬${AH.ho ? ` · 지금 대기 ${AH.ho.todo}건` : ''}`, on: !(SCHED && SCHED.handoffOff), run: running === 'handoff' ? '이 PC에서 하는 중' : null, toggle: (v) => SCHED_REF().set({ handoffOff: !v, at: nowIso(), by: PC_NAME }, { merge: true }) }]; }
  /* (1.72.3) 편집기 📋·🤖 자료 — 외부 정보 날마다 성공·실패 · 넘겨받을 일 · 섞어 읽기 · 쉬는 출처 (그릴 때만 · 2~3분에 한 번 읽음) */
  const AH = { xr: null, xrAt: 0, ho: null, hoAt: 0 };
  const asExtRun = () => { if (Date.now() - AH.xrAt > 120e3) { AH.xrAt = Date.now(); EXT_RUN().get().then((d) => { AH.xr = d.exists ? d.data() : {}; asEdRefresh(true); }).catch(() => {}); } return AH.xr; };
  const asHandoff = () => { if (Date.now() - AH.hoAt > 180e3) { AH.hoAt = Date.now(); const t0 = new Date(Date.parse(kstNow().day + 'T00:00:00+09:00')).toISOString(); const C0 = C('prd_handoff'); Promise.all([C0.where('status', '==', 'todo').limit(2000).get(), C0.where('doneAt', '>=', t0).limit(2000).get(), C0.where('at', '>=', t0).limit(2000).get()]).then(([a, b2, c]) => { AH.ho = { todo: a.size, doneToday: b2.docs.filter((d) => (d.data() || {}).status === 'done').length, gateToday: c.size, on: !(SCHED && SCHED.handoffOff) }; asEdRefresh(true); }).catch(() => {}); } return AH.ho; };
  const ASCTX = { loadRunsDay: (d) => C('prd_jobs').doc('autoSched_' + d).get().then((x) => (x.exists && x.data().runs) || {}), saveRest: (r) => SCHED_REF().set({ rest: r, at: nowIso(), by: PC_NAME }, { merge: true }).then(() => log(`✨ 쉴 때 하는 일 저장`)), extRun: () => asExtRun(), extLabel: (k) => { const X = EXT(); return (X && X.SOURCES && X.SOURCES[k] && X.SOURCES[k].label) || k; }, handoff: () => asHandoff(), autoInfo: () => ({ mix: mixRate(), extPaused: Object.entries(EXT_S.pauseUntil || {}).filter(([, t]) => t > Date.now()).map(([k, t]) => { const X = EXT(); return `${(X && X.SOURCES && X.SOURCES[k] && X.SOURCES[k].label) || k}(${Math.ceil((t - Date.now()) / 3600e3)}시간)`; }) }), doc: () => SCHED, runs: () => SCHED_RUNS, stats: () => JSTATS, catalog: () => asCatalog(), pc: PC_NAME, pcs: () => { try { return Object.values(PCS_SEEN).filter((v) => v && v.pcName && v.tool === '상품 수집기' && Date.now() - (v.atMs || 0) < 14 * 864e5).map((v) => String(v.pcName)); } catch (e) { return []; } },
    beats: () => BEATS, setOwner: (o) => SCHED_REF().set({ owner: { primary: String(o.primary || '').slice(0, 40), order: (o.order || []).map((x) => String(x).slice(0, 40)).slice(0, 12), rot: !!o.rot, spread: o.spread === true, at: nowIso(), by: PC_NAME } }, { merge: true }).then(() => log(`🖥 자동 수집 담당 PC: ${o.primary || '정하지 않음'}${o.order && o.order.length ? ' → ' + o.order.join(' → ') : ''}`)),
    save: (slots, baseRev, what) => asSave(slots, baseRev, what), net: () => (PUBONLY && HELPER ? HELPER : null), logger: () => ({ name: PUBPC.name || (PUBONLY ? PC_NAME : null), since: PUBPC.since }), isLogger: () => PUBONLY, /* (1.68.0) */ loggerCtl: async (cmd) => { if (PUBONLY) { if (cmd === 'stop') window.__rnPauseAll('⏰ 편집기에서 로거 중단 — 하던 일 저장'); else window.__rnResumeOk(); try { BEATS = BEATS || {}; } catch (e) {} return 'local'; } const nm = PUBPC.name; if (!nm) throw new Error('로거 PC 이름이 아직 없음(설정)'); if (!window.__rnCtlSend) throw new Error('원격 명령을 못 씀'); await window.__rnCtlSend(nm, cmd); return 'remote'; }, /* (1.72.0) 🌐 로거 ■ 중단 · ▶ 다시 시작 */ /* (1.67.0) 📶 로거에서만 바로 · 다른 PC는 웹앱에서 */ setBudget: (patch) => RA.saveBudget({ cfgRef: SCHED_REF(), editsRef: (m) => C('prd_jobs').doc('autoSched_edits_' + m), arrayUnion: (...x) => firebase.firestore.FieldValue.arrayUnion(...x), email: (auth.currentUser || {}).email || null }, patch, PC_NAME), setOn: (on) => SCHED_REF().set({ on: !!on, at: nowIso(), by: PC_NAME }, { merge: true }).then(() => log(`⏰ 매일 자동 수집 ${on ? '켬' : '끔'}`)), log: (m, e) => log(m, e), segs: asSegs, builtins: asBuiltins, cloud: asCloudCtx, acks: () => ({ pcs: (BIs.ack || {}).pcs || {}, log: BIs.ackLog || [] }), note: '웹앱 ⏰ 자동 수집 페이지와 같은 편집기 — 어디서 고치든 같은 칸(prd_system/autoSched) · 저장하면 모든 PC에 1분 안에 적용 · 회차마다 한 PC만 함', front: (el) => window.__rnFront && window.__rnFront(el) };
  /* 할 수 있는 일 목록을 Firebase에 알려 둠 → 웹앱 설정의 편집기도 같은 목록(이 수집기 판의 일)을 씀 · 바뀔 때만 씀 */
  async function asPublishCatalog() { try { const jobs = asCatalog().map((c) => ({ job: c.job, label: c.label, g: c.g, d: c.d, ...(c.par ? { par: true } : {}) })); const ref = C('prd_system').doc('autoCatalog'); const cur = (await ref.get()).data() || {};
      if ((cur.ver && verNum(cur.ver) > verNum(VER)) || JSON.stringify(cur.jobs || []) === JSON.stringify(jobs)) return; await ref.set({ jobs, ver: VER, by: PC_NAME, at: nowIso() }); } catch (e) {} }
  /* (1.60.1) 예전에 따로 스스로 돌던 자동 일을 칸으로 옮김 (한 번만 · 모든 PC 중 처음 새 판이 함) — 🎯 벤치마킹 주기 수집 · 📚 출판 통계 · 📦 발송 요청 읽기 · 그룹 시장 지표 */
  /* (1.75.0) 🧾 판매된 상품을 매일 확인 — 상품 전체 확인(scanFull: 판매중 계열 전체를 훑어 안 보이는 상품 = 팔림·내림으로 표시)이 시간표에 없어 10/06 뒤로 돌지 않았음
   *  → 팔린 책이 판매중으로 남고(주문 줄에 상품 코드가 없는 주문 — 판매완료 엑셀을 올리기 전 — 은 짝지을 수 없음) 웹앱 '📦 보유재고'에 남았음. 매일 06:30 한 번(사무실 PC · 로그인 일) 칸을 한 번만 넣음(지우면 다시 넣지 않음) */
  async function asMigrate175() { if (!SCHED || (SCHED.mig175 && SCHED.mig176)) return; try {
      await db.runTransaction(async (tx) => { const s0 = await tx.get(SCHED_REF()); const D = s0.exists ? s0.data() : {}; if (D.mig175 && D.mig176) return; const L = AS.slotsOf(D); const add = [];
        if (!D.mig175 && !L.some((x) => x.job === 'prd:scanFull')) add.push({ id: 'scanFull', job: 'prd:scanFull', on: true, name: '🧾 상품 전체 확인 (팔린 상품 표시)', trig: { t: 'time', times: ['06:30'] } });
        if (!L.some((x) => x.job === 'prd:deposit')) add.push({ id: 'deposit', job: 'prd:deposit', on: true, name: '💰 알라딘 예치금(환급액) 내역', trig: { t: 'every', min: 60 } }); /* (1.76.0) */
        const slots = [...L, ...add.map(AS.sanitize).filter(Boolean)]; tx.set(SCHED_REF(), { ...(add.length ? { slots: JSON.parse(JSON.stringify(slots)), items: AS.legacyItems(slots), rev: (+D.rev || 0) + 1 } : {}), mig175: D.mig175 || { at: nowIso(), by: PC_NAME, added: add.map((x) => x.id) }, mig176: { at: nowIso(), by: PC_NAME, added: add.map((x) => x.id) } }, { merge: true }); });
      log('⏰ 시간표 칸 한 번 넣기: 🧾 상품 전체 확인(매일 06:30) · 💰 알라딘 예치금(1시간마다) — 없을 때만 · 지우면 다시 넣지 않음'); } catch (e) { log('⏰ 상품 전체 확인 칸 넣기 실패(다음에 다시): ' + (e.code || e.message), 1); } }
  /* (1.84.9 · 정범님 10/19 '중요한 것은 건드리지 말고 알아서 추가') 📊 판매중 시장 지표를 7일 안으로 — 07:00 '도서 정보·시장 지표' 칸이 꺼져 있어 판매중 15,708권 중 9,083권이 7일 넘게 묵었음(10/19 진단)
   *  기존 칸은 그대로 두고 새 칸 하나만: 2시간마다(06:00~23:30) 오래된 책부터 이어 읽기(진행 저장·이어 하기는 그 일 그대로 · 테더링 일반 몫 안에서) — 지우면 다시 넣지 않음 */
  async function asMigrate1849() { if (!SCHED || SCHED.mig1849) return; try {
      await db.runTransaction(async (tx) => { const s0 = await tx.get(SCHED_REF()); const D = s0.exists ? s0.data() : {}; if (D.mig1849) return; const L = AS.slotsOf(D); const add = [];
        if (!L.some((x) => x.id === 'marketKeep')) add.push({ id: 'marketKeep', job: 'prd:market', on: true, name: '📊 판매중 시장 지표 새로 읽기 (7일 안 유지)', trig: { t: 'every', min: 120 }, win: { from: '06:00', to: '23:30' } });
        const slots = [...L, ...add.map(AS.sanitize).filter(Boolean)]; tx.set(SCHED_REF(), { ...(add.length ? { slots: JSON.parse(JSON.stringify(slots)), items: AS.legacyItems(slots), rev: (+D.rev || 0) + 1 } : {}), mig1849: { at: nowIso(), by: PC_NAME, added: add.map((x) => x.id) } }, { merge: true }); });
      log('⏰ 시간표 칸 한 번 넣기: 📊 판매중 시장 지표 새로 읽기(2시간마다 06:00~23:30) — 없을 때만 · 지우면 다시 넣지 않음'); } catch (e) { log('⏰ 시장 지표 칸 넣기 실패(다음에 다시): ' + (e.code || e.message), 1); } }
  async function asMigrate161() { if (!SCHED || SCHED.mig161) return; try { const bc = (await C('app_settings').doc('bench').get()).data() || {}; const kp = (await C('app_settings').doc('kpipa').get()).data() || {};
      await db.runTransaction(async (tx) => { const s0 = await tx.get(SCHED_REF()); const D = s0.exists ? s0.data() : {}; if (D.mig161) return; const L = AS.slotsOf(D); const has = (j) => L.some((x) => x.job === j); const add = [];
        if (!has('prd:bench')) add.push({ id: 'bench', job: 'prd:bench', on: bc.autoOn !== false && (bc.targets || []).some((t) => t && t.on !== false), name: '🎯 집중 벤치마킹', trig: { t: 'time', times: ['01:00'] } });
        if (!has('prd:kpipa')) add.push({ id: 'kpipa', job: 'prd:kpipa', on: kp.auto !== false, trig: { t: 'time', times: ['14:40'] } });
        if (!has('prd:shipRead')) add.push({ id: 'shipRead', job: 'prd:shipRead', on: (SET.shipAutoMin ?? 15) > 0, name: '📦 발송 요청 읽기 (클라우드가 꺼졌을 때만)', trig: { t: 'every', min: Math.max(10, SET.shipAutoMin || 15) }, win: { from: '09:00', to: '16:00' }, days: [1, 2, 3, 4, 5] });
        if (!has('prd:metricsAuto')) add.push({ id: 'metricsAuto', job: 'prd:metricsAuto', on: true, trig: { t: 'every', min: 60 } });
        const slots = [...L, ...add.map(AS.sanitize)]; tx.set(SCHED_REF(), { slots: JSON.parse(JSON.stringify(slots)), items: AS.legacyItems(slots), rev: (+D.rev || 0) + 1, ver: 2, mig161: { at: nowIso(), by: PC_NAME, added: add.map((x) => x.id) } }, { merge: true }); });
      log('⏰ 매일 자동: 예전에 따로 스스로 돌던 자동 일(🎯 벤치마킹 주기 수집·📚 출판 통계·📦 발송 요청 읽기·그룹 시장 지표)을 칸으로 옮김 — 이제 칸 편집기에서만 켜고 끄고 시각을 정함'); } catch (e) { log('⏰ 예전 자동 일 옮기기 실패: ' + (e.code || e.message), 1); } }
  async function schedInit() {
    if (!AS) { const el = globalThis.__rnById('rnpSched'); if (el) el.innerHTML = '<div class="hint2" style="color:#B0322A">⏰ 매일 자동 수집: 공용 파일 readnow-autosched-core.js를 못 읽어 멈춤 — GitHub에 올렸는지 확인하고 새로고침</div>'; log('⏰ 매일 자동 수집: 공용 파일 readnow-autosched-core.js를 못 읽어 자동 수집을 하지 않음 — GitHub에 올렸는지 확인', 1); return; }
    E = RA.createEditor(ASCTX); setTimeout(asPublishCatalog, 20000);
    SCHED_REF().onSnapshot(async (d) => {
      if (!d.exists) { // 처음: 예전 자동 설정을 옮겨 담음 (예전 스위치는 끔 — 이제 여기 한 곳에서만)
        for (let i = 0; i < 10 && !(window.__rnCrm && window.__rnCrm.oldAuto); i++) await new Promise((r) => setTimeout(r, 500));
        let crmOld = null; try { crmOld = window.__rnCrm && window.__rnCrm.oldAuto ? await window.__rnCrm.oldAuto() : null; } catch (e) {}
        const items = {}; AS.LEGACY.forEach((it) => { items[it.id] = { on: !it.off, times: it.def }; });
        if (crmOld && crmOld.on) items.crmBulk = { on: true, times: AS.normTimes([crmOld.time || '06:00']) };
        if (SET.autoDaily) items.chain = { on: true, times: [`${String(SET.autoHour ?? 17).padStart(2, '0')}:00`] };
        const on = !!((crmOld && crmOld.on) || SET.autoDaily);
        try { await SCHED_REF().set({ on, items, createdAt: nowIso(), by: PC_NAME, migrated: { crm: crmOld, chain: !!SET.autoDaily } }); } catch (e) {}
        try { if (window.__rnCrm && window.__rnCrm.offOldAuto) await window.__rnCrm.offOldAuto(); } catch (e) {}
        if (SET.autoDaily) { try { await saveSet({ autoDaily: false }); } catch (e) {} }
        return; }
      SCHED = d.data(); window.__rnSchedOn = !!SCHED.on; window.__rnSchedHas = true; if (PUBONLY && HELPER) budTick(HELPER); /* (1.67.0) 📶 몫 설정이 바뀌면 바로 */ if (!SCHED.mig161) asMigrate161(); if ((!SCHED.mig175 || !SCHED.mig176) && !PUBONLY) asMigrate175(); if (!SCHED.mig1849 && !PUBONLY) asMigrate1849(); schedDraw(); asEdRefresh(); asAck('sched', SCHED, () => `rev ${+SCHED.rev || 0} · ${SCHED.on ? '켬' : '끔'} 받음`); }, () => {});
    SCHED_RUN().onSnapshot((d) => { SCHED_RUNS = (d.exists && d.data().runs) || {}; window.__rnSchedRunsAt = Date.now(); schedDraw(); schedArchive(); asEdRefresh(true); }, () => {});
    JSTAT_REF().onSnapshot((d) => { JSTATS = (d.exists && d.data().jobs) || {}; schedDraw(); asEdRefresh(true); }, () => {});
    setInterval(() => { if (running || (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()) || schedBusy) lastBusyAt = Date.now(); }, 15000);
    setInterval(schedTick, 60000); setTimeout(schedTick, 15000); setInterval(parTick, 60000); setTimeout(parTick, 20000); setInterval(() => { const d = kstNow().day; if (d !== schedDrawDay) schedDraw(); }, 60000);
    setTimeout(() => jobStatSeed().catch(() => {}), 60000); }
  /* (1.60.1) 동시 진행 칸(알라딘을 쓰지 않는 일 — 출판 통계)은 다른 일이 돌고 있어도 따로 함 · 한 번에 하나 */
  let parBusy = false;
  async function parTick() { if (RESTX.busy && SCHED && SCHED.on && AS) { try { const dd = AS.due(SCHED, SCHED_RUNS, { now: Date.now(), pc: PC_NAME, own: asOwn(), anyPc: extLoggerOk() || spreadOn() ? (job) => AS.classOf && AS.classOf(job) === 'ext' : null, pubAll: PUBONLY && extLoggerOk(), crmOk: false, idleMs: 0, bootAt: BOOT_AT, stats: JSTATS }).filter((d) => d.mark === 'run' && PAR_JOBS[d.slot.job.slice(4)]); if (dd.length && !PAR_STOP[RESTX.k]) { PAR_STOP[RESTX.k] = true; log(`✨ 쉴 때 외부 조회 '${(JOBS[RESTX.k] || [RESTX.k])[0]}' 자리 내줌 — 정한 칸 '${asName(dd[0].slot)}' 먼저`); } } catch (e) {} return; } /* (1.74.0) */ if (parBusy || window.__rnReloading || window.__rnPaused || !auth.currentUser || (window.__rnRest && window.__rnRest()) || !SCHED || !SCHED.on || !AS) return;
    const dues = AS.due(SCHED, SCHED_RUNS, { now: Date.now(), pc: PC_NAME, own: asOwn(), anyPc: extLoggerOk() || spreadOn() ? (job) => AS.classOf && AS.classOf(job) === 'ext' : null, pubAll: PUBONLY && extLoggerOk(), crmOk: false, idleMs: 0, bootAt: BOOT_AT, stats: JSTATS }).filter((d) => d.mark === 'run' && PAR_JOBS[d.slot.job.slice(4)] && d.slot.job.startsWith('prd:')); const due = dues[0]; if (!due) return; parBusy = true; /* (1.68.0) 로거도 🔎 외부 정보 칸(KPIPA 등)을 맡을 수 있음 — 회차마다 한 곳만(기록 열쇠) */
    try { const S1 = due.slot; let ok = false; await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s0 = await tx.get(SCHED_RUN()); const r = (s0.exists && s0.data().runs) || {}; if (r[due.key]) return; const up = { [due.key]: { by: PC_NAME, at: nowIso(), st: nowIso(), beat: nowIso(), state: 'running', job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0, par: true } }; due.merge.filter((k) => !r[k]).forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: JSON.parse(JSON.stringify(up)) }, { merge: true }); ok = true; }); /* (1.89.1) 빈 값(undefined)이 섞이면 Firebase가 invalid-argument로 거절 → ⏰ 매일 자동이 1분마다 같은 회차에서 막혔음(HOME 10/20 17:00~) — 빈 값은 빼고 씀 */
      if (!ok) return; const t0 = Date.now(); log(`⏰ 매일 자동(동시 진행): '${asName(S1)}' 시작 — ${due.why}`); const hb = setInterval(() => SCHED_RUN().set({ runs: { [due.key]: { beat: nowIso() } } }, { merge: true }).catch(() => {}), 5 * 60000);
      const tm = S1.maxMin ? setTimeout(() => { PAR_STOP[S1.job.slice(4)] = true; }, S1.maxMin * 60e3) : null; let err = null;
      try { await PAR_JOBS[S1.job.slice(4)](); } catch (e) { err = e.message; } finally { clearInterval(hb); if (tm) clearTimeout(tm); }
      const st = err === '멈춤' ? 'stop' : err ? 'error' : 'done'; await SCHED_RUN().set({ runs: { [due.key]: { by: PC_NAME, at: nowIso(), st: new Date(t0).toISOString(), state: st, ms: Date.now() - t0, err: err || null, job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0, par: true } } }, { merge: true });
      try { window.__rnJobDone && window.__rnJobDone(S1.job, Date.now() - t0, st, 'sched'); } catch (e) {}
      log(`⏰ 매일 자동(동시 진행): '${asName(S1)}' ${st === 'done' ? '끝' : '멈춤 — ' + err} (${Math.round((Date.now() - t0) / 60000)}분)`, st === 'done' ? 0 : 1); } catch (e) { log('⏰ 동시 진행 확인 실패: ' + (e.code || e.message), 1); } finally { parBusy = false; } }
  let schedBusy = false;
  async function schedMark(due) { /* 건너뛴 회차(늦음·최근에 함)도 적어 둠 — 다시 할 때가 되지 않게 · 이유가 보이게 */ let ok = false;
    await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s = await tx.get(SCHED_RUN()); const r = (s.exists && s.data().runs) || {}; if (r[due.key]) return; const up = { [due.key]: { by: PC_NAME, at: nowIso(), state: due.mark, why: due.why, job: due.slot.job, slot: due.slot.id } }; due.merge.filter((k) => !r[k]).forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: JSON.parse(JSON.stringify(up)) }, { merge: true }); ok = true; }); /* (1.89.1) 빈 값(undefined)이 섞이면 Firebase가 invalid-argument로 거절 → ⏰ 매일 자동이 1분마다 같은 회차에서 막혔음(HOME 10/20 17:00~) — 빈 값은 빼고 씀 */
    if (ok) log(`⏰ '${asName(due.slot)}': ${due.why}`); }
  /* (1.63.10) 자동 회차가 기다린 까닭 기록 — 1분마다 확인할 때 못 시작한 까닭(수동 작업·고객 작업·다른 PC 알라딘 작업·일시 정지 등)을 이어 붙여 두었다가,
   *  회차를 시작할 때 '정한 시각부터 지금까지 무엇을 기다렸는지'를 회차 기록(waited)에 남김 → 📊 실제 밀림 분석이 까닭을 정확히 보여 줌 (이 PC 메모리만 · 하루치) */
  const SCHED_WAIT = []; const schedWaitNote = (why) => { const t = Date.now(); const L = SCHED_WAIT; const z = L[L.length - 1]; if (z && z[1] === why && t - z[2] < 150e3) { z[2] = t; return; } L.push([t, why, t]); while (L.length > 600 || (L.length && t - L[0][2] > 864e5)) L.shift(); };
  const schedWaitSum = (from) => { const M = {}; for (const [a, why, b] of SCHED_WAIT) { if (b < from) continue; M[why] = (M[why] || 0) + Math.max(1, Math.round((b - Math.max(a, from)) / 60e3)); } return Object.entries(M).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([w, m]) => ({ why: w, min: m })); };
  /* (1.63.12) 🌐 남는 PC 돕기 (PC마다 켜고 끔 · 기본 켬) — 이 PC가 놀고 있고 다른 PC가 🎯 집중 벤치마킹 한 바퀴를 도는 중이면, 그 바퀴에 같이 들어가 아무도 안 읽는 판매자를 읽음(판매자 단위로 나눔).
   *  ⏰ 매일 자동의 공개 읽기 일(벤치마킹·시장 지표·탐색 등)도 담당 PC가 바쁘면 이 PC가 먼저 잡아 함 · 로그인 줄 일(주문·출고·상품 조회·고객)은 그대로 담당 PC만 */
  const pubHelpOn = () => { if (pubPcMode()) return false; /* (1.66.0) 공개 전용 PC가 있으면 사무실 PC는 돕지 않음 */ try { return GM_getValue('rn-pubHelp', true) !== false; } catch (e) { return true; } };
  setInterval(async () => { try { if (PUBONLY && BUD && !(budLeft('bench') > 0)) return; /* (1.67.0) 로거: 벤치마킹 부류 몫이 없으면 돕지 않음 */ if (!pubHelpOn() || running || schedBusy || window.__rnPaused || !auth.currentUser || (window.__rnRest && window.__rnRest()) || window.__rnReloading) return;
      const now = Date.now(); const reg = (await JOBREG().get()).data() || {}; const mainB = Object.entries(reg).find(([k, v]) => /^job:bench$/.test(k) && v && v.pc !== PC_ID && now - (v.at || 0) < 5 * 60e3); if (!mainB) return;
      const fj = (await C('prd_jobs').doc('benchForce').get()).data(); if (!fj || fj.done) return; const left = (fj.list || []).filter((k) => !(fj.fin || {})[k]); if (left.length < 2) return;
      const lkp = (await LOCKP().get()).data(); if (laneBusy(lkp, true)) return;
      log(`🌐 남는 PC 돕기: ${mainB[1].name || '다른 PC'}가 도는 🎯 한 바퀴에 같이 들어감 — 남은 판매자 ${left.length}명 중 아무도 안 읽는 판매자부터`); window.__rnHelper = true; try { await runJob('benchHelp'); } finally { window.__rnHelper = false; } } catch (e) {} }, 120e3);
  /* (1.71.2) 정한 칸 하나 돌리기 — 새로 시작한 회차와 새로고침 뒤 이어가는 회차가 같이 씀 · pre = 새로고침 전에 이미 돈 시간(ms) */
  async function schedExec(S1, due, t0, pre) { const kind = S1.job.split(':')[0], key2 = S1.job.slice(4); const tRun = Date.now(); CUR_SEG = tRun; PROG_NOW = null; const progOf = () => (PROG_NOW && PROG_NOW.at >= tRun ? { prog: { i: PROG_NOW.i, n: PROG_NOW.n, l: PROG_NOW.l } } : {}); /* (1.74.0) 진행 수치 */
      const hb = setInterval(() => SCHED_RUN().set({ runs: { [due.key]: { beat: nowIso(), ...progOf() } } }, { merge: true }).catch(() => {}), 5 * 60000);
      let timedOut = false; const tm = S1.maxMin ? setTimeout(() => { timedOut = true; log(`⏰ '${asName(S1)}': 정한 최대 ${S1.maxMin}분이 지나 지금 항목까지 저장하고 멈춤 — 다음 회차에 그 자리부터`, 1); try { if (kind === 'prd') window.__rnPrd.pause(); else window.__rnCrm.pause(); } catch (e) {} }, Math.max(60e3, S1.maxMin * 60e3 - pre)) : null;
      let res, err = null; window.__rnAutoSlot = due.key;
      try { if (kind === 'prd') { window.__rnAuto = true; res = await runJob(key2, { sched: true }); err = lastRunErr || (lastRunSt === 'stop' && res !== false ? '멈춤' : null); }
        else { const r0 = await window.__rnCrm.start(key2, { fresh: false }); res = r0 === undefined ? false : r0; if (r0 === 'error') err = '고객 작업 오류 (고객 탭 기록 확인)'; else if (r0 === 'paused') err = '멈춤'; if (tm) clearTimeout(tm); if (!err && !timedOut && r0 !== undefined && !['bulk', 'upload'].includes(key2) && window.__rnCrm.upload) await window.__rnCrm.upload(); } }
      catch (e) { err = e.message; } finally { window.__rnAuto = false; window.__rnAutoSlot = null; clearInterval(hb); if (tm) clearTimeout(tm); }
      if (res === false) { schedWaitNote('다른 PC·탭이 작업 중(시작 못 함)'); await SCHED_RUN().set({ runs: { [due.key]: firebase.firestore.FieldValue.delete() } }, { merge: true }); const first = !SCHED_BACK[due.key]; const LF = window.__rnLaneFail; const tabOnly = LF && LF.holder === '이 PC의 다른 탭' && Date.now() - LF.at < 30e3; const backM = tabOnly ? 1.5 : 10; SCHED_BACK[due.key] = Date.now() + backM * 60e3; if (first) log(`⏰ '${asName(S1)}': ${tabOnly ? '이 PC의 닫히는 중인 다른 탭(새로고침 직후)이 아직 쥐고 있어 1분 반 뒤 다시' : '다른 PC·탭이 작업 중이라 10분 뒤 다시 (그사이 1분마다 다시 시도하지 않음)'}`, 1); return; } /* (1.84.3) 새 판 새로고침 직후 옛 탭 표시 때문에 10분을 버리던 것(10/17 23:38) */ /* (1.63.8 점검) 예전엔 1분마다 다시 잡고 지우기를 되풀이(읽기·쓰기 낭비) */
      /* (1.71.2) 새 판·메모리 정리·원격 업데이트로 새로고침하느라 멈춘 것이면 이 회차를 '멈춤'으로 끝내지 않음 — 새 탭이 같은 회차로 그 자리부터 이어감(그동안 다른 칸이 끼어들지 않음)
       *  예전: '■ 멈춤'으로 적혀 오늘 그 칸은 끝난 것이 되고, 새 탭에서는 ⏰가 이어가기(15초 뒤)보다 먼저 다음 칸(늦은 일반 칸)을 잡아 벤치마킹이 끊김(10/15 22:06) */
      if (kind === 'prd' && window.__rnPaused && !window.__rnReloading && (err === '멈춤' || lastRunSt === 'stop')) { GM_setValue('rnu-resume-slot-paused', { key: due.key, slot: S1.id, job: S1.job, k: key2, why: due.why, tries: due.tries || 0, t0, pre: pre + (Date.now() - tRun), at: Date.now() }); await SCHED_RUN().set({ runs: { [due.key]: { beat: nowIso(), paused: nowIso(), by: PC_NAME } } }, { merge: true }).catch(() => {}); log(`⏰ '${asName(S1)}' (${due.why}): 일시정지 — 하던 자리를 저장하고 이 회차는 끝내지 않음 · ▶ 다시 시작하면 같은 회차로 그 자리부터`); lastBusyAt = Date.now(); return; } /* (1.72.0) ■ 중단(일시정지)도 새로고침처럼 이어감 */
      if (kind === 'prd' && window.__rnReloading && GM_getValue('rnu-resume-after-reload', null) === key2) { GM_setValue('rnu-resume-slot', { key: due.key, slot: S1.id, job: S1.job, k: key2, why: due.why, tries: due.tries || 0, t0, pre: pre + (Date.now() - tRun), at: Date.now() }); await SCHED_RUN().set({ runs: { [due.key]: { beat: nowIso(), reload: nowIso(), by: PC_NAME } } }, { merge: true }).catch(() => {}); log(`⏰ '${asName(S1)}' (${due.why}): 새로고침 뒤 새 탭에서 이 회차 그대로 이어감 — 끝난 것으로 적지 않음`); return; }
      if (err === '멈춤' && BUD_STOP && BUD_STOP === key2) err = `오늘 ${AS.TIER[tierOfKey(key2)].l} 몫(이월 포함)을 다 써 저장하고 멈춤 — 다음에 그 자리부터`; /* (1.67.0) */
      const pe = PREEMPT && PREEMPT.key === due.key ? PREEMPT : null; if (pe) PREEMPT = null; CUR_SEG = 0; const stoppedHere = err === '멈춤' || lastRunSt === 'stop';
      if (pe && !timedOut && stoppedHere && pe.rank <= 5) { /* (1.74.0) 정한 시각·조건 칸이 자리를 내줌 → 같은 회차로 이어가기 표 · 회차 기록 'yield' */ const ms = pre + (Date.now() - tRun); const y = { key: due.key, slot: S1.id, job: S1.job, k: key2, why: due.why, tries: due.tries || 0, t0, pre: ms, pt: (AS.planOf && AS.planOf(due.key)) || t0, rank: pe.rank, day: AS.keyParts(due.key).day, name: asName(S1), at: Date.now() };
        YSTK_SET([...YSTK().filter((x) => x.key !== due.key), y]); await SCHED_RUN().set({ runs: { [due.key]: { state: 'yield', by: PC_NAME, beat: nowIso(), at: nowIso(), ms, yieldAt: nowIso(), ...progOf(), yields: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), why: pe.why, ms }) } } }, { merge: true }).catch(() => {});
        log(`⏸ '${asName(S1)}' 자리 내줌 (${Math.round(ms / 60000)}분 함) — ${pe.why} 먼저 · 끝나면 같은 회차로 이어감`); lastBusyAt = Date.now(); return; }
      const yd = pe && stoppedHere && !timedOut ? pe : null; if (yd) err = `💤 양보 — ${yd.why} 먼저 (다음 틈에 그 자리부터)`; /* (1.73.0) 💤 쉬는 칸 */
      const st = yd && /^💤/.test(err || '') ? 'stop' : timedOut ? 'timeout' : /^멈춤$|몫/.test(err || '') ? 'stop' : err ? 'error' : 'done';
      await SCHED_RUN().set({ runs: { [due.key]: { by: PC_NAME, at: nowIso(), st: new Date(t0).toISOString(), state: st, ms: pre + (Date.now() - tRun), err: err || null, job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0, ...progOf(), ...(yd && /^💤/.test(err || '') ? { yield: true } : {}) } } }, { merge: true });
      log(`⏰ 매일 자동: '${asName(S1)}' ${st === 'done' ? '끝' : st === 'timeout' ? '최대 시간이라 멈춤' : '멈춤 — ' + err} (${Math.round((pre + Date.now() - tRun) / 60000)}분)`, st === 'done' ? 0 : 1);
      lastBusyAt = Date.now(); /* 실제로 일을 했을 때만 '쉼'을 다시 셈 */
  }
  /* (1.71.2) 새로고침 뒤 같은 회차 이어가기 — 회차 기록(running·beat)을 그대로 두고 그 칸으로 다시 돌림(일반 칸이 끼어들지 않음 · 최대 시간은 앞서 돈 시간만큼 빼고) */
  window.__rnSchedResume = async (rs) => { const S1 = (AS && AS.slotsOf ? AS.slotsOf(SCHED) : []).find((x) => x.id === rs.slot) || { id: rs.slot, job: rs.job, maxMin: 0 }; if (schedBusy) { for (let i = 0; i < 20 && schedBusy; i++) await sleep(1500); } schedBusy = true;
    try { await SCHED_RUN().set({ runs: { [rs.key]: { beat: nowIso(), state: 'running', by: PC_NAME, resumedAt: nowIso() } } }, { merge: true }); await schedExec(S1, { key: rs.key, why: rs.why + ' · 새로고침 뒤 이어감', tries: rs.tries || 0, merge: [] }, rs.t0 || Date.now(), +rs.pre || 0); }
    catch (e) { log('⏰ 이어가기 실패: ' + (e.code || e.message), 1); } finally { schedBusy = false; } };
  /* (1.72.1) 🔁 예기치 않게 끊긴 회차 이어가기 — Tampermonkey 업데이트·크롬/PC 다시 켜짐·절전 깨어남·탭 닫힘처럼 '안전한 새로고침'을 거치지 않고 끊기면
   *  그 회차는 Firebase에 '하는 중'(이 PC 이름)으로 남아 25분 뒤 '신호 끊김'이 되고 그날은 다시 하지 않았음(10/16 08:58 로거: 07:00 도서 정보·시장 지표가 Tampermonkey 업데이트로 끊긴 뒤 멈춤)
   *  → 이 PC의 수집기 탭이 뜨면(쉬는 탭 아님) 이 PC 이름으로 '하는 중'에 남은 회차(마지막 신호 6시간 안)를 찾아 같은 회차로 저장된 자리부터 이어감 · 그동안 ⏰는 새 칸을 잡지 않음
   *  · 정식 이어가기(안전한 새로고침·■ 중단)가 남아 있으면 그쪽이 맡음 · 동시 진행 칸은 제외 */
  window.__rnResumePending = window.__rnResumePending || Date.now();
  setTimeout(async function orphanResume() { orphanResume.n = (orphanResume.n || 0) + 1; const again = () => { if (orphanResume.n < 48) { window.__rnResumePending = Date.now(); setTimeout(orphanResume, 15000); } else if (!GM_getValue('rnu-resume-after-reload', null)) window.__rnResumePending = 0; };
    try { if (GM_getValue('rnu-resume-after-reload', null)) return; /* 정식 이어가기(안전한 새로고침)가 맡음 — 그쪽이 대기 표시를 지움 */ if (GM_getValue('rnu-resume-slot', null) || GM_getValue('rnu-resume-slot-paused', null) || GM_getValue('rnu-resume-manual', null)) { window.__rnResumePending = 0; return; } /* ■ 중단해 둔 일은 ▶ 다시 시작이 이어감 */
      if (window.__rnPaused) { window.__rnResumePending = 0; return; } if (window.__rnReloading || (window.__rnRest && window.__rnRest())) { if (window.__rnRest && window.__rnRest()) { window.__rnResumePending = 0; return; } return again(); }
      if (!AS || !SCHED || !auth.currentUser || !window.__rnSchedRunsAt) return again(); try { if (PUBONLY && !TGATE.ok) return again(); } catch (e) {}
      if (running || schedBusy) { window.__rnResumePending = 0; return; }
      const now = Date.now(); const L = Object.entries(SCHED_RUNS || {}).filter(([k, r]) => r && r.state === 'running' && String(r.by || '') === String(PC_NAME) && r.job && !PAR_JOBS[String(r.job).slice(4)] && now - AS.toMs(r.beat || r.at) < 6 * 3600e3).sort((a, b) => AS.toMs(b[1].st || b[1].at) - AS.toMs(a[1].st || a[1].at));
      window.__rnResumePending = 0; if (!L.length) return; const [key, r] = L[0]; const k = String(r.job).slice(4); if (String(r.job).startsWith('prd:') && !JOBS[k]) return;
      for (const [k2, r2] of L.slice(1)) await SCHED_RUN().set({ runs: { [k2]: { state: 'stop', at: nowIso(), err: '멈춤 — 새로고침으로 끊김(더 최근 회차를 이어감)' } } }, { merge: true }).catch(() => {});
      const st = AS.toMs(r.st || r.at) || now; const pre = Math.max(0, AS.toMs(r.beat || r.at) - st);
      log(`⏰ 새로고침·다시 켜짐으로 끊겼던 '${(JOBS[k] || [k])[0]}' (${r.why || key}) 회차를 같은 회차로 저장된 자리부터 이어감`, 1);
      await window.__rnSchedResume({ key, slot: r.slot || key.split('@')[0], job: r.job, k, why: (r.why || '') + ' · 끊긴 뒤', tries: r.tries || 0, t0: st, pre, at: now }); } catch (e) { window.__rnResumePending = 0; } }, 8000);
  /* (1.72.0) ▶ 다시 시작(일시정지 풀림) → ■ 중단 때 저장해 둔 정한 칸 회차를 같은 회차로 그 자리부터 · 사람이 누른 일(정한 칸이 아닌 것)도 그 일부터 이어감 · 날이 바뀌었으면 이어가지 않음(그 회차는 '멈춤'으로 끝냄) */
  setInterval(async () => { try { if (window.__rnPaused || running || schedBusy || window.__rnReloading) return; const rs = GM_getValue('rnu-resume-slot-paused', null); const mj = GM_getValue('rnu-resume-manual', null);
      if (rs) { GM_setValue('rnu-resume-slot-paused', null); const kday = String(rs.key || '').split('@')[1]; if (kday && AS && kday !== AS.kst(Date.now()).day) { await SCHED_RUN().set({ runs: { [rs.key]: { by: PC_NAME, at: nowIso(), state: 'stop', err: '멈춤 — 일시정지 중 날이 바뀜', ms: +rs.pre || 0 } } }, { merge: true }).catch(() => {}); log(`⏰ 일시정지해 둔 '${(JOBS[rs.k] || [rs.k])[0]}' 회차는 날이 바뀌어 이어가지 않음 — 저장한 자리는 다음 회차가 이어 씀`, 1); return; }
        if (!AS || !SCHED || !auth.currentUser) { GM_setValue('rnu-resume-slot-paused', rs); return; } try { if (PUBONLY && !TGATE.ok) { GM_setValue('rnu-resume-slot-paused', rs); return; } } catch (e) {} log(`▶ 다시 시작: ⏰ '${(JOBS[rs.k] || [rs.k])[0]}' (${rs.why})을 같은 회차로 저장한 자리부터 이어감`); window.__rnSchedResume(rs); return; }
      if (mj && mj.k && JOBS[mj.k] && Date.now() - (mj.at || 0) < 24 * 3600e3) { GM_setValue('rnu-resume-manual', null); try { if (PUBONLY && !TGATE.ok) { GM_setValue('rnu-resume-manual', mj); return; } } catch (e) {} log(`▶ 다시 시작: 일시정지 전에 하던 '${JOBS[mj.k][0]}'을 저장한 자리부터 이어감`); window.__rnAuto = true; runJob(mj.k).finally(() => { window.__rnAuto = false; }); } } catch (e) {} }, 4000);
  /* 사람이 누른 일을 하는 중 일시정지되면 그 일을 기억(정한 칸 회차는 위 schedExec가 기억) */
  setInterval(() => { try { if (window.__rnPaused && running && curKey && !window.__rnAutoSlot && !window.__rnHelper && JOBS[curKey] && !GM_getValue('rnu-resume-manual', null)) GM_setValue('rnu-resume-manual', { k: curKey, at: Date.now() }); } catch (e) {} }, 2000);
  /* (1.71.2) 한 번만: 10/15 22:06 새 판(1.71.0) 새로고침 때 '멈춤'으로 끝나 버린 오늘 🎯 집중 벤치마킹 회차를 같은 회차로 이어감(그 뒤 늦은 일반 칸이 끼어들었던 것) — 로거 · 그날만 · 그 시각에 멈춘 기록만 */
  setTimeout(async function fix1015() { try { if (!PUBONLY || GM_getValue('rn-fix1015', 0)) return; if (new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) === '2026-10-15' && !fix1015.n) window.__rnResumePending = Date.now(); /* 확인하는 동안 ⏰가 새 칸을 잡지 않게 */ if (!SCHED || !AS || !auth.currentUser) { if (!fix1015.n || fix1015.n < 20) { fix1015.n = (fix1015.n || 0) + 1; setTimeout(fix1015, 15000); } else window.__rnResumePending = 0; return; }
      const day = AS.kst(Date.now()).day; if (day !== '2026-10-15') { GM_setValue('rn-fix1015', 1); window.__rnResumePending = 0; return; } const a0 = Date.parse('2026-10-15T13:05:30Z'), a1 = Date.parse('2026-10-15T13:07:30Z');
      const hit = Object.entries(SCHED_RUNS || {}).find(([k, r]) => k.includes('@2026-10-15@') && r && r.state === 'stop' && r.job === 'prd:bench' && Date.parse(r.at) >= a0 && Date.parse(r.at) <= a1); GM_setValue('rn-fix1015', 1); if (!hit) { window.__rnResumePending = 0; return; }
      const [key, r] = hit; for (let i = 0; i < 240 && (running || schedBusy); i++) { window.__rnResumePending = Date.now(); await sleep(15000); } /* 새로고침에 끊긴 다른 일이 먼저 이어지고 있으면 그것이 끝날 때까지(최대 1시간) — 그동안 ⏰는 새 칸을 잡지 않음 */ window.__rnResumePending = 0; if (running) return; log(`⏰ 22:06 새 판 새로고침으로 끊겼던 '${(JOBS.bench || ['🎯'])[0]}' (${r.why || key}) 회차를 저장된 자리부터 이어감`, 1);
      await window.__rnSchedResume({ key, slot: r.slot, job: 'prd:bench', k: 'bench', why: r.why || '', tries: r.tries || 0, t0: Date.parse(r.st) || Date.now(), pre: +r.ms || 0, at: Date.now() }); } catch (e) { window.__rnResumePending = 0; } }, 3000);
  let HO_AT = 0, HO_N = 0, HO_BACK = 0; /* (1.72.3) 🔁 넘겨받을 일 — 10분마다 한 번만 확인(읽기 1건) · 담당 PC(정했으면)만 */
  async function handoffDue() { try { const own = asOwn(); if (own && own.pc && String(own.pc) !== String(PC_NAME)) return false; if (Date.now() - HO_AT > 10 * 60e3) { HO_AT = Date.now(); const qs = await C('prd_handoff').where('status', '==', 'todo').limit(300).get(); HO_N = qs.size; } return HO_N > 0; } catch (e) { return false; } }
  /* (1.73.0) 지금 할 차례인 칸 — schedTick과 💤 양보 확인이 같이 씀 */
  function schedDues(now, idleMs) { return AS.due(SCHED, SCHED_RUNS, { now, pc: PC_NAME, own: asOwn(), anyPc: (job) => ((pubHelpOn() || PUBONLY) && String(job || '').startsWith('prd:') && isPubKey(String(job).slice(4))) || (spreadOn() && !isPubKey(String(job || '').slice(4))), /* (1.89.11) 🔀 정범님 10/21: 켜진 사무실 PC가 로그인·외부 일을 나눠 맡음(같은 회차는 먼저 잡은 PC 하나 — schedStart 트랜잭션) · 비로그인 알라딘 일은 그대로 로거 */ pubAll: PUBONLY, bud: PUBONLY ? BUD : null, mainBusy: PUBONLY && !!running && isPubKey(running) && tierOfKey(running) === 'main', crmOk: !!(window.__rnCrm && window.__rnCrm.start), idleMs, bootAt: BOOT_AT, stats: JSTATS }).filter((d) => (!PUBONLY || (TGATE.ok && String(d.slot.job || '').startsWith('prd:') && isPubKey(String(d.slot.job).slice(4)))) && !(pubPcMode() && String(d.slot.job || '').startsWith('prd:') && isPubKey(String(d.slot.job).slice(4)))); } /* (1.64.0) 공개 전용 PC = 공개 일만 · (1.65.0) 테더링 확인 뒤에만 · (1.66.0) 공개 전용 PC가 있으면 사무실 PC는 공개 일을 빼고 */
  /* (1.74.0) ⏰ 차례 정하기(정범님 10/16) — 로거·사무실 PC 모두 같은 규칙
   *  0 사람이 누른 일(수집기 단추·웹앱에서 사람이 누른 요청) — 끼어들지 않음(다른 일을 모두 비키게 함)
   *  1 주문·출고 짧은 요청(발송 요청 다시 읽기) — 사람 일 말고는 모두 비키게 함
   *  2 정한 시각(시각·간격·매월) — 시각이 오면 하던 일(사람 일 빼고)을 지금 항목까지 저장하고 바로 시작 · 같이 기다리면 이른 시각부터, 같은 시각이면 칸 순서
   *    → 비킨 칸은 '자리 내줌(yield)'으로 적고, 앞 일이 끝나면 같은 회차로 그 자리부터 이어감(최대 시간은 앞서 돈 만큼 빼고)
   *  5 조건 칸(다른 칸 뒤·오래되면·켠 날 처음·멈춘 회차 다시) — 칸 순서 · 로거는 주요가 할 차례면 일반이 기다림
   *  6 자동 요청(🔁 로거가 못 한 일 넘겨받기 · 맡긴 그룹 시장 지표)
   *  7 💤 PC가 쉬면 칸   8 ✨ 쉴 때 하는 일(시간표 밖 · 목록 순서 · 로거 알라딘 목록 맨 끝은 끝없는 탐색) */
  let PREEMPT_HIT = false; let RUN_CTX = null; /* 칸이 아닌 자동 일: 'urgent' · 'req6' · 'rest:<일>' · 'manualReq' */ let CUR_SEG = 0; /* 지금 칸 회차의 이번 토막 시작 */
  const YSTK = () => { try { const L = GM_getValue('rnu-yield-stack', []); return Array.isArray(L) ? L : []; } catch (e) { return []; } };
  const YSTK_SET = (L) => { try { GM_setValue('rnu-yield-stack', L); } catch (e) {} };
  const keyTimed = (k) => { const t = (AS.keyParts(k).tag || '').replace(/~r\d+$/, ''); return /^\d{2}:\d{2}$/.test(t) || /^e\d{4}$/.test(t); };
  const rankOfKey = (k) => (/@i\d{4}$/.test(k) ? 7 : !/~r\d+$/.test(k) && keyTimed(k) ? 2 : 5);
  const dueSyncOk = (d, now) => d.mark === 'run' && !((SCHED_BACK[d.key] || 0) > now) && !asMissing(d.slot) && !(d.slot.job === 'prd:shipRead' && cloudOn()) && (d.slot.job.startsWith('crm:') ? !!(window.__rnCrm && window.__rnCrm.start) : !!JOBS[d.slot.job.slice(4)] && !PAR_JOBS[d.slot.job.slice(4)]);
  async function dueLaneOk(d, C0) { const kind = d.slot.job.split(':')[0]; if (kind === 'crm' && window.__rnCrm.otherBusy && window.__rnCrm.otherBusy()) { schedWaitNote('고객 작업(다른 탭)'); return false; }
    if (kind === 'prd') { const pubJ = isPubKey(d.slot.job.slice(4)); if (pubJ) { if (C0.lkp === undefined) C0.lkp = (await LOCKP().get()).data() || {}; if (laneBusy(C0.lkp, true)) { schedWaitNote('🌐 공개 읽기 줄이 다 참(다른 PC들)'); return false; } } else { if (C0.lk === undefined) C0.lk = (await LOCK().get()).data() || {}; if (laneBusy(C0.lk)) { schedWaitNote('다른 PC·탭이 알라딘 작업 중'); return false; } } } return true; }
  /* 끼어들기 확인(15초마다) — 지금 하는 일보다 앞 차례 일이 생기면 지금 항목까지 저장하고 비킴 */
  setInterval(() => { try { if (PREEMPT || !AS || !SCHED || !SCHED.on || window.__rnPaused || window.__rnReloading) return; const k = window.__rnAutoSlot; if (!running && !k) return; const now = Date.now();
      const cur = k ? { rank: rankOfKey(k), st: CUR_SEG || now } : RUN_CTX === 'urgent' ? { rank: 1 } : RUN_CTX === 'req6' ? { rank: 6 } : RUN_CTX && RUN_CTX.startsWith('rest:') ? { rank: 8 } : { rank: 0 }; if (cur.rank === 0) return; let why = null;
      if (REQ_PEND) why = '웹앱에서 사람이 누른 요청'; else if (SHIP_PEND && cur.rank > 1) why = '발송 요청 다시 읽기';
      if (!why && cur.rank >= 2) { const ds = schedDues(now, 0).filter((d) => d.key !== k && dueSyncOk(d, now)); const t = ds.find((d) => d.cls === 0 && (cur.rank > 2 || (d.pt || 0) > cur.st)); if (t) why = `정한 시각 '${asName(t.slot)}' (${t.why})`;
        if (!why && cur.rank > 2) { const st = YSTK().find((y) => y.key !== k && y.day === AS.kst(now).day && (cur.rank > (y.rank || 5))); if (st && cur.rank > 5) why = `자리 내주고 기다리던 '${st.name || st.job}' 이어가기`; }
        if (!why && cur.rank > 5) { const c = ds.find((d) => d.cls === 1); if (c) why = `'${asName(c.slot)}' 칸 차례(${c.why})`; }
        if (!why && cur.rank > 6) { if (!PUBONLY && !SCHED.handoffOff && HO_N > 0 && Date.now() > HO_BACK) why = `🔁 로거가 못 한 일 ${HO_N}건`; else if (MET_PEND) why = '맡긴 그룹 시장 지표'; }
        if (!why && cur.rank > 7) { const c = ds.find((d) => d.cls === 2); if (c) why = `💤 '${asName(c.slot)}'`; }
        if (!why && cur.rank === 8 && RUN_CTX) { const e = restEarlier(RUN_CTX.slice(5)); if (e) why = `✨ 쉴 때 하는 일 — 앞 순서 '${(JOBS[e.slice(4)] || [e])[0]}'를 다시 볼 때`; } }
      if (!why) return; PREEMPT = { key: k || null, ctx: RUN_CTX, why, at: now, rank: cur.rank }; PREEMPT_HIT = true; const nm = k ? asName((AS.slotsOf(SCHED).find((x) => x.id === (SCHED_RUNS[k] || {}).slot) || { job: (SCHED_RUNS[k] || {}).job || '' })) : (JOBS[running] || [running || ''])[0];
      log(`${cur.rank === 7 ? '💤' : cur.rank === 8 ? '✨' : '⏸'} '${nm}' 자리 내줌: ${why} 먼저 — 지금 항목까지 저장하고 멈춤${cur.rank <= 5 ? ' · 끝나면 같은 회차로 그 자리부터 이어감' : ' · 멈춘 자리는 다음에 이어감'}`);
      const kind = k ? String((SCHED_RUNS[k] || {}).job || '').split(':')[0] : 'prd'; try { if (kind === 'crm') window.__rnCrm.pause(); else window.__rnPrd.pause(); } catch (e) {} } catch (e) {} }, 15000);
  /* (1.73.0) 다른 일 하는 중이라 미뤄 둔 요청 — 손이 비면 바로 · (1.74.0) 사람 요청·발송 요청만 여기서(맡긴 시장 지표는 차례 6이라 ⏰가 칸들 뒤에) */
  const OTHER_PEND = () => !!(REQ_PEND || MET_PEND || SHIP_PEND);
  setInterval(async () => { try { if (running || schedBusy || window.__rnPaused || window.__rnReloading || (window.__rnRest && window.__rnRest()) || !auth.currentUser) return;
      if (REQ_PEND) { REQ_PEND = 0; PREEMPT = null; const d = await C('prd_jobs').doc('request').get(); await reqHandle(d); return; }
      if (SHIP_PEND) { SHIP_PEND = 0; PREEMPT = null; window.__rnShipAt = 0; await runCtx('urgent', 'shipRead'); return; }
      if (MET_PEND && !(SCHED && SCHED.on)) { MET_PEND = 0; runJob('metricsReq'); return; } } catch (e) {} }, 20000);
  async function runCtx(ctx, key, opt) { RUN_CTX = ctx; try { return await runJob(key, opt); } finally { RUN_CTX = null; if (PREEMPT && !PREEMPT.key) PREEMPT = null; lastBusyAt = Date.now(); } }
  /* 자리 내준 회차 이어가기 */
  async function yieldResume(y) { const L = YSTK().filter((x) => x.key !== y.key); YSTK_SET(L); const S1 = AS.slotsOf(SCHED).find((x) => x.id === y.slot) || { id: y.slot, job: y.job, maxMin: 0 };
    await SCHED_RUN().set({ runs: { [y.key]: { beat: nowIso(), state: 'running', by: PC_NAME, resumedAt: nowIso(), resumes: firebase.firestore.FieldValue.arrayUnion(nowIso()) } } }, { merge: true }); log(`⏰ 자리 내줬던 '${asName(S1)}' (${y.why}) 회차를 같은 회차로 그 자리부터 이어감`);
    await schedExec(S1, { key: y.key, why: y.why + ' · 자리 내준 뒤 이어감', tries: y.tries || 0, merge: [] }, y.t0 || Date.now(), +y.pre || 0); }
  /* 날이 바뀐 자리 내줌·기록만 남은 자리 내줌 정리 */
  let YCLEAN_AT = 0;
  async function yieldClean() { if (Date.now() - YCLEAN_AT < 5 * 60e3) return; YCLEAN_AT = Date.now(); const day = AS.kst(Date.now()).day; const L = YSTK(); const keep = L.filter((y) => y.day === day); const drop = L.filter((y) => y.day !== day);
    const up = {}; drop.forEach((y) => (up[y.key] = { state: 'stop', at: nowIso(), err: '멈춤 — 자리 내주고 기다리는 동안 날이 바뀜(저장한 자리는 다음 회차가 이어 씀)', ms: +y.pre || 0 }));
    Object.entries(SCHED_RUNS || {}).forEach(([k, r]) => { if (r && r.state === 'yield' && String(r.by || '') === String(PC_NAME) && !keep.some((y) => y.key === k)) up[k] = { state: 'stop', at: nowIso(), err: '멈춤 — 자리 내준 기록만 남음(이 PC의 이어가기 표가 없음)' }; });
    if (drop.length) YSTK_SET(keep); if (Object.keys(up).length) await SCHED_RUN().set({ runs: up }, { merge: true }).catch(() => {}); }
  /* (1.74.0) ✨ 쉴 때 하는 일 — 정한 시각·조건 칸·요청이 하나도 없을 때(차례 8) · 목록 순서 · 끝낸 일은 1시간 뒤 다시 봄 · 로거 알라딘 목록 맨 끝은 끝없는 탐색(받침) */
  const REST_ST = () => { try { return GM_getValue('rnu-rest-st', {}) || {}; } catch (e) { return {}; } }; const REST_SET = (j, v) => { const o = REST_ST(); o[j] = { ...(o[j] || {}), ...v }; try { GM_setValue('rnu-rest-st', o); } catch (e) {} };
  const biFocus = () => !!PUBONLY && !tetherLeft(); /* (1.77.7) 🎯 와이파이 집중: 로거의 테더링(알라딘 길)이 끊겼거나 남은 양이 없을 때 — 쉬는 시간 없이 외부 도서 정보만 */
  const tetherLeft = () => PUBONLY && TGATE.ok && (!BUD || BUD.left.main > 0 || BUD.left.gen > 0);
  const restListMain = () => { if (!AS || !AS.restOf || !SCHED) return []; const R0 = AS.restOf(SCHED); if (!R0.on) return []; if (PUBONLY) return tetherLeft() ? [...R0.lgA, AS.REST_SAFETY].filter((j) => isPubKey(String(j).slice(4))) : []; /* (1.76.0) 로거 테더링은 벤치마킹만 — 쉴 때 일도 벤치마킹 계열만 */ return R0.ofA.filter((j) => !(pubPcMode() && isPubKey(j.slice(4)))); };
  const restListExt = () => { if (!AS || !AS.restOf || !SCHED) return []; const R0 = AS.restOf(SCHED); if (!R0.on) return []; if (PUBONLY) return helperVerOk('1.6.0') ? (tetherLeft() ? R0.lgE : R0.lgN) : []; return R0.ofE; };
  const restEligible = (j, now) => { const k = j.slice(4); if (!JOBS[k]) return false; const st = REST_ST()[j] || {}; if ((st.backAt || 0) > now) return false; if (st.doneAt && now - st.doneAt < (j === AS.REST_SAFETY ? 10 : biFocus() ? 5 : 60) * 60e3) return false; /* (1.77.7) 로거 테더링이 끊긴 동안(와이파이 집중)은 5분만 쉬고 다시 */ if (PUBONLY && isPubKey(k) && !(budLeft(k) > 0)) return false; return true; };
  const restEarlier = (j) => { const L = restListMain(); const i = L.indexOf(j); if (i <= 0) return null; const now = Date.now(); return L.slice(0, i).find((x) => !PAR_JOBS[x.slice(4)] && restEligible(x, now)) || null; };
  async function restRun(j, par) { const k = j.slice(4); const day = AS.kst(Date.now()).day; const key = `rest_${k}@${day}@r${AS.hm4(AS.kst(Date.now()).min)}`; const t0 = Date.now(); if (SCHED_RUNS[key]) return;
    await SCHED_RUN().set({ runs: { [key]: { by: PC_NAME, at: nowIso(), st: nowIso(), beat: nowIso(), state: 'running', job: j, slot: 'rest', rest: true, why: '✨ 쉴 때 하는 일', ...(par ? { par: true } : {}) } } }, { merge: true }).catch(() => {});
    log(`✨ 쉴 때 하는 일: '${(JOBS[k] || [k])[0]}' 시작${par ? ' (외부 조회 · 함께 돎)' : ''}`); if (!par) PROG_NOW = null; const progOf = () => (par ? (PAR_NOW[k] ? { prog: { l: String(PAR_NOW[k]).slice(0, 60) } } : {}) : PROG_NOW && PROG_NOW.at >= t0 ? { prog: { i: PROG_NOW.i, n: PROG_NOW.n, l: PROG_NOW.l } } : {}); const hb = setInterval(() => SCHED_RUN().set({ runs: { [key]: { beat: nowIso(), ...progOf() } } }, { merge: true }).catch(() => {}), 5 * 60000); let res, err = null;
    try { if (par) { RESTX.busy = true; RESTX.k = k; res = await PAR_JOBS[k](); } else res = await runCtx('rest:' + j, k, { sched: true }); if (!par) err = lastRunErr || (lastRunSt === 'stop' && res !== false ? '멈춤' : null); } catch (e) { err = e.message; } finally { clearInterval(hb); if (par) { RESTX.busy = false; RESTX.k = null; } }
    if (res === false || ['nolease', 'nohelper', 'off'].includes(res)) { REST_SET(j, { backAt: Date.now() + 10 * 60e3 }); await SCHED_RUN().set({ runs: { [key]: firebase.firestore.FieldValue.delete() } }, { merge: true }).catch(() => {}); return; }
    const ms = Date.now() - t0; const st = err === '멈춤' ? 'stop' : err ? 'error' : 'done'; if (st === 'done') REST_SET(j, { doneAt: Date.now(), backAt: 0 }); else if (st === 'error') REST_SET(j, { backAt: Date.now() + 30 * 60e3 });
    const pg = progOf(); await SCHED_RUN().set({ runs: { [key]: { by: PC_NAME, at: nowIso(), st: new Date(t0).toISOString(), state: st, ms, err: err || null, job: j, slot: 'rest', rest: true, why: '✨ 쉴 때 하는 일', ...pg, ...(st === 'stop' ? { yield: true } : {}), ...(par ? { par: true } : {}) } } }, { merge: true }).catch(() => {});
    log(`✨ 쉴 때 하는 일: '${(JOBS[k] || [k])[0]}' ${st === 'done' ? '끝 — 1시간 뒤 새로 할 것이 있는지 다시 봄' : st === 'stop' ? '자리 내줌(멈춘 자리는 다음에 이어감)' : '멈춤 — ' + err + ' · 30분 뒤 다시'} (${Math.round(ms / 60000)}분)`, st === 'error' ? 1 : 0); lastBusyAt = Date.now(); }
  async function restMainTick(C0) { const now = Date.now(); const L = restListMain(); for (const j of L) { if (PAR_JOBS[j.slice(4)] || !restEligible(j, now)) continue; if (!(await dueLaneOk({ slot: { job: j } }, C0))) { REST_SET(j, { backAt: now + 10 * 60e3 }); return; } await restRun(j, false); return; } }
  const RESTX = { busy: false, k: null };
  setInterval(async () => { try { if (RESTX.busy || parBusy || !AS || !SCHED || !SCHED.on || !auth.currentUser || window.__rnPaused || window.__rnReloading || (window.__rnRest && window.__rnRest())) return; const now = Date.now(); const L = restListExt(); const j = L.find((x) => PAR_JOBS[x.slice(4)] && restEligible(x, now)); if (j) await restRun(j, true); } catch (e) {} }, 30000);
  setInterval(() => { try { if (!RESTX.busy || !RESTX.k) return; const L = restListExt(); const i = L.indexOf('prd:' + RESTX.k); const now = Date.now(); if (i < 0) { PAR_STOP[RESTX.k] = true; return; } if (L.slice(0, i).some((x) => PAR_JOBS[x.slice(4)] && restEligible(x, now))) { PAR_STOP[RESTX.k] = true; log(`✨ 쉴 때 외부 조회: 앞 순서 일을 다시 볼 때라 '${(JOBS[RESTX.k] || [RESTX.k])[0]}' 자리 내줌`); } } catch (e) {} }, 60000);
  const SCHED_ERR = { m: '', at: 0 };
  async function schedTick() { if (!AS || schedBusy || !auth.currentUser) return; if (SCHED && SCHED.on) { const why = running ? `${RUN_CTX ? '' : '수동 작업 '}'${(JOBS[running] || [running])[0]}'` : window.__rnReloading ? '새 판 다시 불러오는 중' : window.__rnPaused ? '수집기 일시 정지' : window.__rnRest && window.__rnRest() ? '쉬는 시간' : window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy() ? '고객 작업(이 PC)' : null; if (why) { schedWaitNote(why); return; } }
    if (running || window.__rnReloading || window.__rnPaused || (window.__rnRest && window.__rnRest())) return; if (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()) return; if (!SCHED || !SCHED.on) return;
    if (window.__rnResumePending && Date.now() - window.__rnResumePending < 12 * 60e3) { schedWaitNote('새로고침 뒤 하던 일 이어가기 먼저'); return; } if (GM_getValue('rnu-resume-slot-paused', null) || GM_getValue('rnu-resume-manual', null)) { schedWaitNote('일시정지 전에 하던 일 이어가기 먼저'); return; } /* (1.71.2) 이어가기가 남아 있으면 새 칸을 잡지 않음 */
    if (REQ_PEND || SHIP_PEND) { schedWaitNote('웹앱 요청·발송 요청 먼저'); return; } /* (1.74.0) 차례 0·1 */
    schedBusy = true; PREEMPT = null;
    try { await yieldClean(); const now = Date.now(); const dues = schedDues(now, now - lastBusyAt); const day = AS.kst(now).day;
      for (const d of dues.filter((x) => x.mark !== 'run' && !(x.slot.job === 'prd:shipRead' && cloudOn()))) await schedMark(d).catch(() => {});
      const C0 = {}; const ok = dues.filter((d) => dueSyncOk(d, now)); const stk = YSTK().filter((y) => y.day === day);
      /* 차례 2: 정한 시각 + 자리 내준 정한 시각 회차 — 이른 시각부터 */
      const A = [...ok.filter((d) => d.cls === 0).map((d) => ({ d, pt: d.pt || 0 })).sort((a, b) => a.pt - b.pt), ...stk.filter((y) => (y.rank || 5) === 2).map((y) => ({ y, pt: y.pt || 0 })).sort((a, b) => a.pt - b.pt)]; /* 지금 할 차례인 정한 시각이 먼저(그 일 때문에 자리를 내준 것이므로), 그다음 자리 내준 회차(이른 시각부터) */
      /* 차례 5: 자리 내준 조건 회차 먼저, 그다음 조건 칸(칸 순서) */
      const B = [...stk.filter((y) => (y.rank || 5) !== 2).map((y) => ({ y })), ...ok.filter((d) => d.cls === 1).map((d) => ({ d }))];
      for (const c of [...A, ...B]) { if (c.y) { await yieldResume(c.y); return; } if (await dueLaneOk(c.d, C0)) { await schedStart(c.d); return; } }
      /* 차례 6: 자동 요청 */
      if (!PUBONLY && !SCHED.handoffOff && Date.now() > HO_BACK && await handoffDue()) { HO_BACK = Date.now() + 10 * 60e3; log(`🔁 로거가 못 한 일(19금 등) ${HO_N}건 — 넘겨받음 (차례 6 · 정한 시각 칸이 오면 비킴 · ⏰ 늘 도는 일에서 끌 수 있음)`); window.__rnAuto = true; try { const r = await runCtx('req6', 'handoff'); if (r !== false) HO_AT = 0; } finally { window.__rnAuto = false; } return; }
      if (MET_PEND) { MET_PEND = 0; log('맡긴 그룹 시장 지표를 이어서 (차례 6)'); await runCtx('req6', 'metricsReq'); return; }
      /* 차례 7: 💤 PC가 쉬면 */
      for (const d of ok.filter((x) => x.cls === 2)) if (await dueLaneOk(d, C0)) { await schedStart(d); return; }
      /* 차례 8: ✨ 쉴 때 하는 일 */
      await restMainTick(C0);
    } catch (e) { const m = `${e.code || ''}${e.code && e.message ? ': ' : ''}${String(e.message || '').slice(0, 220)}`; if (m !== SCHED_ERR.m || Date.now() - SCHED_ERR.at > 30 * 60e3) { SCHED_ERR.m = m; SCHED_ERR.at = Date.now(); log('⏰ 매일 자동 확인 실패: ' + m, 1); } /* (1.89.1) 까닭(어느 칸·어느 값)까지 · 같은 실패는 30분에 한 번만 */ } finally { schedBusy = false; if (PREEMPT_HIT) { PREEMPT_HIT = false; setTimeout(schedTick, 2500); } /* 자리를 내줬으면 1분을 기다리지 않고 바로 다음 차례 */ } }
  async function schedStart(due) { const S1 = due.slot; const t0 = Date.now();
    let ok = false; await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s = await tx.get(SCHED_RUN()); const r = (s.exists && s.data().runs) || {}; if (r[due.key]) return; const pl = AS.planOf ? AS.planOf(due.key) : null; const wt = pl && Date.now() - pl > 3 * 60e3 ? schedWaitSum(pl) : []; const up = { [due.key]: { by: PC_NAME, at: nowIso(), st: nowIso(), beat: nowIso(), state: 'running', job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0, ...(wt.length ? { waited: wt } : {}) } }; due.merge.filter((k) => !r[k]).forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: JSON.parse(JSON.stringify(up)) }, { merge: true }); ok = true; }); /* (1.89.1) 빈 값(undefined)이 섞이면 Firebase가 invalid-argument로 거절 → ⏰ 매일 자동이 1분마다 같은 회차에서 막혔음(HOME 10/20 17:00~) — 빈 값은 빼고 씀 */
    if (!ok) return; log(`⏰ 매일 자동: '${asName(S1)}' 시작 — ${due.why}`);
    await schedExec(S1, due, t0, 0); }
  /* 개요 화면용: 다음에 저절로 할 일 (정한 시각·간격만 — 조건 칸은 때를 미리 모름) */
  window.__rnSchedNext = () => { if (!SCHED) return { known: false }; if (!SCHED.on) return { known: true, on: false }; const { min } = kstNow(); let best = null;
    const dow = AS.kst(Date.now()).dow, dowT = (dow + 1) % 7; const own = asOwn(); /* (1.63.8 점검) 요일·PC 거르기·담당 PC도 봄 — 이 PC가 하지 않을 칸을 '다음'으로 보이지 않게 */
    for (const s of AS.slotsOf(SCHED)) { if (!s.on) continue; if (s.pcs && !s.pcs.includes(String(PC_NAME))) continue; if (!s.pcs && own && own.pc && String(own.pc) !== String(PC_NAME)) continue; let cand = [];
      if (s.trig.t === 'time') cand = s.trig.times.map((t) => AS.tMin(t)); else if (s.trig.t === 'month' && AS.timesToday) cand = AS.timesToday(s.trig, Date.now()).map((t) => AS.tMin(t)).filter((m) => m > min); /* (1.63.1) 매월 정한 날 — 오늘이 고른 날일 때만 */
      else if (s.trig.t === 'every') { const f = s.win ? AS.tMin(s.win.from) : 0; for (let m = f, i = 0; i < 288; m += s.trig.min, i++) { const mm = m % 1440; if (AS.inWin(s, mm)) cand.push(mm); if (m - f >= 1440) break; } }
      for (const m of cand) { if (s.days && !s.days.includes(m > min ? dow : dowT)) continue; const d = m > min ? m - min : m + 1440 - min; if (!best || d < best.d) best = { d, t: AS.hm(m), label: asName(s), tomorrow: m <= min }; } }
    return { known: true, on: true, next: best }; };
  /* (1.57.4) 회차 기록(prd_jobs/autoSched.runs)은 날마다 쌓여 한 문서(1MB) 한도에 닿을 수 있음 → 40일 지난 회차는 달마다 prd_jobs/autoSched_YYYY-MM 문서로 옮겨 보관(지우지 않음 · 옮기기와 빼기를 한 묶음으로 = 둘 다 되거나 둘 다 안 됨) */
  /* (1.63.6 전체 점검) 한 문서의 색인 칸 한도(4만 개)에 먼저 닿음: 15분마다·1시간마다 칸이 40일이면 회차 수천 개 × 칸 8개 → 거의 4만 → 넘으면 모든 PC의 자동 수집 확인·기록이 실패
   *  → 10일 지난 회차는 날마다 prd_jobs/autoSched_YYYY-MM-DD 문서로 옮김(지우지 않음 · 옮기기와 빼기를 한 묶음으로) · 한 번에 최대 3,000개 · 남으면 1시간 뒤 다시 */
  let schedArchAt = 0;
  async function schedArchive() { const { day } = kstNow(); if (Date.now() - schedArchAt < 3600e3 || !auth.currentUser) return; schedArchAt = Date.now(); const cut = new Date(Date.parse(day + 'T00:00:00Z') - 2 * 864e5).toISOString().slice(0, 10); /* (1.89.3) 10일 → 2일: 회차 기록이 한 문서(prd_jobs/autoSched)에 10일치 쌓여 Firebase 문서 한도(색인 항목 수)를 넘어 10/20 17:00부터 모든 PC의 ⏰ 매일 자동이 'too many index entries'로 멈췄음 — 지난 것은 날짜별 보관 문서로(지우지 않음) */
    const old = Object.keys(SCHED_RUNS).filter((k) => { const d = k.split('@')[1] || ''; return d && d < cut; }); if (!old.length) return;
    try { const byD = {}; for (const k of old.slice(0, 3000)) { const d = k.split('@')[1].slice(0, 10); (byD[d] = byD[d] || {})[k] = SCHED_RUNS[k]; }
      const del = {}; for (const m of Object.values(byD)) for (const k of Object.keys(m)) del[k] = firebase.firestore.FieldValue.delete();
      const b = db.batch(); for (const [d, runs] of Object.entries(byD)) b.set(C('prd_jobs').doc('autoSched_' + d), { runs, at: nowIso() }, { merge: true }); b.set(SCHED_RUN(), { runs: del }, { merge: true }); await b.commit();
      log(`⏰ 매일 자동: 2일 지난 회차 기록 ${Object.keys(del).length}개를 날짜별 보관 문서로 옮김(지우지 않음)${old.length > 3000 ? ` · 남은 ${old.length - 3000}개는 1시간 뒤` : ''}`); } catch (e) { schedArchAt = Date.now() - 3300e3; log('⏰ 회차 기록 옮기기 실패(5분 뒤 다시): ' + (e.code || e.message), 1); } }
  const schedHM = (iso) => AS.hm(AS.kst(AS.toMs(iso)).min);
  let schedDrawDay = '';
  function schedDraw() { const el = globalThis.__rnById('rnpSched'); if (!el || !AS) return; const S0 = SCHED || { on: false }; const { day } = kstNow(); schedDrawDay = day; const slots = AS.slotsOf(S0); const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
    const plan = AS.dayPlan(S0, SCHED_RUNS, { now: Date.now() }, asAvgMs);
    /* (1.60.1) 한눈에: 지금 하는 자동 일 · 다음 · 켜진 칸 수 */ const runK = Object.entries(SCHED_RUNS).filter(([k, r]) => r && r.state === 'running' && !AS.isLost(r, Date.now()) && k.split('@')[1] === day).map(([k, r]) => `${asName(byId[r.slot || k.split('@')[0]] || { job: r.job || '' })}${r.par ? '(동시)' : ''} · ${r.by || ''}`); const nx = window.__rnSchedNext ? window.__rnSchedNext() : null;
    const live = `<div class="hint2" style="margin:3px 0;padding:4px 6px;border-radius:6px;background:${runK.length ? '#FFF4E5' : '#EEF4F1'};color:#1E2B28;font-size:11.5px">${runK.length ? `▶ 지금 자동으로 하는 중: <b>${esc3(runK.join(' / '))}</b>` : '⏸ 지금 자동으로 하는 일 없음'}${nx && nx.next ? ` · 다음 <b>${nx.next.tomorrow ? '내일 ' : ''}${esc3(nx.next.t)}</b> ${esc3(nx.next.label)}` : ''} · 켜진 칸 ${slots.filter((x) => x.on).length}/${slots.length}${(() => { const b = asBuiltins().filter((x) => x.on); return b.length ? ` · 늘 도는 일 ${b.map((x) => esc3(x.label.split(' (')[0])).join('·')}` : ''; })()}</div>`;
    const rowOf = (s, ix) => `<div class="sr${s.on ? ' on' : ''}"><label class="sw2"><input type="checkbox" data-sk="${esc3(s.id)}" ${s.on ? 'checked' : ''}><span></span></label><div class="sb"><b>${ix + 1}. ${esc3(asName(s))}${E ? E.missTag(s) : ''}${PAR_JOBS[s.job.slice(4)] ? ' <i style="font-style:normal;background:#3F7FD1;color:#fff;border-radius:6px;padding:0 4px;font-size:10px">동시</i>' : ''}</b><small>${esc3(AS.describe(s, byId))} · ${E ? E.durTxt(s.job) : ''}</small><div class="tl">${E ? E.chips(s, plan, S0) : ''}</div></div></div>`;
    /* (1.70.5) 맡는 곳마다 뚜렷하게 — 로거: 🌐 이 PC가 하는 일(비로그인 알라딘 · 외부 정보) / 🏢 다른 PC·클라우드가 하는 일(흐리게) · 사무실 PC: 🔐 로그인 일 / 🌐 로거가 하는 일 / 🔎 외부 정보 */
    const clsOf = (s) => { try { return AS.classOf ? AS.classOf(s.job) : AS.isPubJob(s.job) ? 'pub' : 'login'; } catch (e) { return 'login'; } }; const ix0 = new Map(slots.map((s, i) => [s.id, i]));
    const grpHtml = (title, sub, list, cls, dim, keep) => list.length || keep ? `<div class="rg ${cls}${dim ? ' dim' : ''}"><div class="rgh">${title} <small>${list.length}칸</small></div>${sub ? `<div class="rgs">${sub}</div>` : ''}${list.map((s) => rowOf(s, ix0.get(s.id))).join('') || '<div class="hint2">아직 없음 — ✏ 칸 편집에서 🌐 일을 더하세요</div>'}</div>` : '';
    const L0 = slots.filter((s) => clsOf(s) === 'login'), P0 = slots.filter((s) => clsOf(s) === 'pub'), X0 = slots.filter((s) => clsOf(s) === 'ext');
    const budTxt = BUD && BUD.left ? `오늘 남은 몫 주요 ${(Math.max(0, BUD.left.main) / 1073741824).toFixed(2)}GB · 일반 ${(Math.max(0, BUD.left.gen) / 1073741824).toFixed(2)}GB${BUD.base ? ` · 이번 달 남은 ${(Math.max(0, BUD.base.E * 0.97 - BUD.base.usedS) / 1073741824).toFixed(1)}GB` : ''}${HELPER && HELPER.today && HELPER.today.jobs ? ` · 🎯 벤치마킹 오늘 ${((HELPER.today.jobs.bench || 0) / 1073741824).toFixed(2)}GB` : ''}` : '';
    const role = PUBONLY ? `<div class="role lg">🌐 <b>로거 (LOGGER)</b> — 이 PC는 알라딘에 로그인하지 않는 일만 · 알라딘은 테더링으로만${TGATE && TGATE.ok ? ' <span class="ok">● 테더링 확인됨</span>' : ` <span class="no">● ${esc3((TGATE && TGATE.why) || '테더링 확인 전')}</span>`}${budTxt ? `<br><small>${budTxt}</small>` : ''}</div>`
      : `<div class="role of">🏢 <b>사무실 PC${asOwnMine && asOwnMine() ? ' — 담당 PC(로그인 일을 먼저 맡음)' : ''}</b> — 🔐 로그인 일 · 🔎 외부 정보 · 🌐 비로그인 알라딘 일은 로거가 함(로거가 없을 때만 손으로)</div>`;
    const rows = PUBONLY ? grpHtml('🌐 이 PC(로거)가 하는 일', '비로그인 알라딘 일(주요·일반 몫 안에서) + 🔎 외부 정보', P0.concat(X0), 'pub', false, true) + grpHtml('🏢 다른 PC·클라우드가 하는 일', '로그인 일 — 이 PC는 하지 않음(보기만)', L0, 'login', true)
      : grpHtml('🔐 로그인 일 — 사무실 PC·클라우드', '', L0, 'login') + grpHtml('🌐 로거가 하는 일', '이 PC는 자동으로 하지 않음(로거가 없을 때만)', P0, 'pub', true) + grpHtml('🔎 외부 정보 — 사무실 PC·클라우드·로거가 나눠 함', '', X0, 'ext');
    el.innerHTML = `<div class="sh2"><label class="sw2 big"><input type="checkbox" id="rnpSchedOn" ${S0.on ? 'checked' : ''}><span></span></label><b>⏰ 매일 자동 수집</b><small class="tw">오늘 ${+day.slice(5, 7)}/${+day.slice(8, 10)}</small><button class="b2" id="rnpSchedEd" style="margin-left:auto;padding:3px 9px;font-size:11.5px;width:auto">✏ 칸 편집</button></div>
      ${role}${live}<div class="hint2">${S0.on ? '켜짐 — 끌 때까지 매일' : '꺼짐 — 켜면 아래 켠 칸을 매일'} · 위 칸이 먼저 · ✓ 끝 ▶ 하는 중 ⌛ 시각 지남(곧 함) ⚠ 멈춤 ⤼ 건너뜀 (마우스를 올리면 이유)</div><div class="sl${S0.on ? '' : ' dim'}">${rows || '<div class="hint2">칸 없음 — ✏ 칸 편집에서 더하세요</div>'}</div>`;
    el.querySelector('#rnpSchedOn').onchange = (e) => SCHED_REF().set({ on: e.target.checked, at: nowIso(), by: PC_NAME }, { merge: true }).then(() => log(`⏰ 매일 자동 수집 ${e.target.checked ? '켬' : '끔'}`)).catch((er) => log('저장 실패: ' + er.message, 1));
    el.querySelectorAll('[data-sk]').forEach((cb) => (cb.onchange = () => asSaveQuick((L) => { const s = L.find((x) => x.id === cb.dataset.sk); if (s) s.on = cb.checked; }, `'${asName(byId[cb.dataset.sk])}' ${cb.checked ? '켬' : '끔'}`)));
    el.querySelector('#rnpSchedEd').onclick = () => asEdOpen(); }
  /* 저장 — 칸 목록 전체를 한 번에(rev로 다른 곳의 저장과 겹치지 않게) + 옛 수집기용 items + 바꾼 기록(달마다 문서에 덧붙임) */
  async function asSave(slots, baseRev, what) { await RA.saveSlots({ db, cfgRef: SCHED_REF(), editsRef: (m) => C('prd_jobs').doc('autoSched_edits_' + m), arrayUnion: (...x) => firebase.firestore.FieldValue.arrayUnion(...x), email: (auth.currentUser || {}).email || null }, slots, baseRev, what, PC_NAME, asLabel); log(`⏰ 매일 자동 칸 저장: ${what || ''}`); }
  async function asSaveQuick(fn, what) { try { const L = AS.slotsOf(SCHED); fn(L); await asSave(L, +((SCHED || {}).rev) || 0, what); } catch (e) { log('⏰ 저장 실패: ' + e.message, 1); schedDraw(); } }
  { let inited = false; auth.onAuthStateChanged((u) => { if (u && !inited) { inited = true; schedInit(); } }); }
  function asEdOpen() { if (!E) return log('⏰ 칸 편집기 공용 파일(readnow-autosched-core.js)을 못 읽음 — GitHub에 올렸는지 확인 후 새로고침', 1); E.open(); }
  function asEdRefresh(runsOnly) { if (E) E.refresh(runsOnly); }
  /* ───────── 실행 ───────── */
  /* ───────── (1.56.0) 📚 출판 판매 통계 — 출판유통통합전산망(KPIPA) 출판산업 통계 → 판매 통계 → 판매 보고서 ─────────
   *  로그인 없이 누구나 보는 공개 표. 일별 · 도서유형별(지금은 종이책만 공개)과 판매채널별(오프라인 대형·지역, 온라인) 각각 부수·종수·매출총액
   *  기간: 웹앱 설정(app_settings/kpipa.days, 기본 730일=2년). 이미 받은 날은 건너뛰고 빠진 날만 + 최근 7일은 늘 다시 읽음(공표 뒤 고쳐질 수 있어서)
   *  받는 법: 그 화면을 한 번 열어 보안 표(CSRF)를 받고 → 화면이 쓰는 것과 같은 조회(POST …/adiStatsSaleReport/search)를 31일씩 · 요청 사이 3~5초
   *  저장: mkt_kpipa/{YYYYMMDD} = { date, onOff:{series:{오프라인(대형서점):{qty,titles,amt},…}}, bookType:{series:{종이책:{…}}} } — 값이 같으면 쓰지 않음, 달라지면 옛 값을 history에 남기고 바꿈(지우지 않음)
   *  자동: 하루 한 번 14:30 뒤(그 전엔 전날 자료가 아직 없음) 이 PC의 수집기 탭이 · 여러 PC면 먼저 맡은 한 대만 */
  const KP_PAGE = 'https://bnk.kpipa.or.kr/home/v3/addition/adiStatsSaleReport';
  const kpReq = (o) => new Promise((res, rej) => GM_xmlhttpRequest({ timeout: 60000, ...o, onload: (r) => res(r), onerror: () => rej(new Error('연결 실패')), ontimeout: () => rej(new Error('응답 없음(60초)')) }));
  const kpYmd = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
  const kpAdd = (ymd, n) => kpYmd(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8)) - 9 * 3600e3 + n * 864e5);
  /* 화면이 돌려주는 조각(HTML)의 첫 표: 머리 1줄 = 묶음 이름(오프라인(대형서점)…/종이책), 머리 2줄 = 부수·종수·금액, 몸 = 날짜마다 한 줄 ("26년 10월05일") */
  function kpParse(html) { const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'); const t = doc.querySelector('table'); if (!t) return null;
    const hr = t.querySelectorAll('thead tr'); if (hr.length < 2) return null; const groups = []; hr[0].querySelectorAll('th').forEach((th) => { if (th.getAttribute('rowspan')) return; const n = +th.getAttribute('colspan') || 1; for (let i = 0; i < n; i++) groups.push(th.textContent.trim()); });
    const subs = [...hr[1].querySelectorAll('th')].map((th) => th.textContent.trim()); if (!groups.length || groups.length !== subs.length) return null;
    const key = (s) => (/부수/.test(s) ? 'qty' : /종수/.test(s) ? 'titles' : /금액/.test(s) ? 'amt' : s);
    const rows = []; t.querySelectorAll('tbody tr').forEach((tr) => { const th = tr.querySelector('th'); const m = th && th.textContent.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/); if (!m) return;
      const y = m[1].length === 2 ? 2000 + +m[1] : +m[1]; const date = `${y}${String(m[2]).padStart(2, '0')}${String(m[3]).padStart(2, '0')}`; const tds = [...tr.querySelectorAll('td')]; if (tds.length !== subs.length) return;
      const series = {}; tds.forEach((td, i) => { const v = +String(td.textContent).replace(/[^\d.-]/g, ''); (series[groups[i]] = series[groups[i]] || {})[key(subs[i])] = Number.isFinite(v) ? v : null; }); rows.push({ date, series }); });
    const cm = (html.match(/cMonth\s*=\s*"(\d{8})"/g) || []).length; return { rows, groups: [...new Set(groups)], cMonth: cm }; }
  let kpTok = null;
  async function kpToken() { const r = await kpReq({ method: 'GET', url: KP_PAGE }); if (r.status >= 400) throw new Error(`판매 보고서 화면을 못 엶 (HTTP ${r.status})`); const m = String(r.responseText || '').match(/m_sCsrf\s*=\s*"([^"]+)"/); if (!m) throw new Error('화면에서 보안 표(CSRF)를 못 찾음 — 화면 모양이 바뀌었을 수 있음'); kpTok = m[1]; return kpTok; }
  async function kpFetch(type, from, to) { for (let tryN = 0; tryN < 2; tryN++) { if (!kpTok || tryN) await kpToken();
      const body = new URLSearchParams({ rdoSearchType: type, rdoSearchPeriod: 'date', txtFromDate: from, txtToDate: to, _csrf: kpTok }).toString();
      const r = await kpReq({ method: 'POST', url: KP_PAGE + '/search', data: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-CSRF-TOKEN': kpTok, 'X-Requested-With': 'XMLHttpRequest', Referer: KP_PAGE } });
      const p = r.status < 400 ? kpParse(r.responseText || '') : null; if (p && p.rows.length) return p;
      if (tryN) throw new Error(`표를 못 받음 (HTTP ${r.status}${r.status < 400 ? ' · 응답 앞부분: ' + String(r.responseText || '').replace(/\s+/g, ' ').slice(0, 160) : ''})`); }
    return null; }
  const uiMain = (...a) => ui(...a); const PAR_NOW = {}, PAR_STOP = {}; /* (1.60.1) 동시 진행 일의 지금 상태·멈춤 */
  async function kpipaPar() { PAR_STOP.kpipa = false; PAR_NOW.kpipa = '시작'; try { return await kpipaJob({ par: true }); } finally { PAR_NOW.kpipa = null; } }
  async function kpipaJob(opt) { const PARm = !!(opt && opt.par); const ui = PARm ? (a) => { PAR_NOW.kpipa = String(a || ''); } : uiMain; const stopNow = () => (PARm ? PAR_STOP.kpipa : stopFlag); /* (1.60.1) 동시 진행이면 진행 표시를 앞 작업과 섞지 않음 */
    const cfg = (await C('app_settings').doc('kpipa').get().catch(() => null))?.data?.() || {}; const days = Math.max(5, Math.min(1900, +cfg.days || 730));
    const now = Date.now(); const kh = new Date(now + 9 * 3600e3).getUTCHours() * 60 + new Date(now + 9 * 3600e3).getUTCMinutes();
    const end = kpAdd(kpYmd(now), kh >= 14 * 60 + 30 ? -1 : -2); const start = kpAdd(end, -(days - 1));
    ui('출판 판매 통계: 이미 받은 날 확인', 0, 0); const have = new Map(); (await C('mkt_kpipa').where(firebase.firestore.FieldPath.documentId(), '>=', start).where(firebase.firestore.FieldPath.documentId(), '<=', '99999999').get()).forEach((d) => { if (/^\d{8}$/.test(d.id)) have.set(d.id, d.data()); }); /* (1.63.12) zx_… (더 가져온 표)는 날짜 줄이 아님 */
    const recent = kpAdd(end, -6); const plan = [];
    for (const type of ['onOff', 'bookType']) { const need = []; for (let d = start; d <= end; d = kpAdd(d, 1)) { const x = have.get(d); if (!x || !x[type] || d >= recent) need.push(d); }
      // 이어진 날짜끼리 31일 이하 묶음으로 (화면 규칙: 5~31일) — 5일보다 짧으면 앞으로 늘려 5일
      let i = 0; while (i < need.length) { let j = i; while (j + 1 < need.length && need[j + 1] === kpAdd(need[j], 1) && j - i < 30) j++; let from = need[i]; const to = need[j]; let n = j - i + 1; if (n < 5) { from = kpAdd(to, -4); n = 5; } plan.push({ type, from, to }); i = j + 1; } }
    log(`📚 출판 판매 통계: ${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6)} ~ ${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6)} (${days}일) · 이미 ${have.size}일 있음 · 받을 묶음 ${plan.length}개 (31일씩, 판매채널별·도서유형별)`);
    let wrote = 0, same = 0, changed = 0, rowsN = 0; const seen = new Set(have.keys()); const groupsSeen = { onOff: new Set(), bookType: new Set() };
    for (let k = 0; k < plan.length; k++) { if (stopNow()) throw new Error('멈춤'); const c = plan[k]; ui('출판 판매 통계 (KPIPA)', k, plan.length, `${c.type === 'onOff' ? '판매채널별' : '도서유형별'} ${c.from}~${c.to}`);
      let p; try { p = await kpFetch(c.type, c.from, c.to); } catch (e) { log(`📚 ${c.type === 'onOff' ? '판매채널별' : '도서유형별'} ${c.from}~${c.to}: ${e.message}`, 1); if (k === 0) throw e; continue; }
      if (p.cMonth && p.cMonth !== p.rows.length) log(`📚 ${c.from}~${c.to}: 표의 날짜 ${p.rows.length}줄 · 그래프 날짜 ${p.cMonth}개 — 수가 달라 표 기준으로 저장`, 1);
      p.groups.forEach((g) => groupsSeen[c.type].add(g)); rowsN += p.rows.length;
      for (const r of p.rows) { const ref = C('mkt_kpipa').doc(r.date); const old = have.get(r.date) || {}; const prev = old[c.type] && old[c.type].series; const sig = JSON.stringify(r.series);
        if (prev && JSON.stringify(prev) === sig) { same++; continue; }
        const up = { date: `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6)}`, [c.type]: { series: r.series, at: nowIso() }, ...W() };
        if (prev) { up.history = firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), type: c.type, old: prev }); changed++; } else wrote++;
        await ref.set(up, { merge: true }); have.set(r.date, { ...old, [c.type]: { series: r.series } }); seen.add(r.date); }
      await sleep(3000 + Math.random() * 2000); }
    const st = { lastRunAt: nowIso(), lastDay: end, from: start, days: seen.size, groups: { onOff: [...groupsSeen.onOff], bookType: [...groupsSeen.bookType] }, by: PC_NAME, wrote, changed };
    await C('app_settings').doc('kpipa').set({ status: st }, { merge: true }).catch(() => {});
    if (groupsSeen.bookType.size > 1 || [...groupsSeen.bookType].some((g) => g !== '종이책')) log(`📚 도서유형에 새 묶음이 보입니다: ${[...groupsSeen.bookType].join(', ')} (전자책·오디오북 공개 시작일 수 있음 — 그대로 함께 저장함)`, 1);
    log(`📚 출판 판매 통계 끝: 받은 날 ${rowsN}줄 · 새로 ${wrote} · 고쳐진 날 ${changed}(옛 값은 history에) · 같아서 건너뜀 ${same} · 모은 날 모두 ${seen.size}일`); 
    try { await kpipaCtg(ui, stopNow, start, end); } catch (e) { if (e.message === '멈춤') throw e; log('📚 주제분류별 판매량 통계 실패: ' + e.message, 1); }
    if (cfg.extra !== false) { try { await kpipaExtra(ui, stopNow); } catch (e) { if (e.message === '멈춤') throw e; log('📚 KPIPA 더 가져오기 실패: ' + e.message, 1); } } }
  /* (1.63.12) 📚 KPIPA 더 가져오기 — 판매 보고서 말고도 같은 '출판산업 통계' 메뉴의 공개 화면(분야별 판매 부수·분야별 판매 순위·판매 동향·독자)을 읽음.
   *  화면 모양을 미리 알 수 없어(이 PC에서만 열 수 있음) 스스로 알아냄: 화면을 열어 ① 조회 주소(…/search)와 보내는 칸 이름(allData)·고르기(라디오·목록)·날짜 칸을 찾고 ② 종류(…Type) 고르기마다
   *  일별(최근 한 달)·월별(최근 13개월)로 조회해 ③ 돌려받은 표를 그대로(머리·줄 글자) 저장 — 숫자만 골라내지 않고 화면의 표 전부(데이터 수집 철칙: 버리지 않음)
   *  저장: mkt_kpipa/zx_화면_종류_기간_YYYYMM { page, title, typeKey, typeVal, typeLabel, period, from, to, tables:[{caption, head:[줄], rows:[줄]}] } — 같으면 안 씀, 바뀌면 옛 표를 history에
   *        mkt_kpipa/zx_probe_화면 = 알아낸 화면 모양(조회 주소·칸 이름·고르기) — 못 읽은 화면도 무엇이 문제인지 보고 고칠 수 있게 */
  const KP_X = [/* (1.74.3) 분야별 판매(주제분류별 판매량 통계)는 kpipaCtg가 주제분류마다 · 분야별 판매 순위는 정범님 10/16 '빼고' — 더 받지 않음(받아 둔 것은 그대로) */ ['adiStatsSaleTrend', '판매 동향'], ['adiStatsSaleReader', '독자(구매자) 판매']];
  const kpTxt = (el) => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  function kpForm(html) { const doc = new DOMParser().parseFromString(html, 'text/html'); const radios = {}, selects = {}, inputs = {};
    doc.querySelectorAll('input[type=radio][name]').forEach((r) => { const lab = (r.id && doc.querySelector(`label[for="${r.id}"]`)) || r.closest('label'); (radios[r.name] = radios[r.name] || []).push({ v: r.value, label: kpTxt(lab) || r.value, on: r.checked || r.hasAttribute('checked') }); });
    doc.querySelectorAll('select[name], select[id]').forEach((sl) => { selects[sl.name || sl.id] = [...sl.options].slice(0, 80).map((o) => ({ v: o.value, label: kpTxt(o), on: o.selected })); });
    doc.querySelectorAll('input[name]:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit])').forEach((i) => { inputs[i.name] = i.value || ''; });
    const ajax = [...new Set((html.match(/["'](\/home\/v3\/addition\/[A-Za-z]+\/search[A-Za-z]*)["']/g) || []).map((x) => x.slice(1, -1)))];
    const keys = []; for (const m of html.matchAll(/allData\s*=\s*\{([\s\S]*?)\}/g)) for (const k of m[1].matchAll(/["']?(\w+)["']?\s*:/g)) if (!keys.includes(k[1])) keys.push(k[1]);
    const tok = (html.match(/m_sCsrf\s*=\s*"([^"]+)"/) || [])[1] || null; const title = kpTxt(doc.querySelector('h3, h2, .tit, title')).slice(0, 80);
    return { radios, selects, inputs, ajax, keys, tok, title }; }
  function kpTables(html) { const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'); const out = [];
    doc.querySelectorAll('table').forEach((t) => { const head = [], rows = []; const hr = t.querySelectorAll('thead tr'); hr.forEach((tr) => { const cells = []; tr.querySelectorAll('th,td').forEach((c) => { const n = Math.min(20, +c.getAttribute('colspan') || 1); for (let i = 0; i < n; i++) cells.push(kpTxt(c)); }); head.push(cells.join('\t')); });
      (t.querySelectorAll('tbody tr').length ? t.querySelectorAll('tbody tr') : t.querySelectorAll('tr')).forEach((tr) => { if (tr.closest('thead')) return; const cells = [...tr.querySelectorAll('th,td')].map(kpTxt); if (cells.some(Boolean)) rows.push(cells.join('\t')); });
      if (rows.length) out.push({ caption: kpTxt(t.querySelector('caption')).slice(0, 120), head: head.slice(0, 4), rows: rows.slice(0, 1500) }); }); return out; }
  /* (1.74.3) 📚 주제분류별 판매량 통계(정범님 10/16) — 도서별(bookType)·판매채널별(saleType) × 전체·1단계 주제분류 21개·2단계 주제분류 × 날짜(일별)
   *  화면(adiStatsCtgSaleCnt): POST …/search { rdoSearchType, rdoSearchPeriod:'date', txtFromDate, txtToDate(YYYYMMDD · 5~31일), searchCtg(분류 번호 · 빈칸 = 전체), depth('1depth'|'2depth') } · 2단계 목록 = POST …/ctlgSearch(같은 값 · 1단계 번호)
   *  저장: mkt_kpipa_ctg/{YYYYMM}_{도서별|판매채널별}_{top|1단계번호} { month, type, grp, d: { 분류번호: { 'YYYYMMDD': 계열 } }, names } — 달마다 한 번 묻고 한 번 씀 · 같으면 안 씀 · 바뀐 날은 옛 값을 h(이력)에
   *  어디까지 받았는지: app_settings/kpipa_ctg.cov['종류|분류'] = { lo, hi }(YYYYMM) · 이번 달(과 1~7일엔 지난달)은 늘 다시 · 멈추면 다음에 그 자리부터 */
  const KP_CTG = 'https://bnk.kpipa.or.kr/home/v3/addition/adiStatsCtgSaleCnt';
  async function kpipaCtg(ui, stopNow, start, end) { const r0 = await kpReq({ method: 'GET', url: KP_CTG }); if (r0.status >= 400) throw new Error(`화면을 못 엶 (HTTP ${r0.status})`); const H0 = String(r0.responseText || ''); let tok = (H0.match(/m_sCsrf\s*=\s*"([^"]+)"/) || [])[1]; if (!tok) throw new Error('보안 표(CSRF)를 못 찾음');
    const tops = [...H0.matchAll(/fnPageView\('searchCtg','(\d+)',this\);"[^>]*>\s*([^<]+?)\s*</g)].map((m) => ({ code: m[1], name: m[2].replace(/\s+/g, ' ').trim() })); if (!tops.length) throw new Error('주제분류 목록을 못 찾음 — 화면 모양이 바뀐 듯');
    const SREF = C('app_settings').doc('kpipa_ctg'); const S0 = ((await SREF.get().catch(() => null)) || { data: () => ({}) }).data() || {}; const cov = { ...(S0.cov || {}) }; const names = { ...(S0.names || {}) }; const subs = { ...(S0.subs || {}) }; tops.forEach((t) => (names[t.code] = t.name)); delete names['']; names._all = '전체'; /* (1.87.0) Firebase는 빈 이름 칸을 못 받음 — '전체'는 _all (예전 names['']로 저장이 늘 실패했음) */ const KC = (c) => c || '_all';
    const post = async (path, data) => { for (let k = 0; k < 2; k++) { const body = new URLSearchParams({ ...data, _csrf: tok }).toString(); const r = await kpReq({ method: 'POST', url: KP_CTG + '/' + path, data: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-CSRF-TOKEN': tok, 'X-Requested-With': 'XMLHttpRequest', Referer: KP_CTG } }); if (r.status < 400) return String(r.responseText || ''); const rr = await kpReq({ method: 'GET', url: KP_CTG }); tok = (String(rr.responseText || '').match(/m_sCsrf\s*=\s*"([^"]+)"/) || [])[1] || tok; } throw new Error('조회 실패'); };
    const mOf = (ymd) => ymd.slice(0, 6); const mAdd = (ym, n) => { const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(4, 6) - 1 + n, 1)); return d.toISOString().slice(0, 7).replace('-', ''); };
    const m0 = mOf(start), m1 = mOf(end); const today = kpYmd(Date.now()); const force = new Set([m1]); if (+today.slice(6) <= 7) force.add(mAdd(m1, -1));
    const keysOf = () => { const K = []; for (const type of ['bookType', 'saleType']) { K.push({ type, ctg: '', depth: '1depth', grp: 'top' }); tops.forEach((t) => K.push({ type, ctg: t.code, depth: '1depth', grp: 'top' })); } for (const type of ['bookType', 'saleType']) tops.forEach((t) => (subs[t.code] || []).forEach((sc) => K.push({ type, ctg: sc, depth: '2depth', grp: t.code }))); return K; };
    /* 2단계 목록(처음 한 번 · 30일마다 다시) */ if (!S0.subsAt || Date.now() - Date.parse(S0.subsAt) > 30 * 864e5) { for (const t of tops) { if (stopNow()) throw new Error('멈춤'); try { const h = await post('ctlgSearch', { rdoSearchType: 'bookType', rdoSearchPeriod: 'date', txtFromDate: kpAdd(end, -6), txtToDate: end, searchCtg: t.code, depth: '1depth' }); const L = [...h.matchAll(/fnDetailPageView\('searchCtg','(\d+)'[^)]*\)[^>]*>\s*([^<]+?)\s*</g)].map((m) => ({ code: m[1], name: m[2].replace(/\s+/g, ' ').trim() })); if (L.length) { subs[t.code] = L.map((x) => x.code); L.forEach((x) => (names[x.code] = x.name)); } } catch (e) {} await sleep(1500 + Math.random() * 1000); }
      await SREF.set({ subs, names, subsAt: nowIso() }, { merge: true }).catch(() => {}); log(`📚 주제분류 2단계 목록: ${Object.values(subs).reduce((a, x) => a + x.length, 0)}개(1단계 ${tops.length}개 아래)`); }
    const K = keysOf(); const plan = []; for (const k of K) { const ck = `${k.type}|${k.ctg}`; const c = cov[ck]; for (let m = m1; m >= m0; m = mAdd(m, -1)) { if (c && m >= c.lo && m <= c.hi && !force.has(m)) continue; plan.push({ ...k, m }); } }
    plan.sort((a, b) => (a.depth === b.depth ? 0 : a.depth === '1depth' ? -1 : 1) || (b.m > a.m ? 1 : b.m < a.m ? -1 : 0)); /* 전체·1단계 먼저, 최근 달부터 */
    const DC = new Map(); log(`📚 주제분류별 판매량 통계: 받을 것 ${plan.length}번(분류 ${K.length / 2}개 × 도서별·판매채널별 × 달) · 이미 받은 곳은 건너뜀`); let saved = 0, same = 0, fail = 0;
    for (let i = 0; i < plan.length; i++) { if (stopNow()) throw new Error('멈춤'); const q = plan[i]; const mf = q.m + '01'; const last = kpAdd(mAdd(q.m, 1) + '01', -1); let from = mf < start ? start : mf, to = last > end ? end : last; if (to < from) continue; if (+to - 0 && kpAdd(from, 4) > to) from = kpAdd(to, -4);
      ui('📚 주제분류별 판매량', i, plan.length, `${q.type === 'bookType' ? '도서별' : '판매채널별'} · ${names[q.ctg] || q.ctg || '전체'} · ${q.m.slice(0, 4)}-${q.m.slice(4)}`);
      let p = null; try { const h = await post('search', { rdoSearchType: q.type, rdoSearchPeriod: 'date', txtFromDate: from, txtToDate: to, searchCtg: q.ctg, depth: q.depth }); p = kpParse(h); } catch (e) { fail++; if (fail >= 8 && !saved) throw new Error('잇달아 실패 — ' + e.message); await sleep(5000); continue; }
      if (!p || !p.rows.length) { fail++; await sleep(2500); continue; }
      const byM = {}; p.rows.forEach((r) => { (byM[mOf(r.date)] = byM[mOf(r.date)] || {})[r.date] = r.series; });
      for (const [ym, days] of Object.entries(byM)) { const did = `${ym}_${q.type}_${q.grp}`; const ref = C('mkt_kpipa_ctg').doc(did); let old = DC.has(did) ? DC.get(did) : ((await ref.get().catch(() => null)) || { data: () => null }).data() || null; /* (1.88.5) 같은 문서(최대 1MB)를 분류마다 다시 받던 것 → 이번 차례에 한 번만 */
        if (old && old.h && JSON.stringify(old).length > 600000) { /* (1.88.5) 이력(h)이 쌓여 문서가 1MB를 넘어 쓰기가 늘 실패(10/20 202610_saleType_top) → 이력을 같은 모음의 이력 문서로 옮김(지우지 않음) */ try { await C('mkt_kpipa_ctg').doc(`${did}__h_${Date.now()}`).set({ hof: did, moved: true, h: old.h, at: nowIso(), ...W() }); await ref.update({ h: firebase.firestore.FieldValue.delete() }); const hn = (old.h || []).length; old = { ...old }; delete old.h; log(`📚 ${did}: 이력 ${hn}줄을 이력 문서(${did}__h_…)로 옮김 — 문서 크기 1MB 한도 때문`); } catch (e) { log('📚 이력 옮기기 실패: ' + (e.code || e.message), 1); } } DC.set(did, old); const prev = (old && old.d && old.d[KC(q.ctg)]) || {}; const chg = {}, hist = []; for (const [dd, sr] of Object.entries(days)) { const a = JSON.stringify(prev[dd] || null), b = JSON.stringify(sr); if (a === b) continue; chg[dd] = sr; if (prev[dd]) hist.push({ at: nowIso(), ctg: q.ctg, day: dd, old: prev[dd] }); }
        if (!Object.keys(chg).length) { same++; continue; } await ref.set({ month: ym, type: q.type, grp: q.grp, d: { [KC(q.ctg)]: chg }, names: { [KC(q.ctg)]: names[KC(q.ctg)] || q.ctg || '전체' }, at: nowIso(), ...W() }, { merge: true }); if (hist.length) await C('mkt_kpipa_ctg').doc(`${did}__h_${Date.now()}`).set({ hof: did, h: hist, at: nowIso(), ...W() }).catch(() => {}); /* (1.88.5) 바뀐 날의 옛 값은 본 문서가 아니라 이력 문서에(본 문서가 1MB를 넘지 않게) */ { const o2 = DC.get(did) || { d: {} }; const dd0 = { ...((o2.d || {})[KC(q.ctg)] || {}), ...chg }; DC.set(did, { ...o2, d: { ...(o2.d || {}), [KC(q.ctg)]: dd0 } }); } saved++; }
      const ck = `${q.type}|${KC(q.ctg)}`; const c = cov[ck] || { lo: q.m, hi: q.m }; c.lo = q.m < c.lo ? q.m : c.lo; c.hi = q.m > c.hi ? q.m : c.hi; cov[ck] = c; if (i % 10 === 9 || i === plan.length - 1) await SREF.set({ cov, names, at: nowIso(), by: PC_NAME }, { merge: true }).catch(() => {});
      await sleep(2500 + Math.random() * 1500); }
    await SREF.set({ cov, names, at: nowIso(), by: PC_NAME, last: { saved, same, fail, plan: plan.length } }, { merge: true }).catch(() => {}); log(`📚 주제분류별 판매량 통계 끝: 새로·바뀜 ${saved} · 같음 ${same} · 못 받음 ${fail}`, fail ? 1 : 0); }
  async function kpipaExtra(ui, stopNow) { const end = kpAdd(kpYmd(Date.now()), -1); let saved = 0, same = 0, failN = 0, skipN = 0;
    for (const [pg, pgName] of KP_X) { if (stopNow()) throw new Error('멈춤'); const url = 'https://bnk.kpipa.or.kr/home/v3/addition/' + pg; let F;
      try { const r = await kpReq({ method: 'GET', url }); if (r.status >= 400) throw new Error('HTTP ' + r.status); F = kpForm(String(r.responseText || '')); } catch (e) { failN++; log(`📚 더 가져오기 '${pgName}' 화면을 못 엶: ${e.message}`, 1); continue; }
      await C('mkt_kpipa').doc('zx_probe_' + pg).set({ page: pg, name: pgName, at: nowIso(), title: F.title, ajax: F.ajax, keys: F.keys, form: JSON.stringify({ radios: F.radios, selects: Object.fromEntries(Object.entries(F.selects).map(([k, v]) => [k, v.slice(0, 30)])), inputs: F.inputs }).slice(0, 60000), tok: !!F.tok, ...W() }, { merge: true }).catch(() => {});
      if (!F.ajax.length || !F.tok) { failN++; log(`📚 더 가져오기 '${pgName}': 조회 주소${F.ajax.length ? '' : '(…/search)'}${F.tok ? '' : '·보안 표'}를 못 찾음 — 화면 모양을 기록해 둠(zx_probe)`, 1); continue; }
      const keys = F.keys.length ? F.keys : Object.keys({ ...F.inputs, ...Object.fromEntries(Object.keys(F.radios).map((k) => [k, 1])), ...Object.fromEntries(Object.keys(F.selects).map((k) => [k, 1])) });
      const typeKey = keys.find((k) => /type/i.test(k) && !/period/i.test(k) && F.radios[k]) || null; const perKey = keys.find((k) => /period/i.test(k) && F.radios[k]) || null; const fromKey = keys.find((k) => /from/i.test(k)), toKey = keys.find((k) => /to(date)?$/i.test(k) && !/from/i.test(k));
      const types = typeKey ? F.radios[typeKey].slice(0, 6) : [{ v: '', label: '기본' }]; const pers = perKey ? ['date', 'month'].filter((p) => F.radios[perKey].some((o) => o.v === p)) : ['date']; if (!pers.length) pers.push(perKey ? (F.radios[perKey].find((o) => o.on) || F.radios[perKey][0]).v : 'date');
      for (const ty of types) for (const per of pers) { if (stopNow()) throw new Error('멈춤');
        const from = per === 'month' ? kpAdd(end, -390).slice(0, 6) : kpAdd(end, -30), to = per === 'month' ? end.slice(0, 6) : end; const body = {};
        for (const k of keys) { if (k === typeKey) body[k] = ty.v; else if (k === perKey) body[k] = per; else if (k === fromKey) body[k] = from; else if (k === toKey) body[k] = to; else if (F.radios[k]) body[k] = (F.radios[k].find((o) => o.on) || F.radios[k][0]).v; else if (F.selects[k]) body[k] = ((F.selects[k].find((o) => o.on) || F.selects[k][0]) || {}).v || ''; else body[k] = F.inputs[k] != null ? F.inputs[k] : ''; }
        body._csrf = F.tok; let T = null, why = ''; { const id0 = `zx_${pg}_${String(ty.v || 'base').replace(/[^\w-]/g, '')}_${per}_${to.slice(0, 6)}`; const p0 = (await C('mkt_kpipa').doc(id0).get().catch(() => null))?.data?.() || {}; if ((p0.missN || 0) >= 2 && Date.now() - Date.parse(p0.lastMissAt || 0) < 7 * 864e5) { skipN++; continue; } } /* (1.89.1) 두 번 잇달아 '표 없음'(그 화면은 표 대신 그림(차트)으로 줌)이면 7일 동안 묻지 않음 — 예전엔 매시간 같은 실패를 세 줄씩 남겼음 */
        try { const r = await kpReq({ method: 'POST', url: 'https://bnk.kpipa.or.kr' + F.ajax[0], data: new URLSearchParams(body).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-CSRF-TOKEN': F.tok, 'X-Requested-With': 'XMLHttpRequest', Referer: url } }); if (r.status >= 400) why = 'HTTP ' + r.status; else { T = kpTables(String(r.responseText || '')); if (!T.length) why = '표 없음 · 응답 앞부분: ' + String(r.responseText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120); } } catch (e) { why = e.message; }
        const id = `zx_${pg}_${String(ty.v || 'base').replace(/[^\w-]/g, '')}_${per}_${to.slice(0, 6)}`; const ref = C('mkt_kpipa').doc(id);
        if (!T || !T.length) { failN++; await ref.set({ missN: firebase.firestore.FieldValue.increment(1), page: pg, name: pgName, typeKey, typeVal: ty.v, typeLabel: ty.label, period: per, from, to, lastMissAt: nowIso(), lastMissWhy: why.slice(0, 200), params: JSON.stringify(body).replace(/"_csrf":"[^"]*"/, '').slice(0, 2000), ...W() }, { merge: true }).catch(() => {}); log(`📚 더 가져오기 '${pgName}' ${ty.label}·${per === 'month' ? '월별' : '일별'}: ${why}`, 1); await sleep(2500); continue; }
        const prev = (await ref.get().catch(() => null))?.data?.(); const sig = JSON.stringify(T);
        if (prev && prev.tables && JSON.stringify(prev.tables) === sig) { same++; } else { try { const hE = prev && prev.tables ? { at: nowIso(), from: prev.from || null, to: prev.to || null, tables: JSON.stringify(prev.tables).slice(0, 200000) } : null; let hist = hE ? firebase.firestore.FieldValue.arrayUnion(hE) : null;
            /* (1.63.15 자동 점검) 문서 하나는 1MB까지 — 일별 표는 달마다 한 문서에 날마다 옛 표가 history로 쌓여 며칠 만에 넘침(그 뒤로 저장이 실패해 남은 화면도 못 받았음). 넘칠 듯하면 쌓인 history를 같은 모음의 보관 문서(zx_…_h시각, archiveOf)로 옮기고(지우지 않음) 새로 시작 */
            if (hE) { const by = (x) => new TextEncoder().encode(x).length; if (by(JSON.stringify(prev.history || [])) + by(hE.tables) + by(sig) > 700000) { await C('mkt_kpipa').doc(`${id}_h${Date.now()}`).set({ archiveOf: id, name: pgName, typeLabel: ty.label, period: per, history: prev.history || [], at: nowIso(), ...W() }); hist = [hE]; log(`📚 '${pgName}' ${ty.label}: 지난 표 기록이 커서 보관 문서로 옮김(${id}_h…)`); } }
            await ref.set({ page: pg, name: pgName, title: F.title, typeKey, typeVal: ty.v, typeLabel: ty.label, period: per, from, to, tables: T, at: nowIso(), lastMissWhy: null, missN: 0, ...(hist ? { history: hist } : {}), ...W() }, { merge: true }); saved++; } catch (e) { failN++; log(`📚 더 가져오기 '${pgName}' ${ty.label}: 저장 실패 — ${e.message}`, 1); await ref.set({ lastMissAt: nowIso(), lastMissWhy: ('저장 실패: ' + e.message).slice(0, 200) }, { merge: true }).catch(() => {}); } }
        ui('출판 통계 더 가져오기', 0, 0, `${pgName} · ${ty.label} · ${per === 'month' ? '월별' : '일별'}`); await sleep(3000 + Math.random() * 2000); } }
    log(`📚 KPIPA 더 가져오기: 새로·바뀐 표 ${saved} · 같아서 건너뜀 ${same}${skipN ? ` · 표를 안 주는 화면이라 쉼 ${skipN}(7일)` : ''}${failN ? ` · 못 읽음 ${failN}(까닭은 mkt_kpipa/zx_… 문서)` : ''}`, failN && !saved ? 1 : 0); return { saved, same, failN }; }
  /* 하루 한 번 자동 (14:30 뒤 · 이 PC의 수집기 탭 · 여러 PC면 먼저 맡은 한 대) — 웹앱 설정에서 끌 수 있음(auto:false) */
  /* (1.60.1) 출판 판매 통계를 하루 한 번(14:35 뒤) 스스로 받던 것 → ⏰ 매일 자동 수집의 칸에서만 · 알라딘을 쓰지 않아 다른 수집과 함께 돎(동시 진행) */
  /* ───────── (1.57.0) 🌐 외부 정보 엔진 — 공용 파일 readnow-ext-core.js(묻는 법·읽는 법·계산)를 이 PC가 돌림 ─────────
   *  무엇: 우리 책(판매중·일시판매중지, ISBN 있는 것)마다 알라딘 밖 정보를 출처별로 모음 — 기본 정보(교보·예스24·구글 북스·알라딘 TTB·카카오·네이버·국립중앙도서관) ·
   *        국내 중고 시세(예스24 중고·번개장터·중고나라·당근) · 외국 시세(eBay·AbeBooks — 기본은 외국 책만) · 도서관 대출(정보나루) · 전자책(리디) · 환율(날마다)
   *  언제: 저절로 — 5분마다 깨어 4분까지 일함(이 PC의 수집기 탭 한 개 · 여러 PC면 한 대만: app_settings/ext_run.lease) · 알라딘 작업과 따로라 알라딘 일을 막지 않음
   *  차례: 판매가 높은 책부터(돈이 큰 책 먼저) · 출처마다 '다시 볼 날'이 지난 책만 · 출처마다 하루 최대 수(설정 ⑱) · 요청 사이 간격(출처마다)
   *  쓰기: 같은 내용이면 다시 쓰지 않고 '확인한 때(chk)'만 · 바뀌면 옛 값을 ext_hist에 남긴 뒤 바꿈 · 못 읽으면 그 출처의 err만(받아 둔 값은 그대로) + 화면 일부를 ext_probe에(하루 한 번)
   *  웹앱이 맡기는 일: shp_cmds 'extLookup'(책 몇 권 지금 받기) · 'extTest'(연결 시험) — 다른 작업 중이어도 바로 */
  /* ───────── (1.57.3) Firebase 규칙 자동 점검 (PC) — 노선표에서 'PC가 쓰는 칸' 모두를 이 PC 계정으로: 시험 문서를 만들고 같은 묶음에서 바로 지움(남는 것 없음)
   *  수집기 판·노선표 판이 바뀐 첫 실행(1분 뒤) · 그 밖엔 하루 한 번 · 결과 rn_status/perm_{PC} → 막히면 웹앱 '오늘 확인할 것'에 빨간 줄 + 이 기록 창에 경고 */
  async function pcPermProbe() { try { if ((window.__rnFeat && !window.__rnFeat('rules')) || !auth.currentUser || (window.__rnRest && window.__rnRest())) return; const R = REGF(); if (!R || !R.COLLECTIONS) return; const key = `${VER}|${R.VERSION}|${auth.currentUser.email || ''}`; const last = GM_getValue('rnu-perm', null); if (last && last.key === key && Date.now() - (last.t || 0) < 24 * 3600e3) return;
      const deny = (e) => /permission|insufficient/i.test(String((e && (e.code || e.message)) || e)); const cols = Object.entries(R.COLLECTIONS).filter(([, v]) => (v.w || []).includes('pc')).map(([k]) => k); const bad = [];
      for (const col of cols) { const ref = C(col).doc('_permprobe_' + Math.random().toString(36).slice(2, 10)); try { const b = db.batch(); b.set(ref, { probe: true, at: nowIso() }); b.delete(ref); await b.commit(); } catch (e) { if (deny(e)) bad.push(col); /* (1.57.7) '따로 만들고 지우기' 다시 하기 없앰 — 시험 문서가 진짜 기록 칸에 남을 수 있었음 */ } }
      GM_setValue('rnu-perm', { key, t: Date.now(), bad }); await C('rn_status').doc('perm_' + PC_NAME).set({ pc: PC_NAME, ver: VER, reg: R.VERSION, email: auth.currentUser.email || null, at: nowIso(), n: cols.length, bad }).catch(() => {});
      if (bad.length) log(`⚠ Firebase 규칙이 막는 칸 ${bad.length}개: ${bad.join(', ')} — 이 칸의 기록이 저장되지 않음 · 웹앱 '오늘 확인할 것'의 빨간 줄을 누르면 고치는 법`, 1); else log(`🔐 Firebase 규칙 점검: PC가 쓰는 칸 ${cols.length}개 모두 열림`); } catch (e) {} }
  setTimeout(() => pcPermProbe(), 60000); setInterval(() => pcPermProbe(), 6 * 3600e3);
  const EXT = () => window.ReadnowExt || globalThis.ReadnowExt;
  const extHttp = (o) => new Promise((res, rej) => GM_xmlhttpRequest({ method: o.method || 'GET', url: o.url, headers: o.headers || {}, data: o.data, anonymous: true /* 이 브라우저의 로그인 쿠키(예스24 판매자 계정 등)를 보내지 않음 — 외부 정보 읽기는 손님으로 */, timeout: 30000, onload: (r) => res({ status: r.status, text: r.responseText || '' }), onerror: () => rej(new Error('연결 실패 (@connect에 없는 주소이거나 네트워크)')), ontimeout: () => rej(new Error('응답 없음(30초)')) }));
  const extKst = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
  /* (1.66.0) 바깥 사이트 화면 그려 읽기 — 보이지 않는 탭으로 열고 리더(맨 위 rnxReader)의 답을 기다림 · 한 번에 하나만(탭이 쌓이지 않게) */
  let EXT_RQ = Promise.resolve();
  /* (1.73.1) 🖼 탭 없이 그려 읽기 — 로컬 도우미 1.6.0의 /render(크롬을 화면 없이 띄워 그 주소를 그림 · 그 화면의 모든 요청은 와이파이 · 알라딘 막음)로 HTML을 받아 리더와 같은 규칙으로 글 링크를 뽑음
   *  로거: 늘 도우미로만(탭을 열면 그 화면의 광고·글꼴·이미지 주소가 테더링으로 나가 테더링을 낭비했음 — 도우미가 없거나 실패하면 탭을 열지 않고 실패로 둠) · 사무실 PC: 도우미가 있으면 도우미, 없으면 예전처럼 탭 */
  let RENDER_HELPER = null; /* null 모름 · true 됨 · false 없음(10분 기억) */ let RENDER_HELPER_AT = 0;
  const extRenderHelper = (url, opt) => new Promise((res) => { const o = opt || {}; const wait = Math.min(30000, Math.max(6000, o.max || 12000));
    GM_xmlhttpRequest({ method: 'POST', url: `http://127.0.0.1:8899/render?url=${encodeURIComponent(url)}&wait=${wait}`, headers: { 'X-RN-Render': '1' }, anonymous: true, timeout: wait + 45000,
      onload: (r) => { let j = null; try { j = JSON.parse(r.responseText); } catch (e) {} if (r.status === 404 || !j) { res({ ok: false, nohelper: true, why: '도우미에 화면 없이 그려 읽기가 없음(도우미 1.6.0 필요)' }); return; } if (!j.ok) { res({ ok: false, why: '도우미 그리기: ' + (j.why || r.status) }); return; }
        try { const doc = new DOMParser().parseFromString(j.html, 'text/html'); let re; try { re = new RegExp(o.re, o.reFlags || ''); } catch (e) { return res({ ok: false, why: '링크 모양이 잘못됨' }); } const none = o.none ? new RegExp(o.none) : null;
          const abs = (a) => { try { return new URL(a.getAttribute('href'), url).href; } catch (e) { return ''; } };
          const txt = (el) => { const out = []; try { const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const v = n.nodeValue.replace(/\s+/g, ' ').trim(); if (v && !(n.parentElement && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement.tagName))) out.push(v); } } catch (e) {} return out.join('\n'); };
          const box = (a) => { let el = a, best = a; for (let k = 0; k < 6 && el && el.parentElement; k++) { el = el.parentElement; const n = el.querySelectorAll('a[href]').length; const tx = el.textContent || ''; if (tx.length > 1500 || [...el.querySelectorAll('a[href]')].filter((x) => re.test(abs(x))).length > 2) break; best = el; if (/\d[\d,]*\s*원/.test(tx) && n <= 6) break; } return best; };
          const L = [...doc.querySelectorAll('a[href]')].filter((a) => re.test(abs(a))).slice(0, 300).map((a) => ({ h: abs(a), t: (txt(a) || a.getAttribute('title') || a.getAttribute('aria-label') || '').slice(0, 400), c: txt(box(a)).slice(0, 700) }));
          const body = (doc.body && doc.body.textContent) || ''; res({ ok: true, links: L, none: !L.length && !!(none && none.test(body)), html: o.html ? j.html.slice(0, 1500000) : null, url, via: 'helper', ms: j.ms }); } catch (e) { res({ ok: false, why: '그린 화면 읽기 실패: ' + e.message }); } },
      onerror: () => res({ ok: false, nohelper: true, why: '도우미에 닿지 못함' }), ontimeout: () => res({ ok: false, why: '도우미 그리기 시간 초과' }) }); });
  const extRender = (url, opt) => { const job = EXT_RQ.then(async () => { if (PUBONLY || RENDER_HELPER !== false || Date.now() - RENDER_HELPER_AT > 10 * 60e3) { const r = await extRenderHelper(url, opt); if (r.nohelper) { RENDER_HELPER = false; RENDER_HELPER_AT = Date.now(); } else RENDER_HELPER = true; if (r.ok || PUBONLY || !r.nohelper) return r; /* 로거는 탭을 절대 열지 않음 */ } return extRenderTab(url, opt); }); EXT_RQ = job.catch(() => {}); return job; };
  const extRenderTab = (url, opt) => new Promise((res) => { const tok = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); const o = opt || {}; const max = Math.min(60000, o.max || 20000);
      try { GM_setValue('rnx_q_' + tok, { re: o.re, reFlags: o.reFlags || '', none: o.none || null, html: !!o.html, max, at: Date.now() }); } catch (e) { return res({ ok: false, why: '저장소 쓰기 실패' }); }
      let tab = null, done = false, lid = null; const fin = (v) => { if (done) return; done = true; try { if (lid != null && typeof GM_removeValueChangeListener === 'function') GM_removeValueChangeListener(lid); } catch (e) {} try { tab && tab.close && tab.close(); } catch (e) {} try { GM_deleteValue('rnx_q_' + tok); GM_deleteValue('rnx_r_' + tok); } catch (e) {} res(v); };
      try { lid = GM_addValueChangeListener('rnx_r_' + tok, (k, ov, nv) => { if (nv) fin(nv); }); } catch (e) {}
      const u = url + (url.includes('?') ? '&' : '?') + 'rnx=' + tok; try { tab = GM_openInTab(u, { active: false, insert: true, setParent: true }); } catch (e) { return fin({ ok: false, why: '탭을 못 엶: ' + e.message }); }
      const poll = setInterval(() => { if (done) return clearInterval(poll); let v = null; try { v = GM_getValue('rnx_r_' + tok, null); } catch (e) {} if (v) { clearInterval(poll); fin(v); } }, 1500); /* 값 듣기가 안 되는 환경 대비 */
      setTimeout(() => { clearInterval(poll); fin({ ok: false, why: `화면 읽기 시간 초과(${Math.round((max + 20000) / 1000)}초)` }); }, max + 20000); });
  const EXT_S = { keys: null, keysAt: 0, cfg: null, cfgAt: 0, cache: {}, next: {}, idx: {}, idxAt: 0, cand: null, candAt: 0, cur: {}, errs: {}, pauseUntil: {}, busy: false, me: 'x' + Math.random().toString(36).slice(2, 7), used: {}, usedDay: null };
  async function extKeys(force) { if (!force && EXT_S.keys && Date.now() - EXT_S.keysAt < 10 * 60000) return EXT_S.keys; let k = {}; try { const d = await C('app_secrets').doc('ext').get(); k = (d.exists && d.data().keys) || {}; } catch (e) { log('🌐 외부 연결 키를 못 읽음: ' + (e.code || e.message) + (/permission/i.test(e.code || e.message) ? ' — Firebase 규칙에 app_secrets 읽기 허용 필요' : ''), 1); } EXT_S.keys = k; EXT_S.keysAt = Date.now(); return k; }
  async function extCfg(force) { const X = EXT(); if (!force && EXT_S.cfg && Date.now() - EXT_S.cfgAt < 5 * 60000) return EXT_S.cfg; let c = {}; try { const d = await C('app_settings').doc('ext').get(); c = d.exists ? d.data() : {}; } catch (e) {} if (c && !c.capMig1017 && c.src && c.src.kakao && +c.src.kakao.cap === 5000) { /* (1.78.1) 한 번만: 설정 ⑱에 예전 기본값(카카오 5,000)이 그대로 적혀 있어 새 기본 25,000(공식 쿼터 30,000)이 안 먹던 것 → 25,000으로(정범님 10/17 '전부 진행') · 사람이 다른 값을 적어 두었으면 그대로 */ try { await C('app_settings').doc('ext').set({ src: { kakao: { cap: 25000 } }, capMig1017: { at: nowIso(), by: PC_NAME, from: 5000 } }, { merge: true }); c.src.kakao.cap = 25000; c.capMig1017 = true; log('🌐 카카오 책 검색 하루 상한 5,000 → 25,000 (공식 쿼터 30,000)'); } catch (e) {} } EXT_S.cfg = X.cfgOf(c); EXT_S.capBase = {}; for (const s0 of EXT_RAMP) if (EXT_S.cfg.src[s0]) { EXT_S.capBase[s0] = EXT_S.cfg.src[s0].cap; const k = Math.max(0, Math.min(10, +((EXT_S.ramp || {})[s0] || {}).k || 0)); if (k) EXT_S.cfg.src[s0].cap = Math.round(EXT_S.cfg.src[s0].cap * (1 + 0.1 * k)); } EXT_S.cfgAt = Date.now(); return EXT_S.cfg; }
  /* (1.78.0) 📈 화면 읽기 출처(교보·예스24·네이버) 하루 상한 천천히 올리기 — 정범님 10/17 '더 늘리는 방안 전부'
   *  전날 상한까지 다 썼고(95% 이상) 그날 그 출처가 막힘·잇단 오류로 쉰 적이 없으면 다음 날 +10%(설정 ⑱의 상한 기준 · 최대 2배)
   *  잇단 오류(5번)·'너무 많이 물음'으로 쉬게 되면 그 자리에서 −30%(한 칸 = 10%씩 3칸) · 기록 ext_run.ramp.{출처} = { k(칸), errDay, day } */
  const EXT_RAMP = ['kyobo', 'yes24', 'naverbook'];
  async function extRampDay() { const X = EXT(); const day = extKst(); const yd = new Date(Date.parse(day + 'T00:00:00+09:00') - 864e5 + 9 * 3600e3).toISOString().slice(0, 10); try { await db.runTransaction(async (tx) => { const d0 = await tx.get(EXT_RUN()); const D = d0.exists ? d0.data() : {}; const R = D.ramp || {}; if (R.day === day) { EXT_S.ramp = R; return; } const cntY = ((D.cnt || {})[yd]) || {}; const out = { day };
      for (const s0 of EXT_RAMP) { const r = R[s0] || {}; let k = Math.max(0, Math.min(10, +r.k || 0)); const base = (EXT_S.capBase || {})[s0] ?? X.SOURCES[s0].cap; const capY = Math.round(base * (1 + 0.1 * k)); const usedY = +cntY[s0] || 0; const up = usedY >= capY * 0.95 && r.errDay !== yd; if (up && k < 10) k++; out[s0] = { k, errDay: r.errDay || null, prevUsed: usedY, prevCap: capY, up: !!up }; }
      tx.set(EXT_RUN(), { ramp: out }, { merge: true }); EXT_S.ramp = out; const ups = EXT_RAMP.filter((s0) => out[s0].up && out[s0].k > ((R[s0] || {}).k || 0)); if (ups.length) setTimeout(() => log(`📈 외부 정보 하루 상한 올림: ${ups.map((s0) => `${X.SOURCES[s0].label} +10% (${out[s0].k * 10}% 위)`).join(' · ')} — 어제 상한까지 다 썼고 막힘이 없었음`), 0); }); EXT_S.cfgAt = 0; } catch (e) {} }
  const extRampDown = (src) => { if (!EXT_RAMP.includes(src)) return; const day = extKst(); const r = (EXT_S.ramp || {})[src] || {}; if (r.errDay === day) return; const k = Math.max(0, (+r.k || 0) - 3); EXT_S.ramp = { ...(EXT_S.ramp || {}), [src]: { ...r, k, errDay: day } }; EXT_S.cfgAt = 0; EXT_RUN().set({ ramp: { [src]: { k, errDay: day } } }, { merge: true }).catch(() => {}); log(`📉 ${src}: 막힘·잇단 오류로 하루 상한을 30% 내림(지금 기본보다 ${k * 10}% 위)`, 1); };
  const EXT_RUN = () => C('app_settings').doc('ext_run');
  /* 맡은 PC 한 대: 4분 넘게 신호가 없으면 다른 PC가 이어받음 */
  async function extLease() { let ok = false; try { await db.runTransaction(async (tx) => { ok = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s = await tx.get(EXT_RUN()); const L = (s.exists && s.data().lease) || null; const mine = L && L.pc === PC_NAME && L.tab === EXT_S.me; const steal = PUBONLY && helperVerOk('1.6.0') && L && !L.pub; /* (1.74.0) 로거(도우미로 탭 없이 그림 · 와이파이)가 살아 있으면 로거가 먼저 — 사무실 PC가 외부 화면 탭을 열지 않게 */ if (L && !mine && !steal && Date.now() - (+L.atMs || 0) < 4 * 60000) return; tx.set(EXT_RUN(), { lease: { pc: PC_NAME, tab: EXT_S.me, atMs: Date.now(), at: nowIso(), pub: !!PUBONLY } }, { merge: true }); ok = true; }); } catch (e) {} return ok; }
  /* 오늘 쓴 수 (출처마다 · 한국 날짜) — 하루 최대를 넘지 않게. 날짜별로 남김(cnt.{날짜}.{출처}) */
  /* 오늘 쓴 수: 매 바퀴 시작마다 서버에서 다시 읽음(여러 PC가 번갈아 맡아도 하루 최대를 넘지 않게) · 실제로 보낸 요청 수만큼 셈(eBay 토큰·교보 검색+상품 화면 등) */
  /* (1.63.6 전체 점검) app_settings/ext_run의 날짜별 칸(cnt 쓴 수 · res 성공·실패)은 날마다 늘어 1년쯤이면 한 문서 색인 한도(4만)에 닿음 → 넘으면 외부 정보가 PC·클라우드 모두 조용히 멈춤
   *  → 15일 지난 날짜 칸은 하루 한 번 지움(오늘·최근 2주만 화면에 씀 · 하루 쓴 수 한도 계산에는 오늘만 씀) */
  let extPruneDay = ''; async function extPrune(D) { const day = extKst(); if (extPruneDay === day || !D) return; extPruneDay = day; const cut = extKst(Date.now() - 15 * 864e5); const FV = firebase.firestore.FieldValue; const up = {};
    for (const f of ['cnt', 'res']) { const ks = Object.keys(D[f] || {}).filter((d) => d < cut); if (ks.length) up[f] = Object.fromEntries(ks.map((d) => [d, FV.delete()])); } if (Object.keys(up).length) await EXT_RUN().set(up, { merge: true }).catch(() => {}); }
  async function extUsedLoad(force) { const day = extKst(); if (!force && EXT_S.usedDay === day) return EXT_S.used; let u = {}; try { const d = await EXT_RUN().get(); if (d.exists) extPrune(d.data()).catch(() => {}); u = ((d.exists && d.data().cnt) || {})[day] || {}; if (d.exists && d.data().ramp) EXT_S.ramp = d.data().ramp; } catch (e) {} const newDay = EXT_S.usedDay !== day; EXT_S.used = { ...u }; EXT_S.usedDay = day; if (newDay || !EXT_S.ramp || EXT_S.ramp.day !== day) await extRampDay(); return EXT_S.used; }
  const extUsedAdd = (src, n) => { n = Math.max(1, n || 1); const day = extKst(); if (EXT_S.usedDay !== day) { EXT_S.used = {}; EXT_S.usedDay = day; } EXT_S.used[src] = (EXT_S.used[src] || 0) + n; return EXT_RUN().set({ cnt: { [day]: { [src]: firebase.firestore.FieldValue.increment(n) } } }, { merge: true }).catch(() => {}); };
  /* 색인: 출처마다 책을 언제 확인했는지(한국 날짜) — ext_index/{출처}_{0~7} . m.{ISBN} = 'YYYY-MM-DD'(받음) 또는 'E YYYY-MM-DD k'(못 읽음 k번째 — 1·3·7·14·30일 뒤 다시) */
  async function extIdxLoad(force) { const X = EXT(); if (!force && EXT_S.idxAt && Date.now() - EXT_S.idxAt < 60 * 60000) return; const out = {}; for (const src of X.ORDER) { out[src] = new Map(); } try { const qs = await C('ext_index').get(); qs.forEach((d) => { const [src] = d.id.split('_'); const m = (d.data() || {}).m || {}; if (out[src]) Object.entries(m).forEach(([k, v]) => out[src].set(k, v)); }); } catch (e) {} EXT_S.idx = out; EXT_S.idxAt = Date.now(); }
  const extIdxSet = (src, isbn, val) => { const X = EXT(); const v = val || extKst(); (EXT_S.idx[src] = EXT_S.idx[src] || new Map()).set(isbn, v); return C('ext_index').doc(`${src}_${X.shard(isbn)}`).set({ m: { [isbn]: v }, ...W() }, { merge: true }).catch(() => {}); };
  const EXT_BACKOFF = [1, 3, 7, 14, 30];
  const extIdxErrK = (src, isbn) => { const v = (EXT_S.idx[src] || new Map()).get(isbn); const m = String(v || '').match(/^E (\d{4}-\d\d-\d\d) (\d+)$/); return m ? +m[2] : 0; };
  /* 한 출처·한 책의 결과 쓰기 — 같으면 확인 시각만 · 바뀌면 옛 값을 ext_hist에 남긴 뒤 · 받아 둔 값이 있는데 '그 책 없음'이 한 번 나오면 바로 바꾸지 않고(잠깐 안 보인 것일 수 있음) 두 번 잇달아 나올 때 바꿈 */
  const extBytes = (x) => { try { return new TextEncoder().encode(JSON.stringify(x)).length; } catch (e) { return JSON.stringify(x).length * 3; } }; /* (1.59.0) 글자 수가 아니라 바이트로(한글은 3바이트) — 출처 하나 150KB까지(한 문서에 출처가 여럿이라 합쳐 1MB 안) */
  async function extSave(src, b, res) { const X = EXT(); const col = X.GROUPS[X.SOURCES[src].grp].col; const ref = C(col).doc(b.isbn); const now = nowIso(); const FV = firebase.firestore.FieldValue;
    if (res.skip) return 'skip'; const snap = await ref.get(); const cur = snap.exists ? snap.data() : null; const prev = cur && cur.src ? cur.src[src] : null;
    if (!res.ok) { const err = { at: now, why: String(res.why || '').slice(0, 300), by: PC_NAME, ...(res.mismatch ? { mismatch: true } : {}) }; if (cur) await ref.update({ [`src.${src}.err`]: err, uploadedAt: TS() }); else await ref.set({ isbn: b.isbn, title: b.title || null, src: { [src]: { err } }, ...W() }, { merge: true });
      if (res.probe) { const pid = `${src}_${extKst().replace(/-/g, '')}`; const pr = C('ext_probe').doc(pid); try { const ex = await pr.get(); if (!ex.exists) await pr.set({ src, isbn: b.isbn, title: b.title || null, why: res.why, url: res.probe.url, len: res.probe.len, head: res.probe.head, at: now, by: PC_NAME, ...W() }); } catch (e) {} }
      return res.mismatch ? 'mismatch' : 'err'; }
    let d = res.d ?? null; if (d) { d = JSON.parse(JSON.stringify(d)); /* Firebase는 undefined를 받지 않음 */ let g = 0; while (extBytes(d) > 150000 && g++ < 12) { if (Array.isArray(d.items) && d.items.length > 5) d.items = d.items.slice(0, Math.ceil(d.items.length / 2)); else if (d.kv) d.kv = null; else break; d.trunc = true; } } const sg = X.sig({ none: !!res.none, d });
    if (prev && prev.sig === sg) { await ref.update({ [`src.${src}.chk`]: now, [`src.${src}.err`]: FV.delete(), [`src.${src}.noneAt`]: FV.delete(), uploadedAt: TS() }); return 'same'; }
    if (res.none && prev && prev.d && !prev.none && !prev.noneAt) { await ref.update({ [`src.${src}.noneAt`]: now, [`src.${src}.chk`]: now, [`src.${src}.err`]: FV.delete(), uploadedAt: TS() }); return 'none1'; }
    if (prev && prev.at) { const hid = `${col}_${b.isbn}_${src}_${String(prev.at).replace(/[^0-9]/g, '').slice(0, 14)}`; const hr = C('ext_hist').doc(hid); try { const ex = await hr.get(); if (!ex.exists) await hr.set({ col, isbn: b.isbn, src, at: prev.at, chk: prev.chk || null, none: !!prev.none, d: prev.d ?? null, sig: prev.sig || null, ...W() }); } catch (e) { log(`🌐 옛 값 보관 실패(${src} ${b.isbn}) — 바꾸지 않음: ${e.message}`, 1); return 'err'; } }
    const obj = { at: now, chk: now, sig: sg, none: !!res.none, d, by: PC_NAME, q: (d && d.q) || null };
    if (cur) await ref.update({ [`src.${src}`]: obj, ...(b.title && !cur.title ? { title: b.title } : {}), uploadedAt: TS() }); else await ref.set({ isbn: b.isbn, title: b.title || null, author: b.author || null, src: { [src]: obj }, ...W() }, { merge: true }); /* (1.59.0·0.11.0) 같은 책을 다른 출처가 막 만들었으면 그 출처 칸을 지우지 않게 */
    return prev ? 'changed' : 'new'; }
  /* 한 책 한 출처: 묻고 → 쓰고 → 색인·오늘 쓴 수·마지막 결과
   *  간격은 사이트(host)마다 — 예스24와 예스24 중고는 한 사이트로 셈 · 자리를 먼저 잡고 기다려 두 일(자동·웹앱 맡김)이 동시에 같은 사이트를 묻지 않게 · 한 번에 여러 화면을 여는 출처(검색 → 상품)는 화면 사이도 쉼 */
  async function extOne(src, b, why) { const X = EXT(); const keys = await extKeys(); const cfg = await extCfg(); const s = X.SOURCES[src]; const h = s.host;
    /* (1.57.4) 정범 지정: 중고 검색은 중고닷 먼저 — 중고닷이 이 책을 아직 안 봤으면 기다리고, 중고닷에서 같은 책을 찾았으면 당근·중고나라·번개장터엔 직접 묻지 않음(찾지 못했거나 중고닷을 못 읽었을 때만 직접) */
    if (X.VIA_JOONGMO && X.VIA_JOONGMO.includes(src) && cfg.src.joongmo && cfg.src.joongmo.on && why !== 'test') { let jm = null; try { const d = await C('ext_used').doc(b.isbn).get(); jm = d.exists && d.data().src ? d.data().src.joongmo : null; } catch (e) {}
      /* (1.66.0) 중고닷이 이 책을 못 읽었으면(오류 표시) 기다리지 않고 직접 — 예전엔 중고닷이 계속 실패하면 세 장터가 영원히 '건너뜀'이었음 */
      if (!jm && extIdxErrK('joongmo', b.isbn) === 0 && (EXT_S.errs.joongmo || 0) < 3) return { src, st: 'skip', why: '중고닷 먼저' }; if (jm.d && X.usedStats(jm.d, cfg.sim, cfg.usedMinPrice).match > 0) { extIdxSet(src, b.isbn); return { src, st: 'viaJm', why: '중고닷에서 찾음' }; } }
    const at = Math.max(Date.now(), EXT_S.next[h] || 0); EXT_S.next[h] = at + s.paceMs * (0.8 + Math.random() * 0.4); if (at > Date.now()) await sleep(at - Date.now());
    let calls = 0; const http = async (o) => { calls++; if (calls > 1) await sleep(Math.min(s.paceMs, 1500)); return extHttp(o); };
    const res = await X.run(src, { isbn: b.isbn, title: b.title, author: b.author, keys, http, render: extRender, cache: EXT_S.cache, cfg }); if (calls > 1) EXT_S.next[h] = Math.max(EXT_S.next[h] || 0, Date.now() + s.paceMs);
    if (res.skip) return { src, st: 'skip', why: res.skip };
    if (res.auth) { /* (1.75.0) 키 문제(없음·Sandbox 키·401)는 책 문제가 아님 — 책마다 '못 읽음' 미룸을 남기지 않고, 키가 바뀔 때까지 이 출처를 쉼(키를 저장하면 10분 안에 다시 시도) */ const sg = X.keySig ? X.keySig(src, keys) : 'x'; if ((EXT_S.authPause || {})[src] !== sg) { EXT_S.authPause = { ...(EXT_S.authPause || {}), [src]: sg }; log(`🌐 ${s.label}: 키 문제로 쉼 — ${res.why} · 웹앱 설정에서 키를 고쳐 저장하면 10분 안에 다시 시도`, 1); try { await EXT_RUN().set({ lastErr: { [src]: { why: res.why, at: nowIso(), auth: true } } }, { merge: true }); } catch (e) {} } return { src, st: 'skip', why: '키 문제 — ' + res.why }; }
    let st; try { st = await extSave(src, b, res); } catch (e) { st = 'err'; res.ok = false; res.why = '저장 실패: ' + (e.code || e.message); }
    if (calls) extUsedAdd(src, calls);
    const xp = why === 'xpool'; /* (1.78.0) 무한 차례 책은 출처 색인에 넣지 않음(색인 문서 1MB 한도) — ext_basic/{ISBN}.bx에 따로 */
    if (st !== 'err' && st !== 'mismatch') { if (!xp) extIdxSet(src, b.isbn); EXT_S.errs[src] = 0; if (EXT_S.pauseN) EXT_S.pauseN[src] = 0; }
    else { const k = Math.min(EXT_BACKOFF.length, extIdxErrK(src, b.isbn) + 1); if (!xp && !/^저장 실패/.test(res.why || '')) extIdxSet(src, b.isbn, `E ${extKst()} ${k}`); /* 같은 책을 날마다 다시 묻지 않게 1·3·7·14·30일 뒤 */
      if (st === 'err') { EXT_S.errs[src] = (EXT_S.errs[src] || 0) + 1; if (res.limit) { EXT_S.pauseUntil[src] = Date.now() + 6 * 3600e3; extRampDown(src); } else if (EXT_S.errs[src] >= 5) { extRampDown(src); EXT_S.pauseN = EXT_S.pauseN || {}; const pn = EXT_S.pauseN[src] = Math.min(5, (EXT_S.pauseN[src] || 0) + 1); const ph = Math.min(24, 2 ** (pn - 1)); EXT_S.pauseUntil[src] = Date.now() + ph * 3600e3; EXT_S.errs[src] = 0; /* (1.72.2 · 클라우드 0.13.4) 계속 실패하는 출처는 쉬는 시간을 1→2→4→8→16시간으로 늘림(한 번이라도 되면 다시 1시간부터) */ log(`🌐 ${s.label}: 5번 잇달아 못 읽어 ${Math.round((EXT_S.pauseUntil[src] - Date.now()) / 3600e3)}시간 쉼 — ${res.why}`, 1); } } }
    { const okR = st !== 'err'; const L0 = { at: nowIso(), ok: st !== 'err', st, why: st === 'err' || st === 'mismatch' ? String(res.why || '').slice(0, 200) : null, isbn: b.isbn, by: PC_NAME, how: why || 'auto' } ; /* (1.24.0 · 클라우드 0.12.2) 출처별 오늘 성공·실패 수(res) + 마지막 실패(lastErr — 성공이 와도 남음) → 웹앱 시장조사 탭 수집 현황에서 '매번 실패'를 바로 봄 */ EXT_RUN().set({ last: { [src]: L0 }, res: { [extKst()]: { [src]: { [okR ? 'ok' : 'err']: firebase.firestore.FieldValue.increment(1) } } }, ...(okR ? {} : { lastErr: { [src]: L0 } }) }, { merge: true }).catch(() => {}); }
    /* (1.57.4) 무엇을 받았는지 한 줄씩(작은 글자 기록 · 웹앱 시장조사 탭 '자동으로 채우기 현황'의 기록에 보임) */
    try { window.__rnLog && window.__rnLog('상품', 'detail', `🌐 ${s.label} ${b.isbn} 『${String(b.title || '').slice(0, 40)}』 → ${{ new: '새로', changed: '바뀜(옛 값 보관)', same: '같음', err: '못 읽음', mismatch: '다른 책', none1: '없음(한 번)' }[st] || st}${res.d && res.d.n != null ? ` ${res.d.n}개` : ''}${st === 'err' || st === 'mismatch' ? ' — ' + String(res.why || '').slice(0, 80) : ''}${why === 'webapp' ? ' (웹앱에서 맡김)' : why === 'test' ? ' (시험)' : ''}`); } catch (e) {}
    try { const CS = window.__rnCS; if (CS) { const k = 'ext:' + src; const kind = ['new', 'changed', 'same'].includes(st) ? 'ok' : st === 'none1' || res.none ? 'none' : st === 'mismatch' ? 'fail' : st === 'err' ? 'fail' : 'skip'; CS.add(k, kind, 1, kind === 'ok' || kind === 'none' ? null : st === 'mismatch' ? '다른 책을 찾음(맞지 않아 쓰지 않음)' : res.why); if (st === 'new' || st === 'changed') CS.add(k, 'n'); if (xp) CS.add(k, 'x'); } } catch (e) {} /* (1.79.0) 📊 n = 새로·바뀐 정보 · x = 무한 차례 */
    return { src, st, why: res.why || null, n: res.d && (res.d.n ?? null), none: !!res.none, cover: (res.d && res.d.cover) || null }; }
  /* 할 책 목록: 판매중·일시판매중지 + ISBN · 판매가 높은 순 · 6시간마다 다시 만듦 */
  /* (1.59.1) 다른 작업(집중 벤치마킹·일괄 등)이 도는 중이라 상품 기록을 아직 안 읽었을 때: 예전엔 빈 목록 → 외부 정보가 그 작업이 끝날 때까지(밤새) 아무 말 없이 쉼.
   *  이제 ① 이 PC 보관본(IndexedDB — 서버 읽기 없음) ② 클라우드가 만든 책 목록(ext_cand) 순서로 써서 작업 중에도 계속함 · 둘 다 없을 때만 쉬고, 쉰다고 기록에 남김 */
  async function extCandsLite() { try { const c = await LCACHE.get(); if (c && Array.isArray(c.rows) && c.rows.length) return { from: '이 PC 보관본', L: c.rows.map(([, v]) => v) }; } catch (e) {}
    try { const m = await C('ext_cand').doc('meta').get(); const M = m.exists ? m.data() : null; if (M && M.v === 2 && M.n && M.parts) { const L = []; for (let i = 0; i < M.parts; i++) { const d = await C('ext_cand').doc('p' + i).get(); if (d.exists) { try { L.push(...JSON.parse(d.data().J || '[]')); } catch (e) {} } } if (L.length === M.n) return { from: '클라우드 책 목록', rows: L.map((r) => ({ isbn: r[0], p: r[1], title: r[2] || null, author: r[3] || null, media: r[4] || null })) }; } } catch (e) {}
    return null; }
  async function extCands() { if (EXT_S.cand && Date.now() - EXT_S.candAt < 6 * 3600e3) return EXT_S.cand; let src = LISTINGS;
    if (!src) { if (running) { const lite = await extCandsLite(); if (!lite) return EXT_S.cand || []; if (lite.rows) { EXT_S.cand = lite.rows; EXT_S.candAt = Date.now() - 5 * 3600e3; /* 1시간 뒤 다시 만듦(작업이 끝났으면 진짜 목록으로) */ log(`🌐 외부 정보: 다른 작업 중이라 ${lite.from}(${lite.rows.length.toLocaleString()}권)으로 이어 감`); return EXT_S.cand; } src = new Map(lite.L.map((v, i) => [i, v])); log(`🌐 외부 정보: 다른 작업 중이라 ${lite.from}으로 이어 감`); } else { await loadListings(); src = LISTINGS; } }
    const seen = new Map();
    const X = EXT(); for (const l of src.values()) { const isbn = X.keyOf ? X.keyOf(l) : String(l.isbn13 || '').replace(/[^0-9]/g, ''); if (!isbn) continue; const isI = /^97[89]\d{10}$/.test(isbn); if (!isI && !['video', 'music'].includes(l.mediaType)) continue; /* (1.57.4) ISBN 없는 DVD·블루레이·CD도 중고 시세(중고닷)는 봄 */ const st = String(l.status || ''); const sold = !isI ? false : (l.active === false || /판매완료/.test(st)); /* (1.77.7) 판매완료도 — 기본 정보(교보·예스24·네이버·구글·국중·카카오)만 · 판매중 다음 차례 · 정범님 10/17 */ if (!sold && (!/판매중/.test(st) || /판매중지/.test(st) && !/일시/.test(st))) continue; const p = +l.price || 0; const o = seen.get(isbn); if (o && !o.sold && sold) continue; if (!o || (o.sold && !sold) || p > o.p) seen.set(isbn, { isbn, media: l.mediaType || null, title: String(l.title || '').replace(/^\[중고[^\]]*\]\s*/, '') || null, author: l.author || null, p, ...(sold ? { sold: true } : {}) }); }
    EXT_S.cand = [...seen.values()].sort((a, b) => (a.sold ? 1 : 0) - (b.sold ? 1 : 0) || b.p - a.p); EXT_S.candAt = src === LISTINGS ? Date.now() : Date.now() - 5 * 3600e3; return EXT_S.cand; }
  const extDue = (src, isbn, cfg) => { const v = (EXT_S.idx[src] || new Map()).get(isbn); if (!v) return true; const m = String(v).match(/^E (\d{4}-\d\d-\d\d) (\d+)$/); if (m) return Date.now() - Date.parse(m[1] + 'T00:00:00+09:00') >= EXT_BACKOFF[Math.min(EXT_BACKOFF.length, +m[2]) - 1] * 864e5; return Date.now() - Date.parse(v + 'T00:00:00+09:00') >= cfg.src[src].refreshDays * 864e5; };
  const extEligible = (src, b, cfg) => { const X = EXT(); if (b && b.sold && (X.SOURCES[src] || {}).grp !== 'basic') return false; /* (1.77.7) 판매완료 책은 기본 정보만(시세·해외·전자책은 판매중만) */ if (X.eligible) return X.eligible(src, b, cfg); /* (1.59.0) 공용 파일 0.3.0부터 기준이 공용 파일에 — 영상·음반 전용 장터(DVDPrime) 포함 */ const g = X.SOURCES[src].grp; if (!/^97[89]\d{10}$/.test(String(b.isbn || ''))) return g === 'used' && src !== 'yes24used' && !!b.title; /* ISBN 없는 상품: 장터 시세만 */ if (g === 'foreign' && !cfg.foreignKr && X.isKrIsbn(b.isbn)) return false; if ((g === 'used' && src !== 'yes24used') || g === 'ebook') return !!b.title; return true; };
  /* 환율: 하루 한 번(한국 11:30 뒤 — 수출입은행 고시 뒤) · ext_fx/{고시일} (이미 있으면 안 씀) */
  async function extFx(force) { const X = EXT(); const day = extKst(); const k = new Date(Date.now() + 9 * 3600e3); const hm = k.getUTCHours() * 60 + k.getUTCMinutes();
    const run = await EXT_RUN().get().catch(() => null); const F0 = (run && run.exists ? run.data().fx : null) || {}; const fxDay = F0.day || null; if (!force && fxDay === day) return null; /* 11:30 전(오늘 고시 전)엔 6시간에 한 번만 · 실패했으면 1시간 뒤 다시 */ if (!force && hm < 11 * 60 + 30 && F0.at && Date.now() - Date.parse(F0.at) < 6 * 3600e3) return null; if (!force && F0.errAt && Date.now() - Date.parse(F0.errAt) < 3600e3) return null;
    const r = await X.fxRun({ keys: await extKeys(), http: extHttp, day }); if (!r.ok) { await EXT_RUN().set({ fx: { err: r.why, errAt: nowIso() } }, { merge: true }).catch(() => {}); log('🌐 환율을 못 받음: ' + r.why, 1); return r; }
    const ref = C('ext_fx').doc(r.date || day); const ex = await ref.get(); if (!ex.exists) await ref.set({ date: r.date || day, rates: r.rates, src: r.src, warn: r.warn || null, at: nowIso(), by: PC_NAME, ...W() });
    await EXT_RUN().set({ fx: { day: hm >= 11 * 60 + 30 ? day : fxDay || null, date: r.date, src: r.src, usd: r.rates.USD, at: nowIso(), err: null } }, { merge: true }).catch(() => {}); return r; }
  /* 한 바퀴(최대 4분): 출처마다 차례가 온 책 하나씩 돌아가며 */
  async function extFill(cfg) { const X = EXT(); const keys = await extKeys(); await extIdxLoad(); await extUsedLoad(); const C0 = await extCands(); if (!C0.length) return null; const t0 = Date.now(); const tally = {};
    const srcs = X.ORDER.filter((s) => cfg.src[s].on && X.keysReady(s, keys) && !(PUBONLY && /aladin/i.test(X.SOURCES[s].host || ''))); /* (1.67.0) 로거는 알라딘 TTB(계정 키로 알라딘에 묻는 것)를 쓰지 않음 — 계정과 이어지지 않게 */ let guard = 0; const done = new Set(); const skipRun = {};
    let leaseAt = Date.now(); while (Date.now() - t0 < 4 * 60000 && guard++ < 5000) { if (EXT_S.burst && PAR_STOP.extBurst) break; /* (1.74.0) 몰아 받기 멈춤 */ if (window.__rnPaused || (window.__rnRest && window.__rnRest()) || !auth.currentUser) break; if (Date.now() - leaseAt > 60000) { if (!(await extLease())) break; leaseAt = Date.now(); } let did = false;
      for (const src of srcs) { if (EXT_S.authPause && EXT_S.authPause[src] != null && X.keySig && EXT_S.authPause[src] === X.keySig(src, keys)) { done.add(src); continue; } /* (1.75.0) 키가 그대로면 키 문제로 쉬는 출처 건너뜀 */ if (done.has(src) || (EXT_S.pauseUntil[src] || 0) > Date.now() || (EXT_S.used[src] || 0) >= cfg.src[src].cap || (EXT_S.next[X.SOURCES[src].host] || 0) > Date.now()) continue;
        let i = EXT_S.cur[src] || 0, b = null; { const PQ = (EXT_S.prio && EXT_S.prio[src]) || null; if (PQ && PQ.length) { if (!EXT_S.cmap || EXT_S.cmapOf !== C0) { EXT_S.cmap = new Map(C0.map((x) => [x.isbn, x])); EXT_S.cmapOf = C0; } while (PQ.length && !b) { const x = EXT_S.cmap.get(PQ[0]); PQ.shift(); if (x && extEligible(src, x, cfg) && extDue(src, x.isbn, cfg)) b = x; } } } /* (1.74.3) 다시 읽을 책 먼저(예스24 '다른 책'·중고 실패로 미뤄 둔 책) */ if (!b) for (let n = 0; n < C0.length; n++, i++) { const x = C0[i % C0.length]; if (extEligible(src, x, cfg) && extDue(src, x.isbn, cfg)) { b = x; i++; break; } } EXT_S.cur[src] = i % C0.length; if (!b) { done.add(src); continue; } /* 이번 바퀴엔 이 출처로 할 책이 없음 — 다시 훑지 않음 */
        const r = await extOne(src, b, 'auto'); did = true; const t = (tally[src] = tally[src] || {}); t[r.st] = (t[r.st] || 0) + 1; skipRun[src] = r.st === 'skip' ? (skipRun[src] || 0) + 1 : 0; if (skipRun[src] >= 20) done.add(src); /* (1.58.0) 중고닷이 아직 안 본 책만 남으면 이번 바퀴엔 그만 — 책마다 기록을 한 번씩 읽어 읽기 수가 수천 번 나던 것 */ if (Date.now() - t0 > 4 * 60000) break; }
      if (!did) { if (srcs.every((s) => done.has(s) || (EXT_S.pauseUntil[s] || 0) > Date.now() || (EXT_S.used[s] || 0) >= cfg.src[s].cap)) break; await sleep(400); } }
    const parts = Object.entries(tally).map(([s, t]) => `${X.SOURCES[s].label} ${Object.entries(t).map(([k, v]) => `${{ new: '새로', changed: '바뀜', same: '같음', err: '못 읽음', skip: '건너뜀', mismatch: '다른 책', none1: '없음(한 번 — 다음에 확인)', viaJm: '중고닷에서 찾아 직접 안 물음' }[k] || k} ${v}`).join('·')}`);
    if (parts.length) log(`🌐 외부 정보 ${Math.round((Date.now() - t0) / 1000)}초: ${parts.join(' / ')}`); return tally; }
  /* (1.74.0) 🔎 외부 정보 몰아 받기 — 평소 5분마다 4분씩 받던 것을 쉴 때 쉬지 않고(출처마다 하루 최대·요청 간격은 그대로) · 더 받을 것이 없거나(모든 출처 하루 최대·할 책 없음) 맡음을 못 받으면 끝 */
  /* ══ (1.76.0) 📚 로거 와이파이 일: 하루 종일 도서 정보(외부 — 교보 > 예스24 > 네이버)와 표지 사진 — 정범님 10/16
   *  로거는 베일 속에(알라딘이 절대 알 수 없게): 이 일은 알라딘 주소를 하나도 열지 않음(도서 정보·표지 모두 외부 · 셋 다 없으면 'none'으로 적고 알라딘 도서 정보는 사무실 PC의 판매완료 상품 정보·도서 정보 일이 맡음)
   *  도우미 1.6.3부터만(교보·네이버 표지가 와이파이로 나가는 판) · 테더링 일(벤치마킹)과 따로 동시에 돎
   *  차례: ① 가장 최근 등록 상품 300개 ② 정보를 아직 안 모은 판매중 ③ 정보를 아직 안 모은 판매완료 ④ 알라딘 정보만 있는 판매중(평점·리뷰 수·옮긴이·표지 보강) ⑤ 같은 판매완료 — 한 번 모은 상품은 120일 뒤 다시 */
  const BI = { busy: false, q: [], qAt: 0, n: 0, ok: 0, none: 0, err: 0, imgs: 0, last: null, why: null };
  const biFresh = (l) => { const x = l && l.bookInfoExt; return !!(x && x.at && Date.now() - Date.parse(x.at) < 120 * 864e5); };
  async function biQueue() { await loadListings('inc'); /* (자동 점검 2026-10-16) LISTINGS = null로 비운 채 기다리면 그사이 벤치마킹·refreshOne이 LISTINGS.get에서 멈출 수 있었음 → 보관본+바뀐 것만 다시 읽어 다 되면 바꿔 끼움 */ const all = [...LISTINGS.entries()].filter(([, l]) => l && l.isbn13 && /^97[89]\d{10}$/.test(String(l.isbn13)) && !biFresh(l)); const rg = (l) => kMsC(l.registeredAt) || 0; const seen = new Set(); const out = []; const add = (arr, tag) => { for (const [k] of arr) if (!seen.has(k)) { seen.add(k); out.push([k, tag]); } };
    const all0 = [...LISTINGS.entries()].filter(([, l]) => l).sort((a, b) => rg(b[1]) - rg(a[1])).slice(0, 300).map(([k]) => k); const top = new Set(all0); add(all.filter(([k]) => top.has(k)), '최근 등록 300');
    add(all.filter(([, l]) => l.active !== false && !l.bookId), '판매중 · 정보 없음'); add(all.filter(([, l]) => l.active === false && !l.bookId), '판매완료 · 정보 없음'); add(all.filter(([, l]) => l.active !== false), '판매중 · 외부 보강'); add(all.filter(([, l]) => l.active === false), '판매완료 · 외부 보강');
    BI.q = out; BI.qAt = Date.now(); return out; }
  async function biImg(bookId) { try { const ref = C('prd_books').doc(String(bookId)); let b = null; await db.runTransaction(async (tx) => { b = null; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const d = await tx.get(ref); const x = d.exists ? d.data() : null; if (!x || x.imgStatus !== 'pending' || (x.imgLease && x.imgLease.until > Date.now() && x.imgLease.by !== PC_ID)) return; const srcs = ['front', 'back', 'spine'].map((k) => x.images && x.images[k] && !x.images[k].stored ? x.images[k].src : null).filter(Boolean); if (!srcs.length || srcs.some((u) => /aladin/i.test(u))) return; tx.update(ref, { imgLease: { by: PC_ID, name: PC_NAME, until: Date.now() + 10 * 60000 } }); b = { id: d.id, ...x }; }); if (!b) return false;
      const upd = { images: {} }; let ok = true; for (const slot of ['front', 'back', 'spine']) { const im = b.images && b.images[slot]; if (!im || !im.src || im.stored) continue; try { const blob = await gmBlob(im.src); const ext = (im.src.match(/\.(jpe?g|png|gif|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase(); const base = `img/${b.id}/${slot}`; const meta = { cacheControl: 'public,max-age=31536000,immutable' }; await storage.ref(`${base}.${ext}`).put(blob, { ...meta, contentType: blob.type || 'image/' + ext }); let t = null; try { t = await thumb(blob, slot === 'spine' ? 60 : 200); if (t) await storage.ref(`${base}_t.webp`).put(t, { ...meta, contentType: 'image/webp' }); } catch (e) { t = null; } upd.images[slot] = { src: im.src, stored: `${base}.${ext}`, thumb: t ? `${base}_t.webp` : null, bytes: blob.size ?? null, storedAt: nowIso(), by: 'logger-wifi' }; } catch (e) { ok = false; upd.images[slot] = { src: im.src, stored: null, error: e.message }; } }
      await ref.set({ ...upd, imgStatus: ok ? 'done' : 'error', imgLease: firebase.firestore.FieldValue.delete(), ...W() }, { merge: true }); if (ok) BI.imgs++; return ok; } catch (e) { return false; } }
  /* ══ (1.77.7 → 1.78.0) ♾ 무한 도서 정보 — 정범님 10/17 '외부 출처로 판매중·판매완료 중 정보를 안 모은 것부터 무한히' · 17:17 '더 늘리는 방안 전부'
   *  차례: (우리 상품 — 위 biQueue ①~⑤가 먼저) → ⑥ 우리가 아는 모든 책(prd_books 3만여 권 — 알라딘 구매 풀·탐색·함께 산 책 포함) → ⑦ 벤치마킹 판매자의 책(bench_books) → ⑧ 출판사 새 책 소식(mkt_kpipa_posts의 ISBN)
   *        → ⑨ 국립중앙도서관 ISBN 서지(날짜별 · 오늘 쪽부터 거꾸로 · 새로 생긴 날은 늘 먼저 — 끝이 없는 차례) → 다 돌면 ⑥부터 다시(120일 지난 것만)
   *  출처: 교보 > 예스24 > 네이버 > 구글 북스 > 국립중앙도서관 > 카카오 (알라딘 TTB 제외 · 네이버 API 종료) — 한 책은 처음 찾은 출처에서 끝 · 출처마다 하루 상한·요청 간격·쉼을 그대로 지킴
   *  여러 PC가 함께: 어디까지 했는지는 서버(app_settings/bi_x)에 — 한 쪽(차례)씩 맡아 가져가므로 두 PC가 같은 책을 묻지 않음 · 사무실 PC는 밤(0~7시)·쉴 때 공식 API 출처(구글·국중·카카오)만
   *  우리 상품 밖 책은 출처 색인(ext_index — 문서마다 1MB 한도)에 넣지 않고, 책 문서(ext_basic/{ISBN}.bx)에 '언제 물었나'를 적음 → 끝없이 늘어도 색인이 넘치지 않음
   *  표지: 찾은 출처의 표지를 Firebase 저장소 img/ext/{ISBN}에 (켜고 끄기 · 통계 app_settings/ext_cover_stat — 날마다 장 수·바이트) · 알라딘 주소는 하나도 열지 않음 */
  const BX_SRC = ['kyobo', 'yes24', 'naverbook', 'google', 'nl', 'kakao']; const BX_API = ['google', 'nl', 'kakao'];
  const BX_POOLS = ['books', 'bench', 'kpipa', 'nl']; const BX_COL = { books: 'prd_books', bench: 'bench_books', kpipa: 'mkt_kpipa_posts' }; const BX_TAG = { books: '우리가 아는 책', bench: '벤치마킹 책', kpipa: '출판사 새 책', nl: '국립중앙도서관 새 책' };
  const BX = { buf: [], n: 0, ok: 0, none: 0, skip: 0, err: 0, cov: 0, covB: 0, why: null, last: null, pool: null, cur: null, lap: 0, cfg: null, cfgAt: 0, pend: 0, own: null, ownAt: 0 };
  const BXREF = () => C('app_settings').doc('bi_x');
  const bxDay = (d) => { const t = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8))); return t; }; const bxYmd = (t) => t.toISOString().slice(0, 10).replace(/-/g, '');
  async function bxCfg(force) { if (!force && BX.cfg && Date.now() - BX.cfgAt < 60e3) return BX.cfg; try { const d = await BXREF().get(); BX.cfg = d.exists ? d.data() : {}; } catch (e) { BX.cfg = BX.cfg || {}; } BX.cfgAt = Date.now(); return BX.cfg; }
  /* 한 쪽 맡기: 서버의 지금 자리를 읽고 → 그 뒤 한 쪽을 읽고 → 자리가 그대로면 다음 자리로 옮김(다른 PC가 먼저 옮겼으면 다시) */
  async function bxClaim(api) { const X = EXT(); for (let tries = 0; tries < 5; tries++) { const st = await bxCfg(true); const pool = BX_POOLS.includes(st.pool) ? st.pool : 'books'; const cur = st.cur || null; let next = null, items = [], lapEnd = false, nlTop = st.nlTop || null;
      if (pool === 'nl') { const keys = await extKeys(); if (!X.keysReady('nl', keys)) { next = { pool: 'books', cur: null }; lapEnd = true; } else { const top = bxYmd(new Date(Date.now() + 9 * 3600e3 + 30 * 864e5)); /* 출간 예정(30일 뒤)까지 */ const dPrev = (x) => bxYmd(new Date(bxDay(x).getTime() - 864e5)); const dNext = (x) => bxYmd(new Date(bxDay(x).getTime() + 864e5)); let day = null;
          if (!nlTop) { day = top; next = { pool, cur: dPrev(top), nlTop: top }; } /* 처음: 30일 뒤부터 거꾸로 */
          else if (nlTop < top) { day = dNext(nlTop); next = { pool, cur: cur || dPrev(nlTop), nlTop: day }; } /* 새로 생긴 날 먼저 */
          else { day = cur || dPrev(nlTop); if (day < '20000101') { next = { pool: 'books', cur: null, nlTop }; lapEnd = true; day = null; } else next = { pool, cur: dPrev(day), nlTop }; }
          if (day) items = { nlDay: day }; } }
      else { let q = C(BX_COL[pool]).orderBy(firebase.firestore.FieldPath.documentId()).limit(pool === 'books' ? 300 : 100); if (cur) q = q.startAfter(cur); const qs = await q.get();
        if (qs.empty) { const ni = BX_POOLS.indexOf(pool) + 1; next = { pool: BX_POOLS[ni] || 'books', cur: null }; if (!BX_POOLS[ni]) lapEnd = true; } else { next = { pool, cur: qs.docs[qs.docs.length - 1].id }; qs.forEach((d) => { const x = d.data() || {}; const L = pool === 'books' ? [x.isbn13] : pool === 'bench' ? [x.isbn, x.page && x.page.isbn13] : Array.isArray(x.isbns) ? x.isbns : []; for (const i0 of L) { if (i0 == null || typeof i0 === 'object') continue; const isbn = String(i0).replace(/[^0-9]/g, ''); if (/^97[89]\d{10}$/.test(isbn)) items.push({ isbn, title: pool === 'kpipa' ? null : x.title || null, author: pool === 'books' ? x.author || null : null, tag: BX_TAG[pool] }); } }); } }
      let won = false; try { await db.runTransaction(async (tx) => { won = false; /* (1.89.13) 트랜잭션이 다시 돌면 앞 시도의 값이 남지 않게 */ const s0 = await tx.get(BXREF()); const v = s0.exists ? s0.data() : {}; if ((BX_POOLS.includes(v.pool) ? v.pool : 'books') !== pool || (v.cur || null) !== cur || (pool === 'nl' && (v.nlTop || null) !== (st.nlTop || null))) return; const FV = firebase.firestore.FieldValue; const upd = { pool: next.pool, cur: next.cur, ...(next.nlTop ? { nlTop: next.nlTop } : {}), at: nowIso(), by: PC_NAME, lapAsk: FV.increment(BX.pend) }; if (lapEnd) { const asked = (+v.lapAsk || 0) + BX.pend; upd.lap = (+v.lap || 0) + 1; upd.lapAsk = 0; upd.lastLap = { at: nowIso(), asked }; if (!asked) upd.rest = Date.now() + 6 * 3600e3; } tx.set(BXREF(), upd, { merge: true }); won = true; }); } catch (e) { BX.why = '차례 맡기 실패: ' + e.message; return null; }
      if (won) { BX.pend = 0; BX.pool = pool; BX.cur = cur; if (lapEnd) log(`♾ 무한 도서 정보: 한 바퀴 끝 — 다시 처음(우리가 아는 책)부터 · 120일 지난 것만 다시 물음`); if (items && items.nlDay) return await bxNlDay(items.nlDay); return items; }
      await sleep(300 + Math.random() * 700); } return null; }
  /* 국립중앙도서관 그날 나온(나올) 책 목록 — 한 번 부르면 100권씩 서지까지 옴 → 국중 서지는 바로 저장(따로 묻지 않음) · ISBN은 다른 출처 차례로 */
  async function bxNlDay(day) { const X = EXT(); const keys = await extKeys(); const out = []; const h = X.SOURCES.nl.host; let size = 100;
    for (let page = 1; page <= 30; page++) { const at = Math.max(Date.now(), EXT_S.next[h] || 0); EXT_S.next[h] = at + X.SOURCES.nl.paceMs; if (at > Date.now()) await sleep(at - Date.now()); let j = null; try { const r = await extHttp({ url: `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(keys.nlKey)}&result_style=json&page_no=${page}&page_size=${size}&start_publish_date=${day}&end_publish_date=${day}&ebook_yn=N` }); extUsedAdd('nl', 1); j = JSON.parse(r.text || '{}'); } catch (e) { BX.why = '국중 날짜 목록 못 읽음: ' + e.message; break; }
      if (j.ERR_CODE) { if (String(j.ERR_CODE) === '013' && size > 20) { size = 20; page = 0; continue; } BX.why = `국중 날짜 목록 ${j.ERR_CODE} ${j.ERR_MESSAGE || ''}`; break; } const docs = Array.isArray(j.docs) ? j.docs : []; if (!docs.length) break;
      for (const d of docs) { const isbn = String(d.EA_ISBN || '').replace(/[^0-9]/g, ''); if (!/^97[89]\d{10}$/.test(isbn)) continue; const b = { isbn, title: d.TITLE || null, author: d.AUTHOR || null, tag: BX_TAG.nl, future: day > bxYmd(new Date(Date.now() + 9 * 3600e3)) }; /* 아직 안 나온 책은 다른 출처에 묻지 않음(120일 뒤 다시 — 그땐 나와 있음) */ try { const res = await X.run('nl', { isbn, keys, http: async () => ({ status: 200, text: JSON.stringify({ docs: [d] }) }), render: extRender, cache: {}, cfg: await extCfg() }); if (res && res.ok && res.d) { await extSave('nl', b, res); b.nlOk = true; b.cover = res.d.cover || null; } } catch (e) {} out.push(b); }
      if (docs.length < size || page * size >= (+j.TOTAL_COUNT || 0)) break; }
    return out; }
  const BX_COVER_OK = /(^|\.)(kyobobook\.co\.kr|pstatic\.net|kakaocdn\.net|yes24\.com|nl\.go\.kr)$/i; /* (1.78.3 자동 점검) daumcdn.net 뺌 — 도우미 와이파이 목록에 없어 테더링으로 받았음(알라딘 화면도 부를 수 있는 주소라 와이파이에 넣지 않음) */ /* 로거: 와이파이 길(도우미 WIFI_HOSTS)에 있는 표지 주소만 · 알라딘은 어디서도 안 받음 */
  async function bxCover(isbn, url) { try { if (!url || /aladin/i.test(url)) return false; let host = ''; try { host = new URL(url).hostname; } catch (e) { return false; } if (PUBONLY && !BX_COVER_OK.test(host)) return false;
      const ref = C('ext_basic').doc(isbn); const cur = await ref.get(); if (cur.exists && cur.data().img && cur.data().img.stored) return false; /* 이미 받은 표지는 다시 받지 않음 */
      const blob = await gmBlob(url); if (!blob || blob.size < 500) return false; const ext = ((blob.type || '').match(/image\/(jpe?g|png|gif|webp)/) || [, 'jpg'])[1].replace('jpeg', 'jpg'); const path = `img/ext/${isbn}.${ext}`; /* 수집기가 이미 쓰는 img/ 아래(저장소 규칙이 허용한 곳) */
      await storage.ref(path).put(blob, { cacheControl: 'public,max-age=31536000,immutable', contentType: blob.type || 'image/' + ext }); const FV = firebase.firestore.FieldValue; const day = extKst();
      await ref.set({ isbn, img: { src: url, stored: path, bytes: blob.size, at: nowIso(), by: PC_NAME } }, { merge: true });
      window.__rnCS && (window.__rnCS.add('cover', 'ok'), window.__rnCS.add('cover', 'b', blob.size)); await C('app_settings').doc('ext_cover_stat').set({ n: FV.increment(1), bytes: FV.increment(blob.size), at: nowIso(), days: { [day]: { n: FV.increment(1), bytes: FV.increment(blob.size) } } }, { merge: true }); BX.cov++; BX.covB += blob.size; return true; } catch (e) { if (!BX.covErr) { BX.covErr = e.message; log('🖼 표지 저장 못 함(다음 표지에서 다시): ' + e.message, 1); } return false; } }
  /* 이 책을 최근에 물었나: ext_basic/{ISBN}.bx(무한 차례가 적은 것) 또는 출처 기록(우리 상품 차례가 받은 것) */
  const bxFresh = (v) => { if (!v) return false; const now = Date.now(); const bx = v.bx; if (bx && bx.at && now - Date.parse(bx.at) < (bx.ok ? 120 : 30) * 864e5) return true; const S0 = v.src || {}; return BX_SRC.some((s0) => { const e = S0[s0]; const t = e && (e.chk || e.at); return e && e.d && !e.none && t && now - Date.parse(t) < 120 * 864e5; }); };
  async function biExtra(t0, lim, api) { const X = EXT(); const cf = await bxCfg(); if (cf.mode === 'off') { BX.why = '정범님이 멈춤(웹앱 설정)'; return; } if ((+cf.rest || 0) > Date.now()) { BX.why = '모든 책을 최근에 물어 봄 — ' + new Date(+cf.rest + 9 * 3600e3).toISOString().slice(11, 16) + '에 다시'; return; }
    const cfg = await extCfg(); const keys = await extKeys(); await extUsedLoad(true); let usedAt = Date.now(); const L0 = api ? BX_API : BX_SRC;
    const okSrc = (s0) => cfg.src[s0] && cfg.src[s0].on && X.SOURCES[s0] && !X.SOURCES[s0].ended && X.keysReady(s0, keys) && (EXT_S.pauseUntil[s0] || 0) <= Date.now() && !(EXT_S.authPause && EXT_S.authPause[s0] != null && X.keySig && EXT_S.authPause[s0] === X.keySig(s0, keys)) && (EXT_S.used[s0] || 0) < cfg.src[s0].cap;
    let empty = 0; while (Date.now() - t0 < lim && !window.__rnPaused) { if (Date.now() - usedAt > 10 * 60e3) { await extUsedLoad(true); usedAt = Date.now(); } /* 다른 PC가 쓴 하루 사용량도 반영 */ const S0 = L0.filter(okSrc); if (!S0.length) { BX.why = `${api ? '공식 API 출처(구글·국중·카카오)' : '기본 정보 출처(교보·예스24·네이버·구글·국중·카카오)'}가 모두 오늘 상한 또는 쉬는 중 — 풀리면 이어서`; return; } BX.why = null;
      if (!BX.buf.length) { const got = await bxClaim(api); if (got == null) return; if (!got.length && ++empty > 8) return; BX.buf.push(...got); continue; } const b = BX.buf.shift();
      if (!BX.own || Date.now() - BX.ownAt > 30 * 60e3) { BX.own = new Set(); try { for (const l of (LISTINGS || new Map()).values()) if (l && l.isbn13) BX.own.add(String(l.isbn13)); } catch (e) {} BX.ownAt = Date.now(); } if (BX.own.has(b.isbn)) { BX.skip++; continue; } /* 우리 상품은 위 차례(biQueue·외부 정보)가 맡음 */
      let v = null; try { const d = await C('ext_basic').doc(b.isbn).get(); v = d.exists ? d.data() : null; } catch (e) {} if (bxFresh(v)) { BX.skip++; window.__rnCS && window.__rnCS.add('bx_' + (BX.pool || 'books'), 'skip', 1, '이미 모음(찾은 책 120일·못 찾은 책 30일 안)'); continue; }
      BX.n++; BX.pend++; let got = null; if (!(b.nlOk && b.future)) for (const s0 of S0) { if (s0 === 'nl' && b.nlOk) continue; if (!okSrc(s0) || !extEligible(s0, b, cfg)) continue; let r = null; try { r = await extOne(s0, b, 'xpool'); } catch (e) { r = { st: 'err' }; } if (r && ['new', 'changed', 'same'].includes(r.st)) { got = { src: s0, cover: r.cover || null }; break; } if (Date.now() - t0 > lim + 60e3) break; }
      if (!got && b.nlOk) got = { src: 'nl', cover: b.cover || null };
      try { await C('ext_basic').doc(b.isbn).set({ isbn: b.isbn, bx: { at: nowIso(), ok: !!got, src: got ? got.src : null, tag: b.tag, by: PC_NAME } }, { merge: true }); } catch (e) {}
      { const CS = window.__rnCS; const pk = 'bx_' + (BX.pool || 'books'); if (CS) CS.add(pk, got ? 'ok' : 'none'); } if (got) { BX.ok++; if (cf.cover !== false) await bxCover(b.isbn, got.cover || b.cover); } else BX.none++; BX.last = { isbn: b.isbn, tag: b.tag, at: nowIso() };
      if (cf.mode === 'slow') await sleep(4000); /* 느리게: 책마다 4초 더 쉼 */
      if (BX.n % 100 === 0) log(`♾ 무한 도서 정보: ${BX.n}권 물음 — 찾음 ${BX.ok} · 못 찾음 ${BX.none} · 이미 있어 건너뜀 ${BX.skip} · 표지 ${BX.cov}장 ${(BX.covB / 1048576).toFixed(1)}MB (지금: ${b.tag})`); } }
  /* (1.78.0) 사무실 PC도 밤(한국 0~7시)·쉴 때 무한 차례를 나눠 맡음 — 공식 API 출처만(외부 화면 탭을 열지 않음) · 웹앱 설정에서 끌 수 있음 */
  if (!PUBONLY) setInterval(async () => { try { if (BX.busyO || window.__rnPaused || !auth.currentUser || running || parBusy || RESTX.busy || EXT_S.busy || !EXT()) return; const h = new Date(Date.now() + 9 * 3600e3).getUTCHours(); if (h >= 7) return; const cf = await bxCfg(); if (cf.office === false || cf.mode === 'off') return; BX.busyO = true; try { await biExtra(Date.now(), 4 * 60e3, true); } finally { BX.busyO = false; } } catch (e) { BX.busyO = false; } }, 60e3);
  async function biTick() { if (!PUBONLY || BI.busy || !auth.currentUser || window.__rnPaused) return; if (!helperVerOk('1.6.3')) { BI.why = '도우미 1.6.3을 기다림(교보·네이버 표지를 와이파이로 보내는 판)'; return; } if (!EXT()) { BI.why = '외부 정보 공용 파일 없음'; return; } BI.busy = true; BI.why = null;
    try { if (!BI.q.length || Date.now() - BI.qAt > 30 * 60e3) await biQueue(); const t0 = Date.now();
      const biSrcOk = async () => { const cf = await extCfg().catch(() => null); return ['kyobo', 'yes24', 'naverbook'].some((s0) => (EXT_S.pauseUntil[s0] || 0) <= Date.now() && !(EXT_S.authPause && EXT_S.authPause[s0] != null) && !(cf && cf.src && cf.src[s0] && cf.src[s0].cap != null && (EXT_S.used[s0] || 0) >= cf.src[s0].cap)); }; /* (자동 점검 2026-10-16) 세 출처가 모두 상한·쉼이면 이번 차례는 그만(빈 읽기로 차례만 넘기지 않게) */
      const lim = (biFocus() ? 10 : 4) * 60e3; BI.focus = biFocus();
      while (BI.q.length && Date.now() - t0 < lim) { if (window.__rnPaused) break; if (!(await biSrcOk())) { BI.why = '교보·예스24·네이버 모두 오늘 상한 또는 쉬는 중 — 풀리면 이어서'; break; } const [k, tag] = BI.q.shift(); const l = LISTINGS.get(k); if (!l || biFresh(l)) continue; BI.n++; let mark;
        try { await refreshOne(l, l.bookId || null, { infoOnly: true, extOnly: true }); const bid = (LISTINGS.get(k) || {}).bookId || l.bookId; mark = { at: nowIso(), ok: true, tag, by: PC_NAME }; BI.ok++; window.__rnCS && window.__rnCS.add('bi', 'ok'); if (bid) await biImg(bid); }
        catch (e) { const CS = window.__rnCS; if (e && e.noext) { mark = { at: nowIso(), none: true, tag, by: PC_NAME }; BI.none++; CS && CS.add('bi', 'none'); } else if (e && e.extTmp) { BI.tmp = (BI.tmp || 0) + 1; mark = null; CS && CS.add('bi', 'part', 1, '교보·예스24·네이버가 지금 답하지 않음 — 다음 차례에 다시'); } else { BI.err++; mark = null; CS && CS.add('bi', 'fail', 1, e && e.message); if (BI.err < 30) log(`📚 도서 정보(외부): ${l.title || k} — ${e.message}`, 1); } }
        if (mark) { try { await C('prd_listings').doc(k).set({ bookInfoExt: mark, ...W() }, { merge: true }); LISTINGS.set(k, { ...(LISTINGS.get(k) || l), bookInfoExt: mark }); } catch (e) {} } BI.last = { k, tag, title: l.title || null, at: nowIso() };
        if (BI.n % 50 === 0) log(`📚 로거 와이파이 도서 정보: ${BI.n}권 — 외부에서 찾음 ${BI.ok} · 셋 다 없음 ${BI.none} · 오류 ${BI.err} · 표지 ${BI.imgs} · 남은 차례 ${BI.q.length}권 (지금: ${tag})`); }
      if (!window.__rnPaused && Date.now() - t0 < lim) await biExtra(t0, lim); /* (1.77.7) 우리 상품이 끝났거나 교보·예스24·네이버가 상한이면 → 우리 상품 밖의 책(무한 차례) */
    } catch (e) { BI.why = e.message; log('📚 로거 와이파이 도서 정보 오류(다음에 이어서): ' + e.message, 1); } finally { BI.busy = false; } }
  if (PUBONLY) { setTimeout(() => biTick(), 90e3); setInterval(() => biTick(), 20e3); }
  window.__rnBookInfo = () => ({ ...BI, q: BI.q.length, x: { n: BX.n, ok: BX.ok, none: BX.none, skip: BX.skip, pool: BX.pool, cur: BX.cur, cov: BX.cov, covB: BX.covB, why: BX.why } });
  async function extBurstPar() { const X = EXT(); if (!X) throw new Error('외부 정보 공용 파일 없음'); PAR_STOP.extBurst = false; PAR_NOW.extBurst = '시작'; const cfg = await extCfg(); if (!cfg.on) return 'off'; if (PUBONLY && !helperVerOk('1.6.0')) return 'nohelper'; let n = 0;
    try { for (let i = 0; i < 300; i++) { if (PAR_STOP.extBurst) { PAR_STOP.extBurst = false; throw new Error('멈춤'); } if (window.__rnPaused || (window.__rnRest && window.__rnRest())) throw new Error('멈춤'); if (EXT_S.busy) { await sleep(5000); continue; } EXT_S.busy = true; EXT_S.burst = true; let got = 0;
        try { if (!(await extLease())) return n ? 'done' : 'nolease'; await extRequeueOnce(); await extUsedLoad(true); await extFx().catch(() => {}); const r = await extFill(cfg); if (!r) return 'none'; got = Object.values(r).reduce((a, t) => a + Object.entries(t || {}).filter(([k]) => !['skip', 'cap', 'wait'].includes(k)).reduce((x, [, v]) => x + (+v || 0), 0), 0); } finally { EXT_S.busy = false; EXT_S.burst = false; }
        n += got; PAR_NOW.extBurst = `${i + 1}바퀴 · ${n}번 물음`; if (!got) return n ? 'done' : 'none'; } return 'done'; } finally { PAR_NOW.extBurst = null; } }
  /* (1.74.3) 한 번만: 예스24 기본 정보가 검색 화면 맨 위 광고 상품을 잡아 '다른 책'으로 미뤄진 책 · 예스24 중고가 옛 주소 때문에 '못 읽음'으로 미뤄진 책 → 미룸(E 표시)을 지우고 맨 먼저 다시 읽음
   *  잘못된 값이 기록된 것은 없음(다른 책·못 읽음은 값 대신 오류 표시만 남김) — 미룸만 풀면 바르게 읽은 값으로 채워짐 · app_settings/ext_requeue.y24_1016 = 끝낸 표 */
  /* (1.75.0) 미룸 풀기 한 번씩 — 예스24(1.74.3) + eBay(키 문제 401로 책마다 남은 '못 읽음' 미룸 · 새 Production 키가 들어오면 다시 읽게) */
  const EXT_RQ_LIST = [{ id: 'y24_1016', srcs: ['yes24', 'yes24used'], msg: '예스24 다시 읽기: \'다른 책\'·\'못 읽음\'으로 미뤄 둔 책' }, { id: 'ebay_1016', srcs: ['ebay'], msg: 'eBay 다시 읽기: 키 문제(401)로 미뤄 둔 책' }];
  async function extRequeueOnce() { if (EXT_S.rqDone) return; try { const F = C('app_settings').doc('ext_requeue'); const d0 = await F.get(); const D = (d0.exists && d0.data()) || {}; EXT_S.prio = EXT_S.prio || {};
      for (const R0 of EXT_RQ_LIST) { if (D[R0.id]) { const P = D[R0.id].prio || {}; for (const [s0, L] of Object.entries(P)) if (!EXT_S.prio[s0]) EXT_S.prio[s0] = L.slice(); continue; }
        const FV = firebase.firestore.FieldValue; const prio = {}; let n = 0; for (const src of R0.srcs) { const qs = await C('ext_index').where(firebase.firestore.FieldPath.documentId(), '>=', src + '_').where(firebase.firestore.FieldPath.documentId(), '<', src + '_~').get(); const L = [];
          for (const doc of qs.docs) { if (!new RegExp('^' + src + '_\\d+$').test(doc.id)) continue; const m = (doc.data() || {}).m || {}; const del = {}; for (const [isbn, v] of Object.entries(m)) if (/^E /.test(String(v))) { del[isbn] = FV.delete(); L.push(isbn); } if (Object.keys(del).length) await doc.ref.set({ m: del }, { merge: true }); }
          prio[src] = L; n += L.length; if (EXT_S.idx[src]) L.forEach((k) => EXT_S.idx[src].delete(k)); }
        await F.set({ [R0.id]: { at: nowIso(), by: PC_NAME, n, prio } }, { merge: true }); for (const [s0, L] of Object.entries(prio)) if (!EXT_S.prio[s0]) EXT_S.prio[s0] = L; log(`🌐 ${R0.msg} ${n}권의 미룸을 풀고 맨 먼저 다시 읽음`, 1); }
      EXT_S.rqDone = true; } catch (e) { log('🌐 다시 읽기 준비 실패(다음에 다시): ' + (e.code || e.message), 1); } }
  async function extTick() { if (EXT_S.busy || !auth.currentUser || window.__rnPaused || (window.__rnRest && window.__rnRest())) return; const X = EXT(); if (!X) return; EXT_S.busy = true;
    try { const cfg = await extCfg(); if (!cfg.on) return; if (!asOwnMine() && !extLoggerOk()) return; /* (1.63.7) 담당 PC(또는 임시로 맡은 PC)만 · (1.67.0) 로거는 테더링 일을 쉬는 동안(사무실 PC가 맡고 있으면 맡음 표가 그 PC에 있어 그대로) */ if (!(await extLease())) return; await extUsedLoad(true); await extFx().catch((e) => log('🌐 환율: ' + e.message, 1)); await extRequeueOnce(); const r = await extFill(cfg);
      if (r == null) { /* (1.59.1) 할 책 목록이 없어 이번엔 못 함 — 맡음을 바로 놓아(클라우드·다른 PC가 이어받게) 쉰다고 한 시간에 한 번 남김(기록이 비는 까닭이 보이게) */ try { await db.runTransaction(async (tx) => { const s0 = await tx.get(EXT_RUN()); const L = (s0.exists && s0.data().lease) || null; if (L && L.pc === PC_NAME && L.tab === EXT_S.me) tx.set(EXT_RUN(), { lease: { ...L, atMs: Date.now() - 5 * 60000 } }, { merge: true }); }); } catch (e) {}
        if (Date.now() - (EXT_S.idleLogAt || 0) > 3600e3) { EXT_S.idleLogAt = Date.now(); log('🌐 외부 정보: 상품 기록을 아직 못 읽어(다른 작업 중 · 보관본 없음) 이번엔 쉼 — 맡음을 놓아 클라우드·다른 PC가 이어받게 함'); } } } catch (e) { log('🌐 외부 정보 오류: ' + (e.message || e), 1); } finally { EXT_S.busy = false; } }
  setTimeout(() => extTick(), 2 * 60000); setInterval(() => extTick(), 5 * 60000);
  /* 웹앱이 맡긴 일 — extLookup: { books:[{isbn,title,author}], srcs?:[출처] } · extTest: { srcs?:[출처] } (하루 최대와 상관없이 바로) */
  const EXT_TEST_BOOKS = { kr: { isbn: '9788937460449', title: '데미안', author: '헤르만 헤세' }, en: { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen' } };
  async function extCmd(ref, v) { const X = EXT(); if (!X) { await ref.set({ status: 'queued', claim: null, pcSkip: `수집기 ${APP_VER}에 외부 정보 공용 파일(readnow-ext-core.js)이 없음`, uploadedAt: TS() }, { merge: true }); return; }
    const keys = await extKeys(true); const cfg = await extCfg(true); await extUsedLoad(true); const out = {}; const all = X.ORDER.filter((s) => !v.srcs || v.srcs.includes(s));
    if (v.type === 'extTest') { for (const src of all) { if (!X.keysReady(src, keys)) { out[src] = { ok: false, st: 'nokey', why: '키 없음' }; continue; } if (PUBONLY && /aladin/i.test(X.SOURCES[src].host || '')) { out[src] = { ok: false, st: 'skip', why: '로거는 알라딘 TTB(계정 키)를 쓰지 않음 — 사무실 PC·클라우드가 시험' }; continue; } const g = X.SOURCES[src].grp; let b = g === 'foreign' ? EXT_TEST_BOOKS.en : EXT_TEST_BOOKS.kr; if (X.SOURCES[src].media) { /* (1.59.0) 영상·음반 전용 장터(DVDPrime)는 우리 영상 상품 하나로 시험 (없으면 건너뜀) */ let m = null; const okL = (l) => l && X.SOURCES[src].media.includes(l.mediaType) && l.title && String(l.status || '') === '판매중' && X.keyOf(l); let L0 = LISTINGS ? [...LISTINGS.values()] : null; if (!L0) { try { L0 = (await C('prd_listings').where('mediaType', 'in', X.SOURCES[src].media).limit(30).get()).docs.map((d) => d.data()); } catch (e) { L0 = []; } } const hit = L0.find(okL); if (hit) m = { isbn: X.keyOf(hit), title: String(hit.title).replace(/^\[중고[^\]]*\]\s*/, ''), author: null, media: hit.mediaType }; if (!m) { out[src] = { ok: false, st: 'nocase', why: '시험할 판매중 영상·음반 상품이 없음 — 시험하지 못함' }; continue; } b = m; } const r = await extOne(src, b, 'test'); out[src] = { ok: r.st !== 'err', st: r.st, why: r.why || null, n: r.n ?? null, none: r.none, isbn: b.isbn };
        await ref.set({ results: out, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); }
      if (!v.srcs || v.srcs.includes('fx')) { const r = await extFx(true).catch((e) => ({ ok: false, why: e.message })); out.fx = r && r.ok ? { ok: true, st: 'ok', why: `${r.src} ${r.date} · 1달러 ${Math.round(r.rates.USD).toLocaleString()}원${r.warn ? ' · (수출입은행: ' + r.warn + ')' : ''}` } : { ok: false, st: 'err', why: (r && r.why) || '?' }; }
      await EXT_RUN().set({ test: { at: nowIso(), by: PC_NAME, r: out } }, { merge: true }).catch(() => {}); await ref.set({ status: 'done', results: out, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`🌐 외부 연결 시험: ${Object.entries(out).map(([k, r]) => `${(X.SOURCES[k] || { label: '환율' }).label} ${r.ok ? '✓' : '✗'}`).join(' · ')}`); return; }
    const books = (v.books || []).filter((b) => b && /^(97[89]\d{10}|[BU][0-9A-Za-z_-]{3,40})$/.test(String(b.isbn || ''))).slice(0, 20).map((b) => ({ isbn: b.isbn, title: b.title || null, author: b.author || null, media: b.media || null })); /* (1.57.4) ISBN 없는 상품(B바코드·U상품코드)도 */ let n = 0;
    for (const b of books) { const r0 = (out[b.isbn] = {}); for (const src of all) { if (!cfg.src[src].on || !X.keysReady(src, keys) || (PUBONLY && /aladin/i.test(X.SOURCES[src].host || '')) || !extEligible(src, b, { ...cfg, foreignKr: cfg.foreignKr || !!v.foreignKr })) continue; const r = await extOne(src, b, 'webapp'); r0[src] = r.st; n++; await ref.set({ results: out, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); } }
    await ref.set({ status: 'done', results: out, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`🌐 외부 정보 지금 받기: 책 ${books.length}권 · ${n}번 물음 (웹앱에서 맡김)`); }
  const JOBS = {
    benchHelp: ['🌐 돕기 — 다른 PC가 하는 🎯 한 바퀴를 판매자 단위로 나눠 읽기', () => benchJob({ force: true, helper: true })],
    bench: ['🎯 집중 벤치마킹 — 정한 순서대로 모두 (멈추면 이어서)', (o) => benchJob({ force: true, ...(o && o.only ? { only: o.only } : {}) })], /* (1.60.1) 주기·차례 계산 없이 웹앱 🎯 순서대로 켜진 그룹의 판매자 모두 · 지난 바퀴를 못 끝냈으면(3일 안) 그 판매자부터 */
    benchForce: ['🎯 집중 벤치마킹 — 처음 판매자부터 다시 모두', () => benchJob({ force: true, fresh: true })],
    benchDetail: ['집중 벤치마킹 상품만 — 상품 페이지 정보 읽기', () => benchDetailJob()],
    scanNew: ['신규 등록분 수집', () => scan('new')],
    scanFull: ['전체 재검토', () => scan('full')],
    deposit: ['💰 알라딘 예치금(환급액) 내역', () => depositJob()],
    scanDaily: ['상품 조회 (판매중·일시판매중지·판매중지) 새로·바뀐 것', () => scan('daily')],
    market: ['도서 정보·시장 지표', () => market()],
    revTop: ['상위 판매자 평가 갱신', () => reviewJob('top')],
    dynamic0: ['구매자 분포 (하루치)', () => dynJob(SET.dynDaily || 300)],
    aladinBuy: ['알라딘 구매 내역 (전체)', () => aladinBuyJob()],
    rev6mAll: ['6개월 평가 수 (전체)', () => rev6mJob('all')],
    rev6mStale: ['6개월 평가 수 (오래된 것)', () => rev6mJob('stale')],
    revAll: ['판매자 평가 전체 수집', async () => { if (!window.__rnAuto && !window.__rnRemote && window.__rnHuman(5000) && !confirm('모든 판매자의 평가를 처음 것까지 받습니다. 평가가 많은 판매자는 한 곳에 수천 쪽이라 며칠이 걸릴 수 있습니다. 멈춰도 이어서 할 수 있습니다. 시작할까요?')) return; return reviewJob('all'); }],
    chain: ['모두 일괄 수집', () => runChain(false)],
    prdChain: ['상품 일괄 수집 (고객 제외)', () => runChain(true)],
    dynAll: ['구매자 분포 전체 수집', async () => { const human = window.__rnHuman(5000); /* (1.63.6) 확인 창은 사람이 막 누른 때만 · 책 수는 세기만(문서 수만 건을 다 받지 않음) */ let n = 0; if (human && !window.__rnRemote && !window.__rnAuto) { try { n = (await C('prd_books').count().get()).data().count; } catch (e) { n = (await C('prd_books').get()).size; } } if (human && !window.__rnRemote && !window.__rnAuto && !confirm(`도서 정보가 있는 책 ${n.toLocaleString()}권 중 아직 안 모았거나 오래된 책을 전부 모읍니다. 한 권에 5~10초라 수천 권이면 하루 넘게 걸릴 수 있습니다. 멈춰도 이어서 합니다. 시작할까요?`)) return 'cancel'; return dynJob(0); }],
    soldInfo: ['판매완료 상품 정보·이미지', () => soldInfoJob()],
    poolInfo: ['알라딘 구매 풀(미연결) 도서 정보', () => poolInfoJob()],
    photos: ['상품 사진 (표지 없는 상품: 우리 페이지 → 상품명 검색)', () => photosJob()],
    usedInfo: ['경쟁 매물 유의사항·사진', () => usedInfoJob()],
    explore: ['끝없는 탐색 수집', () => exploreJob()],
    handoff: ['🔁 로거가 못 한 일 넘겨받기 (19금 시장 지표)', () => handoffJob()],
    metricsReq: ['그룹 시장 지표 갱신', () => metricsReqJob()],
    metricsAuto: ['그룹 시장 지표 맡기기 (매일 자동을 켠 그룹)', () => metricsAutoJob()],
    shipRead: ['발송 요청 읽기 (오늘 출고)', () => shipReadJob()],
    nbMarket: ['새상품 없는 상품 시세', () => nbMarketJob()],
    buyback: ['알라딘 팔기 내역', () => buybackJob()],
    dynamic: ['구매자 분포·함께 산 책', () => dynJob(SET.dynDaily || 0)],
    kpipa: ['출판 판매 통계 (KPIPA 판매 보고서)', () => kpipaJob()],
    extBurst: ['🔎 외부 정보 몰아 받기 (출처 하루 최대까지 · 쉴 때)', () => extBurstPar()],
  };
  /* ───────── 버전 맞추기: 다른 PC가 더 새 수집기로 돌기 시작하면, 이 PC는 지금 항목까지 저장하고 멈춘 뒤 새로고침해 새 버전으로 이어감 ─────────
   * (동기화로 스크립트 파일은 바뀌어도, 이미 열려 있던 탭은 새로고침 전까지 예전 코드로 돎) */
  const verNum = (v) => String(v || '0').split('.').map((x) => +x || 0).reduce((a, x) => a * 1000 + x, 0);
  window.__rnOutdated = false;
  async function versionWatch() {
    const ref = C('crm_system').doc('collector_version');
    /* (1.72.0) 판 알림을 머리 서명마다 따로(h_서명.ver) — 머리가 다른 PC(옛 Tampermonkey 본체)는 이 판을 받을 수 없으니, 예전 칸(ver)을 올리지 않아 그 PC들이 새로고침을 되풀이하지 않게(HOME에서 새 탭 옮기기가 되풀이되던 원인) · 같은 머리 PC끼리만 서로 맞춤 */
    const HS = (() => { try { return (window.__rnLiveInfo && window.__rnLiveInfo().hsig) || 'x'; } catch (e) { return 'x'; } })(); const HK = 'h_' + HS;
    try { await db.runTransaction(async (tx) => { const d = (await tx.get(ref)).data() || {}; const cur = (d[HK] || {}).ver; if (verNum(VER) > verNum(cur)) tx.set(ref, { [HK]: { ver: VER, by: PC_NAME, at: nowIso() } }, { merge: true }); }); } catch (e) {}
    // 더 새 버전이 생겨도 이 PC의 작업은 멈추지 않음. 하던 작업은 이 버전으로 끝까지 계속하고,
    // ① 아무 작업도 없을 때(2분 이상 쉼) 또는 ② 모두 일괄 수집의 단계와 단계 사이에서만 새로고침 → 새 버전으로 그 자리부터 자동으로 이어감.
    // 같은 버전으로는 한 번만 시도 (동기화 전이라 새로고침해도 예전 버전이면, 그 버전으로 그냥 계속).
    const want = GM_getValue('rnu-reload-for', null); if (want && verNum(want) <= verNum(VER)) GM_setValue('rnu-reload-for', null);
    /* (1.63.8) ⚡ 빠른 업데이트(본체의 GitHub 직접 받기)가 새 판을 받아 두면 같은 길로 — 쉬는 사이(또는 긴 작업이면 저장 지점에서) 새로고침해 새 판으로 그 자리부터 */
    let verTimer = null;
    window.__rnLiveReady = (v) => { try { if (!v || verNum(v) <= verNum(VER)) return; if (window.__rnOutdated === v && verTimer) return; { const RT = GM_getValue('rnu-reload-try', null), LV = GM_getValue('rn-live', null); /* (1.63.11 자동 점검) 받아 둔 판으로 이미 새로고침했는데도 이 판이면(시작 실패 등) 다시 0부터 세지 않음 — 전엔 부를 때마다 '같은 판 8번까지'를 지워 끝없이 새로고침·긴 작업을 10분마다 멈춤 */ if (RT && RT.v === v && LV && LV.ver === v && (+RT.at || 0) > (+LV.at || 0)) { if (window.__rnOutdated !== v) onNewVer(v, '⚡ 빠른 업데이트'); return; } } GM_setValue('rnu-reload-for', null); GM_setValue('rnu-reload-try', null); if (verTimer) { clearInterval(verTimer); verTimer = null; } window.__rnOutdated = null; onNewVer(v, '⚡ 빠른 업데이트로 새 판을 받아 둠'); } catch (e) {} };
    ref.onSnapshot((d) => onNewVer(((d.data() || {})[HK] || {}).ver), () => {});
    /* (1.83.0) ⚡ 새 판 즉시 — 정범님 10/18 '템퍼몽키가 바로 반영되지 않아': 예전엔 5분마다 pc-live.json을 보고(GitHub 원본 주소는 캐시가 5분까지 옛 파일) + 쉬는 2분을 기다려 10분 넘게 걸리기도 함
     *  → GitHub에 올라오면 자동 작업이 클라우드 /pclive로 app_settings/pc_live {ver, commit}를 적음 → 켜진 수집기가 바로 '커밋 주소'(캐시 없음)에서 같은 파일·지문을 받아 둠 → 쉬는 사이(45초) 새로고침 · 머리가 바뀐 판은 예전처럼 Tampermonkey 업데이트 */
    (() => { let lastC = null; const RB = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/'; const sha = async (t) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
      const go = async (v) => { if (!v || !v.commit || !v.ver || v.commit === lastC || verNum(v.ver) <= verNum(VER)) return; lastC = v.commit; const info = window.__rnLiveInfo ? window.__rnLiveInfo() : null; if (!info || !info.hsig || info.noeval || GM_getValue('rn-live-off', false)) return;
        try { const M = await (await fetch(RB + v.commit + '/pc-live.json', { cache: 'no-store' })).json(); if (!M || M.ver !== v.ver || !Array.isArray(M.files)) return; if (M.hsig !== info.hsig) { window.__rnLiveCheck && window.__rnLiveCheck(); return; }
          const H = GM_getValue('rn-live', null); if (!(H && H.ver === M.ver && H.hsig === info.hsig)) { let code = ''; for (const f of M.files) { const t = await (await fetch(RB + v.commit + '/' + f.f, { cache: 'no-store' })).text(); if ((await sha(t)) !== f.sha) throw new Error(f.f + ' 지문이 다름'); code += '\n;' + t + '\n'; } GM_setValue('rn-live', { ver: M.ver, hsig: info.hsig, code, at: Date.now(), n: M.files.length }); }
          log(`⚡ 새 판 ${M.ver}을 GitHub 커밋 ${v.commit.slice(0, 7)}에서 바로 받아 둠 — 쉬는 사이 바꿈`); window.__rnLiveFast = true; window.__rnLiveReady && window.__rnLiveReady(M.ver); } catch (e) { lastC = null; log('⚡ 새 판 바로 받기 실패: ' + e.message + ' — 5분마다 확인으로 이어감', 1); } };
      const sub = () => { try { C('app_settings').doc('pc_live').onSnapshot((d) => { go(d.exists ? d.data() : null); }, () => setTimeout(sub, 60000)); } catch (e) { setTimeout(sub, 60000); } }; setTimeout(sub, 15000); })();
    function onNewVer(v, src) { if (!v || verNum(v) <= verNum(VER) || window.__rnOutdated) return;
      window.__rnOutdated = v; if (window.__rnFeat && !window.__rnFeat('update')) { log(`새 수집기 ${v}가 있지만 이 PC는 🧩 '새 판 저절로 맞추기'를 꺼 둠 — 직접 새로고침해야 바뀜`, 1); return; } const tried = GM_getValue('rnu-reload-for', null) === v;
      /* (1.59.2) 한 번 새로고침했는데도 옛 판이면(Tampermonkey 동기화가 아직 안 옴) 예전엔 그 판으로 끝까지 버팀 → 이제 30분마다(쉬는 사이에만) 다시 새로고침해 동기화가 왔는지 봄, 같은 판으로 최대 8번 */
      const RT0 = GM_getValue('rnu-reload-try', null); const nTry = RT0 && RT0.v === v ? +RT0.n || 0 : 0;
      log(`새 수집기 ${v}가 있습니다 (이 탭은 ${VER}). 지금 작업은 그대로 계속합니다${tried ? (nTry >= 8 ? ' (이 PC의 Tampermonkey에 새 판이 아직 없음 — 8번 다시 열어 봐도 그대로라 더 하지 않음 · 그 PC의 Tampermonkey 동기화를 확인하세요)' : ` (이 PC는 아직 동기화 전 — 30분마다 쉬는 사이에 다시 열어 동기화가 왔는지 확인 ${nTry}/8)`) : '. 쉬는 사이나 일괄 수집 단계 사이에 새 버전으로 바꿔 이어갑니다'}`);
      if (tried && nTry >= 8) return; let idleSince = null; const seenAt = Date.now(); let hwNoted = false;
      const t = verTimer = setInterval(() => { const busy = running || imgRunning || (window.__rnCrm && window.__rnCrm.busy()); const hw = !!(window.__rnLiveHsigWait && verNum(window.__rnLiveHsigWait) >= verNum(v)); /* (1.72.0) 새 판의 머리·로더가 이 PC의 Tampermonkey 본체와 달라 빠른 업데이트로 못 바꿈 — 새로고침해도 소용없으니 하던 일을 끊지 않고 2시간마다만(Tampermonkey가 스스로 업데이트했는지) */
        // (1.38.0) 오래 걸리는 작업 중이면(새 판을 본 지 10분 넘게) 진행 위치 저장 지점에서 멈추고 새로고침해 새 판으로 그 자리부터 이어감
        //   예전: 쉬거나 일괄 단계 사이에서만 바꿔, 몇 시간짜리 단계가 끝날 때까지 옛 판으로 돌았음(10/8: 16:32에 1.37.0을 보고도 계속 1.27.0)
        if (!tried && !hw && busy && running && !imgRunning && !(window.__rnCrm && window.__rnCrm.busy()) && !window.__rnPaused && !memReload && !verReload && curKey && curKey !== 'explore' && JOBS[curKey] && Date.now() - seenAt > (window.__rnLiveFast ? 3 : 10) * 60000) { clearInterval(t); verReload = true; stopFlag = true; log(`새 수집기 ${v}로 바꾸려고 지금 항목까지 저장하고 멈춥니다 — 새로고침 뒤 '${JOBS[curKey][0]}'을(를) 그 자리부터 자동으로 이어감`, 1); return; }
        if (busy) { idleSince = null; return; } idleSince = idleSince || Date.now(); if (Date.now() - idleSince < (window.__rnLiveFast ? 45000 : 120000)) return; if ((tried || hw) && Date.now() - Math.max((RT0 && RT0.at) || 0, hw ? seenAt : 0) < (hw ? 120 : 30) * 60000) return; if (hw && !hwNoted) { hwNoted = true; log(`새 수집기 ${v}는 머리(화면·권한)나 본체가 바뀐 판이라 이 PC의 Tampermonkey가 스스로 업데이트해야 바뀝니다 — 새로고침을 되풀이하지 않고 2시간마다만 확인(Tampermonkey 대시보드 → 업데이트 확인을 누르면 바로)`, 1); }
        clearInterval(t); GM_setValue('rnu-reload-for', v); GM_setValue('rnu-reload-try', { v, n: nTry + 1, at: Date.now() }); safeReload(tried ? `새 버전 ${v} 동기화 확인 (${nTry + 1}/8)` : (src ? src + ' — 새 판으로 바꿈' : '새 버전으로 바꿈'), null); }, 10000); }
    // 새로고침 뒤 이어가기: 실제로 시작될 때까지 표시를 지우지 않고 15초마다 다시 시도(최대 10분), 사람 확인 없이(무인) 시작
    { const after = GM_getValue('rnu-resume-after-reload', null);
      if (after && JOBS[after]) { let tries = 0; window.__rnResumePending = Date.now(); const t = setInterval(() => { tries++;
        if (window.__rnPaused) { clearInterval(t); window.__rnResumePending = 0; log(`새로고침 뒤 이어가기 '${JOBS[after][0]}': 일시정지 상태라 이어가지 않음 (개요 탭의 ▶ 다시 시작으로 계속)`, 1); return; }
        if (running && curKey === after && tries > 2) { clearInterval(t); window.__rnResumePending = 0; GM_setValue('rnu-resume-after-reload', null); return; } /* (1.72.1) 다른 길(⏰ 같은 회차 이어가기)로 이미 그 일이 다시 도는 중 — 끝난 뒤 '10분 동안 시작하지 못함' 경고를 잘못 적던 것 */
        if (running || (window.__rnRest && window.__rnRest())) return; /* (1.56.0) 이 PC의 수집기 탭이 이어감 */ if (tries > 200) { clearInterval(t); window.__rnResumePending = 0; GM_setValue('rnu-resume-after-reload', null); log(`새로고침 뒤 이어가기 '${JOBS[after][0]}'를 10분 동안 시작하지 못했습니다 — 개요 탭 '멈춘 작업'의 이어하기를 눌러 주세요`, 1); return; }
        if (!AS || !SCHED || !auth.currentUser) return; try { if (PUBONLY && !TGATE.ok) return; } catch (e) {} /* (1.71.2) ⏰ 설정·로그인·(로거) 테더링 확인을 기다림 */ clearInterval(t); window.__rnResumePending = 0; const rs = GM_getValue('rnu-resume-slot', null); GM_setValue('rnu-resume-slot', null); if (rs && rs.k === after && Date.now() - (rs.at || 0) < 30 * 60e3 && window.__rnSchedResume) { GM_setValue('rnu-resume-after-reload', null); log(`새로고침 뒤 ⏰ '${JOBS[after][0]}' (${rs.why})을(를) 같은 회차로 저장된 자리부터 이어갑니다 (수집기 ${VER})`); window.__rnSchedResume(rs); return; } GM_setValue('rnu-resume-after-reload', null); log(`새로고침 뒤 '${JOBS[after][0]}'을(를) 저장된 자리부터 이어갑니다 (수집기 ${VER})`); window.__rnAuto = true; runJob(after).finally(() => { window.__rnAuto = false; }); }, 3000); } }
  }
  /* ══════════ (1.59.2) 🛰 원격 조작 — 웹앱(⚙ 관리도구 › ① 도구)이나 다른 PC 수집기에서 이 PC를 골라 ■ 중단 · ▶ 다시 시작 · ⟳ 업데이트
   *  명령은 Firebase crm_system/pc_ctl 한 문서: cmds.{PC 이름} = { id, cmd, at, by, want(그때 가장 새 판) } · 결과는 acks.{PC 이름} = { id, cmd, state, msg, ver, at } · 보낸·받은 기록은 log에 덧붙임(지우지 않음)
   *  ■ 중단 = 이 PC의 모든 수집기 탭 일시정지(지금 항목까지 저장 — 개요의 ▶ 다시 시작 또는 원격 ▶로 이어감)
   *  ⟳ 업데이트 = 하던 작업을 저장 지점에서 멈추고 안전한 새로고침 → Tampermonkey에 있는 판으로 다시 뜸 → 하던 작업을 그 자리부터 이어감.
   *     새로 뜬 판이 웹앱이 본 가장 새 판보다 낮으면(그 PC의 Tampermonkey 동기화가 아직 안 옴) 15분마다(쉬는 사이) 다시 열어 확인, 최대 8번 — 결과는 웹앱에 그대로 보임
   *  명령은 6시간 지나면 버림(꺼져 있던 PC가 다음 날 켜지자마자 멈추지 않게) · 한 명령은 한 번만 (같은 id는 다시 안 함) */
  const CTL = () => C('crm_system').doc('pc_ctl');
  let ctlReload = null; // 하던 작업이 저장 지점에서 멈추면 runJob이 새로고침
  let CTL_DOC = null; let ctlDraw = () => {}; // 수집기 화면의 '🛰 PC 원격' 줄(watchPcs)이 씀
  const ctlLead = () => { try { const r = window.__rnRole ? window.__rnRole() : 'lead'; return r === 'lead' || r === 'force'; } catch (e) { return true; } };
  const ctlAck = (id, cmd, state, msg) => { log(`🛰 원격 ${({ stop: '■ 중단', resume: '▶ 다시 시작', update: '⟳ 업데이트' })[cmd] || cmd}: ${msg}`, state === 'fail' || state === 'nosync' ? 1 : 0);
    return CTL().set({ acks: { [PC_NAME]: { id, cmd, state, msg, ver: VER, at: nowIso() } }, log: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), pc: PC_NAME, id, cmd, state, msg: String(msg).slice(0, 200), ver: VER }) }, { merge: true }).catch(() => {}); };
  window.__rnCtlSend = async (pc, cmd) => { const want = ((await C('crm_system').doc('collector_version').get().catch(() => null)) || { data: () => ({}) }).data() || {}; const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await CTL().set({ cmds: { [pc]: { id, cmd, at: nowIso(), by: `${PC_NAME} 수집기`, want: Object.entries(want || {}).reduce((m, [k, x]) => (/^h_/.test(k) && x && x.ver && verNum(x.ver) > verNum(m) ? x.ver : m), (want && want.ver) || null) } }, log: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), pc, id, cmd, state: 'sent', msg: `${PC_NAME} 수집기에서 보냄`, ver: null }) }, { merge: true }); return id; };
  async function ctlUpdateNow(c) { GM_setValue('rnu-ctl-upd', { id: c.id, from: VER, want: c.want || null, n: 0, at: Date.now() });
    if (running && curKey && JOBS[curKey] && !imgRunning) { ctlReload = c.id; stopFlag = true; await ctlAck(c.id, 'update', 'stopping', `'${JOBS[curKey][0]}' 하던 중 — 지금 항목까지 저장하고 멈춘 뒤 새로고침, 새 판에서 그 자리부터 이어감`); return; }
    if (running || imgRunning || (window.__rnCrm && window.__rnCrm.busy())) { try { window.__rnCrm && window.__rnCrm.busy() && window.__rnCrm.pause(); } catch (e) {} if (imgRunning) stopFlag = true;
      await ctlAck(c.id, 'update', 'stopping', `작업(${running || (imgRunning ? '이미지' : '고객 작업')}) 저장 지점에서 멈추는 중 — 멈추면 새로고침`);
      for (let w = 0; w < 300 && (running || imgRunning || (window.__rnCrm && window.__rnCrm.busy())); w++) await sleep(1000); }
    if (running || imgRunning || (window.__rnCrm && window.__rnCrm.busy())) { GM_setValue('rnu-ctl-upd', null); return ctlAck(c.id, 'update', 'fail', '5분 안에 작업이 멈추지 않아 새로고침하지 않음 — 다시 보내거나 그 PC에서 확인'); }
    await ctlAck(c.id, 'update', 'reloading', `새로고침 중 (지금 ${VER})`); safeReload('🛰 원격 업데이트', null); }
  async function ctlBoot() { /* 원격 업데이트로 다시 뜬 탭: 판이 바뀌었는지 알림 · 아직 옛 판이면 15분마다 다시 열어 동기화 확인 */
    const u = GM_getValue('rnu-ctl-upd', null); if (!u || !u.id || !ctlLead()) return; if (Date.now() - (u.at || 0) > 12 * 3600e3) { GM_setValue('rnu-ctl-upd', null); return; }
    const reached = u.want ? verNum(VER) >= verNum(u.want) : true; const changed = verNum(VER) > verNum(u.from);
    if (reached || changed && !u.want) { GM_setValue('rnu-ctl-upd', null); return ctlAck(u.id, 'update', 'done', changed ? `새 판 ${VER}로 바뀜 (전 ${u.from}) — 하던 작업은 그 자리부터 이어감` : `다시 열기 끝 (판 ${VER} 그대로 — 이미 가장 새 판)`); }
    const n = (u.n || 0) + 1; if (n > 8) { GM_setValue('rnu-ctl-upd', null); return ctlAck(u.id, 'update', 'nosync', `8번 다시 열어도 ${VER} — 이 PC의 Tampermonkey에 새 판 ${u.want}이(가) 없음. 그 PC Tampermonkey의 동기화(또는 새 판 붙여넣기)를 확인하세요`); }
    GM_setValue('rnu-ctl-upd', { ...u, n, at: Date.now() }); await ctlAck(u.id, 'update', 'nosync', `다시 열었지만 아직 ${VER} (새 판 ${u.want}) — 이 PC의 Tampermonkey 동기화를 기다림 · 15분 뒤(쉬는 사이) 다시 열어 확인 ${n}/8`);
    let idle = null; const t = setInterval(() => { const busy = running || imgRunning || (window.__rnCrm && window.__rnCrm.busy()); const u2 = GM_getValue('rnu-ctl-upd', null); if (!u2 || u2.id !== u.id) { clearInterval(t); return; }
      if (busy) { idle = null; return; } idle = idle || Date.now(); if (Date.now() - idle < 60000 || Date.now() - u2.at < 15 * 60000) return; clearInterval(t); safeReload(`🛰 원격 업데이트 — 동기화 확인 ${n}/8`, null); }, 20000); }
  async function ctlWatch() { try { if (window.__rnRoleReady) await Promise.race([window.__rnRoleReady, sleep(15000)]); } catch (e) {} ctlBoot().catch(() => {});
    /* (1.63.6 전체 점검) pc_ctl.log는 명령마다 덧붙어 끝없이 커짐(1MB 넘으면 원격 조작이 멈춤) → 300줄 넘으면 앞쪽을 달별 보관 문서(crm_system/pc_ctl_log_YYYY-MM)로 옮기고 최근 200줄만 남김(지우지 않음 · 한 묶음) */
    const ctlTrim = async () => { try { await db.runTransaction(async (tx) => { const s0 = await tx.get(CTL()); const L = (s0.exists && s0.data().log) || []; if (L.length <= 300) return; const old = L.slice(0, L.length - 200); const byM = {}; old.forEach((x) => { const m = String((x && x.at) || nowIso()).slice(0, 7); (byM[m] = byM[m] || []).push(x); });
        for (const [m, arr] of Object.entries(byM)) tx.set(C('crm_system').doc('pc_ctl_log_' + m), { log: firebase.firestore.FieldValue.arrayUnion(...arr), at: nowIso() }, { merge: true }); tx.set(CTL(), { log: L.slice(-200) }, { merge: true }); }); log(`🛰 원격 조작 기록이 길어 앞쪽을 달별 보관 문서로 옮김 (최근 200줄만 남김)`); } catch (e) {} };
    CTL().onSnapshot(async (d) => { CTL_DOC = d.exists ? d.data() : null; try { ctlDraw(); } catch (e) {} if (d.exists && (d.data().log || []).length > 300 && !window.__rnCtlTrimAt) { window.__rnCtlTrimAt = 1; setTimeout(() => { ctlTrim().finally(() => { window.__rnCtlTrimAt = 0; }); }, Math.random() * 20000); } const c = ((d.exists && d.data().cmds) || {})[PC_NAME]; if (!c || !c.id || !c.cmd) return;
      const age = Date.now() - Date.parse(c.at || 0); const seen = GM_getValue('rnu-ctl-seen', null);
      if (!ctlLead()) { /* 쉬는 탭: 업데이트만 — 하는 일이 없으니 바로 다시 엶 */ if (c.cmd === 'update' && age < 6 * 3600e3 && sessionStorage.getItem('rn-ctl-upd') !== c.id && !running) { sessionStorage.setItem('rn-ctl-upd', c.id); setTimeout(() => location.reload(), 5000 + Math.random() * 10000); } return; }
      if (seen === c.id) return; GM_setValue('rnu-ctl-seen', c.id);
      if (window.__rnFeat && !window.__rnFeat('remote')) return ctlAck(c.id, c.cmd, 'fail', '이 PC는 🧩 \'원격 조작 받기\'를 꺼 둠 — 그 PC의 수집기 개요에서 켜야 받음');
      if (!(age >= -600000 && age < 6 * 3600e3)) return ctlAck(c.id, c.cmd, 'expired', `${Math.round(age / 3600e3)}시간 지난 명령이라 하지 않음`);
      try { if (c.cmd === 'stop') { if (window.__rnPaused) return ctlAck(c.id, 'stop', 'done', '이미 일시정지 상태'); window.__rnPauseAll(`🛰 원격 중단 — ${c.by || ''}`); return ctlAck(c.id, 'stop', 'done', `일시정지함 — 하던 작업은 지금 항목까지 저장하고 멈춤${running ? ` ('${running}')` : ''}`); }
        if (c.cmd === 'resume') { if (!window.__rnPaused) return ctlAck(c.id, 'resume', 'done', '일시정지 상태가 아니었음 (그대로 돎)'); window.__rnResumeOk(); return ctlAck(c.id, 'resume', 'done', '일시정지 풀음 — 매일 자동·요청·이어가기가 다시 돎'); }
        if (c.cmd === 'update') return ctlUpdateNow(c);
        return ctlAck(c.id, c.cmd, 'fail', '모르는 명령 (이 수집기 ' + VER + ')'); } catch (e) { return ctlAck(c.id, c.cmd, 'fail', '오류: ' + e.message); } }, () => {}); }
  // (1.26.1) 안전한 새로고침: 바로 location.reload()하면 알라딘이 429(요청 너무 많음)를 돌려줄 때 크롬 오류 화면에 멈춤(그 화면에서는 어떤 스크립트도 못 돎).
  //  ① 서버가 200으로 답할 때까지 기다림(30초 → 1·2·4…15분 간격으로 확인)  ② 새 탭으로 같은 화면을 엶  ③ 새 탭의 수집기가 실제로 떠서 '받았음' 신호를 보내면 이 탭을 닫음
  //  ④ 2분 안에 신호가 없으면(새 탭이 오류 화면) 그 탭을 닫고 ①부터 다시 — 수집기가 떠야만 넘어가므로 오류 화면에 멈추지 않음. 새 탭은 저장된 자리부터 자동으로 이어감
  const HANDOFF_TAB = Math.random().toString(36).slice(2, 10);
  async function safeReload(reason, resumeKey) { window.__rnReloading = Date.now(); /* (1.60.0) 새 탭으로 넘기는 동안 ⏰ 매일 자동이 새 일을 시작하지 않게 */
    if (resumeKey) GM_setValue('rnu-resume-after-reload', resumeKey);
    try { localStorage.setItem('rn-tab-handoff', JSON.stringify({ pwTab: sessionStorage.getItem('pw_tab'), at: Date.now() })); } catch (e) {} // 가격 감시 탭이었으면 새 탭이 이어받음
    /* (1.63.8) 새로 연 탭이 이어받지 못하면 그 탭을 닫고 '닫혔는지'(tab.closed) 확인 — 못 닫았으면 또 새 탭을 열지 않고 이 탭을 그 자리에서 새로고침(빈 탭이 쌓여 PC가 느려지던 것) */
    let lastTab = null; const closeTab = async (tb) => { if (!tb) return true; try { tb.close(); } catch (e) {} for (let i = 0; i < 12; i++) { if (tb.closed) return true; await sleep(500); } return !!tb.closed; };
    let wait = 30000; const tStart = Date.now(); log(`[안전한 새로고침] 시작 — 이유: ${reason}${resumeKey ? ` · 새 탭에서 이어갈 작업: '${(JOBS[resumeKey] || [resumeKey])[0]}'` : ''} · 지금 요청 간격 ${PACE.state().gap}ms${PACE.cooling() ? ` · 쉬는 중 ${Math.round(PACE.cooling() / 1000)}초 남음` : ''}`);
    for (let tryN = 1; ; tryN++) {
      let st = 0, em = ''; try { const r = await fetch(location.href, { credentials: 'include', cache: 'no-store' }); st = r.status; } catch (e) { st = 0; em = e.message; } log(`[안전한 새로고침] ${tryN}번째 서버 확인: ${st || '응답 없음'}${em ? ' (' + em + ')' : ''}${st === 429 ? ' — 요청 너무 많음' : ''} · 시작한 지 ${Math.round((Date.now() - tStart) / 60000)}분`);
      if (st === 200) {
        const id = HANDOFF_TAB + '_' + tryN; GM_setValue('rn-handoff', { id, at: Date.now() }); GM_setValue('rn-handoff-ack', null);
        if (lastTab && !lastTab.closed && !(await closeTab(lastTab))) { log(`[안전한 새로고침] 앞서 연 새 탭이 닫히지 않아 새 탭을 또 열지 않고 이 탭을 그 자리에서 새로고침합니다 (탭이 쌓이지 않게)`, 1); if (window.__rnFlush) await window.__rnFlush(); GM_setValue('rn-handoff', { id, at: Date.now() }); location.reload(); return; }
        log(`${reason}: 새 탭으로 다시 엽니다 (${tryN}번째)`); let tab = null; try { tab = GM_openInTab(location.href.replace(/#.*$/, ''), { active: true, insert: true, setParent: true }); } catch (e) {} lastTab = tab;
        const t0 = Date.now(); while (Date.now() - t0 < 120000) { await sleep(3000); if (GM_getValue('rn-handoff-ack', null) === id) { window.__rnLeadRelease && window.__rnLeadRelease(); log(`[안전한 새로고침] 새 탭이 이어받았습니다 (${Math.round((Date.now() - t0) / 1000)}초 만에) — 남은 기록을 저장하고 이 탭을 닫습니다 · 전체 ${Math.round((Date.now() - tStart) / 60000)}분 걸림`); if (window.__rnFlush) await window.__rnFlush(); await sleep(800); try { window.close(); } catch (e) {} await sleep(1500); /* (1.63.8) 닫기가 막힌 탭(사람이 연 탭)은 빈 화면으로 바꿔 코드가 모두 멈추게 — 새 탭이 확인해 남김 */ GM_setValue('rn-handoff-oldblank', { id, at: Date.now() }); location.replace('about:blank'); return; } }
        const closed = await closeTab(tab); if (closed) lastTab = null; log(`[안전한 새로고침] 새 탭이 2분 안에 뜨지 않았습니다(알라딘 오류 화면 — 429 등일 가능성) → 그 탭을 ${closed ? '닫고 닫힌 것을 확인함' : '닫지 못함 — 다음엔 새 탭을 또 열지 않고 이 탭을 새로고침'} · ${Math.round(wait / 6000) / 10}분 기다렸다 다시`, 1); PACE.fail('429');
      } else { log(`${reason}: 알라딘이 ${st || '응답 없음'}(${st === 429 ? '요청 너무 많음' : '아직 안 됨'}) — ${Math.round(wait / 6000) / 10}분 뒤 다시 확인`, 1); if (st === 429) PACE.fail('429'); }
      ui(`${reason} — 알라딘이 다시 받아 줄 때까지 기다리는 중`, 0, 0, `${Math.round(wait / 6000) / 10}분 뒤 다시 확인 (${tryN}번째) · 이 탭을 닫지 마세요`);
      await sleep(wait); wait = Math.min(wait * 2, 15 * 60000);
    }
  }
  /* (1.78.4) 🐕 작업 멈춤 지킴이 — 10/17 19:12 로거 벤치마킹이 왕공주 621쪽에서 멈춘 채(알라딘 응답 몸통을 받다 연결이 멈춤 → 시한 없음) 4시간 동안 '하는 중'으로 남아 다른 일·이어 하기가 모두 막혔던 것
   *  자동 일(⏰ 매일 자동·쉴 때 하는 일)이 '하는 중'인데 30분 넘게 진행 표시가 한 번도 바뀌지 않으면(알라딘 쉬는 중·일시정지·새로고침 중 제외) → 기록을 남기고 안전한 새로고침
   *  → 새 탭이 '하는 중'으로 남은 그 회차를 저장된 자리부터 이어감(⏰ 같은 회차 이어가기) · 같은 회차에서 3번 넘게 되풀이되면 더 하지 않음(기록만) */
  setInterval(() => { try { if (!running || !curKey || window.__rnPaused || window.__rnReloading) return; const at = window.__rnUiAt || 0; if (!at || Date.now() - at < 30 * 60e3) return; if (PACE.cooling && PACE.cooling() > 0) return;
      const k = 'rnu-stall-kick'; const v = GM_getValue(k, null) || {}; const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const n = v.day === day && v.job === curKey ? +v.n || 0 : 0; if (n >= 3) { if (!window.__rnStallNoted) { window.__rnStallNoted = 1; log(`🐕 '${(JOBS[curKey] || [curKey])[0]}'이(가) 또 30분 넘게 멈춤 — 오늘 이미 3번 다시 열어 더 하지 않음(직접 확인 필요)`, 1); } return; }
      GM_setValue(k, { day, job: curKey, n: n + 1, at: Date.now() }); log(`🐕 작업 멈춤: '${(JOBS[curKey] || [curKey])[0]}'이(가) ${Math.round((Date.now() - at) / 60000)}분 동안 진행이 없음(알라딘 응답을 받다 연결이 멈춘 듯) — 안전한 새로고침 뒤 그 회차를 저장된 자리부터 이어감 (오늘 ${n + 1}/3)`, 1); safeReload('🐕 멈춘 작업 다시 열기', null); } catch (e) {} }, 60e3);
  // 새 탭 쪽: 안전한 새로고침으로 열린 탭이면 '받았음' 신호
  { const h = GM_getValue('rn-handoff', null); if (h && h.id && Date.now() - h.at < 10 * 60000) { window.__rnClaimHeir && window.__rnClaimHeir(); GM_setValue('rn-handoff-ack', h.id); GM_setValue('rn-handoff', null); const rk = GM_getValue('rnu-resume-after-reload', null); log(`[안전한 새로고침] 이 탭이 새로 열려 이어받음 (옛 탭 신호 ${h.id}, ${Math.round((Date.now() - h.at) / 1000)}초 전)${rk ? ` · 곧 '${(JOBS[rk] || [rk])[0]}' 이어가기` : ''}`); } }
  // (1.25.1) 메모리 지킴이: 오래 도는 작업 중 이 탭의 메모리가 한계의 65%를 넘거나 숨은 창으로 연 페이지가 SET.reloadEveryFrames(400)개를 넘으면
  //  진행 위치를 저장하고 멈춘 뒤 탭을 새로고침해, 같은 작업을 그 자리부터 자동으로 이어감 (새로고침하면 탭 메모리가 처음으로 돌아감)
  let frameLoads = 0, memReload = false, verReload = false;
  setInterval(() => {
    if (!running || memReload) return; const m = performance && performance.memory; const ratio = m && m.jsHeapSizeLimit ? m.usedJSHeapSize / m.jsHeapSizeLimit : 0;
    if (ratio > 0.65 || frameLoads >= (SET.reloadEveryFrames || 400)) { memReload = true; stopFlag = true; log(`메모리 정리: ${ratio > 0.65 ? `메모리 ${Math.round(ratio * 100)}% 사용` : `숨은 창으로 연 페이지 ${frameLoads}개`} (메모리 ${m ? Math.round(m.usedJSHeapSize / 1048576) + 'MB / 한계 ' + Math.round(m.jsHeapSizeLimit / 1048576) + 'MB' : '모름'}) — 진행 위치를 저장하고 새로고침한 뒤 그 자리부터 이어갑니다`, 1); }
  }, 30000);
  // (1.26.0) 수동 실행(개별 수집 버튼을 사람이 누름): 기간 설정(○일 안에 본 것은 건너뜀)을 적용하지 않고 전부 다시 모음.
  //   일괄 수집·자동 실행·새로고침 뒤 이어가기는 지금처럼 기간 설정을 따름. 다시 모아도 기존 기록은 덮어쓰지 않고, 바뀐 것만 시각과 함께 덧붙임
  let FORCE_ALL = false;
  let lastRunErr = null, lastRunSt = null; // (1.60.0) lastRunSt = 끝난 모양(done·stop·error) — ⏰ 매일 자동이 봄
  async function runJob(key, opt) {
    const [name, fn] = JOBS[key]; lastRunErr = null; lastRunSt = null;
    if (window.__rnGate && !window.__rnGate(name)) return false; // (1.56.0) 쉬는 탭이면 시작 안 함 (사람이 누른 거면 켤지 물음)
    if (running && curKey === 'explore' && key !== 'explore') { const autoEx = !!((RUN_CTX && RUN_CTX.startsWith('rest:')) || window.__rnAutoSlot); log(`'${name}'을(를) 먼저 하려고 끝없는 탐색 수집을 잠시 멈춥니다 — ${autoEx ? '탐색은 ⏰가 차례대로 다시 잡음' : '끝나면 탐색을 다시 이어감'}`); if (!autoEx) GM_setValue('rn-explore-resume', true); /* (1.74.0) ✨·⏰가 돌린 탐색은 ⏰가 다시 잡음(사람 일처럼 이어 돌면 정한 시각 칸이 못 끼어듦) */ stopFlag = true; for (let w = 0; w < 180 && running; w++) await sleep(1000); stopFlag = false; }
    if (running) { log('이 탭에서 다른 작업 진행 중: ' + running + ' — 끝난 뒤 다시 누르세요 (한 PC에 수집기 하나가 원칙 · 꼭 동시에 해야 하면 새 탭의 [이 탭도 켜기…], 단점 안내 있음)', 1); return false; } /* (1.63.6) 바쁘면 false — ⏰ 자동이 '끝남'으로 잘못 적던 것 */
    curKey = key; FORCE_ALL = !!(opt && opt.manual) && !['chain', 'prdChain'].includes(key); setRunning(name); const tJ = Date.now(); if (FORCE_ALL) log(`수동 실행: '${name}'을(를) 기간 제한 없이 전부 모읍니다 (기존 기록은 그대로 두고 바뀐 것만 덧붙임)`); if (window.__rnStatus) Object.assign(window.__rnStatus, { job: name, jobKey: key, jobStart: tJ, cur: {}, chain: (key === 'chain' || key === 'prdChain') ? window.__rnStatus.chain : null, sub: null }); log(`▶ '${name}' 시작 (수집기 ${VER} · ${PC_NAME})`);
    let res;
    try { res = await fn(opt || {}); if (res === 'reload') { ui('새 버전으로 바꾸는 중 — 곧 이어감', 0, 0); } else if (res === 'cancel') { ui('취소함', 0, 0); log(`'${name}' 취소함`); } else if (res === false) { ui('시작 못 함 — 다른 PC가 알라딘 작업 중', 0, 0, '', '그 작업이 끝나면 자동으로 시작합니다 (일시정지를 누르면 취소)'); if (opt && opt.sched) log(`'${name}': 다른 PC가 알라딘 작업 중 — ⏰ 매일 자동이 다음 확인 때 다시`, 1); else { const wn = (WAIT_N[key] = (WAIT_N[key] || 0) + 1); if (wn >= 2) { WAIT_N[key] = 0; log(`'${name}': 자리가 비었는데도 다시 못 시작함 — 다른 PC가 같은 일을 맡아 하고 있어 이 PC는 더 기다리지 않음(그 PC가 끝냄)`, 1); } else { log(`'${name}': 다른 PC가 알라딘 작업 중이라 기다립니다. 끝나면 자동으로 시작합니다`, 1); waitThenRun(key); } } } /* (1.89.1) 같은 일을 다른 PC가 하는 동안 1분마다 '시작→못 함→끝남'을 되풀이하던 것(HOME·JS-MAIN 기록에 수십 번) */ else if (!stopFlag) { WAIT_N[key] = 0; ui('완료: ' + name, 1, 1, '', ''); log(name + ' 완료', 0); } }
    catch (e) { lastRunErr = e.message;
      const paused = e.message === '멈춤';
      ui(paused ? '일시정지됨 — 진행 위치 저장' : '오류로 멈춤', 0, 0, paused ? '' : e.message, '개요 탭의 ▶ 다시 시작(또는 멈춘 작업의 이어하기)을 누르면 멈춘 자리부터 합니다');
      if (!paused) log('오류: ' + e.message, 1);
    } finally { if (window.__rnStatus) Object.assign(window.__rnStatus, { job: null, jobKey: null, cur: {}, lastEnd: { name, at: Date.now(), ms: Date.now() - tJ } });
      lastRunSt = res === 'reload' ? 'stop' : lastRunErr ? (lastRunErr === '멈춤' ? 'stop' : 'error') : stopFlag ? 'stop' : 'done';
      try { if (res !== false && res !== 'cancel' && window.__rnJobDone) window.__rnJobDone('prd:' + key, Date.now() - tJ, lastRunSt); } catch (e) {} /* (1.60.0) ⏰ 일마다 걸린 시간 기록 */
      try { if (window.__rnPaused && stopFlag && !window.__rnAutoSlot && !window.__rnHelper && JOBS[key] && !window.__rnReloading) GM_setValue('rnu-resume-manual', { k: key, at: Date.now() }); } catch (e) {} /* (1.72.0) 일시정지로 멈춘 사람이 누른 일 → ▶ 다시 시작 때 이어감 */
      log(`■ '${name}' 끝남 — ${Math.round((Date.now() - tJ) / 60000)}분${stopFlag ? ' (멈춤)' : ''}`); setRunning(null); curKey = null; FORCE_ALL = false;
      if (memReload) { log(`메모리 정리를 위해 새로고침 → '${name}' 이어가기`); safeReload('메모리 정리', key); return res; }
      if (ctlReload) { ctlReload = null; log(`🛰 원격 업데이트: '${name}'을(를) 저장하고 멈춤 → 새로고침 뒤 그 자리부터 이어감`); safeReload('🛰 원격 업데이트', key); return res; }
      if (verReload) { verReload = false; if (!window.__rnPaused) { log(`새 수집기 ${window.__rnOutdated}로 바꾸려고 새로고침 → '${name}'을(를) 저장된 자리부터 이어가기`); GM_setValue('rnu-reload-for', window.__rnOutdated); safeReload('새 버전으로 바꿈', key); return res; } }
      if (yieldFor) resumeAfterYield();
      else if (key !== 'explore' && GM_getValue('rn-explore-resume', false)) setTimeout(() => { if (!running && !window.__rnPaused && GM_getValue('rn-explore-resume', false)) { GM_setValue('rn-explore-resume', false); log('앞의 작업이 끝나 끝없는 탐색 수집을 다시 이어갑니다'); runJob('explore'); } }, 8000); }
    return res;
  }
  window.__rnPrd = { runJob: (k) => runJob(k), busy: () => !!running, pause: () => { if (running || imgRunning) stopFlag = true; } };
  let waitTimer = null; const WAIT_N = {};
  function waitThenRun(key) {
    clearInterval(waitTimer); const t0 = Date.now(); $('#rnpCtlStop') && ($('#rnpCtlStop').style.display = '');
    waitTimer = setInterval(async () => {
      if (stopFlag || window.__rnPaused) { clearInterval(waitTimer); stopFlag = false; ui('기다리기 취소 (일시정지)', 0, 0); return; }
      if (Date.now() - t0 > 6 * 3600e3) { clearInterval(waitTimer); log('6시간 기다렸지만 알라딘 작업이 끝나지 않아 취소했습니다', 1); return; }
      try { const pubW = isPubKey(key); const lk = (await (pubW ? LOCKP : LOCK)().get()).data(); if (laneBusy(lk, pubW)) { ui(`기다리는 중 — ${lk.pcName || '다른 PC'}: ${lk.taskLabel || ''}`, 0, 0, `${Math.round((Date.now() - t0) / 60000)}분째`, '끝나면 자동으로 시작합니다 (일시정지를 누르면 취소)'); return; }
        clearInterval(waitTimer); if (!running) { log('알라딘 작업이 끝났습니다. 시작합니다'); runJob(key); } } catch (e) {}
    }, 60000);
  }
  // 양보 뒤 자동 이어가기: 잠금이 풀리고(고객 수집 끝) 새 양보 요청이 없으면 멈춘 작업을 다시 시작
  function resumeAfterYield() {
    const y = yieldFor; ui(`양보 중 — '${y.tool || '고객 수집'}'이 끝나면 자동으로 이어감`, 0, 0, `${y.pcName || ''}`);
    const t0 = Date.now(); let saw = false;
    const t = setInterval(async () => {
      try { const pubY = isPubKey(y.key); const d = await (pubY ? LOCKP : LOCK)().get(); const x = d.exists ? d.data() : null; const fresh = x && x.holder && Date.now() - (x.heartbeatMs || 0) < 5 * 60000;
        const higher = fresh && ((!pubY && legacyOther(x, Date.now())) || (laneBusy(x, pubY) && Object.values(freshPcs(x, Date.now())).some((v) => (v.prio ?? 0) >= y.myPrio)));
        if (higher) { saw = true; return; } if (!saw && Date.now() - t0 < 3 * 60000) return; // 양보받은 작업이 잠금을 잡는 것을 본 뒤(또는 3분 뒤)에
        clearInterval(t); const key = y.key; yieldFor = null; stopFlag = false; if (window.__rnPaused) { log('양보가 끝났지만 일시정지 상태라 이어가지 않습니다'); return; } log('더 중요한 작업이 끝났습니다. 멈췄던 작업을 이어갑니다'); if (key && JOBS[key]) runJob(key); } catch (e) {}
    }, 60000);
  }
  /* (1.56.3) ⏭ 강제 실행 건너뛰기 토글 — app_settings/bench.forceSkip {on, h} (웹앱과 같은 값) */
  { const c = box.querySelector('#rnPubHelp'); if (c) { c.checked = pubHelpOn(); c.onchange = () => { GM_setValue('rn-pubHelp', c.checked); log(`🌐 남는 PC 돕기: ${c.checked ? '켬 — 놀 때 다른 PC의 🎯 한 바퀴·⏰ 공개 읽기 일을 나눠 함' : '끔 — 이 PC는 직접 시킨 일·담당 일만'}`); try { window.__rnToast && window.__rnToast(`🌐 남는 PC 돕기 ${c.checked ? '켬' : '끔'}`); } catch (e) {} }; } }
  { const on = box.querySelector('#rnBfOn'), hh = box.querySelector('#rnBfH'); if (on && hh) { const wr = () => { const h = Math.max(1, Math.min(168, Math.round(+hh.value || 20))); hh.value = h; box.querySelector('.rn-bfs').classList.toggle('on', on.checked); C('app_settings').doc('bench').set({ forceSkip: { on: on.checked, h, by: PC_NAME, at: nowIso() } }, { merge: true }).then(() => log(`⏭ 강제 실행 건너뛰기 ${on.checked ? `켬 — 최근 ${h}시간 안에 끝까지 읽은 판매자는 건너뜀` : '끔 — 처음 판매자부터 모두'}`)).catch((e) => log('건너뛰기 설정 저장 실패: ' + (e.code || e.message), 1)); };
      on.onchange = wr; hh.onchange = wr; auth.onAuthStateChanged((u) => { if (u) C('app_settings').doc('bench').onSnapshot((d) => { const f = ((d.exists && d.data()) || {}).forceSkip || {}; if (globalThis.__rnAE() !== hh) hh.value = f.h || 20; { const r = ((d.exists && d.data()) || {}).resume || {}; const n = r.n || 10; const el = box.querySelector('#rnBrTxt'); if (el) el.textContent = `📍 이어 읽기: 마지막 ${n}개 중 ${r.match || Math.ceil(n * 0.7)}개 이상 · 앞뒤 ${r.pages || 3}쪽 · ${r.cover || 50}% 넘게 읽어야 통계 (웹앱 🎯에서 바꿈)`; } on.checked = !!f.on; box.querySelector('.rn-bfs').classList.toggle('on', !!f.on); }, () => {}); }); } }
  box.querySelectorAll('[data-job]').forEach((b) => (b.onclick = () => { window.__rnResumeOk && window.__rnResumeOk(); return b.dataset.job === 'images' ? images() : runJob(b.dataset.job, { manual: true }); }));

  /* (1.38.0) 멈춘 작업 목록 — 어느 PC에서 멈췄든 전부. 개요 화면이 작업마다 [이어하기]·[버리기]로 보여 줌
   *  예전 문제: ① 맨 앞 하나만 보여서, 하나를 버리면 다음 멈춘 작업이 같은 자리에 떠 '안 지워진' 것처럼 보였음
   *            ② 다른 탭에서 돌고 있는 작업을 버리면, 그 탭이 다음 저장 때 다시 '멈춘 작업'으로 써 넣어 되살아났음 → 돌고 있는 작업은 버리기를 막음
   *  버리기 = '멈춘 자리'만 잊음. 받은 기록은 하나도 지우거나 바꾸지 않음 (다음엔 처음부터 훑되 이미 받은 것은 건너뜀) */
  const STAGE_JOB = { bench: 'bench', images: 'images', scanNew: 'scanNew', aladinBuy: 'aladinBuy', buyback: 'buyback', market: 'market', nbMarket: 'nbMarket', soldInfo: 'soldInfo', poolInfo: 'poolInfo', photos: 'photos', usedInfo: 'usedInfo', rev6m: 'rev6mStale', revTop: 'revTop', dynamic: 'dynamic', scanFull: 'scanFull', revAll: 'revAll' };
  let resumeKey = null; let RESUMABLES = [];
  function runningKeys() { const ks = new Set(); const addChain = (k, stage) => { ks.add(k); if (stage && STAGE_JOB[stage]) ks.add(STAGE_JOB[stage]); };
    if (curKey) addChain(curKey, curStage);
    try { (window.__rnLive ? window.__rnLive() : []).forEach((v) => { if (v.busy && v.jobKey) addChain(v.jobKey, v.chain && v.chain.cur); }); } catch (e) {}
    Object.values(PCS_SEEN).forEach((x) => { if (x && x.running && x.key && Date.now() - (x.atMs || 0) < 3 * 60000) ks.add(x.key); });
    return ks; }
  async function refreshResume() {
    try {
      const qs = await C('prd_jobs').where('done', '==', false).get(); const list = {};
      qs.forEach((d) => { if ((JOBS[d.id] || /^bench_/.test(d.id)) && d.id !== 'explore') list[d.id] = d.data(); }); /* (1.48.0) 집중 벤치마킹은 판매자마다 bench_{번호} */
      const hide = new Set(); ['chain', 'prdChain'].forEach((c) => { const st = list[c] && list[c].stage; if (st && STAGE_JOB[st]) hide.add(STAGE_JOB[st]); }); // 일괄의 '지금 단계' 자리는 일괄 안에 묶어 보여 줌
      const pr = (j) => (j && j._n ? `${(+j._i || 0).toLocaleString()} / ${(+j._n).toLocaleString()}` : '');
      const nameOf = (k) => (JOBS[k] ? JOBS[k][0] : /^bench_/.test(k) ? `🎯 집중 벤치마킹 · ${(list[k] && list[k].name) || k.slice(6)}` : k);
      /* (1.48.0) 멈춘 자리 전부를 보여 줌 — 일괄의 '지금 단계' 자리도 따로 한 줄(└)로 · 줄마다 이어하기·버리기 */
      const keys = [...new Set(['chain', 'prdChain', ...Object.keys(JOBS), ...Object.keys(list)])].filter((k) => list[k]);
      RESUMABLES = keys.map((k) => { const j = list[k]; const st = j.stage; const sj = st && STAGE_JOB[st] ? list[STAGE_JOB[st]] : null; const sub = hide.has(k);
        return { key: k, name: (sub ? '└ 일괄 안 단계: ' : '') + nameOf(k), by: j.by || '', savedAt: j.savedAt || 0, stage: st ? (STEP_LABEL[st] || st) : null, prog: sj ? pr(sj) : j.page ? `${j.page}쪽 · ${(Array.isArray(j.items) ? j.items.length : 0).toLocaleString()}개` : pr(j), sub }; });
      resumeKey = RESUMABLES.length ? RESUMABLES[0].key : null;
      $('#rnpCtlResume').classList.remove('on'); // 예전 버튼 자리 — 개요로 옮김
    } catch (e) {}
    try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {}
    return RESUMABLES;
  }
  async function discardJob(k) { const nm = JOBS[k] ? JOBS[k][0] : /^bench_/.test(k) ? '집중 벤치마킹 ' + k.slice(6) : k;
    if (!JOBS[k] && !/^bench_/.test(k) && !((await jobRef(k).get()).exists)) return { ok: false, why: '모르는 작업' };
    /* (1.63.2) 벤치마킹 판매자 하나의 멈춘 자리 버리기 — 예전엔 어느 PC든 벤치마킹이 돌고 있으면(다른 판매자를 읽는 중이어도) 모두 막혔음.
     *  이제는 그 판매자를 지금 읽고 있을 때만 막음: 이 PC의 탭이 읽는 중 · 또는 다른 PC가 최근 5분 안에 그 판매자 진행을 적음(bench_state.prog.at) */
    if (/^bench_\d+$/.test(k)) { const sc = k.slice(6); if (window.__rnBenchCur === sc) return { ok: false, why: `'${nm}'은(는) 이 PC가 지금 읽고 있습니다 — 일시정지한 뒤에 버리세요` };
      try { const pg = ((await C('bench_state').doc(sc).get()).data() || {}).prog; const at = pg && Date.parse(pg.at || ''); if (at && Date.now() - at < 5 * 60000 && !Object.values(PCS_SEEN).every((x) => !x || !x.running || x.key !== 'bench')) return { ok: false, why: `'${nm}'은(는) 다른 PC가 지금 읽고 있습니다(${new Date(at + 9 * 3600e3).toISOString().slice(11, 16)}에 ${pg.page || '?'}쪽 적음) — 그 PC를 멈춘 뒤(🛰 PC 원격 ■) 버리세요` }; } catch (e) {} }
    else if (runningKeys().has(k)) return { ok: false, why: `'${nm}'은(는) 지금 진행 중입니다 — 먼저 일시정지하고, 멈춘 뒤에 버리세요` };
    const keys = [k]; if (k === 'chain' || k === 'prdChain') { const st = ((await jobRef(k).get()).data() || {}).stage; if (st && STAGE_JOB[st]) keys.push(STAGE_JOB[st]); } // 일괄이면 일괄 순서표와 '지금 단계'의 자리
    for (const x of keys) { try { const d = (await jobRef(x).get()).data(); if (d && !d.done) await jobRef(x).set({ done: true, discarded: true, discardedAt: Date.now(), discardedBy: PC_NAME }, { merge: true }); LS.set('job_' + x, null); if (/^bench_\d+$/.test(x)) { try { await C('bench_state').doc(x.slice(6)).set({ prog: null }, { merge: true }); } catch (e) {} try { const fr = C('prd_jobs').doc('benchForce'); const fd = (await fr.get()).data(); if (fd && fd.done === false && (fd.list || []).includes(x.slice(6))) { await fr.set({ fin: { [x.slice(6)]: 'skip:' + nowIso() }, savedAt: Date.now() }, { merge: true }); log(`🎯 '${nm}'은(는) 지금 멈춰 있는 강제 실행에서 건너뜁니다 — 이어하기 하면 다음 판매자부터 (다음 강제 실행·자동 수집 땐 처음부터 다시)`); } } catch (e) {} /* (1.63.5) 강제 실행 중 버린 판매자는 이번 강제 실행에서 건너뜀 */ } /* (1.54.3) 벤치마킹 회차를 버리면 '하는 중' 표시도 지움 — 다시 시작해도 그 판매자를 처음부터 다시 읽지 않고 평소 차례대로 */ } catch (e) { return { ok: false, why: e.message }; } }
    log(`'${nm}'의 멈춘 자리만 잊었습니다 (받은 기록은 그대로 · 다음엔 처음부터 훑되 이미 받은 것은 건너뜀)`); await refreshResume(); return { ok: true }; }
  function resumeJob(k) { const only = /^bench_\d+$/.test(k) ? k.slice(6) : null; if (/^bench_/.test(k)) k = 'bench'; if (!JOBS[k]) return; if (running) { log(`이어하기 못 함: 이 탭은 '${running}' 진행 중입니다`, 1); return { ok: false, why: `이 탭은 '${running}' 진행 중` }; } if (runningKeys().has(k)) { log(`이어하기 못 함: '${JOBS[k][0]}'은(는) 이미 진행 중입니다(다른 PC·탭)`, 1); return { ok: false, why: '이미 진행 중(다른 PC·탭)' }; } window.__rnResumeOk && window.__rnResumeOk(); runJob(k, only ? { only } : undefined); return { ok: true }; } /* (1.63.6) 팝업 대신 기록 줄 · 판매자 한 줄의 이어하기는 그 판매자부터(멈춘 강제 실행이 없으면 그 판매자만) */
  $('#rnpCheck').onclick = () => preflight(false).then((ok) => ok && alert('시작 전 점검: 모두 정상입니다. 자세한 내용은 기록 창에 있습니다.'));
  $('#rnpLogBig').onclick = (e) => { e.preventDefault(); window.__rnJournalToggle && window.__rnJournalToggle(); };
  $('#rnpResume').onclick = () => { if (resumeKey) resumeJob(resumeKey); };
  $('#rnpReset').onclick = async () => { if (!resumeKey) return; const r = await discardJob(resumeKey); if (!r.ok) log('이어하기 없애기 못 함: ' + r.why, 1); };
  Object.assign(window.__rnPrd, { resumables: () => RESUMABLES, refreshResume, discard: discardJob, resume: resumeJob, runningKeys, imgBusy: () => !!imgRunning, startAll: () => runJob('chain'), pcsHtml: () => ($('#rnpPcs') ? $('#rnpPcs').innerHTML : ''), who: () => ($('#rnpWho') ? $('#rnpWho').textContent : ''), ver: () => VER, outdated: () => window.__rnOutdated || null });
  setInterval(() => { if (!running) refreshResume(); }, 10 * 60000); // 멈춘 작업 문서는 진행 목록이 커서(수백 KB) 자주 읽지 않음 — 작업이 끝날 때·버릴 때·개요의 ↻ 때 바로 다시 읽음
  setTimeout(drawTemp, 2000);
  /* (1.63.0) '상품 일괄 수집' 단추 글 = 아래에서 체크한 단계만, 실제 도는 차례대로 작은 칩 → 칩 (전체 해제면 '고른 단계 없음') · 체크를 바꾸면 바로 */
  const drawChainBtn = () => { const sm = $('#rnpChainTxt'); if (!sm) return; const st = SET.steps || {}; const L = CHAIN_ORDER.filter((k) => k !== 'crm' && STEP_LABEL[k] && st[k] !== false); const all = CHAIN_ORDER.filter((k) => k !== 'crm' && STEP_LABEL[k]).length; const b = sm.closest('button');
    if (b) b.classList.toggle('rnch-off', !L.length);
    sm.innerHTML = L.length ? L.map((k) => `<span class="rnch">${STEP_LABEL[k]}</span>`).join('<span class="rnch-a">›</span>') + `<span class="rnch-n">${L.length === all ? `전체 ${all}단계` : `${L.length}/${all}단계`}</span>` : '<span class="rnch-0">고른 단계 없음 — 아래에서 할 것을 체크하세요</span>'; };
  const drawSteps = () => { const el = $('#rnpSteps'); if (!el) return; drawChainBtn(); const ORD = [...CHAIN_ORDER.filter((k) => STEP_LABEL[k]), ...Object.keys(STEP_LABEL).filter((k) => !CHAIN_ORDER.includes(k))]; el.innerHTML = '<span style="color:#5B6B66">이번에 할 것:</span> <a href="#" data-stepall="1" style="color:#2F5D50">전체 선택</a> · <a href="#" data-stepall="0" style="color:#2F5D50">전체 해제</a><br>' + ORD.map((k) => [k, STEP_LABEL[k]]).map(([k, l]) => `<label style="white-space:nowrap"><input type="checkbox" data-step="${k}" ${(SET.steps || {})[k] !== false ? 'checked' : ''}> ${l}</label>`).join('');
    el.querySelectorAll('[data-stepall]').forEach((a) => (a.onclick = (ev) => { ev.preventDefault(); const on = a.dataset.stepall === '1'; SET.steps = Object.fromEntries(Object.keys(STEP_LABEL).map((k) => [k, on])); C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 단계 ${on ? '전체 선택' : '전체 해제'} (모든 PC에 적용)`); drawSteps(); }));
    el.querySelectorAll('[data-step]').forEach((c) => (c.onchange = () => { SET.steps = { ...(SET.steps || {}), [c.dataset.step]: c.checked }; C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 '${STEP_LABEL[c.dataset.step]}' ${c.checked ? '켬' : '끔'} (모든 PC에 적용)`); drawChainBtn(); })); };
  setTimeout(drawSteps, 1500); setInterval(drawSteps, 60000);
  $('#rnpRevTest').onclick = () => { if (running) return log('다른 작업 진행 중', 1); reviewTest().catch((e) => log('시험 실패: ' + e.message, 1)); };

  // 다른 PC 상태: 잠금(고객 수집기 포함) + 각 PC가 30초마다 올리는 진행 상황
  const PCS_SEEN = {};
  /* (1.59.2) 🛰 PC 원격 — 다른 PC 수집기를 ■ 중단 · ▶ 다시 시작 · ⟳ 업데이트 (누르면 '확정' 단추가 한 번 더 · 4초 안에 다시 눌러야 보냄) */
  function ctlRows(pcs, now) { const by = new Map(); Object.values(pcs).forEach((s) => { if (!s || !s.pcName || s.tool !== '상품 수집기' || !s.ver || String(s.pcName) === String(PC_NAME)) return; const o = by.get(s.pcName); if (!o || (s.atMs || 0) > o.atMs) by.set(s.pcName, { pc: s.pcName, ver: s.ver, atMs: s.atMs || 0, running: s.running || null }); });
    const L = [...by.values()].filter((x) => now - x.atMs < 3 * 864e5).sort((a, b) => String(a.pc).localeCompare(String(b.pc))); if (!L.length) return '';
    const D = CTL_DOC || {}; const esc2 = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    return `<div class="pc" style="background:#F4F8F6"><b>🛰 PC 원격</b> <small style="color:#5B6B66">다른 PC 수집기를 멈추거나 다시 열기 (그 PC가 수집기 1.59.2 이상일 때)</small>${L.map((x) => { const a = (D.acks || {})[x.pc]; const c = (D.cmds || {})[x.pc]; const alive = now - x.atMs < 10 * 60000; const old = verNum(x.ver) < verNum('1.59.2');
      const st = c && (!a || a.id !== c.id) ? `<span style="color:#A8661B">보냄 · 대답 기다림 (${esc2(({ stop: '중단', resume: '다시 시작', update: '업데이트' })[c.cmd] || c.cmd)})</span>` : a ? `<span style="color:${a.state === 'done' ? '#2F7D4F' : a.state === 'fail' || a.state === 'nosync' || a.state === 'expired' ? '#B0322A' : '#1F5FAF'}">${esc2(a.msg)}</span>` : '';
      return `<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #DCE5E1"><b>${esc2(x.pc)}</b> · ${esc2(x.ver)} · ${alive ? (x.running ? '작업 중' : '대기') : `신호 ${Math.round((now - x.atMs) / 60000)}분 전`}${old ? ' <small style="color:#B0322A">(옛 판 — 원격 명령을 모름 · 다른 PC가 새 판으로 돌면 쉬는 사이에 스스로 한 번 새로고침)</small>' : ''}
        <div style="display:flex;gap:4px;margin-top:3px">${[['stop', '■ 중단'], ['resume', '▶ 다시 시작'], ['update', '⟳ 업데이트']].map(([k, l]) => `<button class="b2" style="flex:1;padding:3px 4px;font-size:11px" data-ctl="${esc2(x.pc)}|${k}">${l}</button>`).join('')}</div>${st ? `<div style="font-size:10.5px;margin-top:2px">${st}</div>` : ''}</div>`; }).join('')}</div>`; }
  globalThis.__rnOn('click', async (e) => { const b = e.target.closest && e.target.closest('#rnpPcs [data-ctl]'); if (!b) return; e.preventDefault(); const [pc, cmd] = b.dataset.ctl.split('|');
    if (b.dataset.arm !== '1') { const t0 = b.textContent; b.dataset.arm = '1'; b.dataset.t0 = t0; b.style.background = '#B0322A'; b.style.color = '#fff'; b.textContent = '확정'; setTimeout(() => { if (b.isConnected && b.dataset.arm === '1') { b.dataset.arm = ''; b.style.background = ''; b.style.color = ''; b.textContent = b.dataset.t0; } }, 4000); return; }
    b.dataset.arm = ''; b.disabled = true; b.textContent = '보내는 중…'; try { await window.__rnCtlSend(pc, cmd); log(`🛰 ${pc}에 원격 '${({ stop: '중단', resume: '다시 시작', update: '업데이트' })[cmd]}' 보냄`); } catch (er) { log('🛰 원격 명령 보내기 실패: ' + (er.code || er.message), 1); b.disabled = false; b.textContent = b.dataset.t0; } });
  function watchPcs() {
    let lock = null; const pcs = PCS_SEEN;
    const render = () => {
      const rows = [];
      const now = Date.now();
      if (lock && lock.holder && now - (lock.heartbeatMs || 0) < 5 * 60000 && lock.holder !== PC_ID) rows.push(`<div class="pc busy"><b>${lock.pcName}</b>에서 알라딘 작업 중: ${lock.taskLabel || lock.task}<br>마지막 신호 ${Math.round((now - lock.heartbeatMs) / 60000)}분 전</div>`);
      Object.entries(pcs).forEach(([id, s]) => {
        if (id === `prd_${PC_ID}_${pubKey}` || id === 'img_' + PC_ID || id === 'prd_' + PC_ID) return;
        const ago = Math.round((now - (s.atMs || 0)) / 60000);
        if (!s.running && ago > 60) return;
        const alive = ago <= 3;
        rows.push(`<div class="pc ${s.running && alive ? 'busy' : ''}"><b>${s.pcName}</b>${s.tool ? ` · ${s.tool}` : ''} · ${s.running ? (alive ? '진행 중' : `신호 끊김 (${ago}분 전)`) : `대기 (${ago}분 전)`}${s.running ? `<br>${s.state || s.running}${s.total ? ` ${Number(s.done).toLocaleString()} / ${Number(s.total).toLocaleString()} (${((s.done / s.total) * 100).toFixed(1)}%)` : ''}${s.etaMin != null && alive ? ` · 남은 약 ${fmtDur(s.etaMin)}` : ''}` : ''}</div>`);
      });
      $('#rnpPcs').innerHTML = (rows.join('') || '<div class="pc">다른 PC에서 진행 중인 작업 없음</div>') + ctlRows(pcs, now);
    };
    ctlDraw = render;
    LOCK().onSnapshot((d) => { lock = d.exists ? d.data() : null; render(); }, () => {});
    C('rn_status').onSnapshot((qs) => { qs.forEach((d) => (pcs[d.id] = d.data())); render(); }, () => {});
    setInterval(render, 60000);
  }

  // 등록 파일 가져오기: 끌어다 놓기 또는 눌러서 고르기
  $('#rnpDrop').onclick = () => $('#rnpFile').click();
  $('#rnpFile').onchange = async (e) => { for (const f of e.target.files) await runFile(f); e.target.value = ''; };
  async function runFile(f) {
    if (running) { log('다른 작업 진행 중: ' + running, 1); return; }
    setRunning('파일 가져오기');
    try { await importFile(f); ui('완료: 파일 가져오기', 1, 1, f.name, ''); } catch (e) { ui('오류로 멈춤', 0, 0, e.message); log('오류: ' + e.message, 1); } finally { setRunning(null); }
  }

  (async () => {
    renderSetup();
    const u = await ensureLogin();
    $('#rnpWho').textContent = `Firebase: ${u.email} 로그인됨`;
    await loadSettings(); renderSetup(); engineSwitch(); try { if (!PUBONLY) GM_setValue('rn-officeMem', SET.officeMemLogin === true); } catch (e) {} /* (1.72.0 · 기본 끔) 🔑 사무실 PC 로그인 메모리 보관 — 다음 화면부터 */ setInterval(() => { loadSettings().then(engineSwitch).catch(() => {}); }, 5 * 60e3);
    watchPcs(); await refreshResume(); versionWatch(); ctlWatch();
    publishStatus({ running: null });
    ui('대기 중', 0, 0, '', resumeKey ? '멈춘 작업이 있습니다. 위의 이어하기를 누르세요' : '처음이라면: 등록 파일 가져오기 → 상품 일괄 수집 → 이미지');
    log(`준비됨 · 수집기 ${VER} · 파서 ${P.VERSION}`, 0);
  })();
})();


}]);
