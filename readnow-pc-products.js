/* readnow-pc-products.js — 리드나우 수집기 1.43.0의 모듈 ②③⑤⑦ 상품·시장·판매자·매입·일괄/매일 자동 — 상품 조회, 도서 정보·시장 지표, 사진, 매물 유의 사항, 판매자 평가, 구매자 분포, 알라딘 구매·팔기, 맡긴 일, 일정
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { products: '1.43.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
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
  const VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '1.43.0'; // (1.36.0) 예전엔 '1.27.0'에 멈춰 있었음 — 표시만이 아니라 'PC끼리 새 판 맞추기'(crm_system/collector_version)도 1.27.0으로 비교해 멈춰 있었음. 이제 맨 위 @version 한 곳
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
  if (!/\/scm\/(wrecord_edit|worders|worder_preparatory_complete)\.aspx/i.test(location.pathname) || window.top !== window) return; // 통합 수집기: 상품 조회·주문조회 화면 어디서나
  const WRITER_SCHEMA = 6;
  const P = window.ReadnowProducts || globalThis.ReadnowProducts;
  const PACE = P.makePacer('aladin'); // 알라딘 요청 속도: 이 PC의 모든 탭·스크립트가 같이 씀 (readnow-products-core.js makePacer)
  if (!P) { alert('[리드나우 상품 수집기] 파서 파일(readnow-products-core.js)을 불러오지 못했습니다. GitHub에 올렸는지 확인해 주세요.'); return; }
  // 공용 파일이 요구 버전보다 '옛것'일 때만 알림 (같거나 더 새것이면 조용히 씀). 요구 버전은 이 한 곳에서만 정함
  const NEED_FILES = { '상품 파서 readnow-products-core.js': [() => P.VERSION, '0.14.0'], '판매자 파서 readnow-sellers-core.js': [() => (window.ReadnowSellers || globalThis.ReadnowSellers || {}).VERSION, '1.3.0'], '판매자 분류 기준 readnow-core.js': [() => (((typeof unsafeWindow !== 'undefined' && unsafeWindow.ReadNowCore) || window.ReadNowCore || globalThis.ReadNowCore || {}).CORE_VERSION), '1.3.0'], '판정 엔진 readnow-pricing-core.js': [() => (window.ReadnowPricing || globalThis.ReadnowPricing || {}).VERSION, '0.9.1'], '출고 기준 readnow-shipping-core.js': [() => (window.ReadnowShipping || globalThis.ReadnowShipping || {}).VERSION, '0.5.1'], '관리도구 노선표 readnow-registry.js': [() => (window.ReadnowRegistry || globalThis.ReadnowRegistry || {}).VERSION, '0.2.0'] };
  const verN = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
  const OLD_FILES = Object.entries(NEED_FILES).map(([k, [g, w]]) => [k, g(), w]).filter(([, v, w]) => verN(v) < verN(w));
  if (OLD_FILES.length) alert(`[리드나우 수집기] GitHub의 공용 파일이 이 수집기보다 옛 버전입니다:\n${OLD_FILES.map(([k, v, w]) => `· ${k}: ${v || '못 읽음'} (필요 ${w} 이상)`).join('\n')}\n새 파일을 올린 뒤 몇 분 뒤 새로고침해 주세요.`);
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
    document.body.appendChild(ov); ov.querySelector('#mv_x').onclick = (e) => { e.preventDefault(); ov.remove(); }; ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
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
    const tbl = document.querySelector('input.batchChkBox'); if (!tbl || document.getElementById('rn-mon-legend')) return;
    const lg = document.createElement('div'); lg.id = 'rn-mon-legend'; lg.style.cssText = 'margin:6px 0;padding:6px 10px;border:1px solid #D6DDDA;border-radius:8px;background:#fff;font-size:12px;color:#1E2B28';
    const rp = S0.rollout || {}; lg.innerHTML = `<b>가격 감시 범례</b> (판정 엔진 · 적용 ${rp.treatPct || 0}% / 비교 ${rp.controlPct || 0}%) ` + Object.entries(MON).map(([k, [l, fg, bg, why]]) => `<span title="${why}" style="display:inline-block;margin:0 4px;padding:1px 6px;border-radius:8px;background:${bg};border:1px solid ${fg};color:${fg};font-weight:700">${l} <small>이 쪽 ${n[k]}</small> <a href="#" data-monall="${k}" style="color:${fg}">전체 모아보기</a> <a href="#" data-monhere="${k}" style="color:${fg}">이 쪽만</a></span>`).join('') + ' <a href="#" data-monhere="" style="color:#5B6B66">이 쪽 전부 보기</a><br><span style="color:#5B6B66">줄 배경색 = 묶음 · 표시 없는 줄 = 감시 대상 아님 · 알라딘 목록은 알라딘 서버가 25~100개씩 나눠 보내므로, 전체에서 고르기는 \'전체 모아보기\'(우리 상품 기록 기준)로 봅니다</span>';
    const table = tbl.closest('table'); if (table && table.parentNode) table.parentNode.insertBefore(lg, table);
    lg.querySelectorAll('[data-monhere]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const k = a.dataset.monhere; document.querySelectorAll('input.batchChkBox').forEach((cb) => { const tr = cb.closest('tr'); if (!tr) return; const b = tr.querySelector('.rn-mon'); const show = !k || (b && b.dataset.g === k); tr.style.display = show ? '' : 'none'; const sep = tr.nextElementSibling; if (sep && !sep.querySelector('input.batchChkBox')) sep.style.display = show ? '' : 'none'; }); }));
    lg.querySelectorAll('[data-monall]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); openMonView(a.dataset.monall, S0).catch((er) => alert('모아보기 실패: ' + er.message)); }));
  }
  setTimeout(() => paintMonitorBadges().catch(() => {}), 800);
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
  async function cashStopCmd(ref, v) { const key = `${ref.id}`; const gate = await exBegin('cashStop', key, { orderId: v.orderId, lineNo: v.lineNo, listingId: v.listingId || null, title: v.title || null });
    if (!gate.ok) { await ref.set({ status: 'done', doneAt: nowIso(), by: PC_NAME, result: { state: gate.state === 'done' ? 'skip' : 'check', msg: '실행 문: ' + gate.why }, uploadedAt: TS() }, { merge: true }); return; } // 같은 맡긴 일을 이미 시작했던 것 — 다시 보내지 않고 사람 확인
    try { await cashStopCmd0(ref, v); } finally { let st = 'unknown', msg = null; try { const r = ((await ref.get()).data() || {}).result || {}; st = r.state === 'done' || r.state === 'skip' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown'; msg = r.msg || null; } catch (e) {} await exEnd('cashStop', key, st, msg); } }
  async function cashStopCmd0(ref, v) { const t = { id: v.orderId, it: { lineNo: v.lineNo, listingId: v.listingId || null, listingKey: v.listingKey || null, aladinUsedCode: v.usedCode || null, title: v.title || '' } };
    try { const sn = (await C('crm_orders').doc(v.orderId).get()).data(); const it0 = sn && (sn.items || []).find((x) => x.lineNo === v.lineNo);
      if (!it0 || it0.released || it0.lineStatus !== 'normal' || (it0.aladinStop && it0.aladinStop.status === 'done')) { await ref.set({ status: 'done', result: { state: 'skip', msg: '이미 처리됐거나 판매 줄이 아님' }, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); return; }
      const lid = await cashLidOf(t); const before = (await statusCodeOf(t.it)) || 1; let al = await setAladinStatus(lid, before, 15); let ok = await cashInStopList(lid, t.it.title); let usedBefore = before;
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
      document.getElementById('rn-cash-bar')?.remove(); document.getElementById('rn-cash-chip')?.remove();
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
  setTimeout(() => paintCashSold(), 1200);
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

  const DEFAULTS = { keyScheme: 'aladinItemId', reloadEveryFrames: 400, reqMinMs: 700, reqStartMs: 1200, reqMaxMs: 20000, delayMs: 700, fallbackNaver: false, fallbackGoogle: false, previewImages: false, pageTimeoutSec: 25, dynamicParts: false, recheckDays: 7, topN: 50, rev6mDays: 7, nbDays: 7, photoMatch: 0.9, maxLanes: 1, ipGroups: { HOME: 'home' }, scanFullDays: 7, revAllDays: 7, crmAnyPc: false, autoDaily: true, autoHour: 17, autoPc: 'JS-MAIN', autoGraceMin: 30, reqPc: 'JS-MAIN', dynDaily: 0, dynDays: 30, dynScope: 'all', maxLoginTries: 6, prio: {}, usedInfoDays: 30, shipAutoMin: 15, steps: { usedInfo: true, nbMarket: true, soldInfo: true, poolInfo: true, images: true, photos: true, scanFull: true, revAll: true, crm: true, scanNew: true, aladinBuy: true, buyback: true, market: true, rev6m: true, revTop: true, dynamic: true }, autoLogin: true, loginRetrySec: 60 };
  let SET = { ...DEFAULTS };
  /* 중요도: 숫자가 클수록 먼저. 알라딘 작업 잠금을 낮은 작업이 쥐고 있으면 높은 작업이 양보를 요청 → 낮은 작업은 진행 위치를 저장하고 멈췄다가, 높은 작업이 끝나면 자동으로 이어감.
   * 기본값 근거: 돈·고객에 바로 닿는 것(주문·고객 > 새 등록 > 알라딘 팔기·구매 정산) → 가격 판단 재료(시장 지표) → 경쟁 분석(판매자) → 장기 분석(구매자 분포) 순 */
  const PRIO_DEFAULT = { crm: 100, scanNew: 90, buyback: 80, aladinBuy: 75, scanFull: 70, market: 60, rev6m: 50, revTop: 45, rev6mAll: 40, dynamic: 30, revAll: 20 };
  const PRIO_KEY = { usedInfo: 'market', soldInfo: 'market', poolInfo: 'market', photos: 'market', nbMarket: 'market', scanNew: 'scanNew', scanFull: 'scanFull', aladinBuy: 'aladinBuy', buyback: 'buyback', market: 'market', rev6mStale: 'rev6m', rev6m: 'rev6m', rev6mAll: 'rev6mAll', revTop: 'revTop', revAll: 'revAll', dynamic: 'dynamic', dynamic0: 'dynamic', dynAll: 'dynamic', crm: 'crm' };
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
  #rnp .sl{margin-top:5px;display:flex;flex-direction:column;gap:4px} #rnp .sl.dim{opacity:.55} #rnp .sr{display:flex;gap:7px;align-items:flex-start;background:#fff;border:1px solid #DCE5E1;border-radius:7px;padding:5px 6px} #rnp .sr.on{border-color:#9CCBAE}
  #rnp .sb{flex:1;min-width:0} #rnp .sb b{font-size:12px;display:block} #rnp .sb small{font-size:10.5px;color:#5B6B66;display:block} #rnp .tl{margin-top:2px;font-size:11px;display:flex;flex-wrap:wrap;gap:3px;align-items:center} #rnp .tl a{color:#2F5D50;margin-left:2px}
  #rnp .ts{border:1px solid #DCE5E1;border-radius:9px;padding:0 6px;background:#fff;white-space:nowrap} #rnp .ts.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rnp .ts.running{background:#FFF4E5;border-color:#E8C88F} #rnp .ts.error{background:#FDECEA;border-color:#E3A29B;color:#B0322A} #rnp .ts.late{border-color:#E8C88F;color:#A8661B}
  #rnp .sw2{position:relative;display:inline-block;width:30px;height:17px;flex:0 0 auto;margin-top:1px} #rnp .sw2.big{width:38px;height:21px} #rnp .sw2 input{opacity:0;width:0;height:0} #rnp .sw2 span{position:absolute;inset:0;background:#C9D2CE;border-radius:20px;transition:.15s;cursor:pointer}
  #rnp .sw2 span:before{content:'';position:absolute;width:13px;height:13px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.15s} #rnp .sw2.big span:before{width:17px;height:17px} #rnp .sw2 input:checked+span{background:#2F5D50} #rnp .sw2 input:checked+span:before{transform:translateX(13px)} #rnp .sw2.big input:checked+span:before{transform:translateX(17px)}
  #rnp .rn-bench{border:1px dashed #8E6BBF;border-radius:8px;padding:6px;background:#F6F1FC} #rnp .rn-bench .cap{color:#6B3FA0;font-weight:bold} #rnp .rn-bench .b2{background:#EFE6FA;border-color:#D5C2EE;color:#5A3D7A}
  #rnp button{font-size:12px;cursor:pointer;border-radius:5px}
  #rnp button:disabled{opacity:.4;cursor:not-allowed}
  #rnp .b1{width:100%;padding:10px;border:0;background:${K.cloth};color:#fff;font-size:14px;font-weight:bold}
  #rnp .b1:hover:not(:disabled){background:#264D42}
  #rnp .b1 small{display:block;font-size:11px;font-weight:normal;opacity:.85}
  #rnp .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-top:5px}
  #rnp .b2{padding:7px 2px;border:1px solid #C9DDD5;background:${K.clothSoft};color:${K.cloth};font-weight:bold}
  #rnp .b2:hover:not(:disabled){border-color:${K.cloth}}
  #rnp .b2.multi{background:#fff;border-style:dashed}
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
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'rnp';
  box.innerHTML = `
  <div class="hd"><b>리드나우 상품 수집</b><span>v${VER} (눌러서 접기)</span></div>
  <div class="bd">
    <div class="setup"></div>
    <div class="sec rnp-sched" id="rnpSched"><div class="hint2">⏰ 매일 자동 수집 — 설정을 불러오는 중 (구글 로그인 필요)</div></div>
    <div class="sec">
      <button class="b1" data-job="prdChain">상품 일괄 수집<small>신규 등록 → 알라딘 구매(전체)·팔기 → 도서·시장 지표 → 판매완료·알라딘 풀 정보 → 이미지 → 판매자 평가 → 구매자 분포 → 전체 재검토 → 판매자 평가 전체 · 고객까지 하려면 개요 탭의 ▶ 전체 수집</small></button><div id="rnpSteps" style="display:flex;flex-wrap:wrap;gap:2px 8px;font-size:11.5px;margin:4px 0 0"></div><button style="display:none"></button>
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
      <div class="g2"><button class="b2" data-job="nbMarket" title="알라딘 미등록·세트·새상품 페이지 없는 상품: 바깥 검색(중고) 화면의 따로 등록된 같은 책들로 경쟁·시세">검색 시세 (미등록·세트)</button><button class="b2" data-job="photos" title="새상품 표지가 없는 상품: 우리 상품 페이지의 사진을 전부">우리 상품 사진</button><button class="b2" data-job="usedInfo" title="우리 책 온라인 중고 첫 페이지에서 우리보다 앞에 있는 매물과 바로 뒤 몇 개(설정): 중고상품 구매 유의 사항 글과 사진 — 가격 결정 화면 블록의 ? 표시">경쟁 매물 유의사항·사진</button></div>
    </div>
    <details class="sec" style="margin-top:10px"><summary class="cap" style="cursor:pointer">예비 · 가끔 쓰는 것 (펼치기)</summary>
      <p class="cap" style="margin-top:6px">출고 — 클라우드가 1분마다 하므로 클라우드가 멈췄을 때만</p>
      <div class="g2"><button class="b2" data-job="shipRead" title="판매관리 주문확인요청·발송 요청 탭의 주문을 읽어 웹앱 \'오늘 출고\'로 보냄 (클라우드가 10분 넘게 멈춰 있으면 영업일 9~16시에 15분마다 저절로)">주문확인요청·발송 요청 읽기</button></div>
    <div class="rn-bench" style="margin-top:8px">
      <p class="cap">🔭 벤치마킹 · 시장 조사 <span style="font-weight:normal">— 우리 운영과 따로 (남의 책·시장 전체)</span></p>
      <div class="g2"><button class="b2" data-job="explore" title="우리 책들의 함께 산 책에서 시작해 새 책마다 도서 정보·사진·시장 지표·구매자 분포를 모으고 그 책의 함께 산 책으로 끝없이 넓혀 감 (일괄 수집에는 안 들어감, 다른 작업이 시작되면 잠시 멈췄다 이어감)">끝없는 탐색 수집 ∞</button><button class="b2" data-job="dynAll" title="새상품 페이지의 구매자 연령대·함께 산 책·클릭한 상품 — 안 모은 책 전부">구매자 분포 전체 수집</button></div>
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
  document.body.appendChild(box);
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
  function ui(state, done, total, sub, next) {
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
    const cores = G ? G.loadedVers({ ReadNowCore: gv('ReadNowCore'), ReadnowSellers: gv('ReadnowSellers'), ReadnowProducts: gv('ReadnowProducts'), ReadnowPricing: gv('ReadnowPricing'), ReadnowShipping: gv('ReadnowShipping'), ReadnowOrders: gv('ReadnowOrders'), ReadnowRegistry: G }) : null;
    return C('rn_status').doc(`prd_${PC_ID}_${key}`).set({ tool: '상품 수집기', pcName: LS.get('pcName', PC_ID), running: running || null, key, ...lastUi, ...(extra || {}), ver: APP_VER, cores, mods: window.__rnMods || null, atMs: Date.now(), ...W() }, { merge: true }).catch(() => {});
  }
  let running = null; let stopFlag = false;
  function setRunning(name) {
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
    const items = [
      ['구글 로그인', !!auth.currentUser, 'login'],
      ['이 PC 이름', !!LS.get('pcName'), 'pcname'],
      ['알라딘 아이디·비밀번호 (자동 재로그인용)', !!(cred && cred.id && cred.pw), 'cred'],
    ];
    const el = $('.setup');
    if (items.every((x) => x[1])) { el.className = 'setup done'; el.textContent = `✓ 설정 완료 · ${auth.currentUser.email.split('@')[0]} · PC: ${LS.get('pcName')}`; return; }
    el.className = 'setup todo';
    el.innerHTML = `<h5>처음 한 번 해야 할 설정</h5><ul>${items.map(([t, ok, k]) => `<li class="${ok ? 'ok' : 'no'}"><span>${ok ? '✓ ' : ''}${t}</span>${ok ? '' : `<button data-fix="${k}">하기</button>`}</li>`).join('')}</ul>`;
    el.querySelectorAll('[data-fix]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.fix;
      if (k === 'login') auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(renderSetup).catch((e) => log('로그인 실패: ' + e.message, 1));
      if (k === 'pcname') { const n = prompt('이 PC의 이름 (예: JS-MAIN, HOME)', (window.__rnPcName && window.__rnPcName.get()) || ''); if (n && n.trim()) { window.__rnPcName && window.__rnPcName.set(n.trim()); $('#rnpName').value = n.trim(); renderSetup(); } }
      if (k === 'cred') { box.classList.remove('showimp', 'showguide'); box.classList.add('showset'); $('#rnpId').focus(); }
    }));
  }

  /* ───────── 설정 (모든 PC 공유) ───────── */
  async function loadSettings() {
    const d = await C('prd_system').doc('settings').get();
    SET = { ...DEFAULTS, ...(d.exists ? d.data() : {}) };
    PACE.setCfg({ minMs: SET.reqMinMs, startMs: SET.reqStartMs, maxMs: SET.reqMaxMs }); // 모든 수집·감시가 이 값을 같이 씀
    $('#rnpDelay').value = SET.reqMinMs; $('#rnpDelayMax').value = SET.reqMaxMs; $('#rnpUsedDays').value = SET.usedInfoDays ?? 30; $('#rnpUsedAfter').value = SET.usedInfoAfter ?? 3; $('#rnpUsedChain').value = SET.usedInfoChainMin ?? 60; $('#rnpRecheck').value = SET.recheckDays; $('#rnpNaver').checked = !!SET.fallbackNaver; $('#rnpGoogle').checked = !!SET.fallbackGoogle; $('#rnpKey').value = SET.keyScheme; $('#rnpName').value = LS.get('pcName', '');
  }
  const saveSet = (patch) => { Object.assign(SET, patch); return C('prd_system').doc('settings').set({ ...patch, updatedBy: auth.currentUser.email, ...W() }, { merge: true }); };
  $('#rnpDelay').onchange = (e) => { const v = Math.max(300, +e.target.value || 600); saveSet({ reqMinMs: v }); PACE.setCfg({ minMs: v }); };
  $('#rnpDelayMax').onchange = (e) => { const v = Math.max(2000, +e.target.value || 15000); saveSet({ reqMaxMs: v }); PACE.setCfg({ maxMs: v }); };
  $('#rnpUsedDays').onchange = (e) => saveSet({ usedInfoDays: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpUsedAfter').onchange = (e) => saveSet({ usedInfoAfter: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpUsedChain').onchange = (e) => saveSet({ usedInfoChainMin: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpRecheck').onchange = (e) => saveSet({ recheckDays: Math.max(0, Math.round(+e.target.value)) });
  $('#rnpNaver').onchange = (e) => saveSet({ fallbackNaver: e.target.checked });
  $('#rnpGoogle').onchange = (e) => saveSet({ fallbackGoogle: e.target.checked });
  $('#rnpName').onchange = (e) => { (window.__rnPcName && window.__rnPcName.set($('#rnpName').value)), LS.set('pcName', e.target.value.trim() || PC_ID); renderSetup(); };
  // 저장 상태를 눈으로 확인: 초록 = 저장 완료(더 넣을 필요 없음), 주황 = 비어 있음, 빨강 = 최근 자동 로그인 실패
  function renderCred() {
    { const box = $('#rnpCredSt'); if (box && !document.getElementById('rnpLoginM')) box.insertAdjacentHTML('beforebegin', `<div id="rnpLoginM" style="margin:4px 0;font-size:12px"><b>다시 로그인 방식</b> <label><input type="radio" name="rnpLm" value="naver"> 네이버로 로그인 (권장)</label> <label><input type="radio" name="rnpLm" value="id"> 알라딘 아이디·비밀번호</label><div id="rnpNaverSt" style="color:#5B6B66"></div></div>`);
      const m = window.__rnLoginMethod ? window.__rnLoginMethod() : 'naver'; document.querySelectorAll('input[name="rnpLm"]').forEach((r) => { r.checked = r.value === m; r.onchange = () => { GM_setValue('rnu-login-method', r.value); renderCred(); }; });
      const ok = GM_getValue('rnu-naver-okAt', 0), fail = GM_getValue('rnu-naver-failAt', 0), need = GM_getValue('rnu-need-naver', 0); const t = (ms) => new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const st = document.getElementById('rnpNaverSt'); if (st) st.textContent = m !== 'naver' ? '아이디 로그인은 자동입력방지가 생겨 자동으로 안 될 수 있습니다' : need && need > ok ? `⚠ 네이버 로그인 필요 (${t(need)}) — 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)` : ok ? `✓ 마지막 네이버 자동 로그인 ${t(ok)}` : '이 PC 브라우저에서 네이버에 한 번 로그인(로그인 상태 유지)해 두면 자동으로 다시 로그인합니다';
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
  $('#rnpCredSave').onclick = () => {
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
  const lockGroup = () => { const g = (SET.ipGroups || { HOME: 'home' })[String(PC_NAME || '').toUpperCase()] || (SET.ipGroups || {})[PC_NAME] || 'office'; return g; };
  const lockDocId = () => (lockGroup() === 'office' ? 'work_lock' : 'work_lock_' + lockGroup());
  const LOCK = () => C('crm_system').doc(lockDocId());
  const JOBREG = () => C('crm_system').doc('running_jobs');
  let lockBeat = null; let lockHeld = false; let yieldUnsub = null; let yieldFor = null; let laneCount = 1; let myJobLabel = null; let lastSame = false;
  const TAB_FRESH = 5 * 60000;
  const freshPcs = (d, now) => { const o = Object.fromEntries(Object.entries((d && d.pcs) || {}).filter(([, v]) => v && now - (v.at || 0) < TAB_FRESH));
    if (d && d.holder && String(d.task || '').startsWith('product_') && !o[d.holder] && d.heartbeatMs && now - d.heartbeatMs < TAB_FRESH) o[d.holder] = { name: d.pcName, at: d.heartbeatMs, prio: d.prio ?? 50, job: String(d.task).slice(8), tabs: d.tabs || {}, legacy: true }; // 1.7.0 전 버전이 잡은 자리
    return o; };
  const legacyOther = (d, now) => d && d.holder && d.heartbeatMs && now - d.heartbeatMs < TAB_FRESH && !String(d.task || '').startsWith('product_') && d.holder !== PC_ID; // 고객 수집이 잡고 있음
  function lockFields(pcs, d) { const arr = Object.entries(pcs); if (!arr.length) return null; const [hid, h] = arr.sort((a, b) => (b[1].prio ?? 0) - (a[1].prio ?? 0))[0];
    return { writerSchema: WRITER_SCHEMA, holder: hid, pcName: h.name, task: 'product_' + (h.job || ''), taskLabel: '상품 수집기: ' + arr.map(([, v]) => `${v.name}(${Object.values(v.tabs || {}).map((t) => t.job).join('+')})`).join(' · '), prio: Math.max(...arr.map(([, v]) => v.prio ?? 0)), minPrio: Math.min(...arr.map(([, v]) => v.prio ?? 0)), startedAt: (d && d.startedAt) || nowIso(), heartbeatMs: Date.now(), pcs, by: auth.currentUser.email }; }
  async function acquireLane(lane, label) {
    if (lane !== 'aladin') return { ok: true };
    if (!(window.__rnPcName && window.__rnPcName.get())) { const n = window.__rnRemote ? null : window.__rnPcName && window.__rnPcName.ask(''); if (n) $('#rnpName').value = n; }
    const name = (window.__rnPcName && window.__rnPcName.get()) || LS.get('pcName', PC_ID); const job = (curStage && STEP_LABEL[curStage]) || label || running || ''; const myPrio = curPrio(); const maxN = Math.max(1, +SET.maxLanes || 1);
    const t0 = Date.now(); let asked = false;
    for (;;) {
      try {
        await db.runTransaction(async (tx) => {
          const s = await tx.get(LOCK()); const d = s.exists ? s.data() : null; const now = Date.now();
          const rg = await tx.get(JOBREG()); const reg = rg.exists ? rg.data() : {}; const other = reg[job]; // 같은 작업은 어느 PC든 한 곳만
          if (other && other.pc !== PC_ID && now - (other.at || 0) < TAB_FRESH) { const e = new Error('SAMEJOB'); e.info = { job, holder: other.name }; throw e; }
          if (legacyOther(d, now)) { const e = new Error('LOCKED'); e.info = d; throw e; }
          const pcs = freshPcs(d, now); const mine = pcs[PC_ID] || { name, tabs: {} };
          const tabs = {}; Object.entries(mine.tabs || {}).forEach(([k, v]) => { if (k !== TAB_ID && v && now - (v.at || 0) < TAB_FRESH) tabs[k] = v; });
          if (Object.values(tabs).some((v) => v.job === job)) { const e = new Error('SAMEJOB'); e.info = { job, holder: '이 PC의 다른 탭' }; throw e; }
          if (!pcs[PC_ID] && Object.keys(pcs).length >= maxN) { const e = new Error('LOCKED'); e.info = { ...(d || {}), prio: Math.min(...Object.values(pcs).map((v) => v.prio ?? 0)), lowPc: Object.entries(pcs).sort((a, b) => (a[1].prio ?? 0) - (b[1].prio ?? 0))[0][0] }; throw e; }
          tabs[TAB_ID] = { at: now, job, prio: myPrio };
          pcs[PC_ID] = { name, at: now, job, prio: Math.max(...Object.values(tabs).map((v) => v.prio ?? 0)), tabs };
          const low = Object.entries(tabs).some(([k, v]) => k !== TAB_ID && (v.prio ?? 0) < myPrio); // 같은 PC의 다른 탭에 낮은 작업 → 양보 요청
          tx.set(LOCK(), { ...lockFields(pcs, d), ...(low ? { yieldReq: { prio: myPrio, pc: PC_ID, tab: TAB_ID, target: PC_ID, pcName: name, tool: job, at: now } } : {}) });
          tx.set(JOBREG(), { [job]: { pc: PC_ID, name, at: now } }, { merge: true });
        });
        break;
      } catch (e) {
        if (e.message === 'LOCKED') { const hp = e.info.prio ?? 100;
          if (hp < myPrio && Date.now() - t0 < 6 * 60000) { // 낮은 작업이 자리를 차지 → 가장 낮은 PC에 양보 요청하고 기다림
            if (!asked) { asked = true; log(`${e.info.pcName || '다른 PC'}의 '${e.info.taskLabel || ''}'(중요도 ${hp})보다 '${job}'(중요도 ${myPrio})이 먼저입니다. 양보를 요청하고 기다립니다`); }
            await LOCK().set({ yieldReq: { prio: myPrio, pc: PC_ID, tab: TAB_ID, target: e.info.lowPc || null, pcName: name, tool: job, at: Date.now() } }, { merge: true }).catch(() => {});
            ui(`양보 기다리는 중 — ${e.info.pcName || ''}: ${e.info.taskLabel || ''}`, 0, 0, `${Math.round((Date.now() - t0) / 1000)}초`); await sleep(10000); continue; }
          return { ok: false, holder: e.info.pcName, job: e.info.taskLabel, minutes: Math.round((Date.now() - (e.info.heartbeatMs || Date.now())) / 60000), prio: hp }; }
        if (e.message === 'SAMEJOB') { lastSame = true; return { ok: false, holder: e.info.holder === '이 PC의 다른 탭' ? '이 PC의 다른 탭' : e.info.holder, job: e.info.job, minutes: 0, same: true }; }
        throw e;
      }
    }
    myLockPrio = myPrio; myJobLabel = job;
    lockHeld = true; clearInterval(lockBeat);
    lockBeat = setInterval(() => { if (!lockHeld) return; const now = Date.now(); LOCK().set({ heartbeatMs: now, writerSchema: WRITER_SCHEMA, pcs: { [PC_ID]: { at: now, tabs: { [TAB_ID]: { at: now, job, prio: myLockPrio } } } } }, { merge: true }).catch(() => {}); JOBREG().set({ [job]: { pc: PC_ID, name, at: now } }, { merge: true }).catch(() => {}); }, 60000);
    // 양보 요청(나보다 중요한 작업, 나를 지목했거나 지목 없음) → 진행 위치 저장 후 멈춤 → 끝나면 자동으로 이어감. 묶음 안 PC 수만큼 요청 간격을 늘림
    if (!yieldUnsub) yieldUnsub = LOCK().onSnapshot((d) => { const x = d.exists ? d.data() : null; laneCount = Math.max(1, Object.keys(freshPcs(x, Date.now())).length); const y = x && x.yieldReq;
      if (lockHeld && running && y && Date.now() - (y.at || 0) < 3 * 60000 && !yieldFor && (y.prio ?? 100) > myLockPrio && !(y.pc === PC_ID && y.tab === TAB_ID) && (!y.target || y.target === PC_ID)) { yieldFor = { ...y, key: curKey, myPrio: myLockPrio }; stopFlag = true; log(`${y.pcName || '다른 PC'}의 '${y.tool || '고객 수집'}'(중요도 ${y.prio ?? 100})이 더 중요해 양보합니다 (지금 작업 중요도 ${myLockPrio}). 진행 위치를 저장하고 멈췄다가, 끝나면 자동으로 이어갑니다`, 1); } }, () => {});
    return { ok: true };
  }
  async function releaseLane(lane) {
    if (lane !== 'aladin') return;
    clearInterval(lockBeat); if (!lockHeld) return; lockHeld = false; const job = myJobLabel;
    try {
      await db.runTransaction(async (tx) => {
        const s = await tx.get(LOCK()); const rg = await tx.get(JOBREG()); const now = Date.now();
        if (rg.exists && rg.data()[job] && rg.data()[job].pc === PC_ID) tx.set(JOBREG(), { [job]: firebase.firestore.FieldValue.delete() }, { merge: true });
        if (!s.exists) return; const d = s.data(); const pcs = freshPcs(d, now); const mine = pcs[PC_ID]; if (!mine) return;
        const tabs = {}; Object.entries(mine.tabs || {}).forEach(([k, v]) => { if (k !== TAB_ID && v && now - (v.at || 0) < TAB_FRESH) tabs[k] = v; });
        if (Object.keys(tabs).length) pcs[PC_ID] = { ...mine, tabs, at: now, prio: Math.max(...Object.values(tabs).map((v) => v.prio ?? 0)), job: Object.values(tabs)[0].job }; else delete pcs[PC_ID];
        if (legacyOther(d, now)) tx.set(LOCK(), { pcs: Object.keys(pcs).length ? pcs : firebase.firestore.FieldValue.delete() }, { merge: true }); // 고객 수집이 잡은 잠금은 건드리지 않음
        else if (Object.keys(pcs).length) tx.set(LOCK(), lockFields(pcs, d)); else tx.delete(LOCK());
      });
    } catch (e) {}
  }
  const laneBusy = (d) => { const now = Date.now(); if (!d) return false; if (legacyOther(d, now)) return true; const pcs = freshPcs(d, now); delete pcs[PC_ID]; return Object.keys(pcs).length >= Math.max(1, +SET.maxLanes || 1); };
  const lockMsg = (l) => (l.holder === '이 PC의 다른 탭' ? `이 PC의 다른 탭에서 '${l.job}'을(를) 이미 하고 있습니다. 같은 작업은 한 탭에서만 합니다` : `다른 PC(${l.holder})에서 '${l.job}' 작업 중입니다 (마지막 신호 ${l.minutes}분 전). 끝난 뒤 다시 누르세요. 이미지 작업은 지금도 가능합니다`);

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
  async function politeWait() { await PACE.wait(sleep, lockHeld ? laneCount : 1); } // 같은 묶음(인터넷 주소)에서 여러 PC가 동시에 돌면 그만큼 간격을 늘림

  const looksLoggedOut = (finalUrl, doc) => AL.looksLoggedOut(finalUrl, doc);
  const getDoc = AL.makeReader({ pace: PACE, sleep, wait: politeWait, beforeEach: () => { if (stopFlag) throw new Error('멈춤'); },
    loggedOut: (fu, doc, url) => AL.looksLoggedOut(fu, doc, { url, scmNeedsLogout: true }),
    onLoggedOut: async (fu, loginTries) => {
      if (!SET.autoLogin) throw new Error('알라딘 로그인이 풀렸습니다. 직접 로그인한 뒤 같은 버튼을 다시 누르세요');
      if ((SET.maxLoginTries ?? 6) > 0 && loginTries > (SET.maxLoginTries ?? 6)) { try { GM_notification({ title: '리드나우 수집기', text: '알라딘 다시 로그인 실패 — 수집을 멈췄습니다. 로그인 후 이어하기' }); } catch (e) {} throw new Error(`알라딘 다시 로그인을 ${SET.maxLoginTries ?? 6}번 시도했지만 실패해 멈췄습니다 (진행 위치 저장) — 로그인이 풀렸습니다. 알라딘에 로그인한 뒤 이어하기`); }
      if (loginTries > 1) { ui('자동 로그인 재시도 대기', 0, 0, `${SET.loginRetrySec}초 뒤 다시 시도`); await sleep(SET.loginRetrySec * 1000); }
      PACE.fail('login'); await autoRelogin(fu, loginTries); },
    fatal: (e) => e.message === '멈춤' || /로그인이 풀렸/.test(e.message),
    maxOutageMin: () => MAX_OUTAGE_MIN, outageError: (m) => new Error(`알라딘 서버가 ${m}분 넘게 응답하지 않아 멈췄습니다. 나중에 같은 버튼으로 이어하세요`),
    on429: (st) => { log(`알라딘이 요청이 너무 많다고 함(${st}) — 이 PC의 모든 수집이 ${Math.round(PACE.cooling() / 60000)}분 쉬고, 간격을 ${PACE.state().gap}ms로 늘림`, 1); ui('알라딘 요청 제한(429) — 쉬는 중', 0, 0, `${Math.round(PACE.cooling() / 1000)}초 뒤 느린 속도로 이어감`); },
    onRecover: () => log('서버 연결 회복, 계속합니다'),
    onRetry: (e, w) => log(`요청 실패(${e.name === 'AbortError' ? '응답 시간 초과' : e.message}). ${w}초 뒤 재시도`, 1) });
  async function isLoggedIn() { try { const r = await fetch('/scm/wmain.aspx', { credentials: 'include' }); const h = await r.text(); return r.ok && /wC2Cuser_logout/.test(h); } catch (e) { return false; } }
  async function autoRelogin(loginUrl, tryNo) {
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') { ui(`네이버로 다시 로그인 중 (${tryNo}번째)`, 0, 0); const ok = await window.__rnNaverLogin({ isLoggedIn, log: (m, lv) => log(m, !!lv), stopped: () => stopFlag, ret: 'https://www.aladin.co.kr/scm/wmain.aspx' }); try { renderCred(); } catch (e) {} if (!ok && tryNo >= 2) throw new Error('네이버로 다시 로그인하지 못했습니다. 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)한 뒤 같은 버튼을 다시 누르세요'); return ok; }
    const cred = (GM_getValue('rnp-cred', null) || GM_getValue('rn-cred', null));
    if (!cred || !cred.id || !cred.pw) throw new Error('알라딘 로그인이 풀렸습니다. 설정에 아이디·비밀번호를 넣으면 다음부터 자동으로 다시 로그인합니다. 지금은 직접 로그인한 뒤 같은 버튼을 누르세요');
    log(tryNo > 1 ? `자동 로그인 ${tryNo}번째 시도` : '로그인이 풀려 자동으로 다시 로그인합니다', 1); ui(`자동 로그인 중 (${tryNo}번째)`, 0, 0);
    const url = /login/i.test(loginUrl) ? loginUrl : 'https://www.aladin.co.kr/login/wlogin.aspx?returnurl=' + encodeURIComponent('https://www.aladin.co.kr/scm/wmain.aspx');
    GM_setValue(LOGIN_FLAG, { at: Date.now() });
    const tab = GM_openInTab(url, { active: false, insert: true });
    let ok = false;
    for (let i = 0; i < 18; i++) { await sleep(5000); if (stopFlag) break; const f = GM_getValue(LOGIN_FLAG, {}); if (f.result === 'failed' || f.result === 'no-id-field') break; if (await isLoggedIn()) { ok = true; break; } }
    try { tab.close(); } catch (e) {}
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
  function loadInFrame(url, readyCheck) {
    // (1.25.1) 숨은 창 하나에 알라딘 상품 페이지를 수천 번 연달아 열면 그 페이지들의 스크립트·광고가 남아 메모리가 계속 늘어 탭이 'Out of Memory'로 죽음
    //  → 20번마다 숨은 창을 비우고 없앤 뒤 새로 만듦 (다음 페이지를 열기 직전에 — 앞 페이지는 이미 다 읽은 뒤)
    frameLoads++;
    if (frame && frameLoads % 20 === 0) { try { frame.src = 'about:blank'; } catch (e) {} try { frame.remove(); } catch (e) {} frame = null; }
    return new Promise((resolve) => {
      if (!frame) { frame = document.createElement('iframe'); frame.style.cssText = 'position:fixed;left:-3000px;top:0;width:1300px;height:2000px;visibility:hidden'; document.body.appendChild(frame); }
      let done = false; const t0 = Date.now(); let poll = null;
      const finish = (ok) => { if (done) return; done = true; clearInterval(poll); let doc = null, href = null; try { doc = frame.contentDocument; href = frame.contentWindow.location.href; } catch (e) {} resolve({ ok, doc, href, ms: Date.now() - t0 }); };
      frame.src = url + (url.includes('?') ? '&' : '?') + 'rnCollect=1';
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
  async function loadListings(force) {
    if (LISTINGS && !force) return LISTINGS;
    ui('기존 상품 기록 읽는 중', 0, 0);
    const m = new Map(); const ss = await C('prd_listings').get(); ss.forEach((d) => m.set(d.id, d.data()));
    LISTINGS = m; log(`기존 상품 ${m.size.toLocaleString()}건 읽음`); return m;
  }
  // 한 상품 줄을 합치기 규칙으로 올릴 작업 목록 만들기 (빈 값으로 덮지 않음, 바뀐 칸만 이력)
  function listingOps(row, source, seenAt) {
    const key = 'aladin_' + row.usedCode; const prev = LISTINGS.get(key);
    const next = {}; for (const f of LISTING_FIELDS) if (row[f] != null) next[f] = row[f];
    if (prev && prev.registeredAt && row.registeredYearGuessed) delete next.registeredAt; // 연도 추정값으로 확정값을 덮지 않음
    const ch = P.diff(prev, next, LISTING_FIELDS);
    const mt = P.mediaType(row); const doc = { channel: 'aladin', usedCode: row.usedCode, ...next, mediaType: mt.type, mediaWhy: mt.why, ids: row.ids, idWarn: row.idWarn || [], active: ACTIVE.includes(row.status || (prev && prev.status)), lastSeenAt: seenAt, ['seenBy_' + source]: seenAt, ...W() };
    if (!prev) doc.firstSeenAt = seenAt;
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
      await loadListings();
      const name = mode === 'new' ? 'scanNew' : mode === 'daily' ? 'scanDaily' : 'scanFull';
      const statuses = mode === 'new' ? Object.keys(STATUS) : mode === 'daily' ? ['판매중', '일시판매중지', '판매중지'] : ACTIVE; // daily(1.34.0 매일 자동): 세 상태만 · 새 상품과, 본 쪽에서 상태가 바뀐 상품을 기록 · 이미 아는 상품만 있는 쪽이 나오면 그 상태는 끝
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
            if (mode === 'daily' && known) { const kl = LISTINGS.get('aladin_' + row.usedCode); if (kl.status === stName && kl.active !== false) continue; prog.stats.changed = (prog.stats.changed || 0) + 1; } // 아는 상품은 상태가 바뀌었을 때만 다시 기록
            unknown++;
            const x = listingOps(row, 'scm', seenAt); ops = ops.concat(x.ops);
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
        const gone = [...LISTINGS.entries()].filter(([, l]) => l.active && (!l.seenBy_scm || l.seenBy_scm < prog.startedAt));
        const activeN = [...LISTINGS.values()].filter((l) => l.active).length;
        // 안전장치: 판매 중 상품의 30% 넘게 한꺼번에 '사라짐'이면 알라딘 화면 오류(로그인 풀림·빈 화면)일 가능성이 커서 표시하지 않음
        if (activeN >= 50 && gone.length > activeN * 0.3) { log(`전체 재검토: 판매 중 ${activeN.toLocaleString()}개 중 ${gone.length.toLocaleString()}개가 목록에 안 보였습니다. 화면 오류일 수 있어 '사라짐' 표시를 하지 않았습니다 (실제라면 판매관리 화면 확인 후 다시)`, 1); gone.length = 0; }
        await commitBatches(gone.map(([k]) => (b) => b.set(C('prd_listings').doc(k), { active: false, goneFromActiveAt: nowIso(), ...W() }, { merge: true })), '사라진 상품 표시');
        gone.forEach(([k, l]) => LISTINGS.set(k, { ...l, active: false }));
        prog.stats.goneFromActive = gone.length;
      }
      await C('prd_system').doc('cursor').set({ maxListingId: String(maxSeen), ['last_' + name]: nowIso(), ...W() }, { merge: true });
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
        try { await refreshOne(l, bookId); prog.done++; } catch (e) { prog.fail++; log(`실패 ${l.title || l.usedCode}: ${e.message}`, 1); }
        doneSet.add(tag);
        ui('도서 정보·시장 지표 갱신', doneSet.size, queue.length, l.title || l.usedCode, `실패 ${prog.fail}건 · 멈춰도 이어서 계속됩니다`);
        if (doneSet.size % 10 === 0) { await saveProgress('market', prog); LS.set('market_done', [...doneSet]); }
      }
      await finishJob('market', { done: prog.done, fail: prog.fail }); LS.set('market_done', []);
      log(`시장 지표 갱신 완료 (성공 ${prog.done}, 실패 ${prog.fail})`);
    } finally { await releaseLane('aladin'); }
  }
  async function refreshOne(l, bookId) {
    const at = nowIso();
    let page = null, resolvedBy = null, finalUrl = null;
    for (const [how, url] of productUrls(l)) {
      // 구매자 분포·함께 구매는 나중에 따로 수집(설정 dynamicParts가 켜졌을 때만 숨은 창 사용)
      let r = SET.dynamicParts ? await getProductFull(url) : null;
      if (!r) { const g = await getDoc(url); r = { page: P.parseProductPage(g.doc, g.finalUrl), finalUrl: g.finalUrl }; r.page.dynamicLoaded = false; }
      if (r.page.aladinItemId && r.page.title) { page = r.page; resolvedBy = how; finalUrl = r.finalUrl; break; }
    }
    if (!page) page = await fallbackProviders(l);
    if (!page) throw new Error('도서 정보를 찾지 못함');
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
      for (const f of BOOK_FIXED) if (page[f] != null && prevB[f] != null && cmp(prevB[f], page[f])) chg[f] = { kept: prevB[f], seen: page[f] };
      const cur = { aladinItemId: book.aladinItemId, isbn13: idsAll.isbn13, isbn10: idsAll.isbn10, aladinCode: idsAll.aladinCode, barcode: idsAll.barcode, productUrl: finalUrl, previewUrls: (page.images && page.images.preview) || null };
      for (const [f, v] of Object.entries(cur)) if (v != null && prevB[f] != null && cmp(prevB[f], v)) chg[f] = { from: prevB[f], to: v };
      if (Object.keys(chg).length) batch.set(C('prd_metric_changes').doc(), { bookId, at: nowIso(), kind: 'bookInfo', chg, ...W() });
    }
    batch.set(bRef, { bookId, keyScheme: SET.keyScheme, aladinItemId: book.aladinItemId, isbn13: idsAll.isbn13, isbn10: idsAll.isbn10, aladinCode: idsAll.aladinCode, barcode: idsAll.barcode,
      ids: idsAll.ids, idWarn: idsAll.warn, ...fixed, ...(Object.keys(imgs).length ? { images: imgs, imgStatus: 'pending' } : {}),
      ...(page.images && page.images.preview && page.images.preview.length ? { previewUrls: page.images.preview } : {}),
      source: page.fetchedFrom, resolvedBy, productUrl: finalUrl, ...(isNewBook ? { firstSeenAt: at } : {}), lastFetchedAt: at, ...W() }, { merge: true });
    for (const key of P.lookupKeys(book)) batch.set(C('prd_ids').doc(key), { bookId, ...W() }, { merge: true });
    if (!l.pool && !l.explore) batch.set(C('prd_ids').doc('usedCode_' + l.usedCode), { bookId, ...W() }, { merge: true });
    const mtB = P.mediaType({ title: page.title, categories: page.categories, ids: idsAll.ids, isbn13: idsAll.isbn13 });
    batch.set(bRef, { mediaType: mtB.type, mediaWhy: mtB.why }, { merge: true });
    if (!l.pool && !l.explore) batch.set(C('prd_listings').doc('aladin_' + l.usedCode), { bookId, mediaType: mtB.type, mediaWhy: mtB.why, ...W() }, { merge: true }); else if (l.pool) batch.set(bRef, { aladinPool: true }, { merge: true }); else batch.set(bRef, { explored: true, exploredAt: at, exploreFrom: l.exploreFrom || null }, { merge: true }); // 탐색 수집 책: 우리 상품·알라딘 구매 풀과 구분
    await batch.commit();
    if (!l.pool && !l.explore) LISTINGS.set('aladin_' + l.usedCode, { ...l, bookId });
    if (page.fetchedFrom !== 'aladin') return; // 대체 출처는 시장 지표 없음
    // 변동성: 중고 페이지 + 지연 로딩 부분
    const used = page.aladinItemId ? P.parseUsedPage((await getDoc(`/shop/UsedShop/wuseditemall.aspx?ItemId=${page.aladinItemId}&TabType=0`)).doc) : null;
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
    if (used && P.listingsDiff) { const ld = P.listingsDiff(prevM && prevM.usedFirstPage, used.listings); if (ld) b2.set(C('prd_metric_changes').doc(), { bookId, at, kind: 'usedListings', add: ld.add, del: ld.del, chg: ld.chg, firstRecord: ld.first, lastPage: used.lastPage || null, usedTotal: used.usedTotal ?? null, ...W() }); }
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
          b.set(C('sellers').doc(id), { rev6m: r.rev6m, rev6mLt3: r.rev6mLt3, rev6mAt: nowIso(), shopPeriods: r.periods, shopTotal: r.total, shopTotalLt3: r.totalLt3, aladinGrade: r.grade, isPro: r.isPro, cancel3m: r.cancel3m, ...(r.info ? { bizInfo: r.info } : {}), ...(r.infoNote ? { contactNote: r.infoNote } : {}), shopAt: nowIso(), ...W() }, { merge: true });
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
        if (fresh.length) { const b = db.batch(); fresh.forEach((x) => { b.set(C('pur_aladin_orders').doc(x.ono), { ...x, collectedAt: nowIso(), ...W() }); known.add(x.ono); }); await b.commit(); prog.got += fresh.length; }
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
        await C('pur_aladin_orders').doc(need[i]).set({ detailText: tables.join(' | ').slice(0, 6000) || doc.body.textContent.replace(/\s+/g, ' ').slice(0, 3000), items: [...new Set(items)].slice(0, 60), lines: lines.slice(0, 80), sellers, detailAt: nowIso(), ...W() }, { merge: true });
        ui('알라딘 주문 상세', i + 1, need.length, need[i]);
      }
      await finishJob('aladinBuy', { orders: prog.got, details: need.length });
      log(`알라딘 구매 내역: 주문 ${prog.got}건, 상세 ${need.length}건`);
    } finally { await releaseLane('aladin'); }
  }

  const STEP_LABEL = { usedInfo: '경쟁 매물 유의사항·사진', crm: '고객·주문 전체', scanNew: '신규 등록분', aladinBuy: '알라딘 구매 내역', buyback: '알라딘 팔기 정산 내역', market: '도서·시장 지표', rev6m: '6개월 평가 수', revTop: '상위 판매자 평가', dynamic: '구매자 분포·함께 산 책', soldInfo: '판매완료 상품 정보', poolInfo: '알라딘 풀 도서 정보', images: '이미지', photos: '우리 상품 사진', scanFull: '등록 상품 전체 재검토', revAll: '판매자 평가 전체' , nbMarket: '새상품 없는 상품 시세' };
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
    try { const v = (await C('crm_system').doc('collector_version').get()).data() || {}; add(!v.ver || verNum(v.ver) <= verNum(VER), `수집기 버전: 이 PC ${VER}${v.ver && verNum(v.ver) > verNum(VER) ? ` · 더 새 버전 ${v.ver} 있음 (쉬는 사이에 바뀜)` : ' (최신)'}`); } catch (e) {}
    try { const li = await window.__rnCrm.localInfo(); add(true, `고객·주문 기록(이 PC): 상세 ${li.pops.toLocaleString()}건 · 목록 줄 ${li.lines.toLocaleString()} · 고객 일괄 끝까지 ${li.complete ? '한 적 있음' : '없음'} → 고객 단계는 서버 기준으로 이미 받은 주문을 건너뜀`); } catch (e) {}
    { const m = window.__rnLoginMethod ? window.__rnLoginMethod() : 'naver'; const need = GM_getValue('rnu-need-naver', 0), okAt = GM_getValue('rnu-naver-okAt', 0); add(!(m === 'naver' && need && need > okAt), `다시 로그인 방식: ${m === 'naver' ? '네이버로 로그인' : '알라딘 아이디(자동입력방지 때문에 자동이 안 될 수 있음)'}${m === 'naver' && need && need > okAt ? ' — ⚠ 네이버 로그인 필요' : ''}`, false); }
    add(!OLD_FILES.length, OLD_FILES.length ? `GitHub 공용 파일이 옛 버전: ${OLD_FILES.map(([k, v, w]) => `${k} ${v || '못 읽음'} (필요 ${w} 이상)`).join(', ')} — 새 파일을 올려야 정확히 읽음` : `공용 파일 버전 맞음 (${Object.entries(NEED_FILES).map(([k, [g]]) => `${k.split(' ')[1]} ${g()}`).join(' · ')})`, true);
    { const du = GM_getValue('rnu-drive-url', ''); if (!du) add(false, '작업 기록 구글 드라이브 저장: 주소 없음 (웹앱 설정 ⑨ — 없으면 PC로 내려받음)', false);
      else { const ok = await new Promise((res) => GM_xmlhttpRequest({ method: 'GET', url: du, timeout: 20000, onload: (r) => res(/리드나우 기록 저장 준비됨/.test(r.responseText || '')), onerror: () => res(false), ontimeout: () => res(false) })); add(ok, ok ? '작업 기록 구글 드라이브 저장: 연결됨' : '작업 기록 구글 드라이브 저장: 주소는 있으나 응답 확인 안 됨 (Apps Script에 doGet 추가 후 새 버전으로 다시 배포)', false); } }
    add(true, `잠금 묶음: ${lockGroup()} · 같은 묶음 동시 PC ${SET.maxLanes || 1}대 · 알라딘 요청 간격 자동 조절 지금 ${PACE.state().gap}ms (최소 ${SET.reqMinMs} · 최대 ${SET.reqMaxMs})`);
    try { const lk = (await LOCK().get()).data(); const pcs = freshPcs(lk, Date.now()); delete pcs[PC_ID]; const others = Object.values(pcs).map((x) => `${x.name}(${x.job || ''})`); if (legacyOther(lk, Date.now())) others.push(`${lk.pcName}(${lk.taskLabel})`); add(true, `같은 묶음에서 지금 도는 다른 PC: ${others.join(', ') || '없음'}`); } catch (e) {}
    try { const st = (SET.steps || {}); add(true, `일괄 단계 켬: ${Object.keys(STEP_LABEL).filter((k) => st[k] !== false).map((k) => STEP_LABEL[k]).join(' · ')}`); } catch (e) {}
    const fatal = R.filter((r) => !r.ok && r.fatal); const warn = R.filter((r) => !r.ok && !r.fatal);
    log(`시작 전 점검: ${fatal.length ? `✗ 꼭 고칠 것 ${fatal.length}` : '✓ 시작 가능'}${warn.length ? ` · 확인할 것 ${warn.length}` : ''} (자세한 내용은 기록 창)`, fatal.length || warn.length);
    if (!quiet && (fatal.length || warn.length)) alert(`시작 전 점검\n\n${R.map((r) => `${r.ok ? '✓' : r.fatal ? '✗' : '!'} ${r.msg}`).join('\n')}`);
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

  async function runChain(onlyPrd) { const DOC = onlyPrd ? 'prdChain' : 'chain'; const NAME = onlyPrd ? '상품 일괄 수집' : '모두 일괄 수집';
      if (!(await preflight(!!window.__rnRemote || !!window.__rnAuto))) { log('시작 전 점검에서 꼭 고칠 것이 있어 시작하지 않았습니다', 1); return 'cancel'; }
      const prev = (await C('prd_jobs').doc(DOC).get()).data();
      const ORDER0 = ['crm', 'scanNew', 'aladinBuy', 'buyback', 'market', 'nbMarket', 'soldInfo', 'poolInfo', 'images', 'photos', 'usedInfo', 'rev6m', 'revTop', 'dynamic', 'scanFull', 'revAll']; // 수집기가 하는 모든 것 (단계마다 켜고 끔)
      const ORDER = onlyPrd ? ORDER0.filter((k) => k !== 'crm') : ORDER0;
      const on = (k) => (SET.steps || {})[k] !== false;
      let st = prev && !prev.done && ORDER.includes(prev.stage) ? prev.stage : ORDER[0];
      const CS = window.__rnStatus.chain = { order: ORDER, labels: STEP_LABEL, on: Object.fromEntries(ORDER.map((k) => [k, on(k)])), res: Object.fromEntries(ORDER.slice(0, ORDER.indexOf(st)).map((k) => [k, 'done'])), cur: null };
      await C('prd_jobs').doc(DOC).set({ done: false, stage: st, by: LS.get('pcName', PC_ID), savedAt: Date.now(), ...W() }, { merge: true });
      const RUN = { crm: async () => { if (!window.__rnCrm) { log('고객 수집 모듈이 없어 건너뜀', 1); return; }
        const li = await window.__rnCrm.localInfo(); if (false && !li.complete && li.pops < 1000 && !(SET.crmAnyPc)) { log(`고객·주문: 이 PC(${PC_NAME})는 고객 일괄 수집을 끝까지 한 적이 없고 상세까지 받은 주문이 ${li.pops}건뿐이라(목록 줄 ${li.lines}), 하면 이미 받은 주문을 못 알아보고 전부 다시 엽니다 → 건너뜀. 고객·주문은 기록이 있는 PC(${SET.autoPc || 'JS-MAIN'})가 맡습니다`, 1); return 'skip'; } ui('고객·주문 전체 일괄 수집', 0, 0, '고객 탭에서 진행 상황을 볼 수 있습니다'); await window.__rnCrm.start('bulk', { fresh: true }); },
        scanNew: () => scan('new'), aladinBuy: () => aladinBuyJob(), buyback: () => buybackJob(), market: () => market(), rev6m: () => rev6mJob('stale'), revTop: () => reviewJob('top'), dynamic: () => dynJob(SET.dynDaily || 0),
        soldInfo: async () => { const r = await soldInfoJob(); return r; }, poolInfo: () => poolInfoJob(), photos: () => photosJob(), usedInfo: () => usedInfoJob(), nbMarket: () => nbMarketJob(), images: async () => { await images(); }, scanFull: () => scan('full'), revAll: () => reviewJob('all') };
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
          const g = await getDoc(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${x.lid}`);
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
        if (!itemId && t.it.title) { const q = String(t.it.title).replace(/^\[[^\]]*\]\s*/, ''); const sr = await getDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${encodeURIComponent(q)}`);
          const c = P.parseSearchResults(sr.doc).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: P.nameCoverage(q, x.title) })).filter((x) => x.cov >= 0.9).sort((a, b) => b.cov - a.cov)[0]; if (c) { itemId = String(c.itemId); via = 'search'; } }
        if (!itemId) { mktSkip.set(t.id, Date.now() + 3600e3); continue; }
        const u = P.parseUsedPage((await getDoc(`/shop/UsedShop/wuseditemall.aspx?ItemId=${itemId}&TabType=0`)).doc);
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
          try { await refreshOne(l, l.bookId || null); ok++; } catch (e) { fail++; log(`시장 지표 실패 ${l.title || l.usedCode}: ${e.message}`, 1); }
          ui(`그룹 시장 지표: ${v.label || ''}`, i + 1, keys.length, l.title || l.usedCode, `실패 ${fail}`); if (i % 5 === 4) await d.ref.set({ i: i + 1, ok, fail, uploadedAt: TS() }, { merge: true }); }
        await d.ref.set({ status: 'done', i, ok, fail, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
        if (v.batchId) await C('prd_price_batches').doc(v.batchId).set({ lastMetricsAt: nowIso(), lastMetricsN: ok, ...W() }, { merge: true }).catch(() => {});
        log(`그룹 시장 지표 갱신 끝: ${v.label || ''} 성공 ${ok} · 실패 ${fail}`); }
    } finally { await releaseLane('aladin'); } }
  // 5분마다: 맡아 둔 그룹 시장 지표가 남았으면 이어서 · 한 시간마다: '매일 자동'을 켠 그룹(수동 일괄 처리 그룹·감시 묶음)이 24시간 지났으면 스스로 맡김
  setInterval(async () => { try { if (running || window.__rnPaused || !auth.currentUser) return; const qs = await C('shp_cmds').where('status', '==', 'running').get();
    if (qs.docs.some((d) => { const v = d.data(); return v.type === 'metrics' && v.claim && v.claim.pc === PC_NAME; })) runJob('metricsReq'); } catch (e) {} }, 5 * 60000);
  setInterval(async () => { try { if (!auth.currentUser) return; const day = 864e5; const PRC = window.ReadnowPricing || globalThis.ReadnowPricing;
    const pc0 = (await C('prd_system').doc('pricing').get()).data() || {}; const off = pc0.batchOff || {}; // (1.34.9) 웹앱에서 끈 그룹(감시·적용 꺼짐)·보관한 그룹은 매일 자동 시장 지표를 맡기지 않음
    const bs = await C('prd_price_batches').get(); for (const d of bs.docs) { const b = d.data(); if (!b.autoMetrics || b.archived || off[d.id] || !b.lastKeys || !b.lastKeys.length) continue; if (b.lastMetricsReqAt && Date.now() - Date.parse(b.lastMetricsReqAt) < day) continue;
      await d.ref.set({ lastMetricsReqAt: nowIso() }, { merge: true }); await C('shp_cmds').add({ type: 'metrics', keys: b.lastKeys, label: '그룹: ' + (b.name || d.id), batchId: d.id, status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (매일 자동)', uploadedAt: TS() }); }
    const pc = (await C('prd_system').doc('pricing').get()).data() || {}; const gm = pc.groupMetrics || {}; if (Object.values(gm).some((x) => x && x.auto)) await loadListings();
    for (const g of ['treat', 'control']) { const x = gm[g] || {}; if (!x.auto || (x.reqAt && Date.now() - Date.parse(x.reqAt) < day) || !PRC) continue; const keys = [...LISTINGS.entries()].filter(([, l]) => l.active && PRC.groupOfListing(l, pc) === g).map(([k]) => k);
      await C('prd_system').doc('pricing').set({ groupMetrics: { [g]: { ...x, reqAt: nowIso() } } }, { merge: true }); await C('shp_cmds').add({ type: 'metrics', keys, label: g === 'treat' ? '감시·적용 묶음' : '감시·비교 묶음', status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (매일 자동)', uploadedAt: TS() }); }
  } catch (e) {} }, 60 * 60000);
  let cmdUnsub = null; auth.onAuthStateChanged((u) => { if (cmdUnsub) { cmdUnsub(); cmdUnsub = null; } if (!u) return; // (1.34.0) 새로 들어온 일만 · PC 몫이 아닌 일은 트랜잭션 없이 바로 넘김 · 다시 로그인해도 듣기는 하나만
    if (!regUnsub) regUnsub = C('app_settings').doc('sys_registry').onSnapshot((d) => { REGDOC = d.exists ? d.data() : {}; }, () => {}); // (1.36.0) 노선표 (Firebase 기준 — 웹앱에서 멈춘 종류·맡는 곳이 바로 반영)
    cmdUnsub = C('shp_cmds').where('status', '==', 'queued').onSnapshot((ss) => ss.docChanges().forEach((c) => { if (c.type === 'removed') return; const x = c.doc.data() || {}; if (!pcCan(x.type)) return; const id = c.doc.id; runCmd(id).catch((e) => { log('맡긴 일 실패: ' + (e.code || e.message) + ' — 8초 뒤 한 번 더', 1); setTimeout(() => runCmd(id).catch(() => {}), 8000); }); }), () => {}); });
  /* (1.36.0) 관리도구 노선표: PC가 맡는 일 = 노선표(readnow-registry.js 기본값 + Firebase app_settings/sys_registry)에서 'PC가 맡을 수 있음'이고 멈춤이 아닌 종류만.
     예전 목록(CMD_NOT_PC)과 달리 모르는 종류는 맡지 않음 — 예전엔 모르는 종류를 '끝남'으로 적어 일이 사라질 수 있었음. 노선표 파일을 못 읽었을 때만 예전 목록으로 */
  let REGDOC = null, regUnsub = null; const REGF = () => window.ReadnowRegistry || globalThis.ReadnowRegistry || null;
  const PC_KNOWN_OLD = new Set(['read', 'startDelivery', 'usedInfo', 'c2bAdd', 'lookup', 'metrics', 'cashStop']);
  const pcCan = (type) => { const G = REGF(); if (!G) return PC_KNOWN_OLD.has(type); return G.canHandle(G.merge(REGDOC || {}), type, 'pc'); };
  async function runCmd(id) { const ref = C('shp_cmds').doc(id); let v = null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.data(); if (!x || x.status !== 'queued' || !pcCan(x.type) || String(x.pcSkip || '').includes(` ${APP_VER}에`)) return; /* 노선표에서 PC 몫인 종류만 (1.36.0) */ tx.update(ref, { status: 'running', claim: { pc: PC_NAME, tab: TAB_ID, at: nowIso() }, uploadedAt: TS() }); v = x; });
    if (!v) return;
    if (v.type === 'startDelivery') { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; const results = {};
      for (const ono of v.orderNos || []) { const gate = await exBegin('startDelivery', `${id}:${ono}`, { ono }); if (!gate.ok) { results[ono] = { state: gate.state === 'done' ? 'done' : 'unknown', at: nowIso(), msg: '실행 문: ' + gate.why, gate: gate.state }; continue; } results[ono] = { state: 'sent', at: nowIso() };
        try { const rr = await fetch(`https://www.aladin.co.kr/scm/worder_process.aspx?cmd=StartDelivery&ono=${encodeURIComponent(ono)}`, { credentials: 'include' }); const tx2 = await rr.text(); const al = (tx2.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null;
          results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: al }; } catch (e) { results[ono] = { state: 'fail', at: nowIso(), msg: e.message }; }
        await ref.set({ results, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); await sleep(800); } // (1.34.7) 한 건마다 결과·살아 있음 신호
      // (1.34.0) 주문확인요청 화면을 제대로 읽었을 때만 '끝남' — 로그인 화면·읽기 실패로 빈 목록이면 '확인 못함'(웹앱에서 다시 확인)
      let gcDoc = null; try { const gc = await getDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); gcDoc = gc.doc; const x = SH.parseDeliveryPage(gc.doc); const okP = !!(x && x.tabCounts && Object.keys(x.tabCounts).length); const left = new Set((x.orders || []).map((o) => o.orderNo));
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = !okP ? 'unknown' : left.has(ono) ? 'fail' : 'done'; if (!okP) gcDoc = null; } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
      for (const [ono, r] of Object.entries(results)) if (!r.gate) await exEnd('startDelivery', `${id}:${ono}`, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', r.msg || null, { http: r.http || null });
      const nd = Object.values(results).filter((r) => r.state === 'done').length; await ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
      try { await shipLiteRead(SH, gcDoc); } catch (e) {} // (1.34.6) 넘긴 결과를 바로 목록에 — 웹앱에서 주문확인요청에서 빠지고 발송 요청에 들어감
      log(`발송준비시작: ${nd} / ${Object.keys(results).length}건 (웹앱에서 맡김)`, nd === Object.keys(results).length ? 0 : 1); }
    else if (v.type === 'usedInfo') { const results = {}; // (1.34.5) 웹앱·클라우드가 맡긴 '중' 상품 유의 사항 다시 읽기 — 바로 처리(한두 건이라 짧음)
      for (const lid of v.listingIds || []) { try { const prev = (await C('prd_used_info').doc(String(lid)).get()).data(); const r = await readOurUsed(lid, v.grade || null, prev);
          results[lid] = r.miss ? { ok: false, why: r.miss, at: nowIso() } : { ok: true, note: !!r.note, at: nowIso() }; } catch (e) { results[lid] = { ok: false, why: e.message, at: nowIso() }; } }
      await ref.set({ status: 'done', results, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); log(`유의 사항 다시 읽기: ${Object.values(results).filter((r) => r.ok).length} / ${Object.keys(results).length}건`); return; }
    else if (v.type === 'c2bAdd') { await c2bAddCmd(ref, v); return; }
    else if (v.type === 'cashStop') { await cashStopCmd(ref, v); return; } // (1.37.0) 현금 판매 → 알라딘 판매중지 자동 // (1.35.0) 알라딘 매입: 팔기 장바구니에 담기
    else if (v.type === 'lookup') { await lookupCmd(ref, v); return; }
    else if (v.type === 'metrics') { log(`그룹 시장 지표 갱신 맡음: ${v.label || ''} ${(v.keys || []).length}개`); if (!running) runJob('metricsReq'); else log('다른 작업 중 — 끝나면 이어서 (5분마다 확인)'); return; }
    else if (v.type === 'read') { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (SH) try { await shipLiteRead(SH, null); } catch (e) {} await ref.set({ status: 'done', doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }); }
    else { await ref.set({ status: 'queued', claim: null, pcSkip: `수집기 ${APP_VER}에 처리 길이 없는 종류 — 노선표 확인`, uploadedAt: TS() }, { merge: true }); log(`맡긴 일 '${v.type}': 이 수집기 판에 처리하는 길이 없어 대기로 되돌림 (노선표 확인)`, 1); return; } // (1.36.0) 예전: 모르는 종류도 '끝남' // (1.34.6) '다시 읽기'는 목록부터 바로(몇 초), 전체 읽기(유의 사항·엑셀)는 이어서
    window.__rnShipAt = 0; if (!running) runJob('shipRead'); else log('다른 작업 중이라 발송 요청 다시 읽기는 끝난 뒤에 (15분마다 저절로)'); }
  /* 사진으로 가격 매기기 (1.31.0, 웹앱 '사진 가격' 화면 · shp_cmds type 'lookup'):
     isbns = 바코드로 읽은 ISBN → 새상품 페이지(wproduct.aspx?ISBN=) → 알라딘 상품번호 → 온라인 중고 첫 페이지 / itemIds = 고른 후보 상품번호 / queries = 책등 제목 → 알라딘 검색 후보
     결과는 그 일 문서(items · cands)에 바로 쓰고, 책마다 prd_lookups에도 한 줄씩 쌓음(덮어쓰지 않음 — 같은 책을 다시 찍으면 웹앱이 24시간 안 기록을 먼저 씀). 다른 작업 중이어도 바로 처리(책 몇 권이라 짧음) */
  /* (1.40.0) 실행도구의 한 문 (readnow-exec-core.js): 알라딘을 바꾸는 일은 모두 exGate를 지나감 — 시작을 먼저 적고(같은 일이 이미 끝났거나 하는 중이면 안 함), 끝나면 결과를 적음 */
  const EXC = () => window.ReadnowExec || globalThis.ReadnowExec;
  const exBegin = async (kind, key, detail) => { const X = EXC(); if (!X) return { ok: true, none: true }; try { return await X.begin(db, { kind, key, by: PC_NAME, detail: detail || null }); } catch (e) { log(`⚠ 실행 기록을 못 적음(${kind}) — ${e.code || e.message}${/permission/i.test(e.code || e.message) ? ' (Firestore 규칙에 exec_log 허용 필요)' : ''} · 일은 예전처럼 하고 기록만 빠짐`, 1); return { ok: true, none: true }; } }; // 기록 칸 문제로 출고·판매중지를 막지 않음
  const exEnd = (kind, key, status, msg, result) => { const X = EXC(); if (!X) return Promise.resolve(); return X.finish(db, { kind, key }, status, { msg, result }).catch((e) => log(`실행 결과를 못 적음(${kind}): ${e.code || e.message}`, 1)); };
  const lookDoc = (url) => AL.quick(url, { pace: PACE, sleep }); // 일시정지·작업 줄과 상관없이 짧게 (책 몇 권) — (1.39.0) 알라딘 창구: 속도 조절을 같이 쓰고 점검 화면은 오류로
  /* (1.42.0) 출고 실시간 (PC): 알라딘 화면이 열린 PC가 15초마다 ① 주문확인요청을 한 번 읽어 바뀐 때만 씀 — 클라우드 사용료 없이 실시간
   *  · 한 PC 안에서는 한 탭만(GM 'rnu-shipfast', 40초 신호) · 다른 작업·일시정지와 상관없이 (읽기 한 번, 속도 조절은 같이 씀)
   *  · 바뀌지 않으면 목록 문서는 건드리지 않고 작은 신호(shp_state/fast)만 — 웹앱 '읽은 시각'과 클라우드가 봄(PC가 읽는 동안 클라우드는 빠른 고리를 쉼 = 비용 절약)
   *  · ② 발송 요청 수가 바뀌면 발송 요청도 바로 읽음 · 뒤에 숨은 탭에서도 느려지지 않게 일꾼 타이머(sleep) */
  (function shipFastPc() { const ME = Math.random().toString(36).slice(2, 8); const KEY = 'rnu-shipfast'; let lastSig = null, lastDeliv = null, busy = false, fails = 0;
    const leader = () => { const v = GM_getValue(KEY, null); if (!v || v.tab === ME || Date.now() - v.at > 40000) { GM_setValue(KEY, { tab: ME, at: Date.now() }); return true; } return false; };
    addEventListener('beforeunload', () => { const v = GM_getValue(KEY, null); if (v && v.tab === ME) GM_deleteValue(KEY); });
    window.__rnShipFast = () => ({ leader: (GM_getValue(KEY, null) || {}).tab === ME, lastSig: !!lastSig, fails });
    (async () => { await sleep(10000); for (;;) { await sleep(15000); if (busy || !auth.currentUser || !leader()) continue; busy = true;
        try { const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (!SH) continue; const g = await lookDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); const rc = SH.parseDeliveryPage(g.doc);
          if (!rc || !rc.tabCounts || !Object.keys(rc.tabCounts).length) { fails++; continue; } fails = 0; const at = nowIso(); const sig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)]));
          let ch = false; if (sig !== lastSig) { ch = await saveConfirmState(rc, at); lastSig = sig; if (ch) log(`출고 실시간(PC): 주문확인요청 ${rc.orders.length}건으로 바뀜 — 웹앱에 바로`); }
          const dv = rc.tabCounts['발송 요청']; if (lastDeliv != null && dv !== lastDeliv) { try { await shipLiteRead(SH, g.doc); } catch (e) {} } lastDeliv = dv;
          await C('shp_state').doc('fast').set({ pc: PC_NAME, at, n: rc.orders.length, changed: ch, ver: APP_VER }, { merge: true }); }
        catch (e) { fails++; } finally { busy = false; } } })(); })();
  async function lookupBook(url) { const g = await lookDoc(url); const p = P.parseProductPage(g.doc, g.finalUrl); if (!p.aladinItemId) throw new Error('알라딘에서 이 책을 못 찾음');
    const u = P.parseUsedPage((await lookDoc(`/shop/UsedShop/wuseditemall.aspx?ItemId=${p.aladinItemId}&TabType=0`)).doc);
    return { itemId: p.aladinItemId, isbn13: p.isbn13 || null, title: p.title || null, subtitle: p.subtitle || null, author: (p.contributors || []).slice(0, 2).map((c) => c.name).join(', ') || null, publisher: p.publisher || null, pubDate: p.pubDate || null,
      cover: (p.images && p.images.front) || null, priceList: p.priceList ?? null, priceSales: p.priceSales ?? null, availability: p.availability || null, usedTotal: u.usedTotal ?? null, buyback: u.buyback || null, mins: u.mins || null, page1: u.listings || [], lastPage: u.lastPage || 1, at: nowIso() }; }
  async function lookupCmd(ref, v) { const isb = v.isbns || [], ids = v.itemIds || [], qs = v.queries || []; const tot = isb.length + ids.length + qs.length; let n = 0; const items = {}, cands = {}, errs = {};
    log(`사진 가격: 알라딘에서 ${tot}건 읽기 (웹앱에서 맡김)`);
    const prog = () => ref.set({ n, tot, items, cands, errs, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const keep = async (key, r) => { items[key] = r; try { await C('prd_lookups').add({ key, isbn13: r.isbn13, itemId: r.itemId, ...r, by: PC_NAME, cmdId: ref.id, ...W() }); } catch (e) {} };
    for (const isbn of isb) { try { await keep(isbn, await lookupBook(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`)); } catch (e) { errs[isbn] = e.message; } n++; await prog(); }
    for (const id of ids) { try { await keep('id_' + id, await lookupBook(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`)); } catch (e) { errs['id_' + id] = e.message; } n++; await prog(); }
    for (const q of qs) { try { const sr = await lookDoc(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodeURIComponent(q)}`);
        cands[q] = P.parseSearchResults(sr.doc).filter((r) => !r.used).slice(0, 8).map((r) => ({ itemId: r.itemId, title: r.title, img: r.img || null, cov: Math.round(P.nameCoverage(q, r.title) * 1000) / 1000, channels: r.channels || null })); } catch (e) { errs['q_' + q] = e.message; } n++; await prog(); }
    await ref.set({ status: 'done', n, tot, items, cands, errs, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
    log(`사진 가격: ${Object.keys(items).length}권 · 검색 ${Object.keys(cands).length}건 끝${Object.keys(errs).length ? ` · 실패 ${Object.keys(errs).length}` : ''}`, Object.keys(errs).length ? 1 : 0); }
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
  function c2bFrame(url) { return new Promise((resolve) => { let f = document.getElementById('rn-c2b-frame'); if (f) { try { f.src = 'about:blank'; } catch (e) {} f.remove(); }
    f = document.createElement('iframe'); f.id = 'rn-c2b-frame'; f.style.cssText = 'position:fixed;left:-3000px;top:0;width:1300px;height:2000px;visibility:hidden'; document.body.appendChild(f);
    const t0 = Date.now(); let done = false; let iv = null; const fin = (ok) => { if (done) return; done = true; clearInterval(iv); let d = null; try { d = f.contentDocument; } catch (e) {} resolve({ ok, f, doc: d }); };
    f.src = url; iv = setInterval(() => { let d = null; try { d = f.contentDocument; } catch (e) {} if (d && d.URL !== 'about:blank' && d.readyState === 'complete' && (d.querySelector('#searchResult') || Date.now() - t0 > 8000)) fin(true); else if (Date.now() - t0 > 45000) fin(false); }, 400); }); }
  async function c2bAddOne(it, cartSet) { const isbn = String(it.isbn13 || ''); if (!/^97[89]\d{10}$/.test(isbn)) return { state: 'failed', msg: 'ISBN13이 없음' };
    if (cartSet.has(isbn)) return { state: 'already', msg: '이미 팔기 장바구니에 있음' };
    await PACE.wait(); const fr = await c2bFrame(C2B_SEARCH(isbn)); const d = fr.doc; if (!fr.ok || !d) return { state: 'failed', msg: '매입가 조회 화면을 못 엶(시간 초과)' };
    if (looksLoggedOut(d.URL, d)) return { state: 'failed', msg: '알라딘 로그인이 풀림' };
    const rows = P.parseC2BSearch(d); const row = rows.find((r) => r.isbn13 === isbn) || (rows.length === 1 && !rows[0].isbn13 ? rows[0] : null);
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
    try { const f = document.getElementById('rn-c2b-frame'); if (f) { f.src = 'about:blank'; f.remove(); } } catch (e) {}
    const ok = Object.values(results).filter((r) => ['added', 'already'].includes(r.state)).length; await ref.set({ status: 'done', results, n, cartN, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
    log(`알라딘 매입: 장바구니 ${ok} / ${items.length}권 (지금 장바구니 ${cartN}권)`, ok === items.length ? 0 : 1); }
  auth.onAuthStateChanged((u) => { if (!u) return; C('shp_invoices').where('status', '==', 'queued').onSnapshot((ss) => ss.forEach((d) => claimInvoice(d.id).catch((e) => log('송장 입력 맡기 실패: ' + (e.code || e.message), 1))), () => {}); });
  async function claimInvoice(id) { const ref = C('shp_invoices').doc(id); let ok = false;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data(); if (!v || v.status !== 'queued') return; tx.update(ref, { status: 'running', claim: { pc: PC_NAME, tab: TAB_ID, at: nowIso() }, uploadedAt: TS() }); ok = true; });
    if (!ok) return; GM_setValue('rn-inv-active', { id, at: Date.now() }); log(`송장 입력 맡음 (${id}) — 발송 요청 화면을 새 탭으로 엽니다`);
    GM_openInTab('https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4#rninv=' + id, { active: false, insert: true }); } // #rninv= : 이 탭이 송장 입력을 맡은 탭 (다른 발송 요청 탭은 끼어들지 않음)
  // 영업일(월~금) 9~16시: 쉬는 동안 shipAutoMin분마다 발송 요청 다시 읽기
  let cloudBeat = null; auth.onAuthStateChanged((u) => { if (u) C('app_settings').doc('cloud').onSnapshot((d) => { cloudBeat = d.exists ? d.data() : null; }, () => {}); });
  const cloudOn = () => !!(cloudBeat && cloudBeat.at && Date.now() - Date.parse(cloudBeat.at) < 10 * 60000 && cloudBeat.ok !== false); // 클라우드 수집이 살아 있음 (10분 안 신호)
  setInterval(() => { try { const m = SET.shipAutoMin ?? 15; if (!m || (running && curKey !== 'explore') || window.__rnPaused || cloudOn()) return; const k = new Date(Date.now() + 9 * 3600e3); const wd = k.getUTCDay(), h = k.getUTCHours(); if (wd === 0 || wd === 6 || h < 9 || h >= 16) return;
    if (Date.now() - (window.__rnShipAt || 0) < m * 60000) return; window.__rnShipAt = Date.now(); runJob('shipRead'); } catch (e) {} }, 60000);

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
        try { await refreshOne(l, null); prog.ok++; } catch (e) { prog.fail++; if (prog.fail < 20) log(`${l.title || l.usedCode}: ${e.message}`, 1); }
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
   * 목록(쪽마다) → 접수번호 → 상세. 매입이 끝난 접수는 다시 안 열고, 진행 중인 접수만 다시 봄.
   * 저장: pur_buyback/{접수번호} — 처음 받은 내용은 그대로 두고, 진행 상태가 바뀌면 그 상태를 기록에 덧붙임(snapshots). */
  const C2B_LIST = (page) => `https://www.aladin.co.kr/account/wc2binfo.aspx?pType=C2BOrderList&page=${page}&c2bsalesType=-1&SearchYear=0&SearchMonth=0&C2BSearchActive=0&C2BSearchWord=`;
  const C2B_DETAIL = (no) => `https://www.aladin.co.kr/account/wc2binfo.aspx?pType=c2borderinfo&c2bsalesno=${no}`;
  const isFinal = (o) => !!(o && (o.doneDate || /매입완료|정산완료|완료|취소/.test(o.status || '')) && (o.items || []).every((x) => x.result));
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
        const cur = { orderNo: no, date: x.date, type: x.type, shipDate: x.shipDate, doneDate: x.doneDate, status: x.status, settle: x.settle, discardPolicy: x.discardPolicy, buyer: x.buyer, reqN: x.reqN, reqAmount: x.reqAmount, items: x.items, head: x.head, paidAmount: x.doneDate ? paid : 0,
          buyStated, shipMethod: ship || null, shipFee, shipFeeBoxes: boxes, settledAmount: x.doneDate && /정산\s*완료/.test(x.status || '') ? (buyStated ?? paid) - shipFee : 0 }; // 실제 정산액 = 매입 금액 − 배송비 차감
        const old = have.get(no); const sig = JSON.stringify([cur.status, cur.doneDate, cur.items.map((it) => it.result + ':' + (it.buyPrice || '')), cur.settledAmount]);
        if (old && old.sig === sig) continue; // 같은 내용이면 기록하지 않음
        await C('pur_buyback').doc(no).set({ ...(old ? {} : { firstSeenAt: nowIso() }), ...cur, sig, source: 'collector', lastSeenAt: nowIso(), snapshots: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), status: cur.status, doneDate: cur.doneDate, paid: cur.paidAmount, results: cur.items.map((it) => it.result || '-').join('') }), ...W() }, { merge: true });
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
    if (upd.buyerDist || upd.relationBuy) { const hsig = JSON.stringify([upd.buyerDist || null, upd.relationBuy || null]); const hRef = C('prd_dyn_history').doc(bookId); const hPrev = (await hRef.get().catch(() => null)); const hp = hPrev && hPrev.exists ? hPrev.data() : null;
      if (!hp || hp.lastSig !== hsig) await hRef.set({ bookId, lastSig: hsig, snaps: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), buyerDist: upd.buyerDist || null, relationBuy: upd.relationBuy || null, relationBuyIds: upd.relationBuyIds || null, clickRelation: upd.clickRelation || null }), lastCheckedAt: nowIso(), ...W() }, { merge: true }).catch(() => {});
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
        const todo = [...seeds.values()].filter((x) => !done.has(String(x.aladinItemId)));
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
  async function claimDoc(id, field, value) { let ok = false; await db.runTransaction(async (tx) => { const ref = C('prd_jobs').doc(id); const s = await tx.get(ref); const d = s.exists ? s.data() : {}; if (d[field] === value) return; tx.set(ref, { [field]: value, by: PC_NAME, pc: PC_ID, at: nowIso() }, { merge: true }); ok = true; }); return ok; }
  setInterval(() => { try { const v = lockDocId(); if (GM_getValue('rnu-lockdoc', null) !== v) GM_setValue('rnu-lockdoc', v); } catch (e) {} }, 5000); /* 바뀔 때만 씀 (같은 값을 5초마다 써서 모든 탭에 알림이 가던 것) */ setTimeout(() => { try { GM_setValue('rnu-lockdoc', lockDocId()); } catch (e) {} }, 1500);
  setTimeout(() => { try { GM_setValue('rnu-autopc', SET.autoPc || 'JS-MAIN'); } catch (e) {} }, 2000);
  setTimeout(() => { try { GM_setValue('rnu-maxlogin', SET.maxLoginTries ?? 6); GM_setValue('rnu-drive-url', SET.driveLogUrl || ''); GM_setValue('rnu-drive-key', SET.driveLogKey || ''); } catch (e) {} }, 2500);
  window.__rnUniAuto = true;
  setInterval(async () => {
    try { window.__rnUniAuto = !!SET.autoDaily || !!window.__rnSchedOn; if (window.__rnSchedOn || (SCHED && SCHED.items)) return; /* (1.34.0) 새 '⏰ 매일 자동 수집'이 있으면 그쪽만 */ if (running || !auth.currentUser || !SET.autoDaily || window.__rnPaused) return;
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
  C('prd_jobs').doc('request').onSnapshot(async (d) => { try {
    const r = d.exists ? d.data() : null; if (!r || !r.job || r.handled || running || window.__rnPaused || typeof JOBS === 'undefined' || !JOBS[r.job] || Date.now() - (r.atMs || 0) > 30 * 60000) return;
    const mine = String(PC_NAME || '').toUpperCase() === String(SET.reqPc || 'JS-MAIN').toUpperCase(); if (!mine && Date.now() - (r.atMs || 0) < 2 * 60000) { setTimeout(() => d.ref.get().then((x) => x.exists && !x.data().handled && d.ref.set({ ping: Date.now() }, { merge: true })), 2 * 60000 + 2000); return; } // 지정 PC가 2분 안에 안 받으면 다른 PC가
    try { let ok = false; await db.runTransaction(async (tx) => { const s = await tx.get(d.ref); const v = s.data() || {}; if (v.handled) return; tx.set(d.ref, { handled: true, handledBy: PC_NAME, handledAt: nowIso() }, { merge: true }); ok = true; });
      if (ok) { log(`웹앱 요청으로 '${JOBS[r.job][0]}' 시작 (${r.byName || r.by || ''})`); window.__rnRemote = true; const pr = runJob(r.job); setTimeout(() => { window.__rnRemote = false; }, 3000); await pr; } } catch (e) {}
  } catch (e) {} }, () => {});

  /* ══════════ ⏰ 매일 자동 수집 (1.34.0) ══════════
   * 켜 두면(맨 위 스위치) 항목마다 정한 시각(하루 여러 번 가능)에 그 수집을 저절로 함 — 끌 때까지 매일.
   * 설정은 Firebase(prd_system/autoSched) 한 곳 → 모든 PC가 같은 설정을 보고, 시각마다 한 PC만 맡음(prd_jobs/autoSched 에 '날짜·시각' 표를 먼저 잡은 PC).
   * 그 시각에 PC가 꺼져 있었으면 그날 안에 알라딘 화면이 열린 PC가 늦게라도 한 번 함(밀린 회차는 한 번으로 묶음).
   * 주문(주문확인요청·발송 요청)과 알라딘 구매 첫 쪽은 클라우드가 늘 하므로 여기 없음.
   * 고객 쪽 일(묻고 답하기·반품·고객 일괄)은 주문조회·판매관리 화면 탭에서만 돎(그 화면에 고객 수집기가 있음). */
  /* (1.35.1) 같은 때 여러 항목이 할 때가 되면 이 목록 위에서부터 한 번에 하나씩(이 순서 = 우선순위): 고객 응대(묻고 답하기·반품) → 상품 상태 → 팔기 정산 → 구매 내역 → 긴 일괄.
     앞 항목이 막혀 있으면(다른 PC가 알라딘 작업 중·고객 탭 바쁨) 건너뛰고 다음 항목을 함 — 예전엔 막힌 항목 하나가 뒤 항목까지 붙잡아 둠 */
  const SCHED_ITEMS = [
    { k: 'qna', label: '묻고 답하기', kind: 'crm', task: 'qna', def: ['09:00', '13:00', '17:00'], why: '새 질문·답 안 한 질문 (답이 늦으면 구매 포기)' },
    { k: 'returns', label: '반품 관리', kind: 'crm', task: 'returns', def: ['10:00', '16:00'], why: '반품 요청·처리 상태' },
    { k: 'scanDaily', label: '상품 조회/수정 (판매중·일시판매중지·판매중지)', kind: 'prd', job: 'scanDaily', def: ['08:00', '20:00'], why: '새로 등록된 상품 + 상태가 바뀐 상품 (지난번까지 확인한 곳에서 멈춤)' },
    { k: 'buyback', label: '알라딘 팔기 정산 내역', kind: 'prd', job: 'buyback', def: ['21:00'], why: '팔기 접수·매입·정산' },
    { k: 'aladinBuy', label: '알라딘 구매 내역 (내가 산 것)', kind: 'prd', job: 'aladinBuy', def: ['22:00'], why: '모든 구매 주문·상세 (첫 쪽은 클라우드가 5분마다)' },
    { k: 'crmBulk', label: '고객·주문 전체 일괄', kind: 'crm', task: 'bulk', def: ['06:00'], why: '예전 \'매일 자동 수집\' (고객 수집기)', off: true },
    { k: 'chain', label: '모두 일괄 수집 (고객 + 상품 전체)', kind: 'prd', job: 'chain', def: ['17:00'], why: '예전 \'매일 자동 모두 일괄\' — 오래 걸림', off: true },
  ];
  const SCHED_REF = () => C('prd_system').doc('autoSched'); const SCHED_RUN = () => C('prd_jobs').doc('autoSched');
  let SCHED = null, SCHED_RUNS = {}; window.__rnSchedOn = false;
  const kstNow = () => { const d = new Date(Date.now() + 9 * 3600e3); return { day: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; };
  const tMin = (t) => { const m = String(t || '').match(/^([01]?\d|2[0-3]):([0-5]\d)$/); return m ? +m[1] * 60 + +m[2] : null; };
  const normTimes = (arr) => [...new Set((arr || []).map((t) => String(t).trim()).filter((t) => tMin(t) != null).map((t) => { const m = tMin(t); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }))].sort();
  async function schedInit() {
    SCHED_REF().onSnapshot(async (d) => {
      if (!d.exists) { // 처음: 예전 자동 설정을 옮겨 담음 (예전 스위치는 끔 — 이제 여기 한 곳에서만)
        for (let i = 0; i < 10 && !(window.__rnCrm && window.__rnCrm.oldAuto); i++) await new Promise((r) => setTimeout(r, 500)); // 고객 수집기가 준비될 때까지 잠깐
        let crmOld = null; try { crmOld = window.__rnCrm && window.__rnCrm.oldAuto ? await window.__rnCrm.oldAuto() : null; } catch (e) {}
        const items = {}; SCHED_ITEMS.forEach((it) => { items[it.k] = { on: !it.off, times: it.def }; });
        if (crmOld && crmOld.on) items.crmBulk = { on: true, times: normTimes([crmOld.time || '06:00']) };
        if (SET.autoDaily) items.chain = { on: true, times: [`${String(SET.autoHour ?? 17).padStart(2, '0')}:00`] };
        const on = !!((crmOld && crmOld.on) || SET.autoDaily);
        try { await SCHED_REF().set({ on, items, createdAt: nowIso(), by: PC_NAME, migrated: { crm: crmOld, chain: !!SET.autoDaily } }); } catch (e) {}
        try { if (window.__rnCrm && window.__rnCrm.offOldAuto) await window.__rnCrm.offOldAuto(); } catch (e) {}
        if (SET.autoDaily) { try { await saveSet({ autoDaily: false }); } catch (e) {} }
        return; }
      SCHED = d.data(); window.__rnSchedOn = !!SCHED.on; window.__rnSchedHas = true; schedDraw(); }, () => {});
    SCHED_RUN().onSnapshot((d) => { SCHED_RUNS = (d.exists && d.data().runs) || {}; schedDraw(); }, () => {});
    setInterval(schedTick, 60000); setTimeout(schedTick, 15000);
  }
  // 오늘 해야 할 회차: 시각이 지났고 아직 아무 PC도 안 잡은 것 — 밀린 회차가 여럿이면 마지막 것 하나로
  function schedDue() { if (!SCHED || !SCHED.on) return []; const { day, min } = kstNow(); const out = [];
    for (const it of SCHED_ITEMS) { const c = (SCHED.items || {})[it.k]; if (!c || !c.on) continue; const ts = normTimes(c.times).filter((t) => tMin(t) <= min); if (!ts.length) continue;
      const last = ts[ts.length - 1]; const key = `${it.k}@${day}@${last}`; if (SCHED_RUNS[key]) continue;
      if (it.kind === 'crm' && !(window.__rnCrm && window.__rnCrm.start)) continue; // 고객 수집기가 없는 화면(상품 조회/수정)에서는 건너뜀 — 다른 탭이 함
      out.push({ it, key, last, day, skip: ts.slice(0, -1).map((t) => `${it.k}@${day}@${t}`).filter((k) => !SCHED_RUNS[k]) }); }
    return out; } // 우선순위 순서(SCHED_ITEMS 순서) 그대로
  let schedBusy = false;
  async function schedTick() { if (schedBusy || running || window.__rnPaused || !auth.currentUser) return; if (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()) return;
    const dues = schedDue(); if (!dues.length) return; schedBusy = true;
    try { let due = null; let lk = null; // (1.35.1) 위(우선)부터 지금 할 수 있는 첫 항목 — 막힌 항목은 건너뜀(다음 확인 때 다시)
      for (const d of dues) { if (d.it.kind === 'crm' && window.__rnCrm.otherBusy && window.__rnCrm.otherBusy()) continue; // 이 PC의 다른 탭이 고객 작업 중
        if (d.it.kind === 'prd') { if (lk === null) lk = (await LOCK().get()).data() || {}; if (laneBusy(lk)) continue; } // 알라딘 줄이 다른 PC 작업으로 차 있음
        due = d; break; }
      if (!due) return;
      let ok = false; await db.runTransaction(async (tx) => { const s = await tx.get(SCHED_RUN()); const r = (s.exists && s.data().runs) || {}; if (r[due.key]) return; const up = { [due.key]: { by: PC_NAME, at: nowIso(), state: 'running' } }; due.skip.forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: up }, { merge: true }); ok = true; });
      if (!ok) return; const t0 = Date.now(); log(`⏰ 매일 자동: '${due.it.label}' 시작 (${due.last} 회차${due.skip.length ? ` · 밀린 ${due.skip.length}회차 함께` : ''})`);
      let res, err = null;
      if (due.it.kind === 'prd') { window.__rnAuto = true; res = await runJob(due.it.job); window.__rnAuto = false; err = lastRunErr; }
      else { try { await window.__rnCrm.start(due.it.task, { fresh: false }); if (due.it.task !== 'bulk' && window.__rnCrm.upload) await window.__rnCrm.upload(); } catch (e) { err = e.message; } }
      const st = res === false ? 'busy' : err ? 'error' : 'done';
      if (st === 'busy') { await SCHED_RUN().set({ runs: { [due.key]: firebase.firestore.FieldValue.delete() } }, { merge: true }); log(`⏰ '${due.it.label}': 다른 PC가 알라딘 작업 중이라 다음 확인 때 다시`, 1); return; }
      await SCHED_RUN().set({ runs: { [due.key]: { by: PC_NAME, at: nowIso(), state: st, ms: Date.now() - t0, err: err || null } } }, { merge: true });
      log(`⏰ 매일 자동: '${due.it.label}' ${st === 'done' ? '끝' : '멈춤 — ' + err} (${Math.round((Date.now() - t0) / 60000)}분)`, st === 'done' ? 0 : 1);
    } catch (e) { log('⏰ 매일 자동 확인 실패: ' + (e.code || e.message), 1); } finally { schedBusy = false; } }
  // (1.38.0) 개요 화면용: 다음에 저절로 할 일 (오늘 남은 가장 이른 시각, 없으면 내일 첫 시각)
  window.__rnSchedNext = () => { if (!SCHED) return { known: false }; if (!SCHED.on) return { known: true, on: false }; const { min } = kstNow(); let best = null;
    for (const it of SCHED_ITEMS) { const c = (SCHED.items || {})[it.k]; if (!c || !c.on) continue; for (const t of normTimes(c.times)) { const m = tMin(t); const d = m > min ? m - min : m + 1440 - min; if (!best || d < best.d) best = { d, t, label: it.label, tomorrow: m <= min }; } }
    return { known: true, on: true, next: best }; };
  // 화면: 상품 패널 맨 위 카드
  function schedDraw() { const el = document.getElementById('rnpSched'); if (!el) return; const S0 = SCHED || { on: false, items: {} }; const { day, min } = kstNow();
    const rows = SCHED_ITEMS.map((it, ix) => { const c = (S0.items || {})[it.k] || { on: false, times: it.def }; const ts = normTimes(c.times);
      const st = ts.map((t) => { const r = SCHED_RUNS[`${it.k}@${day}@${t}`]; const past = tMin(t) <= min; const s = r ? ({ done: '✓', running: '▶', error: '⚠', merged: '↷', busy: '…' })[r.state] || '·' : past ? (S0.on && c.on ? '⌛' : '–') : '·'; return `<span class="ts ${r ? r.state : past ? 'late' : ''}" title="${t} ${r ? `${r.state === 'done' ? '끝' : r.state === 'running' ? '하는 중' : r.state === 'merged' ? '다음 회차와 함께 함' : r.state === 'error' ? '멈춤: ' + (r.err || '') : r.state} · ${r.by || ''}` : past ? '아직 안 함 (알라딘 화면이 열린 PC가 곧 함)' : '오늘 예정'}">${s} ${t}</span>`; }).join('');
      return `<div class="sr${c.on ? ' on' : ''}"><label class="sw2"><input type="checkbox" data-sk="${it.k}" ${c.on ? 'checked' : ''}><span></span></label><div class="sb"><b>${ix + 1}. ${it.label}</b><small>${it.why}</small><div class="tl">${st || '<i>시각 없음</i>'} <a href="#" data-st="${it.k}" title="시각 고치기 (하루 여러 번: 쉼표로)">시각 ✎</a></div></div></div>`; }).join('');
    el.innerHTML = `<div class="sh2"><label class="sw2 big"><input type="checkbox" id="rnpSchedOn" ${S0.on ? 'checked' : ''}><span></span></label><b>⏰ 매일 자동 수집</b><span class="hint2">${S0.on ? '켜짐 — 끌 때까지 매일 정한 시각에' : '꺼짐 — 켜면 아래 켠 항목을 매일 정한 시각에'}</span></div><div class="sl${S0.on ? '' : ' dim'}">${rows}</div><div class="hint2" style="margin-top:3px">같은 때 여러 항목이면 번호 순서대로 하나씩(앞 항목이 막혀 있으면 다음 것부터) · ✓ 끝 · ▶ 하는 중 · ⌛ 시각 지남(곧 함) · ⚠ 멈춤(마우스를 올리면 이유) · 모든 PC가 같은 설정, 시각마다 한 PC만 함. 브라우저가 꺼져 있을 때도 돌리려면 <a href="#" id="rnpSchedHelp">윈도우 작업 스케줄러</a></div>`;
    el.querySelector('#rnpSchedOn').onchange = (e) => SCHED_REF().set({ on: e.target.checked, at: nowIso(), by: PC_NAME }, { merge: true }).then(() => log(`⏰ 매일 자동 수집 ${e.target.checked ? '켬' : '끔'}`)).catch((er) => alert('저장 실패: ' + er.message));
    el.querySelectorAll('[data-sk]').forEach((cb) => (cb.onchange = () => SCHED_REF().set({ items: { [cb.dataset.sk]: { on: cb.checked } } }, { merge: true }).catch((er) => alert('저장 실패: ' + er.message))));
    el.querySelectorAll('[data-st]').forEach((a) => (a.onclick = (ev) => { ev.preventDefault(); const it = SCHED_ITEMS.find((x) => x.k === a.dataset.st); const c = (S0.items || {})[it.k] || { times: it.def };
      const v = prompt(`'${it.label}' 하루 수집 시각 (24시간 형식, 여러 번이면 쉼표로)\n예) 09:00, 13:00, 17:00`, normTimes(c.times).join(', ')); if (v == null) return; const ts = normTimes(v.split(/[,\s]+/)); if (!ts.length) return alert('시각을 하나 이상 적어 주세요 (예: 09:00)');
      SCHED_REF().set({ items: { [it.k]: { times: ts } } }, { merge: true }).then(() => log(`⏰ '${it.label}' 시각: ${ts.join(', ')}`)).catch((er) => alert('저장 실패: ' + er.message)); }));
    const hl = el.querySelector('#rnpSchedHelp'); if (hl) hl.onclick = (ev) => { ev.preventDefault(); alert('브라우저가 꺼져 있어도 매일 돌게 하려면 (윈도우 작업 스케줄러)\n\n1. 시작 메뉴에서 "작업 스케줄러"를 엽니다.\n2. 오른쪽 "기본 작업 만들기" → 이름 "리드나우 자동 수집" → 매일 → 시각은 가장 이른 자동 수집 시각보다 5분 이르게.\n3. 동작 "프로그램 시작" → 프로그램: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n4. 인수: https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx → 마침.\n5. 만든 작업 → 조건 탭 "절전 모드 해제" 체크, 설정 탭 "예약된 시작 시간을 놓친 경우 가능한 대로 빨리 작업 시작" 체크.\n\nPC가 켜져 있고 크롬에 알라딘 로그인이 유지돼 있으면 정한 시각에 페이지가 열리고 수집기가 스스로 시작합니다.'); }; }
  { let inited = false; auth.onAuthStateChanged((u) => { if (u && !inited) { inited = true; schedInit(); } }); }
  /* ───────── 실행 ───────── */
  const JOBS = {
    scanNew: ['신규 등록분 수집', () => scan('new')],
    scanFull: ['전체 재검토', () => scan('full')],
    scanDaily: ['상품 조회 (판매중·일시판매중지·판매중지) 새로·바뀐 것', () => scan('daily')],
    market: ['도서 정보·시장 지표', () => market()],
    revTop: ['상위 판매자 평가 갱신', () => reviewJob('top')],
    dynamic0: ['구매자 분포 (하루치)', () => dynJob(SET.dynDaily || 300)],
    aladinBuy: ['알라딘 구매 내역 (전체)', () => aladinBuyJob()],
    rev6mAll: ['6개월 평가 수 (전체)', () => rev6mJob('all')],
    rev6mStale: ['6개월 평가 수 (오래된 것)', () => rev6mJob('stale')],
    revAll: ['판매자 평가 전체 수집', async () => { if (!confirm('모든 판매자의 평가를 처음 것까지 받습니다. 평가가 많은 판매자는 한 곳에 수천 쪽이라 며칠이 걸릴 수 있습니다. 멈춰도 이어서 할 수 있습니다. 시작할까요?')) return; return reviewJob('all'); }],
    chain: ['모두 일괄 수집', () => runChain(false)],
    prdChain: ['상품 일괄 수집 (고객 제외)', () => runChain(true)],
    dynAll: ['구매자 분포 전체 수집', async () => { const n = (await C('prd_books').get()).size; if (!window.__rnRemote && !confirm(`도서 정보가 있는 책 ${n.toLocaleString()}권 중 아직 안 모았거나 오래된 책을 전부 모읍니다. 한 권에 5~10초라 수천 권이면 하루 넘게 걸릴 수 있습니다. 멈춰도 이어서 합니다. 시작할까요?`)) return 'cancel'; return dynJob(0); }],
    soldInfo: ['판매완료 상품 정보·이미지', () => soldInfoJob()],
    poolInfo: ['알라딘 구매 풀(미연결) 도서 정보', () => poolInfoJob()],
    photos: ['상품 사진 (표지 없는 상품: 우리 페이지 → 상품명 검색)', () => photosJob()],
    usedInfo: ['경쟁 매물 유의사항·사진', () => usedInfoJob()],
    explore: ['끝없는 탐색 수집', () => exploreJob()],
    metricsReq: ['그룹 시장 지표 갱신', () => metricsReqJob()],
    shipRead: ['발송 요청 읽기 (오늘 출고)', () => shipReadJob()],
    nbMarket: ['새상품 없는 상품 시세', () => nbMarketJob()],
    buyback: ['알라딘 팔기 내역', () => buybackJob()],
    dynamic: ['구매자 분포·함께 산 책', () => dynJob(SET.dynDaily || 0)],
  };
  /* ───────── 버전 맞추기: 다른 PC가 더 새 수집기로 돌기 시작하면, 이 PC는 지금 항목까지 저장하고 멈춘 뒤 새로고침해 새 버전으로 이어감 ─────────
   * (동기화로 스크립트 파일은 바뀌어도, 이미 열려 있던 탭은 새로고침 전까지 예전 코드로 돎) */
  const verNum = (v) => String(v || '0').split('.').map((x) => +x || 0).reduce((a, x) => a * 1000 + x, 0);
  window.__rnOutdated = false;
  async function versionWatch() {
    const ref = C('crm_system').doc('collector_version');
    try { await db.runTransaction(async (tx) => { const d = (await tx.get(ref)).data() || {}; if (verNum(VER) > verNum(d.ver)) tx.set(ref, { ver: VER, by: PC_NAME, at: nowIso() }); }); } catch (e) {}
    // 더 새 버전이 생겨도 이 PC의 작업은 멈추지 않음. 하던 작업은 이 버전으로 끝까지 계속하고,
    // ① 아무 작업도 없을 때(2분 이상 쉼) 또는 ② 모두 일괄 수집의 단계와 단계 사이에서만 새로고침 → 새 버전으로 그 자리부터 자동으로 이어감.
    // 같은 버전으로는 한 번만 시도 (동기화 전이라 새로고침해도 예전 버전이면, 그 버전으로 그냥 계속).
    const want = GM_getValue('rnu-reload-for', null); if (want && verNum(want) <= verNum(VER)) GM_setValue('rnu-reload-for', null);
    ref.onSnapshot((d) => { const v = (d.data() || {}).ver; if (!v || verNum(v) <= verNum(VER) || window.__rnOutdated) return;
      window.__rnOutdated = v; const tried = GM_getValue('rnu-reload-for', null) === v;
      log(`새 수집기 ${v}가 있습니다 (이 탭은 ${VER}). 지금 작업은 그대로 계속합니다${tried ? ' (이 PC는 아직 동기화 전 — 이 버전으로 계속)' : '. 쉬는 사이나 일괄 수집 단계 사이에 새 버전으로 바꿔 이어갑니다'}`);
      if (tried) return; let idleSince = null; const seenAt = Date.now();
      const t = setInterval(() => { const busy = running || imgRunning || (window.__rnCrm && window.__rnCrm.busy());
        // (1.38.0) 오래 걸리는 작업 중이면(새 판을 본 지 10분 넘게) 진행 위치 저장 지점에서 멈추고 새로고침해 새 판으로 그 자리부터 이어감
        //   예전: 쉬거나 일괄 단계 사이에서만 바꿔, 몇 시간짜리 단계가 끝날 때까지 옛 판으로 돌았음(10/8: 16:32에 1.37.0을 보고도 계속 1.27.0)
        if (busy && running && !imgRunning && !(window.__rnCrm && window.__rnCrm.busy()) && !window.__rnPaused && !memReload && !verReload && curKey && curKey !== 'explore' && JOBS[curKey] && Date.now() - seenAt > 10 * 60000) { clearInterval(t); verReload = true; stopFlag = true; log(`새 수집기 ${v}로 바꾸려고 지금 항목까지 저장하고 멈춥니다 — 새로고침 뒤 '${JOBS[curKey][0]}'을(를) 그 자리부터 자동으로 이어감`, 1); return; }
        if (busy) { idleSince = null; return; } idleSince = idleSince || Date.now(); if (Date.now() - idleSince < 120000) return; clearInterval(t); GM_setValue('rnu-reload-for', v); safeReload('새 버전으로 바꿈', null); }, 10000); }, () => {});
    // 새로고침 뒤 이어가기: 실제로 시작될 때까지 표시를 지우지 않고 15초마다 다시 시도(최대 10분), 사람 확인 없이(무인) 시작
    { const after = GM_getValue('rnu-resume-after-reload', null);
      if (after && JOBS[after]) { let tries = 0; const t = setInterval(() => { tries++;
        if (window.__rnPaused) { clearInterval(t); log(`새로고침 뒤 이어가기 '${JOBS[after][0]}': 일시정지 상태라 이어가지 않음 (개요 탭의 ▶ 다시 시작으로 계속)`, 1); return; }
        if (running) return; if (tries > 40) { clearInterval(t); log(`새로고침 뒤 이어가기 '${JOBS[after][0]}'를 10분 동안 시작하지 못했습니다 — 개요 탭 '멈춘 작업'의 이어하기를 눌러 주세요`, 1); return; }
        clearInterval(t); GM_setValue('rnu-resume-after-reload', null); log(`새로고침 뒤 '${JOBS[after][0]}'을(를) 저장된 자리부터 이어갑니다 (수집기 ${VER})`); window.__rnAuto = true; runJob(after).finally(() => { window.__rnAuto = false; }); }, 15000); } }
  }
  // (1.26.1) 안전한 새로고침: 바로 location.reload()하면 알라딘이 429(요청 너무 많음)를 돌려줄 때 크롬 오류 화면에 멈춤(그 화면에서는 어떤 스크립트도 못 돎).
  //  ① 서버가 200으로 답할 때까지 기다림(30초 → 1·2·4…15분 간격으로 확인)  ② 새 탭으로 같은 화면을 엶  ③ 새 탭의 수집기가 실제로 떠서 '받았음' 신호를 보내면 이 탭을 닫음
  //  ④ 2분 안에 신호가 없으면(새 탭이 오류 화면) 그 탭을 닫고 ①부터 다시 — 수집기가 떠야만 넘어가므로 오류 화면에 멈추지 않음. 새 탭은 저장된 자리부터 자동으로 이어감
  const HANDOFF_TAB = Math.random().toString(36).slice(2, 10);
  async function safeReload(reason, resumeKey) {
    if (resumeKey) GM_setValue('rnu-resume-after-reload', resumeKey);
    try { localStorage.setItem('rn-tab-handoff', JSON.stringify({ pwTab: sessionStorage.getItem('pw_tab'), at: Date.now() })); } catch (e) {} // 가격 감시 탭이었으면 새 탭이 이어받음
    let wait = 30000; const tStart = Date.now(); log(`[안전한 새로고침] 시작 — 이유: ${reason}${resumeKey ? ` · 새 탭에서 이어갈 작업: '${(JOBS[resumeKey] || [resumeKey])[0]}'` : ''} · 지금 요청 간격 ${PACE.state().gap}ms${PACE.cooling() ? ` · 쉬는 중 ${Math.round(PACE.cooling() / 1000)}초 남음` : ''}`);
    for (let tryN = 1; ; tryN++) {
      let st = 0, em = ''; try { const r = await fetch(location.href, { credentials: 'include', cache: 'no-store' }); st = r.status; } catch (e) { st = 0; em = e.message; } log(`[안전한 새로고침] ${tryN}번째 서버 확인: ${st || '응답 없음'}${em ? ' (' + em + ')' : ''}${st === 429 ? ' — 요청 너무 많음' : ''} · 시작한 지 ${Math.round((Date.now() - tStart) / 60000)}분`);
      if (st === 200) {
        const id = HANDOFF_TAB + '_' + tryN; GM_setValue('rn-handoff', { id, at: Date.now() }); GM_setValue('rn-handoff-ack', null);
        log(`${reason}: 새 탭으로 다시 엽니다 (${tryN}번째)`); let tab = null; try { tab = GM_openInTab(location.href.replace(/#.*$/, ''), { active: true, insert: true, setParent: true }); } catch (e) {}
        const t0 = Date.now(); while (Date.now() - t0 < 120000) { await sleep(3000); if (GM_getValue('rn-handoff-ack', null) === id) { log(`[안전한 새로고침] 새 탭이 이어받았습니다 (${Math.round((Date.now() - t0) / 1000)}초 만에) — 남은 기록을 저장하고 이 탭을 닫습니다 · 전체 ${Math.round((Date.now() - tStart) / 60000)}분 걸림`); if (window.__rnFlush) await window.__rnFlush(); await sleep(800); try { window.close(); } catch (e) {} location.replace('about:blank'); return; } }
        let closed = false; try { if (tab) { tab.close(); closed = true; } } catch (e) {} log(`[안전한 새로고침] 새 탭이 2분 안에 뜨지 않았습니다(알라딘 오류 화면 — 429 등일 가능성) → 그 탭을 ${closed ? '닫음' : '닫지 못함(직접 닫아 주세요)'} · ${Math.round(wait / 6000) / 10}분 기다렸다 다시`, 1); PACE.fail('429');
      } else { log(`${reason}: 알라딘이 ${st || '응답 없음'}(${st === 429 ? '요청 너무 많음' : '아직 안 됨'}) — ${Math.round(wait / 6000) / 10}분 뒤 다시 확인`, 1); if (st === 429) PACE.fail('429'); }
      ui(`${reason} — 알라딘이 다시 받아 줄 때까지 기다리는 중`, 0, 0, `${Math.round(wait / 6000) / 10}분 뒤 다시 확인 (${tryN}번째) · 이 탭을 닫지 마세요`);
      await sleep(wait); wait = Math.min(wait * 2, 15 * 60000);
    }
  }
  // 새 탭 쪽: 안전한 새로고침으로 열린 탭이면 '받았음' 신호
  { const h = GM_getValue('rn-handoff', null); if (h && h.id && Date.now() - h.at < 10 * 60000) { GM_setValue('rn-handoff-ack', h.id); GM_setValue('rn-handoff', null); const rk = GM_getValue('rnu-resume-after-reload', null); log(`[안전한 새로고침] 이 탭이 새로 열려 이어받음 (옛 탭 신호 ${h.id}, ${Math.round((Date.now() - h.at) / 1000)}초 전)${rk ? ` · 곧 '${(JOBS[rk] || [rk])[0]}' 이어가기` : ''}`); } }
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
  let lastRunErr = null;
  async function runJob(key, opt) {
    const [name, fn] = JOBS[key]; lastRunErr = null;
    if (running && curKey === 'explore' && key !== 'explore') { log(`'${name}'을(를) 먼저 하려고 끝없는 탐색 수집을 잠시 멈춥니다 — 끝나면 탐색을 다시 이어감`); GM_setValue('rn-explore-resume', true); stopFlag = true; for (let w = 0; w < 180 && running; w++) await sleep(1000); stopFlag = false; }
    if (running) { log('이 탭에서 다른 작업 진행 중: ' + running + ' — 다른 알라딘 작업은 새 탭에서 동시에 할 수 있습니다', 1); return; }
    curKey = key; FORCE_ALL = !!(opt && opt.manual) && !['chain', 'prdChain'].includes(key); setRunning(name); const tJ = Date.now(); if (FORCE_ALL) log(`수동 실행: '${name}'을(를) 기간 제한 없이 전부 모읍니다 (기존 기록은 그대로 두고 바뀐 것만 덧붙임)`); if (window.__rnStatus) Object.assign(window.__rnStatus, { job: name, jobKey: key, jobStart: tJ, cur: {}, chain: (key === 'chain' || key === 'prdChain') ? window.__rnStatus.chain : null, sub: null }); log(`▶ '${name}' 시작 (수집기 ${VER} · ${PC_NAME})`);
    let res;
    try { res = await fn(); if (res === 'reload') { ui('새 버전으로 바꾸는 중 — 곧 이어감', 0, 0); } else if (res === 'cancel') { ui('취소함', 0, 0); log(`'${name}' 취소함`); } else if (res === false) { ui('시작 못 함 — 다른 PC가 알라딘 작업 중', 0, 0, '', '그 작업이 끝나면 자동으로 시작합니다 (일시정지를 누르면 취소)'); log(`'${name}': 다른 PC가 알라딘 작업 중이라 기다립니다. 끝나면 자동으로 시작합니다`, 1); waitThenRun(key); } else if (!stopFlag) { ui('완료: ' + name, 1, 1, '', ''); log(name + ' 완료', 0); } }
    catch (e) { lastRunErr = e.message;
      const paused = e.message === '멈춤';
      ui(paused ? '일시정지됨 — 진행 위치 저장' : '오류로 멈춤', 0, 0, paused ? '' : e.message, '개요 탭의 ▶ 다시 시작(또는 멈춘 작업의 이어하기)을 누르면 멈춘 자리부터 합니다');
      if (!paused) log('오류: ' + e.message, 1);
    } finally { if (window.__rnStatus) Object.assign(window.__rnStatus, { job: null, jobKey: null, cur: {}, lastEnd: { name, at: Date.now(), ms: Date.now() - tJ } });
      log(`■ '${name}' 끝남 — ${Math.round((Date.now() - tJ) / 60000)}분${stopFlag ? ' (멈춤)' : ''}`); setRunning(null); curKey = null; FORCE_ALL = false;
      if (memReload) { log(`메모리 정리를 위해 새로고침 → '${name}' 이어가기`); safeReload('메모리 정리', key); return res; }
      if (verReload) { verReload = false; if (!window.__rnPaused) { log(`새 수집기 ${window.__rnOutdated}로 바꾸려고 새로고침 → '${name}'을(를) 저장된 자리부터 이어가기`); GM_setValue('rnu-reload-for', window.__rnOutdated); safeReload('새 버전으로 바꿈', key); return res; } }
      if (yieldFor) resumeAfterYield();
      else if (key !== 'explore' && GM_getValue('rn-explore-resume', false)) setTimeout(() => { if (!running && !window.__rnPaused && GM_getValue('rn-explore-resume', false)) { GM_setValue('rn-explore-resume', false); log('앞의 작업이 끝나 끝없는 탐색 수집을 다시 이어갑니다'); runJob('explore'); } }, 8000); }
    return res;
  }
  window.__rnPrd = { runJob: (k) => runJob(k), busy: () => !!running, pause: () => { if (running || imgRunning) stopFlag = true; } };
  let waitTimer = null;
  function waitThenRun(key) {
    clearInterval(waitTimer); const t0 = Date.now(); $('#rnpCtlStop') && ($('#rnpCtlStop').style.display = '');
    waitTimer = setInterval(async () => {
      if (stopFlag || window.__rnPaused) { clearInterval(waitTimer); stopFlag = false; ui('기다리기 취소 (일시정지)', 0, 0); return; }
      if (Date.now() - t0 > 6 * 3600e3) { clearInterval(waitTimer); log('6시간 기다렸지만 알라딘 작업이 끝나지 않아 취소했습니다', 1); return; }
      try { const lk = (await LOCK().get()).data(); if (laneBusy(lk)) { ui(`기다리는 중 — ${lk.pcName || '다른 PC'}: ${lk.taskLabel || ''}`, 0, 0, `${Math.round((Date.now() - t0) / 60000)}분째`, '끝나면 자동으로 시작합니다 (일시정지를 누르면 취소)'); return; }
        clearInterval(waitTimer); if (!running) { log('알라딘 작업이 끝났습니다. 시작합니다'); runJob(key); } } catch (e) {}
    }, 60000);
  }
  // 양보 뒤 자동 이어가기: 잠금이 풀리고(고객 수집 끝) 새 양보 요청이 없으면 멈춘 작업을 다시 시작
  function resumeAfterYield() {
    const y = yieldFor; ui(`양보 중 — '${y.tool || '고객 수집'}'이 끝나면 자동으로 이어감`, 0, 0, `${y.pcName || ''}`);
    const t0 = Date.now(); let saw = false;
    const t = setInterval(async () => {
      try { const d = await LOCK().get(); const x = d.exists ? d.data() : null; const fresh = x && x.holder && Date.now() - (x.heartbeatMs || 0) < 5 * 60000;
        const higher = fresh && (legacyOther(x, Date.now()) || (laneBusy(x) && Object.values(freshPcs(x, Date.now())).some((v) => (v.prio ?? 0) >= y.myPrio)));
        if (higher) { saw = true; return; } if (!saw && Date.now() - t0 < 3 * 60000) return; // 양보받은 작업이 잠금을 잡는 것을 본 뒤(또는 3분 뒤)에
        clearInterval(t); const key = y.key; yieldFor = null; stopFlag = false; if (window.__rnPaused) { log('양보가 끝났지만 일시정지 상태라 이어가지 않습니다'); return; } log('더 중요한 작업이 끝났습니다. 멈췄던 작업을 이어갑니다'); if (key && JOBS[key]) runJob(key); } catch (e) {}
    }, 60000);
  }
  box.querySelectorAll('[data-job]').forEach((b) => (b.onclick = () => { window.__rnResumeOk && window.__rnResumeOk(); return b.dataset.job === 'images' ? images() : runJob(b.dataset.job, { manual: true }); }));

  /* (1.38.0) 멈춘 작업 목록 — 어느 PC에서 멈췄든 전부. 개요 화면이 작업마다 [이어하기]·[버리기]로 보여 줌
   *  예전 문제: ① 맨 앞 하나만 보여서, 하나를 버리면 다음 멈춘 작업이 같은 자리에 떠 '안 지워진' 것처럼 보였음
   *            ② 다른 탭에서 돌고 있는 작업을 버리면, 그 탭이 다음 저장 때 다시 '멈춘 작업'으로 써 넣어 되살아났음 → 돌고 있는 작업은 버리기를 막음
   *  버리기 = '멈춘 자리'만 잊음. 받은 기록은 하나도 지우거나 바꾸지 않음 (다음엔 처음부터 훑되 이미 받은 것은 건너뜀) */
  const STAGE_JOB = { scanNew: 'scanNew', aladinBuy: 'aladinBuy', buyback: 'buyback', market: 'market', nbMarket: 'nbMarket', soldInfo: 'soldInfo', poolInfo: 'poolInfo', photos: 'photos', usedInfo: 'usedInfo', rev6m: 'rev6mStale', revTop: 'revTop', dynamic: 'dynamic', scanFull: 'scanFull', revAll: 'revAll' };
  let resumeKey = null; let RESUMABLES = [];
  function runningKeys() { const ks = new Set(); const addChain = (k, stage) => { ks.add(k); if (stage && STAGE_JOB[stage]) ks.add(STAGE_JOB[stage]); };
    if (curKey) addChain(curKey, curStage);
    try { (window.__rnLive ? window.__rnLive() : []).forEach((v) => { if (v.busy && v.jobKey) addChain(v.jobKey, v.chain && v.chain.cur); }); } catch (e) {}
    Object.values(PCS_SEEN).forEach((x) => { if (x && x.running && x.key && Date.now() - (x.atMs || 0) < 3 * 60000) ks.add(x.key); });
    return ks; }
  async function refreshResume() {
    try {
      const qs = await C('prd_jobs').where('done', '==', false).get(); const list = {};
      qs.forEach((d) => { if (JOBS[d.id] && d.id !== 'explore') list[d.id] = d.data(); });
      const hide = new Set(); ['chain', 'prdChain'].forEach((c) => { const st = list[c] && list[c].stage; if (st && STAGE_JOB[st]) hide.add(STAGE_JOB[st]); }); // 일괄의 '지금 단계' 자리는 일괄 안에 묶어 보여 줌
      const pr = (j) => (j && j._n ? `${(+j._i || 0).toLocaleString()} / ${(+j._n).toLocaleString()}` : '');
      RESUMABLES = [...new Set(['chain', 'prdChain', ...Object.keys(JOBS)])].filter((k) => list[k] && !hide.has(k)).map((k) => { const j = list[k]; const st = j.stage; const sj = st && STAGE_JOB[st] ? list[STAGE_JOB[st]] : null;
        return { key: k, name: JOBS[k][0], by: j.by || '', savedAt: j.savedAt || 0, stage: st ? (STEP_LABEL[st] || st) : null, prog: sj ? pr(sj) : pr(j) }; });
      resumeKey = RESUMABLES.length ? RESUMABLES[0].key : null;
      $('#rnpCtlResume').classList.remove('on'); // 예전 버튼 자리 — 개요로 옮김
    } catch (e) {}
    try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {}
    return RESUMABLES;
  }
  async function discardJob(k) {
    if (!JOBS[k]) return { ok: false, why: '모르는 작업' };
    if (runningKeys().has(k)) return { ok: false, why: `'${JOBS[k][0]}'은(는) 지금 진행 중입니다 — 먼저 일시정지하고, 멈춘 뒤에 버리세요` };
    const keys = [k]; if (k === 'chain' || k === 'prdChain') { const st = ((await jobRef(k).get()).data() || {}).stage; if (st && STAGE_JOB[st]) keys.push(STAGE_JOB[st]); } // 일괄이면 일괄 순서표와 '지금 단계'의 자리
    for (const x of keys) { try { const d = (await jobRef(x).get()).data(); if (d && !d.done) await jobRef(x).set({ done: true, discarded: true, discardedAt: Date.now(), discardedBy: PC_NAME }, { merge: true }); LS.set('job_' + x, null); } catch (e) { return { ok: false, why: e.message }; } }
    log(`'${JOBS[k][0]}'의 멈춘 자리만 잊었습니다 (받은 기록은 그대로 · 다음엔 처음부터 훑되 이미 받은 것은 건너뜀)`); await refreshResume(); return { ok: true }; }
  function resumeJob(k) { if (!JOBS[k]) return; if (running) return alert(`이 탭은 '${running}' 진행 중입니다`); if (runningKeys().has(k)) return alert(`'${JOBS[k][0]}'은(는) 이미 진행 중입니다`); window.__rnResumeOk && window.__rnResumeOk(); runJob(k); }
  $('#rnpCheck').onclick = () => preflight(false).then((ok) => ok && alert('시작 전 점검: 모두 정상입니다. 자세한 내용은 기록 창에 있습니다.'));
  $('#rnpLogBig').onclick = (e) => { e.preventDefault(); window.__rnJournalToggle && window.__rnJournalToggle(); };
  $('#rnpResume').onclick = () => { if (resumeKey) resumeJob(resumeKey); };
  $('#rnpReset').onclick = async () => { if (!resumeKey) return; const r = await discardJob(resumeKey); if (!r.ok) alert(r.why); };
  Object.assign(window.__rnPrd, { resumables: () => RESUMABLES, refreshResume, discard: discardJob, resume: resumeJob, runningKeys, imgBusy: () => !!imgRunning, startAll: () => runJob('chain'), pcsHtml: () => ($('#rnpPcs') ? $('#rnpPcs').innerHTML : ''), who: () => ($('#rnpWho') ? $('#rnpWho').textContent : ''), ver: () => VER, outdated: () => window.__rnOutdated || null });
  setInterval(() => { if (!running) refreshResume(); }, 10 * 60000); // 멈춘 작업 문서는 진행 목록이 커서(수백 KB) 자주 읽지 않음 — 작업이 끝날 때·버릴 때·개요의 ↻ 때 바로 다시 읽음
  setTimeout(drawTemp, 2000);
  const drawSteps = () => { const el = $('#rnpSteps'); if (!el) return; el.innerHTML = '<span style="color:#5B6B66">이번에 할 것:</span> <a href="#" data-stepall="1" style="color:#2F5D50">전체 선택</a> · <a href="#" data-stepall="0" style="color:#2F5D50">전체 해제</a><br>' + Object.entries(STEP_LABEL).map(([k, l]) => `<label style="white-space:nowrap"><input type="checkbox" data-step="${k}" ${(SET.steps || {})[k] !== false ? 'checked' : ''}> ${l}</label>`).join('');
    el.querySelectorAll('[data-stepall]').forEach((a) => (a.onclick = (ev) => { ev.preventDefault(); const on = a.dataset.stepall === '1'; SET.steps = Object.fromEntries(Object.keys(STEP_LABEL).map((k) => [k, on])); C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 단계 ${on ? '전체 선택' : '전체 해제'} (모든 PC에 적용)`); drawSteps(); }));
    el.querySelectorAll('[data-step]').forEach((c) => (c.onchange = () => { SET.steps = { ...(SET.steps || {}), [c.dataset.step]: c.checked }; C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 '${STEP_LABEL[c.dataset.step]}' ${c.checked ? '켬' : '끔'} (모든 PC에 적용)`); })); };
  setTimeout(drawSteps, 1500); setInterval(drawSteps, 60000);
  $('#rnpRevTest').onclick = () => { if (running) return log('다른 작업 진행 중', 1); reviewTest().catch((e) => log('시험 실패: ' + e.message, 1)); };

  // 다른 PC 상태: 잠금(고객 수집기 포함) + 각 PC가 30초마다 올리는 진행 상황
  const PCS_SEEN = {};
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
      $('#rnpPcs').innerHTML = rows.join('') || '<div class="pc">다른 PC에서 진행 중인 작업 없음</div>';
    };
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
    await loadSettings(); renderSetup();
    watchPcs(); await refreshResume(); versionWatch();
    publishStatus({ running: null });
    ui('대기 중', 0, 0, '', resumeKey ? '멈춘 작업이 있습니다. 위의 이어하기를 누르세요' : '처음이라면: 등록 파일 가져오기 → 상품 일괄 수집 → 이미지');
    log(`준비됨 · 수집기 ${VER} · 파서 ${P.VERSION}`, 0);
  })();
})();

