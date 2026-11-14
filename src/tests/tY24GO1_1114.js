// tY24GO1_1114 — (정범님 11/14 17:15 · F42·F45) 예스24 새로 올리기: 첫 한 건도 엔진이 · 가격 규칙 ① 유효 동급 최저 ② 못 세면 알라딘 값 ③ 우리뿐 +20%
//   ① 판매가 엔진(readnow-ext-core y24PriceOf): 동급 없음(나쁜 등급만) = 알라딘 값 · 우리뿐·허위만 = +20% · 유효 동급 최저 = 그 값 · worsePct 설정
//   ② 웹앱 ◆y24reg 순수 덩어리: 설정 새 칸(firstAny·autoAll·mktWaitH) · 시장 지표를 오래 기다린 줄은 알라딘 값으로(사람 확인 안 함) · 후보 고르기(y24AutoCand)
//   ③ 웹앱 시장 지표 받기: '없음' 문서를 다시 받음(y24eNeed) · 기다림 셈(y24MktGo)
// 실행: node src/tests/tY24GO1_1114.js (공용 파일은 저장소 맨 위 또는 ../ · 웹앱은 RN_APP 또는 ../app.html) · 지어낸 자료(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const find = (n) => [path.join(__dirname, '..', '..', n), path.join(__dirname, '..', n)].find((p) => fs.existsSync(p));
const X = require(find('readnow-ext-core.js'));
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };

console.log('① 판매가 엔진');
{ const L = { alPrice: 8000, grade: '상', priceList: 15000 }; const fk = (lv) => ({ lv, p: lv === 'ok' ? 0.1 : 0.9, conf: 0.8, est: false, n: 5, tag: lv });
  const P = (rows, o) => X.y24PriceOf(L, { page1: rows, total: rows.length, full: true }, o);
  const solo = X.y24PriceOf(L, { none: true }); ok(solo.mode === 'solo' && solo.price === 9600, '③ 예스24에 이 책이 없음(우리뿐) → 알라딘 8,000 + 20% = 9,600', solo);
  const own = P([{ id: '1', p: 8000, g: '상', sid: 'me', fk: { lv: 'own' } }]); ok(own.mode === 'solo' && own.price === 9600, '③ 우리 매물뿐 → +20%', own);
  const fo = P([{ id: '2', p: 3000, g: '상', sid: 'shopF', fk: fk('fake') }]); ok(fo.mode === 'fakeOnly' && fo.price === 9600, '③ 허위만(정범님 11/10) → +20%', fo);
  const w = P([{ id: '3', p: 3000, g: '중', sid: 'shopG', fk: fk('ok') }]); ok(w.mode === 'worseOnly' && w.price === 8000 && /그대로/.test(w.why.join(' ')), '② 유효 매물이 모두 나쁜 등급(동급 유효 최저를 못 셈) → 알라딘 값 그대로', w);
  const w2 = P([{ id: '3', p: 3000, g: '중', sid: 'shopG', fk: fk('ok') }], { cfg: { worsePct: 10 } }); ok(w2.price === 8800 && /\+10%/.test(w2.t), 'worsePct 설정을 주면 그만큼(기본 0)', w2);
  ok(X.y24ValCfg({}).worsePct === 0 && X.y24ValCfg({ worsePct: 500 }).worsePct === 100 && X.y24ValCfg({ worsePct: 'x' }).worsePct === 0, 'worsePct 울타리 0~100 · 이상한 값은 기본');
  const m = P([{ id: '4', p: 7200, g: '상', sid: 'shopH', fk: fk('ok') }, { id: '5', p: 2000, g: '상', sid: 'shopF', fk: fk('fake') }]); ok(m.mode === 'match' && m.price === 7200, '① 유효 동급 최저(허위 2,000원은 뺌) → 7,200', m);
  const nd = X.y24PriceOf(L, null); ok(nd.mode === 'noData' && nd.chk, '시장 지표 없음 → noData(웹앱이 기다림 뒤 알라딘 값으로)', nd); }

console.log('② 웹앱 ◆y24reg 순수 덩어리');
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegCfg, y24RegJudge, y24AutoHuman, y24AutoPlan, y24AutoCand, y24RegPrice };')();
{ const D = F.Y24R_DEF; ok(D.day === 0 && D.firstAny === 1 && D.autoAll === 0 && D.mktWaitH === 6 && D.auto === 1, '기본: 하루 상한 없음 · 첫 건은 엔진이 · 전부 자동은 끔 · 시장 지표 6시간 기다림', D);
  const c = F.y24RegCfg({ firstAny: 0, autoAll: '1', mktWaitH: 999 }); ok(c.firstAny === 0 && c.autoAll === 1 && c.mktWaitH === 72 && F.y24RegCfg({ mktWaitH: -3 }).mktWaitH === 0, '새 칸 읽기·울타리', c);
  const R = (o) => ({ lid: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', qty: 1, price: 9000, alPrice: 9000, skus: ['S1'], self: 'S1', val: { mode: 'match', t: '유효 동급 최저' }, ...o });
  const ndv = { mode: 'noData', chk: true, est: true, t: '예스24 시장 지표 없음 — 알라딘 값 그대로' };
  ok(/사람 확인/.test(F.y24AutoHuman(R({ val: ndv }), D)), '시장 지표를 아직 안 기다렸으면 기다림(사람 확인 줄 · 클라우드에 읽기 맡김)');
  ok(F.y24AutoHuman(R({ val: ndv, mktGo: 1 }), D) === '', '시장 지표를 오래 기다렸으면 알라딘 값 그대로 올림(F45 ②)');
  ok(/사람 확인/.test(F.y24AutoHuman(R({ val: ndv, mktGo: 1, price: 9500 }), D)), '기다린 줄이라도 값이 알라딘 값과 다르면(이상) 사람 확인');
  ok(/멈춤/.test(F.y24AutoHuman(R({ val: { mode: 'stop', stop: true, t: '⛔' }, mktGo: 1 }), D)), '엔진 멈춤(25% 넘게 쌈)은 그대로 사람 확인');
  const row = (lid, price, want, val) => ({ k: 'ok', row: R({ lid, isbn: '97889000000' + lid.slice(-2), price, alPrice: price, skus: ['S' + lid], self: 'S' + lid, val: val || { mode: 'match', t: 'x' } }), want: want ? 'r' + lid : null });
  const rows = [row('aladin_U11', 12000, 0), row('aladin_U12', 3000, 0), row('aladin_U13', 5000, 0, ndv), row('aladin_U14', 7000, 1), { k: 'no', why: '이미', row: null }];
  const has = () => true;
  const c1 = F.y24AutoCand(rows, D, 0, () => false, has); ok(c1.length === 1 && c1[0].lid === 'aladin_U14', '「🟦 예스24도」 줄이 있으면 그것만', c1.map((x) => x.lid));
  const rows2 = rows.filter((r) => !r.want);
  const c2 = F.y24AutoCand(rows2, D, 0, () => false, has); ok(c2.length === 3 && c2[0].lid === 'aladin_U12' && c2[0].first && c2[c2.length - 1].lid === 'aladin_U13', '장부가 비었고 표시 줄이 없으면 판매중 전부에서 — 값 싼 것부터 · 사람 확인 줄은 뒤로', c2.map((x) => x.lid));
  const P0 = F.y24AutoPlan(c2, {}, { adm: [], pub: [] }, '2026-11-14T09:00:00Z', D); ok(P0.mode === 'first' && P0.pick.length === 1 && P0.pick[0].lid === 'aladin_U12', '→ 첫 한 건 = 가장 싼 1건(사람 손 없음)', P0.pick.map((x) => x.lid));
  ok(F.y24AutoCand(rows2, D, 1, () => false, has).length === 0, '장부에 줄이 생긴 뒤엔 표시 없는 상품을 저절로 안 고름(전부 자동은 끔)');
  ok(F.y24AutoCand(rows2, F.y24RegCfg({ firstAny: 0 }), 0, () => false, has).length === 0, 'firstAny 끄면 첫 건도 안 고름');
  const c3 = F.y24AutoCand(rows2, F.y24RegCfg({ autoAll: 1 }), 5, () => false, has); ok(c3.length === 3 && !c3[0].first, 'autoAll 켜면 판매중 상품 전부가 후보(첫 건 뒤 묶음씩)', c3.map((x) => x.lid));
  const c4 = F.y24AutoCand(rows2, D, 0, (i) => i === '9788900000013', has); const g = c4.find((x) => x.lid === 'aladin_U13'); ok(g && g.mktGo === 1 && F.y24AutoHuman(g, D) === '', '시장 지표를 오래 기다린 책은 mktGo → 알라딘 값으로 올릴 수 있음', g);
  ok(F.y24AutoCand(rows2, D, 0, () => false, () => false).length === 0, '시장 지표를 한 번도 받아 보지 않은 책은 아직 안 고름');
  const J = F.y24RegJudge({ id: 'aladin_U9', live: 1, isbn: '9788900000009', grade: '상', price: 8000, qty: 1, skus: ['S9'], title: '시험' }, { cfg: D, val: () => X.y24PriceOf({ alPrice: 8000, grade: '상' }, { page1: [{ id: '1', p: 3000, g: '중', sid: 'x', fk: { lv: 'ok', p: 0.1, conf: 0.8, est: false, n: 5 } }] }) });
  ok(J.ok && J.row.price === 8000 && J.row.val.mode === 'worseOnly' && !J.row.val.up, '📤 줄: 동급 없음 = 알라딘 값 · 「+」 표시 없음', J.row); }

console.log('③ 웹앱 시장 지표 받기');
{ const blk = cut('/* ══ (정범님 11/10 · y24eng)', 'const Y24TR = { good:');
  ok(/const y24eNd = /.test(blk) && /function y24MktGo\(/.test(blk) && /y24eNeed\(i, now\)/.test(blk) && /y24eNeed\(s, now\)/.test(blk), '받기·바라기 둘 다 같은 다시 받기 규칙(y24eNeed)');
  const S = { y24e: { m: new Map(), tried: new Map(), nd: new Map() } };
  const G = new Function('S', blk.match(/const y24eNd = [^\n]+/)[0] + '\n' + blk.match(/const y24eNeed = [^\n]+/)[0] + '\n' + blk.match(/function y24MktGo\([^\n]+/)[0] + '\nreturn { y24eNd, y24eNeed, y24MktGo };')(S);
  const now = Date.now(); S.y24e.m.set('A', { none: false, page1: null, reqAt: null }); S.y24e.tried.set('A', now - 11 * 60e3); ok(G.y24eNeed('A', now), "'없음' 문서는 10분 뒤 다시 받음(예전엔 끝까지 안 받음)");
  S.y24e.tried.set('A', now - 60e3); ok(!G.y24eNeed('A', now), '10분 안엔 다시 안 받음');
  S.y24e.m.set('B', { none: false, page1: [{ p: 1 }] }); S.y24e.tried.set('B', 0); ok(!G.y24eNeed('B', now), '시장 지표가 있는 책은 다시 안 받음(예전과 같음)');
  S.y24e.nd.set('A', now - 7 * 3600e3); ok(G.y24MktGo('A', { mktWaitH: 6 }) && !G.y24MktGo('A', { mktWaitH: 8 }), '처음 없음을 본 지 6시간 → 알라딘 값으로 · 설정 시간 전엔 기다림');
  S.y24e.m.set('C', { none: false, page1: null, err: '못 읽음' }); ok(G.y24MktGo('C', { mktWaitH: 6 }), '클라우드가 못 읽은 책은 기다리지 않음');
  S.y24e.m.set('D', { none: false, page1: null, reqAt: new Date(now - 7 * 3600e3).toISOString() }); ok(G.y24MktGo('D', { mktWaitH: 6 }), '문서의 읽기 맡긴 때(req.at)로도 셈(새로 연 탭에서도)');
  ok(!G.y24MktGo('B', { mktWaitH: 0 }), '시장 지표가 있는 책은 mktGo 아님(엔진 값)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(cut('function y24AutoCand(', '/* ◆y24reg 끝 */')), '새 코드에 브라우저 창 0'); }

console.log(bad ? `❌ tY24GO1_1114 ${bad}개 실패` : '✓ tY24GO1_1114 통과'); process.exit(bad ? 1 : 0);
