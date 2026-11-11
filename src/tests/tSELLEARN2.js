// tSELLEARN2 — 11/11 밤 일꾼 sell2 · 정범님 뜻 바로잡음: '앞에 있는 상품이 잘 팔리나'가 아니라 '앞 페이지에 어떤 종류가 놓였느냐에 따라 그 숍 전체가 더 팔리나'
//  ④ 앞 페이지 구성 → 숍 전체 판매(숍 고정효과·시차·통제·순열·BH·재현) · ⑤ 가설 원장 스스로 진화 · ⑥ 구매자 분포·함께 산 책 · ⑦ 판정 조건·롤모델 기준 진화(제안만)
// 시험 자료에 손님 정보 없음(꾸민 판매자 번호·제목·값만) · 실행: node src/tests/tSELLEARN2.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 500))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SL = require(find(['../readnow-sellerlearn-core.js', '../../readnow-sellerlearn-core.js']));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js']), 'utf8');
const APP = fs.readFileSync(find(['../app.html', '../../src/app.html']), 'utf8');
let s0 = 9; const R = () => { s0 ^= s0 << 13; s0 >>>= 0; s0 ^= s0 >> 17; s0 ^= s0 << 5; s0 >>>= 0; return s0 / 4294967296; };
/* 꾸민 숍 n곳 · 날마다 새로 올린 것 중 '초등' 제목 몫이 날마다 달라짐 → eff>0이면 다음 날 사라짐이 그 몫을 따라 늘게 */
function synShops(n, days, eff) { const shops = []; for (let k = 0; k < n; k++) { let id = 1e6 * (k + 1); const items = []; const runs = []; const d0 = Date.UTC(2026, 9, 1);
    for (let i = 0; i < 400; i++) items.push({ id: String(id++), t: (R() < 0.3 ? '초등 수학 ' : '어떤 책 ') + i, p: 3000 + Math.floor(R() * 20000), first: '20260930', g: R() < 0.5 ? '최상' : '상' });
    let prevKid = 0.3; for (let dd = 0; dd < days; dd++) { const day = new Date(d0 + dd * 864e5).toISOString().slice(0, 10); const ymd = day.replace(/-/g, ''); const add = []; const nA = 60 + Math.floor(R() * 40); const sh = R();
      for (let j = 0; j < nA; j++) { const it = { id: String(id++), t: (R() < sh ? '초등 영어 ' : '보통 책 ') + j, p: 3000 + Math.floor(R() * 20000), first: ymd, g: '최상' }; items.push(it); add.push(JSON.stringify([it.id, it.t, it.p, it.g, null, null, null, 0, null])); }
      const alive = items.filter((x) => !x.gone).sort((a, b) => +b.id - +a.id); const lam = Math.exp(Math.log(40) + eff * (prevKid - 0.5) + 0.3 * (R() - 0.5)); const g = [];
      for (let j = 0; j < Math.round(lam); j++) { const c = alive[60 + Math.floor(R() * (alive.length - 60))]; if (!c || c.gone) continue; c.gone = ymd; g.push(JSON.stringify([c.id, c.t, c.p, c.g, 3, c.first, 0, null, null, null])); }
      prevKid = alive.slice(0, 240).filter((x) => /초등/.test(x.t)).length / 240; runs.push({ sc: String(k), day, spanDays: 1, complete: true, full: true, total: alive.length, add: nA, gone: g.length, sumGone: g.length * 8000, goneList: g, addList: add }); }
    const cur = {}; for (const it of items) if (!it.gone) cur[it.id] = [it.p, it.first, it.g, 1, it.t, 0, 0, null, null, null, 0]; shops.push({ sc: String(k), cur, runs }); }
  return shops; }
const panel = (shops) => { const pre = [], sets = []; for (const s of shops) { const L = SL.shopItems(s.cur, s.runs); sets.push([s.sc, SL.hashSet(L)]); pre.push([s.sc, SL.shopFronts(s.runs, L, 240)]); } let rows = []; for (const [g, P] of pre) rows = rows.concat(SL.panelFrom(g, P, { rare: SL.rareOf(sets, g), kw: [] })); return rows; };

console.log('④ 앞 페이지 구성 → 숍 전체 판매');
{ const L = SL.shopItems({ 105: [9000, '20261005', '최상', 1, '새 책', 0], 101: [3000, '20261001', '상', 1, '옛 책', 1] }, [{ day: '2026-10-03', spanDays: 1, goneList: [JSON.stringify(['103', '사라진 책', 5000, '상', 2, '20261002', 0, null, null, null])], addList: [] }]);
  ok(L.map((x) => x.id).join(',') === '105,103,101', '지금 목록 + 사라진 것 → 나중 등록(번호 큰 것)부터', L.map((x) => x.id));
  const d2 = SL.dayN('2026-10-02'), d4 = SL.dayN('2026-10-04'); ok(SL.frontAt(L, d2, 2).map((x) => x.id).join(',') === '103,101' && SL.frontAt(L, d4, 2).map((x) => x.id).join(',') === '101', '그날 살아 있던 것만 앞 페이지(사라진 날 뒤엔 빠지고, 올리기 전엔 없음)', [SL.frontAt(L, d2, 2), SL.frontAt(L, d4, 2)].map((a) => a.map((x) => x.id))); }
{ const F = Array.from({ length: 48 }, (_, i) => ({ p: i < 24 ? 2000 : 45000, g: i % 2 ? '최상' : '중', t: i < 12 ? '흔한 만화 세트 전5권' : '드문 철학 ' + i, low: i < 6 ? 1 : 0, first: 100, h: SL.hashT(i < 12 ? '흔한 만화 세트 전5권' : '드문 철학 ' + i) }));
  const f = SL.frontFeat(F, 110, { rare: (h) => (h === SL.hashT('흔한 만화 세트 전5권') ? 3 : 0), kw: ['철학'] });
  ok(f.sCheap === 0.5 && f.sLux === 0.5 && f.gTop === 0.5 && f.gLow === 0.5 && f.low === 0.125 && f.set === 0.25 && f.k_comic === 0.25 && f.k_hum === 0.75 && f.rare === 0.75 && f['w:철학'] === 0.75 && f.ageMed === 10 && f.dup > 0.2, '구성 특징: 가격대·상태·최저가·세트·종류·희귀·제목 낱말·나이·겹침', f);
  ok(f.covB === undefined && f.spMed === undefined, '표지 수치·SP는 재료가 30% 넘을 때만(없으면 짐작하지 않음)');
  const F2 = F.map((x) => ({ ...x, cov: { b: 0.8, s: 0.3, c: 0.5 } })); ok(SL.frontFeat(F2, 110, {}).covB === 0.8, '표지 수치 칸(밝기·채도·색 다양성)이 생기면 저절로 들어옴'); }
{ const sh = synShops(8, 30, 1.6); const rows = panel(sh); ok(rows.length > 150 && rows.every((r) => r.c.length === 3 && 'g1' in r.y && 'g3' in r.y), '숍마다 날짜 줄(통제 = 지금 판매·다음 등록·재고)', rows.length);
  const ex = SL.explore(rows, { ys: ['g1', 'g3'] }); const kid = ex.all.find((t) => t.f === 'k_kid' && t.y === 'g1');
  ok(kid && kid.q < 0.05 && kid.r > 0.3 && kid.rep, '심은 효과(앞 페이지 어린이·학습 몫 → 다음 날 숍 전체 사라짐)를 보정 뒤에도 찾음 · 앞뒤 절반 재현', kid);
  ok(ex.all.some((t) => t.combo && t.f.includes('*')), '특징끼리 조합(곱)도 시험');
  const rows0 = panel(synShops(8, 30, 0)); const ex0 = SL.explore(rows0, { ys: ['g1', 'g3'] }); ok(ex0.all.filter((t) => t.q < 0.1).length <= Math.max(2, ex0.tests * 0.03), '효과를 안 심으면 보정 뒤 유의가 거의 없음(다중 비교 보정)', { sig: ex0.all.filter((t) => t.q < 0.1).map((t) => [t.f, t.y, t.q]), n: ex0.tests });
  let L1 = null; for (const d of ['2026-11-11', '2026-11-12', '2026-11-13']) L1 = SL.hypEvolve(L1, ex, d); const h = L1.H['k_kid|g1'];
  ok(h && h.st === '지지' && h.n === 3 && L1.best[0].f === 'k_kid', '가설 원장: 3번 버티면 지지 · 위에 올라옴', h);
  ok(SL.hypEvolve(L1, ex, '2026-11-13').H['k_kid|g1'].n === 3, '같은 날 두 번 돌려도 한 번만 셈');
  ok((L1.pending || []).length > 0 && L1.pending.every((k) => k.includes('*')), '잘 버틴 가설로 다음 날 시험할 새 조합을 만듦', L1.pending);
  let L0 = null; for (const d of ['2026-11-11', '2026-11-12', '2026-11-13']) L0 = SL.hypEvolve(L0, ex0, d); ok(Object.values(L0.H).filter((x) => x.st === '기각').length > Object.values(L0.H).filter((x) => x.st === '지지').length, '효과 없는 자료에선 기각이 지지보다 많음', L0.sum);
  const oo = SL.oosScore(rows, ['k_kid'], 'g1'); ok(oo.chall < oo.champ, '채점: 통제만보다 구성 특징을 더하면 뒤 1/3을 더 잘 맞힘', oo); }

console.log('⑥ 구매자 분포 · 함께 산 책');
{ const bdY = { female: { '10대': 30, '20대': 30, '30대': 5, '40대': 5, '50대': 0, '60대': 0 }, male: { '10대': 15, '20대': 10, '30대': 5, '40대': 0, '50대': 0, '60대': 0 } }; const bdO = { female: { '10대': 0, '20대': 0, '30대': 5, '40대': 10, '50대': 25, '60대': 10 }, male: { '10대': 0, '20대': 0, '30대': 5, '40대': 10, '50대': 25, '60대': 10 } };
  const a = SL.audFeat(bdY), b = SL.audFeat(bdO); ok(a.fem > 0.65 && a.young > 0.8 && b.old > 0.65 && b.age > a.age && Math.abs(a.v.reduce((x, y) => x + y, 0) - 1) < 1e-9, '분포 특징: 여성 몫·10·20대·50·60대·나이 평균(합 1로 맞춤)', [a, b]);
  ok(SL.audFeat(null) === null && SL.audFeat({ female: {} }) === null, '분포 없으면 특징 없음');
  const it = []; for (let i = 0; i < 300; i++) { const young = i % 2 === 0; const reg = 100; const sold = young ? (R() < 0.7 ? reg + Math.floor(R() * 20) : null) : R() < 0.2 ? reg + 25 : null; it.push({ id: 'b' + i, bd: young ? bdY : bdO, rel: young ? ['b' + ((i + 2) % 300), 'b' + ((i + 4) % 300)] : ['b' + ((i + 2) % 300)], price: 5000 + (i % 7) * 1000, pl: 15000, cost: 1000 + (i % 5) * 200, reg, sold, sp: 100 + i, cat: i % 3 ? '국내도서>어린이>동화' : '국내도서>소설/시/희곡>한국소설', now: 200 }); }
  const A = SL.audStudy(it, { B: 99 }); const t = A.all.find((x) => x.f === 'aYoung' && x.y === 'sold30');
  ok(A.bd === 300 && A.U && A.U.length === 6 && A.U[0].f > A.U[5].f, '우리가 판 책의 구매자 층(판 권수 가중)', A.U);
  ok(t && t.r > 0.3 && t.q < 0.05, '심은 관계(10·20대 몫 → 30일 안 팔림)를 분야 안에서 찾음', t);
  ok(A.all.some((x) => x.f === 'nbSold') && A.coSell.pairs > 0, '함께 산 책 연결망: 이웃 판매율 · 함께 팔린 짝', A.coSell);
  ok(A.all.some((x) => x.y === 'cr') && A.all.some((x) => x.y === 'pr'), '매입값 ÷ 정가 · 정가 대비 값도 결과로');
  const op = SL.ourPanel(it.map((x, i) => ({ ...x, key: 'k' + i, t: (i % 2 ? '초등 ' : '') + '책 ' + i, regAt: String(100000 + i) })), 110, 140, { look: Object.fromEntries(it.map((x) => [x.id, { bd: x.bd, sp: x.sp }])), U: A.U && SL.audVec(bdY) }, 60);
  ok(op.length > 20 && op[0].g === 'ours' && op[0].x.aFem != null && op[0].x.aFit != null && op[0].x.spMed != null, '우리 숍 날짜 줄: 앞 페이지 구매자 분포·SP 구성(N09와 이음)', op[0] && op[0].x); }

console.log('⑦ 판정 조건·롤모델 기준 스스로 진화(제안만)');
{ const snaps = []; for (let d = 0; d < 20; d++) { const F = {}; for (let i = 0; i < 60; i++) { const lowRate = i < 20; const later = d >= 8 && lowRate && i % 2 === 0; F['s' + i] = { fake: later, rating: lowRate ? 0.975 : 0.995, cancel: i >= 40 ? 0.004 : 0.02, rev6: 100 + d * (i >= 40 ? 3 : 0) }; } snaps.push({ day: new Date(Date.UTC(2026, 9, 1 + d)).toISOString().slice(0, 10), F }); }
  const ce = SL.condEvolve(snaps, SL.DEFAULT_ORDER); const g = ce.conds.find((c) => c.k === 'goodShip'); const f = ce.conds.find((c) => c.k === 'fake');
  ok(ce.pairs > 500 && ce.ready && g.n > 0 && g.w > 1, '배움 조건(취소율 낮음·평점 높음)은 뒤에 좋음 몫이 기본보다 큼 → 무게 1 넘음', g);
  ok(Array.isArray(ce.order) && ce.order.length === SL.CONDS.length && new Set(ce.order).size === SL.CONDS.length, '제안 순서는 조건 14개 그대로(빠짐·겹침 없음)', ce.order);
  ok(SL.condEvolve([], null).pairs === 0 && !SL.condEvolve([], null).ready, '자료 없으면 제안 안 함');
  const prof = (n, t) => ({ runs: 5, days: 10, soldPerDay: n, revPerDay: n * 1000, turn: t, stock: 1000 }); const hist = []; for (let d = 0; d < 20; d++) hist.push({ day: new Date(Date.UTC(2026, 9, 1 + d)).toISOString().slice(0, 10), profiles: Array.from({ length: 12 }, (_, i) => ({ sc: 's' + i, name: 'x' + i, p: prof(d < 10 ? 50 - i : 10 + i * 3 + (i % 3), 0.001 * (i + 1)), f: {} })) });
  const re = SL.roleEvolve(hist, 'rev'); ok(re.by.rev.n > 0 && re.by.turn.n > 0 && re.best === 'turn', '롤모델 기준 견줌: 뒤에 매출이 오른 쪽을 고른 기준(회전율)이 더 나으면 바꾸기 제안', re);
  const fe = SL.followEval([{ key: 'buy|국내도서>어린이', kind: 'buy', k: '국내도서>어린이', state: 'go', at: 100 }, { key: 'x', kind: 'buy', k: 'y', state: 'hold', at: 100 }], [...Array.from({ length: 60 }, (_, i) => ({ d: 70 + (i % 30), cat: i % 6 ? '국내도서>소설' : '국내도서>어린이' })), ...Array.from({ length: 60 }, (_, i) => ({ d: 100 + (i % 30), cat: i % 2 ? '국내도서>소설' : '국내도서>어린이' }))], 140);
  ok(fe.items.length === 1 && fe.items[0].lift > 2 && fe.w.buy > 2, "따라 하기 '진행'만 결과를 셈 — 앞뒤 30일 그 분야 몫 배", fe); }

console.log('⑨ 몰아서 읽은 회차 — 자르지 않고 빈 날에 고르게(정범님 지시 · benchFillPlan 규칙)');
{ const base = { complete: true, full: true, total: 500 }; const R = [{ ...base, day: '2026-10-01', spanDays: 1, add: 5, gone: 3 }, { ...base, day: '2026-10-05', spanDays: 4, add: 10, gone: 9, sumGone: 900 }, { ...base, day: '2026-10-06', spanDays: 1, add: 1, gone: 1, complete: false }, { ...base, day: '2026-10-08', spanDays: 3, add: 7, gone: 6, fill: { days: [{ day: '2026-10-06', gone: 1 }, { day: '2026-10-07', gone: 1 }, { day: '2026-10-08', gone: 4 }] } }, { ...base, day: '2026-10-09', spanDays: 1, add: 2, gone: 2, edit: { gone: 0 } }];
  const S = SL.benchSpread(R); const by = Object.fromEntries(S.map((x) => [x.day, x]));
  ok(['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].every((d) => by[d] && by[d].spanDays === 1) && by['2026-10-02'].gone + by['2026-10-03'].gone + by['2026-10-04'].gone + by['2026-10-05'].gone === 9 && by['2026-10-05'].gone === 3 && by['2026-10-02'].sumGone === 225, '4일 몰아 읽은 회차 → 앞 회차 다음 날~그날 하루씩 고르게(나머지는 뒤 날에)', S.map((x) => [x.day, x.gone]));
  ok(!S.some((x) => x.day === '2026-10-06' && !x._vf && x.complete === false), '못 쓰는 회차(끝까지 못 읽음)는 뺌');
  ok(by['2026-10-08'].gone === 4 && by['2026-10-07'].gone === 1, '사람이 채운 값이 먼저', [by['2026-10-07'], by['2026-10-08']].map((x) => x.gone));
  ok(by['2026-10-09'].gone === 0, '사람이 고친 값이 먼저');
  const P = SL.profile(R.map((x) => ({ ...x, goneList: [], addList: [] }))); ok(P && P.days === 9 && P.runs === 4, '주력 셈은 나눈 날로(14일 자르기 없음)', P && [P.days, P.runs, P.spread]); }

console.log('⑧ 연결(클라우드·진단·웹앱)');
ok(/async function slStudy2\(/.test(SRC) && /sellerAudStudy\(\)/.test(SRC) && /ml_seller_facts/.test(SRC) && /app_settings'\)\.doc\('seller_hyp'\)/.test(SRC), '클라우드: 구성·진화(slStudy2) · 구매자 분포(sellerAudStudy) · 사실 판 · 가설 원장');
ok(/if \(q\.saud\)/.test(SRC) && /if \(q\.audx\)/.test(SRC) && !/q\.audx[\s\S]{0,600}(crm_|phone|address|addr)/.test(SRC), '진단 saud(계산만) · audx(엔진용 · 고객 정보 없음)');
{ const A2 = SRC.slice(SRC.indexOf('async function slStudy2'), SRC.indexOf('/* SELLEARN-END */')); ok(!/\.update\(|prd_listings'\)\.doc\([^)]*\)\.set|shp_cmds|prdEdit/.test(A2), '클라우드 새 셈은 값·상태를 바꾸지 않고 PC에 일을 주지 않음(제안만 · 약속 0·36)'); }
ok(/function slMore\(D\)/.test(APP) && /id="sl_evoord"/.test(APP) && /data-slfw=/.test(APP) && /seller_follow/.test(APP), '웹앱: 🧑‍🏫 카드 안 구성·구매자 분포·진화 제안 · 따라 하기 진행/보류');
{ const U = APP.slice(APP.indexOf('function slAudDoc'), APP.indexOf('function slLearnBind')); ok(!/\b(alert|confirm|prompt)\(/.test(U), '브라우저 팝업 없음'); }
ok(/readnow-sellerlearn-core\.js\?v=([\d.]+)/.test(APP) && (APP.match(/readnow-sellerlearn-core\.js\?v=([\d.]+)/) || [])[1] === SL.VERSION && SL.VERSION >= '0.2.0', '공용 파일 0.2.0 이상 · 웹앱 불러오기 판 = 공용 파일 판'); // (rel4) 판이 올라도 맞는지만
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
