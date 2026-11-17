// tJUSOSET1117 — (정범님 11/16 16:07 「도로명주소는 노트와 무관 · 설정 외부정보 섹션 아니냐 어디 있어」)
//  📮 도로명주소 찾기 자리 = ⚙ 설정 › ⑱ 🌐 외부 정보 칸 안(맨 아래) · 따로 선 칸(set_juso · 🚚 출고·가게 묶음) 없음 · 노트와 무관
//  기능·저장 자리(app_secrets/juso)·🔎 주소 찾기는 그대로 · 팝업 없음
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const A = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const ok = (m) => console.log('✓', m);
const fnOf = (name) => { const i = A.indexOf('function ' + name + '('); assert(i >= 0, '함수 없음: ' + name); let j = A.indexOf('{', i), d = 0; for (let k = j; k < A.length; k++) { const c = A[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return A.slice(i, k + 1); } } throw new Error('끝 못 찾음: ' + name); };

assert(!A.includes("${sec('set_juso'"), '따로 선 칸 set_juso가 남아 있음'); ok('따로 선 칸(set_juso) 없음');
assert(!/UX2_SGSEC\.set_juso\s*=/.test(A), '옛 묶음 배정 UX2_SGSEC.set_juso가 남아 있음'); ok('🚚 출고·가게 묶음 배정 없음');
assert(A.includes("${sec('set_ext', '"), '⑱ 외부 정보 칸이 없음'); ok('⑱ 🌐 외부 정보 칸 그대로');
assert(/UX2_SGSEC\s*=\s*\{[^}]*set_ext:\s*'col'/.test(A) || /set_ext['"]?\s*:\s*'col'/.test(A), '⑱이 🛰 묶음이 아님'); ok('⑱은 🛰 수집·자동·관리 묶음');

const ext = fnOf('extSetHtml'); assert(/extSetCore\(\)\s*\+\s*jusoExtHtml\(\)/.test(ext), '⑱ 몸통에 도로명주소가 없음'); ok('⑱ 몸통 = 외부 정보 + 📮 도로명주소');
const je = fnOf('jusoExtHtml'); assert(/id="juso_ext"/.test(je) && /jusoSetHtml\(\)/.test(je) && /도로명주소 찾기/.test(je), '도로명주소 묶음 모양'); ok('📮 도로명주소 찾기 = #juso_ext 안에 승인키 칸');
assert(!/note|노트/i.test(je), '도로명주소 칸에 노트 이야기'); ok('노트와 무관');
const red = fnOf('extRedraw'); assert(/extSetCore\(\)/.test(red) && !/extSetHtml\(\)/.test(red), '외부 정보 다시 그리기가 도로명주소까지 덮음'); ok('외부 정보 다시 그리기는 #ext_set만 바꿈(적던 승인키 안 지움)');
const core = fnOf('extSetCore'); assert(/id="ext_set"/.test(core), '#ext_set 없음'); ok('#ext_set 그대로');

const fi = A.indexOf("w: '⚙ 설정 › ⑱ 🌐 외부 정보 › 📮 도로명주소 찾기'"); assert(fi > 0, '🔍 기능 찾기 길 안내'); const fl = A.slice(A.lastIndexOf('\n', fi), A.indexOf('\n', fi)); assert(/tab: 'settings'/.test(fl) && /jusoGoSet\(\)/.test(fl), '기능 찾기 가는 길'); ok('🔍 기능 찾기 = ⚙ 설정 › ⑱ 🌐 외부 정보 › 📮 도로명주소 찾기');
const go = fnOf('jusoGoSet'); assert(/set_ext/.test(go) && /#juso_ext/.test(go) && !/set_juso/.test(go.replace(/data-sub="set_juso"/g, '')), '가는 곳'); ok('가는 곳 = ⑱ 열고 #juso_ext');
const nk = fnOf('jusoNoKeyHtml'); assert(/⑱ 🌐 외부 정보 › 📮 도로명주소 찾기/.test(nk), '승인키 없을 때 안내 길'); ok('승인키 없을 때 안내 = 새 자리');

assert(/collection\('app_secrets'\)\.doc\('juso'\)/.test(A), '저장 자리 app_secrets/juso'); ok('저장 자리 그대로(app_secrets/juso)');
for (const f of [je, go, red, ext]) assert(!/\b(alert|confirm|prompt)\s*\(/.test(f), '팝업'); ok('팝업 없음');
console.log('✅ tJUSOSET1117 통과');
