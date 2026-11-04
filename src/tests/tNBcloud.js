// tNBcloud — 정범님 11/04 🆕 미등록 상품 새책 찾기: 클라우드 nbFindRun을 떼어 가짜 Firestore + 브라우저(가짜 알라딘 검색·상품 화면)로 시험
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const { chromium } = require('playwright');
const src = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const code = src.slice(src.indexOf('/* NBFIND-START'), src.indexOf('/* NBFIND-END */'));
const core = fs.readFileSync(path.join(__dirname, '../readnow-products-core.js'), 'utf8');
const RP = require(path.join(__dirname, '../readnow-products-core.js'));
const store = { prd_newbook: {}, app_settings: {}, shp_cmds: {} };
const DEL = { __del: 1 }; const FV = { serverTimestamp: () => 'TS', arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => DEL };
const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x === DEL) delete o[k]; else if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__inc != null) o[k] = (+o[k] || 0) + x.__inc; else if (x && typeof x === 'object' && !Array.isArray(x)) o[k] = merge(o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? o[k] : {}, x); else o[k] = x; } return o; };
const ref = (c, id) => ({ id, get: async () => ({ exists: !!store[c][id], data: () => store[c][id] }), set: async (v, o) => { store[c][id] = o && o.merge ? merge(store[c][id], v) : merge({}, v); } });
const C = (c) => { store[c] = store[c] || {}; return { doc: (id) => ref(c, id) }; };
const reqs = [];
const box = (id, t, used) => `<div class="ss_book_box" itemid="${id}"><a class="bo3" href="/shop/wproduct.aspx?ItemId=${id}">${t}</a>${used ? '[중고]' : ''}</div>`;
const prod = (id, t, a, pb, d, sold) => `<html><head><title>${t} | 알라딘</title><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}"></head><body><div class="Ere_prod_titlewrap"><ul><li class="tlist"><span class="Ere_bo_title">${t}</span></li><li class="Ere_sub2_title"><a href="/Search/wSearchResult.aspx?AuthorSearch=@1">${a}</a> (지은이) | <a href="/x?PublisherSearch=${pb}@2">${pb}</a> | ${d}</li></ul></div>${sold ? `<div class="Ere_soldout_info">${sold}</div>` : ''}</body></html>`;
const SEARCH = { '옛 시집 하나': [box('111', '옛 시집 하나'), box('222', '옛 시집 하나'), box('900', '옛 시집 하나', true)], '사라진 책': [box('555', '전혀 다른 책 이름')], '애매한 책': [box('333', '애매한 책')] };
const PROD = { 4001: prod('4001', '옛 시집 하나', '손님A', '어느출판', '1999-03-01'), 111: prod('111', '옛 시집 하나', '손님A', '어느출판', '1999-03-01', '절판 — 출판사 사정'), 222: prod('222', '옛 시집 하나', '손님A', '어느출판', '2015-05-01'), 333: prod('333', '애매한 책', '누군가', '어딘가', '2001-01-01'), 4003: '<html><head><title>알라딘</title></head><body></body></html>', 777: prod('777', '사람이 고른 책', '아무개', '어느곳', '2010-01-01') };
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); let blockAll = false; const p = { evaluate: (fn, ...a) => pg.evaluate(`(${fn.toString()})(...${JSON.stringify(a)})`) }; /* 클라우드(puppeteer)처럼 인자 여럿 */
  await pg.route('**/*', (r) => { const u = new URL(r.request().url()); reqs.push(u.pathname + u.search); if (blockAll) return r.fulfill({ status: 429, body: 'too many requests' });
    if (/wsearchresult/i.test(u.pathname)) { const w = u.searchParams.get('SearchWord'); return r.fulfill({ contentType: 'text/html', body: `<html><head><title>알라딘 검색</title></head><body>${(SEARCH[w] || []).join('')}</body></html>` }); }
    if (/wproduct/i.test(u.pathname)) { const id = u.searchParams.get('ItemId'); return r.fulfill({ contentType: 'text/html', body: PROD[id] || '<html><head><title>알라딘</title></head><body></body></html>' }); }
    return r.fulfill({ contentType: 'text/html', body: '<html><body>ok</body></html>' }); });
  await pg.goto('http://aladin.test/'); await pg.addScriptTag({ content: core });
  const logs = []; const ctx = { C, FV, W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), log: (...a) => logs.push(a.join(' ')), sleep: async () => {}, Date, Math, String, JSON, Number, Promise, Infinity, isFinite, Set, Map, Object, Array, console, URLSearchParams };
  vm.runInNewContext(code + '\nthis.nbFindRun = nbFindRun; this.NB = NB;', ctx);
  store.app_settings.nb_find = { cfg: { gapMin: 0, gapMax: 0, nightFrom: 24, nightTo: 0 }, pend: { aladin_U4001: 'x', aladin_U4002: 'x', aladin_U4003: 'x' } };
  const items = [{ k: 'aladin_U4001', lid: '4001', t: '옛 시집 하나' }, { k: 'aladin_U4002', lid: '4002', t: '사라진 책' }, { k: 'aladin_U4003', lid: '4003', t: '애매한 책' }];
  const cref = ref('shp_cmds', 'c1'); store.shp_cmds.c1 = { type: 'nbFind', items, status: 'running' };
  await ctx.nbFindRun(p, cref, store.shp_cmds.c1, Date.now() + 120000);
  const N = store.prd_newbook; const c1 = store.shp_cmds.c1;
  let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
  ok(N.aladin_U4001 && N.aladin_U4001.st === 'found' && N.aladin_U4001.nb.itemId === '111' && N.aladin_U4001.nb.av === '절판', "같은 책(제목·지은이·출판사·출간 연도) 새상품 1개 → found · 그 화면 상태 '절판' " + JSON.stringify(N.aladin_U4001 && N.aladin_U4001.nb));
  ok(N.aladin_U4001 && N.aladin_U4001.our && N.aladin_U4001.our.pb === '어느출판' && N.aladin_U4001.our.src === 'page', '우리 정보를 모르면 우리 상품 화면(공개)에서 지은이·출판사·연도를 읽음');
  ok(N.aladin_U4001 && N.aladin_U4001.cands.some((c) => c.itemId === '222' && c.v === 'diff') && !N.aladin_U4001.cands.some((c) => c.itemId === '900'), '출간 연도가 다른 판은 다른 책 · [중고] 후보는 뺌');
  ok(N.aladin_U4002 && N.aladin_U4002.st === 'none' && N.aladin_U4002.q === '사라진 책' && N.aladin_U4002.at, "제목이 맞는 새상품이 없으면 none(웹앱 '절판 가능성 높음(추정)') · 검색어·시각 남김");
  ok(N.aladin_U4003 && N.aladin_U4003.st === 'unsure', '우리 정보가 없어 견줄 수 없으면 모름(unsure) ' + (N.aladin_U4003 && N.aladin_U4003.why));
  ok(c1.status === 'done' && Object.keys(store.app_settings.nb_find.pend || {}).length === 0 && store.app_settings.nb_find.cnt && Object.values(store.app_settings.nb_find.cnt)[0] === 3, '끝나면 done · pend 지움 · 하루 센 수 3');
  ok(reqs.every((u) => !/login|scm/i.test(u)), '로그인·샵매니저 화면은 열지 않음(공개 화면만)');
  ok((N.aladin_U4001.hist || []).length === 1, '결과가 바뀔 때만 기록 한 줄');
  // 다시: 찾아 둔 새책은 다시 찾지 않고 그 화면 1장만 · 사람이 뺀 번호는 고르지 않음 · 사람이 고른 번호
  reqs.length = 0; PROD[111] = prod('111', '옛 시집 하나', '손님A', '어느출판', '1999-03-01'); store.shp_cmds.c2 = { type: 'nbFind', items: [items[0]], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c2'), store.shp_cmds.c2, Date.now() + 120000);
  ok(reqs.filter((u) => /wsearchresult/i.test(u)).length === 0 && reqs.filter((u) => /ItemId=111/.test(u)).length === 1 && N.aladin_U4001.nb.av === 'onSale' && N.aladin_U4001.hist.length === 2, '찾아 둔 새책은 상태만 다시 읽음(검색 안 함) · 절판→판매 바뀜 기록 ' + reqs.join(','));
  N.aladin_U4001.rej = ['111']; store.shp_cmds.c3 = { type: 'nbFind', items: [{ ...items[0], full: true }], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c3'), store.shp_cmds.c3, Date.now() + 120000);
  ok(N.aladin_U4001.st !== 'found' && N.aladin_U4001.nbOld && N.aladin_U4001.nbOld.itemId === '111' && N.aladin_U4001.cands.some((c) => c.itemId === '111' && c.rej), "사람이 뺀 번호(rej)는 다시 고르지 않음 · 예전 연결은 nbOld로 " + N.aladin_U4001.st);
  store.shp_cmds.c4 = { type: 'nbFind', items: [{ ...items[2], pick: '777' }], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c4'), store.shp_cmds.c4, Date.now() + 120000);
  ok(N.aladin_U4003.st === 'found' && N.aladin_U4003.nb.itemId === '777' && N.aladin_U4003.nb.how === 'pick', '사람이 고른 번호(pick)는 그 새책으로');
  // 하루 몫 · 막힘 · 밤
  store.app_settings.nb_find.cfg.dayCap = 3; store.app_settings.nb_find.cnt = { [new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)]: 3 }; store.shp_cmds.c5 = { type: 'nbFind', items: [items[1]], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c5'), store.shp_cmds.c5, Date.now() + 120000);
  ok(store.shp_cmds.c5.status === 'queued' && store.shp_cmds.c5.notBefore && /오늘 몫/.test(store.shp_cmds.c5.waitMsg), '하루 몫을 다 쓰면 대기 · 다음 날 아침으로 notBefore');
  store.shp_cmds.c6 = { type: 'nbFind', items: [items[1]], status: 'running', manual: true };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c6'), store.shp_cmds.c6, Date.now() + 120000);
  ok(store.shp_cmds.c6.status === 'done', '사람이 누른 것(manual)은 하루 몫과 상관없이');
  store.app_settings.nb_find.cnt = {}; blockAll = true; store.shp_cmds.c7 = { type: 'nbFind', items: [items[1], items[2]], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c7'), store.shp_cmds.c7, Date.now() + 120000);
  ok(store.shp_cmds.c7.status === 'queued' && /막음/.test(store.shp_cmds.c7.waitMsg || '') && ctx.NB.block && N.aladin_U4002.st === 'none', '알라딘이 막으면(429) 그날은 멈춤 · 결과를 덮지 않음 ' + store.shp_cmds.c7.waitMsg);
  blockAll = false; ctx.NB.block = null; store.app_settings.nb_find.cfg.nightFrom = 0; store.app_settings.nb_find.cfg.nightTo = 0; store.shp_cmds.c8 = { type: 'nbFind', items: [items[1]], status: 'running' };
  await ctx.nbFindRun(p, ref('shp_cmds', 'c8'), store.shp_cmds.c8, Date.now() + 120000);
  ok(store.shp_cmds.c8.status === 'queued' && /밤/.test(store.shp_cmds.c8.waitMsg || ''), '밤 시간엔 쉼(설정)');
  // 공용 판단 함수
  ok(RP.newBookJudge({ t: '역사' }, { title: '역사의 연구' }).v === 'diff' && RP.newBookJudge({ t: '한국사론 1', pb: '국사' }, { title: '한국사론 10', publisher: '국사' }).v === 'diff' && RP.newBookJudge({ t: '사피엔스 : 부제', a: '유발 하라리 지음', pb: '(주)김영사' }, { title: '사피엔스', contributors: [{ name: '유발 하라리' }], publisher: '김영사' }).v === 'same', '같은 책 판단: 짧은 제목·권 번호 다름은 다른 책 · 역할 말·(주) 떼고 견줌');
  await b.close(); console.log(bad ? `❌ tNBcloud 실패 ${bad}` : '✓ tNBcloud 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
