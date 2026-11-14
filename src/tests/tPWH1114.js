/* tPWH1114 — (일꾼 pwatch1 · 정범님 F42 「엔진이 스스로 알아채게」) 🛰 가격 감시기 판정 대상 0 스스로 알아채기
 *  ① cloud/index.js PWH-START~PWH-END만 떼어 돌림(가짜 Firestore + 실제 readnow-pricing-core.js):
 *     처음 한 번은 감시 PC 기록으로 지난 회차를 채움 · 0이 3회차 연달아면 alarm · 까닭(어느 조건이 다 걸렀나) · 설정 탓(setting)과 고장 의심(mismatch) 가름 · 회차 기록에 zeroWhy · 같은 회차는 다시 안 셈 · 30시간 넘게 회차 없음(stale)
 *     값·판정·설정 문서(prd_system/pricing·prd_price_decisions·prd_listings)는 안 고침
 *  ② 웹앱(src/app.html): 홈 알림 'pwh' · 가격 감시 카드 pwhLine · 알림 누르면 가격 감시 카드 · 브라우저 팝업 없음 · 듣기만(쓰지 않음)
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tPWH1114.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const src = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const a = src.indexOf('PWH-START'); const b = src.indexOf('/* PWH-END */'); const code = src.slice(src.indexOf('*/', a) + 2, b);
const pctx = { console }; pctx.window = pctx; vm.createContext(pctx); vm.runInContext(fs.readFileSync(findUp('readnow-pricing-core.js'), 'utf8'), pctx); const PRC = pctx.ReadnowPricing;
(async () => {
console.log('① 클라우드 pwHealthTick');
const store = new Map(); const writes = []; const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v)); const get = (k) => store.get(k);
const docRef = (col, id) => ({ get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : clone(v)) }; },
  set: async (v, o) => { writes.push(col + '/' + id); const old = (o && o.merge && store.get(col + '/' + id)) || {}; store.set(col + '/' + id, clone({ ...old, ...v })); } });
const pick = (v, f) => { let x = v; for (const p of f.split('.')) x = x == null ? undefined : x[p]; return x; };
const colRef = (col, F = []) => ({ doc: (id) => docRef(col, id), select: () => colRef(col, F), where: (f, op, val) => colRef(col, [...F, [f, op, val]]),
  get: async () => { const L = [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => ({ id: k.slice(col.length + 1), v }))
    .filter(({ id, v }) => F.every(([f, op, val]) => { const x = f === '__id__' ? id : pick(v, f); return op === '==' ? x === val : op === 'in' ? val.includes(x) : op === '>=' ? x >= val : op === '<=' ? x <= val : false; }))
    .map(({ id, v }) => ({ id, data: () => clone(v) })); return { docs: L, size: L.length, forEach: (fn) => L.forEach(fn) }; } });
const logs = []; const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, console, Promise,
  C: (c) => colRef(c), W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), log: (...x) => logs.push(x.join(' ')), FieldPath: { documentId: () => '__id__' }, nodeCls: async () => ({ PRC }) };
vm.runInNewContext(code + ';this.pwHealthTick = pwHealthTick; this.PWH = PWH; this.pwhParseLogs = pwhParseLogs; this.pwhStreak = pwhStreak;', ctx);
// 판매중 50권 · 적용 0% · 비교 0% · 켜진 감시 그룹 없음 = 정범님 설정이 대상을 모두 거름
for (let i = 0; i < 50; i++) store.set('prd_listings/aladin_' + (5000 + i), { status: '판매중', usedCode: String(5000 + i), sku: i < 3 ? 'KHKDVD01' : 'A' + i, price: 3000 });
store.set('prd_listings/aladin_9999', { status: '판매완료', usedCode: '9999', sku: 'A' });
const P0 = { enabled: true, killSwitch: false, rollout: { treatPct: 0, controlPct: 0 }, excludeSku: ['KHKDVD'], watchPc: 'HOME', updatedAt: '2026-10-08T04:59:51.465Z', updatedBy: 'admin@example.com' };
store.set('prd_system/pricing', clone(P0));
store.set('prd_price_batches/b_off', { name: '끈 그룹', watch: { on: false, mode: 'auto' } });
store.set('rn_logs/HOME_202611120850', { slot: '202611120850', lines: ['08:52:18 [가격 감시] 새 바퀴 시작: 감시 상품 0개', '08:52:18 [가격 감시] 한 바퀴 끝: 성공 0 · 실패 0'] });
store.set('rn_logs/HOME_202611111300', { slot: '202611111300', lines: ['13:00:50 [가격 감시] 새 바퀴 시작: 감시 상품 0개'] });
store.set('rn_logs/JS-MAIN_202611120850', { slot: '202611120850', lines: ['08:52:18 [가격 감시] 새 바퀴 시작: 감시 상품 77개'] });
const day = (h) => iso(now - h * 3600e3); store.set('prd_system/pricing_run', { cycleId: day(7), startedAt: day(7), keys: [], idx: 0, pc: 'HOME', done: 0, fail: 0, ver: '0.10.48' });
const keep = JSON.stringify([...store.entries()].filter(([k]) => /^(prd_listings|prd_price_decisions|prd_price_batches)\//.test(k) || k === 'prd_system/pricing'));
ok(ctx.pwhParseLogs([{ slot: '202611120850', lines: ['08:52:18 [가격 감시] 새 바퀴 시작: 감시 상품 12개', '다른 줄'] }])[0].n === 12, '기록 줄에서 회차·대상 수 읽기');
ok(ctx.pwhStreak([{ n: 0 }, { n: 0 }, { n: 5 }, { n: 0 }]) === 2, '연달아 0 세기(0 아닌 회차에서 끊김)');
const r1 = await ctx.pwHealthTick(true); const H1 = get('prd_system/pricing_health');
ok(r1 && r1.zeroStreak === 3 && r1.alarm === true && r1.kind === 'setting', '처음: 감시 PC 기록 2회차 + 지금 회차 = 0이 3회차 → 경보 · 까닭 = 설정', r1);
ok(H1 && H1.cycles.length === 3 && H1.cycles.every((c) => c.n === 0) && !H1.cycles.some((c) => c.n === 77), '다른 PC 기록은 안 섞음', H1 && H1.cycles);
ok(H1.why && H1.why.cnt.onSale === 50 && H1.why.cnt.excluded === 3 && H1.why.cnt.off === 47 && H1.why.groups.on === 0 && H1.why.expect === 0, '어느 조건이 걸렀나 — 판매중 50 · 자동 제외 3 · 비율 밖 47 · 켜진 감시 그룹 0', H1.why);
ok(/적용 0%·비교 0%/.test(H1.line) && /고장 아님/.test(H1.line) && /^🚨/.test(H1.line), '한 줄(🚨 · 설정 탓이면 고장 아님)', H1.line);
const RZ = get('prd_system/pricing_run').zeroWhy; ok(RZ && RZ.kind === 'setting' && RZ.streak === 3 && RZ.filters.length === 3, '회차 기록(pricing_run.zeroWhy)에 대상 0의 까닭', RZ);
ok(get('prd_system/pricing_run').keys.length === 0 && get('prd_system/pricing_run').ver === '0.10.48', '감시기 칸(keys·ver)은 그대로');
const r2 = await ctx.pwHealthTick(); ok(r2 === null, '30분 안엔 다시 안 셈'); ctx.PWH.at = 0; const r3 = await ctx.pwHealthTick(); ok(r3 && r3.same === 1, '같은 회차는 다시 안 셈(판매중 다시 읽지 않음)', r3);
// 다음 회차: 정범님이 적용 30%로 올렸는데 감시기 회차가 여전히 0 → 고장 의심
store.set('prd_system/pricing', { ...clone(P0), rollout: { treatPct: 30, controlPct: 0 } }); store.set('prd_system/pricing_run', { cycleId: day(1), startedAt: day(1), keys: [], pc: 'HOME', ver: '0.10.48' }); ctx.PWH.at = 0;
const r4 = await ctx.pwHealthTick(); const H4 = get('prd_system/pricing_health'); ok(r4.zeroStreak === 4 && r4.kind === 'mismatch' && H4.why.expect > 0 && /고장 의심/.test(H4.line), '설정대로면 대상이 있는데 0 → 고장 의심(mismatch)', H4.line);
// 감시 그룹 켬 + 대상이 생긴 회차 → 경보 풀림
store.set('prd_price_batches/b_on', { name: '켠 그룹', watch: { on: true, mode: 'auto' } }); store.set('prd_price_decisions/aladin_5010', { watch: { gid: 'b_on' } });
store.set('prd_system/pricing_run', { cycleId: day(0.5), startedAt: day(0.5), keys: ['aladin_5010', 'aladin_5011'], pc: 'HOME', ver: '0.10.50' }); ctx.PWH.at = 0;
const r5 = await ctx.pwHealthTick(); const H5 = get('prd_system/pricing_health'); ok(r5.zeroStreak === 0 && r5.alarm === false && H5.line == null && H5.why == null && H5.n === 2, '대상이 생긴 회차 → 경보 풀림', H5);
// 판정 켜짐인데 회차가 31시간 없음 → stale
store.set('prd_system/pricing_run', { ...get('prd_system/pricing_run'), startedAt: day(31) }); ctx.PWH.at = 0; await ctx.pwHealthTick(); const H6 = get('prd_system/pricing_health');
ok(H6.stale === true && H6.alarm === true && /회차가 31시간째 없음/.test(H6.line), '회차가 30시간 넘게 없음 → 🚨', H6.line);
store.set('prd_system/pricing', { ...get('prd_system/pricing'), enabled: false }); ctx.PWH.at = 0; await ctx.pwHealthTick(); ok(get('prd_system/pricing_health').stale === false, '판정을 꺼 두면(정범님 설정) 멈춤 경보 안 냄');
store.delete('prd_price_batches/b_on'); store.delete('prd_price_decisions/aladin_5010'); store.set('prd_system/pricing', clone(P0));
ok(JSON.stringify([...store.entries()].filter(([k]) => /^(prd_listings|prd_price_decisions|prd_price_batches)\//.test(k) || k === 'prd_system/pricing')) === keep && !writes.some((w) => /^(prd_listings|prd_price_decisions|prd_price_batches)\/|^prd_system\/pricing$/.test(w)), '값·판정·설정 문서는 안 씀(쓰는 곳 = pricing_health · pricing_run.zeroWhy)', [...new Set(writes)]);
ok(/if \(q\.pwhealth\)/.test(src) && /tm\('pwh', \(\) => pwHealthTick\(\)\)/.test(src), '진단 pwhealth=1 · 클라우드 주기 일에 붙음');
console.log('② 웹앱');
const app = fs.readFileSync(findUp('src/app.html'), 'utf8'); const wb = app.slice(app.indexOf('PWH-WEB-START'), app.indexOf('PWH-WEB-END'));
ok(/function pwhWatch\(\)/.test(wb) && /function pwhLine\(\)/.test(wb) && /function pwhDetail\(H\)/.test(wb), 'pwhWatch·pwhLine·pwhDetail 있음');
ok(wb.length > 300 && !/\b(alert|confirm|prompt)\(/.test(wb) && !/\.set\(|\.update\(|\.add\(/.test(wb), '브라우저 팝업 없음 · 듣기만(쓰지 않음)');
ok(/add\(H\.stale \|\| w\.kind === 'mismatch' \? 'red' : 'amber', H\.line, 'pwh'/.test(app), '홈 알림(고장 의심·멈춤 = 빨강 · 설정 탓 = 노랑)');
ok(/\$\{wireLine\('price'\)\}\$\{pwhLine\(\)\}/.test(app), '가격 감시 카드에 한 줄 + 진단 칸');
ok(/if \(key === 'pwh'\)[^\n]{0,300}data-blk="p_watch"/.test(app), '알림을 누르면 상품 › 가격 감시 카드');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
