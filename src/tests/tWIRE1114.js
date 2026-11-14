/* tWIRE1114 — (일꾼 wire1 · 정범님 11/14 16:23 「연구 결과가 실제 판단에 쓰이도록 … 체계를」) 🔌 배선 그림자 장부(1단계)
 *  ① cloud/index.js WIRE-START~WIRE-END만 떼어 돌림: wireEval(W01 팔릴 확률 · W02 소비심리 내일 주문 · W08 판매자 가치) — 읽음·바뀌었을 판단
 *  ② wireTick 전체(가짜 Firestore + 실제 readnow-ml-core.js): eng_wire·eng_wire_m(R17 꼴 treat/control 같은 칸 짝)·eng_wire_hist·app_settings/eng_wires 씀 · 판정 기록(prd_price_decisions)은 안 고침(무손해)
 *  ③ 웹앱(src/app.html): wireRd 읽은 횟수 셈(W00·W02·W03·W04·W07·W10·W12·W17) · 가격 감시 카드 wireLine('price') · alert/confirm/prompt 없음
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tWIRE1114.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const src = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const a = src.indexOf('WIRE-START'); const b = src.indexOf('/* WIRE-END */'); const code = src.slice(src.indexOf('*/', a) + 2, b);
const ML = require(findUp('readnow-ml-core.js'));
(async () => {
console.log('① wireEval');
const store = new Map(); const writes = []; const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const today = kday(now);
const docRef = (col, id) => ({ get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; }, set: async (v, o) => { writes.push(col + '/' + id); const old = (o && o.merge && store.get(col + '/' + id)) || {}; store.set(col + '/' + id, { ...old, ...JSON.parse(JSON.stringify(v)) }); } });
const colRef = (col) => ({ doc: (id) => docRef(col, id), select: () => colRef(col), get: async () => { const L = [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)) })); return { forEach: (f) => L.forEach(f), docs: L }; } });
const rows = []; const decs = {}; const pcK = [], pcV = []; for (let i = 0; i < 60; i++) { const key = 'aladin_' + (1000 + i); rows.push({ key, price: 3000 + (i % 6) * 500, grade: i % 3, age: 30 + i * 3, list: 12000, sp: 100 + (i % 4) * 400, p1: 10, rank: 1 + (i % 5) });
  pcK.push(key); pcV.push(i / 60); decs[key] = { status: 'ok', action: i % 2 ? 'set' : 'none', delta: i % 2 ? -200 : 0, current: 3000, target: i % 2 ? 2800 : null, tier: { days: 30 + i * 3 }, at: iso(now - 3600e3), usedCode: String(1000 + i), ...(i % 7 === 0 ? { peerShadow: { status: 'ok', action: 'set', target: 2500, same: false } } : i % 7 === 1 ? { peerShadow: { status: 'ok', action: 'none', same: true } } : {}) }; }
decs['aladin_old'] = { status: 'ok', action: 'set', delta: -100, at: iso(now - 50 * 3600e3) };
for (const [k, v] of Object.entries(decs)) store.set('prd_price_decisions/' + k, v);
store.set('app_settings/ml_state', { lastDay: today }); store.set('app_settings/cons_study', { at: iso(now - 3600e3), sig: [{ k: 'tmr', e: -0.12 }] });
store.set('app_settings/eng_wire_reads_' + today.slice(0, 7), { d: { [today]: { W00: 5, W02: 2 } } });
const logs = []; const sales = new Map([['1001', [{ at: now - 1000, price: 2800 }]]]);
const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, console, Promise,
  C: (c) => colRef(c), W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), kday, shard: (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }, ENGX_MEM_N: 600, VER: 'test', log: (...x) => logs.push(x.join(' ')),
  mlMod: async () => ML, mlLoadDay: async () => rows, mlShadowLoad: async () => ({ at: iso(now - 2 * 3600e3), keys: pcK, pc: pcV, ph: pcV }), mlSales: async () => sales };
vm.runInNewContext(code + ';this.wireEval = wireEval; this.wireQ = wireQ; this.wireTick = wireTick; this.WIRE_DEF = WIRE_DEF;', ctx);
const E = ctx.wireEval; const drop = { action: 'set', delta: -300, status: 'ok', tier: { days: 200 } }, keep = { action: 'none', delta: 0, status: 'ok', tier: { days: 200 } };
ok(E('W01', drop, { pc: 0.9, hi: 0.8, lo: 0.2 }).would === 'delay', 'W01 내림 + 팔릴 확률 상위 20% → 미룸');
ok(E('W01', keep, { pc: 0.1, hi: 0.8, lo: 0.2 }).would === 'advance', 'W01 그대로 + 하위 20% · 재고 90일 넘음 → 앞당김');
ok(E('W01', { ...keep, tier: { days: 30 } }, { pc: 0.1, hi: 0.8, lo: 0.2 }).would === null, 'W01 재고 90일 안이면 앞당기지 않음');
ok(E('W01', drop, { pc: null, hi: 0.8 }).read === false, 'W01 값이 없으면 읽음 아님');
ok(E('W02', drop, { e: -0.12 }).would === 'delay' && E('W02', drop, { e: 0.1 }).would === null && E('W02', keep, { e: -0.2 }).would === null, 'W02 내일 주문 −5% 넘게 줄면 내림만 미룸');
ok(E('W08', { ...drop, peerShadow: { status: 'ok', action: 'set', target: 2500, same: false } }).would === 'peer' && E('W08', { ...drop, peerShadow: { status: 'ok', same: true } }).would === null && E('W08', drop).read === false, 'W08 그림자가 다른 판정이면 바뀜 · 없으면 읽음 아님');
ok(ctx.wireQ([5, 1, 3, 2, 4], 0.8) === 4 && ctx.wireQ([], 0.5) === null, '분위 셈');
ok(Object.values(ctx.WIRE_DEF).every((d) => d.stage <= 2), '코드 단계는 2 이하(3단계 실제 판단은 꺼짐)');
console.log('② wireTick 전체');
const before = JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_price_decisions/')));
const r = await ctx.wireTick(true); ok(r && r.n === 3 && !r.err, '세 배선 셈', r);
const S = store.get('app_settings/eng_wires'); ok(S && S.day === today && S.w.W01 && S.w.W02 && S.w.W08, '요약 문서', S && Object.keys(S.w || {}));
ok(S.w.W01.reads === 60 && S.w.W02.reads === 60 && S.w.W08.reads > 0 && S.decs === 60, '오늘 읽은 횟수(36시간 넘은 판정은 뺌)', S.w);
ok(S.web && S.web.W00 === 5, '웹앱이 읽은 횟수도 요약에');
ok(S.w.W02.would.delay === 30, 'W02 내림 30개 모두 미뤘을 것', S.w.W02.would);
const M1 = store.get('eng_wire_m/W01_00'); ok(M1 && M1.L.some((m) => m.arm === 'treat' && m.d && m.d.would) && M1.L.some((m) => m.arm === 'control' && m.pair), 'R17 꼴 처리·대조 짝(같은 칸)', M1 && M1.L.slice(0, 3));
const t = M1.L.filter((m) => m.arm === 'treat'), c = M1.L.filter((m) => m.arm === 'control'); ok(c.every((x) => !t.some((y) => y.key === x.key)) && t.every((x) => x.start > 0), '대조는 처리와 겹치지 않음 · 시작 값');
ok(M1.L.some((m) => m.key === 'aladin_1001' && m.y && m.y.sold) || !M1.L.some((m) => m.key === 'aladin_1001'), '판매 붙이기(있으면)');
const D1 = store.get('eng_wire/W01'); ok(D1 && D1.kind === 'wire' && D1.score && D1.score.arms && D1.stage === 1 && D1.reads[today] === 60 && Array.isArray(D1.log), 'eng_wire 문서(R17 eng_exp 칸 + 단계·읽음·기록)', D1 && Object.keys(D1));
ok(store.get('eng_wire_hist/W01_' + today), '날마다 eng_wire_hist');
ok(JSON.stringify([...store.entries()].filter(([k]) => k.startsWith('prd_price_decisions/'))) === before && !writes.some((w) => /^prd_|^eng_exp/.test(w)), '판정 기록·실험 장부는 안 고침(무손해)', writes.filter((w) => /^prd_|^eng_exp/.test(w)));
const r2 = await ctx.wireTick(); ok(r2 === null, '하루 한 번(다시 부르면 셈 안 함)');
store.get('eng_wire/W01').stage = 2; store.set('eng_wire/W01', { ...store.get('eng_wire/W01'), stage: 2 }); await ctx.wireTick(true); ok(store.get('eng_wire/W01').stage === 2 && store.get('eng_wire_m/W01_00').L.filter((m) => m.arm === 'treat').length === t.length, '엔진 회차가 고친 단계를 덮지 않음 · 같은 상품 두 번 안 넣음');
console.log('③ 웹앱');
const app = fs.readFileSync(findUp('src/app.html'), 'utf8');
ok(/function wireRd\(id\)/.test(app) && /function wireLine\(where\)/.test(app), 'wireRd·wireLine 있음');
for (const [id, re] of [['W00', /function vrEval[\s\S]{0,1200}wireRd\('W00'\)/], ['W02', /wireRd\(where === 'price' \? 'W02' : 'W03'\)/], ['W04', /function voRegLine[\s\S]{0,400}wireRd\('W04'\)/], ['W07', /function regBbFloor[\s\S]{0,400}wireRd\('W07'\)/], ['W10', /function fbStrats[\s\S]{0,300}wireRd\('W10'\)/], ['W12', /wireRd\('W12'\)/], ['W17', /wireRd\('W17'\)/]]) ok(re.test(app), `${id} 받는 자리에서 읽은 횟수 셈`);
ok(/consSigLine\('price'\)\}\$\{wireLine\('price'\)\}/.test(app), '가격 감시 카드 안내 줄 자리 재사용');
const wb = app.slice(app.indexOf('WIRE-WEB-START'), app.indexOf('WIRE-WEB-END')); ok(wb.length > 200 && !/\b(alert|confirm|prompt)\(/.test(wb), '브라우저 팝업 없음');
ok(/eng_wire_reads_/.test(wb) && /FieldValue\.increment/.test(wb), '읽은 횟수 = app_settings/eng_wire_reads_{달} 더하기');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
