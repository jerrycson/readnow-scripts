'use strict';
// 실제 우리숍 경로 함수에 지연된 가짜 파일·설정 응답을 넣는다. 운영 연결 없음.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const defer = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function cut(s, a, b) { const i = s.indexOf(a), j = s.indexOf(b, i + a.length); assert(i >= 0 && j > i, '실제 경로 함수 찾기'); return s.slice(i, j); }
function harness(root) {
  const source = fs.readFileSync(path.join(root, 'shop/shop.js'), 'utf8');
  const file = defer(), cfg = defer(), mounts = [], errors = [], body = { innerHTML: '', insertAdjacentHTML() {} };
  const noop = () => {}, classList = { add: noop, remove: noop, toggle: noop };
  const ctx = { console, pageEpoch: 0, location: { hash: '#/wish' }, document: { body: { classList } }, main: () => body, $$: () => [],
    B: { route: (hash) => ({ name: hash.slice(2).split('?')[0] || 'home', q: Object.fromEntries(new URLSearchParams(hash.split('?')[1] || '')) }) },
    window: { scrollTo: noop, BQS: { cfgOf: x => ({ on: true, ...x }), previewCfg: () => ({}), demoItems: () => [] }, BQShelf: { mount: (el, options) => { const h = { options, destroyed: 0, destroy() { this.destroyed++; } }; mounts.push(h); el.innerHTML = '서가 화면'; return h; } } },
    shelfJs: () => file.promise, cfg: () => cfg.promise, api: () => Promise.resolve({ ok: true }), shopOpen: () => true,
    errBox: e => { errors.push(e.message); return '불러오기 실패'; }, bindAgain: f => { ctx.retry = f; },
    listKeep: noop, moreIO: null, LST: {}, ST: {}, NO_TABS: [], FLOW: [], TT: {},
    lookPv: noop, sheetClose: noop, suggOpen: noop, cbarOn: noop, searchBox: noop, pvBar: noop, setTimeout: () => 0,
    toast: noop, wish: () => [], setWish: noop, pcLink: () => null,
    wishPage: () => { body.innerHTML = '찜 화면'; }, home: () => { body.innerHTML = '홈 화면'; }, cartPage: () => { body.innerHTML = '장바구니 화면'; } };
  vm.createContext(ctx);
  vm.runInContext(cut(source, 'const SHL = ', '/* (shelf5)') + '\n' + cut(source, 'async function shelfPage(', 'function wishPage(') + '\n' + cut(source, 'async function render()', '/* (11/11 shop4)'), ctx);
  return { file, cfg, mounts, errors, body, ctx, nav(hash) { ctx.location.hash = hash; return ctx.render(); }, ready() { file.resolve(); cfg.resolve({}); } };
}
async function run({ root }) {
  const results = [];
  const test = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.stack }); } };
  await test('서가: 파일 수신 중 나갔다 돌아와도 최신 요청 한 개만 생성', async () => {
    const h = harness(root); const first = h.nav('#/shelf?s=cat'); await h.nav('#/wish'); const last = h.nav('#/shelf?s=price'); h.ready(); await Promise.all([first, last]);
    assert.equal(h.mounts.length, 1); assert.equal(h.mounts[0].options.sort, 'price'); await h.nav('#/wish'); assert.equal(h.mounts[0].destroyed, 1);
  });
  await test('서가: 같은 화면의 설정을 연달아 바꾸면 마지막 요청만 생성', async () => {
    const h = harness(root); const a = h.nav('#/shelf?s=reg'), b = h.nav('#/shelf?s=title'); h.ready(); await Promise.all([a, b]); assert.equal(h.mounts.length, 1); assert.equal(h.mounts[0].options.sort, 'title');
  });
  await test('서가: 화면을 나간 뒤 도착한 정상 응답은 다른 화면 보존', async () => {
    const h = harness(root); const a = h.nav('#/shelf'); await h.nav('#/cart'); h.ready(); await a; assert.equal(h.body.innerHTML, '장바구니 화면'); assert.equal(h.mounts.length, 0);
  });
  await test('서가: 화면을 나간 뒤 도착한 실패 응답도 다른 화면 보존', async () => {
    const h = harness(root); const a = h.nav('#/shelf'); await h.nav('#/wish'); h.cfg.resolve({}); h.file.reject(new Error('가짜 파일 응답 실패')); await a; assert.equal(h.body.innerHTML, '찜 화면'); assert.deepEqual(h.errors, []);
  });
  await test('서가: 최신 요청 실패는 기존 안내와 재시도 단추 유지', async () => {
    const h = harness(root); const a = h.nav('#/shelf'); h.cfg.resolve({}); h.file.reject(new Error('가짜 파일 응답 실패')); await a; assert.equal(h.body.innerHTML, '불러오기 실패'); assert.equal(typeof h.ctx.retry, 'function'); assert.deepEqual(h.errors, ['가짜 파일 응답 실패']);
  });
  await test('서가: 이전 화면의 재시도 콜백은 이동한 화면을 바꾸지 않음', async () => {
    const h = harness(root); const a = h.nav('#/shelf'); h.cfg.resolve({}); h.file.reject(new Error('가짜 파일 응답 실패')); await a; const oldRetry = h.ctx.retry; await h.nav('#/wish'); oldRetry(); assert.equal(h.body.innerHTML, '찜 화면'); assert.equal(h.mounts.length, 0);
  });
  await test('서가: 정상 재방문 때 이전 화면 정리와 새 화면 생성 유지', async () => {
    const h = harness(root); h.ready(); await h.nav('#/shelf'); await h.nav('#/wish'); await h.nav('#/shelf'); assert.equal(h.mounts.length, 2); assert.equal(h.mounts[0].destroyed, 1); assert.equal(h.mounts[1].destroyed, 0); await h.nav('#/wish'); assert.equal(h.mounts[1].destroyed, 1);
  });
  await test('서가: 설정 응답만 늦어도 최신 요청을 확인', async () => {
    const h = harness(root); h.file.resolve(); const a = h.nav('#/shelf?s=cat'); await Promise.resolve(); await h.nav('#/wish'); const b = h.nav('#/shelf?s=reg'); h.cfg.resolve({}); await Promise.all([a, b]); assert.equal(h.mounts.length, 1); assert.equal(h.mounts[0].options.sort, 'reg');
  });
  return results;
}
module.exports = { run };
if (require.main === module) run({ root: path.resolve(__dirname, '../../..') }).then(r => { r.forEach(x => console.log((x.ok ? '✓ ' : '✗ ') + x.name + (x.error ? '\n' + x.error : ''))); console.log(`${r.filter(x => x.ok).length}/${r.length} 통과`); if (r.some(x => !x.ok)) process.exitCode = 1; }).catch(e => { console.error(e); process.exitCode = 1; });
