/* tRECINH_CLOUD1119 — (일꾼 cloudlink1 · 정범님 I-1119-1247-09) 📦 재등록 상품 옛 기록 물려받기를 웹앱이 닫혀 있어도 클라우드가
 *  cloud/index.js RECINH-START~RECINH-END만 떼어 가짜 Firestore(깊은 합치기·트랜잭션·개수 세기)로 돌림
 *  ① 같은 셈: 웹앱 src/app.html recInheritPlan과 클라우드 riPlan이 같은 입력에 글자까지 같은 결과
 *  ② 판 옮김(prd_edmove 'reg') → 등록 결과 판매중 + 새 상품 판매중이면 고리(ed)·일 'linked' → 물려받기(없는 칸만) → 장부 prd_inherit ok
 *  ③ 끌올(prd_bump 'reg_wait') → 고리(bump)·매입 짝 복사 → 물려받기 · 일 상태는 웹앱 몫(그대로 reg_wait)
 *  ④ 두 번 돌려도 다시 안 씀(멱등) · 옛 문서 안 바뀜 · 되돌림·끊음·RI_FROM 전 고리는 안 함 · 마른 실행은 안 씀
 *  지어낸 값만 · 실행: node tRECINH_CLOUD1119.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const SRC = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const APP = fs.readFileSync(findUp('src/app.html'), 'utf8');
const cut = (T, s, e) => { const a = T.indexOf(s), b = T.indexOf(e, a); if (!(a >= 0 && b > a)) throw new Error('구역 없음 ' + s); return T.slice(a, b); };
/* 가짜 FieldValue·Firestore */
const FV = { serverTimestamp: () => ({ __fv: 'ts' }), increment: (n) => ({ __fv: 'inc', n }), arrayUnion: (...a) => ({ __fv: 'au', a }), delete: () => ({ __fv: 'del' }) };
const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && !v.__fv;
function apply(old, v, deep) { const o = { ...(old || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__fv) { if (x.__fv === 'ts') o[k] = 'TS'; else if (x.__fv === 'inc') o[k] = (+o[k] || 0) + x.n; else if (x.__fv === 'au') o[k] = [...(Array.isArray(o[k]) ? o[k] : []), ...x.a]; else if (x.__fv === 'del') delete o[k]; } else if (deep && isPlain(x) && isPlain(o[k])) o[k] = apply(o[k], x, true); else o[k] = isPlain(x) ? apply({}, x, true) : JSON.parse(JSON.stringify(x === undefined ? null : x)); } return o; }
function fakeDb() { const store = new Map(); const writes = [];
  const docRef = (col, id) => ({ _p: col + '/' + id, id, get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; }, set: async (v, o) => { writes.push(col + '/' + id); store.set(col + '/' + id, apply(o && o.merge ? store.get(col + '/' + id) : {}, v, !!(o && o.merge))); } });
  const colRef = (col, F, lim) => { const rows = () => [...store.entries()].filter(([k]) => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/')).filter(([, v]) => (F || []).every(([f, op, x]) => (op === '==' ? v[f] === x : op === '>=' ? v[f] != null && v[f] >= x : false))).slice(0, lim || 1e9).map(([k, v]) => ({ id: k.slice(col.length + 1), exists: true, ref: docRef(col, k.slice(col.length + 1)), data: () => JSON.parse(JSON.stringify(v)) }));
    return { doc: (id) => docRef(col, id), where: (f, op, v) => colRef(col, [...(F || []), [f, op, v]], lim), limit: (n) => colRef(col, F, n), count: () => ({ get: async () => ({ data: () => ({ count: rows().length }) }) }), get: async () => { const d = rows(); return { docs: d, size: d.length, empty: !d.length, forEach: (fn) => d.forEach(fn) }; } }; };
  const db = { getAll: async (...refs) => Promise.all(refs.map((r) => r.get())), runTransaction: async (fn) => { const tx = { get: (r) => r.get(), set: (r, v, o) => { tx._w.push([r, v, o]); }, _w: [] }; const res = await fn(tx); for (const [r, v, o] of tx._w) await r.set(v, o); return res; } };
  return { store, writes, C: (c) => colRef(c), db }; }
const shard = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const mtH = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
(async () => {
const blk = cut(SRC, '/* RECINH-START', '/* RECINH-END */');
console.log('① 같은 셈 — 웹앱 recInheritPlan ↔ 클라우드 riPlan');
const web = {}; vm.runInNewContext("const REC_DEC = ['watch', 'strat', 'chaser', 'ctrlOf', 'floor']; const REC_GF = ['added', 'held', 'trashed', 'ctrl', 'edkw', 'fewsel'];" + cut(APP, 'function recInheritPlan(R)', 'async function recInheritRun') + ';this.P = recInheritPlan;', web);
ok(/const REC_DEC = \['watch', 'strat', 'chaser', 'ctrlOf', 'floor'\]/.test(APP) && /const REC_GF = \['added', 'held', 'trashed', 'ctrl', 'edkw', 'fewsel'\]/.test(APP), '웹앱 베끼는 칸 목록이 시험이 넣은 것과 같음');
const A = fakeDb(); const logs = []; const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, RegExp, console, Promise, process, C: A.C, db: A.db, FV, shard, mtH, VER: 'T', EDL: { at: 1 }, nowIso: () => new Date().toISOString(), log: (...x) => logs.push(x.join(' ')) };
vm.runInNewContext(blk + ';Object.assign(this, { riPlan, riRun, riRead, riAssemble, riFake, recInheritTick, RI, RI_FROM });', ctx);
const cases = [ctx.riFake && null, { bad: 'x' }, { oK: 'aladin_1', nK: 'aladin_2', oUc: '1', nUc: '2', sdN: 'c3', at: 'T', dO: { watch: 1, strat: null, chaser: { a: 1 }, ctrlOf: 'g', floor: 5000, approval: 1 }, dN: { chaser: { b: 2 } }, pmO: { x: 1 }, pmN: { y: 1 }, tO: null, tN: null, sO: { s: 1 }, sN: null, grp: [{ id: 'g1', name: 'G', hit: { held: 1, start: 9000 }, nw: { start: 1 }, rec: ['decided'] }, { id: 'g2', name: 'H', hit: {}, nw: {}, rec: ['picks', 'undone'] }], n: { act: 1 } },
  { oK: 'aladin_5', nK: 'aladin_6', oUc: '5', nUc: '', sdN: 'c1', at: 'T', dO: null, dN: null, pmO: { p: 1 }, pmN: null, tO: { k: 1 }, tN: null, sO: null, sN: null, grp: [{ id: 'g3', name: 'Z', hit: { added: 1, trashed: 1, edkw: { from: 'x' }, fewsel: 1, ctrl: 1, start: 1 }, nw: { trashed: 1 }, rec: [] }], n: {} }];
for (const R of cases) { const a = JSON.stringify(web.P(R)), b = JSON.stringify(ctx.riPlan(R)); ok(a === b, '같은 입력 → 같은 계획 ' + (R && R.oK || (R && R.bad) || '빈 것'), a === b ? null : { web: a, cloud: b }); }
const fk = ctx.riFake(); ok(fk.cols.dec.join() === 'watch,strat' && fk.cols.pm && fk.cols.truth && fk.cols.strat && fk.cols.grp[0] === 'gFAKE' && fk.recOnly[0].f[0] === 'picks', '가짜 문서 마른 실행(진단 inh=fake) — 승인·이미 있는 바닥값·이미 있는 비교군은 안 베낌', fk);

console.log('② 판 옮김 — 웹앱 없이 잇고 물려받기');
const S = A.store; const today = new Date().toISOString();
S.set('prd_edmove/aladin_100', { key: 'aladin_100', uc: '100', lid: '9100', state: 'reg', regItem: 'RI1', itemId: '555', at: today });
S.set('reg_items/RI1', { cmdId: 'CMD1', reReg: { from: 'aladin_100', ed: true } }); S.set('shp_cmds/CMD1', { results: { RI1: { state: 'live', usedCode: '200', listingId: '9200' } } });
S.set('prd_listings/aladin_100', { usedCode: '100', listingId: '9100', status: '판매중', active: true }); S.set('prd_listings/aladin_200', { usedCode: '200', listingId: '9200', status: '판매중', active: true, title: '가짜 책' });
S.set('prd_price_decisions/aladin_100', { watch: { g: 'w' }, strat: 'S1', floor: 7000, approval: { ok: 1 } }); S.set('prd_price_decisions/aladin_200', { floor: 6500 });
S.set('pur_matches/aladin_100', { pur: 'P9', cost: 2000 }); S.set('prd_edkw_truth/aladin_100', { kw: ['개정판'] });
S.set('strat_items/c' + mtH('aladin_100', 16), { m: { aladin_100: { s: 'A' }, aladin_x: { s: 'B' } } });
S.set('prd_price_batches/gA', { name: '그룹 A' }); S.set('prd_price_batches/gA~s1', { shardOf: 'gA', held: { aladin_100: 1 }, picks: { aladin_100: 1 }, start: { 100: 8000 } });
S.set('prd_price_actions/a1', { key: 'aladin_100' }); S.set('prd_notes/n1', { listingKey: 'aladin_100' });
const oldSnap = JSON.stringify([...S.entries()].filter(([k]) => /aladin_100|gA~s1|CMD1/.test(k) && !/prd_edmove/.test(k)));
const dry = await ctx.recInheritTick({ force: true, dry: true }); ok(dry.ed[0].would === 'link' && !A.writes.length, '마른 실행(inh=dry)은 아무것도 안 씀', { dry, w: A.writes });
const r1 = await ctx.recInheritTick({ force: true });
const lk = S.get('prd_relinks/200'), job = S.get('prd_edmove/aladin_100'), led = S.get('prd_inherit/aladin_200');
ok(lk && lk.kind === 'ed' && lk.fromKey === 'aladin_100' && lk.toKey === 'aladin_200' && lk.by === 'cloud' && lk.writerSchema === 6 && job.state === 'linked' && job.newKey === 'aladin_200', '고리 ed 만들고 일 「linked」(웹앱 edMvLink와 같은 칸)', { lk, job });
const dN = S.get('prd_price_decisions/aladin_200');
ok(dN.watch.g === 'w' && dN.strat === 'S1' && dN.floor === 6500 && !dN.approval && dN.inh.from === 'aladin_100' && dN.inh.fields.join() === 'watch,strat', '판정 문서 — 없던 감시·전략만 베낌(바닥값 그대로 · 승인은 새로)', dN);
ok(S.get('pur_matches/aladin_200').edFrom === 'aladin_100' && S.get('prd_edkw_truth/aladin_200').inhFrom === 'aladin_100' && S.get('strat_items/c' + mtH('aladin_200', 16)).m.aladin_200.inhFrom === 'aladin_100', '매입 짝·판본 정답·⚡ 전략 칸 베낌(표시 남김)');
const sh = [...S.entries()].filter(([k, v]) => k.startsWith('prd_price_batches/') && v.shardOf === 'gA' && v.held && v.held.aladin_200); ok(sh.length === 1 && [...S.entries()].some(([k, v]) => k.startsWith('prd_price_batches/') && v.start && v.start['200'] === 8000) && ![...S.entries()].some(([k, v]) => v.picks && v.picks.aladin_200), '그룹 — 보류·시작값 베낌 · 고름은 기록만', sh);
ok(led && led.ok === true && led.kind === 'ed' && led.by === 'cloud' && led.read.act === 1 && led.read.note === 1 && led.recOnly[0].f[0] === 'picks' && led.cols.dec && !led.claim && job.inhOk === true, '장부 prd_inherit ok · 웹앱 장부 칸(from·to·cols·created·merged·maps·recOnly·read) · 판 옮김 일 inhOk', led);
ok(JSON.stringify([...S.entries()].filter(([k]) => /aladin_100|gA~s1|CMD1/.test(k) && !/prd_edmove/.test(k))) === oldSnap, '옛 상품 기록은 하나도 안 바뀜(지우지 않음)');

console.log('③ 끌올 다시 등록 — 고리·매입 짝·물려받기');
S.set('prd_bump/B1', { key: 'aladin_300', usedCode: '300', state: 'reg_wait', regCmd: 'CMD2', regItem: 'R2', n: 2, origSrc: 'x', origRegAt: '2026-01-01' });
S.set('shp_cmds/CMD2', { results: { R2: { state: 'live', usedCode: '301', listingId: '9301' } } }); S.set('pur_matches/aladin_300', { pur: 'P3' }); S.set('prd_price_decisions/aladin_300', { chaser: { on: 1 } });
const r2 = await ctx.recInheritTick({ force: true }); const bl = S.get('prd_relinks/301');
ok(bl && bl.kind === 'bump' && bl.job === 'B1' && bl.first === '2026-01-01' && bl.fromKey === 'aladin_300' && S.get('prd_bump/B1').state === 'reg_wait' && S.get('prd_bump/B1').cloudLink.nu === '301', '고리 bump(웹앱 fbDone과 같은 칸) · 일 상태는 웹앱 몫', { bl, j: S.get('prd_bump/B1') });
ok(S.get('pur_matches/aladin_301').bumpFrom === 'aladin_300' && S.get('prd_price_decisions/aladin_301').chaser.on === 1 && S.get('prd_inherit/aladin_301').ok && S.get('prd_inherit/aladin_301').kind === 'bump', '매입 짝 복사(bumpFrom) · 추격 물려받음 · 장부 kind bump', S.get('prd_inherit/aladin_301'));

console.log('④ 멱등 · 안 하는 것');
const w0 = A.writes.length; const r3 = await ctx.recInheritTick({ force: true }); ok(r3.pending === 0 && !r3.runs.length && A.writes.length === w0, '두 번째 회차는 아무것도 안 씀(상태 문서도 3시간에 한 번)', { r3, w: A.writes.slice(w0) });
const R2 = await ctx.riRun({ kind: 'ed', from: '100', to: '200', fromKey: 'aladin_100', toKey: 'aladin_200', job: 'aladin_100' }, [], {}); ok(R2.skip, '장부가 ok면 다시 안 함', R2);
S.set('prd_inherit/aladin_201', { claim: { by: 'other', at: new Date().toISOString() } }); const R3 = await ctx.riRun({ kind: 'ed', from: '1', to: '201', fromKey: 'aladin_1', toKey: 'aladin_201' }, [], {}); ok(R3.skip, '다른 쪽이 잡고 있으면(5분) 비킴 — 겹쳐 돌아도 한쪽만', R3);
S.set('prd_relinks/401', { kind: 'ed', from: '400', to: '401', fromKey: 'aladin_400', toKey: 'aladin_401', foundAt: today, rejected: true });
S.set('prd_relinks/501', { kind: 'bump', from: '500', to: '501', fromKey: 'aladin_500', toKey: 'aladin_501', doneAt: '2026-10-01T00:00:00Z' });
S.set('prd_relinks/601', { kind: 'ed', from: '600', to: '601', fromKey: 'aladin_600', toKey: 'aladin_601', foundAt: today }); S.set('prd_inherit/aladin_601', { undone: true });
const r4 = await ctx.recInheritTick({ force: true }); ok(r4.pending === 0, '끊은 고리·되돌린 물려받기·' + ctx.RI_FROM + ' 전 고리는 저절로 안 함', r4);
const r5 = await ctx.recInheritTick({ force: true, back: true, dry: true }); ok(r5.pending === 1 && r5.runs[0].dry && r5.runs[0].to === 'aladin_501', '옛 고리는 진단 back=1로만(마른 실행)', r5);
S.set('prd_edmove/aladin_700', { key: 'aladin_700', state: 'reg', regItem: 'RI7' }); S.set('reg_items/RI7', { cmdId: 'CMD7' }); S.set('shp_cmds/CMD7', { results: { RI7: { state: 'live', usedCode: '701' } } }); S.set('prd_listings/aladin_701', { status: '판매중', active: false });
const r6 = await ctx.recInheritTick({ force: true }); ok(S.get('prd_edmove/aladin_700').state === 'reg' && !S.get('prd_relinks/701') && r6.ed.some((x) => x.job === 'aladin_700' && x.wait), '새 판이 판매중으로 안 보이면 안 이음(기다림)', r6.ed);
ok(/recInheritTick\(\)/.test(SRC.slice(SRC.indexOf('async function tick('), SRC.indexOf('async function tick(') + 200000)) && /q\.inh/.test(SRC), '/tick이 10분마다 부름 · 진단 inh');
ok(!logs.length, '잘못 쓴 기록 없음', logs);
console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
