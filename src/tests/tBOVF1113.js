/* tBOVF1113 — 리드 결정 11/13(일꾼 bovf): 벤치마킹 한 바퀴 중 '넘쳐 쓸 휴대폰' 차례 버그 고침 + 넘쳐 쓰기를 🎁 여분 안으로 묶음
 *  사실(led4 보고): 수집기 budTick이 poolTick(휴대폰 상한 /phcap)을 b.benchMust 셈 전에 불러 must가 늘 거짓 → 한 바퀴 중에도 휴대폰 문이 그날 몫에서 닫혔음
 *  ① 벤치 중 + 여분 남음 → 휴대폰 2(여분 휴대폰)로 넘쳐 씀 · 상한 = 그 휴대폰 오늘 몫 + (이달 남은 여분 − 오늘 여분 일반 몫)
 *  ② 여분 0 · 12월(여분 없음) → 모든 휴대폰이 그날 몫에서 닫힘
 *  ③ 휴대폰 1로는 절대 넘기지 않음(휴대폰 2가 빠짐·인터넷 없음이어도)
 *  ④ 오늘 여분 일반 몫(⭐ 판매자 다시 읽기 먼저)은 벤치마킹이 못 씀 · 한 바퀴 뒤엔 그 몫이 열림 · 수집기 여분 셈(sm)·budLeft 그대로
 *  ⑤ 수집기 차례: simTick(→ poolTick)이 b.benchMust·먼저 떼는 몫 셈 뒤에
 * 실행: node src/tests/tBOVF1113.js (서버·브라우저 필요 없음) */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
require(path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;
const G = 1073741824; const at = (s) => Date.parse(s + '+09:00'); const g2 = (b) => Math.round(b / G * 100) / 100; const near = (a, b) => Math.abs(a - b) < 0.02 * G;
const C = rd('src/readnow-collector.src.js');
const pool = { on: true, carry: false, alloc: { on: false } /* (spare2 11/13) 이 시험은 그 판의 옛 셈(배정표·쌓인 남은 양 끔)을 그대로 봄 — 새 기본값은 tSPARE2_1113 */, fb: 'p1', list: { p1: { name: '휴대폰 1', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2', gb: 120, dev: 'USB\\B', order: 2 } }, month: { '2026-11': { p1: { from: '2026-11-13', remainGB: 72.54 }, p2: { from: '2026-11-13', remainGB: 72 } } }, spare: { '2026-11': { gb: 48, from: '2026-11-12', phone: 'p2', pace: true } } };
const doc = { budget: { mainPct: 87.5, pool } };
/* 11/13 숫자 꼴: 휴대폰 1 오늘 4.33GB(몫 4.03 넘음) · 휴대폰 2 오늘 4.0GB(몫 4.0) · sm = 오늘 여분 주요로 셈한 양 */
const mkNet = (key, o) => { o = o || {}; const uA = o.uA != null ? o.uA : 4.33, uB = o.uB != null ? o.uB : 4.0, sm = o.sm || 0; const b2 = o.b2 || 'ok';
  return { capGB: 240, days: o.days || {}, phones: [{ id: 'USB\\A', used: 60 * G + uA * G, active: o.act === 'p1', connected: true }, { id: 'USB\\B', used: 4 * G + uB * G, active: o.act !== 'p1' && b2 === 'ok', connected: b2 !== 'out', net: b2 === 'bad' ? { bad: true } : null }],
    today: { key, tether: (uA + uB) * G, tiers: { main: (uA + uB - sm) * G - 0.1 * G, gen: 0.1 * G, sm: sm * G }, phones: { 'USB\\A': uA * G, 'USB\\B': uB * G } } }; };
const room = (cp, pc, dev) => cp[dev].lim - pc.phones.find((p) => p.dev === dev).devUsed;

console.log('① 벤치 한 바퀴 중 + 여분 남음 → 휴대폰 2로 넘쳐 씀 · 상한 = 오늘 몫 + 여분 남은 양(오늘 여분 일반 몫 빼고)');
{ const pc = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p2' }), at('2026-11-13T07:00:00')); const sp = pc.spare; const p2 = pc.phones[1];
  ok(sp && !sp.later && near(sp.monthLeft, 48 * G) && near(sp.leftG, 0.33 * G), '여분: 이달 남은 48GB · 오늘 일반 0.33GB', { ml: g2(sp.monthLeft), g: g2(sp.leftG) });
  const cm = AS.poolCaps(pc, { must: true }); const r2 = room(cm, pc, 'USB\\B');
  ok(Math.abs(r2 - (Math.max(0, p2.left) + sp.monthLeft - sp.leftG)) < 2, '휴대폰 2 문 = 오늘 몫 남은 ' + g2(Math.max(0, p2.left)) + ' + 여분 ' + g2(sp.monthLeft) + ' − 오늘 여분 일반 ' + g2(sp.leftG) + ' = ' + g2(r2) + 'GB', g2(r2));
  ok(r2 <= sp.monthLeft + Math.max(0, p2.left) && r2 < 72 * G, '휴대폰 2 자기 이달 몫(72GB)은 넘쳐 쓰지 않음 — 여분 남은 양까지만(예전 0.18.28은 휴대폰 2 이달 남은 양 + 여분 전부)', g2(r2));
  const cn = AS.poolCaps(pc, { must: false }); ok(room(cn, pc, 'USB\\B') < r2 && near(room(cn, pc, 'USB\\B'), Math.max(0, p2.left) + sp.leftM + sp.leftG), '한 바퀴 밖(must 거짓)은 예전대로 오늘 몫 + 오늘 여분(주요·일반)', g2(room(cn, pc, 'USB\\B')));
  /* 넘쳐 쓴 바이트가 여분 주요(sm)로 셈되면 문이 그만큼 줄어 여분 남은 양에서 닫힘 */
  const n2 = mkNet('2026-11-13', { act: 'p2', uB: 4.0 + 30, sm: 30 }); const pc2 = AS.poolCalc(doc, n2, at('2026-11-13T11:00:00')); const cm2 = AS.poolCaps(pc2, { must: true });
  ok(Math.abs(cm2['USB\\B'].lim - cm['USB\\B'].lim) < 0.01 * G, '여분 30GB를 넘쳐 써도 문 끝(lim)은 그대로 — 움직이지 않는 상한', { a: g2(cm['USB\\B'].lim), b: g2(cm2['USB\\B'].lim) });
  const n3 = mkNet('2026-11-13', { act: 'p2', uB: 4.0 + 47.67, sm: 47.67 }); const pc3 = AS.poolCalc(doc, n3, at('2026-11-13T15:00:00')); const cm3 = AS.poolCaps(pc3, { must: true });
  ok(room(cm3, pc3, 'USB\\B') < 0.01 * G, '여분 남은 양(일반 몫 뺀 47.67GB)을 다 쓰면 휴대폰 2 문이 닫힘', g2(room(cm3, pc3, 'USB\\B'))); }

console.log('② 여분 0 · 12월 → 그날 몫에서 닫힘');
{ const days = { '2026-11-12': { tether: 48 * G, tiers: { sm: 40 * G, sg: 8 * G }, phones: { 'USB\\B': 48 * G } } };
  const pc = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p2', days }), at('2026-11-13T07:00:00')); ok(pc.spare && pc.spare.monthLeft === 0, '여분을 다 씀(이달 남은 0)', g2(pc.spare.monthLeft));
  const cm = AS.poolCaps(pc, { must: true }); ok(pc.phones.every((p) => Math.abs(room(cm, pc, p.dev) - Math.max(0, p.left)) < 2), '여분 0: 두 휴대폰 모두 오늘 몫 남은 양까지만', pc.phones.map((p) => [g2(room(cm, pc, p.dev)), g2(p.left)]));
  const dec = { ...doc, budget: { ...doc.budget, pool: { ...pool, month: {} } } }; const pd = AS.poolCalc(dec, mkNet('2026-12-02', { act: 'p2', uA: 4.5, uB: 4.5 }), at('2026-12-02T07:00:00'));
  ok(!pd.spare, '12월엔 여분 없음'); const cd = AS.poolCaps(pd, { must: true }); ok(pd.phones.every((p) => Math.abs(room(cd, pd, p.dev) - Math.max(0, p.left)) < 2), '12월 벤치 중에도 그날 몫에서 닫힘(넘쳐 쓸 휴대폰 없음)', pd.phones.map((p) => g2(room(cd, pd, p.dev))));
  const late = { ...doc, budget: { ...doc.budget, pool: { ...pool, spare: { '2026-11': { gb: 48, from: '2026-11-20', phone: 'p2' } } } } }; const pl = AS.poolCalc(late, mkNet('2026-11-13', { act: 'p2' }), at('2026-11-13T07:00:00')); const cl = AS.poolCaps(pl, { must: true });
  ok(pl.spare.later && pl.phones.every((p) => Math.abs(room(cl, pl, p.dev) - Math.max(0, p.left)) < 2), '여분 시작 날 전(later)도 그날 몫에서 닫힘'); }

console.log('③ 휴대폰 1로는 절대 넘기지 않음');
for (const b2 of ['ok', 'out', 'bad']) { const pc = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p1', b2 }), at('2026-11-13T07:00:00')); const cm = AS.poolCaps(pc, { must: true }); const p1 = pc.phones[0];
  ok(Math.abs(room(cm, pc, 'USB\\A') - Math.max(0, p1.left)) < 2, `휴대폰 2 ${b2 === 'ok' ? '됨' : b2 === 'out' ? '빠짐' : '인터넷 없음'} · 지금 휴대폰 1 → 휴대폰 1 문 = 오늘 몫 남은 ${g2(Math.max(0, p1.left))}GB(이달 남은 ${g2(p1.monthLeft)}GB를 열지 않음)`, g2(room(cm, pc, 'USB\\A'))); }
{ const pc = AS.poolCalc(doc, mkNet('2026-11-13', { act: 'p1', uA: 1 }), at('2026-11-13T07:00:00')); const cm = AS.poolCaps(pc, { must: true, keep: 1 * G }); ok(Math.abs(room(cm, pc, 'USB\\A') - pc.phones[0].left) < 2, '휴대폰 1에 오늘 몫이 남아도 그만큼만(넘쳐 쓰기·keep 더하지 않음)', g2(room(cm, pc, 'USB\\A'))); }

console.log('④ 오늘 여분 일반 몫(⭐ 판매자 다시 읽기 먼저) 지킴');
{ const i0 = C.indexOf('try { const sp = b.pool && b.pool.spare; b.spareOn = null;'); const i1 = C.indexOf('} } catch (e) {}', i0) + '} } catch (e) {}'.length; const SP = C.slice(i0, i1); ok(i0 > 0 && i1 > i0, '수집기 여분 칸을 찾음');
  const run = (net, now, must, owe) => { const b = AS.budget(doc, net, now); b.benchMust = must; b.left.bench = must ? b.monthLeft : b.left.main; new Function('b', 'umT', 'mainCap', 'owe', SP)(b, +net.today.tiers.main, b.strict.main, owe); return b; };
  /* 한 바퀴 중 · 오늘 여분 주요 몫(2.33GB)을 이미 넘겨 씀(sm 3GB) */
  const nO = mkNet('2026-11-13', { act: 'p2', uB: 7.0, sm: 3 }); const b1 = run(nO, at('2026-11-13T08:00:00'), true, true);
  ok(b1.pool.spare.leftM < 0 && b1.spareOn && b1.spareOn.main && !b1.spareOn.gen, '한 바퀴 중 넘쳐 쓴 바이트는 오늘 여분 주요 몫을 넘어도 여분(sm)으로 셈 · 여분 일반은 안 열림', { lm: g2(b1.pool.spare.leftM), on: b1.spareOn });
  const b0 = run(nO, at('2026-11-13T08:00:00'), false, false); ok(!(b0.spareOn && b0.spareOn.main), '한 바퀴 밖이면 예전대로(오늘 여분 주요 몫을 넘으면 sm 꺼짐)', b0.spareOn);
  const days = { '2026-11-12': { tether: 47.6 * G, tiers: { sm: 47.6 * G }, phones: { 'USB\\B': 47.6 * G } } }; const b2 = run(mkNet('2026-11-13', { act: 'p2', days, uB: 4.4, sm: 0.4 }), at('2026-11-13T08:00:00'), true, true);
  ok(!(b2.spareOn && b2.spareOn.main), '여분 남은 양이 오늘 여분 일반 몫뿐이면 벤치마킹 여분 셈 안 켬', { ml: g2(b2.pool.spare.monthLeft), g: g2(b2.pool.spare.leftG), on: b2.spareOn });
  const pc = AS.poolCalc(doc, nO, at('2026-11-13T08:00:00')); const cm = AS.poolCaps(pc, { must: true }); const cn = AS.poolCaps(pc, { must: false });
  ok(Math.abs(room(cm, pc, 'USB\\B') - (pc.spare.monthLeft - pc.spare.leftG)) < 2 && room(cn, pc, 'USB\\B') >= pc.spare.leftG - 2, '한 바퀴 중 문에는 오늘 여분 일반 몫이 빠져 있고 · 한 바퀴 뒤(must 거짓)엔 그 몫이 열림', { must: g2(room(cm, pc, 'USB\\B')), after: g2(room(cn, pc, 'USB\\B')), g: g2(pc.spare.leftG) });
  ok(/if \(BUD\.spareOn && BUD\.spareOn\.gen && BUD\.resv && BUD\.resv\.spLeft > 0 && !\(BUD\.resv\.ofSp && BUD\.resv\.ofSp\(k\)\)\) return Math\.max\(0, BUD\.left\.gen - BUD\.resv\.spLeft\);/.test(C), '수집기 budLeft: 여분 일반 몫은 ⭐ 판매자 다시 읽기 먼저(led4 그대로)');
  ok(/if \(BUD\.benchOwe\) return 0;/.test(C), '한 바퀴 전 일반 일은 여전히 0(정범님 10/25)'); }

console.log('⑤ 수집기 차례 — poolTick은 benchMust 셈 뒤');
{ const a = C.indexOf('  function budTick(H) {'); const e = C.indexOf('  async function helperTick()', a); const T = C.slice(a, e);
  const iM = T.indexOf('b.benchMust = owe || bRun || bx;'), iK = T.indexOf('poolTick._keep = b.benchOwe'), iS = T.indexOf('simTick(H, b);');
  ok(iM > 0 && iK > iM && iS > iK && T.indexOf('simTick(H, b);', iS + 1) < 0, 'budTick 안: benchMust → _keep → simTick(H, b) 한 번', { iM, iK, iS });
  ok(/AS\.poolCaps\(pc, \{ must: !!b\.benchMust, keep: \+poolTick\._keep \|\| 0 \}\)/.test(C), 'poolTick이 b.benchMust를 must로 넘김');
  ok(/const VERSION = '0\.18\.(29|[3-9]\d)'/.test(rd('readnow-autosched-core.js')), '공용 일정표 0.18.29 이상'); }

console.log(bad ? `❌ tBOVF1113 실패 ${bad}` : '✓ tBOVF1113 모두 통과'); process.exit(bad ? 1 : 0);
