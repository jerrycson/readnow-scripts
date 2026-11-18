// tEDKW1117 — (정범님 11/17 14:00 I-1117-1400-12 · edkw1) 🔖 판본 키워드 16개·괄호 상품은 검색으로 같은 판본을 찾아 대조 · 키워드 없는 후보는 다른 상품 · 검색 시장 우선 · 비슷한 후보 둘이면 사람 확인
// 쓰는 법: node tEDKW1117.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const load = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = load('readnow-products-core.js'), PR = load('readnow-pricing-core.js');

console.log('① 판본 낱말 16개 한 곳');
const W16 = ['한정', '특별', '특전', '특장', '기념', '주년', '리커버', '초판', '초회', '교보', '알라딘', '예스24', '밀리의', '인터파크', '텀블벅', '펀딩'];
ok(Array.isArray(P.ED_KW) && P.ED_KW.length === 16 && W16.every((w) => P.ED_KW.includes(w)), '상품 공용 ED_KW = 정범님 16개');
const sk = (PR.DEFAULTS && PR.DEFAULTS.specialKeywords) || PR.specialKeywords || (rd('readnow-pricing-core.js').match(/specialKeywords:\s*\[([^\]]*)\]/) || [])[1] || '';
ok(W16.every((w) => String(sk).includes(w)), '가격 판정 엔진 specialKeywords 기본값에 16개 모두');

console.log('② 의심 판정 — 낱말·괄호 · 분류 꼬리표는 괄호로 안 셈');
const T1 = '아내를 모자로 착각한 남자 (교보 리커버 한정판)';
const s1 = P.edSuspect(T1); ok(s1.on && ['교보', '리커버', '한정'].every((k) => s1.kw.includes(k)), '교보 리커버 한정판 → 낱말 셋');
ok(P.edSuspect('[블루레이] 어떤 영화').on === false, '[블루레이] 꼬리표만 → 의심 아님');
ok(P.edSuspect('[중고-상] [국내도서] 어떤 책').on === false, '[중고-상] [국내도서] 꼬리표만 → 의심 아님');
ok(P.edSuspect('어떤 책 (나의 부제)').on === true && P.edSuspect('어떤 책 (나의 부제)').kw.length === 0, '괄호만 있는 상품 → 의심(낱말 없음) — (0.19.11) 양장은 판본 낱말이 되어 부제 괄호로 바꿈');
ok(P.edSuspect('YES24 단독 어떤 책').kw.includes('예스24'), '영문 YES24 → 예스24');
ok(P.edSuspect('평범한 책 제목').on === false, '낱말·괄호 없으면 의심 아님');
ok(P.edSuspect('텀블벅 펀딩 굿즈 포함').kw.length === 2, '텀블벅·펀딩 둘');

console.log('③ 같은 판본 대조 — 우리 낱말이 후보에 없으면 다른 상품');
const m1 = P.edMatch(T1, '아내를 모자로 착각한 남자 (레드 스페셜 에디션)'); ok(!m1.ok && m1.miss.length === 3, '레드 스페셜 에디션 → 빠진 낱말 셋 · 다른 상품');
const m2 = P.edMatch(T1, '아내를 모자로 착각한 남자 (교보문고 리커버 한정판)'); ok(m2.ok && m2.sim > 0.6, '교보문고 리커버 한정판 → 같은 판본 · 닮음 ' + m2.sim);
const m3 = P.edMatch('어떤 책', '어떤 책 (리커버 한정판)'); ok(!m3.ok && m3.extra.length === 2, '우리에게 없는 낱말이 후보에만 → 다른 상품');
const m4 = P.edMatch(T1, '아내를 모자로 착각한 남자 (교보 리커버 한정판) 세트'); ok(!m4.ok && m4.setDiff && m4.miss.length === 0, '낱말이 같아도 세트 ↔ 낱권이면 다른 상품');

console.log('④ 어느 시장을 쓸지');
const our = { title: T1, bookId: 'bk_267003491', bookTitle: '아내를 모자로 착각한 남자 (레드 스페셜 에디션)' };
let d = P.edDecide(our, null); ok(d.use === 'check' && d.hold === true, '검색 전 · 자동 지표 상품 낱말 다름 → 사람 확인 · 가격 안 바꿈');
const C = (id, t, cov = 1) => ({ itemId: id, title: t, cov, vol: true });
d = P.edDecide(our, { src: 'usedSearch', at: 'x', cands: [C('267003491', '아내를 모자로 착각한 남자 (레드 스페셜 에디션)'), C('300', '아내를 모자로 착각한 남자 (교보문고 리커버 한정판)')] });
ok(d.use === 'srch' && d.ids.length === 1 && d.ids[0] === '300' && d.cut === 1, '검색에 같은 판본 하나 → 검색 시장 우선(300) · 다른 판 1개 뺌');
d = P.edDecide(our, { src: 'usedSearch', cands: [C('300', '아내를 모자로 착각한 남자 (교보 리커버 한정판)'), C('301', '아내를 모자로 착각한 남자 (교보 리커버 한정판)')] });
ok(d.use === 'check' && d.hold === true && d.alt, '비슷한 같은 판본 후보 둘 → 바꾸지 않고 사람 확인');
const our2 = { title: '어떤 책 (리커버 한정판)', bookId: 'bk_11', bookTitle: '어떤 책 (리커버 한정판)' };
d = P.edDecide(our2, { src: 'usedSearch', cands: [C('11', '어떤 책 (리커버 한정판)'), C('12', '어떤 책')] }); ok(d.use === 'auto' && d.pick && d.pick.self, '검색 1위 = 자동 지표 상품 → 자동 지표 그대로(확인됨)');
d = P.edDecide(our2, { src: 'usedSearch', cands: [C('12', '어떤 책')] }); ok(d.use === 'auto' && !d.hold, '같은 판본이 검색에 없음 + 자동 지표 상품 낱말 같음 → 자동 지표 그대로');
d = P.edDecide({ title: '어떤 책 (리커버 한정판)', unreg: true }, { src: 'usedSearch', cands: [C('11', '어떤 책 (리커버 한정판)'), C('12', '어떤 책')] }); ok(d.use === 'srch' && d.ids.join() === '11', '미등록 → 같은 판본 후보만 시장으로');
d = P.edDecide({ title: '어떤 책 (리커버 한정판)', unreg: true }, { src: 'usedSearch', cands: [C('12', '어떤 책')] }); ok(d.use === 'none', '미등록 + 같은 판본 없음 → none');
d = P.edDecide({ title: '평범한 책', bookId: 'bk_1' }, null); ok(d.on === false && d.use === null, '의심 아닌 상품 → 판정 안 함');
d = P.edDecide(our2, { src: 'usedSearch', cands: [C('13', '어떤 책 (리커버 한정판)', 0.5)] }); ok(d.use === 'auto' && d.good === 0, '이름 겹침(cov) 모자란 후보는 같은 판본으로 안 셈');

console.log('⑤ 수집기·가격 감시기·웹앱에 이어짐');
const col = rd('src/readnow-collector.src.js'); const a = col.indexOf('async function nbMarketJob() {'); const body = col.slice(a, a + 40000);
ok(a > 0 && /function nbEdJudge\(/.test(body) && /P\.edDecide/.test(body), '수집기 검색 시세 일 안에 판본 판정(nbEdJudge·edDecide) — 번외 수집기가 함수 글자 그대로 가져가도 됨');
ok(/edHist/.test(body) && /ed: ed \|\| null/.test(body), '수집기 — 판정 결과·바뀜 기록 저장');
ok(/main\.edSearch|edSearch !== false|edSearch === false/.test(body), '수집기 — ⚙ 스위치(app_settings/main.edSearch) 따름');
const pw = rd('readnow-price-watch.user.js'); ok(/async function edBlockOf\(/.test(pw) && /rec\.ed = ED/.test(pw), '가격 감시기 — 판본 의심 상품 자동 반영 막음');
ok(/approvalState: 'pending', approval: null/.test(pw.slice(pw.indexOf('const ED = await edBlockOf'))), '가격 감시기 — 이번에 저절로 승인된 것만 대기로 되돌림');
const app = rd('src/app.html');
ok(/const edOf = \(l\) =>/.test(app) && /function edCard\(l\)/.test(app) && /ED_USE_KO/.test(app), '웹앱 — 판본 판정 읽기·상세 카드');
ok(/id="st_edsrch"/.test(app) && /id="st_obskw_edadd"/.test(app), '웹앱 ⚙ ⑮ — 스위치·빠진 낱말 더하기 단추');
ok(/'🔖 판본 확인 필요/.test(app) || /🔖 판본 확인 필요/.test(app), '웹앱 일괄 계산 — 사람 확인이면 목표가 없음');
ok(/obsSpecialKw:[^\n]*주년/.test(app), '웹앱 ⑮ 기본값에 주년');
ok(!/\balert\(|\bconfirm\(/.test(app.slice(app.indexOf('function edCard(l)'), app.indexOf('function edCard(l)') + 4000)), '판본 카드에 브라우저 팝업 없음');

console.log('⑥ 판 고정');
const reg = rd('readnow-registry.js'); const pin = (f) => (reg.match(new RegExp(`'${f.replace(/\./g, '\\.')}': '([\\d.]+)'`)) || [])[1];
const ver = (f) => (rd(f).match(/VERSION\s*=\s*'([\d.]+)'/) || [])[1];
ok(pin('readnow-products-core.js') === ver('readnow-products-core.js') && pin('readnow-pricing-core.js') === ver('readnow-pricing-core.js'), '등록부 판 = 공용 파일 판');
ok(rd('cloud/readnow-registry.js') === reg, '클라우드 등록부 사본 같음');
ok(/q\.edkw/.test(rd('cloud/index.js')), '클라우드 진단 edkw(읽기만)');

console.log(bad ? `❌ ${bad}/${n} 실패` : `✓ ${n}개 모두 통과`); process.exit(bad ? 1 : 0);
