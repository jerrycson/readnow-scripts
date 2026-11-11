/* col2-y24.js — 🟦 번외 수집기 예스24 판매관리 읽기 (정범님 11/09 밤 '예스24 — 이 화면을 수동으로 열거나 어찌되었든 열어야 되는 거잖아? 지금 바로 번외 수집기로 편입 · 화면 자체를 열지 않는 방식으로')
 * 예전: 정범님 크롬에 예스24 판매관리('리드나우 연결' 창)를 열어 두어야 그 창이 응답을 가로채 모으고 주문을 5분마다 다시 읽었음(수집기 rnY24 덩어리)
 * 지금: 번외 도우미가 따로 된 크롬 프로필(col2-y24-chrome · 확장 없음 · Tampermonkey 없음 · 화면 밖 · 작업 표시줄에서 숨김)로 uscm.yes24.com 로그인 세션을 지니고
 *   ① 판매관리 API(/api/…)를 그 탭 안에서 직접 부름 — 조건 모양(주소·보낸 값)과 머리글은 그 탭이 화면을 열고 [조회]를 누를 때 보낸 그대로 배워 씀(DevTools 프로토콜 Network 이벤트)
 *      · 머리글·출입 값은 메모리에만(파일·Firebase에 안 남김) · 조건 모양 파일(y24-tpl.json)엔 주소·보낸 값만
 *      · 401·JSON 아님 → 그 화면을 숨은 탭에서 다시 열고 [조회]만 눌러(읽기) 새 머리글을 배운 뒤 한 번 더 → 그래도 로그인 화면이면 '로그인 필요'(옆 창 알림)
 *   ② 받은 응답은 탭이 받은 그대로(Network.getResponseBody) 수집기와 같은 꼴 {sig,url,page,at,status,ctype,req,json,body}로 줄에 쌓음(메모리만 · 200개·6MB)
 *      → 이 PC 리드나우 수집기(알라딘 일하는 탭)가 10초마다 받아(/y24/feed) 예전과 같은 줄(rn-y24q)에 넣고, 같은 올리기 함수(y24UpOne)로 y24_probe·y24_raw·crm_y24_raw에 올림
 *      → 이 도우미는 Firestore에 아무것도 쓰지 않음(쓰기 막이 col2_* 그대로) · 줄마다 이름표(id)가 있어 두 번 넣지 않음
 *   ③ 맡긴 일(주문접수확인·발송처리)도 이 탭에서 — 운영 수집기의 같은 함수(y24Act·y24Check · readnow-pc-helper.js ◆y24Act 덩어리를 그대로 받아 씀) · 첫 건 '확인 후 실행'은 이 크롬 창을 앞으로 꺼내 [▶ 이대로 실행]
 *      · 같은 일 두 번 안 함(y24-jdone.json) · 같은 송장번호를 다른 주문에 두 번 안 씀(y24-inv.json · 약속 10)
 * 지킴: 로거 PC에서는 하지 않음(약속 0 — 로거엔 계정·쿠키 금지) · 🚚 출고 중(수집기가 알려 준 출고 보호 hold.on)엔 멈춤(약속 0-1) · 수집기 탭이 안 보이면(받아 올릴 곳 없음) 읽지 않음
 *       · 누르는 단추는 '조회·검색'뿐(저장·등록·발송·처리·삭제·취소… 은 이름이 보이면 안 누름 — 맡긴 일 함수만 제 단추 하나) · 화면 사이 사람 속도(2~4초 · 둘러보기 8~20초)
 *       · 아이디·비밀번호는 저장하지 않음(정범님이 그 창에 직접 입력 · 크롬 비밀번호 저장도 끔) — 브라우저 세션(쿠키)만 이 프로필 폴더에 */
'use strict';
const fs = require('fs'), path = require('path');
/* (11/10) 로그인 뒤 곧 다시 풀린 때(drops) 3시간 안 n번(기본 3 · 0이면 끔 · col2.json y24cfg.ppN)이면 스스로 다시 로그인 멈춤 */
const ppStop = (drops, t, n) => { n = n == null ? 3 : +n; return n > 0 && (drops || []).filter((x) => t - x < 3 * 3600e3).length >= n; };
const SAFE = /^\s*(조회|검색|조회하기|검색하기|찾기)\s*$/;
const DANGER = /저장|등록|발송|처리|삭제|취소|승인|출금|신청|확인|답변|수정|변경|전송|보내|접수|결제|환불|판매불가|중지|연장|적용|일괄/;
const SECRET = /login|logout|passw|pwd|auth|cert|token|member\/(info|modify)|sellerinfo/i; /* 수집기 rnY24와 같음 — 원문을 남기지 않는 길 */
const ORD_KINDS = ['NewOrderConfirmList', 'OrderDeliveryList'];
const JPATH = { ship: '/Order/OrderDeliveryList', ack: '/Order/NewOrderConfirmList' };
const KIND_RE = /\/api\/(Order\/(NewOrderConfirmList|OrderDeliveryList)|Product\/(ProductList))(?:\?|$)/i;
const pageOf = (api) => { const m = String(api || '').match(/\/api\/([^/]+)\/([^/?]+)/i); return m ? '/' + m[1] + '/' + m[2] : '/'; };
/* 날짜 조건이 들어 있으면 끝 날짜를 오늘로(기간 길이는 그대로) — 수집기 rnY24 ordShift와 같은 셈 */
function ordShift(T, nowMs) { let o = null, isJ = false; try { o = JSON.parse(T.b); isJ = o && typeof o === 'object'; } catch (e) {} if (!isJ) o = Object.fromEntries(new URLSearchParams(T.b || '')); const ks = Object.keys(o); const dk = (re) => ks.find((k) => re.test(k) && /^\d{4}-?\d{2}-?\d{2}/.test(String(o[k] || '')));
  const kS = dk(/(FROM|START|STRT|BEGIN|^S_?|_S_|SDATE|ST_?DT|FR_?DT)/i), kE = dk(/(TO$|_TO_|END|^E_?|_E_|EDATE|ED_?DT)/i);
  if (kS && kE && kS !== kE) { const p = (v) => { const m = String(v).match(/^(\d{4})-?(\d{2})-?(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; }; const a = p(o[kS]), z = p(o[kE]);
    if (a != null && z != null && z >= a) { const dash = /-/.test(String(o[kE])); const f = (t) => { const d = new Date(t); const y = d.getUTCFullYear(), mm = String(d.getUTCMonth() + 1).padStart(2, '0'), dd = String(d.getUTCDate()).padStart(2, '0'); return dash ? `${y}-${mm}-${dd}` : `${y}${mm}${dd}`; }; const k0 = new Date((nowMs || Date.now()) + 9 * 3600e3); const today = Date.UTC(k0.getUTCFullYear(), k0.getUTCMonth(), k0.getUTCDate()); o[kE] = f(today); o[kS] = f(today - (z - a)); } }
  return { body: isJ ? JSON.stringify(o) : new URLSearchParams(o).toString(), isJ }; }
/* 화면이 마지막으로 스스로 보낸 /api/ 머리글로 바꿔 보냄(수집기 hdrFresh와 같음) · 브라우저가 스스로 붙이는 머리글은 뺌 */
const NOHDR = /^(cookie|host|content-length|origin|referer|connection|accept-encoding|user-agent|sec-|:)/i;
function hdrFresh(h0, last) { const h = {}; for (const [k, v] of Object.entries(h0 || {})) if (!NOHDR.test(k)) h[k] = v; if (last) for (const [k, v] of Object.entries(last)) { if (/^content-type$/i.test(k) || NOHDR.test(k)) continue; for (const k0 of Object.keys(h)) if (k0.toLowerCase() === k.toLowerCase()) delete h[k0]; h[k] = v; } return h; }
/* 메뉴 목록(POST /api/Menu/GetMenus) → [{path,name,grp}] — 수집기 rnY24 pickMenus와 같음 */
function pickMenus(j) { const find = (v, d) => { if (d > 5 || !v) return null; if (Array.isArray(v) && v.length && typeof v[0] === 'object' && Object.keys(v[0]).some((k) => /path|url/i.test(k))) return v; if (typeof v === 'object') for (const x of Object.values(v)) { const f = find(x, d + 1); if (f) return f; } return null; }; const a = find(j, 0); if (!a) return null;
  const k0 = Object.keys(a[0]); const kU = k0.find((k) => /path/i.test(k)) || k0.find((k) => /url/i.test(k)); const kN = k0.find((k) => /menu_?(nm|name)$/i.test(k)) || k0.find((k) => /nm$|name/i.test(k)); const kI = k0.find((k) => /^menu_?id$/i.test(k)); const kP = k0.find((k) => /^p_?menu_?id$|parent|upper/i.test(k)); const P = a.map((x) => String(x[kU] || '').toLowerCase());
  return a.map((x) => { const p = String(x[kU] || ''); const lp = p.toLowerCase(); const grp = (kI && kP && a.some((y) => String(y[kP] ?? '') !== '' && String(y[kP]) === String(x[kI]))) || (/^\/[^/]+$/.test(lp) && P.some((q) => q.startsWith(lp + '/'))); return { path: p, name: String(x[kN] || ''), grp: !!grp }; }).filter((x) => x.path && x.path.startsWith('/') && !/logout|login|passw|pwd|withdraw|출금/i.test(x.path + x.name)); }
const y24Cnt = (j) => { try { let tc = null, mx = -1; const f = (v, d) => { if (d > 4 || !v || typeof v !== 'object') return; if (Array.isArray(v)) { mx = Math.max(mx, v.length); if (v[0] && typeof v[0] === 'object') f(v[0], d + 1); return; } for (const [k, x] of Object.entries(v)) { if (tc == null && /^(total_?(count|cnt)|tot_?cnt)$/i.test(k) && x !== '' && x != null && isFinite(+x)) tc = +x; f(x, d + 1); } }; f(j, 0); return tc != null ? tc : mx >= 0 ? mx : null; } catch (e) { return null; } };
/* 운영 수집기의 맡긴 일 함수 덩어리(◆y24Act 시작 ~ ◆y24Act 끝)를 글 그대로 잘라 냄 — 이 탭(화면 쪽 칸)에서 그대로 돌림 */
function cutAct(src) { const a = String(src || '').indexOf('/* ◆y24Act 시작'); const b = String(src || '').indexOf('/* ◆y24Act 끝 */'); if (a < 0 || b < a) return null; const s = src.slice(a, b); return /async function y24Act\(/.test(s) && /async function y24Check\(/.test(s) ? s : null; }

/* 화면 쪽 짧은 코드(그 탭에서 Runtime.evaluate) */
const JS_STATE = `(()=>({h:location.hostname,p:location.pathname,pw:!!document.querySelector('input[type=password]'),rs:document.readyState}))()`;
const JS_CLICK = (ms) => `(async()=>{const SAFE=${SAFE},DANGER=${DANGER};const vis=(b)=>{try{return b.offsetParent!==null}catch(e){return false}};const t0=Date.now();
for(;;){const lg=/login/i.test(location.pathname)||!!document.querySelector('input[type=password]');if(lg)return{login:true};
let busy=false;try{const lb=document.getElementById('loading-bg');const cs=lb&&getComputedStyle(lb);busy=!!cs&&cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity!==0}catch(e){}
const L=[...document.querySelectorAll('button,a,input[type=button],input[type=submit]')].filter((b)=>{const t=(b.innerText||b.value||'').trim();return SAFE.test(t)&&!DANGER.test(t)&&vis(b)});
if(document.readyState==='complete'&&!busy&&L.length){L[0].click();return{clicked:true,n:L.length}}
if(Date.now()-t0>${ms})return{clicked:false};await new Promise((r)=>setTimeout(r,200))}})()`;

function makeY24(o) { let REG = null, W = null;
  const { HOME, Browser, WIN, note, log, TEST } = o; const cfg = () => o.cfg(); const now = () => Date.now();
  const BASE = (TEST && process.env.RN_COL2_Y24 ? process.env.RN_COL2_Y24 : 'https://uscm.yes24.com').replace(/\/$/, ''); const HOST = new URL(BASE).host;
  const MARK = 'col2-y24-chrome'; const PROF = path.join(HOME, MARK);
  const TPL_F = path.join(HOME, 'y24-tpl.json'), JD_F = path.join(HOME, 'y24-jdone.json'), INV_F = path.join(HOME, 'y24-inv.json');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }; const wr = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (e) { log('예스24 파일 저장 실패: ' + e.message); } };
  const SC = TEST && +process.env.RN_COL2_Y24_SCALE > 0 ? +process.env.RN_COL2_Y24_SCALE : 1; /* 시험만 기다림을 줄임 — 실제는 1(사람 속도 그대로) */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const sleepR = (a, b) => sleep((a + Math.random() * (b - a)) * SC);
  const Y = { br: null, launching: null, login: 'unknown', loginAt: 0, loginMsg: '', loginWait: 0, shown: false, busy: false, msg: '', tpl: {}, hdr: null, learnK: null, calling: false, q: [], qBytes: 0, drop: 0, sentN: 0, recN: 0, seq: 0,
    ord: { at: 0, n: 0, err: null, next: 0, renewAt: 0 }, prd: { at: 0, n: 0, pages: 0, err: null, on: false, next: 0 }, tour: null, tourNext: 0, menus: null, keepAt: 0,
    feed: { at: 0, cfg: null, hold: null, by: '' }, jobs: [], jres: {}, jstep: null, job: null, jd: rd(JD_F, {}), inv: rd(INV_F, {}), act: { src: null, at: 0, err: null }, day: { d: '', calls: 0, recs: 0 }, t: null, opens: [], fails: 0, lastErr: null };
  { const t = rd(TPL_F, {}); for (const [k, v] of Object.entries(t)) if (v && v.u) Y.tpl[k] = { u: v.u, b: v.b || '', m: v.m || 'POST', h: {}, at: +v.at || 0 }; }
  const saveTpl = () => { const o2 = {}; for (const [k, v] of Object.entries(Y.tpl)) o2[k] = { u: v.u, b: v.b, m: v.m, at: v.at }; wr(TPL_F, o2); }; /* 머리글은 파일에 안 남김 */
  const kday = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 10); const dayAdd = (k) => { const d = kday(); if (Y.day.d !== d) Y.day = { d, calls: 0, recs: 0 }; Y.day[k]++; };
  const C = () => ({ ordMin: 5, prdH: 24, tourH: 24, keepMin: 20, feedMin: 5, ...(cfg().y24cfg || {}) }); /* 근거: 없음, 설정(col2.json y24cfg)으로 바꿈 · ordMin은 웹앱 설정(app_settings/platforms.y24.ordMin)을 수집기가 넘겨줌 */
  const ordMinNow = () => { const v = Y.feed.cfg && Y.feed.cfg.ordMin != null ? +Y.feed.cfg.ordMin : C().ordMin; return Number.isFinite(v) && v > 0 ? v : 0; };
  const pcName = () => String(cfg().pc || require('os').hostname() || '');
  const isLogger = () => /^LOGGER/i.test(pcName());
  const enabled = () => !!cfg().on && (cfg().y24 == null ? !TEST : cfg().y24 !== false) && !isLogger(); /* 시험에선 켤 때만(다른 시험의 크롬 수를 바꾸지 않게) */
  const jobsOn = () => cfg().y24Jobs !== false;
  const feedOk = () => now() - Y.feed.at < C().feedMin * 60e3;
  const holdOn = () => !!(feedOk() && Y.feed.hold && Y.feed.hold.on);
  const alive = () => !!(Y.br && Y.br.alive());

  /* ── 크롬(이 프로필만) ── */
  function prefsNoPw() { try { const d = path.join(PROF, 'Default'); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, 'Preferences'); let P = {}; try { P = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) {}
      if (P.credentials_enable_service === false && P.profile && P.profile.password_manager_enabled === false && P.profile.password_manager_leak_detection === false && P.session && P.session.restore_on_startup === 1) return; P.credentials_enable_service = false; P.profile = { ...(P.profile || {}), password_manager_enabled: false, password_manager_leak_detection: false }; P.session = { ...(P.session || {}), restore_on_startup: 1 }; fs.writeFileSync(f, JSON.stringify(P)); } catch (e) {} } /* 크롬이 아이디·비밀번호를 저장하겠느냐고 묻지 않게(이 프로필만)
   *  (정범님 11/10 '예스24 로그인이 계속 풀림' 조사) ① restore_on_startup 1 = '중단한 위치에서 계속' — 판매관리 로그인 쿠키가 '세션 쿠키'(끝나는 날 없음)면 크롬을 닫았다 다시 띄울 때(도우미 새 판·PC 재시작·크롬 다시 띄우기) 지워져 로그인이 풀렸음 → 이 설정이면 크롬이 세션 쿠키를 지켜 둠(이 프로필만 · 정범님 크롬은 그대로)
   *  ② password_manager_leak_detection 끔 = 스스로 다시 로그인 때 이 숨은 크롬이 '비밀번호가 유출됨' 확인을 하거나 그 창을 띄우지 않게 */
  const REQ = new Map();
  function onEv(m, p, sid) { const br = Y.br; if (!br || sid !== br.sid) return;
    if (m === 'Network.requestWillBeSent') { let u; try { u = new URL(p.request.url); } catch (e) { return; } if (u.host !== HOST || !/\/api\//i.test(u.pathname)) return; const pu = u.pathname + u.search;
      const it = { m: p.request.method, u: pu, post: p.request.postData || '', h: p.request.headers || {}, mine: Y.calling, page: (() => { try { return new URL(br.frameUrl || BASE).pathname; } catch (e) { return '/'; } })(), at: now() }; REQ.set(p.requestId, it); if (REQ.size > 300) REQ.delete(REQ.keys().next().value);
      if (!it.post && p.request.hasPostData) br.cdp.send('Network.getRequestPostData', { requestId: p.requestId }, sid).then((x) => { it.post = (x && x.postData) || ''; learnFrom(it); }).catch(() => {}); else learnFrom(it);
      if (!Y.calling) Y.hdr = { h: it.h, at: now() }; return; }
    if (m === 'Network.responseReceived') { const it = REQ.get(p.requestId); if (it) { it.st = p.response.status; it.ct = (p.response.headers && (p.response.headers['content-type'] || p.response.headers['Content-Type'])) || p.response.mimeType || ''; } return; }
    if (m === 'Network.loadingFailed') { REQ.delete(p.requestId); return; }
    if (m === 'Network.loadingFinished') { const it = REQ.get(p.requestId); if (!it) return; REQ.delete(p.requestId);
      br.cdp.send('Network.getResponseBody', { requestId: p.requestId }, sid).then((b) => take(it, b)).catch(() => take(it, null)); return; }
    if (m === 'Page.javascriptDialogOpening') { onDialog(p); } }
  function learnFrom(it) { if (it.mine || !Y.learnK) return; const k = (it.u.match(KIND_RE) || []); const name = k[2] || k[3]; if (!name) return; if (Y.learnK !== '*' && Y.learnK !== name) return; Y.tpl[name] = { u: it.u, b: it.post || '', m: it.m || 'POST', h: it.h, at: now() }; saveTpl(); }
  /* 받은 응답 → 수집기와 같은 꼴 줄 · 로그인·비밀번호 길은 원문을 남기지 않음 · 파일(엑셀 등)은 크기·종류만 */
  function take(it, b) { const sig = (it.m || 'GET').toUpperCase() + ' ' + it.u.split('?')[0]; const sec = SECRET.test(it.u.split('?')[0]); let text = '';
    if (b) text = b.base64Encoded ? JSON.stringify({ file: true, ctype: it.ct || '', bytes: Math.round(String(b.body || '').length * 0.75) }) : String(b.body || '');
    const isJ = /json/i.test(it.ct || '') || /^\s*[\[{]/.test(text.slice(0, 2)); if (/\/api\/Product\/ProductList(?:\?|$)/i.test(it.u) && !it.mine) Y.plAt = now(); /* (11/11 y24w) 화면이 [조회]로 받은 등록상품 목록 — 예스24 쓰기가 '응답이 왔는지' 봄 */ if (/\/api\/Menu\/GetMenus/i.test(it.u) && !Y.menus) { try { const mm = pickMenus(JSON.parse(text)); if (mm && mm.length) Y.menus = mm; } catch (e) {} }
    if (Y.tourCur && it.page && it.page.toLowerCase() === Y.tourCur && !/\/api\/(Common|Menu)\//i.test(it.u) && isJ) { try { Y.tourResp = { cnt: y24Cnt(JSON.parse(text)), at: now() }; } catch (e) {} }
    const rec = { id: 'c2y' + now().toString(36) + (++Y.seq).toString(36), sig, url: it.u, page: it.page || '/', at: it.at || now(), status: it.st || 0, ctype: String(it.ct || '').slice(0, 60), req: sec ? null : String(it.post || '').slice(0, 4000), json: isJ, body: sec ? null : text.slice(0, 1500000), src: 'col2' };
    const sz = rec.body ? rec.body.length : 0; Y.q.push(rec); Y.qBytes += sz; Y.recN++; dayAdd('recs'); while (Y.q.length > 200 || Y.qBytes > 6e6) { const x = Y.q.shift(); Y.qBytes -= x && x.body ? x.body.length : 0; Y.drop++; } }
  function onDialog(p) { const br = Y.br; const j = Y.job; let accept = false; const msg = String(p.message || '').slice(0, 120);
    if (REG && REG.cur()) accept = REG.dialog(p);
    else if (W && W.cur()) accept = W.dialog(p); /* (11/11 y24w) 🟦 예스24 쓰기 일 동안만 — 그 [수정항목 저장]·[변경] 확인 물음에만 '예' */ /* (11/10 y24auto) 🟦 자동 올림 일 동안만 — 그 [등록] 확인 물음에만 '예' */
    else if (j) { const ship = j.kind === 'ship'; const OK = ship ? /발송\s*처리/ : /접수\s*확인|주문\s*접수|접수\s*하시/; const BAD = /취소|판매\s*불가|삭제|지정\s*택배|반품|교환|환불/; accept = p.type === 'alert' || (OK.test(msg) && !BAD.test(msg)); if (!accept) j.refused = msg; (j.msgs = j.msgs || []).push(msg); }
    else accept = p.type === 'alert'; /* 맡긴 일이 아니면 확인 물음은 늘 '아니오'(쓰기 일이 실수로 확인되지 않게) */
    br.cdp.send('Page.handleJavaScriptDialog', { accept }, br.sid).catch(() => {}); }
  async function ensure(why) { if (alive()) return Y.br; if (Y.launching) return Y.launching; Y.opens = Y.opens.filter((t) => now() - t < 3600e3); if (Y.opens.length >= 4) throw new Error('예스24 크롬을 한 시간에 4번 넘게 다시 띄워 쉼'); Y.opens.push(now());
    if (Y.br) { try { Y.br.kill(); } catch (e) {} } prefsNoPw();
    const b = new Browser({ exe: o.chromeExe(), profile: PROF, headless: false, rect: { x: -32000, y: 40, w: 1280, h: 900 }, stale: () => WIN.run('kill', MARK), handoffMs: o.handoffMs() }); Y.br = b; Y.shown = false;
    note(`🟦 예스24 크롬을 띄움 — ${why || ''} (따로 된 프로필 · 화면 밖)`);
    Y.launching = b.launch().then(async () => { b.cdp.on.push(onEv); await b.cdp.send('Network.enable', { maxResourceBufferSize: 8e6, maxTotalBufferSize: 64e6 }, b.sid).catch(() => {}); hideSoon(); Y.landed = false; return b; }, (e) => { Y.fails++; Y.lastErr = e.message; throw e; }).finally(() => { Y.launching = null; }); return Y.launching; }
  function hideSoon() { if (cfg().headless) return; let k = 0; const t = setInterval(async () => { k++; if (k > 20 || Y.shown || !alive()) return clearInterval(t); const r = await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }); if (r.ok && r.n > 0) clearInterval(t); }, TEST ? 400 : 3000); }
  async function close(why) { const b = Y.br; Y.br = null; Y.shown = false; Y.landed = false; if (b) { try { await b.close(); } catch (e) {} note(`🟦 예스24 크롬을 닫음 — ${why || ''}`); } }
  async function nav(url, sec, sid0) { const b = Y.br; const sid = sid0 || b.sid; let f; const done = new Promise((res) => { f = (m, p, s) => { if (s === sid && m === 'Page.loadEventFired') res(true); }; b.cdp.on.push(f); setTimeout(() => res(false), (sec || 30) * 1000); });
    try { const r = await b.cdp.send('Page.navigate', { url }, sid); if (r && r.errorText) throw new Error('예스24 화면을 못 엶: ' + r.errorText); await done; } finally { b.cdp.on = b.cdp.on.filter((x) => x !== f); } if (!sid0) b.ctxId = null; }
  async function ev(expr, ms, sid0) { const b = Y.br; const r = await b.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid0 || b.sid, ms || 40000); if (r.exceptionDetails) throw new Error('화면 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 160)); return r.result ? r.result.value : null; }
  const isLoginSt = (s) => !s || s.pw || /login/i.test(s.p || '') || (s.h && s.h !== HOST.split(':')[0] && s.h !== HOST);
  function setLogin(st, why) { if (Y.login !== st) { if (st === 'need' && Y.login === 'ok' && Y.loginAt && now() - Y.loginAt < (C().ppMin == null ? 30 : +C().ppMin) * 60e3) { Y.drops = (Y.drops || []).filter((t) => now() - t < 3 * 3600e3).concat([now()]); } Y.login = st; if (st === 'need') { note('🔐 예스24 로그인이 필요 — 옆 창의 [🔐 예스24 로그인] 단추를 한 번 눌러 주세요(' + (why || '') + ')'); Y.loginMsg = why || ''; } if (st === 'ok') { Y.loginAt = now(); note('🟦 예스24 로그인 세션 살아 있음 — 판매관리 읽기 시작'); } } }
  /* 화면을 열고 [조회](읽기 단추)만 눌러 그 화면이 보내는 조건 모양·머리글을 배움 · 그 응답도 그대로 줄에 들어감(사람이 화면에서 [조회]를 누른 것과 같음) */
  async function learn(pg, k) { const t0 = now(); Y.learnK = k || '*'; try { await nav(BASE + pg, 30); const s = await ev(JS_STATE); if (isLoginSt(s)) return 'login'; const c = await ev(JS_CLICK(15000 * SC + 2000), 30000); if (c && c.login) return 'login'; if (!c || !c.clicked) return 'nobtn';
      for (let i = 0; i < 40 && k && !(Y.tpl[k] && Y.tpl[k].at >= t0); i++) await sleep(200); await sleep(300); return !k || (Y.tpl[k] && Y.tpl[k].at >= t0) ? 'ok' : 'notpl'; } finally { Y.learnK = null; } }
  async function callTpl(k, bodyOver) { const t = Y.tpl[k]; const { body, isJ } = bodyOver ? { body: bodyOver.body, isJ: bodyOver.isJ } : ordShift(t); const H = hdrFresh(t.h, Y.hdr && Y.hdr.h); if (isJ && !Object.keys(H).some((x) => /content-type/i.test(x))) H['Content-Type'] = 'application/json';
    const page = pageOf(t.u); let cur = ''; try { cur = new URL(Y.br.frameUrl || '').host; } catch (e) {} if (cur !== HOST) { await nav(BASE + page, 30); const s = await ev(JS_STATE); if (isLoginSt(s)) return { st: 0, login: true }; }
    Y.calling = true; dayAdd('calls');
    try { return await ev(`(async()=>{try{const r=await fetch(${JSON.stringify(t.u)},{method:${JSON.stringify(t.m || 'POST')},headers:${JSON.stringify(H)},body:${JSON.stringify(body)},credentials:'include',cache:'no-store'});const tx=await r.text();let j=null;try{j=JSON.parse(tx)}catch(e){}
      const L=j&&(j.PRODUCT_LIST||j.RESULT_LIST||j.LIST);return{st:r.status,ok:!!j,n:Array.isArray(L)?L.length:null,ids:Array.isArray(L)?L.map((z)=>String(z&&z.GOODS_NO||'')).slice(0,500):null,login:/login/i.test(new URL(r.url).pathname)}}catch(e){return{st:0,ok:false,err:String(e.message||e)}}})()`, 45000); }
    finally { await sleep(400); Y.calling = false; } }
  /* (11/10 y24auto) 등록상품 목록 한 쪽 — 줄마다 { no 상품번호 · self 판매자상품코드 · ean } (자동 올림 확인용 · 읽기만) */
  async function rawList(t, bodyOver) { const H = hdrFresh(t.h, Y.hdr && Y.hdr.h); if (bodyOver.isJ && !Object.keys(H).some((x) => /content-type/i.test(x))) H['Content-Type'] = 'application/json'; Y.calling = true; dayAdd('calls');
    try { return await ev(`(async()=>{try{const r=await fetch(${JSON.stringify(t.u)},{method:${JSON.stringify(t.m || 'POST')},headers:${JSON.stringify(H)},body:${JSON.stringify(bodyOver.body)},credentials:'include',cache:'no-store'});const j=await r.json().catch(()=>null);const L=j&&(j.PRODUCT_LIST||j.RESULT_LIST||j.LIST);
      const pk=(z,re)=>{const k=Object.keys(z||{}).find((x)=>re.test(x));return k?String(z[k]==null?'':z[k]):''};return{st:r.status,rows:Array.isArray(L)?L.map((z)=>({no:pk(z,/^GOODS_NO$/i),self:pk(z,/^ENTR_GOODS_CD$|SELF|OWN_?CD/i),ean:pk(z,/^EAN$|ISBN/i)})):null}}catch(e){return{st:0,err:String(e.message||e)}}})()`, 45000); }
    finally { await sleep(400); Y.calling = false; } }
  const bad = (r) => !r || r.login || r.st === 401 || r.st === 403 || (r.st === 200 && !r.ok);
  /* 🔁 주문 두 목록(신규 주문·발송관리) — 모양을 모르면 화면을 열어 배우고 · 401이면 화면을 다시 열어 새 머리글로 한 번 더 · 그래도 로그인 화면이면 '로그인 필요' */
  async function ordOnce() { for (const k of ORD_KINDS) { if (!Y.tpl[k]) { const r = await learn('/Order/' + k, k); if (r === 'login') { setLogin('need', '주문 화면이 로그인 화면으로 감'); return 'login'; } if (r !== 'ok') { Y.ord.err = `${k === 'NewOrderConfirmList' ? '신규 주문' : '발송관리'} 화면에서 [조회] 모양을 못 배움(${r})`; } else { Y.ord.n++; setLogin('ok'); } await sleepR(2000, 4000); continue; }
      let r = await callTpl(k);
      if (bad(r)) { const lr = await learn('/Order/' + k, k); if (lr === 'login') { setLogin('need', `주문 목록 응답 ${r && r.st} → 화면을 열어 보니 로그인 화면`); return 'login'; } r = lr === 'ok' ? { st: 200, ok: true, learned: true } : await callTpl(k); Y.ord.renewAt = now(); }
      if (bad(r) || r.st !== 200) { Y.ord.err = `예스24가 주문 목록 읽기를 받지 않음(${(r && r.st) || '연결 안 됨'}) — 다음 차례에 다시`; return 'err'; }
      Y.ord.n++; setLogin('ok'); await sleepR(2000, 4000); }
    Y.ord.err = null; Y.ord.at = now(); return 'ok'; }
  /* 📋 등록상품 전부 — 수집기 prdAll과 같은 셈(판매상태·쪽만 바꿔 다시 부름 · 쪽마다 2~4초) */
  async function prdAll() { const STATES = ['', '02', '08', '04', '07', '06', '09']; Y.prd.on = true; Y.prd.pages = 0; const seen = new Set();
    try { if (!Y.tpl.ProductList) { const r = await learn('/Product/ProductList', 'ProductList'); if (r === 'login') { setLogin('need', '등록상품 화면이 로그인 화면으로 감'); return; } if (r !== 'ok') { Y.prd.err = `등록상품 조회 모양을 못 배움(${r})`; return; } }
      const T = Y.tpl.ProductList; let isJ = false, base = null; try { base = JSON.parse(T.b); isJ = base && typeof base === 'object'; } catch (e) {} if (!isJ) base = Object.fromEntries(new URLSearchParams(T.b || ''));
      const ks = Object.keys(base); const kP = ks.find((k) => /^(PAGE_?(NO|INDEX|NUM|NUMBER)|CUR(RENT)?_?PAGE|pageNo|pageIndex|pageNum|page)$/i.test(k)); const kS = ks.find((k) => /(PAGE_?SIZE|ROW_?(CNT|COUNT|SIZE)|LIST_?(SIZE|CNT)|pageSize|rows|perPage|limit)$/i.test(k)); const kSt = ks.find((k) => /^(SALE_|GOODS_|USED_)?(STAT|STATE|STS)(_GB|_CD)?$/i.test(k) && !/LEVEL/i.test(k));
      for (const sv of kSt ? STATES : [null]) { for (let pg = 1; pg <= 60; pg++) { if (!enabled() || holdOn()) return; const o2 = { ...base }; if (kSt && sv != null) o2[kSt] = sv; if (kP) o2[kP] = isJ && typeof base[kP] === 'number' ? pg : String(pg); if (kS) o2[kS] = isJ && typeof base[kS] === 'number' ? 100 : '100';
          let r = await callTpl('ProductList', { body: isJ ? JSON.stringify(o2) : new URLSearchParams(o2).toString(), isJ }); Y.prd.pages++;
          if (bad(r)) { const lr = await learn('/Product/ProductList', 'ProductList'); if (lr === 'login') { setLogin('need', '등록상품 읽기 중 로그인 화면'); return; } r = await callTpl('ProductList', { body: isJ ? JSON.stringify(o2) : new URLSearchParams(o2).toString(), isJ }); }
          if (!r || r.st !== 200 || r.n == null) break; (r.ids || []).forEach((x) => seen.add(x)); Y.prd.n = seen.size; if (!kP || r.n < (kS ? 100 : r.n + 1) || !r.n) break; await sleepR(2000, 4000); }
        await sleepR(2000, 4000); }
      Y.prd.err = null; Y.prd.at = now(); note(`📋 예스24 등록상품 전부 읽음 — 매물 ${seen.size}개 · ${Y.prd.pages}번 물음`); } finally { Y.prd.on = false; } }
  /* 🛰 둘러보기 — 메뉴(GetMenus) 화면을 하나씩 이 숨은 탭에서 열어 [조회]만 · 화면 사이 8~20초 · 비밀번호 확인 화면·묶음 제목은 열지 않음 · 결과는 수집기 '마지막 둘러보기'(rn-y24tour → y24_raw_idx/_tour)와 같은 꼴 */
  async function tourRun() { if (!Y.menus) { await nav(BASE + '/', 30); for (let i = 0; i < 25 && !Y.menus; i++) await sleep(200); } if (!Y.menus) { Y.tour = { at: now(), end: now(), mode: 'col2', stop: 'nomenu', n: 0, menuN: 0, res: [], sum: {} }; return; }
    const cand = Y.menus.filter((m) => !m.grp); const T = { at: now(), end: 0, mode: 'col2', stop: null, n: cand.length, menuN: cand.length, res: [] }; Y.tour = T; const sum = () => { const s = { ok: 0, empty: 0, nobtn: 0, skip: 0, fail: 0 }; for (const r of T.res) if (s[r.st] != null) s[r.st]++; T.sum = s; };
    for (const m of cand) { if (!enabled() || holdOn() || Y.jobs.some((j) => !Y.jd[j.id])) { T.stop = holdOn() ? 'hold' : 'pause'; break; }
      if (Y.ord.next && now() >= Y.ord.next) { await ordOnce().catch(() => {}); Y.ord.next = now() + ordMinNow() * 60e3 * (0.7 + Math.random() * 0.6) * (TEST ? SC : 1); if (Y.login !== 'ok') { T.stop = 'login'; break; } } /* 둘러보는 동안에도 주문 읽기 차례는 지킴 */ const put = (st, cnt, msg) => { T.res.push({ path: m.path, name: String(m.name || '').slice(0, 40), st, cnt: cnt == null ? null : +cnt, msg: String(msg || '').slice(0, 160), at: now() }); sum(); };
      if (SECRET.test(m.path)) { put('skip', null, '비밀번호 확인 화면이라 열지 않음(원문을 남기지 않는 길)'); continue; }
      Y.tourCur = m.path.toLowerCase(); Y.tourResp = null; const r = await learn(m.path, null).catch((e) => 'err:' + e.message); Y.tourCur = null;
      if (r === 'login') { put('fail', null, '로그인 화면이 열림'); T.stop = 'login'; setLogin('need', '둘러보기 중 로그인 화면'); break; }
      await sleepR(1500, 2500); const cnt = Y.tourResp ? Y.tourResp.cnt : null; put(r === 'nobtn' ? 'nobtn' : Y.tourResp ? (cnt === 0 ? 'empty' : 'ok') : 'fail', cnt, r === 'nobtn' ? '조회 단추 없음(화면 문서만)' : Y.tourResp ? '' : '조회 응답을 못 봄');
      await sleepR(8000, 20000); }
    T.end = now(); sum(); note(`🛰 예스24 둘러보기 ${T.stop ? '멈춤(' + T.stop + ')' : '끝'} — 받음 ${T.sum.ok || 0} · 빈 목록 ${T.sum.empty || 0} · 못 받은 곳 ${T.sum.fail || 0}`); }
  /* ── 맡긴 일(주문접수확인·발송처리) ── */
  async function actSrc() { if (Y.act.src && now() - Y.act.at < 6 * 3600e3) return Y.act.src; let s = null;
    try { s = process.env.RN_COL2_CORE_DIR ? fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, 'readnow-pc-helper.js'), 'utf8') : await o.getText(o.coreBase + 'readnow-pc-helper.js?t=' + now()); } catch (e) { Y.act.err = '맡긴 일 함수 받기 실패: ' + e.message; }
    const c = cutAct(s); if (c) { Y.act = { src: c, at: now(), err: null }; try { fs.writeFileSync(path.join(HOME, 'y24-act.js'), c); } catch (e) {} } else if (!Y.act.src) { try { const c2 = cutAct(fs.readFileSync(path.join(HOME, 'y24-act.js'), 'utf8').replace(/^/, '')); if (c2) Y.act.src = c2; } catch (e) {} } return Y.act.src; }
  function jStep(j, lv, m) { const e = { at: new Date().toISOString(), lv, m: String(m).slice(0, 200) }; j.steps = (j.steps || []).concat([e]).slice(-30); Y.jstep = { id: j.id, ...e, steps: j.steps }; }
  const jobPick = () => Y.jobs.find((j) => j && j.id && !Y.jd[j.id] && JPATH[j.kind]);
  async function jobRun(j) { const ship = j.kind === 'ship'; jStep(j, 'info', `맡김 받음(번외 수집기) — ${ship ? `발송처리 · ${String(j.courier || '')} ${String(j.no || '')}` : '주문접수확인'}${j.confirm ? ' · 첫 건이라 사람 확인 후 실행' : ''}`);
    if (ship) { const iv = Y.inv[String(j.no || '')]; if (iv && iv.ono !== String(j.ono)) return { state: 'fail', msg: `같은 송장번호가 이미 다른 주문(${iv.ono})에 발송처리됨 — 같은 송장 두 번 금지(아무것도 누르지 않음)` }; if (iv && iv.ono === String(j.ono)) return { state: 'done', already: true, msg: '이 송장으로 이미 발송처리함(번외 수집기 기록) — 아무것도 안 함' }; }
    const src = await actSrc(); if (!src) return { state: 'fail', msg: '맡긴 일 함수(운영 수집기 y24Act)를 못 받음 — 아무것도 누르지 않음' };
    const run = async (fn) => { const ex = `(async()=>{${src}\nconst H={sleep:(ms)=>new Promise((r)=>setTimeout(r,ms)),ask:(job)=>new Promise((res)=>{const box=document.createElement('div');box.id='rn-col2y-ask';box.style.cssText='position:fixed;left:12px;right:12px;top:12px;z-index:2147483647;background:#B0322A;color:#fff;font:700 15px/1.5 system-ui,Malgun Gothic,sans-serif;padding:12px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.4)';
box.textContent='🤖 번외 수집기 — 첫 건 확인: 빨간 테두리 줄·단추를 보세요 (주문 '+String(job.ono)+' · '+(job.kind==='ship'?'발송처리 '+String(job.courier||'')+' '+String(job.no||''):'주문접수확인')+')';const br=document.createElement('br');box.appendChild(br);const go=document.createElement('button');go.textContent='▶ 이대로 실행';const no=document.createElement('button');no.textContent='■ 멈춤';[go,no].forEach((b)=>{b.style.cssText='margin:8px 8px 0 0;font:700 15px system-ui;padding:6px 16px;border-radius:8px;border:0;cursor:pointer';box.appendChild(b)});
const end=(v)=>{clearTimeout(to);try{box.remove()}catch(e){}delete document.documentElement.dataset.rnAsk;res(v)};const to=setTimeout(()=>end(false),15*60e3);go.onclick=()=>end(true);no.onclick=()=>end(false);document.body.appendChild(box);document.documentElement.dataset.rnAsk='1'})};
try{return await ${fn}(document,window,${JSON.stringify({ id: j.id, ono: j.ono, kind: j.kind, courier: j.courier || null, no: j.no || null, confirm: !!j.confirm })},H)}catch(e){return{state:'fail',msg:'자동 처리 중 오류: '+String(e.message||e).slice(0,120)}}})()`;
      let asked = false; const t = setInterval(async () => { try { const a = await ev(`document.documentElement.dataset.rnAsk==='1'`, 3000); if (a && !asked) { asked = true; jStep(j, 'warn', '첫 건 확인 기다림 — 번외 수집기 예스24 창의 [▶ 이대로 실행]을 눌러 주세요'); await show('첫 건 확인'); } } catch (e) {} }, 1000);
      try { return await ev(ex, 17 * 60e3); } finally { clearInterval(t); if (asked) await hide('첫 건 확인 끝'); } };
    jStep(j, 'info', `화면 엶 — ${ship ? '발송관리' : '신규 주문'} 목록(번외 수집기 숨은 창)`); await nav(BASE + JPATH[j.kind], 30); if (isLoginSt(await ev(JS_STATE))) { setLogin('need', '맡긴 일 화면이 로그인 화면'); return { state: 'fail', msg: '예스24 로그인이 풀림 — 아무것도 누르지 않음(로그인하면 다시 맡겨 주세요)', login: true }; }
    await sleep(j.fast !== false ? 500 : 3000); jStep(j, 'info', '주문 줄 찾고 칸 채우는 중'); j.msgs = []; j.refused = null; Y.job = j;
    let r1; try { r1 = await run('y24Act'); } finally { Y.job = null; } r1 = r1 || { state: 'fail', msg: '빈 결과' };
    if (j.refused && r1.state === 'clicked') r1 = { state: 'fail', msg: `확인 창 글이 이 일과 맞지 않아 멈춤: ${j.refused}`, msgs: j.msgs };
    if (r1.state !== 'clicked') { jStep(j, r1.state === 'done' || r1.state === 'gone' ? 'ok' : 'err', `${r1.state === 'done' ? '이미 끝남' : r1.state === 'gone' ? '목록에 없음' : '멈춤'} — ${r1.msg || ''}`); return r1; }
    jStep(j, 'info', `${r1.msg || '단추 누름'}`); await sleep(1500); jStep(j, 'info', '목록을 다시 열어 확인하는 중'); await nav(BASE + JPATH[j.kind] + '?t=' + now(), 30); await sleep(1500);
    const r2 = (await run('y24Check')) || { state: 'unsure', msg: '' }; jStep(j, r2.state === 'done' ? 'ok' : 'warn', `다시 읽어 확인 — ${r2.state === 'done' ? '✓ 끝' : '확실하지 않음'} · ${r2.msg || ''}`); return { ...r2, msgs: (r1.msgs || []).concat(j.msgs || []).slice(-4) }; }
  async function jobOnce() { const j = jobPick(); if (!j) return false; Y.jd[j.id] = { at: now(), st: 'run' }; const ks = Object.keys(Y.jd); if (ks.length > 500) ks.sort((a, b) => Y.jd[a].at - Y.jd[b].at).slice(0, ks.length - 500).forEach((k) => delete Y.jd[k]); wr(JD_F, Y.jd);
    let res; try { res = await jobRun(j); } catch (e) { res = { state: 'fail', msg: '자동 처리 중 오류: ' + String(e.message || e).slice(0, 120) }; }
    Y.jd[j.id] = { at: now(), st: res.state }; wr(JD_F, Y.jd); if (j.kind === 'ship' && res.state === 'done' && j.no) { Y.inv[String(j.no)] = { ono: String(j.ono), at: now() }; wr(INV_F, Y.inv); }
    Y.jres[j.id] = { ...res, confirm: !!j.confirm, at: now(), by: 'col2', steps: (j.steps || []).slice(-30) }; Y.jobs = Y.jobs.filter((x) => x.id !== j.id); note(`🤖 예스24 ${j.kind === 'ship' ? '발송처리' : '주문접수확인'} ${j.ono}: ${res.state} ${res.msg || ''}`); return true; }
  /* ── 보이기·숨기기(로그인·첫 건 확인 때만) ── */
  async function show(why) { const w = cfg().ywin && cfg().ywin.w >= 400 ? cfg().ywin : {}; const r = await WIN.run('show', MARK, w); Y.shown = true; note(`🟦 예스24 창을 앞으로 (${why || ''})`); return r; }
  async function hide(why) { const f = await WIN.run('find', MARK); const it = f.ok && f.list && f.list[0]; if (Y.shown && it && it.r && !it.ic && !it.tool && it.r.w >= 400 && it.r.h >= 300 && f.vs && it.r.x + it.r.w > f.vs.x) o.saveRect('ywin', it.r); const r = await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }); Y.shown = false; note(`🟦 예스24 창을 다시 숨김 (${why || ''})`); return r; }
  /* 🔐 로그인 한 번 — 정범님이 옆 창 단추를 누르면 이 크롬 창을 앞으로 꺼내 예스24 판매관리 첫 화면(로그인 화면)을 엶 · 아이디·비번은 정범님이 그 창에 직접(우리는 칸을 건드리지 않음) → 로그인되면 저절로 다시 숨김 */
  async function login(why) { if (!cfg().on) return { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' }; if (isLogger()) return { ok: false, err: '로거 PC에서는 예스24 로그인을 하지 않습니다(약속 0)' }; if (!enabled()) return { ok: false, err: '예스24 판매관리 읽기가 꺼져 있음(옆 창에서 켜기)' };
    for (let k = 0; k < 60 && Y.busy; k++) await sleep(500); if (Y.busy) return { ok: false, err: '다른 일을 하는 중 — 잠시 뒤 다시' };
    Y.busy = true; try { await ensure('로그인'); await nav(BASE + '/', 30); const s = await ev(JS_STATE); if (!isLoginSt(s)) { setLogin('ok'); return { ok: true, msg: '이미 로그인돼 있음 — 할 일 없음' }; }
      Y.login = 'wait'; Y.loginWait = now(); await show(why || '로그인'); return { ok: true, msg: '예스24 창을 앞으로 꺼냄 — 그 창에서 로그인하면 저절로 숨고 읽기를 시작합니다(아이디·비밀번호는 저장하지 않음)' }; }
    catch (e) { return { ok: false, err: e.message }; } finally { Y.busy = false; } }
  async function loginPoll() { if (Y.login !== 'wait') return; if (now() - Y.loginWait > 15 * 60e3) { Y.login = 'need'; await hide('로그인 기다림 15분 넘음').catch(() => {}); return; } let s = null; try { s = await ev(JS_STATE, 5000); } catch (e) { return; }
    if (s && !isLoginSt(s) && s.rs === 'complete') { setLogin('ok'); await hide('로그인 됨').catch(() => {}); Y.ord.next = now() + 3000; } }
  /* (11/10 정범님 '예스24가 자주 로그아웃돼 — 스스로 다시 로그인') 🔐 저장된 계정(col2-cred · DPAPI)으로 한 번 — 언제·얼마나는 col2-relogin.js(출고 중·로거·속도 제한·보안 문자면 안 함) */
  /* (정범님 11/10 '예스24 로그인이 계속 풀림') 로그인 뒤 30분 안에 다시 풀리는 일이 3시간에 3번이면 = 다른 곳(정범님 크롬·다른 PC 번외)에서 같은 계정으로 로그인해 서로 끊는 것으로 의심 → 스스로 다시 로그인을 멈추고 알림(서로 끊기를 되풀이하지 않게) */
  const quickDrops = () => (Y.drops || []).filter((t) => now() - t < 3 * 3600e3).length;
  async function autoRe() { const R = o.relogin; if (!R) return ''; if (!feedOk()) return '이 PC 수집기(다리)가 안 보임'; if (ppStop(Y.drops, now(), C().ppN)) { if (!Y.ppNoted || now() - Y.ppNoted > 3600e3) { Y.ppNoted = now(); note('⛔ 예스24 로그인이 로그인 뒤 30분 안에 3번 풀림 — 다른 곳(정범님 크롬·다른 PC 번외)에서 같은 계정으로 로그인해 서로 끊는 것으로 의심 · 스스로 다시 로그인을 3시간 멈춤 · 예스24 읽기는 한 PC에서만 켜 두세요'); } return '로그인 뒤 금방 다시 풀림 3번 — 다른 곳 로그인과 서로 끊기는 것으로 의심해 멈춤(3시간)'; } const w = R.why('y24', { hold: holdOn() }); if (w) return w;
    const r = await R.run('y24', { name: '예스24 판매관리', loginUrl: BASE + '/', nav, ev, sleep: sleepR, type: (t) => Y.br.cdp.send('Input.insertText', { text: t }, Y.br.sid), settle: () => sleep(TEST ? 300 : 1500), check: async () => { await nav(BASE + '/', 30); return !isLoginSt(await ev(JS_STATE)); } });
    if (r.ok) { setLogin('ok'); Y.keepAt = now(); Y.ord.next = now() + 3000; return 'ok'; } return r.why; }
  /* (정범님 11/10 '저장을 누르면 먼저 맞는지 확인') 🔐 ⚙ › 🔐 [확인하고 저장] — 넣은 아이디·비밀번호로 이 PC 번외 예스24 크롬에서 실제로 로그인해 봄 → 맞을 때만 저장(부른 쪽)
   *  · 지금 세션이 살아 있으면 따로 된 임시 창(쿠키가 따로인 브라우저 맥락 · 닫으면 사라짐)에서 해 봄 — 살아 있는 세션 쿠키를 덮거나 로그아웃하지 않음
   *  · 세션이 풀려 있으면 그 자리(본 창)에서 로그인 = 확인과 다시 로그인을 한 번에 · 출고 중·로거·꺼짐이면 확인하지 않고 까닭 */
  async function verify(id, pw, x) { x = x || {}; const ph = (t) => (x.phase ? x.phase(t) : null); if (isLogger()) return { ok: false, why: '로거 PC에서는 예스24 계정을 쓰지 않습니다(약속 0)' }; if (!cfg().on) return { ok: false, wait: true, why: '번외 수집이 꺼져 있어 확인할 수 없음 — 먼저 켜기' }; if (!enabled()) return { ok: false, wait: true, why: '🟦 예스24 판매관리 읽기가 꺼져 있어 확인할 수 없음 — 그 칸을 켠 뒤 다시' };
    if (holdOn()) return { ok: false, wait: true, why: '🚚 출고 중 — 끝난 뒤 다시 저장해 주세요(약속 0-1)' }; if (Y.login === 'wait') return { ok: false, wait: true, why: '예스24 창에서 직접 로그인하는 중 — 끝난 뒤 다시' };
    ph('예스24가 하던 읽기가 끝나기를 기다리는 중'); for (let k = 0; k < 60 && Y.busy; k++) await sleep(500); if (Y.busy) return { ok: false, wait: true, why: '예스24가 다른 읽기를 30초 넘게 하는 중 — 잠시 뒤 다시' };
    Y.busy = true; let T = null, f = null; const L = { m: '' };
    try { ph('번외 예스24 크롬 준비하는 중'); await ensure('계정 확인'); ph('지금 예스24 세션이 살아 있는지 보는 중'); await nav(BASE + '/', 30); const live = !isLoginSt(await ev(JS_STATE)); let sid = Y.br.sid; if (live) { ph('세션이 살아 있어 쿠키가 따로인 임시 창 여는 중'); T = await Y.br.openTab('about:blank', 15); sid = T.sid; }
      f = (m, p, s) => { if (s === sid && m === 'Page.javascriptDialogOpening') L.m = String(p.message || '').replace(/\s+/g, ' ').slice(0, 120); }; Y.br.cdp.on.push(f);
      const N = (u, sec) => nav(u, sec, sid), E = (x, ms) => ev(x, ms, sid);
      const r = await o.relogin.tryWith('y24', { name: '예스24 판매관리', phase: x.phase, loginUrl: BASE + '/', nav: N, ev: E, sleep: sleepR, type: (t) => Y.br.cdp.send('Input.insertText', { text: t }, sid), settle: () => sleep(TEST ? 300 : 1500), lastMsg: () => L.m, check: async () => { await N(BASE + '/', 30); return !isLoginSt(await E(JS_STATE)); } }, id, pw);
      if (r.ok && !live) { setLogin('ok'); Y.keepAt = now(); Y.ord.next = now() + 3000; } return { ...r, where: live ? 'tab' : 'main' }; }
    catch (e) { return { ok: false, unsure: true, why: String(e.message || e).slice(0, 140) }; } finally { if (f && Y.br) Y.br.cdp.on = Y.br.cdp.on.filter((x) => x !== f); if (T && Y.br) await Y.br.closeTab(T).catch(() => {}); Y.busy = false; } }
  /* ── 한 바퀴 ── */
  async function step() { const c = C();
    if (!enabled()) { if (Y.br) await close(isLogger() ? '로거 PC' : '꺼짐'); Y.msg = isLogger() ? '로거 PC — 예스24 판매관리 읽기 안 함(약속 0 · 계정·쿠키 금지)' : !cfg().on ? '번외 수집 꺼짐' : '예스24 판매관리 읽기 꺼 둠'; return 30e3; }
    if (Y.login === 'wait') { await loginPoll(); if (Y.login === 'wait') { Y.msg = '🔐 예스24 로그인 창이 열려 있음 — 로그인하면 저절로 숨김'; return 3000; } }
    try { await ensure(Y.br ? '예스24 크롬이 꺼져 있음' : '켜짐'); } catch (e) { Y.msg = '예스24 크롬 준비 실패: ' + e.message; return 60e3; }
    if (!Y.landed) { Y.landed = true; try { await nav(BASE + '/', 30); const s = await ev(JS_STATE); if (isLoginSt(s)) setLogin('need', '판매관리 첫 화면이 로그인 화면'); else { setLogin('ok'); Y.keepAt = now(); } } catch (e) { Y.msg = '예스24 첫 화면 실패: ' + e.message; Y.landed = false; return 60e3; } }
    if (Y.login === 'need') { const ar = await autoRe(); if (ar === 'ok') return 300; Y.msg = '🔐 예스24 로그인 필요 — 옆 창의 [🔐 예스24 로그인] 단추를 한 번(그 뒤엔 세션 유지)' + (ar ? ' · 스스로 다시 로그인: ' + ar : ''); return 15e3; }
    if (holdOn()) { Y.msg = '🚚 출고 중(이 PC 출고 보호) — 예스24 읽기 멈춤 · 끝나면 이어감'; return 15e3; }
    if (!feedOk()) { Y.msg = '이 PC 리드나우 수집기(알라딘 탭)가 안 보여 쉼 — 받은 것을 올릴 곳이 없음(수집기가 다시 보이면 이어감)'; return 15e3; }
    if (Y.feed.cfg && Y.feed.cfg.off) { Y.msg = '웹앱 설정에서 예스24 모으기를 꺼 둠'; return 60e3; }
    if (Y.q.length >= 190) { Y.msg = `올리지 못한 예스24 응답 ${Y.q.length}개 — 수집기가 받아 갈 때까지 쉼`; return 15e3; }
    if (jobsOn() && jobPick()) { await jobOnce(); Y.msg = '🤖 맡긴 일 끝 — 다음'; return 500; }
    if (W && W.pick()) { await W.once(); Y.keepAt = now(); Y.msg = '🟦 예스24 쓰기 한 묶음 끝 — ' + (W.R.msg || ''); return 1500; } /* (11/11 y24w) 수량·판매중지 — 자동 올림보다 먼저(팔린 책을 빨리 내림) */
    if (REG && REG.pick()) { await REG.once(); Y.keepAt = now(); Y.msg = '🟦 예스24 자동 올림 한 묶음 끝 — ' + (REG.R.msg || ''); return 1500; }
    const ordMin = ordMinNow();
    if (ordMin > 0 && now() >= Y.ord.next) { const r = await ordOnce(); Y.ord.next = now() + ordMin * 60e3 * (0.7 + Math.random() * 0.6) * (TEST ? SC : 1); Y.keepAt = now(); Y.msg = r === 'ok' ? '🔁 주문 두 목록 읽음' : r === 'login' ? '🔐 로그인 필요' : Y.ord.err; return 1000; }
    if (c.prdH > 0 && now() >= Y.prd.next && Y.login === 'ok') { Y.prd.next = now() + c.prdH * 3600e3; await prdAll(); Y.keepAt = now(); return 1000; }
    if (c.tourH > 0 && now() >= Y.tourNext && Y.login === 'ok') { Y.tourNext = now() + c.tourH * 3600e3; await tourRun(); Y.keepAt = now(); return 1000; }
    if (now() - Y.keepAt > c.keepMin * 60e3) { Y.keepAt = now(); try { await nav(BASE + '/', 30); const s = await ev(JS_STATE); if (isLoginSt(s)) setLogin('need', '세션 확인 때 로그인 화면'); } catch (e) {} }
    Y.msg = ordMin > 0 ? `🔁 다음 주문 읽기 ${Math.max(0, Math.round((Y.ord.next - now()) / 60e3))}분 뒤` : '🔁 주문 다시 읽기 꺼 둠(웹앱 설정)'; return 15e3; }
  async function loop() { clearTimeout(Y.t); let next = 15e3; if (!Y.busy) { Y.busy = true; try { next = await step(); } catch (e) { Y.msg = '예스24 읽기 오류: ' + e.message; next = 60e3; if (!alive()) Y.landed = false; } finally { Y.busy = false; } } else next = 2000; Y.t = setTimeout(loop, next); }
  const kick = (ms) => { clearTimeout(Y.t); Y.t = setTimeout(loop, ms == null ? 300 : ms); };
  /* ── 수집기 다리(이 PC 알라딘 일하는 탭 · 10초마다) — 받기·보냄 확인·맡긴 일·출고 보호·웹앱 설정 ── */
  function feed(b, by) { Y.feed = { at: now(), cfg: b.cfg && typeof b.cfg === 'object' ? { ordMin: b.cfg.ordMin, off: !!b.cfg.off } : Y.feed.cfg, hold: b.hold && typeof b.hold === 'object' ? { on: !!b.hold.on, why: String(b.hold.why || '').slice(0, 120) } : null, by: String(by || b.by || '').slice(0, 80) };
    const ack = new Set(Array.isArray(b.ack) ? b.ack.map(String) : []); if (ack.size) { const n0 = Y.q.length; Y.q = Y.q.filter((r) => !ack.has(r.id)); Y.qBytes = Y.q.reduce((a, r) => a + (r.body ? r.body.length : 0), 0); Y.sentN += n0 - Y.q.length; }
    for (const id of Array.isArray(b.jack) ? b.jack.map(String) : []) delete Y.jres[id];
    const took = []; if (Array.isArray(b.jobs) && jobsOk()) for (const j of b.jobs.slice(0, 20)) { if (!j || !/^[\w.:-]{3,120}$/.test(String(j.id || '')) || !JPATH[j.kind]) continue; if (Y.jd[j.id] && Y.jd[j.id].st !== 'run') continue; if (!Y.jobs.some((x) => x.id === j.id) && !Y.jd[j.id]) Y.jobs.push({ id: String(j.id), ono: String(j.ono || ''), kind: j.kind, courier: j.courier || null, no: j.no || null, confirm: !!j.confirm, fast: j.fast !== false, at: now() }); took.push(String(j.id)); if (!Y.busy) kick(200); }
    let bytes = 0; const recs = []; for (const r of Y.q) { const n = r.body ? r.body.length : 0; if (recs.length && bytes + n > 3e6) break; recs.push(r); bytes += n; if (recs.length >= 20) break; }
    return { ok: true, y24: sum(), recs, took, jres: Y.jres, jstep: Y.jstep, tour: Y.tour && Y.tour.at ? Y.tour : null }; }
  const jobsOk = () => enabled() && jobsOn() && Y.login === 'ok' && alive() && !holdOn();
  function sum() { return { on: enabled(), logger: isLogger(), login: Y.login, drops: quickDrops(), loginAt: Y.loginAt || null, loginMsg: Y.loginMsg || null, alive: alive(), shown: Y.shown, active: enabled() && Y.login === 'ok' && alive() && feedOk(), jobsOk: jobsOk(), msg: Y.msg, q: Y.q.length, drop: Y.drop, sent: Y.sentN, recs: Y.recN, day: Y.day,
      ord: { at: Y.ord.at || null, n: Y.ord.n, err: Y.ord.err, nextMs: Y.ord.next ? Math.max(0, Y.ord.next - now()) : null }, prd: { at: Y.prd.at || null, n: Y.prd.n, pages: Y.prd.pages, err: Y.prd.err, on: Y.prd.on }, tour: Y.tour ? { at: Y.tour.at, end: Y.tour.end, stop: Y.tour.stop, sum: Y.tour.sum || null } : null,
      reg: REG ? (() => { const r = REG.state(); return { ok1: r.ok1, done: r.done, wait: r.wait.length, cur: r.cur, why: r.why, msg: r.msg }; })() : null, w: W ? (() => { const r = W.state(); return { ok1: r.ok1, stop: r.stop ? r.stop.why : null, wait: r.wait.length, cur: r.cur, why: r.why, msg: r.msg }; })() : null, tpl: Object.keys(Y.tpl), hold: holdOn() ? Y.feed.hold : null, feedAt: Y.feed.at || null, feedBy: Y.feed.by || null, jobs: { wait: Y.jobs.filter((j) => !Y.jd[j.id]).length, res: Object.keys(Y.jres).length }, act: Y.act.err }; }
  async function runNow(what) { if (what === 'prd') Y.prd.next = 0; else if (what === 'tour') Y.tourNext = 0; else Y.ord.next = 0; kick(100); return { ok: true, msg: what === 'prd' ? '📋 등록상품 전부 읽기를 곧 시작' : what === 'tour' ? '🛰 둘러보기를 곧 시작' : '🔁 주문 두 목록을 곧 읽음' }; }
  const start = () => { Y.tourNext = now() + (TEST ? 3600e3 : 30 * 60e3); Y.prd.next = now() + (TEST ? 3600e3 : 20 * 60e3); kick(TEST ? 500 : 20e3); }; /* 켜진 뒤 첫 등록상품·둘러보기는 20·30분 뒤(근거: 없음 — 주문 읽기 먼저) */
  /* (11/10 y24auto) 🟦 예스24 자동 올림 — helper/col2-y24reg.js(웹앱이 장부에 먼저 적고 맡김 → 이 숨은 크롬이 대량 등록 엑셀 업로드) */
  REG = require('./col2-y24reg.js').makeY24Reg({ HOME, TEST, note, log, SC, Y, BASE, JS_STATE, nav, ev, isLoginSt, setLogin, learn, ordShift, rawList, kick, pcName, isLogger, enabled, holdOn, login: () => Y.login });
  REG.cur = () => !!REG.R.cur;
  /* (11/11 y24w) 🟦 예스24 쓰기(수량·판매중지·판매재개) — helper/col2-y24w.js(웹앱 🛠 처리할 일에서 맡김 → 이 숨은 크롬이 등록상품 관리 화면에서 사람처럼 고치고 다시 읽어 확인) */
  W = require('./col2-y24w.js').makeY24W({ HOME, TEST, note, log, SC, Y, BASE, JS_STATE, nav, ev, isLoginSt, setLogin, kick, pcName, isLogger, enabled, holdOn, login: () => Y.login });
  return { start, kick, feed, sum, login, verify, close, runNow, reg: REG, w: W, MARK, Y, _t: { ordShift, hdrFresh, pickMenus, cutAct } };
}
module.exports = { makeY24, ppStop, ordShift, hdrFresh, pickMenus, cutAct, SAFE, DANGER, SECRET };
