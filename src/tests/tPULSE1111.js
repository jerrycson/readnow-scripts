// 🧬 연구 진화 기록 받는 곳(클라우드 0.35.125 pulseClean · pulseIn) 시험 — node src/tests/tPULSE1111.js
// 매일 엔진 한 걸음이 @kpin으로 보낸 기록을 app_settings/research_pulse에 넣기 전에 거르는 규칙
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../../cloud/index.js', 'utf8');
const a = src.indexOf('function pulseClean('), b = src.indexOf('async function pulseIn(');
if (a < 0 || b < a) { console.log('❌ 실패: pulseClean을 못 찾음'); process.exit(1); }
const pulseClean = new Function(src.slice(a, b) + '\nreturn pulseClean;')();
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };

const at = Date.UTC(2026, 10, 11, 5, 0, 0);
const r = pulseClean({ day: '2026-11-11', studies: {
  R02: { at, metric: '로그 손실', value: 0.0563, trend: [['2026-11-10', 0.0709], ['2026-11-11', 0.0563], ['날짜아님', 1], ['2026-11-12', 'x']], champ: 0.0563, chall: 0.0536, swapAt: '2026-10-18', changed: '새 도전자', note: 'AUC', src: '진단' },
  R20: { at: '2026-11-11T05:00:00Z', metric: '배율', value: 1.86, trend: [{ d: '2026-11-11', v: 1.86 }] },
  'bad id': { value: 1 }, R2: { value: 2 }, N07: 'not object', C01: { value: NaN, champ: 'abc', metric: 'x'.repeat(200), changed: { a: 1 } } } });
const S = r.studies;
ok(Object.keys(S).sort().join(',') === 'C01,R02,R20', '연구 번호 꼴만 받음(글자 하나+숫자 둘 · 객체) — ' + Object.keys(S).join(','));
ok(r.bad.length === 3, '거른 번호 3개를 알려 줌 ' + JSON.stringify(r.bad));
ok(S.R02.at === '2026-11-11T05:00:00.000Z', 'ms 시각 → ISO 글(웹앱 멈춤 셈이 Date.parse를 씀)');
ok(S.R02.trend.length === 2 && S.R02.trend[0].d === '2026-11-10' && S.R02.trend[1].v === 0.0563, '추세 [날짜,값] → {d,v} · 날짜·숫자 아닌 점은 뺌');
ok(!S.R02.trend.some(Array.isArray), '배열 속 배열 없음(Firestore가 못 담음)');
ok(S.R02.champ === 0.0563 && S.R02.chall === 0.0536 && S.R02.swapAt === '2026-10-18', '챔피언·도전자·바뀐 날 그대로');
ok(S.R20.trend.length === 1 && S.R20.trend[0].v === 1.86, '{d,v} 꼴 추세도 받음');
ok(S.C01.value === null && !('champ' in S.C01) && S.C01.metric.length === 80 && S.C01.changed === '{"a":1}', '숫자 아닌 값은 비움 · 글 길이 자름 · 객체는 글로');
ok(Object.keys(pulseClean(null).studies).length === 0 && Object.keys(pulseClean({ studies: 5 }).studies).length === 0, '빈·이상한 입력은 아무것도 안 넣음');
const many = {}; for (let i = 0; i < 120; i++) many['R' + String(i % 100).padStart(2, '0') ] = { value: i, trend: Array.from({ length: 200 }, (_, k) => ['2026-01-01', k]) };
const m = pulseClean({ studies: many }); ok(Object.keys(m.studies).length <= 80 && m.studies.R01.trend.length === 90, '연구 80개·추세 90점 넘게는 안 받음');
console.log(bad ? `❌ ${bad}개 실패` : '✓ tPULSE1111 모두 통과'); process.exit(bad ? 1 : 0);
