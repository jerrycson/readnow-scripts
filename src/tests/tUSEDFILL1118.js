// 🧩 판매 장부 상품 코드 메꾸기(cloud/usedfill.js · gateused1 11/18) 시험 — node src/tests/tUSEDFILL1118.js (브라우저 없음 · 1초)
// ① 판매관리 주문 줄(shp) 확실 — 같은 ISBN · ISBN 모르면 빈 줄 하나·남은 상품 하나일 때만 ② 같은 ISBN 판매완료 추정 — 값·등급 점수 → 먼저 등록 · 주문 뒤 등록 뺌 · 이미 쓴 코드 뺌
// ③ 권수 2 → 코드 둘 ④ 메꿀 줄 아님(ok 아님)은 그대로 ⑤ 클라우드 판매 장부가 how 칸·메꿈을 실제로 잇는지(cloud/index.js 글자 확인)
'use strict';
const fs = require('fs'), path = require('path');
const U = require('../../cloud/usedfill.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const S = (code, isbn, reg, price, grade, o) => ({ code, lid: null, isbn, active: false, status: '판매완료', reg, price, grade, ...(o || {}) });
const ln = (k, at, isbn, price, grade, o) => ({ k, ono: null, at, isbn, price, grade, qty: 1, code: null, ok: true, ...(o || {}) });

console.log('② 같은 ISBN 판매완료로 추정');
{ const LS = [S('A1', '9780000000001', '2026-10-01T10:00', 9000, '상'), S('A2', '9780000000001', '2026-10-02T10:00', 8000, '중'), S('A3', '9780000000001', '2026-10-20T10:00', 8000, '중'), S('Z9', '9780000000001', '2026-09-01T10:00', 8000, '중', { active: true, status: '판매중' })];
  const R = U.usedFill([ln('o1|0', '2026-10-10T12:00', '9780000000001', 8000, '중')], LS, new Map());
  ok(R.fill.get('o1|0') && R.fill.get('o1|0').codes[0] === 'A2' && R.fill.get('o1|0').how === 'isbn', '값·등급 같은 A2(주문 뒤 등록 A3 · 판매중 Z9는 안 씀) — ' + JSON.stringify(R.fill.get('o1|0')));
  const R2 = U.usedFill([ln('o1|0', '2026-10-10T12:00', '9780000000001', 9500, '하')], LS, new Map());
  ok(R2.fill.get('o1|0').codes[0] === 'A1', '점수가 같으면 먼저 등록된 것(A1)');
  const R3 = U.usedFill([ln('o0|0', '2026-09-30T12:00', '9780000000001', 8000, '중', { code: 'A2', ok: false }), ln('o1|0', '2026-10-10T12:00', '9780000000001', 8000, '중')], LS, new Map());
  ok(R3.fill.get('o1|0').codes[0] === 'A1' && R3.st.x === 1, '주문 기록에 이미 있는 코드(A2)는 맡아 둠 → A1');
  const R4 = U.usedFill([ln('o1|0', '2026-10-10T12:00', '9780000000001', 8000, '중'), ln('o2|0', '2026-10-11T12:00', '9780000000001', 8000, '중'), ln('o3|0', '2026-10-12T12:00', '9780000000001', 8000, '중')], LS, new Map());
  ok(R4.fill.get('o1|0').codes[0] === 'A2' && R4.fill.get('o2|0').codes[0] === 'A1' && !R4.fill.has('o3|0') && R4.st.none === 1 && R4.st.isbn === 2, '주문 시각 차례로 하나씩 · 후보가 다 떨어지면 못 메꿈(none)');
  const R5 = U.usedFill([ln('o1|0', '2026-10-01T10:00', '9780000000001', 9000, '상')], LS, new Map());
  ok(R5.fill.get('o1|0').codes[0] === 'A1', '주문 1분 안에 등록된 것까지(한국 시각 글자 그대로 셈)');
  const R6 = U.usedFill([ln('o1|0', '2026-10-10T12:00', '9780000000001', 8000, '중', { ok: false })], LS, new Map());
  ok(R6.fill.size === 0, '메꿀 줄 아님(취소·예스24·코드 있음)은 그대로');
  const R7 = U.usedFill([ln('o1|0', '2026-10-25T12:00', '9780000000001', 8000, '중', { qty: 2 })], LS, new Map());
  ok(R7.fill.get('o1|0').codes.join() === 'A2,A3', '권수 2 → 코드 둘(A2·A3)'); }

console.log('① 판매관리 주문 줄로 확실히');
{ const LS = [S('B1', '9780000000002', '2026-10-01T10:00', 5000, '상', { lid: '111' }), S('B2', '9780000000002', '2026-10-01T09:00', 5000, '상', { lid: '222' }), S('C1', null, '2026-10-01T09:00', 3000, '상', { lid: '333' })];
  const shp = new Map([['N1', ['111']], ['N2', ['333']]]);
  const R = U.usedFill([ln('k1|0', '2026-10-10T12:00', '9780000000002', 5000, '상', { ono: 'N1' }), ln('k2|0', '2026-10-11T12:00', '9780000000009', 3000, '상', { ono: 'N2' })], LS, shp);
  ok(R.fill.get('k1|0').codes[0] === 'B1' && R.fill.get('k1|0').how === 'shp', '같은 주문 판매관리 줄의 상품 번호 111 → B1(추정이면 먼저 등록된 B2였을 것)');
  ok(R.fill.get('k2|0').codes[0] === 'C1' && R.fill.get('k2|0').how === 'shp', 'ISBN 모르는 상품이 그 주문에 하나 · 빈 줄 하나 → C1');
  ok(R.st.shp === 2 && R.st.isbn === 0 && R.st.shpOrders === 2, `셈 shp ${R.st.shp} · isbn ${R.st.isbn} · 판매관리 주문 ${R.st.shpOrders}`);
  const R2 = U.usedFill([ln('k1|0', '2026-10-10T12:00', '9780000000002', 5000, '상', { ono: 'N1' }), ln('k3|0', '2026-10-12T12:00', '9780000000002', 5000, '상')], LS, shp);
  ok(R2.fill.get('k3|0').codes[0] === 'B2', '판매관리로 확실히 쓴 코드(B1)는 추정에서 뺌 → B2'); }

console.log('⑤ 클라우드 판매 장부가 메꾸기를 잇는지');
{ const src = fs.readFileSync(path.join(__dirname, '..', '..', 'cloud', 'index.js'), 'utf8');
  ok(/cols: \['code', 'isbn', 'at', 'price', 'qty', 'line', 'pf', 'how'\]/.test(src), '판매 장부 칸 이름 끝에 how(앞 7칸 차례 그대로)');
  ok(/usedFillRun\(FL\)/.test(src) && /require\('\.\/usedfill\.js'\)/.test(src), 'mlLedger가 cloud/usedfill.js로 메꿈');
  ok(/src: it\.aladinUsedCode \? 'crm' : 'crm-fill'/.test(src), 'mlSales도 메꾼 코드를 씀(src crm-fill)');
  ok(!/C\('crm_orders'\)[^;\n]{0,200}\.(set|update|delete)\(/.test(src.slice(src.indexOf('async function mlLedger'), src.indexOf('const USEDFILL'))), '메꾸기는 주문 기록(crm_orders)을 고치지 않음'); }

console.log(bad ? `❌ tUSEDFILL1118 실패 ${bad}` : '✅ tUSEDFILL1118 통과');
process.exit(bad ? 1 : 0);
