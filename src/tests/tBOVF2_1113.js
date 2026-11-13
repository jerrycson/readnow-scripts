/* tBOVF2_1113 — 리드 결정 11/13(일꾼 bovf2): 🎁 여분으로 센 바이트(sm·sg)가 여분 휴대폰(휴대폰 2) 자기 몫에서도 빠지던 이중 차감 고침
 *  사실(bovf 보고 · 코드 읽기): poolCalc가 휴대폰마다 쓴 양을 도우미 장치 바이트 그대로(여분 sm·sg를 빼지 않고) 셈함
 *   → 휴대폰 2로 여분을 쓰면 여분 남은 양도 줄고 휴대폰 2 '이달 남은 양'(72GB 쪽)도 같이 줄어 다음 날 하루 몫이 작아짐 · 같은 날에도 도우미 문(lim)이 쓴 만큼 더 당겨짐
 *  ① 이중 차감 없음(다음 날 하루 몫 · 같은 날 문 끝 그대로)
 *  ② 넘쳐 쓰기 0 — 휴대폰 2 유심 전체(자기 72GB + 여분 48GB) · 하루 몫 합계 상한 · 여분 상한 각각 넘지 않음(여분 바이트가 휴대폰 1에 셈된 날·남은 양 정한 날 포함)
 *  ③ 휴대폰 1은 그대로 ④ 12월(여분 없음)은 그대로 ⑤ 벤치마킹 한 바퀴 중 넘쳐 쓰기 상한(bovf) 그대로
 * 실행: node src/tests/tBOVF2_1113.js (서버·브라우저 필요 없음) · RN_AS=<옛 readnow-autosched-core.js 경로>로 고치기 전 판에서 ①이 실패함을 볼 수 있음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
require(process.env.RN_AS || path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;
const G = 1073741824; const at = (s) => Date.parse(s + '+09:00'); const g2 = (b) => Math.round(b / G * 100) / 100; const eq = (a, b, t) => Math.abs(a - b) < (t || 0.005 * G);
const pool = { on: true, carry: false, alloc: { on: false } /* (spare2 11/13) 이 시험은 그 판의 옛 셈(배정표·쌓인 남은 양 끔)을 그대로 봄 — 새 기본값은 tSPARE2_1113 */, fb: 'p1', list: { p1: { name: '휴대폰 1', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2', gb: 120, dev: 'USB\\B', order: 2 } }, month: { '2026-11': { p1: { from: '2026-11-13', remainGB: 72.54 }, p2: { from: '2026-11-13', remainGB: 72 } } }, spare: { '2026-11': { gb: 48, from: '2026-11-12', phone: 'p2', pace: true } } };
const doc = { budget: { mainPct: 87.5, pool } };
const noSp = { budget: { mainPct: 87.5, pool: { ...pool, spare: {} } } };
/* 지난 날 기록: [날, 휴대폰 1 바이트, 휴대폰 2 바이트, 여분 주요 sm, 여분 일반 sg] (GB) */
const mkDays = (rows) => Object.fromEntries(rows.map(([k, a, b, sm, sg]) => [k, { tether: (a + b) * G, phones: { 'USB\\A': a * G, 'USB\\B': b * G }, ...(sm || sg ? { tiers: { sm: (sm || 0) * G, sg: (sg || 0) * G } } : {}) }]));
const mkNet = (key, o) => { o = o || {}; const uA = o.uA || 0, uB = o.uB || 0, sm = o.sm || 0, sg = o.sg || 0; const prevB = o.prevB || 0, prevA = o.prevA || 0;
  return { capGB: 240, days: o.days || {}, phones: [{ id: 'USB\\A', used: (60 + prevA + uA) * G, active: o.act === 'p1', connected: true }, { id: 'USB\\B', used: (prevB + uB) * G, active: o.act !== 'p1', connected: true }],
    today: { key, tether: (uA + uB) * G, tiers: { main: Math.max(0, uA + uB - sm - sg - 0.1) * G, gen: 0.1 * G, sm: sm * G, sg: sg * G }, phones: { 'USB\\A': uA * G, 'USB\\B': uB * G } } }; };
const P = (pc, id) => pc.phones.find((p) => p.id === id);

console.log('① 이중 차감 없음 — 여분으로 센 바이트는 휴대폰 2 자기 몫에서 빠지지 않음');
{ /* 11/13: 휴대폰 1 4.03GB · 휴대폰 2 자기 4.0GB + 여분 10GB(주요 9.67 · 일반 0.33) = 장치 14GB */
  const days = mkDays([['2026-11-13', 4.03, 14, 9.67, 0.33]]); const now = at('2026-11-14T07:00:00');
  const pc = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 14 }), now); const p2 = P(pc, 'p2');
  const ref = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days: mkDays([['2026-11-13', 4.03, 4, 0, 0]]), prevA: 4.03, prevB: 4 }), now); const r2 = P(ref, 'p2'); /* 여분을 하나도 안 쓴 날과 견줌 */
  ok(eq(p2.usedPrev, 4 * G), '휴대폰 2 지난 사용(자기 몫) = 4.0GB(장치 14GB − 여분 10GB)', g2(p2.usedPrev));
  ok(eq(p2.share, r2.share) && eq(p2.share, 68 / 17 * G), '11/14 휴대폰 2 하루 몫 = 여분을 안 쓴 날과 같음(남은 68GB ÷ 17일 = 4.0GB) · 예전엔 (72−14)÷17 = 3.41GB', { now: g2(p2.share), ref: g2(r2.share) });
  ok(eq(p2.monthLeft, 68 * G) && eq(pc.spare.monthLeft, 38 * G), '휴대폰 2 자기 남은 68GB + 여분 남은 38GB = 106GB(= 유심 120GB − 장치 14GB)', { own: g2(p2.monthLeft), sp: g2(pc.spare.monthLeft) });
  /* 같은 날: 휴대폰 2 자기 몫이 남았는데 여분 주요가 켜진 경우(하루 주요 몫 닿음) — 여분 1GB를 써도 도우미 문 끝(lim)이 그대로여야 함 */
  const d1 = at('2026-11-13T15:00:00'); const a = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p2', uA: 4.03, uB: 2, prevA: 0, prevB: 0 }), d1); const b = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p2', uA: 4.03, uB: 3, sm: 1 }), d1);
  const la = AS.poolCaps(a, {})['USB\\B'].lim, lb = AS.poolCaps(b, {})['USB\\B'].lim;
  ok(eq(la, lb, 2), '같은 날 여분 1GB를 써도 휴대폰 2 문 끝(lim)은 그대로 — 예전엔 1GB 더 당겨졌음(자기 몫 −1 · 여분 −1)', { a: g2(la), b: g2(lb) });
  ok(eq(P(b, 'p2').left, P(a, 'p2').left) && eq(P(b, 'p2').spUsed, 1 * G), '휴대폰 2 오늘 자기 몫 남은 양 그대로 · 여분으로 뺀 1GB는 spUsed에 보임', { l: g2(P(b, 'p2').left), sp: g2(P(b, 'p2').spUsed)}); }

console.log('② 넘쳐 쓰기 0 — 유심 전체 · 하루 몫 합계 · 여분 상한');
{ const now = at('2026-11-20T07:00:00');
  /* 여러 날 섞음: 여분을 하루 몫 넘게 쓴 날 · 여분 바이트가 휴대폰 1에 셈된 날(휴대폰 2 바이트보다 여분이 큼) */
  const rows = [['2026-11-13', 4.03, 14, 9.67, 0.33], ['2026-11-14', 4.0, 6.5, 2.2, 0.3], ['2026-11-15', 4.0, 1.0, 3.0, 0], ['2026-11-16', 3.9, 9.0, 4.8, 0.3], ['2026-11-17', 4.1, 4.0, 0, 0], ['2026-11-18', 4.0, 12.0, 7.5, 0.4], ['2026-11-19', 4.0, 7.0, 2.6, 0.3]];
  const devB = rows.reduce((s, r) => s + r[2], 0), devA = rows.reduce((s, r) => s + r[1], 0), spAll = rows.reduce((s, r) => s + r[3] + r[4], 0);
  const pc = AS.poolCalc(doc, mkNet('2026-11-20', { act: 'p2', days: mkDays(rows), prevA: devA, prevB: devB }), now); const p2 = P(pc, 'p2');
  ok(p2.monthLeft + pc.spare.monthLeft <= (120 - devB) * G + 2, '휴대폰 2 남은 양(자기 + 여분) ≤ 유심 120GB − 장치에서 실제 쓴 ' + devB.toFixed(2) + 'GB', { own: g2(p2.monthLeft), sp: g2(pc.spare.monthLeft), real: 120 - devB });
  ok(eq(pc.spare.monthLeft, (48 - spAll) * G), '여분 남은 양 = 48 − 여분으로 센 ' + spAll.toFixed(2) + 'GB(여분 상한 그대로)', g2(pc.spare.monthLeft));
  const nL = 11; ok(pc.shareAll <= (72.54 - devA + 72) * G / nL + 2 && eq(P(pc, 'p1').share + p2.share, pc.shareAll), '하루 몫 합계 = 휴대폰 1 + 휴대폰 2 몫 ≤ (두 휴대폰 자기 남은 양) ÷ 남은 날', { all: g2(pc.shareAll), p1: g2(P(pc, 'p1').share), p2: g2(p2.share) });
  /* 11/15: 여분 3GB가 셈됐는데 휴대폰 2 장치 바이트는 1GB뿐 → 빼는 양은 1GB까지만 */
  const one = AS.poolCalc(doc, mkNet('2026-11-16', { act: 'p2', days: mkDays([['2026-11-15', 4.0, 1.0, 3.0, 0]]), prevB: 1 }), at('2026-11-16T07:00:00'));
  ok(eq(P(one, 'p2').usedPrev, 0) && eq(P(one, 'p2').monthLeft, 72 * G), '여분 바이트가 휴대폰 2 바이트보다 크면 휴대폰 2 바이트만큼만 뺌(자기 몫이 72GB를 넘지 않음)', g2(P(one, 'p2').monthLeft));
  /* 하루 몫 다 쓴 오늘 — 벤치 한 바퀴 밖 문은 오늘 몫 + 오늘 여분까지만 · 한 바퀴 중은 오늘 몫 + (이달 남은 여분 − 오늘 여분 일반) */
  const pT = AS.poolCalc(doc, mkNet('2026-11-20', { act: 'p2', days: mkDays(rows), prevA: devA, prevB: devB, uA: 4.5, uB: 3.0 }), now); const q2 = P(pT, 'p2'); const sp = pT.spare;
  const cn = AS.poolCaps(pT, {}), cm = AS.poolCaps(pT, { must: true });
  ok(eq(cn['USB\\B'].lim - q2.devUsed, Math.max(0, q2.left) + Math.max(0, sp.leftM) + Math.max(0, sp.leftG), 2), '한 바퀴 밖 휴대폰 2 문 = 오늘 몫 남은 + 오늘 여분(주요·일반)', g2(cn['USB\\B'].lim - q2.devUsed));
  ok(eq(cm['USB\\B'].lim - q2.devUsed, Math.max(0, q2.left) + sp.monthLeft - Math.max(0, sp.leftG), 2) && cm['USB\\B'].lim - q2.devUsed <= Math.max(0, q2.left) + sp.monthLeft + 2, '한 바퀴 중 휴대폰 2 문 = 오늘 몫 남은 + (이달 남은 여분 − 오늘 여분 일반) — bovf 상한 그대로', g2(cm['USB\\B'].lim - q2.devUsed));
  ok(eq(cm['USB\\A'].lim - P(pT, 'p1').devUsed, Math.max(0, P(pT, 'p1').left), 2), '휴대폰 1은 한 바퀴 중에도 오늘 몫까지(넘겨 쓰기 0)', g2(cm['USB\\A'].lim - P(pT, 'p1').devUsed));
  /* 남은 양을 정한 날(dayUsedGB) — 그 전 바이트는 여분부터 썼다고 보고 덜 뺌 */
  const dp = { budget: { mainPct: 87.5, pool: { ...pool, month: { '2026-11': { p1: pool.month['2026-11'].p1, p2: { from: '2026-11-13', remainGB: 72, dayUsedGB: 3 } } } } } };
  const pd = AS.poolCalc(dp, mkNet('2026-11-14', { act: 'p2', days: mkDays([['2026-11-13', 4.03, 8, 4, 0]]), prevB: 8 }), at('2026-11-14T07:00:00'));
  ok(eq(P(pd, 'p2').usedPrev, 4 * G), '남은 양 정한 날: 장치 8 − 정하기 전 3 − 여분(4 − 3 = 1)만 뺌 = 자기 4GB(덜 빼서 넘쳐 쓰기 0 쪽)', g2(P(pd, 'p2').usedPrev)); }

console.log('③ 휴대폰 1은 그대로');
{ const rows = [['2026-11-13', 4.03, 14, 9.67, 0.33], ['2026-11-14', 4.2, 6.5, 2.2, 0.3]]; const now = at('2026-11-15T09:00:00');
  const a = AS.poolCalc(doc, mkNet('2026-11-15', { act: 'p1', days: mkDays(rows), prevA: 8.23, prevB: 20.5, uA: 2.5, uB: 1.0, sm: 0.5 }), now); const b = AS.poolCalc(noSp, mkNet('2026-11-15', { act: 'p1', days: mkDays(rows), prevA: 8.23, prevB: 20.5, uA: 2.5, uB: 1.0, sm: 0.5 }), now);
  const pa = P(a, 'p1'), pb = P(b, 'p1'); ok(['share', 'usedPrev', 'usedT', 'left', 'monthLeft'].every((k) => pa[k] === pb[k]) && !pa.spUsed, '휴대폰 1 몫·사용·남은 양은 여분 설정이 있든 없든 똑같음(여분 빼기 안 함)', { a: g2(pa.share), b: g2(pb.share), u: g2(pa.usedPrev) });
  ok(eq(pa.share, (72.54 - 8.23) / 16 * G) && eq(pa.left, pa.share - 2.5 * G), '휴대폰 1 하루 몫 = (72.54 − 8.23) ÷ 16일 · 오늘 남은 = 몫 − 2.5GB', { s: g2(pa.share), l: g2(pa.left) });
  ok(eq(P(a, 'p2').share, (72 - 8) / 16 * G) && eq(P(a, 'p2').usedT, 0.5 * G), '휴대폰 2 하루 몫 = (72 − 자기 몫 8GB(장치 20.5 − 여분 12.5)) ÷ 16일 = 4.0GB · 오늘 자기 사용 0.5GB(장치 1 − 여분 0.5)', [g2(P(a, 'p2').share), g2(P(a, 'p2').usedT)]); }

console.log('④ 12월(여분 없음)은 그대로');
{ const dec = { budget: { mainPct: 87.5, pool: { ...pool, month: {} } } }; const decNo = { budget: { mainPct: 87.5, pool: { ...pool, month: {}, spare: {} } } };
  const rows = [['2026-12-01', 3.9, 4.0, 0, 0], ['2026-12-02', 3.8, 4.1, 0, 0]]; const net = mkNet('2026-12-03', { act: 'p2', days: mkDays(rows), uA: 1, uB: 1 }); const now = at('2026-12-03T09:00:00');
  const a = AS.poolCalc(dec, net, now), b = AS.poolCalc(decNo, net, now);
  ok(!a.spare && JSON.stringify(a.phones) === JSON.stringify(b.phones), '12월: 여분 칸 없음 · 휴대폰 셈이 여분 설정 없는 것과 똑같음');
  ok(eq(P(a, 'p2').share, 120 / 31 * G) && eq(P(a, 'p1').share, 120 / 31 * G), '12월 하루 몫 = 120GB ÷ 31일(휴대폰마다)', [g2(P(a, 'p1').share), g2(P(a, 'p2').share)]);
  const cm = AS.poolCaps(a, { must: true }); ok(a.phones.every((p) => eq(cm[p.dev].lim - p.devUsed, Math.max(0, p.left), 2)), '12월 벤치 중에도 그날 몫에서 닫힘'); }

console.log(bad ? `❌ tBOVF2_1113 실패 ${bad}` : '✓ tBOVF2_1113 모두 통과'); process.exit(bad ? 1 : 0);
