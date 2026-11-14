/* tC2SEED1114 — 11/14 일꾼 col2seed · 🔀 번외 넘김 차례표 둘째 줄(💱 환율 → HOME) 시험
 *  ① 둘째 줄 모양 ② 진단에서 본 실제 꼴(11/13 HOME 환율 '출처 다름' 1 · 같음 0)이면 기다림 ③ 같음 1이면 넘김 ④ 사람 값·되돌림 그대로 ⑤ 첫 줄은 이미 한 줄
 * 실행: node src/tests/tC2SEED1114.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/col2seed.js')));
const S = require(path.join(R, 'cloud/col2seed.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const NOW = Date.parse('2026-11-14T03:30:00Z');
const fxT = (o) => ({ name: '💱 환율(수출입은행 → frankfurter)', n: 1, same: 0, diff: 1, why: { ext: 1 }, pass: { n: 1, can: true, why: '넘길 수 있음' }, ...(o || {}) });
const day = (t) => ({ d: '2026-11-14', pc: 'HOME', ver: '0.1.63', at: new Date(NOW - 10 * 60e3).toISOString(), tasks: { 'ext.fx': t } });
const SOLO = { HOME: { fp: 'x' } };
const F = S.SEED.find((s) => s.k === 'ext.fx');
const DONE = { seeds: { 'rv5-1113-nl-home': { act: 'on' } }, jobs: { 'ext.nl': { on: true, pc: 'HOME' } } };

console.log('① 둘째 줄');
ok(S.SEED.length === 2 && S.SEED[1] === F, '차례표 둘째 줄 = 환율', S.SEED.map((s) => s.id));
ok(F && F.pc === 'HOME' && F.on === true && F.task === 'ext.fx' && F.needSame === 1, 'HOME · 켬 · 같은 값 1건 조건', F);
ok(new Set(S.SEED.map((s) => s.id)).size === S.SEED.length, '줄 이름 겹침 없음');
ok(S.SEED.every((s) => s.pc !== 'MJ-MAIN' && s.pc !== 'LOGGER'), '출고 PC·로거 줄 없음');

console.log('② 실제 꼴(번외가 운영 키 없이 frankfurter) → 기다림');
const w = S.decide(F, DONE, [day(fxT()), null], SOLO, NOW);
ok(w.act === 'wait' && /같은 값/.test(w.why) && /출처 다름 1/.test(w.why), '출처 다름이면 넘기지 않음', w);
ok(S.decide(F, DONE, [day(fxT({ pass: { can: false, why: '표본 0/1' } }))], SOLO, NOW).act === 'wait', "'넘길 수 있음' 아님이면 기다림");
ok(S.decide(F, DONE, [day(fxT({ same: 1, diff: 0, why: {} }))], {}, NOW).act === 'wait', '홀로 연결 없으면 기다림');

console.log('③ 수출입은행을 같게 읽은 날 → 넘김');
const on = S.decide(F, DONE, [day(fxT({ same: 1, diff: 0, why: {} })), null], SOLO, NOW);
ok(on.act === 'on', '같음 1이면 넘김', on);
ok(S.decide(F, DONE, [null, day(fxT({ same: 1, diff: 0, why: {} }))], SOLO, NOW).act === 'on', '어제 요약이라도 3시간 안이면');

console.log('④ 사람 값·되돌림');
ok(S.decide(F, { jobs: { 'ext.fx': { on: false, offAt: 'x' } } }, [day(fxT({ same: 1 }))], SOLO, NOW).act === 'mark', '사람이 되돌린 환율은 다시 켜지 않음');
ok(S.decide(F, { seeds: { [F.id]: { act: 'on' } } }, [day(fxT({ same: 1 }))], SOLO, NOW).act === 'done', '한 번 한 줄은 다시 안 함');

console.log('⑤ 첫 줄은 그대로');
ok(S.decide(S.SEED[0], DONE, [], SOLO, NOW).act === 'done', '국중 줄 = 이미 한 줄');
ok(S.decide(S.SEED[0], {}, [{ ...day(fxT()), tasks: { 'ext.nl': { n: 102, same: 102, pass: { can: true } } } }], SOLO, NOW).act === 'on', '첫 줄엔 같은 값 조건이 붙지 않음');
const IX = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
ok(/const VER = '0\.35\.\d+'; \/\/ \(0\.35\.\d+ col2seed\)/.test(IX), '클라우드 판 설명에 col2seed');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
