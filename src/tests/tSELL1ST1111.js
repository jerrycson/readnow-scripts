/* tSELL1ST1111 — (11/11 col2fix6 · 정범님 결정 「①로」) 📶 로거 테더링 하루 몫: '판매자 정보 다시 읽기'를 앞쪽 칸으로, '구매자 분포·함께 산 책'은 그 뒤
 *  클라우드 한 번 바꾸기 sched1111a의 순수 셈 sellerFirst1111을 cloud/index.js에서 떼어 와 실제 시간표 모양(11/11 진단 prd_system/autoSched)에 돌려 봄
 *  ① 6개월 평가 수(오래된 것만) 칸 = 매일 00:20(일·수만 → 매일) · 켜짐 · 일반 몫 그대로(벤치마킹 주요 몫과 안 겹침)
 *  ② 구매자 분포 칸은 13:00 그대로 → 하루 차례에서 판매자 칸이 앞
 *  ③ ✨ 쉴 때 하는 일(로거 테더링 남음) 차례 = 판매자 먼저 · 시장 지표 · 구매자 분포 뒤(같은 무리 안 차례는 그대로) · 없던 판매자 일은 맨 앞에 넣음
 *  ④ 다른 칸·외부·사무실 목록은 그대로 · 한 번만(sched1111a 표시) · 바꾸기 전 값 남김 · 수집기 머리 안 바꿈(클라우드만)
 *  ⑤ 공용 일정 파일(AS.due 차례)로 하루 계획을 그려 판매자 칸이 구매자 분포보다 먼저 옴 · 실행: node src/tests/tSELL1ST1111.js */
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + m + (x != null && !c ? ' — ' + x : '')); if (!c) bad++; };
const SRC = fs.readFileSync(path.join(__dirname, '../../cloud/index.js'), 'utf8');
const i0 = SRC.indexOf('function sellerFirst1111('); const i1 = SRC.indexOf('\nasync function sched1111a', i0);
const sellerFirst1111 = new Function(SRC.slice(i0, i1) + '\nreturn sellerFirst1111;')();
const T = (...t) => ({ t: 'time', times: t });
const doc = { slots: [
  { id: 'bench', job: 'prd:bench', on: true, tier: 'main', trig: T('00:05'), days: null },
  { id: 'benchResume', job: 'prd:benchResume', on: true, tier: 'main', trig: { t: 'every', min: 60 }, days: null },
  { id: 'smv6l50oupn', job: 'prd:dynamic', on: true, tier: 'gen', trig: T('13:00'), days: null, maxMin: 55 },
  { id: 'lgRevTop', job: 'prd:revTop', on: true, tier: 'gen', trig: T('04:00'), days: null, maxMin: 45 },
  { id: 'lgRev6m', job: 'prd:rev6mStale', on: true, tier: 'gen', trig: T('03:00'), days: [0, 3], maxMin: 60, name: '⭐ 6개월 평가 수 (오래된 것만)' },
  { id: 'kpipa', job: 'prd:kpipa', on: true, trig: T('05:00') } ],
  rest: { on: true, lgA: ['prd:market', 'prd:dynamic', 'prd:rev6mStale'], lgE: ['prd:extBurst'], lgN: ['prd:extBurst'], ofA: ['prd:soldInfo', 'crm:cancels'], ofE: ['prd:extBurst', 'prd:kpipa'] } };
const before = JSON.stringify(doc); const n = sellerFirst1111(doc);
const r6 = n.slots.find((x) => x.id === 'lgRev6m'), dy = n.slots.find((x) => x.id === 'smv6l50oupn');
console.log('① ② 칸');
ok(r6.on && r6.days === null && JSON.stringify(r6.trig) === JSON.stringify(T('00:20')) && r6.tier === 'gen' && r6.maxMin === 60, '6개월 평가 수(오래된 것만) = 매일 00:20 · 일반 몫 · 60분 그대로', JSON.stringify(r6));
ok(JSON.stringify(dy.trig) === JSON.stringify(T('13:00')) && dy.tier === 'gen', '구매자 분포는 13:00 그대로(판매자 칸 뒤)', JSON.stringify(dy));
console.log('③ 쉴 때 하는 일 차례');
ok(JSON.stringify(n.rest.lgA) === JSON.stringify(['prd:rev6mStale', 'prd:market', 'prd:dynamic']), '로거 테더링 남음 = 판매자 → 시장 지표 → 구매자 분포', JSON.stringify(n.rest.lgA));
ok(JSON.stringify(sellerFirst1111({ slots: [], rest: { lgA: ['prd:explore', 'prd:dynamic', 'prd:market'] } }).rest.lgA) === JSON.stringify(['prd:rev6mStale', 'prd:market', 'prd:explore', 'prd:dynamic']), '판매자 일이 목록에 없으면 맨 앞에 넣음 · 구매자 분포·탐색 무리 안 차례는 그대로');
console.log('④ 나머지 그대로 · 한 번만');
ok(JSON.stringify(n.slots.filter((x) => x.id !== 'lgRev6m')) === JSON.stringify(JSON.parse(before).slots.filter((x) => x.id !== 'lgRev6m')) && JSON.stringify({ ...n.rest, lgA: 0 }) === JSON.stringify({ ...JSON.parse(before).rest, lgA: 0 }) && JSON.stringify(doc) === before, '다른 칸·외부·사무실 목록은 그대로 · 넘겨받은 문서는 고치지 않음(새 값만 돌려줌)');
const fnS = SRC.slice(SRC.indexOf('async function sched1111a'), SRC.indexOf('setTimeout(sched1111a')); ok(/if \(d\.sched1111a \|\| !Array\.isArray\(d\.slots\)\) return;/.test(fnS) && /sched1111a: \{ at: nowIso\(\), prev: \{ slots: d\.slots, rest: d\.rest \|\| null \} \}/.test(fnS) && /runTransaction/.test(fnS), '한 번만(표시 sched1111a) · 바꾸기 전 칸·목록을 prev에 남김 · 트랜잭션');
console.log('⑤ 공용 일정 파일로 하루 차례');
try { const AS = require('../../readnow-autosched-core.js').AS; const L = AS.slotsOf({ slots: n.slots }); const tm = (s) => (s.trig && s.trig.times ? s.trig.times[0] : '99:99');
  const pos = (j) => L.filter((x) => x.on && x.tier === 'gen').sort((a, b) => tm(a).localeCompare(tm(b))).findIndex((x) => x.job === j);
  ok(L.length === n.slots.length && pos('prd:rev6mStale') >= 0 && pos('prd:rev6mStale') < pos('prd:dynamic'), '일반 몫 칸 하루 차례: 판매자(00:20)가 구매자 분포(13:00)보다 먼저', `${pos('prd:rev6mStale')} < ${pos('prd:dynamic')}`);
  const R = AS.restOf({ rest: n.rest }); ok(R.lgA[0] === 'prd:rev6mStale' && R.lgA.indexOf('prd:dynamic') > R.lgA.indexOf('prd:rev6mStale'), '공용 파일 restOf도 바꾼 차례 그대로 읽음', JSON.stringify(R.lgA)); } catch (e) { ok(false, '공용 일정 파일 읽기', e.message); }
console.log(bad ? `❌ tSELL1ST1111 ${bad}개 실패` : '✅ tSELL1ST1111 모두 통과'); process.exit(bad ? 1 : 0);
