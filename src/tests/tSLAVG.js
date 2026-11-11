// tSLAVG — 정범님 11/11 밤 (bavg1): 공용 readnow-sellerlearn-core.js 판매자 주력 셈의 ⏸ 빈 날 배분·사람 값 먼저
//  ① 며칠치 회차의 새로 올림을 빈 날까지 나눠 '등록한 날 몫'을 날마다 셈(예전엔 회차 하나 = 하루) ② 🧩 채운 날(fill)·✎ 고친 값(edit)이 수집 값보다 먼저
//  ③ 몰아서 내림 자르기의 가운데 값은 날 수 무게(4일치 회차 = 4일) · 꾸민 판매자 값만 · 실행: node src/tests/tSLAVG.js
const fs = require('fs'); const path = require('path');
const SL = require([path.join(__dirname, '../readnow-sellerlearn-core.js'), path.join(__dirname, '../../readnow-sellerlearn-core.js')].find((x) => fs.existsSync(x)));
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x))); if (!c) bad++; };
const run = (day, o) => ({ sc: '9', day, total: 1000, complete: true, ...o });
const R = [run('2026-11-12', { spanDays: 1, add: 3, gone: 3, sumGone: 30000 }), run('2026-11-16', { spanDays: 4, add: 12, gone: 12, sumGone: 120000 }), run('2026-11-17', { spanDays: 1, add: 3, gone: 3, sumGone: 30000 })];
const p = SL.profile(R);
ok(p.regDays === 6 && p.regDaysShare === 1 && p.addCv === 0, '① 새로 올림 12(4일치)를 4일로 나눠 날마다 3 — 등록한 날 6/6 · 들쭉날쭉 0 (예전: 회차 3개)', p);
ok(p.soldPerDay === 3 && p.revPerDay === 30000 && p.addPerDay === 3, '하루 판매 3 · 매출 3만 · 등록 3 (참값)', p);
const pE = SL.profile([R[0], { ...R[1], edit: { gone: 8, add: 4 } }, R[2]]);
ok(pE.sold === 14 && pE.humanRuns === 1 && pE.regDays === 6 && pE.regDaysShare === 1, '② ✎ 고친 값(사라짐 12→8 · 올림 12→4) 먼저 — 올림 4를 4일에 1씩', pE);
const pF = SL.profile([R[0], { ...R[1], fill: { days: [{ day: '2026-11-13', add: 0, gone: 1, sumGone: 10000 }, { day: '2026-11-14', add: 6, gone: 5, sumGone: 50000 }, { day: '2026-11-15', add: 0, gone: 0, sumGone: 0 }, { day: '2026-11-16', add: 6, gone: 6, sumGone: 60000 }] } }, R[2]]);
ok(pF.sold === 18 && pF.regDays === 6 && Math.abs(pF.regDaysShare - 4 / 6) < 0.001, '② 🧩 채운 날 값 그대로(올림 0·6·0·6 → 등록한 날 4/6)', pF);
// ③ 날 수 무게 가운데 값: 10일치 회차(하루 25) · 하루치 회차 2개(하루 2) · 하루치 105 — 회차 하나 = 한 표면 가운데 13.5라 105를 '몰아서 내림'으로 잘랐음(예전) · 날 수 무게면 가운데 25 → 5배 125 안이라 그대로
const R3 = [run('2026-10-01', { spanDays: 10, gone: 250 }), run('2026-10-02', { spanDays: 1, gone: 2 }), run('2026-10-03', { spanDays: 1, gone: 2 }), run('2026-10-04', { spanDays: 1, gone: 105 })];
const p3 = SL.profile(R3);
ok(p3.cutRuns === 0, '③ 가운데 값을 날 수 무게로(하루 25) — 하루 105 회차는 자르지 않음(예전 회차 한 표 셈은 잘랐음)', p3);
console.log(bad ? `❌ tSLAVG 실패 ${bad}` : '✓ tSLAVG 통과'); process.exit(bad ? 1 : 0);
