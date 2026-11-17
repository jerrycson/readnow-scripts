/* tWORDING1_1117 — (11/17 wording1 · 정범님 I-1117-2027-23 「확인 중이라는 건 곧 알아내준다는 말이야? 결과를 보여주는 표시라면 당장 바꿔」)
 *  기다리라는 뉘앙스인데 실제로는 아무도 안 돌고 있는 글(결과 표시)을 확답형으로 바꿨는지 · 다시 생기지 않는지 지킴 (소스 글자만 봄 · 브라우저 안 씀)
 *  ① 앞 요청 결과를 모를 때(resultUnknown)의 글은 '모름'과 '눌러야'(누가 하면 바뀌는지)를 함께 말함
 *  ② 바꾼 옛 문구(결과를 먼저 확인합니다·확인 중 후보·확인 중 문서·준비 중 판매처·작성 중 설명서 따위)가 이력 영역 밖에 다시 나오지 않음
 *  ③ 판매처 plan 옛 저장값 '준비 중…'은 불러올 때 '연결 안 됨'으로 맞춤
 *  실행: node tWORDING1_1117.js [app.html 경로] */
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const file = process.argv[2] || process.env.RN_APP || path.join(__dirname, '..', 'app.html');
const T = fs.readFileSync(file, 'utf8');
/* 이력 영역(업데이트 기록)은 옛 글을 그대로 둠 */
const ca = T.indexOf('const CHANGELOG = {'), cb = ca >= 0 ? T.indexOf('\n};', ca) : -1;
ok(ca > 0 && cb > ca, 'CHANGELOG 자리를 찾음');
const body = T.slice(0, ca) + '\n' + T.slice(cb);
const lines = body.split('\n').filter(l => !/^\s*\{ d: '20\d\d-/.test(l)); /* 업데이트 기록 줄도 이력 */
// ①
const ru = [...body.matchAll(/k: 'resultUnknown', msg: '([^']*)'/g)].map(m => m[1]);
ok(ru.length >= 4, `resultUnknown 글이 ${ru.length}곳`, ru.length);
for (const m of ru) ok(/모름/.test(m) && /눌러야/.test(m), '결과 모름 글에 「모름」과 「눌러야」가 함께 있음', m);
// ②
const OLD = ['앞 도우미 요청의 결과를 먼저 확인합니다', '앞 요청의 처리 결과를 먼저 확인해야 함', '다시 보내지 않고 확인 중', '앞 기기의 도우미 요청 결과부터 확인합니다',
  '확인 중 후보', '확인 중 문서도', '확인 중으로', '확인 중(확정 전)', '확정/확인 중', '주문 기록 확인 중', '검토 중 — 자동 판매중지 안 함',
  "plan: '준비 중", "'주문 읽기 준비 중'", '네이버(준비 중)', '준비 중 — 동화 엔진 방', '(준비 중 — 기록 화면 자리)', "ver: '작성 중'", '손으로 쓴 설명서는 <b>작성 중</b>', '삭제 요청 보냄 — 확인 중'];
for (const o of OLD) { const hit = lines.filter(l => l.includes(o)); ok(!hit.length, `옛 문구가 다시 없음: ${o}`, hit.map(h => h.slice(0, 120))); }
// 확정 전 문서 상태는 「확정 전」으로
ok(/확정 전<\/small>/.test(T) && /확정 전<\/b>/.test(T), 'KMS 문서 확정 전 상태 이름이 「확정 전」');
// ③
ok(/String\(v\.plan \|\| '연결 안 됨'\)\.replace\(\/\^준비 중\/, '연결 안 됨'\)/.test(T), '옛 저장값 「준비 중」은 「연결 안 됨」으로 맞춤');
console.log(bad ? `❌ ${bad}건 실패` : '✅ 전부 통과'); process.exit(bad ? 1 : 0);
