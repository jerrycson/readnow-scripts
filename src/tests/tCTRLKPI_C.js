/* tCTRLKPI_C — (일꾼 kpib1 판 C · 정범님 I-1119-2051-30·2056-31 · 리드 결정 ③ · 설계 readnow-chats reports/CTRLKPI1_1119.md 3-4·9장) ⏪ 관제소 지난 날 되살리기
 *  cloud/index.js CTRLKPI-START~END(하루 요약) + CTRLKPIR-START~END(되살리기)를 떼어 가짜 Firestore로 돌림:
 *   ① 꺼짐이면 안 돎 · 오늘은 빼고 지난 날만 · 하루 모습(ml_days) 머리가 없는 날은 못 함 · 이미 요약이 있는 날은 건너뜀(덮지 않음)
 *   ② 가장 옛 날·남은 날을 먼저 ml_state.kpiReb에 알림 · 다 하면 fin · 다시 부르면 '다 함'
 *   ③ 딱지 src:'rebuild'·foldsAsOf:'rebuild'·rb:1(ml_days가 되살린 날일 때만) · 유효 최저(low) 칸은 null · lowU만 · 그때 잠금·실험 수 null
 *   ④ 판매 장부는 한 번만 읽음(첫 날 전날 0시부터) · 잃은 까닭 '팔림'은 어제 0시~그날 01시 판매만 · 그날 칸 fl = 그날 하루 판매
 *   ⑤ 바로 앞에서 한 날은 다시 읽지 않음 · 시간이 다 되면 멈추고 다음에 이어 함(more) · 쓰기 직전에 그사이 생긴 날은 건너뜀
 *   ⑥ djRun kpi 열쇠 · 메모리 감시 busy 이름 · 진단 kpi=reb · 되살리기 덩어리의 읽기·쓰기 칸
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tCTRLKPI_C.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('파일 없음 ' + rel); };
const SRC = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const ML = require(findUp('readnow-ml-core.js'));
const cut = (s, e) => { const a = SRC.indexOf(s), b = SRC.indexOf(e); if (!(a > 0 && b > a)) throw new Error('구역 없음 ' + s); return SRC.slice(SRC.indexOf('*/', a) + 2, b); };

class FieldPath { constructor(...s) { this.segs = s; } }
function fakeDb() { const store = new Map(); const writes = []; const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const snap = (col, id) => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => clone(v) }; };
  const getP = (o, segs) => segs.reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, segs, v) => { let c = o; segs.slice(0, -1).forEach((k) => { if (!c[k] || typeof c[k] !== 'object') c[k] = {}; c = c[k]; }); c[segs[segs.length - 1]] = clone(v); };
  const deep = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? deep(o[k], v) : clone(v); return o; };
  const apply = (r, v, o) => { const p = r._col + '/' + r.id; writes.push(p); const cur = clone(store.get(p)); if (o && o.mergeFields) { const n = cur || {}; for (const f of o.mergeFields) { const segs = f instanceof FieldPath ? f.segs : String(f).split('.'); setP(n, segs, getP(v, segs)); } store.set(p, n); } else if (o && o.merge) store.set(p, deep(cur, v)); else store.set(p, clone(v)); };
  const docRef = (col, id) => { const r = { _col: col, id, get: async () => snap(col, id) }; r.set = async (v, o) => apply(r, v, o); return r; };
  const query = (col) => ({ where: () => query(col), select: () => query(col), count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
    get: async () => { const L = []; for (const p of store.keys()) { const i = p.indexOf('/'); if (p.slice(0, i) === col && !p.slice(i + 1).includes('/')) L.push(snap(col, p.slice(i + 1))); } return { size: L.length, docs: L, forEach: (f) => L.forEach(f) }; } });
  const C = (col) => Object.assign(query(col), { doc: (id) => docRef(col, id) });
  const db = { collection: C, getAll: async (...a) => a.filter((r) => r && r._col).map((r) => snap(r._col, r.id)), batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), commit: async () => ops.forEach(([r, v, o]) => apply(r, v, o)) }; } };
  return { db, C, store, writes, put: (p, v) => store.set(p, clone(v)), get: (p) => clone(store.get(p)) }; }

const BLOCK = cut('/* CTRLKPI-START', '/* CTRLKPI-END */') + '\n' + cut('/* CTRLKPIR-START', '/* CTRLKPIR-END */');
const TODAY = '2026-11-20';
const mk = (env) => new Function('require', 'db', 'C', 'FieldPath', 'W', 'nowIso', 'shard', 'mlMod', 'mlSales', 'mlLoadCols', 'nodeCls', 'kday', 'mlSnapshot',
  BLOCK + '\nreturn { ctrlKpiRebuild, ctrlKpiDay, KPI_RCOLS };')(
  require, env.db, env.C, FieldPath, () => ({ uploadedAt: 'TS', writer: 'cloud', writerSchema: 6 }), () => '2026-11-20T01:05:00.000Z', (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; },
  async () => ML, env.mlSales, env.mlLoadCols, async () => { env.cls = (env.cls || 0) + 1; return null; }, () => TODAY, async () => ({}));

const R = (key, price, p1, rank, top, o) => ({ key, price, p1, rank, top, sameMin: null, minAll: null, mkt: 1, act: null, actFrom: null, age: 10, ...(o || {}) });
const ROWS = {
  '2026-11-15': [R('aladin_101', 5000, 6, 1, 1), R('aladin_102', 5500, 6, 1, 1, { sameMin: 5500 }), R('aladin_103', 7000, 2, 2, 0, { sameMin: 6000, minAll: 6000 })],
  '2026-11-16': [R('aladin_101', 5000, 6, 2, 0, { minAll: 4000 }), R('aladin_102', 5500, 6, 2, 0, { minAll: 5000 }), R('aladin_103', 7000, 2, 1, 1)],
  '2026-11-18': [R('aladin_103', 7000, 2, 1, 1), R('aladin_104', 3000, 1, 1, 1)],
  '2026-11-19': [R('aladin_103', 7000, 2, 2, 0, { minAll: 6500 }), R('aladin_104', 3000, 1, 1, 1, { sameMin: 3000 })],
  '2026-11-20': [R('aladin_104', 3000, 1, 1, 1)] };
const KST = (s) => Date.parse(s + '+09:00');
const SALES = new Map([['101', [{ ono: 'o1', at: KST('2026-11-16T00:30:00'), price: 5000, src: 'crm' }]], ['102', [{ ono: 'o2', at: KST('2026-11-16T05:00:00'), price: 5500, src: 'shp' }]], ['900', [{ ono: 'o3', at: KST('2026-11-15T12:00:00'), price: 1000, src: 'crm' }]]]);
function setup(st, o) { o = o || {}; const env = fakeDb(); env.loads = []; env.salesCalls = [];
  env.mlLoadCols = async (day, want) => { env.loads.push(day + ':' + want.length); if (o.onLoad) o.onLoad(day, env); return ROWS[day] ? JSON.parse(JSON.stringify(ROWS[day])) : null; };
  env.mlSales = async (iso) => { env.salesCalls.push(iso); return SALES; };
  env.put('app_settings/ml_state', st);
  ['2026-11-15', '2026-11-16', '2026-11-18', '2026-11-19', '2026-11-20'].forEach((d) => env.put('ml_days/' + d, { day: d, shards: 1, ...(d === '2026-11-15' ? { rebuilt: true } : {}) }));
  env.put('ctl_kpi_days/2026-11-18', { day: '2026-11-18', lowS: 'keep', src: 'ml_days' });
  env.put('ctl_kpi_m/2026-11', { ym: '2026-11', d: { 18: { T: { n: 2 }, keep: 1 } } });
  env.put('prd_price_batches/g1', { name: '그룹1', lastKeys: ['aladin_101', 'aladin_103'] });
  return { env, F: mk(env) }; }
const DAYS = ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', 'bad'];

(async () => {
  console.log('① 꺼짐·지난 날만·없는 날·있는 날');
  { const { env, F } = setup({ days: DAYS }); const r = await F.ctrlKpiRebuild(60e3); ok(r.skip && /꺼져/.test(r.skip) && !env.writes.length && !env.loads.length, '꺼짐(kpiOn 아님): 아무것도 안 읽고 안 씀', r); }
  const { env, F } = setup({ kpiOn: true, days: DAYS }); const r = await F.ctrlKpiRebuild(60e3); const st = env.get('app_settings/ml_state').kpiReb;
  ok(JSON.stringify(r.made) === JSON.stringify(['2026-11-15', '2026-11-16', '2026-11-19']) && r.left === 0 && !r.more && r.first === '2026-11-15', '옛 날부터 15·16·19 (17은 하루 모습 없음 · 18은 이미 있음 · 20은 오늘 · 틀린 이름 뺌)', r);
  ok(!env.get('ctl_kpi_days/2026-11-17') && !env.get('ctl_kpi_days/2026-11-20') && env.get('ctl_kpi_days/2026-11-18').lowS === 'keep', '17·20은 안 만듦 · 이미 있던 18은 그대로');
  ok(JSON.stringify(env.get('ctl_kpi_m/2026-11').d['18']) === JSON.stringify({ T: { n: 2 }, keep: 1 }), '달 문서의 18일 칸(이미 있던 날)은 손대지 않음');
  console.log('② 알림·다 함');
  ok(st.first === '2026-11-15' && st.lastAvail === '2026-11-19' && st.nDays === 4 && st.nRb === 1 && st.done === 4 && st.todo === 0 && st.last === '2026-11-19' && st.fin === TODAY && st.ver === 1 && st.startAt, 'kpiReb: 가장 옛 날·되살린 ml_days 수·다 한 수·남은 수·마지막 날·fin', st);
  { const r2 = await F.ctrlKpiRebuild(60e3); ok(r2.skip && /다 함/.test(r2.skip), '다 한 뒤엔 다시 훑지 않음(진단 kpi=reb로 fin을 지워야 다시)', r2); }
  { const e2 = setup({ kpiOn: true, days: DAYS }); let n = 0; const real = e2.env.db.getAll; e2.env.db.getAll = async (...a) => { n++; return real(...a); }; await e2.F.ctrlKpiRebuild(60e3); const s2 = e2.env.get('app_settings/ml_state').kpiReb; ok(s2.startAt && s2.first === '2026-11-15', '시작 알림(startAt·first)은 하루 모습을 읽기 전에 씀'); }
  console.log('③ 딱지·low 없음');
  const d15 = env.get('ctl_kpi_days/2026-11-15'), d16 = env.get('ctl_kpi_days/2026-11-16'), d19 = env.get('ctl_kpi_days/2026-11-19'); const M = env.get('ctl_kpi_m/2026-11').d;
  ok(d15.src === 'rebuild' && d15.foldsAsOf === 'rebuild' && d15.rb === 1 && d16.src === 'rebuild' && d16.rb === undefined && d15.lowS === null && d15.mv.low === null, '요약 문서: src·foldsAsOf 딱지 · rb는 ml_days가 되살린 날(15)만 · lowS·잃음 low 없음', [d15, d16]);
  ok(M['15'].src === 'rebuild' && M['15'].rb === 1 && M['16'].rb === undefined && M['15'].T.low === null && M['15'].T.lowN === null && M['15'].T.lowU === 1 && M['15'].T.px === null && M['15'].T.lk === null && M['15'].act === null && !M['15'].lowErr, '달 칸: low·lowN null · lowU(거르지 않은 동급 최저 이하) 1 · 잠금·실험·조정 null · 분류 까닭 없음', M['15']);
  ok(!env.cls, '판매자 분류 파일을 받지 않음(지난 날은 그때 분류를 모름)');
  ok(!M['14'], '되살리기는 어제 칸(fl)을 따로 만들지 않음');
  console.log('④ 판매 장부·팔림 창·그날 판매');
  ok(env.salesCalls.length === 1 && Date.parse(env.salesCalls[0]) === KST('2026-11-14T00:00:00'), '판매 장부는 한 번 · 첫 날(15) 전날 0시부터', env.salesCalls);
  const lost16 = d16.mv.top.lost; ok(M['16'].mvT.l === 2 && M['16'].mvT.w.sold === 1 && M['16'].mvT.w.under === 1 && lost16.some((x) => x.startsWith('aladin_101|sold')) && lost16.some((x) => x.startsWith('aladin_102|under')), '16일 잃음: 101은 16일 00:30 판매(창 안) → 팔림 · 102는 05:00 판매(01시 넘음) → 밑돎', [M['16'].mvT, lost16]);
  ok(M['15'].mvT === null && d15.mv.top === null, '15일은 앞날(14) 하루 모습이 없어 얻음·잃음 null(첫날)', M['15'].mvT);
  ok(JSON.stringify(M['15'].fl) === JSON.stringify({ sold: 1, amt: 1000, v: null, vb: null }) && M['16'].fl.sold === 2 && M['16'].fl.amt === 10500 && M['19'].fl.sold === 0, '그날 칸 fl = 그날 0시~다음 날 0시 판매', [M['15'].fl, M['16'].fl]);
  console.log('⑤ 다시 안 읽음·끊고 이어 함·그사이 생긴 날');
  ok(JSON.stringify(env.loads) === JSON.stringify(['2026-11-15:11', '2026-11-14:5', '2026-11-16:11', '2026-11-19:11', '2026-11-18:5']), '16일의 앞날(15)은 방금 한 것을 다시 씀 · 19일은 18을 따로 읽음(가벼운 5칸)', env.loads);
  { const e3 = setup({ kpiOn: true, days: DAYS }); const r3 = await e3.F.ctrlKpiRebuild(-1); const s3 = e3.env.get('app_settings/ml_state').kpiReb; ok(r3.made.length === 0 && r3.more === true && r3.left === 3 && s3.todo === 3 && s3.fin === null && !e3.env.get('ctl_kpi_days/2026-11-15'), '시간이 다 되면 멈춤 · more · 남은 3 · fin 없음', [r3, s3]);
    const r4 = await e3.F.ctrlKpiRebuild(60e3); ok(r4.made.length === 3 && !r4.more && e3.env.get('app_settings/ml_state').kpiReb.fin === TODAY, '다음 회차에 이어서 다 함', r4); }
  { const e5 = setup({ kpiOn: true, days: DAYS }, { onLoad: (day, env) => { if (day === '2026-11-16') env.put('ctl_kpi_days/2026-11-16', { day: '2026-11-16', src: 'ml_days', mine: 1 }); } }); const r5 = await e5.F.ctrlKpiRebuild(60e3);
    ok(!r5.made.includes('2026-11-16') && e5.env.get('ctl_kpi_days/2026-11-16').mine === 1 && !(e5.env.get('ctl_kpi_m/2026-11').d || {})['16'], '읽는 사이 그날 요약이 생기면 덮지 않고 건너뜀', r5); }
  { const e6 = setup({ kpiOn: true, days: [] }); const r6 = await e6.F.ctrlKpiRebuild(60e3); ok(r6.skip && /하루 모습이 없음/.test(r6.skip), '하루 모습 목록이 비면 skip', r6); }
  { const e7 = setup({ kpiOn: true, days: DAYS }, { onLoad: (day) => { if (day === '2026-11-19') throw new Error('일부러 실패'); } }); const r7 = await e7.F.ctrlKpiRebuild(60e3); const s7 = e7.env.get('app_settings/ml_state').kpiReb;
    ok(r7.made.length === 2 && r7.errs.length === 1 && /일부러/.test(r7.errs[0]) && s7.fin === null && s7.errs.length === 1, '한 날이 실패해도 나머지는 함 · 까닭을 남기고 fin은 안 씀', [r7, s7]); }
  console.log('⑥ 연결·진단·칸');
  ok(/kpi: \[\(\) => ctrlKpiRebuild\(4 \* 60e3\), \(v\) => \(kpiRebBusy = v\), \(\) => kpiRebBusy \|\| mlBusy\]/.test(SRC), 'djRun kpi 열쇠(4분 · 결과 기록이 도는 중이면 비킴)');
  ok(/J\.ml && Date\.now\(\) > kpiRebNextAt\) \{ try \{ const r = await djTO\(djRun\('kpi'\), 6 \* 60e3/.test(SRC) && /if \(kpiRebBusy\) b\.push\('kpiReb'\)/.test(SRC), '매일 일 고리에 들어감(6분 문) · 메모리 감시가 busy 이름을 앎');
  ok(/q\.kpi === 'reb'\) \{ await ST\.set\(\{ kpiReb: \{ fin: null \} \}, \{ merge: true \}\); kpiRebNextAt = 0;/.test(SRC) && /out\.kpi\.reb = sd\.kpiReb \|\| null/.test(SRC) && /if \(q\.kpi === 'on'\) kpiRebNextAt = 0;/.test(SRC), '진단 kpi=reb(다시 훑기) · out.kpi.reb · 켜면 곧 시작');
  { const rb = cut('/* CTRLKPIR-START', '/* CTRLKPIR-END */'); const cols = [...new Set([...rb.matchAll(/C\('([a-z_0-9]+)'\)/g)].map((x) => x[1]))]; const sets = [...rb.matchAll(/ST\.set\(\{ (\w+):/g)].map((x) => x[1]);
    ok(cols.every((c) => ['app_settings', 'ml_days', 'ctl_kpi_days'].includes(c)) && sets.length >= 3 && sets.every((s) => s === 'kpiReb') && !/\.delete\(|batch\(\)|\.update\(/.test(rb), `되살리기 덩어리: 읽기 ${cols.join('·')} · 쓰기는 ml_state.kpiReb뿐(요약 쓰기는 ctrlKpiDay) · 지우기 없음`, [cols, sets]); }
  ok(/VERSION\s*=\s*'0\.10\.2'|VERSION:\s*'0\.10\.2'|'0\.10\.2'/.test(fs.readFileSync(findUp('readnow-ml-core.js'), 'utf8')), 'ml-core 0.10.2 그대로(머리 안 바뀜)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e.stack); process.exit(1); });
