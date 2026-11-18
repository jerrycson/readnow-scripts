// tCAP3X1118 — (11/18 일꾼 cap3x · 정범님 노트 「하루 몫 600쪽을 3배 · 그중 일부를 판본 엔진에 · 모든 수집기 몫 3배」)
//   ① 판본 엔진 몫(edCapOf) — 바닥 1,800 · 빌림 끝 7,200 · 막힘 1번이면 막힘 바닥 600 · 2번 넘으면 그 절반 · 설정으로 바꿈(ed_cfg.blkCap)
//   ② 코드 기본값 3배(클라우드 새책 찾기·가게 읽기·시장 지표·날씨 · 책 정보 출처별 · 외부 정보 공용 파일 · 예스24 하루 · 벤치마킹 한 번 몫)
//   ③ 한 번만 설정 문서 3배(cloud/cap3x.js) — 올리기만 · 공식 쿼터까지 · 끝난 서비스 그대로 · 번외 로거 몫 그대로 · 거래 안에서 표시를 읽어 두 번 안 함
//   ④ 바닥(틈·쉼·밤·막힘 멈춤)은 그대로
// 실행: node src/tests/tCAP3X1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const R = path.resolve(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(R, 'cloud', 'index.js'), 'utf8');
const lineOf = (S, re) => (S.split('\n').find((x) => re.test(x)) || '');

console.log('① 판본 엔진 몫');
const ED = require(path.join(R, 'cloud', 'edition.js')); const edCapOf = ED._t.edCapOf;
ok(ED.ED_DEF.dayCap === 1800 && ED.ED_DEF.capMax === 7200 && ED.ED_DEF.blkCap === 600 && ED.ED_DEF.rrRes === 300, '기본값 바닥 1,800 · 빌림 끝 7,200 · 막힘 바닥 600 · 다시 보기 몫 300', ED.ED_DEF);
const full = [{ k: 'bk', used: 12000, cap: 12000 }, { k: 'met', used: 9000, cap: 9000 }];
const a = edCapOf({ base: 1800, capMax: 7200, blkCap: 600, frac: 0.99, others: full });
ok(a.cap === 1800, '남는 몫이 없어도 바닥 1,800', a);
const b = edCapOf({ base: 1800, capMax: 7200, blkCap: 600, frac: 0.5, others: [{ k: 'bk', used: 2000, cap: 12000 }, { k: 'met', used: 0, cap: 9000 }] });
ok(b.cap > 1800 && b.cap <= 7200, '남는 몫이 있으면 1,800보다 많이(7,200까지)', b);
const c1 = edCapOf({ base: 1800, capMax: 7200, blkCap: 600, frac: 0.5, others: full, edBlocks: 1 });
ok(c1.cap === 600, '오늘 막힘 1번 → 막힘 바닥 600', c1);
const c2 = edCapOf({ base: 1800, capMax: 7200, blkCap: 600, frac: 0.5, others: full, edBlocks: 2 });
ok(c2.cap === 300, '오늘 막힘 2번 → 300', c2);
const c3 = edCapOf({ base: 1800, capMax: 7200, frac: 0.5, others: full, alBlk: true });
ok(c3.cap === 1800, '막힘 바닥을 안 주면(옛 설정) 바닥 그대로', c3);
const c4 = edCapOf({ base: 1800, capMax: 7200, blkCap: 900, frac: 0.5, others: full, alBlk: true });
ok(c4.cap === 900, '설정 ed_cfg.blkCap 900이면 900', c4);
const EDS = fs.readFileSync(path.join(R, 'cloud', 'edition.js'), 'utf8');
ok(/blkCap: c\.blkCap/.test(EDS), '회차가 설정 blkCap을 넘김');

console.log('② 코드 기본값 3배');
ok(/const NB_DEF = \{ on: true, dayCap: 180,/.test(CL), '새책 찾기 60 → 180');
ok(/const SSH_DEF = \{ cap: 450,/.test(CL), '가게 읽기 150 → 450');
ok(/dayCap: 3000, sliceSec: 50/.test(lineOf(CL, /^const MET_DEF/)), '클라우드 시장 지표 1,000 → 3,000권');
ok(/perDay: 120/.test(lineOf(CL, /^const WX_DEF/)), '날씨 묶음 40 → 120');
ok(/: 12000; const bkOff/.test(lineOf(CL, /^function edAlUse/)), '판본 엔진이 보는 책 정보 알라딘 기본 몫 12,000');
const BK = fs.readFileSync(path.join(R, 'cloud', 'bookinfo.js'), 'utf8');
const pd = lineOf(BK, /const PACE_DEF/);
for (const [k, n] of [['yes24', 27000], ['nl', 18000], ['kyobo', 9000], ['aladin', 12000], ['render', 3600], ['pvimg', 36000]]) ok(new RegExp(k + ': \\{[^}]*cap: ' + n + '\\b').test(pd), '책 정보 ' + k + ' ' + n);
const X = require(path.join(R, 'readnow-ext-core.js'));
const S = X.SOURCES || (X.api && X.api.SOURCES);
if (S) { const want = { kyobo: 1500, yes24: 1500, nl: 9000, google: 1000, kakao: 30000, ebay: 5000, lib: 500, joongmo: 1800, dvdprime: 600, ridi: 900 }; for (const [k, n] of Object.entries(want)) ok(S[k] && S[k].cap === n, '외부 정보 ' + k + ' ' + n, S[k] && S[k].cap); }
else { const xs = fs.readFileSync(path.join(R, 'readnow-ext-core.js'), 'utf8'); ok(/kyobo: \{[^\n]*cap: 1500/.test(xs) && /kakao: \{[^\n]*cap: 30000/.test(xs) && /google: \{[^\n]*cap: 1000,/.test(xs), '외부 정보 출처 상한(글자로 확인)'); }
const xs = fs.readFileSync(path.join(R, 'readnow-ext-core.js'), 'utf8');
ok(/const Y24_PACE = \{ min: 4000, max: 8000, cap: 360, stopH: 6 \}/.test(xs), '예스24 하루 120 → 360 · 4~8초·6시간 멈춤 그대로');
const RG = fs.readFileSync(path.join(R, 'readnow-registry.js'), 'utf8');
ok(/const BENCH_DETAIL_DEF = \{ max: 900, maxMin: 30 \}/.test(RG), '벤치마킹 한 번 상품 페이지 300 → 900 · 30분 그대로');

console.log('③ 한 번만 설정 문서 3배(cloud/cap3x.js)');
const K = require(path.join(R, 'cloud', 'cap3x.js'));
const n1 = K.planNb({ cfg: { dayCap: 120, gapMin: 2000, nightFrom: 1 } });
ok(n1.write && n1.write.cfg.dayCap === 360 && Object.keys(n1.write.cfg).length === 1 && n1.rec.from === 120, '새책 찾기 120 → 360(다른 칸 안 건드림)', n1);
ok(K.planNb({}).write === null, '설정 칸이 없으면 쓰지 않음');
const e1 = K.planExt({ src: { kyobo: { cap: 500, on: true, refreshDays: 120 }, google: { cap: 900 }, kakao: { cap: 25000 }, naver: { cap: 5000 }, ttb: { cap: 4500 }, lib: { cap: 450 }, nl: { cap: 9500 } } });
ok(e1.write.src.kyobo.cap === 1500 && Object.keys(e1.write.src.kyobo).length === 1, '교보 500 → 1,500(켜짐·새로 읽기 날 그대로)', e1);
ok(e1.write.src.google.cap === 1000 && e1.write.src.kakao.cap === 30000 && e1.write.src.lib.cap === 500, '공식 쿼터가 있는 출처는 쿼터까지', e1.write.src);
ok(!e1.write.src.naver && !e1.write.src.ttb, '끝난 서비스(네이버·TTB) 그대로');
ok(!e1.write.src.nl, '이미 목표보다 크면 내리지 않음');
const t0 = Date.parse('2026-11-18T05:00:00Z');
const g1 = K.planC2(null, t0);
ok(g1.write.v['pace.dayCap'] === 4800 && g1.write.v['alcfg.dayCap'] === 900, '번외 공통 알라딘 화면 1,600 → 4,800 · 샵매니저 300 → 900', g1.write.v);
ok(!('logger.dayCap' in g1.write.v), '로거 몫(테더링 바닥)은 그대로');
ok(g1.write.log.length === 2 && g1.write.log[0].from && g1.write.log[0].to && g1.write.log[0].by && g1.write.at === t0, '웹앱 c2CfgWrite와 같은 꼴(log 줄 · at · by)', g1.write.log);
const g2 = K.planC2({ v: { 'pace.dayCap': 2000, 'pace.minGapMs': 5000 }, at: t0 + 10, log: [{ k: 'x' }], other: 1 }, t0);
ok(g2.write.v['pace.dayCap'] === 6000 && g2.write.v['pace.minGapMs'] === 5000 && g2.write.at === t0 + 11 && g2.write.other === 1 && g2.write.log.length === 3, '바꾼 값 ×3 · 다른 값·칸 그대로 · at은 앞보다 큼', g2.write);
const g3 = K.planC2({ v: { 'pace.dayCap': 9000, 'alcfg.dayCap': 4000 } }, t0);
ok(g3.write.v['pace.dayCap'] === 20000 && g3.write.v['alcfg.dayCap'] === 5000, '설정 칸 위 끝(20,000 · 5,000)을 넘지 않음', g3.write.v);
const blk = lineOf(CL, /const \[m, d\] = await Promise\.all\(\[tx\.get\(mref\), tx\.get\(ref\)\]\)/);
ok(blk && /\)\[part\]\) return null/.test(blk), '표시를 같은 거래 안에서 읽음(인스턴스 여럿이어도 한 번만)');
ok(/doc\('cap3x_1118'\)/.test(CL) && /setTimeout\(\(\) => \{ cap3xOnce\(\)/.test(CL), '켤 때 한 번 · 표시 문서 app_settings/cap3x_1118');

console.log('④ 바닥 그대로');
ok(/gapMin: 4000, gapMax: 9000/.test(lineOf(CL, /^const NB_DEF/)) && /nightFrom: 23, nightTo: 8/.test(lineOf(CL, /^const NB_DEF/)), '새책 찾기 틈·밤 쉼 기본 그대로');
ok(/gapMin: 1200, gapMax: 2000, inMin: 700, inMax: 1300/.test(lineOf(CL, /^const MET_DEF/)), '시장 지표 틈 그대로');
ok(/night: \['01:00', '07:00'\]/.test(lineOf(CL, /^const SSH_DEF/)), '가게 읽기 밤 쉼 그대로');

console.log(bad ? `❌ tCAP3X1118: ${bad}개 실패` : '✓ tCAP3X1118: 모두 통과'); process.exit(bad ? 1 : 0);
