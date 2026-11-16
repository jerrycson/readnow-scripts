/* t_y24ops.js — (11/14 y24ops1) 🟦 예스24 운영: 문의 줄 읽기(손님 칸 뺌·전화 가림) · 정산 예정 숫자(실제 원문 칸) · 판매가 수 읽기 — 순수 셈만(크롬 없음) */
'use strict';
const Y = require('../helper/col2-y24.js'); const W = require('../helper/col2-y24w.js');
let n = 0, bad = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x ? ' — ' + String(x).slice(0, 300) : '')); } };
const q = Y.qaRows({ QA_LIST: [{ QA_NO: '11', GOODS_NO: '195000001', GOODS_NM: '시험 책', QA_TTL: '상태 문의', QA_CONT: '<p>010-1234-5678 로 연락 주세요 a.b@c.com</p>', REG_DTS: '20261114', MEM_ID: 'abc***', ORD_NM: '손님A', ANS_YN: 'N' }], NO_ANSWER_COUNT: 1, TOTAL_COUNT: 1, COMPLETE_DATE_AVG: 0 });
ok(q && q.n === 1 && q.noAns === 1 && q.rows[0].gno === '195000001' && q.rows[0].ttl === '상태 문의' && q.rows[0].ay === 0 && q.rows[0].ans == null && q.rows[0].no === '11' && q.rows[0].dt === '2026-11-14', '문의 줄 — 번호·상품·제목·답 여부를 칸 이름 꼴로 고름(옛 꼴 · 답 여부 N은 답 글로 안 봄)', JSON.stringify(q));
ok(!/1234|a\.b@c|abc|손님A/.test(JSON.stringify(q.rows)) && /#전화/.test(q.rows[0].q) && /#메일/.test(q.rows[0].q) && !/<p>/.test(q.rows[0].q), '문의 줄 — 손님 칸(아이디·이름)은 안 담고 글 속 전화·메일은 가림 · 태그 뺌', JSON.stringify(q.rows));
ok(q.ks.includes('MEM_ID') && q.ks.includes('QA_CONT'), '받은 칸 이름 목록(ks)을 남김 — 다음 판이 실제 칸 이름으로 고침');
ok(Y.qaRows({ QA_LIST: [], NO_ANSWER_COUNT: 0, TOTAL_COUNT: 0 }).n === 0 && Y.qaRows({}) === null, '빈 목록 · QA_LIST 없음');
// (11/16 y24qa1) 실제 예스24 QA_LIST 칸 이름(11/13 원문으로 확인한 모양 · 값은 지어낸 것)
const R = Y.qaRows({ QA_LIST: [{ ENTR_NO: 0, INQRY_NO: 900001, MEM_NO: '7', MEM_ID: 'zz***', MEM_NM: '＊', MEM_EMAIL: 'q@w.com', GOODS_NO: 0, TTL: '시험 제목', INQRY_TTL: null, INQRY_CONT: null, REG_DTS: '20261101', INQRY_REG_DTS: null, ANSWR_TTL: null, ANSWR_CONT: null, ANSWR_REG_DTS: null, RPT_YN: 'N', GOODS_NM: '시험 상품', SALE_PR: 12000, ANSWR_YN: 'N', ANSWR: 1, USER_ID: 'u1', ENTR_EML: 's@x.com', INQRY_GB: '01', ORD_NO: 0, Email_Receive_YN: false, SMS_Receive_YN: false, Inquiry_Mobile_Number: '010-2222-3333' },
  { INQRY_NO: 900002, TTL: '배송 문의', INQRY_CONT: '<b>언제 와요</b> 010-4444-5555', REG_DTS: '20261102', ANSWR_YN: 'Y', ANSWR_CONT: '내일 보냅니다', ANSWR_REG_DTS: '20261103', GOODS_NO: 555, GOODS_NM: '책', INQRY_GB: '02', ORD_NO: 12345678, RPT_YN: 'Y' }], NO_ANSWER_COUNT: 1, TOTAL_COUNT: 2, COMPLETE_DATE_AVG: 1 });
const r0 = R.rows[0], r1 = R.rows[1];
ok(r0.no === '900001' && r0.ttl === '시험 제목' && r0.gnm === '시험 상품' && r0.pr === '12000' && r0.dt === '2026-11-01' && r0.ay === 0 && r0.gb === '01' && r0.q == null && r0.ans == null && r0.gno == null && !r0.ord, '실제 칸 — 문의 번호·제목·상품·값·날·미답변 · 본문 비면 없음(문의 번호를 본문으로 집지 않음) · 상품 번호 0은 뺌', JSON.stringify(r0));
ok(r1.ay === 1 && r1.ans === '내일 보냅니다' && r1.ansDt === '2026-11-03' && r1.rpt === 1 && r1.ord === 1 && r1.gno === '555' && /언제 와요 #전화/.test(r1.q) && !/12345678/.test(JSON.stringify(r1)), '실제 칸 — 답 글·답한 날·신고·주문 문의(주문 번호 값은 안 담음) · 본문 전화 가림', JSON.stringify(r1));
ok(!/zz\*\*\*|q@w|s@x|2222|u1"/.test(JSON.stringify(R.rows)), '실제 칸 — 손님 칸(MEM_*·USER_ID·ENTR_EML·Inquiry_Mobile_Number)은 안 담음', JSON.stringify(R.rows));
const c = Y.calcPlan({ RESULT_LIST: [{ ORD_NO: '1', ORD_NM: '손님A', MEM_ID: 'x***', AMOUNT: '55000', ORD_JOB_PROC_NM: '구매확정전', WH_OUT_END_DTS: '20261104' }, { AMOUNT: '12,000', ORD_JOB_PROC_NM: '구매확정', WH_OUT_END_DTS: '20261102' }], TOTAL_COUNT: '2' });
ok(c && c.n === 2 && c.amt === 67000 && c.by['구매확정전'] === 1 && c.by['구매확정'] === 1 && c.first === '20261102' && !/손님A|x\*\*\*/.test(JSON.stringify(c)), '정산 예정 — 실제 원문 칸(AMOUNT·ORD_JOB_PROC_NM·WH_OUT_END_DTS) 숫자만 · 손님 칸 없음', JSON.stringify(c));
ok(W.pNum('60,000') === 60000 && W.pNum(' 7000원') === 7000 && W.pNum(null) === null, '판매가 수 읽기');
console.log(bad ? `✗ t_y24ops ${bad}/${n} 실패` : `✓ t_y24ops 모두 통과 (${n}개)`); process.exit(bad ? 1 : 0);
