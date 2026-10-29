/* readnow-friend-boot.js — 🐾 책방 친구 혼자 도는 화면(friend/index.html)의 바탕 (웹앱 안에서는 쓰지 않음)
 *  ① readnow-friend.js(캐릭터 본체)가 빌려 쓰는 것을 아주 작게 만듦: db · S · esc · toast · deviceName · isAdminDevice · IS_PHONE · Q_DONE · todayStr · num · won · ALERT_DOC · alShipCX · openShip · openAlert
 *  ② 로그인: 같은 주소(jerrycson.github.io)의 크롬 탭이면 웹앱 로그인을 그대로 씀 · 바깥 프로그램(윈도우 Tauri · 안드로이드)은 처음 한 번 연결 표/코드 → 클라우드 /friend-token → 같은 계정 로그인 열쇠 → 그 뒤엔 프로그램 안 저장소에 남아 저절로
 *  ③ 알림 재료(작은 것만): 주문확인요청 문서 하나(shp_state/confirm) · 지금부터 올라오는 문의·구매평(crm_interactions) · 사업 알림 요약 문서 하나(app_summary/alerts — 웹앱 대표 탭이 씀)
 *  ④ 프로그램 다리: 살아 있음 신호(app_settings/fhost_<기기> 30초) · 눌리는 칸(rects) 알리기 · 프로그램 명령(window.__rnFriendCmd) · 연결 카드
 *  프로그램 다리 약속: 프로그램이 window.__rnFriendHost = {type:'tauri'|'android', ver, post(kind, data)}를 줌(없으면 RnHostAndroid · __TAURI_INTERNALS__로 만듦)
 *   화면 → 프로그램 post: ready{dev,email,app} · rects{r:[[l,t,r,b]...] CSS px 화면 좌표, kb, vw, vh, dpr, sx, sy} · notify{id,title,text,hidden} · open{url} · paired{dev,email} · signout · byeok
 *   프로그램 → 화면 __rnFriendCmd(cmd, arg): geom{x,y,w,h,scale} · hide · show · bye(끄기 직전 → byeok) · esc */
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
const FR = { kind: FR_Q.get('host') || null, settings: FR_Q.get('settings') === '1', rk: '', rAt: 0, geom: null, hidden: false, booted: 0, xch: 0, card: null, cardArg: null, cardNo: null, since: null };
const FR_BEAT = 30e3;
const FR_CLOUD_DEF = 'https://readnow-cloud-63884079760.asia-northeast3.run.app'; /* Cloud Run 정해진 주소 꼴(서비스-프로젝트번호.지역.run.app · 비밀 아님) — 연결 링크에 실제 주소가 오면 그것이 먼저 */
const frKey = (d) => 'fhost_' + String(d || '').trim().toUpperCase().replace(/[\/\s.#$\[\]]+/g, '_').slice(0, 60); /* 웹앱 frwKey와 같은 규칙 */
const frLS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
function frHost() { const w = window; const h = w.__rnFriendHost; if (h && typeof h.post === 'function') return h;
  if (w.RnHostAndroid && typeof w.RnHostAndroid.post === 'function') return (w.__rnFriendHost = { type: 'android', post: (k, d) => w.RnHostAndroid.post(String(k), JSON.stringify(d == null ? null : d)) });
  const ti = w.__TAURI_INTERNALS__; if (ti && typeof ti.invoke === 'function') return (w.__rnFriendHost = { type: 'tauri', post: (k, d) => { try { const p = ti.invoke('friend_post', { kind: String(k), data: d == null ? null : d }); if (p && p.catch) p.catch(() => {}); } catch (e) {} } });
  return null; }
const frHostType = () => { const h = frHost(); return (h && h.type) || FR.kind || 'web'; };
function frPost(k, d) { const h = frHost(); if (!h) return false; try { h.post(k, d); return true; } catch (e) { return false; } }
function frOpenUrl(u) { if (!frPost('open', { url: u })) try { window.open(u, '_blank', 'noopener'); } catch (e) {} }
/* 본체 고리 */
window.RNF_HOOKS = {
  go: (k) => frOpenUrl(RNF_APP() + (k === 'order' ? '?go=confirm' : k === 'qna' ? '?go=qna' : '')), /* 말풍선 '보기 ›' = 기본 브라우저로 웹앱 그 화면 */
  msg: (id, d) => { frPost('notify', { id, title: '💬 ' + String(((d && d.from) || {}).name || '책방 친구'), text: String((d && d.text) || '').slice(0, 200), hidden: FR.hidden ? 1 : 0 }); return false; }, /* 안드로이드 알림 · 화면에도 보임 */
  panHtml: () => frPanHtml(), widgetHtml: () => '' };
/* ── 로그인 ── */
function frPairArgs() { const h = new URLSearchParams(String(location.hash || '').replace(/^#/, '')); const t = h.get('pair'); const code = String(h.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return t ? { t, c: h.get('c'), d: h.get('d') } : code.length === 8 ? { code, c: h.get('c') } : null; } /* #pair=표(링크) · #code=8자리(안드로이드 앱 칸에서 친 코드) */
function frCloud(c) { const ok = (u) => /^https:\/\/[a-z0-9.-]+\.run\.app$/i.test(String(u || '')); if (ok(c)) return c.replace(/\/+$/, ''); const v = frLS('rn-friend-cloud'); return ok(v) ? v : FR_CLOUD_DEF; }
function frAuth(u) { const P = frPairArgs();
  if (P) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} if (!FR.xch) { FR.xch = 1; frExchange(P); } return; } /* 연결 표가 왔으면 먼저(이미 로그인돼 있어도 — 다른 기기 이름일 수 있음) */
  if (FR.xch === 2) return; if (!u) { S.user = null; return frCard('pair'); } if (!FR.booted) { FR.booted = 1; frBoot(u); } }
async function frExchange(arg) { const c = frCloud(arg.c); frCard('busy'); FR.xch = 2;
  try { const r = await fetch(c + '/friend-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arg.t ? { t: arg.t } : { code: arg.code }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok || !j.token || !j.dev) throw new Error(j.err || '클라우드 응답 ' + r.status);
    await firebase.auth().signInWithCustomToken(j.token); frLS('rn-device', String(j.dev)); frLS('rn-friend-cloud', c); frLS('rn-fr-paired', JSON.stringify({ at: new Date().toISOString(), dev: j.dev, email: j.email || null, host: frHostType() })); frLS('rn-fr-show', '1');
    frPost('paired', { dev: j.dev, email: j.email || null }); frCard('ok', j.dev); setTimeout(() => { try { location.replace(location.pathname + location.search); } catch (e) { location.reload(); } }, 600); /* 깨끗한 주소로 다시 열면 저장된 로그인으로 바로 */ }
  catch (e) { FR.xch = 0; frCard('err', (e && e.message) || String(e)); } }
function frBoot(u) { S.user = u; const dev = deviceName().trim(); if (!dev) return frCard('nodev'); S.devOk = true; /* 연결 때 받은 기기 이름 = 크롬 웹앱이 확인한 그 이름 */ frCard(null);
  try { db.collection('app_settings').doc('main').onSnapshot((d) => { const x = d.exists ? d.data() : {}; S.app = { ...x, adminDevices: x.adminDevices || [] }; }, () => {}); } catch (e) {} /* 관리자 기기·클라우드 주소만 씀 */
  try { mscBoot(); } catch (e) { console.warn('책방 친구 시작', e); } frFeeds(); frBeat(); setInterval(() => frBeat(), FR_BEAT); setInterval(frTick, 250); setInterval(frState, 1500);
  addEventListener('pagehide', () => frBeat(true)); document.addEventListener('focusin', frTick, true); document.addEventListener('focusout', () => setTimeout(frTick, 30), true);
  if (FR.settings) setTimeout(() => { try { mscPanel(true); } catch (e) {} }, 800);
  frPost('ready', { dev, email: u.email || null, app: RNF_VER }); }
/* 알림 재료 — 작은 문서만 */
function frFeeds() { try { db.collection('shp_state').doc('confirm').onSnapshot({ includeMetadataChanges: true }, (d) => { const fc = d.metadata.fromCache; if (fc && !d.exists) return; const nv = d.exists ? d.data() : { orders: [] }; S.shipC = nv; try { mscOrd(nv, fc); } catch (e) {} }, () => {}); } catch (e) {}
  try { db.collection('crm_interactions').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(Date.now() - 60e3)).onSnapshot((ss) => ss.docChanges().forEach((c) => { if (c.type !== 'removed') try { mscIx(c.doc.id, c.doc.data()); } catch (e) {} }), () => {}); } catch (e) {}
  /* (10/29 정범님 ②) 클라우드 바깥 알림: friend_say 문서 중 60초 안에 올라온 것 · 받는 기기(또는 all)만 말함 · 한 번 말한 문서는 다시 말하지 않음 */
  try { const seen = new Set(); db.collection('friend_say').where('uploadedAt', '>', firebase.firestore.Timestamp.fromMillis(Date.now() - 60e3)).onSnapshot((ss) => ss.docChanges().forEach((c) => { if (c.type !== 'added' || seen.has(c.doc.id)) return; seen.add(c.doc.id); const v = c.doc.data() || {}; if (v.to !== 'all' && v.to !== deviceName().trim()) return; try { mscExtSay(v.text, v.from); } catch (e) {} }), () => {}); } catch (e) {}
  try { db.collection('app_summary').doc('alerts').onSnapshot((d) => { const v = d.exists ? d.data() : null; if (!v || !Array.isArray(v.items)) return; S._alNow = new Map(v.items.map((x) => [x.k, x])); S._biz = v.T ? { T: v.T } : null; try { mscAlBiz(S._alNow); } catch (e) {} }, () => {}); } catch (e) {} }
/* 살아 있음 신호 · bye = 끄기 직전(웹앱 안에서 켠 크롬 캐릭터가 바로 돌아옴) */
async function frBeat(bye) { const dev = deviceName().trim(); if (!dev || !S.user) return; const now = new Date().toISOString(); if (!FR.since) FR.since = now;
  try { await db.collection('app_settings').doc(frKey(dev)).set({ dev, at: bye ? null : now, byeAt: bye ? now : null, since: FR.since, host: frHostType(), shell: (window.__rnFriendHost && window.__rnFriendHost.ver) || null, app: RNF_VER, by: (S.user && S.user.email) || null, hidden: !!FR.hidden }, { merge: true }); } catch (e) {} }
/* 눌리는 칸(rects): 화면 좌표(CSS px) [왼, 위, 오른, 아래] — 캐릭터는 머리 칸 + 몸 칸만(투명한 가장자리는 통과) · 그 밖의 body 바로 아래 보이는 것 전부(단추·말풍선·입력 줄·설정 창·메시지 캐릭터·연결 카드) */
function frRects() { const out = []; if (FR.hidden) return out; const vw = innerWidth, vh = innerHeight;
  const add = (l, t, r, b, pad) => { pad = pad || 0; l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(vw, r + pad); b = Math.min(vh, b + pad); if (r - l >= 1 && b - t >= 1) out.push([Math.round(l), Math.round(t), Math.round(r), Math.round(b)]); };
  const addEl = (el, pad) => { const q = el.getBoundingClientRect(); if (q.width && q.height) add(q.left, q.top, q.right, q.bottom, pad); };
  for (const el of document.body.children) { if (/^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) continue;
    if (el.id === 'msc_wrap') { const ch = el.querySelector('#msc_ch'); if (ch) { const q = ch.getBoundingClientRect(); if (q.width && q.height) { const sh = ch.dataset.view === 'full' ? { hw: 0.5, hh: 0.2, ix: 0.1 } : { hw: 0.46, hh: 0.4, ix: 0.12 }; add(q.left + q.width * (0.5 - sh.hw / 2), q.top, q.left + q.width * (0.5 + sh.hw / 2), q.top + q.height * sh.hh); add(q.left + q.width * sh.ix, q.top + q.height * sh.hh, q.right - q.width * sh.ix, q.bottom); } }
      el.querySelectorAll('.msc-bub').forEach((b) => addEl(b, 4)); continue; }
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none') continue; addEl(el, 2); }
  return out; }
/* 글 칸에 커서가 들어가면 창이 키보드를 받고(나오면 풀림) — 칸 밖으로 마우스가 나가도 입력이 끊기지 않게 */
document.addEventListener('focusin', (e) => { const t = e.target; if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) frPost('focus', { on: true }); });
document.addEventListener('focusout', (e) => { const t = e.target; if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) setTimeout(() => { const a = document.activeElement; if (!a || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) frPost('focus', { on: false }); }, 60); });
function frKb() { const a = document.activeElement; return !!((a && a !== document.body && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || document.querySelector('#msc_mbar,#msc_ov,#msc_cu,#msc_sh,#fr_card input')); } /* 안드로이드: 글 칸이 열려 있으면 창이 키보드를 받게 */
function frTick() { if (document.hidden || !frHost()) return; const r = frRects(); const kb = frKb(); const k = JSON.stringify(r) + kb + innerWidth + 'x' + innerHeight + '@' + (window.devicePixelRatio || 1); const now = Date.now(); if (k === FR.rk && now - FR.rAt < 5000) return; FR.rk = k; FR.rAt = now;
  frPost('rects', { r, kb, vw: innerWidth, vh: innerHeight, dpr: window.devicePixelRatio || 1, sx: window.screenX || 0, sy: window.screenY || 0 }); }
/* 캐릭터가 안 나오는 까닭을 카드로(범위 밖 · 캐릭터 안 고름) · 처음 연결이면 캐릭터 보이기 */
function frState() { if (!S.user || FR.card === 'pair' || FR.card === 'err' || FR.card === 'busy' || typeof M_ === 'undefined' || !M_.doc) return; const dev = mscDev(); if (!mscInScope()) return FR.cardNo === 'scope' ? null : frCard('scope', dev); const mine = mscMine();
  if (!mine.charId || !mscChar(mine.charId)) return FR.cardNo === 'nochar' ? null : frCard('nochar', dev); if (frLS('rn-fr-show') === '1') { frLS('rn-fr-show', null); if (!mscOpen()) try { mscSaveMe({ open: true }, '🐾 책방 친구 프로그램 — 캐릭터 보이기'); } catch (e) {} } if (FR.card === 'scope' || FR.card === 'nochar') frCard(null); }
window.__rnFriendCmd = function (cmd, arg) { if (cmd === 'geom') { FR.geom = arg || null; return true; }
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
    : kind === 'busy' ? '<h4>🔐 연결하는 중…</h4><p><small>클라우드에서 같은 계정의 로그인 열쇠를 받고 있어요(몇 초).</small></p>'
    : kind === 'ok' ? `<h4>✓ 연결됨 — 기기 ${esc(arg || '')}</h4><p><small>캐릭터를 불러와요. 다음부터는 켜기만 하면 저절로 로그인돼요.</small></p>`
    : kind === 'err' ? `<h4 class="bad">⚠ 연결 실패</h4><p class="bad">${esc(String(arg || '').slice(0, 220))}</p><p><small>${/지났|사용한|맞지 않음|코드/.test(String(arg)) ? '웹앱에서 연결 단추를 다시 눌러 새 코드를 받아 주세요.' : /권한|열쇠|IAM/i.test(String(arg)) ? '클라우드 권한 준비가 필요해요 — 웹앱 설명서 › 🖥 책방 친구 프로그램 › 처음 한 번(클라우드) 참고.' : '인터넷 연결을 확인하고 다시 해 보세요.'}</small></p>${codeRow}`
    : kind === 'nodev' ? `<h4>🐾 이 프로그램에 기기 이름이 없어요</h4><p><small>웹앱에서 연결 단추를 다시 눌러 주세요(그 크롬의 기기 이름을 함께 받아요).</small></p>${how}${codeRow}`
    : kind === 'scope' ? `<h4>🐾 이 기기(${esc(arg || '')})는 켜는 범위 밖이에요</h4><p><small>관리자 기기의 🐾 ⚙ 책방 친구 설정 › ② 관리자 설정 › <b>켜는 범위</b>에 이 기기 이름을 넣으면 바로 캐릭터가 나와요.</small></p>`
    : kind === 'nochar' ? `<h4>🐾 아직 캐릭터를 고르지 않았어요</h4><p><small>오른쪽 아래 <b>🐾</b>를 눌러 내 이름·캐릭터를 고르면 나와요.</small></p>` : '';
  /* (10/29 급한 일 · 정범님 23:31 휴대폰) 머리줄 = 잡고 끌어 옮김 · ▾ 접기(작은 알약만) · 닫을 수 있는 카드는 ✕ — 자리·접힘은 이 기기에 기억 */
  c.innerHTML = `<div class="fr-hd" data-frhd="1" title="잡고 끌면 옮겨져요 · ▾ = 접기"><span class="grip" aria-hidden="true">⠿</span><b>🐾 책방 친구</b><span class="sp"></span><button type="button" class="hb" data-frfold="1" title="접기 — 작은 단추만 남겨요(누르면 다시 펼침)" aria-label="접기">접기 ▾</button>${kind === 'scope' || kind === 'nochar' ? '<button type="button" class="hb" data-frx="1" title="닫기" aria-label="닫기">✕</button>' : ''}</div><div class="fr-bd">${body}</div><button type="button" class="fr-pill" data-frunfold="1" title="눌러서 펼치기 · 끌어서 옮기기">${pill}</button>`;
  c.classList.toggle('fold', frLS(FR_CARD_FOLD) === '1'); frCardPlace(c);
  FR.rk = ''; if ((kind === 'pair' || kind === 'err' || kind === 'nodev') && !c.classList.contains('fold') && !frNarrow()) setTimeout(() => { const i = document.getElementById('fr_code'); if (i) try { i.focus(); } catch (e) {} }, 50); /* 휴대폰은 저절로 커서를 넣지 않음(자판이 바로 올라와 화면을 덮지 않게) */ setTimeout(frTick, 30); }
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
  return `<h3 style="margin-top:12px">🖥 이 화면 <small class="hint">책방 친구 ${esc(RNF_VER)} · ${esc(frHostType() === 'web' ? '브라우저 탭' : frHostType() === 'tauri' ? 'PC 프로그램' : '안드로이드 앱')}</small></h3><p class="hint" style="margin:0 0 6px">기기 <b>${esc(deviceName())}</b> · ${esc((S.user && S.user.email) || '')}${P && P.at ? ` · 연결 ${esc(P.at.slice(0, 16).replace('T', ' '))}` : ''}</p>
  ${frHostType() !== 'web' ? `<button type="button" class="btn ghost sm" data-frout="1" title="이 프로그램의 로그인을 지움 — 두 번 눌러 확정 · 다시 쓰려면 웹앱에서 다시 연결">🔌 연결 끊기(로그아웃)</button>` : ''}`; }
document.addEventListener('click', (e) => { const o = e.target && e.target.closest && e.target.closest('[data-frout]'); if (!o) return; e.preventDefault(); qrArm(o, async () => { await frBeat(true); frLS('rn-fr-paired', null); frLS('rn-device', null); try { await firebase.auth().signOut(); } catch (x) {} frPost('signout', null); location.replace(location.pathname + location.search); }); });
/* 시작(index.html 맨 끝에서 부름) */
function RNF_START() { document.documentElement.classList.add('rn-friend'); firebase.auth().onAuthStateChanged((u) => frAuth(u)); }
