// tSLNOU1112 — (11/12 rel9) 🧑‍🏫 판매자 배우기·👥 구매자 분포 문서가 한 번도 안 생기던 것: 셈 결과에 undefined 칸(comp.top·explore.top의 combo)이 섞여 Firestore 쓰기가 통째로 실패
//   ① cloud/index.js slNoU: undefined 칸 지움 · 배열 안 undefined → null · 서버 시각 같은 특수 값(일반 객체 아님)은 그대로 · 다른 값 그대로
//   ② sellerLearnStudy·sellerAudStudy가 쓰기 직전에 slNoU를 부름 · 공용 파일 hypTest 결과에 combo: undefined가 생길 수 있는 줄 확인
// 실행: node src/tests/tSLNOU1112.js · 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const ROOT = path.resolve(__dirname, '..', '..'); const SRC = fs.readFileSync(path.join(ROOT, 'cloud/index.js'), 'utf8');
const i = SRC.indexOf('const slNoU = '); const j = SRC.indexOf('\n', i); ok(i > 0, 'cloud/index.js에 slNoU 있음');
const slNoU = new Function(SRC.slice(i, j) + '\nreturn slNoU;')();
class FV { constructor() { this.k = 'serverTimestamp'; this.u = undefined; } }
const fv = new FV();
const o = { a: 1, b: undefined, c: { d: undefined, e: null, f: [1, undefined, { g: undefined, h: 'x' }] }, top: [{ p: 0.01, combo: undefined }, { p: 0.02, combo: 1 }], at: fv };
slNoU(o);
ok(!('b' in o) && !('d' in o.c) && o.c.e === null, '객체 안 undefined 칸 지움 · null은 그대로');
ok(o.c.f[1] === null && !('g' in o.c.f[2]) && o.c.f[2].h === 'x', '배열 안 undefined → null · 배열 속 객체도');
ok(!('combo' in o.top[0]) && o.top[1].combo === 1, 'comp.top 의 combo: undefined 지움(1은 그대로)');
ok(o.at === fv && 'u' in fv, '서버 시각 같은 특수 값(일반 객체 아님)은 건드리지 않음');
const has = (s) => !!s && JSON.stringify(s) !== undefined;
ok(has(o) && slNoU(null) === null && slNoU(5) === 5, '빈 값·숫자 그대로');
ok(/if \(dry\) return doc; slNoU\(doc\); slNoU\(X2\); await ref\.set\(doc\);/.test(SRC), '판매자 배우기: 쓰기 직전 slNoU(doc·X2)');
ok(/if \(dry\) return doc; slNoU\(doc\); slNoU\(L2\); await ref\.set\(doc\); await C\('ml_seller_aud'\)/.test(SRC), '구매자 분포: 쓰기 직전 slNoU(doc·L2)');
const CORE = fs.readFileSync(path.join(ROOT, 'readnow-sellerlearn-core.js'), 'utf8');
ok(/combo: T\[i\]\.combo/.test(CORE), '(원인 확인) 공용 파일 다시 섞기 줄이 combo: T[i].combo — 짝 아닌 시험이면 undefined');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
