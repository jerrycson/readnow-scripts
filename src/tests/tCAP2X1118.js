// tCAP2X1118 — (11/18 일꾼 cap2x · 정범님 16:24 「알라딘 부르는 횟수가 이렇게 비약적으로 많으면 두 배까지만 늘려」 · 16:32 I-1118-1632-17 「큰 몫만 2배 · 작은 것은 3배 그대로」 · 경계 500)
//   ① 판본 엔진 몫(edCapOf) — 바닥 1,200 · 빌림 끝 4,800 · 막힘 1번이면 막힘 바닥 600 · 2번 넘으면 300 · 다시 보기 몫 300
//   ② 코드 기본값 — 원래 500 이상(시장 지표·책 정보 출처별·외부 정보 큰 출처·판본 엔진)은 원래의 2배 · 500 아래(새책 찾기·가게 읽기·날씨·예스24 하루·벤치마킹·외부 정보 작은 출처)는 3배 그대로
//   ③ 한 번만 설정 문서 큰 몫만 2배로 낮춤(cloud/cap2x.js) — 내리기만 · 원래(cap3x 표시 from) 500 이상만 × 2(공식 쿼터까지) · 500 아래는 손대지 않음 · 끝난 서비스·로거 몫 그대로 · 거래 안에서 표시를 읽어 두 번 안 함 · cap3x 표시는 그대로
//   ④ 하루 알라딘 몫 합(리드 꼴 alDay) 15,200 = 원래 7,600의 2배
// 실행: node src/tests/tCAP2X1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const R = path.resolve(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(R, 'cloud', 'index.js'), 'utf8');
const lineOf = (S, re) => (S.split('\n').find((x) => re.test(x)) || '');

console.log('① 판본 엔진 몫');
const ED = require(path.join(R, 'cloud', 'edition.js')); const edCapOf = ED._t.edCapOf;
ok(ED.ED_DEF.dayCap === 1200 && ED.ED_DEF.capMax === 4800 && ED.ED_DEF.blkCap === 600 && ED.ED_DEF.rrRes === 300, '기본값 바닥 1,200 · 빌림 끝 4,800 · 막힘 바닥 600 · 다시 보기 몫 300', ED.ED_DEF);
const D = ED.ED_DEF; const full = [{ k: 'bk', used: 8000, cap: 8000 }, { k: 'met', used: 6000, cap: 6000 }];
const a = edCapOf({ base: D.dayCap, capMax: D.capMax, blkCap: D.blkCap, frac: 0.99, others: full });
ok(a.cap === 1200, '남는 몫이 없어도 바닥 1,200', a);
const b = edCapOf({ base: D.dayCap, capMax: D.capMax, blkCap: D.blkCap, frac: 0.5, others: [{ k: 'bk', used: 1000, cap: 8000 }, { k: 'met', used: 0, cap: 6000 }] });
ok(b.cap > 1200 && b.cap <= 4800, '남는 몫이 있으면 1,200보다 많이(4,800까지)', b);
ok(edCapOf({ base: D.dayCap, capMax: D.capMax, blkCap: D.blkCap, frac: 0.5, others: full, edBlocks: 1 }).cap === 600, '오늘 막힘 1번 → 막힘 바닥 600');
ok(edCapOf({ base: D.dayCap, capMax: D.capMax, blkCap: D.blkCap, frac: 0.5, others: full, edBlocks: 2 }).cap === 300, '오늘 막힘 2번 → 300');

console.log('② 코드 기본값 — 큰 몫(원래 500 이상)만 2배');
ok(/const NB_DEF = \{ on: true, dayCap: 180,/.test(CL), '새책 찾기 원래 60(작음) → 3배 180 그대로');
ok(/const SSH_DEF = \{ cap: 450,/.test(CL), '가게 읽기 원래 150(작음) → 3배 450 그대로');
ok(/dayCap: 2000, sliceSec: 50/.test(lineOf(CL, /^const MET_DEF/)), '클라우드 시장 지표 원래 1,000(큼) → 2,000권');
ok(/perDay: 120,/.test(lineOf(CL, /^const WX_DEF/)), '날씨 묶음 원래 40(작음) → 3배 120 그대로');
ok(/: 8000; const bkOff/.test(lineOf(CL, /^function edAlUse/)), '판본 엔진이 보는 책 정보 알라딘 기본 몫 원래 4,000(큼) → 8,000');
const BK = fs.readFileSync(path.join(R, 'cloud', 'bookinfo.js'), 'utf8');
const pd = lineOf(BK, /^const PACE_DEF/);
for (const [k, n] of [['yes24', 18000], ['nl', 12000], ['kyobo', 6000], ['aladin', 8000], ['render', 2400], ['pvimg', 24000]]) ok(new RegExp(k + ': \\{[^}]*cap: ' + n + ' \\}').test(pd), '책 정보 ' + k + ' ' + n);
ok(/const cap = o\.cap == null \? 2400 : \+o\.cap;/.test(BK) && /pvCap: c\.pvCap == null \? 2400 : \+c\.pvCap/.test(BK), '미리보기 그림 하루 1,200 → 2,400(두 곳)');
const xs = fs.readFileSync(path.join(R, 'readnow-ext-core.js'), 'utf8');
const want = { kyobo: 1000, yes24: 1000, nl: 6000, joongmo: 1200, google: 1000, kakao: 30000, ebay: 5000, lib: 500, /* ↑ 큼 2배(쿼터까지) · ↓ 작음 3배 그대로 */ naverbook: 1200, yes24used: 1200, bunjang: 1200, joongna: 900, daangn: 900, dvdprime: 600, abebooks: 600, ridi: 900 };
for (const [k, n] of Object.entries(want)) ok(new RegExp('\\n    ' + k + ': \\{[^\\n]*cap: ' + n + ',').test(xs), '외부 정보 ' + k + ' ' + n);
ok(/const Y24_PACE = \{ min: 4000, max: 8000, cap: 360, stopH: 6 \}/.test(xs), '예스24 하루 원래 120(작음) → 3배 360 그대로 · 4~8초·6시간 멈춤 그대로');
const RG = fs.readFileSync(path.join(R, 'readnow-registry.js'), 'utf8');
ok(/const BENCH_DETAIL_DEF = \{ max: 900, maxMin: 30 \}/.test(RG), '벤치마킹 한 번 상품 페이지 원래 300(작음) → 3배 900 그대로 · 30분 그대로');

console.log('③ 한 번만 설정 문서 큰 몫만 2배로 낮춤(cloud/cap2x.js)');
const K = require(path.join(R, 'cloud', 'cap2x.js'));
ok(K.BIG === 500 && K.target(499) === null && K.target(500) === 1000 && K.target(900, 'google') === 1000, '경계 500 — 500 이상만 2배(쿼터까지) · 아래는 null(3배 그대로)');
/* 운영 cap3x 표시(11/18 07:29Z 진단으로 본 from 값과 같은 꼴 · 손님 정보 없음) */
const M3 = { nb: { from: 120, to: 360 }, ext: { from: { abebooks: 200, bunjang: 400, lib: 450, yes24used: 400, ridi: 300, google: 900, yes24: 500, kakao: 25000, kyobo: 500, daangn: 300, joongna: 300, ebay: 4000, nl: 3000 } }, c2: { from: { 'pace.dayCap': 1600, 'alcfg.dayCap': 300 } } };
const n1 = K.planNb({ cfg: { dayCap: 360, gapMin: 2000, maxRead: 20 } }, M3);
ok(n1.write === null && /3배 그대로/.test(n1.rec.why), '새책 찾기 원래 120(작음) → 360 그대로(손대지 않음)', n1);
ok(K.planNb({ cfg: { dayCap: 3000 } }, { nb: { from: 600 } }).write.cfg.dayCap === 1200, '원래가 500 이상이었다면 2배로 내림(셈 확인)');
ok(K.planNb({}, M3).write === null, '설정 칸이 없으면 쓰지 않음');
const src3 = { kyobo: { cap: 1500, on: true, refreshDays: 120 }, yes24: { cap: 1500 }, yes24used: { cap: 1200 }, bunjang: { cap: 1200 }, joongna: { cap: 900 }, daangn: { cap: 900 }, abebooks: { cap: 600 }, ridi: { cap: 900 }, nl: { cap: 9000 }, google: { cap: 1000 }, kakao: { cap: 30000 }, ebay: { cap: 5000 }, lib: { cap: 500 }, naver: { cap: 5000 }, ttb: { cap: 4500 } };
const e1 = K.planExt({ src: src3 }, M3); const w = e1.write.src;
ok(w.kyobo.cap === 1000 && Object.keys(w.kyobo).length === 1, '교보 원래 500(큼) 1,500 → 1,000(켜짐·새로 읽기 날 그대로)', w.kyobo);
ok(w.yes24.cap === 1000 && w.nl.cap === 6000, '예스24 1,500 → 1,000 · 국중 9,000 → 6,000', w);
ok(Object.keys(w).sort().join() === 'kyobo,nl,yes24', '내리는 출처는 교보·예스24·국중 셋뿐(구글·카카오·eBay는 2배가 쿼터 이상이라 그대로)', Object.keys(w));
ok(!w.yes24used && !w.bunjang && !w.joongna && !w.daangn && !w.abebooks && !w.ridi && !w.lib, '원래 500 아래(예스24 중고·번개·중고나라·당근·AbeBooks·리디·정보나루)는 3배 그대로', e1.rec.keep3x);
ok(e1.rec.keep3x.bunjang === 400 && e1.rec.keep3x.lib === 450, '표시에 3배 그대로 둔 출처와 원래 값을 남김', e1.rec.keep3x);
ok(!w.naver && !w.ttb, '끝난 서비스(네이버·TTB) 그대로');
ok(e1.rec.from.kyobo === 1500 && e1.rec.to.kyobo === 1000, '표시에 3배 값(from)·2배 값(to) 남김 — 되돌릴 때 from', e1.rec);
ok(K.planExt({ src: { kyobo: { cap: 700 } } }, M3).write === null, '사람이 더 낮춰 둔 값은 그대로');
ok(K.planExt({ src: { kyobo: { cap: 1500 }, ridi: { cap: 900 } } }, {}).write.src.kyobo.cap === 1000 && !K.planExt({ src: { ridi: { cap: 900 } } }, {}).write, '표시가 없어도 원래 코드 값으로 같은 판단');
const t0 = Date.parse('2026-11-18T08:00:00Z');
const g1 = K.planC2({ v: { 'pace.dayCap': 4800, 'alcfg.dayCap': 900, 'logger.dayCap': 800, 'pace.minGapMs': 5000 }, at: t0 + 10, log: [{ k: 'x' }], other: 1 }, M3, t0);
ok(g1.write.v['pace.dayCap'] === 3200, '번외 공통 알라딘 화면 원래 1,600(큼) 4,800 → 3,200', g1.write.v);
ok(g1.write.v['alcfg.dayCap'] === 900 && g1.rec.keep3x['alcfg.dayCap'] === 300, '샵매니저 읽기 원래 300(작음) → 900 그대로', g1.rec);
ok(g1.write.v['logger.dayCap'] === 800 && g1.write.v['pace.minGapMs'] === 5000 && g1.write.other === 1, '로거 몫(테더링 바닥)·다른 값·칸 그대로', g1.write);
ok(g1.write.log.length === 2 && g1.write.log[0].k === 'pace.dayCap' && g1.write.log[0].from && g1.write.log[0].to && g1.write.log[0].by && g1.write.at === t0 + 11, '웹앱 c2CfgWrite와 같은 꼴(log 한 줄 더함 · at은 앞보다 큼 · by)', g1.write.log);
ok(K.planC2({ v: { 'pace.dayCap': 2000 } }, M3, t0).write === null, '사람이 더 낮춰 둔 값은 그대로');
ok(K.planC2({}, M3, t0).write === null, '설정 칸이 없으면 쓰지 않음(번외 코드 기본값은 그대로 1,600)');
const blk = lineOf(CL, /const \[m, m3, d\] = await Promise\.all\(\[tx\.get\(mref\), tx\.get\(m3ref\), tx\.get\(ref\)\]\)/);
ok(blk && /\)\[part\]\) return null/.test(blk), '표시를 같은 거래 안에서 읽음(인스턴스 여럿이어도 한 번만)');
ok(/doc\('cap2x_1118'\)/.test(CL) && /setTimeout\(\(\) => \{ cap2xOnce\(\)/.test(CL), '켤 때 한 번 · 표시 문서 app_settings/cap2x_1118');
ok(/doc\('cap3x_1118'\)/.test(CL) && !/cap3x_1118'\)\.delete/.test(CL), 'cap3x 표시는 지우지 않음');

console.log('④ 하루 알라딘 몫 합');
const alDay = 8000 + (+(lineOf(CL, /^const MET_DEF/).match(/dayCap: (\d+)/) || [])[1]) * D.metReq + D.dayCap;
ok(alDay === 15200, '책 정보 알라딘 8,000 + 시장 지표 2,000×3 + 판본 엔진 1,200 = 15,200(원래 7,600 · 3배 22,800)', alDay);

console.log(bad ? `❌ tCAP2X1118: ${bad}개 실패` : '✓ tCAP2X1118: 모두 통과'); process.exit(bad ? 1 : 0);
