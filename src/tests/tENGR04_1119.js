/* tENGR04_1119 — (일꾼 engr04 · 정범님 I-1119-0933-05)
 *  A. 🎯 판매가치 사라짐 보정을 엔진이 점수로 고름 — ml-core goneStrength·valueGoneObs·valueHold·valueScore·valuePick · cloud valueLearn0의 고름(auto 기본·on·off·value_gone 기록)
 *  B. 🧪 R04 그림자 대조 — cloud/index.js R04S-START~R04S-END만 떼어 가짜 Firestore로 돌림: 처리 = 내리자 했지만 그대로 둔 상품 · 대조 = 같은 칸 짝 · 판정 기록은 안 고침(손해 0)
 *  C. 🩺 reshealth R04 맥박 — eng_shadow/R04가 있으면 처리 무리 수 · 지표 이름 바꿈(mfix) · 없으면 옛 셈(실행한 전략 수)
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tENGR04_1119.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const ML = require(findUp('readnow-ml-core.js')); const MLc = require(findUp('cloud/readnow-ml-core.js'));
const SRC = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const R = require(findUp('cloud/reshealth.js'));
(async () => {
console.log('A① ml-core 사라짐 보정 세기·채점·고르기');
ok(ML.VERSION === MLc.VERSION && fs.readFileSync(findUp('readnow-ml-core.js'), 'utf8') === fs.readFileSync(findUp('cloud/readnow-ml-core.js'), 'utf8'), '웹앱·클라우드 ml-core 같은 파일');
ok(ML.goneStrength(4, 20) === 0.167 && ML.goneStrength(0, 20) === 0 && ML.goneStrength(400, 20) > 0.95, '보정 세기 = n/(n+K) · 표본 4개면 약하게(0.167) · 표본이 많을수록 1에 가까움');
const bench = [{ src: 'bench', y: 1, w: 1, price: 5000, sp: 2000, rank: 1, list: 15000, sameMin: 5000, g: 3, k: 0, med: 5, life: 2 }, { src: 'bench', y: 1, w: 1, price: 5000, sp: 300, rank: 9, list: 15000, sameMin: 4000, g: 1, k: 0, med: 40, life: 60 }, { src: 'bench', y: 0, w: 1, price: 5000, sp: 300, rank: 9 }];
const G0 = ML.valueGoneObs(bench, { n: 0, K: 20 }); ok(G0.s === 0 && G0.every((o, i) => o.y === bench[i].y), '세기 0이면 보정 없음(사라짐 = 판매 그대로)');
const G4 = ML.valueGoneObs(bench, { n: 4, K: 20 }); ok(G4.s === 0.167 && G4[0].y <= 1 && G4[0].y > 0.8 && G4[1].y < 1 && G4[2].y === 0 && G4.gone === 2, '표본 4개 — 사라진 줄만 조금 줄임 · 안 사라진 줄은 그대로', G4.map((o) => o.y));
ok(bench[0].y === 1, '받은 줄을 고치지 않음(새 줄)');
const obs = []; for (let i = 0; i < 400; i++) { const sp = (i % 10) * 900, rank = 1 + (i % 7); obs.push({ sp, rank, price: 4000 + (i % 5) * 500, list: 15000, sameMin: 4000 + (i % 3) * 500, y: (i * 7919) % 100 < 10 + sp / 200 ? 1 : 0 }); }
const M = ML.valueTrain(obs); const H = ML.valueHold(obs); const sc = ML.valueScore(M, H);
ok(sc && sc.auc > 0.5 && sc.auc <= 1 && sc.ll > 0 && sc.n === 400, '채점(AUC·로그 손실) — 같은 자료로 배운 표는 우연(0.5)보다 나음', sc);
const flat = { ...M }; ok(ML.valueScore(M, {}).auc == null, '시험 기간이 비면 AUC 없음');
ok(ML.valuePick({ auc: 0.7, ll: 0.3 }, { auc: 0.6, ll: 0.3 }) === 'on' && ML.valuePick({ auc: 0.6, ll: 0.3 }, { auc: 0.7, ll: 0.3 }) === 'off', '고르기 — AUC 높은 쪽');
ok(ML.valuePick({ auc: 0.7, ll: 0.29 }, { auc: 0.7, ll: 0.3 }) === 'on' && ML.valuePick({ auc: 0.7, ll: 0.3 }, { auc: 0.7, ll: 0.3 }) === 'off' && ML.valuePick(null, { auc: 0.7 }) === 'off', 'AUC 같으면 로그 손실 · 같거나 점수 없으면 끔(예전 그대로)');
void flat;

console.log('A② cloud valueLearn0 고름');
const vl = SRC.slice(SRC.indexOf('async function valueLearn0('), SRC.indexOf('/* (0.19.0) 🔭 벤치마킹 조회 엔진'));
ok(/goneMode = vcB\.goneP === true \|\| vcB\.goneP === 'on' \? 'on' : vcB\.goneP === false \|\| vcB\.goneP === 'off' \? 'off' : 'auto'/.test(vl), '기본은 auto(점수로 고름) · true/on 늘 켬 · false/off 늘 끔');
ok(/use: goneMode === 'auto' \? pick : goneMode/.test(vl) && /ML\.valuePick\(on, off\)/.test(vl), 'auto면 이긴 쪽을 씀');
ok(/on = ML\.valueScore\(vlMerge\(Mtr, MbOn\), HO\); off = ML\.valueScore\(vlMerge\(Mtr, Mb\), HO\)/.test(vl), '켠 쪽·끈 쪽을 같은 시험 기간(HO)으로 채점 · 배우는 표(Mtr)엔 시험 기간 날을 뺌');
ok(/doc\('value_gone'\)/.test(vl) && /goneSel: goneSel \?/.test(vl), '고른 것·점수를 value_model.goneSel과 app_settings/value_gone에 남김');
ok(!/prd_price_decisions|prd_listings'\)\.doc\([^)]*\)\.set/.test(vl), '값·판정은 안 건드림(손해 0)');

console.log('B R04 그림자 대조');
const a = SRC.indexOf('R04S-START'), b = SRC.indexOf('/* R04S-END */'); ok(a > 0 && b > a, 'R04S 구역 있음'); const code = SRC.slice(SRC.indexOf('*/', a) + 2, b);
const store = new Map(); const writes = []; const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const today = kday(now);
const docRef = (col, id) => ({ get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; }, set: async (v, o) => { writes.push(col + '/' + id); const old = (o && o.merge && store.get(col + '/' + id)) || {}; store.set(col + '/' + id, { ...old, ...JSON.parse(JSON.stringify(v)) }); } });
const colRef = (col) => ({ doc: (id) => docRef(col, id), select: () => colRef(col), get: async () => { const L = [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)) })); return { forEach: (f) => L.forEach(f), docs: L }; } });
const rows = []; for (let i = 0; i < 80; i++) { const key = 'aladin_' + (5000 + i); rows.push({ key, price: 3000 + (i % 4) * 500, grade: i % 3, age: 30 + i * 3, list: 12000, sp: 100 + (i % 4) * 400, p1: 10, rank: 1 + (i % 5) });
  const drop = i % 2 === 0; store.set('prd_price_decisions/' + key, { status: 'ok', action: drop ? 'set' : 'none', delta: drop ? -300 : 0, current: 3000 + (i % 4) * 500, target: drop ? 2700 + (i % 4) * 500 : null, at: iso(now - 3600e3), usedCode: String(5000 + i), ...(i === 2 ? { watch: { gid: 'g1' } } : {}), ...(i === 4 ? { approvalState: 'approved' } : {}) }); }
rows[6].price = 2000; /* 판정 때보다 싸짐 = 이미 내림 → 처리 아님 */
store.set('prd_price_decisions/aladin_old', { status: 'ok', action: 'set', delta: -100, at: iso(now - 50 * 3600e3) }); store.set('app_settings/ml_state', { lastDay: today });
const logs = []; const sales = new Map([['5008', [{ at: now + 60000, price: 3000 }]]]);
const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, console, Promise, C: (c) => colRef(c), W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), kday, shard: (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }, ENGX_MEM_N: 600, VER: 'test', log: (...x) => logs.push(x.join(' ')), mlMod: async () => ML, mlLoadDay: async () => rows, mlSales: async () => sales };
vm.runInNewContext(code + ';this.r04ShadowTick = r04ShadowTick; this.r04Kept = r04Kept; this.R04S = R04S;', ctx);
ok(ctx.r04Kept({ action: 'set', delta: -100, current: 3000 }, 3000) && !ctx.r04Kept({ action: 'set', delta: -100, current: 3000 }, 2900) && !ctx.r04Kept({ action: 'none', delta: 0 }, 3000) && !ctx.r04Kept({ action: 'set', delta: -100, current: 3000, watch: { gid: 'x' } }, 3000) && !ctx.r04Kept({ action: 'set', delta: -100, current: 3000, approvalState: 'applying' }, 3000), '처리 = 내리자 했고 그대로 둠(감시·확정·진행 중·이미 내림은 뺌)');
const before = JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_')));
const r = await ctx.r04ShadowTick(true); const D = store.get('eng_shadow/R04'); const M0 = store.get('eng_shadow_m/R04_00');
ok(r && !r.err && D && D.day === today && D.observeOnly === true && D.loss === 0 && D.kind === 'shadow', '요약 문서 eng_shadow/R04(관찰만 · 손해 0)', r);
ok(D.cnt.treat === 37 && D.cnt.dropsToday === 40 && D.cnt.keptToday === 37, '처리 37 = 내리자 40 − 감시 1 − 확정 1 − 이미 내림 1', D.cnt);
const T = M0.L.filter((m) => m.arm === 'treat'), Cn = M0.L.filter((m) => m.arm === 'control');
ok(Cn.length > 0 && Cn.every((c) => store.get('prd_price_decisions/' + c.key).action === 'none' && !T.some((t) => t.key === c.key)) && Cn.every((c) => c.pair), '대조는 판정 「그대로」인 상품만 · 처리와 안 겹침 · 짝 있음', { c: Cn.length });
ok(T.some((m) => m.key === 'aladin_5008' && m.y && m.y.sold), '판매 붙임');
ok(D.score && D.score.arms && typeof D.score.verdict === 'string' && store.get('eng_shadow_hist/R04_' + today), '채점(expScore)·날마다 기록');
ok(JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_'))) === before && !writes.some((w) => /^prd_|^eng_exp|^app_settings\/strat/.test(w)), '판정·상품·실험 장부·전략 설정은 안 고침(무손해 · eng_fence 그대로)', writes.filter((w) => /^prd_|^eng_exp/.test(w)));
ok((await ctx.r04ShadowTick()) === null, '하루 한 번');
rows[0].price = 2500; await ctx.r04ShadowTick(true); const M1 = store.get('eng_shadow_m/R04_00').L; const x0 = M1.find((m) => m.key === 'aladin_5000');
ok(x0 && x0.out === 'lowered' && x0.outAt && store.get('eng_shadow/R04').cnt.treat === 36 && M1.filter((m) => m.arm === 'treat').length === 37, '처리 상품이 뒤에 내려가면 빠짐(out) · 같은 상품 두 번 안 넣음', store.get('eng_shadow/R04').cnt);
store.set('app_settings/r04_shadow_cfg', { on: false }); ctx.R04S.day = ''; ok((await ctx.r04ShadowTick()).skip === '꺼 둠', '끄기 app_settings/r04_shadow_cfg {on:false}');
ok(/r04ShadowTick\(\)/.test(SRC.slice(SRC.indexOf('async function tick('), SRC.indexOf('async function tick(') + 200000)) && /q\.r04 === 'run'/.test(SRC), '/tick이 하루 한 번 부름 · 진단 ?r04=1·?r04=run');

console.log('C reshealth R04 맥박');
const shadow = { day: today, cnt: { treat: 37, control: 30, out: 1, newTreat: 37, paired: 30 }, score: { verdict: '아직 모름', eff30: null, eff7: { d: -0.05 } } };
const c1 = R.rhRelayCalc({ 'app_settings/strat_run': { n: 0, idle: '배정 없음' }, 'eng_shadow/R04': shadow });
ok(c1.R04 && c1.R04.value === 37 && c1.R04.mfix && /그림자 대조/.test(c1.R04.metric) && /대조 30/.test(c1.R04.note) && /실행한 전략 0/.test(c1.R04.note) && c1.R04.chall === -0.05, '그림자 문서가 있으면 처리 무리 수 · 대조·판정·실행 전략 수는 설명에', c1.R04);
const c2 = R.rhRelayCalc({ 'app_settings/strat_run': { n: 0, idle: '배정 없음' } }); ok(c2.R04 && c2.R04.value === 0 && c2.R04.metric === '실행한 전략 수', '그림자 문서가 없으면 옛 셈');
{ const M2 = new Map(); const C2 = (c) => ({ doc: (id) => ({ get: async () => ({ exists: M2.has(c + '/' + id), data: () => M2.get(c + '/' + id) }), set: async (v, o) => { M2.set(c + '/' + id, o && o.merge ? { ...(M2.get(c + '/' + id) || {}), ...v } : v); } }) });
  M2.set('app_settings/strat_run', { n: 0, idle: '배정 없음' }); M2.set('eng_shadow/R04', shadow); M2.set('app_settings/research_pulse', { studies: { R04: { at: iso(now - 72 * 3600e3), metric: '실행한 전략 수', src: '세션' } } }); let P = null;
  const RH = R.makeResHealth({ C: C2, W: () => ({}), log: () => {}, nowIso: () => iso(now), now: () => now, pulse: async (p) => { P = p; return { n: Object.keys(p.studies).length }; } });
  await RH.relay({ force: true }); ok(P && P.studies.R04 && P.studies.R04.value === 37 && /그림자 대조/.test(P.studies.R04.metric), '맥박에 R04 숫자(옛 지표 이름 대신 새 이름)', P && P.studies.R04); }
console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
