'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
function harness(root) {
  const s = fs.readFileSync(path.join(root, 'shop/shop.js'), 'utf8');
  const a = s.indexOf('let pageEpoch ='), b = s.indexOf('const LS =', a); assert(a >= 0 && b > a, '화면 소유권 함수 찾기');
  const c = s.indexOf('async function render()'), d = s.indexOf('/* (11/11 shop4)', c); assert(c >= 0 && d > c, '실제 경로 함수 찾기');
  const noop = () => {}, ctx = { location: { hash: '#/b/TEST-A' }, shelfEpoch: 0, listKeep: noop, moreIO: null, LST: {}, ST: {}, SHL: {},
    B: { route: () => ({ name: 'wish', q: {} }) }, document: { body: { classList: { remove: noop, toggle: noop } } }, window: { scrollTo: noop }, $$: () => [],
    lookPv: noop, sheetClose: noop, suggOpen: noop, NO_TABS: [], FLOW: [], TT: {}, cbarOn: noop, searchBox: noop, setTimeout: noop, pvBar: noop, wishPage: noop };
  vm.createContext(ctx); vm.runInContext(s.slice(a, b) + '\n' + s.slice(c, d), ctx); return ctx;
}
async function run({ root }) {
  const results = []; const test = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.stack }); } };
  await test('손님 화면: 최신 요청만 응답을 반영할 수 있음', () => { const h = harness(root), a = h.pageScope(); assert(a()); const b = h.pageScope(); assert(!a()); assert(b()); });
  await test('손님 화면: 경로 처리 전 주소가 바뀌어도 이전 응답은 무효', () => { const h = harness(root), a = h.pageScope(); h.location.hash = '#/order'; assert(!a()); });
  await test('손님 화면: 다른 화면에 갔다 같은 주소로 돌아와도 예전 요청은 무효', async () => { const h = harness(root), a = h.pageScope(); h.location.hash = '#/wish'; await h.render(); h.location.hash = '#/b/TEST-A'; assert(!a()); const b = h.pageScope(); assert(b()); });
  await test('손님 화면: 같은 주소 재그리기에도 현재 요청 번호를 새로 확인', async () => { const h = harness(root), a = h.pageScope(); await h.render(); assert(!a()); });
  const B = require(path.join(root, 'shop/shop-core.js'));
  const A = { id: 'TEST-A', _entry: 'entry-A', p: 2000 }, N = { id: 'TEST-B', _entry: 'entry-B', p: 3000 };
  await test('접수 정리: 제출한 줄만 제거하고 다른 책 보존', () => { assert.deepEqual(B.cartAfterOrder([A, N], [A]), [N]); });
  await test('접수 정리: 나중에 추가한 수량은 새 줄로 보존', () => { assert.deepEqual(B.cartAfterOrder([{ ...A, n: 3 }], [A]), [{ id: A.id, p: A.p, n: 2 }]); });
  await test('접수 정리: 두 개 제출 뒤 남은 한 개는 기본 수량 형식', () => { assert.deepEqual(B.cartAfterOrder([{ ...A, n: 3 }], [{ ...A, n: 2 }]), [{ id: A.id, p: A.p }]); });
  await test('접수 정리: 줄 수량을 줄여도 음수 수량을 만들지 않음', () => { assert.deepEqual(B.cartAfterOrder([A], [{ ...A, n: 2 }]), []); });
  await test('접수 정리: 같은 상품을 삭제 뒤 다시 담으면 새 줄 보존', () => { const again = { ...A, _entry: 'entry-new' }; assert.deepEqual(B.cartAfterOrder([again], [A]), [again]); });
  await test('접수 정리: 소유권 없는 옛 탭의 줄은 추측으로 제거하지 않음', () => { const old = { id: A.id, p: A.p }; assert.deepEqual(B.cartAfterOrder([old], [A]), [old]); assert.deepEqual(B.cartAfterOrder([A], [old]), [A]); });
  await test('접수 정리: 같은 줄 번호라도 다른 상품이면 보존', () => { const other = { ...N, _entry: A._entry }; assert.deepEqual(B.cartAfterOrder([other], [A]), [other]); });
  await test('접수 정리: 가격만 새로 받아도 제출 수량 정리 유지', () => { assert.deepEqual(B.cartAfterOrder([{ ...A, p: 1900 }], [A]), []); });
  await test('접수 정리: 같은 결과를 다시 적용해도 남은 수량 보존', () => { const left = B.cartAfterOrder([{ ...A, n: 3 }], [A]); assert.deepEqual(B.cartAfterOrder(left, [A]), left); const stored = left.map(x => ({ ...x, _entry: 'remaining' })); assert.deepEqual(B.cartAfterOrder(stored, [A]), stored); });
  await test('접수 정리: 입력 배열과 줄을 바꾸지 않음', () => { const now = Object.freeze([Object.freeze({ ...A, n: 3 }), Object.freeze(N)]), sent = Object.freeze([Object.freeze(A)]); assert.equal(B.cartAfterOrder(now, sent)[0].n, 2); assert.equal(now[0].n, 3); });
  await test('주문 전송: 장바구니 줄 소유권은 서버 요청에 포함하지 않음', () => { const body = B.orderBody({ name: '가상 주문자', same: true }, [{ ...A, n: 2 }]); assert.deepEqual(body.items, [A.id]); assert.deepEqual(body.qty, { [A.id]: 2 }); assert(!JSON.stringify(body).includes('_entry')); });
  return results;
}
module.exports = { run };
