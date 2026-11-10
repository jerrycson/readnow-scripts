/* col2-relogin.js — 🔐 번외 수집기 '스스로 다시 로그인' (정범님 11/10 아침 '번외에서 예스24가 자주 로그아웃돼 — 필요할 때 스스로 다시 로그인 · 다른 플랫폼들도 끊길 경우를 생각해서')
 * 언제 하나(모두 맞을 때만):
 *   · 그 일(예스24·알라딘)이 켜져 있고 세션이 풀려 '로그인 필요'가 됨 · 그 PC에 아이디·비밀번호가 저장돼 있고(col2-cred.js · DPAPI) '스스로 다시 로그인'이 켜짐
 *   · 로거 PC 아님(약속 0) · 🚚 출고 중(이 PC 출고·MJ-MAIN 보호) 아님 — 출고 중엔 끝날 때까지 미룸(약속 0-1)
 *   · 알라딘은 번외 자리(<PC>~col2)를 받은 때만(판매자 동시 로그인 ≤4대 — 자리 규칙과 부딪히지 않게) · 핑퐁 의심으로 멈춘 동안은 안 함
 *   · 속도 제한: 앞 시도 뒤 gapMin분 · 한 시간 perHour번 · 하루 perDay번 · 연속 failStop번 실패면 멈추고 알림(정범님이 [다시 해 보기]를 누를 때까지)
 *   · 보안 문자·2단계 인증·추가 인증 화면이 보이면 그 자리에서 멈추고 알림(사람 손이 필요한 일 — 몇 번이고 두드리지 않음)
 * 하는 법(사람처럼): 로그인 화면 → 아이디 칸을 눌러 한 글자씩이 아니라 붙여 넣듯(CDP Input.insertText — 화면 코드에 값이 실리지 않음) → 1~2초 → 비밀번호 칸 → 1~2초 → [로그인]
 *   → 그 일의 첫 화면을 다시 열어 로그인됐는지 확인 · 다시 로그인한 일·시각·결과는 기록(비밀번호·아이디는 빼고) · 상태 relogin.json(값 없음)
 * 근거: 없음, 설정(col2.json relogin)으로 바꿈 */
'use strict';
const fs = require('fs'), path = require('path');
const DEF = { perHour: 3, perDay: 10, gapMin: 5, failStop: 2 };
/* 사람 손이 필요한 화면 — 보안 문자·자동 입력 방지·2단계·인증 번호·추가 인증 */
const JS_HUMAN = `(()=>{const t=(document.body&&document.body.innerText||'').slice(0,20000);const q=(s)=>!!document.querySelector(s);
if(q('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],.g-recaptcha,[name*="captcha" i],[id*="captcha" i],img[src*="captcha" i],[name*="otp" i],[id*="otp" i]'))return'보안 문자·인증 번호 칸';
const m=t.match(/(보안\\s*문자|자동\\s*입력\\s*방지|자동입력방지|2단계\\s*인증|2차\\s*인증|추가\\s*인증|본인\\s*인증|인증\\s*번호를?\\s*입력|기기\\s*인증|새로운\\s*기기)/);return m?m[1]:''})()`;
/* 로그인 칸 찾기(비밀번호 칸이 있는 양식의 보이는 글 칸) — 값은 넣지 않고 표시만 */
const JS_FORM = `(()=>{const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';const pw=[...document.querySelectorAll('input[type=password]')].find(vis);
if(!pw)return{pw:false};const f=pw.form||document;const id=[...f.querySelectorAll('input')].filter((e)=>vis(e)&&e!==pw&&/^(text|email|tel|)$/i.test(e.getAttribute('type')||'')).pop();
document.querySelectorAll('[data-rn3-id],[data-rn3-pw]').forEach((e)=>{e.removeAttribute('data-rn3-id');e.removeAttribute('data-rn3-pw')});pw.setAttribute('data-rn3-pw','1');pw.setAttribute('autocomplete','off');if(id){id.setAttribute('data-rn3-id','1');id.setAttribute('autocomplete','off')}return{pw:true,id:!!id}})()`;
const JS_FOCUS = (a) => `(()=>{const e=document.querySelector('[${a}]');if(!e)return false;e.focus();e.select&&e.select();if(e.value){e.value='';e.dispatchEvent(new Event('input',{bubbles:true}))}return document.activeElement===e})()`;
const JS_LEN = (a) => `(()=>{const e=document.querySelector('[${a}]');return e?e.value.length:-1})()`;
const JS_SUBMIT = `(()=>{const pw=document.querySelector('[data-rn3-pw]');if(!pw)return'none';const f=pw.form;const bs=f?[...f.querySelectorAll('button,input[type=submit],input[type=image],a')]:[];
const b=bs.find((x)=>/^(submit|image)$/i.test(x.type||'')&&!/취소|찾기|가입/.test(x.innerText||x.value||''))||bs.find((x)=>/로그인|login/i.test((x.innerText||x.value||x.alt||'').trim()));
if(b){b.click();return'click'}if(f){f.requestSubmit?f.requestSubmit():f.submit();return'submit'}pw.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,bubbles:true}));return'enter'})()`;

/* 로그인 한 번(사람처럼) — getK()는 {ok,id,pw}|{ok:false,err}를 주는 함수(저장된 계정 풀기 또는 지금 넣은 값) · 풀린 값은 이 안에서만 쓰고 버림 → {ok, how}|{ok:false, why, human, bad}
 *  (11/10 밤 정범님 '예스24는 「확인 중」만 오래 있다가 그냥 풀려') ctx.phase(글)로 지금 무엇을 하는지 알림(화면에 '몇 초째'로) — 시간이 넘으면 phase가 오류를 던져 그 자리에서 멈춤
 *  bad = 로그인 칸에 넣고 눌렀는데도 로그인 화면(사이트가 틀렸다고 함) — 이것만 '틀림'으로 봄 · 나머지 실패(화면이 안 열림·칸 못 찾음·크롬 응답 없음·시간 넘음)는 '확인 못 함' */
async function doLogin(ctx, getK) { let res = null; const ph = (t) => (ctx.phase ? ctx.phase(t) : null);
  ph(`${ctx.name || ''} 로그인 화면 여는 중`); await ctx.nav(ctx.loginUrl, 30); ph('보안 문자·추가 인증 화면인지 살피는 중'); const h0 = await ctx.ev(JS_HUMAN, 10000).catch(() => '');
      if (h0) res = { ok: false, human: true, why: `로그인 화면에 ${h0} — 사람 손이 필요` };
      else { ph('아이디·비밀번호 칸 찾는 중'); const f = await ctx.ev(JS_FORM, 10000); if (!f || !f.pw || !f.id) res = { ok: false, why: '로그인 칸을 못 찾음(화면이 바뀐 듯)' };
        else { let k = await getK(); if (!k.ok) res = { ok: false, why: k.err };
          else { try { ph('아이디 넣는 중'); await ctx.sleep(800, 1800); if (!(await ctx.ev(JS_FOCUS('data-rn3-id')))) throw new Error('아이디 칸을 못 누름'); await ctx.type(k.id); await ctx.sleep(900, 2000);
              ph('비밀번호 넣는 중'); if (!(await ctx.ev(JS_FOCUS('data-rn3-pw')))) throw new Error('비밀번호 칸을 못 누름'); await ctx.type(k.pw); const n = await ctx.ev(JS_LEN('data-rn3-pw')); if (n !== k.pw.length) throw new Error('비밀번호가 다 들어가지 않음');
            } finally { k = null; } /* 풀린 값은 여기서 버림 */
            if (!res) { await ctx.sleep(900, 2000); ph('[로그인]을 누르고 답을 기다리는 중'); const go = await ctx.ev(JS_SUBMIT); await ctx.sleep(2500, 4000); if (ctx.settle) await ctx.settle();
              ph('로그인 뒤 화면 살피는 중'); const h1 = await ctx.ev(JS_HUMAN, 10000).catch(() => ''); if (h1) res = { ok: false, human: true, why: `로그인 뒤 ${h1} 화면 — 사람 손이 필요` };
              else { ph('로그인 됐는지 첫 화면으로 확인하는 중'); res = (await ctx.check()) ? { ok: true, how: go } : { ok: false, bad: true, why: '로그인 뒤에도 로그인 화면(아이디·비밀번호가 틀렸거나 막힘)' }; } } } } }
  return res; }
function makeRelogin(o) { const { HOME, note, cred, TEST } = o; const now = () => Date.now(); const F = path.join(HOME, 'relogin.json');
  const C = () => ({ ...DEF, ...(((o.cfg() || {}).relogin) || {}) });
  let S = {}; try { S = JSON.parse(fs.readFileSync(F, 'utf8')) || {}; } catch (e) { S = {}; }
  const save = () => { try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  const P = (pf) => (S[pf] = S[pf] || { tries: [], fails: 0, stop: null, last: null, auto: true, n: 0 });
  const isLogger = () => { try { return !!o.isLogger(); } catch (e) { return true; } };
  const autoOn = (pf) => P(pf).auto !== false;
  /* 지금 해도 되나 → null(됨) | 까닭 */
  function why(pf, ctx) { const p = P(pf), c = C(), t = now(); p.tries = p.tries.filter((x) => t - x < 86400e3);
    if (isLogger()) return '로거 PC — 계정을 쓰지 않음(약속 0)'; if (!cred.has(pf)) return '저장된 계정 없음(⚙ › 🔐 스스로 다시 로그인에서 넣으면 됨)'; if (!autoOn(pf)) return '스스로 다시 로그인 꺼 둠';
    if (p.stop) return `멈춤 — ${p.stop.why} (⚙ › 🔐에서 [다시 해 보기])`; if (ctx.hold) return '🚚 출고 중 — 끝난 뒤 다시 로그인(약속 0-1)'; if (ctx.seat === false) return '🪑 번외 로그인 자리를 아직 못 받음 — 자리를 받으면 다시 로그인';
    if (ctx.pp) return '핑퐁 의심으로 멈춘 동안은 안 함'; const last = p.tries[p.tries.length - 1] || 0; if (t - last < c.gapMin * 60e3) return `앞 시도 뒤 ${c.gapMin}분 기다림`;
    if (p.tries.filter((x) => t - x < 3600e3).length >= c.perHour) return `한 시간 ${c.perHour}번까지 — 다음 시간에`; if (p.tries.length >= c.perDay) return `하루 ${c.perDay}번까지 — 내일`; return null; }
  /* 한 번 다시 로그인 — ctx = { name, loginUrl, nav(url,sec), ev(js,ms), type(text), check()→참/거짓, sleep(ms) } → { ok, why, human } */
  async function run(pf, ctx) { const p = P(pf), c = C(); p.tries.push(now()); p.n++; save(); const nm = ctx.name; let res = null;
    note(`🔐 ${nm} 세션이 풀려 저장된 계정으로 스스로 다시 로그인함(오늘 ${p.tries.length}번째 · 비밀번호는 기록하지 않음)`);
    try { res = await doLogin(ctx, () => cred.open(pf)); }
    catch (e) { res = { ok: false, why: String(e && e.message || e).slice(0, 120) }; }
    p.last = { at: now(), ok: res.ok, why: res.ok ? null : res.why };
    const was = cred.chkOf ? cred.chkOf(pf) : 'ok';
    if (res.ok) { p.fails = 0; if (was !== 'ok' && cred.mark) { cred.mark(pf, 'ok'); note(`🔐 ${nm} — 확인하지 못한 채 잠가 두었던 아이디·비밀번호가 맞음(이번 다시 로그인으로 확인됨)`, { l: 'ok' }); } note(`🔐 ${nm} 스스로 다시 로그인 됨 — 하던 일을 이어 감`, { l: 'ok' }); }
    else if (res.bad && was === 'pending') { p.fails++; if (cred.mark) cred.mark(pf, 'bad'); p.stop = { at: now(), why: '잠가 저장할 때 확인하지 못했던 아이디·비밀번호가 맞지 않음 — ⚙ › 🔐에서 다시 넣어 주세요', bad: true };
      note(`⛔ ${nm} — 확인하지 못한 채 잠가 두었던 아이디·비밀번호가 맞지 않음(이번 다시 로그인에서 드러남) · 스스로 다시 로그인을 멈춤(계정 잠김 막기) · 옆 창 ⚙ › 🔐에서 바른 값을 다시 넣어 주세요`, { l: 'err' }); }
    else { p.fails++; if (res.human) { p.stop = { at: now(), why: res.why, human: true }; note(`⛔ ${nm} 스스로 다시 로그인 멈춤 — ${res.why} · 옆 창 [🔐 ${nm} 로그인]으로 직접 한 번 해 주세요`, { l: 'err' }); }
      else if (p.fails >= c.failStop) { p.stop = { at: now(), why: `연속 ${p.fails}번 실패 — ${res.why}` }; note(`⛔ ${nm} 스스로 다시 로그인 연속 ${p.fails}번 실패 — 멈추고 알림(계정 잠김을 막으려고) · 까닭: ${res.why} · 옆 창에서 직접 로그인하거나 ⚙ › 🔐에서 계정을 고친 뒤 [다시 해 보기]`, { l: 'err' }); }
      else note(`🔐 ${nm} 스스로 다시 로그인 실패 — ${res.why} · ${c.gapMin}분 뒤 한 번 더`, { l: 'warn' }); }
    save(); return res; }
  /* (정범님 11/10 '아이디/비번을 넣는 곳은 저장을 누르면 먼저 맞는지 확인 → 맞으면 저장 · 틀리면 다시 넣어 주세요와 까닭') 저장 전 확인 로그인 — 지금 넣은 값으로 한 번(값은 이 안에서만 · 기록 안 함)
   *  속도: 확인은 한 시간 vPerHour번(기본 4) · 앞 확인 뒤 vGapSec초(기본 40) — 틀린 비밀번호를 거듭 넣어 계정이 잠기지 않게 · 스스로 다시 로그인 셈(tries)과 따로 · 멈춤(stop)은 맞으면 풂 */
  async function tryWith(pf, ctx, id, pw) { const p = P(pf), c = C(), t = now(); p.vt = (p.vt || []).filter((x) => t - x < 3600e3); const vh = +c.vPerHour || 4, vg = (c.vGapSec == null ? 40 : +c.vGapSec) * 1000;
    if (isLogger()) return { ok: false, why: '로거 PC — 계정을 쓰지 않음(약속 0)' }; if (p.vt.length >= vh) return { ok: false, wait: true, why: `확인 로그인은 한 시간 ${vh}번까지(계정 잠김 막기) — 조금 뒤 다시` };
    const last = p.vt[p.vt.length - 1] || 0; if (t - last < vg) return { ok: false, wait: true, why: `앞 확인 바로 뒤 — ${Math.ceil((vg - (t - last)) / 1000)}초 뒤 다시` };
    p.vt.push(t); save(); const nm = ctx.name; note(`🔐 ${nm} — 넣은 아이디·비밀번호가 맞는지 이 PC에서 실제로 로그인해 봄(저장 전 확인 · 값은 기록하지 않음)`);
    let res; try { res = await doLogin(ctx, async () => ({ ok: true, id: String(id == null ? '' : id), pw: String(pw == null ? '' : pw) })); } catch (e) { res = { ok: false, why: String(e && e.message || e).slice(0, 120) }; } finally { id = pw = null; }
    res = res || { ok: false, why: '모름' }; if (!res.ok && ctx.lastMsg) { const m = String(ctx.lastMsg() || '').slice(0, 120); if (m) res.why += ` · ${nm} 알림: '${m}'`; }
    if (!res.ok && !res.bad && !res.human) res.unsure = true; /* 사이트가 틀렸다고 한 게 아님 — 확인을 끝내지 못함 */
    p.lastV = { at: now(), ok: !!res.ok, why: res.ok ? null : res.why, human: !!res.human, unsure: !!res.unsure }; if (res.ok) { p.stop = null; p.fails = 0; } save();
    note(res.ok ? `🔐 ${nm} 계정 확인 — 로그인 됨(맞음)` : res.unsure ? `🔐 ${nm} 계정 확인 못 함 — 저장하지 않음 · ${res.why}` : `🔐 ${nm} 계정 확인 — 맞지 않아 저장하지 않음 · ${res.why}`, { l: res.ok ? 'ok' : 'warn' }); return res; }
  /* (11/10 밤) [확인하고 저장] 진행 — 화면이 '확인 중 — 무엇을(몇 초째)'·끝난 결과를 그대로 보이게(값 없음) · 도우미가 다시 켜지면 하던 확인은 '끊김'으로 */
  for (const k of Object.keys(S)) { const jb = S[k] && S[k].job; if (jb && jb.on) { jb.on = false; jb.end = now(); jb.res = { ok: false, kind: 'unsure', msg: '확인하는 동안 도우미가 다시 켜져 확인이 끊김 — 다시 [확인하고 저장]을 눌러 주세요(저장하지 않음)', canForce: true }; } }
  function jobStart(pf, maxSec) { const p = P(pf); const jb = { on: true, at0: now(), phase: '시작', atP: now(), max: maxSec || 0, abort: false, res: null }; p.job = jb; save();
    jb.ph = (t) => { if (jb.abort) throw new Error(`${jb.max}초 안에 끝나지 않아 확인을 멈춤(마지막 단계: ${jb.phase})`); jb.phase = String(t || '').slice(0, 80); jb.atP = now(); }; return jb; }
  function jobEnd(pf, r) { const p = P(pf); const jb = p.job; if (!jb) return; jb.on = false; jb.end = now(); jb.res = r ? { ok: !!r.ok, kind: String(r.kind || ''), msg: String(r.msg || '').slice(0, 400), canForce: !!r.canForce } : null; save(); }
  const jobOn = (pf) => { const jb = P(pf).job; return !!(jb && jb.on); };
  const anyJob = () => Object.keys(S).some((k) => jobOn(k));
  const jobView = (pf) => { const jb = P(pf).job; if (!jb) return null; return { on: !!jb.on, at0: jb.at0, phase: jb.phase, atP: jb.atP, max: jb.max, end: jb.end || null, res: jb.res || null }; };
  const reset = (pf) => { const p = P(pf); p.stop = null; p.fails = 0; save(); note(`🔐 ${(cred.PF[pf] || {}).name || pf} 스스로 다시 로그인 — 멈춤을 풀고 다시 해 봄`); return { ok: true }; };
  const setAuto = (pf, on) => { P(pf).auto = !!on; save(); return { ok: true }; };
  const sum = () => { const out = {}; const cs = cred.sum(); for (const k of Object.keys(cred.PF)) { const p = P(k); out[k] = { ...cs[k], auto: autoOn(k), stop: p.stop, last: p.last, job: jobView(k), today: p.tries.filter((x) => now() - x < 86400e3).length, n: p.n }; } return out; };
  return { why, run, tryWith, reset, setAuto, sum, C, jobStart, jobEnd, jobOn, anyJob };
}
module.exports = { makeRelogin, doLogin, DEF, JS_HUMAN, JS_FORM, JS_SUBMIT };
