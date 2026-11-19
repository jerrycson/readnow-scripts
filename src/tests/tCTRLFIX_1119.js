// tCTRLFIX_1119 — (11/19 일꾼 ctrlfix1 · 관제소 검토 1-7·1-10) 글 검사: 감시 등록 표시를 실제로 씀 · 멈춘 묶음 거절 · 모아 보기 정리 나눠 읽기 · 진단 읽기 길
// 실행: node src/tests/tCTRLFIX_1119.js (시험 자료 없음 — 코드 글만 봄)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } else console.log('  ✓', m); };
const T = fs.readFileSync(process.env.RN_APP || path.resolve(__dirname, '..', 'app.html'), 'utf8');
const fnIn = (name, pre) => { const i = T.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = T.indexOf('{', i); for (let j = k; j < T.length; j++) { if (T[j] === '{') d++; else if (T[j] === '}' && --d === 0) return T.slice(i, j + 1); } throw new Error('끝 못 찾음 ' + name); };
const BX = fnIn('batchExec0', 'async function ');
ok(!/ctrlOf[^;]{0,300}\.\.\.W\(\)/.test(BX) && !/\.\.\.W\(\) \}/.test(BX), '비교군 표시(ctrlOf) 쓰기에 정의 안 된 W()가 없음(있으면 ReferenceError로 표시가 안 써졌음)');
ok(/uploadedAt: firebase\.firestore\.FieldValue\.serverTimestamp\(\), writerSchema: 6/.test(BX), '비교군 표시 쓰기가 올린 시각·writerSchema를 직접 적음');
ok(/ctrlPauseOf\(fid\)/.test(BX) && /관제창에서 멈춰 있어 확정하지 않음/.test(BX), '관제창에서 멈춘 묶음의 그룹은 확정을 거절(화면 글로 알림)');
const SW = fnIn('ctrlSweep', 'async function ');
ok(!/limit\(3000\)/.test(SW) && /startAfter\(last\)/.test(SW) && /limit\(1000\)/.test(SW) && /pg < 30/.test(SW), '모아 보기 정리는 1,000개씩 나눠 읽음(3,000 한 번 읽기 아님)');
ok(/seen \+= qs\.size/.test(SW) && /seen \}/.test(SW), '읽은 개수를 쪽마다 더해 기록');
ok(!/alert\(|confirm\(|prompt\(/.test(BX + SW), '브라우저 팝업 없음');
const CL = fs.readFileSync(path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), 'utf8');
ok(/p0 === 'prd_price_batches\/_bkfold'/.test(CL), '진단 읽기 길이 묶음 문서(_bkfold)를 읽을 수 있음(읽기 전용)');
console.log(bad ? `❌ tCTRLFIX_1119 ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
