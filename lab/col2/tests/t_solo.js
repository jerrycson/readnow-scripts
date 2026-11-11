/* t_solo — (11/12 col2solo1 · 정범님 11/12 0시 '웹앱 열림이나 (운영) 수집기 없이 번외가 돌게') 🔌 홀로 연결
 *  ① 웹앱·운영 수집기 없이 — 진짜 번외 도우미 + 가짜 클라우드(진짜 cloud/col2solo.js · 가짜 Firestore)만으로:
 *     등록 전 '등록 필요' · 개인 열쇠는 잠금 파일에만(평문 없음) · 등록 뒤 켜짐 · 상태(col2_ctl) · 결과(col2_runs) · 옆 창 설정 → 공통 문서 · 공통 문서 → 이 PC
 *     · 넘김 상태 받기 · 견줄 운영 값(읽기만) · 살아 있는 동안 웹앱 부탁에 같은 일을 내주지 않음 · 끊으면(off) 예전 길로
 *  ② 클라우드 거절 — 서명 위조 · 남의 PC 이름 · 같은 요청 두 번 · 오래된 시각 · 홀로 연결 칸 밖 · 남의 PC 칸 · 쓴 PC 이름 바꿔치기 · 넘기지 않은 일
 *     · 로거에는 우리 도서·표본을 주지 않음(약속 0) · 🟩 네이버는 로거만(봉투 넘기기 한 번만 · 끝나면 봉투 지움 · 상태 via solo)
 * 실행: node tests/t_solo.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto'), os = require('os');
const { makeDb } = require('./fakefs-admin.js'); const { makeSolo } = require('../../../cloud/col2solo.js');
const HOF = require('../shadow/col2-handoff.js'); const SETM = require('../helper/col2-settings.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 80); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };

(async () => {
  const F = makeDb(); const API = makeSolo({ db: F.db, C: F.C, FV: F.FV, log: () => {}, mods: async () => ({ HOF, SET: SETM, X: null }) });
  let calls = 0; const srv = http.createServer((q, s) => { const ch = []; q.on('data', (c) => ch.push(c)); q.on('end', async () => { calls++; let r; try { r = q.url === '/c2/solo' ? await API.api(Buffer.concat(ch), q.headers['x-rn-sig']) : [404, { ok: false }]; } catch (e) { r = [500, { ok: false, err: e.message }]; } s.writeHead(r[0], { 'Content-Type': 'application/json' }); s.end(JSON.stringify(r[1])); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2t_')); L.track(D); fs.mkdirSync(D + '/bin', { recursive: true });
  fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const PC = 'MJ-TEST';
  const H = await L.startHelper({ dir: D, cfg: { on: false, y24: false, al: false, auto: false, side: false, headless: true, pc: PC, pcSrc: 'pc', solo: { tickSec: 0.3 } }, env: { RN_COL2_SOLO_URL: base, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  try {
    /* ① 등록 전 */
    const st0 = await until(async () => { const r = await H.api('GET', '/solo/st'); return r.j && r.j.ok && r.j.pub ? r.j : null; });
    ok(st0 && /BEGIN PUBLIC KEY/.test(st0.pub) && /^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/.test(st0.fp || '') && st0.pc === PC, '① 번외가 서명 열쇠를 만들고 공개 열쇠·지문만 보여 줌', st0 && { fp: st0.fp, pc: st0.pc });
    const kf = fs.readFileSync(D + '/home/solo/key.json', 'utf8'); ok(!/PRIVATE KEY/.test(kf) && JSON.parse(kf).how === 'test', '① 개인 열쇠는 잠금 파일에만(평문 PEM 없음)');
    const need = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.solo && r.j.solo.reg === 'need' ? r.j.solo : null; });
    ok(need && !need.live && /등록되지 않음/.test(need.err), "① 등록 전엔 클라우드가 거절 → '등록 필요'", need);
    ok(!F.store.col2_ctl, '① 등록 전엔 아무것도 쓰지 않음');
    /* 등록(웹앱 ⚙ 🔐 이 기기 등록이 하는 일 — 공개 열쇠만) */
    await F.C('app_settings').doc('col2_solo').set({ pcs: { [PC]: { pub: st0.pub, fp: st0.fp, at: new Date().toISOString(), kind: 'office' } } }, { merge: true });
    API._M.pubAt = 0;
    const live = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.solo && r.j.solo.live ? r.j.solo : null; });
    ok(live && live.reg === 'ok', '① 등록 뒤 홀로 연결 켜짐(웹앱·수집기 없이)', live);
    const ctl = await until(() => F.store.col2_ctl && F.store.col2_ctl[PC]); ok(ctl && ctl.st && ctl.st.ver && ctl.solo && /번외 홀로/.test(ctl.by) && ctl.st.running === true, '① 상태 → col2_ctl/<이 PC>(웹앱 c2Sum과 같은 꼴)', ctl && { by: ctl.by, ver: ctl.st.ver });
    ok(F.store.app_settings.col2_solo_seen && F.store.app_settings.col2_solo_seen[PC], '① 마지막 소식(col2_solo_seen)');
    /* 결과 쓰기 */
    const put = await H.api('POST', '/relay/put', { c: 'col2_runs', id: 'solo_t1', v: { a: 1, pc: 'OTHER' } });
    ok(put.j && put.j.ok, '① 결과를 맡김(/relay/put)');
    const run = await until(() => F.store.col2_runs && F.store.col2_runs.solo_t1); ok(run && run.a === 1 && run.pc === PC, '① 결과가 웹앱 없이 col2_runs에 · 쓴 PC 이름은 서명한 PC로', run);
    const outN = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.relay && r.j.relay.outN === 0 ? 1 : null; }); ok(outN, '① 기록된 결과는 맡긴 줄에서 빠짐');
    /* 설정 — 옆 창에서 바꿈 → 공통 문서 */
    const sr = await H.api('POST', '/set', { k: 'pace.dayCap', v: 1234 }); ok(sr.j && sr.j.ok, '① 옆 창에서 공통 설정 바꿈', sr.j);
    const cfg = await until(() => F.store.app_settings.col2_cfg && F.store.app_settings.col2_cfg.v && F.store.app_settings.col2_cfg.v['pace.dayCap'] === 1234 ? F.store.app_settings.col2_cfg : null);
    ok(cfg && cfg.log && cfg.log[0] && cfg.log[0].k === 'pace.dayCap' && /홀로/.test(cfg.log[0].by), '① 공통 문서(app_settings/col2_cfg)에 올라감 · 기록 한 줄', cfg && cfg.log && cfg.log[0]);
    const pend0 = await until(async () => { const r = await H.api('GET', '/settings'); return r.j && r.j.pend === 0 ? 1 : null; }); ok(pend0, '① 올린 뒤 올릴 것 0');
    /* 공통 문서가 더 새것 → 이 PC */
    const c0 = F.store.app_settings.col2_cfg; await F.C('app_settings').doc('col2_cfg').set({ v: { ...c0.v, 'pace.hourCap': 111 }, at: (+c0.at || 0) + 1000, by: '웹앱 JS-MAIN', log: c0.log });
    const got = await until(async () => { const r = await H.api('GET', '/settings'); const row = r.j && (r.j.rows || []).find((x) => x.k === 'pace.hourCap'); return row && row.v === 111 ? row : null; });
    ok(got, '① 다른 PC가 바꾼 공통 설정을 웹앱 없이 받음', got);
    /* 견줄 운영 값(읽기만) */
    await F.C('prd_book_metrics').doc('B77').set({ bookId: 'B77', salesPoint: 5 });
    await H.api('POST', '/relay/get', { c: 'prd_book_metrics', id: 'B77' });
    const have = await until(async () => { const r = await H.api('POST', '/relay/get', { c: 'prd_book_metrics', id: 'B77' }); return r.j && r.j.have ? r.j : null; });
    ok(have && have.v && have.v.salesPoint === 5, '① 견줄 운영 값을 웹앱 없이 받음(읽기만)', have);
    /* 넘김 상태 */
    await F.C('app_settings').doc('col2_handoff').set({ jobs: { kpipa: { on: true, pc: PC, at: new Date().toISOString(), by: '시험' } } });
    await wait(1200);
    /* 살아 있는 동안 웹앱 부탁에 같은 일을 내주지 않음 */
    await H.api('POST', '/relay/put', { c: 'col2_runs', id: 'solo_t2', v: { b: 2 } });
    const pd = await H.api('GET', '/relay/pending?by=' + encodeURIComponent('웹앱 시험') + '&v=1&u=1');
    ok(pd.j && pd.j.solo && pd.j.solo.live && Array.isArray(pd.j.out) && pd.j.out.length === 0 && !pd.j.setPend && !pd.j.pub && !pd.j.solo.pub, '① 홀로 연결이 살아 있으면 웹앱에 결과·설정을 내주지 않음(한 길로만)', pd.j && { out: pd.j.out.length, solo: pd.j.solo });
    ok(await until(() => F.store.col2_runs.solo_t2), '① 그 결과는 홀로 연결로 기록됨');
    const nvst = await H.api('GET', '/nv/st'); ok(nvst.j && nvst.j.solo && nvst.j.solo.live === true, '① /nv/st에 홀로 연결 표시(웹앱 네이버 대신 쓰기가 비킴)');
    /* 끊기(off) → 예전 길 */
    await F.C('app_settings').doc('col2_solo').set({ pcs: { [PC]: { off: true } } }, { merge: true }); API._M.pubAt = 0;
    const offS = await until(async () => { const r = await H.api('GET', '/status'); return r.j && r.j.solo && r.j.solo.reg === 'off' && !r.j.solo.live ? r.j.solo : null; });
    ok(offS, '① 관리자가 끊으면 꺼짐', offS);
    await H.api('POST', '/relay/put', { c: 'col2_runs', id: 'solo_t3', v: { c: 3 } });
    const pd2 = await H.api('GET', '/relay/pending?by=' + encodeURIComponent('웹앱 시험') + '&v=1&u=1');
    ok(pd2.j && pd2.j.out.some((x) => x.id === 'solo_t3') && pd2.j.solo && !pd2.j.solo.live, '① 끊기면 저절로 예전 길(웹앱 대신 쓰기)로 내줌', pd2.j && pd2.j.out.map((x) => x.id));
    await wait(800); ok(!F.store.col2_runs.solo_t3, '① 끊긴 뒤엔 클라우드에 쓰지 않음');
  } finally { await H.stop(); }

  /* ② 클라우드 거절 — 시험이 직접 서명한 요청 */
  const kp = (() => { const k = crypto.generateKeyPairSync('ed25519'); return { key: k.privateKey, pub: k.publicKey.export({ type: 'spki', format: 'pem' }) }; })(); const kOther = crypto.generateKeyPairSync('ed25519');
  await F.C('app_settings').doc('col2_solo').set({ pcs: { 'PC-A': { pub: kp.pub }, 'PC-B': { pub: kOther.publicKey.export({ type: 'spki', format: 'pem' }) }, 'LOGGER-T': { pub: kp.pub, kind: 'logger' } } }, { merge: true }); API._M.pubAt = 0;
  const call = async (b, key, raw0) => { const raw = raw0 || Buffer.from(JSON.stringify({ ts: Date.now(), nonce: crypto.randomBytes(8).toString('hex'), op: 'sync', ...b })); const sig = crypto.sign(null, raw, key || kp.key).toString('base64'); const r = await API.api(raw, sig); return { code: r[0], j: r[1], raw, sig }; };
  let r = await call({ pc: 'PC-A' }, kOther.privateKey); ok(r.code === 403 && r.j.reg === 'bad', '② 다른 열쇠로 서명 = 거절', r);
  r = await call({ pc: 'PC-B' }); ok(r.code === 403 && r.j.reg === 'bad', '② 남의 PC 이름으로(그 PC 열쇠 아님) = 거절', r);
  r = await call({ pc: 'PC-NONE' }); ok(r.code === 403 && r.j.reg === 'need', '② 등록 안 된 PC = 거절', r);
  r = await call({ pc: 'PC-A' }); ok(r.code === 200, '② 맞는 서명 = 받음');
  const again = await API.api(r.raw, r.sig); ok(again[0] === 403 && /다시/.test(again[1].err), '② 같은 요청 두 번 = 거절', again);
  const bad = Buffer.from(String(r.raw).replace('PC-A', 'PC-A ')); ok((await API.api(bad, r.sig))[0] >= 400, '② 몸을 바꾸면 서명이 안 맞음');
  r = await call({ pc: 'PC-A', ts: Date.now() - 10 * 60e3 }); ok(r.code === 403 && /시각/.test(r.j.err), '② 10분 전 시각 = 거절', r.j);
  r = await call({ pc: 'PC-A', out: [
    { k: 'a1', c: 'col2_ctl', id: 'PC-B', v: { x: 1 } }, { k: 'a2', c: 'col2_jday', id: '2026-11-12_PC-B', v: { d: 1 } }, { k: 'a3', c: 'col2_jday', id: '2026-11-12_PC-A', v: { d: 1, pc: 'PC-B' } },
    { k: 'a4', c: 'col2_voice_run', id: 'PC-B', v: {} }, { k: 'a5', c: 'prd_books', id: 'B1', v: { title: 'x' } }, { k: 'a6', c: 'col2_al', id: 'day_2026-11-12_PC-B', v: {} }, { k: 'a7', c: 'col2_naver', id: 'state', v: {} },
    { k: 'a8', op: true, job: 'kpipa', c: 'mkt_kpipa', id: '20261110', v: { date: '2026-11-10', onOff: { a: 1 } } }] });
  const E = r.j.ack || {}; ok(r.code === 200 && E.keys.length === 1 && E.keys[0] === 'a3' && ['a1', 'a2', 'a4', 'a5', 'a6', 'a7', 'a8'].every((k) => E.errs[k]), '② 홀로 연결 칸 밖·남의 PC 칸·넘기지 않은 일은 거절 · 자기 칸만 씀', E);
  ok(F.store.col2_jday['2026-11-12_PC-A'].pc === 'PC-A' && !(F.store.col2_ctl || {})['PC-B'] && !(F.store.prd_books || {}).B1 && !(F.store.mkt_kpipa || {})['20261110'], '② 쓴 PC 이름 바꿔치기 막음 · 운영 칸·남의 칸 그대로');
  /* 넘긴 일(그 PC로 넘김) — 넘김 표 칸만 · 쓴 이 '번외 <PC>' */
  await F.C('app_settings').doc('col2_handoff').set({ jobs: { kpipa: { on: true, pc: 'PC-A', at: new Date().toISOString() } } });
  r = await call({ pc: 'PC-A', out: [{ k: 'b1', op: true, job: 'kpipa', c: 'mkt_kpipa', id: '20261110', v: { date: '2026-11-10', onOff: { a: 1 }, secret: 'x' }, hist: { at: 'h', type: 'onOff', old: null } }, { k: 'b2', op: true, job: 'kpipa', c: 'mkt_kpipa', id: 'x/1', v: { date: 1 } }], handBeat: { kpipa: Date.now() } });
  const kp1 = F.store.mkt_kpipa && F.store.mkt_kpipa['20261110']; ok(r.j.ack.keys.includes('b1') && r.j.ack.errs.b2 && kp1 && kp1.writer === '번외 PC-A' && !kp1.secret && kp1.history.length === 1, '② 그 PC로 넘긴 일만 운영 칸에(정한 칸만 · 쓴 이 번외 PC)', { ack: r.j.ack, kp1 });
  ok(F.store.app_settings.col2_handoff.jobs.kpipa.beat && F.store.app_settings.col2_handoff.jobs.kpipa.on === true, '② 넘김 맥박(beat)을 적음 · 다른 칸은 그대로');
  r = await call({ pc: 'PC-B', out: [{ k: 'c1', op: true, job: 'kpipa', c: 'mkt_kpipa', id: '20261111', v: { date: '2026-11-11' } }] }, kOther.privateKey); ok(r.j.ack.errs.c1 && !F.store.mkt_kpipa['20261111'], '② 다른 PC로 넘긴 일은 거절', r.j.ack);
  /* 설정 표 밖 · 이 PC만 값 */
  r = await call({ pc: 'PC-A', setPend: { 'pace.dayCap': { v: 99999999, at: Date.now() }, 'nope.x': { v: 1, at: Date.now() }, 'y24': { v: true, at: Date.now() } } });
  ok(F.store.app_settings.col2_cfg.v['pace.dayCap'] === 1234 && !('nope.x' in F.store.app_settings.col2_cfg.v) && !('y24' in F.store.app_settings.col2_cfg.v), '② 범위 밖·모르는 설정·이 PC만 값은 공통 문서에 안 씀', F.store.app_settings.col2_cfg.v);
  /* 로거 — 우리 도서·표본 안 줌 · 벤치 문서만 */
  await F.C('prd_books').doc('B9').set({ title: '우리 책', aladinItemId: '9' }); await F.C('app_settings').doc('bench').set({ targets: [{ sc: '123', on: true, memo: 'x' }] });
  r = await call({ pc: 'LOGGER-T', kind: 'logger', want: [{ c: 'prd_books', id: 'B9' }, { c: 'app_settings', id: 'bench' }, { c: 'prd_book_metrics', id: 'B77' }, { c: 'prd_listings', id: 'aladin_1' }, { c: 'app_settings', id: 'main' }], pool: 1000, poolAfter: null });
  const ids = (r.j.docs || []).map((d) => d.c + '/' + d.id); ok(ids.join(',') === 'app_settings/bench,prd_book_metrics/B77' && !r.j.pool && r.j.docs[0].v.targets[0].memo === undefined, '② 로거에는 우리 도서·표본·손님 칸을 주지 않음(약속 0)', { ids, pool: !!r.j.pool });
  r = await call({ pc: 'PC-A', want: [{ c: 'prd_books', id: 'B9' }, { c: 'app_settings', id: 'bench' }, { c: 'crm_interactions', id: 'aladin_qna_1' }], fields: ['title', 'aladinItemId'], pool: 1000, poolAfter: null });
  ok((r.j.docs || []).map((d) => d.c).join(',') === 'prd_books' && Array.isArray(r.j.pool) && r.j.pool.some((b) => b.id === 'B9'), '② 사무실 PC — 도서는 견줄 칸만 · 벤치(로거 일)·손님 칸은 안 줌 · 표본 이어 넘김', r.j.docs);
  /* 🟩 네이버 — 로거만 */
  await F.C('col2_naver_cmd').doc('c1').set({ k: 'cred', env: { alg: 'RSA-OAEP-256+A256GCM', ct: 'x' }, st: 'new', at: '2026-11-12T00:00:00Z', by: '웹앱' });
  r = await call({ pc: 'PC-A', nv: { st: { on: true, net: {}, pub: 'P1' }, take: 3 } }); ok((r.j.errs || []).some((e) => /로거/.test(e)) && !r.j.nvCmds && F.store.col2_naver_cmd.c1.st === 'new', '② 네이버 일은 로거 PC만');
  r = await call({ pc: 'LOGGER-T', kind: 'logger', nv: { st: { on: true, pub: 'P1' }, take: 3, ver: '0.1.0' } }); ok(!r.j.nvCmds && /와이파이/.test(F.store.col2_naver.state.off || ''), '② 와이파이 문이 없는 옛 번외엔 봉투를 넘기지 않음');
  r = await call({ pc: 'LOGGER-T', kind: 'logger', nv: { st: { on: true, net: { ok: true }, pub: 'P1', cred: { has: false } }, take: 3, ver: '0.1.26', feed: [{ k: 'f1', c: 'nv_listings', id: '123', v: { n: 1 } }, { k: 'f2', c: 'prd_books', id: 'B9', v: { title: 'x' } }] } });
  ok(r.j.nvCmds && r.j.nvCmds.length === 1 && r.j.nvCmds[0].env.ct === 'x' && F.store.col2_naver_cmd.c1.st === 'took' && F.store.col2_naver.pub.spki === 'P1' && F.store.col2_naver.state.via === 'solo' && !F.store.col2_naver.state.off, '② 로거 — 받는 열쇠·상태(via solo)·봉투 붙잡기', { cmds: r.j.nvCmds, st: F.store.col2_naver.state });
  ok(r.j.nvAck.join() === 'f1' && F.store.nv_listings['123'].n === 1 && F.store.prd_books.B9.title === '우리 책', '② 네이버 읽은 것은 정한 칸만');
  const r2 = await call({ pc: 'LOGGER-T', kind: 'logger', nv: { st: { on: true, net: { ok: true }, pub: 'P1' }, take: 3, ver: '0.1.26' } }); ok(!r2.j.nvCmds, '② 같은 봉투를 두 번 넘기지 않음');
  r = await call({ pc: 'LOGGER-T', kind: 'logger', nv: { st: { on: true, net: { ok: true }, pub: 'P1' }, take: 0, ver: '0.1.26', done: [{ id: 'c1', res: { ok: true, saved: true, secret: 'zz' } }] } });
  const c1 = F.store.col2_naver_cmd.c1; ok(c1.st === 'done' && !c1.env && c1.res.ok === true && !('secret' in c1.res), '② 끝나면 결과만 남기고 봉투(암호문)는 지움', c1);
  srv.close(); L.done('t_solo');
})().catch((e) => { console.error(e); process.exit(1); });
