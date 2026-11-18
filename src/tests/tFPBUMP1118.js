// tFPBUMP1118 — (11/18 일꾼 fpbump1 · 정범님 노트 b_mwllenfmptaj1 [5] 「앞 페이지 올리기는 정범님 손을 거치지 않는다 — 가장 오래된 10개를 리드가 골라 진행」)
//  ① 클라우드 /kp-in fbReq → app_settings/front_bump_req(MJ-MAIN·LOGGER 거절 · 진행 중이면 새 부탁 거절 · 앞 부탁은 prd_bump_reqs에 옮김) + 끌올 새 번호에 처음 등록일 따로 적기(fbOrigSync)
//  ② 웹앱 fbReqTick — 후보 표(가장 오래된 순 · 실험·가격 기록·수동 일괄·잠금 뺌) → 한 번에 하나 fbQueue(onlyPc) → 끝나면 새 번호 판매중·가격·수량 대조 · 어긋나면 멈춤 · 첫 하나 뒤 hold
//  ③ 명령 받을 PC 지킴(fbrPcWhy) — 박동·쉼·등록 꺼짐·역할·출고 중 · 지우기·다시 등록 명령에 onlyPc·pcNo
//  ④ 수집기 pcCanBase — onlyPc가 다르면 받지 않음 · 멈춘 삭제 매듭·다시 찾기도 그 PC만
// 실행: node src/tests/tFPBUMP1118.js (네트워크 없음 · 시험 자료는 모두 지어낸 값)
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
const APP = fs.readFileSync(path.join(R, 'src/app.html'), 'utf8'); const COL = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8'); const CL = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌ ' + m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓ ' + m); };
const cut = (S0, a0, b0) => { const a = S0.indexOf(a0); const b = S0.indexOf(b0, a + 1); return a >= 0 && b > a ? S0.slice(a, b) : ''; };

/* ── 가짜 Firestore ── */
function mkDb(init) { const st = new Map(Object.entries(init || {}).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))])); const AU = (x) => ({ __au: x });
  const merge = (o, v) => { const r = { ...(o || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) r[k] = [...(Array.isArray(r[k]) ? r[k] : []), ...x.__au]; else r[k] = x; } return r; };
  const snap = (p) => ({ id: p.split('/').pop(), exists: st.has(p), data: () => (st.has(p) ? JSON.parse(JSON.stringify(st.get(p))) : undefined), ref: { path: p } });
  const docRef = (p) => ({ id: p.split('/').pop(), path: p, get: async () => snap(p), set: async (v, o) => { st.set(p, o && o.merge ? merge(st.get(p), v) : merge({}, v)); } });
  const coll = (c) => { const q = (fl, lim) => ({ where: (f, op, v) => q([...fl, [f, v]], lim), limit: (n) => q(fl, n), get: async () => { const docs = [...st.keys()].filter((k) => k.startsWith(c + '/') && k.split('/').length === 2).map(snap).filter((d) => fl.every(([f, v]) => (d.data() || {})[f] === v)).slice(0, lim || 1e9); return { docs, empty: !docs.length, size: docs.length, forEach: (fn) => docs.forEach(fn) }; } });
    return { doc: (id) => docRef(c + '/' + (id || 'auto' + Math.random().toString(36).slice(2, 8))), ...q([], 0) }; };
  const db = { collection: coll, runTransaction: async (fn) => { const W = []; const tx = { get: async (r) => snap(r.path), set: (r, v, o) => W.push([r, v, o]) }; const out = await fn(tx); for (const [r, v, o] of W) await r.set(v, o); return out; } };
  return { db, st, AU }; }

/* ── ① 클라우드 ── */
console.log('① 클라우드 fbReqIn · fbOrigSync');
{ const blk = cut(CL, 'const FBR_BAD_PC', '\nasync function fsDelProtOn('); ok(blk.length > 500, '클라우드 부탁 블록 있음');
  ok(/const rfb = J0\.fbReq \? await fbReqIn\(J0\.fbReq/.test(CL) && /fbReq: rfb/.test(CL), '/kp-in이 fbReq를 받고 결과를 돌려줌');
  ok(/fbOrigSync\(\)\.catch/.test(CL), 'tick에서 처음 등록일 옮겨 적기(기다리지 않음)');
  const M = mkDb({ 'prd_relinks/U2': { kind: 'bump', toKey: 'aladin_U2', fromKey: 'aladin_U1', first: '2024-01-02T00:00:00Z', firstSeen: '2024-01-03T00:00:00Z', root: 'aladin_U1' }, 'prd_relinks/U3': { kind: 'bump', toKey: 'aladin_U3', first: '2024-02-01' }, 'prd_relinks/U4': { kind: 'bump', toKey: 'aladin_U4', first: 'x', rejected: true }, 'prd_listings/aladin_U2': { registeredAt: '2026-11-18T00:00:00Z', firstSeenAt: '2026-11-18T00:00:00Z' } });
  const C = (c) => { const r = M.db.collection(c); const w = r.where; r.where = (f, op, v) => w(f, op, v); return r; };
  const ctx = { C, FV: { arrayUnion: (...x) => M.AU(x) }, nowIso: () => '2026-11-18T07:00:00Z', log: () => {}, Date, Math, String, JSON, Object, Array };
  vm.createContext(ctx); vm.runInContext(blk.replace('let fbOrigAt', 'var fbOrigAt').replace(/^const FBR_BAD_PC/m, 'var FBR_BAD_PC') + '\nthis.fbReqIn = fbReqIn; this.fbOrigSync = fbOrigSync;', ctx);
  (async () => {
    const r0 = await ctx.fbReqIn({ n: 10, pick: 'oldest', one: 1, pc: 'mj-main' }, 'lead'); ok(r0.err && /MJ-MAIN/.test(r0.err), 'MJ-MAIN은 거절', r0);
    const r1 = await ctx.fbReqIn({ n: 10, pick: 'oldest', one: 1, pc: 'LOGGER' }, 'lead'); ok(!!r1.err, 'LOGGER는 거절', r1);
    const r2 = await ctx.fbReqIn({ n: 99, pick: 'oldest', one: 1, pc: 'js-main' }, 'lead'); const d2 = M.st.get('app_settings/front_bump_req'); ok(r2.st === 'req' && d2.n === 10 && d2.pc === 'JS-MAIN' && d2.one === true && d2.crit.noPhoto && d2.crit.ab === false && d2.crit.auto === false, '새 부탁 — 10개까지 · PC 대문자 · 사진 없음 · A/B·자동 끔', d2);
    const r3 = await ctx.fbReqIn({ n: 5, pc: 'HOME' }, 'lead'); ok(r3.err && /진행 중/.test(r3.err), '진행 중이면 새 부탁 거절', r3);
    const r4 = await ctx.fbReqIn({ go: 1 }, 'lead'); ok(!!r4.err, 'hold가 아니면 이어 감 거절', r4);
    M.st.set('app_settings/front_bump_req', { ...M.st.get('app_settings/front_bump_req'), st: 'hold' }); const r5 = await ctx.fbReqIn({ go: 1 }, 'lead'); ok(r5.st === 'run' && M.st.get('app_settings/front_bump_req').st === 'run', 'hold → 이어 감');
    const r6 = await ctx.fbReqIn({ stop: 1, why: '시험' }, 'lead'); ok(r6.st === 'stop' && M.st.get('app_settings/front_bump_req').stopWhy === '시험', '멈춤');
    const id0 = M.st.get('app_settings/front_bump_req').id; const r7 = await ctx.fbReqIn({ n: 3, pc: 'HOME', one: 0 }, 'lead'); ok(r7.st === 'req' && M.st.has('prd_bump_reqs/' + id0) && M.st.get('app_settings/front_bump_req').one === false, '멈춘 뒤 새 부탁 — 앞 부탁은 prd_bump_reqs에 옮김(지우지 않음)');
    const s = await ctx.fbOrigSync(true); const L2 = M.st.get('prd_listings/aladin_U2'); ok(s.put === 1 && s.wait === 1 && L2.origRegAt === '2024-01-02T00:00:00Z' && L2.origFirstSeenAt === '2024-01-03T00:00:00Z' && L2.registeredAt === '2026-11-18T00:00:00Z' && L2.firstSeenAt === '2026-11-18T00:00:00Z', '처음 등록일은 새 칸에만 · 알라딘 칸 그대로 · 문서 없는 것은 만들지 않음 · 거절된 고리 뺌', { s, L2 });
    ok(!M.st.has('prd_listings/aladin_U3'), '새 번호 문서가 없으면 만들지 않음'); const s2 = await ctx.fbOrigSync(true); ok(s2.put === 0 && s2.same === 1, '같은 값이면 다시 쓰지 않음', s2);
    await web(); })().catch((e) => { bad++; console.log('  ❌ 예외', e && e.stack); fin(); }); }

/* ── ②③ 웹앱 ── */
async function web() { console.log('② 웹앱 fbReqTick · ③ 명령 받을 PC');
  const blk = cut(APP, 'const FBR_BAD = ', 'function fbGateNow(Q, C) {'); ok(blk.length > 3000, '웹앱 부탁 블록 있음');
  ok(/\/\* \(fpbump1\) 🤖 리드 부탁\(한 번에 하나\) \*\/ await fbReqTick\(\)/.test(APP), 'fbTick 끝에서 fbReqTick');
  ok(/tx\.set\(ref, \{ \.\.\.fbPinOf\(ok\), type: 'regDel'/.test(APP) && /tx\.set\(ref, \{ \.\.\.fbPinOf\(ok\), type: 'regBulk'/.test(APP) && /tx\.set\(cref, \{ \.\.\.fbPinOf\(\[j\]\), type: 'regOne'/.test(APP), '지우기·대량·개별 다시 등록 명령에 onlyPc·pcNo');
  ok(/let Q = fbPinSplit\(await fbDelGate\(Q1, set, end\)\)\[0\] \|\| \[\];/.test(APP) && /await fbrPcWhy\(Q\[0\]\.onlyPc\)/.test(APP), '지우기 전에 명령 받을 PC가 받을 수 있는지 봄(못 받으면 기다림)');
  ok(/for \(const G of fbPinSplit\(gB\)\) await fbRegQueue\(G\);/.test(APP), '다시 등록도 PC별 묶음');
  ok(/const C = \{ \.\.\.fbCfg\(\), \.\.\.\(meta\.cfg \|\| \{\}\) \};/.test(APP) && /\.\.\.\(meta\.req \? \{ req: meta\.req, reqI: meta\.reqI, onlyPc: meta\.onlyPc \|\| null \} : \{\}\)/.test(APP) && /return \{ n, skip, nc, ab: gid, ids \};/.test(APP), 'fbQueue — 기준 덮어쓰기 · 일 장부에 부탁 번호·PC · 만든 일 번호 돌려줌');
  const NOW = Date.now(); const beat = (o) => ({ atMs: NOW - 30e3, role: 'gen', off: [], ...o });
  const L = (i, o) => ({ id: 'aladin_U' + i, usedCode: 'U' + i, listingId: String(1000 + i), title: '책' + i, price: 5000 + i, qty: 1, active: true, status: '판매중', registeredAt: '2025-0' + (1 + (i % 9)) + '-01T00:00:00Z', isbn13: '9780000000000', ...(o || {}) });
  const LS = [L(1), L(2), L(3), L(4), L(5), L(6), L(7), L(8)];
  const M = mkDb({ 'prd_jobs/pcBeat': { pcs: { 'JS-MAIN': beat(), 'MJ-MAIN': beat({ role: 'reg' }), LOGGER: beat({ role: 'pub', pubOnly: true }), HOME: beat({ atMs: NOW - 10 * 60e3 }), KIDS: beat({ paused: true }), PC9: beat({ off: ['reg'] }), PCS: beat() } }, 'shp_runs/_guard': { holds: { a: { pc: 'PCS', why: '오늘 출고', t0: NOW - 60e3, beat: NOW - 30e3, end: null }, b: { pc: 'JS-MAIN', why: '끝난 출고', t0: NOW - 3600e3, end: NOW - 1000 } } },
    'px_exp_groups/g1': { lids: ['1002'] }, 'px_exp/1003': { on: true }, 'prd_price_decisions/aladin_U4': { v: 1 }, 'prd_price_actions/a1': { key: 'aladin_U5' }, 'prd_price_batches/b1': { picks: { aladin_U6: 1 } }, 'prd_price_batches/b2': { archived: true, picks: { aladin_U7: 1 } } });
  const Q = []; const S = { plist: new Map(LS.map((l) => [l.id, l])), prodLoaded: true, fb: { jobs: new Map() } };
  const ctx = { S, db: M.db, firebase: { firestore: { FieldValue: { arrayUnion: (...x) => M.AU(x) } } }, deviceName: () => 'JS-MAIN', errKo: (e) => String(e && e.message), console, Date, Math, String, JSON, Object, Array, Promise, Set, Map, Number,
    fbCfg: () => ({ minAgeD: 30, maxQty: 1, reBumpD: 60, noPhoto: false }), fbX: (l) => ({ age: 300 }), plkOnL: (l) => l.id === 'aladin_U8',
    fbPool: (C) => ({ L: [...S.plist.values()].filter((l) => l.status === '판매중').map((l) => ({ l, x: { age: 300 } })), why: { '사진 붙음': 2 }, C }),
    fbQueue: async (rows, meta) => { Q.push({ rows, meta }); const id = 'job' + Q.length; const l = rows[0].l; await M.db.collection('prd_bump').doc(id).set({ key: l.id, price: Math.round(+l.price), qty: 1, state: 'queued', open: true, req: meta.req, reqI: meta.reqI, onlyPc: meta.onlyPc, at: new Date().toISOString() }); return { n: 1, skip: [], ids: [id] }; } };
  vm.createContext(ctx); vm.runInContext(blk.replace(/^const (FBR_BAD|fbrRef|fbrUp) = /gm, 'var $1 = ') + '\nObject.assign(this, { fbPinOf, fbPinSplit, fbrPcWhy, fbrManual, fbrPick, fbReqTick });', ctx);
  // ③ PC 지킴
  ok((await ctx.fbrPcWhy('js-main')) === null, 'JS-MAIN(살아 있음·끝난 출고) — 받음');
  const W = {}; for (const p of ['MJ-MAIN', 'LOGGER', 'HOME', 'KIDS', 'PC9', 'PCS', 'NOPE', '']) W[p] = await ctx.fbrPcWhy(p); ok(Object.values(W).every(Boolean) && /출고 중/.test(W.PCS) && /박동/.test(W.HOME) && /쉬는/.test(W.KIDS) && /등록 기능/.test(W.PC9), 'MJ-MAIN·LOGGER·박동 끊김·쉼·등록 꺼짐·출고 중·없는 PC — 모두 안 받음', W);
  const pin = ctx.fbPinOf([{ onlyPc: 'js-main' }]); ok(pin.onlyPc === 'JS-MAIN' && pin.pcNo.includes('MJ-MAIN') && pin.pcNo.includes('LOGGER') && pin.pcNo.includes('HOME') && !pin.pcNo.includes('JS-MAIN'), 'onlyPc + 옛 수집기용 pcNo(다른 PC 모두)', pin);
  ok(JSON.stringify(ctx.fbPinOf([{}])) === '{}' && ctx.fbPinSplit([{ id: 1 }, { id: 2, onlyPc: 'A' }, { id: 3 }]).length === 2, '부탁 아닌 일은 그대로(pin 없음) · PC별로 나눔');
  // ② 후보
  const P = await ctx.fbrPick(3); const ks = P.rows.map((r) => r.key); ok(!ks.includes('aladin_U2') && !ks.includes('aladin_U3') && !ks.includes('aladin_U4') && !ks.includes('aladin_U5') && !ks.includes('aladin_U6') && !ks.includes('aladin_U8') && ks.includes('aladin_U7'), '실험 그룹·실험 기록·가격 판정·가격 바꿈·수동 일괄·잠금 뺌 · 보관된 일괄 그룹은 뺌 대상 아님', { ks, why: P.why });
  ok(ks.join() === ['aladin_U1', 'aladin_U7'].join(), '가장 오래된 순(등록일)', ks);
  // 부탁 흐름
  await M.db.collection('app_settings').doc('front_bump_req').set({ id: 'fbr_t', st: 'req', n: 2, one: true, pc: 'JS-MAIN', rows: null, idx: 0, cur: null, done: [] });
  await ctx.fbReqTick(); let D = M.st.get('app_settings/front_bump_req'); ok(D.st === 'run' && D.rows.length === 2 && D.rows[0].key === 'aladin_U1', '후보 표 적고 run', D);
  await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(Q.length === 1 && Q[0].meta.onlyPc === 'JS-MAIN' && Q[0].meta.ab === false && Q[0].meta.auto === false && Q[0].meta.cfg.noPhoto && D.cur && D.cur.job === 'job1', '하나만 맡김(A/B 끔·자동 아님·onlyPc)', { Q: Q.map((q) => q.meta), cur: D.cur });
  await ctx.fbReqTick(); ok(Q.length === 1, '앞 일이 열려 있으면 다음을 맡기지 않음');
  // 끝났는데 가격이 다르면 멈춤
  const jd = (o) => M.db.collection('prd_bump').doc('job1').set({ state: 'done', open: false, newKey: 'aladin_N1', doneAt: new Date(NOW - 3600e3).toISOString(), ...o }, { merge: true });
  await jd({}); await M.db.collection('prd_relinks').doc('N1').set({ kind: 'bump', first: '2025-01-01T00:00:00Z', firstSeen: '2025-01-02T00:00:00Z' });
  await M.db.collection('prd_listings').doc('aladin_N1').set({ status: '판매중', price: 5002, qty: 1, listingId: '9001' });
  const snapD = JSON.stringify(M.st.get('app_settings/front_bump_req')); await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(D.st === 'stop' && /가격/.test(D.why) && D.rows[0].st === 'bad', '다시 등록 뒤 가격이 다르면 그 자리에서 멈춤', D.why);
  ok(M.st.has('prd_bump/job1') && M.st.has('prd_relinks/N1'), '지운 상품 기록(일 장부·고리)은 그대로');
  // 맞으면 hold
  M.st.set('app_settings/front_bump_req', JSON.parse(snapD)); await M.db.collection('prd_listings').doc('aladin_N1').set({ status: '판매중', price: 5001, qty: 1, listingId: '9001' });
  await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(D.st === 'hold' && D.done.length === 1 && D.done[0].old === '1001' && D.done[0].new === '9001' && D.done[0].chk.first && D.cur === null && D.idx === 1, '맞으면 끝 표에 옛→새 번호 · 첫 하나 뒤 hold', D);
  await ctx.fbReqTick(); ok(Q.length === 1, 'hold 동안은 맡기지 않음');
  // 이어 감 — PC가 출고 중이면 기다림
  M.st.set('app_settings/front_bump_req', { ...M.st.get('app_settings/front_bump_req'), st: 'run', pc: 'PCS' }); await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(Q.length === 1 && /출고 중/.test(D.wait || ''), '명령 받을 PC가 출고 중이면 기다림', D.wait);
  M.st.set('app_settings/front_bump_req', { ...D, pc: 'JS-MAIN' }); await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(Q.length === 2 && Q[1].rows[0].l.id === 'aladin_U7' && D.cur.job === 'job2', '두 번째 맡김');
  // 상태 못 받음(stop 아닌 것 · need_human) → 멈춤
  await M.db.collection('prd_bump').doc('job2').set({ state: 'need_human', open: false, why: '지우려 보니 알라딘에 이미 없음' }, { merge: true }); await ctx.fbReqTick(); D = M.st.get('app_settings/front_bump_req'); ok(D.st === 'stop' && /need_human/.test(D.why), '사람 확인으로 끝난 일이면 멈춤', D.why);
  fin(); }

/* ── ④ 수집기 ── */
function fin() { console.log('④ 수집기');
  ok(/const pcCanBase = \(type, x\) => \{ if \(PUBONLY\) return false; if \(x && x\.onlyPc && !pcSame\(x\.onlyPc, PC_NAME\)\) return false;/.test(COL), 'pcCanBase — onlyPc가 다른 PC면 받지 않음');
  ok(/if \(v\.type === 'regDel'\) \{ if \(v\.onlyPc && !pcSame\(v\.onlyPc, PC_NAME\)\) continue;/.test(COL) && /v\.type !== 'regDel' \|\| \(v\.onlyPc && !pcSame\(v\.onlyPc, PC_NAME\)\)/.test(COL), '멈춘 삭제 매듭·다시 찾기도 그 PC만');
  ok(COL.indexOf('const pcSame = ') > 0 && COL.indexOf('const pcSame = ') < COL.indexOf('const pcCanBase = '), 'pcSame이 앞에 있음');
  const pcSame = (a, b) => String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase(); const f = (pc) => (x) => !(x && x.onlyPc && !pcSame(x.onlyPc, pc));
  ok(f('JS-MAIN')({ onlyPc: 'js-main' }) && !f('MJ-MAIN')({ onlyPc: 'JS-MAIN' }) && f('MJ-MAIN')({}), '같은 PC만 받음 · onlyPc 없는 일은 그대로');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0); }
