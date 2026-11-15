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
  return results;
}
module.exports = { run };
