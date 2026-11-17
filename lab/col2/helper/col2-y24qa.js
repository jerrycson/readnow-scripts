/* col2-y24qa.js — ❓ 예스24 상품 문의에 웹앱에서 답하기(사람이 쓴 답만 · 사람이 두 번 눌러 보냄) — 정범님 11/17 12:06·12:19
 *   「예스24는 알라딘의 모든 기능이 이곳에도 … 관리자가 전혀 예스24를 열지 않고도」 · 「묻고답하기 … 아직 문의에 답변하지 않았는데 웹앱에서 인식도 못 해」
 * 길: 웹앱 🧰 예스24 운영(또는 고객 탭 문의 모음) 그 문의 줄 답 칸 → 「보내기(두 번 누름)」 → Firestore col2_y24_cmd { k:'qa', job:{ id, rows:[{ kind:'qa', rid, qno, txt }] } }
 *   → 예스24를 맡은 PC의 수집기(wRelay — 바뀌지 않음)가 POST /y24/w/put 으로 넘김 → 이 모듈이 받음(isQa) → 예스24 숨은 크롬(로그인된 세션 · 같은 탭)에서
 *      ① 답 화면 열기와 같은 읽기  POST /api/CustomerService/QAUpdateInit  (본문 = 문의 번호 숫자 — 화면 스크립트 getQAUpdate(parseInt(inqryNo)))
 *         · UPDATE_TYPE 'Modify' 또는 답 글이 이미 있으면 → '이미 답함'(아무것도 보내지 않음 · 되풀이 0)
 *      ② 답 저장  POST /api/CustomerService/QAUpdate  {INQRY_NO, RPT_YN(그 문의 값 그대로), ANSWR_CONT} — 화면 [저장]이 보내는 것과 같음(setQaUpdate) · RESULT_CODE S000 = 됨
 *      ③ 다시 ①로 읽어 답이 붙었는지 확인 → 답함(done) · 안 붙었으면 '저장 안 됨' · 못 읽으면 '확실하지 않음' + 멈춤(다시 보내지 않음)
 *   → 결과를 GET /y24/w/state(예스24 쓰기와 같은 꼴 · merge)로 수집기가 읽어 그 문서 st:'done'·res 로 → 웹앱 그 줄 '답함'
 * 근거(화면 원문): 예스24 판매관리 스크립트 customerService_QAUpdate·service_customerService(11/16 y24qa1이 원문 보관 길로 올린 것)
 *   · axios 기본 머리글 Cache-Control: no-cache · X-Requested-With: XMLHttpRequest · Content-Type: application/json(쿠키 말고 다른 열쇠 없음)
 *   · 화면은 빈 답(공백만)을 받지 않음 · 저장 전 '답을 저장하면 손님에게 메일이 가고 취소할 수 없음' 물음 → 그래서 웹앱도 두 번 누름
 * 지킴: 로거 PC·MJ-MAIN 안 함 · 🚚 출고 중·로그인 풀림이면 기다림(보내기 전) · 한 맡김 = 문의 하나 · 같은 문의가 줄에 있거나 30일 안에 이 PC가 답을 보냈으면 거절
 *   · 보내는 사이 도우미가 꺼졌다 켜지면 다시 보내지 않고 ③ 확인만 · 엔진 자동 답 없음(규칙 카드 n1114y24all 전까지 — 사람이 쓴 글만 받음)
 *   · 기록(note)·상태에는 문의 번호·결과만(손님 글·답 글 없음) · 답 글은 이 PC 파일(y24-qa.json)에 보낼 때까지만 두고 결과가 나면 지움 */
'use strict';
const fs = require('fs'), path = require('path');
const ID_RE = /^[\w.:-]{3,120}$/, QNO_RE = /^\d{1,15}$/, RID_RE = /^[\w.:-]{1,80}$/;
const P_INIT = '/api/CustomerService/QAUpdateInit', P_SAVE = '/api/CustomerService/QAUpdate', PAGE = '/CustomerService/QAList';
const isQa = (b) => !!(b && Array.isArray(b.rows) && b.rows.length && b.rows.every((r) => r && r.kind === 'qa'));
/* 답 글 검사 — 2~2000자 · 공백만이면 안 됨(화면과 같음) */
function txtWhy(t) { if (typeof t !== 'string') return '답 글이 없음'; const s = t.trim(); if (!s.replace(/\s/g, '')) return '답 글이 비었음(공백만)'; if (s.length < 2) return '답 글이 너무 짧음(2자 이상)'; if (s.length > 2000) return '답 글이 너무 김(2000자까지)'; return ''; }
/* 답 화면 읽기 응답 → { ok, answered, rpt, q } — 손님 글은 웹앱 보여 주기용으로 가려서(전화·메일) 400자만 */
const piiMask = (s) => String(s == null ? '' : s).replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, '#전화').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '#메일');
function initOf(j) { if (!j || typeof j !== 'object') return { ok: false, why: '응답 없음' }; const code = String(j.RESULT_CODE || ''); const Q = j.QA && typeof j.QA === 'object' ? j.QA : null;
  if (code && code !== 'S000' && !Q) return { ok: false, why: '예스24 답 화면 읽기 거절(' + code.slice(0, 12) + ')' }; if (!Q) return { ok: false, why: '답 화면 응답에 문의(QA)가 없음' };
  const ans = String(Q.ANSWR_CONT == null ? '' : Q.ANSWR_CONT).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim(); const answered = String(j.UPDATE_TYPE || '') === 'Modify' || !!ans.replace(/\s/g, '');
  const raw = [Q.INQRY_CONT, Q.CONT, Q.INQRY_TTL, Q.TTL].find((v) => v != null && String(v).trim()); const q = raw == null ? '' : piiMask(String(raw).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 400);
  return { ok: true, answered, rpt: /^[YN]$/.test(String(Q.RPT_YN || '')) ? String(Q.RPT_YN) : 'N', q }; }

function makeY24QA(o) { const { HOME, note } = o; const now = () => Date.now(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const SC = o.SC || 1;
  const F = path.join(HOME, 'y24-qa.json'); const HOST = (() => { try { return new URL(o.BASE).host; } catch (e) { return ''; } })();
  const rd = () => { try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };
  const R = { wait: [], cur: null, res: {}, sent: {}, hist: [], stop: null, ...(rd() || {}) }; R.msg = '';
  R.wait = Array.isArray(R.wait) ? R.wait : []; R.res = R.res && typeof R.res === 'object' ? R.res : {}; R.sent = R.sent && typeof R.sent === 'object' ? R.sent : {}; R.hist = Array.isArray(R.hist) ? R.hist : [];
  const save = () => { const o2 = { wait: R.wait, cur: R.cur, res: R.res, sent: R.sent, hist: R.hist.slice(0, 40), stop: R.stop }; try { fs.writeFileSync(F, JSON.stringify(o2)); } catch (e) { o.log && o.log('예스24 문의 답 파일 저장 실패: ' + e.message); } };
  { const cut = now() - 60 * 86400e3; for (const [k, v] of Object.entries(R.sent)) if (!v || +v.at < cut) delete R.sent[k]; } /* 60일 지난 보냄 기록은 버림 */
  /* 다시 켜짐 — 보내기 전(읽기 단계)이면 줄 맨 앞으로 되돌림(아무것도 안 보냄) · 보내는 단계였으면 다시 보내지 않고 확인만(vfy) */
  if (R.cur) { if (R.cur.step === 'send' || R.cur.vfy) { R.cur.vfy = true; R.cur.step = 'send'; } else { const { step, ...c } = R.cur; R.wait.unshift(c); R.cur = null; } save(); }
  const pc = () => String(o.pcName() || ''); const banPc = () => (o.isLogger() ? '로거 PC — 예스24 일 안 함(약속 0)' : /^MJ-MAIN/i.test(pc()) ? 'MJ-MAIN(등록·출고 PC) — 예스24 일 안 함(출고 보호)' : '');
  const why0 = (vfy) => banPc() || (!o.enabled() ? '예스24 읽기 꺼짐' : !vfy && R.stop ? '⛔ 문의 답 멈춤 — ' + R.stop.why : o.login() !== 'ok' ? '예스24 로그인 기다림(보내기 전)' : o.holdOn() ? '🚚 출고 중 — 끝나면 이어감(약속 0-1)' : '');
  const addHist = (h) => { R.hist.unshift({ at: now(), ...h }); R.hist = R.hist.slice(0, 40); };
  function put(b) { const ban = banPc(); if (ban) return { code: 409, body: { ok: false, err: ban } }; if (!o.enabled()) return { code: 409, body: { ok: false, err: '번외 예스24 판매관리 읽기가 꺼져 있음 — 옆 창에서 켜기' } };
    const id = String((b && b.id) || ''); if (!ID_RE.test(id)) return { code: 400, body: { ok: false, err: '맡김 번호 꼴이 틀림' } };
    if (R.res[id] || R.wait.some((j) => j.id === id) || (R.cur && R.cur.id === id)) return { code: 200, body: { ok: true, already: true } };
    if (R.stop) return { code: 409, body: { ok: false, stop: true, err: '⛔ 예스24 문의 답 멈춤 — ' + R.stop.why + ' · 확인한 뒤 웹앱 「▶ 예스24 쓰기 이어 가기」' } };
    if (b.rows.length !== 1) return { code: 400, body: { ok: false, err: '문의 답은 한 맡김에 하나만' } };
    const r = b.rows[0]; const qno = String(r.qno || ''); const rid = String(r.rid || qno); if (!QNO_RE.test(qno)) return { code: 400, body: { ok: false, err: '문의 번호 꼴이 틀림' } }; if (!RID_RE.test(rid)) return { code: 400, body: { ok: false, err: '줄 번호 꼴이 틀림' } };
    const tw = txtWhy(r.txt); if (tw) return { code: 400, body: { ok: false, err: tw } };
    if (R.wait.some((j) => j.qno === qno) || (R.cur && R.cur.qno === qno)) return { code: 400, body: { ok: false, err: `같은 문의(${qno})의 답이 이미 줄에 있음 — 되풀이 0` } };
    const s = R.sent[qno]; if (s && (s.st === 'done' || s.st === 'sending') && now() - +s.at < 30 * 86400e3) return { code: 400, body: { ok: false, err: `이 문의(${qno})엔 이미 답을 보냄(${new Date(+s.at + 9 * 36e5).toISOString().slice(5, 16).replace('T', ' ')}) — 되풀이 0` } };
    R.wait.push({ id, rid, qno, txt: r.txt.trim(), by: String(b.by || '').slice(0, 60), at: now() }); save(); note(`❓ 예스24 문의 답 맡김 받음 — 문의 ${qno}(${String(b.by || '').slice(0, 30)})`); o.kick && o.kick(300); return { code: 200, body: { ok: true, took: id } }; }
  function ack(ids) { for (const id of Array.isArray(ids) ? ids.map(String) : []) delete R.res[id]; save(); return { ok: true }; }
  function resume(by) { const was = R.stop; R.stop = null; save(); if (was) note(`▶ 예스24 문의 답 이어 감 — ${String(by || '').slice(0, 40)}`); return { ok: true, was: !!was }; }
  const why = () => (R.wait.length || R.cur ? why0(R.cur && R.cur.vfy) || null : null);
  function state() { return { wait: R.wait.map((j) => ({ id: j.id, n: 1, at: j.at, rids: [j.rid], qa: 1 })), cur: R.cur ? { id: R.cur.id, step: R.cur.step || '', n: 1, rids: [R.cur.rid], qa: 1 } : null, res: R.res, why: why(), stop: R.stop || null }; }
  /* 예스24 쓰기(col2-y24w) 상태와 합침 — 수집기는 /y24/w/state 하나만 봄(대기·하는 중·결과) */
  function merge(ws) { const q = state(); const w = ws && typeof ws === 'object' ? ws : { ok: true }; const wait = [].concat(Array.isArray(w.wait) ? w.wait : [], q.wait); let cur = w.cur || null;
    if (q.cur) { if (!cur) cur = q.cur; else wait.push({ ...q.cur, cur: 1 }); } return { ...w, ok: w.ok !== false, wait, cur, res: { ...(w.res || {}), ...q.res }, why: w.why || q.why || null, qa: { stop: q.stop, n: q.wait.length + (q.cur ? 1 : 0) } }; }
  const pick = () => (R.cur ? !!R.cur.vfy && !why0(true) : R.wait.length > 0 && !why0(false));
  const cur = () => !!R.cur;
  /* 예스24 판매관리 탭 안에서 부름(같은 세션 쿠키 · 화면이 쓰는 머리글) — 시험은 o.api로 갈아 끼움 */
  async function api(p, body) { if (o.api) return o.api(p, body); const H = { ...(o.hdr ? o.hdr() : {}) }; for (const k of Object.keys(H)) if (/^(content-type|cache-control|x-requested-with)$/i.test(k)) delete H[k]; Object.assign(H, { 'Cache-Control': 'no-cache', 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' });
    o.Y.calling = true; try { return await o.ev(`(async()=>{try{const r=await fetch(${JSON.stringify(p)},{method:'POST',headers:${JSON.stringify(H)},body:${JSON.stringify(body)},credentials:'include',cache:'no-store'});const tx=await r.text();let j=null;try{j=JSON.parse(tx)}catch(e){}return{st:r.status,j,login:/login/i.test(new URL(r.url).pathname)}}catch(e){return{st:0,err:String(e.message||e).slice(0,120)}}})()`, 30000); }
    catch (e) { return { st: 0, err: String(e.message).slice(0, 120) }; } finally { await sleep(300); o.Y.calling = false; } }
  async function onHost() { if (o.api) return 'ok'; let h = ''; try { h = new URL((o.Y.br && o.Y.br.frameUrl) || '').host; } catch (e) {} if (h === HOST) return 'ok'; await o.nav(o.BASE + PAGE, 30); const s = await o.ev(o.JS_STATE).catch(() => null); return o.isLoginSt(s) ? 'login' : 'ok'; }
  const loginRes = (r) => !r || r.login || r.st === 401 || r.st === 403;
  async function readInit(qno) { const r = await api(P_INIT, String(parseInt(qno, 10))); if (loginRes(r) && r && (r.login || r.st)) return { ok: false, login: true, why: '로그인 화면으로 감' }; if (!r || r.st !== 200) return { ok: false, why: '답 화면 읽기 ' + ((r && (r.err || 'HTTP ' + r.st)) || '응답 없음') }; return initOf(r.j); }
  /* 웹앱이 보여 줄 문의 본문(목록 응답엔 비어 옴) — 미답변 줄만 · 읽기만 */
  async function detail(qno) { if (!QNO_RE.test(String(qno)) || why0(true)) return null; if ((await onHost()) !== 'ok') return null; const v = await readInit(String(qno)); return v.ok ? { q: v.q, answered: v.answered } : null; }
  function fin(c, res, sentSt) { R.res[c.id] = { at: now(), ...res, rows: { [c.rid]: { state: res.state, msg: res.msg, ...(res.state === 'done' || res.state === 'already' ? { after: { ay: 1 } } : {}) } } };
    if (sentSt) R.sent[c.qno] = { st: sentSt, at: now(), id: c.id }; addHist({ qno: c.qno, st: res.state, msg: String(res.msg || '').slice(0, 120), by: c.by }); R.cur = null; R.msg = res.msg; save();
    note(`❓ 예스24 문의 ${c.qno} — ${res.state === 'done' ? '답 보냄 · 다시 읽어 답 붙은 것 확인' : res.state === 'already' ? '이미 답이 있어 보내지 않음' : res.state === 'unsure' ? '⚠ 확실하지 않음(멈춤)' : '못 보냄'} · ${String(res.msg || '').slice(0, 80)}`); if (res.state === 'done' || res.state === 'already') { try { o.onDone && o.onDone(c.qno); } catch (e) {} } }
  async function once() { let c = R.cur; if (!c) { c = R.wait.shift(); if (!c) return; R.cur = { ...c, step: 'init' }; c = R.cur; save(); }
    try { const h = await onHost(); if (h !== 'ok') { if (!c.vfy) { const { step, ...x } = c; R.wait.unshift(x); R.cur = null; save(); } R.msg = '예스24 로그인 기다림 — 문의 답 보내기 전'; o.setLogin && o.setLogin('need', '문의 답 보내기 전 로그인 화면'); return; }
      if (c.vfy) { const v = await readInit(c.qno); if (v.ok && v.answered) return fin(c, { state: 'done', msg: '도우미가 다시 켜진 뒤 확인 — 예스24에 답이 붙어 있음(다시 보내지 않음)' }, 'done');
        if (v.ok) return fin(c, { state: 'fail', msg: '보내는 사이 도우미가 다시 켜짐 — 예스24에 답이 없음(저장 안 됨 · 다시 보내지 않음)', todo: '웹앱에서 답을 다시 보내기' }, null);
        R.stop = { at: now(), why: `문의 ${c.qno} 답을 보내는 사이 도우미가 다시 켜졌고 확인 읽기도 못 함(${v.why})` }; return fin(c, { state: 'unsure', stop: true, msg: '보냈는지 확실하지 않음 — 다시 보내지 않고 멈춤', todo: '웹앱 🧰 예스24 운영에서 그 문의가 답함인지 본 뒤 「▶ 예스24 쓰기 이어 가기」' }, 'sending'); }
      const v0 = await readInit(c.qno);
      if (!v0.ok) { if (v0.login) { const { step, ...x } = c; R.wait.unshift(x); R.cur = null; save(); o.setLogin && o.setLogin('need', '문의 답 화면이 로그인 화면'); return; } return fin(c, { state: 'fail', pre: true, msg: v0.why + ' — 아무것도 안 보냄', todo: '잠시 뒤 웹앱에서 다시 보내기' }, null); }
      if (v0.answered) return fin(c, { state: 'already', msg: '예스24에 이미 답이 있음 — 보내지 않음(되풀이 0)' }, 'done');
      c.step = 'send'; R.sent[c.qno] = { st: 'sending', at: now(), id: c.id }; save(); /* 여기부터는 다시 켜져도 다시 보내지 않음 */
      const r = await api(P_SAVE, JSON.stringify({ INQRY_NO: String(c.qno), RPT_YN: v0.rpt, ANSWR_CONT: c.txt })); const code = r && r.j && typeof r.j === 'object' ? String(r.j.RESULT_CODE || '') : '';
      await sleep(1500 * SC); const v1 = await readInit(c.qno);
      if (v1.ok && v1.answered) return fin(c, { state: 'done', msg: `답 보냄 — 예스24에서 다시 읽어 답이 붙은 것 확인${code && code !== 'S000' ? '(응답 ' + code.slice(0, 12) + ')' : ''}` }, 'done');
      if (v1.ok) { delete R.sent[c.qno]; return fin(c, { state: 'fail', msg: `예스24가 답을 저장하지 않음(${code ? '응답 ' + code.slice(0, 12) : r && r.st ? 'HTTP ' + r.st : '응답 없음'}) — 다시 읽어도 답 없음`, todo: '답 글을 고쳐 다시 보내기(문제가 되풀이되면 리드에게)' }, null); }
      R.stop = { at: now(), why: `문의 ${c.qno} 답을 보낸 뒤 확인 읽기를 못 함(${v1.why})` }; return fin(c, { state: 'unsure', stop: true, msg: `보냈는지 확실하지 않음(${code === 'S000' ? '예스24는 됨이라고 답함' : '응답 ' + (code || (r && r.st) || '없음')}) — 다시 보내지 않고 멈춤`, todo: '웹앱 🧰 예스24 운영에서 그 문의가 답함인지 본 뒤 「▶ 예스24 쓰기 이어 가기」' }, 'sending'); }
    catch (e) { if (R.cur && R.cur.step !== 'send') { const { step, ...x } = R.cur; R.wait.unshift(x); R.cur = null; save(); } R.msg = '문의 답 오류: ' + String(e.message).slice(0, 100); throw e; } }
  function sum() { return { wait: R.wait.length, cur: R.cur ? { qno: R.cur.qno, step: R.cur.step || '' } : null, stop: R.stop ? { at: R.stop.at, why: String(R.stop.why).slice(0, 160) } : null, why: why(), hist: R.hist.slice(0, 10).map((h) => ({ at: h.at, qno: h.qno, st: h.st, msg: h.msg })), sent: Object.fromEntries(Object.entries(R.sent).filter(([, v]) => now() - +v.at < 30 * 86400e3).slice(-30).map(([k, v]) => [k, { st: v.st, at: v.at }])) }; }
  return { put, ack, resume, state, merge, pick, cur, once, detail, sum, isQa, R };
}
module.exports = { makeY24QA, isQa, txtWhy, initOf };
