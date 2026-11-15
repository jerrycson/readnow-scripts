'use strict';
// 가짜 시계·구독·조회 자료로 종료 뒤 남는 자원을 확인. 운영 연결 없음.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
function clock() {
  let serial = 0; const timers = new Map();
  return { timers, setTimeout: fn => { const id = ++serial; timers.set(id, { fn, repeat: false }); return id; }, clearTimeout: id => timers.delete(id), setInterval: fn => { const id = ++serial; timers.set(id, { fn, repeat: true }); return id; }, clearInterval: id => timers.delete(id), fire: () => { for (const [id, row] of [...timers]) { if (!timers.has(id)) continue; if (!row.repeat) timers.delete(id); row.fn(); } } };
}
async function run({ root = path.resolve(__dirname, '../../..') } = {}) {
  const app = fs.readFileSync(path.join(root, 'src/app.html'), 'utf8'), results = [];
  const cut = (a, b) => { const start = app.indexOf(a), end = app.indexOf(b, start); if (start < 0 || end < start) throw Error('함수 경계 없음: ' + a); return app.slice(start, end); };
  const test = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.stack }); } };
  const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  const lookup = (mode, status = 'queued') => {
    const time = clock(); let next, error, live = 0, stopped = 0, writes = 0;
    const snap = { data: () => ({ status: 'done', items: { TEST: { title: '시험 책' } } }) };
    const ref = { onSnapshot(n, e) { if (mode === 'throw') throw Error('시험 구독 실패'); next = n; error = e; live++; if (mode === 'sync') n(snap); return () => { live--; stopped++; }; } };
    const context = { ...time, pptCloudUrl: () => '', db: { collection: () => ({ add: async () => ref }), runTransaction: async fn => fn({ get: async () => ({ data: () => ({ status }) }), set: () => { writes++; } }) }, S: { user: { email: 'tester@example.invalid' } }, TS: () => 0 };
    vm.runInNewContext(cut('async function purRemote(', 'async function purIsbnLookup('), context);
    return { time, start: () => context.purRemote({}, 'TEST'), done: () => next(snap), fail: () => error(Error('시험 읽기 실패')), counts: () => ({ live, stopped, writes }) };
  };
  await test('조회 성공 뒤 구독·대기 타이머 0개', async () => { const x = lookup(); const p = x.start(); await flush(); x.done(); assert.equal((await p).title, '시험 책'); assert.equal(x.time.timers.size, 0); assert.deepEqual(x.counts(), { live: 0, stopped: 1, writes: 0 }); });
  await test('조회 읽기 오류 뒤 타이머가 뒤늦게 작업을 취소하지 않음', async () => { const x = lookup(); const p = x.start(); await flush(); x.fail(); assert.equal((await p).err, '읽기 실패'); assert.equal(x.time.timers.size, 0); x.time.fire(); await flush(); assert.deepEqual(x.counts(), { live: 0, stopped: 1, writes: 0 }); });
  await test('구독 중 즉시 응답해도 초기화 순서 오류 없음', async () => { const x = lookup('sync'); assert.equal((await x.start()).title, '시험 책'); assert.equal(x.time.timers.size, 0); assert.deepEqual(x.counts(), { live: 0, stopped: 1, writes: 0 }); });
  await test('구독 시작 실패는 읽기 실패로 끝나고 타이머 없음', async () => { const x = lookup('throw'); assert.equal((await x.start()).err, '읽기 실패'); assert.equal(x.time.timers.size, 0); });
  await test('조회 시간 초과 때 대기 중인 작업만 기존 규칙대로 취소', async () => { const x = lookup(); const p = x.start(); await flush(); x.time.fire(); assert.match((await p).err, /60초/); await flush(); assert.equal(x.time.timers.size, 0); assert.deepEqual(x.counts(), { live: 0, stopped: 1, writes: 1 }); });
  await test('조회 시간 초과 때 실행 중인 작업은 취소하지 않음', async () => { const x = lookup(undefined, 'running'); const p = x.start(); await flush(); x.time.fire(); await p; await flush(); assert.equal(x.counts().writes, 0); });
  await test('조회 완료 뒤 늦은 오류·응답도 정리 한 번만 수행', async () => { const x = lookup(); const p = x.start(); await flush(); x.done(); await p; x.fail(); x.done(); assert.deepEqual(x.counts(), { live: 0, stopped: 1, writes: 0 }); });
  const progress = () => { const time = clock(); let el = { innerHTML: '' }; const context = { ...time, KMS: { busy: { title: '시험', i: 0, n: 1, step: '읽기', t0: 0, errs: [] } }, document: { getElementById: () => el }, esc: x => String(x), num: x => String(x) }; vm.runInNewContext(cut('function kmsProgDraw(', 'async function kmsAdd('), context); return { context, time, hide: () => { el = null; } }; };
  await test('사진 읽기 화면을 닫은 뒤 완료해도 타이머 0개', () => { const x = progress(); x.context.kmsProgDraw(); assert.equal(x.time.timers.size, 1); x.hide(); x.context.KMS.busy = null; x.time.fire(); assert.equal(x.time.timers.size, 0); assert.equal(x.context.KMS.progT, null); });
  await test('사진 읽는 중 다시 그려도 진행 타이머 하나만 유지', () => { const x = progress(); x.context.kmsProgDraw(); x.context.kmsProgDraw(); assert.equal(x.time.timers.size, 1); x.context.KMS.busy = null; x.context.kmsProgDraw(); assert.equal(x.time.timers.size, 0); });
  const lite = () => { const time = clock(); let boots = 0; const context = { ...time, S: { detail: { ship: true }, navStack: [], shipLite: true, _bootRest: async () => { boots++; } }, document: { body: { classList: { remove() {} } } }, renderMain() {}, toast() {}, console }; vm.runInNewContext(cut('function shipLiteWatch(', '/* (1.24.1) 첫 화면'), context); return { context, time, boots: () => boots }; };
  await test('출고 화면·뒤로 가기 경로에서는 가벼운 모드 유지', () => { const x = lite(); x.context.shipLiteWatch(); x.time.fire(); assert.equal(x.boots(), 0); x.context.S.detail = { product: true }; x.context.S.navStack = [{ detail: { ship: true } }]; x.time.fire(); assert.equal(x.boots(), 0); assert.equal(x.time.timers.size, 1); });
  await test('출고 화면을 떠나면 전체 받기 한 번·감시 타이머 0개', () => { const x = lite(); x.context.shipLiteWatch(); x.context.shipLiteWatch(); assert.equal(x.time.timers.size, 1); x.context.S.detail = null; x.time.fire(); x.time.fire(); assert.equal(x.boots(), 1); assert.equal(x.time.timers.size, 0); assert.equal(x.context.S.shipLite, false); });
  await test('출고 가벼운 모드의 대기 작업이 없어지면 감시 종료', () => { const x = lite(); x.context.shipLiteWatch(); x.context.S._bootRest = null; x.time.fire(); assert.equal(x.time.timers.size, 0); assert.equal(x.boots(), 0); });
  return results;
}
module.exports = { run };
if (require.main === module) run().then(r => { r.forEach(x => console.log((x.ok ? '✓ ' : '✗ ') + x.name + (x.error ? '\n' + x.error : ''))); console.log(r.filter(x => x.ok).length + '/' + r.length + ' 통과'); if (r.some(x => !x.ok)) process.exitCode = 1; }).catch(e => { console.error(e); process.exitCode = 1; });
