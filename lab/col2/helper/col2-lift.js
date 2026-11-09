/* col2-lift.js — (0.1.9) 운영 수집기 본체 안에만 있는 해석 함수를 '그대로 떼어' 씀 (고치지 않음 · 복사본을 저장소에 두지 않음)
 * 운영 src/readnow-collector.src.js 글자에서 이름이 정해진 함수만 찾아 꺼냄:
 *   function 이름(...) { ... } · async function 이름(...) { ... } → 괄호 짝을 세어 끝까지(글자·정규식 안 괄호도 짝이 맞는 함수만 — 꺼낸 뒤 new Function으로 문법을 확인)
 *   const 이름 = ...;           → 그 줄 끝까지(한 줄짜리) · 줄 끝에서 괄호 짝이 안 맞으면 짝이 맞고 ';'가 나올 때까지 여러 줄(0.1.10 — 그려 읽기 extRenderHelper 같은 여러 줄 화살표 함수)
 * 결과 code는 번외 크롬 떨어진 칸에 넣어 globalThis.Col2Lift.<이름>으로 부름 · 판 표시 = 본체 @version 과 꺼낸 글자 지문
 * 꺼낸 함수가 부르는 운영 본체의 바깥 이름(GM_xmlhttpRequest·C·log …)은 떨어진 칸의 전역 '받침'(col2-shim.js)이 대신함 — 본체 글자는 그대로 */
'use strict';
const depth = (s) => { let d = 0; for (const c of s) { if (c === '(' || c === '{' || c === '[') d++; else if (c === ')' || c === '}' || c === ']') d--; } return d; };
function grab(src, name) {
  const S = String(src || '');
  let i = S.search(new RegExp(`\\n\\s*(async\\s+)?function ${name}\\s*\\(`));
  if (i >= 0) { const st = S.indexOf(S.slice(i).match(/(async\s+)?function /)[0], i); i = S.indexOf('function ' + name, i); const b = S.indexOf('{', S.indexOf(')', i)); if (b < 0) return null; let d = 0;
    for (let j = b; j < S.length; j++) { const c = S[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return S.slice(st, j + 1); } } return null; }
  const m = S.match(new RegExp(`\\n(\\s*)const ${name} = ([^\\n]*;)`)); if (m && depth(m[2]) === 0) return `const ${name} = ${m[2]}`;
  /* 여러 줄 — 시작 줄부터 줄마다 더해 괄호 짝이 0이고 줄 끝이 ';'(뒤의 풀이 글은 괜찮음)인 첫 자리까지(200줄 넘으면 버림) */
  const k = S.search(new RegExp(`\\n\\s*const ${name} = `)); if (k < 0) return null; const L = S.slice(k + 1).split('\n'); const acc = [];
  for (let j = 0; j < Math.min(L.length, 200); j++) { acc.push(L[j]); const t = acc.join('\n'); const d = depth(t); if (d < 0) return null; if (d === 0 && /;\s*(\/\*.*\*\/\s*)?$/.test(L[j])) return t.trim(); }
  return null;
}
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };
function lift(src, names) {
  const got = [], miss = [], parts = [];
  for (const n of names || []) { const c = grab(src, n); if (c) { got.push(n); parts.push(c); } else miss.push(n); }
  const body = parts.join('\n');
  const code = `(function(){ 'use strict'; ${body}\n globalThis.Col2Lift = { ${got.join(', ')} }; })();`;
  let err = null; try { new Function(code); } catch (e) { err = '꺼낸 글자의 문법 오류: ' + e.message; }
  const ver = (String(src).match(/@version\s+([\d.]+)/) || String(src).match(/const VER = '([\d.]+)'/) || [])[1] || '?';
  return { code: err ? '' : code, got, miss, err, ver, sig: hash(body) };
}
module.exports = { lift, grab };
