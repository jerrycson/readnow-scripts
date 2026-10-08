// ==UserScript==
// @name         리드나우 수집기
// @namespace    readnow
// @version      1.37.0
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
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-registry.js?v=0.2.0
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
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
/* 리드나우 수집기 1.0.0 — 고객 수집기(0.16.1)와 상품 수집기(0.8.1)를 하나로 합친 것.
 * 화면 오른쪽 위 탭으로 '고객'과 '상품·판매자·매입'을 바꿔 봄. 로그인·PC 이름·알라딘 아이디는 한 번만 넣으면 둘 다 씀.
 * 알라딘 작업 잠금은 하나(crm_system/work_lock): 고객 수집이 먼저(상품 쪽 긴 작업은 양보 후 자동으로 이어감). */
/* ═════════════ 이 PC 이름: 한 곳에서 관리 ═════════════
 * 스크립트 저장공간(GM)과 알라딘 사이트의 브라우저 저장공간(localStorage) 두 곳에 함께 둠 → 스크립트를 다시 설치·교체해도 이름이 남음.
 * 고객 쪽(rn-pc)·상품 쪽(pcName)·기록이 모두 같은 이름을 씀. 자동 작업 중에는 묻지 않고, 버튼을 눌렀을 때만 한 번 물음. */
/* ═════════════ 알라딘 다시 로그인: 네이버로 로그인 (기본) ═════════════
 * 알라딘 아이디 로그인에 자동입력방지가 생겨, 알라딘 로그인 화면의 'SNS 계정으로 로그인 → 네이버'와 같은 길을 씀.
 * 알라딘 화면의 goNaverLogin()이 여는 주소: /login/wlogin_naver.aspx?returnurl=…&snsAppId=1&SecureOpener=1
 *  → 네이버 인증(nid.naver.com) → /login/wlogin_naver.aspx?code=…&state=… 로 돌아오며 알라딘 로그인 완료.
 * 네이버에 '로그인 상태 유지'로 로그인돼 있으면 아이디·비밀번호·자동입력방지 없이 바로 끝남. 네이버 아이디·비밀번호는 수집기가 절대 입력하지 않음.
 * 네이버 로그인까지 풀렸으면: 보이는 창을 열고 알림 → 사람이 네이버에 한 번 로그인(로그인 상태 유지 체크) → 수집이 이어짐 (최대 30분 기다림) */
(function rnNaverLoginInit() {
  if (window.__rnNaverLogin) return;
  const NAVER_URL = (ret) => `https://www.aladin.co.kr/login/wlogin_naver.aspx?returnurl=${encodeURIComponent(ret || 'https://www.aladin.co.kr/scm/wmain.aspx')}&snsAppId=1&SecureOpener=1`;
  window.__rnLoginMethod = () => GM_getValue('rnu-login-method', 'naver');
  window.__rnNaverLogin = async ({ isLoggedIn, log, stopped, ret }) => {
    const L = (m, lv) => { try { log(m, lv); } catch (e) { window.__rnLog && window.__rnLog('로그인', lv === 'err' ? 'err' : lv ? 'warn' : 'info', m); } }; // 각 모듈의 log가 기록 창에도 남김
    const busy = GM_getValue('rnu-naver-login', null);
    if (busy && Date.now() - busy.at < 120000) { // 다른 탭·모듈이 이미 하는 중 → 결과만 기다림
      for (let i = 0; i < 24; i++) { await new Promise((r) => setTimeout(r, 5000)); if (await isLoggedIn()) return true; if (stopped && stopped()) return false; }
      return false;
    }
    GM_setValue('rnu-naver-login', { at: Date.now() });
    L('알라딘 로그인이 풀려 네이버로 다시 로그인합니다 (네이버 로그인 상태 유지 사용)');
    let tab = GM_openInTab(NAVER_URL(ret), { active: false, insert: true }); let ok = false;
    for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 5000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } } // 최대 60초
    try { tab.close(); } catch (e) {}
    if (!ok && !(stopped && stopped())) { // 네이버 로그인도 풀림 → 사람에게
      L('네이버 로그인 상태가 풀려 있습니다. 새로 열린 창에서 네이버에 로그인해 주세요 ("로그인 상태 유지"를 켜면 다음부터 자동). 로그인하면 수집이 이어집니다 (최대 30분 기다림)', 'err');
      GM_setValue('rnu-need-naver', Date.now()); try { GM_notification({ title: '리드나우 수집기 — 네이버 로그인 필요', text: '열린 창에서 네이버에 로그인해 주세요 (로그인 상태 유지). 로그인하면 수집이 이어집니다.' }); } catch (e) {}
      try { if (window.firebase && firebase.apps.length && firebase.auth().currentUser) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: 'naver', pcName: (window.__rnPcName && window.__rnPcName.get()) || '', at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
      tab = GM_openInTab(NAVER_URL(ret), { active: true, insert: true });
      for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 10000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } }
      try { tab.close(); } catch (e) {}
      try { if (window.firebase && firebase.apps.length) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: null, at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
    }
    GM_deleteValue('rnu-naver-login'); if (ok) GM_deleteValue('rnu-need-naver');
    GM_setValue(ok ? 'rnu-naver-okAt' : 'rnu-naver-failAt', Date.now());
    L(ok ? '네이버로 다시 로그인했습니다. 계속합니다' : '네이버 로그인이 되지 않았습니다', ok ? '' : 'err');
    return ok;
  };
})();
(function rnPause() {
  window.__rnPaused = !!GM_getValue('rnu-paused', false);
  window.__rnPauseAll = (why) => { window.__rnPaused = true; GM_setValue('rnu-paused', true); try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {} try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} window.__rnLog && window.__rnLog('수집기', 'warn', `■ 일시정지 (${why || '사람이 누름'}) — 고객·상품·일괄 모두 지금 항목까지 저장하고 멈춤. 사람이 다시 시작하기 전에는 자동으로 다시 시작하지 않음`); };
  window.__rnResumeOk = () => { if (window.__rnPaused) window.__rnLog && window.__rnLog('수집기', 'info', '▶ 사람이 다시 시작함 (일시정지 풀림)'); window.__rnPaused = false; GM_setValue('rnu-paused', false); };
})();
(function rnPcName() {
  const keys = () => { let n = null; try { n = GM_getValue('rnu-pcname', null) || GM_getValue('pcName', null) || (GM_getValue('rn-pc', {}) || {}).name || localStorage.getItem('rnu-pcname'); } catch (e) {} return n && String(n).trim() ? String(n).trim() : null; };
  const setAll = (n) => { n = String(n || '').trim(); if (!n) return; try { GM_setValue('rnu-pcname', n); GM_setValue('pcName', n); const pc = GM_getValue('rn-pc', null) || { id: Math.random().toString(36).slice(2, 10), name: '' }; if (pc.name !== n) { pc.name = n; GM_setValue('rn-pc', pc); } localStorage.setItem('rnu-pcname', n); } catch (e) {} };
  const cur = keys(); if (cur) setAll(cur); // 한 곳에만 있어도 모두 맞춤
  window.__rnPcName = { get: keys, set: setAll, ask: (why) => { const v = keys(); if (v) return v; const n = prompt(`이 PC의 이름을 정해 주세요 (예: JS-MAIN, HOME). ${why || ''}\n한 번만 정하면 됩니다 — 새로고침·스크립트 교체 뒤에도 기억합니다.`); if (n && n.trim()) { setAll(n.trim()); return n.trim(); } return null; } };
})();
/* ═════════════ 작업 기록 (두 모듈 공통) ═════════════
 * 모든 진행(단계 시작·끝, 쪽·항목마다의 진행, 양보·기다림·오류)을 초 단위로 남김.
 * 이 PC: 날짜별로 브라우저에 보관(최근 7일) — 새로고침·멈춤 뒤에도 남음.  Firebase: rn_logs/{PC}_{날짜시각10분} 에 1분마다 묶어서 올림 → 웹앱이나 다른 PC에서도 확인.
 * 화면: 위쪽 [기록] 버튼 → 크게 보는 창 (중요만/전체/오류, 검색, 자동 스크롤, 내려받기). 진행을 늦추지 않게 화면 갱신은 1초에 한 번. */
(function rnJournal() {
  if (window.top !== window || window.__rnLog) return;
  const MAXMEM = 10000; const buf = []; const pend = []; const idbPend = []; let dirty = false; let seq = 0;
  const day = (d) => { const k = new Date(d.getTime() + 9 * 3600e3); return k.toISOString().slice(0, 10); };
  const LSK = (d) => 'rnu-log-' + d;
  // ── 기록 보관: 이 PC의 IndexedDB('rn-journal')에 날짜별로 덧붙임 — 지우지 않고 계속 쌓음 (내려받기 하면 그때 비움)
  const JDB = () => new Promise((res, rej) => { const r = indexedDB.open('rn-journal', 1); r.onupgradeneeded = () => r.result.createObjectStore('days', { keyPath: 'day' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const jtx = async (mode, fn) => { const db = await JDB(); return new Promise((res, rej) => { const t = db.transaction('days', mode); const st = t.objectStore('days'); let out; Promise.resolve(fn(st, (v) => (out = v))).catch(rej); t.oncomplete = () => { db.close(); res(out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  const jget = (k) => jtx('readonly', (st, set) => { const r = st.get(k); r.onsuccess = () => set(r.result || null); });
  const jkeys = () => jtx('readonly', (st, set) => { const r = st.getAllKeys(); r.onsuccess = () => set(r.result || []); });
  const jput = (rec) => jtx('readwrite', (st) => { st.put(rec); });
  const jclear = () => jtx('readwrite', (st) => { st.clear(); });
  // (1.25.1) 하루치 전체를 20초마다 읽고 다시 쓰던 방식이 오래 돌면 메모리를 크게 씀 → 작은 묶음으로 덧붙이기만 함 (키 '날짜#시각'), 읽을 때 날짜별로 합침
  async function jflush() { if (!idbPend.length) return; const out = idbPend.splice(0, idbPend.length); const g = {}; out.forEach((e) => { (g[day(new Date(e.t))] = g[day(new Date(e.t))] || []).push(e); });
    for (const [d, arr] of Object.entries(g)) { try { await jput({ day: `${d}#${String(Date.now()).padStart(15, '0')}-${++seq}`, lines: arr }); } catch (e) { idbPend.unshift(...arr); break; } } }
  const jgetDay = (d) => jtx('readonly', (st, set) => { const r = st.getAll(IDBKeyRange.bound(d, d + '\uffff')); r.onsuccess = () => set({ day: d, lines: (r.result || []).flatMap((x) => x.lines || []) }); });
  const jdays = async () => [...new Set((await jkeys()).map((k) => String(k).split('#')[0]))];
  (async () => { try { // 예전 localStorage 기록(7일치)을 옮겨 담고 지움 · 오늘 기록을 불러와 이어 씀
    for (let i = 0; i < 30; i++) { const d = day(new Date(Date.now() - i * 864e5)); const raw = localStorage.getItem(LSK(d)); if (!raw) continue; try { const arr = JSON.parse(raw); const rec = (await jget(d)) || { day: d, lines: [] }; if (!rec.lines.length) { rec.lines = arr; await jput(rec); } } catch (e) {} localStorage.removeItem(LSK(d)); }
  } catch (e) {} })(); // 새로고침하면 '이번 화면'은 비어서 시작 — 오늘 앞선 기록은 '지난 기록'의 오늘 날짜에 있음
  const pcName = () => (window.__rnPcName && window.__rnPcName.get()) || '이 PC';
  window.__rnStatus = window.__rnStatus || {};
  window.__rnLog = (mod, lv, msg) => { const now = new Date(); const e = { t: now.getTime(), m: mod, l: lv, x: String(msg).slice(0, 600) };
    const last = buf[buf.length - 1]; if (lv === 'detail' && last && last.l === 'detail' && last.m === mod && last.x === e.x) return; // 같은 줄 반복은 생략
    buf.push(e); if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); pend.push(e); idbPend.push(e); dirty = true; };
  // 이 PC 보관 (5초마다), Firebase (1분마다, 10분 단위 문서)
  setInterval(() => { if (pend.length > 5000) pend.splice(0, pend.length - 5000); jflush().catch(() => {}); }, 20000); addEventListener('beforeunload', () => { jflush(); });
  const upNow = async () => { if (!pend.length || !window.firebase || !firebase.apps.length || !firebase.auth().currentUser) return; const out = pend.splice(0, pend.length);
    const groups = {}; out.forEach((e) => { const k = new Date(e.t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, ''); (groups[k] = groups[k] || []).push(`${new Date(e.t + 9 * 3600e3).toISOString().slice(11, 19)} [${e.m}] ${e.l === 'err' ? '⚠ ' : e.l === 'warn' ? '! ' : e.l === 'detail' ? '· ' : ''}${e.x}`); });
    if (window.__rnLogDenied) return; for (const [k, lines] of Object.entries(groups)) { try { await firebase.firestore().collection('rn_logs').doc(`${pcName()}_${k}0`).set({ pc: pcName(), slot: k + '0', lines: firebase.firestore.FieldValue.arrayUnion(...lines), at: Date.now() }, { merge: true }); } catch (e) { if (/permission/i.test(e.code || e.message)) { window.__rnLogDenied = true; buf.push({ t: Date.now(), m: '기록', l: 'warn', x: 'Firebase에 기록을 못 올림 (규칙에 rn_logs 허용 필요) — 이 PC 안에는 계속 보관합니다' }); } else { pend.unshift(...out.slice(-3000)); } break; } } };
  setInterval(upNow, 60000);
  window.__rnFlush = async () => { try { await jflush(); } catch (e) {} try { await upNow(); } catch (e) {} }; // 탭을 닫기 직전 등: 남은 기록을 이 PC(IndexedDB)와 Firebase에 바로 저장
  // 크게 보는 기록 창
  const st = document.createElement('style'); st.textContent = `#rn-jw{position:fixed;left:12px;bottom:12px;z-index:2147483646;width:min(760px,calc(100vw - 360px));height:46vh;min-height:180px;background:#fff;border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none;flex-direction:column;font:12px/1.5 Consolas,'Malgun Gothic',monospace;resize:both;overflow:hidden}
  #rn-jw.on{display:flex} #rn-jw .h{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#2F5D50;color:#fff;font:600 12.5px system-ui,'Malgun Gothic';cursor:move;user-select:none} #rn-jw .h b{flex:1}
  #rn-jw .h button,#rn-jw .h select,#rn-jw .h input{font:12px system-ui,'Malgun Gothic';border:0;border-radius:5px;padding:3px 7px} #rn-jw .h input{width:120px}
  #rn-jw .b{flex:1;overflow:auto;padding:6px 8px;white-space:pre-wrap;word-break:break-all} #rn-jw .b div{border-bottom:1px solid #F1F3F2} #rn-jw .detail{color:#5B6B66} #rn-jw .info{color:#1E2B27;font-weight:600} #rn-jw .warn{color:#A8661B;font-weight:600} #rn-jw .err{color:#B0322A;font-weight:700} #rn-jw .ok{color:#2F7D4F;font-weight:600}
  #rn-jw .ov{padding:7px 10px;background:#F2F6F4;border-bottom:1px solid #D7E2DD;font:12.5px/1.5 system-ui,'Malgun Gothic'} #rn-jw .ov .ol{margin:1px 0} #rn-jw .ov .ol.now{margin-top:5px} #rn-jw .ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-jw .pb{height:9px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-jw .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-jw .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-jw .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-jw .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-jw .chip.now{background:#2F5D50;border-color:#2F5D50;color:#fff;font-weight:700} #rn-jw .chip.off{text-decoration:line-through;opacity:.6} #rn-jw .chip.skip{background:#FFF4E0;color:#A8661B} #rn-jw .chip.fail{background:#FDE8E6;color:#B0322A}
  #rn-jw .jt button{background:#24493F;color:#cfe3da;margin-left:2px} #rn-jw .jt button.on{background:#fff;color:#2F5D50;font-weight:700} #rn-jw details.jd{border-bottom:1px solid #E4ECE8} #rn-jw details.jd > summary{cursor:pointer;padding:4px 2px;font:600 12.5px system-ui,'Malgun Gothic';color:#2F5D50} #rn-jw details.jd > summary small{color:#8A9692;font-weight:400}
  #rn-jw .tm{color:#9AA5A1} #rn-jw .md{display:inline-block;min-width:34px;color:#2F5D50}`;
  const mount = () => { document.head.appendChild(st); const w = document.createElement('div'); w.id = 'rn-jw';
    w.innerHTML = `<div class="h"><b title="이 띠를 잡고 끌어서 옮김 · 두 번 누르면 처음 자리로 · 오른쪽 아래 모서리로 크기 조절">⠿ 작업 기록 — ${pcName()}</b><span class="jt"><button data-jt="today" class="on" title="이 화면을 연(새로고침한) 뒤의 기록">이번 화면</button><button data-jt="hist" title="날짜별로 쌓인 모든 기록 (오늘 포함)">전체 기록</button></span><select id="rnjF"><option value="imp">중요만</option><option value="all" selected>전체 (항목마다)</option><option value="err">오류·경고만</option></select><input id="rnjQ" placeholder="검색"><label style="font-weight:400"><input type="checkbox" id="rnjA" checked> 자동 스크롤</label><button id="rnjD" title="모든 기록(오늘+지난)을 파일로 받고, 이 PC의 기록을 비웁니다">내려받기·비우기</button><button id="rnjX">닫기</button></div><div class="ov" id="rnjO"></div><div class="b" id="rnjB"></div>`;
    document.body.appendChild(w); let lastDrawn = -1;
    // 위쪽 초록 띠를 잡고 끌어서 옮김. 위치·크기는 기억 (화면 밖으로 나가지 않게)
    const place = () => { const g = GM_getValue('rnu-jw-geo', null); if (!g) return; const W = Math.min(g.w || 760, innerWidth - 20), H = Math.min(g.h || 360, innerHeight - 20);
      w.style.width = W + 'px'; w.style.height = H + 'px'; w.style.left = Math.max(0, Math.min(g.x, innerWidth - 120)) + 'px'; w.style.top = Math.max(0, Math.min(g.y, innerHeight - 40)) + 'px'; w.style.bottom = 'auto'; };
    const save = () => { const r = w.getBoundingClientRect(); GM_setValue('rnu-jw-geo', { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }); };
    place(); addEventListener('resize', place);
    w.querySelector('.h').addEventListener('mousedown', (ev) => { if (ev.target.closest('button,select,input,label') || ev.button !== 0) return; ev.preventDefault();
      const r = w.getBoundingClientRect(); const dx = ev.clientX - r.left, dy = ev.clientY - r.top; w.style.bottom = 'auto';
      const mv = (e) => { w.style.left = Math.max(0, Math.min(e.clientX - dx, innerWidth - 120)) + 'px'; w.style.top = Math.max(0, Math.min(e.clientY - dy, innerHeight - 40)) + 'px'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); save(); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); });
    w.addEventListener('mouseup', (ev) => { if (!ev.target.closest('.h')) save(); }); // 오른쪽 아래 모서리로 크기를 바꾼 뒤에도 기억
    w.querySelector('.h').addEventListener('dblclick', (ev) => { if (ev.target.closest('button,select,input,label')) return; GM_setValue('rnu-jw-geo', null); w.removeAttribute('style'); }); // 띠를 두 번 누르면 처음 자리로
    let tab = 'today'; const fmtRow = (e) => `<div class="${e.l}"><span class="tm">${new Date(e.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> <span class="md">${e.m}</span> ${String(e.x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`;
    const pass = (e) => { const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim(); return (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || String(e.x).includes(q)); };
    const drawHist = async () => { const b = w.querySelector('#rnjB'); b.innerHTML = '<div class="detail">불러오는 중</div>'; let keys = []; try { await jflush(); keys = (await jdays()).sort().reverse(); } catch (e) {}
      b.innerHTML = keys.map((k) => `<details class="jd" data-day="${k}"><summary>${k}${k === day(new Date()) ? ' (오늘)' : ''} <small>펼쳐서 보기</small></summary><div class="jdb"></div></details>`).join('') || '<div class="detail">쌓인 기록 없음</div>';
      b.querySelectorAll('details.jd').forEach((d) => (d.ontoggle = async () => { if (!d.open) return; const rec = await jgetDay(d.dataset.day); const L = (rec && rec.lines) || []; const rows = L.filter(pass); d.querySelector('summary small').textContent = `${L.length.toLocaleString()}줄 · 오류 ${L.filter((e) => e.l === 'err').length} · 경고 ${L.filter((e) => e.l === 'warn').length}${rows.length !== L.length ? ` · 거른 결과 ${rows.length.toLocaleString()}줄` : ''}`; d.querySelector('.jdb').innerHTML = rows.slice(-5000).map(fmtRow).join('') || '<div class="detail">없음</div>'; })); };
    w.querySelectorAll('[data-jt]').forEach((bt) => (bt.onclick = () => { tab = bt.dataset.jt; w.querySelectorAll('[data-jt]').forEach((x) => x.classList.toggle('on', x === bt)); lastDrawn = -1; if (tab === 'hist') drawHist(); else draw(); }));
    const draw = () => { if (!w.classList.contains('on') || tab !== 'today') return; const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim();
      const rows = buf.filter((e) => (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || e.x.includes(q))).slice(-3000);
      const b = w.querySelector('#rnjB'); b.innerHTML = rows.map((e) => `<div class="${e.l}"><span class="tm">${new Date(e.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> <span class="md">${e.m}</span> ${e.x.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('') || '<div class="detail">기록 없음</div>';
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; lastDrawn = buf.length; };
    // ── 맨 위 요약: 지금 무엇을, 전체 중 어디까지 (1초마다)
    const fm = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`; };
    const ov = w.querySelector('#rnjO');
    const drawOv = () => { if (!w.classList.contains('on')) return; const S = window.__rnStatus || {}; const c = S.chain; const cur = S.cur || {}; const crm = S.crm;
      const bar = (p, col) => `<div class="pb"><i style="width:${Math.max(0, Math.min(100, p * 100)).toFixed(1)}%;background:${col || '#2F5D50'}"></i></div>`;
      const curFrac = (x) => (x && x.total ? Math.min(1, (x.done || 0) / x.total) : 0);
      const crmBusy = !!(window.__rnCrm && window.__rnCrm.busy()); if (!S.job && !crmBusy) { ov.innerHTML = `<div class="ol"><b>쉬는 중</b>${S.lastEnd ? ` · 마지막 작업 '${S.lastEnd.name}' ${new Date(S.lastEnd.at).toLocaleTimeString('ko-KR')} 끝 (${fm(S.lastEnd.ms)})` : ''}</div>`; return; }
      let h = `<div class="ol"><b>${S.job || '고객·주문 수집'}</b> · 시작 ${S.jobStart ? new Date(S.jobStart).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'} · ${S.jobStart ? fm(Date.now() - S.jobStart) + '째' : ''}</div>`;
      if (c && c.order) { const on = c.order.filter((k) => c.on[k]); const di = on.filter((k) => c.res[k] === 'done' || c.res[k] === 'skip-busy').length; const isCrmJob = S.job === '고객 전체 일괄 수집'; const inCur = c.cur && c.on[c.cur] ? (c.cur === 'crm' || isCrmJob ? curFrac(crm) : curFrac(cur)) : 0; const all = on.length ? (di + inCur) / on.length : 0;
        h += `<div class="ol">전체 ${di}/${on.length}단계 · ${(all * 100).toFixed(1)}%</div>${bar(all)}<div class="chips">${c.order.map((k, i) => { const st = !c.on[k] ? 'off' : c.res[k] === 'done' ? 'done' : c.res[k] === 'skip-busy' ? 'skip' : c.res[k] === 'fail' ? 'fail' : k === c.cur ? 'now' : 'wait';
          return `<span class="chip ${st}" title="${c.labels[k]}${st === 'off' ? ' (끔)' : st === 'skip' ? ' (다른 PC가 하는 중이라 건너뜀)' : ''}">${st === 'done' ? '✓' : st === 'now' ? '▶' : st === 'off' ? '–' : st === 'skip' ? '↷' : st === 'fail' ? '✗' : i + 1} ${c.labels[k]}</span>`; }).join('')}</div>`; }
      if (S.sub && S.sub.order) { const sb = S.sub; h += `<div class="chips" style="margin-left:14px"><span style="font-size:11px;color:#5B6B66">고객 세부:</span>${sb.order.map((k) => { const st = sb.res[k] === 'done' ? 'done' : k === sb.cur ? 'now' : 'wait'; return `<span class="chip ${st}">${st === 'done' ? '✓' : st === 'now' ? '▶' : ''} ${sb.labels[k]}</span>`; }).join('')}</div>`; }
      const x = (c && c.cur === 'crm') || (S.job === '고객 전체 일괄 수집') ? crm : cur;
      if (x && (x.state || x.label)) h += `<div class="ol now">지금: <b>${x.state || x.label}</b>${x.total ? ` · ${(+x.done || 0).toLocaleString()} / ${(+x.total).toLocaleString()} (${(curFrac(x) * 100).toFixed(1)}%)` : ''}${x.etaMin != null ? ` · 남은 시간 약 ${fm(x.etaMin * 60000)} (끝 ${new Date(Date.now() + x.etaMin * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})` : ''}</div>${x.total ? bar(curFrac(x), '#3F7FD1') : ''}${x.sub ? `<div class="ol sub">${String(x.sub).replace(/</g, '&lt;')}</div>` : ''}`;
      ov.innerHTML = h; };
    setInterval(drawOv, 1000);
    setInterval(() => { if (buf.length !== lastDrawn) draw(); }, 1000); // 진행을 늦추지 않게 1초에 한 번만 그림
    ['#rnjF', '#rnjQ'].forEach((q) => (w.querySelector(q).oninput = () => (tab === 'hist' ? drawHist() : draw()))); w.querySelector('#rnjX').onclick = () => { w.classList.remove('on'); GM_setValue('rnu-jw', 0); };
  // 구글 드라이브로 바로 저장 (설정 ⑨에 Apps Script 주소·열쇠가 있으면). 실패하면 PC로 내려받기
  const driveSave = (name, content) => new Promise((res) => { const url = GM_getValue('rnu-drive-url', ''), key = GM_getValue('rnu-drive-key', ''); if (!url) return res(null);
    GM_xmlhttpRequest({ method: 'POST', url, data: JSON.stringify({ key, name, content }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, timeout: 120000, onload: (r) => { try { const j = JSON.parse(r.responseText); res(j && j.ok ? j : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); });
    w.querySelector('#rnjD').onclick = async () => { // 모든 날짜를 한 파일로 받고, 이 PC의 기록을 비움 (Firebase에 올라간 기록은 그대로)
      if (!confirm('이 PC의 모든 작업 기록(오늘 + 지난 기록)을 파일로 내려받은 뒤, 이 PC에서 비웁니다. 계속할까요?')) return;
      await jflush(); const keys = (await jdays()).sort(); const parts = []; for (const k of keys) { const rec = await jgetDay(k); (rec ? rec.lines : []).forEach((e) => parts.push(`${new Date(e.t).toLocaleString('ko-KR')} [${e.m}] [${e.l}] ${e.x}`)); }
      const fname = `리드나우-수집기록-${pcName()}-${keys[0] || day(new Date())}~${keys[keys.length - 1] || day(new Date())}.txt`; const drv = await driveSave(fname, parts.join('\n'));
      if (drv) { window.__rnLog('수집기', 'ok', `작업 기록을 구글 드라이브 '리드나우 수집기록' 폴더에 저장했습니다: ${fname}${drv.url ? ' · ' + drv.url : ''}`); if (drv.url) window.open(drv.url, '_blank'); }
      else { window.__rnLog('수집기', 'warn', GM_getValue('rnu-drive-url', '') ? '구글 드라이브 저장 실패 (주소·열쇠·배포 권한 확인) — PC의 다운로드 폴더로 내려받습니다' : '구글 드라이브 주소가 설정되지 않아 PC의 다운로드 폴더로 내려받습니다 (웹앱 설정 ⑨)'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([parts.join('\n')], { type: 'text/plain' })); a.download = fname; a.click(); }
      setTimeout(async () => { await jclear(); buf.length = 0; idbPend.length = 0; window.__rnLog('수집기', 'info', `작업 기록을 내려받고 이 PC의 기록을 비웠습니다 (${keys.length}일치, ${parts.length.toLocaleString()}줄)`); lastDrawn = -1; tab === 'hist' ? drawHist() : draw(); }, 1500); };
    window.__rnJournalToggle = () => { const on = !w.classList.contains('on'); w.classList.toggle('on', on); GM_setValue('rnu-jw', on ? 1 : 0); lastDrawn = -1; draw(); drawOv(); };
    if (GM_getValue('rnu-jw', 0)) window.__rnJournalToggle(); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  window.addEventListener('error', (ev) => window.__rnLog('오류', 'err', `${ev.message} (${(ev.filename || '').split('/').pop()}:${ev.lineno})`));
  window.addEventListener('unhandledrejection', (ev) => window.__rnLog('오류', 'err', `처리되지 않은 오류: ${ev.reason && ev.reason.message ? ev.reason.message : ev.reason}`));
  window.__rnLog('수집기', 'info', `탭 열림 · ${location.pathname.split('/').pop()}`);
})();
(function rnShell() {
  if (window.top !== window || !/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname)) return;
  const st = document.createElement('style');
  // 오른쪽 위 한 자리 = 리드나우 패널들의 탭 묶음. 탭 하나만 펼쳐짐 (가격 감시기 같은 다른 스크립트도 data-t 버튼과 패널을 붙여 같은 자리를 씀)
  st.textContent = `#rn-uni{position:fixed;top:8px;right:12px;z-index:2147483647;width:400px;display:flex;gap:4px;font:600 12.5px/1 system-ui,'Malgun Gothic',sans-serif}
  #rn-uni button{flex:1;padding:8px 6px;border:1px solid #2F5D50;border-radius:8px;background:#fff;color:#2F5D50;cursor:pointer}#rn-uni button.on{background:#2F5D50;color:#fff}
  #rn-uni small{font-weight:400;opacity:.8}
  #rn-crm,#rnp{top:46px !important;max-height:calc(100vh - 56px) !important}
  #rn-crm,#rnp,#rn-prc{top:46px !important;right:12px !important;width:310px !important;max-height:calc(100vh - 56px) !important}
  body:not([data-rnu="prd"]) #rnp{display:none !important}body:not([data-rnu="crm"]) #rn-crm{display:none !important}body:not([data-rnu="prc"]) #rn-prc{display:none !important}
  #rn-uni .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:4px;vertical-align:1px;background:#bbb}`;
  document.head.appendChild(st);
  const bar = document.createElement('div'); bar.id = 'rn-uni';
  const set = (t) => { document.body.dataset.rnu = t; GM_setValue('rnu-tab', t); bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); };
  bar.innerHTML = '<button data-all="1" style="flex:0 0 auto;background:#2F5D50;color:#fff" title="고객·주문부터 구매자 분포까지 켜 둔 단계를 차례로">▶ 모두</button><button data-t="crm">고객·주문</button><button data-t="prd">상품·매입</button><button data-log="1" title="작업 기록 크게 보기" style="flex:0 0 auto">기록</button><button data-t="hide" title="패널 숨기기" style="flex:0 0 30px">–</button>';
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.log) { window.__rnJournalToggle && window.__rnJournalToggle(); return; } if (b.dataset.all) { if (!window.__rnPrd) return alert('수집기가 아직 준비 중입니다. 잠시 뒤 눌러 주세요'); if (window.__rnPrd.busy() || (window.__rnCrm && window.__rnCrm.busy())) return alert('이미 작업 중입니다'); window.__rnResumeOk && window.__rnResumeOk(); set('prd'); window.__rnPrd.runJob('chain'); return; } set(b.dataset.t); });
  const go = () => { document.body.appendChild(bar); const def = /wrecord_edit/i.test(location.pathname) ? 'prd' : 'crm'; const saved = GM_getValue('rnu-tab', def); set(saved);
    if (saved !== 'crm' && saved !== 'prd' && saved !== 'hide') setTimeout(() => { if (!bar.querySelector(`button[data-t="${saved}"]`)) set(def); }, 4000); }; // 다른 스크립트의 탭이 안 붙으면 기본 탭으로
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* ═════════════ 고객·주문 (예전 고객 수집기) ═════════════ */


(async function () {
  'use strict';
  const APP_VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '1.37.0'; // (1.36.0) 판 번호는 맨 위 @version 한 곳 — 고객 쪽·상품 쪽이 같은 값
  const BASE = 'https://www.aladin.co.kr/scm/';
  const now = () => new Date().toISOString();
  const LOGIN_FLAG = 'rn-autologin-pending';

  /* ════════════════════════════════════════════════════════════
   * A. 로그인 페이지에서 동작하는 부분 (자동 재로그인)
   *    수집기가 로그인 풀림을 감지해 이 탭을 열었을 때만 동작한다.
   * ════════════════════════════════════════════════════════════ */
  const pwInput = [...document.querySelectorAll('input[type="password"]')].find((i) => i.offsetParent !== null || i.getClientRects().length);
  const flag = GM_getValue(LOGIN_FLAG, null);
  if (flag && Date.now() - flag.at < 3 * 60 * 1000) {
    if (pwInput) { await autoFillLogin(pwInput, flag); return; }
    if (flag.submittedAt) { GM_setValue(LOGIN_FLAG, { ...flag, result: 'maybe-ok', landedAt: Date.now(), landedUrl: location.href }); }
  }
  /* ════════════════════════════════════════════════════════════
   * C. 알라딘 화면의 고객 정보 (웹앱과 같은 내용)
   *    · 주문 상세 팝업: 고객 카드 전체
   *    · 판매관리·주문조회 목록: 주문번호 옆에 고객 표시(VIP·주의·블랙리스트·불만족·판매자 일치·재구매), 누르면 카드
   *    웹앱에 고객 기능이 추가되면 이 카드에도 함께 반영한다.
   * ════════════════════════════════════════════════════════════ */
  const RN_APP_URL = 'https://jerrycson.github.io/readnow-scripts/app/';
  const RN_FB_CONFIG = { apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' };
  const CARD = (() => {
    const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const won = (n) => (n == null ? '-' : `${Math.round(n).toLocaleString('ko-KR')}원`);
    const d10 = (s) => (s ? String(s).slice(0, 10) : '-');
    const CFG0 = { vip: { minValue: 65, maxRisk: 25, minOrders: 3, excludeSellers: true }, caution: { minRisk: 35 } };
    let cfg = CFG0; let cfgAt = 0;
    const FBx = () => { const F = (typeof firebase !== 'undefined' && firebase) || window.firebase; if (F && !F.apps.length) F.initializeApp(RN_FB_CONFIG); return F; };
    const user = () => new Promise((r) => { const F = FBx(); if (!F) return r(null); if (F.auth().currentUser) return r(F.auth().currentUser); let un = null; un = F.auth().onAuthStateChanged((u) => { setTimeout(() => { if (typeof un === 'function') un(); }, 0); r(u); }); });
    async function loadCfg(db) { if (Date.now() - cfgAt < 5 * 60000) return cfg; try { const d = await db.collection('crm_system').doc('scoring').get(); const x = d.exists ? d.data() : {}; cfg = { vip: { ...CFG0.vip, ...(x.vip || {}) }, caution: { ...CFG0.caution, ...(x.caution || {}) } }; cfgAt = Date.now(); } catch (e) {} return cfg; }
    const strongSel = (c) => (c.sellerLinks || []).filter((x) => (x.level ? x.level === 'match' : x.strong !== false));
    function eff(c, k) {
      const m = (c.flags || {})[k];
      if (m && (m.on === true || m.on === false)) return { on: m.on, src: 'manual', reason: m.reason || '', by: m.byName || m.by || '' };
      const sc = c.scores;
      if (k === 'vip' && sc) { const v = cfg.vip; const on = sc.value >= v.minValue && sc.risk < v.maxRisk && (c.saleOrderCount || 0) >= v.minOrders && !(v.excludeSellers && strongSel(c).length); if (on) return { on, src: 'auto', reason: `가치 ${sc.value}점 · 주의 ${sc.risk}점` }; }
      if (k === 'caution' && sc && sc.risk >= cfg.caution.minRisk) { const top = (sc.riskParts || []).filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 2).map((x) => `${x.label}: ${x.text}`); return { on: true, src: 'auto', reason: `주의 ${sc.risk}점 · ${top.join(' / ')}` }; }
      if (k === 'blacklist' && c.sheetFlags && c.sheetFlags.blacklist) return { on: true, src: 'sheet', reason: c.sheetFlags.blacklist.reason || '' };
      return { on: false };
    }
    // 여러 고객을 한 번에: 고객 문서 + 구매평 + 메모
    async function loadBundles(db, cids) {
      const out = new Map(); const ids = [...new Set(cids.filter(Boolean))]; if (!ids.length) return out;
      const FP = FBx().firestore.FieldPath.documentId();
      for (let i = 0; i < ids.length; i += 30) {
        const part = ids.slice(i, i + 30);
        const [cs, is, ns] = await Promise.all([db.collection('crm_customers').where(FP, 'in', part).get(), db.collection('crm_interactions').where('customerId', 'in', part).get(), db.collection('crm_notes').where('customerId', 'in', part).get()]);
        part.forEach((id) => out.set(id, { c: null, reviews: [], qna: [], notes: [] }));
        cs.forEach((d) => { out.get(d.id).c = { customerId: d.id, ...d.data() }; });
        is.forEach((d) => { const v = d.data(); const b = out.get(v.customerId); if (!b) return; if (v.type === 'review') b.reviews.push(v); else if (v.type === 'qna') b.qna.push(v); else b.notes.push({ ...v, sheet: true }); });
        ns.forEach((d) => { const v = d.data(); const b = out.get(v.customerId); if (b) b.notes.push(v); });
      }
      await attachSellerScores(db, out);
      return out;
    }
    // 연결된 판매자의 모범·우리 이득 (웹앱·판매자 툴팁과 같은 파일 readnow-sellers-core.js로 계산 → 세 곳 점수가 항상 같음)
    const RSx = () => (typeof ReadnowSellers !== 'undefined' && ReadnowSellers) || window.ReadnowSellers || globalThis.ReadnowSellers || null;
    const sellerCache = new Map(); let sThr = null;
    async function attachSellerScores(db, out) {
      const RS = RSx(); if (!RS) return;
      if (!sThr) { try { const d = await db.collection('app_settings').doc('main').get(); sThr = (d.exists && d.data().seller) || {}; } catch (e) { sThr = {}; } }
      const names = new Set(); out.forEach((b) => ((b && b.c && b.c.sellerLinks) || []).forEach((x) => x.name && names.add(x.name)));
      const need = [...names].filter((n) => !sellerCache.has(n));
      for (let i = 0; i < need.length; i += 30) {
        const part = need.slice(i, i + 30); part.forEach((n) => sellerCache.set(n, null));
        try { const ss = await db.collection('sellers').where('name', 'in', part).get(); ss.forEach((d) => { const v = { ...d.data(), _id: d.id }; const cur = sellerCache.get(v.name); if (!cur || (d.id.startsWith('sc_') && !String(cur._id).startsWith('sc_'))) sellerCache.set(v.name, v); }); } catch (e) {}
      }
      for (const n of names) {
        const s = sellerCache.get(n); if (!s || s._score) continue;
        let bought = 0; const L = (s.linkedCustomers || []).filter((l) => RS.linkLevel(l) === 'match').slice(0, 10);
        if (L.length) { try { const FP = FBx().firestore.FieldPath.documentId(); const cs = await db.collection('crm_customers').where(FP, 'in', L.map((l) => l.customerId)).get(); cs.forEach((d) => (bought += d.data().salesAmount || 0)); } catch (e) {} }
        s._score = RS.score(s, { bought, thresholds: sThr });
      }
      out.forEach((b) => { if (b) b.sellerScore = (name) => { const s = sellerCache.get(name); return s ? s._score : null; }; });
    }
    function sellerBadges(b, name) {
      const RS = RSx(); const x = b && b.sellerScore ? b.sellerScore(name) : null; if (!RS || !x) return '';
      const q = RS.quadrant(x);
      return ` <i class="rnsm ${x.mcls}" title="모범: 배울 만한가">${x.mcls === 'bad' ? '✕' : x.mcls === 'good' ? '★' : '☆'} ${RS.MODEL_TXT[x.mcls]}${x.model != null ? ' ' + x.model : ''}</i> <i class="rnsg ${x.gcls}" title="우리 이득: 우리 돈에 이득인가${q ? ' · ' + q : ''}">₩${x.gcls === 'good' ? '＋' : x.gcls === 'bad' ? '－' : '·'} ${(RS.GAIN_SHORT || RS.GAIN_TXT)[x.gcls]} ${x.gain}</i>${q ? `<span class="s" style="display:block;font-weight:normal">${esc(q)}</span>` : ''}`;
    }
    const tsMs = (t) => (t && t.toMillis ? t.toMillis() : typeof t === 'string' ? Date.parse(t) || 0 : t && t.seconds ? t.seconds * 1000 : 0);
    function reviewCounts(b) { const r = { good: 0, mid: 0, bad: 0 }; b.reviews.forEach((x) => { const k = { 만족: 'good', 보통: 'mid', 불만족: 'bad' }[String(x.rating || '').trim()]; if (k) r[k] += 1; }); return r; }
    function badges(b) {
      if (!b || !b.c) return '<span class="rnb rnb-none">기록 없음</span>';
      const c = b.c; const rc = reviewCounts(b); const out = [];
      if (eff(c, 'blacklist').on) out.push('<span class="rnb rnb-bl">블랙리스트</span>');
      if (eff(c, 'caution').on) out.push('<span class="rnb rnb-cau">주의</span>');
      if (eff(c, 'vip').on) out.push('<span class="rnb rnb-vip">VIP</span>');
      if (rc.bad) out.push(`<span class="rnb rnb-bl">불만족 ${rc.bad}</span>`);
      if (strongSel(c).length) out.push('<span class="rnb rnb-bl">판매자 정보 일치</span>');
      else if ((c.otherRecipientCount || 0) >= 3) out.push(`<span class="rnb rnb-cau">수령인 ${c.otherRecipientCount}명</span>`);
      out.push((c.saleOrderCount || 0) > 1 ? `<span class="rnb rnb-rep">재구매 ${c.saleOrderCount}회</span>` : '<span class="rnb rnb-new">첫 구매</span>');
      return out.join('');
    }
    function cardHtml(b, cid) {
      if (!b || !b.c) return `<b>리드나우 고객 정보</b><div class="s">처음 주문한 고객이거나 아직 수집 전입니다.</div><div class="act"><a href="${RN_APP_URL}#c=${encodeURIComponent(cid)}" target="_blank">웹앱에서 메모 남기기</a></div>`;
      const c = b.c; const rc = reviewCounts(b); const sc = c.scores;
      const fl = [['blacklist', '블랙리스트', 'bl'], ['caution', '주의고객', 'ag'], ['vip', 'VIP', 'vip']].map(([k, l, cls]) => { const e = eff(c, k); return e.on ? `<div class="ban ${cls}">${l} <span class="src">(${{ manual: '직접', auto: '자동', sheet: '구글 시트' }[e.src]}${e.by ? ' · ' + esc(e.by) : ''})</span>${e.reason ? ': ' + esc(e.reason.slice(0, 90)) : ''}</div>` : ''; }).join('');
      const sl = c.sellerLinks || []; const slm = strongSel(c); const sls = sl.filter((x) => !slm.includes(x));
      const notes = b.notes.slice().sort((a, x) => tsMs(x.createdAt) - tsMs(a.createdAt)).slice(0, 5);
      const lowRv = b.reviews.filter((x) => String(x.rating).trim() !== '만족').sort((a, x) => String(x.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 3);
      return `<b>${esc(c.displayName || '')}</b> <span class="s">${d10(c.firstOrderAt)} ~ ${d10(c.lastOrderAt)}</span>
        ${fl}
        ${slm.length ? `<div class="ban bl">판매자 정보 일치: ${slm.map((x) => esc(x.name) + (x.aladinGrade ? ` <i class="gr">${esc(x.aladinGrade)}</i>` : '') + (x.grade === 'fake' ? ' (허위 매물)' : '') + sellerBadges(b, x.name)).join(', ')}</div>` : ''}
        ${sls.length ? `<div class="ban ag">판매자 일치 의심: ${sls.map((x) => esc(x.name) + sellerBadges(b, x.name)).join(', ')}</div>` : ''}
        ${(c.otherRecipientCount || 0) >= 3 ? `<div class="ban ag">대행 의심: 다른 수령인 ${c.otherRecipientCount}명</div>` : ''}
        <div class="n"><div><b>${c.saleOrderCount || 0}</b><span>주문</span></div><div><b>${(c.saleItemQty || 0).toLocaleString()}</b><span>권</span></div><div><b>${(c.salesAmount || 0).toLocaleString()}</b><span>순매출</span></div><div><b>${(c.cancelOrderCount || 0) + (c.returnCount || 0)}</b><span>취소·반품</span></div><div><b>${c.reviewCount || 0}</b><span>구매확정</span></div></div>
        <div class="s">구매평 <i class="rv g">만족 ${rc.good}</i> <i class="rv m">보통 ${rc.mid}</i> <i class="rv b">불만족 ${rc.bad}</i> · 문의 ${c.qnaCount || b.qna.length || 0}건</div>
        ${sc ? `<div class="s">점수: 가치 <b style="color:#2F5D50">${sc.value}</b> · 주의 <b style="color:#A8661B">${sc.risk}</b> (${esc(sc.day || '')})</div>` : ''}
        <div class="s">배송비: 무료배송 ${c.freeShipCount || 0}회(우리 부담) · 고객 부담 ${c.paidShipCount || 0}회 ${won(c.shipPaidTotal || 0)}</div>
        ${lowRv.length ? `<ul>${lowRv.map((x) => `<li><i class="rv ${String(x.rating).trim() === '불만족' ? 'b' : 'm'}">${esc(x.rating)}</i> ${esc(d10(x.createdAt))} ${esc(x.title || '')}${x.body ? ` “${esc(String(x.body).slice(0, 60))}”` : ''}</li>`).join('')}</ul>` : ''}
        ${notes.length ? `<ul>${notes.map((n) => `<li>${n.type === 'flag' ? `[${{ vip: 'VIP', caution: '주의', blacklist: '블랙리스트' }[n.flag] || n.flag} ${n.on === true ? '지정' : n.on === false ? '해제' : '자동으로'}] ${esc(n.reason || '')}` : n.sheet ? `[시트] ${esc(n.body || '')}` : esc(n.body || '')} <span class="s">${esc(n.byName || '')}</span></li>`).join('')}</ul>` : ''}
        <div class="act"><textarea placeholder="메모 (모든 기기에 공유, 지울 수 없음)"></textarea>
          <div class="ab"><button data-rn="memo">메모 저장</button><button data-rn="vip">${eff(c, 'vip').on ? 'VIP 해제' : 'VIP'}</button><button data-rn="caution">${eff(c, 'caution').on ? '주의 해제' : '주의'}</button><button data-rn="blacklist">${eff(c, 'blacklist').on ? '블랙 해제' : '블랙리스트'}</button></div>
          <a href="${RN_APP_URL}#c=${encodeURIComponent(c.customerId)}" target="_blank">웹앱에서 전체 보기</a></div>`;
    }
    async function write(db, u, cid, kind, payload) {
      const F = FBx(); const TS = F.firestore.FieldValue.serverTimestamp(); const who = { by: u.email || '', byName: u.displayName || (u.email || '').split('@')[0] };
      const b = db.batch();
      if (kind === 'memo') b.set(db.collection('crm_notes').doc(), { customerId: cid, type: 'memo', body: payload.body, ...who, createdAt: TS, writerSchema: 6, via: 'aladin' });
      else {
        b.set(db.collection('crm_customers').doc(cid), { flags: { [kind]: { on: payload.on, ...who, at: TS, reason: payload.reason || null } }, uploadedAt: TS, writerSchema: 6 }, { merge: true });
        b.set(db.collection('crm_notes').doc(), { customerId: cid, type: 'flag', flag: kind, on: payload.on, reason: payload.reason || null, ...who, createdAt: TS, writerSchema: 6, via: 'aladin' });
      }
      await b.commit();
    }
    // 카드 상자에 동작 연결
    function bind(box, db, u, cid, b, reload) {
      box.querySelectorAll('[data-rn]').forEach((btn) => (btn.onclick = async () => {
        const k = btn.dataset.rn;
        try {
          if (k === 'memo') { const t = box.querySelector('textarea').value.trim(); if (!t) return; btn.disabled = true; await write(db, u, cid, 'memo', { body: t }); }
          else { const cur = b && b.c ? eff(b.c, k).on : false; const r = prompt(`${{ vip: 'VIP', caution: '주의고객', blacklist: '블랙리스트' }[k]} ${cur ? '해제' : '지정'} 사유 (기록으로 영구 보존됩니다)`); if (r === null) return; btn.disabled = true; await write(db, u, cid, k, { on: !cur, reason: r.trim() }); }
          await reload();
        } catch (e) { alert('저장 실패: ' + (e.code || e.message)); btn.disabled = false; }
      }));
    }
    const CSS = `.rncard{background:#fff;color:#1E2B28;border:1px solid #D6DDDA;border-top:4px solid #2F5D50;border-radius:8px;box-shadow:0 6px 20px rgba(30,43,40,.2);font:12px/1.5 "Malgun Gothic","Apple SD Gothic Neo",sans-serif;padding:8px 10px;width:290px;max-height:80vh;overflow:auto;text-align:left}
      .rncard b{font-size:13px} .rncard .x{float:right;border:0;background:none;cursor:pointer;color:#5B6B66;font-size:14px}
      .rncard .ban{margin:5px -10px 0;padding:5px 10px;font-weight:bold;font-size:11.5px} .rncard .bl{background:#FDECEA;color:#B0322A} .rncard .vip{background:#FBF3DC;color:#8A6D1D} .rncard .ag{background:#FFF4E5;color:#A8661B} .rncard .src{font-weight:normal;font-size:10.5px}
      .rncard .n{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;margin:6px 0 2px} .rncard .n b{display:block;font-size:12.5px} .rncard .n span{font-size:10px;color:#5B6B66}
      .rncard ul{margin:5px 0 0;padding:0;list-style:none;max-height:130px;overflow:auto} .rncard li{border-top:1px dashed #D6DDDA;padding:3px 0;font-size:11.5px}
      .rncard .s{color:#5B6B66;font-size:11px;margin-top:2px} .rncard i.rv{font-style:normal;font-weight:bold;border-radius:4px;padding:0 4px} .rncard i.g{background:#E6EFEB;color:#2F5D50} .rncard i.m{background:#FFF1D6;color:#9A6200} .rncard i.b{background:#FDECEA;color:#B0322A}
      .rncard i.gr{font-style:normal;background:#3F7FD1;color:#fff;border-radius:4px;padding:0 4px;font-size:10.5px}
      .rncard i.rnsm{font-style:normal;font-size:10.5px;padding:0 5px;border:1.5px solid #4B4E9E;border-radius:3px;background:#fff;color:#4B4E9E;white-space:nowrap} .rncard i.rnsm.bad{background:#3A3A3A;border-color:#3A3A3A;color:#fff} .rncard i.rnsm.mid,.rncard i.rnsm.na{border-color:#B9BAD6;color:#6E7098}
      .rncard i.rnsg{font-style:normal;font-size:10.5px;padding:0 6px;border-radius:999px;background:#EEF1F3;color:#56636C;white-space:nowrap} .rncard i.rnsg.good{background:#2F7D4F;color:#fff} .rncard i.rnsg.bad{background:#B0322A;color:#fff}
      .rncard .act{margin-top:6px;border-top:1px solid #D6DDDA;padding-top:6px} .rncard textarea{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #D6DDDA;border-radius:5px;font:inherit;padding:4px}
      .rncard .ab{display:flex;gap:4px;flex-wrap:wrap;margin:4px 0} .rncard .ab button{border:1px solid #2F5D50;background:#fff;color:#2F5D50;border-radius:5px;padding:3px 7px;font-size:11px;cursor:pointer} .rncard .ab button:first-child{background:#2F5D50;color:#fff}
      .rncard a{display:block;text-align:center;padding:4px;border:1px solid #2F5D50;border-radius:5px;color:#2F5D50;text-decoration:none;font-weight:bold}
      .rnb{display:inline-block;margin:0 0 0 3px;padding:0 5px;border-radius:4px;font:bold 11px "Malgun Gothic",sans-serif;cursor:pointer;vertical-align:middle;white-space:nowrap} .rnb-bl{background:#FDECEA;color:#B0322A} .rnb-cau{background:#FFF4E5;color:#A8661B} .rnb-vip{background:#FBF3DC;color:#8A6D1D} .rnb-rep{background:#E6EFEB;color:#2F5D50} .rnb-new{background:#EEF1F3;color:#56636C} .rnb-none{background:#F3F3F3;color:#999}
      .rnfloat{position:fixed;z-index:2147483646}`;
    function style() { if (document.getElementById('rn-card-css')) return; const st = document.createElement('style'); st.id = 'rn-card-css'; st.textContent = CSS; document.head.appendChild(st); }
    return { esc, FBx, user, loadCfg, loadBundles, badges, cardHtml, bind, style };
  })();

  // 주문번호 → 알라딘 고객번호: 이 PC에 모아 둔 주문 상세, 없으면 Firebase의 주문 기록
  async function customerIdsForOrders(db, onos) {
    const map = new Map(); const need = [];
    try {
      const idb = await new Promise((res) => { const r = indexedDB.open('readnow-crm'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
      if (idb && idb.objectStoreNames.contains('popups')) {
        await Promise.all(onos.map((o) => new Promise((res) => { const q = idb.transaction('popups').objectStore('popups').get(o); q.onsuccess = () => { const p = q.result; if (p && p.customerKey) map.set(o, `aladin_${p.customerKey}`); res(); }; q.onerror = () => res(); })));
      }
      if (idb) idb.close();
    } catch (e) {}
    onos.forEach((o) => { if (!map.has(o)) need.push(o); });
    const FP = CARD.FBx().firestore.FieldPath.documentId();
    for (let i = 0; i < need.length; i += 30) { const s = await db.collection('crm_orders').where(FP, 'in', need.slice(i, i + 30).map((o) => `aladin_${o}`)).get(); s.forEach((d) => { const v = d.data(); if (v.customerId) map.set(v.orderNo, v.customerId); }); }
    return map;
  }

  // ── 주문 상세 팝업: 카드 전체
  if (/\/scm\/wpopup_order\.aspx/i.test(location.pathname)) {
    const blk = document.querySelector('[data-custkey]'); if (!blk) return;
    const cid = `aladin_${blk.getAttribute('data-custkey')}`;
    CARD.style(); const box = document.createElement('div'); box.className = 'rncard rnfloat'; box.style.cssText = 'top:6px;right:6px'; box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">불러오는 중</div>'; document.body.appendChild(box);
    const F = CARD.FBx(); if (!F) { box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">Firebase를 불러오지 못했습니다</div>'; return; }
    const u = await CARD.user(); if (!u) { box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">판매관리·주문조회 화면의 수집기 패널에서 로그인하면 고객 정보가 보입니다.</div>'; return; }
    const db = F.firestore();
    const load = async () => { await CARD.loadCfg(db); const m = await CARD.loadBundles(db, [cid]); const b = m.get(cid); box.innerHTML = '<button class="x" title="닫기">×</button>' + CARD.cardHtml(b, cid); box.querySelector('.x').onclick = () => box.remove(); CARD.bind(box, db, u, cid, b, load); };
    try { await load(); } catch (e) { box.innerHTML = `<b>리드나우 고객 정보</b><div class="s">불러오기 실패: ${CARD.esc(e.code || e.message)}</div>`; }
    return;
  }

  // ── 판매관리·주문조회 목록: 주문번호 옆에 고객 표시, 누르면 카드
  if (/\/scm\/(worders|worder_preparatory_complete)\.aspx/i.test(location.pathname)) {
    (async () => {
      await new Promise((r) => setTimeout(r, 1200));
      const F = CARD.FBx(); if (!F) return; const u = await CARD.user(); if (!u) return;
      const db = F.firestore(); CARD.style();
      const links = [...document.querySelectorAll('a[onclick*="viewOrderDetail"], a[href*="viewOrderDetail"], a[href*="OrderDetail_Popup"], a[onclick*="OrderDetail_Popup"]')];
      const byOno = new Map(); links.forEach((a) => { const m = (a.getAttribute('onclick') || a.getAttribute('href') || '').match(/(\d{3}-[A-Z]\d{9})/); if (m && /^\d{3}-[A-Z]\d{9}$/.test(a.textContent.trim())) (byOno.get(m[1]) || byOno.set(m[1], []).get(m[1])).push(a); });
      if (!byOno.size) return;
      try {
        await CARD.loadCfg(db);
        const o2c = await customerIdsForOrders(db, [...byOno.keys()]);
        const bundles = await CARD.loadBundles(db, [...o2c.values()]);
        let open = null;
        for (const [ono, as] of byOno) {
          const cid = o2c.get(ono); const b = cid ? bundles.get(cid) : null;
          as.forEach((a) => {
            if (a.parentNode.querySelector(`.rn-bd[data-ono="${ono}"]`)) return;
            const span = document.createElement('span'); span.className = 'rn-bd'; span.dataset.ono = ono; span.innerHTML = CARD.badges(b); span.title = '눌러서 리드나우 고객 정보 보기';
            span.onclick = (ev) => {
              ev.preventDefault(); ev.stopPropagation(); if (open) open.remove();
              const box = document.createElement('div'); box.className = 'rncard rnfloat'; const r = span.getBoundingClientRect();
              box.style.left = Math.min(window.innerWidth - 310, r.left) + 'px'; box.style.top = Math.min(window.innerHeight - 200, r.bottom + 4) + 'px';
              const draw = async () => { if (cid) { const m = await CARD.loadBundles(db, [cid]); bundles.set(cid, m.get(cid)); } const bb = cid ? bundles.get(cid) : null; box.innerHTML = '<button class="x" title="닫기">×</button>' + CARD.cardHtml(bb, cid || ''); box.querySelector('.x').onclick = () => box.remove(); if (cid) CARD.bind(box, db, u, cid, bb, async () => { await draw(); span.innerHTML = CARD.badges(bundles.get(cid)); }); };
              draw(); document.body.appendChild(box); open = box;
            };
            a.insertAdjacentElement('afterend', span);
          });
        }
        document.addEventListener('click', (e) => { if (open && !open.contains(e.target) && !e.target.closest('.rn-bd')) { open.remove(); open = null; } });
      } catch (e) { console.warn('[리드나우] 목록 고객 표시 실패', e); }
    })();
  }

  if (!/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname) || window.top !== window) return; // 수집 패널: 주문조회·판매관리·상품 조회 화면 (통합 수집기)

  async function autoFillLogin(pw, fl) {
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') return;
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    if (!cred || !cred.id || !cred.pw) return;
    if (fl.submittedAt && Date.now() - fl.submittedAt < 60000) { // 제출했는데 다시 로그인 화면 = 실패
      GM_setValue(LOGIN_FLAG, { ...fl, result: 'failed', message: (document.body.innerText.match(/(아이디|비밀번호)[^\n]{0,60}/) || [''])[0] });
      return;
    }
    const form = pw.form || document;
    const idInput = [...form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])')].find((i) => i.getClientRects().length && i !== pw);
    if (!idInput) { GM_setValue(LOGIN_FLAG, { ...fl, result: 'no-id-field' }); return; }
    const setVal = (inp, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    setVal(idInput, cred.id); setVal(pw, cred.pw);
    // '로그인 상태 유지'가 있으면 체크 (끊김 자체를 줄임)
    [...document.querySelectorAll('input[type="checkbox"]')].forEach((c) => { const lab = (c.id && document.querySelector(`label[for="${c.id}"]`)) || c.closest('label') || c.parentElement; if (lab && /상태\s*유지|자동\s*로그인/.test(lab.textContent) && !c.checked) c.click(); });
    GM_setValue(LOGIN_FLAG, { ...fl, submittedAt: Date.now() });
    await new Promise((r) => setTimeout(r, 400));
    const btn = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],a')].find((b) => /^\s*로그인\s*$/.test(b.textContent || b.value || b.alt || '') || b.type === 'submit' || b.type === 'image');
    if (btn) btn.click(); else if (pw.form) pw.form.submit(); else pw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
  }

  /* ════════════════════════════════════════════════════════════
   * B. 수집기 (주문조회 페이지)
   * ════════════════════════════════════════════════════════════ */
  const P = (typeof ReadnowOrders !== 'undefined' && ReadnowOrders) || window.ReadnowOrders || globalThis.ReadnowOrders;
  if (!P) { alert('[리드나우 고객 수집기] 파서 파일(readnow-orders-core.js)을 불러오지 못했습니다. GitHub 주소를 확인해 주세요.'); return; }
  const NEED_CORE = '0.3.0';
  const verNum = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
  if (verNum(P.VERSION) < verNum(NEED_CORE)) alert(`[리드나우 고객 수집기] GitHub의 파서 파일이 옛 버전(${P.VERSION})입니다. ${NEED_CORE} 파일로 바꿔 올린 뒤 몇 분 기다렸다가 새로고침해 주세요.`);

  /* ── 저장소 (브라우저 IndexedDB) ── */
  const STORES = ['orderLines', 'popups', 'returns', 'qnaList', 'qnaDetail', 'reviews', 'jobs', 'issues', 'meta', 'uploaded', 'excelLines', 'sheetRows', 'sellerRaw'];
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('readnow-crm', 4);
    r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: '_key' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    r.onblocked = () => alert('[리드나우 고객 수집기] 예전 버전 수집기가 열린 다른 탭이 있어 저장소를 새 버전으로 바꿀 수 없습니다. 주문조회 탭을 모두 닫고 하나만 다시 열어 주세요.');
  });
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const dbGet = (s, k) => reqP(db.transaction(s).objectStore(s).get(k));
  const dbAll = (s) => reqP(db.transaction(s).objectStore(s).getAll());
  const dbCount = (s) => reqP(db.transaction(s).objectStore(s).count());
  const dbPut = (s, objs) => new Promise((res, rej) => {
    const t = db.transaction(s, 'readwrite'); const st = t.objectStore(s);
    (Array.isArray(objs) ? objs : [objs]).forEach((o) => st.put(o));
    t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
  const dbDelete = (s, keys) => new Promise((res, rej) => {
    const t = db.transaction(s, 'readwrite'); const st = t.objectStore(s);
    keys.forEach((k) => st.delete(k)); t.oncomplete = () => res(); t.onerror = () => rej(t.error);
  });
  const dbGetMany = async (s, keys) => { const m = new Map(); for (const k of keys) { const v = await dbGet(s, k); if (v) m.set(k, v); } return m; };

  /* ── 설정 (비밀번호는 IndexedDB·백업이 아닌 Tampermonkey 저장소에만) ── */
  const DEFAULTS = { remoteRun: true, billing: 'paid', dailyWriteCap: 200000, noCapUntil: '2026-12-29', shopSc: '996008', syncTooltip: true, autoRun: false, autoTime: '06:00', delayMin: 1500, delayMax: 3000, forceFull: false, autoLogin: true, stopAfterKnownPages: 2, maxLoginTries: 0, loginRetrySec: 60, autoUpload: true }; // maxLoginTries 0 = 무제한
  let settings = { ...DEFAULTS, ...((await dbGet('meta', 'settings')) || {}) }; delete settings._key;
  const saveSettings = () => dbPut('meta', { _key: 'settings', ...settings });

  /* ── 대기: 백그라운드 탭에서도 덜 느려지도록 워커 타이머 사용 (안 되면 일반 타이머) ── */
  let worker = null; const waiters = new Map(); let wseq = 0;
  try {
    worker = new Worker(URL.createObjectURL(new Blob(['onmessage=e=>setTimeout(()=>postMessage(e.data.id),e.data.ms)'], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const f = waiters.get(e.data); if (f) { waiters.delete(e.data); f(); } };
  } catch (e) { worker = null; }
  if (worker) { // 사이트 보안 정책으로 워커가 조용히 막히는 경우 대비: 1초 안에 응답 없으면 일반 타이머 사용
    const ok = await new Promise((r) => { const id = ++wseq; waiters.set(id, () => r(true)); worker.onerror = () => r(false); worker.postMessage({ id, ms: 1 }); setTimeout(() => r(false), 1000); });
    if (!ok) { try { worker.terminate(); } catch (e) {} worker = null; waiters.clear(); }
  }
  const sleep = (ms) => new Promise((r) => { if (worker) { const id = ++wseq; waiters.set(id, r); worker.postMessage({ id, ms }); } else setTimeout(r, ms); });

  /* ── 요청: 사람 속도 간격, 서버 불안정 시 길게 재시도, 로그인 풀림 시 자동 재로그인 ── */
  let lastReqAt = 0; const reqTimes = [];
  class StopSignal extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }
  const PACE_C = (window.ReadnowProducts || globalThis.ReadnowProducts).makePacer('aladin'); // 상품 수집·가격 감시와 같은 속도 조절 하나 (설정은 상품 수집기 설정의 '알라딘 요청 간격')
  async function politeWait() { await PACE_C.wait(sleep); lastReqAt = Date.now(); }
  function looksLoggedOut(finalUrl, doc, html) {
    if (/\/login\//i.test(finalUrl) || /wlogin/i.test(finalUrl)) return true;
    const pw = doc.querySelector('input[type="password"]');
    return !!pw && !/샵매니저/.test(doc.title || '');
  }
  const RETRY_WAITS = [5, 15, 45, 120, 300]; // 초. 이후로는 5분 간격
  const MAX_OUTAGE_MIN = 60; // 서버가 이 시간 넘게 계속 안 되면 일시정지
  async function fetchDoc(url, { expect } = {}) {
    let firstFailAt = null; let attempt = 0; let loginTries = 0;
    while (true) {
      checkPause(); await politeWait();
      try {
        const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 30000);
        const t0 = Date.now();
        const r = await fetch(url, { credentials: 'include', signal: ac.signal }); clearTimeout(to);
        if (!r.ok) { if (r.status === 429 || r.status === 503) { PACE_C.fail('429'); log(`알라딘이 요청이 너무 많다고 함(${r.status}) — 이 PC의 모든 수집이 ${Math.round(PACE_C.cooling() / 60000)}분 쉬고 간격 ${PACE_C.state().gap}ms로`, 'warn'); } throw new Error('서버 응답 ' + r.status); }
        const buf = await r.arrayBuffer();
        const cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
        let html = new TextDecoder(cs || 'utf-8').decode(buf);
        if (!cs) { const m = html.match(/<meta[^>]+charset=["']?([\w-]+)/i); if (m && !/utf-?8/i.test(m[1])) html = new TextDecoder(m[1]).decode(buf); }
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (looksLoggedOut(r.url, doc, html)) {
          loginTries += 1;
          const ml = GM_getValue('rnu-maxlogin', 6); const limit = ml > 0 ? ml : Infinity; // 설정 ⑨ (0 = 무제한, 기본 6)
          if (!settings.autoLogin) throw new StopSignal('LOGIN', '로그인이 풀렸습니다. 직접 로그인한 뒤 이어하기를 눌러 주세요.');
          if (loginTries > limit) throw new StopSignal('LOGIN', `자동 로그인을 ${limit}번 시도했지만 실패했습니다. 직접 로그인한 뒤 이어하기를 눌러 주세요.`);
          if (loginTries > 1) { log(`자동 로그인 ${loginTries}번째 시도 전 ${settings.loginRetrySec}초 기다립니다.`, 'warn'); setNow(`자동 로그인 재시도 대기: ${settings.loginRetrySec}초`); await sleep(settings.loginRetrySec * 1000); checkPause(); }
          PACE_C.fail('login'); await autoRelogin(r.url, loginTries); continue;
        }
        if (expect && !expect(doc)) throw new Error('페이지 내용이 예상과 다름 (서버 오류 화면일 수 있음)');
        PACE_C.ok(); reqTimes.push(Date.now() - t0 + PACE_C.state().gap); if (reqTimes.length > 30) reqTimes.shift();
        if (firstFailAt) log('서버 연결이 회복되어 계속합니다.', 'ok');
        return { doc, url: r.url };
      } catch (e) {
        if (e instanceof StopSignal) throw e;
        PACE_C.fail(e.name === 'AbortError' ? 'timeout' : 'error'); firstFailAt = firstFailAt || Date.now();
        if ((Date.now() - firstFailAt) / 60000 > MAX_OUTAGE_MIN) throw new Error(`알라딘 서버가 ${MAX_OUTAGE_MIN}분 넘게 응답하지 않아 멈췄습니다. 나중에 이어하기를 눌러 주세요.`);
        const w = RETRY_WAITS[Math.min(attempt, RETRY_WAITS.length - 1)]; attempt += 1;
        log(`요청 실패 (${e.name === 'AbortError' ? '응답 시간 초과' : e.message}). ${w}초 뒤 다시 시도합니다.`, 'warn');
        setNow(`서버 응답 대기 중: ${w}초 뒤 재시도 (${attempt}번째)`);
        await sleep(w * 1000);
      }
    }
  }

  async function isLoggedIn() {
    try { const r = await fetch(BASE + 'worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); return r.ok && !looksLoggedOut(r.url, d, h); } catch (e) { return false; }
  }
  async function autoRelogin(loginUrl, tryNo = 1) {
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') { setNow(`네이버로 다시 로그인 중 (${tryNo}번째)`); const ok = await window.__rnNaverLogin({ isLoggedIn, log: (m, lv) => log(m, lv === 'err' ? 'err' : lv ? 'warn' : 'ok'), stopped: () => pauseRequested, ret: BASE + 'worders.aspx' }); if (!ok && tryNo >= 2) throw new StopSignal('LOGIN', '네이버로 다시 로그인하지 못했습니다. 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)한 뒤 이어하기를 눌러 주세요.'); return ok; }
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    if (!cred || !cred.id || !cred.pw) throw new StopSignal('LOGIN', '로그인이 풀렸습니다. 설정에 아이디·비밀번호를 넣으면 다음부터 자동으로 다시 로그인합니다. 지금은 직접 로그인한 뒤 이어하기를 눌러 주세요.');
    log(tryNo > 1 ? `자동 로그인 ${tryNo}번째 시도` : '로그인이 풀려 자동으로 다시 로그인합니다.', 'warn'); setNow(`자동 로그인 중 (${tryNo}번째)`);
    let url = /login/i.test(loginUrl) ? loginUrl : null;
    if (!url) { try { const r = await fetch(BASE + 'worders.aspx', { credentials: 'include' }); if (/login/i.test(r.url)) url = r.url; } catch (e) {} }
    url = url || 'https://www.aladin.co.kr/login/wlogin.aspx?returnurl=' + encodeURIComponent(BASE + 'worders.aspx');
    GM_setValue(LOGIN_FLAG, { at: Date.now() });
    const tab = GM_openInTab(url, { active: false, insert: true });
    let ok = false;
    for (let i = 0; i < 18; i++) { // 최대 90초
      await sleep(5000);
      if (pauseRequested) break;
      const f = GM_getValue(LOGIN_FLAG, {});
      if (f.result === 'failed' || f.result === 'no-id-field') break;
      if (await isLoggedIn()) { ok = true; break; }
    }
    try { tab.close(); } catch (e) {}
    GM_deleteValue(LOGIN_FLAG);
    if (!ok) log('자동 로그인이 이번에는 되지 않았습니다.', 'warn');
    else log('다시 로그인했습니다. 수집을 계속합니다.', 'ok');
    return ok;
  }

  /* ── 작업 상태 (이어하기) ── */
  let running = false; let pauseRequested = false; let currentTask = null;
  function checkPause() { if (pauseRequested) throw new StopSignal('PAUSED', '일시정지했습니다.'); }
  async function loadJob(name) { return (await dbGet('jobs', name)) || { _key: name, status: 'idle' }; }
  const saveJob = (job) => { job.updatedAt = now(); return dbPut('jobs', job); };
  async function addIssue(type, key, detail) { await dbPut('issues', { _key: `${type}|${key}`, type, key, detail, createdAt: now() }); }
  const fmtDate = (iso) => (iso ? iso.slice(0, 10) : '?');

  function lastPageOf(doc) {
    const a = [...doc.querySelectorAll('a[onclick*="Page_Set"]')].map((x) => parseInt((x.getAttribute('onclick').match(/Page_Set\('(\d+)'\)/) || [])[1], 10));
    const b = [...doc.querySelectorAll('#pagingNavigation a[data-page]')].map((x) => parseInt(x.getAttribute('data-page'), 10));
    const nums = [...a, ...b].filter(Boolean); return nums.length ? Math.max(...nums) : 1;
  }
  // 페이지를 넘기며 수집. 갱신 모드에서는 '이미 다 아는 페이지'가 연속으로 나오면 멈춘다.
  async function crawlPages(job, makeUrl, onPage, label, expect) {
    job.page = job.page || 1; job.knownRun = job.knownRun || 0;
    while (true) {
      const url = makeUrl(job.page);
      setNow(`${label} 목록 ${job.page}${job.lastPage ? '/' + job.lastPage : ''}페이지 불러오는 중`);
      const { doc } = await fetchDoc(url, { expect });
      if (job.page === 1 || !job.lastPage) job.lastPage = lastPageOf(doc);
      const r = await onPage(doc, url, job.page);
      if (job.page > 1 && r.firstKey && r.firstKey === job.prevFirstKey) throw new Error(`${label}: ${job.page}페이지 내용이 앞 페이지와 같습니다. 페이지 넘김 방식 확인이 필요합니다.`);
      job.prevFirstKey = r.firstKey;
      progress(`${label} 목록`, job.page, job.lastPage);
      setNow(`${label} 목록 ${job.page}/${job.lastPage}페이지: ${r.summary || ''}`);
      if (!r.count) { if (job.page < job.lastPage) await addIssue('EMPTY_PAGE', `${label}|${job.page}`, `${job.page}페이지가 비어 있음`); break; }
      if (job.mode === 'update') {
        job.knownRun = r.allKnown ? job.knownRun + 1 : 0;
        if (job.knownRun >= settings.stopAfterKnownPages) { log(`${label}: 이미 수집된 구간에 도달해 목록 갱신을 마칩니다 (${job.page}페이지).`); break; }
      }
      if (job.page >= job.lastPage) break;
      job.page += 1; await saveJob(job);
    }
  }
  function startJob(job) {
    const mode = settings.forceFull || !job.fullDoneAt ? 'full' : 'update';
    Object.assign(job, { mode, phase: 'list', page: 1, lastPage: null, prevFirstKey: null, knownRun: 0, queue: null, qi: 0, startedAt: now(), message: null });
  }
  const isFresh = (job) => job.status === 'done' || job.status === 'idle';
  const listExpect = (doc) => !!doc.querySelector('.total2') || /주문상품이 없습니다|검색 결과가 없/.test(doc.body ? doc.body.textContent : '');

  /* ════════ 1) 전체주문 / 취소주문: 목록 → 주문 상세 ════════ */
  // 서버(Firebase crm_orders)의 주문 상세 목록 — '이미 받았는지'의 기준. 한 번 읽어 30분 기억 (이 PC 기록은 속도용 보조)
  let _svOrders = null, _svAt = 0;
  // (1.34.4) 서버 주문 목록: 처음(또는 7일마다) 한 번만 전부 읽고, 그 뒤엔 '바뀐 주문(uploadedAt)'만 받아 이 PC에 둔 표에 더함
  //   예전: 주문 수집 때마다(30분마다) crm_orders 전체(수천~수만 건, 상품 줄 포함)를 다시 읽어 느리고 읽기 사용량이 큼. 모든 쓰는 쪽(수집기·클라우드·웹앱)이 uploadedAt을 남김 — 웹앱도 같은 방식.
  async function serverOrders() { if (_svOrders && Date.now() - _svAt < 5 * 60000) return _svOrders; if (!fdb) { log('Firebase에 로그인되지 않아 이 PC 기록만으로 판단합니다 (구글 로그인 권장)', 'warn'); return null; }
    const put = (m, v) => { if (v.orderNo) m.set(v.orderNo, { stage: v.stage || '', kind: v.kind, items: (v.items || []).length }); };
    const ms = (v) => (v.uploadedAt && v.uploadedAt.toMillis ? v.uploadedAt.toMillis() : 0);
    try { let c = null; try { c = await dbGet('meta', 'svOrders'); } catch (e) {}
      const m = new Map(); let max = 0; let full = !c || !c.last || !Array.isArray(c.rows) || Date.now() - (c.fullAt || 0) > 7 * 864e5;
      if (!full) { c.rows.forEach(([o, st, k, n]) => m.set(o, { stage: st, kind: k, items: n })); max = c.last;
        setNow('서버 주문 중 바뀐 것만 받는 중'); const ss = await fdb.collection('crm_orders').where('uploadedAt', '>', FB.firestore.Timestamp.fromMillis(c.last - 120000)).get(); // 2분 겹쳐 읽어 시계 차이로 빠지는 것 없게
        ss.forEach((d) => { const v = d.data(); put(m, v); max = Math.max(max, ms(v)); }); log(`서버 주문 ${m.size.toLocaleString()}건 (바뀐 ${ss.size.toLocaleString()}건만 받음) — 이미 받은 주문은 서버 기준으로 건너뜁니다`); }
      else { setNow('서버의 주문 상세 목록을 읽는 중 (처음 한 번 전체 — 다음부터는 바뀐 것만)'); (await fdb.collection('crm_orders').get()).forEach((d) => { const v = d.data(); put(m, v); max = Math.max(max, ms(v)); }); log(`서버 주문 ${m.size.toLocaleString()}건 전체 확인 — 이미 받은 주문은 서버 기준으로 건너뜁니다`); }
      try { await dbPut('meta', { _key: 'svOrders', rows: [...m].map(([o, x]) => [o, x.stage, x.kind, x.items]), last: max || Date.now(), fullAt: full ? Date.now() : c.fullAt }); } catch (e) {}
      _svOrders = m; _svAt = Date.now(); return m; }
    catch (e) { log('서버 주문 목록 읽기 실패: ' + e.message + ' — 이 PC 기록만으로 판단', 'warn'); return null; } }
  const sameLine = (a, b) => a && b && a.shipped?.raw === b.shipped?.raw && a.rowStatus === b.rowStatus && a.cancelQty === b.cancelQty && a.returnReason === b.returnReason && a.price === b.price;
  async function taskOrderList(name, searchType, kind, label) {
    const job = await loadJob(name);
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    log(`${label} ${job.mode === 'full' ? '전체 수집' : '갱신 수집'} 시작`);

    if (job.phase === 'list') {
      job.touched = job.touched || [];
      await crawlPages(job, (p) => `${BASE}worders.aspx?page=${p}&keywordType=0&keyword=&searchType=${searchType}&limitDate=0`, async (doc, url, page) => {
        const L = P.parseOrderList(doc, url);
        if (page === 1 && L.total != null) job.total = L.total;
        const occ = {}; const recs = L.rows.map((r) => {
          const base = `${kind}|${r.orderNo}|${r.rawTitle}|${r.price}`; occ[base] = (occ[base] || 0) + 1;
          return { _key: `${base}|${occ[base]}`, kind, ...r, page, collectedAt: now(), parserVersion: P.VERSION };
        });
        const old = await dbGetMany('orderLines', recs.map((r) => r._key)); const SV = await serverOrders();
        let fresh = 0; const touched = new Set();
        for (const r of recs) {
          const o = old.get(r._key);
          if (o) r.firstCollectedAt = o.firstCollectedAt || o.collectedAt; else r.firstCollectedAt = now();
          const final = kind === 'cancel' || !!(r.shipped && r.shipped.date);
          const stale = !final && (!o || !o.detailTouchAt || Date.now() - Date.parse(o.detailTouchAt) > 24 * 3600e3); // 출고 전 주문: 목록 줄이 그대로면 하루 한 번만 상세 확인
          const sv = SV ? SV.get(r.orderNo) : null; const svDone = sv && sv.items && (kind === 'cancel' || /정산완료/.test(sv.stage));
          if (svDone && (!o || sameLine(o, r))) { r.detailTouchAt = (o && o.detailTouchAt) || now(); } // 서버에 끝난 상세가 있으면 '아는 줄' (이 PC에 없어도)
          else if (!o || !sameLine(o, r) || stale || (SV && !sv)) { fresh += 1; touched.add(r.orderNo); r.detailTouchAt = now(); } else r.detailTouchAt = o.detailTouchAt || now(); // 서버에 없는 주문은 이 PC에 있어도 '새 줄'
        }
        if (recs.length) await dbPut('orderLines', recs);
        touched.forEach((o) => { if (!job.touched.includes(o)) job.touched.push(o); });
        const d = recs.map((r) => r.orderedAt).filter(Boolean).sort();
        return { count: recs.length, firstKey: recs[0] && recs[0]._key, allKnown: fresh === 0,
          summary: `${fmtDate(d[0])} ~ ${fmtDate(d[d.length - 1])} 주문 ${recs.length}줄, 새로 바뀐 줄 ${fresh}` };
      }, label, listExpect);
      job.phase = 'popup'; job.qi = 0; job.queue = null; await saveJob(job);
    }

    if (job.phase === 'popup') {
      if (!job.queue) {
        const lines = (await dbAll('orderLines')).filter((l) => l.kind === kind);
        const oldest = {}; lines.forEach((l) => { if (!oldest[l.orderNo] || (l.orderedAt || '') < oldest[l.orderNo]) oldest[l.orderNo] = l.orderedAt || ''; });
        const existing = new Map((await dbAll('popups')).map((p) => [p._key, p]));
        const recent = new Date(Date.now() - 60 * 864e5).toISOString();
        const fbStage = await serverOrders(); // 서버 기준
        const touched = new Set(job.touched || []);
        job.queue = Object.keys(oldest).filter((o) => {
          const e = existing.get(o);
          const f = fbStage ? fbStage.get(o) : null;
          if (f && f.items && (kind === 'cancel' || /정산완료/.test(f.stage))) return false;          // ① 서버에 상세가 있고 끝난 주문 → 다시 안 엶 (어느 PC든 같은 결과)
          if (e && Date.now() - Date.parse(e.collectedAt || 0) < 7 * 864e5 && !touched.has(o)) return false; // ② 이 PC가 7일 안에 받아 둔 것 → 올리기 단계에서 서버로 감
          if (!f || !f.items) { if (!fbStage && e) return false; return true; }                      // ③ 서버에 상세 없음 → 받음 (서버를 못 읽으면: 이 PC에 있으면 건너뜀)
          if (kind === 'cancel') return false;
          if (!e) return oldest[o] >= recent;                                                          // ④ 서버에 미정산 상세만 있고 이 PC엔 없음 → 최근 60일 주문만 다시
          if (kind === 'cancel') return false;                   // 취소 건은 한 번이면 충분
          if (job.mode === 'full') return !/정산완료/.test(e.stage || '');
          // 갱신: 새 주문·목록 줄이 바뀐 주문만. 최근 60일 미정산 주문은 정산 단계 확인을 위해 상세를 받은 지 7일 넘었을 때만 (예전엔 매번 전부 다시 받음)
          return touched.has(o) || (!/정산완료/.test(e.stage || '') && oldest[o] >= recent && Date.now() - Date.parse(e.collectedAt || 0) > (settings.popupRecheckDays ?? 7) * 864e5);
        }).sort((a, b) => oldest[a].localeCompare(oldest[b]));   // 개인정보가 먼저 지워지는 오래된 주문부터
        job.qi = 0; await saveJob(job);
      }
      while (job.qi < job.queue.length) {
        const ono = job.queue[job.qi];
        const url = `${BASE}wpopup_order.aspx?ono=${encodeURIComponent(ono)}`;
        setNow(`${label} 주문 상세 ${ono} 불러오는 중`);
        const { doc } = await fetchDoc(url, { expect: (d) => /주문번호/.test(d.body ? d.body.textContent : '') });
        const p = P.parseOrderPopup(doc, url); popupExtras(doc, p);
        if (p.orderNo !== ono) await addIssue('POPUP_MISMATCH', ono, `팝업 주문번호가 다름: ${p.orderNo}`);
        else await savePopup(ono, p);
        job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
        progress(`${label} 주문 상세`, job.qi, job.queue.length);
        const who = p.buyer && p.buyer.name ? p.buyer.name : '개인정보 없음';
        setNow(`${label} 주문 상세 ${ono} (${fmtDate(p.orderedDate)} 주문, ${who}): 상품 ${p.items.length}개, 판매총액 ${p.totalAmount != null ? p.totalAmount.toLocaleString() + '원' : '-'}, ${p.stage || ''}`);
      }
    }
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); job.touched = []; await saveJob(job); shareJobDone(job);
    log(`${label} 완료 (목록 ${job.page || 0}페이지, 주문 상세 ${job.queue ? job.queue.length : 0}건)`, 'ok');
  }
  // 주문 상세의 배송비 칸: 그 주문에 실제 적용된 배송비(주문 시점 값)와 무료배송 기준·도서산간 배송비 문구
  function popupExtras(doc, p) {
    const t = (sel) => { const e = doc.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
    p.freeRuleText = t('#lblPriceType'); const rp = t('#lblDeliveryPriceRP'); p.remoteFee = rp ? parseInt(rp.replace(/[^\d]/g, ''), 10) || null : null;
  }
  async function savePopup(ono, p) { // 개인정보가 지워진 뒤 다시 받아도 먼저 확보한 개인정보는 유지
    const old = await dbGet('popups', ono);
    const rec = { _key: ono, ...p, collectedAt: now(), parserVersion: P.VERSION };
    if (old && old.piiAvailable && !p.piiAvailable) {
      Object.assign(rec, { buyer: old.buyer, recipient: old.recipient, recipientSameAsBuyer: old.recipientSameAsBuyer, shippingRequest: old.shippingRequest,
        piiAvailable: true, piiCollectedAt: old.piiCollectedAt || old.collectedAt, piiGoneSeenAt: now() });
    } else if (p.piiAvailable) rec.piiCollectedAt = now();
    rec.firstCollectedAt = (old && old.firstCollectedAt) || now();
    if (old && old.orderStatus && old.orderStatus !== p.orderStatus) rec.statusHistory = [...(old.statusHistory || []), { from: old.orderStatus, to: p.orderStatus, seenAt: now() }];
    else if (old && old.statusHistory) rec.statusHistory = old.statusHistory;
    await dbPut('popups', rec);
  }

  /* ════════ 2) 반품: 반품관리(wreturn.aspx)의 모든 상태 탭 ════════ */
  const RETURN_TABS = [[1, '반품확인요청'], [2, '수거신청/수거중'], [4, '수거완료'], [6, '환불보류'], [5, '반품완료'], [99, '반품취소']];
  async function taskReturns() {
    const job = await loadJob('returns');
    if (isFresh(job)) Object.assign(job, { ti: 0, page: 1, knownRun: 0, tabCounts: {}, startedAt: now(), message: null });
    job.status = 'running'; await saveJob(job);
    while (job.ti < RETURN_TABS.length) {
      const [code, name] = RETURN_TABS[job.ti];
      const url = `${BASE}wreturn.aspx?returnStatus=${code}&page=${job.page}`;
      setNow(`반품 [${name}] ${job.page}페이지 불러오는 중`);
      const { doc } = await fetchDoc(url, { expect: (d) => /반품관리/.test(d.title) || !!d.querySelector('.scm2019_table') });
      if (job.page === 1) {
        doc.querySelectorAll('.scm2019_table a[href*="returnStatus="]').forEach((a) => { const c = (a.getAttribute('href').match(/returnStatus=(\d+)/) || [])[1]; const n = (a.textContent.match(/\((\d+)건\)/) || [])[1]; if (c) job.tabCounts[c] = n ? +n : null; });
      }
      const rows = P.parseReturnList(doc); let known = 0;
      for (const r of rows) {
        const old = await dbGet('returns', r.claimId); if (old && old.status === r.status && old.tab === name) known += 1;
        const hist = (old && old.history) || [];
        if (!hist.length || hist[hist.length - 1].status !== r.status) hist.push({ status: r.status, tab: name, seenAt: now() });
        await dbPut('returns', { _key: r.claimId, ...r, tab: name, history: hist, firstSeenAt: (old && old.firstSeenAt) || now(), lastSeenAt: now(), parserVersion: P.VERSION });
      }
      setNow(`반품 [${name}] ${job.page}페이지: ${rows.length}건`);
      const last = lastPageOf(doc);
      const finalTab = code === 5 || code === 99; const allKnown = rows.length && known === rows.length;
      job.knownRun = allKnown ? (job.knownRun || 0) + 1 : 0;
      if (finalTab && job.fullDoneAt && !settings.forceFull && job.knownRun >= (settings.stopAfterKnownPages || 2)) { log(`반품 [${name}]: 이미 수집된 구간에 도달해 이 탭을 마칩니다 (${job.page}페이지)`); job.ti += 1; job.page = 1; job.knownRun = 0; }
      else if (rows.length && job.page < last) job.page += 1; else { job.ti += 1; job.page = 1; job.knownRun = 0; }
      progress('반품 (상태별)', job.ti, RETURN_TABS.length); await saveJob(job);
    }
    job.status = 'done'; job.finishedAt = now(); job.fullDoneAt = job.fullDoneAt || now(); job.knownRun = 0; await saveJob(job);
    const tc = RETURN_TABS.map(([c, n]) => `${n} ${job.tabCounts[c] ?? '?'}`).join(', ');
    log(`반품 완료 (${tc})`, 'ok');
  }

  /* ════════ 3) 묻고 답하기: 목록 → 상세 ════════ */
  async function taskQna() {
    const job = await loadJob('qna');
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    if (job.phase === 'list') {
      await crawlPages(job, (p) => `${BASE}wUsedShopC2CQnASellerList.aspx?page=${p}`, async (doc) => {
        const rows = P.parseQnaList(doc).map((r) => ({ _key: r.questionId, ...r, collectedAt: now() }));
        const det = await dbGetMany('qnaDetail', rows.map((r) => r._key)); const old = await dbGetMany('qnaList', rows.map((r) => r._key));
        // '아는 줄' = 전에 본 줄과 답변여부가 같고 상세도 받아 둔 줄. 답변 없는 질문·취소된 질문도 상태가 그대로면 아는 줄 (예전엔 답변이 없으면 매번 새 줄로 봐서 끝까지 다 넘겼음)
        let fresh = 0;
        for (const r of rows) { const o = old.get(r._key);
          r.firstCollectedAt = (o && (o.firstCollectedAt || o.collectedAt)) || now();
          r.answeredHistory = (o && o.answeredHistory) || (o ? [{ v: o.answered ?? null, seenAt: o.firstCollectedAt || o.collectedAt || null }] : []);
          if (!o || (o.answered ?? null) !== (r.answered ?? null)) { r.answeredHistory = [...r.answeredHistory, { v: r.answered ?? null, seenAt: now() }]; }
          if (!o || (o.answered ?? null) !== (r.answered ?? null) || !det.has(r._key)) fresh += 1; }
        if (rows.length) await dbPut('qnaList', rows);
        return { count: rows.length, firstKey: rows[0] && rows[0]._key, allKnown: fresh === 0, summary: `문의 ${rows.length}건, 새로 바뀐 것 ${fresh}건 (${fmtDate(rows[rows.length - 1]?.createdDate)} ~ ${fmtDate(rows[0]?.createdDate)})` };
      }, '묻고 답하기');
      job.phase = 'detail'; job.queue = null; await saveJob(job);
    }
    if (job.phase === 'pubstatus') { job.phase = 'detail'; await saveJob(job); } // (1.5.3에서 잘못 넣은 단계 — 남아 있던 작업은 바로 다음 단계로)
    if (job.phase === 'detail') {
      if (!job.queue) {
        const det = new Map((await dbAll('qnaDetail')).map((d) => [d._key, d]));
        const fix = []; // 예전 기록(상세에 목록 답변여부가 없음)은 지금 목록 값으로 한 번 맞춰 두고 다시 열지 않음
        job.queue = (await dbAll('qnaList')).filter((q) => { const d = det.get(q._key); if (!d) return true;
          if (!('listStatus' in d)) { fix.push({ ...d, listStatus: q.answered ?? null }); return false; }
          return (d.listStatus ?? null) !== (q.answered ?? null); }).map((q) => q._key);
        if (fix.length) await dbPut('qnaDetail', fix);
        log(`묻고 답하기 상세: 새 질문·답변여부가 바뀐 질문 ${job.queue.length}건만 엽니다`);
        job.qi = 0; await saveJob(job);
      }
      while (job.qi < job.queue.length) {
        const id = job.queue[job.qi]; const url = `${BASE}wUsedShopC2CAnswer.aspx?questionid=${id}`;
        setNow(`묻고 답하기 상세 ${id} 불러오는 중`);
        const { doc } = await fetchDoc(url, { expect: (d) => !!d.querySelector('#divQuestion') });
        const d = P.parseQnaDetail(doc, url);
        if (!d.answer) { const ta = doc.querySelector('#txtAnswer'); const v = ta ? String(ta.value || ta.textContent || '').trim() : ''; if (v) d.answer = v; }
        if (!d.answer) { // 우리 답변은 '수정하기' 화면(method=edit)의 답변 입력칸(#txtAnswer)에 있음
          const e2 = await fetchDoc(`${BASE}wUsedShopC2CAnswer.aspx?questionid=${id}&method=edit`, { expect: (x) => !!x.querySelector('#divQuestion, #txtAnswer') });
          const ta = e2.doc.querySelector('#txtAnswer'); const v = ta ? String(ta.value || ta.textContent || '').trim() : ''; if (v) { d.answer = v; d.answerFrom = 'edit'; } }
        { const o = await dbGet('qnaDetail', id); const ql = await dbGet('qnaList', id); const rec = { _key: id, ...d, listStatus: ql ? ql.answered ?? null : null, collectedAt: now(), parserVersion: P.VERSION };
          if (o) { rec.firstCollectedAt = o.firstCollectedAt || o.collectedAt || null; for (const k of Object.keys(o)) if ((rec[k] === null || rec[k] === undefined || rec[k] === '') && o[k] !== null && o[k] !== undefined && o[k] !== '') rec[k] = o[k]; // 새로 읽은 값이 비면 먼저 받은 값 유지
            rec.answerHistory = o.answerHistory || []; if (o.answer && d.answer && o.answer !== d.answer) rec.answerHistory = [...rec.answerHistory, { answer: o.answer, until: now() }]; }
          else rec.firstCollectedAt = now();
          await dbPut('qnaDetail', rec); }
        job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
        progress('묻고 답하기 상세', job.qi, job.queue.length);
        setNow(`묻고 답하기 ${id} (${fmtDate(d.createdDate)}): ${d.title || '상품 정보 없음'}${d.answer ? ', 답변 있음' : ', 미답변'}`);
      }
    }
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); await saveJob(job); shareJobDone(job); log('묻고 답하기 완료', 'ok');
    await uploadQnaNow();
  }
  // 묻고 답하기는 수집이 끝나면 바로 Firebase에 올림 (전체 올리기를 기다리지 않음). 답변여부 = 샵매니저 목록 행 5번째 칸 그대로
  async function uploadQnaNow() {
    const list = await dbAll('qnaList'); const det = new Map((await dbAll('qnaDetail')).map((d) => [d._key, d]));
    const cnt = {}; list.forEach((r) => { const k = r.answered == null ? '(빈칸)' : r.answered; cnt[k] = (cnt[k] || 0) + 1; });
    log(`묻고 답하기 목록 ${list.length}건의 답변여부: ${Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (!fbUser || !fdb) { log('Firebase 로그인이 안 되어 묻고 답하기를 올리지 못했습니다 (구글 로그인 후 다시)', 'err'); return; }
    const sent = new Map((await dbAll('uploaded')).filter((u) => u._key.startsWith('qnaNow/')).map((u) => [u._key, u.hash]));
    const todo = [];
    list.forEach((r) => { const q = det.get(r._key) || {}; const cid = q.customerKey ? `aladin_${q.customerKey}` : null;
      const data = { type: 'qna', platform: 'aladin', questionId: r._key, answerStatus: r.answered ?? null, authorMasked: q.authorMasked || r.authorMasked || null, body: q.question || r.question || null, createdAt: q.createdDate || r.createdDate || null };
      if (q._key) Object.assign(data, { customerId: cid, orderId: q.orderNo ? `aladin_${q.orderNo}` : null, itemId: q.itemId ?? null, title: q.title ?? null, condition: q.condition ?? null, answer: q.answer ?? null });
      Object.keys(data).forEach((k) => { if (data[k] === null || data[k] === undefined || data[k] === '') delete data[k]; }); // 빈 값은 안 보냄 → 서버의 기존 값 유지
      const h = hashStr(stableStr(data)); if (sent.get('qnaNow/' + r._key) !== h) todo.push({ id: r._key, data, h }); });
    if (!todo.length) { log('묻고 답하기: 지난번에 올린 것과 같아 올릴 것 없음', 'ok'); return; }
    const stamp = FB.firestore.FieldValue.serverTimestamp(); let n = 0;
    for (let i = 0; i < todo.length; i += 300) { const part = todo.slice(i, i + 300); const b = fdb.batch();
      part.forEach((t) => { b.set(fdb.collection('crm_interactions').doc(`aladin_qna_${t.id}`), { ...t.data, uploadedAt: stamp, uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; });
      await commitWithRetry(b, part.length); await dbPut('uploaded', part.map((t) => ({ _key: 'qnaNow/' + t.id, hash: t.h, at: now() }))); }
    log(`묻고 답하기 ${n}건(새것·바뀐 것만)을 Firebase에 올렸습니다 — 전체 ${list.length}건`, 'ok');
  }

  /* ════════ 4) 구매평 ════════ */
  async function taskReviews() {
    const job = await loadJob('reviews');
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    await crawlPages(job, (p) => `${BASE}wShopSurveySellerList.aspx?page=${p}`, async (doc) => {
      const occ = {}; const rows = P.parseReviewList(doc).map((r) => {
        const b = `${r.orderNo}|${r.title}|${r.createdDate}`; occ[b] = (occ[b] || 0) + 1;
        return { _key: `${b}|${occ[b]}`, ...r, collectedAt: now() };
      });
      const old = await dbGetMany('reviews', rows.map((r) => r._key));
      rows.forEach((r) => { const o = old.get(r._key); r.firstCollectedAt = (o && (o.firstCollectedAt || o.collectedAt)) || now(); });
      if (rows.length) await dbPut('reviews', rows);
      return { count: rows.length, firstKey: rows[0] && rows[0]._key, allKnown: rows.every((r) => old.has(r._key)), summary: `구매평 ${rows.length}건` };
    }, '구매평');
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); await saveJob(job); shareJobDone(job); log('구매평 완료', 'ok');
  }

  /* ════════ 5) 검증 (자동 수정 없이 '확인 필요'만 기록) ════════ */
  async function taskVerify() {
    setNow('수집 결과 검증 중'); progress('검증', 0, 1);
    const old = (await dbAll('issues')).filter((i) => i.type.startsWith('V_')).map((i) => i._key); if (old.length) await dbDelete('issues', old);
    const lines = await dbAll('orderLines'); const popups = new Map((await dbAll('popups')).map((p) => [p._key, p]));
    const byOrder = (kind) => { const m = {}; lines.filter((l) => l.kind === kind).forEach((l) => (m[l.orderNo] = m[l.orderNo] || []).push(l)); return m; };
    const sale = byOrder('sale'); const cancel = byOrder('cancel'); let n = 0;
    for (const [ono, ls] of Object.entries(sale)) {
      const p = popups.get(ono);
      if (!p) { await addIssue('V_NO_POPUP', ono, '주문 상세를 아직 받지 못함'); n++; continue; }
      const m = P.matchListToPopup(ls, p);
      if (m.countMismatch) { await addIssue('V_LINE_COUNT', ono, `목록 ${ls.length}줄 / 상세 ${p.items.length}개 (주문 안 취소 ${p.items.length - (m.activeItemCount ?? p.items.length)}개 제외 시 ${m.activeItemCount ?? p.items.length}개)`); n++; }
      const sum = ls.reduce((s, l) => s + (l.price || 0) * (l.qty || 1), 0);
      if (p.totalAmount != null && sum !== p.totalAmount) { await addIssue('V_TOTAL', ono, `판매가 합계 ${sum} / 판매총액 ${p.totalAmount}`); n++; }
      if (p.orderStatus && p.orderStatus !== '정상') { await addIssue('V_STATUS', ono, `주문상태: ${p.orderStatus}`); n++; }
      const odd = ls.filter((l) => l.rowStatus && l.rowStatus !== '정상'); if (odd.length) { await addIssue('V_ROW_STATUS', ono, odd.map((l) => `${l.title}: ${l.rowStatus}${l.returnReason ? ' / ' + l.returnReason : ''}`).join('; ')); n++; }
    }
    for (const ono of Object.keys(cancel)) if (sale[ono]) { await addIssue('V_CANCEL_OVERLAP', ono, '판매 목록과 취소 목록에 모두 있음 (부분취소 등 확인 필요)'); n++; }
    // 샵매니저 표시 건수와 비교 (표시 건수가 줄 수인지 수량 합인지 몰라 둘 다 계산)
    for (const [jobName, grp, label] of [['orders', sale, '판매'], ['cancels', cancel, '취소']]) {
      const j = await loadJob(jobName); const all = Object.values(grp).flat();
      const nLines = all.length; const nQty = all.reduce((s, l) => s + (l.qty || 1), 0);
      if (j.total) await dbPut('meta', { _key: `count_${jobName}`, shown: j.total, lines: nLines, qty: nQty, at: now() });
      if (j.total && nLines < j.total && nQty < j.total) { await addIssue('V_COUNT', jobName, `${label}: 수집 ${nLines}줄(수량 합 ${nQty}) / 샵매니저 표시 ${j.total}건`); n++; }
    }
    await dbPut('meta', { _key: 'lastVerify', at: now(), issues: n });
    progress('검증', 1, 1); setNow(`검증 끝: 확인 필요 ${n}건`); log(`검증 완료: 확인 필요 ${n}건`, n ? 'warn' : 'ok');
  }

  /* ════════ 6) Firebase 올리기 (통합 프로젝트 readnow-3a385) ════════
   * 구조 (ERP 이전 시 orders.items는 order_items 표로 분리):
   *   crm_customers/{aladin_고객번호}   고객 요약·연락처 목록 (flags·메모는 웹앱에서 관리, 업로더는 건드리지 않음)
   *   crm_orders/{aladin_주문번호}      주문 + items[] (상품 줄마다 상태: normal/cancelled/returned/…)
   *   crm_interactions/{id}            묻고 답하기·구매평 (나중에 관리자 메모도 여기)
   *   crm_orderEvents/{aladin_return_클레임번호}  반품 이력
   */
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385',
    storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15',
  };
  const FB = (typeof firebase !== 'undefined' && firebase) || window.firebase || null;
  let fbUser = null; let fdb = null;
  if (FB) {
    try {
      if (!FB.apps.length) FB.initializeApp(FIREBASE_CONFIG);
      fdb = FB.firestore();
      FB.auth().onAuthStateChanged((u) => { fbUser = u; if (u) { watchUsage(); watchLock(); } render(); });
    } catch (e) { console.error(e); }
  }
  // 로그인: 구글 창 방식(기본). 창 방식이 이 환경에서 안 되면 Firebase 전용 이메일·비밀번호 방식 사용.
  let fbLoggingIn = false;
  async function fbLogin() {
    if (!FB) { alert('Firebase 파일을 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.'); return; }
    if (fbLoggingIn) {
      if (Date.now() - fbLoggingIn < 40000) { log('로그인 창이 이미 열려 있습니다. 작업표시줄에 새 크롬 창이 떠 있는지 확인해 주세요.', 'warn'); return; }
      log('앞의 로그인 창을 취소하고 새로 엽니다.', 'warn');
    }
    fbLoggingIn = Date.now(); render();
    const myTry = fbLoggingIn;
    // 40초 안에 결과가 없으면(창이 안 보이거나 막힌 경우) 다시 시도할 수 있게 풀어 줌
    setTimeout(() => { if (fbLoggingIn === myTry && !fbUser) { fbLoggingIn = false; render(); log('로그인 창에서 40초 동안 응답이 없습니다. ① 작업표시줄에 뒤로 숨은 크롬 창이 있는지 ② 주소창 오른쪽에 팝업 차단 표시가 있는지 확인한 뒤 다시 눌러 주세요. 계속 안 되면 이 페이지를 새로고침하고 다시 시도하세요.', 'warn'); } }, 40000);
    const pc = GM_getValue('rn-fbmode', 'google') === 'password' ? GM_getValue('rn-fbpw', null) : null; // 기본은 구글 로그인
    try {
      if (pc && pc.email && pc.pw) {
        log('Firebase 전용 계정으로 로그인하는 중');
        await FB.auth().signInWithEmailAndPassword(pc.email, pc.pw);
      } else {
        log('구글 로그인 창을 여는 중입니다. 뜨는 창에서 계정을 한 번만 골라 주세요.');
        await FB.auth().signInWithPopup(new FB.auth.GoogleAuthProvider());
      }
      log(`Firebase 로그인: ${FB.auth().currentUser.email}`, 'ok');
    } catch (e) {
      const c = e.code || '';
      const why = {
        'auth/cancelled-popup-request': '로그인 창이 두 번 열리려 해서 앞의 것이 취소됐습니다.',
        'auth/popup-closed-by-user': '계정을 고르기 전에 로그인 창이 닫혔습니다.',
        'auth/popup-blocked': '크롬이 로그인 창을 막았습니다. 주소창 오른쪽의 팝업 차단 아이콘에서 www.aladin.co.kr 팝업을 허용해 주세요.',
        'auth/unauthorized-domain': 'Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 www.aladin.co.kr 을 추가해야 합니다.',
        'auth/operation-not-allowed': 'Firebase 콘솔 → Authentication → 로그인 방법에서 이 방식이 꺼져 있습니다.',
        'auth/invalid-credential': 'Firebase 전용 이메일 또는 비밀번호가 틀립니다.',
        'auth/network-request-failed': '인터넷 연결 또는 Firebase 접속에 실패했습니다.',
      }[c];
      log(`로그인 실패 (${c || e.message})${why ? ': ' + why : ''}`, 'err');
      if (pc && /invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) log("설정의 '로그인 방식'을 '구글 계정'으로 바꾸면 구글 로그인 창으로 들어갈 수 있습니다.", 'warn');
    } finally { if (fbLoggingIn === myTry) fbLoggingIn = false; render(); }
  }

  const docHash = (d) => hashStr(JSON.stringify({ ...d.data, source: undefined, piiCollectedAt: undefined })); // 수집 시각만 바뀐 문서는 다시 올리지 않음
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; };
  const clean = (o) => JSON.parse(JSON.stringify(o)); // undefined 제거
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  /* ── 엑셀·구글 시트 해석 (순수 함수) ── */
  const isDateLike = (v) => v instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(v || ''));
  function kDate(v) { // "2025-10-26 오후 11:22:23" / Date / 엑셀 날짜 숫자 → "2025-10-26T23:22"
    if (v == null || v === '') return null;
    if (v instanceof Date) { const z = (x) => String(x).padStart(2, '0'); return `${v.getFullYear()}-${z(v.getMonth() + 1)}-${z(v.getDate())}` + (v.getHours() || v.getMinutes() ? `T${z(v.getHours())}:${z(v.getMinutes())}` : ''); }
    if (typeof v === 'number' && v > 30000 && v < 80000) return kDate(new Date(Math.round((v - 25569) * 864e5) + new Date().getTimezoneOffset() * 60000));
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(오전|오후)?\s*(\d{1,2}):(\d{2}))?/);
    if (m) { let h = m[5] != null ? parseInt(m[5], 10) : null; if (h != null && m[4] === '오후' && h < 12) h += 12; if (h != null && m[4] === '오전' && h === 12) h = 0; return `${m[1]}-${m[2]}-${m[3]}` + (h != null ? `T${String(h).padStart(2, '0')}:${m[6]}` : ''); }
    m = s.match(/^(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})/); if (m) { const y = m[1].length === 2 ? '20' + m[1] : m[1]; return `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; }
    return null;
  }
  const numOrNull = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return v; const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : null; };
  const strOrNull = (v) => { if (v == null) return null; const s = String(v).replace(/\u00a0/g, ' ').trim(); return s ? s : null; };
  const stripUsed = (t) => (t || '').replace(/^\s*\[중고[^\]]*\]\s*/, '').trim();
  const normTitle = (t) => stripUsed(t).replace(/\s+/g, '').toLowerCase();
  const zip5 = (v) => { const s = strOrNull(v); return s && /^\d{4,5}$/.test(s.replace(/\.0$/, '')) ? s.replace(/\.0$/, '').padStart(5, '0') : null; };
  const phonesIn = (s) => (String(s || '').match(/0\d{1,2}-?\d{3,4}-?\d{4}/g) || []).map((x) => x.replace(/\D/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'));
  const platformOf = (ono, status) => (/^\d{3}-A\d+/.test(ono || '') ? 'aladin' : /^Y/i.test(ono || '') || /yes|예스/i.test(status || '') ? 'yes24' : /입금|직접|무통장/.test(status || '') ? 'direct' : ono ? 'unknown' : 'direct');

  // 판매완료 엑셀: 행마다 열이 어긋났는지 내용으로 판별해 스스로 맞춘다.
  //  앞 구간(수령인~수수료)은 날짜·금액 칸 위치로, 뒤 구간(우편번호~요청사항)은 우편번호·주소·전화 칸 위치로 각각 맞춤.
  const isNumLike = (v) => typeof v === 'number' || /^[\d,]+$/.test(String(v ?? '').trim());
  const isZipLike = (v) => /^\d{4,5}(\.0)?$/.test(String(v ?? '').trim());
  const isAddrLike = (v) => /(시|도|구|군|로|길)\s/.test(String(v ?? ''));
  const isPhoneLike = (v) => /0\d{1,2}-\d{3,4}-\d{4}|^--$|^0+-0+-0+$/.test(String(v ?? '').trim());
  function bestOffset(r, scoreAt, min) { let best = null; for (let o = -2; o <= 3; o++) { const sc = scoreAt(o); if (!best || sc > best.sc) best = { o, sc }; } return best.sc >= min ? best.o : null; }
  function parseSalesExcel(aoa) {
    const out = []; const seen = new Set(); let dup = 0; let skipped = 0; let realigned = 0; let manualN = 0; const occ = {};
    for (let i = 1; i < aoa.length; i++) {
      const r0 = aoa[i]; if (!r0 || !r0.some((c) => c != null && c !== '')) continue;
      const r = [...r0, null, null, null, null, null];
      const o1 = bestOffset(r, (o) => (isDateLike(r[11 + o]) ? 2 : 0) + (isDateLike(r[12 + o]) ? 1 : 0) + (isNumLike(r[13 + o]) ? 1 : 0), 3);
      const o2 = bestOffset(r, (o) => (isZipLike(r[21 + o]) ? 2 : 0) + (isAddrLike(r[22 + o]) ? 2 : 0) + (isPhoneLike(r[23 + o]) ? 1 : 0) + (isPhoneLike(r[24 + o]) ? 1 : 0), 3);
      const manual = o1 == null;
      if (manual && !strOrNull(r[3])) { skipped++; continue; } // 제목도 날짜도 없는 행만 버림
      const a = o1 ?? o2 ?? 0; const b2 = o2 ?? a;
      if (a !== 0 || b2 !== 0) realigned++; if (manual) manualN++;
      const sig = JSON.stringify(r0); if (seen.has(sig)) { dup++; continue; } seen.add(sig);
      const ono = strOrNull(r[1]); const status = strOrNull(r[0]);
      const line = { orderNo: ono, platform: platformOf(ono, status), status, sku: strOrNull(r[2]), rawTitle: strOrNull(r[3]), title: stripUsed(r[3]),
        aladinUsedCode: strOrNull(r[4]), isbnAlt: strOrNull(r[5]), isbn13: strOrNull(r[6]) ? String(r[6]).replace(/\.0$/, '') : null, publisher: strOrNull(r[7]),
        qty: numOrNull(r[8]) || 1, buyerName: strOrNull(r[9]), recipientName: strOrNull(r[10 + a]), orderedAt: kDate(r[11 + a]), paidAt: kDate(r[12 + a]),
        price: numOrNull(r[13 + a]), fee: numOrNull(r[15 + a]), memo: strOrNull(r[20 + b2]), zip: zip5(r[21 + b2]), address: strOrNull(r[22 + b2]),
        phone1: P.normPhone(strOrNull(r[23 + b2]) || ''), phone2: P.normPhone(strOrNull(r[24 + b2]) || ''), shippingRequest: strOrNull(r[25 + b2]), note: strOrNull(r[28 + b2]),
        alignment: { front: o1, back: o2 }, manual, excelRow: i + 1 };
      if (manual) { line.price = line.price ?? numOrNull(r[2]) ?? numOrNull(r[13]); if (line.sku && /원$/.test(line.sku)) line.sku = null; }
      if (line.recipientName && isDateLike(line.recipientName)) line.recipientName = null;
      const odd = [r[18 + b2], r[19 + b2]].map(strOrNull).filter((x) => x && !/택배|^\d+$/.test(x)); if (odd.length) line.cellNotes = odd; // 택배사·송장 칸에 적힌 메모
      const k = `${ono || 'noorder-' + line.orderedAt}|${line.isbn13 || line.title}|${line.price}`; occ[k] = (occ[k] || 0) + 1;
      line._key = `${k}|${occ[k]}`; out.push(line);
    }
    return { lines: out, dup, skipped, realigned, manual: manualN };
  }

  // 구글 시트 (고객 쪽 세 시트만)
  function parsePurchaseCell(v) { // "제목\n상, 12000원, 1개\n2026.01.08 10:51 등록\n9788988295205  (BLKCMN)"
    const lines = String(v || '').split(/\n/).map((x) => x.trim()).filter(Boolean); const items = []; let cur = null;
    for (const l of lines) {
      let m;
      if ((m = l.match(/^(최상|상|중|하)\s*,\s*([\d,]+)원\s*,\s*(\d+)개/))) { if (cur) Object.assign(cur, { condition: m[1], price: numOrNull(m[2]), qty: +m[3] }); }
      else if ((m = l.match(/(\d{4}\.\d{2}\.\d{2}\s+\d{1,2}:\d{2})\s*등록/))) { if (cur) cur.registeredAt = kDate(m[1].replace(/\./g, '-').replace(/-(\d{2}\s)/, '-$1')); }
      else if ((m = l.match(/^(\d{13})\s*\(([^)]+)\)/))) { if (cur) Object.assign(cur, { isbn13: m[1], sku: m[2].trim() }); }
      else { cur = { title: stripUsed(l), rawTitle: l }; items.push(cur); }
    }
    return items;
  }
  function parseCustomerSheets(wbSheets) {
    const rows = []; const found = [];
    const S = (name, head) => { const k = Object.keys(wbSheets).find((n) => n.replace(/\s/g, '') === name.replace(/\s/g, '')); if (!k) return null; found.push(k);
      const aoa = wbSheets[k]; const h = aoa.findIndex((r) => r && String(r[0] || '').trim() === head); return h >= 0 ? aoa.slice(h) : aoa; }; // 제목 행 위의 빈 행 건너뜀
    const push = (type, sheet, i, rec, raw) => rows.push({ _key: `${type}_${hashStr(JSON.stringify(raw)).split(':')[0]}`, type, sheet, sheetRow: i + 1, ...rec, raw: raw.map((c) => (c instanceof Date ? kDate(c) : c)).filter((c, j, a) => j < 14) });
    const c = S('고객 취소 목록', '주문일');
    if (c) c.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      const items = parsePurchaseCell(r[3]); if (items[0] && !items[0].isbn13 && r[2]) items[0].isbn13 = String(r[2]).replace(/\.0$/, '');
      if (items[0] && items[0].price == null) items[0].price = numOrNull(r[4]); if (items[0] && !items[0].sku) items[0].sku = strOrNull(r[5]);
      const addr = strOrNull(String(r[10] || '').replace(/\s*\n\s*/g, ' ')); const zm = addr && addr.match(/\((\d{5})\)/);
      push('customerCancel', '고객 취소 목록', i + 1, { date: kDate(r[0]), paidAt: kDate(r[1]), items, buyerName: strOrNull(r[6]), recipientName: strOrNull(r[7]),
        phones: phonesIn(r[8]), zip: zip5(r[9]) || (zm ? zm[1] : null), address: addr ? addr.replace(/\(\d{5}\)/, '').trim() : null, email: strOrNull(r[11]), note: strOrNull(r[12]) }, r); });
    const b = S('블랙리스트', '차단 날짜');
    if (b) b.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      push('blacklist', '블랙리스트', i + 1, { date: kDate(r[0]), idMasked: strOrNull(r[1]), items: parsePurchaseCell(r[2]), total: numOrNull(r[3]), reason: strOrNull(r[4]),
        name: strOrNull(r[5]), email: strOrNull(r[6]), phones: phonesIn(`${r[7] || ''} ${r[8] || ''}`), address: strOrNull(String(r[8] || '').replace(/\s*\n\s*/g, ' ')), extra: strOrNull(r[9]) }, r); });
    const e = S('기타 고객', '관련 상품');
    if (e) e.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      const emails = String(`${r[6] || ''} ${r[3] || ''}`).match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
      push('otherCustomer', '기타 고객', i + 1, { items: [{ title: stripUsed(r[0]), rawTitle: strOrNull(r[0]) }], date: kDate(r[1]), scope: strOrNull(r[2]), body: strOrNull(r[3]),
        idMasked: strOrNull(r[4]), name: strOrNull(r[5]), email: emails[0] || strOrNull(r[6]) }, r); });
    // 판매자 시트 3개 (전문셀러·개인셀러·허위 매물) → 판매자 기록
    for (const [sheetName, grade] of [['전문셀러', 'pro'], ['개인셀러', 'personal'], ['허위 매물', 'fake']]) {
      const k = Object.keys(wbSheets).find((n) => n.replace(/\s/g, '') === sheetName.replace(/\s/g, '')); if (!k) continue; found.push(k);
      const aoa = wbSheets[k]; const h = aoa.findIndex((r) => r && String(r[0] || '').trim() === '이름'); const body = h >= 0 ? aoa.slice(h + 1) : aoa;
      body.forEach((r, i) => {
        if (!r || !strOrNull(r[0])) return;
        const nm = String(r[0]).split(/\n/)[0].trim();
        const n = (v) => (v == null || v === '' || v === '-' ? null : typeof v === 'number' ? v : Number.isFinite(parseFloat(String(v).replace(/,/g, ''))) ? parseFloat(String(v).replace(/,/g, '')) : strOrNull(v));
        const pct = (v) => { const x = n(v); return typeof x === 'number' ? (x > 1 ? x / 100 : x) : null; };
        const cats = [[2, 3], [4, 5], [6, 7], [8, 9]].map(([a, b]) => (strOrNull(r[a]) ? { name: String(r[a]).trim(), count: n(r[b]) } : null)).filter(Boolean);
        const comp = strOrNull(r[25]); const parts = comp ? comp.split(/\s*,\s*/) : [];
        rows.push({ _key: `seller_${hashStr(sheetName + '|' + nm).split(':')[0]}`, type: 'seller', sheet: k, sheetRow: (h >= 0 ? h + 2 : 1) + i, name: nm, grade,
          stock: n(r[1]), topCategories: cats, freeShipping: n(r[10]), shippingFee: n(r[11]), expectDays: n(r[12]), actualDays: n(r[13]), lowPrice: n(r[14]),
          rating6m: pct(r[15]), ratingAll: pct(r[16]), reviews6m: n(r[17]), reviewsAll: n(r[18]), neutral6m: n(r[19]), neutralAll: n(r[20]), bad6m: n(r[21]), badAll: n(r[22]),
          outstockRate: pct(r[23]), notice: strOrNull(r[24]), company: parts[0] || null, owner: parts[1] || null, phone: strOrNull(r[26]), email: strOrNull(r[27]), bizNo: strOrNull(r[28]),
          mailOrderNo: strOrNull(r[29]), address: strOrNull(r[30]), courier: strOrNull(r[31]), asPhone: strOrNull(r[32]), returnAddress: strOrNull(r[33]), returnGuide: strOrNull(r[34]), remark: strOrNull(r[36]) });
      });
    }
    return { rows, found };
  }


  /* ── 고객 점수: 소매·전자상거래에서 널리 쓰는 RFM(최근성·빈도·금액) + 참여도·거래기간을 '가치 점수'로,
   *    취소·반품·대행 의심·문의 부담·기록을 '주의 점수'로 계산. 기준을 바꾸면 SCORE_VER를 올림 ── */
  const SCORE_VER = 2;
  const SCORE_DEFAULTS = { vip: { minValue: 65, maxRisk: 25, minOrders: 3, excludeSellers: true }, caution: { minRisk: 35 } };
  let SCORE_RULES = JSON.parse(JSON.stringify(SCORE_DEFAULTS));
  async function loadScoringConfig() { try { const d = await fdb.collection('crm_system').doc('scoring').get(); if (d.exists) { const x = d.data(); SCORE_RULES = { vip: { ...SCORE_DEFAULTS.vip, ...(x.vip || {}) }, caution: { ...SCORE_DEFAULTS.caution, ...(x.caution || {}) } }; } } catch (e) {} }
  let sellerLinkMap = new Map(); // customerId → [{name, grade}] (판매자 시트와 연결된 고객)
  function scoreCustomer(c, todayIso) {
    const today = todayIso ? new Date(todayIso) : new Date();
    const days = (iso) => (iso ? Math.floor((today - new Date(String(iso).slice(0, 10))) / 864e5) : null);
    const won = (n) => `${Math.round(n || 0).toLocaleString()}원`;
    const V = []; const R = [];
    const orders = c.saleOrderCount || 0; const amt = c.salesAmount || 0; const last = days(c.lastSaleAt || c.lastOrderAt);
    // 가치 ① 최근성 (25)
    let r = 0; if (orders) r = last <= 30 ? 25 : last <= 90 ? 20 : last <= 180 ? 14 : last <= 365 ? 8 : 3;
    V.push({ k: 'recency', label: '최근성', pts: r, max: 25, text: orders ? `마지막 구매 ${last}일 전` : '구매 없음' });
    // ② 빈도 (25)
    const f = orders >= 10 ? 25 : orders >= 5 ? 20 : orders >= 3 ? 15 : orders === 2 ? 10 : orders === 1 ? 5 : 0;
    V.push({ k: 'frequency', label: '구매 빈도', pts: f, max: 25, text: `구매 주문 ${orders}회` });
    // ③ 금액 (30)
    const m = amt >= 300000 ? 30 : amt >= 150000 ? 27 : amt >= 70000 ? 22 : amt >= 30000 ? 16 : amt >= 10000 ? 10 : amt > 0 ? 5 : 0;
    V.push({ k: 'monetary', label: '누적 매출', pts: m, max: 30, text: `순매출 ${won(amt)}` });
    // ④ 참여도: 구매확정·평가 비율 (10)
    const rv = c.reviewCount || 0; const rr = orders ? rv / orders : 0;
    const e = rr >= 0.5 ? 10 : rr >= 0.25 ? 7 : rv > 0 ? 4 : 0;
    V.push({ k: 'engagement', label: '구매확정·평가', pts: e, max: 10, text: `평가 ${rv}건${orders ? ` (주문 대비 ${Math.round(rr * 100)}%)` : ''}` });
    // ⑤ 거래 기간 (10): 재구매 고객만
    const span = orders >= 2 && c.firstOrderAt && c.lastOrderAt ? Math.floor((new Date(String(c.lastOrderAt).slice(0, 10)) - new Date(String(c.firstOrderAt).slice(0, 10))) / 864e5 / 30) : 0;
    const t = span >= 12 ? 10 : span >= 6 ? 7 : span >= 3 ? 4 : 0;
    V.push({ k: 'tenure', label: '거래 기간', pts: t, max: 10, text: orders >= 2 ? `첫 주문부터 ${span}개월` : '재구매 없음' });
    // 주의 ① 고객 취소율 (35): 판매 전 취소 + 고객 취소 (우리 품절 취소는 제외)
    const cancels = (c.cancelOrderCount || 0); const crate = cancels / Math.max(1, orders + cancels);
    // 한 번 취소는 흔한 일이라 가볍게, 반복될수록 무겁게
    let cp = 0; if (cancels === 1) cp = 5; else if (cancels >= 2) cp = crate >= 0.5 ? (cancels >= 3 ? 35 : 25) : crate >= 0.3 ? 20 : crate >= 0.15 ? 12 : 6; if (cancels >= 5) cp = Math.max(cp, 25);
    R.push({ k: 'cancel', label: '고객 취소', pts: cp, max: 35, text: `취소 ${cancels}건 (취소율 ${Math.round(crate * 100)}%)` });
    // ② 반품 (25)
    const rt = c.returnCount || 0; const rp = rt >= 2 ? 25 : rt === 1 ? 15 : 0;
    R.push({ k: 'return', label: '반품', pts: rp, max: 25, text: `반품 ${rt}건` });
    // ③ 대행·되팔이 의심 (20)
    const oth = c.otherRecipientCount || 0; const ap = oth >= 30 ? 35 : oth >= 10 ? 25 : oth >= 3 ? 12 : 0;
    R.push({ k: 'agent', label: '대행 의심', pts: ap, max: 35, text: `주문인과 다른 수령인 ${oth}명` });
    // ④ 문의 부담 (10)
    const q = c.qnaCount || 0; const qp = q >= 5 && q >= orders ? 10 : q >= 3 && orders === 0 ? 6 : 0;
    R.push({ k: 'inquiry', label: '문의 부담', pts: qp, max: 10, text: `문의 ${q}건 / 구매 ${orders}회` });
    // ⑤ 기록된 문제 (10): 구글 시트의 고객 취소·불만 기록
    const cn = c.cancelNoteCount || 0; const np = cn >= 1 ? 10 : 0;
    R.push({ k: 'record', label: '기록된 문제', pts: np, max: 10, text: `취소·불만 기록 ${cn}건` });
    // ⑥ 판매자 연결 (30): 허위 매물 판매자와 연결되면 되팔이·대행 가능성이 매우 큼
    const sl = (sellerLinkMap.get(c.customerId) || []).filter((x) => x.strong !== false); const hasFake = sl.some((x) => x.grade === 'fake'); // 이메일이 비슷하기만 한 약한 연결은 점수에 넣지 않음
    const sp = hasFake ? 30 : sl.length ? 15 : 0;
    R.push({ k: 'seller', label: '판매자 연결', pts: sp, max: 30, text: sl.length ? `판매자 ${sl.map((x) => x.name).slice(0, 3).join(', ')}${hasFake ? ' (허위 매물)' : ''}` : '연결 없음' });
    const value = V.reduce((s, x) => s + x.pts, 0); const risk = Math.min(100, R.reduce((s, x) => s + x.pts, 0));
    const top = (arr) => arr.filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 3).map((x) => `${x.label}: ${x.text}`);
    const vipOn = value >= SCORE_RULES.vip.minValue && risk < SCORE_RULES.vip.maxRisk && orders >= SCORE_RULES.vip.minOrders && !(SCORE_RULES.vip.excludeSellers && sl.length);
    const cauOn = risk >= SCORE_RULES.caution.minRisk;
    return {
      scores: { value, risk, valueParts: V, riskParts: R, ver: SCORE_VER, day: today.toISOString().slice(0, 10) },
      autoFlags: {
        vip: { on: vipOn, reasons: vipOn ? [`가치 점수 ${value}점 (기준 ${SCORE_RULES.vip.minValue}점 이상), 주의 점수 ${risk}점`, ...top(V)] : [] },
        caution: { on: cauOn, reasons: cauOn ? [`주의 점수 ${risk}점 (기준 ${SCORE_RULES.caution.minRisk}점 이상)`, ...top(R)] : [] },
      },
    };
  }

  /* ── 고객 요약 계산 (주문·기록 목록 → 고객 문서). 이 PC 데이터로도, Firebase에서 읽은 데이터로도 같은 함수를 씀 ── */
  function aggregateCustomers(orders, inters) {
    const agg = {};
    const get = (cid, plat) => (agg[cid] = agg[cid] || { customerId: cid, platform: plat || null, platformCustomerKey: /^aladin_\d+$/.test(cid) ? cid.slice(7) : null,
      names: [], emails: [], emailsMasked: [], phones: [], addresses: {}, otherRecipients: [], saleOrderCount: 0, saleItemQty: 0, salesAmount: 0, cancelOrderCount: 0, cancelledItemQty: 0, sellerCancelQty: 0, lastSaleAt: null, cancelNoteCount: 0,
      returnCount: 0, firstOrderAt: null, lastOrderAt: null, orderIds: [], platforms: [], qnaCount: 0, reviewCount: 0, noteCount: 0, sheetFlags: null });
    for (const order of orders) {
      if (!order || !order.customerId) continue;
      const c = get(order.customerId, order.platform); const buyer = order.buyer || {}; const rc = order.recipient;
      c.platforms.push(order.platform); c.names.push(buyer.name); c.emails.push(buyer.email); c.emailsMasked.push(buyer.emailMasked); c.phones.push(buyer.phone1, buyer.phone2);
      if (rc && (rc.sameAsBuyer || (rc.name && rc.name === buyer.name))) c.phones.push(rc.phone1, rc.phone2); // 수령인=주문인이면 주문인 연락처
      if (rc && rc.address) {
        const ak = `${rc.zip}|${rc.address}`; const a = c.addresses[ak] = c.addresses[ak] || { zip: rc.zip, address: rc.address, recipientNames: [], recipientPhones: [], useCount: 0, lastUsedAt: null };
        a.recipientNames.push(rc.sameAsBuyer ? buyer.name : rc.name); a.recipientPhones.push(rc.phone1, rc.phone2);
        a.useCount += 1; if (!a.lastUsedAt || (order.orderedAt || '') > a.lastUsedAt) a.lastUsedAt = order.orderedAt;
      }
      if (rc && rc.name && !rc.sameAsBuyer && rc.name !== buyer.name) c.otherRecipients.push(rc.name); // 주문인과 다른 수령인 (대행·업자 판별 단서)
      c.orderIds.push(order._id || `${order.platform}_${order.orderNo}`);
      const items = order.items || [];
      if (order.kind === 'sale') {
        c.saleOrderCount += 1;
        const stp = shipTypeOf(order);
        if (stp === 'free') c.freeShipCount = (c.freeShipCount || 0) + 1; else if (stp === 'paid' || stp === 'remote') { c.paidShipCount = (c.paidShipCount || 0) + 1; c.shipPaidTotal = (c.shipPaidTotal || 0) + (order.shippingFee || 0); }
        items.forEach((it) => { if (it.lineStatus === 'normal') { c.saleItemQty += it.qty || 1; c.salesAmount += (it.price || 0) * (it.qty || 1); } else if (it.lineStatus === 'cancelledInOrder') c.sellerCancelQty += it.qty || 1; /* 우리 품절 취소: 고객 책임 아님 */ else if (/cancel/i.test(it.lineStatus || '')) c.cancelledItemQty += it.qty || 1; else if (it.lineStatus === 'returned') c.returnCount += 1; });
        if (order.orderedAt && (!c.lastSaleAt || order.orderedAt > c.lastSaleAt)) c.lastSaleAt = order.orderedAt;
      } else { c.cancelOrderCount += 1; c.cancelledItemQty += items.reduce((s, it) => s + (it.qty || 1), 0); }
      if (order.orderedAt) { if (!c.firstOrderAt || order.orderedAt < c.firstOrderAt) c.firstOrderAt = order.orderedAt; if (!c.lastOrderAt || order.orderedAt > c.lastOrderAt) c.lastOrderAt = order.orderedAt; }
    }
    for (const it of inters) {
      if (!it || !it.customerId) continue; const c = get(it.customerId, it.platform === 'gsheet' ? null : it.platform);
      if (it.type === 'qna') c.qnaCount += 1; else if (it.type === 'review') c.reviewCount += 1;
      if (it.platform === 'gsheet') { c.noteCount += 1; if (it.type === 'customerCancelNote') c.cancelNoteCount += 1; if (it.type === 'blacklistNote') c.sheetFlags = { ...(c.sheetFlags || {}), blacklist: { since: it.createdAt || null, reason: it.body || null, sheetRow: it.sheetRow || null } }; }
    }
    return Object.values(agg).map((c) => {
      const phones = uniq(c.phones); const names = uniq(c.names); const other = uniq(c.otherRecipients); const oids = uniq(c.orderIds);
      const base = { ...c, platforms: uniq(c.platforms), displayName: names[names.length - 1] || null, names, emails: uniq(c.emails), emailsMasked: uniq(c.emailsMasked), phones,
        phoneKeys: phones.map((x) => x.replace(/\D/g, '')), addresses: Object.values(c.addresses).map((a) => ({ ...a, recipientNames: uniq(a.recipientNames), recipientPhones: uniq(a.recipientPhones) })),
        otherRecipients: other, otherRecipientCount: other.length, orderIds: oids, orderCount: oids.length,
        unresolvedKey: !/^aladin_\d+$/.test(c.customerId), sellerLinks: sellerLinkMap.get(c.customerId) || [] };
      return { ...base, ...scoreCustomer(base) };
    });
  }
  function setSellerLinks(sellers) { sellerLinkMap = new Map(); sellers.forEach((s) => (s.linkedCustomers || []).forEach((l) => { const a = sellerLinkMap.get(l.customerId) || []; a.push({ name: s.name, grade: s.ourGrade || s.grade || null, aladinGrade: s.aladinGrade || null, reasons: l.reasons, level: l.level || null, strong: l.level ? l.level === 'match' : (l.reasons || []).some((r) => r !== '비슷한 이메일') }); sellerLinkMap.set(l.customerId, a); })); }
  async function loadSellerLinks() { try { const ss = await fdb.collection('sellers').get(); const arr = []; ss.forEach((d) => arr.push(d.data())); setSellerLinks(arr); } catch (e) {} }

  // 이 PC에 주문 데이터가 적으면(다른 PC가 주로 수집한 경우) 고객 연결에 쓸 주문을 Firebase에서 내려받음
  let serverOrdersCache = [];
  async function pullServerOrdersIfNeeded() {
    if (!fdb || !fbUser) return;
    try {
      const localN = new Set((await dbAll('orderLines')).map((l) => l.orderNo)).size;
      let serverN; try { serverN = (await fdb.collection('crm_orders').count().get()).data().count; } catch (e) { serverN = null; }
      if (serverN != null && serverN <= localN + 50) return;
      setNow('고객 연결을 위해 Firebase의 주문을 내려받는 중'); const snap = await fdb.collection('crm_orders').get();
      serverOrdersCache = []; snap.forEach((d) => serverOrdersCache.push({ _id: d.id, ...d.data() }));
      log(`이 PC의 주문(${localN.toLocaleString()}건)이 Firebase보다 적어, Firebase 주문 ${serverOrdersCache.length.toLocaleString()}건을 함께 써서 고객을 연결합니다.`);
    } catch (e) { log('Firebase 주문 내려받기 실패: ' + e.message, 'warn'); }
  }
  // 배송비 구분: 무료(우리 부담) / 유료(고객 부담) / 도서산간 / 모름(상세를 못 받은 주문)
  function shipTypeOf(o) {
    if (o.kind !== 'sale') return null; const f = o.shippingFee;
    if (f == null) return 'unknown'; if (f === 0) return 'free';
    if ((o.remoteFee && f >= o.remoteFee) || f >= 6000) return 'remote'; return 'paid';
  }
  // 수집 원본 + 엑셀 + 시트 → 올릴 문서들 (순수 계산, 저장소 읽기만)
  async function buildDocs() {
    const lines = await dbAll('orderLines'); const popups = new Map((await dbAll('popups')).map((p) => [p._key, p]));
    const returns = await dbAll('returns'); const qna = await dbAll('qnaDetail'); const reviews = await dbAll('reviews');
    const excel = await dbAll('excelLines'); const sheetRows = await dbAll('sheetRows'); const sellerRawAll = await dbAll('sellerRaw');
    const byOrder = {}; lines.forEach((l) => { const k = `${l.kind}|${l.orderNo}`; (byOrder[k] = byOrder[k] || []).push(l); });
    const saleOrders = new Set(lines.filter((l) => l.kind === 'sale').map((l) => l.orderNo));
    const scmOrders = new Set(lines.map((l) => l.orderNo));
    const exByOrder = {}; excel.forEach((x) => { if (x.orderNo) (exByOrder[x.orderNo] = exByOrder[x.orderNo] || []).push(x); });
    const docs = []; const orderDocs = [];
    const custIdOf = (p, ono) => (p && p.customerKey ? `aladin_${p.customerKey}` : `aladin_nokey_${ono}`);
    const retByOrder = {}; returns.forEach((r) => (retByOrder[r.orderNo] = retByOrder[r.orderNo] || []).push(r));

    // ① 샵매니저 주문 (+ 엑셀로 빈 개인정보 채움)
    for (const [k, ls] of Object.entries(byOrder)) {
      const [kind, ono] = k.split('|');
      if (kind === 'cancel' && saleOrders.has(ono)) continue;
      ls.sort((a, b) => (a.page - b.page) || (a.seq - b.seq));
      const p = popups.get(ono) || null;
      const m = p ? P.matchListToPopup(ls, p) : { lines: ls.map((r) => ({ row: r, item: null })) };
      const cancelLines = kind === 'sale' ? (byOrder[`cancel|${ono}`] || []) : [];
      const usedCancel = new Set(); const review = [];
      const items = m.lines.map(({ row, item }, i) => {
        const it = { lineNo: i + 1, title: row.title, rawTitle: item ? item.raw : row.rawTitle, condition: item ? item.condition : row.condition,
          option: item ? item.option : null, qty: row.qty, price: row.price, isbn13: item ? item.isbn13 : null, isbnAlt: item ? item.isbnAlt : null,
          sku: item ? item.sku : null, note: item ? item.note : null, popupCancelQty: item ? item.cancelQty || 0 : 0, listStatus: row.rowStatus, cancelQty: row.cancelQty, returnReason: row.returnReason,
          lineStatus: kind === 'cancel' ? 'cancelled' : 'normal' };
        if (kind === 'sale') {
          if (row.rowStatus && row.rowStatus !== '정상') it.lineStatus = 'check';
          if (row.cancelQty) it.lineStatus = row.cancelQty >= (row.qty || 1) ? 'cancelled' : 'partialCancelled';
          const ci = cancelLines.findIndex((c, j) => !usedCancel.has(j) && c.rawTitle === row.rawTitle && c.price === row.price && c.qty === row.qty);
          if (ci >= 0) { usedCancel.add(ci); it.lineStatus = 'cancelled'; it.cancelledAt = cancelLines[ci].cancelRequestedAt || null; }
          const rt = (retByOrder[ono] || []).find((r) => r.title === row.title && (!r.sku || !it.sku || r.sku === it.sku));
          if (rt) { it.returnClaimId = rt.claimId; it.itemId = rt.itemId; if (/완료/.test(rt.status || '')) it.lineStatus = 'returned'; else it.returnStatus = rt.status; }
        }
        return it;
      });
      cancelLines.forEach((c, j) => { if (!usedCancel.has(j)) review.push(`취소 목록의 '${c.title}' (${c.price}원 × ${c.qty})이 판매 줄과 정확히 맞지 않음`); });
      if (p && m.countMismatch) review.push(`목록 ${ls.length}줄 / 상세 ${m.activeItemCount ?? p.items.length}개`);
      if (p && m.leftoverItems && m.leftoverItems.length) m.leftoverItems.forEach((x) => items.push({ lineNo: items.length + 1, title: x.title, rawTitle: x.raw, condition: x.condition, option: x.option, qty: x.qty, cancelQty: x.cancelQty || 0, price: null, isbn13: x.isbn13, isbnAlt: x.isbnAlt, sku: x.sku, note: x.note,
        lineStatus: x.cancelled ? 'cancelledInOrder' : 'check', fromPopupOnly: true }));
      if (p && m.leftoverItems && m.leftoverItems.some((x) => !x.cancelled)) review.push('상세에만 있고 취소 표시도 없는 상품이 있음');
      const first = ls[0];
      const order = {
        _id: `aladin_${ono}`, platform: 'aladin', orderNo: ono, kind: kind === 'sale' ? 'sale' : 'cancelledBeforeSale', customerId: custIdOf(p, ono),
        orderedAt: first.orderedAt || (p && p.orderedDate) || null, paidAt: first.paidAt || null,
        shippedAt: (p && p.shipped && p.shipped.date) || (first.shipped && first.shipped.date) || null,
        shippedRaw: (first.shipped && first.shipped.raw) || (p && p.shipped && p.shipped.raw) || null,
        cancelRequestedAt: kind === 'cancel' ? first.cancelRequestedAt || null : null,
        stage: p ? p.stage : null, orderStatus: p ? p.orderStatus : null, invoiceNo: p ? p.invoiceNo : null,
        totalAmount: p ? p.totalAmount : null, fee: p ? p.fee : null, shippingFee: p ? p.shippingFee : null, ...(p && p.freeRuleText ? { freeRuleText: p.freeRuleText } : {}), ...(p && p.remoteFee ? { remoteFee: p.remoteFee } : {}),
        buyer: p && p.buyer ? { ...p.buyer, emailMasked: first.buyerEmailMasked || null } : { name: first.buyerName || null, email: null, emailMasked: first.buyerEmailMasked || null, phone1: null, phone2: null },
        recipient: p && p.recipient ? p.recipient : (first.recipient && (first.recipient.address || first.recipient.phone2) ? { name: first.recipient.name, phone1: first.recipient.phone1, phone2: first.recipient.phone2, zip: first.recipient.zip, address: first.recipient.address } : null),
        recipientSameAsBuyer: p ? p.recipientSameAsBuyer : null,
        shippingRequest: (p && p.shippingRequest) || (first.recipient && first.recipient.shippingRequest) || null,
        rowNotes: uniq(ls.map((l) => l.rowNote)),
        items, reviewNeeded: review, piiSource: p && p.piiAvailable ? 'scm' : null,
        piiCollectedAt: p ? p.piiCollectedAt || null : null, source: { scmCollectedAt: first.collectedAt, popupCollectedAt: p ? p.collectedAt : null },
      };
      // 작은 정보도 보관: 목록에 남은 수령인 이름('상동'이면 주문인과 같음)
      if (!order.recipient && first.recipientLabel) {
        if (first.recipientLabel === '상동') { order.recipient = { name: null, phone1: null, phone2: null, zip: null, address: null }; order.recipientSameAsBuyer = true; }
        else order.recipient = { name: first.recipientLabel, phone1: null, phone2: null, zip: null, address: null };
        if (order.recipientSameAsBuyer == null) order.recipientSameAsBuyer = first.recipientLabel === '상동' || first.recipientLabel === order.buyer.name;
      }
      // 엑셀 병합: 샵매니저가 지운 수령인 정보 채우기, 상품 보조 정보 붙이기
      const ex = exByOrder[ono] || [];
      if (ex.length) {
        const x0 = ex[0];
        if (!order.recipient || !order.recipient.address) {
          order.recipient = { name: x0.recipientName, phone1: x0.phone1, phone2: x0.phone2, zip: x0.zip, address: x0.address };
          order.recipientSameAsBuyer = !!(x0.recipientName && x0.recipientName === (order.buyer.name || x0.buyerName)); order.piiSource = 'excel';
        }
        if (!order.shippingRequest) order.shippingRequest = x0.shippingRequest;
        if (!order.buyer.name) order.buyer.name = x0.buyerName;
        const used = new Set();
        order.items.forEach((it) => {
          const j = ex.findIndex((x, n) => !used.has(n) && normTitle(x.title) === normTitle(it.title) && (x.price == null || it.price == null || x.price === it.price));
          if (j < 0) return; used.add(j); const x = ex[j];
          Object.assign(it, { publisher: x.publisher || null, aladinUsedCode: x.aladinUsedCode || null, isbn13: it.isbn13 || x.isbn13, isbnAlt: it.isbnAlt || x.isbnAlt, sku: it.sku || x.sku });
          if (x.status && x.status !== '정상') it.excelNote = x.status;
        });
        ex.forEach((x, n) => { if (!used.has(n)) review.push(`엑셀에만 있는 상품: '${x.title}' ${x.price}원`); });
        const notes = uniq(ex.flatMap((x) => [x.memo, x.note, ...(x.cellNotes || []), x.status && x.status !== '정상' ? x.status : null]));
        if (notes.length) order.excelNotes = notes;
        if (order.kind !== 'sale') review.push('엑셀에는 판매로 기록되어 있으나 샵매니저에서는 취소된 주문');
        order.source.excel = true;
      }
      if (order.recipientSameAsBuyer && order.recipient) { // 주문인=수령인 → 주문인 하나로 통합 (연락처는 주문인 쪽으로)
        if (!order.buyer.phone1 && !order.buyer.phone2) { order.buyer.phone1 = order.recipient.phone1; order.buyer.phone2 = order.recipient.phone2; }
        order.recipient = { name: null, phone1: null, phone2: null, zip: order.recipient.zip, address: order.recipient.address, sameAsBuyer: true };
      }
      order.itemCount = order.items.length; // 배송비 구분은 배송비 값으로 계산 (따로 저장하지 않아 기존 주문을 다시 올리지 않음)
      orderDocs.push({ order, pKey: p && p.customerKey ? p.customerKey : null });
    }

    // 전화번호 → 고객 (엑셀 전용 주문을 기존 고객에 연결하는 데 사용)
    const phoneToCust = {};
    const notePhones = (o) => { const r = o.recipient || {}; const same = r.sameAsBuyer || (r.name && r.name === o.buyer.name);
      [o.buyer.phone1, o.buyer.phone2, same ? r.phone1 : null, same ? r.phone2 : null].filter(Boolean).forEach((ph) => { const k = ph.replace(/\D/g, ''); (phoneToCust[k] = phoneToCust[k] || new Set()).add(o.customerId); }); };
    orderDocs.forEach(({ order }) => notePhones(order)); serverOrdersCache.forEach((o) => { if (o && o.buyer) notePhones(o); });

    // ② 엑셀에만 있는 주문 (수집 기간 밖, 예스24, 직접 판매)
    const exOnly = {}; excel.forEach((x) => { if (x.orderNo && scmOrders.has(x.orderNo)) return; const k = x.orderNo || `direct_${(x.orderedAt || '').slice(0, 16)}_${x.recipientName || x.buyerName || ''}`; (exOnly[k] = exOnly[k] || []).push(x); });
    for (const [k, xs] of Object.entries(exOnly)) {
      const x0 = xs[0]; const plat = x0.platform === 'unknown' ? 'aladin' : x0.platform;
      const idBase = String(k).replace(/[\/\s]/g, '_');
      const same = !!(x0.recipientName && x0.recipientName === x0.buyerName);
      const phKeys = [x0.phone1, x0.phone2].filter(Boolean).map((p) => p.replace(/\D/g, ''));
      const cands = [...new Set(phKeys.flatMap((p) => [...(phoneToCust[p] || [])]))];
      const cid = same && cands.length === 1 ? cands[0] : phKeys.length && same ? `phone_${phKeys[phKeys.length - 1]}` : `excel_nokey_${hashStr(idBase).split(':')[0]}`;
      const order = { _id: `${plat}_${idBase}`, platform: plat, orderNo: x0.orderNo, kind: 'sale', customerId: cid, orderedAt: x0.orderedAt, paidAt: x0.paidAt, shippedAt: null, shippedRaw: null,
        stage: null, orderStatus: null, invoiceNo: null, totalAmount: xs.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0), fee: xs.reduce((s, x) => s + (x.fee || 0), 0), shippingFee: null,
        buyer: { name: x0.buyerName, email: null, emailMasked: null, phone1: null, phone2: null },
        recipient: same ? { name: null, phone1: null, phone2: null, zip: x0.zip, address: x0.address, sameAsBuyer: true } : { name: x0.recipientName, phone1: x0.phone1, phone2: x0.phone2, zip: x0.zip, address: x0.address },
        recipientSameAsBuyer: same, shippingRequest: x0.shippingRequest,
        items: xs.map((x, i) => ({ lineNo: i + 1, title: x.title, rawTitle: x.rawTitle, condition: null, qty: x.qty, price: x.price, isbn13: x.isbn13, isbnAlt: x.isbnAlt, sku: x.sku, publisher: x.publisher, aladinUsedCode: x.aladinUsedCode,
          lineStatus: 'normal', excelNote: x.status && x.status !== '정상' ? x.status : null })),
        reviewNeeded: [...(plat === 'aladin' ? ['샵매니저 수집 기간 밖의 주문 (엑셀 기록만 있음)'] : []), ...(xs.some((x) => x.manual) ? ['날짜 없이 손으로 적은 엑셀 기록'] : [])], piiSource: 'excel',
        excelNotes: uniq(xs.flatMap((x) => [x.memo, x.note, ...(x.cellNotes || []), x.status && x.status !== '정상' ? x.status : null])), source: { excel: true } };
      if (same) order.buyer.phone1 = null;
      order.itemCount = order.items.length;
      if (same) { order.recipient.phone1 = null; }
      // 수령인=주문인이면 연락처를 주문인 쪽으로
      if (same) { order.buyer.phone1 = x0.phone1; order.buyer.phone2 = x0.phone2; }
      orderDocs.push({ order, pKey: null });
    }

    for (const { order } of orderDocs) docs.push({ col: 'crm_orders', id: order._id, data: order });

    // ③ 묻고 답하기·구매평·반품
    const orderCust = {}; orderDocs.forEach(({ order }) => { if (order.orderNo) orderCust[order.orderNo] = order.customerId; });
    const qListMap = new Map((await dbAll('qnaList')).map((r) => [r._key, r]));
    // 답변여부: 샵매니저 묻고 답하기 목록의 행 5번째 칸(관리 버튼 앞)을 그대로 — 예: Yes, 취소된 질문
    for (const q of qna) {
      const cid = q.customerKey ? `aladin_${q.customerKey}` : null; const ql = qListMap.get(q._key) || {};
      docs.push({ col: 'crm_interactions', id: `aladin_qna_${q._key}`, data: { type: 'qna', platform: 'aladin', questionId: q._key, customerId: cid, orderId: q.orderNo ? `aladin_${q.orderNo}` : null,
        itemId: q.itemId, title: q.title, condition: q.condition, authorMasked: q.authorMasked, body: q.question, answer: q.answer, answerStatus: ql.answered ?? null, createdAt: q.createdDate, source: { scmCollectedAt: q.collectedAt } } });
    }
    for (const r of reviews) {
      const cid = orderCust[r.orderNo] || null; const n = r._key.split('|').pop();
      docs.push({ col: 'crm_interactions', id: `aladin_review_${r.orderNo}_${hashStr(r._key).split(':')[0]}_${n}`, data: { type: 'review', platform: 'aladin', customerId: cid, orderId: `aladin_${r.orderNo}`,
        title: r.title, condition: r.condition, rating: r.rating, body: r.comment, authorMasked: r.authorMasked, createdAt: r.createdDate, source: { scmCollectedAt: r.collectedAt } } });
    }
    for (const r of returns) {
      docs.push({ col: 'crm_orderEvents', id: `aladin_return_${r.claimId}`, data: { type: 'return', platform: 'aladin', orderId: `aladin_${r.orderNo}`, customerId: orderCust[r.orderNo] || null,
        claimId: r.claimId, itemId: r.itemId, title: r.title, condition: r.condition, sku: r.sku, registeredAt: r.registeredAt, price: r.price, qty: r.qty, reason: r.reason, status: r.status, tab: r.tab,
        requestedAt: r.requestedAt, approvedAt: r.approvedAt, completedAt: r.completedAt, history: r.history, firstSeenAt: r.firstSeenAt, lastSeenAt: r.lastSeenAt } });
    }

    // ④ 구글 시트 행 → 고객 연결 (확실한 것만 자동, 나머지는 '연결 대기')
    const idx = { phone: {}, email: {}, local: {}, name: {}, isbn: {}, title: {} };
    const addIdx = (m, k, cid) => { if (!k) return; (m[k] = m[k] || new Set()).add(cid); };
    for (const order of [...orderDocs.map((x) => x.order), ...serverOrdersCache.filter((o) => o && o.buyer)]) {
      const cid = order.customerId; const r = order.recipient || {};
      [order.buyer.phone1, order.buyer.phone2, r.phone1, r.phone2].filter(Boolean).forEach((p) => addIdx(idx.phone, p.replace(/\D/g, ''), cid));
      if (order.buyer.email) { addIdx(idx.email, order.buyer.email.toLowerCase(), cid); addIdx(idx.local, order.buyer.email.split('@')[0].toLowerCase(), cid); }
      if (order.buyer.emailMasked) addIdx(idx.local, order.buyer.emailMasked.split('@')[0].toLowerCase(), cid);
      [order.buyer.name, r.name].filter(Boolean).forEach((n) => addIdx(idx.name, n.replace(/\(.*\)/, '').trim(), cid));
      order.items.forEach((it) => { addIdx(idx.isbn, it.isbn13, cid + '|' + (order.orderedAt || '')); addIdx(idx.title, normTitle(it.title), cid + '|' + (order.orderedAt || '')); });
    }
    const qnaByTitle = {}; qna.forEach((q) => { if (q.customerKey && q.title) (qnaByTitle[normTitle(q.title)] = qnaByTitle[normTitle(q.title)] || []).push(q); });
    const pending = [];
    // ── 판매자: 툴팁 데이터(판매자 번호 SC 기준) + 구글 시트(이름 기준, 우리 분류: 전문·개인·허위 매물)를 이름으로 합침
    {
      // 주소 비교: 띄어쓰기·기호를 뺀 전체가 같으면 '일치', 앞부분(시·구·도로명)만 같고 동·호수 등이 다르면 '일치 의심'
      const normA = (a) => String(a || '').replace(/[\s,.()\-]/g, '').toLowerCase();
      const addrFull = {}; const addrMap = {};
      orderDocs.forEach(({ order }) => { const a = normA((order.recipient || {}).address); if (a.length > 12) { (addrFull[a] = addrFull[a] || new Set()).add(order.customerId); (addrMap[a.slice(0, 16)] = addrMap[a.slice(0, 16)] || new Set()).add(order.customerId); } });
      const addrKeysByPrefix = {}; Object.keys(addrFull).forEach((a) => (addrKeysByPrefix[a.slice(0, 16)] = addrKeysByPrefix[a.slice(0, 16)] || []).push(a));
      const linkOf = (f) => {
        const links = new Map(); const addL = (cid, why, level) => { const v = links.get(cid) || { reasons: [], level: 'suspect' }; v.reasons.push(why); if (level === 'match') v.level = 'match'; links.set(cid, v); };
        [f.phone, f.asPhone].filter(Boolean).forEach((ph) => { const k = String(ph).replace(/\D/g, ''); if (k.length >= 9) (idx.phone[k] || []).forEach((cid) => addL(cid, '전화번호 같음', 'match')); });
        if (f.email) {
          (idx.email[String(f.email).toLowerCase()] || []).forEach((cid) => addL(cid, '이메일 같음', 'match'));
          const lp = String(f.email).split('@')[0].toLowerCase().replace(/\d+$/, '');
          if (lp.length >= 5) (idx.localStem[lp] || []).forEach((cid) => { if (!links.has(cid) || links.get(cid).level !== 'match') addL(cid, '이메일 앞부분이 비슷함', 'suspect'); });
        }
        const ra = normA(f.returnAddress);
        if (ra.length > 12) {
          (addrKeysByPrefix[ra.slice(0, 16)] || []).forEach((a) => {
            const exact = a === ra || (Math.min(a.length, ra.length) >= 25 && (a.startsWith(ra) || ra.startsWith(a)));
            addrFull[a].forEach((cid) => addL(cid, exact ? '반품 주소 = 우리고객 배송지' : '반품 주소가 우리고객 배송지와 비슷함 (동·호수 등 다름)', exact ? 'match' : 'suspect'));
          });
        }
        if (f.owner) (idx.name[f.owner] || []).forEach((cid) => { if (links.has(cid)) addL(cid, '대표자 이름 같음', links.get(cid).level); });
        return [...links.entries()].map(([cid, v]) => ({ customerId: cid, reasons: uniq(v.reasons), level: v.level }));
      };
      idx.localStem = {}; Object.entries(idx.local).forEach(([k2, set]) => { const st = k2.replace(/[\d*.]+$/, ''); if (st.length >= 5) set.forEach((cid) => addIdx(idx.localStem, st, cid)); });
      const normName = (n) => String(n || '').split(/\n/)[0].replace(/\s+/g, '').replace(/(전문셀러|파워셀러|골드셀러|실버셀러|새내기셀러)$/, '').toLowerCase();
      const sheetS = sheetRows.filter((x) => x.type === 'seller'); const sheetByName = new Map(sheetS.map((x) => [normName(x.name), x])); const usedSheet = new Set();
      for (const raw of sellerRawAll) {
        const { lean, history } = tooltipSellerDocs(raw); const sh = sheetByName.get(normName(lean.name));
        if (sh) usedSheet.add(sh._key);
        const doc = { ...lean, ourGrade: sh ? sh.grade : null, sheet: sh ? { sheet: sh.sheet, sheetRow: sh.sheetRow, remark: sh.remark, rating6m: sh.rating6m, reviews6m: sh.reviews6m, bad6m: sh.bad6m, actualDays: sh.actualDays, lowPrice: sh.lowPrice, stock: sh.stock } : null };
        doc.linkedCustomers = linkOf({ phone: doc.phone || (sh && sh.phone), asPhone: doc.asPhone || (sh && sh.asPhone), email: doc.email || (sh && sh.email), returnAddress: doc.returnAddress || (sh && sh.returnAddress), owner: doc.owner || (sh && sh.owner) });
        docs.push({ col: 'sellers', id: `sc_${raw._sc}`, data: doc });
        docs.push({ col: 'seller_history', id: `sc_${raw._sc}`, data: history });
      }
      for (const s of sheetS) {
        if (usedSheet.has(s._key)) continue;
        const { _key, importedAt, fileName, type, grade, ...rest } = s;
        docs.push({ col: 'sellers', id: `sheet_${_key.replace(/^seller_/, '')}`, data: { ...rest, ourGrade: grade, source: 'gsheet', linkedCustomers: linkOf(s) } });
      }
    }
    for (const s of sheetRows.filter((x) => x.type !== 'seller')) {
      const score = {};

 const why = {}; const add = (cid, n, w) => { score[cid] = (score[cid] || 0) + n; (why[cid] = why[cid] || []).push(w); };
      const phones = s.phones || []; phones.forEach((p) => (idx.phone[p.replace(/\D/g, '')] || []).forEach((cid) => add(cid, 3, '전화')));
      const em = (s.email || '').toLowerCase();
      if (/@[\w-]+\./.test(em)) (idx.email[em] || []).forEach((cid) => add(cid, 3, '이메일'));
      else if (em.includes('@')) { const lp = em.split('@')[0]; Object.entries(idx.local).forEach(([k, set]) => { if (lp.length >= 4 && (k.startsWith(lp) || lp.startsWith(k.replace(/\*+$/, '')))) set.forEach((cid) => add(cid, 2, '이메일 앞부분')); }); }
      const nm = s.name || s.buyerName || s.recipientName; if (nm) (idx.name[nm] || []).forEach((cid) => add(cid, 1, '이름'));
      (s.items || []).forEach((it) => {
        const hits = [...(it.isbn13 ? idx.isbn[it.isbn13] || [] : []), ...(idx.title[normTitle(it.title)] || [])];
        new Set(hits.map((h) => h.split('|')[0])).forEach((cid) => add(cid, 2, '구매 상품'));
      });
      if (s.idMasked && s.items && s.items[0]) (qnaByTitle[normTitle(s.items[0].title)] || []).forEach((q) => { if (q.authorMasked && s.idMasked.slice(0, 2) === q.authorMasked.slice(0, 2)) add(`aladin_${q.customerKey}`, 3, '문의 기록'); });
      const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
      let status = 'none'; let cid = null;
      if (ranked.length && ranked[0][1] >= 3 && (!ranked[1] || ranked[1][1] < ranked[0][1])) { status = 'matched'; cid = ranked[0][0]; }
      else if (ranked.length) status = 'pending';
      const cands = ranked.slice(0, 3).map(([c, sc]) => ({ customerId: c, score: sc, reasons: uniq(why[c]) }));
      const type = { blacklist: 'blacklistNote', customerCancel: 'customerCancelNote', otherCustomer: 'adminNote' }[s.type];
      docs.push({ col: 'crm_interactions', id: `gsheet_${s._key}`, data: { type, platform: 'gsheet', sheet: s.sheet, sheetRow: s.sheetRow, customerId: cid, matchStatus: status, matchReason: cid ? uniq(why[cid]) : null, candidates: cands,
        createdAt: s.date, title: s.items && s.items[0] ? s.items[0].title : null, items: s.items, body: s.reason || s.body || s.note || null, scope: s.scope || null,
        name: nm || null, email: s.email || null, phones, address: s.address || null, idMasked: s.idMasked || null, raw: s.raw } });
      if (status === 'pending') pending.push(s._key);
    }

    const inters = docs.filter((d) => d.col === 'crm_interactions').map((d) => d.data);
    if (docs.some((d) => d.col === 'sellers')) setSellerLinks(docs.filter((d) => d.col === 'sellers').map((d) => d.data));
    for (const c of aggregateCustomers(orderDocs.map((x) => x.order), inters)) docs.push({ col: 'crm_customers', id: c.customerId, data: c });
    buildDocs.lastPending = pending.length;
    return docs.map((d) => ({ ...d, data: clean(d.data) }));
  }

  /* ── 엑셀·시트 파일 읽기 (브라우저 안에서만) ── */
  async function readWorkbook(file) {
    if (typeof XLSX === 'undefined') throw new Error('엑셀 읽기 도구(SheetJS)를 불러오지 못했습니다. 새로고침해 주세요.');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const out = {}; wb.SheetNames.forEach((n) => { out[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }); });
    return out;
  }
  /* ── 판매자 툴팁 데이터(예전 Realtime Database 내보내기 JSON) → 통합 프로젝트의 판매자 기록 ── */
  const numK = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : null; };
  function tooltipSellerDocs(raw) {
    const snaps = Object.values(raw.snapshots || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
    const last = snaps[snaps.length - 1] || {}; const lastWithRating = [...snaps].reverse().find((x) => x.rating) || {};
    const lastCats = [...snaps].reverse().find((x) => x.domesticCategories) || {};
    const quick = Object.values(raw.quickUpdates || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
    const lq = quick[quick.length - 1] || null; const co = raw.company || {};
    const nameParts = String(co.name || '').split(/\s*,\s*/);
    const pct = (v) => { const n = numK(v); return n == null ? null : n > 1 ? n / 100 : n; };
    const lean = {
      sc: raw._sc, name: last.sellerName || null, aladinGrade: last.sellerGrade || null, logo: last.logo || null,
      totalItems: numK(last.totalItems), domesticBooks: numK(last.domesticBookCount), foreignBooks: numK(last.foreignBookCount), music: numK(last.musicCount), video: numK(last.videoCount),
      rating: pct(lq && lq.rowRating ? lq.rowRating : lastWithRating.rating), reviewCount: numK(lastWithRating.reviewCount), totalReviewCount: numK(last.totalReviewCount),
      outstockRate: numK(lastWithRating.outstockRate ?? last.outstockRate), shippingDays: numK(last.shippingDays), freeShipping: numK(last.freeShipping),
      shippingFee: lq && lq.rowShippingFee != null ? lq.rowShippingFee : numK(last.shippingFee), notices: (last.notices || []).filter((x) => x && x !== '공지 없음').slice(0, 3),
      categories: (lastCats.domesticCategories || []).map((c) => ({ name: c.name, count: numK(c.count) })).filter((c) => c.count).sort((a, b) => b.count - a.count).slice(0, 8),
      company: nameParts[0] || null, owner: nameParts[1] || null, phone: co.phone || null, asPhone: co.asPhone || null, email: co.email || null, bizNo: co.bizRegNo || null,
      mailOrderNo: co.mailOrderNo || null, address: co.address || null, courier: co.courier || null, returnAddress: co.returnAddress || null, notice: co.noticeIntro || null,
      firstReviewDate: co.firstReviewDate || null, snapshotCount: snaps.length, quickCount: quick.length,
      lastFetchedAt: Math.max(last.fetchedAt || 0, lq ? lq.fetchedAt || 0 : 0) || null, source: 'tooltip',
    };
    const history = {
      sc: raw._sc,
      snapshots: snaps.map((x) => ({ t: x.fetchedAt || null, items: numK(x.totalItems), rating: pct(x.rating), reviews: numK(x.reviewCount), total: numK(x.totalReviewCount), outstock: numK(x.outstockRate), fee: numK(x.shippingFee), free: numK(x.freeShipping), grade: x.sellerGrade || null })),
      quick: quick.slice(-400).map((x) => ({ t: x.fetchedAt || null, rating: pct(x.rowRating), fee: x.rowShippingFee ?? null })),
    };
    return { lean, history };
  }
  async function importSellerJson(data, file) {
    const sellers = data.sellers || {}; const now2 = now();
    const rows = Object.entries(sellers).map(([sc, v]) => ({ _key: sc, _sc: sc, ...v, importedAt: now2, fileName: file.name }));
    await dbPut('sellerRaw', rows);
    const summary = `판매자 ${rows.length.toLocaleString()}곳 (스냅샷·평점 기록 포함)`;
    await dbPut('meta', { _key: 'import_sellerjson', fileName: file.name, at: now2, summary });
    log(`판매자 툴팁 데이터: ${summary}`, 'ok'); return summary;
  }

  // 파일 종류를 내용으로 알아봄: 판매완료 엑셀(두 번째 열 '주문번호') / 고객 구글 시트(고객 시트 이름)
  function detectKind(sheets) {
    const names = Object.keys(sheets).map((n) => n.replace(/\s/g, ''));
    if (names.some((n) => ['고객취소목록', '블랙리스트', '기타고객'].includes(n))) return 'sheet';
    const first = sheets[Object.keys(sheets)[0]] || [];
    if (first[0] && String(first[0][1] || '').trim() === '주문번호') return 'sales';
    return null;
  }
  async function importSalesSheets(sheets, file) {
    const first = sheets[Object.keys(sheets)[0]];
    const { lines, dup, skipped, realigned, manual } = parseSalesExcel(first);
    const now2 = now(); await dbPut('excelLines', lines.map((l) => ({ ...l, importedAt: now2, fileName: file.name })));
    const inScm = new Set((await dbAll('orderLines')).map((l) => l.orderNo)); const orders = new Set(lines.map((l) => l.orderNo || 'x'));
    const only = [...orders].filter((o) => !inScm.has(o)).length;
    const summary = `${lines.length.toLocaleString()}줄 정리 (어긋난 ${realigned.toLocaleString()}줄 자동 맞춤, 수기 기록 ${manual}줄 보관, 중복 ${dup}줄 제외). 샵매니저에 없던 주문 ${only}건 추가`;
    await dbPut('meta', { _key: 'import_sales', fileName: file.name, at: now2, summary });
    log(`판매완료 엑셀: ${summary}`, 'ok'); return summary;
  }
  async function importSheetSheets(sheets, file) {
    const { rows } = parseCustomerSheets(sheets);
    const now2 = now(); await dbPut('sheetRows', rows.map((r) => ({ ...r, importedAt: now2, fileName: file.name })));
    const by = {}; rows.forEach((r) => (by[r.sheet] = (by[r.sheet] || 0) + 1));
    const docs = await buildDocs(); const cnt = { matched: 0, pending: 0, none: 0 }; docs.filter((d) => d.data.platform === 'gsheet').forEach((d) => cnt[d.data.matchStatus]++);
    const summary = `${Object.entries(by).map(([k, v]) => `${k} ${v}행`).join(', ')}. 고객 자동 연결 ${cnt.matched}건, 연결 대기 ${cnt.pending}건, 후보 없음 ${cnt.none}건`;
    await dbPut('meta', { _key: 'import_sheet', fileName: file.name, at: now2, summary, pending: cnt.pending + cnt.none });
    log(`고객 구글 시트: ${summary}`, cnt.pending + cnt.none ? 'warn' : 'ok'); return summary;
  }
  // 파일 넣기 → ① 읽기 → ② 이 PC에 정리 → ③ Firebase에 올리기 (로그인되어 있으면 자동)
  let impBusy = false;
  function setStep(n, state, text) { const li = $(`.isteps li[data-n="${n}"]`); li.className = state; if (text != null) li.querySelector('small').textContent = text; }
  async function handleImportFiles(files) {
    if (impBusy || running) { alert('다른 작업이 진행 중입니다. 끝난 뒤 다시 넣어 주세요.'); return; }
    files = [...files].filter((f) => /\.(xlsx?|json)$/i.test(f.name));
    if (!files.length) { alert('.xlsx 엑셀 파일이나 판매자 툴팁 .json 파일만 넣을 수 있습니다.'); return; }
    impBusy = true; $('.isteps').classList.add('on'); [1, 2, 3].forEach((n) => setStep(n, 'wait', ''));
    let ok = 0;
    try {
      setStep(1, 'doing', files.map((f) => f.name).join(', '));
      const loaded = [];
      for (const f of files) {
        if (/\.json$/i.test(f.name)) { let j = null; try { j = JSON.parse(await f.text()); } catch (e) {} loaded.push({ f, json: j, kind: j && j.sellers && typeof j.sellers === 'object' ? 'sellerjson' : null }); continue; }
        const sh = await readWorkbook(f); loaded.push({ f, sh, kind: detectKind(sh) });
      }
      const allBad = loaded.every((x) => !x.kind);
      setStep(1, allBad ? 'error' : 'done', loaded.map((x) => `${x.f.name}: ${x.kind === 'sales' ? '판매완료 엑셀' : x.kind === 'sheet' ? '고객·판매자 구글 시트' : x.kind === 'sellerjson' ? '판매자 툴팁 데이터' : '알 수 없는 파일이라 건너뜀'}`).join(' / '));
      if (allBad) return;
      setStep(2, 'doing', '정리하는 중'); await pullServerOrdersIfNeeded();
      const out = [];
      for (const x of loaded) { if (x.kind === 'sales') { out.push('판매완료 엑셀: ' + await importSalesSheets(x.sh, x.f)); ok++; } if (x.kind === 'sheet') { out.push('고객 구글 시트: ' + await importSheetSheets(x.sh, x.f)); ok++; } if (x.kind === 'sellerjson') { out.push('판매자 툴팁: ' + await importSellerJson(x.json, x.f)); ok++; } }
      setStep(2, 'done', out.join(' / '));
      await refreshStats(true); await renderImportStatus();
    } catch (e) { log('가져오기 실패: ' + e.message, 'err'); setStep(2, 'error', e.message); return; }
    finally { impBusy = false; render(); }
    if (!ok) return;
    if (fbUser && settings.autoUpload) {
      setStep(3, 'doing', 'Firebase에 올리는 중');
      const t0 = Date.now(); await start('upload');
      const lu = await dbGet('meta', 'lastUpload'); const fine = lu && Date.parse(lu.at) >= t0 - 1000;
      setStep(3, fine ? 'done' : 'error', fine ? `올리기 완료 (${lu.count.toLocaleString()}개). 모든 과정이 끝났습니다.` : '올리기가 중간에 멈췄습니다. 이미 올라간 것은 그대로 있고, 이어하기를 누르면 남은 것부터 올립니다.');
    } else setStep(3, 'need', fbUser ? "자동 올리기가 꺼져 있습니다. 위의 'Firebase로 올리기'를 눌러 주세요." : "구글 로그인 후 위의 'Firebase로 올리기'를 눌러야 반영됩니다.");
  }
  async function renderImportStatus() {
    const fmt = (m) => (m ? `${m.fileName} (${new Date(m.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})<br>${m.summary}` : '아직 가져오지 않음');
    $('.ist-sales').innerHTML = fmt(await dbGet('meta', 'import_sales'));
    $('.ist-sheet').innerHTML = fmt(await dbGet('meta', 'import_sheet'));
    $('.ist-sjson').innerHTML = fmt(await dbGet('meta', 'import_sellerjson'));
  }



  /* ── Firebase 무료 한도: 하루 쓰기 2만 건, 미국 서부 자정(한국 오후 4시, 서머타임이 끝나면 오후 5시)에 초기화 ── */
  const FREE_WRITES = 20000; const WRITE_MARGIN = 500;
  // 유료(Blaze): 무료 한도를 넘어도 계속 쓰되, 코드 실수로 무한히 쓰는 사고를 막는 '하루 안전 상한'에서 멈춤
  // 무료 크레딧 기간(기본 2026-12-29까지)에는 상한 없이 쓰고, 그 뒤부터 하루 안전 상한 적용
  const noCapNow = () => settings.billing === 'paid' && settings.noCapUntil && todayKst() <= settings.noCapUntil;
  const writeCap = () => (settings.billing === 'paid' ? (noCapNow() ? Infinity : Math.max(1000, settings.dailyWriteCap || 200000)) : FREE_WRITES - WRITE_MARGIN);
  function quotaDay() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); } // 한도 기준 날짜
  function nextResetAt() {
    const la = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const mid = new Date(la); mid.setHours(24, 0, 0, 0); return new Date(Date.now() + (mid - la));
  }
  function resetText() {
    const t = nextResetAt(); const mins = Math.max(0, Math.round((t - Date.now()) / 60000));
    const hm = t.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
    return `${t.getDate() === new Date().getDate() ? '오늘' : '내일'} ${hm} (${Math.floor(mins / 60)}시간 ${mins % 60}분 뒤)`;
  }
  async function writesToday() { const m = await dbGet('meta', 'writes'); const local = m && m.day === quotaDay() ? m.count : 0; return Math.max(local, sharedUsage && sharedUsage.day === quotaDay() ? sharedUsage.writes : 0); }
  async function addWrites(n) { const day = quotaDay(); const m = await dbGet('meta', 'writes'); const same = m && m.day === day; await dbPut('meta', { _key: 'writes', day, count: (same ? m.count : 0) + n, hitLimit: same ? !!m.hitLimit : false, hitAt: same ? m.hitAt || null : null }); }
  async function markLimitHit() { const day = quotaDay(); const m = await dbGet('meta', 'writes'); const same = m && m.day === day; await dbPut('meta', { _key: 'writes', day, count: same ? m.count : 0, hitLimit: true, hitAt: now() }); }
  async function limitHitToday() { const m = await dbGet('meta', 'writes'); return !!(m && m.day === quotaDay() && m.hitLimit) || !!(sharedUsage && sharedUsage.day === quotaDay() && sharedUsage.hitLimit); }
  // commit이 멈춘 채 대답이 없으면(한도 초과 시 Firebase가 조용히 재시도함) 일정 시간 뒤 일시정지. 일시정지 버튼도 즉시 반영.
  async function commitWatched(b, limitSec) {
    let settled = false; let err = null; const pr = b.commit().then(() => { settled = true; }, (e) => { settled = true; err = e; });
    const t0 = Date.now();
    while (!settled) {
      await Promise.race([pr, sleep(1000)]);
      if (settled) break;
      if (pauseRequested) throw new StopSignal('PAUSED', '일시정지했습니다. 이어하기를 누르면 남은 것부터 올립니다.');
      const sec = Math.round((Date.now() - t0) / 1000);
      if (sec > 5) setNow(`Firebase 응답 기다리는 중 (${sec}초). 한도 초과나 연결 문제일 수 있습니다.`);
      if (sec >= limitSec) { await markLimitHit(); throw new StopSignal('FBSTALL', `Firebase가 ${limitSec}초 넘게 응답하지 않아 멈췄습니다. 가장 흔한 원인은 오늘 무료 쓰기 한도(2만 건) 초과입니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 것부터 올립니다. 인터넷 연결 문제라면 연결 확인 후 바로 이어하기를 누르세요.`); }
    }
    if (err) throw err;
  }

  /* ════════ 여러 PC에서 안전하게 쓰기 위한 장치 ════════
   * ① 작업 잠금: 한 번에 한 PC만 수집·올리기 (1분마다 신호, 5분 끊기면 자동 해제)
   * ② 오늘 사용량·한도 도달을 Firebase에 공유 (모든 PC가 같은 숫자를 봄)
   * ③ 수집 완료 기록 공유 (어느 PC든 이어서 갱신 수집)
   * ④ 올릴 때 Firebase의 기존 내용과 합침: 빈 값·일부만 가진 데이터로 기존 정보를 지우지 않음
   * ⑤ 고객 요약은 Firebase의 전체 주문으로 다시 계산 (PC마다 가진 데이터가 달라도 정확)
   */
  const WRITER_SCHEMA = 6; // Firestore 규칙이 이 값 이상만 쓰기를 허용 → 옛 버전 스크립트가 데이터를 덮어쓰는 것을 서버에서 차단
  const PC = (() => { let v = GM_getValue('rn-pc', null); if (!v) { v = { id: Math.random().toString(36).slice(2, 10), name: '' }; GM_setValue('rn-pc', v); } const n = window.__rnPcName && window.__rnPcName.get(); if (n && v.name !== n) { v.name = n; GM_setValue('rn-pc', v); } return v; })();
  let autoTriggered = false;
  const SYS = () => fdb.collection('crm_system');
  const WEB_OWNED = ['flags', 'memo', 'tags', 'manual', 'confirmed', 'confirmedBy', 'confirmedAt', 'vip', 'blacklist']; // 웹앱이 관리하는 칸: 업로더가 절대 덮지 않음
  let lockBeat = null; let lockHeld = false;
  async function acquireLock(task) {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다. 새로고침해 주세요.');
    if (!fbUser) throw new StopSignal('FBLOGIN', '여러 PC가 동시에 작업하지 않도록, 수집·올리기 전에 Firebase 로그인이 필요합니다. "구글 로그인"을 눌러 주세요.');
    if (!PC.name) { const n = (window.__rnPcName && (window.__rnPcName.get() || (autoTriggered ? null : window.__rnPcName.ask('여러 PC 중 어느 PC가 작업 중인지 표시할 때 씁니다.')))); if (!n) throw new StopSignal('PCNAME', '이 PC 이름을 정해야 시작할 수 있습니다 (패널 설정에서 정하기).'); PC.name = n; GM_setValue('rn-pc', PC); }
    const ref = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock'));
    // 고객 수집이 먼저: 상품 수집기(평가 수집 등 몇 시간 걸리는 작업)가 잡고 있으면 양보를 요청하고, 멈추는 대로 자동 시작 (최대 6분 기다림)
    const deadline = Date.now() + 90 * 1000; let asked = false; let force = false; // 90초 안에 양보가 없으면(예전 버전 상품 수집기) 함께 돌도록 잠금을 넘겨받음
    for (;;) {
      try {
        await fdb.runTransaction(async (tx) => {
          const s = await tx.get(ref); const d = s.exists ? s.data() : null;
          if (!force && d && d.holder && d.holder !== PC.id && d.heartbeatMs && Date.now() - d.heartbeatMs < 5 * 60000) {
            const e = new StopSignal('LOCKED', `다른 PC(${d.pcName})에서 '${d.taskLabel}' 작업 중입니다 (마지막 신호 ${Math.max(0, Math.round((Date.now() - d.heartbeatMs) / 60000))}분 전). 그 PC 작업이 끝나면 다시 눌러 주세요. 그 PC가 꺼졌다면 5분 뒤 자동으로 풀립니다.`); e.info = d; throw e;
          }
          tx.set(ref, { writerSchema: WRITER_SCHEMA, holder: PC.id, pcName: PC.name, task, taskLabel: task === 'bulk' ? '전체 일괄 수집' : (TASKS[task] ? TASKS[task].label : task), startedAt: now(), heartbeatMs: Date.now(), by: fbUser.email });
        });
        if (asked) log('상품 수집기가 양보했습니다. 고객 수집을 시작합니다', 'ok');
        break;
      } catch (e) {
        const prod = e && e.code === 'LOCKED' && e.info && String(e.info.task || '').startsWith('product_');
        if (!prod) throw e;
        if (Date.now() > deadline) { force = true; log(`${e.info.pcName}의 상품 수집기가 응답하지 않습니다 (예전 버전). 고객 수집을 먼저 해야 하므로 지금 함께 시작합니다 — 잠시 두 PC가 동시에 알라딘에 접속합니다`, 'err'); continue; }
        if (!asked) { asked = true; await ref.set({ yieldReq: { pc: PC.id, pcName: PC.name, tool: '고객 수집기', task, at: Date.now() } }, { merge: true }).catch(() => {});
          log(`${e.info.pcName}의 상품 수집기('${e.info.taskLabel}')에 양보를 요청했습니다. 그쪽이 진행 위치를 저장하고 멈추면 자동으로 시작합니다 (보통 1분 안)`); }
        else await ref.set({ yieldReq: { pc: PC.id, pcName: PC.name, tool: '고객 수집기', task, at: Date.now() } }, { merge: true }).catch(() => {});
        await sleep(8000);
      }
    }
    lockHeld = true; clearInterval(lockBeat);
    lockBeat = setInterval(() => { if (lockHeld) ref.set({ heartbeatMs: Date.now(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }, 60000);
  }
  async function releaseLock() {
    clearInterval(lockBeat); if (!lockHeld || !fdb) return; lockHeld = false;
    const ref = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock'));
    try { await fdb.runTransaction(async (tx) => { const s = await tx.get(ref); if (s.exists && s.data().holder === PC.id) tx.delete(ref); }); } catch (e) {}
  }
  let lockInfo = null; let lockUnsub = null;
  function watchLock() { if (!fdb || lockUnsub) return; lockUnsub = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock')).onSnapshot((s) => { lockInfo = s.exists ? s.data() : null; render(); }, () => {}); }
  // ② 공유 사용량
  let sharedUsage = { day: null, writes: 0, hitLimit: false }; let usageUnsub = null;
  function watchUsage() {
    if (!fdb || !fbUser) return; const day = quotaDay(); if (sharedUsage.day === day && usageUnsub) return;
    if (usageUnsub) usageUnsub(); sharedUsage = { day, writes: 0, hitLimit: false };
    usageUnsub = SYS().doc(`usage_${day}`).onSnapshot((s) => { const d = s.exists ? s.data() : {}; sharedUsage = { day, writes: d.writes || 0, hitLimit: !!d.hitLimit, hitBy: d.hitBy || null }; render(); }, () => {});
  }
  function shareWrites(n) { if (fdb) SYS().doc(`usage_${quotaDay()}`).set({ writes: FB.firestore.FieldValue.increment(n + 1), day: quotaDay(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  function shareLimitHit() { if (fdb) SYS().doc(`usage_${quotaDay()}`).set({ hitLimit: true, hitAt: now(), hitBy: PC.name || '', writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  // ③ 수집 완료 기록 공유
  async function syncRemoteJob(job) {
    if (!fdb || !fbUser || job.fullDoneAt) return;
    try { const s = await SYS().doc('jobs').get(); const r = s.exists ? (s.data()[job._key] || null) : null; if (r && r.fullDoneAt) { job.fullDoneAt = r.fullDoneAt; job.fullDoneBy = r.pcName; } } catch (e) {}
  }
  function shareJobDone(job) { if (fdb && fbUser) SYS().doc('jobs').set({ writerSchema: WRITER_SCHEMA, [job._key]: { fullDoneAt: job.fullDoneAt || null, lastDoneAt: now(), pcName: PC.name || '', mode: job.mode || null } }, { merge: true }).catch(() => {}); }
  // ④ 기존 내용과 합치기: 새 값이 비어 있으면 기존 값 유지, 상품 줄은 줄 번호별로 합침, 이름·전화 같은 목록은 합집합
  function mergeVal(o, n) {
    if (n === null || n === undefined || n === '') return o === undefined ? n : o;
    if (Array.isArray(n)) {
      if (!Array.isArray(o) || !o.length) return n;
      if (n.length && n[0] && typeof n[0] === 'object' && 'lineNo' in n[0]) {
        const ob = new Map(o.map((x) => [x && x.lineNo, x])); const out = n.map((x) => mergeVal(ob.get(x.lineNo), x));
        o.forEach((x) => { if (x && !n.some((y) => y.lineNo === x.lineNo)) out.push(x); }); return out;
      }
      if (n.every((x) => x === null || typeof x !== 'object') && o.every((x) => x === null || typeof x !== 'object')) return [...new Set([...o, ...n].filter((x) => x !== null && x !== ''))];
      return n.length ? n : o;
    }
    if (typeof n === 'object') {
      if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.toMillis === 'function') return n;
      const r = { ...o }; for (const k of Object.keys(n)) r[k] = mergeVal(o[k], n[k]); return r;
    }
    return n;
  }
  const stripMeta = (d) => { const x = { ...d }; delete x.uploadedAt; delete x.uploaderVersion; delete x.lastWrittenBy; delete x.writerSchema; WEB_OWNED.forEach((k) => delete x[k]); return x; };
  async function readExisting(col, ids) {
    const out = new Map(); const FP = FB.firestore.FieldPath.documentId();
    for (let i = 0; i < ids.length; i += 30) {
      const part = ids.slice(i, i + 30);
      const snap = await fdb.collection(col).where(FP, 'in', part).get();
      snap.forEach((d) => out.set(d.id, d.data()));
    }
    return out;
  }

  async function commitWithRetry(b, n) {
    let tries = 0;
    while (true) {
      try { await commitWatched(b, 120); await addWrites(n); shareWrites(n); return; }
      catch (e) {
        if (e instanceof StopSignal) { if (e.code === 'FBSTALL' || e.code === 'FBQUOTA') shareLimitHit(); throw e; }
        if (e.code === 'permission-denied') throw new StopSignal('FBPERM', `Firebase가 쓰기를 거부했습니다. ① Firestore 보안 규칙의 이메일과 지금 로그인한 계정(${fbUser.email})이 같은지, ② 이 PC의 수집기가 최신 버전인지 확인해 주세요.`);
        if (e.code === 'resource-exhausted') { await markLimitHit(); shareLimitHit(); throw new StopSignal('FBQUOTA', `Firebase 무료 쓰기 한도(하루 2만 건)에 도달했습니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 것부터 올립니다.`); }
        tries += 1; const w = Math.min(300, 10 * tries); log(`올리기 실패 (${e.code || e.message}). ${w}초 뒤 다시 시도합니다.`, 'warn'); await sleep(w * 1000); checkPause();
      }
    }
  }
  async function guardQuota(n, left) {
    if (settings.billing === 'paid' && writeCap() !== Infinity && (await writesToday()) + n > writeCap()) { throw new StopSignal('FBCAP', `오늘 쓰기가 설정한 하루 안전 상한(${writeCap().toLocaleString()}건)에 닿아 멈췄습니다. 정상이라면 설정에서 상한을 올리고 이어하기를 누르세요. 평소보다 훨씬 많다면 오류일 수 있으니 알려주세요.`); }
    if (settings.billing !== 'paid' && (await writesToday()) + n > FREE_WRITES - WRITE_MARGIN) { await markLimitHit(); shareLimitHit(); throw new StopSignal('FBQUOTA', `오늘 무료 쓰기 한도(2만 건)에 거의 다 찼습니다. 한도에 걸려 멈추기 전에 미리 멈췄습니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 ${left.toLocaleString()}개를 올립니다.`); }
  }
  async function taskUpload() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다. 새로고침해 주세요.');
    if (!fbUser) throw new StopSignal('FBLOGIN', 'Firebase에 올리려면 먼저 "구글 로그인"을 눌러 주세요.');
    if (settings.billing !== 'paid' && await limitHitToday() && !confirm(`오늘은 이미 무료 쓰기 한도에 도달한 것으로 보입니다.\n한도 초기화: ${resetText()}\n\n초기화 전에 올리면 다시 2분쯤 기다리다 멈출 가능성이 큽니다. 그래도 지금 시도할까요?\n(인터넷 연결 문제로 멈췄던 경우라면 '확인'을 누르세요)`)) throw new StopSignal('FBQUOTA', `한도 초기화(${resetText()}) 뒤 이어하기를 눌러 주세요.`);
    const ujob = await loadJob('upload'); ujob.status = 'running'; ujob.startedAt = ujob.startedAt || now(); await saveJob(ujob);
    setNow('올릴 문서를 계산하는 중'); progress('Firebase 올리기', 0, 1);
    const docs = (await buildDocs()).filter((d) => d.col !== 'crm_customers'); // 고객 요약은 아래에서 Firebase 전체 데이터로 계산
    const sent = new Map((await dbAll('uploaded')).map((u) => [u._key, u.hash]));
    const todo = docs.filter((d) => sent.get(`${d.col}/${d.id}`) !== docHash(d));
    const pendingCust = new Set(((await dbGet('meta', 'pendingCustomers')) || { ids: [] }).ids); // 지난번에 다 못 한 고객 요약
    log(`올릴 문서 ${todo.length.toLocaleString()}개 (바뀐 것만), 다시 계산할 고객 요약은 올린 뒤 정해집니다`);
    const BATCH = 300; let done = 0; let skipped = 0;
    for (let i = 0; i < todo.length; i += BATCH) {
      checkPause();
      const chunk = todo.slice(i, i + BATCH);
      // Firebase에 이미 있는 내용 읽어서 합치기 (다른 PC가 올린 정보·엑셀로 채운 정보를 지우지 않음)
      const byCol = {}; chunk.forEach((d) => (byCol[d.col] = byCol[d.col] || []).push(d));
      const b = fdb.batch(); const stamp = FB.firestore.FieldValue.serverTimestamp(); let n = 0; const wrote = [];
      for (const [col, ds] of Object.entries(byCol)) {
        setNow(`Firebase의 기존 내용 확인 중 (${col})`);
        const ex = await readExisting(col, ds.map((d) => d.id));
        for (const d of ds) {
          const old = ex.get(d.id);
          const merged = old ? mergeVal(stripMeta(old), d.data) : d.data;
          if (old && old.confirmed) ['customerId', 'matchStatus', 'matchReason', 'candidates'].forEach((k) => { if (k in old) merged[k] = old[k]; }); // 웹앱에서 사람이 확정한 연결은 그대로
          if (old && d.data.customerId !== undefined && old.customerId && old.customerId !== merged.customerId) pendingCust.add(old.customerId);
          if (merged.customerId) pendingCust.add(merged.customerId);
          const cmp = (x) => stableStr(clean({ ...x, source: undefined, piiCollectedAt: undefined }));
          if (old && cmp(stripMeta(old)) === cmp(merged)) { skipped++; wrote.push(d); continue; } // 이미 같은 내용 (수집 시각만 다른 것 포함)
          b.set(fdb.collection(col).doc(d.id), { ...merged, uploadedAt: stamp, uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; wrote.push(d);
        }
      }
      if (n) { await guardQuota(n, todo.length - done); await commitWithRetry(b, n); }
      await dbPut('uploaded', wrote.map((d) => ({ _key: `${d.col}/${d.id}`, hash: docHash(d), at: now() })));
      await dbPut('meta', { _key: 'pendingCustomers', ids: [...pendingCust] });
      done += chunk.length; progress('Firebase 올리기 (주문·기록)', done, todo.length); setNow(`올린 문서 ${done.toLocaleString()} / ${todo.length.toLocaleString()} (같은 내용이라 건너뜀 ${skipped.toLocaleString()})`);
    }
    // 웹앱에서 연결을 확정·변경한 고객도 요약을 다시 계산
    let fromApp = [];
    try { const rq = await SYS().doc('recompute').get(); fromApp = rq.exists ? (rq.data().ids || []) : []; fromApp.forEach((x) => pendingCust.add(x)); } catch (e) {}
    await recomputeCustomers(pendingCust);
    if (fromApp.length) SYS().doc('recompute').set({ ids: FB.firestore.FieldValue.arrayRemove(...fromApp), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    await dbPut('meta', { _key: 'lastUpload', at: now(), count: todo.length, total: docs.length, by: fbUser.email });
    ujob.status = 'done'; ujob.finishedAt = now(); ujob.startedAt = null; await saveJob(ujob);
    log(`Firebase 올리기 완료: 문서 ${todo.length.toLocaleString()}개 확인 (그중 같은 내용 ${skipped.toLocaleString()}개는 건너뜀)${buildDocs.lastPending ? `, 구글 시트 연결 대기 ${buildDocs.lastPending}건은 웹앱에서 확정 예정` : ''}`, 'ok');
  }
  // 고객 요약: 그 고객의 모든 주문·기록을 Firebase에서 읽어 다시 계산 (어느 PC에서 올려도 정확)
  async function recomputeCustomers(set) {
    const ids = [...set]; if (!ids.length) return; await loadSellerLinks(); await loadScoringConfig();
    log(`고객 요약 ${ids.length.toLocaleString()}명을 Firebase 전체 데이터로 다시 계산합니다`);
    let i = 0; let b = fdb.batch(); let n = 0; let doneIds = [];
    const flush = async () => { if (!n) return; await guardQuota(n, ids.length - i); await commitWithRetry(b, n); const rest = new Set(ids.slice(i)); await dbPut('meta', { _key: 'pendingCustomers', ids: [...rest] }); b = fdb.batch(); n = 0; doneIds = []; };
    for (; i < ids.length; i++) {
      checkPause();
      const cid = ids[i];
      const [os, is] = await Promise.all([fdb.collection('crm_orders').where('customerId', '==', cid).get(), fdb.collection('crm_interactions').where('customerId', '==', cid).get()]);
      const orders = []; os.forEach((d) => orders.push({ _id: d.id, ...d.data() })); const inters = []; is.forEach((d) => inters.push(d.data()));
      const [c] = aggregateCustomers(orders, inters);
      if (c) { b.set(fdb.collection('crm_customers').doc(cid), { ...clean(c), uploadedAt: FB.firestore.FieldValue.serverTimestamp(), uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; }
      doneIds.push(cid);
      if (n >= 300) { i++; await flush(); i--; }
      if (i % 20 === 0) { progress('고객 요약 다시 계산', i + 1, ids.length); setNow(`고객 요약 ${(i + 1).toLocaleString()} / ${ids.length.toLocaleString()}`); }
    }
    await flush(); await dbPut('meta', { _key: 'pendingCustomers', ids: [] });
    progress('고객 요약 다시 계산', ids.length, ids.length);
  }

  /* ════════ 7) 문제 주문 상세 다시 받기 (파서가 새로 읽게 된 정보 반영) ════════ */
  async function taskRecheck() {
    const job = await loadJob('recheck');
    if (isFresh(job) || !job.queue) {
      const iss = (await dbAll('issues')).filter((i) => ['V_LINE_COUNT', 'V_TOTAL', 'V_NO_POPUP'].includes(i.type)).map((i) => i.key);
      const lines = await dbAll('orderLines'); const cnt = {}; lines.filter((l) => l.kind === 'sale').forEach((l) => (cnt[l.orderNo] = (cnt[l.orderNo] || 0) + 1));
      const old = (await dbAll('popups')).filter((p) => verNum(p.parserVersion) < verNum(NEED_CORE) && cnt[p._key] != null && p.items.length > cnt[p._key]).map((p) => p._key);
      Object.assign(job, { queue: [...new Set([...iss, ...old])], qi: 0, startedAt: now() });
    }
    job.status = 'running'; await saveJob(job);
    while (job.qi < job.queue.length) {
      const ono = job.queue[job.qi]; const url = `${BASE}wpopup_order.aspx?ono=${encodeURIComponent(ono)}`;
      setNow(`문제 주문 상세 다시 받는 중: ${ono}`);
      const { doc } = await fetchDoc(url, { expect: (d) => /주문번호/.test(d.body ? d.body.textContent : '') });
      const p = P.parseOrderPopup(doc, url); popupExtras(doc, p); if (p.orderNo === ono) await savePopup(ono, p);
      job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
      progress('문제 주문 상세 다시 받기', job.qi, job.queue.length);
      const c = p.items.filter((i) => i.cancelled).length; setNow(`${ono}: 상품 ${p.items.length}개 중 주문 안 취소 ${c}개`);
    }
    job.status = 'done'; job.finishedAt = now(); job.queue = null; await saveJob(job); log('문제 주문 상세 다시 받기 완료', 'ok');
  }

  /* ════════ 8) Firebase 대조: 올라간 문서 수와 표본 내용 비교 ════════ */
  const stableStr = (v) => (v === null || typeof v !== 'object') ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(stableStr).join(',') + ']'
    : '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + stableStr(v[k])).join(',') + '}';
  async function taskFbCheck() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다.');
    if (!fbUser) throw new StopSignal('FBLOGIN', 'Firebase 대조를 하려면 먼저 로그인해 주세요.');
    setNow('비교할 문서를 계산하는 중'); const docs = await buildDocs(); const byCol = {};
    docs.forEach((d) => (byCol[d.col] = byCol[d.col] || []).push(d));
    let bad = 0; const cols = Object.keys(byCol);
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]; let remote;
      try { remote = (await fdb.collection(col).count().get()).data().count; }
      catch (e) { remote = (await fdb.collection(col).get()).size; }
      const local = byCol[col].length; const ok = remote >= local;
      log(`${col}: 이 PC ${local.toLocaleString()}개 / Firebase ${remote.toLocaleString()}개 ${ok ? '일치' : '부족'}`, ok ? 'ok' : 'err'); if (!ok) bad++;
      progress('Firebase 대조', i + 1, cols.length + 1);
    }
    const sample = docs.slice().sort(() => Math.random() - 0.5).slice(0, 20); let diff = 0;
    for (const d of sample) {
      const snap = await fdb.collection(d.col).doc(d.id).get();
      if (!snap.exists) { diff++; log(`없음: ${d.col}/${d.id}`, 'err'); continue; }
      const r = snap.data(); delete r.uploadedAt; delete r.uploaderVersion;
      if (stableStr(clean({ ...r, source: undefined, piiCollectedAt: undefined })) !== stableStr({ ...clean(d.data), source: undefined, piiCollectedAt: undefined })) { diff++; log(`내용 다름: ${d.col}/${d.id} (아직 안 올린 변경일 수 있음)`, 'warn'); }
    }
    progress('Firebase 대조', cols.length + 1, cols.length + 1);
    log(`Firebase 대조 끝: 문서 수 ${bad ? bad + '개 컬렉션 부족' : '모두 일치'}, 표본 20개 중 내용 다름 ${diff}개`, bad || diff ? 'warn' : 'ok');
    setNow(`Firebase 대조: 문서 수 ${bad ? '부족 있음' : '일치'}, 표본 내용 다름 ${diff}/20`);
  }

  /* ════════ 9) 고객 요약·점수 전체 재계산 (매일: 최근성 점수는 날짜가 지나면 바뀜) ════════ */
  async function taskScore() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다.');
    if (!fbUser) throw new StopSignal('FBLOGIN', '점수 계산은 Firebase 로그인 후에 할 수 있습니다.');
    setNow('Firebase에서 주문·기록을 읽는 중 (약 7천 건 읽기)'); progress('고객 점수 계산', 0, 1); await loadSellerLinks(); await loadScoringConfig();
    const [os, is] = await Promise.all([fdb.collection('crm_orders').get(), fdb.collection('crm_interactions').get()]);
    const orders = []; os.forEach((d) => orders.push({ _id: d.id, ...d.data() })); const inters = []; is.forEach((d) => inters.push(d.data()));
    const custs = aggregateCustomers(orders, inters);
    const sent = new Map((await dbAll('uploaded')).filter((u) => u._key.startsWith('crm_customers/')).map((u) => [u._key, u.hash]));
    const hashC = (c) => hashStr(stableStr(clean({ ...c, scores: { ...c.scores, day: undefined } })));
    const todo = custs.filter((c) => sent.get(`crm_customers/${c.customerId}`) !== hashC(c));
    log(`고객 ${custs.length.toLocaleString()}명 중 점수·요약이 바뀐 ${todo.length.toLocaleString()}명을 올립니다`);
    for (let i = 0; i < todo.length; i += 300) {
      checkPause();
      const chunk = todo.slice(i, i + 300); const b = fdb.batch();
      chunk.forEach((c) => b.set(fdb.collection('crm_customers').doc(c.customerId), { ...clean(c), uploadedAt: FB.firestore.FieldValue.serverTimestamp(), uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }));
      await guardQuota(chunk.length, todo.length - i); await commitWithRetry(b, chunk.length);
      await dbPut('uploaded', chunk.map((c) => ({ _key: `crm_customers/${c.customerId}`, hash: hashC(c), at: now() })));
      progress('고객 점수 계산', Math.min(todo.length, i + 300), todo.length);
    }
    const vip = custs.filter((c) => c.autoFlags.vip.on).length; const cau = custs.filter((c) => c.autoFlags.caution.on).length;
    await dbPut('meta', { _key: 'lastScore', at: now(), vip, cau });
    log(`점수 계산 완료: 자동 VIP ${vip}명, 자동 주의고객 ${cau}명 (사람이 직접 정한 표시는 그대로 우선)`, 'ok');
  }

  /* ════════ 매일 자동 수집 (이 PC에서 켜 둔 경우, 주문조회·판매관리 탭이 열려 있을 때) ════════ */
  const todayKst = () => { const d = new Date(); const z = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  async function autoRunCheck() {
    if (window.__rnUniAuto || window.__rnPaused || window.__rnSchedOn || window.__rnSchedHas) return; // (1.34.0) 새 '⏰ 매일 자동 수집'이 맡음 · 통합 수집기의 '매일 자동(모두 일괄)'이 대신 함
    if (!settings.autoRun || running || otherTabBusy()) return;
    const [hh, mm] = String(settings.autoTime || '06:00').split(':').map((x) => parseInt(x, 10));
    const nowD = new Date(); if (nowD.getHours() * 60 + nowD.getMinutes() < hh * 60 + mm) return;
    const day = todayKst(); const la = await dbGet('meta', 'lastAutoRun'); if (la && la.day === day) return;
    if (fdb && fbUser) { try { const s = await SYS().doc('jobs').get(); const a = s.exists ? s.data().autoRun : null; if (a && a.day === day) { await dbPut('meta', { _key: 'lastAutoRun', day, skipped: true, by: a.pcName }); log(`오늘 자동 수집은 이미 ${a.pcName}에서 했습니다.`); return; } } catch (e) {} }
    await dbPut('meta', { _key: 'lastAutoRun', day, at: now() });
    if (fdb && fbUser) SYS().doc('jobs').set({ autoRun: { day, pcName: PC.name || '', at: now() }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    log(`매일 자동 수집 시작 (${settings.autoTime})`, 'ok'); autoTriggered = true; setTimeout(() => { autoTriggered = false; }, 60000);
    const r = await resumable(); start(r === 'bulk' ? 'bulk' : 'bulk', { fresh: r !== 'bulk' });
  }

  /* ════════ 판매자 툴팁 DB 동기화 (툴팁은 예전 Realtime Database에 계속 기록 → 매일 통합 프로젝트로 가져옴) ════════ */
  // 판매자 툴팁 저장소: 통합 프로젝트(readnow) 안의 Realtime Database (로그인 토큰 필요)
  const TOOLTIP_DB = 'https://readnow-3a385-default-rtdb.asia-southeast1.firebasedatabase.app';
  function gmGetJson(url) {
    return new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, timeout: 120000, onload: (r) => { try { res(JSON.parse(r.responseText)); } catch (e) { rej(new Error('응답을 읽지 못함')); } }, onerror: () => rej(new Error('연결 실패')), ontimeout: () => rej(new Error('시간 초과')) }));
  }
  async function taskSellerSync() {
    setNow('판매자 툴팁 데이터 받는 중 (약 10MB)'); progress('판매자 툴팁 동기화', 0, 1);
    if (!fbUser) throw new StopSignal('FBLOGIN', '판매자 툴팁 동기화는 Firebase 로그인 후에 할 수 있습니다.');
    const token = await FB.auth().currentUser.getIdToken();
    const data = await gmGetJson(`${TOOLTIP_DB}/sellers.json?auth=${encodeURIComponent(token)}`);
    if (data && data.error) throw new Error(`판매자 저장소 접근 거부: ${data.error} (저장소 규칙과 로그인 계정 확인)`);
    if (!data || typeof data !== 'object') throw new Error('판매자 툴팁 데이터가 비어 있습니다');
    const now2 = now(); const rows = Object.entries(data).map(([sc, v]) => ({ _key: sc, _sc: sc, ...v, importedAt: now2, fileName: 'tooltip-db' }));
    await dbPut('sellerRaw', rows);
    await dbPut('meta', { _key: 'import_sellerjson', fileName: '툴팁 DB 자동 동기화', at: now2, summary: `판매자 ${rows.length.toLocaleString()}곳` });
    progress('판매자 툴팁 동기화', 1, 1); log(`판매자 툴팁 동기화: ${rows.length.toLocaleString()}곳 (다음 올리기 때 바뀐 판매자만 반영)`, 'ok');
  }

  /* ════════ 우리 가게 배송비 정책 기록 (정책은 수시로 바뀌므로 매일 그때의 값을 남김) ════════ */
  function parseShopPolicy(html) {
    let free = (html.match(/이상\s*구매시\s*무료배송,\s*<strong>([^<]+)<\/strong>\s*미만/) || [])[1];
    let fee = (html.match(/미만\s*주문시\s*배송비\s*<span[^>]*>([\d,]+)<\/span>/) || [])[1];
    let paidOnly = false;
    if (!free) { const m = html.match(/무조건\s*유료배송,\s*배송비\s*<span[^>]*>([\d,]+)<\/span>/); if (m) { paidOnly = true; fee = m[1]; } }
    const n = (v) => (v == null ? null : parseInt(String(v).replace(/[^\d]/g, ''), 10) || 0);
    return { freeOver: paidOnly ? null : n(free), fee: n(fee), paidOnly };
  }
  async function taskShopPolicy() {
    const sc = settings.shopSc || '996008';
    setNow(`우리 가게(SC ${sc}) 배송비 정책 확인 중`);
    const r = await fetch(`https://www.aladin.co.kr/shop/usedshop/wshopitem.aspx?SC=${sc}`, { credentials: 'include' });
    const html = await r.text(); const pol = parseShopPolicy(html);
    if (pol.fee == null && pol.freeOver == null) { log('우리 가게 배송비 정책을 읽지 못했습니다 (가게 번호 확인 필요)', 'warn'); return; }
    const day = todayKst(); const ref = SYS().doc('shopPolicy'); const cur = await ref.get(); const d = cur.exists ? cur.data() : {};
    const last = (d.history || []).slice(-1)[0];
    const changed = !last || last.freeOver !== pol.freeOver || last.fee !== pol.fee || !!last.paidOnly !== pol.paidOnly;
    const upd = { sc, current: { ...pol, day, checkedAt: now() }, writerSchema: WRITER_SCHEMA };
    if (changed) upd.history = FB.firestore.FieldValue.arrayUnion({ ...pol, from: day, seenAt: now(), by: PC.name || '' });
    await ref.set(upd, { merge: true });
    log(`배송비 정책: ${pol.paidOnly ? '무조건 유료' : `${(pol.freeOver || 0).toLocaleString()}원 이상 무료`}, 배송비 ${(pol.fee || 0).toLocaleString()}원${changed ? ' (바뀜, 기록함)' : ''}`, 'ok');
  }
  // 툴팁 기록에 남은 우리 가게의 예전 배송비 정책도 역사로 채워 넣음 (처음 한 번)
  async function seedPolicyFromTooltip() {
    try {
      const raw = await dbGet('sellerRaw', settings.shopSc || '996008'); if (!raw) return;
      const snaps = Object.values(raw.snapshots || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
      const n = (v) => (v == null ? null : parseInt(String(v).replace(/[^\d]/g, ''), 10) || 0);
      const hist = []; snaps.forEach((s) => { const paidOnly = /무조건/.test(s.freeShipping || ''); const p = { freeOver: paidOnly ? null : n(s.freeShipping), fee: n(s.shippingFee), paidOnly, from: new Date(s.fetchedAt).toISOString().slice(0, 10), seenAt: new Date(s.fetchedAt).toISOString(), by: '툴팁 기록' }; const l = hist[hist.length - 1]; if (!l || l.freeOver !== p.freeOver || l.fee !== p.fee) hist.push(p); });
      if (hist.length) await SYS().doc('shopPolicy').set({ tooltipHistory: hist, writerSchema: WRITER_SCHEMA }, { merge: true });
    } catch (e) {}
  }

  /* ── 실행기 ── */
  const TASKS = {
    orders: { label: '전체주문', run: () => taskOrderList('orders', 20, 'sale', '전체주문') },
    cancels: { label: '취소주문', run: () => taskOrderList('cancels', 7, 'cancel', '취소주문') },
    returns: { label: '반품', run: taskReturns },
    qna: { label: '묻고 답하기', run: taskQna },
    reviews: { label: '구매평', run: taskReviews },
    verify: { label: '검증', run: taskVerify },
    upload: { label: 'Firebase 올리기', run: async () => { await taskUpload(); currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED') throw e; log(`점수 계산 멈춤: ${e.message}`, 'warn'); } } },
    recheck: { label: '문제 주문 재확인', run: taskRecheck },
    score: { label: '고객 점수 계산', run: taskScore },
    sellerSync: { label: '판매자 툴팁 동기화', run: taskSellerSync },
    shopPolicy: { label: '배송비 정책 확인', run: async () => { await taskShopPolicy(); await seedPolicyFromTooltip(); } },
    fbcheck: { label: 'Firebase 대조', run: taskFbCheck },
  };
  const BULK = ['shopPolicy', 'orders', 'cancels', 'returns', 'qna', 'reviews', 'verify', 'recheck', 'verify', 'sellerSync'];
  // 같은 PC의 여러 탭(판매관리·주문조회)이 동시에 작업하지 않게: 브라우저 안 표시(10초마다 갱신, 30초 끊기면 해제)
  const TAB_ID = Math.random().toString(36).slice(2, 10); let tabBeat = null;
  const TAB_KEY = 'rn-crm-running';
  function otherTabBusy() { try { const v = JSON.parse(localStorage.getItem(TAB_KEY) || 'null'); return v && v.tab !== TAB_ID && Date.now() - v.ts < 30000 ? v : null; } catch (e) { return null; } }
  function markTab(on, label) {
    clearInterval(tabBeat);
    if (on) { const w = () => localStorage.setItem(TAB_KEY, JSON.stringify({ tab: TAB_ID, ts: Date.now(), label, page: location.pathname.split('/').pop() })); w(); tabBeat = setInterval(w, 10000); }
    else { const v = otherTabBusy(); if (!v) localStorage.removeItem(TAB_KEY); }
  }
  window.addEventListener('pagehide', () => { if (running) { try { const v = JSON.parse(localStorage.getItem(TAB_KEY) || 'null'); if (v && v.tab === TAB_ID) localStorage.removeItem(TAB_KEY); } catch (e) {} } });
  window.addEventListener('storage', async (e) => { if (e.key === TAB_KEY) { if (!e.newValue) await refreshStats(); render(); } });
  async function markCrmComplete() { try { const bj = await loadJob('bulk'); if (bj.status === 'done') GM_setValue('rnu-crm-complete', new Date().toISOString()); } catch (e) {} }
  window.__rnCrm = { localInfo: async () => { let lines = 0, pops = 0; try { lines = await dbCount('orderLines'); pops = await dbCount('popups'); } catch (e) {} return { lines, pops, complete: !!GM_getValue('rnu-crm-complete', false) }; }, localCount: async () => { try { const a = await dbAll('popups'); return a.length; } catch (e) { return 0; } }, pause: () => { if (running) pauseRequested = true; }, otherBusy: () => !!otherTabBusy(), upload: () => (fbUser ? start('upload') : Promise.resolve()), oldAuto: async () => ({ on: !!settings.autoRun, time: settings.autoTime || '06:00' }), offOldAuto: async () => { if (settings.autoRun) { settings.autoRun = false; await saveSettings(); } }, start: (n, o) => { autoTriggered = true; return start(n, o).finally(() => { autoTriggered = false; markCrmComplete(); }); }, busy: () => running, label: () => currentTask };
  async function start(name, { fresh = false } = {}) {
    if (running) return;
    const ob = otherTabBusy();
    if (ob) { alert(`이 PC의 다른 탭(${ob.page === 'worders.aspx' ? '주문조회' : '판매관리'})에서 '${ob.label}' 작업 중입니다.\n그 탭에서 진행 상황을 확인하거나, 끝난 뒤 다시 눌러 주세요.`); return; }
    markTab(true, name === 'bulk' ? '전체 일괄 수집' : (TASKS[name] ? TASKS[name].label : name));
    running = true; pauseRequested = false; render();
    const needsLock = !['verify', 'fbcheck'].includes(name);
    try {
      if (needsLock) await acquireLock(name);
      if (name === 'bulk') {
        const bj = await loadJob('bulk');
        if (fresh || bj.status !== 'paused') { Object.assign(bj, { si: 0, startedAt: now(), message: null, preScored: false }); for (const t of BULK) { const j = await loadJob(t); if (j.status !== 'paused') { j.status = 'idle'; await saveJob(j); } } }
        bj.status = 'running'; await saveJob(bj); shareBulk('running');
        const RS = window.__rnStatus || {}; const MS = { order: BULK.map((t, i) => String(i)), labels: Object.fromEntries(BULK.map((t, i) => [String(i), TASKS[t] ? TASKS[t].label : t])), on: Object.fromEntries(BULK.map((t, i) => [String(i), true])), res: Object.fromEntries(BULK.slice(0, bj.si).map((t, i) => [String(i), 'done'])), cur: null };
        const standalone = !RS.job; if (standalone) Object.assign(RS, { job: '고객 전체 일괄 수집', jobStart: Date.now(), chain: MS, sub: null, cur: {} }); else RS.sub = MS;
        // 수집 전에 한 번: 날짜가 바뀌었거나 지난 계산 뒤 새로 올린 게 있을 때만 (없으면 건너뜀)
        if (bj.si === 0 && fbUser && !bj.preScored) {
          const ls = await dbGet('meta', 'lastScore'); const lu = await dbGet('meta', 'lastUpload');
          const stale = !ls ? false : String(ls.at).slice(0, 10) !== new Date().toISOString().slice(0, 10) || (lu && lu.at > ls.at);
          if (stale) { currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED' || e.code === 'LOGIN') throw e; log(`수집 전 점수 계산 건너뜀: ${e.message}`, 'warn'); } }
          else log(ls ? '수집 전 점수 계산: 바뀐 내용이 없어 건너뜁니다.' : '수집 전 점수 계산: 아직 계산 기록이 없어 수집 뒤에 합니다.');
          bj.preScored = true; await saveJob(bj);
        }
        while (bj.si < BULK.length) { currentTask = BULK[bj.si]; render(); { const M2 = (window.__rnStatus || {}).sub || ((window.__rnStatus || {}).chain && (window.__rnStatus || {}).chain.labels && (window.__rnStatus || {}).chain.labels['0'] === (TASKS[BULK[0]] || {}).label ? window.__rnStatus.chain : null); if (M2) M2.cur = String(bj.si); }
          if (['shopPolicy', 'sellerSync'].includes(currentTask)) { if (currentTask === 'sellerSync' && !settings.syncTooltip) { bj.si += 1; continue; } if (!fbUser && currentTask === 'shopPolicy') { bj.si += 1; continue; } try { await TASKS[currentTask].run(); } catch (e) { if (e instanceof StopSignal) throw e; log(`${TASKS[currentTask].label} 건너뜀: ${e.message}`, 'warn'); } }
          else await TASKS[currentTask].run();
          { const M2 = (window.__rnStatus || {}).sub || (window.__rnStatus || {}).chain; if (M2 && M2.res) M2.res[String(bj.si)] = 'done'; }
          bj.si += 1; await saveJob(bj); }
        if (settings.autoUpload && fbUser) { currentTask = 'upload'; render(); await taskUpload(); currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED') throw e; log(`수집 뒤 점수 계산 멈춤: ${e.message}`, 'warn'); } }
        else if (settings.autoUpload) log('구글 로그인이 되어 있지 않아 Firebase 올리기는 건너뛰었습니다.', 'warn');
        bj.status = 'done'; bj.finishedAt = now(); bj.preScored = false; await saveJob(bj); shareBulk('done');
        if (settings.forceFull) { settings.forceFull = false; await saveSettings(); }
        log('일괄 수집이 모두 끝났습니다. 백업 저장을 눌러 파일로 보관해 주세요.', 'ok');
      } else {
        currentTask = name; render();
        if (fresh) { const j = await loadJob(name); if (j.status !== 'paused') { j.status = 'idle'; await saveJob(j); } }
        await TASKS[name].run();
        if (settings.forceFull && name !== 'verify' && name !== 'upload') { settings.forceFull = false; await saveSettings(); log("'처음부터 전체 수집' 설정을 다시 껐습니다."); }
      }
    } catch (e) {
      const status = e instanceof StopSignal ? 'paused' : 'error';
      for (const n of [name, currentTask]) { if (!n) continue; const j = await loadJob(n); if (j.status === 'running') { j.status = status; j.message = e.message; await saveJob(j); } }
      if (name === 'bulk') { const bj = await loadJob('bulk'); bj.status = 'paused'; bj.message = e.message; await saveJob(bj); shareBulk('paused', e.message); }
      log(e.message, status === 'paused' ? 'warn' : 'err'); setNow(e.message);
      if (e.code === 'LOGIN') try { GM_notification({ title: '리드나우 고객 수집기', text: e.message }); } catch (x) {}
    } finally { markTab(false); if (needsLock) await releaseLock(); running = false; pauseRequested = false; currentTask = null; if (name === 'bulk') markCrmComplete();
      { const RS = window.__rnStatus || {}; if (RS.job === '고객 전체 일괄 수집') Object.assign(RS, { job: null, chain: null, lastEnd: { name: '고객 전체 일괄 수집', at: Date.now(), ms: Date.now() - (RS.jobStart || Date.now()) } }); RS.sub = null; } if (window.__rnStatus && window.__rnStatus.crm) window.__rnStatus.crm.active = false; await refreshStats(true); render(); } // 작업이 끝났을 때만 전체를 다시 셈
  }
  // 웹앱에 보여줄 수집 상태 (crm_system/jobs.lastBulk)
  function shareBulk(state, message) { if (!fdb || !fbUser) return; SYS().doc('jobs').set({ lastBulk: { state, at: now(), day: todayKst(), pcName: PC.name || '', message: message || null }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  async function resumable() {
    const bj = await loadJob('bulk'); if (bj.status === 'paused' || bj.status === 'running') return 'bulk';
    for (const t of Object.keys(TASKS)) { const j = await loadJob(t); if (['paused', 'running', 'error'].includes(j.status)) return t; }
    return null;
  }

  /* ── 백업 ── */
  async function exportBackup() {
    if (!confirm('백업 파일에는 고객 이름·연락처·주소가 들어 있습니다.\n구글 드라이브 비공개 폴더에만 보관하고, GitHub 등 공개된 곳에는 절대 올리지 마세요.\n(아이디·비밀번호는 백업에 들어가지 않습니다.)\n\n저장할까요?')) return;
    const out = { app: 'readnow-crm', appVersion: APP_VER, parserVersion: P.VERSION, exportedAt: now(), stores: {} };
    for (const s of STORES) out.stores[s] = await dbAll(s);
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a'); const d = new Date(); const z = (x) => String(x).padStart(2, '0');
    a.href = URL.createObjectURL(blob); a.download = `readnow-crm-backup-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    log('백업 파일을 저장했습니다.', 'ok');
  }
  async function importBackup(file) {
    const data = JSON.parse(await file.text());
    if (data.app !== 'readnow-crm') { alert('리드나우 고객 수집기 백업 파일이 아닙니다.'); return; }
    if (!confirm(`${data.exportedAt} 백업을 불러옵니다. 같은 항목은 백업 내용으로 바뀌고, 없는 항목은 추가됩니다. 계속할까요?`)) return;
    for (const s of STORES) if (Array.isArray(data.stores[s]) && s !== 'jobs' && s !== 'meta') await dbPut(s, data.stores[s]);
    await refreshStats(); render(); log('백업을 불러왔습니다.', 'ok');
  }

  /* ── 화면 ── */
  const GUIDE = `
  <h4>수집 중 지킬 것</h4>
  <p><b>이 탭을 화면에 띄워 두세요.</b> 다른 탭으로 옮기거나 창을 최소화하면 크롬이 속도를 늦춰 몇 시간 작업이 훨씬 길어질 수 있습니다. 가능하면 이 창 하나만 띄워 두세요.</p>
  <p><b>PC 절전 모드를 꺼 두세요.</b> 절전에 들어가면 수집이 멈춥니다. 깨어나면 이어하기를 누르면 됩니다.</p>
  <p><b>알라딘에 많이 접속하는 다른 도구와 동시에 돌리지 마세요.</b> '판매자 전체 갱신' 같은 일괄 기능이 해당됩니다.</p>
  <p><b>브라우저의 쿠키·사이트 데이터 삭제를 하지 마세요.</b> 수집 데이터가 이 브라우저 안에 있어 함께 지워집니다. 끝나면 꼭 백업 저장을 하세요.</p>
  <h4>멈췄을 때</h4>
  <p>창을 닫았거나 PC가 꺼졌어도 이 페이지를 다시 열고 <b>이어하기</b>를 누르면 멈춘 곳부터 계속합니다.</p>
  <p>서버가 불안정하면 5초에서 5분 간격으로 스스로 다시 시도하고, 60분 넘게 안 되면 일시정지합니다.</p>
  <p>로그인이 풀리면 설정에 넣은 아이디·비밀번호로 자동으로 다시 로그인합니다. 실패하면 설정한 간격(기본 60초)마다 다시 시도하며, 기본값은 성공할 때까지 무제한입니다. 횟수 제한은 설정에서 바꿀 수 있습니다.</p>
  <h4>처음 수집과 다음 수집</h4>
  <p>처음에는 모든 페이지를 받습니다. 한 번 끝까지 받은 종류는 다음부터 <b>갱신 수집</b>으로 바뀌어, 새 주문과 바뀐 주문만 받고 이미 받은 구간에 닿으면 멈춥니다. 반품은 양이 적어 매번 전부 확인합니다.</p>
  <p>반품관리 화면은 진행 중인 반품만 보여주므로, 과거 반품은 전체주문 목록의 상태·반품사유 칸과 주문 상세의 주문상태에서 찾아 검증 단계의 '확인 필요'에 올립니다.</p>
  <p>처음부터 전부 다시 받고 싶으면 설정에서 '다음 실행은 처음부터 전체 수집'을 켜세요.</p>
  <h4>Firebase 올리기</h4>
  <p>'구글 로그인'으로 보안 규칙에 등록한 구글 계정에 로그인한 뒤 'Firebase로 올리기'를 누르면, 바뀐 문서만 골라 통합 프로젝트(readnow)에 올립니다. 로그인은 이 PC에 유지됩니다. 설정에서 '일괄 수집이 끝나면 자동으로 올리기'가 켜져 있으면 일괄 수집 끝에 자동으로 올립니다.</p>
  <p><b>무료 쓰기 한도는 하루 2만 건</b>이고, 미국 서부 자정 기준이라 <b>한국 시간 오후 4시</b>(미국 서머타임이 끝나는 11월 초부터 3월 중순까지는 <b>오후 5시</b>)에 초기화됩니다. Firebase 칸에 오늘 사용량과 다음 초기화 시각이 표시됩니다. 한도에 가까워지면 미리 멈추고, 초기화 뒤 이어하기를 누르면 남은 것부터 올립니다. Firebase가 2분 넘게 응답하지 않을 때도 멈추고 알려줍니다.</p>
  <h4>매일 자동 수집</h4>
  <p>전체 일괄 수집 아래 스위치를 켜고 시각을 정하면, 그 시각 이후 이 PC의 주문조회·판매관리 탭이 열려 있을 때 하루 한 번 자동으로 수집 → 올리기 → 점수 계산까지 합니다. 설정은 바꾸는 즉시 저장됩니다. 여러 PC에서 켜 두어도 하루 한 번만 실행되고, 다른 PC가 이미 했으면 건너뜁니다. 브라우저가 꺼져 있으면 실행되지 않으니, 그 PC에서 알라딘 탭을 열어 두세요.</p>
  <h4>새 PC에서 처음 할 일 (PC마다 한 번)</h4>
  <p>구글 로그인, 이 PC 이름, 알라딘 아이디·비밀번호는 PC마다 따로 저장됩니다. 새 PC에서는 패널 맨 위에 주황색 '처음 한 번 해야 할 설정' 칸이 나타나고, 모두 마치면 초록색 한 줄로 바뀝니다.</p>
  <h4>여러 PC에서 쓸 때</h4>
  <p>한 번에 한 PC만 수집·올리기를 할 수 있습니다. 다른 PC가 작업 중이면 Firebase 칸에 빨간 글씨로 어느 PC가 무엇을 하는지 보이고, 시작 버튼을 눌러도 기다리라고 알려줍니다. 작업 중인 PC가 꺼지면 5분 뒤 자동으로 풀립니다.</p>
  <p>올릴 때는 Firebase에 이미 있는 내용과 합칩니다. 이 PC에 없는 정보(다른 PC가 모은 것, 엑셀로 채운 연락처 등)를 빈 값으로 지우지 않습니다. 고객 요약은 Firebase의 전체 주문으로 다시 계산하므로, PC마다 가진 데이터가 달라도 결과가 같습니다.</p>
  <p>수집을 끝까지 한 번 마쳤다는 기록도 공유되어, 새 PC에서도 처음부터 다시 받지 않고 갱신 수집으로 이어갑니다. 무료 한도 사용량도 모든 PC가 같은 숫자를 봅니다.</p>
  <h4>보안</h4>
  <p>백업 파일에는 고객 개인정보가 들어 있습니다. 구글 드라이브 비공개 폴더에만 두고 GitHub에는 올리지 마세요. 아이디·비밀번호는 이 PC의 Tampermonkey 안에만 저장되며 백업 파일에는 들어가지 않습니다.</p>`;
  const C = { paper: '#FFFFFF', ink: '#1E2B28', sub: '#5B6B66', line: '#D6DDDA', cloth: '#2F5D50', clothSoft: '#E6EFEB', amber: '#A8661B', red: '#B0322A' };
  const style = document.createElement('style');
  style.textContent = `
  #rn-crm{position:fixed;top:12px;right:12px;z-index:2147483646;width:310px;max-height:calc(100vh - 24px);overflow:auto;background:${C.paper};color:${C.ink};border:1px solid ${C.line};border-top:4px solid ${C.cloth};border-radius:8px;box-shadow:0 8px 28px rgba(30,43,40,.16);font:13px/1.45 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}
  #rn-crm *{box-sizing:border-box;font-family:inherit}
  #rn-crm .hd{display:flex;align-items:baseline;justify-content:space-between;padding:10px 12px 6px;cursor:pointer;user-select:none}
  #rn-crm .hd b{font-size:14px} #rn-crm .hd span{color:${C.sub};font-size:11px}
  #rn-crm .bd{padding:0 12px 10px} #rn-crm.min .bd{display:none}
  #rn-crm .sec{margin-top:10px} #rn-crm .cap{font-size:11px;color:${C.sub};margin:0 0 4px;letter-spacing:.02em}
  #rn-crm button{font-size:12px;cursor:pointer;border-radius:5px}
  #rn-crm button:disabled{opacity:.4;cursor:default}
  #rn-crm button:focus-visible{outline:2px solid ${C.cloth};outline-offset:1px}
  /* 1순위: 전체 일괄 수집 */
  #rn-crm .b1{width:100%;padding:10px;border:0;background:${C.cloth};color:#fff;font-size:14px;font-weight:bold}
  #rn-crm .b1:hover:not(:disabled){background:#264D42}
  /* 2순위: 개별 수집 (같은 계열의 옅은 색) */
  #rn-crm .g2{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:5px}
  #rn-crm .b2{padding:6px 2px;border:1px solid #C9DDD5;background:${C.clothSoft};color:${C.cloth};font-weight:bold}
  #rn-crm .b2:hover:not(:disabled){border-color:${C.cloth}}
  /* 진행 제어: 필요할 때만 보임 */
  #rn-crm .ctl{display:none;margin-top:6px} #rn-crm .ctl.on{display:block}
  #rn-crm .ctl button{width:100%;padding:7px;border:1px solid ${C.amber};background:#FFF8EE;color:${C.amber};font-weight:bold}
  /* 상태 */
  #rn-crm .st{margin-top:10px;padding:8px 9px;background:#F6F8F7;border:1px solid ${C.line};border-radius:6px}
  #rn-crm .stt{font-weight:bold;font-size:12.5px}
  #rn-crm .bar{height:5px;background:#E3E9E6;border-radius:3px;overflow:hidden;margin:6px 0 3px}
  #rn-crm .bar i{display:block;height:100%;width:0;background:${C.cloth};transition:width .3s}
  #rn-crm .stn{font-size:11.5px;color:${C.sub}} #rn-crm .now{margin-top:3px;font-size:11.5px;word-break:break-all}
  #rn-crm .nums{display:grid;grid-template-columns:1fr auto;gap:1px 8px;margin:8px 0 0;font-size:12px}
  #rn-crm .nums dt{color:${C.sub}} #rn-crm .nums dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
  /* 3순위: 점검·보조 (글자 버튼, 옅게) */
  #rn-crm .quiet{display:flex;flex-wrap:wrap;gap:2px 10px;padding-top:7px;border-top:1px dashed ${C.line}}
  #rn-crm .b3{padding:2px 0;border:0;background:none;color:${C.sub};font-size:11.5px;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#C3CCC8}
  #rn-crm .b3:hover:not(:disabled){color:${C.ink}}
  #rn-crm .badge{display:inline-block;min-width:16px;padding:0 4px;margin-left:3px;border-radius:8px;background:${C.amber};color:#fff;font-size:10.5px;text-align:center;text-decoration:none}
  #rn-crm .badge.zero{background:#C3CCC8}
  /* Firebase */
  #rn-crm .fb{margin-top:10px;padding:8px 9px;border:1px solid ${C.line};border-radius:6px}
  #rn-crm .fbs{font-size:12px} #rn-crm .fbl{margin-top:4px;font-size:11.5px} #rn-crm .fbl.busy{padding:5px 7px;border-radius:4px;background:#FDECEA;color:${C.red};font-weight:bold} #rn-crm .fbq{margin-top:5px;padding:5px 7px;border-radius:4px;background:#F6F8F7;font-size:11px;color:${C.sub};line-height:1.5} #rn-crm .fbq b{color:${C.ink}} #rn-crm .fbq.hot{background:#FFF4E5;color:${C.amber}} #rn-crm .fbq.hot b{color:${C.amber}} #rn-crm .fbrow{display:flex;gap:4px;margin-top:6px;align-items:center}
  #rn-crm .fbrow .bf{flex:1;padding:6px;border:1px solid ${C.line};background:#fff;color:${C.ink}}
  #rn-crm .fbrow .bf:hover:not(:disabled){border-color:${C.cloth}}
  /* 아래쪽 메뉴 */
  #rn-crm .foot span{display:flex;gap:10px} #rn-crm .foot{display:flex;justify-content:space-between;margin-top:10px;padding-top:7px;border-top:1px solid ${C.line}}
  #rn-crm .log{margin-top:8px;max-height:84px;overflow:auto;font-size:11px;color:${C.sub}}
  #rn-crm .log p{margin:0 0 2px} #rn-crm .log .warn{color:${C.amber}} #rn-crm .log .err{color:${C.red}} #rn-crm .log .ok{color:${C.cloth}}
  #rn-crm .pane{display:none;margin-top:8px;font-size:12px;border-top:1px solid ${C.line};padding-top:6px}
  #rn-crm.showset .set,#rn-crm.showguide .guide,#rn-crm.showiss .iss,#rn-crm.showimp .imp{display:block}
  #rn-crm .iss h4{margin:8px 0 2px;font-size:12.5px} #rn-crm .iss p{margin:0 0 3px;font-size:11.5px;word-break:break-all}
  #rn-crm .pane .row{display:flex;gap:4px;margin-top:6px} #rn-crm .pane .row button{flex:1;padding:6px;border:1px solid ${C.line};background:#fff}
  #rn-crm .set label{display:block;margin-top:5px;color:${C.sub}}
  #rn-crm .set input[type=text],#rn-crm .set input[type=password],#rn-crm .set input[type=number]{width:100%;padding:4px;border:1px solid ${C.line};border-radius:3px;font-size:12px;color:${C.ink}}
  #rn-crm .pwst{font-weight:normal;font-size:11px} #rn-crm .pwst.on{color:${C.cloth}} #rn-crm .pwst.off{color:${C.amber}}
  #rn-crm .set .chk{display:flex;gap:6px;align-items:center;color:${C.ink}}
  #rn-crm .drop{margin-top:2px;padding:16px 10px;border:2px dashed #B9CFC6;border-radius:8px;background:#F6FAF8;text-align:center;cursor:pointer;transition:background .15s,border-color .15s}
  #rn-crm .drop b{display:block;color:${C.cloth};font-size:13px} #rn-crm .drop span{display:block;margin-top:3px;font-size:11px;color:${C.sub}}
  #rn-crm .drop.over{background:${C.clothSoft};border-color:${C.cloth}}
  #rn-crm .isteps{display:none;margin:8px 0 0;padding:0;list-style:none;counter-reset:st} #rn-crm .isteps.on{display:block}
  #rn-crm .isteps li{position:relative;padding:3px 0 5px 24px;font-size:12px;color:${C.sub};counter-increment:st}
  #rn-crm .isteps li::before{content:counter(st);position:absolute;left:0;top:3px;width:17px;height:17px;border-radius:50%;background:#E3E9E6;color:${C.sub};font-size:10.5px;line-height:17px;text-align:center}
  #rn-crm .isteps li small{display:block;font-size:11px;font-weight:normal;word-break:break-all}
  #rn-crm .isteps li.doing{color:${C.ink};font-weight:bold} #rn-crm .isteps li.doing::before{background:${C.amber};color:#fff}
  #rn-crm .isteps li.done{color:${C.ink}} #rn-crm .isteps li.done::before{content:'✓';background:${C.cloth};color:#fff}
  #rn-crm .isteps li.need{color:${C.amber};font-weight:bold} #rn-crm .isteps li.need::before{content:'!';background:${C.amber};color:#fff}
  #rn-crm .isteps li.error{color:${C.red}} #rn-crm .isteps li.error::before{content:'×';background:${C.red};color:#fff}
  #rn-crm .ist p{margin:0 0 5px;font-size:11.5px;color:${C.sub}} #rn-crm .ist b{color:${C.ink}}

#rn-crm .setup{margin-top:4px;border-radius:6px}
  #rn-crm .setup.todo{padding:8px 9px;border:2px solid ${C.amber};background:#FFF8EE}
  #rn-crm .setup.todo h5{margin:0 0 4px;font-size:12.5px;color:${C.amber}}
  #rn-crm .setup.todo p{margin:0 0 5px;font-size:11px;color:${C.sub}}
  #rn-crm .setup ul{margin:0;padding:0;list-style:none}
  #rn-crm .setup li{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12px;border-top:1px dashed #EBD9BE}
  #rn-crm .setup li:first-child{border-top:0}
  #rn-crm .setup li.ok{color:${C.cloth}} #rn-crm .setup li.no{color:${C.ink};font-weight:bold}
  #rn-crm .setup li button{padding:2px 8px;border:1px solid ${C.amber};background:#fff;color:${C.amber};font-size:11px}
  #rn-crm .setup.done{padding:4px 2px;font-size:11px;color:${C.cloth}}
  #rn-crm .autohelp{display:none;margin-top:6px;padding:8px 9px;background:#F6F8F7;border:1px solid ${C.line};border-radius:6px;font-size:11.5px;line-height:1.55} #rn-crm.showauto .autohelp{display:block} #rn-crm .autohelp ol{margin:4px 0;padding-left:18px} #rn-crm .autohelp p{margin:4px 0} #rn-crm .autohelp code{font-size:10.5px;background:#fff;padding:0 3px;border-radius:3px;word-break:break-all}
  #rn-crm .auto{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px}
  #rn-crm .auto input[type=time]{border:1px solid ${C.line};border-radius:4px;padding:2px 4px;font-size:12px;color:${C.ink}}
  #rn-crm .auto .an{color:${C.sub};font-size:11px;margin-left:auto}
  #rn-crm .sw{position:relative;display:inline-block;width:32px;height:18px} #rn-crm .sw input{opacity:0;width:0;height:0}
  #rn-crm .sw span{position:absolute;inset:0;background:#C3CCC8;border-radius:9px;transition:.2s;cursor:pointer}
  #rn-crm .sw span::before{content:'';position:absolute;left:2px;top:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:.2s}
  #rn-crm .sw input:checked+span{background:${C.cloth}} #rn-crm .sw input:checked+span::before{transform:translateX(14px)}
  #rn-crm .guide h4{margin:8px 0 2px;font-size:12.5px} #rn-crm .guide p{margin:0 0 5px}`;
  document.head.appendChild(style);

  const el = document.createElement('div'); el.id = 'rn-crm';
  el.innerHTML = `
  <div class="hd"><b>리드나우 고객 수집</b><span>v${APP_VER} (눌러서 접기)</span></div>
  <div class="bd">
    <div class="setup"></div>
    <div class="sec">
      <button class="b1" data-a="bulk">전체 일괄 수집</button>
      <div class="hint" style="font-size:11px;color:#5B6B66;margin:4px 0 0">⏰ 매일 자동 수집(묻고 답하기·반품·고객 일괄 등)은 <b>상품 탭 맨 위</b>에서 켜고 시각을 정합니다.</div>
      <div class="ctl"><button data-a="pause">일시정지</button></div>
      <div class="ctl"><button data-a="resume">이어하기</button></div>
    </div>
    <div class="sec">
      <p class="cap">개별 수집</p>
      <div class="g2">
        <button class="b2" data-a="orders">전체주문</button><button class="b2" data-a="cancels">취소주문</button><button class="b2" data-a="returns">반품</button>
        <button class="b2" data-a="qna">묻고 답하기</button><button class="b2" data-a="reviews">구매평</button>
      </div>
    </div>
    <div class="st"><div class="stt">대기 중</div><div class="bar"><i></i></div><div class="stn"></div><div class="now"></div><dl class="nums"></dl></div>
    <div class="sec quiet">
      <span class="cap" style="margin:2px 2px 0 0">점검</span><button class="b3" data-a="verify">검증</button><button class="b3" data-a="recheck">문제 주문 재확인</button><button class="b3" data-a="issues">확인 필요<span class="badge zero">0</span></button>
    </div>
    <div class="fb"><div class="fbs">Firebase: 확인 중</div>
      <div class="fbl"></div>
      <div class="fbq"></div>
      <div class="fbrow"><button class="bf" data-a="fblogin">구글 로그인</button><button class="bf" data-a="upload">Firebase로 올리기</button></div>
      <div style="margin-top:3px;display:flex;gap:10px"><button class="b3" data-a="fbcheck">올라간 내용 대조</button><button class="b3" data-a="fbusage">Firebase 실제 사용량 보기</button></div>
    </div>
    <div class="foot">
      <span><button class="b3" data-a="importpane">엑셀·시트 가져오기</button><button class="b3" data-a="export">백업 저장</button><button class="b3" data-a="import">불러오기</button></span>
      <span><button class="b3" data-a="settings">설정</button> <button class="b3" data-a="guide">사용 안내</button></span>
    </div>
    <div class="pane set">
      <p style="font-size:11.5px;color:#5B6B66;margin:2px 0 6px">알라딘 요청 간격은 상품·고객·가격 감시가 모두 같은 자동 조절 하나를 씁니다 → 상품·매입 탭의 설정 '알라딘 요청 간격'에서 바꿉니다.</p>
      <label class="chk"><input data-s="forceFull" type="checkbox"> 다음 실행은 처음부터 전체 수집</label>
      <label class="chk"><input data-s="autoUpload" type="checkbox"> 일괄 수집이 끝나면 Firebase로 자동으로 올리기</label>
      <label class="chk"><input data-s="autoLogin" type="checkbox"> 로그인이 풀리면 자동으로 다시 로그인</label>
      <label>자동 로그인 최대 시도 횟수 (0 = 무제한)<input data-s="maxLoginTries" type="number" step="1" min="0"></label>
      <label>자동 로그인 재시도 간격(초)<input data-s="loginRetrySec" type="number" step="10" min="10"></label>
      <label>Firebase 요금제</label>
      <label class="chk"><input type="radio" name="rn-bill" data-bill="paid"> 유료 (Blaze, 사용한 만큼 청구)</label>
      <label class="chk"><input type="radio" name="rn-bill" data-bill="free"> 무료 (Spark, 하루 2만 건에서 멈춤)</label>
      <label>유료일 때 하루 쓰기 안전 상한 (건)<input data-s="dailyWriteCap" type="number" step="10000" min="1000"></label>
      <label>이 날짜까지는 상한 없이 쓰기 (무료 크레딧 기간)<input data-s="noCapUntil" type="date"></label>
      <label class="chk"><input data-s="remoteRun" type="checkbox"> 핸드폰·웹앱의 수집 요청을 이 PC에서 받기</label>
      <label class="chk"><input data-s="syncTooltip" type="checkbox"> 매일 판매자 툴팁 데이터도 가져오기</label>
      <label>우리 가게 판매자 번호(SC, 배송비 정책 확인용)<input data-s="shopSc" type="text"></label>
      <label>이 PC 이름 (여러 PC 구분용, 예: 사무실-1)<input data-c="pcname" type="text" autocomplete="off"></label>
      <label>알라딘 아이디<input data-c="id" type="text" autocomplete="off"></label>
      <p style="margin:3px 0 0;font-size:11px;color:${C.sub}">비밀번호 칸을 비워 두고 저장하면 기존 비밀번호가 유지됩니다. 아이디를 지우고 저장하면 아이디·비밀번호가 모두 삭제됩니다.</p>
      <label>알라딘 비밀번호 <b class="pwst" data-for="pw"></b><input data-c="pw" type="password" autocomplete="new-password"></label>
      <label>Firebase 로그인 방식</label>
      <label class="chk"><input type="radio" name="rn-fbmode" value="google" data-m="google"> 구글 계정 (기본, 권장)</label>
      <label class="chk"><input type="radio" name="rn-fbmode" value="password" data-m="password"> Firebase 전용 계정 (구글 창이 안 될 때만)</label>
      <div class="fbpwbox">
      <label>Firebase 전용 이메일<input data-c="fbemail" type="text" name="rn-fb-x1" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')"></label>
      <label>Firebase 전용 비밀번호 <b class="pwst" data-for="fbpw"></b><input data-c="fbpw" type="password" name="rn-fb-x2" autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')"></label>
      </div>
      <div class="row"><button data-a="saveset">설정 저장</button><button data-a="logintest">자동 로그인 시험</button></div>
    </div>
    <div class="pane guide">${GUIDE}</div>
    <div class="pane iss"></div>
    <div class="pane imp">
      <div class="drop" tabindex="0" role="button">
        <b>파일을 여기에 끌어다 놓으세요</b>
        <span>또는 눌러서 선택. 판매완료 엑셀, 고객·판매자 구글 시트(.xlsx), 판매자 툴팁 데이터(.json)를 함께 넣어도 됩니다. 어떤 파일인지는 자동으로 알아봅니다.</span>
      </div>
      <ol class="isteps">
        <li data-n="1" class="wait">파일 읽기<small></small></li>
        <li data-n="2" class="wait">이 PC에 정리 (어긋난 열 맞춤, 고객 연결)<small></small></li>
        <li data-n="3" class="wait">Firebase에 올리기<small></small></li>
      </ol>
      <div class="ist"><p class="cap" style="margin:8px 0 2px">마지막으로 가져온 파일</p>
        <p><b>판매완료 엑셀</b><br><span class="ist-sales"></span></p>
        <p><b>고객 구글 시트</b> (구글 시트 → 파일 → 다운로드 → Microsoft Excel)<br><span class="ist-sheet"></span></p>
        <p><b>판매자 툴팁 데이터</b> (툴팁의 데이터 다운로드 버튼으로 받은 .json)<br><span class="ist-sjson"></span></p>
      </div>
    </div>
    <input class="fx" type="file" accept=".xlsx,.xls,.json" multiple style="display:none">
    <div class="log"></div>
    <input type="file" accept=".json" style="display:none">
  </div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  if (localStorage.getItem('rn-crm-min') === '1') el.classList.add('min');
  $('.hd').onclick = () => { el.classList.toggle('min'); localStorage.setItem('rn-crm-min', el.classList.contains('min') ? '1' : '0'); };

  function log(msg, cls = '') {
    window.__rnLog && window.__rnLog('고객', cls === 'err' ? 'err' : cls === 'warn' ? 'warn' : cls === 'ok' ? 'ok' : 'info', msg);
    const p = document.createElement('p'); p.className = cls;
    p.textContent = `${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${msg}`;
    $('.log').prepend(p); while ($('.log').children.length > 60) $('.log').lastChild.remove();
  }
  function setNow(t) { $('.now').textContent = t; window.__rnLog && window.__rnLog('고객', 'detail', t); if (window.__rnStatus && window.__rnStatus.crm) window.__rnStatus.crm.sub = t; }
  function progress(label, done, total) {
    if (window.__rnStatus) window.__rnStatus.crm = { active: true, label: (currentTask ? `${TASKS[currentTask].label} · ` : '') + label, done, total, sub: $('.now') ? $('.now').textContent : '' };
    $('.stt').textContent = (currentTask ? `[${TASKS[currentTask].label}] ` : '') + label;
    $('.bar i').style.width = (total ? Math.min(100, (done / total) * 100) : 0).toFixed(1) + '%';
    const avg = reqTimes.length ? reqTimes.reduce((a, b) => a + b, 0) / reqTimes.length : 0;
    const left = avg && total ? Math.round(((total - done) * avg) / 60000) : null;
    $('.stn').textContent = `${done.toLocaleString()} / ${(total || 0).toLocaleString()}` + (left != null && total > done ? `, 이 단계 약 ${left}분 남음` : '');
  }
  let stats = {};
  // (1.34.0) 화면을 열 때마다 주문 상세(수만 건) 전체를 읽어 세던 것 → 갯수는 count로, 판매·취소·개인정보 나눔은 작업이 끝났을 때만 새로 셈(그 사이엔 지난 값)
  async function refreshStats(full) {
    const nLines = await dbCount('orderLines'), nPops = await dbCount('popups'); let sp = GM_getValue('rnu-stat-split', null);
    if (full || !sp || sp.lines !== nLines || sp.pops !== nPops) { if (full || !sp) { const lines = await dbAll('orderLines'); const pops = await dbAll('popups'); sp = { lines: nLines, pops: nPops, sale: lines.filter((l) => l.kind === 'sale').length, cancel: lines.filter((l) => l.kind === 'cancel').length, pii: pops.filter((x) => x.piiAvailable).length }; GM_setValue('rnu-stat-split', sp); } }
    stats = {
      '판매 상품 줄': sp.sale + (sp.lines !== nLines ? ' (지난 집계)' : ''),
      '취소 상품 줄': sp.cancel + (sp.lines !== nLines ? ' (지난 집계)' : ''),
      '주문 상세': nPops,
      '개인정보 확보한 주문': sp.pii + (sp.pops !== nPops ? ' (지난 집계)' : ''),
      '반품': await dbCount('returns'),
      '묻고 답하기 (상세)': `${await dbCount('qnaList')} (${await dbCount('qnaDetail')})`,
      '구매평': await dbCount('reviews'),
      '엑셀 줄 / 시트 행': `${(await dbCount('excelLines')).toLocaleString()} / ${await dbCount('sheetRows')}`,
      'Firebase에 올린 문서': await dbCount('uploaded'),
    };
  }
  const ISSUE_LABEL = { V_NO_POPUP: '주문 상세를 못 받은 주문', V_LINE_COUNT: '목록 줄 수와 상세 상품 수가 다름', V_TOTAL: '판매가 합계와 판매총액이 다름', V_STATUS: '주문상태가 정상이 아님 (과거 반품·취소 흔적)',
    V_ROW_STATUS: '목록 행 상태가 정상이 아님', V_CANCEL_OVERLAP: '판매 목록과 취소 목록에 모두 있는 주문', V_COUNT: '수집 줄 수가 샵매니저 표시보다 적음', EMPTY_PAGE: '빈 페이지', POPUP_MISMATCH: '상세 주문번호 불일치', RETURN_URL: '반품 페이지 인식 실패', RETURN_PAGES: '반품 목록 여러 페이지' };
  async function renderIssues() {
    const iss = await dbAll('issues'); const g = {}; iss.forEach((i) => (g[i.type] = g[i.type] || []).push(i));
    $('.iss').innerHTML = `<div class="row"><button data-a="issuecsv">전체 목록 파일로 저장 (CSV)</button></div>` + (iss.length ? '' : '<p>확인할 것이 없습니다.</p>') +
      Object.entries(g).map(([t, a]) => `<h4>${ISSUE_LABEL[t] || t}: ${a.length}건</h4>` + a.slice(0, 15).map((i) => `<p>${i.key}: ${String(i.detail).replace(/</g, '&lt;')}</p>`).join('') + (a.length > 15 ? `<p>… 외 ${a.length - 15}건 (CSV로 전체 확인)</p>` : '')).join('');
  }
  async function exportIssuesCsv() {
    const iss = await dbAll('issues'); const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + ['종류,설명,주문번호/대상,내용'].concat(iss.map((i) => [i.type, ISSUE_LABEL[i.type] || '', i.key, i.detail].map(q).join(','))).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'readnow-crm-확인필요.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  // 이 PC 준비 상태: PC마다 한 번씩 해야 하는 설정을 빠짐없이 보여줌
  function renderSetup() {
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    const items = [
      { k: 'login', ok: !!fbUser, label: '구글 로그인 (Firebase)', btn: '로그인', why: '여러 PC 잠금·올리기에 필요' },
      { k: 'pcname', ok: !!PC.name, label: `이 PC 이름${PC.name ? `: ${PC.name}` : ''}`, btn: '정하기', why: '어느 PC가 작업 중인지 구분' },
      { k: 'cred', ok: !!(cred && cred.id && cred.pw), label: '알라딘 아이디·비밀번호', btn: '넣기', why: '로그인이 풀려도 자동 재로그인' },
      { k: 'core', ok: verNum(P.VERSION) >= verNum(NEED_CORE), label: `파서 파일 ${P.VERSION}${verNum(P.VERSION) >= verNum(NEED_CORE) ? '' : ` (필요: ${NEED_CORE})`}`, btn: '방법', why: 'GitHub의 파서 파일이 최신이어야 함' },
    ];
    if (settings.billing === 'paid' && settings.noCapUntil) {
      const days = Math.round((new Date(settings.noCapUntil) - new Date(todayKst())) / 864e5);
      if (days <= 14) items.push({ k: 'cap', ok: false, label: days >= 0 ? `무료 크레딧 기간이 ${days}일 남았습니다 (${settings.noCapUntil}). 그 뒤 하루 쓰기 상한(지금 ${(settings.dailyWriteCap || 200000).toLocaleString()}건)을 정해 주세요` : `크레딧 기간이 끝났습니다. 하루 쓰기 상한 ${(settings.dailyWriteCap || 200000).toLocaleString()}건이 적용 중입니다. 확인 후 설정에서 날짜를 지우세요`, btn: '설정', why: '' });
    }
    const box = $('.setup'); const todo = items.filter((x) => !x.ok);
    if (!todo.length) { box.className = 'setup done'; box.textContent = `✓ 이 PC 준비 완료 (${PC.name}): 로그인·PC 이름·알라딘 계정·파서 파일`; return; }
    box.className = 'setup todo';
    box.innerHTML = `<h5>${todo.some((x) => x.k === 'cap') && todo.length === 1 ? '확인이 필요합니다' : `이 PC에서 처음 한 번 해야 할 설정 (${items.filter((x) => x.k !== 'cap').length - todo.filter((x) => x.k !== 'cap').length}/${items.filter((x) => x.k !== 'cap').length})`}</h5><p>PC마다 따로 저장됩니다. 새 PC에서는 이 칸이 다시 나타납니다.</p><ul>` +
      items.map((x) => `<li class="${x.ok ? 'ok' : 'no'}" title="${x.why}"><span>${x.ok ? '✓' : '○'} ${x.label}</span>${x.ok ? '' : `<button data-a="setup_${x.k}">${x.btn}</button>`}</li>`).join('') + '</ul>';
  }
  async function saveSettingsUI(keepOpen) {
      el.querySelectorAll('[data-s]').forEach((i) => {
        const k = i.dataset.s; const v = parseFloat(i.value);
        if (i.type === 'checkbox') settings[k] = i.checked;
        else if (k.startsWith('delay')) settings[k] = Math.max(500, Math.round(v * 1000) || DEFAULTS[k]);
        else if (k === 'maxLoginTries') settings[k] = Number.isFinite(v) && v >= 0 ? Math.floor(v) : DEFAULTS[k];
        else if (k === 'loginRetrySec') settings[k] = Number.isFinite(v) && v >= 10 ? Math.round(v) : DEFAULTS[k];
        else if (k === 'dailyWriteCap') settings[k] = Number.isFinite(v) && v >= 1000 ? Math.round(v) : DEFAULTS[k];
        else if (k === 'noCapUntil') settings[k] = i.value || '';
        else if (k === 'shopSc') settings[k] = String(i.value || '').replace(/\D/g, '') || DEFAULTS[k];
      });
      if (settings.delayMax < settings.delayMin) settings.delayMax = settings.delayMin;
      const pcn = $('[data-c="pcname"]').value.trim(); if (pcn) { PC.name = pcn; GM_setValue('rn-pc', PC); window.__rnPcName && window.__rnPcName.set(pcn); }
      const id = $('[data-c="id"]').value.trim(); const pw = $('[data-c="pw"]').value; const old = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
      if (id) GM_setValue('rn-cred', { id, pw: pw || (old && old.pw) || '' }); else GM_deleteValue('rn-cred');
      $('[data-c="pw"]').value = '';
      const br = el.querySelector('[data-bill]:checked'); if (br) settings.billing = br.dataset.bill;
      const mr = el.querySelector('[data-m]:checked'); GM_setValue('rn-fbmode', mr ? mr.dataset.m : 'google');
      const fe = $('[data-c="fbemail"]').value.trim(); const fp = $('[data-c="fbpw"]').value; const ofp = GM_getValue('rn-fbpw', null);
      if (fe) GM_setValue('rn-fbpw', { email: fe, pw: fp || (ofp && ofp.pw) || '' }); else GM_deleteValue('rn-fbpw');
      $('[data-c="fbpw"]').value = '';
      await saveSettings(); log('설정을 저장했습니다.', 'ok'); if (!keepOpen) el.classList.remove('showset'); render();
  }
  async function render() {
    try { renderSetup(); } catch (e) {}
    /* (1.34.0) 예전 '매일 자동 수집' 스위치는 상품 탭 위 '⏰ 매일 자동 수집'으로 옮김 */
    $('.nums').innerHTML = Object.entries(stats).map(([k, v]) => `<dt>${k}</dt><dd>${typeof v === 'number' ? v.toLocaleString() : v}</dd>`).join('');
    el.querySelectorAll('[data-a]').forEach((b) => { const a = b.dataset.a; b.disabled = running ? !['pause', 'guide', 'settings', 'issues', 'importpane', 'fbusage', 'setup_pcname', 'setup_cred', 'setup_core', 'setup_cap', 'autohelp'].includes(a) : a === 'pause'; });
    const ob = !running && otherTabBusy();
    if (ob) { el.querySelectorAll('[data-a]').forEach((b) => { if (['bulk', 'orders', 'cancels', 'returns', 'qna', 'reviews', 'verify', 'recheck', 'upload', 'resume'].includes(b.dataset.a)) b.disabled = true; }); }
    const r = running || ob ? null : await resumable();
    $('[data-a="pause"]').parentElement.classList.toggle('on', running);
    $('[data-a="resume"]').parentElement.classList.toggle('on', !running && !!r);
    $('[data-a="resume"]').disabled = !r;
    if (r) $('.stt').textContent = `멈춘 작업 있음: ${r === 'bulk' ? '전체 일괄 수집' : TASKS[r].label}. 이어하기를 누르세요`;
    if (ob) { $('.stt').textContent = `이 PC의 다른 탭(${ob.page === 'worders.aspx' ? '주문조회' : '판매관리'})에서 '${ob.label}' 진행 중`; $('.now').textContent = '진행 상황은 그 탭에서 보입니다. 끝나면 이 탭 숫자도 자동으로 갱신됩니다.'; }
    const ic = await dbCount('issues'); const bg = $('.badge'); bg.textContent = ic.toLocaleString(); bg.classList.toggle('zero', ic === 0);
    el.querySelectorAll('[data-s]').forEach((i) => { if (document.activeElement === i) return; const k = i.dataset.s; if (i.type === 'checkbox') i.checked = !!settings[k]; else i.value = k.startsWith('delay') ? settings[k] / 1000 : settings[k] ?? ''; });
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null)); $('[data-c="id"]').value = cred ? cred.id : '';
    if (document.activeElement !== $('[data-c="pcname"]')) $('[data-c="pcname"]').value = PC.name || '';
    for (const [key, store] of [['pw', 'rn-cred'], ['fbpw', 'rn-fbpw']]) {
      const v = GM_getValue(store, null); const has = !!(v && v.pw); const st = $(`.pwst[data-for="${key}"]`); const inp = $(`[data-c="${key}"]`);
      st.textContent = has ? '(저장되어 있음)' : '(저장 안 됨)'; st.className = 'pwst ' + (has ? 'on' : 'off');
      inp.placeholder = has ? '●●●●●●●● 저장됨 (바꿀 때만 새로 입력)' : '비밀번호를 입력하세요';
    }
    el.querySelectorAll('[data-bill]').forEach((r) => { if (document.activeElement !== r) r.checked = r.dataset.bill === (settings.billing || 'paid'); });
    const mode = GM_getValue('rn-fbmode', 'google'); el.querySelectorAll('[data-m]').forEach((r) => { if (document.activeElement !== r) r.checked = r.dataset.m === mode; });
    $('.fbpwbox').style.display = mode === 'password' ? '' : 'none';
    const fpc = GM_getValue('rn-fbpw', null); if (document.activeElement !== $('[data-c="fbemail"]')) $('[data-c="fbemail"]').value = fpc ? fpc.email : '';
    { const used = await writesToday(); const hit = settings.billing !== 'paid' && await limitHitToday(); const q = $('.fbq'); q.classList.toggle('hot', hit || (writeCap() !== Infinity && used > writeCap() * 0.7));
      q.innerHTML = hit ? `<b>오늘 무료 쓰기 한도(2만 건)에 도달한 것으로 보입니다.</b><br>초기화: <b>${resetText()}</b>. 그 뒤 이어하기를 누르세요.`
        : settings.billing === 'paid' ? `유료(Blaze): 무료 2만 건을 넘으면 사용한 만큼 청구. ${noCapNow() ? `<b>${settings.noCapUntil}까지 상한 없음</b> (크레딧 기간), 그 뒤 하루 ${(settings.dailyWriteCap || 200000).toLocaleString()}건` : `하루 안전 상한 <b>${writeCap().toLocaleString()}건</b>`}<br>오늘 사용량 약 <b>${used.toLocaleString()}건</b> · 날짜 기준 초기화: ${resetText()}` : `무료 쓰기 한도 <b>하루 2만 건</b>. 이 PC가 센 오늘 사용량 약 <b>${used.toLocaleString()}건</b><br><span style="font-size:10.5px">(이 PC에서 올린 것만 셉니다. 다른 PC·예전 버전에서 올린 양은 빠짐)</span><br>다음 초기화: <b>${resetText()}</b>`; }
    { const L = $('.fbl'); const other = lockInfo && lockInfo.holder && lockInfo.holder !== PC.id && Date.now() - (lockInfo.heartbeatMs || 0) < 5 * 60000;
      L.classList.toggle('busy', !!other);
      L.textContent = other ? `지금 다른 PC(${lockInfo.pcName})에서 '${lockInfo.taskLabel}' 작업 중입니다. 끝날 때까지 이 PC에서는 수집·올리기를 시작할 수 없습니다.` : `이 PC: ${PC.name || '(이름 없음, 처음 작업할 때 정합니다)'}`; }
    $('.fbs').textContent = !FB ? 'Firebase: 불러오기 실패 (새로고침 필요)' : fbUser ? `Firebase: ${fbUser.email} 로그인됨` : 'Firebase: 로그인 안 됨';
    $('[data-a="fblogin"]').textContent = fbUser ? '로그아웃' : fbLoggingIn ? '로그인 창 대기 중' : (GM_getValue('rn-fbmode', 'google') === 'password' && GM_getValue('rn-fbpw', null) ? 'Firebase 로그인' : '구글 로그인'); if (!running) $('[data-a="fblogin"]').disabled = !FB || fbLoggingIn;
  }

  el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
    if (TASKS[a] || a === 'bulk' || a === 'resume') window.__rnResumeOk && window.__rnResumeOk(); // 사람이 시작·이어하기를 누르면 일시정지 풀림
    if (TASKS[a] || a === 'bulk') {
      try { const lc = 0; if (false && a === 'bulk' && lc < 1000 && !GM_getValue('rnu-crm-complete', false) && !confirm(`이 PC에는 상세까지 받은 예전 주문이 ${lc}건뿐입니다.\n지금 시작하면 '이미 받은 주문'을 알아보지 못해 처음부터 전부 훑습니다 (몇 시간).\n고객·주문은 평소 기록이 있는 PC(${GM_getValue('rnu-autopc', 'JS-MAIN')})에서 하는 것이 좋습니다.\n\n그래도 이 PC에서 할까요?`)) return; } catch (e) {}
      const r = await resumable();
      if (r && !confirm(`멈춘 작업(${r === 'bulk' ? '전체 일괄 수집' : TASKS[r].label})이 있습니다.\n새로 시작하면 그 작업은 처음부터 다시 합니다. 이미 모은 데이터는 지워지지 않습니다.\n\n새로 시작할까요? (취소를 누르고 '이어하기'를 쓰셔도 됩니다)`)) return;
      if (r) for (const n of ['bulk', ...Object.keys(TASKS)]) { const j = await loadJob(n); if (['paused', 'running', 'error'].includes(j.status)) { j.status = 'idle'; await saveJob(j); } }
      start(a, { fresh: true });
    } else if (a === 'fblogin') { if (fbUser) { await FB.auth().signOut(); log('Firebase 로그아웃했습니다.'); } else await fbLogin(); render();
    } else if (a === 'setup_login') { await fbLogin(); render();
    } else if (a === 'setup_cap') { el.classList.add('showset'); el.classList.remove('showguide', 'showiss', 'showimp'); const f = $('[data-s="dailyWriteCap"]'); f.scrollIntoView({ block: 'center' }); f.focus();
    } else if (a === 'setup_pcname' || a === 'setup_cred') { el.classList.add('showset'); el.classList.remove('showguide', 'showiss', 'showimp'); const f = $(a === 'setup_pcname' ? '[data-c="pcname"]' : '[data-c="id"]'); f.scrollIntoView({ block: 'center' }); f.focus();
    } else if (a === 'setup_core') { alert(`GitHub의 readnow-orders-core.js가 옛 버전(${P.VERSION})입니다.\n\n1) 가장 최근에 받은 readnow-orders-core.js 파일을 github.com/jerrycson/readnow-scripts 에 Add file → Upload files로 올리고 Commit changes\n2) 5분쯤 뒤 이 페이지를 새로고침\n\n필요한 버전: ${NEED_CORE}`);
    } else if (a === 'autohelp') { el.classList.toggle('showauto');
    } else if (a === 'fbusage') { window.open(`https://console.firebase.google.com/project/${FIREBASE_CONFIG.projectId}/firestore/databases/-default-/usage`, '_blank');
    } else if (a === 'pause') { pauseRequested = true; log('지금 요청이 끝나면 멈춥니다.'); window.__rnPauseAll && window.__rnPauseAll('고객 패널에서'); }
    else if (a === 'resume') { const r = await resumable(); if (r) start(r); }
    else if (a === 'export') exportBackup();
    else if (a === 'import') $('input[type=file][accept=".json"]').click();
    else if (a === 'settings') { el.classList.toggle('showset'); el.classList.remove('showguide', 'showiss'); }
    else if (a === 'guide') { el.classList.toggle('showguide'); el.classList.remove('showset', 'showiss'); }
    else if (a === 'issues') { el.classList.toggle('showiss'); el.classList.remove('showset', 'showguide'); if (el.classList.contains('showiss')) renderIssues(); }
    else if (a === 'issuecsv') exportIssuesCsv();
    else if (a === 'importpane') { el.classList.toggle('showimp'); el.classList.remove('showset', 'showguide', 'showiss'); if (el.classList.contains('showimp')) renderImportStatus(); }
    else if (a === 'saveset') { await saveSettingsUI(false);
    } else if (a === 'logintest') {
      if (await isLoggedIn()) { alert('지금은 로그인되어 있어 시험할 수 없습니다.\n다른 탭에서 알라딘 로그아웃을 한 뒤 다시 눌러 주세요.'); return; }
      running = true; render();
      try { await autoRelogin(''); log((await isLoggedIn()) ? '자동 로그인 시험 성공' : '자동 로그인 시험 실패: 로그인 화면 파일을 보내주시면 맞춰 고치겠습니다.', (await isLoggedIn()) ? 'ok' : 'err'); }
      catch (e) { log('자동 로그인 시험 실패: ' + e.message, 'err'); }
      finally { running = false; render(); }
    }
  });
  $('.fx').onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) handleImportFiles(fs); };
  const drop = $('.drop');
  drop.onclick = () => $('.fx').click();
  drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('.fx').click(); } };
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const fs = e.dataTransfer ? [...e.dataTransfer.files] : []; if (fs.length) handleImportFiles(fs); });
  el.addEventListener('dragover', (e) => e.preventDefault()); el.addEventListener('drop', (e) => e.preventDefault()); // 패널에 잘못 떨어뜨려도 브라우저가 파일을 열지 않게

  el.querySelectorAll('[data-m]').forEach((r) => (r.onchange = () => { $('.fbpwbox').style.display = r.dataset.m === 'password' && r.checked ? '' : 'none'; }));
  /* ── 핸드폰 등 웹앱에서 보낸 '수집 요청' 받기 ──
   *  이 PC에 판매관리·주문조회 탭이 열려 있고 로그인되어 있으면 2분마다 '대기 중'을 알리고,
   *  요청이 오면 먼저 받은 PC 한 대만 전체 일괄 수집을 시작함 */
  let remoteInit = false; let lastReqSeen = GM_getValue('rn-last-req', null);
  async function remoteLoop() {
    if (!fdb || !fbUser || remoteInit) return; remoteInit = true;
    const beat = () => { if (!settings.remoteRun || !fbUser) return; SYS().doc('collectors').set({ [PC.id]: { pcName: PC.name || PC.id, lastSeen: now(), running: running, page: location.pathname.split('/').pop() }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); };
    beat(); setInterval(beat, 120000);
    SYS().doc('collectRequest').onSnapshot(async (d) => {
      if (!d.exists || !settings.remoteRun) return; const r = d.data();
      if (!r || r.state !== 'requested' || r.id === lastReqSeen) return;
      if (Date.now() - Date.parse(r.requestedAt || 0) > 30 * 60000) return; // 30분 넘은 요청은 무시
      if (running || otherTabBusy()) return;
      // 한 대만 받도록: 트랜잭션으로 '받음' 표시
      let mine = false;
      try { await fdb.runTransaction(async (tx) => { const cur = await tx.get(SYS().doc('collectRequest')); const c = cur.data() || {}; if (c.id !== r.id || c.state !== 'requested') return; tx.set(SYS().doc('collectRequest'), { state: 'claimed', claimedBy: PC.name || PC.id, claimedAt: now(), writerSchema: WRITER_SCHEMA }, { merge: true }); mine = true; }); } catch (e) { return; }
      lastReqSeen = r.id; GM_setValue('rn-last-req', r.id);
      if (!mine) return;
      log(`${r.byName || '웹앱'}의 수집 요청을 받아 전체 일괄 수집을 시작합니다.`, 'ok'); beat();
      const rs = await resumable(); await start('bulk', { fresh: rs !== 'bulk' });
      const bj = await loadJob('bulk'); SYS().doc('collectRequest').set({ state: bj.status === 'done' ? 'done' : 'stopped', finishedAt: now(), message: bj.status === 'done' ? null : bj.message || null, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); beat();
    }, () => {});
  }
  setInterval(() => remoteLoop().catch(() => {}), 5000);
  // 웹앱의 [지금 수집] 버튼으로 열린 경우: 로그인이 준비되면 전체 일괄 수집을 시작(멈춘 게 있으면 이어서), 끝나면 창을 닫음
  if (/rnrun=bulk/.test(location.hash)) {
    const closeAfter = /rnclose=1/.test(location.hash); history.replaceState(null, '', location.pathname + location.search);
    (async () => {
      for (let i = 0; i < 40 && !fbUser; i++) await sleep(500);
      if (running) return; if (window.__rnPaused) { log('웹앱 요청: 이 PC는 일시정지 상태라 시작하지 않습니다 (다시 시작을 눌러 주세요)', 'warn'); return; } if (otherTabBusy()) { log('웹앱 요청: 이 PC의 다른 탭에서 이미 수집 중이라 건너뜁니다.', 'warn'); return; }
      log('웹앱에서 요청한 수집을 시작합니다.', 'ok');
      autoTriggered = true; const r = await resumable(); await start('bulk', { fresh: r !== 'bulk' }); autoTriggered = false;
      const bj = await loadJob('bulk');
      if (closeAfter && bj.status === 'done') { log('끝나서 10초 뒤 이 창을 닫습니다.', 'ok'); setTimeout(() => { try { window.close(); } catch (e) {} }, 10000); }
    })();
  }
  // 자동 수집 설정: 바꾸는 즉시 저장
  /* (1.34.0) 예전 매일 자동 스위치 묶음 없앰 — '⏰ 매일 자동 수집'(상품 탭) */
  // 설정 칸도 바꾸는 즉시 저장 (비밀번호 칸 제외)
  el.querySelector('.set').addEventListener('change', (e) => { if (e.target.matches('[data-c="pw"],[data-c="fbpw"]')) return; saveSettingsUI(true); });
  setInterval(() => autoRunCheck().catch(() => {}), 60000); setTimeout(() => autoRunCheck().catch(() => {}), 15000);
  $('input[type=file][accept=".json"]').onchange = (e) => { const f = e.target.files[0]; if (f) importBackup(f).catch((er) => log('백업 불러오기 실패: ' + er.message, 'err')); e.target.value = ''; };
  window.addEventListener('beforeunload', (e) => { if (running) { e.preventDefault(); e.returnValue = ''; } });

  for (const n of ['bulk', ...Object.keys(TASKS)]) { const j = await loadJob(n); if (j.status === 'running') { j.status = 'paused'; j.message = '창이 닫혀 중단됨'; await saveJob(j); } }
  await refreshStats(); render();
  log(`준비됨 (파서 ${P.VERSION})`);
  if (!(GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null))) log('설정에 알라딘 아이디·비밀번호를 넣으면 로그인이 풀려도 자동으로 다시 로그인합니다.', 'warn');
  /* ═══════════ 리드나우 추가 (고객 수집기 0.15.1): 진행 상황 공유 ═══════════
   * 30초마다 rn_status/crm_{PC}에 진행 상황을 올림 → 웹앱 위쪽·다른 PC에서 진행률·남은 시간이 보임.
   * 보기용 기록이라 실패해도 수집에는 영향 없음 */
  {
    let last = { label: '', done: 0, total: 0, left: null }; let pubAt = 0; let wasRunning = false;
    const pub = (force) => {
      if (!fdb || !fbUser) return; if (!force && Date.now() - pubAt < 30000) return; pubAt = Date.now();
      const task = running && currentTask && TASKS[currentTask] ? TASKS[currentTask].label : null;
      fdb.collection('rn_status').doc('crm_' + PC.id).set({ tool: '고객 수집기', pcName: PC.name || PC.id, running: running ? (task || '수집') : null,
        state: task ? `${task} · ${last.label}` : last.label || '대기', done: running ? last.done : 0, total: running ? last.total : 0, etaMin: running ? last.left : null, atMs: Date.now(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    };
    const _progress = progress;
    progress = function (label, done, total) {
      _progress(label, done, total);
      const avg = reqTimes.length ? reqTimes.reduce((a, b) => a + b, 0) / reqTimes.length : 0;
      last = { label, done: done || 0, total: total || 0, left: avg && total ? Math.round(((total - done) * avg) / 60000) : null };
      pub(false);
    };
    setInterval(() => { if (running !== wasRunning) { wasRunning = running; pub(true); } else if (running) pub(false); }, 15000);
  }
})();

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
  const VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '1.37.0'; // (1.36.0) 예전엔 '1.27.0'에 멈춰 있었음 — 표시만이 아니라 'PC끼리 새 판 맞추기'(crm_system/collector_version)도 1.27.0으로 비교해 멈춰 있었음. 이제 맨 위 @version 한 곳
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
  async function cashStopCmd(ref, v) { const t = { id: v.orderId, it: { lineNo: v.lineNo, listingId: v.listingId || null, listingKey: v.listingKey || null, aladinUsedCode: v.usedCode || null, title: v.title || '' } };
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
      <button class="b1" data-job="prdChain">상품 일괄 수집<small>신규 등록 → 알라딘 구매(전체)·팔기 → 도서·시장 지표 → 판매완료·알라딘 풀 정보 → 이미지 → 판매자 평가 → 구매자 분포 → 전체 재검토 → 판매자 평가 전체 · 고객까지 하려면 위의 ▶ 모두</small></button><div id="rnpSteps" style="display:flex;flex-wrap:wrap;gap:2px 8px;font-size:11.5px;margin:4px 0 0"></div><button style="display:none"></button>
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
      <div class="g2"><button class="b2" data-job="nbMarket" title="알라딘 미등록·세트·새상품 페이지 없는 상품: 바깥 검색(중고) 화면의 따로 등록된 같은 책들로 경쟁·시세">검색 시세 (미등록·세트)</button><button class="b2" data-job="photos" title="새상품 표지가 없는 상품: 우리 상품 페이지의 사진을 전부">우리 상품 사진</button><button class="b2" data-job="usedInfo" title="우리 책 온라인 중고 첫 페이지의 다른 판매자 매물 전부: 중고상품 구매 유의 사항 글과 사진 — 가격 결정 화면 블록의 ? 표시">경쟁 매물 유의사항·사진</button></div>
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
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px"><b>최근 기록</b><a href="#" id="rnpLogBig" style="color:#2F5D50">항목마다 자세히 · 크게 보기 ›</a></div><div class="log" id="rnpLog" style="margin-top:2px"></div>
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
    if (window.__rnStatus) window.__rnStatus.cur = { ...lastUi };
    if (auth.currentUser && Date.now() - lastPub > 30000) { lastPub = Date.now(); publishStatus(); }
  }
  let curKey = null; let pubKey = null;
  function publishStatus(extra) {
    const key = curKey || pubKey; if (!key) return Promise.resolve(); pubKey = key;
    const G = window.ReadnowRegistry || globalThis.ReadnowRegistry; const gv = (n) => (typeof unsafeWindow !== 'undefined' && unsafeWindow[n]) || window[n] || globalThis[n]; // (1.36.0) 읽은 공용 파일 판을 신호에 실음 → 웹앱 관리도구가 노선표의 판과 비교
    const cores = G ? G.loadedVers({ ReadNowCore: gv('ReadNowCore'), ReadnowSellers: gv('ReadnowSellers'), ReadnowProducts: gv('ReadnowProducts'), ReadnowPricing: gv('ReadnowPricing'), ReadnowShipping: gv('ReadnowShipping'), ReadnowOrders: gv('ReadnowOrders'), ReadnowRegistry: G }) : null;
    return C('rn_status').doc(`prd_${PC_ID}_${key}`).set({ tool: '상품 수집기', pcName: LS.get('pcName', PC_ID), running: running || null, ...lastUi, ...(extra || {}), ver: APP_VER, cores, atMs: Date.now(), ...W() }, { merge: true }).catch(() => {});
  }
  let running = null; let stopFlag = false;
  function setRunning(name) {
    running = name; stopFlag = false;
    box.querySelectorAll('[data-job]').forEach((b) => (b.disabled = !!name && b.dataset.job !== 'images'));
    $('#rnpCtlStop').classList.toggle('on', !!name);
    $('#rnpWhy').textContent = name ? `'${name}' 진행 중 — 다른 알라딘 작업은 새 탭에서 동시에 할 수 있습니다 (요청 간격은 탭끼리 나눠 씀)` : '';
    if (!name) refreshResume();
    publishStatus({ running: name || null });
  }
  $('#rnpStop').onclick = () => { stopFlag = true; window.__rnPauseAll && window.__rnPauseAll('상품 패널에서'); log('일시정지 요청: 지금 항목을 마치고 진행 위치를 저장합니다 (고객 쪽도 함께)'); $('#rnpStop').disabled = true; setTimeout(() => ($('#rnpStop').disabled = false), 3000); };

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
    $('#rnpDelay').value = SET.reqMinMs; $('#rnpDelayMax').value = SET.reqMaxMs; $('#rnpUsedDays').value = SET.usedInfoDays ?? 30; $('#rnpRecheck').value = SET.recheckDays; $('#rnpNaver').checked = !!SET.fallbackNaver; $('#rnpGoogle').checked = !!SET.fallbackGoogle; $('#rnpKey').value = SET.keyScheme; $('#rnpName').value = LS.get('pcName', '');
  }
  const saveSet = (patch) => { Object.assign(SET, patch); return C('prd_system').doc('settings').set({ ...patch, updatedBy: auth.currentUser.email, ...W() }, { merge: true }); };
  $('#rnpDelay').onchange = (e) => { const v = Math.max(300, +e.target.value || 600); saveSet({ reqMinMs: v }); PACE.setCfg({ minMs: v }); };
  $('#rnpDelayMax').onchange = (e) => { const v = Math.max(2000, +e.target.value || 15000); saveSet({ reqMaxMs: v }); PACE.setCfg({ maxMs: v }); };
  $('#rnpUsedDays').onchange = (e) => saveSet({ usedInfoDays: Math.max(0, Math.round(+e.target.value)) });
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
    await jobRef(name).set({ ...out, done: false, by: PC_NAME, pc: PC_ID, savedAt: Date.now(), ...W() }, { merge: true }); }
  async function loadProgress(name) { const p0 = await loadProgress0(name); if (p0 && FORCE_ALL && !p0.force && p0.list) { log(`수동 실행: 기간 제한으로 만든 이전 목록 대신 전부로 새 목록을 만듭니다 ('${name}')`); return null; } return p0; }
  async function loadProgress0(name) { const d = await jobRef(name).get(); if (!d.exists || d.data().done) return null; const x = d.data();
    for (const k of Object.keys(x)) if (k.endsWith('__J')) { try { x[k.slice(0, -3)] = JSON.parse(x[k]); BIG_SENT.set(name + '|' + k.slice(0, -3), bigSig(x[k.slice(0, -3)])); } catch (e) {} delete x[k]; }
    for (const k of Object.keys(x)) if (k.endsWith('__C')) { const base = k.slice(0, -3); try { let s = ''; for (let i = 0; i < x[k]; i++) s += ((await jobRef(name).collection('big').doc(`${base}_${i}`).get()).data() || {}).s || ''; x[base] = JSON.parse(s); BIG_SENT.set(name + '|' + base, bigSig(x[base])); } catch (e) {} delete x[k]; }
    return x; }
  async function finishJob(name, summary) { const d = await jobRef(name).get().catch(() => null); const del = {}; if (d && d.exists) Object.keys(d.data()).forEach((k) => { if (k.endsWith('__J') || k.endsWith('__C') || k === 'list') del[k] = firebase.firestore.FieldValue.delete(); }); [...BIG_SENT.keys()].filter((x) => x.startsWith(name + '|')).forEach((x) => BIG_SENT.delete(x)); await jobRef(name).set({ ...del, done: true, finishedAt: Date.now(), summary, ...W() }, { merge: true }); LS.set('job_' + name, null); }

  /* ───────── 알라딘 페이지 가져오기: 사람 속도 간격, 서버 불안정 시 길게 재시도, 로그인 풀림 시 자동 재로그인 ───────── */
  let lastReq = 0;
  const RETRY_WAITS = [5, 15, 45, 120, 300]; const MAX_OUTAGE_MIN = 360; // 새벽 점검(수 시간)도 기다렸다 이어감
  async function politeWait() { await PACE.wait(sleep, lockHeld ? laneCount : 1); } // 같은 묶음(인터넷 주소)에서 여러 PC가 동시에 돌면 그만큼 간격을 늘림

  function looksLoggedOut(finalUrl, doc) {
    if (/\/login\//i.test(finalUrl) || /wlogin|wC2CUser_Login/i.test(finalUrl)) return true;
    const pw = doc.querySelector('input[type="password"]');
    return !!pw && !/샵매니저|알라딘/.test(doc.title || '');
  }
  async function getDoc(url) {
    let firstFail = null, attempt = 0, loginTries = 0;
    for (;;) {
      if (stopFlag) throw new Error('멈춤');
      await politeWait();
      try {
        const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 30000);
        const r = await fetch(url, { credentials: 'include', signal: ac.signal }); clearTimeout(to);
        if (!r.ok) throw Object.assign(new Error('서버 응답 ' + r.status + (r.status === 429 ? ' (요청이 너무 많음 — 쉬었다가 느리게)' : '')), { status: r.status });
        const html = await r.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
        // 점검 안내 화면은 정상 응답(200)으로 오기도 한다 → 서버 장애처럼 기다렸다 재시도(책을 '실패'로 넘기지 않음)
        const bodyText = (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ');
        if (/점검\s*(중|시간|안내|작업)|서비스\s*점검|system\s*maintenance/i.test(bodyText) && bodyText.length < 5000 && !doc.querySelector('link[rel="canonical"], a[href*="wC2Cuser_logout"]')) throw new Error('알라딘 점검 중');
        if (looksLoggedOut(r.url, doc) || (/\/scm\//.test(url) && !doc.querySelector('a[href*="wC2Cuser_logout"]'))) {
          loginTries++;
          if (!SET.autoLogin) throw new Error('알라딘 로그인이 풀렸습니다. 직접 로그인한 뒤 같은 버튼을 다시 누르세요');
          if ((SET.maxLoginTries ?? 6) > 0 && loginTries > (SET.maxLoginTries ?? 6)) { try { GM_notification({ title: '리드나우 수집기', text: '알라딘 다시 로그인 실패 — 수집을 멈췄습니다. 로그인 후 이어하기' }); } catch (e) {} throw new Error(`알라딘 다시 로그인을 ${SET.maxLoginTries ?? 6}번 시도했지만 실패해 멈췄습니다 (진행 위치 저장됨). 로그인 후 이어하기를 눌러 주세요`); }
          if (loginTries > 1) { ui('자동 로그인 재시도 대기', 0, 0, `${SET.loginRetrySec}초 뒤 다시 시도`); await sleep(SET.loginRetrySec * 1000); }
          PACE.fail('login'); await autoRelogin(r.url, loginTries); continue;
        }
        if (firstFail) log('서버 연결 회복, 계속합니다');
        PACE.ok(); return { doc, html, finalUrl: r.url };
      } catch (e) {
        if (e.message === '멈춤' || /로그인이 풀렸/.test(e.message)) throw e;
        PACE.fail(e.name === 'AbortError' ? 'timeout' : PACE.kindOf(e.status)); firstFail = firstFail || Date.now(); if (e.status === 429 || e.status === 503) { log(`알라딘이 요청이 너무 많다고 함(${e.status}) — 이 PC의 모든 수집이 ${Math.round(PACE.cooling() / 60000)}분 쉬고, 간격을 ${PACE.state().gap}ms로 늘림`, 1); ui('알라딘 요청 제한(429) — 쉬는 중', 0, 0, `${Math.round(PACE.cooling() / 1000)}초 뒤 느린 속도로 이어감`); }
        if ((Date.now() - firstFail) / 60000 > MAX_OUTAGE_MIN) throw new Error(`알라딘 서버가 ${MAX_OUTAGE_MIN}분 넘게 응답하지 않아 멈췄습니다. 나중에 같은 버튼으로 이어하세요`);
        const w = RETRY_WAITS[Math.min(attempt, RETRY_WAITS.length - 1)]; attempt++;
        log(`요청 실패(${e.name === 'AbortError' ? '응답 시간 초과' : e.message}). ${w}초 뒤 재시도`, 1);
        await sleep(w * 1000);
      }
    }
  }
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
        const tS = Date.now(); CS.cur = k; window.__rnStatus.cur = {}; log(`[일괄 ${i + 1}/${ORDER.length}] ▶ '${STEP_LABEL[k]}' 시작`);
        curStage = k; lastSame = false; let rr; try { rr = await RUN[k](); } catch (e) { if (e && e.message === '멈춤') throw e; log(`[일괄] '${STEP_LABEL[k]}' 오류: ${e && e.message} — 이 단계는 실패로 두고 다음 단계로 갑니다 (진행 위치는 저장돼 다음에 이어감)`, 1); rr = 'error'; } finally { curStage = null; }
        log(`[일괄 ${i + 1}/${ORDER.length}] ${rr === false ? '■ 시작 못 함' : stopFlag ? '■ 멈춤' : '✓ 끝'} '${STEP_LABEL[k]}' (${Math.round((Date.now() - tS) / 60000)}분)`);
        if (window.__rnPaused || stopFlag) { CS.res[k] = 'wait'; CS.cur = null; log(`[일괄] '${STEP_LABEL[k]}' 중 일시정지 — 다음 단계로 넘어가지 않고 여기서 멈춤 (이어하기로 이 단계부터)`); throw new Error('멈춤'); }
        CS.res[k] = rr === 'error' ? 'fail' : rr === 'skip' ? 'skip-busy' : rr === false ? (lastSame ? 'skip-busy' : 'fail') : stopFlag ? 'wait' : 'done'; CS.cur = null;
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
            m.usedFirstPage.filter((r) => r && r.listingId && !r.soldOut && String(r.sellerCode) !== '996008' && !b.ours.has(r.usedCode)).forEach((r) => { if (seen.has(String(r.listingId)) && seen.get(String(r.listingId)) > cut) return; items.push({ lid: String(r.listingId), bookId: part[n], sc: r.sellerCode || null, name: r.sellerName || null, mon: b.mon ? 1 : 0 }); }); }); }
        const uniq = [...new Map(items.map((x) => [x.lid, x])).values()].sort((a, b) => b.mon - a.mon);
        prog = { list: uniq, i: 0, ok: 0, same: 0, changed: 0, none: 0, fail: 0, startedAt: nowIso() }; await saveProgress('usedInfo', prog);
        log(`경쟁 매물 유의사항·사진: 첫 페이지 다른 판매자 매물 ${uniq.length.toLocaleString()}개 (가격 감시 중인 책 ${uniq.filter((x) => x.mon).length.toLocaleString()}개 먼저, ${days > 0 ? days + '일 안에 본 것은 건너뜀' : '매번 전부'})`);
      }
      const covers = new Map();
      for (; prog.i < prog.list.length; prog.i++) {
        if (stopFlag) { await saveProgress('usedInfo', prog); throw new Error('멈춤'); }
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
      for (const ono of v.orderNos || []) { try { const rr = await fetch(`https://www.aladin.co.kr/scm/worder_process.aspx?cmd=StartDelivery&ono=${encodeURIComponent(ono)}`, { credentials: 'include' }); const tx2 = await rr.text(); const al = (tx2.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null;
          results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: al }; } catch (e) { results[ono] = { state: 'fail', at: nowIso(), msg: e.message }; }
        await ref.set({ results, beatAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {}); await sleep(800); } // (1.34.7) 한 건마다 결과·살아 있음 신호
      // (1.34.0) 주문확인요청 화면을 제대로 읽었을 때만 '끝남' — 로그인 화면·읽기 실패로 빈 목록이면 '확인 못함'(웹앱에서 다시 확인)
      let gcDoc = null; try { const gc = await getDoc('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); gcDoc = gc.doc; const x = SH.parseDeliveryPage(gc.doc); const okP = !!(x && x.tabCounts && Object.keys(x.tabCounts).length); const left = new Set((x.orders || []).map((o) => o.orderNo));
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = !okP ? 'unknown' : left.has(ono) ? 'fail' : 'done'; if (!okP) gcDoc = null; } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
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
  const lookDoc = async (url) => { const u = new URL(url, 'https://www.aladin.co.kr').href; const r = await fetch(u, { credentials: 'include' }); if (!r.ok) throw new Error('서버 응답 ' + r.status); await sleep(500); return { doc: new DOMParser().parseFromString(await r.text(), 'text/html'), finalUrl: r.url }; }; // 일시정지·작업 줄과 상관없이 짧게 (책 몇 권)
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
    for (const it of items) { let r; try { r = await c2bAddOne(it, cart.set); } catch (e) { r = { state: 'failed', msg: e.message }; }
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
        const want = (l) => l.usedCode && l.title && (!l.bookId || P.isUnregistered(l) || P.setInfo(l.title).set); const haveV = new Map(); (await C('prd_market_nobook').get()).forEach((d) => haveV.set(d.id, d.data().src || ''));
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
      if (tried) return; let idleSince = null;
      const t = setInterval(() => { const busy = running || imgRunning || (window.__rnCrm && window.__rnCrm.busy()); if (busy) { idleSince = null; return; } idleSince = idleSince || Date.now(); if (Date.now() - idleSince < 120000) return; clearInterval(t); GM_setValue('rnu-reload-for', v); safeReload('새 버전으로 바꿈', null); }, 10000); }, () => {});
    // 새로고침 뒤 이어가기: 실제로 시작될 때까지 표시를 지우지 않고 15초마다 다시 시도(최대 10분), 사람 확인 없이(무인) 시작
    { const after = GM_getValue('rnu-resume-after-reload', null);
      if (after && JOBS[after]) { let tries = 0; const t = setInterval(() => { tries++;
        if (window.__rnPaused) { clearInterval(t); log(`새로고침 뒤 이어가기 '${JOBS[after][0]}': 일시정지 상태라 이어가지 않음 (이어하기 버튼으로 계속)`, 1); return; }
        if (running) return; if (tries > 40) { clearInterval(t); log(`새로고침 뒤 이어가기 '${JOBS[after][0]}'를 10분 동안 시작하지 못했습니다 — 이어하기 버튼을 눌러 주세요`, 1); return; }
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
  let frameLoads = 0, memReload = false;
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
    curKey = key; FORCE_ALL = !!(opt && opt.manual) && !['chain', 'prdChain'].includes(key); setRunning(name); const tJ = Date.now(); if (FORCE_ALL) log(`수동 실행: '${name}'을(를) 기간 제한 없이 전부 모읍니다 (기존 기록은 그대로 두고 바뀐 것만 덧붙임)`); if (window.__rnStatus) Object.assign(window.__rnStatus, { job: name, jobStart: tJ, cur: {}, chain: (key === 'chain' || key === 'prdChain') ? window.__rnStatus.chain : null, sub: null }); log(`▶ '${name}' 시작 (수집기 ${VER} · ${PC_NAME})`);
    let res;
    try { res = await fn(); if (res === 'reload') { ui('새 버전으로 바꾸는 중 — 곧 이어감', 0, 0); } else if (res === 'cancel') { ui('취소함', 0, 0); log(`'${name}' 취소함`); } else if (res === false) { ui('시작 못 함 — 다른 PC가 알라딘 작업 중', 0, 0, '', '그 작업이 끝나면 자동으로 시작합니다 (일시정지를 누르면 취소)'); log(`'${name}': 다른 PC가 알라딘 작업 중이라 기다립니다. 끝나면 자동으로 시작합니다`, 1); waitThenRun(key); } else if (!stopFlag) { ui('완료: ' + name, 1, 1, '', ''); log(name + ' 완료', 0); } }
    catch (e) { lastRunErr = e.message;
      const paused = e.message === '멈춤';
      ui(paused ? '일시정지됨 — 진행 위치 저장' : '오류로 멈춤', 0, 0, paused ? '' : e.message, '이어하기 버튼(또는 같은 버튼)을 누르면 멈춘 자리부터 합니다');
      if (!paused) log('오류: ' + e.message, 1);
    } finally { if (window.__rnStatus) Object.assign(window.__rnStatus, { job: null, cur: {}, lastEnd: { name, at: Date.now(), ms: Date.now() - tJ } });
      log(`■ '${name}' 끝남 — ${Math.round((Date.now() - tJ) / 60000)}분${stopFlag ? ' (멈춤)' : ''}`); setRunning(null); curKey = null; FORCE_ALL = false;
      if (memReload) { log(`메모리 정리를 위해 새로고침 → '${name}' 이어가기`); safeReload('메모리 정리', key); return res; }
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

  // 이어하기: 멈춘 작업(어느 PC에서 멈췄든)을 찾아 버튼으로 보여 준다
  let resumeKey = null;
  async function refreshResume() {
    try {
      const qs = await C('prd_jobs').where('done', '==', false).get(); const list = {};
      qs.forEach((d) => (list[d.id] = d.data()));
      resumeKey = list.chain ? 'chain' : ['prdChain', 'nbMarket', 'photos', 'market', 'rev6mStale', 'rev6mAll', 'revTop', 'revAll', 'aladinBuy', 'buyback', 'dynamic', 'dynAll', 'soldInfo', 'poolInfo', 'scanFull', 'scanNew'].find((k) => list[k]) || null;
      const on = !!resumeKey && !running;
      $('#rnpCtlResume').classList.toggle('on', on);
      if (on) { const j = list[resumeKey]; $('#rnpResume').textContent = `이어하기: ${JOBS[resumeKey][0]} (${j.by || ''}에서 ${new Date(j.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 멈춤)`; }
    } catch (e) {}
  }
  $('#rnpCheck').onclick = () => preflight(false).then((ok) => ok && alert('시작 전 점검: 모두 정상입니다. 자세한 내용은 기록 창에 있습니다.'));
  $('#rnpLogBig').onclick = (e) => { e.preventDefault(); window.__rnJournalToggle && window.__rnJournalToggle(); };
  $('#rnpResume').onclick = () => { if (!resumeKey) return; window.__rnResumeOk && window.__rnResumeOk(); runJob(resumeKey); };
  $('#rnpReset').onclick = async () => { if (!resumeKey) return; if (!confirm(`'${JOBS[resumeKey][0]}'의 '멈춘 자리'만 잊습니다.\n\n· 이미 받은 기록은 하나도 지우거나 바꾸지 않습니다.\n· 다음에 다시 누르면 처음부터 훑지만, 이미 받은 것은 건너뛰고 새로 생긴 것만 받습니다.\n\n계속할까요?`)) return;
    const keys = resumeKey === 'chain' ? ['chain', ...(((await jobRef('chain').get()).data() || {}).stage ? [{ crm: null, scanNew: 'scanNew', aladinBuy: 'aladinBuy', buyback: 'buyback', market: 'market', rev6m: 'rev6mStale', revTop: 'revTop', dynamic: 'dynamic' }[((await jobRef('chain').get()).data() || {}).stage]].filter(Boolean) : [])] : [resumeKey]; // 일괄 수집이면 일괄 순서표와 '지금 단계'의 자리만
    for (const k of keys) { try { const d = (await jobRef(k).get()).data(); if (d && !d.done) await jobRef(k).set({ done: true, discarded: true, discardedAt: Date.now(), discardedBy: PC_NAME }, { merge: true }); LS.set('job_' + k, null); } catch (e) {} }
    log(`'${JOBS[resumeKey][0]}'의 멈춘 자리만 잊었습니다 (받은 기록은 그대로, 다음엔 새로 생긴 것만 받음)`); refreshResume(); };
  setTimeout(drawTemp, 2000);
  const drawSteps = () => { const el = $('#rnpSteps'); if (!el) return; el.innerHTML = '<span style="color:#5B6B66">이번에 할 것:</span> <a href="#" data-stepall="1" style="color:#2F5D50">전체 선택</a> · <a href="#" data-stepall="0" style="color:#2F5D50">전체 해제</a><br>' + Object.entries(STEP_LABEL).map(([k, l]) => `<label style="white-space:nowrap"><input type="checkbox" data-step="${k}" ${(SET.steps || {})[k] !== false ? 'checked' : ''}> ${l}</label>`).join('');
    el.querySelectorAll('[data-stepall]').forEach((a) => (a.onclick = (ev) => { ev.preventDefault(); const on = a.dataset.stepall === '1'; SET.steps = Object.fromEntries(Object.keys(STEP_LABEL).map((k) => [k, on])); C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 단계 ${on ? '전체 선택' : '전체 해제'} (모든 PC에 적용)`); drawSteps(); }));
    el.querySelectorAll('[data-step]').forEach((c) => (c.onchange = () => { SET.steps = { ...(SET.steps || {}), [c.dataset.step]: c.checked }; C('prd_system').doc('settings').set({ steps: SET.steps }, { merge: true }).catch(() => {}); log(`일괄 수집 '${STEP_LABEL[c.dataset.step]}' ${c.checked ? '켬' : '끔'} (모든 PC에 적용)`); })); };
  setTimeout(drawSteps, 1500); setInterval(drawSteps, 60000);
  $('#rnpRevTest').onclick = () => { if (running) return log('다른 작업 진행 중', 1); reviewTest().catch((e) => log('시험 실패: ' + e.message, 1)); };

  // 다른 PC 상태: 잠금(고객 수집기 포함) + 각 PC가 30초마다 올리는 진행 상황
  function watchPcs() {
    let lock = null; const pcs = {};
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

/* ══════════ 송장 입력 (1.28.0): 발송 요청 화면(worder_delivery.aspx?orderstep=4)에서 주문마다 송장번호를 넣고 알라딘의 '입력완료'(deliveryNoComplete)를 누름 ══════════
 * 한 번에 한 주문 → 화면이 다시 열리면 결과 확인 → 다음 주문 (진행은 shp_invoices/{id}.items[].state 에 저장: todo → sent → done / fail / missing)
 * 알라딘 화면의 기능을 그대로 씀(새로 만든 요청 없음). 확인 창은 '예'로, 알림 글은 기록으로 남김
 * 이 화면에는 ALPS 업로드 파일 받기 · ALPS 운송장 목록 넣기 단추도 있음 (웹앱 오늘 출고 화면과 같은 기능, 기준은 readnow-shipping-core.js 한 곳) */
(async function rnInvoiceRunner() {
  'use strict';
  if (window.top !== window || !/\/scm\/(worder_delivery|worder_process)\.aspx/i.test(location.pathname)) return;
  const act = GM_getValue('rn-inv-active', null); const DELIV = 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4';
  if (/worder_process/i.test(location.pathname)) { if (act) setTimeout(() => { location.href = DELIV; }, 2500); return; } // 입력완료 뒤 거치는 화면이면 발송 요청으로 돌아감
  const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (!SH || !SH.matchInvoices) return;
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const PCN = GM_getValue('pcName', '') || (GM_getValue('rn-pc', {}) || {}).name || '';
  const nowIso = () => new Date().toISOString(); const e = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const box = document.createElement('div'); box.id = 'rn-inv-box'; box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99999;width:340px;max-height:60vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.25);font:12.5px/1.5 system-ui,sans-serif;color:#1E2B28;padding:10px';
  document.body.appendChild(box); const say = (h) => { box.innerHTML = `<b style="color:#2F5D50">리드나우 · 송장 입력</b><div style="margin-top:4px">${h}</div>`; };
  await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); });
  if (!auth.currentUser) { say('수집기에서 구글 로그인 후 다시 열어 주세요'); return; }
  const pageOrders = () => SH.parseDeliveryPage(document).orders;
  const xlsxDown = (aoa, name) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Sheet1'); XLSX.writeFile(wb, name); };
  const ymdhm = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1_');
  function idle(msg) {
    say(`${msg ? `<div style="margin-bottom:6px">${msg}</div>` : ''}<button id="rn-alps-up" style="width:100%;margin:2px 0;padding:6px;border:1px solid #2F5D50;border-radius:6px;background:#2F5D50;color:#fff;cursor:pointer">① ALPS 업로드 파일 받기</button>
      <label style="display:block;margin-top:6px">② 출력한 운송장 목록 넣기 (ALPS 통합관리 운송장출력 → 엑셀)<input type="file" id="rn-alps-wb" accept=".xlsx,.xls,.csv" style="width:100%"></label><div id="rn-inv-res"></div>`);
    box.querySelector('#rn-alps-up').onclick = async () => { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' });
      try { const rr = await fetch('https://www.aladin.co.kr/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); const ex = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html'));
        if (!ex || !ex.rows.length) return alert('발송 요청 주문이 없습니다'); xlsxDown(SH.alpsUploadAoa(ex), `ALPS업로드_${ymdhm()}.xlsx`); } catch (er) { alert('실패: ' + er.message); } };
    box.querySelector('#rn-alps-wb').onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
      const W = SH.parseAlpsWaybills(aoa); if (!W) return alert('ALPS 운송장 목록 파일이 아닙니다 (운송장번호·수하인명 칸이 없음)'); const M = SH.matchInvoices(pageOrders(), W); const okA = M.byOrder.filter((x) => x.status === 'ok'); const parL = M.byOrder.filter((x) => x.status === 'partial'); let okL = okA; // (1.34.0) '일부만 맞음'은 확인하고 따로
      const res = box.querySelector('#rn-inv-res'); res.innerHTML = `<div style="margin-top:6px">맞춤: <b>${okL.length}</b>건 · 확인 필요 ${M.byOrder.length - okL.length}건 · ALPS에만 있음 ${M.extra.length}줄</div>
        ${M.byOrder.map((x) => `<div style="color:${x.status === 'ok' ? '#2e7d32' : x.status === 'partial' ? '#b58100' : '#B0322A'}">${e(x.recipient)} · ${e(x.invoice || '-')} · ${{ ok: '맞음', partial: '일부 상품만 맞음', many: '운송장 여럿', none: '못 찾음' }[x.status]}</div>`).join('')}
        ${okL.length ? `<button id="rn-inv-one" style="margin-top:6px;padding:5px 8px">1건 먼저 입력해 보기</button> <button id="rn-inv-all" style="padding:5px 8px;background:#2F5D50;color:#fff;border:0;border-radius:5px">맞은 ${okL.length}건 모두 입력</button>` : ''}${parL.length ? ` <button id="rn-inv-par" style="padding:5px 8px">일부만 맞은 ${parL.length}건 확인하고 넣기</button>` : ''}`;
      const start = async (limit) => { if (!confirm(`알라딘 발송 요청에 송장번호 ${limit ? 1 : okL.length}건을 입력하고 '입력완료'를 누릅니다. 진행할까요?`)) return;
        const ref = db.collection('shp_invoices').doc(); await ref.set({ createdAt: nowIso(), by: auth.currentUser.email, from: 'collector', fileName: f.name, limit: limit || 0, status: 'running', claim: { pc: PCN, at: nowIso() },
          items: okL.map((x) => ({ orderNo: x.orderNo, invoice: x.invoice, recipient: x.recipient, match: x.status, state: 'todo' })), skipped: M.byOrder.filter((x) => !okL.includes(x)).map((x) => ({ orderNo: x.orderNo, recipient: x.recipient, status: x.status, invoices: x.invoices })), extra: M.extra.map((w) => ({ invoice: w.invoice, name: w.name, title: w.title, sku: w.sku })), uploadedAt: TS() });
        GM_setValue('rn-inv-active', { id: ref.id, at: Date.now() }); try { sessionStorage.setItem('rn-inv-tab', ref.id); } catch (e) {} step(ref.id); };
      const o1 = box.querySelector('#rn-inv-one'); if (o1) o1.onclick = () => start(1); const oa = box.querySelector('#rn-inv-all'); if (oa) oa.onclick = () => start(0);
      const op = box.querySelector('#rn-inv-par'); if (op) op.onclick = () => { if (!confirm(`상품 일부만 맞은 주문 ${parL.length}건 — 같은 수령인의 다른 상자 송장일 수 있습니다:\n${parL.slice(0, 12).map((x) => `· ${x.recipient} ${x.orderNo} → ${x.invoice || '-'}`).join('\n')}\n\n하나하나 확인했으면 '확인'`)) return; okL = parL; Promise.resolve(start(0)).finally(() => { okL = okA; }); }; };
  }
  async function step(id) {
    const ref = db.collection('shp_invoices').doc(id); const v = (await ref.get()).data();
    if (!v || ['done', 'stopped', 'paused'].includes(v.status)) { GM_deleteValue('rn-inv-active'); return idle(v ? `지난 송장 입력: ${({ done: '끝남', stopped: '멈춤', paused: '첫 건 확인 대기' })[v.status]}` : ''); }
    { const SHx = window.ReadnowShipping || globalThis.ReadnowShipping; let pg = null; try { pg = SHx ? SHx.parseDeliveryPage(document) : null; } catch (er) {} // (1.34.7) 화면을 제대로 읽었을 때만 판단 — 알라딘 오류·점검 화면이면 '끝남/없음'으로 잘못 처리하던 것
      if (!pg || !pg.tabCounts || !Object.keys(pg.tabCounts).length) { const k = +(sessionStorage.getItem('rn-inv-bad') || 0) + 1; sessionStorage.setItem('rn-inv-bad', String(k)); if (k <= 5) { say(`발송 요청 화면을 제대로 못 읽음 — ${k * 5}초 뒤 다시 엶 (${k}/5)`); setTimeout(() => { location.href = DELIV; }, k * 5000); return; } sessionStorage.removeItem('rn-inv-bad'); await ref.set({ status: 'paused', pausedAt: nowIso(), pauseWhy: '발송 요청 화면을 5번 못 읽음', uploadedAt: TS() }, { merge: true }); GM_deleteValue('rn-inv-active'); return idle('발송 요청 화면을 5번 못 읽어 멈춤 — 알라딘 화면을 확인한 뒤 웹앱에서 다시 시작'); }
      sessionStorage.removeItem('rn-inv-bad'); }
    const items = v.items.map((x) => ({ ...x })); const pres = new Map(pageOrders().map((o) => [o.orderNo, o])); const alertMsg = sessionStorage.getItem('rnInvAlert'); sessionStorage.removeItem('rnInvAlert');
    for (const x of items) if (x.state === 'sent') { const o = pres.get(x.orderNo);
      if (!o || (o.deliveryNo && o.deliveryNo === x.invoice)) { x.state = 'done'; x.doneAt = nowIso(); if (alertMsg) x.note = alertMsg; }
      else { x.tries = (x.tries || 0) + 1; x.err = alertMsg || '입력 뒤에도 발송 요청에 그대로 있음'; x.state = x.tries >= 2 ? 'fail' : 'todo'; } }
    const save = (extra) => ref.set({ items, ...(extra || {}), uploadedAt: TS() }, { merge: true });
    const doneN = items.filter((x) => x.state === 'done').length;
    if (v.limit && doneN >= v.limit) { await save({ status: 'paused', pausedAt: nowIso() }); GM_deleteValue('rn-inv-active'); return idle(`첫 ${doneN}건 입력 끝 — 배송&구매확정전 탭에서 송장번호가 맞게 들어갔는지 확인한 뒤, 웹앱 오늘 출고 화면에서 '나머지 계속'을 누르세요.`); }
    let next = null; for (const x of items) { if (x.state && x.state !== 'todo') continue; if (!pres.has(x.orderNo)) { x.state = 'missing'; x.err = '발송 요청에 없음 (이미 입력됐거나 취소)'; continue; } next = x; break; }
    if (!next) { const c = (k) => items.filter((x) => x.state === k).length; await save({ status: 'done', doneAt: nowIso() }); GM_deleteValue('rn-inv-active');
      try { GM_notification({ title: '리드나우 — 송장 입력 끝', text: `입력 ${c('done')} · 실패 ${c('fail')} · 없음 ${c('missing')}` }); } catch (er) {}
      idle(`<b>송장 입력 끝</b>: 입력 ${c('done')} · 실패 ${c('fail')} · 발송 요청에 없음 ${c('missing')}`); if (v.from !== 'collector') setTimeout(() => window.close(), 8000); return; }
    const inp = document.getElementById('deliveryNo.' + next.orderNo); if (!inp) { next.state = 'fail'; next.err = '송장번호 칸을 못 찾음'; await save(); return step(id); }
    say(`송장 입력 중 ${doneN + 1} / ${items.length}<br>${e(next.recipient)} · ${e(next.orderNo)} → <b>${e(next.invoice)}</b><br><button id="rn-inv-stop" style="margin-top:6px">멈추기</button>`);
    box.querySelector('#rn-inv-stop').onclick = async () => { GM_deleteValue('rn-inv-active'); await ref.set({ status: 'stopped', stoppedAt: nowIso(), uploadedAt: TS() }, { merge: true }); location.reload(); };
    await new Promise((r) => setTimeout(r, 1500)); if (!GM_getValue('rn-inv-active', null)) return;
    // (1.34.7) 넣기 직전에 서버 상태를 다시 확인(트랜잭션) — 웹앱에서 '멈추기'를 눌렀으면 넣지 않음 (예전: 멈춤을 'running'으로 덮어써 계속 넣었음)
    next.state = 'sent'; next.sentAt = nowIso(); let go = false; try { await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const cur = sn.data(); if (!cur || ['stopped', 'done', 'paused'].includes(cur.status)) return; tx.set(ref, { items, status: 'running', uploadedAt: TS() }, { merge: true }); go = true; }); } catch (er) { go = false; }
    if (!go) { GM_deleteValue('rn-inv-active'); return idle('송장 입력 멈춤 (웹앱에서 멈추기)'); }
    inp.value = next.invoice;
    const sc = document.createElement('script'); sc.textContent = `(function(){ window.confirm = function(){ return true; }; window.alert = function(m){ try { sessionStorage.setItem('rnInvAlert', String(m)); } catch (e) {} }; deliveryNoComplete(${JSON.stringify(next.orderNo)}); })();`;
    document.body.appendChild(sc);
    setTimeout(() => { if (/worder_delivery/.test(location.pathname)) location.href = DELIV; }, 20000); // 화면이 안 바뀌면 다시 열어 결과 확인
  }
  { const hm = location.hash.match(/rninv=([\w-]+)/); if (hm) { try { sessionStorage.setItem('rn-inv-tab', hm[1]); } catch (e) {} history.replaceState(null, '', location.pathname + location.search); } }
  const mine = (id) => { try { return sessionStorage.getItem('rn-inv-tab') === id; } catch (e) { return false; } }; // (1.34.0) 맡은 탭에서만 진행 — 사람이 다른 발송 요청 탭을 새로 열어도 두 탭이 같이 입력하지 않음
  if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }
})();
/* ══════════ 고객 응대 문구 도우미 (1.34.0): 묻고 답하기 답변 입력 화면 · 구매평 목록 ══════════
 * 세 칸: ① 인사말 ② 내용 ③ 마무리. 문구를 누르면 답변 칸(지금 커서 자리, 없으면 맨 끝)에 한 줄로 들어감. 순서대로 누르면 답변 완성.
 * 칸마다 문구 고치기·지우기·끌어서 순서 바꾸기·새로 넣기. 문구는 Firebase(app_settings/qna_phrases) 한 곳에 두고 모든 PC·웹앱(⚙ 설정)이 같이 씀 — 이 PC에도 사본을 둬서 바로 뜸.
 * 답변 칸: 묻고 답하기 = #txtAnswer, 그 밖의 화면 = 마지막으로 누른 입력칸(textarea). 알라딘 '등록' 단추는 사람이 직접 누름 (자동으로 보내지 않음). */
(function rnPhraseHelper() {
  if (window.top !== window || !/\/scm\/(wUsedShopC2C|wShopSurvey)/i.test(location.pathname)) return;
  const DEF = {
    greet: ['안녕하세요? 반갑습니다!', '안녕하세요, 북스킹입니다. 문의 주셔서 진심으로 감사드립니다.', '안녕하세요, 고객님. 저희 상품에 관심 가져 주셔서 감사합니다.', '안녕하세요, 고객님. 답변이 늦어 죄송합니다.', '안녕하세요, 북스킹입니다. 기다려 주셔서 감사합니다.', '안녕하세요, 고객님. 소중한 구매평 남겨 주셔서 진심으로 감사드립니다.'],
    body: ['문의하신 상품은 현재 재고가 있어 바로 구매하실 수 있습니다.', '확인해 보니 문의하신 상품은 아쉽게도 현재 품절되었습니다.', '상품 상태는 등록된 등급과 상품 설명에 적힌 내용과 같습니다.', '직접 확인한 결과 말씀하신 부분(낙서·밑줄·변색 등)은 없으며 상태 양호합니다.', '확인 결과 일부 사용감이 있어 상품 설명에 자세히 적어 두었습니다.', '영업일 오후 2시까지 주문하시면 당일 출고를 원칙으로 하고 있습니다.', '택배는 롯데택배로 보내 드리며, 출고 후 송장번호로 배송 조회가 가능합니다.', '저희(북스킹) 상품끼리는 한 상자에 묶어 보내 드립니다.', '주문 취소는 출고 전까지 알라딘 주문 내역에서 바로 하실 수 있습니다.', '반품·교환은 상품을 받으신 날로부터 7일 안에 신청하실 수 있습니다.', '불편을 드려 대단히 죄송합니다. 확인하는 대로 신속하게 처리해 드리겠습니다.', '말씀해 주신 의견은 상품 검수에 꼭 반영하겠습니다.', '만족스러운 거래가 되셨다니 저희도 정말 기쁩니다.'],
    close: ['오늘도 좋은 하루 보내세요!', '또 궁금하신 점 있으면 언제든 편하게 문의주세요!', '감사합니다.', '북스킹을 이용해 주셔서 감사합니다.', '앞으로도 더 좋은 상품과 서비스로 보답하겠습니다.', '다시 한번 불편을 드려 죄송합니다.', '즐거운 독서 되세요!'] };
  const PARTS = [['greet', '① 인사말'], ['body', '② 내용'], ['close', '③ 마무리']];
  const LKEY = 'rn-phrases'; let P = null; try { P = GM_getValue(LKEY, null); } catch (e) {}
  const okP = (x) => x && PARTS.every(([k]) => Array.isArray(x[k]));
  if (!okP(P)) P = JSON.parse(JSON.stringify(DEF));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ── 답변 칸 찾기: 묻고 답하기 = #txtAnswer, 그 밖 = 마지막으로 누른 textarea
  let lastTa = null; document.addEventListener('focusin', (e) => { if (e.target && e.target.tagName === 'TEXTAREA' && !e.target.closest('#rn-ph')) lastTa = e.target; }, true);
  document.addEventListener('focusout', (e) => { const t = e.target; if (t && t.tagName === 'TEXTAREA' && !t.closest('#rn-ph')) { t._rnPos = t.selectionStart; t._rnEnd = t.selectionEnd; } }, true); // 커서 자리 기억 (문구를 누르는 순간 입력칸에서 커서가 빠져도 그 자리에 넣음)
  const target = () => (lastTa && document.contains(lastTa) ? lastTa : null) || document.querySelector('#txtAnswer') || [...document.querySelectorAll('textarea')].find((t) => !t.closest('#rn-ph') && t.getClientRects().length) || null;
  function insert(text) { const ta = target(); if (!ta) { flash('답변 입력칸을 찾지 못했습니다 — 입력칸을 한 번 누른 뒤 문구를 누르세요'); return; }
    const v = ta.value; const act = document.activeElement === ta; const s = Math.min(v.length, act ? ta.selectionStart : ta._rnPos ?? v.length); const e2 = Math.min(v.length, Math.max(s, act ? ta.selectionEnd : ta._rnEnd ?? s));
    const before = v.slice(0, s), after = v.slice(e2); const pre = before && !/\n$/.test(before) ? '\n' : ''; const post = after && !/^\n/.test(after) ? '\n' : '';
    ta.value = before + pre + text + post + after; const pos = (before + pre + text).length; ta._rnPos = ta._rnEnd = pos + post.length;
    ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); try { ta.focus(); ta.setSelectionRange(ta._rnPos, ta._rnPos); } catch (e) {} flash(''); }
  // ── 저장: 이 PC 사본(GM) + Firebase 한 곳
  let fs = null, user = null;
  const saveAll = () => { try { GM_setValue(LKEY, P); } catch (e) {} if (fs && user) fs.collection('app_settings').doc('qna_phrases').set({ ...P, at: new Date().toISOString(), by: user.email || '', from: 'collector' }).catch((e) => flash('Firebase 저장 실패 (이 PC에만 저장됨): ' + (e.code || e.message))); };
  try { if (window.firebase) { if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
    fs = firebase.firestore(); firebase.auth().onAuthStateChanged((u) => { user = u; if (!u) return; fs.collection('app_settings').doc('qna_phrases').onSnapshot((d) => { if (!d.exists) { saveAll(); return; } const x = d.data(); if (okP(x)) { P = { greet: x.greet, body: x.body, close: x.close }; try { GM_setValue(LKEY, P); } catch (e) {} draw(); } }, () => {}); }); } } catch (e) {}
  // ── 화면
  const st = document.createElement('style'); st.textContent = `#rn-ph{position:fixed;right:14px;top:90px;z-index:2147483640;width:340px;max-height:calc(100vh - 110px);display:flex;flex-direction:column;background:#fff;border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);font:12.5px/1.45 system-ui,'Malgun Gothic',sans-serif;color:#1E2B27}
  #rn-ph .hd{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#2F5D50;color:#fff;border-radius:9px 9px 0 0;cursor:move;user-select:none} #rn-ph .hd b{flex:1} #rn-ph .hd button{border:0;border-radius:5px;background:#24493F;color:#fff;padding:2px 8px;cursor:pointer}
  #rn-ph .bd{overflow:auto;padding:6px 8px} #rn-ph.min .bd{display:none} #rn-ph h4{margin:8px 0 3px;font-size:12.5px;color:#2F5D50;display:flex;justify-content:space-between} #rn-ph h4 small{font-weight:400;color:#8A9692}
  #rn-ph .ls{max-height:130px;overflow-y:auto;border:1px solid #D7E2DD;border-radius:6px;padding:2px} #rn-ph .it{display:flex;align-items:center;gap:4px;padding:3px 5px;border-bottom:1px dashed #EEF2F0;cursor:grab} #rn-ph .it:hover{background:#EEF6F2}
  #rn-ph .it .tx{flex:1;cursor:pointer} #rn-ph .it .ed,#rn-ph .it .dl{font-size:11px;cursor:pointer;padding:0 3px} #rn-ph .it .ed{color:#1F5FAF} #rn-ph .it .dl{color:#B0322A} #rn-ph .it.over{box-shadow:inset 0 3px 0 #2F5D50} #rn-ph .it.under{box-shadow:inset 0 -3px 0 #2F5D50} #rn-ph .it.dragging{opacity:.45} #rn-ph .dh{cursor:grab;color:#8A9692;padding:0 3px 0 0;touch-action:none;user-select:none;font-size:13px} #rn-ph .it{cursor:default}
  #rn-ph .it input{flex:1;border:1px solid #2F5D50;border-radius:4px;padding:2px 4px;font:inherit} #rn-ph .ad{display:flex;gap:4px;margin-top:3px} #rn-ph .ad input{flex:1;border:1px solid #C9D6D0;border-radius:5px;padding:3px 6px;font:inherit} #rn-ph .ad button,#rn-ph .ft button{border:0;border-radius:5px;background:#2F5D50;color:#fff;padding:3px 9px;cursor:pointer;font:inherit}
  #rn-ph .ft{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px} #rn-ph .ft button.g{background:#EEF2F0;color:#2F5D50} #rn-ph .msg{color:#A8661B;font-size:11.5px;min-height:14px;margin-top:4px}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'rn-ph'; if (GM_getValue('rn-ph-min', 0)) box.classList.add('min');
  let msgT = null; function flash(t) { const m = box.querySelector('.msg'); if (!m) return; m.textContent = t; clearTimeout(msgT); if (t) msgT = setTimeout(() => (m.textContent = ''), 6000); }
  let drag = null;
  function draw() { const open = !box.classList.contains('min');
    box.innerHTML = `<div class="hd"><b>✍ 고객 응대 문구</b><button data-a="min">${open ? '접기' : '펼치기'}</button></div><div class="bd">
      <div class="hint" style="color:#5B6B66">누르면 답변 칸에 한 줄로 들어감 (① → ② → ③ 차례로) · 왼쪽 ⠿ 를 잡고 위아래로 끌면 순서 바꿈 · 모든 PC·웹앱 공유</div>
      ${PARTS.map(([k, l]) => `<h4>${l} <small>${P[k].length}개</small></h4><div class="ls" data-k="${k}">${P[k].map((t, i) => `<div class="it" data-k="${k}" data-i="${i}"><span class="dh" title="잡고 위아래로 끌어 순서 바꾸기">⠿</span><span class="tx" title="누르면 답변 칸에 넣기">${esc(t)}</span><span class="ed">수정</span><span class="dl">삭제</span></div>`).join('') || '<div class="it"><i style="color:#8A9692">문구 없음 — 아래에 넣기</i></div>'}</div>
        <div class="ad"><input data-new="${k}" placeholder="새 ${l.slice(2)} 문구"><button data-add="${k}">넣기</button></div>`).join('')}
      <div class="ft"><button class="g" data-a="clear" title="답변 칸 비우기">답변 칸 비우기</button><button class="g" data-a="reset" title="기본 문구를 빠진 것만 다시 넣음 (지금 문구는 그대로)">기본 문구 다시 넣기</button></div><div class="msg"></div></div>`;
    box.querySelectorAll('.it[data-i]').forEach((el) => { const k = el.dataset.k, i = +el.dataset.i;
      el.querySelector('.tx').onmousedown = (ev) => ev.preventDefault(); // 입력칸의 커서를 빼앗지 않음
      el.querySelector('.tx').onclick = () => insert(P[k][i]);
      el.querySelector('.dl').onclick = (ev) => { ev.stopPropagation(); if (!confirm(`이 문구를 지울까요?\n\n${P[k][i]}`)) return; P[k].splice(i, 1); saveAll(); draw(); };
      el.querySelector('.ed').onclick = (ev) => { ev.stopPropagation(); el.innerHTML = `<input value="${esc(P[k][i])}"><span class="ed">저장</span><span class="dl">취소</span>`; const inp = el.querySelector('input'); inp.focus(); inp.select();
        const ok = () => { const v = inp.value.trim(); if (v) { P[k][i] = v; saveAll(); } draw(); }; el.querySelector('.ed').onclick = ok; el.querySelector('.dl').onclick = () => draw(); inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } if (e.key === 'Escape') draw(); }; };
      // (1.34.3) 왼쪽 ⠿ 를 잡고 위아래로 끌면 순서가 바뀜 (마우스·터치 모두) — 놓는 자리에 초록 줄이 보임
      const dh = el.querySelector('.dh'); if (dh) dh.onpointerdown = (e) => { e.preventDefault(); const list = el.parentElement; const rows = () => [...list.querySelectorAll('.it[data-i]')]; el.classList.add('dragging'); try { dh.setPointerCapture(e.pointerId); } catch (x) {} let to = i;
        const mv = (ev) => { const R = rows(); R.forEach((r) => r.classList.remove('over', 'under')); let tgt = R.length - 1; for (let j = 0; j < R.length; j++) { const b = R[j].getBoundingClientRect(); if (ev.clientY < b.top + b.height / 2) { tgt = j; break; } tgt = j + 1; }
          to = tgt; if (to < R.length) R[to].classList.add('over'); else R[R.length - 1].classList.add('under'); const lb = list.getBoundingClientRect(); if (ev.clientY < lb.top + 14) list.scrollTop -= 8; else if (ev.clientY > lb.bottom - 14) list.scrollTop += 8; };
        const up = () => { dh.removeEventListener('pointermove', mv); dh.removeEventListener('pointerup', up); dh.removeEventListener('pointercancel', up); el.classList.remove('dragging'); rows().forEach((r) => r.classList.remove('over', 'under'));
          let dst = to > i ? to - 1 : to; if (dst !== i && dst >= 0) { const [m] = P[k].splice(i, 1); P[k].splice(dst, 0, m); saveAll(); } draw(); };
        dh.addEventListener('pointermove', mv); dh.addEventListener('pointerup', up); dh.addEventListener('pointercancel', up); }; });
    box.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => { const k = b.dataset.add; const inp = box.querySelector(`[data-new="${k}"]`); const v = inp.value.trim(); if (!v) return; P[k].push(v); saveAll(); draw(); }));
    box.querySelectorAll('[data-new]').forEach((inp) => (inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector(`[data-add="${inp.dataset.new}"]`).click(); } }));
    box.querySelector('[data-a="min"]').onclick = () => { box.classList.toggle('min'); GM_setValue('rn-ph-min', box.classList.contains('min') ? 1 : 0); draw(); };
    const cl = box.querySelector('[data-a="clear"]'); if (cl) cl.onclick = () => { const ta = target(); if (!ta) return flash('답변 입력칸을 찾지 못했습니다'); if (ta.value && !confirm('답변 칸의 글을 모두 지울까요?')) return; ta.value = ''; ta._rnPos = 0; ta.dispatchEvent(new Event('input', { bubbles: true })); };
    const rs = box.querySelector('[data-a="reset"]'); if (rs) rs.onclick = () => { let n = 0; PARTS.forEach(([k]) => DEF[k].forEach((t) => { if (!P[k].includes(t)) { P[k].push(t); n++; } })); saveAll(); draw(); flash(n ? `기본 문구 ${n}개를 다시 넣었습니다` : '빠진 기본 문구가 없습니다'); };
    // 띠를 잡고 옮김 (자리 기억)
    box.querySelector('.hd').onmousedown = (ev) => { if (ev.target.closest('button')) return; ev.preventDefault(); const r = box.getBoundingClientRect(); const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      const mv = (e) => { box.style.left = Math.max(0, Math.min(e.clientX - dx, innerWidth - 80)) + 'px'; box.style.top = Math.max(0, Math.min(e.clientY - dy, innerHeight - 40)) + 'px'; box.style.right = 'auto'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); const q = box.getBoundingClientRect(); GM_setValue('rn-ph-pos', { x: Math.round(q.left), y: Math.round(q.top) }); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); }; }
  const mount = () => { document.body.appendChild(box); const pos = GM_getValue('rn-ph-pos', null); if (pos) { box.style.left = Math.min(pos.x, innerWidth - 80) + 'px'; box.style.top = Math.min(pos.y, innerHeight - 40) + 'px'; box.style.right = 'auto'; } draw(); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
