// tSLTYPE — 🧬 판 ⑦ 판매자 유형 · 추천 · 예외 적용 (정범님 11/19 I-1119-1304-10 · 일꾼 strat6)
// 실행: node src/tests/chase/tSLTYPE.js [판정 엔진 파일 경로]
const fs = require('fs'), path = require('path');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
ok(typeof CH.sellerType === 'function' && typeof CH.typeAdvice === 'function' && !!CH.SELLER_TYPES && !!CH.TYPE_CFG, '엔진에 유형 함수가 내보내짐');
const B = { ov: 12, cheap: 6, low: 1, near: 3, dumpN: 0, refN: 12, multi: 0, ev: 0, lagMin: null, upN: 0, quiet: null, fresh: null, chased: false };
const T = (o) => CH.sellerType({ ...B, ...o }).type;
ok(T({ ev: 4, lagMin: 59 }) === 'fast', '반응 59분 = 빠른형'); ok(T({ ev: 4, lagMin: 60 }) === 'slow', '반응 60분 = 느린형');
ok(T({ dumpN: 6, refN: 10 }) === 'dump', '덤핑 50% 넘으면(60%) 덤핑형'); ok(T({ dumpN: 5, refN: 10 }) !== 'dump', '덤핑 딱 50%는 덤핑형 아님');
ok(T({ ov: 2 }) === 'unknown', '겹침 모자라면 모름'); ok(T({ ov: 2, fresh: 3 }) === 'fresh', '새 판매자 + 표본 모자람 = 새로 등장형');
ok(T({ dumpN: 9, refN: 10, ev: 4, lagMin: 10 }) === 'dump', '순서 — 덤핑이 반응 속도보다 앞');
ok(T({ ev: 1, lagMin: 5 }) !== 'fast', '반응 한 번뿐이면 빠른형 아님');
for (const k of Object.keys(CH.SELLER_TYPES)) { const A = CH.typeAdvice(k, '판매자A'); for (const key of ['rec', 'alt']) { if (!A[key]) continue; const p = CH.normPolicy({ on: true, sellers: { 111: A[key] } }); ok(!!p.sellers && !!p.sellers['111'], `${k} ${key} 줄이 normPolicy를 지남`); ok(/^type:/.test(A[key].from || ''), `${k} ${key} 출처 표시`); } ok(typeof A.text === 'string' && A.text.length > 3, `${k} 추천 글 있음`); }
ok(CH.typeAdvice('dump', 'x').rec.stance === 'ignore', '덤핑형 추천 = 무시');
const mkp = (st) => ({ on: true, sellers: { 111: { name: 'A', stance: st, cond: {} } } });
const E1 = CH.policyFor({ global: mkp('aggressive'), fold: mkp('defensive'), group: mkp('ignore') }); ok(E1.sellers['111'].stance === 'ignore', '그룹 > 묶음 기본 > 전체');
const E2 = CH.policyFor({ global: mkp('aggressive'), fold: mkp('defensive'), group: null }); ok(E2.sellers['111'].stance === 'defensive', '그룹 없으면 묶음 기본');
const E3 = CH.policyFor({ global: mkp('aggressive'), fold: null, group: { sellers: { 222: { name: 'B', stance: 'ignore', cond: {} } } } }); ok(E3.sellers['111'].stance === 'aggressive' && E3.sellers['222'].stance === 'ignore', '다른 판매자 줄은 서로 안 덮음');
const E4 = CH.policyFor({ global: { on: true, sellers: { 111: { name: 'A', stance: 'aggressive', strat: 'lift', cond: { rangePct: 9 } } } }, fold: null, group: { sellers: { 111: { name: 'A', stance: 'ignore', cond: {} } } } }); ok(E4.sellers['111'].stance === 'ignore' && !E4.sellers['111'].strat, '같은 판매자 줄은 통째로 바뀜');
const E5 = CH.policyFor({ global: { on: false }, fold: null, group: { sellers: { 996008: { stance: 'ignore' } } } }); ok(!E5.sellers || !E5.sellers['996008'], '우리 가게 줄은 건너뜀');
const E6 = CH.policyFor({ global: mkp('aggressive'), fold: null, group: null }); ok(E6.sellers['111'].stance === 'aggressive', '다른 그룹(그룹 줄 없음)은 전체 그대로 — 그룹 예외는 그 그룹에만');
const s = APP.indexOf('/* ◆gsw7 시작'), e = APP.indexOf('/* ◆gsw7 끝 */'); ok(s > 0 && e > s, '웹앱에 ◆gsw7 블록'); const B7 = APP.slice(s, e);
ok(!/\b(alert|confirm|prompt)\(/.test(B7), '블록에 브라우저 팝업 없음');
for (const f of ['gswPolEff', 'gswPolAdd', 'gswPolHtml', 'gswPolCheck', 'gswPolEasy', 'gswSlAdvHtml', 'gswSlChip']) ok(new RegExp('function ' + f + '\\(').test(B7), '함수 ' + f);
ok(/policy: gswPolEff\(o, watch\)/.test(APP), '미리 보기가 층을 합친 정책을 씀'); ok(/gswPolCheck\(D\)/.test(APP), '적용 전 예외 검사');
ok(!/db\.collection|setDoc|updateDoc/.test(B7.replace(/gswPolFold[\s\S]*?\n/, '')), '예외 창은 직접 Firestore를 안 씀(저장은 gswApply·bkcSave)');
console.log(bad ? `❌ tSLTYPE 실패 ${bad}/${n}` : `✅ tSLTYPE 통과 ${n}건`); process.exit(bad ? 1 : 0);
