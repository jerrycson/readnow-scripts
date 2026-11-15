'use strict';
/* node src/tests/standalone/stability.test.cjs — 운영 연결·개인정보·비공개 시험 틀 없이 실행 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const copy = (x) => x == null ? x : JSON.parse(JSON.stringify(x));
function merge(a, b) { const out = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) out[k] = v && v.__union ? [...(out[k] || []), ...v.__union] : v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k], v) : copy(v); return out; }
function mockDb(seed) {
  const data = new Map(Object.entries(seed || {}).map(([k, v]) => [k, copy(v)])); let chain = Promise.resolve(); let failWrites = false; let rerun = false;
  const ref = (id) => ({ id: id.split('/').pop(), path: id,
    get: async () => snap(id), set: async (v, o) => write(id, v, o) });
  const snap = (id) => ({ exists: data.has(id), ref: ref(id), id: id.split('/').pop(), data: () => copy(data.get(id)) });
  const write = (id, v, o) => { if (failWrites) throw new Error('synthetic write failure'); data.set(id, o && o.merge ? merge(data.get(id), v) : copy(v)); };
  const db = { data, collection: (name) => ({ doc: (id) => ref(name + '/' + id) }),
    setFail: (on) => { failWrites = on; }, setRetry: (on) => { rerun = on; },
    runTransaction(fn) { const task = chain.then(async () => {
      const once = async () => { const writes = []; let written = false; const tx = { get: async (r) => { if (written) throw new Error('read after write'); return snap(r.path); },
        getAll: async (...refs) => { if (written) throw new Error('read after write'); return refs.map((r) => snap(r.path)); },
        set: (r, v, o) => { written = true; writes.push([r.path, v, o]); }, update: (r, v) => { written = true; writes.push([r.path, v, { merge: true }]); } };
        const result = await fn(tx); return { writes, result };
      };
      if (rerun) await once(); const last = await once(); if (failWrites && last.writes.length) throw new Error('synthetic commit failure');
      for (const args of last.writes) write(...args); return last.result;
    }); chain = task.catch(() => {}); return task; }
  }; return db;
}
function between(text, start, end) { const a = text.indexOf(start), b = text.indexOf(end, a + start.length); assert(a >= 0 && b > a, '시험 대상 함수 경계: ' + start); return text.slice(a, b); }
async function run(options = {}) {
  const root = options.root || path.resolve(__dirname, '../../..'); const read = options.read || ((p) => fs.readFileSync(path.join(root, p), 'utf8'));
  const results = []; const test = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.stack || String(e) }); } };
  const coreText = read('readnow-exec-core.js'), app = read('src/app.html'), collector = read('src/readnow-collector.src.js');
  const module = { exports: {} }; vm.runInNewContext(coreText, { module, crypto: webcrypto, TextEncoder, Date, require }); const X = module.exports;
  await test('동시에 같은 작업을 맡아도 하나만 시작', async () => { const db = mockDb(); const L = await Promise.all([X.begin(db, { kind: 'price', key: 'A', by: 'one' }), X.begin(db, { kind: 'price', key: 'A', by: 'two' })]); assert.equal(L.filter((x) => x.ok).length, 1); });
  await test('트랜잭션 재실행에서 결과와 시도 횟수 유지', async () => { const db = mockDb(); db.setRetry(true); assert.equal((await X.begin(db, { kind: 'price', key: 'A' })).ok, true); assert.equal(db.data.get('exec_log/price__A').tries, 1); });
  await test('응답 유실 뒤 같은 작업 재전송 금지', async () => { const db = mockDb(); let calls = 0; await assert.rejects(X.run(db, { kind: 'startDelivery', key: 'A' }, async () => { calls++; throw new Error('accepted then response lost'); })); assert.equal(db.data.get('exec_log/startDelivery__A').status, 'unknown'); const r = await X.run(db, { kind: 'startDelivery', key: 'A' }, async () => { calls++; }); assert.equal(r.skipped, true); assert.equal(calls, 1); });
  await test('보내기 전임이 확실한 실패는 재시도 가능', async () => { const db = mockDb(); await assert.rejects(X.run(db, { kind: 'price', key: 'A' }, async () => { throw Object.assign(new Error('not sent'), { notSent: true }); })); assert.equal((await X.begin(db, { kind: 'price', key: 'A' })).ok, true); });
  await test('결과 저장 실패를 성공으로 반환하지 않음', async () => { const db = mockDb(); await assert.rejects(X.run(db, { kind: 'price', key: 'A' }, async () => { db.setFail(true); return { status: 'done' }; })); db.setFail(false); assert.equal((await X.begin(db, { kind: 'price', key: 'A' })).ok, false); });
  await test('같은 실행 번호의 다른 요청 내용 거절', async () => { const db = mockDb(); const b = await X.begin(db, { kind: 'price', key: 'A', request: { price: 1 } }); await X.finish(db, b, 'failed'); const r = await X.begin(db, { kind: 'price', key: 'A', request: { price: 2 } }); assert.equal(r.ok, false); assert.equal(r.state, 'conflict'); });
  await test('오래된 실행 시도의 결과가 새 시도를 덮지 않음', async () => { const db = mockDb(); const old = await X.begin(db, { kind: 'price', key: 'A', by: 'one' }); await X.finish(db, old, 'failed'); const current = await X.begin(db, { kind: 'price', key: 'A', by: 'two' }); await assert.rejects(X.finish(db, old, 'done')); assert.equal(db.data.get('exec_log/price__A').by, 'two'); await X.finish(db, current, 'done'); });
  for (const mode of ['missing', 'permission', 'network']) await test('실행 기록 실패 시 외부 호출 0회: ' + mode, async () => {
    const ctx = { window: {}, db: {}, PC_NAME: 'TEST', nowIso: () => 'test', log: () => {}, EXC: () => mode === 'missing' ? null : { begin: async () => { throw Object.assign(new Error(mode), { code: mode === 'permission' ? 'permission-denied' : 'unavailable' }); }, finish: async () => {} } };
    const start = collector.includes('  const EX_TICKETS') ? '  const EX_TICKETS' : '  const exBegin';
    vm.runInNewContext(between(collector, start, '  let LOOK_PRIO') + '\nglobalThis.gate = exBegin;', ctx);
    let calls = 0; if ((await ctx.gate('startDelivery', 'A', { ono: 'A' })).ok) calls++; assert.equal(calls, 0);
  });
  await test('송장 3경로에 권한 오류 우회가 없음', async () => { const invoice = collector.slice(collector.indexOf('    const EXI =')); assert(!invoice.includes("/permission/i.test(er.code || er.message) ? { ok: true")); assert(invoice.includes("if (!EXI || typeof EXI.begin !== 'function'")); });
  const matchContext = { S: { os: { bl: { holds: {} } } } }; vm.runInNewContext(between(app, 'function osHoldsOfJob(', '/* 보류 장부('), matchContext);
  await test('보류 상자 합계만으로 다른 주문을 보류하지 않음', () => { const r = matchContext.osMatchCause({ byOrder: [{ orderNo: 'A', status: 'none' }] }, { al: ['A', 'B'], alps: { holds: 1, holdItems: [{ ono: 'B', box: 'box1' }] } }); assert.deepEqual(Array.from(r.hold), []); assert.deepEqual(Array.from(r.nomatch), ['A']); });
  await test('한 보류 상자의 두 주문을 모두 보류로 연결', () => { const r = matchContext.osMatchCause({ byOrder: ['A', 'B'].map((orderNo) => ({ orderNo, status: 'none' })) }, { al: ['A', 'B'], alps: { holds: 1, holdItems: ['A', 'B'].map((ono) => ({ ono, box: 'same' })) } }); assert.deepEqual(Array.from(r.hold), ['A', 'B']); });
  await test('다른 실행의 보류를 현재 묶음에 붙이지 않음', () => { const r = matchContext.osHoldsOfJob({ holds: [{ runIds: ['other'], fileName: 'other.xlsx', items: [{ ono: 'A' }] }] }, { alpsIds: ['current'], file: 'current.xlsx' }); assert.equal(r.items.length, 0); });
  function leaseContext(seed) { const db = mockDb({ 'shp_runs/run': seed }); const S = { os: { id: 'run', lease: { id: 'run', epoch: 1 }, doc: { ...copy(seed), id: 'run' }, drive: true } };
    const ctx = { S, db, OS_TAB: 'old', Date, osRef: (id) => db.collection('shp_runs').doc(id), TS: () => 'timestamp', osBatch: (r) => (r.bt || [])[r.cur || 0], deviceName: () => 'TEST', osOwnStale: () => true };
    vm.runInNewContext(between(app, 'const osLeaseEpoch', 'async function osPut(') + between(app, 'async function osTake(', 'window.shipOneShot ='), ctx); return { ctx, db, S };
  }
  await test('오래된 맥박이 새 담당을 덮지 않음', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'new', epoch: 2 } }); await assert.rejects(ctx.osRenewLease('run')); assert.equal(db.data.get('shp_runs/run').owner.tab, 'new'); });
  await test('담당 변경 뒤 도착한 완료 결과 거절', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'new', epoch: 2 } }); await assert.rejects(ctx.osOwnedWrite('run', { status: 'done' })); assert.equal(db.data.get('shp_runs/run').status, 'run'); });
  await test('전송 중 인계는 결과 확인 대기로 바뀜', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'new', epoch: 2 }, inFlight: { token: 'pending' } }); assert.equal(await ctx.osTake('run'), true); const row = db.data.get('shp_runs/run'); assert.equal(row.status, 'wait'); assert.equal(row.owner.epoch, 3); assert.equal(row.inFlight.token, 'pending'); });
  await test('중단 뒤 같은 담당의 뒤늦은 단계도 거절', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'old', epoch: 1 } }); await ctx.osStopRun('run'); await assert.rejects(ctx.osOwnedWrite('run', { status: 'done' })); assert.equal(db.data.get('shp_runs/run').status, 'stop'); });
  await test('도우미 응답 유실 뒤 다시 전송하지 않음', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'old', epoch: 1 } }); let calls = 0; ctx.alpsFetch = async () => { calls++; throw new Error('lost'); }; await assert.rejects(ctx.osExternal({ id: 'run' }, '/alps/run', { fileName: 'test.xlsx' })); await assert.rejects(ctx.osExternal({ id: 'run' }, '/alps/run', { fileName: 'test.xlsx' })); assert.equal(calls, 1); assert.equal(db.data.get('shp_runs/run').need.k, 'resultUnknown'); });
  await test('같은 주문 재시도는 실행 번호 유지, 다른 품목 결정은 분리', async () => { const ctx = { window: { ReadnowExec: X } }; vm.runInNewContext(between(app, 'async function shipOperationIds(', 'async function shipCmd('), ctx); const commands = [{ id: 'first', type: 'startDelivery', orderNos: ['A'], lids: { A: ['one'] }, createdAt: '1', results: { A: { state: 'unknown' } } }]; assert.equal((await ctx.shipOperationIds(['A'], { A: ['one'] }, 'next', commands)).A, 'first:A'); assert.equal((await ctx.shipOperationIds(['A'], { A: ['two'] }, 'next', commands)).A, 'delivery-v2:A:' + await X.requestHash(['two'])); commands[0].results.A.state = 'done'; assert.equal((await ctx.shipOperationIds(['A'], { A: ['one'] }, 'next', commands)).A, 'first:A'); const one = await ctx.shipOperationIds(['A'], { A: ['one'] }, 'pc-one', []); const two = await ctx.shipOperationIds(['A'], { A: ['one'] }, 'pc-two', []); assert.equal(one.A, two.A); });
  await test('같은 파일 이름의 다른 실행 보류는 연결 안 함', () => { const r = matchContext.osHoldsOfJob({ holds: [{ runIds: ['other'], fileName: 'same.xlsx', items: [{ ono: 'A' }] }] }, { alpsIds: ['current'], file: 'same.xlsx' }); assert.equal(r.items.length, 0); });
  await test('실행 번호 없는 옛 보류는 확인 필요로 남김', () => { const r = matchContext.osHoldsOfJob({ holds: [{ fileName: 'same.xlsx', items: [{ ono: 'A' }] }] }, { alpsIds: ['current'], file: 'same.xlsx' }); assert.equal(r.items.length, 0); });
  await test('옛 도우미 일이 살아 있다는 사실만으로 요청 확인 안 함', async () => { const { ctx, db } = leaseContext({ status: 'wait', owner: { tab: 'old', epoch: 1 }, inFlight: { token: 'new-request', path: '/alps/resume', job: 'old-job' } }); ctx.alpsFetch = async p => p === '/alps/status' ? { run: { id: 'old-job', status: 'run' } } : { hist: [] }; assert.equal(await ctx.osCheckExternal(ctx.S.os.doc), false); assert(db.data.get('shp_runs/run').inFlight); });
  await test('요청 번호가 맞는 도우미 결과만 확인', async () => { const { ctx, db } = leaseContext({ status: 'wait', owner: { tab: 'old', epoch: 1 }, inFlight: { token: 'request', path: '/alps/run' } }); ctx.alpsFetch = async p => p === '/alps/status' ? { run: { id: 'job', status: 'run', operationId: 'request' } } : { hist: [] }; assert.equal(await ctx.osCheckExternal(ctx.S.os.doc), true); assert.equal(db.data.get('shp_runs/run').inFlight, null); });
  await test('결과 불명 중 다른 화면 갱신도 대기를 해제 못 함', async () => { const { ctx, db } = leaseContext({ status: 'wait', owner: { tab: 'old', epoch: 1 }, inFlight: { token: 'request' } }); await ctx.osOwnedWrite('run', { status: 'run', need: null }); assert.equal(db.data.get('shp_runs/run').status, 'wait'); assert.equal(db.data.get('shp_runs/run').need.k, 'resultUnknown'); });
  await test('담당권 상실 시 후속 작업 문서도 생성 안 됨', async () => { const { ctx, db } = leaseContext({ status: 'run', owner: { tab: 'new', epoch: 2 } }); await assert.rejects(ctx.osOwnedWrite('run', (cur, tx) => { tx.set(db.collection('shp_cmds').doc('job'), { status: 'queued' }); return {}; })); assert.equal(db.data.has('shp_cmds/job'), false); });
  await test('송장 화면에서 사라졌다는 이유만으로 완료 처리 안 함', () => { assert.equal(X.invoiceObservation({ invoice: '100' }, null, null), 'unknown'); assert.equal(X.invoiceObservation({ invoice: '100' }, { deliveryNo: '200' }, null), 'unknown'); assert.equal(X.invoiceObservation({ invoice: '100' }, { deliveryNo: '1-00' }, null), 'done'); assert.equal(X.invoiceObservation({ invoice: '100' }, null, { ok: true }), 'done'); });
  await test('송장 결과 불명은 같은 번호 확인 뒤에만 완료로 전환', async () => { const db = mockDb(); const ticket = await X.begin(db, { kind: 'invoice', key: 'A:100' }); await X.finish(db, ticket, 'unknown'); await assert.rejects(X.finish(db, ticket, 'done')); await X.finish(db, ticket, 'done', { verified: true }); await X.finish(db, ticket, 'done', { verified: true }); assert.equal(db.data.get('exec_log/invoice__A:100').status, 'done'); });
  await test('송장 결과 기록 실패면 입력 완료 대신 확인 대기', async () => {
    const source = between(collector, '    let bulkN = 0, bulkMiss = 0;', '    if (bulkDiag) { const sumQ');
    let saved, idleText; const ctx = { items: [{ orderNo: 'A', invoice: '100', state: 'sent' }], pres: new Map([['A', { deliveryNo: '100' }]]), EXI: { ...X, finish: async () => { throw new Error('write failure'); } }, db: {}, exKey: x => x.orderNo + ':' + x.invoice, alertMsg: null, nowIso: () => 't', TS: () => 't', invShippedCheck: async () => ({ res: {} }), st: Object.assign(() => {}, { flush: async () => {} }), ref: { set: async x => { saved = x; } }, GM_deleteValue: () => {}, idle: x => { idleText = x; } };
    const promise = vm.runInNewContext('(async () => {' + source + '})()', ctx); await promise;
    assert.equal(saved.status, 'paused'); assert.equal(ctx.items[0].state, 'unknown'); assert(idleText);
  });
  return results;
}
module.exports = { run, mockDb, between };
if (require.main === module) run().then((results) => { for (const r of results) console.log((r.ok ? '✓ ' : '✗ ') + r.name + (r.ok ? '' : '\n' + r.error)); console.log(results.filter((r) => r.ok).length + '/' + results.length + ' 통과'); if (results.some((r) => !r.ok)) process.exitCode = 1; }).catch((e) => { console.error(e); process.exitCode = 1; });
