/* tCTRLHIST_1120 — (11/20 ctrlhist1 · 정범님 I-1120-1430-27e) 관제소 판매수 한 뜻 · 지난 기록 채우기 시험
 *  ① 판매 셈 뜻: 알라딘 판매만(ckAlSale — 예스24·현금(가게)·직접 뺌) · 최근 30일에 현금·가게 따로(c·camt) · 한국 날짜(Z 붙은 세계 시각 주문도 ckOAt로)
 *  ② 묶음 판매수: 판매중이 아닌(팔린) 상품도 오늘 그룹 조건으로 되짚어(batchFilter past) 묶음 상품 모음에 넣음(ckFoldSoldKeys) · ckLineIn 그대로 씀
 *  ③ 총 상품수 어림 줄(ckTotEst · 2025-09-26부터): 등록~판매·내림 사이만 셈 · 화면에 어림/실측 구분 · 어제 대비는 어림 점을 안 씀
 *  ④ 클라우드 지난 날 채우기(ctrlKpiRebuild): 이미 있는 날은 건드리지 않음 · 고른 칸만 씀 · 지우기 없음 · 진단 kpi=reb
 *  손님 이름·전화 없음 · 팝업 없음 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const H = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const HL = H.split('\n');
let fail = 0; const ok = (c, m, x) => { if (c) console.log('  ✅ ' + m); else { fail++; console.log('  ❌ ' + m + (x !== undefined ? ' ' + JSON.stringify(x).slice(0, 300) : '')); } };
function grab(name) { const re = new RegExp('^(async )?function ' + name + '\\(|^const ' + name + ' = '); const i = HL.findIndex((l) => re.test(l)); if (i < 0) throw new Error('못 찾음: ' + name);
  let acc = ''; for (let j = i; j < i + 80; j++) { acc += HL[j] + '\n'; try { new vm.Script(acc); return acc; } catch (e) {} } throw new Error('못 뗌: ' + name); }
function ctx0(extra) { const ctx = vm.createContext({ console, Map, Set, WeakMap, Date, JSON, Math, String, Number, isFinite, Array, Object, Int32Array, Infinity, ...(extra || {}) }); const got = new Set();
  ctx.__load = (n) => { if (got.has(n)) throw new Error('또 빠짐: ' + n); got.add(n); vm.runInContext(grab(n).replace(/^const /, 'var '), ctx); }; return ctx; }
function run(ctx, code) { for (let t = 0; t < 40; t++) { try { return vm.runInContext(code, ctx); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; ctx.__load(m[1]); } } throw new Error('이름이 너무 많이 빠짐'); }
const ord = (o) => ({ kind: 'sale', items: [{ lineStatus: 'normal', aladinUsedCode: '1', qty: 1, price: 1000 }], ...o });
const kIso = (day, hm) => new Date(Date.parse(day + 'T' + hm + ':00+09:00')).toISOString(); /* 한국 시각 → Z 붙은 세계 시각 글 */

console.log('① 판매 셈 뜻 — 알라딘만 · 현금·가게 따로 · 한국 날짜');
{ const ctx = ctx0(); ctx.S = { orders: new Map(), plist: new Map(), dv: { o: 1 } };
  const f = (o) => run(ctx, 'ckAlSale(' + JSON.stringify(o) + ')');
  ok(f({ kind: 'sale', platform: 'aladin' }) && f({ kind: 'sale' }), '알라딘(또는 칸 없는 옛 주문)은 셈');
  ok(!f({ kind: 'sale', platform: 'yes24' }) && !f({ kind: 'sale', ch: 'yes24' }), '예스24 뺌');
  ok(!f({ kind: 'sale', platform: 'cash' }) && !f({ kind: 'sale', ch: 'shop' }) && !f({ kind: 'sale', platform: 'direct' }), '현금·가게·직접 판매 뺌');
  ok(!f({ kind: 'cancel', platform: 'aladin' }), '판매가 아닌 주문 뺌');
  const today = run(ctx, 'ckDay()'), d30 = run(ctx, 'ckDay(Date.now() - 29 * 864e5)'), d31 = run(ctx, 'ckDay(Date.now() - 30 * 864e5)');
  const O = ctx.S.orders; let i = 0; const put = (o) => O.set('o' + i++, ord(o));
  put({ platform: 'aladin', orderedAt: kIso(today, '10:00') });
  put({ platform: 'aladin', orderedAt: kIso(d30, '00:30') }); /* 세계 시각으로는 그 앞날 15:30 — 예전 앞 10자 셈이면 빠졌음 */
  put({ platform: 'aladin', orderedAt: kIso(d31, '23:30') }); /* 30일 밖 */
  put({ platform: 'cash', orderedAt: today + ' 11:00', items: [{ lineStatus: 'normal', qty: 2, price: 3000 }] });
  put({ ch: 'shop', orderedAt: today + 'T12:00', items: [{ lineStatus: 'normal', qty: 1, price: 500 }] });
  put({ platform: 'yes24', orderedAt: today + 'T12:00' });
  put({ platform: 'aladin', orderedAt: today + 'T13:00', items: [{ lineStatus: 'cancel', qty: 1, price: 1000 }] });
  const r = run(ctx, 'ckSold30()');
  ok(r.q === 2 && r.amt === 2000, '최근 30일 알라딘 2권(오늘 1 + 30일째 한국 00:30 1 · 30일 밖·취소 줄 뺌)', r);
  ok(r.c === 3 && r.camt === 6500, '현금·가게 따로 3권 · 6,500원', r);
  ok(r.y === 1 && r.from === d30 && r.to === today, '예스24 따로 1 · 기간 글(from·to)', r);
  O.clear(); ctx.S.dv.o++; O.set('z', ord({ platform: 'aladin', orderedAt: '2026-11-19T16:30:00.000Z' })); O.set('c', ord({ platform: 'cash', orderedAt: '2026-11-19T10:00' }));
  const A = run(ctx, 'ckSoldAgg(null, "t1")');
  ok(A.A.has('2026-11-20') && !A.A.has('2026-11-19') && A.A.get('2026-11-20').q === 1, '세계 시각 11/19 16:30Z = 한국 11/20 01:30 → 11/20 날 칸', [...A.A.keys()]);
  ok(A.first === '2026-11-20', '현금 주문은 날 칸·첫 날에서도 뺌', A.first);
  const wdSum = A.wd.flat().reduce((s, v) => s + v, 0); ok(wdSum === 1 && A.wd[5][1] === 1, '요일·시각도 한국 시각(금 01시)');
  const P = run(ctx, 'ckSoldPer(null, "all")'); ok(P && P.a && P.a.c === 1, '기간 표(ckSoldPer)도 현금 뺌 · 전체 1권', P && P.a);
}

console.log('② 묶음 판매수 — 팔린 상품도 되짚음');
{ ok(/function batchFilter\(c, gid, opt\) \{\n  const past = !!\(opt && opt\.past\);/.test(H), 'batchFilter(…, {past:1}) 갈래');
  ok(/\(past \? l\.status === '판매중' : l\.status !== '판매중'\) \|\| !l\.usedCode/.test(H), 'past면 판매중이 아닌 상품만 · 아니면 예전 그대로(판매중만)');
  ok(/c\.exCtrl !== false && !past/.test(H) && /const exPx = !past &&/.test(H) && /c\.rest && gid && !past/.test(H), 'past면 비교군·조회 실험·나머지 빼기는 안 함(그때 일이라 모름)');
  const ctx = ctx0(); ctx.S = { plist: new Map([['aladin_1', {}], ['aladin_2', {}], ['aladin_3', {}]]), dv: { p: 1 } };
  const base = new Set(['aladin_1']); let calls = 0;
  ctx.ckFoldKeys = () => base; ctx.bkfGroups = () => [{ id: 'g1' }, { id: 'g2' }]; ctx.bkfCond = (g) => ({ g: g.id }); ctx.bkfSig = (gs) => gs.map((g) => g.id).join(',');
  ctx.batchFilter = (c, gid, o) => { calls++; if (!o || !o.past) throw new Error('past 아님'); return gid === 'g1' ? [{ usedCode: '2' }] : [{ usedCode: '2' }, { usedCode: '3' }]; };
  const s = run(ctx, 'ckFoldSoldKeys("f1")'); ok(s.has('aladin_1') && s.has('aladin_2') && s.has('aladin_3') && s.size === 3 && s.past === 2, '지금 묶음 상품 + 팔린 상품(두 그룹 겹침 한 번)', [...s]);
  ok(!base.has('aladin_2'), '바탕 모음(ckFoldKeys)은 바꾸지 않음'); const s2 = run(ctx, 'ckFoldSoldKeys("f1")'); ok(s2 === s && calls === 2, '같은 판이면 기억(다시 안 셈)');
  ok(/ckLineIn\(it, k, keys, isb, oms\)/.test(H) && (H.match(/^function ckLineIn\(/gm) || []).length === 1, 'isbnall1 ckLineIn 그대로 씀(하나만)');
  ok(/const keys = sc === 'fold' \? ckFoldSoldKeys\(fid\) : null/.test(H), '판매수 창(ckWinSold) = ckFoldSoldKeys');
  ok(/ctrlKpiPer[\s\S]{0,600}ckFoldSoldKeys/.test(H), '기간 표(ctrlKpiPer)도 ckFoldSoldKeys');
}

console.log('③ 총 상품수 어림 줄');
{ const ctx = ctx0(); const to = run(ctx, 'ckDay()'); const ms = (d, hm) => d + 'T' + (hm || '12:00');
  const L = [
    { id: 'aladin_a', listingId: 1, active: true, status: '판매중', registeredAt: ms('2025-09-20') }, /* 어림 시작 전 등록 · 아직 판매중 → 처음부터 끝까지 */
    { id: 'aladin_b', status: '판매완료', registeredAt: ms('2025-10-01'), goneFromActiveAt: ms('2025-10-05') }, /* 10/1 12시 등록 → 10/2 01시부터 · 10/5 12시 내림 → 10/5까지 */
    { id: 'aladin_c', status: '판매완료', registeredAt: ms('2025-10-01') }, /* 판매 기록으로 끝 */
    { id: 'aladin_d', status: '판매완료', registeredAt: ms('2025-10-01') }, /* 끝 모름 → 셈 안 함 */
    { id: 'yes24_e', listingId: 2, active: true, status: '판매중', registeredAt: ms('2025-09-20') }];
  ctx.S = { plist: new Map(L.map((l) => [l.id, l])), orders: new Map([['x', {}]]) }; ctx.saleIdxX = () => new Map([['aladin_c', [{ ms: Date.parse('2025-10-03T09:00:00+09:00') }]]]);
  const M = run(ctx, 'ckTotEst()'); const g = (d) => M.get(d);
  ok(M.has('2025-09-26') && M.has(to) && !M.has('2025-09-25'), '2025-09-26부터 오늘까지');
  ok(g('2025-09-26') === 1 && g('2025-10-01') === 1, '등록 전 날은 안 셈(판매중 1만)', [g('2025-09-26'), g('2025-10-01')]);
  ok(g('2025-10-02') === 3 && g('2025-10-03') === 3 && g('2025-10-04') === 2, '01시 모습 기준 — 10/3 09시 판매는 10/3엔 있고 10/4부터 빠짐 · 끝 모르는 상품·예스24는 안 셈', [g('2025-10-02'), g('2025-10-03'), g('2025-10-04')]);
  ok(g('2025-10-05') === 2 && g('2025-10-06') === 1 && g(to) === 1, '10/5 12시 내림 → 10/6부터 빠짐 · 오늘은 판매중 1', [g('2025-10-05'), g('2025-10-06'), g(to)]);
  ok(run(ctx, 'ckTotEst()') === M, '같은 판이면 기억');
  const fn = (n) => grab(n);
  ok(/kind === 'tot' && sc !== 'fold'\) \{ const M = ckTotEst\(\);[\s\S]{0,120}o\.est = true/.test(fn('ckPt')), '기록 없는 날 가게 전체 총 상품수 = 어림 점(est)');
  ok(/est/.test(fn('ckYd')), '어제 대비(ckYd)는 어림 점을 견주지 않음');
  ok(/!p\.est === !last\.est/.test(fn('ckSumm')) && /!prev\.est === !last\.est/.test(fn('ckSumm')), '요약 바뀜은 어림·실측을 섞지 않음');
  ok(/어림\(등록·판매·내림 기록으로 되짚음\)/.test(fn('ckTbl')) && /실측/.test(fn('ckLineSvg')) && /어림/.test(fn('ckLineSvg')), '표·선 그림에 어림/실측 글');
  ok(/kind === 'tot' && sc !== 'fold' && CK_EST0 < from/.test(fn('ckSeries')), '전체 기간 보기 = 2025-09-26부터(가게 전체 총 상품수만)');
  ok(/셈하는 뜻: 알라딘 판매 권수/.test(H) && /현금·가게 따로/.test(H), '화면에 셈하는 뜻 · 현금·가게 따로');
}

console.log('④ 클라우드 지난 날 채우기(배포 안 함)');
{ const i = CL.indexOf('async function ctrlKpiRebuild('), j = CL.indexOf('/* CTRLKPI-END */'); const B = i > 0 && j > i ? CL.slice(i, j) : '';
  ok(!!B && CL.indexOf('/* CTRLKPI-START') < i, 'ctrlKpiRebuild는 CTRLKPI 덩어리 안');
  ok(/if \(E\.T\) \{ out\.skip\+\+; continue; \}/.test(B), '이미 요약(T)이 있는 날은 건드리지 않음');
  ok(/mergeFields: mf/.test(B) && /new FieldPath\('d', dd, k\)/.test(B) && /if \(!E\.fl\)/.test(B), '고른 칸만 씀(그날 T·F… · fl은 없을 때만)');
  ok(/src: 'rebuild', rb: 1/.test(B) && /est: 1/.test(B) && /low: null/.test(B), '다시 채운 표시(rb) · 묶음은 어림(est) · 유효 최저가는 비움');
  ok(/mlLoadCols\(d, \['key', 'price', 'top', 'p1', 'rank', 'mkt', 'sameMin'\]\)/.test(B), 'ml_days 고른 열만 읽음');
  ok(/budgetMs/.test(B) && /out\.stop = 'budget'/.test(B), '시간 한도 안에서만');
  ok(!/\.delete\(|FieldValue\.delete|lastDay/.test(B), '지우기 없음 · ml_state.lastDay 안 건드림');
  ok(/q\.kpi === 'reb'/.test(CL) && /HV\('ctrlKpiReb'/.test(CL), '진단 kpi=reb(무거운 일 문으로)');
}

console.log('⑤ 지킴');
{ const add = H + CL; const me = fs.readFileSync(__filename, 'utf8');
  ok(!/01[016789][- ]?\d{3,4}[- ]?\d{4}/.test(me), '전화번호 모양 없음(시험)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(grab('ckFoldSoldKeys') + grab('ckTotEst')), '브라우저 팝업 없음');
}
if (fail) { console.log('❌ ' + fail + '개 실패'); process.exit(1); } console.log('✅ tCTRLHIST_1120 모두 통과');
