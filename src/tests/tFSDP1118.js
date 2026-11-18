// tFSDP1118 — (fbdp1 11/18 · 정범님 11/18 11:34 「기본 DB 지우기 막음 → 켜」) /kp-in fsdp — Firestore 데이터베이스 통째 지우기 막음 켜기 · 브라우저 필요 없음
//  ① 정해진 DB 이름 둘만 ② PATCH 한 번 · updateMask=deleteProtectionState 하나 · 몸통은 ENABLED만(끄는 길·시점 복구 칸 없음) ③ 403·예외는 err ④ /kp-in에 이어짐
// 실행: node src/tests/tFSDP1118.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const i = CL.indexOf("const FSDP_OK = ["); const k = CL.indexOf('async function fsDelProtOn(', i); const j = CL.indexOf('\n', k);
(async () => {
  ok(i > 0 && k > i && j > k, 'fsDelProtOn 덩어리가 있음');
  const blk = CL.slice(i, j);
  ok(!/DELETE_PROTECTION_DISABLED|pointInTimeRecovery|POINT_IN_TIME/.test(blk), '끄는 길·시점 복구 칸이 없음');
  ok(!/method\s*:\s*'(DELETE|POST)'/.test(blk), '지우기·만들기 요청 없음');
  const fn = new Function('gToken', 'fetch', blk + '\nreturn fsDelProtOn;')(async () => 'never', async () => { throw new Error('never'); });
  const calls = []; const fake = (st, body) => async (u, o) => { calls.push({ u, o }); return { ok: st >= 200 && st < 300, status: st, json: async () => body }; };
  let r = await fn('(default)', async () => 'tk', fake(200, { name: 'projects/readnow-3a385/databases/(default)/operations/abc', done: false }));
  ok(calls.length === 1, 'PATCH 한 번', calls);
  const c = calls[0] || { o: {} };
  ok(c.u === 'https://firestore.googleapis.com/v1/projects/readnow-3a385/databases/(default)?updateMask=deleteProtectionState', '주소·updateMask 하나', c.u);
  ok(c.o.method === 'PATCH' && c.o.headers.Authorization === 'Bearer tk', 'PATCH · 클라우드 계정 토큰');
  ok(JSON.stringify(JSON.parse(c.o.body)) === '{"deleteProtectionState":"DELETE_PROTECTION_ENABLED"}', '몸통은 ENABLED 한 칸', c.o.body);
  ok(r.id === '(default)' && r.st === 200 && r.op === 'abc' && r.done === false, '결과 칸', r);
  calls.length = 0; r = await fn('readnow-research', async () => 'tk', fake(200, {})); ok(/databases\/readnow-research\?/.test(calls[0].u), '연구 DB도');
  calls.length = 0; r = await fn('other', async () => 'tk', fake(200, {})); ok(calls.length === 0 && r.err, '모르는 DB는 안 부름', r);
  calls.length = 0; r = await fn('(default)?x=1', async () => 'tk', fake(200, {})); ok(calls.length === 0 && r.err, '이름 꾸밈도 막음', r);
  r = await fn('(default)', async () => 'tk', fake(403, { error: { code: 403, status: 'PERMISSION_DENIED' } })); ok(/^HTTP 403/.test(r.err), '권한 없음은 err', r);
  r = await fn('(default)', async () => { throw new Error('토큰 못 받음 500'); }, fake(200, {})); ok(/토큰 못 받음/.test(r.err), '예외도 err', r);
  ok(/const rdp = J0\.fsdp \? await fsDelProtOn\(J0\.fsdp\) : null;/.test(CL) && /\.\.\.\(rdp \? \{ fsdp: rdp \} : \{\}\)/.test(CL), '/kp-in에 이어짐(fsdp 칸이 있을 때만)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})();
