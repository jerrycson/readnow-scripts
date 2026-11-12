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
/* (11/11 정범님 '예스24 아이디·비번이 안 먹힘') 양식(form)이 없는 화면(Vue 같은 한 장 화면)도 — 아이디 칸 = 비밀번호 칸 바로 앞의 보이는 글 칸(없으면 바로 뒤) · 화면 전체의 마지막 글 칸(검색 칸 등)을 잡지 않게 */
const JS_FORM = `(()=>{const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';const pw=[...document.querySelectorAll('input[type=password]')].find(vis);
if(!pw)return{pw:false};const f=pw.form||document;const T=[...f.querySelectorAll('input')].filter((e)=>vis(e)&&e!==pw&&/^(text|email|tel|)$/i.test(e.getAttribute('type')||''));
const pre=T.filter((e)=>pw.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING);const id=pre.length?pre[pre.length-1]:T.find((e)=>pw.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING);
document.querySelectorAll('[data-rn3-id],[data-rn3-pw]').forEach((e)=>{e.removeAttribute('data-rn3-id');e.removeAttribute('data-rn3-pw')});pw.setAttribute('data-rn3-pw','1');pw.setAttribute('autocomplete','off');if(id){id.setAttribute('data-rn3-id','1');id.setAttribute('autocomplete','off')}return{pw:true,id:!!id,form:!!pw.form}})()`;
const JS_FOCUS = (a) => `(()=>{const e=document.querySelector('[${a}]');if(!e)return false;e.focus();e.select&&e.select();if(e.value){e.value='';e.dispatchEvent(new Event('input',{bubbles:true}))}return document.activeElement===e})()`;
const JS_FOCUS0 = `(()=>{const e=document.querySelector('[data-rn3-pw]');if(!e)return false;e.focus();return document.activeElement===e})()`;
const JS_LEN = (a) => `(()=>{const e=document.querySelector('[${a}]');return e?e.value.length:-1})()`;
/* [로그인] 누르기 — 양식 안 단추 → (양식이 없거나 단추가 없으면) 화면 전체에서 비밀번호 칸 뒤의 보이는 '로그인' 단추 → 그래도 없으면 'none'(부른 쪽이 진짜 Enter 키를 누름)
 *  (11/11) 예전엔 양식이 없으면 가짜 Enter(keydown)만 보내 — 한 장 화면(Vue @keyup.enter·@click)은 아무 일도 안 해 '로그인 뒤에도 로그인 화면'이 됐음 */
const JS_SUBMIT = `(()=>{const pw=document.querySelector('[data-rn3-pw]');if(!pw)return'none';const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.disabled;const f=pw.form;
const NO=/취소|찾기|가입|카카오|네이버|페이코|애플|구글|간편|인증서|QR|저장/i;const tx=(x)=>(x.innerText||x.value||x.alt||x.title||x.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
const bs=f?[...f.querySelectorAll('button,input[type=submit],input[type=image],a')].filter(vis):[];
let b=bs.find((x)=>/^(submit|image)$/i.test(x.type||'')&&!NO.test(tx(x)))||bs.find((x)=>/로그인|login/i.test(tx(x))&&!NO.test(tx(x)));
if(!b){const all=[...document.querySelectorAll('button,input[type=submit],input[type=button],input[type=image],a,[role=button]')].filter((x)=>vis(x)&&x.closest('header,nav')===null&&/^(로그인|login|log in|sign in)$/i.test(tx(x))&&!NO.test(tx(x)));
b=all.find((x)=>pw.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING)||all[0]}
if(b){b.click();return'click'}if(f){f.requestSubmit?f.requestSubmit():f.submit();return'submit'}return'none'})()`;
/* 로그인 뒤 — 아직 로그인 화면인지(주소·비밀번호 칸) · 화면에 보이는 오류 글(값 없음 · 120자) */
const JS_WHERE = `(()=>{const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';const pw=[...document.querySelectorAll('input[type=password]')].some(vis);
const t=(document.body&&document.body.innerText||'').slice(0,20000);const m=t.match(/[^\n]{0,40}(일치하지|올바르지|잘못\s*입력|틀렸|확인해\s*주|다시\s*입력|잠금|잠겼|제한|정지|실패|중복\s*로그인|다른\s*(곳|기기|PC)에서)[^\n]{0,40}/);
return{login:/login/i.test(location.pathname)||pw,p:location.pathname,err:m?m[0].trim().slice(0,120):''}})()`;
/* (11/11 y24ops2 · 정범님 HOME '저장된 계정이 있는데 로그인 화면에 멈춤') 실패 때 로그인 화면 모양 — 입력 칸 종류·수 · 보이는 단추 글(짧게) · 숨은 칸 수 · 틀(iframe) 수 · 보안 문자 칸 · 주소 — 값은 읽지 않음 */
const JS_SHAPE = `(()=>{const vis=(e)=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';const I=[...document.querySelectorAll('input')];const c={};I.filter(vis).forEach((e)=>{const t=(e.getAttribute('type')||'text').toLowerCase();c[t]=(c[t]||0)+1});
const hid=I.filter((e)=>(e.getAttribute('type')||'').toLowerCase()==='hidden').length;const B=[...document.querySelectorAll('button,input[type=submit],input[type=button],a[role=button],[role=button]')].filter(vis).map((b)=>(b.innerText||b.value||'').replace(/\s+/g,' ').trim().slice(0,12)).filter(Boolean).slice(0,8);
const fr=document.querySelectorAll('iframe').length;const cap=!!document.querySelector('iframe[src*="recaptcha"],.g-recaptcha,[name*="captcha" i],[id*="captcha" i],img[src*="captcha" i]');
return '주소 '+location.pathname.slice(0,40)+' · 입력 칸 '+(Object.entries(c).map(([k,v])=>k+' '+v).join('·')||'없음')+' · 숨은 칸 '+hid+' · 단추 ['+B.join(' | ')+'] · 틀 '+fr+(cap?' · 보안 문자 칸 있음':' · 보안 문자 칸 없음')+(document.forms.length?' · 양식 '+document.forms.length:' · 양식 없음')})()`;
/* (11/11 fix5 · 정범님 'HOME 번외 알라딘 확인하고 저장이 실패 — 알림 「로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-…)」') 알라딘 '새 로그인 막힘' 알림
 *  근거: app_settings/aladin_login 기록 — 10/26~11/07 아이디·비밀번호(cred) 새 로그인 11번이 모두 같은 코드 42FB6013-7046으로 막힘 · 같은 때 네이버로 로그인(naver)은 성공(JS-MAIN 11/01)
 *        · 10/14·10/26 정범님 시크릿 창(사람 손)도 같은 막힘 · 운영 수집기는 그래서 '네이버로 로그인'만 씀(src/readnow-collector.src.js rnNaverLogin · BLOCK_RE 같은 글자)
 *  → 이 알림은 아이디·비밀번호가 틀린 것이 아님(bad로 보지 않음 · 저장 값 '틀림' 표시·계정 잠김 셈을 하지 않음) · 아이디 로그인을 거듭 두드리지 않고 그 자리에서 멈춤 */
const BLOCK_RE = /로그인\s*과정에\s*문제|에러\s*코드\s*[:：]?\s*42FB|\b42FB[0-9A-F]{2,}/i;
const isBlock = (m) => BLOCK_RE.test(String(m || ''));
const codeOf = (m) => { const x = String(m || '').match(/에러\s*코드\s*[:：]?\s*([0-9A-F]{4,}(?:-[0-9A-F]+)?)/i) || String(m || '').match(/\b(42FB[0-9A-F]{2,}(?:-[0-9A-F]+)?)/i); return x ? x[1].toUpperCase().slice(0, 24) : isBlock(m) ? '42FB' : null; };
const blockWhy = (nm, code) => `${nm || '사이트'}이(가) 이 계정의 아이디·비밀번호 새 로그인을 막음(에러코드 ${code || '42FB'} — 아이디·비밀번호가 틀린 것이 아님 · 10/14·10/26부터 알라딘이 아이디 로그인을 막아 운영 수집기도 '네이버로 로그인'만 씀)`;
const JS_ENTER = `(()=>{const pw=document.querySelector('[data-rn3-pw]');if(!pw)return false;pw.focus();for(const t of ['keydown','keypress','keyup'])pw.dispatchEvent(new KeyboardEvent(t,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));return true})()`;
/* 로그인 한 번(사람처럼) — getK()는 {ok,id,pw}|{ok:false,err}를 주는 함수(저장된 계정 풀기 또는 지금 넣은 값) · 풀린 값은 이 안에서만 쓰고 버림 → {ok, how}|{ok:false, why, human, bad}
 *  (11/10 밤 정범님 '예스24는 「확인 중」만 오래 있다가 그냥 풀려') ctx.phase(글)로 지금 무엇을 하는지 알림(화면에 '몇 초째'로) — 시간이 넘으면 phase가 오류를 던져 그 자리에서 멈춤
 *  bad = 로그인 칸에 넣고 눌렀는데도 로그인 화면(사이트가 틀렸다고 함) — 이것만 '틀림'으로 봄 · 나머지 실패(화면이 안 열림·칸 못 찾음·크롬 응답 없음·시간 넘음)는 '확인 못 함' */
/* (11/12 login1) 🔁 「이미 로그인된」 화면 이어받기 한 걸음 — ctx.takeover() → {did, page, none, why, btn} · 눌렀으면 참(ctx.tkDid) · 그 화면인데 못 누르면 ctx.tkNone(까닭 · 아이디·비밀번호 틀림으로 보지 않게) */
async function tkStep(ctx, ph, at) { let t = null; try { ph(at === 'pre' ? '「이미 로그인된」 화면인지 보는 중' : '「이미 로그인된」 화면이면 다른 곳 세션을 끊고 이어받는 중'); for (let i = 0; i < 3; i++) { t = await ctx.takeover(); if (t && (t.page !== undefined || t.did)) break; await ctx.sleep(800, 1200); } } catch (e) { t = null; } /* 화면이 바뀌는 중이면 읽기가 실패할 수 있어 세 번까지 */
  if (t && t.did) { ctx.tkDid = { btn: t.btn || '', at: Date.now(), where: at }; await ctx.sleep(2500, 4000); if (ctx.settle) await ctx.settle(); return true; }
  if (t && t.page) ctx.tkNone = `「이미 로그인된」 화면 — ${t.why || '이어받지 않음'}(아이디·비밀번호는 맞음)`; return false; }
async function doLogin(ctx, getK) { let res = null; const ph = (t) => (ctx.phase ? ctx.phase(t) : null);
  /* (11/11 fix5) ctx.pre = 값을 넣지 않는 다른 길(알라딘 = 이 번외 크롬에 남은 네이버 '로그인 상태 유지'로 「네이버로 로그인」 — 운영 수집기와 같은 길) · 되면 아이디·비밀번호를 쓰지 않음 */
  if (ctx.pre) { ph(`${ctx.name || ''} — 네이버로 로그인 해 보는 중(아이디·비밀번호를 넣지 않음)`); let pr = null; try { pr = await ctx.pre(); } catch (e) { pr = { ok: false, why: String(e && e.message || e).slice(0, 80) }; } if (pr && pr.ok) return { ok: true, how: 'naver' }; ctx.preWhy = (pr && pr.why) || '네이버로 로그인 안 됨'; if (ctx.preOnly) return { ok: false, blocked: !!ctx.preBlocked, why: ctx.preWhy }; }
  ph(`${ctx.name || ''} 로그인 화면 여는 중`); await ctx.nav(ctx.loginUrl, 30); ph('보안 문자·추가 인증 화면인지 살피는 중'); const h0 = await ctx.ev(JS_HUMAN, 10000).catch(() => '');
      if (h0) res = { ok: false, human: true, why: `로그인 화면에 ${h0} — 사람 손이 필요` };
      else if (ctx.takeover && (await tkStep(ctx, ph, 'pre')) && (await ctx.check())) return { ok: true, how: 'takeover', tk: ctx.tkDid }; /* (11/12 login1) 첫 화면부터 「이미 로그인된」이면 이어받기 → 되면 값을 넣지 않고 끝 */
      else { if (ctx.tkDid) { ph(`${ctx.name || ''} 로그인 화면 다시 여는 중`); await ctx.nav(ctx.loginUrl, 30); } ph('아이디·비밀번호 칸 찾는 중'); const f = await ctx.ev(JS_FORM, 10000); if (!f || !f.pw || !f.id) res = { ok: false, why: '로그인 칸을 못 찾음(화면이 바뀐 듯)' };
        else { let k = await getK(); if (!k.ok) res = { ok: false, why: k.err };
          else { try { ph('아이디 넣는 중'); await ctx.sleep(800, 1800); if (!(await ctx.ev(JS_FOCUS('data-rn3-id')))) throw new Error('아이디 칸을 못 누름'); await ctx.type(k.id); await ctx.sleep(900, 2000);
              ph('비밀번호 넣는 중'); if (!(await ctx.ev(JS_FOCUS('data-rn3-pw')))) throw new Error('비밀번호 칸을 못 누름'); await ctx.type(k.pw); const n = await ctx.ev(JS_LEN('data-rn3-pw')); if (n !== k.pw.length) throw new Error('비밀번호가 다 들어가지 않음');
            } finally { k = null; } /* 풀린 값은 여기서 버림 */
            if (!res) { await ctx.sleep(900, 2000); ph('[로그인]을 누르고 답을 기다리는 중'); let go = await ctx.ev(JS_SUBMIT);
              if (go === 'none') { if (ctx.key && (await ctx.ev(JS_FOCUS0))) { await ctx.key('Enter'); go = 'key'; } else { await ctx.ev(JS_ENTER); go = 'enter'; } } /* 단추를 못 찾으면 진짜 Enter 키(사람이 비밀번호 칸에서 Enter를 친 것과 같음) */
              await ctx.sleep(2500, 4000); if (ctx.settle) await ctx.settle();
              /* (11/11) 로그인 화면을 떠날 때까지 기다림(요청이 늦으면 너무 일찍 첫 화면으로 가 로그인 요청을 끊지 않게) — 최대 leaveSec초(기본 15) */
              ph('로그인 화면을 떠나기를 기다리는 중'); let w = null; const t0 = Date.now(); const lim = (ctx.leaveSec == null ? 15 : +ctx.leaveSec) * 1000; for (;;) { w = await ctx.ev(JS_WHERE, 10000).catch(() => null); if (!w || !w.login || Date.now() - t0 >= lim) break; await ctx.sleep(700, 1000); }
              if (ctx.takeover && (!w || w.login) && (await tkStep(ctx, ph, 'post'))) { const t1 = Date.now(); for (;;) { w = await ctx.ev(JS_WHERE, 10000).catch(() => null); if (!w || !w.login || Date.now() - t1 >= lim) break; await ctx.sleep(700, 1000); } } /* (11/12 login1) 🔁 이어받기 단추를 누른 뒤 다시 기다림 */
              ph('로그인 뒤 화면 살피는 중'); const h1 = await ctx.ev(JS_HUMAN, 10000).catch(() => ''); if (h1) res = { ok: false, human: true, why: `로그인 뒤 ${h1} 화면 — 사람 손이 필요` };
              else { ph('로그인 됐는지 첫 화면으로 확인하는 중'); const em = (w && w.login && w.err) ? w.err : '';
                const dm = ctx.lastMsg ? String(ctx.lastMsg() || '') : ''; const bm = isBlock(dm) ? dm : isBlock(em) ? em : '';
                res = (await ctx.check()) ? { ok: true, how: ctx.tkDid ? 'takeover' : go, tk: ctx.tkDid || null } : ctx.tkDid ? { ok: false, tk: true, how: go, why: `「이미 로그인된」 화면에서 [${ctx.tkDid.btn || '이어받기'}]을 눌렀는데도 로그인 화면(다른 곳 세션을 끊지 못함 — 아이디·비밀번호는 맞음)` } : ctx.tkNone ? { ok: false, tk: true, how: go, why: ctx.tkNone } : bm ? { ok: false, blocked: true, code: codeOf(bm), how: go, why: blockWhy(ctx.name, codeOf(bm)) + (ctx.preWhy ? ` · 네이버로 로그인: ${ctx.preWhy}` : '') } : { ok: false, bad: true, how: go, why: '로그인 뒤에도 로그인 화면(아이디·비밀번호가 틀렸거나 막힘)' + (em ? ` · 화면 글: '${em}'` : '') + ` · 누른 방법: ${({ click: '단추', submit: '양식 보냄', key: 'Enter 키', enter: '가짜 Enter' })[go] || go}` }; } } } } }
  if (res && !res.ok && !res.human && ctx.shape) { const sh = await ctx.ev(JS_SHAPE, 8000).catch(() => ''); if (sh) { res.why = (res.why || '') + ` · 화면 모양: ${String(sh).slice(0, 220)}`; res.shape = String(sh).slice(0, 220); } } /* (11/11 y24ops2) 실패면 까닭에 화면 모양까지(값 없음) */
  return res; }
/* (11/11) 로그인하는 동안 뜬 브라우저 알림·물음 — 알림(alert)은 닫고, '다른 곳 접속을 끊고 로그인할까요' 같은 로그인 이어 가기 물음만 '예'(사람이 로그인할 때 누르는 것과 같음)
 *  · 삭제·탈퇴·해지·변경 같은 말이 있으면 늘 '아니오' · 로그인 일 밖에서는 이 규칙을 쓰지 않음(부른 쪽이 로그인 중일 때만) */
/* (11/11 정범님 '로그인 화면이 떠 있다는 것만으로 직접 로그인하는 중이라고 봄') 로그인 창에서 사람이 실제로 키·마우스를 쓴 마지막 때(진짜 입력만 · 그 화면 메모리에만 — 우리 기기 저장소는 쓰지 않음 · 화면이 새로 열리면 처음부터) · 값은 읽지 않음 */
const ACT_SRC = `(()=>{if(window.__rn3a)return;window.__rn3a=1;const f=(e)=>{if(e.isTrusted)window.__rn3k=Date.now()};['keydown','mousedown','paste','wheel'].forEach((t)=>addEventListener(t,f,true))})()`;
const JS_ACT = `(()=>{${ACT_SRC};const k=+window.__rn3k||0;const a=document.activeElement;return{age:k?Date.now()-k:null,fc:!!a&&/^(INPUT|TEXTAREA)$/.test(a.tagName),p:location.pathname}})()`;
const dlgOk = (type, msg) => { if (type === 'alert' || type === 'beforeunload') return true; const m = String(msg || ''); return /로그인|접속|세션|중복|기존|계속/.test(m) && !/삭제|탈퇴|해지|변경|취소하시|등록|발송|처리/.test(m); };
function makeRelogin(o) { const { HOME, note, cred, TEST } = o; const now = () => Date.now(); const F = path.join(HOME, 'relogin.json');
  const C = () => ({ ...DEF, ...(((o.cfg() || {}).relogin) || {}) });
  let S = {}; try { S = JSON.parse(fs.readFileSync(F, 'utf8')) || {}; } catch (e) { S = {}; }
  const save = () => { try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  /* (11/11 정범님 '예스24 아이디·비번이 안 먹힘') 예전 판은 양식이 없는 로그인 화면에서 [로그인]을 실제로 누르지 못해 '연속 2번 실패 — 로그인 뒤에도 로그인 화면'으로 멈췄음
   *  → 고친 판이 처음 켜질 때 그 멈춤만 한 번 풂(사이트가 틀렸다고 한 '잠가 둔 값이 틀림'·보안 문자 멈춤은 그대로) · 다시 2번 실패하면 또 멈춤 */
  /* (11/12 login1) 예전 판이 「이미 로그인된」 화면·조종 크롬 네이버 길 실패로 건 '연속 2번 실패' 멈춤을 고친 판에서 한 번 풂(이어받기·평범한 창 네이버 길로 바뀜) */
  { const MK = F + '.fix1112'; if (!fs.existsSync(MK)) { for (const k of Object.keys(S)) { const st = S[k] && S[k].stop; if (st && !st.human && !st.bad && /로그인 뒤에도 로그인 화면|네이버로 로그인 뒤에도|이미 로그인된/.test(st.why || '')) { S[k].stop = null; S[k].fails = 0; S[k].tries = []; try { note(`🔐 ${k === 'y24' ? '예스24 판매관리' : k === 'al' ? '알라딘 샵매니저' : k} — 예전 판 멈춤(「이미 로그인된」·네이버 길)을 고친 판에서 한 번 풂`); } catch (e) {} } } save(); try { fs.writeFileSync(MK, String(Date.now())); } catch (e) {} } }
  { const MK = F + '.fix1111'; if (!fs.existsSync(MK)) { for (const k of Object.keys(S)) { const st = S[k] && S[k].stop; if (st && !st.human && !st.bad && /로그인 뒤에도 로그인 화면/.test(st.why || '')) { S[k].stop = null; S[k].fails = 0; S[k].tries = []; try { note(`🔐 ${k === 'y24' ? '예스24 판매관리' : k === 'al' ? '알라딘 샵매니저' : k} — 예전 판의 '[로그인]을 누르지 못한' 멈춤을 고친 판에서 한 번 풂(다시 2번 실패하면 또 멈춤)`); } catch (e) {} } } save(); try { fs.writeFileSync(MK, String(Date.now())); } catch (e) {} } }
  const P = (pf) => (S[pf] = S[pf] || { tries: [], fails: 0, stop: null, last: null, auto: true, n: 0 });
  const isLogger = () => { try { return !!o.isLogger(); } catch (e) { return true; } };
  const autoOn = (pf) => P(pf).auto !== false;
  /* 지금 해도 되나 → null(됨) | 까닭 */
  function why(pf, ctx) { const p = P(pf), c = C(), t = now(); p.tries = p.tries.filter((x) => t - x < 86400e3);
    if (isLogger()) return '로거 PC — 계정을 쓰지 않음(약속 0)'; if (!cred.has(pf) && !ctx.naver) return '저장된 계정 없음(⚙ › 🔐 스스로 다시 로그인에서 넣으면 됨)'; if (!autoOn(pf)) return '스스로 다시 로그인 꺼 둠';
    if (p.stop) return `멈춤 — ${p.stop.why} (⚙ › 🔐에서 [다시 해 보기])`; if (ctx.hold) return '🚚 출고 중 — 끝난 뒤 다시 로그인(약속 0-1)'; if (ctx.seat === false) return '🪑 번외 로그인 자리를 아직 못 받음 — 자리를 받으면 다시 로그인';
    if (ctx.pp) return '핑퐁 의심으로 멈춘 동안은 안 함'; const last = p.tries[p.tries.length - 1] || 0; if (t - last < c.gapMin * 60e3) return `앞 시도 뒤 ${c.gapMin}분 기다림`;
    if (p.tries.filter((x) => t - x < 3600e3).length >= c.perHour) return `한 시간 ${c.perHour}번까지 — 다음 시간에`; if (p.tries.length >= c.perDay) return `하루 ${c.perDay}번까지 — 내일`; return null; }
  /* 한 번 다시 로그인 — ctx = { name, loginUrl, nav(url,sec), ev(js,ms), type(text), check()→참/거짓, sleep(ms) } → { ok, why, human } */
  async function run(pf, ctx) { const p = P(pf), c = C(); p.tries.push(now()); p.n++; save(); const nm = ctx.name; let res = null;
    note(`🔐 ${nm} 세션이 풀려 ${cred.has(pf) ? '저장된 계정으로' : '「네이버로 로그인」으로(저장된 계정 없음 — 값을 넣지 않는 길만)'} 스스로 다시 로그인함(오늘 ${p.tries.length}번째 · 비밀번호는 기록하지 않음)`);
    try { res = await doLogin(ctx, () => cred.open(pf)); }
    catch (e) { res = { ok: false, why: String(e && e.message || e).slice(0, 120) }; }
    res = res || { ok: false, why: '모름' }; if (!res.ok && ctx.lastMsg) { const m = String(ctx.lastMsg() || '').slice(0, 120); if (m) res.why += ` · ${nm} 알림: '${m}'`; }
    p.last = { at: now(), ok: res.ok, why: res.ok ? null : res.why };
    const was = cred.chkOf ? cred.chkOf(pf) : 'ok';
    if (res.ok) { p.fails = 0; if (res.how !== 'naver' && was !== 'ok' && cred.mark) { cred.mark(pf, 'ok'); note(`🔐 ${nm} — 확인하지 못한 채 잠가 두었던 아이디·비밀번호가 맞음(이번 다시 로그인으로 확인됨)`, { l: 'ok' }); } note(`🔐 ${nm} 스스로 다시 로그인 됨${res.how === 'naver' ? '(네이버로 로그인 — 아이디·비밀번호 안 씀)' : ''} — 하던 일을 이어 감`, { l: 'ok' }); }
    else if (res.blocked) { p.fails++; p.stop = { at: now(), why: res.why, blocked: true };
      note(`⛔ ${nm} 스스로 다시 로그인 멈춤 — ${res.why} · 아이디 로그인을 거듭 두드리지 않음 · 할 일: 옆 창 [🔐 ${nm} 로그인]을 눌러 열린 창에서 「네이버로 로그인」(네이버 '로그인 상태 유지' 켬)으로 한 번 직접 → 다음부터 번외가 네이버 길로 스스로 다시 로그인`, { l: 'err' }); }
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
    if (!res.ok && !res.bad && !res.human && !res.blocked) res.unsure = true; /* 사이트가 틀렸다고 한 게 아님 — 확인을 끝내지 못함 */
    p.lastV = { at: now(), ok: !!res.ok, why: res.ok ? null : res.why, human: !!res.human, unsure: !!res.unsure, blocked: !!res.blocked }; if (res.ok) { p.stop = null; p.fails = 0; } save();
    note(res.ok ? `🔐 ${nm} 계정 확인 — 로그인 됨(맞음)` : res.blocked ? `⛔ ${nm} 계정 확인 못 함 — 저장하지 않음 · ${res.why}` : res.unsure ? `🔐 ${nm} 계정 확인 못 함 — 저장하지 않음 · ${res.why}` : `🔐 ${nm} 계정 확인 — 맞지 않아 저장하지 않음 · ${res.why}`, { l: res.ok ? 'ok' : 'warn' }); return res; }
  /* (11/10 밤) [확인하고 저장] 진행 — 화면이 '확인 중 — 무엇을(몇 초째)'·끝난 결과를 그대로 보이게(값 없음) · 도우미가 다시 켜지면 하던 확인은 '끊김'으로 */
  for (const k of Object.keys(S)) { const jb = S[k] && S[k].job; if (jb && jb.on) { jb.on = false; jb.end = now(); jb.res = { ok: false, kind: 'unsure', msg: '확인하는 동안 도우미가 다시 켜져 확인이 끊김 — 다시 [확인하고 저장]을 눌러 주세요(저장하지 않음)', canForce: true }; } }
  function jobStart(pf, maxSec) { const p = P(pf); const jb = { on: true, at0: now(), phase: '시작', atP: now(), max: maxSec || 0, abort: false, res: null }; p.job = jb; save();
    jb.ph = (t) => { if (jb.abort) throw new Error(`${jb.max}초 안에 끝나지 않아 확인을 멈춤(마지막 단계: ${jb.phase})`); jb.phase = String(t || '').slice(0, 80); jb.atP = now(); }; return jb; }
  function jobEnd(pf, r) { const p = P(pf); const jb = p.job; if (!jb) return; jb.on = false; jb.end = now(); jb.res = r ? { ok: !!r.ok, kind: String(r.kind || ''), msg: String(r.msg || '').slice(0, 800) /* (11/11) 자리 안내(쥔 기기·할 일)가 길어 400 → 800 */, canForce: !!r.canForce } : null; save(); }
  const jobOn = (pf) => { const jb = P(pf).job; return !!(jb && jb.on); };
  const anyJob = () => Object.keys(S).some((k) => jobOn(k));
  const jobView = (pf) => { const jb = P(pf).job; if (!jb) return null; return { on: !!jb.on, at0: jb.at0, phase: jb.phase, atP: jb.atP, max: jb.max, end: jb.end || null, res: jb.res || null }; };
  /* (11/12 login1) 세션이 다시 살아나면(사람이 평범한 창·옆 창으로 했든 번외가 했든) '연속 n번 실패' 멈춤을 조용히 풂 — 그래야 다음에 풀릴 때 번외가 스스로 다시 로그인함 · 값 틀림(bad)·보안 문자(human) 멈춤은 그대로 */
  const okSeen = (pf) => { const p = P(pf); if (p.stop && !p.stop.bad && !p.stop.human) { p.stop = null; p.fails = 0; save(); try { note(`🔐 ${(cred.PF[pf] || {}).name || pf} — 로그인이 다시 살아나 '스스로 다시 로그인' 멈춤을 풂(다음에 풀리면 번외가 스스로)`); } catch (e) {} } else if (p.fails) { p.fails = 0; save(); } };
  const reset = (pf) => { const p = P(pf); p.stop = null; p.fails = 0; save(); note(`🔐 ${(cred.PF[pf] || {}).name || pf} 스스로 다시 로그인 — 멈춤을 풀고 다시 해 봄`); return { ok: true }; };
  const setAuto = (pf, on) => { P(pf).auto = !!on; save(); return { ok: true }; };
  const sum = () => { const out = {}; const cs = cred.sum(); for (const k of Object.keys(cred.PF)) { const p = P(k); out[k] = { ...cs[k], auto: autoOn(k), stop: p.stop, last: p.last, job: jobView(k), today: p.tries.filter((x) => now() - x < 86400e3).length, n: p.n }; } return out; };
  const hasCred = (pf) => { try { return !!cred.has(pf); } catch (e) { return false; } };
  return { why, run, tryWith, reset, setAuto, sum, C, jobStart, jobEnd, jobOn, anyJob, hasCred, okSeen };
}
module.exports = { makeRelogin, doLogin, dlgOk, ACT_SRC, JS_ACT, DEF, JS_HUMAN, JS_FORM, JS_SUBMIT, JS_WHERE, isBlock, codeOf, blockWhy };
