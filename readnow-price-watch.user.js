// ==UserScript==
// @name         리드나우 가격 감시기
// @namespace    readnow
// @version      0.10.80
// @description  판정 엔진으로 감시 묶음(적용·비교)의 온라인 중고 목록을 매일 보고 추천가를 기록하고, 웹앱에서 승인된 가격만 샵매니저에 반영합니다. 수집기와 완전히 따로 돕니다(작업 잠금·진행 기록·로그인 모두 따로, 로그인은 수집기에 맡김).
// @match        https://www.aladin.co.kr/scm/wrecord_edit.aspx*
// @noframes
// @updateURL    https://readnow.kr/readnow-price-watch.user.js
// @downloadURL  https://readnow.kr/readnow-price-watch.user.js
// @require      https://readnow.kr/readnow-core.js?v=1.4.3
// @require      https://readnow.kr/readnow-sellers-core.js?v=1.3.5
// @require      https://readnow.kr/readnow-products-core.js?v=0.19.16
// @require      https://readnow.kr/readnow-pricing-core.js?v=0.17.26
// @require      https://readnow.kr/readnow-aladin-core.js?v=0.2.1
// @require      https://readnow.kr/readnow-exec-core.js?v=0.1.2
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
// @require      https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      www.yes24.com
// ==/UserScript==
(async function () {
  'use strict';
  if (window.top !== window) return;
  const VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '0.10.6'; // 판 번호는 맨 위 @version 한 곳
  const gvw = (n) => (typeof unsafeWindow !== 'undefined' && unsafeWindow[n]) || window[n] || globalThis[n] || {}; // (0.9.3) 읽은 공용 파일 판 → 웹앱 관리도구가 노선표의 판과 비교
  const coreVers = () => ({ core: gvw('ReadNowCore').CORE_VERSION || null, sellers: gvw('ReadnowSellers').VERSION || null, products: gvw('ReadnowProducts').VERSION || null, pricing: gvw('ReadnowPricing').VERSION || null, aladin: gvw('ReadnowAladin').VERSION || null, exec: gvw('ReadnowExec').VERSION || null });
  const g = (n) => (typeof unsafeWindow !== 'undefined' && unsafeWindow[n]) || window[n] || globalThis[n] || null;
  const Core = g('ReadNowCore'), RS = g('ReadnowSellers'), P = g('ReadnowProducts'), PR = g('ReadnowPricing');
  const NEED = [['판매자 분류 기준 readnow-core.js', Core && Core.CORE_VERSION, '1.3.0'], ['판매자 파서', RS && RS.VERSION, '1.3.0'], ['상품 파서', P && P.VERSION, '0.12.0'], ['판정 엔진', PR && PR.VERSION, '0.11.0']];
  const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
  const OLD = NEED.filter(([, v, w]) => vn(v) < vn(w));

  /* ── 화면: 수집기의 오른쪽 위 탭 묶음에 '가격 감시' 탭으로 들어감 (같은 자리·같은 모양, 한 번에 한 패널만) ──
     수집기가 없으면 같은 자리에 혼자 뜸. 탭 버튼의 점 = 감시기 상태 (파랑 감시 중 · 회색 대기/꺼짐 · 빨강 문제) */
  const ACC = '#1F5FAF';
  const st0 = document.createElement('style');
  st0.textContent = `#rn-prc{position:fixed;top:46px;right:12px;z-index:2147483646;width:310px;max-height:calc(100vh - 56px);overflow:auto;background:#fff;color:#1E2B28;border:1px solid #D6DDDA;border-top:4px solid ${ACC};border-radius:8px;box-shadow:0 8px 28px rgba(30,43,40,.16);font:13px/1.45 "Malgun Gothic",system-ui,sans-serif}
  #rn-prc .hd{padding:8px 10px;font-weight:700;color:${ACC};border-bottom:1px solid #E6EFEB}#rn-prc .bd{padding:8px 10px}
  #rn-prc button{padding:4px 9px;border:1px solid ${ACC};border-radius:6px;background:#fff;color:${ACC};cursor:pointer;font:600 12px "Malgun Gothic",sans-serif}
  #rn-prc #pw_log{margin-top:8px;max-height:200px;overflow:auto;font:11px/1.45 Consolas,monospace;background:#F7F9F8;border-radius:6px;padding:4px 6px}`;
  document.head.appendChild(st0);
  const box = document.createElement('div'); box.id = 'rn-prc';
  box.innerHTML = `<div class="hd">가격 감시기 <small style="font-weight:400;color:#5B6B66">v${VER} · 수집기와 따로 돎</small></div><div class="bd"><div id="pw_state">준비 중</div><div id="pw_prog" style="margin:4px 0;color:#5B6B66"></div><div id="pw_btns" style="display:flex;gap:6px;flex-wrap:wrap"></div><div id="pw_log"></div></div>`;
  document.body.appendChild(box);
  let tabBtn = null;
  const dock = () => {
    const bar = document.getElementById('rn-uni'); if (!bar) return false; if (bar.querySelector('button[data-t="prc"]')) return true;
    tabBtn = document.createElement('button'); tabBtn.dataset.t = 'prc'; tabBtn.title = '가격 감시기 (판정 엔진)'; tabBtn.innerHTML = '가격 감시<span class="dot" id="pw_dot"></span>';
    const before = bar.querySelector('button[data-log]') || bar.lastElementChild; bar.insertBefore(tabBtn, before); // 수집기 클릭 처리(data-t)가 그대로 이 탭도 엶
    if (document.body.dataset.rnu === 'prc') tabBtn.classList.add('on');
    return true;
  };
  if (!dock()) { let n = 0; const t = setInterval(() => { if (dock() || ++n > 20) { clearInterval(t); if (!tabBtn) { box.style.top = '12px'; document.body.dataset.rnu = 'prc'; } } }, 500); } // 수집기가 없으면 혼자 표시
  const dot = (color, tip) => { const d = document.getElementById('pw_dot'); if (d) { d.style.background = color; d.title = tip || ''; } };
  const $ = (id) => box.querySelector('#' + id);
  // 기록: 화면(최근 80줄) + 이 PC 보관(날짜별, 최근 7일) + Firebase rn_logs(수집기와 같은 형식 → 웹앱 '기록'에서 같이 봄)
  const kst = (t) => new Date(t + 9 * 3600e3).toISOString();
  const LOGK = (d) => 'pw_log_' + d; const pendLog = [];
  const log = (t, bad) => {
    const now = Date.now(); const line = `${kst(now).slice(11, 19)} [가격 감시] ${bad ? '⚠ ' : ''}${t}`;
    const d = document.createElement('div'); d.textContent = line; if (bad) d.style.color = '#B0322A'; $('pw_log').prepend(d); while ($('pw_log').children.length > 80) $('pw_log').lastChild.remove();
    gmBuf.push([kst(now).slice(0, 10), line]); pendLog.push({ t: now, line });
  };
  const gmBuf = []; // 이 PC 보관은 20초마다 묶어서 (줄마다 전체를 다시 쓰면 느려짐)
  const gmFlush = () => { if (!gmBuf.length) return; const by = {}; gmBuf.splice(0).forEach(([d, l]) => (by[d] = by[d] || []).push(l)); for (const [d, ls] of Object.entries(by)) { const arr = GM_getValue(LOGK(d), []); arr.push(...ls); if (arr.length > 20000) arr.splice(0, arr.length - 20000); GM_setValue(LOGK(d), arr); } };
  setInterval(gmFlush, 20000); addEventListener('beforeunload', gmFlush);
  (() => { const keep = new Set([...Array(7)].map((_, k) => kst(Date.now() - k * 864e5).slice(0, 10))); try { for (const k of GM_listValues ? GM_listValues() : []) if (/^pw_log_/.test(k) && !keep.has(k.slice(7))) GM_deleteValue(k); } catch (e) {} })();
  function downloadLog() {
    const day = prompt('내려받을 날짜 (YYYY-MM-DD, 최근 7일)', kst(Date.now()).slice(0, 10)); if (!day) return;
    gmFlush(); const arr = GM_getValue(LOGK(day), []); if (!arr.length) return alert(`${day} 기록이 이 PC에 없습니다`);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([arr.join('\r\n')], { type: 'text/plain;charset=utf-8' })); a.download = `readnow-price-watch-${PC || 'pc'}-${day}.txt`; document.body.appendChild(a); a.click(); a.remove();
  }
  const state = (html, c) => { $('pw_state').innerHTML = html; dot(c || (/B0322A/.test(html) ? '#B0322A' : /감시 중/.test(html) ? ACC : '#bbb'), $('pw_state').textContent); };
  const prog = (t) => { $('pw_prog').textContent = t || ''; };
  if (OLD.length) { state(`<b style="color:#B0322A">공용 파일이 옛 버전</b><br>${OLD.map(([k, v, w]) => `${k}: ${v || '못 읽음'} (필요 ${w})`).join('<br>')}`); return; }

  /* ── Firebase (로그인은 수집기 칸에서 한 것을 함께 씀) ── */
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.firestore(); try { db.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) {} // 빈 칸(undefined) 때문에 저장이 통째로 실패하지 않게
  const auth = firebase.auth(); const C = (n) => db.collection(n);
  const TS = () => firebase.firestore.FieldValue.serverTimestamp();
  let PC = GM_getValue('pw_pc', '');
  const W = () => ({ uploadedAt: TS(), writerSchema: 6, writer: 'price-watch:' + (PC || '?') });
  const user = await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); });
  if (!user) { state('<b style="color:#B0322A">Firebase 로그인 필요</b><br>수집기 칸에서 로그인한 뒤 새로고침'); return; }

  /* ── 설정 (Firestore prd_system/pricing — 웹앱에서 바꿈) ── */
  const SREF = C('prd_system').doc('pricing'); const RREF = C('prd_system').doc('pricing_run');
  let SET = {}; const loadSet = async () => { const d = await SREF.get(); SET = d.exists ? d.data() : {}; return SET; };
  try { SREF.onSnapshot((d) => { SET = d.exists ? d.data() : {}; try { paintOwner(); } catch (e) {} }); } catch (e) {} // 설정이 바뀌면 바로 반영 (다른 탭이 감시를 가져가면 이 탭은 바로 멈춤)
  const engineSettings = () => ({ ...(SET.engine || {}), cutoverAt: SET.cutoverAt || null, rollout: SET.rollout || PR.DEFAULTS.rollout, excludeSku: SET.excludeSku || PR.DEFAULTS.excludeSku, excludeUsed: SET.excludeUsed || [] }); // (0.5.0) 한 권씩 제외도
  // 크롬은 뒤에 숨은 탭의 타이머를 1분 단위로 늦춤 → 워커 타이머로 대기 (수집기와 같은 방식), 막히면 일반 타이머
  let wk = null, wseq = 0; const wait = new Map();
  try { wk = new Worker(URL.createObjectURL(new Blob(['onmessage=(e)=>{setTimeout(()=>postMessage(e.data.id),e.data.ms)}'], { type: 'text/javascript' }))); wk.onmessage = (e) => { const f = wait.get(e.data); if (f) { wait.delete(e.data); f(); } }; } catch (e) { wk = null; }
  const sleep = (ms) => new Promise((r) => { if (wk) { const id = ++wseq; wait.set(id, r); wk.postMessage({ id, ms }); } else setTimeout(r, ms); });
  // 알라딘 요청 속도: 수집기(상품·고객)와 같은 자동 조절 하나를 같이 씀 → 이 PC에서 알라딘으로 가는 전체 속도가 하나로 묶임 (readnow-products-core.js makePacer)
  const PACE = P.makePacer('aladin'); const PACE_Y = P.makePacer('yes24');
  /* (사람처럼 · 10/30 로봇 점검) 책 사이 쉼 — 예전엔 0(속도 조절기만 · 0.7~1.2초 ±15%)이라 수천 권을 같은 박자로 봄
   *  'read' 1.5~4초 = 🔬 조회수 실험 '확인만 한 것 사이' 값 · 'auto'(엔진 자동 반영 가격 사이) 6~25초 = 실험 '수정 사이' 값 · 그 밖(관리자·수동 일괄 확정 반영)은 예전대로 0 */
  const GAP = (k) => (k === 'auto' ? 6000 + Math.random() * 19000 : k === 'read' ? 1500 + Math.random() * 2500 : 0);
  /* (사람처럼) 밤 쉼·조각 — 설정 prd_system/pricing.human = { quiet:'HH:MM-HH:MM'(''이면 끔), sliceSec, restSec:[가장 짧게, 가장 길게] }
   *  근거: 밤 끝 07:00 = 클라우드 '밤'(KST 7시 전) · 조각 75초·쉼 60~600초 = 🔬 조회수 실험 매일 일 값(공용 AS.pxGate와 같음) · 밤 끝 0~60분 흩음은 근거 없음(설정으로 끔: quietJit 0) */
  const HUM = () => { const h = SET.human && typeof SET.human === 'object' ? SET.human : {}; const pr = Array.isArray(h.restSec) && h.restSec.length === 2 && h.restSec.every((x) => +x >= 10) ? h.restSec.map(Number).sort((a, b) => a - b) : [20, 120]; /* (10/30 정범님 '분당 최대 22권 — 이 속도를 전반적으로 유지 · 너무 느려도 안 됨') 조각 사이 쉼 60~600초 → 20~120초(한 바퀴 2000권 약 16시간 → 약 3~4시간 · 조각 안 속도·흩음은 그대로) */
    return { quiet: typeof h.quiet === 'string' ? h.quiet : '01:00-04:55', quietJit: Number.isFinite(+h.quietJit) && h.quietJit !== null ? Math.max(0, Math.min(180, +h.quietJit)) : 0, /* (10/30 정범님) 밤 쉼 1:00~4:55 */ sliceMs: Math.max(15, Math.min(600, +h.sliceSec || 75)) * 1000, rest: pr }; };
  const dHash = (x0) => { let x = 2166136261; for (const c of String(x0)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
  function quietNow(now) { now = now || Date.now(); const H = HUM(); const m = String(H.quiet || '').match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/); if (!m) return null; const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4]; if (a === b) return null;
    const k = new Date(now + 9 * 3600e3); const cur = k.getUTCHours() * 60 + k.getUTCMinutes(); const day = k.toISOString().slice(0, 10); const d0 = Date.parse(day + 'T00:00:00+09:00'); const endOf = (ds) => ds + (b + dHash(new Date(ds + 3600e3 + 9 * 3600e3).toISOString().slice(0, 10)) % (H.quietJit + 1)) * 60000;
    if (a < b) { const e = endOf(d0); return cur >= a && now < e ? e : null; } if (cur >= a) return endOf(d0 + 864e5); const e = endOf(d0); return now < e ? e : null; } /* 밤 쉼이면 끝나는 때(ms) · 아니면 null — 🔬 실험(AS.pxQuiet)과 같은 계산 */
  let restUntil = 0, sliceT0 = 0; /* 한 조각(알라딘을 연달아 보는 동안) 시작 · 쉼이 끝나는 때 */
  const pxBusy = async () => { try { const x = ((await C('app_settings').doc('pxDaily').get()).data() || {}).slice; const u = x && !x.end ? Date.parse(x.until || 0) || 0 : 0; return u > Date.now() ? { until: u, by: x.by || '?' } : null; } catch (e) { return null; } }; /* 🔬 조회수 실험이 지금 수정 화면을 여는 중인가 — 같은 계정으로 두 곳이 함께 몰리지 않게 */
  async function sliceOpen(what) { const q = quietNow(); if (q) { prog(`🌙 밤 쉼 — ${new Date(q + 9 * 3600e3).toISOString().slice(11, 16)}부터 ${what}`); return false; } if (Date.now() < restUntil) { prog(`쉬는 중 — ${new Date(restUntil + 9 * 3600e3).toISOString().slice(11, 16)}부터 ${what}`); return false; }
    if (sliceT0 && Date.now() - sliceT0 < HUM().sliceMs) return true; if (sliceT0) { await sliceClose(); prog(`쉬는 중 — ${new Date(restUntil + 9 * 3600e3).toISOString().slice(11, 16)}부터 ${what}`); return false; } /* 조각 시간을 다 쓴 채 끝난 경우(다음 일에서) — 쉬고 나서 */ const px = await pxBusy(); if (px) { const H = HUM(); restUntil = px.until + Math.round((H.rest[0] + Math.random() * (H.rest[1] - H.rest[0])) * 1000); prog(`🔬 조회수 실험(${px.by})이 알라딘 수정 중 — 겹치지 않게 쉼`); return false; }
    sliceT0 = Date.now(); try { await RREF.set({ slice: { at: new Date().toISOString(), until: new Date(sliceT0 + HUM().sliceMs).toISOString(), by: PC } }, { merge: true }); } catch (e) {} return true; }
  function sliceOver() { return !!sliceT0 && Date.now() - sliceT0 > HUM().sliceMs; }
  async function sliceClose() { if (!sliceT0) return; const H = HUM(); sliceT0 = 0; restUntil = Date.now() + Math.round((H.rest[0] + Math.random() * (H.rest[1] - H.rest[0])) * 1000); try { await RREF.set({ slice: { until: new Date().toISOString(), by: PC, end: true }, restUntil: new Date(restUntil).toISOString() }, { merge: true }); } catch (e) {} }
  // 1분마다 rn_logs/{PC}_{10분 칸} 에 묶어 올림 (수집기와 같은 문서·같은 형식 → 같은 PC 이름이면 한 기록으로 합쳐 보임)
  let logDenied = false;
  (async () => { for (;;) { await sleep(60000); if (!pendLog.length || logDenied || !PC) continue; const out = pendLog.splice(0, pendLog.length); const groups = {};
    out.forEach((e) => { const k = kst(e.t).slice(0, 15).replace(/[-:T]/g, ''); (groups[k] = groups[k] || []).push(e.line); });
    for (const [k, lines] of Object.entries(groups)) { try { await C('rn_logs').doc(`${PC}_${k}0`).set({ pc: PC, slot: k + '0', lines: firebase.firestore.FieldValue.arrayUnion(...lines), at: Date.now() }, { merge: true }); } catch (e) { if (/permission/i.test(e.code || e.message)) logDenied = true; else pendLog.unshift(...out); break; } } } })();

  let stop = false, running = false;

  function buttons() {
    const b = $('pw_btns'); b.innerHTML = '';
    const mk = (t, f, strong) => { const x = document.createElement('button'); x.textContent = t; x.onclick = f; if (strong) { x.style.background = '#1F5FAF'; x.style.color = '#fff'; } b.appendChild(x); };
    mk(PC ? `PC 이름: ${PC}` : 'PC 이름 정하기', () => { const v = prompt('이 PC 이름 (수집기와 같게: 예 JS-MAIN)', PC || ''); if (v) { PC = v.trim(); GM_setValue('pw_pc', PC); buttons(); paintOwner(); } });
    if (!isMine()) { mk('이 탭을 가격 감시 탭으로', takeOver, true); mk('기록 내려받기', downloadLog); return; } // 꺼진 탭: 넘겨받기와 기록만
    if (running) mk('멈춤', () => { stop = true; log('멈춤 요청 — 지금 책까지 마치고 멈춥니다'); });
    if (!running) mk('지금 새 바퀴', async () => { if (!confirm('지금 감시 상품을 처음부터 다시 판정할까요?')) return; await RREF.set({ cycleId: null, doneAt: null, keys: [], idx: 0, ...W() }); log('새 바퀴 요청'); tick(); });
    mk('판정·반영 목록', () => openList().catch((e) => alert('목록 실패: ' + e.message)));
    mk('기록 내려받기', downloadLog);
  }

  /* ── 판정·반영 목록 (샵매니저 화면에서 한눈에) ── */
  async function openList() {
    const [ds, as] = await Promise.all([C('prd_price_decisions').get(), C('prd_price_actions').get()]);
    const D = []; ds.forEach((d) => { if (!/^_check/.test(d.id)) D.push(d.data()); }); const A = []; as.forEach((d) => { if (!/^_check/.test(d.id)) A.push(d.data()); });
    A.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const ST = { none: '판정만 있음(결정 대기 아님)', pending: '관리자 결정 대기', approved: '승인(반영 대기)', manual: '직접 정한 가격(반영 대기)', hold: '판매보류풀로(반영 대기)', unhold: '보류풀 해제(반영 대기)', kept: '유지로 결정', rejected: '거절', done: '반영됨', blocked: '막힘', stale: '오래돼 다시 판정', applying: '반영 중', cleared: '목록에서 비움', cancelled: '확정 취소' };
    const used = (x) => (x.aladinItemId ? `https://www.aladin.co.kr/shop/UsedShop/wuseditemall.aspx?ItemId=${x.aladinItemId}&TabType=0` : null);
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.35);overflow:auto;padding:24px 10px';
    let tab = 'dec', f = 'all';
    const draw = () => {
      const rowsD = D.filter((x) => f === 'all' || (x.approvalState || 'none') === f).sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ko'));
      const cnt = (k) => D.filter((x) => (x.approvalState || 'none') === k).length;
      ov.innerHTML = `<div style="background:#fff;border-radius:10px;max-width:1150px;margin:0 auto;padding:12px;font:13px/1.5 'Malgun Gothic',sans-serif;color:#1E2B28">
        <div style="display:flex;justify-content:space-between"><b style="color:#1F5FAF;font-size:16px">가격 판정·반영 목록</b><a href="#" data-x="1">닫기 ✕</a></div>
        <div style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap"><button data-t="dec" style="${tab === 'dec' ? 'background:#1F5FAF;color:#fff' : ''}">판정 ${D.length}</button><button data-t="act" style="${tab === 'act' ? 'background:#1F5FAF;color:#fff' : ''}">실제 반영 ${A.length}</button></div>
        ${tab === 'dec' ? `<div style="margin-bottom:6px;display:flex;gap:4px;flex-wrap:wrap">${[['all', '전체']].concat(Object.entries(ST)).map(([k, l]) => `<button data-f="${k}" style="${f === k ? 'background:#E2ECFA' : ''}">${l} ${k === 'all' ? D.length : cnt(k)}</button>`).join('')}</div>
          <table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#E2ECFA"><th style="text-align:left;padding:4px">상품</th><th>등급</th><th style="text-align:right">지금</th><th style="text-align:right">엔진 제안</th><th>판정</th><th>관리자</th><th>바로가기</th></tr>
          ${rowsD.map((x) => `<tr style="border-top:1px solid #E1E1E1"><td style="padding:4px">${String(x.title || x.usedCode).replace(/</g, '&lt;')}<br><small style="color:#5B6B66">${x.usedCode} · ${x.sku || ''}</small></td><td style="text-align:center">${x.grade || ''}</td><td style="text-align:right">${(x.current || 0).toLocaleString()}</td><td style="text-align:right">${x.target != null ? x.target.toLocaleString() : '-'}</td><td style="text-align:center">${x.status || ''}/${x.action || ''}</td><td style="text-align:center">${ST[x.approvalState || 'none'] || '-'}${x.approval && x.approval.price ? ' ' + x.approval.price.toLocaleString() : ''}</td><td style="text-align:center">${used(x) ? `<a href="${used(x)}" target="rn_used">전체중고</a> · ` : ''}${x.listingId ? `<a href="/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=${x.listingId}" target="_blank">정보수정</a>` : ''}</td></tr>`).join('')}</table>`
        : `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#E2ECFA"><th style="text-align:left;padding:4px">시각</th><th style="text-align:left">상품</th><th style="text-align:right">바꾸기 전</th><th style="text-align:right">바꾼 뒤</th><th>어떻게</th><th>누가</th><th>바로가기</th></tr>
          ${A.map((a) => `<tr style="border-top:1px solid #E1E1E1"><td style="padding:4px">${String(a.at).slice(5, 16).replace('T', ' ')}</td><td>${String(a.title || a.usedCode).replace(/</g, '&lt;')}</td><td style="text-align:right">${(a.from || 0).toLocaleString()}</td><td style="text-align:right"><b>${(a.to || 0).toLocaleString()}</b></td><td style="text-align:center">${{ approved: '엔진 제안 승인', approve: '엔진 제안 승인', manual: '관리자 가격', revert: '되돌리기', hold: '판매보류풀(PND)', unhold: '보류풀 해제' }[a.kind] || a.kind || ''}</td><td style="text-align:center">${a.by || ''}</td><td style="text-align:center">${a.aladinItemId ? `<a href="https://www.aladin.co.kr/shop/UsedShop/wuseditemall.aspx?ItemId=${a.aladinItemId}&TabType=0" target="rn_used">전체중고</a> · ` : ''}${a.listingId ? `<a href="/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=${a.listingId}" target="_blank">정보수정</a>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" style="padding:10px;color:#5B6B66">아직 실제로 바꾼 가격이 없습니다 (가격은 웹앱에서 관리자가 결정한 것만 바뀜)</td></tr>'}</table>
          <div style="color:#5B6B66;margin-top:6px">되돌리기는 웹앱 → 상품 탭 → 가격 감시 → 실제 반영 목록에서 (되돌린 것도 기록에 남음)</div>`}
      </div>`;
      ov.querySelector('[data-x]').onclick = (e) => { e.preventDefault(); ov.remove(); };
      ov.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      ov.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { f = b.dataset.f; draw(); }));
    };
    document.body.appendChild(ov); ov.onclick = (e) => { if (e.target === ov) ov.remove(); }; draw();
  }

  /* ── 알라딘·예스24 받기 ── */
  async function aladinDoc(url) {
    for (let i = 0; i < 3; i++) {
      await PACE.wait(sleep);
      try { const r = await fetch(url, { credentials: 'include' }); if (!r.ok) throw Object.assign(new Error('응답 ' + r.status), { status: r.status }); const AL = window.ReadnowAladin || globalThis.ReadnowAladin; const html = AL ? AL.decode(await r.arrayBuffer(), r.headers.get('content-type')) : await r.text(); const d = new DOMParser().parseFromString(html, 'text/html');
        if (AL && AL.isMaintenance(d)) throw new Error('알라딘 점검 중 — 빈 목록으로 판정하지 않음'); // (0.9.5) 점검 안내 화면을 매물 0개로 읽어 \'단독\'처럼 올리지 않게 (알라딘 창구 공용 기준)
        PACE.ok(); return d; }
      catch (e) { PACE.fail(PACE.kindOf(e.status)); log(`알라딘 받기 실패(${e.message}) — 30초쯤 뒤 다시`, 1); await sleep(Math.round(30000 * (0.85 + Math.random() * 0.3))); } // (사람처럼) 꼭 30초가 아니게 ±15%(속도 조절기와 같은 흩음)
    }
    throw new Error('알라딘 받기 3번 실패');
  }
  async function y24Doc(url) {
    await PACE_Y.wait(sleep);
    return new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'arraybuffer', timeout: 30000,
      onload: (r) => { const buf = r.response; let txt = new TextDecoder('utf-8').decode(buf); const cs = (txt.match(/charset=["']?([\w-]+)/i) || [])[1]; if (cs && /euc-kr|ks_c|cp949/i.test(cs)) txt = new TextDecoder('euc-kr').decode(buf); res(new DOMParser().parseFromString(txt, 'text/html')); },
      onerror: () => rej(new Error('예스24 연결 실패')), ontimeout: () => rej(new Error('예스24 시간 초과')) }));
  }
  async function yes24For(isbn) {
    if (!isbn) return null;
    const s = P.parseYes24Search(await y24Doc(`https://www.yes24.com/Product/Search?domain=USED_GOODS&query=${encodeURIComponent(isbn)}`)); const hub = P.pickYes24Hub(s);
    if (!hub) return { at: new Date().toISOString(), hubId: null, offers: [] };
    await sleep(1500); const h = P.parseYes24Hub(await y24Doc(`https://www.yes24.com/Product/UsedShopHub/Hub/${hub.hubId}`));
    return { at: new Date().toISOString(), hubId: hub.hubId, newPrice: hub.newPrice, offers: h.offers };
  }

  /* ── 한 상품 판정 ── */
  const sellerCache = new Map(); let SHOP = {};
  const loadShop = async () => { try { const d = await C('crm_system').doc('shopPolicy').get(); SHOP = (d.exists && d.data().current) || {}; } catch (e) { SHOP = {}; } if (SHOP.fee == null) log('우리 가게 배송비 정책을 못 읽음 — 우리 매물이 첫 페이지에 없는 책은 배송비를 모르는 채 판정', 1); };
  async function sellersFor(codes) {
    const need = [...new Set(codes.filter((c) => c && !sellerCache.has(c)))];
    for (let i = 0; i < need.length; i += 10) { const part = need.slice(i, i + 10); const snaps = await Promise.all(part.map((c) => C('sellers').doc('sc_' + c).get())); snaps.forEach((d, k) => sellerCache.set(part[k], d.exists ? d.data() : null)); }
    const out = {}; codes.forEach((c) => { if (c && sellerCache.get(c)) out['sc_' + c] = sellerCache.get(c); }); return out;
  }
  const CTRLG = new Map(); /* (10/30 위험 4) 비교군 그룹이 살아 있는지 — 10분 기억 */
  async function ctrlAlive(gid) { if (!gid) return false; const c0 = CTRLG.get(gid); if (c0 && Date.now() - c0.at < 600000) return c0.v; let v = false; try { const g = (await C('prd_price_batches').doc(gid).get()).data(); v = !!(g && !g.archived && !(SET.batchOff || {})[gid]); } catch (e) { v = true; /* 못 읽으면 지키는 쪽 */ } CTRLG.set(gid, { at: Date.now(), v }); return v; }
  /* (0.10.54 plock1 · 정범님 11/17) 🔒 상품 잠금 — 잠긴 상품(prd_locks/{키}.on)은 판매 상태 말고 아무것도 안 바꿈(판매가·판매보류풀 포함) · 웹앱·수집기·클라우드와 같은 plkBlock */
  const plkBlock = (lk, ks, down) => { ks = (ks || []).slice(); if (!lk || lk.on !== true) return { keep: ks, drop: [] }; const c = lk.mode === 'cond' && lk.cond && typeof lk.cond === 'object' && !(lk.cond.until && !(Date.now() < Date.parse(lk.cond.until))) ? lk.cond : null; const keep = ks.filter((k) => k === 'state' || (k === 'qty' && !!down) || (!!c && k === 'price')); return c ? { keep, drop: ks.filter((k) => !keep.includes(k)), cond: c } : { keep, drop: ks.filter((k) => !keep.includes(k)) }; };
  const plkClamp = (lk, p, x) => { x = x || {}; const N = (v) => (v == null || v === '' || !isFinite(+v) ? null : +v), W = (v) => Number(v).toLocaleString('ko-KR') + '원', no = (why, lo, hi) => ({ ok: false, p: null, cut: false, why: '🎚 조건 잠금 — ' + why, lo: lo == null ? null : lo, hi: hi == null || hi === Infinity ? null : hi }); if (!lk || lk.on !== true) return { ok: true, p, cut: false, why: '', lo: null, hi: null }; const c = lk.mode === 'cond' && lk.cond && typeof lk.cond === 'object' ? lk.cond : null; if (!c) return { ok: false, p: null, cut: false, why: '🔒 완전 잠금 — 값을 바꾸지 않음', lo: null, hi: null }; if (c.until && !(Date.now() < Date.parse(c.until))) return { ok: false, p: null, cut: false, why: '🔒 조건 잠금 기한이 지나 완전 잠금처럼 막음', lo: null, hi: null }; if (!['floor', 'ceil', 'gapDn', 'gapUp', 'lowOff', 'topOff', 'listPct', 'costPlus', 'stepPct', 'dayN', 'dayAmt'].some((q) => N(c[q]) != null)) return { ok: false, p: null, cut: false, why: '🔒 조건 잠금에 조건이 없어 완전 잠금처럼 막음', lo: null, hi: null }; p = N(p); const cur = N(x.cur), day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), dd = lk.day && lk.day.d === day ? lk.day : null; let lo = 10, hi = Infinity, loW = '', hiW = ''; const up = (v, w) => { v = Math.ceil(v / 10) * 10; if (v > lo) { lo = v; loW = w; } }, dn = (v, w) => { v = Math.floor(v / 10) * 10; if (v < hi) { hi = v; hiW = w; } }, need = (v, w) => { v = N(v); if (v == null || !(v > 0)) throw new Error(w + ' 모름 — 안전하게 막음'); return v; }; try { if (N(c.floor) != null) up(N(c.floor), '하한가'); if (N(c.ceil) != null) dn(N(c.ceil), '상한가'); if (N(c.listPct) != null) up(need(x.list || (c.ref && c.ref.list), '정가') * N(c.listPct) / 100, '정가의 ' + N(c.listPct) + '%'); if (N(c.costPlus) != null) up(need(x.cost || (c.ref && c.ref.cost), '원가') + N(c.costPlus), '원가+' + W(N(c.costPlus))); if (N(c.gapUp) != null) dn(need(x.low, '유효 최저가') * (1 + N(c.gapUp) / 100), '유효 최저가보다 ' + N(c.gapUp) + '% 위까지'); if (N(c.gapDn) != null) up(need(x.low, '유효 최저가') * (1 - N(c.gapDn) / 100), '유효 최저가보다 ' + N(c.gapDn) + '% 아래까지'); if (N(c.lowOff) != null) up(need(x.low, '유효 최저가') + N(c.lowOff), '유효 최저가' + (N(c.lowOff) < 0 ? '−' : '+') + W(Math.abs(N(c.lowOff)))); if (N(c.topOff) != null) up(need(x.top, '최상단 가격') + N(c.topOff), N(c.topOff) ? '최상단' + (N(c.topOff) < 0 ? '−' : '+') + W(Math.abs(N(c.topOff))) : '최상단 가격까지만'); if (N(c.stepPct) != null) { const b = need(cur, '지금 값'); up(b * (1 - N(c.stepPct) / 100), '한 번에 ' + N(c.stepPct) + '%까지'); dn(b * (1 + N(c.stepPct) / 100), '한 번에 ' + N(c.stepPct) + '%까지'); } if (N(c.dayN) != null && !x.noDay && dd && (+dd.n || 0) >= N(c.dayN)) return no('오늘 바꿀 수 있는 ' + N(c.dayN) + '번을 다 씀', lo, hi); if (N(c.dayAmt) != null && !x.noDay) up(need(cur, '지금 값') - Math.max(0, N(c.dayAmt) - (dd ? +dd.amt || 0 : 0)), '하루 내림 ' + W(N(c.dayAmt)) + '까지'); } catch (e) { return no(e.message, lo, hi); } if (p == null || p < 10) return no('바꿀 값이 없음', lo, hi); if (lo > hi) return no('조건끼리 맞지 않음(아래 선 ' + W(lo) + ' > 위 선 ' + W(hi) + ')', lo, hi); let q = p; if (q < lo && !(cur != null && cur < lo && q > cur)) q = lo; if (q > hi && !(cur != null && cur > hi && q < cur)) q = hi; if (cur != null && q !== p && (q === cur || (p < cur) !== (q < cur))) return no((p < cur ? '아래 선 ' + W(lo) + '(' + loW + ')' : '위 선 ' + W(hi) + '(' + hiW + ')') + '에 닿아 ' + W(p) + '(으)로 못 바꿈', lo, hi); return { ok: true, p: q, cut: q !== p, why: q !== p ? '🎚 조건 잠금 — ' + W(p) + ' → ' + W(q) + '(' + (q === lo ? loW : hiW) + ')' : '', lo, hi: hi === Infinity ? null : hi }; };
  /* (11/19 lkday1 · 정범님 I-1119-1651-21 · 관제소 검토 1-1·1-3·1-6) 🎚 조건 잠금 하루 한도를 정확히 — 웹앱·수집기·클라우드·가격 감시기가 같은 글(시험 tLKDAY1_1119가 견줌). 하루 횟수·금액은 prd_locks 문서 안에서 읽고-셈하고-쓰기를 한 묶음(트랜잭션)으로 더해 겹쳐 써도 빠지지 않음 · 결정마다 표(tk)를 남겨 반영 직전에 「내 몫은 이미 셌나」를 알아봄(두 번 세지 않음) · 날짜(한국 시각)가 바뀌면 0부터 */
  const PLK_MKT_MAX_H = 24; /* 조건이 시장 값(유효 최저가·최상단)에 기댈 때 그 시장 값을 믿는 시간 — 24시간. 까닭: 결정은 길게 72시간 기다릴 수 있는데 그 사이 최저가가 바뀌면 조건 선이 틀려짐(검토 1-3) · 아침에 살피고 오후에 정해 그날 반영하는 보통 흐름은 막지 않음 · 하루 횟수·하루 금액과 같은 「하루」 단위 */
  const plkDayKst = (now) => new Date((now == null ? Date.now() : +now) + 9 * 3600e3).toISOString().slice(0, 10);
  const plkDayStep = (lk, tk, cur, p, now) => { const N = (v) => (v == null || v === '' || !isFinite(+v) ? null : +v), W = (v) => Number(v).toLocaleString('ko-KR') + '원'; if (!lk || lk.on !== true) return { ok: true, skip: 1, day: null }; const c = lk.mode === 'cond' && lk.cond && typeof lk.cond === 'object' ? lk.cond : null; if (!c) return { ok: true, skip: 1, day: null }; const day = plkDayKst(now), d0 = lk.day && lk.day.d === day ? lk.day : { d: day, n: 0, amt: 0 }, T = d0.tk && typeof d0.tk === 'object' ? d0.tk : {}; tk = String(tk || ''); if (tk && T[tk] != null) return { ok: true, dup: 1, day: null }; const n = +d0.n || 0, amt = +d0.amt || 0, drop = Math.max(0, (N(cur) || 0) - (N(p) || 0)); if (N(c.dayN) != null && n >= N(c.dayN)) return { ok: false, why: '🎚 조건 잠금 — 오늘 바꿀 수 있는 ' + N(c.dayN) + '번을 다 씀', day: null }; if (N(c.dayAmt) != null && drop > 0 && amt + drop > N(c.dayAmt)) return { ok: false, why: '🎚 조건 잠금 — 하루 내림 ' + W(N(c.dayAmt)) + '까지(오늘 이미 ' + W(amt) + ')', day: null }; const T2 = {}; Object.keys(T).slice(-199).forEach((k) => { T2[k] = T[k]; }); if (tk) T2[tk] = drop; return { ok: true, day: { d: day, n: n + 1, amt: amt + drop, tk: T2 } }; };
  const plkDayMine = (lk, tk, cur, p, at, now) => { const day = plkDayKst(now); if (!lk || !lk.day || lk.day.d !== day) return { lk, mine: false }; const T = lk.day.tk && typeof lk.day.tk === 'object' ? lk.day.tk : {}; tk = String(tk || ''); let a = null; if (tk) { if (T[tk] != null) a = +T[tk] || 0; } else if (at && plkDayKst(Date.parse(at)) === day) a = Math.max(0, (+cur || 0) - (+p || 0)); if (a == null) return { lk, mine: false }; return { lk: { ...lk, day: { ...lk.day, n: Math.max(0, (+lk.day.n || 0) - 1), amt: Math.max(0, (+lk.day.amt || 0) - a) } }, mine: true }; };
  const plkMktOld = (lk, x, at, now) => { const c = lk && lk.on === true && lk.mode === 'cond' && lk.cond && typeof lk.cond === 'object' ? lk.cond : null; if (!c || !['lowOff', 'topOff', 'gapUp', 'gapDn'].some((q) => c[q] != null && c[q] !== '' && isFinite(+c[q]))) return ''; const t = (x && +x.at > 0 ? +x.at : 0) || (at ? Date.parse(at) || 0 : 0); const h = t > 0 ? ((now == null ? Date.now() : +now) - t) / 3600e3 : Infinity; return h > PLK_MKT_MAX_H ? '🎚 조건 잠금 — 시장 값이 ' + (isFinite(h) ? Math.floor(h) + '시간 전 것' : '언제 것인지 모름') + '(' + PLK_MKT_MAX_H + '시간 넘음) · 다시 살핀 뒤 결정' : ''; };
  const plkPickOn = (own, byLid) => (own && own.on === true ? own : (byLid || []).find((v) => v && v.on === true) || own || (byLid || [])[0] || null);
  const plkTkNew = (who) => String(who || 'x').replace(/[^A-Za-z0-9]/g, '').slice(0, 6) + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  let PLKC = { t: 0, ok: 0, S: new Set() }; async function plkSetW() { if (Date.now() - PLKC.t > 120e3) { try { const q = await C('prd_locks').where('on', '==', true).get(); const S = new Set(); q.docs.forEach((d) => { S.add(d.id); const lid = (d.data() || {}).lid; if (lid) S.add('lid:' + lid); }); PLKC = { t: Date.now(), ok: Date.now(), S }; } catch (e) { PLKC.t = Date.now() - 90e3; } } return PLKC.ok && Date.now() - PLKC.ok < 600e3 ? PLKC.S : null; } /* 판정용(자동 승인을 만들지 않게) — 반영 직전에는 따로 바로 읽음 · (11/19 lkday1) 상품 번호(lid)로 건 잠금도 'lid:번호'로 담음 · 한 번도 못 읽었거나 10분 넘게 못 읽으면 null → 부른 쪽이 잠긴 것으로(자동 승인 안 만듦) · 못 읽으면 30초 뒤 다시 */
  /* ⏳PXL{ */
  /* (11/20 pricelock1 · 정범님 I-1120-0948-11 · 헌장 제45조) ⏳ 가격 바꾼 뒤 잠금 — 등록 뒤 첫 가격 변경부터 48시간, 그 뒤엔 바꿀 때마다 「공개 반영 평균 시간 × 2」 동안 어떤 길(감시기·수동 일괄·직접 가격·전략·추격자·클라우드·수집기)로도 값을 안 바꿈. 막힘은 실패가 아니라 미룸(잠금 끝난 뒤 반영) · 까닭: 값이 시장에 반영되어 손님이 알아보기 전에 또 바꾸는 것은 의미가 없음 · 웹앱·수집기·클라우드·가격 감시기가 같은 글(시험 tPRLOCK_1120이 견줌) · 풀기는 관제소에서 정범님 손으로만(묶음·그룹·상품 × 48시간·×2 따로 · app_settings/px_lock_free) */
  const PXL_DEF = { firstH: 48, mult: 2, defLagH: 24, minN: 5, maxLagH: 72, waitErrMin: 10 }; /* firstH·mult = 정범님 지시 그대로 · defLagH(표본이 모자랄 때 쓰는 공개 반영 시간)·minN(평균을 믿는 최소 표본 수)·maxLagH(평균 상한)·waitErrMin(잠금 상태를 못 읽었을 때 기다릴 분) = 근거: 없음, 설정으로 바꿈(app_settings/px_lag.def) */
  const pxlCfg = (lag) => ({ ...PXL_DEF, ...(lag && lag.def && typeof lag.def === 'object' ? lag.def : {}) });
  const pxlLagH = (lag) => { const D = pxlCfg(lag); const n = lag && +lag.n > 0 ? +lag.n : 0; const s = lag && +lag.avgSec > 0 ? +lag.avgSec : 0; const est = !(n >= D.minN && s > 0); return { h: est ? +D.defLagH : Math.min(+D.maxLagH, s / 3600), est, n, D }; };
  const pxlFids = (fold, gids) => { const F = (fold && fold.folds) || {}; const G = new Set((gids || []).map(String)); return Object.keys(F).filter((f) => ((F[f] && F[f].gids) || []).some((g) => G.has(String(g)))); };
  const pxlFree = (fr, o) => { o = o || {}; const r = { h48: false, x2: false, by: [] }; if (!fr) return r; const chk = (m, ids, nm) => { for (const id of ids || []) { const e = m && m[String(id)]; if (!e) continue; if (e.h48 === true && !r.h48) { r.h48 = true; r.by.push(nm + ':' + id + ':48'); } if (e.x2 === true && !r.x2) { r.x2 = true; r.by.push(nm + ':' + id + ':x2'); } } }; chk(fr.k, o.key ? [o.key] : [], '상품'); chk(fr.g, o.gids, '그룹'); chk(fr.f, o.fids, '묶음'); return r; };
  const pxlState = (rec, lag, fr, now) => { now = now == null ? Date.now() : +now; const L = pxlLagH(lag); const out = { lock: false, until: null, rule: '', lagH: L.h, est: L.est, n: (rec && +rec.n) || 0 }; if (!rec || !rec.first) return out; const f = fr || {}; const t1 = Date.parse(rec.first) || 0, tl = Date.parse(rec.last || rec.first) || 0; const u48 = !f.h48 && t1 > 0 ? t1 + L.D.firstH * 3600e3 : 0; const ux2 = !f.x2 && tl > 0 ? tl + L.D.mult * L.h * 3600e3 : 0; const u = Math.max(u48, ux2); if (u > now) { out.lock = true; out.until = new Date(u).toISOString(); out.rule = u === u48 ? 'h48' : 'x2'; } return out; };
  const pxlKst = (iso) => { const t = Date.parse(iso); if (!(t > 0)) return '?'; const d = new Date(t + 9 * 3600e3).toISOString(); return d.slice(5, 10).replace('-', '/') + ' ' + d.slice(11, 16); };
  const pxlNote = (r) => (!r || !r.lock ? '' : r.rule === 'err' ? '⏳ 가격 잠금 상태를 못 읽음 — ' + pxlKst(r.until) + '에 다시 봄(안전 쪽 · 실패 아님)' : '⏳ 가격 잠금 — ' + (r.rule === 'h48' ? '첫 가격 변경 뒤 48시간' : '공개 반영 평균 ' + Math.round(r.lagH * 10) / 10 + '시간 × 2' + (r.est ? '(표본 모자람 — 설정값)' : '')) + ' · ' + pxlKst(r.until) + '까지 · 잠금 끝난 뒤 반영');
  const pxlErr = (now) => ({ lock: true, until: new Date((now == null ? Date.now() : +now) + PXL_DEF.waitErrMin * 60e3).toISOString(), rule: 'err', lagH: 0, est: true, n: 0 });
  const pxlRec = (rec, at, from, to, src, gid) => { const r = rec && typeof rec === 'object' ? rec : {}; const t = String(at); const gids = [...new Set([...(gid ? [String(gid)] : []), ...(r.gids || [])])].slice(0, 5); const hist = [...(r.hist || []), { at: t, from: from == null ? null : +from, to: to == null ? null : +to, src: src || null }].slice(-20); return { first: r.first && r.first < t ? r.first : t, last: r.last && r.last > t ? r.last : t, n: (+r.n || 0) + 1, gids, hist }; };
  const pxlLagAdd = (lag, sec) => { const s0 = (((lag && lag.samples) || []).concat([Math.max(0, Math.round(+sec || 0))])).slice(-200); const so = s0.slice().sort((a, b) => a - b); return { avgSec: Math.round(s0.reduce((a, b) => a + b, 0) / s0.length), medSec: so[Math.floor(so.length / 2)], n: s0.length, samples: s0 }; };
  const pxlHeld = (w, apAt, now) => { now = now == null ? Date.now() : +now; if (!w || w.apAt !== (apAt || null)) return 0; const s = Date.parse(w.since) || now; return (+w.held || 0) + Math.max(0, Math.min(now, Date.parse(w.until) || now) - s); };
  const pxlFromActs = (rows) => { const M = {}; for (const a of rows || []) { if (!a || !a.key || !a.at || a.to == null || (a.from != null && +a.from === +a.to)) continue; const r = M[a.key] || { first: null, last: null, n: 0 }; r.first = !r.first || a.at < r.first ? a.at : r.first; r.last = !r.last || a.at > r.last ? a.at : r.last; r.n++; M[a.key] = r; } return M; };
  const pxlMerge = (old, b) => { const o = old || {}; return { first: o.first && o.first < b.first ? o.first : b.first, last: o.last && o.last > b.last ? o.last : b.last, n: Math.max(+o.n || 0, +b.n || 0), gids: o.gids || [], hist: o.hist || [], fill: 1 }; };
  /* }⏳PXL */
  let PXLC = null; /* 잠금 상황 2분 맡김(공개 반영 평균·풀기·묶음) */
  async function pxlCtxW() { if (PXLC && Date.now() - PXLC.t < 120e3) return PXLC; const [a, b, c] = await Promise.all([C('app_settings').doc('px_lag').get(), C('app_settings').doc('px_lock_free').get(), C('prd_price_batches').doc('_bkfold').get()]); PXLC = { t: Date.now(), lag: a.exists ? a.data() : null, fr: b.exists ? b.data() : null, fold: c.exists ? c.data() : null }; return PXLC; }
  async function pxlReadW(x) { try { const P = await pxlCtxW(); const d = await C('prd_pxlock').doc(String(x.key)).get(); const rec = d.exists ? d.data() : null; const ap = x.approval || {}; const gids = [ap.batchId, ap.gid, x.watchGid, x.watch && x.watch.gid, ...((rec && rec.gids) || [])].filter(Boolean).map(String); return pxlState(rec, P.lag, pxlFree(P.fr, { key: x.key, gids, fids: pxlFids(P.fold, gids) })); } catch (e) { return pxlErr(); } } /* 못 읽으면 10분 미룸(안전 쪽 · 실패 아님) */
  async function pxlNoteW(key, from, to, src, gid) { if (!key) return; const ref = C('prd_pxlock').doc(String(key)); await db.runTransaction(async (tx) => { const s = await tx.get(ref); tx.set(ref, { ...pxlRec(s.exists ? s.data() : null, new Date().toISOString(), from, to, src, gid), ...W() }); }); } /* 샵매니저에 값이 들어간 바로 뒤 — 첫·마지막 변경 때·횟수 */
  /* (0.10.77 정범님 I-1120-1055-16 「반영 시간 평균에서 처리가 중단된 시간은 따로 세어 빼야」) 마지막 확인이 정한 때(verify.next)보다 많이 늦게 돌았으면(감시기 꺼짐·밤 쉼·반영에 비킴·PC 꺼짐) 그 표본은 '멈춤 낀 표본'
   *  · 늦음 = 본 때 − 정한 때 · 넘으면 멈춤 = max(15분, 앞 확인~정한 때 간격의 절반) · 멈춤 낀 표본은 못 본 때~본 때 사이가 멈춘 만큼 넓어 가운데 값이 부풀므로 평균에 넣지 않고 따로 셈(stallN·stallSec) */
  const pxlStallAdd = (o, st, at) => ({ stallN: (+o.stallN || 0) + 1, stallSec: (+o.stallSec || 0) + Math.round(+st || 0), stallAt: at });
  async function pxlLagW(a) { const v = a && a.verify; if (!v || v.state !== 'ok' || v.late || a.pxl || v.lagLoSec == null || v.lagHiSec == null) return; a.pxl = 1; const sec = (+v.lagLoSec + +v.lagHiSec) / 2; const st = v.stallSec != null ? +v.stallSec : pxlStall(v, a); const ref = C('app_settings').doc('px_lag'); await db.runTransaction(async (tx) => { const s = await tx.get(ref); const o = s.exists ? s.data() || {} : {}; const at = new Date().toISOString(); tx.set(ref, { ...o, ...(st > 0 ? pxlStallAdd(o, st, at) : pxlLagAdd(o, sec)), at, by: 'price-watch:' + PC, ...W() }); }); PXLC = null; if (a.ref) a.ref.set({ pxl: 1 }, { merge: true }).catch(() => {}); } /* 공개 반영 평균 — 확인된 반영마다 (못 본 때~본 때 가운데) 한 표본 · 마지막 200개 · 한곳(app_settings/px_lag) */
  async function pxlBackfillW() { const VERK = '1'; let mine = false;
    try { await db.runTransaction(async (tx) => { const d = await tx.get(SREF); const ls = (d.data() || {}).pxlBackfill || {}; if (ls.ver === VERK && (ls.state === 'done' || (ls.state === 'running' && Date.now() - Date.parse(ls.at || 0) < 30 * 60000))) return; tx.set(SREF, { pxlBackfill: { ver: VERK, state: 'running', by: PC, at: new Date().toISOString() } }, { merge: true }); mine = true; }); } catch (e) { return; }
    if (!mine) return; let n = 0, st = 'done'; try { n = await pxlFill(); } catch (e) { st = 'failed'; log('⏳ 가격 잠금 지난 기록 채우기 실패: ' + e.message, 1); }
    await SREF.set({ pxlBackfill: { ver: VERK, state: st, by: PC, at: new Date().toISOString(), n } }, { merge: true }).catch(() => {}); if (st === 'done') log(`⏳ 가격 잠금 — 지난 8일 가격 변경으로 상품 ${n}개 기록 채움(지우지 않음)`); }
  async function pxlLagFixW() { const VERK = '1'; let mine = false; /* (0.10.77 I-1120-1055-16) 한 번만 — 지난 확인 기록(verify 'ok')으로 평균을 다시 셈: 멈춤 낀 표본은 빼고 따로 셈 · 예전 표본은 oldSamples에 그대로 둠(지우지 않음) */
    try { await db.runTransaction(async (tx) => { const d = await tx.get(SREF); const ls = (d.data() || {}).pxlLagFix || {}; if (ls.ver === VERK && (ls.state === 'done' || (ls.state === 'running' && Date.now() - Date.parse(ls.at || 0) < 30 * 60000))) return; tx.set(SREF, { pxlLagFix: { ver: VERK, state: 'running', by: PC, at: new Date().toISOString() } }, { merge: true }); mine = true; }); } catch (e) { return; }
    if (!mine) return; let st = 'done', info = {};
    try { const q = await C('prd_price_actions').where('verify.state', '==', 'ok').get(); const rows = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.verify && !a.verify.late && a.verify.lagLoSec != null && a.verify.lagHiSec != null).sort((p, q2) => String(p.verify.seenAt || '').localeCompare(String(q2.verify.seenAt || '')));
      let o = {}, nS = 0; const at = new Date().toISOString(); for (const a of rows) { const v = a.verify; const k = v.stallSec != null ? +v.stallSec : pxlStall(v, a); if (k > 0) { o = { ...o, ...pxlStallAdd(o, k, at) }; nS++; } else o = { ...o, ...pxlLagAdd(o, (+v.lagLoSec + +v.lagHiSec) / 2) }; }
      const ref = C('app_settings').doc('px_lag'); await db.runTransaction(async (tx) => { const s0 = await tx.get(ref); const o0 = s0.exists ? s0.data() || {} : {}; const keep = o0.oldSamples || o0.samples || []; tx.set(ref, { ...o0, samples: [], n: 0, avgSec: null, medSec: null, stallN: 0, stallSec: 0, ...o, oldSamples: keep, oldAvgSec: o0.oldAvgSec ?? o0.avgSec ?? null, fix: { ver: VERK, at, rows: rows.length, stall: nS }, at, by: 'price-watch:' + PC, ...W() }); }); PXLC = null; info = { rows: rows.length, stall: nS };
      log(`⏳ 공개 반영 평균 다시 셈 — 확인 ${rows.length}건 중 멈춤 낀 ${nS}건은 평균에서 빼고 따로 셈`); } catch (e) { st = 'failed'; log('⏳ 공개 반영 평균 다시 셈 실패: ' + e.message, 1); }
    try { await SREF.set({ pxlLagFix: { ver: VERK, state: st, by: PC, at: new Date().toISOString(), ...info } }, { merge: true }); } catch (e) {} }
  async function pxlFill() { const since = new Date(Date.now() - 8 * 864e5).toISOString(); const rows = []; /* 8일 = 가장 긴 잠금(평균 상한 72시간 × 2)보다 넉넉히 · 그보다 앞서 바꾼 상품은 다음 변경을 첫 변경으로 셈(안전 쪽) */
    const qa = await C('prd_price_actions').where('at', '>=', since).get(); qa.forEach((d) => { const a = d.data() || {}; if (a.kind === 'hold' || a.kind === 'unhold') return; rows.push({ key: a.key, at: a.at, from: a.from, to: a.to }); });
    const qc = await C('prd_listing_changes').where('at', '>=', since).get(); qc.forEach((d) => { const c = d.data() || {}; const p = c.changes && c.changes.price; if (c.source !== 'webEdit' || !p) return; rows.push({ key: c.listingKey, at: c.at, from: p.from, to: p.to }); });
    const M = pxlFromActs(rows); const ks = Object.keys(M); for (let i = 0; i < ks.length; i += 300) { const part = ks.slice(i, i + 300); const olds = await Promise.all(part.map((k) => C('prd_pxlock').doc(k).get())); const b = db.batch(); part.forEach((k, j) => b.set(olds[j].ref, { ...pxlMerge(olds[j].exists ? olds[j].data() : null, M[k]), ...W() })); await b.commit(); } return ks.length; }
  async function plkReadW(x) { try { const d = await C('prd_locks').doc(String(x.key || '')).get(); const own = d.exists ? d.data() || null : null; const by = [], bk = []; if (!(own && own.on === true) && x.listingId) { const q = await C('prd_locks').where('lid', '==', String(x.listingId)).get(); q.docs.forEach((e) => { by.push(e.data() || null); bk.push(e.id); }); } const lk = plkPickOn(own, by); if (lk) Object.defineProperty(lk, '_k', { value: lk === own ? d.id : bk[by.indexOf(lk)], enumerable: false }); return lk; } catch (e) { return undefined; } } /* undefined = 못 읽음 → 잠긴 것으로(안전 쪽) · (11/19 lkday1) 자기 문서가 꺼져 있어도 상품 번호(lid)로 켜진 잠금이 있으면 그것(예전엔 꺼진 문서가 있으면 lid 잠금을 안 봄) · _k = 그 잠금 문서 이름(안 보이는 속성 — 저장에 안 딸려 감) */
  /* (11/18 lockcond1 · 정범님 I-1118-1417-15.4) 🎚 조건 잠금 셈에 쓰는 시장 값 — 첫 페이지에서 우리·품절 뺀 줄 · 유효(짙은 유효·유효·알라딘측) 같은 등급 최저가 · 최상단 = 우리 아닌 첫 줄 · 정가는 상품 칸(없으면 잠금에 찍어 둔 값) */
  const plkCtxW = (l, p1, cur) => { const R0 = (p1 || []).filter((w) => w && w.c !== 'ours' && !w.so && +w.p > 0); const V = R0.filter((w) => (w.c === 'dkgreen' || w.c === 'green' || w.c === 'aladin') && (!l.grade || (w.g || '중') === l.grade)); return { at: Date.now(), tk: plkTkNew('w') /* (11/19 lkday1) at = 시장 값을 찍은 때(반영 직전 「오래된 시장 값」 판정) · tk = 이 결정의 표(하루 횟수를 한 번만 세게) */, cur: cur ?? null, list: +l.priceList || null, cost: null, low: V.length ? Math.min(...V.map((w) => +w.p)) : null, top: R0.length ? +R0[0].p : null }; };
  async function plkNoteW(key, lk, o) { try { if (!o.hit) return; if (lk.hit && lk.hit.want === (o.want ?? null) && Date.now() - Date.parse(lk.hit.at || 0) < 6 * 3600e3) return; await C('prd_locks').doc(String(lk._k || key)).set({ hit: { n: firebase.firestore.FieldValue.increment(1), at: new Date().toISOString(), p: o.p ?? null, want: o.want ?? null, why: String(o.why || '').slice(0, 160), by: 'watch' } }, { merge: true }); } catch (e) {} } /* 조건 잠금이 막거나 줄인 횟수(hit) — prd_locks에만 · (11/19 lkday1) 횟수는 서버에서 +1(겹쳐 써도 안 빠짐) · 오늘 바꾼 횟수·내린 금액(day)은 아래 plkCntW가 트랜잭션으로 */
  async function plkCntW(k, tk, cur, p) { try { let R = null; const ref = C('prd_locks').doc(String(k)); await db.runTransaction(async (tx) => { const s = await tx.get(ref); R = plkDayStep(s.exists ? s.data() : null, tk, cur, p); if (R.ok && R.day) tx.update(ref, { day: R.day }); }); return R || { ok: false, err: 1, why: '🎚 조건 잠금 — 하루 횟수를 못 셈' }; } catch (e) { return { ok: false, err: 1, why: '🎚 조건 잠금 — 하루 횟수를 못 셈(' + String((e && e.message) || e).slice(0, 60) + ')' }; } } /* (11/19 lkday1 · 검토 1-1) 오늘 바꾼 횟수·내린 금액을 읽고-셈하고-쓰기 한 묶음으로 — 둘이 동시에 더해도 2 · 같은 표(tk)는 한 번만 · 한도를 넘으면 ok:false(쓰지 않음) · day 칸은 통째로 바꿈(어제 표가 남지 않게) */
  /* (0.10.53 edkw1) 🔖 판본 검색 대조 — 수집기 검색 시세가 남긴 prd_market_nobook/{상품}.ed 를 읽어, 검색이 같은 판본을 찾았거나(srch) 근거가 모자라 사람 확인(check·hold)이면 막음 · 스위치 app_settings/main.edSearch(기본 켬 · 10분 기억) */
  const EDS = { at: 0, on: true };
  /* (edkw2 판 ② 더함 · 정범님 11/17 20:27) 우리 상품의 유의 사항(prd_used_info/{판매 번호}.note)에 사인본·친필·서명·넘버링·한정이 있으면 제목이 평범해도 막음 — 같은 이름의 보통판 시장일 수 있음(동방신기 정규 8집 사례) · 사람이 판을 고르면(edPick) 그것을 따름 */
  async function edNoteOfL(l, uinfo) { if (!P.edNoteKw || l.listingId == null) return []; let x = uinfo && uinfo[l.listingId]; if (x === undefined) { try { x = (await C('prd_used_info').doc(String(l.listingId)).get()).data() || null; } catch (e) { x = null; } } return x && x.note ? P.edNoteKw(String(x.note)) : []; }
  async function edBlockOf(l, key, uinfo) { try { const nw = await edNoteOfL(l, uinfo); if (!nw.length && (!P.edSuspect || !P.edSuspect(l.title || '').on)) return null; if (Date.now() - EDS.at > 600000) { try { EDS.on = ((await C('app_settings').doc('main').get()).data() || {}).edSearch !== false; } catch (e) {} EDS.at = Date.now(); } if (!EDS.on) return null;
      const dd = (await C('prd_market_nobook').doc(key).get()).data() || {}; const pk = dd.edPick && (dd.edPick.itemId || dd.edPick.none) ? dd.edPick : null; const e0 = dd.ed; const e1 = e0 && pk ? { ...e0, use: pk.itemId ? 'srch' : 'check', why: pk.itemId ? e0.why : '사람이 「다 아님」으로 정함' } : e0; const e = nw.length && !(pk && pk.itemId && e0) ? { ...(e0 || {}), use: 'check', hold: true, why: `유의 사항에 판본 낱말(${nw.join('·')})이 있어 같은 이름의 보통판 시장일 수 있음 · 판매가 그대로` } : e1; if (!e || !(e.use === 'srch' || e.use === 'check')) return null; /* (edkw2 판 ②) 사람 확인은 hold가 없어도 막음 · 사람이 고른 판(edPick)도 따름 */ const w = (v) => (v == null ? '-' : Number(v).toLocaleString('ko-KR') + '원');
      return { use: e.use, hold: !!e.hold, autoLow: e.autoLow ?? null, srchLow: e.srchLow ?? null, at: e.at || null, short: e.use === 'srch' ? '🔖 판본 의심 — 검색 시장 우선' : '🔖 판본 확인 필요', line: e.use === 'srch' ? `🔖 판본 의심 — 이 중고 목록은 다른 판본일 수 있음 · 검색에서 같은 판본을 찾음(자동 지표 최저 ${w(e.autoLow)} → 검색 최저 ${w(e.srchLow)}) · 자동 반영 막음` : `🔖 판본 확인 필요 — ${e.why || '같은 판본을 가리지 못함'} · 자동 반영 막음` }; } catch (e) { return null; } }
  async function processOne(l) {
    const key = 'aladin_' + l.usedCode; const now = new Date().toISOString();
    const decRef = C('prd_price_decisions').doc(key); const prevD = (await decRef.get()).data() || {};
    const book = l.bookId ? (await C('prd_books').doc(l.bookId).get()).data() : null;
    if (!book || !book.aladinItemId) { await decRef.set({ key, usedCode: l.usedCode, title: l.title || null, sku: l.sku || null, at: now, status: 'queue', action: 'review', reasons: ['도서 정보(알라딘 상품번호)가 없음 — 상품 수집이 먼저 필요'], approvalState: null, ...W() }, { merge: true }); return 'noBook'; }
    const doc = await aladinDoc(`/shop/UsedShop/wuseditemall.aspx?ItemId=${book.aladinItemId}&TabType=0`);
    const used = P.parseUsedPage(doc);
    // 관측 상태: 매물마다 처음 본 시각, 사라진 매물(24시간 확정용). 바뀐 것만 이력으로 쌓음
    const wRef = C('prd_market_watch').doc(l.bookId); const prevW = (await wRef.get()).data() || {};
    const firstSeen = { ...(prevW.firstSeen || {}) }; const curKeys = new Set();
    if (!prevW.at) { // 감시기가 처음 보는 책: 수집기가 전에 본 첫 페이지(prd_book_metrics)에 있던 매물은 그때부터 있던 것으로 (근거 있는 시각만 씀 — 없으면 오늘부터)
      const bm = (await C('prd_book_metrics').doc(l.bookId).get()).data();
      if (bm && bm.usedFirstPage && bm.lastCheckedAt) for (const r of bm.usedFirstPage) { const k = P.listingKey(r); if (!firstSeen[k]) firstSeen[k] = bm.lastCheckedAt; }
    }
    const rows = used.listings.map((r) => { const k = P.listingKey(r); curKeys.add(k); if (!firstSeen[k]) firstSeen[k] = now; return { ...r, page: 1, firstSeenAt: firstSeen[k] }; });
    const gone = (prevW.rows || []).filter((r) => !curKeys.has(r.k)).map((r) => ({ ...r, goneAt: now })).concat((prevW.gone || []).filter((r) => !curKeys.has(r.k) && Date.now() - Date.parse(r.goneAt) < 48 * 3600e3));
    const ld = P.listingsDiff(prevW.rows || null, used.listings);
    const b = db.batch();
    b.set(wRef, { bookId: l.bookId, at: now, rows: used.listings.map((r) => ({ k: P.listingKey(r), ...r })), firstSeen, gone: gone.filter((x, i, a) => a.findIndex((y) => y.k === x.k) === i), lastPage: used.lastPage || 1, buyback: used.buyback || null, ...W() });
    /* (0.10.3) 첫 페이지가 조금이라도 달라지면(순서만 · 비교 칸 밖의 칸 · 알라딘 매입가 · 끝 쪽) 그때의 첫 페이지 전체(page)·매입가를 함께 남김 — 예전엔 바뀐 칸 6개만 적어 순서·매입가 변화가 사라졌음. 같으면 쓰지 않음 */
    const prevRows = prevW.rows ? prevW.rows.map(({ k, page, firstSeenAt, ...r }) => r) : null; const stabJ = (v) => JSON.stringify(v, (kk, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().filter((q) => x[q] !== undefined).map((q) => [q, x[q]])) : x)); /* (0.10.17 자동 점검) 칸 순서와 상관없이 — Firestore가 돌려준 줄·매입가 묶음은 칸 이름 순이라 늘 '다름'이었음(같은 첫 쪽을 볼 때마다 장면 기록) */ const same = !!prevW.rows && stabJ(prevRows) === stabJ(used.listings) && stabJ(prevW.buyback ?? null) === stabJ(used.buyback ?? null) && (prevW.lastPage || 1) === (used.lastPage || 1);
    if (ld || !same) b.set(C('prd_metric_changes').doc(), { bookId: l.bookId, at: now, kind: 'usedListings', source: 'price-watch', add: ld ? ld.add : [], del: ld ? ld.del : [], chg: ld ? ld.chg : [], orderOnly: !ld, page: JSON.parse(JSON.stringify(used.listings || [])), buyback: used.buyback || null, prevBuyback: prevW.buyback ?? null, firstRecord: ld ? ld.first : !prevW.rows, lastPage: used.lastPage || null, prevLastPage: prevW.lastPage ?? null, ...W() });
    await b.commit();
    const mine = used.listings.find((r) => r.usedCode && r.usedCode === l.usedCode) || null; // 우리 매물은 상품코드로만 찾음 (같은 책 여러 권일 때 다른 권과 헷갈리지 않게)
    const listing = { ...l, key, price: mine ? mine.price : l.price, ship: mine && mine.ship != null ? mine.ship : SHOP.fee ?? undefined, /* 우리 매물이 첫 페이지에 없으면 우리 가게 배송비 정책(수집기가 매일 읽는 crm_system/shopPolicy) */ lowest: prevD.lowest || null, pendingChange: prevD.pendingChange || null };
    const sellers = await sellersFor(rows.map((r) => r.sellerCode));
    const WGm = await wgLoad(); const wg = prevD.watch && prevD.watch.gid ? WGm.get(prevD.watch.gid) || null : null; const pre = wg && wg.watch.mode === 'semi' ? presetOf(wg) : null; const watched = !!(wg && (wg.watch.mode !== 'semi' || pre));
    if (wg && wg.watch.mode === 'semi' && !pre) log(`반자동 조건 묶음(${wg.watch.presetId || '?'})이 없어 감시하지 않음: ${l.title || l.usedCode} — 웹앱에서 그룹의 조건 묶음을 다시 고르세요`, 1);
    const SP = watched ? stratPick(wg, pre, prevD, WGm, key) : null; const CHR = await chaseFor(key, l.bookId, now, SP ? (SP.strat || {}).detect : null); const chase = CHR ? CHR.map : null; /* (🎯 추격자 엔진) 찾기 = 엔진 collect · 정책(무시·보통 판매자)은 엔진 mapWithPolicy가 반영 — 정책이 꺼져 있으면 예전과 같은 지도 */ // (0.8.0) 추격자 찾기를 판정에 연결 (예전엔 엔진에 추격 규칙만 있고 자료를 넘기지 않아 양보가 한 번도 동작하지 않았음)
    const ctx = { now, core: Core, RS, chase, chaseMoves: CHR ? CHR.moves : {}, buyback: used.buyback || null, policy: { fee: mine && mine.ship != null ? mine.ship : SHOP.fee ?? null, freeOver: SHOP.freeOver ?? null }, settings: engineSettings(), peerEv: await peerEv(), yes24: prevD.yes24 && Date.now() - Date.parse(prevD.yes24.at) < 48 * 3600e3 ? prevD.yes24 : null };
    const market = { at: now, pagesSeen: 1, lastPage: used.lastPage || 1, rows, recentGone: gone };
    let d = PR.decide(listing, market, sellers, ctx);
    if (d.needYes24 && !ctx.yes24) { try { ctx.yes24 = await yes24For(l.isbn13 || book.isbn13); d = PR.decide(listing, market, sellers, ctx); log(`예스24 대조: ${l.title || l.usedCode} (${ctx.yes24.offers.length}개)`); } catch (e) { log(`예스24 실패: ${e.message}`, 1); } }
    // 블록의 ? 표시: 수집기 '경쟁 매물 유의사항·사진'이 모은 것 (유의 사항 글이 있거나 새상품과 다른 사진)
    const uinfo = {}; await Promise.all(used.listings.filter((r) => r.listingId).map(async (r) => { try { const x = (await C('prd_used_info').doc(String(r.listingId)).get()).data(); if (x) uinfo[r.listingId] = x; } catch (e) {} }));
    const settled = !['wait', 'skip'].includes(d.status);
    const lowest = settled ? PR.trackLowest(prevD.lowest || null, { at: now, atLowest: d.status === 'ok' && d.action === 'none' }) : prevD.lowest || null;
    const sig = `${d.status}|${d.action}|${d.target}|${d.ref ? d.ref.sellerCode + ':' + d.ref.price : ''}`;
    // 관리자 판정 기간(2026-10-04~): 적용 묶음은 판정 결과와 관계없이 모두 관리자에게 (유지·기다림·사람 확인도) → 모든 결정을 기록해 분석한 뒤 자동화
    const EXo = d.group === 'treat' || watched ? await engExcl() : null; const NLc = await engFence(); const NOLOSS = fenceNoLoss(NLc); /* (11/10 fence3) 무손해 모드(app_settings/eng_fence.noLossMode · 없거나 못 읽으면 켜짐) */
    const OPS = wg ? { why: `🛰 감시 그룹 '${String(wg.name || wg.id).slice(0, 30)}'${wg.watch && wg.watch.chase ? ' · 🎯 추격자' : ''}` } : null; /* (11/10 fence4) 정범님이 손대 진행 중인 상품(켜진 감시 그룹·추격자 그룹) = 연구가 안 건드림 */
    const LOCK = fenceLock(l, { key, excl: EXo ? EXo[key] || null : null, dec: prevD, nowMs: Date.now(), gid: (prevD.watch && prevD.watch.gid) || null, ops: OPS }); /* (11/10 fence3) 🔒 등록 3개월 안 · 사람이 손댐 → 연구(전체 비율 실험)가 값·상태를 안 바꿈(판정만 기록) · (fence4) 🛰 감시 그룹 자동 반영·🎯 추격자에는 안 씀(정범님 운영 기능 — 그룹 설정대로) */
    const needApproval = d.group === 'treat' && d.status !== 'skip' && !(EXo && EXo[key]) && !NOLOSS && !LOCK; /* (11/10 fence2) 사람이 손대 엔진 실험에서 빠진 상품(eng_excl)은 전체 비율 실험 제안을 다시 올리지 않음 · (fence3) 무손해 모드·🔒 상품도 제안을 올리지 않음(판정만) */
    // 관리자가 정한 것 중 아직 반영 안 된 것(승인·직접 가격·판매보류풀)은 새 판정이 절대 덮지 않음 — 반영이 먼저
    // 반영 끝났거나 유지·거절한 것은 시장이 그대로면(같은 판정) 그대로 두고, 시장이 바뀌면 다시 결정 대기로
    const ctrlHold = !!(prevD.ctrlOf && prevD.ctrlOf.gid) && (await ctrlAlive(prevD.ctrlOf.gid)); /* (10/30 위험 4) 수동 일괄 그룹의 비교군 = 가격을 바꾸지 않고 두는 상품 — 감시는 판정만 기록 */
    const waitingExec = ['approved', 'manual', 'hold', 'unhold'].includes(prevD.approvalState) || ctrlHold;
    const batchKeep = !prevD.watch && !!(prevD.approval && prevD.approval.decision === 'batch' && Date.now() - Date.parse(prevD.approval.at || 0) < 7 * 864e5); // (0.8.0) 감시 그룹에 든 상품은 첫 가격이 반영된 뒤부터 감시 // (0.5.0) 수동 일괄로 정한 상품은 7일 동안 엔진이 결정 대기로 되돌리지 않음 (확정 탭·원상복귀가 그대로 동작하게)
    const keepApproval = waitingExec || batchKeep || prevD.approvalState === 'applying' || (prevD.sig === sig && ['kept', 'rejected', 'done', 'cleared', 'cancelled'].includes(prevD.approvalState)); // (0.5.0) 비움·확정 취소도 시장이 그대로면 다시 올리지 않음 · 반영 중인 것은 절대 건드리지 않음
    const rec = { key, usedCode: l.usedCode, listingId: l.listingId || null, bookId: l.bookId, title: l.title || null, sku: l.sku || null, grade: l.grade || null, group: d.group, at: now, status: d.status, action: d.action,
      current: d.current ?? null, target: d.target ?? null, delta: d.delta ?? null, deltaPct: d.deltaPct ?? null, rule: d.rule || null, reasons: d.reasons, autoBlock: d.autoBlock, ref: d.ref || null, floors: d.floors || null, tier: d.tier || null,
      rows: (d.rows || []).map(([rank, sc, color, grade, price, ship, name]) => ({ rank, sc, color, grade, price, ship, name: name || null })), worseCheapest: d.worseCheapest || null, aladinItemId: book.aladinItemId || null, isbn13: l.isbn13 || book.isbn13 || null, page1: used.listings.map((r, i) => { const al = PR.isAladinSide(r, engineSettings()); const sd = r.sellerCode ? sellers['sc_' + r.sellerCode] : null; const ours = r.usedCode === l.usedCode || String(r.sellerCode) === PR.DEFAULTS.ourSeller;
        return { r: i + 1, n: r.sellerName || null, sc: r.sellerCode || null, g: r.grade || null, p: r.price ?? null, s: r.ship ?? null, c: ours ? 'ours' : al ? 'aladin' : r.sellerCode ? (sd ? Core.classifySellerDoc(sd, RS).cls : 'unknown') : 'unknown', lid: r.listingId || null, uc: r.usedCode || null, so: r.soldOut ? 1 : 0, ...(uinfo[r.listingId] ? { q: uinfo[r.listingId].hasNote || uinfo[r.listingId].photoDiff ? 1 : 0, qn: String(uinfo[r.listingId].note || '').slice(0, 120) || null, qp: uinfo[r.listingId].sellerPhotoCount || 0 } : {}) }; }), yes24Used: !!ctx.yes24, counts: d.counts || null, peerShadow: d.peerShadow || null, /* (sv1 11/10) 🧭 판매자 가치 그림자(기록만) */ /* Firestore는 목록 안의 목록을 못 받음 → 줄마다 이름 붙인 칸으로 */ needYes24: !!d.needYes24, yes24: ctx.yes24 || null, lowest, sig, engine: PR.VERSION,
      approvalState: keepApproval ? prevD.approvalState : needApproval ? 'pending' : null, ...(keepApproval ? {} : { approval: null }), lock: LOCK ? { kind: LOCK.kind, why: LOCK.why, until: LOCK.until || null, scope: 'research', at: now } : null, ...W() }; /* (fence4) scope research = 연구·엔진만 안 건드림(감시 자동 반영·추격자는 그대로) */
    if (d.group === 'treat' && d.status !== 'skip' && (NOLOSS || LOCK)) rec.reasons = [(LOCK ? '🔒 ' + LOCK.why : '🧪 무손해 모드 — 전체 비율 실험은 판정만 기록(값을 바꾸지 않음)'), ...(rec.reasons || [])].slice(0, 12);
    let JW = null, PLKQ = null; if (watched) { const P1c = (rec.page1 || []).map((w) => ({ ...w })); const J = watchJudge(wg, pre, listing, market, sellers, ctx, P1c, used, prevD, now, SP); JW = J; const DRYW = wgDry(wg.watch); J.dry = DRYW; const CG = DRYW ? null : await ctrlGate(wg.id, !!J.chaser, key, now); /* (판 러) ⏸ 묶음 자동 멈춤 · (0.10.69 strat5) 🌓 셈만 그룹은 묶음 멈춤·알림도 쓰지 않음(셈만이라 내린 값이 없음) */
      if (CG && CG.pause) { if (CG.cfg.dayDrop.lure === 'restore' && J.strat && J.strat.active && J.strat.name === 'lure' && J.start > listing.price) { J.target = J.start; J.strat = { ...J.strat, active: false, end: 'ctrlPause', endedAt: now }; J.reasons = ['⏸ 묶음 자동 멈춤 — 미끼(끌어내린 뒤 빠지기)를 멈추고 시작 값으로 되돌림', ...J.reasons]; } else J.reasons = [CG.line, ...J.reasons]; }
      const cur = listing.price; const chg = J.target != null && cur != null && J.target !== cur; const sg = (wg.watch.guardPct ?? 15);
      Object.assign(rec, { watchGid: wg.id, watchMode: wg.watch.mode, presetId: pre ? wg.watch.presetId : null, presetName: pre ? pre.name || null : null, status: J.target == null ? 'queue' : 'ok', action: J.target == null ? 'review' : chg ? 'set' : 'none', target: J.target, delta: chg ? J.target - cur : 0, deltaPct: chg && cur ? (J.target - cur) / cur : 0, reasons: J.reasons, strat: J.strat || null, chaser: J.chaser || null, floorW: J.floor || 0, chaseSrc: J.chaseSrc || null /* (11/09) 어느 추격자 전략이 왜(그룹 개별·조건 묶음·전체) — 웹앱 결정 카드 한 줄 */ });
      if (!DRYW && J.chR && J.chR.rule !== undefined) { /* (0.10.73 strat6 · 판 ⑨) 규칙 장부 — 하루 바꾼 횟수(dayN)·추격자가 사라진 때(goneAt) · 셈만 그룹은 안 씀(쓰기 0 그대로) */ const dk = new Date(Date.parse(now) + 9 * 3600e3).toISOString().slice(0, 10); const pd = prevD.ruleSt && prevD.ruleSt.dayN; const nn = chg ? { day: dk, n: (pd && pd.day === dk ? +pd.n || 0 : 0) + 1 } : pd || null; const pg = (prevD.ruleSt && prevD.ruleSt.goneAt) || null; rec.ruleSt = { dayN: nn, goneAt: J.chaser ? null : prevD.chaser ? pg || now : pg }; }
      const batchHoldW = !!(prevD.approval && prevD.approval.decision === 'batch' && Date.now() - Date.parse(prevD.approval.at || 0) < 7 * 864e5 && (String(prevD.approval.batchId || '') !== String(wg.id) || wg.watch.mode !== 'semi')); /* (10/30 정범님 '세 기능 연계 만전' · 위험 1) 감시 그룹에 든 상품이라도 수동 일괄로 확정한 지 7일 안이면 감시는 판정만 기록 — 예전엔 감시(자동 · 엔진 설정)가 일괄 확정가를 다음 판정에서 되돌려 가격이 왔다 갔다 함 */
      const keepW = waitingExec || prevD.approvalState === 'applying' || batchHoldW; if (batchHoldW && chg) rec.reasons = ['수동 일괄 확정 7일 보호 — 감시 판정은 기록만(가격 바꾸지 않음)', ...(rec.reasons || [])].slice(0, 12);
      /* (11/10 fence4 · 정범님 11/09 밤 '감시 그룹 자동 반영과 추격자는 내가 결정해서 할 일 — 기능을 왜 꺼?') 🔒 연구 잠금(등록 3개월 안·사람 손댐 14일)은 여기 안 씀 — 정범님이 그룹에 정한 설정(자동 반영 한도·하한·제외)대로 예전처럼 */
      if (DRYW) { /* (0.10.69 strat5 · 정범님 I-1119-1717-22) 🌓 셈만 — 결정(approvalState·approval·autoBlock)·전략 진행(strat)·잠금 기록·묶음 멈춤을 하나도 쓰지 않고 '무엇을 얼마로 바꿨을지'만 rec.dry에 · 자동 승인도 결정 대기도 만들지 않음 */
        const whyD = []; let TGD = J.target; if (chg) { const pct = Math.abs(J.target - cur) / cur * 100; if (J.chR && J.chR.rule && J.chR.rule.approve) whyD.push('규칙: 승인 필요'); if (wg.watch.apply !== 'auto') whyD.push('관리자 승인 그룹'); else { if (pct > sg) whyD.push(`변경 ${pct.toFixed(1)}% > 자동 반영 한도 ${sg}%`); if (J.floor && J.target < J.floor) whyD.push('하한 아래'); if (PR.isExcluded(listing, engineSettings())) whyD.push('자동 제외 상품'); }
          try { if ((await plkSetW()).has(key)) { const lk = await plkReadW({ key, listingId: listing.listingId }); const B = lk ? plkBlock(lk, ['price']) : null; if (lk === undefined) whyD.push('🔒 잠금 상태를 못 읽음'); else if (B && B.cond) { const Q = plkClamp(lk, J.target, plkCtxW(listing, rec.page1, cur)); if (!Q.ok) whyD.push(Q.why); else if (Q.cut) TGD = Q.p; } else whyD.push('🔒 잠긴 상품 — 판매 상태 말고는 바꾸지 않음'); } } catch (e) { whyD.push('🔒 잠금 확인 실패'); } }
        const FT = wgFastTh(wg); const ft0 = wg.watch.firstTry && typeof wg.watch.firstTry === 'object' ? wg.watch.firstTry : {};
        rec.dry = { at: now, gid: wg.id, since: ft0.since || null, mode: 'dry', from: cur ?? null, want: J.target ?? null, to: chg ? TGD : null, delta: chg && TGD != null ? TGD - cur : 0, would: !chg ? 'none' : whyD.length ? 'pending' : 'auto', why: whyD.slice(0, 6), apply: wg.watch.apply || 'approve',
          strat: J.strat ? { name: J.strat.name || null, active: !!J.strat.active, phase: J.strat.phase || null, round: J.strat.round || null } : null, chaser: J.chaser ? { sc: J.chaser.sellerCode || null, name: J.chaser.name || null, price: J.chaser.price ?? null } : null, fastTh: FT };
        rec.strat = prevD.strat && prevD.strat.active ? { ...prevD.strat, active: false, end: 'dry', endedAt: now } : prevD.strat || null; /* 셈만은 전략을 진행하지 않음(진행 중이던 판은 끝냄 — 다시 보기 목록에 계속 남지 않게) */
        rec.approvalState = prevD.approvalState ?? null; delete rec.approval; delete rec.autoBlock;
        rec.reasons = [`🌓 셈만 — 값·상태를 바꾸지 않음${chg ? ` (바꿨다면 ${(+cur).toLocaleString()} → ${(+TGD).toLocaleString()}원 · ${whyD.length ? '결정 대기' : '자동 반영'})` : ''}`, ...(rec.reasons || [])].slice(0, 12); }
      else if (!keepW) { if (chg) { const why = []; const pct = Math.abs(J.target - cur) / cur * 100; if (J.chR && J.chR.rule && J.chR.rule.approve) why.push('규칙: 승인 필요'); if (wg.watch.apply !== 'auto') why.push('관리자 승인 그룹'); else { if (pct > sg) why.push(`변경 ${pct.toFixed(1)}% > 자동 반영 한도 ${sg}%`); if (J.floor && J.target < J.floor) why.push('하한 아래'); if (PR.isExcluded(listing, engineSettings())) why.push('자동 제외 상품'); } let TGW = J.target, PXW = null, PLKD = null; const LSW = await plkSetW(); if (!LSW) why.push('🔒 잠금 목록을 못 읽음 — 자동 반영하지 않음(안전 쪽)'); /* (11/19 lkday1) 끊긴 때는 잠긴 것으로 */ else if (LSW.has(key) || (listing.listingId && LSW.has('lid:' + listing.listingId))) { const lk = await plkReadW({ key, listingId: listing.listingId }); const B = lk ? plkBlock(lk, ['price']) : null; if (B && B.cond) { PXW = plkCtxW(listing, rec.page1, cur); const Q = plkClamp(lk, J.target, PXW); if (!Q.ok) { why.push(Q.why); await plkNoteW(key, lk, { hit: 1, want: J.target, why: Q.why }); } else if (Q.cut) { TGW = Q.p; rec.reasons = [Q.why, ...(rec.reasons || [])].slice(0, 12); await plkNoteW(key, lk, { hit: 1, want: J.target, p: Q.p, why: Q.why }); } if (Q.ok) PLKD = { k: lk._k || key, tk: PXW.tk, cur, p: TGW }; } else why.push('🔒 잠긴 상품 — 판매 상태 말고는 바꾸지 않음'); } /* (11/18 lockcond1) 조건 잠금이면 선 안에서만 자동 반영(넘으면 선까지 줄이거나 막음) · 완전·새로 잠금은 예전처럼 막음 */
          if (CG && CG.pause && TGW < cur) why.push(`⏸ 묶음 「${CG.name}」 자동 멈춤 — 값을 내리는 자동 반영은 선택 대기로`); /* (판 러) 올리기는 그대로 */
          if (!why.length) { Object.assign(rec, { approvalState: 'approved', approval: { decision: 'auto', by: 'engine:' + wg.id, gid: wg.id, at: now, price: TGW, expectPrice: cur, reasons: J.reasons.slice(0, 6), ...(PXW ? { plkx: PXW } : {}) }, autoBlock: [] }); PLKQ = PLKD; } /* (11/19 lkday1) 하루 횟수는 이 승인이 실제로 적힌 뒤(아래 트랜잭션 뒤)에 표(plkx.tk)로 셈 — 예전엔 적히기 전에 세어, 판본 의심·다른 기기 결정으로 승인이 안 돼도 횟수가 늘었음 */
          else Object.assign(rec, { approvalState: 'pending', approval: null, autoBlock: why }); }
        else { Object.assign(rec, { approvalState: prevD.approvalState === 'pending' ? null : prevD.approvalState || null }); if (prevD.approvalState !== 'pending') delete rec.approval; } }
      else Object.assign(rec, { approvalState: prevD.approvalState }); if (keepW) delete rec.approval; }
    const ED = await edBlockOf(l, key, uinfo); if (ED) { rec.ed = ED; rec.reasons = [ED.line, ...(rec.reasons || [])].slice(0, 12); if (rec.approval && rec.approval.decision === 'auto' && rec.approval.at === now) { Object.assign(rec, { approvalState: 'pending', approval: null, autoBlock: [ED.short] }); } else if (rec.approvalState === 'pending' && !keepApproval && !rec.dry) rec.autoBlock = [ED.short, ...(rec.autoBlock || [])].slice(0, 8); } /* (0.10.53 edkw1 · 정범님 11/17 14:00) 🔖 판본 의심 상품: 이 새책 화면의 중고 목록이 다른 판본일 수 있음 → 이번 판정의 자동 반영을 막고 관리자에게(값은 그대로 · 웹앱 일괄 계산이 검색 시장으로 다시 셈) */
    if (!watched && prevD.strat && prevD.strat.active) rec.strat = { ...prevD.strat, active: false, end: 'notWatched', endedAt: now }; // 감시를 끄거나 뺀 상품의 전략은 끝냄 (다시 보기 목록에 계속 남지 않게)
    /* (10/30 위험 2) 판정 기록은 트랜잭션으로 — 처음 읽은 결정(prevD)과 지금 결정이 다르면(그 사이 웹앱에서 일괄 확정·직접 가격·원상복귀 등) 결정 칸(approvalState·approval·autoBlock)은 쓰지 않고 시장·판정 칸만 · 예전엔 수~수십 초 뒤 merge 쓰기로 다른 기기의 확정을 소리 없이 옛 값으로 덮었음 */
    const logRef = prevD.sig !== sig ? decRef.collection('log').doc() : null; let raced = false;
    await db.runTransaction(async (tx) => { const cur = (await tx.get(decRef)).data() || {}; const r2 = { ...rec };
      raced = (cur.approvalState || null) !== (prevD.approvalState || null) || ((cur.approval && cur.approval.at) || null) !== ((prevD.approval && prevD.approval.at) || null);
      if (raced) { delete r2.approvalState; delete r2.approval; delete r2.autoBlock; }
      tx.set(decRef, r2, { merge: true }); if (logRef) tx.set(logRef, { at: now, sig, status: d.status, action: d.action, current: rec.current, target: rec.target, ref: rec.ref, reasons: d.reasons, ...(raced ? { raced: true } : {}), ...(rec.dry ? { dry: rec.dry } : {}), ...W() }); }); // 바뀐 판정만 이력
    if (JW && !JW.dry && (JW.chaser || (prevD.strat && prevD.strat.active))) await chaseRecord(JW, { key, usedCode: l.usedCode, bookId: l.bookId, title: l.title || null, now, cur: listing.price, start: JW.start, chaser: JW.chaser, prevChP: prevD.chaser ? prevD.chaser.price ?? null : null }, prevD.strat || null); /* 🎯 관계·전략 기록(바뀐 것만) */
    if (PLKQ && !raced && rec.approval && rec.approval.plkx && rec.approval.plkx.tk === PLKQ.tk) { const R = await plkCntW(PLKQ.k, PLKQ.tk, PLKQ.cur, PLKQ.p); if (!R.ok) { try { await db.runTransaction(async (tx) => { const v = (await tx.get(decRef)).data() || {}; if (v.approvalState === 'approved' && v.approval && v.approval.plkx && v.approval.plkx.tk === PLKQ.tk) tx.set(decRef, { approvalState: 'pending', approval: null, autoBlock: [R.why] }, { merge: true }); }); } catch (e) {} log(`🎚 조건 잠금 하루 한도 — 자동 승인을 선택 대기로: ${l.title || l.usedCode} (${R.why})`); } } /* (11/19 lkday1) 그 사이 다른 곳이 먼저 세어 한도를 넘었으면 승인을 거둠 · 세기 전에 반영이 먼저 집어 가도 반영 쪽이 같은 표로 한 번만 셈 */
    if (raced) log(`판정 중 결정이 바뀜(다른 기기) — 결정은 그대로 두고 판정만 기록: ${l.title || l.usedCode}`);
    return d.status + (needApproval ? '·승인대기' : '');
  }

  /* ── 승인된 가격만 반영 (A단계 = L0: 사람 승인 없이는 절대 안 바꿈) ── */
  /* (0.5.0) 반영 안전장치 — 사람이 정하지 않은 변경이 일어나지 않게
   *  ① 반영 직전에 그 결정을 트랜잭션으로 '반영 중(applying)'으로 맡음: 화면에서 읽은 뒤 웹앱에서 결정을 바꿨거나 취소했으면(결정 시각이 다르면) 반영하지 않음
   *  ② 관리자 가격(manual·수동 일괄)은 관리자가 적은 가격만 — 엔진 추천가로 대신하지 않음
   *  ③ 결정 뒤 상품이 판매중이 아니게 됐거나, 결정 뒤 다른 곳에서 가격이 바뀌었으면(수집기 최신 기록) 반영하지 않고 '막힘'
   *  ④ 결정한 지 72시간 넘은 가격은 반영하지 않음(시장이 바뀌었을 수 있음 — 다시 확인)
   *  ⑤ 반영 뒤 '반영됨'으로 바꿀 때도 그 사이 결정이 바뀌었으면 새 결정을 덮지 않음
   *  ⑥ '반영 중'에서 멈춘 것(탭이 닫힘 등)은 10분 뒤 '막힘 — 샵매니저에서 가격 확인'으로 (다시 보내지 않음) */
  /* FENCE-PURE-START — 🧪 하루 손해 울타리 · 실행 전에 막기(정범님 11/09 밤 '절대로 기준을 넘는 일이 없도록' · 약속 33) — 순수 함수만
   *  학습 공용(readnow-ml-core.js)과 가격 감시기(readnow-price-watch.user.js)에 글자 그대로 같은 사본 — 시험 tFENCE2가 두 사본이 같은지 봄(감시기 머리 @require를 바꾸지 않으려고 사본)
   *  (11/10 fence5 · 정범님 11/10 새벽 '감시와 전략은 곧 사용 — 미리 정밀히 검토해서 원인을 찾고 고쳐줘' · 11/09 정밀 점검 ⑤-2) 뜻 = **그날 엔진이 실제로 내린 몫**(정범님 확정 값 기준 (나))
   *   예전(fence2~4): x[상품].a(= 시작 값 − 지금 값 · 내려 둔 값 전체)를 날마다 그대로 이어 받아 '쓴 + 걸린 a 모두'를 셈 → 팔리거나 값이 오르기 전엔 날이 바뀌어도 안 풀림(누적 노출 한도 · 내림 10여 건 뒤 다음 날도 멈춤)
   *   지금: 내림 한 번마다 '정범님 확정 값 아래로 새로 내려간 몫'(d = max(0, s − 내릴 값) − max(0, s − 지금 값))만 그날 몫(t)에 더함 · 값을 올려도 그날 몫은 돌려받지 않음(안전 쪽) · 새 날은 몫 0부터(내려 둔 값은 a로 기록만)
   *  원장 eng_fence_ledger/{한국 날짜} = { v:2, day, spent(= gone + 상품마다 t · 오늘 엔진이 내린 몫 합 · 같은 날 줄지 않음), done(옛 판 읽기용 = spent), gone(오늘 원장에서 빠진 상품의 그날 몫), ops·opsGone(🛰 감시 자동 반영·🎯 추격자가 내린 몫 — 기록만 · 한도 셈 밖), sold(오늘 실험 상품이 시작 값보다 싸게 팔려 덜 받은 돈 — 참고), x{상품}, no[막은 기록] }
   *   x[상품] = { s(손해 셈 기준 값 — 정범님 확정 값), p(지금 값), a(= s − p, 0 아래면 0 — 내려 둔 값 · 기록), t(오늘 엔진이 내린 몫), od(오늘 감시·추격자가 내린 몫), src, r(진행 중 내림 예약 { id, to, from, d(이 내림의 몫), a(= s − to · 옛 판 읽기용), at, by, cmd, ops }) }
   *  셈: 오늘 내린 몫(spent) + 진행 중 예약 몫(감시·추격자 것은 뺌) + 이번 내림 몫 ≤ 한도일 때만 예약(부분 적용 없음)
   *  옛 원장(v 없음 · 그날 fence4가 만든 것): 상품마다 t가 없으면 a(내려 둔 값 전체)를, 옛 done(팔린 손해)도 쓴 몫으로 셈 — 그날만 예전처럼 엄하게(안전 쪽) · 다음 날 새 원장부터 새 뜻
   *  한도는 클라우드가 준 값(app_settings/eng_fence_now)만 — 없거나 36시간 넘으면 내리지 않음(실패 때 안전 쪽) · 값이 이상하면 바닥 5,000원 */
  const FENCE = { min: 5000, max: 30000, staleH: 36, ttlMin: 15, noKeep: 100, newDays: 90, humanDays: 14 }; /* (11/10 fence3) newDays 90 = 정범님 11/09 밤 '등록 3개월 이내 상품도 포함' · humanDays 14 = 사람 손댄 뒤 엔진이 안 건드리는 날 수(EXP_DEF.humanCoolD와 같음) */
  const fenceN = (v) => (v != null && v !== '' && Number.isFinite(+v) ? +v : null);
  const fenceHeld = (e) => (e ? Math.max(fenceN(e.a) || 0, (e.r && fenceN(e.r.a)) || 0, 0) : 0); /* 내려 둔 값(옛 뜻의 걸린 손해) — 기록·옛 원장용 */
  const fenceV2 = (L) => !!(L && +L.v >= 2);
  /* fenceT(e, L) — 그 상품의 오늘 엔진 몫(확정) · 옛 원장에서 t가 없으면 내려 둔 값 전체(안전 쪽) · fenceRD(e) — 진행 중 예약의 몫(감시·추격자 예약은 0) */
  const fenceT = (e, L) => (!e ? 0 : fenceN(e.t) != null ? Math.max(0, fenceN(e.t)) : fenceV2(L) ? 0 : Math.max(0, fenceN(e.a) || 0));
  const fenceRD = (e) => { const r = e && e.r; if (!r || r.ops) return 0; if (fenceN(r.d) != null) return Math.max(0, fenceN(r.d)); return Math.max(0, (fenceN(r.a) || 0) - Math.max(0, fenceN(e.a) || 0)); };
  const fenceGone = (L) => { L = L || {}; return Math.max(0, fenceN(L.gone) || 0) + (fenceV2(L) ? 0 : Math.max(0, fenceN(L.done) || 0)); };
  /* fenceStep(s, from, to) — 내림 한 번의 몫 = 기준(s) 아래로 새로 내려간 만큼(기준보다 위에서 내린 몫은 손해 아님) */
  const fenceStep = (s, from, to) => Math.max(0, Math.max(0, s - to) - Math.max(0, s - from));
  /* fenceLimitOf(nw, nowMs) — nw = app_settings/eng_fence_now { dayLoss, at, fix } → { ok, limit, why } */
  function fenceLimitOf(nw, nowMs, F0) { const F = { ...FENCE, ...(F0 || {}) }; nowMs = nowMs || Date.now(); if (!nw || !nw.at) return { ok: false, limit: null, why: '클라우드가 준 하루 손해 한도가 없음' };
    const age = (nowMs - Date.parse(nw.at)) / 36e5; if (!(age >= -0.5 && age <= F.staleH)) return { ok: false, limit: null, why: `하루 손해 한도가 ${Number.isFinite(age) ? Math.round(age) + '시간 전' : '언제 것인지 모르는'} 값(${F.staleH}시간 안 것만 씀)` };
    const v = fenceN(nw.dayLoss); if (v == null || v <= 0 || (!nw.fix && (v < F.min || v > F.max))) return { ok: true, limit: F.min, why: `한도 값(${nw.dayLoss})이 이상해 바닥 ${F.min.toLocaleString()}원` }; return { ok: true, limit: v, why: null }; }
  /* fenceSum(L, skipKey) — done(오늘 엔진이 내린 몫 · 확정) · held(진행 중 예약 몫) · used(합 — 한도와 견줌) · ops(감시·추격자가 내린 몫 — 기록만) · sold(팔려 덜 받은 돈 — 참고) · expo(내려 둔 값 합 — 참고) */
  function fenceSum(L, skipKey) { L = L || {}; let done = fenceGone(L), held = 0, ops = Math.max(0, fenceN(L.opsGone) || 0), expo = 0, n = 0;
    for (const [k, e] of Object.entries(L.x || {})) { if (!e) continue; ops += Math.max(0, fenceN(e.od) || 0); expo += Math.max(0, fenceN(e.a) || 0); if (k === skipKey) continue; const t = fenceT(e, L), h = fenceRD(e); done += t; held += h; if (t > 0 || h > 0) n++; }
    return { done, held, used: done + held, n, ops, sold: Math.max(0, fenceN(L.sold) || 0), expo, v2: fenceV2(L) }; }
  /* fenceStamp(L) — 원장을 고칠 때 함께 적는 합계 칸(spent · v2 원장은 옛 판이 읽는 done도 같은 값) */
  function fenceStamp(L) { const u = fenceSum(L); return fenceV2(L) ? { spent: u.done, done: u.done, ops: u.ops } : { spent: u.done, ops: u.ops }; }
  /* fenceRoll(prev, day, nowIso) — 새 날 원장(v2): 상품 기록(s·p·a·예약)은 이어 받고 그날 몫(t·od)·쓴 몫은 0부터 · 예약은 끝날 때 오늘 몫으로(안 끝난 예약도 오늘 셈에 듦 — 안전 쪽) */
  function fenceRoll(prev, day, nowIso) { const X = JSON.parse(JSON.stringify((prev && prev.x) || {}));
    for (const e of Object.values(X)) { if (!e) continue; if (e.r && fenceN(e.r.d) == null) e.r.d = fenceRD({ ...e, r: { ...e.r, ops: false } }); if (e.r && fenceN(e.r.from) == null && fenceN(e.p) != null) e.r.from = fenceN(e.p); e.t = 0; e.od = 0; }
    return { v: 2, day, from: (prev && prev.day) || null, done: 0, spent: 0, gone: 0, ops: 0, opsGone: 0, sold: 0, x: X, no: [], at: nowIso || new Date().toISOString() }; }
  /* fenceTry(L, q, lim, nowIso) — 내리기 전 검사 · q = { key, from(지금 값), to(내릴 값), human(정범님 확정 값), start(시작 값 — 원장에 없을 때만), src, by, id(예약 번호), cmd } → { ok, why, e(새 x[key] — 예약), d(이번 몫), need, left, limit, raise } */
  function fenceTry(L, q, lim, nowIso) { L = L || {}; q = q || {}; nowIso = nowIso || new Date().toISOString(); const no = (why, o) => ({ ok: false, why, limit: lim && lim.limit, ...(o || {}) });
    if (!lim || !lim.ok || !(lim.limit > 0)) return no((lim && lim.why) || '하루 손해 한도를 못 받음');
    const from = fenceN(q.from), to = fenceN(q.to); if (!q.key) return no('상품이 없음'); if (to == null || to < 10) return no('내릴 값이 이상함'); if (from == null || from < 10) return no('지금 값을 모름');
    if (to >= from) return { ok: true, raise: true, e: null, limit: lim.limit, why: '내림이 아님(값을 올리거나 그대로) — 검사 없음' };
    const cur = (L.x || {})[q.key] || null; if (cur && cur.r) return no(`같은 상품의 다른 내림(${String(cur.r.at || '').slice(5, 16)})이 아직 끝나지 않음`);
    /* (11/10 fence3 · 정범님 11/09 밤 손해 셈 (나)) 기준 = 정범님(사람)이 마지막으로 확정한 값(q.human — fenceBase) → 엔진이 그보다 더 내린 몫만 손해 · 사람 확정 값이 없으면 원장의 기준 값 → q.start → 지금 값 */
    const hu = fenceN(q.human) > 0 ? fenceN(q.human) : null; const s = hu || (cur && fenceN(cur.s) > 0 ? fenceN(cur.s) : fenceN(q.start) > 0 ? fenceN(q.start) : from); if (!(s > 0)) return no('실험 시작 값을 모름');
    /* (fence5) 이번 몫 = 기준 아래로 새로 내려간 만큼 · 출발 값은 '부른 쪽이 본 지금 값'과 원장의 지금 값 중 높은 쪽(그 사이 다른 길로 내려간 몫까지 엔진 몫으로 — 안전 쪽) */
    const pc = cur && fenceN(cur.p) != null ? fenceN(cur.p) : null; const f0 = pc != null ? Math.max(from, pc) : from; const V2 = fenceV2(L);
    /* 옛 원장(v 없음)은 그날만 예전 셈 그대로(새 상품은 기준 아래 전체 · 사람 확정 값이 바뀐 상품은 그 값 아래 전체) — 안전 쪽 */
    const tCur = cur && fenceN(cur.t) == null && !V2 && hu && hu !== fenceN(cur.s) ? Math.max(0, s - (pc != null ? pc : from)) : fenceT(cur, L); const d = !V2 && !cur ? Math.max(0, s - to) : fenceStep(s, f0, to);
    const o = fenceSum(L, q.key); const need = o.used + tCur + d; const left = lim.limit - need;
    if (need > lim.limit) return no(`오늘 엔진이 내린 ${o.done.toLocaleString()}원 + 진행 중 ${o.held.toLocaleString()}원${tCur ? ` + 이 상품 오늘 ${tCur.toLocaleString()}원` : ''} + 이번 ${d.toLocaleString()}원 = ${need.toLocaleString()}원 > 한도 ${lim.limit.toLocaleString()}원 — 내리지 않음`, { need, left, d });
    const p0 = pc != null ? pc : from; const e = { ...(cur || {}), s, p: p0, a: Math.max(0, s - p0), t: tCur, od: Math.max(0, fenceN(cur && cur.od) || 0), ...(hu ? { base: 'human' } : {}), src: q.src || (cur && cur.src) || null, since: (cur && cur.since) || nowIso, r: { id: String(q.id || nowIso), to, from: f0, d, a: Math.max(0, s - to), at: nowIso, by: q.by || null, cmd: q.cmd || null } };
    return { ok: true, e, d, need, left, limit: lim.limit, why: null }; }
  /* fenceSettle(L, key, rid, ok, price, nowIso) — 예약 끝: ok면 지금 값 = price(알라딘이 받은 값) · 실제로 내려간 몫을 오늘 몫(t — 감시·추격자 예약이면 od)에 더함 · 아니면 예약만 풂 → 새 x[key] 또는 null(그 예약이 아님) */
  function fenceSettle(L, key, rid, ok, price, nowIso) { const cur = ((L || {}).x || {})[key]; if (!cur || !cur.r || String(cur.r.id) !== String(rid)) return null; const p = fenceN(price); const at = nowIso || new Date().toISOString(); const tCur = fenceT(cur, L); const od0 = Math.max(0, fenceN(cur.od) || 0);
    if (ok && p != null) { const s = fenceN(cur.s) || 0; const f0 = fenceN(cur.r.from) != null ? fenceN(cur.r.from) : fenceN(cur.p) != null ? fenceN(cur.p) : p; const d = fenceStep(s, f0, p); /* 알라딘이 다른 값으로 받으면 그 값으로 셈(실제 몫) */
      return { ...cur, p, a: Math.max(0, s - p), t: cur.r.ops ? tCur : tCur + d, od: cur.r.ops ? od0 + d : od0, r: null, at }; }
    return { ...cur, t: tCur, od: od0, r: null, at }; }
  /* fenceNote(L, key, s, price, src, make, nowIso, reset) — 사람이 정한 값이 반영됨(수동 일괄·직접 가격) 또는 값을 올림 → 기록만 새로(검사 없음 · make=false면 원장에 있는 상품만)
   *  (11/10 fence3 · 손해 셈 (나)) reset = 사람이 확정한 값 → 기준(s)을 그 값으로 다시 놓음(사람이 내린 몫은 손해가 아님) · (fence5) 그날 이미 엔진이 내린 몫(t)은 그대로 둠(돌려받지 않음) */
  function fenceNote(L, key, s, price, src, make, nowIso, reset) { const cur = ((L || {}).x || {})[key] || null; if (!cur && !make) return null; const p = fenceN(price); if (p == null) return null; const s0 = reset && fenceN(s) > 0 ? fenceN(s) : cur && fenceN(cur.s) > 0 ? fenceN(cur.s) : fenceN(s); if (!(s0 > 0)) return null;
    return { ...(cur || {}), s: s0, p, a: Math.max(0, s0 - p), t: fenceT(cur, L), od: Math.max(0, fenceN(cur && cur.od) || 0), ...(reset ? { base: 'human', baseAt: nowIso || new Date().toISOString() } : {}), src: (cur && cur.src) || src || null, since: (cur && cur.since) || nowIso || new Date().toISOString(), r: cur ? cur.r || null : null }; }
  /* fenceNoAdd(L, rec) — 막은 기록(최근 noKeep개 · 같은 날 같은 상품·같은 까닭은 횟수만 올림) */
  function fenceNoAdd(L, rec, F0) { const F = { ...FENCE, ...(F0 || {}) }; const L0 = ((L || {}).no || []).slice(); const i = L0.findIndex((x) => x && x.key === rec.key && x.why === rec.why); if (i >= 0) { L0[i] = { ...L0[i], n: (L0[i].n || 1) + 1, at: rec.at }; return L0; } L0.push({ ...rec, n: 1 }); return L0.slice(-F.noKeep); }
  /* ── (11/10 fence3 · 정범님 11/09 밤 '손해가 적용되는 곳을 모두 멈춰 · 손해를 보지 않고 진행할 방법') 무손해 기본 · 사람 확정 값 기준 · 엔진이 안 건드리는 상품 ──
   *  fenceNoLoss(cfg) — app_settings/eng_fence.noLossMode: 없거나 못 읽으면 true(안전 쪽) · false는 정범님이 직접 끌 때만 → true면 연구·엔진 실험(⚡ 전략 실행 · 전체 비율 실험 · 실험 장부)은 값·판매 상태를 바꾸지 않고 관찰만 */
  function fenceNoLoss(cfg) { return !(cfg && cfg.noLossMode === false); }
  const fenceHumanBy = (by) => /@/.test(String(by || '')); /* 사람 = 로그인 메일 (학습 공용 isHumanBy와 같은 규칙 · 감시기 사본에서도 쓰려고 여기 따로) */
  /* fenceRegMs(l, regAt) — 등록 때(ms) · 상품 기록 registeredAt(샵매니저 '등록' 시각 · 한국 시각 꼴 'YYYY-MM-DDTHH:MM' 또는 날짜만) → 등록 기록(regAt) → 처음 본 때(firstSeenAt) · 모르면 null */
  function fenceRegMs(l, regAt) { const P = (v) => { if (!v) return null; let t = String(v).trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t += 'T00:00:00+09:00'; else if (/^\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}(:\d{2})?$/.test(t)) t = t.replace(' ', 'T') + '+09:00'; const ms = Date.parse(t); return Number.isFinite(ms) ? ms : null; };
    l = l || {}; return P(l.registeredAt) ?? P(regAt) ?? P(l.regAt) ?? P(l.firstSeenAt) ?? null; }
  /* fenceLock(l, o) — 연구·엔진(⚡ 전략 실행 · 전체 비율 실험 · 🔬 조회수 실험 새로 붙이기 · 엔진 실험)이 값·상태를 바꾸지 않는 상품(읽기만) → { kind, why, until } 또는 null
   *  (11/10 fence4 · 정범님 11/09 밤 '감시 그룹 자동 반영과 추격자는 내가 결정해서 하는 기능 — 기능을 왜 꺼?') 🛰 감시 그룹 자동 반영·🎯 추격자(정범님 운영 기능)에는 쓰지 않음 — 그 기능은 그룹 설정대로
   *  o = { key, excl(app_settings/eng_excl.m[키]), dec(prd_price_decisions 문서), regAt(등록 기록 때), nowMs, gid(이 감시 그룹 — 같은 그룹의 수동 일괄은 정범님이 엔진에 맡긴 것이라 셈하지 않음), ops(정범님이 손대 진행 중 — { why }), F }
   *  ⓪ (fence4) 정범님이 손대 진행 중인 상품(켜진 🛰 감시 그룹·🎯 추격자 그룹에 듦 — o.ops) ① 등록 90일(3개월) 안 — 정범님 11/09 밤 결정 · 등록 때를 모르면 안전 쪽으로 안 건드림 ② 사람이 손대 실험에서 빠진 상품(eng_excl — 기한 없음, 예전 그대로)
   *  ③ 사람이 14일 안에 손댐(✏ 상품 수정 · 직접 가격 · 다른 그룹의 수동 일괄 — 상품 기록 editBy·결정 approval.by가 메일) */
  function fenceLock(l, o) { o = o || {}; const F = { ...FENCE, ...(o.F || {}) }; const now = o.nowMs || Date.now(); const day = 864e5; const ymd = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
    if (o.ops) return { kind: 'ops', why: `정범님이 손대 진행 중인 상품(${String(o.ops.why || o.ops || '').slice(0, 50)}) — 연구·엔진은 안 건드림`, until: null };
    const reg = fenceRegMs(l, o.regAt); if (reg == null) return { kind: 'new', why: '등록 때를 모름 — 등록 3개월 안일 수 있어 엔진이 안 건드림(안전 쪽)', until: null };
    if (now - reg < F.newDays * day) return { kind: 'new', why: `등록 ${Math.max(0, Math.floor((now - reg) / day))}일 — 등록 3개월(${F.newDays}일) 안이라 엔진이 안 건드림`, until: ymd(reg + F.newDays * day) };
    if (o.excl) return { kind: 'human', why: `사람이 손대 엔진 실험에서 빠진 상품(${String(o.excl.why || '').slice(0, 40)}) — 엔진은 다시 안 건드림`, until: null };
    const hs = []; const t = (v) => { const ms = Date.parse(v || ''); return Number.isFinite(ms) && now - ms < F.humanDays * day && ms <= now + 60e3 ? ms : null; };
    if (l && fenceHumanBy(l.editBy) && t(l.editAt)) hs.push([t(l.editAt), '사람이 상품 정보를 고침(✏ 수정)']);
    const ap = (o.dec && o.dec.approval) || {}; if (fenceHumanBy(ap.by) && t(ap.at) && !(o.gid && ap.decision === 'batch' && String(ap.batchId || '') === String(o.gid))) hs.push([t(ap.at), ap.decision === 'batch' ? '사람이 수동 일괄로 값을 정함' : '사람이 가격을 정함']);
    const hp = o.dec && o.dec.humanPx; if (hp && fenceHumanBy(hp.by) && t(hp.at) && !(o.gid && hp.how === 'batch' && String(hp.gid || '') === String(o.gid))) hs.push([t(hp.at), '사람이 확정한 값이 반영됨']);
    if (hs.length) { hs.sort((a, b) => b[0] - a[0]); return { kind: 'human', why: `${hs[0][1]} — ${F.humanDays}일 동안 엔진이 안 건드림(사람 값이 우선)`, until: ymd(hs[0][0] + F.humanDays * day) }; }
    return null; }
  /* fenceBase(dec, fb) — 손해 셈 기준 (나) = 정범님(사람)이 마지막으로 확정한 값 → { s, human(①~③이면 true — fenceTry q.human으로 넘김), why } 또는 null
   *  ① 결정 문서 humanPx(사람이 정한 값이 알라딘에 들어간 때 감시기가 남김) ② 감시 그룹 humanPrice(수동 일괄 첫 반영 값) ③ 사람이 낸 결정(수동 일괄·직접 가격) ④ 감시 시작 전 값(옛 기록 — 사람이 내린 몫까지 세어 더 많이 셈 · 안전 쪽) ⑤ fb(엔진이 처음 내리기 전 값) */
  function fenceBase(dec, fb) { dec = dec || {}; const w = dec.watch || {}; const ap = dec.approval || {}; const hp = dec.humanPx || null;
    if (hp && fenceN(hp.p) > 0) return { s: fenceN(hp.p), human: true, why: '사람이 마지막으로 확정한 값' }; if (fenceN(w.humanPrice) > 0) return { s: fenceN(w.humanPrice), human: true, why: '감시 그룹에 넣을 때 사람이 확정한 값' };
    if (fenceHumanBy(ap.by) && ['batch', 'manual'].includes(ap.decision) && fenceN(ap.price) > 0) return { s: fenceN(ap.price), human: true, why: '사람이 정한 결정 값' };
    if (fenceN(w.startPrice) > 0) return { s: fenceN(w.startPrice), why: '사람 확정 값 기록이 없어 감시 시작 전 값(더 많이 셈 — 안전 쪽)' }; const f = fenceN(fb); return f > 0 ? { s: f, why: '사람 확정 값이 없어 엔진이 처음 내리기 전 값' } : null; }
  /* (11/10 fence4 · 정범님 11/09 밤 '비용이 드는 연구는 반드시 내 허락을 받은 뒤에만 — 철저히 단속') 💸 비용 드는 연구 허락
   *  fenceCostOk(rec, q) — rec = app_settings/research_cost_ok(웹앱 ⚡ 전략 화면에서 정범님이 두 번 누르기로만 만듦 · 기본 없음) · q = { what('strat' ⚡ 전략 실행 · 'ro' 전체 비율 실험), nowMs }
   *   → { ok, limit(허락한 하루 한도 원), why } — 기록이 없거나·꺼짐·사람 메일이 아님·두 번 누르기로 만든 것이 아님·기한이 지남·대상이 아님·한도가 없으면 막음('💸 정범님 허락 필요') */
  function fenceCostOk(rec, q) { q = q || {}; const now = q.nowMs || Date.now(); const no = (why) => ({ ok: false, limit: 0, why: '💸 정범님 허락 필요 — ' + why });
    if (!rec || rec.on !== true) return no('비용 드는 연구(값 내리기·판매 상태 바꾸기) 허락 기록이 없음');
    if (!fenceHumanBy(rec.by)) return no('허락한 사람이 로그인 메일이 아님'); if (rec.via !== 'twice') return no('웹앱 두 번 누르기로 만든 허락이 아님');
    const at = Date.parse(rec.at || ''); if (!Number.isFinite(at) || at > now + 60e3) return no('허락한 때를 모름');
    let u = String(rec.until || '').trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(u)) u += 'T23:59:59+09:00'; const until = Date.parse(u); if (!Number.isFinite(until)) return no('허락 끝나는 날을 모름'); if (now > until) return no(`허락 기한(${String(rec.until).slice(0, 10)})이 지남`);
    const what = (Array.isArray(rec.what) ? rec.what : [rec.what]).map(String); if (!q.what || !what.includes(String(q.what))) return no(`허락 대상이 아님(${q.what || '모름'} — 허락: ${what.join('·') || '없음'})`);
    const lim = fenceN(rec.limit); if (!(lim > 0)) return no('허락 한도가 없음'); return { ok: true, limit: lim, why: null, by: rec.by, until: rec.until }; }
  /* FENCE-PURE-END */
  /* (11/10 fence2) 🧪 하루 손해 울타리 — 감시기가 실험 상품 값을 내리기 전에(🛰 감시 그룹 자동 반영 · 전체 비율 실험 적용 묶음) 원장 eng_fence_ledger/{한국 날짜}에 트랜잭션으로 예약
   *  한도는 클라우드가 준 app_settings/eng_fence_now만 — 못 받거나 36시간 넘으면 내리지 않음 · 원장을 못 쓰면 내리지 않음(실패 때 안전 쪽) · 셈은 위 FENCE-PURE(학습 공용과 같은 글자) */
  async function fenceRun(mode, q) { const nowMs = Date.now(); const nowI = new Date(nowMs).toISOString(); const day = kst(nowMs).slice(0, 10); const LC = C('eng_fence_ledger'); const ref = LC.doc(day), head = LC.doc('_head'), nwRef = C('app_settings').doc('eng_fence_now'); let out = null;
    await db.runTransaction(async (tx) => { out = null; const sn = await tx.get(ref); const nw = (await tx.get(nwRef)).data() || null; let L = sn.exists ? sn.data() : null; let mk = false;
      if (!L) { const h = (await tx.get(head)).data() || {}; const prev = h.day && h.day < day ? (await tx.get(LC.doc(h.day))).data() || null : null; L = fenceRoll(prev, day, nowI); mk = true; }
      const lim0 = fenceLimitOf(nw, nowMs); const lim = lim0.ok && q && q.cap > 0 && q.cap < lim0.limit ? { ...lim0, limit: q.cap, why: `정범님 허락 한도 ${(+q.cap).toLocaleString()}원` } : lim0; const patch = { ...(mk ? L : {}), day, limit: lim0.ok ? lim0.limit : null, limitWhy: lim0.why || null, at: nowI, ...W() }; /* (11/10 fence4) cap = 💸 정범님 허락 한도(하루 손해 한도보다 작으면 그것) · 원장 limit 칸은 예전 그대로 */
      if (mode === 'rec') { const r0 = fenceTry(L, q, { ok: true, limit: Number.MAX_SAFE_INTEGER }, nowI); out = { ok: true, rec: true, e: r0 && r0.e ? { ...r0.e, ops: true, r: { ...r0.e.r, ops: true } } : null }; if (out.e) patch.x = { ...(mk ? L.x : {}), [q.key]: out.e }; else if (!mk) return; } /* (11/10 fence4) 🛰 감시 자동 반영·🎯 추격자 = 정범님 운영 기능 → 한도로 막지 않고 얼마 내렸는지만 원장에(ops 표시) · (fence5) 그 몫은 od·ops 칸에 따로 — 연구 하루 한도 셈에는 넣지 않음(정범님 운영 기능 · 기록 분리) */
      else if (mode === 'no') { patch.no = fenceNoAdd(L, { at: nowI, key: q.key, src: q.src || null, by: q.by || null, from: q.from ?? null, to: q.to ?? null, why: String(q.why || '').slice(0, 200) }); out = { ok: true }; } /* (fence4) 💸 허락 없어 막은 기록 */
      else if (mode === 'try') { out = fenceTry(L, q, lim, nowI); if (!out.ok) patch.no = fenceNoAdd(L, { at: nowI, key: q.key, src: q.src || null, by: q.by || null, from: q.from ?? null, to: q.to ?? null, why: String(out.why || '').slice(0, 200) }); else if (out.e) patch.x = { ...(mk ? L.x : {}), [q.key]: out.e }; }
      else if (mode === 'settle') { const e = fenceSettle(L, q.key, q.id, !!q.ok, q.price, nowI); out = { ok: !!e }; if (e) patch.x = { ...(mk ? L.x : {}), [q.key]: e }; }
      else if (mode === 'note') { const e = fenceNote(L, q.key, q.start, q.price, q.src, !!q.make, nowI, !!q.reset); out = { ok: !!e }; if (e) patch.x = { ...(mk ? L.x : {}), [q.key]: e }; else if (!mk) return; }
      Object.assign(patch, fenceStamp({ ...L, x: { ...(L.x || {}), ...(patch.x || {}) } })); /* (fence5) 합계 칸(spent · v2 원장은 옛 판이 읽는 done도) — 같은 트랜잭션 안에서 */
      tx.set(ref, patch, { merge: true }); if (mk) tx.set(head, { day, at: nowI }, { merge: true }); });
    return out; }
  /* 사람이 손대 엔진 실험에서 빠진 상품(app_settings/eng_excl — 클라우드 engExpTick이 적음) · 5분 기억 · 못 읽으면 null(→ 실험 길 내림은 안 함) */
  let ENGEX = null, ENGEXAt = 0; async function engExcl(force) { if (!force && ENGEX && Date.now() - ENGEXAt < 5 * 60000) return ENGEX; try { const d = await C('app_settings').doc('eng_excl').get(); ENGEX = ((d.exists && d.data()) || {}).m || {}; ENGEXAt = Date.now(); return ENGEX; } catch (e) { return null; } }
  /* (11/10 fence3) 무손해 설정(app_settings/eng_fence — noLossMode 등) · 5분 기억 · 못 읽으면 null(→ fenceNoLoss(null) = 켜짐 · 안전 쪽) */
  /* (sv1 11/10) 🧭 판매자 가치 엔진 근거(매일 엔진 한 걸음이 쓴 app_settings/peer_ev.ev = { 판매자 번호: { grp, sold, passed } }) — 판정은 그대로, 그림자 판정(peerShadow)에만 씀 · 6시간 기억 · 없으면 근거 없이 */
  let PEV = null, PEVAt = 0; async function peerEv() { if (PEVAt && Date.now() - PEVAt < 6 * 3600e3) return PEV; PEVAt = Date.now(); try { const d = await C('app_settings').doc('peer_ev').get(); PEV = (d.exists && d.data() && d.data().ev) || null; } catch (e) { PEV = null; } return PEV; }
  let ENGF = null, ENGFAt = 0; async function engFence(force) { if (!force && ENGFAt && Date.now() - ENGFAt < 5 * 60000) return ENGF; try { const d = await C('app_settings').doc('eng_fence').get(); ENGF = (d.exists && d.data()) || {}; ENGFAt = Date.now(); return ENGF; } catch (e) { return null; } }
  /* (11/10 fence4) 💸 비용 드는 연구 허락(app_settings/research_cost_ok — 정범님이 웹앱에서 두 번 누르기로만 만듦) · 기억 없이 늘 새로 읽음 · 못 읽으면 null(→ 허락 없음 · 안전 쪽) */
  async function costOkRec() { try { const d = await C('app_settings').doc('research_cost_ok').get(); return d.exists ? d.data() || null : null; } catch (e) { return null; } }
  const sameApproval = (a, b) => JSON.stringify([a && a.at, a && a.price, a && a.decision, a && a.batchId]) === JSON.stringify([b && b.at, b && b.price, b && b.decision, b && b.batchId]);
  async function claim(ref, x, kind) { let ok = false; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data(); if (!v || v.approvalState !== kind || !sameApproval(v.approval, x.approval)) return;
    const a = v.approval || {}; if (a.decision === 'batch' && a.batchId) { const cfg = (await tx.get(SREF)).data() || {}; if ((cfg.batchOff || {})[a.batchId] || cfg.killSwitch) return; } // (0.6.0) 그룹 끄기·전체 정지를 맡는 순간에 다시 확인 (트랜잭션 — 그 사이 꺼졌으면 맡지 않음)
    tx.update(ref, { approvalState: 'applying', applyingAt: new Date().toISOString(), applyingBy: `${PC}:${TAB}`, applyingFrom: kind }); ok = true; }); return ok; }
  /* (0.9.1) 반영하면 상품 기록(prd_listings)의 지금 값도 같이 바꾸고 변화 기록(prd_listing_changes, source 'price-watch')을 남김 — 같은 트랜잭션.
     예전엔 반영 기록(prd_price_actions)에만 있어, 수집기가 그 상품을 다시 읽기 전까지 웹앱 상품 기록의 가격이 옛 값이고 상품 상세 '변경 이력'에도 없었음.
     수집기가 나중에 다시 읽으면 값이 같으므로 이력이 겹치지 않음 */
  function listingSync(tx, lref, ls, a, aid) { if (!lref || !ls || !ls.exists) return; const cur = ls.data() || {}; const ch = {}, up = {};
    const isPrice = a.to != null && a.kind !== 'hold' && a.kind !== 'unhold'; if (isPrice && Number(a.to) !== Number(cur.price)) { ch.price = { from: cur.price ?? a.from ?? null, to: a.to }; up.price = a.to; }
    if (a.toSku && a.toSku !== cur.sku) { ch.sku = { from: cur.sku ?? null, to: a.toSku }; up.sku = a.toSku; } if (a.toStatus && a.toStatus !== cur.status) { ch.status = { from: cur.status ?? null, to: a.toStatus }; up.status = a.toStatus; }
    if (!Object.keys(ch).length) return; const now = new Date().toISOString();
    tx.set(lref, { ...up, watchSyncAt: now, watchSyncAction: aid, editAt: now, editBy: 'price-watch:' + (a.kind || 'set'), ...W() }, { merge: true }); /* (10/30 위험 7) editAt·editBy = 사람·관리자 결정이 반영됨 → ⚡ 전략(ml-core stratGuard)이 48시간 손대지 않음(예전엔 watchSyncAt만 써서 반영 직후 전략이 다시 바꿈) */
    tx.set(C('prd_listing_changes').doc(), { listingKey: a.key, at: a.at || now, source: 'price-watch', actionId: aid, kind: a.kind || null, batchId: a.batchId || null, batchName: a.batchName || null, changes: ch, ...W() }); }
  async function settle(ref, x, patch, actionDoc) { let wrote = false; const aref = actionDoc ? C('prd_price_actions').doc() : null; settle.last = aref; const lref = actionDoc && actionDoc.key ? C('prd_listings').doc(actionDoc.key) : null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const ls = lref ? await tx.get(lref) : null; const v = sn.data() || {}; if (actionDoc) { tx.set(aref, actionDoc); listingSync(tx, lref, ls, actionDoc, aref.id); } if (v.approvalState === 'applying' && v.applyingBy === `${PC}:${TAB}` && sameApproval(v.approval, x.approval)) { tx.set(ref, patch, { merge: true }); wrote = true; } else tx.set(ref, { lastExecAt: patch.executedAt || new Date().toISOString(), lastExecNote: (patch.execNote || '') + ' (그 사이 결정이 바뀌어 상태는 그대로 둠)' }, { merge: true }); }); return wrote; }
  /* (0.9.1) 한 번만: 0.9.0까지 반영한 것 중 상품 기록에 아직 안 들어간 것을 채움 — 반영 시각이 수집기가 그 상품을 마지막으로 본 때보다 뒤인 것만(그 뒤 수집기가 다시 읽은 것은 수집기 값이 맞음).
     가격은 가장 마지막 반영 값으로, 변화 기록은 반영마다 한 줄(backfill 표시). 한 PC만 함(트랜잭션으로 잡음), 끝나면 prd_system/pricing.listingSync */
  async function listingBackfill() { const VERK = '0.9.1'; let mine = false;
    try { await db.runTransaction(async (tx) => { const d = await tx.get(SREF); const ls = (d.data() || {}).listingSync || {}; if (ls.ver === VERK && (ls.state === 'done' || (ls.state === 'running' && Date.now() - Date.parse(ls.at || 0) < 30 * 60000))) return; tx.set(SREF, { listingSync: { ver: VERK, state: 'running', by: PC, at: new Date().toISOString() } }, { merge: true }); mine = true; }); } catch (e) { return; }
    if (!mine) return; log('상품 기록에 지난 가격 반영 채우는 중 (한 번만)');
    try { const acts = []; (await C('prd_price_actions').get()).forEach((d) => { const a = d.data(); if (a && a.key && a.at && (a.to != null || a.toSku || a.toStatus)) acts.push({ id: d.id, ...a }); }); acts.sort((p, q) => String(p.at).localeCompare(String(q.at)));
      const byKey = new Map(); acts.forEach((a) => (byKey.get(a.key) || byKey.set(a.key, []).get(a.key)).push(a)); let nL = 0, nC = 0; let b = db.batch(), ops = 0; const flush = async () => { if (ops) { await b.commit(); b = db.batch(); ops = 0; } };
      const keys = [...byKey.keys()]; for (let i = 0; i < keys.length; i += 200) { const part = keys.slice(i, i + 200); const docs = await Promise.all(part.map((k) => C('prd_listings').doc(k).get()));
        for (let j = 0; j < part.length; j++) { const ld = docs[j]; if (!ld.exists) continue; const L = ld.data() || {}; const seen = String(L.lastSeenAt || ''); const later = byKey.get(part[j]).filter((a) => String(a.at) > seen); if (!later.length) continue;
          let price = L.price, sku = L.sku, status = L.status; const up = {};
          for (const a of later) { const ch = {}; const isPrice = a.to != null && a.kind !== 'hold' && a.kind !== 'unhold'; if (isPrice && Number(a.to) !== Number(price)) { ch.price = { from: price ?? a.from ?? null, to: a.to }; price = a.to; up.price = a.to; }
            if (a.toSku && a.toSku !== sku) { ch.sku = { from: sku ?? null, to: a.toSku }; sku = a.toSku; up.sku = a.toSku; } if (a.toStatus && a.toStatus !== status) { ch.status = { from: status ?? null, to: a.toStatus }; status = a.toStatus; up.status = a.toStatus; }
            if (Object.keys(ch).length) { b.set(C('prd_listing_changes').doc(), { listingKey: part[j], at: a.at, source: 'price-watch', backfill: true, actionId: a.id, kind: a.kind || null, batchId: a.batchId || null, batchName: a.batchName || null, changes: ch, ...W() }); ops++; nC++; } }
          if (Object.keys(up).length) { b.set(C('prd_listings').doc(part[j]), { ...up, watchSyncAt: new Date().toISOString(), watchSyncAction: later[later.length - 1].id, ...W() }, { merge: true }); ops++; nL++; }
          if (ops >= 400) await flush(); } await flush(); }
      await SREF.set({ listingSync: { ver: VERK, state: 'done', by: PC, at: new Date().toISOString(), listings: nL, changes: nC } }, { merge: true }); log(`상품 기록 채움: 상품 ${nL}개 · 변화 기록 ${nC}줄`); }
    catch (e) { log('상품 기록 채우기 실패(다음 시작 때 다시): ' + e.message, 1); try { await SREF.set({ listingSync: { ver: VERK, state: 'error', by: PC, at: new Date().toISOString(), err: e.message } }, { merge: true }); } catch (er) {} } }
  async function unstick() { try { const q = await C('prd_price_decisions').where('approvalState', '==', 'applying').get(); for (const d of q.docs) { const v = d.data(); if (Date.now() - Date.parse(v.applyingAt || 0) < 10 * 60000) continue;
      await d.ref.set({ approvalState: 'blocked', execNote: `반영 중 멈춤(${v.applyingBy || '?'}, ${String(v.applyingAt || '').slice(5, 16).replace('T', ' ')}) — 알라딘에 들어갔는지 모름: 샵매니저에서 가격 확인 후 다시 결정`, execFailAt: new Date().toISOString(), ...W() }, { merge: true }); log(`반영 중 멈춘 결정을 막힘으로: ${v.title || v.usedCode}`, 1); } } catch (e) {} }
  /* (0.10.0) 실행도구의 한 문 (readnow-exec-core.js): 가격·판매보류 반영 전에 exec_log에 '시작'을 적고 — 같은 결정이 이미 끝났거나 다른 곳이 하는 중이면 보내지 않음 — 끝나면 결과를 적음 */
  const EXW = () => window.ReadnowExec || globalThis.ReadnowExec;
  async function xBegin(kind, key, detail) { const X = EXW(); if (!X) return { ok: true, none: true }; try { return await X.begin(db, { kind, key, by: PC, detail }); } catch (e) { log(`⚠ 실행 기록을 못 적음 — ${e.code || e.message}${/permission/i.test(e.code || e.message) ? ' (Firestore 규칙에 exec_log 허용 필요)' : ''} · 반영은 예전처럼 하고 기록만 빠짐`, 1); return { ok: true, none: true }; } }
  const xEnd = (o, status, msg) => { const X = EXW(); if (!X || !o || o.none) return Promise.resolve(); return X.finish(db, { kind: o.kind, key: o.key }, status, { msg }).catch(() => {}); };
  let apMore = false, apWant = false; /* (0.10.75 정범님 I-1120-0937-10 「샵매니저 반영의 모든 작업을 최우선 · 공개 반영 확인 같은 덜 중요한 것은 그 순간 자리를 내어줌」) apWant = 새 확정이 들어옴(실시간 듣기) → 확인·판정 바퀴가 그 자리에서 비킴 */ /* (0.10.74) apMore = 반영 대기가 한 번에 다 못 할 만큼 남음 → 판정 바퀴가 상품 하나마다 반영부터(사람이 확정한 값이 먼저) */
  /* (0.10.76 정범님 I-1120-1027-15) 🚀 샵매니저 반영 속도 — prd_system/pricing.applySpeed(1~4 · 없거나 이상하면 2 = 추천) · 감시 설정(SET)은 실시간이라 다음 바퀴부터 바로 · 근거: 2배 = 정범님 지시 · 4배 상한은 근거 없음(알라딘 요청 간격 조절이 따로 지키므로 넉넉히 잡은 값) */
  const APPLY_SPEED_DEF = 2, APPLY_SPEED_MAX = 4; const applyLanes = () => { const v = Math.round(+((SET || {}).applySpeed)); return Number.isFinite(v) && v >= 1 ? Math.min(APPLY_SPEED_MAX, v) : APPLY_SPEED_DEF; };
  /* (0.10.77 정범님 I-1120-1055-16) 🚀 샵매니저 반영 실제 시간 — 한 바퀴(가격 2건 이상)마다: (걸린 시간 − 멈춘 시간) ÷ 반영한 가격 수
   *  멈춘 시간 = 알라딘 간격 장치가 5초 넘게 세운 때(429 물러남·점검 쉼 · 여러 줄이 겹치면 한 번만) + 엔진 자동 반영 사이 일부러 쉰 때(줄 수로 나눔) · 멈춤(전체 정지·로그인 풀림) 뒤는 바퀴가 끝나 안 셈
   *  app_settings/px_apply_spd 한곳 · 마지막 30바퀴 · 웹앱 가격 감시 카드 「🚀 샵매니저 반영 속도」 칸이 보임 */
  const apSpdHeld = (hold) => { const H = (hold || []).slice().sort((p, q) => p[0] - q[0]); let sum = 0, e = -1; for (const [a, b] of H) { if (a > e) { sum += b - a; e = b; } else if (b > e) { sum += b - e; e = b; } } return sum; };
  const apSpdAdd = (o, r) => { const R = ((o && o.rounds) || []).concat([r]).slice(-30); const by = {}; let nT = 0, sT = 0, hT = 0; for (const x of R) { const k = String(x.lanes || 1); by[k] = by[k] || { n: 0, sec: 0 }; by[k].n += x.n; by[k].sec += x.sec * x.n; nT += x.n; sT += x.sec * x.n; hT += x.heldSec || 0; } Object.keys(by).forEach((k) => { by[k].sec = Math.round((by[k].sec / by[k].n) * 10) / 10; }); return { rounds: R, avgSec: nT ? Math.round((sT / nT) * 10) / 10 : null, n: nT, heldSec: Math.round(hT), byLanes: by }; };
  async function apSpdW(S, lanes) { if (!S || S.n < 2) return; const now = Date.now(); const wall = now - S.t0; const held = Math.min(wall, apSpdHeld(S.hold) + S.auto / Math.max(1, lanes)); const r = { at: new Date(now).toISOString(), pc: PC || null, lanes, n: S.n, sec: Math.round(((wall - held) / 1000 / S.n) * 10) / 10, wallSec: Math.round(wall / 1000), heldSec: Math.round(held / 1000) };
    const ref = C('app_settings').doc('px_apply_spd'); await db.runTransaction(async (tx) => { const s0 = await tx.get(ref); const o = s0.exists ? s0.data() || {} : {}; tx.set(ref, { ...apSpdAdd(o, r), at: r.at, by: 'price-watch:' + PC, ...W() }); }); log(`🚀 반영 ${r.n}건 · 한 권 ${r.sec}초(멈춘 ${r.heldSec}초 뺌 · ${lanes}줄)`); }
  async function executeApproved() {
    await unstick();
    const st = ['approved', 'manual', 'hold', 'unhold']; const docs = [];
    { const Q = await Promise.all(st.map((k) => C('prd_price_decisions').where('approvalState', '==', k).get())); Q.forEach((q) => q.docs.forEach((d) => docs.push(d))); } /* (11/20 ctrlopt1) 네 갈래 읽기를 함께(예전엔 하나씩 차례 — 2408건 대기면 바퀴(200건)마다 큰 읽기 넷을 차례로 기다림) · 순서는 예전과 같음(approved→manual→hold→unhold) · 하나라도 못 읽으면 예전처럼 바퀴 오류 */
    apMore = false; apWant = false; if (!docs.length) return; log(`반영할 관리자 결정 ${docs.length}건`);
    const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); let n = 0; // (0.10.19) 정범님 10/26: 한국 날짜(예전 UTC — 같은 문서 kst와 달랐음) // (0.6.0) 하루 반영 상한 없음 — 확정한 것은 모두 차례로 (정범 결정 2026-10-07)
    const offOf = (x) => { const a = x.approval || {}; return a.decision === 'batch' && a.batchId && (SET.batchOff || {})[a.batchId]; }; // (0.6.0) 꺼진 수동 일괄 그룹: 그 그룹이 확정한 것은 건드리지 않고 기다림 (설정은 실시간 — 도는 중에 꺼도 다음 상품부터)
    let offN = 0, pxN = 0;
    const post = async (url, body) => { await apPace(); return fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, body }); };
    let nDone = 0; const APX = { halt: false, lanes: applyLanes() }; /* (0.10.76 정범님 I-1120-1027-15 「확정건 반영 시간을 두 배로 빨리 · 내가 언제든 고치게 · 추천 속도 표시」) 반영 줄 수 = 웹앱 가격 감시 카드 「🚀 샵매니저 반영 속도」(prd_system/pricing.applySpeed · 1~4배 · 기본·추천 2배)
     *  한 권에 13~15초(11/20 10:2x HOME 기록) 중 알라딘 요청은 약 1초 · 나머지는 차례로 하는 Firestore 확인·기록 → 같은 상품이 아닌 책을 N줄이 함께 처리(같은 상품은 한 줄에서 차례로) · 알라딘으로 가는 요청 간격 조절(PACE · 429 물러남·쉼)은 그대로 하나로 묶임 */
    const SPD = { t0: Date.now(), n: 0, hold: [], auto: 0 }; const apPace = async () => { const t = Date.now(); await PACE.wait(sleep, 1, true); if (Date.now() - t > 5000) SPD.hold.push([t, Date.now()]); }; /* (0.10.77 I-1120-1055-16) 반영 시간 재기 — 알라딘 간격 장치가 5초 넘게 세운 때(429 물러남·쉼)는 멈춘 시간으로 따로 셈 */
    /* (0.10.78 정범님 I-1120-1316-22 「또 멈췄어」) 11/20 12:33~ HOME: 바퀴마다 「반영할 관리자 결정 2408건」만 찍고 한 건도 안 보낸 채 소리 없이 끝남(멈춘 까닭을 안 적는 길이 하나 — 상품마다 맨 앞 '멈춤·전체 정지·이 탭 아님' 검사) → ① 그 검사에 걸리면 설정을 한 번 새로 읽어 다시 보고, 정말이면 까닭(값까지)을 적고 멈춤 ② 한 건에서 오류가 나거나 3분 넘게 안 끝나면 그 건만 적고 다음 건으로(바퀴 전체를 세우지 않음) ③ 바퀴마다 끝에 한 줄 요약(맡은·반영·미룸·꺼진 그룹·오류·멈춘 까닭·걸린 시간) */
    let haltWhy = '', errN = 0, toN = 0, okChk = 0;
    const apWhy = () => stop ? '멈춤 표시(stop)' : SET.killSwitch ? '전체 정지' : !isMine() ? `이 탭이 감시 탭이 아님(설정 ${SET.watchPc || '?'}/${String(SET.watchTab || '?').slice(0, 8)} · 이 탭 ${PC || '?'}/${String(TAB || '?').slice(0, 8)})` : '';
    const apOk = async () => { if (APX.halt) return false; if (okChk < 3) { okChk++; try { await loadSet(); } catch (e) {} if (!SET.killSwitch && isMine()) { if (stop && !running) stop = false; if (!stop) return true; } } haltWhy = haltWhy || apWhy() || '모름'; APX.halt = true; return false; };
    const AP_ONE_MS = 3 * 60000; const apOne = async (d0) => { let tm = null; const t0 = Date.now(); try { const r = await Promise.race([one(d0).then(() => 'ok'), new Promise((res) => { tm = setTimeout(() => res('to'), AP_ONE_MS); })]); if (r === 'to') { toN++; log(`반영 한 건이 3분 넘게 안 끝나 다음 건으로: ${((d0.data() || {}).title || d0.id)} (10분 뒤 '막힘 — 확인'으로 표시될 수 있음)`, 1); } } catch (e) { errN++; log(`반영 중 오류(이 건만 건너뜀): ${((d0.data() || {}).title || d0.id)} — ${e && (e.code || e.message) || e}`, 1); } finally { clearTimeout(tm); } void t0; };
    const lanesQ = []; { const byK = new Map(); for (const d0 of docs) { const k0 = (d0.data() || {}).key || d0.id; if (!byK.has(k0)) { byK.set(k0, []); lanesQ.push(byK.get(k0)); } byK.get(k0).push(d0); } }
    const one = async (d0) => { /* (10/30 위험 10) 큰 일괄 확정이 감시 판정·추격자 다시 보기를 몇 시간 세우지 않게 */
      if (stop || SET.killSwitch || !isMine()) { if (!(await apOk())) return; } const x = d0.data(); const kind = x.approvalState; const now = new Date().toISOString(); const d = d0;
      let xo = null; // 이 결정의 실행 기록 (열려 있으면 실패 때 '실패'로 닫음)
      const xGate = async (kind2) => { const key = `${x.key}@${(x.approval && x.approval.at) || x.at || ''}`; const g = await xBegin(kind2, key, { listingId: x.listingId || null, title: x.title || null, price: (x.approval && x.approval.price) ?? null, decision: (x.approval && x.approval.decision) || kind });
        if (!g.ok) { await d.ref.set({ approvalState: g.state === 'done' ? 'done' : 'blocked', execNote: `실행 문: ${g.why}`, ...W() }, { merge: true }); log(`보내지 않음(실행 문): ${x.title || x.usedCode} — ${g.why}`, 1); return false; } xo = { kind: kind2, key, none: !!g.none }; return true; };
      const fail = async (msg, block) => { if (xo) { await xEnd(xo, 'failed', msg); xo = null; } const tries = (x.execTries || 0) + 1; if (!block && tries >= 3 && !/로그인/.test(msg)) { block = true; msg += ' (세 번 실패 — 더 보내지 않음)'; } await d.ref.set({ ...(block ? { approvalState: 'blocked' } : { approvalState: kind }), execTries: tries, execNote: `반영 ${block ? '안 함' : '실패'}: ${msg}`, execFailAt: now, ...W() }, { merge: true }); log(`반영 ${block ? '안 함' : '실패'}: ${x.title || x.usedCode} — ${msg}`, 1); };
      if (offOf(x)) { offN++; return; } /* ⏳ 가격 잠금(I-1120-0948-11) — 맡기 전에 봄 · 잠겼으면 미룸(실패 아님 · 세 번 실패에 안 셈 · 200건 몫에도 안 셈 — 맨 먼저 반영할 다른 상품을 굶기지 않음) · 미룬 때(pxWait)를 적어 다음 바퀴엔 읽지 않고 넘김 · 엔진 승인은 잠금 끝난 뒤 48시간이 지났으면 아래에서 다시 판정 */ if ((kind === 'approved' || kind === 'manual') && x.key) { const apAt = (x.approval && x.approval.at) || x.at || null; const w0 = x.pxWait; const fr0 = PXLC && PXLC.fr; if (w0 && w0.apAt === apAt && Date.parse(w0.until) > Date.now() && !(fr0 && fr0.at && String(fr0.at) > String(w0.since))) { pxN++; nDone--; return; } const P1 = await pxlReadW(x); if (P1.lock) { pxN++; nDone--; try { await d.ref.set({ pxWait: { apAt, since: now, until: P1.until, rule: P1.rule, note: pxlNote(P1), held: pxlHeld(w0, apAt, Date.now()) }, execNote: pxlNote(P1), ...W() }, { merge: true }); } catch (e) {} return; } }
      /* (11/20 ctrlopt1 · 정범님 I-1120-1359 「속도를 늘려」) 맡기(트랜잭션)와 함께 읽기만 하는 두 가지를 먼저 띄움 — 🔒 잠금(plkReadW · 문서 1 + 상품 번호 찾기 1)·관리자 직접 가격의 상품 기록(prd_listings) · 예전엔 맡은 뒤 하나씩 차례로 기다려 한 권에 Firestore 왕복 2~3번 더 · 판단·순서는 그대로(맡은 뒤에 결과를 봄 · 못 읽으면 예전처럼 안전 쪽) */
      const lkP = x.listingId && x.group !== 'control' ? plkReadW(x) : null; const lsP = kind === 'manual' && x.key ? C('prd_listings').doc(x.key).get() : null; if (lsP) lsP.catch(() => {});
      let got = false; try { got = await claim(d.ref, x, kind); } catch (e) { log('맡기 실패: ' + e.message, 1); return; } if (!got) { log(`그 사이 결정이 바뀌어 건너뜀: ${x.title || x.usedCode}`); return; }
      // ↓ 맡은(반영 중) 뒤에 확인 — 확인하다 막을 때도 그 사이 바뀐 다른 결정을 덮지 않음
      if (!x.listingId) { await d.ref.set({ approvalState: 'blocked', execNote: '샵매니저 상품번호(ItemId)가 없음', ...W() }, { merge: true }); return; }
      if (x.group === 'control') { await d.ref.set({ approvalState: 'blocked', execNote: '비교 묶음은 바꾸지 않음(효과 측정용)', ...W() }, { merge: true }); return; }
      const lkW = await (lkP || plkReadW(x)); { const lk = lkW; if (lk === undefined || plkBlock(lk, [kind === 'hold' || kind === 'unhold' ? 'code' : 'price']).drop.length) { await d.ref.set({ approvalState: 'blocked', execNote: lk === undefined ? '🔒 잠금 상태를 못 읽어 건너뜀(안전 쪽) — 다시 결정하면 다시 봄' : '🔒 잠금이라 건너뜀 (잠긴 상품은 판매 상태 말고는 바꾸지 않음 · 판매보류풀 포함)', ...W() }, { merge: true }); log(`🔒 잠김 — 건너뜀: ${x.title || x.usedCode}`); return; } } /* (0.10.54 plock1) 판매가·관리코드(보류풀) 모두 — 맡은 뒤 바로 읽음 */
      if (kind === 'approved') { // 엔진 제안 승인: 옛 엔진·오래된 판정이면 반영하지 않음 (관리자가 직접 정한 가격·보류풀은 그대로 반영)
        if (x.engine !== PR.VERSION) { await d.ref.set({ approvalState: 'stale', execNote: `옛 판정 엔진(${x.engine || '?'})의 제안 — 새 판정 후 다시 결정`, ...W() }, { merge: true }); return; }
        if (Date.now() - Date.parse(x.at) > 48 * 3600e3) { await d.ref.set({ approvalState: 'stale', execNote: '판정이 48시간 넘게 지남 — 다시 판정 후 결정', ...W() }, { merge: true }); return; }
        if (PR.isExcluded({ sku: x.sku }, engineSettings())) { await d.ref.set({ approvalState: 'blocked', execNote: `${x.sku}: 자동 감시 제외 코드 — 직접 가격으로 결정하세요`, ...W() }, { merge: true }); return; }
        const apA = x.approval || {}; if (apA.decision === 'auto') { const gA = (await wgLoad()).get(apA.gid); if (gA && wgDry(gA.watch)) { await d.ref.set({ approvalState: null, approval: null, execNote: '🌓 셈만 그룹 — 값을 바꾸지 않음(그룹 전략 창 「셈만 끝내기」+「적용」 뒤에만 실제 반영)', dry: { at: now, gid: apA.gid || null, mode: 'dry', from: apA.expectPrice ?? null, to: apA.price ?? null, would: 'auto', why: ['반영 길 지킴'] }, ...W() }, { merge: true }); log(`🌓 셈만 그룹이라 반영 안 함: ${x.title || x.usedCode}`); return; } /* (0.10.69 strat5) 마지막 지킴 — 셈만 그룹의 자동 승인은 어떤 길로 들어와도 보내지 않음(결정 대기도 만들지 않음) */ if (!gA || gA.watch.apply !== 'auto') { await d.ref.set({ approvalState: 'pending', approval: null, execNote: '자동 반영이 꺼진 그룹 — 결정 대기로', ...W() }, { merge: true }); return; } // (0.8.0) 판정 뒤 그룹의 자동 반영을 껐으면 반영하지 않음
          try { const L0 = (await C('prd_listings').doc(x.key).get()).data(); const seenA = !!(L0 && [L0.lastSeenAt, L0.editAt, L0.watchSyncAt].some((t) => t && String(t) > String(apA.at))); /* (0.10.31 🔬 정밀 점검 11/02 월 💸 연계 위험) 자동 반영도 manual 길과 같이 웹앱 ✏ 손 수정·전략(editAt)·다른 반영(watchSyncAt)을 봄 — 예전엔 수집기가 다시 본 것(lastSeenAt)만 봐서 판정과 반영 사이(1분 넘게)에 사람이 바꾼 값을 엔진 값으로 덮을 수 있었음 */ if (seenA && apA.expectPrice != null && L0.price != null && +L0.price !== +apA.expectPrice && +L0.price !== +apA.price) { await fail(`판정 뒤 다른 곳에서 가격이 바뀜 (판정 때 ${(+apA.expectPrice).toLocaleString()} → 지금 ${(+L0.price).toLocaleString()})`, true); return; } if (seenA && L0.status && L0.status !== '판매중') { await fail(`판정 뒤 상품 상태가 '${L0.status}'로 바뀜`, true); return; } } catch (e) {} }
      }
      if (kind === 'manual') { // 관리자 가격·수동 일괄: 적은 가격만, 결정 뒤 상품 상태·가격이 바뀌었으면 막음
        const ap = x.approval || {}; const p0 = Math.round(+ap.price);
        if (!(p0 >= 10)) { await fail('관리자가 정한 가격이 없음 (엔진 추천가로 대신하지 않음)', true); return; }
        if (!ap.at || Date.now() - Date.parse(ap.at) - pxlHeld(x.pxWait, ap.at || null) > 72 * 3600e3) /* ⏳ 가격 잠금으로 미룬 시간은 72시간에서 뺌(사람이 확정한 값 · 잠금이 끝나면 반영) */ { await d.ref.set({ approvalState: 'stale', execNote: '결정한 지 72시간이 넘음 — 시장이 바뀌었을 수 있어 반영하지 않음, 다시 확인 후 결정', ...W() }, { merge: true }); log(`오래된 결정이라 반영 안 함: ${x.title || x.usedCode}`, 1); return; }
        try { const L = (await (lsP || C('prd_listings').doc(x.key).get())).data(); const seenAfter = L && [L.lastSeenAt, L.editAt, L.watchSyncAt].some((t) => t && String(t) > String(ap.at)); /* (10/30 위험 8) 결정 뒤 수집기가 다시 봤거나 · 웹앱 ✏·전략이 고쳤거나(editAt) · 다른 반영(watchSyncAt)이 있었으면 가격 비교 */
          if (L && seenAfter && L.status && L.status !== '판매중') { await fail(`결정 뒤 상품 상태가 '${L.status}'로 바뀜`, true); return; }
          if (L && seenAfter && ap.expectPrice != null && L.price != null && +L.price !== +ap.expectPrice && +L.price !== p0) { await fail(`결정 뒤 다른 곳에서 가격이 바뀜 (결정 때 ${(+ap.expectPrice).toLocaleString()} → 지금 ${(+L.price).toLocaleString()})`, true); return; } } catch (e) {}
      }
      if (kind === 'unhold') { // 판매보류풀 해제(원상복귀): 원래 관리코드 → 판매중
        const orig = (x.approval && x.approval.sku) || (x.holdInfo && x.holdInfo.origSku); if (!orig) { await fail('원래 관리코드 기록이 없음'); return; }
        if (!(await xGate('unhold'))) return;
        let r1; try { r1 = P.parseAjaxResult(await (await post('/scm/ajaxCmd.aspx', P.scmAction.supCode(x.listingId, orig).body)).text()); } catch (e) { r1 = { ok: false, error: e.message }; }
        if (!r1.ok) { await fail('관리코드 되돌리기 ' + r1.error); if (/로그인/.test(r1.error || '')) { APX.halt = true; return; } return; }
        await sleep(1500); let ok2 = false, err2 = ''; try { const r2 = await post('/scm/wrecord_edit_usedbatch.aspx', P.scmAction.status('일시판매중지', '판매중', [x.listingId]).body); ok2 = r2.ok; err2 = '응답 ' + r2.status; } catch (e) { err2 = e.message; }
        if (!ok2) { await fail(`관리코드는 ${orig}로 돌렸지만 판매중 변경 실패(${err2}) — 샵매니저에서 확인`); return; }
        n++; await xEnd(xo, 'done', `관리코드 ${orig}, 판매중`); xo = null; await settle(d.ref, x, { approvalState: 'done', executedAt: now, execNote: `판매보류풀 해제: 관리코드 ${orig}, 판매중`, holdInfo: null, ...W() }, { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, kind: 'unhold', fromSku: PR.skuWith(orig, 'hold'), toSku: orig, fromStatus: '일시판매중지', toStatus: '판매중', at: now, day: today, by: (x.approval && x.approval.by) || null, pc: PC, engine: PR.VERSION, ...W() }); log(`판매보류풀 해제: ${x.title || x.usedCode} (→ ${orig}, 판매중)`); await sleep(GAP()); return;
      }
      if (kind === 'hold') { // 판매보류풀: 관리코드 뒤 3자리 PND → 판매상태 일시판매중지
        const newSku = PR.skuWith(x.sku, 'hold'); if (!newSku) { await fail('관리코드가 없어 PND로 바꿀 수 없음'); return; }
        if (!(await xGate('hold'))) return;
        let r1; try { r1 = P.parseAjaxResult(await (await post('/scm/ajaxCmd.aspx', P.scmAction.supCode(x.listingId, newSku).body)).text()); } catch (e) { r1 = { ok: false, error: e.message }; }
        if (!r1.ok) { await fail('관리코드 변경 ' + r1.error); if (/로그인/.test(r1.error || '')) { APX.halt = true; return; } return; }
        await sleep(1500);
        let ok2 = false, err2 = ''; try { const r2 = await post('/scm/wrecord_edit_usedbatch.aspx', P.scmAction.status('판매중', '일시판매중지', [x.listingId]).body); ok2 = r2.ok; err2 = '응답 ' + r2.status; } catch (e) { err2 = e.message; }
        if (!ok2) { await fail(`관리코드는 ${newSku}로 바뀌었지만 일시판매중지 변경 실패(${err2}) — 샵매니저에서 확인`); return; }
        n++; await xEnd(xo, 'done', `${x.sku} → ${newSku}, 일시판매중지`); xo = null; await settle(d.ref, x, { approvalState: 'done', executedAt: now, execNote: `판매보류풀로 옮김: ${x.sku} → ${newSku}, 일시판매중지`, holdInfo: { origSku: x.sku || null, minPrice: (x.approval && x.approval.price) || null, at: now }, ...W() }, { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, grade: x.grade || null, aladinItemId: x.aladinItemId || null, kind: 'hold', fromSku: x.sku || null, toSku: newSku, fromStatus: '판매중', toStatus: '일시판매중지', from: x.current ?? null, to: x.current ?? null, minPrice: (x.approval && x.approval.price) || null, at: now, day: today, by: (x.approval && x.approval.by) || null, pc: PC, engine: PR.VERSION, ...W() }); log(`판매보류풀: ${x.title || x.usedCode} (${x.sku} → ${newSku}, 일시판매중지)`); await sleep(GAP()); return;
      }
      const price0 = Math.round(kind === 'manual' ? +(x.approval && x.approval.price) : (x.approval && x.approval.price) || x.target); const price = ceil10(price0); const p10 = price !== price0; /* (0.10.72 pubv1 · 정범님 I-1119-2332-43) 알라딘 판매가는 10원 단위 — 수동 일괄 입력칸 값(예 12001원)이 그대로 와서 알라딘이 12,010원으로 올려 받고 「돌려준 값이 다름」으로 막혔음 → 보내기 전에 알라딘과 같게 10원 단위 올림 · 잠금 검사·반영 기록도 이 값으로 */ if (!(price >= 10)) { await fail('가격이 없음', true); return; }
      if (lkW && lkW.on === true) { const ap = x.approval || {}, x0 = ap.plkx || {}, curW = ap.expectPrice != null ? +ap.expectPrice : x0.cur; const Q = plkClamp(lkW, price, { ...x0, cur: curW, noDay: 1 }); if (!Q.ok || Q.p !== price) { await fail(Q.ok ? '🎚 조건 잠금 — 정한 값 ' + price + '원이 선 밖(' + Q.p + '원까지)' : Q.why, true); return; }
        if (plkBlock(lkW, ['price']).cond) { /* (11/19 lkday1 · 검토 1-3·1-6) 반영 직전 — ① 조건이 시장 값에 기대는데 그 값이 오래됐으면 ② 하루 한도(내 몫은 빼고 셈 — 두 번 세지 않음)를 넘으면 「다시 결정」으로 ③ 내 몫이 아직 안 세어졌으면(날이 바뀜·옛 결정) 지금 셈 */
          const again = async (m) => { await d.ref.set({ approvalState: 'stale', execNote: m + ' — 반영하지 않음, 다시 결정', ...W() }, { merge: true }); log(`🎚 조건 잠금 — 다시 결정으로: ${x.title || x.usedCode} (${m})`, 1); };
          const old = plkMktOld(lkW, x0, ap.at); if (old) { await again(old); return; }
          const tkC = String(x0.tk || 'o' + String(ap.at || '').replace(/[^0-9A-Za-z]/g, '')); let M = plkDayMine(lkW, tkC, curW, price, null); if (!M.mine && !x0.tk) M = plkDayMine(lkW, '', curW, price, ap.at); /* 표 없는 옛 결정(웹앱 옛 판)은 오늘 결정이면 이미 센 것으로 */
          const Q2 = plkClamp(M.lk, price, { ...x0, cur: curW }); if (!Q2.ok || Q2.p !== price) { await again(Q2.ok ? '🎚 조건 잠금 — 하루 한도에 닿음(' + Q2.p + '원까지)' : Q2.why); return; }
          if (!M.mine) { const R = await plkCntW(lkW._k || x.key, tkC, curW, price); if (!R.ok) { if (R.err) await fail(R.why); else await again(R.why); return; } } } } /* (11/18 lockcond1) 조건 잠금 — 보내기 직전 다시 셈(정한 때 찍은 시장 값 plkx · 그 사이 조건을 바꿨으면 새 조건으로) */ // (0.5.0) 관리자 가격은 적은 가격만
      /* (11/10 fence2) 🧪 엔진 실험 길 = 🛰 감시 그룹 자동 반영(approval.decision 'auto') · 전체 비율 실험 적용 묶음(group 'treat' 승인) → 사람이 손대 빠진 상품(eng_excl)은 안 바꿈 · 내리기 전에 하루 손해 원장 예약(넘거나 못 받으면 안 내림) */
      const apF = x.approval || {}; const fSrc = kind === 'approved' ? (apF.decision === 'auto' ? 'pw:' + (apF.gid || '') : x.group === 'treat' ? 'ro' : null) : null; let fz = null; const fzId = `${PC}:${TAB}:${Date.now().toString(36)}`;
      const fOps = !!fSrc && fSrc !== 'ro'; /* (11/10 fence4) 🛰 감시 그룹 자동 반영(🎯 추격자 포함) = 정범님 운영 기능 → 연구 울타리(사람 손댐 목록·🔒 잠금·무손해·하루 손해 한도)로 막지 않음 · 원장에는 얼마 내렸는지 기록만 */
      if (fOps) { const from0 = (apF.expectPrice != null ? +apF.expectPrice : x.current != null ? +x.current : null); const B0 = fenceBase(x, null);
        if (from0 != null && price < from0) { try { fz = await fenceRun('rec', { key: x.key, from: from0, to: price, start: (x.watch && x.watch.startPrice) ?? null, human: B0 && B0.human ? B0.s : null, src: fSrc, by: 'price-watch:' + (PC || '?'), id: fzId }); } catch (e) { fz = null; log('하루 손해 원장 기록 실패(감시 자동 반영은 그대로 · 막지 않음): ' + (e.code || e.message), 1); } } }
      else if (fSrc) { const EX = await engExcl(true); const back = async (note, toPending) => { await d.ref.set({ ...(toPending ? { approvalState: 'pending', approval: null, autoBlock: [note] } : { approvalState: 'blocked' }), execNote: note, fenceNo: { at: now, why: note }, ...W() }, { merge: true }); log(`안 바꿈: ${x.title || x.usedCode} — ${note}`, 1); };
        if (!EX) { await back('🧪 사람 손댐 목록(eng_excl)을 못 읽어 엔진 실험 값은 바꾸지 않음(안전 쪽) — 다음 바퀴에 다시', apF.decision === 'auto'); return; }
        if (EX[x.key]) { await back(`🧪 사람이 손대 엔진 실험에서 빠진 상품(${String(EX[x.key].why || '').slice(0, 40)}) — 엔진은 다시 바꾸지 않음 · 바꾸려면 직접 가격으로`, false); return; }
        /* (11/10 fence3) 무손해 모드: 전체 비율 실험(연구) 승인은 값을 바꾸지 않음 · 🔒 등록 3개월 안·사람이 손댄 상품은 감시 자동 반영도 안 바꿈 · 설정·상품 기록을 못 읽으면 안 바꿈(안전 쪽) */
        if (fSrc === 'ro' && fenceNoLoss(await engFence(true))) { await back('🧪 무손해 모드 — 전체 비율 실험(연구)은 값을 바꾸지 않음(판정만 기록) · 바꾸려면 직접 가격으로', false); return; }
        let LSx = null; try { const s0 = await C('prd_listings').doc(x.key).get(); LSx = s0.exists ? s0.data() || {} : null; } catch (e) { LSx = undefined; } if (LSx === undefined) { await back('🔒 상품 기록을 못 읽어 등록 3개월 안인지 모름 — 엔진은 안 바꿈(안전 쪽) · 다음 바퀴에 다시', apF.decision === 'auto'); return; }
        const WGo = await wgLoad(true); const opsG = x.watch && x.watch.gid && WGo.get(x.watch.gid); /* (11/10 fence4) 정범님이 손대 진행 중(켜진 감시 그룹·추격자)이면 연구가 안 바꿈 · 지금 반영하려는 엔진 제안 승인(approve) 자체는 '사람이 값을 정함'으로 세지 않음(예전엔 승인하면 늘 🔒이라 실험이 영영 못 돎) — 사람이 정한 값(humanPx)·상품 수정은 그대로 셈 */
        const LK = fenceLock(LSx, { key: x.key, excl: null, dec: apF.decision === 'approve' ? { ...x, approval: null } : x, nowMs: Date.now(), gid: null, ops: opsG ? { why: `🛰 감시 그룹 '${String(opsG.name || opsG.id).slice(0, 30)}'` } : null }); if (LK) { await back('🔒 ' + LK.why + ' — 바꾸려면 직접 가격으로', false); return; }
        const from0 = (apF.expectPrice != null ? +apF.expectPrice : x.current != null ? +x.current : null); const B0 = fenceBase(x, null); /* 손해 셈 (나): 사람이 마지막으로 확정한 값 기준 */
        if (from0 == null || price < from0) { const CO = fenceCostOk(await costOkRec(), { what: 'ro' }); if (!CO.ok) { fenceRun('no', { key: x.key, src: fSrc, by: 'price-watch:' + (PC || '?'), from: from0, to: price, why: CO.why }).catch(() => {}); await back(CO.why + ' — 전체 비율 실험(연구)이 값을 내리려면 웹앱 ⚡ 전략 화면에서 💸 허락(두 번 누르기)', false); return; } /* (11/10 fence4) 💸 비용 드는 연구는 정범님 허락 기록이 있어야만 · 한도는 허락 한도와 하루 손해 한도 중 작은 값 */
          try { fz = await fenceRun('try', { key: x.key, from: from0, to: price, start: (x.watch && x.watch.startPrice) ?? null, human: B0 && B0.human ? B0.s : null, src: fSrc, by: 'price-watch:' + (PC || '?'), id: fzId, cap: CO.limit }); } catch (e) { fz = { ok: false, why: '하루 손해 원장을 못 씀(' + (e.code || e.message) + ') — 안전 쪽으로 내리지 않음' }; }
          if (!fz || !fz.ok) { await back('🧪 하루 손해 한도: ' + ((fz && fz.why) || '모름'), apF.decision === 'auto'); return; } } }
      const fzEnd = (ok, p) => (fz && fz.e ? fenceRun('settle', { key: x.key, id: fzId, ok, price: p }).catch((e) => log('하루 손해 원장 정리 실패(클라우드가 20분 안에 정리): ' + (e.code || e.message), 1)) : Promise.resolve());
      if (!(await xGate('price'))) { await fzEnd(false); return; }
      let res; try { await apPace(); const r = await fetch(P.scmAction.price(x.listingId, price).url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } }); res = P.parseAjaxResult(await r.text()); } catch (e) { res = { ok: false, error: e.message }; }
      if (res.ok) PACE.ok(); else PACE.fail(/로그인/.test(res.error || '') ? 'login' : 'error');
      if (res.ok && parseInt(String(res.value || '').replace(/\D/g, ''), 10) !== price) res = { ok: false, error: `알라딘이 돌려준 값(${res.value})이 보낸 가격(${price})과 다름` };
      if (!res.ok && !/돌려준 값/.test(res.error || '')) await fzEnd(false); /* (11/10 fence2) 안 들어감 → 예약 풂 · 알라딘이 다른 값으로 받았으면 예약 그대로(수집기가 다시 읽은 값으로 클라우드가 정리 — 안전 쪽) */
      if (!res.ok) { await fail(res.error, /돌려준 값/.test(res.error || '')); /* 알라딘이 다른 값으로 받았으면 다시 보내지 않음 */ if (/로그인/.test(res.error || '')) { state('<b style="color:#B0322A">알라딘 로그인 풀림</b> — 수집기가 다시 로그인할 때까지 기다림'); APX.halt = true; return; } return; }
      n++; SPD.n++; await fzEnd(true, price); await xEnd(xo, 'done', `${price} (알라딘 답: ${res.value})`); xo = null; const fromP = (x.approval && x.approval.expectPrice != null ? x.approval.expectPrice : x.current) ?? null;
      const fine = Math.random() < 0.1; const vNew = { state: 'wait', n: 0, si: 0, fine, next: new Date(Date.parse(now) + (fine ? V_FINE : V_STEPS)[0] * 60000).toISOString() }; const actDoc = { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, grade: x.grade || null, aladinItemId: x.aladinItemId || null, from: fromP, to: price, engineTarget: x.target ?? null, kind: (x.approval && x.approval.decision) || kind, batchId: (x.approval && x.approval.batchId) || null, batchName: (x.approval && x.approval.batchName) || null, at: now, day: today, kst: kstOf(now), confirmedAt: (x.approval && x.approval.at) || null, by: (x.approval && x.approval.by) || null, pc: PC, result: res.value, ...(p10 ? { asked: price0 } : {}), engine: PR.VERSION, verify: vNew, ...(fine && x.listingId ? { verifyPg: { state: 'wait', n: 0, si: 0, next: vNew.next } } : {}), ...W() };
      const ap0 = x.approval || {}; const wgA = ap0.decision === 'batch' && ap0.batchId ? (await wgLoad()).get(ap0.batchId) : null; // (0.8.0) 감시 켠 그룹의 첫 가격이 반영되면 그 상품은 이제부터 그 그룹으로 감시
      const oldG = x.watch && x.watch.gid && wgA && x.watch.gid !== wgA.id ? x.watch.gid : null; if (oldG) log(`감시 그룹 바뀜: ${x.title || x.usedCode} — ${oldG} → ${wgA.id}(수동 일괄 확정이 붙임 · 앞 그룹 기록은 watchPrev에)`, 1); /* (10/30 위험 12) */
      const humanAp = /@/.test(String(ap0.by || '')) && ['batch', 'manual'].includes(ap0.decision || kind); /* (11/10 fence3) 사람(정범님·관리자)이 정한 값 — 막지 않음 · 손해 셈 기준(나)으로 남김 */
      const enroll = wgA ? { watch: { gid: wgA.id, since: now, startPrice: fromP, humanPrice: humanAp ? price : null, by: ap0.by || null }, ...(oldG ? { watchPrev: { gid: oldG, since: (x.watch && x.watch.since) || null, until: now } } : {}) } : {};
      if (humanAp) enroll.humanPx = { p: price, at: now, by: ap0.by || null, how: ap0.decision || kind, gid: ap0.batchId || null };
      if (humanAp) fenceRun('note', { key: x.key, start: price, price, src: wgA ? 'pw:' + wgA.id : null, make: !!wgA, reset: true }).catch(() => {}); /* (11/10 fence3 · 손해 셈 (나)) 사람이 확정한 값 = 기준 → 사람이 내린 몫은 손해가 아님(걸린 손해 0) · 예전(fence2)엔 일괄 전 값을 기준으로 사람이 내린 몫까지 손해로 셈 */
      else if (!fz && fSrc && fromP != null && price > fromP) fenceRun('note', { key: x.key, price, make: false }).catch(() => {}); /* 엔진이 값을 올림 → 걸린 손해를 줄여 적음(원장에 있는 상품만) */
      pxlNoteW(x.key, fromP, price, 'pw:' + (ap0.decision || kind), ap0.batchId || ap0.gid || null).catch(() => {}); /* ⏳ 가격 잠금 기록 */
      try { const sP = settle(d.ref, x, { approvalState: 'done', executedAt: now, pendingChange: { at: now, price }, pxWait: null, execNote: `반영됨 (알라딘 답: ${res.value}${p10 ? ` · 정한 값 ${price0}원 → 알라딘 10원 단위 ${price}원` : ''})`, ...enroll, ...W() }, actDoc); const aL = settle.last; await sP; if (VQ && aL) VQ.push({ id: aL.id, ref: aL, ...actDoc }); } /* (0.10.76 두 줄) settle.last는 settle이 기다리기 전에 바로 정함 → 기다리는 사이 다른 줄이 덮기 전에 잡아 둠 */
      catch (e) { log(`⚠ 알라딘에는 ${price.toLocaleString()}원으로 들어갔지만 기록 저장 실패: ${x.title || x.usedCode} — ${e.message} (10분 뒤 '막힘 — 확인'으로 표시됨)`, 1); return; } log(`가격 반영: ${x.title || x.usedCode} ${(x.current || 0).toLocaleString()} → ${price.toLocaleString()}`);
      { const tS = Date.now(), au = (x.approval || {}).decision === 'auto'; await sleep(GAP(au ? 'auto' : null) * APX.lanes); if (au) SPD.auto += Date.now() - tS; } /* (0.10.76) 엔진 자동 반영 사이 쉼은 줄 수만큼 늘려 전체 박자는 예전 그대로(사람이 확정한 것만 빨라짐) */ /* (0.10.75) 반영 중에는 공개 확인을 아예 하지 않음 — 반영 대기가 0이 된 뒤 tick이 이어 받음 · 알라딘 요청도 먼저 받기(prio)로 다른 탭·수집기 읽기보다 앞섬 */ /* (0.10.74 정범님 I-1120-0913-09 · 확정 뒤 샵매니저 반영이 멈춘 듯 느림) 예전엔 한 건 보낼 때마다 공개 확인(알라딘 목록 최대 5쪽+상품 페이지 × 2권)을 해서 알라딘 간격에 묶여 한 건 1~5분 → 5분에 한 번만(반영이 먼저) · 확인은 tick의 verifyStep(60)이 이어 받음 */ // (사람처럼) 엔진 자동 반영끼리는 6~25초 사이를 둠 · 관리자 확정은 예전대로 // (0.7.0) 반영하는 사이사이 공개 반영 확인도 (확인 때가 된 것만)
    };
    const apJit = async () => { const r = Math.random(); const ms = r < 0.06 ? 9000 + Math.random() * 16000 : r < 0.2 ? 4000 + Math.random() * 5000 : 700 + Math.random() * Math.random() * 3800; SPD.jit = (SPD.jit || 0) + ms; await sleep(ms); }; /* (0.10.80 정범님 I-1120-1440-28 「반영 사이 사이에 랜덤성 · 지금은 2~3초 일정」) 반영 하나하나 사이에 들쭉날쭉한 틈 — 대개 0.7~4.5초(짧은 쪽이 잦음) · 14%는 4~9초 · 6%는 9~25초 쉼 · 줄마다 따로 · 평균 약 +3.4초 */
    const lane = async () => { for (;;) { if (APX.halt || ((stop || SET.killSwitch || !isMine()) && !(await apOk()))) return; const grp = lanesQ.shift(); if (!grp) return; for (const d0 of grp) { if (APX.halt || ((stop || SET.killSwitch || !isMine()) && !(await apOk()))) return; if (++nDone > 200) { apMore = true; if (!APX.halt) log(`반영 대기가 많아(${docs.length}건) 200건까지만 하고 판정과 번갈아 — 나머지는 다음 바퀴`); APX.halt = true; return; } /* (10/30 위험 10) 큰 일괄 확정이 감시 판정·추격자 다시 보기를 몇 시간 세우지 않게 */ if (nDone > 1) await apJit(); await apOne(d0); } } };
    if (APX.lanes > 1 && docs.length > 1) log(`🚀 반영 ${APX.lanes}줄로 함께 (샵매니저 반영 속도 ${APX.lanes}배 — 웹앱 가격 감시 카드에서 바꿈)`);
    { const LN = []; const nL = Math.min(APX.lanes, lanesQ.length) || 1; for (let i = 0; i < nL; i++) LN.push(lane()); await Promise.all(LN); } /* (0.10.79 정범님 I-1120-1316-22 「또 멈췄어」 진짜 원인) 샵매니저 화면의 옛 도구(Prototype.js)가 Array.from을 바꿔 둬서 두 번째 인수(lane)를 무시 → 0.10.76부터 반영 줄이 하나도 안 떠 바퀴마다 「맡음 0 · 0초」 · 평범한 for로 줄을 띄움(브라우저 기본 함수에 기대지 않음) */
    apSpdW(SPD, APX.lanes).catch(() => {});
    { const left = lanesQ.reduce((a, g) => a + g.length, 0); log(`반영 바퀴 끝: 대기 ${docs.length}건 중 맡음 ${Math.max(0, nDone)} · 반영 ${n} · 잠금 미룸 ${pxN} · 꺼진 그룹 ${offN} · 오류 ${errN} · 3분 넘김 ${toN} · 남음 ${left} · 멈춘 까닭 ${haltWhy || (apMore ? '200건 몫' : '없음')} · ${Math.round((Date.now() - SPD.t0) / 1000)}초(무작위 틈 ${Math.round((SPD.jit || 0) / 1000)}초)`, !!haltWhy || (!n && !pxN && !offN && docs.length > 0)); if (haltWhy && left > 0 && !SET.killSwitch && isMine()) apMore = true; } /* (0.10.78) 까닭 있이 멈췄는데 이 탭이 여전히 감시 탭이면 tick이 바로 다시 돎(500번 한도) */
    if (pxN) log(`⏳ 가격 잠금으로 ${pxN}건은 미룸(실패 아님 · 잠금 끝난 뒤 반영)`); if (offN) log(`꺼진 수동 일괄 그룹의 확정 ${offN}건은 반영하지 않고 기다림 (웹앱에서 그룹을 켜면 반영)`); void n;
  }

  /* ── (0.7.0) 공개 반영 확인: 샵매니저에 바꾼 가격이 구매자가 보는 온라인 중고 목록(전체중고, wuseditemall)에 언제 보이는지
   *  · 반영 뒤 2·5·10·20·30·45·60·90·120분 … 48시간까지 정해진 때에 그 책의 온라인 중고 목록을 열어 우리 매물(상품 번호·상품코드로 찾음)의 판매가를 봄 (같은 책의 다른 확인도 한 번에)
   *  · 바꾼 가격이 보이면 '확인됨' — 걸린 시간은 '마지막으로 아직 옛 값이던 확인'과 '처음 새 값을 본 확인' 사이 (범위로 기록: lagLoSec~lagHiSec)
   *  · 옛 값·다른 값·목록에 없음(첫 쪽에 없거나 팔림)은 횟수만 세고 계속, 48시간까지 못 보면 '시간 넘음'
   *  · 다음 쪽은 화면에 실제로 있는 쪽 링크(주소)가 있을 때만 따라감 (주소를 지어내지 않음), 최대 5쪽
   *  · 0.7.0 전에 반영한 것(오늘·어제)은 '늦게 시작'으로 확인만 하고 걸린 시간 통계에서는 뺌 */
  /* (0.9.0) 확인 때(반영 시각 기준, 분): 보통 = V_STEPS · 정밀 표본(반영 10건 중 1건, verify.fine) = V_FINE(앞쪽을 촘촘히 — 걸린 시간을 좁은 범위로)
   *  감시 탭이 바빠 확인 때를 놓쳤으면 놓친 때를 1분 간격으로 몰아서 보지 않고, 지금 이후의 다음 때로 건너뜀 (예전: 밀린 확인이 1분마다 이어짐)
   *  정밀 표본은 우리 상품 페이지(wproduct.aspx?ItemId=우리 상품번호)의 판매가도 같은 때에 따로 확인(verifyPg) — 목록과 상품 페이지가 언제 각각 바뀌는지 */
  const V_STEPS = [2, 5, 10, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 960, 1200, 1440, 1800, 2160, 2520, 2880];
  const V_FINE = [2, 4, 6, 8, 10, 13, 16, 20, 25, 30, 35, 40, 50, 60, 75, 90, 105, 120, 150, 180, 240, 300, 360, 480, 600, 720, 960, 1200, 1440, 1800, 2160, 2520, 2880];
  function kstOf(iso) { const d = new Date(Date.parse(iso) + 9 * 3600e3); return { day: d.toISOString().slice(0, 10), hour: d.getUTCHours(), dow: d.getUTCDay() }; }
  const vSteps = (v) => (v && v.fine ? V_FINE : V_STEPS);
  function vNext(at, steps, si) { const t0 = Date.parse(at); for (let j = si; j < steps.length; j++) { const tt = t0 + Math.round(steps[j] * 60000 * (0.85 + Math.random() * 0.3)); /* (사람처럼) 바꾼 뒤 꼭 2·5·10…분이 아니게 ±15% */ if (tt > Date.now() + 60000) return { si: j, next: new Date(tt).toISOString() }; } return null; } // 지금 이후 첫 확인 때 (놓친 때는 건너뜀)
  /* (0.10.72 pubv1 · 정범님 I-1119-2332-43 「공개 반영 실패로 끝내고 직접 열어 보라 하지 말고 반영될 때까지」) 첫 바퀴(반영 뒤 48시간)에 못 보면 끝내지 않고 다시 확인 바퀴(rb = 바퀴 시작 · 1·3·6·12시간 · 1~14일)
   *  · 다시 확인 바퀴도 다 쓰면 그때만 'hand'(why = 마지막 까닭 · 해 본 것은 n·notFound·old·other·errs·round · 웹앱 「다시 확인」으로 또 맡김) · 뒤에 같은 상품 가격을 또 바꿨으면 'moved'(새 반영의 확인이 이어 받음) */
  const V_RETRY = [60, 180, 360, 720, 1440, 2160, 2880, 4320, 5760, 7200, 10080, 14400, 20160];
  const ceil10 = (p) => Math.ceil(+p / 10) * 10; /* 알라딘 판매가 10원 단위(올림 — 12001원을 보내면 12,010원으로 받음) */
  function vNextOf(a, v, si, noRetry) { if (v && v.rb) return vNext(v.rb, V_RETRY, si); const nx = vNext(a.at, vSteps(v), si); if (nx || noRetry) return nx; const rb = new Date().toISOString(); const n2 = vNext(rb, V_RETRY, 0); return n2 ? { ...n2, rb, round: ((v && v.round) || 1) + 1 } : null; }
  const vNx = (nx) => ({ si: nx.si, next: nx.next, ...(nx.rb ? { rb: nx.rb, round: nx.round } : {}) });
  const VMV = new Map(); /* 상품 → { t, moved } (10분 기억) */
  async function vMoved(a) { const c = VMV.get(a.key); if (c && Date.now() - c.t < 10 * 60000 && c.at === a.at) return c.moved; let moved = null;
    try { const q = await C('prd_price_actions').where('key', '==', a.key).get(); const later = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.id !== a.id && b.at && String(b.at) > String(a.at) && b.to != null && !['hold', 'unhold'].includes(b.kind)); if (later.length) moved = `뒤에 이 상품 가격을 또 바꿈(${later.sort((p, q2) => String(q2.at).localeCompare(String(p.at)))[0].to}원) — 새 반영의 확인이 이어 받음`; } catch (e) {}
    if (!moved) { try { const L = (await C('prd_listings').doc(a.key).get()).data(); if (L && L.price != null && +L.price !== +a.to && L.editAt && String(L.editAt) > String(a.at) && !/^price-watch/.test(String(L.editBy || ''))) moved = `뒤에 웹앱에서 가격을 직접 고침(${L.price}원)`; } catch (e) {} }
    VMV.set(a.key, { t: Date.now(), at: a.at, moved }); return moved; }
  /* (0.10.72) 새상품 번호(ItemId)가 없는 반영 — 예전엔 'noitem'으로 바로 끝냄 → ① 상품 기록의 책(prd_books) ② ISBN13·ISBN10·알라딘 코드로 알라딘 상품 페이지(wproduct.aspx?ISBN=) — 찾던 ISBN과 다르면 쓰지 않음
   *  찾으면 반영 기록·결정·책 기록(비어 있을 때만 · itemIdFill 표)에 채워 다음부터 바로 씀 · 못 찾으면 우리 상품 페이지(wproduct.aspx?ItemId=우리 상품번호)의 판매가로 확인 */
  const VID = new Map();
  async function vFindItem(a) { const c = VID.get(a.key); if (c && (c.id || Date.now() - c.t < 6 * 3600e3)) return c.id ? c : null;
    let L = null, B = null, id = null, by = null; try { const s0 = await C('prd_listings').doc(a.key).get(); L = s0.exists ? s0.data() || {} : null; } catch (e) {}
    if (L && L.bookId) { try { const b = await C('prd_books').doc(String(L.bookId)).get(); B = b.exists ? b.data() || {} : null; if (B && B.aladinItemId) { id = String(B.aladinItemId); by = 'book'; } } catch (e) {} }
    if (!id && L && L.aladinItemId) { id = String(L.aladinItemId); by = 'listing'; }
    const want = (L && L.isbn13) || (B && B.isbn13) || null; const tried = [];
    if (!id) for (const q of [want, L && L.isbn10, B && B.isbn10, L && L.aladinCode].filter(Boolean).map(String).filter((v, i, A) => A.indexOf(v) === i)) { tried.push(q); try { const pp = P.parseProductPage(await aladinDoc(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(q)}`), ''); if (pp && pp.aladinItemId && (!want || !pp.isbn13 || String(pp.isbn13) === String(want))) { id = String(pp.aladinItemId); by = 'isbn:' + q; break; } } catch (e) {} }
    const r = { id, by, L, B, tried, t: Date.now() }; VID.set(a.key, r); return id ? r : null; }
  async function vFill(acts, f) { const at = new Date().toISOString(); const tag = { by: f.by, at, ver: VER }; for (const a of acts) { a.aladinItemId = f.id; try { await a.ref.set({ aladinItemId: f.id, itemIdFill: tag, ...W() }, { merge: true }); } catch (e) {} }
    try { const dr = C('prd_price_decisions').doc(acts[0].key); const ds = await dr.get(); if (ds.exists && !(ds.data() || {}).aladinItemId) await dr.set({ aladinItemId: f.id, itemIdFill: tag, ...W() }, { merge: true }); } catch (e) {}
    if (f.L && f.L.bookId && !(f.B && f.B.aladinItemId)) { try { const br = C('prd_books').doc(String(f.L.bookId)); const bs = await br.get(); if (bs.exists && !(bs.data() || {}).aladinItemId) await br.set({ aladinItemId: f.id, itemIdFill: { ...tag, from: 'price-watch' }, ...W() }, { merge: true }); } catch (e) {} } log(`공개 반영 확인: 새상품 번호를 찾아 채움 — ${acts[0].title || acts[0].usedCode || acts[0].key} (${f.by})`); }
  async function vPage(a) { const pr = P.parseUsedItemPrice(await aladinDoc(`/shop/wproduct.aspx?ItemId=${a.listingId}`)); return { price: pr && pr.price, found: !!(pr && pr.price != null && (!pr.sellerCode || pr.sellerCode === '996008')) }; } /* 우리 상품 페이지 판매가 (판매자 = 우리 996008) */
  /* (0.10.72) 한 번만: 예전에 'noitem'·'notfound'·'other'·'timeout'으로 끝난 확인을 다시 확인 바퀴로 — verifyRequeue 표(다시 안 돌림) · 옛 확인은 verifyHist에 덧붙임(지우지 않음) · 같은 상품은 가장 늦은 반영만(앞의 것은 'moved') */
  async function vRequeue() { const q = await C('prd_price_actions').where('verify.state', 'in', ['noitem', 'notfound', 'other', 'timeout']).get(); const D = q.docs.filter((d) => !(d.data() || {}).verifyRequeue); if (!D.length) return 0;
    const last = new Map(); D.forEach((d) => { const a = d.data(); const p = last.get(a.key); if (!p || String(a.at) > String(p.data().at)) last.set(a.key, d); }); let n = 0;
    for (const d of D) { const go = last.get(d.data().key) === d; try { await db.runTransaction(async (tx) => { const sn = await tx.get(d.ref); const a = sn.data() || {}; const old = a.verify || {}; if (a.verifyRequeue || !['noitem', 'notfound', 'other', 'timeout'].includes(old.state)) return; const now = new Date().toISOString();
          const nv = go ? { ...old, state: 'wait', si: -1, rb: now, round: (old.round || 1) + 1, late: true, next: new Date(Date.now() + Math.round((1 + Math.random() * 29) * 60000)).toISOString(), prev: old.state } : { ...old, state: 'moved', doneAt: now, prev: old.state, note: '뒤에 이 상품 가격을 또 바꿈 — 새 반영의 확인이 이어 받음' };
          tx.set(d.ref, { verify: nv, verifyRequeue: { at: now, from: old.state, ver: VER, by: PC }, verifyHist: firebase.firestore.FieldValue.arrayUnion({ ...old, endAt: old.doneAt || null }), ...W() }, { merge: true }); n++; }); } catch (e) { log('공개 반영 다시 확인 맡기기 실패: ' + e.message, 1); } }
    if (n) log(`공개 반영 확인: 예전에 끝난 ${n}건을 다시 확인 바퀴로 맡김(한 번만)`); return n; }
  /* (0.10.72) 한 번만: 「알라딘이 돌려준 값(12,010)이 보낸 가격(12001)과 다름」으로 막힌 결정 중 돌려준 값 = 보낸 값을 10원 단위로 올린 값인 것 — 알라딘엔 이미 들어감
   *  → 다시 보내지 않고 '반영됨'으로 고치고 반영 기록(prd_price_actions)을 남겨 ④ 공개 반영 확인을 이어 감 · roundFix 표(옛 까닭 was 그대로 · 다시 안 함) · 한 PC만(prd_system/pricing.roundFix) */
  const RT_RE = /돌려준 값\(([\d,]+)\)이 보낸 가격\((\d+)\)과 다름/;
  function roundFixOf(v) { const m = String((v && v.execNote) || '').match(RT_RE); if (!m) return null; const ret = parseInt(m[1].replace(/\D/g, ''), 10), sent = parseInt(m[2], 10); return ret > 0 && ret !== sent && ret === ceil10(sent) ? { ret, sent } : null; }
  async function roundFixOne(ref) { const aref = C('prd_price_actions').doc(); let ok = false;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data(); const R = roundFixOf(v); if (!v || v.approvalState !== 'blocked' || v.roundFix || !R) return; const key = sn.id; const lref = C('prd_listings').doc(key); const ls = await tx.get(lref); const L = ls.exists ? ls.data() || {} : null; const ap = v.approval || {}; const now = new Date().toISOString(); const at = v.execFailAt || ap.at || now;
      const seenAfter = !!(L && [L.lastSeenAt, L.editAt, L.watchSyncAt].some((t) => t && String(t) > String(at))); /* 그 뒤 수집기·웹앱·다른 반영이 그 상품을 봤으면 상품 기록 값은 그쪽이 맞음 — 건드리지 않음 */
      const a = { key, usedCode: v.usedCode || (L && L.usedCode) || null, listingId: v.listingId || (L && L.listingId) || null, title: v.title || (L && L.title) || null, grade: v.grade || null, aladinItemId: v.aladinItemId || null, from: ap.expectPrice ?? v.current ?? null, to: R.ret, asked: R.sent, engineTarget: v.target ?? null, kind: ap.decision || 'manual', batchId: ap.batchId || null, batchName: ap.batchName || null, at, day: kstOf(at).day, kst: kstOf(at), confirmedAt: ap.at || null, by: ap.by || null, pc: PC, result: String(R.ret), engine: PR.VERSION, roundFix: true, verify: { state: 'wait', n: 0, si: -1, late: true, rb: now, next: now }, ...W() };
      tx.set(aref, a); if (!seenAfter) listingSync(tx, lref, ls, a, aref.id);
      tx.set(ref, { approvalState: 'done', executedAt: at, pendingChange: { at, price: R.ret }, execNote: `반영됨 — 알라딘이 10원 단위로 맞춰 받음(보낸 ${R.sent}원 → ${R.ret.toLocaleString()}원) · 감시기 ${VER}이 막힘을 풀고 공개 반영 확인을 이어 감`, roundFix: { at: now, by: PC, ver: VER, from: 'blocked', was: v.execNote || null, sent: R.sent, ret: R.ret, actionId: aref.id }, ...W() }, { merge: true }); ok = true; });
    if (ok && VQ) { try { const s1 = await aref.get(); VQ.push({ id: aref.id, ref: aref, ...s1.data() }); } catch (e) {} } return ok; }
  async function roundFixOnce() { const VERK = '0.10.72'; let mine = false;
    try { await db.runTransaction(async (tx) => { const d = await tx.get(SREF); const rf = (d.data() || {}).roundFix || {}; if (rf.ver === VERK && (rf.state === 'done' || (rf.state === 'running' && Date.now() - Date.parse(rf.at || 0) < 30 * 60000))) return; tx.set(SREF, { roundFix: { ver: VERK, state: 'running', by: PC, at: new Date().toISOString() } }, { merge: true }); mine = true; }); } catch (e) { return; }
    if (!mine) return; let n = 0, seen = 0;
    try { const q = await C('prd_price_decisions').where('approvalState', '==', 'blocked').get(); for (const d of q.docs) { const v0 = d.data(); if (v0.roundFix || !roundFixOf(v0)) continue; seen++; try { if (await roundFixOne(d.ref)) n++; } catch (e) { log('10원 단위 막힘 고치기 실패: ' + (v0.title || d.id) + ' — ' + e.message, 1); } }
      const rq = await vRequeue(); await SREF.set({ roundFix: { ver: VERK, state: 'done', by: PC, at: new Date().toISOString(), n, seen, requeue: rq } }, { merge: true }); if (n) log(`10원 단위로 막혔던 반영 ${n}개를 반영됨으로 고치고 공개 반영 확인을 이어 감`); VQAt = 0; }
    catch (e) { log('10원 단위 막힘·옛 확인 다시 맡기기 실패(다음에 다시): ' + e.message, 1); try { await SREF.set({ roundFix: { ver: VERK, state: 'fail', by: PC, at: new Date().toISOString(), err: String(e.message).slice(0, 200) } }, { merge: true }); } catch (e2) {} } }
  let VQ = null, VQAt = 0, vqBusy = false;
  async function vqLoad() { if (VQ && Date.now() - VQAt < 10 * 60000) return;
    const [q, qp] = await Promise.all([C('prd_price_actions').where('verify.state', '==', 'wait').get(), C('prd_price_actions').where('verifyPg.state', '==', 'wait').get()]); const M = new Map(); [...q.docs, ...qp.docs].forEach((d) => M.set(d.id, { id: d.id, ref: d.ref, ...d.data() })); const L = [...M.values()];
    if (!VQ) { try { const ago = (h) => new Date(Date.now() + 9 * 3600e3 - h * 3600e3).toISOString().slice(0, 10); const q2 = await C('prd_price_actions').where('day', 'in', [ago(0), ago(24), ago(48), ago(72)]).get(); // 0.7.0 전 반영분 (48시간 안)
        for (const d of q2.docs) { const a = d.data(); if (a.verify || a.to == null || !a.at || Date.now() - Date.parse(a.at) > 48 * 3600e3 || ['hold', 'unhold'].includes(a.kind) || M.has(d.id)) continue; const v = { state: 'wait', n: 0, late: true, si: 0, next: new Date().toISOString() }; await d.ref.set({ verify: v, kst: kstOf(a.at), ...W() }, { merge: true }); L.push({ id: d.id, ref: d.ref, ...a, verify: v }); } } catch (e) { log('공개 반영 확인 — 예전 반영분 읽기 실패: ' + e.message, 1); } }
    VQ = L; VQAt = Date.now(); }
  const vWaiting = (a) => (a.verify && a.verify.state === 'wait') || (a.verifyPg && a.verifyPg.state === 'wait');
  async function vSave(a) { pxlLagW(a).catch(() => {}); try { await a.ref.set({ verify: a.verify, ...(a.verifyPg ? { verifyPg: a.verifyPg } : {}), ...W() }, { merge: true }); } catch (e) { log('공개 반영 확인 저장 실패: ' + e.message, 1); } if (!vWaiting(a) && VQ) { const i = VQ.indexOf(a); if (i >= 0) VQ.splice(i, 1); } }
  const dueOf = (x) => x && x.state === 'wait' && Date.parse(x.next || 0) <= Date.now();
  /* (0.10.78 정범님 I-1120-1329-24 「공개 반영 확인이 느리거나 적합하지 않음 · 더 세밀히」 · I-1120-1332-25 「헌장 제45조를 잊지 말고 · 샵매니저 반영 최우선을 방해하지 않게」)
   *  ① 한 번에 볼 수·시간을 prd_system/pricing.verifyCfg { max(10~200 · 기본 60), budgetMin(1~10 · 기본 4) }로 고침(설정은 실시간)
   *  ② 차례 = 확인 때가 가장 오래 지난 것부터(예전 글자 비교 → 숫자 비교) · 같은 새상품은 한 번에
   *  ③ 바퀴마다 상태 한 줄을 prd_system/pricing_run.verify에(기다리는 수·때 지난 수·본 수·남은 수·가장 늦은 것 몇 분·걸린 초) → 느린지 숫자로 보임
   *  지킴: 반영 대기·새 확정이 있으면 그 자리에서 비킴(그대로) · 확인은 보기만 — 값을 다시 바꾸지 않음(제45조: 시장이 알아볼 때까지 다시 안 바꿈 · 확인 결과가 잠금 길이 표본이 됨) */
  const vCfg = () => { const c = (SET && SET.verifyCfg) || {}; const cl = (v, lo, hi, d) => { const x = Math.round(+v); return Number.isFinite(x) && x >= lo ? Math.min(hi, x) : d; }; return { max: cl(c.max, 10, 200, 60), budgetMs: cl(c.budgetMin, 1, 10, 4) * 60000 }; };
  const vDueMs = (a) => Math.min(...[a.verify, a.verifyPg].filter((x) => dueOf(x)).map((x) => Date.parse(x.next || 0) || 0).concat([9e15]));
  async function verifyStep(max0, budget0) { if (vqBusy) return; vqBusy = true; const t0 = Date.now(); const VC = vCfg(); const max = VC.max || max0, budgetMs = VC.budgetMs || budget0; let vSt = null;
    try { await vqLoad(); const due = VQ.filter((a) => dueOf(a.verify) || dueOf(a.verifyPg)).sort((a, b) => vDueMs(a) - vDueMs(b)); vSt = { wait: VQ.length, due: due.length, oldMin: due.length ? Math.round((Date.now() - vDueMs(due[0])) / 60000) : 0 }; let n = 0;
      while (due.length && n < max && Date.now() - t0 < budgetMs) { if (stop || SET.killSwitch || !isMine() || quietNow() || apWant || apMore) break; /* (0.10.75) 새 확정이 들어오면 그 자리에서 비킴 */ const a = due.shift(); n++; const same = a.aladinItemId ? due.filter((b) => b.aladinItemId === a.aladinItemId && dueOf(b.verify)) : []; same.forEach((b) => due.splice(due.indexOf(b), 1)); await verifyBook([a, ...same]); if (due.length && n < max) await sleep(GAP('read')); } /* (사람처럼) 밤에는 공개 반영 확인도 쉼(놓친 확인 때는 다음 때로 넘어감) · 책 사이 쉼 */
    } catch (e) { log('공개 반영 확인 오류: ' + e.message, 1); } finally { vqBusy = false; if (vSt) { const left = (VQ || []).filter((a) => dueOf(a.verify) || dueOf(a.verifyPg)).length; RREF.set({ verify: { ...vSt, left, done: Math.max(0, vSt.due - left), max, budgetMin: Math.round(budgetMs / 60000), sec: Math.round((Date.now() - t0) / 1000), yielded: !!(apWant || apMore), at: new Date().toISOString(), pc: PC || null, ver: VER } }, { merge: true }).catch(() => {}); } } }
  function vJudge(x, a, seen, found, nowIso, noRetry) { // 한 번 확인 결과로 목록·상품 페이지 확인 상태를 고침 (같은 규칙) · noRetry = 정밀 표본 상품 페이지(verifyPg)는 예전처럼 48시간에서 끝
    const n = (x.n || 0) + 1; const nx = vNextOf(a, noRetry ? { ...x, fine: (a.verify || {}).fine, rb: null } : x, (x.si || 0) + 1, noRetry); const base = { n, lastCheckAt: nowIso };
    if (found && seen === a.to) return { ...x, ...base, state: 'ok', seenAt: nowIso, seenPrice: seen, lagLoSec: Math.max(0, Math.round((Date.parse(x.lastMissAt || a.at) - Date.parse(a.at)) / 1000)), lagHiSec: Math.round((Date.now() - Date.parse(a.at)) / 1000), stallSec: pxlStall({ ...x, seenAt: nowIso }, a) }; /* (0.10.77) stallSec > 0 = 마지막 확인이 멈춤으로 늦음 → 평균에서 뺌 */
    const kind = !found ? 'notFound' : seen === a.from ? 'old' : 'other'; const cnt = { notFound: x.notFound || 0, old: x.old || 0, other: x.other || 0 }; cnt[kind]++;
    const fin = kind === 'other' ? 'other' : kind === 'notFound' ? 'notfound' : 'timeout'; return { ...x, ...base, ...cnt, lastSeenPrice: seen ?? null, lastMissAt: nowIso, ...(nx ? vNx(nx) : noRetry ? { state: fin, doneAt: nowIso } : { state: 'hand', why: fin, doneAt: nowIso }) }; }
  async function verifyBook(acts) { const nowIso = new Date().toISOString(); const a0 = acts[0]; const needList = acts.filter((a) => dueOf(a.verify));
    if (needList.length) { const mv = []; for (const a of needList) { if (!(a.verify || {}).rb) continue; const m = await vMoved(a); if (m) { a.verify = { ...a.verify, state: 'moved', doneAt: nowIso, note: m }; await vSave(a); mv.push(a); } } mv.forEach((a) => needList.splice(needList.indexOf(a), 1)); } /* 다시 확인 바퀴 — 뒤에 같은 상품 가격을 또 바꿨으면 이 확인은 그만(새 반영 확인이 이어 받음) */
    if (needList.length && !a0.aladinItemId) { let f = null; try { f = await vFindItem(a0); } catch (e) {} if (f) await vFill(acts, f); }
    if (needList.length && !a0.aladinItemId) { const c = VID.get(a0.key) || {}; /* 새상품 번호를 끝내 못 찾음 → 우리 상품 페이지 판매가로 확인 (끝내지 않음) */
      for (const a of needList) { const v = a.verify || {}; let pg = null, err = null; if (a.listingId) { try { pg = await vPage(a); } catch (e) { err = e.message; } } else err = '새상품 번호(ItemId)도 우리 상품번호도 없음';
        if (pg) a.verify = { ...vJudge(v, a, pg.price, pg.found, nowIso), via: 'page', noItem: { tried: c.tried || [], at: nowIso } };
        else { const nx = vNextOf(a, v, (v.si || 0) + 1); a.verify = nx ? { ...v, n: (v.n || 0) + 1, errs: (v.errs || 0) + 1, lastErr: err, lastCheckAt: nowIso, ...vNx(nx) } : { ...v, state: 'hand', why: 'noitem', doneAt: nowIso, lastErr: err }; } await vSave(a); } }
    else if (needList.length) { const rows = []; let err = null, pages = 0; let url = `/shop/UsedShop/wuseditemall.aspx?ItemId=${a0.aladinItemId}&TabType=0`;
      try { for (let pg = 1; pg <= 5 && url; pg++) { const doc = await aladinDoc(url); pages = pg; const u = P.parseUsedPage(doc); rows.push(...u.listings); if (needList.every((a) => rows.some((r) => vMatch(r, a)))) break;
          const nx = [...doc.querySelectorAll('.Ere_usedsell_num_box a')].find((x) => (x.textContent || '').trim() === String(pg + 1)); const h = nx && nx.getAttribute('href'); url = h && /wuseditemall/i.test(h) ? h : null; } } catch (e) { err = e.message; }
      for (const a of needList) { const v = a.verify || {}; if (err) { const nx = vNextOf(a, v, (v.si || 0) + 1); a.verify = nx ? { ...v, n: (v.n || 0) + 1, errs: (v.errs || 0) + 1, lastErr: err, lastCheckAt: nowIso, ...vNx(nx) } : { ...v, state: 'hand', why: 'timeout', doneAt: nowIso, lastErr: err }; }
        else { const r = rows.find((x) => vMatch(x, a)); let pg = null; if (!r && a.listingId && (v.notFound || 0) >= 1) { try { pg = await vPage(a); } catch (e) {} } /* (0.10.72) 목록에서 두 번째로 못 찾으면 우리 상품 페이지도 봄 — 거기 새 가격이면 공개 반영됨 */
          a.verify = pg && pg.found && pg.price === a.to ? { ...vJudge(v, a, pg.price, true, nowIso), pages, via: 'page' } : { ...vJudge(v, a, r ? r.price : null, !!r, nowIso), pages }; } await vSave(a); } }
    for (const a of acts) { if (!dueOf(a.verifyPg) || !a.listingId) continue; // 정밀 표본: 우리 상품 페이지 판매가
      let pr = null, err = null; try { pr = P.parseUsedItemPrice(await aladinDoc(`/shop/wproduct.aspx?ItemId=${a.listingId}`)); } catch (e) { err = e.message; }
      const x = a.verifyPg; if (err) { const nx = vNext(a.at, V_FINE, (x.si || 0) + 1); a.verifyPg = nx ? { ...x, n: (x.n || 0) + 1, errs: (x.errs || 0) + 1, lastErr: err, si: nx.si, next: nx.next } : { ...x, state: 'timeout', doneAt: nowIso }; }
      else a.verifyPg = vJudge(x, a, pr && pr.price, !!(pr && pr.price != null && (!pr.sellerCode || pr.sellerCode === '996008')), nowIso, true); await vSave(a); } }
  const pxlStall = (v, a) => { if (!v || !v.seenAt) return 0; const plan = Date.parse(v.next || ''), seen = Date.parse(v.seenAt); if (!(plan > 0) || !(seen > 0)) return 0; const prev = Date.parse(v.lastMissAt || (a && a.at) || '') || plan; const late = seen - plan; return late > Math.max(15 * 60e3, 0.5 * Math.max(0, plan - prev)) ? Math.round(late / 1000) : 0; };
  const vMatch = (r, a) => (r.listingId && a.listingId && String(r.listingId) === String(a.listingId)) || (r.usedCode && a.usedCode && r.usedCode === a.usedCode);

  /* ── (0.8.0) 감시 그룹: 수동 일괄 그룹 중 '감시 켬'(watch.on) — 그 그룹에서 첫 가격이 반영된 상품(결정 문서 watch.gid)을 매일 판정
   *  자동 = 지금의 판정 엔진(전체 설정, 계속 고쳐 감) · 반자동 = 이름 붙인 조건 묶음(SET.presets — 수동 일괄 기준 + 엔진 세부 + 추격자 전략)
   *  반영 방식: 관리자 승인(결정 대기) / 자동 반영(한도 % 안이고 하한 위일 때만 바로 '승인' — 넘으면 결정 대기)
   *  추격자 전략(양보·동가·그림자·끌어내린 뒤 빠지기·끌어올리기)은 판정 엔진 chaseStep 한 곳. 전략 진행 중인 상품은 every 시간마다 따로 다시 봄(followUps) */
  let WG = new Map(), WGAt = 0, BKF = null, BKC = null;
  async function wgLoad(force) { if (!force && Date.now() - WGAt < 5 * 60000) return WG; try { const q = await C('prd_price_batches').where('watch.on', '==', true).get(); const m = new Map(); q.forEach((d) => { const g = d.data(); if (g.shardOf || g.archived || (SET.batchOff || {})[d.id]) return; m.set(d.id, { id: d.id, name: g.name || d.id, cond: g.cond || {}, watch: g.watch || {}, n: Array.isArray(g.lastKeys) ? g.lastKeys.length : g.lastCount ?? null /* (판 러) 알림선 몫 셈 — 그룹 상품 수 */ }); }); WG = m; WGAt = Date.now(); try { const [fd, cd] = await Promise.all([C('prd_price_batches').doc('_bkfold').get(), C('prd_price_batches').doc('_bkfc').get()]); BKF = fd.exists ? fd.data() || null : null; BKC = cd.exists ? cd.data() || null : null; } catch (e) { BKF = null; BKC = null; } /* (판 카) 묶음 기본 전략·상품 개별 추격을 같은 5분 묶음 안에서 읽음 — 못 읽으면 예전처럼 그룹·전체만 */ } catch (e) { log('감시 그룹 읽기 실패: ' + e.message, 1); } return WG; }
  /* (0.10.69 strat5 · 정범님 I-1119-1717-22) 🌓 셈만 = 그룹 watch.firstTry가 있음(모양이 깨져도 셈만 — 분간 못 하면 안 쓰는 쪽) · 날짜·횟수로 끝나지 않음(noAuto) · 끝내기 = 웹앱 그룹 전략 창 「셈만 끝내기」+「적용」 두 번(firstTry 칸을 지움)뿐 */
  const wgDry = (w) => { if (!w || typeof w !== 'object') return true; const f = w.firstTry; return !(f === undefined || f === null || f === false); };
  /* (0.10.73 strat6 · 판 ⑨) 규칙 층 모으기 — 그룹 watch.rule > 📁 묶음 기본(ctl.def.rule) > 전체(prd_system/pricing.watchRule) · 판매자 예외 pol은 그룹·묶음 층(전체는 엔진 정책 SET.chaseEng) · 층이 하나도 없으면 null(= 예전 judge 그대로) */
  function ruleLayers(wg) { try { const w = (wg && wg.watch) || {}; let fd = null; if (BKF && BKF.folds) for (const [fid, f] of Object.entries(BKF.folds)) { if (!f || f.archived || !(f.gids || []).map(String).includes(String(wg.id))) continue; fd = (((BKF.ctl || {})[fid]) || f.ctrl || {}).def || null; break; }
      const ob = (x) => x && typeof x === 'object' && Object.keys(x).length ? x : null; const rf = CHE.ruleFor ? CHE.ruleFor({ group: w.rule, fold: fd && fd.rule, global: SET.watchRule }) : null; const rule = rf && ob(rf.v) ? rf.v : null; const polFold = ob(fd && fd.pol), polGroup = ob(w.pol); if (!rule && !polFold && !polGroup) return null; return { rule, polFold, polGroup }; } catch (e) { return null; } }
  /* ⚡ 빠른 추격자 문턱(기록용) — 기준 분 = 그룹 rule.detect.fastLagMin > 📁 묶음 기본 규칙 > (없음 = 웹앱 🔭 관찰 기준) · 사건 수 = 그룹 rule.detect.minEvents > chase.detect.minEvents > (없음 = 3) — 웹앱 ⚡ 칩(fastChaserOf)과 같은 차례 */
  function wgFastTh(wg) { const w = (wg && wg.watch) || {}; const nb = (v) => (v != null && v !== '' && Number.isFinite(+v) ? +v : null); const gd = (o) => (o && o.rule && o.rule.detect) || {}; let fl = nb(gd(w).fastLagMin), src = fl != null ? 'group' : 'obs';
    try { if (fl == null && BKF && BKF.folds) for (const [fid, f] of Object.entries(BKF.folds)) { if (!f || f.archived || !(f.gids || []).map(String).includes(String(wg.id))) continue; const v = nb(gd((((BKF.ctl || {})[fid]) || f.ctrl || {}).def).fastLagMin); if (v != null) { fl = v; src = 'fold'; } break; } } catch (e) {}
    const me = nb(gd(w).minEvents) ?? nb(w.chase && w.chase.detect && w.chase.detect.minEvents); return { fastLagMin: fl, minEvents: me, src }; }
  /* (0.10.62 · 판 러 · ctrlimp3 · CTRLDES3 2.3) ⏸ 묶음 자동 멈춤 — 묶음(_bkfold)마다 오늘 감시·추격자가 내린 합(원장 eng_fence_ledger 오늘 문서 · 10분 기억 · 새 쓰기 없음)이 알림선을 넘거나 추격자 붙은 상품이 문턱을 넘으면
   *  설정(prd_system/pricing.ctrlCfg · 묶음별 ctl[묶음].opt — 셈은 가격 코어 Ctrl)대로 알림만(ctl.alert) 또는 멈춤(ctl.pause) · 멈춘 묶음은 값을 내리는 자동 반영을 선택 대기로(올리기·시장 읽기는 그대로) · 다시 켜기는 웹앱 관제창 */
  let CTD = null, CTDAt = 0; const CHD = new Map();
  async function ctrlDay() { if (CTD && Date.now() - CTDAt < 10 * 60000 && CTD.day === kst(Date.now()).slice(0, 10)) return CTD; const day = kst(Date.now()).slice(0, 10); CTDAt = Date.now();
    try { const [ls, nw] = await Promise.all([C('eng_fence_ledger').doc(day).get(), C('app_settings').doc('eng_fence_now').get()]); CTD = { day, L: (ls.exists && ls.data()) || {}, dayLoss: ((nw.exists && nw.data()) || {}).dayLoss ?? null }; } catch (e) { CTD = { day, L: null, dayLoss: null, err: e.message }; } return CTD; }
  async function ctrlGate(gid, chased, key, now) { const F = PR.Ctrl; if (!F || !BKF || !gid) return null; const fo = F.foldOf(BKF, gid); if (!fo) return null;
    const ctl = (BKF.ctl || {})[fo.fid] || {}; const cfg = F.cfgNorm(SET.ctrlCfg || {}, ctl.opt || null); const D = await ctrlDay();
    if (!D.L) { const p = F.pauseLive(ctl, cfg, D.day); return p ? { fid: fo.fid, name: fo.name, pause: p, cfg, line: F.line(p) } : null; } /* 원장을 못 읽으면 걸린 멈춤만 지킴(새로 멈추지 않음) */
    const rAt = String((ctl.resume && ctl.resume.at) || ''); let ch = CHD.get(fo.fid); if (!ch || ch.at !== rAt || ch.day !== D.day) { ch = { at: rAt, day: D.day, keys: new Set() }; CHD.set(fo.fid, ch); } if (chased && key) ch.keys.add(key);
    let nFold = 0, nAll = 0, gFold = 0; for (const [id, g] of WG) { const n = +g.n || 0; nAll += n; if (fo.gids.includes(id)) { nFold += n; gFold++; } }
    const S0 = F.daySum(D.L, fo.gids); const lim = F.dayLimit(cfg, D.dayLoss, nFold, nAll, gFold, WG.size);
    let r = F.pauseCheck({ cfg, ctl, day: D.day, sum: S0.sum, n: S0.n, limit: lim.limit, chased: ch.keys.size, nFold, nowIso: now, by: 'auto:' + (PC || '?') });
    if (r.write) { try { const fd = await C('prd_price_batches').doc('_bkfold').get(); const f2 = fd.exists ? fd.data() || {} : {}; BKF.ctl = f2.ctl || {}; const c2 = BKF.ctl[fo.fid] || {}; /* 쓰기 전 한 번 새로 읽음 — 5분 기억 사이에 웹앱이 다시 켰으면 그 바탕(resume.base)으로 다시 셈 */
        if (String((c2.resume && c2.resume.at) || '') !== rAt || !!c2.pause !== !!ctl.pause) { const c3 = F.cfgNorm(SET.ctrlCfg || {}, c2.opt || null); r = F.pauseCheck({ cfg: c3, ctl: c2, day: D.day, sum: S0.sum, n: S0.n, limit: lim.limit, chased: String((c2.resume && c2.resume.at) || '') !== rAt ? 0 : ch.keys.size, nFold, nowIso: now, by: 'auto:' + (PC || '?') }); } } catch (e) { r = { ...r, write: null }; /* 못 읽으면 쓰지 않음 */ } }
    if (r.write) { const kind = r.write.pause ? 'pause' : 'alert'; const ent = { at: now, by: 'price-watch:' + (PC || '?'), kind, why: (r.write.pause || r.write.alert).why, sum: (r.write.pause || r.write.alert).sum, limit: lim.limit };
      try { await C('prd_price_batches').doc('_bkfold').set({ ctl: { [fo.fid]: { ...r.write, log: firebase.firestore.FieldValue.arrayUnion(ent) } } }, { merge: true }); { const c0 = (BKF.ctl || {})[fo.fid] || ctl; BKF.ctl = { ...(BKF.ctl || {}), [fo.fid]: { ...c0, ...r.write, log: [...(Array.isArray(c0.log) ? c0.log : []), ent] } }; }
        log(kind === 'pause' ? F.msgPause(fo.name, r.write.pause, F.recentPauses([...(ctl.log || []), ent], now)) : F.msgAlert(fo.name, r.write.alert), kind === 'pause' ? 1 : 0); } catch (e) { log('묶음 자동 멈춤 기록 실패: ' + e.message, 1); } }
    return r.pause ? { fid: fo.fid, name: fo.name, pause: r.pause, cfg, line: r.line } : null; }
  const presetOf = (g) => (g && g.watch && g.watch.presetId ? (SET.presets || {})[g.watch.presetId] || null : null);
  const stratOf = (g, pre) => (pre ? pre.chase || { name: 'yield' } : SET.autoChase || { name: 'yield' });
  /* (정범님 11/09 '추격자 전략을 그룹마다 따로') 어느 전략을 쓸까 = 판정 엔진 ReadnowChase.stratFor 한 곳(웹앱 그룹 감시 칸·결정 카드와 같은 판단)
   *  전체(SET.autoChase)가 기본 · 그룹 개별 전략(그룹 watch.chase)이 먼저 · 반자동이면 조건 묶음 전략 · 한 상품이 여러 감시 그룹에 걸리면(감시 그룹 ≠ 확정 대기 중인 다른 감시 그룹) 애매 → 전체
   *  옛 판정 엔진(stratFor 없음)이면 예전 stratOf 그대로 */
  function stratPick(wg, pre, prevD, WGm, key) { if (!wg) return null; const CH = PR && PR.Chase; if (!CH || !CH.stratFor) { const st = stratOf(wg, pre); return { strat: st, src: pre ? 'preset' : 'global', gid: wg.id, gname: wg.name, why: '', text: '' }; }
    const gOf = (g) => { const pr = g.watch && g.watch.mode === 'semi' ? presetOf(g) : null; return { id: g.id, name: g.name, chase: (g.watch && g.watch.chase) || null, preset: pr ? { name: pr.name || g.watch.presetId, chase: pr.chase || { name: 'yield' } } : null }; };
    const L = [gOf(wg)]; const ob = prevD && prevD.approval && prevD.approval.batchId ? String(prevD.approval.batchId) : null; if (ob && ob !== String(wg.id) && WGm && WGm.get(ob) && prevD.approvalState !== 'done') L.push(gOf(WGm.get(ob)));
    const X = {}; /* (판 카 · 정범님 I-1118-2344-32) 📌 상품 개별(_bkfc per[상품].chase) > 그룹 > 조건 묶음 > 📁 묶음 기본(_bkfold folds[].ctrl.def.chase) > 전체 — 판단은 엔진 stratFor 한 곳 */
    try { const pc = key && BKC && BKC.per && BKC.per[key] ? BKC.per[key].chase : null; if (pc === 'off') X.item = 'off'; else if (pc && typeof pc === 'object' && pc.name) X.item = pc; else if (typeof pc === 'string' && pc) X.item = { name: pc };
      const FO = BKF && BKF.folds ? BKF.folds : null; const ids = L.map((g) => String(g.id)); if (FO) for (const fid of (Array.isArray(BKF.order) ? BKF.order : []).filter((x) => FO[x]).concat(Object.keys(FO).filter((x) => !(BKF.order || []).includes(x)))) { const f = FO[fid]; if (!f || f.archived) continue; const gids = (f.gids || []).map(String); if (!ids.some((i) => gids.includes(i))) continue; X.fold = { id: fid, name: f.name || fid, gids, chase: (() => { const cc = ((BKF.ctl || {})[fid] || f.ctrl || {}).def || {}; const c = cc.chase; return c ? (typeof c === 'string' ? { name: c } : c.name ? { name: String(c.name) } : null) : null; })() }; /* (판 타) _bkfold ctl[fid] 먼저 · 옛 자리 folds[].ctrl */ break; } } catch (e) {}
    return CH.stratFor({ global: SET.autoChase || null, groups: L, ...X }); }
  async function chaseFor(key, bookId, now, detect) { try { const S0 = { chase: { ...PR.DEFAULTS.chase, ...((SET.engine || {}).chase || {}), ...(detect || {}) } }; const since = Date.now() - (S0.chase.releaseDays || 30) * 864e5;
      const [qa, qc] = await Promise.all([C('prd_price_actions').where('key', '==', key).get(), bookId ? C('prd_metric_changes').where('bookId', '==', bookId).get() : Promise.resolve({ docs: [] })]);
      const acts = qa.docs.map((d) => d.data()).filter((a) => a.at && Date.parse(a.at) > since); const chs = qc.docs.map((d) => d.data()).filter((c) => c.at && Date.parse(c.at) > since);
      if (!CHE) return { map: PR.chaseMap(acts, chs, now, S0), moves: {} }; const r = CHE.collect(acts, chs, now, S0); return { map: CHE.mapWithPolicy(r.map, SET.chaseEng), moves: r.moves }; } catch (e) { return null; } }
  /* (🎯 추격자 엔진 · 정범님 11/02) 추격 판단(찾기·관계·전략 고르기·한 걸음)은 판정 엔진 파일 안 ReadnowChase 한 곳 — 감시기는 부르고 기록만. 옛 판정 엔진(Chase 없음)이면 예전 길 그대로
   *  정책 = prd_system/pricing.chaseEng (웹앱 🎯 추격자 엔진 페이지 · 기본 꺼짐 → 예전 동작과 같음) · 기록(chaseEng.rec 기본 켬): chase_log(바뀐 것만 한 줄) · chase_eps(전략 한 판) · chase_rel/{판매자}(관계 요약) · chase_day/{날짜}(전략별 하루 수) */
  const CHE = PR && PR.Chase ? PR.Chase : null;
  /* (0.10.73 strat6 · 판 ⑨) 판매자 움직이는 때 — 엔진 relDelta(시각별 내림 hr · 내림 폭 cutSum/cutN · 우리 올림 뒤 따라 올림 upN · 우리가 떠난 뒤 올림 backN · 사라져 끝남 goneN)를 chase_rel 같은 문서에 칸만 더함(쓰기 횟수 그대로) */
  function relFields(prevS, L, FV) { try { const D = CHE.relDelta ? CHE.relDelta(prevS, L) : null; if (!D) return {}; const o = {}; if (D.hr != null) o.hr = { [String(D.hr)]: FV.increment(1) }; if (D.cut != null) { o.cutSum = FV.increment(D.cut); o.cutN = FV.increment(1); } if (D.up) o.upN = FV.increment(1); if (D.back) o.backN = FV.increment(1); if (D.gone) o.goneN = FV.increment(1); return o; } catch (e) { return {}; } }
  async function chaseRecord(J, x, prevS) { if (!CHE || !J || (SET.chaseEng && SET.chaseEng.rec === false)) return; try { const L = CHE.logEntry(prevS, J.chR, x); if (!L) return; const FV = firebase.firestore.FieldValue; const b = db.batch();
      b.set(C('chase_log').doc(), { ...L, ...W() }); const E = CHE.episode(prevS, J.chR, x); if (E) b.set(C('chase_eps').doc(E.id), { ...E.data, steps: FV.increment(1), ...W() }, { merge: true });
      if (L.sc) b.set(C('chase_rel').doc(String(L.sc)), { sc: L.sc, name: L.scName || null, who: L.who, stance: L.stance, lastAt: L.at, lastStrat: L.strat, n: FV.increment(1), moves: FV.increment(L.to != null && L.from != null && L.to !== L.from ? 1 : 0), books: { [String(L.bookId || L.key)]: { t: L.title, last: L.at, n: FV.increment(1) } }, ...(L.lag != null ? { lagSum: FV.increment(L.lag), lagN: FV.increment(1) } : {}), ...relFields(prevS, L, FV), ...W() }, { merge: true }); /* (0.10.63 판 서) 반응 시간 — 같은 문서에 칸만 더함(쓰기 횟수 그대로) */
      const sk = String(L.strat || 'none'); b.set(C('chase_day').doc(L.day), { day: L.day, [sk]: { steps: FV.increment(1), moves: FV.increment(L.to != null && L.from != null && L.to !== L.from ? 1 : 0), starts: FV.increment(!prevS || !prevS.active ? 1 : 0), ends: FV.increment(L.end ? 1 : 0) }, ...W() }, { merge: true });
      await b.commit(); } catch (e) { log('추격 기록 실패: ' + e.message, 1); } }
  function watchJudge(wg, pre, listing, market, sellers, ctx0, P1c, used, prevD, now, SP) { const strat = SP && SP.strat ? SP.strat : stratOf(wg, pre); /* (11/09) 그룹 개별 전략 — stratPick(판정 엔진 stratFor) */
    let S1 = pre ? PR.critSettings(pre.crit || {}, pre.eng || {}) : engineSettings(); const ch0 = { ...PR.DEFAULTS.chase, ...((S1 && S1.chase) || {}) };
    const SY = { ...S1, chase: { ...ch0, yield: { on: true, maxTier: 'T7' } } }, SN = { ...S1, chase: { ...ch0, yield: { on: false } } };
    const dY = PR.decide(listing, market, sellers, { ...ctx0, settings: SY }), dN = PR.decide(listing, market, sellers, { ...ctx0, settings: SN });
    const tOf = (d, P) => (pre ? PR.critTarget(listing, P, d, pre.crit || {}, { ...ctx0, settings: SN }, used.buyback || null) : { t: d.action === 'set' || d.status === 'ok' || d.status === 'floor' ? d.target ?? listing.price : null, reasons: d.reasons || [], floor: (d.floors && d.floors.applied) || 0 });
    const chaser = CHE ? CHE.find(P1c, ctx0.chase, listing.grade, SET.chaseEng) : PR.chaserOn(P1c, ctx0.chase, listing.grade); const bN = tOf(dN, P1c); const bY = chaser ? tOf(dY, P1c.filter((w) => String(w.sc || '') !== chaser.sellerCode)) : bN;
    const st0 = (prevD.watch && prevD.watch.startPrice) || null; const mdc = +((pre && pre.crit && pre.crit.maxDrop) || 0); const cumFloor = mdc > 0 && st0 > 0 ? Math.round(st0 * (1 - mdc / 100)) : 0; /* (10/30 위험 6) 최대 인하 %를 '감시 시작 가격부터 모두 합한' 한도로도 — 예전엔 한 번 크기만 막아 날마다 쌓여 내려감(모의: 10,000 → 6일 뒤 1,250) · 넘으면 '하한 아래'로 관리자 결정 대기 */
    const floor = Math.max(bN.floor || 0, (dN.floors && dN.floors.applied) || 0, cumFloor);
    const sIn = { strat, state: prevD.strat || null, now, cur: listing.price, base: bN.t != null ? bN.t : listing.price, yieldT: bY.t, chaser, floor, start: (prevD.watch && prevD.watch.startPrice) || listing.price };
    const JI = { ...sIn, policy: SET.chaseEng, groupStrat: strat, page1: P1c, moves: ctx0.chaseMoves || {}, grade: listing.grade, tier: dN.tier || null }; const RL = CHE && CHE.judgeRule ? ruleLayers(wg) : null;
    /* (0.10.73 strat6 · 판 ⑨) 규칙·판매자 예외 층(그룹>묶음>전체)이 하나라도 있으면 judgeRule로 판정 — 하나도 없거나 깨졌으면 엔진이 예전 judge와 같은 값을 냄 */
    let r; if (RL) { const dn = prevD.ruleSt && prevD.ruleSt.dayN || null; const sw = (prevD.watch && (prevD.watch.since || prevD.watch.at)) || (wg.watch && wg.watch.since) || null; const t0 = Date.parse(String(sw || '')); const days = Number.isFinite(t0) ? Math.max(0, Math.floor((Date.parse(now) - t0) / 86400e3)) : null; const mine = (g) => ({ '최상': 3, '상': 2, '중': 1, '하': 0 }[g]); const mg = mine(listing.grade);
      const facts = { list: Number.isFinite(+listing.priceList) ? +listing.priceList : null, comp: P1c.filter((w) => w && w.c !== 'ours' && (mg == null || mine(w.g) == null || mine(w.g) >= mg)).length, grade: listing.grade || null, tier: dN.tier || null, days, price: listing.price ?? null, edition: null, rarity: null, total: null, ourQty: null };
      try { r = CHE.judgeRule({ ...JI, rule: RL.rule, polFold: RL.polFold, polGroup: RL.polGroup, facts, dayN: dn, goneAt: (prevD.ruleSt && prevD.ruleSt.goneAt) || null, lastMoveAt: (prevD.strat && prevD.strat.lastMoveAt) || null, days }); } catch (e) { r = null; } } if (!r) r = CHE ? CHE.judge(JI) : PR.chaseStep(sIn); const sn = (r.state && r.state.name) || (r.plan && r.plan.strat && r.plan.strat.name) || strat.name || 'yield';
    const pl = r.plan || null; const who = pl && pl.who === 'specific' ? ` · 지정 판매자(${(CHE.STANCES || {})[pl.stance] || pl.stance})` : pl && pl.rule && !['group', 'tier'].includes(pl.rule) ? ` · 불특정 규칙(${(CHE.ANON_RULES || {})[pl.rule] || pl.rule})` : '';
    const head = `${pre ? `반자동 '${pre.name || wg.watch.presetId}'` : '자동(지금 엔진)'} · 그룹 '${wg.name}'${chaser ? ` · 추격자 전략: ${((CHE && CHE.STRATS_ALL) || PR.STRATS)[sn] || sn}${who}` : ''}${SP && SP.why ? ` · (${SP.why})` : ''}`;
    return { target: r.t != null ? r.t : bN.t, reasons: [head, ...(chaser ? r.reasons : []), ...(bN.reasons || []).slice(0, 8)], strat: r.state || null, chaser: chaser || null, floor, chR: r, start: sIn.start, chaseSrc: SP && SP.why ? { src: SP.src, gid: SP.gid, gname: SP.gname, name: (SP.strat || {}).name || null, why: SP.why } : null }; }
  async function followUps(max, inSlice) { if (!SET.enabled || SET.judgeOff) return; let L = []; try { const q = await C('prd_price_decisions').where('strat.active', '==', true).get(); L = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => Date.parse((x.strat || {}).nextAt || 0) <= Date.now()).slice(0, max); } catch (e) { return; }
    if (!L.length) return; if (!inSlice && !(await sliceOpen('추격자 다시 보기'))) return; if (!SHOP || SHOP.fee == null) await loadShop(); log(`추격자 전략 다시 보기 ${L.length}건`);
    for (const x of L) { if (stop || SET.killSwitch || !isMine()) return; if (!inSlice && sliceOver()) { await sliceClose(); log('추격자 다시 보기: 한 조각 시간을 다 써 쉼 — 남은 것은 쉰 뒤에'); return; } try { const l = (await C('prd_listings').doc(x.id).get()).data(); if (l && l.status === '판매중') await processOne(l); else await C('prd_price_decisions').doc(x.id).set({ strat: { ...(x.strat || {}), active: false, end: 'notOnSale', endedAt: new Date().toISOString() }, ...W() }, { merge: true }); } catch (e) { log(`전략 다시 보기 실패: ${x.title || x.id} — ${e.message}`, 1); } await sleep(GAP('read')); } }

  /* ── 매일 한 바퀴 (중단돼도 이어서) ── */
  async function runCycle() {
    let run = (await RREF.get()).data() || {};
    const fresh = run.cycleId && !run.doneAt && run.ver === VER;
    if (!fresh && run.doneAt && run.ver === VER && Date.now() - Date.parse(run.doneAt) < 20 * 3600e3) return false; // 하루 한 바퀴 (감시기 버전이 바뀌면 바로 새 바퀴)
    if (!(await sliceOpen(fresh ? `이어서 ${run.idx || 0}/${(run.keys || []).length}` : '새 바퀴'))) return false; /* (사람처럼 · 10/30 로봇 점검) 밤 쉼 · 조각 사이 쉼 · 🔬 실험이 수정 중이면 겹치지 않게 */
    if (!fresh) {
      const ss = await C('prd_listings').where('status', '==', '판매중').get(); const keys = [];
      ss.forEach((d) => { const l = d.data(); const grp = PR.groupOfListing(l, engineSettings()); if (grp === 'treat' || grp === 'control') keys.push(d.id); });
      { const gs = [...(await wgLoad(true)).keys()]; const on = new Set(ss.docs.map((d) => d.id)); for (let i = 0; i < gs.length; i += 10) { const q = await C('prd_price_decisions').where('watch.gid', 'in', gs.slice(i, i + 10)).get(); q.forEach((d) => { if (on.has(d.id)) keys.push(d.id); }); } } // (0.8.0) 감시 그룹 상품 (판매중만)
      keys.splice(0, keys.length, ...new Set(keys)); for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; } /* (사람처럼) 예전엔 늘 상품 번호 차례(keys.sort) — 바퀴마다 섞음(이어 하기는 저장한 차례 그대로) */ run = { cycleId: new Date().toISOString(), startedAt: new Date().toISOString(), keys, idx: 0, pc: PC, done: 0, fail: 0, ver: VER };
      await RREF.set({ ...run, doneAt: null, slice: { at: new Date(sliceT0).toISOString(), until: new Date(sliceT0 + HUM().sliceMs).toISOString(), by: PC }, ...W() }); log(`새 바퀴 시작: 감시 상품 ${keys.length}개`);
    }
    running = true; buttons(); await loadShop();
    try {
      for (let i = run.idx; i < run.keys.length; i++) {
        if (stop || SET.killSwitch || !isMine() || !SET.enabled || SET.judgeOff) { log('멈춤'); return true; }
        if (sliceOver() || quietNow()) { await RREF.set({ idx: i, done: run.done, fail: run.fail, lastAt: new Date().toISOString() }, { merge: true }); await sliceClose(); log(`한 조각 끝(${i}/${run.keys.length}) — ${quietNow() ? '밤 쉼' : '몇 분 쉬고'} 이어서`); prog(''); return true; } /* (사람처럼) 75초쯤 보고 1~10분 쉼 — 쉬는 동안에도 1분마다 확정 가격 반영·공개 확인은 그대로 */
        prog(`${i + 1} / ${run.keys.length} · 성공 ${run.done} · 실패 ${run.fail}`);
        const ld = await C('prd_listings').doc(run.keys[i]).get(); const l = ld.data();
        try { if (l && l.status === '판매중') { const r = await processOne(l); run.done++; if (/승인대기/.test(r)) log(`승인 대기: ${l.title || l.usedCode}`); } }
        catch (e) { run.fail++; log(`실패: ${(l && l.title) || run.keys[i]} — ${e.message}`, 1); }
        if ((i + 1) % 5 === 0 || i === run.keys.length - 1) await RREF.set({ idx: i + 1, done: run.done, fail: run.fail, lastAt: new Date().toISOString() }, { merge: true });
        if (i % 10 === 9 || apMore || apWant) { await loadSet(); await executeApproved(); if (i % 10 === 9) await followUps(5, true); } /* (0.10.74) 반영 대기가 남았으면 상품마다 반영부터 */
        await sleep(GAP('read'));
      }
      await RREF.set({ doneAt: new Date().toISOString(), idx: run.keys.length }, { merge: true }); log(`한 바퀴 끝: 성공 ${run.done} · 실패 ${run.fail}`); prog(''); await sliceClose();
    } finally { running = false; buttons(); }
    return true;
  }

  // ── 가격 감시는 '딱 한 PC의 딱 한 탭'에서만 ──
  // 탭 번호는 그 탭 안에만 보관(sessionStorage: 새로고침해도 같은 탭이면 그대로, 다른 탭·다른 PC는 다른 번호)
  // 어느 탭이든 '이 탭을 가격 감시 탭으로'를 누르면 Firestore에 그 탭이 적히고, 나머지 모든 탭·PC는 즉시 꺼짐(버튼·판정·반영 모두 정지)
  const TAB = (() => { let t = sessionStorage.getItem('pw_tab'); if (!t) { t = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('pw_tab', t); } return t; })();
  const isMine = () => SET.watchTab === TAB && SET.watchPc === PC;
  // 수집기가 '안전한 새로고침'으로 새 탭을 열었고 옛 탭이 가격 감시 탭이었으면, 새 탭이 조용히 이어받음 (10분 안, 같은 PC)
  async function adoptHandoff() { try { const h = JSON.parse(localStorage.getItem('rn-tab-handoff') || 'null'); if (!h || !h.pwTab || Date.now() - h.at > 10 * 60000 || h.pwTab === TAB) return; await loadSet();
    if (SET.watchTab === h.pwTab && SET.watchPc === PC) { await SREF.set({ watchTab: TAB, watchTabAt: new Date().toISOString(), watchBeat: new Date().toISOString(), ...W() }, { merge: true }); localStorage.removeItem('rn-tab-handoff'); log('수집기 새로고침으로 열린 새 탭 — 가격 감시를 이어받음'); } } catch (e) {} }
  // (0.5.0) 가격 감시는 정해 둔 PC(기본 JS-MAIN·HOME, 웹앱에서 바꿈) 중 한 곳의 한 탭에서만. 쓰던 탭이 15분 넘게 응답이 없으면 다른 허용 PC의 열린 탭이 저절로 이어받음
  const allowedPcs = () => (Array.isArray(SET.watchPcs) && SET.watchPcs.length ? SET.watchPcs : ['JS-MAIN', 'HOME']).map((x) => String(x).trim().toUpperCase());
  const pcOk = () => !!PC && allowedPcs().includes(PC.trim().toUpperCase());
  async function autoTake() { if (isMine() || !pcOk() || SET.killSwitch) return; const old = SET.watchBeat ? Date.now() - Date.parse(SET.watchBeat) : Infinity; if (SET.watchTab && old < 15 * 60000) return;
    let ok = false; try { await db.runTransaction(async (tx) => { const sn = await tx.get(SREF); const v = sn.data() || {}; const age = v.watchBeat ? Date.now() - Date.parse(v.watchBeat) : Infinity; if (v.watchTab && age < 15 * 60000) return; tx.set(SREF, { watchPc: PC, watchTab: TAB, watchTabAt: new Date().toISOString(), watchBeat: new Date().toISOString(), watchVer: VER, watchAuto: { from: v.watchPc || null, at: new Date().toISOString() } }, { merge: true }); ok = true; }); } catch (e) {}
    if (ok) { await loadSet(); log(`쓰던 감시 탭(${SET.watchAuto && SET.watchAuto.from || '없음'})이 15분 넘게 응답이 없어 이 탭이 이어받음`); paintOwner(); buttons(); tick(); } }
  async function takeOver() {
    if (!PC) return alert('이 PC 이름을 먼저 정하세요');
    if (!pcOk()) return alert(`가격 감시는 ${allowedPcs().join(' · ')} PC에서만 씁니다 (이 PC: ${PC}). 웹앱 가격 감시 칸에서 허용 PC를 바꿀 수 있습니다.`);
    const other = SET.watchTab && !isMine() ? `지금은 '${SET.watchPc || '?'}' PC의 다른 탭에서 쓰고 있습니다 (마지막 응답 ${SET.watchBeat ? Math.round((Date.now() - Date.parse(SET.watchBeat)) / 60000) + '분 전' : '모름'}).\n` : '';
    if (!confirm(`${other}이 탭을 가격 감시 탭으로 정할까요? 다른 모든 탭·PC의 가격 감시는 즉시 꺼집니다.`)) return;
    await SREF.set({ watchPc: PC, watchTab: TAB, watchTabAt: new Date().toISOString(), watchBeat: new Date().toISOString(), watchVer: VER, ...W() }, { merge: true }); await loadSet(); log('이 탭을 가격 감시 탭으로 정함'); paintOwner(); buttons(); tick();
  }
  (async () => { for (;;) { await sleep(120000); try { await autoTake(); } catch (e) {} if (isMine()) { try { await SREF.set({ watchBeat: new Date().toISOString(), watchVer: VER, watchCores: coreVers() }, { merge: true }); } catch (e) {} } } })(); // 살아 있음 표시 (2분마다)
  function paintOwner() {
    const mine = isMine(); box.style.opacity = mine ? '1' : '.55'; box.style.filter = mine ? '' : 'grayscale(1)';
    if (tabBtn) { tabBtn.style.opacity = mine ? '1' : '.5'; tabBtn.title = mine ? '가격 감시기 — 이 탭에서 작동 중' : `가격 감시기 — 꺼짐 (사용 중: ${SET.watchPc || '지정 안 됨'})`; }
    if (!mine) { stop = true; state(`<b>이 탭은 꺼져 있음</b><br>가격 감시 탭: ${SET.watchTab ? `'${SET.watchPc || '?'}' PC의 다른 탭 (마지막 응답 ${SET.watchBeat ? Math.round((Date.now() - Date.parse(SET.watchBeat)) / 60000) + '분 전' : '모름'})` : '아직 없음'}`, '#bbb'); buttons(); }
  }
  // 시작 전 점검: 감시기가 쓰는 저장 칸에 실제로 쓸 수 있는지 (규칙에 막히면 시작하지 않고 어디가 막혔는지 보여 줌)
  let rulesOk = false;
  async function checkRules() {
    const bad = [];
    for (const n of ['prd_market_watch', 'prd_price_decisions', 'prd_price_actions', 'prd_price_reviews', 'prd_price_batches', 'prd_metric_changes', 'rn_logs']) { try { await C(n).doc('_check_price_watch').set({ at: new Date().toISOString(), check: true, ...W() }, { merge: true }); } catch (e) { bad.push(`${n} (${e.code || e.message})`); } }
    if (bad.length) { state(`<b style="color:#B0322A">저장 권한 없음 — 시작하지 않음</b><br>${bad.join('<br>')}<br>Firestore 규칙에 이 칸 쓰기 허용 필요`); log('저장 권한 점검 실패: ' + bad.join(', '), 1); return false; }
    log('저장 권한 점검 통과'); return true;
  }
  let ticking = false;
  async function tick() {
    if (running || ticking) return; ticking = true;
    try {
      await loadSet(); buttons(); paintOwner(); if (!isMine()) return;
      if (!PC) { state('이 PC 이름을 먼저 정하세요'); return; }
      if (SET.watchVer !== VER) { try { await SREF.set({ watchVer: VER, watchBeat: new Date().toISOString(), watchCores: coreVers() }, { merge: true }); } catch (e) {} } // 웹앱이 '안전장치 있는 판인가'를 봄
      // (0.5.0) 꺼짐(멈춤) = 엔진 판정만 쉼 — 관리자가 확정한 가격(수동 일괄·직접 가격·승인·보류풀)은 계속 반영. 반영까지 멈추려면 '전체 정지'
      if (SET.killSwitch) { state('<b style="color:#B0322A">전체 정지</b> — 판정·반영 모두 멈춤 (웹앱에서 해제)'); return; }
      const judging = !!SET.enabled && !SET.judgeOff;
      state(judging ? `<b style="color:#1F5FAF">감시 중</b> · ${SET.phase || 'A'}단계 · 적용 ${(SET.rollout || {}).treatPct ?? 1}% / 비교 ${(SET.rollout || {}).controlPct ?? 0}%` : '<b style="color:#1F5FAF">반영만 하는 중</b> · 엔진 판정 쉼 (확정한 가격만 반영)');
      if (!rulesOk) { rulesOk = await checkRules(); if (!rulesOk) return; }
      stop = false; await executeApproved(); for (let k = 0; apMore && k < 500 && !stop && !SET.killSwitch && isMine(); k++) await executeApproved(); /* (0.10.75) 반영 대기가 남아 있는 동안은 반영만 — 공개 확인·판정 바퀴는 다 끝난 뒤 */ if (apMore || apWant) return; await verifyStep(60, 4 * 60000); if (!judging) return; await followUps(20); await runCycle();
    } catch (e) { log('오류: ' + e.message, 1); if (/permission/i.test(e.message)) state('<b style="color:#B0322A">Firestore 쓰기 권한 없음</b><br>규칙에 prd_price_decisions · prd_price_actions · prd_market_watch 허용 필요'); }
    finally { ticking = false; }
  }
  await adoptHandoff(); paintOwner(); buttons(); log('준비됨'); listingBackfill().catch(() => {}); pxlBackfillW().catch(() => {}); pxlLagFixW().catch(() => {}); roundFixOnce().catch(() => {}); tick(); (async () => { for (;;) { await sleep(60 * 1000); tick(); } })(); // 1분마다 (숨은 탭에서도)
  /* (0.10.33 정범님 11/04 '이유 없는 지연은 바로') 웹앱에서 가격을 승인하면 다음 1분 차례를 기다리지 않고 2초 뒤 바로 한 바퀴 — 승인 대기(approved) 결정을 듣기만 함(알라딘에 보내는 속도·사람다움 간격·실행 문은 그대로) · 1분 차례는 받침으로 남김 */
  try { C('prd_price_decisions').where('approvalState', 'in', ['approved', 'manual']).limit(20).onSnapshot((q) => { if (q.metadata && q.metadata.hasPendingWrites) return; if (!q.docChanges().some((c) => c.type === 'added')) return; apWant = true; clearTimeout(window.__rnPwSoon); window.__rnPwSoon = setTimeout(() => { tick(); }, 2000); }, () => {}); } catch (e) {}
})();