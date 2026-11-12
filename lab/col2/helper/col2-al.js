/* col2-al.js — 🟧 번외 수집기 알라딘 샵매니저 '읽기' 그림자 (정범님 11/09 밤 '로그인 일(알라딘 샵매니저·중고 판매 관리·예스24 판매관리)도 번외로' · 일정 reports/COL2_REPLACE_PLAN.md ③)
 * 본보기 = col2-y24.js(로그인 한 번 · 화면 없이 직접 부름). 설계 전체·쓰기 일의 안전은 lab/col2/LOGIN_PLAN.md.
 * 하는 일(읽기만 — 값을 바꾸는 요청은 하나도 보내지 않음):
 *   ① 따로 된 크롬 프로필(col2-al-chrome · 확장·Tampermonkey 없음 · 화면 밖 · 작업 표시줄 숨김)이 알라딘 로그인 세션을 지님 — 정범님이 옆 창 [🔐 알라딘 로그인]으로 한 번 직접 로그인
 *      · 아이디·비밀번호는 저장하지 않음(우리는 로그인 칸을 건드리지 않음 · 크롬 비밀번호 저장 끔) · 쿠키는 그 프로필 폴더(브라우저)에만 · 우리 코드는 쿠키를 읽지도 않음
 *      · 저절로 다시 로그인하지 않음 — 세션이 풀리면 '로그인 필요'로 멈춤(로그인 번갈아 넘어감·42FB 막힘을 번외가 만들지 않게)
 *   ② 샵매니저 첫 화면(/scm/wmain.aspx)에 한 번 들어간 뒤로는 화면을 열지 않고 그 탭 안(떨어진 칸)에서 fetch로 읽음 — 운영 수집기 getDoc과 같은 주소 · 같은 공용 해석 파일
 *      · 읽는 길은 다섯(shadow/col2-al-compare.js READ · isReadUrl) — 로그인 확인 · 상품 조회 목록 첫 쪽 · 주문확인요청 · 발송 요청 · 묻고 답하기 첫 쪽
 *      · 화면 안에서 해석한 뒤 번호·상태·값만 받음 — 손님 이름·전화·주소·문의 글·작성자는 번외로 넘어오지 않음
 *   ③ 운영 칸(prd_listings · shp_state/confirm·current · crm_interactions/aladin_qna_*)을 웹앱 대신 읽기로 받아(손님 정보는 trimProd로 버림) 칸마다 견주고
 *      결과는 col2_al/<일>_<시각>·col2_al/day_<날짜>_<PC>에만(웹앱이 대신 씀 · 이 도우미는 Firestore에 직접 쓰지 않음)
 * 지킴: 로거 PC는 아예 안 함(약속 0 — 계정·쿠키 금지 · 로그인 단추도 거절) · 🚚 출고 보호(수집기 다리가 알려 준 hold.on)면 멈춤(약속 0-1) · 수집기 다리가 5분 넘게 안 보이면 안 읽음
 *       · 🪑 로그인 자리: 다리가 '이 PC 번외 세션에 자리 있음(seat.ok)'을 알려 줄 때만(판매자 동시 로그인 ≤4대 · 그림자는 자리 차례 맨 뒤)
 *       · 핑퐁 막기: 번외 로그인 뒤 15분 안에 운영 세션이 풀렸다고 다리가 알려 오면(opLostAt) 곧바로 멈춤 — 정범님이 확인 뒤 다시 켬
 *       · 사람 속도보다 훨씬 느리게: 한 장 뒤 3~6초 · 시간 30장 · 하루 300장 · 밤 1~5시 쉼 · 429면 30분 쉼(운영 출고 읽기와 같은 계정·같은 IP이므로 넉넉히) — 근거: 없음, 설정(col2.json alcfg)으로 바꿈 */
'use strict';
const fs = require('fs'), path = require('path');
const AC = require('../shadow/col2-al-compare.js'); const RLM = require('./col2-relogin.js'); const { dlgOk: DLG, ACT_SRC, JS_ACT } = RLM;
const JS_STATE = `(()=>({h:location.hostname,p:location.pathname,pw:!!document.querySelector('input[type=password]'),out:!!document.querySelector('a[href*="wC2Cuser_logout"]'),rs:document.readyState}))()`;
const KINDS = ['chk', 'confirm', 'deliv', 'list', 'qna'];
const LIST_ST = ['판매중', '판매중지', '일시판매중지'];
/* (11/11 col2fix6 · 정범님 HOME '번외 [🔐 알라딘 로그인] 창에서 아이디로도·네이버로도 여러 번 했는데 모두 42FB · 같은 PC 평소 크롬에선 샵매니저가 됨')
 *  원인(코드로 확인): 사람이 로그인하던 창 = 번외가 조종하는 크롬 그대로였음 — ① --remote-debugging-port(조종 길) ② 탭에 조종 연결을 붙인 채(Page·Runtime.enable · 새 화면마다 넣는 스크립트)
 *   ③ 화면 밖(-32000)에서 띄워 옮김 · 가려져도 안 늦춤 같은 일꾼 플래그 ④ 창에 뜬 알라딘 확인 물음(confirm)을 번외가 사람보다 먼저 '아니오'로 닫음(로그인 이어 가기 물음까지)
 *   — 알라딘은 로그인 때 기기·브라우저를 점수로 매겨 의심스러우면 새 로그인만 42FB로 막음(10/26~ 클라우드 headless 11번 모두 42FB · 평소 크롬 네이버 길은 성공 · 진단 app_settings/aladin_login)
 *  고침: 사람이 로그인하는 창은 '평범한 크롬'으로 — 같은 크롬 실행 파일 · 조종 길 없음 · 일꾼 플래그 없음 · 화면 안 · 번외가 아무것도 붙이지 않음(물음도 사람이 직접 답함)
 *   · 같은 프로필(col2-al-chrome)이라 로그인 쿠키가 그대로 남고, 창을 닫으면 번외가 그 프로필로 조종 크롬을 다시 띄워 샵매니저로 확인(세션 쿠키도 이어지게 '이어서 열기' 켬)
 *   · 평범한 창 플래그는 HUMAN_OK 안의 것만(시험 t_human이 흔적 검사 — navigator.webdriver·HeadlessChrome·화면 밖·조종 길) */
const HUMAN_OK = /^--(user-data-dir=|no-first-run$|no-default-browser-check$|window-size=\d+,\d+$|window-position=\d+,\d+$)/;
const HUMAN_BAD = /^--(remote-debugging|enable-automation|headless|disable-blink-features|user-agent|lang=|proxy|host-resolver|disable-web-security|no-sandbox|disable-extensions|disable-background|disable-renderer-backgrounding|disable-backgrounding|mute-audio|disable-sync|disable-default-apps|test-type|disable-features|enable-features|hide-crash-restore-bubble|app=|incognito|guest|auto-open-devtools|remote-allow-origins|silent-debugger)/;
function humanArgs(prof, url, rect) { const r = rect || {}; const a = [`--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check'];
  if (r.w >= 400 && r.h >= 300) a.push(`--window-size=${Math.round(r.w)},${Math.round(r.h)}`); if (Number.isFinite(r.x) && Number.isFinite(r.y) && r.x >= 0 && r.y >= 0) a.push(`--window-position=${Math.round(r.x)},${Math.round(r.y)}`);
  return a.concat([url]); }
function prefsFix(PROF) { try { const d = path.join(PROF, 'Default'); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, 'Preferences'); let P = {}; try { P = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) {}
      const pr = P.profile || {}; if (P.credentials_enable_service === false && pr.password_manager_enabled === false && P.session && P.session.restore_on_startup === 1 && pr.cookie_controls_mode === 0 && pr.block_third_party_cookies === false) return;
      P.credentials_enable_service = false; P.profile = { ...pr, password_manager_enabled: false, cookie_controls_mode: 0, block_third_party_cookies: false }; P.session = { ...(P.session || {}), restore_on_startup: 1 }; fs.writeFileSync(f, JSON.stringify(P)); } catch (e) {} }
const humanArgsOk = (a) => a.filter((x) => /^--/.test(x)).every((x) => HUMAN_OK.test(x) && !HUMAN_BAD.test(x));

function makeAl(o) {
  const { HOME, Browser, WIN, note, log, TEST } = o; const cfg = () => o.cfg(); const now = () => Date.now();
  const BASE = (TEST && process.env.RN_COL2_ALSCM ? process.env.RN_COL2_ALSCM : 'https://www.aladin.co.kr').replace(/\/$/, ''); const HOST = new URL(BASE).host;
  const MARK = 'col2-al-chrome'; const PROF = path.join(HOME, MARK); const CORE_D = path.join(HOME, 'core');
  const SC = TEST && +process.env.RN_COL2_AL_SCALE > 0 ? +process.env.RN_COL2_AL_SCALE : 1; /* 시험만 기다림을 줄임 — 실제는 1 */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const sleepR = (a, b) => sleep((a + Math.random() * (b - a)) * SC);
  const C = () => ({ chkMin: 20, confirmMin: 30, delivMin: 30, listMin: 60, qnaMin: 120, gapA: 3000, gapB: 6000, hourCap: 30, dayCap: 300, cool429Min: 30, feedMin: 5, cmpWaitMin: 10, nightFrom: 1, nightTo: 5, ...(cfg().alcfg || {}) });
  const A = { br: null, launching: null, landed: false, login: 'unknown', loginAt: 0, loginMsg: '', loginWait: 0, shown: false, busy: false, msg: '', t: null, opens: [], fails: 0, lastErr: null,
    feed: { at: 0, seat: null, hold: null, opLostAt: 0, off: false, by: '', since: 0 }, ws: { at: 0, ok: false, why: '', n: null, max: null, held: [], had: false, err: null }, wsNow: 0, pp: null, next: {}, listI: 0, hour: { h: '', n: 0 }, day: { d: '', n: 0, ok: 0, diff: 0, same: 0, wait: 0 }, coolUntil: 0,
    cmpQ: [], last: {}, core: { src: null, ver: {}, at: 0, err: null }, reads: [] };
  const pcName = () => String(cfg().pc || require('os').hostname() || '');
  const isLogger = () => /^LOGGER/i.test(pcName());
  const enabled = () => !!cfg().on && cfg().al === true && !isLogger();
  /* (11/10 정범님 'HOME 한 대에서 그 PC 자리를 번외가 이어받음') 🏠 이어받기 — 다리(운영 수집기)가 이 값을 보고 운영 자리를 먼저 놓은 뒤 번외 자리를 보통 PC 차례로 받음 */
  const ownOn = () => enabled() && cfg().alOwn === true; /* 기본 꺼짐 — 정범님이 PC마다 켬(옆 창 ⚙) */
  const feedOk = () => now() - A.feed.at < C().feedMin * 60e3;
  const holdOn = () => !!((feedOk() && A.feed.hold && A.feed.hold.on) || (o.y24Hold && o.y24Hold()));
  /* (11/11 정범님 HOME 사진 '로그인 정보 기입 즉시 판단하지 않을 이유가 있어?') 이 PC 운영 수집기(다리)가 안 보이면 — 그 PC 웹앱(이미 Firebase 로그인)이 계정 자리 문서(app_settings/aladin_login · 동시 로그인 4대 규칙)를
   *  운영 규칙(__rnLoginRule — 운영 본체 글자 그대로 떼어 씀) 그대로 트랜잭션으로 묻고 받아 알려 줌(ws) · 같은 자리 이름 '<PC>~col2'라 운영 수집기가 나중에 켜지면 그 자리를 그대로 이어 지킴(겹침 없음)
   *  · 다리가 다시 보이면 90초 뒤부터는 다리가 알린 자리만 믿음 · 웹앱 소식이 5분 넘게 없으면 웹 자리는 없는 것으로 봄 */
  const WSC = o.TEST && process.env.RN_COL2_WS_SCALE ? +process.env.RN_COL2_WS_SCALE : 1; /* 시험만 — 5분·3분을 줄여 봄 */
  /* (11/11 col2rep1) 자리를 받은 뒤 웹앱은 규칙 신호 간격(beatSec 10~15분 · gap)마다만 다시 물음 → 예전 '5분 지나면 묵음'이면 받은 자리가 5분 뒤부터 다음 신호까지 5~10분씩 '없음'으로 깜빡여 읽기가 멈췄음
   *  → 묵음 = max(5분, 웹앱이 알린 다음 신호 간격 + 3분) · 계정 문서 자리 자체는 30분(liveMin) 살아 있으므로 그 안 */
  const wsFresh = () => now() - A.ws.at < Math.min(25 * 60e3, Math.max(5 * 60e3, (+A.ws.gap || 0) + 3 * 60e3, (+A.ws.wait || 0) + 3 * 60e3)) * WSC; /* wait = 자리가 없을 때 웹앱이 다시 물을 때까지(규칙 retrySec 1~10분) */
  const seatBridge = () => !!(feedOk() && A.feed.seat && A.feed.seat.ok);
  const seatWeb = () => !!(A.ws.ok && wsFresh() && (!feedOk() || now() - (A.feed.since || 0) < 90e3));
  const seatOk = () => seatBridge() || seatWeb();
  const seatSrc = () => (seatBridge() ? 'bridge' : seatWeb() ? 'web' : null);
  const webSeen = () => !!(o.webSeen && o.webSeen());
  /* 웹앱에 부탁하는 자리 일 — { who, want, own, now, handover } · 다리가 보이면 넘겨줌(handover — 웹앱은 지우지 않고 손 뗌 · 운영 수집기가 같은 이름으로 이어 지킴) */
  function seatAsk() { if (isLogger()) return null; const who = pcName() + '~col2'; if (!pcName()) return null;
    if (feedOk()) return A.ws.had ? { who, want: false, handover: true } : null;
    const want = enabled() && !A.pp && !holdOn(); if (!want && !A.ws.had) return null; return { who, want, own: ownOn(), now: now() < A.wsNow || !!(o.cqWait && o.cqWait() && now() - A.ws.at > 15e3) }; } /* 넣은 계정이 자리를 기다리는 동안은 15초마다 다시 봄(자리 문서만 · 알라딘엔 안 감) */
  /* 웹앱이 트랜잭션 결과를 알려 줌 */
  function wseat(b) { b = b || {}; const was = A.ws.ok; A.ws = { at: now(), ok: b.ok === true, why: String(b.why || '').slice(0, 300), n: Number.isFinite(+b.n) ? +b.n : null, max: Number.isFinite(+b.max) ? +b.max : null, held: Array.isArray(b.held) ? b.held.slice(0, 12).map((x) => String(x).slice(0, 40)) : [], had: b.had === true || b.ok === true, err: b.err ? String(b.err).slice(0, 160) : null, by: String(b.by || '').slice(0, 60), gap: b.ok === true && Number.isFinite(+b.gap) && +b.gap > 0 ? Math.min(20 * 60e3, +b.gap) : 0, wait: b.ok !== true && +b.until > now() ? Math.min(20 * 60e3, +b.until - now()) : 0 };
    if (was !== A.ws.ok) note(A.ws.ok ? `🪑 웹앱이 자리 문서로 번외 알라딘 자리를 받음(${A.ws.why}) — 이 PC 운영 수집기가 꺼져 있어도 번외가 바로 씀` : `🪑 번외 알라딘 자리 — 웹앱이 자리 문서로 확인: ${A.ws.why}`, { k: 'al', l: A.ws.ok ? 'ok' : 'warn', m: '알라딘' });
    if (A.ws.ok && !A.busy) kick(200); return { ok: true, al: sum() }; }
  const seatHot = () => now() < A.wsNow;
  const heldTxt = () => (A.ws.held && A.ws.held.length ? ' · 쓰는 기기: ' + A.ws.held.join(', ') : '');
  /* (11/11 정범님 15:00 HOME '번외 수집기는 아직도 수정이 안 된 거야?' — 「10분 안에 자리를 받지 못해 … 🏠가 켜져 있는지 보고 다시」처럼 막연한 안내 대신)
   *  🪑 지금 무엇이 자리를 쥐고 있는지(기기 이름 · 마지막 신호 시각) · 누가 자리를 확인하는지(이 PC 운영 수집기 다리 · 웹앱 자리 문서 · 아무도 없음)와 마지막 소식 · 지금 할 일 한 줄
   *  → { src: 'bridge'|'web'|'webOld'|'none'|'off'|'hold'|'pp'|'logger'|'ok', now, todo, held } — 값(아이디·비밀번호)·손님 정보 없음 */
  const hm = (t) => { if (!t) return '?'; const k = new Date(+t + 9 * 3600e3); return String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0'); };
  const ago = (t) => { if (!t) return ''; const m = Math.max(0, Math.round((now() - t) / 60e3)); return m < 1 ? '방금' : m < 90 ? m + '분 전' : Math.round(m / 60) + '시간 전'; };
  function seatTell() { const held = (A.ws.held || []).slice(0, 12); const w = A.ws; const by = String((o.webBy && o.webBy()) || '').slice(0, 60);
    const heldS = held.length ? held.join(', ') : '';
    if (isLogger()) return { src: 'logger', now: '로거 PC는 알라딘 계정을 쓰지 않음(약속 0)', todo: '할 일 없음 — 사무실 PC(HOME·JS-MAIN)에서 하세요', held };
    if (seatOk()) return { src: 'ok', now: `🪑 자리 받음 — ${seatSrc() === 'bridge' ? `이 PC 운영 수집기(다리 · 마지막 소식 ${hm(A.feed.at)})` : `웹앱 자리 문서(${w.n != null ? w.n + '/' + w.max + '대 · ' : ''}마지막 확인 ${hm(w.at)})`}`, todo: '할 일 없음 — 다시 [확인하고 저장]을 누르면 곧바로 확인', held };
    if (!enabled()) return { src: 'off', now: cfg().alOwn !== true ? '🏠 이어받기(이 PC 알라딘 자리를 번외가 이어받음)가 꺼져 있음' : '🟧 알라딘 샵매니저 읽기(또는 번외 수집)가 꺼져 있음', todo: '옆 창 ⚙ › 일 켜기·끄기 맨 위 🏠 「켜기」 → 다시 [확인하고 저장]', held };
    if (holdOn()) return { src: 'hold', now: '🚚 이 PC가 출고 중 — 출고 중엔 번외가 로그인하지 않음(약속 0-1)', todo: '출고가 끝나면 다시 [확인하고 저장]', held };
    if (A.pp) return { src: 'pp', now: '⛔ 로그인 번갈아 넘어감(핑퐁) 의심으로 번외 알라딘이 멈춰 있음', todo: '옆 창 🟧 칸에서 까닭을 보고 [다시 켜기] 뒤 [확인하고 저장]', held };
    if (feedOk()) { const sw = (A.feed.seat && A.feed.seat.why) || '아직 자리 답 없음';
      return { src: 'bridge', now: `이 PC 운영 수집기(다리 · ${A.feed.by || '이 PC'} · 마지막 소식 ${hm(A.feed.at)} ${ago(A.feed.at)})가 자리를 확인함 — ${sw}`, todo: ownOn() ? (/대\(|자리 기다림/.test(sw) ? '위 기기 중 하나가 알라딘 일을 멈추면(신호 30분 끊김) 저절로 받음 · 급하면 [그래도 잠가 저장] 두 번(확인 없이 · 다음 로그인 때 확인)' : '운영 수집기가 이 PC 운영 자리를 놓기까지 1~2분 — 2분 뒤 다시 [확인하고 저장]') : '옆 창 ⚙ › 🏠 「켜기」(번외가 이 PC 자리를 이어받음) → 다시 [확인하고 저장]', held };
    }
    if (w.at && wsFresh()) { if (w.err) return { src: 'web', now: `웹앱(${w.by || by || '이 PC'})이 자리 문서를 고치지 못함(마지막 ${hm(w.at)}) — ${w.err}`, todo: '이 PC 리드나우 웹앱을 새로고침(F5) 뒤 다시 [확인하고 저장]', held };
      return { src: 'web', now: `웹앱(${w.by || by || '이 PC'})이 자리 문서로 확인(마지막 ${hm(w.at)} ${ago(w.at)}) — ${w.n != null ? `알라딘 판매자 로그인 ${w.n}/${w.max}대` : w.why}${heldS ? ' · 자리를 쥔 기기: ' + heldS : ''}`, todo: heldS ? `위 기기 중 하나가 알라딘 일을 멈추면(신호 30분 끊김) 저절로 받아 곧바로 확인 · 급하면 [그래도 잠가 저장] 두 번(확인 없이 · 다음 로그인 때 확인)` : '잠시 뒤(1~10분) 저절로 다시 물음', held }; }
    if (webSeen()) return { src: 'webOld', now: `이 PC 운영 수집기(다리)가 꺼져 있고, 웹앱(${by || '이 PC'})은 보이지만 자리 문서 확인 답을 보내지 않음${w.at ? `(마지막 답 ${hm(w.at)} ${ago(w.at)})` : ''} — 웹앱이 자리 확인이 없는 옛 판일 수 있음 · ${webLine()}`, todo: '이 PC 리드나우 웹앱을 새로고침(F5 · 새 판을 받음) 뒤 다시 [확인하고 저장] · 또는 이 PC Tampermonkey 수집기를 켬', held };
    { const x = WI(); if (webFresh(x.helloAt) && !webFresh(x.pullAt)) return { src: 'webLogin', now: `이 PC 운영 수집기(다리)가 꺼져 있고, 웹앱(${x.helloOrg || '?'}${x.helloVer ? ' · 판 ' + x.helloVer : ''})은 열려 있지만 구글 로그인 전이라 자리 문서를 못 읽음 · ${webLine()}`, todo: `그 웹앱 탭(${x.helloOrg || APP_URLS})에서 구글 로그인 → 1분 안에 저절로 자리를 확인 → 다시 [확인하고 저장]`, held, web: x }; }
    { const x = WI(); return { src: 'none', now: `이 PC 운영 수집기(다리)도 리드나우 웹앱도 안 보임 · ${A.feed.at ? `다리 마지막 소식 ${hm(A.feed.at)} ${ago(A.feed.at)}` : '다리 소식 없음'} · ${webLine()}${w.at ? ` · 웹앱 마지막 답 ${hm(w.at)} ${ago(w.at)}` : ''} — 자리 문서(동시 로그인 4대)를 확인할 길이 없음`, todo: x.rej && now() - x.rej.at < 30 * 60e3 && !webFresh(x.at) ? `${x.rej.org}는 우리 웹앱 주소가 아니라 막았음 — 이 PC 크롬에서 리드나우 웹앱(${APP_URLS})을 열고 구글 로그인 → 1분 뒤 다시 [확인하고 저장]` : `이 PC 크롬에서 리드나우 웹앱 탭(${APP_URLS})을 앞에 띄우고 F5(새 판 받기) · 구글 로그인 확인 → 1분 안에 옆 창에 '웹앱 마지막 소식'이 뜨면 다시 [확인하고 저장](웹앱이 곧바로 자리 문서로 확인) · 그래도 안 뜨면 크롬 주소창 왼쪽 자물쇠 › 사이트 설정에서 '로컬 네트워크(이 기기의 앱)' 허용`, held, web: x }; } }
  /* (11/11 seatfix1 · 정범님 16:48 HOME — 웹앱은 jerrycson.github.io로 열려 있는데 「웹앱도 안 보임 · readnow.kr을 열어 두고」) 무엇이 안 보이는지 정확히:
   *  웹앱 주소(출처)·판·마지막 소식(대신 읽기 묻기 / 로그인 전 알림 / 다른 부름) · 우리 주소가 아니라 막은 부름 · 할 일에 두 주소 모두 */
  const APP_URLS = 'readnow.kr 또는 jerrycson.github.io/readnow-scripts/app/';
  const WI = () => { try { return (o.webInfo && o.webInfo()) || {}; } catch (e) { return {}; } };
  const webFresh = (t) => !!t && now() - t < 3 * 60e3 * WSC;
  function webLine() { const x = WI(); const tag = (org, ver) => [org || '', ver ? '판 ' + ver : ''].filter(Boolean).join(' · ');
    const last = x.pullAt && !(x.helloAt > x.pullAt) ? `웹앱 마지막 소식 ${hm(x.pullAt)} ${ago(x.pullAt)}(${tag(x.pullOrg, x.pullVer) || '주소 모름'})` : x.helloAt ? `웹앱 마지막 소식 ${hm(x.helloAt)} ${ago(x.helloAt)}(${tag(x.helloOrg, x.helloVer)} · 구글 로그인 전)` : x.at ? `웹앱 부름은 ${hm(x.at)} ${ago(x.at)}(${x.org} ${x.path}) — 대신 읽기 묻기는 없음` : `번외를 켠 ${hm(x.boot)} 뒤로 이 PC 웹앱 소식이 한 번도 없음(어느 주소에서도)`;
    const rej = x.rej && now() - x.rej.at < 6 * 3600e3 ? ` · ⛔ 우리 주소가 아니라 막은 부름: ${x.rej.org} ${hm(x.rej.at)}(${x.rej.n}번)` : ''; return last + rej; }
  const tellTxt = () => { const t = seatTell(); return `${t.now} → 지금 할 일: ${t.todo}`; };
  const alive = () => !!(A.br && A.br.alive());
  const kday = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 10); const khour = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 13);
  const night = () => { if (TEST) return false; const h = new Date(now() + 9 * 3600e3).getUTCHours(); const c = C(); return h >= c.nightFrom && h < c.nightTo; };
  const capLeft = () => { if (A.hour.h !== khour()) A.hour = { h: khour(), n: 0 }; if (A.day.d !== kday()) A.day = { d: kday(), n: 0, ok: 0, diff: 0, same: 0, wait: 0 }; const c = C(); return Math.min(c.hourCap - A.hour.n, c.dayCap - A.day.n); };

  /* ── 운영 공용 파일 넷(그대로 받아 씀 · 6시간마다) ── */
  async function core() { const K = A.core; if (K.src && now() - K.at < 6 * 3600e3) return K.src; const out = [], ver = {}; fs.mkdirSync(CORE_D, { recursive: true });
    for (const f of AC.CORE_FILES) { let s = null; if (process.env.RN_COL2_CORE_DIR) s = fs.readFileSync(path.join(process.env.RN_COL2_CORE_DIR, f), 'utf8');
      else { const cf = path.join(CORE_D, f); try { s = await o.getText(o.coreBase + f + '?t=' + now()); if (!/VERSION\s*=\s*'[\d.]+'/.test(s)) throw new Error('판 번호가 없음'); fs.writeFileSync(cf, s); } catch (e) { K.err = `${f} 받기 실패(${e.message}) — 받아 둔 것을 씀`; try { s = fs.readFileSync(cf, 'utf8'); } catch (x) { s = null; } } }
      if (!s) throw new Error(`운영 공용 파일 ${f}을 못 받음`); out.push(s); ver[f] = (s.match(/VERSION\s*=\s*'([\d.]+)'/) || [])[1] || '?'; }
    K.src = out; K.ver = ver; K.at = now(); if (A.br) A.br.ctxId = null; return out; }

  /* ── 크롬(이 프로필만) ── */
  /* 비밀번호 저장 끔 · (11/11 col2fix6) 세션 쿠키도 다음 띄움에 이어지게 '이어서 열기'(restore_on_startup 1) · 제3자 쿠키는 평소 크롬 기본처럼 허용(네이버 로그인 창 ↔ 알라딘) */
  function prefsNoPw() { prefsFix(PROF); }
  function onDialog(m, p, sid) { const b = A.br; if (!b || sid !== b.sid) return; if ((m === 'Page.frameNavigated' && p.frame && !p.frame.parentId) || (m === 'Page.navigatedWithinDocument' && p.url)) return pageSeen(m === 'Page.frameNavigated' ? p.frame.url : p.url); if (m !== 'Page.javascriptDialogOpening') return;
    if (A.login === 'wait' && !A.inLogin) { A.loginDlg = String(p.message || '').replace(/\s+/g, ' ').slice(0, 120); note(`🔐 알라딘 로그인 창 물음 '${A.loginDlg}' — 사람이 직접 답하게 둠(번외가 대신 누르지 않음)`); return; } /* (11/11 col2fix6) 예전엔 사람이 로그인하는 창의 물음도 번외가 곧바로 '아니오' */
    const msg = String(p.message || '').replace(/\s+/g, ' ').slice(0, 120); let accept = p.type === 'alert'; if (A.inLogin) { accept = DLG(p.type, msg); A.loginDlg = msg; if (p.type !== 'alert') note(`🔐 알라딘 로그인 중 물음 '${msg}' → ${accept ? '예' : '아니오'}`); }
    b.cdp.send('Page.handleJavaScriptDialog', { accept }, b.sid).catch(() => {}); } /* 확인 물음은 늘 '아니오' — 무엇이든 실수로 확인되지 않게(로그인하는 동안의 '로그인 이어 가기' 물음만 예외 · col2-relogin dlgOk) */
  async function ensure(why) { if (alive()) return A.br; if (A.launching) return A.launching; A.opens = A.opens.filter((t) => now() - t < 3600e3); if (A.opens.length >= 4) throw new Error('알라딘 크롬을 한 시간에 4번 넘게 다시 띄워 쉼'); A.opens.push(now());
    if (A.br) { try { A.br.kill(); } catch (e) {} } prefsNoPw();
    const b = new Browser({ exe: o.chromeExe(), profile: PROF, headless: false, rect: { x: -32000, y: 40, w: 1280, h: 900 }, stale: () => WIN.run('kill', MARK), handoffMs: o.handoffMs() }); A.br = b; A.shown = false; A.landed = false;
    note(`🟧 알라딘 샵매니저 크롬을 띄움 — ${why || ''} (따로 된 프로필 · 화면 밖)`);
    A.launching = b.launch().then(() => { b.cdp.on.push(onDialog); hideSoon(); return b; }, (e) => { A.fails++; A.lastErr = e.message; throw e; }).finally(() => { A.launching = null; }); return A.launching; }
  function hideSoon() { if (cfg().headless) return; let k = 0; const t = setInterval(async () => { k++; if (k > 20 || A.shown || !alive()) return clearInterval(t); const r = await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }); if (r.ok && r.n > 0) clearInterval(t); }, TEST ? 400 : 3000); }
  async function close(why) { const b = A.br; A.br = null; A.shown = false; A.landed = false; if (b) { try { await b.close(); } catch (e) {} note(`🟧 알라딘 샵매니저 크롬을 닫음 — ${why || ''}`); } }
  async function nav(url, sec, sid0) { const b = A.br; const sid = sid0 || b.sid; let f; const done = new Promise((res) => { f = (m, p, s) => { if (s === sid && m === 'Page.loadEventFired') res(true); }; b.cdp.on.push(f); setTimeout(() => res(false), (sec || 30) * 1000); });
    try { const r = await b.cdp.send('Page.navigate', { url }, sid); if (r && r.errorText) throw new Error('알라딘 화면을 못 엶: ' + r.errorText); if (r && r.frameId) b.frameId = r.frameId; await done; } finally { b.cdp.on = b.cdp.on.filter((x) => x !== f); } b.ctxId = null; }
  async function ev(expr, ms, sid0) { const b = A.br; const r = await b.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid0 || b.sid, ms || 40000); if (r.exceptionDetails) throw new Error('화면 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 160)); return r.result ? r.result.value : null; }
  const onScm = (s) => s && (s.h === HOST || s.h === HOST.split(':')[0]) && /^\/scm\//i.test(s.p || '');
  const isLoginSt = (s) => !s || s.pw || /login/i.test(s.p || '') || !onScm(s) || !s.out;
  /* (11/11 정범님 '알라딘 창은 로그인 화면인데 번외가 잘못 인식') 창의 실제 주소로도 판정 — 본 창이 로그인 화면(/login/wlogin.aspx 등)으로 가면 '살아 있음'을 곧바로 '로그인 필요'로 */
  function pageSeen(u) { let pth = '', h = ''; try { const x = new URL(u); pth = x.pathname; h = x.hostname; } catch (e) {} const lg = /login/i.test(pth); A.pg = { login: lg, p: pth.slice(0, 60), at: now() }; if (lg && A.login === 'ok' && !A.inLogin) setLogin('need', '창 주소가 로그인 화면으로 바뀜(' + pth.slice(0, 40) + ')'); }
  const humanMs = () => (C().humanSec == null ? 90 : +C().humanSec) * 1000 * (TEST ? SC : 1);
  async function humanNow() { let a = null; try { a = await ev(JS_ACT, 5000); } catch (e) { a = null; } const since = now() - (A.loginWait || 0); if (a && a.age != null && a.age < humanMs()) return { busy: true, why: `알라딘 창에서 사람이 입력하는 중(마지막 입력 ${Math.round(a.age / 1000)}초 전)` };
    if ((!a || a.age == null) && since < humanMs()) return { busy: true, why: `알라딘 로그인 창을 띄운 지 ${Math.round(since / 1000)}초 — 사람이 칠 수 있게 기다림` }; return { busy: false }; }
  async function endWait(why) { if (A.login !== 'wait') return; A.login = 'need'; A.loginMsg = why; note('🔐 알라딘 로그인 창에서 입력이 없어 기다림을 끝냄 — ' + why); await hide('입력 없음').catch(() => {}); }
  async function keyPress(sid) { const b = A.br; const k = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }; await b.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...k, text: '\r' }, sid); await sleep(60); await b.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k }, sid); }
  function setLogin(st, why) { if (A.login !== st) { A.login = st; if (st === 'need') { A.loginMsg = why || ''; note('🔐 알라딘 샵매니저 로그인이 필요 — 옆 창의 [🔐 알라딘 로그인] 단추를 한 번 눌러 열린 창에서 「네이버로 로그인」으로 해 주세요(' + (why || '') + ' · 번외 크롬에 네이버 로그인이 남아 있으면 스스로 네이버 길로 다시 로그인)'); } if (st === 'ok') { A.loginAt = now(); A.todo = null; try { o.relogin && o.relogin.okSeen && o.relogin.okSeen('al'); } catch (e) {} note('🟧 알라딘 샵매니저 세션 살아 있음 — 그림자 읽기 시작(읽기만)'); } } }

  /* ── 읽기 한 장(화면 없이 · 떨어진 칸 fetch) ── */
  async function readOne(kind, arg) { const u = AC.READ[kind].url(arg); if (!AC.isReadUrl(u)) throw new Error('읽기 목록 밖 주소라 보내지 않음: ' + u); /* 이 줄 밖으로는 알라딘에 아무것도 안 감 */
    const srcs = await core(); const b = A.br; const ctx = await b.world(srcs); A.hour.n++; A.day.n++;
    const r = await b.cdp.send('Runtime.evaluate', { expression: `(${AC.READ_FN})(${JSON.stringify(BASE + u)}, ${JSON.stringify(kind)}, 30000)`, contextId: ctx, awaitPromise: true, returnByValue: true }, b.sid, 45000);
    const v = r.exceptionDetails ? { ok: false, why: '읽기 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 160), kind: 'error' } : (r.result && r.result.value) || { ok: false, why: '빈 응답' };
    A.reads.push({ at: now(), kind, ok: !!v.ok, why: v.ok ? null : v.why, n: v.sum ? (v.sum.rows || v.sum.orders || []).length : null }); if (A.reads.length > 30) A.reads.shift(); return v; }
  const stamp = () => new Date(now() + 9 * 3600e3).toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  async function doKind(kind) { const arg = kind === 'list' ? { st: LIST_ST[A.listI++ % LIST_ST.length], page: 1 } : kind === 'qna' ? { page: 1 } : {}; const at = now();
    const v = await readOne(kind, arg);
    if (!v.ok) { if (v.login) { setLogin('need', `${AC.READ[kind].t} 읽기 — ${v.why}`); return 'login'; } if (v.kind === '429') { A.coolUntil = now() + C().cool429Min * 60e3 * (TEST ? SC : 1); note(`🟧 알라딘이 ${v.st} — ${C().cool429Min}분 쉼(운영 출고 읽기와 같은 계정이라 그림자가 먼저 물러남)`); }
      A.last[kind] = { at, ok: false, why: v.why }; return 'err'; }
    setLogin('ok'); A.last[kind] = { at, ok: true, n: v.sum.rows ? v.sum.rows.length : v.sum.orders ? v.sum.orders.length : null, st: arg.st || null };
    if (kind === 'chk') return 'ok';
    const wants = AC.wantsOf(kind, v.sum); for (const w of wants) o.prodAsk(w.c, w.id);
    A.cmpQ.push({ kind, arg, at, sum: v.sum, wants, until: now() + C().cmpWaitMin * 60e3 * (TEST ? SC : 1), id: `${kind}_${stamp()}` }); return 'ok'; }
  /* 견줄 운영 문서가 다 오면(또는 기다림이 끝나면) 견줘 col2_al에 맡김 */
  function cmpTick() { const left = []; for (const q of A.cmpQ) { const all = q.wants.every((w) => o.prodGot(w.c, w.id) !== undefined); if (!all && now() < q.until) { left.push(q); continue; }
      const res = AC.compare(q.kind, q.sum, (c, id) => o.prodGot(c, id), q.at); if (!all) for (const w of q.wants) o.prodDrop(w.c, w.id);
      const v = res.verdict; A.day[v === 'same' ? 'same' : v === 'wait' ? 'wait' : 'diff']++; A.day.ok++;
      const doc = { kind: q.kind, t: AC.READ[q.kind].t, st: q.arg.st || null, at: new Date(q.at).toISOString(), pc: pcName(), ver: o.ver, core: A.core.ver, verdict: v, res, sum: slim(q.kind, q.sum), by: 'col2-al' };
      o.out('col2_al', q.id, doc, false); o.out('col2_al', `day_${kday()}_${pcName().replace(/[^\w-]/g, '_')}`, { day: kday(), pc: pcName(), ver: o.ver, reads: A.day.n, cmp: A.day.ok, same: A.day.same, diff: A.day.diff, wait: A.day.wait, last: { kind: q.kind, verdict: v, at: doc.at }, at: new Date().toISOString() }, false);
      A.last[q.kind] = { ...(A.last[q.kind] || {}), verdict: v };
      note(`🟧 ${AC.READ[q.kind].t}${q.arg.st ? '(' + q.arg.st + ')' : ''} 그림자 견줌 — ${v === 'same' ? '✓ 운영과 같음' : v === 'wait' ? '운영 문서를 못 받음(웹앱 대신 읽기 기다림)' : '다름 ' + (res.diff != null ? res.diff + '건' : '') + (res.timing ? ' · 운영 기록이 오래됨(때 차이일 수 있음)' : '')}`, { k: 'al', l: v === 'diff' ? 'warn' : 'ok', m: '알라딘' }); }
    A.cmpQ = left; }
  /* 결과 문서에 남기는 것 — 번호·상태·값만(손님 정보는 처음부터 없음) */
  const slim = (kind, s) => kind === 'list' ? { page: s.page, lastPage: s.lastPage, rows: (s.rows || []).slice(0, 100) } : kind === 'qna' ? { rows: (s.rows || []).slice(0, 50) } : { tab: s.tab, orders: (s.orders || []).slice(0, 100) };

  /* ── 보이기·숨기기(로그인 때만) · 로그인 한 번 ── */
  async function show(why) { const w = cfg().awin && cfg().awin.w >= 400 ? cfg().awin : {}; const r = await WIN.run('show', MARK, w); A.shown = true; note(`🟧 알라딘 창을 앞으로 (${why || ''})`); return r; }
  async function hide(why) { const f = await WIN.run('find', MARK); const it = f.ok && f.list && f.list[0]; if (A.shown && it && it.r && !it.ic && !it.tool && it.r.w >= 400 && it.r.h >= 300 && f.vs && it.r.x + it.r.w > f.vs.x) o.saveRect('awin', it.r); const r = await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }); A.shown = false; note(`🟧 알라딘 창을 다시 숨김 (${why || ''})`); return r; }
  async function login(why) { if (isLogger()) return { ok: false, err: '로거 PC에서는 알라딘 로그인을 하지 않습니다(약속 0 — 계정·쿠키 금지)' }; if (!cfg().on) return { ok: false, err: '번외 수집이 꺼져 있음(먼저 켜기)' }; if (!enabled()) return { ok: false, err: '알라딘 샵매니저 읽기가 꺼져 있음(옆 창 ⚙에서 켜기)' };
    if (holdOn()) return { ok: false, err: '🚚 출고 중 — 끝난 뒤에 로그인해 주세요(약속 0-1)' };
    if (A.plain) A.plainStop = true; /* (11/12 login1) 스스로 다시 로그인 네이버 창이 떠 있으면 그만두게 — 사람 창이 먼저 */
    for (let k = 0; k < 60 && A.busy; k++) await sleep(500); if (A.busy) return { ok: false, err: '다른 일을 하는 중 — 잠시 뒤 다시' };
    if (A.login === 'human') { const r = await humanEnd('단추를 한 번 더 누름'); return { ok: true, msg: '🔐 평범한 크롬 창을 닫고 로그인됐는지 확인합니다' + (r ? ' — ' + r : '') }; }
    A.busy = true; A.pp = null; try { await ensure('로그인'); await nav(BASE + '/scm/wmain.aspx', 30); A.landed = true; const s = await ev(JS_STATE); if (!isLoginSt(s)) { setLogin('ok'); return { ok: true, msg: '이미 로그인돼 있음 — 할 일 없음' }; }
      if (C().humanCdp !== true) return await humanOpen(why); /* (11/11 col2fix6) 기본 = 평범한 크롬 창 · 예전 길(조종 크롬을 앞으로)은 alcfg.humanCdp:true일 때만 */
      A.login = 'wait'; A.loginWait = now(); await A.br.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: ACT_SRC }, A.br.sid).catch(() => {}); await ev(ACT_SRC, 5000).catch(() => {}); await show(why || '로그인'); return { ok: true, msg: '알라딘 창을 앞으로 꺼냄 — 그 창에서 「네이버로 로그인」(네이버 \'로그인 상태 유지\' 켬)으로 직접 로그인하면 저절로 숨고 그림자 읽기를 시작합니다(아이디·비밀번호는 저장하지 않음 · 알라딘이 아이디 로그인을 42FB로 막고 있어 아이디 칸으로는 안 될 수 있음 · 네이버로 한 번 하면 다음부터 번외가 그 길로 스스로 다시 로그인)' }; }
    catch (e) { return { ok: false, err: e.message }; } finally { A.busy = false; } }
  /* ── (11/11 col2fix6) 🔐 사람 로그인 = 평범한 크롬 창 ──
   *  ① 조종 크롬을 점잖게 닫음(Browser.close) → 이 프로필을 쥔 크롬이 남았으면 이 프로필 이름이 든 것만 끝냄 · 잠금 정리(정범님 크롬은 프로필이 달라 안 건드림)
   *  ② 같은 크롬 실행 파일을 humanArgs(조종 길·일꾼 플래그 없음 · 화면 안)로 띄움 — 번외는 이 창에 아무것도 붙이지 않음(읽지도 누르지도 않음)
   *  ③ 정범님이 로그인하고 창을 닫거나(X) [🔐 알라딘 로그인]을 한 번 더 누르면(창에 닫기 신호 → 쿠키를 다 쓰고 끝남) → 조종 크롬을 다시 띄워 샵매니저 첫 화면으로 확인
   *  ④ 20분이 넘으면 창을 닫고 확인(로그인 안 됐으면 '로그인 필요') */
  const HUMAN_MIN = () => (TEST && +process.env.RN_COL2_HUMAN_MIN > 0 ? +process.env.RN_COL2_HUMAN_MIN : 20);
  async function humanOpen(why) { const exe = o.chromeExe(); if (!exe) return { ok: false, err: '크롬을 못 찾음' };
    await close('사람 로그인은 평범한 크롬 창으로'); const fr = new Browser({ exe, profile: PROF, stale: () => WIN.run('kill', MARK) }); try { await fr.freeProfile(); } catch (e) {} prefsNoPw();
    const w = cfg().awin && cfg().awin.w >= 400 && cfg().awin.x >= 0 ? cfg().awin : { x: 120, y: 60, w: 1200, h: 860 }; const args = humanArgs(PROF, BASE + '/scm/wmain.aspx', w);
    if (TEST && process.env.RN_COL2_HUMAN_TEST_ARGS) args.splice(1, 0, ...process.env.RN_COL2_HUMAN_TEST_ARGS.split(' ').filter(Boolean)); /* 시험만 — 사람 손 흉내(창을 조종해 로그인 칸을 채움) · 실제는 늘 빈 값 */
    if (!TEST && !humanArgsOk(args)) return { ok: false, err: '평범한 창 플래그 검사 실패(번외 코드 오류) — 띄우지 않음' };
    let p; try { p = require('child_process').spawn(exe, args, { stdio: 'ignore', detached: false, windowsHide: false }); } catch (e) { return { ok: false, err: '크롬을 못 띄움: ' + e.message }; }
    const H = { proc: p, at: now(), exit: null, args: args.filter((x) => /^--/.test(x)).map((x) => x.replace(/=.*/, '')) }; A.hu = H; p.on('exit', (code) => { H.exit = { code, ms: now() - H.at, at: now() }; }); p.on('error', (e) => { H.exit = { code: null, err: e.message, ms: now() - H.at, at: now() }; });
    A.login = 'human'; A.loginWait = now(); A.loginMsg = ''; A.shown = true;
    await sleep(TEST ? 800 : 2500); if (H.exit && H.exit.ms < 5000) { A.hu = null; A.login = 'need'; return { ok: false, err: `평범한 크롬 창이 바로 꺼짐(종료 코드 ${H.exit.code}) — 이 프로필(${MARK})을 다른 크롬이 쥐고 있을 수 있음 · 잠시 뒤 다시` }; }
    await WIN.run('show', MARK, w).catch(() => {}); note(`🔐 알라딘 로그인 — 평범한 크롬 창을 띄움(${why || ''} · 조종 길·자동화 흔적 없음 · 같은 프로필 ${MARK} · 플래그 ${H.args.join(' ')})`);
    return { ok: true, msg: '🔐 평범한 크롬 창(자동화 흔적 없음 · 번외가 조종하지 않음)으로 알라딘 로그인 화면을 열었습니다 — 그 창에서 직접 로그인(「네이버로 로그인」이나 아이디 · 「로그인 상태 유지」 켬)하고 샵매니저가 보이면 그 창을 닫아(X) 주세요. 번외가 이어서 확인합니다(아이디·비밀번호는 번외가 보지도 저장하지도 않음)' }; }
  async function humanEnd(why) { const H = A.hu; if (!H) return ''; if (!H.exit) { await WIN.run('close', MARK).catch(() => {}); for (let k = 0; k < 30 && !H.exit; k++) await sleep(500); if (!H.exit) { try { H.proc.kill(); } catch (e) {} await WIN.run('kill', MARK).catch(() => {}); for (let k = 0; k < 10 && !H.exit; k++) await sleep(300); } }
    A.hu = null; A.shown = false; note(`🔐 알라딘 평범한 로그인 창이 닫힘(${why}) — 조종 크롬을 다시 띄워 샵매니저로 확인`); return why; }
  async function humanCheck() { if (!A.hu) { /* 창은 이미 닫힘 */ } else if (!A.hu.exit && now() - A.loginWait < HUMAN_MIN() * 60e3) { A.msg = '🔐 평범한 크롬 창에서 알라딘 로그인을 기다림 — 로그인 뒤 그 창을 닫으면(X) 번외가 이어 받음'; return false; }
    else await humanEnd(A.hu.exit ? '정범님이 창을 닫음' : `${HUMAN_MIN()}분 넘음`);
    A.login = 'unknown'; try { await ensure('사람 로그인 뒤 확인'); await nav(BASE + '/scm/wmain.aspx', 30); A.landed = true; const s = await ev(JS_STATE); if (!isLoginSt(s)) { setLogin('ok'); await hide('로그인 됨').catch(() => {}); A.next.chk = now() + (TEST ? 0 : 60e3); } else setLogin('need', '평범한 크롬 창을 닫은 뒤에도 샵매니저가 로그인 화면 — 로그인이 안 됐거나 그 창에서 로그인 상태가 남지 않음'); }
    catch (e) { setLogin('need', '사람 로그인 뒤 확인 실패: ' + e.message); } return true; }
  async function loginPoll() { if (now() - A.loginWait > 15 * 60e3) { A.login = 'need'; A.loginMsg = '로그인 기다림 15분 넘음'; await hide('로그인 기다림 15분 넘음').catch(() => {}); return; } let s = null; try { s = await ev(JS_STATE, 5000); } catch (e) { return; }
    if (s && s.rs === 'complete' && !s.pw && !/login/i.test(s.p || '') && (s.h === HOST || s.h === HOST.split(':')[0])) { if (!onScm(s)) { try { await nav(BASE + '/scm/wmain.aspx', 30); s = await ev(JS_STATE, 5000); } catch (e) { return; } } if (!isLoginSt(s)) { setLogin('ok'); await hide('로그인 됨').catch(() => {}); A.next.chk = now() + (TEST ? 0 : 60e3); } } }

  /* (11/10 정범님 '다른 플랫폼들도 끊길 경우 스스로 로그인') 🔐 알라딘 — 번외 자리(<PC>~col2)를 받은 때만 · 출고 중·핑퐁 의심·로거면 안 함(col2-relogin.js) */
  /* (11/11 fix5) 「네이버로 로그인」 먼저 — 알라딘이 아이디·비밀번호 새 로그인을 42FB로 막고 있어(app_settings/aladin_login: 10/26~11/07 아이디 로그인 11번 모두 42FB6013 · 네이버 길은 성공) 운영 수집기와 같은 길(/login/wlogin_naver.aspx)을 씀
   *  · 이 번외 크롬 프로필에 네이버 '로그인 상태 유지'가 남아 있으면 값 없이 끝남 · 네이버 로그인 화면(nid.naver.com)이 뜨면 아무것도 넣지 않고 그만(네이버 아이디·비밀번호는 절대 안 넣음)
   *  · 설정 alcfg.naverRe=false면 이 길을 안 씀 · 저장된 아이디·비밀번호가 없어도 이 길은 함(값을 쓰지 않으므로) — 나머지 규칙(자리·출고·핑퐁·속도·연속 실패 멈춤)은 그대로 */
  const NV_URL = () => BASE + '/login/wlogin_naver.aspx?returnurl=' + encodeURIComponent(BASE + '/scm/wmain.aspx') + '&snsAppId=1&SecureOpener=1';
  const JS_LOC = `(()=>({h:location.hostname,p:location.pathname}))()`;
  const naverOn = () => C().naverRe !== false;
  async function chkScm() { await nav(BASE + '/scm/wmain.aspx', 30); return !isLoginSt(await ev(JS_STATE)); }
  async function naverTry() { await nav(NV_URL(), 30); let st = null;
    for (let i = 0; i < (TEST ? 4 : 14); i++) { st = await ev(JS_LOC, 10000).catch(() => null); const h = String((st && st.h) || ''), pth = String((st && st.p) || '');
      if (/(^|\.)naver\.com$/i.test(h) && /login/i.test(pth)) return { ok: false, why: '이 번외 크롬에 네이버 로그인이 없음(네이버 로그인 화면이 뜸 · 값은 넣지 않음)' };
      if (st && !/(^|\.)naver\.com$/i.test(h) && !/wlogin_naver/i.test(pth)) break; await sleep(TEST ? 150 : 1500); }
    if (A.loginDlg && RLM.isBlock(A.loginDlg)) return { ok: false, why: `네이버 길도 막힘(알림: '${String(A.loginDlg).slice(0, 80)}')` };
    return (await chkScm()) ? { ok: true } : { ok: false, why: '네이버로 로그인 뒤에도 샵매니저가 로그인 화면' }; }
  /* (11/12 login1 · 정범님 '3일째 알라딘 로그인조차 못 함' · 진단 11/12 09:06 HOME '연속 2번 실패 — 네이버로 로그인 뒤에도 샵매니저가 로그인 화면')
   *  원인: 스스로 다시 로그인의 「네이버로 로그인」(naverTry)이 번외가 조종하는 크롬(조종 길·일꾼 플래그) 안에서 돌았음 — col2fix6이 사람 로그인 창에서 찾은 것과 같은 까닭으로
   *   알라딘이 그 크롬의 새 로그인을 막음(아이디 길 42FB · 네이버 길도 같은 창에선 42FB — 11/11 HOME 정범님 시도) → 사람 창만 평범한 크롬으로 바뀌고 자동 길은 그대로였음
   *  고침: 자동 네이버 길도 평범한 크롬 창으로 — 같은 프로필(col2-al-chrome)에 남은 네이버 '로그인 상태 유지'로 값 없이 끝남(사람이 [🔐 알라딘 로그인] 창에서 네이버로 한 번 하면 그 뒤로 저절로)
   *   · 조종 크롬을 점잖게 닫고 → 평범한 창(조종 길 없음 · humanArgs)으로 네이버 길 주소를 엶 → 곧 작업 표시줄에서 숨김 → plainSec초(기본 25) 뒤 점잖게 닫음(쿠키를 다 씀) → 조종 크롬으로 샵매니저 확인
   *   · 그 창에는 아무것도 넣지 않음(네이버·알라딘 아이디·비밀번호 절대 안 넣음) · 네이버 로그인이 없으면 그 창은 네이버 로그인 화면에 머물다 닫힘 → '사람 손 필요'(한 줄 · 단추 하나)
   *   · 이 길이 안 되면 아이디·비밀번호 길은 하지 않음(조종 크롬 아이디 로그인 = 42FB 막힘 점수만 쌓임) — alcfg.idAfterNaver=true일 때만 · 예전 조종 크롬 네이버 길은 alcfg.naverPlain=false */
  const plainOn = () => C().naverPlain !== false;
  /* (11/12 login1) 사람이 해야 하는 순간 — 옆 창·웹앱(번외 상태 글 맨 앞)에 크게 한 줄 · 단추는 [🔐 알라딘 로그인] 하나 */
  const TODO_AL = "👉 지금 할 일 하나: 옆 창 [🔐 알라딘 로그인] → 열린 창에서 「네이버로 로그인」(네이버 '로그인 상태 유지' 켬) → 샵매니저가 보이면 그 창 닫기(X) — 그 뒤로는 번외가 스스로 다시 로그인";
  async function naverPlain() { const exe = o.chromeExe(); if (!exe) return { ok: false, why: '크롬을 못 찾음' };
    await close('스스로 다시 로그인(네이버 길)은 평범한 크롬 창으로'); const fr = new Browser({ exe, profile: PROF, stale: () => WIN.run('kill', MARK) }); try { await fr.freeProfile(); } catch (e) {} prefsNoPw();
    const w = cfg().awin && cfg().awin.w >= 400 && cfg().awin.x >= 0 ? cfg().awin : { x: 120, y: 60, w: 1100, h: 800 }; const args = humanArgs(PROF, NV_URL(), w);
    if (!humanArgsOk(args)) return { ok: false, why: '평범한 창 플래그 검사 실패(번외 코드 오류) — 띄우지 않음' };
    let p; try { p = require('child_process').spawn(exe, args, { stdio: 'ignore', detached: false, windowsHide: false }); } catch (e) { return { ok: false, why: '크롬을 못 띄움: ' + e.message }; }
    const H = { proc: p, at: now(), exit: null }; A.plain = H; A.plainStop = false; p.on('exit', (code) => { H.exit = { code, ms: now() - H.at }; }); p.on('error', (e) => { H.exit = { code: null, err: e.message, ms: now() - H.at }; });
    note('🔐 알라딘 스스로 다시 로그인 — 평범한 크롬 창으로 「네이버로 로그인」(이 번외 크롬에 남은 네이버 로그인 상태 · 값은 넣지 않음 · 창은 곧 숨기고 닫음)');
    try { await sleep(TEST ? 600 : 1800); if (H.exit && H.exit.ms < 5000) return { ok: false, why: `평범한 크롬 창이 바로 꺼짐(종료 코드 ${H.exit.code}) — 이 프로필을 다른 크롬이 쥐고 있을 수 있음` };
      if (!cfg().plainShow) await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }).catch(() => {});
      const lim = (C().plainSec == null ? 25 : +C().plainSec) * 1000 * (TEST ? SC : 1); while (!H.exit && now() - H.at < lim && !A.plainStop) await sleep(TEST ? 150 : 500); }
    finally { if (!H.exit) { await WIN.run('close', MARK).catch(() => {}); for (let k = 0; k < 30 && !H.exit; k++) await sleep(500); if (!H.exit) { try { p.kill(); } catch (e) {} await WIN.run('kill', MARK).catch(() => {}); for (let k = 0; k < 10 && !H.exit; k++) await sleep(300); } } A.plain = null; }
    if (A.plainStop) { A.plainStop = false; return { ok: false, why: '사람이 [🔐 알라딘 로그인]을 눌러 네이버 길을 그만둠' }; } /* 사람 창이 먼저 */
    await ensure('네이버 길 뒤 샵매니저 확인'); A.landed = true;
    return (await chkScm()) ? { ok: true } : { ok: false, human: true, why: "평범한 크롬 창으로 「네이버로 로그인」을 해 봤지만 샵매니저가 로그인 화면 — 이 번외 크롬에 네이버 '로그인 상태 유지'가 없음(사람이 한 번 해야 함)" }; }
  async function autoRe() { const R = o.relogin; if (!R) return ''; const w = R.why('al', { hold: holdOn(), seat: seatOk(), pp: A.pp, naver: naverOn() }); if (w) return w;
    A.inLogin = true; A.loginDlg = ''; let r; try { r = await R.run('al', { name: '알라딘 샵매니저', loginUrl: BASE + '/scm/wmain.aspx', nav, ev, sleep: sleepR, type: (t) => A.br.cdp.send('Input.insertText', { text: t }, A.br.sid), key: () => keyPress(A.br.sid), lastMsg: () => A.loginDlg, leaveSec: TEST ? 3 : 15, settle: () => sleep(TEST ? 300 : 1500), check: chkScm,
      pre: naverOn() ? async () => { const x = plainOn() ? await naverPlain() : await naverTry(); if (!x.ok) A.loginDlg = A.loginDlg && RLM.isBlock(A.loginDlg) ? A.loginDlg : ''; return x; } : null, preOnly: (naverOn() && plainOn() && C().idAfterNaver !== true) || !(o.relogin.hasCred ? o.relogin.hasCred('al') : true), preHuman: naverOn() && plainOn() }); } finally { A.inLogin = false; }
    if (r.ok) { setLogin('ok'); A.next.chk = now() + C().chkMin * 60e3; return 'ok'; } return r.why; }
  /* ── 한 바퀴 ── */
  async function step() { const c = C();
    if (!enabled()) { if (A.br) await close(isLogger() ? '로거 PC' : '꺼짐'); A.msg = isLogger() ? '로거 PC — 알라딘 로그인 일 안 함(약속 0 · 계정·쿠키 금지)' : !cfg().on ? '번외 수집 꺼짐' : '알라딘 샵매니저 읽기 꺼 둠(기본 꺼짐 · 옆 창 ⚙에서 켬)'; return 30e3; }
    if (A.pp) { A.msg = '⛔ 핑퐁 의심으로 멈춤 — ' + A.pp + ' · 정범님 확인 뒤 [🔐 알라딘 로그인]이나 끄고 켜기로 다시'; return 30e3; }
    if (A.login === 'human') { if (!(await humanCheck())) return 2000; return 300; } /* (11/11 col2fix6) 평범한 로그인 창이 열려 있는 동안은 이 프로필로 조종 크롬을 띄우지 않음 */
    if (A.login === 'wait') { await loginPoll(); if (A.login === 'wait') { const R = o.relogin; const can = R && !R.why('al', { hold: holdOn(), seat: seatOk(), pp: A.pp }); const hn = can ? await humanNow() : null;
        if (can && hn && !hn.busy) await endWait('저장된 계정·번외 자리가 있어 번외가 스스로 로그인(창에 ' + Math.round(humanMs() / 1000) + '초 넘게 입력 없음)');
        else { A.msg = '🔐 알라딘 로그인 창이 열려 있음 — 로그인하면 저절로 숨김'; return 3000; } } }
    if (holdOn()) { A.msg = '🚚 출고 중(이 PC 출고 보호) — 알라딘 그림자 읽기 멈춤 · 끝나면 이어감'; return 15e3; }
    if (!feedOk() && !seatWeb()) { A.msg = '이 PC 리드나우 수집기(다리)가 안 보임 — ' + (webSeen() ? `웹앱이 자리 문서(동시 로그인 4대)로 직접 확인 중${A.ws.at ? ' · ' + A.ws.why + heldTxt() : ''}` : '이 PC 리드나우 웹앱도 안 보여 로그인 자리를 확인할 수 없어 쉼(웹앱을 열어 두면 곧바로 확인) · ' + webLine()); return 15e3; }
    if (A.feed.off) { A.msg = '웹앱(관리도구)에서 이 PC 알라딘 그림자를 꺼 둠'; return 60e3; }
    if (!seatOk()) { A.msg = '🪑 로그인 자리 기다림 — ' + ((feedOk() ? A.feed.seat && A.feed.seat.why : A.ws.why + heldTxt()) || '다리가 이 PC 번외 세션 자리를 아직 안 줌') + (ownOn() ? '(🏠 이어받기 — 운영 자리를 놓은 뒤 받음 · 판매자 동시 로그인 ≤4대)' : '(판매자 동시 로그인 ≤4대 · 그림자는 맨 뒤)'); return 30e3; }
    if (night()) { A.msg = '🌙 밤 1~5시 — 알라딘 그림자 읽기 쉼'; return 5 * 60e3; }
    if (now() < A.coolUntil) { A.msg = `알라딘 429 뒤 쉼 — ${Math.ceil((A.coolUntil - now()) / 60e3)}분 남음`; return 30e3; }
    try { await ensure(A.br ? '알라딘 크롬이 꺼져 있음' : '켜짐'); } catch (e) { A.msg = '알라딘 크롬 준비 실패: ' + e.message; return 60e3; }
    if (!A.landed) { try { await nav(BASE + '/scm/wmain.aspx', 30); A.landed = true; const s = await ev(JS_STATE); A.hour.n++; A.day.n++; if (isLoginSt(s)) setLogin('need', '샵매니저 첫 화면이 로그인 화면'); else { setLogin('ok'); A.next.chk = now() + c.chkMin * 60e3; } } catch (e) { A.msg = '샵매니저 첫 화면 실패: ' + e.message; A.landed = false; return 60e3; } }
    if (A.login === 'need') { const ar = await autoRe(); if (ar === 'ok') return 300; A.todo = /^멈춤|사람|네이버 '로그인 상태 유지'가 없음/.test(ar || '') ? TODO_AL : null; A.msg = A.todo ? `${A.todo} · 까닭: ${ar}` : '🔐 알라딘 샵매니저 로그인 필요 — 옆 창 [🔐 알라딘 로그인]을 한 번' + (ar ? ' · 스스로 다시 로그인: ' + ar : '(저장된 계정이 없으면 저절로 다시 로그인하지 않음)'); return 15e3; }
    cmpTick();
    if (capLeft() <= 0) { A.msg = `이번 시간·오늘 몫을 다 씀(시간 ${c.hourCap} · 하루 ${c.dayCap}장)`; return 60e3; }
    const due = KINDS.find((k) => now() >= (A.next[k] || 0));
    if (!due) { const nx = Math.min(...KINDS.map((k) => A.next[k] || 0)); A.msg = A.cmpQ.length ? `운영 문서 기다림(웹앱 대신 읽기) ${A.cmpQ.length}건` : `🟧 다음 읽기 ${Math.max(0, Math.round((nx - now()) / 60e3))}분 뒤`; return Math.min(15e3, Math.max(500, nx - now())); }
    const r = await doKind(due); A.next[due] = now() + c[due + 'Min'] * 60e3 * (0.8 + Math.random() * 0.4) * (TEST ? SC : 1);
    A.msg = r === 'ok' ? `🟧 ${AC.READ[due].t} 읽음` : r === 'login' ? '🔐 로그인 필요' : `${AC.READ[due].t} 실패 — ${(A.last[due] && A.last[due].why) || ''}`; await sleepR(c.gapA, c.gapB); return 300; }
  async function loop() { clearTimeout(A.t); let next = 15e3; if (!A.busy) { A.busy = true; try { next = await step(); } catch (e) { A.msg = '알라딘 그림자 오류: ' + e.message; next = 60e3; if (!alive()) A.landed = false; } finally { A.busy = false; } } else next = 2000; A.t = setTimeout(loop, next); }
  const kick = (ms) => { clearTimeout(A.t); A.t = setTimeout(loop, ms == null ? 300 : ms); };
  /* ── 수집기 다리(이 PC 알라딘 일하는 탭 · 10초마다) — 🪑 자리 · 🚚 출고 보호 · 운영 세션 풀림 · 웹앱 끔 ── */
  function feed(b, by) { b = b || {}; const since = feedOk() ? A.feed.since || now() : now(); A.feed = { at: now(), since, seat: b.seat && typeof b.seat === 'object' ? { ok: b.seat.ok === true, why: String(b.seat.why || '').slice(0, 120) } : A.feed.seat, hold: b.hold && typeof b.hold === 'object' ? { on: !!b.hold.on, why: String(b.hold.why || '').slice(0, 120) } : null, opLostAt: +b.opLostAt || 0, off: !!(b.cfg && b.cfg.off), by: String(by || b.by || '').slice(0, 80) };
    if (A.feed.opLostAt && A.loginAt && A.feed.opLostAt >= A.loginAt && A.feed.opLostAt - A.loginAt < 15 * 60e3 && !A.pp) { A.pp = `번외 로그인(${new Date(A.loginAt + 9 * 3600e3).toISOString().slice(11, 16)}) 뒤 ${Math.round((A.feed.opLostAt - A.loginAt) / 60e3)}분 만에 운영 세션이 풀림`; note('⛔ 알라딘 핑퐁 의심 — ' + A.pp + ' → 번외 알라딘 읽기를 멈춤(운영 로그인이 먼저)', { k: 'al', l: 'err', m: '알라딘' }); }
    if (!A.busy) kick(200); return { ok: true, al: sum() }; }
  /* (정범님 11/10 '저장을 누르면 먼저 맞는지 확인') 🔐 알라딘 — 번외 자리(<PC>~col2)를 받았고 세션이 풀려 있을 때만 본 창에서 넣은 값으로 로그인해 봄(맞으면 그대로 로그인 된 채)
   *  · (11/10 밤 정범님 '알라딘은 아예 안 먹혀') 세션이 살아 있으면 확인하려면 로그인을 하나 더 해야 해서(판매자 동시 로그인 ≤4대 — 다른 PC가 끊길 수 있음) 로그인하지 않고
   *    { live } 로 돌려줌 → 부른 쪽이 '확인하지 않고 잠가 저장 · 다음 다시 로그인 때 확인'(col2-relogin run이 맞음/틀림을 가림 · 틀리면 ⛔ 알림)
   *  · 🏠 이어받기가 꺼져 자리를 못 받으면 { own } — '🏠를 켜면 확인됨' · 출고 중·핑퐁 의심·로거면 안 함 */
  async function verify(id, pw, x) { x = x || {}; const ph = (t) => (x.phase ? x.phase(t) : null); if (isLogger()) return { ok: false, why: '로거 PC에서는 알라딘 계정을 쓰지 않습니다(약속 0)' };
    const ownHint = '⚙ › 일 켜기·끄기 맨 위 🏠 「켜기 — 이 PC 알라딘 로그인 자리를 번외가 이어받음」을 켜면 번외가 이 PC 자리를 받아 실제 로그인으로 확인됨';
    if (enabled() && A.login === 'ok' && alive() && !(A.pg && A.pg.login)) return { ok: false, live: true, why: '알라딘 샵매니저가 지금 번외에서 로그인돼 있음' };
    if (!enabled()) return { ok: false, wait: true, own: cfg().alOwn !== true, why: cfg().alOwn !== true ? `🏠 이어받기가 꺼져 있어(알라딘 읽기도 꺼짐) 실제 로그인으로 확인할 수 없음 — ${ownHint}` : '🟧 알라딘 샵매니저 읽기(또는 번외 수집)가 꺼져 있어 확인할 수 없음 — 켠 뒤 다시' };
    if (holdOn()) return { ok: false, wait: true, why: '🚚 출고 중 — 끝난 뒤 다시 저장해 주세요(약속 0-1)' }; if (A.pp) return { ok: false, wait: true, why: '핑퐁 의심으로 멈춘 동안은 로그인하지 않음' };
    if (!seatOk() && !feedOk() && enabled() && webSeen()) { /* 다리 없음 — 웹앱이 자리 문서로 곧바로 묻게 하고(2초마다) 답을 기다림(최대 25초) */ ph('🪑 웹앱이 계정 자리 문서(동시 로그인 4대)로 빈자리를 확인하는 중'); A.wsNow = now() + 60e3; const t0 = now();
      for (let k = 0; k < 50 && !(A.ws.at > t0) && !seatOk(); k++) await sleep(500); A.wsNow = 0; if (!seatOk() && A.ws.at > t0) return { ok: false, wait: true, seat: true, web: true, held: A.ws.held, why: `🪑 빈 알라딘 로그인 자리가 없음 — ${A.ws.why || '자리 기다림'}${heldTxt()} (웹앱이 자리 문서로 확인 · 자리가 나면 저절로 받아 곧바로 확인)` }; }
    if (!seatOk()) return { ok: false, wait: true, own: !ownOn(), seat: ownOn(), tell: seatTell(), why: !ownOn() ? `🪑 번외 로그인 자리가 없어 확인할 수 없음 — ${ownHint}` : '🪑 번외 로그인 자리를 아직 못 받음(판매자 동시 로그인 4대 규칙 · 🏠를 켠 뒤 운영 수집기가 자리를 놓기까지 1~2분)' + (feedOk() ? (A.feed.seat && A.feed.seat.why ? ` · 다리가 알린 까닭: ${A.feed.seat.why}` : '') : webSeen() ? ` · 이 PC 운영 수집기는 꺼져 있어 웹앱이 자리 문서로 확인 중${A.ws.at ? ' — ' + A.ws.why + heldTxt() : ''}` : ' · 이 PC 운영 수집기(다리)도 리드나우 웹앱도 안 보임 — 이 PC에서 웹앱을 열어 두면 자리 문서로 곧바로 확인') };
    if (A.login === 'human') return { ok: false, wait: true, why: '🔐 평범한 크롬 창에서 정범님이 알라딘 로그인 중 — 그 창을 닫은 뒤 다시' };
    if (A.login === 'wait') { const hn = await humanNow(); if (hn.busy) return { ok: false, wait: true, why: hn.why + ' — 끝난 뒤 다시' }; await endWait('⚙ › 🔐 [확인하고 저장] — 창에 입력이 없어 번외가 넣은 값으로 확인'); }
    ph('알라딘이 하던 읽기가 끝나기를 기다리는 중'); for (let k = 0; k < 60 && A.busy; k++) await sleep(500); if (A.busy) return { ok: false, wait: true, why: '알라딘이 다른 읽기를 30초 넘게 하는 중 — 잠시 뒤 다시' };
    A.busy = true; let f = null; const L = { m: '' };
    try { ph('번외 알라딘 크롬 준비하는 중'); await ensure('계정 확인'); ph('지금 알라딘 세션이 살아 있는지 보는 중'); await nav(BASE + '/scm/wmain.aspx', 30); if (!isLoginSt(await ev(JS_STATE))) { setLogin('ok'); return { ok: false, live: true, why: '알라딘 샵매니저가 지금 번외에서 로그인돼 있음' }; }
      const sid = A.br.sid; f = (m, p, s) => { if (s === sid && m === 'Page.javascriptDialogOpening') L.m = String(p.message || '').replace(/\s+/g, ' ').slice(0, 120); }; A.br.cdp.on.push(f); A.inLogin = true; A.loginDlg = '';
      const r = await o.relogin.tryWith('al', { name: '알라딘 샵매니저', phase: x.phase, loginUrl: BASE + '/scm/wmain.aspx', nav, ev, sleep: sleepR, type: (t) => A.br.cdp.send('Input.insertText', { text: t }, sid), key: () => keyPress(sid), leaveSec: TEST ? 3 : 15, settle: () => sleep(TEST ? 300 : 1500), lastMsg: () => L.m, check: async () => { await nav(BASE + '/scm/wmain.aspx', 30); return !isLoginSt(await ev(JS_STATE)); } }, id, pw);
      if (r.ok) setLogin('ok'); return { ...r, where: 'main' }; }
    catch (e) { return { ok: false, unsure: true, why: String(e.message || e).slice(0, 140) }; } finally { A.inLogin = false; if (f && A.br) A.br.cdp.on = A.br.cdp.on.filter((x) => x !== f); A.busy = false; } }
  function sum() { return { todo: A.login === 'need' || A.login === 'unknown' ? A.todo || null : null, webLine: seatOk() ? null : webLine(), /* (11/11 seatfix1) 🌐 이 PC 웹앱 주소·판·마지막 소식 */ tell: enabled() || cfg().al === true || A.ws.at ? seatTell() : null, /* (11/11 col2rep1) 🪑 자리를 쥔 기기·마지막 소식·지금 할 일 */ on: enabled(), own: ownOn(), want: cfg().al === true, logger: isLogger(), login: A.login, pg: A.pg || null, seatWhy: (feedOk() ? A.feed.seat && A.feed.seat.why : A.ws.at ? A.ws.why : null) || null, seatBy: seatSrc(), feed: feedOk(), web: webSeen(), ws: A.ws.at ? { ok: A.ws.ok, why: A.ws.why, n: A.ws.n, max: A.ws.max, held: A.ws.held, at: A.ws.at, fresh: wsFresh(), err: A.ws.err } : null, loginAt: A.loginAt || null, loginMsg: A.loginMsg || null, human: A.hu ? { at: A.hu.at, open: !A.hu.exit, args: A.hu.args } : null, alive: alive(), shown: A.shown, seat: seatOk(), hold: holdOn() ? (A.feed.hold || { on: true }) : null, pp: A.pp,
      active: enabled() && A.login === 'ok' && alive() && feedOk() && seatOk() && !holdOn() && !A.pp, msg: A.msg, hour: A.hour.n, day: A.day, last: A.last, cmpWait: A.cmpQ.length, feedAt: A.feed.at || null, feedBy: A.feed.by || null, core: A.core.ver, reads: A.reads.slice(-8) }; }
  async function runNow(what) { const k = KINDS.includes(what) ? what : 'confirm'; A.next[k] = 0; kick(100); return { ok: true, msg: `🟧 ${AC.READ[k].t}을 곧 읽음(읽기만)` }; }
  const start = () => { KINDS.forEach((k, i) => (A.next[k] = TEST ? 0 : now() + (i + 1) * 60e3)); kick(TEST ? 500 : 25e3); };
  return { start, kick, feed, sum, login, verify, close, runNow, seatAsk, wseat, seatHot, seatTell, tellTxt, MARK, A };
}
module.exports = { makeAl, prefsFix, humanArgs, humanArgsOk, HUMAN_OK, HUMAN_BAD };
