// tSELLEARN — 11/11 일꾼 sell1 · 정범님 11/11 저녁 '판매자 추적: 여러 조건 동시·충돌 순서 · 매출 상위 판매자 배우기(롤모델) · 숍 앞 페이지 연구'
//  ① 판정 조건: 모두/하나라도 · 충돌 때 순서 앞이 이김 · ↑↓·끌어 옮기기 · 블랙리스트 고객과 허위 매물 판매자는 다른 것(약속 52 — 고객 표시를 읽지 않음)
//  ② 롤모델: 허위·추격 무시·평점·취소율로 거름 · 주력(분야·가격대·신간·등록 주기) · 따라 하기 제안(제안만)
//  ③ 앞 페이지: 앞 쪽에 있는 동안 팔린 몫 ÷ 노출 몫 · 판매자 사이 상관 · 우리 숍 나이 맞춤
//  ④ 연결: 클라우드 sellerLearnStudy(매일 · 알라딘을 새로 읽지 않음) · 진단 slearn · 웹앱 칸·바로 가기 · 브라우저 팝업 없음
// 시험 자료에 손님 정보 없음(꾸민 판매자 번호·값만) · 실행: node src/tests/tSELLEARN.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SL = require(find(['../readnow-sellerlearn-core.js', '../../readnow-sellerlearn-core.js']));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js']), 'utf8');
const APP = fs.readFileSync(find(['../app.html', '../../src/app.html']), 'utf8');

console.log('① 판정 조건 여러 개 · 충돌 순서');
{ const f = { fake: true, role: true, cancel: 0.002, rating: 0.995 };
  const j1 = SL.judge(f, ['fake', 'role', 'goodShip'], SL.DEFAULT_ORDER); ok(j1.top === 'fake' && j1.v === 'avoid' && j1.conflict && j1.lost.includes('role') && j1.lost.includes('goodShip'), '처음 순서: 배척(허위)이 배움을 이김 · 충돌 표시', j1);
  const o2 = SL.dragKey(SL.DEFAULT_ORDER, 'role', 0); const j2 = SL.judge(f, ['fake', 'role'], o2); ok(o2[0] === 'role' && j2.top === 'role' && j2.v === 'learn' && j2.conflict, '롤모델을 맨 앞으로 끌면 배움이 이김', j2);
  const o3 = SL.moveKey(SL.DEFAULT_ORDER, 'ignore', -1); ok(o3[0] === 'ignore' && o3[1] === 'fake' && o3.length === SL.CONDS.length, '↑ 한 칸 옮김');
  ok(SL.moveKey(SL.DEFAULT_ORDER, 'fake', -1)[0] === 'fake', '맨 위에서 ↑는 그대로');
  ok(SL.normOrder(['role', 'zzz', 'role']).length === SL.CONDS.length && SL.normOrder(['role'])[0] === 'role', '모르는 열쇠·겹친 열쇠는 거르고 빠진 조건은 뒤에 붙임');
  ok(SL.pass(f, ['fake', 'role'], 'and') && !SL.pass({ fake: true }, ['fake', 'role'], 'and') && SL.pass({ fake: true }, ['fake', 'role'], 'or') && SL.pass({}, [], 'and'), '모두/하나라도 · 조건 없으면 모두 지나감');
  ok(!SL.condHit('fake', { blacklist: true, flags: { blacklist: { on: true } } }), '고객 블랙리스트 표시는 허위 매물 판매자로 보지 않음(약속 52)');
  ok(SL.condHit('cancelHi', { cancel: 0.06 }) && !SL.condHit('cancelHi', { cancel: null }) && SL.condHit('rateLo', { rating: 0.96 }), '모르는 값은 걸리지 않음'); }

const mkRuns = (sc, o) => { const R = []; let d0 = Date.UTC(2026, 9, 1); for (let i = 0; i < 20; i++) { const day = new Date(d0 + i * 864e5).toISOString().slice(0, 10); const first = new Date(d0 + (i - 2) * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const gone = []; for (let k = 0; k < o.sold; k++) gone.push(JSON.stringify([`g${i}_${k}`, '책', o.price + k * 10, '최상', k % 5 === 0 ? null : k % 3 === 0 ? 1 : 10, k % 2 ? first : new Date(d0 + (i - 40) * 864e5).toISOString().slice(0, 10).replace(/-/g, ''), 0, '97900000' + k, k % 4 ? '국내도서>소설/시/희곡>한국소설' : '국내도서>유아>그림책', k % 2 ? '202608' : '201901']));
  const add = []; for (let k = 0; k < Math.min(o.add, 50); k++) add.push(JSON.stringify([`a${i}_${k}`, '책', o.price, '상', '202601', null, 15000, 0, '국내도서>유아>그림책']));
  R.push({ sc, day, spanDays: 1, complete: true, full: true, total: o.stock, add: o.add, goneNew: o.sold, sumGoneNew: o.sold * o.price, goneList: gone, addList: add }); } R.push({ sc, day: '2026-09-30', base: true, total: o.stock }); return R; };

console.log('② 주력·롤모델·따라 하기');
{ const p = SL.profile(mkRuns('1', { sold: 30, add: 40, stock: 20000, price: 12000 }), { '979000000': { sp: 5000, pub: '출판사A', au: '저자A' } });
  ok(p && p.runs === 20 && p.soldPerDay === 30 && p.addPerDay === 40 && p.revPerDay > 300000, '첫 바퀴는 빼고 하루 판매·등록·판매가 합', p && { runs: p.runs, s: p.soldPerDay, a: p.addPerDay, r: p.revPerDay });
  ok(p.cats[0].k === '국내도서>소설/시/희곡' && Math.abs(p.cats[0].s - 0.7333) < 0.01 && p.cats.find((c) => c.k === '국내도서>유아').addS === 1, '분야 = 팔린 몫(앞 두 칸) · 새로 올린 몫 함께', p.cats);
  ok(p.years.new12 > 0 && p.years.old > 0 && p.spMed === 5000 && p.pubs[0].k === '출판사A', '신간 몫·SP·출판사(찾은 책만)');
  const list = [{ sc: '1', name: '가', p, f: { rating: 0.99, cancel: 0.01 } }, { sc: '2', name: '나', p: { ...p, revPerDay: p.revPerDay * 2 }, f: { fake: true } }, { sc: '3', name: '다', p: { ...p, revPerDay: p.revPerDay * 1.5 }, f: { rating: 0.95 } }, { sc: '4', name: '라', p: { ...p, revPerDay: 10 }, f: {} }];
  const rr = SL.roleRank(list, { by: 'rev' }); ok(rr.pick[0].sc === '1' && !rr.out.find((x) => x.sc === '2').ok && !rr.out.find((x) => x.sc === '3').ok && rr.out.find((x) => x.sc === '2').why[0].includes('허위'), '매출 1·2위라도 허위·평점 낮음은 롤모델에서 뺌(까닭 글)', rr.out);
  ok(rr.pick.find((x) => x.sc === '4').unknown.length === 2, '모르는 평점·취소율은 표시');
  const tips = SL.followPlan(p, { cats: { '국내도서>소설/시/희곡': 0.2 }, bands: { '1~2만': 0.1 }, new12S: 0.05, addPerDay: 10, priceMed: 8000, spMed: 1000 });
  ok(tips.some((t) => t.kind === 'buy' && t.k === '국내도서>소설/시/희곡') && tips.some((t) => t.kind === 'price') && tips.some((t) => t.kind === 'reg' && /우리 하루 10/.test(t.t)) && tips.some((t) => t.k === 'sp'), '따라 하기: 더 매입할 분야·가격대·등록 방식·SP', tips.map((t) => t.t)); }

console.log('③ 앞 페이지 연구');
{ const a = SL.frontOne(mkRuns('1', { sold: 30, add: 400, stock: 20000, price: 9000 })); ok(a && a.fp === 240 && a.dwell === 0.6 && a.soldFP + a.soldOff === 600, '하루 400권 등록 = 앞 쪽에 0.6일', a);
  const b = SL.frontOne(mkRuns('2', { sold: 30, add: 10, stock: 20000, price: 9000 })); ok(b.dwell === 24 && b.soldFPs > a.soldFPs, '등록이 느리면 앞 쪽에 오래 머물러 앞 쪽 판매 몫이 큼', [a.soldFPs, b.soldFPs]);
  ok(b.lift > 1 && b.early7S != null, '앞 쪽 판매율 ÷ 뒤 쪽 판매율(배)');
  const rows = []; for (let i = 0; i < 12; i++) { const r = SL.frontOne(mkRuns(String(i), { sold: 20 + i, add: 10 + i * 30, stock: 5000 + i * 1000, price: 9000 })); rows.push(r); }
  const P = SL.frontPool(rows, 3); ok(P.n >= 10 && P.pooledLift != null && Array.isArray(P.ci) && ['높음', '보통', '낮음'].includes(P.conf) && P.spAddSell != null, '판매자 사이 묶음 · 부트스트랩 구간 · 신뢰도', P);
  { const sp = rows.map((r, i) => (i < 3 ? { ...r, spanMed: 20, runs: 3 } : r)); const Q = SL.frontPool(sp, 3); ok(Q.sparse === 3 && Q.n === P.n - 3, '몇 주에 한 번 읽은 판매자는 묶음에서 뺌(그사이 팔린 것을 못 봄)', Q); }
  ok(JSON.stringify(SL.frontPool(rows, 3)) === JSON.stringify(P), '같은 자료면 같은 구간(날마다 흔들리지 않음)');
  const day = []; for (let i = 0; i < 1000; i++) day.push({ age: i % 10, y: i < 240 ? 1 : i % 5 === 0 ? 1 : 0 }); const U = SL.ourFront([day]);
  ok(U.fpRows === 240 && U.bins[0].fpN > 0 && U.bins[0].offN > 0 && U.ageLift > 1, '우리 숍: 같은 나이 띠 안에서 앞 쪽 vs 뒤 쪽', U); }

console.log('④ 연결');
{ ok(/async function sellerLearnStudy\(force, dry\)/.test(SRC) && /C\('app_settings'\)\.doc\('seller_learn'\)/.test(SRC) && /C\('ml_seller_learn'\)/.test(SRC), '클라우드 매일 연구 → app_settings/seller_learn · 날마다 ml_seller_learn');
  const body = SRC.slice(SRC.indexOf('async function sellerLearnStudy('), SRC.indexOf('/* SELLEARN-END */')); ok(body.length > 500 && !/fetch\(|aladin\.co\.kr|shp_cmds|prd_jobs/.test(body), '알라딘을 새로 읽지 않음·PC에 일을 주지 않음(이미 모은 벤치마킹 기록만)');
  ok(/\.then\(\(\) => sellerLearnStudy\(\)\)/.test(SRC) && /if \(q\.slearn\)/.test(SRC), '3시간 묶음 끝에 붙음(20시간에 한 번) · 진단 slearn(계산만)');
  ok(/readnow-sellerlearn-core\.js\?v=/.test(APP) && /function slLearnCard\(/.test(APP) && /function slCondBar\(/.test(APP), '웹앱: 공용 파일 · 🧑‍🏫 카드 · 판정 조건 줄');
  const ui = APP.slice(APP.indexOf('/* SELLEARN-UI-START'), APP.indexOf('/* SELLEARN-UI-END */')); ok(ui.length > 500 && !/\b(alert|confirm|prompt)\(/.test(ui), '브라우저 팝업 없음(두 번 눌러 확정)');
  ok(/🧑‍🏫 배울 판매자/.test(APP.slice(APP.indexOf('const FEAT = ['), APP.indexOf('const FEAT = [') + 400000)), '기능 찾기에 바로 가기 줄'); }

console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
