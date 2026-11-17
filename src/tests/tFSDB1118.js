// tFSDB1118 — (fbchk2 11/18) 진단 fsdb=1 — Firestore 데이터베이스 목록·통째 지우기 막음·시점 복구 상태를 읽기만 · 브라우저 필요 없음
//  ① 데이터베이스 목록 GET 한 번만(바꾸는 요청 PATCH·POST·DELETE 없음) ② 칸 이름(del·pitr·loc·type) 옮김 ③ 권한 없음(403)은 err로 · 예외도 err로
// 실행: node src/tests/tFSDB1118.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const i = CL.indexOf('      if (q.fsdb) {'); const j = CL.indexOf('\n', i);
(async () => {
  ok(i > 0 && j > i, 'fsdb 덩어리가 있음');
  const blk = CL.slice(i, j);
  ok(!/method\s*:/.test(blk) && !/PATCH|DELETE|POST/.test(blk), '바꾸는 요청이 없음(읽기만)');
  const run = new Function('q', 'out', 'gToken', 'fetch', 'return (async () => {' + blk + '\n})();');
  const calls = [];
  const fake = (st, body) => async (u, o) => { calls.push({ u, o }); return { ok: st === 200, status: st, json: async () => body }; };
  let out = {};
  await run({ fsdb: '1' }, out, async () => 'tk', fake(200, { databases: [
    { name: 'projects/readnow-3a385/databases/(default)', locationId: 'asia-northeast3', type: 'FIRESTORE_NATIVE', deleteProtectionState: 'DELETE_PROTECTION_DISABLED', pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_DISABLED' },
    { name: 'projects/readnow-3a385/databases/readnow-research', locationId: 'asia-northeast3', type: 'FIRESTORE_NATIVE', deleteProtectionState: 'DELETE_PROTECTION_ENABLED', createTime: '2026-11-16T09:26:00Z' }] }));
  ok(calls.length === 1 && /\/v1\/projects\/readnow-3a385\/databases$/.test(calls[0].u) && !(calls[0].o || {}).method, 'GET 한 번 · 목록 주소', calls);
  ok(calls[0].o.headers.Authorization === 'Bearer tk', '클라우드 계정 토큰을 씀');
  const d = (out.fsdb.dbs || []).find((x) => x.id === 'readnow-research');
  ok(d && d.del === 'DELETE_PROTECTION_ENABLED' && d.loc === 'asia-northeast3' && d.type === 'FIRESTORE_NATIVE', '연구 DB 칸 옮김', out.fsdb);
  ok((out.fsdb.dbs || []).find((x) => x.id === '(default)').pitr === 'POINT_IN_TIME_RECOVERY_DISABLED', '기본 DB 시점 복구 칸');
  out = {}; await run({ fsdb: '1' }, out, async () => 'tk', fake(403, { error: { code: 403, message: 'permission denied' } }));
  ok(out.fsdb && /^HTTP 403/.test(out.fsdb.err) && !out.fsdb.dbs, '권한 없음은 err', out);
  out = {}; await run({ fsdb: '1' }, out, async () => { throw new Error('토큰 못 받음 500'); }, fake(200, {}));
  ok(out.fsdb && /토큰 못 받음/.test(out.fsdb.err), '예외도 err', out);
  out = {}; await run({}, out, async () => 'tk', fake(200, {})); ok(!('fsdb' in out), '물음이 없으면 안 돎');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})();
