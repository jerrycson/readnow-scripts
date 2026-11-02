// 클라우드 ALPS-HELPER 칸 모의 시험(가짜 Firestore · 진짜 서명) — 쓰는 법: node cloud-mock.js <cloud/index.js> [<local/readnow-alps.js> — 주면 가짜 ALPS까지 끝까지]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), crypto = require('crypto');
const src = fs.readFileSync(process.argv[2], 'utf8'); const a = src.indexOf('/* ALPS-HELPER-BEGIN'), b = src.indexOf('/* ALPS-HELPER-END */'); if (a < 0 || b < 0) throw new Error('칸 없음');
const DEL = { __del: 1 }, TS = { __ts: 1 }; const FV = { delete: () => DEL, serverTimestamp: () => TS };
const S = {}; const col = (n) => (S[n] = S[n] || {});
const apply = (o, u) => { for (const [k, v] of Object.entries(u)) { const ks = k.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]] = t[ks[i]] || {}; if (v === DEL) delete t[ks[ks.length - 1]]; else t[ks[ks.length - 1]] = v === TS ? new Date().toISOString() : v; } return o; };
const dref = (n, id) => ({ id, get: async () => ({ exists: !!col(n)[id], data: () => (col(n)[id] ? JSON.parse(JSON.stringify(col(n)[id])) : undefined) }), set: async (v, o) => { col(n)[id] = o && o.merge ? apply(col(n)[id] || {}, v) : apply({}, v); }, update: async (v) => { if (!col(n)[id]) throw new Error('없는 문서'); apply(col(n)[id], v); } });
const C = (n) => { const q = (F) => ({ where: (k, op, v) => q([...F, (x) => x[k] === v]), get: async () => ({ docs: Object.entries(col(n)).filter(([, x]) => F.every((f) => f(x))).map(([id, x]) => ({ id, ref: dref(n, id), data: () => JSON.parse(JSON.stringify(x)) })) }) }); return { doc: (id) => dref(n, id), ...q([]) }; };
const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), update: (r, v) => r.update(v) }) }; const nowIso = () => new Date().toISOString();
const api = new Function('C', 'db', 'FV', 'nowIso', 'require', src.slice(a, b) + '\nreturn { alpsHelperApi, alpsRaw };')(C, db, FV, nowIso, require);
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const kp = crypto.generateKeyPairSync('ed25519'); const pub = kp.publicKey.export({ type: 'spki', format: 'pem' }); const other = crypto.generateKeyPairSync('ed25519');
const call = async (o, key, mut) => { const raw = Buffer.from(JSON.stringify({ pc: 'MJ-MAIN', ts: Date.now(), nonce: crypto.randomBytes(6).toString('hex'), ...o })); const sig = crypto.sign(null, raw, (key || kp).privateKey).toString('base64'); return api.alpsHelperApi(mut ? mut(raw) : raw, sig); };
(async () => {
  console.log('■ 클라우드 서명 확인·일 넘기기(가짜 Firestore)');
  let [c, o] = await call({ op: 'poll' }); ok(c === 403 && /허락/.test(o.err), '허락 전에는 거절');
  col('app_settings').alps_helpers = { pcs: { 'MJ-MAIN': { pub, at: nowIso() } } }; await new Promise((r) => setTimeout(r, 10));
  [c, o] = await call({ op: 'poll' }); ok(c === 403, '공개 열쇠 기억(60초) 때문에 바로는 거절 — 기억 지움 뒤 다시'); // 캐시
  api.alpsHelperApi.__proto__; // no-op
  // 캐시를 비우려면 새로 만듦
  const api2 = new Function('C', 'db', 'FV', 'nowIso', 'require', src.slice(a, b) + '\nreturn { alpsHelperApi };')(C, db, FV, nowIso, require); const call2 = async (o, key, mut, ts) => { const raw = Buffer.from(JSON.stringify({ pc: 'MJ-MAIN', ts: ts || Date.now(), nonce: o.nonce || crypto.randomBytes(6).toString('hex'), ...o })); const sig = crypto.sign(null, raw, (key || kp).privateKey).toString('base64'); return api2.alpsHelperApi(mut ? mut(raw) : raw, sig); };
  [c, o] = await call2({ op: 'poll' }); ok(c === 200 && o.job === null, '허락 뒤: 맡긴 일 없음');
  [c, o] = await call2({ op: 'poll' }, other); ok(c === 403 && /서명/.test(o.err), '다른 열쇠로 서명하면 거절');
  [c, o] = await call2({ op: 'poll' }, null, (r) => Buffer.from(r.toString().replace('"poll"', '"poll" '))); ok(c === 403, '본문을 바꾸면 거절');
  [c, o] = await call2({ op: 'poll' }, null, null, Date.now() - 10 * 60e3); ok(c === 403 && /시각/.test(o.err), '10분 전 시각이면 거절');
  [c, o] = await call2({ op: 'poll', nonce: 'samenonce1' }); [c, o] = await call2({ op: 'poll', nonce: 'samenonce1' }); ok(c === 403 && /다시/.test(o.err), '같은 요청(nonce) 두 번이면 거절');
  col('shp_cmds').jobAAAA1 = { type: 'alpsRun', status: 'alpsQueued', dev: 'HOME', fileName: '판매완료20261102.xlsx', b64: 'QUJD', rows: [{ name: 'x' }], createdAt: nowIso() };
  col('shp_cmds').jobAAAA2 = { type: 'alpsRun', status: 'alpsQueued', dev: 'MJ-MAIN', fileName: '판매완료20261102.xlsx', b64: 'QUJD', rows: [{ name: '가', title: '책' }], firstOne: true, createdAt: nowIso() };
  col('shp_cmds').jobAAAA3 = { type: 'alpsRun', status: 'alpsQueued', dev: 'MJ-MAIN', fileName: '판매완료20261101.xlsx', b64: 'QUJD', rows: [], createdAt: new Date(Date.now() - 40 * 60e3).toISOString() };
  [c, o] = await call2({ op: 'poll' }); ok(c === 200 && o.job && o.job.id === 'jobAAAA2' && o.job.b64 === 'QUJD' && o.job.rows.length === 1, '내 PC 몫만 받음(다른 PC 일은 안 받음): ' + (o.job && o.job.id));
  ok(col('shp_cmds').jobAAAA3.status === 'cancel', '30분 넘게 안 받은 일은 닫힘'); ok(col('shp_cmds').jobAAAA1.status === 'alpsQueued', 'HOME 몫은 그대로');
  ok(col('shp_cmds').jobAAAA2.status === 'alpsRunning' && !col('shp_cmds').jobAAAA2.b64 && !col('shp_cmds').jobAAAA2.rows && col('shp_cmds').jobAAAA2.claim.pc === 'MJ-MAIN', '맡으면 파일·이름 줄을 문서에서 지움');
  [c, o] = await call2({ op: 'poll' }); ok(c === 200 && o.job === null, '같은 일을 두 번 넘기지 않음');
  [c, o] = await call2({ op: 'progress', id: 'jobAAAA1', run: { status: 'run' } }); ok(c === 403, '남의 일에 진행을 못 씀');
  col('shp_cmds').jobAAAA2.answer = { seq: 1, kind: 'otp', code: '123456', at: nowIso() };
  [c, o] = await call2({ op: 'progress', id: 'jobAAAA2', run: { status: 'wait', steps: [{ k: 'login', st: 'wait' }], need: { type: 'otp', msg: '번호' } }, ackSeq: 0 }); ok(c === 200 && o.answer && o.answer.code === '123456', '진행을 쓰고 웹앱이 넣은 OTP를 받음');
  ok(col('shp_cmds').jobAAAA2.run.need.type === 'otp' && col('shp_cmds').jobAAAA2.status === 'alpsRunning', '문서에 진행(need) 씀');
  [c, o] = await call2({ op: 'progress', id: 'jobAAAA2', run: { status: 'run', steps: [] }, ackSeq: 1 }); ok(c === 200 && !o.answer && !col('shp_cmds').jobAAAA2.answer.code, '받았다고 알리면 OTP 번호를 문서에서 지움');
  [c, o] = await call2({ op: 'result', id: 'jobAAAA2', aoa: [['운송장번호', '수하인명'], ['240000000001', '가']] }); ok(c === 200 && JSON.parse(col('shp_cmd_out').jobAAAA2.aoa).length === 2 && col('shp_cmds').jobAAAA2.status === 'done', '운송장 목록을 shp_cmd_out에 · 일은 끝');
  [c, o] = await call2({ op: 'progress', id: 'jobAAAA2', run: { status: 'done', done: true, hasResult: true, steps: [] }, ackSeq: 1 }); ok(c === 200 && col('shp_cmds').jobAAAA2.status === 'done' && col('shp_cmds').jobAAAA2.doneAt, '끝 진행 뒤에도 끝 상태');
  ok(col('app_settings').alps_seen && col('app_settings').alps_seen['MJ-MAIN'], '도우미가 살아 있음을 alps_seen에 (2분에 한 번)');
  // ── 끝까지: 가짜 클라우드 HTTP + 도우미 원격 고리 + 가짜 ALPS
  if (process.argv[3]) { console.log('■ 휴대폰 → 클라우드 → MJ-MAIN 도우미 → 가짜 ALPS 끝까지');
    const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnalpsR_')); Object.assign(process.env, { RN_ALPS_HOME: HOME, RN_ALPS_TEST: '1', RN_ALPS_NOSANDBOX: '1', RN_ALPS_QUIET: '1', RN_ALPS_NOREMOTE: '1' });
    const A = require(process.argv[3]); const K = await A.keyInfo(); ok(!fs.readFileSync(path.join(HOME, 'key.dat'), 'utf8').includes('PRIVATE KEY'), '개인 열쇠 파일은 잠겨 있음(평문 PEM 아님)');
    col('app_settings').alps_helpers.pcs[K.pc] = { pub: K.pub, at: nowIso() }; const api3 = new Function('C', 'db', 'FV', 'nowIso', 'require', src.slice(a, b) + '\nreturn { alpsHelperApi, alpsRaw };')(C, db, FV, nowIso, require);
    const srv = http.createServer(async (req, res) => { const raw = await api3.alpsRaw(req, 2e6); const [code, o] = await api3.alpsHelperApi(raw, req.headers['x-rn-sig']); res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }).listen(8779);
    A.link({ cloudUrl: 'http://127.0.0.1:8779' }); let bad = false; try { A.link({ cloudUrl: 'https://evil.example.com' }); } catch (e) { bad = true; } ok(bad, 'Cloud Run 아닌 주소는 연결 거절'); A.link({ cloudUrl: 'http://127.0.0.1:8779' });
    A.setCfg({ baseUrl: 'http://127.0.0.1:8771/', chromePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', printer: 'TEST-롯데택배', headless: true, stepTimeoutSec: 20, uploadTimeoutSec: 30, printTimeoutSec: 30 }); await A.saveCred('testid', 'test-pw!');
    const mine = [{ name: '가나다', title: '시험 책 하나', sku: 'PNKLUX' }, { name: '라마바', title: '시험 책 둘', sku: 'BLKAAA' }];
    await fetch('http://127.0.0.1:8771/fake/seed', { method: 'POST', body: JSON.stringify({ seed: mine, rows: [], otp: true }) });
    const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
    col('shp_cmds').remJob01 = { type: 'alpsRun', status: 'alpsQueued', dev: K.pc, fileName: `판매완료${today}.xlsx`, b64: Buffer.from('PK 가짜').toString('base64'), rows: mine, firstOne: false, createdAt: nowIso(), by: 'phone' };
    const t0 = Date.now(); let seq = 0, sawOtp = false; for (;;) { await A.remoteTick(); const d = col('shp_cmds').remJob01; if (d.run && d.run.need && d.run.need.type === 'otp' && !d.answer) { sawOtp = true; d.answer = { seq: ++seq, kind: 'otp', code: '123456', at: nowIso() }; } /* 휴대폰 웹앱이 넣는 것처럼 */
      if (d.status === 'done' || d.status === 'fail' || Date.now() - t0 > 120000) break; await new Promise((r) => setTimeout(r, 800)); }
    const d = col('shp_cmds').remJob01; ok(d.status === 'done', '휴대폰이 맡긴 일이 끝남 ' + (d.run && d.run.error || '')); ok(sawOtp, 'OTP를 문서로 묻고, 휴대폰이 넣은 번호로 이어 감');
    const out = col('shp_cmd_out').remJob01; ok(out && JSON.parse(out.aoa).length === 3 && JSON.parse(out.aoa)[0][0] === '운송장번호', '운송장 목록 2줄이 shp_cmd_out에');
    const st = await fetch('http://127.0.0.1:8771/fake/state').then((r) => r.json()); ok(st.uploads.length === 1 && st.prints.length === 1 && st.prints[0].printer === 'TEST-롯데택배', '가짜 ALPS: 접수 1번 · 인쇄 1번 · 설정 프린터');
    srv.close(); fs.rmSync(HOME, { recursive: true, force: true }); }
  console.log(fails ? `✗ ${fails}개 실패` : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
