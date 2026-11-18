// tCAP2X1118 — (11/18 일꾼 cap2x · 정범님 16:24 「알라딘 부르는 횟수가 이렇게 비약적으로 많으면 두 배까지만 늘려」)
//   ① 판본 엔진 몫(edCapOf) — 바닥 1,200 · 빌림 끝 4,800 · 막힘 1번이면 막힘 바닥 600 · 2번 넘으면 300 · 다시 보기 몫 300
//   ② 코드 기본값 = 원래의 2배(클라우드 새책 찾기·가게 읽기·시장 지표·날씨 · 책 정보 출처별 · 외부 정보 공용 파일 · 예스24 하루 · 벤치마킹 한 번 몫)
//   ③ 한 번만 설정 문서 2배로 낮춤(cloud/cap2x.js) — 내리기만 · 목표 = cap3x 표시 from × 2(공식 쿼터까지) · 끝난 서비스·로거 몫 그대로 · 거래 안에서 표시를 읽어 두 번 안 함 · cap3x 표시는 그대로
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

console.log('② 코드 기본값 = 원래의 2배');
ok(/const NB_DEF = \{ on: true, dayCap: 120,/.test(CL), '새책 찾기 60 → 120');
ok(/const SSH_DEF = \{ cap: 300,/.test(CL), '가게 읽기 150 → 300');
ok(/dayCap: 2000, sliceSec: 50/.test(lineOf(CL, /^const MET_DEF/)), '클라우드 시장 지표 1,000 → 2,000권');
ok(/perDay: 80,/.test(lineOf(CL, /^const WX_DEF/)), '날씨 묶음 40 → 80');
ok(/: 8000; const bkOff/.test(lineOf(CL, /^function edAlUse/)), '판본 엔진이 보는 책 정보 알라딘 기본 몫 8,000');
const BK = fs.readFileSync(path.join(R, 'cloud', 'bookinfo.js'), 'utf8');
const pd = lineOf(BK, /^const PACE_DEF/);
for (const [k, n] of [['yes24', 18000], ['nl', 12000], ['kyobo', 6000], ['aladin', 8000], ['render', 2400], ['pvimg', 24000]]) ok(new RegExp(k + ': \\{[^}]*cap: ' + n + ' \\}').test(pd), '책 정보 ' + k + ' ' + n);
ok(/const cap = o\.cap == null \? 2400 : \+o\.cap;/.test(BK) && /pvCap: c\.pvCap == null \? 2400 : \+c\.pvCap/.test(BK), '미리보기 그림 하루 1,200 → 2,400(두 곳)');
const xs = fs.readFileSync(path.join(R, 'readnow-ext-core.js'), 'utf8');
const want = { kyobo: 1000, naverbook: 800, yes24: 1000, google: 1000, kakao: 30000, nl: 6000, joongmo: 1200, yes24used: 800, bunjang: 800, joongna: 600, daangn: 600, dvdprime: 400, ebay: 5000, abebooks: 400, lib: 500, ridi: 600 };
for (const [k, n] of Object.entries(want)) ok(new RegExp('\\n    ' + k + ': \\{[^\\n]*cap: ' + n + ',').test(xs), '외부 정보 ' + k + ' ' + n);
ok(/const Y24_PACE = \{ min: 4000, max: 8000, cap: 240, stopH: 6 \}/.test(xs), '예스24 하루 120 → 240 · 4~8초·6시간 멈춤 그대로');
const RG = fs.readFileSync(path.join(R, 'readnow-registry.js'), 'utf8');
ok(/const BENCH_DETAIL_DEF = \{ max: 600, maxMin: 30 \}/.test(RG), '벤치마킹 한 번 상품 페이지 300 → 600 · 30분 그대로');

console.log('③ 한 번만 설정 문서 2배로 낮춤(cloud/cap2x.js)');
const K = require(path.join(R, 'cloud', 'cap2x.js'));
/* 운영 cap3x 표시(11/18 07:29Z 진단으로 본 from 값과 같은 꼴 · 손님 정보 없음) */
const M3 = { nb: { from: 120, to: 360 }, ext: { from: { abebooks: 200, bunjang: 400, lib: 450, yes24used: 400, ridi: 300, google: 900, yes24: 500, kakao: 25000, kyobo: 500, daangn: 300, joongna: 300, ebay: 4000, nl: 3000 } }, c2: { from: { 'pace.dayCap': 1600, 'alcfg.dayCap': 300 } } };
const n1 = K.planNb({ cfg: { dayCap: 360, gapMin: 2000, maxRead: 20 } }, M3);
ok(n1.write && n1.write.cfg.dayCap === 240 && Object.keys(n1.write.cfg).length === 1 && n1.rec.from === 360 && n1.rec.to === 240, '새책 찾기 360 → 240(다른 칸 안 건드림)', n1);
ok(K.planNb({ cfg: { dayCap: 100 } }, M3).write === null, '사람이 더 낮춰 둔 값(100)은 올리지 않음');
ok(K.planNb({}, M3).write === null, '설정 칸이 없으면 쓰지 않음(코드 기본값이 이미 2배)');
ok(K.planNb({ cfg: { dayCap: 360 } }, {}).write.cfg.dayCap === 240, '표시가 없어도 기본 목표 240');
const src3 = { kyobo: { cap: 1500, on: true, refreshDays: 120 }, yes24: { cap: 1500 }, yes24used: { cap: 1200 }, bunjang: { cap: 1200 }, joongna: { cap: 900 }, daangn: { cap: 900 }, abebooks: { cap: 600 }, ridi: { cap: 900 }, nl: { cap: 9000 }, google: { cap: 1000 }, kakao: { cap: 30000 }, ebay: { cap: 5000 }, lib: { cap: 500 }, naver: { cap: 5000 }, ttb: { cap: 4500 } };
const e1 = K.planExt({ src: src3 }, M3); const w = e1.write.src;
ok(w.kyobo.cap === 1000 && Object.keys(w.kyobo).length === 1, '교보 1,500 → 1,000(켜짐·새로 읽기 날 그대로)', w.kyobo);
ok(w.yes24.cap === 1000 && w.yes24used.cap === 800 && w.bunjang.cap === 800 && w.joongna.cap === 600 && w.daangn.cap === 600 && w.abebooks.cap === 400 && w.ridi.cap === 600 && w.nl.cap === 6000, '출처별 원래 × 2', w);
ok(!w.google && !w.kakao && !w.ebay && !w.lib, '공식 쿼터 출처(구글·카카오·eBay·정보나루)는 2배가 쿼터 이상이라 그대로', w);
ok(!w.naver && !w.ttb, '끝난 서비스(네이버·TTB) 그대로');
ok(e1.rec.from.kyobo === 1500 && e1.rec.to.kyobo === 1000, '표시에 3배 값(from)·2배 값(to) 남김 — 되돌릴 때 from', e1.rec);
ok(K.planExt({ src: { kyobo: { cap: 700 } } }, M3).write === null, '사람이 더 낮춰 둔 값은 그대로');
ok(K.planExt({ src: { kyobo: { cap: 1500 } } }, {}).write.src.kyobo.cap === 1000, '표시가 없어도 기본 목표');
const t0 = Date.parse('2026-11-18T08:00:00Z');
const g1 = K.planC2({ v: { 'pace.dayCap': 4800, 'alcfg.dayCap': 900, 'logger.dayCap': 800, 'pace.minGapMs': 5000 }, at: t0 + 10, log: [{ k: 'x' }], other: 1 }, M3, t0);
ok(g1.write.v['pace.dayCap'] === 3200 && g1.write.v['alcfg.dayCap'] === 600, '번외 공통 알라딘 화면 4,800 → 3,200 · 샵매니저 900 → 600', g1.write.v);
ok(g1.write.v['logger.dayCap'] === 800 && g1.write.v['pace.minGapMs'] === 5000 && g1.write.other === 1, '로거 몫(테더링 바닥)·다른 값·칸 그대로', g1.write);
ok(g1.write.log.length === 3 && g1.write.log[0].from && g1.write.log[0].to && g1.write.log[0].by && g1.write.at === t0 + 11, '웹앱 c2CfgWrite와 같은 꼴(log 줄 · at은 앞보다 큼 · by)', g1.write.log);
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
