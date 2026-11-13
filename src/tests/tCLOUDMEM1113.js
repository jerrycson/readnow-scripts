// tCLOUDMEM1113 — (cloudmem 11/13) 클라우드 메모리 넘침(11/12 22:50Z · 판매자 배우기 도중 rss 433MB → 9초 만에 2GB) 고침 · 브라우저 필요 없음
//  ① 무거운 일 한 줄 서기(HVG) — 이름이 달라도 함께 안 돎 · 기다림 넘으면 건너뛰고 줄은 이어짐 · noWait
//  ② 판매자 배우기 채운 정보(slFillMap)를 5천 개씩 나눠 받음 · 문서 참조 대신 번호 · 잇기(slBenchJoin)는 번호로 씀
//  ③ 우리 앞 쪽은 하루 모습 key·age 두 칸만(mlLoadCols · fieldMask) · 판매 기록은 쓰는 칸만(select)
//  ④ 단계 표시·제동(slMemCk) — 1400MB 넘으면 그 회차 멈춤 · 단계별 최고 rss
//  ⑤ 메모리 감시 2초 급등 잡기(memwatch fast) — Cloud Logging 한 줄 + spikes
// 실행: node src/tests/tCLOUDMEM1113.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  console.log('① 무거운 일 한 줄 서기');
  const G = new Function('HV0', 'BUSYX', 'HV_ON', 'HV_BUSYF', cut(CL, 'const HV_WAIT = ', 'async function HV0(') + '\nreturn { HVG, HV, set: (w) => {} };');
  const BUSYX = new Set(); const run = []; let on = 0, maxOn = 0;
  const work = (name, ms) => async () => { on++; maxOn = Math.max(maxOn, on); run.push('+' + name); await sleep(ms); run.push('-' + name); on--; return { name }; };
  const H = G(async (name, fn) => fn(), BUSYX, new Set(), {});
  const [a, b, c] = await Promise.all([H.HV('sellerLearnStudy', work('sl', 40)), H.HV('valueLearn', work('vl', 20)), H.HVG('voice', work('vo', 10))]);
  ok(maxOn === 1 && run.join(',') === '+sl,-sl,+vl,-vl,+vo,-vo', '이름이 달라도 차례로(함께 돈 수 최대 1)', run);
  ok(a.name === 'sl' && b.name === 'vl' && c.name === 'vo', '결과는 그대로 돌려줌');
  const d0 = H.HVG('long', work('long', 80)); await sleep(5); const sk = await H.HVG('dg', work('dg', 1), { noWait: true }); ok(sk && sk.skip === 'gate:long', 'noWait면 도는 일이 있을 때 바로 건너뜀', sk);
  const t1 = await H.HVG('late', work('late', 1), { wait: 20 }); ok(t1 && /^gate:/.test(t1.skip), '기다림을 넘으면 이번엔 건너뜀', t1);
  await d0; const after = await H.HVG('next', work('next', 1)); ok(after && after.name === 'next', '건너뛴 뒤에도 줄이 막히지 않고 다음 일이 돎');
  const dup = await Promise.all([H.HV('same', work('s1', 10)), H.HV('same', work('s2', 10))]); ok(dup[1].skip === 'busy', '같은 이름 두 번은 예전처럼 busy');
  BUSYX.add('sl:fill'); await H.HV('x', async () => 1); ok(![...BUSYX].some((k) => k.startsWith('sl:')), 'HV가 끝나면 단계 이름표(sl:)를 치움');
  ok(/HVG\('voice', \(\) => VOICE\.run\(\)\)/.test(CL) && (CL.match(/HVG\('voice'/g) || []).length === 2, '구매평 요약 두 길 모두 같은 문');

  console.log('② 채운 정보 나눠 받기');
  const ITEMS = Array.from({ length: 23 }, (_, i) => ({ id: 'b' + String(i).padStart(3, '0'), spAt: '2026-11-0' + (1 + (i % 9)) + 'T00:00:00Z', fillAt: i % 3 ? '2026-11-05T00:00:00Z' : null, sc: '9000001', isbn: '97911' + String(i).padStart(8, '0') }));
  let gets = 0, maxPage = 0;
  const mkQ = (st) => ({ where: (f, op, v) => mkQ({ ...st, f, v }), orderBy: (f) => mkQ({ ...st, ob: f }), select: () => mkQ(st), limit: (n) => mkQ({ ...st, lim: n }), startAfter: (d) => mkQ({ ...st, after: d }),
    get: async () => { gets++; let L = ITEMS.filter((x) => x[st.f] && x[st.f] >= st.v).sort((p, q) => (p[st.ob] < q[st.ob] ? -1 : p[st.ob] > q[st.ob] ? 1 : p.id < q.id ? -1 : 1)); if (st.after) L = L.slice(L.findIndex((x) => x.id === st.after.id) + 1); L = L.slice(0, st.lim || 1e9); maxPage = Math.max(maxPage, L.length);
      const docs = L.map((x) => ({ id: x.id, ref: { path: 'bench_items/' + x.id }, data: () => ({ ...x }) })); return { size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } });
  const Cf = () => mkQ({});
  const F = new Function('C', 'BUSYX', 'nowIso', 'require', (cut(CL, 'const SL_PAGE = ', 'const slKdcCat = ').replace('const SL_PAGE = 5000;', 'const SL_PAGE = 5;')) + cut(CL, 'let SL_DG = null;', 'let SLM = null') + '\nreturn { slFillMap, slMemCk, slStageReset, slStageDone, slStageNote, SLST };')(Cf, new Set(), () => '2026-11-13T00:00:00Z', (m) => (/memwatch/.test(m) ? { contMB: () => 300 } : require(m)));
  const { M, st } = await F.slFillMap(); ok(M.size === 23 && st.q.spAt === 23 && maxPage <= 5 && gets >= 5, `다 받음(${M.size}) · 한 번에 최대 ${maxPage}개 · 읽기 ${gets}번`, st);
  ok([...M.values()].every((v) => v._id && !v.ref), '문서 참조(ref)를 들지 않고 번호만');
  ok(!/select\(\.\.\.SL_FILL_F\)\.get\(\)/.test(CL), '한 번에 다 받는 꼴(select(...SL_FILL_F).get())이 남지 않음');
  const BJ = cut(CL, 'async function slBenchJoin(', 'let SL_DG = null;'); ok(!/v\.ref/.test(BJ) && /B\.set\(C\('bench_items'\)\.doc\(v\._id\)/.test(BJ), '잇기 쓰기는 번호로 문서를 찾아 씀');

  console.log('③ 하루 모습 두 칸만 · 판매 기록 쓰는 칸만');
  const asks = []; const SH = { '2026-11-01_00': { cols: { key: ['aladin_1', 'aladin_2'], age: [3, 9], big: ['x', 'y'] } }, '2026-11-01_01': { cols: { key: ['aladin_3'], age: [40], big: ['z'] } } };
  const Cm = (col) => ({ doc: (id) => ({ id, get: async () => ({ exists: true, data: () => ({ shards: 2 }) }) }) });
  const dbm = { getAll: async (ref, o) => { asks.push(o && o.fieldMask); const v = SH[ref.id]; const cols = {}; for (const f of (o.fieldMask || [])) { const c = f.replace('cols.', ''); cols[c] = v.cols[c]; } return [{ exists: true, data: () => ({ cols }) }]; } };
  const LC = new Function('C', 'db', cut(CL, 'async function mlLoadCols(', 'async function mlLoadDay(') + '\nreturn mlLoadCols;')(Cm, dbm);
  const rows = await LC('2026-11-01', ['key', 'age']); ok(rows.length === 3 && rows[2].key === 'aladin_3' && rows[2].age === 40 && !('big' in rows[0]), '두 칸만 줄로 만듦', rows);
  ok(asks.every((m) => JSON.stringify(m) === '["cols.key","cols.age"]'), '조각 문서도 그 칸만 받음(fieldMask)', asks);
  ok(/mlLoadCols\(d, \['key', 'age'\]\)/.test(CL) && !/const rows = await mlLoadDay\(d\); if \(rows && rows\.length\) ds\.push/.test(CL), '판매자 배우기 우리 앞 쪽이 mlLoadCols를 씀');
  const MS = cut(CL, 'async function mlSales(', 'async function mlSnapshot('); ok(/crm_orders'\)\.where\('orderedAt', '>=', day0\)\.select\('orderedAt', 'kind', 'items', 'orderNo'\)/.test(MS) && /shp_orders'\)\.where\('orderedAt', '>=', day0\)\.select\('orderedAt', 'items', 'orderNo'\)/.test(MS), '판매 기록은 쓰는 칸만');
  for (const k of ['o.orderedAt', 'o.kind', 'o.items', 'o.orderNo', 'it.listingId']) ok(MS.includes(k), '쓰는 칸 ' + k + '이 고른 칸 안');
  ok(!/\bo\.(?!orderedAt|kind|items|orderNo)[a-zA-Z]+/.test(MS), '고른 칸 밖 주문 칸을 쓰지 않음');

  console.log('④ 단계 표시·제동');
  F.slStageReset(); F.slMemCk('fill'); F.slStageNote(800); F.slMemCk('shop'); F.slStageNote(1200); let th = null; F.slStageNote(1500); try { F.slMemCk('ours'); } catch (e) { th = e.message; }
  ok(th && /메모리 높음 1500MB/.test(th) && /'shop'/.test(th), '1400MB 넘으면 다음 단계 확인에서 멈춤(단계 이름 함께)', th);
  const dn = F.slStageDone(); ok(dn.peak.fill >= 800 && dn.peak.shop === 1500 && dn.max === 1500 && dn.brakeMB === 1400, '단계별 최고 rss', dn);
  F.slStageReset(); let th2 = null; try { F.slMemCk('start'); } catch (e) { th2 = e; } ok(!th2, '새 회차는 제동이 풀림');
  const SLS = cut(CL, 'async function sellerLearnStudy(', '/* ══ (정범님 11/11 밤 · sell2)'); for (const k of ["slMemCk('fill')", "slMemCk('shops')", "slMemCk('shop')", "slMemCk('ours')", "slMemCk('ourFront')", "slMemCk('study2')", 'doc.mem = slStageDone()']) ok(SLS.includes(k), '판매자 배우기 단계 ' + k);
  ok(/if \(q\.slearn === 'bg'\)/.test(CL) && /HVG\('slearnDry'/.test(CL), '진단 slearn=bg(뒤에서)·2(결과) · 무거운 일 문을 지남');

  console.log('⑤ 메모리 감시 2초 급등 잡기');
  const MW = require(path.join(ROOT, 'cloud', 'memwatch.js')); const logs = []; let rss = 400; const notes = []; const puts = [];
  const real = process.memoryUsage; const fake = () => ({ rss: rss * 1048576, heapUsed: 100 * 1048576, heapTotal: 200 * 1048576, external: 5 * 1048576, arrayBuffers: 0 }); fake.rss = () => rss * 1048576; process.memoryUsage = fake;
  try { const Cw = () => ({ doc: () => ({ get: async () => ({ data: () => null }), set: async (v) => { puts.push(v); } }) });
    const w = MW.makeMemWatch({ C: Cw, log: (...a) => logs.push(a.join(' ')), ver: 't', busyOf: () => ['hv:sellerLearnStudy', 'sl:ourFront'], onFast: (r) => notes.push(r), cgMB: () => null, write: (l) => logs.push(l) });
    w._fast(); rss = 950; w._fast(); rss = 1000; w._fast(); rss = 1200; w._fast(); await sleep(5);
    const sp = logs.filter((l) => /메모리 급등/.test(l)); ok(sp.length === 2 && /rss 950MB/.test(sp[0]) && /rss 1200MB/.test(sp[1]) && /sl:ourFront/.test(sp[1]), '900MB 넘고 150MB 더 오를 때마다 한 줄(바쁜 일 함께)', logs);
    ok(w._S.spikes.length === 2 && w._S.rssPeak.rss === 1200 && notes.join(',') === '400,950,1000,1200', 'spikes·rss 최고·onFast', { s: w._S.spikes, p: w._S.rssPeak, notes });
    ok(puts.length >= 1 && puts.some((p) => p.spikes && p.spikes.length && p.rssPeak), '급등 때 바로 문서에 남김', puts.length);
  } finally { process.memoryUsage = real; }
  ok(/onFast: \(r\) => slStageNote\(r\)/.test(CL), '클라우드가 급등 잡기 값을 단계 최고에 씀');
  console.log('⑥ 컨테이너 전체 메모리·그려 읽기 한 줄 서기(둘째)');
  { const W2 = require(path.join(ROOT, 'cloud', 'memwatch.js')); const c = W2.contMB(true); ok(Number.isFinite(c) && c > 0, `컨테이너 메모리 어림 ${c}MB(cgroup ${W2.cgMB()} · 다른 프로세스 ${JSON.stringify(W2.kidsMB())})`);
    ok(/const rssMB = \(\) => require\('\.\/memwatch\.js'\)\.contMB\(false\)/.test(CL), '판매자 배우기 제동이 컨테이너 기준');
    const CRs = cut(CL, 'const CR_MAX_MB = ', 'async function cloudRender0('); let mb = 500; const runs = []; let on2 = 0, max2 = 0;
    const CR = new Function('require', 'cloudRender0', CRs + '\nreturn { cloudRender, CR_ST };')((m) => (/memwatch/.test(m) ? { contMB: () => mb } : require(m)), async (u) => { on2++; max2 = Math.max(max2, on2); await sleep(15); runs.push(u); on2--; return { ok: true, u }; });
    const rs = await Promise.all([CR.cloudRender('a'), CR.cloudRender('b'), CR.cloudRender('c')]); ok(max2 === 1 && runs.join('') === 'abc' && rs.every((r) => r.ok), '한 번에 한 탭(차례대로)', { max2, runs });
    mb = 1600; const r2 = await CR.cloudRender('d'); ok(r2 && r2.ok === false && r2.mem && CR.CR_ST.skipMem === 1 && !runs.includes('d'), '컨테이너 1450MB 넘으면 그리지 않음', r2);
    mb = 500; const r3 = await CR.cloudRender('e'); ok(r3.ok && runs.includes('e'), '내려가면 다시 그림');
    ok(/fs\.writeSync\(1,/.test(fs.readFileSync(path.join(ROOT, 'cloud', 'memwatch.js'), 'utf8')), '급등 줄은 동기 쓰기(곧 죽어도 남음)'); }
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e.stack); process.exit(1); });
