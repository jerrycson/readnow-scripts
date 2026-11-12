// 📋 작업판 거울 /board-in — 클라우드 boardIn 단위 시험(가짜 Firestore · 실제 암호 왕복) · node src/tests/tBOARDIN.js
//  ① 정해 둔 칸만 board_mirror에 merge(숫자·불·ISO) · 다른 칸·모양 거절 ② ship_quiet는 at이 더 늦을 때만 · by '작업판' · src 'board' ③ 리드 도구(mirror 암호문)와 클라우드 kpinOpen이 맞물림 ④ 자동 작업에 '@mirror' 줄 · 리드 도구 있음
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process'); const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..'); const src = fs.readFileSync(ROOT + '/cloud/index.js', 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return src.slice(i, j); };
const part = cut('const BM_NUM = ', 'async function kpinApply(') ; const open = cut('function kpinOpen(', '\n/* 요약 한 글');
const store = {}; const C = (col) => ({ doc: (id) => ({ k: col + '/' + id, async get() { const v = store[col + '/' + id]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, async set(v, o) { store[col + '/' + id] = o && o.merge ? { ...(store[col + '/' + id] || {}), ...v } : v; } }) });
const db = { async runTransaction(fn) { const tx = { get: (r) => r.get(), set: (r, v, o) => { tx.w.push([r, v, o]); }, w: [] }; const out = await fn(tx); for (const [r, v, o] of tx.w) await r.set(v, o); return out; } };
const nowIso = () => new Date().toISOString();
const K = new Function('C', 'db', 'nowIso', 'crypto', part + '\n' + open + '\nreturn { boardIn, boardMirrorClean, shipQuietClean, kpinOpen };')(C, db, nowIso, crypto);
(async () => {
  console.log('① board_mirror — 정해 둔 칸만');
  let r = await K.boardIn({ mirror: { mjOpen: 3, mjLeadWait: 1.4, ideaTalk: 0, ideaJudge: 2, ideaGo: 5, jsTodo: 7, shipQuiet: true, at: '2026-11-12T06:00:00Z', evil: 'x', price: 100 } });
  const M = store['app_settings/board_mirror']; ok(M && M.mjOpen === 3 && M.mjLeadWait === 1 && M.jsTodo === 7 && M.shipQuiet === true && M.at === '2026-11-12T06:00:00.000Z', '숫자·불·ISO 넣음 ' + JSON.stringify(M));
  ok(!('evil' in M) && !('price' in M) && r.mirror.bad.includes('evil') && r.mirror.bad.includes('price'), '다른 칸 거절 ' + JSON.stringify(r.mirror.bad));
  r = await K.boardIn({ mirror: { mjOpen: '9', ideaGo: -1, shipQuiet: 'yes', at: 'nope', jsTodo: 2 } }); ok(store['app_settings/board_mirror'].mjOpen === 3 && store['app_settings/board_mirror'].jsTodo === 2 && r.mirror.bad.length === 4, '글자 숫자·음수·글자 불·이상한 at 거절 · 맞는 칸만 merge ' + JSON.stringify(r.mirror));
  ok(/^\d{4}-\d{2}-\d{2}T/.test(store['app_settings/board_mirror'].at) && store['app_settings/board_mirror'].at !== '2026-11-12T06:00:00.000Z', 'at 없으면 지금 시각');
  r = await K.boardIn({ mirror: [1, 2] }); ok(r.mirror.n === 0 && r.mirror.bad[0] === 'mirror 모양', '배열은 거절');
  console.log('② ship_quiet — 늦게 바꾼 쪽이 이김');
  store['app_settings/ship_quiet'] = { on: false, from: '13:00', to: '15:00', at: '2026-11-12T05:00:00.000Z', by: 'jb@x', src: 'ship' };
  r = await K.boardIn({ shipQuiet: { on: true, from: '12:30', to: '15:00', at: '2026-11-12T04:00:00Z' } }); ok(r.shipQuiet.kept && store['app_settings/ship_quiet'].on === false, '더 이른 at은 그대로 둠');
  r = await K.boardIn({ shipQuiet: { on: true, from: '12:30', to: '15:00', at: '2026-11-12T06:00:00Z' } }); const Q = store['app_settings/ship_quiet'];
  ok(r.shipQuiet.set && Q.on === true && Q.from === '12:30' && Q.by === '작업판' && Q.src === 'board' && Q.at === '2026-11-12T06:00:00.000Z', '더 늦은 at은 merge · by 작업판 · src board ' + JSON.stringify(Q));
  r = await K.boardIn({ shipQuiet: { on: false, at: '2026-11-12T06:00:00Z' } }); ok(r.shipQuiet.kept && store['app_settings/ship_quiet'].on === true, '같은 at은 그대로');
  r = await K.boardIn({ shipQuiet: { on: 'false', from: '25:00', at: '2026-11-12T07:00:00Z', by: 'x' } }); ok(!r.shipQuiet.set && r.shipQuiet.bad.length === 3 && store['app_settings/ship_quiet'].on === true, '글자 불·이상한 시각·다른 칸 거절(아무것도 안 씀) ' + JSON.stringify(r.shipQuiet.bad));
  r = await K.boardIn({ shipQuiet: { on: true } }); ok(!r.shipQuiet.set && r.shipQuiet.bad.includes('at 없음'), 'at 없으면 안 씀');
  r = await K.boardIn({}); ok(r.err, '둘 다 없으면 err');
  console.log('③ 리드 도구 암호문 ↔ 클라우드 kpinOpen');
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'tbi-')); const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  fs.mkdirSync(T + '/diag'); fs.writeFileSync(T + '/diag/kpin_pub.pem', publicKey); const J = { by: 'lead', mirror: { mjOpen: 0, jsTodo: 0, at: nowIso() } }; fs.writeFileSync(T + '/in.json', JSON.stringify(J));
  const tool = ROOT + '/src/tools/mirror.sh'; ok(fs.existsSync(tool), 'src/tools/mirror.sh 있음');
  const o = cp.spawnSync('bash', [tool, T + '/in.json'], { cwd: T, encoding: 'utf8' }); ok(o.status === 0, '도구 돌아감 ' + (o.stdout || '').trim().split('\n').pop() + (o.stderr || ''));
  const q = fs.readFileSync(T + '/diag/q.txt', 'utf8').trim(); const m = /^@mirror (mirror\/[\w.-]+\.json)$/.exec(q); ok(m, 'diag/q.txt = @mirror 줄 ' + q);
  if (m) { const b = JSON.parse(fs.readFileSync(T + '/diag/' + m[1], 'utf8')); ok(!JSON.stringify(b).includes('mjOpen'), '파일엔 평문 없음'); const back = JSON.parse(K.kpinOpen({ priv: privateKey }, b.k, b.e)); ok(back.mirror.at === J.mirror.at && back.by === 'lead', '클라우드가 풀면 같은 글'); }
  const o2 = cp.spawnSync('bash', [tool, T + '/nope.json'], { cwd: T, encoding: 'utf8' }); ok(o2.status !== 0, '없는 파일은 멈춤');
  fs.writeFileSync(T + '/x.json', JSON.stringify({ hello: 1 })); const o3 = cp.spawnSync('bash', [tool, T + '/x.json'], { cwd: T, encoding: 'utf8' }); ok(o3.status !== 0, 'mirror·shipQuiet 없으면 멈춤');
  fs.rmSync(T, { recursive: true, force: true });
  console.log('④ 자동 작업·창구');
  const wf = fs.readFileSync(ROOT + '/.github/workflows/deploy-cloud.yml', 'utf8'); ok(/@mirror /.test(wf) && /\/board-in/.test(wf), "deploy-cloud.yml에 '@mirror' → /board-in");
  ok(/path === '\/board-in'/.test(src) && /aud.*readnow-diag/.test(cut("path === '/board-in'", "path === '/billing'")), '/board-in은 /kp-in과 같은 1회용 ID 토큰 검사');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
