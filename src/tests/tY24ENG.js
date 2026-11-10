// tY24ENG — (정범님 11/10 · y24eng) 🟦 예스24 허위 매물 판정(그림자) · 예스24 판매가 엔진 — 공용 파일 readnow-ext-core.js
//   ① 허위 판정 y24FakeOf·y24FakeAll — 알라딘 판매자 가치 축(활동·배송 약속·독립·실제 팔림) 옮김 + 예스24 고유 신호 · 확신도·표본 수·추정
//   ② 실제 팔림 근거 y24RealEv · 판매자 지문 무리 y24FamOf · 알라딘과 근거 나눔 y24AlLinks(진짜 peerW)·y24ToAlEv
//   ③ 판매가 y24PriceOf — 우리뿐/허위만 알라딘 +20% · 유효 동급 최저(더 좋은 등급 환산·배송비 총액) · 바닥 · 약속 36 경계(new는 막지 않음 · auto는 울타리면 hold) · 정가 알림
//   ④ 웹앱 📤 새로 올리기 순수 덩어리(◆y24reg)에 엔진 판매가 고리(X.val) · 하루 상한 기본 없음
// 실행: cd pw && node tY24ENG.js   (공용 파일은 ../readnow-ext-core.js · ../readnow-sellers-core.js · ../readnow-pricing-core.js — 빌드 복사본 자리 · 웹앱은 RN_APP 또는 ../src/app.html)
// 시험 자료는 모두 지어낸 값(가게 아이디 shopA… · 손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 200)); };
const ROOT = path.join(__dirname, '..'); const X = require(path.join(ROOT, 'readnow-ext-core.js')); const RS = require(path.join(ROOT, 'readnow-sellers-core.js')); const PR = require(path.join(ROOT, 'readnow-pricing-core.js'));
const NOW = Date.parse('2026-11-10T03:00:00Z'); const dAgo = (n) => new Date(NOW - n * 864e5 + 9 * 3600e3).toISOString().slice(0, 10);
const good = { biz: true, ratingN: 800, rating: 5, send: 1, items: 5000, lowRecent: 0, lastRv: dAgo(2), flags: [] };
const dead = { biz: false, ratingN: 3, rating: 3, send: 6, items: 900, lowRecent: 0, lastRv: dAgo(400), flags: ['direct'] };

console.log('① 허위 판정 — 알라딘 축 옮김 + 예스24 고유 신호');
{ const g = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopG' }, good, { now: NOW }); ok(g.lv === 'ok' && g.p < 0.2 && !g.est && g.n >= 3, '평가 많고 최근 평가·빠른 발송·사업자 → 유효(확신 있음)', g);
  const f = X.y24FakeOf({ p: 900, g: '상', sid: 'shopD', cmt: '계좌 입금 시 할인' }, dead, { now: NOW, gMed: 9000 }); ok(f.lv === 'fake' && f.p >= 0.7 && f.why.some((w) => /400일 전/.test(w)) && f.why.some((w) => /미끼 값/.test(w)) && f.why.some((w) => /직거래/.test(w)), '잠든 가게(마지막 평가 400일 전)·직거래 글귀·가운데 값 30% 아래 → 허위 · 까닭을 남김', f);
  const u = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopU' }, null, { now: NOW }); ok(u.lv === 'unk' && u.tag === '모름' && u.n === 0, '카드도 줄 정보도 없으면 모름', u);
  const e = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopE', rn: 0 }, null, { now: NOW }); ok(e.est && / 추정$/.test(e.tag) && e.n < 3 && e.conf < 0.6, '표본이 모자라면 추정(est · tag "… 추정" · 확신도 낮음)', e);
  const m = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopM', rem: 5, fo: 500 }, { ...good, lastRv: dAgo(30) }, { now: NOW, dup: 3 }); ok(m.why.some((w) => /남은 수 5/.test(w)) && m.why.some((w) => /500원/.test(w)) && m.why.some((w) => /3줄/.test(w)), '예스24 고유: 남은 수 2+ · 무료배송 기준 1,000원 이하 · 같은 책 여러 줄', m.why);
  const fam = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopF' }, { ...good }, { now: NOW, fam: '사업자 등록번호 같음' }); ok(fam.p > g.p && fam.why.some((w) => /무리/.test(w)), '독립 축: 판매자 지문 무리에 들면 허위 쪽으로', fam.why);
  const cfg = X.y24FakeOf({ p: 900, g: '상', sid: 'shopD' }, dead, { now: NOW, gMed: 9000 }, { cut: { fake: 0.999, sus: 0.998 } }); ok(cfg.lv === 'ok', '기준값은 설정으로 바꿈(cut)', cfg.lv); }
{ const rec = { page1: [{ r: 1, id: '1', g: '상', p: 500, sid: 'shopD' }, { r: 2, id: '2', g: '상', p: 8000, sid: 'jerrycson' }, { r: 3, id: '3', g: '상', p: 8500, sid: 'shopG' }, { r: 4, id: '4', g: '상', p: 9000, sid: 'shopG' }, { r: 5, id: '5', g: '상', p: 9500, sid: 'shopH' }] };
  const A = X.y24FakeAll(rec, { cards: { shopD: dead, shopG: good }, now: NOW }); ok(A[1].fk.lv === 'own' && A[0].fk.lv === 'fake' && A[2].fk.why.some((w) => /2줄/.test(w)) && A.every((x) => x.fk), '첫 쪽 전체: 우리 줄은 own · 줄마다 fk · 같은 가게 여러 줄', A.map((x) => x.fk.lv));
  const S = X.y24FakeSum(A); ok(S.n === 5 && S.own === 1 && S.fake === 1 && typeof S.weak === 'boolean', '판정 요약(화면용): 수·추정·약함', S); }

console.log('② 실제 팔림 · 무리 · 알라딘과 근거 나눔');
{ const row = (id, p, sid, g) => ({ id, p, sid, g: g || '상' }); const isbn = '9780000000001';
  const CH = [{ isbn, at: '2026-11-01T00:00:00Z', page: [row('a', 5000, 'shopS'), row('b', 6000, 'shopP'), row('c', 9000, 'jerrycson')] }, { isbn, at: '2026-11-03T00:00:00Z', page: [row('b', 6000, 'shopP'), row('c', 9000, 'jerrycson')] }, { isbn, at: '2026-11-05T00:00:00Z', page: [row('b', 6000, 'shopP')] }];
  const E = X.y24RealEv(CH, [{ isbn, at: '2026-11-04T00:00:00Z', g: '상', p: 9000 }]); ok(E.shopS && E.shopS.sold === 1 && E.shopP && E.shopP.passed === 1 && !E.jerrycson, '사라짐 = 팔림(sold) · 우리가 팔릴 때 남은 더 싼 매물 = 지나침(passed) · 우리 줄은 셈 안 함', E);
  const full = Array.from({ length: 24 }, (_, i) => row('n' + i, 1000 + i * 10, 'shopN'));
  const E2 = X.y24RealEv([{ isbn, at: '2026-11-01T00:00:00Z', page: [row('z', 9999, 'shopZ')] }, { isbn, at: '2026-11-02T00:00:00Z', page: full }], []); ok(!E2.shopZ, '첫 쪽이 차서 밀려난 매물은 팔림으로 안 셈', E2);
  const F = X.y24FamOf([{ a: 'shopA', b: 'shopB', strong: true, why: ['사업자 등록번호 같음'] }, { a: 'shopC', b: 'shopD', strong: false, why: ['같은 값'] }]); ok(F.shopA && F.shopB && !F.shopC, '판매자 지문 강한 짝만 무리', F);
  const cross = { legal: [{ sid: 'shopR', sc: '111', why: ['사업자 등록번호 같음'], lv: 'strong' }, { sid: 'shopK', sc: '222', why: ['업체명 같음'], lv: 'mid' }] };
  const al = X.y24AlLinks(cross, { sc_111: { rev6m: 0, cancel3m: 0.2 }, sc_222: { rev6m: 5000, cancel3m: 0.001 } }, RS.peerW); ok(al.shopR && al.shopR.cls === 'red' && al.shopR.lv === 'strong' && al.shopK && /green/.test(al.shopK.cls), '알라딘 같은 판매자 → 알라딘 판매자 가치(진짜 peerW) 색을 가져옴', al);
  const r1 = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopR' }, { ...good }, { now: NOW, al: al.shopR }); const r0 = X.y24FakeOf({ p: 9000, g: '상', sid: 'shopR' }, { ...good }, { now: NOW });
  ok(r1.p > r0.p && r1.src.includes('알라딘 같은 판매자') && r1.why.some((w) => /알라딘 같은 판매자/.test(w)), '알라딘 빨강(같은 사업자 번호) → 예스24 허위 쪽 근거(약속 40)', { r0: r0.p, r1: r1.p });
  const T = X.y24ToAlEv({ shopR: r1, shopK: X.y24FakeOf({}, null, {}) }, cross); ok(T['111'] && T['111'].sid === 'shopR' && /예스24 같은 판매자/.test(T['111'].why) && !T['222'], '반대 방향(그림자): 예스24 판정 → 알라딘 판매자 번호 쪽 참고 근거(모름은 안 보냄)', T); }

console.log('③ 판매가 — 우리뿐/허위만 +20% · 유효 동급 최저 · 약속 36 경계');
{ const L = { alPrice: 8000, grade: '상', priceList: 15000 }; const P = (rows, o) => X.y24PriceOf(L, { page1: rows, total: rows.length, full: true }, o);
  const s = X.y24PriceOf(L, { none: true }); ok(s.mode === 'solo' && s.price === 9600 && /\+20%/.test(s.t), '예스24 중고에 이 책 없음(우리뿐) → 8,000 × 1.2 = 9,600', s);
  const s2 = P([{ id: 'o', p: 8000, g: '상', sid: 'jerrycson' }]); ok(s2.mode === 'solo' && s2.price === 9600, '첫 쪽에 우리 매물뿐 → +20%', s2);
  const fk = (lv, est) => ({ lv, p: lv === 'fake' ? 0.9 : 0.1, conf: 0.8, n: 4, est: !!est, why: [] });
  const f = P([{ id: '1', p: 3000, g: '상', sid: 'shopD', fk: fk('fake') }, { id: '2', p: 3500, g: '상', sid: 'shopE', fk: fk('sus') }]); ok(f.mode === 'fakeOnly' && f.price === 9600 && f.n.fake === 1 && f.n.sus === 1, '허위·(확신 있는) 의심만 → +20%', f);
  const f2 = P([{ id: '2', p: 7000, g: '상', sid: 'shopE', s: 2500, fk: fk('sus', true) }]); ok(f2.mode === 'match' && f2.price === 7000, '의심이라도 추정(표본 모자람)이면 유효로 봄(dropSus conf · 경쟁 쪽 안전)', f2);
  const m = P([{ id: '1', p: 3000, g: '상', sid: 'shopD', fk: fk('fake') }, { id: '3', p: 7200, g: '상', sid: 'shopG', s: 2500, fk: fk('ok') }, { id: '4', p: 7500, g: '상', sid: 'shopH', fk: fk('ok') }]);
  ok(m.mode === 'match' && m.price === 7200 && m.ref.id === '3' && m.n.valid === 2, '유효 동급 최저(허위 3,000원은 뺌) → 7,200원 동가', m);
  const m2 = X.y24PriceOf({ ...L, ourShip: 2000 }, { page1: [{ id: '3', p: 7200, g: '상', sid: 'shopG', s: 2500, fk: fk('ok') }] }); ok(m2.price === 7700, '우리 배송비를 알면 배송비 포함 총액 동가(7,200+2,500−2,000)', m2);
  const b = P([{ id: '5', p: 7000, g: '최상', sid: 'shopG', fk: fk('ok') }, { id: '6', p: 7500, g: '상', sid: 'shopH', fk: fk('ok') }]); ok(b.mode === 'match' && b.ref.id === '5' && b.price === 6650 && b.price < 7000, '더 좋은 등급(최상 7,000)이 환산해서 더 쌈 → 7,000 × 0.95/1 = 6,650(단위 내림)', b);
  const w = P([{ id: '7', p: 3000, g: '중', sid: 'shopG', fk: fk('ok') }]); ok(w.mode === 'worseOnly' && w.price === 9600 && w.worse.g === '중', '유효 매물이 모두 나쁜 등급 → 동급 경쟁 없음 +20%', w);
  const fl = P([{ id: '8', p: 2000, g: '상', sid: 'shopG', fk: fk('ok') }]); ok(fl.mode === 'stop' && fl.stop && fl.price == null && fl.sug === 2000 && fl.chk && fl.why.some((x) => /출고 자동 결정과 같은 조건/.test(x)), '(정범님 11/10 오후) 유효 동급 최저가 알라딘 값보다 25% 넘게 쌈 → 멈춤(price 없음 · 제안 값 sug) · 사람 확인', fl);
  const e25 = P([{ id: '8', p: 6000, g: '상', sid: 'shopG', fk: fk('ok') }]); const e26 = P([{ id: '8', p: 5950, g: '상', sid: 'shopG', fk: fk('ok') }]); ok(e25.mode === 'match' && e25.price === 6000 && e26.mode === 'stop', '경계 = 출고와 같음: 딱 25% 싼 6,000원은 통과 · 25% 넘게(5,950원) 싸면 멈춤', { e25: e25.mode, e26: e26.mode });
  const c40 = P([{ id: '8', p: 5950, g: '상', sid: 'shopG', fk: fk('ok') }], { cfg: { cheapPct: 40 } }); ok(c40.mode === 'match' && c40.price === 5950, '기준 %는 설정(cheapPct · 웹앱은 출고 자동 결정 설정값을 넘김)', c40.mode);
  { const SH = require(path.join(ROOT, 'readnow-shipping-core.js')); ok(SH.autoCfg({}).cheapPct === X.Y24_VAL.cheapPct && X.y24ValCfg({ cheapPct: 999 }).cheapPct === SH.autoCfg({ cheapPct: 999 }).cheapPct, '기본 25%·울타리(0~100)가 출고 자동 결정(readnow-shipping-core autoCfg)과 같음', { ship: SH.autoCfg({}).cheapPct, y24: X.Y24_VAL.cheapPct }); }
  const nd = X.y24PriceOf(L, null); ok(nd.mode === 'noData' && nd.chk && nd.est, '시장 지표 없음 → noData(📤은 예전처럼 알라딘 값 ±%)', nd);
  const up30 = X.y24PriceOf(L, { none: true }, { cfg: { upPct: 30 } }); const r10 = X.y24PriceOf({ alPrice: 7777, grade: '상' }, { none: true }, { cfg: { round: '10' } }); ok(up30.price === 10500 && r10.price === 9330, '비율은 설정 칸(upPct · 8,000×1.3=10,400 → 만 원대 단위 500원 반올림 10,500) · round "10"이면 10원 반올림', { up30: up30.price, r10: r10.price });
  const lock = { locked: true, why: '등록 3개월 안' }; const n1 = X.y24PriceOf(L, { none: true }, { use: 'new', lock }); const a1 = X.y24PriceOf(L, { none: true }, { use: 'auto', lock }); const a2 = X.y24PriceOf(L, { none: true }, { use: 'auto', lock: { locked: false } });
  ok(n1.price === 9600 && n1.use === 'new' && a1.hold && a1.price == null && /약속 36/.test(a1.why[0]) && a2.price === 9600, '약속 36 경계: 새로 올릴 때(new)는 울타리여도 셈 · 저절로 바꾸기(auto)는 울타리면 hold', { n1: n1.mode, a1: a1.mode, a2: a2.mode });
  const hi = X.y24PriceOf({ alPrice: 14000, grade: '상', priceList: 15000 }, { none: true }); ok(hi.price === 17000 && hi.warn.some((x) => /정가/.test(x)), '정가보다 비싸면 알림만(막지 않음 · 약속 00)', hi.warn);
  const raw = X.y24PriceOf(L, { page1: [{ id: '1', p: 500, g: '상', sid: 'shopD', cmt: '계좌 입금' }] }, { fkCtx: { cards: { shopD: dead }, now: NOW } }); ok(raw.mode === 'fakeOnly' && raw.price === 9600, '줄에 fk가 없으면 엔진이 그 자리에서 허위 판정(fkCtx)', raw);
  const est = P([{ id: '9', p: 7000, g: '상', sid: 'shopX' }]); ok(est.est && est.why.some((x) => /표본/.test(x)), '판정 표본이 모자라면 결과에 est(화면 "추정")', est); }
{ const steps = [95, 150, 999, 1000, 4321, 9999, 10000, 23456, 99999, 123456]; ok(steps.every((p) => X.y24SnapNear(p * 1.2) % PR.priceStep(X.y24SnapNear(p * 1.2)) === 0), '값 단위 = 알라딘 값 규칙(readnow-pricing-core priceStep)과 같은 칸', steps.map((p) => X.y24SnapNear(p * 1.2))); }

console.log('④ 웹앱 📤 새로 올리기 — 엔진 고리 · 하루 상한 없음');
{ const APP = process.env.RN_APP || [path.join(ROOT, 'src', 'app.html'), path.join(ROOT, 'app.html')].find((x) => fs.existsSync(x)); const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
  const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegCfg, y24RegGate, y24RegJudge };')();
  ok(F.Y24R_DEF.day === 0 && F.y24RegCfg({}).day === 0 && F.y24RegCfg({ day: 25 }).day === 25, '하루 상한 기본 없음(0) · 설정으로 둘 수는 있음');
  const e = { lid: 'a', ok: 1, at: '2026-11-10T01:00:00Z', day: '2026-11-10', st: 'sent' }; const E = {}; for (let i = 0; i < 40; i++) E['x' + i] = { ...e, lid: 'x' + i }; const G = F.y24RegGate(E, { adm: [], pub: [] }, '2026-11-10T05:00:00Z', F.Y24R_DEF, '2026-11-10');
  ok(G.mode === 'bulk' && G.max >= 1000 && /상한 없음/.test(G.t), '오늘 40줄을 올려도 더 올릴 수 있음(상한 없음)', G);
  const L = { id: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, skus: ['A01BC123PK'], dupes: false, adult: false }; const X0 = { onY24: new Map(), selfSet: new Set(), led: {}, ledSku: new Set(), cfg: F.Y24R_DEF };
  const j1 = F.y24RegJudge(L, { ...X0, val: (l) => X.y24PriceOf({ alPrice: l.price, grade: l.grade }, { none: true }) }); ok(j1.ok && j1.row.price === 9600 && j1.row.alPrice === 8000 && j1.row.val.mode === 'solo' && j1.row.val.up, '엔진 판매가(X.val) → 엑셀 판매가 · 줄에 val(mode·t·est·why) 남김', j1.row);
  const j2 = F.y24RegJudge(L, { ...X0, val: (l) => X.y24PriceOf({ alPrice: l.price, grade: l.grade }, null) }); ok(j2.row.price === 8000 && j2.row.val.mode === 'noData', '시장 지표 없으면 예전처럼 알라딘 값(±%)', j2.row);
  const j4 = F.y24RegJudge(L, { ...X0, val: (l) => X.y24PriceOf({ alPrice: l.price, grade: l.grade }, { page1: [{ id: '8', p: 2000, g: '상', sid: 'shopG', fk: { lv: 'ok', p: 0.1, conf: 0.8, n: 4, est: false, why: [] } }] }) }); ok(j4.ok && j4.row.price === 8000 && j4.row.val.stop && j4.row.val.sug === 2000 && j4.row.val.chk, '멈춤이면 📤 줄 값은 알라딘 값 그대로 · val.stop·val.sug(제안 값)로 사람 확인', j4.row.val);
  ok(/shipAutoCfgNow\(\)/.test(cut('/* ══ (정범님 11/10 · y24eng)', "const Y24TR = { good:")), '웹앱은 출고 자동 결정 설정(shipAutoCfgNow)의 cheapPct를 씀');
  const j3 = F.y24RegJudge(L, { ...X0, val: () => { throw new Error('x'); } }); ok(j3.ok && j3.row.price === 8000 && j3.row.val === null, '엔진이 깨져도 등록 줄은 그대로(알라딘 값)', j3.row);
  ok(/function y24EngVal\(l, o\)/.test(T) && /const y24EngRegVal = /.test(T) && /function y24EngLoad\(isbns\)/.test(T) && /val: typeof y24EngRegVal === 'function'/.test(T), '웹앱에 꺼내 쓰는 함수(y24EngVal·y24EngRegVal·y24EngLoad·y24EngRows·y24EngSum) · 📤 고리');
  const blk = cut('/* ══ (정범님 11/10 · y24eng)', "const Y24TR = { good:"); ok(!/\b(alert|confirm|prompt)\s*\(/.test(blk) && !/\.set\(\{|\.update\(|\.add\(|\.delete\(\)/.test(blk.replace(/S\.y24e\.(m|tried|want)\.(set|delete|add)\(/g, '')), '꺼내 쓰는 곳은 읽기·셈만(쓰기 0 · 브라우저 창 0)'); }

if (bad) { console.log(`✗ tY24ENG ${bad}개 실패`); process.exit(1); } else console.log('✓ tY24ENG 통과');
