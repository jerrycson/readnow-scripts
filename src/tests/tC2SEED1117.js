/* tC2SEED1117 — 11/17 일꾼 bunoe1 · 정범님 11/17 12:06 「번외 수집기 완전 작동 — Tampermonkey 0」 · 🔀 번외 넘김 차례표 셋째 줄부터
 *  ① 새 줄 모양(로그인 없는 일만 · 출고 PC·로거 없음 · 하루 한 줄) ② from 전엔 기다림 ③ from 뒤 · 넘길 수 있음이면 넘김
 *  ④ take(정범님 19.2 — HOME 30시간 길을 한 길로 합침): 차례표가 켠 줄이면 소식 시간을 안 기다리고 JS-MAIN으로 · 사람 값은 그대로 · move(소식 한도)도 남은 줄에 그대로 ⑤ 옛 두 줄 그대로
 * 실행: node src/tests/tC2SEED1117.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/col2seed.js')));
const S = require(path.join(R, 'cloud/col2seed.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const T = (d) => Date.parse(d);
const day = (pc, at, tasks, ver) => ({ pc, ver: ver || '0.1.76', at: new Date(at).toISOString(), tasks });
const P = (o) => ({ n: 14, same: 14, pass: { can: true, why: '넘길 수 있음' }, ...(o || {}) });
const SOLO = { HOME: { at: 'x' }, 'JS-MAIN': { at: 'x' } };
const BY = (id) => S.SEED.find((s) => s.id === id);

console.log('① 새 줄 모양');
const NEW = S.SEED.slice(2);
ok(S.SEED[0].id === 'rv5-1113-nl-home' && S.SEED[1].id === 'c2s-1114-fx-home', '옛 두 줄이 앞 그대로');
ok(NEW.length === 6 && NEW.every((s) => /^bn1-/.test(s.id)), '새 줄 6개(bn1-)', NEW.map((s) => s.id));
ok(NEW.every((s) => ['kpipa', 'ext.joongmo', 'ext.kyobo', 'ext.ridi', 'ext.lib', 'ext.fx'].includes(s.k)), '로그인 없는 일만(KPIPA·바깥 정보·환율)', NEW.map((s) => s.k));
ok(S.SEED.every((s) => s.pc !== 'MJ-MAIN' && s.pc !== 'LOGGER'), '출고 PC·로거 줄 없음');
ok(new Set(S.SEED.map((s) => s.id)).size === S.SEED.length, '줄 이름 겹침 없음');
{ const ds = NEW.filter((s) => !s.move && !s.take).map((s) => String(s.from).slice(0, 10)); ok(new Set(ds).size === ds.length && ds.every(Boolean), '넘기는 줄은 하루에 하나씩(from 날짜가 모두 다름)', ds); }

console.log('② from 전 → 기다림 · ③ from 뒤 → 넘김');
const JM = BY('bn1-1118-jm-home'); const before = T('2026-11-17T20:00:00+09:00'), after = T('2026-11-18T09:00:00+09:00');
const dJ = (t) => [day('HOME', t - 10 * 60e3, { 'ext.joongmo': P() }), null];
{ const r = S.decide(JM, {}, dJ(before), SOLO, before); ok(r.act === 'wait' && /2026-11-18부터/.test(r.why), '그날 0시 전엔 기다림', r); }
{ const r = S.decide(JM, {}, dJ(after), SOLO, after); ok(r.act === 'on', '그날 0시 뒤 · 넘길 수 있음 → 넘김', r); }
ok(S.decide(JM, {}, [day('HOME', after - 10 * 60e3, { 'ext.joongmo': P({ pass: { can: false, why: '표본 부족' } }) })], SOLO, after).act === 'wait', "'넘길 수 있음' 아니면 기다림");
ok(S.decide(JM, {}, [day('HOME', after - 4 * 3600e3, { 'ext.joongmo': P() })], SOLO, after).act === 'wait', '번외 소식 3시간 넘으면 기다림');
ok(S.decide(JM, { jobs: { 'ext.joongmo': { on: false, offAt: 'x' } } }, dJ(after), SOLO, after).act === 'mark', '사람이 되돌린 일은 다시 켜지 않음');
ok(S.decide(JM, { jobs: { 'ext.joongmo': { on: true, pc: 'HOME', by: '정범님' } } }, dJ(after), SOLO, after).act === 'mark', '사람이 넘긴 일은 그대로');
{ const KP = BY('bn1-1117-kp-home'); const t = T('2026-11-17T15:00:00+09:00'); ok(S.decide(KP, {}, [day('HOME', t - 5 * 60e3, { kpipa: P() })], SOLO, t).act === 'on', 'KPIPA는 11/17부터'); }

console.log('④ 💱 환율 — JS-MAIN 한 길(take)');
ok(!BY('bn1-1117-fx-js') && S.SEED.filter((s) => s.k === 'ext.fx' && s.pc === 'JS-MAIN').length === 1, '환율 JS-MAIN 줄은 하나(옛 30시간 줄은 합침)');
const FX = BY('bn1-1118-fx-js'); const t = T('2026-11-17T13:00:00+09:00');
const dF = (o) => [day('JS-MAIN', t - 10 * 60e3, { 'ext.fx': { n: 1, same: 1, pass: { can: true }, ...(o || {}) } }, '0.1.77'), null];
const seedCur = (beat, pc) => ({ jobs: { 'ext.fx': { on: true, pc: pc || 'HOME', at: '2026-11-14T03:40:16.019Z', by: '클라우드 차례표(c2s-1114-fx-home)', beat } } });
ok(FX && FX.pc === 'JS-MAIN' && FX.take === true && !FX.move && FX.needSame === 1 && FX.minV === '0.1.77', 'JS-MAIN · 바로 옮김(take) · 같은 값 1건 · 번외 0.1.77 이상(정해진 시각)', FX);
{ const r = S.decide(FX, seedCur(null), dF(), SOLO, t); ok(r.act === 'on', '진단 11/17 실제 꼴(HOME 소식 null · 11/14 켬) → JS-MAIN으로 옮김', r); }
{ const r = S.decide(FX, seedCur(new Date(t - 3 * 3600e3).toISOString()), dF(), SOLO, t); ok(r.act === 'on', 'HOME 소식이 3시간 전에 있어도 차례표 줄이면 바로 JS-MAIN으로(한 길)', r); }
{ const mv = { ...FX, take: false, move: 30 }; const r = S.decide(mv, seedCur(new Date(t - 3 * 3600e3).toISOString()), dF(), SOLO, t); ok(r.act === 'wait' && /30시간 안/.test(r.why), 'move 줄(take 없음)은 예전처럼 소식 30시간 안이면 옮기지 않음', r); }
ok(S.decide(FX, seedCur(null), dF({ same: 0, why: { ext: 1 } }), SOLO, t).act === 'wait', 'JS-MAIN도 운영과 같은 값을 못 읽었으면 기다림');
ok(S.decide(FX, seedCur(null), [day('JS-MAIN', t - 10 * 60e3, { 'ext.fx': { n: 1, same: 1, pass: { can: true } } }, '0.1.76')], SOLO, t).act === 'wait', '번외 0.1.75(정해진 시각 전 판)면 기다림');
ok(S.decide(FX, { jobs: { 'ext.fx': { on: true, pc: 'HOME', at: '2026-11-14T03:40:16.019Z', by: '웹앱 ⚙ 정범님', beat: null } } }, dF(), SOLO, t).act === 'mark', '사람이 넘긴 환율은 옮기지 않음');
ok(S.decide(FX, { jobs: { 'ext.fx': { on: false, offAt: 'x', offBy: '정범님' } } }, dF(), SOLO, t).act === 'mark', '사람이 되돌린 환율은 다시 켜지 않음');
ok(S.decide(FX, seedCur(null, 'JS-MAIN'), dF(), SOLO, t).act === 'mark', '이미 JS-MAIN이면 한 줄로 끝');
ok(S.decide(FX, seedCur(null), dF(), { HOME: {} }, t).act === 'wait', 'JS-MAIN 홀로 연결 없으면 기다림');

console.log('⑤ 옛 줄');
ok(S.decide(S.SEED[1], { seeds: { 'c2s-1114-fx-home': { act: 'on' } } }, [], SOLO, t).act === 'done', '옛 환율 줄 = 이미 한 줄');
const IX = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
ok(/^const VER = '0\.35\.\d+'; \/\/ \(0\.35\.\d+ bunoe1\)/m.test(IX), '클라우드 판 설명에 bunoe1');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
