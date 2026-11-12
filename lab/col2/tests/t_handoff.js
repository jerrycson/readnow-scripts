/* t_handoff — (11/12 handoff2 · 리드 '묶음째 넘기기') 🔀 로거 칸 일(👥 구매자 분포 · 🏪 숍 요약) · 📚 정보나루 · 📦 묶음 판정 — 번외 쪽(순수 규칙 + 일 돌리기)
 *  ① 규칙 파일 plan(): 운영 dynOne·rev6mJob과 같은 쓰기(칸·값·옛 기록 한 줄·모으기 줄 빼기) · planCheck가 정한 칸 밖은 거절 · 운영 원문에 같은 규칙 줄이 그대로 있는지(어긋나면 이 시험이 알림)
 *  ② 로거 칸(약속 0): 로거 칸 일은 로거 PC만 맡음 · 사무실 일은 로거 PC가 못 맡음 · 까닭 글
 *  ③ 일 돌리기(col2-jobs): 넘겼으면 운영 규칙(30일·7일)으로 쓸 때만 운영 칸에 맡김 · 안 넘겼으면 그림자만 · 값을 안 써도 맥박 · 7일 넘은 판매자만 차례
 *  ④ 묶음 보기: 넘김·넘길 수 있음·그림자 중·막힘(까닭) · 알라딘 읽기 22가지 = 로그인 필요 20 · 로그인 없이 2(쓰기의 앞 단계)
 * 실행: node tests/t_handoff.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const HOF = require('../shadow/col2-handoff.js'); const TK = require('../shadow/col2-tasks.js'); const { makeJobs } = require('../helper/col2-jobs.js'); const COL2 = require('../col2-config.js');
(async () => {
  const NOW = '2026-11-12T10:00:00.000Z'; const O = { now: NOW, day: '2026-11-12' };
  console.log('① plan — 운영과 같은 쓰기');
  const page = { buyerDist: { '20대': 40 }, relationBuy: [{ title: '가', aladinItemId: '11' }, { title: '나', aladinItemId: '12' }], clickRelation: [{ title: '다' }], clickRaw: { a: 1 }, dynamicLoaded: true };
  let W = HOF.plan('dynamic', 'b1', { dyn: page }, {}, O);
  const m = W.find((w) => w.c === 'prd_book_metrics'), h = W.find((w) => w.c === 'prd_dyn_history');
  ok(W.length === 2 && m.id === 'b1' && m.v.dynAt === NOW && m.v.dynTriedAt === NOW && m.v.dynLoaded === true && m.v.relationBuy.join() === '가,나' && m.v.relationBuyIds.length === 2 && m.v.dynamicPending === false && m.v.clickRaw.a === 1,
    '👥 구매자 분포: prd_book_metrics에 운영 dynOne과 같은 칸(dynAt·dynTriedAt·relationBuy 제목·relationBuyIds·dynamicPending)', W);
  ok(h && h.v.lastSig === JSON.stringify([page.buyerDist, ['가', '나'], page.clickRelation]) && Array.isArray(h.v.snaps.$au) && h.v.snaps.$au[0].at === NOW && !h.bare, '처음 보는 책 = prd_dyn_history에 한 줄 더함(arrayUnion) · 지문 lastSig = 운영과 같은 셈', h);
  W = HOF.plan('dynamic', 'b1', { dyn: page }, { 'prd_dyn_history/b1': { lastSig: h.v.lastSig } }, O); const h2 = W.find((w) => w.c === 'prd_dyn_history');
  ok(h2.bare && Object.keys(h2.v).join() === 'lastCheckedAt', '같은 값이면 기록 줄은 안 늘리고 확인 시각만(운영 else 길 그대로 · 쓴 이 칸 없음)', h2);
  W = HOF.plan('dynamic', 'b2', { dyn: { dynamicLoaded: false } }, {}, O); ok(W.length === 1 && W[0].v.dynamicPending === true && !W[0].v.dynAt && W[0].v.dynLoaded === false, '못 읽은 책 = 시도 시각만 · dynamicPending(운영과 같음)', W);
  const shop = { status: 'ok', rev6m: 120, rev6mLt3: false, periods: { m1: 20 }, total: 900, totalLt3: false, grade: '플래티넘', isPro: true, cancel3m: 0.4, info: null, infoNote: null };
  W = HOF.plan('shopSum', 'sc_123', { shop, ver: '1.3.5' }, { 'sellers/sc_123': { shopSig: 'old' }, 'app_settings/seller_queue': { sc: ['123', '9'] } }, O);
  const sl = W.find((w) => w.c === 'sellers'), sh = W.find((w) => w.c === 'seller_history'), sq = W.find((w) => w.c === 'app_settings'), s6 = W.find((w) => w.c === 'seller_rev6m');
  ok(sl && sl.v.rev6m === 120 && sl.v.rev6mAt === NOW && sl.v.shopAt === NOW && sl.v.sc === '123' && sl.v.aladinGrade === '플래티넘' && sl.v.shopTotal === 900 && !('bizInfo' in sl.v) && typeof sl.v.shopSig === 'string', '🏪 숍 요약: sellers 칸이 운영 rev6mJob과 같음(빈 사업자 칸은 안 씀)', sl);
  ok(sh && sh.set && sh.id === 'sc_123_2026-11-12T10-00-00-000Z' && sh.v.kind === 'shopSummary' && sq && sq.id === 'seller_queue' && sq.v.sc.$ar[0] === '123' && sq.bare && s6 && s6.v.days['2026-11-12'] === 120, '숍 화면이 바뀜 → seller_history 한 판 · 모으기 줄에 있으면 뺌 · 날마다 seller_rev6m', { sh, sq, s6 });
  W = HOF.plan('shopSum', 'sc_123', { shop, ver: '1.3.5' }, { 'sellers/sc_123': { shopSig: sl.v.shopSig }, 'app_settings/seller_queue': { sc: [] } }, O);
  ok(!W.some((w) => w.c === 'seller_history' || w.c === 'app_settings') && W.some((w) => w.c === 'sellers'), '같은 숍 화면 = 옛 판 보관 없음 · 모으기 줄에 없으면 줄 안 건드림', W.map((w) => w.c));
  W = HOF.plan('shopSum', 'sc_5', { shop: { status: 'miss' }, ver: '1.3.5' }, {}, O); ok(W.length === 1 && W[0].v.rev6mTriedAt === NOW && W[0].v.rev6mTriedVer === '1.3.5', '구매만족도 표를 못 찾음 = 시도 시각·판만(7일 뒤 다시 · 운영과 같음)', W);
  ok(HOF.planCheck('shopSum', [{ c: 'prd_books', id: 'x', v: {} }]) && HOF.planCheck('shopSum', [{ c: 'app_settings', id: 'col2_handoff', v: {} }]) && !HOF.planCheck('shopSum', HOF.plan('shopSum', 'sc_123', { shop, ver: 'v' }, {}, O)), '정한 칸 밖(prd_books)·app_settings의 다른 문서는 거절 · 규칙이 낸 쓰기는 통과');
  ok(!HOF.writeOk({ jobs: { dynamic: { on: true, pc: 'LOGGER', at: NOW } } }, { job: 'dynamic', c: 'prd_book_metrics', id: 'b1', v: { dyn: 'x' } }, 'LOGGER').ok && HOF.writeOk({ jobs: { dynamic: { on: true, pc: 'LOGGER', at: new Date().toISOString() } } }, { job: 'dynamic', c: 'prd_book_metrics', id: 'b1', v: { dyn: page } }, 'LOGGER').ok, '값 꼴이 다르면 거절 · 맞으면 통과');
  const SRC = fs.readFileSync(path.join(L.PROD_REPO, 'src/readnow-collector.src.js'), 'utf8');
  ok(SRC.includes('const hsig = JSON.stringify([upd.buyerDist || null, upd.relationBuy || null, upd.clickRelation || null]);') && SRC.includes("await C('prd_book_metrics').doc(bookId).set({ ...upd, dynamicPending: !(upd.buyerDist || upd.relationBuyIds), ...W() }, { merge: true });") && /SET\.dynDays \|\| 30/.test(SRC)
    && SRC.includes("b.set(C('sellers').doc(id), { ...(shopSigNow ? { shopSig: shopSigNow } : {}), sc: String(sc), rev6m: r.rev6m, rev6mLt3: r.rev6mLt3, rev6mAt: nowIso(), shopPeriods: r.periods, shopTotal: r.total, shopTotalLt3: r.totalLt3, aladinGrade: r.grade, isPro: r.isPro, cancel3m: r.cancel3m,") && /SET\.rev6mDays \|\| 7/.test(SRC)
    && SRC.includes("if (sPre.rev6mAt && Date.now() - Date.parse(sPre.rev6mAt) < Math.max(1, SET.rev6mDays || 7) * 864e5) { prog.skipFresh"), '운영 원문(dynOne·rev6mJob)에 같은 규칙 줄이 그대로 — 운영이 바뀌면 이 시험이 먼저 알림 · 운영은 번외가 먼저 쓴 책·판매자를 저절로 건너뜀(30일·7일)');

  console.log('② 로거 칸(약속 0)');
  const T = (pc, kind, k, can, h) => ({ d: '2026-11-12', pc, kind, ver: '0.1.41', at: new Date(Date.now() - (h || 0.2) * 3600e3).toISOString(), tasks: { [k]: { name: k, n: 40, same: 40, un: 0, pass: { can, why: can ? '넘길 수 있음' : '표본 12/30' } } } });
  let c = HOF.candidates([T('LOGGER', 'logger', 'dynamic', true), T('HOME', 'office', 'dynamic', true)]).find((x) => x.k === 'dynamic');
  ok(c && c.pc === 'LOGGER', '로거 칸 일은 로거 PC가 맡음(사무실 PC 표본이 있어도)', c);
  c = HOF.candidates([T('HOME', 'office', 'shopSum', true)]).find((x) => x.k === 'shopSum'); ok(c && !c.pc && /사무실 PC는 맡지 못함/.test(c.no), '사무실 PC만 있으면 맡을 PC 없음 + 까닭(약속 0)', c);
  c = HOF.candidates([T('LOGGER', 'logger', 'ext.kyobo', true)]).find((x) => x.k === 'ext.kyobo'); ok(c && !c.pc && /로거 PC는 맡지 못함/.test(c.no), '사무실 일(외부 정보)은 로거 PC가 못 맡음', c);
  c = HOF.candidates([T('LOGGER', 'logger', 'dynamic', true)].map((j) => ({ ...j, ver: '0.1.40' }))).find((x) => x.k === 'dynamic'); ok(c && !c.pc && /0\.1\.41 이상 필요/.test(c.no), '로거 칸 일은 번외 0.1.41부터', c);
  ok(HOF.kindOk('bench', 'logger') && !HOF.kindOk('bench', 'office') && HOF.kindOk('product', 'office') && !HOF.kindOk('ext.lib', 'logger') && TK.TASKS.filter((t) => t.who === 'logger').every((t) => HOF.LG_K.includes(t.k)), '길 없는 일도 로거/사무실 칸을 차림표(who)대로 셈');

  console.log('③ 일 돌리기 — 넘긴 로거 칸 일');
  const DB = {}; const ops = [], beats = [], notes = []; let HAND = {};
  const pass = () => ({ ok: true, waitMs: 0 }); const pace = { check: pass, take: async () => ({ ok: true }), ok() {}, fail() {} };
  const OFF = TK.TASKS.map((t) => t.k).filter((k) => !['dynamic', 'shopSum'].includes(k)); const CFGJ = { on: true, off: OFF, pass: { minN: 1, waitMin: 5 } };
  const br = { tabJob: async () => ({ ok: true, page: { ...page } }), readJob: async () => ({ ok: true, page: { ...shop } }), mainJob: async () => ({ ok: false }) };
  const ctx = { home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2hoff-')), cfg: () => CFGJ, kind: () => 'logger', pc: () => 'LOGGER', PASS: COL2.PASS, BUSY: { restMs: 1000 }, busy: () => null, VERSION: 'T', aladin: 'https://www.aladin.co.kr', OWN_SC: ['996008'],
    out: () => {}, note: (x) => notes.push(x), pace, ext: () => null, redact: (v) => v, core: async () => ({ src: [], ver: { 'readnow-sellers-core.js': '1.3.5' } }), browser: async () => br,
    want: (cc, id) => { const k = cc + '/' + id; return k in DB ? { have: true, v: DB[k] } : null; }, handed: (k) => !!HAND[k], opOut: (job, cc, id, v) => { ops.push({ job, c: cc, id, v }); return true; }, beat: (k) => { beats.push(k); return true; } };
  L.track(ctx.home); const J = makeJobs(ctx); const run = async (n) => { for (let i = 0; i < n; i++) await J.step(); };
  J.feedBooks([{ itemId: '101', bookId: 'b1', prod: {} }, { itemId: '102', bookId: 'b2', prod: {} }]); J.feedShops(['123', '996008', '77'], 'used');
  DB['prd_book_metrics/b1'] = { dynAt: new Date(Date.now() - 40 * 864e5).toISOString() }; DB['prd_book_metrics/b2'] = { dynAt: new Date(Date.now() - 2 * 864e5).toISOString() };
  DB['sellers/sc_123'] = { rev6mAt: new Date(Date.now() - 9 * 864e5).toISOString() }; DB['sellers/sc_77'] = { rev6mAt: new Date(Date.now() - 1 * 864e5).toISOString() };
  await run(8);
  ok(!ops.length && !beats.length && (J.summary().dynamic || {}).n >= 1, '넘기지 않았으면 그림자만(운영 칸에 안 맡김)', { ops, s: J.summary() });
  const J2 = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2hoff2-')) }); HAND = { dynamic: true, shopSum: true };
  J2.feedBooks([{ itemId: '101', bookId: 'b1', prod: {} }, { itemId: '102', bookId: 'b2', prod: {} }]); J2.feedShops(['123', '996008', '77'], 'used'); for (let i = 0; i < 10; i++) await J2.step();
  const dO = ops.filter((o) => o.job === 'dynamic'), sO = ops.filter((o) => o.job === 'shopSum');
  ok(dO.length === 1 && dO[0].id === 'b1' && dO[0].c === 'prd_book_metrics' && dO[0].v.dyn.clickRaw.a === 1 && dO[0].v.dyn.relationBuy.length === 2, '👥 넘긴 뒤: 30일 넘은 책(b1)만 운영 칸에 맡김 · 2일 전 책(b2)은 운영처럼 건너뜀 · 원문(clickRaw)까지', dO);
  ok(sO.length === 1 && sO[0].id === 'sc_123' && sO[0].c === 'sellers' && sO[0].v.shop.rev6m === 120 && sO[0].v.ver === '1.3.5', '🏪 넘긴 뒤: 7일 넘은 판매자만 · 우리 숍(996008)은 차례에도 안 들어감 · 판매자 공용 파일 판(rev6mTriedVer)', sO);
  ok(beats.filter((k) => k === 'dynamic').length >= 2 && beats.filter((k) => k === 'shopSum').length >= 2, '쓰지 않은 책·판매자도 맥박(beat) — 운영이 넘김을 풀지 않게', beats);
  const HD = { jobs: { dynamic: { on: true, pc: 'LOGGER', at: new Date().toISOString() }, shopSum: { on: true, pc: 'LOGGER', at: new Date().toISOString() } } };
  ok([...dO, ...sO].every((o) => HOF.writeOk(HD, o, 'LOGGER').ok) && !HOF.writeOk(HD, dO[0], 'HOME').ok, '맡긴 것은 넘김 표 검사를 통과 · 다른 PC 이름으론 거절', null);
  const n0 = J2.feedStale([{ id: 'sc_1', v: { sc: '1', rev6mAt: new Date(Date.now() - 10 * 864e5).toISOString() } }, { id: 'sc_2', v: { sc: '2', rev6mAt: new Date().toISOString() } }, { id: 'sc_3', v: { sc: '3', rev6mAt: null, rev6mTriedAt: new Date().toISOString() } }, { id: 'sc_996008', v: { sc: '996008' } }]);
  ok(n0 === 1 && J2.qLen('shopSum') >= 1, '판매자 목록에서 7일 넘게 안 본 곳만 차례(최근 본·최근 시도한·우리 숍은 뺌) — 운영 rev6mJob 고르기와 같음', n0);
  HAND = {}; ok(J2.feedStale([{ id: 'sc_4', v: { sc: '4' } }]) === 0, '넘기지 않았으면 목록으로 차례를 안 만듦');
  const HS = fs.readFileSync(path.join(L.ROOT, 'helper/readnow-col2-helper.js'), 'utf8');
  ok(/n \+= JOBS\.feedStale\(L\)/.test(HS) && /const hoShopWant = \(\) => \{ if \(!hoMine\('shopSum'\)\) return null;/.test(HS) && /rev6mAt: typeof d\.v\.rev6mAt === 'string'/.test(HS), '도우미: 웹앱이 준 판매자 목록(확인 시각 두 칸)으로 차례 · 🗣이 목록을 안 부탁하면 넘긴 숍 요약이 6시간마다 부탁');

  console.log('④ 묶음 보기');
  const jd = [T('LOGGER', 'logger', 'dynamic', true), { ...T('HOME', 'office', 'ext.lib', true), tasks: { 'ext.lib': { name: '정보나루', n: 35, same: 35, un: 0, pass: { can: true, why: '넘길 수 있음' } }, 'ext.kakao': { name: '카카오', n: 27, same: 26, un: 1, pass: { can: false, why: '표본 27/30 · 까닭 모를 다름 1' } } } }];
  const B = HOF.bundleView(jd, { jobs: { kpipa: { on: true, pc: 'HOME', at: new Date().toISOString() } } }); const by = Object.fromEntries(B.map((b) => [b.id, b])); const it = (b, k) => by[b].items.find((x) => x.k === k);
  ok(it('lg', 'dynamic').st === 'can' && it('lg', 'dynamic').pc === 'LOGGER' && it('lg', 'shopSum').st === 'shadow' && it('lg', 'bench').st === 'shadow' && /표본 없음/.test(it('lg', 'bench').why) && it('lg', 'metrics').st === 'block', '🌐 로거 묶음: 구매자 분포 넘길 수 있음(LOGGER) · 숍 요약 그림자 중 · 🎯 벤치마킹은 이제 길 있음(그림자 표본 없음) · 시장 지표는 막힘 + 까닭', by.lg.items);
  ok(it('ext', 'kpipa').st === 'on' && it('ext', 'ext.lib').st === 'can' && it('ext', 'ext.lib').pc === 'HOME' && it('ext', 'ext.kakao').st === 'shadow' && /까닭 모를 다름 1/.test(it('ext', 'ext.kakao').why) && it('ext', 'ext.ttb').st === 'block', '🔎 외부 묶음: KPIPA 넘김 · 정보나루 넘길 수 있음 · 카카오 그림자 중(까닭) · TTB 막힘', by.ext.items);
  ok(by.ext.can.some((x) => x.k === 'ext.lib' && x.pc === 'HOME') && by.ext.on.includes('kpipa') && by.lg.can.length === 1, "묶음마다 '넘길 수 있음' 목록(묶음 단추가 한 번에 넘김) · 넘긴 목록(묶음 되돌리기)", { ext: by.ext.can, lg: by.lg.can });
  const al = by.alr.items; ok(al.length === 22 && al.filter((x) => x.login).length === 20 && al.filter((x) => x.free).map((x) => x.k).join() === 'al.R20,al.R21' && al.every((x) => x.st === 'block') && /42FB/.test(al[0].why) && /W15/.test(al.find((x) => x.k === 'al.R20').why), '🟧 알라딘 읽기 22 = 로그인 필요 20(42FB · 정범님 결정 전) + 로그인 없이 2(매입가 조회·추천 판매가 — 쓰기의 앞 단계라 그 쓰기와 함께)', al.map((x) => x.k + ':' + (x.login ? 'L' : 'F')));
  const all = B.flatMap((b) => b.items.map((x) => x.k)); ok(new Set(all).size === all.length && all.length === 7 + 19 + 2 + 22, '묶음 4개 · 일 50가지가 겹치지 않음', all.length);

  /* ══ (11/12 handoff3) ⑤ 🎯 숍 목록 끝까지 · ⑥ 홀로 연결 판매자 목록 · ⑦ pubset 약속 0 판단 ══ */
  console.log('⑤ 🎯 숍 목록 끝까지 — 운영 benchFinish 글자 그대로');
  const { makeDb } = require('./fakefs-admin.js'); const BSRC0 = fs.readFileSync(path.join(L.ROOT, '../../src/readnow-collector.src.js'), 'utf8'); const REG = require('../../../readnow-registry.js');
  const BC = HOF.benchCode(BSRC0); ok(!BC.err && /async function benchFinish\(t, prog, st\)/.test(BC.code) && /const WRITER_SCHEMA = 6;/.test(BC.code), '운영 본체에서 benchFinish·WRITER_SCHEMA를 글자 그대로 떼어 냄(판 ' + BC.ver + ')', BC.err);
  ok(HOF.grab(BSRC0, 'benchFinish') === require('../helper/col2-lift.js').grab(BSRC0, 'benchFinish') && HOF.grab(BSRC0, 'benchLastPage') === require('../helper/col2-lift.js').grab(BSRC0, 'benchLastPage'), '규칙 파일의 떼어 내기(grab)가 번외 도우미 col2-lift.js와 같은 글자를 냄');
  const FN = new Function('return ' + BC.code)(); const FD = makeDb();
  const envOf = (P, sc) => ({ C: FD.C, db: FD.db, firebase: { firestore: { FieldValue: FD.FV } }, PC_NAME: '번외 LOGGER', W: () => ({ uploadedAt: FD.FV.serverTimestamp(), writerSchema: 6, writer: '번외 LOGGER' }), nowIso: () => new Date().toISOString(), log: () => {}, ui: () => {}, REG, CFG: {}, t: { sc, name: '가게' }, prog: P.prog, st: P.st });
  const row = (id, p, g, low, pg) => [id, p, g, '책' + id, null, null, 9000, low ? 1 : 0, pg || 1, 'U' + id, null, null];
  const run1 = { sc: '555', name: '가게', day: '2026-11-11', startedAt: '2026-11-11T01:00:00.000Z', lastPage: 2, pages: 2, items: [row('1', 1000, '상'), row('2', 2000, '중', 1), row('3', 3000, '상', 0, 2)], seenEnd: null };
  ok(HOF.benchBad('555', { run: run1 }) === '', '끝까지 읽은 회차(2쪽 · 3개)는 넘김 값 검사 통과');
  let P = HOF.benchProg(run1, {}); await FN(envOf(P, '555')); const st1 = FD.store.bench_state['555'];
  ok(st1 && st1.total === 3 && st1.complete === true && st1.chunks === 1 && st1.writer === '번외 LOGGER' && st1.writerSchema === 6 && FD.store.bench_days['555_2026-11-11'].base === true && Object.keys(FD.store.bench_items).length === 3, '첫 회차 = 운영처럼 처음부터 있던 것(base) · bench_state 조각 1 · 상품 기록 3 · 쓴 이 번외 LOGGER', st1);
  const run2 = { ...run1, day: '2026-11-12', startedAt: '2026-11-12T01:00:00.000Z', items: [row('1', 900, '상'), row('3', 3000, '상', 1, 2), row('4', 4000, '최상')], seenEnd: st1.endAt };
  P = HOF.benchProg(run2, st1); await FN(envOf(P, '555')); const d2 = FD.store.bench_days['555_2026-11-12'];
  ok(d2 && d2.add === 1 && d2.moved === 1 && d2.missOnce === 1 && d2.gone === 0 && d2.lowOn === 1 && d2.lowOff === 0 && FD.store.bench_items['555_1'].prices[0].p === 900 && FD.store.bench_items['555_4'].firstDay === '2026-11-12', "둘째 회차 = 운영 규칙 그대로: 새로 올림 1(4번) · 값 바뀜 1(1번 1,000→900) · '이번에 안 보임' 1(2번 — 하루 늦게 사라짐 확정) · 최저가 켜짐 1", d2);
  const run3 = { ...run2, day: '2026-11-13', startedAt: '2026-11-13T01:00:00.000Z', items: [row('1', 900, '상'), row('3', 3000, '상', 1, 2), row('4', 4000, '최상')], seenEnd: FD.store.bench_state['555'].endAt };
  P = HOF.benchProg(run3, FD.store.bench_state['555']); await FN(envOf(P, '555')); const d3 = FD.store.bench_days['555_2026-11-13'];
  ok(d3.gone === 1 && FD.store.bench_items['555_2'].goneDay === '2026-11-12' && FD.store.bench_items['555_2'].lowEvents.some((x) => x.gone), '셋째 회차: 두 번 안 보인 2번 = 사라짐 확정(사라진 날 = 처음 안 보인 날 · 최저가였던 것 기록)', d3);
  ok(/큰 숍/.test(HOF.benchBad('555', { run: { ...run1, lastPage: 41, pages: 41 } })) && /1쪽부터 끝 쪽까지/.test(HOF.benchBad('555', { run: { ...run1, pages: 1 } })) && /꼴이 다름/.test(HOF.benchBad('555', { run: { ...run1, items: [['x', 1]] } })) && /숍 번호/.test(HOF.benchBad('556', { run: run1 })) && /같은 상품/.test(HOF.benchBad('555', { run: { ...run1, items: [row('1', 1), row('1', 2)] } })) && HOF.benchBad('555', { claim: { on: true } }) === '',
    '넘김 값 거절: 큰 숍(40쪽 넘음)·끝까지 못 읽은 회차·줄 꼴·숍 번호·같은 상품 두 번 · 잡기 신호는 통과');
  const HD3 = { jobs: { bench: { on: true, pc: 'LOGGER', at: new Date().toISOString() } } };
  ok(HOF.writeOk(HD3, { job: 'bench', c: 'bench_state', id: '555', v: { run: run1 } }, 'LOGGER').ok && HOF.writeOk(HD3, { job: 'bench', c: 'prd_jobs', id: 'bclaim_555', v: { claim: { on: true } } }, 'LOGGER').ok && !HOF.writeOk(HD3, { job: 'bench', c: 'prd_jobs', id: 'other', v: { claim: { on: true } } }, 'LOGGER').ok && !HOF.writeOk(HD3, { job: 'bench', c: 'bench_items', id: '555', v: { run: run1 } }, 'LOGGER').ok && !HOF.writeOk(HD3, { job: 'bench', c: 'bench_state', id: '555', v: { run: run1 } }, 'HOME').ok, '넘김 표: bench_state 칸 · 맡은 PC(LOGGER)만');
  /* 견줌 */
  const chunk = (o) => ({ s: JSON.stringify(o) }); const ch = [chunk({ 1: [1000, '20261111', '상', 1, '책1', 0, 0], 2: [2000, '20261111', '중', 1, '책2', 1, 0], 9: [500, '20261101', '상', 1, '책9', 0, '20261110'] })];
  let cm = HOF.benchCmp([row('1', 1000, '상'), row('2', 2000, '중', 1)], ch, { opsEnd: '2026-11-12T01:00:00Z', myAt: '2026-11-12T01:20:00Z' });
  ok(cm.verdict === 'same' && cm.n === 2 && cm.opsN === 2 && cm.same === 2, "같음: 번호·값·등급·최저가 배지 모두 같음(운영 '안 보임' 표시 상품은 지금 목록에서 뺌)", cm);
  cm = HOF.benchCmp([row('1', 900, '상'), row('5', 100, '하')], ch, { opsEnd: '2026-11-12T01:00:00Z', myAt: '2026-11-12T06:00:00Z' });
  ok(cm.verdict === 'diff' && cm.reasons.join() === 'move' && cm.chg === 1 && cm.onlyMine === 1 && cm.onlyOps === 1 && cm.gapH === 5, "운영 회차와 5시간 떨어진 다름 = '때가 다름'(그사이 팔림·새로 올림·값 바꿈)", cm);
  cm = HOF.benchCmp([row('1', 900, '상'), row('2', 2000, '중', 1)], ch, { opsEnd: '2026-11-12T01:00:00Z', myAt: '2026-11-12T01:30:00Z' }); ok(cm.reasons.join() === 'diff', '1시간 안에 읽었는데 다르면 까닭 모를 다름(넘길 수 없음)', cm);
  ok(HOF.claimOk({ pc: 'MJ-MAIN', at: Date.now() - 60e3 }, 'LOGGER') === false && HOF.claimOk({ pc: 'MJ-MAIN', at: Date.now() - 5 * 60e3 }, 'LOGGER') && HOF.claimOk({ pc: 'col2-LOGGER', at: Date.now() }, 'LOGGER') && HOF.claimOk(null, 'LOGGER'), '잡기 = 운영 benchClaim과 같은 판단(남이 4분 안에 잡았으면 못 잡음 · 내 것은 이어 잡음)');
  const jdB = [{ d: '2026-11-12', pc: 'LOGGER', kind: 'logger', ver: '0.1.44', at: new Date().toISOString(), tasks: { benchFull: { name: '끝까지', n: 1, same: 1, un: 0, pass: { can: true } }, bench: { name: '첫 쪽', n: 60, same: 60, un: 0, pass: { can: true } } } }];
  let cB = HOF.candidates(jdB).find((x) => x.k === 'bench'); ok(cB && cB.pc === 'LOGGER' && cB.n === 1, "넘김 판정은 끝까지 읽기 그림자(benchFull)로만 — 첫 쪽 그림자(bench 60건)는 셈에 안 듦", cB);
  cB = HOF.candidates([{ ...jdB[0], ver: '0.1.43' }]).find((x) => x.k === 'bench'); ok(!cB || !cB.pc, '번외 0.1.44 아래 PC는 맡지 못함', cB);
  /* 번외 일 돌리기 — 끝까지 읽기 */
  const BFF = require('../helper/col2-benchfull.js'); const SB = {}; const recs = []; const ops3 = []; let HAND3 = false; const W3 = {};
  const pages = { 1: { rows: [{ id: '1', p: 1000, g: '상', t: '책1' }, { id: '2', p: 2000, g: '중', t: '책2', low: true }], last: 2 }, 2: { rows: [{ id: '3', p: 3000, g: '상', t: '책3' }, { id: '1', p: 1000, g: '상', t: '책1' }], last: 2 } };
  W3['app_settings/bench'] = { targets: [{ sc: '555', on: true }, { sc: '777', on: true }, { sc: '996008', on: true }, { sc: '888', on: false }] };
  W3['bench_state/555'] = { name: '가게', lastPage: 2, chunks: 1, endAt: new Date(Date.now() - 30 * 3600e3).toISOString() }; W3['bench_state/777'] = { name: '큰 가게', lastPage: 900, chunks: 30 }; W3['bench_chunk/555.0'] = chunk({ 1: [1000, '20261111', '상', 1, '책1', 0, 0], 2: [2000, '20261111', '중', 1, '책2', 1, 0], 3: [3000, '20261111', '상', 1, '책3', 0, 0] });
  const cx = { cfg: () => ({ on: true }), kind: () => 'logger', pace: { check: () => ({ ok: true }), take: async () => ({ ok: true }), ok() {}, fail() {} }, core: async () => ({ src: [] }), browser: async () => ({ readJob: async (u, pn) => { const pg = +(u.match(/page=(\d+)/) || [])[1]; return pn === 'L.benchPage' && /ViewRowsCount=48&SortOrder=6/.test(u) ? { ok: true, page: pages[pg] } : { ok: false }; } }), aladin: 'https://www.aladin.co.kr',
    want: (c, id) => (W3[c + '/' + id] ? { have: true, v: W3[c + '/' + id] } : { have: false }), handed: () => HAND3, opOut: (job, c, id, v) => { ops3.push({ job, c, id, v }); return true; }, beat: () => {}, note: () => {} };
  const BF1 = BFF.makeBenchFull({ ctx: cx, S: SB, save: () => {}, record: (t, a, id, v, rs, x) => recs.push({ k: t.k, id, v, rs, x }), own: () => ['996008'], now: () => Date.now() });
  for (let i = 0; i < 6; i++) await BF1.step();
  ok(recs.length === 1 && recs[0].k === 'benchFull' && recs[0].id === '555' && recs[0].v === 'same' && /상품 3개/.test(recs[0].x.why) && !ops3.length, '그림자: 작은 숍(555 · 2쪽)만 고름(큰 숍 777·우리 숍·꺼진 숍 뺌) · 2쪽 끝까지 · 같은 상품 두 번은 한 번 · 운영 목록과 같음 · 운영 칸에 안 씀', { recs, ops3 });
  ok((await BF1.step()) === null, '그림자는 하루 1곳(기본) — 그 뒤엔 다른 일에 차례');
  HAND3 = true; const SB2 = {}; const BF2 = BFF.makeBenchFull({ ctx: cx, S: SB2, save: () => {}, record: (t, a, id, v, rs, x) => recs.push({ k: t.k, id, v }), own: () => ['996008'], now: () => Date.now() }); for (let i = 0; i < 6; i++) await BF2.step();
  const cl = ops3.filter((o) => o.v.claim), rn = ops3.find((o) => o.v.run);
  ok(cl.length === 1 && cl[0].c === 'prd_jobs' && cl[0].id === 'bclaim_555' && cl[0].v.claim.on === true && rn && rn.c === 'bench_state' && rn.id === '555' && rn.v.run.items.length === 3 && rn.v.run.pages === 2 && rn.v.run.lastPage === 2 && rn.v.run.seenEnd === W3['bench_state/555'].endAt && HOF.benchBad('555', rn.v) === '',
    '넘긴 뒤: 운영 판매자 잡기 신호(prd_jobs/bclaim_555 — 회차와 다른 줄이라 서로 안 덮음)를 잡고 → 끝까지 읽은 회차(운영 prog.items 꼴)를 맡김(잡기는 쓴 쪽이 놓음) · 넘김 값 검사 통과', ops3.map((o) => [o.c, o.id, Object.keys(o.v), o.v.run ? [o.v.run.items.length, o.v.run.pages, o.v.run.lastPage, o.v.run.seenEnd, HOF.benchBad('555', o.v)] : null]));
  W3['bench_state/555'] = { ...W3['bench_state/555'], endAt: new Date().toISOString() }; const SB3 = {}; const BF3 = BFF.makeBenchFull({ ctx: cx, S: SB3, save: () => {}, record: () => {}, own: () => [], now: () => Date.now() }); ok((await BF3.step()) === null, '넘긴 뒤에도 운영이 20시간 안에 끝낸 숍은 안 읽음(운영 규칙)');
  /* 웹앱이 맡은 회차를 쓰기 전 확인(클라우드 benchW — 웹앱 c2HoBenchW와 같음) */
  const { makeSolo } = require('../../../cloud/col2solo.js'); const FS = makeDb(); const SRCm = { BSRC: async () => BSRC0, REG };
  const API = makeSolo({ db: FS.db, C: FS.C, FV: FS.FV, log: () => {}, mods: async () => ({ HOF, ...SRCm }) });
  await FS.C('bench_state').doc('555').set({ endAt: '2026-11-11T23:00:00.000Z', name: '가게' }); await FS.C('app_settings').doc('bench').set({ targets: [] });
  let r3 = await API.benchW('bclaim_555', { claim: { on: true } }, 'LOGGER', HOF); ok(r3 === true && FS.store.prd_jobs.bclaim_555.pc === 'col2-LOGGER', '클라우드: 잡기 신호 = prd_jobs/bclaim_<숍>(운영과 같은 문서 · 번외 이름 col2-LOGGER)', FS.store.prd_jobs);
  await FS.C('prd_jobs').doc('bclaim_556').set({ pc: 'MJ-MAIN', at: Date.now() }); r3 = await API.benchW('bclaim_556', { claim: { on: true } }, 'LOGGER', HOF); ok(/읽는 중/.test(r3), '운영 PC가 4분 안에 잡은 숍은 못 잡음', r3);
  r3 = await API.benchW('555', { run: { ...run1, day: '2026-11-12', startedAt: '2026-11-12T01:00:00.000Z', seenEnd: '2026-11-11T23:00:00.000Z' } }, 'LOGGER', HOF);
  ok(r3 === true && FS.store.bench_state['555'].total === 3 && FS.store.bench_state['555'].writer === '번외 LOGGER' && FS.store.prd_jobs.bclaim_555.pc === null, '클라우드: 회차를 운영 benchFinish로 씀 → 운영 benchOneT는 writer가 다른 PC라 이번 실행에서 건너뜀 · 잡기 놓음', FS.store.bench_state['555']);
  r3 = await API.benchW('555', { run: { ...run1, day: '2026-11-12', startedAt: '2026-11-12T01:00:00.000Z', seenEnd: '2026-11-11T23:00:00.000Z' } }, 'LOGGER', HOF); ok(/그사이/.test(r3), '그사이 운영(또는 다른 회차)이 끝냈으면(본 회차 끝과 다름) 쓰지 않음', r3);
  const CS = fs.readFileSync(path.join(L.ROOT, '../../src/readnow-collector.src.js'), 'utf8'); ok(/if \(d && d\.pc && d\.pc !== PC_ID && Date\.now\(\) - \(d\.at \|\| 0\) < 4 \* 60e3\) \{ who = d\.name \|\| '다른 PC'; return; \}/.test(CS) && /st0\.endAt && Date\.parse\(st0\.endAt\) > BENCH_T0 && st0\.writer && st0\.writer !== PC_NAME/.test(CS), '운영 원문에 나눠 읽기 규칙(잡기 4분 · 이번 실행 중 다른 PC가 끝냄)이 그대로 있음 — 어긋나면 이 시험이 알림');

  console.log('⑥ 홀로 연결 판매자 목록(로거)');
  const FL = makeDb(); await FL.C('sellers').doc('sc_1').set({ sc: '1', name: '가', totalReviewCount: '1,234', rev6mAt: '2026-11-01T00:00:00Z', bizInfo: { tel: '010-0000-0000' }, contactNote: 'x' }); await FL.C('sellers').doc('sc_996008').set({ sc: '996008', name: '우리' }); await FL.C('sellers').doc('zz').set({ sc: '5' });
  const AL = makeSolo({ db: FL.db, C: FL.C, FV: FL.FV, log: () => {}, mods: async () => ({ HOF }) }); const ls = await AL.getLists([{ c: 'sellers', n: 10 }, { c: 'prd_market_nobook', n: 5 }]);
  ok(ls && ls.sellers.length === 3 && !ls.prd_market_nobook && JSON.stringify(ls.sellers[0].v) === JSON.stringify({ sc: '1', name: '가', n: 1234, rev6mAt: '2026-11-01T00:00:00Z', rev6mTriedAt: null }) && ls.sellers[1].v === null && ls.sellers[2].v === null, '클라우드: 판매자 목록 = 숍 번호·이름·평가 수·확인 시각 두 칸만(연락처·사업자 정보 없음) · 우리 숍·꼴 아닌 문서는 v:null · 우리 상품 목록은 안 줌', ls);
  const l2 = await AL.getLists([{ c: 'sellers', n: 1, after: 'sc_1' }]); ok(l2.sellers.length === 1 && l2.sellers[0].id === 'sc_996008', '이어 받기(after)', l2);
  const HS2 = fs.readFileSync(path.join(L.ROOT, 'helper/readnow-col2-helper.js'), 'utf8'); ok(/const lists = soloLists\(\);/.test(HS2) && /a\.lists = \{ sellers: j\.lists\.sellers \}/.test(HS2) && /r\.lists = r\.lists\.filter\(\(w\) => !\(w && w\.c === 'sellers'\)\)/.test(HS2), '도우미: 홀로 연결에 판매자 목록을 부탁·받음 · 살아 있으면 웹앱 길에는 안 냄(한 길로만)');

  console.log('⑦ 📦 pubset 약속 0 판단');
  ok(HOF.PUBSET.lg === false && HOF.PUBSET.cols.includes('prd_listings') && HOF.PUBSET.keys.join() === 'product,metrics,usedPage' && /사무실 PC 한 대/.test(HOF.BLOCK.product) && /약속 0/.test(HOF.BLOCK.metrics), '📘·📈·🏷 = 한 묶음 · 우리 상품 연결(prd_listings)을 써서 사무실 PC 한 대(로거 칸과 섞지 않음)');

  console.log('⑧ (handoff4) 📦 상품 화면 묶음 — 운영 refreshOne0 떼어 부르기');
  { const RP = require('../../../readnow-products-core.js'); const SRCP = fs.readFileSync(path.join(L.ROOT, '../../src/readnow-collector.src.js'), 'utf8'); const PB = HOF.pubCode(SRCP);
    ok(!PB.err && PB.len > 10000 && HOF.PUB_NAMES.every((n) => HOF.grab(SRCP, n)), '운영 본체에서 refreshOne0와 부르는 이름 10가지를 글자 그대로 꺼냄', PB.err);
    const FP = makeDb(); const old = new Date(Date.now() - 9 * 864e5).toISOString();
    await FP.C('prd_books').doc('b1').set({ bookId: 'b1', keyScheme: 'aladinItemId', aladinItemId: '111', isbn13: '9791100000017', title: '옛 제목', productUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=9791100000017', ids: ['isbn13_9791100000017'] });
    await FP.C('prd_listings').doc('aladin_U9').set({ bookId: 'b1', usedCode: 'U9', active: true, isbn13: '9791100000017', title: '책', mediaType: 'book' });
    await FP.C('prd_book_metrics').doc('b1').set({ bookId: 'b1', priceSales: 9000, lastCheckedAt: old, activeRanks: ['국내도서 > 소설 50위'], usedFirstPage: [{ p: 1 }] });
    await FP.C('prd_rank_periods').doc('r0').set({ bookId: 'b1', title: '국내도서 > 소설 50위', firstSeenAt: old, lastSeenAt: old, endedSeenAt: null });
    const pageP = { aladinItemId: '111', title: '새 책', isbn13: '9791100000017', fetchedFrom: 'aladin', priceList: 12000, priceSales: 10800, salesPoint: 345, rating: 9.2, commentCount: 3, reviewCount: 1, availability: 'onSale', ranks: ['국내도서 > 에세이 3위'], categories: [], contributors: [{ name: '가', role: '지은이' }], images: { front: null } };
    const usedP = { usedTotal: 4, tabs: { all: 4 }, mins: { all: 3000 }, buyback: null, listings: [{ p: 3000, sc: '9' }], lastPage: 1 };
    const pub = { itemId: '111', page: pageP, used: usedP }; ok(!HOF.pubBad('b1', { pub }) && /중고 첫 쪽/.test(HOF.pubBad('b1', { pub: { ...pub, used: null } })) && /번호가 다름/.test(HOF.pubBad('b1', { pub: { ...pub, itemId: '112' } })), '넘김 값 검사(두 장 모두 · 같은 상품 번호)');
    const fn = new Function('return ' + PB.code)(); const by = '번외 JS-MAIN'; const w0 = FP.writes.length;
    await fn({ C: FP.C, db: FP.db, firebase: { firestore: { FieldValue: FP.FV } }, PC_NAME: by, W: () => ({ writer: by, writerSchema: 6 }), nowIso: () => new Date().toISOString(), log: () => {}, SET: { keyScheme: 'aladinItemId', dynamicParts: false, recheckDays: 7 }, P: RP, X: null, l: (await FP.C('prd_listings').doc('aladin_U9').get()).data(), bookId: 'b1', finalUrl: null, pub });
    const st = FP.store; const mm = st.prd_book_metrics.b1; const chg = Object.values(st.prd_metric_changes || {}); const rp = Object.values(st.prd_rank_periods || {});
    ok(mm.priceSales === 10800 && mm.salesPoint === 345 && mm.usedTotal === 4 && mm.checkedBy === by && Date.parse(mm.lastCheckedAt) > Date.parse(old) && mm.usedAt && JSON.stringify(mm.usedFirstPage) === JSON.stringify(usedP.listings) && mm.writer === by, '📈·🏷 prd_book_metrics: 운영과 같은 칸(시장 지표·중고 첫 쪽·확인 시각·확인한 PC=번외 JS-MAIN)', mm);
    ok(chg.some((c) => c.changes && c.changes.priceSales && c.changes.priceSales.from === 9000) && chg.some((c) => c.kind === 'usedListings') && chg.some((c) => c.kind === 'bookInfo' && c.chg && c.chg.title), '바뀐 값은 운영처럼 prd_metric_changes(값 · 중고 첫 쪽 · 도서 칸 다르게 보임)', chg.map((c) => c.kind || 'm'));
    ok(rp.some((r) => r.title === '국내도서 > 에세이 3위' && r.endedSeenAt === null) && st.prd_rank_periods.r0.endedSeenAt, '순위 기간: 새 순위 시작 · 빠진 순위 끝(운영 rankTransitions 그대로)', rp);
    ok(st.prd_books.b1.title === '옛 제목' && st.prd_books.b1.lastFetchedAt && st.prd_books.b1.productUrl === 'https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=9791100000017' && !FP.writes.slice(w0).some((w) => w.c === 'prd_listings'), '📘 고정 칸은 처음 값 지킴 · 상품 화면 주소 = 운영이 부른 ISBN 주소 · 이어진 책·종류가 같으면 우리 상품 기록은 안 씀(운영과 같음)', JSON.stringify({ b: st.prd_books.b1, w: FP.writes.slice(w0).filter((w) => w.c === 'prd_listings') }));
    ok(HOF.pubDue({ lastCheckedAt: old }, Date.now(), 7) && !HOF.pubDue({ lastCheckedAt: new Date().toISOString() }, Date.now(), 7) && HOF.pubListing([{ id: 'b', v: { active: false, usedCode: 'U1' } }, { id: 'a', v: { active: true, usedCode: 'U2' } }]).id === 'a' && !HOF.pubListing([{ id: 'x', v: { active: true } }]), '운영 market 규칙(주기 7일) · 우리 상품 연결 = 판매 중·U코드');
    ok(/if \(cutoff\) for \(const \[bid\] of \[\.\.\.byBook\]\) \{ const c = checked\.get\(bid\); if \(c && c > cutoff\) byBook\.delete\(bid\); \}/.test(SRCP) && /const fresh = async \(bid\) => \{ if \(!bid \|\| !since\) return false; try \{ const x = \(await C\('prd_book_metrics'\)\.doc\(bid\)\.get\(\)\)\.data\(\); return \(Date\.parse\(\(x && x\.lastCheckedAt\) \|\| 0\) \|\| 0\) >= since;/.test(SRCP), '운영 원문: 시장 지표(market·그룹)가 확인 시각이 주기 안인 책을 건너뜀 — 번외가 먼저 쓴 책은 운영이 다시 안 읽음(운영 본문·머리 그대로)');
    ok(!HOF.writeOk({ jobs: { product: { on: true, pc: 'JS-MAIN', at: new Date().toISOString() } } }, { job: 'product', c: 'prd_book_metrics', id: 'b1', v: { pub } }, 'JS-MAIN').ok && HOF.writeOk({ jobs: { product: { on: true, pc: 'JS-MAIN', at: new Date().toISOString() } } }, { job: 'product', c: 'prd_book_metrics', id: 'b1', v: { pub } }, 'JS-MAIN', { web: true }).ok, '클라우드 길(writeOk 웹앱 표시 없음)은 거절 · 웹앱 길만');
    /* 일 돌리기 — JS-MAIN만 · 넘겼으면 주기 밖 책만 맡김(web) */
    const opsP = []; let HP = {}; const DBP = { 'prd_book_metrics/b1': { priceSales: 10800, salesPoint: 345, lastCheckedAt: old, usedTotal: 4, usedTabs: { all: 4 }, usedMins: { all: 3000 }, buyback: null }, 'prd_book_metrics/b2': { priceSales: 1, lastCheckedAt: new Date().toISOString() } };
    const brP = { readJob: async (u, pn) => (pn === 'P.parseUsedPage' ? { ok: true, page: JSON.parse(JSON.stringify(usedP)) } : { ok: false }), tabJob: async () => ({ ok: false }), mainJob: async () => ({ ok: false }) };
    const mk = (pc) => makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2pub-')), cfg: () => ({ on: true, off: TK.TASKS.map((t) => t.k).filter((k) => k !== 'pubset'), pass: { minN: 1, waitMin: 5 } }), kind: () => 'office', pc: () => pc, browser: async () => brP,
      want: (cc, id) => { const k = cc + '/' + id; return k in DBP ? { have: true, v: DBP[k] } : null; }, handed: (k) => !!HP[k], opOut: (job, cc, id, v, x) => { opsP.push({ job, c: cc, id, v, x }); return true; } });
    const JH = mk('HOME'); ok(!JH.pubAfter({ itemId: '111', bookId: 'b1' }, pageP, { verdict: 'same', rows: [] }), 'HOME(묶음 맡을 PC 아님)은 중고 첫 쪽을 더 읽지 않음(하루 몫 아낌)');
    HP = { product: true }; const JM = mk('JS-MAIN'); ok(JM.pubAfter({ itemId: '111', bookId: 'b1' }, pageP, { verdict: 'same', rows: [] }) && JM.pubAfter({ itemId: '222', bookId: 'b2' }, { ...pageP, aladinItemId: '222', priceSales: 1 }, { verdict: 'same', rows: [] }), 'JS-MAIN: 📘 읽은 책마다 📦 차례');
    for (let i = 0; i < 6; i++) await JM.step(); const sP = JM.summary().pubset || {};
    ok(sP.n === 2 && sP.un === 0 && sP.pass.can && opsP.length === 1 && opsP[0].id === 'b1' && opsP[0].x && opsP[0].x.web && opsP[0].v.pub.used.listings.length === 1 && opsP[0].v.pub.page.title === '새 책', '📦 그림자 2권 까닭 모를 다름 0(도서 칸·시장 지표·중고 첫 쪽 · 운영 칸 빔은 까닭 있음) · 넘긴 뒤 주기 밖 책(b1)만 웹앱 쓰기로 맡김 · 주기 안 책(b2)은 운영처럼 건너뜀', JSON.stringify({ sP, opsP: opsP.map((o) => o.id) }));
    const JM2 = mk('JS-MAIN'); HP = {}; JM2.pubAfter({ itemId: '111', bookId: 'b1' }, pageP, { verdict: 'diff', rows: [{ f: 'title', k: 'diff' }] }); for (let i = 0; i < 4; i++) await JM2.step(); const s2 = JM2.summary().pubset || {};
    ok(s2.diff === 1 && s2.un === 1 && opsP.length === 1, '📘 도서 칸이 까닭 모를 다름이면 묶음도 다름(넘길 수 있음 막힘) · 안 넘겼으면 맡기지 않음', s2);
    const jdP = [{ d: '2026-11-12', pc: 'JS-MAIN', kind: 'office', ver: '0.1.46', at: new Date().toISOString(), tasks: { pubset: { name: '📦', n: 40, same: 40, un: 0, pass: { can: true } }, product: { name: '📘', n: 40, same: 40, un: 0, pass: { can: true } } } }, { d: '2026-11-12', pc: 'LOGGER', kind: 'logger', ver: '0.1.46', at: new Date().toISOString(), tasks: { pubset: { name: '📦', n: 40, same: 40, un: 0, pass: { can: true } } } }];
    const cP = HOF.candidates(jdP).find((x) => x.k === 'product'); ok(cP && cP.pc === 'JS-MAIN' && !HOF.candidates([jdP[0]].map((j) => ({ ...j, tasks: { product: j.tasks.product } }))).some((x) => x.k === 'product'), "넘길 수 있음 = 📦 묶음 그림자(사무실 PC)만 — 📘만 같음으로는 안 됨 · 로거 표본은 안 셈(약속 0)", cP);
    const bP = HOF.bundleView(jdP, {}).find((b) => b.id === 'pub').items.find((x) => x.k === 'product'); ok(bP.st === 'can' && bP.pc === 'JS-MAIN', "⚙ 🔀 📘 묶음: 📦 상품 화면 묶음 '넘길 수 있음'(JS-MAIN)", bP); }

  console.log('⑨ (handoff4) ⚖ 그림자 하루 몫 나누기(로거 400장)');
  { let dayN = 0; const H0 = new Date(Date.now() + 9 * 3600e3).getUTCHours(); const paceQ = { check: () => (dayN >= 400 ? { ok: false, why: '하루 400장까지', retryMs: null } : { ok: true, waitMs: 0 }), take: async () => { if (dayN >= 400) return { ok: false, why: '하루' }; dayN++; return { ok: true }; }, ok() {}, fail() {}, state: () => ({ dayN, dayCap: 400 }) };
    const brQ = { readJob: async () => ({ ok: true, page: { priceSales: 1 } }), tabJob: async () => ({ ok: true, page: { dynamicLoaded: false } }), mainJob: async () => ({ ok: false }) };
    const JQ = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2q-')), cfg: () => ({ on: true, off: ['bench', 'benchFull', 'survey', 'shopSum'], pass: { minN: 30, waitMin: 5 } }), kind: () => 'logger', pc: () => 'LOGGER', pace: paceQ, browser: async () => brQ, want: () => ({ have: true, v: {} }), handed: () => false, opOut: () => false, voice: null });
    const Q0 = JQ.qPlan(); ok(Q0.cap === 400 && Q0.jobs.metrics.need === 30 && Q0.jobs.dynamic.need === 90 && Q0.jobs.usedPage.need === 30, '먼저 몫 = 넘길 수 있음 판정에 필요한 만큼(표본 30 × 장 수 · 👥 3장)', Q0.jobs);
    const items = []; for (let i = 0; i < 300; i++) items.push({ itemId: String(1000 + i), bookId: 'q' + i, prod: {} }); JQ.feedBooks(items);
    for (let i = 0; i < 260 && dayN < 400; i++) await JQ.step(); const Q1 = JQ.qPlan(); const u = (k) => Q1.jobs[k].used;
    ok(u('metrics') >= 30 && u('usedPage') >= 30 && u('dynamic') >= 90 && Object.values(Q1.jobs).every((x) => x.used <= Math.max(x.share, x.need) + 3) && Q1.used <= Q1.lim + 3, `일마다 먼저 몫을 다 채움 · 자기 몫(먼저 몫 + 하루 지난 만큼 남는 몫)을 넘지 않음 · 전체는 하루 지난 만큼까지(지금 ${H0}시 → ${Q1.lim}/400장)`, Q1);
    ok(H0 >= 23 || dayN < 400, '이른 시각엔 하루 400장을 다 쓰지 않음(남는 몫은 하루가 지난 만큼만 풀림)', { dayN, H0 }); }

  L.done('t_handoff');
})();
