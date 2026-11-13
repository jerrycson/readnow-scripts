/* tSPARE1113 — 정범님 11/13 11:54 지적(recall3 ② · F17) 🎁 11월 테더링 여분 48GB가 이틀째 0바이트 쓰이던 것 고침 시험 (일꾼 led4)
 *  11/13 09:15 숫자: 하루 몫 8.03GB(휴대폰 1 4.03 + 휴대폰 2 4.00) · 오늘 씀 8.33GB · 지금 쓰는 휴대폰 p2 · 여분 48GB ÷ 18일 = 2.67GB(주요 2.33 · 일반 0.33)
 *  ① 여분 일반 몫이 열리면 '일반 몫 바로잡음'이 지우지 않음(㉮) ② 한 바퀴 뒤 여분 주요 몫만큼 남은 양이 열림(㉯) ③ 지금 휴대폰이 p1이면 안 열림(㉰) ④ 12/1이면 여분 없음
 *  ⑤ 11월 ⭐ 판매자 다시 읽기 40MB는 여분 일반 몫에서 먼저(벤치마킹 몫을 깎지 않음) · 12월부터 하루 몫에서 뗌 ⑥ 기록 줄·신호·쉴 때 일 차례·달 끝 경고(㉱㉲)
 * 실행: node src/tests/tSPARE1113.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
require(path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;
const G = 1073741824, MB = 1048576; const at = (s) => Date.parse(s + '+09:00'); const g2 = (b) => Math.round(b / G * 100) / 100;
const C = rd('src/readnow-collector.src.js');
const pool = { on: true, carry: false, alloc: { on: false } /* (spare2 11/13) 이 시험은 그 판의 옛 셈(배정표·쌓인 남은 양 끔)을 그대로 봄 — 새 기본값은 tSPARE2_1113 */, fb: 'p1', list: { p1: { name: '휴대폰 1', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2', gb: 120, dev: 'USB\\B', order: 2 } }, month: { '2026-11': { p1: { from: '2026-11-13', remainGB: 72.54 }, p2: { from: '2026-11-13', remainGB: 72 } } }, spare: { '2026-11': { gb: 48, from: '2026-11-12', phone: 'p2', pace: true } } };
const doc = { budget: { mainPct: 87.5, pool } };
const mkNet = (key, act, usedA, usedB) => ({ capGB: 240, days: {}, phones: [{ id: 'USB\\A', used: 60 * G, active: act === 'p1', connected: true }, { id: 'USB\\B', used: 4 * G, active: act === 'p2', connected: true }], today: { key, tether: (usedA + usedB) * G, tiers: { main: 7.9 * G, gen: (usedA + usedB - 7.9) * G }, phones: { 'USB\\A': usedA * G, 'USB\\B': usedB * G }, jobs: { bench: 7.9 * G } } });
/* 수집기 budTick의 여분 칸 + 바로잡음 조건을 그대로 떼어 돌림(같은 글자) */
const i0 = C.indexOf('try { const sp = b.pool && b.pool.spare; b.spareOn = null;'); const i1 = C.indexOf('} } catch (e) {}', i0) + '} } catch (e) {}'.length; const SP = C.slice(i0, i1);
const clampCond = (C.match(/if \(b\.left && b\.left\.gen > genCap( && !\(b\.spareOn && b\.spareOn\.gen\))?\) \{ const g0 = b\.left\.gen;/) || [])[0];
ok(i0 > 0 && i1 > i0 && !!clampCond, '수집기 여분 칸·바로잡음 줄을 찾음');
const run = (now, net, owe) => { const b = AS.budget(doc, net, now); const usedT = b.pool.used; const dayCap = b.pool.share; const mainCap = b.strict.main; const umT = +net.today.tiers.main; b.benchMust = owe; b.left.bench = owe ? b.monthLeft : b.left.main; const genCap = Math.max(0, dayCap - usedT);
  if (!owe && b.left.gen < genCap) b.left.gen = genCap; new Function('b', 'umT', 'mainCap', 'owe', SP)(b, umT, mainCap, owe); let clamped = false;
  if (new Function('b', 'genCap', 'return (' + clampCond.replace(/^if \(/, '').replace(/\) \{ const g0 = b\.left\.gen;$/, '') + ');')(b, genCap)) { b.left.gen = genCap; clamped = true; } return { b, clamped }; };
console.log('① ㉮ 11/13 09:15 · 지금 휴대폰 p2 · 한 바퀴 끝 · 그날 몫 넘김');
{ const now = at('2026-11-13T09:15:37'); const net = mkNet('2026-11-13', 'p2', 4.33, 4.0); const { b, clamped } = run(now, net, false);
  ok(g2(b.pool.share) === 8.03 || Math.abs(b.pool.share / G - 8.03) < 0.05, '하루 몫 ≈ 8.03GB', g2(b.pool.share));
  ok(Math.abs(b.pool.spare.day / G - 2.67) < 0.01 && Math.abs(b.pool.spare.main / G - 2.33) < 0.01 && Math.abs(b.pool.spare.gen / G - 0.33) < 0.01, '여분 오늘 48 ÷ 18 = 2.67GB(주요 2.33 · 일반 0.33)', b.pool.spare);
  ok(b.spareOn && b.spareOn.gen && b.spareOn.main, '여분 일반·주요 모두 켜짐', b.spareOn);
  ok(!clamped && Math.abs(b.left.gen / G - 0.33) < 0.01, '㉮ 일반 몫 바로잡음이 여분을 지우지 않음(남은 일반 = 0.33GB · 예전엔 0.00)', { gen: g2(b.left.gen), clamped });
  ok(Math.abs(b.left.main / G - 2.33) < 0.02 && Math.abs(b.left.bench / G - 2.33) < 0.02, '㉯ 한 바퀴 뒤 여분 주요 몫만큼 남은 양이 열림(주요·벤치 2.33GB)', { m: g2(b.left.main), bn: g2(b.left.bench) }); }
console.log('② ㉯ 한 바퀴 중(owe)에는 주요 남은 양을 바꾸지 않음(벤치마킹은 하루 몫과 상관없이 · 정범님 10/25)');
{ const { b } = run(at('2026-11-13T07:00:00'), mkNet('2026-11-13', 'p2', 4.33, 4.0), true); ok(b.left.bench === b.monthLeft, '한 바퀴 중 벤치 남은 양 = 이달 남은 양 그대로'); }
console.log('③ ㉰ 지금 휴대폰이 p1(여분 휴대폰 아님)');
{ const { b, clamped } = run(at('2026-11-13T09:00:00'), mkNet('2026-11-13', 'p1', 4.33, 4.0), false); ok(!b.spareOn && clamped && b.left.gen === 0, '여분이 안 열림 · 일반 몫 0으로 바로잡음(휴대폰 1로 여분을 쓰지 않음)', { on: b.spareOn, gen: b.left.gen });
  const pc = AS.poolCalc(doc, mkNet('2026-11-13', 'p1', 4.33, 4.0), at('2026-11-13T09:00:00')); const cp = AS.poolCaps(pc, { must: false }); ok(cp['USB\\B'].lim > cp['USB\\B'].lim - 1 && cp['USB\\B'].lim - 4 * G >= 2.6 * G, '도우미 상한: 휴대폰 2 = 오늘 몫 + 여분 → 휴대폰 1 몫이 닫히면 휴대폰 2로 넘어감', { b: g2(cp['USB\\B'].lim), a: g2(cp['USB\\A'].lim) }); }
console.log('④ 12/1');
{ const net = mkNet('2026-12-01', 'p2', 1, 1); const b = AS.budget(doc, net, at('2026-12-01T09:00:00')); ok(!b.pool.spare, '12월엔 여분 없음'); }
console.log('⑤ 11월 ⭐ 판매자 다시 읽기 = 여분 일반 몫에서 먼저 · 12월부터 하루 몫에서');
{ const nov = AS.resvCalc({}, { rev6mStale: 10 * MB }, at('2026-11-13T09:00:00')); ok(nov.total === 0 && nov.on.length === 0 && nov.sp.length === 1 && nov.spLeft === 30 * MB && nov.ofSp('prd:rev6mStale') && !nov.ofSp('market'), '11월: 하루 몫에서 떼지 않음 · 여분 쪽 줄(남은 30MB)', { t: nov.total, sp: nov.spLeft });
  const dec = AS.resvCalc({}, {}, at('2026-12-01T09:00:00')); ok(dec.total === 40 * MB && dec.on.length === 1 && !dec.sp.length, '12/1부터 하루 몫에서 40MB 뗌');
  const now = at('2026-11-13T08:13:00'); const a = AS.genPace({}, { now, dayCap: 8.03 * G, usedT: 7.5 * G, umT: 7.5 * G, mainCap: 7.95 * G, owe: true }); const b = AS.genPace({}, { now, dayCap: 8.03 * G, usedT: 7.5 * G, umT: 7.5 * G, mainCap: 7.95 * G, owe: true, resv: nov });
  ok(a.mainRes === b.mainRes && a.pool === b.pool, '11월엔 벤치마킹 남겨 둘 몫을 깎지 않음'); ok(/🎁 여분 일반 몫에서 먼저: ⭐ 판매자 다시 읽기 40MB/.test(b.txt) && /12\/부터|2026\/12부터/.test(b.txt), '셈 식 글: ' + b.txt.slice(0, 160));
  ok(/if \(BUD\.spareOn && BUD\.spareOn\.gen && BUD\.resv && BUD\.resv\.spLeft > 0 && !\(BUD\.resv\.ofSp && BUD\.resv\.ofSp\(k\)\)\) return Math\.max\(0, BUD\.left\.gen - BUD\.resv\.spLeft\);/.test(C), '수집기 budLeft: 여분 일반 몫이 열리면 다른 일반 일은 판매자 다시 읽기 몫을 남겨 둠'); }
console.log('⑥ ㉱㉲ 기록·신호·차례');
{ ok(/\+ 🎁 여분 오늘 \$\{/.test(C) && /이달 남은 여분 \$\{\(BUD\.pool\.spare\.monthLeft/.test(C), '「📶 테더링 확인됨」 줄에 오늘 여분·이달 남은 여분');
  ok(/— 🎁 여분으로 이어 함\(여분 휴대폰/.test(C), '「📏 하루 몫에 닿음」 줄: 여분이 남으면 이어 함');
  ok(/🎁 여분 씀 시작 — /.test(C) && /🎁 여분 씀 끝 — /.test(C), '여분 씀 시작·끝 한 줄');
  ok(/sp: BUD\.pool && BUD\.pool\.spare && !BUD\.pool\.spare\.later \? \{ day:/.test(C), '신호(pcBeat.pace.sp)에 오늘 여분·남은 여분 — 진단 doc=prd_jobs/pcBeat');
  ok(/BUD\.spareOn\.main && !BUD\.benchOwe \? \['prd:benchDetail', 'prd:benchResume'\]/.test(C), '쉴 때 일 차례: 여분 주요 몫이면 🎯 상품 페이지 정보 → 못 끝낸 판매자 이어 읽기 먼저');
  ok(/🚨 🎁 이달 여분이 남을 듯/.test(C) && /b\.pool\.nLeft <= 3/.test(C), '㉲ 11/28부터 여분이 남을 듯하면 경고');
  const last = AS.poolCalc(doc, { capGB: 240, days: {}, phones: [{ id: 'USB\\B', used: 0, active: true, connected: true }], today: { key: '2026-11-30', tether: 0, tiers: {} } }, at('2026-11-30T09:00:00')); ok(Math.abs(last.spare.day - last.spare.left0) < 1, '㉲ 11/30엔 남은 여분 전부가 그날 여분', g2(last.spare.day)); }
console.log(bad ? `❌ tSPARE1113 실패 ${bad}` : '✓ tSPARE1113 모두 통과'); process.exit(bad ? 1 : 0);
