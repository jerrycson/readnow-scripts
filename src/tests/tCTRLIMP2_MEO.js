// tCTRLIMP2_MEO — (ctrlimp2 · 설계 CTRLDES3 1.3~1.9 · 정범님 11/18 23:44 결정) 🔭 판매자 관찰 ① — 판매자 탭 「🔭 관찰」 칩
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 판매자 탭에 이어짐 · 설명서 문단 · 쓰기는 seller_track 문턱 하나뿐
//  ② vm: 지어낸 판매자 12명(9000001~)·책 60권으로 칩마다 맞음/아님/아직 모름 · 같은 등급 이상만 견줌 · 우리 가게 줄은 셈에서 빠짐
//        · 훑기 뒤 Firestore 읽기 0 · 자료가 같으면 다시 안 훑음 · 「새로 겹침」은 지난 훑음(rn-slobs · 7일치)과 견줌 · 휴대폰 얇은 모드 30명 · 문턱 저장
// 실행: node tCTRLIMP2_MEO.js · 판매자는 모두 지어낸 번호 · 실제 기록·손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const d0 = T.indexOf('/* (판 머 · ctrlimp2'), d1 = T.indexOf('/* (판 머) 끝 */'); const MEO = d0 > 0 && d1 > d0 ? T.slice(d0, d1) : '';
const fnBody = (name) => { const i = T.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) return ''; let d = 0, j = T.indexOf('{', i); for (let k = j; k < T.length; k++) { if (T[k] === '{') d++; else if (T[k] === '}' && --d === 0) return T.slice(i, k + 1); } return ''; };
console.log('① 글');
ok(!!MEO, '판 머 덩이가 있음');
{ const names = ['SLOBS_DEF', 'SLOBS_RNG', 'SLOBS_LBL', 'SLOBS_GR', 'SLOBS_CHIPS', 'slObsDump', 'slObsCfg', 'slObsSc', 'slObsDay', 'slObsPrev', 'slObsKeep', 'slObsKey', 'slObsBook', 'slObsScan', 'slObsGc', 'slObsOn', 'slObsFilter', 'slObsWhy', 'slObsBar', 'slObsBind', 'slObsSave'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(MEO), '브라우저 창 없음');
ok(!/\d{2,3}-\d{3,4}-\d{4}/.test(MEO), '전화번호 모양 없음');
ok((MEO.match(/db\.collection\(/g) || []).length === 1 && /db\.collection\('app_settings'\)\.doc\('seller_track'\)\.set\(\{ obs: T, obsAt/.test(MEO) && /\{ merge: true \}/.test(MEO) && !/\.get\(\)|onSnapshot|\.delete\(|\.update\(/.test(MEO), 'Firestore는 문턱 저장(seller_track merge) 하나뿐 · 읽기 없음');
{ const R = fnBody('renderSellers'); ok(/arr = slObsFilter\(arr\);/.test(R) && /\$\{slObsBar\(all\)\}/.test(R) && /\$\{slObsWhy\(s\)\}/.test(R) && /slObsBind\(m\);/.test(R), '판매자 탭에 칩 줄·거르기·근거 줄·누름이 이어짐'); }
ok(/obs: C\.obsMine \|\| null/.test(fnBody('slSaveLocal')) && /S\.slC\.obsDoc = v\.obs/.test(fnBody('slState')), '문턱은 이미 읽는 seller_track·rn-sltrack에 같이 둠(새 읽기 없음)');
ok(/<p><b>🔭 판매자 관찰 \(판 머\)<\/b>/.test(T), '설명서 문단');

console.log('② 흉내 실행');
const LS = new Map(); let READS = 0, WRITES = []; let SCANS = 0;
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite, setTimeout: (f) => 0,
  S: { tab: 'sellers', prCfg: { chaseEng: { sellers: { 9000008: { stance: 'auto' } } } }, bench: { targets: [{ sc: '9000007' }, { sc: '9000010', on: false }] }, user: { email: 't@x' } },
  localStorage: { getItem: (k) => (LS.has(k) ? LS.get(k) : null), setItem: (k, v) => LS.set(k, String(v)) },
  esc: (s) => String(s), errKo: (e) => String(e && e.message), toast: () => {}, renderMain: () => {}, $: () => null, ADMIN: false, isAdminDevice: () => ctx.ADMIN,
  memo: (k, fn) => fn(), slFacts: (s) => ({ fake: String(s.id) === 'sc_9000003', ignore: false }),
  p1Has: (m) => !!m && Array.isArray(m.rows), p1Scan: (m, fn) => { SCANS++; m.rows.forEach((r) => fn(r.sc, r.p, r.g, !!r.so)); },
  db: { collection: (c) => ({ doc: (d) => ({ get: async () => { READS++; return { exists: false }; }, set: async (v, o) => { WRITES.push([c, d, v, o]); } }) }) } };
ctx.slState = () => (ctx.S.slC = ctx.S.slC || { on: [], mode: 'or', order: [], obsMine: null, obsDoc: null }); ctx.slSaveLocal = () => {};
vm.createContext(ctx);
vm.runInContext("var OUR_SC = '996008'; var PHONE_THIN = false;\n" + MEO + '\nthis.F = { SLOBS_DEF, SLOBS_CHIPS, slObsCfg, slObsBook, slObsScan, slObsFilter, slObsWhy, slObsBar, slObsSave, slObsPrev, slObsKeep, slObsDay };', ctx);
const F = ctx.F;
/* 지어낸 자료 — 책 60권 · 우리 값 10000 · 「상」 등급 가운데 값 약 10000 */
const R = (sc, p, g = '상', so) => ({ sc: String(sc), p, g, so });
const books = []; for (let b = 0; b < 60; b++) { const rows = [R(996008, 10000), R(9000001, 10000), R(9000003, 10000), R(9000004, 11000)];
  if (b < 20) rows.push(R(9000002, 5000)); if (b < 3) rows.push(R(9000005, 9000)); if (b < 6) rows.push(R(9000006, 12000), R(9000006, 12500)); if (b < 10) rows.push(R(9000009, 10500, '최상'));
  if (b === 0) rows.push(R(9000007, 13000), R(9000008, 13000), R(9000011, 1000, '상', true)); if (b < 8) rows.push(R(9000012, 9500, '하')); books.push(rows); }
ctx.S.plist = new Map(books.map((x, b) => ['L' + b, { active: true, bookId: 'B' + b, price: 10000 }])); ctx.S.plist.set('Lx', { active: false, bookId: 'B99', price: 1 });
ctx.S.pmetrics = new Map(books.map((rows, b) => ['B' + b, { rows }]));
const sellers = Array.from({ length: 12 }, (_, i) => ({ id: 'sc_' + (9000001 + i), name: '판매자' + String.fromCharCode(65 + i) }));
const Tdef = F.slObsCfg();
ok(JSON.stringify(Tdef) === JSON.stringify({ overlapMin: 10, minHoldPct: 40, fairBand: 15, fairPct: 70, fairMinN: 10, dumpBelow: 70, dumpPct: 50, fastLagMin: 60, sampleMin: 5 }), '문턱 기본 = 설계 1.8 표');
(async () => {
  const prevDay = new Date(Date.now() + 9 * 3600e3 - 86400e3).toISOString().slice(0, 10);
  LS.set('rn-slobs', JSON.stringify([{ d: prevDay, m: { 9000001: 50, 9000003: 60 } }]));
  const map = await F.slObsScan(false); const n0 = SCANS;
  ok(READS === 0 && WRITES.length === 0, '훑기 뒤 Firestore 읽기 0 · 쓰기 0');
  ok(!map.has('996008') && !map.has('9000011'), '우리 가게 줄·품절 줄은 셈에서 빠짐');
  const o = (sc) => [...(map.get(String(sc)) || [])];
  ok(JSON.stringify(o(9000001)) === JSON.stringify([60, 0, 40, 60, 0, 0, 60]), '판매자A: 겹침 60 · 우리와 같은 값이라 「쌈」 아님 · 같은 값 최저는 차지로 셈 · 가운데 값 근처 60', o(9000001));
  ok(o(9000002)[0] === 20 && o(9000002)[1] === 20 && o(9000002)[2] === 20 && o(9000002)[4] === 20, '판매자B: 덤핑 20권 · 우리보다 쌈 20 · 최저가 차지 20', o(9000002));
  ok(o(9000009)[2] === 10 && o(9000009)[6] === 0, '판매자I(최상): 아래 등급이 더 싸도 같은 등급 이상만 견줘 최저가 차지 · 최상 가운데 값은 셀 수 없음', o(9000009));
  ok(o(9000012)[2] === 0, '판매자L(하 9500): 위 등급(상)이 더 싸면 차지 아님 — 상 판매자B 5000이 있는 책만이 아니라 8권 모두', o(9000012));
  ok(o(9000006)[0] === 6 && o(9000006)[5] === 6, '판매자F: 같은 책 여러 매물 6권(겹침은 책 하나로 셈)', o(9000006));
  const V = (k, sc) => { const c = F.SLOBS_CHIPS.find((x) => x[0] === k); return c[3](map.get(String(sc)) || [0, 0, 0, 0, 0, 0, 0], Tdef, ctx.slFacts({ id: 'sc_' + sc }), String(sc)); };
  const exp = [['ov', 9000001, true], ['ov', 9000005, false], ['hold', 9000001, true], ['hold', 9000004, false], ['hold', 9000005, null], ['hold', 9000009, true],
    ['cheap', 9000002, true], ['cheap', 9000001, false], ['cheap', 9000005, null], ['fair', 9000001, true], ['fair', 9000003, false], ['fair', 9000002, false], ['fair', 9000009, null], ['fair', 9000006, null],
    ['dump', 9000002, true], ['dump', 9000001, false], ['dump', 9000005, null], ['multi', 9000006, true], ['multi', 9000001, false], ['multi', 9000005, null],
    ['new', 9000001, true], ['new', 9000003, false], ['new', 9000004, true], ['new', 9000005, false], ['stance', 9000008, true], ['stance', 9000001, false], ['bench', 9000007, true], ['bench', 9000010, false], ['bench', 9000001, false]];
  const miss = exp.filter(([k, sc, e]) => V(k, sc) !== e).map(([k, sc, e]) => [k, sc, e, V(k, sc)]); ok(!miss.length, `칩마다 맞음/아님/아직 모름 ${exp.length}가지(가짜 판정 판매자C는 모범 아님 · 표본 적은 판매자E는 모름)`, miss);
  await F.slObsScan(false); ok(SCANS === n0, '자료가 같으면 다시 훑지 않음');
  await F.slObsScan(true); ok(SCANS === n0 * 2, '「다시 훑기」는 새로 훑음');
  const L = JSON.parse(LS.get('rn-slobs')); ok(L.length === 2 && L[0].d === F.slObsDay() && L[0].m['9000001'] === 60 && L[1].d === prevDay, '지난 훑음 요약 rn-slobs = 하루 한 벌(판매자별 겹침 수만)');
  { const many = Array.from({ length: 9 }, (_, i) => ({ d: '2026-10-0' + (i + 1), m: {} })); LS.set('rn-slobs', JSON.stringify(many)); F.slObsKeep(new Map([['9000001', [1, 0, 0, 0, 0, 0, 0]]])); ok(JSON.parse(LS.get('rn-slobs')).length === 7, 'rn-slobs는 7일치까지'); }
  LS.delete('rn-slobs'); ctx.S._slObs.prev = null; ok(V('new', 9000001) === null, '지난 훑음이 없으면 새로 겹침은 아직 모름');
  ctx.S._slObs.prev = null; LS.set('rn-slobs', JSON.stringify([{ d: prevDay, m: { 9000001: 50 } }]));
  // 거르기(그리고) · 정렬 · 근거 줄
  ctx.S._slObs.on = ['ov', 'dump']; let out = F.slObsFilter(sellers); ok(out.length === 1 && out[0].id === 'sc_9000002', '칩 여러 개 = 그리고(겹침 많음 + 덤핑 → 판매자B)', out.map((s) => s.id));
  ctx.S._slObs.on = ['hold']; out = F.slObsFilter(sellers); ok(out[0].id === 'sc_9000002' && out.every((s) => V('hold', s.id.slice(3)) === true), '첫 칩 숫자 큰 차례(최저가 차지 비율)', out.map((s) => s.id));
  ok(/겹침 60권 · 우리보다 쌈 0 · 최저가 차지 40\(67%\)/.test(F.slObsWhy(sellers[0])) && /아직 모름/.test(F.slObsWhy(sellers[4])), '줄마다 근거 숫자 · 표본 적으면 「아직 모름」');
  ctx.S._slObs.on = []; ok(F.slObsFilter(sellers).length === 12 && F.slObsWhy(sellers[0]) === '', '칩이 없으면 목록 그대로');
  const H = F.slObsBar(sellers); ok(/🧲 겹침 많음 [0-9]/.test(H) && /아직 모름/.test(H) && /훑은 때/.test(H) && !/disabled/.test(H), '칩 줄: 훑은 뒤 숫자 · 아직 모름 수 · 훑은 때');
  // 휴대폰 얇은 모드
  ctx.PHONE_THIN = true; const many = Array.from({ length: 50 }, (_, i) => ({ id: 'sc_' + (9100001 + i) })); for (const s of many) ctx.S._slObs.map.set(s.id.slice(3), [20 + Number(s.id.slice(-2)), 0, 0, 0, 0, 0, 0]);
  ctx.S._slObs.on = ['ov']; out = F.slObsFilter(many); ok(out.length === 30 && out[0].id === 'sc_9100050', '📱 휴대폰은 겹침 많음 위 30명만');
  ok((F.slObsBar(sellers).match(/disabled title="PC에서 볼 수 있습니다"/g) || []).length === 8, '📱 나머지 칩은 「PC에서 볼 수 있습니다」'); ctx.PHONE_THIN = false;
  // 문턱
  ctx.S.slC.obsDoc = { overlapMin: 20, sampleMin: 'x', dumpBelow: 5 }; ctx.S.slC.obsMine = { overlapMin: 30 }; const T2 = F.slObsCfg(); ok(T2.overlapMin === 30 && T2.sampleMin === 5 && T2.dumpBelow === 70, '문턱: 이 기기 값 > 기기 사이 값 > 기본 · 틀린 값·범위 밖은 기본');
  WRITES = []; ctx.ADMIN = false; await F.slObsSave({ overlapMin: 12 }); ok(!WRITES.length && ctx.S.slC.obsMine.overlapMin === 12, '관리자 기기가 아니면 이 기기에만(쓰기 없음)');
  ctx.ADMIN = true; await F.slObsSave({ overlapMin: 15, fairPct: 999 }); const w = WRITES[0] || [];
  ok(WRITES.length === 1 && w[0] === 'app_settings' && w[1] === 'seller_track' && w[3] && w[3].merge === true && Object.keys(w[2]).join() === 'obs,obsAt,obsBy' && w[2].obs.overlapMin === 15 && w[2].obs.fairPct === 70, '관리자 기기: seller_track에 obs만 merge(틀린 값은 기본)', w);
  ok(READS === 0, '시험 내내 Firestore 읽기 0');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
