/* ✂ 손님 화면 결과물에서 설명 글(주석)만 빼기 (11/13 shopux1 · 정범님 11/13 20:12 「첫 화면 무게를 지금보다 나쁘게 하지 않게」)
 *  · 원본(shop/*.js·*.css)은 그대로 — 올리는 사본(.hosting/shop)만 가볍게 · 바깥 도구 없음(Actions에서 설치할 것 0)
 *  · JS: 글자 묶음('…' "…" `…${}…`)·정규식(/…/)·주석을 한 글자씩 읽어 구분 — 주석 자리는 줄바꿈만 남김(줄 번호 그대로 · 자동 세미콜론 그대로) · 빼고 나서 문법 검사(vm.Script) 실패면 원본 그대로
 *  · CSS: /* … *\/ 만 뺌(글자 묶음 '…' "…" 안은 그대로)
 *  쓰임: const { js, css } = require('./strip-comments.js') */
'use strict';
const KW = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
function js(src) {
  let out = ''; let i = 0; const n = src.length; let last = ''; /* 앞의 의미 있는 낱말·기호(정규식인지 나눗셈인지 가름) */ const stack = []; /* 템플릿 ${ } 안 괄호 깊이 */
  const keep = (a, b) => { out += src.slice(a, b); };
  const regexOk = () => { if (!last) return true; if (/[A-Za-z0-9_$]$/.test(last)) return KW.has(last); return !/[)\]}]$/.test(last) || last === '}' && false; };
  while (i < n) { const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; out += src.slice(i, end).replace(/[^\n]/g, '').length ? src.slice(i, end).replace(/[^\n]/g, '') : ' '; i = end; continue; }
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (c === '"' || c === "'") { const a = i; i++; while (i < n && src[i] !== c) { if (src[i] === '\\') i++; else if (src[i] === '\n') break; i++; } i++; keep(a, i); last = c; continue; }
    if (c === '`') { const a = i; i++; while (i < n && src[i] !== '`') { if (src[i] === '\\') { i += 2; continue; } if (src[i] === '$' && src[i + 1] === '{') { i += 2; stack.push(0); break; } i++; } if (src[i] === '`') i++; keep(a, i); last = '`'; continue; }
    if (c === '}' && stack.length && stack[stack.length - 1] === 0) { /* 템플릿 ${ … } 끝 → 템플릿 글자로 돌아감 */ stack.pop(); const a = i; i++; while (i < n && src[i] !== '`') { if (src[i] === '\\') { i += 2; continue; } if (src[i] === '$' && src[i + 1] === '{') { i += 2; stack.push(0); break; } i++; } if (src[i] === '`') i++; keep(a, i); last = '`'; continue; }
    if (c === '{' && stack.length) stack[stack.length - 1]++; if (c === '}' && stack.length && stack[stack.length - 1] > 0) stack[stack.length - 1]--;
    if (c === '/' && regexOk()) { const a = i; i++; let cls = false; while (i < n) { const x = src[i]; if (x === '\\') { i += 2; continue; } if (x === '[') cls = true; else if (x === ']') cls = false; else if (x === '/' && !cls) break; else if (x === '\n') break; i++; } i++; while (i < n && /[a-z]/i.test(src[i])) i++; keep(a, i); last = 'x'; continue; }
    if (/\s/.test(c)) { out += c; i++; continue; }
    if (/[A-Za-z0-9_$]/.test(c)) { const a = i; while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++; last = src.slice(a, i); keep(a, i); continue; }
    out += c; last = c; i++; }
  /* 빈 줄 겹침 줄이기(줄 수는 그대로 두지 않아도 됨 — 오류 줄은 원본 판과 같은 파일 이름으로 찾음) · 줄 끝 빈칸 */
  return out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n'); }
function css(src) { let out = ''; let i = 0; const n = src.length;
  while (i < n) { const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'") { const a = i; i++; while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; } i++; out += src.slice(a, i); continue; }
    out += c; i++; }
  return out.replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n'); }
/* 안전하게: 빼고 나서 문법이 맞을 때만 — 아니면 원본 */
function safeJs(src) { try { const t = js(src); new (require('vm').Script)(t); return t; } catch (e) { return src; } }
module.exports = { js, css, safeJs };
