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
const fs = require('fs'), path = require('path'); const { dlgOk: DLG, ACT_SRC, JS_ACT } = require('./col2-relogin.js');
/* (11/10) 로그인 뒤 곧 다시 풀린 때(drops) 3시간 안 n번(기본 3 · 0이면 끔 · col2.json y24cfg.ppN)이면 스스로 다시 로그인 멈춤 */
const ppStop = (drops, t, n) => { n = n == null ? 3 : +n; return n > 0 && (drops || []).filter((x) => t - x < 3 * 3600e3).length >= n; };
/* (11/11 y24ops2 · 진단 11/11 14:10 '예스24 판매관리 로그인이 모든 PC에서 풀림 — HOME·JS-MAIN 번외가 같은 판매자 세션을 서로 끊는 핑퐁')
 *  🔒 예스24 세션을 쥘 PC 하나 — 웹앱 app_settings/platforms.y24Holder(기본 HOME · 정범님이 예스24 번외를 HOME에서 쓰심)를 이 PC 수집기가 feed cfg.holder로 넘겨줌
 *   · 쥔 PC만 로그인·스스로 다시 로그인·판매관리 읽기/쓰기 · 다른 PC 번외는 예스24 크롬을 닫고(로그아웃 안 함) '예스24는 ○○이 맡음'만 보임
 *   · 수집기가 아직 holder를 안 넘기는 옛 판이면 마지막으로 받은 값(y24-holder.json) → col2.json y24Holder → 기본 HOME
 *   · 쥔 PC가 소식이 없어도 저절로 넘기지 않음(핑퐁 막기) — 바꾸기는 웹앱 ⚙ 설정 › 🟦 예스24 › [이 PC가 예스24 맡기](두 번 누름)뿐 */
const HOLD_DEF = 'HOME';
const holdNm = (v) => String(v == null ? '' : v).trim().toUpperCase().slice(0, 40);
function holderOf(feedH, savedH, localH, def) { return holdNm(feedH) || holdNm(savedH) || holdNm(localH) || holdNm(def); }
const isHolder = (pc, h) => !h || holdNm(pc) === h; /* 맡은 PC를 정하지 않은 때(시험)만 누구나 */
/* (11/11 y24ops2) 「이미 로그인된 예스24」 화면 — 판매관리 로그인 화면이 POST /api/Login/AlreadyLoginedYes24Init 을 부르는 화면(진단 11/11: 11:40 뒤 36번 · 그 사이 주문 목록 401) → 되풀이 로그인하지 않고 멈춤 */
const ALREADY_RE = /AlreadyLogined/i;
const SAFE = /^\s*(조회|검색|조회하기|검색하기|찾기)\s*$/;
const DANGER = /저장|등록|발송|처리|삭제|취소|승인|출금|신청|확인|답변|수정|변경|전송|보내|접수|결제|환불|판매불가|중지|연장|적용|일괄/;
const SECRET = /login|logout|passw|pwd|auth|cert|token|member\/(info|modify)|sellerinfo/i; /* 수집기 rnY24와 같음 — 원문을 남기지 않는 길 */
const ORD_KINDS = ['NewOrderConfirmList', 'OrderDeliveryList'];
const JPATH = { ship: '/Order/OrderDeliveryList', ack: '/Order/NewOrderConfirmList' };
const KIND_RE = /\/api\/(Order\/(NewOrderConfirmList|OrderDeliveryList)|Product\/(ProductList))(?:\?|$)/i;
/* (11/11 y24ops1) 🧰 예스24 운영 화면 — 반품·교환 요청 · 반품현황 · 상품 문의 · 정산내역 · 배송중/정산예정을 정한 간격(기본 3시간)마다 이 숨은 탭에서 열고 [조회]만(읽기)
 *  받은 응답은 둘러보기·주문 읽기와 같은 줄로 올라감(수집기 y24UpOne · 손님 칸은 수집기가 가림) · 여기엔 건수만 남김(웹앱 🧰 예스24 운영 '할 일 숫자') · 근거: readnow-chats reports/yes24_raw GUIDE.md 3·4·5장 */
const OPS_PAGES = [{ k: 'ret', p: '/Claim/ReturnManagementS1', n: '반품·교환 요청(승인/거부)' }, { k: 'clm', p: '/Claim/CancelReturnList', n: '반품현황' }, { k: 'qa', p: '/CustomerService/QAList', n: '상품 문의' }, { k: 'plan', p: '/Order/CalculatePlannedList', n: '배송중/정산예정' }, { k: 'calc', p: '/Calculation/CalculationHistoryList', n: '정산내역' }];
/* 첫 화면 요약(POST /api/Common/GetMain) → 숫자만(손님 정보 없음 · 주소 칸은 버림) */
const MAIN_K = { ORDER_COUNT: 'ord', PREPARE_DELIVERY: 'prep', DELIVERING: 'deliv', COMPLETE_DELIVERY: 'done', RETURN_RECEIPT: 'retIn', RETURN_ENTERING: 'retGo', DEPOSIT: 'dep', POSTPONE: 'post', NOREPLY: 'noreply', ASSESSMENT: 'assess', VISITED: 'visit' };
/* (11/11 y24ops3) 판매중·품절·판매종료 상품 수(POST /api/Common/GetMainGoods) → 숫자만 */
function goodsSum(j) { if (!j || typeof j !== 'object') return null; const o = {}; let n = 0; for (const [k, v] of [['SELLING_ITEM', 'sell'], ['COMPLETE_ITEM', 'soldOut'], ['END_ITEM', 'end'], ['ENDING_10DAYS_BEFORE', 'end10']]) if (j[k] != null && j[k] !== '' && isFinite(+j[k])) { o[v] = +j[k]; n++; } return n ? o : null; }
function mainSum(j) { if (!j || typeof j !== 'object') return null; const o = {}; let n = 0; for (const [k, v] of Object.entries(MAIN_K)) if (j[k] != null && j[k] !== '' && isFinite(+j[k])) { o[v] = +j[k]; n++; } return n ? o : null; }
/* 상품 문의 응답 → 미답변 수(NO_ANSWER_COUNT) · 반품 요청 합계(SearchReturnTotal) */
function opsNum(u, j) { if (!j || typeof j !== 'object') return null; if (/\/api\/CustomerService\/QAList/i.test(u) && j.NO_ANSWER_COUNT != null && isFinite(+j.NO_ANSWER_COUNT)) return { qaNo: +j.NO_ANSWER_COUNT };
  if (/\/api\/Claim\/SearchReturnTotal/i.test(u)) { const o = {}; for (const [k, v] of [['RETURN_REQUEST', 'retReq'], ['RETURN_ENTER', 'retEnter'], ['RETURN_COMPLETE', 'retDone']]) if (j[k] != null && isFinite(+j[k])) o[v] = +j[k]; return Object.keys(o).length ? o : null; } return null; }
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
/* (11/12 login1 · 정범님 '번외가 3일째 예스24 로그인조차 못 함') 🔁 「이미 로그인된 예스24」 화면에서 '다른 곳 세션을 끊고 이 PC로 로그인'(이어받기) 단추 — 그 화면(주소에 AlreadyLogined 또는 화면 글 '이미 로그인')에서만 누름
 *  · 단추 글 꼴은 진단에 남김(btns · 값 없음) — 기존·다른 곳·이전 + 로그아웃·해제·끊·종료 / 강제·계속·이어서 로그인 / 로그아웃 후 로그인 · 취소·아니오·돌아가기·닫기·찾기·가입은 절대 안 누름
 *  · (auditfix 11/13 · 정밀 점검 11/12 ⑤) 넷째 후보(그냥 '로그인·확인·예·네')는 뺌 — 화면 글을 아직 못 본 채 '다른 곳 로그인 유지하고 돌아가기'가 '확인'이면 뜻과 반대로 누름 · 그런 화면은 누르지 않고 단추 글(btns)만 남겨 멈춤 → 글을 본 뒤 정확한 낱말로 */
const TAKE_PAGE = String.raw`/AlreadyLogined/i.test(location.pathname)||/이미\s*(다른\s*(곳|기기|PC|브라우저)에서\s*)?로그인(되어|된|중)/.test((document.body&&document.body.innerText||'').slice(0,4000))`;
const JS_TAKE = (click) => `(()=>{const pg=${TAKE_PAGE};const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.disabled;
const tx=(x)=>(x.innerText||x.value||x.alt||x.title||x.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,40);const NO=/취소|아니오|아니요|돌아가|이전\\s*화면|닫기|찾기|가입|메인으로|홈으로|고객센터/;
const B=[...document.querySelectorAll('button,a,input[type=button],input[type=submit],[role=button]')].filter((x)=>vis(x)&&tx(x));const btns=B.map(tx).slice(0,10);if(!pg)return{page:false,btns:[]};
const R=[/(기존|다른\\s*(곳|기기|PC|브라우저)|이전).{0,12}(로그아웃|해제|끊|종료)/,/(강제|계속|이어서|그래도)\\s*로그인/,/로그아웃\\s*(후|하고)\\s*로그인/];
let b=null,k=-1;for(let i=0;i<R.length&&!b;i++){b=B.find((x)=>R[i].test(tx(x))&&!NO.test(tx(x)));if(b)k=i}
if(!b)return{page:true,none:true,btns};const t=tx(b);if(${click ? 'true' : 'false'})b.click();return{page:true,did:${click ? 'true' : 'false'},btn:t,k,btns}})()`;
const isLoginUrl = (u) => { try { return /login/i.test(new URL(u).pathname); } catch (e) { return false; } };
const JS_CLICK = (ms) => `(async()=>{const SAFE=${SAFE},DANGER=${DANGER};const vis=(b)=>{try{return b.offsetParent!==null}catch(e){return false}};const t0=Date.now();
for(;;){const lg=/login/i.test(location.pathname)||!!document.querySelector('input[type=password]');if(lg)return{login:true};
let busy=false;try{const lb=document.getElementById('loading-bg');const cs=lb&&getComputedStyle(lb);busy=!!cs&&cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity!==0}catch(e){}
const L=[...document.querySelectorAll('button,a,input[type=button],input[type=submit]')].filter((b)=>{const t=(b.innerText||b.value||'').trim();return SAFE.test(t)&&!DANGER.test(t)&&vis(b)});
if(document.readyState==='complete'&&!busy&&L.length){L[0].click();return{clicked:true,n:L.length}}
if(Date.now()-t0>${ms})return{clicked:false};await new Promise((r)=>setTimeout(r,200))}})()`;

const { makeLearn } = require('./col2-y24learn.js');
function makeY24(o) { let REG = null, W = null;
  const { HOME, Browser, WIN, note, log, TEST } = o; const cfg = () => o.cfg(); const now = () => Date.now();
  const BASE = (TEST && process.env.RN_COL2_Y24 ? process.env.RN_COL2_Y24 : 'https://uscm.yes24.com').replace(/\/$/, ''); const HOST = new URL(BASE).host;
  const MARK = 'col2-y24-chrome'; const PROF = path.join(HOME, MARK);
  const TK_F = path.join(HOME, 'y24-takeover.json'); const TPL_F = path.join(HOME, 'y24-tpl.json'), JD_F = path.join(HOME, 'y24-jdone.json'), INV_F = path.join(HOME, 'y24-inv.json');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }; const wr = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (e) { log('예스24 파일 저장 실패: ' + e.message); } };
  const SC = TEST && +process.env.RN_COL2_Y24_SCALE > 0 ? +process.env.RN_COL2_Y24_SCALE : 1; /* 시험만 기다림을 줄임 — 실제는 1(사람 속도 그대로) */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const sleepR = (a, b) => sleep((a + Math.random() * (b - a)) * SC);
  const Y = { br: null, launching: null, login: 'unknown', loginAt: 0, loginMsg: '', loginWait: 0, shown: false, busy: false, msg: '', tpl: {}, hdr: null, learnK: null, calling: false, q: [], qBytes: 0, drop: 0, sentN: 0, recN: 0, seq: 0,
    ord: { at: 0, n: 0, err: null, next: 0, renewAt: 0 }, ops: null, opsNext: 0, main: null, opsNum: {}, prd: { at: 0, n: 0, pages: 0, err: null, on: false, next: 0 }, tour: null, tourNext: 0, menus: null, keepAt: 0,
    feed: { at: 0, cfg: null, hold: null, by: '' }, jobs: [], jres: {}, jstep: null, job: null, jd: rd(JD_F, {}), inv: rd(INV_F, {}), act: { src: null, at: 0, err: null }, day: { d: '', calls: 0, recs: 0 }, t: null, opens: [], fails: 0, lastErr: null };
  { const t = rd(TPL_F, {}); for (const [k, v] of Object.entries(t)) if (v && v.u) Y.tpl[k] = { u: v.u, b: v.b || '', m: v.m || 'POST', h: {}, at: +v.at || 0 }; }
  const saveTpl = () => { const o2 = {}; for (const [k, v] of Object.entries(Y.tpl)) o2[k] = { u: v.u, b: v.b, m: v.m, at: v.at }; wr(TPL_F, o2); }; /* 머리글은 파일에 안 남김 */
  const kday = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 10); const dayAdd = (k) => { const d = kday(); if (Y.day.d !== d) Y.day = { d, calls: 0, recs: 0 }; Y.day[k]++; };
  const C = () => ({ ordMin: 5, prdH: 24, tourH: 24, opsH: 3, keepMin: 20, feedMin: 5, takeover: true, tkHour: 3, ...(cfg().y24cfg || {}) }); /* (11/12 login1) takeover = 「이미 로그인된」에서 다른 곳 세션을 끊고 이어받기(기본 켬 · 옆 창 ⚙ › 🖥 이 PC만) · tkHour = 한 시간 이어받기 상한 */ /* 근거: 없음, 설정(col2.json y24cfg)으로 바꿈 · ordMin은 웹앱 설정(app_settings/platforms.y24.ordMin)을 수집기가 넘겨줌 */
  const ordMinNow = () => { const v = Y.feed.cfg && Y.feed.cfg.ordMin != null ? +Y.feed.cfg.ordMin : C().ordMin; return Number.isFinite(v) && v > 0 ? v : 0; };
  const pcName = () => String(cfg().pc || require('os').hostname() || '');
  const isLogger = () => /^LOGGER/i.test(pcName());
  const HOLD_F = path.join(HOME, 'y24-holder.json'); Y.holdF = rd(HOLD_F, {});
  const holder = () => holderOf(Y.feed.cfg && Y.feed.cfg.holder, Y.holdF.h, cfg().y24Holder, TEST ? process.env.RN_COL2_Y24_HOLDER_DEF || '' : HOLD_DEF); /* 시험은 맡은 PC를 정한 때만 규칙(다른 시험 PC 이름 그대로) */
  const mine = () => isHolder(pcName(), holder());
  /* (11/12 login1) 🔁 이어받기 기록(y24-takeover.json · 값 없음) — kicks = 다른 곳 로그인으로 이 PC 세션이 끊긴 때 · tries = 이어받기를 해 본 때 · last = 마지막 결과 · btns = 「이미 로그인된」 화면에서 본 단추 글(진단용) */
  const TK = rd(TK_F, {}); TK.kicks = Array.isArray(TK.kicks) ? TK.kicks : []; TK.tries = Array.isArray(TK.tries) ? TK.tries : []; TK.okN = +TK.okN || 0;
  const tkSave = () => { const t = now(); TK.kicks = TK.kicks.filter((x) => t - x < 86400e3).slice(-40); TK.tries = TK.tries.filter((x) => t - x < 86400e3).slice(-40); wr(TK_F, TK); };
  const tkOn = () => C().takeover !== false;
  const tkHourN = () => TK.tries.filter((x) => now() - x < 3600e3).length;
  const tkMax = () => Math.max(1, Math.min(10, +C().tkHour || 3));
  /* 지금 이어받기를 해도 되나 → '' | 까닭(로거·맡지 않은 PC·출고 중·꺼 둠·한 시간 상한) */
  function tkWhy() { if (!tkOn()) return '이어받기를 꺼 둠(옆 창 ⚙ › 🖥 이 PC만 › 🟦 예스24 다른 곳 로그인 이어받기)'; if (isLogger()) return '로거 PC(약속 0)'; if (!mine()) return notMineMsg(); if (holdOn()) return '🚚 출고 중 — 끝난 뒤 이어받음(약속 0-1)';
    if (tkHourN() >= tkMax()) { const nx = Math.min(...TK.tries.filter((x) => now() - x < 3600e3)) + 3600e3; return `이어받기 한 시간 ${tkMax()}번까지 — ${new Date(nx + 9 * 3600e3).toISOString().slice(11, 16)} 뒤 다시(서로 끊기 되풀이 막기)`; } return ''; }
  const kst = (t) => new Date(t + 9 * 3600e3).toISOString().slice(11, 16);
  function tkKick(why) { TK.kicks.push(now()); TK.lastKick = { at: now(), why: String(why || '').slice(0, 80) }; tkSave(); }
  /* 웹앱·옆 창에 보이는 짧은 한 줄(번외 상태 글 앞에 붙음 · 200자 안) */
  function tkLine() { const t = now(); const k = TK.kicks.filter((x) => t - x < 86400e3); const ok = TK.tries.filter((x) => t - x < 86400e3).length; if (!k.length && !ok) return '';
    return `🔁 오늘 다른 곳 로그인에 ${k.length}번 끊김${k.length ? '(마지막 ' + kst(k[k.length - 1]) + ')' : ''} → ${pcName()}가 다시 가져옴 ${TK.okN && TK.last && TK.last.ok ? '✓' : ''}${ok}번 · 다른 곳에서 판매관리를 열면 ${pcName()}가 다시 가져감`; }
  /* 「이미 로그인된」 화면에서 이어받기 단추를 누름 — doLogin(col2-relogin)이 [로그인]을 누른 뒤·로그인 칸을 못 찾은 때 부름 · 로그인 중(Y.inLogin)일 때만 */
  async function takeover(evx) { const E = evx || ev; let r = null; try { r = await E(JS_TAKE(false), 8000); } catch (e) { return { did: false, why: '화면 읽기 실패' }; }
    if (!r || !r.page) return { did: false, page: false }; const w = tkWhy(); if (w) return { did: false, page: true, why: '이어받지 않음 — ' + w }; TK.btns = (r.btns || []).slice(0, 10); if (r.none) { tkSave(); note(`⛔ 「이미 로그인된 예스24」 화면에서 이어받기 단추를 못 찾음 — 화면 단추: ${(r.btns || []).join(' · ') || '없음'}(진단에 남김 · 다음 판에서 맞춤)`); return { did: false, page: true, none: true, why: '이어받기 단추를 못 찾음(화면 단추: ' + (r.btns || []).join(' · ').slice(0, 80) + ')' }; }
    TK.tries.push(now()); TK.last = { at: now(), ok: null, btn: r.btn }; tkSave(); try { r = await E(JS_TAKE(true), 8000); } catch (e) {}
    note(`🔁 예스24 「이미 로그인된」 화면 — 다른 곳(정범님 휴대폰·다른 크롬 등)의 판매관리 세션을 끊고 ${pcName()}가 이어받음: [${(r && r.btn) || TK.last.btn}] 누름(이번 시간 ${tkHourN()}/${tkMax()}번 · 끄기: 옆 창 ⚙ › 🖥 이 PC만) · 다른 곳에서 판매관리를 열면 ${pcName()}가 다시 가져갑니다`);
    return { did: true, page: true, btn: (r && r.btn) || TK.last.btn }; }
  const enabled = () => !!cfg().on && (cfg().y24 == null ? !TEST : cfg().y24 !== false) && !isLogger() && mine(); /* 시험에선 켤 때만(다른 시험의 크롬 수를 바꾸지 않게) · (11/11) 예스24를 맡은 PC만 */
  const notMineMsg = () => `🔒 예스24는 ${holder()}이(가) 맡음 — 이 PC 번외는 예스24 로그인·읽기·쓰기를 하지 않음(같은 판매자 세션을 서로 끊지 않게 · 바꾸려면 웹앱 ⚙ 설정 › 🟦 예스24 › [이 PC가 예스24 맡기])`;
  const jobsOn = () => cfg().y24Jobs !== false;
  const feedOk = () => now() - Y.feed.at < C().feedMin * 60e3;
  const holdOn = () => !!(feedOk() && Y.feed.hold && Y.feed.hold.on);
  const alive = () => !!(Y.br && Y.br.alive());

  /* ── 크롬(이 프로필만) ── */
  function prefsNoPw() { try { const d = path.join(PROF, 'Default'); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, 'Preferences'); let P = {}; try { P = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) {}
      if (P.credentials_enable_service === false && P.profile && P.profile.password_manager_enabled === false && P.profile.password_manager_leak_detection === false && P.session && P.session.restore_on_startup === 1) return; P.credentials_enable_service = false; P.profile = { ...(P.profile || {}), password_manager_enabled: false, password_manager_leak_detection: false }; P.session = { ...(P.session || {}), restore_on_startup: 1 }; fs.writeFileSync(f, JSON.stringify(P)); } catch (e) {} } /* 크롬이 아이디·비밀번호를 저장하겠느냐고 묻지 않게(이 프로필만)
   *  (정범님 11/10 '예스24 로그인이 계속 풀림' 조사) ① restore_on_startup 1 = '중단한 위치에서 계속' — 판매관리 로그인 쿠키가 '세션 쿠키'(끝나는 날 없음)면 크롬을 닫았다 다시 띄울 때(도우미 새 판·PC 재시작·크롬 다시 띄우기) 지워져 로그인이 풀렸음 → 이 설정이면 크롬이 세션 쿠키를 지켜 둠(이 프로필만 · 정범님 크롬은 그대로)
   *  ② password_manager_leak_detection 끔 = 스스로 다시 로그인 때 이 숨은 크롬이 '비밀번호가 유출됨' 확인을 하거나 그 창을 띄우지 않게 */
  const REQ = new Map(); const LN = makeLearn({ HOME, note, now }); /* (11/11 y24ops3) 🎓 배우기 모드 — helper/col2-y24learn.js */
  function onEv(m, p, sid) { const br = Y.br; if (!br || sid !== br.sid) return;
    if ((m === 'Page.frameNavigated' && p.frame && !p.frame.parentId) || (m === 'Page.navigatedWithinDocument' && p.url)) { pageSeen(m === 'Page.frameNavigated' ? p.frame.url : p.url); return; }
    if (m === 'Network.requestWillBeSent') { let u; try { u = new URL(p.request.url); } catch (e) { return; } if (u.host !== HOST || !/\/api\//i.test(u.pathname)) return; if (ALREADY_RE.test(u.pathname)) alreadySeen('로그인 화면 ' + u.pathname.slice(0, 50)); const pu = u.pathname + u.search;
      const it = { m: p.request.method, u: pu, post: p.request.postData || '', h: p.request.headers || {}, mine: Y.calling, page: (() => { try { return new URL(br.frameUrl || BASE).pathname; } catch (e) { return '/'; } })(), at: now() }; REQ.set(p.requestId, it); if (REQ.size > 300) REQ.delete(REQ.keys().next().value);
      if (!it.post && p.request.hasPostData) br.cdp.send('Network.getRequestPostData', { requestId: p.requestId }, sid).then((x) => { it.post = (x && x.postData) || ''; learnFrom(it); LN.req(p.requestId, it); }).catch(() => {}); else { learnFrom(it); LN.req(p.requestId, it); }
      if (!Y.calling) Y.hdr = { h: it.h, at: now() }; return; }
    if (m === 'Network.responseReceived') { const it = REQ.get(p.requestId); if (it) { it.st = p.response.status; it.ct = (p.response.headers && (p.response.headers['content-type'] || p.response.headers['Content-Type'])) || p.response.mimeType || ''; } return; }
    if (m === 'Network.loadingFailed') { REQ.delete(p.requestId); return; }
    if (m === 'Network.loadingFinished') { const it = REQ.get(p.requestId); if (!it) return; REQ.delete(p.requestId);
      br.cdp.send('Network.getResponseBody', { requestId: p.requestId }, sid).then((b) => { LN.resp(p.requestId, it.st, b && !b.base64Encoded ? b.body : ''); take(it, b); }).catch(() => { LN.resp(p.requestId, it.st, ''); take(it, null); }); return; }
    if (m === 'Page.javascriptDialogOpening') { onDialog(p); } }
  function learnFrom(it) { if (it.mine || !Y.learnK) return; const k = (it.u.match(KIND_RE) || []); const name = k[2] || k[3]; if (!name) return; if (Y.learnK !== '*' && Y.learnK !== name) return; Y.tpl[name] = { u: it.u, b: it.post || '', m: it.m || 'POST', h: it.h, at: now() }; saveTpl(); }
  /* 받은 응답 → 수집기와 같은 꼴 줄 · 로그인·비밀번호 길은 원문을 남기지 않음 · 파일(엑셀 등)은 크기·종류만 */
  function take(it, b) { const sig = (it.m || 'GET').toUpperCase() + ' ' + it.u.split('?')[0]; const sec = SECRET.test(it.u.split('?')[0]); let text = '';
    if (b) text = b.base64Encoded ? JSON.stringify({ file: true, ctype: it.ct || '', bytes: Math.round(String(b.body || '').length * 0.75) }) : String(b.body || '');
    const isJ = /json/i.test(it.ct || '') || /^\s*[\[{]/.test(text.slice(0, 2)); if (/\/api\/Product\/ProductList(?:\?|$)/i.test(it.u) && !it.mine) Y.plAt = now(); /* (11/11 y24w) 화면이 [조회]로 받은 등록상품 목록 — 예스24 쓰기가 '응답이 왔는지' 봄 */ if (isJ && /\/api\/(Common\/GetMain|Common\/GetMainGoods|CustomerService\/QAList|Claim\/SearchReturnTotal)(?:\?|$)/i.test(it.u) && +it.st === 200) { try { const jj = JSON.parse(text); if (/GetMainGoods/i.test(it.u)) { const g = goodsSum(jj); if (g) Y.goods = { ...g, at: now() }; } const m = /GetMain(?:\?|$)/i.test(it.u) ? mainSum(jj) : null; if (m) Y.main = { ...m, at: now() }; const x = opsNum(it.u, jj); if (x) Y.opsNum = { ...Y.opsNum, ...x, at: now() }; } catch (e) {} } /* (11/11 y24ops1) 숫자만 */ if (/\/api\/Menu\/GetMenus/i.test(it.u) && !Y.menus) { try { const mm = pickMenus(JSON.parse(text)); if (mm && mm.length) Y.menus = mm; } catch (e) {} }
    if (Y.tourCur && it.page && it.page.toLowerCase() === Y.tourCur && !/\/api\/(Common|Menu)\//i.test(it.u) && isJ) { try { Y.tourResp = { cnt: y24Cnt(JSON.parse(text)), at: now() }; } catch (e) {} }
    const rec = { id: 'c2y' + now().toString(36) + (++Y.seq).toString(36), sig, url: it.u, page: it.page || '/', at: it.at || now(), status: it.st || 0, ctype: String(it.ct || '').slice(0, 60), req: sec ? null : String(it.post || '').slice(0, 4000), json: isJ, body: sec ? null : text.slice(0, 1500000), src: 'col2' };
    const sz = rec.body ? rec.body.length : 0; Y.q.push(rec); Y.qBytes += sz; Y.recN++; dayAdd('recs'); while (Y.q.length > 200 || Y.qBytes > 6e6) { const x = Y.q.shift(); Y.qBytes -= x && x.body ? x.body.length : 0; Y.drop++; } }
  function onDialog(p) { const br = Y.br; const j = Y.job; let accept = false; const msg = String(p.message || '').slice(0, 120);
    if (LN.L.on && !(REG && REG.cur()) && !(W && W.cur()) && !j && !Y.inLogin) { LN.dialog(p); return; } /* (11/11 y24ops3) 🎓 배우기 중 — 확인 물음은 사람이 그 창에서 답함(번외는 답하지 않고 글 꼴만 남김) */
    if (REG && REG.cur()) accept = REG.dialog(p);
    else if (W && W.cur()) accept = W.dialog(p); /* (11/11 y24w) 🟦 예스24 쓰기 일 동안만 — 그 [수정항목 저장]·[변경] 확인 물음에만 '예' */ /* (11/10 y24auto) 🟦 자동 올림 일 동안만 — 그 [등록] 확인 물음에만 '예' */
    else if (j) { const ship = j.kind === 'ship'; const OK = ship ? /발송\s*처리/ : /접수\s*확인|주문\s*접수|접수\s*하시/; const BAD = /취소|판매\s*불가|삭제|지정\s*택배|반품|교환|환불/; accept = p.type === 'alert' || (OK.test(msg) && !BAD.test(msg)); if (!accept) j.refused = msg; (j.msgs = j.msgs || []).push(msg); }
    else if (Y.inLogin) { accept = DLG(p.type, msg); Y.loginDlg = msg; if (p.type !== 'alert') note(`🔐 예스24 로그인 중 물음 '${msg}' → ${accept ? '예' : '아니오'}`); }
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
  /* (11/13 home2 · 정범님 '로그인 정보를 저장했는데 왜 자꾸 손으로 다시 로그인하라고 하나') 확실한 '로그인 살아 있음' 확인
   *  근거(진단 11/13 01:03Z HOME): 저장된 계정 있음 · 스스로 다시 로그인 켬 · 마지막 시도는 '됨'(실패 글 없음)인데 하루 10번을 다 씀 · 같은 날 '창 주소가 로그인 화면으로 바뀜(/Login/Login)' 끊김 4번 · 이어받기 0번
   *  → 판매관리는 한 장 화면이라, 첫 화면(/)은 load가 끝난 순간엔 주소 '/'·비밀번호 칸 없음(살아 있어 보임)이고 그 뒤 화면 코드가 세션을 물어 /Login/Login으로 옮김
   *    예전 확인은 load 직후 한 번만 봐 '됨'으로 끝냄 → 6초 뒤 창 주소 감시가 '끊김'으로 셈 → 5분 뒤 또 다시 로그인 … 되풀이로 하루 10번을 씀(사람 손 필요로 보임)
   *  → 처음 화면을 연 뒤 liveSec초(기본 8 · 창 주소 감시 6초보다 김) 동안 1초마다 보고, 한 번이라도 로그인 화면·비밀번호 칸이면 '안 됨' · 근거: 6초 규칙(0.1.38) + 여유 2초 */
  async function liveCheck() { const t0 = now(); await nav(BASE + '/', 30); const n = Math.max(1, Math.round(C().liveSec != null ? +C().liveSec : TEST ? 2 : 8)); /* 시험은 짧게(시험마다 RN_COL2 liveSec로 늘림) */ for (let i = 0; i < n; i++) { const s = await ev(JS_STATE).catch(() => null); if (isLoginSt(s)) return false; if (Y.pg && Y.pg.login && Y.pg.at >= t0) return false; await sleep(TEST ? 300 : 1000); } const s2 = await ev(JS_STATE).catch(() => null); return !isLoginSt(s2); }
  /* (11/11 정범님 '실제로는 로그아웃인데 번외가 잘못 인식') 창의 실제 주소로도 판정 — 본 창이 로그인 화면(/Login/…)으로 가면 '살아 있음'을 곧바로 '로그인 필요'로 · 화면 표시(sum.pg)도 그 주소대로 */
  /* (11/11 y24ops2) 「이미 로그인된 예스24」 화면을 봄 → 스스로 다시 로그인·주문 다시 배우기를 멈춤(사람이 [🔐 예스24 로그인]을 누르거나 세션이 다시 살아나면 풀림) */
  function alreadySeen(where) { if (Y.login === 'wait') return; /* 사람이 [🔐 예스24 로그인]으로 연 창 — 그 화면에서 사람이 이어 감 */ const t = now(); Y.already = { at: t, n: ((Y.already && Y.already.n) || 0) + 1, where: String(where || '').slice(0, 60), first: (Y.already && Y.already.first) || t };
    if (!Y.alNoted || t - Y.alNoted > 3600e3) { Y.alNoted = t; if (!tkWhy()) note(`🔁 「이미 로그인된 예스24」 화면이 뜸(${Y.already.where}) — 같은 계정이 다른 곳에서 로그인해 이 PC 세션이 끊김 · 저장된 계정으로 곧 이어받음(다른 곳 세션을 끊고 ${pcName()}가 다시 가져감)`); else note(`⛔ 「이미 로그인된 예스24」 화면이 뜸(${Y.already.where}) — 되풀이 로그인하지 않고 멈춤 · 까닭: 같은 예스24 계정이 다른 곳(다른 PC 번외·사람 크롬)에서 로그인돼 이 PC 세션이 끊김 · 예스24를 맡은 PC(${holder()})에서 옆 창 [🔐 예스24 로그인]을 한 번 누르면 풀림`); }
    if (Y.login === 'ok' && !Y.inLogin) setLogin('need', '「이미 로그인된 예스24」 화면 — 다른 곳 로그인으로 세션이 끊김'); }
  function pageSeen(u) { let pth = ''; try { pth = new URL(u).pathname; } catch (e) {} if (ALREADY_RE.test(pth)) alreadySeen('창 주소 ' + pth.slice(0, 40)); const lg = isLoginUrl(u); Y.pg = { login: lg, p: pth.slice(0, 60), at: now() }; if (lg && Y.login === 'ok' && !Y.inLogin) { const at = Y.pg.at; setTimeout(() => { if (Y.pg && Y.pg.at === at && Y.pg.login && Y.login === 'ok' && !Y.inLogin) setLogin('need', '창 주소가 로그인 화면으로 바뀜(' + pth.slice(0, 40) + ')'); }, TEST ? 1200 * SC : 6000); } }
  /* (0.1.38 y24chk · 11/12 진단) 창 주소가 로그인 화면을 '잠깐' 지나간 것만으로 '다른 곳 로그인에 끊김'으로 세지 않음 — 17:48:00 번외 쓰기가 등록상품 화면을 연 같은 순간(0.4초 차) '끊김'이 하나 세였는데 세션은 살아 있어 15초 뒤 같은 맡김이 표의 칸까지 감(다시 로그인 0번)
   *  → 6초 뒤에도 그 창이 그대로 로그인 화면일 때만 '로그인 필요'·끊김 셈(진짜로 풀렸으면 6초 늦게 알 뿐 · 다른 길의 JS_STATE 판정은 그대로) · 근거: 없음 — 화면 하나가 다 열리는 시간 */
  /* 그 창에서 사람이 지금 입력하는 중인가 — 마지막 진짜 키·마우스가 humanSec초(기본 90) 안이면 참 · 그 창을 막 띄운 뒤 humanSec초 동안도 참(사람이 자리에 올 때까지) */
  const humanMs = () => (C().humanSec == null ? 90 : +C().humanSec) * 1000 * (TEST ? SC : 1);
  async function humanNow() { let a = null; try { a = await ev(JS_ACT, 5000); } catch (e) { a = null; } const since = now() - (Y.loginWait || 0); if (a && a.age != null && a.age < humanMs()) return { busy: true, why: `예스24 창에서 사람이 입력하는 중(마지막 입력 ${Math.round(a.age / 1000)}초 전)` };
    if ((!a || a.age == null) && since < humanMs()) return { busy: true, why: `예스24 로그인 창을 띄운 지 ${Math.round(since / 1000)}초 — 사람이 칠 수 있게 ${Math.round(humanMs() / 1000)}초 기다림` }; return { busy: false, age: a && a.age }; }
  async function endWait(why) { if (Y.login !== 'wait') return; Y.login = 'need'; Y.loginMsg = why; note('🔐 예스24 로그인 창에서 입력이 없어 기다림을 끝냄 — ' + why); await hide('입력 없음').catch(() => {}); }
  function setLogin(st, why) { if (st === 'ok' && (Y.already || Y.reWhy || Y.loginMsg)) { Y.already = null; Y.reWhy = null; Y.loginMsg = null; } /* (rel10 · verify2) 로그인이 살아 있음이 확인되면 옛 경고(「이미 로그인된」 화면 시각·다시 로그인 까닭·로그인 필요 글)를 지움 — 이미 ok였어도 */ if (Y.login !== st) { if (st === 'need' && Y.login === 'ok' && Y.loginAt && now() - Y.loginAt < (C().ppMin == null ? 30 : +C().ppMin) * 60e3) { Y.drops = (Y.drops || []).filter((t) => now() - t < 3 * 3600e3).concat([now()]); } if (st === 'need' && Y.login === 'ok' && !Y.inLogin) tkKick(why); if (st === 'need' && Y.login === 'ok' && !Y.inLogin) { try { o.relogin && o.relogin.dropAfterOk && o.relogin.dropAfterOk('y24', why); } catch (e) {} } /* (11/13 home2) 다시 로그인 '됨' 뒤 몇 분 안에 풀림 = 실제로는 안 됨 */ Y.login = st; if (st === 'need') { note('🔐 예스24 로그인이 필요 — 옆 창의 [🔐 예스24 로그인] 단추를 한 번 눌러 주세요(' + (why || '') + ')'); Y.loginMsg = why || ''; } if (st === 'ok') { Y.loginAt = now(); Y.already = null; if (TK.last && TK.last.ok == null) { TK.last.ok = true; TK.okN++; tkSave(); } try { o.relogin && o.relogin.okSeen && o.relogin.okSeen('y24'); } catch (e) {} note('🟦 예스24 로그인 세션 살아 있음 — 판매관리 읽기 시작'); } } }
  /* 화면을 열고 [조회](읽기 단추)만 눌러 그 화면이 보내는 조건 모양·머리글을 배움 · 그 응답도 그대로 줄에 들어감(사람이 화면에서 [조회]를 누른 것과 같음) */
  async function learn(pg, k) { const r0 = await learn0(pg, k); try { const AGX = require('./col2-ag.js').get(); if (AGX) AGX.obs('y24_ops', 'learn', { n: 1, ok: r0 === 'ok' ? 1 : 0, why: r0 === 'ok' ? null : r0 === 'login' ? '로그인 필요' : r0 === 'nobtn' ? '[조회] 단추 없음' : '조건을 못 배움' }); } catch (e) {} return r0; } /* (0.1.43 adapt10) 🔄 조건 다시 배우기도 길 하나로 셈 */
  async function learn0(pg, k) { const t0 = now(); Y.learnK = k || '*'; try { await nav(BASE + pg, 30); const s = await ev(JS_STATE); if (isLoginSt(s)) return 'login'; const c = await ev(JS_CLICK(15000 * SC + 2000), 30000); if (c && c.login) return 'login'; if (!c || !c.clicked) return 'nobtn';
      for (let i = 0; i < 40 && k && !(Y.tpl[k] && Y.tpl[k].at >= t0); i++) await sleep(200); await sleep(300); return !k || (Y.tpl[k] && Y.tpl[k].at >= t0) ? 'ok' : 'notpl'; } finally { Y.learnK = null; } }
  async function callTpl(k, bodyOver) { const t = Y.tpl[k]; const { body, isJ } = bodyOver ? { body: bodyOver.body, isJ: bodyOver.isJ } : ordShift(t); const H = hdrFresh(t.h, Y.hdr && Y.hdr.h); if (isJ && !Object.keys(H).some((x) => /content-type/i.test(x))) H['Content-Type'] = 'application/json';
    const page = pageOf(t.u); let cur = ''; try { cur = new URL(Y.br.frameUrl || '').host; } catch (e) {} if (cur !== HOST) { await nav(BASE + page, 30); const s = await ev(JS_STATE); if (isLoginSt(s)) return { st: 0, login: true }; }
    Y.calling = true; dayAdd('calls');
    const t0 = now(); try { const R = await ev(`(async()=>{try{const r=await fetch(${JSON.stringify(t.u)},{method:${JSON.stringify(t.m || 'POST')},headers:${JSON.stringify(H)},body:${JSON.stringify(body)},credentials:'include',cache:'no-store'});const tx=await r.text();let j=null;try{j=JSON.parse(tx)}catch(e){}
      const L=j&&(j.PRODUCT_LIST||j.RESULT_LIST||j.LIST);return{st:r.status,ok:!!j,n:Array.isArray(L)?L.length:null,ids:Array.isArray(L)?L.map((z)=>String(z&&z.GOODS_NO||'')).slice(0,500):null,login:/login/i.test(new URL(r.url).pathname)}}catch(e){return{st:0,ok:false,err:String(e.message||e)}}})()`, 45000);
      /* (0.1.43 adapt10) 🔄 예스24 운영 읽기 성적 — 배운 조건으로 바로 부름(tpl) · 칸(목록 줄 수) */ try { const AGX = require('./col2-ag.js').get(); if (AGX && R) { const good = R.st === 200 && R.ok && !R.login; AGX.obs('y24_ops', 'tpl', { n: 1, ok: good ? 1 : 0, ms: now() - t0, why: good ? null : R.login ? '로그인 화면으로 감' : R.err || ('HTTP ' + R.st) }); if (good) AGX.fill('y24_ops', { ['n_' + String(k).slice(0, 20)]: { tpl: R.n } }); } } catch (e) {} return R; }
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
  async function login(why) { if (!cfg().on) return { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' }; if (isLogger()) return { ok: false, err: '로거 PC에서는 예스24 로그인을 하지 않습니다(약속 0)' }; if (!mine()) return { ok: false, err: notMineMsg() }; Y.already = null; Y.drops = []; Y.reWhy = null; /* 사람이 누름 = 핑퐁 의심 멈춤도 풂 */ /* (11/11) 사람이 누른 로그인 = 「이미 로그인된」 멈춤을 풂 */ if (!enabled()) return { ok: false, err: '예스24 판매관리 읽기가 꺼져 있음(옆 창에서 켜기)' };
    for (let k = 0; k < 60 && Y.busy; k++) await sleep(500); if (Y.busy) return { ok: false, err: '다른 일을 하는 중 — 잠시 뒤 다시' };
    Y.busy = true; try { await ensure('로그인'); await nav(BASE + '/', 30); const s = await ev(JS_STATE); if (!isLoginSt(s)) { setLogin('ok'); return { ok: true, msg: '이미 로그인돼 있음 — 할 일 없음' }; }
      Y.login = 'wait'; Y.loginWait = now(); Y.already = null; await Y.br.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: ACT_SRC }, Y.br.sid).catch(() => {}); await ev(ACT_SRC, 5000).catch(() => {}); await show(why || '로그인'); return { ok: true, msg: '예스24 창을 앞으로 꺼냄 — 그 창에서 로그인하면 저절로 숨고 읽기를 시작합니다(아이디·비밀번호는 저장하지 않음)' }; }
    catch (e) { return { ok: false, err: e.message }; } finally { Y.busy = false; } }
  async function loginPoll() { if (Y.login !== 'wait') return; if (now() - Y.loginWait > 15 * 60e3) { Y.login = 'need'; await hide('로그인 기다림 15분 넘음').catch(() => {}); return; } let s = null; try { s = await ev(JS_STATE, 5000); } catch (e) { return; }
    if (s && !isLoginSt(s) && s.rs === 'complete') { setLogin('ok'); await hide('로그인 됨').catch(() => {}); Y.ord.next = now() + 3000; } }
  /* (11/10 정범님 '예스24가 자주 로그아웃돼 — 스스로 다시 로그인') 🔐 저장된 계정(col2-cred · DPAPI)으로 한 번 — 언제·얼마나는 col2-relogin.js(출고 중·로거·속도 제한·보안 문자면 안 함) */
  /* (정범님 11/10 '예스24 로그인이 계속 풀림') 로그인 뒤 30분 안에 다시 풀리는 일이 3시간에 3번이면 = 다른 곳(정범님 크롬·다른 PC 번외)에서 같은 계정으로 로그인해 서로 끊는 것으로 의심 → 스스로 다시 로그인을 멈추고 알림(서로 끊기를 되풀이하지 않게) */
  /* 진짜 Enter 키 한 번(DevTools 입력 — 사람이 친 것과 같은 trusted 이벤트) */
  async function keyPress(sid) { const b = Y.br; const k = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }; await b.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...k, text: '\r' }, sid); await sleep(60); await b.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k }, sid); }
  const quickDrops = () => (Y.drops || []).filter((t) => now() - t < 3 * 3600e3).length;
  async function autoRe() { const R = o.relogin; if (!R) return ''; if (!mine()) return notMineMsg(); if (Y.already && tkWhy()) return `「이미 로그인된 예스24」 화면(${Y.already.n}번 · 처음 ${new Date(Y.already.first + 9 * 3600e3).toISOString().slice(11, 16)}) — 되풀이 로그인하지 않고 멈춤(이어받기 안 하는 까닭: ${tkWhy()}) · 맡은 PC에서 [🔐 예스24 로그인]을 한 번 누르면 풀림`; if (!feedOk()) return '이 PC 수집기(다리)가 안 보임'; if (ppStop(Y.drops, now(), C().ppN)) { if (!Y.ppNoted || now() - Y.ppNoted > 3600e3) { Y.ppNoted = now(); note('⛔ 예스24 로그인이 로그인 뒤 30분 안에 3번 풀림 — 다른 곳(정범님 크롬·다른 PC 번외)에서 같은 계정으로 로그인해 서로 끊는 것으로 의심 · 스스로 다시 로그인을 3시간 멈춤 · 예스24 읽기는 한 PC에서만 켜 두세요'); } return '로그인 뒤 금방 다시 풀림 3번 — 다른 곳 로그인과 서로 끊기는 것으로 의심해 멈춤(3시간)'; } const w = R.why('y24', { hold: holdOn() }); if (w) return w;
    Y.inLogin = true; Y.loginDlg = ''; let r; try { r = await R.run('y24', { name: '예스24 판매관리', shape: true, takeover: tkOn() ? () => takeover() : null, loginUrl: BASE + '/', nav, ev, sleep: sleepR, type: (t) => Y.br.cdp.send('Input.insertText', { text: t }, Y.br.sid), key: (k) => keyPress(Y.br.sid), lastMsg: () => Y.loginDlg, leaveSec: TEST ? 3 : 15, settle: () => sleep(TEST ? 300 : 1500), check: () => liveCheck() }); } finally { Y.inLogin = false; }
    if (!r.ok && TK.last && TK.last.ok == null && r.tk) { TK.last.ok = false; TK.last.why = String(r.why || '').slice(0, 160); tkSave(); }
    if (r.ok) { if (r.tk) Y.already = null; setLogin('ok'); Y.keepAt = now(); Y.ord.next = now() + 3000; return 'ok'; } return r.why; }
  /* (11/11 y24ops4 · 진단 11/11 23:45 — HOME 세션이 다른 곳 로그인에 끊겨 「이미 로그인된 예스24」에서 멈춤 · 정범님이 HOME 앞에 없으면 아무도 못 풂) 🔐 원격 '다시 로그인 한 번'
   *  웹앱(아무 기기)에서 사람이 두 번 눌러 col2_y24_cmd {k:'relogin'} → 맡은 PC 수집기 → POST /y24/re1 → 「이미 로그인된」 멈춤·핑퐁 멈춤을 풀고 저장된 계정으로 스스로 다시 로그인을 한 번
   *  · 저장된 계정이 없으면 아무것도 안 풂(사람이 그 PC 옆 창에서) · 다른 곳 세션이 아직 살아 있으면 다시 「이미 로그인된」에서 멈춤(한 번뿐 · 되풀이 없음 · 남의 세션을 끊는 단추는 누르지 않음) */
  function reOnce(by) { if (isLogger()) return { ok: false, err: '로거 PC에서는 예스24 로그인을 하지 않습니다(약속 0)' }; if (!mine()) return { ok: false, err: notMineMsg() }; if (!enabled()) return { ok: false, err: '번외 예스24가 꺼져 있음' };
    const r = reState(); if (!r.has) return { ok: false, err: '이 PC 번외 ⚙ › 🔐 스스로 다시 로그인에 저장된 예스24 계정 없음 — 이 PC 옆 창 [🔐 예스24 로그인]으로' }; if (!r.on) return { ok: false, err: '스스로 다시 로그인을 꺼 둠(번외 ⚙ › 🔐)' };
    if (Y.login === 'ok') return { ok: true, msg: '이미 로그인 됨 — 할 일 없음', already: true }; const was = Y.already; Y.already = null; Y.drops = []; Y.reWhy = null; note(`🔐 ${String(by || '').slice(0, 40)} 원격 요청 — 저장된 계정으로 예스24 다시 로그인 한 번${was ? `(「이미 로그인된」 멈춤 ${was.n}번을 풂)` : ''}`); kick(200);
    return { ok: true, msg: '저장된 계정으로 다시 로그인을 곧 한 번 해 봄 — 다른 곳 세션이 아직 살아 있으면 다시 「이미 로그인된」에서 멈춤' }; }
  /* (정범님 11/10 '저장을 누르면 먼저 맞는지 확인') 🔐 ⚙ › 🔐 [확인하고 저장] — 넣은 아이디·비밀번호로 이 PC 번외 예스24 크롬에서 실제로 로그인해 봄 → 맞을 때만 저장(부른 쪽)
   *  · 지금 세션이 살아 있으면 따로 된 임시 창(쿠키가 따로인 브라우저 맥락 · 닫으면 사라짐)에서 해 봄 — 살아 있는 세션 쿠키를 덮거나 로그아웃하지 않음
   *  · 세션이 풀려 있으면 그 자리(본 창)에서 로그인 = 확인과 다시 로그인을 한 번에 · 출고 중·로거·꺼짐이면 확인하지 않고 까닭 */
  async function verify(id, pw, x) { x = x || {}; const ph = (t) => (x.phase ? x.phase(t) : null); if (isLogger()) return { ok: false, why: '로거 PC에서는 예스24 계정을 쓰지 않습니다(약속 0)' }; if (!mine()) return { ok: false, wait: true, why: notMineMsg() }; if (!cfg().on) return { ok: false, wait: true, why: '번외 수집이 꺼져 있어 확인할 수 없음 — 먼저 켜기' }; if (!enabled()) return { ok: false, wait: true, why: '🟦 예스24 판매관리 읽기가 꺼져 있어 확인할 수 없음 — 그 칸을 켠 뒤 다시' };
    if (holdOn()) return { ok: false, wait: true, why: '🚚 출고 중 — 끝난 뒤 다시 저장해 주세요(약속 0-1)' }; if (Y.login === 'wait') { ph('예스24 창에서 사람이 입력하는 중인지 보는 중'); const hn = await humanNow(); if (hn.busy) return { ok: false, wait: true, why: hn.why + ' — 끝난 뒤 다시' }; await endWait('⚙ › 🔐 [확인하고 저장] — 창에 입력이 없어 번외가 넣은 값으로 확인'); }
    ph('예스24가 하던 읽기가 끝나기를 기다리는 중'); for (let k = 0; k < 60 && Y.busy; k++) await sleep(500); if (Y.busy) return { ok: false, wait: true, why: '예스24가 다른 읽기를 30초 넘게 하는 중 — 잠시 뒤 다시' };
    Y.busy = true; let T = null, f = null; const L = { m: '' };
    try { ph('번외 예스24 크롬 준비하는 중'); await ensure('계정 확인'); ph('지금 예스24 세션이 살아 있는지 보는 중'); await nav(BASE + '/', 30); const live = !isLoginSt(await ev(JS_STATE)); let sid = Y.br.sid; if (live) return { ok: false, live: true, why: '예스24 판매관리가 지금 로그인돼 있음 — 확인하려고 로그인을 하나 더 하면 예스24가 지금 세션을 끊음' }; /* (11/11 y24ops2) 예전엔 쿠키가 따로인 임시 창에서 로그인해 확인 → 예스24는 한 계정 세션 하나라 그 로그인이 본 창 세션을 끊었음(정범님 HOME 13:25 저장 뒤 로그인 화면에 멈춤) */
      f = (m, p, s) => { if (s === sid && m === 'Page.javascriptDialogOpening') { L.m = String(p.message || '').replace(/\s+/g, ' ').slice(0, 120); if (T) Y.br.cdp.send('Page.handleJavaScriptDialog', { accept: DLG(p.type, L.m) }, sid).catch(() => {}); else Y.loginDlg = L.m; } }; Y.br.cdp.on.push(f); if (!T) { Y.inLogin = true; Y.loginDlg = ''; } /* 임시 창은 여기서 답함 · 본 창은 onDialog(로그인 중 규칙) */
      const N = (u, sec) => nav(u, sec, sid), E = (x, ms) => ev(x, ms, sid);
      const r = await o.relogin.tryWith('y24', { name: '예스24 판매관리', shape: true, phase: x.phase, loginUrl: BASE + '/', nav: N, ev: E, sleep: sleepR, type: (t) => Y.br.cdp.send('Input.insertText', { text: t }, sid), key: () => keyPress(sid), leaveSec: TEST ? 3 : 15, settle: () => sleep(TEST ? 300 : 1500), lastMsg: () => L.m, check: async () => { await N(BASE + '/', 30); return !isLoginSt(await E(JS_STATE)); } }, id, pw);
      if (r.ok && !live) { setLogin('ok'); Y.drops = []; Y.reWhy = null; Y.keepAt = now(); Y.ord.next = now() + 3000; } return { ...r, where: live ? 'tab' : 'main' }; }
    catch (e) { return { ok: false, unsure: true, why: String(e.message || e).slice(0, 140) }; } finally { Y.inLogin = false; if (f && Y.br) Y.br.cdp.on = Y.br.cdp.on.filter((x) => x !== f); if (T && Y.br) await Y.br.closeTab(T).catch(() => {}); Y.busy = false; } }
  /* ── 한 바퀴 ── */
  /* (11/11 y24ops1) 🧰 운영 화면 한 바퀴 — 화면마다 [조회]만 · 화면 사이 8~20초(사람 속도) · 출고 중·로그인 풀림·꺼짐·맡긴 일이 오면 멈춤 */
  async function opsRun() { const T = { at: now(), end: 0, stop: null, res: {} }; Y.ops = T;
    for (const m of OPS_PAGES) { if (!enabled() || holdOn() || Y.login !== 'ok' || Y.jobs.some((j) => !Y.jd[j.id]) || (W && W.pick())) { T.stop = holdOn() ? 'hold' : Y.login !== 'ok' ? 'login' : 'pause'; break; }
      Y.tourCur = m.p.toLowerCase(); Y.tourResp = null; const r = await learn(m.p, null).catch((e) => 'err:' + e.message); Y.tourCur = null;
      if (r === 'login') { T.res[m.k] = { st: 'fail', msg: '로그인 화면', at: now() }; T.stop = 'login'; setLogin('need', '운영 화면 읽기 중 로그인 화면'); break; }
      await sleepR(1500, 2500); T.res[m.k] = { st: r === 'nobtn' ? 'nobtn' : Y.tourResp ? 'ok' : 'fail', cnt: Y.tourResp ? Y.tourResp.cnt : null, at: now() };
      await sleepR(8000, 20000); }
    T.end = now(); const ok = Object.values(T.res).filter((x) => x.st === 'ok').length; note(`🧰 예스24 운영 화면 ${T.stop ? '멈춤(' + T.stop + ')' : '읽음'} — 받음 ${ok}/${OPS_PAGES.length}${Y.opsNum.qaNo != null ? ' · 미답변 문의 ' + Y.opsNum.qaNo : ''}${Y.opsNum.retReq != null ? ' · 반품 요청 ' + Y.opsNum.retReq : ''}`); }
  /* (11/11 y24ops3) 🎓 배우기 켜기·끄기 — 웹앱 🧰 예스24 운영(두 번 누름) → POST /y24/learn · 맡은 PC·로그인된 세션·출고 중 아님·다른 일 없음일 때만 */
  async function learnSet(b) { b = b || {}; if (!b.on) { if (LN.L.on) await learnOff(String(b.by || '웹앱에서 끔').slice(0, 40)); return { ok: true, msg: '🎓 배우기 모드 끔', learn: LN.state() }; }
    if (isLogger()) return { ok: false, err: '로거 PC — 예스24 일 안 함(약속 0)' }; if (!mine()) return { ok: false, err: notMineMsg() }; if (!enabled()) return { ok: false, err: '번외 예스24 판매관리 읽기가 꺼져 있음' };
    if (Y.login !== 'ok' || !alive()) return { ok: false, err: '예스24 판매관리 로그인이 살아 있지 않음 — 먼저 옆 창 [🔐 예스24 로그인]' }; if (holdOn()) return { ok: false, err: '🚚 출고 중 — 끝난 뒤 다시(약속 0-1)' };
    if ((W && W.cur()) || (REG && REG.cur()) || Y.job) return { ok: false, err: '번외가 예스24 쓰기·올림·맡긴 일을 하는 중 — 끝난 뒤 다시' };
    const page = LN.PAGES[b.page] ? b.page : '/Claim/ReturnManagementS1'; const min = Math.max(5, Math.min(60, +b.min || 30));
    for (let k = 0; k < 60 && Y.busy; k++) await sleep(500); if (Y.busy) return { ok: false, err: '다른 일을 하는 중 — 잠시 뒤 다시' };
    Y.busy = true; try { LN.L.on = true; LN.L.until = now() + min * 60e3; LN.L.page = page; LN.L.by = String(b.by || '').slice(0, 60); LN.L.at = now(); await nav(BASE + page, 30); await show('🎓 배우기 모드'); note(`🎓 배우기 모드 켬 — ${LN.PAGES[page]} · ${min}분 · 그 창에서 사람이 1건 처리하면 저장 요청 모양만 남김(값·손님 정보 없음)`); Y.msg = '🎓 배우기 모드 켬'; return { ok: true, msg: `🎓 예스24 창을 앞으로 꺼내 ${LN.PAGES[page]} 화면을 엶 — 그 창에서 평소처럼 1건 처리해 주세요(${min}분 뒤 저절로 끔)`, learn: LN.state() }; }
    catch (e) { LN.L.on = false; return { ok: false, err: e.message }; } finally { Y.busy = false; } }
  async function learnOff(why) { LN.L.on = false; LN.L.until = 0; Y.landed = false; note(`🎓 배우기 모드 끔 — ${why || ''} · 받은 모양 ${LN.L.recs.length}개`); if (alive()) await hide('배우기 끝').catch(() => {}); }
  async function step() { const c = C();
    if (!enabled()) { const nm = !isLogger() && !mine(); if (Y.br) await close(isLogger() ? '로거 PC' : nm ? '예스24를 맡은 PC 아님' : '꺼짐'); if (nm) { Y.login = 'unknown'; Y.landed = false; } Y.msg = isLogger() ? '로거 PC — 예스24 판매관리 읽기 안 함(약속 0 · 계정·쿠키 금지)' : !cfg().on ? '번외 수집 꺼짐' : nm ? notMineMsg() : '예스24 판매관리 읽기 꺼 둠'; return 30e3; }
    if (LN.L.on) { if (now() > LN.L.until || Y.login !== 'ok' && !alive()) { await learnOff(now() > LN.L.until ? '정한 시간이 다 됨' : '예스24 창이 닫힘'); return 1000; } Y.msg = `🎓 배우기 모드 — 정범님이 예스24 창(${LN.PAGES[LN.L.page] || LN.L.page})에서 처리하는 동안 번외는 창을 건드리지 않음 · 받은 저장 요청 모양 ${LN.L.recs.length}개 · ${Math.max(0, Math.round((LN.L.until - now()) / 60e3))}분 뒤 저절로 끔`; return 3000; }
    if (Y.login === 'wait') { await loginPoll(); if (Y.login === 'wait') { const R = o.relogin; const can = R && !R.why('y24', { hold: holdOn() }); const hn = can ? await humanNow() : null;
        if (can && hn && !hn.busy) await endWait('저장된 계정이 있어 번외가 스스로 로그인(창에 ' + Math.round(humanMs() / 1000) + '초 넘게 입력 없음)');
        else { Y.msg = '🔐 예스24 로그인 창이 열려 있음 — 로그인하면 저절로 숨김' + (can ? ` · 입력이 ${Math.round(humanMs() / 1000)}초 넘게 없으면 저장된 계정으로 번외가 스스로 로그인` : ''); return 3000; } } }
    try { await ensure(Y.br ? '예스24 크롬이 꺼져 있음' : '켜짐'); } catch (e) { Y.msg = '예스24 크롬 준비 실패: ' + e.message; return 60e3; }
    if (!Y.landed) { Y.landed = true; try { if (!(await liveCheck())) setLogin('need', '판매관리 첫 화면이 로그인 화면'); else { setLogin('ok'); Y.keepAt = now(); } } /* (11/13 home2) load 직후 한 번이 아니라 8초 동안 */ catch (e) { Y.msg = '예스24 첫 화면 실패: ' + e.message; Y.landed = false; return 60e3; } }
    if (Y.login === 'need') { const ar = await autoRe(); if (ar === 'ok') { Y.reWhy = null; return 300; } if (!Y.reWhy || Y.reWhy.why !== ar) Y.reWhy = { at: now(), why: String(ar || '').slice(0, 300) }; /* (11/11 y24ops2) 저장된 계정이 있어도 스스로 다시 로그인하지 않는 까닭을 화면에 그대로 */ const RS = reState(); Y.msg = RS.auto ? `🔐 예스24 세션이 풀림 — 저장된 계정으로 번외가 스스로 다시 로그인함(사람 손 필요 없음)${ar ? ' · 지금: ' + ar : ''}` : '🔐 예스24 로그인 필요 — 옆 창의 [🔐 예스24 로그인] 단추를 한 번(그 뒤엔 세션 유지)' + (ar ? ' · 스스로 다시 로그인 안 하는 까닭: ' + ar : ''); return 15e3; }
    if (holdOn()) { Y.msg = '🚚 출고 중(이 PC 출고 보호) — 예스24 읽기 멈춤 · 끝나면 이어감'; return 15e3; }
    if (!feedOk()) { Y.msg = '이 PC 리드나우 수집기(알라딘 탭)가 안 보여 쉼 — 받은 것을 올릴 곳이 없음(수집기가 다시 보이면 이어감)'; return 15e3; }
    if (Y.feed.cfg && Y.feed.cfg.off) { Y.msg = '웹앱 설정에서 예스24 모으기를 꺼 둠'; return 60e3; }
    if (Y.q.length >= 190) { Y.msg = `올리지 못한 예스24 응답 ${Y.q.length}개 — 수집기가 받아 갈 때까지 쉼`; return 15e3; }
    if (jobsOn() && jobPick()) { await jobOnce(); Y.msg = '🤖 맡긴 일 끝 — 다음'; return 500; }
    if (W && W.chkPick && W.chkPick()) { await W.chkOnce(); Y.keepAt = now(); Y.msg = '🔎 예스24 쓰기 멈춤 확인 읽기 끝(누르지 않음)'; return 1500; } /* (y24qty1 0.1.61) 멈춘 쓰기의 지금 값을 한 번 읽어 남김 */
    if (W && W.pick()) { await W.once(); Y.keepAt = now(); Y.msg = '🟦 예스24 쓰기 한 묶음 끝 — ' + (W.R.msg || ''); return 1500; } /* (11/11 y24w) 수량·판매중지 — 자동 올림보다 먼저(팔린 책을 빨리 내림) */
    if (REG && REG.pick()) { await REG.once(); Y.keepAt = now(); Y.msg = '🟦 예스24 자동 올림 한 묶음 끝 — ' + (REG.R.msg || ''); return 1500; }
    const ordMin = ordMinNow();
    if (ordMin > 0 && now() >= Y.ord.next) { const r = await ordOnce(); if (r === 'ok') setLogin('ok'); /* (rel10) 주문 목록을 읽었으면 로그인 살아 있음 — 옛 경고 지움 */ Y.ord.next = now() + ordMin * 60e3 * (0.7 + Math.random() * 0.6) * (TEST ? SC : 1); Y.keepAt = now(); Y.msg = r === 'ok' ? '🔁 주문 두 목록 읽음' : r === 'login' ? '🔐 로그인 필요' : Y.ord.err; return 1000; }
    if (c.prdH > 0 && now() >= Y.prd.next && Y.login === 'ok') { Y.prd.next = now() + c.prdH * 3600e3; await prdAll(); Y.keepAt = now(); return 1000; }
    if (c.opsH > 0 && now() >= Y.opsNext && Y.login === 'ok') { Y.opsNext = now() + c.opsH * 3600e3 * (TEST ? SC : 1); await opsRun(); Y.keepAt = now(); return 1000; }
    if (c.tourH > 0 && now() >= Y.tourNext && Y.login === 'ok') { Y.tourNext = now() + c.tourH * 3600e3; await tourRun(); Y.keepAt = now(); return 1000; }
    if (now() - Y.keepAt > c.keepMin * 60e3) { Y.keepAt = now(); try { await nav(BASE + '/', 30); const s = await ev(JS_STATE); if (isLoginSt(s)) setLogin('need', '세션 확인 때 로그인 화면'); } catch (e) {} }
    Y.msg = ordMin > 0 ? `🔁 다음 주문 읽기 ${Math.max(0, Math.round((Y.ord.next - now()) / 60e3))}분 뒤` : '🔁 주문 다시 읽기 꺼 둠(웹앱 설정)'; return 15e3; }
  async function loop() { clearTimeout(Y.t); let next = 15e3; if (!Y.busy) { Y.busy = true; try { next = await step(); } catch (e) { Y.msg = '예스24 읽기 오류: ' + e.message; next = 60e3; if (!alive()) Y.landed = false; } finally { Y.busy = false; } } else next = 2000; Y.t = setTimeout(loop, next); }
  const kick = (ms) => { clearTimeout(Y.t); Y.t = setTimeout(loop, ms == null ? 300 : ms); };
  /* ── 수집기 다리(이 PC 알라딘 일하는 탭 · 10초마다) — 받기·보냄 확인·맡긴 일·출고 보호·웹앱 설정 ── */
  function feed(b, by) { const h0 = holder(); Y.feed = { at: now(), cfg: b.cfg && typeof b.cfg === 'object' ? { ordMin: b.cfg.ordMin, off: !!b.cfg.off, holder: holdNm(b.cfg.holder) || null } : Y.feed.cfg, hold: b.hold && typeof b.hold === 'object' ? { on: !!b.hold.on, why: String(b.hold.why || '').slice(0, 120) } : null, by: String(by || b.by || '').slice(0, 80) };
    { const fh = Y.feed.cfg && Y.feed.cfg.holder; if (fh && fh !== Y.holdF.h) { Y.holdF = { h: fh, at: now(), by: Y.feed.by }; wr(HOLD_F, Y.holdF); } const h1 = holder(); if (h1 !== h0) { note(`🔒 예스24를 맡은 PC가 ${h0 || '(정하지 않음)'} → ${h1}(으)로 바뀜 — ${isHolder(pcName(), h1) ? '이 PC가 맡음(예스24 로그인·읽기 시작)' : '이 PC 번외는 예스24 일을 멈춤'}`); kick(300); } } /* (11/11 y24ops2) 웹앱 app_settings/platforms.y24Holder → 수집기 cfg.holder */
    const ack = new Set(Array.isArray(b.ack) ? b.ack.map(String) : []); if (ack.size) { const n0 = Y.q.length; Y.q = Y.q.filter((r) => !ack.has(r.id)); Y.qBytes = Y.q.reduce((a, r) => a + (r.body ? r.body.length : 0), 0); Y.sentN += n0 - Y.q.length; }
    for (const id of Array.isArray(b.jack) ? b.jack.map(String) : []) delete Y.jres[id];
    const took = []; if (Array.isArray(b.jobs) && jobsOk()) for (const j of b.jobs.slice(0, 20)) { if (!j || !/^[\w.:-]{3,120}$/.test(String(j.id || '')) || !JPATH[j.kind]) continue; if (Y.jd[j.id] && Y.jd[j.id].st !== 'run') continue; if (!Y.jobs.some((x) => x.id === j.id) && !Y.jd[j.id]) Y.jobs.push({ id: String(j.id), ono: String(j.ono || ''), kind: j.kind, courier: j.courier || null, no: j.no || null, confirm: !!j.confirm, fast: j.fast !== false, at: now() }); took.push(String(j.id)); if (!Y.busy) kick(200); }
    let bytes = 0; const recs = []; for (const r of Y.q) { const n = r.body ? r.body.length : 0; if (recs.length && bytes + n > 3e6) break; recs.push(r); bytes += n; if (recs.length >= 20) break; }
    return { ok: true, y24: sum(), recs, took, jres: Y.jres, jstep: Y.jstep, tour: Y.tour && Y.tour.at ? Y.tour : null }; }
  const jobsOk = () => enabled() && jobsOn() && Y.login === 'ok' && alive() && !holdOn();
  /* (11/11 fix5 · 정범님 '아이디·비번을 저장했는데도 [🔐 예스24 로그인]을 누르라는 안내가 나옴') 저장된 계정으로 스스로 다시 로그인할 수 있는 상태인지 — auto = 계정 있음·켜짐·멈춤 없음 · 화면은 auto면 수동 안내 대신 '스스로 다시 로그인', 아니면 까닭과 함께 수동 안내 */
  function reState() { let r = null; try { r = (o.relogin && o.relogin.sum && o.relogin.sum().y24) || null; } catch (e) { r = null; } const has = !!(r && r.has); const stop = r && r.stop ? String(r.stop.why || '').slice(0, 200) : null; const lastBad = r && r.last && !r.last.ok ? String(r.last.why || '').slice(0, 200) : null;
    return { has, on: !!(r && r.auto !== false), stop, last: lastBad, auto: has && !!(r && r.auto !== false) && !stop && !Y.already && !isLogger(), today: r ? +r.today || 0 : 0, next: r && r.next ? r.next : null, hist: r && Array.isArray(r.hist) ? r.hist.slice(-10) : null /* (11/13 home2) 다시 로그인 자취(시각·됨·까닭 글 — 아이디·비밀번호 없음) — 진단이 '왜 하루 10번을 다 썼나'를 봄 */ }; }
  function sum() { return { re: reState(), on: enabled(), logger: isLogger(), holder: holder() || null, mine: mine(), already: Y.already && tkWhy() ? { at: Y.already.at, n: Y.already.n, first: Y.already.first } : null, tk: { on: tkOn(), why: tkWhy() || null, hour: tkHourN(), max: tkMax(), today: TK.tries.filter((x) => now() - x < 86400e3).length, okN: TK.okN, kicks: TK.kicks.filter((x) => now() - x < 86400e3).length, lastKick: TK.lastKick || null, last: TK.last || null, btns: TK.btns || null, line: tkLine() || null, seen: Y.already ? { at: Y.already.at, n: Y.already.n } : null }, reWhy: Y.login === 'need' && Y.reWhy ? Y.reWhy : null, login: Y.login, pg: Y.pg || null, inLogin: !!Y.inLogin, drops: quickDrops(), loginAt: Y.loginAt || null, loginMsg: Y.loginMsg || null, alive: alive(), shown: Y.shown, active: enabled() && Y.login === 'ok' && alive() && feedOk(), jobsOk: jobsOk(), msg: tkLine() ? tkLine() + ' · ' + (Y.msg || '') : Y.msg, q: Y.q.length, drop: Y.drop, sent: Y.sentN, recs: Y.recN, day: Y.day,
      ord: { at: Y.ord.at || null, n: Y.ord.n, err: Y.ord.err, nextMs: Y.ord.next ? Math.max(0, Y.ord.next - now()) : null }, prd: { at: Y.prd.at || null, n: Y.prd.n, pages: Y.prd.pages, err: Y.prd.err, on: Y.prd.on }, tour: Y.tour ? { at: Y.tour.at, end: Y.tour.end, stop: Y.tour.stop, sum: Y.tour.sum || null } : null, ops: Y.ops ? { at: Y.ops.at, end: Y.ops.end, stop: Y.ops.stop, res: Y.ops.res } : null, opsNextMs: Y.opsNext ? Math.max(0, Y.opsNext - now()) : null, main: Y.main, goods: Y.goods || null, learn: LN.sum(), opsNum: Y.opsNum && Object.keys(Y.opsNum).length ? Y.opsNum : null,
      reg: REG ? (() => { const r = REG.state(); return { ok1: r.ok1, done: r.done, wait: r.wait.length, cur: r.cur, why: r.why, msg: r.msg }; })() : null, w: W ? (() => { const r = W.state(); return { ok1: r.ok1, stop: r.stop ? r.stop.why : null, wait: r.wait.length, cur: r.cur, why: r.why, msg: r.msg, hist: (r.hist || []).slice(0, 5), grid: r.grid ? { at: r.grid.at, n: r.grid.n, cols: r.grid.cols, opt: r.grid.opt, nk: (r.grid.keys || []).length, probe: r.grid.probe || null, probe2: r.grid.probe2 || null, det: r.det || null, pop: r.pop || null } : (r.det || r.pop ? { det: r.det || null, pop: r.pop || null } : null) }; })() : null, /* (y24re8) det = [상세수정] 화면 원문 · pop = 판매상태 창 기간 칸 원문 — 수집기 💓(hbOf)가 w.grid만 통째로 싣기 때문에 grid 안에(수집기 판 없이) */ tpl: Object.keys(Y.tpl), hold: holdOn() ? Y.feed.hold : null, feedAt: Y.feed.at || null, feedBy: Y.feed.by || null, jobs: { wait: Y.jobs.filter((j) => !Y.jd[j.id]).length, res: Object.keys(Y.jres).length }, act: Y.act.err }; }
  async function runNow(what) { if (what === 'prd') Y.prd.next = 0; else if (what === 'tour') Y.tourNext = 0; else if (what === 'ops') Y.opsNext = 0; else Y.ord.next = 0; kick(100); return { ok: true, msg: what === 'ops' ? '🧰 운영 화면(반품·문의·정산) 읽기를 곧 시작' : what === 'prd' ? '📋 등록상품 전부 읽기를 곧 시작' : what === 'tour' ? '🛰 둘러보기를 곧 시작' : '🔁 주문 두 목록을 곧 읽음' }; }
  const start = () => { Y.opsNext = now() + (TEST ? 3600e3 : 12 * 60e3); Y.tourNext = now() + (TEST ? 3600e3 : 30 * 60e3); Y.prd.next = now() + (TEST ? 3600e3 : 20 * 60e3); kick(TEST ? 500 : 20e3); }; /* 켜진 뒤 첫 등록상품·둘러보기는 20·30분 뒤(근거: 없음 — 주문 읽기 먼저) */
  /* (11/10 y24auto) 🟦 예스24 자동 올림 — helper/col2-y24reg.js(웹앱이 장부에 먼저 적고 맡김 → 이 숨은 크롬이 대량 등록 엑셀 업로드) */
  REG = require('./col2-y24reg.js').makeY24Reg({ HOME, TEST, note, log, SC, Y, BASE, JS_STATE, nav, ev, isLoginSt, setLogin, learn, ordShift, rawList, kick, pcName, isLogger, enabled, holdOn, login: () => Y.login, re: () => reState() });
  REG.cur = () => !!REG.R.cur;
  /* (11/11 y24w) 🟦 예스24 쓰기(수량·판매중지·판매재개) — helper/col2-y24w.js(웹앱 🛠 처리할 일에서 맡김 → 이 숨은 크롬이 등록상품 관리 화면에서 사람처럼 고치고 다시 읽어 확인) */
  /* (y24re 0.1.55) 사람과 같은 진짜 입력(DevTools Input — trusted) — 예스24 쓰기의 수량 칸 더블 클릭·글자·Enter에만 씀 */
  const inp = { dbl: async (x, y) => { const b = Y.br; for (const [t, n] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 1], ['mousePressed', 2], ['mouseReleased', 2]]) { await b.cdp.send('Input.dispatchMouseEvent', { type: t, x, y, button: t === 'mouseMoved' ? 'none' : 'left', clickCount: n }, b.sid); await sleep(40); } },
    click: async (x, y) => { const b = Y.br; for (const [t, n] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 1]]) { await b.cdp.send('Input.dispatchMouseEvent', { type: t, x, y, button: t === 'mouseMoved' ? 'none' : 'left', clickCount: n }, b.sid); await sleep(40); } }, /* (y24re8) [상세수정] 단추·재고수량 칸을 사람처럼 한 번 누름 */
    text: async (t) => { const b = Y.br; await b.cdp.send('Input.insertText', { text: String(t) }, b.sid); }, key: async () => keyPress(Y.br.sid) };
  W = require('./col2-y24w.js').makeY24W({ HOME, TEST, note, log, SC, Y, BASE, JS_STATE, nav, ev, isLoginSt, setLogin, kick, pcName, isLogger, enabled, holdOn, inp, login: () => Y.login });
  return { start, kick, feed, sum, login, reOnce, verify, close, runNow, reg: REG, w: W, learn: { set: learnSet, state: () => LN.state(), LN }, MARK, Y, _t: { ordShift, hdrFresh, pickMenus, cutAct, mainSum, opsNum, goodsSum } };
}
module.exports = { makeY24, ppStop, holderOf, isHolder, HOLD_DEF, ALREADY_RE, ordShift, hdrFresh, pickMenus, cutAct, SAFE, DANGER, SECRET, OPS_PAGES, mainSum, opsNum, goodsSum };
