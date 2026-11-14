/* t_y24ops.js — (11/14 y24ops1) 🟦 예스24 운영: 문의 줄 읽기(손님 칸 뺌·전화 가림) · 정산 예정 숫자(실제 원문 칸) · 판매가 수 읽기 — 순수 셈만(크롬 없음) */
'use strict';
const Y = require('../helper/col2-y24.js'); const W = require('../helper/col2-y24w.js');
let n = 0, bad = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x ? ' — ' + String(x).slice(0, 300) : '')); } };
const q = Y.qaRows({ QA_LIST: [{ QA_NO: '11', GOODS_NO: '195000001', GOODS_NM: '시험 책', QA_TTL: '상태 문의', QA_CONT: '<p>010-1234-5678 로 연락 주세요 a.b@c.com</p>', REG_DTS: '20261114', MEM_ID: 'abc***', ORD_NM: '손님A', ANS_YN: 'N' }], NO_ANSWER_COUNT: 1, TOTAL_COUNT: 1, COMPLETE_DATE_AVG: 0 });
ok(q && q.n === 1 && q.noAns === 1 && q.rows[0].gno === '195000001' && q.rows[0].ttl === '상태 문의' && q.rows[0].ans === 'N', '문의 줄 — 번호·상품·제목·답 상태를 칸 이름 꼴로 고름', JSON.stringify(q));
ok(!/1234|a\.b@c|abc|손님A/.test(JSON.stringify(q.rows)) && /#전화/.test(q.rows[0].q) && /#메일/.test(q.rows[0].q) && !/<p>/.test(q.rows[0].q), '문의 줄 — 손님 칸(아이디·이름)은 안 담고 글 속 전화·메일은 가림 · 태그 뺌', JSON.stringify(q.rows));
ok(q.ks.includes('MEM_ID') && q.ks.includes('QA_CONT'), '받은 칸 이름 목록(ks)을 남김 — 다음 판이 실제 칸 이름으로 고침');
ok(Y.qaRows({ QA_LIST: [], NO_ANSWER_COUNT: 0, TOTAL_COUNT: 0 }).n === 0 && Y.qaRows({}) === null, '빈 목록 · QA_LIST 없음');
const c = Y.calcPlan({ RESULT_LIST: [{ ORD_NO: '1', ORD_NM: '손님A', MEM_ID: 'x***', AMOUNT: '55000', ORD_JOB_PROC_NM: '구매확정전', WH_OUT_END_DTS: '20261104' }, { AMOUNT: '12,000', ORD_JOB_PROC_NM: '구매확정', WH_OUT_END_DTS: '20261102' }], TOTAL_COUNT: '2' });
ok(c && c.n === 2 && c.amt === 67000 && c.by['구매확정전'] === 1 && c.by['구매확정'] === 1 && c.first === '20261102' && !/손님A|x\*\*\*/.test(JSON.stringify(c)), '정산 예정 — 실제 원문 칸(AMOUNT·ORD_JOB_PROC_NM·WH_OUT_END_DTS) 숫자만 · 손님 칸 없음', JSON.stringify(c));
ok(W.pNum('60,000') === 60000 && W.pNum(' 7000원') === 7000 && W.pNum(null) === null, '판매가 수 읽기');
console.log(bad ? `✗ t_y24ops ${bad}/${n} 실패` : `✓ t_y24ops 모두 통과 (${n}개)`); process.exit(bad ? 1 : 0);
