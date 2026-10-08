// ==UserScript==
// @name         리드나우 가격 감시기
// @namespace    readnow
// @version      0.9.0
// @description  판정 엔진으로 감시 묶음(적용·비교)의 온라인 중고 목록을 매일 보고 추천가를 기록하고, 웹앱에서 승인된 가격만 샵매니저에 반영합니다. 수집기와 완전히 따로 돕니다(작업 잠금·진행 기록·로그인 모두 따로, 로그인은 수집기에 맡김).
// @match        https://www.aladin.co.kr/scm/wrecord_edit.aspx*
// @noframes
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-core.js?v=1.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-sellers-core.js?v=1.3.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-products-core.js?v=0.13.0
// @require      https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/readnow-pricing-core.js?v=0.14.0
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
  const VER = '0.9.0';
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
  const GAP = () => 0; // (예전 고정 간격 — 이제 PACE가 대신함)
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
      try { const r = await fetch(url, { credentials: 'include' }); if (!r.ok) throw Object.assign(new Error('응답 ' + r.status), { status: r.status }); const html = await r.text(); PACE.ok(); return new DOMParser().parseFromString(html, 'text/html'); }
      catch (e) { PACE.fail(PACE.kindOf(e.status)); log(`알라딘 받기 실패(${e.message}) — 30초 뒤 다시`, 1); await sleep(30000); }
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
    if (ld) b.set(C('prd_metric_changes').doc(), { bookId: l.bookId, at: now, kind: 'usedListings', source: 'price-watch', add: ld.add, del: ld.del, chg: ld.chg, firstRecord: ld.first, lastPage: used.lastPage || null, ...W() });
    await b.commit();
    const mine = used.listings.find((r) => r.usedCode && r.usedCode === l.usedCode) || null; // 우리 매물은 상품코드로만 찾음 (같은 책 여러 권일 때 다른 권과 헷갈리지 않게)
    const listing = { ...l, key, price: mine ? mine.price : l.price, ship: mine && mine.ship != null ? mine.ship : SHOP.fee ?? undefined, /* 우리 매물이 첫 페이지에 없으면 우리 가게 배송비 정책(수집기가 매일 읽는 crm_system/shopPolicy) */ lowest: prevD.lowest || null, pendingChange: prevD.pendingChange || null };
    const sellers = await sellersFor(rows.map((r) => r.sellerCode));
    const WGm = await wgLoad(); const wg = prevD.watch && prevD.watch.gid ? WGm.get(prevD.watch.gid) || null : null; const pre = wg && wg.watch.mode === 'semi' ? presetOf(wg) : null; const watched = !!(wg && (wg.watch.mode !== 'semi' || pre));
    if (wg && wg.watch.mode === 'semi' && !pre) log(`반자동 조건 묶음(${wg.watch.presetId || '?'})이 없어 감시하지 않음: ${l.title || l.usedCode} — 웹앱에서 그룹의 조건 묶음을 다시 고르세요`, 1);
    const chase = await chaseFor(key, l.bookId, now, watched ? stratOf(wg, pre).detect : null); // (0.8.0) 추격자 찾기를 판정에 연결 (예전엔 엔진에 추격 규칙만 있고 자료를 넘기지 않아 양보가 한 번도 동작하지 않았음)
    const ctx = { now, core: Core, RS, chase, buyback: used.buyback || null, policy: { fee: mine && mine.ship != null ? mine.ship : SHOP.fee ?? null, freeOver: SHOP.freeOver ?? null }, settings: engineSettings(), yes24: prevD.yes24 && Date.now() - Date.parse(prevD.yes24.at) < 48 * 3600e3 ? prevD.yes24 : null };
    const market = { at: now, pagesSeen: 1, lastPage: used.lastPage || 1, rows, recentGone: gone };
    let d = PR.decide(listing, market, sellers, ctx);
    if (d.needYes24 && !ctx.yes24) { try { ctx.yes24 = await yes24For(l.isbn13 || book.isbn13); d = PR.decide(listing, market, sellers, ctx); log(`예스24 대조: ${l.title || l.usedCode} (${ctx.yes24.offers.length}개)`); } catch (e) { log(`예스24 실패: ${e.message}`, 1); } }
    // 블록의 ? 표시: 수집기 '경쟁 매물 유의사항·사진'이 모은 것 (유의 사항 글이 있거나 새상품과 다른 사진)
    const uinfo = {}; await Promise.all(used.listings.filter((r) => r.listingId).map(async (r) => { try { const x = (await C('prd_used_info').doc(String(r.listingId)).get()).data(); if (x) uinfo[r.listingId] = x; } catch (e) {} }));
    const settled = !['wait', 'skip'].includes(d.status);
    const lowest = settled ? PR.trackLowest(prevD.lowest || null, { at: now, atLowest: d.status === 'ok' && d.action === 'none' }) : prevD.lowest || null;
    const sig = `${d.status}|${d.action}|${d.target}|${d.ref ? d.ref.sellerCode + ':' + d.ref.price : ''}`;
    // 관리자 판정 기간(2026-10-04~): 적용 묶음은 판정 결과와 관계없이 모두 관리자에게 (유지·기다림·사람 확인도) → 모든 결정을 기록해 분석한 뒤 자동화
    const needApproval = d.group === 'treat' && d.status !== 'skip';
    // 관리자가 정한 것 중 아직 반영 안 된 것(승인·직접 가격·판매보류풀)은 새 판정이 절대 덮지 않음 — 반영이 먼저
    // 반영 끝났거나 유지·거절한 것은 시장이 그대로면(같은 판정) 그대로 두고, 시장이 바뀌면 다시 결정 대기로
    const waitingExec = ['approved', 'manual', 'hold', 'unhold'].includes(prevD.approvalState);
    const batchKeep = !prevD.watch && !!(prevD.approval && prevD.approval.decision === 'batch' && Date.now() - Date.parse(prevD.approval.at || 0) < 7 * 864e5); // (0.8.0) 감시 그룹에 든 상품은 첫 가격이 반영된 뒤부터 감시 // (0.5.0) 수동 일괄로 정한 상품은 7일 동안 엔진이 결정 대기로 되돌리지 않음 (확정 탭·원상복귀가 그대로 동작하게)
    const keepApproval = waitingExec || batchKeep || prevD.approvalState === 'applying' || (prevD.sig === sig && ['kept', 'rejected', 'done', 'cleared', 'cancelled'].includes(prevD.approvalState)); // (0.5.0) 비움·확정 취소도 시장이 그대로면 다시 올리지 않음 · 반영 중인 것은 절대 건드리지 않음
    const rec = { key, usedCode: l.usedCode, listingId: l.listingId || null, bookId: l.bookId, title: l.title || null, sku: l.sku || null, grade: l.grade || null, group: d.group, at: now, status: d.status, action: d.action,
      current: d.current ?? null, target: d.target ?? null, delta: d.delta ?? null, deltaPct: d.deltaPct ?? null, rule: d.rule || null, reasons: d.reasons, autoBlock: d.autoBlock, ref: d.ref || null, floors: d.floors || null, tier: d.tier || null,
      rows: (d.rows || []).map(([rank, sc, color, grade, price, ship, name]) => ({ rank, sc, color, grade, price, ship, name: name || null })), worseCheapest: d.worseCheapest || null, aladinItemId: book.aladinItemId || null, isbn13: l.isbn13 || book.isbn13 || null, page1: used.listings.map((r, i) => { const al = PR.isAladinSide(r, engineSettings()); const sd = r.sellerCode ? sellers['sc_' + r.sellerCode] : null; const ours = r.usedCode === l.usedCode || String(r.sellerCode) === PR.DEFAULTS.ourSeller;
        return { r: i + 1, n: r.sellerName || null, sc: r.sellerCode || null, g: r.grade || null, p: r.price ?? null, s: r.ship ?? null, c: ours ? 'ours' : al ? 'aladin' : r.sellerCode ? (sd ? Core.classifySellerDoc(sd, RS).cls : 'unknown') : 'unknown', lid: r.listingId || null, uc: r.usedCode || null, so: r.soldOut ? 1 : 0, ...(uinfo[r.listingId] ? { q: uinfo[r.listingId].hasNote || uinfo[r.listingId].photoDiff ? 1 : 0, qn: String(uinfo[r.listingId].note || '').slice(0, 120) || null, qp: uinfo[r.listingId].sellerPhotoCount || 0 } : {}) }; }), yes24Used: !!ctx.yes24, counts: d.counts || null, /* Firestore는 목록 안의 목록을 못 받음 → 줄마다 이름 붙인 칸으로 */ needYes24: !!d.needYes24, yes24: ctx.yes24 || null, lowest, sig, engine: PR.VERSION,
      approvalState: keepApproval ? prevD.approvalState : needApproval ? 'pending' : null, ...(keepApproval ? {} : { approval: null }), ...W() };
    if (watched) { const P1c = (rec.page1 || []).map((w) => ({ ...w })); const J = watchJudge(wg, pre, listing, market, sellers, ctx, P1c, used, prevD, now);
      const cur = listing.price; const chg = J.target != null && cur != null && J.target !== cur; const sg = (wg.watch.guardPct ?? 15);
      Object.assign(rec, { watchGid: wg.id, watchMode: wg.watch.mode, presetId: pre ? wg.watch.presetId : null, presetName: pre ? pre.name || null : null, status: J.target == null ? 'queue' : 'ok', action: J.target == null ? 'review' : chg ? 'set' : 'none', target: J.target, delta: chg ? J.target - cur : 0, deltaPct: chg && cur ? (J.target - cur) / cur : 0, reasons: J.reasons, strat: J.strat || null, chaser: J.chaser || null, floorW: J.floor || 0 });
      const keepW = waitingExec || prevD.approvalState === 'applying';
      if (!keepW) { if (chg) { const why = []; const pct = Math.abs(J.target - cur) / cur * 100; if (wg.watch.apply !== 'auto') why.push('관리자 승인 그룹'); else { if (pct > sg) why.push(`변경 ${pct.toFixed(1)}% > 자동 반영 한도 ${sg}%`); if (J.floor && J.target < J.floor) why.push('하한 아래'); if (PR.isExcluded(listing, engineSettings())) why.push('자동 제외 상품'); }
          if (!why.length) Object.assign(rec, { approvalState: 'approved', approval: { decision: 'auto', by: 'engine:' + wg.id, gid: wg.id, at: now, price: J.target, expectPrice: cur, reasons: J.reasons.slice(0, 6) }, autoBlock: [] });
          else Object.assign(rec, { approvalState: 'pending', approval: null, autoBlock: why }); }
        else { Object.assign(rec, { approvalState: prevD.approvalState === 'pending' ? null : prevD.approvalState || null }); if (prevD.approvalState !== 'pending') delete rec.approval; } }
      else Object.assign(rec, { approvalState: prevD.approvalState }); if (keepW) delete rec.approval; }
    if (!watched && prevD.strat && prevD.strat.active) rec.strat = { ...prevD.strat, active: false, end: 'notWatched', endedAt: now }; // 감시를 끄거나 뺀 상품의 전략은 끝냄 (다시 보기 목록에 계속 남지 않게)
    const b2 = db.batch(); b2.set(decRef, rec, { merge: true });
    if (prevD.sig !== sig) b2.set(decRef.collection('log').doc(), { at: now, sig, status: d.status, action: d.action, current: rec.current, target: rec.target, ref: rec.ref, reasons: d.reasons, ...W() }); // 바뀐 판정만 이력
    await b2.commit();
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
  const sameApproval = (a, b) => JSON.stringify([a && a.at, a && a.price, a && a.decision, a && a.batchId]) === JSON.stringify([b && b.at, b && b.price, b && b.decision, b && b.batchId]);
  async function claim(ref, x, kind) { let ok = false; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data(); if (!v || v.approvalState !== kind || !sameApproval(v.approval, x.approval)) return;
    const a = v.approval || {}; if (a.decision === 'batch' && a.batchId) { const cfg = (await tx.get(SREF)).data() || {}; if ((cfg.batchOff || {})[a.batchId] || cfg.killSwitch) return; } // (0.6.0) 그룹 끄기·전체 정지를 맡는 순간에 다시 확인 (트랜잭션 — 그 사이 꺼졌으면 맡지 않음)
    tx.update(ref, { approvalState: 'applying', applyingAt: new Date().toISOString(), applyingBy: `${PC}:${TAB}`, applyingFrom: kind }); ok = true; }); return ok; }
  async function settle(ref, x, patch, actionDoc) { let wrote = false; const aref = actionDoc ? C('prd_price_actions').doc() : null; settle.last = aref; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data() || {}; if (actionDoc) tx.set(aref, actionDoc); if (v.approvalState === 'applying' && v.applyingBy === `${PC}:${TAB}` && sameApproval(v.approval, x.approval)) { tx.set(ref, patch, { merge: true }); wrote = true; } else tx.set(ref, { lastExecAt: patch.executedAt || new Date().toISOString(), lastExecNote: (patch.execNote || '') + ' (그 사이 결정이 바뀌어 상태는 그대로 둠)' }, { merge: true }); }); return wrote; }
  async function unstick() { try { const q = await C('prd_price_decisions').where('approvalState', '==', 'applying').get(); for (const d of q.docs) { const v = d.data(); if (Date.now() - Date.parse(v.applyingAt || 0) < 10 * 60000) continue;
      await d.ref.set({ approvalState: 'blocked', execNote: `반영 중 멈춤(${v.applyingBy || '?'}, ${String(v.applyingAt || '').slice(5, 16).replace('T', ' ')}) — 알라딘에 들어갔는지 모름: 샵매니저에서 가격 확인 후 다시 결정`, execFailAt: new Date().toISOString(), ...W() }, { merge: true }); log(`반영 중 멈춘 결정을 막힘으로: ${v.title || v.usedCode}`, 1); } } catch (e) {} }
  async function executeApproved() {
    await unstick();
    const st = ['approved', 'manual', 'hold', 'unhold']; const docs = [];
    for (const k of st) { const q = await C('prd_price_decisions').where('approvalState', '==', k).get(); q.docs.forEach((d) => docs.push(d)); }
    if (!docs.length) return; log(`반영할 관리자 결정 ${docs.length}건`);
    const today = new Date().toISOString().slice(0, 10); let n = 0; // (0.6.0) 하루 반영 상한 없음 — 확정한 것은 모두 차례로 (정범 결정 2026-10-07)
    const offOf = (x) => { const a = x.approval || {}; return a.decision === 'batch' && a.batchId && (SET.batchOff || {})[a.batchId]; }; // (0.6.0) 꺼진 수동 일괄 그룹: 그 그룹이 확정한 것은 건드리지 않고 기다림 (설정은 실시간 — 도는 중에 꺼도 다음 상품부터)
    let offN = 0;
    const post = async (url, body) => { await PACE.wait(sleep); return fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, body }); };
    for (const d0 of docs) {
      if (stop || SET.killSwitch || !isMine()) return; const x = d0.data(); const kind = x.approvalState; const now = new Date().toISOString(); const d = d0;
      const fail = async (msg, block) => { const tries = (x.execTries || 0) + 1; if (!block && tries >= 3 && !/로그인/.test(msg)) { block = true; msg += ' (세 번 실패 — 더 보내지 않음)'; } await d.ref.set({ ...(block ? { approvalState: 'blocked' } : { approvalState: kind }), execTries: tries, execNote: `반영 ${block ? '안 함' : '실패'}: ${msg}`, execFailAt: now, ...W() }, { merge: true }); log(`반영 ${block ? '안 함' : '실패'}: ${x.title || x.usedCode} — ${msg}`, 1); };
      if (offOf(x)) { offN++; continue; }
      let got = false; try { got = await claim(d.ref, x, kind); } catch (e) { log('맡기 실패: ' + e.message, 1); continue; } if (!got) { log(`그 사이 결정이 바뀌어 건너뜀: ${x.title || x.usedCode}`); continue; }
      // ↓ 맡은(반영 중) 뒤에 확인 — 확인하다 막을 때도 그 사이 바뀐 다른 결정을 덮지 않음
      if (!x.listingId) { await d.ref.set({ approvalState: 'blocked', execNote: '샵매니저 상품번호(ItemId)가 없음', ...W() }, { merge: true }); continue; }
      if (x.group === 'control') { await d.ref.set({ approvalState: 'blocked', execNote: '비교 묶음은 바꾸지 않음(효과 측정용)', ...W() }, { merge: true }); continue; }
      if (kind === 'approved') { // 엔진 제안 승인: 옛 엔진·오래된 판정이면 반영하지 않음 (관리자가 직접 정한 가격·보류풀은 그대로 반영)
        if (x.engine !== PR.VERSION) { await d.ref.set({ approvalState: 'stale', execNote: `옛 판정 엔진(${x.engine || '?'})의 제안 — 새 판정 후 다시 결정`, ...W() }, { merge: true }); continue; }
        if (Date.now() - Date.parse(x.at) > 48 * 3600e3) { await d.ref.set({ approvalState: 'stale', execNote: '판정이 48시간 넘게 지남 — 다시 판정 후 결정', ...W() }, { merge: true }); continue; }
        if (PR.isExcluded({ sku: x.sku }, engineSettings())) { await d.ref.set({ approvalState: 'blocked', execNote: `${x.sku}: 자동 감시 제외 코드 — 직접 가격으로 결정하세요`, ...W() }, { merge: true }); continue; }
        const apA = x.approval || {}; if (apA.decision === 'auto') { const gA = (await wgLoad()).get(apA.gid); if (!gA || gA.watch.apply !== 'auto') { await d.ref.set({ approvalState: 'pending', approval: null, execNote: '자동 반영이 꺼진 그룹 — 결정 대기로', ...W() }, { merge: true }); continue; } // (0.8.0) 판정 뒤 그룹의 자동 반영을 껐으면 반영하지 않음
          try { const L0 = (await C('prd_listings').doc(x.key).get()).data(); if (L0 && L0.lastSeenAt && String(L0.lastSeenAt) > String(apA.at) && apA.expectPrice != null && L0.price != null && +L0.price !== +apA.expectPrice && +L0.price !== +apA.price) { await fail(`판정 뒤 다른 곳에서 가격이 바뀜 (판정 때 ${(+apA.expectPrice).toLocaleString()} → 지금 ${(+L0.price).toLocaleString()})`, true); continue; } if (L0 && L0.lastSeenAt && String(L0.lastSeenAt) > String(apA.at) && L0.status && L0.status !== '판매중') { await fail(`판정 뒤 상품 상태가 '${L0.status}'로 바뀜`, true); continue; } } catch (e) {} }
      }
      if (kind === 'manual') { // 관리자 가격·수동 일괄: 적은 가격만, 결정 뒤 상품 상태·가격이 바뀌었으면 막음
        const ap = x.approval || {}; const p0 = Math.round(+ap.price);
        if (!(p0 >= 10)) { await fail('관리자가 정한 가격이 없음 (엔진 추천가로 대신하지 않음)', true); continue; }
        if (!ap.at || Date.now() - Date.parse(ap.at) > 72 * 3600e3) { await d.ref.set({ approvalState: 'stale', execNote: '결정한 지 72시간이 넘음 — 시장이 바뀌었을 수 있어 반영하지 않음, 다시 확인 후 결정', ...W() }, { merge: true }); log(`오래된 결정이라 반영 안 함: ${x.title || x.usedCode}`, 1); continue; }
        try { const L = (await C('prd_listings').doc(x.key).get()).data(); const seenAfter = L && L.lastSeenAt && String(L.lastSeenAt) > String(ap.at);
          if (L && seenAfter && L.status && L.status !== '판매중') { await fail(`결정 뒤 상품 상태가 '${L.status}'로 바뀜`, true); continue; }
          if (L && seenAfter && ap.expectPrice != null && L.price != null && +L.price !== +ap.expectPrice && +L.price !== p0) { await fail(`결정 뒤 다른 곳에서 가격이 바뀜 (결정 때 ${(+ap.expectPrice).toLocaleString()} → 지금 ${(+L.price).toLocaleString()})`, true); continue; } } catch (e) {}
      }
      if (kind === 'unhold') { // 판매보류풀 해제(원상복귀): 원래 관리코드 → 판매중
        const orig = (x.approval && x.approval.sku) || (x.holdInfo && x.holdInfo.origSku); if (!orig) { await fail('원래 관리코드 기록이 없음'); continue; }
        let r1; try { r1 = P.parseAjaxResult(await (await post('/scm/ajaxCmd.aspx', P.scmAction.supCode(x.listingId, orig).body)).text()); } catch (e) { r1 = { ok: false, error: e.message }; }
        if (!r1.ok) { await fail('관리코드 되돌리기 ' + r1.error); if (/로그인/.test(r1.error || '')) return; continue; }
        await sleep(1500); let ok2 = false, err2 = ''; try { const r2 = await post('/scm/wrecord_edit_usedbatch.aspx', P.scmAction.status('일시판매중지', '판매중', [x.listingId]).body); ok2 = r2.ok; err2 = '응답 ' + r2.status; } catch (e) { err2 = e.message; }
        if (!ok2) { await fail(`관리코드는 ${orig}로 돌렸지만 판매중 변경 실패(${err2}) — 샵매니저에서 확인`); continue; }
        n++; await settle(d.ref, x, { approvalState: 'done', executedAt: now, execNote: `판매보류풀 해제: 관리코드 ${orig}, 판매중`, holdInfo: null, ...W() }, { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, kind: 'unhold', fromSku: PR.skuWith(orig, 'hold'), toSku: orig, fromStatus: '일시판매중지', toStatus: '판매중', at: now, day: today, by: (x.approval && x.approval.by) || null, pc: PC, engine: PR.VERSION, ...W() }); log(`판매보류풀 해제: ${x.title || x.usedCode} (→ ${orig}, 판매중)`); await sleep(GAP()); continue;
      }
      if (kind === 'hold') { // 판매보류풀: 관리코드 뒤 3자리 PND → 판매상태 일시판매중지
        const newSku = PR.skuWith(x.sku, 'hold'); if (!newSku) { await fail('관리코드가 없어 PND로 바꿀 수 없음'); continue; }
        let r1; try { r1 = P.parseAjaxResult(await (await post('/scm/ajaxCmd.aspx', P.scmAction.supCode(x.listingId, newSku).body)).text()); } catch (e) { r1 = { ok: false, error: e.message }; }
        if (!r1.ok) { await fail('관리코드 변경 ' + r1.error); if (/로그인/.test(r1.error || '')) return; continue; }
        await sleep(1500);
        let ok2 = false, err2 = ''; try { const r2 = await post('/scm/wrecord_edit_usedbatch.aspx', P.scmAction.status('판매중', '일시판매중지', [x.listingId]).body); ok2 = r2.ok; err2 = '응답 ' + r2.status; } catch (e) { err2 = e.message; }
        if (!ok2) { await fail(`관리코드는 ${newSku}로 바뀌었지만 일시판매중지 변경 실패(${err2}) — 샵매니저에서 확인`); continue; }
        n++; await settle(d.ref, x, { approvalState: 'done', executedAt: now, execNote: `판매보류풀로 옮김: ${x.sku} → ${newSku}, 일시판매중지`, holdInfo: { origSku: x.sku || null, minPrice: (x.approval && x.approval.price) || null, at: now }, ...W() }, { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, grade: x.grade || null, aladinItemId: x.aladinItemId || null, kind: 'hold', fromSku: x.sku || null, toSku: newSku, fromStatus: '판매중', toStatus: '일시판매중지', from: x.current ?? null, to: x.current ?? null, minPrice: (x.approval && x.approval.price) || null, at: now, day: today, by: (x.approval && x.approval.by) || null, pc: PC, engine: PR.VERSION, ...W() }); log(`판매보류풀: ${x.title || x.usedCode} (${x.sku} → ${newSku}, 일시판매중지)`); await sleep(GAP()); continue;
      }
      const price = Math.round(kind === 'manual' ? +(x.approval && x.approval.price) : (x.approval && x.approval.price) || x.target); if (!(price >= 10)) { await fail('가격이 없음', true); continue; } // (0.5.0) 관리자 가격은 적은 가격만
      let res; try { await PACE.wait(sleep); const r = await fetch(P.scmAction.price(x.listingId, price).url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } }); res = P.parseAjaxResult(await r.text()); } catch (e) { res = { ok: false, error: e.message }; }
      if (res.ok) PACE.ok(); else PACE.fail(/로그인/.test(res.error || '') ? 'login' : 'error');
      if (res.ok && parseInt(String(res.value || '').replace(/\D/g, ''), 10) !== price) res = { ok: false, error: `알라딘이 돌려준 값(${res.value})이 보낸 가격(${price})과 다름` };
      if (!res.ok) { await fail(res.error, /돌려준 값/.test(res.error || '')); /* 알라딘이 다른 값으로 받았으면 다시 보내지 않음 */ if (/로그인/.test(res.error || '')) { state('<b style="color:#B0322A">알라딘 로그인 풀림</b> — 수집기가 다시 로그인할 때까지 기다림'); return; } continue; }
      n++; const fromP = (x.approval && x.approval.expectPrice != null ? x.approval.expectPrice : x.current) ?? null;
      const fine = Math.random() < 0.1; const vNew = { state: 'wait', n: 0, si: 0, fine, next: new Date(Date.parse(now) + (fine ? V_FINE : V_STEPS)[0] * 60000).toISOString() }; const actDoc = { key: x.key, usedCode: x.usedCode, listingId: x.listingId, title: x.title, grade: x.grade || null, aladinItemId: x.aladinItemId || null, from: fromP, to: price, engineTarget: x.target ?? null, kind: (x.approval && x.approval.decision) || kind, batchId: (x.approval && x.approval.batchId) || null, batchName: (x.approval && x.approval.batchName) || null, at: now, day: today, kst: kstOf(now), confirmedAt: (x.approval && x.approval.at) || null, by: (x.approval && x.approval.by) || null, pc: PC, result: res.value, engine: PR.VERSION, verify: vNew, ...(fine && x.listingId ? { verifyPg: { state: 'wait', n: 0, si: 0, next: vNew.next } } : {}), ...W() };
      const ap0 = x.approval || {}; const wgA = ap0.decision === 'batch' && ap0.batchId ? (await wgLoad()).get(ap0.batchId) : null; // (0.8.0) 감시 켠 그룹의 첫 가격이 반영되면 그 상품은 이제부터 그 그룹으로 감시
      const enroll = wgA ? { watch: { gid: wgA.id, since: now, startPrice: fromP, by: ap0.by || null } } : {};
      try { await settle(d.ref, x, { approvalState: 'done', executedAt: now, pendingChange: { at: now, price }, execNote: `반영됨 (알라딘 답: ${res.value})`, ...enroll, ...W() }, actDoc); if (VQ && settle.last) VQ.push({ id: settle.last.id, ref: settle.last, ...actDoc }); }
      catch (e) { log(`⚠ 알라딘에는 ${price.toLocaleString()}원으로 들어갔지만 기록 저장 실패: ${x.title || x.usedCode} — ${e.message} (10분 뒤 '막힘 — 확인'으로 표시됨)`, 1); continue; } log(`가격 반영: ${x.title || x.usedCode} ${(x.current || 0).toLocaleString()} → ${price.toLocaleString()}`);
      await sleep(GAP()); await verifyStep(2, 30000); // (0.7.0) 반영하는 사이사이 공개 반영 확인도 (확인 때가 된 것만)
    }
    if (offN) log(`꺼진 수동 일괄 그룹의 확정 ${offN}건은 반영하지 않고 기다림 (웹앱에서 그룹을 켜면 반영)`); void n;
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
  function vNext(at, steps, si) { const t0 = Date.parse(at); for (let j = si; j < steps.length; j++) { const tt = t0 + steps[j] * 60000; if (tt > Date.now() + 60000) return { si: j, next: new Date(tt).toISOString() }; } return null; } // 지금 이후 첫 확인 때 (놓친 때는 건너뜀)
  let VQ = null, VQAt = 0, vqBusy = false;
  async function vqLoad() { if (VQ && Date.now() - VQAt < 10 * 60000) return;
    const [q, qp] = await Promise.all([C('prd_price_actions').where('verify.state', '==', 'wait').get(), C('prd_price_actions').where('verifyPg.state', '==', 'wait').get()]); const M = new Map(); [...q.docs, ...qp.docs].forEach((d) => M.set(d.id, { id: d.id, ref: d.ref, ...d.data() })); const L = [...M.values()];
    if (!VQ) { try { const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString().slice(0, 10); const q2 = await C('prd_price_actions').where('day', 'in', [ago(0), ago(24), ago(48)]).get(); // 0.7.0 전 반영분 (48시간 안)
        for (const d of q2.docs) { const a = d.data(); if (a.verify || a.to == null || !a.at || Date.now() - Date.parse(a.at) > 48 * 3600e3 || ['hold', 'unhold'].includes(a.kind) || M.has(d.id)) continue; const v = { state: 'wait', n: 0, late: true, si: 0, next: new Date().toISOString() }; await d.ref.set({ verify: v, kst: kstOf(a.at), ...W() }, { merge: true }); L.push({ id: d.id, ref: d.ref, ...a, verify: v }); } } catch (e) { log('공개 반영 확인 — 예전 반영분 읽기 실패: ' + e.message, 1); } }
    VQ = L; VQAt = Date.now(); }
  const vWaiting = (a) => (a.verify && a.verify.state === 'wait') || (a.verifyPg && a.verifyPg.state === 'wait');
  async function vSave(a) { try { await a.ref.set({ verify: a.verify, ...(a.verifyPg ? { verifyPg: a.verifyPg } : {}), ...W() }, { merge: true }); } catch (e) { log('공개 반영 확인 저장 실패: ' + e.message, 1); } if (!vWaiting(a) && VQ) { const i = VQ.indexOf(a); if (i >= 0) VQ.splice(i, 1); } }
  const dueOf = (x) => x && x.state === 'wait' && Date.parse(x.next || 0) <= Date.now();
  async function verifyStep(max, budgetMs) { if (vqBusy) return; vqBusy = true; const t0 = Date.now();
    try { await vqLoad(); const due = VQ.filter((a) => dueOf(a.verify) || dueOf(a.verifyPg)).sort((a, b) => String(Math.min(Date.parse((a.verify || {}).next || 9e15), Date.parse((a.verifyPg || {}).next || 9e15))).localeCompare(String(Math.min(Date.parse((b.verify || {}).next || 9e15), Date.parse((b.verifyPg || {}).next || 9e15))))); let n = 0;
      while (due.length && n < max && Date.now() - t0 < budgetMs) { if (stop || SET.killSwitch || !isMine()) break; const a = due.shift(); n++; const same = a.aladinItemId ? due.filter((b) => b.aladinItemId === a.aladinItemId && dueOf(b.verify)) : []; same.forEach((b) => due.splice(due.indexOf(b), 1)); await verifyBook([a, ...same]); }
    } catch (e) { log('공개 반영 확인 오류: ' + e.message, 1); } finally { vqBusy = false; } }
  function vJudge(x, a, seen, found, nowIso) { // 한 번 확인 결과로 목록·상품 페이지 확인 상태를 고침 (같은 규칙)
    const n = (x.n || 0) + 1; const steps = vSteps(a.verify); const nx = vNext(a.at, steps, (x.si || 0) + 1); const base = { n, lastCheckAt: nowIso };
    if (found && seen === a.to) return { ...x, ...base, state: 'ok', seenAt: nowIso, seenPrice: seen, lagLoSec: Math.max(0, Math.round((Date.parse(x.lastMissAt || a.at) - Date.parse(a.at)) / 1000)), lagHiSec: Math.round((Date.now() - Date.parse(a.at)) / 1000) };
    const kind = !found ? 'notFound' : seen === a.from ? 'old' : 'other'; const cnt = { notFound: x.notFound || 0, old: x.old || 0, other: x.other || 0 }; cnt[kind]++;
    return { ...x, ...base, ...cnt, lastSeenPrice: seen ?? null, lastMissAt: nowIso, ...(nx ? { si: nx.si, next: nx.next } : { state: kind === 'other' ? 'other' : kind === 'notFound' ? 'notfound' : 'timeout', doneAt: nowIso }) }; }
  async function verifyBook(acts) { const nowIso = new Date().toISOString(); const a0 = acts[0]; const needList = acts.filter((a) => dueOf(a.verify));
    if (needList.length && !a0.aladinItemId) { for (const a of needList) { a.verify = { ...a.verify, state: 'noitem', doneAt: nowIso, note: '새상품 번호(ItemId)가 없어 온라인 중고 목록을 열 수 없음' }; await vSave(a); } }
    else if (needList.length) { const rows = []; let err = null, pages = 0; let url = `/shop/UsedShop/wuseditemall.aspx?ItemId=${a0.aladinItemId}&TabType=0`;
      try { for (let pg = 1; pg <= 5 && url; pg++) { const doc = await aladinDoc(url); pages = pg; const u = P.parseUsedPage(doc); rows.push(...u.listings); if (needList.every((a) => rows.some((r) => vMatch(r, a)))) break;
          const nx = [...doc.querySelectorAll('.Ere_usedsell_num_box a')].find((x) => (x.textContent || '').trim() === String(pg + 1)); const h = nx && nx.getAttribute('href'); url = h && /wuseditemall/i.test(h) ? h : null; } } catch (e) { err = e.message; }
      for (const a of needList) { const v = a.verify || {}; if (err) { const nx = vNext(a.at, vSteps(v), (v.si || 0) + 1); a.verify = nx ? { ...v, n: (v.n || 0) + 1, errs: (v.errs || 0) + 1, lastErr: err, si: nx.si, next: nx.next } : { ...v, state: 'timeout', doneAt: nowIso, lastErr: err }; }
        else { const r = rows.find((x) => vMatch(x, a)); a.verify = { ...vJudge(v, a, r ? r.price : null, !!r, nowIso), pages }; } await vSave(a); } }
    for (const a of acts) { if (!dueOf(a.verifyPg) || !a.listingId) continue; // 정밀 표본: 우리 상품 페이지 판매가
      let pr = null, err = null; try { pr = P.parseUsedItemPrice(await aladinDoc(`/shop/wproduct.aspx?ItemId=${a.listingId}`)); } catch (e) { err = e.message; }
      const x = a.verifyPg; if (err) { const nx = vNext(a.at, V_FINE, (x.si || 0) + 1); a.verifyPg = nx ? { ...x, n: (x.n || 0) + 1, errs: (x.errs || 0) + 1, lastErr: err, si: nx.si, next: nx.next } : { ...x, state: 'timeout', doneAt: nowIso }; }
      else a.verifyPg = vJudge(x, a, pr && pr.price, !!(pr && pr.price != null && (!pr.sellerCode || pr.sellerCode === '996008')), nowIso); await vSave(a); } }
  const vMatch = (r, a) => (r.listingId && a.listingId && String(r.listingId) === String(a.listingId)) || (r.usedCode && a.usedCode && r.usedCode === a.usedCode);

  /* ── (0.8.0) 감시 그룹: 수동 일괄 그룹 중 '감시 켬'(watch.on) — 그 그룹에서 첫 가격이 반영된 상품(결정 문서 watch.gid)을 매일 판정
   *  자동 = 지금의 판정 엔진(전체 설정, 계속 고쳐 감) · 반자동 = 이름 붙인 조건 묶음(SET.presets — 수동 일괄 기준 + 엔진 세부 + 추격자 전략)
   *  반영 방식: 관리자 승인(결정 대기) / 자동 반영(한도 % 안이고 하한 위일 때만 바로 '승인' — 넘으면 결정 대기)
   *  추격자 전략(양보·동가·그림자·끌어내린 뒤 빠지기·끌어올리기)은 판정 엔진 chaseStep 한 곳. 전략 진행 중인 상품은 every 시간마다 따로 다시 봄(followUps) */
  let WG = new Map(), WGAt = 0;
  async function wgLoad(force) { if (!force && Date.now() - WGAt < 5 * 60000) return WG; try { const q = await C('prd_price_batches').where('watch.on', '==', true).get(); const m = new Map(); q.forEach((d) => { const g = d.data(); if (g.shardOf || g.archived || (SET.batchOff || {})[d.id]) return; m.set(d.id, { id: d.id, name: g.name || d.id, cond: g.cond || {}, watch: g.watch || {} }); }); WG = m; WGAt = Date.now(); } catch (e) { log('감시 그룹 읽기 실패: ' + e.message, 1); } return WG; }
  const presetOf = (g) => (g && g.watch && g.watch.presetId ? (SET.presets || {})[g.watch.presetId] || null : null);
  const stratOf = (g, pre) => (pre ? pre.chase || { name: 'yield' } : SET.autoChase || { name: 'yield' });
  async function chaseFor(key, bookId, now, detect) { try { const S0 = { chase: { ...PR.DEFAULTS.chase, ...((SET.engine || {}).chase || {}), ...(detect || {}) } }; const since = Date.now() - (S0.chase.releaseDays || 30) * 864e5;
      const [qa, qc] = await Promise.all([C('prd_price_actions').where('key', '==', key).get(), bookId ? C('prd_metric_changes').where('bookId', '==', bookId).get() : Promise.resolve({ docs: [] })]);
      const acts = qa.docs.map((d) => d.data()).filter((a) => a.at && Date.parse(a.at) > since); const chs = qc.docs.map((d) => d.data()).filter((c) => c.at && Date.parse(c.at) > since); return PR.chaseMap(acts, chs, now, S0); } catch (e) { return null; } }
  function watchJudge(wg, pre, listing, market, sellers, ctx0, P1c, used, prevD, now) { const strat = stratOf(wg, pre);
    let S1 = pre ? PR.critSettings(pre.crit || {}, pre.eng || {}) : engineSettings(); const ch0 = { ...PR.DEFAULTS.chase, ...((S1 && S1.chase) || {}) };
    const SY = { ...S1, chase: { ...ch0, yield: { on: true, maxTier: 'T7' } } }, SN = { ...S1, chase: { ...ch0, yield: { on: false } } };
    const dY = PR.decide(listing, market, sellers, { ...ctx0, settings: SY }), dN = PR.decide(listing, market, sellers, { ...ctx0, settings: SN });
    const tOf = (d, P) => (pre ? PR.critTarget(listing, P, d, pre.crit || {}, { ...ctx0, settings: SN }, used.buyback || null) : { t: d.action === 'set' || d.status === 'ok' || d.status === 'floor' ? d.target ?? listing.price : null, reasons: d.reasons || [], floor: (d.floors && d.floors.applied) || 0 });
    const chaser = PR.chaserOn(P1c, ctx0.chase, listing.grade); const bN = tOf(dN, P1c); const bY = chaser ? tOf(dY, P1c.filter((w) => String(w.sc || '') !== chaser.sellerCode)) : bN;
    const floor = Math.max(bN.floor || 0, (dN.floors && dN.floors.applied) || 0);
    const r = PR.chaseStep({ strat, state: prevD.strat || null, now, cur: listing.price, base: bN.t != null ? bN.t : listing.price, yieldT: bY.t, chaser, floor, start: (prevD.watch && prevD.watch.startPrice) || listing.price });
    const head = `${pre ? `반자동 '${pre.name || wg.watch.presetId}'` : '자동(지금 엔진)'} · 그룹 '${wg.name}'${chaser ? ` · 추격자 전략: ${PR.STRATS[strat.name || 'yield'] || strat.name}` : ''}`;
    return { target: r.t != null ? r.t : bN.t, reasons: [head, ...(chaser ? r.reasons : []), ...(bN.reasons || []).slice(0, 8)], strat: r.state || null, chaser: chaser || null, floor }; }
  async function followUps(max) { if (!SET.enabled || SET.judgeOff) return; let L = []; try { const q = await C('prd_price_decisions').where('strat.active', '==', true).get(); L = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => Date.parse((x.strat || {}).nextAt || 0) <= Date.now()).slice(0, max); } catch (e) { return; }
    if (!L.length) return; if (!SHOP || SHOP.fee == null) await loadShop(); log(`추격자 전략 다시 보기 ${L.length}건`);
    for (const x of L) { if (stop || SET.killSwitch || !isMine()) return; try { const l = (await C('prd_listings').doc(x.id).get()).data(); if (l && l.status === '판매중') await processOne(l); else await C('prd_price_decisions').doc(x.id).set({ strat: { ...(x.strat || {}), active: false, end: 'notOnSale', endedAt: new Date().toISOString() }, ...W() }, { merge: true }); } catch (e) { log(`전략 다시 보기 실패: ${x.title || x.id} — ${e.message}`, 1); } await sleep(GAP()); } }

  /* ── 매일 한 바퀴 (중단돼도 이어서) ── */
  async function runCycle() {
    let run = (await RREF.get()).data() || {};
    const fresh = run.cycleId && !run.doneAt && run.ver === VER;
    if (!fresh) {
      if (run.doneAt && run.ver === VER && Date.now() - Date.parse(run.doneAt) < 20 * 3600e3) return false; // 하루 한 바퀴 (감시기 버전이 바뀌면 바로 새 바퀴)
      const ss = await C('prd_listings').where('status', '==', '판매중').get(); const keys = [];
      ss.forEach((d) => { const l = d.data(); const grp = PR.groupOfListing(l, engineSettings()); if (grp === 'treat' || grp === 'control') keys.push(d.id); });
      { const gs = [...(await wgLoad(true)).keys()]; const on = new Set(ss.docs.map((d) => d.id)); for (let i = 0; i < gs.length; i += 10) { const q = await C('prd_price_decisions').where('watch.gid', 'in', gs.slice(i, i + 10)).get(); q.forEach((d) => { if (on.has(d.id)) keys.push(d.id); }); } } // (0.8.0) 감시 그룹 상품 (판매중만)
      keys.splice(0, keys.length, ...new Set(keys)); keys.sort(); run = { cycleId: new Date().toISOString(), startedAt: new Date().toISOString(), keys, idx: 0, pc: PC, done: 0, fail: 0, ver: VER };
      await RREF.set({ ...run, doneAt: null, ...W() }); log(`새 바퀴 시작: 감시 상품 ${keys.length}개`);
    }
    running = true; buttons(); await loadShop();
    try {
      for (let i = run.idx; i < run.keys.length; i++) {
        if (stop || SET.killSwitch || !isMine() || !SET.enabled || SET.judgeOff) { log('멈춤'); return true; }
        prog(`${i + 1} / ${run.keys.length} · 성공 ${run.done} · 실패 ${run.fail}`);
        const ld = await C('prd_listings').doc(run.keys[i]).get(); const l = ld.data();
        try { if (l && l.status === '판매중') { const r = await processOne(l); run.done++; if (/승인대기/.test(r)) log(`승인 대기: ${l.title || l.usedCode}`); } }
        catch (e) { run.fail++; log(`실패: ${(l && l.title) || run.keys[i]} — ${e.message}`, 1); }
        if ((i + 1) % 5 === 0 || i === run.keys.length - 1) await RREF.set({ idx: i + 1, done: run.done, fail: run.fail, lastAt: new Date().toISOString() }, { merge: true });
        if (i % 10 === 9) { await loadSet(); await executeApproved(); await followUps(5); }
        await sleep(GAP());
      }
      await RREF.set({ doneAt: new Date().toISOString(), idx: run.keys.length }, { merge: true }); log(`한 바퀴 끝: 성공 ${run.done} · 실패 ${run.fail}`); prog('');
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
  (async () => { for (;;) { await sleep(120000); try { await autoTake(); } catch (e) {} if (isMine()) { try { await SREF.set({ watchBeat: new Date().toISOString(), watchVer: VER }, { merge: true }); } catch (e) {} } } })(); // 살아 있음 표시 (2분마다)
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
      if (SET.watchVer !== VER) { try { await SREF.set({ watchVer: VER, watchBeat: new Date().toISOString() }, { merge: true }); } catch (e) {} } // 웹앱이 '안전장치 있는 판인가'를 봄
      // (0.5.0) 꺼짐(멈춤) = 엔진 판정만 쉼 — 관리자가 확정한 가격(수동 일괄·직접 가격·승인·보류풀)은 계속 반영. 반영까지 멈추려면 '전체 정지'
      if (SET.killSwitch) { state('<b style="color:#B0322A">전체 정지</b> — 판정·반영 모두 멈춤 (웹앱에서 해제)'); return; }
      const judging = !!SET.enabled && !SET.judgeOff;
      state(judging ? `<b style="color:#1F5FAF">감시 중</b> · ${SET.phase || 'A'}단계 · 적용 ${(SET.rollout || {}).treatPct ?? 1}% / 비교 ${(SET.rollout || {}).controlPct ?? 0}%` : '<b style="color:#1F5FAF">반영만 하는 중</b> · 엔진 판정 쉼 (확정한 가격만 반영)');
      if (!rulesOk) { rulesOk = await checkRules(); if (!rulesOk) return; }
      stop = false; await executeApproved(); await verifyStep(60, 4 * 60000); if (!judging) return; await followUps(20); await runCycle();
    } catch (e) { log('오류: ' + e.message, 1); if (/permission/i.test(e.message)) state('<b style="color:#B0322A">Firestore 쓰기 권한 없음</b><br>규칙에 prd_price_decisions · prd_price_actions · prd_market_watch 허용 필요'); }
    finally { ticking = false; }
  }
  await adoptHandoff(); paintOwner(); buttons(); log('준비됨'); tick(); (async () => { for (;;) { await sleep(60 * 1000); tick(); } })(); // 1분마다 (숨은 탭에서도)
})();