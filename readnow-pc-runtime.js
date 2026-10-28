/* readnow-pc-runtime.js — 리드나우 수집기 1.89.138의 바탕 — 이 PC 이름·네이버 다시 로그인·일시정지(모든 탭)·작업 기록·탭끼리 나누는 상태·통합 관제판
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { runtime: '1.89.138' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
;(globalThis.__rnModQ = globalThis.__rnModQ || []).push(['runtime', '1.89.138', function () {
/* (1.64.0) 🌐 공개 전용 PC: 알라딘에 로그인하지 않는 PC가 공개 화면(우리 숍 목록 ?rnPub=1)에서 수집기를 띄움 — 로그인이 필요 없는 일만 함 · 이 PC는 알라딘 계정과 아무 연결이 없음 */
/* (1.68.2) 로거 첫 화면을 '우리 숍 목록 + ?rnPub=1'(알라딘 서버 기록에 우리 숍 번호와 낯선 표시가 함께 남음)에서 누구나 여는 '중고매장' 첫 화면 + #rnPub(# 뒤는 알라딘 서버로 가지 않음)으로 · 예전 주소로 열리면 새 주소로 바로 옮김 */
globalThis.__rnPubHome = (() => { try { if (window.top !== window) return false; if (/^\/shop\/usedshop\/wshopitem\.aspx$/i.test(location.pathname) && /[?&]rnPub=1(&|$)/.test(location.search)) { location.replace('https://www.aladin.co.kr/usedstore/wgate.aspx'); return false; } return !!globalThis.__rnEngine || (/^\/usedstore\/wgate\.aspx$/i.test(location.pathname) && (/^#rnPub\b/.test(location.hash) || !!globalThis.__rnPubHomeR)); /* (1.72.0) 🧪 로거 엔진 화면도 로거 첫 화면 */ /* (1.71.1 자동 점검) 본체가 #rnPub 표시를 주소에서 지우므로 본체가 알아본 '로거 첫 화면'(__rnPubHomeR)도 받음 */ } catch (e) { return false; } })();
/* (1.88.5) ⏱ 탭 성능 기록 — 정범님 10/20 '수집기 때문에 크롬 전체가 엄청 느려짐'(두 번째) · 짐작이 아니라 실측: 탭마다 5분에 한 번 작업 기록(rn_logs)에 한 줄
 *  역할·화면·힙(MB)·화면 요소 수·긴 작업(50ms 넘게 화면을 막은 것) 횟수·합계·되풀이 타이머(setInterval)마다 쓴 시간 상위·Tampermonkey 저장소 쓰기(GM_setValue) 횟수·크기 상위 · 값은 숫자와 함수 앞부분만(고객 정보 없음) */
(function rnPerfProbe() { const G = globalThis; if (window.top !== window || G.__rnPerf) return; const P = G.__rnPerf = { t0: Date.now(), iv: new Map(), gm: new Map(), lt: { n: 0, ms: 0, max: 0 } };
  try { const oSI = G.setInterval.bind(G); G.setInterval = function (fn, ms, ...a) { if (typeof fn !== 'function') return oSI(fn, ms, ...a); let key = ''; try { key = (ms | 0) + 'ms ' + String(fn).replace(/\s+/g, ' ').replace(/^(async )?\(\) => \{?\s*(try \{ )?/, '').slice(0, 56); } catch (e) { key = (ms | 0) + 'ms ?'; } let r = P.iv.get(key); if (!r) P.iv.set(key, (r = { n: 0, ms: 0, max: 0, c: 0 })); r.c++; return oSI(function () { const t = performance.now(); try { return fn.apply(this, arguments); } finally { const d = performance.now() - t; r.n++; r.ms += d; if (d > r.max) r.max = d; } }, ms, ...a); }; } catch (e) {}
  /* (1.89.1) 되풀이 타이머 말고도 — 한 번 도는 타이머(setTimeout)와 Firebase 실시간 받기(onSnapshot) 처리 중 50ms 넘게 걸린 것만 이름·시간 기록(어디가 화면을 막는지) */
  P.slow = new Map(); const slowAdd = (key, d) => { let r = P.slow.get(key); if (!r) P.slow.set(key, (r = { n: 0, ms: 0, max: 0 })); r.n++; r.ms += d; if (d > r.max) r.max = d; };
  try { const oST = G.setTimeout.bind(G); G.setTimeout = function (fn, ms, ...a) { if (typeof fn !== 'function') return oST(fn, ms, ...a); return oST(function () { const t = performance.now(); try { return fn.apply(this, arguments); } finally { const d = performance.now() - t; if (d > 50) { let k = ''; try { k = 't ' + String(fn).replace(/\s+/g, ' ').replace(/^(async )?\(\) => \{?\s*(try \{ )?/, '').slice(0, 56); } catch (e) { k = 't ?'; } slowAdd(k, d); } } }, ms, ...a); }; } catch (e) {}
  P.snapWrap = () => { try { const F = G.firebase && G.firebase.firestore; if (!F || F.__rnSnapW) return; F.__rnSnapW = 1; const wrap = (proto, kind) => { if (!proto || !proto.onSnapshot) return; const o = proto.onSnapshot; proto.onSnapshot = function (...args) { let key = kind; try { key = kind + ' ' + (this.path || (this._delegate && this._delegate._query && this._delegate._query.path && this._delegate._query.path.segments && this._delegate._query.path.segments.join('/')) || (this.id ? this.id : '?')); } catch (e) {} const W2 = (f) => (typeof f === 'function' ? function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - t; if (d > 50) slowAdd('snap ' + key.slice(0, 60), d); } } : f); for (let i = 0; i < args.length; i++) { if (typeof args[i] === 'function') { args[i] = W2(args[i]); break; } if (args[i] && typeof args[i] === 'object' && typeof args[i].next === 'function') { args[i] = { ...args[i], next: W2(args[i].next) }; break; } } return o.apply(this, args); }; }; wrap(F.DocumentReference && F.DocumentReference.prototype, 'doc'); wrap(F.Query && F.Query.prototype, 'q'); } catch (e) {} }; P.snapWrap(); setTimeout(P.snapWrap, 3000);
  try { const oSV = GM_setValue; GM_setValue = function (k, v) { try { const kk = /^rn-[a-z]+$/i.test(String(k)) ? String(k) : String(k).replace(/([-_])[a-z0-9]{6,12}(_\d+)?$/i, '$1*'); /* (1.89.76 자동 점검) 숫자 없는 고정 열쇠(rn-lcache·rn-engine 등)는 묶지 않음 — 'rn-*' 한 줄에 섞여 로거 큰 쓰기(10/25 하루 200번 약 1GB)가 어느 열쇠인지 못 가렸음 */ let r = P.gm.get(kk); if (!r) P.gm.set(kk, (r = { n: 0, b: 0 })); r.n++; r.b += v == null ? 0 : typeof v === 'string' ? v.length : (JSON.stringify(v) || '').length; } catch (e) {} return oSV(k, v); }; } catch (e) {}
  P.ltBy = new Map(); P.lfx = { n: 0, ms: 0, scr: 0, lay: 0, block: 0 }; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { P.lt.n++; P.lt.ms += e.duration; if (e.duration > P.lt.max) P.lt.max = e.duration; const at = (e.attribution || [])[0] || {}; const k = `${e.name}${at.containerType && at.containerType !== 'window' ? '/' + at.containerType : ''}${at.containerSrc ? ' ' + String(at.containerSrc).replace(/^https?:\/\/[^/]+/, '').slice(0, 40) : ''}`; let r = P.ltBy.get(k); if (!r) P.ltBy.set(k, (r = { n: 0, ms: 0 })); r.n++; r.ms += e.duration; } }).observe({ type: 'longtask', buffered: true }); } catch (e) {} /* (1.89.0) 긴 작업이 이 탭 것(self)인지, 같은 크롬 프로세스를 함께 쓰는 다른 탭·창 것(multiple-contexts·same-origin…)인지 */
  /* (1.88.6) 긴 작업이 '누구' 것인지 — 크롬의 긴 화면 그림(long-animation-frame) 기록에 든 스크립트별 시간(어느 파일·함수·무엇이 불렀는지)을 모음 · 1.88.5 실측: 아무 일도 안 하는 쉬는 탭에서도 5분에 7~15초(한 번에 최대 3.7초) 화면이 막혔는데 우리 타이머는 0.2초뿐이었음 */
  P.lf = new Map(); try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { P.lfx.n++; P.lfx.ms += e.duration; P.lfx.block += e.blockingDuration || 0; const scr = (e.scripts || []).reduce((a, x) => a + x.duration, 0); P.lfx.scr += scr; if (e.styleAndLayoutStart && e.startTime != null) P.lfx.lay += Math.max(0, e.startTime + e.duration - e.styleAndLayoutStart); for (const sc of e.scripts || []) { if (sc.duration < 30) continue; let src = String(sc.sourceURL || ''); src = /userscript|tampermonkey|chrome-extension|moz-extension/i.test(src) ? 'TM:' + (src.match(/[^/=?#]+\.user\.js|[^/]+$/) || [''])[0].slice(0, 40) : src.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '').slice(-50) || '(페이지)'; const k = `${sc.invokerType || ''}:${String(sc.invoker || '').slice(0, 50)} ${String(sc.sourceFunctionName || '').slice(0, 40)} @${src}`; let r = P.lf.get(k); if (!r) P.lf.set(k, (r = { n: 0, ms: 0, max: 0, lay: 0 })); r.n++; r.ms += sc.duration; r.lay += sc.forcedStyleAndLayoutDuration || 0; if (sc.duration > r.max) r.max = sc.duration; } } }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  const mb = (b) => Math.round(b / 1048576); const kb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.round(b / 1024) + 'KB');
  window.__rnPerfNow = () => { const m = performance.memory || {}; const ivs = [...P.iv.entries()].filter(([, r]) => r.n).sort((a, b) => b[1].ms - a[1].ms).slice(0, 5); const gms = [...P.gm.entries()].sort((a, b) => b[1].b - a[1].b).slice(0, 5); const ivAll = [...P.iv.values()].reduce((a, r) => a + r.ms, 0); const gmN = [...P.gm.values()].reduce((a, r) => a + r.n, 0), gmB = [...P.gm.values()].reduce((a, r) => a + r.b, 0);
    let tabs = 0; try { for (const k of GM_listValues()) if (/^rnu-live-/.test(k)) { const v = GM_getValue(k, null); if (v && Date.now() - (v.at || 0) < 60000) tabs++; } } catch (e) {}
    return { min: Math.round((Date.now() - P.t0) / 60000), role: window.__rnRole ? window.__rnRole() : '-', page: location.pathname.split('/').pop(), heap: m.usedJSHeapSize ? mb(m.usedJSHeapSize) : null, lim: m.jsHeapSizeLimit ? mb(m.jsHeapSizeLimit) : null, dom: document.getElementsByTagName('*').length, lt: { n: P.lt.n, s: +(P.lt.ms / 1000).toFixed(1), max: Math.round(P.lt.max) }, iv: { n: P.iv.size, s: +(ivAll / 1000).toFixed(1), top: ivs.map(([k, r]) => `${k} — ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms${r.c > 1 ? ` ×${r.c}` : ''}`) }, gm: { n: gmN, b: gmB, top: gms.map(([k, r]) => `${k} ${r.n}번 ${kb(r.b)}`) }, tabs, lf: [...(P.lf || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, r]) => `${k} — ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms${r.lay > 50 ? ` (그리기 강제 ${(r.lay / 1000).toFixed(1)}초)` : ''}`), jw: !!(document.getElementById('rn-jw') && document.getElementById('rn-jw').classList.contains('on')) }; };
  const rep = () => { try { const x = window.__rnPerfNow(); window.__rnPerfLast = { ...x, at: Date.now() }; const line = `⏱ 5분 성능 [${x.role} · ${x.page}${x.jw ? ' · 기록 창 열림' : ''}] 힙 ${x.heap ?? '?'}/${x.lim ?? '?'}MB · 화면 요소 ${x.dom.toLocaleString()} · 긴 작업 ${x.lt.n}번 ${x.lt.s}초(최대 ${x.lt.max}ms) · 되풀이 타이머 ${x.iv.n}개 ${x.iv.s}초 · GM 쓰기 ${x.gm.n}번 ${kb(x.gm.b)} · 이 PC 수집기 탭 ${x.tabs}개 ‖ 타이머 상위: ${x.iv.top.join(' | ') || '-'} ‖ GM 상위: ${x.gm.top.join(' | ') || '-'}`;
      window.__rnLog && window.__rnLog('성능', x.lt.s > 30 || (x.heap && x.lim && x.heap / x.lim > 0.6) ? 'warn' : 'detail', line); window.__rnLog && window.__rnLog('성능', 'detail', `⏱ 50ms 넘은 한 번 일·실시간 받기 [${x.role} · ${x.page}] ${[...(P.slow || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, r]) => `${k} ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms`).join(' | ') || '-'}`.slice(0, 590)); window.__rnLog && window.__rnLog('성능', 'detail', `⏱ 긴 작업 누구 것 [${x.role} · ${x.page}] ${[...(P.ltBy || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 5).map(([k, r]) => `${k} ${r.n}번 ${(r.ms / 1000).toFixed(1)}초`).join(' | ') || '-'} ‖ 이 탭 화면 그림 ${P.lfx.n}번 ${(P.lfx.ms / 1000).toFixed(1)}초(막음 ${(P.lfx.block / 1000).toFixed(1)}초 · 스크립트 ${(P.lfx.scr / 1000).toFixed(1)}초 · 그리기·배치 ${(P.lfx.lay / 1000).toFixed(1)}초) ‖ GM 상위: ${x.gm.top.join(' | ') || '-'}`.slice(0, 590)); if (x.lf.length) x.lf.forEach((t, i) => window.__rnLog('성능', 'detail', `⏱ 화면을 막은 스크립트 ${i + 1}위 [${x.role} · ${x.page}] ${t}`.slice(0, 590))); /* (1.88.7) 한 줄 600자 한도로 잘리던 것 → 순위마다 한 줄 */ P.iv.forEach((r) => { r.n = 0; r.ms = 0; r.max = 0; }); P.gm.clear(); P.lf && P.lf.clear(); P.ltBy && P.ltBy.clear(); P.slow && P.slow.clear(); P.lfx = { n: 0, ms: 0, scr: 0, lay: 0, block: 0 }; P.lt = { n: 0, ms: 0, max: 0 }; P.t0 = Date.now(); } catch (e) {} };
  setTimeout(rep, 60000); setInterval(rep, 5 * 60000); })();
/* 리드나우 수집기 1.0.0 — 고객 수집기(0.16.1)와 상품 수집기(0.8.1)를 하나로 합친 것.
 * 화면 오른쪽 위 탭으로 '고객'과 '상품·판매자·매입'을 바꿔 봄. 로그인·PC 이름·알라딘 아이디는 한 번만 넣으면 둘 다 씀.
 * 알라딘 작업 잠금은 하나(crm_system/work_lock): 고객 수집이 먼저(상품 쪽 긴 작업은 양보 후 자동으로 이어감). */
/* (1.63.6 전체 점검) 팝업 대신 화면 위 알림 띠 — alert()는 사람이 '확인'을 누를 때까지 탭 전체(잠금 신호·⏰ 자동·실시간 듣기)를 멈춰, 사람이 없는 PC에서 다른 PC까지 모두 막혔음
 *  __rnNote(글, 'err'|'warn') = 위에 띠를 띄우고(누르면 닫힘 · 같은 글은 한 번만) 기록에도 남김 · __rnUserAt = 사람이 마지막으로 누른 때(확인 창은 사람이 막 누른 때만) */
(function () { const G = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; try { document.addEventListener('pointerdown', () => { window.__rnUserAt = Date.now(); }, true); document.addEventListener('keydown', () => { window.__rnUserAt = Date.now(); }, true); } catch (e) {}
  window.__rnHuman = (ms) => Date.now() - (window.__rnUserAt || 0) < (ms || 4000);
  window.__rnNote = (msg, kind) => { try { console.warn('[리드나우]', msg); const show = () => { let box = globalThis.__rnById('rn-note-box'); if (!box) { box = document.createElement('div'); box.id = 'rn-note-box'; box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483646;max-width:min(380px,90vw);max-height:45vh;overflow:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font:12px/1.45 system-ui,sans-serif'; globalThis.__rnMount(box); } /* (1.66.0) 화면 위 가운데(샵매니저 단추를 가림) → 오른쪽 아래 작게 · 15초 뒤 \'⚠ 알림 N\' 단추로 접힘 */
        if ([...box.children].some((x) => x.dataset.msg === msg)) return; const d = document.createElement('div'); d.dataset.msg = msg; d.className = 'rn-note-it'; d.style.cssText = `background:${kind === 'warn' ? '#FFF4E0;color:#7A4A00;border:1px solid #E8B860' : '#FDE8E6;color:#8A2420;border:1px solid #E7B4AE'};border-radius:8px;padding:6px 10px;white-space:pre-wrap;box-shadow:0 3px 10px rgba(0,0,0,.15);cursor:pointer`; d.textContent = msg + '  (누르면 닫힘)'; d.onclick = () => { d.remove(); noteChip(); }; box.appendChild(d); noteChip(true); clearTimeout(box._fold); box._fold = setTimeout(() => noteFold(true), 15000); };
        const noteFold = (on) => { const box = globalThis.__rnById('rn-note-box'); if (!box) return; box._folded = on; box.querySelectorAll('.rn-note-it').forEach((x) => (x.style.display = on ? 'none' : '')); noteChip(); };
        const noteChip = (open) => { const box = globalThis.__rnById('rn-note-box'); if (!box) return; if (open) box._folded = false; const n = box.querySelectorAll('.rn-note-it').length; let c = box.querySelector('.rn-note-chip'); if (!n) { if (c) c.remove(); return; } if (!c) { c = document.createElement('button'); c.className = 'rn-note-chip'; c.style.cssText = 'order:99;border:1px solid #E7B4AE;background:#fff;color:#8A2420;border-radius:14px;padding:3px 10px;font:12px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)'; c.onclick = () => noteFold(!box._folded); box.appendChild(c); } c.textContent = box._folded ? `⚠ 리드나우 알림 ${n} — 펼치기` : `접기 (${n})`; if (!box._folded) box.querySelectorAll('.rn-note-it').forEach((x) => (x.style.display = '')); };
      if (document.body) show(); else document.addEventListener('DOMContentLoaded', show); } catch (e) {} };
  /* (1.63.8 점검) 남은 알림 팝업(alert) 모두 → 화면 위 알림 띠(멈추지 않음) — alert는 '확인'을 누를 때까지 탭 전체(잠금 신호·⏰ 자동·실시간 듣기)를 멈췄음 · 확인을 묻는 창(confirm)은 사람이 막 누른 때만 뜸 */
  try { window.alert = (m) => window.__rnNote(String(m == null ? '' : m), 'warn'); } catch (e) {} })();
function rnPwEye(filter) { /* (1.63.8) 비밀번호 칸 옆 👁 — 누르고 있는 동안만 보이고 떼면 다시 가림(마우스·손가락 모두) */
  const add = (inp) => { if (inp._rnEye || (filter && !filter(inp))) return; inp._rnEye = 1; const b = document.createElement('button'); b.type = 'button'; b.className = 'rn-pweye'; b.textContent = '👁'; b.title = '누르고 있는 동안만 비밀번호가 보임 · 떼면 다시 가림'; b.tabIndex = -1; b.setAttribute('aria-label', '비밀번호 잠깐 보기');
    b.style.cssText = 'margin-left:4px;padding:2px 7px;border:1px solid #C9D3CF;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;line-height:1.2;vertical-align:middle;touch-action:none;user-select:none;-webkit-user-select:none';
    const show = (e) => { e.preventDefault(); inp.type = 'text'; b.style.background = '#FFF4E0'; }; const hide = () => { if (inp.type !== 'password') inp.type = 'password'; b.style.background = '#fff'; };
    b.addEventListener('pointerdown', show); ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => b.addEventListener(ev, hide)); b.addEventListener('click', (e) => e.preventDefault()); b.addEventListener('contextmenu', (e) => e.preventDefault()); window.addEventListener('blur', hide);
    inp.insertAdjacentElement('afterend', b); };
  const scan = () => { try { document.querySelectorAll('input[type="password"]').forEach(add); } catch (e) {} }; let t = null;
  const go = () => { scan(); try { new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 150); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go); }
rnPwEye((inp) => !!(inp.closest && inp.closest('[id^="rn"], .rncard'))); /* 수집기 화면 안의 칸만(알라딘 로그인 화면 칸은 건드리지 않음) */
/* ═════════════ (1.63.7) 🧩 이 PC 기능 켜고 끄기 ═════════════
 *  📥 수집 = 일시정지와 같은 한 스위치(GM 'rnu-paused' · 이 PC의 모든 탭): 끄면 직접 누른 수집·⏰ 자동·웹앱 수집 요청·🌐 외부 정보·맡긴 수집 일(시장 지표·읽기·찾기)을 이 PC는 하지 않음 → 담당 PC 신호도 '쉬는 중'이라 다른 PC가 맡음
 *  수집 외 기능 = GM 'rnu-feat' { 열쇠: false } (이 PC만 · 기본은 모두 켬) — 화면 기능은 그 화면을 새로 열 때부터, 맡긴 일·바탕 기능은 곧바로 적용
 *  꺼 둔 맡긴 일(출고 시작·현금 판매·등록)은 이 PC가 받지 않고 대기로 남겨 다른 PC가 받음 */
/* (1.63.8) 연 탭 닫기 + 닫혔는지 확인(6초) — 못 닫으면 기록에 남김(빈 탭이 쌓이지 않게 눈에 보이게) */
window.__rnCloseTab = async (tb) => { if (!tb) return true; try { tb.close(); } catch (e) {} for (let i = 0; i < 12; i++) { if (tb.closed) return true; await new Promise((r) => setTimeout(r, 500)); } try { window.__rnLog && window.__rnLog('수집기', 'warn', '연 탭(로그인 등)을 닫지 못함 — 남은 탭이 있으면 직접 닫아 주세요'); } catch (e) {} return false; };
(function rnFeatInit() {
  window.__rnFeats = [
    ['custCard', '🧑 고객 카드·고객 표시', '주문 상세 팝업의 고객 카드 · 판매관리·주문조회·주문확인요청·발송요청 목록의 주문번호 옆 고객 표시', '화면'],
    ['monitor', '🎨 가격 감시 색 표시', '상품 조회/수정 목록 줄마다 판정 엔진 묶음 색', '화면'],
    ['marks', '⚠ 우리 상품 옆 표시', '취소 주문 기록 · 참고 가격(정가·새상품 판매가) · 예스24 중고 링크 (상품 조회/수정·판매관리)', '화면'],
    ['cash', '💵 현금 판매 띠', '상품 조회/수정의 판매중지 바꾸기·다시 판매중 + 웹앱이 맡긴 현금 판매 판매중지', '화면·맡긴 일'],
    ['invoice', '🚚 송장 입력', '발송 요청 화면의 송장번호 넣기 · ALPS 파일 단추', '화면'],
    ['phrase', '💬 응대 문구 도우미', '묻고 답하기·구매평 화면의 문구 판', '화면'],
    ['reg', '📥 등록 도우미 · 🤖 자동 등록', '상품 등록 화면 채우기 + 웹앱이 맡긴 등록(개별·미등록·대량·분류 찾기)', '화면·맡긴 일'],
    ['ship', '📦 출고 시작 맡긴 일', '웹앱이 맡긴 주문확인요청 → 발송 요청 넘기기', '맡긴 일'],
    ['relogin', '🔑 자동 다시 로그인', '알라딘 로그인이 풀리면 네이버로 다시 로그인', '바탕'],
    ['update', '⟳ 새 판 저절로 맞추기', '다른 PC가 새 수집기로 돌면 쉬는 사이 새로고침해 새 판으로', '바탕'],
    ['remote', '🛰 원격 조작 받기', '웹앱·다른 PC가 보낸 ■ 중단 · ▶ 다시 시작 · ⟳ 업데이트', '바탕'],
    ['rules', '🔐 Firebase 규칙 점검', '이 PC 계정으로 쓰는 칸을 시험(6시간마다 · 남는 것 없음)', '바탕'],
  ];
  const get = () => { try { const v = GM_getValue('rnu-feat', null); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  window.__rnFeat = (k) => get()[k] !== false;
  window.__rnFeatOff = () => window.__rnFeats.map((x) => x[0]).filter((k) => get()[k] === false);
  window.__rnFeatSet = (patch) => { const v = { ...get(), ...patch }; Object.keys(v).forEach((k) => { if (v[k] !== false) delete v[k]; }); GM_setValue('rnu-feat', v); return v; };
})();
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
  window.__rnNaverLogin = async ({ isLoggedIn, log, stopped, ret }) => { /* (정범님 10/26) 1.89.105의 '무조건 멈춤'은 걷어냄 — 이 함수는 이제 로그인 규칙(__rnLoginGov.relogin)이 차례·간격·쉼을 허락했을 때만 불림 */
    const L = (m, lv) => { try { log(m, lv); } catch (e) { window.__rnLog && window.__rnLog('로그인', lv === 'err' ? 'err' : lv ? 'warn' : 'info', m); } }; if (globalThis.__rnPubHome || globalThis.__rnPubChrome) { L('🛡 로거 크롬은 알라딘에 로그인하지 않음', 1); return false; } /* (1.69.0) */ if (window.__rnFeat && !window.__rnFeat('relogin')) { L('알라딘 로그인이 풀렸지만 이 PC는 🧩 \'자동 다시 로그인\'을 꺼 둠 — 직접 로그인해 주세요', 'err'); return false; } // 각 모듈의 log가 기록 창에도 남김
    const busy = GM_getValue('rnu-naver-login', null);
    if (busy && Date.now() - busy.at < 120000) { // 다른 탭·모듈이 이미 하는 중 → 결과만 기다림
      for (let i = 0; i < 24; i++) { await new Promise((r) => setTimeout(r, 5000)); if (await isLoggedIn()) return true; if (stopped && stopped()) return false; }
      return false;
    }
    GM_setValue('rnu-naver-login', { at: Date.now() });
    L('알라딘 로그인이 풀려 네이버로 다시 로그인합니다 (네이버 로그인 상태 유지 사용)');
    let tab = GM_openInTab(NAVER_URL(ret), { active: false, insert: true }); let ok = false;
    for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 5000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } } // 최대 60초
    await window.__rnCloseTab(tab);
    if (!ok && !(stopped && stopped())) { // 네이버 로그인도 풀림 → 사람에게
      L('네이버 로그인 상태가 풀려 있습니다. 새로 열린 창에서 네이버에 로그인해 주세요 ("로그인 상태 유지"를 켜면 다음부터 자동). 로그인하면 수집이 이어집니다 (최대 30분 기다림)', 'err');
      GM_setValue('rnu-need-naver', Date.now()); /* (정범님 10/26) 알림(GM_notification)은 보내지 않음 — 네이버 로그인 자체가 풀린 때만 이 PC 화면에 네이버 창을 띄우고(사람 손 없이는 안 되는 일) 기록에 남김 */
      try { if (window.firebase && firebase.apps.length && firebase.auth().currentUser) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: 'naver', pcName: (window.__rnPcName && window.__rnPcName.get()) || '', at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
      tab = GM_openInTab(NAVER_URL(ret), { active: true, insert: true });
      for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 10000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } }
      await window.__rnCloseTab(tab);
      try { if (window.firebase && firebase.apps.length) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: null, at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
    }
    GM_deleteValue('rnu-naver-login'); if (ok) GM_deleteValue('rnu-need-naver');
    GM_setValue(ok ? 'rnu-naver-okAt' : 'rnu-naver-failAt', Date.now());
    L(ok ? '네이버로 다시 로그인했습니다. 계속합니다' : '네이버 로그인이 되지 않았습니다', ok ? '' : 'err');
    return ok;
  };
})();
globalThis.__rnLoginRule = (function () { /* ⟦알라딘 로그인 규칙 — 수집기·클라우드에 글자 하나까지 같은 글(시험 t_login이 견줌) · 순수 함수만(저장·네트워크 없음)⟧
 *  계정 상태 문서 = Firestore app_settings/aladin_login (모든 PC·클라우드가 같이 봄)
 *   { tries:[{at,who,net,ok,how,why,code,blocked}](최근 cfg.keep개 · 기본 200) · next:{기기: 다음 시도 때(ms)} · dev:{기기:{in,at,how,pri,use,yield}} · net:{기기: 공인 IP 앞 두 마디}
 *     · blk:{'기기·망':{first,last,n,okAt}}(42FB 막힘이 기기·망별로 얼마나 갔나) · holdUntil·holdWhy(정범님이 켤 때만 — 자동으로는 넣지 않음) · cfg:{바꿀 수 있는 값}
 *     · wait:{기기:{at,since,pri}}(🪑 판매자 로그인 자리를 기다리는 기기 — 아래 '판매자 로그인 자리') }
 *  하루 요약 = app_settings/aladin_login/days/{KST 날짜} { c:{'기기·망·방법·결과·경고':수}, eps:[닫힌 막힘 {who,net,first,okAt,n}] }
 *  사람처럼(정범님 10/26 23:46 · 23:53): ① 한 회사에 사람이 여럿이듯 기기마다 각자 필요할 때 따로 시도(계정 전체 차례 없음 · 같은 기기 안의 여러 탭은 한 탭만 — 수집기 GM 표시) ② 진짜 풀린 것을 확인한 뒤 5~20초 알아차리는 시간 → 한 번
 *   ③ 안 되면(42FB 경고도 같음) 그 기기는 1~10분 사이 무작위(매번 새로) 뒤 다시 — 그 기기에 로그인이 필요한 일이 남아 있는 동안만 · 단계 간격·하루 상한·다음 날 9시 쉼 없음
 *   ④ 클라우드(데이터센터 IP): 2시간 안에 42FB가 있었고 그 뒤 어느 PC도 새 로그인에 성공하지 않았으면 기다림 → PC가 성공하면 그때부터 ①~③ */
  const DEF = { retrySec: [60, 600], noticeSec: [5, 20], keep: 200, dcWaitMin: 120, credBadMin: 360, maxDev: 4, liveMin: 30, beatSec: [600, 900], always: ['JS-MAIN', 'MJ-MAIN', 'HOME'], alwaysPair: [], phones: [] }; /* maxDev·liveMin·beatSec = 🪑 판매자 로그인 자리(아래) · always·alwaysPair·phones = 🔒 상시 기기(정범님 10/27 15:12 — 아래 '상시 기기') */ /* credBadMin = '아이디·비밀번호가 틀림·자동입력 방지' 글이 뜬 때만(계정 잠김 막기 — 클라우드 0.11.0부터 있던 안전장치 · 42FB와 다름) */
  /* (정범님 10/28 09:39) 🪑 로그인 전용 4대 확정 = JS-MAIN · MJ-MAIN · HOME(각자 한 자리 — 짝 없음) + 클라우드(데이터센터 주소가 풀릴 때까지 🌙 조용히 기다림) · 휴대폰은 자리에 미리 셈하지 않음(웹앱으로 조작 · 우리 코드는 휴대폰에서 로그인하지 않음) */
  const num = (v, lo, hi, d) => { const n = +v; return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  const pair = (v, lo, hi, d) => (Array.isArray(v) && v.length === 2 && +v[0] >= lo && +v[1] >= +v[0] && +v[1] <= hi ? v.map(Number) : d);
  /* 기기 이름 목록(관리도구에서 바꿈) — 빈 목록도 됨 · 'cloud'는 상시가 될 수 없음(휴대폰 목록은 이름만 셈) · 짝은 ['A','B'] 또는 Firestore용 글 'A+B'(배열 안 배열은 Firestore가 받지 않음) */
  const names = (v, d, ph) => (Array.isArray(v) ? v.map((x) => String(x == null ? '' : x).trim()).filter((x) => x && x.length <= 40 && (ph || x.toLowerCase() !== 'cloud')).slice(0, 12) : d);
  const pairs = (v, d) => (Array.isArray(v) ? v.map((p) => (Array.isArray(p) ? p : String(p == null ? '' : p).split('+')).map((x) => String(x == null ? '' : x).trim()).filter(Boolean)).filter((p) => p.length >= 2).slice(0, 6) : d);
  function cfgOf(doc) { const c = (doc && doc.cfg) || {}; return { retrySec: pair(c.retrySec, 10, 3600, DEF.retrySec), noticeSec: pair(c.noticeSec, 0, 120, DEF.noticeSec), keep: Math.round(num(c.keep, 20, 400, DEF.keep)), dcWaitMin: num(c.dcWaitMin, 0, 1440, DEF.dcWaitMin), credBadMin: num(c.credBadMin, 0, 1440, DEF.credBadMin), maxDev: Math.round(num(c.maxDev, 1, 4, DEF.maxDev)), liveMin: num(c.liveMin, 20, 120, DEF.liveMin), beatSec: pair(c.beatSec, 120, 1080, DEF.beatSec), always: names(c.always, DEF.always), alwaysPair: pairs(c.alwaysPair, DEF.alwaysPair), phones: names(c.phones, DEF.phones, true) }; } /* maxDev 1~4(5대부터 약관 위반) · 신호 간격 최대 18분 < 자리 유지 최소 20분(신호가 한 번 늦어도 자리가 풀리지 않게) */
  const kstDay = (ms) => new Date(+ms + 9 * 3600e3).toISOString().slice(0, 10);
  const kstHm = (ms) => { const k = new Date(+ms + 9 * 3600e3); return `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`; };
  const between = (a, rnd) => Math.round((a[0] + (Number.isFinite(rnd) ? Math.min(1, Math.max(0, rnd)) : Math.random()) * (a[1] - a[0])) * 1000);
  /* 계정 새 로그인 막힘 경고 — 정범님이 본 글: '로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-…)' (같은 뜻 = 에러코드 42FB로 시작) */
  const BLOCK_RE = /로그인\s*과정에\s*문제|에러\s*코드\s*[:：]?\s*42FB|\b42FB[0-9A-F]{2,}/i;
  const isBlock = (msg) => BLOCK_RE.test(String(msg || ''));
  const codeOf = (msg) => { const m = String(msg || '').match(/에러\s*코드\s*[:：]?\s*([0-9A-F]{4,}(?:-[0-9A-F]+)?)/i) || String(msg || '').match(/\b(42FB[0-9A-F]{2,})/i); return m ? m[1].toUpperCase().slice(0, 24) : isBlock(msg) ? '42FB' : null; };
  /* 🪑 판매자 로그인 자리 (정범님 10/27) — 알라딘 이용약관 제19조(부정이용 금지) 1.① "동일한 아이디로 5대 이상의 기기(PC, 스마트폰, 태블릿PC, 전용 단말기 등)에서 동시 접속하여 서비스를 이용하는 경우"
   *  → 계정 전체로 cfg.maxDev(기본 4 · 1~4)대까지만 = 휴대폰(cfg.phones · 기본 JS-phone·MJ-phone 2대 — 사람 손 · 우리 코드는 휴대폰에서 로그인하지 않음 · 늘 쓰는 것으로 미리 셈)
   *     + 🔒 상시 PC 자리(cfg.always · 기본 JS-MAIN·MJ-MAIN·HOME — cfg.alwaysPair 짝 JS-MAIN·HOME은 정범님이 끄고 켜며 바꿔 쓰는 한 자리 = 둘이 함께 살아 있어도 한 자리로 셈) + 그 밖 기기(클라우드 등)
   *  🔒 상시 기기(정범님 10/27 15:12 절대 원칙 — '무슨 일이 있어도 JS-MAIN·MJ-MAIN은 자동 수집이든 엔진이든 Claude든 로그인을 방해하는 일이 절대로 있어서는 안 됨'):
   *     자리를 묻지 않고 늘 받음(꽉 차도) · 넘기지(양보) 않음 · 기다림 줄에 서지 않음 · 계정 쉼(holdUntil)·데이터센터 기다림·아이디 오류 6시간 쉼을 받지 않음
   *     → 그 PC에 로그인이 필요하면 언제나 바로(사람처럼: 필요할 때만 · 실패하면 1~10분 무작위 뒤 될 때까지) · 넘치면 늘 '그 밖' 기기가 넘김
   *  그 밖 기기의 자리 = maxDev − 휴대폰 − 지금 살아 있는 상시 PC 자리 − 이미 자리를 가진 그 밖 기기 (기본: 4 − 2 − 2 = 0 → 상시 PC 둘이 로그인 일을 하는 동안 클라우드는 받침으로만 · 쿠키 내려놓고 기다림)
   *  자리 = dev[기기]: in 참 · 신호(at)가 cfg.liveMin(기본 30)분 안 · 양보(yield) 아님. 신호는 그 기기가 로그인이 필요한 일(샵매니저·내 계정 등)을 하는 동안만 cfg.beatSec(10~15분 무작위)마다
   *   → 30분 동안 로그인 일을 하지 않은 기기는 신호가 끊겨 자리가 저절로 풀림(로그아웃 단추는 누르지 않음 — 세션은 그대로 두고 만료되면 다시 로그인하지 않음)
   *  그 밖 기기가 새로 로그인하거나 쉬다가 다시 로그인 일을 하려면 먼저 자리를 받음(seatAsk · 트랜잭션) — 없으면 로그인하지 않고 '자리 기다림'(retrySec 1~10분 무작위 뒤 다시 봄)
   *  우선순위 PRI(그 밖 기기끼리): 사람이 그 기기에서 웹앱·알라딘을 누름 3 > 출고·자동 발송 판단(주문확인요청 읽기) 2 > 그 밖 PC 1 > 클라우드 0(받침)
   *   · 빈자리는 기다리는 기기 중 우선순위가 높은(같으면 먼저 기다린) 기기 몫 · 자리를 가진 기기가 세션 만료로 다시 로그인할 때 더 높은 기기가 기다리면 다시 로그인하지 않고 넘김
   *   · 꽉 찼는데 PC가 기다리면 클라우드(받침)는 일하는 중이라도 로그인 일을 멈추고 자리를 넘김(seatYield) · 어떤 까닭으로든 maxDev대를 넘으면(상시 PC가 켜짐 등) 그 밖 기기 중 우선순위가 가장 낮은 기기(같으면 가장 오래 일 안 한 기기)가 넘김 — 상시 기기는 넘기지 않음 */
  const PRI = { human: 3, ship: 2, pc: 1, cloud: 0 };
  const UP = (x) => String(x == null ? '' : x).trim().toUpperCase();
  /* 상시 기기인가 — cfg(cfgOf 결과)·기기 이름 · 'cloud'는 언제나 아님 */
  const isAlways = (c, who) => UP(who) !== 'CLOUD' && !!who && (c.always || []).some((x) => UP(x) === UP(who));
  /* 상시 기기의 자리 이름 — 짝(JS-MAIN·HOME)은 한 자리 */
  const slotOf = (c, who) => { const p = (c.alwaysPair || []).find((q) => q.some((x) => UP(x) === UP(who))); return p ? p.map(UP).join('+') : UP(who); };
  const isLive = (v, now, c) => !!(v && v.in === true && !v.yield && now - (+v.at || 0) < c.liveMin * 60e3);
  const waitMs = (c) => c.retrySec[1] * 1500 + 60e3; /* 기다림 표시가 살아 있는 시간 = 다시 묻는 가장 긴 간격의 1.5배 + 1분(그 뒤엔 더 기다리지 않는 기기로 봄) */
  const priOf = (v, who) => (v && Number.isFinite(+v.pri) && v.pri !== null ? +v.pri : who === 'cloud' ? PRI.cloud : PRI.pc);
  /* 자리 보기 → { max, live(모두 · al = 상시), wait(그 밖 기기만), phones(휴대폰 대수), slots(살아 있는 상시 PC 자리 이름), used(계정 전체로 센 대수), room(그 밖 기기가 쓸 수 있는 자리 — 이미 가진 그 밖 기기 포함 전), cfg } */
  function seatView(doc, now) { const c = cfgOf(doc); const D = (doc && doc.dev) || {}; const Wt = (doc && doc.wait) || {};
    const live = Object.entries(D).filter(([, v]) => isLive(v, now, c)).map(([w, v]) => ({ who: w, pri: priOf(v, w), at: +v.at || 0, use: +v.use || +v.at || 0, al: isAlways(c, w) })).sort((a, b) => b.pri - a.pri || b.use - a.use);
    const wait = Object.entries(Wt).filter(([w, v]) => v && now - (+v.at || 0) < waitMs(c) && !isLive(D[w], now, c) && !isAlways(c, w)).map(([w, v]) => ({ who: w, pri: priOf(v, w), since: +v.since || +v.at || 0, at: +v.at || 0 })).sort((a, b) => b.pri - a.pri || a.since - b.since);
    const slots = [...new Set(live.filter((x) => x.al).map((x) => slotOf(c, x.who)))].sort(); const phones = c.phones.length; const others = live.filter((x) => !x.al).length;
    return { max: c.maxDev, live, wait, phones, slots, used: phones + slots.length + others, room: Math.max(0, c.maxDev - phones - slots.length), cfg: c }; }
  /* 자리 받기 → { ok:true, patch } | { ok:false, kind:'seat', until, why, patch(기다림 적기) } · o.pri = 이 기기 우선순위(없으면 PC 1 · o.dc면 클라우드 0) · 🔒 상시 기기는 늘 ok(always) */
  function seatAsk(doc, who, now, o, rnd) { o = o || {}; const V = seatView(doc, now); const pri = Number.isFinite(+o.pri) && o.pri !== null ? +o.pri : o.dc ? PRI.cloud : PRI.pc;
    if (!o.dc && isAlways(V.cfg, who)) { const sl = new Set(V.slots); sl.add(slotOf(V.cfg, who)); const n = V.phones + sl.size + V.live.filter((x) => !x.al).length;
      return { ok: true, always: true, n, max: V.max, patch: { dev: { [who]: { in: true, at: now, how: '상시', pri, use: now, yield: false } }, wait: { [who]: null } } }; }
    const others = V.live.filter((x) => !x.al && x.who !== who); const W0 = ((doc && doc.wait) || {})[who] || null; const since = W0 && now - (+W0.at || 0) < waitMs(V.cfg) ? +W0.since || +W0.at || now : now;
    const mine = V.live.some((x) => x.who === who); /* 이미 자리를 가진 기기(세션 만료로 다시 로그인 등)는 더 높은 기기에게만 넘김 · 새로 묻는 기기는 같은 우선순위면 먼저 기다린 기기 다음 */
    const ahead = V.wait.filter((x) => x.who !== who && (x.pri > pri || (!mine && x.pri === pri && x.since < since))); const free = V.room - others.length; const base = V.phones + V.slots.length;
    if (free - ahead.length >= 1) return { ok: true, n: base + others.length + 1, max: V.max, patch: { dev: { [who]: { in: true, at: now, how: '자리', pri, use: now, yield: false } }, wait: { [who]: null } } };
    const until = now + between(V.cfg.retrySec, rnd);
    const held = [V.phones ? `휴대폰 ${V.phones}대` : '', V.slots.length ? `🔒 상시 PC ${V.slots.join('·')}` : '', ...others.map((x) => x.who)].filter(Boolean).join(' · ');
    const why = free <= 0 ? `알라딘 판매자 로그인 ${base + others.length}/${V.max}대(${held}) — 자리 기다림(약관 제19조: 같은 아이디 5대 이상 동시 접속 금지 · 상시 PC·휴대폰이 먼저)` : `빈자리 ${free}개는 먼저 기다리는 우선순위 높은 기기(${ahead.slice(0, free).map((x) => x.who).join('·')}) 몫 — 자리 기다림`;
    return { ok: false, kind: 'seat', until, why, n: base + others.length, max: V.max, ahead: ahead.map((x) => x.who), patch: { dev: { [who]: { in: false, at: now, how: '자리 기다림', pri, yield: false } }, wait: { [who]: { at: now, since, pri } } } }; }
  /* 자리를 넘길 기기 하나(없으면 null) — 상시 기기는 절대 아님 · 계정 전체 대수가 maxDev를 넘으면 그 밖 기기 중 가장 낮은 기기(같으면 가장 오래 일 안 한 기기) · 꽉 찼고 클라우드보다 높은 기기가 기다리면 클라우드 */
  function seatYield(doc, now) { const V = seatView(doc, now); const over = V.used - V.max; const top = V.wait[0]; const ot = V.live.filter((x) => !x.al);
    if (over > 0) { const c = ot.slice().sort((a, b) => a.pri - b.pri || a.use - b.use); return c.length ? c[0].who : null; }
    if (over === 0 && top) { const c = ot.filter((x) => x.who === 'cloud' && x.pri < top.pri); return c.length ? 'cloud' : null; }
    return null; }
  /* 로그인 일을 하는 기기가 신호(10~15분마다) 때 부름 → 자리가 있으면 신호 적기 · 넘길 차례면 양보 · 자리가 없으면(신호가 끊겼던 기기) 새로 받기 · 🔒 상시 기기는 늘 신호만(넘기지 않음) */
  function seatKeep(doc, who, now, o, rnd) { o = o || {}; const c = cfgOf(doc); const me = ((doc && doc.dev) || {})[who];
    if (!o.dc && isAlways(c, who)) { const a = seatAsk(doc, who, now, o, rnd); return { ...a, keep: true, patch: { dev: { [who]: { in: true, at: now, how: '상시', pri: a.patch.dev[who].pri, use: +o.use || now, yield: false } }, wait: { [who]: null } } }; }
    if (!isLive(me, now, c)) return seatAsk(doc, who, now, o, rnd);
    const pri = Number.isFinite(+o.pri) && o.pri !== null ? +o.pri : priOf(me, who);
    if (seatYield(doc, now) === who) { const V = seatView(doc, now); const until = now + between(c.retrySec, rnd);
      return { ok: false, kind: 'yield', until, n: V.used - 1, max: V.max, why: V.used > V.max ? `알라딘 판매자 로그인이 계정 전체 ${V.used}대(휴대폰 ${V.phones} · 🔒 상시 PC ${V.slots.length}자리 포함)로 ${V.max}대를 넘음 — 우선순위가 가장 낮은 이 기기(${who})가 로그인 일을 멈추고 자리를 넘김(로그아웃 단추는 누르지 않음)` : `${V.wait[0].who}(우선순위 더 높음)가 자리를 기다림 — 받침인 ${who}가 로그인 일을 멈추고 자리를 넘김(로그아웃 단추는 누르지 않음)`,
        patch: { dev: { [who]: { in: false, at: now, how: '양보', pri, yield: true } } } }; }
    return { ok: true, keep: true, n: seatView(doc, now).used, max: c.maxDev, patch: { dev: { [who]: { in: true, at: now, pri, use: +o.use || now, yield: false } } } }; }
  /* 지금 이 기기(who)가 새 로그인을 해도 되나 → { ok:true, cfg } | { ok:false, kind:'hold'|'retry'|'dcwait', until, why }
   *  o.force = 사람이 직접 누른 시험(다시 시도 때만 건너뜀 — 🪑 자리는 건너뛰지 않음) · o.dc = 데이터센터(클라우드) — ④ 규칙 · o.pri = 🪑 자리 우선순위 · o.seat === false = 자리를 보지 않음(시험용)
   *  ⑤ 🪑 자리: 위가 모두 통과하면 판매자 로그인 자리를 받음(seatAsk) — 받으면 { ok:true, cfg, patch(자리 적기) } · 꽉 찼으면 { ok:false, kind:'seat', until, why, patch(기다림 적기) }
   *  🔒 상시 기기(cfg.always · 클라우드 아님): 계정 쉼·데이터센터 기다림·자리를 보지 않고 늘 바로 — 지킬 것은 '사람처럼' 실패 뒤 1~10분 무작위 간격 하나뿐
   *     (그 간격도 그 기기의 마지막 시도 + retrySec 최대(10분)를 넘지 않음 — 예전 판이 적은 아이디 오류 6시간 쉼 등은 무시) */
  /* ⑥ 🌙 데이터센터 주소 막힘 뒤 조용히 기다림 (정범님 10/27 23:38 '너가 정해 · 통계 근거로' · 클라우드 0.35.50)
   *  까닭: 10/26 22:40~10/27 21:49 클라우드 고정 주소에서 2시간마다 10번 모두 42FB · 같은 때 PC(집·사무실 주소)는 모두 로그인 성공 = 계정이 아니라 데이터센터 주소가 막힘
   *  근거: OWASP 자격 증명 대입 방어 지침 — 주소 막음은 '잠시'이고 '나쁜 신호가 줄거나 멈추면' 풀도록 권함 · 호스팅(데이터센터) 주소는 따로 분류해 더 엄하게 봄
   *        Fortinet 인증 평판 — 처음 10분 막고, 되풀이하면 막는 시간을 늘림(되풀이할수록 길어짐) → 막힌 동안 다시 두드리면 풀리는 시계가 다시 감김
   *  그래서: 막힌 뒤로는 시도하지 않음(로그인이 필요 없는 일만) → 72시간 조용히 둔 뒤 한 번 · 또 막히면 7일 뒤 한 번 · 또 막히면 멈춤(사람이 직접 '시험'하거나 주소를 바꿀 때까지)
   *        시도는 사람이 일하는 때(한국 시간 10~12시 사이 무작위)에만 · 같은 계정 PC가 그 전 6시간 안에 로그인 성공한 때만(계정 자체는 멀쩡할 때) · PC 로그인은 이 규칙을 전혀 받지 않음 */
  const DC_Q_FROM = Date.parse('2026-10-27T15:00:00Z'); const DC_Q_WAIT = [72 * 3600e3, 7 * 86400e3];
  function dcQuiet(doc, who, now, rnd) { const B = Object.entries((doc && doc.blk) || {}).filter(([k, v]) => k.split('·')[0] === who && v && !v.okAt).map(([, v]) => v)[0]; if (!B) return null;
    const T = (doc && doc.tries) || []; const mine = T.filter((t) => t && t.who === who && t.blocked && +t.at >= DC_Q_FROM); const k = mine.length;
    if (k >= DC_Q_WAIT.length) return { ok: false, kind: 'dcquiet', until: 0, stop: true, why: `${who} 주소가 72시간·7일 쉰 뒤에도 막힘 — 시도 멈춤(로그인이 필요 없는 일만 · 사람이 '시험'을 누르거나 주소를 바꾸면 다시)` };
    const base = Math.max(DC_Q_FROM, k ? +mine[k - 1].at : +B.last || DC_Q_FROM); let at = base + DC_Q_WAIT[k];
    const K = 9 * 3600e3; const d = new Date(at + K); let s = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 10) - K; if (at > s + 2 * 3600e3) s += 86400e3; if (at < s) at = s + Math.round((Number.isFinite(rnd) ? rnd : Math.random()) * 2 * 3600e3);
    if (now < at) return { ok: false, kind: 'dcquiet', until: at, why: `${who} 주소 막힘(42FB) — 조용히 기다림 ${k + 1}/2 · 다음 한 번 ${kstHm(at)}(사람이 일하는 10~12시)` };
    const pcOk = T.some((t) => t && t.ok && t.who !== who && now - (+t.at || 0) < 6 * 3600e3) || Object.entries((doc && doc.dev) || {}).some(([w, v]) => w !== who && v && v.in && now - (+v.at || 0) < 6 * 3600e3);
    if (!pcOk) return { ok: false, kind: 'dcquiet', until: now + 3600e3, why: `${who} 시험 차례지만 최근 6시간 안 PC 로그인 성공이 없음 — 계정이 멀쩡할 때만 시험` };
    return null; }
  function decide(doc, who, now, o) { o = o || {}; const c = cfgOf(doc);
    if (!o.dc && isAlways(c, who)) { const nx0 = +((doc && doc.next) || {})[who] || 0; const T = (doc && doc.tries) || []; let la = 0; for (let i = T.length - 1; i >= 0; i--) if (T[i] && T[i].who === who) { la = +T[i].at || 0; break; }
      const nx = Math.min(nx0, la ? la + c.retrySec[1] * 1000 : 0); if (!o.force && nx > now) return { ok: false, kind: 'retry', always: true, until: nx, why: `${who}(🔒 상시) 지난 시도가 안 됨 — 다음 시도 ${kstHm(nx)}(1~10분 무작위 · 사람처럼)` };
      if (o.seat !== false) { const s = seatAsk(doc, who, now, o, o.rnd); return { ok: true, always: true, cfg: c, patch: s.patch, seat: { n: s.n, max: s.max } }; }
      return { ok: true, always: true, cfg: c }; }
    if (doc && +doc.holdUntil > now) return { ok: false, kind: 'hold', until: +doc.holdUntil, why: doc.holdWhy || '정범님이 켠 계정 새 로그인 쉼' };
    const nx = +((doc && doc.next) || {})[who] || 0; if (!o.force && nx > now) return { ok: false, kind: 'retry', until: nx, why: `${who} 지난 시도가 안 됨 — 다음 시도 ${kstHm(nx)}(1~10분 무작위)` };
    if (o.dc && !o.force) { const q = dcQuiet(doc, who, now, o.rnd); if (q) return q; }
    if (o.dc && c.dcWaitMin > 0) { const T = (doc && doc.tries) || []; let bi = -1; for (let i = T.length - 1; i >= 0; i--) if (T[i] && T[i].blocked && now - (+T[i].at || 0) < c.dcWaitMin * 60e3) { bi = i; break; }
      if (bi >= 0 && !T.slice(bi + 1).some((t) => t && t.ok && t.who !== who)) return { ok: false, kind: 'dcwait', until: +T[bi].at + c.dcWaitMin * 60e3, why: `${kstHm(+T[bi].at)} ${T[bi].who}에 42FB 경고 뒤 아직 어느 PC도 새 로그인에 성공하지 않음 — 데이터센터(클라우드)는 PC가 먼저 성공할 때까지 기다림` }; }
    if (o.seat !== false) { const s = seatAsk(doc, who, now, o, o.rnd); if (!s.ok) return s; return { ok: true, cfg: c, patch: s.patch, seat: { n: s.n, max: s.max } }; }
    return { ok: true, cfg: c }; }
  /* 로그인 한 번 결과 → 계정 문서 고침(patch)과 하루 요약 고침(day) — r = { ok, how, why, blocked, net, credBad } · rnd = 0~1 무작위(다음 시도 간격) */
  function record(doc, who, now, r, rnd) { const c = cfgOf(doc); const net = r.net || ((doc && doc.net) || {})[who] || null; const code = r.ok ? null : codeOf(r.why);
    const t = { at: now, who, net, ok: !!r.ok, how: r.how || null, why: r.why ? String(r.why).slice(0, 200) : null, code }; if (r.blocked) t.blocked = true; if (r.credBad) t.credBad = true;
    const tries = [...((doc && doc.tries) || []), t].slice(-c.keep); const nextAt = r.ok ? 0 : r.credBad && c.credBadMin > 0 && !isAlways(c, who) ? now + c.credBadMin * 60e3 : now + between(c.retrySec, rnd); /* 🔒 상시 기기는 아이디 오류여도 6시간 쉼 없이 1~10분 무작위 */
    const p = { tries, lastTry: t, next: { [who]: nextAt } };
    if (!r.ok) p.dev = { [who]: { in: false, at: now, how: r.how || 'fail' } }; /* 🪑 실패하면 받아 둔 자리를 바로 풀어 줌(다른 기기가 기다리지 않게) */
    if (doc && doc.lock) p.lock = null; /* 예전 판(차례 표)이 남긴 것 정리 */
    const bk = `${who}·${net || '?'}`; const B = ((doc && doc.blk) || {})[bk]; let closed = null;
    if (r.blocked) p.blk = { [bk]: B && !B.okAt ? { ...B, last: now, n: (+B.n || 0) + 1 } : { first: now, last: now, n: 1, okAt: null } };
    else if (r.ok) { const open = Object.entries((doc && doc.blk) || {}).filter(([k, v]) => k.split('·')[0] === who && v && !v.okAt); if (open.length) { p.blk = {}; for (const [k, v] of open) { p.blk[k] = { ...v, okAt: now }; closed = closed || []; closed.push({ who, net: k.split('·').slice(1).join('·'), first: +v.first, okAt: now, n: +v.n || 0, min: Math.round((now - +v.first) / 60e3) }); } } }
    const res = r.ok ? 'ok' : r.blocked ? 'blocked' : 'fail';
    return { patch: p, nextAt, day: { id: kstDay(now), key: [who, net || '?', r.how || '?', res, code || '-'].join('·'), closed } }; }
  /* 로그인 판단을 해도 되는 화면인가 — 사람이 아는 방식만: ⓐ 샵매니저(/scm/)를 열었는데 로그인 화면으로 넘어감·로그인 칸이 뜸 ⓑ 로그인이 필요한 곳(내 계정·주문·팔기 장바구니)이 로그인 주소로 넘어감
   *  공개 화면(상품·중고 목록·숍 목록 — /scm/ 밖)은 로그인 판단에 쓰지 않음 → 'gate'(그 화면만 로그인 필요 — 19금 등) 또는 false */
  const LOGIN_URL = /\/login\/|wlogin|wC2CUser_Login/i;
  const AUTH_URL = /^(?:https?:\/\/[^\/]+)?\/(?:scm|account|order|mypage)\/|wbasket|wc2b_sales/i;
  const SCM_URL = /^(?:https?:\/\/[^\/]+)?\/scm\//i;
  function judge(url, finalUrl, hasPw, hasLogout, title, o) { o = o || {}; url = String(url || ''); finalUrl = String(finalUrl || url);
    if (LOGIN_URL.test(finalUrl) && !LOGIN_URL.test(url)) return AUTH_URL.test(url) ? 'suspect' : 'gate';
    if (!SCM_URL.test(url)) return false;
    if (hasPw && !hasLogout && !(o.titleOk || /샵매니저/).test(title || '')) return 'suspect';
    if (o.scmNeedsLogout && !hasLogout) return 'suspect';
    return false; }
  const net2 = (ip) => { const m = String(ip || '').match(/^(\d{1,3})\.(\d{1,3})\./); return m ? `${m[1]}.${m[2]}` : null; };
  return { DEF, cfgOf, kstDay, kstHm, between, isBlock, codeOf, decide, dcQuiet, record, judge, net2, LOGIN_URL, AUTH_URL, SCM_URL, PRI, isLive, seatView, seatAsk, seatYield, seatKeep, isAlways, slotOf };
})();
/* ═════════════ (정범님 10/26) 🔑 알라딘 로그인 — 사람처럼 (계정 단위 · 모든 PC·클라우드가 같은 규칙 __rnLoginRule) ═════════════
 * 예전(~1.89.104): 고객·출고 리더가 공개 상품 화면(머리에 로그인 칸이 있고 제목이 '샵매니저'가 아님)을 '로그인 풀림'으로 잘못 보고, 실제로는 로그인돼 있는데
 *  네이버 로그인 흐름을 1분마다 되풀이(10/20~26 약 1,070번 · JS-MAIN 10/26 297번) → 10/26 21:3x 계정 새 로그인 막힘(42FB6013 · 사람 시크릿 창도 막힘)
 * 이제(사람이 하는 그대로):
 *  ① 로그아웃 판단은 샵매니저(/scm/)가 로그인 화면으로 넘어갔거나 로그인 칸이 뜬 때 · 로그인이 필요한 곳(내 계정·팔기 장바구니)이 로그인 주소로 넘어간 때만 '의심'
 *     공개 화면(상품·중고 목록·숍 목록)은 판단에 안 씀 — 로그인 화면으로 가면 '그 화면만 로그인 필요'로 그 장만 건너뜀(19금 등)
 *  ② 의심이면 샵매니저 주문 화면을 한 번 열어 확인 → 로그인돼 있으면 '잘못 본 것'(로그인 안 함 · 그 요청만 다시) · 같은 화면 꼴을 3번 잘못 보면 그 화면은 로그인 판단에서 뺌(7일)
 *  ③ 진짜 풀렸을 때만(기기마다 각자 — 계정 전체 차례 없음 · 같은 PC의 여러 탭은 한 탭만): 5~20초 알아차리는 시간 → 이 PC가 평소 쓰는 방법(네이버·아이디)으로 한 번
 *     → 확인되면 하던 요청을 그 자리부터 이어 감 · 안 되면(42FB 경고도 같음) 1~10분 사이 무작위(매번 새로) 뒤 다시 — 이 PC에 로그인이 필요한 일이 남아 있는 동안만
 *     그동안 로그인이 필요한 맡긴 일은 이 PC가 받지 않음(로그인된 다른 PC·클라우드가 맡음) · 다른 기기가 다 해 주면 이 PC는 더 시도하지 않음
 *  사람에게 알리지 않음(네이버 로그인 자체가 풀린 때만 그 PC 화면에 창 — 사람 손 없이는 안 되는 일) — 관리도구 '🔑 알라딘 로그인'과 작업 기록·계정 문서 통계에만 남김 */
(function rnLoginGovInit() {
  if (window.__rnLoginGov) return;
  const RULE = globalThis.__rnLoginRule;
  const G = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } }; const S = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const PUB = () => !!(globalThis.__rnPubHome || globalThis.__rnPubChrome);
  const who = () => { try { return (window.__rnPcName && window.__rnPcName.get()) || 'PC'; } catch (e) { return 'PC'; } };
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('로그인', lv, m); } catch (e) {} };
  /* 계정 문서 — Firebase에 로그인돼 있으면 Firestore(트랜잭션), 아니면 이 PC 저장소(같은 규칙 · 이 PC 것만 셈) */
  const fs = () => { try { return window.firebase && firebase.apps.length && firebase.auth().currentUser ? firebase.firestore() : null; } catch (e) { return null; } };
  const REF = (db) => db.collection('app_settings').doc('aladin_login');
  const deep = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? { ...o[k], ...v } : v; return o; };
  async function tx(fn) { const db = fs();
    if (!db) { const d = G('rnu-login-acct', {}) || {}; CFG = RULE.cfgOf(d); const r = fn(d) || {}; if (r.patch) S('rnu-login-acct', deep(d, r.patch)); return { ...r, local: true }; }
    let out = null; await db.runTransaction(async (t) => { out = null; const sn = await t.get(REF(db)); const d = sn.exists ? sn.data() || {} : {}; CFG = RULE.cfgOf(d); out = fn(d) || {}; if (out.patch) t.set(REF(db), out.patch, { merge: true }); }); return out; }
  /* 하루 요약(부지런한 통계) — app_settings/aladin_login/days/{KST 날짜} · 기기·망·방법·결과·경고 코드별 수 + 닫힌 막힘(42FB가 처음 뜬 때 → 그 기기가 다시 성공한 때) */
  function dayPut(day) { const db = fs(); if (!db || !day) return; try { const FV = firebase.firestore.FieldValue; REF(db).collection('days').doc(day.id).set({ c: { [day.key]: FV.increment(1) }, at: Date.now(), ...(day.closed ? { eps: FV.arrayUnion(...day.closed) } : {}) }, { merge: true }).catch(() => {}); } catch (e) {} }
  /* 이 PC의 로그인 상태(모든 탭 공유) — { in: 참/거짓, at, until(다시 해 볼 수 있는 때), why } */
  const ST = 'rnu-login-st'; const st = () => G(ST, {}) || {};
  /* 🪑 판매자 로그인 자리(정범님 10/27 · 약관 제19조 — 규칙 __rnLoginRule.seatAsk 위 설명): 이 PC가 로그인 일을 하는 동안만 10~15분마다 신호(dev[이 PC] · 트랜잭션 seatKeep)
   *  · 신호 = 샵매니저 화면을 로그인된 채로 읽을 때(suspect가 로그아웃 링크를 봄 → seen) · 사람이 이 PC 알라딘 화면을 누를 때 · 다시 로그인했을 때
   *  · 자리가 없거나 넘길 차례면 이 PC 상태를 '자리 기다림'(in 거짓 · seat)으로 → 로그인 일은 받지 않고(ready 거짓) 샵매니저를 읽으려던 일은 '로그인 쉼'으로 그 일만 건너뜀 → 할 일이 남아 있으면 1~10분 무작위 뒤 다시 자리를 물음
   *  · 로그아웃 단추는 누르지 않음(그것도 사람답지 않은 되풀이가 될 수 있음) — 세션은 그대로 두고 쓰지 않을 뿐 */
  const SEAT = 'rnu-login-seat', USE = 'rnu-login-use', HUM = 'rnu-login-human', SHIP = 'rnu-login-ship'; let CFG = RULE.cfgOf(null);
  const ago = (k) => Date.now() - (+G(k, 0) || 0);
  const myPri = () => (ago(HUM) < CFG.liveMin * 60e3 ? RULE.PRI.human : ago(SHIP) < CFG.liveMin * 60e3 ? RULE.PRI.ship : RULE.PRI.pc);
  /* 🔒 상시 기기(정범님 10/27 15:12 절대 원칙 · 규칙 cfg.always — 기본 JS-MAIN·MJ-MAIN·HOME): 이 PC는 자리 기다림·로그인 쉼·잘못 본 화면 7일 제외를 받지 않음
   *  → 쉼 끝 시각(until)은 그 시각을 적은 때 + 1~10분 간격의 최대(retrySec)를 넘지 않게 자름 · 예전 판이 남긴 '자리 기다림' 표시는 무시 */
  const amAlways = () => !PUB() && RULE.isAlways(CFG, who());
  const untilOf = (s) => { const u = +(s && s.until) || 0; return amAlways() ? Math.min(u, (+(s && s.at) || 0) + CFG.retrySec[1] * 1000) : u; };
  const seatOf = (s) => !!(s && s.seat) && !amAlways();
  const seatAt = () => +((G(SEAT, null) || {}).at) || 0; const seatFresh = () => Date.now() - seatAt() < CFG.liveMin * 60e3 && !seatOf(st());
  let devAt = 0, devIn = null, beatGap = 0; const inCb = [];
  function devPut(inn, how, extra) { const now = Date.now(); if (devIn === inn && now - devAt < beatGap && !extra) return; devIn = inn; devAt = now; beatGap = RULE.between(CFG.beatSec); const db = fs(); const v = { dev: { [who()]: { in: inn, at: now, how: how || null, pri: myPri(), use: +G(USE, 0) || now, yield: false, ...(extra || {}) } } }; if (inn) S(SEAT, { at: now }); if (db) REF(db).set(v, { merge: true }).catch(() => {}); else S('rnu-login-acct', deep(G('rnu-login-acct', {}) || {}, v)); }
  /* 자리 지키기·받기(트랜잭션) → 참(자리 있음) | 거짓(자리 기다림·양보 — 이 PC 상태를 '자리 기다림'으로) */
  let holding = null;
  function hold(why) { if (holding) return holding; holding = hold0(why).finally(() => { holding = null; }); return holding; }
  async function hold0(why) { const me = who(); if (PUB()) return false; const out = await tx((doc) => RULE.seatKeep(doc, me, Date.now(), { pri: myPri(), use: +G(USE, 0) || Date.now() }, Math.random())).catch(() => null);
    if (!out) return seatOf(st()) ? false : true; /* 계정 문서를 못 읽음 — 지금 상태 그대로(🔒 상시 PC는 늘 참) */
    if (out.ok) { devIn = true; devAt = Date.now(); beatGap = RULE.between(CFG.beatSec); S(SEAT, { at: Date.now() }); const s = st(); if (s.seat) { S(ST, { in: true, at: Date.now(), how: out.always ? '🔒 상시' : '자리 받음' }); L('info', `🪑 알라딘 판매자 로그인 자리를 받음(${out.n}/${out.max}대) — 로그인이 필요한 일을 다시 함`); inCb.forEach((f) => { try { f(); } catch (e) {} }); } return true; }
    devIn = false; devAt = Date.now(); S(SEAT, null); S(ST, { in: false, at: Date.now(), until: out.until, why: out.why, seat: out.kind });
    L('warn', `🪑 ${out.why} — 로그인이 필요한 일은 받지 않음(로그인된 다른 기기가 맡음) · 이 PC에 로그인 일이 남아 있으면 ${RULE.kstHm(out.until)}에 다시 자리를 물음${why ? ' · ' + why : ''}`); return false; }
  /* 로그인 일을 했다는 표시(1분에 한 번만 저장) — 신호 때가 되면 자리 지키기 */
  let useAt = 0;
  function seen() { if (PUB()) return; const now = Date.now(); if (now - useAt > 60e3) { useAt = now; S(USE, now); } const s = st(); if (s.in === false) return; /* 풀림·자리 기다림은 다시 로그인 흐름이 맡음 */
    if (now - seatAt() < (beatGap || CFG.beatSec[0] * 1000)) return; S(SEAT, { at: now }); /* 이 PC 여러 탭 중 한 번만 */ hold().catch(() => {}); }
  function markIn(how) { const s = st(); S(ST, { in: true, at: Date.now(), how: how || null }); if (seatFresh()) devPut(true, how); else hold(how).catch(() => {}); /* 자리 신호가 30분 넘게 없던 PC는 자리부터 */ if (s.in === false) { L('info', `🔑 알라딘 로그인 확인됨(${how || '확인'}) — 로그인이 필요한 일을 다시 받음`); inCb.forEach((f) => { try { f(); } catch (e) {} }); } }
  function markOut(until, why) { const s0 = st(); if (seatOf(s0) && +s0.until > Date.now()) return; S(ST, { in: false, at: Date.now(), until: until || 0, why: why || null }); S(SEAT, null); devPut(false, 'out'); }
  /* 로그인이 필요한 일을 지금 받아도 되나(맡긴 일 pcCan) — 로그인돼 있거나(모름 포함), 풀렸어도 다시 해 볼 때가 됐으면 참 */
  const ready = () => { if (PUB()) return false; const s = st(); if (seatOf(s)) return false; /* 🪑 자리 기다림 — 자리를 받을 때까지(다시 로그인 흐름 relogin이 물음) · 🔒 상시 PC는 자리 기다림이 없음 */ return s.in !== false || Date.now() >= untilOf(s); };
  /* 잘못 본 화면 기억 — 같은 화면 꼴(주소 길)을 잘못 보면 세고, 3번이면 그 화면은 로그인 판단에서 뺌(7일 · 이 PC) */
  const MR = 'rn-login-misread'; const recent = new Map();
  const pkey = (u) => { try { return new URL(String(u), 'https://www.aladin.co.kr').pathname.toLowerCase(); } catch (e) { return String(u || '').split('?')[0].toLowerCase(); } };
  function misreadSkip(url) { const t = recent.get(String(url)); if (t && Date.now() - t < 120e3) return true; if (amAlways()) return false; /* 🔒 상시 PC는 '잘못 본 화면 7일 제외'를 받지 않음(2분 안 같은 주소만 거름) */ const m = G(MR, {}) || {}; const e = m[pkey(url)]; return !!(e && e.n >= 3 && Date.now() - e.at < 7 * 864e5); }
  function misreadAdd(url, why) { recent.set(String(url), Date.now()); if (recent.size > 200) recent.delete(recent.keys().next().value); const m = G(MR, {}) || {}; const k = pkey(url); const e = m[k] && Date.now() - m[k].at < 7 * 864e5 ? m[k] : { n: 0 }; m[k] = { n: e.n + 1, at: Date.now(), why: String(why || '').slice(0, 80) }; S(MR, m);
    L('warn', `🔑 로그인 풀림으로 잘못 봄(${k} · ${m[k].n}번째) — 샵매니저는 로그인돼 있어 다시 로그인하지 않고 그 요청만 다시${m[k].n >= 3 ? ' · 이 화면은 이제 로그인 판단에서 뺌(7일)' : ''}`); }
  /* ① 의심 판단 — 'suspect' | 'gate'(그 화면만 로그인 필요) | false */
  function suspect(url, finalUrl, doc, o) { if (!doc) return false; let hasPw = false, hasOut = false; try { hasPw = !!doc.querySelector('input[type="password"]'); hasOut = !!doc.querySelector('a[href*="wC2Cuser_logout"]'); } catch (e) {}
    const j = RULE.judge(url, finalUrl, hasPw, hasOut, doc.title || '', o); if (j === 'suspect' && misreadSkip(url)) return false;
    if (!j && (RULE.SCM_URL.test(String(url || '')) || RULE.AUTH_URL.test(String(url || '')))) { if (seatOf(st()) && !PUB()) return 'suspect'; /* 🪑 자리 기다림 중 — 로그인 일은 '로그인 쉼'으로(그 일만 건너뜀 · 다시 로그인 흐름이 자리를 물음) */ if (hasOut) seen(); }
    return j; }
  /* 일반 확인(샵매니저 주문 화면 한 번) — 모듈이 자기 확인 함수를 주면 그것을 씀 */
  async function checkIn() { try { const AL = globalThis.ReadnowAladin; const r = await fetch('https://www.aladin.co.kr/scm/worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); return r.ok && !(AL ? AL.looksLoggedOut(r.url, d, { titleOk: /샵매니저/ }) : /\/login\/|wlogin/i.test(r.url)); } catch (e) { return false; } }
  /* ② 의심이면 한 번 더 확인 → 'misread'(로그인돼 있음 — 잘못 본 것) | 'out'(진짜 풀림) */
  async function verify(o) { if (!ready()) return 'out'; /* 이미 풀린 것을 알고 다음 시도를 기다리는 중 — 다시 묻지 않음 */ const ok = await (o.isLoggedIn || checkIn)(); if (ok) { misreadAdd(o.url || '', o.why || ''); markIn('확인'); return 'misread'; } L('warn', `🔑 샵매니저 확인: 로그인이 풀려 있음(${pkey(o.url || '')}에서 알아챔)`); devPut(false, 'out'); return 'out'; }
  const waitErr = (o, d) => { const msg = `🔑 알라딘 로그인 쉼 — ${d.why}${d.until ? ` · ${RULE.kstHm(d.until)}에 다시 해 봄` : ''} (이 일은 건너뜀 · 로그인이 필요한 맡긴 일은 로그인된 다른 PC·클라우드가 맡음)`; const e = o.mkErr ? o.mkErr(msg, d) : new Error(msg); e.loginWait = true; e.until = d.until || 0; e.kind = d.kind; e.why0 = d.why; return e; };
  let inFlight = null, provider = null; const needs = new Map();
  /* ③ 진짜 풀렸을 때 — 사람처럼 한 번 로그인 → 참(로그인됨 · 하던 일 이어 감) 또는 throw(쉼 · 그 일만 건너뜀)
   *  o = { isLoggedIn, doLogin()→참/거짓, how:'naver'|'cred', canLogin()→못 하는 까닭|null, stopped(), say(글), mkErr(글, d), force } */
  function relogin(o) { if (inFlight) return inFlight.then(() => true, (e) => { throw waitErr(o, { why: (e && e.why0) || '같은 탭의 다른 일이 방금 로그인하지 못함', until: (e && e.until) || +st().until || 0, kind: (e && e.kind) || 'local' }); }); inFlight = relogin0(o).finally(() => { inFlight = null; }); return inFlight; }
  async function relogin0(o) { const me = who(); const isIn = o.isLoggedIn || checkIn; const say = (m) => { try { o.say && o.say(m); } catch (e) {} };
    if (PUB()) throw waitErr(o, { why: '🛡 로거는 알라딘에 로그인하지 않음', kind: 'pub' });
    { const s0 = st(); const u0 = untilOf(s0); if (!o.force && s0.in === false && Date.now() < u0) throw waitErr(o, { why: s0.why || '다음 시도를 기다림', until: u0, kind: seatOf(s0) ? 'seat' : 'retry' }); }
    /* 🪑 로그인 일을 다시 하기 전에 판매자 로그인 자리부터(자리 기다림이었거나 30분 넘게 자리 신호가 없던 PC) — 세션이 살아 있어도 자리 없이 쓰지 않음 */
    if (!amAlways() && !seatFresh() && !(await hold('다시 로그인 전'))) { /* 🔒 상시 PC는 자리를 묻지 않음(아래 decide가 신호만 적음) */ const s1 = st(); throw waitErr(o, { why: s1.why || '판매자 로그인 자리 기다림', until: +s1.until || 0, kind: 'seat' }); }
    if (await isIn()) { markIn('확인'); return true; }
    const cant = o.canLogin ? o.canLogin() : null; if (cant) { markOut(Date.now() + 10 * 60e3, cant); throw waitErr(o, { why: cant, until: Date.now() + 10 * 60e3, kind: 'nocred' }); }
    /* 같은 PC의 다른 탭이 로그인하는 중이면 그 결과를 기다림(각 탭이 따로 로그인하지 않게) */
    for (let i = 0; i < 40; i++) { const b = G('rnu-login-busy', null); if (!b || Date.now() - b.at > 4 * 60e3 || b.tab === window.__rnTab) break; say('같은 PC의 다른 탭이 알라딘에 로그인하는 중 — 기다림'); await sleep(6000); if (await isIn()) { markIn('다른 탭'); return true; } if (o.stopped && o.stopped()) throw waitErr(o, { why: '멈춤', kind: 'stop' }); }
    /* 이 기기가 지금 해도 되나 — 기기마다 각자(계정 전체 차례 없음 · 정범님 10/26 23:53): 이 기기의 다음 시도 때 · 정범님이 켠 계정 쉼만 봄 */
    const d = await tx((doc) => RULE.decide(doc, me, Date.now(), { force: o.force, pri: myPri(), rnd: Math.random() })).catch((e) => ({ ok: true, why: '계정 상태 문서를 못 읽음: ' + (e.code || e.message) })); /* 문서를 못 읽어도 이 PC 저장소의 다음 시도 때(위 s0)는 지킴 */
    if (!d.ok && d.kind === 'seat') { S(SEAT, null); devIn = false; devAt = Date.now(); S(ST, { in: false, at: Date.now(), until: d.until, why: d.why, seat: 'seat' }); L('warn', `🪑 ${d.why} — 세션이 풀렸지만 다시 로그인하지 않음(자리를 넘김) · ${RULE.kstHm(d.until)}에 다시 물음`); throw waitErr(o, d); }
    if (!d.ok) { markOut(d.until, d.why); L('warn', `🔑 ${d.why}`); throw waitErr(o, d); }
    if (d.seat) { S(SEAT, { at: Date.now() }); devIn = true; devAt = Date.now(); beatGap = RULE.between(CFG.beatSec); /* 방금 decide가 자리 신호를 적음 — 곧 이어지는 markIn이 같은 신호를 또 쓰지 않게 */ }
    const C0 = d.cfg || RULE.cfgOf(null);
    /* 알아차리는 시간 — 사람이 '어, 풀렸네' 하고 로그인하러 가는 만큼(5~20초 무작위) */
    const w = RULE.between(C0.noticeSec); say(`알라딘 로그인이 풀림 — ${Math.round(w / 1000)}초 뒤 ${o.how === 'naver' ? '네이버로' : '아이디로'} 한 번 로그인`); L('info', `🔑 로그인이 풀린 것을 확인 — ${Math.round(w / 1000)}초 뒤 ${o.how === 'naver' ? '네이버(로그인 상태 유지)' : '아이디·비밀번호'}로 한 번 로그인`);
    await sleep(w); if (await isIn()) { markIn('저절로 돌아옴'); return true; }
    S('rnu-login-busy', { at: Date.now(), tab: window.__rnTab || null }); const t1 = Date.now(); let ok = false, why = null;
    try { ok = !!(await o.doLogin()); } catch (e) { why = String(e && e.message || e).slice(0, 160); } finally { S('rnu-login-busy', null); }
    if (!ok) ok = await isIn();
    const al = G('rn-login-alert', null); const alMsg = al && +al.at >= t1 - 5000 ? String(al.msg || '') : ''; const blocked = !ok && RULE.isBlock(alMsg);
    if (!ok && !why) why = alMsg ? `알라딘 경고: ${alMsg}` : '로그인 뒤에도 샵매니저가 열리지 않음'; else if (!ok && alMsg && !why.includes(alMsg)) why = `알라딘 경고: ${alMsg} · ${why}`;
    let R = null; await tx((doc) => { R = RULE.record(doc, me, Date.now(), { ok, how: o.how || null, why: ok ? null : why, blocked }, Math.random()); return { patch: R.patch }; }).catch(() => {}); if (R) dayPut(R.day);
    if (ok) { markIn(o.how === 'naver' ? '네이버 로그인' : '아이디 로그인'); L('info', `🔑 다시 로그인함(${o.how === 'naver' ? '네이버' : '아이디'}) — 하던 일을 그 자리부터 이어 감`); return true; }
    const until = (R && R.nextAt) || Date.now() + RULE.between(C0.retrySec);
    markOut(until, why); L(blocked ? 'err' : 'warn', `🔑 로그인 안 됨: ${why}${blocked ? ' (계정 새 로그인 막힘 42FB — 같은 규칙으로 다시)' : ''} · 이 PC에 로그인이 필요한 일이 남아 있으면 ${RULE.kstHm(until)}에 다시(1~10분 무작위)`);
    throw waitErr(o, { why: blocked ? '알라딘 경고 42FB(계정 새 로그인 막힘)' : why, until, kind: 'retry' }); }
  /* 로그인이 필요한 일이 남아 있는 동안 다시 시도 — 모듈이 '할 일 있음'(need)과 로그인 방법(provide)을 알려 줌 · 20초마다 보고 다음 시도 때가 됐고 할 일이 있으면 한 번 */
  const anyNeed = () => [...needs.values()].some((f) => { try { return !!f(); } catch (e) { return false; } });
  setInterval(() => { try { if (PUB() || window.top !== window || inFlight || !provider) return; const s = st(); if (s.in !== false || Date.now() < untilOf(s) || !anyNeed()) return; L('info', `🔑 이 PC에 로그인이 필요한 일이 남아 있어 다시 로그인해 봄${amAlways() ? '(🔒 상시 PC)' : ''}`); relogin(provider()).catch(() => {}); } catch (e) {} }, 20e3);
  /* 로그인 화면 경고 잡기 — 알라딘 로그인 화면(/login/…)에서: ⓐ 화면 글·화면 안 스크립트에 막힘 글이 있으면 ⓑ 그 뒤에 뜨는 경고창(alert) 글을 화면 쪽에 심은 고리로 받아 'rn-login-alert'에 남김
   *  ⚠ 화면을 읽어 들이는 도중에 바로 뜨는 경고창은 이 스크립트가 깨어나기 전이라 못 잡을 수 있음(그때는 '샵매니저가 안 열림'으로만 남음) — 클라우드는 경고창을 늘 잡음 */
  if (/(^|\.)aladin\.co\.kr$/i.test(location.hostname) && /login/i.test(location.pathname) && !PUB()) {
    const put = (msg, src) => { msg = String(msg || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!msg) return; const prev = G('rn-login-alert', null); if (prev && prev.msg === msg && Date.now() - prev.at < 60e3) return; S('rn-login-alert', { msg, at: Date.now(), src, url: location.origin + location.pathname }); };
    try { const h = document.documentElement.innerHTML.slice(0, 400000); const m = h.match(/[^'"<>\n]{0,40}(로그인\s*과정에\s*문제|에러\s*코드\s*[:：]?\s*42FB)[^'"<>\n]{0,80}/i); if (m) put(m[0], 'html'); } catch (e) {}
    try { const sc = document.createElement('script'); sc.textContent = "(function(){try{var a=window.alert;window.alert=function(m){try{document.documentElement.setAttribute('data-rn-alert',String(m).slice(0,300)+'⁣'+Date.now());}catch(e){}return a.apply(this,arguments);};}catch(e){}})();"; (document.head || document.documentElement).appendChild(sc); sc.remove(); } catch (e) {}
    try { new MutationObserver(() => put(String(document.documentElement.getAttribute('data-rn-alert') || '').split('⁣')[0], 'alert')).observe(document.documentElement, { attributes: true, attributeFilter: ['data-rn-alert'] }); } catch (e) {}
  }
  /* 사람이 직접 로그인하다 42FB를 받아도(수집기가 시도하는 중이 아닐 때) 통계에 한 번 — 다음 자동 시도는 같은 규칙(1~10분 무작위) */
  const onAlert = (v) => { if (!v || !RULE.isBlock(v.msg) || Date.now() - (+v.at || 0) > 5 * 60e3 || !fs()) return; const b = G('rnu-login-busy', null); if (b && Date.now() - b.at < 4 * 60e3) return; let R = null; tx((doc) => { if ((doc.tries || []).some((t) => t && t.who === who() && Math.abs((+t.at || 0) - +v.at) < 60e3)) return {}; R = RULE.record(doc, who(), +v.at, { ok: false, how: '사람', why: `알라딘 경고: ${v.msg}`, blocked: true }, Math.random()); return { patch: R.patch }; }).then(() => { if (R) dayPut(R.day); }).catch(() => {}); };
  try { if (typeof GM_addValueChangeListener === 'function' && !/login/i.test(location.pathname) && window.top === window) GM_addValueChangeListener('rn-login-alert', (k, o, n, remote) => { if (remote) onAlert(n); }); } catch (e) {}
  /* 풀린 동안 10분마다 한 번 가볍게 확인(이 PC 모든 탭 중 하나만) — 사람이 직접 로그인했거나 세션이 돌아오면 곧 '로그인됨'으로 */
  setInterval(() => { try { if (PUB() || window.top !== window || !/\/scm\//i.test(location.pathname)) return; const s = st(); if (s.in !== false || seatOf(s)) return; /* 🪑 자리 기다림 중엔 확인도 하지 않음(계정을 쓰지 않음) */ const c = G('rnu-login-chk', 0); if (Date.now() - c < 10 * 60e3) return; S('rnu-login-chk', Date.now()); checkIn().then((ok) => { if (ok) markIn('10분 확인'); }); } catch (e) {} }, 60e3);
  /* 🪑 사람이 이 PC 알라딘 화면을 누름 = 우선순위 '사람'(30분) · 샵매니저 화면이 로그인된 채로 열림 = 로그인 일을 함(신호) */
  const human = () => { if (ago(HUM) > 60e3) S(HUM, Date.now()); };
  if (/(^|\.)aladin\.co\.kr$/i.test(location.hostname) && !PUB() && window.top === window) {
    try { const on = (e) => { if (e && e.isTrusted) human(); }; addEventListener('pointerdown', on, true); addEventListener('keydown', on, true); } catch (e) {}
    try { if (RULE.SCM_URL.test(location.pathname) && document.querySelector && document.querySelector('a[href*="wC2Cuser_logout"]')) setTimeout(() => { try { seen(); } catch (e) {} }, 3000 + Math.random() * 7000); } catch (e) {}
  }
  window.__rnLoginGov = { RULE, suspect, verify, relogin, ready, markIn, markOut, state: st, misreadSkip, hold, seen, always: amAlways,
    human, ship: () => { if (ago(SHIP) > 60e3) S(SHIP, Date.now()); }, pri: myPri,
    provide: (fn) => { provider = fn; }, need: (k, fn) => { if (fn) needs.set(k, fn); else needs.delete(k); }, onIn: (fn) => inCb.push(fn),
    /* 맡긴 일 종류가 알라딘 로그인이 필요한가 — 노선표 lane 'scm' + 내 계정·팔기 장바구니 */
    needs: (type, kind) => !!((kind && kind.lane === 'scm') || type === 'aladinBuy' || type === 'c2bAdd') };
})();
/* (1.38.0) 일시정지 = 이 PC의 모든 수집기 탭에 한 번에 (예전: 누른 탭에서만 멈춤 → 다른 탭에서 돌던 작업은 계속 돌고, 버튼은 3초 뒤 다시 켜져 '안 먹는' 것처럼 보였음)
 *  상태는 GM 'rnu-paused'(참/거짓) 한 곳. 값이 바뀌면 모든 탭이 바로 알아채고(GM_addValueChangeListener, 없으면 3초마다 확인) 자기 작업을 지금 항목까지 저장하고 멈춤 */
(function rnPause() {
  window.__rnPaused = !!GM_getValue('rnu-paused', false);
  const stopHere = () => { try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {} try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} };
  const changed = () => { try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {} };
  window.__rnPauseInfo = () => GM_getValue('rnu-paused-info', null);
  window.__rnPauseAll = (why) => { window.__rnPaused = true; let keys = []; try { const P0 = window.__rnPrd; keys = P0 && P0.runningKeys ? [...P0.runningKeys()] : []; } catch (e) {} GM_setValue('rnu-paused-info', { at: Date.now(), why: why || '사람이 누름', keys }); /* (1.89.68) 멈출 때 이 PC가 하던 일 — '다시 시작'은 이것만 이어감 */ GM_setValue('rnu-paused', true); stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', `■ 일시정지 (${why || '사람이 누름'}) — 이 PC의 모든 수집기 탭(고객·상품·일괄)이 지금 항목까지 저장하고 멈춤. 사람이 다시 시작하기 전에는 자동으로 다시 시작하지 않음`); changed(); };
  window.__rnResumeOk = () => { if (window.__rnPaused) window.__rnLog && window.__rnLog('수집기', 'info', '▶ 사람이 다시 시작함 (일시정지 풀림)'); window.__rnPaused = false; GM_setValue('rnu-paused', false); changed(); };
  const onRemote = (v) => { v = !!v; if (v === window.__rnPaused) return; window.__rnPaused = v; if (v) { stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', '■ 다른 탭에서 일시정지를 눌렀습니다 — 이 탭의 작업도 지금 항목까지 저장하고 멈춤'); } else window.__rnLog && window.__rnLog('수집기', 'info', '▶ 다른 탭에서 다시 시작을 눌렀습니다 (일시정지 풀림)'); changed(); };
  try { if (typeof GM_addValueChangeListener === 'function') GM_addValueChangeListener('rnu-paused', (k, o, n, remote) => { if (remote) onRemote(n); }); else throw 0; } catch (e) { setInterval(() => onRemote(GM_getValue('rnu-paused', false)), 3000); }
})();
/* (1.56.0) 한 PC에 수집기 하나 — 같은 PC(같은 브라우저)에서 수집기 화면(주문조회·판매관리·상품 조회)을 여러 탭·창으로 열어도 '일하는 수집기'는 한 탭뿐
 *  · 먼저 열린 탭 = 이 PC의 수집기(lead): 매일 자동 수집·웹앱 요청·맡긴 일(등록·송장·시장 지표)·이어가기를 모두 맡음
 *  · 나중에 열린 탭 = 쉬는 탭(follow): 관제판·기록 창이 접힌 채로 뜨고, 어떤 작업도 저절로 시작하지 않음. 머리줄 아래 옅은 띠에 '이미 이 PC에서 수집기가 일하는 중'을 표시
 *    수집기 탭을 닫으면 쉬는 탭 중 하나가 저절로 이어받음(그때부터 자동 작업도 맡음)
 *  · 꼭 필요하면 쉬는 탭에서 [이 탭도 수집기로 켜기] → 단점을 알린 뒤 켬(force): 사람이 직접 누른 작업만 하고, 자동·웹앱 요청·맡긴 일은 계속 원래 탭이 맡음. 새로고침하면 다시 쉬는 탭
 *  고르는 방법: 브라우저의 Web Locks('rn-collector-lead' — 탭이 닫히거나 멈추면 브라우저가 저절로 풀어 줌). 없는 브라우저면 GM 값 심장박동(5초, 15초 조용하면 넘겨받음)
 *  안전한 새로고침(새 탭을 열고 옛 탭을 닫음)으로 열린 새 탭은 '이어받을 탭(heir)'으로 표시해, 다른 쉬는 탭이 아니라 그 탭이 수집기를 이어받음 */
(function rnRole() {
  const PANEL = (window.top === window && /\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname)) || !!globalThis.__rnPubHome;
  const ME = window.__rnTab || Math.random().toString(36).slice(2, 8); window.__rnTab = ME;
  const PAGE = location.pathname.split('/').pop();
  const LK = 'rn-collector-lead', GK = 'rnu-lead', HK = 'rnu-lead-heir';
  let role = PANEL ? 'wait' : 'other'; let release = null; let beatT = null; let readyRes; const subs = [];
  window.__rnRoleReady = new Promise((r) => (readyRes = r)); if (!PANEL) readyRes();
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('수집기', lv, m); } catch (e) {} };
  const fire = () => { readyRes(); subs.forEach((f) => { try { f(role); } catch (e) {} }); try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {} };
  window.__rnPageName = (p) => (/worders/i.test(p || '') ? '주문조회' : /wrecord_edit/i.test(p || '') ? '상품 조회' : /preparatory/i.test(p || '') ? '판매관리' : p || '다른 화면');
  window.__rnRole = () => role;
  window.__rnRoleOn = (f) => subs.push(f);
  window.__rnLead = () => { const v = GM_getValue(GK, null); return v && Date.now() - (v.at || 0) < 20000 ? v : null; };
  /* 자동·원격 작업을 건너뛸 탭: 쉬는 탭·확인 중·떠나는 탭, 그리고 '켜 둔' 탭(사람이 누른 것만) */
  window.__rnRest = () => role === 'wait' || role === 'follow' || role === 'force' || role === 'leaving';
  /* (1.89.120 2시간 점검) 얼어붙은 수집기 탭 — 10/27 JS-MAIN: 수집기 탭(상품 조회 · 기록 창 열림 · 5분에 긴 작업 30초)이 08:58 뒤 아무 코드도 돌지 않는데(브라우저가 탭을 얼림·멈춤) Web Lock은 계속 쥐고 있어,
   *  그 뒤 연 수집기 탭 넷이 모두 '이미 일하는 중'으로 쉬었고 7시간 넘게 이 PC 신호(pcBeat)·자동 일이 멈췄음. 쉬는 탭이 수집기 탭의 심장박동(rnu-lead · 5초, 백그라운드에서도 1분 안)을 1분마다 보고,
   *  15분 넘게 그대로인 것을 이 탭이 쉬지 않고 깨어 있는 3분 동안 거듭 확인하면(PC 잠자기에서 막 깬 때는 건너뜀) Web Lock을 넘겨받음(steal). 얼었던 탭이 깨어나면 다른 탭의 새 심장박동을 보고 스스로 쉬는 탭으로 물러남 */
  const lostLead = () => { const v = GM_getValue(GK, null); return v && v.tab !== ME && v.since && Date.now() - (v.at || 0) < 90000 && v.since > (window.__rnLeadSince || 0) ? v : null; }; /* 나보다 나중에 수집기가 된 다른 탭이 지금 뛰고 있으면 = 내 Web Lock은 넘겨짐 */
  const beat = () => { if (role === 'lead') { try { const o = lostLead(); if (o) return stepDown(o); GM_setValue(GK, { tab: ME, page: PAGE, at: Date.now(), since: window.__rnLeadSince || Date.now() }); } catch (e) {} } };
  let stepDown = () => {};
  const heirOther = () => { const h = GM_getValue(HK, null); return h && h.tab !== ME && Date.now() - (h.at || 0) < 3 * 60000 ? h : null; };
  const setLead = (how) => { role = 'lead'; window.__rnLeadSince = Date.now(); const h = GM_getValue(HK, null); if (h && h.tab === ME) GM_deleteValue(HK); beat(); clearInterval(beatT); beatT = setInterval(beat, 5000);
    if (how === 'promote') L('ok', '이 탭이 이제 이 PC의 수집기입니다 (앞서 일하던 수집기 탭이 닫혀 이어받음) — 지금부터 자동 수집·웹앱 요청·맡긴 일도 이 탭이 맡습니다'); fire(); };
  const setFollow = () => { if (role === 'force') return fire(); role = 'follow'; const v = window.__rnLead();
    L('info', `이 PC에서는 이미 수집기가 일하는 중${v ? ` (${window.__rnPageName(v.page)} 탭)` : ''} — 이 탭은 쉬는 상태로 엽니다. 저절로 시작하는 작업은 없고, 그 탭을 닫으면 이 탭이 이어받습니다`); fire(); };
  window.__rnForce = (on) => { if (!PANEL || role === 'lead') return; if (on) { role = 'force'; L('warn', '⚠ 이 탭도 수집기로 켬 (사람이 누름) — 이 PC에 수집기 2개. 자동·웹앱 요청은 원래 탭이 계속 맡고 이 탭은 직접 누른 작업만'); }
    else { const busy = (window.__rnPrd && window.__rnPrd.busy && window.__rnPrd.busy()) || (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()); if (busy) { alert('이 탭에서 작업이 진행 중입니다. 일시정지로 멈춘 뒤 다시 눌러 주세요'); return; } role = 'follow'; L('info', '이 탭을 다시 쉬는 상태로 돌림'); } fire(); };
  /* 쉬는 탭에서 사람이 작업 단추를 누르면: 켤지 묻고(단점 안내) 켜면 진행. 저절로 온 요청이면 막고 기록만 (10분에 한 번) */
  let lastNote = 0;
  window.__rnForceAsk = () => { const v = window.__rnLead();
    return confirm(`이 탭도 수집기로 켤까요?\n\n이 PC에서는 이미 ${v ? `'${window.__rnPageName(v.page)}' 탭의 ` : '다른 탭의 '}수집기가 일하고 있습니다. 한 PC에는 수집기 하나가 원칙입니다.\n\n켜면 생기는 단점:\n· 같은 PC·같은 알라딘 아이디로 요청이 두 배로 나가, '요청 너무 많음(429)'·잠시 막힘에 더 빨리 걸립니다. 걸리면 두 탭 모두 느려지고, 다른 PC의 수집까지 늦어질 수 있습니다\n· 두 탭이 같은 종류의 작업을 하면 진행 위치(이어하기 자리)를 서로 덮어쓰거나 같은 쪽을 두 번 읽을 수 있습니다 (작업 잠금이 대부분 막지만 완전하지는 않습니다)\n· 브라우저 메모리·CPU를 두 배로 써서 탭이 느려지거나 멈출 수 있습니다\n· 기록과 진행 상태가 두 탭으로 나뉘어, 무엇이 어디서 도는지 헷갈리기 쉽습니다\n\n켜도 매일 자동 수집·웹앱 요청·맡긴 일(등록·송장·시장 지표)은 원래 탭이 계속 맡고, 이 탭은 사람이 직접 누른 작업만 합니다.\n이 탭을 새로고침하면 다시 쉬는 상태로 돌아갑니다.\n\n그래도 이 탭을 켤까요?`); };
  window.__rnGate = (what) => { if (role === 'lead' || role === 'other' || role === 'force') return true;
    let gesture = false; try { gesture = !!(navigator.userActivation && navigator.userActivation.isActive); } catch (e) {}
    if (gesture && role !== 'leaving') { if (window.__rnForceAsk()) { window.__rnForce(true); return true; } return false; }
    if (Date.now() - lastNote > 10 * 60000) { lastNote = Date.now(); L('info', `쉬는 탭이라 '${what || '작업'}'을(를) 시작하지 않음 — 이 PC의 수집기 탭이 맡습니다`); } return false; };
  /* 안전한 새로고침: 옛 탭은 넘겨주며 놓고(떠남), 새 탭은 '이어받을 탭'으로 표시 */
  window.__rnLeadRelease = () => { if (role !== 'lead') return; role = 'leaving'; clearInterval(beatT); try { const v = GM_getValue(GK, null); if (v && v.tab === ME) GM_deleteValue(GK); } catch (e) {} if (release) { const r = release; release = null; r(); } };
  window.__rnClaimHeir = () => { try { GM_setValue(HK, { tab: ME, at: Date.now() }); } catch (e) {} };
  addEventListener('pagehide', () => { if (role === 'lead') { try { const v = GM_getValue(GK, null); if (v && v.tab === ME) GM_deleteValue(GK); } catch (e) {} } });
  if (!PANEL) return;
  const hold = () => new Promise((res) => { release = res; });
  // 넘겨받을 차례가 됐는데 이어받을 탭(heir)이 따로 있으면, 그 탭에 양보하고 다시 줄을 섬
  let qAc = null; const queue = () => navigator.locks.request(LK, (() => { try { qAc = new AbortController(); return { signal: qAc.signal }; } catch (e) { qAc = null; return {}; } })(), () => { if (heirOther()) { setTimeout(queue, 1500); return null; } setLead('promote'); return hold(); }).catch(() => {});
  let stealT = null, seen = null; const STALE = 15 * 60000;
  const stealChk = () => { if (role !== 'follow') { seen = null; return; } const now = Date.now(); const v = GM_getValue(GK, null);
    if (!v || !v.at || now - v.at < STALE || heirOther() || (seen && now - seen.tick > 150000)) { seen = null; if (v && v.at && now - v.at >= STALE) seen = { at: v.at, t0: now, tick: now }; return; }
    if (!seen || seen.at !== v.at) { seen = { at: v.at, t0: now, tick: now }; return; } seen.tick = now; if (now - seen.t0 < 3 * 60000) return;
    clearInterval(stealT); stealT = null; seen = null; try { qAc && qAc.abort(); } catch (e) {} L('warn', `🧊 이 PC의 수집기 탭(${window.__rnPageName(v.page)})이 ${Math.round((now - v.at) / 60000)}분 넘게 신호가 없음(브라우저가 탭을 얼렸거나 멈춤) — 이 탭이 수집기를 넘겨받습니다`);
    navigator.locks.request(LK, { steal: true }, () => { setLead('steal'); return hold(); }).catch(() => {}); };
  const watchLead = () => { if (!stealT) stealT = setInterval(stealChk, 60000); };
  stepDown = (o) => { clearInterval(beatT); role = 'follow'; const r0 = release; release = null; if (r0) { try { r0(); } catch (e) {} } try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {}
    L('warn', `🧊 이 탭이 얼어 있던 사이 다른 탭(${window.__rnPageName(o.page)})이 수집기를 넘겨받았습니다 — 이 탭은 하던 일을 지금 항목까지 저장하고 쉬는 탭으로 물러납니다`); fire(); queue(); watchLead(); };
  const viaGM = () => { // Web Locks가 없는 브라우저: 심장박동
    const tick = () => { if (role === 'lead') return beat(); if (role === 'leaving') return; const v = GM_getValue(GK, null); const fresh = v && v.tab !== ME && Date.now() - (v.at || 0) < 15000;
      if (!fresh && !heirOther()) { GM_setValue(GK, { tab: ME, page: PAGE, at: Date.now() }); setTimeout(() => { const w = GM_getValue(GK, null); if (w && w.tab === ME) setLead(role === 'wait' ? 'first' : 'promote'); else if (role === 'wait') setFollow(); }, 800); }
      else if (role === 'wait') setFollow(); };
    tick(); setInterval(tick, 5000); };
  try {
    if (!navigator.locks || !navigator.locks.request) throw 0;
    navigator.locks.request(LK, { ifAvailable: true }, (lk) => { if (!lk || heirOther()) { setFollow(); queue(); watchLead(); return null; } setLead('first'); return hold(); }).catch(() => { if (role === 'wait') viaGM(); }); /* (1.89.120) 이미 정해진 뒤의 거절(넘겨받기로 Web Lock을 뺏김 = AbortError)에는 심장박동 방식으로 바꾸지 않음 — 바꾸면 두 탭이 번갈아 수집기가 됨 */
  } catch (e) { viaGM(); }
  setTimeout(() => { if (role === 'wait') { L('warn', '수집기 탭 정하기가 5초 안에 끝나지 않아 심장박동 방식으로 바꿉니다'); viaGM(); } }, 5000);
})();
(function rnPcName() {
  const keys = () => { let n = null; try { n = GM_getValue('rnu-pcname', null) || GM_getValue('pcName', null) || (GM_getValue('rn-pc', {}) || {}).name || localStorage.getItem('rnu-pcname'); } catch (e) {} return n && String(n).trim() ? String(n).trim() : null; };
  const setAll = (n) => { n = String(n || '').trim(); if (!n) return; try { GM_setValue('rnu-pcname', n); GM_setValue('pcName', n); const pc = GM_getValue('rn-pc', null) || { id: Math.random().toString(36).slice(2, 10), name: '' }; if (pc.name !== n) { pc.name = n; GM_setValue('rn-pc', pc); } if (!globalThis.__rnPubChrome) localStorage.setItem('rnu-pcname', n); /* (1.71.0) 로거 크롬은 알라딘 쪽 저장소에 PC 이름을 남기지 않음 */ } catch (e) {} };
  const cur = keys(); if (cur) setAll(cur); // 한 곳에만 있어도 모두 맞춤
  window.__rnPcName = { get: keys, set: setAll, ask: (why) => { const v = keys(); if (v) return v; if (!window.__rnHuman(8000)) { window.__rnNote('이 PC의 이름이 아직 없습니다 — 수집기 개요에서 PC 이름을 정해 주세요 (사람이 없을 때는 묻지 않고 넘어감)', 'warn'); return null; } const n = prompt(`이 PC의 이름을 정해 주세요 (예: JS-MAIN, HOME). ${why || ''}\n한 번만 정하면 됩니다 — 새로고침·스크립트 교체 뒤에도 기억합니다.`); if (n && n.trim()) { setAll(n.trim()); return n.trim(); } return null; } };
})();
/* ═════════════ 작업 기록 (두 모듈 공통) ═════════════
 * 모든 진행(단계 시작·끝, 쪽·항목마다의 진행, 양보·기다림·오류)을 초 단위로 남김.
 * 이 PC: 날짜별로 브라우저에 보관(최근 7일) — 새로고침·멈춤 뒤에도 남음.  Firebase: rn_logs/{PC}_{날짜시각10분} 에 1분마다 묶어서 올림 → 웹앱이나 다른 PC에서도 확인.
 * 화면: 위쪽 [기록] 버튼 → 크게 보는 창 (중요만/전체/오류, 검색, 자동 스크롤, 내려받기). 진행을 늦추지 않게 화면 갱신은 1초에 한 번. */
/* (1.60.1) 수집기 창들(관제판·상품/고객 패널·작업 기록·⏰ 칸 편집기·등록 창)의 앞뒤 — 누른 창이 맨 앞으로(늘 맨 위로 고정된 창 없음) */
(function rnZ() { if (window.top !== window || window.__rnFront) return; const SEL = '#rn-ctl, #rnp, #rn-crm, #rn-jw, #rnas, #rnRegFill'; let top = 2147483600;
  window.__rnFront = (el) => { if (!el) return; const L = globalThis.__rnQA(SEL); L.forEach((e) => { if (!e.style.zIndex) e.style.zIndex = String(++top); });
    if (top >= 2147483640) { top = 2147483600; L.filter((e) => e !== el).sort((a, b) => +a.style.zIndex - +b.style.zIndex).forEach((e) => (e.style.zIndex = String(++top))); } el.style.zIndex = String(++top); };
  globalThis.__rnOn('pointerdown', (e) => { const el = e.target && e.target.closest && e.target.closest(SEL); if (el) window.__rnFront(el); }, true); })();
(function rnJournal() {
  if (window.top !== window || window.__rnLog) return;
  const MAXMEM = 30000; const buf = []; let bufN = 0; /* (1.74.4) 화면이 그린 뒤 새 줄이 왔는지 — 예전엔 buf.length로 봐서 1만 줄이 차면 길이가 그대로라 '이번 화면'이 멈춰 보였음 */ const lt = []; let ltDirty = false; const pend = []; const idbPend = []; let dirty = false; let seq = 0;
  const day = (d) => { const k = new Date(d.getTime() + 9 * 3600e3); return k.toISOString().slice(0, 10); };
  const LSK = (d) => 'rnu-log-' + d;
  // ── 기록 보관: 이 PC의 IndexedDB('rn-journal')에 날짜별로 덧붙임 — 지우지 않고 계속 쌓음 (내려받기 하면 그때 비움)
  /* (1.71.0) 로거 크롬: 작업 기록을 알라딘 쪽 저장소(IndexedDB)에 두지 않고 이 탭 메모리에만(서버 기록 rn_logs는 그대로) — 알라딘 화면 스크립트가 읽을 수 있는 곳에 흔적을 남기지 않게 */
  const JMEM = globalThis.__rnPubChrome ? new Map() : null; const JDB = () => (JMEM ? Promise.resolve({ __mem: 1, close() {} }) : new Promise((res, rej) => { const r = indexedDB.open('rn-journal', 1); r.onupgradeneeded = () => r.result.createObjectStore('days', { keyPath: 'day' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const jtx = async (mode, fn) => { if (JMEM) { let out; const st = { get: (k) => { const q = { result: JMEM.get(k) }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, getAllKeys: () => { const q = { result: [...JMEM.keys()] }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, getAll: (rg) => { const q = { result: [...JMEM.entries()].filter(([k]) => !rg || (k >= rg.lower && k <= rg.upper)).map(([, v]) => v) }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, put: (rec) => { JMEM.set(rec.day, rec); if (JMEM.size > 6000) { const it = JMEM.keys(); for (let k = JMEM.size - 5000; k > 0; k--) JMEM.delete(it.next().value); } }, /* (1.71.1 자동 점검) 메모리 기록은 최근 묶음 5천~6천 개(20초 묶음 ≈ 하루 넘게)까지 — 24시간 켜 둔 로거 탭이 기록으로 메모리를 끝없이 쓰지 않게(서버 rn_logs에는 다 있음) */ clear: () => JMEM.clear() }; await fn(st, (v) => (out = v)); await new Promise((r) => setTimeout(r, 0)); return out; } const db = await JDB(); return new Promise((res, rej) => { const t = db.transaction('days', mode); const st = t.objectStore('days'); let out; Promise.resolve(fn(st, (v) => (out = v))).catch(rej); t.oncomplete = () => { db.close(); res(out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  /* (1.74.4) 📜 로거 기록을 이 PC 디스크(로컬 도우미 D:\\ReadNow\\journal)에 보관 — 예전엔 탭 메모리에만 있어 새로고침·크롬 다시 켜기 때마다 '전체 기록'이 통째로 사라졌음
   *  알라딘 화면은 읽을 수 없는 곳(도우미 · X-RN-Jrn 머리) · 못 보내면 버리지 않고 모아 두었다 다시 보냄 · 도우미가 없으면 Firebase(rn_logs)에서 읽어 보여 줌 */
  const HJ = (pth, body) => new Promise((res) => { try { GM_xmlhttpRequest({ method: 'POST', url: 'http://127.0.0.1:8899' + pth, headers: { 'X-RN-Jrn': '1', 'Content-Type': 'application/json' }, data: JSON.stringify(body || {}), anonymous: true, timeout: 30000, onload: (r) => { try { const j = JSON.parse(r.responseText); res(r.status === 200 && j && j.ok ? j : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); } catch (e) { res(null); } });
  const hjPc = () => encodeURIComponent((window.__rnPcName && window.__rnPcName.get()) || 'LOGGER'); const hjPend = [];
  async function hjSend(chunks) { if (chunks) hjPend.push(...chunks); if (!hjPend.length) return true; const out = hjPend.splice(0, hjPend.length); const r = await HJ('/jrn-put?pc=' + hjPc(), { chunks: out }); window.__rnJrn = { okAt: r ? Date.now() : (window.__rnJrn || {}).okAt || 0, failAt: r ? (window.__rnJrn || {}).failAt || 0 : Date.now(), pend: hjPend.length + (r ? 0 : out.length) }; /* (1.77.4) 로거 디스크 기록이 실제로 쌓이는지 — 담당 PC 신호(pcBeat.jrn)로 웹앱·Claude가 확인 */ if (!r) { hjPend.unshift(...out); if (hjPend.length > 4000) hjPend.splice(0, hjPend.length - 4000); return false; } return true; }
  async function rnLogsDay(d) { try { if (!(window.firebase && firebase.apps.length && firebase.auth().currentUser)) return []; const a = d.replace(/-/g, ''); const pc = (window.__rnPcName && window.__rnPcName.get()) || ''; const ss = await firebase.firestore().collection('rn_logs').where(firebase.firestore.FieldPath.documentId(), '>=', pc + '_' + a).where(firebase.firestore.FieldPath.documentId(), '<=', pc + '_' + a + '\uf8ff').get(); const out = [];
      ss.forEach((x) => { for (const ln of (x.data().lines || [])) { const m = String(ln).match(/^(\d\d):(\d\d):(\d\d) \[([^\]]*)\] (⚠ |! |· )?([\s\S]*)$/); if (!m) continue; out.push({ t: Date.parse(`${d}T${m[1]}:${m[2]}:${m[3]}+09:00`), m: m[4], l: m[5] === '⚠ ' ? 'err' : m[5] === '! ' ? 'warn' : m[5] === '· ' ? 'detail' : 'info', x: m[6] }); } }); return out.sort((p, q) => p.t - q.t); } catch (e) { return []; } }
  const jget = (k) => jtx('readonly', (st, set) => { const r = st.get(k); r.onsuccess = () => set(r.result || null); });
  const jkeys = () => jtx('readonly', (st, set) => { const r = st.getAllKeys(); r.onsuccess = () => set(r.result || []); });
  const jput = (rec) => jtx('readwrite', (st) => { st.put(rec); });
  const jclear = async () => { await jtx('readwrite', (st) => { st.clear(); }); if (JMEM) await HJ('/jrn-clear?pc=' + hjPc()); /* 도우미는 지우지 않고 보관함으로 옮김 */ };
  // (1.25.1) 하루치 전체를 20초마다 읽고 다시 쓰던 방식이 오래 돌면 메모리를 크게 씀 → 작은 묶음으로 덧붙이기만 함 (키 '날짜#시각'), 읽을 때 날짜별로 합침
  async function jflush() { if (!idbPend.length) return; const out = idbPend.splice(0, idbPend.length); const g = {}; out.forEach((e) => { (g[day(new Date(e.t))] = g[day(new Date(e.t))] || []).push(e); });
    for (const [d, arr] of Object.entries(g)) { try { await jput({ day: `${d}#${String(Date.now()).padStart(15, '0')}-${++seq}`, lines: arr }); } catch (e) { idbPend.unshift(...arr); break; } }
    if (JMEM) await hjSend(Object.entries(g).map(([d, lines]) => ({ d, lines }))); }
  const jgetDay = (d) => jtx('readonly', (st, set) => { const r = st.getAll(IDBKeyRange.bound(d, d + '\uffff')); r.onsuccess = () => set({ day: d, lines: (r.result || []).flatMap((x) => x.lines || []) }); });
  const jgetDayL = jgetDay; const jdaysL = async () => [...new Set((await jkeys()).map((k) => String(k).split('#')[0]))];
  const jmerge = (A, B) => { const seen = new Set(); const out = []; for (const e of [...A, ...B]) { const k = e.t + '|' + e.m + '|' + e.x; if (seen.has(k)) continue; seen.add(k); out.push(e); } return out.sort((p, q) => p.t - q.t); };
  const jgetDayX = async (d) => { const loc = await jgetDayL(d); if (!JMEM) return loc; const h = await HJ('/jrn-day?pc=' + hjPc() + '&d=' + d); let L = jmerge((h && h.lines) || [], (loc && loc.lines) || []); if (!h) { const fb = await rnLogsDay(d); L = jmerge(fb, L); } return { day: d, lines: L }; };
  const jdays = async () => { const L = await jdaysL(); if (!JMEM) return L; const h = await HJ('/jrn-days?pc=' + hjPc()); const S = new Set([...L, ...((h && h.days) || [])]); if (!h) for (let i = 0; i < 7; i++) S.add(day(new Date(Date.now() - i * 864e5))); return [...S]; };
  (async () => { try { // 예전 localStorage 기록(7일치)을 옮겨 담고 지움 · 오늘 기록을 불러와 이어 씀
    for (let i = 0; i < 30; i++) { const d = day(new Date(Date.now() - i * 864e5)); const raw = localStorage.getItem(LSK(d)); if (!raw) continue; try { const arr = JSON.parse(raw); const rec = (await jget(d)) || { day: d, lines: [] }; if (!rec.lines.length) { rec.lines = arr; await jput(rec); } } catch (e) {} localStorage.removeItem(LSK(d)); }
  } catch (e) {} })(); // (1.74.4) 새로고침해도 '오늘 기록'은 오늘 0시부터 이어서(jPrefill)
  /* (1.74.4) '오늘 기록'은 새로고침·크롬 다시 켜기 뒤에도 오늘 0시부터 이어서 — 보관된 오늘 줄을 화면 앞에 다시 채움(다시 보관·업로드하지 않음 · 같은 줄은 하나로) */
  const jPrefill = async (tries) => { try { const td = day(new Date()); const rec = await jgetDayX(td); const L = (rec && rec.lines) || []; if (!L.length && JMEM && tries > 0) return setTimeout(() => jPrefill(tries - 1), 15000); const have = new Set(buf.map((e) => e.t + '|' + e.x)); const add = L.filter((e) => e && e.t && day(new Date(e.t)) === td && !have.has(e.t + '|' + e.x)); if (!add.length) return; buf.unshift(...add); buf.sort((p, q) => p.t - q.t); if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); bufN++; } catch (e) {} };
  /* (1.88.5) 정범님 10/20 크롬 느림: 오늘 기록 전체(수만 줄)를 탭마다 읽어 메모리에 두던 것 → 기록 창을 처음 열 때만(쉬는 탭·다른 화면 탭은 읽지 않음) */ let jPre = false; const jPrefillOnce = () => { if (jPre) return; jPre = true; setTimeout(() => jPrefill(8), 300); };
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
    buf.push(e); bufN++; if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); if (lv !== 'detail') { lt.push(e); if (lt.length > 80) lt.shift(); ltDirty = true; } pend.push(e); idbPend.push(e); dirty = true; };
  // 이 PC 보관 (5초마다), Firebase (1분마다, 10분 단위 문서)
  setInterval(() => { if (pend.length > 5000) pend.splice(0, pend.length - 5000); jflush().catch(() => {}); }, 20000); addEventListener('beforeunload', () => { jflush(); });
  /* (1.59.1) Firebase 기록(rn_logs) 빠짐 막기
   *  ① 올리다 실패한 칸의 줄은 버리지 않고 다음 분에 다시(예전: 실패하면 마지막 3,000줄만 남기고 앞을 버렸고, 한 칸이 계속 실패하면 그 뒤 칸도 모두 막혔음)
   *  ② 칸마다 몇 줄 올렸는지 이 PC에 적어 두고(rnu-log-upled), 30분마다 이 PC 보관 기록(IndexedDB)과 견주어 덜 올라간 칸을 다시 올림 — 같은 줄은 Firebase가 하나로 합치므로(arrayUnion) 두 번 쌓이지 않음
   *  ③ 기록 내려받기(이 PC 비우기) 전에 먼저 모두 올림 */
  const lineOf = (e) => `${new Date(e.t + 9 * 3600e3).toISOString().slice(11, 19)} [${e.m}] ${e.l === 'err' ? '⚠ ' : e.l === 'warn' ? '! ' : e.l === 'detail' ? '· ' : ''}${e.x}`;
  const slotOf = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, '') + '0';
  const UPK = 'rnu-log-upled'; const upLed = () => { try { return GM_getValue(UPK, {}) || {}; } catch (e) { return {}; } };
  const upLedAdd = (slot, n) => { try { const L = upLed(); L[slot] = (L[slot] || 0) + n; const cut = slotOf(Date.now() - 4 * 864e5); for (const k of Object.keys(L)) if (k < cut) delete L[k]; GM_setValue(UPK, L); } catch (e) {} };
  const upLedSet = (slot, n) => { try { const L = upLed(); L[slot] = Math.max(L[slot] || 0, n); GM_setValue(UPK, L); } catch (e) {} };
  async function putSlot(slot, lines) { for (let i = 0; i < lines.length; i += 400) await firebase.firestore().collection('rn_logs').doc(`${pcName()}_${slot}`).set({ pc: pcName(), slot, lines: firebase.firestore.FieldValue.arrayUnion(...lines.slice(i, i + 400)), at: Date.now() }, { merge: true }); }
  const upOk = () => !!(window.firebase && firebase.apps.length && firebase.auth().currentUser) && !window.__rnLogDenied;
  const upNow = async () => { if (!pend.length || !upOk()) return; const out = pend.splice(0, pend.length);
    const groups = new Map(); out.forEach((e) => { const k = slotOf(e.t); (groups.get(k) || groups.set(k, []).get(k)).push(e); }); const failed = [];
    for (const [slot, es] of groups) { try { await putSlot(slot, es.map(lineOf)); upLedAdd(slot, es.length); } catch (e) { if (/permission/i.test(e.code || e.message)) { window.__rnLogDenied = true; buf.push({ t: Date.now(), m: '기록', l: 'warn', x: 'Firebase에 기록을 못 올림 (규칙에 rn_logs 허용 필요) — 이 PC 안에는 계속 보관합니다' }); return; } failed.push(...es); } }
    if (failed.length) { pend.unshift(...failed); if (pend.length > 30000) pend.splice(0, pend.length - 30000); /* 그래도 넘치면 오래된 것부터 — 이 PC 보관 기록에서 30분마다 다시 채움 */ } };
  let bfAt = 0, bfBusy = false;
  async function backfill(force) { if (bfBusy || !upOk() || (!force && Date.now() - bfAt < 30 * 60000)) return { skip: true }; bfBusy = true; bfAt = Date.now(); let slots = 0, lines = 0, bad = 0;
    try { await jflush(); const L = upLed(); const lim = force ? Date.now() : Date.now() - 15 * 60000; /* 지금 올리는 중인 칸은 빼고 */ const pendN = {}; pend.forEach((e) => { const k = slotOf(e.t); pendN[k] = (pendN[k] || 0) + 1; });
      for (const d of [day(new Date(Date.now() - 864e5)), day(new Date())]) { const rec = await jgetDayX(d); const G = new Map(); ((rec && rec.lines) || []).forEach((e) => { if (e.t > lim) return; const k = slotOf(e.t); (G.get(k) || G.set(k, []).get(k)).push(e); });
        for (const [slot, es] of G) { if (es.length <= (L[slot] || 0) + (pendN[slot] || 0)) continue; try { await putSlot(slot, es.map(lineOf)); upLedSet(slot, es.length); slots++; lines += es.length; } catch (e) { bad++; } } }
      if (slots) window.__rnLog('수집기', 'info', `Firebase 기록 채움: 덜 올라간 10분 칸 ${slots}개를 이 PC 보관 기록으로 다시 올림 (${lines.toLocaleString()}줄 — 이미 있던 줄은 하나로 합쳐짐)`); } catch (e) { bad++; } finally { bfBusy = false; } return { slots, lines, bad }; }
  setInterval(() => backfill().catch(() => {}), 5 * 60000); setTimeout(() => backfill(true).catch(() => {}), 90000);
  window.__rnLogBackfill = backfill;
  window.__rnLogDay = (d) => jgetDayX(d); /* (1.60.0) ⏰ 일마다 걸린 시간 — 예전 기록에서 채울 때 */
  setInterval(upNow, 60000);
  window.__rnFlush = async () => { try { await jflush(); } catch (e) {} try { await upNow(); } catch (e) {} }; // 탭을 닫기 직전 등: 남은 기록을 이 PC(IndexedDB)와 Firebase에 바로 저장
  /* (1.38.0) 탭끼리 나누는 '지금 상태'와 '최근 기록' — 개요 화면은 어느 탭에서 열어도 이 PC 전체(모든 수집기 탭)를 보여 줌
   *  GM 'rnu-live-{탭}' = 그 탭이 지금 하는 일(2초마다) · 'rnu-lt-{탭}' = 그 탭의 중요한 기록 마지막 80줄. 닫힌 탭의 값은 저절로 정리(상태 1분, 기록 12시간) */
  const TAB = window.__rnTab || Math.random().toString(36).slice(2, 8); window.__rnTab = TAB; // (1.56.0) 수집기 탭 고르기(rnRole)와 같은 이름
  const page = location.pathname.split('/').pop();
  const liveNow = () => { const S = window.__rnStatus || {}; let crmBusy = false, crmLabel = null; try { crmBusy = !!(window.__rnCrm && window.__rnCrm.busy()); crmLabel = crmBusy && window.__rnCrm.label ? String(window.__rnCrm.label() || '') : null; } catch (e) {}
    let imgBusy = false; try { imgBusy = !!(window.__rnPrd && window.__rnPrd.imgBusy && window.__rnPrd.imgBusy()); } catch (e) {}
    const slim = (o) => (o && typeof o === 'object' ? JSON.parse(JSON.stringify(o)) : o || null);
    return { tab: TAB, page, role: window.__rnRole ? window.__rnRole() : null, at: Date.now(), busy: !!(S.job || crmBusy || imgBusy), job: S.job || (crmBusy ? '고객·주문: ' + (crmLabel || '수집') : imgBusy ? '이미지 받기' : null), jobKey: S.jobKey || null, jobStart: S.jobStart || null, chain: slim(S.chain), sub: slim(S.sub), ms: slim(S.ms), cur: slim(S.cur), crm: slim(S.crm), ph: slim(S.ph), crmBusy, lastEnd: S.lastEnd || null, stopping: !!(S.job && window.__rnPaused) }; };
  /* (1.88.4) 크롬 느림: 탭마다 2초마다 GM 저장소에 쓰면 Tampermonkey가 그 값을 모든 탭에 다시 알림(탭 수 × 탭 수) → 내용이 바뀌었을 때만, 아니면 20초마다 살아 있음만 */
  let pubLast = '', pubAt = 0, ltAt = 0; const pubLive = () => { try { const lv = liveNow(); const sig = JSON.stringify({ ...lv, at: 0 }); if (sig !== pubLast || Date.now() - pubAt > 20000) { pubLast = sig; pubAt = Date.now(); GM_setValue('rnu-live-' + TAB, lv); }
      if (ltDirty && Date.now() - ltAt > 10000) { ltDirty = false; ltAt = Date.now(); GM_setValue('rnu-lt-' + TAB, lt.slice()); } } catch (e) {} }; /* (1.88.5) 최근 80줄 나눔은 10초에 한 번까지(2초마다 최대 48KB를 모든 탭에 알리던 것) */
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
    if (S.ms && Array.isArray(S.ms.items) && S.ms.items.length) { const M = S.ms; const dn = M.items.filter((q) => q.st === 'done').length; const nowI = M.items.find((q) => q.st === 'now'); const fr = (dn + (nowI && cur && cur.total ? curFrac(cur) : 0)) / M.items.length; /* (1.89.54) 정범님 10/24 '중심 수집은 무슨 일이 있어도 마일스톤' — 이번 바퀴 판매자(또는 단계) 하나하나 */
      h += `<div class="ol">${String(M.title || '이번 바퀴').replace(/</g, '&lt;')} · ${dn}/${M.items.length} 끝 · ${(fr * 100).toFixed(1)}%${M.eta ? ` · 남은 약 ${String(M.eta).replace(/</g, '&lt;')}` : ''}</div>${bar(fr, '#D9822B')}<div class="chips">${M.items.map((q, i) => `<span class="chip ${q.st === 'done' ? 'done' : q.st === 'now' ? 'now' : q.st === 'fail' ? 'fail' : q.st === 'skip' ? 'skip' : 'wait'}" title="${String(q.t || q.l).replace(/"/g, '&quot;')}">${q.st === 'done' ? '✓' : q.st === 'now' ? '▶' : q.st === 'fail' ? '✗' : q.st === 'skip' ? '↷' : i + 1} ${String(q.l).replace(/</g, '&lt;')}${q.n ? ` <small>${String(q.n).replace(/</g, '&lt;')}</small>` : ''}</span>`).join('')}</div>`; }
    if (S.sub && S.sub.order) { const sb = S.sub; h += `<div class="chips" style="margin-left:14px"><span style="font-size:11px;color:#5B6B66">고객 세부:</span>${sb.order.map((k) => { const st = sb.res[k] === 'done' ? 'done' : k === sb.cur ? 'now' : 'wait'; return `<span class="chip ${st}">${st === 'done' ? '✓' : st === 'now' ? '▶' : ''} ${sb.labels[k]}</span>`; }).join('')}</div>`; }
    const x = (c && c.cur === 'crm') || (S.job === '고객 전체 일괄 수집') ? crm : cur;
    { const P = (S.ph || {})[x === crm ? 'crm' : 'prd']; if (P && P.list && P.list.length) { const L = P.list.slice(-12); const hid = P.list.length - L.length + (P.cut || 0);
      h += `<div class="chips" style="margin-left:${c && c.order ? 14 : 0}px"><span style="font-size:11px;color:#5B6B66">${c && c.order ? '이 단계 안:' : '단계:'}</span>${hid ? `<span class="chip done" title="앞 단계 ${hid}개">… ${hid}</span>` : ''}${L.map((q, i) => { const isNow = i === L.length - 1;
        return `<span class="chip ${isNow ? 'now' : 'done'}" title="${String(q.l).replace(/"/g, '&quot;')} · ${new Date(q.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 시작${q.ms != null ? ' · ' + fm(q.ms) + ' 걸림' : ''}">${isNow ? '▶' : '✓'} ${String(q.l).replace(/</g, '&lt;')}${!isNow && q.ms != null && q.ms >= 60000 ? ` <small>${fm(q.ms)}</small>` : ''}</span>`; }).join('')}</div>${P.note ? `<div class="ol sub">잠깐: ${String(P.note).replace(/</g, '&lt;')}</div>` : ''}`; } }
    if (!(x && (x.state || x.label)) && S.job && S.jobStart) h += `<div class="ol now">지금: <b>준비 중</b> · ${fm(Date.now() - S.jobStart)}째 <small>(앞 단계·이어 읽을 자리 찾기 등)</small></div>`;
    if (x && (x.state || x.label)) h += `<div class="ol now">지금: <b>${x.state || x.label}</b>${x.total ? ` · ${(+x.done || 0).toLocaleString()} / ${(+x.total).toLocaleString()} (${(curFrac(x) * 100).toFixed(1)}%)` : ''}${x.etaMin != null ? ` · 남은 시간 약 ${fm(x.etaMin * 60000)} (끝 ${new Date(Date.now() + x.etaMin * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})` : ''}</div>${x.total ? bar(curFrac(x), '#3F7FD1') : ''}${x.sub ? `<div class="ol sub">${String(x.sub).replace(/</g, '&lt;')}</div>` : ''}`;
    return h; };
  const mount = () => { globalThis.__rnHead(st); const w = document.createElement('div'); w.id = 'rn-jw';
    w.innerHTML = `<div class="h"><b title="이 띠를 잡고 끌어서 옮김 · 두 번 누르면 처음 자리로 · 오른쪽 아래 모서리로 크기 조절">⠿ 작업 기록 — ${pcName()}</b><span class="jt"><button data-jt="today" class="on" title="오늘(0시부터) 기록 — 새로고침·크롬 다시 켜기 뒤에도 이어서 보임 · 날이 바뀌면 '전체 기록'의 그날 칸으로">오늘 기록</button><button data-jt="hist" title="날짜별로 쌓인 모든 기록 (오늘 포함)">전체 기록</button><button data-jt="pw" title="가격 감시기의 지금 상태와 기록만 따로 (수집기 기록과 섞지 않음 · 이 PC의 감시 탭에서 모아 둠)">🛰 감시</button><button data-jt="pcs" title="다른 PC 수집기의 기록 (각 PC가 1분마다 Firebase에 올린 것 · 1분마다 새로 읽음)">🖥 다른 PC</button></span><select id="rnjF"><option value="imp">중요만</option><option value="all" selected>전체 (항목마다)</option><option value="err">오류·경고만</option></select><input id="rnjQ" placeholder="검색"><label style="font-weight:400"><input type="checkbox" id="rnjA" ${GM_getValue('rnu-log-autoscroll', true) ? 'checked' : ''} title="새 줄이 생기면 맨 아래로 저절로 내려감 — 끄면 올려 둔 자리에 그대로 · 켜고 끈 것은 이 PC에 저장(다음에 열어도 그대로)"> 자동 스크롤</label><button id="rnjD" title="모든 기록(오늘+지난)을 파일로 받고, 이 PC의 기록을 비웁니다">내려받기·비우기</button><button id="rnjX">닫기</button></div><div class="ov" id="rnjO"></div><div class="b" id="rnjB"></div>`;
    globalThis.__rnMount(w); let lastDrawn = -1;
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
      b.querySelectorAll('details.jd').forEach((d) => (d.ontoggle = async () => { if (!d.open) return; const rec = await jgetDayX(d.dataset.day); const L = (rec && rec.lines) || []; const rows = L.filter(pass); d.querySelector('summary small').textContent = `${L.length.toLocaleString()}줄 · 오류 ${L.filter((e) => e.l === 'err').length} · 경고 ${L.filter((e) => e.l === 'warn').length}${rows.length !== L.length ? ` · 거른 결과 ${rows.length.toLocaleString()}줄` : ''}`; d.querySelector('.jdb').innerHTML = rows.slice(-5000).map(fmtRow).join('') || '<div class="detail">없음</div>'; })); };
    w.querySelectorAll('[data-jt]').forEach((bt) => (bt.onclick = () => { tab = bt.dataset.jt; w.querySelectorAll('[data-jt]').forEach((x) => x.classList.toggle('on', x === bt)); lastDrawn = -1; pwDrawn = -1; if (tab === 'hist') drawHist(); else if (tab === 'pw') drawPw(); else if (tab === 'pcs') drawPcs(true); else draw(); drawOv(); }));
    /* (1.88.4) 정범님 10/20 '수집기 때문에 크롬이 매우 느림' — 기록 창이 1초마다 3만 줄을 거르고 3천 줄을 통째로 다시 그렸음(새 줄이 올 때마다) → 같은 거르기·같은 날이면 새 줄만 덧붙이고 3천 줄 넘는 앞줄만 떼어 냄 */
    let dKey = ''; const rowH = (e) => `<div class="${e.l}"><span class="tm">${new Date(e.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> <span class="md">${e.m}</span> ${String(e.x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`;
    const draw = () => { if (!w.classList.contains('on') || tab !== 'today') return; const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim();
      const td = day(new Date()); const ok = (e) => day(new Date(e.t)) === td && (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || String(e.x).includes(q)); const b = w.querySelector('#rnjB'); const key = f + '|' + q + '|' + td;
      if (key === dKey && lastDrawn >= 0 && bufN > lastDrawn && bufN - lastDrawn <= buf.length) { const add = buf.slice(buf.length - (bufN - lastDrawn)).filter(ok); if (add.length) { const e0 = b.querySelector(':scope > .detail.rnj0'); if (e0) e0.remove(); b.insertAdjacentHTML('beforeend', add.map(rowH).join('')); let extra = b.childElementCount - 3000; while (extra-- > 0 && b.firstElementChild) b.firstElementChild.remove(); if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; } lastDrawn = bufN; return; }
      const rows = buf.filter(ok).slice(-3000); b.innerHTML = rows.map(rowH).join('') || '<div class="detail rnj0">기록 없음</div>'; dKey = key;
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; lastDrawn = bufN; };
      { const ca = w.querySelector('#rnjA'); if (ca && !ca._sv) { ca._sv = 1; ca.addEventListener('change', () => { GM_setValue('rnu-log-autoscroll', ca.checked); if (ca.checked) { const b2 = w.querySelector('#rnjB'); if (b2) b2.scrollTop = b2.scrollHeight; } }); } } /* (1.57.6) 자동 스크롤 켜고 끔을 저장 */
    // ── 맨 위 요약: 지금 무엇을, 전체 중 어디까지 (1초마다)
    const ov = w.querySelector('#rnjO');
    /* (1.43.0) 이 PC 전체에서 지금 하는 일 — 개요와 같은 기준(일하는 탭이 따로 있어도 그 탭의 단계가 보임). 예전엔 기록 창을 연 탭의 상태만 봐서, 다른 탭·자동 수집이 일할 때 단계 표시가 비었음 */
    const drawOv = () => { if (!w.classList.contains('on')) return; if (tab === 'pw') { const h = pwOvHtml(); if (ov.innerHTML !== h) ov.innerHTML = h; return; } if (tab === 'pcs') { const h = pcsOvHtml(); if (ov.innerHTML !== h) ov.innerHTML = h; return; } let lives = []; try { lives = window.__rnLive ? window.__rnLive() : []; } catch (e) {} const mine = lives.find((v) => v.tab === TAB); const busy = lives.filter((v) => v.busy); const main = mine && mine.busy ? mine : busy[0] || null;
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
    /* (1.56.0) 🖥 다른 PC 탭: 다른 PC 수집기의 기록 — 각 PC가 1분마다 rn_logs/{PC}_{10분 칸}에 올린 줄을 읽어 PC별로 보여 줌 (이 PC는 빼고)
     *  기본 최근 3시간 · [하루]로 늘림 · 탭을 보고 있을 때만 1분마다 다시 읽음(안 볼 땐 읽지 않음 → Firebase 읽기 아낌) · 위쪽 칩 = PC마다 마지막 기록 시각·오류 수 */
    let pcsData = null, pcsSel = GM_getValue('rnu-jw-pc', null), pcsHours = 3, pcsAt = 0, pcsBusy = false, pcsErr = null, pcsDrawn = '', pcsLv = null;
    /* (웹앱 10/27 정범님) PC 칩의 '오류 n · 경고 m' = 그 PC가 rn_logs에 올린 줄 중 보는 기간(3시간·하루) 안의 ⚠ 오류(그 일을 끝내지 못함)·! 경고(일은 계속됨) 줄 수
     *  → 그 숫자를 누르면 그 PC의 그 줄만(시각·원문) + 줄마다 💡 풀이 + 같은 뜻끼리 묶은 수 · ✕ 거르기 풀기. 풀이 표는 웹앱 ⚙ 기록의 LOGW와 같은 글(고치면 둘 다) */
    const LOGW = [[/요청이 너무 많다|\(429\)/, '알라딘이 "요청이 너무 많다"고 막음 → 이 PC 수집이 정해진 시간 쉬고 요청 간격을 늘림(저절로 다시 함) · 자주면 설정 ⑨ 동시 PC 수를 줄임'], [/요청 실패|응답 시간 초과|다시 시도|재시도/, '알라딘 응답이 늦거나 끊겨 몇 초 뒤 다시 읽음 — 바로 뒤에 이어서 되면 문제 없음'], [/^\[성능\]|⏱/, '이 PC 크롬 탭이 느렸음(30초 넘는 긴 멈춤이나 메모리 60% 넘음) — 일은 계속 · 자주면 크롬 다시 켜기'],
      [/is not defined|TypeError|ReferenceError|처리되지 않은 오류|^\[오류\]/, '스크립트 오류 — 끝의 (파일)이 wgate.aspx 같은 알라딘 화면이면 알라딘 자체 오류(우리와 무관), readnow-…면 우리 코드(Claude에게 이 줄을 보여 주세요)'], [/로그인 풀림으로 잘못 봄/, '로그인이 풀린 줄 알았는데 아니었음 — 다시 확인하고 그대로 계속(할 일 없음)'], [/네이버/, '네이버 로그인이 안 됨 — 네이버 도서 외부 정보만 못 읽음(그 PC 크롬에서 네이버 로그인)'], [/로그인/, '알라딘·구글 로그인이 풀렸거나 다시 로그인하는 중 — 수집기가 스스로 다시 로그인 · 계속 실패면 로그인 막힘'],
      [/일시정지/, '사람이나 다른 탭이 이 PC 수집을 일시정지함 — 하던 일은 멈춘 자리에서 쉼'], [/메모리 절약으로 내려놓/, '크롬이 메모리를 아끼려 이 탭을 잠재웠다 다시 깨움 — 그동안 이 탭 일은 쉬었음'], [/이 크롬에 수집기 \d+개/, '같은 크롬에 수집기가 여러 개 — 하나만 남겨야 서로 겹치지 않음'], [/permission|권한/i, 'Firebase 규칙이 이 기록을 막음 — 그 칸 기록이 안 남음(Claude에게 이 줄을 보여 주세요)'],
      [/올리기 실패|Firebase/, 'Firebase에 올리다 실패 — 다음 분에 다시 올림(인터넷이 잠깐 끊기면 흔함)'], [/건너뜀|건너뜁/, '이번 회차는 이 일을 건너뜀(다른 일이 진행 중이거나 조건이 안 맞음) — 다음 회차에 다시'], [/다른 작업 진행 중|다른 탭/, '다른 작업이 알라딘을 쓰는 중이라 기다리거나 건너뜀'], [/예스24/, '예스24 읽기·올리기 실패 — 다음 회차에 다시'], [/SKU/, '샵매니저 화면의 SKU 표시용 코드를 못 읽음 — 표시만 빠짐'],
      [/드라이브/, '구글 드라이브 저장이 안 돼 PC 다운로드 폴더에 저장함'], [/점수 계산/, '고객·판매자 점수 계산이 멈추거나 건너뜀 — 다음 수집 때 다시 계산'], [/사진|📷/, '사진 받기·보관 실패 — 다음에 다시 받음'], [/보관본|🪶/, 'PC에 두는 보관본이 너무 커서 줄이거나 건너뜀 — 서버 기록은 그대로'], [/없음:/, '있어야 할 Firebase 문서가 없음'], [/실패/, '그 일이 실패함 — 같은 줄이 되풀이되면 점검 필요']];
    const logWhy = (e) => { const t = `[${e.m}] ${e.x}`; for (const [re, d] of LOGW) if (re.test(t)) return d; return e.l === 'err' ? '그 일을 끝내지 못함(오류) — 같은 줄이 되풀이되면 Claude에게 보여 주세요' : '주의 — 일은 계속됨'; };
    const kslot = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, '') + '0';
    const pcsLine = (raw, slot) => { const m = String(raw).match(/^(\d{2}):(\d{2}):(\d{2}) \[([^\]]*)\] (⚠ |! |· )?(.*)$/s); if (!m) return { t: 0, m: '', l: 'info', x: String(raw) };
      const y = +slot.slice(0, 4), mo = +slot.slice(4, 6), d = +slot.slice(6, 8); const t = Date.UTC(y, mo - 1, d, +m[1], +m[2], +m[3]) - 9 * 3600e3;
      return { t, m: m[4], l: m[5] === '⚠ ' ? 'err' : m[5] === '! ' ? 'warn' : m[5] === '· ' ? 'detail' : 'info', x: m[6] }; };
    const pcsLoad = async () => { if (pcsBusy) return; if (!window.firebase || !firebase.apps.length || !firebase.auth().currentUser) { pcsErr = 'Firebase에 아직 로그인되지 않았습니다 (잠시 뒤 저절로 다시)'; return; } pcsBusy = true;
      try { const ss = await firebase.firestore().collection('rn_logs').where('slot', '>=', kslot(Date.now() - pcsHours * 3600e3)).get(); const by = {};
        ss.forEach((d) => { const v = d.data() || {}; const pc = v.pc || String(d.id).split('_')[0]; if (!pc || pc === pcName()) return; (by[pc] = by[pc] || []).push(v); });
        const out = {}; Object.entries(by).forEach(([pc, docs]) => { docs.sort((a, b) => String(a.slot).localeCompare(String(b.slot))); const L = []; docs.forEach((v) => (v.lines || []).forEach((r) => L.push(pcsLine(r, String(v.slot))))); L.sort((a, b) => a.t - b.t);
          out[pc] = { lines: L, last: L.length ? L[L.length - 1].t : 0, err: L.filter((e) => e.l === 'err').length, warn: L.filter((e) => e.l === 'warn').length }; });
        pcsData = out; pcsErr = null; pcsAt = Date.now(); if (!pcsSel || !out[pcsSel]) { const ks = Object.keys(out).sort((a, b) => out[b].last - out[a].last); pcsSel = ks[0] || null; } }
      catch (e) { pcsErr = /permission/i.test(e.code || e.message) ? 'Firebase 규칙이 rn_logs 읽기를 막고 있습니다 (웹앱의 기록 보기와 같은 규칙 필요)' : '기록을 못 읽음: ' + (e.code || e.message); }
      finally { pcsBusy = false; } };
    const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : `${Math.floor(m / 60)}시간 ${m % 60}분 전`; };
    const pcsOvHtml = () => { const e = (x) => String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (pcsErr) return `<div class="ol"><b>🖥 다른 PC</b> · <span style="color:#B0322A">${e(pcsErr)}</span></div>`;
      if (!pcsData) return '<div class="ol"><b>🖥 다른 PC</b> · 불러오는 중…</div>';
      const ks = Object.keys(pcsData).sort((a, b) => pcsData[b].last - pcsData[a].last);
      if (!ks.length) return `<div class="ol"><b>🖥 다른 PC</b> · 최근 ${pcsHours}시간 동안 기록을 올린 다른 PC가 없습니다 ${pcsHours < 24 ? '<button data-pch="24" style="margin-left:6px">하루로 늘리기</button>' : ''}</div>`;
      return `<div class="ol"><b>🖥 다른 PC</b> · 최근 ${pcsHours}시간 · ${ago(pcsAt)} 읽음 <button data-pch="${pcsHours < 24 ? 24 : 3}" style="margin-left:6px">${pcsHours < 24 ? '하루로 늘리기' : '3시간만'}</button> <button data-pcr="1">↻ 지금 읽기</button></div><div class="chips">${ks.map((k) => { const x = pcsData[k]; const off = Date.now() - x.last > 15 * 60000;
        return `<span class="chip ${k === pcsSel ? 'now' : off ? '' : 'done'}" data-pc="${e(k)}" style="cursor:pointer" title="마지막 기록 ${x.last ? new Date(x.last).toLocaleString('ko-KR') : '-'} · ${x.lines.length.toLocaleString()}줄">${off ? '⚪' : '🟢'} ${e(k)} · ${x.last ? ago(x.last) : '-'}${x.err ? ` · <u data-pcw="err" data-pcwp="${e(k)}" title="⚠ 오류 줄 ${x.err}개(그 일을 끝내지 못함) — 누르면 이 줄들만 풀이와 함께">오류 ${x.err}</u>` : ''}${x.warn ? ` · <u data-pcw="warn" data-pcwp="${e(k)}" title="! 경고 줄 ${x.warn}개(일은 계속됨 — 다시 시도·쉬기·건너뜀 등) — 누르면 이 줄들만 풀이와 함께">경고 ${x.warn}</u>` : ''}</span>`; }).join('')}</div>${pcsLv && pcsData[pcsSel] ? `<div class="ol sub" style="white-space:normal">🔎 <b>${e(pcsSel)}</b>의 <b>${pcsLv === 'err' ? '⚠ 오류' : '! 경고'}</b> 줄만 보는 중 (최근 ${pcsHours}시간) <button data-pcwx="1" style="margin-left:6px">✕ 거르기 풀기</button></div>` : ''}`; };
    const drawPcs = async (load) => { if (!w.classList.contains('on') || tab !== 'pcs') return; const b = w.querySelector('#rnjB');
      if (load || !pcsData || Date.now() - pcsAt > 60000) { if (!pcsData) b.innerHTML = '<div class="detail">다른 PC의 기록을 불러오는 중…</div>'; await pcsLoad(); drawOv(); }
      if (tab !== 'pcs') return; const x = pcsData && pcsSel ? pcsData[pcsSel] : null;
      const stamp = `${pcsSel}|${pcsAt}|${w.querySelector('#rnjF').value}|${w.querySelector('#rnjQ').value}|${pcsLv}`; if (!load && stamp === pcsDrawn) return; pcsDrawn = stamp;
      if (pcsLv && x) { const q = w.querySelector('#rnjQ').value.trim(); const L = x.lines.filter((e) => e.l === pcsLv && (!q || String(e.x).includes(q))).slice(-5000); const esc2 = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); const G = {}; L.forEach((e) => { const k = logWhy(e); G[k] = (G[k] || 0) + 1; });
        b.innerHTML = L.length ? `<div class="info" style="white-space:normal;background:#F2F6F4;padding:4px 6px;border-radius:6px;margin-bottom:4px">💡 같은 뜻끼리 (${esc2(pcsSel)} · ${L.length.toLocaleString()}줄)${Object.entries(G).sort((p, q2) => q2[1] - p[1]).map(([k, n]) => `<br>· <b>${n.toLocaleString()}</b> — ${esc2(k)}`).join('')}</div>` + L.map((e) => fmtRow(e).replace(/<\/div>$/, `<br><span class="detail" style="padding-left:14px">💡 ${esc2(logWhy(e))}</span></div>`)).join('') : '<div class="detail">이 기간에 그런 줄이 없음</div>';
        if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; return; }
      const all0 = x ? x.lines.filter(pass) : []; const rows = all0.slice(-30000); /* (1.77.4) 3,000줄 → 3만 줄 — 로거는 한 시간에 3천 줄 넘게 써서 '다른 PC'에서 1시간치만 보였음(정범님 10/17) */ b.innerHTML = (all0.length > rows.length ? `<div class="detail">앞의 ${(all0.length - rows.length).toLocaleString()}줄은 생략 — 웹앱 ⚙ 기록 → 기록 내려받기로 전부 받을 수 있음</div>` : '') + rows.map(fmtRow).join('') || `<div class="detail">${pcsErr ? '' : x ? '거른 결과 없음' : '고를 PC가 없습니다'}</div>`;
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; };
    ov.addEventListener('click', (ev) => { if (tab !== 'pcs') return; const c = ev.target.closest('[data-pc]'); const hh = ev.target.closest('[data-pch]'); const rr = ev.target.closest('[data-pcr]'); const wv = ev.target.closest('[data-pcw]'); const wx = ev.target.closest('[data-pcwx]');
      if (wv) { pcsSel = wv.dataset.pcwp; GM_setValue('rnu-jw-pc', pcsSel); pcsLv = wv.dataset.pcw; pcsDrawn = ''; drawOv(); drawPcs(false); return; } if (wx) { pcsLv = null; pcsDrawn = ''; drawOv(); drawPcs(false); return; }
      if (c) { pcsLv = null; pcsSel = c.dataset.pc; GM_setValue('rnu-jw-pc', pcsSel); pcsDrawn = ''; drawOv(); drawPcs(false); }
      else if (hh) { pcsHours = +hh.dataset.pch; pcsData = null; drawOv(); drawPcs(true); } else if (rr) { drawPcs(true); } });
    setInterval(() => { if (tab === 'pcs') drawPcs(false); }, 5000);
    setInterval(drawOv, 1000);
    setInterval(() => { if (bufN !== lastDrawn) draw(); }, 1000); // 진행을 늦추지 않게 1초에 한 번만 그림
    ['#rnjF', '#rnjQ'].forEach((q) => (w.querySelector(q).oninput = () => (tab === 'hist' ? drawHist() : tab === 'pw' ? ((pwDrawn = -1), drawPw()) : tab === 'pcs' ? ((pcsDrawn = ''), drawPcs(false)) : draw()))); w.querySelector('#rnjX').onclick = () => { w.classList.remove('on'); GM_setValue('rnu-jw', 0); };
  // 구글 드라이브로 바로 저장 (설정 ⑨에 Apps Script 주소·열쇠가 있으면). 실패하면 PC로 내려받기
  const driveSave = (name, content) => new Promise((res) => { const url = GM_getValue('rnu-drive-url', ''), key = GM_getValue('rnu-drive-key', ''); if (!url) return res(null);
    GM_xmlhttpRequest({ method: 'POST', url, data: JSON.stringify({ key, name, content }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, timeout: 120000, onload: (r) => { try { const j = JSON.parse(r.responseText); res(j && j.ok ? j : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); });
    w.querySelector('#rnjD').onclick = async () => { // 모든 날짜를 한 파일로 받고, 이 PC의 기록을 비움 (Firebase에 올라간 기록은 그대로)
      if (!confirm('이 PC의 모든 작업 기록(오늘 + 지난 기록)을 파일로 내려받은 뒤, 이 PC에서 비웁니다. 계속할까요?')) return;
      await jflush(); try { await upNow(); } catch (e) {} const bfr = await backfill(true).catch(() => ({ bad: 1 })); if ((bfr && bfr.bad) || pend.length) { if (!confirm(`Firebase에 아직 못 올린 기록이 있습니다(${pend.length.toLocaleString()}줄${bfr && bfr.bad ? ' · 못 올린 칸 ' + bfr.bad + '개' : ''}). 그래도 이 PC 기록을 비울까요?\n(내려받는 파일에는 모두 들어 있음 · 취소하면 비우지 않음 — 인터넷이 되면 저절로 올라감)`)) return; } /* (1.59.1) 비우기 전에 Firebase에 모두 올림 */ const keys = (await jdays()).sort(); const parts = []; for (const k of keys) { const rec = await jgetDayX(k); (rec ? rec.lines : []).forEach((e) => parts.push(`${new Date(e.t).toLocaleString('ko-KR')} [${e.m}] [${e.l}] ${e.x}`)); }
      const fname = `리드나우-수집기록-${pcName()}-${keys[0] || day(new Date())}~${keys[keys.length - 1] || day(new Date())}.txt`; const drv = await driveSave(fname, parts.join('\n'));
      if (drv) { window.__rnLog('수집기', 'ok', `작업 기록을 구글 드라이브 '리드나우 수집기록' 폴더에 저장했습니다: ${fname}${drv.url ? ' · ' + drv.url : ''}`); if (drv.url) window.open(drv.url, '_blank'); }
      else { window.__rnLog('수집기', 'warn', GM_getValue('rnu-drive-url', '') ? '구글 드라이브 저장 실패 (주소·열쇠·배포 권한 확인) — PC의 다운로드 폴더로 내려받습니다' : '구글 드라이브 주소가 설정되지 않아 PC의 다운로드 폴더로 내려받습니다 (웹앱 설정 ⑨)'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([parts.join('\n')], { type: 'text/plain' })); a.download = fname; a.click(); }
      setTimeout(async () => { await jclear(); buf.length = 0; idbPend.length = 0; window.__rnLog('수집기', 'info', `작업 기록을 내려받고 이 PC의 기록을 비웠습니다 (${keys.length}일치, ${parts.length.toLocaleString()}줄)`); lastDrawn = -1; tab === 'hist' ? drawHist() : draw(); }, 1500); };
    window.__rnJournalToggle = () => { const on = !w.classList.contains('on'); w.classList.toggle('on', on); if (on) jPrefillOnce(); GM_setValue('rnu-jw', on ? 1 : 0); lastDrawn = -1; draw(); drawOv(); };
    (window.__rnRoleReady || Promise.resolve()).then(() => { const r = window.__rnRole ? window.__rnRole() : 'lead'; if (r === 'lead' && !w.classList.contains('on')) window.__rnJournalToggle(); /* (1.88.5) 정범님 10/20: 기록 창은 이 PC의 '일하는 수집기 탭'(lead)에서만 저절로 열림 — 쉬는 탭·등록·주문 팝업 같은 다른 화면 탭에서는 열지 않음(사람이 [기록]을 누르면 열림) · 쉬는 탭이 일하는 탭을 이어받으면 그때 열림 */ try { window.__rnRoleOn && window.__rnRoleOn((r2) => { if (r2 === 'lead' && !w.classList.contains('on')) window.__rnJournalToggle(); }); } catch (e) {} /* (1.88.4) 정범님 10/20: 모든 PC — 수집기가 다시 열리면(일하는 탭) 기록 창을 늘 연 채로 시작 · 닫아도 다음에 열리면 다시 열림 */ /* (1.74.4) 로거는 크롬이 열리고 수집기가 돌면 기록 창을 늘 연 채로 시작 */ }); }; // (1.56.0) 쉬는 탭은 기록 창을 닫은 채로 (기억해 둔 '열림'은 그대로 둠)
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
      let pwSig = '', pwAt = 0; /* (1.88.4) 바뀔 때만 · 아니면 20초마다 */ setInterval(() => { try { const vm = ((globalThis.__rnQ('#rn-prc .hd small') || {}).textContent || '').match(/v([\d.]+)/); const st0 = { state: ((document.getElementById('pw_state') || {}).textContent || '').trim().slice(0, 300), prog: ((document.getElementById('pw_prog') || {}).textContent || '').trim().slice(0, 300) }; const sg = JSON.stringify(st0); if (sg !== pwSig || Date.now() - pwAt > 20000) { pwSig = sg; pwAt = Date.now(); GM_setValue('rnu-pw-st', { at: Date.now(), state: ((document.getElementById('pw_state') || {}).textContent || '').trim().slice(0, 300), prog: ((document.getElementById('pw_prog') || {}).textContent || '').trim().slice(0, 300), ver: vm ? vm[1] : null, tab: TAB }); }
        if (dirty) { dirty = false; GM_setValue('rnu-pw-tail', tail); } } catch (e) {} }, 2000); return true; };
    if (!attach()) { let n = 0; const t = setInterval(() => { if (attach() || ++n > 60) clearInterval(t); }, 1000); } })();
  /* (1.52.0) 'Script error. (:0)' = 다른 주소에서 온 알라딘 화면 자체 스크립트(광고·통계 등)의 오류 — 브라우저가 내용을 가려 보내 우리가 고칠 것이 없음 → 기록 창을 덮지 않게 빼고 하루 몇 번 나왔는지만 셈 */
  window.addEventListener('error', (ev) => { if (/^Script error\.?$/i.test(String(ev.message || '').trim()) && !ev.filename) { window.__rnXerr = (window.__rnXerr || 0) + 1; return; } window.__rnLog('오류', 'err', `${ev.message} (${(ev.filename || '').split('/').pop()}:${ev.lineno})`); });
  window.addEventListener('unhandledrejection', (ev) => { const r = ev.reason; const st = r && r.stack ? String(r.stack).split('\n').slice(1, 5).map((x) => x.trim().replace(/https?:\/\/[^\s)]*\/([^/\s)]+)/g, '$1')).join(' ← ') : ''; window.__rnLog('오류', 'err', `처리되지 않은 오류: ${r && r.message ? r.message : r}${st ? ' · 어디서: ' + st.slice(0, 300) : ''} · ${location.pathname}`); }); /* (1.89.39) 3시간 점검 10/23 'Maximum call stack' — 어느 함수인지 남김(파일·줄) */
  window.__rnLog('수집기', 'info', `탭 열림 · ${location.pathname.split('/').pop()}`);
  try { if (document.wasDiscarded) window.__rnLog('수집기', 'warn', '⚠ 크롬이 이 탭을 메모리 절약으로 내려놓았다가 다시 열었음 — 그동안 수집이 멈춰 있었음. 크롬 설정 → 성능 → 메모리 절약 → \'항상 활성 상태로 유지할 사이트\'에 aladin.co.kr 추가'); } catch (e) {} /* (1.77.3) HOME 탭이 22:24~23:23 소리 없이 멈춘 일 — 까닭을 기록에 남김 */
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
  if (!globalThis.__rnPubHome && (window.top !== window || !/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname))) return;
  const VER = ((typeof globalThis !== 'undefined' && globalThis.__RN_FILE_VER) || (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version)) || '?';
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
  #rn-ctl .rsub{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#EEF4F1;color:#3F524C;border-bottom:1px solid #DCE6E1;font-size:12px;line-height:1.4} #rn-ctl .rsub[hidden]{display:none} #rn-ctl .rsub .tx{flex:1;min-width:0} #rn-ctl .rsub small{display:block;color:#6B7A75;font-size:11px}
  #rn-ctl .rsub.force{background:#FFF6E6;color:#7A4A10;border-bottom-color:#F0DDBA} #rn-ctl .rsub.force small{color:#8A6A3A} #rn-ctl .rsub.lead{background:#F4F8F6;color:#5B6B66} #rn-ctl .rsub.new{background:#E6F3EA;color:#2F7D4F}
  #rn-ctl .rsub button{flex:none;padding:4px 9px;border-radius:6px;border:1px solid #9DB5AC;background:#fff;color:#2F5D50;font:600 11.5px system-ui,'Malgun Gothic';cursor:pointer} #rn-ctl .rsub.force button{border-color:#D9B57A;color:#7A4A10}
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
  #rn-ctl:not([data-rnu="ov"]) #rn-ov{display:none !important} #rn-ctl:not([data-rnu="prd"]) #rnp{display:none !important} #rn-ctl:not([data-rnu="crm"]) #rn-crm{display:none !important} #rn-ctl:not([data-rnu="prc"]) #rn-prc{display:none !important}
  #rn-ov{padding:10px 12px 12px}
  #rn-ov .card{border:1px solid #E1E8E5;border-radius:10px;padding:9px 11px;margin-bottom:9px}
  #rn-ov .card.now{border-left:5px solid #9AA5A1} #rn-ov .card.now.busy{border-left-color:${BLU}} #rn-ov .card.now.pause,#rn-ov .card.now.stop{border-left-color:${AMB};background:#FFFBF3}
  #rn-ov .k{font-size:11.5px;color:#5B6B66;font-weight:700;letter-spacing:.02em;margin:0 0 5px;display:flex;align-items:center;gap:6px} #rn-ov .k .sp{flex:1} #rn-ov .k a{font-weight:400;color:${G}}
  #rn-ov .big{font-size:15px;font-weight:700} #rn-ov .mut{color:#5B6B66;font-size:12px}
  #rn-ov .ol{margin:1px 0} #rn-ov .ol.now{margin-top:5px} #rn-ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-ov .pb{height:8px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-ov .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-ov .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-ov .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-ov .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-ov .chip.now{background:${G};border-color:${G};color:#fff;font-weight:700} #rn-ov .chip.off{text-decoration:line-through;opacity:.6} #rn-ov .chip.skip{background:#FFF4E0;color:${AMB}} #rn-ov .chip.fail{background:#FDE8E6;color:${RED}}
  #rn-ov .acts{display:flex;gap:6px;margin-bottom:9px}
  #rn-ov details.feat>summary{cursor:pointer;list-style:none} #rn-ov details.feat>summary small{font-weight:400;color:#5B6B66;margin-left:4px} #rn-ov .fr{display:block;padding:3px 0;border-top:1px dashed #E3E9E6;font-size:12px;cursor:pointer} #rn-ov .fr small{display:block;color:#6B7A75;font-size:11px;margin-left:20px} #rn-ov .fr.main{background:#F4F8FD;padding:5px 4px;border-radius:6px;border:0;margin:4px 0} #rn-ov .fr .fw{font-size:10px;color:#1F5FAF;border:1px solid #C9D6E8;border-radius:8px;padding:0 5px;margin-left:4px} #rn-ov .fbar{display:flex;gap:5px;align-items:center;margin:6px 0 2px;font-size:12px} #rn-ov .fbar b{flex:1} #rn-ov .fbar button{font-size:11px;padding:2px 7px;border:1px solid #C9D6E8;background:#fff;border-radius:6px;cursor:pointer}
  #rn-feat-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;background:#1F2A26;color:#fff;padding:8px 14px;border-radius:8px;font:600 12.5px/1.4 system-ui,'Malgun Gothic',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}
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
  globalThis.__rnHead(st);
  const box = document.createElement('div'); box.id = 'rn-ctl';
  const pc = () => (window.__rnPcName && window.__rnPcName.get()) || '이 PC';
  box.innerHTML = `<div class="ch" title="눌러서 접기·펼치기"><b>리드나우 수집기</b><small id="rnCtlWho"></small><span class="sp"></span><span class="bdg" id="rnCtlBadge">준비 중</span><button class="tg" id="rnCtlMin" title="접기·펼치기">–</button><button class="tg" id="rnCtlIco" title="작게(오른쪽 아래 아이콘으로) — 아이콘을 누르면 다시">▁</button></div>
    <div class="rsub" id="rnCtlSub" hidden></div>
    <div id="rn-uni"><button data-t="ov">개요</button><button data-t="crm">고객·주문</button><button data-t="prd">상품·매입</button><button data-log="1" title="작업 기록 크게 보기 (이 PC의 모든 기록 · 날짜별 · 검색 · 내려받기)">기록</button></div>
    <div class="cb"><div id="rn-ov"></div></div>`;
  const bar = box.querySelector('#rn-uni'); const body = box.querySelector('.cb'); const ov = box.querySelector('#rn-ov');
  const set = (t) => { if (t === 'hide') t = 'ov'; box.dataset.rnu = t; /* (1.70.0) 알라딘 화면의 body에 표시를 남기지 않음 — 수집기 칸에만 */ GM_setValue('rnu-tab', t); bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); draw(); };
  const setMin = (on, keep) => { box.classList.toggle('min', on); if (!keep) GM_setValue('rnu-ctl-min', on ? 1 : 0); box.querySelector('#rnCtlMin').textContent = on ? '+' : '–'; };
  /* (1.89.19) 정범님 10/21: 머리 칸을 끌어 원하는 곳으로 옮기고 그 자리를 이 PC에 기억 — 일하는 수집기(활성)와 쉬는 수집기(비활성) 자리를 따로 · ▁ 단추 = 오른쪽 아래 반투명 아이콘으로(누르면 다시) · 아이콘은 오른쪽 아래에 다른 것이 있으면 그 위로 */
  const roleK = () => (window.__rnRest && window.__rnRest() ? 'rest' : 'act'); let posRole = null, dragMoved = false;
  const clampPos = (p) => { const w = box.offsetWidth || 420, h = Math.min(box.offsetHeight || 60, 60); return { left: Math.max(0, Math.min(window.innerWidth - Math.min(w, 120), p.left)), top: Math.max(0, Math.min(window.innerHeight - h, p.top)) }; };
  const posApply = (force) => { const k = roleK(); if (!force && k === posRole) return; posRole = k; const p = GM_getValue('rnu-pos-' + k, null); if (p && p.left != null) { const q = clampPos(p); box.style.left = q.left + 'px'; box.style.top = q.top + 'px'; box.style.right = 'auto'; } else { box.style.left = ''; box.style.top = ''; box.style.right = ''; } icoApply(); };
  const posSave = () => { const r = box.getBoundingClientRect(); GM_setValue('rnu-pos-' + roleK(), { left: Math.round(r.left), top: Math.round(r.top), at: Date.now() }); try { window.__rnLog && window.__rnLog('수집기', 'detail', `📌 수집기 자리 저장(${roleK() === 'act' ? '일하는 수집기' : '쉬는 수집기'})`); } catch (e) {} };
  { const ch = box.querySelector('.ch'); let sx = 0, sy = 0, bl = 0, bt = 0, on = false;
    ch.addEventListener('pointerdown', (e) => { if (e.button !== 0 || e.target.closest('button')) return; const r = box.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; bl = r.left; bt = r.top; on = true; dragMoved = false; try { ch.setPointerCapture(e.pointerId); } catch (er) {} });
    ch.addEventListener('pointermove', (e) => { if (!on) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!dragMoved && Math.abs(dx) + Math.abs(dy) < 6) return; dragMoved = true; const q = clampPos({ left: bl + dx, top: bt + dy }); box.style.left = q.left + 'px'; box.style.top = q.top + 'px'; box.style.right = 'auto'; ch.style.cursor = 'grabbing'; });
    ch.addEventListener('pointerup', () => { if (!on) return; on = false; ch.style.cursor = ''; if (dragMoved) posSave(); });
    ch.addEventListener('dblclick', (e) => { if (e.target.closest('button')) return; GM_setValue('rnu-pos-' + roleK(), null); posApply(true); }); ch.title = '눌러서 접기·펼치기 · 끌어서 옮기기(자리 기억 — 일하는/쉬는 수집기 따로) · 두 번 누르면 원래 자리'; }
  box.querySelector('.ch').addEventListener('click', (e) => { if (dragMoved) { dragMoved = false; return; } if (e.target.closest('#rnCtlIco')) return; setMin(!box.classList.contains('min')); });
  /* ▁ 아이콘으로 작게 */
  const ico = document.createElement('div'); ico.id = 'rn-ctl-ico'; ico.title = '리드나우 수집기 — 누르면 다시 펼침'; ico.textContent = 'RN'; ico.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483646;width:38px;height:38px;border-radius:50%;background:rgba(47,93,80,.55);color:#fff;font:800 13px/38px system-ui,Malgun Gothic,sans-serif;text-align:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25);display:none;user-select:none';
  const icoK = () => 'rnu-ico-' + roleK(); const icoPlace = () => { if (ico.style.display === 'none') return; let bottom = 14; const seen = new Set(); for (let y = window.innerHeight - 20; y > window.innerHeight - 320; y -= 24) for (const x of [window.innerWidth - 24, window.innerWidth - 60]) { let L = []; try { L = document.elementsFromPoint(x, y); } catch (e) {} for (const el of L) { if (el === ico || el === document.body || el === document.documentElement || box.contains(el) || seen.has(el)) continue; seen.add(el); let f = el; for (let d = 0; f && d < 4 && f !== document.body; d++, f = f.parentElement) { if (getComputedStyle(f).position === 'fixed') { const r = f.getBoundingClientRect(); if (r.height < window.innerHeight * 0.6) bottom = Math.max(bottom, window.innerHeight - r.top + 8); break; } } } } ico.style.bottom = Math.min(bottom, window.innerHeight - 50) + 'px'; }; /* 오른쪽 아래 몇 점만 살펴 고정된 것(알림·칩 등)이 있으면 그 위로 — 화면 전체를 훑지 않음 */
  const icoApply = () => { const on = !!GM_getValue(icoK(), 0); box.style.display = on ? 'none' : ''; ico.style.display = on ? 'block' : 'none'; icoPlace(); };
  ico.onclick = () => { GM_setValue(icoK(), 0); icoApply(); }; box.querySelector('#rnCtlIco').onclick = (e) => { e.stopPropagation(); GM_setValue(icoK(), 1); icoApply(); };
  setInterval(() => { posApply(false); icoPlace(); }, 2000); window.addEventListener('resize', () => posApply(true));
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.log) { window.__rnJournalToggle && window.__rnJournalToggle(); return; } if (b.dataset.t) set(b.dataset.t); });
  // 예전 패널(고객·상품·가격 감시)을 이 판 안으로 옮김 — 패널 안의 단추·기능은 그대로
  const adopt = () => { ['rn-crm', 'rnp', 'rn-prc'].forEach((id) => { const el = globalThis.__rnById(id); if (el && el.parentElement !== body) body.appendChild(el); }); };
  const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hm = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const md = (t) => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  let crmRes = null; const pollCrm = async () => { try { crmRes = window.__rnCrm && window.__rnCrm.resumableInfo ? await window.__rnCrm.resumableInfo() : null; } catch (e) { crmRes = null; } };
  setInterval(pollCrm, 10000); setTimeout(pollCrm, 3000);
  const stateOf = () => { const lives = window.__rnLive ? window.__rnLive() : []; const mine = lives.find((v) => v.tab === window.__rnTab); const busy = lives.filter((v) => v.busy); const main = (mine && mine.busy) ? mine : busy[0] || null;
    const paused = !!window.__rnPaused; const kind = paused && busy.length ? 'stop' : paused ? 'pause' : busy.length ? 'busy' : 'idle';
    return { lives, busy, main, mine, paused, kind, last: lives.map((v) => v.lastEnd).filter(Boolean).sort((a, b) => b.at - a.at)[0] || null }; };
  /* (1.89.68) 정범님 10/25 20:23 'HOME에서 중단 → 시작만 눌렀는데 집중 벤치마킹이 시작됨': 예전 '▶ 다시 시작'은 멈춘 작업 목록에서 '가장 최근에 저장된 것'을 이어갔는데, 그 목록에 로거가 읽는 중인 벤치마킹 판매자 자리(쪽마다 저장 → 늘 가장 최근)가 섞여 있어 HOME이 로거의 벤치마킹을 이어받았음
   *  → '다시 시작' = 일시정지를 풀고, 멈출 때 이 PC가 하던 일만 그 자리부터(없으면 풀기만 — 그다음은 ⏰ 차례대로) · 로그인 PC의 멈춘 작업 목록에는 다른 PC의 공개 일(벤치마킹 등) 자리를 보이지 않음(로거 몫 — 버리면 로거가 처음부터 다시 읽음) */
  const resTarget = (R) => { const pi = window.__rnPauseInfo ? window.__rnPauseInfo() : null; const ks = new Set((pi && pi.keys) || []); if (!ks.size) return null; return R.filter((r) => !r.running && (ks.has(r.key) || (ks.has('bench') && /^bench_/.test(r.key)) || (r.mod === 'crm' && [...ks].some((k) => /crm/i.test(k)))) && (!r.by || r.by === pc())).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null; };
  const resList = () => { const P = window.__rnPrd; const out = []; const rk = P && P.runningKeys ? P.runningKeys() : new Set();
    if (crmRes) out.push({ mod: 'crm', key: crmRes.key, name: crmRes.name, meta: `이 PC에 저장된 자리${crmRes.savedAt ? ' · ' + md(crmRes.savedAt) + ' 멈춤' : ''}${crmRes.why ? ' · ' + crmRes.why : ''}`, savedAt: crmRes.savedAt || 0, running: false });
    ((P && P.resumables && P.resumables()) || []).filter((r) => globalThis.__rnPubHome || !(window.__rnIsPubKey && window.__rnIsPubKey(r.key) && r.by && r.by !== pc())).forEach((r) => out.push({ mod: 'prd', key: r.key, name: r.name, by: r.by || null, meta: [r.stage ? `단계: ${r.stage}` : '', r.prog, r.by ? `${r.by}에서 ${md(r.savedAt)} ${/^bench_\d+$/.test(r.key) && rk.has('bench') && Date.now() - (r.savedAt || 0) < 5 * 60000 ? '읽는 중(마지막 적음)' : '멈춤'}` : r.savedAt ? md(r.savedAt) + ' 멈춤' : ''].filter(Boolean).join(' · '), savedAt: r.savedAt || 0, running: rk.has(r.key) || (/^bench_\d+$/.test(r.key) && rk.has('bench') && Date.now() - (r.savedAt || 0) < 5 * 60000) /* (1.63.3) 벤치마킹 판매자: 어느 PC가 벤치마킹을 하는 중이고 이 판매자 자리가 5분 안에 적혔으면 = 지금 읽는 중(예전엔 '멈춤'으로 보여 이어하기·버리기를 눌러도 '진행 중'이라며 안 됐음) */ }));
    return out; };
  // 머리줄 배지: 접어도 보임
  const badge = (S) => { const b = box.querySelector('#rnCtlBadge'); const m = S.main;
    const txt = S.kind === 'stop' ? '■ 멈추는 중…' : S.kind === 'pause' ? '■ 일시정지됨' : S.kind === 'busy' ? `▶ ${m && m.job ? m.job : '작업 중'}` : '쉬는 중';
    b.textContent = txt; b.title = txt; b.className = 'bdg ' + ({ stop: 'stop', pause: 'pause', busy: 'busy', idle: '' })[S.kind];
    box.querySelector('#rnCtlWho').textContent = `${pc()} · v${VER}`; };
  /* (1.76.1) 🧩 한 크롬에 수집기가 두 개 깔렸는지 — 정범님 10/16: '수집기는 이미 업데이트했는데 샵매니저에 빨간 경고창(본체 1.70.2 · 모듈 1.72.0)이 계속 뜸'
   *  까닭: Tampermonkey에 예전에 붙여 넣은 옛 수집기(다른 이름·사본)가 함께 켜져 있으면 그 옛 것이 자기 판과 모듈 판이 다르다고 경고를 띄움(새 것은 멀쩡) · 옛 것은 고칠 수 없으니 새 것이 알아채 안내
   *  방법: 화면에 '리드나우 수집기' 머리 칸(#rn-ctl)이 둘 이상이고 판이 다르면 → 옛 것의 빨간 경고를 이 안내로 바꿈(지우는 단계까지) · 같은 판 둘이면 '같은 것 두 개' 안내 */
  const dupChk = () => { try { if (globalThis.__rnSR) return; const L = [...document.querySelectorAll('#rn-ctl')]; if (L.length < 2) return; const vs = L.map((b) => { const t = (b.querySelector('#rnCtlWho') || {}).textContent || ''; const m = t.match(/v(\d+\.\d+\.\d+)/); return m ? m[1] : '?'; }); const old = [...new Set(vs.filter((v) => v !== VER))];
      const key = vs.slice().sort().join(','); if (window.__rnDupShown === key) return; window.__rnDupShown = key;
      document.querySelectorAll('div').forEach((d) => { if (d !== box && /모듈 판이 맞지 않음/.test(d.textContent || '') && d.style && d.style.position === 'fixed' && (d.textContent || '').length < 900) d.style.display = 'none'; });
      const n = document.createElement('div'); n.style.cssText = 'position:fixed;right:10px;bottom:52px;z-index:2147483646;max-width:min(420px,92vw);background:#7A3E00;color:#fff;padding:8px 12px;border-radius:8px;font:600 12px/1.55 system-ui,Malgun Gothic,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.25)';
      n.innerHTML = `🧩 이 크롬에 리드나우 수집기가 <b>${L.length}개</b> 켜져 있습니다 (${vs.map((v) => 'v' + v).join(' · ')}) — 빨간 경고는 ${old.length ? '옛 것(v' + old.join(', v') + ')' : '같은 것 하나'}가 띄운 것이고, 새 판 v${VER}은 정상입니다.<br>지우는 법: ① 크롬 오른쪽 위 Tampermonkey 아이콘 → <b>대시보드</b> ② '리드나우 수집기'가 여러 줄이면 <b>판(버전) 칸이 ${old.length ? old.join('·') : '같은'}인 줄</b>의 휴지통(삭제) 누름 — <b>v${VER} 줄은 남김</b> ③ 이 화면 새로고침 → 오른쪽 위 수집기 칸이 하나(v${VER})만 보이면 끝<br><button style="margin-top:4px;padding:2px 8px;border-radius:5px;border:0;cursor:pointer">닫기</button>`;
      n.querySelector('button').onclick = () => n.remove(); document.body.appendChild(n); window.__rnLog && window.__rnLog('수집기', 'warn', `🧩 이 크롬에 수집기 ${L.length}개(${vs.join(', ')}) — 옛 것을 Tampermonkey에서 지워야 함`); } catch (e) {} };
  setTimeout(dupChk, 8000); setTimeout(dupChk, 45000);
  /* (1.56.0) 머리줄 아래 옅은 띠: 이 탭이 이 PC의 수집기인지, 쉬는 탭인지 (머리줄은 이름·판·상태로 이미 꽉 차서 따로) */
  const sub = box.querySelector('#rnCtlSub'); let subHtml = null, promotedAt = 0;
  const drawSub = (S) => { const r = window.__rnRole ? window.__rnRole() : 'lead'; const pn = window.__rnPageName || ((x) => x); let cls = '', h = '';
    if (r === 'wait') { h = '<div class="tx">이 PC의 수집기 탭을 확인하는 중…</div>'; }
    else if (r === 'follow') { const v = window.__rnLead ? window.__rnLead() : null; const lv = v && S.lives.find((x) => x.tab === v.tab);
      h = `<div class="tx">ⓘ 이 PC에서는 이미 수집기가 일하는 중 — <b>${v ? esc(pn(v.page)) : '다른'} 탭</b>${lv ? (lv.busy ? ` · ▶ ${esc(lv.job || '작업 중')}` : ' · 쉬는 중') : ''}<small>이 탭은 쉬는 상태입니다 (저절로 시작하는 작업 없음 · 보기와 일시정지는 됨). 그 탭을 닫으면 이 탭이 이어받습니다.</small></div><button data-r="force" title="한 PC에 수집기 둘 — 누르면 단점을 먼저 알려 드립니다">이 탭도 켜기…</button>`; }
    else if (r === 'force') { h = `<div class="tx">⚠ 이 탭도 수집기로 켜 둠 — 이 PC에 수집기 2개<small>매일 자동·웹앱 요청·맡긴 일은 원래 탭이 맡고, 이 탭은 직접 누른 작업만 합니다. 알라딘 요청 제한에 더 빨리 걸릴 수 있어요.</small></div><button data-r="rest">다시 쉬게 하기</button>`; cls = 'force'; }
    else if (r === 'lead') { const others = S.lives.filter((x) => x.tab !== window.__rnTab && (x.role === 'follow' || x.role === 'force'));
      if (promotedAt && Date.now() - promotedAt < 60000) { h = '<div class="tx">✓ 앞서 일하던 수집기 탭이 닫혀, 이 탭이 이 PC의 수집기를 이어받았습니다</div>'; cls = 'new'; }
      else if (others.length) { const f = others.filter((x) => x.role === 'force').length; h = `<div class="tx">이 탭이 이 PC의 수집기 · 다른 수집기 화면 ${others.length}개${f ? ` (그중 ${f}개는 사람이 켜 둠)` : '는 쉬는 중'}</div>`; cls = 'lead'; } }
    const k = cls + h; if (k === subHtml) return; subHtml = k; sub.className = 'rsub ' + cls; sub.hidden = !h; sub.innerHTML = h; };
  sub.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-r]'); if (!b) return; if (b.dataset.r === 'force') { if (window.__rnForceAsk && window.__rnForceAsk()) window.__rnForce(true); } else if (b.dataset.r === 'rest') window.__rnForce(false); subHtml = null; draw(); });
  if (window.__rnRoleOn) window.__rnRoleOn((r) => { if (r === 'lead' && window.__rnLeadSince && Date.now() - window.__rnLeadSince < 3000 && /follow|force/.test(String(lastRole))) promotedAt = Date.now(); if (r === 'follow') setMin(true, true); lastRole = r; subHtml = null; });
  let lastRole = null;
  let prevBusy = 0; function draw() { const S = stateOf(); badge(S); drawSub(S);
    if (S.busy.length < prevBusy && window.__rnPrd && window.__rnPrd.refreshResume) { setTimeout(() => { try { window.__rnPrd.refreshResume(); pollCrm(); } catch (e) {} }, 3000); } prevBusy = S.busy.length; /* 어느 탭의 작업이 끝나거나 멈추면 멈춘 작업 목록을 다시 읽음 */ if (box.classList.contains('min') || box.dataset.rnu !== 'ov') return; /* (1.74.1) 1.70.0에서 탭 표시를 body → 수집기 칸(box)으로 옮기며 이 줄만 body를 봐서 개요가 늘 비어 있었음(모든 PC) */
    const P = window.__rnPrd; const R = resList(); const anyBusy = S.busy.length > 0;
    const pi = window.__rnPauseInfo ? window.__rnPauseInfo() : null;
    // ① 지금 상태
    let now = '';
    if (S.kind === 'stop') now = `<div class="big" style="color:${AMB}">■ 멈추는 중</div><div class="mut">지금 하던 항목을 마치고 진행 위치를 저장하는 중입니다. 몇 초~1분 걸릴 수 있어요. 멈추면 아래 '멈춘 작업'에 나타납니다.</div>${S.main ? `<div class="mut" style="margin-top:4px">멈추는 작업: <b>${esc(S.main.job)}</b>${S.main.tab !== window.__rnTab ? ' (이 PC의 다른 탭)' : ''}</div>` : ''}`;
    else if (S.kind === 'pause') now = `<div class="big" style="color:${AMB}">■ 일시정지됨</div><div class="mut">${pi && pi.at ? `${md(pi.at)}에 ${esc(pi.why || '')} 멈춤. ` : ''}<b>다시 시작</b>을 누르기 전에는 어떤 작업도 저절로 시작하지 않습니다 (매일 자동 수집 포함).</div>`;
    else if (S.kind === 'busy') now = `${window.__rnOvHtml ? window.__rnOvHtml(S.main, !!S.main.crmBusy) : esc(S.main.job)}${S.main.tab !== window.__rnTab ? `<div class="mut" style="margin-top:4px">이 PC의 다른 탭(${S.main.page === 'worders.aspx' ? '주문조회' : S.main.page === 'wrecord_edit.aspx' ? '상품 조회' : '판매관리'})에서 진행 중 — 여기서도 멈추고 볼 수 있습니다</div>` : ''}${S.busy.length > 1 ? `<div class="mut">함께 진행 중: ${S.busy.filter((v) => v !== S.main).map((v) => esc(v.job)).join(', ')}</div>` : ''}`;
    else now = `<div class="big">쉬는 중</div><div class="mut">${S.last ? `마지막 작업: '${esc(S.last.name)}' ${md(S.last.at)} 끝 · ` : ''}${R.length ? `멈춘 작업 ${R.length}개가 아래에 있습니다.` : '멈춘 작업 없음.'}</div>`;
    // ② 주 버튼
    const resumeTarget = resTarget(R);
    const chainRes = R.find((r) => r.key === 'chain');
    const pauseBtn = S.paused
      ? `<button class="b-go" data-a="resume">▶ 다시 시작<small>${anyBusy ? '멈추는 중 — 멈춘 뒤 누르세요' : resumeTarget ? `'${esc(resumeTarget.name)}' 이어서` : '일시정지 풀기'}</small></button>`
      : `<button class="b-pause" data-a="pause">■ 일시정지<small>${anyBusy ? '지금 항목까지 저장하고 멈춤 (모든 탭)' : '자동 수집도 하지 않게 멈춰 둠'}</small></button>`;
    const allBtn = `<button class="b-all" data-a="all" ${anyBusy || S.paused ? 'disabled' : ''} title="고객·주문부터 구매자 분포까지 켜 둔 단계를 차례로. 단계를 켜고 끄는 곳: 상품·매입 탭">▶ ${chainRes ? '전체 수집 이어서' : '전체 수집 시작'}<small>${chainRes ? esc(chainRes.meta.split(' · ')[0]) + '부터' : '고객·주문 → 상품 → 판매자 … 켜 둔 단계 차례로'}</small></button>`;
    // ③ 멈춘 작업
    const rs = R.length ? R.map((r) => `<div class="rs"><div class="t"><b>${esc(r.name)}</b><small>${esc(r.meta)}</small></div>${r.running ? `<span class="on" title="다른 PC(또는 이 PC의 다른 탭)가 지금 이 작업을 하는 중 — 멈추려면 그 PC를 일시정지(🛰 PC 원격 ■)">▶ 진행 중${/^bench_/.test(r.key) && r.meta ? '' : ''}</span>` : `<button data-a="res1" data-m="${r.mod}" data-k="${esc(r.key)}" ${anyBusy || S.paused ? 'disabled' : ''} title="${S.paused ? '먼저 다시 시작(일시정지 풀기)' : anyBusy ? '다른 작업이 끝난 뒤' : '멈춘 자리부터 이어서'}">이어하기</button><button class="x" data-a="dis1" data-m="${r.mod}" data-k="${esc(r.key)}" title="멈춘 자리만 잊음 — 받은 기록은 그대로">버리기</button>`}</div>`).join('') : '<div class="mut">없음 — 일시정지하거나 창이 닫혀 멈춘 작업이 생기면 여기에 작업마다 나옵니다.</div>';
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
      ${featHtml(S)}
      <div class="card"><div class="k">멈춘 작업 ${R.length ? `(${R.length})` : ''}<span class="sp"></span><a href="#" data-a="rrf" title="다시 불러오기">↻</a></div>${rs}</div>
      <div class="card"><div class="k">⏰ 다음 자동 수집</div><div>${sched}</div></div>
      <div class="card"><div class="k">최근 기록 · 이 PC의 모든 탭<span class="sp"></span><a href="#" data-a="log">크게 보기 ›</a></div><div class="lg">${lg}</div></div>
      <div class="card"><div class="k">다른 PC · 판</div>${pcs ? pcs.replace(/class="pc/g, 'class="pc') : '<div class="mut">불러오는 중</div>'}<div class="pc">수집기 v${VER}${(() => { try { const L = window.__rnLiveInfo && window.__rnLiveInfo(); if (!L) return ''; return L.noeval ? ' · ⚡ 빠른 업데이트 안 됨(이 브라우저가 막음 — Tampermonkey 자동 업데이트만)' : L.used === 'live' ? ` · ⚡ 빠른 업데이트로 받은 판 (Tampermonkey 본체 ${esc(L.classic)})` : L.have && L.have !== L.ver ? ` · ⚡ 새 판 ${esc(L.have)} 받아 둠 — 쉬는 사이 바꿈` : ' · ⚡ 빠른 업데이트 켜짐(5분마다 확인)'; } catch (e) { return ''; } })()}${od ? ` · <b style="color:${AMB}">새 판 ${esc(od)} 있음</b> — 쉬는 사이(또는 긴 작업이면 저장 지점에서) 저절로 바꿔 그 자리부터 이어감` : ' · 최신'}${P && P.who ? ' · ' + esc(P.who()) : ''}</div></div>`;
    if (html === lastHtml) return; lastHtml = html; ov.innerHTML = html; // 바뀐 것이 있을 때만 다시 그림 (단추를 누르는 중에 사라지지 않게)
    const lgEl = ov.querySelector('.lg'); if (lgEl && GM_getValue('rnu-log-autoscroll', true)) lgEl.scrollTop = lgEl.scrollHeight; }
  let lastHtml = '';
  /* (1.63.7) 🧩 이 PC 기능 켜고 끄기 — 📥 수집(= 일시정지 스위치) + 수집 외 기능(전체 켜기·전체 끄기) · 바꾸면 곧바로 아래 알림 */
  function featHtml(S) { const FL = window.__rnFeats || []; const FO = window.__rnFeatOff ? window.__rnFeatOff() : []; const on = FL.length - FO.length;
    return `<details class="card feat" ${GM_getValue('rnu-feat-open', 0) ? 'open' : ''}><summary class="k">🧩 이 PC 기능 켜고 끄기 <small>${S.paused ? '<b style="color:#B0322A">📥 수집 꺼짐</b>' : '📥 수집 켜짐'} · 수집 외 ${on}/${FL.length} 켜짐</small></summary>
      <label class="fr main"><input type="checkbox" data-feat="__collect" ${S.paused ? '' : 'checked'}> <b>📥 수집</b><small>끄면 이 PC는 직접 누른 수집·⏰ 자동 수집·웹앱 수집 요청·🌐 외부 정보·맡긴 수집 일(시장 지표·읽기·찾기)을 하지 않음 — 하던 작업은 지금 항목까지 저장하고 멈춤(= 일시정지 · 이 PC의 모든 탭). 담당 PC면 순서대로 다른 PC가 맡음. 다시 켜도 멈춘 작업은 저절로 이어가지 않음(아래 '멈춘 작업'에서 이어하기)</small></label>
      <div class="fbar"><b>수집 외 기능</b><button type="button" data-fall="1">전체 켜기</button><button type="button" data-fall="0">전체 끄기</button></div>
      ${FL.map(([k, l, d, w]) => `<label class="fr"><input type="checkbox" data-feat="${esc(k)}" ${FO.includes(k) ? '' : 'checked'}> ${esc(l)}<span class="fw">${esc(w)}</span><small>${esc(d)}</small></label>`).join('')}
      <div class="mut" style="margin-top:4px">이 PC만 · 화면 기능은 그 화면을 새로 열 때부터, 맡긴 일·바탕 기능은 곧바로 · 꺼 둔 맡긴 일은 대기로 남아 다른 PC가 받음 · 늘 켜짐: 관제판·작업 기록·PC 이름·탭 나누기·담당 PC 신호</div></details>`; }
  const featToast = (m) => { let t = globalThis.__rnById('rn-feat-toast'); if (!t) { t = document.createElement('div'); t.id = 'rn-feat-toast'; globalThis.__rnMount(t); } t.textContent = m; t.style.display = ''; clearTimeout(t._t); t._t = setTimeout(() => (t.style.display = 'none'), 3500); }; window.__rnToast = featToast; /* (1.63.12) 다른 모듈에서도 같은 알림 */
  ov.addEventListener('toggle', (e) => { if (e.target.matches && e.target.matches('details.feat')) GM_setValue('rnu-feat-open', e.target.open ? 1 : 0); }, true);
  ov.addEventListener('change', (e) => { const c = e.target.closest && e.target.closest('[data-feat]'); if (!c) return; const k = c.dataset.feat;
    if (k === '__collect') { if (c.checked) { window.__rnResumeOk && window.__rnResumeOk(); featToast('📥 수집 켬 — 이 PC가 다시 수집함 (멈춘 작업은 \'멈춘 작업\'에서 이어하기)'); } else { window.__rnPauseAll && window.__rnPauseAll('🧩 수집 끔 (관제판)'); featToast('📥 수집 끔 — 이 PC는 수집하지 않음 (하던 작업은 저장하고 멈춤)'); } }
    else { window.__rnFeatSet({ [k]: c.checked }); const f = (window.__rnFeats || []).find((x) => x[0] === k) || [k, k]; window.__rnLog && window.__rnLog('수집기', 'info', `🧩 ${f[1]} ${c.checked ? '켬' : '끔'}`); featToast(`🧩 ${f[1]} ${c.checked ? '켬' : '끔'}${/화면/.test(f[3] || '') ? ' — 그 화면을 새로 열 때부터' : ''}`); }
    lastHtml = ''; draw(); });
  ov.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-fall]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const on = b.dataset.fall === '1'; const P = {}; (window.__rnFeats || []).forEach((x) => (P[x[0]] = on)); window.__rnFeatSet(P); window.__rnLog && window.__rnLog('수집기', 'info', `🧩 수집 외 기능 전체 ${on ? '켬' : '끔'}`); featToast(`🧩 수집 외 기능 전체 ${on ? '켬' : '끔'} — 화면 기능은 그 화면을 새로 열 때부터`); lastHtml = ''; draw(); }, true);
  ov.addEventListener('click', async (e) => { const a = e.target.closest('[data-a]'); if (!a) return; e.preventDefault(); const P = window.__rnPrd; const k = a.dataset.k, m = a.dataset.m;
    if (a.dataset.a === 'pause') { window.__rnPauseAll && window.__rnPauseAll('관제판에서'); }
    else if (a.dataset.a === 'resume') { const S = stateOf(); if (S.busy.length) return alert('아직 멈추는 중입니다 — 멈춘 뒤에 눌러 주세요'); const t = resTarget(resList()); window.__rnResumeOk && window.__rnResumeOk();
      if (t) { if (t.mod === 'crm') window.__rnCrm.resume(); else P.resume(t.key); } }
    else if (a.dataset.a === 'all') { if (!P) return alert('수집기가 아직 준비 중입니다. 잠시 뒤 눌러 주세요'); if (stateOf().busy.length) return alert('이미 작업 중입니다'); window.__rnResumeOk && window.__rnResumeOk(); set('ov'); P.startAll(); }
    else if (a.dataset.a === 'res1') { window.__rnResumeOk && window.__rnResumeOk(); if (m === 'crm') window.__rnCrm.resume(); else { const r = P.resume(k); if (r && r.ok === false) { const row = a.closest('.rs'); let n = row && row.querySelector('.rs-why'); if (row && !n) { n = document.createElement('div'); n.className = 'rs-why'; n.style.cssText = 'flex-basis:100%;font-size:11.5px;color:#B0322A;margin-top:3px'; row.appendChild(n); } if (n) n.textContent = '✕ ' + r.why; return; } } }
    else if (a.dataset.a === 'dis1') { /* (1.63.2) 팝업 대신 단추 두 번 — 첫 누름은 '확정' 단추로 바뀜(4초) · 못 버리면 까닭을 그 줄 아래에 */ const row = a.closest('.rs'); const nm = (row.querySelector('b') || {}).textContent || k;
      if (a.dataset.arm !== '1') { a.dataset.arm = '1'; a.dataset.t0 = a.textContent; a.textContent = '확정'; a.title = `'${nm}'의 멈춘 자리만 잊음 — 받은 기록은 그대로, 다음엔 처음부터 훑되 이미 받은 것은 건너뜀`; a.style.background = '#B0322A'; a.style.color = '#fff'; setTimeout(() => { if (a.isConnected && a.dataset.arm === '1') { a.dataset.arm = ''; a.textContent = a.dataset.t0 || '버리기'; a.style.background = ''; a.style.color = ''; } }, 4000); return; }
      a.dataset.arm = ''; a.disabled = true; a.textContent = '지우는 중'; const r = m === 'crm' ? await window.__rnCrm.discard(k) : await P.discard(k);
      if (!r || !r.ok) { const why = (r && r.why) || '버리지 못했습니다'; a.disabled = false; a.textContent = a.dataset.t0 || '버리기'; a.style.background = ''; a.style.color = ''; let n = row.querySelector('.rs-why'); if (!n) { n = document.createElement('div'); n.className = 'rs-why'; n.style.cssText = 'flex-basis:100%;font-size:11.5px;color:#B0322A;margin-top:3px'; row.appendChild(n); } n.textContent = '✕ ' + why; try { log('버리기 못 함: ' + why, 1); } catch (e) {} return; }
      if (m === 'crm') await pollCrm(); }
    else if (a.dataset.a === 'rrf') { await pollCrm(); if (P && P.refreshResume) await P.refreshResume(); }
    else if (a.dataset.a === 'log') { window.__rnJournalToggle && window.__rnJournalToggle(); }
    lastHtml = ''; draw(); });
  window.__rnCtlDraw = () => { lastHtml = ''; draw(); };
  const go = () => { globalThis.__rnMount(box); try { globalThis.__rnMount(ico); } catch (e) { document.body.appendChild(ico); } adopt(); (window.__rnRoleReady || Promise.resolve()).then(() => posApply(true)); posApply(true); new MutationObserver(adopt).observe(document.body, { childList: true }); if (globalThis.__rnSR) new MutationObserver(adopt).observe(globalThis.__rnSR, { childList: true });
    let saved = GM_getValue('rnu-tab', 'ov'); if (saved === 'hide') saved = 'ov'; set(saved); setMin(!!GM_getValue('rnu-ctl-min', 0)); (window.__rnRoleReady || Promise.resolve()).then(() => { if (window.__rnRole && /^(follow|wait)$/.test(window.__rnRole())) setMin(true, true); }); /* (1.56.0) 쉬는 탭은 접힌 채로 (기억해 둔 접힘·펼침은 그대로) */
    if (saved === 'prc') setTimeout(() => { if (!bar.querySelector('button[data-t="prc"]')) set('ov'); }, 4000); // 가격 감시기 탭이 안 붙으면 개요로
    setInterval(draw, 1000); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();


}]);
