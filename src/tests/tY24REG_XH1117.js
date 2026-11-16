// tY24REG_XH1117 — (y24reg3 11/17 · HOME 11/16 21:40Z 블루레이 묶음 「엑셀을 넣었지만 미리보기 표 0줄」 · 11/14 ISBN 책도 같은 자리) 🟦 예스24 대량 등록 엑셀 머리글
//   원인: 예스24 화면은 엑셀 27행 머리글을 열쇠로 줄을 읽음(화면 코드 isExcelDataEmpty: "01"(바코드)이면 e["바코드"]가 비면 그 줄을 버림 · setProductInfo: t["바코드"]·t["재고수량"]·t["품질등급"]·t["판매가"]·t["판매자 자체코드"]…)
//         우리 엑셀 머리글은 '바코드/상품번호'·'재고'·'등급'·'자체코드'였음 → 모든 줄이 빈 줄로 버려져 서버 확인 0줄 · 표 0줄
//   ① 웹앱 자동 올림 엑셀(y24RegAoa · 클라우드도 같은 덩어리) → SheetJS 0.18.5로 쓰고 읽어(화면과 같은 read binary · sheet_to_json range 26) 화면 셈을 그대로 돌림 → 우리 줄이 살아남고 값이 맞음
//   ② 손 길 엑셀(y24XlsxAoa · 바코드용·상품번호용)도 같음 · ③ 옛 머리글이면 버려짐(원인 재현) · ④ 클라우드가 같은 덩어리를 씀
// 실행: node src/tests/tY24REG_XH1117.js · 지어낸 자료(손님 정보 없음) · 실제 예스24·Firebase에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const T0 = rd('src/app.html'); const cut = (a, b) => { const i = T0.indexOf(a); const j = T0.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T0.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { y24RegAoa };')();
const M = new Function(cut('const Y24_XH =', 'const y24TestOf') + '\nreturn { Y24_XH, y24XlsxAoa };')();
const X = require('./xlsx.full.min.js');
/* 예스24 화면 셈(원문 product_BulkRegistrationByExcel · mixin getExcelDataToJson 그대로 옮김) */
const isEmpty = (v) => v === undefined || v === null || v === '';
const isExcelDataEmpty = (t, e) => ('01' == t ? isEmpty(e['바코드']) : isEmpty(e['상품번호']));
const setProductInfo = (t) => ({ BARCODE: t['바코드'], GOODS_NO: t['상품번호'], REM_CNT: t['재고수량'], GOODS_LEVEL_GB: t['품질등급'], USED_SALE_PR: t['판매가'], GOODS_NM: t['상품명'], POINT_RT: t['적립율'], MAN_NO: t['판매자 자체코드'], GOODS_FEA2: t['홍보문구'], CONT: t['상품설명'], GOODS_STAT_GB: t['판매상태'], SALE_TYPE_GB: t['판매형태'] });
const pageRead = (aoa, type) => { const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa), 'Sheet1'); const b64 = X.write(wb, { type: 'base64', bookType: 'xlsx' });
  const bin = Buffer.from(b64, 'base64').toString('binary'); const D = X.read(bin, { type: 'binary' }); const rows = X.utils.sheet_to_json(D.Sheets[D.SheetNames[0]], { range: 27 - 1 });
  return { n: rows.length, list: rows.filter((r) => !isExcelDataEmpty(type, r)).map(setProductInfo) }; };
const BC = '8809866320756';
console.log('① 웹앱 자동 올림 엑셀(y24RegAoa) — 화면 셈 그대로');
{ const rows = [{ lid: 'aladin_U1', isbn: BC, bc: BC, grade: '최상', qty: 1, price: 298000, self: 'KHKd0000EX', title: '시험 블루레이' }, { lid: 'aladin_U2', isbn: '9788900000011', grade: '상', qty: 1, price: 9000, self: 'A01SKU2', title: '시험 책' }];
  const r = pageRead(F.y24RegAoa(rows), '01');
  ok(r.n === 2 && r.list.length === 2, '두 줄 모두 살아남음(바코드 칸이 안 빔)', r);
  const a = r.list[0], b = r.list[1];
  ok(String(a.BARCODE) === BC && String(b.BARCODE) === '9788900000011', '바코드 = 블루레이 바코드 · 책 ISBN', [a.BARCODE, b.BARCODE]);
  ok(a.MAN_NO === 'KHKd0000EX' && b.MAN_NO === 'A01SKU2' && +a.REM_CNT === 1 && a.GOODS_LEVEL_GB === '최상' && b.GOODS_LEVEL_GB === '상' && +a.USED_SALE_PR === 298000 && a.GOODS_NM === '시험 블루레이' && a.SALE_TYPE_GB === '1' && a.GOODS_STAT_GB === '1' && +a.POINT_RT === 0, '자체코드·재고수량·품질등급·판매가·상품명·판매형태·판매상태·적립율 칸이 화면 열쇠로 읽힘', a); }
console.log('② 손 길 엑셀(y24XlsxAoa)');
{ const r0 = { v: { isbn: '9788900000011', stock: 1, grade: '상', title: '시험 책' }, x: { goodsNo: '150000001', price: 9000 }, skus: ['A01SKU2'] };
  const ri = pageRead(M.y24XlsxAoa([r0], 'isbn'), '01'), rn = pageRead(M.y24XlsxAoa([r0], 'no'), '02');
  ok(ri.list.length === 1 && String(ri.list[0].BARCODE) === '9788900000011' && ri.list[0].MAN_NO === 'A01SKU2', '바코드용: 바코드·자체코드가 읽힘', ri);
  ok(rn.list.length === 1 && String(rn.list[0].GOODS_NO) === '150000001' && rn.list[0].MAN_NO === 'A01SKU2' && +rn.list[0].USED_SALE_PR === 9000, '상품번호용: 상품번호·자체코드·판매가가 읽힘', rn); }
console.log('⑤ (y24reg4 고침) 품질등급 = 낱말 글자(최상·상·중·하) · 판매상태·판매형태 = 글자 1(소장용 2) — 예스24 원본 양식 안내 그대로 · 코드 01~04는 -4');
{ const g = (x) => pageRead(F.y24RegAoa([{ lid: 'aladin_U9', isbn: '9788900000011', grade: x, qty: 1, price: 9000, self: 'A01SKU9', title: '시험' }]), '01').list[0].GOODS_LEVEL_GB;
  ok(g('최상') === '최상' && g('상') === '상' && g('중') === '중' && g('하') === '하' && g('상(밑줄 있음)') === '상' && g('') === '' && g('새것') === '', '등급 = 최상·상·중·하 글자 · 모르면 빈 칸(짐작 안 함)', [g('최상'), g('상'), g('중'), g('하'), g('')]);
  ok(['최상', '상', '중', '하'].every((x) => !/^0\d$/.test(g(x))), '(-4 다시 막음) 등급에 결과 표 코드 01~04를 넣지 않음 — 11/17 08:07 HOME 블루레이 "01" → 오류코드 -4 상태정보');
  { const q0 = pageRead(F.y24RegAoa([{ lid: 'aladin_U9', isbn: '9788900000011', grade: '최상', qty: 1, price: 9000, self: 'A01SKU9', title: '시험' }]), '01').list[0];
    ok(typeof q0.GOODS_STAT_GB === 'string' && typeof q0.SALE_TYPE_GB === 'string' && typeof q0.GOODS_LEVEL_GB === 'string' && q0.GOODS_STAT_GB === '1' && q0.SALE_TYPE_GB === '1', '(0줄 다시 막음) 판매상태·판매형태가 숫자가 아닌 글자 "1"로 예스24에 감 — 11/17 07:41 숫자 1·1 → 확인 0줄', [typeof q0.GOODS_STAT_GB, q0.GOODS_STAT_GB, q0.SALE_TYPE_GB]); }
  const r0 = { v: { isbn: '9788900000011', stock: 1, grade: '중', title: '시험 책' }, x: { goodsNo: '150000001', price: 9000, collect: 1 }, skus: ['A01SKU2'] }; const q = pageRead(M.y24XlsxAoa([r0], 'no'), '02').list[0];
  ok(q.GOODS_LEVEL_GB === '중' && q.GOODS_STAT_GB === '1' && q.SALE_TYPE_GB === '2', '손 길 엑셀도 같음(중 · 판매중 1 · 소장용 2 · 글자)', q);
  { const q2 = pageRead(M.y24XlsxAoa([{ ...r0, x: { goodsNo: '150000001', price: 9000 } }], 'no'), '02').list[0]; ok(q2.SALE_TYPE_GB === '1' && typeof q2.GOODS_STAT_GB === 'string', '손 길 일반 = 판매형태 1(글자)', q2); }
  const H = rd('lab/col2/helper/col2-y24reg.js'); ok(/한 줄도 돌려주지 않음/.test(H) && /최상·상·중·하 글자/.test(H) && !/품질등급 01~04/.test(H), '번외: 확인 결과 0줄이면 칸 값 문제라고 알려 줌(안내도 글자 등급으로)');
  ok(/lv:sv\(x\.GOODS_LEVEL_GB\)/.test(H) && /sl:sv\(x\.STATE_LEVEL_GB\)/.test(H), '번외 0.1.74: 결과 줄의 등급·상태정보 칸 값도 raw에 담음(읽기만)');
  const C = rd('cloud/y24auto.js'); ok(/revVer/.test(C) && C.includes('오류코드 -?\\d'), '클라우드: 안 누른 실패 줄을 번외 판마다 한 번 다시 후보로(상품 탓 오류 코드가 있는 줄은 사람에게)');
  ok(/오류코드 -\(\?:4\|5\|6\|7\|9\|13\)/.test(C), '클라우드: 우리 칸 값 탓 오류(-4~-7·-9·-13)인 줄도 번외 판마다 한 번 다시 후보로'); }
console.log('③ 옛 머리글이면 모두 버려짐(원인 재현)');
{ const old = F.y24RegAoa([{ lid: 'aladin_U1', isbn: BC, bc: BC, grade: '최상', qty: 1, price: 298000, self: 'KHKd0000EX', title: '시험 블루레이' }]); old[26] = ['', '바코드/상품번호', '재고', '등급', '판매가', '상품명', '적립율', '자체코드', '홍보문구', '상품설명', '판매상태', '판매형태'];
  const r = pageRead(old, '01'); ok(r.n === 1 && r.list.length === 0, '옛 머리글 = 엑셀 1줄을 읽어도 바코드 칸이 비어 0줄(HOME 표 0줄과 같음)', r); }
console.log('④ 클라우드도 같은 덩어리');
{ const C = rd('cloud/y24auto.js'); ok(/'y24RegAoa'/.test(C) && /m\.B\.y24RegAoa\(rows\)/.test(C), '클라우드 엑셀 = 웹앱 ◆y24reg 덩어리의 y24RegAoa 그대로(머리글 고침이 같이 감)');
  const H = rd('lab/col2/helper/col2-y24reg.js'); ok(/PRE_HEAD = '예스24 엑셀 확인 결과\(누르기 전 멈춤/.test(H) && /예스24 엑셀 확인 결과/.test(C), '번외 누르기 전 멈춤 글머리를 클라우드 이어 가기가 앎'); }
console.log(bad ? `✗ tY24REG_XH1117 실패 ${bad}` : '✓ tY24REG_XH1117 모두 통과'); process.exit(bad ? 1 : 0);
