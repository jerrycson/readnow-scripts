// tPXAVAIL_G — (판 G · 정범님 I-1119-2051-30 · 설계 reports/CTRLKPI1_1119.md 7장) 조회수 표마다 「그때 셀 수 있던 총 상품수」·「상품 100개당 방문」
//  ① 글: PXAVAIL 덩어리 표시 · 함수 · 브라우저 창 없음 · 전화번호 모양 없음 · Firestore 읽기 없음
//  ② 셈(vm · 앱 코드 그대로 떼어 돌림): 한국 자정 앞뒤 1분(붙인 날·뗀 날) · 범위 안 상품만 · 주·달 평균 = 날 합 ÷ 날 수 · 상품 0개인 날 「—」 · 어림 딱지 · 오늘은 관제 지표 T.px · 2만 개 × 400일 50ms 안
//  ③ 화면(RN_PORT): 날마다 방문 창에 셀 수 있는 상품·100개당 칸 · 「100개당」 값 고르기 · 둘째 축 선 켜고 끄기 · 기간 표 · 브라우저 창·오류 없음
// 실행: node tPXAVAIL_G.js (② 까지) · pw/ 안 RN_PORT=<포트> node tPXAVAIL_G.js (③ 까지) · 시험 자료는 가짜 상품번호만
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
const a0 = T.indexOf('/* PXAVAIL-START'), b0 = T.indexOf('/* PXAVAIL-END */');
const BLK = a0 > 0 && b0 > a0 ? T.slice(a0, b0 + 17) : '';
ok(BLK.length > 0, 'PXAVAIL 덩어리 표시(PXAVAIL-START·END)');
for (const fn of ['pxAvailCalc', 'pxAvailMap', 'pxCkT', 'pxAvail']) ok(new RegExp('function ' + fn + '\\(').test(BLK), `함수 ${fn}`);
for (const fn of ['pxTsMs', 'pxTsDay', 'pxPer100', 'pxP100Txt', 'pxAvTxt']) ok(new RegExp('const ' + fn + ' = ').test(BLK), `도우미 ${fn}`);
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BLK), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(BLK), '전화번호 모양 없음');
ok(!/\.(get|onSnapshot)\s*\(\s*\)|collection\(/.test(BLK), 'Firestore 읽기 없음(메모리의 px_exp·관제 지표만)');
ok(/'상품 100개당 방문\(사람\)'/.test(T) && /PXDM = \{[^}]*p: '상품 100개당/.test(T), '값 고르기에 「상품 100개당 방문」');
ok(/data-pxdax/.test(T) && /pxdc-ax2/.test(T), '날마다 그림 둘째 축(셀 수 있는 상품) · 켜고 끄는 단추');
ok((T.match(/<th class="r"[^>]*>셀 수 있는 상품<\/th>/g) || []).length >= 2, '그룹 날 표(pxgdd)·날 표에 「셀 수 있는 상품」 칸');
ok(/:root\[data-theme="dark"\][^\n]*pxdc-ax2/.test(T), '어두운 모양에도 둘째 축 색');

console.log('② 셈');
const line = (re) => { const m = T.match(re); if (!m) { ok(false, '앱에서 줄을 못 찾음 ' + re); return ''; } return m[0]; };
const SRC = [line(/^const _pxDC = new Map\(\); const pxDay = .*$/m), line(/^const pxDayAdd = .*$/m), line(/^const pxInScope = .*$/m), line(/^function pxPerKey\(.*$/m), line(/^const PXPG = .*$/m),
  T.slice(T.indexOf('function pxPeriods('), T.indexOf('\nfunction pxPerRowHtml(')), BLK].join('\n');
const ctx = { S: { px: { exp: new Map(), vw: new Map(), v: 0 } }, num: (n, d = 0) => (n == null || !Number.isFinite(n) ? '-' : n.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',')), esc: (s) => String(s), pxScope: () => ({ sc: 'all', lids: null, scN: '모든 상품' }), Date, Math, Map, Set, Number, Array, String, Object, JSON };
/* 떼어 낸 코드를 이 실행의 전역(Math·Date)으로 돌림 — vm 따로 상자는 전역 찾기가 느려 속도 재기가 부풀려짐(브라우저와 다름) */
let F = {}; try { F = vm.runInThisContext('(function (S, num, esc, pxScope) {\n' + SRC + '\n;return { pxDay, pxDayAdd, pxPerKey, pxPeriods, pxAvailCalc, pxAvailMap, pxAvail, pxPer100, pxP100Txt, pxAvTxt, pxCkT }; })')(ctx.S, ctx.num, ctx.esc, ctx.pxScope); } catch (e) { ok(false, '떼어 낸 코드가 돌지 않음', e.message); }
const S = ctx.S; const ex = (o) => new Map(Object.entries(o));
if (F.pxAvailCalc) {
  // 한국 자정 앞뒤 1분 — 23:59 KST = 14:59Z · 00:01 KST = 15:01Z
  const td = '2026-11-19';
  const E1 = ex({ a1: { on: true, addedAt: '2026-11-17T14:59:00Z' }, a2: { on: true, addedAt: '2026-11-17T15:01:00Z' },
    r1: { on: false, addedAt: '2026-11-10T03:00:00Z', removedAt: '2026-11-18T14:59:00Z' }, r2: { on: false, addedAt: '2026-11-10T03:00:00Z', removedAt: '2026-11-18T15:01:00Z' }, shop_x: { on: true, addedAt: '2026-11-01T03:00:00Z' } });
  const R1 = F.pxAvailCalc(E1, null, td); const g = (R, d) => (R.M.get(d) || {}).px;
  ok(g(R1, '2026-11-16') === 2, '11/16: 뗀 두 상품만(붙인 날 앞 · 숍 줄은 셈 밖)', g(R1, '2026-11-16'));
  ok(g(R1, '2026-11-17') === 3, '11/17: 23:59에 붙인 상품은 그날 셈 · 00:01에 붙인 상품은 다음 날', g(R1, '2026-11-17'));
  ok(g(R1, '2026-11-18') === 3, '11/18: 23:59에 뗀 상품은 그날 끝에 없음 · 다음 날 00:01에 뗀 상품은 있음', g(R1, '2026-11-18'));
  ok(g(R1, '2026-11-19') === 2, '11/19: 붙어 있는 둘만', g(R1, '2026-11-19'));
  ok(![...R1.M.values()].some((r) => r.unc), '붙인 때·뗀 때가 다 있으면 어림 아님');
  // 범위 — 그룹 안 상품만
  const R2 = F.pxAvailCalc(E1, new Set(['a1', 'r2']), td);
  ok(g(R2, '2026-11-18') === 2 && g(R2, '2026-11-19') === 1, '범위(그룹) 안의 상품만 셈', [g(R2, '2026-11-18'), g(R2, '2026-11-19')]);
  // 주·달 평균 = 날 합 ÷ 날 수 · 100개당 = 사람 ÷ (상품·날 합) × 100
  S.px.exp = ex({ p1: { on: true, addedAt: '2026-09-30T16:00:00Z' }, p2: { on: true, addedAt: '2026-10-15T16:00:00Z' } }); // KST 10/01 · 10/16
  S.px.vw = new Map([['p1', new Map([['2026-10-14', { human: 5, bot: 1, ours: 0 }], ['2026-10-20', { human: 89, bot: 0, ours: 0 }]])], ['p2', new Map()]]); S.px.v = 1;
  const Mo = F.pxPeriods('m', null, 'all').find((o) => o.k === '2026-10');
  ok(Mo && Math.abs(Mo.pxA - 47 / 31) < 1e-9 && Mo.pxE === 2, '달 평균 = (15일×1 + 16일×2) ÷ 31일 · 끝 = 2', Mo && { pxA: Mo.pxA, pxE: Mo.pxE });
  ok(Mo && Mo.p100 === 200, '달 100개당 하루 방문 = 94 ÷ 47 × 100 = 200', Mo && Mo.p100);
  const wk = F.pxPerKey('2026-10-14', 'w'); const Wk = F.pxPeriods('w', null, 'all').find((o) => o.k === wk);
  ok(wk === '2026-10-12' && Wk && Math.abs(Wk.pxA - 10 / 7) < 1e-9 && Wk.p100 === 50, '주 평균 = (4일×1 + 3일×2) ÷ 7일 · 100개당 = 5 ÷ 10 × 100', Wk && { wk, pxA: Wk.pxA, p100: Wk.p100 });
  ok(F.pxPeriods('m', null).every((o) => o.pxA == null), '범위를 안 주면(옛 부르는 곳) 상품 수를 셈하지 않음');
  // 상품 0개인 날 — 나누지 않고 「—」
  S.px.exp = new Map(); S.px.v = 2;
  const A0 = F.pxAvail('2026-11-18', null, 'all');
  ok(A0.px === 0 && F.pxPer100(5, A0.px) === null && F.pxP100Txt(F.pxPer100(5, A0.px)) === '—', '상품 0개인 날: 나누지 않고 「—」', A0);
  S.px.exp = ex({ q1: { on: true, addedAt: '2026-11-10T03:00:00Z' } }); S.px.v = 3;
  ok(F.pxAvail('2026-11-05', null, 'all').px === 0 && F.pxAvail('2026-11-12', null, 'all').px === 1, '첫 붙인 날 앞은 0 · 뒤는 1');
  ok(F.pxPer100(3, 1) === 300 && F.pxP100Txt(300) === '300.0' && F.pxP100Txt(2.5) === '2.50', '100개당 글: 10 아래는 소수 둘째 · 그 위는 첫째');
  // 어림 딱지
  const E3 = ex({ f1: { on: false, addedAt: '2026-11-10T03:00:00Z', tryAt: '2026-11-15T03:00:00Z' }, gp: { on: true, addedAt: '2026-11-01T03:00:00Z', gaps: [{ from: '2026-11-05T03:00:00Z', to: '2026-11-08T03:00:00Z' }] }, na: { on: true, chkAt: '2026-11-12T03:00:00Z' } });
  const R3 = F.pxAvailCalc(E3, null, td); const u = (d) => (R3.M.get(d) || {}).unc || 0;
  ok(g(R3, '2026-11-06') === 0 && u('2026-11-06') >= 1, '빠져 있던 기간(gaps)은 빼고 어림', [g(R3, '2026-11-06'), u('2026-11-06')]);
  ok(g(R3, '2026-11-08') === 1, '빠져 있던 기간이 끝난 날부터 다시 셈', g(R3, '2026-11-08'));
  ok(g(R3, '2026-11-13') === 3 && u('2026-11-13') >= 1, '뗀 때를 모르는 실패는 시도한 날까지 셈 · 어림', [g(R3, '2026-11-13'), u('2026-11-13')]);
  ok(g(R3, '2026-11-16') === 2 && u('2026-11-16') === 0, '시도한 날 뒤는 실패 상품 빠짐 · 어림 아님', [g(R3, '2026-11-16'), u('2026-11-16')]);
  ok(g(R3, '2026-11-11') === 2 && u('2026-11-11') >= 1, '붙인 때가 없는 문서는 확인한 날부터 · 그 앞 날은 어림', [g(R3, '2026-11-11'), u('2026-11-11')]);
  ok(R3.why.fail === 1 && R3.why.gap === 1 && R3.why.noAdd === 1, '어림 까닭 셈(실패·빠짐·붙인 때 없음)', R3.why);
  S.px.exp = E3; S.px.v = 4; const AE = F.pxAvail('2026-11-13', null, 'all');
  ok(AE.est === true && /약 3/.test(F.pxAvTxt(AE)) && /class="pxest"/.test(F.pxAvTxt(AE)), '어림이면 「약 n」 딱지', F.pxAvTxt(AE));
  ok(F.pxAvTxt(F.pxAvail('2026-11-16', null, 'all')) === '2', '어림 아니면 숫자만');
  ok(F.pxAvTxt(null) === '—' && F.pxAvTxt({ px: null }) === '—', '셀 수 없으면 「—」');
  // 오늘 · 관제 지표(ctl_kpi_m) T.px·T.n
  const tdy = F.pxDay(); S.px.exp = ex({ z1: { on: true, addedAt: '2026-01-01T03:00:00Z' } }); S.px.v = 5;
  ok(F.pxAvail(tdy, null, 'all').sale === null, '관제 지표가 메모리에 없으면 판매 중 상품은 빈칸');
  S.ckM = new Map([[tdy.slice(0, 7), { d: { [tdy.slice(8, 10)]: { T: { n: 1234, px: 987 } } } }]]);
  const AT = F.pxAvail(tdy, null, 'all'); ok(AT.px === 987 && AT.sale === 1234 && AT.est === false, '오늘·모든 상품은 관제 지표 T.px(딱지 없음) · T.n = 판매 중', AT);
  ok(F.pxAvail(tdy, new Set(['z1']), 'g:x').px === 1, '그룹 범위는 관제 지표 대신 붙인 상품으로 셈');
  S.ckM = { [tdy.slice(0, 7)]: { d: { [tdy.slice(8, 10)]: { T: { n: 5, px: 4 } } } } }; ok(F.pxAvail(tdy, null, 'all').px === 4, '관제 지표가 객체 모양이어도 읽음'); delete S.ckM;
  // 기억 — 같은 판이면 다시 세지 않음 · 판이 바뀌면 다시
  const m1 = F.pxAvailMap(null, 'all'), m2 = F.pxAvailMap(null, 'all'); S.px.v = 6; const m3 = F.pxAvailMap(null, 'all');
  ok(m1 === m2 && m3 !== m1, '범위마다 계산 기억(조회 기록 판이 바뀔 때만 다시)');
  // 2만 개 × 400일 — 50ms 안
  const BIG = new Map(); const t0d = Date.parse('2025-10-15T00:00:00Z'); let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 20000; i++) { const ad = t0d + Math.floor(rnd() * 400 * 864e5); const e = { on: rnd() < 0.7, addedAt: new Date(ad).toISOString() }; if (!e.on) { if (rnd() < 0.8) e.removedAt = new Date(ad + Math.floor(rnd() * 60 * 864e5)).toISOString(); else e.tryAt = new Date(ad + 864e5).toISOString(); } if (rnd() < 0.05) e.gaps = [{ from: new Date(ad + 2 * 864e5).toISOString(), to: new Date(ad + 5 * 864e5).toISOString() }]; BIG.set('L' + i, e); }
  F.pxAvailCalc(BIG, null, '2026-11-19'); let best = 1e9; for (let k = 0; k < 5; k++) { const t0 = process.hrtime.bigint(); F.pxAvailCalc(BIG, null, '2026-11-19'); best = Math.min(best, Number(process.hrtime.bigint() - t0) / 1e6); }
  ok(best < 50, `상품 2만 개 × 400일을 50ms 안에 셈 (${best.toFixed(1)}ms)`, best);
  const RB = F.pxAvailCalc(BIG, null, '2026-11-19'); ok(RB.M.size >= 400 && RB.M.size <= 402, '400일 모두 줄이 있음', RB.M.size);
  // 한 날을 하나씩 세어 맞춰 봄(한 번 훑기 = 바로 세기)
  const dd = '2026-03-15'; let want = 0; for (const [, e] of BIG) { const a = F.pxDay(Date.parse(e.addedAt)); if (a > dd) continue; let z = null; if (!e.on) z = e.removedAt ? F.pxDay(Date.parse(e.removedAt)) : F.pxDay(Date.parse(e.tryAt)); if (z && z <= a) continue; if (z && z <= dd) continue; const gp = e.gaps && e.gaps[0]; if (gp) { const f = F.pxDay(Date.parse(gp.from)), t = F.pxDay(Date.parse(gp.to)); const t2 = z && t > z ? z : t; if (f <= dd && dd < t2) continue; } want++; }
  ok(RB.M.get(dd).px === want, '큰 자료의 한 날 = 상품마다 바로 센 수', { got: RB.M.get(dd).px, want });
}
if (!process.env.RN_PORT) { console.log(bad ? `❌ tPXAVAIL_G ${bad}개 실패` : '✓ tPXAVAIL_G 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }

console.log('③ 화면');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  const A = '530000021', B = '530000022';
  const seed = await p.evaluate(async ({ A, B }) => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const base = S.plist.get('aladin_U215983410'); const now = Date.now();
    [[A, '셀 수 시험 책 가'], [B, '셀 수 시험 책 나']].forEach(([lid, t], i) => { const uc = 'U9' + (1000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, title: t, status: '판매중', active: true }); });
    const dayAgo = (k) => pxDay(now - k * 864e5);
    for (let k = 0; k < 20; k++) await db.collection('px_views').doc(A + '_' + dayAgo(k).replace(/-/g, '')).set({ lid: A, day: dayAgo(k), n: 4, human: 4, bot: 0, uniq: 4, lastKind: 'human', x: { hr: { 10: 4 } } });
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: new Date(now - 30 * 864e5).toISOString(), src: 'manual' });
    await db.collection('px_exp').doc(B).set({ lid: B, on: true, state: 'done', addedAt: new Date(now - 5 * 864e5).toISOString(), src: 'manual' });
    try { localStorage.removeItem('rn-pxday'); } catch (e) {}
    pxInit(); return { today: dayAgo(0), d10: dayAgo(10) }; }, { A, B });
  await p.waitForTimeout(1000);
  const calc = await p.evaluate(({ A, B, d10, today }) => { const L = new Set([A, B]); const AM = pxAvailMap(L, null); return { d10: pxAvail(d10, L, null, AM).px, td: pxAvail(today, L, null, AM).px }; }, { A, B, ...seed });
  ok(calc.d10 === 1 && calc.td === 2, '앱 안에서: 10일 전 1개 · 오늘 2개(5일 전에 붙인 상품 더함)', calc);
  await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200);
  await p.click('#px_top .pxtile[data-pxday]'); await p.waitForTimeout(400);
  let m = await p.evaluate(() => { const ov = document.querySelector('.pxdwov'); if (!ov) return null; const t = ov.textContent.replace(/\s+/g, ' '); const th = [...ov.querySelectorAll('.pxdtab thead th')].map((x) => x.textContent.trim()); return { th, ax: ov.querySelectorAll('svg.pxdc .pxdc-ax2').length, axb: !!ov.querySelector('[data-pxdax]'), cnt: /셀 수 있는 상품/.test(t), p100: /100개당/.test(t) }; });
  ok(m && m.th.some((x) => /셀 수 있는 상품/.test(x)) && m.th.some((x) => /100개당/.test(x)), '날 표에 「셀 수 있는 상품」·「100개당 방문」 칸', m && m.th);
  ok(m && m.ax >= 1 && m.axb, '날마다 그림에 둘째 축 선 · 켜고 끄는 단추', m);
  await p.click('.pxdwov [data-pxdax]'); await p.waitForTimeout(200);
  const off = await p.evaluate(() => ({ ax: document.querySelectorAll('.pxdwov svg.pxdc .pxdc-ax2').length, open: !!document.querySelector('.pxdwov') }));
  ok(off.open && off.ax === 0, '단추를 누르면 둘째 축 선이 꺼짐(창은 열린 채)', off);
  await p.click('.pxdwov [data-pxdax]'); await p.waitForTimeout(150);
  await p.click('.pxdwov [data-pxdm="p"]'); await p.waitForTimeout(200);
  m = await p.evaluate(() => ({ m: S.px.P.dw && S.px.P.dw.m, open: !!document.querySelector('.pxdwov'), svg: document.querySelectorAll('.pxdwov svg.pxdc').length, kpi: [...document.querySelectorAll('.pxdwov .pxdk')].map((x) => x.textContent.replace(/\s+/g, ' ')).slice(0, 4) }));
  ok(m.m === 'p' && m.open && m.svg >= 1, '값 고르기 「100개당」: 창이 열린 채 그림이 그려짐', m);
  for (const u of ['w', 'm']) { await p.click(`.pxdwov [data-pxdu="${u}"]`); await p.waitForTimeout(150); }
  m = await p.evaluate(() => ({ open: !!document.querySelector('.pxdwov'), th: [...document.querySelectorAll('.pxdwov table thead th')].map((x) => x.textContent.trim()) }));
  ok(m.open && m.th.some((x) => /상품\(평균·끝\)/.test(x)), '기간 표에 「상품(평균·끝)」 칸', m.th);
  await p.click('.pxdwov [data-pxdu="d"]'); await p.click('.pxdwov [data-pxdm="h"]'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(dlg.length === 0, '브라우저 창 없음', dlg); ok(errs.length === 0, '페이지 오류 없음', errs);
  console.log(bad ? `❌ tPXAVAIL_G ${bad}개 실패` : '✓ tPXAVAIL_G 통과'); return { bad };
});
