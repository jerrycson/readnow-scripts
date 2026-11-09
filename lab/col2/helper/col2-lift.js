/* col2-lift.js — (0.1.9) 운영 수집기 본체 안에만 있는 해석 함수를 '그대로 떼어' 씀 (고치지 않음 · 복사본을 저장소에 두지 않음)
 * 운영 src/readnow-collector.src.js 글자에서 이름이 정해진 함수만 찾아 꺼냄:
 *   function 이름(...) { ... }  → 괄호 짝을 세어 끝까지(글자·정규식 안 괄호도 짝이 맞는 함수만 — 꺼낸 뒤 new Function으로 문법을 확인)
 *   const 이름 = ...;           → 그 줄 끝까지(한 줄짜리 화살표 함수)
 * 결과 code는 번외 크롬 떨어진 칸에 넣어 globalThis.Col2Lift.<이름>으로 부름 · 판 표시 = 본체 @version 과 꺼낸 글자 지문 */
'use strict';
function grab(src, name) {
  const S = String(src || '');
  let i = S.search(new RegExp(`\\n\\s*function ${name}\\s*\\(`));
  if (i >= 0) { i = S.indexOf('function ' + name, i); const b = S.indexOf('{', S.indexOf(')', i)); if (b < 0) return null; let d = 0;
    for (let j = b; j < S.length; j++) { const c = S[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return S.slice(i, j + 1); } } return null; }
  const m = S.match(new RegExp(`\\n(\\s*)const ${name} = ([^\\n]*;)`)); return m ? `const ${name} = ${m[2]}` : null;
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
