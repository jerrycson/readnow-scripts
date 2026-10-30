/* readnow-friend-boot.js — 🐾 책방 친구 혼자 도는 화면(friend/index.html)의 바탕 (웹앱 안에서는 쓰지 않음)
 *  ① readnow-friend.js(캐릭터 본체)가 빌려 쓰는 것을 아주 작게 만듦: db · S · esc · toast · deviceName · isAdminDevice · IS_PHONE · Q_DONE · todayStr · num · won · ALERT_DOC · alShipCX · openShip · openAlert
 *  ② 로그인: 같은 주소(jerrycson.github.io)의 크롬 탭이면 웹앱 로그인을 그대로 씀 · 바깥 프로그램(윈도우 Tauri · 안드로이드)은 처음 한 번 연결 표/코드 → 클라우드 /friend-token → 같은 계정 로그인 열쇠 → 그 뒤엔 프로그램 안 저장소에 남아 저절로
 *  ③ 알림 재료(작은 것만): 주문확인요청 문서 하나(shp_state/confirm) · 지금부터 올라오는 문의·구매평(crm_interactions) · 사업 알림 요약 문서 하나(app_summary/alerts — 웹앱 대표 탭이 씀)
 *  ④ 프로그램 다리: 살아 있음 신호(app_settings/fhost_<기기> 30초) · 눌리는 칸(rects) 알리기 · 프로그램 명령(window.__rnFriendCmd) · 연결 카드
 *  프로그램 다리 약속: 프로그램이 window.__rnFriendHost = {type:'tauri'|'android', ver, post(kind, data)}를 줌(없으면 RnHostAndroid · __TAURI_INTERNALS__로 만듦)
 *   화면 → 프로그램 post: ready{dev,email,app} · rects{r:[[l,t,r,b]...] CSS px 화면 좌표, kb, card:[l,t,r,b]|null(연결 카드 · 늘 눌림), drag(끄는 중 → 창 전체), vw, vh, dpr, sx, sy} · focus{on, r:[l,t,r,b](글 칸이 든 상자)} · notify{id,title,text,hidden} · open{url} · paired{dev,email} · signout · byeok
 *     (P5 · 프로그램 0.2.0) need_geom(화면이 뜬 뒤 자리 다시 받기) · open_settings(⚙ → 설정 창) · settings_close(설정 창 닫기) · win_drag{phase:start|move|end, x, y(포인터 CSS px), dx, dy(캐릭터 자리 · 기본 오른쪽 아래에서 옮긴 CSS px), dpr, vw, vh}
 *   프로그램 → 화면 __rnFriendCmd(cmd, arg): geom{x,y,w,h,scale,monitors,mon,pos:[dx,dy]|null,link} · hide · show · bye(끄기 직전 → byeok) · esc · drag_to{x,y}(끄는 중 다른 모니터로 창이 옮겨 감 → 그 자리 포인터) · say · open */
'use strict';
const RNF_BOOT_VER = '0.1.0';
firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' }); /* 웹앱과 같은 공개 설정(비밀 아님) */
const db = firebase.firestore(); /* 기기 저장본(IndexedDB) 없이 메모리만 — 문서 몇 개뿐 */
const S = { tab: null, app: { adminDevices: [] }, user: null, devOk: false, shipC: null, shipTab: null, qnaAll: null, _alNow: null, _biz: null, detail: null };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const IS_PHONE = (() => { try { return matchMedia('(max-width: 760px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent); } catch (e) { return false; } })();
const IS_MOBILE_DEV = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
const Q_DONE = ['Yes', '취소된 질문']; /* 웹앱과 같은 값 — 샵매니저 묻고 답하기 '답변여부' */
const ALERT_DOC = {};
const deviceName = () => { try { return localStorage.getItem('rn-device') || ''; } catch (e) { return ''; } }; /* 웹앱과 같은 열쇠(rn-device) — 같은 주소의 크롬 탭이면 웹앱 기기 이름 그대로 */
const isAdminDevice = () => S.devOk === true && [...(S.app.adminDevices || []), 'JS-MAIN', 'JS-PHONE', 'HOME'].map((x) => String(x).trim().toUpperCase()).includes(deviceName().trim().toUpperCase()); /* 웹앱과 같은 규칙 */
function todayStr() { const d = new Date(); const z = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
const num = (n, d = 0) => (n == null || !Number.isFinite(+n) ? '-' : (+n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }));
const won = (n) => (n == null ? '-' : Math.round(Number(n)).toLocaleString('ko-KR') + '원');
/* 주문확인요청에 남은 주문(웹앱 alShipCX와 같은 모양) — 프로그램은 '발송준비시작을 맡긴 주문' 표시가 없으므로 목록 그대로(목록은 15초마다 새로 읽혀 넘어간 주문은 곧 빠짐) */
function alShipCX() { const C0 = S.shipC; const L = C0 && Array.isArray(C0.orders) ? C0.orders.map((o) => String(o.orderNo)) : null; const n = L ? L.length : 0; return { n, x: { k: 'shipconfirm', n, ids: L, s: L ? '' : todayStr() } }; }
const RNF_APP = () => new URL('../app/', location.href).href;
function openShip() { frOpenUrl(RNF_APP() + '?go=confirm'); }
function openAlert(k) { frOpenUrl(RNF_APP() + (k === 'qna' ? '?go=qna' : '')); }
function toast(m, err, ms) { try { if (typeof mscErr === 'function') mscErr(m, !err); } catch (e) {} let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms || 2200); }
function qrArm(b, fn) { if (b.dataset.arm === '1') { b.dataset.arm = ''; b.textContent = b._t0 || b.textContent; return fn(); } b._t0 = b.textContent; b.dataset.arm = '1'; b.textContent = '한 번 더 누르면 ' + b._t0.replace(/^\S+\s/, ''); toast('한 번 더 누르면 실행합니다'); setTimeout(() => { if (b.isConnected && b.dataset.arm === '1') { b.dataset.arm = ''; b.textContent = b._t0; } }, 4000); }

/* ══ 프로그램 다리 ══ */
const FR_Q = new URLSearchParams(location.search);
const FR = { kind: FR_Q.get('host') || null, settings: FR_Q.get('settings') === '1', win: FR_Q.get('win') === 'set' ? 'set' : null, rk: '', rAt: 0, geom: null, hidden: false, booted: 0, xch: 0, card: null, cardArg: null, cardNo: null, since: null, pos: [0, 0], drag: null, tk: 0, link: null }; /* win 'set' = PC 프로그램의 ⚙ 설정 창(캐릭터·알림 없이 설정만) */
const FR_BEAT = 30e3;
const FR_CLOUD_DEF = 'https://readnow-cloud-63884079760.asia-northeast3.run.app'; /* Cloud Run 정해진 주소 꼴(서비스-프로젝트번호.지역.run.app · 비밀 아님) — 연결 링크에 실제 주소가 오면 그것이 먼저 */
const frKey = (d) => 'fhost_' + String(d || '').trim().toUpperCase().replace(/[\/\s.#$\[\]]+/g, '_').slice(0, 60); /* 웹앱 frwKey와 같은 규칙 */
const frLS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
function frHost() { const w = window; const h = w.__rnFriendHost; if (h && typeof h.post === 'function') return h;
  if (w.RnHostAndroid && typeof w.RnHostAndroid.post === 'function') return (w.__rnFriendHost = { type: 'android', post: (k, d) => w.RnHostAndroid.post(String(k), JSON.stringify(d == null ? null : d)) });
  const ti = w.__TAURI_INTERNALS__; if (ti && typeof ti.invoke === 'function') return (w.__rnFriendHost = { type: 'tauri', post: (k, d) => { try { const p = ti.invoke('friend_post', { kind: String(k), data: d == null ? null : d }); if (p && p.catch) p.catch(() => {}); } catch (e) {} } });
  return null; }
const frHostType = () => { const h = frHost(); return (h && h.type) || FR.kind || 'web'; };
function frPost(k, d) { const h = frHost(); if (!h) return false; const I = FR.ipc || (FR.ipc = { ok: 0, bad: 0, err: null }); /* (r16) 화면→프로그램 통로 결과를 셈(예전엔 실패를 조용히 삼켜 '단추가 안 눌림'의 원인이 안 보였음) */
  try { const TI = window.__TAURI_INTERNALS__; if (h.type === 'tauri' && TI && typeof TI.invoke === 'function') { const p = TI.invoke('friend_post', { kind: String(k), data: d == null ? null : d }); if (p && p.then) p.then(() => { I.ok++; }, (e) => { I.bad++; I.err = String((e && e.message) || e).slice(0, 160); I.errK = String(k); frIpcWarn(); }); return true; } if (h.type === 'tauri' && !TI) I.noInt = 1; h.post(k, d); return true; } catch (e) { I.bad++; I.err = 'throw ' + String((e && e.message) || e).slice(0, 140); frIpcWarn(); return false; } }

/* ══ (r16 · 정범님 10/30 캡처 'PC 0.2.0에서도 ⚙·💬·캐릭터가 안 눌림') 클릭 판정 진단 — 정범님이 설정 창 한 줄만 찍어 보내면 원인이 보이게
 *  ① 화면→프로그램 통로(friend_post) 결과를 셈(ok·bad·마지막 오류) ② 칸(rects) 보낸 수·마지막 보낸 때 ③ 프로그램(0.2.1)이 돌려준 커서·배율·통과 상태
 *  설정 창(따로 뜨는 창)은 캐릭터 창의 기록을 살아 있음 문서(app_settings/fhost_<기기>.dbg)에서 읽어 보여 줌 · 캐릭터 창은 통로 오류가 나면 🐾 위에 빨간 띠 */
function frFV() { try { const sc = document.querySelector('script[src*="readnow-friend.js"]'); return (sc && new URL(sc.src, location.href).searchParams.get('v')) || '?'; } catch (e) { return '?'; } } /* 화면(friend/) 판 = index.html이 부른 ?v= */
function frHitTxt(D, live) { if (!D) return '아직 기록 없음(캐릭터 창이 30초마다 적음)'; const I = D.ipc || {}, H = D.hit, C = D.clk; const ago = (t) => (t ? Math.max(0, Math.round((Date.now() - t) / 1000)) + '초 전' : '-');
  return [`칸 보냄 ${D.rN || 0}번${D.rAgo != null ? ` · 마지막 ${D.rAgo}초 전` : ''}`, `프로그램 받음 ✓${I.ok || 0} ✗${I.bad || 0}${I.err ? ` (오류: ${I.err})` : ''}${I.noInt ? ' · 통로 없음' : ''}`,
    H ? `프로그램 ${H.v || '?'}: 받은 칸 ${H.nRects != null ? H.nRects + '번 · ' : ''}지금 ${H.nr}개${H.rAge != null && H.rAge >= 0 ? ` · ${H.rAge}초 전` : ''} · 커서 (${H.x}, ${H.y}) · 배율 ${H.s}/${H.sf} · 클릭 통과 ${H.ign ? '켬(뒤로 지나감)' : '끔(이 창이 받음)'} · 칸 안 ${H.nIn}번 · 바꿈 ${H.nTog}번${H.fb ? ' · 기본 상자 씀' : ''}` : '프로그램 상태: 답 없음(0.2.0 이하 · 0.2.1부터 답함)',
    `화면이 받은 누름 ${C ? C.n + '번 · 마지막 ' + (C.t || '?') + ' ' + (C.pt || '') : '0번'}`, `화면 ${D.vw || '?'}×${D.vh || '?'} · 배율 ${D.dpr || '?'}`].join(' · '); }
function frHitLive() { return { ipc: FR.ipc || null, rN: FR.rN || 0, rAgo: FR.rAt2 ? Math.round((Date.now() - FR.rAt2) / 1000) : null, hit: FR.hitdbg || null, clk: FR.clk || null, vw: innerWidth, vh: innerHeight, dpr: window.devicePixelRatio || 1 }; }
function frHitShare() { try { if (FR.win === 'set') return; if (FR.rN || (FR.ipc && (FR.ipc.ok || FR.ipc.bad))) frLS('rnf_hitlive', JSON.stringify(Object.assign({ t: Date.now(), shell: (window.__rnFriendHost && window.__rnFriendHost.ver) || null, fv: frFV() }, frHitLive()))); } catch (e) {} }
function frHitFill() { const el = document.getElementById('fr_hitst'); if (!el) return; if (FR.win !== 'set') { el.textContent = '🖱 클릭 판정: ' + frHitTxt(frHitLive()); setTimeout(frHitFill, 3000); return; }
  let L = null; try { L = JSON.parse(frLS('rnf_hitlive') || 'null'); } catch (e) {} /* (r16) 캐릭터 창이 3초마다 남긴 것(같은 PC 저장소) — 20초 안 것이면 바로 · 아니면 살아 있음 문서 */
  if (L && L.t && Date.now() - L.t < 20e3) { el.textContent = '🖱 클릭 판정(캐릭터 창 · ' + Math.round((Date.now() - L.t) / 1000) + '초 전): ' + frHitTxt(L) + (L.shell ? ' · 프로그램 판 ' + L.shell : '') + (L.fv ? ' · 화면 판 ' + L.fv : ''); el.dataset.done = ''; setTimeout(frHitFill, 3000); return; }
  if (el.dataset.done) return; el.dataset.done = '1'; setTimeout(() => { el.dataset.done = ''; if (document.getElementById('fr_hitst') === el) frHitFill(); }, 15e3);
  const dev = deviceName().trim(); if (!dev) return; db.collection('app_settings').doc(frKey(dev)).get().then((d) => { const v = d.exists ? d.data() : null; el.textContent = '🖱 클릭 판정(캐릭터 창 · ' + (v && v.at ? new Date(v.at).toLocaleTimeString('ko-KR') + ' 기록' : '기록 없음') + '): ' + frHitTxt(v && v.dbg) + (v && v.shell ? ' · 프로그램 판 ' + v.shell : '') + (v && v.fv ? ' · 화면 판 ' + v.fv : ''); }, () => { el.textContent = '🖱 클릭 판정: 기록을 못 읽음'; }); }
function frIpcWarn() { const I = FR.ipc; if (!I || !I.bad || FR.win === 'set' || frHostType() !== 'tauri') return; let b = document.getElementById('msc_frwarn'); if (!b) { b = document.createElement('div'); b.id = 'msc_frwarn'; b.style.cssText = 'position:fixed;z-index:33;right:8px;bottom:8px;max-width:min(520px,90vw);background:#FDECEA;color:#9B2A1F;border:1px solid #E7A39B;border-radius:10px;padding:5px 9px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none'; document.body.appendChild(b); }
  b.textContent = `⚠ 책방 친구 프로그램 통로 오류 — 클릭 칸을 프로그램에 못 보냄(✓${I.ok} ✗${I.bad}): ${I.err || '?'} · 이 띠를 찍어 보내 주세요`; }
setTimeout(() => { if (FR.ipc && FR.ipc.bad && !FR.ipc.ok) frIpcWarn(); }, 15e3);

function frOpenUrl(u) { if (!frPost('open', { url: u })) try { window.open(u, '_blank', 'noopener'); } catch (e) {} }
/* 본체 고리 */
window.RNF_HOOKS = {
  go: (k) => frOpenUrl(RNF_APP() + (k === 'order' ? '?go=confirm' : k === 'qna' ? '?go=qna' : '')), /* 말풍선 '보기 ›' = 기본 브라우저로 웹앱 그 화면 */
  msg: (id, d) => { frPost('notify', { id, title: '💬 ' + String(((d && d.from) || {}).name || '책방 친구'), text: String((d && d.text) || '').slice(0, 200), hidden: FR.hidden ? 1 : 0 }); return false; }, /* 안드로이드 알림 · 화면에도 보임 */
  panHtml: () => frPanHtml(), widgetHtml: () => '', off: () => FR.win === 'set' }; /* (P5) 설정 창 = 캐릭터·알림 없이 설정만 */

/* ══ (r16 · 정범님 10/30) 🐾 3초 누르기 옮기기 — 프로그램(PC·안드로이드)에서는 자리를 FR.pos(Ctrl+끌기와 같은 칸)로 · 끄는 동안 창 전체가 손가락·마우스를 받음 · 🗑 = 프로그램 끝내기 ══ */
function frMvStart(x, y, f) { if (FR.drag && FR.drag.on && !FR.drag.mv) return; const p0 = FR.pos.slice(); f = f || [0, 0]; FR.pos = [FR.pos[0] + (+f[0] || 0), FR.pos[1] + (+f[1] || 0)]; frPosApply();
  FR.drag = { id: null, mv: 1, el: null, sx: x, sy: y, lx: x, ly: y, gx: x - (innerWidth + FR.pos[0]), gy: y - (innerHeight + FR.pos[1]), on: 1, mt: 0, at: performance.now(), p0 };
  document.documentElement.classList.add('fr-moving'); FR.rk = ''; frTick(); frPost('win_drag', { phase: 'start', x: Math.round(x), y: Math.round(y), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1, vw: innerWidth, vh: innerHeight, by: 'ico' }); }
function frMvMove(x, y) { const d = FR.drag; if (!d || !d.mv) return; d.lx = x; d.ly = y; d.at = performance.now(); frDragAt(x, y); const now = performance.now(); if (now - d.mt > 40) { d.mt = now; frPost('win_drag', { phase: 'move', x: Math.round(x), y: Math.round(y), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1 }); } }
function frMvEnd(keep) { const d = FR.drag; if (!d || !d.mv) return; FR.drag = null; document.documentElement.classList.remove('fr-moving'); if (keep) frPosSet(frPosClamp(FR.pos)); else { FR.pos = d.p0; frPosApply(); }
  frPost('win_drag', { phase: 'end', x: Math.round(d.lx), y: Math.round(d.ly), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1, vw: innerWidth, vh: innerHeight, why: keep ? 'ico' : 'ico-x' }); FR.rk = ''; frTick();
  if (keep) try { toast(frHostType() === 'tauri' ? '🐾 자리를 기억했어요(이 PC · 이 모니터)' : '🐾 자리를 기억했어요(이 기기)'); } catch (x) {} }
function frQuit() { const t = frHostType(); if (t === 'web' || FR.win === 'set' || !frHost()) return false;
  if (t === 'tauri' && !frShellAtLeast('0.2.1')) { toast('🐾 지금 PC 프로그램 판(' + ((window.__rnFriendHost || {}).ver || '?') + ')은 여기서 끌 수 없어요 — 작업 표시줄 오른쪽 🐾 아이콘 › 종료 · 새 판 0.2.1은 곧 저절로 설치돼요', 1, 7000); return true; }
  toast(t === 'tauri' ? '🐾 책방 친구를 껐어요 — 다시 켜려면 시작 메뉴(또는 바탕화면)의 책방 친구를 눌러요' : '🐾 책방 친구를 껐어요 — 다시 켜려면 책방 친구 앱에서 「🐾 캐릭터 띄우기」를 눌러요', 0, 4000);
  FR.quitAt = Date.now(); setTimeout(() => { if (t === 'tauri') frPost('quit', null); /* 프로그램이 'bye'(끔 신호) → byeok → 끝냄 */ else frBeat(true).catch(() => {}).then(() => { frPost('quit', null); frPost('byeok', null); }); /* 안드로이드: 새 판 = quit(다음 부팅 때도 안 켬) · 예전 판 = byeok로 끔 */ }, 1200); return true; }


/* (r16 · 10/30 'PC에서 단추가 안 눌림') 진단: 이 화면이 실제로 받은 누름(횟수·마지막 칸 id·시각) — 살아 있음 문서 dbg.clk(누름이 아예 안 오면 프로그램 쪽 클릭 통과 문제) */
document.addEventListener('pointerdown', (e) => { const t = e.target; const c = FR.clk || (FR.clk = { n: 0 }); c.n++; c.at = new Date().toISOString(); c.t = (t && t.closest && (t.closest('[id]') || {}).id) || (t && t.tagName) || null; c.pt = e.pointerType || null; }, true);
/* (r16) PC 프로그램이 0.2.1보다 낮으면 10분 뒤(자동 업데이트가 먼저 해 볼 시간)부터 🐾 근처에 작은 띠 — 누르면 새 판 받는 곳 */
const FR_SHELL_NEW = '0.2.1';
function frNag() { if (FR.nagOff || frHostType() !== 'tauri' || FR.win === 'set' || frShellAtLeast(FR_SHELL_NEW) || performance.now() < 600e3) return; if (document.getElementById('msc_frnag')) return; const ic = document.getElementById('msc_ico'); if (!ic) return;
  const b = document.createElement('div'); b.id = 'msc_frnag'; b.style.cssText = 'position:fixed;z-index:32;background:#FFF3D6;color:#7A4A00;border:1px solid #E0B65A;border-radius:10px;padding:4px 8px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;white-space:nowrap';
  b.innerHTML = '🖥 프로그램 새 판 ' + FR_SHELL_NEW + ' — 눌러서 받기 <span data-x="1" style="margin-left:6px;opacity:.6">✕</span>'; b.title = '지금 ' + ((window.__rnFriendHost || {}).ver || '?') + ' · 받은 setup.exe를 실행하면 덮어 설치돼요(트레이 🐾 › 업데이트 확인으로도 됨)';
  b.addEventListener('click', (e) => { e.stopPropagation(); if (e.target && e.target.dataset && e.target.dataset.x) { FR.nagOff = 1; b.remove(); FR.rk = ''; return; } frOpenUrl('https://github.com/jerrycson/readnow-scripts/releases/tag/friend-v' + FR_SHELL_NEW); });
  document.body.appendChild(b); const place = () => { if (!b.isConnected) return; const q = ic.getBoundingClientRect(); b.style.left = Math.max(4, Math.round(q.right - b.offsetWidth)) + 'px'; b.style.top = Math.max(4, Math.round(q.top - b.offsetHeight - 44)) + 'px'; }; place(); setInterval(place, 2000); FR.rk = ''; }
setInterval(frNag, 60e3);
Object.assign(window.RNF_HOOKS, { mvOk: () => !!frHost() && FR.win !== 'set', mvGet: () => FR.pos.slice(), mvStart: frMvStart, mvMove: frMvMove, mvEnd: frMvEnd, quit: frQuit });
/* ── 로그인 ── */
function frPairArgs() { const h = new URLSearchParams(String(location.hash || '').replace(/^#/, '')); const t = h.get('pair'); const code = String(h.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); const k = String(h.get('k') || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return t ? { t, c: h.get('c'), d: h.get('d'), k: k.length === 8 ? k : '' } : code.length === 8 ? { code, c: h.get('c') } : null; } /* #pair=표(링크 · k=같은 표의 코드 8자리 — 카드 칸에 채워 둠) · #code=8자리(안드로이드 앱 칸에서 친 코드) */
const frCleanUrl = () => { const q = new URLSearchParams(location.search); q.delete('pl'); const s = q.toString(); return location.pathname + (s ? '?' + s : ''); }; /* (P5) 프로그램이 연결 링크로 다시 열 때 붙인 pl(새로 읽기 표시)은 지움 */
function frCloud(c) { const ok = (u) => /^https:\/\/[a-z0-9.-]+\.run\.app$/i.test(String(u || '')); if (ok(c)) return c.replace(/\/+$/, ''); const v = frLS('rn-friend-cloud'); return ok(v) ? v : FR_CLOUD_DEF; }
function frAuth(u) { const P = frPairArgs();
  if (P) { try { history.replaceState(null, '', frCleanUrl()); } catch (e) {} if (!FR.xch) { FR.xch = 1; frExchange(P); } return; } /* 연결 표가 왔으면 먼저(이미 로그인돼 있어도 — 다른 기기 이름일 수 있음) */
  if (FR.xch === 2) return; if (!u) { S.user = null; return frCard('pair'); } if (!FR.booted) { FR.booted = 1; frBoot(u); } }
async function frExchange(arg) { const c = frCloud(arg.c); FR.code = arg.k || arg.code || ''; frCard('busy', FR.code); FR.xch = 2;
  try { const r = await fetch(c + '/friend-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arg.t ? { t: arg.t } : { code: arg.code }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok || !j.token || !j.dev) throw new Error(j.err || '클라우드 응답 ' + r.status);
    await firebase.auth().signInWithCustomToken(j.token); frLS('rn-device', String(j.dev)); frLS('rn-friend-cloud', c); frLS('rn-fr-paired', JSON.stringify({ at: new Date().toISOString(), dev: j.dev, email: j.email || null, host: frHostType() })); frLS('rn-fr-show', '1');
    frPost('paired', { dev: j.dev, email: j.email || null }); frCard('ok', j.dev); setTimeout(() => { try { location.replace(frCleanUrl()); } catch (e) { location.reload(); } }, 600); /* 깨끗한 주소로 다시 열면 저장된 로그인으로 바로 */ }
  catch (e) { FR.xch = 0; frCard('err', (e && e.message) || String(e)); } }
function frBoot(u) { S.user = u; const dev = deviceName().trim(); if (!dev) return frCard('nodev'); S.devOk = true; /* 연결 때 받은 기기 이름 = 크롬 웹앱이 확인한 그 이름 */ frCard(null);
  try { db.collection('app_settings').doc('main').onSnapshot((d) => { const x = d.exists ? d.data() : {}; S.app = { ...x, adminDevices: x.adminDevices || [] }; }, () => {}); } catch (e) {} /* 관리자 기기·클라우드 주소만 씀 */
  try { mscBoot(); } catch (e) { console.warn('책방 친구 시작', e); }
  if (FR.win === 'set') return frSetWin(); /* (P5) PC 프로그램 ⚙ 설정 창: 살아 있음 신호·눌리는 칸·알림 재료 없이 설정 창만(닫으면 창도 닫힘) */
  frFeeds(); frBeat(); setInterval(() => frBeat(), FR_BEAT); frTickArm(); setInterval(frState, 1500); if (frHostType() === 'tauri') setInterval(frHitShare, 3000); /* (r16) 설정 창이 3초 안 클릭 판정을 바로 보게(두 창은 같은 저장소) */
  addEventListener('pagehide', () => frBeat(true)); document.addEventListener('focusin', frTick, true); document.addEventListener('focusout', () => setTimeout(frTick, 30), true);
  if (FR.settings) setTimeout(() => { try { mscPanel(true); } catch (e) {} }, 800);
  frPost('ready', { dev, email: u.email || null, app: RNF_VER }); }
/* (P5) 설정 창: 설정을 바로 열고 · 설정을 닫으면(✕·Esc·바깥 누름) 창도 닫음 */
function frSetWin() { document.documentElement.classList.add('fr-setwin'); try { document.title = '🐾 책방 친구 설정'; } catch (e) {} let seen = 0, gone = 0;
  const open = () => { try { mscPanel(true); } catch (e) {} }; setTimeout(open, 300);
  setInterval(() => { const ov = document.getElementById('msc_ov'); if (ov) { seen = 1; gone = 0; return; } if (!seen) return; if (++gone >= 2) { seen = 0; if (!frPost('settings_close', null)) open(); } }, 400); }
/* 알림 재료 — 작은 문서만 */
function frFeeds() { try { db.collection('shp_state').doc('confirm').onSnapshot({ includeMetadataChanges: true }, (d) => { const fc = d.metadata.fromCache; if (fc && !d.exists) return; const nv = d.exists ? d.data() : { orders: [] }; S.shipC = nv; try { mscOrd(nv, fc); } catch (e) {} }, () => {}); } catch (e) {}
  try { db.collection('crm_interactions').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(Date.now() - 60e3)).onSnapshot((ss) => ss.docChanges().forEach((c) => { if (c.type !== 'removed') try { mscIx(c.doc.id, c.doc.data()); } catch (e) {} }), () => {}); } catch (e) {}
  /* (10/29 정범님 ②) 클라우드 바깥 알림: friend_say 문서 중 60초 안에 올라온 것 · 받는 기기(또는 all)만 말함 · 한 번 말한 문서는 다시 말하지 않음 */
  try { const seen = new Set(); db.collection('friend_say').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(Date.now() - 60e3)).onSnapshot((ss) => ss.docChanges().forEach((c) => { if (c.type !== 'added' || seen.has(c.doc.id)) return; seen.add(c.doc.id); const v = c.doc.data() || {}; if (v.to !== 'all' && v.to !== deviceName().trim()) return; try { mscExtSay(v.text, v.from); } catch (e) {} }), () => {}); } catch (e) {}
  try { db.collection('app_summary').doc('alerts').onSnapshot((d) => { const v = d.exists ? d.data() : null; if (!v || !Array.isArray(v.items)) return; S._alNow = new Map(v.items.map((x) => [x.k, x])); S._biz = v.T ? { T: v.T } : null; try { mscAlBiz(S._alNow); } catch (e) {} }, () => {}); } catch (e) {} }
/* 살아 있음 신호 · bye = 끄기 직전(웹앱 안에서 켠 크롬 캐릭터가 바로 돌아옴) */
async function frBeat(bye) { const dev = deviceName().trim(); if (!dev || !S.user) return; const now = new Date().toISOString(); if (!FR.since) FR.since = now;
  try { await db.collection('app_settings').doc(frKey(dev)).set({ dev, at: bye ? null : now, byeAt: bye ? now : null, since: FR.since, host: frHostType(), shell: (window.__rnFriendHost && window.__rnFriendHost.ver) || null, app: RNF_VER, by: (S.user && S.user.email) || null, hidden: !!FR.hidden, fv: frFV(), dbg: { clk: FR.clk || null, hit: FR.hitdbg || null, ipc: FR.ipc || null, rN: FR.rN || 0, rAgo: FR.rAt2 ? Math.round((Date.now() - FR.rAt2) / 1000) : null, rk: FR.rk ? FR.rk.length : 0, vw: innerWidth, vh: innerHeight, dpr: window.devicePixelRatio || 1 } }, { merge: true }); } catch (e) {} frPost('hit_dbg', null); /* (r16) 다음 신호 때 쓸 클릭 통과 상태를 물음(0.2.1부터 답함) */ }
/* 눌리는 칸(rects): 화면 좌표(CSS px) [왼, 위, 오른, 아래] — 캐릭터는 머리 칸 + 몸 칸만(투명한 가장자리는 통과) · 그 밖의 body 바로 아래 보이는 것 전부(단추·말풍선·입력 줄·설정 창·메시지 캐릭터·연결 카드) */
function frDragging() { return !!(FR.drag && FR.drag.on) || !!document.querySelector('#msc_ch.msc-dragging'); } /* 캐릭터를 끄는 중(Ctrl+끌기 자리 옮김 · 손발 끌기) */
function frCardRect() { const c = document.getElementById('fr_card'); if (!c || !c.querySelector('input')) return null; const q = c.getBoundingClientRect(); return q.width && q.height ? [Math.floor(q.left - 6), Math.floor(q.top - 6), Math.ceil(q.right + 6), Math.ceil(q.bottom + 6)] : null; } /* 코드 칸이 있는 연결 카드 — 열린 동안 늘 눌림 */
function frRects() { const out = []; if (FR.hidden) return out; const vw = innerWidth, vh = innerHeight; if ((frHostType() === 'tauri' || (FR.drag && FR.drag.mv)) && frDragging()) return [[0, 0, vw, vh]]; /* (r16) 🐾로 옮기는 동안은 안드로이드도 화면 전체 */ /* (P5) 끄는 중엔 창 전체가 마우스를 받음(포인터가 캐릭터 칸 밖으로 나가도 끌기가 안 끊기게) */
  const add = (l, t, r, b, pad) => { pad = pad || 0; l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(vw, r + pad); b = Math.min(vh, b + pad); if (r - l >= 1 && b - t >= 1) out.push([Math.round(l), Math.round(t), Math.round(r), Math.round(b)]); };
  const addEl = (el, pad) => { const q = el.getBoundingClientRect(); if (q.width && q.height) add(q.left, q.top, q.right, q.bottom, pad); };
  for (const el of document.body.children) { if (/^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) continue;
    if (el.id === 'msc_wrap') { const ch = el.querySelector('#msc_ch'); if (ch) { const q = ch.getBoundingClientRect(); if (q.width && q.height) { const sh = ch.dataset.view === 'full' ? { hw: 0.5, hh: 0.2, ix: 0.1 } : { hw: 0.46, hh: 0.4, ix: 0.12 }; add(q.left + q.width * (0.5 - sh.hw / 2), q.top, q.left + q.width * (0.5 + sh.hw / 2), q.top + q.height * sh.hh); add(q.left + q.width * sh.ix, q.top + q.height * sh.hh, q.right - q.width * sh.ix, q.bottom); } }
      el.querySelectorAll('.msc-bub').forEach((b) => addEl(b, 4)); continue; }
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none') continue; addEl(el, 2); }
  return out; }
/* 글 칸에 커서가 들어가면 창이 키보드를 받고(나오면 풀림) — 칸 밖으로 마우스가 나가도 입력이 끊기지 않게 */
const frFocusBox = (t) => { const b = (t.closest && t.closest('#fr_card,#msc_mbar,#msc_ov,#msc_cu,#msc_sh,.msc-ov')) || t; const q = b.getBoundingClientRect(); return [Math.floor(q.left), Math.floor(q.top), Math.ceil(q.right), Math.ceil(q.bottom)]; };
document.addEventListener('focusin', (e) => { const t = e.target; if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) frPost('focus', { on: true, r: frFocusBox(t) }); });
document.addEventListener('focusout', (e) => { const t = e.target; if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) setTimeout(() => { const a = document.activeElement; if (!a || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) frPost('focus', { on: false }); }, 60); });
function frKb() { const a = document.activeElement; return !!((a && a !== document.body && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || document.querySelector('#msc_mbar,#msc_ov,#msc_cu,#msc_sh,#fr_card input')); } /* 안드로이드: 글 칸이 열려 있으면 창이 키보드를 받게 */
function frTick() { if (FR.drag && FR.drag.on && !FR.drag.mv && performance.now() - (FR.drag.at || 0) > 4000 && FR.dragEnd) FR.dragEnd(null, 'stale'); /* 끄는 소식이 4초 넘게 없으면(창이 모니터를 옮기며 손 뗌을 놓침) 끝냄 — 창 전체가 계속 마우스를 받지 않게 */
  if (!frHost() || FR.win === 'set' || (document.hidden && frHostType() !== 'tauri')) return; /* (P5) PC 프로그램은 투명 창이라 '숨음'으로 잘못 보일 때가 있어 늘 보냄 */ if (FR.gearPlace) FR.gearPlace(); const r = frRects(); const kb = frKb(); const card = frCardRect(); const drag = frDragging(); const k = JSON.stringify(r) + kb + JSON.stringify(card) + drag + innerWidth + 'x' + innerHeight + '@' + (window.devicePixelRatio || 1); const now = Date.now(); if (k === FR.rk && now - FR.rAt < 5000) return; FR.rk = k; FR.rAt = now;
  FR.rN = (FR.rN || 0) + 1; FR.rAt2 = Date.now(); frPost('rects', { r, kb, card, drag, vw: innerWidth, vh: innerHeight, dpr: window.devicePixelRatio || 1, sx: window.screenX || 0, sy: window.screenY || 0 }); }
function frTickArm() { if (FR.tk) return; FR.tk = setInterval(frTick, 250); } /* (P5) 로그인 전(연결 카드만 있을 때)도 250ms마다 — 예전엔 로그인 뒤에만 돌아 카드 칸이 프로그램에 안 알려질 수 있었음 */
/* 캐릭터가 안 나오는 까닭을 카드로(범위 밖 · 캐릭터 안 고름) · 처음 연결이면 캐릭터 보이기 */
function frState() { if (!S.user || FR.card === 'pair' || FR.card === 'err' || FR.card === 'busy' || typeof M_ === 'undefined' || !M_.doc) return; const dev = mscDev(); if (!mscInScope()) return FR.cardNo === 'scope' ? null : frCard('scope', dev); const mine = mscMine();
  if (!mine.charId || !mscChar(mine.charId)) return FR.cardNo === 'nochar' ? null : frCard('nochar', dev); if (frLS('rn-fr-show') === '1') { frLS('rn-fr-show', null); if (!mscOpen()) try { mscSaveMe({ open: true }, '🐾 책방 친구 프로그램 — 캐릭터 보이기'); } catch (e) {} } if (FR.card === 'scope' || FR.card === 'nochar') frCard(null); }
window.__rnFriendCmd = function (cmd, arg) { if (cmd === 'geom') { FR.geom = arg || null; if (arg && 'link' in arg) FR.link = arg.link; if (!(FR.drag && FR.drag.on)) { if (arg && Array.isArray(arg.pos)) frPosSet(arg.pos, 1); else if (arg && arg.pos === null) frPosSet([0, 0], 1); } FR.rk = ''; setTimeout(frTick, 60); return true; } /* (P5) pos = 이 모니터에서 놓아 둔 캐릭터 자리(없으면 오른쪽 아래) */
  if (cmd === 'drag_to') { if (FR.drag && arg && Number.isFinite(+arg.x) && Number.isFinite(+arg.y)) { FR.drag.at = performance.now(); FR.drag.lx = +arg.x; FR.drag.ly = +arg.y; frDragAt(+arg.x, +arg.y); } return true; }
  if (cmd === 'hitdbg') { FR.hitdbg = arg || null; return true; } /* (r16 · 0.2.1) 클릭 통과 진단 — 살아 있음 문서 dbg.hit */
  if (cmd === 'hide' || cmd === 'show') { FR.hidden = cmd === 'hide'; document.documentElement.classList.toggle('rn-fhide', FR.hidden); FR.rk = ''; frTick(); frBeat(); return true; }
  if (cmd === 'bye') return frBeat(true).then(() => { frPost('byeok', null); return true; });
  if (cmd === 'esc') { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; }
  /* (10/29 정범님 ③) 프로그램 명령 허용 목록 — 이 셋만 받음: say(글 · 120자까지 말함) · open(order·qna·bad 화면) */
  if (cmd === 'say') return typeof mscExtSay === 'function' && !!mscExtSay(arg && arg.text, arg && arg.from);
  if (cmd === 'open') { const p = arg && arg.p; if (!['order', 'qna', 'bad'].includes(p) || typeof mscGo !== 'function') return false; try { mscGo(p); } catch (e) { return false; } return true; }
  return false; };
function frCard(kind, arg) { let c = document.getElementById('fr_card'); if (kind && c && FR.card === kind && FR.cardArg === arg) return; FR.card = kind; FR.cardArg = arg; if (!kind) { if (c) c.remove(); FR.rk = ''; return; }
  if (!c) { c = document.createElement('div'); c.id = 'fr_card'; c.className = 'fr-card'; document.body.appendChild(c);
    c.addEventListener('click', (e) => { if (e.target.closest('[data-frgo]')) frCodeGo(); else if (e.target.closest('[data-frx]')) { FR.cardNo = FR.card; frCard(null); } else if (e.target.closest('[data-frweb]')) frOpenUrl(RNF_APP()); else if (e.target.closest('[data-frfold]')) frCardFold(true); else if (e.target.closest('[data-frunfold]') && !(c._dragAt && performance.now() - c._dragAt < 400)) frCardFold(false); });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'fr_code') frCodeGo(); }); frCardDragBind(c); }
  const codeRow = '<div class="row"><input id="fr_code" maxlength="9" placeholder="ABCD-EFGH" autocomplete="off" spellcheck="false" aria-label="연결 코드 8자리"><button type="button" data-frgo="1" title="이 코드로 연결 — 같은 계정·같은 기기 이름으로 로그인">연결</button></div>';
  const how0 = `<small>① 이 ${IS_MOBILE_DEV ? '휴대폰' : 'PC'}의 크롬에서 리드나우 웹앱을 엶 → ② ⚙ 설정 › <b>🐾 책방 친구</b> 카드의 <b>🖥 이 기기에 책방 친구 프로그램 연결</b> → ③ 저절로 이 프로그램이 열리며 연결돼요. 안 열리면 웹앱에 나온 <b>연결 코드 8자리</b>를 아래에 넣어요(10분 안 · 한 번만).</small>`;
  const how = frNarrow() ? `<details class="fr-how"><summary>자세히 — 연결하는 법</summary>${how0}</details>` : `<p>${how0}</p>`; /* (10/29 급한 일) 휴대폰 폭이면 안내 글은 접어 둠 — 카드가 화면 40%를 넘지 않게 */
  c.classList.toggle('err', kind === 'err');
  const pill = kind === 'busy' ? '🔐 연결하는 중…' : kind === 'ok' ? '✓ 연결됨' : kind === 'err' ? '⚠ 연결 실패 — 펼치기' : kind === 'pair' || kind === 'nodev' ? '🐾 연결하기' : '🐾 책방 친구';
  const body = kind === 'pair' ? `<h4>${IS_MOBILE_DEV ? '아직 연결 전이에요 — 아래 칸에 코드를 넣거나 웹앱 단추를 누르세요' : '🐾 책방 친구 — 연결이 필요해요'}</h4>${how}${codeRow}<p><button type="button" class="ghost" data-frweb="1" title="기본 브라우저(크롬)로 리드나우 웹앱 열기">🌐 웹앱 열기</button></p>`
    : kind === 'busy' ? `<h4>🔐 연결하는 중…</h4>${arg ? `<p>연결 코드 <b style="font:700 18px/1.2 monospace;letter-spacing:2px">${esc(String(arg).slice(0, 4))}-${esc(String(arg).slice(4, 8))}</b></p>` : ''}<p><small>클라우드에서 같은 계정의 로그인 열쇠를 받고 있어요(몇 초).</small></p>`
    : kind === 'ok' ? `<h4>✓ 연결됨 — 기기 ${esc(arg || '')}</h4><p><small>캐릭터를 불러와요. 다음부터는 켜기만 하면 저절로 로그인돼요.</small></p>`
    : kind === 'err' ? `<h4 class="bad">⚠ 연결 실패</h4><p class="bad">${esc(String(arg || '').slice(0, 220))}</p><p><small>${/지났|사용한|맞지 않음|코드/.test(String(arg)) ? '웹앱에서 연결 단추를 다시 눌러 새 코드를 받아 주세요.' : /권한|열쇠|IAM/i.test(String(arg)) ? '클라우드 권한 준비가 필요해요 — 웹앱 설명서 › 🖥 책방 친구 프로그램 › 처음 한 번(클라우드) 참고.' : '인터넷 연결을 확인하고 다시 해 보세요.'}</small></p>${codeRow}`
    : kind === 'nodev' ? `<h4>🐾 이 프로그램에 기기 이름이 없어요</h4><p><small>웹앱에서 연결 단추를 다시 눌러 주세요(그 크롬의 기기 이름을 함께 받아요).</small></p>${how}${codeRow}`
    : kind === 'scope' ? `<h4>🐾 이 기기(${esc(arg || '')})는 켜는 범위 밖이에요</h4><p><small>관리자 기기의 🐾 ⚙ 책방 친구 설정 › ② 관리자 설정 › <b>켜는 범위</b>에 이 기기 이름을 넣으면 바로 캐릭터가 나와요.</small></p>`
    : kind === 'nochar' ? `<h4>🐾 아직 캐릭터를 고르지 않았어요</h4><p><small>오른쪽 아래 <b>🐾</b>를 눌러 내 이름·캐릭터를 고르면 나와요.</small></p>` : '';
  /* (10/29 급한 일 · 정범님 23:31 휴대폰) 머리줄 = 잡고 끌어 옮김 · ▾ 접기(작은 알약만) · 닫을 수 있는 카드는 ✕ — 자리·접힘은 이 기기에 기억 */
  c.innerHTML = `<div class="fr-hd" data-frhd="1" title="잡고 끌면 옮겨져요 · ▾ = 접기"><span class="grip" aria-hidden="true">⠿</span><b>🐾 책방 친구</b><span class="sp"></span><button type="button" class="hb" data-frfold="1" title="접기 — 작은 단추만 남겨요(누르면 다시 펼침)" aria-label="접기">접기 ▾</button>${kind === 'scope' || kind === 'nochar' ? '<button type="button" class="hb" data-frx="1" title="닫기" aria-label="닫기">✕</button>' : ''}</div><div class="fr-bd">${body}</div><button type="button" class="fr-pill" data-frunfold="1" title="눌러서 펼치기 · 끌어서 옮기기">${pill}</button>`;
  c.classList.toggle('fold', frLS(FR_CARD_FOLD) === '1'); frCardPlace(c);
  if (kind === 'pair' && FR.link === false) (c.querySelector('.fr-bd') || c).insertAdjacentHTML('beforeend', '<p class="bad"><small>⚠ 이 PC에 연결 주소(readnow-friend://)가 등록되지 않았어요 — 웹앱 단추로는 안 열릴 수 있으니 웹앱에 나온 코드 8자리를 위 칸에 넣어 주세요.</small></p>');
  const ci = document.getElementById('fr_code'); if (ci && FR.code && (kind === 'err' || kind === 'nodev')) ci.value = FR.code.slice(0, 4) + '-' + FR.code.slice(4, 8); /* (P5) 웹앱 단추로 받은 코드는 칸에 채워 둠 — Enter만 누르면 다시 */
  FR.rk = ''; if ((kind === 'pair' || kind === 'err' || kind === 'nodev') && !c.classList.contains('fold') && !frNarrow()) setTimeout(() => { const i = document.getElementById('fr_code'); if (i) try { i.focus(); } catch (e) {} }, 50); /* 휴대폰은 저절로 커서를 넣지 않음(자판이 바로 올라와 화면을 덮지 않게) */ setTimeout(frTick, 30); frTickArm(); }
/* ── 연결 카드 옮기기·접기(10/29 급한 일) — 자리는 오른쪽·아래 끝에서 떨어진 거리(px)로 기억(화면 크기가 바뀌어도 그 모서리 기준) ── */
const FR_CARD_POS = 'rn-fr-card-pos', FR_CARD_FOLD = 'rn-fr-card-fold';
function frNarrow() { return Math.min(innerWidth || 9999, (screen && screen.width) || 9999) <= 480; }
function frCardClamp(c, r, b) { const q = c.getBoundingClientRect(); const w = q.width || 0, h = q.height || 0; return [Math.round(Math.max(0, Math.min(innerWidth - w, r))), Math.round(Math.max(0, Math.min(innerHeight - h, b)))]; } /* 화면 밖으로 못 나감 */
function frCardPlace(c) { c = c || document.getElementById('fr_card'); if (!c) return; let p = null; try { p = JSON.parse(frLS(FR_CARD_POS) || 'null'); } catch (e) {}
  if (!p || !Number.isFinite(+p.r) || !Number.isFinite(+p.b)) { c.style.right = ''; c.style.bottom = ''; const q = c.getBoundingClientRect(); if (q.top < 0 || q.left < 0) { const [r, b] = frCardClamp(c, innerWidth - q.right, innerHeight - q.bottom); c.style.right = r + 'px'; c.style.bottom = b + 'px'; } }
  else { const [r, b] = frCardClamp(c, +p.r, +p.b); c.style.right = r + 'px'; c.style.bottom = b + 'px'; }
  frCardKb(); FR.rk = ''; }
function frCardFold(on) { const c = document.getElementById('fr_card'); if (!c) return; const a = document.activeElement; if (on && a && c.contains(a)) try { a.blur(); } catch (e) {} c.classList.toggle('fold', !!on); frLS(FR_CARD_FOLD, on ? '1' : null); frCardPlace(c); setTimeout(() => { if (typeof frTick === 'function') frTick(); }, 30); }
/* 머리줄(또는 접힌 알약)을 잡고 끌기 — 손가락·마우스 · 입력 칸·단추를 누를 땐 끌기 아님(알약은 5px 넘게 움직여야 끌기 · 아니면 펼치기) */
function frCardDragBind(c) { let d = null;
  c.addEventListener('pointerdown', (e) => { const h = e.target.closest && e.target.closest('[data-frhd],.fr-pill'); if (!h || (e.button && e.button !== 0)) return; if (e.target.closest('button') && !e.target.closest('.fr-pill')) return; const q = c.getBoundingClientRect(); d = { id: e.pointerId, x: e.clientX, y: e.clientY, r0: innerWidth - q.right, b0: innerHeight - q.bottom, on: 0, h }; try { h.setPointerCapture(e.pointerId); } catch (x) {} });
  c.addEventListener('pointermove', (e) => { if (!d || e.pointerId !== d.id) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.on && Math.hypot(dx, dy) < 5) return; d.on = 1; e.preventDefault(); const [r, b] = frCardClamp(c, d.r0 - dx, d.b0 - dy); c.style.right = r + 'px'; c.style.bottom = b + 'px'; FR.rk = ''; });
  const up = (e) => { if (!d || (e.pointerId != null && e.pointerId !== d.id)) return; try { d.h.releasePointerCapture(d.id); } catch (x) {} if (d.on) { const q = c.getBoundingClientRect(); frLS(FR_CARD_POS, JSON.stringify({ r: Math.round(innerWidth - q.right), b: Math.round(innerHeight - q.bottom) })); c._dragAt = performance.now(); setTimeout(() => { if (typeof frTick === 'function') frTick(); }, 30); } d = null; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); }
/* 자판이 올라오면(휴대폰) 코드 칸이 보이게 카드를 자판 위로 · 내려가면 제자리 */
function frCardKb() { const c = document.getElementById('fr_card'); const vv = window.visualViewport; if (!c || !vv) return; const a = document.activeElement; const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop); if (a && a.id === 'fr_code' && kb > 60) { const b = parseFloat(c.style.bottom) || 0; if (b < kb + 8) { c.dataset.kbb = '1'; c.style.bottom = Math.round(kb + 8) + 'px'; } try { a.scrollIntoView({ block: 'nearest' }); } catch (e) {} } else if (c.dataset.kbb) { delete c.dataset.kbb; frCardPlace(c); } }
try { if (window.visualViewport) { visualViewport.addEventListener('resize', frCardKb); visualViewport.addEventListener('scroll', frCardKb); } } catch (e) {}
addEventListener('resize', () => { if (!(document.getElementById('fr_card') || {}).dataset || !document.getElementById('fr_card').dataset.kbb) frCardPlace(); });
document.addEventListener('focusin', (e) => { if (e.target && e.target.id === 'fr_code') setTimeout(frCardKb, 350); });
function frCodeGo() { const i = document.getElementById('fr_code'); const v = String((i && i.value) || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 8) { if (i) { i.style.borderColor = '#B0322A'; i.title = '연결 코드는 8자리(예: ABCD-EFGH)'; } return; } FR.xch = 1; frExchange({ code: v }); }
/* ⚙ 창 아래 칸: 이 프로그램 · 연결 끊기 */
function frPanHtml() { let P = null; try { P = JSON.parse(frLS('rn-fr-paired') || 'null'); } catch (e) {}
  return `<h3 style="margin-top:12px">🖥 이 화면 <small class="hint">화면(책방 친구) ${esc(frFV())} · ${esc(frHostType() === 'web' ? '브라우저 탭' : frHostType() === 'tauri' ? 'PC 프로그램 ' + (((window.__rnFriendHost || {}).ver) || '?') : '안드로이드 앱 ' + (((window.__rnFriendHost || {}).ver) || '?'))}</small></h3>${frHostType() === 'tauri' ? `<p class="hint" id="fr_hitst" style="margin:0 0 6px;font-size:11.5px;word-break:keep-all">🖱 클릭 판정: 읽는 중…</p>${(setTimeout(frHitFill, 30), '')}` : ''}<p class="hint" style="margin:0 0 6px">기기 <b>${esc(deviceName())}</b> · ${esc((S.user && S.user.email) || '')}${P && P.at ? ` · 연결 ${esc(P.at.slice(0, 16).replace('T', ' '))}` : ''}</p>
  ${frHostType() !== 'web' ? `<button type="button" class="btn ghost sm" data-frout="1" title="이 프로그램의 로그인을 지움 — 두 번 눌러 확정 · 다시 쓰려면 웹앱에서 다시 연결">🔌 연결 끊기(로그아웃)</button>` : ''}`; }
document.addEventListener('click', (e) => { const o = e.target && e.target.closest && e.target.closest('[data-frout]'); if (!o) return; e.preventDefault(); qrArm(o, async () => { await frBeat(true); frLS('rn-fr-paired', null); frLS('rn-device', null); try { await firebase.auth().signOut(); } catch (x) {} frPost('signout', null); location.replace(location.pathname + location.search); }); });
/* 시작(index.html 맨 끝에서 부름) */
function RNF_START() { document.documentElement.classList.add('rn-friend'); firebase.auth().onAuthStateChanged((u) => frAuth(u));
  /* (P5) 이미 열린 화면에 연결 링크가 오면(주소 끝 #pair=…만 바뀌어 다시 읽지 않음 — 안드로이드 loadUrl·예전 PC 판) 바로 연결 */
  addEventListener('beforeunload', () => { FR.leaving = 1; }); /* 다시 읽는 중이면 해시 연결은 새 화면이 함 */
  addEventListener('hashchange', () => setTimeout(() => { if (FR.leaving || !frPairArgs()) return; FR.xch = 0; frAuth(S.user || (firebase.auth().currentUser || null)); }, 250));
  if (FR.win === 'set' || !frHost()) return;
  frPosLoad(); frTickArm(); frPost('need_geom', null); frMoveBind(); frGearBind(); }
/* ══ (P5 · 프로그램 0.2.0) 캐릭터 자리 옮기기 · 캐릭터 옆 ⚙ ══
 *  자리: 캐릭터 무리(캐릭터·말풍선·🐾·⚙·💬)를 기본 자리(오른쪽 아래)에서 [dx, dy] CSS px 옮김(margin) — 투명 창은 모니터 작업 영역 전체라 모니터 안에서는 화면이 옮기고,
 *        끄는 포인터가 다른 모니터로 넘어가면 프로그램이 창을 그 모니터로 옮긴 뒤 drag_to로 포인터 자리를 알려 줌 · 놓으면 win_drag end → 프로그램이 모니터 이름·자리·배율을 기기별 friend.json에 저장
 *  Ctrl+끌기 = 자리 옮기기(몸 어디든) · 그냥 끌기 = 예전 그대로 손·발 끌기 몸짓 */
const FR_POS_KEY = 'rn-fr-pos';
const FR_CL_SEL = '#msc_ch,#msc_ico,#msc_gear,#msc_msgbtn';
function frShellAtLeast(v) { const h = window.__rnFriendHost; const s = String((h && h.ver) || '0').replace(/^[^0-9]*/, '').split('.').map((x) => parseInt(x, 10) || 0); const t = v.split('.').map((x) => +x); for (let i = 0; i < 3; i++) { if ((s[i] || 0) !== t[i]) return (s[i] || 0) > t[i]; } return true; }
function frPosApply() { const st = document.documentElement.style; st.setProperty('--fr-mx', -Math.round(FR.pos[0]) + 'px'); st.setProperty('--fr-my', -Math.round(FR.pos[1]) + 'px'); }
function frPosClamp(p) { const vw = innerWidth, vh = innerHeight; let L = Infinity, T = Infinity, Rr = -Infinity, B = -Infinity;
  document.querySelectorAll(FR_CL_SEL).forEach((el) => { const q = el.getBoundingClientRect(); if (!q.width || !q.height) return; L = Math.min(L, q.left - FR.pos[0]); T = Math.min(T, q.top - FR.pos[1]); Rr = Math.max(Rr, q.right - FR.pos[0]); B = Math.max(B, q.bottom - FR.pos[1]); });
  if (!Number.isFinite(L)) { L = vw - 200; T = vh - 300; Rr = vw - 8; B = vh - 8; } /* 아직 캐릭터가 없으면 대강(오른쪽 아래 200×300) */
  const m = 4; return [Math.round(Math.max(m - L, Math.min(vw - m - Rr, +p[0] || 0))), Math.round(Math.max(m - T, Math.min(vh - m - B, +p[1] || 0)))]; } /* 캐릭터 무리가 창(모니터) 밖으로 나가지 않게 */
function frPosSet(p, fromHost) { FR.pos = [+p[0] || 0, +p[1] || 0]; frPosApply(); if (!fromHost) frLS(FR_POS_KEY, JSON.stringify({ dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1, at: new Date().toISOString() })); FR.rk = ''; }
function frPosLoad() { let v = null; try { v = JSON.parse(frLS(FR_POS_KEY) || 'null'); } catch (e) {} if (v && Number.isFinite(+v.dx) && Number.isFinite(+v.dy)) { const k = (+v.dpr || 1) / (window.devicePixelRatio || 1); FR.pos = [v.dx * k, v.dy * k]; } frPosApply(); setTimeout(() => { if (!(FR.drag && FR.drag.on)) { FR.pos = frPosClamp(FR.pos); frPosApply(); } }, 1500); } /* 프로그램이 geom으로 자리를 주면 그것이 먼저(예전 0.1.x 판은 이 기기 저장소 값) */
function frDragAt(x, y) { const d = FR.drag; if (!d) return; FR.pos = frPosClamp([x - d.gx - innerWidth, y - d.gy - innerHeight]); frPosApply(); }
function frMoveBind() {
  const end = (e, why) => { const d = FR.drag; if (!d || (e && e.pointerId != null && e.pointerId !== d.id)) return; FR.drag = null; document.documentElement.classList.remove('fr-moving'); try { d.el.releasePointerCapture(d.id); } catch (x) {}
    if (!d.on) return; FR.noClick = performance.now(); frPosSet(frPosClamp(FR.pos)); frPost('win_drag', { phase: 'end', x: Math.round(d.lx), y: Math.round(d.ly), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1, vw: innerWidth, vh: innerHeight, why: why || 'up' }); FR.rk = ''; frTick();
    try { toast('🐾 캐릭터 자리를 기억했어요(이 PC · 이 모니터)'); } catch (x) {} };
  addEventListener('pointerdown', (e) => { if (!e.ctrlKey || (e.button && e.button !== 0) || FR.hidden) return; if (!frOnChar(e.clientX, e.clientY) && !(e.target && e.target.closest && e.target.closest('#msc_ch'))) return; const ch = document.documentElement;
    e.stopPropagation(); e.preventDefault(); /* 손·발 끌기(mscDragBind)보다 먼저 가로챔 */
    FR.drag = { id: e.pointerId, el: ch, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, gx: e.clientX - (innerWidth + FR.pos[0]), gy: e.clientY - (innerHeight + FR.pos[1]), on: 0, mt: 0, at: performance.now() }; try { ch.setPointerCapture(e.pointerId); } catch (x) {} }, true);
  addEventListener('pointermove', (e) => { const d = FR.drag; if (!d || e.pointerId !== d.id) return; e.stopPropagation(); if (e.pointerType === 'mouse' && e.buttons === 0) return end(e, 'nobtn'); /* 창 밖에서 손을 뗐음 */ d.lx = e.clientX; d.ly = e.clientY; d.at = performance.now();
    if (!d.on) { if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return; d.on = 1; document.documentElement.classList.add('fr-moving'); FR.rk = ''; frTick(); frPost('win_drag', { phase: 'start', x: Math.round(d.sx), y: Math.round(d.sy), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1, vw: innerWidth, vh: innerHeight }); }
    frDragAt(e.clientX, e.clientY); const now = performance.now(); if (now - d.mt > 40) { d.mt = now; frPost('win_drag', { phase: 'move', x: Math.round(e.clientX), y: Math.round(e.clientY), dx: FR.pos[0], dy: FR.pos[1], dpr: window.devicePixelRatio || 1 }); } }, true);
  FR.dragEnd = end; addEventListener('pointerup', (e) => end(e, 'up'), true); addEventListener('pointercancel', (e) => end(e, 'cancel'), true); addEventListener('lostpointercapture', (e) => end(e, 'lost'), true);
  addEventListener('click', (e) => { if (FR.noClick && performance.now() - FR.noClick < 400) { e.stopPropagation(); e.preventDefault(); } }, true); /* 옮기고 손을 뗄 때 생기는 click은 머리·배 눌림으로 치지 않음 */
  addEventListener('keydown', (e) => { if (e.key === 'Control') document.documentElement.classList.add('fr-ctrl'); }); addEventListener('keyup', (e) => { if (e.key === 'Control') document.documentElement.classList.remove('fr-ctrl'); }); addEventListener('blur', () => document.documentElement.classList.remove('fr-ctrl'));
  addEventListener('resize', () => { if (!(FR.drag && FR.drag.on)) { FR.pos = frPosClamp(FR.pos); frPosApply(); } }); }
/* 캐릭터 옆 ⚙(캐릭터에 마우스를 올리면 나타남 · 캐릭터 상자 바깥 왼쪽 위라 손·발 끌기와 안 겹침): PC 프로그램 0.2.0 이상 = 설정 창(새 창) · 그 밖 = 같은 화면 안 설정(예전 그대로) */
function frSettingsOpen() { if (frHostType() === 'tauri' && frShellAtLeast('0.2.0') && frPost('open_settings', { toggle: true })) { try { toast(frShellAtLeast('0.2.1') ? '⚙ 설정 창 — 한 번 더 누르면 닫혀요' : '⚙ 설정 창을 열어요'); } catch (e) {} return true; } try { mscPanel(!document.getElementById('msc_ov')); } catch (e) {} return false; } /* (r16) 다시 누르면 닫힘(PC 프로그램 0.2.1부터 설정 창도) */
function frOnChar(x, y) { const ch = document.getElementById('msc_ch'); if (!ch) return false; const q = ch.getBoundingClientRect(); return q.width > 0 && x >= q.left + q.width * 0.12 && x <= q.right - q.width * 0.12 && y >= q.top && y <= q.bottom; } /* 캐릭터 몸(상자 가운데 76% · 눌리는 칸과 같은 폭) 위인가 */
function frGearBind() { let g = null, tm = 0, mt = 0;
  const place = () => { const ch = document.getElementById('msc_ch'); if (!ch || !g) return false; const q = ch.getBoundingClientRect(); if (!q.width) return false; const s = 30; let x = q.left + q.width * 0.12 - s - 2; if (x < 4) x = q.right - q.width * 0.12 + 2; g.style.left = Math.round(Math.min(innerWidth - s - 4, x)) + 'px'; g.style.top = Math.round(Math.max(4, q.top + q.height * 0.04)) + 'px'; return true; };
  const show = () => { if (FR.hidden || (FR.drag && FR.drag.on)) return; if (!g) { g = document.createElement('button'); g.id = 'msc_frgear'; /* id가 msc_로 시작 = 캐릭터 것(캐릭터가 이 단추를 장애물로 보고 비켜 가지 않게 · mscAvOwn) */ g.type = 'button'; g.className = 'fr-hgear'; g.textContent = '⚙'; g.title = '책방 친구 설정 — PC 프로그램은 설정 창(새 창)으로 · Ctrl을 누른 채 캐릭터를 끌면 자리 옮기기';
      g.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); frSettingsOpen(); }); g.addEventListener('pointerenter', () => { clearTimeout(tm); tm = 0; }); g.addEventListener('pointerleave', hideSoon); document.body.appendChild(g); }
    if (!place()) return; clearTimeout(tm); tm = 0; if (g.style.display !== 'flex') { g.style.display = 'flex'; FR.rk = ''; frTick(); } };
  FR.gearPlace = () => { if (g && g.style.display === 'flex') place(); }; /* 캐릭터가 비켜 가면(장애물 피하기) ⚙도 따라감 — frTick(250ms)이 부름 */
  const hideSoon = () => { clearTimeout(tm); tm = setTimeout(() => { tm = 0; if (g) { g.style.display = 'none'; FR.rk = ''; frTick(); } }, 1800); };
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const now = performance.now(); if (now - mt < 80) return; mt = now; if (frOnChar(e.clientX, e.clientY)) show(); else if (g && g.style.display === 'flex' && !(e.target && e.target.closest && e.target.closest('#msc_frgear'))) { if (!tm) hideSoon(); } }, { passive: true }); /* 캐릭터에 마우스를 올리면 나타나고 · 떠나면 1.8초 뒤 사라짐 */
  document.documentElement.addEventListener('pointerleave', () => { if (g && g.style.display === 'flex') hideSoon(); });
  /* 구석 ⚙(#msc_gear)도 PC 프로그램 0.2.0 이상이면 설정 창으로 */
  document.addEventListener('click', (e) => { const o = e.target && e.target.closest && e.target.closest('#msc_gear'); if (!o || !(frHostType() === 'tauri' && frShellAtLeast('0.2.0'))) return; e.preventDefault(); e.stopImmediatePropagation(); frSettingsOpen(); }, true); }
