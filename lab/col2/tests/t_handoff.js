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
  ok(it('lg', 'dynamic').st === 'can' && it('lg', 'dynamic').pc === 'LOGGER' && it('lg', 'shopSum').st === 'shadow' && it('lg', 'bench').st === 'block' && /끝까지 읽기/.test(it('lg', 'bench').why) && it('lg', 'metrics').st === 'block', '🌐 로거 묶음: 구매자 분포 넘길 수 있음(LOGGER) · 숍 요약 그림자 중 · 벤치마킹·시장 지표는 막힘 + 까닭', by.lg.items);
  ok(it('ext', 'kpipa').st === 'on' && it('ext', 'ext.lib').st === 'can' && it('ext', 'ext.lib').pc === 'HOME' && it('ext', 'ext.kakao').st === 'shadow' && /까닭 모를 다름 1/.test(it('ext', 'ext.kakao').why) && it('ext', 'ext.ttb').st === 'block', '🔎 외부 묶음: KPIPA 넘김 · 정보나루 넘길 수 있음 · 카카오 그림자 중(까닭) · TTB 막힘', by.ext.items);
  ok(by.ext.can.some((x) => x.k === 'ext.lib' && x.pc === 'HOME') && by.ext.on.includes('kpipa') && by.lg.can.length === 1, "묶음마다 '넘길 수 있음' 목록(묶음 단추가 한 번에 넘김) · 넘긴 목록(묶음 되돌리기)", { ext: by.ext.can, lg: by.lg.can });
  const al = by.alr.items; ok(al.length === 22 && al.filter((x) => x.login).length === 20 && al.filter((x) => x.free).map((x) => x.k).join() === 'al.R20,al.R21' && al.every((x) => x.st === 'block') && /42FB/.test(al[0].why) && /W15/.test(al.find((x) => x.k === 'al.R20').why), '🟧 알라딘 읽기 22 = 로그인 필요 20(42FB · 정범님 결정 전) + 로그인 없이 2(매입가 조회·추천 판매가 — 쓰기의 앞 단계라 그 쓰기와 함께)', al.map((x) => x.k + ':' + (x.login ? 'L' : 'F')));
  const all = B.flatMap((b) => b.items.map((x) => x.k)); ok(new Set(all).size === all.length && all.length === 7 + 19 + 2 + 22, '묶음 4개 · 일 50가지가 겹치지 않음', all.length);
  L.done('t_handoff');
})();
