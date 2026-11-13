/* tSPARE2_1113 — 정범님 11/13 14:03 🎁 여분 통·여분 배정표·로거 도우미 🎁 여분 칸 (일꾼 spare2)
 *  ① 여분 통 = 고정 여분(11월 48GB) + 휴대폰마다 하루 몫을 다 못 써 쌓인 남은 양(자기 몫 안 · 유심 실제 남은 양을 넘지 않음) · 넘게 쓴 날은 쌓이지 않음 · 남은 0GB 유심(F23)은 0
 *  ② 하루 몫보다 먼저: 배정표 일이 쌓인 남은 양으로 쓴 바이트(net.boxUse)는 하루 몫 사용에서 빠짐 · 휴대폰 문(lim)은 그대로
 *  ③ 배정표 기본값(차례·비율·근거 · 알라딘 비로그인 일만 F05) · 정해지면 바로 씀(drain) · 11/30 그대로
 *  ④ spareAlloc — 일하는 줄끼리 남은 몫 지킴 · 일 없는 줄 몫은 다른 줄이 씀 · 달 끝엔 모두 엶 · 끈 줄 0
 *  ⑤ poolCaps — 쌓인 남은 양도 문 안 · 한 바퀴 중 넘쳐 쓰기 = 배정표 넘침 줄 남은 양까지 · 휴대폰 1은 여분 휴대폰이 아니면 넘쳐 쓰기 없음 · 유심 전체를 넘지 않음
 *  ⑥ bovf2 이중 차감 없음 그대로 · 12월(고정 여분 없음)엔 쌓인 남은 양만
 *  ⑦ 수집기 글자 떼어 돌림(spTk · budLeft) · 기록·신호·도우미 알림 글자 ⑧ 도우미 🎁 여분 칸(첫 화면·작은 창) · 화면 사진(RN_SHOT=폴더)
 * 실행: node src/tests/tSPARE2_1113.js (도우미는 127.0.0.1 빈 포트 하나 · 화면 사진은 playwright가 있으면) */
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
require(path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;
const G = 1073741824; const at = (s) => Date.parse(s + '+09:00'); const g2 = (b) => Math.round(b / G * 100) / 100; const near = (a, b, t) => Math.abs(a - (Math.abs(b) < 1e5 ? b * G : b)) < (t || 0.01) * G; /* b가 작은 수면 GB, 크면 바이트 */
const C = rd('src/readnow-collector.src.js');
const pool = { on: true, fb: 'p1', list: { p1: { name: '휴대폰 1', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2', gb: 120, dev: 'USB\\B', order: 2 } }, month: { '2026-11': { p1: { from: '2026-11-13', remainGB: 72.54 }, p2: { from: '2026-11-13', remainGB: 72 } } }, spare: { '2026-11': { gb: 48, from: '2026-11-12', phone: 'p2', pace: true } } };
const doc = { budget: { mainPct: 87.5, pool } };
const mkDays = (rows) => Object.fromEntries(rows.map(([k, a, b, sm, sg]) => [k, { tether: (a + b) * G, phones: { 'USB\\A': a * G, 'USB\\B': b * G }, ...(sm || sg ? { tiers: { sm: (sm || 0) * G, sg: (sg || 0) * G } } : {}) }]));
const mkNet = (key, o) => { o = o || {}; const uA = o.uA || 0, uB = o.uB || 0, sm = o.sm || 0, sg = o.sg || 0;
  return { capGB: 240, days: o.days || {}, boxUse: o.bu || undefined, phones: [{ id: 'USB\\A', used: ((o.prevA || 0) + uA) * G, active: o.act === 'p1', connected: o.c1 !== false }, { id: 'USB\\B', used: ((o.prevB || 0) + uB) * G, active: o.act !== 'p1', connected: o.c2 !== false, ...(o.bad2 ? { net: { bad: true } } : {}) }],
    today: { key, tether: (uA + uB) * G, tiers: { main: Math.max(0, uA + uB - sm - sg) * G, gen: 0, sm: sm * G, sg: sg * G }, phones: { 'USB\\A': uA * G, 'USB\\B': uB * G } } }; };
const P = (pc, id) => pc.phones.find((p) => p.id === id);

console.log('① 여분 통 = 고정 여분 + 쌓인 남은 양');
{ const pc = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p2' }), at('2026-11-13T09:15:00'));
  ok(near(P(pc, 'p1').share, 4.03) && near(P(pc, 'p2').share, 4.0) && P(pc, 'p1').carry === 0 && P(pc, 'p2').carry === 0, '11/13(정한 날): 하루 몫 4.03 + 4.00 · 쌓인 남은 양 0', { a: g2(P(pc, 'p1').share), b: g2(P(pc, 'p2').share) });
  ok(near(pc.box.left, 48) && near(pc.box.fixedLeft, 48) && pc.box.carryLeft === 0 && pc.box.on && pc.box.drain, '여분 통 = 고정 여분 48GB · 배정표 켜짐 · 바로 씀', pc.box);
  /* 11/13: 휴대폰 1 자기 몫 4.03 다 씀 · 휴대폰 2 자기 몫 2.0만 씀(+ 여분 sm 1 · sg 0.2) */
  const days = mkDays([['2026-11-13', 4.03, 3.2, 1.0, 0.2]]); const pc2 = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 3.2 }), at('2026-11-14T10:00:00'));
  const a = P(pc2, 'p1'), b = P(pc2, 'p2');
  ok(near(b.share, 4.0) && near(b.carry, 2.0) && near(a.share, 4.03) && a.carry < 0.01 * G, '11/14: 휴대폰 2 하루 몫 그대로 4.0 · 못 쓴 2.0GB는 쌓인 남은 양(남은 날에 다시 나누지 않음) · 휴대폰 1은 다 써서 0', { a: [g2(a.share), g2(a.carry)], b: [g2(b.share), g2(b.carry)] });
  ok(near(pc2.spare.left0, 46.8) && near(pc2.box.left, 48.8) && near(pc2.box.carryLeft, 2.0), '여분 통 = 고정 여분 남은 46.8 + 쌓인 2.0 = 48.8GB', { l: g2(pc2.box.left) });
  for (const p of pc2.phones) ok(Math.abs(p.share * pc2.nLeft + p.carry - p.remain0) < 1e6, `${p.name}: 하루 몫 × 남은 날 + 쌓인 남은 양 = 자기 남은 양(넘쳐 쓰기 0)`, { s: g2(p.share), c: g2(p.carry), r: g2(p.remain0) });
  /* 넘게 쓴 날 — 쌓이지 않고 하루 몫이 줄어듦(예전대로) */
  const pc3 = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days: mkDays([['2026-11-13', 6, 4, 0, 0]]), prevA: 6, prevB: 4 }), at('2026-11-14T10:00:00'));
  ok(P(pc3, 'p1').carry === 0 && near(P(pc3, 'p1').share, (72.54 - 6) / 17), '넘게 쓴 휴대폰 1: 쌓인 남은 양 0 · 하루 몫 = 남은 ÷ 남은 날(예전대로)', g2(P(pc3, 'p1').share));
  /* 휴대폰이 빠져 하루를 못 쓴 날 → 다음 날 그 몫은 쌓인 남은 양(어떤 까닭이든) */
  const pc4 = AS.poolCalc(doc, mkNet('2026-11-15', { act: 'p1', days: mkDays([['2026-11-13', 4.03, 4, 0, 0], ['2026-11-14', 4.03, 0, 0, 0]]), prevA: 8.06, prevB: 4 }), at('2026-11-15T10:00:00'));
  ok(near(P(pc4, 'p2').carry, 4.0) && near(P(pc4, 'p2').share, 4.0), '휴대폰 2가 하루 빠진 몫 4GB → 쌓인 남은 양', g2(P(pc4, 'p2').carry));
  /* F23 — 남은 0GB 유심 */
  const z = { budget: { mainPct: 87.5, pool: { ...pool, month: { '2026-11': { ...pool.month['2026-11'], p1: { from: '2026-11-13', remainGB: 0 } } } } } };
  const pz = AS.poolCalc(z, mkNet('2026-11-14', { act: 'p2', days: mkDays([['2026-11-13', 0, 4, 0, 0]]), prevB: 4 }), at('2026-11-14T10:00:00'));
  ok(P(pz, 'p1').share === 0 && P(pz, 'p1').carry === 0 && P(pz, 'p1').monthLeft === 0, 'F23 남은 0GB 유심: 하루 몫 0 · 쌓인 남은 양 0', P(pz, 'p1'));
  const off = { budget: { mainPct: 87.5, pool: { ...pool, carry: false } } }; const po = AS.poolCalc(off, mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 3.2 }), at('2026-11-14T10:00:00'));
  ok(P(po, 'p2').carry === 0 && near(P(po, 'p2').share, 70 / 17), 'pool.carry=false면 예전 셈(남은 ÷ 남은 날)', g2(P(po, 'p2').share)); }

console.log('② 하루 몫보다 먼저 — 배정표 일이 쌓인 남은 양으로 쓴 바이트');
{ const days = mkDays([['2026-11-13', 4.03, 3.2, 1.0, 0.2]]);
  const n0 = mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 3.2, uB: 1.5 }); const p0 = AS.poolCalc(doc, n0, at('2026-11-14T12:00:00'));
  const n1 = mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 3.2, uB: 1.5, bu: { p2: 0.5 * G, _m: 0.5 * G } }); const p1 = AS.poolCalc(doc, n1, at('2026-11-14T12:00:00'));
  ok(near(P(p1, 'p2').carryUsed, 0.5) && near(P(p1, 'p2').carryLeft, 1.5) && near(P(p1, 'p2').left, P(p0, 'p2').left / G + 0.5), '휴대폰 2: 쌓인 남은 양에서 0.5GB 먼저 빠짐 · 하루 몫 남은 양은 0.5GB 그대로 남음', { cu: g2(P(p1, 'p2').carryUsed), l0: g2(P(p0, 'p2').left), l1: g2(P(p1, 'p2').left) });
  ok(near(p1.used, p0.used / G - 0.5) && near(p1.box.usedT, 0.5) && near(p1.box.left, p0.box.left / G - 0.5), '하루 몫 사용 0.5GB 덜 · 여분 통에서 0.5GB 씀', { u0: g2(p0.used), u1: g2(p1.used) });
  const c0 = AS.poolCaps(p0, {}), c1 = AS.poolCaps(p1, {}); ok(Math.abs(c0['USB\\B'].lim - c1['USB\\B'].lim) < 2, '휴대폰 문(lim)은 바이트 셈 차례와 상관없이 같음', [g2(c0['USB\\B'].lim), g2(c1['USB\\B'].lim)]);
  const big = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 3.2, uB: 1.5, bu: { p2: 9 * G } }), at('2026-11-14T12:00:00')); ok(near(P(big, 'p2').carryUsed, 1.5), '알린 바이트가 많아도 그 휴대폰 오늘 바이트·쌓인 양을 넘겨 빼지 않음', g2(P(big, 'p2').carryUsed)); }

console.log('③ 배정표 기본값 · 바로 씀');
{ const A = AS.allocOf(doc); const ids = A.rows.map((r) => r.id); const PUB = new Set(['bench', 'benchForce', 'benchHelp', 'benchDetail', 'benchResume', 'explore', 'market', 'metricsReq', 'metricsAuto', 'nbMarket', 'revTop', 'rev6mAll', 'rev6mStale', 'revAll', 'rev6m', 'dynamic', 'dynamic0', 'dynAll', 'poolInfo']);
  ok(ids.join() === 'benchOv,sellerRe,benchDetail,benchResume,mktPub' && A.on && A.drain, '차례: 벤치마킹 넘침 → 판매자 다시 읽기 → 상품 페이지 정보 → 이어 읽기 → 시장 지표', ids);
  ok(A.rows.every((r) => r.jobs.length && r.jobs.every((j) => PUB.has(j)) && r.why) && !A.rows.some((r) => r.jobs.some((j) => /explore|dyn|nbMarket/.test(j))), '모든 줄 = 알라딘 비로그인 일만(F05) · 끝없는 탐색·동적 탐색 없음 · 줄마다 근거');
  ok(A.sum === 100 && A.mainPct === 87.5, '비율 합 100 · 주요 줄 87.5%(지금 주요 비율과 같음)', A);
  const pc = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2' }), at('2026-11-14T10:00:00')); ok(near(pc.spare.day, pc.spare.left0, 0.001) && near(pc.spare.main, 48 * 0.875), '여분 오늘 = 남은 여분 전부(날로 나누지 않음) · 주요 42GB', { d: g2(pc.spare.day) });
  const last = AS.poolCalc(doc, mkNet('2026-11-30', { act: 'p2' }), at('2026-11-30T09:00:00')); ok(near(last.spare.day, last.spare.left0, 0.001), '11/30 안전망 그대로(남은 여분 전부)');
  const lim = { budget: { mainPct: 87.5, pool: { ...pool, alloc: { drain: false, rows: { benchDetail: { pct: 50 }, sellerRe: { on: false }, mktPub: { order: 2 } } } } } }; const A2 = AS.allocOf(lim); const p2 = AS.poolCalc(lim, mkNet('2026-11-14', { act: 'p2' }), at('2026-11-14T10:00:00'));
  ok(!A2.drain && near(p2.spare.day, 48 / 17) && A2.rows.find((r) => r.id === 'benchDetail').pct === 50 && !A2.rows.find((r) => r.id === 'sellerRe').on && A2.rows.findIndex((r) => r.id === 'mktPub') < A2.rows.findIndex((r) => r.id === 'benchDetail'), '설정(budget.pool.alloc)으로 바꿈: 날로 나눔 · 비율 · 끔 · 차례', { d: g2(p2.spare.day), o: A2.rows.map((r) => r.id) }); }

console.log('④ spareAlloc');
{ const box = 10 * G; const a = AS.spareAlloc(doc, { box, usedT: 0, act: { benchDetail: true, mktPub: true } }); const r = (id) => a.rows.find((x) => x.id === id);
  ok(near(r('benchDetail').b, 3.25) && near(r('mktPub').b, 0.75) && near(r('benchOv').b, 4), '줄 몫 = 여분 통 × 비율', a.rows.map((x) => [x.id, g2(x.b)]));
  ok(near(r('benchDetail').left, 9.25) && near(r('mktPub').left, 6.75) && near(r('sellerRe').left, 6.0), '일하는 줄끼리 남은 몫 지킴 · 일 없는 줄(벤치 넘침·판매자) 몫은 다른 줄이 씀', a.rows.map((x) => [x.id, g2(x.left)]));
  const u = AS.spareAlloc(doc, { box: 7 * G, usedT: 3 * G, use: { benchDetail: 3 * G }, act: { benchDetail: true, mktPub: true } }); ok(near(u.start, 10) && near(u.rows.find((x) => x.id === 'benchDetail').keep, 0.25) && near(u.rows.find((x) => x.id === 'mktPub').left, 6.75), '상품 페이지 정보가 제 몫 3.25 중 3을 쓰면 지켜 줄 몫은 0.25뿐 — 시장 지표는 남은 7 − 0.25 = 6.75GB', u.rows.map((x) => [x.id, g2(x.left)]));
  const o = AS.spareAlloc(doc, { box, usedT: 0, act: { benchDetail: true, mktPub: true, benchOv: true }, open: true }); ok(o.rows.every((x) => near(x.left, 10)), '달 끝(open) — 몫 구분 없이 모두 엶');
  const off = AS.spareAlloc({ budget: { pool: { ...pool, alloc: { rows: { sellerRe: { on: false } } } } } }, { box, usedT: 0 }); ok(off.rows.find((x) => x.id === 'sellerRe').left === 0 && !off.of('prd:rev6m') && off.of('prd:benchDetail').id === 'benchDetail' && off.of('job:market#x').id === 'mktPub' && !off.of('explore'), '끈 줄 0 · 일 열쇠 찾기(prd:·job:·#) · 배정표 밖 일 없음');
  const no = AS.spareAlloc({ budget: { pool: { ...pool, alloc: { on: false } } } }, { box, usedT: 0 }); ok(!no.on && !no.of('benchDetail') && no.rows.every((x) => x.left === 0), '배정표 끔이면 아무 일도 여분을 받지 않음'); }

console.log('⑤ poolCaps — 쌓인 남은 양·넘침 상한·유심 전체');
{ const days = mkDays([['2026-11-13', 3.03, 3.2, 1.0, 0.2]]); const pc = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days, prevA: 3.03, prevB: 3.2, uA: 0.5, uB: 1.0 }), at('2026-11-14T10:00:00'));
  const a = P(pc, 'p1'), b = P(pc, 'p2'); const c = AS.poolCaps(pc, {});
  ok(near(a.carry, 1.0) && near(c['USB\\A'].lim - a.devUsed, a.left / G + 1.0), '휴대폰 1 문 = 오늘 몫 남은 + 쌓인 남은 양 1GB', { lim: g2(c['USB\\A'].lim - a.devUsed), l: g2(a.left), c: g2(a.carry) });
  const m = AS.poolCaps(pc, { must: true }); ok(Math.abs(m['USB\\A'].lim - c['USB\\A'].lim) < 2, '한 바퀴 중에도 휴대폰 1은 넘쳐 쓰기 없음(오늘 몫 + 자기 쌓인 양까지만 · F23)');
  pc.ovCap = 5 * G; const m5 = AS.poolCaps(pc, { must: true }); pc.ovCap = null; ok(near(m5['USB\\B'].lim - b.devUsed, b.left / G + b.carryLeft / G + 5), '한 바퀴 중 휴대폰 2 넘쳐 쓰기 = 배정표 넘침 줄 남은 5GB까지', g2(m5['USB\\B'].lim - b.devUsed));
  const m0 = AS.poolCaps(pc, { must: true, ovCap: 0 }); ok(near(m0['USB\\B'].lim - b.devUsed, b.left / G + b.carryLeft / G), '넘침 줄을 끄면(0) 한 바퀴 중에도 그날 몫 + 쌓인 양에서 닫힘');
  for (const [nm, cp] of [['평소', c], ['한 바퀴 중', m]]) { const room = cp['USB\\B'].lim - b.devUsed; ok(room <= b.monthLeft + pc.spare.monthLeft + 1e6, `유심 전체: 휴대폰 2 문(${nm}) ≤ 자기 이달 남은 + 고정 여분 남은`, { room: g2(room), own: g2(b.monthLeft), fx: g2(pc.spare.monthLeft) }); const ra = cp['USB\\A'].lim - a.devUsed; ok(ra <= a.monthLeft + 1e6, `유심 전체: 휴대폰 1 문(${nm}) ≤ 자기 이달 남은`); } }

console.log('⑥ bovf2 이중 차감 없음 · 12월');
{ const days = mkDays([['2026-11-13', 4.03, 14, 9.0, 1.0]]); const pc = AS.poolCalc(doc, mkNet('2026-11-14', { act: 'p2', days, prevA: 4.03, prevB: 14 }), at('2026-11-14T10:00:00'));
  ok(near(P(pc, 'p2').share, 4.0) && near(P(pc, 'p2').monthLeft, 68) && near(pc.spare.monthLeft, 38), '여분 10GB 쓴 다음 날: 휴대폰 2 하루 몫 4.0 · 자기 남은 68 · 여분 38(이중 차감 없음)', { s: g2(P(pc, 'p2').share), m: g2(P(pc, 'p2').monthLeft), f: g2(pc.spare.monthLeft) });
  const dec = AS.poolCalc(doc, { capGB: 240, days: mkDays([['2026-12-01', 2, 2], ['2026-12-02', 2, 2], ['2026-12-03', 2, 2], ['2026-12-04', 2, 2]]), phones: [{ id: 'USB\\A', used: 8 * G, active: true, connected: true }, { id: 'USB\\B', used: 8 * G, active: false, connected: true }], today: { key: '2026-12-05', tether: 0, tiers: {}, phones: {} } }, at('2026-12-05T10:00:00'));
  ok(!dec.spare && near(P(dec, 'p1').share, 120 / 31) && near(P(dec, 'p1').carry, 4 * (120 / 31 - 2)) && near(dec.box.left, 2 * 4 * (120 / 31 - 2)), '12월: 고정 여분 없음 · 하루 몫 120÷31 그대로 · 못 쓴 몫은 쌓인 남은 양(휴대폰마다 7.48GB)', { s: g2(P(dec, 'p1').share), c: g2(P(dec, 'p1').carry) });
  const dm = AS.poolCaps(dec, { must: true }); ok(near(dm['USB\\A'].lim - 8 * G, P(dec, 'p1').share / G + P(dec, 'p1').carry / G), '12월 한 바퀴 중: 넘쳐 쓸 휴대폰 없음 — 오늘 몫 + 자기 쌓인 양까지'); }

console.log('⑦ 수집기 글자 떼어 돌림 · 기록·신호');
{ const i0 = C.indexOf('let SP2CUR = null; const spTk = (k) =>'); const i1 = C.indexOf('const sp2Add = ', i0); ok(i0 > 0 && i1 > i0, 'spTk 찾음');
  const mk = (src) => new Function('BUD', 'tierOfKey', 'spT', src + '; return spTk;');
  const tierOfKey = (k) => (/rev|market/.test(k) ? 'gen' : 'main'); const spT = (t) => t;
  const A = AS.spareAlloc(doc, { box: 10 * G, usedT: 0 }); const pc = { act: 'p2', spare: { phone: 'p2', monthLeft: 40 * G, later: false }, phones: [{ id: 'p1', carryLeft: 2 * G }, { id: 'p2', carryLeft: 0 }] };
  const f = mk(C.slice(i0, i1)); const B = { alloc: A, pool: pc, ovOn: false }; const T = f(B, tierOfKey, spT);
  ok(T('benchDetail') === 'sm' && T('rev6m') === 'sg' && T('explore') === 'main', '여분 휴대폰: 배정표 일은 하루 몫보다 먼저 여분(sm·sg) · 배정표 밖 일(탐색)은 하루 몫');
  ok(T('bench') === 'main', '벤치마킹 한 바퀴 줄: 하루 주요 몫을 다 쓰기 전엔 하루 몫'); B.ovOn = true; ok(T('bench') === 'sm', '하루 주요 몫을 다 쓴 뒤 넘친 바이트 = 여분');
  pc.act = 'p1'; ok(T('benchDetail') === 'main', '휴대폰 1(고정 여분 없음) + 쌓인 남은 양 2GB → 꼬리표 없이(쌓인 양으로 셈 · net.boxUse)');
  pc.phones[0].carryLeft = 0; ok(T('benchDetail') === 'main', '여분 없는 휴대폰이면 하루 몫');
  { const a0 = C.indexOf('const SP2K = '); const a1 = C.indexOf('const budLeft = (k)', a0); const src = C.slice(a0, C.indexOf('\n', C.indexOf('const sp2Bytes = ', a0)) + 1); let store = { d: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), rc: { sellerRe: 1000 }, pu: {}, tc: 1000, la: {} }; /* 1.89.315 저장 꼴(tb0 없음) */
    const f = new Function('GM_getValue', 'GM_setValue', 'tierOfKey', 'spT', 'BUD', 'setTimeout', src + '; return { sp2Bytes, sp2Add, set: (c) => { SP2CUR = c; } };')((k, d) => store || d, (k, v) => { store = JSON.parse(JSON.stringify(v)); }, () => 'gen', (t) => t, null, () => 0);
    const H0 = { today: { key: store.d, tether: 9.6 * G } }; const y0 = f.sp2Bytes(H0); ok(!y0.use.sellerRe && store.tb0 === 9.6 * G, '하루 중간에 세기 시작: 그때까지 바이트(9.6GB)는 줄 쓴 양에 넣지 않음(1.89.315 부풂 고침)', y0.use);
    f.set({ r: 'sellerRe', ph: 'p2', fx: true, t: 'gen' }); f.sp2Add(3000); f.set(null); f.sp2Add(1000); const y1 = f.sp2Bytes({ today: { key: store.d, tether: 9.6 * G + 40 * 1048576 } }); ok(Math.abs(y1.use.sellerRe - 30 * 1048576) < 1048576, '그 뒤 바이트 40MB를 글자 비율(3:1)로 → 판매자 다시 읽기 30MB', Math.round(y1.use.sellerRe / 1048576)); }
  const j0 = C.indexOf('const budLeft = (k) => { const n = budLeft0(k);'); const j1 = C.indexOf('const budLeft0 = ', j0); ok(j0 > 0 && j1 > j0, 'budLeft 찾음');
  const bl = new Function('BUD', 'budLeft0', 'isBenchKey', C.slice(j0, j1) + '; return budLeft;'); const isB = (k) => /^bench/.test(k);
  pc.act = 'p2'; const B2 = { alloc: A, pool: pc, benchOwe: false }; const L = bl(B2, () => 0, isB);
  ok(near(L('benchDetail'), 10) && near(L('market'), 10) && L('explore') === 0, '배정표 일 = 그 줄이 쓸 수 있는 여분 · 밖 일 = 하루 몫(0)', [g2(L('benchDetail')), g2(L('market'))]);
  ok(bl(B2, () => 3 * G, isB)('bench') === 3 * G, '벤치마킹 한 바퀴 줄은 예전 셈(넘쳐 쓰기는 도우미 문 상한)');
  ok(bl({ ...B2, benchOwe: true }, () => 0, isB)('market') === 0, '한 바퀴 전엔 벤치마킹 아닌 일은 여분도 못 씀(정범님 10/25 벤치마킹 먼저)');
  pc.spare.monthLeft = 0; pc.phones[1].carryLeft = 0; ok(bl(B2, () => 0, isB)('benchDetail') === 0, '지금 휴대폰에 여분이 없으면 0(다른 휴대폰으로 넘어가면 씀)');
  ok(/try \{ H\.boxUse = sp2Bytes\(H\)\.bu; \} catch \(e\) \{\} \/\* \(spare2\)[^\n]{0,80}\*\/ const b = AS\.budget\(SCHED \|\| \{\}, H, Date\.now\(\)\);/.test(C), 'budget 셈 전에 쌓인 남은 양으로 쓴 바이트를 알림(net.boxUse)');
  ok(/if \(sp && !sp\.later && !\(b\.alloc && b\.alloc\.on\)\) \{/.test(C), '배정표가 켜지면 예전 여분 칸(일반 일 모두에 여분을 엶)은 쓰지 않음 — 아무 데나 쓰지 않음');
  ok(/const open = PCx\.nLeft <= 1 \|\| \(PCx\.nLeft <= 3 && kd\.getUTCHours\(\) >= 18\);/.test(C) && /act\[r\.id\] = r\.ov \? !!b\.benchMust :/.test(C), '달 끝 모두 엶 · 넘침 줄은 한 바퀴 중에만 일함');
  ok(/pc\.ovCap = ovR \? \(ovR\.on \? ovR\.left : 0\) : null; const caps = AS\.poolCaps\(pc, \{ must: !!b\.benchMust, keep: \+poolTick\._keep \|\| 0 \}\);/.test(C), '도우미 문에 넘침 줄 남은 양(ovCap)');
  ok(/BUD\.left\.gen > 0 \|\| allocLeft\(\)\)\);/.test(C) && /const allocLeft = \(\) => \{ try \{ const A = BUD && BUD\.alloc; return !!\(A && A\.on && !BUD\.benchOwe && A\.rows\.some\(\(r\) => !r\.ov && r\.on && r\.jobs\.some\(\(j\) => budLeft\(j\) > 0\)\)\);/.test(C), '하루 몫을 다 써도 배정표 줄에 여분이 남으면 테더링 남음(쉴 때 일이 여분 일을 고름 — 첫 판에서 빠졌던 것)');
  ok(/BUD\.alloc\.rows\.filter\(\(r\) => !r\.ov && r\.left > 0 && r\.jobs\.some/.test(C), '쉴 때 일 차례 = 배정표 차례(여분 남은 줄의 상품 페이지 정보·이어 읽기)');
  ok(/🎁 여분 씀 시작 — \$\{b\.spareOn\.l\}\(배정표/.test(C) && /🎁 여분 씀 끝 — 오늘 쓴 여분 \$\{spG\(BX\.usedT\)\}GB · 여분 통 남은/.test(C) && /X\.st = new Date\(\)\.toISOString\(\); else X\.en = /.test(C), '기록: 🎁 여분 씀 시작/끝(무슨 일 · 여분 통 남은 · 오늘 쓴) · 시작/끝 시각 저장');
  ok(/o\.bxT = Math\.round\(BX\.total\); o\.bxL = Math\.round\(BX\.left\); o\.bxU = Math\.round\(BX\.usedT\);/.test(C) && /o\['r' \+ L \+ 'n'\] = String\(r\.l\)\.slice\(0, 24\)/.test(C) && /o\.bxSt = hm\(X\.st\); o\.bxEn = hm\(X\.en\); o\.bxNow =/.test(C), '도우미 알림(/bud): 여분 통 총량·남은·오늘 쓴·배정표 줄·시작/끝·지금 일');
  ok(/bx: BUD\.pool && BUD\.pool\.box \? \{ on: !!BUD\.pool\.box\.on, t: Math\.round\(BUD\.pool\.box\.total\)/.test(C), '신호 pcBeat.pace.bx(진단으로 확인)');
  const kk = Object.keys({ bxOn: 1, bxT: 1, bxL: 1, bxU: 1, bxOk: 1, bxF: 1, bxFG: 1, bxC: 1, bxDr: 1, bxS: 1, bxSt: 1, bxEn: 1, bxNow: 1, rAn: 1, rFl: 1 }); ok(kk.every((k) => /^[a-zA-Z]{1,12}$/.test(k)), '알림 열쇠가 도우미 /bud 거름(영문 12자)을 지남'); }

console.log('⑧ 웹앱 ⏰ 로거 › 휴대폰 칸 🎁 여분 배정표(편집)');
{ const S = rd('readnow-autosched-core.js'); ok(/data-alloc="pct" data-id=/.test(S) && /data-alloc="order"/.test(S) && /data-alloc="ron"/.test(S) && /data-alloc="drain"/.test(S) && /ctx\.setBudget\(\{ pool: \{ alloc: patch \} \}\)/.test(S), '비율·차례·켬·바로 씀을 바꿔 budget.pool.alloc에 저장(브라우저 팝업 없음 · 알림 띠)');
  ok(!/\b(alert|confirm|prompt)\(/.test(S.slice(S.indexOf('function asBudBind'), S.indexOf('function asBudBind') + 3000)), '팝업 금지'); }

/* ⑨ 도우미 🎁 여분 칸 */
const SRC = path.join(R, 'local/readnow-local.js'); const LS = fs.readFileSync(SRC, 'utf8');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tspare2_')); const LOC = path.join(HOME, 'local'); fs.mkdirSync(LOC); const PORT = 21200 + Math.floor(Math.random() * 1500); const TF = path.join(HOME, 'fake.json');
const P1 = 'USB\\VID_04E8&PID_6863\\AAAA0001', P2 = 'USB\\VID_04E8&PID_6863\\BBBB0002';
fs.writeFileSync(TF, JSON.stringify({ ifaces: [{ name: '이더넷', ip: '192.168.0.10', desc: 'Realtek PCIe GbE' }, { name: '휴대폰 테더링', ip: '10.99.73.178', desc: 'Remote NDIS based Internet Sharing Device' }, { name: '이더넷 3', ip: '192.168.42.2', desc: 'Remote NDIS based Internet Sharing Device #2' }], hw: { '이더넷': { id: 'PCI\\VEN_10EC&DEV_8168\\X' }, '휴대폰 테더링': { id: P1 }, '이더넷 3': { id: P2 } }, pubip: { '192.168.0.10': '125.1.1.1', '10.99.73.178': '39.7.7.7', '192.168.42.2': '39.8.8.8' }, mobile: { '39.7.7.7': { mobile: true, isp: 'SKT' }, '39.8.8.8': { mobile: true, isp: 'KT' }, '125.1.1.1': { mobile: false, isp: 'KT 유선' } }, speed: { [P1]: { rtt: 40, mbps: 20.7, bytes: 3e6, ms: 1100 }, [P2]: { rtt: 33, mbps: 11.4, bytes: 5e5, ms: 100 } }, defaultIp: '192.168.0.10' }));
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷', capGB: 120, planGB: 120, planId: 'p20261021b', planSince: '2026-10-21', planPre: 0, planPrePh: {}, phCap1024: 'x', phName1026: 'x', phones: { [P1]: { name: '휴대폰 1', capGB: 120, order: 1 }, [P2]: { name: '휴대폰 2', capGB: 120, order: 2 } } }));
const req = (p, h) => new Promise((res, rej) => { const rq = http.get({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: '127.0.0.1:' + PORT, ...(h || {}) }, timeout: 4000 }, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }); rq.on('error', rej); rq.on('timeout', () => rq.destroy(new Error('timeout'))); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  console.log('⑨ 로거 도우미 🎁 여분 칸');
  ok(/const VERSION = '1\.8\.(2[8-9]|[3-9]\d)'/.test(LS), '도우미 판 1.8.28 이상');
  let child = null, out = '';
  try {
    child = cp.spawn(process.execPath, [SRC], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] }); child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
    for (let i = 0; i < 60; i++) { try { const s = JSON.parse(await req('/status')); if (s && s.ok) break; } catch (e) {} await sleep(150); }
    const d = { pool: true, pS: Math.round(8.03 * G), pM: Math.round(7.03 * G), pG: Math.round(1 * G), pU: Math.round(3 * G), pctP: 87.5, pN: 2, pAn: '휴대폰 1', pAs: Math.round(4.03 * G), pAu: Math.round(1 * G), pAm: Math.round(68 * G), pBn: '휴대폰 2', pBs: Math.round(4 * G), pBu: Math.round(2 * G), pBm: Math.round(66 * G), spG: 48, spM: 1, spN: 1, spUM: 0, spUG: 0, spL: Math.round(44.6 * G), spLater: false,
      bxOn: true, bxT: Math.round(50.8 * G), bxL: Math.round(46.6 * G), bxU: Math.round(4.2 * G), bxOk: Math.round(46.6 * G), bxF: Math.round(44.6 * G), bxFG: 48, bxC: Math.round(2 * G), bxDr: true, bxS: Math.round(50.8 * G), bxSt: '11/14 08:41', bxEn: '11/14 07:02', bxNow: '🎯 상품 페이지 정보(빠진 정보 채우기)'.slice(0, 24),
      ...Object.fromEntries(AS.allocOf(doc).rows.flatMap((r, i) => { const L = 'ABCDEF'[i]; return [['r' + L + 'n', r.l.slice(0, 24)], ['r' + L + 'p', r.pct], ['r' + L + 'b', Math.round(50.8 * G * r.pct / 100)], ['r' + L + 'u', i === 2 ? Math.round(3.9 * G) : i === 1 ? 40 * 1048576 : 0], ['r' + L + 'l', Math.round(46.6 * G)], ['r' + L + 'a', i === 2], ['r' + L + 'o', true]]; })) };
    const q = '/bud?d=' + encodeURIComponent(JSON.stringify(d)); ok(q.length < 7000, '알림 주소 길이 ' + q.length + ' (< 7000)');
    await req(q, { 'X-RN-Meter': '1' });
    const mini = await req('/mini'); const dash = await req('/');
    ok(/🎁 여분 통<\/b> 이달 50\.80GB 중 남은 <b>46\.60GB<\/b> · 오늘 쓴 <b>4\.20GB<\/b>/.test(mini), '작은 창: 이달 여분 총량·남은 양·오늘 쓴 여분', (mini.match(/🎁 여분 통.{0,160}/) || [])[0]);
    ok(/▶ 지금 여분으로: 🎯 상품 페이지 정보/.test(mini) && /여분 씀 시작 11\/14 08:41 · 끝 11\/14 07:02/.test(mini) && /배정표 5줄/.test(mini), '작은 창: 지금 여분으로 하는 일 · 시작/끝 시각 · 배정표(접기)');
    ok(/🎁 여분 통 — 이달 50\.80GB 중 남은 <b>46\.60GB<\/b>/.test(dash) && /고정 여분 48GB 남은 44\.60GB \+ 쌓인 남은 양 2\.00GB/.test(dash) && /📋 배정표 진행/.test(dash) && /3\. 🎯 상품 페이지 정보/.test(dash) && /쓴 <b>3\.90GB<\/b> \/ 몫 16\.51GB/.test(dash), '첫 화면: 여분 통 · 고정 + 쌓인 · 배정표 줄마다 쓴/몫/쓸 수 있는', (dash.match(/📋 배정표 진행.{0,400}/) || [])[0]);
    ok(!/undefined|NaN/.test((mini.match(/🎁 여분 통[\s\S]{0,3000}/) || [''])[0]) && !/undefined|NaN/.test((dash.match(/🎁 여분 통[\s\S]{0,4000}/) || [''])[0]), '여분 칸에 undefined·NaN 없음');
    /* 옛 수집기(bx 없음)면 예전 여분 칸 */ await req('/bud?d=' + encodeURIComponent(JSON.stringify({ ...Object.fromEntries(Object.entries(d).filter(([k]) => !/^(bx|r[A-F])/.test(k))) })), { 'X-RN-Meter': '1' }); const dash0 = await req('/'); ok(/🎁 여분 48GB/.test(dash0) && !/🎁 여분 통/.test(dash0), '옛 수집기 알림이면 예전 여분 칸 그대로');
    await req(q, { 'X-RN-Meter': '1' });
    if (process.env.RN_SHOT) { try { const { chromium } = require('playwright'); const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 380, height: 900 } }); await pg.goto(`http://127.0.0.1:${PORT}/mini`); await pg.evaluate(() => { const d = document.querySelector('details:not(.old)'); if (d) d.open = true; }); await pg.screenshot({ path: path.join(process.env.RN_SHOT, 'spare2_mini.png'), fullPage: true }); const pd = await br.newPage({ viewport: { width: 1200, height: 900 } }); await pd.goto(`http://127.0.0.1:${PORT}/`); const el = await pd.$('.card:has(.h:text("여분 통"))'); if (el) await el.screenshot({ path: path.join(process.env.RN_SHOT, 'spare2_dash.png') }); await br.close(); ok(true, '화면 사진 → ' + process.env.RN_SHOT); } catch (e) { console.log('  (화면 사진 못 찍음 ' + e.message.slice(0, 80) + ')'); } }
  } catch (e) { bad++; console.log('  ❌ 도우미 시험 ' + e.message + '\n' + out.slice(-800)); }
  finally { try { child && child.kill(); } catch (e) {} try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ tSPARE2_1113 실패 ${bad}` : '✓ tSPARE2_1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
