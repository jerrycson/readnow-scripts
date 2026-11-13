// tBENCHREP1113 — (benchfix 11/13) 🎯 집중 벤치마킹 고침 묶음 · 브라우저 필요 없음
//  ① 끝 쪽에 닿았으면(빈 쪽·다른 모양·끝 쪽 바로 앞 이어 읽기 끝) 덮은 비율 1 — 11/13 딱따구리 1,245/1,246쪽(0.999)이 숍 전체 판정을 못 받던 것
//  ② 📦 대량 사라짐 사건(숍의 8%↑·하루 2%↑·500개↑) — 수집기·클라우드 같은 기준 · 웹앱·클라우드 팔림 셈에서 뺌 · '↩ 다시 넣기'(excl:false)면 다시 씀
//  ③ 📖 상품 페이지 정보 — 테더링 몫이 막히면 '못 읽음(2)'으로 적지 않고 멈춤 · 이어 읽기 칸에서 하루 몫 안에서 이어 함
//  ④ 🎯 회차 보고(cloud/benchrep.js makeAcc) — 지어낸 숍 3곳으로 19줄 셈 · 웹앱 화면 글
// 실행: node src/tests/tBENCHREP1113.js · 시험 자료는 모두 지어낸 값(가게 번호 9000001…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const rd = (...p) => { for (const q of p) { const f = path.join(ROOT, q); if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8'); } return ''; };
const SRC = rd('src/readnow-collector.src.js', 'readnow-collector.src.js'); const APP = rd('src/app.html', 'app.html'); const CL = rd('cloud/index.js');
const BR = require(path.join(ROOT, 'cloud', 'benchrep.js'));

console.log('① 끝 쪽에 닿음 = 숍 전체');
ok(/if \(!L\.length\) \{ if \(lastP && prog\.page >= lastP - 2\) prog\.endHit = \{[^}]*how: 'empty'/.test(SRC), '빈 쪽(끝 쪽 −2쪽부터)은 endHit');
ok(/prog\.endHit = \{ page: prog\.page, lastP, how: 'shape'/.test(SRC), '끝 쪽 둘레 다른 모양도 endHit');
ok(/R\.endNear = true; prog\.readDone = true; prog\.endHit =/.test(SRC), '이어 읽기 끝 쪽 바로 앞 끝도 endHit');
ok(/const cov = !prog\.pagingBroken && prog\.endHit && lastP && lastRead >= lastP - 2 \? 1 : cov0/.test(SRC), '덮은 비율 = 1(끝 닿음) · 원래 값 coverRaw');
{ const cov = (endHit, lastRead, lastP) => { const c0 = lastP ? Math.min(1, lastRead / lastP) : 1; return endHit && lastP && lastRead >= lastP - 2 ? 1 : c0; };
  ok(cov(true, 1245, 1246) === 1, '딱따구리 1,245/1,246 + 끝 닿음 → 1'); ok(cov(false, 1245, 1246) < 1, '끝 닿음 없으면 그대로 0.999'); ok(cov(true, 900, 1246) < 1, '한참 앞에서 멈추면 1이 아님'); }
ok(/fullRunAt: prog\.startedAt \|\| nowIso\(\)/.test(SRC) && /let fullPrev = st\.fullRunAt \|\| null;/.test(SRC), '기간은 마지막 숍 전체 회차부터(fullRunAt · 옛 상태는 bench_days에서 찾음)');

console.log('② 📦 대량 사라짐');
ok(/const MASS = \(\(\) => \{[^\n]*share >= 0\.08 && perDay >= 0\.02/.test(SRC) && /g < 500/.test(SRC), '수집기 기준 8%·2%·500');
ok(BR.BENCH_MASS.share === 0.08 && BR.BENCH_MASS.perDay === 0.02 && BR.BENCH_MASS.min === 500, '클라우드 기준 같음');
const yw = { sc: '9000001', total: 78283, add: 4160, gone: 13526, spanDays: 3.73 }; const ss = { sc: '9000002', total: 104402, add: 4620, gone: 14820, spanDays: 5.1 };
const gm = { sc: '9000003', total: 80424, add: 2654, gone: 1701, spanDays: 1.94 }; const nk = { sc: '9000004', total: 19855, add: 161, gone: 738, spanDays: 5.01 };
ok(!!BR.massOf(yw) && !!BR.massOf(ss), '11/13 어린왕자·소득공제 꼴 → 사건', [BR.massOf(yw), BR.massOf(ss)]); ok(!BR.massOf(gm) && !BR.massOf(nk), '곰돌이·낙성대 꼴 → 사건 아님');
ok(!BR.massOf({ ...yw, base: true }) && !BR.massOf({ ...yw, full: false }), '첫 바퀴·숍 전체 아님은 판정 안 함');
ok(/v\.excl !== true && !\(v\.massGone === true && v\.excl !== false\)/.test(CL), '클라우드 benchRunUse가 대량 사라짐 뺌');
ok(/where\('massGone', '==', true\)/.test(CL), '클라우드 판매 표본(benchExclRuns)에서도 뺌');
ok(/R\.push\(v\.massGone === true && v\.excl !== false \? \{ \.\.\.v, excl: true \} : v\)/.test(CL), '판매자 배우기에도 뺀 회차와 같게');
{ const m = APP.match(/const benchOut = \(x\) => [^\n]+/); const benchOut = m ? eval('(' + m[0].replace(/^const benchOut = /, '').replace(/;$/, '') + ')') : null;
  ok(benchOut && benchOut({ massGone: true }) && !benchOut({ massGone: true, excl: false }) && benchOut({ excl: true }) && !benchOut({}), '웹앱 benchOut — 사건은 빼고 다시 넣기면 셈'); }
ok((APP.match(/benchOut\(/g) || []).length >= 3, '웹앱 판매 셈 3곳이 benchOut을 씀');

console.log('③ 📖 상품 페이지 정보 — 몫 막힘');
ok(/const benchNetQuota = \(\) => \{ try \{ tgateCheck\(\); return \{ ok: true \}; \}/.test(SRC), '몫 확인(tgateCheck)');
ok(/if \(bErr\) \{ errN\+\+;[^\n]*if \(bErr\.tgate\) \{ stopAll =/.test(SRC), '열다 난 오류는 못 읽음(2)으로 안 적고 테더링 문이면 멈춤');
ok(/if \(redoChk\) \{ for \(const P of parts\) for \(const v of Object\.values\(P\.M\)\) if \(Array\.isArray\(v\) && v\[10\] === 2\) \{ v\[10\] = 0;/.test(SRC), '11/13에 못 읽음이 된 것 한 번 되살림');
ok(/if \(!left\.length\) \{ if \(wantDetail && !HELP && !stopFlag && benchDoneToday\(\) && benchDetailDue\(old\) && benchNetQuota\(\)\.ok\)/.test(SRC), '할 일 없는 이어 읽기 칸에서 하루 몫 안에서 이어 함');
ok(/await benchDetailNote\(rD\)/.test(SRC), '결과를 benchForce.detail에 남김');

console.log('④ 🎯 회차 보고 셈');
const day = '2026-11-13'; const J = (a) => JSON.stringify(a);
const runs = [
  { sc: '9000001', name: '가게A', day, dayId: '9000001_' + day, total: 1000, add: 30, gone: 20, goneNew: 3, moved: 3, spanDays: 1, full: true, complete: true, readTo: 20, runLastPage: 20, runAt: '2026-11-12T15:10:00Z', at: '2026-11-12T15:30:00Z', lowNow: 100, totalBand: { '~3천': 900, '3~6천': 100 },
    goneList: [J(['a1', '해리 포터 1', 900, '중', 5, '20261108', 1]), J(['a2', '유일한 책', 25000, '상', 2, '20261111', 0]), J(['a3', '함께 팔린 책', 3000, '상', 10, '20261103', 1]), J(['a9', '처음부터 책', 500, '중', null, '20261001', 0])],
    addList: [J(['a20', '새 책', 1000, '최상', null, null, 10000, 0]), J(['a21', '새 책', 1000, '최상', null, null, 10000, 0]), J(['a22', '다른 새 책', 2000, '최상', null, null, 9000, 0])],
    movedList: [J(['a5', 500, 350]), J(['a6', 500, 350]), J(['a7', 4000, 4500])], lowOffList: [J(['a5', '내릴 책', 350, '중'])] },
  { sc: '9000002', name: '가게B', day, dayId: '9000002_' + day, total: 500, add: 5, gone: 4, goneNew: 1, moved: 0, spanDays: 1, full: true, complete: true, readTo: 10, runLastPage: 10, runAt: '2026-11-12T16:00:00Z', at: '2026-11-12T16:10:00Z', goneList: [J(['b1', '함께 팔린 책', 4000, '상', 3, '20261110', 0])], addList: [J(['b9', '비싼 새 책', 9000, '상', null, null, 20000, 0])], movedList: [], lowOffList: [] },
  { sc: '9000003', name: '가게C', day, dayId: '9000003_' + day, total: 90000, add: 100, gone: 12000, goneNew: 50, moved: 0, spanDays: 2, full: true, complete: true, readTo: 1800, runLastPage: 1800, runAt: '2026-11-12T17:00:00Z', at: '2026-11-12T18:00:00Z', goneList: [J(['c1', '정리한 책', 990, '중', null, '20261001', 0])], addList: [], movedList: [], lowOffList: [] },
  { sc: '9000004', name: '가게D', day, dayId: '9000004_' + day, light: true, partial: true, newN: 40, readTo: 3, runAt: '2026-11-12T19:00:00Z', at: '2026-11-12T19:05:00Z' },
  { sc: '9000005', name: '가게E', day, dayId: '9000005_' + day, total: 300, full: false, complete: true, cover: 0.999, notRead: 12, readTo: 9, runLastPage: 10, runAt: '2026-11-12T19:10:00Z', at: '2026-11-12T19:20:00Z', goneList: [], addList: [], movedList: [] }];
const hist = [{ sc: '9000001', day: '2026-11-12', dayId: '9000001_2026-11-12', gone: 10, add: 5, spanDays: 1, full: true, complete: true, runAt: '2026-11-11T15:10:00Z' }, { sc: '9000004', day: '2026-11-12', light: true, newN: 25, runAt: '2026-11-11T19:00:00Z' }];
const acc = BR.makeAcc({ day, runs, hist, role: { '9000001': 'main' }, force: { done: true, startedAt: '2026-11-12T15:00:00Z', doneAt: '2026-11-12T20:00:00Z', failed: [] }, net: BR.netSum({ pcs: { LOGGER: { helper: { tether: 8 * 1073741824, todayJobs: { bench: 7 * 1073741824 }, month: { tether: 60e9, jobs: { bench: 45e9 } }, phones: [{ name: '휴대폰 1', capGB: 120, used: 110 * 1073741824, today: 8 * 1073741824, connected: true, inet: { ok: true } }, { name: '휴대폰 2', capGB: 120, used: 1e6, today: 0, connected: true, inet: { ok: false } }] } } } }, day), prevRep: { day: '2026-11-12', lowOffIds: { '9000001': ['a5', 'zz'] } }, plan: [{ sc: '9000001' }, { sc: '9000009', name: '가게Z' }], intel: { planN: 2, readN: 1, stale7: 1, anomN: 1, anom: [{ name: '가게A', kind: '판매율', z: 4, x: 1, base: 0.2 }] } });
acc.shop('9000001', { a10: [800, '20261112', '중', 0, '내릴 책', 1, 0], a11: [1200, '20261001', '상', 1, '함께 팔린 책', 0, 0], a12: [7000, '20261110', '상', 0, '우리와 같은 책', 0, 0] }); acc.endShop('9000001');
acc.shop('9000002', { b10: [700, '20261112', '중', 0, '내릴 책', 0, 0], b11: [5000, '20261001', '상', 1, '우리와 같은 책', 0, 0], b12: [26000, '20261001', '상', 1, '해리 포터 2', 0, 0] }); acc.endShop('9000002');
acc.shop('9000003', { c10: [990, '20261001', '중', 1, '정리한 책', 0, 0] }); acc.endShop('9000003');
acc.ours([{ t: '우리와 같은 책', p: 9000 }, { t: '없는 책', p: 3000 }]);
const P = acc.done();
ok(P.unknown && P.unknown.notFull.includes('가게E') && P.unknown.notRead.includes('가게Z') && P.unknown.light.includes('가게D') && P.shops.find((x) => x.sc === '9000005').gone === null && P.shops.find((x) => x.sc === '9000005').unk === true, '못 읽은 판매자 = 모름(0 아님) · 안 읽은·새 것만·끝까지 못 읽음 따로', P.unknown);
ok(P.intel && P.intel.stale7 === 1 && P.problems.some((p) => /기준선 경보/.test(p)) && P.problems.some((p) => /가게Z/.test(p)), '🕵 정보 수집 방법 연구 지표를 붙이고 문제에 적음'); const keys = ['round', 'data', 'shops', 'light', 'sold', 'mass', 'moves', 'per', 'groups', 'market', 'predict', 'noOther', 'buy', 'signal', 'ours', 'hours', 'problems'];
ok(keys.every((k) => k in P), '고정 항목 칸이 모두 있음', keys.filter((k) => !(k in P)));
ok(P.round.shopsFull === 4 && P.round.shopsOk === 3 && P.round.shopsLight === 1 && P.round.main === 1, '① 판 숫자', P.round);
ok(P.data.perPageMiB > 0 && P.data.noNet.includes('휴대폰 2') && P.data.runOutDay, '② 데이터 — 쪽당·인터넷 안 되는 폰·바닥나는 날', P.data);
ok(P.shops.length === 4 && P.shops.find((s) => s.sc === '9000001').prev.gone === 10 && P.shops.find((s) => s.sc === '9000005').full === false, '③ 판매자 표 · 앞 회차 · 끝까지 ✗');
ok(P.light[0].newN === 40 && P.light[0].prevNewN === 25, '④ 새 상품만 · 앞 회차');
ok(P.sold.n === 4 && P.sold.base === 1, '⑤ 팔린 새 상품 4(대량 사라짐 가게C 뺌) · 처음부터 있던 것 1', P.sold);
ok(P.mass.length === 1 && P.mass[0].sc === '9000003', '⑥ 가게C 대량 사라짐', P.mass);
ok(P.moves.dn === 2 && P.moves.up === 1 && P.moves.pairs[0][0] === '500→350', '⑦ 값 매김 · 값 쌍', P.moves);
ok(P.per.find((x) => x.sc === '9000001').ratio === 0.1 && P.per.find((x) => x.sc === '9000001').group === '대량 회전형', '⑧·⑩ 정가 대비 10% → 대량 회전형');
ok(P.market.soldMatched >= 1 && P.noOther.n10 === 1 && P.noOther.top[0].t === '유일한 책', '⑨·⑭ 다른 숍 최저 · 살 곳 없는 1만 원↑ 책', [P.market, P.noOther]);
ok(P.buy.together === 1, '⑮ 두 숍에서 함께 팔린 제목 1', P.buy);
ok(P.predict.prevN === 2 && P.predict.prevHit === 1 && P.lowOffIds['9000001'][0] === 'a5', '⑬ 앞 보고 예측 맞힘 1/2 · 다음 예측 저장', P.predict);
ok(P.ours.overlap === 1 && P.ours.hi20 === 1 && P.ours.top[0].min === 5000, '⑰ 우리 겹침 · 내릴 후보(롤모델 최저 5,000원 · 우리 9,000원)', P.ours);
ok(P.hours.ok === false && P.problems.some((p) => /가게E/.test(p)) && P.problems.some((p) => /📦 가게C/.test(p)), '⑱ 영업 시간 못 구함 · ⑲ 문제(숍 전체 아님·대량 사라짐)', P.problems);

console.log('⑤ 웹앱 화면');
ok(/function openBenchRep\(\)/.test(APP) && /\['benchRep', '🎯 벤치마킹 회차 보고', \(d\) => d\.benchRep, 'openBenchRep'\]/.test(APP), '화면 열기 · 되살리기 목록');
ok(/research: \[\['🔬 연구 모음', \[[^\]]*'benchRep',/.test(APP), '🔬 연구 탭 묶음에 🎯 회차 보고');
ok(/data-navgo="benchRep"/.test(APP), '🎯 집중 벤치마킹 카드에 🎯 회차 보고 단추');
{ const m = APP.match(/const brN = [\s\S]*?\nfunction brCss\(\)/); let html = ''; try { const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const num = (n) => Number(n).toLocaleString('ko-KR'); const f = new Function('esc', 'num', m[0].replace(/\nfunction brCss\(\)$/, '') + '\nreturn brHtml;'); html = f(esc, num)({ day, at: '2026-11-13T00:00:00Z', runs: 5, chunks: 3, ...P }); } catch (e) { html = 'ERR ' + e.message; }
  ok((html.match(/class="card br-s"/g) || []).length === 17 && /19\. 문제/.test(html) && /17\. 우리와 겹침/.test(html) && /📦/.test(html), '보고 그리기 — 19줄(묶은 칸 포함 16칸 + 🕵 수집 품질)', html.slice(0, 300)); }

console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
