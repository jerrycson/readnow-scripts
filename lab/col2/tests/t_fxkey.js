/* t_fxkey — (fxfix1 11/19 · 정범님 I-1119-0805 '설계에서 끝내지 말고 작동까지') 💱 넘겨받은 환율의 열쇠를 웹앱 탭 없이 받기
 *  왜: 11/17 12:46Z 환율(ext.fx)을 JS-MAIN 번외로 넘긴 뒤 그 PC 웹앱 탭이 닫혀 있어 수출입은행 열쇠(웹앱이 6시간 메모리로만 건넴)가 안 옴
 *      → 정해진 시각(11:35·15:05)에 읽지 못해 소식(beat) 0 · 11/18 환율이 운영 로거 30시간 한도 뒤에야 들어옴(진단 ext_run.fx 11/19 00:48Z)
 *  ① 진짜 번외 도우미 + 가짜 클라우드(진짜 cloud/col2solo.js · 가짜 Firestore): 환율을 넘겨받은 사무실 PC는 홀로 연결로 열쇠 하나를 부탁해 메모리에만 받음
 *     · 상태에는 '있음·때'만 · 기록창·파일·상태 어디에도 값이 없음
 *  ② 클라우드: 넘김 표 그 PC가 아니면 · 로거면 · 부탁이 없으면 주지 않음 · 다른 키는 안 줌
 * 실행: node tests/t_fxkey.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto'), os = require('os');
const { makeDb } = require('./fakefs-admin.js'); const { makeSolo } = require('../../../cloud/col2solo.js');
const HOF = require('../shadow/col2-handoff.js'); const SETM = require('../helper/col2-settings.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 80); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const KEY = 'FXKEY-test-' + crypto.randomBytes(6).toString('hex'); /* 시험 값 — 진짜 열쇠 아님 */
const grepAll = (dir, s) => { const hit = []; const walk = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); let st; try { st = fs.statSync(p); } catch (e) { continue; } if (st.isDirectory()) walk(p); else if (st.size < 20e6 && fs.readFileSync(p, 'utf8').includes(s)) hit.push(p); } }; walk(dir); return hit; };

(async () => {
  const F = makeDb(); let asks = 0; const API = makeSolo({ db: F.db, C: F.C, FV: F.FV, log: () => {}, mods: async () => ({ HOF, SET: SETM, X: null }), fxKey: async () => { asks++; return KEY; } });
  const seen = []; const srv = http.createServer((q, s) => { const ch = []; q.on('data', (c) => ch.push(c)); q.on('end', async () => { let r; try { const raw = Buffer.concat(ch); try { const b = JSON.parse(raw.toString('utf8')); seen.push(!!b.fxKey); } catch (e) {} r = q.url === '/c2/solo' ? await API.api(raw, q.headers['x-rn-sig']) : [404, { ok: false }]; } catch (e) { r = [500, { ok: false, err: e.message }]; } s.writeHead(r[0], { 'Content-Type': 'application/json' }); s.end(JSON.stringify(r[1])); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2t_')); L.track(D); fs.mkdirSync(D + '/bin', { recursive: true });
  fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const PC = 'JS-FXT';
  const H = await L.startHelper({ dir: D, cfg: { on: false, y24: false, al: false, auto: false, side: false, headless: true, pc: PC, pcSrc: 'pc', solo: { tickSec: 0.3 } }, env: { RN_COL2_SOLO_URL: base, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  try {
    console.log('① 번외 — 넘겨받은 환율 열쇠를 홀로 연결로');
    const st0 = await until(async () => { const r = await H.api('GET', '/solo/st'); return r.j && r.j.ok && r.j.pub ? r.j : null; });
    await F.C('app_settings').doc('col2_solo').set({ pcs: { [PC]: { pub: st0.pub, fp: st0.fp, at: new Date().toISOString(), kind: 'office' } } }, { merge: true }); API._M.pubAt = 0;
    const live = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.solo && r.j.solo.live ? r.j : null; }); ok(live, '등록 뒤 홀로 연결 켜짐');
    await wait(1500); ok(asks === 0 && !seen.some(Boolean), '넘겨받지 않았으면 열쇠를 부탁하지 않음', { asks, seen: seen.length });
    ok(!(live.keys && live.keys.fx), '받기 전 상태에 환율 열쇠 없음', live.keys);
    await F.C('app_settings').doc('col2_handoff').set({ jobs: { 'ext.fx': { on: true, pc: PC, at: new Date().toISOString(), by: '클라우드 차례표(시험)', beat: null } } });
    const got = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.keys && r.j.keys.fx ? r.j : null; });
    ok(got && got.keys.fx.by === 'solo' && got.keys.fx.at && got.keys.want === false, '넘겨받으면 홀로 연결로 열쇠를 받아 메모리에(상태엔 있음·때만 · 더 부탁 안 함)', got && got.keys);
    ok(asks >= 1, '클라우드가 그 PC에 열쇠 하나를 줌', asks);
    const a1 = asks; await wait(2000); ok(asks === a1, '받은 뒤엔 6시간 안 다시 부탁하지 않음', { a1, asks });
    ok(!JSON.stringify(got).includes(KEY), '상태(/status)에 값이 없음');
    await H.api('GET', '/log'); await wait(300);
    const hits = grepAll(D, KEY); ok(hits.length === 0, '파일(설정·기록창·맡긴 결과·홀로 연결 파일) 어디에도 값이 없음', hits);
    const st = F.store.col2_ctl && F.store.col2_ctl[PC]; ok(st && !JSON.stringify(st).includes(KEY), '클라우드에 올린 상태(col2_ctl)에도 값이 없음');
    const lg = await H.api('GET', '/log/rows?n=200'); ok(!JSON.stringify(lg.j || {}).includes(KEY), '기록창에 값이 없음');
  } finally { await H.stop(); }

  console.log('② 클라우드 — 그 PC·사무실·부탁할 때만');
  const kp = (() => { const k = crypto.generateKeyPairSync('ed25519'); return { key: k.privateKey, pub: k.publicKey.export({ type: 'spki', format: 'pem' }) }; })();
  await F.C('app_settings').doc('col2_solo').set({ pcs: { 'PC-A': { pub: kp.pub }, 'PC-B': { pub: kp.pub }, 'LOGGER-T': { pub: kp.pub, kind: 'logger' } } }, { merge: true }); API._M.pubAt = 0;
  const call = async (b) => { const raw = Buffer.from(JSON.stringify({ ts: Date.now(), nonce: crypto.randomBytes(8).toString('hex'), op: 'sync', ...b })); const sig = crypto.sign(null, raw, kp.key).toString('base64'); const r = await API.api(raw, sig); return { code: r[0], j: r[1] }; };
  await F.C('app_settings').doc('col2_handoff').set({ jobs: { 'ext.fx': { on: true, pc: 'PC-A', at: new Date().toISOString(), by: '클라우드 차례표(시험)' } } });
  let r = await call({ pc: 'PC-A', fxKey: 1 }); ok(r.code === 200 && r.j.fxKey === KEY, '넘김 표 그 PC가 부탁하면 열쇠 하나', { code: r.code, has: !!r.j.fxKey });
  r = await call({ pc: 'PC-A' }); ok(r.code === 200 && !('fxKey' in r.j), '부탁이 없으면 주지 않음');
  r = await call({ pc: 'PC-B', fxKey: 1 }); ok(r.code === 200 && !('fxKey' in r.j), '다른 PC(넘겨받지 않음)엔 주지 않음');
  await F.C('app_settings').doc('col2_handoff').set({ jobs: { 'ext.fx': { on: true, pc: 'LOGGER-T', at: new Date().toISOString(), by: '시험' } } }, { merge: true });
  r = await call({ pc: 'LOGGER-T', kind: 'logger', fxKey: 1 }); ok(r.code === 200 && !('fxKey' in r.j), '로거 PC엔 넘김 표에 있어도 주지 않음(약속 0)');
  await F.C('app_settings').doc('col2_handoff').set({ jobs: { 'ext.fx': { on: false, pc: 'PC-A', offAt: new Date().toISOString() } } });
  r = await call({ pc: 'PC-A', fxKey: 1 }); ok(r.code === 200 && !('fxKey' in r.j), '되돌린 뒤(on:false)엔 주지 않음');
  const SRC = fs.readFileSync(path.join(__dirname, '../../../cloud/col2solo.js'), 'utf8'); ok(/res\.fxKey = v\.trim\(\)/.test(SRC) && !/res\.keys\s*=/.test(SRC), '클라우드는 그 열쇠 하나만 싣고 다른 키 묶음은 안 실음');
  const IX = fs.readFileSync(path.join(__dirname, '../../../cloud/index.js'), 'utf8'); ok(/fxKey: async \(\) => \(await extKeysC\(\)\)\.eximKey/.test(IX), '운영 클라우드는 app_secrets/ext keys.eximKey 하나만 넘김(10분 기억)');
  srv.close(); L.done('t_fxkey');
})().catch((e) => { console.error(e); process.exit(1); });
