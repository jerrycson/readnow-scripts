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
const AC = require('../shadow/col2-al-compare.js');
const JS_STATE = `(()=>({h:location.hostname,p:location.pathname,pw:!!document.querySelector('input[type=password]'),out:!!document.querySelector('a[href*="wC2Cuser_logout"]'),rs:document.readyState}))()`;
const KINDS = ['chk', 'confirm', 'deliv', 'list', 'qna'];
const LIST_ST = ['판매중', '판매중지', '일시판매중지'];

function makeAl(o) {
  const { HOME, Browser, WIN, note, log, TEST } = o; const cfg = () => o.cfg(); const now = () => Date.now();
  const BASE = (TEST && process.env.RN_COL2_ALSCM ? process.env.RN_COL2_ALSCM : 'https://www.aladin.co.kr').replace(/\/$/, ''); const HOST = new URL(BASE).host;
  const MARK = 'col2-al-chrome'; const PROF = path.join(HOME, MARK); const CORE_D = path.join(HOME, 'core');
  const SC = TEST && +process.env.RN_COL2_AL_SCALE > 0 ? +process.env.RN_COL2_AL_SCALE : 1; /* 시험만 기다림을 줄임 — 실제는 1 */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const sleepR = (a, b) => sleep((a + Math.random() * (b - a)) * SC);
  const C = () => ({ chkMin: 20, confirmMin: 30, delivMin: 30, listMin: 60, qnaMin: 120, gapA: 3000, gapB: 6000, hourCap: 30, dayCap: 300, cool429Min: 30, feedMin: 5, cmpWaitMin: 10, nightFrom: 1, nightTo: 5, ...(cfg().alcfg || {}) });
  const A = { br: null, launching: null, landed: false, login: 'unknown', loginAt: 0, loginMsg: '', loginWait: 0, shown: false, busy: false, msg: '', t: null, opens: [], fails: 0, lastErr: null,
    feed: { at: 0, seat: null, hold: null, opLostAt: 0, off: false, by: '' }, pp: null, next: {}, listI: 0, hour: { h: '', n: 0 }, day: { d: '', n: 0, ok: 0, diff: 0, same: 0, wait: 0 }, coolUntil: 0,
    cmpQ: [], last: {}, core: { src: null, ver: {}, at: 0, err: null }, reads: [] };
  const pcName = () => String(cfg().pc || require('os').hostname() || '');
  const isLogger = () => /^LOGGER/i.test(pcName());
  const enabled = () => !!cfg().on && cfg().al === true && !isLogger(); /* 기본 꺼짐 — 정범님이 PC마다 켬(옆 창 ⚙) */
  const feedOk = () => now() - A.feed.at < C().feedMin * 60e3;
  const holdOn = () => !!((feedOk() && A.feed.hold && A.feed.hold.on) || (o.y24Hold && o.y24Hold()));
  const seatOk = () => !!(feedOk() && A.feed.seat && A.feed.seat.ok);
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
  function prefsNoPw() { try { const d = path.join(PROF, 'Default'); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, 'Preferences'); let P = {}; try { P = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) {}
      if (P.credentials_enable_service === false && P.profile && P.profile.password_manager_enabled === false) return; P.credentials_enable_service = false; P.profile = { ...(P.profile || {}), password_manager_enabled: false }; fs.writeFileSync(f, JSON.stringify(P)); } catch (e) {} }
  function onDialog(m, p, sid) { const b = A.br; if (!b || sid !== b.sid || m !== 'Page.javascriptDialogOpening') return; b.cdp.send('Page.handleJavaScriptDialog', { accept: p.type === 'alert' }, b.sid).catch(() => {}); } /* 확인 물음은 늘 '아니오' — 무엇이든 실수로 확인되지 않게 */
  async function ensure(why) { if (alive()) return A.br; if (A.launching) return A.launching; A.opens = A.opens.filter((t) => now() - t < 3600e3); if (A.opens.length >= 4) throw new Error('알라딘 크롬을 한 시간에 4번 넘게 다시 띄워 쉼'); A.opens.push(now());
    if (A.br) { try { A.br.kill(); } catch (e) {} } prefsNoPw();
    const b = new Browser({ exe: o.chromeExe(), profile: PROF, headless: false, rect: { x: -32000, y: 40, w: 1280, h: 900 }, stale: () => WIN.run('kill', MARK), handoffMs: o.handoffMs() }); A.br = b; A.shown = false; A.landed = false;
    note(`🟧 알라딘 샵매니저 크롬을 띄움 — ${why || ''} (따로 된 프로필 · 화면 밖)`);
    A.launching = b.launch().then(() => { b.cdp.on.push(onDialog); hideSoon(); return b; }, (e) => { A.fails++; A.lastErr = e.message; throw e; }).finally(() => { A.launching = null; }); return A.launching; }
  function hideSoon() { if (cfg().headless) return; let k = 0; const t = setInterval(async () => { k++; if (k > 20 || A.shown || !alive()) return clearInterval(t); const r = await WIN.run('hide', MARK, { w: 1280, h: 900, place: cfg().place }); if (r.ok && r.n > 0) clearInterval(t); }, TEST ? 400 : 3000); }
  async function close(why) { const b = A.br; A.br = null; A.shown = false; A.landed = false; if (b) { try { await b.close(); } catch (e) {} note(`🟧 알라딘 샵매니저 크롬을 닫음 — ${why || ''}`); } }
  async function nav(url, sec) { const b = A.br; const sid = b.sid; let f; const done = new Promise((res) => { f = (m, p, s) => { if (s === sid && m === 'Page.loadEventFired') res(true); }; b.cdp.on.push(f); setTimeout(() => res(false), (sec || 30) * 1000); });
    try { const r = await b.cdp.send('Page.navigate', { url }, sid); if (r && r.errorText) throw new Error('알라딘 화면을 못 엶: ' + r.errorText); if (r && r.frameId) b.frameId = r.frameId; await done; } finally { b.cdp.on = b.cdp.on.filter((x) => x !== f); } b.ctxId = null; }
  async function ev(expr, ms) { const b = A.br; const r = await b.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, b.sid, ms || 40000); if (r.exceptionDetails) throw new Error('화면 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 160)); return r.result ? r.result.value : null; }
  const onScm = (s) => s && (s.h === HOST || s.h === HOST.split(':')[0]) && /^\/scm\//i.test(s.p || '');
  const isLoginSt = (s) => !s || s.pw || /login/i.test(s.p || '') || !onScm(s) || !s.out;
  function setLogin(st, why) { if (A.login !== st) { A.login = st; if (st === 'need') { A.loginMsg = why || ''; note('🔐 알라딘 샵매니저 로그인이 필요 — 옆 창의 [🔐 알라딘 로그인] 단추를 한 번 눌러 주세요(' + (why || '') + ' · 저절로 다시 로그인하지 않음)'); } if (st === 'ok') { A.loginAt = now(); note('🟧 알라딘 샵매니저 세션 살아 있음 — 그림자 읽기 시작(읽기만)'); } } }

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
    for (let k = 0; k < 60 && A.busy; k++) await sleep(500); if (A.busy) return { ok: false, err: '다른 일을 하는 중 — 잠시 뒤 다시' };
    A.busy = true; A.pp = null; try { await ensure('로그인'); await nav(BASE + '/scm/wmain.aspx', 30); A.landed = true; const s = await ev(JS_STATE); if (!isLoginSt(s)) { setLogin('ok'); return { ok: true, msg: '이미 로그인돼 있음 — 할 일 없음' }; }
      A.login = 'wait'; A.loginWait = now(); await show(why || '로그인'); return { ok: true, msg: '알라딘 창을 앞으로 꺼냄 — 그 창에서 직접 로그인하면 저절로 숨고 그림자 읽기를 시작합니다(아이디·비밀번호는 저장하지 않음)' }; }
    catch (e) { return { ok: false, err: e.message }; } finally { A.busy = false; } }
  async function loginPoll() { if (now() - A.loginWait > 15 * 60e3) { A.login = 'need'; A.loginMsg = '로그인 기다림 15분 넘음'; await hide('로그인 기다림 15분 넘음').catch(() => {}); return; } let s = null; try { s = await ev(JS_STATE, 5000); } catch (e) { return; }
    if (s && s.rs === 'complete' && !s.pw && !/login/i.test(s.p || '') && (s.h === HOST || s.h === HOST.split(':')[0])) { if (!onScm(s)) { try { await nav(BASE + '/scm/wmain.aspx', 30); s = await ev(JS_STATE, 5000); } catch (e) { return; } } if (!isLoginSt(s)) { setLogin('ok'); await hide('로그인 됨').catch(() => {}); A.next.chk = now() + (TEST ? 0 : 60e3); } } }

  /* ── 한 바퀴 ── */
  async function step() { const c = C();
    if (!enabled()) { if (A.br) await close(isLogger() ? '로거 PC' : '꺼짐'); A.msg = isLogger() ? '로거 PC — 알라딘 로그인 일 안 함(약속 0 · 계정·쿠키 금지)' : !cfg().on ? '번외 수집 꺼짐' : '알라딘 샵매니저 읽기 꺼 둠(기본 꺼짐 · 옆 창 ⚙에서 켬)'; return 30e3; }
    if (A.pp) { A.msg = '⛔ 핑퐁 의심으로 멈춤 — ' + A.pp + ' · 정범님 확인 뒤 [🔐 알라딘 로그인]이나 끄고 켜기로 다시'; return 30e3; }
    if (A.login === 'wait') { await loginPoll(); if (A.login === 'wait') { A.msg = '🔐 알라딘 로그인 창이 열려 있음 — 로그인하면 저절로 숨김'; return 3000; } }
    if (holdOn()) { A.msg = '🚚 출고 중(이 PC 출고 보호) — 알라딘 그림자 읽기 멈춤 · 끝나면 이어감'; return 15e3; }
    if (!feedOk()) { A.msg = '이 PC 리드나우 수집기(다리)가 안 보여 쉼 — 출고 보호·로그인 자리를 모르면 읽지 않음'; return 15e3; }
    if (A.feed.off) { A.msg = '웹앱(관리도구)에서 이 PC 알라딘 그림자를 꺼 둠'; return 60e3; }
    if (!seatOk()) { A.msg = '🪑 로그인 자리 기다림 — ' + ((A.feed.seat && A.feed.seat.why) || '다리가 이 PC 번외 세션 자리를 아직 안 줌') + '(판매자 동시 로그인 ≤4대 · 그림자는 맨 뒤)'; return 30e3; }
    if (night()) { A.msg = '🌙 밤 1~5시 — 알라딘 그림자 읽기 쉼'; return 5 * 60e3; }
    if (now() < A.coolUntil) { A.msg = `알라딘 429 뒤 쉼 — ${Math.ceil((A.coolUntil - now()) / 60e3)}분 남음`; return 30e3; }
    try { await ensure(A.br ? '알라딘 크롬이 꺼져 있음' : '켜짐'); } catch (e) { A.msg = '알라딘 크롬 준비 실패: ' + e.message; return 60e3; }
    if (!A.landed) { try { await nav(BASE + '/scm/wmain.aspx', 30); A.landed = true; const s = await ev(JS_STATE); A.hour.n++; A.day.n++; if (isLoginSt(s)) setLogin('need', '샵매니저 첫 화면이 로그인 화면'); else { setLogin('ok'); A.next.chk = now() + c.chkMin * 60e3; } } catch (e) { A.msg = '샵매니저 첫 화면 실패: ' + e.message; A.landed = false; return 60e3; } }
    if (A.login === 'need') { A.msg = '🔐 알라딘 샵매니저 로그인 필요 — 옆 창 [🔐 알라딘 로그인]을 한 번(저절로 다시 로그인하지 않음)'; return 15e3; }
    cmpTick();
    if (capLeft() <= 0) { A.msg = `이번 시간·오늘 몫을 다 씀(시간 ${c.hourCap} · 하루 ${c.dayCap}장)`; return 60e3; }
    const due = KINDS.find((k) => now() >= (A.next[k] || 0));
    if (!due) { const nx = Math.min(...KINDS.map((k) => A.next[k] || 0)); A.msg = A.cmpQ.length ? `운영 문서 기다림(웹앱 대신 읽기) ${A.cmpQ.length}건` : `🟧 다음 읽기 ${Math.max(0, Math.round((nx - now()) / 60e3))}분 뒤`; return Math.min(15e3, Math.max(500, nx - now())); }
    const r = await doKind(due); A.next[due] = now() + c[due + 'Min'] * 60e3 * (0.8 + Math.random() * 0.4) * (TEST ? SC : 1);
    A.msg = r === 'ok' ? `🟧 ${AC.READ[due].t} 읽음` : r === 'login' ? '🔐 로그인 필요' : `${AC.READ[due].t} 실패 — ${(A.last[due] && A.last[due].why) || ''}`; await sleepR(c.gapA, c.gapB); return 300; }
  async function loop() { clearTimeout(A.t); let next = 15e3; if (!A.busy) { A.busy = true; try { next = await step(); } catch (e) { A.msg = '알라딘 그림자 오류: ' + e.message; next = 60e3; if (!alive()) A.landed = false; } finally { A.busy = false; } } else next = 2000; A.t = setTimeout(loop, next); }
  const kick = (ms) => { clearTimeout(A.t); A.t = setTimeout(loop, ms == null ? 300 : ms); };
  /* ── 수집기 다리(이 PC 알라딘 일하는 탭 · 10초마다) — 🪑 자리 · 🚚 출고 보호 · 운영 세션 풀림 · 웹앱 끔 ── */
  function feed(b, by) { b = b || {}; A.feed = { at: now(), seat: b.seat && typeof b.seat === 'object' ? { ok: b.seat.ok === true, why: String(b.seat.why || '').slice(0, 120) } : A.feed.seat, hold: b.hold && typeof b.hold === 'object' ? { on: !!b.hold.on, why: String(b.hold.why || '').slice(0, 120) } : null, opLostAt: +b.opLostAt || 0, off: !!(b.cfg && b.cfg.off), by: String(by || b.by || '').slice(0, 80) };
    if (A.feed.opLostAt && A.loginAt && A.feed.opLostAt >= A.loginAt && A.feed.opLostAt - A.loginAt < 15 * 60e3 && !A.pp) { A.pp = `번외 로그인(${new Date(A.loginAt + 9 * 3600e3).toISOString().slice(11, 16)}) 뒤 ${Math.round((A.feed.opLostAt - A.loginAt) / 60e3)}분 만에 운영 세션이 풀림`; note('⛔ 알라딘 핑퐁 의심 — ' + A.pp + ' → 번외 알라딘 읽기를 멈춤(운영 로그인이 먼저)', { k: 'al', l: 'err', m: '알라딘' }); }
    if (!A.busy) kick(200); return { ok: true, al: sum() }; }
  function sum() { return { on: enabled(), want: cfg().al === true, logger: isLogger(), login: A.login, loginAt: A.loginAt || null, loginMsg: A.loginMsg || null, alive: alive(), shown: A.shown, seat: seatOk(), hold: holdOn() ? (A.feed.hold || { on: true }) : null, pp: A.pp,
      active: enabled() && A.login === 'ok' && alive() && feedOk() && seatOk() && !holdOn() && !A.pp, msg: A.msg, hour: A.hour.n, day: A.day, last: A.last, cmpWait: A.cmpQ.length, feedAt: A.feed.at || null, feedBy: A.feed.by || null, core: A.core.ver, reads: A.reads.slice(-8) }; }
  async function runNow(what) { const k = KINDS.includes(what) ? what : 'confirm'; A.next[k] = 0; kick(100); return { ok: true, msg: `🟧 ${AC.READ[k].t}을 곧 읽음(읽기만)` }; }
  const start = () => { KINDS.forEach((k, i) => (A.next[k] = TEST ? 0 : now() + (i + 1) * 60e3)); kick(TEST ? 500 : 25e3); };
  return { start, kick, feed, sum, login, close, runNow, MARK, A };
}
module.exports = { makeAl };
