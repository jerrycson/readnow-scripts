// tREL9 — 🎣 판 ⑨ 판매자 움직이는 때(relDelta) · 감시기가 규칙·층 값을 판정에 씀 · 셈만 그룹 쓰기 0 (정범님 11/19 I-1119-1304-10 · 일꾼 strat6)
// 실행: node src/tests/chase/tREL9.js [판정 엔진 파일 경로]
const fs = require('fs'), path = require('path');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const rd = (c) => fs.readFileSync(firstOf(c), 'utf8');
const APP = rd([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]);
const W = rd([path.join(__dirname, '../../../readnow-price-watch.user.js'), path.join(__dirname, '../../readnow-price-watch.user.js')]);
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
ok(typeof CH.relDelta === 'function', '엔진이 relDelta를 내보냄');
const D = (L, prev) => CH.relDelta(prev === undefined ? { active: true } : prev, { at: '2026-11-19T05:30:00.000Z', chPrev: 10000, chP: 9000, ...L });
let d = D({}); ok(d && d.hr === 14 && d.cut === 10 && !d.up && !d.back, '내림: 05:30Z = 한국 14시 · 10% 내림');
d = D({ at: '2026-11-19T15:00:00.000Z' }); ok(d.hr === 0, '15:00Z = 한국 0시(날 넘김)');
d = D({ chP: 11000 }); ok(d && d.up === 1 && d.hr == null && d.cut == null, '우리 전략 중 올림 = upN');
d = D({ chP: 11000 }, null); ok(d && d.back === 1 && !d.up, '전략이 없을 때(떠난 뒤) 올림 = backN');
d = D({ chP: 10000 }); ok(d === null, '값이 그대로면 아무 칸도 없음');
d = D({ chP: 10000, end: 'chaserGone' }); ok(d && d.gone === 1, '사라져 끝남 = goneN');
d = D({ chPrev: null }); ok(d === null, '이전 값을 모르면 칸 없음');
ok(CH.relDelta(null, null) === null, 'L이 없으면 null');
// 규칙이 비면 예전 judge와 같은 값
const In = { strat: { name: 'yield' }, state: null, now: '2026-11-19T05:30:00.000Z', cur: 10000, base: 9500, yieldT: 9000, chaser: null, floor: 0, start: 10000, policy: null, page1: [], moves: {} };
const a = CH.judge(In), b = CH.judgeRule({ ...In, rule: null, facts: {} }); ok(JSON.stringify(a.t) === JSON.stringify(b.t) && a.active === b.active, '규칙 없음 = judge 그대로(목표값 같음)');
const c = CH.judgeRule({ ...In, rule: { time: { hours: '1-2' } }, facts: {} }); ok(c.rule && c.rule.dry && c.t === 10000, '시간대 밖이면 값 그대로(규칙이 판정에 먹힘)');
// 감시기 본체
ok(/function ruleLayers\(/.test(W) && /CHE\.judgeRule\(/.test(W), '감시기가 규칙 층을 모아 judgeRule을 부름');
ok(/SET\.watchRule/.test(W) && /polFold/.test(W) && /polGroup/.test(W), '전체·묶음·그룹 층을 다 읽음');
ok(/if \(!r\) r = CHE \? CHE\.judge\(JI\)/.test(W), '깨지면 예전 judge로 되돌림');
ok(/규칙: 승인 필요/.test(W), '규칙 「승인 필요」가 자동 반영을 결정 대기로 돌림');
ok(/function relFields\(/.test(W) && /\.\.\.relFields\(prevS, L, FV\)/.test(W), 'chase_rel 같은 문서에 새 칸(쓰기 횟수 그대로)');
ok(/if \(JW && !JW\.dry && /.test(W), '셈만 그룹은 추격 기록을 안 씀(쓰기 0)');
ok(/if \(!DRYW && J\.chR && J\.chR\.rule !== undefined\)/.test(W), '셈만 그룹은 규칙 장부(ruleSt)도 안 씀');
// 웹앱 카드
ok(/function gswSlWhen\(/.test(APP) && /\$\{when\}/.test(APP), '판매자 카드에 「움직이는 때」');
console.log(bad ? `tREL9 ❌ ${bad}/${n}` : `tREL9 ✅ ${n}개 통과`); process.exit(bad ? 1 : 0);
