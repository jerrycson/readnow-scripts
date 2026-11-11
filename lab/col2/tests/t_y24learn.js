/* t_y24learn — (11/11 y24ops3) 🎓 예스24 배우기 모드 · 판매중 수 셈
 *  ① 꼴 셈: 글·숫자 값은 가림(#s길이·#n) · 코드 칸(…_GB·…_CD·…_YN 1~4자)만 그대로 · 전화 꼴·숫자 가림 · 읽기 길(List·Init·Get·Search…)은 남기지 않음 · 로그인 길은 주소만
 *  ② 배우기: 꺼져 있으면 아무것도 안 남김 · 번외 자기 요청 안 남김 · 쓰기 요청 + 응답 → 한 줄(RESULT_CODE 그대로·MESSAGE 가림) · 같은 꼴은 n만 늘림 · 확인 물음은 사람이 답함(참) · 파일에 값 없음
 *  ③ 판매중·품절 수(GetMainGoods) · 첫 화면 숫자 그대로
 * 시험 자료는 꾸민 값(손님 정보 없음) · 실행: node tests/t_y24learn.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const LR = require('../helper/col2-y24learn.js'); const Y = require('../helper/col2-y24.js');
(async () => {
  // ①
  const b = LR.bodyShape(JSON.stringify({ ORD_NO: '2026111100001', RETURN_RSN_CD: '02', APPR_YN: 'Y', CLAIM_MEMO: '포장이 찢어져 왔어요 010-0000-0000', QTY: 1, LIST: [{ GOODS_NO: 300000001, PROC_GB: '10' }] }));
  ok(b.json && b.b.ORD_NO === '#d13' && b.b.RETURN_RSN_CD === '02' && b.b.APPR_YN === 'Y' && /^#s\d+$/.test(b.b.CLAIM_MEMO) && b.b.QTY === '#n', '① 글·번호 값은 가리고 코드 칸만 그대로');
  ok(b.b.LIST[0].GOODS_NO === '#n' && b.b.LIST[0].PROC_GB === '10' && b.b.LIST[1] === '#len1', '① 배열은 첫 줄 꼴 + 길이');
  const all = JSON.stringify(b); ok(!/찢어|010-0000|2026111100001|300000001/.test(all), '① 글·전화·주문번호·상품번호 값이 남지 않음');
  const f = LR.bodyShape('answerCont=%EB%8B%B5%EB%B3%80&qaNo=123&ANS_YN=N'); ok(!f.json && f.b.answerCont === '#s2' && f.b.qaNo === '#d3' && f.b.ANS_YN === 'N', '① 폼 꼴도 같은 규칙');
  ok(LR.isWrite('/api/Claim/ReturnApproval') && !LR.isWrite('/api/Claim/ReturnManagementS1') && !LR.isWrite('/api/Claim/ReturnManagementS1Init') && !LR.isWrite('/api/CustomerService/QAList') && !LR.isWrite('/api/Common/GetMain') && !LR.isWrite('/api/Claim/SearchReturnTotal'), '① 읽기 길은 쓰기로 안 봄');
  ok(LR.maskMsg('주문 2026111100001 반품승인 하시겠습니까? 010-0000-0000') === '주문 ############# 반품승인 하시겠습니까? #전화', '① 확인 물음 글 숫자·전화 가림');
  const sec = LR.recOf({ m: 'POST', u: '/api/Login/Login?x=1', post: 'pw=abc' }, '/Login/Login'); ok(sec.secret && sec.body === null && sec.q === null, '① 로그인 길은 주소만');
  // ②
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'c2lrn-')); const notes = []; let t = 1000;
  const N = LR.makeLearn({ HOME, note: (m) => notes.push(m), now: () => t });
  N.req('a', { m: 'POST', u: '/api/Claim/ReturnApproval', post: '{"ORD_NO":"1"}' }); N.resp('a', 200, '{}'); ok(N.state().n === 0, '② 꺼져 있으면 아무것도 안 남김');
  N.L.on = true; N.L.page = '/Claim/ReturnManagementS1';
  N.req('b', { m: 'POST', u: '/api/Claim/ReturnApproval', post: '{"ORD_NO":"1"}', mine: true }); N.resp('b', 200, '{}'); ok(N.state().n === 0, '② 번외 자기 요청은 안 남김');
  N.req('c', { m: 'POST', u: '/api/Claim/ReturnManagementS1', post: '{"S_DATE":"20261101"}' }); N.resp('c', 200, '{}'); ok(N.state().n === 0 && N.state().reads === 1, '② 목록 읽기는 수만');
  N.req('d', { m: 'POST', u: '/api/Claim/ReturnApproval?seq=77', post: JSON.stringify({ ORD_NO: '2026111100001', RETURN_RSN_CD: '02', MEMO: '손님A 메모' }), page: '/Claim/ReturnManagementS1' });
  N.resp('d', 200, JSON.stringify({ RESULT_CODE: 'S000', MESSAGE: '손님A님 반품 승인 완료', CNT: 1 }));
  let S = N.state(); ok(S.n === 1 && S.recs[0].sig === 'POST /api/Claim/ReturnApproval' && S.recs[0].st === 200 && S.recs[0].resp.RESULT_CODE === 'S000' && /^#s/.test(S.recs[0].resp.MESSAGE) && S.recs[0].q.seq === '#d2', '② 쓰기 요청 + 응답 → 한 줄(RESULT_CODE 그대로 · 글 가림)');
  t = 2000; N.req('e', { m: 'POST', u: '/api/Claim/ReturnApproval', post: JSON.stringify({ ORD_NO: '2026111100002', RETURN_RSN_CD: '03', MEMO: 'x' }) }); N.resp('e', 200, '{"RESULT_CODE":"S000"}');
  S = N.state(); ok(S.n === 1 && S.recs[0].n === 2 && S.recs[0].lastAt === 2000, '② 같은 꼴은 n만 늘림');
  ok(N.dialog({ type: 'confirm', message: '반품 승인하시겠습니까?' }) === true && N.state().recs[0].m === 'DIALOG', '② 확인 물음은 사람이 답함(번외는 답하지 않고 글 꼴만)');
  const file = fs.readFileSync(path.join(HOME, 'y24-learn.json'), 'utf8'); ok(!/손님A|2026111100001|메모/.test(file), '② 이 PC 파일에도 값·손님 정보 없음');
  N.L.on = false; ok(N.dialog({ type: 'confirm', message: 'x' }) === false, '② 끄면 확인 물음은 평소대로(번외 규칙)');
  const N2 = LR.makeLearn({ HOME, note: () => {}, now: () => 1 }); ok(N2.state().n === 2 && N2.L.on === false, '② 다시 켜져도 받은 모양은 남고 배우기는 꺼진 채');
  // ③
  const g = Y.goodsSum({ SELLING_ITEM: 312, COMPLETE_ITEM: 40, END_ITEM: 5, ENDING_10DAYS_BEFORE: 2, RESULT_CODE: 'S000' }); ok(g && g.sell === 312 && g.soldOut === 40 && g.end === 5 && g.end10 === 2, '③ 판매중·품절·판매종료 수');
  ok(Y.goodsSum({ RESULT_CODE: 'S000' }) === null && Y.mainSum({ ORDER_COUNT: 2, NOREPLY: 1, DEPOSIT: 12300, SENDING_ADDRESS: '어딘가' }).ord === 2, '③ 숫자 없으면 null · 첫 화면 숫자(주소 칸 버림)');
  try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {}
  L.done('t_y24learn');
})().catch((e) => { console.error(e); process.exit(1); });
