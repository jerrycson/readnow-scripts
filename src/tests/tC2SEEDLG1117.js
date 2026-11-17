/* tC2SEEDLG1117 — 11/17 일꾼 bunoe3 · 🔀 번외 넘김 차례표 로거 줄(bn3-) — 로거 고유 일(👥 구매자 분포·🏪 숍 요약·🎯 벤치마킹 끝까지)만 LOGGER로
 *  ① 줄 모양(로거 칸 일만 · LOGGER만 · 하루 한 줄 · HOME 줄들 뒤) ② from 전엔 기다림 · 뒤엔 '넘길 수 있음'이면 넘김
 *  ③ 🎯은 끝까지 읽기 그림자(benchFull)로 판정 ④ 다른 PC로 보내거나 사무실 일을 로거로 보내면 'bad' ⑤ 사람 값은 그대로
 * 실행: node src/tests/tC2SEEDLG1117.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/col2seed.js')));
const S = require(path.join(R, 'cloud/col2seed.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const T = (d) => Date.parse(d);
const day = (pc, at, tasks, ver) => ({ pc, ver: ver || '0.1.77', at: new Date(at).toISOString(), tasks });
const P = (o) => ({ n: 30, same: 30, pass: { can: true, why: '넘길 수 있음' }, ...(o || {}) });
const SOLO = { HOME: { at: 'x' }, 'JS-MAIN': { at: 'x' } }; /* 로거는 홀로 연결 목록에 없음 — 그래도 넘김(로거 칸) */

console.log('① 줄 모양');
const LG = S.SEED.filter((s) => /^bn3-/.test(s.id));
ok(LG.length === 3 && LG.every((s) => s.pc === 'LOGGER' && s.on === true), '로거 줄 3개 · 모두 LOGGER', LG.map((s) => s.id));
ok(LG.every((s) => ['dynamic', 'shopSum', 'bench'].includes(s.k)), '로거 칸 일만(👥·🏪·🎯 — 📈 지표·🏷 중고 쪽은 📘 묶음과 겹쳐 안 넣음)', LG.map((s) => s.k));
ok(!S.SEED.some((s) => s.pc === 'LOGGER' && ['metrics', 'usedPage'].includes(s.k)), '📈 지표·🏷 중고 쪽 로거 줄 없음');
{ const ds = LG.map((s) => String(s.from).slice(0, 10)); ok(new Set(ds).size === 3 && ds.every((d) => d > '2026-11-21'), '하루 한 줄 · HOME 줄들(11/18~11/21) 뒤', ds); }
ok(LG.every((s) => !s.move && !s.take && s.minV === '0.1.77'), '사람 값을 옮기지 않음(move·take 없음) · 번외 0.1.77 이상');
ok(S.SEED.every((s) => s.pc !== 'MJ-MAIN'), '출고 PC 줄 없음');
ok(new Set(S.SEED.map((s) => s.id)).size === S.SEED.length, '줄 이름 겹침 없음');

console.log('② from 전 → 기다림 · 뒤 → 넘김');
const DY = S.SEED.find((s) => s.id === 'bn3-1122-dy-lg'); const before = T('2026-11-21T23:00:00+09:00'), after = T('2026-11-22T09:00:00+09:00');
const dD = (t, o) => [day('LOGGER', t - 10 * 60e3, { dynamic: P(o) }), null];
{ const r = S.decide(DY, {}, dD(before), SOLO, before); ok(r.act === 'wait' && /2026-11-22부터/.test(r.why), '그날 0시 전엔 기다림', r); }
{ const r = S.decide(DY, {}, dD(after), SOLO, after); ok(r.act === 'on', '그날 0시 뒤 · 넘길 수 있음 → 넘김(로거는 홀로 연결 목록 없이도)', r); }
ok(S.decide(DY, {}, dD(after, { pass: { can: false, why: '표본 부족' } }), SOLO, after).act === 'wait', "'넘길 수 있음' 아니면 기다림");
ok(S.decide(DY, {}, [day('LOGGER', after - 4 * 3600e3, { dynamic: P() }), null], SOLO, after).act === 'wait', '로거 번외 소식 3시간 넘으면 기다림');
ok(S.decide(DY, {}, [day('LOGGER', after - 10 * 60e3, { dynamic: P() }, '0.1.76'), null], SOLO, after).act === 'wait', '로거 번외 판이 낮으면 기다림');

console.log('③ 🎯 벤치마킹은 끝까지 읽기 그림자로 판정');
const BF = S.SEED.find((s) => s.id === 'bn3-1124-bf-lg'); const t3 = T('2026-11-24T09:00:00+09:00');
ok(BF && BF.k === 'bench' && BF.task === 'benchFull', '넘기는 칸 bench · 판정은 benchFull', BF);
ok(S.decide(BF, {}, [day('LOGGER', t3 - 10 * 60e3, { bench: P() }), null], SOLO, t3).act === 'wait', '앞 쪽만 읽는 bench 그림자만 있으면 기다림(11/17처럼 benchFull 없음)');
ok(S.decide(BF, {}, [day('LOGGER', t3 - 10 * 60e3, { bench: P(), benchFull: P() }), null], SOLO, t3).act === 'on', '끝까지 읽기도 넘길 수 있음 → 넘김');

console.log('④ 로거 칸 지킴');
const t4 = T('2026-11-23T09:00:00+09:00');
ok(S.decide({ ...S.SEED.find((s) => s.id === 'bn3-1123-ss-lg'), pc: 'HOME' }, {}, [day('HOME', t4 - 6e5, { shopSum: P() }), null], SOLO, t4).act === 'bad', '로거 칸 일을 사무실 PC로 안 보냄');
ok(S.decide({ id: 'x-lg-metrics', k: 'metrics', pc: 'LOGGER', on: true, minV: '0.1.77' }, {}, [day('LOGGER', t4 - 6e5, { metrics: P() }), null], SOLO, t4).act === 'bad', '📈 지표(사무실 묶음 일)를 로거로 안 보냄');

console.log('⑤ 사람 값 그대로');
ok(S.decide(DY, { jobs: { dynamic: { on: false, offAt: 'x' } } }, dD(after), SOLO, after).act === 'mark', '사람이 되돌린 일은 다시 켜지 않음');
ok(S.decide(DY, { jobs: { dynamic: { on: true, pc: 'LOGGER', by: '정범님' } } }, dD(after), SOLO, after).act === 'mark', '사람이 넘긴 일은 그대로');
ok(S.decide(DY, { seeds: { 'bn3-1122-dy-lg': { act: 'on' } } }, dD(after), SOLO, after).act === 'done', '한 번 한 줄은 다시 안 함');

console.log('⑥ 판 설명');
const IX = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
ok(/^const VER = '0\.35\.\d+';.*\/\/ \(0\.35\.\d+ bunoe3\)/m.test(IX), '클라우드 판 설명에 bunoe3');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
