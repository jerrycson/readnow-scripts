/* readnow-pc-runtime.js — 리드나우 수집기 1.55.0의 바탕 — 이 PC 이름·네이버 다시 로그인·일시정지(모든 탭)·작업 기록·탭끼리 나누는 상태·통합 관제판
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { runtime: '1.55.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
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
/* (1.38.0) 일시정지 = 이 PC의 모든 수집기 탭에 한 번에 (예전: 누른 탭에서만 멈춤 → 다른 탭에서 돌던 작업은 계속 돌고, 버튼은 3초 뒤 다시 켜져 '안 먹는' 것처럼 보였음)
 *  상태는 GM 'rnu-paused'(참/거짓) 한 곳. 값이 바뀌면 모든 탭이 바로 알아채고(GM_addValueChangeListener, 없으면 3초마다 확인) 자기 작업을 지금 항목까지 저장하고 멈춤 */
(function rnPause() {
  window.__rnPaused = !!GM_getValue('rnu-paused', false);
  const stopHere = () => { try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {} try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} };
  const changed = () => { try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {} };
  window.__rnPauseInfo = () => GM_getValue('rnu-paused-info', null);
  window.__rnPauseAll = (why) => { window.__rnPaused = true; GM_setValue('rnu-paused-info', { at: Date.now(), why: why || '사람이 누름' }); GM_setValue('rnu-paused', true); stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', `■ 일시정지 (${why || '사람이 누름'}) — 이 PC의 모든 수집기 탭(고객·상품·일괄)이 지금 항목까지 저장하고 멈춤. 사람이 다시 시작하기 전에는 자동으로 다시 시작하지 않음`); changed(); };
  window.__rnResumeOk = () => { if (window.__rnPaused) window.__rnLog && window.__rnLog('수집기', 'info', '▶ 사람이 다시 시작함 (일시정지 풀림)'); window.__rnPaused = false; GM_setValue('rnu-paused', false); changed(); };
  const onRemote = (v) => { v = !!v; if (v === window.__rnPaused) return; window.__rnPaused = v; if (v) { stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', '■ 다른 탭에서 일시정지를 눌렀습니다 — 이 탭의 작업도 지금 항목까지 저장하고 멈춤'); } else window.__rnLog && window.__rnLog('수집기', 'info', '▶ 다른 탭에서 다시 시작을 눌렀습니다 (일시정지 풀림)'); changed(); };
  try { if (typeof GM_addValueChangeListener === 'function') GM_addValueChangeListener('rnu-paused', (k, o, n, remote) => { if (remote) onRemote(n); }); else throw 0; } catch (e) { setInterval(() => onRemote(GM_getValue('rnu-paused', false)), 3000); }
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
  const MAXMEM = 10000; const buf = []; const lt = []; let ltDirty = false; const pend = []; const idbPend = []; let dirty = false; let seq = 0;
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
  /* (1.43.0) 단계 표시 — 일괄이든 개별 수집이든 '지금 작업 안의 단계'를 차례로 적음 (지난 단계 ✓·걸린 시간, 지금 ▶).
   *  고객 쪽(progress)·상품 쪽(ui)이 단계 이름을 알리면 여기 한 곳에서 쌓음. 기다림·양보·로그인처럼 잠깐 지나가는 상태는 단계로 치지 않고 '잠깐' 글로만 */
  const PH_TMP = /^(다른 PC 작업 중|대기 중|기다리|양보|자동 로그인|네이버로 다시 로그인|알라딘 요청 제한|새 버전으로|시작 못 함|취소|오류로 멈춤|완료|일시정지)|기다리는 중|쉬는 중/;
  window.__rnPhaseReset = (kind, title) => { const S = window.__rnStatus; S.ph = S.ph || {}; S.ph[kind] = { title: title || null, list: [], note: null, start: Date.now() }; };
  window.__rnPhase = (kind, label, key) => { const S = window.__rnStatus; S.ph = S.ph || {}; let P = S.ph[kind]; if (!P || (key !== undefined && P.key !== key)) { window.__rnPhaseReset(kind, null); P = S.ph[kind]; P.key = key; }
    const l = String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60); if (!l) return; if (PH_TMP.test(l)) { P.note = l; return; } P.note = null;
    const last = P.list[P.list.length - 1]; if (last && last.l === l) return; const now = Date.now(); if (last) last.ms = now - last.at;
    P.list.push({ l, at: now }); if (P.list.length > 40) { P.cut = (P.cut || 0) + 1; P.list.shift(); } };
  window.__rnLog = (mod, lv, msg) => { const now = new Date(); const e = { t: now.getTime(), m: mod, l: lv, x: String(msg).slice(0, 600) };
    const last = buf[buf.length - 1]; if (lv === 'detail' && last && last.l === 'detail' && last.m === mod && last.x === e.x) return; // 같은 줄 반복은 생략
    buf.push(e); if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); if (lv !== 'detail') { lt.push(e); if (lt.length > 80) lt.shift(); ltDirty = true; } pend.push(e); idbPend.push(e); dirty = true; };
  // 이 PC 보관 (5초마다), Firebase (1분마다, 10분 단위 문서)
  setInterval(() => { if (pend.length > 5000) pend.splice(0, pend.length - 5000); jflush().catch(() => {}); }, 20000); addEventListener('beforeunload', () => { jflush(); });
  const upNow = async () => { if (!pend.length || !window.firebase || !firebase.apps.length || !firebase.auth().currentUser) return; const out = pend.splice(0, pend.length);
    const groups = {}; out.forEach((e) => { const k = new Date(e.t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, ''); (groups[k] = groups[k] || []).push(`${new Date(e.t + 9 * 3600e3).toISOString().slice(11, 19)} [${e.m}] ${e.l === 'err' ? '⚠ ' : e.l === 'warn' ? '! ' : e.l === 'detail' ? '· ' : ''}${e.x}`); });
    if (window.__rnLogDenied) return; for (const [k, lines] of Object.entries(groups)) { try { await firebase.firestore().collection('rn_logs').doc(`${pcName()}_${k}0`).set({ pc: pcName(), slot: k + '0', lines: firebase.firestore.FieldValue.arrayUnion(...lines), at: Date.now() }, { merge: true }); } catch (e) { if (/permission/i.test(e.code || e.message)) { window.__rnLogDenied = true; buf.push({ t: Date.now(), m: '기록', l: 'warn', x: 'Firebase에 기록을 못 올림 (규칙에 rn_logs 허용 필요) — 이 PC 안에는 계속 보관합니다' }); } else { pend.unshift(...out.slice(-3000)); } break; } } };
  setInterval(upNow, 60000);
  window.__rnFlush = async () => { try { await jflush(); } catch (e) {} try { await upNow(); } catch (e) {} }; // 탭을 닫기 직전 등: 남은 기록을 이 PC(IndexedDB)와 Firebase에 바로 저장
  /* (1.38.0) 탭끼리 나누는 '지금 상태'와 '최근 기록' — 개요 화면은 어느 탭에서 열어도 이 PC 전체(모든 수집기 탭)를 보여 줌
   *  GM 'rnu-live-{탭}' = 그 탭이 지금 하는 일(2초마다) · 'rnu-lt-{탭}' = 그 탭의 중요한 기록 마지막 80줄. 닫힌 탭의 값은 저절로 정리(상태 1분, 기록 12시간) */
  const TAB = Math.random().toString(36).slice(2, 8); window.__rnTab = TAB;
  const page = location.pathname.split('/').pop();
  const liveNow = () => { const S = window.__rnStatus || {}; let crmBusy = false, crmLabel = null; try { crmBusy = !!(window.__rnCrm && window.__rnCrm.busy()); crmLabel = crmBusy && window.__rnCrm.label ? String(window.__rnCrm.label() || '') : null; } catch (e) {}
    let imgBusy = false; try { imgBusy = !!(window.__rnPrd && window.__rnPrd.imgBusy && window.__rnPrd.imgBusy()); } catch (e) {}
    const slim = (o) => (o && typeof o === 'object' ? JSON.parse(JSON.stringify(o)) : o || null);
    return { tab: TAB, page, at: Date.now(), busy: !!(S.job || crmBusy || imgBusy), job: S.job || (crmBusy ? '고객·주문: ' + (crmLabel || '수집') : imgBusy ? '이미지 받기' : null), jobKey: S.jobKey || null, jobStart: S.jobStart || null, chain: slim(S.chain), sub: slim(S.sub), cur: slim(S.cur), crm: slim(S.crm), ph: slim(S.ph), crmBusy, lastEnd: S.lastEnd || null, stopping: !!(S.job && window.__rnPaused) }; };
  const pubLive = () => { try { GM_setValue('rnu-live-' + TAB, liveNow());
      if (ltDirty) { ltDirty = false; GM_setValue('rnu-lt-' + TAB, lt.slice()); } } catch (e) {} };
  setInterval(pubLive, 2000); setTimeout(pubLive, 300);
  addEventListener('beforeunload', () => { try { GM_deleteValue('rnu-live-' + TAB); } catch (e) {} });
  window.__rnLive = () => { const out = []; try { for (const k of GM_listValues()) { if (!k.startsWith('rnu-live-')) continue; const v = GM_getValue(k, null); if (!v || Date.now() - (v.at || 0) > 60000) { if (!v || Date.now() - (v.at || 0) > 5 * 60000) GM_deleteValue(k); continue; } out.push(v); } } catch (e) { out.push(liveNow()); } return out; };
  window.__rnLogTail = (n) => { let all = []; try { for (const k of GM_listValues()) { if (!k.startsWith('rnu-lt-')) continue; const v = GM_getValue(k, null) || []; const last = v.length ? v[v.length - 1].t : 0; if (Date.now() - last > 12 * 3600e3) { GM_deleteValue(k); continue; } all = all.concat(v); } } catch (e) { all = buf.filter((e) => e.l !== 'detail'); } all.sort((a, b) => a.t - b.t); return all.slice(-(n || 30)); };
  // 크게 보는 기록 창
  const st = document.createElement('style'); st.textContent = `#rn-jw{position:fixed;left:12px;bottom:12px;z-index:2147483646;width:min(760px,calc(100vw - 470px));height:46vh;min-height:180px;background:#fff;border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none;flex-direction:column;font:12px/1.5 Consolas,'Malgun Gothic',monospace;resize:both;overflow:hidden}
  #rn-jw.on{display:flex} #rn-jw .h{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#2F5D50;color:#fff;font:600 12.5px system-ui,'Malgun Gothic';cursor:move;user-select:none} #rn-jw .h b{flex:1}
  #rn-jw .h button,#rn-jw .h select,#rn-jw .h input{font:12px system-ui,'Malgun Gothic';border:0;border-radius:5px;padding:3px 7px} #rn-jw .h input{width:120px}
  #rn-jw .b{flex:1;overflow:auto;padding:6px 8px;white-space:pre-wrap;word-break:break-all} #rn-jw .b div{border-bottom:1px solid #F1F3F2} #rn-jw .detail{color:#5B6B66} #rn-jw .info{color:#1E2B27;font-weight:600} #rn-jw .warn{color:#A8661B;font-weight:600} #rn-jw .err{color:#B0322A;font-weight:700} #rn-jw .ok{color:#2F7D4F;font-weight:600}
  #rn-jw .ov{padding:7px 10px;background:#F2F6F4;border-bottom:1px solid #D7E2DD;font:12.5px/1.5 system-ui,'Malgun Gothic'} #rn-jw .ov .ol{margin:1px 0} #rn-jw .ov .ol.now{margin-top:5px} #rn-jw .ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-jw .pb{height:9px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-jw .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-jw .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-jw .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-jw .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-jw .chip.now{background:#2F5D50;border-color:#2F5D50;color:#fff;font-weight:700} #rn-jw .chip.off{text-decoration:line-through;opacity:.6} #rn-jw .chip.skip{background:#FFF4E0;color:#A8661B} #rn-jw .chip.fail{background:#FDE8E6;color:#B0322A}
  #rn-jw .jt button{background:#24493F;color:#cfe3da;margin-left:2px} #rn-jw .jt button.on{background:#fff;color:#2F5D50;font-weight:700} #rn-jw details.jd{border-bottom:1px solid #E4ECE8} #rn-jw details.jd > summary{cursor:pointer;padding:4px 2px;font:600 12.5px system-ui,'Malgun Gothic';color:#2F5D50} #rn-jw details.jd > summary small{color:#8A9692;font-weight:400}
  #rn-jw .tm{color:#9AA5A1} #rn-jw .md{display:inline-block;min-width:34px;color:#2F5D50}`;
  // (1.38.0) 진행 요약(지금 무엇을·전체 중 어디까지)을 만드는 곳은 여기 한 곳 — 기록 창 위쪽과 개요 화면이 같이 씀 (다른 탭의 상태로도 그릴 수 있게 상태를 인자로 받음)
  const fm = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`; };
  window.__rnOvHtml = (S, crmBusy) => { S = S || {}; const c = S.chain; const cur = S.cur || {}; const crm = S.crm;
    const bar = (p, col) => `<div class="pb"><i style="width:${Math.max(0, Math.min(100, p * 100)).toFixed(1)}%;background:${col || '#2F5D50'}"></i></div>`;
    const curFrac = (x) => (x && x.total ? Math.min(1, (x.done || 0) / x.total) : 0);
    if (!S.job && !crmBusy) { return `<div class="ol"><b>쉬는 중</b>${S.lastEnd ? ` · 마지막 작업 '${S.lastEnd.name}' ${new Date(S.lastEnd.at).toLocaleTimeString('ko-KR')} 끝 (${fm(S.lastEnd.ms)})` : ''}</div>`; return; }
    let h = `<div class="ol"><b>${S.job || '고객·주문 수집'}</b> · 시작 ${S.jobStart ? new Date(S.jobStart).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'} · ${S.jobStart ? fm(Date.now() - S.jobStart) + '째' : ''}</div>`;
    if (c && c.order) { const on = c.order.filter((k) => c.on[k]); const di = on.filter((k) => c.res[k] === 'done' || c.res[k] === 'skip-busy' || c.res[k] === 'partial').length; const isCrmJob = S.job === '고객 전체 일괄 수집'; const inCur = c.cur && c.on[c.cur] ? (c.cur === 'crm' || isCrmJob ? curFrac(crm) : curFrac(cur)) : 0; const all = on.length ? (di + inCur) / on.length : 0;
      h += `<div class="ol">전체 ${di}/${on.length}단계 · ${(all * 100).toFixed(1)}%</div>${bar(all)}<div class="chips">${c.order.map((k, i) => { const st = !c.on[k] ? 'off' : c.res[k] === 'done' ? 'done' : c.res[k] === 'skip-busy' ? 'skip' : c.res[k] === 'fail' ? 'fail' : c.res[k] === 'partial' ? 'skip' : k === c.cur ? 'now' : 'wait';
        return `<span class="chip ${st}" title="${c.labels[k]}${st === 'off' ? ' (끔)' : st === 'skip' ? (c.res[k] === 'partial' ? ' (정한 시간만큼 하고 다음 단계로 — 나머지는 다음 일괄 때 이어서)' : ' (다른 PC가 하는 중이라 건너뜀)') : ''}">${st === 'done' ? '✓' : st === 'now' ? '▶' : st === 'off' ? '–' : st === 'skip' ? '↷' : st === 'fail' ? '✗' : i + 1} ${c.labels[k]}</span>`; }).join('')}</div>`; }
    if (S.sub && S.sub.order) { const sb = S.sub; h += `<div class="chips" style="margin-left:14px"><span style="font-size:11px;color:#5B6B66">고객 세부:</span>${sb.order.map((k) => { const st = sb.res[k] === 'done' ? 'done' : k === sb.cur ? 'now' : 'wait'; return `<span class="chip ${st}">${st === 'done' ? '✓' : st === 'now' ? '▶' : ''} ${sb.labels[k]}</span>`; }).join('')}</div>`; }
    const x = (c && c.cur === 'crm') || (S.job === '고객 전체 일괄 수집') ? crm : cur;
    { const P = (S.ph || {})[x === crm ? 'crm' : 'prd']; if (P && P.list && P.list.length) { const L = P.list.slice(-12); const hid = P.list.length - L.length + (P.cut || 0);
      h += `<div class="chips" style="margin-left:${c && c.order ? 14 : 0}px"><span style="font-size:11px;color:#5B6B66">${c && c.order ? '이 단계 안:' : '단계:'}</span>${hid ? `<span class="chip done" title="앞 단계 ${hid}개">… ${hid}</span>` : ''}${L.map((q, i) => { const isNow = i === L.length - 1;
        return `<span class="chip ${isNow ? 'now' : 'done'}" title="${String(q.l).replace(/"/g, '&quot;')} · ${new Date(q.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 시작${q.ms != null ? ' · ' + fm(q.ms) + ' 걸림' : ''}">${isNow ? '▶' : '✓'} ${String(q.l).replace(/</g, '&lt;')}${!isNow && q.ms != null && q.ms >= 60000 ? ` <small>${fm(q.ms)}</small>` : ''}</span>`; }).join('')}</div>${P.note ? `<div class="ol sub">잠깐: ${String(P.note).replace(/</g, '&lt;')}</div>` : ''}`; } }
    if (x && (x.state || x.label)) h += `<div class="ol now">지금: <b>${x.state || x.label}</b>${x.total ? ` · ${(+x.done || 0).toLocaleString()} / ${(+x.total).toLocaleString()} (${(curFrac(x) * 100).toFixed(1)}%)` : ''}${x.etaMin != null ? ` · 남은 시간 약 ${fm(x.etaMin * 60000)} (끝 ${new Date(Date.now() + x.etaMin * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})` : ''}</div>${x.total ? bar(curFrac(x), '#3F7FD1') : ''}${x.sub ? `<div class="ol sub">${String(x.sub).replace(/</g, '&lt;')}</div>` : ''}`;
    return h; };
  const mount = () => { document.head.appendChild(st); const w = document.createElement('div'); w.id = 'rn-jw';
    w.innerHTML = `<div class="h"><b title="이 띠를 잡고 끌어서 옮김 · 두 번 누르면 처음 자리로 · 오른쪽 아래 모서리로 크기 조절">⠿ 작업 기록 — ${pcName()}</b><span class="jt"><button data-jt="today" class="on" title="이 화면을 연(새로고침한) 뒤의 기록">이번 화면</button><button data-jt="hist" title="날짜별로 쌓인 모든 기록 (오늘 포함)">전체 기록</button><button data-jt="pw" title="가격 감시기의 지금 상태와 기록만 따로 (수집기 기록과 섞지 않음 · 이 PC의 감시 탭에서 모아 둠)">🛰 감시</button></span><select id="rnjF"><option value="imp">중요만</option><option value="all" selected>전체 (항목마다)</option><option value="err">오류·경고만</option></select><input id="rnjQ" placeholder="검색"><label style="font-weight:400"><input type="checkbox" id="rnjA" checked> 자동 스크롤</label><button id="rnjD" title="모든 기록(오늘+지난)을 파일로 받고, 이 PC의 기록을 비웁니다">내려받기·비우기</button><button id="rnjX">닫기</button></div><div class="ov" id="rnjO"></div><div class="b" id="rnjB"></div>`;
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
    w.querySelectorAll('[data-jt]').forEach((bt) => (bt.onclick = () => { tab = bt.dataset.jt; w.querySelectorAll('[data-jt]').forEach((x) => x.classList.toggle('on', x === bt)); lastDrawn = -1; pwDrawn = -1; if (tab === 'hist') drawHist(); else if (tab === 'pw') drawPw(); else draw(); drawOv(); }));
    const draw = () => { if (!w.classList.contains('on') || tab !== 'today') return; const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim();
      const rows = buf.filter((e) => (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || e.x.includes(q))).slice(-3000);
      const b = w.querySelector('#rnjB'); b.innerHTML = rows.map((e) => `<div class="${e.l}"><span class="tm">${new Date(e.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> <span class="md">${e.m}</span> ${e.x.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('') || '<div class="detail">기록 없음</div>';
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; lastDrawn = buf.length; };
    // ── 맨 위 요약: 지금 무엇을, 전체 중 어디까지 (1초마다)
    const ov = w.querySelector('#rnjO');
    /* (1.43.0) 이 PC 전체에서 지금 하는 일 — 개요와 같은 기준(일하는 탭이 따로 있어도 그 탭의 단계가 보임). 예전엔 기록 창을 연 탭의 상태만 봐서, 다른 탭·자동 수집이 일할 때 단계 표시가 비었음 */
    const drawOv = () => { if (!w.classList.contains('on')) return; if (tab === 'pw') { const h = pwOvHtml(); if (ov.innerHTML !== h) ov.innerHTML = h; return; } let lives = []; try { lives = window.__rnLive ? window.__rnLive() : []; } catch (e) {} const mine = lives.find((v) => v.tab === TAB); const busy = lives.filter((v) => v.busy); const main = mine && mine.busy ? mine : busy[0] || null;
      const html = main ? window.__rnOvHtml(main, !!main.crmBusy) + (main.tab !== TAB ? `<div class="ol sub">이 PC의 다른 탭(${main.page === 'worders.aspx' ? '주문조회' : main.page === 'wrecord_edit.aspx' ? '상품 조회' : '판매관리'})에서 진행 중${busy.length > 1 ? ` · 함께 진행 중: ${busy.filter((v) => v !== main).map((v) => String(v.job || '').replace(/</g, '&lt;')).join(', ')}` : ''}</div>` : busy.length > 1 ? `<div class="ol sub">함께 진행 중: ${busy.filter((v) => v !== main).map((v) => String(v.job || '').replace(/</g, '&lt;')).join(', ')}</div>` : '') : window.__rnOvHtml(window.__rnStatus || {}, !!(window.__rnCrm && window.__rnCrm.busy()));
      if (ov.innerHTML !== html) ov.innerHTML = html; };
    /* (1.43.0) 🛰 감시 탭: 가격 감시기(따로 도는 스크립트)의 지금 상태와 기록 — 수집기 기록과 섞지 않고 따로. 감시기가 도는 상품 조회 탭이 모아 두면(GM) 이 PC의 어느 탭에서도 봄 */
    let pwDrawn = -1;
    const pwOvHtml = () => { const st = GM_getValue('rnu-pw-st', null); const e = (x) => String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (!st) return '<div class="ol"><b>가격 감시기 신호 없음</b> — 이 PC에서 가격 감시기가 도는 상품 조회 탭(wrecord_edit)이 열려 있지 않거나, 감시기가 설치되지 않음</div>';
      const age = Date.now() - (st.at || 0); const off = age > 90000;
      return `<div class="ol"><b>${off ? '⚪ 감시기 신호 끊김' : '🛰 가격 감시기'}</b>${st.ver ? ` v${e(st.ver)}` : ''} · ${off ? `${Math.round(age / 60000)}분 전 마지막 신호 (감시 탭이 닫혔거나 멈춤)` : '지금'}</div><div class="ol now">${e(st.state) || '-'}</div>${st.prog ? `<div class="ol sub">${e(st.prog)}</div>` : ''}`; };
    const drawPw = () => { if (!w.classList.contains('on') || tab !== 'pw') return; const L = GM_getValue('rnu-pw-tail', []) || []; const stamp = L.length + ':' + (L.length ? L[L.length - 1].t : 0) + w.querySelector('#rnjF').value + w.querySelector('#rnjQ').value; if (stamp === pwDrawn) return; pwDrawn = stamp;
      const rows = L.filter(pass).slice(-3000); const b = w.querySelector('#rnjB'); b.innerHTML = rows.map(fmtRow).join('') || '<div class="detail">감시 기록 없음 — 가격 감시기가 이 PC에서 돌면 여기에 쌓입니다 (예전 기록은 가격 감시 탭의 기록 받기)</div>';
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; };
    setInterval(drawPw, 2000);
    setInterval(drawOv, 1000);
    setInterval(() => { if (buf.length !== lastDrawn) draw(); }, 1000); // 진행을 늦추지 않게 1초에 한 번만 그림
    ['#rnjF', '#rnjQ'].forEach((q) => (w.querySelector(q).oninput = () => (tab === 'hist' ? drawHist() : tab === 'pw' ? ((pwDrawn = -1), drawPw()) : draw()))); w.querySelector('#rnjX').onclick = () => { w.classList.remove('on'); GM_setValue('rnu-jw', 0); };
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
  /* (1.43.0) 가격 감시기 기록 모으기: 감시기 칸(#rn-prc)이 이 화면에 있으면 그 기록 줄·상태를 이 수집기의 GM에 모아 둠(최근 400줄) → 기록 창 🛰 감시 탭.
   *  감시기 코드는 바꾸지 않음(화면에 쓰는 글을 그대로 옮김). Firebase에는 다시 올리지 않음 — 감시기가 이미 rn_logs에 올림(중복 없게) */
  (function pwMirror() { let tail = null, dirty = false, seen = null;
    const ingest = (nodes) => { tail = tail || GM_getValue('rnu-pw-tail', []) || []; seen = seen || new Set(tail.slice(-300).map((e) => e.raw));
      for (const n of nodes) { const raw = String(n.textContent || '').trim(); if (!raw || seen.has(raw)) continue; seen.add(raw); const x = raw.replace(/^\d{2}:\d{2}:\d{2} \[가격 감시\] /, '');
        const bad = /B0322A|rgb\(176, 50, 42\)/i.test((n.getAttribute && n.getAttribute('style')) || '') || /^⚠/.test(x); tail.push({ t: Date.now(), m: '감시', l: bad ? 'err' : 'info', x, raw }); }
      if (tail.length > 400) tail.splice(0, tail.length - 400); if (seen.size > 1000) seen = new Set(tail.map((e) => e.raw)); dirty = true; };
    const attach = () => { const lg = document.getElementById('pw_log'); if (!lg) return false; ingest([...lg.children].reverse());
      new MutationObserver((ms) => { const add = []; ms.forEach((m) => m.addedNodes.forEach((x) => add.push(x))); if (add.length) ingest(add.reverse()); }).observe(lg, { childList: true });
      setInterval(() => { try { const vm = ((document.querySelector('#rn-prc .hd small') || {}).textContent || '').match(/v([\d.]+)/); GM_setValue('rnu-pw-st', { at: Date.now(), state: ((document.getElementById('pw_state') || {}).textContent || '').trim().slice(0, 300), prog: ((document.getElementById('pw_prog') || {}).textContent || '').trim().slice(0, 300), ver: vm ? vm[1] : null, tab: TAB });
        if (dirty) { dirty = false; GM_setValue('rnu-pw-tail', tail); } } catch (e) {} }, 2000); return true; };
    if (!attach()) { let n = 0; const t = setInterval(() => { if (attach() || ++n > 60) clearInterval(t); }, 1000); } })();
  /* (1.52.0) 'Script error. (:0)' = 다른 주소에서 온 알라딘 화면 자체 스크립트(광고·통계 등)의 오류 — 브라우저가 내용을 가려 보내 우리가 고칠 것이 없음 → 기록 창을 덮지 않게 빼고 하루 몇 번 나왔는지만 셈 */
  window.addEventListener('error', (ev) => { if (/^Script error\.?$/i.test(String(ev.message || '').trim()) && !ev.filename) { window.__rnXerr = (window.__rnXerr || 0) + 1; return; } window.__rnLog('오류', 'err', `${ev.message} (${(ev.filename || '').split('/').pop()}:${ev.lineno})`); });
  window.addEventListener('unhandledrejection', (ev) => window.__rnLog('오류', 'err', `처리되지 않은 오류: ${ev.reason && ev.reason.message ? ev.reason.message : ev.reason}`));
  window.__rnLog('수집기', 'info', `탭 열림 · ${location.pathname.split('/').pop()}`);
})();
/* ═════════════ 통합 관제판 (1.38.0) ═════════════
 * 예전: 오른쪽 위에 [▶ 모두][고객·주문][상품·매입][기록][–] 탭만 있고, 일시정지·이어하기·최근 기록이 패널마다 따로 있었음
 *       (상품 패널의 '최근 기록'은 상품 것만, 일시정지는 누른 탭에서만, 이어하기는 맨 앞 하나만, '▶ 모두'는 무엇을 하는지 안 보임)
 * 이제: 한 판(관제판)에 ① 머리줄 — 지금 상태(쉬는 중/작업 중/멈추는 중/일시정지)를 접어도 항상 보임
 *       ② 개요 탭 — 지금 하는 일과 전체 진행, 주 버튼 하나(일시정지 ↔ 다시 시작) + 전체 수집, 멈춘 작업 목록(작업마다 이어하기·버리기),
 *          다음 자동 수집, 이 PC 모든 탭의 최근 기록, 다른 PC·판 상태
 *       ③ 고객·주문 / 상품·매입 / 가격 감시 탭 — 개별 수집과 설정 (예전 패널을 그대로 이 판 안에 넣음)
 *       ④ 기록 — 크게 보는 기록 창
 * 근거: 큰 회사의 수집·배치 도구(Airflow·Jenkins·Datadog 같은)는 '한 곳에서 상태를 보고 한 버튼으로 멈추는' 관제판 하나를 두고,
 *       멈춘 작업(대기열)을 목록으로 보여 주며, 기록은 모든 작업을 한 줄기로 모음. 자주 쓰는 것만 앞에, 자세한 것은 탭 안에 (점진적 공개) */
(function rnCtl() {
  if (window.top !== window || !/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname)) return;
  const VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '?';
  const G = '#2F5D50', AMB = '#A8661B', RED = '#B0322A', BLU = '#3F7FD1';
  const st = document.createElement('style');
  st.textContent = `#rn-ctl{position:fixed;top:8px;right:12px;z-index:2147483647;width:420px;max-height:calc(100vh - 16px);display:flex;flex-direction:column;background:#fff;border:1px solid #CFDAD5;border-radius:12px;box-shadow:0 10px 32px rgba(20,40,34,.18);font:13px/1.45 system-ui,'Malgun Gothic',sans-serif;color:#1E2B27;overflow:hidden}
  #rn-ctl .ch{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${G};color:#fff;cursor:pointer;user-select:none}
  #rn-ctl .ch b{font-size:13.5px} #rn-ctl .ch small{opacity:.75;font-size:11px} #rn-ctl .ch .sp{flex:1}
  #rn-ctl .ch .bdg{font:700 11.5px system-ui,'Malgun Gothic';padding:3px 9px;border-radius:10px;background:#fff;color:${G};white-space:nowrap;max-width:190px;overflow:hidden;text-overflow:ellipsis}
  #rn-ctl .ch .bdg.busy{background:#DCEBFF;color:#1F4F96} #rn-ctl .ch .bdg.pause{background:#FFE7C2;color:#7A4A10} #rn-ctl .ch .bdg.stop{background:#FFE7C2;color:#7A4A10;animation:rnblink 1s infinite}
  @keyframes rnblink{50%{opacity:.55}}
  #rn-ctl .ch .tg{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:6px;width:26px;height:22px;cursor:pointer;font-weight:700}
  #rn-ctl.min #rn-uni,#rn-ctl.min .cb{display:none}
  #rn-uni{display:flex;gap:0;border-bottom:1px solid #E1E8E5;background:#F6F9F8;padding:0 6px}
  #rn-uni button{flex:1;padding:8px 4px 7px;border:0;border-bottom:3px solid transparent;background:transparent;color:#4C5E58;cursor:pointer;font:600 12.5px system-ui,'Malgun Gothic'}
  #rn-uni button.on{color:${G};border-bottom-color:${G}} #rn-uni button:hover{color:${G}} #rn-uni small{font-weight:400;opacity:.8}
  #rn-uni .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:4px;vertical-align:1px;background:#bbb}
  #rn-ctl .cb{overflow:auto;flex:1;min-height:0}
  #rn-ctl #rn-crm,#rn-ctl #rnp,#rn-ctl #rn-prc{position:static !important;top:auto !important;right:auto !important;left:auto !important;width:auto !important;max-height:none !important;box-shadow:none !important;border:0 !important;border-radius:0 !important;overflow:visible !important;z-index:auto !important;margin:0 !important}
  #rn-ctl #rn-crm>.hd,#rn-ctl #rnp>.hd,#rn-ctl #rn-prc>.hd{display:none !important}
  #rn-ctl #rn-crm.min .bd,#rn-ctl #rnp.min .bd{display:block !important}
  #rn-ctl #rn-crm>.bd,#rn-ctl #rnp>.bd{padding-top:8px}
  #rn-ctl #rn-crm .ctl,#rn-ctl #rnp #rnpCtlStop,#rn-ctl #rnp #rnpCtlResume{display:none !important}
  #rn-ctl #rnp .rnp-oldlog,#rn-ctl #rnp #rnpLog,#rn-ctl #rnp .fb .pcs{display:none !important}
  body:not([data-rnu="ov"]) #rn-ov{display:none !important} body:not([data-rnu="prd"]) #rnp{display:none !important} body:not([data-rnu="crm"]) #rn-crm{display:none !important} body:not([data-rnu="prc"]) #rn-prc{display:none !important}
  #rn-ov{padding:10px 12px 12px}
  #rn-ov .card{border:1px solid #E1E8E5;border-radius:10px;padding:9px 11px;margin-bottom:9px}
  #rn-ov .card.now{border-left:5px solid #9AA5A1} #rn-ov .card.now.busy{border-left-color:${BLU}} #rn-ov .card.now.pause,#rn-ov .card.now.stop{border-left-color:${AMB};background:#FFFBF3}
  #rn-ov .k{font-size:11.5px;color:#5B6B66;font-weight:700;letter-spacing:.02em;margin:0 0 5px;display:flex;align-items:center;gap:6px} #rn-ov .k .sp{flex:1} #rn-ov .k a{font-weight:400;color:${G}}
  #rn-ov .big{font-size:15px;font-weight:700} #rn-ov .mut{color:#5B6B66;font-size:12px}
  #rn-ov .ol{margin:1px 0} #rn-ov .ol.now{margin-top:5px} #rn-ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-ov .pb{height:8px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-ov .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-ov .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-ov .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-ov .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-ov .chip.now{background:${G};border-color:${G};color:#fff;font-weight:700} #rn-ov .chip.off{text-decoration:line-through;opacity:.6} #rn-ov .chip.skip{background:#FFF4E0;color:${AMB}} #rn-ov .chip.fail{background:#FDE8E6;color:${RED}}
  #rn-ov .acts{display:flex;gap:6px;margin-bottom:9px}
  #rn-ov .acts button{flex:1;padding:9px 8px;border-radius:9px;font:700 13px system-ui,'Malgun Gothic';cursor:pointer;line-height:1.25}
  #rn-ov .acts button small{display:block;font:400 11px system-ui,'Malgun Gothic';opacity:.85;margin-top:2px}
  #rn-ov .b-pause{background:#fff;color:${AMB};border:1.5px solid ${AMB}} #rn-ov .b-go{background:${G};color:#fff;border:1.5px solid ${G}} #rn-ov .b-all{background:#fff;color:${G};border:1.5px solid ${G}}
  #rn-ov .acts button:disabled{opacity:.45;cursor:default}
  #rn-ov .rs{display:flex;align-items:center;gap:6px;padding:5px 0;border-top:1px solid #F0F3F2} #rn-ov .rs:first-of-type{border-top:0}
  #rn-ov .rs .t{flex:1;min-width:0} #rn-ov .rs .t b{display:block;font-size:12.5px} #rn-ov .rs .t small{display:block;color:#5B6B66;font-size:11px}
  #rn-ov .rs button{padding:4px 8px;border-radius:6px;font:600 11.5px system-ui,'Malgun Gothic';cursor:pointer;background:#fff;border:1px solid ${G};color:${G}} #rn-ov .rs button.x{border-color:#D9A9A4;color:${RED}} #rn-ov .rs button:disabled{opacity:.4;cursor:default}
  #rn-ov .rs .on{font-size:11px;color:${BLU};font-weight:700}
  #rn-ov .lg{font:11.5px/1.5 Consolas,'Malgun Gothic',monospace;max-height:160px;overflow:auto} #rn-ov .lg div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} #rn-ov .lg .tm{color:#9AA5A1} #rn-ov .lg .md{color:${G}} #rn-ov .lg .warn{color:${AMB}} #rn-ov .lg .err{color:${RED};font-weight:700} #rn-ov .lg .ok{color:#2F7D4F}
  #rn-ov .pc{font-size:11.5px;color:#5B6B66;margin:2px 0} #rn-ov .pc.busy{color:${RED}}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'rn-ctl';
  const pc = () => (window.__rnPcName && window.__rnPcName.get()) || '이 PC';
  box.innerHTML = `<div class="ch" title="눌러서 접기·펼치기"><b>리드나우 수집기</b><small id="rnCtlWho"></small><span class="sp"></span><span class="bdg" id="rnCtlBadge">준비 중</span><button class="tg" id="rnCtlMin" title="접기·펼치기">–</button></div>
    <div id="rn-uni"><button data-t="ov">개요</button><button data-t="crm">고객·주문</button><button data-t="prd">상품·매입</button><button data-log="1" title="작업 기록 크게 보기 (이 PC의 모든 기록 · 날짜별 · 검색 · 내려받기)">기록</button></div>
    <div class="cb"><div id="rn-ov"></div></div>`;
  const bar = box.querySelector('#rn-uni'); const body = box.querySelector('.cb'); const ov = box.querySelector('#rn-ov');
  const set = (t) => { if (t === 'hide') t = 'ov'; document.body.dataset.rnu = t; GM_setValue('rnu-tab', t); bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); draw(); };
  const setMin = (on) => { box.classList.toggle('min', on); GM_setValue('rnu-ctl-min', on ? 1 : 0); box.querySelector('#rnCtlMin').textContent = on ? '+' : '–'; };
  box.querySelector('.ch').addEventListener('click', () => setMin(!box.classList.contains('min')));
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.log) { window.__rnJournalToggle && window.__rnJournalToggle(); return; } if (b.dataset.t) set(b.dataset.t); });
  // 예전 패널(고객·상품·가격 감시)을 이 판 안으로 옮김 — 패널 안의 단추·기능은 그대로
  const adopt = () => { ['rn-crm', 'rnp', 'rn-prc'].forEach((id) => { const el = document.getElementById(id); if (el && el.parentElement !== body) body.appendChild(el); }); };
  const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hm = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const md = (t) => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  let crmRes = null; const pollCrm = async () => { try { crmRes = window.__rnCrm && window.__rnCrm.resumableInfo ? await window.__rnCrm.resumableInfo() : null; } catch (e) { crmRes = null; } };
  setInterval(pollCrm, 10000); setTimeout(pollCrm, 3000);
  const stateOf = () => { const lives = window.__rnLive ? window.__rnLive() : []; const mine = lives.find((v) => v.tab === window.__rnTab); const busy = lives.filter((v) => v.busy); const main = (mine && mine.busy) ? mine : busy[0] || null;
    const paused = !!window.__rnPaused; const kind = paused && busy.length ? 'stop' : paused ? 'pause' : busy.length ? 'busy' : 'idle';
    return { lives, busy, main, mine, paused, kind, last: lives.map((v) => v.lastEnd).filter(Boolean).sort((a, b) => b.at - a.at)[0] || null }; };
  const resList = () => { const P = window.__rnPrd; const out = []; const rk = P && P.runningKeys ? P.runningKeys() : new Set();
    if (crmRes) out.push({ mod: 'crm', key: crmRes.key, name: crmRes.name, meta: `이 PC에 저장된 자리${crmRes.savedAt ? ' · ' + md(crmRes.savedAt) + ' 멈춤' : ''}${crmRes.why ? ' · ' + crmRes.why : ''}`, savedAt: crmRes.savedAt || 0, running: false });
    ((P && P.resumables && P.resumables()) || []).forEach((r) => out.push({ mod: 'prd', key: r.key, name: r.name, meta: [r.stage ? `단계: ${r.stage}` : '', r.prog, r.by ? `${r.by}에서 ${md(r.savedAt)} 멈춤` : r.savedAt ? md(r.savedAt) + ' 멈춤' : ''].filter(Boolean).join(' · '), savedAt: r.savedAt || 0, running: rk.has(r.key) }));
    return out; };
  // 머리줄 배지: 접어도 보임
  const badge = (S) => { const b = box.querySelector('#rnCtlBadge'); const m = S.main;
    const txt = S.kind === 'stop' ? '■ 멈추는 중…' : S.kind === 'pause' ? '■ 일시정지됨' : S.kind === 'busy' ? `▶ ${m && m.job ? m.job : '작업 중'}` : '쉬는 중';
    b.textContent = txt; b.title = txt; b.className = 'bdg ' + ({ stop: 'stop', pause: 'pause', busy: 'busy', idle: '' })[S.kind];
    box.querySelector('#rnCtlWho').textContent = `${pc()} · v${VER}`; };
  let prevBusy = 0; function draw() { const S = stateOf(); badge(S);
    if (S.busy.length < prevBusy && window.__rnPrd && window.__rnPrd.refreshResume) { setTimeout(() => { try { window.__rnPrd.refreshResume(); pollCrm(); } catch (e) {} }, 3000); } prevBusy = S.busy.length; /* 어느 탭의 작업이 끝나거나 멈추면 멈춘 작업 목록을 다시 읽음 */ if (box.classList.contains('min') || document.body.dataset.rnu !== 'ov') return;
    const P = window.__rnPrd; const R = resList(); const anyBusy = S.busy.length > 0;
    const pi = window.__rnPauseInfo ? window.__rnPauseInfo() : null;
    // ① 지금 상태
    let now = '';
    if (S.kind === 'stop') now = `<div class="big" style="color:${AMB}">■ 멈추는 중</div><div class="mut">지금 하던 항목을 마치고 진행 위치를 저장하는 중입니다. 몇 초~1분 걸릴 수 있어요. 멈추면 아래 '멈춘 작업'에 나타납니다.</div>${S.main ? `<div class="mut" style="margin-top:4px">멈추는 작업: <b>${esc(S.main.job)}</b>${S.main.tab !== window.__rnTab ? ' (이 PC의 다른 탭)' : ''}</div>` : ''}`;
    else if (S.kind === 'pause') now = `<div class="big" style="color:${AMB}">■ 일시정지됨</div><div class="mut">${pi && pi.at ? `${md(pi.at)}에 ${esc(pi.why || '')} 멈춤. ` : ''}<b>다시 시작</b>을 누르기 전에는 어떤 작업도 저절로 시작하지 않습니다 (매일 자동 수집 포함).</div>`;
    else if (S.kind === 'busy') now = `${window.__rnOvHtml ? window.__rnOvHtml(S.main, !!S.main.crmBusy) : esc(S.main.job)}${S.main.tab !== window.__rnTab ? `<div class="mut" style="margin-top:4px">이 PC의 다른 탭(${S.main.page === 'worders.aspx' ? '주문조회' : S.main.page === 'wrecord_edit.aspx' ? '상품 조회' : '판매관리'})에서 진행 중 — 여기서도 멈추고 볼 수 있습니다</div>` : ''}${S.busy.length > 1 ? `<div class="mut">함께 진행 중: ${S.busy.filter((v) => v !== S.main).map((v) => esc(v.job)).join(', ')}</div>` : ''}`;
    else now = `<div class="big">쉬는 중</div><div class="mut">${S.last ? `마지막 작업: '${esc(S.last.name)}' ${md(S.last.at)} 끝 · ` : ''}${R.length ? `멈춘 작업 ${R.length}개가 아래에 있습니다.` : '멈춘 작업 없음.'}</div>`;
    // ② 주 버튼
    const resumeTarget = R.filter((r) => !r.running).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null;
    const chainRes = R.find((r) => r.key === 'chain');
    const pauseBtn = S.paused
      ? `<button class="b-go" data-a="resume">▶ 다시 시작<small>${anyBusy ? '멈추는 중 — 멈춘 뒤 누르세요' : resumeTarget ? `'${esc(resumeTarget.name)}' 이어서` : '일시정지 풀기'}</small></button>`
      : `<button class="b-pause" data-a="pause">■ 일시정지<small>${anyBusy ? '지금 항목까지 저장하고 멈춤 (모든 탭)' : '자동 수집도 하지 않게 멈춰 둠'}</small></button>`;
    const allBtn = `<button class="b-all" data-a="all" ${anyBusy || S.paused ? 'disabled' : ''} title="고객·주문부터 구매자 분포까지 켜 둔 단계를 차례로. 단계를 켜고 끄는 곳: 상품·매입 탭">▶ ${chainRes ? '전체 수집 이어서' : '전체 수집 시작'}<small>${chainRes ? esc(chainRes.meta.split(' · ')[0]) + '부터' : '고객·주문 → 상품 → 판매자 … 켜 둔 단계 차례로'}</small></button>`;
    // ③ 멈춘 작업
    const rs = R.length ? R.map((r) => `<div class="rs"><div class="t"><b>${esc(r.name)}</b><small>${esc(r.meta)}</small></div>${r.running ? '<span class="on">▶ 진행 중</span>' : `<button data-a="res1" data-m="${r.mod}" data-k="${esc(r.key)}" ${anyBusy || S.paused ? 'disabled' : ''} title="${S.paused ? '먼저 다시 시작(일시정지 풀기)' : anyBusy ? '다른 작업이 끝난 뒤' : '멈춘 자리부터 이어서'}">이어하기</button><button class="x" data-a="dis1" data-m="${r.mod}" data-k="${esc(r.key)}" title="멈춘 자리만 잊음 — 받은 기록은 그대로">버리기</button>`}</div>`).join('') : '<div class="mut">없음 — 일시정지하거나 창이 닫혀 멈춘 작업이 생기면 여기에 작업마다 나옵니다.</div>';
    // ④ 다음 자동 수집
    const sn = window.__rnSchedNext ? window.__rnSchedNext() : { known: false };
    const sched = !sn.known ? '불러오는 중' : !sn.on ? '꺼짐 — 상품·매입 탭 맨 위 \'⏰ 매일 자동 수집\'에서 켬' : sn.next ? `${sn.next.tomorrow ? '내일 ' : ''}${sn.next.t} · ${esc(sn.next.label)}${S.paused ? ' <b style="color:#A8661B">(일시정지 중이라 하지 않음)</b>' : ''}` : '켠 항목 없음';
    // ⑤ 최근 기록 (이 PC 모든 탭)
    const tail = (window.__rnLogTail ? window.__rnLogTail(30) : []).filter((e) => !/^탭 열림/.test(e.x)).slice(-10);
    const lg = tail.length ? tail.map((e) => `<div class="${e.l}" title="${esc(e.x)}"><span class="tm">${hm(e.t)}</span> <span class="md">${esc(e.m)}</span> ${esc(e.x)}</div>`).join('') : '<div class="mut">아직 없음</div>';
    // ⑥ 다른 PC · 판
    const od = P && P.outdated ? P.outdated() : null;
    const pcs = P && P.pcsHtml ? P.pcsHtml() : '';
    const html = `<div class="card now ${S.kind}">${now}</div>
      <div class="acts">${pauseBtn}${allBtn}</div>
      <div class="card"><div class="k">멈춘 작업 ${R.length ? `(${R.length})` : ''}<span class="sp"></span><a href="#" data-a="rrf" title="다시 불러오기">↻</a></div>${rs}</div>
      <div class="card"><div class="k">⏰ 다음 자동 수집</div><div>${sched}</div></div>
      <div class="card"><div class="k">최근 기록 · 이 PC의 모든 탭<span class="sp"></span><a href="#" data-a="log">크게 보기 ›</a></div><div class="lg">${lg}</div></div>
      <div class="card"><div class="k">다른 PC · 판</div>${pcs ? pcs.replace(/class="pc/g, 'class="pc') : '<div class="mut">불러오는 중</div>'}<div class="pc">수집기 v${VER}${od ? ` · <b style="color:${AMB}">새 판 ${esc(od)} 있음</b> — 쉬는 사이(또는 긴 작업이면 저장 지점에서) 저절로 바꿔 그 자리부터 이어감` : ' · 최신'}${P && P.who ? ' · ' + esc(P.who()) : ''}</div></div>`;
    if (html === lastHtml) return; lastHtml = html; ov.innerHTML = html; // 바뀐 것이 있을 때만 다시 그림 (단추를 누르는 중에 사라지지 않게)
    const lgEl = ov.querySelector('.lg'); if (lgEl) lgEl.scrollTop = lgEl.scrollHeight; }
  let lastHtml = '';
  ov.addEventListener('click', async (e) => { const a = e.target.closest('[data-a]'); if (!a) return; e.preventDefault(); const P = window.__rnPrd; const k = a.dataset.k, m = a.dataset.m;
    if (a.dataset.a === 'pause') { window.__rnPauseAll && window.__rnPauseAll('관제판에서'); }
    else if (a.dataset.a === 'resume') { const S = stateOf(); if (S.busy.length) return alert('아직 멈추는 중입니다 — 멈춘 뒤에 눌러 주세요'); const R = resList().filter((r) => !r.running).sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0)); window.__rnResumeOk && window.__rnResumeOk();
      const t = R[0]; if (t) { if (t.mod === 'crm') window.__rnCrm.resume(); else P.resume(t.key); } }
    else if (a.dataset.a === 'all') { if (!P) return alert('수집기가 아직 준비 중입니다. 잠시 뒤 눌러 주세요'); if (stateOf().busy.length) return alert('이미 작업 중입니다'); window.__rnResumeOk && window.__rnResumeOk(); set('ov'); P.startAll(); }
    else if (a.dataset.a === 'res1') { window.__rnResumeOk && window.__rnResumeOk(); if (m === 'crm') window.__rnCrm.resume(); else P.resume(k); }
    else if (a.dataset.a === 'dis1') { const nm = (a.closest('.rs').querySelector('b') || {}).textContent || k; if (!confirm(`'${nm}'의 멈춘 자리만 잊습니다.\n\n· 이미 받은 기록은 하나도 지우거나 바꾸지 않습니다.\n· 다음에 시작하면 처음부터 훑지만, 이미 받은 것은 건너뛰고 새로 생긴 것만 받습니다.\n\n계속할까요?`)) return;
      a.disabled = true; a.textContent = '지우는 중'; const r = m === 'crm' ? await window.__rnCrm.discard(k) : await P.discard(k); if (!r || !r.ok) alert((r && r.why) || '버리지 못했습니다'); if (m === 'crm') await pollCrm(); }
    else if (a.dataset.a === 'rrf') { await pollCrm(); if (P && P.refreshResume) await P.refreshResume(); }
    else if (a.dataset.a === 'log') { window.__rnJournalToggle && window.__rnJournalToggle(); }
    lastHtml = ''; draw(); });
  window.__rnCtlDraw = () => { lastHtml = ''; draw(); };
  const go = () => { document.body.appendChild(box); adopt(); new MutationObserver(adopt).observe(document.body, { childList: true });
    let saved = GM_getValue('rnu-tab', 'ov'); if (saved === 'hide') saved = 'ov'; set(saved); setMin(!!GM_getValue('rnu-ctl-min', 0));
    if (saved === 'prc') setTimeout(() => { if (!bar.querySelector('button[data-t="prc"]')) set('ov'); }, 4000); // 가격 감시기 탭이 안 붙으면 개요로
    setInterval(draw, 1000); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

